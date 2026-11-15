/* 创世计划 门户 3.0 · 首屏「第一性原理」（11-15 夜，替换视频底片 p3film.js）
 * 一棵实时生长的知识之树：根是数学，往上长出物理、化学、生命、认知、智能，树冠是星空，顶端是待造的第八颗星。
 * 七层 = 七个世界，每层是一团实时粒子形态（斐波那契种盘+二十面体 / 原子 / 苯环分子 / DNA 双螺旋 / 心智环结 / 神经网络 / 旋涡星系），
 * 枝干是程序生成的发光光管，光脉从根部往上流；鼠标是引力井，搅动尘埃；悬停点亮、点击进入对应世界。
 * 没有一张图片或视频：星云、星空、粒子、光管全部实时着色器渲染。three r186 本地 vendor（MIT），零外部请求。
 * 管线：HalfFloat HDR RT(MSAA) → bloom（13-tap 降采样 + tent 升采样）→ 合成（暗角、ACES/AgX、分离色调、颗粒、抖动、sRGB）。
 * 画质：high（DPR≤1.5，MSAA4，粒子全量）/ medium（DPR≤1.25）/ low（DPR≤.9，粒子约 1/3，bloom 4 级）。卡顿自动降分辨率再降档。
 * 减少动态：只渲染一帧成品静帧，不进循环。 */
import * as THREE from '../ludoterra/vendor/r186/three.module.min.js';
import { pickTier, lower, SLOW } from './p3tier.js';

let S = null;
const NOFPS = /[?&]p3nofps=1\b/.test(location.search);
const TIERS = {
  high:   { dpr: 1.5,  msaa: 4, mips: 6, k: 1,   budget: 3.2e6 },
  medium: { dpr: 1.25, msaa: 2, mips: 5, k: .6,  budget: 2.0e6 },
  low:    { dpr: .9,   msaa: 0, mips: 4, k: .32, budget: 9e5 },
};

/* 七层（自下而上）：id 对应页面 WORLDS */
const LV = [
  { id: '01', f: ['数学', 'Math'],       y: 0,    x: 0,     r: 1.15 },
  { id: '02', f: ['物理', 'Physics'],    y: 2.25, x: -2.1,  r: .95 },
  { id: '03', f: ['化学', 'Chemistry'],  y: 4.5,  x: 2.0,   r: 1.0 },
  { id: '04', f: ['生命', 'Life'],       y: 6.75, x: -1.9,  r: 1.05 },
  { id: '06', f: ['认知', 'Mind'],       y: 9.0,  x: 1.9,   r: 1.0 },
  { id: '05', f: ['智能', 'Intelligence'], y: 11.25, x: -1.6, r: 1.05 },
  { id: '07', f: ['天文', 'Cosmos'],     y: 13.9, x: 0,     r: 2.2 },
];
const STAR_Y = 16.9, TOP = 17.6;
const SC = [1.15, 1.6, 1.5, 1.4, 1.4, 1.45, 1.2];   // 各层形态放大（形态按单位尺寸建模）
const FB = { '01': ['星图', 'Math Atlas', '#7cc8ff', 'math-atlas/'], '02': ['宙律', 'Nomoverse', '#a78bfa', 'nomoverse/'], '03': ['元素工坊', 'Element Forge', '#ff9a3c', 'element-forge/'],
  '04': ['生命源码', 'Life Source', '#34d399', 'life-source/'], '05': ['奇点前夜', 'Pre-Singularity', '#22d3ee', 'pre-singularity/'], '06': ['觉弈', 'Ludoterra', '#f5c26b', 'ludoterra/'], '07': ['天枢', 'Starhelm', '#dfe6f3', 'starhelm/'] };

function rng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
const ease = x => x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x);
const eio = x => x <= 0 ? 0 : x >= 1 ? 1 : x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;

