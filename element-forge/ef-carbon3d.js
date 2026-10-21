/* 元素工坊 Element Forge · carbon 任务玩法 3D 化 ef-carbon3d.js v0.3.2
   「为什么钻石和铅笔芯是同一种东西?」四关的动手部分搬进 3D:尺度镜、数键、刮一刮、压机。
   晶格几何沿用 carbon/index.html(金刚石键长 1.545 Å、四面体;石墨层内 1.42 Å、层距 3.35 Å)。
   关卡判定、提示、三星仍由 ef.js 负责;低档或这里出错时回落 v0.3 平面版。 */
import { THREE } from './ef-gl.js?v=2';
const EF = window.EF;
const ease = x => x < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x);
const RM = () => EF.reduced;
const K = 0.27;                       /* 1 Å → 0.27 场景单位 */
const C_ATOM = new THREE.Color(0xa89a86), C_SEL = new THREE.Color(0xffb35c), C_NB = new THREE.Color(0xffe2b0);
const C_BOND = new THREE.Color(0x8c7f6c), C_HOT = new THREE.Color(0xffc46b);

/* ---------- 公共舞台(同 ef-stars3d 的约定:拖动旋转、点按拾取、离开页面即释放) ---------- */
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

/* ---------- 晶格(与 2D 版同一套坐标) ---------- */
function finish(A, d) {
  const Bd = []; let c = 0, best = 1e9;
  for (let i = 0; i < A.length; i++) { const r = Math.hypot(A[i].x, A[i].y, A[i].z); if (r < best) { best = r; c = i; } for (let j = i + 1; j < A.length; j++) if (A[i].L === A[j].L && Math.abs(Math.hypot(A[i].x - A[j].x, A[i].y - A[j].y, A[i].z - A[j].z) - d) < 0.08) Bd.push([i, j]); }
  return { atoms: A, bonds: Bd, center: c };
}
function diamond(R = 4.3) {
  const a = 3.567, B = [[0, 0, 0], [0, .5, .5], [.5, 0, .5], [.5, .5, 0]], A = [];
  for (let i = -2; i <= 1; i++) for (let j = -2; j <= 1; j++) for (let k = -2; k <= 1; k++)
    B.forEach(b => [[0, 0, 0], [.25, .25, .25]].forEach(o => { const p = [(i + b[0] + o[0]) * a, (j + b[1] + o[1]) * a, (k + b[2] + o[2]) * a]; if (Math.hypot(p[0], p[1], p[2]) < R) A.push({ x: p[0], y: p[1], z: p[2], L: 0 }); }));
  return finish(A, 1.545);
}
function graphite(R = 4.6) {
  const A = [], a1 = [2.46, 0], a2 = [1.23, 2.1304];
  [-1, 0, 1].forEach(L => {
    const off = (L % 2 === 0) ? [0, 0] : [1.23, 0.7101];
    for (let i = -5; i <= 5; i++) for (let j = -5; j <= 5; j++) [[0, 0], [1.23, 0.7101]].forEach(b => {
      const x = i * a1[0] + j * a2[0] + b[0] + off[0], y = i * a1[1] + j * a2[1] + b[1] + off[1];
      if (Math.hypot(x, y) < R) A.push({ x, y: -L * 3.35, z: y, L });
    });
  });
  return finish(A, 1.42);
}
const DIA = diamond(), GRA = graphite();

