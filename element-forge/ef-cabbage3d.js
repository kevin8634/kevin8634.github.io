/* 元素工坊 Element Forge · cabbage 任务 3D 玩法 ef-cabbage3d.js v0.5
   「为什么紫甘蓝汁会变色?」:L0 厨房调色盘(3D 台面滴汁、排队),L2/L3 微观窗口的花青素分子(可拖转)。
   颜色与 pH 的对应、分子骨架示意都来自页面里的 EF.CAB(2D/3D 共用一份数据)。
   关卡判定、提示、三星由 ef.js 负责;低档或这里出错时回落 cabbage/index.html 里的平面版。 */
import { THREE } from './ef-gl.js?v=2';
const EF = window.EF, CAB = EF.CAB;
const RM = () => EF.reduced;
const col3 = ph => { const c = CAB.rgb(ph); return new THREE.Color(c[0] / 255, c[1] / 255, c[2] / 255); };
const hex3 = h => new THREE.Color(h);
function note(parent, html) { const p = document.createElement('p'); p.className = 'note-sm'; p.innerHTML = html || ''; parent.appendChild(p); return p; }

function stage3d(parent, opt = {}) {
  const h = opt.h || (EF.mobile ? 320 : 380);
  document.body.classList.add('stage3d');
  const wrap = document.createElement('div'); wrap.className = 's3d'; wrap.style.height = h + 'px'; parent.appendChild(wrap);
  const renderer = new THREE.WebGLRenderer({ antialias: EF.glTier === 'high', alpha: true });
  renderer.setPixelRatio(EF.dpr()); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.setClearColor(0x000000, 0);
  wrap.appendChild(renderer.domElement);
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(opt.fov || 40, 1, 0.05, 200);
  scene.add(new THREE.AmbientLight(0xc0b0c8, 0.8));
  const key = new THREE.DirectionalLight(0xfff0f6, 2.3); key.position.set(3, 5, 4); scene.add(key);
  const rim = new THREE.DirectionalLight(0xff7ad9, 0.9); rim.position.set(-4, 1, -3); scene.add(rim);
  const o = { wrap, renderer, scene, camera, cbs: [], yaw: opt.yaw || 0, pitch: opt.pitch || 0.25, drag: opt.drag !== false, onPick: null, auto: false };
  function rs() { const w = wrap.clientWidth || 300, hh = wrap.clientHeight || h; renderer.setSize(w, hh, false); camera.aspect = w / hh; camera.updateProjectionMatrix(); }
  rs(); const ro = window.ResizeObserver ? new ResizeObserver(rs) : null; if (ro) ro.observe(wrap); else addEventListener('resize', rs);
  let down = null;
  wrap.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY, yaw: o.yaw, pitch: o.pitch, moved: 0 }; wrap.setPointerCapture && wrap.setPointerCapture(e.pointerId); });
  wrap.addEventListener('pointermove', e => {
    if (!down) return; const dx = e.clientX - down.x, dy = e.clientY - down.y; down.moved = Math.max(down.moved, Math.hypot(dx, dy));
    if (o.drag && down.moved > 6) { o.auto = false; o.yaw = down.yaw + dx * 0.009; o.pitch = Math.max(-1.1, Math.min(1.1, down.pitch + dy * 0.007)); }
  });
  wrap.addEventListener('pointerup', e => {
    if (down && down.moved < 6 && o.onPick) {
      const r = wrap.getBoundingClientRect(), v = new THREE.Vector2((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      const rc = new THREE.Raycaster(); rc.setFromCamera(v, camera); o.onPick(rc);
    }
    down = null;
  });
  wrap.addEventListener('pointercancel', () => { down = null; });
  let last = performance.now();
  function frame(now) {
    if (!wrap.isConnected) { if (ro) ro.disconnect(); renderer.dispose(); renderer.forceContextLoss(); return; }
    requestAnimationFrame(frame);
    if (document.hidden) { last = now; return; }
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (o.auto) o.yaw += dt * 0.25;
    for (const f of o.cbs) f(now / 1000, dt);
    renderer.render(scene, camera);
  }
  o.onFrame = f => o.cbs.push(f);
  o.orbit = (dist, ty = 0) => { camera.position.set(Math.sin(o.yaw) * Math.cos(o.pitch) * dist, Math.sin(o.pitch) * dist + ty, Math.cos(o.yaw) * Math.cos(o.pitch) * dist); camera.lookAt(0, ty, 0); };
  requestAnimationFrame(frame);
  return o;
}
function label(text, opt = {}) {
  const fs = 44, c = document.createElement('canvas'), x = c.getContext('2d'), F = '700 ' + fs + 'px system-ui,"PingFang SC","Noto Sans SC",sans-serif';
  x.font = F; const w = Math.ceil(x.measureText(text).width) + 30; c.width = w; c.height = fs + 22; x.font = F; x.textAlign = 'center'; x.textBaseline = 'middle';
  if (opt.bg !== false) { x.fillStyle = 'rgba(14,10,26,.78)'; x.beginPath(); x.roundRect ? x.roundRect(1, 1, w - 2, c.height - 2, 14) : x.rect(1, 1, w - 2, c.height - 2); x.fill(); x.strokeStyle = 'rgba(255,122,217,.6)'; x.lineWidth = 2; x.stroke(); }
  x.fillStyle = opt.color || '#f4ede1'; x.fillText(text, w / 2, c.height / 2 + 2);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false, depthWrite: false }));
  const k = (opt.size || 0.2) / c.height; s.scale.set(w * k, c.height * k, 1); s.renderOrder = 5; return s;
}

