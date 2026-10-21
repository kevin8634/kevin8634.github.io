/* 元素工坊 Element Forge · crystal 任务 3D 玩法 ef-crystal3d.js v0.4.1
   「晶体为什么那么整齐?」四关:尺度镜看盐、搭离子格子、烧杯里慢长快长、晶面角度与雪花六角。
   几何:NaCl 岩盐结构(面心立方),Na–Cl 间距 2.82 Å,配位数 6;离子半径 Cl⁻(1.81 Å)> Na⁺(1.02 Å)。
   冰为六方冰 Ih,雪花形态随温度/湿度变化只做定性(参照中谷宇吉郎雪晶图)。
   关卡判定、提示、三星由 ef.js 负责;低档或这里出错时回落 crystal/index.html 里的平面版。 */
import { THREE } from './ef-gl.js?v=2';
const EF = window.EF;
const ease = x => x < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x);
const RM = () => EF.reduced;
const K = 0.27;                                   /* 1 Å → 0.27 场景单位 */
const D = 2.82 * K;                               /* Na–Cl 最近距离 */
const R_NA = 1.02 * K * 0.62, R_CL = 1.81 * K * 0.62;
const C_NA = 0xb48cff, C_CL = 0x7be08a, C_ICE = 0xcfefff;
const NA = 'Na', CL = 'Cl';
const ionMat = t => new THREE.MeshStandardMaterial({ color: t === NA ? C_NA : C_CL, roughness: 0.35, metalness: 0.1, emissive: t === NA ? 0x2a1450 : 0x123a18, emissiveIntensity: 0.6 });
const iceMat = (op = 0.85) => new THREE.MeshStandardMaterial({ color: C_ICE, roughness: 0.15, metalness: 0.05, emissive: 0x2a6a8a, emissiveIntensity: 0.55, transparent: true, opacity: op });
const saltMat = () => new THREE.MeshStandardMaterial({ color: 0xf4f1ea, roughness: 0.25, metalness: 0, emissive: 0x1a2430, emissiveIntensity: 0.4, transparent: true, opacity: 0.92 });
function edges(geo, col = 0xbfe9ff, op = 0.9) { return new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: op })); }
function legend(wrap, items) { const d = document.createElement('div'); d.className = 's3d-leg'; d.innerHTML = items.map(i => '<span><i style="background:' + i[0] + '"></i>' + i[1] + '</span>').join(''); wrap.appendChild(d); return d; }
function note(parent, html) { const p = document.createElement('p'); p.className = 'note-sm'; p.innerHTML = html || ''; parent.appendChild(p); return p; }
function pickObj(rc, list) { const h = rc.intersectObjects(list, false)[0]; return h ? h.object : null; }