/* 3D 晶格:原子、键都用 InstancedMesh;支持选中高亮、层平移、层距压缩、整体抖动 */
function Lattice(S, opt = {}) {
  const g = new THREE.Group(), n = S.atoms.length, m = S.bonds.length;
  const aM = new THREE.InstancedMesh(new THREE.SphereGeometry(0.42 * K, 18, 14), new THREE.MeshStandardMaterial({ roughness: 0.4, metalness: 0.15, emissive: 0x1a1008 }), n);
  const bM = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.11 * K, 0.11 * K, 1, 8, 1), new THREE.MeshStandardMaterial({ roughness: 0.6 }), Math.max(1, m));
  g.add(aM, bM);
  const L = { g, S, aM, bM, sel: -1, shift: 0, squeeze: 1, shake: 0, heat: 0, pos: S.atoms.map(() => new THREE.Vector3()) };
  L.nb = i => { const r = []; S.bonds.forEach(b => { if (b[0] === i) r.push(b[1]); else if (b[1] === i) r.push(b[0]); }); return r; };
  const M = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), d = new THREE.Vector3(), sc = new THREE.Vector3(), hc = new THREE.Color();
  L.update = (t = 0) => {
    const nb = L.nb(L.sel), sh = L.shake * Math.sin(t * 40);
    S.atoms.forEach((a, i) => {
      const j = L.heat > 0.02 && !RM() ? L.heat * 0.18 : 0;
      L.pos[i].set((a.x + (a.L === -1 ? L.shift : 0) + sh + (j ? Math.sin(t * 23 + i * 1.7) * j : 0)) * K, a.y * L.squeeze * K + (j ? Math.cos(t * 19 + i) * j * K : 0), a.z * K);
      M.makeTranslation(L.pos[i].x, L.pos[i].y, L.pos[i].z); M.scale(sc.setScalar(i === L.sel ? 1.25 : 1)); aM.setMatrixAt(i, M);
      const c = i === L.sel ? C_SEL : nb.includes(i) ? C_NB : C_ATOM; hc.copy(c); if (L.heat > 0) hc.lerp(C_SEL, L.heat * 0.6); aM.setColorAt(i, hc);
    });
    S.bonds.forEach((b, k) => {
      const p = L.pos[b[0]], r = L.pos[b[1]]; d.subVectors(r, p); const len = d.length(); q.setFromUnitVectors(up, d.normalize());
      M.compose(sc.addVectors(p, r).multiplyScalar(0.5), q, new THREE.Vector3(1, len, 1)); bM.setMatrixAt(k, M);
      bM.setColorAt(k, (b[0] === L.sel || b[1] === L.sel) ? C_HOT : C_BOND);
    });
    aM.instanceMatrix.needsUpdate = true; bM.instanceMatrix.needsUpdate = true; aM.instanceColor.needsUpdate = true; if (bM.instanceColor) bM.instanceColor.needsUpdate = true;
    L.shake *= 0.9;
  };
  L.pick = rc => { const h = rc.intersectObject(aM)[0]; return h ? h.instanceId : -1; };
  L.update(); return L;
}

