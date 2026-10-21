/* 星图 Math Atlas · 共享场景模块 ma-gl.js(v0.8)
 * 依 HANDOFF §5.3.1:Three.js r169 本地 vendor/、渲染器/相机推拉/辉光后期/性能三档/降级判定/隐藏暂停 集中于此。
 * 场景 = 效果图 A3「星座成形」:倾斜旋涡星系盘 + 金色轨道环 + 9 星座(197 颗真实知识星,连线取星座内先修边)。
 * 开场(约 7 秒)与舞台为同一场景:开场末帧即舞台初始帧,不重建、不跳画面。
 */
import * as THREE from "three";
import { EffectComposer } from "./vendor/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "./vendor/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "./vendor/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "./vendor/addons/postprocessing/OutputPass.js";

/* ---------------- 性能分级 ---------------- */
export function detectTier() {
  var pref = readPref("ma:gl") || "auto";
  var gl = null;
  try { var c = document.createElement("canvas"); gl = c.getContext("webgl2") || c.getContext("webgl"); } catch (e) {}
  if (!gl) return { tier: "lo", pref: pref, webgl: false };
  if (pref === "hi" || pref === "mid" || pref === "lo") return { tier: pref, pref: pref, webgl: true };
  var mobile = matchMedia("(pointer: coarse)").matches || Math.min(screen.width, screen.height) < 600;
  var cores = navigator.hardwareConcurrency || 4, mem = navigator.deviceMemory || 4;
  var tier = (cores <= 2 || mem <= 1) ? "lo" : (mobile || cores <= 4 || mem <= 2) ? "mid" : "hi";
  return { tier: tier, pref: pref, webgl: true };
}
export function readPref(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }
export function writePref(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
export function reducedMotion() {
  var p = readPref("ma:motion");
  if (p === "reduce") return true;
  if (p === "full") return false;
  return matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/* ---------------- 工具 ---------------- */
function rng(seed) { var s = seed >>> 0 || 1; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
function gauss(r) { var u = r() || 1e-6, v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(6.2831853 * v); }
function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
function smooth(a, b, x) { var t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
function ease(t) { t = clamp(t, 0, 1); return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
function glowTex(stops, size) {
  size = size || 128; var c = document.createElement("canvas"); c.width = c.height = size; var x = c.getContext("2d");
  var g = x.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  stops.forEach(function (s) { g.addColorStop(s[0], s[1]); }); x.fillStyle = g; x.fillRect(0, 0, size, size);
  var t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

/* ---------------- 着色器 ---------------- */
var PTS_VS = [
  "attribute float aSize; attribute vec3 aColor; attribute float aDelay;",
  "uniform float uT; uniform float uPR; uniform float uScale; uniform float uFade;",
  "varying vec3 vC; varying float vA;",
  "void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); gl_Position = projectionMatrix * mv;",
  " float r = clamp((uT - aDelay) / 0.5, 0.0, 1.0); vA = r * uFade; vC = aColor;",
  " gl_PointSize = max(1.0, aSize * uPR * uScale / max(0.5, -mv.z) * (0.4 + 0.6 * r)); }"
].join("\n");
var PTS_FS = [
  "uniform float uAlpha; varying vec3 vC; varying float vA;",
  "void main(){ float d = length(gl_PointCoord - 0.5) * 2.0; if (d > 1.0) discard;",
  " float a = exp(-d * d * 5.0) * vA * uAlpha; gl_FragColor = vec4(vC * a, a); }"
].join("\n");
var STAR_VS = [
  "attribute float aSize; attribute vec3 aColor; attribute float aDelay; attribute float aLit; attribute float aHi; attribute float aPh;",
  "uniform float uT; uniform float uTime; uniform float uPR; uniform float uScale; uniform float uOnlyLit;",
  "varying vec3 vC; varying float vA; varying float vLit; varying float vHi;",
  "void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); gl_Position = projectionMatrix * mv;",
  " float r = clamp((uT - aDelay) / 0.35, 0.0, 1.0); float tw = 0.85 + 0.15 * sin(uTime * 2.0 + aPh);",
  " vA = r * mix(1.0, (aLit > 0.5 || aHi > 0.5) ? 1.0 : 0.18, uOnlyLit); vC = aColor; vLit = aLit; vHi = aHi;",
  " gl_PointSize = aSize * uPR * uScale / max(0.5, -mv.z) * tw * (1.0 + 0.35 * aHi) * (0.3 + 0.7 * r); }"
].join("\n");
var STAR_FS = [
  "varying vec3 vC; varying float vA; varying float vLit; varying float vHi;",
  "void main(){ float d = length(gl_PointCoord - 0.5) * 2.0; if (d > 1.0) discard;",
  " vec3 col = mix(vC, vec3(1.0, 0.82, 0.42), vHi);",
  " float core = smoothstep(0.30, 0.0, d); float glow = exp(-d * d * 7.0) * 0.55;",
  " float ring = smoothstep(0.10, 0.0, abs(d - 0.42)) * 0.95 + exp(-d * d * 9.0) * 0.12;",
  " float a = (vLit > 0.5 || vHi > 0.5) ? (core + glow) : ring;",
  " vec3 c = col * a + vec3(1.0) * core * 0.6 * max(vLit, vHi);",
  " gl_FragColor = vec4(c * vA, a * vA); }"
].join("\n");
var REVEAL_VS = [
  "attribute float aOrder; varying float vO; varying vec3 vW;",
  "void main(){ vO = aOrder; vec4 w = modelMatrix * vec4(position,1.0); vW = position; gl_Position = projectionMatrix * viewMatrix * w; }"
].join("\n");
var REVEAL_FS = [
  "uniform float uP; uniform float uAlpha; uniform vec3 uColor; varying float vO;",
  "void main(){ if (uP < 0.001 || vO > uP) discard; float a = uAlpha * (0.55 + 0.45 * smoothstep(uP - 0.04, uP, vO)); gl_FragColor = vec4(uColor * a, a); }"
].join("\n");
var GRID_FS = [
  "uniform float uGrow; uniform float uAlpha; uniform vec3 uColor; varying vec3 vW;",
  "void main(){ float l = length(vW.xz); float a = smoothstep(uGrow, uGrow - 2.0, l) * (1.0 - smoothstep(4.0, 11.0, l)) * uAlpha;",
  " if (a < 0.002) discard; gl_FragColor = vec4(uColor * a, a); }"
].join("\n");

/* ---------------- 场景 ---------------- */
var RINGS = [6.4, 9.6, 12.8];
var STAGE_VIEW = { az: 0.0, el: 0.44, dist: 29 };
var INTRO_LEN = 7.0;

export function createStage(opts) {
  var host = opts.host, DATA = opts.data, COLORS = opts.colors, LIT = opts.lit || {}, tier = opts.tier;
  var mobile = matchMedia("(pointer: coarse)").matches || innerWidth < 760;
  var reduce = reducedMotion();
  var hi = tier === "hi";
  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: hi, alpha: false, powerPreference: hi ? "high-performance" : "default" });
  } catch (e) { return null; }
  var PR = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2);
  if (!hi) PR = Math.min(PR, 1.25);
  renderer.setPixelRatio(PR);
  renderer.setClearColor(new THREE.Color(0.00009, 0.00014, 0.0004), 1); /* 经后期合成再编码一次后约为 #04060f */
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  host.appendChild(renderer.domElement);
  renderer.domElement.className = "gl-canvas";
  renderer.domElement.setAttribute("aria-hidden", "true");

  var scene = new THREE.Scene();
  scene.fog = null;
  var camera = new THREE.PerspectiveCamera(45, 1, 0.1, 400);
  var composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  var bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), hi ? 0.95 : 0.7, hi ? 0.55 : 0.35, 0.18);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  var world = new THREE.Group(); scene.add(world);        // 随舞台缓慢自转
  var R = rng(20261021);
  var uniformsCommon = { uPR: { value: PR }, uScale: { value: 30 } };

  /* 背景星空 */
  (function () {
    var n = hi ? 3500 : 1800, pos = new Float32Array(n * 3), col = new Float32Array(n * 3), sz = new Float32Array(n), dl = new Float32Array(n);
    for (var i = 0; i < n; i++) {
      var u = R() * 2 - 1, th = R() * 6.283, rr = 120 + R() * 80, s = Math.sqrt(1 - u * u);
      pos.set([rr * s * Math.cos(th), rr * u, rr * s * Math.sin(th)], i * 3);
      var w = 0.6 + R() * 0.4; col.set([w * 0.85, w * 0.9, w], i * 3); sz[i] = 0.9 + R() * R() * R() * 6; dl[i] = R() * 1.2;
    }
    var g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("aColor", new THREE.BufferAttribute(col, 3));
    g.setAttribute("aSize", new THREE.BufferAttribute(sz, 1)); g.setAttribute("aDelay", new THREE.BufferAttribute(dl, 1));
    var m = new THREE.ShaderMaterial({ vertexShader: PTS_VS, fragmentShader: PTS_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uT: { value: 0 }, uPR: uniformsCommon.uPR, uScale: { value: 160 }, uFade: { value: 1 }, uAlpha: { value: 0.75 } } });
    var p = new THREE.Points(g, m); p.frustumCulled = false; scene.add(p); bg = m;
  })();
  var bg;

  /* 旋涡星系盘(两条对数螺旋臂 + 核球),沿螺线由内向外点亮 */
  var disk, dust;
  (function () {
    var n = hi ? 52000 : 22000, pos = new Float32Array(n * 3), col = new Float32Array(n * 3), sz = new Float32Array(n), dl = new Float32Array(n);
    var cCore = new THREE.Color("#fff1d6"), cBlue = new THREE.Color("#6fc6ff"), cPur = new THREE.Color("#8f74ff"), cPink = new THREE.Color("#d58cff"), tmp = new THREE.Color();
    for (var i = 0; i < n; i++) {
      var x, y, z, r, k = R();
      if (k < 0.10) { r = Math.abs(gauss(R)) * 1.5; var a0 = R() * 6.283; x = Math.cos(a0) * r; z = Math.sin(a0) * r * 0.9; y = gauss(R) * 0.18 * Math.exp(-r / 2); }
      else {
        var arm = R() < 0.5 ? 0 : Math.PI; r = 0.8 + Math.pow(R(), 1.25) * 14.2;
        var th = arm + Math.log(r) * 2.3 + gauss(R) * (0.28 + 0.12 * r / 14);
        var sp = gauss(R) * 0.35 * (0.5 + r / 14);
        x = Math.cos(th) * r + Math.cos(th + 1.57) * sp; z = Math.sin(th) * r + Math.sin(th + 1.57) * sp; y = gauss(R) * 0.12 * (1.2 - r / 16);
      }
      pos.set([x, y, z], i * 3);
      var rr = Math.sqrt(x * x + z * z), f = clamp(rr / 14, 0, 1);
      if (rr < 1.8) tmp.copy(cCore).lerp(cBlue, rr / 1.8 * 0.4); else tmp.copy(cBlue).lerp(R() < 0.5 ? cPur : cPink, clamp(f * 1.2 + gauss(R) * 0.15, 0, 1));
      var b = 0.35 + R() * 0.65; if (rr < 2.2) b *= 0.45 + 0.25 * rr / 2.2;
      col.set([tmp.r * b, tmp.g * b, tmp.b * b], i * 3);
      sz[i] = (R() < 0.015 ? 5 + R() * 6 : 1.6 + R() * 2.8) * (rr < 1.6 ? 1.2 : 1);
      dl[i] = 4.8 + clamp(rr / 14.5, 0, 1) * 1.25 + R() * 0.12;
    }
    var g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("aColor", new THREE.BufferAttribute(col, 3));
    g.setAttribute("aSize", new THREE.BufferAttribute(sz, 1)); g.setAttribute("aDelay", new THREE.BufferAttribute(dl, 1));
    var m = new THREE.ShaderMaterial({ vertexShader: PTS_VS, fragmentShader: PTS_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uT: { value: 0 }, uPR: uniformsCommon.uPR, uScale: uniformsCommon.uScale, uFade: { value: 1 }, uAlpha: { value: 1.0 } } });
    var p = new THREE.Points(g, m); p.frustumCulled = false; world.add(p); disk = m;
    /* 星云尘带:少量大而淡的粒子 */
    var nd = hi ? 900 : 380, pd = new Float32Array(nd * 3), cd = new Float32Array(nd * 3), sd = new Float32Array(nd), dd = new Float32Array(nd);
    for (var j = 0; j < nd; j++) {
      var arm2 = R() < 0.5 ? 0 : Math.PI, r2 = 1.5 + R() * 13, th2 = arm2 + Math.log(r2) * 2.3 + gauss(R) * 0.35;
      pd.set([Math.cos(th2) * r2, gauss(R) * 0.3, Math.sin(th2) * r2], j * 3);
      tmp.copy(R() < 0.55 ? cPur : cBlue).multiplyScalar(0.5 + R() * 0.5); cd.set([tmp.r, tmp.g, tmp.b], j * 3);
      sd[j] = 60 + R() * 140; dd[j] = 5.0 + r2 / 14 * 1.2;
    }
    var g2 = new THREE.BufferGeometry();
    g2.setAttribute("position", new THREE.BufferAttribute(pd, 3)); g2.setAttribute("aColor", new THREE.BufferAttribute(cd, 3));
    g2.setAttribute("aSize", new THREE.BufferAttribute(sd, 1)); g2.setAttribute("aDelay", new THREE.BufferAttribute(dd, 1));
    var m2 = new THREE.ShaderMaterial({ vertexShader: PTS_VS, fragmentShader: PTS_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uT: { value: 0 }, uPR: uniformsCommon.uPR, uScale: uniformsCommon.uScale, uFade: { value: 1 }, uAlpha: { value: 0.1 } } });
    var p2 = new THREE.Points(g2, m2); p2.frustumCulled = false; world.add(p2); dust = m2;
  })();

  /* 核心光晕 + 暗色透镜 + 光环 + 标题 */
  var core = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex([[0, "rgba(255,250,240,1)"], [0.12, "rgba(220,235,255,.85)"], [0.4, "rgba(120,160,255,.25)"], [1, "rgba(80,90,255,0)"]]), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  core.scale.set(7, 7, 1); core.renderOrder = 7; scene.add(core);
  var lens = new THREE.Mesh(new THREE.CircleGeometry(3.45, 96), new THREE.MeshBasicMaterial({ color: 0x02040c, transparent: true, opacity: 0, depthWrite: false }));
  lens.rotation.x = -Math.PI / 2; lens.position.y = 0.05; lens.renderOrder = 8; scene.add(lens);
  var halo = new THREE.Mesh(new THREE.TorusGeometry(3.55, 0.035, 8, 160), new THREE.MeshBasicMaterial({ color: 0xd8ecff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
  halo.rotation.x = -Math.PI / 2; halo.position.y = 0.05; halo.renderOrder = 9; scene.add(halo);
  /* 标题用 HTML 叠层(清晰、不被辉光吃掉),位置跟随星系中心 */
  var titleEl = opts.titleEl || null, titleA = 0, titleV = new THREE.Vector3(0, 0.15, 0);
  var title0 = (function () { return null;
    var c = document.createElement("canvas"); c.width = 1024; c.height = 512; var x = c.getContext("2d");
    var F = '"PingFang SC","Hiragino Sans GB","Microsoft YaHei","Noto Sans SC",sans-serif';
    x.textAlign = "center"; x.fillStyle = "#eef5ff"; x.shadowColor = "rgba(150,200,255,.9)"; x.shadowBlur = 24;
    x.font = "300 230px " + F; x.fillText("星图", 512, 290);
    x.shadowBlur = 10; x.font = "400 52px " + F; x.fillStyle = "#d6e6ff";
    x.fillText("MATH ATLAS  ·  数学", 512, 395);
    var t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    var s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, opacity: 0, depthWrite: false, depthTest: false }));
    s.scale.set(5.6, 2.8, 1); s.position.set(0, 0.55, 0); s.renderOrder = 10; scene.add(s); return s;
  })();

  /* 金色轨道环 */
  var rings = RINGS.map(function (r, i) {
    var pts = []; for (var k = 0; k <= 256; k++) { var a = k / 256 * 6.2832; pts.push(new THREE.Vector3(Math.cos(a) * r, 0.02, Math.sin(a) * r)); }
    var m = new THREE.LineBasicMaterial({ color: new THREE.Color(i === 1 ? "#f2c879" : "#c9a660"), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
    var l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), m); world.add(l); return m;
  });

  /* ---------- 9 星座:真实 197 颗知识星 ---------- */
  var NC = DATA.c.length, stars = [], byId = {};
  DATA.s.forEach(function (s, k) { var n = { id: s[0], name: s[1], ci: s[2], d: s[3], pre: s[4], k: k }; stars.push(n); byId[n.id] = n; });
  var consCenter = [];
  for (var ci = 0; ci < NC; ci++) {
    var ang = -Math.PI / 2 + ci / NC * 6.2832 + 0.35;
    var rad = ci % 2 === 0 ? 11.2 : 8.1;
    consCenter.push(new THREE.Vector3(Math.cos(ang) * rad, 0.35, Math.sin(ang) * rad));
  }
  /* 星座内树形(每颗星取第一个同星座先修为父 = 先修边的生成树),力导布局得到"星座图形" */
  var consEdges = [];
  for (var c2 = 0; c2 < NC; c2++) {
    var mem = stars.filter(function (n) { return n.ci === c2; });
    var R2 = rng(7 + c2 * 101);
    mem.forEach(function (n, i) { var a = R2() * 6.283, r = 0.3 + n.d * 0.32 + R2() * 0.4; n.lx = Math.cos(a) * r; n.ly = Math.sin(a) * r; n.vx = 0; n.vy = 0; });
    var edges = [];
    mem.forEach(function (n) {
      var p = null; for (var q = 0; q < n.pre.length; q++) { var pp = byId[n.pre[q]]; if (pp && pp.ci === c2) { p = pp; break; } }
      if (p) edges.push([p, n]);
    });
    /* 森林连成一棵:孤立根挂到最近的根上,保证星座连通 */
    var roots = mem.filter(function (n) { return !edges.some(function (e) { return e[1] === n; }); });
    for (var ri = 1; ri < roots.length; ri++) edges.push([roots[ri - 1], roots[ri], 1]);
    for (var it = 0; it < 220; it++) {
      var cool = 1 - it / 220;
      for (var a1 = 0; a1 < mem.length; a1++) for (var b1 = a1 + 1; b1 < mem.length; b1++) {
        var A = mem[a1], B = mem[b1], dx = A.lx - B.lx, dy = A.ly - B.ly, d2 = dx * dx + dy * dy + 0.01, f = 0.045 / d2;
        A.vx += dx * f; A.vy += dy * f; B.vx -= dx * f; B.vy -= dy * f;
      }
      edges.forEach(function (e) { var dx = e[1].lx - e[0].lx, dy = e[1].ly - e[0].ly, d = Math.sqrt(dx * dx + dy * dy) + 1e-4, f = (d - 0.55) * 0.08; e[0].vx += dx / d * f; e[0].vy += dy / d * f; e[1].vx -= dx / d * f; e[1].vy -= dy / d * f; });
      mem.forEach(function (n) { n.vx -= n.lx * 0.012; n.vy -= n.ly * 0.012; n.lx += n.vx * cool; n.ly += n.vy * cool; n.vx *= 0.6; n.vy *= 0.6; });
    }
    var maxr = 0.01; mem.forEach(function (n) { maxr = Math.max(maxr, Math.hypot(n.lx, n.ly)); });
    var C = consCenter[c2], sc = 2.25 / maxr;
    /* 局部坐标:x 沿切向,y 沿径向,略向镜头抬起 */
    var radial = new THREE.Vector3(C.x, 0, C.z).normalize(), tang = new THREE.Vector3(-radial.z, 0, radial.x);
    mem.forEach(function (n) {
      var lx = n.lx * sc, ly = n.ly * sc * 0.8;
      n.pos = new THREE.Vector3().copy(C).addScaledVector(tang, lx).addScaledVector(radial, ly);
      n.pos.y = 0.35 + (R2() - 0.5) * 0.25;
    });
    edges.forEach(function (e) { consEdges.push(e); });
  }
  /* 开场点亮顺序:沿螺线(按极角+半径) */
  stars.forEach(function (n) {
    var a = Math.atan2(n.pos.z, n.pos.x); a = (a + 6.2832 * 2 + Math.log(Math.hypot(n.pos.x, n.pos.z)) * 0.0) % 6.2832;
    n.delay = 4.8 + (a / 6.2832) * 1.1 + Math.hypot(n.pos.x, n.pos.z) / 14 * 0.25;
  });
  var starGeo = new THREE.BufferGeometry(), N = stars.length;
  var sPos = new Float32Array(N * 3), sCol = new Float32Array(N * 3), sSize = new Float32Array(N), sDelay = new Float32Array(N), sLit = new Float32Array(N), sHi = new Float32Array(N), sPh = new Float32Array(N);
  stars.forEach(function (n, i) {
    sPos.set([n.pos.x, n.pos.y, n.pos.z], i * 3);
    var col = new THREE.Color(COLORS[n.ci]); sCol.set([col.r, col.g, col.b], i * 3);
    sSize[i] = 17 - n.d * 1.6; sDelay[i] = n.delay; sLit[i] = LIT[n.id] ? 1 : 0; sPh[i] = (i * 2.399) % 6.283;
  });
  starGeo.setAttribute("position", new THREE.BufferAttribute(sPos, 3)); starGeo.setAttribute("aColor", new THREE.BufferAttribute(sCol, 3));
  starGeo.setAttribute("aSize", new THREE.BufferAttribute(sSize, 1)); starGeo.setAttribute("aDelay", new THREE.BufferAttribute(sDelay, 1));
  starGeo.setAttribute("aLit", new THREE.BufferAttribute(sLit, 1)); starGeo.setAttribute("aHi", new THREE.BufferAttribute(sHi, 1)); starGeo.setAttribute("aPh", new THREE.BufferAttribute(sPh, 1));
  var starMat = new THREE.ShaderMaterial({ vertexShader: STAR_VS, fragmentShader: STAR_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uT: { value: 0 }, uTime: { value: 0 }, uPR: uniformsCommon.uPR, uScale: uniformsCommon.uScale, uOnlyLit: { value: 0 } } });
  var starPts = new THREE.Points(starGeo, starMat); starPts.frustumCulled = false; starPts.renderOrder = 5; world.add(starPts);

  /* 星座连线(按星座色,随开场逐条亮起) */
  var cl = (function () {
    var pos = [], col = [], ord = [];
    consEdges.forEach(function (e) {
      var c = new THREE.Color(COLORS[e[0].ci]), o = Math.max(e[0].delay, e[1].delay);
      [e[0], e[1]].forEach(function (n) { pos.push(n.pos.x, n.pos.y, n.pos.z); col.push(c.r, c.g, c.b); ord.push(o); });
    });
    var g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("aColor", new THREE.Float32BufferAttribute(col, 3)); g.setAttribute("aOrder", new THREE.Float32BufferAttribute(ord, 1));
    var m = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uT: { value: 0 }, uAlpha: { value: 0.75 } },
      vertexShader: "attribute vec3 aColor; attribute float aOrder; uniform float uT; varying vec3 vC; varying float vA; void main(){ vC = aColor; vA = clamp((uT - aOrder - 0.15) / 0.4, 0.0, 1.0); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
      fragmentShader: "uniform float uAlpha; varying vec3 vC; varying float vA; void main(){ float a = vA * uAlpha; gl_FragColor = vec4(vC * a, a); }" });
    var l = new THREE.LineSegments(g, m); l.frustumCulled = false; world.add(l); return m;
  })();

  /* 规划路径(金色) */
  var pathGeo = new THREE.BufferGeometry(); pathGeo.setAttribute("position", new THREE.Float32BufferAttribute([], 3));
  var pathMat = new THREE.LineBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false });
  var pathLines = new THREE.LineSegments(pathGeo, pathMat); pathLines.frustumCulled = false; world.add(pathLines);

  /* 星桥端点:星座外缘金色菱形 */
  var bridgeMarks = [];
  var diamond = (function () { var c = document.createElement("canvas"); c.width = c.height = 64; var x = c.getContext("2d");
    var g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, "rgba(255,230,170,.55)"); g.addColorStop(1, "rgba(255,200,90,0)"); x.fillStyle = g; x.fillRect(0, 0, 64, 64);
    x.translate(32, 32); x.rotate(Math.PI / 4); x.strokeStyle = "#ffe2a0"; x.lineWidth = 3; x.strokeRect(-9, -9, 18, 18); x.fillStyle = "rgba(255,226,160,.5)"; x.fillRect(-5, -5, 10, 10);
    var t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  (opts.bridges || []).forEach(function (b, i) {
    var count = new Array(NC).fill(0); (b.stars || []).forEach(function (id) { if (byId[id]) count[byId[id].ci]++; });
    var best = count.indexOf(Math.max.apply(null, count)); if (best < 0) best = 0;
    var C = consCenter[best], radial = new THREE.Vector3(C.x, 0, C.z).normalize();
    var same = bridgeMarks.filter(function (m) { return m.ci === best; }).length;
    var tang = new THREE.Vector3(-radial.z, 0, radial.x);
    var p = new THREE.Vector3().copy(C).addScaledVector(radial, 2.9).addScaledVector(tang, (same - 0.5) * 1.1); p.y = 0.5;
    var s = new THREE.Sprite(new THREE.SpriteMaterial({ map: diamond, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
    s.scale.set(0.55, 0.55, 1); s.position.copy(p); world.add(s);
    bridgeMarks.push({ sprite: s, ci: best, task: b.task, pos: p });
  });

  /* ---------- 开场专用:光点 / 数轴 / 网格 / 斐波那契方块与螺线 ---------- */
  var seed = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex([[0, "rgba(255,255,255,1)"], [0.15, "rgba(160,215,255,.9)"], [0.5, "rgba(90,150,255,.18)"], [1, "rgba(60,120,255,0)"]]), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 }));
  seed.scale.set(1.4, 1.4, 1); seed.position.y = 0.06; scene.add(seed);
  function revealMat(color, alpha) {
    return new THREE.ShaderMaterial({ vertexShader: REVEAL_VS, fragmentShader: REVEAL_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uP: { value: 0 }, uAlpha: { value: alpha }, uColor: { value: new THREE.Color(color) } } });
  }
  var axis = (function () {
    var pos = [], ord = [], L = 9;
    pos.push(-L, 0.03, 0, 0, 0.03, 0); ord.push(1, 0); pos.push(0, 0.03, 0, L, 0.03, 0); ord.push(0, 1);
    for (var k = -L + 1; k < L; k++) { var h = k % 5 === 0 ? 0.32 : 0.16; var o = Math.abs(k) / L; pos.push(k, 0.03, -h, k, 0.03, h); ord.push(o, o); }
    var g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("aOrder", new THREE.Float32BufferAttribute(ord, 1));
    var m = revealMat("#bfe6ff", 0.9); var l = new THREE.LineSegments(g, m); l.frustumCulled = false; scene.add(l); return m;
  })();
  var grid = (function () {
    var pos = [], L = 11;
    for (var k = -L; k <= L; k++) { pos.push(k, 0.01, -L, k, 0.01, L, -L, 0.01, k, L, 0.01, k); }
    var g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("aOrder", new THREE.Float32BufferAttribute(new Array(pos.length / 3).fill(0), 1));
    var m = new THREE.ShaderMaterial({ vertexShader: REVEAL_VS, fragmentShader: GRID_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uGrow: { value: 0 }, uAlpha: { value: 0.28 }, uColor: { value: new THREE.Color("#7fb8ff") } } });
    var l = new THREE.LineSegments(g, m); l.frustumCulled = false; scene.add(l); return m;
  })();
  var fib = (function () {
    /* 1,1,2,3,5,8,13 方块按逆时针拼接,每块内画四分之一圆弧,连成黄金螺线 */
    var F = [1, 1, 2, 3, 5, 8, 13], u = 0.46, sq = [], minX = 0, minY = 0, maxX = 1, maxY = 1;
    sq.push({ x: 0, y: 0, s: 1 });
    for (var i = 1; i < F.length; i++) {
      var s = F[i], d = i % 4, b;
      if (d === 1) b = { x: maxX, y: minY, s: s }; else if (d === 2) b = { x: maxX - s, y: maxY, s: s }; else if (d === 3) b = { x: minX - s, y: maxY - s, s: s }; else b = { x: minX, y: minY - s, s: s };
      sq.push(b); minX = Math.min(minX, b.x); minY = Math.min(minY, b.y); maxX = Math.max(maxX, b.x + s); maxY = Math.max(maxY, b.y + s);
    }
    var cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
    var pos = [], ord = [], spos = [], sord = [];
    sq.forEach(function (b, i) {
      var o = i / sq.length, x0 = (b.x - cx) * u, y0 = (b.y - cy) * u, x1 = x0 + b.s * u, y1 = y0 + b.s * u;
      [[x0, y0, x1, y0], [x1, y0, x1, y1], [x1, y1, x0, y1], [x0, y1, x0, y0]].forEach(function (e) { pos.push(e[0], 0.02, e[1], e[2], 0.02, e[3]); ord.push(o, o); });
    });
    /* 螺线:每块一段四分之一圆弧,圆心在方块的一个角(由拼接方向决定) */
    var corners = [[1, 1], [0, 1], [0, 0], [1, 0]], startA = [Math.PI, -Math.PI / 2, 0, Math.PI / 2];
    var tot = sq.length * 24, kk = 0;
    sq.forEach(function (b, i) {
      var d = i % 4, cc = corners[d], ox = (b.x + cc[0] * b.s - cx) * u, oy = (b.y + cc[1] * b.s - cy) * u, r = b.s * u, a0 = startA[d];
      for (var t = 0; t <= 24; t++) { var a = a0 + t / 24 * Math.PI / 2; spos.push(ox + Math.cos(a) * r, 0.03, oy + Math.sin(a) * r); sord.push((kk + t) / tot); }
      kk += 24;
    });
    var g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("aOrder", new THREE.Float32BufferAttribute(ord, 1));
    var m = revealMat("#8fc8ff", 0.55); var l = new THREE.LineSegments(g, m); l.frustumCulled = false; scene.add(l);
    var g2 = new THREE.BufferGeometry(); g2.setAttribute("position", new THREE.Float32BufferAttribute(spos, 3)); g2.setAttribute("aOrder", new THREE.Float32BufferAttribute(sord, 1));
    var m2 = revealMat("#ffd98a", 1.0); var l2 = new THREE.Line(g2, m2); l2.frustumCulled = false; scene.add(l2);
    return { sq: m, sp: m2 };
  })();

  /* ---------- 相机 ---------- */
  var view = { az: STAGE_VIEW.az, el: STAGE_VIEW.el, dist: STAGE_VIEW.dist };
  var target = { az: view.az, el: view.el, dist: view.dist };
  var lookY = 0;
  function placeCam(v) {
    var d = v.dist, x = Math.sin(v.az) * Math.cos(v.el) * d, y = Math.sin(v.el) * d, z = Math.cos(v.az) * Math.cos(v.el) * d;
    camera.position.set(x, y + lookY, z); camera.lookAt(0, lookY, 0);
  }
  function fitDist() { var a = camera.aspect; return a < 1 ? STAGE_VIEW.dist * clamp(0.75 / a, 1, 1.45) : STAGE_VIEW.dist * clamp(1.6 / a, 0.92, 1.25); }

  /* ---------- 开场时间轴 ---------- */
  var introT = opts.intro ? 0 : INTRO_LEN, introOn = !!opts.intro, introDoneFired = false, hudFired = false;
  var sound = opts.sound || null;
  function applyTimeline(t) {
    disk.uniforms.uT.value = t; dust.uniforms.uT.value = t; bg.uniforms.uT.value = t + 2;
    starMat.uniforms.uT.value = t; cl.uniforms.uT.value = t;
    seed.material.opacity = smooth(0.1, 0.8, t) * (1 - smooth(1.4, 2.6, t)) * (0.8 + 0.2 * Math.sin(t * 7));
    var s = 1.2 + 0.25 * Math.sin(t * 5); seed.scale.set(s, s, 1);
    axis.uniforms.uP.value = smooth(1.5, 2.6, t); axis.uniforms.uAlpha.value = 0.9 * (1 - smooth(4.9, 5.8, t));
    grid.uniforms.uGrow.value = smooth(2.0, 3.2, t) * 13; grid.uniforms.uAlpha.value = 0.28 * (1 - smooth(5.0, 6.0, t));
    fib.sq.uniforms.uP.value = smooth(3.0, 4.3, t); fib.sq.uniforms.uAlpha.value = 0.55 * (1 - smooth(5.0, 6.0, t));
    fib.sp.uniforms.uP.value = smooth(3.15, 4.75, t); fib.sp.uniforms.uAlpha.value = 1.0 * (1 - smooth(5.4, 6.4, t));
    var ringA = smooth(5.2, 6.4, t); rings.forEach(function (m, i) { m.opacity = ringA * (i === 1 ? 0.55 : 0.38); });
    core.material.opacity = 0.55 * smooth(4.6, 5.6, t) * (1 - 0.6 * smooth(5.8, 6.6, t)); var cs = 2.5 + 2.0 * smooth(4.6, 6.0, t); core.scale.set(cs, cs, 1);
    lens.material.opacity = 0.82 * smooth(5.8, 6.6, t); halo.material.opacity = 0.9 * smooth(5.8, 6.6, t);
    titleA = smooth(6.0, 6.8, t);
    bridgeMarks.forEach(function (b) { b.sprite.material.opacity = 0.5 * smooth(6.3, 7.0, t); });
    /* 相机:先俯视看数轴与方块,星座成形时推到 A3 视角并拉远 */
    var top = { az: 0, el: 1.32, dist: t < 1.5 ? 7.5 + t * 1.2 : 9.3 + smooth(1.5, 4.6, t) * 5.2 }, fin = { az: STAGE_VIEW.az, el: STAGE_VIEW.el, dist: fitDist() };
    var k = ease(smooth(4.7, 7.0, t));
    view.az = top.az + (fin.az - top.az) * k; view.el = top.el + (fin.el - top.el) * k; view.dist = top.dist + (fin.dist - top.dist) * k;
    target.az = view.az; target.el = view.el; target.dist = view.dist;
  }

  /* ---------- 交互:拖动旋转 / 缩放 / 回正 ---------- */
  var dragging = false, moved = 0, lx = 0, ly = 0, pinch = 0, autoSpin = !reduce, lastInput = 0;
  var el = renderer.domElement;
  el.style.touchAction = "none";
  var pointers = {};
  el.addEventListener("pointerdown", function (e) {
    if (introOn) return; pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
    dragging = true; moved = 0; lx = e.clientX; ly = e.clientY; el.setPointerCapture(e.pointerId); lastInput = performance.now();
  });
  el.addEventListener("pointermove", function (e) {
    if (introOn) return;
    if (pointers[e.pointerId]) pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
    var ids = Object.keys(pointers);
    if (ids.length === 2) {
      var a = pointers[ids[0]], b = pointers[ids[1]], d = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinch) target.dist = clamp(target.dist * pinch / d, 9, 60); pinch = d; moved += 10; return;
    }
    if (dragging) {
      var dx = e.clientX - lx, dy = e.clientY - ly; lx = e.clientX; ly = e.clientY; moved += Math.abs(dx) + Math.abs(dy);
      target.az -= dx * 0.005; target.el = clamp(target.el + dy * 0.004, 0.12, 1.4); lastInput = performance.now();
    } else hover(e.clientX, e.clientY);
  });
  function endPtr(e) {
    delete pointers[e.pointerId]; if (Object.keys(pointers).length < 2) pinch = 0;
    if (!dragging) return; dragging = false;
    if (moved < 6 && !introOn) { var hit = pick(e.clientX, e.clientY); if (opts.onPick) opts.onPick(hit, e.clientX, e.clientY); }
  }
  el.addEventListener("pointerup", endPtr); el.addEventListener("pointercancel", endPtr);
  el.addEventListener("pointerleave", function () { if (!dragging && opts.onHover) opts.onHover(null); });
  el.addEventListener("wheel", function (e) { if (introOn) return; e.preventDefault(); target.dist = clamp(target.dist * Math.exp(e.deltaY * 0.0012), 9, 60); lastInput = performance.now(); }, { passive: false });
  el.addEventListener("dblclick", function () { resetView(); });

  var v3 = new THREE.Vector3();
  function screenOf(p) { v3.copy(p).applyMatrix4(world.matrixWorld).project(camera); var r = el.getBoundingClientRect(); return { x: r.left + (v3.x + 1) / 2 * r.width, y: r.top + (1 - v3.y) / 2 * r.height, z: v3.z }; }
  function pick(x, y) {
    var best = null, bd = mobile ? 26 : 18;
    for (var i = 0; i < N; i++) { var s = screenOf(stars[i].pos); if (s.z > 1) continue; var d = Math.hypot(s.x - x, s.y - y); if (d < bd) { bd = d; best = { type: "star", star: stars[i] }; } }
    bridgeMarks.forEach(function (b) { var s = screenOf(b.pos); var d = Math.hypot(s.x - x, s.y - y); if (d < bd) { bd = d; best = { type: "bridge", task: b.task }; } });
    return best;
  }
  var hoverHit = null;
  function hover(x, y) { var h = pick(x, y); el.style.cursor = h ? "pointer" : "grab"; if (opts.onHover) opts.onHover(h, x, y); hoverHit = h; }
  function resetView() { target.az = STAGE_VIEW.az; target.el = STAGE_VIEW.el; target.dist = fitDist(); world.rotation.y = wrapRot(world.rotation.y); spinBack = true; }
  var spinBack = false;
  function wrapRot(r) { r = r % 6.2832; if (r > 3.1416) r -= 6.2832; if (r < -3.1416) r += 6.2832; return r; }

  /* ---------- 高亮 / 路径 ---------- */
  function setHighlight(ids, edges) {
    var set = {}; (ids || []).forEach(function (id) { set[id] = 1; });
    for (var i = 0; i < N; i++) sHi[i] = set[stars[i].id] ? 1 : 0;
    starGeo.attributes.aHi.needsUpdate = true;
    var pos = []; (edges || []).forEach(function (e) { var a = byId[e[0]], b = byId[e[1]]; if (a && b) pos.push(a.pos.x, a.pos.y + 0.01, a.pos.z, b.pos.x, b.pos.y + 0.01, b.pos.z); });
    pathGeo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); pathGeo.computeBoundingSphere();
  }
  function setLit(map) { for (var i = 0; i < N; i++) sLit[i] = map[stars[i].id] ? 1 : 0; starGeo.attributes.aLit.needsUpdate = true; }
  function setOnlyLit(v) { starMat.uniforms.uOnlyLit.value = v ? 1 : 0; cl.uniforms.uAlpha.value = v ? 0.2 : 0.75; }

  /* ---------- 渲染循环 / 性能监测 / 隐藏暂停 ---------- */
  var running = true, raf = 0, last = performance.now(), fpsAcc = 0, fpsN = 0, slowStrikes = 0, clock0 = performance.now();
  function resize() {
    var w = host.clientWidth || innerWidth, h = host.clientHeight || innerHeight;
    renderer.setSize(w, h, false); composer.setSize(w, h); camera.aspect = w / h;
    var off = (opts.offsetX && w > 900) ? opts.offsetX : 0;
    if (off) camera.setViewOffset(w, h, -off, 0, w, h); else camera.clearViewOffset();
    camera.fov = w < h ? 58 : 45; camera.updateProjectionMatrix();
    bloom.resolution.set(w / 2, h / 2);
    if (!introOn && !dragging) target.dist = clamp(target.dist, 9, 60);
  }
  resize(); addEventListener("resize", resize);
  function frame(now) {
    raf = 0; if (!running) return;
    var dt = Math.min(0.1, (now - last) / 1000); last = now;
    if (introOn) {
      introT += dt; applyTimeline(introT);
      if (sound) sound(introT);
      if (introT >= 6.2 && !hudFired) { hudFired = true; if (opts.onHud) opts.onHud(); }
      if (introT >= INTRO_LEN) finishIntro();
    } else {
      view.az += (target.az - view.az) * 0.08; view.el += (target.el - view.el) * 0.08; view.dist += (target.dist - view.dist) * 0.08;
      if (spinBack) { world.rotation.y += (0 - world.rotation.y) * 0.08; if (Math.abs(world.rotation.y) < 0.002) { world.rotation.y = 0; spinBack = false; } }
      else if (autoSpin && now - lastInput > 4000) world.rotation.y += dt * 0.012;
    }
    starMat.uniforms.uTime.value = (now - clock0) / 1000;
    placeCam(view);
    composer.render();
    if (titleEl) {
      var tp = screenOf(titleV), sc = clamp(29 / view.dist, 0.45, 2.2) * (camera.aspect < 1 ? 0.8 : 1) * clamp(Math.min(innerHeight / 760, innerWidth / 900), 0.5, 1);
      titleEl.style.opacity = titleA.toFixed(3);
      titleEl.style.transform = "translate(" + tp.x.toFixed(1) + "px," + tp.y.toFixed(1) + "px) translate(-50%,-50%) scale(" + sc.toFixed(3) + ")";
    }
    /* 帧率:高档持续偏慢自动降到中档 */
    fpsAcc += dt; fpsN++;
    if (fpsAcc > 3) { var fps = fpsN / fpsAcc; fpsAcc = 0; fpsN = 0; if (fps < 26 && opts.onSlow) { slowStrikes++; if (slowStrikes >= 2) { slowStrikes = 0; opts.onSlow(fps); } } else slowStrikes = 0; }
    if (!reduce || introOn || dragging || Math.abs(target.dist - view.dist) > 0.01 || Math.abs(target.az - view.az) > 0.001 || Math.abs(target.el - view.el) > 0.001 || spinBack) schedule();
    else idleTimer = setTimeout(schedule, 250);
  }
  var idleTimer = 0;
  function schedule() { if (!raf && running) raf = requestAnimationFrame(frame); }
  function pause() { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; clearTimeout(idleTimer); }
  function resume() { if (running) return; running = true; last = performance.now(); schedule(); }
  document.addEventListener("visibilitychange", function () { if (document.hidden) pause(); else resume(); });
  el.addEventListener("webglcontextlost", function (e) { e.preventDefault(); pause(); if (opts.onLost) opts.onLost(); });

  function finishIntro() {
    introOn = false; introT = INTRO_LEN; applyTimeline(INTRO_LEN);
    if (!hudFired) { hudFired = true; if (opts.onHud) opts.onHud(); }
    if (!introDoneFired) { introDoneFired = true; if (opts.onIntroDone) opts.onIntroDone(); }
  }
  function replay() { introT = 0; introOn = true; hudFired = false; introDoneFired = false; world.rotation.y = 0; schedule(); }
  applyTimeline(introT);
  if (!introOn) { introDoneFired = true; }
  schedule();

  return {
    THREE: THREE, stars: stars, byId: byId, camera: camera,
    skipIntro: function () { if (introOn) finishIntro(); },
    replay: replay, isIntro: function () { return introOn; },
    resetView: resetView, setHighlight: setHighlight, setLit: setLit, setOnlyLit: setOnlyLit,
    screenOf: screenOf, consCenter: consCenter,
    setTier: function (t) { var p = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2); if (t !== "hi") p = Math.min(p, 1.25); renderer.setPixelRatio(p); uniformsCommon.uPR.value = p; bloom.strength = t === "hi" ? 0.95 : 0.7; resize(); },
    setReduce: function (v) { reduce = v; autoSpin = !v; schedule(); },
    wake: schedule,
    dispose: function () { pause(); renderer.dispose(); el.remove(); }
  };
}

