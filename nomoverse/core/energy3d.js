/* 宙律 Nomoverse · 能量任务 3D 舞台(v0.9-α2 · 方案 B「能量账本」第 1 关夜景过山车)
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
  var track = new THREE.Group(); scene.add(track);
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
  var cart = new THREE.Group(); scene.add(cart);
  var body = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.3, 2.2), new THREE.MeshStandardMaterial({ color: 0x5b4bd6, metalness: 0.5, roughness: 0.35, emissive: 0x2a1f8a, emissiveIntensity: 0.6 }));
  body.position.y = 0.95; cart.add(body);
  var seat = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.7, 1.8), new THREE.MeshStandardMaterial({ color: 0x7c6cf0, emissive: 0x3b2f9a, emissiveIntensity: 0.5 }));
  seat.position.set(-0.5, 1.9, 0); cart.add(seat);
  var halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: 0x67e8f9, transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending }));
  halo.scale.set(9, 9, 1); halo.position.y = 1; cart.add(halo);
  var heatS = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: 0xfb923c, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
  heatS.scale.set(6, 6, 1); cart.add(heatS);
  var NTR = hi ? 60 : 30, trail = [], tm = new THREE.SpriteMaterial({ map: glow, color: 0xfb923c, transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending });
  for (var tI = 0; tI < NTR; tI++) { var s = new THREE.Sprite(tm.clone()); s.visible = false; scene.add(s); trail.push(s); }
  var trI = 0, lastTr = 0;

  function size() {
    var w = canvas.clientWidth | 0, h = canvas.clientHeight | 0, pr = renderer.getPixelRatio();
    if (w !== state.W || h !== state.H) { state.W = w; state.H = h; renderer.setSize(w, h, false); }
    return pr;
  }
  /* 镜头:让 x 0–110 m、高度 −3–43 m 的轨道平面(z=0)正好铺满安全区,和 2D 坐标一致 */
  function aim() {
    var Z = state.zone, asp = Z.w / Math.max(1, Z.h);
    cam.aspect = asp; cam.updateProjectionMatrix();
    var halfV = Math.tan(cam.fov * Math.PI / 360), needH = Math.max(52, 118 / asp), D = needH / 2 / halfV;
    cam.position.set(55, 20 + D * 0.12, D); cam.lookAt(55, 20, 0);
  }
  var v3 = new THREE.Vector3();
  function proj(x, y, z) { v3.set(x, y, z || 0).project(cam); var Z = state.zone; return [(v3.x + 1) / 2 * Z.w, (1 - v3.y) / 2 * Z.h]; }

  function render(L) {
    if (!state.ok) return;
    size();
    var e = (L && L.st && L.st.e3) || null; if (!e) return;
    var Z = state.zone, t = (performance.now() - state.t0) / 1000, RM = L.RM;
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
    stars.rotation.y = RM ? 0 : t * 0.003;
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
