/* 星图 Math Atlas · 3D 向导形象(v0.8.1)
 * 十位动物向导,用基本几何体程序化搭建(无外部模型文件),冰蓝轮廓光 + 金色称号光环。
 * 称号取自数学前沿名词;任务页台词里的短名(松鼠博士等)不变。
 */
import * as THREE from "three";

export var GUIDES = {
  nim:      { title: "超现实数", name: "松鼠博士", sym: "ω",    why: "超现实数:康威把每一局博弈都变成了一个数。" },
  bee:      { title: "球堆积",   name: "蜂博士",   sym: "E₈",   why: "球堆积:2022 年菲尔兹奖,8 维空间里最密的装球法。" },
  nav:      { title: "扩展图",   name: "蚁博士",   sym: "λ₂",   why: "扩展图:连线很少,却四通八达的网络。" },
  secret:   { title: "格密码",   name: "枭博士",   sym: "Λ",    why: "格密码:连量子计算机都难破解的新一代密码。" },
  chord:    { title: "朗兰兹",   name: "琴鸟博士", sym: "L(s)", why: "朗兰兹纲领:把数论和“波”连在一起的大统一蓝图。" },
  cat:      { title: "扩散模型", name: "喵博士",   sym: "∇",    why: "扩散模型:AI 从一团噪声里,一步步“画”出图像。" },
  casino:   { title: "随机矩阵", name: "浣熊博士", sym: "GUE",  why: "随机矩阵:一大堆随机数,竟排出整齐的规律。" },
  epidemic: { title: "渗流",     name: "刺猬博士", sym: "pc",   why: "渗流:2022 年菲尔兹奖,水什么时候能渗透整块石头。" },
  rocket:   { title: "辛几何",   name: "狐狸船长", sym: "dq∧dp", why: "辛几何:轨道力学背后的几何,有一种“面积”永远守恒。" },
  cube:     { title: "范畴论",   name: "熊猫教授", sym: "f∘g",  why: "范畴论:只看“箭头”的数学,研究变换本身。" }
};

/* ---------- 搭建工具 ---------- */
var M = {};
function mat(c, o) { var k = c + (o ? JSON.stringify(o) : ""); return M[k] || (M[k] = new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.55, metalness: 0.05 }, o || {}))); }
function mesh(geo, c, p, s, r, o) { var m = new THREE.Mesh(geo, mat(c, o)); if (p) m.position.set(p[0], p[1], p[2]); if (s) m.scale.set(s[0], s[1], s[2]); if (r) m.rotation.set(r[0], r[1], r[2]); return m; }
var G = {
  s: new THREE.SphereGeometry(1, 28, 20), c: new THREE.ConeGeometry(1, 1, 20), cy: new THREE.CylinderGeometry(1, 1, 1, 20),
  t: new THREE.TorusGeometry(1, 0.08, 10, 48), b: new THREE.BoxGeometry(1, 1, 1), sp: new THREE.ConeGeometry(1, 1, 6)
};
function add(g) { for (var i = 1; i < arguments.length; i++) g.add(arguments[i]); return g; }
function eyes(g, x, y, z, r, white) {
  [-1, 1].forEach(function (k) {
    if (white) g.add(mesh(G.s, 0xffffff, [k * x, y, z - r * 0.3], [r * 1.5, r * 1.5, r * 0.8]));
    g.add(mesh(G.s, 0x0b0f1c, [k * x, y, z], [r, r, r * 0.6], null, { roughness: 0.2 }));
    g.add(mesh(G.s, 0xffffff, [k * x + r * 0.3, y + r * 0.35, z + r * 0.45], [r * 0.3, r * 0.3, r * 0.3], null, { emissive: 0xffffff, emissiveIntensity: 1 }));
  });
}
function nose(g, y, z, r, c) { g.add(mesh(G.s, c || 0x2a1f22, [0, y, z], [r * 1.3, r, r])); }
function glasses(g, y, z) { [-1, 1].forEach(function (k) { g.add(mesh(G.t, 0xf2c879, [k * 0.3, y, z], [0.2, 0.2, 0.2], null, { metalness: 0.8, roughness: 0.25 })); }); g.add(mesh(G.cy, 0xf2c879, [0, y, z], [0.02, 0.2, 0.02], [0, 0, Math.PI / 2], { metalness: 0.8, roughness: 0.25 })); }

