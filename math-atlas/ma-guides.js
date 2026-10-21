/* 星图 Math Atlas · 3D 向导(v0.8.2)
 * 每位向导就是一个前沿数学名词本身:用会动的 3D 数学对象来表达它(程序化搭建,无外部模型)。
 * 任务页台词里的旧短名暂不改。
 */
import * as THREE from "three";

export var GUIDES = {
  nim:      { title: "超现实数", shape: "会长枝的数之树",       why: "超现实数:康威把每一局博弈都变成了一个数。树每长一层,就生出一批新数。" },
  bee:      { title: "球堆积",   shape: "一球紧贴十二球",       why: "球堆积:2022 年菲尔兹奖。三维里,一个球最多同时贴住 12 个球。" },
  nav:      { title: "扩展图",   shape: "彼得森图上的漫步者",   why: "扩展图:连线很少,却四通八达。光点随便走几步,就能到任何地方。" },
  secret:   { title: "格密码",   shape: "格点与最短向量",       why: "格密码:在一大片格点里找最短的那根箭头,连量子计算机都犯难。" },
  chord:    { title: "朗兰兹",   shape: "数与波的双环",         why: "朗兰兹纲领:把数论(金环)和“波”(蓝环)扣在一起的大统一蓝图。" },
  cat:      { title: "扩散模型", shape: "从噪声里聚成形",       why: "扩散模型:AI 从一团随机噪点出发,一步步去噪,聚出图像。" },
  casino:   { title: "随机矩阵", shape: "半圆律",               why: "随机矩阵:每次都随机,特征值却总排成一个半圆(维格纳半圆律)。" },
  epidemic: { title: "渗流",     shape: "临界簇",               why: "渗流:2022 年菲尔兹奖。打通的格子一过临界比例,就突然连成一片。" },
  rocket:   { title: "辛几何",   shape: "相空间里守恒的面积",   why: "辛几何:轨道力学背后的几何。一团状态会被拉长扭弯,面积却永远不变。" },
  cube:     { title: "范畴论",   shape: "交换三角形",           why: "范畴论:只看“箭头”的数学。先走 f 再走 g,和直接走 g∘f 一样。" }
};

