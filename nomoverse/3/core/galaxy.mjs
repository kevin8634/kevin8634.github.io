/* 宙律 3.0 · GPGPU 星空(3-6,α7)—— three r186 本地 vendor,自研,不含第三方源码。
 * 效果参考 React Bits「Galaxy」(星点闪烁、色相分层、指针排斥、整体缓慢旋转;只参考观感,不搬代码,署名见 ../../LICENSES.md)。
 * 做法:粒子状态存在浮点数据纹理里(边长 64/128/256 = 4k/16k/65k 粒子),每帧一个全屏四边形着色器读旧状态、写新状态(ping-pong 渲染目标);
 *   点精灵顶点着色器按 uv 读位置纹理。运动 = 绕 Y 轴差速旋转(内快外慢,ω ∝ r^-1/2)+ 上下缓慢起伏,半径锁回初始值不漂移。
 * 亮度:闪烁频率 ≤0.5 Hz、幅度 ±30%,单点亮度钳到 lumMax;减少动态时不步进、不闪烁、不排斥。
 * 不支持浮点渲染目标时 floatType() 返回 null,调用方退普通点云。dispose() 释放全部纹理、渲染目标、几何与材质。 */

export function floatType(THREE, renderer) {
  try {
    const ext = renderer.extensions;
    if (renderer.capabilities.isWebGL2 && ext.has('EXT_color_buffer_float')) return THREE.FloatType;
    if (ext.has('EXT_color_buffer_half_float')) return THREE.HalfFloatType;
  } catch (e) { /* 老驱动 */ }
  return null;
}