var BUILD = {
  nim: function (g) { // 松鼠:圆头、尖耳、蓬松大尾
    var b = 0xc8743a, l = 0xf3d3a8;
    add(g, mesh(G.s, b, [0, 0, 0], [0.82, 0.78, 0.76]), mesh(G.s, l, [0, -0.2, 0.5], [0.5, 0.4, 0.35]));
    [-1, 1].forEach(function (k) { g.add(mesh(G.c, b, [k * 0.45, 0.72, 0], [0.18, 0.42, 0.14], [0, 0, -k * 0.35])); g.add(mesh(G.c, 0xfff1e0, [k * 0.46, 0.84, -0.02], [0.05, 0.12, 0.05], [0, 0, -k * 0.35])); });
    var tail = new THREE.Group(); [0, 1, 2, 3].forEach(function (i) { tail.add(mesh(G.s, i % 2 ? 0xd98a4c : b, [0.25 * Math.sin(i * 0.9), 0.32 * i, -0.15 * i], [0.38 - i * 0.03, 0.42, 0.34])); });
    tail.position.set(0.55, -0.3, -0.55); tail.rotation.z = -0.35; g.add(tail);
    eyes(g, 0.28, 0.12, 0.66, 0.1); nose(g, -0.08, 0.84, 0.07);
  },
  bee: function (g) { // 蜜蜂:黄黑条纹圆身、触角、透明翅
    add(g, mesh(G.s, 0xffc93c, [0, 0, 0], [0.78, 0.78, 0.78]));
    [-0.22, 0.2].forEach(function (y) { g.add(mesh(G.cy, 0x22180c, [0, y - 0.25, 0], [0.8, 0.12, 0.8])); });
    [-1, 1].forEach(function (k) {
      g.add(mesh(G.cy, 0x22180c, [k * 0.25, 0.85, 0.1], [0.025, 0.45, 0.025], [0.3, 0, -k * 0.4]));
      g.add(mesh(G.s, 0x22180c, [k * 0.38, 1.06, 0.18], [0.08, 0.08, 0.08]));
      g.add(mesh(G.s, 0xdff4ff, [k * 0.8, 0.45, -0.3], [0.45, 0.22, 0.04], [0.2, k * 0.5, -k * 0.5], { transparent: true, opacity: 0.55, roughness: 0.1, emissive: 0x6fc6ff, emissiveIntensity: 0.25 }));
    });
    eyes(g, 0.27, 0.18, 0.66, 0.11);
    g.add(mesh(G.t, 0x22180c, [0, -0.15, 0.7], [0.12, 0.08, 0.08], [0, 0, Math.PI]));
  },
  nav: function (g) { // 蚂蚁:三节身、长触角
    var c = 0x7a3b2a;
    add(g, mesh(G.s, c, [0, 0.15, 0.1], [0.6, 0.56, 0.56]), mesh(G.s, c, [0, -0.5, -0.25], [0.32, 0.28, 0.3]), mesh(G.s, c, [0, -0.92, -0.65], [0.48, 0.4, 0.48]));
    [-1, 1].forEach(function (k) {
      var a = new THREE.Group(); a.add(mesh(G.cy, c, [0, 0.3, 0], [0.03, 0.6, 0.03])); a.add(mesh(G.cy, c, [k * 0.18, 0.66, 0.12], [0.025, 0.4, 0.025], [0.5, 0, -k * 0.6])); a.add(mesh(G.s, 0xffd27a, [k * 0.3, 0.82, 0.24], [0.06, 0.06, 0.06], null, { emissive: 0xffc04a, emissiveIntensity: 0.8 }));
      a.position.set(k * 0.22, 0.6, 0.25); a.rotation.z = -k * 0.35; g.add(a);
    });
    eyes(g, 0.24, 0.24, 0.55, 0.11); glasses(g, 0.24, 0.62);
  },
  secret: function (g) { // 猫头鹰:大眼、耳羽、喙
    var c = 0x6b5a7e, l = 0xcfc0de;
    add(g, mesh(G.s, c, [0, 0, 0], [0.82, 0.86, 0.74]), mesh(G.s, l, [0, -0.25, 0.42], [0.55, 0.5, 0.35]));
    [-1, 1].forEach(function (k) { g.add(mesh(G.c, c, [k * 0.48, 0.78, 0], [0.16, 0.38, 0.12], [0, 0, -k * 0.5])); g.add(mesh(G.s, 0xffe8b0, [k * 0.3, 0.15, 0.55], [0.26, 0.26, 0.12])); });
    eyes(g, 0.3, 0.15, 0.66, 0.13);
    g.add(mesh(G.c, 0xf2b640, [0, -0.08, 0.72], [0.08, 0.2, 0.08], [Math.PI, 0, 0]));
  },
  chord: function (g) { // 琴鸟:鸟头 + 竖琴形尾羽扇
    var c = 0x4f6fb8;
    add(g, mesh(G.s, c, [0, 0, 0], [0.7, 0.72, 0.68]), mesh(G.s, 0xe8f1ff, [0, -0.25, 0.38], [0.45, 0.4, 0.3]));
    for (var i = -3; i <= 3; i++) g.add(mesh(G.cy, i % 2 ? 0x9fd8ff : 0xf2c879, [i * 0.13, 0.55, -0.55], [0.03, 1.1 - Math.abs(i) * 0.1, 0.03], [0, 0, -i * 0.16], { emissive: i % 2 ? 0x2a6aa0 : 0x6a4a10, emissiveIntensity: 0.6 }));
    g.add(mesh(G.t, 0x9fd8ff, [0, 0.9, -0.55], [0.5, 0.5, 0.5], [0, 0, 0], { emissive: 0x2a6aa0, emissiveIntensity: 0.5 }));
    eyes(g, 0.24, 0.12, 0.6, 0.1);
    g.add(mesh(G.c, 0xf2b640, [0, -0.04, 0.78], [0.08, 0.3, 0.08], [Math.PI / 2, 0, 0]));
  },
  cat: function (g) { // 猫:三角耳、胡须
    var c = 0x8a8fa8, l = 0xf2f2f8;
    add(g, mesh(G.s, c, [0, 0, 0], [0.84, 0.74, 0.74]), mesh(G.s, l, [0, -0.2, 0.5], [0.42, 0.3, 0.3]));
    [-1, 1].forEach(function (k) {
      g.add(mesh(G.sp, c, [k * 0.5, 0.68, 0], [0.24, 0.42, 0.14], [0, 0, -k * 0.3])); g.add(mesh(G.sp, 0xffb6c8, [k * 0.5, 0.66, 0.06], [0.12, 0.26, 0.06], [0, 0, -k * 0.3]));
      for (var j = 0; j < 2; j++) g.add(mesh(G.cy, 0xffffff, [k * 0.5, -0.15 - j * 0.08, 0.6], [0.008, 0.42, 0.008], [0, 0, Math.PI / 2 + k * (j ? -0.12 : 0.12)], { emissive: 0xffffff, emissiveIntensity: 0.4 }));
    });
    eyes(g, 0.28, 0.1, 0.64, 0.11); nose(g, -0.1, 0.78, 0.06, 0xff8fb1);
  },
  casino: function (g) { // 浣熊:黑眼罩、圆耳
    var c = 0x8e8e96, l = 0xeaeaf0;
    add(g, mesh(G.s, c, [0, 0, 0], [0.84, 0.74, 0.74]), mesh(G.s, l, [0, -0.18, 0.5], [0.5, 0.34, 0.34]));
    [-1, 1].forEach(function (k) { g.add(mesh(G.s, c, [k * 0.55, 0.6, -0.05], [0.24, 0.24, 0.1])); g.add(mesh(G.s, 0x23232b, [k * 0.3, 0.12, 0.55], [0.3, 0.17, 0.12], [0, 0, k * 0.25])); g.add(mesh(G.s, l, [k * 0.3, 0.32, 0.58], [0.2, 0.06, 0.06])); });
    eyes(g, 0.3, 0.12, 0.68, 0.09); nose(g, -0.12, 0.84, 0.07);
  },
  epidemic: function (g) { // 刺猬:背刺 + 尖嘴
    var c = 0xc9a07a, sp = 0x5a4434;
    add(g, mesh(G.s, c, [0, -0.05, 0.1], [0.66, 0.6, 0.62]), mesh(G.s, c, [0, -0.18, 0.62], [0.26, 0.22, 0.32]));
    for (var i = 0; i < 44; i++) {
      var a = i * 2.39996, y = 1 - (i + 0.5) / 44 * 1.55, r = Math.sqrt(Math.max(0, 1 - y * y));
      var dir = new THREE.Vector3(Math.cos(a) * r, y + 0.15, -Math.abs(Math.sin(a) * r) * 0.8 - 0.05).normalize();
      if (dir.z > 0.2 && dir.y < 0.5) continue;
      var s = mesh(G.c, i % 3 ? sp : 0xe8d5bf, [dir.x * 0.62, dir.y * 0.58, dir.z * 0.62 + 0.02], [0.075, 0.5, 0.075]);
      s.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir); g.add(s);
    }
    eyes(g, 0.22, 0.06, 0.62, 0.1); nose(g, -0.15, 0.94, 0.07);
  },
  rocket: function (g) { // 狐狸:尖嘴、大耳、船长帽
    var c = 0xe0703a, l = 0xfff1e6;
    add(g, mesh(G.s, c, [0, 0, 0], [0.78, 0.7, 0.7]), mesh(G.c, l, [0, -0.15, 0.62], [0.26, 0.55, 0.24], [Math.PI / 2, 0, 0]));
    [-1, 1].forEach(function (k) { g.add(mesh(G.sp, c, [k * 0.46, 0.66, 0], [0.24, 0.5, 0.12], [0, 0, -k * 0.35])); g.add(mesh(G.s, l, [k * 0.42, -0.2, 0.42], [0.22, 0.2, 0.2])); });
    g.add(mesh(G.cy, 0x1b2a4a, [0, 0.66, 0], [0.5, 0.18, 0.5])); g.add(mesh(G.cy, 0x1b2a4a, [0, 0.58, 0.12], [0.55, 0.04, 0.6]));
    g.add(mesh(G.cy, 0xf2c879, [0, 0.66, 0.02], [0.505, 0.04, 0.505], null, { metalness: 0.8, roughness: 0.3 }));
    g.add(mesh(G.s, 0xf2c879, [0, 0.68, 0.5], [0.08, 0.08, 0.04], null, { emissive: 0xf2c879, emissiveIntensity: 0.6 }));
    eyes(g, 0.26, 0.12, 0.6, 0.09); nose(g, -0.15, 0.9, 0.06);
  },
  cube: function (g) { // 熊猫:黑耳、黑眼圈 + 小魔方
    var w = 0xf5f6fa, k0 = 0x1c1d24;
    add(g, mesh(G.s, w, [0, 0, 0], [0.86, 0.78, 0.76]));
    [-1, 1].forEach(function (k) { g.add(mesh(G.s, k0, [k * 0.55, 0.62, -0.05], [0.24, 0.24, 0.14])); g.add(mesh(G.s, k0, [k * 0.3, 0.1, 0.58], [0.2, 0.25, 0.12], [0, 0, -k * 0.5])); });
    eyes(g, 0.3, 0.12, 0.68, 0.08); nose(g, -0.14, 0.76, 0.08);
    var cb = new THREE.Group(), cols = [0xff6b6b, 0xffd36e, 0x6ff0c8, 0x7fb0ff, 0xffffff, 0xff9f43];
    for (var x = 0; x < 2; x++) for (var y = 0; y < 2; y++) for (var z = 0; z < 2; z++) cb.add(mesh(G.b, cols[(x + 2 * y + 3 * z) % 6], [x * 0.21 - 0.105, y * 0.21 - 0.105, z * 0.21 - 0.105], [0.19, 0.19, 0.19], null, { roughness: 0.35 }));
    cb.position.set(0.62, -0.62, 0.45); cb.rotation.set(0.5, 0.7, 0); g.add(cb); g.userData.spinner = cb;
  }
};

