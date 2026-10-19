// 生命源码 · 尺度引擎「一镜到底」(WebGL / Three.js)
// 从指尖皮肤一路放大到碱基对。每一层自动切换"观察仪器",并如实标注哪些是照片式观察、哪些是模型重建。
// 科学约定:光学显微镜分辨极限约 200 nm,看不到双螺旋;间期细胞核内是松散染色质,不画 X 形染色体;
// 核小体 = DNA 绕组蛋白八聚体约 1.65 圈(约 147 bp),直径约 11 nm;B-DNA 右手螺旋;氢键 A–T 2 根、G–C 3 根。
import * as THREE from './vendor/three.module.min.js';
import { helixPoint, BDNA } from './ls-helix.js';
import { BASE_COLOR, reducedMotion, sound } from './ls.js';

export const LEVELS = [
  { key: 'skin',       tool: '肉眼 / 放大镜',           obj: '指尖皮肤 · 指纹',               bar: '1 mm',     tag: '' },
  { key: 'cells',      tool: '光学显微镜 · 染色切片',   obj: '皮肤表皮细胞',                   bar: '20 μm',    tag: '染色后观察' },
  { key: 'nucleus',    tool: '荧光显微镜',             obj: '细胞核里的染色质',               bar: '2 μm',     tag: '荧光标记着色' },
  { key: 'nucleosome', tool: 'X 射线晶体学 / 冷冻电镜结构', obj: '核小体:DNA 绕组蛋白八聚体约 1.65 圈', bar: '10 nm',    tag: '模型重建 · 非照片' },
  { key: 'helix',      tool: '分子模型',               obj: 'DNA 双螺旋 · 右手 · 直径约 2 nm', bar: '1 nm',     tag: '模型重建 · 伪彩' },
  { key: 'pair',       tool: '原子模型',               obj: '碱基对与氢键(A–T 2 根)',        bar: '0.2 nm',   tag: '模型示意 · 原子通用配色' },
];
export const FACTS = {
  2: '这个约 6 μm 的细胞核里,DNA 拉直约有 2 米长',
  3: '每个核小体缠着约 147 个碱基对',
  4: '每转一圈约 10.5 个碱基对',
  5: 'A 对 T 两根氢键,G 对 C 三根',
};

const K = 9; // 每层放大倍数(视觉)
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