/* ---------- 一支 3D 试管:玻璃 + 液体 ---------- */
function makeTube(r = 0.17, h = 1.25) {
  const g = new THREE.Group();
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 28, 1, true), new THREE.MeshStandardMaterial({ color: 0xdfefff, roughness: 0.05, metalness: 0, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false }));
  glass.position.y = h / 2; g.add(glass);
  const bottom = new THREE.Mesh(new THREE.SphereGeometry(r, 28, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), glass.material); bottom.position.y = 0; g.add(bottom);
  const lm = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6, emissive: 0x000000, emissiveIntensity: 0.6, transparent: true, opacity: 0.96 });
  const liq = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.9, r * 0.9, h * 0.6, 24), lm); liq.position.y = h * 0.3; g.add(liq);
  const lb = new THREE.Mesh(new THREE.SphereGeometry(r * 0.9, 24, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), lm); g.add(lb);
  const rimR = new THREE.Mesh(new THREE.TorusGeometry(r * 1.02, 0.012, 8, 32), new THREE.MeshStandardMaterial({ color: 0xdfefff, transparent: true, opacity: 0.6 })); rimR.rotation.x = Math.PI / 2; rimR.position.y = h; g.add(rimR);
  const hit = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.6, r * 1.6, h * 1.2, 8), new THREE.MeshBasicMaterial({ visible: false })); hit.position.y = h / 2; g.add(hit);
  g.userData = { liq: lm, hit };
  return g;
}

