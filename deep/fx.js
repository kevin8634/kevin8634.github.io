/* 深空 2.9 · 电影感画质(总指挥自写,纯程序,无图片/模型素材)
   流程参考王磊提供的画质专长包(只学思路,代码全部自写);ACES 拟合系数(Stephen Hill,MIT)与 AgX 多项式近似为公开公式,
   系数与 three.js(MIT)同口径——致谢见 LICENSES.md。
   内容:三档画质(按 GPU 自动 + G 键切换 + 本机记忆)、HDR 后期链(5 级 Bloom,首级 Karis 平均防闪烁)、
   ACES/AgX 混合色调映射、分离色调、抬黑、1/255 抖动、按深度层的关键帧表、亚像素星点保能量淡化、动态分辨率(只降像素不砍效果)。 */

export const QKEY = "gn:deep:q";
export const TIER_NAME = ["低", "中", "高"];
// 每档参数:像素比上限、MSAA、是否 Bloom、上帝光采样
export const TIERS = [
  { pr: .85, msaa: 0, bloom: true, lv: 3, div: 4, rays: 0, shadow: 0 }, // 低档:Bloom 只留 3 级、从 1/4 分辨率起算(很省)
  { pr: 1.25, msaa: 2, bloom: true, lv: 5, div: 2, rays: 24, shadow: 1024 },
  { pr: 1.75, msaa: 4, bloom: true, lv: 5, div: 2, rays: 40, shadow: 2048 },
];

/* 显卡字符串 → 档位;读不到返回 -1(由调用方用 CPU 判断兜底) */
export function gpuTier(r) {
  let s = "";
  try { const g = r.getContext(), e = g.getExtension("WEBGL_debug_renderer_info"); s = String(e ? g.getParameter(e.UNMASKED_RENDERER_WEBGL) : g.getParameter(g.RENDERER)); } catch (e) { return -1; }
  if (/SwiftShader|llvmpipe|Software|Mali|Adreno|PowerVR|Microsoft Basic/i.test(s)) return 0;
  if (/Intel|UHD|Iris|Radeon\(TM\) (R\d )?Graphics|Radeon Vega|Vega \d+ Graphics|Apple GPU/i.test(s)) return 1;
  return s ? 2 : -1;
}
/* 最终档位:?lod= 强制 > 本机记忆 > min(GPU, CPU) */
export function pickTier(r, cpuTier) {
  const q = location.search.match(/[?&]lod=([012])/); if (q) return { tier: +q[1], src: "url" };
  let sv = null; try { sv = localStorage.getItem(QKEY); } catch (e) {}
  if (sv !== null && /^[012]$/.test(sv)) return { tier: +sv, src: "saved" };
  const g = gpuTier(r);
  return { tier: g < 0 ? cpuTier : Math.min(g, cpuTier), src: "auto" };
}

/* ---------------- HDR 后期链 ---------------- */
const VS = `varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`;
const PRE = `uniform sampler2D tSrc;uniform vec2 uTexel;uniform float uThr,uKnee;varying vec2 vUv;
float lum(vec3 c){return dot(c,vec3(.2126,.7152,.0722));}
vec3 pf(vec3 c){c=min(c,vec3(64.));float b=max(c.r,max(c.g,c.b));float s=clamp(b-uThr+uKnee,0.,2.*uKnee);s=s*s/(4.*uKnee+1e-4);
 return c*max(s,b-uThr)/max(b,1e-4);}
vec3 kw(vec3 c){return c/(1.+lum(c));}
void main(){vec2 o=uTexel;
 vec3 a=pf(texture2D(tSrc,vUv+vec2(-o.x,-o.y)).rgb),b=pf(texture2D(tSrc,vUv+vec2(o.x,-o.y)).rgb),c=pf(texture2D(tSrc,vUv+vec2(-o.x,o.y)).rgb),d=pf(texture2D(tSrc,vUv+o).rgb);
 // Karis 平均:按亮度加权,单个过亮星点不再在 Bloom 里一闪一闪
 float wa=1./(1.+lum(a)),wb=1./(1.+lum(b)),wc=1./(1.+lum(c)),wd=1./(1.+lum(d));
 gl_FragColor=vec4((a*wa+b*wb+c*wc+d*wd)/(wa+wb+wc+wd),1.);}`;