/* ---------------- shaders ---------------- */
const BG_VERT = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, .9999, 1.); }`;
const BG_FRAG = `varying vec2 vUv; uniform float uT, uAsp; uniform vec2 uPar;
float h1(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
float nz(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(h1(i),h1(i+vec2(1,0)),f.x), mix(h1(i+vec2(0,1)),h1(i+vec2(1,1)),f.x), f.y); }
float fbm(vec2 p){ float a=.5, s=0.; mat2 m=mat2(1.6,1.2,-1.2,1.6); for(int i=0;i<5;i++){ s+=a*nz(p); p=m*p; a*=.5; } return s; }
void main(){
  vec2 p = (vUv-.5)*vec2(uAsp,1.)*2.2 + uPar*vec2(.05,.03);
  float n = fbm(p*1.25 + vec2(uT*.006, -uT*.004));
  float n2 = fbm(p*2.4 - n*1.6 + 3.1 + uT*.004);
  vec3 c = vec3(.006,.004,.016);
  c += vec3(.22,.07,.42)*pow(n2,3.2)*1.25*smoothstep(1.7,.0,length(p-vec2(-.75,.35)));
  c += vec3(.02,.17,.24)*pow(n,3.4)*1.1*smoothstep(1.9,.1,length(p-vec2(.9,-.45)));
  c += vec3(.10,.06,.22)*exp(-abs(p.x)*1.8)*.22*(.6+.4*n);                       // 树后竖向辉光
  c += vec3(.16,.12,.26)*exp(-length(p-vec2(0.,.95))*1.6)*.25;                     // 树冠星系后的光晕
  vec2 q = (vUv*vec2(uAsp,1.) + uPar*.004)*380.; vec2 id = floor(q); float hs = h1(id);
  if (hs > .9965) { vec2 f = fract(q)-.5 - (vec2(h1(id+.3), h1(id+.7))-.5)*.5; float tw = .55+.45*sin(uT*(1.+hs*3.)+hs*91.);
    c += vec3(.8,.85,1.)*exp(-dot(f,f)*42.)*(hs-.9965)*420.*tw; }
  gl_FragColor = vec4(c, 1.);
}`;

const TUBE_VERT = `attribute vec3 aCol; attribute float aPh; varying vec3 vC; varying float vY, vF, vPh;
void main(){ vec4 mv = modelViewMatrix*vec4(position,1.); vec3 n = normalize(normalMatrix*normal);
  vF = abs(dot(n, normalize(-mv.xyz))); vY = position.y; vC = aCol; vPh = aPh; gl_Position = projectionMatrix*mv; }`;
const TUBE_FRAG = `uniform float uT, uGrow, uK, uSh; varying vec3 vC; varying float vY, vF, vPh;
void main(){
  if (vY > uGrow) discard;
  float core = uSh > .5 ? pow(vF, 1.4)*.16 : pow(vF, 2.4);
  float p = fract(vY*.16 - uT*.36 + vPh);
  float pulse = exp(-pow((p-.5)*18., 2.));
  float tip = exp(-pow((uGrow - vY)*2.4, 2.))*step(uGrow, ${TOP.toFixed(1)});
  vec3 c = vC*core*(uK + pulse*3.2) + vec3(1.,.95,1.)*core*(tip*3. + pulse*.6);
  gl_FragColor = vec4(c, 1.);
}`;

const PT_VERT = `attribute vec3 aCol; attribute float aSz, aSd; uniform float uPx, uT, uHi, uK, uMin; varying vec3 vC;
void main(){ vec4 mv = modelViewMatrix*vec4(position,1.); gl_Position = projectionMatrix*mv;
  float tw = .78 + .22*sin(uT*(1.3+aSd*3.1) + aSd*47.);
  float s = aSz*uPx*(1. + .25*uHi)/-mv.z;
  float k = s < uMin ? s/uMin : 1.;                     // 低于最小像素时放大但按面积减亮，避免闪烁
  gl_PointSize = max(s, uMin);
  vC = aCol*uK*(1. + 1.1*uHi)*tw*k*k; }`;
const PT_FRAG = `varying vec3 vC; void main(){ vec2 d = gl_PointCoord-.5; float r = dot(d,d)*4.; if (r > 1.) discard;
  float a = exp(-r*4.5)*.75 + exp(-r*36.)*.9; gl_FragColor = vec4(vC*a, 1.); }`;

const DUST_VERT = `attribute vec3 aB; attribute float aSd; uniform float uT, uPx, uMs, uK; uniform vec3 uM; varying vec3 vC;
void main(){
  vec3 p = aB; p.y = mod(aB.y + uT*(.07 + aSd*.14) + 1.5, ${(TOP + 3.5).toFixed(1)}) - 1.5;
  p.x += sin(uT*.17 + aSd*21.)*.35; p.z += cos(uT*.13 + aSd*17.)*.3;
  vec3 d = uM - p; float L = length(d); float f = uMs*exp(-L*L*.22);
  vec3 dn = d/(L+1e-4); p += dn*f*1.1 + normalize(cross(dn, vec3(0.,0.,1.)) + 1e-4)*f*1.8;
  vec4 mv = modelViewMatrix*vec4(p,1.); gl_Position = projectionMatrix*mv;
  float s = (.028 + aSd*.05)*uPx/-mv.z; gl_PointSize = max(s, 1.2);
  float k = s < 1.2 ? s/1.2 : 1.;
  vC = mix(vec3(.55,.42,1.), vec3(.35,.85,1.), fract(aSd*7.31))*(.35 + 2.6*f)*uK*k*k*(.6+.4*sin(uT*1.7+aSd*60.)); }`;

/* 后期（沿用阶段 2 管线） */
const FS_VERT = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }`;
const DOWN_FRAG = `varying vec2 vUv; uniform sampler2D tSrc; uniform vec2 uTx; uniform float uFirst;
vec3 s(vec2 o){ return min(texture2D(tSrc, vUv + o*uTx).rgb, vec3(60.)); }
float kw(vec3 c){ return 1./(1.+dot(c, vec3(.2126,.7152,.0722))*.1); }
void main(){
  vec3 a=s(vec2(-2,2)),b=s(vec2(0,2)),c=s(vec2(2,2)),d=s(vec2(-2,0)),e=s(vec2(0)),f=s(vec2(2,0)),g=s(vec2(-2,-2)),h=s(vec2(0,-2)),i=s(vec2(2,-2));
  vec3 j=s(vec2(-1,1)),k=s(vec2(1,1)),l=s(vec2(-1,-1)),m=s(vec2(1,-1));
  vec3 g4=(j+k+l+m)*.25, g0=(a+b+d+e)*.25, g1=(b+c+e+f)*.25, g2=(d+e+g+h)*.25, g3=(e+f+h+i)*.25;
  vec4 w = uFirst > .5 ? vec4(kw(g0),kw(g1),kw(g2),kw(g3))*.125 : vec4(.125); float w4 = uFirst > .5 ? kw(g4)*.5 : .5;
  gl_FragColor = vec4((g0*w.x+g1*w.y+g2*w.z+g3*w.w+g4*w4)/(w.x+w.y+w.z+w.w+w4), 1.);
}`;
const UP_FRAG = `varying vec2 vUv; uniform sampler2D tLow, tHigh; uniform vec2 uTx; uniform float uMix;
void main(){ vec2 o = uTx; vec3 t = texture2D(tLow, vUv).rgb*4.;
  t += (texture2D(tLow, vUv+vec2(o.x,0.)).rgb + texture2D(tLow, vUv-vec2(o.x,0.)).rgb + texture2D(tLow, vUv+vec2(0.,o.y)).rgb + texture2D(tLow, vUv-vec2(0.,o.y)).rgb)*2.;
  t += texture2D(tLow, vUv+o).rgb + texture2D(tLow, vUv-o).rgb + texture2D(tLow, vUv+vec2(o.x,-o.y)).rgb + texture2D(tLow, vUv+vec2(-o.x,o.y)).rgb;
  gl_FragColor = vec4(mix(texture2D(tHigh, vUv).rgb, t/16., uMix), 1.); }`;
const COMP_FRAG = `varying vec2 vUv; uniform sampler2D tScene, tBloom; uniform float uBloom, uExp, uT, uAsp, uFade, uCA;
float luma(vec3 c){ return dot(c, vec3(.2126,.7152,.0722)); }
vec3 aces(vec3 x){ x *= .6; return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14), 0., 1.); }
const mat3 S2R = mat3(vec3(.6274,.0691,.0164), vec3(.3293,.9195,.0880), vec3(.0433,.0113,.8956));
const mat3 R2S = mat3(vec3(1.6605,-.1246,-.0182), vec3(-.5876,1.1329,-.1006), vec3(-.0728,-.0083,1.1187));
vec3 agxC(vec3 x){ vec3 x2=x*x, x4=x2*x2; return 15.5*x4*x2 - 40.14*x4*x + 31.96*x4 - 6.868*x2*x + .4298*x2 + .1191*x - .00232; }
vec3 agx(vec3 c){
  const mat3 ins = mat3(vec3(.856627153315983,.137318972929847,.11189821299995), vec3(.0951212405381588,.761241990602591,.0767994186031903), vec3(.0482516061458583,.101439036467562,.811302368396859));
  const mat3 outs = mat3(vec3(1.1271005818144368,-.1413297634984383,-.14132976349843826), vec3(-.11060664309660323,1.157823702216272,-.11060664309660294), vec3(-.016493938717834573,-.016493938717834257,1.2519364065950405));
  c = ins*(S2R*c); c = clamp((log2(max(c,1e-10))+12.47393)/16.5, 0., 1.); c = agxC(c);
  float l = luma(c); c = pow(max(c,0.), vec3(1.12)); c = l + (c-l)*1.25;
  c = pow(max(outs*c,0.), vec3(2.2)); return clamp(R2S*c, 0., 1.);
}
float hh(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)))*43758.5453); }
void main(){
  vec2 dd = (vUv-.5); vec3 c;
  if (uCA > 0.) c = vec3(texture2D(tScene, vUv+dd*uCA).r, texture2D(tScene, vUv).g, texture2D(tScene, vUv-dd*uCA).b);
  else c = texture2D(tScene, vUv).rgb;
  c = mix(c, texture2D(tBloom, vUv).rgb, uBloom);
  vec2 d = dd*vec2(uAsp,1.); c *= 1. - smoothstep(.35, 1.2, length(d))*.45;
  c *= uExp;
  c = mix(aces(c), agx(c), .5);
  float l = luma(c);
  c += mix(vec3(.004,-.004,.016), vec3(.012,.006,-.006), smoothstep(.15,.7,l));
  c = mix(vec3(l), c, 1.1);
  c = c*(1.-.025) + vec3(.006,.004,.014);
  c += (hh(vUv*1717. + fract(uT*7.13)*91.) - .5) * .014 * (1.-l*.6);
  c = max(c, 0.);
  c = mix(c*12.92, 1.055*pow(c, vec3(1./2.4)) - .055, step(.0031308, c));
  c += (hh(gl_FragCoord.xy + fract(uT)) - .5)/255.;
  gl_FragColor = vec4(c*uFade, 1.);
}`;