/* ---------- 肉眼档与晶体档的 3D 物件 ---------- */
function gem() {
  /* 圆明亮式切工的简化轮廓:台面—冠部—腰—亭部;8 面,平面着色显出刻面 */
  const pts = [[0, -0.62], [0.36, -0.2], [0.6, 0.0], [0.6, 0.04], [0.42, 0.22], [0.0, 0.22]].map(p => new THREE.Vector2(p[0], p[1]));
  const m = new THREE.Mesh(new THREE.LatheGeometry(pts, 8), new THREE.MeshStandardMaterial({ color: 0xd8efff, roughness: 0.05, metalness: 0.25, flatShading: true, emissive: 0x16304a, emissiveIntensity: 0.6, side: THREE.DoubleSide }));
  const g = new THREE.Group(); g.add(m); g.rotation.x = 0.35; return g;
}
function pencil() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.5, 6), new THREE.MeshStandardMaterial({ color: 0xf2c14e, roughness: 0.5, flatShading: true }));
  const wood = new THREE.Mesh(new THREE.CylinderGeometry(0.0, 0.12, 0.34, 6), new THREE.MeshStandardMaterial({ color: 0xe6c9a0, roughness: 0.8, flatShading: true })); wood.position.y = 0.92;
  const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.0, 0.045, 0.13, 12), new THREE.MeshStandardMaterial({ color: 0x2b2b2f, roughness: 0.3, metalness: 0.5 })); tip.position.y = 1.03;
  const er = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.18, 16), new THREE.MeshStandardMaterial({ color: 0xe88888, roughness: 0.7 })); er.position.y = -0.84;
  g.add(body, wood, tip, er); g.rotation.z = -1.0; g.rotation.x = 0.3; return g;
}
function grains(kind) {
  const g = new THREE.Group(), r = (s => () => (s = (s * 16807) % 2147483647) / 2147483647)(7);
  if (kind === 'dia') {
    for (let i = 0; i < 26; i++) { const v = 0.55 + r() * 0.35, m = new THREE.Mesh(new THREE.OctahedronGeometry(0.12 + r() * 0.16), new THREE.MeshStandardMaterial({ color: new THREE.Color(v, v, v + 0.05), roughness: 0.3, flatShading: true }));
      m.position.set((r() - 0.5) * 1.6, (r() - 0.5) * 1.2, (r() - 0.5) * 1.0); m.rotation.set(r() * 3, r() * 3, 0); g.add(m); }
  } else {
    for (let i = 0; i < 18; i++) { const v = 0.32 + r() * 0.2, m = new THREE.Mesh(new THREE.BoxGeometry(0.9 + r() * 0.6, 0.035, 0.6 + r() * 0.4), new THREE.MeshStandardMaterial({ color: new THREE.Color(v, v, v + 0.03), roughness: 0.35, metalness: 0.4 }));
      m.position.set((r() - 0.5) * 0.4, -0.6 + i * 0.07, (r() - 0.5) * 0.3); m.rotation.y = (r() - 0.5) * 0.5; g.add(m); }
  }
  return g;
}
function cap(parent, txt) { const p = document.createElement('p'); p.className = 'note-sm'; p.textContent = txt; parent.appendChild(p); return p; }

/* ==================== 第 1 关:同一种原子(3D 尺度镜) ==================== */
function L0(stage, api) {
  const st = { kind: 'dia', zoom: 0 }, found = { dia: 0, gra: 0 };
  seg(stage, [['dia', '钻石'], ['gra', '铅笔芯']], { pill: '拖动旋转', fn: k => { st.kind = k; EF.play('select'); tip.textContent = found[k] ? '这一个已经认出来了,换另一个看看。' : '把尺度镜拉到"原子",点一颗原子看看它是谁。'; } });
  const s = stage3d(stage);
  const ctl = document.createElement('div'); ctl.className = 'ctl'; ctl.innerHTML = '<span>尺度镜</span><input type="range" min="0" max="2" step="1" value="0"><output>肉眼</output>'; stage.appendChild(ctl);
  const tip = cap(stage, '把尺度镜拉到"原子",点一颗原子看看它是谁。');
  const scaleTxt = ['肉眼 · 约 1 厘米', '晶体 · 放大约一万倍(示意)', '原子 · 放大约一亿倍'];
  const rg = ctl.querySelector('input'), out = ctl.querySelector('output');
  rg.oninput = () => { st.zoom = +rg.value; out.textContent = ['肉眼', '晶体', '原子'][st.zoom]; EF.play('whoosh'); s.flash = 1; };
  const objs = {
    dia: [gem(), grains('dia'), Lattice(DIA)], gra: [pencil(), grains('gra'), Lattice(GRA)]
  };
  const roots = {}; ['dia', 'gra'].forEach(k => { roots[k] = objs[k].map(o => { const g = o.g || o; g.scale.setScalar(0.001); s.scene.add(g); return g; }); });
  const tag = label('碳 C · 6 号元素', { size: 0.17 }); tag.visible = false; s.scene.add(tag);
  const cap3 = label(scaleTxt[0], { size: 0.12, bg: false, color: '#a9a29a' }); s.scene.add(cap3); let capK = -1;
  s.onPick = rc => { if (st.zoom === 2) hit(objs[st.kind][2].pick(rc)); };
  EF._c3t = { pick: () => { if (st.zoom === 2) hit(objs[st.kind][2].S.center); } };   /* 自测钩子 */
  function hit(i) {
    const L = objs[st.kind][2]; if (i < 0) return;
    L.sel = i; EF.tone(6); tag.visible = true; tag.userData.k = st.kind;
    tip.innerHTML = '这是 <b style="color:#ffc46b">碳 C · 6 号元素</b>(6 个质子)。' + (st.kind === 'dia' ? '钻石' : '铅笔芯') + '里的每一颗都是它。';
    if (!found[st.kind]) { found[st.kind] = 1; EF.play('select'); if (found.dia && found.gra) setTimeout(api.complete, 900); }
  }
  s.onFrame((t, dt) => {
    s.orbit(st.kind === 'gra' && st.zoom === 2 ? 4.5 : 3.6);
    ['dia', 'gra'].forEach(k => roots[k].forEach((g, z) => { const want = k === st.kind && z === st.zoom ? 1 : 0.001, v = g.scale.x; g.scale.setScalar(RM() ? want : v + (want - v) * (1 - Math.exp(-dt * 9))); g.visible = g.scale.x > 0.01; }));
    const L = objs[st.kind][2]; if (st.zoom === 2) L.update(t);
    if (tag.visible) { if (tag.userData.k !== st.kind || st.zoom !== 2 || L.sel < 0) tag.visible = false; else tag.position.copy(L.pos[L.sel]).add(new THREE.Vector3(0, 0.28, 0)); }
    if (capK !== st.zoom) { capK = st.zoom; const n = label(scaleTxt[st.zoom], { size: 0.12, bg: false, color: '#a9a29a' }); cap3.material.map.dispose(); cap3.material.dispose(); cap3.material = n.material; cap3.scale.copy(n.scale); }
    cap3.position.set(0, -1.15, 0);
  });
}

