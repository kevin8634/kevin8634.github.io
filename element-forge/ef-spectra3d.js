/* 元素工坊 Element Forge · spectra 任务 3D 玩法 ef-spectra3d.js v0.11(导出 EF.P3;EF.S3 已被 stars 使用)
   「隔着几百光年,怎么知道一颗星球的空气?」
   L0 三棱镜分光:白光射入玻璃三棱镜,扇形彩虹里被吸走的颜色是一道道暗缝(1868 年日食切换为日珥亮线)。
   L1 分子的指纹:三窗联动的"看不见"窗换成 3D 球棍分子(水、二氧化碳、甲烷),红外光对上振动模式时分子振动。
   L2 凌星:3D 恒星(程序米粒组织)+ 带大气光晕的黑色行星 + 金色六边形镜面望远镜;拖动画面移动行星。
   L3 读空气:同一舞台,行星停在凌星中,配合透射光谱与分子卡槽。
   状态与判定全部由页面里的 EF.SP 控制器负责(与平面版共用);低档或出错时回落 spectra/index.html 平面版。
   减少动态:不自转、分子不振动(改为静止的振动姿态 + 光环)、恒星表面不流动。 */
import { THREE, glowSprite, starMaterial, fresnelMaterial } from './ef-gl.js?v=2';
const EF = window.EF, SP = EF.SP;
const RM = () => EF.reduced;

function stage3d(parent, opt = {}) {
  const h = opt.h || (EF.mobile ? 300 : 360);
  document.body.classList.add('stage3d');
  const wrap = document.createElement('div'); wrap.className = 's3d'; wrap.style.height = h + 'px'; if (opt.fixed) wrap.style.cursor = 'ew-resize'; parent.appendChild(wrap);
  const renderer = new THREE.WebGLRenderer({ antialias: EF.glTier === 'high', alpha: true });
  renderer.setPixelRatio(EF.dpr()); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.setClearColor(0x000000, 0);
  wrap.appendChild(renderer.domElement);
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(40, 1, 0.05, 200);
  scene.add(new THREE.AmbientLight(0xb0b8d8, 0.6));
  const key = new THREE.DirectionalLight(0xfff0e0, 2.4); key.position.set(-3, 3, 4); scene.add(key);
  const rim = new THREE.DirectionalLight(0xffa040, 1.2); rim.position.set(4, 1, -3); scene.add(rim);
  const o = { wrap, renderer, scene, camera, cbs: [], yaw: opt.yaw || 0, pitch: opt.pitch || 0.12, key, rim };
  function rs() { const w = wrap.clientWidth || 300, hh = wrap.clientHeight || h; renderer.setSize(w, hh, false); camera.aspect = w / hh; camera.updateProjectionMatrix(); }
  rs(); const ro = window.ResizeObserver ? new ResizeObserver(rs) : null; if (ro) ro.observe(wrap); else addEventListener('resize', rs);
  if (!opt.fixed) {
    let down = null;
    wrap.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY, yaw: o.yaw, pitch: o.pitch }; wrap.setPointerCapture && wrap.setPointerCapture(e.pointerId); });
    wrap.addEventListener('pointermove', e => { if (!down) return; o.yaw = Math.max(-0.8, Math.min(0.8, down.yaw + (e.clientX - down.x) * 0.006)); o.pitch = Math.max(-0.5, Math.min(0.7, down.pitch + (e.clientY - down.y) * 0.005)); });
    wrap.addEventListener('pointerup', () => { down = null; }); wrap.addEventListener('pointercancel', () => { down = null; });
  }
  let last = performance.now();
  function frame(now) {
    if (!wrap.isConnected) { if (ro) ro.disconnect(); renderer.dispose(); renderer.forceContextLoss(); return; }
    requestAnimationFrame(frame);
    if (document.hidden || !wrap.clientWidth) { last = now; return; }
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    for (const f of o.cbs) f(now / 1000, dt);
    renderer.render(scene, camera);
  }
  o.onFrame = f => o.cbs.push(f);
  o.orbit = (dist, tx = 0, ty = 0) => { camera.position.set(tx + Math.sin(o.yaw) * Math.cos(o.pitch) * dist, ty + Math.sin(o.pitch) * dist, Math.cos(o.yaw) * Math.cos(o.pitch) * dist); camera.lookAt(tx, ty, 0); };
  requestAnimationFrame(frame);
  return o;
}
function label(text, opt = {}) {
  const fs = 44, c = document.createElement('canvas'), x = c.getContext('2d'), F = '700 ' + fs + 'px system-ui,"PingFang SC","Noto Sans SC",sans-serif';
  x.font = F; const w = Math.ceil(x.measureText(text).width) + 34; c.width = w; c.height = fs + 24; x.font = F; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillStyle = 'rgba(8,10,26,.82)'; x.beginPath(); x.roundRect ? x.roundRect(1, 1, w - 2, c.height - 2, 16) : x.rect(1, 1, w - 2, c.height - 2); x.fill(); x.strokeStyle = 'rgba(255,170,80,.85)'; x.lineWidth = 2.5; x.stroke();
  x.fillStyle = opt.color || '#f4ede1'; x.fillText(text, w / 2, c.height / 2 + 2);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false, depthWrite: false }));
  const k = (opt.size || 0.2) * (EF.mobile ? 1.3 : 1) / c.height; s.scale.set(w * k, c.height * k, 1); s.renderOrder = 5; return s;
}
function starfield(scene, n = 500, r0 = 18) {
  const r = SP.rnd(91), pp = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) pp.set([(r() - 0.5) * r0 * 3, (r() - 0.5) * r0 * 1.6, -r0 - r() * 10], i * 3);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pp, 3));
  const p = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xfff1dc, size: 0.07, transparent: true, opacity: 0.8, depthWrite: false })); scene.add(p); return p;
}
const fit = (S, d, a0) => d * Math.max(1, a0 / S.camera.aspect);