function stage3d(parent, opt = {}) {
  const h = opt.h || (EF.mobile ? 320 : 380);
  document.body.classList.add('stage3d');
  const wrap = document.createElement('div'); wrap.className = 's3d'; wrap.style.height = h + 'px'; parent.appendChild(wrap);
  const renderer = new THREE.WebGLRenderer({ antialias: EF.glTier === 'high', alpha: true });
  renderer.setPixelRatio(EF.dpr()); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.setClearColor(0x000000, 0);
  wrap.appendChild(renderer.domElement);
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(opt.fov || 40, 1, 0.05, 200);
  scene.add(new THREE.AmbientLight(0xb0a8b8, 1.1));
  const key = new THREE.DirectionalLight(0xfff0dd, 2.4); key.position.set(3, 5, 4); scene.add(key);
  const rim = new THREE.DirectionalLight(0x7ad7ff, 0.9); rim.position.set(-4, 1, -3); scene.add(rim);
  const o = { wrap, renderer, scene, camera, cbs: [], yaw: opt.yaw || 0.6, pitch: opt.pitch || 0.3, drag: opt.drag !== false, onPick: null, onDrag: null, auto: !RM() };
  function rs() { const w = wrap.clientWidth || 600, hh = wrap.clientHeight || h; renderer.setSize(w, hh, false); camera.aspect = w / hh; camera.updateProjectionMatrix(); }
  rs(); const ro = window.ResizeObserver ? new ResizeObserver(rs) : null; if (ro) ro.observe(wrap); else addEventListener('resize', rs);
  let down = null;
  wrap.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY, yaw: o.yaw, pitch: o.pitch, moved: 0 }; wrap.setPointerCapture && wrap.setPointerCapture(e.pointerId); });
  wrap.addEventListener('pointermove', e => {
    if (!down) return; const dx = e.clientX - down.x, dy = e.clientY - down.y; down.moved = Math.max(down.moved, Math.hypot(dx, dy));
    if (o.drag && down.moved > 6) { o.auto = false; o.yaw = down.yaw + dx * 0.009; o.pitch = Math.max(-1.2, Math.min(1.2, down.pitch + dy * 0.007)); }
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
    if (o.auto) o.yaw += dt * 0.18;
    for (const f of o.cbs) f(now / 1000, dt);
    renderer.render(scene, camera);
  }
  o.onFrame = f => o.cbs.push(f);
  /* 绕原点的轨道相机 */
  o.orbit = (dist, ty = 0) => { camera.position.set(Math.sin(o.yaw) * Math.cos(o.pitch) * dist, Math.sin(o.pitch) * dist + ty, Math.cos(o.yaw) * Math.cos(o.pitch) * dist); camera.lookAt(0, ty, 0); };
  requestAnimationFrame(frame);
  return o;
}
function label(text, opt = {}) {
  const fs = 44, c = document.createElement('canvas'), x = c.getContext('2d'), F = '700 ' + fs + 'px system-ui,"PingFang SC","Noto Sans SC",sans-serif';
  x.font = F; const w = Math.ceil(x.measureText(text).width) + 30; c.width = w; c.height = fs + 22; x.font = F; x.textAlign = 'center'; x.textBaseline = 'middle';
  if (opt.bg !== false) { x.fillStyle = 'rgba(10,12,26,.78)'; x.beginPath(); x.roundRect ? x.roundRect(1, 1, w - 2, c.height - 2, 14) : x.rect(1, 1, w - 2, c.height - 2); x.fill(); x.strokeStyle = 'rgba(255,179,92,.6)'; x.lineWidth = 2; x.stroke(); }
  x.fillStyle = opt.color || '#f4ede1'; x.fillText(text, w / 2, c.height / 2 + 2);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false, depthWrite: false }));
  const k = (opt.size || 0.2) / c.height; s.scale.set(w * k, c.height * k, 1); s.renderOrder = 5; return s;
}
function seg(parent, items, on) {
  const d = document.createElement('div'); d.className = 'ctl'; d.innerHTML = '<div class="seg">' + items.map((it, i) => '<button data-k="' + it[0] + '"' + (i === 0 ? ' class="on"' : '') + '>' + it[1] + '</button>').join('') + '</div>' + (on.pill ? '<span class="pill">' + on.pill + '</span>' : '');
  parent.appendChild(d);
  d.querySelectorAll('.seg button').forEach(b => b.onclick = () => { d.querySelectorAll('.seg button').forEach(x => x.classList.toggle('on', x === b)); on.fn(b.dataset.k); });
  return d;
}


/* NaCl 立方格子:n×n×n,(i+j+k) 奇偶决定钠/氯 */
function ionGrid(n, seedNa = 1) {
  const g = new THREE.Group(), list = [], h = (n - 1) / 2;
  const gNa = new THREE.SphereGeometry(R_NA, 20, 14), gCl = new THREE.SphereGeometry(R_CL, 22, 16), mNa = ionMat(NA), mCl = ionMat(CL);
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) for (let k = 0; k < n; k++) {
    const t = ((i + j + k) % 2 === seedNa) ? NA : CL, m = new THREE.Mesh(t === NA ? gNa : gCl, t === NA ? mNa : mCl);
    m.position.set((i - h) * D, (j - h) * D, (k - h) * D); m.userData = { t, i, j, k }; g.add(m); list.push(m);
  }
  return { g, list };
}

