/* 宙律 Nomoverse 3.0 · 渲染层 core/render3.mjs(3-2)
 * 只读 scene.describe() 的场景描述 desc(+ skyField 粒子),不读任何物理量;three r186 本地 vendor,零外部请求。
 * 画面:玻璃球(high/medium 物理薄壳 + 清漆虹彩,low 档 Phong 薄壳)+ 台座 + 球内恒星系(恒星、行星、轨道蓝图线、宜居带环)+ 球内星云 + 外圈星空粒子。
 * 失败:按 desc.failVisual.mode 换配色与特效(红外伪彩/冷灰/霜,不用刺眼红)。
 * 性能:像素比按档上限(手机 ≤1.5)、页面隐藏暂停、减少动态时只渲染静帧;AgX 调色 + 曝光上限,不过曝。
 * 无 WebGL:init 返回 null,页面改用 draw2D()(同一份 desc 的 Canvas 2D 版,功能不减)。
 * 3-6(α7):三档预算(core/access.mjs QBUDGET:粒子 4k/16k/65k、像素比 1/1.5/2、后期 无/钳制+暗角/柔光+MSAA);
 *   mid/high 星空走 core/galaxy.mjs GPGPU(数据纹理 + 着色器更新位置),low 退普通点云;
 *   亮度上限:后期在 AgX 前把线性亮度钳到 LUM_MAX,恒星光晕 ≤ GLOW_MAX;恒星亮度跳变走 FlashGate(≤3 次/秒)+ 指数淡入;大爆炸脉冲半正弦、间隔 ≥1 s;
 *   切档时 dispose 旧的几何、材质、纹理、渲染目标(内存不随切档增长)。 */
import * as THREE from '../../vendor/three.module.min.js';
import { createGalaxy, floatType } from './galaxy.mjs';
import { FlashGate, lumFollow, pulseEnv, LUM_MAX, GLOW_MAX } from './access.mjs';
/* 每帧位置用 scene.js 的 orbitPos(页面以经典脚本加载 core/scene.js,只读) */
const orbitPosOf = (p, t) => window.NV3_SCENE.orbitPos(p, t);

const SPHERE_R = 10.6;
const PHYS_GLASS = { high: true, medium: true, low: false };

function glowTexture(stops) {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  stops.forEach(([o, col]) => gr.addColorStop(o, col));
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function disposeTree(o) {
  o.traverse((x) => { if (x.geometry) x.geometry.dispose(); if (x.material) [].concat(x.material).forEach((m) => { m.map && m.userData.own && m.map.dispose(); m.dispose(); }); });
}
const rgbCol = (a) => new THREE.Color().setRGB(a[0], a[1], a[2], THREE.SRGBColorSpace);

export function webglOK() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; }
}

