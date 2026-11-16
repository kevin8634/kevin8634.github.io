/* 星图 Math Atlas 2.0 · 改公理·玻璃曲面 —— 三维舞台(three r186,本地;?three=169 回滚)
 * 参考与改写(均为本地原生 JS,零外部请求;署名见 ../LICENSES.md):
 *  - 玻璃曲面:React Bits「Fluid Glass」的透射玻璃思路 + pmndrs/drei MeshTransmissionMaterial(MIT)的厚度/色散/虹彩参数思路,
 *    改写为原生 MeshPhysicalMaterial(transmission、thickness、dispersion、iridescence、clearcoat),曲面全部程序生成,不加载模型;
 *  - 星空:React Bits「Galaxy」的分层星点+闪烁着色器思路,改写为背景天球上的 ShaderMaterial(不做全屏流体);
 *  - 测地线:three.js 官方示例 webgl_lines_fat(Line2 粗线);玻璃调参基准:webgl_materials_physical_transmission。
 *  ThreeUI「Advanced Glass Material」只作画面效果参考,未使用其代码。 */
import * as THREE from 'three';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import * as G from './curve-geo.js';

const SMAX = 2.6;                         // 展示的测地半径(以中心 O 起算)
const FAN = ['#ff8fb1', '#6ff0c8', '#7fb0ff'];
const GOLD = new THREE.Color('#ffe7a3');

function glowTex() {
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
  const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,248,220,1)'); g.addColorStop(.35, 'rgba(255,211,110,.55)'); g.addColorStop(1, 'rgba(255,211,110,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 64); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

/* ---------- 背景天球:分层星点 + 柔和星云(Galaxy 思路改写) ---------- */
function galaxy() {
  const m = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, uniforms: { uT: { value: 0 } },
    vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `varying vec3 vD; uniform float uT;
      float h(vec3 p){ p = fract(p*vec3(443.897,441.423,437.195)); p += dot(p, p.yzx+19.19); return fract((p.x+p.y)*p.z); }
      float n3(vec3 p){ vec3 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
        return mix(mix(mix(h(i),h(i+vec3(1,0,0)),f.x),mix(h(i+vec3(0,1,0)),h(i+vec3(1,1,0)),f.x),f.y),
                   mix(mix(h(i+vec3(0,0,1)),h(i+vec3(1,0,1)),f.x),mix(h(i+vec3(0,1,1)),h(i+vec3(1,1,1)),f.x),f.y),f.z); }
      float stars(vec3 d, float sc, float th){ vec3 p = d*sc; vec3 i = floor(p); float r = h(i); if(r < th) return 0.0;
        vec3 c = i + 0.5 + 0.35*(vec3(h(i+1.3),h(i+2.7),h(i+5.1))-0.5); float dd = length(p - c);
        float tw = 0.75 + 0.25*sin(uT*(0.6+r*2.0) + r*40.0); return smoothstep(0.09, 0.0, dd) * tw * (r-th)/(1.0-th); }
      void main(){ vec3 d = normalize(vD);
        float neb = n3(d*2.2)*0.6 + n3(d*5.1)*0.3 + n3(d*11.0)*0.1;
        vec3 col = mix(vec3(0.012,0.016,0.045), vec3(0.10,0.07,0.22), smoothstep(0.45,0.85,neb));
        col += vec3(0.05,0.12,0.18) * smoothstep(0.55,0.95, n3(d*3.3+4.0)) * 0.6;
        float band = exp(-pow(d.y*3.2 + 0.4*sin(d.x*3.0), 2.0)); col += vec3(0.10,0.08,0.16)*band*0.5;
        float s = stars(d, 120.0, 0.86) + stars(d, 260.0, 0.93)*0.8 + stars(d, 60.0, 0.965)*1.6;
        col += vec3(1.0,0.96,0.9)*s;
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`
  });
  return new THREE.Mesh(new THREE.SphereGeometry(60, 48, 32), m);
}