/* ==================== 第 2 关:数一数手(3D 键) ==================== */
function L1(stage, api) {
  let kind = 'dia'; const ok = { dia: 0, gra: 0 };
  seg(stage, [['dia', '钻石'], ['gra', '石墨(铅笔芯)']], { pill: '拖动旋转 · 点选原子', fn: k => { kind = k; Ls.dia.g.visible = k === 'dia'; Ls.gra.g.visible = k === 'gra'; Ls[k].sel = Ls[k].S.center; EF.play('select'); ask(); } });
  const s = stage3d(stage);
  const Ls = { dia: Lattice(DIA), gra: Lattice(GRA) }; s.scene.add(Ls.dia.g, Ls.gra.g); Ls.gra.g.visible = false;
  Ls.dia.sel = DIA.center; Ls.gra.sel = GRA.center;
  const leg = document.createElement('div'); leg.className = 's3d-leg'; leg.innerHTML = '<span><i style="background:#ffb35c"></i>选中的碳</span><span><i style="background:#ffe2b0"></i>和它手拉手的碳</span>'; s.wrap.appendChild(leg);
  s.onPick = rc => { const L = Ls[kind], i = L.pick(rc); if (i > -1) { L.sel = i; EF.tone(6); } };
  const q = document.createElement('div'); q.className = 'ctl ans'; stage.appendChild(q);
  function ask() {
    q.innerHTML = '<span>中心这颗碳(亮橙色)和几个碳手拉手?</span>' + [2, 3, 4, 5].map(n => '<button class="ef-btn ghost" data-n="' + n + '">' + n + '</button>').join('') + (ok[kind] ? ' <span class="pill">✓ 已答对</span>' : '');
    q.querySelectorAll('button').forEach(b => b.onclick = () => {
      const right = kind === 'dia' ? 4 : 3;
      if (+b.dataset.n === right) { ok[kind] = 1; EF.play('fuse'); Ls[kind].shake = 0.25; api.say(kind === 'dia' ? '对!4 个,朝四面八方伸出去,像一个立体的"三脚架加一根"。再看看石墨?' : '对!3 个,而且全在同一个平面里。'); ask(); if (ok.dia && ok.gra) setTimeout(api.complete, 800); }
      else { EF.play('tick'); api.say('再数数。拖动转一转,背后可能还藏着一根。'); }
    });
  }
  ask();
  s.onFrame(t => { s.orbit(kind === 'gra' ? 4.4 : 3.4); Ls[kind].update(t); });
}