export function init(canvas, { tier = 'medium', budget, reduced = false, mobile = false } = {}) {
  let B = budget || { dpr: 1, gpgpu: false, post: false, glow: 0, samples: 0, nebula: 9 };
  if (!webglOK()) return null;
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: tier !== 'low', alpha: false, powerPreference: 'high-performance' }); }
  catch (e) { return null; }
  renderer.toneMapping = THREE.AgXToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x05060f, 1);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x05060f, 0.006);
  const cam = new THREE.PerspectiveCamera(38, 1, 0.1, 400);
  const home = new THREE.Vector3(0, 7.5, 41);
  cam.position.copy(home); cam.lookAt(0, -2, 0);

  /* 光:环境 + 恒星点光(恒星系内)+ 顶部轮廓光(玻璃高光) */
  scene.add(new THREE.AmbientLight(0x8890c0, 0.35));
  const key = new THREE.DirectionalLight(0xcfd6ff, 1.1); key.position.set(-14, 22, 18); scene.add(key);
  const rim = new THREE.DirectionalLight(0xa78bfa, 0.9); rim.position.set(16, 6, -20); scene.add(rim);
  const starLight = new THREE.PointLight(0xffffff, 60, 0, 1.6); scene.add(starLight);

  /* 台座:三层圆台 + 发光环 */
  const ped = new THREE.Group(); ped.position.y = -SPHERE_R - 0.2;
  const pedMat = new THREE.MeshStandardMaterial({ color: 0x1a1b33, metalness: 0.85, roughness: 0.28 });
  [[7.2, 7.8, 0.9, -0.45], [6.0, 6.6, 0.7, 0.35], [4.6, 5.2, 0.6, 0.95]].forEach(([a, b, h, y]) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(a, b, h, 72), pedMat); m.position.y = y; ped.add(m);
  });
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xa78bfa, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(7.55, 0.05, 8, 128), ringMat); ring.rotation.x = Math.PI / 2; ring.position.y = 0.02; ped.add(ring);
  const floorTex = glowTexture([[0, 'rgba(167,139,250,.45)'], [0.35, 'rgba(90,70,170,.18)'], [1, 'rgba(0,0,0,0)']]);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshBasicMaterial({ map: floorTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -0.95; ped.add(floor);
  scene.add(ped);

  /* 玻璃球:high/medium 透射;low 用菲涅尔感的半透明壳(不透射、不模糊) */
  let glass = null;
  function buildGlass(t) {
    if (glass) { scene.remove(glass); disposeTree(glass); }
    const geo = new THREE.SphereGeometry(SPHERE_R, mobile ? 64 : 96, mobile ? 48 : 72);
    /* 不用 transmission:透射通道只采不透明物体,会把球内的轨道线、星云、宜居带(都是半透明)吞掉。
     * high/medium 用物理材质的薄壳(清漆 + 虹彩 + 高光,半透明不写深度);low 用 Phong 薄壳。 */
    const mat = PHYS_GLASS[t]
      ? new THREE.MeshPhysicalMaterial({ color: 0xc8ceff, metalness: 0, roughness: 0.06, transparent: true, opacity: 0.16, depthWrite: false, clearcoat: 1, clearcoatRoughness: 0.04, iridescence: 0.6, iridescenceIOR: 1.3, specularIntensity: 1, sheen: 0.4, sheenColor: new THREE.Color(0xa78bfa) })
      : new THREE.MeshPhongMaterial({ color: 0xbfc6ff, specular: 0xffffff, shininess: 120, transparent: true, opacity: 0.12, depthWrite: false });
    glass = new THREE.Mesh(geo, mat); glass.renderOrder = 10; scene.add(glass);
  }
  buildGlass(tier);

  /* 星空(球外背景):skyField Float32Array [x,y,z,亮度]*n;mid/high 走 GPGPU,low(或无浮点渲染目标)退普通点云 */
  let sky = null, galaxy = null, skyKind = 'none';
  const FT = floatType(THREE, renderer);
  const dot = glowTexture([[0, 'rgba(255,255,255,1)'], [0.25, 'rgba(255,255,255,.6)'], [1, 'rgba(255,255,255,0)']]);
  function dropSky() {
    if (galaxy) { scene.remove(galaxy.points); galaxy.dispose(); galaxy = null; }
    if (sky) { scene.remove(sky); sky.geometry.dispose(); sky.material.dispose(); sky = null; }
    skyKind = 'none';
  }
  function setSky(f32, density = 1) {
    dropSky();
    if (B.gpgpu && FT) {
      try {
        galaxy = createGalaxy(THREE, renderer, f32, { type: FT, density, lumMax: 1.6, pixelRatio: renderer.getPixelRatio() });
        galaxy.step(0, true); scene.add(galaxy.points); skyKind = 'gpgpu';
        if (reduced || hidden) frame(performance.now(), true);
        return;
      } catch (e) { if (galaxy) { galaxy.dispose(); galaxy = null; } }
    }
    const n = f32.length / 4, pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
    const tint = [new THREE.Color(0xdbe8ff), new THREE.Color(0xa78bfa), new THREE.Color(0xe9c779)];
    for (let i = 0; i < n; i++) {
      pos[i * 3] = f32[i * 4]; pos[i * 3 + 1] = f32[i * 4 + 1]; pos[i * 3 + 2] = f32[i * 4 + 2];
      const b = (0.25 + 0.75 * f32[i * 4 + 3]) * density, c = tint[i % 3];
      col[i * 3] = c.r * b; col[i * 3 + 1] = c.g * b; col[i * 3 + 2] = c.b * b;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    sky = new THREE.Points(g, new THREE.PointsMaterial({ size: 0.55, map: dot, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    scene.add(sky); skyKind = 'points';
    if (reduced || hidden) frame(performance.now(), true);
  }

  /* 后期:HDR 渲染目标 → (high)1/4 分辨率 bright-pass + 两次模糊 → 合成:亮度钳制 + 暗角 → AgX + sRGB 输出 */
  let post = null;
  const QUAD_VS = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
  function buildPost() {
    dropPost();
    if (!B.post) return;
    const sz = renderer.getDrawingBufferSize(new THREE.Vector2());
    const hdr = { type: THREE.HalfFloatType, format: THREE.RGBAFormat, samples: B.samples || 0, depthBuffer: true };
    const rt = new THREE.WebGLRenderTarget(Math.max(1, sz.x), Math.max(1, sz.y), hdr);
    const q = (w, h) => new THREE.WebGLRenderTarget(Math.max(1, w), Math.max(1, h), { type: THREE.HalfFloatType, format: THREE.RGBAFormat, depthBuffer: false });
    const glowOn = B.glow > 0;
    const rtA = glowOn ? q(sz.x >> 2, sz.y >> 2) : null, rtB = glowOn ? q(sz.x >> 2, sz.y >> 2) : null;
    const blur = glowOn ? new THREE.ShaderMaterial({ vertexShader: QUAD_VS, depthTest: false, depthWrite: false, toneMapped: false,
      uniforms: { tSrc: { value: null }, uDir: { value: new THREE.Vector2(1, 0) }, uPx: { value: new THREE.Vector2(1, 1) }, uBright: { value: 1 }, uLumMax: { value: LUM_MAX } },
      fragmentShader: `precision highp float; uniform sampler2D tSrc; uniform vec2 uDir; uniform vec2 uPx; uniform float uBright; uniform float uLumMax; varying vec2 vUv;
        vec3 pick(vec2 o){ vec3 c = texture2D(tSrc, vUv + o).rgb; if (uBright > 0.5) { float l = dot(c, vec3(.2126,.7152,.0722)); c *= smoothstep(0.55, 1.4, l) * min(1.0, uLumMax / max(l, 1e-4)); } return c; }
        void main(){ vec2 d = uDir * uPx; vec3 c = pick(vec2(0.)) * .227027;
          c += (pick(d * 1.3846) + pick(-d * 1.3846)) * .316216; c += (pick(d * 3.2308) + pick(-d * 3.2308)) * .070270;
          gl_FragColor = vec4(c, 1.0); }` }) : null;
    const comp = new THREE.ShaderMaterial({ vertexShader: QUAD_VS, depthTest: false, depthWrite: false,
      uniforms: { tScene: { value: rt.texture }, tGlow: { value: rtB ? rtB.texture : null }, uGlow: { value: glowOn ? B.glow : 0 }, uLumMax: { value: LUM_MAX }, uVig: { value: 0.28 } },
      fragmentShader: `precision highp float; uniform sampler2D tScene; uniform sampler2D tGlow; uniform float uGlow; uniform float uLumMax; uniform float uVig; varying vec2 vUv;
        void main(){ vec3 c = texture2D(tScene, vUv).rgb; if (uGlow > 0.0) c += texture2D(tGlow, vUv).rgb * uGlow;
          float l = dot(c, vec3(.2126,.7152,.0722)); if (l > uLumMax) c *= uLumMax / l;          /* 亮度上限:进 AgX 前钳制 */
          vec2 p = vUv - 0.5; c *= 1.0 - uVig * smoothstep(0.25, 0.75, dot(p, p) * 2.0);
          gl_FragColor = vec4(c, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }` });
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), comp); quad.frustumCulled = false;
    const ps = new THREE.Scene(); ps.add(quad);
    post = { rt, rtA, rtB, blur, comp, quad, ps, cam: new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1) };
  }
  function dropPost() {
    if (!post) return;
    [post.rt, post.rtA, post.rtB].forEach((r) => r && r.dispose());
    post.blur && post.blur.dispose(); post.comp.dispose(); post.quad.geometry.dispose(); post = null;
  }
  function renderPost() {
    renderer.setRenderTarget(post.rt); renderer.render(scene, cam);
    if (post.blur) {
      const W = post.rtA.width, H = post.rtA.height; post.blur.uniforms.uPx.value.set(1 / W, 1 / H);
      post.quad.material = post.blur;
      post.blur.uniforms.tSrc.value = post.rt.texture; post.blur.uniforms.uDir.value.set(1, 0); post.blur.uniforms.uBright.value = 1;
      renderer.setRenderTarget(post.rtA); renderer.render(post.ps, post.cam);
      post.blur.uniforms.tSrc.value = post.rtA.texture; post.blur.uniforms.uDir.value.set(0, 1); post.blur.uniforms.uBright.value = 0;
      renderer.setRenderTarget(post.rtB); renderer.render(post.ps, post.cam);
      post.quad.material = post.comp;
    }
    renderer.setRenderTarget(null); renderer.render(post.ps, post.cam);
  }

  /* 恒星系组(每次 update 重建并释放) */
  let sys = null, planets = [], starMesh = null, starGlow = null, failFx = null, desc = null, t0 = performance.now(), tVis = 0;
  const nebTex = glowTexture([[0, 'rgba(255,255,255,.55)'], [0.4, 'rgba(255,255,255,.18)'], [1, 'rgba(255,255,255,0)']]);
  const starTex = glowTexture([[0, 'rgba(255,255,255,1)'], [0.18, 'rgba(255,244,214,.85)'], [0.5, 'rgba(255,200,120,.18)'], [1, 'rgba(0,0,0,0)']]);

  /* 亮度:恒星跳变走闸门(≤3 次/秒)+ 指数淡入;k = 当前显示亮度 / 本场景目标亮度 */
  const gate = new FlashGate({ hz: 3, jump: 0.12 });
  let pendingDesc = null, lumK = 1, lumNow = null, base = null, pulseT0 = -1e9, gateTimer = 0;
  const sceneLum = (d) => (d.star.lit ? 0.4 + 0.6 * Math.min(1, d.star.glow) : 0.06) * (d.failVisual && d.failVisual.mode === 'flash' ? 1.3 : 1);
  function update(d) {
    const now = performance.now(), L = sceneLum(d), shown = gate.push(now, L);
    if (shown !== L) { pendingDesc = d; if (reduced || hidden) { clearTimeout(gateTimer); gateTimer = setTimeout(() => { const p = pendingDesc; pendingDesc = null; if (p) update(p); }, gate.wait(now) + 4); } return; }
    pendingDesc = null;
    lumK = lumNow == null ? 1 : Math.min(3, lumNow / L); lumNow = L;
    applyDesc(d);
  }
  function applyDesc(d) {
    desc = d;
    if (sys) { scene.remove(sys); disposeTree(sys); }
    sys = new THREE.Group(); sys.rotation.x = 0.32; sys.rotation.z = -0.08;
    planets = []; failFx = null;
    const fv = d.failVisual, pal = fv ? fv.palette.map((x) => new THREE.Color(x)) : null;

    /* 球内星云:几团加色精灵,配色随成败 */
    const nebCols = pal ? [pal[0], pal[1], pal[0]] : [new THREE.Color(0x7c5cff), new THREE.Color(0x22d3ee), new THREE.Color(0xc084fc)];
    const rnd = mulberry(d.seed ^ 0x1b);
    for (let i = 0; i < (B.nebula || 9); i++) {
      const m = new THREE.SpriteMaterial({ map: nebTex, color: nebCols[i % 3], transparent: true, opacity: 0.16 * (d.sky.density * 0.6 + 0.4), depthWrite: false, blending: THREE.AdditiveBlending });
      const s = new THREE.Sprite(m), r = 3 + 5 * rnd(), a = 6.283 * rnd();
      s.position.set(Math.cos(a) * r, (rnd() - 0.5) * 6, Math.sin(a) * r); s.scale.setScalar(6 + 7 * rnd()); sys.add(s);
    }

    /* 恒星 */
    const sc = d.star.lit ? rgbCol(d.star.rgb) : (pal ? pal[0] : new THREE.Color(0x7c2d12));
    starMesh = new THREE.Mesh(new THREE.SphereGeometry(d.star.size, 48, 32), new THREE.MeshBasicMaterial({ color: sc }));
    sys.add(starMesh);
    starGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: starTex, color: sc, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: Math.min(0.85, 0.25 + 0.4 * d.star.glow) }));
    starGlow.scale.setScalar(d.star.size * (4 + 4 * d.star.glow)); sys.add(starGlow);
    starLight.color.copy(sc); starLight.intensity = d.star.lit ? 40 + 40 * d.star.glow : 4;
    base = { op: starGlow.material.opacity, light: starLight.intensity, col: sc.clone() };

    /* 宜居带环 */
    if (d.hz) {
      const hz = new THREE.Mesh(new THREE.RingGeometry(d.hz.rIn, d.hz.rOut, 128, 1), new THREE.MeshBasicMaterial({ color: 0x34d399, transparent: true, opacity: 0.09, side: THREE.DoubleSide, depthWrite: false }));
      hz.rotation.x = -Math.PI / 2; sys.add(hz);
    }
    /* 行星 + 轨道蓝图线 */
    d.planets.forEach((p) => {
      const pts = []; for (let k = 0; k <= 160; k++) { const E = (k / 160) * 6.2832; pts.push(new THREE.Vector3(p.r * (Math.cos(E) - p.e), 0, p.r * Math.sqrt(1 - p.e * p.e) * Math.sin(E))); }
      sys.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0x7cc8ff, transparent: true, opacity: 0.38 })));
      const m = new THREE.Mesh(new THREE.SphereGeometry(p.size * 2.2, 32, 24), new THREE.MeshStandardMaterial({ color: new THREE.Color(p.tint), roughness: 0.7, metalness: 0.05, emissive: new THREE.Color(p.tint), emissiveIntensity: 0.12 }));
      m.userData.p = p; sys.add(m); planets.push(m);
    });

    /* 失败特效 */
    scene.fog.color.set(0x05060f); scene.fog.density = 0.006;
    if (fv) {
      if (fv.mode === 'black_hole') {
        starMesh.material.color.set(0x000000); starGlow.material.opacity = 0.15;
        failFx = new THREE.Mesh(new THREE.TorusGeometry(d.star.size * 3.2, d.star.size * 0.5, 16, 96), new THREE.MeshBasicMaterial({ color: pal[0], transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false }));
        failFx.rotation.x = Math.PI / 2.4; sys.add(failFx);
      } else if (fv.mode === 'frost' || fv.mode === 'freeze' || fv.mode === 'inert_gas') {
        scene.fog.color.set(0x1a2233); scene.fog.density = 0.012;
      } else if (fv.mode === 'collapse') {
        failFx = 'collapse';
      } else if (fv.mode === 'flash') {
        starGlow.scale.multiplyScalar(1.8);
      } else if (fv.mode === 'dark_star') {
        starGlow.material.opacity = 0.2;
      }
      base.op = starGlow.material.opacity; base.col = starMesh.material.color.clone();
    }
    applyLum(0);
    scene.add(sys);
    if (reduced) frame(performance.now(), true);
  }

  /* 恒星亮度:k(淡入中)× 大爆炸脉冲;光晕不透明度 ≤ GLOW_MAX */
  function applyLum(now) {
    if (!base || !starGlow) return;
    const env = reduced ? 0 : pulseEnv(now - pulseT0, 900, 1);
    const k = lumK * (1 + 0.45 * env);
    starGlow.material.opacity = Math.min(GLOW_MAX, base.op * k);
    starLight.intensity = Math.min(90, base.light * k);
    starMesh.material.color.copy(base.col).multiplyScalar(Math.min(1.25, k));
  }
  function pulse() {
    const now = performance.now();
    if (reduced || now - pulseT0 < 1000) return false;          // 减少动态不脉冲;两次脉冲间隔 ≥1 s
    pulseT0 = now; return true;
  }

  /* 尺寸与像素比 */
  let dprCap = Math.min(B.dpr || 1.5, mobile ? 1.5 : 2);
  function resize() {
    const w = canvas.clientWidth || 1, h = canvas.clientHeight || 1;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, dprCap));
    renderer.setSize(w, h, false);
    galaxy && galaxy.setPixelRatio(renderer.getPixelRatio());
    if (post) { const sz = renderer.getDrawingBufferSize(new THREE.Vector2()); post.rt.setSize(sz.x, sz.y); if (post.rtA) { post.rtA.setSize(Math.max(1, sz.x >> 2), Math.max(1, sz.y >> 2)); post.rtB.setSize(Math.max(1, sz.x >> 2), Math.max(1, sz.y >> 2)); } }
    cam.aspect = w / h;
    /* 竖屏时拉远,让整个玻璃球入画 */
    const fit = w / h < 1 ? 1.15 / (w / h) ** 0.85 : 1;
    cam.position.copy(home).multiplyScalar(fit); cam.lookAt(0, -2, 0);
    cam.updateProjectionMatrix();
    if (reduced || hidden) frame(performance.now(), true);
  }
  const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(resize) : null;
  ro ? ro.observe(canvas) : window.addEventListener('resize', resize);

  /* 帧循环:隐藏暂停;减少动态只渲染静帧 */
  let raf = 0, hidden = document.hidden, onFrame = null;
  function frame(now, once) {
    if (!once) raf = requestAnimationFrame(frame);
    if (pendingDesc && gate.wait(now) === 0) { const p = pendingDesc; pendingDesc = null; update(p); }
    if (!desc) return;
    const dt = reduced ? 0 : Math.min(0.05, (now - t0) / 1000); t0 = now;
    lumK = lumFollow(lumK, 1, dt, 0.14, reduced);
    applyLum(now);
    if (galaxy && !reduced) galaxy.step(dt, false);
    tVis += dt * 0.18;
    planets.forEach((m) => { const q = orbitPosOf(m.userData.p, tVis); m.position.set(q[0], q[1], q[2]); });
    if (!reduced) {
      sys.rotation.y += dt * 0.03;
      if (sky) sky.rotation.y += dt * 0.004;
      if (failFx === 'collapse') { const s = 0.75 + 0.25 * Math.cos(tVis * 2.2); sys.scale.setScalar(s); }
      else if (failFx && failFx.rotation) failFx.rotation.z += dt * 0.6;
    }
    if (post) renderPost(); else renderer.render(scene, cam);
    onFrame && onFrame(now);
  }
  document.addEventListener('visibilitychange', vis);
  function vis() { hidden = document.hidden; cancelAnimationFrame(raf); if (!hidden && !reduced) raf = requestAnimationFrame(frame); }
  /* 指针排斥(GPGPU 星空,Galaxy 思路):画布上移动指针,星点轻轻让开;减少动态关闭 */
  const onMove = (e) => { if (!galaxy || reduced || e.pointerType === 'touch') return; const r = canvas.getBoundingClientRect(); galaxy.setMouse(((e.clientX - r.left) / r.width) * 2 - 1, 1 - ((e.clientY - r.top) / r.height) * 2, true); };
  const onLeave = () => galaxy && galaxy.setMouse(9, 9, false);
  canvas.addEventListener('pointermove', onMove); canvas.addEventListener('pointerleave', onLeave);
  resize();
  buildPost();
  if (!reduced && !hidden) raf = requestAnimationFrame(frame);

  return {
    THREE, renderer, update, setSky, pulse,
    /* 切档:先释放旧星空(等 setSky 重建)、后期、玻璃,再按新预算重建;场景按新星云数重画 */
    setTier(t, b) { B = b || B; dprCap = Math.min(B.dpr, mobile ? 1.5 : 2); dropSky(); buildGlass(t); resize(); buildPost(); if (desc) applyDesc(desc); if (reduced || hidden) frame(performance.now(), true); },
    setReduced(r) { reduced = r; if (r && galaxy) galaxy.setMouse(9, 9, false); vis(); if (r) frame(performance.now(), true); },
    onFrame(f) { onFrame = f; },
    snapshot() { frame(performance.now(), true); const m = renderer.info.memory;
      return { planets: planets.length, sky: galaxy ? galaxy.count : sky ? sky.geometry.attributes.position.count : 0, skyKind, gpgpuSide: galaxy ? galaxy.side : 0, post: !!post, glow: !!(post && post.blur), samples: post ? post.rt.samples : 0,
        dpr: renderer.getPixelRatio(), floatRT: !!FT, calls: renderer.info.render.calls, tris: renderer.info.render.triangles, geometries: m.geometries, textures: m.textures, starGlow: starGlow ? +starGlow.material.opacity.toFixed(3) : 0 }; },
    probe: (i) => (galaxy ? galaxy.probe(i) : null),
    dispose() { cancelAnimationFrame(raf); clearTimeout(gateTimer); document.removeEventListener('visibilitychange', vis); canvas.removeEventListener('pointermove', onMove); canvas.removeEventListener('pointerleave', onLeave); ro && ro.disconnect(); dropSky(); dropPost(); [sys, glass, ped].forEach((o) => o && disposeTree(o)); [dot, nebTex, starTex, floorTex].forEach((t) => t.dispose()); renderer.dispose(); }
  };
}