const DOWN = `uniform sampler2D tSrc;uniform vec2 uTexel;varying vec2 vUv;
void main(){vec2 o=uTexel;vec3 s=texture2D(tSrc,vUv).rgb*4.;
 s+=texture2D(tSrc,vUv+vec2(-o.x,-o.y)).rgb+texture2D(tSrc,vUv+vec2(o.x,-o.y)).rgb+texture2D(tSrc,vUv+vec2(-o.x,o.y)).rgb+texture2D(tSrc,vUv+o).rgb;
 gl_FragColor=vec4(s/8.,1.);}`;
const UP = `uniform sampler2D tLow,tHigh;uniform vec2 uTexel;uniform float uRad;varying vec2 vUv;
void main(){vec2 o=uTexel;vec3 s=texture2D(tLow,vUv).rgb*4.;
 s+=(texture2D(tLow,vUv+vec2(o.x,0.)).rgb+texture2D(tLow,vUv-vec2(o.x,0.)).rgb+texture2D(tLow,vUv+vec2(0.,o.y)).rgb+texture2D(tLow,vUv-vec2(0.,o.y)).rgb)*2.;
 s+=texture2D(tLow,vUv+o).rgb+texture2D(tLow,vUv-o).rgb+texture2D(tLow,vUv+vec2(o.x,-o.y)).rgb+texture2D(tLow,vUv+vec2(-o.x,o.y)).rgb;
 gl_FragColor=vec4(texture2D(tHigh,vUv).rgb+s/16.*uRad,1.);}`;
const FINAL = `uniform sampler2D tScene,tBloom,tRays;uniform float uExp,uBloom,uUseBloom,uRays,uAgx,uSat,uSplit,uLift;uniform vec3 uTint;uniform vec2 uRes;uniform float uTime;varying vec2 vUv;
// ACES(Hill 拟合,与 three 的 ACESFilmic 同口径,保持原有亮度)
vec3 rrt(vec3 v){vec3 a=v*(v+.0245786)-.000090537;vec3 b=v*(.983729*v+.4329510)+.238081;return a/b;}
vec3 aces(vec3 c){const mat3 I=mat3(vec3(.59719,.07600,.02840),vec3(.35458,.90834,.13383),vec3(.04823,.01566,.83777));
 const mat3 O=mat3(vec3(1.60475,-.10208,-.00327),vec3(-.53108,1.10813,-.07276),vec3(-.07367,-.00605,1.07602));
 c*=1./.6;c=O*rrt(I*c);return clamp(c,0.,1.);}
// AgX(公开的多项式近似,自写)
vec3 agx(vec3 c){const mat3 I=mat3(vec3(.842479,.0423282,.0423757),vec3(.0784336,.878469,.0784336),vec3(.0792237,.0791661,.879143));
 const mat3 O=mat3(vec3(1.196879,-.0528969,-.0529716),vec3(-.0980209,1.151903,-.0980435),vec3(-.0990297,-.0989612,1.151074));
 c=I*c;c=clamp(log2(max(c,1e-10)),-12.47393,4.026069);c=(c+12.47393)/16.5;vec3 x2=c*c,x4=x2*x2;
 c=15.5*x4*x2-40.14*x4*c+31.96*x4-6.868*x2*c+.4298*x2+.1191*c-.00232;return pow(max(O*c,0.),vec3(2.2));}
float hs(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
vec3 srgb(vec3 c){return mix(c*12.92,1.055*pow(c,vec3(1./2.4))-.055,step(.0031308,c));}
void main(){vec3 c=texture2D(tScene,vUv).rgb;
 if(uUseBloom>.5)c+=texture2D(tBloom,vUv).rgb*uBloom;
 if(uRays>.001)c+=texture2D(tRays,vUv).rgb*uRays;
 c=max(c,0.);c*=uExp;
 vec3 t=mix(aces(c),agx(c),uAgx);
 float l=dot(t,vec3(.2126,.7152,.0722));
 t=mix(vec3(l),t,uSat);
 // 分离色调:暗部偏青、高光偏暖;按层再叠一点该层主色
 t*=mix(vec3(1.-uSplit*.6,1.,1.+uSplit),vec3(1.+uSplit,1.,1.-uSplit*.8),smoothstep(.05,.6,l));
 t*=mix(vec3(1.),uTint,.10*(1.-smoothstep(.2,.8,l)));
 t=t*(1.-uLift)+uLift*vec3(.55,.8,1.);
 vec3 s=srgb(clamp(t,0.,1.));
 s+=(hs(vUv*uRes+fract(uTime)*17.3)-.5)/255.; // 1/255 抖动:深色渐变不出色带
 gl_FragColor=vec4(s,1.);}`;

