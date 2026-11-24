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
  high:   { dpr: 1.5,  msaa: 4, mips: 6, k: 1,   budget: 3.2e6, refl: .5 },
  medium: { dpr: 1.25, msaa: 2, mips: 5, k: .6,  budget: 2.0e6, refl: .34 },
  low:    { dpr: .9,   msaa: 0, mips: 4, k: .32, budget: 9e5,   refl: 0 },
};

/* 七层（自下而上）：id 对应页面 WORLDS */
const LV = [
  { id: '01', f: ['数学', 'Math'],       y: 0,    x: 0,     r: 1.15 },
  { id: '02', f: ['物理', 'Physics'],    y: 2.25, x: -3.1,  r: .95 },
  { id: '03', f: ['化学', 'Chemistry'],  y: 4.5,  x: 2.95,  r: 1.0 },
  { id: '04', f: ['生命', 'Life'],       y: 6.75, x: -2.85, r: 1.05 },
  { id: '06', f: ['认知', 'Mind'],       y: 9.0,  x: 2.8,   r: 1.0 },
  { id: '05', f: ['智能', 'Intelligence'], y: 11.25, x: -2.4, r: 1.05 },
  { id: '07', f: ['天文', 'Cosmos'],     y: 13.9, x: 0,     r: 2.2 },
];
const STAR_Y = 16.9, TOP = 17.6, WY = -1.1;   // WY：树根下的水面高度（11-16 第四步）
const SC = [1.5, 2.1, 2.0, 1.85, 1.85, 1.9, 1.6];   // 各层形态放大（形态按单位尺寸建模；第四步整体放大约 15%）
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

