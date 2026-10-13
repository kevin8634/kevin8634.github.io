/* =====================================================================
 * Live Earth 2.0 · le-scene.js
 * LE.scene：渲染器、双场景（地球 / 太阳系）、相机、OrbitControls、渲染循环、点击拾取、相机飞行
 * LE.earth：地球着色器（昼夜线 + 城市灯光 + 海洋高光）、云层、大气辉光、星空背景、实时太阳方向
 * ===================================================================== */
(function () {
  'use strict';
  var LE = window.LE, U = LE.util, C = LE.config;

  /* ------------------------------ LE.scene ----------------------------- */
  var S = (LE.scene = {
    mode: 'earth',
    updaters: [],      // 每帧回调 fn(dt, nowMs, mode)
    pickers: [],       // 点击拾取 {mode, priority, fn(raycaster, ndc) -> {dist, run}}
    clickHandlers: [], // 拾取都没命中时的地表点击 fn(latlng)
    addUpdater: function (fn) { S.updaters.push(fn); },
    addPicker: function (p) { S.pickers.push(p); S.pickers.sort(function (a, b) { return (b.priority || 0) - (a.priority || 0); }); },
    onGroundClick: function (fn) { S.clickHandlers.push(fn); }
  });

  S.init = function (stage) {
    var renderer = (S.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' }));
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(innerWidth, innerHeight);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    stage.appendChild(renderer.domElement);

    // 地球场景
    S.earthScene = new THREE.Scene();
    S.earthCam = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.002, 500);
    S.earthCam.position.set(0, 0.6, 9);
    S.earthCtl = makeControls(S.earthCam, 1.08, 12);
    S.earthCtl.autoRotate = true;
    S.earthCtl.autoRotateSpeed = 0.35;

    // 太阳系场景
    S.solarScene = new THREE.Scene();
    S.solarCam = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.01, 20000);
    S.solarCam.position.set(0, 60, 140);
    S.solarCtl = makeControls(S.solarCam, 0.05, 1200);
    S.solarCtl.enabled = false;

    window.addEventListener('resize', onResize);
    bindPointer(renderer.domElement);

    var last = performance.now();
    renderer.setAnimationLoop(function (t) {
      var dt = Math.min(0.1, (t - last) / 1000); last = t;
      var now = Date.now();
      stepFly(t);
      stepDirector(t);
      stepFollow();
      S.ctl().update();
      for (var i = 0; i < S.updaters.length; i++) S.updaters[i](dt, now, S.mode);
      renderer.render(S.mode === 'earth' ? S.earthScene : S.solarScene, S.cam());
    });
  };

  function makeControls(cam, minD, maxD) {
    var c = new THREE.OrbitControls(cam, S.renderer.domElement);
    c.enableDamping = true; c.dampingFactor = 0.07;
    c.enablePan = false; c.rotateSpeed = 0.5; c.zoomSpeed = 0.8;
    c.minDistance = minD; c.maxDistance = maxD;
    var resume;
    c.addEventListener('start', function () { S.earthCtl && (S.earthCtl.autoRotate = false); clearTimeout(resume); S.fly = null; });
    c.addEventListener('end', function () { clearTimeout(resume); resume = setTimeout(function () { if (S.mode === 'earth' && !S.holdRotate) S.earthCtl.autoRotate = true; }, 6000); });
    return c;
  }

  S.cam = function () { return S.mode === 'earth' ? S.earthCam : S.solarCam; };
  S.ctl = function () { return S.mode === 'earth' ? S.earthCtl : S.solarCtl; };

  S.setMode = function (mode) {
    if (mode === S.mode) return;
    S.mode = mode; S.fly = null;
    S.earthCtl.enabled = mode === 'earth';
    S.solarCtl.enabled = mode === 'solar';
    LE.bus.emit('mode:changed', { mode: mode });
  };

  function onResize() {
    S.renderer.setSize(innerWidth, innerHeight);
    [S.earthCam, S.solarCam].forEach(function (c) { c.aspect = innerWidth / innerHeight; c.updateProjectionMatrix(); });
  }

  /** 屏幕上地球大致占满所需的相机距离 */
  S.fitDistance = function () {
    var cam = S.earthCam, vf = cam.fov * U.DEG / 2;
    var hf = Math.atan(Math.tan(vf) * cam.aspect);
    return U.clamp(1.25 / Math.sin(Math.min(vf, hf)), 2.6, 7);
  };

  /* --------------------------- 相机飞行动画 --------------------------- */
  /** flyTo({target:Vector3, position:Vector3, ms}) —— 同时插值相机位置和注视点 */
  S.flyTo = function (opt) {
    var ctl = S.ctl(), cam = S.cam();
    S.fly = {
      t0: performance.now(), ms: opt.ms || 2200,
      p0: cam.position.clone(), p1: opt.position.clone(),
      c0: ctl.target.clone(), c1: (opt.target || ctl.target).clone(),
      arc: opt.arc !== false, done: opt.done
    };
    S.earthCtl.autoRotate = false;
  };
  /** 地球模式：飞到某经纬度上空 */
  S.flyToLatLng = function (lat, lng, dist, ms) {
    var p = U.ll(lat, lng, dist || 2.4);
    S.flyTo({ position: p, target: new THREE.Vector3(), ms: ms || 2200 });
  };
  function stepFly(t) {
    var f = S.fly; if (!f) return;
    var k = U.clamp((t - f.t0) / f.ms, 0, 1), e = U.ease(k);
    var cam = S.cam(), ctl = S.ctl();
    if (S.mode === 'earth' && f.arc && f.c1.lengthSq() < 1e-6 && f.c0.lengthSq() < 1e-6) {
      // 绕地心做球面插值，避免穿过地球
      var r0 = f.p0.length(), r1 = f.p1.length();
      var a = f.p0.clone().normalize(), b = f.p1.clone().normalize();
      var ang = Math.acos(U.clamp(a.dot(b), -1, 1));
      var dir = ang < 1e-4 ? b : a.multiplyScalar(Math.sin((1 - e) * ang)).add(b.multiplyScalar(Math.sin(e * ang))).divideScalar(Math.sin(ang));
      var lift = Math.sin(Math.PI * e) * Math.min(1.5, ang * 0.8);
      cam.position.copy(dir.normalize().multiplyScalar(U.lerp(r0, r1, e) + lift));
    } else {
      cam.position.lerpVectors(f.p0, f.p1, e);
    }
    ctl.target.lerpVectors(f.c0, f.c1, e);
    if (k >= 1) { S.fly = null; if (f.done) f.done(); }
  }

  /* ------------------------------ 一镜到底 ----------------------------- */
  /** S.cinematic({ get, frame, offset:{back,up,side}, ms, done })
   *  从当前机位连续飞到运动目标身边：方向球面插值 + 距离按对数插值（缩放感均匀、不切镜），
   *  注视点从原注视点平滑过渡到目标；结束后自动进入跟随 + 缓慢环绕。
   *  get()   → 目标此刻的世界坐标（每帧调用）
   *  frame() → { up, fwd } 目标的局部朝向（天顶 / 飞行方向，单位向量） */
  var dv = new THREE.Vector3(), o1 = new THREE.Vector3(), sideV = new THREE.Vector3();
  S.cinematic = function (opt) {
    var cam = S.earthCam, ctl = S.earthCtl, P = opt.get();
    S.fly = null; S.setFollow(null);
    var off = cam.position.clone().sub(P);
    S.director = { t0: performance.now(), ms: opt.ms || 4800, get: opt.get, frame: opt.frame, off: opt.offset, done: opt.done,
                   d0: off.clone().normalize(), r0: off.length(), T0: ctl.target.clone() };
    ctl.enabled = false; ctl.autoRotate = false; S.holdRotate = true;
    ctl.minDistance = 0.004;
    LE.bus.emit('cinematic:start', {});
  };
  S.cancelCinematic = function () { if (!S.director) return; S.director = null; S.earthCtl.enabled = true; };
  function slerpDir(a, b, t, out) {
    var d = U.clamp(a.dot(b), -1, 1), ang = Math.acos(d);
    if (ang < 1e-4) return out.copy(b);
    var sa = Math.sin(ang);
    return out.copy(a).multiplyScalar(Math.sin((1 - t) * ang) / sa).addScaledVector(b, Math.sin(t * ang) / sa).normalize();
  }
  function stepDirector(t) {
    var D = S.director; if (!D || S.mode !== 'earth') return;
    var k = U.clamp((t - D.t0) / D.ms, 0, 1), e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
    var P = D.get(), f = D.frame(), cam = S.earthCam, ctl = S.earthCtl;
    sideV.crossVectors(f.up, f.fwd).normalize();
    o1.copy(f.fwd).multiplyScalar(-D.off.back).addScaledVector(f.up, D.off.up).addScaledVector(sideV, D.off.side);
    var r1 = o1.length(); o1.divideScalar(r1);
    slerpDir(D.d0, o1, e, dv);
    var r = Math.exp(U.lerp(Math.log(D.r0), Math.log(r1), e));
    cam.position.copy(P).addScaledVector(dv, r);
    if (cam.position.length() < 1.004) cam.position.setLength(1.004);
    var kt = U.clamp(k / 0.55, 0, 1); kt = kt * kt * (3 - 2 * kt);
    ctl.target.lerpVectors(D.T0, P, kt);
    cam.up.set(0, 1, 0);
    if (k >= 1) {
      S.director = null; ctl.enabled = true; ctl.target.copy(P);
      S.setFollow(D.get);
      ctl.autoRotate = true; ctl.autoRotateSpeed = 0.6;
      LE.bus.emit('cinematic:end', {});
      if (D.done) D.done();
    }
  }

  /* ------------------------------ 镜头跟随 ----------------------------- */
  /** S.setFollow(fn) —— fn() 每帧返回被跟随物体的世界坐标；相机与注视点一起平移。null 取消跟随 */
  var followPrev = new THREE.Vector3(), followD = new THREE.Vector3();
  S.setFollow = function (fn) {
    S.follow = fn;
    if (fn) { var p = fn(); if (p) followPrev.copy(p); S.earthCtl.minDistance = 0.004; }
    else { S.earthCtl.minDistance = 1.08; }
  };
  function stepFollow() {
    if (!S.follow || S.mode !== 'earth') return;
    var p = S.follow(); if (!p) return;
    followD.subVectors(p, followPrev); followPrev.copy(p);
    S.earthCam.position.add(followD); S.earthCtl.target.add(followD);
    if (S.fly) { S.fly.p1.add(followD); S.fly.c1.add(followD); }
  }
  /** 回到以地心为中心的普通视角 */
  S.releaseFollow = function () {
    S.cancelCinematic();
    S.earthCtl.autoRotateSpeed = 0.35; S.holdRotate = false;
    if (!S.follow) return;
    S.setFollow(null);
    S.flyTo({ position: S.earthCam.position.clone().setLength(Math.max(2.6, S.earthCam.position.length() + 1.2)), target: new THREE.Vector3(), ms: 1600, arc: false });
  };

  /* ------------------------------ 点击拾取 ----------------------------- */
  var ray = new THREE.Raycaster();
  function bindPointer(el) {
    var down = null;
    el.addEventListener('pointerdown', function (e) { down = { x: e.clientX, y: e.clientY, t: performance.now() }; });
    el.addEventListener('pointerup', function (e) {
      if (!down) return;
      var moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
      var quick = performance.now() - down.t < 500;
      down = null;
      if (moved > 6 || !quick) return;
      S.pick(e.clientX, e.clientY);
    });
  }
  S.ray = function (cx, cy) {
    ray.setFromCamera({ x: (cx / innerWidth) * 2 - 1, y: -(cy / innerHeight) * 2 + 1 }, S.cam());
    return ray;
  };
  S.pick = function (cx, cy) {
    var r = S.ray(cx, cy);
    var best = null;
    S.pickers.forEach(function (p) {
      if (p.mode !== S.mode) return;
      var hit = p.fn(r);
      if (hit && (!best || hit.score > best.score)) best = hit;
    });
    if (best) { best.run(); return; }
    if (S.mode === 'earth') {
      var hitP = new THREE.Vector3();
      if (r.ray.intersectSphere(new THREE.Sphere(new THREE.Vector3(), C.EARTH_R), hitP)) {
        var g = U.toLL(hitP);
        S.clickHandlers.forEach(function (fn) { fn(g); });
      }
    }
  };
  /** 判断一个点是否被地球挡住（从当前相机看） */
  S.occluded = function (p) {
    var cam = S.earthCam.position;
    var d = p.clone().sub(cam), len = d.length(); d.divideScalar(len);
    var b = cam.dot(d), c = cam.lengthSq() - 1.0;
    var disc = b * b - c;
    if (disc < 0) return false;
    var tHit = -b - Math.sqrt(disc);
    return tHit > 0 && tHit < len - 1e-3;
  };
  /** 世界坐标 → 屏幕像素 */
  var tmp = new THREE.Vector3();
  S.toScreen = function (p, cam) {
    tmp.copy(p).project(cam || S.cam());
    return { x: (tmp.x + 1) / 2 * innerWidth, y: (1 - tmp.y) / 2 * innerHeight, behind: tmp.z > 1 };
  };

  /* ------------------------------ LE.earth ----------------------------- */
  var E = (LE.earth = { sun: new THREE.Vector3(1, 0, 0) });

  /** 太阳直射点方向（NOAA 近似公式），返回单位向量 */
  E.sunDir = function (date) {
    date = date || new Date();
    var start = Date.UTC(date.getUTCFullYear(), 0, 1);
    var doy = Math.floor((date.getTime() - start) / 864e5) + 1;
    var hrs = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
    var g = (2 * Math.PI / 365) * (doy - 1 + (hrs - 12) / 24);
    var eot = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
    var decl = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
    var lng = -15 * (hrs - 12 + eot / 60);
    lng = ((lng + 540) % 360) - 180;
    return U.ll(decl / U.DEG, lng, 1).normalize();
  };
  /** 某地此刻是白天吗 */
  E.isDay = function (lat, lng) { return U.ll(lat, lng, 1).dot(E.sun) > 0; };

  E.init = function () {
    var scene = S.earthScene, T = C.TEX, tex = LE.assets.texture;
    E.uniforms = {
      uDay: { value: tex(T.earthDay, true) }, uNight: { value: tex(T.earthNight, true) },
      uBump: { value: tex(T.earthBump) }, uSpec: { value: tex(T.earthSpec) },
      uSun: { value: E.sun }, uShade: { value: 1 }, uNightMode: { value: 0 },
      uTexel: { value: new THREE.Vector2(1 / 2048, 1 / 1024) }
    };
    E.ready = Promise.all([E.uniforms.uDay.value.ready, E.uniforms.uNight.value.ready]);

    // 星空背景
    var skyTex = tex(T.milkyway, true);
    var sky = new THREE.Mesh(new THREE.SphereGeometry(200, 64, 32), new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, color: 0x18181d, depthWrite: false, toneMapped: false }));
    sky.rotation.set(0.5, 0, 0.3);
    scene.add(sky);

    // 地球
    E.mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 160, 80), new THREE.ShaderMaterial({
      uniforms: E.uniforms,
      vertexShader: [
        'varying vec2 vUv; varying vec3 vN; varying vec3 vW;',
        'void main(){ vUv=uv; vN=normalize((modelMatrix*vec4(normal,0.)).xyz);',
        ' vec4 w=modelMatrix*vec4(position,1.); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }'
      ].join('\n'),
      fragmentShader: [
        'uniform sampler2D uDay,uNight,uBump,uSpec; uniform vec3 uSun; uniform float uShade,uNightMode; uniform vec2 uTexel;',
        'varying vec2 vUv; varying vec3 vN; varying vec3 vW;',
        'void main(){',
        ' vec3 N=normalize(vN); vec3 V=normalize(cameraPosition-vW);',
        ' vec3 T=normalize(cross(vec3(0.,1.,0.),N)+vec3(1e-4,0.,0.)); vec3 B=cross(N,T);',
        ' float h=texture2D(uBump,vUv).r, hx=texture2D(uBump,vUv+vec2(uTexel.x,0.)).r, hy=texture2D(uBump,vUv+vec2(0.,uTexel.y)).r;',
        ' vec3 Nb=normalize(N-3.0*((hx-h)*T+(hy-h)*B));',
        ' vec3 day=texture2D(uDay,vUv).rgb; vec3 night=texture2D(uNight,vUv).rgb; float ocean=texture2D(uSpec,vUv).r;',
        ' float cosS=dot(N,uSun); float dayMix=smoothstep(-0.12,0.2,cosS);',
        ' float diff=max(dot(Nb,uSun),0.);',
        ' vec3 H=normalize(uSun+V); float spec=pow(max(dot(N,H),0.),60.)*(0.08+0.9*ocean);',
        ' vec3 lit=day*(0.05+1.1*diff)+vec3(1.0,0.92,0.8)*spec*dayMix;',
        ' vec3 lights=night*vec3(1.,0.82,0.55)*2.4+day*0.01;',
        ' float tw=smoothstep(0.22,0.,abs(cosS+0.02));',
        ' vec3 shaded=mix(lights,lit,dayMix)+vec3(1.,0.42,0.16)*0.08*tw;',
        ' vec3 flat_=day*(0.82+0.3*max(dot(Nb,V),0.)-0.15);',
        ' vec3 col=mix(flat_,shaded,uShade); col=mix(col,night*2.6+day*0.025,uNightMode);',
        ' float fr=pow(1.-max(dot(N,V),0.),3.);',
        ' float rimLight=mix(1.,clamp(cosS+0.45,0.12,1.),uShade*(1.-uNightMode));',
        ' col+=vec3(0.28,0.58,1.)*fr*0.7*rimLight;',
        ' gl_FragColor=vec4(col,1.);',
        ' #include <tonemapping_fragment>',
        ' #include <encodings_fragment>',
        '}'
      ].join('\n')
    }));
    scene.add(E.mesh);

    // 云层：慢速漂移，只在白天被照亮
    var cloudTex = tex(T.earthClouds);
    E.clouds = new THREE.Mesh(new THREE.SphereGeometry(1.006, 128, 64), new THREE.ShaderMaterial({
      uniforms: { uMap: { value: cloudTex }, uSun: { value: E.sun } },
      vertexShader: 'varying vec2 vUv; varying vec3 vN; void main(){ vUv=uv; vN=normalize((modelMatrix*vec4(normal,0.)).xyz); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
      fragmentShader: 'uniform sampler2D uMap; uniform vec3 uSun; varying vec2 vUv; varying vec3 vN; void main(){ vec4 c=texture2D(uMap,vUv); float a=c.r; float l=smoothstep(-0.15,0.35,dot(normalize(vN),uSun)); gl_FragColor=vec4(vec3(1.)*(0.04+0.96*l), a*(0.08+0.62*l)); }',
      transparent: true, depthWrite: false
    }));
    scene.add(E.clouds);

    // 大气辉光（背面 + 加色混合）
    E.atmo = new THREE.Mesh(new THREE.SphereGeometry(1.14, 96, 48), new THREE.ShaderMaterial({
      uniforms: { uSun: { value: E.sun }, uShade: E.uniforms.uShade, uNightMode: E.uniforms.uNightMode },
      vertexShader: 'varying vec3 vN; varying vec3 vP; varying vec3 vWN; void main(){ vN=normalize(normalMatrix*normal); vWN=normalize((modelMatrix*vec4(normal,0.)).xyz); vec4 mv=modelViewMatrix*vec4(position,1.); vP=mv.xyz; gl_Position=projectionMatrix*mv; }',
      fragmentShader: 'uniform vec3 uSun; uniform float uShade,uNightMode; varying vec3 vN; varying vec3 vP; varying vec3 vWN; void main(){ vec3 V=normalize(-vP); float x=-dot(normalize(vN),V); float i=pow(smoothstep(0.,0.5,x),2.2)*1.15; float s=mix(1.,0.25+0.75*smoothstep(-0.45,0.35,dot(-vWN,uSun)),uShade*(1.-uNightMode*0.6)); gl_FragColor=vec4(vec3(0.3,0.6,1.)*i*s,i*s); }',
      side: THREE.BackSide, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false
    }));
    scene.add(E.atmo);

    E.target = { shade: 1, night: 0 };
    var sunTimer = 0;
    S.addUpdater(function (dt) {
      sunTimer -= dt;
      if (sunTimer <= 0) { E.sun.copy(E.sunDir()); sunTimer = 10; }
      E.clouds.rotation.y += dt * 0.004;
      var u = E.uniforms, k = 1 - Math.pow(0.02, dt);
      u.uShade.value += (E.target.shade - u.uShade.value) * k;
      u.uNightMode.value += (E.target.night - u.uNightMode.value) * k;
    });
    E.sun.copy(E.sunDir());
  };

  E.setLayer = function (id, on) {
    if (id === 'terminator') E.target.shade = on ? 1 : 0;
    if (id === 'lights') E.target.night = on ? 1 : 0;
    if (id === 'clouds') E.clouds.visible = on;
  };
})();
