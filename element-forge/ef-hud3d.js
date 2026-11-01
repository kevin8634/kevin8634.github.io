/* 元素工坊 Element Forge · 3D HUD「锻炉星盘」ef-hud3d.js v2.2
   依据:开发文档/元素工坊_HUD3D锻炉星盘_方案_v1.0.md、v2.2 视觉定调 v1.0。
   与首页尺度镜共用同一个渲染器与场景(ef-home.js 调 install),不另开 WebGL 上下文。
   陈设(黑石实验桌、黄铜星盘、试剂器皿)写实 PBR,颜色只给化学的东西(data/ef.colors.json 同值);
   文字一律是 HTML 层。没有火焰:烧杯/试管不冒火。低档不加载本模块(保持 2D HUD)。 */
import * as THREE from './vendor/three.module.min.js';
import { M, studioEnv } from './ef-pbr.js?v=1';
const EF = window.EF;

/* 7 档尺度在星盘上的玻璃珠,亮 = 该档对应任务已通关 */
const STOPS = 7, STEP = Math.PI * 2 / STOPS;
const ION = { cu: '#2f8fd8', mno4: '#8a1f8f', ni: '#58b06a', fe3: '#c9862a', co: '#e07aa0', fescn: '#a3121c', cr: '#3f8f5a', i2: '#7a3b12' };