/* ---------- L0 三棱镜分光 ---------- */
function fanTex(ph) {
  const c = document.createElement('canvas'); c.width = 8; c.height = 600; const x = c.getContext('2d');
  x.fillStyle = '#000'; x.fillRect(0, 0, 8, 600);
  const L = SP.LINES[ph];
  for (let y = 0; y < 600; y++) {
    const nm = 700 - y / 600 * 300; let dark = false, bright = false;
    L.forEach(l => { if (Math.abs(l.nm - nm) < l.w * 0.9) { if (ph === 0) dark = true; else bright = true; } });
    if (ph === 0 && !dark) { x.fillStyle = SP.css(SP.wl(nm)); x.fillRect(0, y, 8, 1); }
    if (ph === 1 && bright) { x.fillStyle = SP.css(SP.wl(nm)); x.fillRect(0, y - 1, 8, 3); }
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.magFilter = THREE.LinearFilter; return t;
}
function prismView() {
  let S, st, ph = -1, fanM, beamM, beam, lab0, lab1, labA, labB;
  return {
    mount(host, s) {
      st = s; S = stage3d(host, { h: EF.mobile ? 260 : 330, pitch: 0.06 }); starfield(S.scene, 300);
      const P = new THREE.Group(); P.position.set(-1.7, -0.1, 0); S.scene.add(P);
      const tri = new THREE.Shape(); tri.moveTo(0, 0.95); tri.lineTo(-0.85, -0.55); tri.lineTo(0.85, -0.55); tri.closePath();
      const pg = new THREE.ExtrudeGeometry(tri, { depth: 0.9, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 2 }); pg.translate(0, 0, -0.45);
      P.add(new THREE.Mesh(pg, new THREE.MeshStandardMaterial({ color: 0xfff4e0, transparent: true, opacity: 0.22, roughness: 0.05, metalness: 0.1, emissive: 0x3a2a10, depthWrite: false })));
      P.add(new THREE.LineSegments(new THREE.EdgesGeometry(pg, 30), new THREE.LineBasicMaterial({ color: 0xffd9a0, transparent: true, opacity: 0.9 })));
      const gl = glowSprite([[0, 'rgba(255,220,160,.55)'], [0.4, 'rgba(255,170,80,.18)'], [1, 'rgba(0,0,0,0)']], 2.6); P.add(gl);
      /* 白光(或日珥的光)射入 */
      const a = new THREE.Vector3(-5.2, -1.15, 0), b = new THREE.Vector3(-2.05, 0.0, 0), d = b.clone().sub(a);
      beamM = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false });
      beam = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, d.length(), 12), beamM); beam.position.copy(a.clone().add(b).multiplyScalar(0.5)); beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); S.scene.add(beam);
      const bg = glowSprite([[0, 'rgba(255,255,240,.7)'], [1, 'rgba(0,0,0,0)']], 0.8); bg.position.copy(b); S.scene.add(bg);
      /* 扇形彩虹:每个颜色朝一个方向走;暗缝 = 被吸收的颜色(加色混合,暗处透出背景) */
      const fg = new THREE.BufferGeometry(), x0 = -1.45, x1 = 3.6;
      fg.setAttribute('position', new THREE.BufferAttribute(new Float32Array([x0, 0.12, 0, x0, -0.02, 0, x1, -1.25, 0, x1, 1.45, 0]), 3));
      fg.setAttribute('uv', new THREE.BufferAttribute(new Float32Array([0.5, 1, 0.5, 0, 0.5, 0, 0.5, 1]), 2)); fg.setIndex([0, 1, 2, 0, 2, 3]);
      fanM = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
      S.scene.add(new THREE.Mesh(fg, fanM));
      lab0 = label('太阳光 → 三棱镜', { size: 0.34 }); lab0.position.set(-1.7, -1.05, 0.4); S.scene.add(lab0);
      lab1 = label('1868 年日食 · 日珥的光', { size: 0.34 }); lab1.position.set(-1.7, -1.05, 0.4); S.scene.add(lab1);
      labA = label('黑线 = 被"吸走"的颜色', { size: 0.34 }); labA.position.set(1.6, 1.45, 0.2); S.scene.add(labA);
      labB = label('亮线 = 气体自己发出的颜色', { size: 0.34 }); labB.position.set(1.6, 1.45, 0.2); S.scene.add(labB);
      S.onFrame((t, dt) => {
        if (st.ph !== ph) { ph = st.ph; if (fanM.map) fanM.map.dispose(); fanM.map = fanTex(ph); fanM.needsUpdate = true; beamM.color.set(ph ? 0xffa060 : 0xffffff); lab0.visible = !ph; lab1.visible = !!ph; labA.visible = !ph; labB.visible = !!ph; }
        if (!RM()) { gl.material.opacity = 0.8 + 0.2 * Math.sin(t * 2); P.rotation.y = Math.sin(t * 0.4) * 0.08; }
        S.orbit(fit(S, 7.4, 1.9), 0, 0.1);
      });
    },
    draw(s) { st = s; }
  };
}

