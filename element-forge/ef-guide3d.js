/* 元素工坊 Element Forge · 工坊七匠 写实 3D 向导 ef-guide3d.js v2.2
   视觉基线:开发文档/元素工坊_v2.2_视觉定调_v1.0.md §3。无脸,一枚黄铜环玻璃镜头为眼;悬浮,底部元素色光;
   黄铜/拉丝钢/白陶瓷/玻璃写实材质,全部程序建模(ef-pbr.js),零外部模型与贴图。
   一个离屏 WebGL 渲染器轮流渲染七位向导,再拷到页面各 <canvas>(省 WebGL 上下文);只渲染视口内画布。
   动作:待机悬浮呼吸;说话/提问时转向镜头、镜头光圈亮;EF.guidePulse(id) 通关脉冲。
   低档 / 无 WebGL / 启动失败:EF.drawGuide 用 img/guides/<id>.webp(同一模型预渲染)。 */
import * as THREE from './vendor/three.module.min.js';
import { M, COL, studioEnv } from './ef-pbr.js?v=1';
const EF = window.EF;
try { boot(); } catch (e) { console.warn('[ef] 3D 向导启动失败,保留静态图', e); }

function boot() {
  const S = 256;
  const cv = document.createElement('canvas'); cv.width = cv.height = S;
  const renderer = new THREE.WebGLRenderer({ canvas: cv, alpha: true, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1); renderer.setSize(S, S, false); renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.setClearColor(0x000000, 0);
  let lost = false;
  cv.addEventListener('webglcontextlost', e => { e.preventDefault(); lost = true; EF.g3 = null; });

  const scene = new THREE.Scene();
  scene.environment = studioEnv(renderer); scene.environmentIntensity = 1.35;
  const cam = new THREE.PerspectiveCamera(30, 1, 0.1, 50); cam.position.set(0, 0.1, 5.4); cam.lookAt(0, -0.02, 0);
  const key = new THREE.DirectionalLight(0xfff1e0, 2.0); key.position.set(2.5, 3.2, 4); scene.add(key);
  const rim = new THREE.DirectionalLight(0xffb06a, 1.3); rim.position.set(-3.2, 1.2, -2.5); scene.add(rim);
  scene.add(new THREE.AmbientLight(0x30343c, 0.6));
  const under = new THREE.PointLight(0xffffff, 0, 4, 1.6); under.position.set(0, -1.55, 0.6); scene.add(under);

  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  /* 两点间的杆 */
  function rod(a, b, r, mat, seg = 8) {
    const d = b.clone().sub(a), L = d.length(), m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, L, seg, 1), mat);
    m.position.copy(a).addScaledVector(d, 0.5); m.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize()); return m;
  }

  /* 统一的眼:黄铜外环 + 深色镀膜镜片 + 元素色光圈(亮度随说话/脉冲变化) */
  function eye(col, R = 0.27) {
    const g = new THREE.Group();
    const bezel = new THREE.Mesh(new THREE.TorusGeometry(R, R * 0.2, 20, 48), M.brass({ roughness: 0.25 })); g.add(bezel);
    const back = new THREE.Mesh(new THREE.CylinderGeometry(R * 1.02, R * 1.02, R * 0.5, 40), M.brassOld()); back.rotation.x = Math.PI / 2; back.position.z = -R * 0.25; g.add(back);
    const lens = new THREE.Mesh(new THREE.SphereGeometry(R * 0.98, 40, 24, 0, Math.PI * 2, 0, Math.PI / 2), M.lens()); lens.rotation.x = Math.PI / 2; lens.scale.set(1, 0.45, 1); g.add(lens);
    const irisM = M.glow(col, { emissiveIntensity: 0.5, transparent: true, opacity: 0.9 });
    const iris = new THREE.Mesh(new THREE.TorusGeometry(R * 0.42, R * 0.05, 10, 40), irisM); iris.position.z = R * 0.36; iris.scale.z = 0.3; g.add(iris);
    const pupilM = M.glow(col, { emissiveIntensity: 0.25 });
    const pupil = new THREE.Mesh(new THREE.CircleGeometry(R * 0.16, 24), pupilM); pupil.position.z = R * 0.45; g.add(pupil);
    g.userData.set = k => { irisM.emissiveIntensity = 0.5 + k * 3.2; pupilM.emissiveIntensity = 0.25 + k * 2.4; };
    return g;
  }

  const B = {};
  /* 奥加 Oga · Og-118:暗黄铜重核球 + 多道轨道环 */
  B.oga = c => {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.SphereGeometry(0.76, 64, 48), M.brassOld({ color: '#9a7a48', roughness: 0.58 })));
    const orbits = [];
    [[0.25, 0.1], [1.05, 0.9], [-0.95, 2.1], [0.55, 2.9]].forEach(([tx, tz], i) => {
      const o = new THREE.Group(); o.rotation.set(Math.PI / 2 + tx, tz, 0);
      o.add(new THREE.Mesh(new THREE.TorusGeometry(1.12 + i * 0.05, 0.018, 10, 120), M.brass({ roughness: 0.22 })));
      const e = new THREE.Mesh(new THREE.SphereGeometry(0.045, 16, 12), M.glow(c, { emissiveIntensity: 2 })); e.position.x = 1.12 + i * 0.05; o.add(e);
      g.add(o); orbits.push(o);
    });
    const E = eye(c, 0.26); E.position.z = 0.7; g.add(E);
    g.scale.setScalar(0.84);
    g.userData.eye = E; g.userData.anim = (t, k) => orbits.forEach((o, i) => { o.rotation.z = t * (0.5 + i * 0.17) * (i % 2 ? -1 : 1); });
    return g;
  };
  /* 巴基 Bucky · C60:截角二十面体,碳杆 + 黄铜节点,镜头居中 */
  B.bucky = c => {
    const g = new THREE.Group(), cage = new THREE.Group(), phi = (1 + Math.sqrt(5)) / 2, base = [[0, 1, 3 * phi], [1, 2 + phi, 2 * phi], [phi, 2, 2 * phi + 1]];
    const P = [], key = v => v.map(n => n.toFixed(3)).join();
    const seen = new Set();
    base.forEach(b => { for (let r = 0; r < 3; r++) { const p = [b[r % 3], b[(r + 1) % 3], b[(r + 2) % 3]]; for (let s = 0; s < 8; s++) { const q = p.map((n, i) => (s >> i & 1) ? -n : n); const k = key(q); if (!seen.has(k)) { seen.add(k); P.push(V(...q)); } } } });
    const sc = 1.05 / P[0].length(); P.forEach(p => p.multiplyScalar(sc));
    const nodeM = M.brass({ roughness: 0.28 }), rodM = M.carbon();
    const nodeG = new THREE.SphereGeometry(0.052, 14, 10);
    P.forEach(p => { const n = new THREE.Mesh(nodeG, nodeM); n.position.copy(p); cage.add(n); });
    const el = 2 * sc;
    for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) if (Math.abs(P[i].distanceTo(P[j]) - el) < 0.01) cage.add(rod(P[i], P[j], 0.02, rodM, 6));
    g.add(cage);
    const E = eye(c, 0.3); E.position.z = 0.25; g.add(E);
    g.userData.eye = E; g.userData.anim = (t) => { cage.rotation.y = t * 0.3; cage.rotation.x = t * 0.11; };
    return g;
  };
  /* 小点 Dot · 量子点:钢框内大小渐变的发光玻璃珠(小 → 蓝,大 → 红) */
  B.dot = c => {
    const g = new THREE.Group(), spin = new THREE.Group();
    const frame = M.steel({ roughness: 0.22 });
    g.add(new THREE.Mesh(new THREE.TorusGeometry(0.98, 0.05, 16, 96), frame));
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + Math.PI / 2; spin.add(rod(V(Math.cos(a) * 0.3, Math.sin(a) * 0.3, 0.1), V(Math.cos(a) * 0.97, Math.sin(a) * 0.97, 0.1), 0.018, frame, 6)); }
    const back = new THREE.Mesh(new THREE.CircleGeometry(0.95, 64), M.darkSteel({ roughness: 0.55 })); back.position.z = -0.16; g.add(back);
    /* 量子点:左侧小珠发蓝,右侧大珠发红(粒径越大发光越偏红,示意) */
    const mats = {};
    const matFor = col => mats[col] || (mats[col] = new THREE.MeshPhysicalMaterial({ color: col, emissive: col, emissiveIntensity: 0.7, roughness: 0.05, clearcoat: 1, clearcoatRoughness: 0.02, transparent: true, opacity: 0.9, envMapIntensity: 1.8 }));
    const ramp = ['#2a4dff', '#2f7dff', '#36b8ff', '#9a6bff', '#ff4fa0', '#ff3a3a', '#ff5a1a'];
    const placed = [];
    for (let i = 0; i < 4000 && placed.length < 120; i++) {
      const a = rnd(i * 3.1) * Math.PI * 2, rr = 0.36 + Math.sqrt(rnd(i * 7.7)) * 0.56;
      const x = Math.cos(a) * rr, y = Math.sin(a) * rr, f = (x + 0.95) / 1.9;          /* 0 = 左,1 = 右 */
      const r = 0.05 + f * 0.11 + rnd(i * 2.3) * 0.02;
      if (rr + r > 0.94) continue;
      if (placed.some(q => Math.hypot(q[0] - x, q[1] - y) < q[2] + r + 0.004)) continue;
      placed.push([x, y, r]);
      const b = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 14), matFor(ramp[Math.min(6, Math.floor(f * 7))])); b.position.set(x, y, -0.16 + r); g.add(b);
    }
    g.add(spin);
    const E = eye(c, 0.24); E.position.z = 0.08; g.add(E);
    g.userData.eye = E; g.userData.anim = (t) => { spin.rotation.z = Math.sin(t * 0.3) * 0.08; };
    return g;
  };
  /* 锂锂 Lili · 锂离子电芯:拉丝铝壳,铜/铝端盖,侧面离子光道 */
  B.lili = c => {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 1.7, 64), M.aluminum()));
    const cap = (y, mat) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.12, 64), mat); m.position.y = y; g.add(m); };
    cap(0.88, M.copper()); cap(-0.88, M.copper());
    [0.8, -0.8].forEach(y => { const r = new THREE.Mesh(new THREE.TorusGeometry(0.505, 0.012, 8, 64), M.copper({ roughness: 0.2 })); r.rotation.x = Math.PI / 2; r.position.y = y; g.add(r); });
    const nub2 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.06, 32), M.steel()); nub2.position.y = -0.97; g.add(nub2);
    const nub = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.12, 32), M.steel()); nub.position.y = 1.0; g.add(nub);
    const ions = [];
    [-1, 1].forEach(sd => {
      const ch = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.1, 0.12), M.glow(c, { emissiveIntensity: 1.4, transparent: true, opacity: 0.8 })); ch.position.set(sd * 0.5, 0, 0); g.add(ch);
      for (let i = 0; i < 4; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 8), M.glow(c, { emissiveIntensity: 2.6 })); d.position.set(sd * 0.52, 0, 0.02); d.userData.o = i / 4 + (sd > 0 ? 0.12 : 0); d.userData.dir = sd; g.add(d); ions.push(d); }
    });
    const E = eye(c, 0.25); E.position.z = 0.5; g.add(E);
    g.userData.eye = E; g.userData.anim = (t) => ions.forEach(d => { const f = ((t * 0.35 * d.userData.dir + d.userData.o) % 1 + 1) % 1; d.position.y = -0.66 + f * 1.32; });
    return g;
  };
  /* 莫芙 Mof · 金属有机框架:金属节点 + 有机连杆的多孔晶格,孔里含水珠 */
  B.mof = c => {
    const g = new THREE.Group(), nodeM = M.steel({ roughness: 0.18 }), linkM = new THREE.MeshStandardMaterial({ color: '#c3bcd6', metalness: 0.7, roughness: 0.3 });
    const s = 0.42, pts = [], n = 2, zs = 0.75;
    for (let x = -n; x <= n; x++) for (let y = -n; y <= n; y++) for (let z = -1; z <= 1; z++) pts.push(V(x * s, y * s, z * s * zs * 1.4));
    const big = new THREE.SphereGeometry(0.07, 16, 12), small = new THREE.SphereGeometry(0.045, 12, 8);
    pts.forEach((p, i) => { const corner = (Math.abs(p.x) + Math.abs(p.y)) > s * 2.9 || (i % 2 === 0); const m = new THREE.Mesh(corner ? big : small, nodeM); m.position.copy(p); g.add(m); });
    for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) { const d = pts[i].distanceTo(pts[j]); if (d < s * 1.01 || Math.abs(d - s * zs * 1.4) < 0.01) g.add(rod(pts[i], pts[j], 0.011, linkM, 5)); else if (Math.abs(d - s * Math.SQRT2) < 0.01 && Math.abs(pts[i].z - pts[j].z) < 0.01 && (i + j) % 3 === 0) g.add(rod(pts[i], pts[j], 0.007, linkM, 4)); }
    const water = new THREE.MeshPhysicalMaterial({ color: '#d6e9ff', roughness: 0.02, clearcoat: 1, transparent: true, opacity: 0.5, envMapIntensity: 2.2 });
    const drops = [];
    for (let i = 0; i < 10; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.06 + rnd(i) * 0.05, 18, 12), water); d.position.set((Math.floor(rnd(i + 5) * 4) - 1.5) * s, (Math.floor(rnd(i + 9) * 4) - 1.5) * s, (rnd(i + 3) - 0.5) * s); g.add(d); drops.push(d); }
    const E = eye(c, 0.22); E.position.z = s * zs * 1.4 + 0.04; g.add(E);
    g.userData.eye = E; g.userData.anim = (t) => { const k = 1.0 * (1 + Math.sin(t * 1.3) * 0.025); g.scale.setScalar(k); drops.forEach((d, i) => d.scale.setScalar(1 + Math.sin(t * 1.3 + i) * 0.15)); };
    g.userData.baseRot = [0.12, 0.32];
    return g;
  };
  /* 咔哒 Click · 点击化学:钢/黄铜卡扣双模块立于小砧台 */
  B.click = c => {
    const g = new THREE.Group(), ds = M.darkSteel({ color: '#6c727b', roughness: 0.3 });
    /* 砧台:宽平台面 + 喇叭角 + 收腰 + 宽底座(侧面轮廓挤出) */
    const sh = new THREE.Shape();
    sh.moveTo(-0.62, 0); sh.lineTo(0.55, 0); sh.quadraticCurveTo(0.95, -0.02, 1.12, 0.08); sh.lineTo(0.62, -0.2); sh.lineTo(0.3, -0.22);
    sh.quadraticCurveTo(0.2, -0.45, 0.42, -0.62); sh.lineTo(0.5, -0.74); sh.lineTo(-0.58, -0.74); sh.lineTo(-0.5, -0.62); sh.quadraticCurveTo(-0.28, -0.45, -0.38, -0.22);
    sh.lineTo(-0.62, -0.18); sh.lineTo(-0.62, 0);
    const ag = new THREE.ExtrudeGeometry(sh, { depth: 0.5, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 2, curveSegments: 12 }); ag.translate(-0.15, 0, -0.25);
    const anvil = new THREE.Mesh(ag, ds); anvil.position.y = -0.24; g.add(anvil);
    const face = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.02, 0.5), M.steel({ roughness: 0.18 })); face.position.set(-0.17, -0.23, 0); g.add(face);
    const strip = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.025, 0.5), M.glow(c, { emissiveIntensity: 1.8 })); strip.position.set(-0.19, -1.0, 0); g.add(strip);
    /* 下模块:钢块 + 黄铜卡扣夹 */
    const low = new THREE.Group();
    low.add(new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.42, 0.46), M.steel()));
    const clamp = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.1, 0.5), M.brass({ roughness: 0.28 })); clamp.position.y = -0.2; low.add(clamp);
    const clip = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.3, 0.5), M.brass({ roughness: 0.28 })); clip.position.set(0.33, 0.04, 0); low.add(clip);
    const E = eye(c, 0.15); E.position.set(-0.04, 0.02, 0.24); low.add(E);
    low.position.y = 0.04; g.add(low);
    /* 上模块:黄铜颈 + 绿色卡扣帽 */
    const up = new THREE.Group();
    up.add(new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.24, 32), M.brass({ roughness: 0.26 })));
    const capM = new THREE.MeshStandardMaterial({ color: '#7fae6a', metalness: 0.55, roughness: 0.35 });
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.16, 32), capM); cap.position.y = 0.2; up.add(cap);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.155, 0.015, 8, 40), capM); ring.rotation.x = Math.PI / 2; ring.position.y = 0.02; up.add(ring);
    up.position.y = 0.42; g.add(up);
    g.userData.eye = E;
    g.userData.anim = (t, k) => { const gap = k > 0.3 ? 0 : 0.05 + Math.sin(t * 1.6) * 0.03; up.position.y = 0.39 + gap; };
    g.position.y = 0.12; g.scale.setScalar(1.08); g.userData.baseRot = [0.1, -0.25];
    return g;
  };
  /* 霜镜 Cryo · 冷冻电镜:结霜白陶瓷镜筒,钢顶盖,底部冰凌 */
  B.cryo = c => {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.47, 0.47, 1.5, 64), M.ceramic({ color: '#c3ccd3', roughness: 0.6 })));
    /* 霜层:顶点随机外鼓的开口筒,双层叠加 */
    [[0.5, 0.75], [0.53, 0.45]].forEach(([r, op], L) => {
      const fg = new THREE.CylinderGeometry(r, r, 1.42, 72, 24, true), pa = fg.attributes.position;
      for (let i = 0; i < pa.count; i++) { const x = pa.getX(i), z = pa.getZ(i), y = pa.getY(i), k = 1 + (rnd(i * 1.7 + L * 99) * 0.07) * (0.6 + 0.4 * Math.abs(y)); pa.setXYZ(i, x * k, y, z * k); }
      fg.computeVertexNormals();
      g.add(new THREE.Mesh(fg, M.frost({ color: L ? '#eef7fc' : '#cfe0ea', transparent: true, opacity: op, bumpScale: 2.2 })));
    });
    const top = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.46, 0.16, 48), M.steel()); top.position.y = 0.82; g.add(top);
    const top2 = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.3, 0.16, 40), M.steel({ roughness: 0.2 })); top2.position.y = 0.97; g.add(top2);
    const bot = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.42, 0.12, 48), M.steel()); bot.position.y = -0.8; g.add(bot);
    const ice = new THREE.MeshPhysicalMaterial({ color: '#e8f6ff', roughness: 0.05, clearcoat: 1, transparent: true, opacity: 0.75, envMapIntensity: 2.2 });
    for (let i = 0; i < 26; i++) { const a = i / 26 * Math.PI * 2 + rnd(i) * 0.2, L = 0.08 + rnd(i + 40) * 0.26; const ic = new THREE.Mesh(new THREE.ConeGeometry(0.022 + rnd(i + 7) * 0.02, L, 7), ice); ic.rotation.x = Math.PI; ic.position.set(Math.cos(a) * 0.44, -0.86 - L / 2, Math.sin(a) * 0.44); g.add(ic); }
    const E = eye(c, 0.23); E.position.set(0, 0.05, 0.53); g.add(E);
    g.userData.eye = E; g.userData.anim = () => { };
    g.scale.setScalar(0.95);
    return g;
  };
  function rnd(i) { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }

  const cache = {};
  function get(id) {
    if (!cache[id]) { const c = (EF.GUIDES[id] && EF.GUIDES[id].c) || COL.guides[id] || '#ffb35c'; const m = (B[id] || B.oga)(c); m.userData.col = new THREE.Color(c); m.visible = false; scene.add(m); cache[id] = m; }
    return cache[id];
  }

  /* 通关脉冲 */
  const pulse = {};
  EF.guidePulse = id => { pulse[id] = performance.now(); };

  const vis = new WeakMap(), io = window.IntersectionObserver ? new IntersectionObserver(es => es.forEach(e => vis.set(e.target, e.isIntersecting)), { rootMargin: '60px' }) : null;
  const seen = new WeakSet(), last = new WeakMap(), face = new WeakMap();

  EF.g3 = function (cvT, id, tms, talk) {
    if (lost) return false;
    if (io && !seen.has(cvT)) { seen.add(cvT); vis.set(cvT, true); io.observe(cvT); }
    if (io && vis.get(cvT) === false) return true;
    const t = (EF.reduced ? 0 : tms) / 1000;
    const pk = pulse[id] ? Math.max(0, 1 - (performance.now() - pulse[id]) / 1400) : 0;
    const k = Math.min(1, (talk || 0) * 0.9 + pk);
    if (EF.reduced && last.get(cvT) === id + (k > 0.5)) return true;
    const m = get(id); m.visible = true;
    /* 悬浮呼吸 */
    m.position.y = (m.userData.y0 ??= m.position.y) + Math.sin(t * 1.6) * 0.05;
    /* 待机缓慢环顾;说话时转向镜头(每块画布各自平滑) */
    let f = face.get(cvT) || 0; f += ((talk > 0.2 ? 1 : 0) - f) * 0.12; face.set(cvT, f);
    const br = m.userData.baseRot || [0, 0];
    const idle = m.userData.spin ? t * 0.35 : Math.sin(t * 0.5) * 0.35;
    m.rotation.y = br[1] * (1 - f) + idle * (1 - f);
    m.rotation.x = br[0] * (1 - f) + Math.sin(t * 0.4) * 0.05;
    m.userData.anim(t, k);
    m.userData.eye && m.userData.eye.userData.set(k);
    under.color.copy(m.userData.col); under.intensity = 1.2 + k * 3;
    renderer.render(scene, cam); m.visible = false;
    const x = cvT.getContext('2d'), W = cvT.width, H = cvT.height, c = '#' + m.userData.col.getHexString();
    x.clearRect(0, 0, W, H);
    /* 台面元素色光斑 */
    const g0 = x.createRadialGradient(W / 2, H * 0.93, 0, W / 2, H * 0.93, W * 0.42); g0.addColorStop(0, c + (k > 0.3 ? '88' : '55')); g0.addColorStop(1, c + '00');
    x.save(); x.translate(0, H * 0.93); x.scale(1, 0.28); x.translate(0, -H * 0.93); x.fillStyle = g0; x.fillRect(0, 0, W, H); x.restore();
    x.drawImage(cv, 0, 0, W, H);
    last.set(cvT, id + (k > 0.5));
    return true;
  };
  /* 预渲染导出(开发用:tools/render_guides.py 调用,生成低档静态图) */
  EF.g3export = (id, size = 512) => { const c = document.createElement('canvas'); c.width = c.height = size; EF.g3(c, id, 1200, 0); return c.toDataURL('image/png'); };
  EF.g3ready = true;
}