/* ---------------- geometry helpers ---------------- */
function col(hex, k) { const c = new THREE.Color(hex); return [c.r * (k || 1), c.g * (k || 1), c.b * (k || 1)]; }
class PB {   // 点云收集器
  constructor() { this.p = []; this.c = []; this.s = []; this.d = []; this.R = rng(7); }
  add(x, y, z, c, s, k) { this.p.push(x, y, z); this.c.push(c[0] * (k || 1), c[1] * (k || 1), c[2] * (k || 1)); this.s.push(s); this.d.push(this.R()); }
  ball(cx, cy, cz, r, n, c, s, k) { for (let i = 0; i < n; i++) { const u = this.R() * 2 - 1, a = this.R() * 6.2832, rr = r * Math.cbrt(this.R()), q = Math.sqrt(1 - u * u); this.add(cx + rr * q * Math.cos(a), cy + rr * u, cz + rr * q * Math.sin(a), c, s, k); } }
  line(a, b, n, c, s, k) { for (let i = 0; i <= n; i++) { const t = i / n; this.add(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t, c, s, k); } }
  geo() { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3)); g.setAttribute('aCol', new THREE.Float32BufferAttribute(this.c, 3));
    g.setAttribute('aSz', new THREE.Float32BufferAttribute(this.s, 1)); g.setAttribute('aSd', new THREE.Float32BufferAttribute(this.d, 1)); return g; }
}
function mergeTubes(list) {   // list: [{geo, col:fn(y)->[r,g,b], ph}]
  let nv = 0, ni = 0; list.forEach(o => { nv += o.geo.attributes.position.count; ni += o.geo.index.count; });
  const P = new Float32Array(nv * 3), N = new Float32Array(nv * 3), C = new Float32Array(nv * 3), F = new Float32Array(nv), I = new Uint32Array(ni);
  let v = 0, i = 0;
  list.forEach(o => { const p = o.geo.attributes.position.array, n = o.geo.attributes.normal.array, idx = o.geo.index.array, cnt = p.length / 3;
    P.set(p, v * 3); N.set(n, v * 3);
    for (let k = 0; k < cnt; k++) { const c = o.col(p[k * 3 + 1]); C[(v + k) * 3] = c[0]; C[(v + k) * 3 + 1] = c[1]; C[(v + k) * 3 + 2] = c[2]; F[v + k] = o.ph; }
    for (let k = 0; k < idx.length; k++) I[i + k] = idx[k] + v;
    v += cnt; i += idx.length; o.geo.dispose(); });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.BufferAttribute(N, 3));
  g.setAttribute('aCol', new THREE.BufferAttribute(C, 3)); g.setAttribute('aPh', new THREE.BufferAttribute(F, 1)); g.setIndex(new THREE.BufferAttribute(I, 1));
  return g;
}

