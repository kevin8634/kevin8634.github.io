/* 宙律 Nomoverse · 能量任务 3D 舞台(v0.9-α2 第 1 关夜景过山车;v0.9-α3 补第 2–4 关:夜路刹车 / 水电站 / 热机提升塔)
   关卡写 st.e3.lv(缺省 1)切换场景组;第 2–4 关用 e3.fit(像素子区)把场景框进账本以外的区域。
   只负责「画」:夜空、远处城市灯火、地面、双轨过山车轨道(随第二座山高度重建)、立柱、小车与车灯、摩擦生热的橙色尾迹。
   物理与账本仍由关卡 2D 逻辑计算;关卡每帧写 st.e3 = { xs, hs, h2, x, h, heat(0–1), mu };标签用 proj() 对齐。
   坐标:1 单位 = 1 m;x 沿轨道,y 向上,+z 朝向镜头。无外部素材,全部程序生成。 */
"use strict";
import { tierInfo, createRenderer, canvasTex, glowTex } from "./nvscene.js";

export function mount(THREE, canvas, opts) {
  opts = opts || {};
  var T = tierInfo(), hi = T.tier === "high", W = window;
  var renderer = createRenderer(THREE, { canvas: canvas, alpha: false, clear: 0x07061a, onLost: opts.onLost });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.1;
  var state = { ok: true, W: 0, H: 0, zone: { x: 0, y: 0, w: 1, h: 1 }, key: "", t0: performance.now() };
  var scene = new THREE.Scene(); scene.fog = new THREE.Fog(0x1a1446, 220, 950);
  var cam = new THREE.PerspectiveCamera(30, 1, 0.5, 3000);
  var glow = glowTex(THREE), own = [];
  function keep(o) { own.push(o); return o; }

  /* 夜空:竖直渐变大球 + 星点 */
  var skyTex = keep(canvasTex(THREE, 8, 256, function (c, w, h) { var g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#05041a"); g.addColorStop(0.5, "#221a5a"); g.addColorStop(0.74, "#5a4399"); g.addColorStop(1, "#0b0826"); c.fillStyle = g; c.fillRect(0, 0, w, h); }));
  var sky = new THREE.Mesh(new THREE.SphereGeometry(1500, 32, 16), new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, fog: false, depthWrite: false }));
  scene.add(sky);
  var NS = hi ? 1400 : 600, sp = [], sc = [];
  for (var i = 0; i < NS; i++) { var a = Math.random() * Math.PI * 2, e = 0.05 + Math.random() * 1.3, r = 1300; sp.push(Math.cos(a) * Math.cos(e) * r, Math.sin(e) * r, Math.sin(a) * Math.cos(e) * r); var b = 0.5 + Math.random() * 0.5; sc.push(b, b, 1); }
  var sg = new THREE.BufferGeometry(); sg.setAttribute("position", new THREE.Float32BufferAttribute(sp, 3)); sg.setAttribute("color", new THREE.Float32BufferAttribute(sc, 3));
  var stars = new THREE.Points(sg, new THREE.PointsMaterial({ size: hi ? 2.2 : 2.6, sizeAttenuation: false, vertexColors: true, fog: false, transparent: true, opacity: 0.9 }));
  scene.add(stars);

  /* 地面与城市灯火 */
  var gTex = keep(canvasTex(THREE, 512, 512, function (c, w, h) {
    c.fillStyle = "#0d0a22"; c.fillRect(0, 0, w, h); c.strokeStyle = "rgba(167,139,250,.5)"; c.lineWidth = 2;
    for (var k = 0; k <= 16; k++) { c.beginPath(); c.moveTo(k * w / 16, 0); c.lineTo(k * w / 16, h); c.stroke(); c.beginPath(); c.moveTo(0, k * h / 16); c.lineTo(w, k * h / 16); c.stroke(); }
  }));
  gTex.wrapS = gTex.wrapT = THREE.RepeatWrapping; gTex.repeat.set(24, 24);
  var ground = new THREE.Mesh(new THREE.PlaneGeometry(1600, 1600), new THREE.MeshStandardMaterial({ map: gTex, roughness: 0.9, metalness: 0 }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -3; scene.add(ground);
  var NC = hi ? 500 : 220, cp = [], cc = [], pal = [[1, 0.83, 0.42], [0.65, 0.55, 0.98], [0.4, 0.9, 0.98], [1, 0.6, 0.35]];
  for (var j = 0; j < NC; j++) { var x = -300 + Math.random() * 720, z = -160 - Math.random() * 260, y = -3 + Math.random() * Math.random() * 40; cp.push(x, y, z); var q = pal[(Math.random() * 4) | 0]; cc.push(q[0], q[1], q[2]); }
  var cg = new THREE.BufferGeometry(); cg.setAttribute("position", new THREE.Float32BufferAttribute(cp, 3)); cg.setAttribute("color", new THREE.Float32BufferAttribute(cc, 3));
  scene.add(new THREE.Points(cg, new THREE.PointsMaterial({ size: hi ? 5 : 4, sizeAttenuation: false, vertexColors: true, transparent: true, opacity: 0.85, map: glow, depthWrite: false, blending: THREE.AdditiveBlending })));
  // 远山剪影
  var hp = [], hx0 = -400; for (var m = 0; m <= 80; m++) { var xx = hx0 + m * 12, yy = 8 + 7 * Math.sin(m * 0.37) + 4 * Math.sin(m * 0.13 + 1); hp.push(xx, -3, -120, xx, yy, -120); }
  var hgi = []; for (var n = 0; n < 80; n++) { var o = n * 2; hgi.push(o, o + 2, o + 1, o + 1, o + 2, o + 3); }
  var hg = new THREE.BufferGeometry(); hg.setAttribute("position", new THREE.Float32BufferAttribute(hp, 3)); hg.setIndex(hgi);
  scene.add(new THREE.Mesh(hg, new THREE.MeshBasicMaterial({ color: 0x1d1648, side: THREE.DoubleSide })));

  /* 灯光 */
  scene.add(new THREE.HemisphereLight(0xa99bff, 0x1c1540, 1.8));
  var moonL = new THREE.DirectionalLight(0xc7d2fe, 1.2); moonL.position.set(-60, 120, 80); scene.add(moonL);
  var cartL = new THREE.PointLight(0x67e8f9, hi ? 60 : 40, 40, 1.6); scene.add(cartL);

  /* 轨道(可重建) */
  var railMat = new THREE.MeshStandardMaterial({ color: 0xf1efff, metalness: 0.6, roughness: 0.3, emissive: 0x8b7cf6, emissiveIntensity: 1.1 });
  var tieMat = new THREE.MeshStandardMaterial({ color: 0x7a6ad0, metalness: 0.4, roughness: 0.6 });
  var postMat = new THREE.MeshStandardMaterial({ color: 0x6d5fc0, metalness: 0.5, roughness: 0.5, emissive: 0x2e2380, emissiveIntensity: 0.8 });
  var g1 = new THREE.Group(), g2 = new THREE.Group(), g3 = new THREE.Group(), g4 = new THREE.Group(), GS = [null, g1, g2, g3, g4];
  scene.add(g1, g2, g3, g4); g2.visible = g3.visible = g4.visible = false;
  var track = new THREE.Group(); g1.add(track);
  function clearTrack() { while (track.children.length) { var c = track.children.pop(); c.geometry.dispose(); } }
  function buildTrack(xs, hs) {
    clearTrack();
    var pts = []; for (var i = 0; i < xs.length; i += 10) pts.push(new THREE.Vector3(xs[i], hs[i], 0));
    var curve = new THREE.CatmullRomCurve3(pts), seg = hi ? 400 : 220;
    [-0.9, 0.9].forEach(function (dz) {
      var p2 = pts.map(function (p) { return new THREE.Vector3(p.x, p.y, dz); });
      track.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(p2), seg, 0.26, 8, false), railMat));
    });
    var nT = 110, tie = new THREE.InstancedMesh(new THREE.BoxGeometry(0.25, 0.12, 2.1), tieMat, nT), mt = new THREE.Matrix4(), qq = new THREE.Quaternion(), ax = new THREE.Vector3(0, 0, 1);
    for (var k = 0; k < nT; k++) { var u = k / (nT - 1), p = curve.getPointAt(u), tg = curve.getTangentAt(u); qq.setFromAxisAngle(ax, Math.atan2(tg.y, tg.x)); mt.compose(p, qq, new THREE.Vector3(1, 1, 1)); tie.setMatrixAt(k, mt); }
    track.add(tie);
    var posts = [], nP = 0; for (var x = 2; x <= 108; x += 4) posts.push(x);
    var post = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.12, 0.18, 1, 6), postMat, posts.length * 2);
    posts.forEach(function (x) { var h = hs[Math.round(x * 10)] + 3; [-0.9, 0.9].forEach(function (dz) { mt.compose(new THREE.Vector3(x, h / 2 - 3, dz), new THREE.Quaternion(), new THREE.Vector3(1, Math.max(0.1, h), 1)); post.setMatrixAt(nP++, mt); }); });
    track.add(post);
  }

  /* 小车 + 车灯光晕 + 摩擦热尾迹 */
  var cart = new THREE.Group(); g1.add(cart);
  var body = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.3, 2.2), new THREE.MeshStandardMaterial({ color: 0x5b4bd6, metalness: 0.5, roughness: 0.35, emissive: 0x2a1f8a, emissiveIntensity: 0.6 }));
  body.position.y = 0.95; cart.add(body);
  var seat = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.7, 1.8), new THREE.MeshStandardMaterial({ color: 0x7c6cf0, emissive: 0x3b2f9a, emissiveIntensity: 0.5 }));
  seat.position.set(-0.5, 1.9, 0); cart.add(seat);
  var halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: 0x67e8f9, transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending }));
  halo.scale.set(9, 9, 1); halo.position.y = 1; cart.add(halo);
  var heatS = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: 0xfb923c, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
  heatS.scale.set(6, 6, 1); cart.add(heatS);
  var NTR = hi ? 60 : 30, trail = [], tm = new THREE.SpriteMaterial({ map: glow, color: 0xfb923c, transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending });
  for (var tI = 0; tI < NTR; tI++) { var s = new THREE.Sprite(tm.clone()); s.visible = false; g1.add(s); trail.push(s); }
  var trI = 0, lastTr = 0;

  function size() {
    var w = canvas.clientWidth | 0, h = canvas.clientHeight | 0, pr = renderer.getPixelRatio();
    if (w !== state.W || h !== state.H) { state.W = w; state.H = h; renderer.setSize(w, h, false); }
    return pr;
  }
  /* 镜头:让 x 0–110 m、高度 −3–43 m 的轨道平面(z=0)正好铺满安全区,和 2D 坐标一致 */
  function aim() {
    var Z = state.zone, asp = Z.w / Math.max(1, Z.h);
    cam.fov = 30; cam.aspect = asp; cam.clearViewOffset(); cam.updateProjectionMatrix();
    var halfV = Math.tan(cam.fov * Math.PI / 360), needH = Math.max(52, 118 / asp), D = needH / 2 / halfV;
    cam.position.set(55, 20 + D * 0.12, D); cam.lookAt(55, 20, 0);
  }
  var v3 = new THREE.Vector3();
  function proj(x, y, z) { v3.set(x, y, z || 0).project(cam); var Z = state.zone; return [(v3.x + 1) / 2 * Z.w, (1 - v3.y) / 2 * Z.h]; }


  /* ---------- 第 2–4 关共用 ---------- */
  function M(o) { return new THREE.MeshStandardMaterial(o); }
  function box(w, h, d, mat, x, y, z, parent) { var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); (parent || scene).add(m); return m; }
  function spr(col, sc, parent, op) { var m = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: col, transparent: true, opacity: op == null ? 0.85 : op, depthWrite: false, blending: THREE.AdditiveBlending })); m.scale.set(sc, sc, 1); parent.add(m); return m; }
  /* 把世界矩形 R 框进像素子区 F(关卡坐标,与 proj 输出一致);F 外仍照常渲染(天空、地面) */
  function fitRect(R, F, tilt, fov) {
    var Z = state.zone; F = F || { x: 0, y: 0, w: Z.w, h: Z.h };
    var fw = Math.max(40, F.w), fh = Math.max(40, F.h), asp = fw / fh;
    cam.fov = fov || 30; cam.aspect = asp;
    var halfV = Math.tan(cam.fov * Math.PI / 360), ww = R[1] - R[0], hh = R[3] - R[2], needH = Math.max(hh, ww / asp) * 1.04, D = needH / 2 / halfV;
    var cx = (R[0] + R[1]) / 2, cy = (R[2] + R[3]) / 2;
    cam.position.set(cx, cy + D * (tilt || 0), D); cam.lookAt(cx, cy, 0);
    cam.setViewOffset(fw, fh, -F.x, -F.y, Z.w, Z.h); cam.updateProjectionMatrix();
  }
  function camAt(F, fov, pos, look) {
    var Z = state.zone; F = F || { x: 0, y: 0, w: Z.w, h: Z.h };
    var fw = Math.max(40, F.w), fh = Math.max(40, F.h);
    cam.fov = fov; cam.aspect = fw / fh; cam.position.set(pos[0], pos[1], pos[2]); cam.lookAt(look[0], look[1], look[2]);
    cam.setViewOffset(fw, fh, -F.x, -F.y, Z.w, Z.h); cam.updateProjectionMatrix();
  }

  /* ---------- 第 2 关:夜路刹车(路沿 −z 伸向远方,车从 z=0 出发向远处刹停) ---------- */
  var RX = 55, GY = -3, b2 = null;
  function build2() {
    var o = {}, G = new THREE.Group(); G.position.set(RX, GY, 0); g2.add(G); o.G = G;
    box(9, 0.04, 150, M({ color: 0x1a1830, roughness: 0.85 }), 0, 0.02, -60, G);
    var lineM = new THREE.MeshBasicMaterial({ color: 0xe9e5ff }), edgeM = new THREE.MeshBasicMaterial({ color: 0x8b7cf6 });
    var nD = 30, dash = new THREE.InstancedMesh(new THREE.BoxGeometry(0.16, 0.02, 2.4), lineM, nD), mt = new THREE.Matrix4();
    for (var i = 0; i < nD; i++) { mt.makeTranslation(0, 0.05, 12 - i * 5); dash.setMatrixAt(i, mt); } G.add(dash);
    [-4.3, 4.3].forEach(function (x) { box(0.14, 0.02, 150, edgeM, x, 0.05, -60, G); });
    // 刹车距离:起点青线 + 橙色发光带 + 终点标杆
    box(9, 0.03, 0.3, new THREE.MeshBasicMaterial({ color: 0x67e8f9 }), 0, 0.07, 0, G);
    o.strip = box(1.6, 0.03, 1, new THREE.MeshBasicMaterial({ color: 0xfb923c, transparent: true, opacity: 0.55, depthWrite: false }), -2, 0.08, -0.5, G);
    o.stop = new THREE.Group(); G.add(o.stop);
    box(0.18, 3, 0.18, M({ color: 0xfdba74, emissive: 0xfb923c, emissiveIntensity: 1.2 }), -3.6, 1.5, 0, o.stop);
    spr(0xfb923c, 3.4, o.stop).position.set(-3.6, 3.1, 0);
    // 路灯(发光精灵 + 地面光斑,不用点光源)
    var poleM = M({ color: 0x3b3561, metalness: 0.5, roughness: 0.5 }), spotM = new THREE.MeshBasicMaterial({ map: glow, color: 0xfde68a, transparent: true, opacity: 0.22, depthWrite: false, blending: THREE.AdditiveBlending });
    for (var z = 10; z >= -125; z -= 15) [-6, 6].forEach(function (x, k) {
      if ((z / 15 | 0) % 2 !== k) return;
      box(0.16, 7, 0.16, poleM, x, 3.5, z, G); box(1.4, 0.12, 0.16, poleM, x * 0.88, 7, z, G);
      spr(0xfde68a, 2.6, G).position.set(x * 0.78, 6.9, z);
      var sp = new THREE.Mesh(new THREE.PlaneGeometry(9, 9), spotM); sp.rotation.x = -Math.PI / 2; sp.position.set(x * 0.6, 0.06, z); G.add(sp);
    });
    // 车(朝 −z):车身、座舱、车窗、四轮 + 刹车盘
    var car = new THREE.Group(); G.add(car); o.car = car; car.position.x = 2;
    box(1.9, 0.7, 4.4, M({ color: 0x5b4bd6, metalness: 0.55, roughness: 0.35, emissive: 0x24197a, emissiveIntensity: 0.5 }), 0, 0.65, 0, car);
    box(1.6, 0.6, 2.2, M({ color: 0x7c6cf0, metalness: 0.4, roughness: 0.3, emissive: 0x2e2390, emissiveIntensity: 0.4 }), 0, 1.3, 0.3, car);
    box(1.62, 0.36, 2.0, M({ color: 0x9fd8f5, metalness: 0.9, roughness: 0.1, emissive: 0x335577, emissiveIntensity: 0.5 }), 0, 1.33, 0.3, car);
    o.discM = M({ color: 0x888899, metalness: 0.8, roughness: 0.35, emissive: 0xfb6a1c, emissiveIntensity: 0 });
    var tireM = M({ color: 0x0f0d1f, roughness: 0.9 }), tg = new THREE.CylinderGeometry(0.34, 0.34, 0.26, 18), dg = new THREE.CylinderGeometry(0.22, 0.22, 0.04, 18);
    o.wheels = []; o.heat = [];
    [[-0.98, -1.4], [0.98, -1.4], [-0.98, 1.4], [0.98, 1.4]].forEach(function (p) {
      var w = new THREE.Group(); w.position.set(p[0], 0.34, p[1]); car.add(w);
      var t = new THREE.Mesh(tg, tireM); t.rotation.z = Math.PI / 2; w.add(t);
      var d = new THREE.Mesh(dg, o.discM); d.rotation.z = Math.PI / 2; d.position.x = p[0] > 0 ? 0.15 : -0.15; w.add(d);
      o.wheels.push(w); var h = spr(0xfb923c, 1.2, car, 0); h.position.set(p[0] * 1.12, 0.36, p[1]); o.heat.push(h);
    });
    o.tail = [spr(0xff3b3b, 0.9, car), spr(0xff3b3b, 0.9, car)]; o.tail[0].position.set(-0.7, 0.8, 2.22); o.tail[1].position.set(0.7, 0.8, 2.22);
    o.head = [spr(0xfff7d6, 1.4, car), spr(0xfff7d6, 1.4, car)]; o.head[0].position.set(-0.7, 0.7, -2.25); o.head[1].position.set(0.7, 0.7, -2.25);
    o.beam = spr(0xfff3c4, 9, car, 0.18); o.beam.position.set(0, 0.1, -7);
    return o;
  }
  function draw2(e, F) {
    if (!b2) b2 = build2();
    var D = Math.max(1, e.D), d = e.dist;
    b2.strip.scale.z = D; b2.strip.position.z = -D / 2; b2.stop.position.z = -D;
    b2.car.position.z = -d; b2.wheels.forEach(function (w) { w.rotation.x = d / 0.34; });
    var h = Math.min(1, e.heat); b2.discM.emissiveIntensity = h * 2.2; b2.heat.forEach(function (s) { s.material.opacity = h * 0.9; s.scale.setScalar(0.8 + h * 1.4); });
    b2.tail.forEach(function (s) { s.material.opacity = e.braking ? 1 : 0.45; s.scale.setScalar(e.braking ? 1.5 : 0.9); });
    cartL.color.setHex(0xff5a3c); cartL.intensity = e.braking ? 30 : 8; cartL.position.set(RX + 2, GY + 1.2, -d + 3.2);
    camAt(F, 42, [RX + 9, GY + 5.2, 16], [RX - 1, GY - 1, -32]);
  }

  /* ---------- 第 3 关:水电站(侧剖面,z=0 平面) ---------- */
  var b3 = null;
  function build3() {
    var o = {}, G = g3, B = -3;
    box(34, 30, 30, M({ color: 0x16123a, roughness: 1 }), -12, B + 15, -22, G);   // 背后山体
    o.water = box(24, 1, 16, M({ color: 0x2b8fd6, transparent: true, opacity: 0.55, roughness: 0.1, metalness: 0.2, emissive: 0x0c4a7a, emissiveIntensity: 0.7 }), 10, 0, -4, G);
    o.surf = box(24, 0.08, 16, new THREE.MeshBasicMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.5 }), 10, 0, -4, G);
    o.damM = M({ color: 0x75738f, roughness: 0.8 }); o.dam = null; o.pipe = null; o.pipeM = M({ color: 0x9aa6bd, metalness: 0.7, roughness: 0.35 });
    // 厂房 + 水轮 + 发电机
    box(14, 7, 8, M({ color: 0x2a2f55, roughness: 0.7, emissive: 0x141838, emissiveIntensity: 0.6 }), 58, B + 3.5, -3, G);
    o.wheel = new THREE.Group(); o.wheel.position.set(54, B + 3.4, 1.4); G.add(o.wheel);
    var bm = M({ color: 0xe2e8f0, metalness: 0.7, roughness: 0.3, emissive: 0x4a5a7a, emissiveIntensity: 0.4 });
    for (var k = 0; k < 8; k++) { var bl = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.32, 0.5), bm); bl.position.x = 1.3; var pv = new THREE.Group(); pv.rotation.z = k * Math.PI / 4; pv.add(bl); o.wheel.add(pv); }
    o.wheel.add(new THREE.Mesh(new THREE.TorusGeometry(2.7, 0.18, 8, 32), bm));
    box(4.5, 4, 4, M({ color: 0x334155, metalness: 0.6, roughness: 0.4, emissive: 0x423a10, emissiveIntensity: 0.5 }), 62, B + 2, 1.2, G);
    // 输电塔 + 导线 + 灯
    var tm = M({ color: 0x8b8fb8, metalness: 0.6, roughness: 0.4 });
    [72, 84].forEach(function (x) { box(0.5, 16, 0.5, tm, x, B + 8, 0, G); box(4, 0.3, 0.3, tm, x, B + 15.5, 0, G); });
    var wp = [new THREE.Vector3(64, B + 4, 1), new THREE.Vector3(72, B + 15.5, 0), new THREE.Vector3(78, B + 14, 0), new THREE.Vector3(84, B + 15.5, 0), new THREE.Vector3(92, B + 12.5, 0)];
    o.wireM = new THREE.MeshBasicMaterial({ color: 0xfacc15, transparent: true, opacity: 0.5 });
    G.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(wp), 60, 0.12, 6, false), o.wireM));
    o.wire = new THREE.CatmullRomCurve3(wp);
    box(0.3, 9, 0.3, tm, 92, B + 4.5, 0, G);
    o.bulbM = M({ color: 0xfff3c4, emissive: 0xfacc15, emissiveIntensity: 0.2, transparent: true, opacity: 0.9 });
    var bulb = new THREE.Mesh(new THREE.SphereGeometry(1.1, 24, 16), o.bulbM); bulb.position.set(92, B + 12, 0); G.add(bulb);
    o.bglow = spr(0xfacc15, 10, G, 0); o.bglow.position.set(92, B + 12, 0.5);
    o.drop = spr(0x7dd3fc, 3.2, G, 0); o.pulse = spr(0xfde047, 2.4, G, 0);
    o.tail = box(30, 0.6, 8, M({ color: 0x3aa0e0, transparent: true, opacity: 0.45, emissive: 0x0c4a7a, emissiveIntensity: 0.6 }), 76, B + 0.3, -3, G);
    o.key = -1; return o;
  }
  function hyH(h) { return 6 + 30 * h / 200; }   // 落差 → 场景里的坝高
  function draw3(e, F) {
    if (!b3) b3 = build3();
    var B = -3, H = hyH(e.h), o = b3;
    if (o.key !== e.h) {
      o.key = e.h;
      if (o.dam) { g3.remove(o.dam); o.dam.geometry.dispose(); } if (o.pipe) { g3.remove(o.pipe); o.pipe.geometry.dispose(); }
      var sh = new THREE.Shape(); sh.moveTo(22, B); sh.lineTo(31, B); sh.lineTo(24.6, B + H + 1); sh.lineTo(22, B + H + 1); sh.closePath();
      var dg = new THREE.ExtrudeGeometry(sh, { depth: 16, bevelEnabled: false }); dg.translate(0, 0, -12);
      o.dam = new THREE.Mesh(dg, o.damM); g3.add(o.dam);
      o.path = new THREE.CatmullRomCurve3([new THREE.Vector3(23, B + H - 2, 0.6), new THREE.Vector3(30, B + H * 0.55, 1), new THREE.Vector3(44, B + 4, 1.2), new THREE.Vector3(52, B + 3.4, 1.4)]);
      o.pipe = new THREE.Mesh(new THREE.TubeGeometry(o.path, 64, 0.7, 10, false), o.pipeM); g3.add(o.pipe);
      o.water.scale.y = H - 1.2; o.water.position.y = B + (H - 1.2) / 2; o.surf.position.y = B + H - 1.2;
    }
    var t = (performance.now() - state.t0) / 1000;
    if (e.k > 0 && e.k < 0.62) { o.drop.material.opacity = 0.95; o.drop.position.copy(o.path.getPointAt(Math.min(1, e.fall))); } else o.drop.material.opacity = 0;
    o.wheel.rotation.z = -t * (e.k > 0.4 ? 6 * e.h / 100 : 0.3);
    var lit = e.lit; o.bulbM.emissiveIntensity = 0.2 + 3 * lit; o.bglow.material.opacity = 0.9 * lit; o.wireM.opacity = 0.35 + 0.6 * e.gen;
    if (e.gen > 0 && e.gen < 1) { o.pulse.material.opacity = 0.9; o.pulse.position.copy(o.wire.getPointAt((t * 0.8) % 1)); } else o.pulse.material.opacity = 0;
    cartL.color.setHex(0xfacc15); cartL.intensity = 80 * lit; cartL.position.set(92, B + 13, 4);
    fitRect([-4, 100, -5, 38], F, 0.08);
  }

  /* ---------- 第 4 关:热机 → 提升 1 吨重物(侧视,z=0 平面) ---------- */
  var b4 = null, TOWER = 40;
  function build4() {
    var o = {}, G = g4, B = -3;
    box(100, 0.6, 10, M({ color: 0x1a1438, roughness: 0.9 }), 50, B + 0.3, -1, G);
    box(7, 1.6, 4, M({ color: 0xf472b6, emissive: 0x9d174d, emissiveIntensity: 0.6, roughness: 0.5 }), 12, B + 1.4, 0, G);   // 燃料
    o.flameM = M({ color: 0xffb36b, emissive: 0xfb923c, emissiveIntensity: 2, transparent: true, opacity: 0.85 });
    o.flame = new THREE.Mesh(new THREE.ConeGeometry(2.2, 8, 20, 1, true), o.flameM); o.flame.position.set(12, B + 6.2, 0); G.add(o.flame);
    o.fglow = spr(0xfb923c, 16, G, 0.7); o.fglow.position.set(12, B + 7, 1);
    var hot = new THREE.CatmullRomCurve3([new THREE.Vector3(14, B + 6, 0), new THREE.Vector3(22, B + 7.5, 0), new THREE.Vector3(30, B + 6, 0)]);
    o.hotM = new THREE.MeshBasicMaterial({ color: 0xfb923c, transparent: true, opacity: 0.6 });
    G.add(new THREE.Mesh(new THREE.TubeGeometry(hot, 30, 0.45, 8, false), o.hotM));
    var brass = M({ color: 0xb08d57, metalness: 0.75, roughness: 0.35, emissive: 0x3a2a10, emissiveIntensity: 0.4 });
    box(9, 8, 6, brass, 34, B + 4.6, 0, G); box(3, 4, 3, M({ color: 0x8a6a3c, metalness: 0.7, roughness: 0.4 }), 34, B + 10.6, 0, G);
    o.piston = box(2.2, 1.2, 2.2, M({ color: 0xe5e7eb, metalness: 0.9, roughness: 0.2 }), 34, B + 13, 0, G);
    o.smoke = []; for (var i = 0; i < 14; i++) { var s = spr(0x94a3b8, 4, G, 0); s.material.blending = THREE.NormalBlending; s.userData.p = i / 14; o.smoke.push(s); }
    var shaftM = new THREE.MeshBasicMaterial({ color: 0x67e8f9, transparent: true, opacity: 0.7 });
    box(15, 0.5, 0.5, shaftM, 46, B + 5, 2, G);
    o.fly = new THREE.Group(); o.fly.position.set(58, B + 6.5, 2); G.add(o.fly);
    var fm = M({ color: 0xc4b5fd, metalness: 0.7, roughness: 0.3, emissive: 0x4c3aa0, emissiveIntensity: 0.6 });
    o.fly.add(new THREE.Mesh(new THREE.TorusGeometry(5, 0.45, 10, 40), fm));
    for (var k = 0; k < 4; k++) { var sp = new THREE.Mesh(new THREE.BoxGeometry(10, 0.4, 0.4), fm); sp.rotation.z = k * Math.PI / 4; o.fly.add(sp); }
    // 塔架
    var tmM = M({ color: 0x8b7cf6, metalness: 0.5, roughness: 0.4, emissive: 0x2e2380, emissiveIntensity: 0.7 });
    [-2.6, 2.6].forEach(function (dx) { box(0.45, TOWER + 2, 0.45, tmM, 86 + dx, B + (TOWER + 2) / 2, 0, G); });
    var nb = 12, cb = new THREE.InstancedMesh(new THREE.BoxGeometry(5.2, 0.2, 0.2), tmM, nb), mt = new THREE.Matrix4();
    for (var j = 0; j < nb; j++) { mt.makeTranslation(86, B + 1 + j * (TOWER / (nb - 1)), 0); cb.setMatrixAt(j, mt); } G.add(cb);
    box(7, 0.6, 1.4, tmM, 86, B + TOWER + 2.2, 0, G);
    o.weight = box(4.2, 2.6, 3, M({ color: 0x334155, metalness: 0.6, roughness: 0.4, emissive: 0x0e7490, emissiveIntensity: 0.6 }), 86, B + 1.3, 0, G);
    o.wglow = spr(0x67e8f9, 7, G, 0.5);
    o.ropeM = new THREE.LineBasicMaterial({ color: 0xcbd5e1 }); o.ropeG = new THREE.BufferGeometry(); o.ropeG.setAttribute("position", new THREE.Float32BufferAttribute(new Array(12).fill(0), 3));
    G.add(new THREE.Line(o.ropeG, o.ropeM));
    return o;
  }
  function draw4(e, F) {
    if (!b4) b4 = build4();
    var o = b4, B = -3, t = (performance.now() - state.t0) / 1000, RM = e.RM, burn = e.burn;
    var fl = RM ? 1 : 0.85 + 0.15 * Math.sin(t * 11), s = (0.55 + 0.45 * burn) * fl;
    o.flame.scale.set(0.8 + 0.3 * e.hot, s * (0.7 + 0.5 * e.hot), 0.8 + 0.3 * e.hot); o.flame.position.y = B + 2.2 + 4 * o.flame.scale.y;
    o.flameM.color.setRGB(1, 0.55 + 0.35 * e.hot, 0.3 + 0.55 * e.hot); o.fglow.material.opacity = 0.35 + 0.5 * burn;
    o.hotM.opacity = 0.3 + 0.6 * burn;
    o.piston.position.y = B + 13 + (RM ? 0 : Math.sin(t * (2 + 14 * e.eta * burn)) * 0.9);
    o.fly.rotation.z = -t * 3 * e.eta * burn * (RM ? 0 : 1);
    o.smoke.forEach(function (sm) { var p = (sm.userData.p + t * 0.12) % 1; sm.position.set(34 + p * 14, B + 13 + p * 22, -0.5); sm.material.opacity = burn * (1 - e.eta) * 0.55 * (1 - p); sm.scale.setScalar(3 + p * 9); });
    var wy = B + 1.3 + e.lift * (TOWER - 2.6); o.weight.position.y = wy; o.wglow.position.set(86, wy, 1.6);
    var a = o.ropeG.attributes.position.array, top = B + TOWER + 2.2;
    [58, B + 11.5, 2, 82.6, top, 0, 89.4, top, 0, 86, wy + 1.3, 0].forEach(function (v, i) { a[i] = v; }); o.ropeG.attributes.position.needsUpdate = true;
    cartL.color.setHex(0xfb923c); cartL.intensity = 60 + 90 * burn; cartL.position.set(12, B + 9, 5);
    fitRect([-2, 100, -5, 45], F, 0.08);
  }

  function render(L) {
    if (!state.ok) return;
    size();
    var e = (L && L.st && L.st.e3) || null; if (!e) return;
    var Z = state.zone, t = (performance.now() - state.t0) / 1000, RM = L.RM, lv = e.lv || 1;
    for (var gi = 1; gi < 5; gi++) GS[gi].visible = gi === lv;
    stars.rotation.y = RM ? 0 : t * 0.003;
    if (lv > 1) {
      e.RM = RM;
      if (lv === 2) draw2(e, e.fit); else if (lv === 3) draw3(e, e.fit); else draw4(e, e.fit);
      return paint();
    }
    cartL.color.setHex(0x67e8f9); cartL.intensity = hi ? 60 : 40;
    if (e.key !== state.key) { state.key = e.key; buildTrack(e.xs, e.hs); }
    aim();
    var i = Math.max(0, Math.min(e.xs.length - 2, Math.round(e.x * 10))), dy = e.hs[i + 1] - e.hs[i];
    cart.position.set(e.x, e.h, 0); cart.rotation.z = Math.atan2(dy, 0.1);
    cartL.position.set(e.x, e.h + 4, 3);
    halo.material.opacity = 0.6 + 0.25 * Math.sin(t * 4);
    heatS.material.opacity = Math.min(0.9, e.heat * 1.2);
    if (e.mu > 0 && e.moving && t - lastTr > 0.05) {
      lastTr = t; var s = trail[trI++ % NTR]; s.visible = true; s.position.set(e.x, e.h + 0.3, 0); s.userData.t = t; s.scale.set(2.4, 2.4, 1);
    }
    trail.forEach(function (s) { if (!s.visible) return; var a = t - s.userData.t; s.material.opacity = Math.max(0, 0.55 - a * 0.35); if (s.material.opacity <= 0) s.visible = false; });
    paint();
  }
  function paint() {
    var Z = state.zone;
    renderer.setScissorTest(true);
    var y = state.H - (Z.y + Z.h); renderer.setViewport(Z.x, y, Z.w, Z.h); renderer.setScissor(Z.x, y, Z.w, Z.h);
    renderer.clear(); renderer.render(scene, cam);
    renderer.setScissorTest(false);
  }
  function setZone(Z) { state.zone = Z; }
  function show(on) { canvas.style.visibility = on ? "visible" : "hidden"; }
  function dispose() {
    state.ok = false; clearTrack();
    scene.traverse(function (o) { if (o.geometry) o.geometry.dispose(); if (o.material && o.material.dispose) o.material.dispose(); });
    own.forEach(function (x) { x.dispose(); }); glow.dispose(); renderer.dispose();
  }
  return { proj: proj, render: render, setZone: setZone, show: show, dispose: dispose, three: THREE };
}