function symTex(text) {
  var c = document.createElement("canvas"); c.width = 256; c.height = 128; var x = c.getContext("2d");
  x.font = "600 64px 'Times New Roman', 'Noto Serif', serif"; x.textAlign = "center"; x.textBaseline = "middle";
  x.shadowColor = "rgba(255,210,120,.9)"; x.shadowBlur = 16; x.fillStyle = "#ffe2a0"; x.fillText(text, 128, 66);
  var t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

/* ---------- 小窗口渲染 ---------- */
export function createGuideView(canvas, opts) {
  opts = opts || {};
  var renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true }); } catch (e) { return null; }
  var mobile = matchMedia("(pointer: coarse)").matches;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  var scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  cam.position.set(0, 0.35, 3.9); cam.lookAt(0, 0.3, 0);
  scene.add(new THREE.HemisphereLight(0xdfeaff, 0x1a1030, 1.4));
  var key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(2, 3, 4); scene.add(key);
  var rim = new THREE.DirectionalLight(0x6fc6ff, 3.2); rim.position.set(-3, 1.5, -3); scene.add(rim);
  var rim2 = new THREE.DirectionalLight(0xf2c879, 1.2); rim2.position.set(3, -1, -2); scene.add(rim2);
  var holder = new THREE.Group(); scene.add(holder);
  var halo = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.02, 8, 64), new THREE.MeshBasicMaterial({ color: 0xf2c879, transparent: true, opacity: 0.85 }));
  halo.rotation.x = Math.PI / 2.2; halo.position.y = 0.9; scene.add(halo);
  var dots = new THREE.Group(); for (var i = 0; i < 3; i++) { var d = new THREE.Mesh(G.s, new THREE.MeshBasicMaterial({ color: i ? 0x9fd8ff : 0xffe2a0 })); d.scale.setScalar(0.05); dots.add(d); } scene.add(dots);
  var sym = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthTest: false })); sym.scale.set(0.8, 0.4, 1); sym.position.set(0.95, 0.75, 0.3); scene.add(sym);
  var current = null, cache = {}, raf = 0, running = false, t0 = performance.now(), reduce = !!opts.reduce;
  function size() { var w = canvas.clientWidth || 64, h = canvas.clientHeight || 64; renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); }
  function frame(now) {
    raf = 0; if (!running) return;
    var t = (now - t0) / 1000;
    if (current) {
      current.rotation.y = reduce ? -0.35 : Math.sin(t * 0.7) * 0.55 - 0.15;
      current.position.y = reduce ? 0 : Math.sin(t * 1.6) * 0.05;
      if (current.userData.spinner && !reduce) current.userData.spinner.rotation.y = t * 1.2;
    }
    halo.rotation.z = reduce ? 0 : t * 0.4;
    dots.children.forEach(function (d, i) { var a = (reduce ? 0 : t * (1.2 + i * 0.35)) + i * 2.0944; d.position.set(Math.cos(a) * 0.5, 0.9 + Math.sin(a) * 0.5 * 0.06, Math.sin(a) * 0.5); });
    renderer.render(scene, cam);
    if (!reduce && !document.hidden) raf = requestAnimationFrame(frame);
  }
  function play() { running = true; if (!raf) raf = requestAnimationFrame(frame); }
  document.addEventListener("visibilitychange", function () { if (!document.hidden && running) play(); });
  return {
    set: function (id) {
      if (current) holder.remove(current);
      if (!cache[id]) { var g = new THREE.Group(); (BUILD[id] || BUILD.nim)(g); g.scale.setScalar(0.82); cache[id] = g; }
      current = cache[id]; holder.add(current);
      var info = GUIDES[id]; sym.material.map = info ? symTex(info.sym) : null; sym.material.needsUpdate = true; sym.visible = !!info && !!opts.symbol;
      size(); play(); if (reduce) requestAnimationFrame(frame);
    },
    stop: function () { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; },
    setReduce: function (v) { reduce = v; play(); },
    resize: size
  };
}
