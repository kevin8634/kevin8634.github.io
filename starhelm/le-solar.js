/* =====================================================================
 * Live Earth 2.0 · le-solar.js
 * LE.solar：太阳系模式
 *  位置：JPL 近似开普勒根数，按“此刻”真实计算日心坐标（数据 window.SOLAR，来自 planets-data.js）
 *  显示比例：方向真实；距离压缩 D = 14·√r（r 为 AU）；星球大小压缩 R = 0.35·(半径/地球)^0.45 —— 否则肉眼看不到行星
 *  功能：按名字精确搜索星球 → 飞抵并跟随；时间流速（实时 / 1天每秒 / 1周每秒 / 1月每秒）；
 *        小行星带、柯伊伯带；点星球看科普卡片（离太阳/离地球距离、光行时）
 * ===================================================================== */
(function () {
  'use strict';
  var LE = window.LE, U = LE.util, S;
  var DEG = U.DEG, J2000 = 2451545.0;

  var SO = (LE.solar = { bodies: [], byId: {}, simTime: Date.now(), speed: 1, follow: null });

  // 自转周期（小时，负数 = 逆向自转）
  var ROT_H = { sun: 609.1, mercury: 1407.6, venus: -5832.5, earth: 23.934, moon: 655.7, mars: 24.623, jupiter: 9.925, saturn: 10.656,
                uranus: -17.24, neptune: 16.11, pluto: -153.3, ceres: 9.07, haumea: 3.92, makemake: 22.83, eris: 378 };

  SO.SPEEDS = [
    { label: '实时', v: 1 }, { label: '1 天/秒', v: 86400 }, { label: '1 周/秒', v: 604800 }, { label: '1 月/秒', v: 2629800 }
  ];

  /* ---------------------------- 轨道计算 ---------------------------- */
  SO.jd = function (ms) { return ms / 86400000 + 2440587.5; };
  function solveKepler(M, e) {
    var E = M + e * Math.sin(M);
    for (var i = 0; i < 12; i++) { var dE = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E)); E -= dE; if (Math.abs(dE) < 1e-9) break; }
    return E;
  }
  function fromElements(a, e, I, Om, w, M) {
    var E = solveKepler(M, e);
    var xp = a * (Math.cos(E) - e), yp = a * Math.sqrt(1 - e * e) * Math.sin(E);
    var cw = Math.cos(w), sw = Math.sin(w), cO = Math.cos(Om), sO = Math.sin(Om), cI = Math.cos(I), sI = Math.sin(I);
    return {
      x: (cw * cO - sw * sO * cI) * xp + (-sw * cO - cw * sO * cI) * yp,
      y: (cw * sO + sw * cO * cI) * xp + (-sw * sO + cw * cO * cI) * yp,
      z: (sw * sI) * xp + (cw * sI) * yp
    };
  }
  /** 某天体在某时刻的日心黄道坐标（AU）；meanAnomalyOverride 用于画整圈轨道 */
  SO.helio = function (b, ms, Mover) {
    var jd = SO.jd(ms);
    if (b.el) {
      var T = (jd - J2000) / 36525, el = b.el, r = b.rate;
      var a = el[0] + r[0] * T, e = el[1] + r[1] * T, I = (el[2] + r[2] * T) * DEG, L = el[3] + r[3] * T, wb = el[4] + r[4] * T, Om = el[5] + r[5] * T;
      var M = Mover != null ? Mover : ((L - wb) % 360) * DEG;
      return fromElements(a, e, I, Om * DEG, (wb - Om) * DEG, M);
    }
    if (b.kepler) {
      var k = b.kepler, n = 0.9856076686 / Math.pow(k.a, 1.5);
      var M2 = Mover != null ? Mover : (((k.M0 + n * (jd - k.epochJD)) % 360) * DEG);
      return fromElements(k.a, k.e, k.I * DEG, k.Omega * DEG, k.omega * DEG, M2);
    }
    return { x: 0, y: 0, z: 0 };
  }
  /** 黄道坐标 → 场景坐标（黄道面 = 水平面），距离按 14·√r 压缩 */
  SO.toScene = function (h, out) {
    var r = Math.sqrt(h.x * h.x + h.y * h.y + h.z * h.z) || 1e-9, d = 14 * Math.pow(r, 0.5) / r;
    return (out || new THREE.Vector3()).set(h.x * d, h.z * d, -h.y * d);
  };
  SO.displayRadius = function (km) { return 0.35 * Math.pow(km / 6371, 0.45); };

  /* ------------------------------ 初始化 ------------------------------ */
  SO.init = function () {
    S = LE.scene;
    var scene = S.solarScene, data = window.SOLAR, tex = LE.assets.texture;
    if (!data) { console.warn('[solar] 缺少 planets-data.js'); return; }

    var sky = new THREE.Mesh(new THREE.SphereGeometry(5000, 64, 32), new THREE.MeshBasicMaterial({ map: tex(LE.config.TEX.milkyway, true), side: THREE.BackSide, color: 0x0b0b0e, depthWrite: false, toneMapped: false }));
    scene.add(sky);
    scene.add(new THREE.AmbientLight(0x404858, 0.25));
    var sunLight = new THREE.PointLight(0xfff2e0, 2.6, 0, 0); scene.add(sunLight);

    // 太阳
    var sunR = 3.2;
    var sun = new THREE.Mesh(new THREE.SphereGeometry(sunR, 64, 32), new THREE.MeshBasicMaterial({ map: tex(data.sun.tex, true), color: 0xffe2b0 }));
    scene.add(sun);
    [[sunR * 3.4, 0.75, '255,200,110'], [sunR * 9, 0.22, '255,140,60']].forEach(function (g) {
      var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(g[2]), transparent: true, opacity: g[1], depthWrite: false, blending: THREE.AdditiveBlending }));
      sp.scale.set(g[0], g[0], 1); scene.add(sp);
    });
    addBody(Object.assign({}, data.sun, { mesh: sun, R: sunR, spinner: sun }));

    // 行星 / 矮行星 / 月球
    data.bodies.forEach(function (b) {
      var R = SO.displayRadius(b.radiusKm);
      var pivot = new THREE.Group(); scene.add(pivot);
      var tilt = new THREE.Group(); tilt.rotation.z = (b.tilt || 0) * DEG; pivot.add(tilt);
      var map = b.tex === 'earth' ? tex(LE.config.TEX.earthDay, true) : tex(b.tex, true);
      var mesh = new THREE.Mesh(new THREE.SphereGeometry(R, 64, 32), planetMaterial(map, b.id));
      if (b.elongated) mesh.scale.set(b.elongated[0], b.elongated[2], b.elongated[1]);
      tilt.add(mesh);
      if (b.ring) {
        var rIn = R * b.ringInnerKm / b.radiusKm, rOut = R * b.ringOuterKm / b.radiusKm;
        var rg = new THREE.RingGeometry(rIn, rOut, 128, 1), uv = rg.attributes.uv, p = rg.attributes.position, v3 = new THREE.Vector3();
        for (var i = 0; i < uv.count; i++) { v3.fromBufferAttribute(p, i); uv.setXY(i, (v3.length() - rIn) / (rOut - rIn), 0.5); }
        var ring = new THREE.Mesh(rg, new THREE.MeshBasicMaterial({ map: tex(b.ring, true), side: THREE.DoubleSide, transparent: true, depthWrite: false, color: 0xe8dcc4 }));
        ring.rotation.x = -Math.PI / 2; tilt.add(ring);
      }
      if (ATMO[b.id]) tilt.add(haloMesh(R, ATMO[b.id]));
      addBody(Object.assign({}, b, { mesh: mesh, pivot: pivot, R: R, spinner: mesh }));
      if (!b.parent) scene.add(orbitLine(b));
    });

    scene.add(belt(2.2, 3.3, 2600, 0x9b9488, 0.06, 0.55));    // 小行星带
    scene.add(belt(30, 50, 3200, 0x7f9bb8, 0.12, 0.35));      // 柯伊伯带

    SO.labels = document.getElementById('solar-labels');
    SO.bodies.forEach(function (b) {
      var el = document.createElement('button');
      el.type = 'button'; el.className = 'le-plabel' + (b.type === '行星' || b.type === '恒星' ? ' is-major' : '');
      el.textContent = b.zh; el.addEventListener('click', function () { SO.select(b.id); });
      SO.labels.appendChild(el); b.label = el;
    });

    S.addUpdater(update);
    S.addPicker({ mode: 'solar', priority: 1, fn: pick });
    SO.place(Date.now());
  };


  /* ------------------------------ 星球材质 ------------------------------ */
  // 自写着色器，不依赖场景灯光：太阳在原点，光照方向 = -世界坐标。
  // 包裹光照 + 气态行星临边昏暗 + 大气边缘光 + 夜面保底亮度（夜面也能看清纹理，不会是黑球）。
  // 贴图未加载完成时用该星球的基色顶上。
  var BASE = { mercury: '#8c8680', venus: '#e3c48f', earth: '#3d6fb0', moon: '#9a9a9a', mars: '#c1643a', jupiter: '#cfae86', saturn: '#e2cfa0',
               uranus: '#a9dde6', neptune: '#4b6fd8', pluto: '#c9b29b', ceres: '#8a8580', haumea: '#d8d4cc', makemake: '#b77d5e', eris: '#d9d6d0' };
  var ATMO = { venus: [1.0, 0.85, 0.55], earth: [0.35, 0.65, 1.0], mars: [1.0, 0.6, 0.4], jupiter: [0.9, 0.8, 0.6], saturn: [0.95, 0.85, 0.6], uranus: [0.55, 0.9, 1.0], neptune: [0.4, 0.6, 1.0] };
  var GAS = { jupiter: 1, saturn: 1, uranus: 1, neptune: 1 };
  function planetMaterial(map, id) {
    var mat = new THREE.ShaderMaterial({
      uniforms: { uMap: { value: map }, uHas: { value: 0 }, uBase: { value: new THREE.Color(BASE[id] || '#888888') },
                  uAtm: { value: new THREE.Color().fromArray(ATMO[id] || [0, 0, 0]) }, uGas: { value: GAS[id] ? 1 : 0 } },
      vertexShader: 'varying vec2 vUv; varying vec3 vN; varying vec3 vW; void main(){ vUv=uv; vN=normalize(mat3(modelMatrix)*normal); vec4 w=modelMatrix*vec4(position,1.); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }',
      fragmentShader: [
        'uniform sampler2D uMap; uniform float uHas,uGas; uniform vec3 uBase,uAtm; varying vec2 vUv; varying vec3 vN; varying vec3 vW;',
        'void main(){',
        ' vec3 alb = uHas > 0.5 ? texture2D(uMap, vUv).rgb : uBase;',
        ' vec3 N=normalize(vN), L=normalize(-vW), V=normalize(cameraPosition-vW);',
        ' float ndl=dot(N,L); float mu=max(dot(N,V),0.0);',
        ' float lit = uGas>0.5 ? max((ndl+0.1)/1.1,0.0)*pow(max(mu,0.05),0.15) : max(ndl,0.0);',
        ' vec3 col = alb*(vec3(1.0,0.97,0.92)*1.55*lit + 0.07);',                 // 0.07 = 夜面保底
        ' float rim=pow(1.0-mu,3.0);',
        ' col += uAtm*rim*(0.25+0.75*smoothstep(-0.3,0.4,ndl))*0.9;',
        ' col += alb*rim*0.12;',                                                   // 轮廓光，让暗面轮廓可辨
        ' gl_FragColor=vec4(col,1.0);',
        ' #include <tonemapping_fragment>',
        ' #include <encodings_fragment>',
        '}'].join('\n')
    });
    if (map && map.ready) map.ready.then(function (t) { if (t.image) mat.uniforms.uHas.value = 1; });
    return mat;
  }
  function haloMesh(R, c) {
    return new THREE.Mesh(new THREE.SphereGeometry(R * 1.05, 48, 24), new THREE.ShaderMaterial({
      uniforms: { uCol: { value: new THREE.Color().fromArray(c) } },
      vertexShader: 'varying vec3 vN; varying vec3 vW; void main(){ vN=normalize(mat3(modelMatrix)*normal); vec4 w=modelMatrix*vec4(position,1.); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }',
      fragmentShader: 'uniform vec3 uCol; varying vec3 vN; varying vec3 vW; void main(){ vec3 N=normalize(vN), V=normalize(cameraPosition-vW), L=normalize(-vW); float mu=max(-dot(N,V),0.0); float g=smoothstep(0.0,0.45,mu)*(1.0-smoothstep(0.45,0.9,mu)); float lit=0.25+smoothstep(-0.35,0.45,dot(-N,L)); gl_FragColor=vec4(uCol*g*g*lit*1.3,1.0); }',
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.BackSide
    }));
  }

  var PINYIN = { sun: 'taiyang', mercury: 'shuixing', venus: 'jinxing', earth: 'diqiu', moon: 'yueqiu yueliang', mars: 'huoxing', jupiter: 'muxing',
                 saturn: 'tuxing', uranus: 'tianwangxing', neptune: 'haiwangxing', pluto: 'mingwangxing', ceres: 'gushenxing', haumea: 'renshenxing', makemake: 'niaoshenxing', eris: 'xishenxing' };
  function addBody(b) { b.py = PINYIN[b.id] || ''; SO.bodies.push(b); SO.byId[b.id] = b; }

  function glowTex(rgb) {
    var cv = document.createElement('canvas'); cv.width = cv.height = 256;
    var x = cv.getContext('2d'), g = x.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, 'rgba(' + rgb + ',1)'); g.addColorStop(0.2, 'rgba(' + rgb + ',0.5)'); g.addColorStop(1, 'rgba(' + rgb + ',0)');
    x.fillStyle = g; x.fillRect(0, 0, 256, 256);
    return new THREE.CanvasTexture(cv);
  }

  function orbitLine(b) {
    var pts = [], now = Date.now();
    for (var i = 0; i <= 360; i++) pts.push(SO.toScene(SO.helio(b, now, i * DEG)));
    var col = b.type === '行星' ? 0x6fa8ff : 0x8c7bb0;
    return new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: b.type === '行星' ? 0.35 : 0.2, depthWrite: false }));
  }

  function belt(rMin, rMax, n, color, thick, opacity) {
    var pos = new Float32Array(n * 3), h = {};
    for (var i = 0; i < n; i++) {
      var r = rMin + Math.random() * (rMax - rMin), a = Math.random() * Math.PI * 2;
      h.x = r * Math.cos(a); h.y = r * Math.sin(a); h.z = (Math.random() - 0.5) * thick * r;
      var v = SO.toScene(h); pos.set([v.x, v.y, v.z], i * 3);
    }
    var g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return new THREE.Points(g, new THREE.PointsMaterial({ color: color, size: 1.6, sizeAttenuation: false, transparent: true, opacity: opacity, depthWrite: false }));
  }

  /* ------------------------------ 每帧 ------------------------------ */
  var prevFollow = new THREE.Vector3(), tmp = new THREE.Vector3();
  SO.place = function (ms) {
    SO.bodies.forEach(function (b) {
      if (b.id === 'sun' || !b.pivot) return;
      if (b.parent) {
        var par = SO.byId[b.parent], days = (ms - 946728000000) / 86400000;
        var ang = 2 * Math.PI * days / b.moonOrbit.periodDays, d = par.R * 4.5;
        b.pivot.position.set(par.pivot.position.x + Math.cos(ang) * d, par.pivot.position.y + Math.sin(ang) * d * 0.09, par.pivot.position.z - Math.sin(ang) * d);
        b.helioPos = par.helioPos;
      } else {
        b.helioPos = SO.helio(b, ms);
        SO.toScene(b.helioPos, b.pivot.position);
      }
    });
  };

  function update(dt, now, mode) {
    if (mode !== 'solar') return;
    SO.simTime += dt * 1000 * SO.speed;
    if (SO.follow) prevFollow.copy(SO.follow.pivot ? SO.follow.pivot.position : SO.follow.mesh.position);
    SO.place(SO.simTime);
    var spinScale = SO.speed === 1 ? 600 : SO.speed; // 实时太慢看不出，实时模式下自转加速 600 倍展示
    SO.bodies.forEach(function (b) {
      var hrs = ROT_H[b.id]; if (hrs) b.spinner.rotation.y += dt * spinScale / (hrs * 3600) * 2 * Math.PI;
    });
    if (SO.follow) {
      var p = SO.follow.pivot ? SO.follow.pivot.position : SO.follow.mesh.position;
      tmp.subVectors(p, prevFollow);
      S.solarCam.position.add(tmp); S.solarCtl.target.add(tmp);
      if (S.fly) { S.fly.p1.add(tmp); S.fly.c1.add(tmp); }
    }
    // 标签
    var cam = S.solarCam, camD = cam.position.distanceTo(S.solarCtl.target), placed = [];
    SO.bodies.forEach(function (b) {
      var wp = b.pivot ? b.pivot.position : b.mesh.position;
      var sp = S.toScreen(wp, cam), dist = cam.position.distanceTo(wp);
      var pxR = b.R / dist * innerHeight / (2 * Math.tan(cam.fov * DEG / 2));
      var show = !sp.behind && pxR < 140 && (b.type === '行星' || b.type === '恒星' || b === SO.follow || camD < 60 || (b.parent && dist < 12));
      if (b.parent && dist > 14) show = false;
      if (show) { var lx = sp.x + pxR * 0.75 + 6, ly = sp.y - pxR * 0.75 - 18; for (var k = 0; k < placed.length; k++) { if (Math.abs(placed[k][0] - lx) < 56 && Math.abs(placed[k][1] - ly) < 20) { ly = placed[k][1] + 22; k = -1; } } placed.push([lx, ly]); b._lx = lx; b._ly = ly; }
      b.label.style.visibility = show ? 'visible' : 'hidden';
      if (show) b.label.style.transform = 'translate(' + Math.round(b._lx) + 'px,' + Math.round(b._ly) + 'px)';
      b.label.classList.toggle('is-sel', b === SO.follow);
    });
    if (SO.follow && (SO._cardTimer = (SO._cardTimer || 0) - dt) <= 0) { SO._cardTimer = 0.5; LE.bus.emit('select:update', { kind: 'planet', item: SO.follow }); }
    LE.bus.emit('solar:tick', SO.simTime);
  }

  function pick(ray) {
    var best = null, o = ray.ray.origin, d = ray.ray.direction;
    SO.bodies.forEach(function (b) {
      var wp = b.pivot ? b.pivot.position : b.mesh.position;
      tmp.subVectors(wp, o); var dist = tmp.length();
      var ang = Math.acos(U.clamp(tmp.dot(d) / dist, -1, 1));
      var tol = Math.max(Math.atan(b.R * 1.2 / dist), 0.025);
      if (ang < tol && (!best || ang / tol < best.k)) best = { b: b, k: ang / tol };
    });
    return best && { score: 2 - best.k, run: function () { SO.select(best.b.id); } };
  }

  /* ---------------------------- 搜索 / 选择 ---------------------------- */
  SO.search = function (q) {
    q = U.norm(q);
    return SO.bodies.map(function (b) {
      return { b: b, s: q ? Math.max(U.fuzzy(q, b.zh), U.fuzzy(q, b.en), U.fuzzy(q, b.py || ''), U.fuzzy(q, b.type) * 0.5) : (b.type === '行星' || b.type === '恒星' ? 2 : 1) };
    }).filter(function (x) { return x.s > 0; }).sort(function (a, b) { return b.s - a.s; }).map(function (x) { return x.b; });
  };

  /** 选中并飞到星球，之后镜头跟随它移动 */
  SO.select = function (id) {
    var b = SO.byId[id]; if (!b) return;
    if (S.mode !== 'solar') S.setMode('solar');
    SO.follow = b;
    var wp = (b.pivot ? b.pivot.position : b.mesh.position).clone();
    var dir = S.solarCam.position.clone().sub(wp).normalize();
    if (b.id !== 'sun') { var toSun = wp.clone().normalize().negate(); dir = toSun.multiplyScalar(0.6).add(new THREE.Vector3(0, 0.16, 0)).add(dir.multiplyScalar(0.3)).normalize(); }
    S.flyTo({ target: wp, position: wp.clone().add(dir.multiplyScalar(b.R * (b.id === 'sun' ? 4 : b.ring ? 8.5 : 5) * Math.max(1, 1.1 / S.solarCam.aspect))), ms: 2400, arc: false });
    S.solarCtl.minDistance = b.R * 1.4;
    LE.bus.emit('select', { kind: 'planet', item: b });
  };
  SO.overview = function () {
    SO.follow = null; S.solarCtl.minDistance = 0.05;
    S.flyTo({ target: new THREE.Vector3(), position: new THREE.Vector3(0, 52, 92), ms: 2000, arc: false });
  };

  /** 科普数据：离太阳 / 离地球（AU、光行时） */
  SO.distances = function (b) {
    if (!b.helioPos || b.id === 'sun') return null;
    var e = SO.byId.earth.helioPos, h = b.helioPos;
    var rs = Math.sqrt(h.x * h.x + h.y * h.y + h.z * h.z);
    var re = Math.sqrt(Math.pow(h.x - e.x, 2) + Math.pow(h.y - e.y, 2) + Math.pow(h.z - e.z, 2));
    if (b.parent) return { sunAU: rs, earthKm: b.moonOrbit.distKm, lightSec: b.moonOrbit.distKm / 299792.458 };
    return { sunAU: rs, earthAU: b.id === 'earth' ? 0 : re, lightMin: re * 149597870.7 / 299792.458 / 60 };
  };
})();
