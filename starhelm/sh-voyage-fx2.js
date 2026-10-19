/* 天枢 Starhelm · sh-voyage-fx2.js(M1.6a)
 * 一、每种引擎自己的穿梭画面。规则(王磊 10-19 确认):
 *     实测 / 推断引擎 = 真实物理画面;电影式「星光拉丝 / 隧道」只给「猜想」引擎,并标「艺术示意」。
 *     - 化学火箭 / 离子 / 核聚变:向前看,星空几乎不动(真实就是这么慢),只有尾焰照亮舱外与舱体震动
 *     - 引力弹射:一颗气态巨行星从舷窗外掠过
 *     - 太阳帆 / 激光光帆:前方展开的巨大帆面;激光帆被身后射来的激光照亮
 *     - 核聚变(0.1c)、激光光帆(0.2c)、近光速:按狭义相对论实时计算
 *         光行差  cosθ' = (cosθ + β) / (1 + β cosθ)   —— 星星向前方聚拢
 *         多普勒  D = 1 / (γ (1 − β cosθ'))           —— 前方蓝移变亮、后方红移变暗(亮度 ∝ D³,色温 ∝ D)
 * 二、舱外观景(未测绘星域 / 猜想外圈):镜头穿出舱外,环绕弦穹号外观,只多一个「回到舱内」按钮。
 * 全部程序生成,无外部素材。 */