/* 11-16 第四步 · 树根下的暗色水面：环形涟漪（从树根一圈圈荡开）+ 倒影（中/高档：低分辨率镜像渲染；低档：光柱假倒影）。减少动态：无涟漪 */
const WATER_VERT = `uniform mat4 uTM; varying vec4 vR; varying vec3 vW;
void main(){ vec4 w = modelMatrix*vec4(position,1.); vW = w.xyz; vR = uTM*w; gl_Position = projectionMatrix*viewMatrix*w; }`;
const WATER_FRAG = `uniform sampler2D tRefl; uniform float uT, uHasR, uRip, uGrow, uDisp, uMT; uniform vec2 uMP; uniform vec3 uGlow, uGlow2; varying vec4 vR; varying vec3 vW;
void main(){
  vec2 d = vW.xz; float r = length(d) + 1e-4; vec2 dn = d/r;
  float dh = 0., ring = 0.;
  for (int i = 0; i < 4; i++) {
    float R0 = mod(uT*1.1 + float(i)*3.6, 14.4);
    float w = r - R0, a = exp(-w*w*1.6)*(1. - R0/14.4)*smoothstep(0., 1.2, R0);
    dh += cos(w*4.6)*a; ring += pow(max(0., sin(w*4.6 + 1.57)), 3.)*a;
  }
  dh += cos(r*2.2 - uT*1.7)*.22*exp(-r*.2);
  vec2 pn = vec2(0.);
  if (uDisp > .5) { vec2 pd = vW.xz - uMP; float pr = length(pd) + 1e-4, ag = uT - uMT, pw = pr - ag*3.2, pa = exp(-pw*pw*2.)*exp(-ag*.9)*step(0., ag)*1.4;   // 指针扰动涟漪（high）
    pn = pd/pr*cos(pw*5.)*pa; ring += pow(max(0., sin(pw*5. + 1.57)), 3.)*pa*.8; }
  vec2 nn = dn*dh*.7 + pn*.9 + vec2(sin(vW.x*2.1 + uT*.8) + sin(vW.z*3.3 - uT*.6 + vW.x), cos(vW.z*2.5 + uT*.7) + cos(vW.x*1.6 - uT*.5))*.09;
  nn *= uRip; ring *= uRip;
  vec3 V = normalize(cameraPosition - vW);
  float fres = .3 + .7*pow(1. - max(V.y, 0.), 3.);
  float ed = length(vW.xz - cameraPosition.xz);
  vec3 c = vec3(.005, .004, .014);
  if (uHasR > .5) {
    vec2 uv = vR.xy/vR.w + nn*.012;
    if (uDisp > .5) { vec2 o = nn*.006 + (uv - .5)*.004;   // high：轻微折射 + 边缘色散（RGB 分离取样）
      c += vec3(texture2D(tRefl, uv + o).r, texture2D(tRefl, uv).g, texture2D(tRefl, uv - o).b)*fres*.62; }
    else c += texture2D(tRefl, uv).rgb*fres*.62;
  } else {
    vec2 tc = normalize(cameraPosition.xz + 1e-4); float along = dot(d, tc), side = abs(d.x*tc.y - d.y*tc.x) + nn.x*.35;
    c += mix(uGlow, uGlow2, smoothstep(0., 8., along))*exp(-side*side*.7)*smoothstep(-1.5, 3., along)*exp(-max(along, 0.)*.1)*.32*fres*uGrow;
  }
  vec3 rc = mix(uGlow, uGlow2, .5 + .5*sin(r*.45 - uT*.3));
  c += rc*ring*.3*exp(-r*.13)*uGrow;
  c += uGlow*exp(-r*r*.05)*.12*uGrow;
  gl_FragColor = vec4(c, smoothstep(120., 46., ed)*smoothstep(.015, .11, V.y));   // 远处与掠射角渐隐，水天交界不起硬边
}`;
/* 粒子升起成树：数千颗光点从水面升起，沿主干、枝梢、七层形态聚成整棵树的光晕（数量按档位缩放） */
const AURA_VERT = `attribute vec3 aS, aCol; attribute float aSd; uniform float uT, uPx, uK, uGo; varying vec3 vC;
void main(){
  float dl = position.y/${TOP.toFixed(1)}*3.2 + fract(aSd*13.7)*1.1;
  float k = clamp((uGo - dl)/2.3, 0., 1.), e = 1. - pow(1. - k, 3.);
  vec3 p = mix(aS, position, e);
  p.xz += vec2(cos(aSd*40. + e*7.), sin(aSd*40. + e*7.))*(1. - e)*.7;
  p += vec3(sin(uT*.5 + aSd*31.), sin(uT*.37 + aSd*17.)*.7, cos(uT*.41 + aSd*23.))*.07*e;
  vec4 mv = modelViewMatrix*vec4(p,1.); gl_Position = projectionMatrix*mv;
  float s = (.028 + fract(aSd*7.1)*.05)*uPx/-mv.z; gl_PointSize = max(s, 1.2);
  float kk = s < 1.2 ? s/1.2 : 1.;
  float tw = .6 + .4*sin(uT*(1. + aSd*2.) + aSd*50.);
  vC = aCol*uK*kk*kk*tw*step(.001, k)*(.5 + .5*e + (1. - e)*1.2); }`;

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
  const camera = new THREE.PerspectiveCamera(42, 1, .1, 400);
  const TAN = Math.tan(THREE.MathUtils.degToRad(21));
  const U = { uT: { value: 0 }, uAsp: { value: 1 }, uPar: { value: new THREE.Vector2() }, uGrow: { value: -1 }, uPx: { value: 500 } };
  const fsGeo = new THREE.PlaneGeometry(2, 2);
  const bg = new THREE.Mesh(fsGeo, new THREE.ShaderMaterial({ uniforms: { uT: U.uT, uAsp: U.uAsp, uPar: U.uPar }, vertexShader: BG_VERT, fragmentShader: BG_FRAG, depthWrite: false, depthTest: false }));
  bg.frustumCulled = false; bg.renderOrder = -10; scene.add(bg);
  const geos = [], mats = [];
  const ADD = { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending };
  function ptMat(k, min) { const m = new THREE.ShaderMaterial({ uniforms: { uPx: U.uPx, uT: U.uT, uHi: { value: 0 }, uK: { value: k || 1 }, uMin: { value: min || 1.5 } }, vertexShader: PT_VERT, fragmentShader: PT_FRAG, ...ADD }); mats.push(m); return m; }

  /* ---------- 枝干：主干穿过七层 + 每层侧枝（越往上越多）+ 根须 ---------- */
  const R = rng(20251115), tubes = [], twigC = [];
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
    const cv = new THREE.CatmullRomCurve3(pts); twigC.push(cv);
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
      twig(o, d, (.9 + R() * .9 + i * .08) * 1.3, .02, i > 1 ? 1 : 0);
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
    // 3.0 收尾（11-24）：原先轨道点 .03/1.1、核子 .045/1.8，远景下点径低于 uMin 被按面积减亮，整层发灰。
    // 提亮到与化学层碳原子（.055/2.4）同级、单点亮度系数不超过它：核子 .068/2.4（核半径 .085）、轨道 .055/1.7、电子拖尾 ×1.25、核心加一枚暖光晕 .42/1.1；悬停倍率与 bloom 上限（60）不变。
    const i = 1, l = LV[i], pb = new PB(); halo(i, pb, l.r);
    const R2 = rng(11); for (let k = 0; k < 12; k++) { const u = R2() * 2 - 1, a = R2() * 6.28, q = Math.sqrt(1 - u * u), rr = .16 * Math.cbrt(R2());
      pb.ball(rr * q * Math.cos(a), rr * u, rr * q * Math.sin(a), .085, Math.round(34 * Math.max(.5, K)), k % 2 ? [1, .55, .3] : l.c, .068, 2.4); }
    pb.add(0, 0, 0, [1, .8, .62], .42, 1.1);   // 核心暖光晕（3.0 收尾）：让原子核在远景里也读得出
    addPts(i, pb);
    const tilt = [[0, 0, 0], [1.05, 0, .5], [-1.05, 0, -.5]];
    tilt.forEach((tl, k) => { const og = new THREE.Group(); og.rotation.set(Math.PI / 2 + tl[0], tl[1], tl[2]); N[i].g.add(og);
      const ring = new THREE.Group(); og.add(ring); const rp = new PB(), rr = l.r * (.78 + k * .05), nr = Math.round(240 * Math.max(.5, K));
      for (let s = 0; s < nr; s++) { const a = s / nr * 6.2832; rp.add(rr * Math.cos(a), rr * Math.sin(a), 0, l.c, .055, 1.7); }
      rp.add(rr, 0, 0, W2, .22, 5); rp.add(rr, 0, 0, l.c, .7, .45);
      for (let s = 1; s < 26; s++) { const a = -s * .022; rp.add(rr * Math.cos(a), rr * Math.sin(a), 0, l.c, .08 * (1 - s / 26), 2.75 * (1 - s / 26)); }   // 电子拖尾
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

  /* ---------- 11-16 第四步：水面（环形涟漪 + 倒影） ---------- */
  const wTM = new THREE.Matrix4(), reflCam = new THREE.PerspectiveCamera();
  const wGeo = new THREE.PlaneGeometry(260, 260); wGeo.rotateX(-Math.PI / 2); wGeo.translate(0, WY, 0); geos.push(wGeo);
  const wMat = new THREE.ShaderMaterial({ uniforms: { uT: U.uT, tRefl: { value: null }, uTM: { value: wTM }, uHasR: { value: 0 }, uRip: { value: opts.still ? 0 : 1 }, uGrow: { value: 0 }, uDisp: { value: 0 }, uMP: { value: new THREE.Vector2(0, 0) }, uMT: { value: -99 },
    uGlow: { value: new THREE.Color(LV[0].color) }, uGlow2: { value: new THREE.Color(1, .78, .45) } }, vertexShader: WATER_VERT, fragmentShader: WATER_FRAG, transparent: true, depthWrite: false, depthTest: false });
  mats.push(wMat);
  const water = new THREE.Mesh(wGeo, wMat); water.renderOrder = -5; water.frustumCulled = false; scene.add(water);

  /* ---------- 粒子升起成树（光晕） ---------- */
  const NA = Math.round(7000 * K), aT = [], aS = [], aC = [], aD = [], R7 = rng(4242), tv = new THREE.Vector3();
  for (let s = 0; s < NA; s++) {
    const u = R7();
    if (u < .42) { trunk.getPoint(Math.pow(R7(), .85), tv); const rr = .12 + .55 * R7() * R7(); const a = R7() * 6.2832; tv.x += Math.cos(a) * rr; tv.z += Math.sin(a) * rr; tv.y += (R7() - .5) * .3; }
    else if (u < .72) { twigC[Math.floor(R7() * twigC.length)].getPoint(R7(), tv); tv.x += (R7() - .5) * .3; tv.y += (R7() - .5) * .3; tv.z += (R7() - .5) * .3; }
    else { const i = Math.floor(R7() * 6.999), l = LV[i], rr = l.r * SC[i] * (i === 6 ? .8 : 1.05) * Math.cbrt(R7()), a = R7() * 6.2832, v = R7() * 2 - 1, q = Math.sqrt(1 - v * v);
      tv.set(l.x + rr * q * Math.cos(a), l.y + rr * v * (i === 6 ? .45 : .9), rr * q * Math.sin(a)); }
    aT.push(tv.x, tv.y, tv.z);
    aS.push(tv.x * .3 + (R7() - .5) * 7, WY + .05, tv.z * .3 + (R7() - .5) * 4);
    const c = colAt(tv.y), b = .45 + R7() * .9; aC.push(c[0] * b, c[1] * b, c[2] * b); aD.push(R7());
  }
  const aGeo = new THREE.BufferGeometry(); aGeo.setAttribute('position', new THREE.Float32BufferAttribute(aT, 3)); aGeo.setAttribute('aS', new THREE.Float32BufferAttribute(aS, 3));
  aGeo.setAttribute('aCol', new THREE.Float32BufferAttribute(aC, 3)); aGeo.setAttribute('aSd', new THREE.Float32BufferAttribute(aD, 1)); geos.push(aGeo);
  const aMat = new THREE.ShaderMaterial({ uniforms: { uT: U.uT, uPx: U.uPx, uK: { value: .62 }, uGo: { value: 0 } }, vertexShader: AURA_VERT, fragmentShader: PT_FRAG, ...ADD }); mats.push(aMat);
  const aura = new THREE.Points(aGeo, aMat); aura.frustumCulled = false; scene.add(aura);

  /* ---------- 叙事末段：第八颗星长成半透明粒子晶体（星形八面体 + 内核二十面体），在「从玩到造」大标题后旋转 ---------- */
  const xtal = new THREE.Group(); xtal.position.set(0, STAR_Y, 0); xtal.visible = false; scene.add(xtal);
  const xIn = new THREE.Group(); xtal.add(xIn);
  { const pb = new PB(), RX = rng(808), V = [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]], VB = V.map(v => v.map(x => -x)), ne = Math.round(70 * Math.max(.5, K)), nf = Math.round(2600 * Math.max(.4, K));
    const gold = [1, .86, .6], lil = [.75, .7, 1], cy = [.55, .9, 1];
    const ep = [];
    [[V, gold], [VB, lil]].forEach(([T4, c]) => {
      for (let a = 0; a < 4; a++) for (let b = a + 1; b < 4; b++) { pb.line(T4[a], T4[b], ne, c, .05, 2.2); ep.push(...T4[a], ...T4[b]); }
      T4.forEach(v => { pb.add(v[0], v[1], v[2], W2, .22, 4); pb.add(v[0], v[1], v[2], c, .9, .12); });
      for (let f = 0; f < nf; f++) { const tri = [0, 1, 2, 3].filter(x => x !== f % 4), A = T4[tri[0]], B = T4[tri[1]], C = T4[tri[2]]; let u = RX(), v = RX(); if (u + v > 1) { u = 1 - u; v = 1 - v; }
        pb.add(A[0] + (B[0] - A[0]) * u + (C[0] - A[0]) * v, A[1] + (B[1] - A[1]) * u + (C[1] - A[1]) * v, A[2] + (B[2] - A[2]) * u + (C[2] - A[2]) * v, RX() < .5 ? c : cy, .02 + RX() * .025, .45); }
    });
    pb.ball(0, 0, 0, .32, Math.round(500 * Math.max(.5, K)), [1, .95, .85], .04, 1.6);
    const g = pb.geo(); geos.push(g); const m = ptMat(.7, 1.2); xIn.add(new THREE.Points(g, m)); xtal.userData.m = m;
    const tg = new THREE.BufferGeometry(); tg.setAttribute('position', new THREE.Float32BufferAttribute(ep, 3)); geos.push(tg);
    const tm = new THREE.LineBasicMaterial({ color: new THREE.Color(1, .88, .7), ...ADD }); mats.push(tm); xIn.add(new THREE.LineSegments(tg, tm)); xtal.userData.tm = tm;
    const ig = new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(.62, 0)); geos.push(ig); const im = new THREE.LineBasicMaterial({ color: new THREE.Color(1, .9, .7), ...ADD }); mats.push(im); xIn.add(new THREE.LineSegments(ig, im)); xtal.userData.im = im; }
  let finT = 0, finK = 0;

  /* ---------- 七层航标：沿树干每层下方一枚发光水晶（八面体线框 + 光核），镜头经过 / 当前层时点亮（思路参考 ThreeUI「Workshop Codex」公开描述，自写） ---------- */
  const bcn = LV.map((l, i) => {
    let best = 0, bd = 1e9; for (let k = 0; k <= 200; k++) { trunk.getPoint(k / 200, tv); const dd = Math.abs(tv.y - (l.y - (i === 0 ? -.2 : 1.05))); if (dd < bd) { bd = dd; best = k / 200; } }
    const g = new THREE.Group(); trunk.getPoint(best, g.position); g.position.z += .35; scene.add(g);
    const eg = new THREE.EdgesGeometry(new THREE.OctahedronGeometry(.2, 0)); geos.push(eg);
    const lm = new THREE.LineBasicMaterial({ color: new THREE.Color(l.color), ...ADD }); mats.push(lm); const ls = new THREE.LineSegments(eg, lm); ls.scale.set(1, 1.6, 1); g.add(ls);
    const pb = new PB(); pb.add(0, 0, 0, W2, .16, 3); pb.add(0, 0, 0, l.c, .9, .18); const pg = pb.geo(); geos.push(pg); const pm = ptMat(1, 1.4); g.add(new THREE.Points(pg, pm));
    return { g, ls, lm, pm, k: 0 };
  });

  /* ---------- 标签（真实链接，可键盘访问） ---------- */
  const lab = document.createElement('div'); lab.className = 'p3nl'; host.appendChild(lab);
  const LA = LV.map((l, i) => { const a = document.createElement('a'); a.href = l.href; a.style.setProperty('--c', l.color); a.className = l.x < 0 ? 'l' : 'r';
    a.innerHTML = '<i>0' + (i + 1) + ' · ' + (en ? l.f[1] : l.f[0]) + '</i><b></b>'; a.querySelector('b').textContent = l.name; lab.appendChild(a);
    a.addEventListener('pointerenter', () => { hov = i; }); a.addEventListener('pointerleave', () => { if (hov === i) hov = -1; }); a.addEventListener('focus', () => { hov = i; }); a.addEventListener('blur', () => { if (hov === i) hov = -1; });
    return a; });
  const L8 = document.createElement('span'); L8.className = 'r s8'; L8.innerHTML = '<i>08 · ' + (en ? 'Yours' : '由你来造') + '</i><b>' + (en ? 'The eighth star' : '第八颗星') + '</b>'; lab.appendChild(L8);

  /* ---------- 后期 ---------- */
  let rt = null, reflRT = null, mipsD = [], mipsU = [], downMat, upMat, compMat, fsScene, fsCam, fsMesh;
  function buildPost() {
    disposePost();
    rt = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, samples: T.msaa, depthBuffer: true });
    if (T.refl) reflRT = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, depthBuffer: false });
    wMat.uniforms.uHasR.value = reflRT ? 1 : 0; wMat.uniforms.uDisp.value = tierName === 'high' && !opts.still ? 1 : 0; wMat.uniforms.tRefl.value = reflRT ? reflRT.texture : null;
    const mk = () => new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, depthBuffer: false });
    for (let i = 0; i < T.mips; i++) { mipsD.push(mk()); mipsU.push(mk()); }
    downMat = new THREE.ShaderMaterial({ uniforms: { tSrc: { value: null }, uTx: { value: new THREE.Vector2() }, uFirst: { value: 0 } }, vertexShader: FS_VERT, fragmentShader: DOWN_FRAG, depthTest: false, depthWrite: false });
    upMat = new THREE.ShaderMaterial({ uniforms: { tLow: { value: null }, tHigh: { value: null }, uTx: { value: new THREE.Vector2() }, uMix: { value: .66 } }, vertexShader: FS_VERT, fragmentShader: UP_FRAG, depthTest: false, depthWrite: false });
    compMat = new THREE.ShaderMaterial({ uniforms: { tScene: { value: null }, tBloom: { value: null }, uBloom: { value: .16 }, uExp: { value: 1.0 }, uT: U.uT, uAsp: U.uAsp, uFade: { value: 1 }, uCA: { value: tierName === 'high' ? .0025 : 0 } }, vertexShader: FS_VERT, fragmentShader: COMP_FRAG, depthTest: false, depthWrite: false });
    fsScene = new THREE.Scene(); fsCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1); fsMesh = new THREE.Mesh(fsGeo, compMat); fsMesh.frustumCulled = false; fsScene.add(fsMesh);
    sizePost();
  }
  function disposePost() { if (rt) rt.dispose(); if (reflRT) { reflRT.dispose(); reflRT = null; } mipsD.concat(mipsU).forEach(r => r.dispose()); mipsD = []; mipsU = []; rt = null; [downMat, upMat, compMat].forEach(m => m && m.dispose()); downMat = upMat = compMat = null; }
  let bw = 1, bh = 1;
  function sizePost() { if (!rt) return; rt.setSize(bw, bh); if (reflRT) reflRT.setSize(Math.max(1, Math.round(bw * T.refl)), Math.max(1, Math.round(bh * T.refl))); let w = bw, h = bh; for (let i = 0; i < mipsD.length; i++) { w = Math.max(1, w >> 1); h = Math.max(1, h >> 1); mipsD[i].setSize(w, h); mipsU[i].setSize(w, h); } }
  function pass(mat, target) { fsMesh.material = mat; renderer.setRenderTarget(target); renderer.render(fsScene, fsCam); }

  /* ---------- 取景 ---------- */
  let scale = 1, cssW = 1, cssH = 1, portrait = false, fullD = 30, fullY = 8, shX = 0, shY = 0, shZ = 1;
  /* 11-16 下滚叙事：镜头沿树爬升（climb）。cK=0 首屏取景，cK=1 叙事取景；位置/取景偏移都在两者间插值 */
  const CL = { f: -1, k: 0, sx: 0, sy: 0 }, CC = { f: -1, k: 0, sx: 0, sy: 0 };
  let effX = 0, effY = 0;
  function applyShift() { effX = shX + (CC.sx - shX) * CC.k; effY = shY + (CC.sy - shY) * CC.k;
    if (Math.abs(effX) > 1e-4 || Math.abs(effY) > 1e-4) camera.setViewOffset(cssW, cssH, -effX * cssW, -effY * cssH, cssW, cssH); else camera.clearViewOffset(); camera.updateProjectionMatrix(); }
  /* 第四步：首屏取景按「树顶 / 树根落在屏幕的哪一段」反推（FR.t / FR.b = 距顶部比例），树居中、根下留水面 */
  const FR = { t: .05, b: .84 };
  function layout(asp) {
    portrait = asp < .9;
    const yT = STAR_Y + 1.15, yB = -.85, hH = (yT - yB) / 2 / Math.max(.2, FR.b - FR.t);
    fullD = Math.max(hH / TAN, 5.2 / (TAN * asp * Math.max(.3, 1 - 2 * Math.abs(shX))));
    const hh = TAN * fullD; fullY = yT - hh * (1 - 2 * FR.t) + .04 * fullD;
  }
  function resize() {
    cssW = Math.max(1, host.clientWidth); cssH = Math.max(1, host.clientHeight);
    const dpr = Math.min(window.devicePixelRatio || 1, T.dpr, Math.sqrt(T.budget / (cssW * cssH))) * scale;
    renderer.setPixelRatio(Math.max(.35, dpr)); renderer.setSize(cssW, cssH, false);
    const v = renderer.getDrawingBufferSize(new THREE.Vector2()); bw = v.x; bh = v.y;
    camera.aspect = cssW / cssH; applyShift(); U.uAsp.value = camera.aspect;
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
  const mouse = new THREE.Vector2(), par = new THREE.Vector2(), mPx = new THREE.Vector2(-1e4, -1e4), mLast = new THREE.Vector2(-1e4, -1e4);
  let hov = -1, ext = -1, mIn = 0, mOn = false;
  const SCR = LV.map(() => ({ x: -1e4, y: 0, r: 0 })), scr8 = { x: -1e4, y: 0, r: 0 };
  function onMove(e) {
    mouse.set(e.clientX / window.innerWidth * 2 - 1, e.clientY / window.innerHeight * 2 - 1);
    const b = canvas.getBoundingClientRect(); mPx.set(e.clientX - b.left, e.clientY - b.top); mOn = true;
    if (isPass(e.target)) { let best = -1, bd = 1e9; SCR.forEach((s, i) => { const d = Math.hypot(mPx.x - s.x, mPx.y - s.y); if (d < s.r * 1.25 + 26 + 44 * Math.min(1, s.r / 40) && d < bd) { bd = d; best = i; } }); hov = best; setCur(e.target, best >= 0 ? 'pointer' : ''); } else if (curEl) setCur(null, '');
  }
  /* 叙事滚动层（#p3ss 的空白处带 data-p3pass）盖在画布之上：悬停/点击树照常生效 */
  let curEl = null;
  function isPass(t) { return t === canvas || !!(t && t.hasAttribute && t.hasAttribute('data-p3pass')); }
  function setCur(el, c) { if (curEl && curEl !== el) curEl.style.cursor = ''; curEl = el; if (el) el.style.cursor = c; }
  function onLeave() { mOn = false; if (document.activeElement && document.activeElement.parentNode === lab) return; hov = -1; }
  function onClick(e) { if (!isPass(e.target) || hov < 0) return; location.href = LV[hov].href; }
  function onTilt(e) { if (e.gamma == null) return; mouse.set(Math.max(-1, Math.min(1, e.gamma / 25)), Math.max(-1, Math.min(1, ((e.beta || 0) - 50) / 25))); }
  function onVis() { if (document.hidden) { cancelAnimationFrame(raf); raf = 0; } else if (!raf && S && !still) { last = performance.now(); raf = requestAnimationFrame(frame); } }
  function onLost(e) { e.preventDefault(); stop(); }
  window.addEventListener('pointermove', onMove, { passive: true });
  host.addEventListener('pointerleave', onLeave);
  host.addEventListener('click', onClick);
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
      const target = hov === i ? 1 : (hov < 0 && ext === i ? .55 : 0); hi[i] += (target - hi[i]) * Math.min(1, dt * 5 || 1);
      N[i].mats.forEach(m => { if (m.lb) m.lb.color.set(m.hex).multiplyScalar(m.base * (1 + 1.2 * hi[i]) * a); else m.uniforms.uHi.value = hi[i]; });
      LA[i].classList.toggle('on', a > .6); LA[i].classList.toggle('hv', hov === i || (hov < 0 && ext === i)); LA[i].classList.toggle('hx', hov === i);
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
    aMat.uniforms.uGo.value = t; wMat.uniforms.uGrow.value = .25 + .75 * ease(t / 3);
    // 末段晶体：finT 由叙事给（0..1），平滑跟随
    finK += (finT - finK) * (still ? 1 : Math.min(1, dt * 3 || 1));
    xtal.visible = finK > .01;
    if (xtal.visible) { const e = eio(finK); xtal.scale.setScalar(.05 + 1.95 * e); xIn.rotation.y += dt * .32; xIn.rotation.x = .62 + Math.sin(t * .2) * .12; xIn.rotation.z = .2;
      xtal.userData.m.uniforms.uK.value = 1.15 * e; xtal.userData.im.color.setRGB(1, .9, .7).multiplyScalar(1.6 * e); xtal.userData.tm.color.setRGB(1, .86, .72).multiplyScalar(.9 * e); }
    tubeMat.uniforms.uK.value = .85 * (1 - .55 * finK); aMat.uniforms.uK.value = .62 * (1 - .6 * finK);
    star.visible = star.visible && finK < .6;
    bcn.forEach((b, i) => { const a = ease((U.uGrow.value - LV[i].y + .4) / 1.4); b.g.visible = a > .01; b.k += ((ext === i || hov === i ? 1 : 0) - b.k) * (still ? 1 : Math.min(1, dt * 4 || 1));
      b.ls.rotation.y += dt * (.6 + 1.6 * b.k); b.g.scale.setScalar(a * (1 + .5 * b.k));
      b.lm.color.set(LV[i].color).multiplyScalar((.5 + 2.6 * b.k) * a); b.pm.uniforms.uK.value = (.25 + 1.4 * b.k + .1 * Math.sin(t * 2 + i)) * a; });
  }
  function placeCamera(dt) {
    par.lerp(mouse, Math.min(1, dt * 2.2 || 1)); U.uPar.value.set(par.x, -par.y);
    const ci = eio((t - .2) / INTRO);
    const fd = hov >= 0 ? 1 : 0; focusK = Math.max(0, Math.min(1, focusK + (fd - focusK) * Math.min(1, dt * 1.8 || 1)));
    if (hov >= 0) focus.lerp(tmp.set(LV[hov].x, LV[hov].y, 0), Math.min(1, dt * 3 || 1));
    const D0 = 7.5;
    // 叙事镜头：目标层（f：-1 根 / 0..6 七层 / 7 第八颗星）的高度、横向、取景高度插值；跳切（low 档）时直接到位
    const ck = CL.jump ? 1 : Math.min(1, dt * 2.4 || 1), kOld = CC.k, xOld = CC.sx, yOld = CC.sy;
    CC.f += (CL.f - CC.f) * ck; CC.k += (CL.k - CC.k) * ck; CC.sx += (CL.sx - CC.sx) * ck; CC.sy += (CL.sy - CC.sy) * ck; CL.jump = false;
    if (Math.abs(CC.k - kOld) + Math.abs(CC.sx - xOld) + Math.abs(CC.sy - yOld) > 1e-5) applyShift();
    const fi = Math.max(-1, Math.min(8, CC.f)), f0 = Math.floor(fi), fr = fi - f0, f1 = Math.min(8, f0 + 1);   // 8 = 叙事末屏：整棵树
    const cy = j => j < 0 ? -.3 : j > 6 ? STAR_Y - .2 : LV[j].y, cx = j => j < 0 || j > 6 ? 0 : LV[j].x * .8, chv = j => j < 0 ? 9.5 : j > 7 ? (portrait ? 19 : 15) : j > 6 ? 8 : j === 6 ? 11.5 : 8;
    const nY = cy(f0) + (cy(f1) - cy(f0)) * fr, nX = cx(f0) + (cx(f1) - cx(f0)) * fr, nH = chv(f0) + (chv(f1) - chv(f0)) * fr;
    const nD = Math.max(nH / (2 * TAN), portrait ? (fi > 7 ? 8.4 : 7.4) / (2 * TAN * camera.aspect) : 0), nk = CC.k * ci;
    const Df = (D0 + (fullD - D0) * ci) * shZ;
    const D = (Df + (nD - Df) * nk) * (1 - .1 * focusK) * (1 + .012 * Math.sin(t * .13));
    const Yb = (.2 + (fullY - .2) * ci), Y = Yb + (nY - Yb) * nk;
    aim.set(par.x * .4 * ci + (focus.x * .25) * focusK + nX * nk, Y + (focus.y - Y) * .22 * focusK, 0);
    const az = (1 - ci) * .9 + Math.sin(t * .05) * .14 + par.x * .2, el = .12 + (1 - ci) * .25 - par.y * .08;
    camera.position.set(aim.x + Math.sin(az) * Math.cos(el) * D, aim.y - Math.sin(el) * D * .55, Math.cos(az) * Math.cos(el) * D);
    camera.lookAt(aim); camera.updateMatrixWorld();
    // 鼠标落在 z=0 平面的位置 → 尘埃引力井
    ray.set(mPx.x / cssW * 2 - 1, -(mPx.y / cssH * 2 - 1), .5).unproject(camera).sub(camera.position).normalize();
    if (Math.abs(ray.z) > 1e-3) { const k = -camera.position.z / ray.z; UM.copy(camera.position).addScaledVector(ray, k); }
    if (wMat.uniforms.uDisp.value > .5 && mOn && ray.y < -1e-3 && t - wMat.uniforms.uMT.value > .7 && mPx.distanceTo(mLast) > 30) {   // 指针掠过水面：从落点荡开一圈
      const k = (WY - camera.position.y) / ray.y; if (k > 0 && k < 90) { wMat.uniforms.uMP.value.set(camera.position.x + ray.x * k, camera.position.z + ray.z * k); wMat.uniforms.uMT.value = t; mLast.copy(mPx); } }
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
    if (reflRT) {   // 倒影：镜像相机（水面对称）渲染到低分辨率 RT，水面着色器按投影坐标取样
      const cp = camera.position; reflCam.copy(camera, false);
      reflCam.position.set(cp.x, 2 * WY - cp.y, cp.z); reflCam.up.set(0, -1, 0); reflCam.lookAt(aim.x, 2 * WY - aim.y, aim.z); reflCam.updateMatrixWorld();
      wTM.set(.5, 0, 0, .5, 0, .5, 0, .5, 0, 0, .5, .5, 0, 0, 0, 1).multiply(reflCam.projectionMatrix).multiply(reflCam.matrixWorldInverse);
      const px = U.uPx.value; U.uPx.value = px * T.refl; water.visible = false; bg.visible = false;
      renderer.setRenderTarget(reflRT); renderer.setClearColor(0x020106, 1); renderer.clear(); renderer.render(scene, reflCam);
      U.uPx.value = px; water.visible = true; bg.visible = true; renderer.setClearColor(0x030208, 1);
    }
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
    render(Math.max(0, Math.min(raw, .1)));   // rAF 时间戳可能早于上次记录（负 dt 会让插值外推发散），夹到 ≥0
    if (frames === 2) { canvas.classList.add('on'); host.classList.add('gl'); }
    if (!frozen) govern(raw, now);
  }
  function stop() {
    if (!S) return; cancelAnimationFrame(raf); raf = 0;
    window.removeEventListener('pointermove', onMove); host.removeEventListener('pointerleave', onLeave); host.removeEventListener('click', onClick); setCur(null, '');
    window.removeEventListener('deviceorientation', onTilt); window.removeEventListener('resize', resize);
    document.removeEventListener('visibilitychange', onVis); canvas.removeEventListener('webglcontextlost', onLost);
    disposePost(); geos.forEach(g => g.dispose()); mats.forEach(m => m.dispose()); fsGeo.dispose(); bg.material.dispose();
    renderer.dispose(); try { renderer.forceContextLoss(); } catch (e) {}
    lab.remove(); canvas.classList.remove('on'); host.classList.remove('gl'); S = null; window.__p3dbg = null;
  }
  function pause() { cancelAnimationFrame(raf); raf = 0; document.removeEventListener('visibilitychange', onVis); }
  S = { stop, pause, setTier: n => setTier(n, false), tier: tierName, spot: i => { ext = i; if (still) { render(0); } }, shift: (x, y, z) => { shX = x || 0; shY = y || 0; shZ = z || 1; applyShift(); if (still) render(0); }, levels: () => LV.map(l => ({ name: l.name, color: l.color, href: l.href, id: l.id, f: l.f })),
    fit: (tp, bt, x) => { FR.t = tp; FR.b = bt; shX = x || 0; shY = 0; shZ = 1; layout(camera.aspect); applyShift(); if (still) render(0); },
    finale: k => { finT = Math.max(0, Math.min(1, k || 0)); if (still) render(0); },
    climb: (f, k, sx, sy, jump) => { CL.f = f; CL.k = k; CL.sx = sx || 0; CL.sy = sy || 0; if (jump) CL.jump = true; if (still) { CL.jump = true; render(0); } }, gpu: pick.gpu, fps: 0, get ready() { return t > INTRO + .5; } };
  buildPost(); resize();
  try { renderer.compile(scene, camera); } catch (e) {}
  window.__p3dbg = { S, renderer, scene, camera, render, cl: () => ({ CL, CC, fullY, fullD, shZ, aim: aim.toArray(), focusK, fy: focus.y, hov, t }), step: (dt, n) => { for (let i = 0; i < (n || 1); i++) render(dt); }, setT: v => { t = v; }, freeze: v => { frozen = v !== false; }, hover: i => { hov = i; } };
  if (still) { render(0); render(0); canvas.classList.add('on'); host.classList.add('gl'); }
  else raf = requestAnimationFrame(frame);
  dispatchEvent(new CustomEvent('p3q:tier', { detail: { tier: tierName } }));
  return S;
}
export function stop() { if (S) S.stop(); }
export function setQuality(n) { if (S) { S.setTier(n); return true; } return false; }
export function tier() { return S ? S.tier : null; }
export function pause() { if (S) S.pause(); }
export function spot(i) { if (S) S.spot(i); }
export function shift(x, y, z) { if (S) S.shift(x, y, z); }
export function levels() { return S ? S.levels() : []; }
/* 11-16 下滚叙事：f = -1 根 · 0..6 七层 · 7 第八颗星 · 8 整棵树（末屏）；k = 叙事取景权重 0..1；sx/sy = 叙事时的取景偏移；jump = 跳切 */
/* 11-16 第四步：首屏取景（树顶 / 树根在屏幕上的位置比例 + 横向偏移）；叙事末段晶体 0..1 */
export function fit(t, b, x) { if (S && S.fit) S.fit(t, b, x); }
export function finale(k) { if (S && S.finale) S.finale(k); }
export function climb(f, k, sx, sy, jump) { if (S && S.climb) S.climb(f, k, sx, sy, jump); }