/* ---------- 程序生成纹理 ---------- */
function canvasTex(size, draw, feather = [.40, .5]) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d'); draw(g, size);
  if (feather) { // 圆形视野:像透过镜头观察
    const m = g.createRadialGradient(size / 2, size / 2, size * feather[0], size / 2, size / 2, size * feather[1]);
    m.addColorStop(0, 'rgba(0,0,0,1)'); m.addColorStop(1, 'rgba(0,0,0,0)');
    g.globalCompositeOperation = 'destination-in'; g.fillStyle = m; g.fillRect(0, 0, size, size); g.globalCompositeOperation = 'source-over';
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
function rng(seed) { return () => (seed = (seed * 16807) % 2147483647) / 2147483647; }

function texSkin() {
  return canvasTex(1024, (g, S) => {
    g.fillStyle = '#c98f74'; g.fillRect(0, 0, S, S);
    const r = rng(7); g.lineCap = 'round';
    for (let k = 0; k < 70; k++) { // 涡纹型指纹:扭曲的同心环
      g.beginPath();
      for (let a = 0; a <= Math.PI * 2 + .05; a += .03) {
        const rr = 6 + k * 9 + Math.sin(a * 3 + k * .21) * 4 + Math.sin(a * 7) * 1.5;
        const x = S / 2 + Math.cos(a) * rr * 1.25, y = S / 2 + Math.sin(a) * rr;
        a ? g.lineTo(x, y) : g.moveTo(x, y);
      }
      g.strokeStyle = `rgba(110,60,45,${.55 + r() * .2})`; g.lineWidth = 4; g.stroke();
    }
    const grd = g.createRadialGradient(S / 2, S / 2, S * .1, S / 2, S / 2, S * .7);
    grd.addColorStop(0, 'rgba(255,220,200,.15)'); grd.addColorStop(1, 'rgba(20,10,10,.65)');
    g.fillStyle = grd; g.fillRect(0, 0, S, S);
  });
}
function texCells() {
  return canvasTex(512, (g, S) => {
    const r = rng(11), seeds = [[S / 2, S / 2]];
    for (let i = 0; i < 90; i++) seeds.push([r() * S, r() * S]);
    const img = g.createImageData(S, S), d = img.data;
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      let d1 = 1e9, d2 = 1e9, k1 = 0;
      for (let k = 0; k < seeds.length; k++) {
        const dx = x - seeds[k][0], dy = (y - seeds[k][1]) * 1.15, dd = dx * dx + dy * dy;
        if (dd < d1) { d2 = d1; d1 = dd; k1 = k; } else if (dd < d2) d2 = dd;
      }
      const edge = Math.sqrt(d2) - Math.sqrt(d1), nuc = Math.sqrt(d1) < (k1 === 0 ? 13 : 10);
      let R = 236, G = 196, B = 214;                                   // 胞质:伊红粉
      if (nuc) { R = 120; G = 70; B = 150; }                           // 细胞核:苏木精紫
      if (edge < 2.2) { R = 170; G = 110; B = 150; }                   // 细胞膜
      const n = (r() - .5) * 18, i = (y * S + x) * 4;
      d[i] = R + n; d[i + 1] = G + n; d[i + 2] = B + n; d[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    const v = g.createRadialGradient(S / 2, S / 2, S * .36, S / 2, S / 2, S * .5); // 目镜视野
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(6,10,18,1)');
    g.fillStyle = v; g.fillRect(0, 0, S, S);
  });
}
function texNucleus() {
  return canvasTex(1024, (g, S) => {
    g.fillStyle = '#02060a'; g.fillRect(0, 0, S, S);
    const c = S / 2, R = S * .42, r = rng(5);
    g.beginPath(); g.ellipse(c, c, R, R * .9, 0, 0, Math.PI * 2); g.fillStyle = 'rgba(30,90,60,.25)'; g.fill();
    g.globalCompositeOperation = 'lighter';
    const thread = (x, y, col, steps, w) => {
      g.beginPath(); g.moveTo(x, y); let a = r() * 6.28;
      for (let i = 0; i < steps; i++) {
        a += (r() - .5) * .9; x += Math.cos(a) * 7; y += Math.sin(a) * 7;
        const dx = x - c, dy = (y - c) / .9; if (dx * dx + dy * dy > R * R * .92) { a += Math.PI; }
        g.lineTo(x, y);
      }
      g.strokeStyle = col; g.lineWidth = w; g.shadowColor = col; g.shadowBlur = 10; g.stroke();
    };
    for (let i = 0; i < 46; i++) thread(c + (r() - .5) * R, c + (r() - .5) * R, i % 7 ? 'rgba(74,222,128,.35)' : 'rgba(232,121,249,.35)', 220, 2.2);
    thread(c - 60, c, 'rgba(180,255,210,.9)', 30, 4); // 穿过中心的那一段,下一层从这里放大
    g.globalCompositeOperation = 'source-over'; g.shadowBlur = 0;
    g.beginPath(); g.ellipse(c + R * .35, c - R * .3, R * .16, R * .12, .4, 0, Math.PI * 2); g.fillStyle = 'rgba(2,6,10,.55)'; g.fill(); // 核仁
  });
}
function plane(tex, size = 10) {
  return new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshBasicMaterial({ map: tex, transparent: true }));
}

/* ---------- 3D 层 ---------- */
function buildNucleosomes() {
  const g = new THREE.Group();
  const histMat = new THREE.MeshStandardMaterial({ color: 0x9fb5ad, roughness: .8, transparent: true });
  const dnaMat = new THREE.MeshStandardMaterial({ color: 0xd9f7ea, emissive: 0x0f3d2c, roughness: .5, transparent: true });
  const centers = [];
  for (let i = -2; i <= 2; i++) centers.push(new THREE.Vector3(i * 2.5, i === 0 ? 0 : (Math.abs(i) % 2 ? .9 : -.9), (Math.abs(i) % 2) * -.8));
  centers.forEach((c, idx) => {
    const core = new THREE.Group();
    for (let k = 0; k < 8; k++) { // 组蛋白八聚体:两层各四个
      const s = new THREE.Mesh(new THREE.SphereGeometry(.42, 16, 12), histMat);
      const a = (k % 4) * Math.PI / 2 + (k > 3 ? Math.PI / 4 : 0);
      s.position.set(Math.cos(a) * .42, (k > 3 ? .25 : -.25), Math.sin(a) * .42); core.add(s);
    }
    const pts = []; const turns = 1.65; // DNA 缠绕约 1.65 圈(左手超螺旋)
    for (let t = 0; t <= 1; t += 1 / 80) { const a = -t * turns * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(a) * 1.05, (t - .5) * .95, Math.sin(a) * 1.05)); }
    core.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 90, .11, 8), dnaMat));
    core.position.copy(c); core.rotation.set(.5 + idx * .3, idx * .7, .2);
    core.updateMatrixWorld(); g.add(core);
    core.userData.ends = [pts[0].clone().applyMatrix4(core.matrixWorld), pts[pts.length - 1].clone().applyMatrix4(core.matrixWorld)];
  });
  const cores = [...g.children];
  for (let i = 0; i < cores.length - 1; i++) { // 连接 DNA
    const a = cores[i].userData.ends[1], b = cores[i + 1].userData.ends[0];
    const m = a.clone().lerp(b, .5).add(new THREE.Vector3(0, .5, .3));
    g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([a, m, b]), 20, .11, 8), dnaMat));
  }
  return g;
}
function buildHelix(n = 30) {
  const g = new THREE.Group(), OFF = THREE.MathUtils.degToRad(BDNA.strandOffsetDeg);
  const bb = new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x065f46, emissiveIntensity: .9, roughness: .35, transparent: true });
  const s1 = [], s2 = [];
  for (let i = 0; i < n; i++) { s1.push(helixPoint(i, 0, n)); s2.push(helixPoint(i, OFF, n)); }
  for (const pts of [s1, s2]) g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), n * 8, .12, 8), bb));
  const seq = 'ATGGTGCACCTGACTCCTGAGGAGAAGTCT';
  const C = { A: 'T', T: 'A', G: 'C', C: 'G' };
  for (let i = 0; i < n; i++) {
    const a = s1[i], b = s2[i], mid = a.clone().lerp(b, .5);
    for (const [p, base] of [[a, seq[i]], [b, C[seq[i]]]]) {
      const d = new THREE.Vector3().subVectors(mid, p), len = d.length();
      const m = new THREE.Mesh(new THREE.CylinderGeometry(.08, .08, len, 8),
        new THREE.MeshStandardMaterial({ color: BASE_COLOR[base], emissive: BASE_COLOR[base], emissiveIntensity: .25, transparent: true }));
      m.position.copy(p).addScaledVector(d, .5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); g.add(m);
    }
  }
  g.rotation.z = .25; g.scale.setScalar(.62);
  return g;
}
function buildPair() { // A–T 碱基对球棍示意(省略部分氢原子):腺嘌呤 + 胸腺嘧啶,两根氢键 N6–H···O4、N1···H–N3
  const g = new THREE.Group(), V = (x, y) => new THREE.Vector3(x, y, 0);
  const col = { C: 0x9ca3af, N: 0x60a5fa, O: 0xf87171, H: 0xf1f5f9 };
  const mats = {}; for (const k in col) mats[k] = new THREE.MeshStandardMaterial({ color: col[k], roughness: .35, transparent: true });
  const bondMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: .5, transparent: true });
  const sugarMat = new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x065f46, roughness: .4, transparent: true });
  const hb = new THREE.MeshBasicMaterial({ color: 0xfde68a, transparent: true });
  const atom = (p, e) => { const m = new THREE.Mesh(new THREE.SphereGeometry(e === 'H' ? .14 : .24, 18, 14), mats[e]); m.position.copy(p); g.add(m); return p; };
  const bond = (a, b, mat = bondMat, r = .065) => { const d = new THREE.Vector3().subVectors(b, a), m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, d.length(), 8), mat); m.position.copy(a).addScaledVector(d, .5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); g.add(m); };
  const s = .75, dir = deg => V(Math.cos(deg * Math.PI / 180), Math.sin(deg * Math.PI / 180));
  const hex = c => [30, 90, 150, 210, 270, 330].map(a => c.clone().addScaledVector(dir(a), s));
  const ring = (pts, els) => { pts.forEach((p, i) => atom(p, els[i])); pts.forEach((p, i) => bond(p, pts[(i + 1) % pts.length])); };
  const dA = -1.95, dT = 1.95;
  // 腺嘌呤:六元环 C6(30°) C5(90°) C4(150°) N3(210°) C2(270°) N1(330°)
  const A = hex(V(dA, 0)); ring(A, ['C', 'C', 'C', 'N', 'C', 'N']);
  // 五元咪唑环,稠合在 C4–C5 边上:N7 C8 N9
  const mid = A[1].clone().lerp(A[2], .5), out = dir(120), apoth = s / (2 * Math.tan(Math.PI / 5)), pc = mid.clone().addScaledVector(out, apoth);
  const R5 = s / (2 * Math.sin(Math.PI / 5)), base = Math.atan2(A[1].y - pc.y, A[1].x - pc.x);
  const P = [0, 1, 2, 3, 4].map(k => pc.clone().add(V(Math.cos(base + k * 2 * Math.PI / 5) * R5, Math.sin(base + k * 2 * Math.PI / 5) * R5)));
  // P[0]=C5, P[1]=N7, P[2]=C8, P[3]=N9, P[4]=C4
  atom(P[1], 'N'); atom(P[2], 'C'); atom(P[3], 'N'); bond(P[0], P[1]); bond(P[1], P[2]); bond(P[2], P[3]); bond(P[3], P[4]);
  const N6 = atom(A[0].clone().addScaledVector(dir(30), s), 'N'); bond(A[0], N6);
  const H6 = atom(N6.clone().addScaledVector(dir(-10), .5), 'H'); bond(N6, H6);
  const sugA = P[3].clone().addScaledVector(dir(225), .9); bond(P[3], sugA, sugarMat, .12);
  // 胸腺嘧啶:C6(30°) C5(90°) C4(150°) N3(210°) C2(270°) N1(330°)
  const T = hex(V(dT, 0)); ring(T, ['C', 'C', 'C', 'N', 'C', 'N']);
  const O4 = atom(T[2].clone().addScaledVector(dir(150), s * .9), 'O'); bond(T[2], O4);
  const O2 = atom(T[4].clone().addScaledVector(dir(270), s * .9), 'O'); bond(T[4], O2);
  const Me = atom(T[1].clone().addScaledVector(dir(90), s), 'C'); bond(T[1], Me);
  const H3 = atom(T[3].clone().addScaledVector(dir(190), .5), 'H'); bond(T[3], H3);
  const sugT = T[5].clone().addScaledVector(dir(315), .9); bond(T[5], sugT, sugarMat, .12);
  // 氢键虚线
  const dashed = (a, b) => { for (let t = .15; t < .9; t += .17) { const d = new THREE.Mesh(new THREE.SphereGeometry(.055, 8, 8), hb); d.position.copy(a).lerp(b, t); g.add(d); } };
  dashed(H6, O4); dashed(A[5], H3);
  g.position.y = -.2; g.scale.setScalar(1.1);
  return g;
}