(function () {
  'use strict';
  var SH = (window.SH = window.SH || {});
  var FX = SH.voyFx; if (!FX) return;
  var T = THREE;

  /* 每种引擎的画面说明(界面角标) */
  FX.ENG_LOOK = {
    chem: ['真实物理', '向前看星空几乎不动:化学火箭只有约 11 km/s'],
    ion: ['真实物理', '离子推力极小,要连续加速几个月'],
    assist: ['真实物理', '借行星引力「顺路」加速'],
    sail: ['真实物理', '太阳光压推动巨大的帆'],
    fusion: ['真实物理', '0.1 倍光速:星光开始向前聚拢(光行差)'],
    laser: ['真实物理', '0.2 倍光速:前方星光蓝移,后方红移'],
    rel: ['真实物理', '狭义相对论:光行差 + 多普勒,速度越快星空越往前缩'],
    warp: ['艺术示意', '曲率驱动只是猜想,画面为想象'],
    gate: ['艺术示意', '虫洞只是猜想,画面为想象'],
    mind: ['艺术示意', '思想实验:没有观测,只有推理']
  };
  FX.CINEMATIC = { warp: 1, gate: 1, mind: 1 };

  function glowTex(c0, c1) {
    var c = document.createElement('canvas'); c.width = c.height = 128; var g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, c0); gr.addColorStop(0.35, c1); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    var t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; return t;
  }
  function sprite(tex, s, color) {
    var m = new T.SpriteMaterial({ map: tex, color: color || 0xffffff, transparent: true, blending: T.AdditiveBlending, depthWrite: false, opacity: 0 });
    var sp = new T.Sprite(m); sp.scale.set(s, s, 1); return sp;
  }
  function bandTex() {   // 程序生成的气态巨行星条纹(示意,不是某颗真实行星)
    var c = document.createElement('canvas'); c.width = 512; c.height = 256; var g = c.getContext('2d');
    for (var y = 0; y < 256; y++) {
      var v = Math.sin(y * 0.09) * 0.5 + Math.sin(y * 0.031 + 1.7) * 0.35 + Math.sin(y * 0.23) * 0.15;
      var r = 200 + v * 30, gg = 170 + v * 28, b = 130 + v * 22; g.fillStyle = 'rgb(' + (r | 0) + ',' + (gg | 0) + ',' + (b | 0) + ')'; g.fillRect(0, y, 512, 1);
    }
    for (var i = 0; i < 260; i++) { g.fillStyle = 'rgba(255,240,220,' + (Math.random() * 0.08) + ')'; g.fillRect(Math.random() * 512, Math.random() * 256, 20 + Math.random() * 80, 1 + Math.random() * 2); }
    g.fillStyle = 'rgba(190,110,80,0.55)'; g.beginPath(); g.ellipse(340, 160, 26, 12, 0, 0, 6.283); g.fill();
    var t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; return t;
  }

  /* ============================ 一、引擎画面 ============================ */
  FX.buildEngines = function (scene, tier) {
    var E = FX.E = { g: new T.Group(), on: 0, eng: null, k: 0, beta: 0 };
    scene.add(E.g);
    // 尾焰辉光(在镜头下方边缘,模拟尾焰照亮船体)
    E.plume = sprite(glowTex('rgba(255,255,255,1)', 'rgba(255,170,90,0.5)'), 60);
    E.plume.position.set(0, -38, -60); E.g.add(E.plume);
    // 相对论星空
    var n = tier === 'low' ? 1800 : tier === 'mid' ? 3200 : 5000;
    var dir = new Float32Array(n * 3), mag = new Float32Array(n), temp = new Float32Array(n);
    for (var i = 0; i < n; i++) {
      var u = Math.random() * 2 - 1, a = Math.random() * 6.2832, s = Math.sqrt(1 - u * u);
      dir[i * 3] = s * Math.cos(a); dir[i * 3 + 1] = s * Math.sin(a); dir[i * 3 + 2] = u;
      mag[i] = Math.pow(Math.random(), 3.2); temp[i] = 3000 + Math.pow(Math.random(), 1.6) * 9000;
    }
    var g = new T.BufferGeometry();
    g.setAttribute('position', new T.BufferAttribute(new Float32Array(n * 3), 3));
    g.setAttribute('dir', new T.BufferAttribute(dir, 3)); g.setAttribute('mag', new T.BufferAttribute(mag, 1)); g.setAttribute('temp', new T.BufferAttribute(temp, 1));
    E.rel = new T.Points(g, new T.ShaderMaterial({
      uniforms: { b: { value: 0 }, a: { value: 0 }, fwd: { value: new T.Vector3(0, 0, -1) }, px: { value: Math.min(window.devicePixelRatio || 1, 2) } },
      vertexShader: [
        'attribute vec3 dir; attribute float mag; attribute float temp; uniform float b; uniform vec3 fwd; uniform float px;',
        'varying vec3 vC; varying float vI;',
        'vec3 bb(float t){ t = clamp(t, 1500., 40000.) / 100.; vec3 c;',   // 黑体色温近似(Tanner Helland 公式)
        ' c.r = t <= 66. ? 1. : clamp(1.293 * pow(t - 60., -0.1332), 0., 1.);',
        ' c.g = t <= 66. ? clamp(0.390 * log(t) - 0.632, 0., 1.) : clamp(1.130 * pow(t - 60., -0.0755), 0., 1.);',
        ' c.b = t >= 66. ? 1. : (t <= 19. ? 0. : clamp(0.543 * log(t - 10.) - 1.196, 0., 1.)); return c; }',
        'void main(){',
        ' float c = dot(dir, fwd); vec3 perp = dir - c * fwd; float pl = length(perp); perp = pl > 1e-5 ? perp / pl : vec3(1.,0.,0.);',
        ' float cp = (c + b) / (1. + b * c);',                               // 光行差
        ' vec3 d2 = cp * fwd + sqrt(max(0., 1. - cp * cp)) * perp;',
        ' float g = 1. / sqrt(max(1e-6, 1. - b * b)); float D = 1. / (g * (1. - b * cp));',   // 多普勒因子
        ' vC = bb(temp * D); vI = clamp((0.25 + mag * 1.6) * pow(D, 3.), 0., 6.);',
        ' vec4 mv = modelViewMatrix * vec4(d2 * 1500., 1.); gl_Position = projectionMatrix * mv;',
        ' gl_PointSize = clamp((1.2 + mag * 3.2) * (0.6 + 0.4 * min(vI, 3.)), 0.8, 9.) * px; }'
      ].join('\n'),
      fragmentShader: 'uniform float a; varying vec3 vC; varying float vI; void main(){ vec2 q = gl_PointCoord - .5; float r = dot(q,q); if (r > .25) discard; float k = exp(-r * 18.); gl_FragColor = vec4(vC * k * min(vI, 2.5), k * a * min(1., vI)); }',
      transparent: true, blending: T.AdditiveBlending, depthWrite: false
    }));
    E.rel.frustumCulled = false; E.rel.visible = false; E.g.add(E.rel);
    // 气态巨行星(引力弹射)
    var pl = new T.Mesh(new T.SphereGeometry(40, 48, 32), new T.MeshBasicMaterial({ map: bandTex() }));
    var shade = new T.Mesh(new T.SphereGeometry(40.4, 48, 32), new T.ShaderMaterial({   // 明暗交界:太阳在左后方
      uniforms: { s: { value: new T.Vector3(-0.8, 0.25, 0.55).normalize() } },
      vertexShader: 'varying vec3 vN; void main(){ vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
      fragmentShader: 'uniform vec3 s; varying vec3 vN; void main(){ float l = dot(vN, s); gl_FragColor = vec4(0.,0.,0., 1. - smoothstep(-0.15, 0.35, l)); }',
      transparent: true, depthWrite: false
    }));
    E.planet = new T.Group(); E.planet.add(pl); E.planet.add(shade); E.planet.visible = false; E.g.add(E.planet);
    // 帆(太阳帆 = 银色;激光帆 = 被激光照亮的粉白)
    var sailMat = new T.ShaderMaterial({
      uniforms: { t: { value: 0 }, c: { value: new T.Color(0xdfe6f0) }, a: { value: 0 }, lit: { value: 0 } },
      vertexShader: 'uniform float t; varying vec2 vUv; void main(){ vUv = uv; vec3 p = position; p.z += sin(uv.x*9. + t*1.3)*0.6*sin(uv.y*7. + t); gl_Position = projectionMatrix*modelViewMatrix*vec4(p,1.); }',
      fragmentShader: 'uniform float t; uniform vec3 c; uniform float a; uniform float lit; varying vec2 vUv;' +
        'void main(){ vec2 q = vUv - .5; float sheen = 0.35 + 0.65 * pow(max(0., sin((q.x + q.y) * 6. - t * .6)), 6.);' +
        ' float seam = smoothstep(0.012, 0.0, abs(abs(q.x) - abs(q.y)));' +
        ' float edge = smoothstep(0.5, 0.46, max(abs(q.x), abs(q.y)));' +
        ' vec3 col = c * (0.18 + sheen * 0.7) + seam * 0.25 + lit * vec3(1., .45, .7) * (1. - length(q) * 1.4);' +
        ' gl_FragColor = vec4(col, a * edge); }',
      transparent: true, side: T.DoubleSide, depthWrite: false
    });
    E.sail = new T.Mesh(new T.PlaneGeometry(120, 120, 24, 24), sailMat);
    E.sail.position.set(0, 26, -110); E.sail.rotation.set(0.35, 0, Math.PI / 4); E.sail.visible = false; E.g.add(E.sail);
    // 激光光柱(从身后的地球射来)
    E.beam = new T.Mesh(new T.CylinderGeometry(0.35, 0.35, 260, 8, 1, true), new T.MeshBasicMaterial({ color: 0xff6fa8, transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false }));
    E.beam.rotation.x = Math.PI / 2 - 0.12; E.beam.position.set(5, 14, -10); E.beam.visible = false; E.g.add(E.beam);
  };

  FX.engStart = function (id) { var E = FX.E; if (!E) return; E.eng = id; E.target = 1; E.k = 0; E.beta = 0; E.planet.visible = id === 'assist'; E.sail.visible = id === 'sail' || id === 'laser'; E.beam.visible = id === 'laser';
    E.sail.material.uniforms.c.value.set(id === 'laser' ? 0xf2e6ee : 0xdfe6f0); E.sail.scale.setScalar(id === 'laser' ? 0.35 : 1); E.sail.material.uniforms.lit.value = id === 'laser' ? 1 : 0;
    E.plume.material.color.set({ chem: 0xffa860, ion: 0x7fb9ff, fusion: 0xfff0c0 }[id] || 0xffffff);
  };
  FX.engStep = function (k, beta) { var E = FX.E; if (!E) return; E.k = k; E.beta = Math.max(0, Math.min(0.995, beta || 0)); };
  FX.engStop = function () { var E = FX.E; if (!E) return; E.target = 0; };

  FX.engUpdate = function (dt, t, cam) {
    var E = FX.E; if (!E) return;
    E.on += ((E.target ? 1 : 0) - E.on) * Math.min(1, dt * 1.8);
    if (cam) E.g.position.copy(cam.position);
    var id = E.eng, on = E.on;
    // 尾焰辉光
    var pl = { chem: 0.9 + Math.random() * 0.25, ion: 0.35, fusion: 0.8 + Math.sin(t * 22) * 0.12 }[id] || 0;
    E.plume.material.opacity = pl * on;
    // 相对论星空:只有达到可观测速度的引擎才显示变化(β 很小时与普通星空一样)
    var relOn = (id === 'fusion' || id === 'laser' || id === 'rel') ? on : 0;
    E.rel.visible = relOn > 0.01; E.rel.material.uniforms.a.value = relOn; E.rel.material.uniforms.b.value = E.beta * on;
    // 高速时隐藏原星域景象,避免两套星空不一致
    var hideBg = relOn > 0.5 && E.beta > 0.3;
    if (FX.G && FX.cur && FX.G[FX.cur]) FX.G[FX.cur].visible = !hideBg;
    if (FX.sky) FX.sky.visible = !hideBg;
    // 引力弹射:行星从右前方远处 → 左侧近处掠过
    if (E.planet.visible) {
      var p = Math.max(0, Math.min(1, (E.k - 0.08) / 0.6)), s = p * p * (3 - 2 * p);
      E.planet.position.set(90 - 230 * s, -18 + 8 * s, -420 + 400 * s); E.planet.rotation.y = t * 0.05;
      E.planet.children.forEach(function (m) { if (m.material.opacity !== undefined) { m.material.transparent = true; } });
      E.planet.visible = on > 0.02 || p < 1;
      if (on < 0.02 && E.k > 0.95) E.planet.visible = false;
    }
    if (E.sail.visible) { E.sail.material.uniforms.a.value = Math.min(1, on * 1.2); E.sail.material.uniforms.t.value = t; if (on < 0.02 && !E.target) E.sail.visible = false; }
    if (E.beam.visible) { E.beam.material.opacity = on * (0.55 + Math.sin(t * 40) * 0.08); if (on < 0.02 && !E.target) E.beam.visible = false; }
  };

  /* ============================ 二、舱外观景 ============================ */
  /* 弦穹号外观 v2(王磊 10-20 选概念图 B「流形曲面」):
   * 珍珠白复合材料 + 石墨下腹,两道鎏金接缝沿船体扭转半圈(致敬卡拉比–丘流形 / 莫比乌斯带);
   * 水滴形座舱;尾部四台聚变喷口;中段曲率环 = 「猜想」装置,平时微光,只在曲率引擎时点亮。 */
  var PROF = [[0, -5], [0.95, -5], [1.2, -4.3], [1.36, -2.6], [1.34, -0.6], [1.2, 1.4], [0.94, 3.1], [0.55, 4.35], [0.18, 5.0], [0, 5.15]];
  function profR(y) { for (var i = 1; i < PROF.length; i++) { if (y <= PROF[i][1]) { var a = PROF[i - 1], b = PROF[i], k = (y - a[1]) / (b[1] - a[1] || 1); return a[0] + (b[0] - a[0]) * k; } } return 0; }
  var FLAT = 0.58;
  function seam(a0, twist, off, rad, mat) {
    var pts = [];
    for (var i = 0; i <= 90; i++) { var y = -4.9 + 9.6 * i / 90, r = profR(y) * 1.012 + off, a = a0 + twist * (i / 90); pts.push(new T.Vector3(Math.cos(a) * r, Math.sin(a) * r * FLAT, -y)); }
    return new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 220, rad, 6), mat);
  }
  function shipModel() {
    var g = new T.Group();
    var pearl = new T.MeshPhysicalMaterial({ color: 0xe6e4e0, roughness: 0.28, metalness: 0.1, clearcoat: 0.8, clearcoatRoughness: 0.15 });
    var graph = new T.MeshStandardMaterial({ color: 0x24272d, roughness: 0.4, metalness: 0.7 });
    var gold = new T.MeshStandardMaterial({ color: 0xd2a75e, roughness: 0.22, metalness: 1, emissive: 0x7a5418, emissiveIntensity: 0.55 });
    var lathe = new T.LatheGeometry(PROF.map(function (p) { return new T.Vector2(p[0], p[1]); }), 72);
    var hull = new T.Mesh(lathe, pearl); hull.rotation.x = -Math.PI / 2; hull.scale.z = FLAT; g.add(hull);
    // 石墨下腹:略小一圈的同形壳体下移,形成上白下黑的两色分割
    var belly = new T.Mesh(lathe, graph); belly.rotation.x = -Math.PI / 2; belly.scale.set(0.97, 0.9, FLAT * 0.98); belly.position.y = -0.1; g.add(belly);
    // 鎏金扭转接缝(两道,各扭半圈)+ 石墨饰带
    g.add(seam(0.35, Math.PI, 0, 0.028, gold)); g.add(seam(0.35 + Math.PI, Math.PI, 0, 0.028, gold));
    g.add(seam(0.6, Math.PI, -0.004, 0.06, graph)); g.add(seam(0.6 + Math.PI, Math.PI, -0.004, 0.06, graph));
    // 水滴形座舱
    var canopy = new T.Mesh(new T.SphereGeometry(1, 40, 24), new T.MeshPhysicalMaterial({ color: 0x0a121c, roughness: 0.05, metalness: 0.3, clearcoat: 1, emissive: 0x4a3218, emissiveIntensity: 0.5 }));
    canopy.scale.set(0.72, 0.36, 1.7); canopy.position.set(0, 0.5, -2.7); g.add(canopy);
    var cf = new T.Mesh(new T.TorusGeometry(1, 0.025, 6, 80), gold); cf.scale.set(0.73, 1.72, 1); cf.rotation.x = Math.PI / 2; cf.position.set(0, 0.5, -2.7); g.add(cf);
    // 尾部四台聚变喷口 + 磁喷管辉光
    var glow = new T.MeshBasicMaterial({ color: 0x8fc8ff, toneMapped: false });
    [[-0.42, 0.2], [0.42, 0.2], [-0.42, -0.25], [0.42, -0.25]].forEach(function (p) {
      var nz = new T.Mesh(new T.CylinderGeometry(0.22, 0.32, 0.7, 20, 1, true), graph); nz.rotation.x = Math.PI / 2; nz.position.set(p[0], p[1], 5.25); g.add(nz);
      var c = new T.Mesh(new T.CircleGeometry(0.2, 20), glow); c.position.set(p[0], p[1], 5.2); g.add(c);
      var rr = new T.Mesh(new T.TorusGeometry(0.32, 0.018, 6, 30), gold); rr.position.set(p[0], p[1], 5.6); g.add(rr);
    });
    // 曲率环(猜想装置)+ 两根支架
    var ringMat = new T.MeshStandardMaterial({ color: 0x3a3848, roughness: 0.35, metalness: 0.8, emissive: 0xa98bff, emissiveIntensity: 0.25 });
    var ring = new T.Mesh(new T.TorusGeometry(2.7, 0.07, 12, 120), ringMat); ring.position.z = 0.6; g.add(ring);
    var halo = new T.Mesh(new T.TorusGeometry(2.7, 0.22, 8, 120), new T.MeshBasicMaterial({ color: 0xb69cff, transparent: true, opacity: 0.08, blending: T.AdditiveBlending, depthWrite: false })); halo.position.z = 0.6; g.add(halo);
    [1, -1].forEach(function (s) { var py = new T.Mesh(new T.BoxGeometry(0.08, 1.9, 0.5), pearl); py.position.set(0, s * 1.75, 0.6); g.add(py); });
    g.userData.warp = { mat: ringMat, halo: halo };
    // 航行灯
    var nl = new T.Mesh(new T.SphereGeometry(0.07, 8, 8), new T.MeshBasicMaterial({ color: 0xff3b3b })); nl.position.set(-1.33, 0, -0.6); g.add(nl);
    var nr = new T.Mesh(new T.SphereGeometry(0.07, 8, 8), new T.MeshBasicMaterial({ color: 0x3bff7a })); nr.position.set(1.33, 0, -0.6); g.add(nr); g.userData.blink = [nl, nr];
    // 本组灯光
    var sun = new T.DirectionalLight(0xfff4e6, 1.15); sun.position.set(-30, 18, 20); g.add(sun);
    g.add(new T.HemisphereLight(0x9fb8ff, 0x101018, 0.3));
    var rim = new T.PointLight(0xb69cff, 0.6, 12); rim.position.set(0, 0, 0.6); g.add(rim); g.userData.rim = rim;
    return g;
  }
  /* 曲率环亮度:0 = 平时微光,1 = 曲率引擎点亮 */
  FX.warpRing = function (k) { var w = FX.ship && FX.ship.userData.warp; if (!w) return; w.mat.emissiveIntensity = 0.25 + 2.2 * k; w.halo.material.opacity = 0.08 + 0.5 * k; FX.ship.userData.rim.intensity = 0.6 + 2 * k; };
  FX.setShipEnv = function (env) { if (!FX.ship) return; FX.ship.traverse(function (o) { if (o.material && o.material.isMeshStandardMaterial) { o.material.envMap = env; o.material.envMapIntensity = 0.35; o.material.needsUpdate = true; } }); };
  FX.buildShip = function (scene) { FX.ship = shipModel(); FX.ship.visible = false; scene.add(FX.ship); FX.eva = { on: false, k: 0, ang: 0 }; };
  FX.evaSet = function (on) { if (!FX.eva) return; FX.eva.on = on; FX.eva.last = 0; FX.eva.warp = 0; FX.eva.warpT = 0; if (on) { FX.eva.k = 0; FX.eva.ang = 0; FX.ship.visible = true; } };
  /* 舱外相机:先从舱顶后撤升起,再缓慢环绕;鼠标/手指可微调视角 */
  FX.evaUpdate = function (dt, t, cam, mx, my) {
    var V = FX.eva; if (!V) return false;
    var now = performance.now() / 1000, rd = Math.min(0.25, now - (V.last || now)); V.last = now;   // 用真实时间推进,低帧率设备也按时到位
    V.k = Math.max(0, Math.min(1, V.k + (V.on ? rd / 4.5 : -rd / 2.2)));
    if (!V.on && V.k <= 0) { FX.ship.visible = false; return false; }
    var e = V.k * V.k * (3 - 2 * V.k); V.ang += rd * 0.07 * e;
    var R = 1.2 + 15 * e, a = 0.5 + V.ang + (mx || 0) * 0.6, y = 0.9 + 4.5 * e + (my || 0) * 3;
    cam.position.set(Math.sin(a) * R, y, -3.8 + Math.cos(a) * R * (0.4 + 0.6 * e) + 3.8 * e);
    var look = new T.Vector3(0, 0, -2 * (1 - e));
    cam.lookAt(look);
    // 抵达后让镜头略偏向前方星域
    cam.rotateY(-0.25 * e * Math.sin(a)); cam.rotateX(0.05 * e);
    FX.warpRing(V.warp ? Math.min(1, (V.warpT = (V.warpT || 0) + rd) / 0.8) : 0.05 + 0.05 * Math.sin(t * 1.5));   // 平时微光呼吸;曲率点火时亮起
    var bl = FX.ship.userData.blink; if (bl) { var on = (t % 1.6) < 0.12; bl[0].visible = bl[1].visible = on; }
    return true;
  };
})();