/* ---------- L0 厨房调色盘 ---------- */
function L0(stage, api) {
  const S = stage3d(stage, { yaw: 0, pitch: 0.32, drag: true });
  const msg = note(stage, '台面上 6 杯厨房里的液体。点一支试管,滴进紫甘蓝汁。拖动可以转台面。');
  const cd = document.createElement('div'); cd.className = 'cab-card'; cd.innerHTML = '<b style="color:#ff9ae0">在家可以试:</b>紫甘蓝切碎(请大人帮忙用刀),泡热水(热水请大人倒)几分钟,滤出紫色汁。再分别滴进柠檬汁、白醋、清水、小苏打水里看颜色。实验液不要喝,做完倒掉、洗手。'; stage.appendChild(cd);
  const W = 0.62, slotX = s => (s - 2.5) * W;
  const table = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.08, 1.6), new THREE.MeshStandardMaterial({ color: 0x3a2a36, roughness: 0.85 })); table.position.y = -0.05; S.scene.add(table);
  const T = CAB.DISP.map((li, s) => {
    const g = makeTube(); g.position.set(slotX(s), 0, 0); S.scene.add(g);
    const L = CAB.LIQ[li]; g.userData.liq.color.copy(hex3(L.raw));
    const tag = label(L.n, { size: 0.15 }); tag.position.set(0, -0.2, 0.35); g.add(tag);
    const num = label('', { size: 0.16, color: '#ffd27a' }); num.visible = false; num.position.set(0, 1.5, 0); g.add(num);
    return { g, li, slot: s, drop: 0, tag, num };
  });
  /* 滴管 */
  const drp = new THREE.Group(), dm = new THREE.MeshStandardMaterial({ color: 0xeee8f4, roughness: 0.2, transparent: true, opacity: 0.8 });
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 12), new THREE.MeshStandardMaterial({ color: 0x7a3fa8, roughness: 0.5 })); bulb.position.y = 0.42; drp.add(bulb);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.015, 0.5, 12), dm); stem.position.y = 0.15; drp.add(stem);
  drp.position.set(2.1, 1.6, 0); S.scene.add(drp);
  const drop = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 8), new THREE.MeshStandardMaterial({ color: 0x7a3fa8, emissive: 0x3a0f58, emissiveIntensity: 0.6 })); drop.visible = false; S.scene.add(drop);
  let ph = 'drop', dropped = 0, busy = null; const sorted = [];
  function relayout() { const rest = T.filter(z => sorted.indexOf(z) < 0); sorted.forEach((o, i) => o.slot = i); rest.forEach((o, i) => o.slot = sorted.length + i); }
  S.onPick = rc => {
    const hit = rc.intersectObjects(T.map(o => o.g.userData.hit), false)[0]; if (!hit) return;
    const o = T.find(z => z.g.userData.hit === hit.object), L = CAB.LIQ[o.li];
    if (ph === 'drop' && !o.drop && !busy) {
      busy = { o, t0: performance.now() }; o.drop = 1; dropped++; EF.play('select'); EF.tone(Math.round(24 - L.ph * 1.5));
      msg.innerHTML = L.n + ' + 紫甘蓝汁 → 变成了这个颜色。' + (dropped < 6 ? '还剩 ' + (6 - dropped) + ' 支。' : '');
      if (dropped === 6) setTimeout(() => { ph = 'sort'; EF.play('whoosh'); msg.innerHTML = '同一种紫色的汁,变出了一整排颜色!现在<b>从最红到最黄</b>,依次点试管,把它们排成一排。'; }, 1600);
    } else if (ph === 'sort' && sorted.indexOf(o) < 0) {
      const rem = T.filter(z => sorted.indexOf(z) < 0).map(z => z.li);
      if (CAB.nextOK(rem, o.li)) {
        sorted.push(o); EF.play('select'); EF.tone(Math.round(24 - L.ph * 1.5)); relayout();
        o.num.material.map.dispose(); const n = label(String(sorted.length), { size: 0.16, color: '#ffd27a' }); o.g.remove(o.num); o.num = n; n.position.set(0, 1.5, 0); o.g.add(n);
        if (sorted.length === 6) { msg.innerHTML = '排好了:红 → 粉 → 紫 → 蓝 → 绿 → 黄。汁没变,变的是它遇到的液体。'; setTimeout(api.complete, 900); } else msg.innerHTML = '对!下一支,哪支更接近红色?';
      } else { EF.play('tick'); msg.innerHTML = '再看看:剩下的里面,还有<b>更红</b>的一支。'; }
    }
  };
  S.onFrame((t, dt) => {
    S.orbit(EF.mobile ? 5.6 : 4.6, 0.55);
    const now = performance.now();
    if (busy) {
      const o = busy.o, k = (now - busy.t0) / (RM() ? 1 : 1500), tx = o.g.position.x;
      drp.position.x += (tx - drp.position.x) * (RM() ? 1 : Math.min(1, dt * 8));
      if (k > 0.3 && k < 0.6) { drop.visible = true; const q = (k - 0.3) / 0.3; drop.position.set(tx, 1.55 - q * 0.8, 0); } else drop.visible = false;
      if (k > 0.55) { const L = CAB.LIQ[o.li], q = Math.min(1, (k - 0.55) / 0.45); o.g.userData.liq.color.copy(hex3(L.raw)).lerp(col3(L.ph), q); o.g.userData.liq.emissive.copy(col3(L.ph)).multiplyScalar(0.7 * q); }
      if (k >= 1) busy = null;
    } else if (ph === 'sort') drp.position.x += (2.6 - drp.position.x) * Math.min(1, dt * 3);
    T.forEach(o => { const tx = slotX(o.slot); o.g.position.x += (tx - o.g.position.x) * (RM() ? 1 : Math.min(1, dt * 6)); o.num.visible = sorted.indexOf(o) > -1; });
  });
}