const SIM_VS = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
const SIM_FS = `
precision highp float;
uniform sampler2D uPos; uniform sampler2D uOrig; uniform float uDt; uniform float uTime; uniform float uSpin;
varying vec2 vUv;
void main(){
  vec4 s = texture2D(uPos, vUv); vec4 o = texture2D(uOrig, vUv);
  float r0 = length(o.xz); float r = max(length(s.xz), 1e-3);
  float w = uSpin * 7.5 / sqrt(max(r0, 6.0));            // 差速:内快外慢
  float a = w * uDt; float c = cos(a); float sn = sin(a);
  vec2 xz = vec2(c * s.x - sn * s.z, sn * s.x + c * s.z);
  xz *= r0 / max(length(xz), 1e-3);                        // 半径锁回初始值,不漂移
  float y = o.y + sin(uTime * 0.21 + s.w * 6.2831) * (0.4 + 0.012 * r0);
  gl_FragColor = vec4(xz.x, y, xz.y, s.w);
}`;
const PT_VS = `
precision highp float;
uniform sampler2D uPos; uniform sampler2D uOrig; uniform float uTime; uniform float uSize; uniform float uPR;
uniform float uDensity; uniform float uLumMax; uniform float uTwinkle; uniform vec2 uMouse; uniform float uMouseOn;
varying vec3 vCol; varying float vA;
void main(){
  vec4 s = texture2D(uPos, position.xy); vec4 o = texture2D(uOrig, position.xy);
  vec4 mv = modelViewMatrix * vec4(s.xyz, 1.0);
  gl_Position = projectionMatrix * mv;
  /* 指针排斥(屏幕空间,柔和) */
  vec2 nd = gl_Position.xy / gl_Position.w - uMouse; float d2 = dot(nd, nd);
  gl_Position.xy += uMouseOn * normalize(nd + 1e-5) * 0.06 * exp(-d2 / 0.02) * gl_Position.w;
  float f = 0.12 + 0.38 * fract(s.w * 7.13);                // 闪烁频率 0.12–0.5 Hz(远低于 3 Hz)
  float tw = 1.0 + uTwinkle * sin(6.2831 * f * uTime + s.w * 40.0);
  float t = position.z;                                     // 色相分层:0 冷白、1 紫、2 金
  vCol = t < 0.5 ? vec3(0.86, 0.91, 1.0) : (t < 1.5 ? vec3(0.66, 0.55, 0.98) : vec3(0.91, 0.78, 0.47));
  vA = min(uLumMax, (0.25 + 0.75 * o.w) * uDensity * tw);
  gl_PointSize = min(uSize * uPR * (0.55 + 0.9 * o.w) * (260.0 / max(-mv.z, 1.0)), 14.0 * uPR);   // 近处星点封顶,不成亮斑
}`;
const PT_FS = `
precision highp float;
varying vec3 vCol; varying float vA;
void main(){
  vec2 p = gl_PointCoord - 0.5; float d = length(p);
  float a = smoothstep(0.5, 0.0, d); a *= a;
  gl_FragColor = vec4(vCol * vA * a, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

/* f32:skyField [x,y,z,亮度]×n(Worker 生成,按种子确定) */
export function createGalaxy(THREE, renderer, f32, { type, density = 1, lumMax = 1.6, pixelRatio = 1, size = 1.1 } = {}) {
  const n = f32.length / 4;
  let side = 1; while (side * side < n) side <<= 1;
  const N = side * side;
  const orig = new Float32Array(N * 4), st = new Float32Array(N * 4);
  for (let i = 0; i < N; i++) {
    const j = (i % n) * 4;
    orig[i * 4] = f32[j]; orig[i * 4 + 1] = f32[j + 1]; orig[i * 4 + 2] = f32[j + 2]; orig[i * 4 + 3] = i < n ? f32[j + 3] : 0;
    const ph = ((Math.imul(i + 1, 2654435761) >>> 0) % 100000) / 100000;
    st[i * 4] = f32[j]; st[i * 4 + 1] = f32[j + 1]; st[i * 4 + 2] = f32[j + 2]; st[i * 4 + 3] = ph;
  }
  const mkTex = (d) => { const t = new THREE.DataTexture(d, side, side, THREE.RGBAFormat, THREE.FloatType); t.minFilter = t.magFilter = THREE.NearestFilter; t.generateMipmaps = false; t.needsUpdate = true; return t; };
  const tOrig = mkTex(orig), tInit = mkTex(st);
  const rtOpt = { type, format: THREE.RGBAFormat, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, depthBuffer: false, stencilBuffer: false, generateMipmaps: false };
  let rtA = new THREE.WebGLRenderTarget(side, side, rtOpt), rtB = new THREE.WebGLRenderTarget(side, side, rtOpt);
  const simMat = new THREE.ShaderMaterial({ vertexShader: SIM_VS, fragmentShader: SIM_FS, depthTest: false, depthWrite: false,
    uniforms: { uPos: { value: tInit }, uOrig: { value: tOrig }, uDt: { value: 0 }, uTime: { value: 0 }, uSpin: { value: 0.012 } } });
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), simMat); quad.frustumCulled = false;
  const simScene = new THREE.Scene(); simScene.add(quad);
  const simCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  /* 点:position = (u, v, 色相层),不存世界坐标 */
  const ref = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { ref[i * 3] = ((i % side) + 0.5) / side; ref[i * 3 + 1] = (Math.floor(i / side) + 0.5) / side; ref[i * 3 + 2] = i % 3; }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(ref, 3));
  const mat = new THREE.ShaderMaterial({ vertexShader: PT_VS, fragmentShader: PT_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uPos: { value: tInit }, uOrig: { value: tOrig }, uTime: { value: 0 }, uSize: { value: size }, uPR: { value: pixelRatio }, uDensity: { value: density },
      uLumMax: { value: lumMax }, uTwinkle: { value: 0.3 }, uMouse: { value: new THREE.Vector2(9, 9) }, uMouseOn: { value: 0 } } });
  const points = new THREE.Points(geo, mat); points.frustumCulled = false; points.renderOrder = -1;
  let time = 0, first = true;
  function step(dt, reduced) {
    if (reduced && !first) return;
    time += reduced ? 0 : dt;
    const prev = renderer.getRenderTarget();
    simMat.uniforms.uPos.value = first ? tInit : rtA.texture;
    simMat.uniforms.uDt.value = reduced ? 0 : dt; simMat.uniforms.uTime.value = time;
    renderer.setRenderTarget(rtB); renderer.render(simScene, simCam); renderer.setRenderTarget(prev);
    const t = rtA; rtA = rtB; rtB = t; first = false;
    mat.uniforms.uPos.value = rtA.texture; mat.uniforms.uTime.value = time;
    mat.uniforms.uTwinkle.value = reduced ? 0 : 0.3;
  }
  return {
    points, count: n, side,
    step,
    setDensity(d) { mat.uniforms.uDensity.value = d; },
    setPixelRatio(p) { mat.uniforms.uPR.value = p; },
    setMouse(x, y, on) { mat.uniforms.uMouse.value.set(x, y); mat.uniforms.uMouseOn.value = on ? 1 : 0; },
    /* 读回一个粒子的位置(仅自测:确认着色器真的在更新数据纹理) */
    probe(i = 0) { const buf = new Float32Array(4), x = i % side, y = Math.floor(i / side); try { renderer.readRenderTargetPixels(rtA, x, y, 1, 1, buf); } catch (e) { return null; } return Array.from(buf); },
    dispose() { [rtA, rtB].forEach((r) => r.dispose()); [tOrig, tInit].forEach((t) => t.dispose()); quad.geometry.dispose(); simMat.dispose(); geo.dispose(); mat.dispose(); }
  };
}
