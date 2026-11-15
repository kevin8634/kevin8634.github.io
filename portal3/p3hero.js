/* 创世计划 门户 3.0 · 首屏 Three.js 主视觉（阶段 2a，11-15）
 * 造物晶柱（程序生成切面尖晶 + 底部 16 根倾斜小晶簇花冠 + 暗色岩台）/ 七色光桥沿螺旋自下而上依次点亮 / 柱顶汇成第八颗星 /
 * 暗色镜面水台（整组 y 翻转镜像一遍 + 半透明暗水覆盖渐隐）/ 紫青丝状星云 + 旋涡星系 + 右上行星剪影。
 * 本地 three r186（复用 ludoterra/vendor/r186，MIT），零外部请求。
 * 管线：HalfFloat HDR RT(MSAA) → 自写 bloom（13-tap 降采样+tent 升采样）→ 合成（曝光、暗角、ACES/AgX 混合、分离色调、颗粒、抖动、sRGB）。
 * 画质（规则见 p3tier.js）：high = MeshPhysicalMaterial 透射玻璃（transmission/ior/dispersion/iridescence/thickness + PMREM 程序环境）；
 *   medium = 自写菲涅尔假玻璃 + 内部竖直光柱（加色）；low = 不跑 WebGL（start 返回 null，保留静态底图；运行中降到 low 则整体释放）。
 * fps 调速器先降像素、再降档（只降不升）；setQuality() 供右上角「画质」热切换。
 * 动画全部是 t 的纯函数；?p3t=秒 冻结到该时刻（截帧用）。思路致谢见 portal3/LICENSES.md，代码为本项目自写。 */
import * as THREE from '../ludoterra/vendor/r186/three.module.min.js';
import { pickTier, lower, SLOW } from './p3tier.js';

let S = null; // 运行状态（单例）

const TIERS = {
  high:   { gl: true,  phys: true,  msaa: 4, mips: 6, budget: 2.4e6, dpr: 2,   oct: 5, dust: 1200, spk: 900 },
  medium: { gl: true,  phys: false, msaa: 0, mips: 5, budget: 1.4e6, dpr: 1.5, oct: 4, dust: 700,  spk: 560 },
  low:    { gl: false },
};

/* 场景常数（世界单位） */
const WY = -6.0;                       // 水面高度
const CRY = { y0: -5.35, h: 13.4, r: 1.25 };   // 主晶柱：底、高、半径
const STAR_Y = CRY.y0 + CRY.h + 0.75;  // 第八颗星
const SPI = { y0: -4.7, y1: 7.5, r0: 5.6, r1: 0.9, turns: 4.5, a0: 2.2, tilt: .2 };   // 光桥螺旋
const RAINBOW = [[1, .07, .1], [1, .36, .02], [1, .78, .04], [.1, 1, .22], [.04, .78, 1], [.16, .26, 1], [.62, .16, 1]]; // 红橙黄绿青蓝紫（与开场同一组）
const SEG_T0 = 0.8, SEG_DT = 0.5, STAR_T0 = SEG_T0 + 7 * SEG_DT;  // 0.8s 起每段 0.5s 依次点亮；4.3s 全亮后星点燃

/* 螺旋：s∈[0,1] 自下而上；第 0 段在最下（紫），第 6 段在最上（红），向第八颗星收拢 */
function spiral(s, v) {
  s = Math.min(1, Math.max(0, s));
  const a = SPI.a0 + s * SPI.turns * Math.PI * 2;
  const r = SPI.r1 + (SPI.r0 - SPI.r1) * Math.pow(1 - s, 1.1);
  const y = SPI.y0 + (SPI.y1 - SPI.y0) * s + r * SPI.tilt * Math.sin(a + .8);
  return v.set(Math.cos(a) * r, y, Math.sin(a) * r);
}
const SPIRAL_GLSL = `
const float PI2 = 6.2831853;
vec3 spiral(float s){
  s = clamp(s, 0., 1.);
  float a = ${SPI.a0.toFixed(4)} + s*${SPI.turns.toFixed(4)}*PI2;
  float r = ${SPI.r1.toFixed(4)} + ${(SPI.r0 - SPI.r1).toFixed(4)}*pow(1.-s, 1.1);
  float y = ${SPI.y0.toFixed(4)} + ${(SPI.y1 - SPI.y0).toFixed(4)}*s + r*${SPI.tilt.toFixed(4)}*sin(a+.8);
  return vec3(cos(a)*r, y, sin(a)*r);
}`;