/* ---------------- main ---------------- */
export function start(host, opts) {
  if (S) return S;
  opts = opts || {};
  const en = window.GN_LANG === 'en';
  let canvas = host.querySelector('#p3cv');
  if (!canvas) { canvas = document.createElement('canvas'); canvas.id = 'p3cv'; canvas.setAttribute('aria-hidden', 'true'); host.insertBefore(canvas, host.firstChild); }
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance', stencil: false }); }
  catch (e) { return null; }
  if (!renderer.capabilities.isWebGL2) { renderer.dispose(); return null; }
  const pick = pickTier(renderer.getContext());
  let tierName = pick.tier, T = TIERS[tierName];
  const K = T.k;   // 粒子数量系数按启动档定（热切换只换后期与分辨率）
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.setClearColor(0x030208, 1);
  renderer.autoClear = false;

  const W = {}; (window.GN_WORLDS || []).forEach(w => { W[w.id] = w; });
  const info = id => { const w = W[id], f = FB[id]; return { name: w ? (en ? (w.en || w.name) : w.name) : (en ? f[1] : f[0]), color: (w && w.color) || f[2], href: (w && w.href) || f[3] }; };
  LV.forEach(l => { const w = info(l.id); l.name = w.name; l.color = w.color; l.href = w.href; l.c = col(w.color); });
  function colAt(y) { if (y <= LV[0].y) return LV[0].c; if (y >= LV[6].y) { const t = Math.min(1, (y - LV[6].y) / 3); const a = LV[6].c; return [a[0] + (1 - a[0]) * t, a[1] + (1 - a[1]) * t, a[2] + (1 - a[2]) * t]; }
    for (let i = 0; i < 6; i++) if (y <= LV[i + 1].y) { const t = ease((y - LV[i].y) / (LV[i + 1].y - LV[i].y)), a = LV[i].c, b = LV[i + 1].c; return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; } return LV[6].c; }

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, .1, 300);
  const TAN = Math.tan(THREE.MathUtils.degToRad(19));
  const U = { uT: { value: 0 }, uAsp: { value: 1 }, uPar: { value: new THREE.Vector2() }, uGrow: { value: -1 }, uPx: { value: 500 } };
  const fsGeo = new THREE.PlaneGeometry(2, 2);
  const bg = new THREE.Mesh(fsGeo, new THREE.ShaderMaterial({ uniforms: { uT: U.uT, uAsp: U.uAsp, uPar: U.uPar }, vertexShader: BG_VERT, fragmentShader: BG_FRAG, depthWrite: false, depthTest: false }));
  bg.frustumCulled = false; bg.renderOrder = -10; scene.add(bg);
  const geos = [], mats = [];
  const ADD = { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending };
  function ptMat(k, min) { const m = new THREE.ShaderMaterial({ uniforms: { uPx: U.uPx, uT: U.uT, uHi: { value: 0 }, uK: { value: k || 1 }, uMin: { value: min || 1.5 } }, vertexShader: PT_VERT, fragmentShader: PT_FRAG, ...ADD }); mats.push(m); return m; }

  /* ---------- 枝干：主干穿过七层 + 每层侧枝（越往上越多）+ 根须 ---------- */
  const R = rng(20251115), tubes = [];
  const trunkPts = [];
  for (let i = 0; i < LV.length; i++) {
    const l = LV[i]; trunkPts.push(new THREE.Vector3(l.x, l.y, 0));
    if (i < LV.length - 1) { const n = LV[i + 1]; trunkPts.push(new THREE.Vector3((l.x + n.x) * .5 + (R() - .5) * .8, (l.y + n.y) * .5, (R() - .5) * 1.2)); }
  }
  trunkPts.push(new THREE.Vector3(.25, (LV[6].y + STAR_Y) * .5, .3), new THREE.Vector3(0, STAR_Y, 0));
  const trunk = new THREE.CatmullRomCurve3(trunkPts, false, 'centripetal', .5);
  tubes.push({ geo: new THREE.TubeGeometry(trunk, 420, .05, 8, false), col: colAt, ph: 0 });
  const sheathGeo = mergeTubes([{ geo: new THREE.TubeGeometry(trunk, 300, .2, 8, false), col: colAt, ph: 0 }]);
  const buds = new PB();
  function twig(o, dir, len, rad, depth) {
    const pts = [o.clone()]; const d = dir.clone(); const p = o.clone();
    for (let s = 0; s < 4; s++) { d.x += (R() - .5) * .5; d.z += (R() - .5) * .5; d.y += .18; d.normalize(); p.addScaledVector(d, len / 4); pts.push(p.clone()); }
    const cv = new THREE.CatmullRomCurve3(pts);
    tubes.push({ geo: new THREE.TubeGeometry(cv, 24, rad, 5, false), col: colAt, ph: R() });
    const c = colAt(p.y); buds.add(p.x, p.y, p.z, c, .16 + R() * .1, 2.2); buds.add(p.x, p.y, p.z, c, .9, .05);
    if (depth > 0) { const m = cv.getPoint(.55); const nd = d.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), (R() - .5) * 2.4); nd.y += .2; nd.normalize(); twig(m, nd, len * .55, rad * .7, depth - 1); }
  }
  for (let i = 0; i < LV.length - 1; i++) {
    const l = LV[i], nTw = 2 + Math.round(i * .8);
    for (let k = 0; k < nTw; k++) {
      const a = (k / nTw) * 6.2832 + R() * .8;
      const o = new THREE.Vector3(l.x + Math.cos(a) * l.r * .5, l.y + .1 + R() * .3, Math.sin(a) * l.r * .4);
      const d = new THREE.Vector3(Math.cos(a) * (l.x === 0 ? 1 : Math.sign(Math.cos(a)) === Math.sign(l.x) ? 1.2 : .6), .7, Math.sin(a) * .6).normalize();
      twig(o, d, .9 + R() * .9 + i * .08, .018, i > 1 ? 1 : 0);
    }
  }
  for (let k = 0; k < 6; k++) {   // 根须：从数学向下、向外散开
    const a = k / 6 * 6.2832 + .3, pts = [new THREE.Vector3(0, -.05, 0)];
    const p = new THREE.Vector3(), d = new THREE.Vector3(Math.cos(a), -.35, Math.sin(a) * .7).normalize();
    for (let s = 1; s <= 4; s++) { d.y -= .06; d.x += (R() - .5) * .3; d.normalize(); p.addScaledVector(d, .38); pts.push(p.clone()); }
    tubes.push({ geo: new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 20, .016, 5, false), col: () => LV[0].c.map(v => v * .7), ph: R() });
  }
  const tubeGeo = mergeTubes(tubes); geos.push(tubeGeo, sheathGeo);
  const tubeMat = new THREE.ShaderMaterial({ uniforms: { uT: U.uT, uGrow: U.uGrow, uK: { value: .85 }, uSh: { value: 0 } }, vertexShader: TUBE_VERT, fragmentShader: TUBE_FRAG, ...ADD });
  const sheathMat = new THREE.ShaderMaterial({ uniforms: { uT: U.uT, uGrow: U.uGrow, uK: { value: 1 }, uSh: { value: 1 } }, vertexShader: TUBE_VERT, fragmentShader: TUBE_FRAG, ...ADD });
  mats.push(tubeMat, sheathMat);
  scene.add(new THREE.Mesh(tubeGeo, tubeMat), new THREE.Mesh(sheathGeo, sheathMat));
  const budGeo = buds.geo(); geos.push(budGeo); const budPts = new THREE.Points(budGeo, ptMat(1, 1.4)); scene.add(budPts);

  /* ---------- 七层形态 ---------- */
  const N = LV.map(() => ({ g: new THREE.Group(), mats: [], spin: [] }));
  function addPts(i, pb, parent, k, min) { const g = pb.geo(); geos.push(g); const m = ptMat(k, min); N[i].mats.push(m); const p = new THREE.Points(g, m); (parent || N[i].g).add(p); return p; }
  function addLines(i, geo, hex, k, parent) { geos.push(geo); const m = new THREE.LineBasicMaterial({ color: new THREE.Color(hex).multiplyScalar(k), ...ADD }); mats.push(m); N[i].mats.push({ lb: m, base: k, hex }); const L = new THREE.LineSegments(geo, m); (parent || N[i].g).add(L); return L; }
  function halo(i, pb, r) { pb.add(0, 0, 0, LV[i].c, r * 3.4, .05); pb.add(0, 0, 0, LV[i].c, r * 1.4, .1); }
  const W2 = [1, 1, 1];

  { // 0 数学：斐波那契种盘（黄金角）+ 二十面体线框
    const i = 0, l = LV[i], pb = new PB(), n = Math.round(1300 * Math.max(.45, K)); halo(i, pb, l.r);
    for (let k = 0; k < n; k++) { const r = l.r * .95 * Math.sqrt(k / n), a = k * 2.39996323; pb.add(r * Math.cos(a), 0, r * Math.sin(a), k % 21 === 0 ? W2 : l.c, .035 + .03 * (1 - k / n), k % 21 === 0 ? 2.5 : 1.2); }
    const disk = new THREE.Group(); disk.rotation.x = .22; N[i].g.add(disk); addPts(i, pb, disk);
    const ico = new THREE.Group(); ico.position.y = .62; N[i].g.add(ico);
    addLines(i, new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(.48, 0)), l.color, 1.8, ico);
    addLines(i, new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(.3, 0)), '#ffffff', 1.2, ico).rotation.set(.6, .3, 0);
    const v = new PB(); v.ball(0, 0, 0, .05, 12, W2, .12, 3); addPts(i, v, ico);
    N[i].spin.push([disk, 'y', .06], [ico, 'y', .22], [ico, 'x', .1]);
  }
  { // 1 物理：原子核 + 三条轨道 + 电子
    const i = 1, l = LV[i], pb = new PB(); halo(i, pb, l.r);
    const R2 = rng(11); for (let k = 0; k < 12; k++) { const u = R2() * 2 - 1, a = R2() * 6.28, q = Math.sqrt(1 - u * u), rr = .16 * Math.cbrt(R2());
      pb.ball(rr * q * Math.cos(a), rr * u, rr * q * Math.sin(a), .075, Math.round(34 * Math.max(.5, K)), k % 2 ? [1, .55, .3] : l.c, .045, 1.8); }
    addPts(i, pb);
    const tilt = [[0, 0, 0], [1.05, 0, .5], [-1.05, 0, -.5]];
    tilt.forEach((tl, k) => { const og = new THREE.Group(); og.rotation.set(Math.PI / 2 + tl[0], tl[1], tl[2]); N[i].g.add(og);
      const ring = new THREE.Group(); og.add(ring); const rp = new PB(), rr = l.r * (.78 + k * .05), nr = Math.round(240 * Math.max(.5, K));
      for (let s = 0; s < nr; s++) { const a = s / nr * 6.2832; rp.add(rr * Math.cos(a), rr * Math.sin(a), 0, l.c, .03, 1.1); }
      rp.add(rr, 0, 0, W2, .22, 5); rp.add(rr, 0, 0, l.c, .7, .35);
      for (let s = 1; s < 26; s++) { const a = -s * .022; rp.add(rr * Math.cos(a), rr * Math.sin(a), 0, l.c, .07 * (1 - s / 26), 2.2 * (1 - s / 26)); }   // 电子拖尾
      addPts(i, rp, ring); N[i].spin.push([ring, 'z', 1.6 + k * .45]); });
  }
  { // 2 化学：苯环（碳 6 + 氢 6，单双键交替）
    const i = 2, l = LV[i], pb = new PB(), nb = Math.round(46 * Math.max(.5, K)); halo(i, pb, l.r);
    const C6 = [], H6 = [];
    for (let k = 0; k < 6; k++) { const a = k / 6 * 6.2832 + .52; C6.push([.52 * Math.cos(a), .52 * Math.sin(a), 0]); H6.push([.98 * Math.cos(a), .98 * Math.sin(a), 0]); }
    C6.forEach((c, k) => { pb.ball(c[0], c[1], c[2], .12, nb, l.c, .055, 2.4); pb.ball(H6[k][0], H6[k][1], H6[k][2], .07, Math.round(nb * .5), [.9, .92, 1], .04, 1.4);
      const n = C6[(k + 1) % 6]; pb.line(c, n, 14, l.c, .035, 1.4);
      if (k % 2 === 0) { const s = .82; pb.line([c[0] * s, c[1] * s, 0], [n[0] * s, n[1] * s, 0], 12, [1, .85, .6], .03, 1.1); }
      pb.line(c, H6[k], 10, [.9, .8, .7], .028, 1); });
    const m = new THREE.Group(); m.rotation.set(-.5, 0, 0); N[i].g.add(m); addPts(i, pb, m); N[i].spin.push([m, 'z', .25]);
  }
  { // 3 生命：DNA 双螺旋
    const i = 3, l = LV[i], pb = new PB(), n = Math.round(260 * Math.max(.5, K)); halo(i, pb, l.r);
    const H = 1.15, rr = .42, BASE = [[1, .45, .5], [.45, .7, 1], [1, .85, .35], [.5, 1, .7]];
    for (let s = 0; s < n; s++) { const t = s / n * 2 - 1, a = t * 7.5;
      pb.add(rr * Math.cos(a), t * H, rr * Math.sin(a), l.c, .055, 1.8); pb.add(rr * Math.cos(a + Math.PI), t * H, rr * Math.sin(a + Math.PI), [.55, .9, 1], .055, 1.6); }
    for (let r = 0; r < 22; r++) { const t = r / 21 * 2 - 1, a = t * 7.5, A = [rr * Math.cos(a), t * H, rr * Math.sin(a)], B = [-A[0], A[1], -A[2]];
      pb.line(A, B, 9, BASE[r % 4], .03, .9); }
    const d = new THREE.Group(); d.rotation.z = .18; N[i].g.add(d); addPts(i, pb, d); N[i].spin.push([d, 'y', .55]);
  }
  { // 4 认知：心智环结（三叶结粒子流）
    const i = 4, l = LV[i], pb = new PB(), n = Math.round(2600 * Math.max(.4, K)); halo(i, pb, l.r);
    const R3 = rng(5);
    for (let s = 0; s < n; s++) { const t = s / n * 6.2832, p = 2, q = 3, r0 = .55 + .22 * Math.cos(q * t);
      const x = r0 * Math.cos(p * t), y = r0 * Math.sin(p * t), z = .22 * Math.sin(q * t);
      const j = .07 * Math.sqrt(R3()), ja = R3() * 6.28; const c = s % 9 === 0 ? [1, .95, .8] : l.c;
      pb.add(x + j * Math.cos(ja), y + j * Math.sin(ja), z + (R3() - .5) * .08, c, .03 + R3() * .03, s % 9 === 0 ? 2 : 1.1); }
    const g = new THREE.Group(); g.rotation.x = .9; N[i].g.add(g); addPts(i, pb, g); N[i].spin.push([g, 'z', .3]);
  }
  let net = null;
  { // 5 智能：四层神经网络 + 信号脉冲
    const i = 5, l = LV[i], pb = new PB(); halo(i, pb, l.r);
    const L = [3, 5, 5, 2], P = [];
    L.forEach((nn, a) => { const x = (a / (L.length - 1) - .5) * 1.7; const col_ = []; for (let b = 0; b < nn; b++) { const y = (b / (nn - 1 || 1) - .5) * (nn - 1) * .3; col_.push([x, y, (a % 2 ? .12 : -.12)]); pb.ball(x, y, col_[b][2], .06, 18, a === 3 ? W2 : l.c, .05, 2); } P.push(col_); });
    const E = [], ep = [];
    for (let a = 0; a < L.length - 1; a++) P[a].forEach(u => P[a + 1].forEach(v => { E.push([u, v]); ep.push(u[0], u[1], u[2], v[0], v[1], v[2]); }));
    const ng = new THREE.Group(); ng.rotation.y = -.35; N[i].g.add(ng);
    const eg = new THREE.BufferGeometry(); eg.setAttribute('position', new THREE.Float32BufferAttribute(ep, 3)); addLines(i, eg, l.color, .55, ng);
    addPts(i, pb, ng);
    const NS = 22, sp = new PB(); for (let s = 0; s < NS; s++) sp.add(0, 0, 0, [.8, 1, 1], .13, 3.5);
    const sPts = addPts(i, sp, ng); const R4 = rng(9);
    net = { E, sig: Array.from({ length: NS }, () => ({ e: Math.floor(R4() * E.length), t: R4(), v: .6 + R4() * .8 })), pos: sPts.geometry.attributes.position, R: R4, L, P };
  }
  { // 6 天文：旋涡星系（两条主旋臂 + 星团 + 暗尘带）
    const i = 6, l = LV[i], pb = new PB(), n = Math.round(14000 * K), R5 = rng(77); halo(i, pb, l.r * .7);
    const gs = () => { let u = 0; for (let k = 0; k < 4; k++) u += R5(); return (u - 2) / 2; };
    for (let s = 0; s < n; s++) {
      const arm = s % 2, rr = Math.pow(R5(), 1.5) * l.r, th = arm * Math.PI + rr * 2.7 + gs() * (.55 * (1 - rr / l.r) + .18);
      const x = rr * Math.cos(th), z = rr * Math.sin(th), y = gs() * .09 * (1.2 - rr / l.r);
      const core = Math.exp(-rr * 2.4); const hii = R5() < .025;
      const c = hii ? [1, .45, .75] : [.62 + .38 * core, .6 + .32 * core, 1 - .25 * core];
      pb.add(x, y, z, c, hii ? .07 : .022 + R5() * .03, hii ? 2.2 : .75 + 1.8 * core);
    }
    pb.ball(0, 0, 0, .14, 120, [1, .9, .75], .06, 3);
    const g = new THREE.Group(); g.rotation.set(1.12, 0, -.18); N[i].g.add(g); addPts(i, pb, g, 1, 1.1); N[i].spin.push([g, 'y', -.05]);
  }
  LV.forEach((l, i) => { N[i].g.position.set(l.x, l.y, 0); scene.add(N[i].g); });

  /* ---------- 第八颗星：双线八芒星线框（等你来造） ---------- */
  const star = new THREE.Group(); star.position.set(0, STAR_Y, 0); scene.add(star);
  const starMats = [];
  [[.85, .36, 2.2], [.95, .41, .9]].forEach(([ro, ri, k]) => { const p = []; for (let s = 0; s < 16; s++) { const a = s / 16 * 6.2832 + Math.PI / 2, r = s % 2 ? ri : ro, b = (s + 1) / 16 * 6.2832 + Math.PI / 2, r2 = (s + 1) % 2 ? ri : ro;
    p.push(r * Math.cos(a), r * Math.sin(a), 0, r2 * Math.cos(b), r2 * Math.sin(b), 0); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); geos.push(g);
    const m = new THREE.LineBasicMaterial({ color: new THREE.Color(1, 1, 1).multiplyScalar(k), ...ADD }); mats.push(m); starMats.push([m, k]); star.add(new THREE.LineSegments(g, m)); });
  const sp8 = new PB(); sp8.add(0, 0, 0, W2, .35, 5); sp8.add(0, 0, 0, [.8, .75, 1], 2.4, .12); for (let s = 0; s < 8; s++) { const a = s / 8 * 6.2832 + Math.PI / 2; sp8.add(.85 * Math.cos(a), .85 * Math.sin(a), 0, W2, .09, 3); }
  const g8 = sp8.geo(); geos.push(g8); const m8 = ptMat(1, 1.5); star.add(new THREE.Points(g8, m8));

  /* ---------- 尘埃（引力井） ---------- */
  const ND = Math.round(4200 * K), dB = new Float32Array(ND * 3), dS = new Float32Array(ND), R6 = rng(31);
  for (let s = 0; s < ND; s++) { const a = R6() * 6.28, r = Math.pow(R6(), .7) * 7; dB[s * 3] = Math.cos(a) * r * 1.1; dB[s * 3 + 1] = R6() * (TOP + 3.5) - 1.5; dB[s * 3 + 2] = Math.sin(a) * r * .6 - 1; dS[s] = R6(); }
  const dGeo = new THREE.BufferGeometry(); dGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(ND * 3), 3)); dGeo.setAttribute('aB', new THREE.BufferAttribute(dB, 3)); dGeo.setAttribute('aSd', new THREE.BufferAttribute(dS, 1)); geos.push(dGeo);
  const UM = new THREE.Vector3(0, -50, 0);
  const dMat = new THREE.ShaderMaterial({ uniforms: { uT: U.uT, uPx: U.uPx, uM: { value: UM }, uMs: { value: 0 }, uK: { value: 1 } }, vertexShader: DUST_VERT, fragmentShader: PT_FRAG, ...ADD }); mats.push(dMat);
  const dust = new THREE.Points(dGeo, dMat); dust.frustumCulled = false; scene.add(dust);

  /* ---------- 标签（真实链接，可键盘访问） ---------- */
  const lab = document.createElement('div'); lab.className = 'p3nl'; host.appendChild(lab);
  const LA = LV.map((l, i) => { const a = document.createElement('a'); a.href = l.href; a.style.setProperty('--c', l.color); a.className = l.x < 0 ? 'l' : 'r';
    a.innerHTML = '<i>0' + (i + 1) + ' · ' + (en ? l.f[1] : l.f[0]) + '</i><b></b>'; a.querySelector('b').textContent = l.name; lab.appendChild(a);
    a.addEventListener('pointerenter', () => { hov = i; }); a.addEventListener('pointerleave', () => { if (hov === i) hov = -1; }); a.addEventListener('focus', () => { hov = i; }); a.addEventListener('blur', () => { if (hov === i) hov = -1; });
    return a; });
  const L8 = document.createElement('span'); L8.className = 'r s8'; L8.innerHTML = '<i>08 · ' + (en ? 'Yours' : '由你来造') + '</i><b>' + (en ? 'The eighth star' : '第八颗星') + '</b>'; lab.appendChild(L8);

  /* ---------- 后期 ---------- */
  let rt = null, mipsD = [], mipsU = [], downMat, upMat, compMat, fsScene, fsCam, fsMesh;
  function buildPost() {
    disposePost();
    rt = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, samples: T.msaa, depthBuffer: true });
    const mk = () => new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, depthBuffer: false });
    for (let i = 0; i < T.mips; i++) { mipsD.push(mk()); mipsU.push(mk()); }
    downMat = new THREE.ShaderMaterial({ uniforms: { tSrc: { value: null }, uTx: { value: new THREE.Vector2() }, uFirst: { value: 0 } }, vertexShader: FS_VERT, fragmentShader: DOWN_FRAG, depthTest: false, depthWrite: false });
    upMat = new THREE.ShaderMaterial({ uniforms: { tLow: { value: null }, tHigh: { value: null }, uTx: { value: new THREE.Vector2() }, uMix: { value: .66 } }, vertexShader: FS_VERT, fragmentShader: UP_FRAG, depthTest: false, depthWrite: false });
    compMat = new THREE.ShaderMaterial({ uniforms: { tScene: { value: null }, tBloom: { value: null }, uBloom: { value: .16 }, uExp: { value: 1.0 }, uT: U.uT, uAsp: U.uAsp, uFade: { value: 1 }, uCA: { value: tierName === 'high' ? .0025 : 0 } }, vertexShader: FS_VERT, fragmentShader: COMP_FRAG, depthTest: false, depthWrite: false });
    fsScene = new THREE.Scene(); fsCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1); fsMesh = new THREE.Mesh(fsGeo, compMat); fsMesh.frustumCulled = false; fsScene.add(fsMesh);
    sizePost();
  }
  function disposePost() { if (rt) rt.dispose(); mipsD.concat(mipsU).forEach(r => r.dispose()); mipsD = []; mipsU = []; rt = null; [downMat, upMat, compMat].forEach(m => m && m.dispose()); downMat = upMat = compMat = null; }
  let bw = 1, bh = 1;
  function sizePost() { if (!rt) return; rt.setSize(bw, bh); let w = bw, h = bh; for (let i = 0; i < mipsD.length; i++) { w = Math.max(1, w >> 1); h = Math.max(1, h >> 1); mipsD[i].setSize(w, h); mipsU[i].setSize(w, h); } }
  function pass(mat, target) { fsMesh.material = mat; renderer.setRenderTarget(target); renderer.render(fsScene, fsCam); }

  /* ---------- 取景 ---------- */
  let scale = 1, cssW = 1, cssH = 1, portrait = false, fullD = 30, fullY = 8;
  function layout(asp) {
    portrait = asp < .9;
    const H = TOP + (portrait ? 11 : 5.2), Wd = portrait ? 12.5 : 10.5;               // 需要装下的世界高度 / 宽度
    fullD = Math.max(H / (2 * TAN), Wd / (2 * TAN * asp)) * (portrait ? 1.0 : 1.02);
    fullY = (TOP - 1.4) * .5 + (portrait ? -.2 : .9);
  }
  function resize() {
    cssW = Math.max(1, host.clientWidth); cssH = Math.max(1, host.clientHeight);
    const dpr = Math.min(window.devicePixelRatio || 1, T.dpr, Math.sqrt(T.budget / (cssW * cssH))) * scale;
    renderer.setPixelRatio(Math.max(.35, dpr)); renderer.setSize(cssW, cssH, false);
    const v = renderer.getDrawingBufferSize(new THREE.Vector2()); bw = v.x; bh = v.y;
    camera.aspect = cssW / cssH; camera.updateProjectionMatrix(); U.uAsp.value = camera.aspect;
    U.uPx.value = bh / (2 * TAN);
    layout(camera.aspect); sizePost();
  }
  let fAcc = 0, fN = 0, warm = 0, slow = 0, lastChange = 0, longN = 0;
  function govern(raw, now) {
    warm += raw; if (warm < 3 || document.hidden || NOFPS) return;
    let fps;
    if (raw > .25) { if (++longN < 3) return; fps = 1 / raw; longN = 0; fAcc = 0; fN = 0; }
    else { longN = 0; fAcc += SLOW ? 1 / 12 : raw; fN++; if (fAcc < 1.5) return; fps = fN / fAcc; fAcc = 0; fN = 0; }
    S.fps = fps;
    if (now - lastChange < 2500) return;
    if (fps < 45) {
      if (scale > .56) { scale = Math.max(.55, scale - .12); lastChange = now; resize(); }
      else if (tierName !== 'low' && ++slow >= 3) { slow = 0; setTier(lower(tierName), true); lastChange = now; }
    } else { slow = 0; if (fps > 58 && scale < 1) { scale = Math.min(1, scale + .05); lastChange = now; resize(); } }
  }
  function setTier(n, auto) {
    if (!TIERS[n]) return;
    tierName = n; T = TIERS[n]; scale = 1; slow = 0; fAcc = 0; fN = 0; longN = 0; lastChange = performance.now(); S.tier = n; buildPost(); resize();
    try { dispatchEvent(new CustomEvent('p3q:tier', { detail: { tier: n, auto: !!auto } })); } catch (e) {}
  }

  /* ---------- 交互 ---------- */
  const mouse = new THREE.Vector2(), par = new THREE.Vector2(), mPx = new THREE.Vector2(-1e4, -1e4);
  let hov = -1, mIn = 0, mOn = false;
  const SCR = LV.map(() => ({ x: -1e4, y: 0, r: 0 })), scr8 = { x: -1e4, y: 0, r: 0 };
  function onMove(e) {
    mouse.set(e.clientX / window.innerWidth * 2 - 1, e.clientY / window.innerHeight * 2 - 1);
    const b = canvas.getBoundingClientRect(); mPx.set(e.clientX - b.left, e.clientY - b.top); mOn = true;
    if (e.target === canvas) { let best = -1, bd = 1e9; SCR.forEach((s, i) => { const d = Math.hypot(mPx.x - s.x, mPx.y - s.y); if (d < s.r * 1.25 + 26 && d < bd) { bd = d; best = i; } }); hov = best; canvas.style.cursor = best >= 0 ? 'pointer' : ''; }
  }
  function onLeave() { mOn = false; if (document.activeElement && document.activeElement.parentNode === lab) return; hov = -1; }
  function onClick(e) { if (e.target !== canvas || hov < 0) return; location.href = LV[hov].href; }
  function onTilt(e) { if (e.gamma == null) return; mouse.set(Math.max(-1, Math.min(1, e.gamma / 25)), Math.max(-1, Math.min(1, ((e.beta || 0) - 50) / 25))); }
  function onVis() { if (document.hidden) { cancelAnimationFrame(raf); raf = 0; } else if (!raf && S && !still) { last = performance.now(); raf = requestAnimationFrame(frame); } }
  function onLost(e) { e.preventDefault(); stop(); }
  window.addEventListener('pointermove', onMove, { passive: true });
  host.addEventListener('pointerleave', onLeave);
  canvas.addEventListener('click', onClick);
  window.addEventListener('deviceorientation', onTilt, { passive: true });
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', onVis);
  canvas.addEventListener('webglcontextlost', onLost);

  /* ---------- 动画 ---------- */
  const INTRO = 6.2;
  const still = !!opts.still;
  let raf = 0, last = performance.now(), t = still ? INTRO + 3 : 0, frames = 0, frozen = still;
  try { const m = /[?&]p3t=(\d+(?:\.\d+)?)/.exec(location.search); if (m) { t = +m[1]; frozen = true; } } catch (e) {}
  const tmp = new THREE.Vector3(), aim = new THREE.Vector3(), camR = new THREE.Vector3(), ray = new THREE.Vector3();
  let hi = LV.map(() => 0), focus = new THREE.Vector3(0, 8, 0), focusK = 0;
  function animate(dt) {
    U.uT.value = t;
    const g = eio((t - .3) / (INTRO - 1.2));
    U.uGrow.value = -1 + g * (TOP + 1.5);
    LV.forEach((l, i) => {
      const a = ease((U.uGrow.value - l.y + .4) / 1.4);
      N[i].g.scale.setScalar(.001 + a * SC[i] * (1 + .03 * Math.sin(t * 1.1 + i)));
      N[i].g.visible = a > .002;
      N[i].spin.forEach(([o, ax, w]) => { o.rotation[ax] += w * dt; });
      const target = hov === i ? 1 : 0; hi[i] += (target - hi[i]) * Math.min(1, dt * 5 || 1);
      N[i].mats.forEach(m => { if (m.lb) m.lb.color.set(m.hex).multiplyScalar(m.base * (1 + 1.2 * hi[i]) * a); else m.uniforms.uHi.value = hi[i]; });
      LA[i].classList.toggle('on', a > .6); LA[i].classList.toggle('hv', hov === i);
    });
    const s8 = ease((U.uGrow.value - STAR_Y + .3) / 1.0);
    star.scale.setScalar(.001 + s8); star.visible = s8 > .002; star.rotation.z = Math.sin(t * .25) * .25; star.rotation.y = t * .3;
    const br = .65 + .35 * Math.sin(t * 1.6);
    starMats.forEach(([m, k]) => m.color.setScalar(k * (.6 + .6 * br) * s8)); m8.uniforms.uK.value = (.7 + .5 * br) * s8;
    L8.classList.toggle('on', s8 > .6);
    // 神经网络信号
    if (net) { const p = net.pos; net.sig.forEach((s, k) => { s.t += dt * s.v * 1.4; if (s.t >= 1) { s.t = 0; const e = net.E[s.e], end = e[1]; const nxt = []; net.E.forEach((f, j) => { if (f[0] === end) nxt.push(j); }); s.e = nxt.length ? nxt[Math.floor(net.R() * nxt.length)] : Math.floor(net.R() * net.L[0] * net.L[1]); }
      const e = net.E[s.e]; p.setXYZ(k, e[0][0] + (e[1][0] - e[0][0]) * s.t, e[0][1] + (e[1][1] - e[0][1]) * s.t, e[0][2] + (e[1][2] - e[0][2]) * s.t); }); p.needsUpdate = true; }
    mIn += ((mOn ? 1 : 0) - mIn) * Math.min(1, dt * 3 || 1); dMat.uniforms.uMs.value = mIn * (.8 + .2 * Math.sin(t * 2));
    budPts.material.uniforms.uK.value = .6 + .4 * ease((U.uGrow.value) / TOP);
  }
  function placeCamera(dt) {
    par.lerp(mouse, Math.min(1, dt * 2.2 || 1)); U.uPar.value.set(par.x, -par.y);
    const ci = eio((t - .2) / INTRO);
    const fd = hov >= 0 ? 1 : 0; focusK += (fd - focusK) * Math.min(1, dt * 1.8 || 1);
    if (hov >= 0) focus.lerp(tmp.set(LV[hov].x, LV[hov].y, 0), Math.min(1, dt * 3 || 1));
    const D0 = 7.5, D = (D0 + (fullD - D0) * ci) * (1 - .1 * focusK) * (1 + .012 * Math.sin(t * .13));
    const Y = (.2 + (fullY - .2) * ci);
    aim.set(par.x * .4 * ci + (focus.x * .25) * focusK, Y + (focus.y - Y) * .22 * focusK, 0);
    const az = (1 - ci) * .9 + Math.sin(t * .05) * .14 + par.x * .2, el = .12 + (1 - ci) * .25 - par.y * .08;
    camera.position.set(aim.x + Math.sin(az) * Math.cos(el) * D, aim.y - Math.sin(el) * D * .55, Math.cos(az) * Math.cos(el) * D);
    camera.lookAt(aim); camera.updateMatrixWorld();
    // 鼠标落在 z=0 平面的位置 → 尘埃引力井
    ray.set(mPx.x / cssW * 2 - 1, -(mPx.y / cssH * 2 - 1), .5).unproject(camera).sub(camera.position).normalize();
    if (Math.abs(ray.z) > 1e-3) { const k = -camera.position.z / ray.z; UM.copy(camera.position).addScaledVector(ray, k); }
    // 屏幕投影 → 标签位置与悬停半径
    camR.setFromMatrixColumn(camera.matrixWorld, 0);
    const proj = (p, r, o) => { tmp.copy(p).project(camera); o.x = (tmp.x * .5 + .5) * cssW; o.y = (-tmp.y * .5 + .5) * cssH; const d = camera.position.distanceTo(p); o.r = r / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * d) * cssH; };
    LV.forEach((l, i) => { proj(N[i].g.position, l.r * SC[i] * (i === 6 ? .7 : .85), SCR[i]); const s = SCR[i], a = LA[i], side = a.className.indexOf('l') === 0 ? -1 : 1;
      a.style.transform = 'translate(' + (s.x + side * (s.r + 14)).toFixed(1) + 'px,' + s.y.toFixed(1) + 'px)'; });
    proj(star.position, .95, scr8); L8.style.transform = 'translate(' + (scr8.x + scr8.r + 14).toFixed(1) + 'px,' + scr8.y.toFixed(1) + 'px)';
  }
  function render(dt) {
    if (!frozen) t += dt;
    animate(frozen && !frames ? 1 / 60 : dt); placeCamera(dt || 1 / 60);
    renderer.setRenderTarget(rt); renderer.clear(); renderer.render(scene, camera);
    let src = rt.texture, w = bw, h = bh;
    for (let i = 0; i < mipsD.length; i++) { downMat.uniforms.tSrc.value = src; downMat.uniforms.uTx.value.set(1 / w, 1 / h); downMat.uniforms.uFirst.value = i === 0 ? 1 : 0; pass(downMat, mipsD[i]); src = mipsD[i].texture; w = Math.max(1, w >> 1); h = Math.max(1, h >> 1); }
    let low = mipsD[mipsD.length - 1].texture;
    for (let i = mipsD.length - 2; i >= 0; i--) { const lw = mipsD[i + 1].width, lh = mipsD[i + 1].height; upMat.uniforms.tLow.value = low; upMat.uniforms.tHigh.value = mipsD[i].texture; upMat.uniforms.uTx.value.set(1 / lw, 1 / lh); pass(upMat, mipsU[i]); low = mipsU[i].texture; }
    compMat.uniforms.tScene.value = rt.texture; compMat.uniforms.tBloom.value = low;
    compMat.uniforms.uFade.value = Math.min(1, t / .8);
    pass(compMat, null);
    frames++;
  }
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const raw = (now - last) / 1000; last = now;
    render(Math.min(raw, .1));
    if (frames === 2) { canvas.classList.add('on'); host.classList.add('gl'); }
    if (!frozen) govern(raw, now);
  }
  function stop() {
    if (!S) return; cancelAnimationFrame(raf); raf = 0;
    window.removeEventListener('pointermove', onMove); host.removeEventListener('pointerleave', onLeave); canvas.removeEventListener('click', onClick);
    window.removeEventListener('deviceorientation', onTilt); window.removeEventListener('resize', resize);
    document.removeEventListener('visibilitychange', onVis); canvas.removeEventListener('webglcontextlost', onLost);
    disposePost(); geos.forEach(g => g.dispose()); mats.forEach(m => m.dispose()); fsGeo.dispose(); bg.material.dispose();
    renderer.dispose(); try { renderer.forceContextLoss(); } catch (e) {}
    lab.remove(); canvas.classList.remove('on'); host.classList.remove('gl'); S = null; window.__p3dbg = null;
  }
  function pause() { cancelAnimationFrame(raf); raf = 0; document.removeEventListener('visibilitychange', onVis); }
  S = { stop, pause, setTier: n => setTier(n, false), tier: tierName, gpu: pick.gpu, fps: 0, get ready() { return t > INTRO + .5; } };
  buildPost(); resize();
  try { renderer.compile(scene, camera); } catch (e) {}
  window.__p3dbg = { S, renderer, scene, camera, render, step: (dt, n) => { for (let i = 0; i < (n || 1); i++) render(dt); }, setT: v => { t = v; }, freeze: v => { frozen = v !== false; }, hover: i => { hov = i; } };
  if (still) { render(0); render(0); canvas.classList.add('on'); host.classList.add('gl'); }
  else raf = requestAnimationFrame(frame);
  dispatchEvent(new CustomEvent('p3q:tier', { detail: { tier: tierName } }));
  return S;
}
export function stop() { if (S) S.stop(); }
export function setQuality(n) { if (S) { S.setTier(n); return true; } return false; }
export function tier() { return S ? S.tier : null; }
export function pause() { if (S) S.pause(); }
