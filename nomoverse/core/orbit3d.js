/* 宙律 Nomoverse · 轨道任务 3D 舞台(v0.3-α2)
   只负责「画」:地球、大气辉光、背景星、时空网格引力井、引力波涟漪。
   物理仍由关卡 2D 逻辑(NV.Phys,固定步长)计算;本模块提供投影器,
   让关卡把轨迹、标签画在透明 2D 画布上,与 3D 地球严格对齐(含地球背面遮挡)。
   坐标:1 场景单位 = 1000 km;关卡 (x, y) km → 场景 (x/1000, 0, +y/1000)(+y 朝向镜头,关卡「上方」落在地球正面)。 */
"use strict";
import { tierInfo, createRenderer, spacetimeGrid, glowTex, earthTex } from "./nvscene.js";

var KM = 1000, FOV = 34, ELEV = 30 * Math.PI / 180;   // 镜头俯角 30°

export function mount(THREE, canvas, opts) {
  opts = opts || {};
  var T = tierInfo();
  var R = (opts.earthR || 6371) / KM;
  var renderer = createRenderer(THREE, { canvas: canvas, alpha: false, clear: 0x07061a, onLost: opts.onLost });
  var scene = new THREE.Scene();
  var cam = new THREE.PerspectiveCamera(FOV, 1, 0.05, 4000);

  // 背景星(随镜头距离放大的大球壳,不参与遮挡)
  var nStar = Math.round(1400 * T.particles), sp = [], sc = [];
  var s = 7; function rnd() { s = (s * 16807) % 2147483647; return s / 2147483647; }
  for (var i = 0; i < nStar; i++) {
    var u = rnd() * 2 - 1, a = rnd() * Math.PI * 2, q = Math.sqrt(1 - u * u);
    sp.push(q * Math.cos(a), u, q * Math.sin(a));
    var b = 0.45 + rnd() * 0.55, warm = rnd(); sc.push(b * (0.85 + warm * 0.15), b * 0.85, b);
  }
  var sg = new THREE.BufferGeometry();
  sg.setAttribute("position", new THREE.Float32BufferAttribute(sp, 3));
  sg.setAttribute("color", new THREE.Float32BufferAttribute(sc, 3));
  var stars = new THREE.Points(sg, new THREE.PointsMaterial({ size: 1.6, sizeAttenuation: false, vertexColors: true, transparent: true, opacity: 0.9, depthWrite: false }));
  stars.renderOrder = -2; scene.add(stars);

  // 地球
  var etex = earthTex(THREE);
  var earth = new THREE.Mesh(new THREE.SphereGeometry(R, T.tier === "high" ? 64 : 40, T.tier === "high" ? 48 : 28),
    new THREE.MeshStandardMaterial({ map: etex, roughness: 0.85, metalness: 0 }));
  // 地轴转到与视线垂直(赤道朝向镜头),避免俯视时极冠正对画面;二维模型的轨道面可视为任意倾角
  earth.rotation.set(-ELEV, 0, 0.35);
  scene.add(earth);
  var glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(THREE), color: 0x7aa7ff, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending }));
  glow.scale.set(R * 2.9, R * 2.9, 1); glow.renderOrder = -1; scene.add(glow);
  var rim = new THREE.Mesh(new THREE.SphereGeometry(R * 1.025, 40, 28),
    new THREE.MeshBasicMaterial({ color: 0xa78bfa, transparent: true, opacity: 0.12, side: THREE.BackSide, depthWrite: false, blending: THREE.AdditiveBlending }));
  scene.add(rim);

  scene.add(new THREE.AmbientLight(0x8a86c8, 0.55));
  var sun = new THREE.DirectionalLight(0xfff4e0, 2.2); sun.position.set(-3, 2.2, 2.5); scene.add(sun);

  // 时空网格:局部坐标 [-1,1],按视野缩放;放在地球下方,地球压出引力井
  var grid = spacetimeGrid(THREE, { x0: -1, x1: 1, z0: -1, z1: 1, nx: 36, nz: 36, seg: T.tier === "high" ? 72 : 44, color: 0x7c5cf0, color2: 0x67e8f9, opacity: 0.55, fadeNear: 1e3, fadeFar: 2e3 });
  grid.uni.uRipSpeed.value = 0.35;
  var gridG = new THREE.Group(); gridG.add(grid.mesh); scene.add(gridG);

  var state = { W: 1, H: 1, zone: { x: 0, y: 0, w: 1, h: 1 }, t0: performance.now(), lastOrb: -1, mass: 1, ok: true };
  var v3 = new THREE.Vector3(), camPos = new THREE.Vector3();

  function size() {
    var r = canvas.getBoundingClientRect(), w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
    if (w !== state.W || h !== state.H || canvas.width === 300) { state.W = w; state.H = h; renderer.setSize(w, h, false); }
  }

  /* 关卡调用:V = { s(px/km), cx, cy(地心在安全区内的像素位置) };返回时 V.p3 = 投影函数 */
  function view(V) {
    size();
    var Z = state.zone, W = state.W, H = state.H;
    var pxPerUnit = V.s * KM;
    var d = (H / 2) / (pxPerUnit * Math.tan(FOV * Math.PI / 360));
    camPos.set(0, Math.sin(ELEV) * d, Math.cos(ELEV) * d);
    cam.position.copy(camPos); cam.up.set(0, 1, 0); cam.lookAt(0, 0, 0);
    cam.aspect = W / H; cam.near = Math.max(0.01, d * 0.02); cam.far = d * 40;
    // 画面中心对准「地心应在的位置」(安全区坐标 → 整画布坐标)
    var px = Z.x + V.cx, py = Z.y + V.cy;
    cam.setViewOffset(W, H, W / 2 - px, H / 2 - py, W, H);
    cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    stars.scale.setScalar(d * 20); stars.position.copy(camPos);
    var ext = Math.max(R * 3.2, d * 1.4);
    gridG.scale.set(ext, ext * 0.6, ext); gridG.position.set(0, -R * 1.25, 0);
    V.p3 = project;
    return V;
  }
  // 平面上 (x, y) km → 安全区像素;被地球挡住时返回 [NaN, NaN]
  function project(x, y) {
    v3.set(x / KM, 0, y / KM);
    // 视线与地球球面求交:点在球后方即视为遮挡
    var ox = camPos.x, oy = camPos.y, oz = camPos.z, dx = v3.x - ox, dy = v3.y - oy, dz = v3.z - oz;
    var L = Math.sqrt(dx * dx + dy * dy + dz * dz); dx /= L; dy /= L; dz /= L;
    var bb = ox * dx + oy * dy + oz * dz, cc = ox * ox + oy * oy + oz * oz - R * R, disc = bb * bb - cc;
    if (disc > 0) { var t1 = -bb - Math.sqrt(disc); if (t1 > 0 && t1 < L - 1e-4) return [NaN, NaN]; }
    v3.project(cam);
    return [(v3.x + 1) / 2 * state.W - state.zone.x, (1 - v3.y) / 2 * state.H - state.zone.y];
  }

  function render(L) {
    if (!state.ok) return;
    size();
    var t = (performance.now() - state.t0) / 1000;
    var st = L && L.st || {}, m = (L && L.v && L.v.m) || (st.mu ? st.mu / 398600.4418 : 1);
    state.mass += (m - state.mass) * 0.12;
    var gs = gridG.scale.x || 1, depthU = R * 0.9 * Math.sqrt(state.mass);
    // 引力井深度/半径以局部坐标表达(网格 y 方向已乘 0.6)
    grid.setWells([{ x: 0, z: 0, depth: depthU / (gs * 0.6), r: (R * 1.1) / gs }]);
    grid.uni.uTime.value = t;
    var orb = st.orbits || 0;
    if (orb !== state.lastOrb) { if (orb > state.lastOrb && state.lastOrb >= 0) grid.uni.uRip.value.set(0, 0, t, 0.9); state.lastOrb = orb; }
    if (!(L && L.RM)) earth.rotation.y = t * 0.05;
    renderer.render(scene, cam);
  }

  function setZone(Z) { state.zone = Z; }
  function show(on) { canvas.style.visibility = on ? "visible" : "hidden"; }
  function dispose() {
    state.ok = false;
    scene.traverse(function (o) { if (o.geometry) o.geometry.dispose(); if (o.material) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); } });
    renderer.dispose();
  }
  return { sinE: Math.sin(ELEV), view: view, project: project, render: render, setZone: setZone, show: show, dispose: dispose, three: THREE };
}