/* ---------- 微观窗口:花青素分子(L2 用) ---------- */
function mol(parent, opt = {}) {
  const S = stage3d(parent, { h: opt.h || 250, yaw: 0, pitch: 0, fov: 38 });
  const host = new THREE.Group(); S.scene.add(host);
  const mC = new THREE.MeshStandardMaterial({ color: 0x9aa0ab, roughness: 0.45 }), mO = new THREE.MeshStandardMaterial({ color: 0xff5a4a, roughness: 0.35, emissive: 0x400a06, emissiveIntensity: 0.5 }),
    mH = new THREE.MeshStandardMaterial({ color: 0xf4f4f4, roughness: 0.4 }), mB = new THREE.MeshStandardMaterial({ color: 0xd8d2e4, roughness: 0.5 });
  const gC = new THREE.SphereGeometry(0.075, 16, 12), gO = new THREE.SphereGeometry(0.1, 18, 14), gH = new THREE.SphereGeometry(0.06, 14, 10), gBond = new THREE.CylinderGeometry(0.022, 0.022, 1, 8);
  const halo = new THREE.Mesh(new THREE.SphereGeometry(2.1, 32, 16), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.1, depthWrite: false, side: THREE.BackSide })); S.scene.add(halo);
  const tag = { s: null };
  /* 漂浮的 H⁺ / OH⁻ */
  const ions = new THREE.Group(); S.scene.add(ions);
  const mHp = new THREE.MeshStandardMaterial({ color: 0xff7a9a, emissive: 0x5a0a20, emissiveIntensity: 0.7 }), mOH = new THREE.MeshStandardMaterial({ color: 0x7ad7ff, emissive: 0x0a3a5a, emissiveIntensity: 0.7 });
  const pool = []; for (let i = 0; i < 26; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(i < 16 ? 0.05 : 0.07, 12, 8), i < 16 ? mHp : mOH); m.userData = { a: Math.random() * 6.28, r: 1.3 + Math.random() * 0.6, y: (Math.random() - 0.5) * 1.4, v: 0.2 + Math.random() * 0.4, kind: i < 16 ? 'H' : 'OH' }; ions.add(m); pool.push(m); }
  const legend = document.createElement('div'); legend.className = 's3d-leg'; legend.innerHTML = '<span><i style="background:#ff5a4a"></i>O 氧</span><span><i style="background:#f4f4f4"></i>H 氢</span><span><i style="background:#ff7a9a"></i>H⁺</span><span><i style="background:#7ad7ff"></i>OH⁻</span>'; S.wrap.appendChild(legend);
  let form = null, curPh = 7;
  function bond(a, b, off = 0) { const A = new THREE.Vector3(a.x, a.y, 0), B = new THREE.Vector3(b.x, b.y, 0), d = B.clone().sub(A), L = d.length(); const m = new THREE.Mesh(gBond, mB);
    m.scale.set(1, L, 1); m.position.copy(A).add(B).multiplyScalar(0.5); if (off) { const n = new THREE.Vector3(-d.y, d.x, 0).normalize().multiplyScalar(off); m.position.add(n); } m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); return m; }
  function build(f) {
    while (host.children.length) host.remove(host.children[0]);
    const M = CAB.mol(f), cx = 0.25;
    M.at.forEach(a => { const m = new THREE.Mesh(a.e === 'C' ? gC : a.e === 'O' ? gO : gH, a.e === 'C' ? mC : a.e === 'O' ? mO : mH); m.position.set(a.x - cx, a.y, 0); host.add(m);
      if (a.ch) { const s = label(a.ch, { size: 0.16, color: a.ch === '+' ? '#ff7a9a' : '#7ad7ff' }); s.position.set(a.x - cx + 0.14, a.y + 0.14, 0.05); host.add(s); } });
    M.bd.forEach(b => { const A = { x: M.at[b[0]].x - cx, y: M.at[b[0]].y }, B = { x: M.at[b[1]].x - cx, y: M.at[b[1]].y }; if (b[2] === 2) { host.add(bond(A, B, 0.03), bond(A, B, -0.03)); } else host.add(bond(A, B)); });
    if (tag.s) S.scene.remove(tag.s); tag.s = label(CAB.FORM[f], { size: 0.26 }); tag.s.position.set(0, -1.45, 0); S.scene.add(tag.s);
  }
  S.onFrame((t, dt) => {
    S.orbit(Math.max(5.4, 7.6 / Math.max(0.8, S.camera.aspect)), 0);
    if (!RM()) host.rotation.y = Math.sin(t * 0.5) * 0.25;
    const nH = Math.max(0, Math.min(16, Math.round((7 - curPh) * 2.6))), nOH = Math.max(0, Math.min(10, Math.round((curPh - 8) * 2)));
    let iH = 0, iO = 0;
    pool.forEach(m => { const u = m.userData, show = u.kind === 'H' ? iH++ < nH : iO++ < nOH; m.visible = show; if (!show) return; if (!RM()) u.a += dt * u.v * 0.5; m.position.set(Math.cos(u.a) * u.r, u.y + Math.sin(t + u.a) * 0.05, Math.sin(u.a) * u.r * 0.6); });
  });
  const o = { set(ph) { curPh = ph; const f = CAB.form(ph); halo.material.color.copy(col3(ph)); if (f !== form) { form = f; build(f); } } };
  o.set(7); return o;
}

EF.K3 = { L0, mol };