/* ---------- L0 尺度镜:盐粒为什么是小方块? ---------- */
function L0(stage, api) {
  const S = stage3d(stage, { yaw: 0.7, pitch: 0.45 });
  const ctl = seg(stage, [['pile', '一撮食盐'], ['cube', '放大镜下'], ['ions', '离子尺度']], { fn: k => go(k), pill: '拖动可旋转' });
  const msg = note(stage, '先看桌上这撮盐。切到更高的放大倍数,最后点一颗钠离子、一颗氯离子。');
  const leg = legend(S.wrap, [['#b48cff', 'Na⁺ 钠离子(小)'], ['#7be08a', 'Cl⁻ 氯离子(大)']]); leg.style.display = 'none';
  /* 一撮盐:一堆大小不一的小立方体 */
  const pile = new THREE.Group(), sm = saltMat();
  for (let i = 0; i < 70; i++) { const s = 0.08 + Math.random() * 0.1, b = new THREE.Mesh(new THREE.BoxGeometry(s, s, s), sm); const a = Math.random() * 6.28, r = Math.pow(Math.random(), 0.7) * 0.9; b.position.set(Math.cos(a) * r, s / 2 + (0.9 - r) * 0.35 * Math.random(), Math.sin(a) * r); b.rotation.set(Math.random() * 0.6, Math.random() * 6.28, Math.random() * 0.6); pile.add(b); }
  const table = new THREE.Mesh(new THREE.CircleGeometry(1.6, 48), new THREE.MeshStandardMaterial({ color: 0x2a2230, roughness: 0.9 })); table.rotation.x = -Math.PI / 2; pile.add(table);
  /* 放大镜下:一颗有平整晶面的盐晶 */
  const cube = new THREE.Group(), cg = new THREE.BoxGeometry(1.3, 1.3, 1.3); cube.add(new THREE.Mesh(cg, saltMat()), edges(cg));
  const step = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.25, 0.5), saltMat()); step.position.set(0.25, 0.775, 0.25); cube.add(step);
  /* 离子尺度 */
  const ions = ionGrid(4); const box = edges(new THREE.BoxGeometry(D * 3, D * 3, D * 3), 0xffb35c, 0.35); ions.g.add(box);
  const tag = label('', {}); tag.visible = false; ions.g.add(tag);
  const all = { pile, cube, ions: ions.g }; Object.values(all).forEach(o => { o.visible = false; S.scene.add(o); });
  let cur = 'pile', k0 = 0, seen = {}; const dist = { pile: 4.2, cube: 3.8, ions: 5.4 };
  function go(k) { cur = k; k0 = 0; EF.play('whoosh'); leg.style.display = k === 'ions' ? '' : 'none';
    msg.innerHTML = k === 'pile' ? '桌上的一撮食盐:一粒粒,有大有小。' : k === 'cube' ? '放大镜下,大多数盐粒都是带棱角的<b>小立方块</b>,晶面平得像切过一样。' : '放大到离子:<b>钠离子</b>和<b>氯离子</b>一个隔一个,排成立方格子。点一点它们。'; }
  S.onPick = rc => {
    if (cur !== 'ions') return; const o = pickObj(rc, ions.list); if (!o) return;
    const t = o.userData.t; seen[t] = 1; EF.tone(t === NA ? 11 : 17); EF.play('select');
    tag.visible = true; tag.material.map.dispose(); const nt = label(t === NA ? 'Na⁺ 钠离子 · 11 号' : 'Cl⁻ 氯离子 · 17 号', { size: 0.16 }); tag.material = nt.material; tag.scale.copy(nt.scale); tag.position.copy(o.position).add(new THREE.Vector3(0, 0.32, 0));
    if (seen[NA] && seen[CL]) { msg.innerHTML = '两种离子都认识了:小立方块的棱角,来自里面这套<b>立方格子</b>。'; setTimeout(api.complete, 900); }
    else msg.innerHTML = '再点一颗' + (seen[NA] ? '<b>氯离子</b>(大绿球)' : '<b>钠离子</b>(小紫球)') + '。';
  };
  S.onFrame((t, dt) => {
    k0 = Math.min(1, k0 + dt * 2);
    for (const k in all) { const o = all[k]; o.visible = k === cur; if (k === cur) o.scale.setScalar(0.6 + 0.4 * ease(k0)); }
    S.orbit(dist[cur], cur === 'pile' ? 0.2 : 0);
  });
  go('pile');
}

