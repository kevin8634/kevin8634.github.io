/* 深空层 V1 开场:水面⇄深空一镜到底(构图对照 门户2.0概念/深空概念图01c_电影写实)
 * 上半:真实银河全景(ESO/S. Brunier)+ 七色世界星;中部:海面着色器(波纹法线、菲涅尔、倒映银河与七色星);
 * 水线以下:七道体积光柱、真实影像星系/星云 billboard(ESA/Hubble、ESA/Webb、ESO)、底部黑洞。
 * 参数与机位见 deep/docs/视觉规范_V0.md;素材台账见 deep/LICENSES.md。零外部请求。 */
export const REF = { w: 1376, h: 768, horizon: 210, waterline: 300 };
export const WL0 = 1 - REF.waterline / REF.h; // 水线在屏幕上的高度(自下而上 0..1)
// 七色世界星(01c 自左向右):蓝 紫 橙 绿 青 金 白
export const STAR7 = [
  { x: 200, y: 117, c: 0x5a96ff }, { x: 362, y: 117, c: 0xb07cff }, { x: 522, y: 117, c: 0xff8a3c },
  { x: 686, y: 117, c: 0x48ff7c }, { x: 850, y: 117, c: 0x30e8e0 }, { x: 1013, y: 114, c: 0xffc24a }, { x: 1178, y: 114, c: 0xf2f5ff }];

const SKY_GLSL = `
uniform sampler2D tSky; uniform float uKu,uKv,uEl0,uTilt,uSkyExp,uSkySat;
vec3 skyCol(vec3 d){
  float az=atan(d.x,-d.z); float el=asin(clamp(d.y,-1.,1.));
  vec2 uv=vec2(.5+az*uKu,.5+(el-uEl0-az*uTilt)*uKv);
  vec3 c=texture2D(tSky,uv).rgb;
  float l=dot(c,vec3(.2126,.7152,.0722)); c=max(mix(vec3(l),c,uSkySat),0.);
  c*=uSkyExp*(1.+.5*smoothstep(.12,.0,abs(uv.y-.5))*l); // 银河核心提亮(真实影像本底偏暗)
  c*=vec3(1.08,.98,.9); // 01c 暖色尘埃偏色
  return c*smoothstep(-.004,.02,el);
}`;

