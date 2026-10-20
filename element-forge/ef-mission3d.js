/* 元素工坊 Element Forge · 任务页 3D 舞台背景 v0.3
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

  const LV = EF.missionId === 'carbon' ? carbonScenes() : starScenes();
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
    function graphite(s) { const layers = [-0.75, 0, 0.75].map((y, k) => { const sh = sheet(k % 2 ? 0.42 * Math.sqrt(3) / 2 : 0, y); const g = build(s, sh.at, sh.b, 0.075, 0.022); s.g.add(g); return g; }); return layers; }
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
