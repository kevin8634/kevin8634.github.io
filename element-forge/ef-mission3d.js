/* 元素工坊 Element Forge · 任务页 3D 舞台背景 v0.10(crystal 霜镜舞台、cabbage 染色台、fireworks 夜空焰色台、battery 电光实验台、rocks 岩石标本台、mars 锈红舞台、titan 橙雾舞台)
   每关一个 3D 场景,随关卡切换淡入淡出;关卡玩法仍在前景面板里进行。低档不加载(保留 v0.1 星空背景)。 */
import { THREE, makeGL, P, glowSprite, starMaterial, fresnelMaterial } from './ef-gl.js?v=2';
const EF = window.EF;
const rnd = (s => () => (s = (s * 16807) % 2147483647) / 2147483647)(303);
const ease = x => x < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x);

try { boot(); } catch (e) { console.warn('[ef] 任务页 3D 背景启动失败,保留平面星空', e); }

function boot() {
  const host = document.getElementById('bg3d');
  const gl = makeGL(host, { fov: 45, onlost: () => { host.innerHTML = ''; document.body.classList.remove('gl-bg'); } });
  document.body.classList.add('gl-bg');
  const { scene, camera } = gl; camera.position.set(0, 0, 7);
  scene.add(new THREE.AmbientLight(0x8a7a90, 1.1));
  const key = new THREE.DirectionalLight(0xfff0dd, 2.4); key.position.set(3, 2.5, 4); scene.add(key);
  const rim = new THREE.PointLight(0xff9a3c, 30, 30); rim.position.set(-3, -1.5, 3); scene.add(rim);

  /* 星空 */
  const n = P.stars, pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { const u = rnd() * 2 - 1, a = rnd() * 6.283, r = 40 + rnd() * 50, q = Math.sqrt(1 - u * u); pos.set([Math.cos(a) * q * r, u * r, Math.sin(a) * q * r - 25], i * 3); }
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const stars = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xfff1dc, size: 0.16, transparent: true, opacity: 0.85, depthWrite: false })); scene.add(stars);

  function SC() { return { g: new THREE.Group(), mats: [], upd: null, a: 0 }; }
  function reg(sc, m, b = 1) { m.transparent = true; sc.mats.push([m, b]); return m; }
  function setA(sc, a) { sc.g.visible = a > 0.004; for (const [m, b] of sc.mats) { if (m.uniforms && m.uniforms.uA) m.uniforms.uA.value = a * b; else m.opacity = a * b; } }
  const glowW = s => glowSprite([[0, 'rgba(255,200,120,.85)'], [0.25, 'rgba(255,140,50,.45)'], [0.6, 'rgba(255,80,20,.1)'], [1, 'rgba(0,0,0,0)']], s);

  const isX = EF.missionId === 'crystal';
  if (isX) { /* v0.4.1:霜镜舞台——冷光、冰蓝,取代熔炉暖光 */
    scene.fog = new THREE.FogExp2(0x0a1a2a, 0.035); key.color.set(0xe6f6ff); rim.color.set(0x7ad7ff); stars.material.color.set(0xcfefff);
    scene.children.forEach(o => { if (o.isAmbientLight) o.color.set(0x7a90a8); });
  }
  const isK = EF.missionId === 'cabbage';
  if (isK) { /* v0.5:染色台——品红冷暖光(小点) */
    scene.fog = new THREE.FogExp2(0x1a0a20, 0.03); key.color.set(0xfff0f8); rim.color.set(0xff7ad9);
  }
  const isF = EF.missionId === 'fireworks';
  if (isF) { /* v0.6:夜空焰色台——深夜蓝 + 暖橙边光 */
    scene.fog = new THREE.FogExp2(0x070818, 0.025); key.color.set(0xfff4e6); rim.color.set(0xffb35c);
  }
  const isB = EF.missionId === 'battery';
  if (isB) { /* v0.7:电光实验台——深青 + 电光蓝边光(锂锂) */
    scene.fog = new THREE.FogExp2(0x061018, 0.028); key.color.set(0xeef8ff); rim.color.set(0x7ad7ff);
  }
  const isR = EF.missionId === 'rocks';
  if (isR) { /* v0.8:岩石标本台——暗紫褐 + 熔岩橙边光(莫芙) */
    scene.fog = new THREE.FogExp2(0x140c14, 0.03); key.color.set(0xfff0e6); rim.color.set(0xff7a3a);
  }
  const isM = EF.missionId === 'mars';
  if (isM) { /* v0.9:锈红舞台——暗赭 + 铁锈橙边光(奥加) */
    scene.fog = new THREE.FogExp2(0x180a06, 0.03); key.color.set(0xfff0e0); rim.color.set(0xe0703a);
  }
  const isT = EF.missionId === 'titan';
  if (isT) { /* v0.10:橙雾舞台——暗琥珀 + 雾橙边光(奥加) */
    scene.fog = new THREE.FogExp2(0x1a1006, 0.03); key.color.set(0xfff0d8); rim.color.set(0xffa040);
  }
  const LV = EF.missionId === 'carbon' ? carbonScenes() : EF.missionId === 'stars' ? starScenes() : isX ? crystalScenes() : isK ? cabbageScenes() : isF ? fireScenes() : isB ? voltScenes() : isR ? rockScenes() : isM ? marsScenes() : isT ? titanScenes() : [];
  LV.forEach(s => { scene.add(s.g); setA(s, 0); });

  /* ---------- stars:主序星 → 洋葱分层的大质量恒星 → 铁核心 → 超新星遗迹 ---------- */
  function starScenes() {
    const out = [];
    { const s = SC(), m = reg(s, starMaterial()); s.g.add(new THREE.Mesh(new THREE.SphereGeometry(1.25, 96, 64), m)); const g = glowW(5.4); reg(s, g.material); s.g.add(g); s.upd = t => { m.uniforms.uT.value = t; s.g.rotation.y = t * 0.05; }; out.push(s); }
    { const s = SC(), cols = [0xbfe3ff, 0xffe08a, 0xffb347, 0xff6a3d, 0xff5fa2, 0xa37bff, 0x9aa6b8];
      cols.forEach((c, i) => { const m = reg(s, fresnelMaterial(c, 1.8, 0.14, THREE.DoubleSide), i ? 0.9 : 0.6); const me = new THREE.Mesh(new THREE.SphereGeometry(1.7 * (1 - i * 0.13), 64, 48), m); s.g.add(me); });
      const g = glowSprite([[0, 'rgba(200,225,255,.6)'], [0.4, 'rgba(150,190,255,.15)'], [1, 'rgba(0,0,0,0)']], 7); reg(s, g.material); s.g.add(g);
      s.upd = t => { s.g.rotation.y = t * 0.08; s.g.rotation.x = 0.3; }; out.push(s); }
    { const s = SC(), m = reg(s, new THREE.MeshStandardMaterial({ color: 0x9aa6b8, metalness: 0.85, roughness: 0.28, emissive: 0x3a1a08, emissiveIntensity: 0.6 }));
      s.g.add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.95, 5), m));
      const N = 260, pp = new Float32Array(N * 3), seeds = []; for (let i = 0; i < N; i++) seeds.push([rnd() * 6.283, 1.3 + rnd() * 1.4, (rnd() - 0.5) * 1.6, 0.3 + rnd()]);
      const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pp, 3));
      s.g.add(new THREE.Points(pg, reg(s, new THREE.PointsMaterial({ color: 0xffc46b, size: 0.05, blending: THREE.AdditiveBlending, depthWrite: false }))));
      const g = glowW(4.2); reg(s, g.material, 0.6); s.g.add(g);
      s.upd = t => { seeds.forEach((q, i) => { const a = q[0] + t * q[3] / q[1]; pp.set([Math.cos(a) * q[1], q[2] * Math.sin(t * 0.5 + i), Math.sin(a) * q[1]], i * 3); }); pg.attributes.position.needsUpdate = true; s.g.rotation.y = t * 0.1; }; out.push(s); }
    { const s = SC(), N = P.cloud, pp = new Float32Array(N * 3), cc = new Float32Array(N * 3), dir = [];
      for (let i = 0; i < N; i++) { const u = rnd() * 2 - 1, a = rnd() * 6.283, q = Math.sqrt(1 - u * u), r = 0.75 + Math.pow(rnd(), 0.4) * 0.3 + 0.12 * Math.sin(a * 5 + u * 7); dir.push([Math.cos(a) * q * r, u * r, Math.sin(a) * q * r]);
        const c = new THREE.Color().setHSL(rnd() < 0.55 ? 0.02 + rnd() * 0.06 : 0.55 + rnd() * 0.1, 0.9, 0.55 + rnd() * 0.2); cc.set([c.r, c.g, c.b], i * 3); }
      const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pp, 3)); pg.setAttribute('color', new THREE.BufferAttribute(cc, 3));
      s.g.add(new THREE.Points(pg, reg(s, new THREE.PointsMaterial({ size: 0.085, vertexColors: true, blending: THREE.AdditiveBlending, depthWrite: false }), 0.9)));
      const core = glowSprite([[0, 'rgba(220,235,255,1)'], [0.2, 'rgba(160,200,255,.4)'], [1, 'rgba(0,0,0,0)']], 1.2); reg(s, core.material); s.g.add(core);
      s.upd = t => { const k = 2.1 + Math.sin(t * 0.25) * 0.12; dir.forEach((d, i) => pp.set([d[0] * k, d[1] * k, d[2] * k], i * 3)); pg.attributes.position.needsUpdate = true; s.g.rotation.y = t * 0.03; }; out.push(s); }
    return out;
  }

  /* ---------- carbon:石墨层 → 数手 → 层间滑动 → 金刚石 ---------- */
  function carbonScenes() {
    const atomM = () => new THREE.MeshStandardMaterial({ color: 0x5b6170, roughness: 0.35, metalness: 0.2, emissive: 0x1a1008 });
    const bondM = () => new THREE.MeshStandardMaterial({ color: 0xffb35c, roughness: 0.4, metalness: 0.3, emissive: 0x5a2a08, emissiveIntensity: 0.8 });
    const up = new THREE.Vector3(0, 1, 0), M4 = new THREE.Matrix4(), q = new THREE.Quaternion();
    function build(s, atoms, bonds, rA = 0.1, rB = 0.03) {
      const am = reg(s, atomM()), bm = reg(s, bondM());
      const im = new THREE.InstancedMesh(new THREE.SphereGeometry(rA, 16, 12), am, atoms.length); atoms.forEach((p, i) => { M4.makeTranslation(p.x, p.y, p.z); im.setMatrixAt(i, M4); });
      const bi = new THREE.InstancedMesh(new THREE.CylinderGeometry(rB, rB, 1, 8), bm, Math.max(1, bonds.length));
      bonds.forEach(([a, b], i) => { const d = new THREE.Vector3().subVectors(b, a); q.setFromUnitVectors(up, d.clone().normalize()); M4.compose(new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5), q, new THREE.Vector3(1, d.length(), 1)); bi.setMatrixAt(i, M4); });
      const g = new THREE.Group(); g.add(im, bi); return g;
    }
    function bondsOf(atoms, L, tol = 0.03) { const b = []; for (let i = 0; i < atoms.length; i++) for (let j = i + 1; j < atoms.length; j++) if (Math.abs(atoms[i].distanceTo(atoms[j]) - L) < tol) b.push([atoms[i], atoms[j]]); return b; }
    /* 石墨层:六边形蜂窝,层间 AB 错位 */
    function sheet(offX, y) {
      const a = 0.42, pts = [];
      for (let i = -5; i <= 5; i++) for (let j = -5; j <= 5; j++) {
        const x0 = i * a * Math.sqrt(3) + (j % 2 ? a * Math.sqrt(3) / 2 : 0), z0 = j * a * 1.5;
        [[0, -a / 2], [0, a / 2]].forEach(o => { const p = new THREE.Vector3(x0 + offX, y, z0 + o[1]); if (Math.hypot(p.x - offX, p.z) < 2.1) pts.push(p); });
      }
      const seen = new Set(), at = pts.filter(p => { const k = p.x.toFixed(2) + ',' + p.z.toFixed(2); if (seen.has(k)) return false; seen.add(k); return true; });
      return { at, b: bondsOf(at, a, 0.02) };
    }
    function graphite(s) { const layers = [-0.99, 0, 0.99].map((y, k) => { const sh = sheet(k % 2 ? 0.42 * Math.sqrt(3) / 2 : 0, y); const g = build(s, sh.at, sh.b, 0.075, 0.022); s.g.add(g); return g; }); return layers; }
    const out = [];
    { const s = SC(); graphite(s); s.g.rotation.x = 0.35; s.upd = t => { s.g.rotation.y = t * 0.08; }; out.push(s); }
    { const s = SC(); const L = graphite(s); s.g.rotation.x = 0.55; const glow = glowW(1.1); reg(s, glow.material); s.g.add(glow); s.upd = t => { s.g.rotation.y = t * 0.06; glow.material.opacity = 0.5 + 0.4 * Math.sin(t * 3); }; out.push(s); }
    { const s = SC(); const L = graphite(s); s.g.rotation.x = 0.25; s.upd = t => { L[2].position.x = Math.sin(t * 0.8) * 0.6; L[0].position.x = -Math.sin(t * 0.8) * 0.3; s.g.rotation.y = 0.5 + Math.sin(t * 0.2) * 0.3; }; out.push(s); }
    { const s = SC(), A = 1.0, basis = [[0, 0, 0], [0, .5, .5], [.5, 0, .5], [.5, .5, 0]], raw = [];
      for (let i = 0; i <= 2; i++) for (let j = 0; j <= 2; j++) for (let k = 0; k <= 2; k++) for (const b of basis) raw.push([i + b[0], j + b[1], k + b[2]]);
      for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) for (let k = 0; k < 2; k++) for (const b of basis) raw.push([i + b[0] + .25, j + b[1] + .25, k + b[2] + .25]);
      const seen = new Set(), at = []; raw.forEach(p => { if (p.some(v => v > 2.001)) return; const k = p.map(v => v.toFixed(2)).join(); if (seen.has(k)) return; seen.add(k); at.push(new THREE.Vector3(p[0] - 1, p[1] - 1, p[2] - 1).multiplyScalar(A)); });
      s.g.add(build(s, at, bondsOf(at, Math.sqrt(3) / 4 * A, 0.02), 0.08, 0.026));
      const g = glowSprite([[0, 'rgba(200,230,255,.35)'], [1, 'rgba(0,0,0,0)']], 5); reg(s, g.material); s.g.add(g);
      s.g.rotation.set(0.5, 0.6, 0); s.upd = t => { s.g.rotation.y = 0.6 + t * 0.12; }; out.push(s); }
    return out;
  }

  /* ---------- crystal(霜镜):盐粒 → 离子格子 → 晶体慢长 → 雪花 ---------- */
  function crystalScenes() {
    const ice = op => new THREE.MeshStandardMaterial({ color: 0xcfefff, roughness: 0.15, metalness: 0.05, emissive: 0x2a6a8a, emissiveIntensity: 0.5, opacity: op });
    const out = [];
    /* 0 漂浮的小盐立方 */
    { const s = SC(), m = reg(s, ice(0.8), 0.8), cubes = [];
      for (let i = 0; i < 26; i++) { const c = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), m); const k = 0.12 + rnd() * 0.28; c.scale.setScalar(k);
        c.position.set((rnd() - 0.5) * 4, (rnd() - 0.5) * 3, (rnd() - 0.5) * 2.5); c.rotation.set(rnd() * 3, rnd() * 3, 0); c.userData.v = 0.2 + rnd() * 0.4; s.g.add(c); cubes.push(c); }
      s.upd = t => { cubes.forEach((c, i) => { c.rotation.y = t * c.userData.v + i; c.position.y += Math.sin(t * 0.6 + i) * 0.0008; }); }; out.push(s); }
    /* 1 Na/Cl 岩盐格子 3×3×3 */
    { const s = SC(), mN = reg(s, new THREE.MeshStandardMaterial({ color: 0xb48cff, emissive: 0x2a1450, emissiveIntensity: 0.6, roughness: 0.35 }), 0.9),
        mC = reg(s, new THREE.MeshStandardMaterial({ color: 0x7be08a, emissive: 0x123a18, emissiveIntensity: 0.6, roughness: 0.35 }), 0.9);
      const gN = new THREE.SphereGeometry(0.17, 24, 16), gC = new THREE.SphereGeometry(0.28, 24, 16), d = 0.7;
      for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) for (let k = -1; k <= 1; k++) { const na = (i + j + k + 3) % 2 === 0; const b = new THREE.Mesh(na ? gN : gC, na ? mN : mC); b.position.set(i * d, j * d, k * d); s.g.add(b); }
      s.g.rotation.set(0.5, 0.6, 0); s.upd = t => { s.g.rotation.y = 0.6 + t * 0.1; }; out.push(s); }
    /* 2 一颗大晶体与一群小晶体 */
    { const s = SC(), m = reg(s, ice(0.85), 0.85), big = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.3, 1.3), m); big.rotation.set(0.5, 0.7, 0); s.g.add(big);
      const small = []; for (let i = 0; i < 40; i++) { const c = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.12), m); const a = rnd() * 6.283, r = 1.4 + rnd() * 0.9; c.position.set(Math.cos(a) * r, (rnd() - 0.5) * 1.6, Math.sin(a) * r); s.g.add(c); small.push(c); }
      s.upd = t => { big.rotation.y = 0.7 + t * 0.08; const k = 1 + 0.04 * Math.sin(t * 0.5); big.scale.setScalar(k); s.g.rotation.y = t * 0.05; }; out.push(s); }
    /* 3 六角雪花 */
    { const s = SC(), m = reg(s, ice(0.9), 0.9), flake = new THREE.Group();
      const arm = new THREE.BoxGeometry(0.07, 1.6, 0.04), twig = new THREE.BoxGeometry(0.05, 0.42, 0.03);
      for (let k = 0; k < 6; k++) { const g = new THREE.Group(); g.rotation.z = k * Math.PI / 3; const a = new THREE.Mesh(arm, m); a.position.y = 0.8; g.add(a);
        [0.55, 0.95, 1.3].forEach((y, n) => [-1, 1].forEach(sd => { const tw = new THREE.Mesh(twig, m); tw.scale.y = 1 - n * 0.25; tw.position.set(sd * 0.13, y, 0); tw.rotation.z = -sd * Math.PI / 3; g.add(tw); })); flake.add(g); }
      flake.add(new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.05, 6), m).rotateX(Math.PI / 2));
      s.g.add(flake); s.upd = t => { flake.rotation.z = t * 0.1; flake.rotation.y = Math.sin(t * 0.3) * 0.5; }; out.push(s); }
    return out;
  }

  /* ---------- cabbage(小点):彩色液滴 → pH 色环 → 分子环 → 中和气泡 ---------- */
  function cabbageScenes() {
    const ph = p => { const c = EF.CAB ? EF.CAB.rgb(p) : [140, 80, 180]; return new THREE.Color(c[0] / 255, c[1] / 255, c[2] / 255); };
    const mat = (c, op) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.25, emissive: c.clone().multiplyScalar(0.35), emissiveIntensity: 1, opacity: op });
    const out = [];
    /* 0 六颗漂浮的彩色液滴 */
    { const s = SC(), drops = []; [2.2, 2.6, 7, 8.3, 9.5, 11.5].forEach((p, i) => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.32, 28, 20), reg(s, mat(ph(p), 0.85), 0.85)); m.scale.set(1, 1.25, 1);
        const a = i / 6 * 6.283; m.position.set(Math.cos(a) * 1.7, Math.sin(a * 2) * 0.4, Math.sin(a) * 1.1); m.userData.a = a; s.g.add(m); drops.push(m); });
      s.upd = t => { drops.forEach((m, i) => { const a = m.userData.a + t * 0.15; m.position.set(Math.cos(a) * 1.7, Math.sin(t * 0.7 + i) * 0.25, Math.sin(a) * 1.1); }); }; out.push(s); }
    /* 1 pH 0–14 色环 */
    { const s = SC(), ring = new THREE.Group(); for (let p = 0; p < 14; p++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.5, 0.12), reg(s, mat(ph(Math.max(1, p + 0.5)), 0.85), 0.85)); const a = (p / 14) * 6.283; b.position.set(Math.cos(a) * 1.6, Math.sin(a) * 1.6, 0); b.rotation.z = a; ring.add(b); }
      s.g.add(ring); s.g.rotation.x = -0.5; s.upd = t => { ring.rotation.z = t * 0.12; }; out.push(s); }
    /* 2 三个相连的六元环(花青素骨架示意) */
    { const s = SC(), g = new THREE.Group(), m = reg(s, mat(ph(7), 0.9), 0.9), cs = [[-0.87, 0], [0, 0], [1.3, -0.75]];
      cs.forEach(c => { const r = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.06, 10, 6), m); r.position.set(c[0], c[1], 0); r.rotation.z = Math.PI / 6; g.add(r); });
      g.position.x = -0.2; s.g.add(g); s.upd = t => { g.rotation.y = Math.sin(t * 0.4) * 0.6; m.color.copy(ph(4 + 4 * (1 + Math.sin(t * 0.5)))); m.emissive.copy(m.color).multiplyScalar(0.35); }; out.push(s); }
    /* 3 紫色液滴 + 上升的 CO₂ 气泡 */
    { const s = SC(), core = new THREE.Mesh(new THREE.SphereGeometry(0.8, 32, 24), reg(s, mat(ph(7), 0.8), 0.8)); s.g.add(core);
      const bm = reg(s, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1, emissive: 0x334455, opacity: 0.5 }), 0.5), bs = [];
      for (let i = 0; i < 30; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.04 + rnd() * 0.07, 12, 8), bm); b.userData = { x: (rnd() - 0.5) * 2.2, z: (rnd() - 0.5) * 1.5, o: rnd() * 3 }; s.g.add(b); bs.push(b); }
      s.upd = t => { bs.forEach(b => { const u = b.userData, y = ((t * 0.35 + u.o) % 3) - 1.5; b.position.set(u.x + Math.sin(t + u.o) * 0.05, y, u.z); }); core.scale.setScalar(1 + 0.03 * Math.sin(t)); }; out.push(s); }
    return out;
  }


  /* ---------- fireworks(小点):远处烟花 → 火焰 → 能级台阶 → 光谱彩带 ---------- */
  function fireScenes() {
    const FW = EF.FW, col = h => new THREE.Color(h), out = [], add = THREE.AdditiveBlending;
    /* 0 远处缓缓绽放的几朵烟花 */
    { const s = SC(), N = EF.campus ? 600 : 1400, pp = new Float32Array(N * 3), cc = new Float32Array(N * 3), seeds = [], cols = FW ? FW.EL.map(e => col(e.c)) : [col(0xff8844)];
      for (let i = 0; i < N; i++) { const u = rnd() * 2 - 1, a = rnd() * 6.283, q = Math.sqrt(1 - u * u), b = i % 5; seeds.push([Math.cos(a) * q, u, Math.sin(a) * q, b]); const c = cols[(b * 3) % cols.length]; cc.set([c.r, c.g, c.b], i * 3); }
      const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pp, 3)); pg.setAttribute('color', new THREE.BufferAttribute(cc, 3));
      s.g.add(new THREE.Points(pg, reg(s, new THREE.PointsMaterial({ size: 0.05, vertexColors: true, blending: add, depthWrite: false }), 0.9)));
      const C = [[-1.4, 0.8, 0], [1.2, 1.1, -1], [0, -0.2, 0.5], [-0.6, 1.6, -1.5], [1.6, -0.4, -0.5]];
      s.upd = t => { seeds.forEach((q, i) => { const ph = ((t * 0.22 + q[3] * 0.2) % 1), r = (1 - Math.exp(-ph * 4)) * 1.1, c = C[q[3]]; pp.set([c[0] + q[0] * r, c[1] + q[1] * r - ph * ph * 0.4, c[2] + q[2] * r], i * 3); }); pg.attributes.position.needsUpdate = true; }; out.push(s); }
    /* 1 一束被染色的火焰 */
    { const s = SC(), fl = [], cols = FW ? FW.EL.map(e => col(e.c)) : [col(0xff8844)];
      for (let j = 0; j < 3; j++) { const m = reg(s, new THREE.MeshBasicMaterial({ color: 0x6aa0ff, blending: add, depthWrite: false }), 0.5 - j * 0.1); const me = new THREE.Mesh(new THREE.ConeGeometry(0.45 - j * 0.1, 2.2 - j * 0.5, 32, 1, true), m); me.position.y = 0.1 - j * 0.25; s.g.add(me); fl.push(me); }
      s.upd = t => { const c = cols[Math.floor(t / 3) % cols.length]; fl.forEach((me, j) => { if (j < 2) me.material.color.lerp(c, 0.04); me.scale.set(1 + 0.05 * Math.sin(t * 9 + j), 1 + 0.08 * Math.sin(t * 7 + j), 1); }); }; out.push(s); }
    /* 2 能级台阶 + 跳动的电子 */
    { const s = SC(), lm = reg(s, new THREE.MeshBasicMaterial({ color: 0xd8d0f0 }), 0.6), Y = n => 1.5 - 13.6 / (n * n) * 0.22;
      for (let n = 1; n <= 6; n++) { const b = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.025, 0.025), lm); b.position.y = Y(n); s.g.add(b); }
      const e = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 12), reg(s, new THREE.MeshBasicMaterial({ color: 0x7ad7ff }))); s.g.add(e);
      const ph = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 8), reg(s, new THREE.MeshBasicMaterial({ color: 0xff4444, blending: add }))); s.g.add(ph);
      s.g.position.y = -0.3;
      s.upd = t => { const k = t % 2.4, hi = 3 + Math.floor(t / 2.4) % 4; e.position.set(-0.3, k < 1 ? Y(2) + (Y(hi) - Y(2)) * Math.min(1, k * 3) : Y(hi) + (Y(2) - Y(hi)) * Math.min(1, (k - 1) * 4), 0);
        const nm = FW ? FW.lam(hi, 2) : 600, c = FW ? FW.wl(nm) : [255, 80, 80]; ph.material.color.setRGB(c[0] / 255, c[1] / 255, c[2] / 255); ph.visible = k > 1.2; ph.position.set(-0.3 + (k - 1.2) * 1.4, (Y(hi) + Y(2)) / 2, 0); }; out.push(s); }
    /* 3 光谱彩带 + 氢的四条亮线 */
    { const s = SC(), N = 120, g = new THREE.Group();
      for (let i = 0; i < N; i++) { const nm = 380 + i / N * 400, c = FW ? FW.wl(nm) : [200, 200, 200], m = reg(s, new THREE.MeshBasicMaterial({ color: new THREE.Color(c[0] / 255, c[1] / 255, c[2] / 255) }), 0.18); const b = new THREE.Mesh(new THREE.BoxGeometry(3.6 / N, 0.8, 0.02), m); b.position.x = -1.8 + i / N * 3.6; g.add(b); }
      [656.3, 486.1, 434.0, 410.2].forEach(nm => { const c = FW ? FW.wl(nm) : [255, 255, 255], m = reg(s, new THREE.MeshBasicMaterial({ color: new THREE.Color(c[0] / 255, c[1] / 255, c[2] / 255), blending: add })); const b = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.9, 0.03), m); b.position.x = -1.8 + (nm - 380) / 400 * 3.6; g.add(b); });
      s.g.add(g); s.upd = t => { g.rotation.y = Math.sin(t * 0.3) * 0.5; g.rotation.x = -0.2; }; out.push(s); }
    return out;
  }

  /* ---------- battery(锂锂):柠檬电池 → 导线里的电子 → 金属梯子 → 锂离子往返 ---------- */
  function voltScenes() {
    const out = [], add = THREE.AdditiveBlending;
    /* 0 一个插着锌片、铜片的柠檬 */
    { const s = SC(), L = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32), reg(s, new THREE.MeshStandardMaterial({ color: 0xf2d33a, roughness: 0.55 }))); L.scale.set(1.3, 0.9, 0.95); s.g.add(L);
      [[-0.4, 0x9fb3c8], [0.4, 0xe08a4a]].forEach(([x, c]) => { const p = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.4, 0.4), reg(s, new THREE.MeshStandardMaterial({ color: c, metalness: 0.8, roughness: 0.3 }))); p.position.set(x, 0.9, 0); s.g.add(p); });
      const g = glowSprite([[0, 'rgba(255,230,120,.5)'], [1, 'rgba(0,0,0,0)']], 4.5); reg(s, g.material, 0.5); s.g.add(g);
      s.upd = t => { s.g.rotation.y = Math.sin(t * 0.3) * 0.6; }; out.push(s); }
    /* 1 一圈导线,电子沿着跑 */
    { const s = SC(), R = 1.3, tor = new THREE.Mesh(new THREE.TorusGeometry(R, 0.03, 8, 120), reg(s, new THREE.MeshBasicMaterial({ color: 0xcfd8e6 }), 0.6)); s.g.add(tor);
      const N = 40, pp = new Float32Array(N * 3), pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pp, 3));
      s.g.add(new THREE.Points(pg, reg(s, new THREE.PointsMaterial({ color: 0x7ad7ff, size: 0.12, blending: add, depthWrite: false }))));
      s.upd = t => { for (let i = 0; i < N; i++) { const a = i / N * 6.283 + t * 0.6; pp.set([Math.cos(a) * R, Math.sin(a) * R, 0], i * 3); } pg.attributes.position.needsUpdate = true; s.g.rotation.x = 0.9; s.g.rotation.z = t * 0.05; }; out.push(s); }
    /* 2 金属梯子:五块金属按电极电势高低排开 */
    { const s = SC(), M = [[-2.37, 0xc8d0d8], [-0.76, 0x9fb3c8], [-0.44, 0x6f7480], [0.34, 0xe08a4a], [0.8, 0xe6e9ee]];
      M.forEach(([E, c], i) => { const b = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.18, 0.5), reg(s, new THREE.MeshStandardMaterial({ color: c, metalness: 0.85, roughness: 0.28 }))); b.position.set((i - 2) * 0.55, E * 0.6 + 0.4, 0); s.g.add(b); });
      s.upd = t => { s.g.rotation.y = Math.sin(t * 0.25) * 0.7; }; out.push(s); }
    /* 3 锂离子电池剖面:石墨层 / 正极层,锂离子往返 */
    { const s = SC(), gm = reg(s, new THREE.MeshStandardMaterial({ color: 0x3a3f4a, roughness: 0.6 })), cm = reg(s, new THREE.MeshStandardMaterial({ color: 0x5a4a7a, roughness: 0.5 }));
      for (let i = 0; i < 6; i++) { const a = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.05, 1), gm); a.position.set(-1, -0.9 + i * 0.36, 0); s.g.add(a); const b = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.05, 1), cm); b.position.set(1, -0.9 + i * 0.36, 0); s.g.add(b); }
      const N = 14, pp = new Float32Array(N * 3), seeds = []; for (let i = 0; i < N; i++) seeds.push([rnd(), -0.8 + (i % 6) * 0.36, (rnd() - 0.5) * 0.8]);
      const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pp, 3));
      s.g.add(new THREE.Points(pg, reg(s, new THREE.PointsMaterial({ color: 0xffd27a, size: 0.13, blending: add, depthWrite: false }))));
      s.upd = t => { seeds.forEach((q, i) => { const k = 0.5 + 0.5 * Math.sin(t * 0.5 + q[0] * 6.283); pp.set([-1 + 2 * k, q[1], q[2]], i * 3); }); pg.attributes.position.needsUpdate = true; s.g.rotation.y = 0.5 + Math.sin(t * 0.2) * 0.3; }; out.push(s); }
    return out;
  }

  /* ---------- rocks(莫芙):三块岩石 → 冷却的岩浆 → 硅氧四面体 → 岩石循环环 ---------- */
  function rockScenes() {
    const out = [], add = THREE.AdditiveBlending;
    function lump(r, c, rough) { const g = new THREE.IcosahedronGeometry(r, 3), p = g.attributes.position, v = new THREE.Vector3(), k = rnd() * 5;
      for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); v.multiplyScalar(1 + 0.12 * Math.sin(v.x * 5 + k) * Math.cos(v.y * 4 + k)); p.setXYZ(i, v.x, v.y * 0.8, v.z); } g.computeVertexNormals();
      return new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: c, roughness: rough, flatShading: true })); }
    /* 0 三块岩石(岩浆岩、沉积岩、变质岩)缓缓转 */
    { const s = SC(); [[0xd8b8a8, -1.3], [0xd8b07a, 0], [0xeeeae4, 1.3]].forEach(([c, x]) => { const m = lump(0.5, c, 0.9); reg(s, m.material); m.position.x = x; s.g.add(m); });
      s.upd = t => { s.g.children.forEach((m, i) => { m.rotation.y = t * 0.3 + i; m.rotation.x = Math.sin(t * 0.4 + i) * 0.2; }); }; out.push(s); }
    /* 1 一团岩浆,表面逐渐长出晶粒 */
    { const s = SC(), m = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32), reg(s, new THREE.MeshStandardMaterial({ color: 0x3a2018, emissive: 0xff5a1a, emissiveIntensity: 1, roughness: 0.6 }))); s.g.add(m);
      const g = glowW(4.2); reg(s, g.material, 0.6); s.g.add(g);
      const N = 160, pp = new Float32Array(N * 3); for (let i = 0; i < N; i++) { const u = rnd() * 2 - 1, a = rnd() * 6.283, q = Math.sqrt(1 - u * u); pp.set([Math.cos(a) * q * 1.02, u * 1.02, Math.sin(a) * q * 1.02], i * 3); }
      const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pp, 3)); const pm = reg(s, new THREE.PointsMaterial({ color: 0xf0e6e0, size: 0.09, depthWrite: false })); s.g.add(new THREE.Points(pg, pm));
      s.upd = t => { const k = (t * 0.12) % 1; m.material.emissiveIntensity = 1.2 * (1 - k); pm.size = 0.04 + k * 0.12; s.g.rotation.y = t * 0.15; }; out.push(s); }
    /* 2 硅氧四面体 */
    { const s = SC(), si = new THREE.Mesh(new THREE.SphereGeometry(0.32, 32, 24), reg(s, new THREE.MeshStandardMaterial({ color: 0x9aa6b8, metalness: 0.4, roughness: 0.4 }))); s.g.add(si);
      const om = reg(s, new THREE.MeshStandardMaterial({ color: 0xff5a5a, roughness: 0.35 }), 0.95), bm = reg(s, new THREE.MeshBasicMaterial({ color: 0xd8d0e6 }), 0.5);
      [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]].forEach(d => { const v = new THREE.Vector3(...d).normalize().multiplyScalar(1.1); const o = new THREE.Mesh(new THREE.SphereGeometry(0.42, 32, 24), om); o.position.copy(v); s.g.add(o);
        const b = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.1, 8), bm); b.position.copy(v.clone().multiplyScalar(0.5)); b.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v.clone().normalize()); s.g.add(b); });
      s.upd = t => { s.g.rotation.y = t * 0.3; s.g.rotation.x = 0.4 + Math.sin(t * 0.2) * 0.2; }; out.push(s); }
    /* 3 岩石循环:一个环上三块岩石 + 一团岩浆,颗粒绕环流动 */
    { const s = SC(), R = 1.4, ring = new THREE.Mesh(new THREE.TorusGeometry(R, 0.03, 8, 120), reg(s, new THREE.MeshBasicMaterial({ color: 0xd8d0e6 }), 0.5)); s.g.add(ring);
      [[0xd8b8a8, 0], [0xd8b07a, 1.57], [0xc9a6ff, 3.14], [0xff6a2a, 4.71]].forEach(([c, a]) => { const m = lump(0.28, c, 0.8); reg(s, m.material); if (c === 0xff6a2a) { m.material.emissive = new THREE.Color(0xff4a10); m.material.emissiveIntensity = 0.8; } m.position.set(Math.cos(a) * R, Math.sin(a) * R, 0); s.g.add(m); });
      const N = 30, pp = new Float32Array(N * 3), pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pp, 3));
      s.g.add(new THREE.Points(pg, reg(s, new THREE.PointsMaterial({ color: 0xffd27a, size: 0.09, blending: add, depthWrite: false }))));
      s.upd = t => { for (let i = 0; i < N; i++) { const a = i / N * 6.283 - t * 0.4; pp.set([Math.cos(a) * R, Math.sin(a) * R, 0], i * 3); } pg.attributes.position.needsUpdate = true; s.g.rotation.x = 0.5; s.g.rotation.y = Math.sin(t * 0.2) * 0.4; }; out.push(s); }
    return out;
  }

  /* ---------- mars(奥加):火星 → 生锈的铁钉 → 光的指纹曲线 → 红皮灰心的岩芯 ---------- */
  function marsScenes() {
    const out = [], add = THREE.AdditiveBlending;
    { const s = SC(), m = new THREE.Mesh(new THREE.SphereGeometry(1.2, 64, 48), reg(s, new THREE.MeshStandardMaterial({ color: 0xc1562c, roughness: 0.95 }))); s.g.add(m);
      const cap = new THREE.Mesh(new THREE.SphereGeometry(1.205, 48, 16, 0, 6.283, 0, 0.32), reg(s, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 }))); s.g.add(cap);
      const g = glowSprite([[0, 'rgba(255,160,100,.35)'], [0.5, 'rgba(255,110,60,.08)'], [1, 'rgba(0,0,0,0)']], 4.2); reg(s, g.material); s.g.add(g);
      s.upd = t => { s.g.rotation.y = t * 0.08; s.g.rotation.z = 0.44; }; out.push(s); }
    { const s = SC(), nail = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 2.4, 16), reg(s, new THREE.MeshStandardMaterial({ color: 0x9aa0a8, metalness: 0.7, roughness: 0.4 }))); s.g.add(nail);
      const head = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.08, 24), nail.material); head.position.y = 1.22; s.g.add(head);
      const N = 120, pp = new Float32Array(N * 3); for (let i = 0; i < N; i++) { const a = rnd() * 6.283; pp.set([Math.cos(a) * 0.12, -1.1 + rnd() * 1.4, Math.sin(a) * 0.12], i * 3); }
      const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pp, 3)); const pm = reg(s, new THREE.PointsMaterial({ color: 0xc8643a, size: 0.09, depthWrite: false })); s.g.add(new THREE.Points(pg, pm));
      s.upd = t => { s.g.rotation.y = t * 0.3; s.g.rotation.z = 0.5; pm.size = 0.05 + 0.06 * (0.5 + 0.5 * Math.sin(t * 0.4)); }; out.push(s); }
    { const s = SC(), pts = []; for (let i = 0; i <= 60; i++) { const w = i / 60; pts.push(new THREE.Vector3(-1.8 + w * 3.6, -0.9 + 1.6 / (1 + Math.exp(-(w - 0.32) * 14)), 0)); }
      const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 120, 0.035, 8), reg(s, new THREE.MeshBasicMaterial({ color: 0xffd27a, blending: add }))); s.g.add(tube);
      const cols = [0x7a3cff, 0x3c6cff, 0x3cc8ff, 0x4cd060, 0xf0e040, 0xff9a30, 0xff3030]; cols.forEach((c, i) => { const b = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.06, 0.06), reg(s, new THREE.MeshBasicMaterial({ color: c }), 0.8)); b.position.set(-1.8 + 0.17 + i * 0.34, -1.15, 0); s.g.add(b); });
      s.upd = t => { s.g.rotation.y = Math.sin(t * 0.2) * 0.35; }; out.push(s); }
    { const s = SC(), core = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 1.8, 32), reg(s, new THREE.MeshStandardMaterial({ color: 0x5a5654, roughness: 0.9 }))); s.g.add(core);
      const skin = new THREE.Mesh(new THREE.CylinderGeometry(0.47, 0.47, 0.12, 32), reg(s, new THREE.MeshStandardMaterial({ color: 0xb4552c, roughness: 1 }))); skin.position.y = 0.92; s.g.add(skin);
      const fe = glowSprite([[0, 'rgba(255,220,160,.9)'], [0.3, 'rgba(255,160,80,.4)'], [1, 'rgba(0,0,0,0)']], 1.2); reg(s, fe.material); fe.position.set(0, 1.9, 0); s.g.add(fe);
      s.upd = t => { s.g.rotation.y = t * 0.25; s.g.rotation.x = 0.35; fe.position.y = 1.9 - ((t * 0.15) % 1) * 0.9; }; out.push(s); }
    return out;
  }

  /* ---------- titan(奥加):裹着雾的土卫六 → 甲烷云与雨 → 越拼越长的碳链 → 降落伞下的探测器与冰卵石 ---------- */
  function titanScenes() {
    const out = [], add = THREE.AdditiveBlending;
    { const s = SC(), m = new THREE.Mesh(new THREE.SphereGeometry(1.2, 64, 48), reg(s, new THREE.MeshStandardMaterial({ color: 0xd88a30, roughness: 1 }))); s.g.add(m);
      const hz = new THREE.Mesh(new THREE.SphereGeometry(1.32, 48, 32), reg(s, new THREE.MeshBasicMaterial({ color: 0xffb050, side: THREE.BackSide }), 0.22)); s.g.add(hz);
      const g = glowSprite([[0, 'rgba(255,180,90,.4)'], [0.5, 'rgba(255,140,60,.1)'], [1, 'rgba(0,0,0,0)']], 4.4); reg(s, g.material); s.g.add(g);
      s.upd = t => { s.g.rotation.y = t * 0.06; }; out.push(s); }
    { const s = SC(), cl = new THREE.Group(); [[-0.6, 0.9, 0.5], [0.2, 1.05, 0.65], [0.9, 0.85, 0.45]].forEach(([x, y, r]) => { const c = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 14), reg(s, new THREE.MeshStandardMaterial({ color: 0x5a4030, roughness: 1 }), 0.9)); c.position.set(x, y, 0); c.scale.y = 0.5; cl.add(c); }); s.g.add(cl);
      const lake = new THREE.Mesh(new THREE.CircleGeometry(1.4, 48), reg(s, new THREE.MeshStandardMaterial({ color: 0x1a1410, roughness: 0.1, metalness: 0.3 }))); lake.rotation.x = -Math.PI / 2; lake.position.y = -1.1; s.g.add(lake);
      const N = 60, pp = new Float32Array(N * 3); for (let i = 0; i < N; i++) pp.set([-1.2 + rnd() * 2.4, rnd() * 1.8 - 1, rnd() * 0.6 - 0.3], i * 3);
      const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pp, 3)); const pm = reg(s, new THREE.PointsMaterial({ color: 0xffd08a, size: 0.07, depthWrite: false })); const rain = new THREE.Points(pg, pm); s.g.add(rain);
      s.upd = t => { rain.position.y = -((t * 0.25) % 0.9); s.g.rotation.y = Math.sin(t * 0.15) * 0.4; }; out.push(s); }
    { const s = SC(), c = reg(s, new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.4 })), n = reg(s, new THREE.MeshStandardMaterial({ color: 0x7a8cff, roughness: 0.4 })), sp = new THREE.SphereGeometry(0.16, 18, 12);
      for (let i = 0; i < 14; i++) { const m = new THREE.Mesh(sp, i % 5 === 4 ? n : c); m.position.set(Math.cos(i * 0.9) * (0.4 + i * 0.07), (i - 7) * 0.16, Math.sin(i * 0.9) * (0.4 + i * 0.07)); s.g.add(m); }
      const g = glowSprite([[0, 'rgba(255,170,80,.5)'], [0.5, 'rgba(255,120,40,.12)'], [1, 'rgba(0,0,0,0)']], 3); reg(s, g.material); s.g.add(g);
      s.upd = t => { s.g.rotation.y = t * 0.3; }; out.push(s); }
    { const s = SC(), probe = new THREE.Group();
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.4, 0.14, 24), reg(s, new THREE.MeshStandardMaterial({ color: 0xc8b89a, metalness: 0.4, roughness: 0.5 }))); probe.add(body);
      const chute = new THREE.Mesh(new THREE.SphereGeometry(0.75, 24, 12, 0, 6.283, 0, 1.2), reg(s, new THREE.MeshStandardMaterial({ color: 0xd07a3a, roughness: 0.8, side: THREE.DoubleSide }))); chute.position.y = 1.3; probe.add(chute);
      const lm = reg(s, new THREE.LineBasicMaterial({ color: 0xf0dcc8 }), 0.6); for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283, lg = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0.07, 0), new THREE.Vector3(Math.cos(a) * 0.68, 0.95, Math.sin(a) * 0.68)]); probe.add(new THREE.Line(lg, lm)); }
      s.g.add(probe);
      const pb = reg(s, new THREE.MeshStandardMaterial({ color: 0xd8d2c6, roughness: 0.7 })); for (let i = 0; i < 9; i++) { const p = new THREE.Mesh(new THREE.SphereGeometry(0.08 + rnd() * 0.1, 12, 8), pb); p.scale.y = 0.6; p.position.set(-1.2 + rnd() * 2.4, -1.25, -0.4 + rnd() * 0.8); s.g.add(p); }
      s.upd = t => { probe.position.y = 0.3 - ((t * 0.08) % 1) * 0.9; probe.rotation.y = t * 0.2; }; out.push(s); }
    return out;
  }

  /* 关卡切换:旧场景放大淡出、新场景从远处浮现 */
  let cur = EF.level || 0, flash = 0;
  EF.onLevel = i => { cur = Math.max(0, Math.min(LV.length - 1, i)); };
  EF.onComplete = () => { flash = 1; };
  const wide = () => camera.aspect > 1.2;
  gl.onFrame((t, dt) => {
    LV.forEach((s, k) => {
      s.a += ((k === cur ? 1 : 0) - s.a) * (EF.reduced ? 1 : 1 - Math.exp(-dt * 2.5));
      setA(s, s.a); if (!s.g.visible) return;
      const sc = k === cur ? 0.7 + 0.3 * ease(s.a) : 1 + (1 - s.a) * 1.5;
      s.g.scale.setScalar(sc * (1 + flash * 0.06));
      s.g.position.x = wide() ? 1.4 : 0; s.g.position.y = wide() ? 0 : 1.2;
      if (s.upd) s.upd(EF.reduced ? 0 : t, dt);
    });
    flash *= 0.95; stars.rotation.y = t * 0.004;
    camera.position.z = wide() ? 7 : 9;
  });
}