/* ---------- L1 搭格子:谁挨着谁? ---------- */
function L1(stage, api) {
  const S = stage3d(stage, { yaw: 0.75, pitch: 0.42 });
  let hand = NA;
  const ctl = seg(stage, [[NA, '放 Na⁺'], [CL, '放 Cl⁻']], { fn: k => { hand = k; EF.play('tick'); }, pill: '点亮着的空位放离子' });
  const auto = document.createElement('button'); auto.className = 'ef-btn'; auto.textContent = '按同样规则,让它长满'; auto.hidden = true; ctl.appendChild(auto);
  const msg = note(stage, '中间已有一颗钠离子当"晶种"。在它旁边的空位放离子,看看谁和谁合得来。');
  legend(S.wrap, [['#b48cff', 'Na⁺'], ['#7be08a', 'Cl⁻']]);
  const need = (i, j, k) => ((i + j + k) % 2 === 1) ? NA : CL;     /* 中心 (1,1,1) 为钠 */
  const gNa = new THREE.SphereGeometry(R_NA, 20, 14), gCl = new THREE.SphereGeometry(R_CL, 22, 16), mNa = ionMat(NA), mCl = ionMat(CL);
  const ghostG = new THREE.BoxGeometry(D * 0.55, D * 0.55, D * 0.55), ghostM = new THREE.MeshBasicMaterial({ color: 0xffb35c, transparent: true, opacity: 0.16, depthWrite: false });
  const bondM = new THREE.MeshStandardMaterial({ color: 0xffc46b, emissive: 0x7a3a08, emissiveIntensity: 1, transparent: true, opacity: 0.85 });
  const cells = {}, ghosts = [], ions = [], flying = []; let placed = 0, full = false, busy = false;
  const key = (i, j, k) => i + ',' + j + ',' + k, P = (i, j, k) => new THREE.Vector3((i - 1) * D, (j - 1) * D, (k - 1) * D);
  const NB = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
  const inside = (i, j, k) => i >= 0 && j >= 0 && k >= 0 && i < 3 && j < 3 && k < 3;
  const frame = edges(new THREE.BoxGeometry(D * 2.6, D * 2.6, D * 2.6), 0x6a7088, 0.35); S.scene.add(frame);
  function put(i, j, k, t, quiet) {
    const m = new THREE.Mesh(t === NA ? gNa : gCl, t === NA ? mNa : mCl); m.position.copy(P(i, j, k)); m.userData = { t, i, j, k, born: performance.now() };
    S.scene.add(m); ions.push(m); cells[key(i, j, k)] = m;
    NB.forEach(d => { const o = cells[key(i + d[0], j + d[1], k + d[2])]; if (!o) return;
      const a = m.position, b = o.position, c = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, a.distanceTo(b), 6), bondM);
      c.position.copy(a).add(b).multiplyScalar(0.5); c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()); S.scene.add(c); });
    if (!quiet) { EF.tone(t === NA ? 11 : 17, 0, 0.8); }
    refresh();
  }
  function refresh() {
    ghosts.forEach(g => S.scene.remove(g)); ghosts.length = 0;
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) for (let k = 0; k < 3; k++) {
      if (cells[key(i, j, k)]) continue;
      if (!NB.some(d => cells[key(i + d[0], j + d[1], k + d[2])])) continue;
      const g = new THREE.Mesh(ghostG, ghostM); g.position.copy(P(i, j, k)); g.userData = { i, j, k }; S.scene.add(g); ghosts.push(g);
    }
  }
  put(1, 1, 1, NA, true);
  S.onPick = rc => {
    if (busy) return;
    if (full) {
      const o = pickObj(rc, ions); if (!o) return; const u = o.userData;
      if (u.i === 1 && u.j === 1 && u.k === 1) {
        busy = true; EF.play('fuse'); const nb = NB.map(d => cells[key(1 + d[0], 1 + d[1], 1 + d[2])]);
        nb.forEach((m, n) => setTimeout(() => { m.scale.setScalar(1.35); EF.tone(17, 0, 0.6); }, n * 180));
        setTimeout(() => { const lb = label('贴着它的 Cl⁻:6 个', { size: 0.18 }); lb.position.set(0, D * 1.9, 0); S.scene.add(lb); msg.innerHTML = '中心的钠离子被 <b>6 个</b>氯离子包围:上下、左右、前后各一个。每颗离子都一样——同一个规则一遍遍重复。'; setTimeout(api.complete, 1000); }, 1250);
      } else { EF.play('tick'); msg.innerHTML = '点<b>正中间</b>那颗钠离子(小紫球)。可以拖动转一转。'; }
      return;
    }
    const g = pickObj(rc, ghosts); if (!g) return; const { i, j, k } = g.userData;
    if (hand !== need(i, j, k)) {          /* 同号相邻:被推开 */
      const m = new THREE.Mesh(hand === NA ? gNa : gCl, (hand === NA ? mNa : mCl).clone()); m.material.transparent = true; m.position.copy(g.position);
      const dir = g.position.clone().normalize(); if (dir.lengthSq() < 0.01) dir.set(0, 1, 0); m.userData.v = dir.multiplyScalar(2.2); m.userData.life = 1; S.scene.add(m); flying.push(m);
      EF.tone(hand === NA ? 4 : 5, 0, 0.9); EF.play('tick');
      msg.innerHTML = '被推开了!它旁边已经有<b>同号</b>离子:' + (hand === NA ? '正对正' : '负对负') + ',互相排斥。'; return;
    }
    put(i, j, k, hand); placed++; EF.play('select');
    msg.innerHTML = '吸住了!' + (hand === NA ? '钠离子(+)' : '氯离子(−)') + '只和异号离子贴在一起。已放 <b>' + placed + '</b> 颗。';
    if (placed >= 8 && !full) auto.hidden = false;
  };
  auto.onclick = () => {
    auto.disabled = true; busy = true; const rest = [];
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) for (let k = 0; k < 3; k++) if (!cells[key(i, j, k)]) rest.push([i, j, k]);
    rest.sort((a, b) => (Math.abs(a[0] - 1) + Math.abs(a[1] - 1) + Math.abs(a[2] - 1)) - (Math.abs(b[0] - 1) + Math.abs(b[1] - 1) + Math.abs(b[2] - 1)));
    rest.forEach((c, n) => setTimeout(() => { put(c[0], c[1], c[2], need(c[0], c[1], c[2]), n % 3); if (n === rest.length - 1) { full = true; busy = false; ghosts.forEach(g => S.scene.remove(g)); ghosts.length = 0; ctl.querySelector('.seg').style.display = 'none'; auto.hidden = true;
      msg.innerHTML = '长满了,而且只有这<b>一种</b>排法。现在点正中间那颗钠离子:数数它周围贴着几个氯离子。'; } }, RM() ? 0 : n * 90));
  };
  S.onFrame((t, dt) => {
    ghostM.opacity = 0.12 + 0.1 * Math.sin(t * 4);
    ions.forEach(m => { const a = Math.min(1, (performance.now() - m.userData.born) / 260); if (m.scale.x < 1.3) m.scale.setScalar(0.4 + 0.6 * ease(a)); });
    for (let n = flying.length - 1; n >= 0; n--) { const m = flying[n]; m.position.addScaledVector(m.userData.v, dt); m.userData.life -= dt * 1.4; m.material.opacity = Math.max(0, m.userData.life); if (m.userData.life <= 0) { S.scene.remove(m); flying.splice(n, 1); } }
    S.orbit(4.6);
  });
}

