/* 创世计划 门户 3.0 · 首屏 Three.js 主视觉（11-15）
 * 青绿深空星云 / 七座金色穹顶浮空工坊 / 北斗光桥依次点亮 / 第八颗星（八芒+光晕+轨道环）/ 云海辉光 / 远处旋涡星系。
 * 本地 three r186（复用 ludoterra/vendor/r186，MIT），零外部请求。
 * 管线：HalfFloat HDR RT(MSAA) → 自写 bloom（13-tap 降采样+tent 升采样）→ 合成（曝光、ACES/AgX 混合、分离色调、暗角、胶片颗粒、抖动、sRGB）。
 * 画质三档 high/medium/low（按 GPU 名猜，?p3q= 或 localStorage gn:p3q 覆盖）；fps 调速器先降像素、再降档（只降不升）。
 * 思路致谢见 portal3/LICENSES.md。代码为本项目自写。 */
import * as THREE from '../ludoterra/vendor/r186/three.module.min.js';

let S = null; // 运行状态（单例）

function pickTier(gl) {
  try {
    const m = /[?&]p3q=(high|medium|low)\b/.exec(location.search);
    if (m) return { tier: m[1], forced: true };
    const ls = localStorage.getItem('gn:p3q');
    if (ls === 'high' || ls === 'medium' || ls === 'low') return { tier: ls, forced: true };
  } catch (e) {}
  let name = '';
  try { const ext = gl.getExtension('WEBGL_debug_renderer_info'); name = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER); } catch (e) {}
  name = String(name || '');
  let tier = 'high';
  if (/swiftshader|llvmpipe|software|mali|adreno|powervr|apple gpu/i.test(name)) tier = 'low';
  else if (/intel|uhd|iris|radeon\(tm\) graphics|vega \d+ graphics/i.test(name)) tier = 'medium';
  if (/Mobi|Android/i.test(navigator.userAgent) && tier === 'high') tier = 'medium';
  return { tier, forced: false, gpu: name };
}
const TIERS = {
  high:   { post: true,  msaa: 4, mips: 6, budget: 2.4e6, dpr: 2,   oct: 5, dust: 1400 },
  medium: { post: true,  msaa: 0, mips: 5, budget: 1.4e6, dpr: 1.5, oct: 4, dust: 900 },
  low:    { post: false, msaa: 0, mips: 0, budget: 0.8e6, dpr: 1,   oct: 3, dust: 500 },
};