export function install(gl, scene, cam, ST) {
  const { renderer } = gl, tier = EF.glTier, hi = tier === 'high';
  const env = studioEnv(renderer);
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
  const root = new THREE.Group(); root.name = 'hud3d'; scene.add(root);
  const withEnv = (m, k = 1) => { m.envMap = env; m.envMapIntensity = k; return m; };

  /* ---------- 写实实验桌:黑石台面 + 前沿倒角 ---------- */
  const deskY = -2.35;
  const top = new THREE.Mesh(new THREE.BoxGeometry(22, 0.3, 9), withEnv(M.stone({ roughness: 0.32 }), 0.9));
  top.material.map.repeat.set(5, 2); top.position.set(0, deskY - 0.15, -1.2); root.add(top);
  const lip = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 22, 24, 1, false, 0, Math.PI), top.material); lip.rotation.z = Math.PI / 2; lip.rotation.x = -Math.PI / 2; lip.position.set(0, deskY - 0.15, 3.3); root.add(lip);
  /* 桌上主光斑(暖) */
  const pool = new THREE.PointLight(0xffd6a0, hi ? 9 : 6, 9, 1.8); pool.position.set(0, 0.2, 2.2); root.add(pool);

  /* ---------- 黄铜星盘(尺度镜) ---------- */
  const dial = new THREE.Group(); dial.position.set(0, -0.92, -0.7); dial.rotation.x = -Math.PI / 2 + 0.95; root.add(dial);
  const spin = new THREE.Group(); dial.add(spin);
  const R0 = 1.44, R1 = 1.76;
  const tick = (() => {
    const S = 1024, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d');
    x.fillStyle = '#808080'; x.fillRect(0, 0, S, S); x.translate(S / 2, S / 2);
    const k = S / 2 / R1, a = R0 * k, b = R1 * k;
    for (let i = 0; i < 168; i++) {
      const ang = i / 168 * Math.PI * 2, mj = i % 24 === 0, md = i % 6 === 0;
      x.strokeStyle = mj ? '#202020' : md ? '#3a3a3a' : '#5a5a5a'; x.lineWidth = mj ? 5 : md ? 3 : 1.6;
      const r1 = b - 8, r2 = b - (mj ? 70 : md ? 46 : 26);
      x.beginPath(); x.moveTo(Math.cos(ang) * r1, Math.sin(ang) * r1); x.lineTo(Math.cos(ang) * r2, Math.sin(ang) * r2); x.stroke();
    }
    x.strokeStyle = '#2a2a2a'; x.lineWidth = 3; [a + 14, b - 82].forEach(r => { x.beginPath(); x.arc(0, 0, r, 0, 7); x.stroke(); });
    const t = new THREE.CanvasTexture(c); t.anisotropy = 8; return t;
  })();
  const faceM = withEnv(M.brass({ color: '#c9a060', roughness: 0.26, bumpMap: tick, bumpScale: 1.2, roughnessMap: tick }), 2.4);
  const face = new THREE.Mesh(new THREE.RingGeometry(R0, R1, 168, 1), faceM); spin.add(face);
  const rimO = new THREE.Mesh(new THREE.TorusGeometry(R1, 0.05, 16, 168), withEnv(M.brassOld({ color: '#a8844a', roughness: 0.32 }), 2.2)); spin.add(rimO);
  const rimI = new THREE.Mesh(new THREE.TorusGeometry(R0, 0.035, 12, 168), withEnv(M.brassOld({ color: '#a8844a', roughness: 0.32 }), 2.2)); spin.add(rimI);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(R1 + 0.02, R1 + 0.02, 0.14, 168, 1, true), withEnv(M.brassOld({ roughness: 0.45 }), 1)); band.rotation.x = Math.PI / 2; band.position.z = -0.07; spin.add(band);
  /* 档位玻璃珠 */
  const beads = [];
  for (let i = 0; i < STOPS; i++) {
    const a = Math.PI / 2 - i * STEP;              /* 第 0 档在正前方 */
    const gm = withEnv(new THREE.MeshPhysicalMaterial({ color: '#f2efe8', roughness: 0.03, clearcoat: 1, transparent: true, opacity: 0.55, emissive: '#ffb35c', emissiveIntensity: 0 }), 2);
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.09, 24, 16), gm); b.position.set(Math.cos(a) * (R0 + R1) / 2, Math.sin(a) * (R0 + R1) / 2, 0.1); spin.add(b);
    const seat = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.02, 10, 32), withEnv(M.brass({ roughness: 0.25 }), 1.2)); seat.position.copy(b.position); seat.position.z = 0.03; spin.add(seat);
    beads.push(gm);
  }
  /* 固定的指针(不随盘转):前方黄铜三角 + 小玻璃窗 */
  const ptr = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.22, 3), withEnv(M.brass({ roughness: 0.22 }), 1.3)); ptr.rotation.z = Math.PI; ptr.position.set(0, R1 + 0.2, 0.08); dial.add(ptr);
  /* 盘下的支撑脚(落到桌面) */
  [0, 1, 2].forEach(i => { const a = Math.PI / 2 + i * Math.PI * 2 / 3 + Math.PI / 3; const f = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 0.32, 16), withEnv(M.brassOld(), 1)); f.rotation.x = Math.PI / 2; f.position.set(Math.cos(a) * R1 * 0.92, Math.sin(a) * R1 * 0.92, -0.2); dial.add(f); });

  function refreshBeads() {
    const SC = EF.SC || [];
    beads.forEach((m, i) => { const s = SC[i], M2 = s && EF.MISSIONS[s.t], p = s && EF.prog(s.t), done = M2 && p && p.done && p.done.length >= M2.n; m.userData.done = !!done; });
  }
  refreshBeads(); addEventListener('focus', refreshBeads);

  /* ---------- 试剂器皿(真实化学色,无火焰) ---------- */
  const props = new THREE.Group(); root.add(props);
  const glassM = () => withEnv(M.glass({ opacity: 0.22 }), 1.8);
  const liquidM = col => withEnv(new THREE.MeshPhysicalMaterial({ color: col, roughness: 0.08, clearcoat: 1, transparent: true, opacity: 0.86, emissive: col, emissiveIntensity: 0.18 }), 1.2);
  function vessel(profile, fill, col, x, z, s = 1) {
    const g = new THREE.Group(), pts = profile.map(p => new THREE.Vector2(p[0], p[1]));
    g.add(new THREE.Mesh(new THREE.LatheGeometry(pts, 48), glassM()));
    const inner = profile.filter(p => p[1] <= fill).map(p => new THREE.Vector2(Math.max(0.001, p[0] * 0.93), p[1] + 0.012));
    const last = profile.find(p => p[1] > fill) || profile[profile.length - 1];
    inner.push(new THREE.Vector2(last[0] * 0.93, fill), new THREE.Vector2(0.001, fill));
    g.add(new THREE.Mesh(new THREE.LatheGeometry(inner, 48), liquidM(col)));
    g.scale.setScalar(s); g.position.set(x, deskY, z); props.add(g); return g;
  }
  const beaker = [[0.001, 0], [0.42, 0], [0.45, 0.03], [0.45, 0.95], [0.5, 1.0]];
  const flask = [[0.001, 0], [0.48, 0], [0.5, 0.04], [0.16, 0.78], [0.14, 0.82], [0.14, 1.15], [0.17, 1.2]];
  const round = [[0.001, 0.02], [0.3, 0.1], [0.48, 0.42], [0.42, 0.72], [0.15, 0.92], [0.13, 1.3], [0.16, 1.34]];
  vessel(beaker, 0.55, ION.cu, -4.6, -3.6, 0.9);
  vessel(flask, 0.42, ION.mno4, -3.6, -4.2, 1.0);
  vessel(flask, 0.38, ION.ni, -2.7, -4.8, 0.85);
  vessel(flask, 0.4, ION.fe3, 3.0, -4.4, 0.9);
  vessel(round, 0.5, ION.co, 4.0, -3.7, 0.95);
  /* 试管架:木架 + 4 支试管 */
  const rack = new THREE.Group(); rack.position.set(5.4, deskY, -4.6); rack.rotation.y = -0.35; props.add(rack);
  const wood = withEnv(new THREE.MeshStandardMaterial({ color: '#4a2f1c', roughness: 0.62, metalness: 0 }), 0.5);
  [[1.6, 0.06, 0.4, 0, 0.03, 0], [1.6, 0.05, 0.4, 0, 0.62, 0]].forEach(([w, h, d, x, y, z]) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wood); m.position.set(x, y, z); rack.add(m); });
  [-0.78, 0.78].forEach(x => { const m = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.9, 0.4), wood); m.position.set(x, 0.45, 0); rack.add(m); });
  [ION.fescn, ION.i2, ION.cr, ION.cu].forEach((col, i) => {
    const x = -0.51 + i * 0.34, tube = [[0.001, 0.05], [0.07, 0.08], [0.085, 0.16], [0.085, 1.1], [0.1, 1.13]];
    const t = vessel(tube, 0.62, col, 0, 0); props.remove(t); t.position.set(x, 0, 0); rack.add(t);
  });

  /* ---------- 星盘交互:拖动下方区域转盘;键盘 ←→ 已由页面处理 ---------- */
  const cv = renderer.domElement; let drag = null;
  const inDial = e => { const r = cv.getBoundingClientRect(); return e.clientY > r.top + r.height * 0.7; };
  cv.addEventListener('pointerdown', e => { if (!inDial(e)) return; drag = { x: e.clientX, v: ST.target }; EF._dialDrag = true; cv.setPointerCapture(e.pointerId); e.stopImmediatePropagation(); }, true);
  cv.addEventListener('pointermove', e => { if (!drag) return; const r = cv.getBoundingClientRect(); ST.target = Math.max(0, Math.min(6, drag.v - (e.clientX - drag.x) / r.width * 9)); }, true);
  const end = () => { if (!drag) return; drag = null; EF._dialDrag = false; if (EF.stageGo) EF.stageGo(Math.round(ST.target), false); EF.play && EF.play('anvil'); };
  cv.addEventListener('pointerup', end, true); cv.addEventListener('pointercancel', end, true);

  let spinA = 0;
  gl.onFrame((t, dt) => {
    root.visible = gl.scene === scene;
    if (!root.visible) return;
    /* 星盘转到当前档:目标档位于正前方 */
    const goal = ST.val * STEP; spinA += (goal - spinA) * (EF.reduced ? 1 : 1 - Math.exp(-dt * 6)); spin.rotation.z = spinA;
    const cur = Math.round(ST.val);
    beads.forEach((m, i) => { const on = m.userData.done ? 1.1 : 0, act = i === cur ? 0.9 : 0; m.emissiveIntensity += ((on + act) - m.emissiveIntensity) * 0.1; m.emissive.set(i === cur ? '#ffd27a' : '#ffb35c'); });
    pool.intensity = (hi ? 9 : 6) * (0.92 + Math.sin(t * 0.8) * 0.04 * (EF.reduced ? 0 : 1));
  });

  /* ---------- HTML 层:铭牌、气体玻璃球按钮、任务螺旋卡阵 ---------- */
  document.body.classList.add('hud3d');
  buildHTML(ST);
  EF.hud3d = { root, refreshBeads };
  return EF.hud3d;
}