var ICE = 0x6fc6ff, GOLD = 0xf2c879, VIO = 0xb69cff, WHITE = 0xeaf4ff;
var SPH = new THREE.SphereGeometry(1, 20, 14);
function glow(c, k) { return new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: k == null ? 0.7 : k, roughness: 0.35, metalness: 0.1 }); }
function ball(c, r, p, k) { var m = new THREE.Mesh(SPH, glow(c, k)); m.scale.setScalar(r); if (p) m.position.copy(p); return m; }
function line(pts, c, op) { var g = new THREE.BufferGeometry().setFromPoints(pts); return new THREE.Line(g, new THREE.LineBasicMaterial({ color: c, transparent: true, opacity: op == null ? 0.8 : op })); }
function arrow(a, b, c, r) {
  var g = new THREE.Group(), d = b.clone().sub(a), L = d.length(), head = Math.min(0.18, L * 0.3);
  var shaft = new THREE.Mesh(new THREE.CylinderGeometry(r, r, L - head, 8), glow(c, 0.8)); shaft.position.y = (L - head) / 2;
  var tip = new THREE.Mesh(new THREE.ConeGeometry(r * 3, head, 12), glow(c, 0.9)); tip.position.y = L - head / 2;
  g.add(shaft, tip); g.position.copy(a); g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); return g;
}
function V(x, y, z) { return new THREE.Vector3(x, y, z); }
function rng(seed) { var s = seed >>> 0; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

var BUILD = {
  /* 超现实数:二叉树一层层长出(第 n 天生出 2^n 个新数) */
  nim: function (g) {
    var nodes = [], edges = [];
    (function grow(p, depth, spread, parent) {
      var n = ball(depth === 0 ? GOLD : ICE, 0.09 - depth * 0.012, p); n.userData.d = depth; g.add(n); nodes.push(n);
      if (parent) { var l = line([parent, p], ICE, 0.7); l.userData.d = depth; g.add(l); edges.push(l); }
      if (depth < 4) [-1, 1].forEach(function (k) { grow(V(p.x + k * spread, p.y + 0.38, p.z + (depth % 2 ? k * spread * 0.4 : 0)), depth + 1, spread * 0.5, p); });
    })(V(0, -0.78, 0), 0, 0.5, null);
    return function (t, still) {
      var lvl = still ? 4 : (t * 0.9) % 6.5;
      nodes.forEach(function (n) { var on = n.userData.d <= lvl; n.visible = on; n.material.emissiveIntensity = on ? 0.5 + 0.5 * Math.max(0, 1 - (lvl - n.userData.d)) : 0; });
      edges.forEach(function (l) { l.visible = l.userData.d <= lvl; });
    };
  },
  /* 球堆积:中心球 + 12 个相切球(接吻数 12),呼吸开合 */
  bee: function (g) {
    var c = ball(GOLD, 0.3, V(0, 0, 0), 0.6), outer = [], dirs = [];
    g.add(c);
    [[1, 1, 0], [1, -1, 0], [-1, 1, 0], [-1, -1, 0], [1, 0, 1], [1, 0, -1], [-1, 0, 1], [-1, 0, -1], [0, 1, 1], [0, 1, -1], [0, -1, 1], [0, -1, -1]].forEach(function (d) {
      var v = V(d[0], d[1], d[2]).normalize(); dirs.push(v);
      var m = new THREE.Mesh(SPH, new THREE.MeshStandardMaterial({ color: ICE, emissive: ICE, emissiveIntensity: 0.25, transparent: true, opacity: 0.55, roughness: 0.1, metalness: 0.2 }));
      m.scale.setScalar(0.3); g.add(m); outer.push(m);
    });
    return function (t, still) { var r = 0.6 + (still ? 0 : 0.12 * Math.max(0, Math.sin(t * 1.3))); outer.forEach(function (m, i) { m.position.copy(dirs[i]).multiplyScalar(r); }); };
  },
  /* 扩展图:彼得森图 + 随机漫步的光点 */
  nav: function (g) {
    var P = [], E = [];
    for (var i = 0; i < 5; i++) { var a = Math.PI / 2 + i * 2 * Math.PI / 5; P.push(V(Math.cos(a) * 0.95, Math.sin(a) * 0.95, 0.25)); }
    for (i = 0; i < 5; i++) { a = Math.PI / 2 + i * 2 * Math.PI / 5; P.push(V(Math.cos(a) * 0.45, Math.sin(a) * 0.45, -0.25)); }
    for (i = 0; i < 5; i++) { E.push([i, (i + 1) % 5]); E.push([i, i + 5]); E.push([5 + i, 5 + (i + 2) % 5]); }
    var adj = P.map(function () { return []; }); E.forEach(function (e) { adj[e[0]].push(e[1]); adj[e[1]].push(e[0]); g.add(line([P[e[0]], P[e[1]]], ICE, 0.55)); });
    var nb = P.map(function (p, k) { var m = ball(k < 5 ? ICE : VIO, 0.07, p, 0.5); g.add(m); return m; });
    var walker = ball(GOLD, 0.1, P[0], 1.2); g.add(walker);
    var R = rng(7), from = 0, to = adj[0][0], seen = new Array(10).fill(0);
    return function (t, still) {
      if (still) { walker.position.copy(P[0]); return; }
      var k = (t * 1.6) % 1, step = Math.floor(t * 1.6);
      if (step !== walker.userData.s) { walker.userData.s = step; from = to; to = adj[from][Math.floor(R() * 3)]; seen[from] = t; }
      walker.position.lerpVectors(P[from], P[to], k);
      nb.forEach(function (m, j) { m.material.emissiveIntensity = 0.4 + 1.2 * Math.max(0, 1 - (t - seen[j]) * 0.8); });
    };
  },
  /* 格密码:斜格点 + 很长的“坏基”(金)与最短向量(冰蓝) */
  secret: function (g) {
    var b1 = V(0.42, 0.12, 0), b2 = V(0.18, 0.4, 0.1), b3 = V(-0.06, 0.1, 0.42), pts = [];
    for (var i = -2; i <= 2; i++) for (var j = -2; j <= 2; j++) for (var k = -1; k <= 1; k++) {
      var p = b1.clone().multiplyScalar(i).add(b2.clone().multiplyScalar(j)).add(b3.clone().multiplyScalar(k)).sub(V(0, 0, 0));
      if (p.length() > 1.15) continue; var m = ball(WHITE, 0.035, p, 0.35); g.add(m); pts.push(m);
    }
    var O = V(0, 0, 0); g.add(ball(GOLD, 0.06, O, 0.9));
    var bad1 = arrow(O, b1.clone().multiplyScalar(2).add(b2.clone().multiplyScalar(1)), GOLD, 0.018);
    var bad2 = arrow(O, b1.clone().multiplyScalar(-1).add(b2.clone().multiplyScalar(2)), GOLD, 0.018);
    var short = arrow(O, b3.clone(), ICE, 0.028);
    g.add(bad1, bad2, short);
    return function (t, still) { short.children.forEach(function (m) { m.material.emissiveIntensity = still ? 1 : 0.6 + 0.6 * Math.max(0, Math.sin(t * 2.2)); }); };
  },
  /* 朗兰兹:金环(数)与带波纹的蓝环(波)相扣 */
  chord: function (g) {
    var gold = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.035, 12, 96), glow(GOLD, 0.6)); gold.position.x = -0.25; gold.rotation.y = 0.5;
    var beads = []; for (var i = 0; i < 7; i++) { var a = i / 7 * Math.PI * 2, b = ball(WHITE, 0.045, V(Math.cos(a) * 0.5, Math.sin(a) * 0.5, 0), 0.8); gold.add(b); beads.push(b); } /* 7 个“素数”珠 */
    var N = 240, pos = new Float32Array(N * 3), geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    var wave = new THREE.LineLoop(geo, new THREE.LineBasicMaterial({ color: WHITE, transparent: true, opacity: 0.9 })); wave.position.x = 0.25; wave.rotation.set(Math.PI / 2 - 0.5, 0.35, 0);
    var blue = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.022, 10, 96), glow(ICE, 0.55)); blue.position.copy(wave.position); blue.rotation.copy(wave.rotation);
    g.add(gold, blue, wave);
    return function (t, still) {
      var ph = still ? 0 : t * 2;
      for (var i = 0; i < N; i++) { var a = i / N * Math.PI * 2, r = 0.5 + 0.06 * Math.sin(a * 7 + ph); pos[i * 3] = Math.cos(a) * r; pos[i * 3 + 1] = Math.sin(a) * r; pos[i * 3 + 2] = 0.05 * Math.cos(a * 7 + ph); }
      geo.attributes.position.needsUpdate = true;
    };
  },
  /* 扩散模型:点云在“噪声”与“三叶结”之间来回去噪 */
  cat: function (g) {
    var N = 420, R = rng(3), noise = new Float32Array(N * 3), shape = new Float32Array(N * 3), pos = new Float32Array(N * 3);
    for (var i = 0; i < N; i++) {
      var u = R() * 2 - 1, th = R() * Math.PI * 2, rr = Math.cbrt(R()) * 1.05, s = Math.sqrt(1 - u * u);
      noise[i * 3] = rr * s * Math.cos(th); noise[i * 3 + 1] = rr * u; noise[i * 3 + 2] = rr * s * Math.sin(th);
      var q = i / N * Math.PI * 2, j = (R() - 0.5) * 0.06;
      shape[i * 3] = (Math.sin(q) + 2 * Math.sin(2 * q)) * 0.28 + j; shape[i * 3 + 1] = (Math.cos(q) - 2 * Math.cos(2 * q)) * 0.28 + j; shape[i * 3 + 2] = -Math.sin(3 * q) * 0.28 + j;
    }
    var geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    var pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: ICE, size: 0.045, transparent: true, opacity: 0.95 }));
    g.add(pts);
    return function (t, still) {
      var c = still ? 1 : Math.min(1, Math.max(0, 0.5 - 0.62 * Math.cos(t * 0.7)));   /* 0=噪声,1=成形 */
      var e = c * c * (3 - 2 * c);
      for (var i = 0; i < N * 3; i++) pos[i] = noise[i] * (1 - e) + shape[i] * e;
      geo.attributes.position.needsUpdate = true; pts.material.color.setHex(e > 0.85 ? GOLD : ICE);
    };
  },
  /* 随机矩阵:随机抖动的柱子,轮廓始终贴着维格纳半圆 */
  casino: function (g) {
    var bars = [], n = 15, R = rng(11);
    for (var i = 0; i < n; i++) {
      var x = (i - (n - 1) / 2) / ((n - 1) / 2) * 0.95;
      var m = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1, 0.1), glow(i % 2 ? ICE : VIO, 0.45)); m.position.x = x; m.userData.h = Math.sqrt(Math.max(0, 1 - (x / 1.0) * (x / 1.0))) * 1.1; g.add(m); bars.push(m);
    }
    var arc = []; for (i = 0; i <= 64; i++) { var a = Math.PI - i / 64 * Math.PI; arc.push(V(Math.cos(a) * 1.0, Math.sin(a) * 1.1 - 0.6, 0.08)); }
    g.add(line(arc, GOLD, 0.95));
    var jit = bars.map(function () { return 0; }), last = -1;
    return function (t, still) {
      var s = Math.floor(t * 2.5); if (s !== last) { last = s; jit = bars.map(function () { return still ? 0 : (R() - 0.5) * 0.22; }); }
      bars.forEach(function (m, i) { var h = Math.max(0.03, m.userData.h * (1 + jit[i])); m.scale.y += (h - m.scale.y) * 0.25; m.position.y = -0.6 + m.scale.y / 2; });
    };
  },
  /* 渗流:5×5×5 格子,打通比例 p 来回扫过临界值;连通到底就变金 */
  epidemic: function (g) {
    var n = 5, R = rng(5), cells = [], val = [];
    for (var x = 0; x < n; x++) for (var y = 0; y < n; y++) for (var z = 0; z < n; z++) {
      var m = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.2), new THREE.MeshStandardMaterial({ color: WHITE, emissive: ICE, emissiveIntensity: 0.2, transparent: true, opacity: 0.12, roughness: 0.4 }));
      m.position.set((x - 2) * 0.28, (y - 2) * 0.28, (z - 2) * 0.28); g.add(m); cells.push(m); val.push(R());
    }
    function id(x, y, z) { return (x * n + y) * n + z; }
    var lastP = -1;
    return function (t, still) {
      var p = still ? 0.36 : 0.12 + 0.34 * (0.5 - 0.5 * Math.cos(t * 0.55)); p = Math.round(p * 40) / 40; if (p === lastP) return; lastP = p;
      var seen = new Uint8Array(n * n * n), q = [];
      for (var x = 0; x < n; x++) for (var z = 0; z < n; z++) { var k = id(x, n - 1, z); if (val[k] < p) { seen[k] = 1; q.push([x, n - 1, z]); } }
      var span = false;
      while (q.length) { var c = q.pop(); if (c[1] === 0) span = true; [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]].forEach(function (d) { var a = c[0] + d[0], b = c[1] + d[1], e = c[2] + d[2]; if (a < 0 || b < 0 || e < 0 || a >= n || b >= n || e >= n) return; var k2 = id(a, b, e); if (!seen[k2] && val[k2] < p) { seen[k2] = 1; q.push([a, b, e]); } }); }
      cells.forEach(function (m, k) {
        var open = val[k] < p, inC = seen[k];
        var col = inC ? (span ? GOLD : ICE) : VIO;
        m.material.opacity = inC ? 0.9 : open ? 0.35 : 0.06; m.material.color.setHex(open ? col : WHITE);
        m.material.emissive.setHex(col); m.material.emissiveIntensity = inC ? 0.45 : open ? 0.15 : 0.03;
      });
    };
  },
  /* 辛几何:相空间里一团点被扭成螺旋,面积守恒(刘维尔定理) */
  rocket: function (g) {
    for (var r = 0.25; r <= 1.0; r += 0.25) { var c = []; for (var i = 0; i <= 64; i++) { var a = i / 64 * Math.PI * 2; c.push(V(Math.cos(a) * r, Math.sin(a) * r * 0.8, 0)); } g.add(line(c, ICE, 0.25)); }
    g.add(line([V(-1.1, 0, 0), V(1.1, 0, 0)], WHITE, 0.3), line([V(0, -0.95, 0), V(0, 0.95, 0)], WHITE, 0.3));
    var N = 260, R = rng(9), base = [], pos = new Float32Array(N * 3);
    for (i = 0; i < N; i++) { var rr = Math.sqrt(R()) * 0.22, th = R() * Math.PI * 2; base.push([0.6 + rr * Math.cos(th), rr * Math.sin(th)]); }
    var geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.add(new THREE.Points(geo, new THREE.PointsMaterial({ color: GOLD, size: 0.055 })));
    return function (t, still) {
      var T = still ? 0 : (t % 9);
      for (var i = 0; i < N; i++) {
        var x = base[i][0], y = base[i][1], r = Math.hypot(x, y), a = Math.atan2(y, x), w = 1.6 / (0.4 + r);   /* 角速度随半径变化:扭转映射,保面积 */
        var b = a + w * T * 0.6; pos[i * 3] = Math.cos(b) * r; pos[i * 3 + 1] = Math.sin(b) * r * 0.8; pos[i * 3 + 2] = 0.02;
      }
      geo.attributes.position.needsUpdate = true;
    };
  },
  /* 范畴论:A→B→C 与 A→C 两路光点同时出发、同时到达(图交换) */
  cube: function (g) {
    var A = V(-0.75, -0.5, 0), B = V(0, 0.75, 0.1), C = V(0.75, -0.5, 0);
    [A, B, C].forEach(function (p, i) { g.add(ball([ICE, VIO, ICE][i], 0.13, p, 0.6)); });
    function trim(a, b) { var d = b.clone().sub(a).normalize(); return [a.clone().add(d.clone().multiplyScalar(0.16)), b.clone().sub(d.clone().multiplyScalar(0.16))]; }
    var f = trim(A, B), gg = trim(B, C), h = trim(A, C);
    g.add(arrow(f[0], f[1], GOLD, 0.015), arrow(gg[0], gg[1], GOLD, 0.015), arrow(h[0], h[1], ICE, 0.015));
    [A, B, C].forEach(function (p) { var loop = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.008, 6, 32, Math.PI * 1.6), glow(WHITE, 0.5)); loop.position.copy(p).add(V(0, 0.2, 0)); loop.rotation.z = -Math.PI * 0.3; g.add(loop); }); /* 恒等箭头 */
    var p1 = ball(GOLD, 0.06, A, 1.4), p2 = ball(ICE, 0.06, A, 1.4); g.add(p1, p2);
    return function (t, still) {
      var k = still ? 1 : Math.min(1, (t % 3.2) / 2.6);
      if (k < 0.5) p1.position.lerpVectors(A, B, k * 2); else p1.position.lerpVectors(B, C, (k - 0.5) * 2);
      p2.position.lerpVectors(A, C, k);
      var s = k >= 1 ? 1.6 : 1; p1.scale.setScalar(0.06 * s); p2.scale.setScalar(0.06 * s);
    };
  }
};