/* ---------- L1 3D 球棍分子 ---------- */
const UP = new THREE.Vector3(0, 1, 0);
function molecule(k) {
  const M = SP.MOL[k], g = new THREE.Group(), atoms = [], bonds = [];
  M.at.forEach(a => { const r = a[0] === 'H' ? 0.2 : 0.3; const m = new THREE.Mesh(new THREE.SphereGeometry(r, 28, 20), new THREE.MeshStandardMaterial({ color: SP.ACOL[a[0]], roughness: 0.3, metalness: 0.05, emissive: a[0] === 'C' ? 0x111111 : 0x000000 })); g.add(m); atoms.push(m); });
  const bm = new THREE.MeshStandardMaterial({ color: 0xdedee8, roughness: 0.4 });
  M.b.forEach(b => { for (let j = 0; j < b[2]; j++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1, 10), bm); g.add(c); bonds.push({ c, i: b[0], j: b[1], off: b[2] === 2 ? (j ? 0.07 : -0.07) : 0 }); } });
  const P = M.at.map(() => new THREE.Vector3()), tmp = new THREE.Vector3(), side = new THREE.Vector3(0, 0, 1);
  function pose(mode, amp) {
    const D = mode ? M.modes[mode] : null;
    M.at.forEach((a, i) => { P[i].set(a[1] + (D ? D[i][0] * amp : 0), a[2] + (D ? D[i][1] * amp : 0), a[3] + (D ? D[i][2] * amp : 0)); atoms[i].position.copy(P[i]); });
    bonds.forEach(B => { const p = P[B.i], q = P[B.j]; tmp.subVectors(q, p); const L = tmp.length(); const n = tmp.clone().normalize();
      const o = new THREE.Vector3().crossVectors(n, side).normalize().multiplyScalar(B.off);
      B.c.position.copy(p).add(q).multiplyScalar(0.5).add(o); B.c.quaternion.setFromUnitVectors(UP, n); B.c.scale.set(1, L, 1); });
  }
  pose(null, 0); return { g, pose };
}
function molView() {
  let S, st = { hit: -1, lam: 10 };
  return {
    mount(host) {
      S = stage3d(host, { h: 250, pitch: 0.1 });
      const POS = { w: [-1.5, 1.3], c: [0, 0.05], m: [1.55, -1.3] }, MS = {};
      Object.keys(SP.MOL).forEach(k => { const m = molecule(k); m.g.position.set(POS[k][0], POS[k][1], 0); S.scene.add(m.g);
        const tag = label(SP.MOL[k].n + ' ' + SP.MOL[k].f, { size: 0.32 }); tag.position.set(POS[k][0], POS[k][1] + (k === 'w' ? 0.75 : k === 'c' ? -0.62 : -0.95), 0.3); S.scene.add(tag);
        const ring = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.025, 8, 64), new THREE.MeshBasicMaterial({ color: 0xff8a3a, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })); ring.position.copy(m.g.position); S.scene.add(ring);
        MS[k] = { m, ring, a: 0 }; });
      /* 红外波:从右上方射来的一串发光点 */
      const N = 140, pp = new Float32Array(N * 3), wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.BufferAttribute(pp, 3));
      const wave = new THREE.Points(wg, new THREE.PointsMaterial({ color: 0xff5a3a, size: 0.09, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false })); S.scene.add(wave);
      S.onFrame((t, dt) => {
        const B = st.hit >= 0 ? SP.BANDS[st.hit] : null;
        Object.keys(MS).forEach(k => { const o = MS[k], on = B && B.m === k; o.a += ((on ? 1 : 0) - o.a) * (RM() ? 1 : Math.min(1, dt * 5));
          const amp = on ? (RM() ? 0.9 : Math.sin(t * 16) * o.a * 1.1) : 0; o.m.pose(on ? B.mode : null, amp);
          o.ring.material.opacity = o.a * 0.6; o.ring.scale.setScalar(1 + (RM() ? 0 : 0.06 * Math.sin(t * 4)));
          if (!RM()) o.m.g.rotation.y += dt * (on ? 0.15 : 0.35); });
        const tgt = B ? MS[B.m].m.g.position : new THREE.Vector3(0.4, 0.4, 0), from = new THREE.Vector3(3.2, 2.3, 0.4), dir = tgt.clone().sub(from), len = dir.length() * 0.78; dir.normalize();
        const nrm = new THREE.Vector3(-dir.y, dir.x, 0), k2 = 6.283 / (0.18 + st.lam * 0.07);
        for (let i = 0; i < N; i++) { const u = i / (N - 1) * len, a = Math.sin(u * k2 - (RM() ? 0 : t * 6)) * 0.16; pp.set([from.x + dir.x * u + nrm.x * a, from.y + dir.y * u + nrm.y * a, from.z], i * 3); }
        wg.attributes.position.needsUpdate = true; wave.material.opacity = B ? 1 : 0.55;
        S.orbit(fit(S, 8.4, 1.25), 0, 0);
      });
    },
    draw(s) { st = s; }
  };
}

