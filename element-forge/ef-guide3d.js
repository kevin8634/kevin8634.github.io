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
    g.add(new THREE.Mesh(new THREE.SphereGeometry(0.72, 64, 48), M.brassOld({ roughness: 0.42 })));
    const orbits = [];
    [[0.25, 0.1], [1.05, 0.9], [-0.95, 2.1], [0.55, 2.9]].forEach(([tx, tz], i) => {
      const o = new THREE.Group(); o.rotation.set(Math.PI / 2 + tx, tz, 0);
      o.add(new THREE.Mesh(new THREE.TorusGeometry(1.12 + i * 0.05, 0.012, 8, 120), M.brass({ roughness: 0.22 })));
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
    const g = new THREE.Group();
    const frame = M.steel({ roughness: 0.25 });
    g.add(new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.045, 16, 96), frame));
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; g.add(rod(V(Math.cos(a) * 0.3, Math.sin(a) * 0.3, 0), V(Math.cos(a) * 0.95, Math.sin(a) * 0.95, 0), 0.016, frame, 6)); }
    const back = new THREE.Mesh(new THREE.CircleGeometry(0.93, 64), M.darkSteel({ roughness: 0.5 })); back.position.z = -0.12; g.add(back);
    /* 量子点越大,发光越偏红(示意) */
    const hues = ['#3a6bff', '#2fb8ff', '#3fe0a0', '#ffe14a', '#ff9a2a', '#ff3a3a'];
    const beads = [];
    for (let s = 0; s < 6; s++) {
      const a0 = s / 6 * Math.PI * 2 + Math.PI / 6, r = 0.07 + s * 0.022, col = hues[s];
      const mat = new THREE.MeshPhysicalMaterial({ color: col, emissive: col, emissiveIntensity: 0.55, roughness: 0.08, clearcoat: 1, transparent: true, opacity: 0.88 });
      const n = Math.max(2, Math.round(7 - s * 0.9));
      for (let k = 0; k < n; k++) { const ang = a0 + (rnd(s * 9 + k) - 0.5) * 0.7, rad = 0.42 + rnd(s * 13 + k) * (0.45 - r); const b = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 14), mat); b.position.set(Math.cos(ang) * rad, Math.sin(ang) * rad, (rnd(k + s) - 0.5) * 0.06); g.add(b); beads.push(b); }
    }
    const E = eye(c, 0.24); E.position.z = 0.05; g.add(E);
    g.userData.eye = E; g.userData.anim = (t, k) => { g.children[0].rotation.z = t * 0.2; };
    return g;
  };
  /* 锂锂 Lili · 锂离子电芯:拉丝铝壳,铜/铝端盖,侧面离子光道 */
  B.lili = c => {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 1.7, 64), M.aluminum()));
    const cap = (y, mat) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.12, 64), mat); m.position.y = y; g.add(m); };
    cap(0.88, M.copper()); cap(-0.88, M.aluminum({ color: '#b9bcc2', roughness: 0.2 }));
    const nub = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.12, 32), M.steel()); nub.position.y = 1.0; g.add(nub);
    const ions = [];
    [-1, 1].forEach(sd => {
      const ch = new THREE.Mesh(new THREE.BoxGeometry(0.035, 1.35, 0.06), M.glow(c, { emissiveIntensity: 0.6, transparent: true, opacity: 0.55 })); ch.position.set(sd * 0.5, 0, 0); g.add(ch);
      for (let i = 0; i < 4; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 8), M.glow(c, { emissiveIntensity: 2.6 })); d.position.set(sd * 0.52, 0, 0.02); d.userData.o = i / 4 + (sd > 0 ? 0.12 : 0); d.userData.dir = sd; g.add(d); ions.push(d); }
    });
    const E = eye(c, 0.25); E.position.z = 0.5; g.add(E);
    g.userData.eye = E; g.userData.anim = (t) => ions.forEach(d => { const f = ((t * 0.35 * d.userData.dir + d.userData.o) % 1 + 1) % 1; d.position.y = -0.66 + f * 1.32; });
    return g;
  };
  /* 莫芙 Mof · 金属有机框架:金属节点 + 有机连杆的多孔晶格,孔里含水珠 */
  B.mof = c => {
    const g = new THREE.Group(), nodeM = M.steel({ roughness: 0.22 }), linkM = new THREE.MeshStandardMaterial({ color: '#b9b2c9', metalness: 0.6, roughness: 0.35 });
    const s = 0.62, pts = [];
    for (let x = -1; x <= 1; x++) for (let y = -1; y <= 1; y++) for (let z = -1; z <= 1; z++) pts.push(V(x * s, y * s, z * s * 0.8));
    const nodeG = new THREE.SphereGeometry(0.075, 16, 12);
    pts.forEach(p => { const n = new THREE.Mesh(nodeG, nodeM); n.position.copy(p); g.add(n); });
    for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) { const d = pts[i].distanceTo(pts[j]); if (d < s * 1.01 || Math.abs(d - s * 0.8) < 0.01) g.add(rod(pts[i], pts[j], 0.014, linkM, 6)); }
    /* 面对角斜撑(有机连杆) */
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => g.add(rod(V(a * s, b * s, s * 0.8), V(0, 0, 0), 0.01, linkM, 5)));
    const water = new THREE.MeshPhysicalMaterial({ color: '#cfe6ff', roughness: 0.02, clearcoat: 1, transparent: true, opacity: 0.55, envMapIntensity: 2 });
    const drops = [];
    [[0.31, 0.31, 0.25], [-0.31, -0.31, -0.25], [0.31, -0.31, -0.25], [-0.31, 0.31, 0.25]].forEach((p, i) => { const d = new THREE.Mesh(new THREE.SphereGeometry(0.1 + i % 2 * 0.03, 20, 14), water); d.position.set(...p); g.add(d); drops.push(d); });
    const E = eye(c, 0.22); E.position.z = s * 0.8 + 0.02; g.add(E);
    g.userData.eye = E; g.userData.anim = (t) => { const k = 1.08 * (1 + Math.sin(t * 1.3) * 0.025); g.scale.setScalar(k); drops.forEach((d, i) => d.scale.setScalar(1 + Math.sin(t * 1.3 + i) * 0.12)); };
    g.scale.setScalar(1.08); g.userData.baseRot = [0.22, 0.38];
    return g;
  };
  /* 咔哒 Click · 点击化学:钢/黄铜卡扣双模块立于小砧台 */
  B.click = c => {
    const g = new THREE.Group(), ds = M.darkSteel();
    /* 砧台:台面 + 腰 + 底座 + 角 */
    const top = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.22, 0.62), ds); top.position.y = -0.38; g.add(top);
    const horn = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.5, 20), ds); horn.rotation.z = Math.PI / 2; horn.position.set(1.0, -0.38, 0); horn.scale.set(1, 1, 0.8); g.add(horn);
    const waist = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.32, 0.36, 4), ds); waist.rotation.y = Math.PI / 4; waist.position.y = -0.67; waist.scale.z = 0.7; g.add(waist);
    const foot = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.14, 0.62), ds); foot.position.y = -0.9; g.add(foot);
    const strip = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.02, 0.5), M.glow(c, { emissiveIntensity: 1.4 })); strip.position.y = -0.98; g.add(strip);
    /* 两个模块:下钢块 + 上黄铜块,带卡扣 */
    const low = new THREE.Group(), lowB = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.36, 0.48), M.steel()); low.add(lowB);
    [-1, 1].forEach(sd => { const tab = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.26, 0.2), M.brass()); tab.position.set(sd * 0.3, 0.2, 0); low.add(tab); });
    low.position.y = -0.09; g.add(low);
    const up = new THREE.Group(), upB = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.3, 0.42), M.brass({ roughness: 0.3 })); up.add(upB);
    const cylT = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.22, 24), M.steel({ color: '#6f8f6a', roughness: 0.3 })); cylT.position.y = 0.26; up.add(cylT);
    const E = eye(c, 0.17); E.position.set(0, -0.12, 0.25); low.add(E);
    up.position.y = 0.32; g.add(up);
    g.userData.eye = E;
    g.userData.anim = (t, k) => { const gap = k > 0.3 ? 0.02 : 0.08 + Math.sin(t * 1.6) * 0.03; up.position.y = 0.26 + gap; };
    g.position.y = 0.16; g.scale.setScalar(1.12);
    return g;
  };
  /* 霜镜 Cryo · 冷冻电镜:结霜白陶瓷镜筒,钢顶盖,底部冰凌 */
  B.cryo = c => {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.5, 1.5, 64), M.ceramic()));
    const fr = new THREE.Mesh(new THREE.CylinderGeometry(0.475, 0.515, 1.46, 64, 1, true), M.frost({ transparent: true, opacity: 0.65 })); g.add(fr);
    const top = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.4, 0.22, 48), M.steel()); top.position.y = 0.86; g.add(top);
    const top2 = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.14, 40), M.steel({ roughness: 0.2 })); top2.position.y = 1.03; g.add(top2);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.035, 12, 64), M.steel()); ring.rotation.x = Math.PI / 2; ring.position.y = -0.62; g.add(ring);
    const ice = new THREE.MeshPhysicalMaterial({ color: '#e8f6ff', roughness: 0.05, clearcoat: 1, transparent: true, opacity: 0.7, envMapIntensity: 2 });
    for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2 + rnd(i) * 0.3, L = 0.1 + rnd(i + 40) * 0.2; const ic = new THREE.Mesh(new THREE.ConeGeometry(0.03, L, 8), ice); ic.rotation.x = Math.PI; ic.position.set(Math.cos(a) * 0.48, -0.76 - L / 2, Math.sin(a) * 0.48); g.add(ic); }
    const E = eye(c, 0.23); E.position.set(0, 0.05, 0.49); g.add(E);
    g.userData.eye = E; g.userData.anim = () => { };
    g.scale.setScalar(0.92);
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
