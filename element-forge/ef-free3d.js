/* 元素工坊 Element Forge · v2.3 自由实验台 3D 场景 ef-free3d.js
   视觉基线:宣传素材/元素工坊_v2.3_自由实验模式_效果图.png(王磊 11-03 13:34 批复,要求 ≥90% 相似)
   老式化学实验室背景 + 黑石台面 + 黄铜星盘(2/3 个插座)+ 左侧木质黄铜试剂架(彩色试剂瓶)+ 中央竖立全息光环与试管 + 右侧器皿陈设。
   全部程序建模(ef-pbr.js 材质),背景为 img/hud-bg.webp(AI 生成底图,LICENSES.md 已登记)。
   接口:mountFree(host, opt) → { setShelf(bottles), setSlots(bottles), run(row, {quiet}), clear(), onPick(cb), onSlot(cb), labelLayer, destroy }
   🔴 与校园版由页面传 quiet:只切到最终颜色,不播气泡/沉淀/热浪特效(与 v2.1 反应台同口径)。 */
import { THREE, glowSprite } from './ef-gl.js?v=3';
import { M, studioEnv } from './ef-pbr.js?v=1';
const EF = window.EF;

/* 下标统一用 <sub>(Unicode 下标字符在中文字体里会回落到别的字体,基线和字号不齐) */
const SUBM = { '₀': 0, '₁': 1, '₂': 2, '₃': 3, '₄': 4, '₅': 5, '₆': 6, '₇': 7, '₈': 8, '₉': 9 };
const subH = t => t.replace(/[₀-₉]+/g, m => '<sub>' + [...m].map(c => SUBM[c]).join('') + '</sub>');
export async function mountFree(host, opt = {}) {
  const hi = EF.glTier === 'high', reduced = EF.reduced;
  const renderer = new THREE.WebGLRenderer({ antialias: hi, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(EF.dpr(), hi ? 2 : 1.25)); renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.92;
  renderer.setClearColor(0x050608, 1);
  const el = renderer.domElement; el.className = 'fx-gl'; host.appendChild(el);
  const scene = new THREE.Scene(); scene.environment = studioEnv(renderer);
  const cam = new THREE.PerspectiveCamera(34, 16 / 9, 0.05, 80);
  const LOOK = new THREE.Vector3(0, 0.78, 0.2);

  /* ---------- 背景:老式实验室(虚化压暗) ---------- */
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(26, 11), new THREE.MeshBasicMaterial({ color: 0x8a8a8a, toneMapped: false, depthWrite: false }));
  wall.position.set(0, 3.0, -7.5); wall.renderOrder = -10; scene.add(wall);
  new THREE.TextureLoader().load(new URL('./img/hud-bg.webp?v=1', import.meta.url).href, t => { t.colorSpace = THREE.SRGBColorSpace; const r = (26 / 11) / (2048 / 868); t.repeat.set(1, r); t.offset.set(0, (1 - r) / 2); wall.material.map = t; wall.material.needsUpdate = true; });

  /* ---------- 灯光 ---------- */
  scene.add(new THREE.HemisphereLight(0x39404f, 0x0a0806, 0.7));
  const key = new THREE.SpotLight(0xffe0b8, hi ? 38 : 30, 16, 0.75, 0.7, 1.5); key.position.set(0.3, 5.6, 2.2); key.target.position.set(0, 0, 0.5); scene.add(key, key.target);
  const warmL = new THREE.PointLight(0xffa860, 6, 9); warmL.position.set(-3.2, 2.6, 1.2); scene.add(warmL);
  const coolL = new THREE.PointLight(0x7ab8ff, 5, 9); coolL.position.set(3.4, 2.2, 0.8); scene.add(coolL);

  /* ---------- 黑石台面 ---------- */
  const stone = M.stone({ roughness: 0.2, metalness: 0.15 }); stone.map.repeat.set(5, 2.5);
  const desk = new THREE.Mesh(new THREE.BoxGeometry(14, 0.3, 6), stone); desk.position.set(0, -0.15, 0.4); scene.add(desk);

  /* ---------- 黄铜星盘 ---------- */
  const R0 = 1.12, R1 = 1.5;
  const tick = (() => { const S = 1024, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d'); x.fillStyle = '#9a9a9a'; x.fillRect(0, 0, S, S); x.translate(S / 2, S / 2); const k = S / 2 / R1;
    for (let i = 0; i < 180; i++) { const a = i / 180 * Math.PI * 2, mj = i % 15 === 0; x.strokeStyle = mj ? '#202020' : '#444'; x.lineWidth = mj ? 4 : 2; const r1 = R1 * k - 8, r2 = R1 * k - (mj ? 60 : 30); x.beginPath(); x.moveTo(Math.cos(a) * r1, Math.sin(a) * r1); x.lineTo(Math.cos(a) * r2, Math.sin(a) * r2); x.stroke(); }
    x.strokeStyle = '#2a2a2a'; x.lineWidth = 3; [R0 * k + 14, R1 * k - 70, R1 * k - 4].forEach(r => { x.beginPath(); x.arc(0, 0, r, 0, 7); x.stroke(); });
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; x.save(); x.rotate(a); x.fillStyle = '#2c2c2c'; x.fillRect(-3, R0 * k + 24, 6, 26); x.restore(); }
    const t = new THREE.CanvasTexture(c); t.anisotropy = 8; return t; })();
  const dial = new THREE.Group(); dial.position.set(0, 0.012, 0.95); dial.scale.setScalar(0.84); scene.add(dial);
  const brass = M.brass({ roughness: 0.3 }), brassD = M.brassOld({ roughness: 0.42 });
  const face = new THREE.Mesh(new THREE.RingGeometry(R0, R1, 160, 1), M.brass({ roughness: 0.32, bumpMap: tick, bumpScale: 2, roughnessMap: tick })); face.rotation.x = -Math.PI / 2; dial.add(face);
  const inner = new THREE.Mesh(new THREE.CircleGeometry(R0, 96), new THREE.MeshPhysicalMaterial({ color: '#0b0d10', metalness: 0.4, roughness: 0.12, clearcoat: 1 })); inner.rotation.x = -Math.PI / 2; inner.position.y = 0.004; dial.add(inner);
  const rimO = new THREE.Mesh(new THREE.TorusGeometry(R1, 0.055, 16, 160), brass); rimO.rotation.x = Math.PI / 2; rimO.position.y = 0.03; dial.add(rimO);
  const rimI = new THREE.Mesh(new THREE.TorusGeometry(R0, 0.035, 12, 140), brass); rimI.rotation.x = Math.PI / 2; rimI.position.y = 0.02; dial.add(rimI);
  const lip = new THREE.Mesh(new THREE.CylinderGeometry(R1 + 0.06, R1 + 0.1, 0.05, 120, 1, true), brassD); lip.position.y = 0.0; dial.add(lip);
  const beadM = new THREE.MeshPhysicalMaterial({ color: '#ffe3b0', metalness: 0, roughness: 0.05, clearcoat: 1, transmission: 0, emissive: '#ffb050', emissiveIntensity: 0.35 });
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2 + Math.PI / 8, b = new THREE.Mesh(new THREE.SphereGeometry(0.065, 24, 16), beadM); b.position.set(Math.cos(a) * 1.31, 0.07, Math.sin(a) * 1.31); dial.add(b); }
  const front = new THREE.Mesh(new THREE.SphereGeometry(0.09, 28, 20), new THREE.MeshStandardMaterial({ color: '#fff0c8', emissive: '#ffcf7a', emissiveIntensity: 1.4 })); front.position.set(0, 0.09, R1 - 0.02); dial.add(front);
  const frontG = glowSprite([[0, 'rgba(255,220,150,.9)'], [1, 'rgba(255,160,60,0)']], 0.7, 0.8); frontG.position.copy(front.position); dial.add(frontG);
  const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.11), M.carbon({ roughness: 0.2 })); gem.scale.set(1, 1.3, 0.5); gem.position.set(0, 0.1, R1 + 0.2); dial.add(gem);

  /* ---------- 插座 ---------- */
  const sockM = M.brass({ roughness: 0.26 });
  const sockets = [0, 1, 2].map(() => {
    const g = new THREE.Group();
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.37, 0.16, 48), sockM); base.position.y = 0.08; g.add(base);
    const top = new THREE.Mesh(new THREE.TorusGeometry(0.29, 0.02, 10, 64), new THREE.MeshStandardMaterial({ color: '#ffd59a', emissive: '#ffb050', emissiveIntensity: 0.25 })); top.rotation.x = Math.PI / 2; top.position.y = 0.165; g.add(top);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 8), new THREE.MeshStandardMaterial({ color: '#fff', emissive: '#ffcf7a', emissiveIntensity: 2 })); lamp.position.set(0, 0.11, 0.36); g.add(lamp);
    const pl = new THREE.PointLight(0xffc070, 0, 1.6); pl.position.set(0, 0.5, 0.3); g.add(pl);
    dial.add(g); return { g, top, pl, vessel: null, b: null };
  });
  function layoutSockets(n) {
    const xs = n >= 3 ? [-0.78, 0, 0.78] : [-0.55, 0.55];
    sockets.forEach((s, i) => { s.g.visible = i < xs.length; if (i < xs.length) s.g.position.set(xs[i], 0, 0.42 - (n >= 3 && i === 1 ? -0.12 : 0)); });
  }
  layoutSockets(2);

  /* ---------- 器皿几何 ---------- */
  const lathe = (pts, seg = 40) => new THREE.LatheGeometry(pts.map(p => new THREE.Vector2(p[0], p[1])), seg);
  const FLASK = [[0, 0], [0.26, 0], [0.29, 0.03], [0.27, 0.12], [0.12, 0.46], [0.075, 0.56], [0.075, 0.72], [0.09, 0.74]];
  const flaskG = lathe(FLASK), flaskIn = h => { const pts = []; for (let i = 0; i < FLASK.length; i++) { const [r, y] = FLASK[i]; if (y <= h) pts.push([r * 0.9, Math.max(0.012, y)]); else { const [r0, y0] = FLASK[i - 1], k = (h - y0) / (y - y0); pts.push([(r0 + (r - r0) * k) * 0.9, h]); break; } } pts.push([0, h]); return lathe(pts, 36); }, _old = h => lathe([[0, 0.015], [0.25, 0.015], [0.26, 0.04], Math.min(h, 0.12) >= 0.12 ? [0.245, 0.12] : [0.25, h], [0.245 - (Math.max(0, h - 0.12) / 0.34) * 0.12, Math.max(0.12, h)], [0, Math.max(0.12, h)]], 36);
  const glassM = M.glass({ opacity: 0.2, color: '#ffffff' }); /* 无色透明玻璃,不压暗溶液本色 */
  const capM = new THREE.MeshStandardMaterial({ color: '#2a1e14', roughness: 0.8 });
  function contents(b, kind) {
    /* kind: flask(插座上) / bottle(试剂架) */
    const g = new THREE.Group(), col = new THREE.Color(b.c), f = b.form;
    if (f === 'liquid') {
      const m = new THREE.MeshPhysicalMaterial({ color: col, roughness: 0.12, metalness: 0, transparent: true, opacity: (col.r + col.g + col.b) / 3 > 0.78 ? 0.42 : 0.8, clearcoat: 0.6, emissive: col, emissiveIntensity: (col.r + col.g + col.b) / 3 > 0.78 ? 0 : 0.22, depthWrite: false });
      g.add(new THREE.Mesh(kind === 'flask' ? flaskIn(0.2) : new THREE.CylinderGeometry(0.118, 0.118, 0.25, 28).translate(0, 0.135, 0), m));
    } else if (f === 'gas') {
      const m = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: b.c === '#e8f1f7' ? 0.07 : 0.32, depthWrite: false });
      g.add(new THREE.Mesh(kind === 'flask' ? flaskIn(0.5) : new THREE.CylinderGeometry(0.105, 0.105, 0.3, 28).translate(0, 0.17, 0), m));
    } else {
      const metal = f === 'metal', m = new THREE.MeshStandardMaterial({ color: col, roughness: metal ? 0.28 : 0.85, metalness: metal ? 1 : 0 });
      const n = f === 'powder' ? 1 : kind === 'flask' ? 6 : 14;
      if (f === 'powder') { const mound = kind === 'flask' ? new THREE.Mesh(new THREE.SphereGeometry(0.22, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), m) : new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.118, 0.2, 24).translate(0, 0.1, 0), m); mound.scale.y = kind === 'flask' ? 0.45 : 1; mound.position.y = 0.02; g.add(mound); }
      for (let i = 0; i < n && f !== 'powder'; i++) {
        const s = (kind === 'flask' ? 0.07 : 0.035) * (0.7 + ((i * 37) % 10) / 20), geo = metal ? new THREE.BoxGeometry(s * 1.6, s * 0.4, s) : new THREE.DodecahedronGeometry(s, 0);
        const p = new THREE.Mesh(geo, m), a = i * 2.4, r = (kind === 'flask' ? 0.12 : 0.05) * ((i % 3) / 2);
        p.position.set(Math.cos(a) * r, s * 0.6 + (kind === 'flask' ? (i > 3 ? s : 0) : Math.floor(i / 4) * s * 1.1), Math.sin(a) * r); p.rotation.set(i, i * 1.7, i * 0.6); g.add(p);
      }
    }
    return g;
  }
  function makeFlask(b) {
    const g = new THREE.Group(); g.add(contents(b, 'flask'));
    const sh = new THREE.Mesh(flaskG, glassM); sh.renderOrder = 2; g.add(sh);
    if (b.form === 'gas') { const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.085, 0.08, 20), capM); cap.position.y = 0.76; g.add(cap); }
    g.scale.setScalar(0.92); return g;
  }

  /* ---------- 中央全息光环 + 试管 ---------- */
  const holo = new THREE.Group(); holo.position.set(0, 1.12, 1.05); holo.scale.setScalar(0.78); scene.add(holo);
  const ringM = new THREE.MeshBasicMaterial({ color: '#fff1d6' });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.66, 0.016, 16, 160), ringM); holo.add(ring);
  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(0.66, 0.045, 16, 160), new THREE.MeshBasicMaterial({ color: '#ffd6a0', transparent: true, opacity: 0.14, blending: THREE.AdditiveBlending, depthWrite: false })); holo.add(ring2);
  const halo = glowSprite([[0, 'rgba(255,240,210,.0)'], [0.42, 'rgba(255,240,210,.0)'], [0.47, 'rgba(255,235,205,.35)'], [0.53, 'rgba(255,215,170,.12)'], [0.62, 'rgba(255,160,80,0)']], 1.95, 0.8); holo.add(halo);
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.16, 1.3, 32, 1, true), new THREE.MeshBasicMaterial({ color: '#ffd9a0', transparent: true, opacity: 0.05, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  beam.position.set(0, -1.0, 0); holo.add(beam);
  const holoL = new THREE.PointLight(0xffe6c0, 1.4, 2.5); holo.add(holoL);
  const TUBE_H = 0.86, TR = 0.085;
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(TR, TR, TUBE_H, 32, 1, true), M.glass({ opacity: 0.25, side: THREE.DoubleSide })); holo.add(tube);
  const tubeB = new THREE.Mesh(new THREE.SphereGeometry(TR, 24, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), M.glass({ opacity: 0.25 })); tubeB.position.y = -TUBE_H / 2; holo.add(tubeB);
  const lipT = new THREE.Mesh(new THREE.TorusGeometry(TR + 0.006, 0.008, 8, 32), M.glass({ opacity: 0.4 })); lipT.rotation.x = Math.PI / 2; lipT.position.y = TUBE_H / 2; holo.add(lipT);
  const LQ = 0.56;
  const liqM = new THREE.MeshPhysicalMaterial({ color: '#cfe6f2', roughness: 0.1, transparent: true, opacity: 0.62, depthWrite: false, emissive: '#cfe6f2', emissiveIntensity: 0.25, clearcoat: 1 });
  const liq = new THREE.Mesh(new THREE.CylinderGeometry(TR - 0.01, TR - 0.01, LQ, 28), liqM); liq.position.y = -TUBE_H / 2 + LQ / 2; holo.add(liq);
  const liqB = new THREE.Mesh(new THREE.SphereGeometry(TR - 0.01, 20, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), liqM); liqB.position.y = -TUBE_H / 2; holo.add(liqB);
  /* 气泡 / 沉淀絮(实例化) */
  const NB = hi ? 60 : 30, NP = hi ? 110 : 60, dummy = new THREE.Object3D();
  const bubM = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.6, depthWrite: false });
  const bub = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 10, 8), bubM, NB); holo.add(bub);
  const pptM = new THREE.MeshStandardMaterial({ color: '#7fb8ff', roughness: 0.75, emissive: '#000000' }); 
  const ppt = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), pptM, NP); holo.add(ppt);
  bub.frustumCulled = ppt.frustumCulled = false;   /* 实例初始都在视野外,包围球会算错 */
  const Bs = [], Ps = [];
  for (let i = 0; i < NB; i++) Bs.push({ x: 0, y: -9, z: 0, v: 0, s: 0 });
  for (let i = 0; i < NP; i++) Ps.push({ x: 0, y: -9, z: 0, v: 0, s: 0, rest: 0 });
  const heat = glowSprite([[0, 'rgba(255,255,255,.8)'], [1, 'rgba(255,255,255,0)']], 1.0, 0); heat.position.y = -0.15; holo.add(heat);
  const S = { c0: new THREE.Color('#cfe6f2'), c1: new THREE.Color('#cfe6f2'), t: 1, gas: 0, ppt: 0, heat: 0, hc: new THREE.Color('#ff5a2a'), on: 0 };

  /* ---------- 右侧陈设 ---------- */
  const deco = new THREE.Group(); scene.add(deco);
  const f1 = makeFlask({ form: 'liquid', c: '#3d9be0' }); f1.scale.setScalar(1.05); f1.position.set(2.0, 0, 1.25); deco.add(f1);
  const bk = new THREE.Group(); bk.position.set(2.62, 0, 1.35); deco.add(bk);
  bk.add(new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.22, 0.52, 40, 1, true).translate(0, 0.26, 0), M.glass({ opacity: 0.2, side: THREE.DoubleSide })));
  bk.add(new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.02, 32).translate(0, 0.01, 0), M.glass({ opacity: 0.3 })));
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.75, 8), M.glass({ opacity: 0.45 })); rod.position.set(0.06, 0.38, 0); rod.rotation.z = -0.32; bk.add(rod);
  const stand = new THREE.Group(); stand.position.set(3.15, 0, 0.45); deco.add(stand);
  const steel = M.darkSteel(); stand.add(new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.05, 0.5).translate(-0.2, 0.025, 0), steel));
  stand.add(new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 2.6, 12).translate(0, 1.3, 0), M.steel()));
  const clamp = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.05), M.steel()); clamp.position.set(-0.25, 1.7, 0); stand.add(clamp);
  const pip = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.9, 10), M.glass({ opacity: 0.5 })); pip.rotation.z = Math.PI / 2 - 0.08; pip.position.set(2.5, 0.03, 2.2); deco.add(pip);
  const pipB = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 8), new THREE.MeshStandardMaterial({ color: '#e7e2d8', roughness: 0.7 })); pipB.position.set(2.95, 0.04, 2.17); deco.add(pipB);
  /* 左前:小滴管架 */
  const dl = new THREE.Group(); dl.position.set(-3.5, 0, 2.1); deco.add(dl);
  dl.add(new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.32, 24).translate(0, 0.16, 0), M.ceramic()));
  dl.add(new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.7, 10).translate(0, 0.6, 0), M.glass({ opacity: 0.5 })));

  /* ---------- 左侧试剂架(木框 + 黄铜) ---------- */
  const shelf = new THREE.Group(); shelf.position.set(-2.55, 0, 0.6); shelf.rotation.y = 0.16; shelf.scale.setScalar(0.86); scene.add(shelf);
  const wood = new THREE.MeshStandardMaterial({ color: '#3a2618', roughness: 0.55, metalness: 0 }), woodD = new THREE.MeshStandardMaterial({ color: '#1c130c', roughness: 0.8 });
  const SW = 2.3, SH = 2.6, SD = 0.5, ROW_Y = [1.86, 1.06, 0.26];
  [[-SW / 2, 0], [SW / 2, 0]].forEach(([x]) => { const p = new THREE.Mesh(new THREE.BoxGeometry(0.1, SH, SD), wood); p.position.set(x, SH / 2, 0); shelf.add(p);
    const fin = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 12), brass); fin.position.set(x, SH + 0.07, SD / 2 - 0.05); shelf.add(fin);
    const fin2 = fin.clone(); fin2.position.z = -SD / 2 + 0.05; shelf.add(fin2); });
  const back = new THREE.Mesh(new THREE.BoxGeometry(SW, SH, 0.04), woodD); back.position.set(0, SH / 2, -SD / 2); shelf.add(back);
  const topB = new THREE.Mesh(new THREE.BoxGeometry(SW + 0.16, 0.08, SD + 0.06), wood); topB.position.set(0, SH, 0); shelf.add(topB);
  const topRail = new THREE.Mesh(new THREE.BoxGeometry(SW + 0.18, 0.05, 0.03), brass); topRail.position.set(0, SH - 0.06, SD / 2 + 0.03); shelf.add(topRail);
  ROW_Y.forEach(y => { const b = new THREE.Mesh(new THREE.BoxGeometry(SW, 0.06, SD), wood); b.position.set(0, y - 0.03, 0); shelf.add(b);
    const r = new THREE.Mesh(new THREE.BoxGeometry(SW, 0.035, 0.025), brass); r.position.set(0, y - 0.02, SD / 2 + 0.015); shelf.add(r); });
  const botB = new THREE.Mesh(new THREE.BoxGeometry(SW + 0.16, 0.1, SD + 0.06), wood); botB.position.set(0, 0.05, 0); shelf.add(botB);
  const BOT = lathe([[0, 0], [0.12, 0], [0.13, 0.02], [0.13, 0.27], [0.1, 0.33], [0.055, 0.36], [0.055, 0.42], [0.065, 0.43]], 28);
  const plateM = M.brass({ roughness: 0.25 }), plateG = new THREE.BoxGeometry(0.25, 0.085, 0.012);
  let shelfItems = [];
  function setShelf(list) {
    shelfItems.forEach(o => shelf.remove(o.g)); shelfItems = [];
    list.slice(0, 15).forEach((b, i) => {
      const row = Math.floor(i / 5), col = i % 5, g = new THREE.Group();
      g.position.set(-SW / 2 + 0.26 + col * ((SW - 0.52) / 4), ROW_Y[row], 0.04); g.add(contents(b, 'bottle'));
      const sh = new THREE.Mesh(BOT, glassM); sh.renderOrder = 2; g.add(sh);
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.07, 18), b.form === 'gas' ? M.darkSteel() : capM); cap.position.y = 0.45; g.add(cap);
      const pl = new THREE.Mesh(plateG, plateM); pl.position.set(0, 0.16, 0.135); g.add(pl);
      const sel = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.008, 8, 40), new THREE.MeshBasicMaterial({ color: '#ffd27a', transparent: true, opacity: 0 })); sel.rotation.x = Math.PI / 2; sel.position.y = 0.01; g.add(sel);
      g.userData = { b, sel }; shelf.add(g); shelfItems.push({ g, b, pl, sel });
    });
    placeLabels();
  }

  /* ---------- 插座上的锥形瓶 ---------- */
  let slotList = [];
  function setSlots(list) {
    slotList = list.slice(0, 3); layoutSockets(slotList.length >= 3 ? 3 : 2);
    sockets.forEach((s, i) => {
      if (s.vessel) { s.g.remove(s.vessel); s.vessel = null; }
      const b = slotList[i]; s.b = b || null;
      s.top.material.emissiveIntensity = b ? 0.6 : 0.2; s.pl.intensity = b ? 0.7 : 0;
      if (b) { s.vessel = makeFlask(b); s.vessel.position.y = 0.16; s.vessel.userData = { slot: i }; s.g.add(s.vessel); }
    });
    shelfItems.forEach(o => { o.sel.material.opacity = slotList.some(b => b.id === o.b.id) ? 0.9 : 0; });
    placeLabels();
  }

  /* ---------- 标签层(HTML,跟随 3D 位置) ---------- */
  const labelLayer = document.createElement('div'); labelLayer.className = 'fx-labels'; host.appendChild(labelLayer);
  const V = new THREE.Vector3();
  function proj(o, dy = 0) { o.updateWorldMatrix(true, false); V.setFromMatrixPosition(o.matrixWorld); V.y += dy; V.project(cam); return [(V.x + 1) / 2 * W, (1 - V.y) / 2 * Hh, V.z]; }
  function placeLabels() {
    let h = '';
    shelfItems.forEach((o, i) => { const [x, y] = proj(o.pl); h += '<span class="fx-pl s-' + o.b.safe + '" style="left:' + x.toFixed(1) + 'px;top:' + y.toFixed(1) + 'px">' + subH(EF.esc(o.b.f)) + '</span>'; });
    labelLayer.innerHTML = h;
  }

  /* ---------- 拾取 ---------- */
  const ray = new THREE.Raycaster(), mv = new THREE.Vector2(); let pickCb = null, slotCb = null, hoverG = null;
  function hit(ev) {
    const r = el.getBoundingClientRect(); mv.set((ev.clientX - r.left) / r.width * 2 - 1, -(ev.clientY - r.top) / r.height * 2 + 1); ray.setFromCamera(mv, cam);
    const objs = shelfItems.map(o => o.g).concat(sockets.filter(s => s.vessel).map(s => s.vessel));
    const hs = ray.intersectObjects(objs, true); if (!hs.length) return null;
    let o = hs[0].object; while (o && !o.userData.b && o.userData.slot === undefined) o = o.parent; return o;
  }
  el.addEventListener('click', ev => { const o = hit(ev); if (!o) return; if (o.userData.b && pickCb) pickCb(o.userData.b); else if (o.userData.slot !== undefined && slotCb) slotCb(o.userData.slot); });
  el.addEventListener('pointermove', ev => { if (ev.pointerType !== 'mouse') return; const o = hit(ev); el.style.cursor = o ? 'pointer' : 'default'; hoverG = o && o.userData.b ? o : null; });

  /* ---------- 尺寸与相机 ---------- */
  let W = 1, Hh = 1;
  function rs() { W = host.clientWidth || 1; Hh = host.clientHeight || 1; renderer.setSize(W, Hh, false); cam.aspect = W / Hh;
    const narrow = cam.aspect < 1.2; cam.fov = narrow ? 52 : 34;
    cam.position.set(narrow ? -0.6 : 0, narrow ? 3.0 : 2.45, narrow ? 9 : 7.6); cam.lookAt(narrow ? LOOK.clone().setX(-0.6) : LOOK); cam.updateProjectionMatrix(); placeLabels(); }
  const ro = window.ResizeObserver ? new ResizeObserver(rs) : null; ro ? ro.observe(host) : addEventListener('resize', rs); rs();

  /* ---------- 动画 ---------- */
  let alive = true, last = performance.now(), T = 0, vis = true;
  if (window.IntersectionObserver) new IntersectionObserver(es => { vis = es[0].isIntersecting; }, { rootMargin: '60px' }).observe(host);
  const tmp = new THREE.Color();
  function frame(now) {
    if (!alive) return; requestAnimationFrame(frame);
    if (document.hidden || !vis) { last = now; return; }
    const dt = Math.min(0.05, (now - last) / 1000); last = now; T += dt;
    const rm = reduced ? 0 : 1;
    ring.rotation.z += dt * 0.0; halo.material.opacity = 0.6 + 0.12 * Math.sin(T * 1.6) * rm; ring2.material.opacity = 0.14 + 0.08 * Math.sin(T * 2.1) * rm;
    holo.position.y = 1.12 + 0.015 * Math.sin(T * 1.2) * rm;
    shelfItems.forEach(o => { const tgt = o.g === hoverG ? 0.03 : 0; o.g.position.y += ((ROW_Y[Math.floor(shelfItems.indexOf(o) / 5)] + tgt) - o.g.position.y) * Math.min(1, dt * 10); });
    sockets.forEach((s, i) => { if (s.vessel) s.vessel.rotation.y += dt * 0.25 * rm; s.top.material.emissiveIntensity = s.b ? 0.55 + 0.15 * Math.sin(T * 3 + i) * rm : 0.2; });
    /* 液色渐变 */
    S.t = Math.min(1, S.t + dt / 2.4); tmp.copy(S.c0).lerp(S.c1, S.t); liqM.color.copy(tmp); liqM.emissive.copy(tmp);
    /* 气泡 */
    for (let i = 0; i < NB; i++) { const p = Bs[i];
      if (p.y < -1 && S.gas && Math.random() < dt * 6) { const a = Math.random() * 6.28, r = Math.random() * (TR - 0.03); p.x = Math.cos(a) * r; p.z = Math.sin(a) * r; p.y = -TUBE_H / 2 + 0.04; p.v = 0.18 + Math.random() * 0.2; p.s = 0.006 + Math.random() * 0.012; }
      if (p.y > -1) { p.y += p.v * dt; p.x += Math.sin(T * 5 + i) * 0.0008; if (p.y > -TUBE_H / 2 + LQ) p.y = -9; }
      dummy.position.set(p.x, p.y, p.z); dummy.scale.setScalar(p.y < -1 ? 0.0001 : p.s); dummy.updateMatrix(); bub.setMatrixAt(i, dummy.matrix); }
    bub.instanceMatrix.needsUpdate = true;
    for (let i = 0; i < NP; i++) { const p = Ps[i];
      if (p.y < -1 && S.ppt && Math.random() < dt * 9) { const a = Math.random() * 6.28, r = Math.random() * (TR - 0.025); p.x = Math.cos(a) * r; p.z = Math.sin(a) * r; p.y = -TUBE_H / 2 + LQ - 0.03; p.v = 0.05 + Math.random() * 0.07; p.s = 0.013 + Math.random() * 0.02; p.rest = -TUBE_H / 2 - 0.03 + Math.random() * 0.1; }
      if (p.y > -1 && p.y > p.rest) { p.y -= p.v * dt; p.x += Math.sin(T * 2 + i) * 0.0004; }
      dummy.position.set(p.x, p.y, p.z); dummy.rotation.set(i, i * 2, 0); dummy.scale.setScalar(p.y < -1 ? 0.0001 : p.s); dummy.updateMatrix(); ppt.setMatrixAt(i, dummy.matrix); }
    ppt.instanceMatrix.needsUpdate = true;
    heat.material.color.copy(S.hc); heat.material.opacity += ((S.heat ? 0.5 + 0.15 * Math.sin(T * 3) * rm : 0) - heat.material.opacity) * Math.min(1, dt * 3);
    renderer.render(scene, cam);
    if (((T * 10) | 0) % 3 === 0) placeLabels();
  }
  requestAnimationFrame(frame);

  return {
    labelLayer, setShelf, setSlots,
    onPick(cb) { pickCb = cb; }, onSlot(cb) { slotCb = cb; },
    run(r, o = {}) {
      const v = r.viz || {}, ob = r.obs || {}, quiet = !!o.quiet;
      S.c0.set(v.c0 || '#cfe6f2'); S.c1.set(v.c1 || v.c0 || '#cfe6f2'); S.t = reduced || quiet ? 1 : 0;
      Bs.forEach(p => p.y = -9); Ps.forEach(p => p.y = -9);
      S.gas = quiet ? 0 : ob.g ? 1 : 0; S.ppt = quiet ? 0 : ob.p ? 1 : 0; if (v.p) { pptM.color.set(v.p); pptM.emissive.set(v.p).multiplyScalar(0.25); }
      bubM.color.set(v.g || '#ffffff'); S.heat = quiet ? 0 : ob.h ? 1 : 0; S.hc.set(ob.h === 'endo' ? '#5fb4ff' : '#ff5a2a');
      clearTimeout(this._h); this._h = setTimeout(() => { S.gas = 0; S.ppt = 0; }, 8000);
    },
    clear() { S.c0.set('#cfe6f2'); S.c1.set('#cfe6f2'); S.t = 1; S.gas = S.ppt = S.heat = 0; Bs.forEach(p => p.y = -9); Ps.forEach(p => p.y = -9); },
    destroy() { alive = false; ro && ro.disconnect(); renderer.dispose(); el.remove(); labelLayer.remove(); }
  };
}