// 上帝光(只在高/中档、主光在画面内时):1/4 分辨率亮部遮罩 → 1/2 分辨率径向模糊
const MASK = `uniform sampler2D tSrc;uniform vec2 uSun;uniform float uAsp;varying vec2 vUv;
void main(){vec3 c=texture2D(tSrc,vUv).rgb;vec2 d=(vUv-uSun)*vec2(uAsp,1.);float m=exp(-dot(d,d)*7.);
 float l=dot(c,vec3(.2126,.7152,.0722));gl_FragColor=vec4(min(c,vec3(4.))*smoothstep(.35,1.2,l)*m,1.);}`;
const RAYS = (N) => `uniform sampler2D tSrc;uniform vec2 uSun;uniform float uJit;varying vec2 vUv;
void main(){vec2 dl=(vUv-uSun)*(.9/float(${N}));vec2 p=vUv-dl*uJit;vec3 s=vec3(0.);float w=1.;
 for(int i=0;i<${N};i++){s+=texture2D(tSrc,p).rgb*w;w*=.965;p-=dl;}gl_FragColor=vec4(s/float(${N})*2.2,1.);}`;
export function createPost(THREE, r, tier) {
  const T = TIERS[tier];
  const geo = new THREE.PlaneGeometry(2, 2), cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const pass = (fs, u) => { const m = new THREE.ShaderMaterial({ vertexShader: VS, fragmentShader: fs, uniforms: u, depthTest: false, depthWrite: false }); const s = new THREE.Scene(); const q = new THREE.Mesh(geo, m); q.frustumCulled = false; s.add(q); return { s, u: m.uniforms }; };
  const mk = (w, h) => new THREE.WebGLRenderTarget(Math.max(1, w | 0), Math.max(1, h | 0), { type: THREE.HalfFloatType, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false });
  const P = {
    pre: pass(PRE, { tSrc: { value: null }, uTexel: { value: new THREE.Vector2() }, uThr: { value: .8 }, uKnee: { value: .2 } }),
    down: pass(DOWN, { tSrc: { value: null }, uTexel: { value: new THREE.Vector2() } }),
    up: pass(UP, { tLow: { value: null }, tHigh: { value: null }, uTexel: { value: new THREE.Vector2() }, uRad: { value: 1 } }),
    fin: pass(FINAL, { tScene: { value: null }, tBloom: { value: null }, tRays: { value: null }, uExp: { value: 1 }, uBloom: { value: .6 }, uUseBloom: { value: T.bloom ? 1 : 0 }, uRays: { value: 0 },
      uAgx: { value: .3 }, uSat: { value: 1.06 }, uSplit: { value: .035 }, uLift: { value: .0015 }, uTint: { value: new THREE.Color(1, 1, 1) }, uRes: { value: new THREE.Vector2(1, 1) }, uTime: { value: 0 } }),
  };
  if (T.rays) { P.mask = pass(MASK, { tSrc: { value: null }, uSun: { value: new THREE.Vector2() }, uAsp: { value: 1 } }); P.rays = pass(RAYS(T.rays), { tSrc: { value: null }, uSun: { value: new THREE.Vector2() }, uJit: { value: 0 } }); }
  let maskRT = null, raysRT = null, rayAmt = 0; const sunUv = new THREE.Vector2();
  let src = null, downs = [], ups = [], W = 1, H = 1, pr = 1, src3 = null, srcCam = null;
  const bloom = { threshold: .8, strength: .6, radius: .5, enabled: T.bloom };
  function build() {
    [...downs, ...ups].forEach(t => t.dispose()); downs = []; ups = [];
    if (T.rays) { if (maskRT) { maskRT.dispose(); raysRT.dispose(); } maskRT = mk(W * pr / 4, H * pr / 4); raysRT = mk(W * pr / 2, H * pr / 2); }
    if (!T.bloom) return;
    let w = W * pr / T.div, h = H * pr / T.div;
    for (let i = 0; i < T.lv; i++) { downs.push(mk(w, h)); if (i < T.lv - 1) ups.push(mk(w, h)); w /= 2; h /= 2; }
  }
  const api = {
    tier, bloom, P,
    sceneRT: mk(1, 1),
    setSource(scene, camera) { src3 = scene; srcCam = camera; },
    setPixelRatio(p) { pr = p; api.setSize(W, H); },
    setSize(w, h) { W = w; H = h; api.sceneRT.setSize(Math.max(1, Math.round(w * pr)), Math.max(1, Math.round(h * pr))); P.fin.u.uRes.value.set(w * pr, h * pr); build(); },
    rays(uv, amt) { if (uv) sunUv.copy(uv); rayAmt = T.rays ? amt : 0; },
    grade(o) { const u = P.fin.u; for (const k in o) { if (k === "tint") u.uTint.value.copy(o.tint); else if (u[k]) u[k].value = o[k]; } },
    render(time) {
      r.setRenderTarget(api.sceneRT); r.render(src3, srcCam);
      const u = P.fin.u; u.uTime.value = time || 0;
      const on = T.bloom && bloom.enabled && bloom.strength > 0;
      u.uUseBloom.value = on ? 1 : 0;
      if (on) {
        let s = api.sceneRT.texture, sw = api.sceneRT.width, sh = api.sceneRT.height;
        P.pre.u.uThr.value = bloom.threshold; P.pre.u.uKnee.value = Math.max(.05, bloom.threshold * .5);
        for (let i = 0; i < downs.length; i++) {
          const p = i === 0 ? P.pre : P.down; p.u.tSrc.value = s; p.u.uTexel.value.set((i === 0 ? T.div / 4 : .5) / sw, (i === 0 ? T.div / 4 : .5) / sh);
          r.setRenderTarget(downs[i]); r.render(p.s, cam); s = downs[i].texture; sw = downs[i].width; sh = downs[i].height;
        }
        let low = downs[downs.length - 1];
        P.up.u.uRad.value = .45 + bloom.radius; // 半径大 → 低频层占比大(光晕更散)
        for (let i = ups.length - 1; i >= 0; i--) {
          P.up.u.tLow.value = low.texture; P.up.u.tHigh.value = downs[i].texture; P.up.u.uTexel.value.set(1 / low.width, 1 / low.height);
          r.setRenderTarget(ups[i]); r.render(P.up.s, cam); low = ups[i];
        }
        u.tBloom.value = ups[0].texture; u.uBloom.value = bloom.strength * (T.lv < 5 ? 1.5 : 1.1);
      }
      u.uRays.value = 0;
      if (rayAmt > .002 && maskRT) {
        P.mask.u.tSrc.value = api.sceneRT.texture; P.mask.u.uSun.value.copy(sunUv); P.mask.u.uAsp.value = W / H;
        r.setRenderTarget(maskRT); r.render(P.mask.s, cam);
        P.rays.u.tSrc.value = maskRT.texture; P.rays.u.uSun.value.copy(sunUv); P.rays.u.uJit.value = Math.random();
        r.setRenderTarget(raysRT); r.render(P.rays.s, cam); u.tRays.value = raysRT.texture; u.uRays.value = rayAmt;
      }
      u.tScene.value = api.sceneRT.texture;
      r.setRenderTarget(null); r.render(P.fin.s, cam);
    },
  };
  return api;
}