/* ---------- 环境贴图:程序化柔光箱 → PMREM(玻璃折射/反射用) ---------- */
function envMap(renderer) {
  const s = new THREE.Scene();
  s.add(new THREE.Mesh(new THREE.SphereGeometry(10, 32, 16), new THREE.MeshBasicMaterial({ color: '#0a0d24', side: THREE.BackSide })));
  const box = (c, i, p, sc) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(i), side: THREE.DoubleSide })); m.position.set(...p); m.scale.set(...sc); m.lookAt(0, 0, 0); s.add(m); };
  box('#cfe0ff', 1.3, [0, 8, 2], [7, 3, 1]); box('#ffd36e', 1.1, [-8, 2, -3], [2, 5, 1]); box('#c79bff', 1.0, [8, 1, 3], [2, 5, 1]); box('#6ff0c8', 0.7, [0, -6, -6], [8, 2, 1]);
  const pm = new THREE.PMREMGenerator(renderer); const rt = pm.fromScene(s, 0.035); pm.dispose(); return rt.texture;
}

/* ---------- 一个「世界」:某个 K 下的曲面 + 三角形 + 角扇 + 箭头 ---------- */
class World {
  constructor(ctx) { this.ctx = ctx; this.group = new THREE.Group(); this.parts = []; this.K = 1; this.V = null; this.arrow = null; }
  clear() { for (const o of this.parts) { this.group.remove(o); o.traverse(c => { if (!c.isSprite && c.geometry && !c.geometry.userData.keep) c.geometry.dispose(); if (c.material && !c.material.userData.keep) { this.ctx.lineMats.delete(c.material); c.material.dispose(); } }); } this.parts = []; }
  add(o) { this.group.add(o); this.parts.push(o); return o; }
  normalAt(p3) { const K = this.K; if (K > G.EPS_K) { const R = G.scaleOf(K); return new THREE.Vector3(p3[0], p3[1] + R, p3[2]).normalize(); } return new THREE.Vector3(0, 1, 0); }
  lift(P, h = 0.012) { const d = G.disp3(this.K, P), n = this.normalAt(d); return new THREE.Vector3(d[0] + n.x * h, d[1] + n.y * h, d[2] + n.z * h); }
  line(pts, color, width, op = 1) {
    const g = new LineGeometry(); g.setPositions(pts.flatMap(v => [v.x, v.y, v.z]));
    const m = new LineMaterial({ color, linewidth: width, transparent: true, opacity: op, depthWrite: op >= 1 });  // transparent:不进透射缓冲,玻璃里不出重影
    m.resolution.copy(this.ctx.res); this.ctx.lineMats.add(m);
    const l = new Line2(g, m); l.computeLineDistances(); l.userData.lm = m; return this.add(l);
  }
  build(K, V, show) {
    this.clear(); this.K = K; this.V = V; const ctx = this.ctx, g = Math.sign(Math.abs(K) < G.EPS_K ? 0 : K);
    const S = G.scaleOf(K);
    /* 曲面 */
    const NR = ctx.tier === 'hi' ? 56 : 40, NT = ctx.tier === 'hi' ? 96 : 64, pos = [], idx = [];
    const sMax = g > 0 ? Math.min(SMAX, 0.96 * Math.PI * S) : g < 0 ? Math.min(SMAX * 1.25, 2 * S * Math.atanh(0.985)) : SMAX;
    for (let i = 0; i <= NR; i++) for (let j = 0; j <= NT; j++) {
      const s = sMax * i / NR, th = 2 * Math.PI * j / NT, d = G.disp3(K, G.fromPolar(K, s, th));
      if (g <= 0) { const r = Math.hypot(d[0], d[2]); if (r > SMAX) { d[0] *= SMAX / r; d[2] *= SMAX / r; } }
      pos.push(d[0], d[1], d[2]);
    }
    for (let i = 0; i < NR; i++) for (let j = 0; j < NT; j++) { const a = i * (NT + 1) + j, b = a + NT + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); sg.setIndex(idx); sg.computeVertexNormals();
    const surf = this.add(new THREE.Mesh(sg, ctx.glass)); surf.renderOrder = 1; this.surface = surf;
    /* 测地「等距圆」s = 0.5, 1, …:周长在三种几何里不同(2πR·sin(s/R)、2πs、2πa·sinh(s/a)) */
    for (let s = 0.5; s < sMax - 0.05; s += 0.5) {
      const pts = []; for (let j = 0; j <= 96; j++) pts.push(this.lift(G.fromPolar(K, s, 2 * Math.PI * j / 96), 0.004));
      if (g <= 0 && pts.some(p => Math.hypot(p.x, p.z) > SMAX)) continue;
      this.line(pts, '#9fc2ff', 1, 0.22);
    }
    for (let j = 0; j < 12; j++) { const pts = []; const th = j * Math.PI / 6; for (let i = 0; i <= 40; i++) { const P = G.fromPolar(K, sMax * i / 40, th), v = this.lift(P, 0.004); if (Math.hypot(v.x, v.z) > SMAX + 1e-6 && g <= 0) break; pts.push(v); } if (pts.length > 1) this.line(pts, '#9fc2ff', 1, 0.12); }
    /* 平面/双曲玻璃片的边缘光与虹彩光晕(对照模式不开 Bloom 时也看得出是一块玻璃) */
    if (g <= 0) {
      const rr = g < 0 ? Math.min(SMAX, 2 * S * 0.985) : SMAX, ring = (r, c, w, o, y) => { const pts = []; for (let j = 0; j <= 160; j++) { const a = 2 * Math.PI * j / 160; pts.push(new THREE.Vector3(r * Math.cos(a), y, r * Math.sin(a))); } this.line(pts, c, w, o); };
      ring(rr, '#eaf4ff', 2.4, 0.75, 0.006); ring(rr * 0.985, '#c79bff', 1.6, 0.45, 0.006); ring(rr * 0.97, '#6ff0c8', 1.2, 0.3, 0.006);
      const sheen = this.add(new THREE.Mesh(new THREE.CircleGeometry(rr, 96).rotateX(-Math.PI / 2), ctx.sheenMat)); sheen.position.y = 0.003; sheen.renderOrder = 1;
    }
    /* 双曲:庞加莱圆盘的边界 = 无穷远 */
    if (g < 0 && 2 * S <= SMAX * 1.02) { const pts = []; for (let j = 0; j <= 128; j++) { const a = 2 * Math.PI * j / 128; pts.push(new THREE.Vector3(2 * S * Math.cos(a), 0.01, 2 * S * Math.sin(a))); } this.line(pts, '#c79bff', 2.2, 0.85); }
    if (!V) return;
    const W = V.map(([s, th]) => G.fromPolar(K, s, th));
    this.W = W;
    /* 三角形填充(测地重心细分) */
    const N = 22, tp = [], ti = [], key = (a, b) => a * (N + 1) + b;
    const proj = w => { if (g > 0) { const n = Math.hypot(...w); return w.map(x => x / n); } if (g < 0) { const q = Math.sqrt(Math.max(1e-12, -(w[0] * w[0] + w[1] * w[1] - w[2] * w[2]))); return w.map(x => x / q); } return w; };
    for (let a = 0; a <= N; a++) for (let b = 0; b <= N - a; b++) { const c = N - a - b; const w = [0, 1, 2].map(k => (W[0][k] * a + W[1][k] * b + W[2][k] * c) / N); const v = this.lift(proj(w), 0.008); tp.push(v.x, v.y, v.z); }
    const id = []; let k = 0; for (let a = 0; a <= N; a++) { id[a] = []; for (let b = 0; b <= N - a; b++) id[a][b] = k++; }
    for (let a = 0; a < N; a++) for (let b = 0; b < N - a; b++) { ti.push(id[a][b], id[a + 1][b], id[a][b + 1]); if (b < N - a - 1) ti.push(id[a + 1][b], id[a + 1][b + 1], id[a][b + 1]); }
    const fg = new THREE.BufferGeometry(); fg.setAttribute('position', new THREE.Float32BufferAttribute(tp, 3)); fg.setIndex(ti);
    const fill = this.add(new THREE.Mesh(fg, ctx.fillMat)); fill.renderOrder = 2;
    /* 三条测地线 */
    for (let e = 0; e < 3; e++) { const pts = []; for (let i = 0; i <= 64; i++) pts.push(this.lift(G.geodesic(K, W[e], W[(e + 1) % 3], i / 64), 0.016)); this.line(pts, GOLD, ctx.small ? 3 : 4); }
    /* 角扇 */
    const minE = Math.min(G.dist(K, W[0], W[1]), G.dist(K, W[1], W[2]), G.dist(K, W[2], W[0])), rf = Math.min(0.34, 0.32 * minE);
    if (show.fans) for (let v = 0; v < 3; v++) {
      const P = W[v], t1 = G.towards(K, P, W[(v + 1) % 3]), t2 = G.towards(K, P, W[(v + 2) % 3]);
      const al = Math.acos(Math.max(-1, Math.min(1, G.dot(K, t1, t2)))), e2r = t2.map((x, i) => x - G.dot(K, t2, t1) * t1[i]);
      const n2 = Math.sqrt(Math.max(1e-18, G.dot(K, e2r, e2r))), e2 = e2r.map(x => x / n2), r = rf;
      const fp = [this.lift(P, 0.02)], fi = []; const M = 24;
      for (let i = 0; i <= M; i++) { const ph = al * i / M, T = t1.map((x, j) => Math.cos(ph) * x + Math.sin(ph) * e2[j]); fp.push(this.lift(G.expMap(K, P, T, r), 0.02)); if (i) fi.push(0, i, i + 1); }
      const gg = new THREE.BufferGeometry().setFromPoints(fp); gg.setIndex(fi);
      const fm = new THREE.Mesh(gg, ctx.fanMats[v]); fm.renderOrder = 3; this.add(fm);
    }
    /* 顶点光点 */
    W.forEach((P, i) => {
      const p = this.lift(P, 0.03), sp = new THREE.Sprite(ctx.glowMat); sp.position.copy(p); sp.scale.setScalar(ctx.small ? 0.42 : 0.36); sp.renderOrder = 5; this.add(sp);
      const core = new THREE.Mesh(ctx.coreGeo, ctx.coreMat); core.position.copy(p); this.add(core);
      const hit = new THREE.Mesh(ctx.hitGeo, ctx.hitMat); hit.position.copy(p); hit.userData.vi = i; this.add(hit);
    });
    if (show.arrow) this.placeArrow(show.arrow);
  }
  /** 把箭头放在平行移动的第 f 帧(或给定 {P, v}) */
  placeArrow(fr, ghost) {
    const ctx = this.ctx, K = this.K;
    const at = this.lift(fr.P, 0.05), tip = this.lift(G.expMap(K, fr.P, fr.v, 0.02), 0.05), dir = tip.sub(at).normalize();
    const a = ghost ? ctx.ghostArrow : ctx.arrow;
    a.position.copy(at); a.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir); a.visible = true;
    if (a.parent !== this.group) this.group.add(a);
  }
}