/* ---------- 小窗口渲染 ---------- */
export function createGuideView(canvas, opts) {
  opts = opts || {};
  var renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true }); } catch (e) { return null; }
  var mobile = matchMedia("(pointer: coarse)").matches;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  var scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
  cam.position.set(0, 0.15, 4.0); cam.lookAt(0, 0, 0);
  scene.add(new THREE.HemisphereLight(0xdfeaff, 0x1a1030, 1.2));
  var key = new THREE.DirectionalLight(0xffffff, 1.8); key.position.set(2, 3, 4); scene.add(key);
  var rim = new THREE.DirectionalLight(ICE, 2.4); rim.position.set(-3, 1.5, -3); scene.add(rim);
  var holder = new THREE.Group(); scene.add(holder);
  var current = null, upd = null, cache = {}, raf = 0, running = false, t0 = performance.now(), reduce = !!opts.reduce;
  function size() { var w = canvas.clientWidth || 64, h = canvas.clientHeight || 64; renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); }
  function frame(now) {
    raf = 0; if (!running) return;
    var t = (now - t0) / 1000;
    if (current) { current.rotation.y = reduce ? -0.4 : -0.4 + Math.sin(t * 0.35) * 0.6; current.rotation.x = reduce ? 0.15 : 0.15 + Math.sin(t * 0.23) * 0.12; }
    if (upd) upd(t, reduce);
    renderer.render(scene, cam);
    if (!reduce && !document.hidden) raf = requestAnimationFrame(frame);
  }
  function play() { running = true; if (!raf) raf = requestAnimationFrame(frame); }
  document.addEventListener("visibilitychange", function () { if (!document.hidden && running) play(); });
  return {
    set: function (id) {
      if (current) holder.remove(current);
      if (!cache[id]) { var g = new THREE.Group(), u = (BUILD[id] || BUILD.nim)(g); g.scale.setScalar(0.92); cache[id] = { g: g, u: u }; }
      current = cache[id].g; upd = cache[id].u; holder.add(current);
      t0 = performance.now(); size(); play(); if (reduce) requestAnimationFrame(frame);
    },
    stop: function () { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; },
    setReduce: function (v) { reduce = v; play(); },
    resize: size
  };
}
