/* =====================================================================
 * Live Earth 2.0 · le-starlink.js
 * LE.layers.starlink：星链卫星电影级渲染
 *  数据：CelesTrak 实时 TLE（8 秒超时）→ 离线样本 window.STARLINK_LITE_TLE；satellite.js SGP4 推算
 *  画面三层：
 *   1) 光点：太阳照到的卫星发亮，进入地球阴影的卫星变暗（真实物理），偶发太阳能板“闪光”
 *   2) 尾迹：沿速度方向拉出的渐隐光迹，“卫星列车”自然显现
 *   3) 3D 模型：镜头拉近后显示平板式卫星本体 + 双太阳翼（InstancedMesh，模型放大显示）
 *  性能：SGP4 推算分帧进行（每帧只算一部分），帧间用速度外推保证平滑运动。
 * ===================================================================== */
(function () {
  'use strict';
  var LE = window.LE, U = LE.util, C = LE.config, S;
  LE.layers = LE.layers || {};

  var SL = (LE.layers.starlink = {
    sats: [], live: false, visible: true, trails: true, closeUp: false,
    MODEL_DIST: 2.2,      // 相机距地心小于这个距离时显示 3D 模型
    TRAIL_SEC: 28,        // 尾迹长度（秒）
    REFRESH_MS: 3000      // 每颗卫星重新 SGP4 推算的周期
  });

  /** 按轨道倾角分组上色（星链的几个轨道壳层） */
  SL.shell = function (inc) {
    if (inc > 90) return { c: '#ffb84d', name: '极地轨道 97.6°' };
    if (inc >= 60) return { c: '#c38bff', name: '高倾角 70°' };
    if (inc >= 48) return { c: '#4de8ff', name: '主壳层 53°' };
    return { c: '#8ab4ff', name: '低倾角 43°' };
  };

  /* ---------------------------- 数据加载 ---------------------------- */
  function loadTle() {
    // CelesTrak 约 2 小时更新一次,且每次更新只允许下载一次:本机缓存 2 小时,失败也 2 小时内不重试
    return LE.netcache.text(C.URL.celestrak, 2 * 3600 * 1000, C.TIMEOUT.tle, function (t) { return /^OBJECT_NAME,/.test(t) && t.split('\n').length > 10; })
      .then(function (r) { return { text: r.text, live: r.live, omm: true }; })
      .catch(function () { return { text: window.STARLINK_LITE_TLE || '', live: false }; });
  }
  function libReady() {
    return new Promise(function (res, rej) {
      var t0 = performance.now();
      (function check() {
        if (window.satellite && window.satellite.json2satrec) return res();
        if (performance.now() - t0 > 20000) return rej(new Error('satellite.js 未加载'));
        setTimeout(check, 60);
      })();
    });
  }
  /** OMM CSV(CelesTrak FORMAT=CSV)→ satrec;satellite.js 6 的 json2satrec */
  var NUMF = { MEAN_MOTION: 1, ECCENTRICITY: 1, INCLINATION: 1, RA_OF_ASC_NODE: 1, ARG_OF_PERICENTER: 1, MEAN_ANOMALY: 1, EPHEMERIS_TYPE: 1, NORAD_CAT_ID: 1, ELEMENT_SET_NO: 1, REV_AT_EPOCH: 1, BSTAR: 1, MEAN_MOTION_DOT: 1, MEAN_MOTION_DDOT: 1 };
  function parseCsv(text) {
    var rows = text.split(/\r?\n/).filter(function (s) { return s.trim(); }), out = [];
    if (rows.length < 2) return out;
    var H = rows[0].split(',');
    for (var i = 1; i < rows.length; i++) {
      var v = rows[i].split(','); if (v.length !== H.length) continue;
      var o = {}; for (var k = 0; k < H.length; k++) o[H[k]] = NUMF[H[k]] ? parseFloat(v[k]) : v[k];
      try {
        var rec = satellite.json2satrec(o);
        if (rec && !rec.error) {
          var inc = rec.inclo / U.DEG;
          out.push({ name: o.OBJECT_NAME || 'STARLINK', rec: rec, norad: String(o.NORAD_CAT_ID), inc: inc, shell: SL.shell(inc),
                     p: new THREE.Vector3(), v: new THREE.Vector3(), t: 0, ok: false, alt: 0, speed: 0 });
        }
      } catch (e) { /* 跳过坏记录 */ }
    }
    return out;
  }
  function parse(text) {
    if (/^OBJECT_NAME,/.test(text)) return parseCsv(text);
    var L = text.split(/\r?\n/).map(function (s) { return s.trim(); }), out = [];
    for (var i = 0; i < L.length - 1; i++) {
      if (L[i].indexOf('1 ') !== 0 || L[i + 1].indexOf('2 ') !== 0) continue;
      var prev = i > 0 ? L[i - 1] : '';
      var name = prev && !/^[12] /.test(prev) ? prev.replace(/^0 /, '') : 'STARLINK';
      try {
        var rec = satellite.twoline2satrec(L[i], L[i + 1]);
        if (!rec.error) {
          var inc = rec.inclo / U.DEG;
          out.push({ name: name, rec: rec, norad: L[i].slice(2, 7).trim(), inc: inc, shell: SL.shell(inc),
                     p: new THREE.Vector3(), v: new THREE.Vector3(), t: 0, ok: false, alt: 0, speed: 0 });
        }
      } catch (e) { /* 跳过坏记录 */ }
      i++;
    }
    return out;
  }

  /* ---------------------------- 轨道推算 ---------------------------- */
  var gmCache = { t: -1, v: 0 };
  function gmst(date) { var t = Math.floor(date.getTime() / 1000); if (t !== gmCache.t) { gmCache.t = t; gmCache.v = satellite.gstime(date); } return gmCache.v; }
  function ecef(rec, date, out) {
    var pv = satellite.propagate(rec, date);
    if (!pv || !pv.position || !isFinite(pv.position.x)) return null;
    var g = satellite.eciToGeodetic(pv.position, gmst(date));
    var lat = satellite.degreesLat(g.latitude), lng = satellite.degreesLong(g.longitude);
    U.ll(lat, lng, C.EARTH_R * (1 + g.height / C.EARTH_KM * C.ALT_SCALE), out);
    return { lat: lat, lng: lng, alt: g.height, speed: Math.hypot(pv.velocity.x, pv.velocity.y, pv.velocity.z) };
  }
  var tmpA = new THREE.Vector3();
  function refresh(s, nowMs) {
    var st = ecef(s.rec, new Date(nowMs), s.p);
    if (!st) { s.ok = false; return; }
    if (!ecef(s.rec, new Date(nowMs + 1000), tmpA)) { s.ok = false; return; }
    s.v.subVectors(tmpA, s.p);          // 场景单位 / 秒（地固系，已含地球自转）
    s.t = nowMs; s.ok = true; s.lat = st.lat; s.lng = st.lng; s.alt = st.alt; s.speed = st.speed;
  }

  /* ---------------------------- 卫星模型 ---------------------------- */
  /** 合并几何体：平板卫星本体 + 两片太阳翼（+X/-X 方向展开），Z 轴 = 飞行方向，Y 轴 = 天顶方向 */
  function satGeometry() {
    var parts = [];
    function box(w, h, d, x, y, z, group) {
      var g = new THREE.BoxGeometry(w, h, d).toNonIndexed(); g.translate(x, y, z);
      g.userData.group = group; parts.push(g);
    }
    box(1.0, 0.12, 1.6, 0, 0, 0, 0);          // 本体（平板）
    box(0.5, 0.18, 0.5, 0, 0.13, 0.3, 0);     // 相控阵天线罩
    box(0.08, 0.06, 0.08, 0.55, 0.02, 0, 0);  // 太阳翼支杆
    box(0.08, 0.06, 0.08, -0.55, 0.02, 0, 0);
    box(2.6, 0.03, 1.0, 1.95, 0.02, 0, 1);    // 太阳翼
    box(2.6, 0.03, 1.0, -1.95, 0.02, 0, 1);
    var count = parts.reduce(function (n, g) { return n + g.attributes.position.count; }, 0);
    var pos = new Float32Array(count * 3), nor = new Float32Array(count * 3), col = new Float32Array(count * 3), o = 0;
    var body = new THREE.Color('#d9dde3'), panel = new THREE.Color('#1b2f6b');
    parts.forEach(function (g) {
      var n = g.attributes.position.count, c = g.userData.group ? panel : body;
      pos.set(g.attributes.position.array, o * 3); nor.set(g.attributes.normal.array, o * 3);
      for (var i = 0; i < n; i++) col.set([c.r, c.g, c.b], (o + i) * 3);
      o += n;
    });
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    return geo;
  }

  /* ------------------------------ 初始化 ------------------------------ */
  SL.init = function () {
    S = LE.scene;
    SL.group = new THREE.Group(); S.earthScene.add(SL.group);
    SL.sunLight = new THREE.DirectionalLight(0xfff4e6, 2.4); S.earthScene.add(SL.sunLight);
    S.earthScene.add(new THREE.AmbientLight(0x223355, 0.35));

    Promise.all([loadTle(), libReady()]).then(function (r) {
      SL.sats = parse(r[0].text); SL.live = r[0].live;
      if (!SL.sats.length) throw new Error('no sats');
      var now = Date.now();
      SL.sats.forEach(function (s) { refresh(s, now); });
      build();
      LE.bus.emit('data:starlink', { count: SL.sats.length, live: SL.live });
    }).catch(function (e) { console.warn('[starlink]', e); LE.bus.emit('data:starlink', { count: 0, live: false, error: true }); });

    var cursor = 0;
    S.addUpdater(function (dt, now, mode) {
      if (!SL.points || mode !== 'earth' || !SL.group.visible) return;
      // 分帧推算：每帧推进一部分卫星，REFRESH_MS 内全部刷新一遍
      var n = SL.sats.length, per = Math.max(1, Math.ceil(n * dt * 1000 / SL.REFRESH_MS));
      for (var k = 0; k < per; k++) { refresh(SL.sats[cursor], now); cursor = (cursor + 1) % n; }
      draw(now);
    });

    S.addPicker({ mode: 'earth', priority: 2, fn: function (ray) {
      if (!SL.points || !SL.group.visible) return null;
      ray.params.Points.threshold = 0.02 * Math.max(0.3, S.earthCam.position.length() / 3) * (innerWidth < 640 ? 1.8 : 1);
      var best = null;
      ray.intersectObject(SL.points).forEach(function (h) {
        var s = SL.sats[h.index]; if (!s || !s.ok || S.occluded(h.point)) return;
        if (!best || h.distanceToRay < best.d) best = { s: s, d: h.distanceToRay };
      });
      return best && { score: 3 - best.d, run: function () { SL.select(best.s); SL.flyToSelected(); } };
    } });
  };

  function build() {
    var n = SL.sats.length;
    // 1) 光点
    var pos = new Float32Array(n * 3), col = new Float32Array(n * 3), seed = new Float32Array(n), c = new THREE.Color();
    SL.sats.forEach(function (s, i) { c.set(s.shell.c); col.set([c.r, c.g, c.b], i * 3); seed[i] = Math.random(); });
    var g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.setAttribute('seed', new THREE.BufferAttribute(seed, 1));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1.3);
    SL.pointMat = new THREE.ShaderMaterial({
      uniforms: { uSun: { value: LE.earth.sun }, uTime: { value: 0 }, uPR: { value: S.renderer.getPixelRatio() }, uSize: { value: 1 } },
      vertexShader: [
        'attribute vec3 color; attribute float seed; uniform vec3 uSun; uniform float uTime,uPR,uSize; varying vec3 vC; varying float vL;',
        'void main(){',
        ' vec3 p=position; float along=dot(p,uSun); float perp=length(p-along*uSun);',
        ' float lit=(along>0.0||perp>1.0)?1.0:0.0;',                 // 地影判定：在背日侧且落在地球圆柱阴影内 → 暗
        ' float glint=pow(max(0.0,sin(uTime*0.7+seed*628.0)),60.0)*lit;', // 太阳能板偶发闪光
        ' vL=lit; vC=mix(color*0.18, mix(color,vec3(1.0,0.97,0.9),0.25)+glint*2.0, lit);',
        ' vec4 mv=modelViewMatrix*vec4(p,1.0);',
        ' gl_PointSize=uPR*uSize*(2.2+lit*1.6+glint*7.0)*clamp(3.2/-mv.z,0.6,3.0);',
        ' gl_Position=projectionMatrix*mv; }'
      ].join('\n'),
      fragmentShader: 'varying vec3 vC; varying float vL; void main(){ float d=length(gl_PointCoord-.5); float a=smoothstep(.5,0.,d); float core=smoothstep(.16,0.,d); if(a<.02) discard; gl_FragColor=vec4(vC*(0.55+core*1.3), a*(0.35+0.65*vL)); }',
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
    });
    SL.points = new THREE.Points(g, SL.pointMat);
    SL.points.frustumCulled = false;
    SL.group.add(SL.points);

    // 2) 尾迹（每颗卫星一条线段：头亮尾暗）
    var tpos = new Float32Array(n * 6), tcol = new Float32Array(n * 6);
    SL.sats.forEach(function (s, i) { c.set(s.shell.c); tcol.set([c.r, c.g, c.b, 0, 0, 0], i * 6); });
    var tg = new THREE.BufferGeometry();
    tg.setAttribute('position', new THREE.BufferAttribute(tpos, 3).setUsage(THREE.DynamicDrawUsage));
    tg.setAttribute('color', new THREE.BufferAttribute(tcol, 3));
    SL.trailMesh = new THREE.LineSegments(tg, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false }));
    SL.trailMesh.frustumCulled = false;
    SL.trailMesh.visible = SL.trails;
    SL.group.add(SL.trailMesh);

    // 3) 3D 模型
    SL.models = new THREE.InstancedMesh(satGeometry(), new THREE.MeshStandardMaterial({ vertexColors: true, metalness: 0.75, roughness: 0.32, emissive: 0x0a1020 }), n);
    SL.models.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    SL.models.frustumCulled = false; SL.models.visible = false;
    SL.group.add(SL.models);

    // 选中：轨道线 + 高亮环
    SL.orbit = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }));
    SL.orbit.frustumCulled = false; SL.orbit.visible = false;
    SL.halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTexture(), color: 0xffffff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    SL.halo.visible = false;
    SL.group.add(SL.orbit, SL.halo);

    // 4) 近景英雄模型（精细星链 V2 Mini，米制模型 × HERO_S）
    if (LE.models) { SL.hero = LE.models.starlink(); SL.hero.visible = false; SL.group.add(SL.hero); }
  }
  SL.HERO_S = 0.0004;

  function haloTexture() {
    var cv = document.createElement('canvas'); cv.width = cv.height = 128;
    var x = cv.getContext('2d'), g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.55, 'rgba(255,255,255,0)');
    g.addColorStop(0.62, 'rgba(255,255,255,0.95)'); g.addColorStop(0.7, 'rgba(255,255,255,0.15)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(cv);
  }

  /* ------------------------------ 每帧绘制 ------------------------------ */
  var m4 = new THREE.Matrix4(), X = new THREE.Vector3(), Y = new THREE.Vector3(), Z = new THREE.Vector3(), P = new THREE.Vector3(), SC = new THREE.Vector3();
  var orbitTimer = 0;
  function draw(now) {
    var camD = S.earthCam.position.length();
    var showModels = camD < SL.MODEL_DIST || !!SL.closeUp;
    var pa = SL.points.geometry.attributes.position.array, ta = SL.trailMesh.geometry.attributes.position.array;
    var modelScale = SL.closeUp ? 0.0023 : U.clamp((camD - 1) * 0.0045, 0.0009, 0.004);
    var heroOn = !!(SL.hero && SL.selected && SL.selected.ok && (SL.closeUp || camD < 1.5));
    SC.set(modelScale, modelScale, modelScale);
    for (var i = 0, n = SL.sats.length; i < n; i++) {
      var s = SL.sats[i];
      if (!s.ok) {
        pa[i * 3] = pa[i * 3 + 1] = pa[i * 3 + 2] = 0;
        if (showModels) SL.models.setMatrixAt(i, m4.makeScale(0, 0, 0));
        continue;
      }
      var dt = (now - s.t) / 1000;
      P.copy(s.p).addScaledVector(s.v, dt);
      pa[i * 3] = P.x; pa[i * 3 + 1] = P.y; pa[i * 3 + 2] = P.z;
      if (SL.trails) {
        ta[i * 6] = P.x; ta[i * 6 + 1] = P.y; ta[i * 6 + 2] = P.z;
        // 尾端沿速度反方向，并略微压回轨道高度（近似弧线）
        X.copy(P).addScaledVector(s.v, -SL.TRAIL_SEC).setLength(P.length());
        ta[i * 6 + 3] = X.x; ta[i * 6 + 4] = X.y; ta[i * 6 + 5] = X.z;
      }
      if (showModels) {
        Y.copy(P).normalize(); Z.copy(s.v).normalize(); X.crossVectors(Y, Z).normalize(); Z.crossVectors(X, Y);
        m4.makeBasis(X, Y, Z).scale(SC).setPosition(P);
        if (heroOn && s === SL.selected) { placeHero(m4, P, now); m4.makeScale(0, 0, 0); }
        SL.models.setMatrixAt(i, m4);
      }
    }
    SL.points.geometry.attributes.position.needsUpdate = true;
    if (SL.trails) SL.trailMesh.geometry.attributes.position.needsUpdate = true;
    SL.models.visible = showModels;
    if (SL.hero) SL.hero.visible = heroOn && showModels;
    if (showModels) SL.models.instanceMatrix.needsUpdate = true;
    SL.pointMat.uniforms.uTime.value = (now / 1000) % 10000;
    SL.pointMat.uniforms.uSize.value = showModels ? 0.55 : 1;
    SL.sunLight.position.copy(LE.earth.sun).multiplyScalar(10);

    if (SL.selected && SL.selected.ok) {
      var sel = SL.selected, dts = (now - sel.t) / 1000;
      SL.halo.position.copy(sel.p).addScaledVector(sel.v, dts);
      var hs = SL.closeUp ? 0.016 : 0.03 * Math.max(0.25, camD / 3); SL.halo.scale.set(hs, hs, hs); SL.halo.material.opacity = SL.closeUp ? 0 : 1;
      orbitTimer -= 1;
      if (orbitTimer <= 0) { drawOrbit(sel, now); orbitTimer = 60; LE.bus.emit('select:update', { kind: 'sat', item: sel }); }
    }
  }

  var qInv = new THREE.Quaternion(), sunL = new THREE.Vector3();
  function placeHero(basis, P, now) {
    var h = SL.hero;
    h.quaternion.setFromRotationMatrix(m4.makeBasis(X, Y, Z));
    h.position.copy(P); h.scale.setScalar(SL.HERO_S);
    // 太阳翼追日：把太阳方向转到模型局部坐标，绕 X 轴转到正对太阳
    qInv.copy(h.quaternion).invert(); sunL.copy(LE.earth.sun).applyQuaternion(qInv);
    var a = Math.atan2(sunL.z, sunL.y);
    h.userData.wings.forEach(function (w) { w.rotation.x = a; });
    h.userData.plume.material.opacity = 0.22 + 0.12 * Math.sin(now / 90) * Math.sin(now / 37);
  }

  function drawOrbit(s, now) {
    var per = 2 * Math.PI / s.rec.no, pts = [], v = new THREE.Vector3();
    for (var i = 0; i <= 200; i++) {
      if (ecef(s.rec, new Date(now + (i / 200) * per * 60000), v)) pts.push(v.clone());
    }
    SL.orbit.geometry.dispose();
    SL.orbit.geometry = new THREE.BufferGeometry().setFromPoints(pts);
  }

  SL.select = function (s) {
    if (SL.closeUp && SL.selected !== s) { SL.closeUp = false; S.cancelCinematic(); S.setFollow(null); }
    SL.selected = s;
    SL.orbit.material.color.set(s.shell.c);
    SL.orbit.visible = SL.halo.visible = true;
    drawOrbit(s, Date.now());
    LE.bus.emit('select', { kind: 'sat', item: s });
  };
  SL.unselect = function () {
    SL.selected = null; if (SL.orbit) SL.orbit.visible = SL.halo.visible = false;
    if (SL.closeUp) { SL.closeUp = false; S.releaseFollow(); }
  };

  /** 一镜到底：从当前视角连续飞到选中卫星的斜后上方，然后跟随环绕（显示精细模型） */
  var live = new THREE.Vector3(), fr = { up: new THREE.Vector3(), fwd: new THREE.Vector3() };
  SL.livePos = function (s) { return live.copy(s.p).addScaledVector(s.v, (Date.now() - s.t) / 1000); };
  SL.flyToSelected = function () {
    var s = SL.selected; if (!s || !s.ok) return;
    SL.closeUp = true;
    S.cinematic({
      get: function () { return SL.livePos(s); },
      frame: function () { fr.up.copy(SL.livePos(s)).normalize(); fr.fwd.copy(s.v).normalize(); return fr; },
      offset: { back: 0.016, up: 0.0045, side: 0.0085 }, ms: 5200
    });
  };

  /** 地面某点上空可见（高于地平线、地面距离 ≤ km）的卫星数 */
  SL.overhead = function (lat, lng, km) {
    var me = U.ll(lat, lng, 1), n = 0;
    SL.sats.forEach(function (s) {
      if (!s.ok) return;
      if (U.haversine({ lat: lat, lng: lng }, s) <= km && s.p.clone().sub(me).dot(me) > 0) n++;
    });
    return n;
  };

  /** 卫星此刻是否被阳光照到（与着色器里的地影判定一致） */
  SL.isLit = function (s) {
    var sun = LE.earth.sun, along = s.p.dot(sun);
    return along > 0 || s.p.clone().addScaledVector(sun, -along).length() > 1;
  };

  SL.setVisible = function (on) { SL.visible = on; if (SL.group) SL.group.visible = on; if (!on) SL.unselect(); };
  SL.setTrails = function (on) { SL.trails = on; if (SL.trailMesh) SL.trailMesh.visible = on; };
})();
