/* 天枢 Starhelm · sh-voyage-fx.js(M1.5)
 * 舷窗外的宇宙:八个星域的 3D 景象 + 各引擎的穿梭特效。
 * 已测绘星域(I)用现有贴图;未测绘星域只做景象,不放可点击节点;猜想外圈做抽象处理。
 * 真实影像:ESA/Webb(NASA, ESA, CSA, STScI),CC BY 4.0,署名见界面与许可台账。 */
(function () {
  'use strict';
  var SH = (window.SH = window.SH || {});
  var FX = (SH.voyFx = {});
  var T = THREE;

  function tex(src, cb) {
    var t = new T.Texture(); t.encoding = T.sRGBEncoding;
    var go = function (img) { if (!img) return; t.image = img; t.needsUpdate = true; if (cb) cb(t); };
    if (window.LE && LE.assets && /^(earth|planet|milkyway)/.test(src)) LE.assets.image(src).then(go);
    else { var im = new Image(); im.onload = function () { go(im); }; im.src = src; }
    return t;
  }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function gauss() { return (Math.random() + Math.random() + Math.random() - 1.5) / 1.5; }
  function glowTex(inner, outer) {
    var c = document.createElement('canvas'); c.width = c.height = 128; var g = c.getContext('2d');
    var gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, inner); gr.addColorStop(0.25, inner); gr.addColorStop(1, outer);
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128); var t = new T.CanvasTexture(c); return t;
  }
  var GLOW = null;
  function glow(color, size, op) {
    GLOW = GLOW || glowTex('rgba(255,255,255,1)', 'rgba(255,255,255,0)');
    var m = new T.SpriteMaterial({ map: GLOW, color: color, transparent: true, opacity: op == null ? 1 : op, depthWrite: false, blending: T.AdditiveBlending });
    var s = new T.Sprite(m); s.scale.set(size, size, 1); return s;
  }
  function planet(src, r, seg) {
    var m = new T.MeshStandardMaterial({ map: tex(src), roughness: 1, metalness: 0 });
    return new T.Mesh(new T.SphereGeometry(r, seg || 64, seg ? seg / 2 : 32), m);
  }
  function atmo(r, color, power) {
    var m = new T.ShaderMaterial({
      uniforms: { c: { value: new T.Color(color) }, p: { value: power || 3.0 } },
      vertexShader: 'varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix*vec4(position,1.); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }',
      fragmentShader: 'uniform vec3 c; uniform float p; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(1.0 - abs(dot(vN, vV)), p); gl_FragColor = vec4(c*f*1.6, f); }',
      transparent: true, blending: T.AdditiveBlending, side: T.BackSide, depthWrite: false
    });
    return new T.Mesh(new T.SphereGeometry(r, 64, 32), m);
  }
  function points(n, fn, size, color, extra) {
    var pos = new Float32Array(n * 3), col = new Float32Array(n * 3), c = new T.Color();
    for (var i = 0; i < n; i++) { var o = fn(i, c); pos[i * 3] = o[0]; pos[i * 3 + 1] = o[1]; pos[i * 3 + 2] = o[2]; col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
    var g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.setAttribute('color', new T.BufferAttribute(col, 3));
    GLOW = GLOW || glowTex('rgba(255,255,255,1)', 'rgba(255,255,255,0)');
    var m = new T.PointsMaterial(Object.assign({ size: size, map: GLOW, vertexColors: true, transparent: true, depthWrite: false, blending: T.AdditiveBlending, sizeAttenuation: true, color: color || 0xffffff }, extra || {}));
    return new T.Points(g, m);
  }
  function photo(src, w, h) {
    var m = new T.MeshBasicMaterial({ map: tex(src), transparent: true, opacity: 0.0, depthWrite: false });
    var mesh = new T.Mesh(new T.PlaneGeometry(w, h), m); mesh.userData.photoOpacity = 1; return mesh;
  }
  function softEdge(src, w, h, op) {   // 真实照片:边缘羽化,融入星空
    var m = new T.ShaderMaterial({
      uniforms: { map: { value: tex(src) }, op: { value: op || 1 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
      fragmentShader: 'uniform sampler2D map; uniform float op; varying vec2 vUv; void main(){ vec4 c = texture2D(map, vUv); vec2 d = abs(vUv-0.5)*2.; float e = 1.0 - smoothstep(0.55, 1.0, max(d.x, d.y)); gl_FragColor = vec4(c.rgb, e*op); }',
      transparent: true, depthWrite: false
    });
    return new T.Mesh(new T.PlaneGeometry(w, h), m);
  }

  /* ============================ 八个星域 ============================ */
  FX.build = function (scene, tier) {
    var lowN = tier === 'low' ? 0.35 : tier === 'mid' ? 0.65 : 1;
    var G = {};
    var sky = new T.Mesh(new T.SphereGeometry(1800, 48, 24), new T.MeshBasicMaterial({ map: tex('milkyway-2k.jpg'), side: T.BackSide, depthWrite: false, color: 0x8a8a9a }));
    scene.add(sky); FX.sky = sky;
    var sun = new T.DirectionalLight(0xffffff, 2.2); sun.position.set(300, 120, 100); scene.add(sun);
    scene.add(new T.AmbientLight(0x223344, 0.35));

    // I 家园:近地轨道俯瞰地球
    var home = new T.Group();
    var earth = planet('earth-day-2k.jpg', 100, 96); earth.position.set(0, -118, -70); earth.rotation.set(0.35, -1.9, 0.1); home.add(earth);
    var clouds = new T.Mesh(new T.SphereGeometry(100.6, 96, 48), new T.MeshStandardMaterial({ map: tex('earth-clouds-1k.jpg'), transparent: true, opacity: 0.55, depthWrite: false }));
    clouds.position.copy(earth.position); clouds.rotation.copy(earth.rotation); home.add(clouds);
    var at = atmo(104, 0x58a8ff, 2.6); at.position.copy(earth.position); home.add(at);
    var sunH = glow(0xfff2d0, 90); sunH.position.set(420, 160, -500); home.add(sunH);
    home.userData.spin = function (dt) { earth.rotation.y += dt * 0.004; clouds.rotation.y += dt * 0.005; };
    G.home = home;

    // II 日与月
    var moonG = new T.Group();
    var moon = planet('planet-moon.jpg', 34, 96); moon.position.set(-18, -6, -130); moonG.add(moon);
    var earthS = planet('earth-day-2k.jpg', 4.2, 48); earthS.position.set(95, 32, -420); moonG.add(earthS);
    var atS = atmo(4.5, 0x58a8ff, 2.4); atS.position.copy(earthS.position); moonG.add(atS);
    var sunM = glow(0xfff6dc, 160); sunM.position.set(520, 140, -700); moonG.add(sunM);
    var corona = glow(0xffb070, 420, 0.25); corona.position.copy(sunM.position); moonG.add(corona);
    moonG.userData.spin = function (dt) { moon.rotation.y += dt * 0.003; };
    G.moon = moonG;

    // III 行星世界
    var pl = new T.Group();
    var jup = planet('planet-jupiter.jpg', 48, 96); jup.position.set(28, -8, -175); jup.rotation.z = 0.05; pl.add(jup);
    var sat = planet('planet-saturn.jpg', 12, 64); sat.position.set(-110, 34, -430); sat.rotation.z = 0.45; pl.add(sat);
    var ringTex = tex('planet-saturn-ring.png');
    var rg = new T.RingGeometry(15, 27, 96); var uv = rg.attributes.uv, p3 = rg.attributes.position, v3 = new T.Vector3();
    for (var i = 0; i < uv.count; i++) { v3.fromBufferAttribute(p3, i); uv.setXY(i, (v3.length() - 15) / 12, 0.5); }
    var ring = new T.Mesh(rg, new T.MeshBasicMaterial({ map: ringTex, side: T.DoubleSide, transparent: true, opacity: 0.9, depthWrite: false }));
    ring.position.copy(sat.position); ring.rotation.set(-Math.PI / 2 + 0.35, 0, 0.45); pl.add(ring);
    var sunP = glow(0xfff2d0, 46); sunP.position.set(-600, 60, -300); pl.add(sunP);
    for (var m4 = 0; m4 < 4; m4++) { var gm = new T.Mesh(new T.SphereGeometry(1.1 + m4 * 0.25, 24, 12), new T.MeshStandardMaterial({ color: [0xd9b35f, 0xd8d0c0, 0xa49b8a, 0x8f8578][m4], roughness: 1 })); gm.position.set(28 + 62 + m4 * 14, -8 + (m4 % 2 ? 4 : -3), -175 + m4 * 9); pl.add(gm); }
    pl.userData.spin = function (dt) { jup.rotation.y += dt * 0.02; };
    G.planets = pl;

    // IV 太阳系边疆:柯伊伯带
    var edge = new T.Group();
    edge.add(points(Math.round(5000 * lowN), function (i, c) {
      var a = Math.random() * Math.PI * 2, r = rnd(160, 420), y = gauss() * 18;
      c.setHSL(0.58, 0.15, rnd(0.45, 0.8)); return [Math.cos(a) * r, y - 20, Math.sin(a) * r - 260];
    }, 2.2));
    var pluto = planet('planet-pluto.jpg', 5, 48); pluto.position.set(-24, -6, -70); edge.add(pluto);
    var sunE = glow(0xfff4dc, 26); sunE.position.set(0, -20, -260); edge.add(sunE);
    var comet = glow(0xbfe8ff, 10); comet.position.set(60, 26, -140); edge.add(comet);
    var tail = new T.Mesh(new T.ConeGeometry(3, 46, 16, 1, true), new T.MeshBasicMaterial({ color: 0x9fd8ff, transparent: true, opacity: 0.07, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide }));
    tail.position.set(78, 34, -136); tail.rotation.z = Math.PI / 2 + 0.35; edge.add(tail);
    edge.userData.spin = function (dt) { pluto.rotation.y += dt * 0.01; };
    G.edge = edge;

    // V 群星:近邻恒星 + 真实星云影像
    var st = new T.Group();
    st.add(points(Math.round(6000 * lowN), function (i, c) {
      var r = rnd(80, 900), th = Math.random() * Math.PI * 2, ph = Math.acos(rnd(-1, 1));
      var k = Math.random(); c.setHSL(k < 0.2 ? 0.02 : k < 0.5 ? 0.11 : 0.6, k < 0.5 ? 0.6 : 0.3, rnd(0.6, 0.95));
      return [r * Math.sin(ph) * Math.cos(th), r * Math.cos(ph), r * Math.sin(ph) * Math.sin(th)];
    }, 3.2));
    var aA = glow(0xfff1c8, 16); aA.position.set(-30, 8, -120); st.add(aA);
    var aB = glow(0xffd7a0, 11); aB.position.set(-18, 4, -124); st.add(aB);
    var prox = glow(0xff7a5a, 12); prox.position.set(16, -10, -60); st.add(prox);
    var cliffs = softEdge('sv-cliffs.jpg', 520, 300, 0.85); cliffs.position.set(120, 70, -760); cliffs.lookAt(0, 0, 0); st.add(cliffs);
    var pillars = softEdge('sv-pillars.jpg', 260, 260, 0.75); pillars.position.set(-380, -40, -620); pillars.lookAt(0, 0, 0); st.add(pillars);
    G.stars = st;

    // VI 银河:旋臂粒子(从银河系外俯瞰)
    var gal = new T.Group();
    var NG = Math.round(60000 * lowN), arms = 4;
    var galPts = points(NG, function (i, c) {
      var core = Math.random() < 0.22;
      if (core) { var r0 = Math.abs(gauss()) * 40; var a0 = Math.random() * Math.PI * 2; c.setHSL(0.1, 0.5, rnd(0.6, 0.85)); return [Math.cos(a0) * r0 * 1.6, gauss() * 10, Math.sin(a0) * r0]; }
      var arm = i % arms, r = Math.pow(Math.random(), 0.75) * 300 + 20;
      var a = arm / arms * Math.PI * 2 + Math.log(r / 20) * 2.1 + gauss() * 0.28;
      var blue = Math.random() < 0.55; c.setHSL(blue ? 0.6 : 0.08, blue ? 0.55 : 0.4, rnd(0.55, 0.85));
      return [Math.cos(a) * r + gauss() * 8, gauss() * (6 + 30 / (1 + r / 40)), Math.sin(a) * r + gauss() * 8];
    }, 1.9, null, { opacity: 0.75 });
    var galG = new T.Group(); galG.add(galPts); galG.position.set(0, -70, -560); galG.rotation.x = 0.55; gal.add(galG);
    var bulge = glow(0xffd9a0, 150, 0.55); galG.add(bulge);
    var you = new T.Group(); var ym = glow(0x7fe3ff, 14); you.add(ym); you.position.set(-180, 0, 120); galG.add(you); FX.youMarker = you;
    gal.userData.spin = function (dt) { galG.rotation.y += dt * 0.012; };
    G.galaxy = gal;

    // VII 宇宙:星系群 + 宇宙网 + 韦布深场影像
    var cos = new T.Group();
    var deep = softEdge('sv-deepfield.jpg', 1400, 1430, 0.9); deep.position.set(0, 0, -1300); cos.add(deep);
    var nodes = []; for (var k = 0; k < 26; k++) nodes.push(new T.Vector3(rnd(-700, 700), rnd(-380, 380), rnd(-1100, -200)));
    cos.add(points(Math.round(14000 * lowN), function (i, c) {
      var a = nodes[(Math.random() * nodes.length) | 0], b = nodes[(Math.random() * nodes.length) | 0], t = Math.random();
      if (a.distanceTo(b) > 600) b = a; var p = a.clone().lerp(b, t);
      c.setHSL(rnd(0.55, 0.75), 0.6, rnd(0.35, 0.7)); return [p.x + gauss() * 14, p.y + gauss() * 14, p.z + gauss() * 14];
    }, 3.4));
    var andro = new T.Group(); var ac = glow(0xffe6c0, 34, 0.7); andro.add(ac);
    andro.add(points(Math.round(5000 * lowN), function (i, c) { var r = Math.abs(gauss()) * 60, a = Math.random() * 6.283; c.setHSL(0.1, 0.35, rnd(0.5, 0.8)); return [Math.cos(a) * r * 2.4, gauss() * 4, Math.sin(a) * r * 0.9]; }, 1.6, null, { opacity: 0.6 }));
    andro.position.set(-60, 20, -340); andro.rotation.set(0.5, 0.3, 0.75); cos.add(andro);
    for (var gx = 0; gx < 40; gx++) { var gs = glow(new T.Color().setHSL(rnd(0.05, 0.65), 0.4, 0.75), rnd(6, 22), 0.7); gs.position.set(rnd(-600, 600), rnd(-320, 320), rnd(-1000, -300)); cos.add(gs); }
    G.cosmos = cos;

    // ∞ 猜想:多重宇宙气泡(抽象表达,非观测)
    var out = new T.Group();
    var bubMat = function (h) {
      return new T.ShaderMaterial({
        uniforms: { t: { value: 0 }, h: { value: h } },
        vertexShader: 'varying vec3 vN; varying vec3 vV; varying vec3 vP; void main(){ vP = position; vec4 mv = modelViewMatrix*vec4(position,1.); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }',
        fragmentShader: 'uniform float t; uniform float h; varying vec3 vN; varying vec3 vV; varying vec3 vP;' +
          'vec3 hsv(float h,float s,float v){ vec3 k = clamp(abs(mod(h*6.+vec3(0.,4.,2.),6.)-3.)-1.,0.,1.); return v*mix(vec3(1.),k,s); }' +
          'void main(){ float f = pow(1.0-abs(dot(vN,vV)),2.2); float w = 0.5+0.5*sin(vP.x*0.15+t)*sin(vP.y*0.17-t*0.7)*sin(vP.z*0.13+t*0.4);' +
          ' vec3 c = hsv(h+0.08*w, 0.55, 1.0); gl_FragColor = vec4(c*(f*1.4+w*0.12), f*0.9+w*0.06); }',
        transparent: true, blending: T.AdditiveBlending, depthWrite: false
      });
    };
    var bubs = [];
    for (var b = 0; b < 9; b++) { var r = b === 0 ? 120 : rnd(20, 70); var mb = new T.Mesh(new T.SphereGeometry(r, 48, 24), bubMat(rnd(0.5, 0.85))); mb.position.set(b === 0 ? 0 : rnd(-500, 500), b === 0 ? -20 : rnd(-260, 260), b === 0 ? -360 : rnd(-1000, -420)); out.add(mb); bubs.push(mb); }
    out.add(points(Math.round(3000 * lowN), function (i, c) { c.setHSL(rnd(0.6, 0.85), 0.5, rnd(0.4, 0.8)); return [rnd(-900, 900), rnd(-500, 500), rnd(-1200, -100)]; }, 2.2));
    out.userData.spin = function (dt, t) { for (var i = 0; i < bubs.length; i++) { bubs[i].material.uniforms.t.value = t * 0.4 + i; bubs[i].rotation.y += dt * 0.02; } };
    G.outer = out;

    Object.keys(G).forEach(function (k) { G[k].visible = false; scene.add(G[k]); });
    FX.G = G;
    FX.buildWarp(scene, lowN);
    return G;
  };

  FX.show = function (id) {
    Object.keys(FX.G).forEach(function (k) { FX.G[k].visible = k === id; });
    FX.sky.material.color.set(id === 'outer' ? 0x161226 : id === 'cosmos' ? 0x202028 : id === 'galaxy' ? 0x14141c : 0x8a8a9a);
    FX.cur = id;
  };

  /* ============================ 穿梭特效 ============================ */
  var ENG_COLOR = { chem: 0xffa060, ion: 0x6fb7ff, assist: 0xd8c08a, sail: 0xfff1b0, fusion: 0xffe08a, laser: 0xff6fa8, rel: 0xbfe3ff, warp: 0xa98bff, gate: 0x7fffe0, mind: 0xffffff };
  FX.buildWarp = function (scene, lowN) {
    var n = Math.round(2600 * lowN), pos = new Float32Array(n * 6), seed = new Float32Array(n * 2);
    for (var i = 0; i < n; i++) { var a = Math.random() * 6.283, r = rnd(4, 60), z = rnd(-400, 0); seed[i * 2] = a; seed[i * 2 + 1] = r;
      pos[i * 6] = pos[i * 6 + 3] = Math.cos(a) * r; pos[i * 6 + 1] = pos[i * 6 + 4] = Math.sin(a) * r; pos[i * 6 + 2] = z; pos[i * 6 + 5] = z - 1; }
    var g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos, 3));
    var m = new T.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false });
    var lines = new T.LineSegments(g, m); lines.frustumCulled = false; scene.add(lines);
    // 隧道(曲率/虫洞)
    var tun = new T.Mesh(new T.CylinderGeometry(26, 26, 900, 48, 1, true), new T.ShaderMaterial({
      uniforms: { t: { value: 0 }, c: { value: new T.Color(0xa98bff) }, a: { value: 0 }, mode: { value: 0 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
      fragmentShader: 'uniform float t; uniform vec3 c; uniform float a; uniform float mode; varying vec2 vUv;' +
        'void main(){ float ang = vUv.x*6.2832; float s = mode > 0.5 ? sin(ang*3. + vUv.y*60. - t*9.) : sin(vUv.y*90. - t*14.);' +
        ' float k = smoothstep(0.55,1.0,s) + 0.25*smoothstep(0.0,1.0,sin(ang*8.+t*2.)); float fade = smoothstep(0.0,0.25,vUv.y)*smoothstep(1.0,0.6,vUv.y);' +
        ' gl_FragColor = vec4(c*k*1.5, k*a*fade); }',
      transparent: true, side: T.BackSide, blending: T.AdditiveBlending, depthWrite: false
    }));
    tun.rotation.x = Math.PI / 2; tun.position.z = -420; tun.visible = false; scene.add(tun);
    FX.warp = { lines: lines, seed: seed, n: n, tun: tun, speed: 0, len: 1, on: 0, eng: null, t: 0 };
  };
  FX.setWarp = function (engId, on) { var W = FX.warp; W.eng = engId; W.target = on; var col = ENG_COLOR[engId] || 0xffffff; W.lines.material.color.set(col); W.tun.material.uniforms.c.value.set(col); W.tun.material.uniforms.mode.value = engId === 'gate' ? 1 : 0; };
  FX.update = function (dt, t, cam) {
    var G = FX.G; if (G && FX.cur && G[FX.cur] && G[FX.cur].userData.spin) G[FX.cur].userData.spin(dt, t);
    var W = FX.warp; if (!W) return;
    W.on += ((W.target ? 1 : 0) - W.on) * Math.min(1, dt * 1.6);
    var e = W.eng, base = { chem: 60, ion: 90, assist: 140, sail: 110, fusion: 260, laser: 320, rel: 520, warp: 700, gate: 600, mind: 30 }[e] || 100;
    var spd = base * W.on, len = 1 + (e === 'rel' || e === 'warp' ? 60 : e === 'laser' || e === 'fusion' ? 26 : 8) * W.on;
    var p = W.lines.geometry.attributes.position.array;
    for (var i = 0; i < W.n; i++) { var j = i * 6; var z = p[j + 2] + spd * dt; if (z > 2) { z -= 400; } p[j + 2] = z; p[j + 5] = z - len; }
    W.lines.geometry.attributes.position.needsUpdate = true;
    W.lines.material.opacity = Math.min(0.9, W.on * (e === 'mind' ? 0.3 : 0.85));
    var tunOn = (e === 'warp' || e === 'gate') ? W.on : 0;
    W.tun.visible = tunOn > 0.02; W.tun.material.uniforms.a.value = tunOn * 0.9; W.tun.material.uniforms.t.value = t;
    if (cam) { W.lines.position.copy(cam.position); W.tun.position.set(cam.position.x, cam.position.y, cam.position.z - 420); }
  };
})();
