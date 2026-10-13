/* =====================================================================
 * Live Earth 2.2 · le-iss.js
 * LE.layers.iss：国际空间站（ISS）
 *  - 轨道：CelesTrak 实时 TLE（CATNR=25544）→ 失败用内嵌 TLE；satellite.js SGP4 每帧推算
 *  - 远景：金色菱形标记 + 名称标签 + 一圈轨道线
 *  - 近景：NASA 公开 3D 模型（le-models.js 解析），金色太阳翼、银白舱段，按飞行姿态摆放
 *  - 点击：一镜到底飞近，并显示科普卡片
 * ===================================================================== */
(function () {
  'use strict';
  var LE = window.LE, U = LE.util, C = LE.config, S;
  LE.layers = LE.layers || {};

  // 内嵌兜底 TLE（历元 2026-10-12），ISS 轨道每天会因大气阻力和变轨微调，实时数据优先
  var TLE_FALLBACK = ['1 25544U 98067A   26285.14422154  .00005771  00000-0  11345-3 0  9993',
                      '2 25544  51.6314  81.3064 0006731 252.4466 107.5787 15.48833724589888'];
  var URL = 'https://celestrak.org/NORAD/elements/gp.php?CATNR=25544&FORMAT=TLE';

  var I = (LE.layers.iss = { visible: true, live: false, ok: false, closeUp: false, HERO_S: 0.00034,
    p: new THREE.Vector3(), v: new THREE.Vector3(), t: 0, lat: 0, lng: 0, alt: 0, speed: 0 });

  var tmp = new THREE.Vector3();
  function ecef(date, out) {
    var pv = satellite.propagate(I.rec, date);
    if (!pv || !pv.position || !isFinite(pv.position.x)) return null;
    var g = satellite.eciToGeodetic(pv.position, satellite.gstime(date));
    var lat = satellite.degreesLat(g.latitude), lng = satellite.degreesLong(g.longitude);
    U.ll(lat, lng, C.EARTH_R * (1 + g.height / C.EARTH_KM), out);
    return { lat: lat, lng: lng, alt: g.height, speed: Math.hypot(pv.velocity.x, pv.velocity.y, pv.velocity.z) };
  }
  function refresh(now) {
    var st = ecef(new Date(now), I.p); if (!st || !ecef(new Date(now + 1000), tmp)) { I.ok = false; return; }
    I.v.subVectors(tmp, I.p); I.t = now; I.ok = true;
    I.lat = st.lat; I.lng = st.lng; I.alt = st.alt; I.speed = st.speed;
  }
  var live = new THREE.Vector3();
  I.livePos = function () { return live.copy(I.p).addScaledVector(I.v, (Date.now() - I.t) / 1000); };
  I.isLit = function () { var sun = LE.earth.sun, a = I.p.dot(sun); return a > 0 || I.p.clone().addScaledVector(sun, -a).length() > 1; };

  function markerTexture() {
    var cv = document.createElement('canvas'); cv.width = cv.height = 128; var x = cv.getContext('2d');
    x.translate(64, 64);
    x.strokeStyle = 'rgba(255,190,90,0.95)'; x.lineWidth = 3;
    x.beginPath(); x.arc(0, 0, 40, 0, Math.PI * 2); x.stroke();
    x.rotate(Math.PI / 4); x.fillStyle = '#ffd38a'; x.shadowColor = '#ffb46a'; x.shadowBlur = 16; x.fillRect(-12, -12, 24, 24);
    return new THREE.CanvasTexture(cv);
  }

  I.init = function () {
    S = LE.scene;
    I.group = new THREE.Group(); S.earthScene.add(I.group);
    I.marker = new THREE.Sprite(new THREE.SpriteMaterial({ map: markerTexture(), transparent: true, depthWrite: false, depthTest: true }));
    I.marker.renderOrder = 5; I.group.add(I.marker);
    I.orbit = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineDashedMaterial({ color: 0xffb46a, dashSize: 0.02, gapSize: 0.012, transparent: true, opacity: 0.75, depthWrite: false }));
    I.orbit.frustumCulled = false; I.group.add(I.orbit);
    I.label = document.createElement('div'); I.label.className = 'le-pin-label le-iss-label'; I.label.textContent = 'ISS 国际空间站';
    (document.getElementById('labels') || document.body).appendChild(I.label);

    var libReady = new Promise(function (res) { (function w() { if (window.satellite && satellite.twoline2satrec) res(); else setTimeout(w, 80); })(); });
    var tle = U.fetchTimeout(URL, 6000).then(function (r) { return r.text(); }).then(function (t) {
      var L = t.split(/\r?\n/).map(function (x) { return x.trim(); }).filter(function (x) { return /^[12] 25544/.test(x); });
      if (L.length < 2) throw 0; I.live = true; return L;
    }).catch(function () { return TLE_FALLBACK; });
    Promise.all([tle, libReady]).then(function (r) {
      I.rec = satellite.twoline2satrec(r[0][0], r[0][1]);
      refresh(Date.now()); drawOrbit(Date.now());
      LE.bus.emit('data:iss', { live: I.live });
    });
    // 模型稍后再载入，不阻塞首屏
    setTimeout(function () {
      LE.models.iss().then(function (m) { I.model = m; m.visible = false; I.group.add(m); })
        .catch(function (e) { console.warn('[iss] 模型加载失败', e); });
    }, 2500);

    var acc = 0, orbitAcc = 0;
    var X = new THREE.Vector3(), Y = new THREE.Vector3(), Z = new THREE.Vector3(), m4 = new THREE.Matrix4();
    S.addUpdater(function (dt, now, mode) {
      if (!I.rec || mode !== 'earth' || !I.group.visible) { I.label.classList.remove('is-on'); return; }
      if ((acc += dt) > 0.5) { acc = 0; refresh(now); }
      if ((orbitAcc += dt) > 20) { orbitAcc = 0; drawOrbit(now); }
      if (!I.ok) return;
      var P = I.livePos(), camD = S.earthCam.position.distanceTo(P);
      // 标记：屏幕上大小恒定
      var ms = 0.045 * camD * (innerWidth < 640 ? 1.3 : 1);
      I.marker.position.copy(P); I.marker.scale.set(ms, ms, ms);
      var near = camD < 0.6 || I.closeUp;
      I.marker.material.opacity = near ? 0 : 1;
      if (I.model) {
        I.model.visible = near;
        if (near) {
          Y.copy(P).normalize(); Z.copy(I.v).normalize(); X.crossVectors(Y, Z).normalize(); Z.crossVectors(X, Y);
          I.model.quaternion.setFromRotationMatrix(m4.makeBasis(X, Y, Z));
          I.model.position.copy(P); I.model.scale.setScalar(I.HERO_S);
        }
      }
      var sp = S.toScreen(P), vis = !S.occluded(P) && !sp.behind && !near;
      I.label.style.transform = 'translate(' + Math.round(sp.x + 14) + 'px,' + Math.round(sp.y - 12) + 'px)';
      I.label.classList.toggle('is-on', vis);
      if (I.selected && (I.rowT = (I.rowT || 0) - dt) <= 0) { I.rowT = 1; LE.bus.emit('select:update', { kind: 'iss', item: I }); }
    });

    S.addPicker({ mode: 'earth', priority: 3, fn: function (ray) {
      if (!I.ok || !I.group.visible) return null;
      var P = I.livePos(), d = ray.ray.distanceToPoint(P), camD = S.earthCam.position.distanceTo(P);
      var th = 0.035 * camD * (innerWidth < 640 ? 1.8 : 1);
      if (d > th || S.occluded(P)) return null;
      return { score: 10 - d / th, run: function () { I.select(); I.flyTo(); } };
    } });
  };

  function drawOrbit(now) {
    if (!I.rec) return;
    var per = 2 * Math.PI / I.rec.no, pts = [], v = new THREE.Vector3();
    for (var i = 0; i <= 240; i++) if (ecef(new Date(now + (i / 240) * per * 60000), v)) pts.push(v.clone());
    I.orbit.geometry.dispose();
    I.orbit.geometry = new THREE.BufferGeometry().setFromPoints(pts);
    I.orbit.computeLineDistances();
  }

  I.select = function () { I.selected = true; LE.bus.emit('select', { kind: 'iss', item: I }); };
  I.unselect = function () { I.selected = false; if (I.closeUp) { I.closeUp = false; } };
  var fr = { up: new THREE.Vector3(), fwd: new THREE.Vector3() };
  I.flyTo = function () {
    if (!I.ok) return;
    I.closeUp = true;
    S.cinematic({
      get: function () { return I.livePos(); },
      frame: function () { fr.up.copy(I.livePos()).normalize(); fr.fwd.copy(I.v).normalize(); return fr; },
      offset: { back: 0.024, up: 0.011, side: 0.017 }, ms: 5600
    });
  };
  I.setVisible = function (on) { I.visible = on; if (I.group) I.group.visible = on; if (!on) { I.label.classList.remove('is-on'); I.unselect(); } };
})();
