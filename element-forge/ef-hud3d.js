/* 元素工坊 Element Forge · 3D HUD「锻炉星盘」ef-hud3d.js v2.2(WIP-4)
   唯一视觉基线:宣传素材/元素工坊_2.0_HUD3D_锻炉星盘_概念图v2.png(王磊 11-01 11:50 定调),只实现、不重设计。
   规范:开发文档/元素工坊_HUD3D锻炉星盘_方案_v1.0.md §3–§4
   · 写实实验桌(黑石台面带反射)+ 平放的黄铜星盘(刻度环、玻璃珠),中央浮物 = 当前尺度
   · 左侧任务螺旋卡阵:厚彩色玻璃卡,卡上写实小物;右上三颗彩色气体玻璃球按钮,沿黄铜轨道
   · 左上磨砂玻璃铭牌;右下向导 + 磨砂对话框
   · 材质:黄铜 metalness 1 / roughness 0.35;高档玻璃 transmission + 台面实时倒影;中档去透射与倒影
   · 颜色单一来源 data/ef.colors.json;烧杯/试管不冒火(火焰只在焰色反应演示);文字全部是 HTML 层
   与首页尺度镜共用同一渲染器;叠加层(卡阵/铭牌/气体球)用像素坐标相机在同一画布第二遍渲染。低档不加载。 */
import * as THREE from './vendor/three.module.min.js';
import { M, COL, studioEnv } from './ef-pbr.js?v=1';
const EF = window.EF;
const rnd = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();

const CARD_OBJ = { stars: 'star', carbon: 'graphite', crystal: 'quartz', cabbage: 'flask', fireworks: 'sparkler', battery: 'battery', rocks: 'rock', mars: 'mars', titan: 'titan', spectra: 'prism', island: 'nucleus', react: 'beaker' };