/* ---------------- shaders ---------------- */
const NOISE = `
float h21(vec2 p){ p = fract(p*vec2(123.34,456.21)); p += dot(p,p+45.32); return fract(p.x*p.y); }
float vn(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(h21(i),h21(i+vec2(1,0)),f.x), mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x), f.y); }
float fbm(vec2 p){ float a=.5, s=0.; mat2 r=mat2(.8,.6,-.6,.8); for(int i=0;i<OCT;i++){ s+=a*vn(p); p=r*p*2.03+11.7; a*=.5; } return s; }
`;
const BG_VERT = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.9999, 1.0); }`;
const BG_FRAG = `
varying vec2 vUv;
uniform float uT, uAsp, uIntro; uniform vec2 uPar, uStar, uGal;
${NOISE}
vec3 stars(vec2 p, float sc, float th){
  vec2 g = p*sc, i = floor(g), f = fract(g)-.5; float r = h21(i);
  if (r < th) return vec3(0.);
  vec2 o = vec2(h21(i+7.1), h21(i+3.3))-.5; float d = length(f-o*.7);
  float tw = .65+.35*sin(uT*(1.+r*3.)+r*40.);
  float b = pow((r-th)/(1.-th), 3.)*tw;
  return mix(vec3(.75,.9,1.), vec3(1.,.85,.6), h21(i+1.9)) * b * (smoothstep(.09,.0,d)*3. + smoothstep(.35,.0,d)*.15);
}
void main(){
  vec2 uv = vUv; vec2 p = vec2((uv.x-.5)*uAsp, uv.y-.5);
  vec3 col = mix(vec3(.004,.016,.028), vec3(.006,.03,.045), uv.y);
  // 星云：4 层切片，各自视差 → 体积感
  float dens = 0.; vec3 neb = vec3(0.);
  for (int i=0;i<4;i++){
    float fi = float(i);
    vec2 q = p*(1.6+fi*.35) + uPar*(.05+fi*.035) + vec2(fi*3.7, fi*1.3) + vec2(uT*.004*(fi+1.), 0.);
    vec2 w = vec2(fbm(q*1.3+3.1), fbm(q*1.3-7.4));
    float n = fbm(q + w*1.6);
    float band = exp(-pow((p.y + p.x*.55 + .02)*2.4, 2.));       // 斜向主星云带
    float d = smoothstep(.5, 1.0, n) * (.12 + band*1.0);
    vec3 c = mix(vec3(.02,.20,.24), vec3(.10,.62,.60), smoothstep(.55,1.,n));
    c = mix(c, vec3(.55,.95,.9), smoothstep(.75,1.,n)*band*1.2);
    neb += c * d * (1.-dens) * .42; dens += d*.25*(1.-dens);
  }
  col += neb;
  // 暖色内散射：靠近第八颗星
  float ds = length((uv-uStar)*vec2(uAsp,1.));
  col += vec3(1.,.72,.35) * (exp(-ds*3.2)*.18 + exp(-ds*9.)*.25) * dens * 3. * uIntro;
  col += vec3(1.,.75,.4) * exp(-ds*5.)*.05 * uIntro;
  // 星点（两层）
  col += stars(p + uPar*.01, 90., .93) * (1.-dens*.6);
  col += stars(p + uPar*.02, 34., .975) * 1.4;
  // 旋涡星系
  vec2 g = (uv-uGal)*vec2(uAsp,1.); float ca=cos(.45), sa=sin(.45); g = mat2(ca,-sa,sa,ca)*g; g.y /= .36;
  float r = length(g), a = atan(g.y, g.x);
  float arm = pow(.5+.5*sin(2.*a - log(r+1e-3)*5.2 - uT*.03), 3.);
  float gd = exp(-r*11.) * (.35 + arm*1.2) * smoothstep(.005,.03,r) * (.7+.6*fbm(g*30.));
  col += mix(vec3(.55,.75,1.), vec3(1.,.9,.75), exp(-r*25.)) * (gd*1.6 + exp(-r*60.)*2.2);
  // 云海（下方）
  float cy = uv.y - .30 + .07*sin(p.x*2.1+.7) + .05*sin(p.x*5.3);
  vec2 cq = vec2(p.x*2.2 + uPar.x*.12 + uT*.006, uv.y*4.);
  float cn = fbm(cq + fbm(cq*1.7)*1.2); float cb = fbm(cq*2.6+5.);
  float cl = smoothstep(.02, -.22, cy - (cn-.5)*.22);
  float rim = smoothstep(.0, -.05, cy - (cn-.5)*.22) * (1.-smoothstep(-.05,-.2, cy - (cn-.5)*.22));
  vec3 ccol = mix(vec3(.004,.02,.03), vec3(.06,.2,.24), smoothstep(.45,.85,cn*.55+cb*.55)) * (.6+.8*smoothstep(-.25,0.,cy));
  ccol += vec3(1.,.66,.3) * rim * (.15 + 1.4*exp(-pow((p.x+.22*uAsp)*2.,2.)) + .5*exp(-pow((p.x-.2*uAsp)*2.5,2.))) * (.4+.6*uIntro);
  
  col = mix(col, ccol, cl);
  gl_FragColor = vec4(col, 1.);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;
const FRONT_FRAG = `
varying vec2 vUv; uniform float uT, uAsp; uniform vec2 uPar;
${NOISE}
void main(){
  vec2 p = vec2((vUv.x-.5)*uAsp, vUv.y);
  vec2 q = vec2(p.x*1.6 + uPar.x*.25 + uT*.01, p.y*3.);
  float n = fbm(q + fbm(q*1.9+4.)*1.3);
  float e = .16 + .06*sin(p.x*3.+1.) + (n-.5)*.2;
  float a = smoothstep(e, e-.12, p.y);
  float rim = smoothstep(e, e-.03, p.y) - smoothstep(e-.03, e-.11, p.y);
  vec3 c = mix(vec3(.004,.018,.026), vec3(.04,.13,.16), n) + vec3(1.,.65,.3)*rim*.5;
  gl_FragColor = vec4(c, a*.92);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;
const STD_VERT = `varying vec2 vUv; varying vec3 vN, vV; void main(){ vUv = uv; vec4 mv = modelViewMatrix*vec4(position,1.); vN = normalize(normalMatrix*normal); vV = -mv.xyz; gl_Position = projectionMatrix*mv; }`;
const GLASS_FRAG = `
varying vec3 vN, vV; varying vec2 vUv; uniform float uK;
void main(){
  vec3 n = normalize(vN), v = normalize(vV); float f = pow(1.-abs(dot(n,v)), 2.5);
  float lowWarm = smoothstep(.9, .1, vUv.y);
  vec3 c = vec3(1.,.62,.28)*(1.-f)*(.08+.35*lowWarm)*uK + vec3(.55,.95,1.)*f*.9 + vec3(1.,.8,.5)*pow(f,6.)*1.5;
  gl_FragColor = vec4(c, .1 + f*.5);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;
const BRIDGE_FRAG = `
varying vec2 vUv; uniform float uProg, uT;
void main(){
  float x = vUv.x; if (x > uProg) discard;
  float head = exp(-pow((x-uProg)*14., 2.)) * step(uProg, .999);
  float pulse = exp(-pow((fract(x*1.5 - uT*.22)-.5)*16., 2.));
  vec3 c = vec3(1.,.68,.28) * (2.2 + pulse*3. + head*14.);
  gl_FragColor = vec4(c, 1.);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;
const GLOW_VERT = `varying vec2 vUv; void main(){ vUv = uv*2.-1.; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`;
const GLOW_FRAG = `
varying vec2 vUv; uniform vec3 uCol; uniform float uK, uSpk;
void main(){
  float r = length(vUv); float a = atan(vUv.y, vUv.x);
  float g = exp(-r*r*7.)*1.2 + exp(-r*3.2)*.35;
  float sp = pow(abs(cos(a*4.)), 60.) * exp(-r*2.4) * uSpk + pow(abs(cos(a*4.+.3927)), 90.)*exp(-r*4.)*uSpk*.5;
  float m = (g + sp) * smoothstep(1., .7, r);
  gl_FragColor = vec4(uCol*m*uK, 1.);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;
const PTS_VERT = `attribute float aS; attribute vec3 aC; varying vec3 vC; uniform float uPx, uT;
void main(){ vec4 mv = modelViewMatrix*vec4(position,1.); vC = aC*(.75+.25*sin(uT*1.7+position.x*3.1+position.y*5.)); gl_PointSize = aS*uPx/(-mv.z); gl_Position = projectionMatrix*mv; }`;
const PTS_FRAG = `varying vec3 vC; void main(){ vec2 d = gl_PointCoord-.5; float r = length(d)*2.; float m = exp(-r*r*5.)*(1.-r); if (m <= 0.) discard; gl_FragColor = vec4(vC*m, 1.);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
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
  c += texture2D(tBloom, vUv).rgb * uBloom;
  c *= uExp;
  c = mix(aces(c), agx(c), .55);
  float l = luma(c);
  c += mix(vec3(-.006,.012,.016), vec3(.02,.008,-.012), smoothstep(.15,.7,l));   // 分离色调：暗部青、亮部暖
  c = mix(vec3(l), c, 1.06);
  c = c*(1.-.03) + vec3(.004,.012,.016);                                         // 抬起的青色黑位
  vec2 d = (vUv-.5)*vec2(uAsp,1.); c *= 1. - smoothstep(.45, 1.25, length(d))*.55; // 暗角
  float gr = hh(vUv*1717. + fract(uT*7.13)*91.) - .5;
  c += gr * .022 * (1.-l*.6);                                                      // 胶片颗粒
  c = max(c, 0.);
  c = mix(c*12.92, 1.055*pow(c, vec3(1./2.4)) - .055, step(.0031308, c));          // sRGB
  c += (hh(gl_FragCoord.xy + fract(uT)) - .5)/255.;
  gl_FragColor = vec4(c*uFade, 1.);
}`;

/* ---------------- scene ---------------- */
// 构图（取自 c2）：屏幕比例坐标 [fx, fy(自上)]，北斗走势：G→F→A→B→C→D→E→★
const NODES_L = [[.59,.66],[.27,.66],[.09,.43],[.15,.20],[.39,.20],[.59,.29],[.72,.47]];
const STAR_L = [.905,.40];
const NODES_P = [[.70,.70],[.30,.66],[.18,.50],[.26,.32],[.62,.27],[.80,.40],[.62,.52]];
const STAR_P = [.80,.13];

function buildEnv(renderer) {
  const sc = new THREE.Scene();
  const m = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, vertexShader: `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `varying vec3 vP; void main(){ vec3 d = normalize(vP);
      vec3 c = mix(vec3(.02,.12,.14), vec3(.03,.22,.24), smoothstep(-.2,.8,d.y));
      c += vec3(1.,.62,.28)*smoothstep(-.1,-.6,d.y)*1.6;                // 下方云海暖光
      c += vec3(1.,.8,.5)*pow(max(dot(d, normalize(vec3(.9,.2,.4))),0.), 24.)*14.;  // 第八颗星方向
      c += vec3(1.,.7,.4)*pow(max(dot(d, normalize(vec3(-.5,.1,.8))),0.), 8.)*2.;
      c += vec3(.4,.9,.9)*pow(max(dot(d, normalize(vec3(.1,.9,.3))),0.), 6.)*.8;
      gl_FragColor = vec4(c,1.); }` });
  sc.add(new THREE.Mesh(new THREE.SphereGeometry(10, 32, 16), m));
  const pm = new THREE.PMREMGenerator(renderer);
  const rt = pm.fromScene(sc, 0.04);
  pm.dispose(); m.dispose(); sc.children[0].geometry.dispose();
  return rt;
}

function makeDomeKit() {
  const gold = new THREE.MeshStandardMaterial({ color: 0xd9a54c, metalness: 1, roughness: .3, emissive: 0x2a1704 });
  const darkGold = new THREE.MeshStandardMaterial({ color: 0x6e4a1e, metalness: 1, roughness: .5, emissive: 0x0a0501 });
  const glass = new THREE.ShaderMaterial({ uniforms: { uK: { value: 1 } }, vertexShader: STD_VERT, fragmentShader: GLASS_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide });
  const lamp = new THREE.MeshBasicMaterial({ color: new THREE.Color(4.5, 2.6, 1.1) });
  const G = {
    base: new THREE.CylinderGeometry(1.95, 1.55, .32, 48),
    rim: new THREE.TorusGeometry(1.98, .055, 6, 64),
    rail: new THREE.TorusGeometry(1.7, .025, 5, 64),
    cone: new THREE.ConeGeometry(1.35, 1.5, 24, 1, true),
    under: new THREE.CylinderGeometry(.9, .5, .4, 24),
    dome: new THREE.SphereGeometry(1.62, 40, 18, 0, Math.PI * 2, 0, Math.PI / 2),
    rib: new THREE.TorusGeometry(1.62, .028, 5, 40, Math.PI),
    lat: new THREE.TorusGeometry(1.4, .022, 5, 48),
    spire: new THREE.ConeGeometry(.14, .7, 8),
    knob: new THREE.SphereGeometry(.12, 10, 8),
    pend: new THREE.CylinderGeometry(.03, .03, 1, 6),
    bulb: new THREE.SphereGeometry(.13, 10, 8),
    box: new THREE.BoxGeometry(.32, .32, .32),
    col: new THREE.CylinderGeometry(.12, .2, 1.1, 10),
    plane: new THREE.PlaneGeometry(1, 1),
  };
  return { gold, darkGold, glass, lamp, G };
}

function makeDome(kit, glowMat, i) {
  const { G, gold, darkGold, glass, lamp } = kit;
  const g = new THREE.Group();
  const add = (geo, mat, x, y, z, rx, ry, rz) => { const m = new THREE.Mesh(geo, mat); m.position.set(x || 0, y || 0, z || 0); m.rotation.set(rx || 0, ry || 0, rz || 0); g.add(m); return m; };
  add(G.base, gold, 0, 0, 0);
  add(G.rim, gold, 0, .16, 0, Math.PI / 2);
  add(G.rail, gold, 0, .55, 0, Math.PI / 2);
  add(G.cone, darkGold, 0, -.85, 0, Math.PI).scale.set(.85, .8, .85);
  add(G.under, gold, 0, -.3, 0);
  add(G.lat, gold, 0, .85, 0, Math.PI / 2);
  for (let k = 0; k < 8; k++) add(G.rib, gold, 0, .16, 0, 0, k * Math.PI / 8, 0);
  const d = add(G.dome, glass, 0, .16, 0); d.renderOrder = 2;
  add(G.spire, gold, 0, 1.75 + .35, 0);
  add(G.knob, lamp, 0, 2.5, 0);
  add(G.col, gold, 0, .7, 0);
  for (let k = 0; k < 3; k++) { const a = k * 2.1 + i; const b = add(G.box, lamp, Math.cos(a) * .8, .38, Math.sin(a) * .8, 0, a, 0); b.scale.setScalar(.6 + .3 * ((i + k) % 2)); }
  // 底部垂饰与小灯
  const p = add(G.pend, gold, 0, -2.1, 0); p.scale.y = .9;
  add(G.bulb, lamp, 0, -2.6, 0);
  for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3 + .3; const pp = add(G.pend, darkGold, Math.cos(a) * 1.25, -.55, Math.sin(a) * 1.25); pp.scale.y = .55; add(G.bulb, lamp, Math.cos(a) * 1.25, -.85, Math.sin(a) * 1.25).scale.setScalar(.6); }
  // 内部暖光（billboard）
  const gl = new THREE.Mesh(G.plane, glowMat); gl.position.set(0, .7, 0); gl.scale.setScalar(4.2); gl.renderOrder = 3; g.add(gl); g.userData.glow = gl;
  return g;
}

function starGeo() {
  const s = new THREE.Shape(); const N = 8;
  for (let k = 0; k < N * 2; k++) { const a = k * Math.PI / N + Math.PI / 2, r = k % 2 ? .48 : 1.55; const x = Math.cos(a) * r, y = Math.sin(a) * r; k ? s.lineTo(x, y) : s.moveTo(x, y); }
  s.closePath();
  const geo = new THREE.ExtrudeGeometry(s, { depth: .18, bevelEnabled: true, bevelThickness: .08, bevelSize: .06, bevelSegments: 1 });
  geo.translate(0, 0, -.13); return geo;
}

function scaffold() {
  const v = []; const W = 1.4, H = 3.2, L = 4; // 星下脚手架
  for (let y = 0; y <= L; y++) { const yy = -H * y / L; const c = [[-W, -W], [W, -W], [W, W], [-W, W]]; for (let k = 0; k < 4; k++) { const a = c[k], b = c[(k + 1) % 4]; v.push(a[0], yy, a[1], b[0], yy, b[1]); } }
  [[-W, -W], [W, -W], [W, W], [-W, W]].forEach(c => v.push(c[0], 0, c[1], c[0], -H, c[1]));
  for (let y = 0; y < L; y++) { const y0 = -H * y / L, y1 = -H * (y + 1) / L; v.push(-W, y0, W, W, y1, W, W, y0, -W, -W, y1, -W); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); return geo;
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
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.AgXToneMapping; renderer.toneMappingExposure = 1.15; // 低档直出用；高中档走自写合成
  renderer.setClearColor(0x02060b, 1);
  host.insertBefore(canvas, host.firstChild);

  const scene = new THREE.Scene();
  const envRT = buildEnv(renderer); scene.environment = envRT.texture;
  const camera = new THREE.PerspectiveCamera(40, 1, .1, 400);
  scene.add(new THREE.HemisphereLight(0x3fa0a0, 0x6a3a10, .35));
  const key = new THREE.DirectionalLight(0xffd29a, 1.6); key.position.set(10, 4, 8); scene.add(key);
  const under = new THREE.DirectionalLight(0xff9a4a, 1.0); under.position.set(-3, -8, 4); scene.add(under);

  const U = { uT: { value: 0 }, uAsp: { value: 1 }, uIntro: { value: 0 }, uPar: { value: new THREE.Vector2() }, uStar: { value: new THREE.Vector2(.9, .6) }, uGal: { value: new THREE.Vector2(.75, .87) } };
  const defs = { OCT: T.oct };
  const fsGeo = new THREE.PlaneGeometry(2, 2);
  const bgMat = new THREE.ShaderMaterial({ uniforms: U, defines: defs, vertexShader: BG_VERT, fragmentShader: BG_FRAG, depthWrite: false, depthTest: false });
  const bg = new THREE.Mesh(fsGeo, bgMat); bg.frustumCulled = false; bg.renderOrder = -10; scene.add(bg);
  const frontMat = new THREE.ShaderMaterial({ uniforms: U, defines: defs, vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }`, fragmentShader: FRONT_FRAG, transparent: true, depthWrite: false, depthTest: false });
  const front = new THREE.Mesh(fsGeo, frontMat); front.frustumCulled = false; front.renderOrder = 50; scene.add(front);

  const kit = makeDomeKit();
  const glowMat = new THREE.ShaderMaterial({ uniforms: { uCol: { value: new THREE.Color(1, .62, .28) }, uK: { value: 1.6 }, uSpk: { value: 0 } }, vertexShader: GLOW_VERT, fragmentShader: GLOW_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const world = new THREE.Group(); scene.add(world);
  const domes = []; for (let i = 0; i < 7; i++) { const d = makeDome(kit, glowMat, i); d.rotation.y = i * .7; world.add(d); domes.push(d); }

  // 第八颗星
  const star = new THREE.Group(); world.add(star);
  const sGeo = starGeo();
  const starMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(9, 7.5, 4.6) });
  const sMesh = new THREE.Mesh(sGeo, starMat); star.add(sMesh);
  const haloMat = new THREE.ShaderMaterial({ uniforms: { uCol: { value: new THREE.Color(1, .82, .5) }, uK: { value: 0 }, uSpk: { value: 1.4 } }, vertexShader: GLOW_VERT, fragmentShader: GLOW_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const halo = new THREE.Mesh(kit.G.plane, haloMat); halo.scale.setScalar(8.5); halo.renderOrder = 4; star.add(halo);
  const ringMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 1.5, .6) });
  const ringGeo1 = new THREE.TorusGeometry(3.1, .03, 6, 120), ringGeo2 = new THREE.TorusGeometry(2.3, .022, 6, 100);
  const ring1 = new THREE.Mesh(ringGeo1, ringMat); ring1.rotation.set(1.25, .25, 0); star.add(ring1);
  const ring2 = new THREE.Mesh(ringGeo2, ringMat); ring2.rotation.set(1.1, -.5, .3); star.add(ring2);
  const scafGeo = scaffold(); const scafMat = new THREE.LineBasicMaterial({ color: new THREE.Color(1.6, 1.05, .45) });
  const scaf = new THREE.LineSegments(scafGeo, scafMat); scaf.position.y = -1.6; star.add(scaf);
  const plat = new THREE.Mesh(kit.G.base, kit.gold); plat.scale.setScalar(.85); plat.position.y = -4.9; star.add(plat);

  // 光点（轨道粒子 + 桥灯 + 星尘）
  const ptsMat = new THREE.ShaderMaterial({ uniforms: { uPx: { value: 300 }, uT: U.uT }, vertexShader: PTS_VERT, fragmentShader: PTS_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  let lampPts = null, bridges = [], ringPts;
  { // 环上粒子
    const n = 220, pos = new Float32Array(n * 3), sz = new Float32Array(n), cc = new Float32Array(n * 3);
    for (let k = 0; k < n; k++) { const a = Math.random() * Math.PI * 2, r = (k % 2 ? 3.1 : 2.3) + (Math.random() - .5) * .25; pos.set([Math.cos(a) * r, Math.sin(a) * r, (Math.random() - .5) * .15], k * 3); sz[k] = 1 + Math.random() * 2.5; cc.set([2.2, 1.5, .7], k * 3); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('aS', new THREE.BufferAttribute(sz, 1)); geo.setAttribute('aC', new THREE.BufferAttribute(cc, 3));
    ringPts = new THREE.Points(geo, ptsMat); ringPts.rotation.copy(ring1.rotation); star.add(ringPts);
  }
  const dust = (() => {
    const n = T.dust, pos = new Float32Array(n * 3), sz = new Float32Array(n), cc = new Float32Array(n * 3);
    for (let k = 0; k < n; k++) { pos.set([(Math.random() - .5) * 70, (Math.random() - .5) * 40, -30 + Math.random() * 45], k * 3); sz[k] = .6 + Math.random() * 1.6; const w = Math.random() < .3; cc.set(w ? [1.4, 1, .55] : [.5, 1, 1.05], k * 3); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('aS', new THREE.BufferAttribute(sz, 1)); geo.setAttribute('aC', new THREE.BufferAttribute(cc, 3));
    const p = new THREE.Points(geo, ptsMat); scene.add(p); return p;
  })();

  const bridgeMats = [];
  let layoutKey = '', baseDist = 33, aimY = 0;
  function layout(asp) {
    const portrait = asp < .95; const k = portrait ? 'p' : 'l';
    if (k === layoutKey) return; layoutKey = k;
    const W = portrait ? 22 : 36, H = portrait ? 36 : 24;
    const nodes = portrait ? NODES_P : NODES_L, sp = portrait ? STAR_P : STAR_L;
    const zs = [1.5, .5, -1, -2.5, -2, -1.5, 0];
    const sc = portrait ? .82 : 1;
    const P = nodes.map((n, i) => new THREE.Vector3((n[0] - .5) * W, (.5 - n[1]) * H, zs[i]));
    domes.forEach((d, i) => { d.position.copy(P[i]); d.scale.setScalar(sc * 1.3 * (i === 0 || i === 1 ? 1.08 : 1)); });
    const SP = new THREE.Vector3((sp[0] - .5) * W, (.5 - sp[1]) * H, -1); star.position.copy(SP); star.scale.setScalar(sc);
    U.uStar.value.set(sp[0], 1 - sp[1]); U.uGal.value.set(portrait ? .3 : .74, portrait ? .9 : .87);
    // 光桥
    bridges.forEach(b => { world.remove(b); b.geometry.dispose(); }); bridges = [];
    const ends = P.concat([SP]); const lamps = [];
    for (let i = 0; i < 7; i++) {
      const a = ends[i].clone(), b = ends[i + 1].clone();
      const dir = b.clone().sub(a).setY(0).normalize();
      a.addScaledVector(dir, 2.5 * sc); b.addScaledVector(dir, -(i === 6 ? 1.6 : 2.5) * sc); a.y += .1; b.y += i === 6 ? -1.2 * sc : .1;
      const m = a.clone().lerp(b, .5); m.y -= .35;
      const curve = new THREE.QuadraticBezierCurve3(a, m, b);
      if (!bridgeMats[i]) bridgeMats[i] = new THREE.ShaderMaterial({ uniforms: { uProg: { value: 0 }, uT: U.uT }, vertexShader: STD_VERT, fragmentShader: BRIDGE_FRAG });
      const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 48, .055 * sc, 6), bridgeMats[i]); world.add(mesh); bridges.push(mesh);
      const len = curve.getLength(), n = Math.max(3, Math.round(len / 1.3));
      for (let j = 1; j < n; j++) { const q = curve.getPoint(j / n); lamps.push([q.x, q.y + .22, q.z, i, j / n]); }
    }
    domes.forEach(d => { for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3 + .3 + d.rotation.y; lamps.push([d.position.x + Math.cos(a) * 1.62 * sc, d.position.y - 1.1 * sc, d.position.z + Math.sin(a) * 1.62 * sc, -1, 0]); } lamps.push([d.position.x, d.position.y - 3.38 * sc, d.position.z, -1, 0]); });
    if (lampPts) { world.remove(lampPts); lampPts.geometry.dispose(); }
    const n = lamps.length, pos = new Float32Array(n * 3), sz = new Float32Array(n), cc = new Float32Array(n * 3);
    lamps.forEach((l, k) => { pos.set(l.slice(0, 3), k * 3); sz[k] = l[3] < 0 ? 4.5 : 6; cc.set(l[3] < 0 ? [3, 1.8, .8] : [3.4, 2.6, 1.6], k * 3); });
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('aS', new THREE.BufferAttribute(sz, 1)); geo.setAttribute('aC', new THREE.BufferAttribute(cc, 3));
    lampPts = new THREE.Points(geo, ptsMat); lampPts.userData.l = lamps; world.add(lampPts);
    baseDist = portrait ? 50 : 33; aimY = 0;
  }

  /* ---------- post ---------- */
  let rt = null, mipsD = [], mipsU = [], downMat, upMat, compMat, fsScene, fsCam, fsMesh;
  function buildPost() {
    disposePost();
    if (!T.post) return;
    rt = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, samples: T.msaa, depthBuffer: true });
    const mk = () => new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, depthBuffer: false });
    for (let i = 0; i < T.mips; i++) { mipsD.push(mk()); mipsU.push(mk()); }
    downMat = new THREE.ShaderMaterial({ uniforms: { tSrc: { value: null }, uTx: { value: new THREE.Vector2() }, uFirst: { value: 0 } }, vertexShader: FS_VERT, fragmentShader: DOWN_FRAG, depthTest: false, depthWrite: false });
    upMat = new THREE.ShaderMaterial({ uniforms: { tLow: { value: null }, tHigh: { value: null }, uTx: { value: new THREE.Vector2() }, uMix: { value: .62 } }, vertexShader: FS_VERT, fragmentShader: UP_FRAG, depthTest: false, depthWrite: false });
    compMat = new THREE.ShaderMaterial({ uniforms: { tScene: { value: null }, tBloom: { value: null }, uBloom: { value: .11 }, uExp: { value: 1.0 }, uT: U.uT, uAsp: U.uAsp, uFade: { value: 1 } }, vertexShader: FS_VERT, fragmentShader: COMP_FRAG, depthTest: false, depthWrite: false });
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
    ptsMat.uniforms.uPx.value = bh * .065;
    layout(camera.aspect);
    // 横屏：按 36×24 构图取景；过宽时以宽度为准
    const t = Math.tan(THREE.MathUtils.degToRad(20));
    if (camera.aspect >= .95) baseDist = Math.max(24 / (2 * t), 36 / (2 * t * camera.aspect)) * 1.02;
    else baseDist = Math.max(36 / (2 * t), 22 / (2 * t * camera.aspect)) * .98;
    sizePost();
  }
  let fAcc = 0, fN = 0, warm = 0, slow = 0, lastChange = 0;
  function govern(raw, now) {
    warm += raw; if (warm < 2.5 || raw > .25 || document.hidden) return;
    fAcc += raw; fN++;
    if (fAcc < 1.5) return;
    const fps = fN / fAcc; fAcc = 0; fN = 0; S.fps = fps;
    if (now - lastChange < 2500) return;
    if (fps < 45) {
      if (scale > .56) { scale = Math.max(.55, scale - .12); lastChange = now; resize(); }
      else if (++slow >= 3 && !pick.forced && tierName !== 'low') { slow = 0; setTier(tierName === 'high' ? 'medium' : 'low'); lastChange = now; }
    } else { slow = 0; if (fps > 58 && scale < 1) { scale = Math.min(1, scale + .05); lastChange = now; resize(); } }
  }
  function setTier(n) { tierName = n; T = TIERS[n]; scale = 1; S.tier = n; buildPost(); resize(); }

  /* ---------- loop ---------- */
  const mouse = new THREE.Vector2(), par = new THREE.Vector2();
  function onMove(e) { mouse.set(e.clientX / window.innerWidth * 2 - 1, e.clientY / window.innerHeight * 2 - 1); }
  function onVis() { if (document.hidden) { cancelAnimationFrame(raf); raf = 0; } else if (!raf && S) { last = performance.now(); raf = requestAnimationFrame(frame); } }
  function onLost(e) { e.preventDefault(); stop(); }
  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', onVis);
  canvas.addEventListener('webglcontextlost', onLost);

  let raf = 0, last = performance.now(), t = opts.t0 || 0, frames = 0;
  try { const m = /[?&]p3t=(\d+)/.exec(location.search); if (m) t = +m[1]; } catch (e) {}
  const ease = x => x < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x);
  function render(dt) {
    t += dt; U.uT.value = t;
    const intro = ease(t / 1.5); U.uIntro.value = intro;
    for (let i = 0; i < 7; i++) bridgeMats[i].uniforms.uProg.value = ease((t - 1 - i * .62) / .7);
    const sOn = ease((t - 5.3) / 1.2);
    starMat.color.setRGB(1.2 + 7.8 * sOn, 1 + 6.5 * sOn, .6 + 4 * sOn);
    haloMat.uniforms.uK.value = .3 + sOn * (1.1 + .15 * Math.sin(t * 1.3));
    sMesh.rotation.z = Math.sin(t * .25) * .08; sMesh.rotation.y = Math.sin(t * .4) * .25;
    ring1.rotation.z = t * .12; ring2.rotation.z = -t * .17; ringPts.rotation.z = t * .12;
    glowMat.uniforms.uK.value = 1.25 + .15 * Math.sin(t * 1.1);
    domes.forEach((d, i) => { d.position.y += Math.sin(t * .5 + i * 1.3) * .0015; d.userData.glow.quaternion.copy(camera.quaternion); });
    halo.quaternion.copy(camera.quaternion);
    // 镜头：慢推 + 视差
    par.lerp(mouse, Math.min(1, dt * 2.2)); U.uPar.value.set(par.x, -par.y);
    const push = 1.06 - .06 * ease(t / 40);
    camera.position.set(par.x * 1.4 + Math.sin(t * .05) * .6, aimY - par.y * .8 + Math.sin(t * .07) * .3, baseDist * push);
    camera.lookAt(par.x * .4, aimY, 0);
    dust.rotation.y = Math.sin(t * .02) * .04;
    if (!T.post) { renderer.setRenderTarget(null); renderer.render(scene, camera); return; }
    renderer.setRenderTarget(rt); renderer.render(scene, camera);
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
    govern(raw, now);
  }
  function stop() {
    if (!S) return; cancelAnimationFrame(raf); raf = 0;
    window.removeEventListener('pointermove', onMove); window.removeEventListener('resize', resize);
    document.removeEventListener('visibilitychange', onVis); canvas.removeEventListener('webglcontextlost', onLost);
    disposePost();
    scene.traverse(o => { if (o.geometry) o.geometry.dispose(); const m = o.material; if (m) (Array.isArray(m) ? m : [m]).forEach(x => x.dispose()); });
    Object.values(kit.G).forEach(g => g.dispose()); envRT.dispose(); fsGeo.dispose();
    renderer.dispose(); try { renderer.forceContextLoss(); } catch (e) {}
    canvas.remove(); S = null; window.__p3dbg = null;
  }

  function pause() { cancelAnimationFrame(raf); raf = 0; document.removeEventListener('visibilitychange', onVis); }
  S = { stop, pause, tier: tierName, gpu: pick.gpu, fps: 0 };
  buildPost(); resize();
  window.__p3dbg = { S, renderer, scene, camera, step: (dt, n) => { for (let i = 0; i < (n || 1); i++) render(dt); }, setT: v => { t = v; } };
  if (opts.capture) { render(0.016); canvas.classList.add('on'); }
  else raf = requestAnimationFrame(frame);
  return S;
}
export function stop() { if (S) S.stop(); }
export function pause() { if (S) S.pause(); }
