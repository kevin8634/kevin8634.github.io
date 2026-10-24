/* 宙律 Nomoverse · 声音任务 3D 舞台(v0.4-α2 · 方案 B「夜间城市街景」)
   只负责「画」:夜色街道、楼宇灯窗、路灯与湿路倒影、救护车与警灯、听者、地面声波圈。
   物理仍由关卡 2D 逻辑(NV.Phys.retarded / receivedFreq / doppler)计算;频率曲线、示波器、标签留在透明 2D 画布。
   坐标:1 场景单位 = 1 m;关卡 (x, y) m → 场景 (x, 0, −y)。街道沿 x 轴,听者在 y = −20(靠近镜头一侧)。
   两种镜头:street(第 2、3 关:俯看整条街,声波圈画在路面)、city(第 1、4 关:街景作背景,路灯随拍频呼吸)。
   贴图全部程序生成(零外部请求);低档/手机关闭倒影光晕与雾中光柱。 */
"use strict";
import { tierInfo, createRenderer, canvasTex, glowTex } from "./nvscene.js";

var FOV = 38, ELEV = 34 * Math.PI / 180, RING_MAX = 72;

export function mount(THREE, canvas, opts) {
  opts = opts || {};
  var T = tierInfo(), hi = T.tier === "high", lite = T.tier === "low" || T.mobile;
  var renderer = createRenderer(THREE, { canvas: canvas, alpha: false, clear: 0x07061a, onLost: opts.onLost });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  var scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x0b0a24, 120, 520);
  var cam = new THREE.PerspectiveCamera(FOV, 1, 0.5, 3000);
  var disposables = [];
  function keep(x) { disposables.push(x); return x; }

  /* ---------- 天空:渐变穹顶 + 稀疏星 ---------- */
  var skyTex = keep(canvasTex(THREE, 8, 256, function (c, w, h) {
    var g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#05041a"); g.addColorStop(0.55, "#120d3a"); g.addColorStop(0.8, "#2a1650"); g.addColorStop(1, "#3b1d55");
    c.fillStyle = g; c.fillRect(0, 0, w, h);
  }));
  skyTex.colorSpace = THREE.SRGBColorSpace;
  var sky = new THREE.Mesh(new THREE.SphereGeometry(1500, 32, 16), new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, fog: false, depthWrite: false }));
  sky.renderOrder = -3; scene.add(sky);

  /* ---------- 地面:湿沥青 + 人行道 ---------- */
  var roadTex = keep(canvasTex(THREE, 512, 512, function (c, w, h) {
    c.fillStyle = "#2a2650"; c.fillRect(0, 0, w, h);
    var s = 3; function rnd() { s = (s * 16807) % 2147483647; return s / 2147483647; }
    for (var i = 0; i < 2600; i++) { var v = 18 + rnd() * 26 | 0; c.fillStyle = "rgba(" + v + "," + v + "," + (v + 14) + ",.5)"; c.fillRect(rnd() * w, rnd() * h, 2, 2); }
    for (var k = 0; k < 9; k++) { c.fillStyle = "rgba(90,80,170,.10)"; c.beginPath(); c.ellipse(rnd() * w, rnd() * h, 30 + rnd() * 50, 10 + rnd() * 20, 0, 0, 7); c.fill(); }
  }));
  roadTex.wrapS = roadTex.wrapT = THREE.RepeatWrapping; roadTex.repeat.set(40, 2); roadTex.colorSpace = THREE.SRGBColorSpace;
  var roadMat = keep(new THREE.MeshStandardMaterial({ map: roadTex, color: 0xffffff, roughness: 0.32, metalness: 0.35, emissive: 0x1a1640 }));
  var road = new THREE.Mesh(new THREE.PlaneGeometry(1200, 18), roadMat); road.rotation.x = -Math.PI / 2; scene.add(road);
  var walkMat = keep(new THREE.MeshStandardMaterial({ color: 0x2a2752, roughness: 0.6, metalness: 0.1 }));
  [[-9 - 3.5, 7], [9 + 3.5, 7]].forEach(function (p) { var m = new THREE.Mesh(new THREE.BoxGeometry(1200, 0.25, p[1]), walkMat); m.position.set(0, 0.12, p[0]); scene.add(m); });
  var lotMat = keep(new THREE.MeshStandardMaterial({ color: 0x100e24, roughness: 0.9 }));
  var lot = new THREE.Mesh(new THREE.PlaneGeometry(1400, 900), lotMat); lot.rotation.x = -Math.PI / 2; lot.position.y = -0.05; scene.add(lot);
  // 车道中线
  var dashTex = keep(canvasTex(THREE, 64, 8, function (c, w, h) { c.fillStyle = "rgba(0,0,0,0)"; c.clearRect(0, 0, w, h); c.fillStyle = "#e9e5ff"; c.fillRect(0, 0, w * 0.55, h); }));
  dashTex.wrapS = THREE.RepeatWrapping; dashTex.repeat.set(1200 / 6, 1);
  var dash = new THREE.Mesh(new THREE.PlaneGeometry(1200, 0.25), new THREE.MeshBasicMaterial({ map: dashTex, transparent: true, opacity: 0.55, depthWrite: false }));
  dash.rotation.x = -Math.PI / 2; dash.position.y = 0.02; scene.add(dash);
  // 路缘霓虹线(紫),让俯视时街道轮廓清楚
  var curbMat = keep(new THREE.MeshBasicMaterial({ color: 0x8b6cf6, transparent: true, opacity: 0.75, depthWrite: false, blending: THREE.AdditiveBlending }));
  [-9, 9].forEach(function (z) { var m = new THREE.Mesh(new THREE.PlaneGeometry(1200, 0.5), curbMat); m.rotation.x = -Math.PI / 2; m.position.set(0, 0.27, z); scene.add(m); });

  /* ---------- 楼宇:街道远侧两排 + 灯窗 ---------- */
  var winTex = keep(canvasTex(THREE, 128, 256, function (c, w, h) {
    c.fillStyle = "#0e0c26"; c.fillRect(0, 0, w, h);
    var s = 17; function rnd() { s = (s * 16807) % 2147483647; return s / 2147483647; }
    for (var y = 6; y < h - 6; y += 14) for (var x = 6; x < w - 6; x += 12) {
      var r = rnd();
      c.fillStyle = r < 0.42 ? (rnd() < 0.7 ? "#ffd28a" : "#9ad7ff") : r < 0.5 ? "#c4b5fd" : "#1a1838";
      c.fillRect(x, y, 7, 8);
    }
  }));
  winTex.wrapS = winTex.wrapT = THREE.RepeatWrapping; winTex.colorSpace = THREE.SRGBColorSpace;
  var bldG = new THREE.Group(); scene.add(bldG);
  (function () {
    var s = 29; function rnd() { s = (s * 16807) % 2147483647; return s / 2147483647; }
    var n = hi ? 70 : 44, mats = [];
    for (var m = 0; m < 4; m++) {
      var t = winTex.clone(); t.needsUpdate = true; t.offset.set(rnd(), rnd()); keep(t);
      mats.push(keep(new THREE.MeshStandardMaterial({ color: [0x1c1940, 0x231d4c, 0x181634, 0x2a2058][m], emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.5, roughness: 0.8 })));
    }
    for (var row = 0; row < 2; row++) {
      var x = -420;
      while (x < 420) {
        var w = 14 + rnd() * 22, d = 12 + rnd() * 10, h = (row ? 30 : 14) + rnd() * (row ? 70 : 34);
        var mat = mats[(rnd() * 4) | 0], geo = new THREE.BoxGeometry(w, h, d);
        var b = new THREE.Mesh(geo, mat); b.position.set(x + w / 2, h / 2, -(row ? 62 : 26) - d / 2 - rnd() * 6);
        // 每栋楼的窗格密度按尺寸重复
        var uv = geo.attributes.uv; for (var i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w / 10, uv.getY(i) * h / 12);
        bldG.add(b); x += w + 1 + rnd() * 4;
        if (n-- < 0 && row === 1) break;
      }
    }
  })();

  /* ---------- 路灯(远侧人行道)+ 光晕 + 湿路倒影 ---------- */
  var gTex = keep(glowTex(THREE));
  var poleMat = keep(new THREE.MeshStandardMaterial({ color: 0x3a3566, roughness: 0.5, metalness: 0.6 }));
  var lampMat = keep(new THREE.MeshBasicMaterial({ color: 0xffe2a8 }));
  var lamps = [], LAMP_DX = 40;
  for (var lx = -400; lx <= 400; lx += LAMP_DX) {
    var g = new THREE.Group(); g.position.set(lx, 0, -13);
    var pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 8, 8), poleMat); pole.position.y = 4; g.add(pole);
    var arm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 2.2), poleMat); arm.position.set(0, 8, 1.1); g.add(arm);
    var bulb = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), lampMat); bulb.position.set(0, 7.85, 2.1); g.add(bulb);
    var halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: gTex, color: 0xffc77a, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending }));
    halo.scale.set(9, 9, 1); halo.position.copy(bulb.position); g.add(halo);
    var refl = null;
    if (!lite) {
      refl = new THREE.Sprite(new THREE.SpriteMaterial({ map: gTex, color: 0xffb35c, transparent: true, opacity: 0.22, depthWrite: false, blending: THREE.AdditiveBlending }));
      refl.scale.set(3.5, 14, 1); refl.position.set(0, 0.05, 6.5); g.add(refl);
    }
    scene.add(g); lamps.push({ halo: halo, refl: refl, x: lx });
  }
  var hemi = new THREE.HemisphereLight(0x6a5fc0, 0x120e22, 0.75); scene.add(hemi);
  var moon = new THREE.DirectionalLight(0x9aa6ff, 0.55); moon.position.set(-60, 120, 80); scene.add(moon);
  var lampLights = [];
  for (var li = 0; li < (hi ? 5 : 3); li++) { var pl = new THREE.PointLight(0xffc27a, 60, 45, 1.6); pl.position.set(0, 7.8, -11); scene.add(pl); lampLights.push(pl); }

  /* ---------- 救护车 ---------- */
  var car = new THREE.Group(); scene.add(car);
  var white = keep(new THREE.MeshStandardMaterial({ color: 0xf4f2ff, roughness: 0.4, metalness: 0.2 }));
  var red = keep(new THREE.MeshStandardMaterial({ color: 0xe03a3a, roughness: 0.5, emissive: 0x400808 }));
  var glass = keep(new THREE.MeshStandardMaterial({ color: 0x1b2340, roughness: 0.15, metalness: 0.8 }));
  var tyre = keep(new THREE.MeshStandardMaterial({ color: 0x0d0c18, roughness: 0.9 }));
  function box(w, h, d, x, y, z, m) { var b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); car.add(b); return b; }
  box(5.2, 2.3, 2.3, -0.5, 1.75, 0, white);                // 车厢
  box(1.9, 1.6, 2.2, 2.9, 1.4, 0, white);                  // 车头
  box(0.08, 0.9, 2.0, 3.86, 1.75, 0, glass);              // 挡风
  box(5.25, 0.32, 2.34, -0.5, 1.35, 0, red);              // 红色腰线
  box(0.9, 0.9, 0.04, -0.6, 2.05, 1.17, red); box(0.3, 0.9 * 0.34, 0.05, -0.6, 2.05, 1.18, white);
  [-2.2, 1.0, 2.9].forEach(function (x) { [-1.05, 1.05].forEach(function (z) { var t = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.3, 14), tyre); t.rotation.x = Math.PI / 2; t.position.set(x, 0.42, z); car.add(t); }); });
  var barR = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.22, 0.9), new THREE.MeshBasicMaterial({ color: 0xff3b3b })); barR.position.set(1.0, 3.02, -0.5); car.add(barR);
  var barB = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.22, 0.9), new THREE.MeshBasicMaterial({ color: 0x3b82ff })); barB.position.set(1.0, 3.02, 0.5); car.add(barB);
  var sirenGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: gTex, color: 0xff3b3b, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending }));
  sirenGlow.scale.set(10, 10, 1); sirenGlow.position.set(1.0, 3.1, 0); car.add(sirenGlow);
  var sirenLight = new THREE.PointLight(0xff3b3b, 80, 40, 1.5); sirenLight.position.set(1, 3.4, 0); car.add(sirenLight);
  var head = new THREE.SpotLight(0xfff3d6, 120, 60, 0.45, 0.6, 1.4); head.position.set(3.9, 1.0, 0); head.target.position.set(20, 0, 0); car.add(head); car.add(head.target);

  /* ---------- 听者 ---------- */
  var man = new THREE.Group(); scene.add(man);
  var coat = keep(new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.6, emissive: 0x3a2a05 }));
  var skin = keep(new THREE.MeshStandardMaterial({ color: 0xc58b62, roughness: 0.7 }));
  var torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.32, 0.9, 6, 12), coat); torso.position.y = 1.25; man.add(torso);
  var hd = new THREE.Mesh(new THREE.SphereGeometry(0.24, 14, 10), skin); hd.position.y = 2.05; man.add(hd);
  [-0.16, 0.16].forEach(function (z) { var l = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.7, 4, 8), keep(new THREE.MeshStandardMaterial({ color: 0x272347 }))); l.position.set(0, 0.45, z); man.add(l); });
  var manGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: gTex, color: 0xfbbf24, transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending }));
  manGlow.scale.set(5, 5, 1); manGlow.position.y = 0.2; man.add(manGlow);

  /* ---------- 地面声波圈(紫色,带一点青色内缘) ---------- */
  var ringGeo = keep(new THREE.RingGeometry(0.975, 1, 160, 1));
  var rings = [];
  for (var ri = 0; ri < RING_MAX; ri++) {
    var rm = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0xc4b5fd, transparent: true, opacity: 0.7, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
    rm.rotation.x = -Math.PI / 2; rm.position.y = 0.06; rm.visible = false; rm.renderOrder = 2; scene.add(rm); rings.push(rm);
  }

  var state = { W: 1, H: 1, zone: { x: 0, y: 0, w: 1, h: 1 }, t0: performance.now(), ok: true, mode: "street" };
  var v3 = new THREE.Vector3(), camPos = new THREE.Vector3(), tgt = new THREE.Vector3();

  function size() {
    var r = canvas.getBoundingClientRect(), w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
    if (w !== state.W || h !== state.H || canvas.width === 300) { state.W = w; state.H = h; renderer.setSize(w, h, false); }
  }

  /* street 镜头:V = { s(px/m,原点处), cx, ry(原点在安全区内的像素) };返回 V.p3 投影函数 */
  function view(V) {
    size(); state.mode = "street"; cam.fov = FOV;
    var Z = state.zone, W = state.W, H = state.H;
    var d = (H / 2) / (V.s * Math.tan(FOV * Math.PI / 360));
    camPos.set(0, Math.sin(ELEV) * d, Math.cos(ELEV) * d);
    cam.position.copy(camPos); cam.up.set(0, 1, 0); cam.lookAt(0, 0, 0);
    cam.aspect = W / H; cam.near = Math.max(0.3, d * 0.02); cam.far = d * 12 + 1600;
    var px = Z.x + V.cx, py = Z.y + V.ry;
    cam.setViewOffset(W, H, W / 2 - px, H / 2 - py, W, H);
    cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    // 雾随镜头距离缩放;车与人按「画面示意」放大到至少约 28 px 长(物理位置不变)
    scene.fog.near = d * 0.9; scene.fog.far = d * 3.4;
    var k = Math.max(1, Math.min(7, 30 / (7 * V.s))); car.scale.setScalar(k); man.scale.setScalar(Math.max(1, k * 0.8));
    state.k = k; hemi.intensity = 1.25;
    V.p3 = project; return V;
  }
  /* city 镜头(第 1、4 关):人眼高度看街对面,画面主体留给示波器 */
  function viewCity() {
    size(); state.mode = "city";
    var W = state.W, H = state.H;
    cam.position.set(0, 10, 70); cam.up.set(0, 1, 0); tgt.set(0, 7, -40); cam.lookAt(tgt);
    scene.fog.near = 90; scene.fog.far = 420; hemi.intensity = 0.75;
    cam.aspect = W / H; cam.near = 0.5; cam.far = 3000; cam.clearViewOffset();
    // 竖屏视野收窄时补一点水平视角
    cam.fov = W / H < 0.8 ? 58 : FOV + 6;
    cam.updateProjectionMatrix(); cam.updateMatrixWorld();
  }
  function project(x, y) {
    v3.set(x, 0, -y); v3.project(cam);
    return [(v3.x + 1) / 2 * state.W - state.zone.x, (1 - v3.y) / 2 * state.H - state.zone.y];
  }

  function render(L) {
    if (!state.ok) return;
    size();
    var t = (performance.now() - state.t0) / 1000, RM = !!(L && L.RM);
    var env = (L && L.lv && L.lv.env3) || "street", st = (L && L.st) || {};
    if (env === "city") { if (state.mode !== "city" || cam.fov === FOV) viewCity(); }
    var street = env === "street";
    car.visible = man.visible = street;
    // 车位置:与 2D 逻辑同一公式
    var xs = 0;
    if (street) {
      xs = st.mode === "drag" ? st.dx : (st.x0 != null ? st.x0 + st.v * Math.min(st.t || 0, 400 / (st.v || 1)) : -200);
      car.position.set(xs, 0, 0);
      car.rotation.y = (st.mode === "drag" && st.dv < 0) ? Math.PI : 0;
      man.position.set(0, 0.25, 20);
      man.rotation.y = Math.atan2(xs, 20) * 0.5;
      var flash = RM ? 0.5 : (Math.floor(t * 6) % 2);
      sirenGlow.material.color.setHex(flash ? 0x3b82ff : 0xff3b3b);
      sirenLight.color.setHex(flash ? 0x3b82ff : 0xff3b3b);
      barR.material.color.setHex(flash ? 0x551515 : 0xff3b3b); barB.material.color.setHex(flash ? 0x3b82ff : 0x16255a);
      // 声波圈
      var maxR = 900, used = 0, emits = st.emits || [];
      for (var i = emits.length - 1; i >= 0 && used < RING_MAX; i--) {
        var e = emits[i], ex = typeof e === "number" ? st.x0 + st.v * e : e.x, te = typeof e === "number" ? e : e.t;
        var r = (st.c || 343) * ((st.t || 0) - te);
        if (r <= 0.3 || r > maxR) continue;
        var m = rings[used++]; m.visible = true; m.position.x = ex; m.position.z = 0; m.scale.set(r, r, 1);
        m.material.opacity = Math.max(0.12, 1 - r / 500) * (RM ? 0.7 : 1);
        m.material.color.setHex(st.v > st.c ? 0xd8b4fe : 0xc4b5fd);
      }
      for (var k = used; k < RING_MAX; k++) rings[k].visible = false;
    } else {
      for (var k2 = 0; k2 < RING_MAX; k2++) rings[k2].visible = false;
    }
    // 路灯:第 4 关随拍频呼吸(拍频 ≤ 12 Hz 时可见),其余平稳微闪
    var beat = (L && L.lv && L.lv.lampBeat) ? L.lv.lampBeat(L) : null;
    var lv = beat == null ? 1 : 0.35 + 0.65 * beat;
    lamps.forEach(function (lp, j) {
      var flick = RM ? 1 : 0.94 + 0.06 * Math.sin(t * 3.1 + j * 1.7);
      lp.halo.material.opacity = 0.55 * lv * flick;
      if (lp.refl) lp.refl.material.opacity = 0.22 * lv * flick;
    });
    // 让几盏真实点光源跟着镜头附近的路灯走
    var cx = street ? Math.round(xs / LAMP_DX) * LAMP_DX : 0;
    lampLights.forEach(function (pl, j) { pl.position.x = cx + (j - (lampLights.length - 1) / 2) * LAMP_DX; pl.intensity = 60 * lv; });
    renderer.render(scene, cam);
  }

  function setZone(Z) { state.zone = Z; }
  function show(on) { canvas.style.visibility = on ? "visible" : "hidden"; }
  function dispose() {
    state.ok = false;
    scene.traverse(function (o) { if (o.geometry) o.geometry.dispose(); if (o.material) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); } });
    disposables.forEach(function (d) { try { d.dispose(); } catch (e) {} });
    renderer.dispose();
  }
  return { view: view, project: project, render: render, setZone: setZone, show: show, dispose: dispose, three: THREE };
}