export async function install(gl, scene, cam, ST) {
  let C = null;
  try { C = await (await fetch('data/ef.colors.json?v=2')).json(); } catch (e) { C = COL; }
  const ION = k => (C.ions && C.ions[k] && C.ions[k].c) || '#888';
  const { renderer } = gl, hi = EF.glTier === 'high', reduced = () => EF.reduced;
  const env = studioEnv(renderer);
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  const E = (m, k = 1) => { m.envMap = env; m.envMapIntensity = k; return m; };
  const brass = (o = {}) => E(M.brass(Object.assign({ roughness: 0.35, metalness: 1 }, o)), 1.6);
  /* 器皿玻璃:台面倒影要求石面半透明,而 transmission 的背景通道不含半透明物体(会把瓶身渲成黑色),
     故器皿玻璃统一用 透明 + 双层清漆 + 强环境反射;transmission 仅用于背景为不透明物体的玻璃珠。 */
  const glassMat = (o = {}) => E(new THREE.MeshPhysicalMaterial(Object.assign({ color: '#eef4f8', metalness: 0, roughness: 0.02, transparent: true, opacity: 0.16, clearcoat: 1, clearcoatRoughness: 0.01, specularIntensity: 1, ior: 1.5, depthWrite: false, side: THREE.DoubleSide }, o)), 3.2);
  const liquid = col => E(new THREE.MeshPhysicalMaterial({ color: col, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.05, emissive: col, emissiveIntensity: 0.28, metalness: 0 }), 1.1);

  /* ================= 主场景:实验桌 ================= */
  const root = new THREE.Group(); root.name = 'hud3d'; scene.add(root);
  const D = -1.25;                                   /* 台面高度 */
  const decor = new THREE.Group(); root.add(decor);  /* 会被镜像做台面倒影的部分 */
  /* 黑石台面:高档半透明,透出下方镜像 = 倒影;前沿倒角 */
  const stoneM = E(M.stone({ roughness: 0.22, metalness: 0.1 }), 0.8); stoneM.map.repeat.set(4, 3);
  if (hi) { stoneM.transparent = true; stoneM.opacity = 0.82; }
  const desk = new THREE.Mesh(new THREE.BoxGeometry(30, 0.5, 24), stoneM); desk.position.set(0, D - 0.25, 1.5); root.add(desk);
  /* 顶光:暖色主光斑落在星盘与器皿上 */
  const key = new THREE.SpotLight(0xffe2bf, hi ? 60 : 45, 14, 0.62, 0.7, 1.6); key.position.set(0.4, 4.6, 2.2); key.target.position.set(0, D, -0.2); root.add(key, key.target);
  const fill = new THREE.HemisphereLight(0x2a3040, 0x0a0806, 0.6); root.add(fill);

  /* ---------- 黄铜星盘:平放在台面,刻度环 + 外侧厚环 + 玻璃珠 ---------- */
  const R0 = 1.3, R1 = 1.62, H = 0.13;
  const dial = new THREE.Group(); dial.position.set(0, D, 0.35); decor.add(dial);
  const spin = new THREE.Group(); dial.add(spin);
  const tickTex = (() => {
    const S = 2048, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d');
    x.fillStyle = '#9a9a9a'; x.fillRect(0, 0, S, S); x.translate(S / 2, S / 2);
    const k = S / 2 / R1, a = R0 * k, b = R1 * k;
    for (let i = 0; i < 240; i++) {
      const ang = i / 240 * Math.PI * 2, mj = i % 20 === 0, md = i % 5 === 0;
      x.strokeStyle = mj ? '#1a1a1a' : '#3a3a3a'; x.lineWidth = mj ? 6 : md ? 4 : 2.2;
      const r1 = b - 14, r2 = b - (mj ? 120 : md ? 80 : 50);
      x.beginPath(); x.moveTo(Math.cos(ang) * r1, Math.sin(ang) * r1); x.lineTo(Math.cos(ang) * r2, Math.sin(ang) * r2); x.stroke();
    }
    x.strokeStyle = '#2a2a2a'; x.lineWidth = 4; [a + 22, b - 132, b - 8].forEach(r => { x.beginPath(); x.arc(0, 0, r, 0, 7); x.stroke(); });
    /* 七档刻印(罗马数字样式的刻槽,不放文字:文字在 HTML 层) */
    for (let i = 0; i < 7; i++) { const ang = Math.PI / 2 + i / 7 * Math.PI * 2; x.save(); x.rotate(ang); x.fillStyle = '#262626'; x.beginPath(); x.moveTo(0, a + 40); x.lineTo(-12, a + 68); x.lineTo(12, a + 68); x.closePath(); x.fill(); x.restore(); }
    const t = new THREE.CanvasTexture(c); t.anisotropy = 8; return t;
  })();
  const face = new THREE.Mesh(new THREE.RingGeometry(R0, R1, 240, 1), brass({ color: '#c49a58', roughness: 0.32, bumpMap: tickTex, bumpScale: 2.2, roughnessMap: tickTex }));
  face.rotation.x = -Math.PI / 2; face.position.y = H; spin.add(face);
  const outer = new THREE.Mesh(new THREE.CylinderGeometry(R1, R1 + 0.03, H, 200, 1, true), brass({ color: '#9b7740', roughness: 0.4 })); outer.position.y = H / 2; spin.add(outer);
  const inner = new THREE.Mesh(new THREE.CylinderGeometry(R0, R0, H, 200, 1, true), brass({ color: '#8a6a36', roughness: 0.42, side: THREE.BackSide })); inner.position.y = H / 2; spin.add(inner);
  const lipO = new THREE.Mesh(new THREE.TorusGeometry(R1, 0.028, 12, 200), brass({ color: '#d2ab6a', roughness: 0.25 })); lipO.rotation.x = Math.PI / 2; lipO.position.y = H; spin.add(lipO);
  const lipI = new THREE.Mesh(new THREE.TorusGeometry(R0, 0.022, 12, 200), lipO.material); lipI.rotation.x = Math.PI / 2; lipI.position.y = H; spin.add(lipI);
  /* 档位玻璃珠 */
  const beads = [], beadGlass = E(new THREE.MeshPhysicalMaterial({ color: '#f4f1ea', metalness: 0, roughness: 0.02, clearcoat: 1, transmission: hi ? 1 : 0, thickness: 0.08, ior: 1.5, transparent: !hi, opacity: hi ? 1 : 0.3 }), 2.8);
  for (let i = 0; i < 7; i++) {
    const a = Math.PI / 2 + i / 7 * Math.PI * 2, r = (R0 + R1) / 2;
    const g = new THREE.Group(); g.position.set(Math.cos(a) * r, H, Math.sin(a) * r); spin.add(g);
    const shell = new THREE.Mesh(new THREE.SphereGeometry(0.085, 32, 20), beadGlass); shell.position.y = 0.07; g.add(shell);
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.04, 16, 12), new THREE.MeshBasicMaterial({ color: '#ffcf7a', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })); core.position.y = 0.07; g.add(core);
    const seat = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.016, 10, 32), brass({ roughness: 0.25 })); seat.rotation.x = Math.PI / 2; seat.position.y = 0.012; g.add(seat);
    beads.push(core);
  }
  /* 固定指针:正前方一枚黄铜楔 */
  const ptr = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.16, 4), brass({ roughness: 0.22 })); ptr.rotation.x = -Math.PI / 2; ptr.position.set(0, H + 0.03, R1 + 0.12); dial.add(ptr);

  /* ---------- 中央浮物:把首页 7 档尺度物体缩小,悬在星盘中心上方 ---------- */
  const float = new THREE.Group(); float.position.set(0, D + 0.9, 0.35); float.scale.setScalar(0.21); root.add(float);
  scene.children.slice().forEach(o => { if (o.isPoints && o !== root) o.visible = false; });   /* 实验室里不显示星空背景 */
  (EF._stageGroups || []).forEach(g => float.add(g));
  const halo = new THREE.PointLight(0xffb35c, 3, 3.2, 2); halo.position.set(0, D + 0.8, 0.35); root.add(halo);

  /* ---------- 器皿陈列(真实化学色,无火焰) ---------- */
  const glowTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'), g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,255,255,.85)'); g.addColorStop(0.45, 'rgba(255,255,255,.25)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); })();
  function vessel(profile, fill, col, x, z, s, parent = decor) {
    const g = new THREE.Group(), pts = profile.map(p => new THREE.Vector2(p[0], p[1]));
    const gl_ = new THREE.Mesh(new THREE.LatheGeometry(pts, 64), glassMat()); gl_.renderOrder = 2; g.add(gl_);
    const inn = [];
    for (let i = 0; i < profile.length; i++) { const p = profile[i]; if (p[1] > fill) { const q = profile[i - 1], t = (fill - q[1]) / (p[1] - q[1]); inn.push([(q[0] + (p[0] - q[0]) * t), fill]); break; } inn.push(p); }
    const lp = inn.map(p => new THREE.Vector2(Math.max(0.001, p[0] * 0.94), Math.max(0.015, p[1]))); lp.push(new THREE.Vector2(0.001, fill));
    g.add(new THREE.Mesh(new THREE.LatheGeometry(lp, 64), liquid(col)));
    const pool = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.6), new THREE.MeshBasicMaterial({ map: glowTex, color: col, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }));
    pool.rotation.x = -Math.PI / 2; pool.position.y = 0.004; g.add(pool);
    g.scale.setScalar(s); g.position.set(x, parent === decor ? D : 0, z); parent.add(g); return g;
  }
  const beaker = [[0.001, 0.0], [0.4, 0], [0.42, 0.03], [0.42, 0.98], [0.47, 1.03]];
  const conical = [[0.001, 0], [0.44, 0], [0.46, 0.04], [0.14, 0.8], [0.12, 0.84], [0.12, 1.2], [0.15, 1.24]];
  const round = [[0.001, 0.01], [0.24, 0.06], [0.44, 0.34], [0.42, 0.62], [0.2, 0.86], [0.12, 0.92], [0.12, 1.36], [0.15, 1.4]];
  vessel(beaker, 0.6, ION('Cu2+'), -2.4, 0.2, 0.66);
  vessel(conical, 0.36, ION('MnO4-'), -1.95, -0.5, 0.72);
  vessel(conical, 0.32, ION('Ni2+'), -1.35, -1.1, 0.64);
  vessel(conical, 0.38, ION('Fe3+'), 1.75, -0.75, 0.72);
  vessel(round, 0.5, ION('Co2+'), 2.4, -0.15, 0.74);
  /* 木质试管架 + 4 支试管 */
  const rack = new THREE.Group(); rack.position.set(3.25, D, -0.95); rack.rotation.y = -0.3; rack.scale.setScalar(0.82); decor.add(rack);
  const wood = E(new THREE.MeshStandardMaterial({ color: '#5a3a22', roughness: 0.58, metalness: 0 }), 0.6);
  const bar = (w, h, d, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wood); m.position.set(x, y, z); rack.add(m); };
  bar(1.5, 0.05, 0.36, 0, 0.025, 0); bar(1.5, 0.045, 0.32, 0, 0.62, 0); [-0.72, 0.72].forEach(x => bar(0.06, 0.95, 0.32, x, 0.47, 0));
  const tube = [[0.001, 0.04], [0.05, 0.06], [0.07, 0.12], [0.07, 1.12], [0.085, 1.15]];
  [ION('FeSCN'), ION('Fe3+'), ION('Ni2+'), ION('MnO4-')].forEach((col, i) => { const t = vessel(tube, 0.6, col, -0.48 + i * 0.32, 0, 1, rack); t.position.y = 0.05; });

  /* ---------- 台面倒影(高档):镜像陈设,透过半透明石面看到 ---------- */
  let mirror = null, mSpin = null;
  if (hi) {
    mirror = decor.clone(true); mirror.scale.y = -1; mirror.position.y = 2 * D; root.add(mirror);
    mirror.traverse(o => { if (o.isMesh && o.material && o.material.blending === THREE.AdditiveBlending) o.visible = false; });
    mSpin = mirror.children[0].children[0];
  }

  /* ---------- 星盘拖动:在台面平面上按角度转 ---------- */
  const cv = renderer.domElement, ray = new THREE.Raycaster(), plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -(D + H)), hit = new THREE.Vector3(), ndc = new THREE.Vector2();
  const angAt = e => { const r = cv.getBoundingClientRect(); ndc.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1); ray.setFromCamera(ndc, cam); if (!ray.ray.intersectPlane(plane, hit)) return null; const dx = hit.x - dial.position.x, dz = hit.z - dial.position.z, d = Math.hypot(dx, dz); return { a: Math.atan2(dz, dx), d }; };
  let drag = null;
  cv.addEventListener('pointerdown', e => { const p = angAt(e); if (!p || p.d < R0 - 0.35 || p.d > R1 + 0.45) return; drag = { a: p.a, v: ST.target }; EF._dialDrag = true; cv.setPointerCapture(e.pointerId); e.stopImmediatePropagation(); }, true);
  cv.addEventListener('pointermove', e => {
    if (!drag) { const p = angAt(e); cv.style.cursor = p && p.d > R0 - 0.35 && p.d < R1 + 0.45 ? 'grab' : ''; return; }
    const p = angAt(e); if (!p) return; let da = p.a - drag.a; if (da > Math.PI) da -= 2 * Math.PI; if (da < -Math.PI) da += 2 * Math.PI;
    drag.v -= da / (Math.PI * 2 / 7); drag.a = p.a; ST.target = Math.max(0, Math.min(6, drag.v));
  }, true);
  const end = () => { if (!drag) return; drag = null; EF._dialDrag = false; EF.stageGo && EF.stageGo(Math.round(ST.target), false); EF.play && EF.play('anvil'); };
  cv.addEventListener('pointerup', end, true); cv.addEventListener('pointercancel', end, true);

  /* ================= 叠加层:像素坐标相机(卡阵 / 铭牌 / 气体球) ================= */
  const ov = new THREE.Scene(), ocam = new THREE.PerspectiveCamera(22, 1, 1, 6000);
  ov.environment = env;
  const ovKey = new THREE.DirectionalLight(0xfff0dc, 2.2); ovKey.position.set(-300, 600, 900); ov.add(ovKey, new THREE.AmbientLight(0x404050, 0.6));
  let W = 1, Hh = 1;
  function ovResize() { W = cv.clientWidth || 1; Hh = cv.clientHeight || 1; ocam.aspect = W / Hh; ocam.position.set(0, 0, (Hh / 2) / Math.tan(THREE.MathUtils.degToRad(11))); ocam.far = ocam.position.z * 3; ocam.updateProjectionMatrix(); layout(); }
  const px = (x, y) => new THREE.Vector3(x - W / 2, Hh / 2 - y, 0);

  /* ---------- 任务螺旋卡阵:厚彩色玻璃 + 写实小物 ---------- */
  const keys = Object.keys(EF.MISSIONS).filter(k => CARD_OBJ[k]);
  const CW = 150, CD = 112, CT = 15;
  const cardGeo = (() => { const s = new THREE.Shape(), r = 9, w = CW / 2, h = CD / 2; s.moveTo(-w + r, -h); s.lineTo(w - r, -h); s.quadraticCurveTo(w, -h, w, -h + r); s.lineTo(w, h - r); s.quadraticCurveTo(w, h, w - r, h); s.lineTo(-w + r, h); s.quadraticCurveTo(-w, h, -w, h - r); s.lineTo(-w, -h + r); s.quadraticCurveTo(-w, -h, -w + r, -h); const g = new THREE.ExtrudeGeometry(s, { depth: CT, bevelEnabled: true, bevelThickness: 2, bevelSize: 2, bevelSegments: 2, curveSegments: 6 }); g.rotateX(-Math.PI / 2); return g; })();
  const cards = keys.map((k, i) => {
    const col = (C.hudCards && C.hudCards[k]) || '#ff9a3c';
    const g = new THREE.Group();
    /* 叠加层没有可折射的背景,厚玻璃用:半透明 + 清漆 + 体色自发光(边缘更亮由菲涅耳清漆给出) */
    const mat = E(new THREE.MeshPhysicalMaterial({ color: col, metalness: 0, roughness: 0.05, transparent: true, opacity: 0.88, clearcoat: 1, clearcoatRoughness: 0.03, emissive: col, emissiveIntensity: 0.7, specularIntensity: 0.6 }), 0.55);
    const slab = new THREE.Mesh(cardGeo, mat); g.add(slab);
    const obj = cardObject(CARD_OBJ[k], col); obj.position.y = CT + 2; g.add(obj);
    const p = EF.prog(k), Mi = EF.MISSIONS[k]; g.userData = { k, obj, done: p.done && p.done.length >= Mi.n, mat };
    ov.add(g); return g;
  });
  function cardObject(kind, col) {
    const g = new THREE.Group(), s = 1;
    const add = (geo, mat, y = 0) => { const m = new THREE.Mesh(geo, mat); m.position.y = y; g.add(m); return m; };
    if (kind === 'star') {
      const sh = new THREE.Shape(); for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2 + Math.PI / 2, r = i % 2 ? 13 : 30; i ? sh.lineTo(Math.cos(a) * r, Math.sin(a) * r) : sh.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
      const geo = new THREE.ExtrudeGeometry(sh, { depth: 10, bevelEnabled: true, bevelThickness: 5, bevelSize: 4, bevelSegments: 4 }); geo.center();
      const m = add(geo, E(new THREE.MeshStandardMaterial({ color: '#ffd38a', emissive: '#ff9a3c', emissiveIntensity: 0.9, metalness: 0.6, roughness: 0.32 }), 1.2), 30); m.rotation.x = -0.25;
    } else if (kind === 'graphite') {
      add(new THREE.CylinderGeometry(30, 30, 30, 6), E(new THREE.MeshStandardMaterial({ color: '#2a2b2f', metalness: 0.55, roughness: 0.38, flatShading: true }), 1.4), 15);
      for (let i = 0; i < 5; i++) add(new THREE.CylinderGeometry(30.4, 30.4, 0.8, 6), E(new THREE.MeshStandardMaterial({ color: '#4a4d55', metalness: 0.7, roughness: 0.3 }), 1.2), 3 + i * 6);
    } else if (kind === 'quartz') {
      const qm = E(new THREE.MeshPhysicalMaterial({ color: '#f4f8fb', metalness: 0, roughness: 0.04, transparent: true, opacity: 0.55, ior: 1.54, clearcoat: 1, flatShading: true }), 2.2);
      [[0, 0, 0, 1], [-14, 4, -0.35, 0.65], [14, -4, 0.3, 0.55]].forEach(([x, z, r, k]) => { const c = new THREE.Group(); const b = new THREE.Mesh(new THREE.CylinderGeometry(10 * k, 10 * k, 40 * k, 6), qm); b.position.y = 20 * k; const t = new THREE.Mesh(new THREE.ConeGeometry(10 * k, 16 * k, 6), qm); t.position.y = 48 * k; c.add(b, t); c.position.set(x, 0, z); c.rotation.z = r; g.add(c); });
    } else if (kind === 'flask' || kind === 'beaker') {
      const prof = kind === 'flask' ? conical : beaker;
      const v = vessel(prof, kind === 'flask' ? 0.38 : 0.55, kind === 'flask' ? '#7e46c8' : ION('Cu2+'), 0, 0, 50, g); v.children[2].visible = false; v.children[0].material = E(M.glass({ opacity: 0.3 }), 2);
    } else if (kind === 'sparkler') {
      add(new THREE.CylinderGeometry(1.5, 1.5, 70, 8), E(M.steel(), 1.2), 35).rotation.z = 0.5;
      const n = 260, pos = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const a = rnd() * 6.283, b = Math.acos(2 * rnd() - 1), r = Math.pow(rnd(), 0.6) * 34; pos[i * 3] = Math.sin(b) * Math.cos(a) * r - 17; pos[i * 3 + 1] = Math.cos(b) * r + 62; pos[i * 3 + 2] = Math.sin(b) * Math.sin(a) * r; }
      const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const pts = new THREE.Points(pg, new THREE.PointsMaterial({ color: '#ffd9a0', size: 2.6, sizeAttenuation: false, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); g.add(pts); g.userData.spark = pts;
      const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: '#ffb35c', blending: THREE.AdditiveBlending, depthWrite: false })); glow.scale.set(40, 40, 1); glow.position.set(-17, 62, 0); g.add(glow);
    } else if (kind === 'battery') {
      const b = new THREE.Group(); g.add(b); b.rotation.z = Math.PI / 2 - 0.2; b.position.y = 16;
      const p1 = new THREE.Mesh(new THREE.CylinderGeometry(14, 14, 52, 40), E(new THREE.MeshPhysicalMaterial({ color: '#15171c', metalness: 0.3, roughness: 0.25, clearcoat: 1 }), 1.5)); b.add(p1);
      const p2 = new THREE.Mesh(new THREE.CylinderGeometry(14.3, 14.3, 16, 40), E(M.copper({ roughness: 0.22 }), 1.6)); p2.position.y = 30; b.add(p2);
      const p3 = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, 4, 24), E(M.copper({ roughness: 0.2 }), 1.6)); p3.position.y = 40; b.add(p3);
      const p4 = new THREE.Mesh(new THREE.CylinderGeometry(13.6, 13.6, 2, 40), E(M.aluminum(), 1.4)); p4.position.y = -27; b.add(p4);
    } else if (kind === 'rock' || kind === 'mars' || kind === 'titan') {
      const geo = new THREE.IcosahedronGeometry(kind === 'rock' ? 26 : 24, kind === 'rock' ? 3 : 5), p = geo.attributes.position, v = new THREE.Vector3();
      for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const n = kind === 'rock' ? 0.72 + 0.28 * (Math.sin(v.x * 0.21) * Math.sin(v.y * 0.17 + 1) * Math.sin(v.z * 0.19 + 2) + 0.3 * Math.sin(v.x * 0.7 + v.z * 0.5)) : 1 + 0.03 * Math.sin(v.x * 0.5) * Math.sin(v.y * 0.4); v.multiplyScalar(n); if (kind === 'rock') v.y *= 0.75; p.setXYZ(i, v.x, v.y, v.z); }
      geo.computeVertexNormals();
      const col2 = kind === 'rock' ? '#5c5850' : kind === 'mars' ? '#a9482a' : '#c8822e';
      add(geo, E(new THREE.MeshStandardMaterial({ color: col2, roughness: kind === 'rock' ? 0.85 : 0.75, metalness: kind === 'rock' ? 0.15 : 0, flatShading: kind === 'rock' }), 1), kind === 'rock' ? 20 : 26);
      if (kind === 'titan') add(new THREE.SphereGeometry(27.5, 32, 24), new THREE.MeshBasicMaterial({ color: '#e8a050', transparent: true, opacity: 0.25, depthWrite: false }), 26);
    } else if (kind === 'prism') {
      const geo = new THREE.CylinderGeometry(22, 22, 44, 3); geo.rotateZ(Math.PI / 2);
      add(geo, E(new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.03, transparent: true, opacity: 0.45, ior: 1.6, clearcoat: 1, flatShading: true }), 2.4), 14);
    } else if (kind === 'nucleus') {
      const pm = E(new THREE.MeshPhysicalMaterial({ color: '#c8402a', roughness: 0.3, clearcoat: 0.8 }), 1.3), nm = E(new THREE.MeshPhysicalMaterial({ color: '#8a8f99', roughness: 0.3, clearcoat: 0.8 }), 1.3), sg = new THREE.SphereGeometry(7, 20, 14);
      for (let i = 0; i < 26; i++) { const m = new THREE.Mesh(sg, i % 2 ? pm : nm), a = i * 2.39996, y = 1 - (i / 25) * 2, r = Math.sqrt(1 - y * y) * 15; m.position.set(Math.cos(a) * r, 30 + y * 15, Math.sin(a) * r); g.add(m); }
    }
    g.scale.setScalar(s); return g;
  }
  /* 卡阵 HTML 层:每张卡一个可聚焦链接(透明,叠在 3D 卡上),悬停/聚焦显示问题 */
  const hud = document.getElementById('hud');
  const nav = document.createElement('nav'); nav.className = 'h3-spiral'; nav.id = 'spiral'; nav.setAttribute('aria-label', '任务卡阵:滚轮或上下方向键转动,回车进入');
  nav.innerHTML = keys.map(k => { const Mi = EF.MISSIONS[k], p = EF.prog(k), dn = p.done && p.done.length >= Mi.n; return '<a class="h3-card" href="' + Mi.href + '" aria-label="' + Mi.q + (dn ? '(已通关)' : '') + '"><span>' + Mi.q + (dn ? ' ✓' : '') + '</span></a>'; }).join('');
  hud.appendChild(nav);
  const links = Array.prototype.slice.call(nav.children);
  let off = 0, offS = 0, rows = 7, hot = -1;
  const scroll = d => { off = Math.max(0, Math.min(Math.max(0, cards.length - rows), off + d)); };
  nav.addEventListener('wheel', e => { e.preventDefault(); e.stopPropagation(); scroll(Math.sign(e.deltaY) * 0.5); }, { passive: false });
  nav.addEventListener('keydown', e => { const i = links.indexOf(document.activeElement); if (e.key === 'ArrowDown' && i < links.length - 1) { links[i + 1].focus(); e.preventDefault(); } if (e.key === 'ArrowUp' && i > 0) { links[i - 1].focus(); e.preventDefault(); } });
  links.forEach((a, i) => { a.addEventListener('focus', () => { hot = i; if (i < off) off = i; if (i > off + rows - 1) off = i - rows + 1; }); a.addEventListener('blur', () => { hot = -1; }); a.addEventListener('mouseenter', () => { hot = i; EF.hover && EF.hover(); }); a.addEventListener('mouseleave', () => { hot = -1; }); });
  let ty = null; nav.addEventListener('touchstart', e => { ty = e.touches[0].clientY; }, { passive: true });
  nav.addEventListener('touchmove', e => { if (ty == null) return; const dy = ty - e.touches[0].clientY; if (Math.abs(dy) > 30) { scroll(Math.sign(dy) * 0.5); ty = e.touches[0].clientY; } }, { passive: true });

  /* ---------- 磨砂玻璃铭牌(两片叠层) ---------- */
  const frost = (o = {}) => E(new THREE.MeshPhysicalMaterial(Object.assign({ color: '#e8eef4', metalness: 0, roughness: 0.5, transparent: true, opacity: 0.52, clearcoat: 0.6, emissive: '#c8ccd2', emissiveIntensity: 0.25, depthWrite: false }, o)), 1.4);
  const slabGeo = (w, h, d) => { const s = new THREE.Shape(), r = 10; s.moveTo(-w / 2 + r, -h / 2); s.lineTo(w / 2 - r, -h / 2); s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r); s.lineTo(w / 2, h / 2 - r); s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2); s.lineTo(-w / 2 + r, h / 2); s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r); s.lineTo(-w / 2, -h / 2 + r); s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2); const g = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: true, bevelThickness: 2, bevelSize: 2, bevelSegments: 3 }); g.translate(0, 0, -d / 2); return g; };
  const plate3 = new THREE.Group(); ov.add(plate3);
  const pB = new THREE.Mesh(slabGeo(300, 90, 8), frost({ color: '#dfe6ee' })), pF = new THREE.Mesh(slabGeo(300, 90, 8), frost()); plate3.add(pB, pF); let plateWH = '';
  const plate = document.createElement('div'); plate.className = 'h3-plate'; plate.id = 'h3plate'; plate.setAttribute('aria-live', 'polite'); hud.appendChild(plate);

  /* ---------- 气体玻璃球按钮(钠琥珀 / 氖橙红 / 铜焰青绿)+ 黄铜轨道 ---------- */
  const gasCol = { sndBtn: (C.gas && C.gas.Na.c) || '#ffb21f', setBtn: (C.gas && C.gas.Ne.c) || '#ff4a2a', fsBtn: (C.gas && C.gas.Cu.c) || '#2fd0a0' };
  const gasMat = col => new THREE.ShaderMaterial({
    uniforms: { uT: { value: 0 }, uC: { value: new THREE.Color(col) }, uI: { value: 1 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: 'varying vec3 vP; varying vec3 vN; void main(){ vP=position; vN=normalize(normalMatrix*normal); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: `uniform float uT,uI; uniform vec3 uC; varying vec3 vP; varying vec3 vN;
      float h(vec3 p){ return fract(sin(dot(p,vec3(12.9898,78.233,37.719)))*43758.5453); }
      float n3(vec3 p){ vec3 i=floor(p),f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(mix(h(i),h(i+vec3(1,0,0)),f.x),mix(h(i+vec3(0,1,0)),h(i+vec3(1,1,0)),f.x),f.y),mix(mix(h(i+vec3(0,0,1)),h(i+vec3(1,0,1)),f.x),mix(h(i+vec3(0,1,1)),h(i+vec3(1,1,1)),f.x),f.y),f.z); }
      void main(){ vec3 p=normalize(vP)*2.2; float n=n3(p+vec3(0.0,uT*0.6,uT*0.3))*0.6+n3(p*2.3-vec3(uT*0.4))*0.4;
        float core=pow(max(vN.z,0.0),1.6); float a=(0.35+0.9*n)*core*uI; gl_FragColor=vec4(uC*a*1.6+vec3(1.0)*pow(core,8.0)*0.25*uI,a); }`
  });
  const balls = {}, ballShell = E(new THREE.MeshPhysicalMaterial({ color: '#ffffff', metalness: 0, roughness: 0.02, transparent: true, opacity: 0.22, clearcoat: 1, clearcoatRoughness: 0.01, depthWrite: false }), 2.6);
  const orbit = new THREE.Group(); ov.add(orbit);
  const orbitM = brass({ color: '#c49a58', roughness: 0.28 });
  const orb1 = new THREE.Mesh(new THREE.TorusGeometry(1, 0.016, 8, 160), orbitM), orb2 = new THREE.Mesh(new THREE.TorusGeometry(1, 0.016, 8, 160), orbitM); orbit.add(orb1, orb2);
  ['sndBtn', 'setBtn', 'fsBtn'].forEach(id => {
    const el = document.getElementById(id); if (!el) return;
    const g = new THREE.Group(), gm = gasMat(gasCol[id]);
    const gas = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 28), gm); gas.scale.setScalar(0.86); g.add(gas);
    const shell = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32), ballShell); g.add(shell);
    const lt = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: gasCol[id], blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.55, transparent: true })); lt.scale.set(3.2, 3.2, 1); g.add(lt);
    ov.add(g); balls[id] = { g, gm, el, hot: 0 };
    el.addEventListener('mouseenter', () => { balls[id].hot = 1; }); el.addEventListener('mouseleave', () => { balls[id].hot = 0; });
    el.addEventListener('focus', () => { balls[id].hot = 1; }); el.addEventListener('blur', () => { balls[id].hot = 0; });
  });

  /* ---------- 布局(像素坐标跟随 HTML) ---------- */
  const mobile = () => W < 900 || Hh < 620;
  function layout() {
    const cr = cv.getBoundingClientRect();
    /* 气体球:放到对应 HTML 按钮中心 */
    const ids = Object.keys(balls); let xs = [];
    ids.forEach(id => { const b = balls[id], r = b.el.getBoundingClientRect(), R = r.width * (mobile() ? 0.5 : 0.66); b.g.position.copy(px(r.left - cr.left + r.width / 2, r.top - cr.top + r.height / 2)); b.g.scale.setScalar(R); xs.push(b.g.position); });
    orbit.visible = !mobile();
    if (xs.length) { const a = xs[0], z = xs[xs.length - 1], w = Math.abs(z.x - a.x) / 2 + 58; orbit.position.set((a.x + z.x) / 2, a.y - 4, -10); orb1.scale.set(w, w * 0.34, w); orb1.rotation.z = 0.06; orb2.scale.set(w * 0.88, w * 0.27, w); orb2.rotation.z = -0.05; orb2.position.y = 3; }
    /* 铭牌:叠在 HTML 铭牌后 */
    const pr = plate.getBoundingClientRect(); plate3.visible = pr.width > 0 && getComputedStyle(plate).display !== 'none';
    if (plate3.visible) { const c = px(pr.left - cr.left + pr.width / 2, pr.top - cr.top + pr.height / 2); const wh = Math.round(pr.width) + 'x' + Math.round(pr.height); if (wh !== plateWH) { plateWH = wh; pF.geometry.dispose(); pB.geometry.dispose(); pF.geometry = slabGeo(pr.width, pr.height, 8); pB.geometry = slabGeo(pr.width * 0.96, pr.height * 0.92, 8); } pF.position.set(c.x, c.y, 0); pB.position.set(c.x + 16, c.y + 12, -14); }
    rows = Math.max(3, Math.floor((Hh - 250) / 96));
    const show = !mobile(); cards.forEach(c => c.visible = show); nav.style.display = show ? '' : 'none';
  }
  ovResize(); new ResizeObserver(ovResize).observe(cv); setTimeout(layout, 600); setTimeout(layout, 2500);

  /* 铭牌文字随当前尺度 / 聚焦卡更新 */
  let plateKey = '';
  function plateText() {
    const s = (EF.SC || [])[Math.round(ST.target)], k = hot >= 0 ? keys[hot] : s && s.t; if (!k) return;
    const key2 = k + '|' + (s && s.n) + '|' + hot; if (key2 === plateKey) return; plateKey = key2;
    const Mi = EF.MISSIONS[k], p = EF.prog(k), n = (p.done || []).length;
    plate.innerHTML = '<small>' + (hot >= 0 ? '任务卡' : '尺度镜 · ' + s.n) + '</small><b>' + Mi.q + '</b><span>' + (n >= Mi.n ? '已通关' : '第 ' + (n + 1) + ' / ' + Mi.n + ' 关') + ' · ' + '★'.repeat(Math.min(n, Mi.n)) + '<i>' + '☆'.repeat(Math.max(0, Mi.n - n)) + '</i></span>';
    setTimeout(layout, 0);
  }

  function refreshBeads() { const SC = EF.SC || []; beads.forEach((b, i) => { const s = SC[i], Mi = s && EF.MISSIONS[s.t], p = s && EF.prog(s.t); b.userData.done = !!(Mi && p && p.done && p.done.length >= Mi.n); }); }
  refreshBeads(); addEventListener('focus', refreshBeads);

  /* ================= 每帧 ================= */
  let spinA = 0, mx = 0, my = 0;
  cv.addEventListener('pointermove', e => { const r = cv.getBoundingClientRect(); mx = (e.clientX - r.left) / r.width - 0.5; my = (e.clientY - r.top) / r.height - 0.5; });
  const camT = new THREE.Vector3(0, D + 0.62, 0), camP = new THREE.Vector3();
  gl.onFrame((t, dt) => {
    root.visible = gl.scene === scene; if (!root.visible) return;
    const rm = reduced();
    /* 相机:俯视实验桌(概念图视角),轻微视差;窄屏拉远 */
    const far = Math.pow(Math.max(1, 1.25 / cam.aspect), 0.9);
    camP.set(mx * (rm ? 0 : 0.35), 1.55 + my * (rm ? 0 : -0.15), 6.0 * far); cam.position.lerp(camP, rm ? 1 : 0.06); cam.lookAt(camT); cam.fov = 40; cam.updateProjectionMatrix();
    /* 星盘转到当前档 */
    const goal = ST.val * Math.PI * 2 / 7; spinA += (goal - spinA) * (rm ? 1 : 1 - Math.exp(-dt * 6)); spin.rotation.y = spinA; if (mSpin) mSpin.rotation.y = spinA;
    const cur = Math.round(ST.val);
    beads.forEach((b, i) => { const want = (b.userData.done ? 0.75 : 0) + (i === cur ? 0.9 : 0); b.material.opacity += (Math.min(1, want) - b.material.opacity) * 0.1; });
    float.position.y = D + 0.9 + (rm ? 0 : Math.sin(t * 0.9) * 0.03);
    plateText();
  });

  /* 叠加层渲染:清深度后画在同一画布上 */
  let lt = 0;
  gl.post.push((t, dt) => {
    if (gl.scene !== scene || document.body.classList.contains('pre')) return;
    if (t - lt > 0.5) { lt = t; layout(); }
    const rm = reduced();
    offS += (off - offS) * (rm ? 1 : 0.12);
    const cr = cv.getBoundingClientRect(), nr = nav.getBoundingClientRect();
    cards.forEach((c, i) => {
      if (!c.visible) return;
      const d = i - offS, vis = d > -0.8 && d < rows - 0.2;
      const y = 245 + d * 96, x = 128 + Math.sin(d * 0.85 + 0.6) * 18, z = Math.cos(d * 0.85 + 0.6) * 24 + (i === hot ? 30 : 0);
      c.position.copy(px(x, y)); c.position.z = z;
      c.rotation.set(0.88 + (i === hot ? -0.1 : 0), Math.sin(d * 0.85 + 0.6) * 0.32 - 0.18, Math.sin(d * 0.85) * 0.06);
      const fade = Math.max(0, Math.min(1, Math.min(d + 0.8, rows - 0.2 - d)));
      c.scale.setScalar(0.62 + 0.26 * fade); c.userData.mat.opacity = c.userData.mat.transparent ? 0.86 * fade : 1;
      c.visible = vis || fade > 0.02;
      c.userData.obj.rotation.y = rm ? 0.4 : t * 0.35 + i;
      if (c.userData.obj.userData.spark) c.userData.obj.userData.spark.material.size = 2.2 + Math.sin(t * 9 + i) * (rm ? 0 : 0.8);
      const a = links[i]; if (a) { a.style.transform = 'translate(' + (x - 75 - (nr.left - cr.left)).toFixed(1) + 'px,' + (y - 50 - (nr.top - cr.top)).toFixed(1) + 'px)'; a.style.visibility = vis ? '' : 'hidden'; a.tabIndex = 0; }
    });
    Object.keys(balls).forEach(id => { const b = balls[id]; b.gm.uniforms.uT.value += dt * (rm ? 0 : b.hot ? 2.4 : 0.5); b.gm.uniforms.uI.value = 0.85 + (rm ? 0 : Math.sin(t * 1.3 + id.length) * 0.15) + b.hot * 0.35; });
    const ac = renderer.autoClear; renderer.autoClear = false; renderer.clearDepth(); renderer.render(ov, ocam); renderer.autoClear = ac;
  });

  document.body.classList.add('hud3d');
  EF.hud3d = { root, refreshBeads, layout };
  return EF.hud3d;
}