/* 第 10 步:按深度层的关键帧表(水面/星辰/星系/星河/星穹),随相机深度插值 */
export function layerKeys(THREE, L) {
  const K = [
    { uExp: 1.00, uSat: 1.04, uSplit: .030, uLift: .0015 },
    { uExp: 1.02, uSat: 1.06, uSplit: .035, uLift: .0015 },
    { uExp: 1.03, uSat: 1.08, uSplit: .040, uLift: .002 },
    { uExp: 1.02, uSat: 1.07, uSplit: .045, uLift: .002 },
    { uExp: 1.00, uSat: 1.05, uSplit: .035, uLift: .0025 },
  ].map((k, i) => Object.assign(k, { tint: new THREE.Color(L[i] ? L[i].c : 0xffffff) }));
  const zs = L.map(l => l.z + 60), out = { tint: new THREE.Color() };
  return function at(z) {
    let i = 0; while (i < zs.length - 2 && z < zs[i + 1]) i++;
    const a = K[i], b = K[Math.min(i + 1, K.length - 1)];
    let f = (zs[i] - z) / Math.max(1e-3, zs[i] - zs[i + 1]); f = Math.min(1, Math.max(0, f)); f = f * f * (3 - 2 * f);
    for (const k of ["uExp", "uSat", "uSplit", "uLift"]) out[k] = a[k] + (b[k] - a[k]) * f;
    out.tint.copy(a.tint).lerp(b.tint, f); return out;
  };
}