/* ---------------- shaders ---------------- */
const NOISE = `
float h21(vec2 p){ p = fract(p*vec2(123.34,456.21)); p += dot(p,p+45.32); return fract(p.x*p.y); }
float vn(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(h21(i),h21(i+vec2(1,0)),f.x), mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x), f.y); }
float fbm(vec2 p){ float a=.5, s=0.; mat2 r=mat2(.8,.6,-.6,.8); for(int i=0;i<OCT;i++){ s+=a*vn(p); p=r*p*2.03+11.7; a*=.5; } return s; }
float rfbm(vec2 p){ float a=.5, s=0.; mat2 r=mat2(.8,.6,-.6,.8); for(int i=0;i<OCT;i++){ s+=a*(1.-abs(vn(p)*2.-1.)); p=r*p*2.07+5.3; a*=.5; } return s; }
`;
const BG_VERT = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.9999, 1.0); }`;
/* 背景：紫（左上，旋涡星系所在）+ 青（右上）丝状星云；行星剪影 + 小卫星；水平线以下取镜像（给水面反射用） */
const BG_FRAG = `
varying vec2 vUv;
uniform float uT, uAsp, uHor, uStarOn; uniform vec2 uPar, uGal, uStar; uniform vec3 uPlanet;
${NOISE}
vec3 stars(vec2 p, float sc, float th){
  vec2 g = p*sc, i = floor(g), f = fract(g)-.5; float r = h21(i);
  if (r < th) return vec3(0.);
  vec2 o = vec2(h21(i+7.1), h21(i+3.3))-.5; float d = length(f-o*.7);
  float tw = .65+.35*sin(uT*(1.+r*3.)+r*40.);
  float b = pow((r-th)/(1.-th), 3.)*tw;
  return mix(vec3(.75,.8,1.), vec3(1.,.8,.95), h21(i+1.9)) * b * (smoothstep(.09,.0,d)*3. + smoothstep(.35,.0,d)*.15);
}
vec3 sky(vec2 uv){
  vec2 p = vec2((uv.x-.5)*uAsp, uv.y-.5);
  vec3 col = mix(vec3(.006,.004,.02), vec3(.014,.008,.04), uv.y);
  // 丝状星云：3 层切片视差
  float dens = 0.; vec3 neb = vec3(0.);
  for (int i=0;i<3;i++){
    float fi = float(i);
    vec2 q = p*(1.5+fi*.4) + uPar*(.04+fi*.03) + vec2(fi*3.7, fi*1.3) + vec2(uT*.003*(fi+1.), 0.);
    vec2 w = vec2(fbm(q*1.2+3.1), fbm(q*1.2-7.4));
    float n = fbm(q + w*1.7);
    float fil = pow(rfbm(q*2.2 + w*2.4), 4.);                                  // 丝状
    float bandP = exp(-pow((p.y - .16 + p.x*.42)*3.2, 2.)) * smoothstep(.55, -.35, p.x/uAsp*2.);   // 左上紫带
    float bandC = exp(-dot((p - vec2(.27*uAsp, .27))*vec2(1.3,2.2), (p - vec2(.27*uAsp, .27))*vec2(1.3,2.2))*2.6);  // 右上青团
    float d = smoothstep(.5, 1., n);
    vec3 cP = mix(vec3(.12,.03,.24), vec3(.6,.22,.95), fil);
    vec3 cC = mix(vec3(.02,.14,.22), vec3(.1,.7,.78), fil);
    vec3 c = cP*bandP*(d*.8 + fil*.9) + cC*bandC*(d*.8 + fil*1.1) + vec3(.05,.03,.1)*d*.2;
    neb += c * (1.-dens) * .34; dens += (bandP+bandC)*d*.22*(1.-dens);
  }
  col += neb;
  // 第八颗星周围的薰衣草色内散射
  float ds = length((uv-uStar)*vec2(uAsp,1.));
  col += vec3(.7,.55,1.) * (exp(-ds*4.)*.07 + exp(-ds*12.)*.12) * uStarOn;
  col += stars(p + uPar*.01, 95., .935) * (1.-dens*.5);
  col += stars(p + uPar*.02, 36., .975) * 1.3;
  // 旋涡星系（左上）
  vec2 g = (uv-uGal)*vec2(uAsp,1.); float ca=cos(-.55), sa=sin(-.55); g = mat2(ca,-sa,sa,ca)*g; g.y /= .42;
  float r = length(g), a = atan(g.y, g.x);
  float arm = pow(.5+.5*sin(2.*a - log(r+1e-3)*5.4 - uT*.03), 3.);
  float gd = exp(-r*13.) * (.3 + arm*1.25) * smoothstep(.004,.03,r) * (.7+.6*fbm(g*30.));
  col += mix(vec3(.75,.45,1.), vec3(1.,.85,.95), exp(-r*22.)) * (gd*1.5 + exp(-r*55.)*2.);
  // 行星剪影（右上）+ 小卫星
  vec2 pp = vec2((uv.x-uPlanet.x)*uAsp, uv.y-uPlanet.y); float pr = length(pp), R = uPlanet.z;
  vec2 L = normalize(vec2(-.75,.55));
  float disk = smoothstep(R, R-.0025, pr);
  vec3 surf = vec3(.018,.014,.035) + vec3(.03,.02,.05)*fbm(vec2(pp.x*9., pp.y*38.)) ;
  float lit = clamp(dot(pp/R, L)*1.4 + .1, 0., 1.); surf += vec3(.22,.18,.36)*pow(lit, 2.2)*.55;
  float rim = smoothstep(R-.012, R, pr) * disk * pow(max(dot(normalize(pp), L), 0.), 2.);
  col = mix(col, surf + vec3(.75,.65,1.)*rim*.9, disk);
  col += vec3(.45,.35,.9) * exp(-max(pr-R,0.)*55.) * (1.-disk) * (.08 + .25*pow(max(dot(normalize(pp), L), 0.), 3.));
  vec2 mp = vec2((uv.x-uPlanet.x+R*1.9/uAsp)*uAsp, uv.y-uPlanet.y-R*.45); float mr = length(mp), MR = R*.16;
  float md = smoothstep(MR, MR-.002, mr); col = mix(col, vec3(.03,.025,.06) + vec3(.3,.25,.5)*clamp(dot(mp/MR, L),0.,1.)*.5, md);
  // 水平线辉光
  col += vec3(.16,.08,.3) * exp(-pow((uv.y-uHor)*10., 2.)) * .55;
  return col;
}
void main(){
  vec2 uv = vUv; float refl = 0.;
  if (uv.y < uHor) { uv.y = 2.*uHor - uv.y; refl = 1.; }        // 水面以下：镜像天空
  vec3 col = sky(uv);
  if (refl > .5) col *= .55;
  gl_FragColor = vec4(col, 1.);
}`;

const STD_VERT = `varying vec2 vUv; varying vec3 vN, vV, vW; void main(){ vUv = uv; vec4 wp = modelMatrix*vec4(position,1.); vW = wp.xyz; vec4 mv = viewMatrix*wp; vN = normalize(mat3(modelMatrix)*normal); vV = cameraPosition - wp.xyz; gl_Position = projectionMatrix*mv; }`;
/* medium：菲涅尔假玻璃（切面平直法线 + 程序环境反射 + 伪折射 + 薄膜虹彩 + 内部辉光 + 切面闪烁） */
const FAKEGLASS_VERT = `attribute float aF; attribute vec3 aB; varying vec3 vN, vV, vW, vB; varying float vF;
void main(){ vF = aF; vB = aB; vec4 wp = modelMatrix*vec4(position,1.); vW = wp.xyz; vN = normalize(mat3(modelMatrix)*normal); vV = cameraPosition - wp.xyz; gl_Position = projectionMatrix*viewMatrix*wp; }`;
const FAKEGLASS_FRAG = `
varying vec3 vN, vV, vW, vB; varying float vF; uniform float uT, uK, uBack, uCore, uAdd;
vec3 env(vec3 d){
  vec3 c = mix(vec3(.03,.02,.07), vec3(.2,.22,.5), smoothstep(-.4,.9,d.y));
  c += vec3(.9,.8,1.)*pow(max(dot(d, normalize(vec3(.05,1.,.1))),0.), 30.)*4.;     // 柱顶星光
  c += vec3(.3,.85,1.)*pow(max(dot(d, normalize(vec3(.9,.35,.4))),0.), 6.)*.9;     // 右侧青
  c += vec3(.75,.3,1.)*pow(max(dot(d, normalize(vec3(-.9,.25,.5))),0.), 6.)*.9;    // 左侧紫
  c += vec3(1.)*smoothstep(.97,.995, abs(sin(d.y*9.+d.x*4.)))*.25;                   // 窗格状高光条
  return c;
}
void main(){
  vec3 n = normalize(vN), v = normalize(vV);
  if (uBack > .5) n = -n;
  float nv = abs(dot(n,v)); float F = .04 + .96*pow(1.-nv, 5.);
  vec3 rf = reflect(-v, n);
  vec3 irid = .5 + .5*cos(6.2832*(vec3(0.,.33,.67) + nv*1.6 + vF*.7 + vW.y*.05));
  vec3 refl = env(rf) * mix(vec3(1.), irid*1.3, .55);
  vec3 refr = env(refract(-v, n, .667)) * vec3(.45,.5,.85) * .45;
  float axis = length(vW.xz);
  float hgt = clamp((vW.y + 5.4)/13.5, 0., 1.);
  vec3 inner = vec3(.55,.6,1.) * exp(-axis*1.1) * (.25 + .6*hgt) * uCore;
  float spark = step(.82, fract(vF*13.7)) * pow(max(dot(rf, normalize(vec3(sin(uT*.21+vF*6.),.6,cos(uT*.17+vF*5.)))),0.), 40.) * 4.;
  float base = exp(-max(vW.y + 5.4, 0.)*.45);                                        // 底部花冠更亮
  inner += vec3(.62,.5,1.) * base * .9 * uCore;
  float shade = pow(max(dot(n, normalize(vec3(.25,.85,.45))), 0.), 1.5)*.6 + pow(max(dot(n, normalize(vec3(-.7,.2,.6))), 0.), 2.)*.35;
  vec3 facet = mix(vec3(.18,.16,.42), vec3(.55,.75,1.), vF) * shade * (.25 + .75*step(.45, fract(vF*7.3)));
  float bm = min(vB.x, min(vB.y, vB.z)); float edge = 1. - smoothstep(0., fwidth(bm)*1.6, bm);
  vec3 c = (refr + inner)*(1.-F) + refl*F*1.8 + facet*.55 + vec3(.8,.85,1.)*spark + vec3(.75,.8,1.)*edge*(.12 + .3*(1.-nv) + .3*step(.6, vF))*uK;
  float a = clamp(.3 + F*.9 + spark*.1 + edge*.25, 0., .94);
  if (uAdd > .5) { gl_FragColor = vec4((refl*F*1.4 + vec3(.8,.85,1.)*spark + vec3(.75,.8,1.)*edge*.4 + inner*.35)*uK, 1.); return; }   // 高档：叠在透射玻璃上的加色高光层
  gl_FragColor = vec4(c*uK, a);
}`;
/* 内部竖直光柱（加色，近轴亮、边缘淡，向上流动） */
const BEAM_FRAG = `
varying vec2 vUv; varying vec3 vN, vV; uniform float uT, uK;
void main(){
  float nv = abs(dot(normalize(vN), normalize(vV)));
  float flow = .65 + .35*sin(vUv.y*26. - uT*2.4) * sin(vUv.y*7. - uT*.9);
  float m = pow(nv, 3.) * smoothstep(0.,.12,vUv.y) * smoothstep(1.,.85,vUv.y) * (.35 + .65*vUv.y);
  gl_FragColor = vec4(vec3(.62,.62,1.)*m*flow*uK, 1.);
}`;
/* 光带：TubeGeometry，顶点着色器按 uR 重新定粗（像素下限，§25：亮度乘 真宽/夹宽） */
const RIB_VERT = `uniform float uR, uR0; varying vec2 vUv; varying vec3 vN, vV;
void main(){ vUv = uv; vec3 p = position + normal*(uR-uR0); vec4 wp = modelMatrix*vec4(p,1.); vN = normalize(mat3(modelMatrix)*normal); vV = cameraPosition - wp.xyz; gl_Position = projectionMatrix*viewMatrix*wp; }`;
const RIB_FRAG = `
varying vec2 vUv; varying vec3 vN, vV; uniform vec3 uCol; uniform float uProg, uT, uK, uSheath, uAmp, uSeg;
void main(){
  float x = vUv.x;
  float lit = uProg >= .999 ? 1. : smoothstep(uProg, uProg-.035, x);
  float nv = abs(dot(normalize(vN), normalize(vV)));
  float prof = uSheath > .5 ? pow(nv, 2.6) : (.5 + .5*nv);
  float pulse = exp(-pow((fract(x*2.5 - uT*.32 + uSeg*.17)-.5)*9., 2.));
  float head = exp(-pow((x-uProg)*16., 2.)) * step(uProg, .999) * step(.001, uProg);
  float b = lit*(.8 + pulse*1.2) + head*4.;
  b = max(b, .05);
  vec3 c = mix(uCol, vec3(1.), uSheath > .5 ? 0. : .08 + .12*pulse*lit);
  gl_FragColor = vec4(c*b*prof*uK*uAmp, 1.);
}`;
const GLOW_VERT = `varying vec2 vUv; void main(){ vUv = uv*2.-1.; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`;
/* 第八颗星光晕：核心 + 长十字星芒 + 短斜芒 */
const STARGLOW_FRAG = `
varying vec2 vUv; uniform vec3 uCol; uniform float uK, uSpk, uRot;
void main(){
  vec2 p = vUv; float r = length(p);
  float core = exp(-r*r*60.)*2.2 + exp(-r*7.)*.32 + exp(-r*2.6)*.08;
  float lx = exp(-abs(p.y)*160.)*exp(-abs(p.x)*2.6), ly = exp(-abs(p.x)*160.)*exp(-abs(p.y)*2.2);
  float ca = cos(.7854+uRot), sa = sin(.7854+uRot); vec2 q = mat2(ca,-sa,sa,ca)*p;
  float dg = exp(-abs(q.y)*220.)*exp(-abs(q.x)*6.) + exp(-abs(q.x)*220.)*exp(-abs(q.y)*6.);
  float m = (core + (lx + ly + dg*.5)*uSpk) * smoothstep(1., .8, r);
  vec3 c = mix(uCol, vec3(1.), exp(-r*10.));
  gl_FragColor = vec4(c*m*uK, 1.);
}`;
const PTS_VERT = `attribute float aS; attribute vec3 aC; varying vec3 vC; uniform float uPx, uT;
void main(){ vec4 mv = modelViewMatrix*vec4(position,1.); vC = aC*(.7+.3*sin(uT*1.7+position.x*3.1+position.y*5.)); gl_PointSize = max(1.5, aS*uPx/(-mv.z)); gl_Position = projectionMatrix*mv; }`;
const PTS_FRAG = `varying vec3 vC; void main(){ vec2 d = gl_PointCoord-.5; float r = length(d)*2.; float m = exp(-r*r*5.)*(1.-r); if (m <= 0.) discard; gl_FragColor = vec4(vC*m, 1.); }`;
/* 光桥火花：无状态粒子 f(id, t)，沿各自那一段螺旋流动；未点亮的段不显示 */
const SPK_VERT = `attribute vec4 aD; uniform float uPx, uT; uniform float uLit[7]; varying vec3 vC; uniform vec3 uCols[7];
${SPIRAL_GLSL}
void main(){
  int seg = int(aD.x); float u = fract(aD.y + uT*(.018 + aD.w*.02));
  float s = (aD.x + u)/7.;
  vec3 p = spiral(s);
  float th = aD.z*6.2832 + uT*(.6+aD.w);
  p += vec3(cos(th), sin(th*1.3)*.8, sin(th)) * (.12 + .5*aD.w*aD.w);
  float lit = uLit[seg]; float on = lit >= .999 ? 1. : step(u, lit);
  vec4 mv = modelViewMatrix*vec4(p,1.);
  float tw = .55 + .45*sin(uT*3.1 + aD.z*40.);
  vC = mix(uCols[seg], vec3(1.), .35) * on * tw * (1.6 - aD.w);
  gl_PointSize = max(1.2, (1.2 + 2.2*(1.-aD.w))*uPx/(-mv.z)) * on;
  gl_Position = projectionMatrix*mv;
}`;
/* 水面：暗紫基色 + 涟漪环 + 远处/离中心越远越不透明（反射渐隐） */
const WATER_FRAG = `
varying vec3 vW, vV; uniform float uT, uK;
${'' /* 无纹理，纯函数 */}
void main(){
  float d = length(vW.xz);
  vec3 v = normalize(vV);
  vec3 c = vec3(.008,.006,.022);
  c += vec3(.14,.08,.32) * pow(1.-abs(v.y), 6.) * .45;                 // 掠射角的天光
  float ring = pow(.5+.5*sin(d*2.6 - uT*.7), 18.) * exp(-d*.12) * smoothstep(3.2, 5., d);
  c += vec3(.5,.42,1.) * ring * .09 * uK;
  c += vec3(.55,.5,1.) * exp(-abs(vW.x)*1.3) * exp(-max(vW.z,0.)*.05) * .035 * uK;   // 晶柱下的竖直反光
  float a = mix(.42, .9, smoothstep(4., 26., d));
  a = mix(a, .97, pow(1.-abs(v.y), 10.));
  gl_FragColor = vec4(c, a);
}`;
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
/* 合成：克制后期（§41）——暗角作为曝光乘子放在色调映射之前、颗粒 ≈0.012、bloom 混合量由 uBloom 控制 */
const COMP_FRAG = `varying vec2 vUv; uniform sampler2D tScene, tBloom; uniform float uBloom, uExp, uT, uAsp, uFade;
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
  vec3 c = texture2D(tScene, vUv).rgb;
  c = mix(c, texture2D(tBloom, vUv).rgb, uBloom);
  vec2 d = (vUv-.5)*vec2(uAsp,1.); c *= 1. - smoothstep(.35, 1.2, length(d))*.42;   // 暗角（曝光乘子）
  c *= uExp;
  c = mix(aces(c), agx(c), .5);
  float l = luma(c);
  c += mix(vec3(.004,-.004,.016), vec3(.012,.006,-.006), smoothstep(.15,.7,l));       // 分离色调：暗部紫蓝、亮部微暖
  c = mix(vec3(l), c, 1.08);
  c = c*(1.-.025) + vec3(.006,.004,.014);                                            // 抬起的紫色黑位
  float gr = hh(vUv*1717. + fract(uT*7.13)*91.) - .5;
  c += gr * .012 * (1.-l*.6);
  c = max(c, 0.);
  c = mix(c*12.92, 1.055*pow(c, vec3(1./2.4)) - .055, step(.0031308, c));
  c += (hh(gl_FragCoord.xy + fract(uT)) - .5)/255.;
  gl_FragColor = vec4(c*uFade, 1.);
}`;

/* ---------------- geometry ---------------- */
function rng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }

/* 尖晶：prof = [[y, r], ...]（y 0..1 乘高，r 乘半径），顶端收成尖点；每环随机抖动/扭转 → 切面感。写入非索引三角形（位置、平直法线、每面随机数） */
function crystal(acc, R, sides, h, rad, prof, m4) {
  const rings = prof.map(([y, r], k) => {
    const tw = R() * .6, pts = [];
    for (let j = 0; j < sides; j++) { const a = (j + (R() - .5) * .35) / sides * Math.PI * 2 + tw + k * .1; const rr = r * rad * (.82 + .32 * R()); pts.push(new THREE.Vector3(Math.cos(a) * rr, (y + (R() - .5) * .05) * h, Math.sin(a) * rr)); }
    return pts;
  });
  const tip = new THREE.Vector3((R() - .5) * rad * .2, h, (R() - .5) * rad * .2), bot = new THREE.Vector3(0, -rad * .2, 0);
  const tri = (a, b, c) => {
    const n = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a)).normalize();
    const cen = new THREE.Vector3().add(a).add(b).add(c).multiplyScalar(1 / 3); const out = new THREE.Vector3(cen.x, 0, cen.z);
    if (cen.y > h * .999 - 1e-3) out.y = 1; if (out.lengthSq() < 1e-6) out.set(0, cen.y > 0 ? 1 : -1, 0);
    let A = a, B = b, C = c; if (n.dot(out) < 0) { n.negate(); B = c; C = b; }
    const f = R(); const nm = new THREE.Matrix3().getNormalMatrix(m4);
    [A, B, C].forEach(p => { const q = p.clone().applyMatrix4(m4); acc.p.push(q.x, q.y, q.z); });
    const nn = n.clone().applyMatrix3(nm).normalize(); for (let i = 0; i < 3; i++) { acc.n.push(nn.x, nn.y, nn.z); acc.f.push(f); } acc.b.push(1, 0, 0, 0, 1, 0, 0, 0, 1);
  };
  for (let k = 0; k < rings.length - 1; k++) for (let j = 0; j < sides; j++) { const a = rings[k][j], b = rings[k][(j + 1) % sides], c = rings[k + 1][(j + 1) % sides], d = rings[k + 1][j]; tri(a, b, c); tri(a, c, d); }
  const top = rings[rings.length - 1]; for (let j = 0; j < sides; j++) tri(top[j], top[(j + 1) % sides], tip);
  const b0 = rings[0]; for (let j = 0; j < sides; j++) tri(b0[(j + 1) % sides], b0[j], bot);
}
function crystalCluster() {
  const R = rng(20261115), acc = { p: [], n: [], f: [], b: [] }, M = new THREE.Matrix4();
  // 主柱：细长八棱尖晶
  M.makeTranslation(0, CRY.y0, 0);
  crystal(acc, R, 8, CRY.h, CRY.r, [[0, .78], [.05, 1], [.22, .93], [.45, .74], [.66, .52], [.82, .32], [.92, .17]], M);
  // 花冠：内圈 16 根倾斜小晶，外圈 9 根矮晶
  const up = new THREE.Vector3(0, 1, 0);
  for (let k = 0; k < 25; k++) {
    const inner = k < 16, phi = (k + R() * .6) / (inner ? 16 : 9) * Math.PI * 2 + (inner ? 0 : .4);
    const d = inner ? .75 + R() * 1.1 : 2.1 + R() * 1.1;
    const tilt = inner ? .3 + R() * .5 + (d - .75) * .25 : .55 + R() * .45;
    const h = inner ? 4.6 - (d - .75) * 1.7 + R() * 1.2 : .9 + R() * 1.1;
    const rad = inner ? .22 + R() * .2 : .16 + R() * .14;
    const radial = new THREE.Vector3(Math.cos(phi), 0, Math.sin(phi)), axis = new THREE.Vector3().crossVectors(up, radial).normalize();
    const rot = new THREE.Matrix4().makeRotationAxis(axis, tilt).multiply(new THREE.Matrix4().makeRotationY(R() * 6.28));
    M.makeTranslation(radial.x * d, CRY.y0 + (inner ? .05 : -.05), radial.z * d).multiply(rot);
    crystal(acc, R, 6, h, rad, [[0, .85], [.1, 1], [.68, .95]], M);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(acc.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(acc.n, 3)); g.setAttribute('aF', new THREE.Float32BufferAttribute(acc.f, 1)); g.setAttribute('aB', new THREE.Float32BufferAttribute(acc.b, 3));
  g.computeBoundingSphere(); return g;
}
function rockGeo(kind, seed) {
  const R = rng(seed); let g;
  if (kind === 'ped') g = new THREE.CylinderGeometry(2.7, 4.5, 1.6, 15, 3);
  else g = new THREE.IcosahedronGeometry(1, 2);
  const p = g.attributes.position, v = new THREE.Vector3(), o = [R() * 9, R() * 9, R() * 9];
  const hsh = (x, y, z) => { const s = Math.sin(x * 12.99 + y * 78.23 + z * 37.71 + o[0]) * 43758.55; return s - Math.floor(s); };
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const k = hsh(Math.round(v.x * 50) / 50, Math.round(v.y * 50) / 50, Math.round(v.z * 50) / 50);
    if (kind === 'ped') { const s = 1 + (k - .5) * .28; v.x *= s; v.z *= s; if (v.y > .7) v.y -= k * .35; }
    else { const s = 1 + .22 * Math.sin(v.x * 3 + o[1]) * Math.sin(v.y * 2.6 + o[2]) + (k - .5) * .3; v.multiplyScalar(s); }
    p.setXYZ(i, v.x, v.y, v.z);
  }
  if (g.index) g = g.toNonIndexed(); g.computeVertexNormals(); return g;
}
function starGeo() {
  const s = new THREE.Shape(); const N = 8;
  for (let k = 0; k < N * 2; k++) { const a = k * Math.PI / N + Math.PI / 2, r = k % 2 ? .3 : (k % 4 ? .95 : 1.45); const x = Math.cos(a) * r, y = Math.sin(a) * r; k ? s.lineTo(x, y) : s.moveTo(x, y); }
  s.closePath();
  const geo = new THREE.ExtrudeGeometry(s, { depth: .14, bevelEnabled: true, bevelThickness: .1, bevelSize: .06, bevelSegments: 1 });
  geo.translate(0, 0, -.12); return geo;
}

function buildEnv(renderer) {
  const sc = new THREE.Scene();
  const m = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, vertexShader: `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `varying vec3 vP; void main(){ vec3 d = normalize(vP);
      vec3 c = mix(vec3(.02,.015,.05), vec3(.12,.1,.3), smoothstep(-.3,.9,d.y));
      c += vec3(1.,.9,1.)*pow(max(d.y,0.), 40.)*30.;                                         // 柱顶第八颗星
      c += vec3(.3,.85,1.)*pow(max(dot(d, normalize(vec3(.9,.3,.3))),0.), 6.)*2.;            // 右青
      c += vec3(.8,.3,1.)*pow(max(dot(d, normalize(vec3(-.9,.2,.4))),0.), 6.)*2.;            // 左紫
      c += vec3(.9,.8,1.)*smoothstep(.96,.99, abs(sin(d.y*8.+atan(d.z,d.x)*3.)))*.6;         // 条状高光（给切面闪光）
      gl_FragColor = vec4(c,1.); }` });
  sc.add(new THREE.Mesh(new THREE.SphereGeometry(10, 48, 24), m));
  const pm = new THREE.PMREMGenerator(renderer);
  const rt = pm.fromScene(sc, 0.02);
  pm.dispose(); m.dispose(); sc.children[0].geometry.dispose();
  return rt;
}

