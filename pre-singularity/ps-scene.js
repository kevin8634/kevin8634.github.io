/* 奇点前夜 Pre-Singularity · 共享场景模块 ps-scene.js(v0.7 原型)
   负责:渲染器、相机、辉光后期、性能三档、降级判定、隐藏页暂停、减少动态。
   Three.js r169 本地自带(vendor/,MIT)。 */
import * as THREE from 'three';
import { EffectComposer } from './vendor/addons/postprocessing/EffectComposer.js';
import { RenderPass } from './vendor/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from './vendor/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from './vendor/addons/postprocessing/OutputPass.js';
import { ShaderPass } from './vendor/addons/postprocessing/ShaderPass.js';

export const TIERS = {
  high: { particles: 96000, plexus: 1800, stars: 6000, bloom: 1.0, pr: 2.0 },
  mid:  { particles: 48000, plexus: 900,  stars: 3000, bloom: 0.5, pr: 1.5 },
};

export function webglOK() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); }
  catch (e) { return false; }
}

export function pickTier() {
  const q = new URLSearchParams(location.search).get('tier');
  if (q === 'high' || q === 'mid' || q === 'low') return q;
  try { const s = localStorage.getItem('gn:ps:gfx'); if (s) return JSON.parse(s); } catch (e) {}
  if (!webglOK()) return 'low';
  const mobile = matchMedia('(pointer:coarse)').matches || Math.min(screen.width, screen.height) < 600;
  const cores = navigator.hardwareConcurrency || 4;
  return (mobile || cores <= 4) ? 'mid' : 'high';
}

export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function createStage(canvas, tierName) {
  const T = TIERS[tierName] || TIERS.mid;
  const mobile = matchMedia('(pointer:coarse)').matches;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, mobile ? 1.5 : T.pr));
  renderer.setClearColor(0x05060a, 1);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.95;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.05, 200);
  camera.position.set(0, 0.35, 6.2);
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.85, 0.5, 0.3);
  composer.addPass(bloom);
  // 视界遮罩:辉光之后把奇点内部压回纯黑(辉光会漫进黑球)
  const holeMask = new ShaderPass({
    uniforms: { tDiffuse: { value: null }, uC: { value: new THREE.Vector2(0.5, 0.5) }, uR: { value: 0 }, uAsp: { value: 1 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `uniform sampler2D tDiffuse; uniform vec2 uC; uniform float uR,uAsp; varying vec2 vUv;
      void main(){ vec4 c=texture2D(tDiffuse,vUv); vec2 d=vUv-uC; d.x*=uAsp; float r=length(d);
        float k=smoothstep(uR*0.80,uR*0.97,r); gl_FragColor=vec4(c.rgb*mix(0.02,1.,k),c.a); }`
  });
  composer.addPass(holeMask);
  composer.addPass(new OutputPass());

  function resize() {
    const w = canvas.clientWidth || innerWidth, h = canvas.clientHeight || innerHeight;
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
    bloom.resolution.set(w * T.bloom, h * T.bloom);
    camera.aspect = w / h;
    // 竖屏时拉远,保证整个神经核在画面内
    camera.userData.fit = w / h < 1 ? 1.55 : 1.0;
    camera.updateProjectionMatrix();
  }
  addEventListener('resize', resize); resize();

  let running = true, raf = 0, last = performance.now(), cb = null;
  const loop = (now) => {
    raf = requestAnimationFrame(loop);
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    cb && cb(dt, now / 1000);
    composer.render();
  };
  document.addEventListener('visibilitychange', () => { running = !document.hidden; last = performance.now(); });
  return {
    THREE, renderer, scene, camera, composer, bloom, holeMask, tier: T, tierName, resize,
    start(fn) { cb = fn; raf = requestAnimationFrame(loop); },
    renderOnce() { composer.render(); },
  };
}
