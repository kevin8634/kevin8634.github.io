/* 元素工坊 Element Forge · 共享场景模块 ef-gl.js v0.2
   §5.3.1:统一管理渲染器、相机、性能分级、降级判定、页面隐藏暂停。Three.js r186 本地自带(WebGL1 回落 r169)(vendor/,MIT)。 */
import * as THREE from './vendor/three.module.min.js';
export { THREE };
const EF = window.EF;
export const tier = EF.glTier;
/* 每档的粒子预算:中档减半;低档不会走到这里(回落 Canvas 2D) */
export const P = tier === 'high' ? { stars: 2200, cloud: 7000, dust: 9000, bubbles: 140 } : { stars: 1100, cloud: 3500, dust: 4500, bubbles: 70 };

export function makeGL(host, opt = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: tier === 'high', alpha: !!opt.alpha, powerPreference: 'high-performance' });
  renderer.setPixelRatio(EF.dpr());
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  host.appendChild(renderer.domElement);
  const api = { THREE, renderer, scene: new THREE.Scene(), camera: new THREE.PerspectiveCamera(opt.fov || 45, 1, 0.01, 300), cbs: [], visible: true };
  function rs() { const w = host.clientWidth || 1, h = host.clientHeight || 1; renderer.setSize(w, h, false); api.camera.aspect = w / h; api.camera.updateProjectionMatrix(); if (api.onresize) api.onresize(w, h); }
  rs();
  if (window.ResizeObserver) new ResizeObserver(rs).observe(host); else addEventListener('resize', rs);
  if (window.IntersectionObserver) new IntersectionObserver(es => { api.visible = es[0].isIntersecting; }, { rootMargin: '80px' }).observe(host);
  renderer.domElement.addEventListener('webglcontextlost', e => { e.preventDefault(); if (opt.onlost) opt.onlost(); });
  let last = performance.now();
  function frame(now) {
    requestAnimationFrame(frame);
    if (document.hidden || !api.visible) { last = now; return; }      /* 页面隐藏 / 滚出视口时暂停 */
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    for (const f of api.cbs) f(now / 1000, dt);
    renderer.render(api.scene, api.camera);
  }
  api.onFrame = f => api.cbs.push(f);
  api.resize = rs;
  requestAnimationFrame(frame);
  return api;
}

/* 径向辉光贴图(代替后期辉光,省性能) */
export function glowTex(stops, size = 256) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const x = c.getContext('2d'), g = x.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  stops.forEach(s => g.addColorStop(s[0], s[1])); x.fillStyle = g; x.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
export function glowSprite(stops, scale, opacity = 1) {
  const m = new THREE.SpriteMaterial({ map: glowTex(stops), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity });
  const s = new THREE.Sprite(m); s.scale.setScalar(scale); return s;
}
/* GLSL:值噪声 + fbm(程序生成恒星米粒组织、行星地貌) */
export const NOISE = `
float hash(vec3 p){ p=fract(p*0.3183099+.1); p*=17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
float noise(vec3 x){ vec3 i=floor(x); vec3 f=fract(x); f=f*f*(3.0-2.0*f);
  return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z); }
float fbm(vec3 p){ float v=0.0,a=0.5; for(int i=0;i<5;i++){ v+=a*noise(p); p*=2.03; a*=0.5; } return v; }
`;
export const VS_SURF = `varying vec3 vP; varying vec3 vN; varying vec3 vV;
void main(){ vP=position; vN=normalize(normalMatrix*normal); vec4 mv=modelViewMatrix*vec4(position,1.0); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }`;
/* 恒星表面着色器 */
export function starMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { uT: { value: 0 }, uA: { value: 1 } }, transparent: true, vertexShader: VS_SURF,
    fragmentShader: NOISE + `uniform float uT,uA; varying vec3 vP; varying vec3 vN; varying vec3 vV;
    void main(){ float n=fbm(vP*2.6+vec3(0.0,uT*0.12,uT*0.08)); float g=fbm(vP*9.0-vec3(uT*0.25));
      float h=clamp(n*0.8+g*0.45-0.05,0.0,1.0);
      vec3 c=mix(vec3(0.70,0.10,0.02),vec3(1.0,0.52,0.10),smoothstep(0.25,0.58,h));
      c=mix(c,vec3(1.0,0.92,0.68),smoothstep(0.58,0.88,h));
      float mu=max(dot(vN,vV),0.0); c*=0.42+0.8*pow(mu,0.5);
      gl_FragColor=vec4(c*1.3,uA); }`
  });
}
/* 菲涅尔外壳(大气、玻璃、恒星分层) */
export function fresnelMaterial(color, power = 2.5, base = 0.05, side = THREE.FrontSide) {
  return new THREE.ShaderMaterial({
    uniforms: { uC: { value: new THREE.Color(color) }, uA: { value: 1 }, uP: { value: power }, uB: { value: base } },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side, vertexShader: VS_SURF,
    fragmentShader: `uniform vec3 uC; uniform float uA,uP,uB; varying vec3 vP; varying vec3 vN; varying vec3 vV;
    void main(){ float f=pow(1.0-abs(dot(normalize(vN),normalize(vV))),uP); gl_FragColor=vec4(uC*(uB+f),(uB+f)*uA); }`
  });
}