/* 第 12 步:亚像素星点——小于 1.5 像素时不再缩小,而是按面积减淡(亮度守恒),消除闪烁 */
export function subpixel(m) {
  if (!m || m.userData.fxSP) return m; m.userData.fxSP = 1;
  m.onBeforeCompile = sh => {
    sh.vertexShader = "varying float vFxSP;\n" + sh.vertexShader.replace("#include <fog_vertex>", "#include <fog_vertex>\n{float ps=gl_PointSize;vFxSP=clamp(ps*ps/2.25,0.,1.);gl_PointSize=max(ps,1.5);}");
    sh.fragmentShader = "varying float vFxSP;\n" + sh.fragmentShader.replace("#include <alphatest_fragment>", "diffuseColor.a*=vFxSP;\n#include <alphatest_fragment>");
  };
  m.customProgramCacheKey = () => "fxsp"; m.needsUpdate = true; return m;
}

/* 动态分辨率:每 1.5 s 测帧率,<45 降 0.1(最低 .55),>58 升 .05,两次调整间隔 ≥2.5 s;只换像素,不关效果 */
export function governor(apply) {
  let acc = 0, n = 0, last = 0, scale = 1, fps = 0;
  return {
    get scale() { return scale; }, get fps() { return fps; },
    tick(dtMs, now) {
      if (dtMs > 1000) return; // 切后台回来那一帧不计
      acc += dtMs; n++;
      if (acc < 1500) return;
      fps = n * 1000 / acc; acc = 0; n = 0;
      if (now - last < 2500) return;
      let s = scale;
      if (fps < 45 && scale > .55) s = Math.max(.55, +(scale - .1).toFixed(2));
      else if (fps > 58 && scale < 1) s = Math.min(1, +(scale + .05).toFixed(2));
      if (s !== scale) { scale = s; last = now; apply(scale); }
    },
  };
}

/* ---------------- 子场景(实验舱 / 核素岛)的「一束光、一种空气」 ----------------
   第 1 步:用场景自带的银河天球烘焙 PMREM 环境光(只烘一次),环境/补光压低;
   第 3+9 步:雾色取自主光方向(朝光处暖、背光处冷)+ 解析高度雾;
   第 11 步:逆光三件套(边缘光只在受光侧、暖色地面反弹、薄处透光)。 */