/* 任务卡上的元素符号:每张卡一种元素色(颜色取 data/ef.colors.json missions) */
const CARD = {
  stars: ['Fe', '#ff9a3c'], carbon: ['C', '#8a909e'], crystal: ['Si', '#bfe9ff'], cabbage: ['H⁺', '#8a4fd8'], fireworks: ['Sr', '#ff2448'],
  battery: ['Li', '#7ad7ff'], rocks: ['Mg', '#a8794c'], mars: ['Fe₂O₃', '#c8502a'], titan: ['N₂', '#e0902a'], spectra: ['Na', '#ffd27a'],
  island: ['Og', '#ffb35c'], react: ['Cu²⁺', '#2f8fd8']
};
function buildHTML(ST) {
  const hud = document.getElementById('hud'); if (!hud || document.getElementById('spiral')) return;
  /* 铭牌 */
  const plate = document.createElement('div'); plate.className = 'h3-plate'; plate.id = 'h3plate'; plate.setAttribute('aria-live', 'polite'); hud.appendChild(plate);
  /* 螺旋卡阵 */
  const nav = document.createElement('nav'); nav.className = 'h3-spiral'; nav.id = 'spiral'; nav.setAttribute('aria-label', '任务卡阵');
  const keys = Object.keys(EF.MISSIONS).filter(k => CARD[k]);
  nav.innerHTML = '<div class="h3-track">' + keys.map((k, i) => {
    const Mi = EF.MISSIONS[k], p = EF.prog(k), done = p.done && p.done.length >= Mi.n, c = CARD[k];
    return '<a class="h3-card' + (done ? ' done' : '') + '" href="' + Mi.href + '" style="--c:' + c[1] + ';--i:' + i + '" aria-label="' + Mi.q + (done ? '(已通关)' : '') + '"><span class="h3-sym">' + c[0] + '</span><span class="h3-q">' + Mi.q + '</span></a>';
  }).join('') + '</div>';
  hud.appendChild(nav);
  const track = nav.firstChild, cards = track.children; let off = 0;
  const lay = () => { Array.prototype.forEach.call(cards, (el, i) => { const d = i - off; el.style.setProperty('--d', d.toFixed(3)); el.style.visibility = Math.abs(d) > 4.6 ? 'hidden' : ''; }); };
  nav.addEventListener('wheel', e => { e.preventDefault(); e.stopPropagation(); off = Math.max(0, Math.min(cards.length - 1, off + Math.sign(e.deltaY) * 0.5)); lay(); }, { passive: false });
  nav.addEventListener('focusin', e => { const i = Array.prototype.indexOf.call(cards, e.target); if (i >= 0) { off = i; lay(); } });
  let ty = null; nav.addEventListener('touchstart', e => { ty = e.touches[0].clientY; }, { passive: true });
  nav.addEventListener('touchmove', e => { if (ty == null) return; const dy = ty - e.touches[0].clientY; if (Math.abs(dy) > 24) { off = Math.max(0, Math.min(cards.length - 1, off + Math.sign(dy) * 0.5)); ty = e.touches[0].clientY; lay(); } }, { passive: true });
  off = 2; lay();
  /* 铭牌随当前尺度更新 */
  let lastK = -1;
  (function tick() {
    const k = Math.round(ST.target);
    if (k !== lastK) {
      lastK = k; const s = (EF.SC || [])[k];
      if (s) { const Mi = EF.MISSIONS[s.t], p = EF.prog(s.t), n = (p.done || []).length; plate.innerHTML = '<small>尺度镜 · ' + s.n + '</small><b>' + Mi.q + '</b><span>第 ' + Math.min(Mi.n, n + 1) + ' / ' + Mi.n + ' 关 · ' + '★'.repeat(n) + '<i>' + '☆'.repeat(Mi.n - n) + '</i></span>'; }
    }
    requestAnimationFrame(tick);
  })();
}