/* ---------- L2/L3 凌星舞台:恒星 + 行星(带大气光晕)+ 六边形镜面望远镜 ---------- */
function telescope() {
  const T = new THREE.Group(), gold = new THREE.MeshStandardMaterial({ color: 0xffc04a, metalness: 0.9, roughness: 0.22, emissive: 0x6a3a08, emissiveIntensity: 0.7 });
  const hex = new THREE.CylinderGeometry(0.2, 0.2, 0.04, 6), mirror = new THREE.Group();
  const cells = []; for (let q = -2; q <= 2; q++) for (let r = -2; r <= 2; r++) { const s = -q - r; if (Math.max(Math.abs(q), Math.abs(r), Math.abs(s)) > 2 || (q === 0 && r === 0)) continue; cells.push([q, r]); }
  cells.forEach(([q, r]) => { const m = new THREE.Mesh(hex, gold); m.rotation.x = Math.PI / 2; m.rotation.y = Math.PI / 6; m.position.set(0.36 * (q + r / 2), 0.36 * Math.sqrt(3) / 2 * r, 0); mirror.add(m); });
  mirror.add(new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.06, 16).rotateX(Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x222228 })));
  T.add(mirror);
  const strutM = new THREE.MeshStandardMaterial({ color: 0x8a8a96, metalness: 0.6, roughness: 0.4 }), tip = new THREE.Vector3(0, 0, 1.1);
  [[0, 0.95, 0], [-0.82, -0.48, 0], [0.82, -0.48, 0]].forEach(p => { const a = new THREE.Vector3(...p), d = tip.clone().sub(a); const c = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, d.length(), 6), strutM); c.position.copy(a.clone().add(tip).multiplyScalar(0.5)); c.quaternion.setFromUnitVectors(UP, d.normalize()); T.add(c); });
  const sec = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 8), gold); sec.position.copy(tip); T.add(sec);
  const sh = new THREE.Shape(); sh.moveTo(-1.6, 0); sh.lineTo(0, 0.7); sh.lineTo(1.6, 0); sh.lineTo(0, -0.7); sh.closePath();
  for (let i = 0; i < 5; i++) { const m = new THREE.Mesh(new THREE.ShapeGeometry(sh), new THREE.MeshStandardMaterial({ color: i ? 0x9a90b8 : 0xc8b8e8, metalness: 0.7, roughness: 0.35, emissive: 0x2a1a30, side: THREE.DoubleSide, transparent: true, opacity: 0.92 })); m.rotation.x = -Math.PI / 2; m.position.set(0, -1.05 - i * 0.06, 0.25); T.add(m); }
  const tw = glowSprite([[0, 'rgba(255,200,110,.45)'], [1, 'rgba(0,0,0,0)']], 2.6); tw.position.z = -0.1; T.add(tw);
  return T;
}
function transitView(opt = {}) {
  let S, st, mode = -1;
  const SX = -0.7, RS = 1.75, PZ = 2.2;
  return {
    mount(host, s, ctlApi) {
      st = s; S = stage3d(host, { h: opt.h || (EF.mobile ? 280 : 360), fixed: !!ctlApi }); starfield(S.scene, 500);
      S.key.position.set(-6, 1, 3); S.key.color.set(0xffc080); S.key.intensity = 2.6;
      const sm = starMaterial(), star = new THREE.Mesh(new THREE.SphereGeometry(RS, 96, 64), sm); star.position.set(SX, 0, 0); S.scene.add(star);
      const sg = glowSprite([[0, 'rgba(255,190,90,.8)'], [0.3, 'rgba(255,130,40,.35)'], [0.65, 'rgba(255,90,20,.08)'], [1, 'rgba(0,0,0,0)']], RS * 5.2); sg.position.copy(star.position); S.scene.add(sg);
      const rp = SP.RP[0] * RS, ra = SP.RP[1] * RS;
      const planet = new THREE.Group(); S.scene.add(planet);
      planet.add(new THREE.Mesh(new THREE.SphereGeometry(rp, 48, 32), new THREE.MeshStandardMaterial({ color: 0x050508, roughness: 0.8 })));
      const halo = new THREE.Mesh(new THREE.SphereGeometry(ra * 1.02, 48, 32), fresnelMaterial(0x9ad0ff, 1.6, 0.02)); planet.add(halo);
      const ring = new THREE.Mesh(new THREE.RingGeometry(rp * 0.98, ra, 64), new THREE.MeshBasicMaterial({ color: 0x0a0608, transparent: true, opacity: 0, depthWrite: false })); planet.add(ring);
      const rim = new THREE.Mesh(new THREE.RingGeometry(ra * 0.985, ra * 1.06, 96), new THREE.MeshBasicMaterial({ color: 0xffe2a0, transparent: true, opacity: 0.9, depthWrite: false })); rim.position.z = 0.01; planet.add(rim);
      const aur = glowSprite([[0, 'rgba(0,0,0,0)'], [0.36, 'rgba(0,0,0,0)'], [0.42, 'rgba(255,190,120,.9)'], [0.5, 'rgba(255,120,40,.35)'], [0.62, 'rgba(255,90,20,0)'], [1, 'rgba(0,0,0,0)']], ra * 2.9); planet.add(aur);
      const T = telescope(); T.scale.setScalar(0.9); T.position.set(3.35, -0.1, 0.6); T.rotation.set(0.15, -0.55, 0); S.scene.add(T);
      const tS = label('恒星', { size: 0.36 }); tS.position.set(SX - 1.35, -1.45, 2.2); S.scene.add(tS);
      const tT = label('太空望远镜', { size: 0.36 }); tT.position.set(3.35, -1.65, 1.2); S.scene.add(tT);
      const tA = label('星光穿过行星边缘的大气', { size: 0.34 }); S.scene.add(tA);
      /* 拖动画面移动行星 */
      if (ctlApi) {
        const ray = new THREE.Raycaster(), plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -PZ), v = new THREE.Vector3(), ndc = new THREE.Vector2(); let dn = false;
        const mv = e => { const r = S.wrap.getBoundingClientRect(); ndc.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1); ray.setFromCamera(ndc, S.camera); if (ray.ray.intersectPlane(plane, v)) { const k = (S.camera.position.z - PZ) / S.camera.position.z; const cx = S.camera.position.x; ctlApi.setP((cx + (v.x - cx) / k - SX) / RS); } };
        S.wrap.addEventListener('pointerdown', e => { dn = true; S.wrap.setPointerCapture && S.wrap.setPointerCapture(e.pointerId); mv(e); });
        S.wrap.addEventListener('pointermove', e => { if (dn) mv(e); });
        S.wrap.addEventListener('pointerup', () => { dn = false; }); S.wrap.addEventListener('pointercancel', () => { dn = false; });
      }
      S.onFrame((t, dt) => {
        const cx = S.camera.aspect < 1.6 ? 0.9 : 0.5; S.camera.position.set(cx, 0.2, fit(S, 9.2, 1.45)); S.camera.lookAt(cx, 0, 0);
        sm.uniforms.uT.value = RM() ? 0 : t;
        const p = opt.park ? (RM() ? 0.18 : 0.18 + Math.sin(t * 0.25) * 0.22) : st.p;
        const m = opt.park ? 1 : st.m;
        planet.position.z = PZ;
        /* 相机在 z 前方:为让行星"盖在"恒星前面,行星放在更靠近相机的平面上;按透视缩放回恒星平面上的视位置 */
        const camZ = S.camera.position.z, k = (camZ - PZ) / camZ; planet.position.x = cx + (SX + p * RS - cx) * k; planet.position.y = 0.2 + (0.05 - 0.2) * k; planet.scale.setScalar(k);
        if (m !== mode) { mode = m; ring.material.opacity = m ? 0.88 : 0; halo.material.uniforms.uC.value.set(m ? 0xff8a3a : 0x9ad0ff); rim.material.opacity = m ? 0.95 : 0.7; rim.material.color.set(m ? 0xffd27a : 0xbfe3ff); rim.scale.setScalar(m ? 1 : rp / ra); aur.material.opacity = m ? 1 : 0.45; aur.material.color.set(m ? 0xffffff : 0x9ad0ff); tA.visible = !!m; }
        tA.position.set(planet.position.x, planet.position.y + ra * k + 0.42, PZ + 0.2);
        if (!RM()) { star.rotation.y = t * 0.03; T.rotation.y = -0.55 + Math.sin(t * 0.3) * 0.05; }
      });
    },
    draw(s) { st = s; }
  };
}

function L0(stage, api) { SP.lines(stage, api, prismView()); }
function L1(stage, api) { SP.ir(stage, api, molView()); }
function L2(stage, api) { SP.transit(stage, api, transitView()); }
function L3(stage, api) { SP.read(stage, api, transitView({ park: true, h: EF.mobile ? 230 : 300 })); }
EF.P3 = { L0, L1, L2, L3 };