/* ---------- L2 慢长与快长:大晶体怎么来? ---------- */
function L2(stage, api) {
  const S = stage3d(stage, { yaw: 0.35, pitch: 0.28 });
  const ctl = document.createElement('div'); ctl.className = 'ctl';
  ctl.innerHTML = '<span>蒸发速度</span><input type="range" min="1" max="10" value="7" id="sp"><output id="so"></output><button class="ef-btn" id="go">开始结晶</button>';
  stage.appendChild(ctl); const msg = note(stage, '烧杯里是饱和的浓盐水。速度调慢或调快,长出一颗<b>超过金色刻度框</b>的大晶体。');
  note(stage, '<span style="color:#7ad7ff">现实里也能试:</span>食盐溶进热水(热水请大人帮忙),倒进浅碟,放在小朋友和宠物碰不到的窗台慢慢晾干,几天后能看到小立方晶。实验液不要食用。');
  const sp = ctl.querySelector('#sp'), so = ctl.querySelector('#so'), btn = ctl.querySelector('#go');
  const sync = () => { const v = +sp.value; so.textContent = v <= 2 ? '很慢' : v <= 4 ? '偏慢' : v <= 7 ? '偏快' : '很快'; }; sp.oninput = sync; sync();
  /* 烧杯 + 溶液 + 溶解的离子 */
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1.8, 48, 1, true), new THREE.MeshStandardMaterial({ color: 0xbfe9ff, transparent: true, opacity: 0.14, side: THREE.DoubleSide, roughness: 0.05 }));
  glass.position.y = 0.9; S.scene.add(glass, edges(new THREE.CylinderGeometry(1, 1, 1.8, 48, 1, true), 0xbfe9ff, 0.2).translateY(0.9));
  const bottom = new THREE.Mesh(new THREE.CircleGeometry(1, 48), new THREE.MeshStandardMaterial({ color: 0x24303f, roughness: 0.6 })); bottom.rotation.x = -Math.PI / 2; bottom.position.y = 0.005; S.scene.add(bottom);
  const liquid = new THREE.Mesh(new THREE.CylinderGeometry(0.97, 0.97, 1.3, 48), new THREE.MeshStandardMaterial({ color: 0x5aa0e0, transparent: true, opacity: 0.18, depthWrite: false })); liquid.position.y = 0.66; S.scene.add(liquid);
  const NP = EF.glTier === 'high' ? 420 : 210, pp = new Float32Array(NP * 3), vel = [];
  for (let i = 0; i < NP; i++) { const a = Math.random() * 6.28, r = Math.sqrt(Math.random()) * 0.9; pp.set([Math.cos(a) * r, 0.05 + Math.random() * 1.2, Math.sin(a) * r], i * 3); vel.push([(Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.4]); }
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pp, 3)); pg.setDrawRange(0, NP);
  S.scene.add(new THREE.Points(pg, new THREE.PointsMaterial({ color: 0xe8dcff, size: 0.035, transparent: true, opacity: 0.8, depthWrite: false })));
  /* 目标刻度框(金色线框) */
  const TARGET = 0.46, tgt = edges(new THREE.BoxGeometry(TARGET, TARGET, TARGET), 0xffc46b, 0.9); tgt.position.set(1.65, TARGET / 2, 0); S.scene.add(tgt);
  const tl = label('目标', { size: 0.13, color: '#ffc46b' }); tl.position.set(1.65, TARGET + 0.18, 0); S.scene.add(tl);
  let xs = [], t0 = -1, dur = 4, running = false;
  btn.onclick = () => {
    if (running) return; running = true; btn.disabled = true; xs.forEach(c => S.scene.remove(c)); xs = [];
    const v = +sp.value, N = Math.min(60, Math.round(1 + (v - 1) * (v - 1) * 0.9)), w = []; let sum = 0;
    for (let i = 0; i < N; i++) { const q = 0.7 + Math.random() * 0.6; w.push(q); sum += q; }
    const VOL = 0.2;                                         /* 溶质总量(体积单位)守恒:分给越多晶核,每颗越小 */
    w.forEach(q => { const e = Math.cbrt(VOL * q / sum), m = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), saltMat()); m.add(edges(new THREE.BoxGeometry(1, 1, 1), 0xffffff, 0.5));
      const a = Math.random() * 6.28, r = Math.sqrt(Math.random()) * Math.max(0, 0.85 - e / 2); m.position.set(N === 1 ? 0 : Math.cos(a) * r, 0, N === 1 ? 0 : Math.sin(a) * r); m.rotation.y = Math.random() * 1.57; m.userData.e = e; m.scale.setScalar(0.001); S.scene.add(m); xs.push(m); });
    dur = RM() ? 0.01 : 2.5 + (11 - v) * 0.45; t0 = performance.now(); EF.play('slide');
    msg.innerHTML = '水在一点点蒸发,盐水越来越浓……<b>' + N + '</b> 个晶核出现了。';
  };
  S.onFrame((t, dt) => {
    let k = 0; if (t0 > 0) k = Math.min(1, (performance.now() - t0) / 1000 / dur);
    xs.forEach(m => { const e = m.userData.e * ease(k); m.scale.setScalar(Math.max(0.001, e)); m.position.y = e / 2; });
    pg.setDrawRange(0, Math.round(NP * (1 - 0.85 * ease(k))));
    for (let i = 0; i < NP; i++) { for (let a = 0; a < 3; a++) { let p = pp[i * 3 + a] + vel[i][a] * dt; if (a === 1 ? (p < 0.03 || p > 1.28) : Math.abs(p) > 0.9) { vel[i][a] *= -1; p = pp[i * 3 + a]; } pp[i * 3 + a] = p; } }
    pg.attributes.position.needsUpdate = true;
    if (running && k >= 1) {
      running = false; btn.disabled = false; const big = Math.max(...xs.map(m => m.userData.e)), mm = (big * 20).toFixed(0);
      if (big >= TARGET) { EF.play('fuse'); EF.tone(11); msg.innerHTML = '成功!只有 ' + xs.length + ' 个晶核,溶解的离子都排到它们身上,最大一颗边长约 <b>' + mm + ' 毫米</b>。慢,才长得大。'; setTimeout(api.complete, 1000); }
      else { EF.play('tick'); msg.innerHTML = '满杯 ' + xs.length + ' 颗小晶粒,最大的只有约 ' + mm + ' 毫米,没到金框。'; if (xs.length > 6) api.say('同样多的盐,被分给了好多晶核。怎样才能让晶核少一点?'); }
    }
    S.orbit(4.4, 0.6);
  });
}