export function createOpening(THREE, { mob = false, base = "./assets/v1/" } = {}) {
  const mgr = new THREE.LoadingManager();
  const ready = new Promise((res) => { mgr.onLoad = res; mgr.onError = () => {}; });
  const loader = new THREE.TextureLoader(mgr);
  const T = (f, wrap) => { const t = loader.load(base + f); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; if (wrap) { t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.MirroredRepeatWrapping; } return t; };
  const tSky = T("sky-milkyway.webp", 1);
  const U = { uTime: { value: 0 }, uPR: { value: 1 } };

  /* ---------- 水面以上 ---------- */
  const sceneA = new THREE.Scene();
  const camA = new THREE.PerspectiveCamera(50, 1.6, .1, 6000); camA.position.set(0, 2, 0);
  const SU = { tSky: { value: tSky }, uKu: { value: .28 }, uKv: { value: 1.6 }, uEl0: { value: .1 }, uTilt: { value: -.03 }, uSkyExp: { value: 1.05 }, uSkySat: { value: 1.65 } };
  const sky = new THREE.Mesh(new THREE.SphereGeometry(3000, 64, 32), new THREE.ShaderMaterial({
    uniforms: SU, side: THREE.BackSide, depthWrite: false, depthTest: false,
    vertexShader: `varying vec3 vW;void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`,
    fragmentShader: SKY_GLSL + `varying vec3 vW;void main(){vec3 d=normalize(vW-cameraPosition);gl_FragColor=vec4(skyCol(d),1.);}`
  }));
  sky.renderOrder = -10; sky.frustumCulled = false; sceneA.add(sky);

  // 补充细碎星点(真实影像分辨率之外的近景星)
  const pts = (n, f, size, gain = 1) => {
    const p = new Float32Array(n * 3), s = new Float32Array(n), b = new Float32Array(n), v = new THREE.Vector3();
    for (let i = 0; i < n; i++) { f(v, i); p.set([v.x, v.y, v.z], i * 3); const r = Math.random(); s[i] = size * (r < .93 ? .6 + Math.random() * .7 : 1.4 + Math.random() * 1.6); b[i] = r < .93 ? .25 + Math.random() * .5 : .9 + Math.random() * 1.2; }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(p, 3)); g.setAttribute("aS", new THREE.BufferAttribute(s, 1)); g.setAttribute("aB", new THREE.BufferAttribute(b, 1));
    const m = new THREE.ShaderMaterial({ uniforms: U, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: `attribute float aS,aB;uniform float uPR,uTime;varying float vB;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;gl_PointSize=aS*uPR;vB=aB*(.8+.2*sin(uTime*1.7+position.x*.37+position.y*.71));}`,
      fragmentShader: `varying float vB;void main(){vec2 q=gl_PointCoord*2.-1.;float r=dot(q,q);float a=exp(-r*4.);gl_FragColor=vec4(vec3(.92,.95,1.)*a*vB*${gain.toFixed(2)},1.);}` });
    const o = new THREE.Points(g, m); o.frustumCulled = false; return o;
  };
  const skyStars = pts(mob ? 1400 : 3200, (v) => { const az = (Math.random() - .5) * 2.6, el = Math.asin(Math.random() * .75) + .004; v.set(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el)).multiplyScalar(2500); }, mob ? 2.2 : 2.4);
  skyStars.renderOrder = -5; sceneA.add(skyStars);

  // 七色世界星:发光精灵(白热核 + 色晕 + 衍射芒)
  const starTex = (hex) => {
    const c = document.createElement("canvas"); c.width = c.height = 256; const x = c.getContext("2d"), col = new THREE.Color(hex);
    const rgb = (a) => `rgba(${col.r * 255 | 0},${col.g * 255 | 0},${col.b * 255 | 0},${a})`;
    let g = x.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, rgb(.95)); g.addColorStop(.12, rgb(.55)); g.addColorStop(.35, rgb(.12)); g.addColorStop(1, rgb(0)); x.fillStyle = g; x.fillRect(0, 0, 256, 256);
    x.globalCompositeOperation = "lighter";
    g = x.createRadialGradient(128, 128, 0, 128, 128, 18); g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(.5, "rgba(255,255,255,.7)"); g.addColorStop(1, "rgba(255,255,255,0)"); x.fillStyle = g; x.fillRect(0, 0, 256, 256);
    for (const [w, h] of [[256, 3], [3, 256]]) { g = x.createLinearGradient(128 - w / 2, 128 - h / 2, 128 + w / 2, 128 + h / 2); g.addColorStop(0, rgb(0)); g.addColorStop(.5, rgb(.5)); g.addColorStop(1, rgb(0)); x.fillStyle = g; x.fillRect(128 - w / 2, 128 - h / 2, w, h); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  };
  const worldStars = STAR7.map((s, i) => {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: starTex(s.c), transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending }));
    sp.material.color.setScalar(1.8); sp.renderOrder = 5; sp.userData = { dir: new THREE.Vector3(), i }; sceneA.add(sp); return sp;
  });

  // 海面
  const WU = { ...U, ...SU, uSD: { value: STAR7.map(() => new THREE.Vector3(0, .1, -1)) }, uSC: { value: STAR7.map((s) => new THREE.Color(s.c)) } };
  const water = new THREE.Mesh(new THREE.PlaneGeometry(9000, 9000, 1, 1), new THREE.ShaderMaterial({
    uniforms: WU, depthWrite: true,
    vertexShader: `varying vec3 vW;void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`,
    fragmentShader: SKY_GLSL + `
const float F0W=.0201;uniform float uTime;uniform vec3 uSD[7];uniform vec3 uSC[7];varying vec3 vW;
void main(){
  vec2 p=vW.xz;float dist=length(vW-cameraPosition);vec2 g=vec2(0.);
  for(int i=0;i<9;i++){float fi=float(i);float a=fi*2.39996+.4;vec2 dir=normalize(mix(vec2(cos(a),sin(a)),vec2(.15,1.),.45));
    float k=.13*pow(1.6,fi);float amp=.2/pow(1.7,fi)*exp(-k*dist*.003);
    float ph=dot(dir,p)*k-uTime*sqrt(9.8*k)*.55+fi*1.7;g+=dir*k*amp*cos(ph);}
  vec3 N=normalize(vec3(-g.x,1.,-g.y));vec3 V=normalize(vW-cameraPosition);vec3 R=reflect(V,N);R.y=abs(R.y);
  float fr=F0W+(1.-F0W)*pow(1.-max(dot(-V,N),0.),5.); // Schlick, n=1.33 → F0=((n-1)/(n+1))^2≈0.0201
  vec3 refl=skyCol(R)*.45;
  for(int i=0;i<7;i++){float c=max(dot(R,uSD[i]),0.);refl+=uSC[i]*(pow(c,6000.)*.8+pow(c,900.)*.05+pow(c,150.)*.012);}
  vec3 body=vec3(.004,.008,.012);
  vec3 col=body*(1.-fr)+refl*fr; // 透射(水体)+反射,能量守恒
  float hz=smoothstep(600.,3800.,dist);col=mix(col,skyCol(normalize(vec3(V.x,.004,V.z)))*.5,hz*.6);
  gl_FragColor=vec4(col,1.);
}` }));
  water.rotation.x = -Math.PI / 2; water.frustumCulled = false; sceneA.add(water);

  /* ---------- 水线以下 ---------- */
  const sceneB = new THREE.Scene();
  const camB = new THREE.PerspectiveCamera(50, 1.6, .1, 3000);
  const deepStars = pts(mob ? 2600 : 7000, (v) => { const D = 160 + Math.random() * 380; v.set((Math.random() * 2 - 1) * 1.25 * D, (Math.random() * 1.6 - 1.25) * D, -D); }, mob ? 2 : 2.2, 1.5);
  deepStars.renderOrder = -5; sceneB.add(deepStars);
  const items = []; // {obj, sx, sy, D, w, h(px 01c), spin}
  const plane = (mat) => new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
  const img = (f, k = 1.25, soft = .3, band = 0) => new THREE.ShaderMaterial({ uniforms: { map: { value: T(f) }, uK: { value: k }, uS: { value: soft }, uB: { value: band } }, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
    vertexShader: `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: `uniform sampler2D map;uniform float uK,uS,uB;varying vec2 vUv;void main(){vec2 q=vUv*2.-1.;float r=length(q);vec3 c=texture2D(map,vUv).rgb;
 float m=mix(smoothstep(1.,.15,r),pow(smoothstep(1.,.05,abs(q.x)),1.4)*smoothstep(1.,.25,abs(q.y)),uB); // uB=1:星云带横向长羽化,相邻块重叠成连续带
 gl_FragColor=vec4(c*uK*mix(1.,m,uS),1.);}` });
  const add = (o, sx, sy, D, w, h, extra = {}) => { const grp = new THREE.Group(); grp.add(o); sceneB.add(grp); items.push({ grp, o, sx, sy, D, w, h, ...extra }); return o; };
  // 七道体积光柱(加法混合锥体 + 噪声 + 随深度衰减)
  // 水体物理常数(见 docs/V1_对比说明.md「水体物理」):折射率 n、Beer–Lambert 吸收系数 K(1/m, R/G/B≈650/550/450nm)
  const NW = 1.33, KW = new THREE.Vector3(.38, .07, .035);
  const pillarMat = (seed, inten, col, skew, lenM) => new THREE.ShaderMaterial({ uniforms: { uTime: U.uTime, uSeed: { value: seed }, uI: { value: inten }, uC: { value: new THREE.Color(col) }, uSk: { value: skew }, uLen: { value: lenM }, uK: { value: KW } }, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
    vertexShader: `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: `uniform float uTime,uSeed,uI,uSk,uLen;uniform vec3 uC,uK;varying vec2 vUv;
float h1(float x){return fract(sin(x*127.1+uSeed*31.7)*43758.5453);}
float vn(float x){float i=floor(x),f=fract(x);return mix(h1(i),h1(i+1.),f*f*(3.-2.*f));}
void main(){float y=1.-vUv.y;float x=(vUv.x*2.-1.)*1.6-uSk*y; // 折射后的入水方向(斜率 tanθt)
 float w=mix(.2,.42,pow(y,.8)); // 前向散射:随深度展宽
 float core=exp(-pow(x/(w*.8),2.));float halo=exp(-pow(x/w,2.))*.4+exp(-pow(x/(w*2.6),2.))*.16;
 float fall=pow(max(1.-y,0.),1.1)*smoothstep(0.,.025,y)*(1.-.5*y); // 几何发散+散射损失
 vec3 T=exp(-uK*uLen*y); // Beer–Lambert:I(z)=I0·e^(−K·z),按通道
 vec3 src=mix(vec3(1.,.87,.68),uC,.3);
 float nz=.72+.28*vn(y*11.-uTime*.5)*(.6+.4*vn(y*3.7+uTime*.17+x*2.));
 float I=(core*.9+halo)*fall*nz*uI;gl_FragColor=vec4(src*mix(vec3(1.),T,.8)*I*1.1,1.);}` });
  const PL = [310, 330, 300, 350, 330, 310, 330]; // 光柱长度(01c 像素)
  STAR7.forEach((s, i) => { // 斯涅尔:sinθi = n·sinθt;θi 取光线相对竖直的方位扩张(画面两侧更斜)
    const ai = (s.x - REF.w / 2) / (REF.w / 2) * .42, at = Math.asin(Math.sin(ai) / NW);
    add(plane(pillarMat(i + 1, .78 + .08 * Math.sin(i * 1.7), s.c, Math.tan(at) * PL[i] / 96, 5)), s.x, 305, 90, 192, PL[i], { top: 1, kink: ai - at });
  });
  // 星云带(真实影像)
  const NB = [["nb-pillars.webp", 170, 598, 180, 180, .8, .3], ["nb-tarantula.webp", 315, 600, 190, 120, 1.05, 0], ["nb-carina.webp", 505, 590, 300, 175, 1.15, 0],
    ["nb-tarantula.webp", 745, 592, 270, 160, 1.2, 3.14], ["nb-helix.webp", 990, 590, 180, 180, 1.35, 0], ["nb-carina.webp", 1205, 588, 230, 140, 1.0, 3.14], ["nb-pillars.webp", 60, 600, 140, 140, .7, -.4]];
  NB.forEach(([f, sx, sy, w, h, k, rot]) => { const m = add(plane(img(f, k * .66, 1, 1)), sx, sy, 130, w * 1.85, h * 1.3); m.rotation.z = rot; });
  // 星系(真实影像,部分倾斜为透视)
  const GX = [["gx-m51.webp", 435, 485, 130, 90, 1.35, 0, -.2, .02], ["gx-m101.webp", 868, 478, 175, 137, 1.3, 1.15, -.42, .01], ["gx-m101.webp", 240, 492, 64, 50, 1.2, 1.05, .7, .015],
    ["gx-sombrero.webp", 90, 474, 72, 35, 1.1, 0, .25, 0], ["gx-m101.webp", 1095, 468, 90, 70, 1.15, 1.2, .55, .012], ["gx-small.webp", 1310, 466, 60, 60, 1.3, 0, 0, 0],
    ["gx-m51.webp", 236, 686, 52, 36, 1.1, 0, .4, .02], ["gx-sombrero.webp", 370, 730, 52, 25, 1.0, 0, -.25, 0], ["gx-sombrero.webp", 567, 702, 46, 22, .9, 0, .9, 0],
    ["gx-small.webp", 768, 718, 40, 40, 1.2, 0, 0, 0], ["gx-small.webp", 1172, 700, 46, 46, 1.2, 0, 1, 0], ["gx-small.webp", 437, 688, 34, 34, 1.0, 0, 2, 0],
    ["gx-small.webp", 64, 720, 30, 30, 1.0, 0, .5, 0], ["gx-sombrero.webp", 1300, 728, 40, 19, .9, 0, -.5, 0]];
  GX.forEach(([f, sx, sy, w, h, k, tilt, roll, spin]) => { const m = add(plane(img(f, k)), sx, sy, 110, w, h, { spin }); m.rotation.set(tilt, 0, 0); m.parent.rotation.z = roll; });
  // 黑洞:暗影 + 光子环 + 吸积盘(近侧横穿阴影、远侧经引力透镜绕到上下方)+ 多普勒增亮(左侧朝向观者)
  const bhOcc = plane(new THREE.ShaderMaterial({ transparent: true, depthWrite: false, depthTest: false,
    vertexShader: `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: `varying vec2 vUv;void main(){vec2 q=vUv*2.-1.;float r=length(q);float a=1.-smoothstep(.40,.47,r);vec3 c=vec3(.006,.007,.01)+vec3(.02,.024,.03)*smoothstep(.2,.45,r)*(.6+.4*q.y);gl_FragColor=vec4(c,a);}` }));
  bhOcc.renderOrder = 8; add(bhOcc, 995, 708, 100, 92, 92);
  const bhRing = plane(new THREE.ShaderMaterial({ uniforms: { uTime: U.uTime }, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
    vertexShader: `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: `uniform float uTime;varying vec2 vUv;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
void main(){vec2 q=vUv*2.-1.;float r=length(q);float a=atan(q.y,q.x);
 const float RS=.188; // 阴影半径(= bhOcc 0.47×92/230)
 float vis=smoothstep(RS-.006,RS+.004,r); // 阴影内只留近侧盘
 // 多普勒:盘左侧朝向观者 → 增亮、偏蓝白;右侧远离 → 变暗、偏红
 float beta=clamp(-q.x/max(r,.22),-1.,1.);float D=pow(1.+.5*beta,3.);
 vec3 hot=mix(vec3(1.,.62,.36),vec3(.92,.95,1.),smoothstep(-.4,1.,beta));
 float flow=.75+.25*vn(vec2(a*6.-uTime*(.9+.6*beta),r*18.));
 // 光子环(细、偏蓝白,略随方位起伏)
 float ring=exp(-pow((r-.205)/.007,2.))*(.55+.25*beta)*vis;
 // 远侧盘经引力透镜成像:上方弧厚、下方弧细
 float up=step(0.,q.y);float Rl=mix(.235,.29,up),Wl=mix(.012,.05,up);
 float lens=exp(-pow((r-Rl)/Wl,2.))*mix(.35,.8,up)*vis*smoothstep(.0,.25,abs(q.y)+.05);
 // 近侧盘:略低于中心的薄带,横穿阴影,向外渐暗
 float ny=q.y+.018;float thick=mix(.022,.034,smoothstep(.1,.9,abs(q.x)));
 float near=exp(-pow(ny/thick,2.))*smoothstep(.97,.3,abs(q.x))*(.55+.45*smoothstep(.0,.3,abs(q.x)));
 float glow=exp(-pow((r-.3)/.18,2.))*.05*vis;
 vec3 c=hot*D*flow*(near*.9+lens)+vec3(.75,.85,1.)*ring*D+vec3(1.,.8,.6)*glow;
 c*=smoothstep(1.,.8,r);
 gl_FragColor=vec4(c*.75,1.);}` }));
  bhRing.renderOrder = 9; add(bhRing, 995, 708, 100, 230, 230);
  items.forEach((it) => { if (it.o.renderOrder === 0) it.o.renderOrder = it.top ? 6 : 2; });

  /* ---------- 机位与布局(每次 resize 重算,构图按 01c 像素比例) ---------- */
  const v3 = new THREE.Vector3();
  let SC = 1, Wv = 1376;
  const nxOf = (sx) => (sx - REF.w / 2) * SC / (Wv / 2);
  const dirAt = (sx, sy) => v3.set(nxOf(sx), 1 - sy / REF.h * 2, .5).unproject(camA).sub(camA.position).normalize().clone();
  let W = 1376, H = 768;
  function layout(w, h, pr) {
    W = w; H = h; U.uPR.value = pr; const asp = w / h; Wv = w; SC = Math.max(w / REF.w, h / REF.h * .55);
    const fov = asp >= 1.2 ? 50 : Math.min(74, 50 + (1.2 - asp) * 34);
    for (const c of [camA, camB]) { c.fov = fov; c.aspect = asp; c.updateProjectionMatrix(); }
    const t = Math.tan(fov * Math.PI / 360);
    const pitch = Math.atan((1 - 2 * REF.horizon / REF.h) * t);
    camA.rotation.set(-pitch, 0, 0); camA.updateMatrixWorld(true);
    // 天空映射:屏宽≈144° 银河;银河带中心在 01c y≈125,半厚≈75px
    const halfH = Math.atan(t * asp);
    SU.uKu.value = .2 * (w / SC / REF.w) / halfH * (asp < 1 ? 1.6 : 1);
    const dC = dirAt(688, 145), dT = dirAt(688, 66);
    SU.uEl0.value = Math.asin(dC.y); SU.uKv.value = .139 / Math.max(.02, Math.asin(dT.y) - Math.asin(dC.y));
    const sc = SC;
    worldStars.forEach((sp, i) => {
      const s = STAR7[i];
      const d = dirAt(s.x, s.y); sp.userData.dir.copy(d); WU.uSD.value[i].copy(d);
      sp.position.copy(camA.position).addScaledVector(d, 1500);
      const px = 46 * sc * (i === 6 ? .9 : 1); sp.scale.setScalar(px / h * 2 * 1500 * t);
    });
    items.forEach((it) => {
      const hH = it.D * t, hW = hH * asp, k = 2 * hH / h * sc;
      it.grp.position.set(nxOf(it.sx) * hW, (1 - 2 * it.sy / REF.h) * hH, -it.D);
      if (it.top) { // 光柱:顶端贴水线,长度按屏高比例
        const len = it.h / REF.h * 2 * hH; it.grp.position.y = (1 - 2 * 305 / REF.h) * hH - len / 2; it.o.scale.set(it.w * k, len, 1);
      } else it.o.scale.set(it.w * k, it.h * k, 1);
    });
  }
  function update(t, d) {
    U.uTime.value = t;
    camB.position.set(0, -d * 34, -d * 30);
    items.forEach((it) => { if (it.spin) it.o.rotation.z += it.spin * .016; });
    worldStars.forEach((sp, i) => { sp.material.color.setScalar((i < 2 ? 2.8 : 1.7) + .25 * Math.sin(t * 1.3 + i * 1.9)); }); // 蓝/紫亮度低,补偿
  }
  return { ready, sceneA, camA, sceneB, camB, layout, update };
}