export async function mountStage(el, { tier = 'hi', reduced = false, small = false } = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: tier !== 'lo', powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, tier === 'hi' ? 2 : 1.5));
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05; renderer.outputColorSpace = THREE.SRGBColorSpace;
  el.appendChild(renderer.domElement);
  const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(38, 1, 0.05, 200);
  const sky = galaxy(); scene.add(sky);
  scene.environment = envMap(renderer);
  const key = new THREE.DirectionalLight('#fff4e0', 1.6); key.position.set(3, 6, 4); scene.add(key);
  scene.add(new THREE.HemisphereLight('#9fb8ff', '#120a24', 0.5));
  const res = new THREE.Vector2(1, 1);
  const glass = new THREE.MeshPhysicalMaterial(tier === 'lo' ? { color: '#bcd4ff', transparent: true, opacity: 0.32, roughness: 0.1, metalness: 0, side: THREE.DoubleSide, envMapIntensity: 1.2, depthWrite: false } : {
    color: '#f2f7ff', metalness: 0, roughness: 0.07, transmission: 1, thickness: 0.28, ior: 1.46, side: THREE.FrontSide,
    dispersion: tier === 'hi' ? 0.35 : 0, iridescence: tier === 'hi' ? 0.55 : 0.25, iridescenceIOR: 1.32, iridescenceThicknessRange: [180, 520],
    clearcoat: 1, clearcoatRoughness: 0.05, attenuationColor: new THREE.Color('#cbd7ff'), attenuationDistance: 9, envMapIntensity: 1.5, specularIntensity: 1 });
  glass.userData.keep = true;
  const fillMat = new THREE.MeshBasicMaterial({ color: '#ffd36e', transparent: true, opacity: 0.2, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }); fillMat.userData.keep = true;
  const fanMats = FAN.map(c => { const m = new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.7, side: THREE.DoubleSide, depthWrite: false }); m.userData.keep = true; return m; });
  const sheenTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
    const g = x.createRadialGradient(128, 128, 60, 128, 128, 128); g.addColorStop(0, 'rgba(160,190,255,0.05)'); g.addColorStop(.72, 'rgba(160,190,255,0.10)'); g.addColorStop(.86, 'rgba(199,155,255,0.30)'); g.addColorStop(.94, 'rgba(111,240,200,0.32)'); g.addColorStop(1, 'rgba(255,231,163,0)');
    x.fillStyle = g; x.fillRect(0, 0, 256, 256); const l = x.createLinearGradient(40, 30, 200, 200); l.addColorStop(0, 'rgba(255,255,255,0.16)'); l.addColorStop(.5, 'rgba(255,255,255,0)'); x.fillStyle = l; x.beginPath(); x.arc(128, 128, 124, 0, 7); x.fill();
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  const sheenMat = new THREE.MeshBasicMaterial({ map: sheenTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }); sheenMat.userData.keep = true;
  const glowMat = new THREE.SpriteMaterial({ map: glowTex(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }); glowMat.userData.keep = true;
  const coreMat = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true }); coreMat.userData.keep = true;
  const hitMat = new THREE.MeshBasicMaterial({ visible: false }); hitMat.userData.keep = true;
  const mkArrow = (color, op) => {
    const m = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.9, transparent: true, opacity: op, roughness: 0.3 });
    const g = new THREE.Group(), shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.34, 12), m), head = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.14, 16), m);
    shaft.position.y = 0.17; head.position.y = 0.41; g.add(shaft, head); g.visible = false; return g;
  };
  const keep = g => { g.userData.keep = true; return g; };
  const ctx = { tier, small, res, glass, sheenMat, fillMat, fanMats, glowMat, coreMat, hitMat, lineMats: new Set(),
    coreGeo: keep(new THREE.SphereGeometry(0.035, 16, 12)), hitGeo: keep(new THREE.SphereGeometry(0.22, 10, 8)),
    arrow: mkArrow('#7ff7ff', 1), ghostArrow: mkArrow('#ffffff', 0.35) };
  const main = new World(ctx), flat = new World(ctx); scene.add(main.group, flat.group); flat.group.visible = false;

  let composer = null;
  if (tier === 'hi') { composer = new EffectComposer(renderer); composer.addPass(new RenderPass(scene, cam)); composer.addPass(new UnrealBloomPass(new THREE.Vector2(1, 1), 0.5, 0.55, 0.82)); composer.addPass(new OutputPass()); }

  let K = 1, V = null, show = { fans: true, arrow: null };
  /* 机位:简单环绕(拖空白处转动,不做缩放) */
  let yaw = -0.35, pitch = 0.92, fitR = 2.9, W = 1, H = 1, dirty = true, cmp = false, split = 0.5;
  const target = new THREE.Vector3(0, -0.3, 0);
  function placeCam() {
    const asp = W / H, fit = fitR * 1.12 / Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)) / Math.min(1, asp * 1.05);
    const d = Math.max(fitR * 1.9, fit); target.y = K > G.EPS_K ? -Math.min(fitR, G.scaleOf(K)) * 0.45 : -0.25; cam.position.set(target.x + d * Math.cos(pitch) * Math.sin(yaw), target.y + d * Math.sin(pitch), target.z + d * Math.cos(pitch) * Math.cos(yaw)); cam.lookAt(target);
  }
  function resize() {
    const r = el.getBoundingClientRect(); W = Math.max(1, r.width); H = Math.max(1, r.height);
    renderer.setSize(W, H, false); renderer.domElement.style.width = W + 'px'; renderer.domElement.style.height = H + 'px';
    cam.aspect = W / H; cam.updateProjectionMatrix(); placeCam();
    res.set(W * renderer.getPixelRatio(), H * renderer.getPixelRatio()); ctx.lineMats.forEach(m => m.resolution.copy(res));
    composer?.setSize(W, H); dirty = true;
  }
  const ro = new ResizeObserver(resize); ro.observe(el); resize();

  /* 拖顶点 / 拖空白转视角 */
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  let drag = null, onVerts = null, last = null, locked = false;
  const toNdc = e => { const r = renderer.domElement.getBoundingClientRect(); ndc.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1); ray.setFromCamera(ndc, cam); };
  function hitSurface(world) {
    const K = world.K, o = ray.ray.origin, d = ray.ray.direction;
    if (K > G.EPS_K) { const R = G.scaleOf(K), c = new THREE.Vector3(0, -R, 0), oc = o.clone().sub(c), b = oc.dot(d), q = oc.lengthSq() - R * R, D = b * b - q; if (D < 0) return null; const t = -b - Math.sqrt(D); return t > 0 ? o.clone().addScaledVector(d, t) : null; }
    if (Math.abs(d.y) < 1e-6) return null; const t = -o.y / d.y; return t > 0 ? o.clone().addScaledVector(d, t) : null;
  }
  const cv = renderer.domElement; cv.style.touchAction = 'none';
  cv.addEventListener('pointerdown', e => {
    toNdc(e); const world = cmp && (e.clientX - cv.getBoundingClientRect().left) / W < split ? flat : main;
    const hits = locked ? [] : ray.intersectObjects(world.parts.filter(o => o.userData.vi !== undefined), false);
    if (hits.length) { drag = { vi: hits[0].object.userData.vi }; cv.setPointerCapture(e.pointerId); el.classList.add('dragging'); return; }
    last = [e.clientX, e.clientY]; cv.setPointerCapture(e.pointerId);
  });
  cv.addEventListener('pointermove', e => {
    if (drag) {
      toNdc(e); const p = hitSurface(main); if (!p) return; const K = main.K;
      const P = G.undisp3(K, p.x, p.y, p.z); let [s, th] = G.toPolar(K, P);
      const S = G.scaleOf(K), lim = K > G.EPS_K ? Math.min(2.4, 0.9 * Math.PI * S) : K < -G.EPS_K ? Math.min(2.45, 2 * S * Math.atanh(0.96)) : 2.4;
      s = Math.min(lim, s); onVerts?.(drag.vi, [s, th]); return;
    }
    if (last && !reduced) { yaw -= (e.clientX - last[0]) * 0.006; pitch = Math.max(0.18, Math.min(1.25, pitch + (e.clientY - last[1]) * 0.004)); last = [e.clientX, e.clientY]; placeCam(); dirty = true; }
  });
  const up = () => { drag = null; last = null; el.classList.remove('dragging'); };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);

  /* 渲染循环:只在有变化或动画时绘制 */
  let raf = 0, anim = null, t0 = performance.now(), alive = true;
  function frame(now) {
    if (!alive) return; raf = requestAnimationFrame(frame);
    if (anim) { anim(now); dirty = true; }
    if (!reduced && tier === 'hi' && !document.hidden && now - t0 > 120) { sky.material.uniforms.uT.value = now / 1000; t0 = now; dirty = true; }
    if (!dirty) return; dirty = false;
    if (cmp) {
      renderer.setScissorTest(true); const pr = W * split;
      main.group.visible = false; flat.group.visible = true; renderer.setScissor(0, 0, pr, H); renderer.setViewport(0, 0, W, H); renderer.render(scene, cam);
      main.group.visible = true; flat.group.visible = false; renderer.setScissor(pr, 0, W - pr, H); renderer.render(scene, cam);
      renderer.setScissorTest(false);
    } else if (composer) composer.render(); else renderer.render(scene, cam);
  }
  raf = requestAnimationFrame(frame);

  
  const rebuild = () => { const nf = K > G.EPS_K && !cmp ? Math.max(1.35, Math.min(2.9, 1.3 * G.scaleOf(K))) : 2.9; if (nf !== fitR) { fitR = nf; placeCam(); } main.build(K, V, show); if (cmp) flat.build(0, V, { fans: true }); dirty = true; };
  return {
    tier,
    set(k, verts, opts = {}) { K = k; V = verts; Object.assign(show, opts); ctx.arrow.visible = false; ctx.ghostArrow.visible = false; rebuild(); },
    lock(b) { locked = b; },
    onVerts(cb) { onVerts = cb; },
    compare(on) { cmp = on; flat.group.visible = false; main.group.visible = true; rebuild(); },
    setSplit(x) { split = Math.max(0.05, Math.min(0.95, x)); dirty = true; },
    /** 平行移动动画;返回转角 */
    transport(ms = 5200) {
      const W2 = V.map(([s, th]) => G.fromPolar(K, s, th)), ccw = G.orientation(K, W2) > 0 ? W2 : [W2[0], W2[2], W2[1]];
      const tr = G.transport(K, ccw, Math.PI / 2.2, 60), F = tr.frames;
      main.placeArrow(F[0], true);
      if (reduced) { main.placeArrow(F[F.length - 1]); dirty = true; return Promise.resolve(tr.rot); }
      return new Promise(res => { const st = performance.now(); anim = now => { const u = Math.min(1, (now - st) / ms), i = Math.min(F.length - 1, Math.floor(u * (F.length - 1))); main.placeArrow(F[i]); if (u >= 1) { anim = null; res(tr.rot); } }; });
    },
    hideArrow() { ctx.arrow.visible = false; ctx.ghostArrow.visible = false; dirty = true; },
    dispose() { alive = false; cancelAnimationFrame(raf); ro.disconnect(); renderer.dispose(); }
  };
}