/* ---------- 引擎 ---------- */
export function createZoom(container, { onLevel = null } = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.domElement.className = 'ls-gl';
  container.append(renderer.domElement);
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(45, 1, .01, 500);
  camera.position.set(0, 0, 12);
  scene.add(new THREE.AmbientLight(0xffffff, .7));
  const key = new THREE.DirectionalLight(0xffffff, 1.8); key.position.set(3, 5, 8); scene.add(key);
  const rim = new THREE.PointLight(0x34d399, 25, 40); rim.position.set(-6, -3, 4); scene.add(rim);

  const layers = [plane(texSkin(), 11), plane(texCells(), 11), plane(texNucleus(), 11), buildNucleosomes(), buildHelix(), buildPair()]
    .map(obj => { const holder = new THREE.Group(); holder.add(obj); scene.add(holder); const mats = []; holder.traverse(o => o.material && mats.push(o.material)); return { holder, obj, mats }; });

  let z = 0, shown = -1;
  function apply() {
    const i = Math.min(LEVELS.length - 1, Math.floor(z)), f = z - i;
    layers.forEach((L, k) => {
      let s = 0, a = 0;
      if (k === i) { s = Math.pow(K, f); a = 1 - smooth(.55, .95, f); }
      else if (k === i + 1) { s = Math.pow(K, f - 1); a = smooth(.3, .85, f); }
      L.holder.visible = a > .003; L.holder.scale.setScalar(s || 1e-4);
      L.mats.forEach(m => { m.opacity = a; m.depthWrite = a > .98; });
    });
    const lv = f > .5 && i < LEVELS.length - 1 ? i + 1 : i;
    if (lv !== shown) { shown = lv; onLevel && onLevel(lv, LEVELS[lv]); }
  }

  let running = true, raf = 0, last = performance.now(), tween = null;
  function frame(t) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(.05, (t - last) / 1000); last = t;
    if (!running) return;
    if (tween) {
      tween.t += dt;
      const p = Math.min(1, tween.t / tween.d), e = p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      z = tween.a + (tween.b - tween.a) * e; apply();
      if (p >= 1) { const done = tween.done; tween = null; done && done(); }
    }
    if (!reducedMotion()) { layers[3].obj.rotation.y = Math.sin(t / 4000) * .35; layers[4].obj.rotation.y += dt * .4; layers[5].obj.rotation.y = Math.sin(t / 2500) * .5; }
    renderer.render(scene, camera);
  }
  raf = requestAnimationFrame(frame);
  document.addEventListener('visibilitychange', () => { running = !document.hidden; });
  function resize() {
    const w = container.clientWidth || 1, h = container.clientHeight || 1;
    renderer.setSize(w, h, false); camera.aspect = w / h;
    camera.position.z = w < h ? 12 / Math.max(.55, w / h) * .8 : 12; camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(container); resize(); apply();

  const go = (to, d) => new Promise(res => {
    to = Math.max(0, Math.min(LEVELS.length - 1, to));
    if (reducedMotion()) d = Math.min(d, .6);
    tween = { a: z, b: to, t: 0, d: Math.max(.05, d), done: res };
  });
  return {
    LEVELS, scene, camera, renderer,
    get z() { return z; },
    setZ(v) { tween = null; z = Math.max(0, Math.min(LEVELS.length - 1, v)); apply(); },
    go,
    async dive({ from = 0, to = LEVELS.length - 1, per = 2.6, dwell = 1100 } = {}) { // 一镜到底
      const dir = to >= from ? 1 : -1; this.setZ(from);
      for (let k = from; k !== to; k += dir) {
        await go(k + dir, per); sound.tone(392 * Math.pow(1.122, (k + dir)), .4, { gain: .1 });
        await new Promise(r => setTimeout(r, dwell));
      }
    },
    dispose() { cancelAnimationFrame(raf); renderer.dispose(); renderer.domElement.remove(); },
  };
}