export function lookUniforms(THREE, o = {}) {
  return {
    uFxSunW: { value: new THREE.Vector3(.6, .6, .3).normalize() }, // 世界空间主光方向
    uFxSunCol: { value: new THREE.Color(o.sun || 0xffe2c0) },
    uFxFogCol: { value: new THREE.Color(o.fog || 0x02040a) },
    uFxFogDen: { value: o.den ?? .0065 },
    uFxFogH: { value: o.fogH ?? .06 }, uFxFogY: { value: o.fogY ?? 0 },
    uFxRim: { value: new THREE.Color(o.rim || 0x8fb0ff) }, uFxRimK: { value: o.rimK ?? .35 },
    uFxBounce: { value: new THREE.Color(o.bounce || 0x3a2a1c) },
  };
}
const LOOK_PARS = `uniform vec3 uFxSunW,uFxSunCol,uFxFogCol,uFxRim,uFxBounce;uniform float uFxFogDen,uFxFogH,uFxFogY,uFxRimK;`;
export function patchLook(m, U) {
  if (!m || !m.isMeshStandardMaterial || m.userData.fxLook) return; m.userData.fxLook = 1;
  const prev = m.onBeforeCompile;
  m.onBeforeCompile = (sh, rr) => {
    if (prev) prev(sh, rr);
    Object.assign(sh.uniforms, U);
    let f = LOOK_PARS + "\n" + sh.fragmentShader;
    // 逆光三件套:加在 outgoingLight 上(r154+ 钩子 opaque_fragment)
    f = f.replace("#include <opaque_fragment>", `{
  mat3 v2w=transpose(mat3(viewMatrix));vec3 nW=normalize(v2w*normal);vec3 vW=normalize(v2w*vViewPosition); // vW:片元→相机
  float ndl=dot(nW,uFxSunW);float fr=pow(1.-clamp(dot(nW,vW),0.,1.),3.);
  outgoingLight+=uFxRim*fr*smoothstep(-.2,.6,ndl)*uFxRimK*(1.-smoothstep(.5,.9,abs(nW.y))); // 边缘光:只在受光一侧,只描竖向轮廓(地面/顶面不发青)
  outgoingLight+=diffuseColor.rgb*uFxBounce*clamp(-nW.y*.5+.5,0.,1.)*.6;            // 暖色反弹(朝下的面)
  outgoingLight+=diffuseColor.rgb*uFxSunCol*pow(max(dot(-vW,uFxSunW),0.),4.)*.08*(1.-metalnessFactor); // 薄处透光
}
#include <opaque_fragment>`);
    // 雾:取自主光方向的天空色 + 解析高度雾(替换 three 的常数雾色)
    f = f.replace("#include <fog_fragment>", `#ifdef USE_FOG
{ mat3 v2w=transpose(mat3(viewMatrix));vec3 rd=v2w*(-vViewPosition);float fd=length(rd);rd/=max(fd,1e-4);
  vec3 wp=cameraPosition+rd*fd;float k=uFxFogH,dy=rd.y*fd;float hf=abs(dy)>.01?(1.-exp(-k*dy))/(k*dy):1.;
  float fa=1.-exp(-uFxFogDen*fd*exp(-k*max(cameraPosition.y-uFxFogY,0.))*hf);
  float mu=max(dot(rd,uFxSunW),0.);vec3 fc=uFxFogCol*mix(vec3(.8,.9,1.2),vec3(1.),mu)+uFxSunCol*(pow(mu,8.)*.10+pow(mu,48.)*.25);
  gl_FragColor.rgb=mix(gl_FragColor.rgb,fc,clamp(fa,0.,1.)); }
#endif`);
    sh.fragmentShader = f;
  };
  const pk = m.customProgramCacheKey ? m.customProgramCacheKey.bind(m) : () => "";
  m.customProgramCacheKey = () => pk() + "|fxlook"; m.needsUpdate = true;
}
/* 场景打扮:找天球 → 烘 PMREM → 环境光;压低环境/补光;补材质。返回 Promise(天球贴图加载后完成) */
export function dressScene(THREE, r, scene, U, o = {}) {
  let sky = null; scene.traverse(x => { if (!sky && x.isMesh && x.material && x.material.isMeshBasicMaterial && x.material.side === THREE.BackSide && x.material.map) sky = x; });
  scene.traverse(x => { if (x.isMesh && x.material) (Array.isArray(x.material) ? x.material : [x.material]).forEach(mm => { patchLook(mm, U); if (mm.isMeshStandardMaterial) mm.envMapIntensity = (o.env ?? 1) * (mm.metalness > .85 && mm.roughness < .3 ? (o.mirror ?? 1) : 1); /* 近镜面(如舱底)单独压低,免得整片反出天球 */ }); });
  scene.traverse(x => { if (x.isAmbientLight) x.intensity *= (o.amb ?? .35); });
  return new Promise(res => {
    if (!sky) return res(false);
    const bake = () => {
      const img = sky.material.map.image; if (!img || !(img.width > 0)) return setTimeout(bake, 150);
      const pm = new THREE.PMREMGenerator(r), es = new THREE.Scene(), s2 = sky.clone(); s2.material = sky.material.clone(); s2.material.fog = false; es.add(s2);
      s2.matrixAutoUpdate = true; es.environmentRotation && (es.environmentRotation.copy(new THREE.Euler()));
      const tm = r.toneMapping; r.toneMapping = THREE.NoToneMapping;
      const rt = pm.fromScene(es, .04); r.toneMapping = tm; pm.dispose(); s2.material.dispose();
      scene.environment = rt.texture; res(true);
    };
    bake();
  });
}