/* ==================== 第 3 关:刮一刮(3D 晶格 + 划痕板) ==================== */
function L2(stage, api) {
  const s = stage3d(stage, { h: EF.mobile ? 260 : 300, yaw: 0.25, pitch: 0.25 }); s.auto = false;
  const G = Lattice(GRA), D = Lattice(DIA); G.g.position.x = -1.25; D.g.position.x = 1.25; s.scene.add(G.g, D.g);
  const lg = label('石墨', { size: 0.15 }); lg.position.set(-1.25, 1.35, 0); const ld = label('钻石', { size: 0.15 }); ld.position.set(1.25, 1.35, 0); s.scene.add(lg, ld);
  /* 被刮下来的石墨片:六边形小薄片,往下飘落 */
  const flakes = [], fGeo = new THREE.CircleGeometry(0.09, 6), fMat = new THREE.MeshStandardMaterial({ color: 0x55555c, metalness: 0.5, roughness: 0.4, side: THREE.DoubleSide, transparent: true });
  function flake() { if (flakes.length > 40) return; const m = new THREE.Mesh(fGeo, fMat.clone()); m.position.set(-1.25 + G.shift * K + (Math.random() - 0.5) * 0.8, 3.35 * K, (Math.random() - 0.5) * 0.8); m.rotation.x = -Math.PI / 2; m.userData.v = new THREE.Vector3((Math.random() - 0.5) * 0.4, -0.2, (Math.random() - 0.5) * 0.3); m.userData.life = 2.2; s.scene.add(m); flakes.push(m); }
  const wrap = document.createElement('div'); wrap.className = 'two'; stage.appendChild(wrap);
  const prog = { gra: 0, dia: 0 }; let lastSnd = 0;
  [['gra', '石墨在纸上', '#f4efe4', 'rgba(40,40,46,.55)', 900], ['dia', '钻石在玻璃上', '#9fc0d8', 'rgba(255,255,255,.9)', 500]].forEach(k => {
    const p = document.createElement('div'); p.className = 'panel'; p.innerHTML = '<h3>' + k[1] + '</h3>'; wrap.appendChild(p);
    const S = EF.canvas(p, 110), x = S.x, bar = cap(p, '在这' + (k[0] === 'gra' ? '张纸' : '块玻璃') + '上来回划一划,盯着上面的原子。');
    let last = null, len = 0;
    function bg() { x.fillStyle = k[2]; x.fillRect(0, 0, S.W, S.H); if (k[0] === 'dia') { x.fillStyle = 'rgba(255,255,255,.25)'; x.fillRect(0, 0, S.W, 8); } }
    bg(); S.onresize = bg;
    S.c.addEventListener('pointerdown', e => { last = S.pt(e); S.c.setPointerCapture(e.pointerId); });
    S.c.addEventListener('pointerup', () => { last = null; });
    S.c.addEventListener('pointermove', e => {
      if (!last) return; const q = S.pt(e), d = Math.hypot(q.x - last.x, q.y - last.y);
      x.strokeStyle = k[3]; x.lineWidth = k[0] === 'gra' ? 5 : 1.5; x.lineCap = 'round'; x.beginPath(); x.moveTo(last.x, last.y); x.lineTo(q.x, q.y); x.stroke();
      if (k[0] === 'gra') { G.shift = Math.sin(len / 60) * 1.6; if (Math.random() < 0.25) flake(); } else D.shake = 0.12;
      len += d; last = q; const now = performance.now(); if (now - lastSnd > 320) { lastSnd = now; EF.play(k[0] === 'gra' ? 'slide' : 'tick'); }
      if (len > k[4] && !prog[k[0]]) { prog[k[0]] = 1; bar.innerHTML = k[0] === 'gra' ? '看上面:最上面一层石墨被"刮"得滑来滑去,碎片留在纸上。' : '钻石的骨架纹丝不动,反倒在玻璃上划出了一道痕。'; EF.play('select'); if (prog.gra && prog.dia) setTimeout(api.complete, 900); }
    });
  });
  s.onFrame((t, dt) => {
    s.orbit(4.4 * Math.max(1, 1.45 / s.camera.aspect)); G.update(t); D.update(t);
    for (let i = flakes.length - 1; i >= 0; i--) { const f = flakes[i]; f.userData.life -= dt; f.position.addScaledVector(f.userData.v, dt); f.rotation.z += dt * 2; f.material.opacity = Math.min(1, f.userData.life); if (f.userData.life <= 0) { s.scene.remove(f); f.material.dispose(); flakes.splice(i, 1); } }
  });
}

