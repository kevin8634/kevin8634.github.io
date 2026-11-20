/* 宙律 Nomoverse 3.0 · 渲染层 core/render3.mjs(3-2)
 * 只读 scene.describe() 的场景描述 desc(+ skyField 粒子),不读任何物理量;three r186 本地 vendor,零外部请求。
 * 画面:玻璃球(high/medium 物理薄壳 + 清漆虹彩,low 档 Phong 薄壳)+ 台座 + 球内恒星系(恒星、行星、轨道蓝图线、宜居带环)+ 球内星云 + 外圈星空粒子。
 * 失败:按 desc.failVisual.mode 换配色与特效(红外伪彩/冷灰/霜,不用刺眼红)。
 * 性能:像素比按档上限(手机 ≤1.5)、页面隐藏暂停、减少动态时只渲染静帧;AgX 调色 + 曝光上限,不过曝。
 * 无 WebGL:init 返回 null,页面改用 draw2D()(同一份 desc 的 Canvas 2D 版,功能不减)。 */
import * as THREE from '../../vendor/three.module.min.js';
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

  /* 星空(球外背景):skyField Float32Array [x,y,z,亮度]*n */
  let sky = null;
  const dot = glowTexture([[0, 'rgba(255,255,255,1)'], [0.25, 'rgba(255,255,255,.6)'], [1, 'rgba(255,255,255,0)']]);
  function setSky(f32, density = 1) {
    if (sky) { scene.remove(sky); sky.geometry.dispose(); sky.material.dispose(); }
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
    scene.add(sky);
  }

  /* 恒星系组(每次 update 重建并释放) */
  let sys = null, planets = [], starMesh = null, starGlow = null, failFx = null, desc = null, t0 = performance.now(), tVis = 0;
  const nebTex = glowTexture([[0, 'rgba(255,255,255,.55)'], [0.4, 'rgba(255,255,255,.18)'], [1, 'rgba(255,255,255,0)']]);
  const starTex = glowTexture([[0, 'rgba(255,255,255,1)'], [0.18, 'rgba(255,244,214,.85)'], [0.5, 'rgba(255,200,120,.18)'], [1, 'rgba(0,0,0,0)']]);

  function update(d) {
    desc = d;
    if (sys) { scene.remove(sys); disposeTree(sys); }
    sys = new THREE.Group(); sys.rotation.x = 0.32; sys.rotation.z = -0.08;
    planets = []; failFx = null;
    const fv = d.failVisual, pal = fv ? fv.palette.map((x) => new THREE.Color(x)) : null;

    /* 球内星云:几团加色精灵,配色随成败 */
    const nebCols = pal ? [pal[0], pal[1], pal[0]] : [new THREE.Color(0x7c5cff), new THREE.Color(0x22d3ee), new THREE.Color(0xc084fc)];
    const rnd = mulberry(d.seed ^ 0x1b);
    for (let i = 0; i < 9; i++) {
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
    }
    scene.add(sys);
    if (reduced) frame(performance.now(), true);
  }

  /* 尺寸与像素比 */
  let dprCap = Math.min(budget ? budget.dpr : 1.5, mobile ? 1.5 : 2);
  function resize() {
    const w = canvas.clientWidth || 1, h = canvas.clientHeight || 1;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, dprCap));
    renderer.setSize(w, h, false);
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
    if (!desc) return;
    const dt = reduced ? 0 : Math.min(0.05, (now - t0) / 1000); t0 = now;
    tVis += dt * 0.18;
    planets.forEach((m) => { const q = orbitPosOf(m.userData.p, tVis); m.position.set(q[0], q[1], q[2]); });
    if (!reduced) {
      sys.rotation.y += dt * 0.03;
      if (sky) sky.rotation.y += dt * 0.004;
      if (failFx === 'collapse') { const s = 0.75 + 0.25 * Math.cos(tVis * 2.2); sys.scale.setScalar(s); }
      else if (failFx && failFx.rotation) failFx.rotation.z += dt * 0.6;
    }
    renderer.render(scene, cam);
    onFrame && onFrame(now);
  }
  document.addEventListener('visibilitychange', vis);
  function vis() { hidden = document.hidden; cancelAnimationFrame(raf); if (!hidden && !reduced) raf = requestAnimationFrame(frame); }
  resize();
  if (!reduced && !hidden) raf = requestAnimationFrame(frame);

  return {
    THREE, renderer, update, setSky,
    setTier(t, b) { dprCap = Math.min(b.dpr, mobile ? 1.5 : 2); buildGlass(t); resize(); },
    setReduced(r) { reduced = r; vis(); if (r) frame(performance.now(), true); },
    onFrame(f) { onFrame = f; },
    snapshot() { frame(performance.now(), true); return { planets: planets.length, sky: sky ? sky.geometry.attributes.position.count : 0, calls: renderer.info.render.calls, tris: renderer.info.render.triangles }; },
    dispose() { cancelAnimationFrame(raf); document.removeEventListener('visibilitychange', vis); ro && ro.disconnect(); [sys, glass, ped, sky].forEach((o) => o && disposeTree(o)); [dot, nebTex, starTex, floorTex].forEach((t) => t.dispose()); renderer.dispose(); }
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