/* ---------- L3 晶面的角度 · 雪花六角 ---------- */
function snowflake(T, wet) {
  /* 中谷图(定性):0~-4 ℃ 薄片;-4~-10 ℃ 柱/针;-10~-22 ℃ 片状,湿度高且约 -12~-17 ℃ 为星状枝晶;< -22 ℃ 柱状 */
  const g = new THREE.Group(), m = iceMat(0.88);
  let type;
  if (T > -4) type = 'plate'; else if (T > -10) type = wet ? 'needle' : 'column'; else if (T > -22) type = (wet && T <= -12 && T >= -17) ? 'dendrite' : wet ? 'sector' : 'plate'; else type = 'column';
  const arm = (len, w, a, x0 = 0, y0 = 0) => { const b = new THREE.Mesh(new THREE.BoxGeometry(len, w, 0.03), m); b.position.set(x0 + Math.cos(a) * len / 2, y0 + Math.sin(a) * len / 2, 0); b.rotation.z = a; g.add(b); };
  if (type === 'plate') { const h = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.04, 6), m); h.rotation.x = Math.PI / 2; h.rotation.y = Math.PI / 6; g.add(h, edges(h.geometry, 0xffffff, 0.6).rotateX(Math.PI / 2)); }
  else if (type === 'sector') { const h = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.04, 6), m); h.rotation.x = Math.PI / 2; g.add(h); for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; arm(1.05, 0.12, a); const f = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.03, 3), m); f.rotation.x = Math.PI / 2; f.rotation.y = -a + Math.PI / 2; f.position.set(Math.cos(a) * 0.72, Math.sin(a) * 0.72, 0); g.add(f); } }
  else if (type === 'dendrite') { for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; arm(1.25, 0.07, a); for (let s = 1; s <= 4; s++) { const r = s * 0.25, L = 0.42 - s * 0.07, x0 = Math.cos(a) * r, y0 = Math.sin(a) * r; arm(L, 0.045, a + Math.PI / 3, x0, y0); arm(L, 0.045, a - Math.PI / 3, x0, y0);
    if (s <= 2) { const x1 = x0 + Math.cos(a + Math.PI / 3) * L * 0.6, y1 = y0 + Math.sin(a + Math.PI / 3) * L * 0.6, x2 = x0 + Math.cos(a - Math.PI / 3) * L * 0.6, y2 = y0 + Math.sin(a - Math.PI / 3) * L * 0.6; arm(0.12, 0.03, a, x1, y1); arm(0.12, 0.03, a, x2, y2); } } } const c = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.04, 6), m); c.rotation.x = Math.PI / 2; g.add(c); }
  else { const long = type === 'needle', c = new THREE.Mesh(new THREE.CylinderGeometry(long ? 0.09 : 0.26, long ? 0.09 : 0.26, long ? 1.8 : 1.0, 6), m); c.rotation.z = Math.PI / 2.6; c.rotation.x = 0.4; g.add(c); const e = edges(c.geometry, 0xffffff, 0.6); e.rotation.copy(c.rotation); g.add(e); }
  return { g, type };
}
const SNOW = { plate: '六角薄片', sector: '扇形六角板', dendrite: '星状枝晶(最繁茂的六角雪花)', column: '六角短柱', needle: '细长冰针' };
function L3(stage, api) {
  const S = stage3d(stage, { yaw: 0.6, pitch: 0.35 });
  const msg = note(stage, '三颗大小不同的盐晶。依次点一点,量一量相邻两个晶面的夹角。');
  const ctl = document.createElement('div'); ctl.className = 'ctl'; ctl.hidden = true;
  ctl.innerHTML = '<span>温度</span><input type="range" min="-25" max="-1" value="-3" id="tt"><output id="to"></output><div class="seg"><button data-w="0" class="on">水汽少</button><button data-w="1">水汽多</button></div><button class="ef-btn" id="grow">长一片雪花</button>';
  stage.appendChild(ctl);
  const part = { a: new THREE.Group(), b: new THREE.Group() }; S.scene.add(part.a, part.b); part.b.visible = false;
  const sizes = [0.35, 0.7, 1.1], xs = [-1.35, -0.25, 1.15], cubes = [], done = {};
  sizes.forEach((s, i) => { const gm = new THREE.BoxGeometry(s, s, s), c = new THREE.Mesh(gm, saltMat()); c.add(edges(gm)); c.position.set(xs[i], s / 2 - 0.4, 0); c.rotation.y = 0.5; c.userData.i = i; part.a.add(c); cubes.push(c); });
  S.onPick = rc => {
    if (!part.a.visible) return; const o = pickObj(rc, cubes); if (!o) return; const i = o.userData.i; if (done[i]) return; done[i] = 1;
    const s = sizes[i], arc = new THREE.Mesh(new THREE.RingGeometry(s * 0.28, s * 0.32, 24, 1, 0, Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xffc46b, side: THREE.DoubleSide, depthTest: false }));
    arc.position.set(-s / 2, -s / 2, s / 2 + 0.002); o.add(arc); const lb = label('90°', { size: 0.15, color: '#ffc46b' }); lb.position.set(0, s / 2 + 0.2, 0); o.add(lb);
    EF.play('select'); EF.tone(11 + i * 3);
    const n = Object.keys(done).length;
    if (n < 3) msg.innerHTML = '这颗:<b>90°</b>。再量 ' + (3 - n) + ' 颗。';
    else { msg.innerHTML = '大小不同,夹角都是 <b>90°</b>——这就是 1669 年斯泰诺发现的"晶面夹角守恒"。'; setTimeout(toSnow, 1600); }
  };
  let wet = 0, flake = null, gt = 0, tried = {};
  const tt = ctl.querySelector('#tt'), to = ctl.querySelector('#to'); const syncT = () => to.textContent = tt.value + ' ℃'; tt.oninput = syncT; syncT();
  ctl.querySelectorAll('.seg button').forEach(b => b.onclick = () => { wet = +b.dataset.w; ctl.querySelectorAll('.seg button').forEach(x => x.classList.toggle('on', x === b)); EF.play('tick'); });
  function toSnow() {
    part.a.visible = false; part.b.visible = true; ctl.hidden = false; S.yaw = 0; S.pitch = 0; S.auto = false; EF.play('whoosh');
    msg.innerHTML = '换成冰:水分子靠氢键排成<b>六边形</b>格子。调温度和湿度,长出一片<b>最繁茂的星状雪花</b>。';
  }
  ctl.querySelector('#grow').onclick = () => {
    if (flake) part.b.remove(flake.g); flake = snowflake(+tt.value, wet); part.b.add(flake.g); gt = RM() ? 1 : 0; tried[flake.type] = 1;
    EF.play('slide'); EF.tone(8, 0, 0.7);
    msg.innerHTML = tt.value + ' ℃、水汽' + (wet ? '多' : '少') + ':长成了<b>' + SNOW[flake.type] + '</b>。无论哪种,都是六重对称。';
    if (flake.type === 'dendrite') { EF.play('fuse'); setTimeout(api.complete, 1400); }
    else if (Object.keys(tried).length >= 3) api.say('枝杈要繁茂,空气里得有足够多的水汽。温度大概在零下十几度试试?');
  };
  S.onFrame((t, dt) => {
    if (flake) { gt = Math.min(1, gt + dt * 0.6); flake.g.scale.setScalar(0.05 + 0.95 * ease(gt)); flake.g.rotation.z = RM() ? 0 : t * 0.15; }
    if (part.b.visible) S.orbit(3.2); else S.orbit(3.6, 0);
  });
}

EF.X3 = { L0, L1, L2, L3 };