/* ==================== 第 4 关:改规则·3D 压机 ==================== */
function L3(stage, api) {
  const wrap = document.createElement('div'); wrap.className = 'two'; stage.appendChild(wrap);
  const pa = document.createElement('div'); pa.className = 'panel'; pa.innerHTML = '<h3>碳的相图(示意 · 1100–1600 °C 段为实测)</h3>'; wrap.appendChild(pa);
  const pb = document.createElement('div'); pb.className = 'panel'; pb.innerHTML = '<h3>压机里的碳</h3>'; wrap.appendChild(pb);
  const Dg = EF.canvas(pa, 260), x = Dg.x;
  const s = stage3d(pb, { h: 260, yaw: 0.7, pitch: 0.25 });
  /* 压机:上下两块砧,中间一小块石墨晶格 */
  const steel = new THREE.MeshStandardMaterial({ color: 0x8d96a8, metalness: 0.85, roughness: 0.3 });
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.95, 0.6, 32), steel), bot = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.5, 0.6, 32), steel);
  s.scene.add(top, bot);
  const glow = new THREE.PointLight(0xff8a3c, 0, 4); s.scene.add(glow);
  let L = Lattice(graphite(3.4)); s.scene.add(L.g);
  const ctl = document.createElement('div'); ctl.innerHTML = '<div class="ctl"><span>压力</span><input type="range" id="pp" min="0" max="10" step="0.1" value="1"><output id="po"></output></div><div class="ctl"><span>温度</span><input type="range" id="tt" min="300" max="3000" step="10" value="300"><output id="to"></output></div><div class="ctl"><button class="ef-btn" id="press">开压!</button></div>';
  stage.appendChild(ctl); const res = cap(stage, '');
  const pp = ctl.querySelector('#pp'), tt = ctl.querySelector('#tt'); let done = false, slam = 0, morph = 0;
  const line = T => 1.94 + 0.0025 * (T - 273);   /* Kennedy & Kennedy 1976 近似:P(kbar)=19.4+0.025·T(°C) */
  function sync() { ctl.querySelector('#po').textContent = (+pp.value).toFixed(1) + ' GPa(约 ' + (pp.value * 0.987).toFixed(1) + ' 万个大气压)'; ctl.querySelector('#to').textContent = tt.value + ' K(约 ' + (tt.value - 273) + ' °C)'; }
  pp.oninput = tt.oninput = sync; sync();
  ctl.querySelector('#press').onclick = () => {
    if (done) return; const P = +pp.value, T = +tt.value; EF.play('anvil'); slam = 1;
    if (P < line(T)) { res.innerHTML = '压力不够:在这里,碳更喜欢当<b>石墨</b>。'; api.say('点还在石墨区。你想往哪个方向推它?'); L.shake = 0.15; }
    else if (T < 1500) { res.innerHTML = '理论上已经该变钻石了,可是<b>太冷</b>,原子挪不动位置——要等上亿年。'; api.say('方向对了!可原子们"冻"住了。什么能让它们动起来?'); L.shake = 0.3; }
    else {
      done = true; res.innerHTML = '<b style="color:#ffc46b">成功!</b>高压把层与层挤到一起,高温让原子重新手拉手,石墨变成了钻石(工厂里还会加熔化的金属帮忙)。'; EF.play('fuse');
      morph = 0.001; setTimeout(api.complete, 1600);
    }
  };
  let D2 = null;
  s.onFrame((t, dt) => {
    s.orbit(4.1 * Math.max(1, 1.3 / s.camera.aspect), 0);
    const P = +pp.value, T = +tt.value, heat = Math.max(0, (T - 300) / 2700);
    slam = Math.max(0, slam - dt * 2.2);
    const sq = done ? 1 : 1 - 0.35 * P / 10 - (RM() ? 0 : slam * 0.08);
    L.squeeze = sq; L.heat = heat; top.position.y = 3.35 * K * sq + 0.44 - (RM() ? 0 : slam * 0.12); bot.position.y = -3.35 * K * sq - 0.44;
    glow.intensity = heat * 3; steel.emissive.setRGB(heat * 0.35, heat * 0.12, 0);
    if (morph > 0) {
      morph = Math.min(1, morph + dt * (RM() ? 10 : 0.9));
      if (!D2) { D2 = Lattice(diamond(3.6)); D2.g.scale.setScalar(0.001); s.scene.add(D2.g); D2.sel = D2.S.center; }
      L.g.scale.setScalar(Math.max(0.001, 1 - ease(morph * 1.6))); D2.g.scale.setScalar(Math.max(0.001, ease((morph - 0.35) / 0.65))); D2.heat = heat * (1 - morph); D2.update(t);
      top.position.y = 1.4; bot.position.y = -1.4;
    }
    L.update(t);
  });
  (function loop() {
    if (!Dg.c.isConnected) return;
    const W = Dg.W, H = Dg.H, l = 44, r = W - 12, tp = 12, b = H - 36; x.clearRect(0, 0, W, H);
    const X = T => l + (T - 300) / 2700 * (r - l), Y = P => b - P / 10 * (b - tp);
    x.fillStyle = 'rgba(122,215,255,.12)'; x.beginPath(); x.moveTo(X(300), Y(line(300))); x.lineTo(X(3000), Y(line(3000))); x.lineTo(X(3000), Y(10)); x.lineTo(X(300), Y(10)); x.fill();
    x.fillStyle = 'rgba(160,150,140,.12)'; x.beginPath(); x.moveTo(X(300), Y(line(300))); x.lineTo(X(3000), Y(line(3000))); x.lineTo(X(3000), Y(0)); x.lineTo(X(300), Y(0)); x.fill();
    x.strokeStyle = '#ffb35c'; x.lineWidth = 2; x.beginPath(); x.moveTo(X(300), Y(line(300))); x.lineTo(X(3000), Y(line(3000))); x.stroke(); x.lineWidth = 1;
    x.strokeStyle = 'rgba(255,196,107,.5)'; x.setLineDash([4, 4]); x.beginPath(); x.moveTo(X(1500), tp); x.lineTo(X(1500), b); x.stroke(); x.setLineDash([]);
    x.fillStyle = '#cfe9ff'; x.font = '700 14px system-ui'; x.textAlign = 'left'; x.fillText('钻石区', X(400), Y(8.8));
    x.fillStyle = '#d6cfc4'; x.fillText('石墨区', X(2000), Y(1.4));
    x.fillStyle = '#a9a29a'; x.font = '11px system-ui'; x.fillText('← 1500 K 以下:原子挪不动', X(1520), Y(0.5));
    x.textAlign = 'center'; x.fillText('温度 →', (l + r) / 2, H - 10); x.save(); x.translate(14, (tp + b) / 2); x.rotate(-Math.PI / 2); x.fillText('压力 →', 0, 0); x.restore();
    x.strokeStyle = '#2a2f44'; x.beginPath(); x.moveTo(l, tp); x.lineTo(l, b); x.lineTo(r, b); x.stroke();
    EF.ball(x, X(+tt.value), Y(+pp.value), 8, '#ffb35c');
    requestAnimationFrame(loop);
  })();
}

EF.C3 = { L0, L1, L2, L3 };
