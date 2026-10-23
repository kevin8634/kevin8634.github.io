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
  high: { particles: 96000, plexus: 1800, stars: 6000, bloom: 1.0,  pr: 2.0, city: 4200, traffic: 5200 },
  mid:  { particles: 48000, plexus: 900,  stars: 3000, bloom: 0.5,  pr: 1.5, city: 2100, traffic: 0 },
  // v0.9.2:中低端手机档(粒子/辉光/分辨率减半,城市再减)
  lite: { particles: 24000, plexus: 450,  stars: 1500, bloom: 0.35, pr: 1.0, city: 1100, traffic: 0 },
};
const ORDER = ['high', 'mid', 'lite', 'low'];
const AUTO_KEY = 'gn:ps:gfxAuto';
let forced = false;
export const tierForced = () => forced;

export function gpuName() {
  try {
    const c = document.createElement('canvas'), gl = c.getContext('webgl2') || c.getContext('webgl');
    if (!gl) return '';
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const s = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return String(s || '');
  } catch (e) { return ''; }
}

export function webglOK() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); }
  catch (e) { return false; }
}

/* v0.9.2 首帧分档:URL ?tier= > 用户在底栏选的画质 > 上次自动降档结果 > 设备探测(GPU 型号 + 内存 + 核数) */
export function pickTier() {
  const q = new URLSearchParams(location.search).get('tier');
  if (ORDER.includes(q)) { forced = true; return q; }
  try { const s = JSON.parse(localStorage.getItem('gn:ps:gfx')); if (ORDER.includes(s)) { forced = true; return s; } } catch (e) {}
  if (!webglOK()) return 'low';
  let auto = ''; try { auto = localStorage.getItem(AUTO_KEY) || ''; } catch (e) {}
  const mobile = matchMedia('(pointer:coarse)').matches || Math.min(screen.width, screen.height) < 600;
  const cores = navigator.hardwareConcurrency || 4, mem = navigator.deviceMemory || 0;
  const gpu = gpuName();
  let t;
  if (/swiftshader|llvmpipe|software|microsoft basic/i.test(gpu)) t = 'low';
  else if (/Mali-(4|T[6-8])|Mali-G(31|51|52|57)\b|Adreno \(TM\) ([3-5]\d\d|6[01]\d)\b|PowerVR|Intel.*HD Graphics( [2-5]\d{2,3})?\b|GMA|Vivante/i.test(gpu)) t = 'lite';
  else if (mobile) t = (cores <= 4 || (mem && mem <= 3)) ? 'lite' : 'mid';
  else t = (cores <= 4 || (mem && mem <= 4)) ? 'mid' : 'high';
  // 曾在本机自动降过档:取较低的一档
  if (ORDER.includes(auto) && ORDER.indexOf(auto) > ORDER.indexOf(t)) t = auto;
  return t;
}

export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function createStage(canvas, tierName) {
  const T = TIERS[tierName] || TIERS.mid;
  const mobile = matchMedia('(pointer:coarse)').matches;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  let prCap = Math.min(mobile ? 1.5 : 2, T.pr), bloomK = T.bloom;
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, prCap));
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
    bloom.resolution.set(w * bloomK, h * bloomK);
    camera.aspect = w / h;
    // 竖屏时拉远,保证整个神经核在画面内
    camera.userData.fit = w / h < 1 ? 1.55 : 1.0;
    camera.updateProjectionMatrix();
  }
  addEventListener('resize', resize); resize();

  /* v0.9.2 帧时探测:开场前约 1.5 秒取帧时中位数,低于约 26fps 就当场降一档(降分辨率/辉光 → 减粒子/城市 → 关辉光),
     并记住本机结果,下次直接用低一档建场景。用户手动选了画质或 URL ?tier= 时不干预。 */
  const degradeFns = [];
  let level = 0, frames = 0, samples = [], probeFrom = 0;
  const STEPS = 3;
  function degrade() {
    if (level >= STEPS) return false;
    level++;
    if (level === 1) { prCap = Math.max(0.75, prCap * 0.7); bloomK *= 0.6; renderer.setPixelRatio(Math.min(devicePixelRatio || 1, prCap)); resize(); }
    if (level === 3) { bloom.enabled = false; }
    degradeFns.forEach(f => { try { f(level); } catch (e) {} });
    // 第 1 步(降分辨率)就够的不记;第 2 步起才记住本机下次直接低一档建场景
    if (level >= 2) try {
      const next = ORDER[Math.min(ORDER.length - 1, ORDER.indexOf(tierName) + 1)];
      const cur = localStorage.getItem(AUTO_KEY);
      if (!cur || ORDER.indexOf(next) > ORDER.indexOf(cur)) localStorage.setItem(AUTO_KEY, next);
    } catch (e) {}
    console.info('[奇点前夜] 帧率偏低,自动降档 →', level);
    return true;
  }
  function probe(now, frameMs) {
    if (forced || level >= STEPS) return;
    frames++;
    if (frames < 20) { probeFrom = now; return; }          // 跳过首帧编译抖动
    samples.push(frameMs);
    if (now - probeFrom > 1500 && samples.length >= 12) {
      const m = samples.slice().sort((a, b) => a - b)[samples.length >> 1];
      samples = []; probeFrom = now;
      if (m > 38) degrade(); else if (frames > 600) frames = -1e9;   // 稳定后停止探测
    }
  }

  let running = true, raf = 0, last = performance.now(), cb = null;
  const loop = (now) => {
    raf = requestAnimationFrame(loop);
    if (!running) return;
    const ms = now - last;
    const dt = Math.min(0.05, ms / 1000); last = now;
    cb && cb(dt, now / 1000);
    composer.render();
    probe(now, ms);
  };
  document.addEventListener('visibilitychange', () => { running = !document.hidden; last = performance.now(); samples = []; probeFrom = performance.now(); });
  return {
    THREE, renderer, scene, camera, composer, bloom, holeMask, tier: T, tierName, resize,
    start(fn) { cb = fn; raf = requestAnimationFrame(loop); },
    onDegrade(fn) { degradeFns.push(fn); },
    degrade,
    get level() { return level; },
    // 着色器预编译:建好场景后先编译全部材质并离屏渲染一帧,避免开场第一秒卡顿
    precompile() { try { renderer.compile(scene, camera); composer.render(); } catch (e) {} },
    renderOnce() { composer.render(); },
  };
}