function mulberry(a) { a >>>= 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

/* ---------- 无 WebGL:Canvas 2D 版(同一份 desc,俯视恒星系 + 玻璃球轮廓)---------- */
export function draw2D(canvas, d, tVis = 0) {
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5), w = canvas.clientWidth || 300, h = canvas.clientHeight || 300;
  canvas.width = w * dpr; canvas.height = h * dpr;
  const g = canvas.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.fillStyle = '#05060f'; g.fillRect(0, 0, w, h);
  const cx = w / 2, cy = h * 0.46, R = Math.min(w, h) * 0.36, k = R / 10.6;
  const neb = g.createRadialGradient(cx, cy, 0, cx, cy, R);
  const pal = d.failVisual ? d.failVisual.palette : ['#7c5cff', '#22d3ee'];
  neb.addColorStop(0, pal[0] + '55'); neb.addColorStop(0.7, pal[1] + '22'); neb.addColorStop(1, '#0000');
  g.fillStyle = neb; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.fill();
  if (d.hz) { g.strokeStyle = 'rgba(52,211,153,.22)'; g.lineWidth = (d.hz.rOut - d.hz.rIn) * k; g.beginPath(); g.ellipse(cx, cy, (d.hz.rIn + d.hz.rOut) / 2 * k, (d.hz.rIn + d.hz.rOut) / 2 * k * 0.42, 0, 0, 7); g.stroke(); }
  g.lineWidth = 1; g.strokeStyle = 'rgba(124,200,255,.4)';
  d.planets.forEach((p) => {
    g.beginPath(); g.ellipse(cx - p.e * p.r * k, cy, p.r * k, p.r * k * 0.42 * Math.sqrt(1 - p.e * p.e), 0, 0, 7); g.stroke();
    const q = orbitPosOf(p, tVis); g.fillStyle = p.tint; g.beginPath(); g.arc(cx + q[0] * k, cy + q[2] * k * 0.42, Math.max(3, p.size * 2.2 * k), 0, 7); g.fill();
  });
  const s = d.star, col = s.lit ? `rgb(${s.rgb.map((x) => Math.round(x * 255)).join(',')})` : pal[0];
  const sg = g.createRadialGradient(cx, cy, 0, cx, cy, s.size * k * 6); sg.addColorStop(0, col); sg.addColorStop(1, '#0000');
  g.fillStyle = sg; g.beginPath(); g.arc(cx, cy, s.size * k * 6, 0, 7); g.fill();
  g.strokeStyle = 'rgba(219,232,255,.35)'; g.lineWidth = 2; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.stroke();
  g.fillStyle = '#1a1b33'; g.fillRect(cx - R * 0.6, cy + R + 4, R * 1.2, 14);
}