/* 合成:水线(波动)+ 水上/水下/深空场景混合 + 暗角 + 胶片颗粒(色调映射与 Bloom 在后续通道) */
export function createComposite(THREE) {
  const uniforms = { tA: { value: null }, tB: { value: null }, tC: { value: null }, uWl: { value: WL0 }, uWl0: { value: WL0 }, uMixC: { value: 0 }, uTime: { value: 0 }, uRes: { value: new THREE.Vector2(1, 1) }, uGrain: { value: .035 }, uVig: { value: .85 } };
  const m = new THREE.ShaderMaterial({ uniforms, depthTest: false, depthWrite: false,
    vertexShader: `varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`,
    fragmentShader: `uniform sampler2D tA,tB,tC;uniform float uWl,uWl0,uMixC,uTime,uGrain,uVig;uniform vec2 uRes;varying vec2 vUv;
float hs(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
const float NW=1.33,F0W=.0201;const vec3 KW=vec3(.38,.07,.035),WC=vec3(.05,.42,.55);
void main(){vec2 uv=vUv;float asp=uRes.x/uRes.y;float wx=uv.x*asp;
 float wl=uWl+.0055*sin(wx*7.+uTime*.9)+.0028*sin(wx*19.-uTime*1.6)+.0012*sin(wx*53.+uTime*2.4);
 vec3 col;
 if(uv.y>wl){vec2 a=uv-vec2(0.,uWl-uWl0);col=a.y>1.?vec3(0.):texture2D(tA,a).rgb;
  float m=exp(-pow((uv.y-wl)*uRes.y/2.2,2.));col=col*(1.-.7*exp(-(uv.y-wl)*uRes.y/14.))+vec3(.42,.52,.56)*m*.22;}
 else{float dd=wl-uv.y;vec2 r=uv+vec2(.004*sin(uv.x*70.+uTime*2.)*exp(-dd*28.),0.);
  vec3 b=texture2D(tB,r).rgb;vec3 c=uMixC>0.?texture2D(tC,uv).rgb:vec3(0.);
  float wa=1.-smoothstep(.15,.75,uMixC); // 水体占比:进入深空层后逐步「离开水体」,恢复真空色彩
  float zm=dd*6.+max(uWl-uWl0,0.)*24.; // 该像素对应水深(m)
  vec3 T=exp(-KW*zm); // Beer–Lambert 按波长
  b=b*mix(vec3(1.),mix(T,vec3(dot(T,vec3(.3,.4,.3))),.35),.6); // 保留35%中性以护住深处星系星云的辨识度
  b+=WC*(1.-T.g)*.018; // 内散射:水体本色(青蓝)
  // 焦散:水面下几米内的光纹,强度随深度 e^(−z/2.5)
  vec2 cp=vec2(uv.x*asp,dd)*vec2(14.,26.);float ca=0.;vec2 cq=cp;
  for(int i=0;i<3;i++){cq+=vec2(sin(cq.y*1.3+uTime*.7+float(i)),cos(cq.x*1.1-uTime*.6))*.55;ca+=1./(.12+abs(sin(cq.x)*sin(cq.y)));}
  b+=vec3(.55,.8,.85)*pow(ca*.1,4.)*.004*exp(-zm/1.2)*smoothstep(0.,.012,dd);
  // 丁达尔:悬浮微粒在光柱中被照亮(亮度∝所在处光柱亮度)
  vec2 gp=floor(uv*uRes/3.);float hh=hs(gp+floor(uTime*.5)*.0);float tw=step(.9988,hh)*(.5+.5*sin(uTime*1.5+hh*40.));
  b+=vec3(.8,.92,1.)*tw*min(dot(b,vec3(.33))*5.,1.)*.45;
  // 斯涅尔窗:水下仰视,天空压缩进临界角 θc=asin(1/n)≈48.6° 的圆锥(全视角≈97°),窗外为全内反射的暗面
  float sn=smoothstep(1.,1.12,uWl)*(1.-smoothstep(.12,.6,uMixC));
  if(sn>0.){float tc=asin(1./NW);float rW=min(.19,.40*asp);float kW=tc/rW;const float cyW=.785; // V1.1:窗心移入画面、半径按屏宽收,桌面/手机都完整可见
   vec2 zq=vec2((uv.x-.5)*asp,uv.y-cyW);float tw2=length(zq)*kW; // 与天顶夹角(rad)
   tw2+=.018*sin(uv.x*40.+uTime*1.3)*sin(uv.y*31.-uTime);
   vec3 sw;
   if(tw2<tc){float ta=asin(min(NW*sin(tw2),1.)); // 斯涅尔:sinθa=n·sinθw
    vec2 dir=zq/max(length(zq),1e-4);float rr=1.-ta/1.5708;
    vec2 su=vec2(.5+dir.x*(1.-rr)*.55,.73+.27*rr);
    float ct=cos(ta),ctw=cos(tw2);float Tf=1.-(F0W+(1.-F0W)*pow(1.-ct,5.)); // 透射率随入射角
    sw=texture2D(tA,su).rgb*Tf*1.6+vec3(.1,.16,.18)*smoothstep(tc-.12,tc,tw2)*.35; // 窗边压缩的地平线亮环
    sw*=T*.4+.6;
   }else{vec2 mu=vec2(uv.x,clamp(2.*(cyW-rW)-uv.y,0.,1.)); // 全内反射:镜像水下场景
    sw=texture2D(tB,mu).rgb*.35*T+WC*.006;}
   float ew=smoothstep(.02,0.,abs(tw2-tc))*.4;sw+=vec3(.5,.7,.75)*ew*.15;
   b=mix(b,sw,sn*(1.-smoothstep(tc*1.15,tc*1.9,tw2)));}
  col=mix(b,c,uMixC);
  vec3 bg=mix(vec3(.008,.012,.02),vec3(.0015,.002,.005),smoothstep(0.,.32,dd));col+=bg*wa;
  col*=mix(1.,.45,exp(-dd*uRes.y/7.)*(1.-uMixC));
  float m=exp(-pow(dd*uRes.y/1.6,2.));col+=vec3(.38,.48,.5)*m*.28*(1.-uMixC);}
 vec2 q=uv-.5;q.x*=min(asp,1.8)*.62;col*=mix(1.,smoothstep(.92,.18,length(q)),uVig);
 float g=hs(uv*uRes+fract(uTime*7.31)*91.)-.5;col+=g*uGrain*(.18+sqrt(max(dot(col,vec3(.333)),0.)));
 gl_FragColor=vec4(max(col,0.),1.);}` });
  const scene = new THREE.Scene(); const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), m); quad.frustumCulled = false; scene.add(quad);
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  return { scene, cam, uniforms };
}