export function start(host, opts) {
  if (S) return S;
  opts = opts || {};
  const canvas = document.createElement('canvas'); canvas.id = 'p3cv'; canvas.setAttribute('aria-hidden', 'true');
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance', stencil: false }); }
  catch (e) { return null; }
  if (!renderer.capabilities.isWebGL2) { renderer.dispose(); return null; }
  const gl = renderer.getContext();
  const pick = pickTier(gl);
  let tierName = pick.tier, T = TIERS[tierName];
  if (!T.gl) { renderer.dispose(); try { renderer.forceContextLoss(); } catch (e) {} return null; }   // low：不跑 WebGL，保留静态底图
  const PHYS = T.phys;   // 透射玻璃只在启动档为 high 时建（热切换只换后期/分辨率）
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.setClearColor(0x030208, 1);
  renderer.autoClear = false;
  host.insertBefore(canvas, host.firstChild);

  const scene = new THREE.Scene();
  const envRT = buildEnv(renderer); scene.environment = envRT.texture;
  const camera = new THREE.PerspectiveCamera(40, 1, .1, 400);
  scene.add(new THREE.HemisphereLight(0x6a5aa0, 0x05040a, .3));
  const key = new THREE.DirectionalLight(0xc8b8ff, 1.3); key.position.set(4, 10, 8); scene.add(key);
  const rimL = new THREE.DirectionalLight(0x4fd8ff, 1.6); rimL.position.set(-7, 3, -8); scene.add(rimL);
  const baseL = new THREE.PointLight(0xa58bff, 40, 18, 1.6); baseL.position.set(0, CRY.y0 + 1.2, 1.8); scene.add(baseL);

  const U = { uT: { value: 0 }, uAsp: { value: 1 }, uHor: { value: .25 }, uStarOn: { value: 0 }, uPar: { value: new THREE.Vector2() }, uGal: { value: new THREE.Vector2(.3, .8) }, uStar: { value: new THREE.Vector2(.5, .85) }, uPlanet: { value: new THREE.Vector3(.83, .7, .1) } };
  const defs = { OCT: T.oct };
  const fsGeo = new THREE.PlaneGeometry(2, 2);
  const bgMat = new THREE.ShaderMaterial({ uniforms: U, defines: defs, vertexShader: BG_VERT, fragmentShader: BG_FRAG, depthWrite: false, depthTest: false });
  const bg = new THREE.Mesh(fsGeo, bgMat); bg.frustumCulled = false; bg.renderOrder = -10; scene.add(bg);

  const world = new THREE.Group(); scene.add(world);   // 会被镜像的部分

  // 岩台 + 两侧岩岸 + 浮石
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x1b1630, roughness: .82, metalness: .05, flatShading: true });
  const geos = [];
  const ped = new THREE.Mesh(rockGeo('ped', 7), rockMat); geos.push(ped.geometry); ped.position.y = CRY.y0 - .62; world.add(ped);
  const rockG = rockGeo('ico', 3); geos.push(rockG);
  const rocks = [];
  [[-17, WY - .2, 3, 5, 1.6, 3], [-12.5, WY - .3, 6, 2.2, 1, 2], [15.5, WY - .2, 2, 4.5, 1.8, 3], [11.5, WY - .3, 6.5, 1.8, .8, 1.6], [-6, WY - .35, 7, 1.2, .45, 1], [6.5, WY - .35, 5, 1, .4, .9],
   [-12, 3.2, -6, .8, .6, .7], [13, -1.2, -4, .55, .5, .5], [-9, -2.5, 2, .45, .4, .4]].forEach((r, i) => {
    const m = new THREE.Mesh(rockG, rockMat); m.position.set(r[0], r[1], r[2]); m.scale.set(r[3], r[4], r[5]); m.rotation.set(i * .7, i * 1.3, i * .4); m.userData.fl = r[1] > WY + 1; world.add(m); rocks.push(m);
  });

  // 晶柱 + 花冠
  const cGeo = crystalCluster(); geos.push(cGeo);
  const gU = { uT: U.uT, uK: { value: 1 }, uCore: { value: 1 } };
  const fakeBack = new THREE.ShaderMaterial({ uniforms: { ...gU, uBack: { value: 1 }, uAdd: { value: 0 } }, vertexShader: FAKEGLASS_VERT, fragmentShader: FAKEGLASS_FRAG, transparent: true, depthWrite: false, side: THREE.BackSide });
  const fakeFront = new THREE.ShaderMaterial({ uniforms: { ...gU, uBack: { value: 0 }, uAdd: { value: 0 } }, vertexShader: FAKEGLASS_VERT, fragmentShader: FAKEGLASS_FRAG, transparent: true, depthWrite: true, side: THREE.FrontSide });
  const cBack = new THREE.Mesh(cGeo, fakeBack); cBack.renderOrder = 2; world.add(cBack);
  const cFront = new THREE.Mesh(cGeo, fakeFront); cFront.renderOrder = 3; world.add(cFront);
  let cPhys = null, cAdd = null;
  if (PHYS) {
    const pm = new THREE.MeshPhysicalMaterial({ color: 0xeee8ff, metalness: 0, roughness: .05, transmission: 1, thickness: 1.4, ior: 1.5, dispersion: 4,
      iridescence: .85, iridescenceIOR: 1.35, iridescenceThicknessRange: [180, 720], attenuationColor: new THREE.Color(.72, .64, 1), attenuationDistance: 5,
      specularIntensity: 1, envMapIntensity: 1.5, flatShading: true, emissive: new THREE.Color(.1, .08, .24) });
    cPhys = new THREE.Mesh(cGeo, pm); world.add(cPhys);
    const fakeAdd = new THREE.ShaderMaterial({ uniforms: { ...gU, uBack: { value: 0 }, uAdd: { value: 1 } }, vertexShader: FAKEGLASS_VERT, fragmentShader: FAKEGLASS_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    cAdd = new THREE.Mesh(cGeo, fakeAdd); cAdd.renderOrder = 3; world.add(cAdd);
  }
  // 内部竖直光柱（加色，不做深度测试：它在玻璃里面）
  const beamGeo = new THREE.CylinderGeometry(.34, .12, CRY.h * .9, 20, 1, true);
  const beamMat = new THREE.ShaderMaterial({ uniforms: { uT: U.uT, uK: { value: 1 } }, vertexShader: STD_VERT, fragmentShader: BEAM_FRAG, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending });
  const beam = new THREE.Mesh(beamGeo, beamMat); beam.position.y = CRY.y0 + CRY.h * .45; beam.renderOrder = 4; world.add(beam);

  // 七色光桥（核心 + 柔光外鞘，各 7 段）
  const R0 = .075, RS0 = .36;
  const ribGeos = [], ribCore = [], ribSheath = [], v3 = new THREE.Vector3();
  for (let i = 0; i < 7; i++) {
    const pts = []; for (let k = 0; k <= 40; k++) pts.push(spiral((i + k / 40 * 1.012) / 7, new THREE.Vector3()).clone());
    const curve = new THREE.CatmullRomCurve3(pts);
    const g = new THREE.TubeGeometry(curve, 120, R0, 8, false); ribGeos.push(g);
    const col = new THREE.Color(...RAINBOW[6 - i]);
    const mk = (sheath, k, r0) => new THREE.ShaderMaterial({ uniforms: { uT: U.uT, uCol: { value: col }, uProg: { value: 0 }, uK: { value: k }, uSheath: { value: sheath }, uAmp: { value: 1 }, uR: { value: r0 }, uR0: { value: R0 }, uSeg: { value: i } },
      vertexShader: RIB_VERT, fragmentShader: RIB_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    const sm = new THREE.Mesh(g, mk(1, .8, RS0)); sm.renderOrder = 5; world.add(sm); ribSheath.push(sm);
    const cm = new THREE.Mesh(g, mk(0, 2.0, R0)); cm.renderOrder = 6; world.add(cm); ribCore.push(cm);
  }
  // 光桥火花（无状态粒子）
  const spkMat = new THREE.ShaderMaterial({ uniforms: { uT: U.uT, uPx: { value: 300 }, uLit: { value: new Array(7).fill(0) }, uCols: { value: RAINBOW.slice().reverse().map(c => new THREE.Vector3(...c).multiplyScalar(2.2)) } },
    vertexShader: SPK_VERT, fragmentShader: PTS_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  let spk;
  { const n = T.spk, R = rng(77), d = new Float32Array(n * 4), pos = new Float32Array(n * 3);
    for (let k = 0; k < n; k++) d.set([k % 7, R(), R(), R()], k * 4);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aD', new THREE.BufferAttribute(d, 4));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 1, 0), 14);
    spk = new THREE.Points(g, spkMat); spk.renderOrder = 7; world.add(spk); }

  // 第八颗星
  const star = new THREE.Group(); star.position.y = STAR_Y; world.add(star);
  const sGeo = starGeo(); geos.push(sGeo);
  const starMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1, 1, 1) });
  const sMesh = new THREE.Mesh(sGeo, starMat); sMesh.scale.setScalar(.62); star.add(sMesh);
  const plane = new THREE.PlaneGeometry(1, 1); geos.push(plane);
  const haloMat = new THREE.ShaderMaterial({ uniforms: { uCol: { value: new THREE.Color(.78, .66, 1) }, uK: { value: 0 }, uSpk: { value: 1 }, uRot: { value: 0 } }, vertexShader: GLOW_VERT, fragmentShader: STARGLOW_FRAG, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending });
  const halo = new THREE.Mesh(plane, haloMat); halo.scale.setScalar(11); halo.renderOrder = 9; star.add(halo);

  const baseGlowMat = new THREE.ShaderMaterial({ uniforms: { uCol: { value: new THREE.Color(.62, .5, 1) }, uK: { value: .5 }, uSpk: { value: 0 }, uRot: { value: 0 } }, vertexShader: GLOW_VERT, fragmentShader: STARGLOW_FRAG, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending });
  const baseGlow = new THREE.Mesh(plane, baseGlowMat); baseGlow.position.set(0, CRY.y0 + .6, .6); baseGlow.scale.set(9, 5, 1); baseGlow.renderOrder = 8; world.add(baseGlow);
  // 粒子：水面轨道点环 + 远处星尘
  const ptsMat = new THREE.ShaderMaterial({ uniforms: { uPx: { value: 300 }, uT: U.uT }, vertexShader: PTS_VERT, fragmentShader: PTS_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const orbit = (() => {
    const n = 420, R = rng(5), pos = new Float32Array(n * 3), sz = new Float32Array(n), cc = new Float32Array(n * 3);
    for (let k = 0; k < n; k++) { const ring = k % 3, a = R() * Math.PI * 2, r = [6.2, 7.6, 9.4][ring] + (R() - .5) * .2; pos.set([Math.cos(a) * r, WY + .12 + ring * .05 + Math.sin(a * 2 + ring) * .15, Math.sin(a) * r], k * 3); sz[k] = .8 + R() * 1.6; const c = R() < .5 ? [1.6, 1.3, 2.6] : [.8, 1.8, 2.4]; cc.set(c, k * 3); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aS', new THREE.BufferAttribute(sz, 1)); g.setAttribute('aC', new THREE.BufferAttribute(cc, 3));
    const p = new THREE.Points(g, ptsMat); p.renderOrder = 7; world.add(p); return p;
  })();
  const dust = (() => {
    const n = T.dust, R = rng(9), pos = new Float32Array(n * 3), sz = new Float32Array(n), cc = new Float32Array(n * 3);
    for (let k = 0; k < n; k++) { pos.set([(R() - .5) * 80, WY + .5 + R() * 34, -40 + R() * 52], k * 3); sz[k] = .5 + R() * 1.4; const w = R() < .45; cc.set(w ? [1.1, .7, 1.6] : [.45, 1, 1.2], k * 3); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aS', new THREE.BufferAttribute(sz, 1)); g.setAttribute('aC', new THREE.BufferAttribute(cc, 3));
    const p = new THREE.Points(g, ptsMat); scene.add(p); return p;
  })();

  // 水面（真实一遍才画；镜像那遍隐藏）
  const waterGeo = new THREE.PlaneGeometry(260, 260); waterGeo.rotateX(-Math.PI / 2);
  const waterMat = new THREE.ShaderMaterial({ uniforms: { uT: U.uT, uK: { value: 1 } }, vertexShader: STD_VERT, fragmentShader: WATER_FRAG, transparent: true, depthWrite: true });
  const water = new THREE.Mesh(waterGeo, waterMat); water.position.y = WY; water.renderOrder = 1; scene.add(water);

  /* ---------- 构图 ---------- */
  let portrait = false, baseDist = 31, aimY = 1.6, camY = -3.4;
  const TAN = Math.tan(THREE.MathUtils.degToRad(20));
  function layout(asp) {
    portrait = asp < .95;
    if (portrait) { baseDist = Math.max(28 / (2 * TAN), 13.2 / (2 * TAN * asp)); aimY = .9; camY = -3.0; U.uGal.value.set(.24, .87); U.uPlanet.value.set(.76, .755, .062); }
    else { baseDist = Math.max(22.5 / (2 * TAN), 30 / (2 * TAN * asp)); aimY = 1.9; camY = -3.6; U.uGal.value.set(.32, .84); U.uPlanet.value.set(.81, .77, .085); }
  }

  /* ---------- post ---------- */
  let rt = null, mipsD = [], mipsU = [], downMat, upMat, compMat, fsScene, fsCam, fsMesh;
  function buildPost() {
    disposePost();
    rt = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, samples: T.msaa, depthBuffer: true });
    const mk = () => new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, depthBuffer: false });
    for (let i = 0; i < T.mips; i++) { mipsD.push(mk()); mipsU.push(mk()); }
    downMat = new THREE.ShaderMaterial({ uniforms: { tSrc: { value: null }, uTx: { value: new THREE.Vector2() }, uFirst: { value: 0 } }, vertexShader: FS_VERT, fragmentShader: DOWN_FRAG, depthTest: false, depthWrite: false });
    upMat = new THREE.ShaderMaterial({ uniforms: { tLow: { value: null }, tHigh: { value: null }, uTx: { value: new THREE.Vector2() }, uMix: { value: .62 } }, vertexShader: FS_VERT, fragmentShader: UP_FRAG, depthTest: false, depthWrite: false });
    compMat = new THREE.ShaderMaterial({ uniforms: { tScene: { value: null }, tBloom: { value: null }, uBloom: { value: .085 }, uExp: { value: .95 }, uT: U.uT, uAsp: U.uAsp, uFade: { value: 1 } }, vertexShader: FS_VERT, fragmentShader: COMP_FRAG, depthTest: false, depthWrite: false });
    fsScene = new THREE.Scene(); fsCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1); fsMesh = new THREE.Mesh(fsGeo, compMat); fsMesh.frustumCulled = false; fsScene.add(fsMesh);
    sizePost();
  }
  function disposePost() {
    if (rt) rt.dispose(); mipsD.concat(mipsU).forEach(r => r.dispose()); mipsD = []; mipsU = []; rt = null;
    [downMat, upMat, compMat].forEach(m => m && m.dispose()); downMat = upMat = compMat = null;
  }
  let bw = 1, bh = 1;
  function sizePost() {
    if (!rt) return;
    rt.setSize(bw, bh);
    let w = bw, h = bh; for (let i = 0; i < mipsD.length; i++) { w = Math.max(1, w >> 1); h = Math.max(1, h >> 1); mipsD[i].setSize(w, h); mipsU[i].setSize(w, h); }
  }
  function pass(mat, target) { fsMesh.material = mat; renderer.setRenderTarget(target); renderer.render(fsScene, fsCam); }

  /* ---------- sizing / governor ---------- */
  let scale = 1, cssW = 1, cssH = 1;
  function resize() {
    cssW = Math.max(1, host.clientWidth); cssH = Math.max(1, host.clientHeight);
    const dpr = Math.min(window.devicePixelRatio || 1, T.dpr, Math.sqrt(T.budget / (cssW * cssH))) * scale;
    renderer.setPixelRatio(Math.max(.35, dpr)); renderer.setSize(cssW, cssH, false);
    const v = renderer.getDrawingBufferSize(new THREE.Vector2()); bw = v.x; bh = v.y;
    camera.aspect = cssW / cssH; camera.updateProjectionMatrix(); U.uAsp.value = camera.aspect;
    ptsMat.uniforms.uPx.value = bh * .055; spkMat.uniforms.uPx.value = bh * .05;
    layout(camera.aspect);
    // 像素下限（§25）：光带核心至少约 2.6px 宽，外鞘至少约 10px；被夹宽时亮度按 真宽/夹宽 缩
    const wpp = 2 * TAN * baseDist / bh;
    const rc = Math.max(R0, 1.3 * wpp), rs = Math.max(RS0, 5 * wpp);
    for (let i = 0; i < 7; i++) { const c = ribCore[i].material.uniforms, s = ribSheath[i].material.uniforms; c.uR.value = rc; c.uAmp.value = R0 / rc; s.uR.value = rs; s.uAmp.value = RS0 / rs; }
    sizePost();
  }
  let fAcc = 0, fN = 0, warm = 0, slow = 0, lastChange = 0, longN = 0;
  function govern(raw, now) {
    warm += raw; if (warm < 2.5 || document.hidden) return;
    let fps;
    if (raw > .25) { if (++longN < 3) return; fps = 1 / raw; longN = 0; fAcc = 0; fN = 0; }   // 单帧 >250ms 当偶发卡顿不计；连续 3 帧都这样 = 真的跑不动
    else { longN = 0; fAcc += SLOW ? 1 / 12 : raw; fN++; if (fAcc < 1.5) return; fps = fN / fAcc; fAcc = 0; fN = 0; }
    S.fps = fps;
    if (now - lastChange < 2500) return;
    if (fps < 45) {
      if (scale > .56) { scale = Math.max(.55, scale - .12); lastChange = now; resize(); }
      else if (++slow >= 3) { slow = 0; setTier(lower(tierName), true); lastChange = now; }
    } else { slow = 0; if (fps > 58 && scale < 1) { scale = Math.min(1, scale + .05); lastChange = now; resize(); } }
  }
  function setTier(n, auto) {
    if (!TIERS[n]) return;
    if (!TIERS[n].gl) {   // 降/切到 low：释放 WebGL，回到静态底图
      try { dispatchEvent(new CustomEvent('p3q:tier', { detail: { tier: n, auto: !!auto } })); } catch (e) {}
      stop(); return;
    }
    tierName = n; T = TIERS[n]; scale = 1; slow = 0; fAcc = 0; fN = 0; longN = 0; lastChange = performance.now(); S.tier = n; buildPost(); resize();
    try { dispatchEvent(new CustomEvent('p3q:tier', { detail: { tier: n, auto: !!auto } })); } catch (e) {}
  }

  /* ---------- loop ---------- */
  const mouse = new THREE.Vector2(), par = new THREE.Vector2();
  function onMove(e) { mouse.set(e.clientX / window.innerWidth * 2 - 1, e.clientY / window.innerHeight * 2 - 1); }
  function onTilt(e) { if (e.gamma == null) return; mouse.set(Math.max(-1, Math.min(1, e.gamma / 25)), Math.max(-1, Math.min(1, ((e.beta || 0) - 50) / 25))); }
  function onVis() { if (document.hidden) { cancelAnimationFrame(raf); raf = 0; } else if (!raf && S) { last = performance.now(); raf = requestAnimationFrame(frame); } }
  function onLost(e) { e.preventDefault(); stop(); }
  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('deviceorientation', onTilt, { passive: true });
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', onVis);
  canvas.addEventListener('webglcontextlost', onLost);

  let raf = 0, last = performance.now(), t = opts.t0 || 0, frames = 0, frozen = false;
  try { const m = /[?&]p3t=(\d+(?:\.\d+)?)/.exec(location.search); if (m) { t = +m[1]; frozen = true; } } catch (e) {}
  const ease = x => x < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x);
  const tmp = new THREE.Vector3(), fwd = new THREE.Vector3();
  function animate() {
    U.uT.value = t;
    const lit = spkMat.uniforms.uLit.value;
    for (let i = 0; i < 7; i++) { const p = ease((t - SEG_T0 - i * SEG_DT) / SEG_DT); lit[i] = p; ribCore[i].material.uniforms.uProg.value = p; ribSheath[i].material.uniforms.uProg.value = p; }
    const all = ease((t - STAR_T0) / .9);
    const sOn = ease((t - STAR_T0 + .1) / 1.0);
    const breath = 1 + .06 * Math.sin(t * 1.3);
    starMat.color.setRGB(.5 + 5.2 * sOn, .45 + 4.6 * sOn, .7 + 6.2 * sOn);
    haloMat.uniforms.uK.value = (.12 + 1.15 * sOn) * breath + 1.6 * Math.exp(-Math.pow((t - STAR_T0 - .5) * 2.2, 2)) * sOn;   // 点燃瞬间一闪
    haloMat.uniforms.uSpk.value = .35 + .9 * sOn;
    haloMat.uniforms.uRot.value = Math.sin(t * .2) * .05;
    U.uStarOn.value = sOn;
    sMesh.rotation.y = t * .35; sMesh.rotation.z = Math.sin(t * .25) * .06;
    const core = .55 + .45 * ease((t - .3) / 3) + .25 * all;
    fakeFront.uniforms.uCore.value = core; beamMat.uniforms.uK.value = (.35 + .9 * all) * (1 + .08 * Math.sin(t * 2.1));
    for (let i = 0; i < 7; i++) ribCore[i].material.uniforms.uK.value = 2.0 * (1 + .25 * all);
    orbit.rotation.y = t * .05;
    rocks.forEach((r, i) => { if (r.userData.fl) { r.position.y += Math.sin(t * .4 + i) * .002; r.rotation.y = i * 1.3 + t * .05; } });
    dust.rotation.y = Math.sin(t * .02) * .05;
  }
  function placeCamera(dt) {
    par.lerp(mouse, Math.min(1, dt * 2.2 || 1)); U.uPar.value.set(par.x, -par.y);
    const a = Math.sin(t * .055) * .2 + par.x * .1;
    const D = baseDist * (1 + .018 * Math.sin(t * .11)) * (1.03 - .03 * ease(t / 8));
    camera.position.set(Math.sin(a) * D, camY + Math.sin(t * .09) * .22 - par.y * .5, Math.cos(a) * D);
    camera.lookAt(par.x * .25, aimY, 0);
    camera.updateMatrixWorld();
    camera.getWorldDirection(fwd); fwd.y = 0; fwd.normalize();
    tmp.copy(camera.position).addScaledVector(fwd, 1000); tmp.project(camera); U.uHor.value = .5 + .5 * tmp.y;
    tmp.set(0, STAR_Y, 0).project(camera); U.uStar.value.set(.5 + .5 * tmp.x, .5 + .5 * tmp.y);
    halo.quaternion.copy(camera.quaternion); baseGlow.quaternion.copy(camera.quaternion);
  }
  function drawScene() {
    renderer.setRenderTarget(rt); renderer.clear();
    // 1) 镜像一遍（整组 y 翻转到水面以下；高档的透射玻璃此遍换成假玻璃省帧）
    world.scale.y = -1; world.position.y = 2 * WY; water.visible = false; dust.visible = false; bg.visible = true;
    if (cPhys) { cPhys.visible = false; cAdd.visible = false; cBack.visible = true; cFront.visible = true; }
    renderer.render(scene, camera);
    renderer.clearDepth();
    // 2) 真实一遍
    world.scale.y = 1; world.position.y = 0; water.visible = true; dust.visible = true; bg.visible = false;
    if (cPhys) { cPhys.visible = true; cAdd.visible = true; cBack.visible = false; cFront.visible = false; }
    renderer.render(scene, camera);
  }
  function render(dt) {
    if (!frozen) t += dt;
    animate(); placeCamera(dt);
    drawScene();
    let src = rt.texture, w = bw, h = bh;
    for (let i = 0; i < mipsD.length; i++) { downMat.uniforms.tSrc.value = src; downMat.uniforms.uTx.value.set(1 / w, 1 / h); downMat.uniforms.uFirst.value = i === 0 ? 1 : 0; pass(downMat, mipsD[i]); src = mipsD[i].texture; w = Math.max(1, w >> 1); h = Math.max(1, h >> 1); }
    let low = mipsD[mipsD.length - 1].texture;
    for (let i = mipsD.length - 2; i >= 0; i--) { const lw = mipsD[i + 1].width, lh = mipsD[i + 1].height; upMat.uniforms.tLow.value = low; upMat.uniforms.tHigh.value = mipsD[i].texture; upMat.uniforms.uTx.value.set(1 / lw, 1 / lh); pass(upMat, mipsU[i]); low = mipsU[i].texture; }
    compMat.uniforms.tScene.value = rt.texture; compMat.uniforms.tBloom.value = low;
    pass(compMat, null);
  }
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const raw = (now - last) / 1000; last = now;
    render(Math.min(raw, .1));
    if (++frames === 2) canvas.classList.add('on');
    if (!frozen) govern(raw, now);
  }
  function stop() {
    if (!S) return; cancelAnimationFrame(raf); raf = 0;
    window.removeEventListener('pointermove', onMove); window.removeEventListener('deviceorientation', onTilt); window.removeEventListener('resize', resize);
    document.removeEventListener('visibilitychange', onVis); canvas.removeEventListener('webglcontextlost', onLost);
    disposePost();
    scene.traverse(o => { if (o.geometry) o.geometry.dispose(); const m = o.material; if (m) (Array.isArray(m) ? m : [m]).forEach(x => x.dispose()); });
    geos.concat(ribGeos, [beamGeo, waterGeo, fsGeo]).forEach(g => g.dispose()); fakeBack.dispose(); envRT.dispose();
    renderer.dispose(); try { renderer.forceContextLoss(); } catch (e) {}
    canvas.remove(); S = null; window.__p3dbg = null;
  }

  function pause() { cancelAnimationFrame(raf); raf = 0; document.removeEventListener('visibilitychange', onVis); }
  S = { stop, pause, setTier: n => setTier(n, false), tier: tierName, gpu: pick.gpu, fps: 0 };
  buildPost(); resize();
  // 首帧优先（§42）：先编译着色器再进循环
  try { renderer.compile(scene, camera); } catch (e) {}
  window.__p3dbg = { S, renderer, scene, camera, render, step: (dt, n) => { for (let i = 0; i < (n || 1); i++) render(dt); }, setT: v => { t = v; }, freeze: v => { frozen = v !== false; } };
  if (opts.capture) { render(0.016); canvas.classList.add('on'); }
  else raf = requestAnimationFrame(frame);
  return S;
}
export function stop() { if (S) S.stop(); }
export function setQuality(n) { if (S) { S.setTier(n); return true; } return false; }
export function tier() { return S ? S.tier : null; }
export function pause() { if (S) S.pause(); }