/* ---------------- 开场原创合成音效(声音默认关;仅在用户已开声时调用) ---------------- */
export function introSound() {
  var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
  var ac = null, fired = {};
  function ensure() { if (!ac) { ac = new AC(); } if (ac.state === "suspended") ac.resume(); return ac; }
  function tone(f, t0, dur, type, gain) {
    var o = ac.createOscillator(), g = ac.createGain(); o.type = type || "sine"; o.frequency.value = f;
    g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(gain || 0.08, t0 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(ac.destination); o.start(t0); o.stop(t0 + dur + 0.05);
  }
  function noise(t0, dur) {
    var b = ac.createBuffer(1, ac.sampleRate * dur, ac.sampleRate), d = b.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1);
    var s = ac.createBufferSource(); s.buffer = b; var f = ac.createBiquadFilter(); f.type = "bandpass"; f.frequency.setValueAtTime(300, t0); f.frequency.exponentialRampToValueAtTime(3000, t0 + dur); f.Q.value = 0.8;
    var g = ac.createGain(); g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(0.06, t0 + dur * 0.6); g.gain.linearRampToValueAtTime(0, t0 + dur);
    s.connect(f); f.connect(g); g.connect(ac.destination); s.start(t0);
  }
  return function (t) {
    try {
      if (t < 0.1 && !fired.hum) { fired = { hum: 1 }; ensure(); tone(55, ac.currentTime, 1.6, "sine", 0.12); tone(110, ac.currentTime, 1.4, "triangle", 0.03); }
      if (!ac) return;
      /* 数轴刻度:每格一声上行(大调音阶) */
      var sc = [0, 2, 4, 5, 7, 9, 11, 12];
      for (var i = 0; i < 8; i++) { var ti = 1.55 + i * 0.13; if (t >= ti && !fired["k" + i]) { fired["k" + i] = 1; tone(392 * Math.pow(2, sc[i] / 12), ac.currentTime, 0.35, "sine", 0.05); } }
      /* 斐波那契:相邻两数之比作音程(1,2,3/2,5/3,8/5,13/8 → 趋近黄金比) */
      var F = [1, 1, 2, 3, 5, 8, 13];
      for (var j = 1; j < F.length; j++) { var tj = 3.0 + j * 0.24; if (t >= tj && !fired["f" + j]) { fired["f" + j] = 1; tone(220 * F[j] / F[j - 1], ac.currentTime, 0.6, "triangle", 0.045); tone(220, ac.currentTime, 0.6, "sine", 0.02); } }
      /* 星座成形:九声琶音 */
      for (var c = 0; c < 9; c++) { var tc = 4.85 + c * 0.15; if (t >= tc && !fired["c" + c]) { fired["c" + c] = 1; tone(523.25 * Math.pow(2, [0, 4, 7, 12, 16, 19, 24, 19, 28][c] / 12), ac.currentTime, 0.9, "sine", 0.035); } }
      if (t >= 6.2 && !fired.w) { fired.w = 1; noise(ac.currentTime, 0.8); }
    } catch (e) {}
  };
}
