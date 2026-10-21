/* 元素工坊 Element Forge · 工坊七匠 3D 形象 ef-guide3d.js v0.3.1
   一个离屏 WebGL 渲染器轮流渲染七位向导,再拷到页面上已有的各个 <canvas>(省 WebGL 上下文)。
   只渲染在视口里的画布;低档 / 无 WebGL / 启动失败时 EF.drawGuide 继续用 2D 版。 */
import * as THREE from './vendor/three.module.min.js';
const EF = window.EF;
try { boot(); } catch (e) { console.warn('[ef] 3D 向导启动失败,保留 2D 版', e); }

function boot() {
  const S = 256;
  const cv = document.createElement('canvas'); cv.width = cv.height = S;
  const renderer = new THREE.WebGLRenderer({ canvas: cv, alpha: true, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1); renderer.setSize(S, S, false); renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);
  let lost = false;
  cv.addEventListener('webglcontextlost', e => { e.preventDefault(); lost = true; EF.g3 = null; });

  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(30, 1, 0.1, 50); cam.position.set(0, 0.15, 6.2); cam.lookAt(0, 0, 0);
  scene.add(new THREE.HemisphereLight(0xfff3e0, 0x2a1a3a, 1.5));
  const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(2.5, 3, 4); scene.add(key);
  const rim = new THREE.DirectionalLight(0xff9a3c, 1.6); rim.position.set(-3, -1, -2); scene.add(rim);

  const std = (c, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.38, metalness: 0.1 }, o));
  const glowMat = col => new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false });

  /* 脸:两只眼睛 + 高光 + 嘴(半圆环);贴在身体正前方,始终朝向镜头 */
  function face(r, z, dy = 0, eyeCol = 0x1a1206) {
    const f = new THREE.Group(), eyeM = std(eyeCol, { roughness: 0.2 }), hiM = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const eyes = [-1, 1].map(s => {
      const e = new THREE.Group();
      const ball = new THREE.Mesh(new THREE.SphereGeometry(r * 0.13, 20, 16), eyeM); ball.scale.set(0.85, 1.12, 0.5); e.add(ball);
      const hi = new THREE.Mesh(new THREE.SphereGeometry(r * 0.04, 10, 8), hiM); hi.position.set(r * 0.04, r * 0.05, r * 0.06); e.add(hi);
      e.position.set(s * r * 0.34, r * 0.06 + dy, z); f.add(e); return e;
    });
    const mouth = new THREE.Mesh(new THREE.TorusGeometry(r * 0.15, r * 0.035, 8, 24, Math.PI), eyeM);
    mouth.rotation.z = Math.PI; mouth.position.set(0, -r * 0.2 + dy, z); f.add(mouth);
    const cheekM = new THREE.MeshBasicMaterial({ color: 0xff7a7a, transparent: true, opacity: 0.35, depthWrite: false });
    [-1, 1].forEach(s => { const c = new THREE.Mesh(new THREE.CircleGeometry(r * 0.09, 16), cheekM); c.position.set(s * r * 0.55, -r * 0.12 + dy, z - r * 0.02); f.add(c); });
    f.userData = { eyes, mouth };
    return f;
  }
  function animFace(f, t, talk) {
    const blink = (Math.floor(t / 2.8) % 7 === 0 && (t % 2.8) < 0.14) ? 0.12 : 1;
    f.userData.eyes.forEach(e => { e.scale.y = blink; });
    const chatter = talk > 0.04 && talk < 0.985 ? talk * (0.5 + 0.5 * Math.sin(t * 22)) : 0;
    const m = f.userData.mouth; m.scale.set(1 + talk * 0.3, 1 + chatter * 1.6, 1);
  }
  function halo(col, s = 3.4) {
    const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
    const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,255,255,.55)'); g.addColorStop(0.45, 'rgba(255,255,255,.12)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, 128, 128); const t = new THREE.CanvasTexture(c);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, color: col, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    sp.scale.setScalar(s); sp.position.z = -1.2; return sp;
  }

  const B = {};
  /* 奥加 Oga · 118 号元素:发光原子核 + 三条电子轨道 */
  B.oga = () => {
    const g = new THREE.Group(), R = 0.95; g.add(halo(0xffb35c));
    const body = new THREE.Mesh(new THREE.SphereGeometry(R, 48, 36), std(0xffb35c, { emissive: 0x8a3008, emissiveIntensity: 0.55, roughness: 0.3 })); g.add(body);
    const rings = [];
    for (let i = 0; i < 3; i++) {
      const r = new THREE.Group(); r.rotation.set(1.2 + i * 0.35, i * 1.05, 0.3 * i);
      r.add(new THREE.Mesh(new THREE.TorusGeometry(1.45, 0.018, 8, 96), glowMat(0xffc884)));
      const el = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 10), glowMat(0xfff1c8)); el.position.x = 1.45; r.add(el);
      g.add(r); rings.push(r);
    }
    const f = face(R, R * 0.93); g.add(f);
    g.userData.anim = (t, talk) => { rings.forEach((r, i) => { r.rotation.z = t * (0.7 + i * 0.25) + i; }); animFace(f, t, talk); };
    return g;
  };
  /* 巴基 Bucky · 富勒烯 C60:真实截角二十面体笼子,里面一张笑脸 */
  B.bucky = () => {
    const g = new THREE.Group(); g.add(halo(0xffd27a));
    const p = (1 + Math.sqrt(5)) / 2, base = [[0, 1, 3 * p], [1, 2 + p, 2 * p], [p, 2, 2 * p + 1]], pts = [];
    base.forEach(([a, b, c]) => { [[a, b, c], [b, c, a], [c, a, b]].forEach(v => {
      for (const sx of [1, -1]) for (const sy of [1, -1]) for (const sz of [1, -1]) {
        const q = [v[0] * sx, v[1] * sy, v[2] * sz]; if (!pts.some(o => Math.hypot(o[0] - q[0], o[1] - q[1], o[2] - q[2]) < 1e-6)) pts.push(q);
      } }); });
    const k = 1.18 / Math.hypot(...pts[0]), V = pts.map(q => new THREE.Vector3(q[0] * k, q[1] * k, q[2] * k));
    const cage = new THREE.Group(), aM = std(0x4a3a24, { metalness: 0.4, roughness: 0.3 }), bM = std(0xe0b867, { emissive: 0x5a3a08, emissiveIntensity: 0.6 });
    const im = new THREE.InstancedMesh(new THREE.SphereGeometry(0.07, 12, 10), aM, V.length), M4 = new THREE.Matrix4();
    V.forEach((v, i) => { M4.makeTranslation(v.x, v.y, v.z); im.setMatrixAt(i, M4); }); cage.add(im);
    const L = 2 * k, up = new THREE.Vector3(0, 1, 0), bonds = [];
    for (let i = 0; i < V.length; i++) for (let j = i + 1; j < V.length; j++) if (Math.abs(V[i].distanceTo(V[j]) - L) < 0.02) bonds.push([V[i], V[j]]);
    const bi = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.022, 0.022, 1, 6), bM, bonds.length), q = new THREE.Quaternion();
    bonds.forEach(([a, b], i) => { const d = b.clone().sub(a); q.setFromUnitVectors(up, d.clone().normalize()); M4.compose(a.clone().add(b).multiplyScalar(0.5), q, new THREE.Vector3(1, d.length(), 1)); bi.setMatrixAt(i, M4); });
    cage.add(bi); g.add(cage);
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.88, 40, 30), std(0xfff3d6, { emissive: 0x3a2808, emissiveIntensity: 0.3 })); g.add(body);
    const f = face(0.88, 0.84, 0, 0x2a1a08); g.add(f);
    g.userData.anim = (t, talk) => { cage.rotation.set(t * 0.25, t * 0.4, 0); animFace(f, t, talk); };
    return g;
  };
  /* 小点 Dot · 量子点:个头一变,颜色就变(越大越偏红) */
  B.dot = () => {
    const g = new THREE.Group(), h = halo(0xff7ad9); g.add(h);
    const mat = std(0xff7ad9, { flatShading: true, emissive: 0xff3aa0, emissiveIntensity: 0.35, roughness: 0.25 });
    const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.95, 1), mat); g.add(core);
    const shell = new THREE.Mesh(new THREE.IcosahedronGeometry(1.08, 1), new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.18 })); g.add(shell);
    const f = face(0.95, 0.86); g.add(f); const col = new THREE.Color();
    g.userData.anim = (t, talk) => {
      const s = 0.86 + 0.14 * Math.sin(t * 0.9); core.scale.setScalar(s); shell.scale.setScalar(s); f.scale.setScalar(s);
      col.setHSL(0.72 - (s - 0.72) * 1.9, 0.85, 0.62); mat.color.copy(col); mat.emissive.copy(col).multiplyScalar(0.45); h.material.color.copy(col);
      core.rotation.y = shell.rotation.y = t * 0.3; animFace(f, t, talk);
    };
    return g;
  };
  /* 锂锂 Lili · 锂离子电池:胶囊身体,锂离子在两极之间跑 */
  B.lili = () => {
    const g = new THREE.Group(); g.add(halo(0x7ad7ff));
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.72, 0.75, 10, 32), std(0x7ad7ff, { emissive: 0x0a4a6a, emissiveIntensity: 0.5 })); g.add(body);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.22, 28), std(0xd8dde6, { metalness: 0.85, roughness: 0.2 })); cap.position.y = 1.18; g.add(cap);
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.73, 0.04, 8, 48), std(0x2a4a6a, { metalness: 0.6 })); band.rotation.x = Math.PI / 2; band.position.y = -0.55; g.add(band);
    const ions = []; for (let i = 0; i < 5; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 10), glowMat(0xd8f6ff)); g.add(m); ions.push(m); }
    const f = face(0.72, 0.7, 0.12); g.add(f);
    g.userData.anim = (t, talk) => { ions.forEach((m, i) => { const a = t * 1.3 + i * 1.256, y = Math.sin(t * 1.6 + i * 1.3) * 1.05; m.position.set(Math.cos(a) * 0.98, y, Math.sin(a) * 0.98); }); animFace(f, t, talk); };
    return g;
  };
  /* 莫芙 Mof · 金属有机框架:会"呼吸"的晶格,从空气里抓水珠 */
  B.mof = () => {
    const g = new THREE.Group(); g.add(halo(0xc9a6ff));
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.45, 1.45, 1.45, 1, 1, 1), std(0xc9a6ff, { transparent: true, opacity: 0.82, emissive: 0x3a1a6a, emissiveIntensity: 0.4, roughness: 0.2 })); g.add(body);
    const fr = new THREE.Group(), nM = std(0x9aa6b8, { metalness: 0.9, roughness: 0.2 }), sM = std(0xffd27a, { emissive: 0x6a4a08, emissiveIntensity: 0.6 }), h = 0.92;
    const C = []; for (const x of [-h, h]) for (const y of [-h, h]) for (const z of [-h, h]) { const n = new THREE.Mesh(new THREE.OctahedronGeometry(0.13), nM); n.position.set(x, y, z); fr.add(n); C.push(n.position); }
    for (let i = 0; i < 8; i++) for (let j = i + 1; j < 8; j++) { const a = C[i], b = C[j]; if (Math.abs(a.distanceTo(b) - 2 * h) > 1e-3) continue;
      const s = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2 * h, 6), sM); s.position.copy(a).add(b).multiplyScalar(0.5);
      s.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()); fr.add(s); }
    g.add(fr);
    const drops = []; for (let i = 0; i < 3; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 10), std(0x7ad7ff, { transparent: true, opacity: 0.9, emissive: 0x1a5a8a })); g.add(d); drops.push(d); }
    const f = face(0.72, 0.74); g.add(f);
    g.userData.anim = (t, talk) => {
      const br = 1 + 0.06 * Math.sin(t * 1.4); fr.scale.setScalar(br); body.scale.setScalar(0.97 + 0.03 * Math.sin(t * 1.4));
      g.rotation.y = 0.35 * Math.sin(t * 0.4);
      drops.forEach((d, i) => { const k = ((t * 0.35 + i / 3) % 1), a = i * 2.1 + t * 0.2; d.position.set(Math.cos(a) * (1.9 - k * 1.2), 0.9 - k * 0.6, Math.sin(a) * (1.9 - k * 1.2)); d.scale.setScalar(1 - k * 0.7); });
      animFace(f, t, talk);
    };
    return g;
  };
  /* 咔哒 Click · 点击化学:两块"积木"绕着它转,定时咔哒扣成一个五元环 */
  B.click = () => {
    const g = new THREE.Group(); g.add(halo(0x9fe870));
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.9, 40, 30), std(0x9fe870, { emissive: 0x2a5a08, emissiveIntensity: 0.45 })); g.add(body);
    const ring = new THREE.Group(), aM = std(0xffffff, { emissive: 0x5aa0ff, emissiveIntensity: 0.5 });
    for (let i = 0; i < 5; i++) { const a = i * 1.2566, m = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 10), i < 3 ? aM : std(0xffb35c, { emissive: 0x6a3008 })); m.userData.home = new THREE.Vector3(Math.cos(a) * 0.26, Math.sin(a) * 0.26, 0); m.userData.half = i < 3 ? -1 : 1; ring.add(m); }
    g.add(ring);
    const f = face(0.9, 0.86); g.add(f);
    g.userData.anim = (t, talk) => {
      const ph = (t % 4) / 4, gap = ph < 0.6 ? 0.45 * (1 - ph / 0.6) : 0, a = t * 0.8;
      ring.position.set(Math.cos(a) * 1.35, 0.55 + Math.sin(t * 1.1) * 0.15, Math.sin(a) * 1.35 * 0.6); ring.rotation.set(t, t * 0.7, 0);
      ring.children.forEach(m => { m.position.copy(m.userData.home); m.position.x += m.userData.half * gap; });
      animFace(f, t, talk);
    };
    return g;
  };
  /* 霜镜 Cryo · 冷冻电镜:冰晶六棱柱 + 雪花光环 + 一片镜片 */
  B.cryo = () => {
    const g = new THREE.Group(); g.add(halo(0xbfe9ff));
    const flake = new THREE.Group(), fM = glowMat(0xdff6ff); fM.opacity = 0.55;
    for (let i = 0; i < 6; i++) { const arm = new THREE.Group(); arm.rotation.z = i * Math.PI / 3;
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.5, 0.02), fM); m.position.y = 1.15; arm.add(m);
      [-1, 1].forEach(s => { const b = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.34, 0.02), fM); b.position.set(s * 0.1, 1.45, 0); b.rotation.z = -s * 0.8; arm.add(b); });
      flake.add(arm); }
    flake.position.z = -0.6; g.add(flake);
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.88, 0.88, 1.5, 6), std(0xbfe9ff, { transparent: true, opacity: 0.9, emissive: 0x2a5a7a, emissiveIntensity: 0.4, roughness: 0.12, metalness: 0.15, flatShading: true }));
    body.rotation.y = Math.PI / 6; g.add(body);
    const f = face(0.8, 0.79); g.add(f);
    const lens = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.025, 8, 32), std(0xd8dde6, { metalness: 0.9, roughness: 0.15 })); lens.position.set(0.27, 0.05, 0.84); g.add(lens);
    g.userData.anim = (t, talk) => { flake.rotation.z = t * 0.2; animFace(f, t, talk); };
    return g;
  };

  const cache = {};
  function get(id) { if (!cache[id]) { const m = (B[id] || B.oga)(); m.visible = false; scene.add(m); cache[id] = m; } return cache[id]; }

  /* 只渲染屏幕上看得见的画布 */
  const vis = new WeakMap(), io = window.IntersectionObserver ? new IntersectionObserver(es => es.forEach(e => vis.set(e.target, e.isIntersecting)), { rootMargin: '60px' }) : null;
  const seen = new WeakSet();
  const last = new WeakMap();

  EF.g3 = function (cvT, id, tms, talk) {
    if (lost) return false;
    if (io && !seen.has(cvT)) { seen.add(cvT); vis.set(cvT, true); io.observe(cvT); }
    if (io && vis.get(cvT) === false) return true;
    const t = (EF.reduced ? 0 : tms) / 1000;
    /* 静态(减少动态)时只画一次 */
    if (EF.reduced && last.get(cvT) === id + (talk > 0.5)) return true;
    const m = get(id); m.visible = true;
    m.position.y = Math.sin(t * 2) * 0.06;
    m.rotation.y = (id === 'mof' ? m.rotation.y : Math.sin(t * 0.6) * 0.22); m.rotation.x = Math.sin(t * 0.45) * 0.06;
    m.userData.anim(t, talk || 0);
    renderer.render(scene, cam); m.visible = false;
    const x = cvT.getContext('2d'), W = cvT.width, H = cvT.height, c = EF.GUIDES[id] ? EF.GUIDES[id].c : '#ffb35c';
    x.clearRect(0, 0, W, H);
    const g0 = x.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.min(W, H) * 0.66); g0.addColorStop(0, c + '44'); g0.addColorStop(1, c + '00');
    x.fillStyle = g0; x.fillRect(0, 0, W, H);
    x.drawImage(cv, 0, 0, W, H);
    last.set(cvT, id + (talk > 0.5));
    return true;
  };
  EF.g3ready = true;
}
