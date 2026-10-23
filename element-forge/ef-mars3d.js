/* 元素工坊 Element Forge · mars 任务 3D 玩法 ef-mars3d.js v0.9
   「火星为什么是红的?」:L0 红色藏在哪一层?(3D 尺度镜:火星 → 地表 → 尘粒 → 原子,可拖动转看)。
   状态与判定由页面里的 EF.MR.lens 控制器负责(与平面版共用);低档或出错时回落 mars/index.html 平面版。
   减少动态:不自转、不过渡。 */
import { THREE } from './ef-gl.js?v=2';
const EF = window.EF, MR = EF.MR;
const RM = () => EF.reduced;

function stage3d(parent, opt = {}) {
  const h = opt.h || (EF.mobile ? 320 : 380);
  document.body.classList.add('stage3d');
  const wrap = document.createElement('div'); wrap.className = 's3d'; wrap.style.height = h + 'px'; parent.appendChild(wrap);
  const renderer = new THREE.WebGLRenderer({ antialias: EF.glTier === 'high', alpha: true });
  renderer.setPixelRatio(EF.dpr()); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.setClearColor(0x000000, 0);
  wrap.appendChild(renderer.domElement);
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(40, 1, 0.05, 200);
  scene.add(new THREE.AmbientLight(0xc8b0a0, 0.7));
  const key = new THREE.DirectionalLight(0xfff0e0, 2.6); key.position.set(3, 4, 4); scene.add(key);
  const rim = new THREE.DirectionalLight(0xff9a5c, 1.0); rim.position.set(-4, 1, -3); scene.add(rim);
  const o = { wrap, renderer, scene, camera, cbs: [], yaw: 0.3, pitch: 0.25 };
  function rs() { const w = wrap.clientWidth || 300, hh = wrap.clientHeight || h; renderer.setSize(w, hh, false); camera.aspect = w / hh; camera.updateProjectionMatrix(); }
  rs(); const ro = window.ResizeObserver ? new ResizeObserver(rs) : null; if (ro) ro.observe(wrap); else addEventListener('resize', rs);
  let down = null;
  wrap.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY, yaw: o.yaw, pitch: o.pitch }; wrap.setPointerCapture && wrap.setPointerCapture(e.pointerId); });
  wrap.addEventListener('pointermove', e => { if (!down) return; o.yaw = down.yaw + (e.clientX - down.x) * 0.009; o.pitch = Math.max(-0.9, Math.min(1.1, down.pitch + (e.clientY - down.y) * 0.007)); });
  wrap.addEventListener('pointerup', () => { down = null; }); wrap.addEventListener('pointercancel', () => { down = null; });
  let last = performance.now();
  function frame(now) {
    if (!wrap.isConnected) { if (ro) ro.disconnect(); renderer.dispose(); renderer.forceContextLoss(); return; }
    requestAnimationFrame(frame);
    if (document.hidden) { last = now; return; }
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
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
  x.fillStyle = 'rgba(20,10,8,.8)'; x.beginPath(); x.roundRect ? x.roundRect(1, 1, w - 2, c.height - 2, 14) : x.rect(1, 1, w - 2, c.height - 2); x.fill(); x.strokeStyle = 'rgba(255,170,90,.7)'; x.lineWidth = 2; x.stroke();
  x.fillStyle = opt.color || '#f4ede1'; x.fillText(text, w / 2, c.height / 2 + 2);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false, depthWrite: false }));
  const k = (opt.size || 0.2) / c.height; s.scale.set(w * k, c.height * k, 1); s.renderOrder = 5; return s;
}
function marsTex() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 256; const x = c.getContext('2d'), r = MR.rnd(21);
  const g = x.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, '#d89a70'); g.addColorStop(0.5, '#c1562c'); g.addColorStop(1, '#a8552e'); x.fillStyle = g; x.fillRect(0, 0, 512, 256);
  for (let i = 0; i < 160; i++) { x.fillStyle = `rgba(${60 + r() * 50 | 0},${20 + r() * 20 | 0},10,${0.1 + r() * 0.25})`; x.beginPath(); x.ellipse(r() * 512, 40 + r() * 176, 6 + r() * 40, 3 + r() * 14, r() * 3, 0, 7); x.fill(); }
  for (let i = 0; i < 60; i++) { x.strokeStyle = 'rgba(40,14,8,.35)'; x.beginPath(); x.arc(r() * 512, 30 + r() * 200, 2 + r() * 7, 0, 7); x.stroke(); }
  x.fillStyle = 'rgba(255,255,255,.9)'; x.fillRect(0, 0, 512, 12); x.fillStyle = 'rgba(255,255,255,.7)'; x.fillRect(0, 248, 512, 8);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function lump(rad, col, seed) {
  const g = new THREE.IcosahedronGeometry(rad, 2), p = g.attributes.position, v = new THREE.Vector3(), r = MR.rnd(seed), k = r() * 5;
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); v.multiplyScalar(1 + 0.18 * Math.sin(v.x * 7 / rad + k) * Math.cos(v.y * 6 / rad + k)); p.setXYZ(i, v.x, v.y * 0.75, v.z); }
  g.computeVertexNormals(); return new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: col, roughness: 0.9, flatShading: true }));
}

/* ---------- L0 3D 尺度镜 ---------- */
function L0(stage, api) {
  let S, st = { k: 0, ok: {} }, shown = 0;
  const G = [];
  const view = {
    mount(stage) {
      S = stage3d(stage, { h: EF.mobile ? 320 : 380 });
      /* 0 火星 */
      { const g = new THREE.Group(); g.add(new THREE.Mesh(new THREE.SphereGeometry(1.2, 64, 48), new THREE.MeshStandardMaterial({ map: marsTex(), roughness: 0.95 })));
        const atm = new THREE.Mesh(new THREE.SphereGeometry(1.26, 48, 32), new THREE.MeshBasicMaterial({ color: 0xffb080, transparent: true, opacity: 0.08, side: THREE.BackSide })); g.add(atm); G.push(g); }
      /* 1 地表:起伏的红色地面 + 被风吹掉尘土的灰色石头 */
      { const g = new THREE.Group(), pg = new THREE.PlaneGeometry(5, 5, 60, 60), p = pg.attributes.position;
        for (let i = 0; i < p.count; i++) p.setZ(i, 0.08 * Math.sin(p.getX(i) * 2.1) * Math.cos(p.getY(i) * 1.7) + 0.03 * Math.sin(p.getX(i) * 7));
        pg.computeVertexNormals(); const pl = new THREE.Mesh(pg, new THREE.MeshStandardMaterial({ color: 0xb4552c, roughness: 1 })); pl.rotation.x = -Math.PI / 2; pl.position.y = -0.6; g.add(pl);
        [[-1, 0.2, 0.45, 0x8a3c22], [0.6, -0.4, 0.6, 0x4a4644], [1.4, 0.8, 0.3, 0x9a4428]].forEach(([x, z, r, c], i) => { const m = lump(r, c, 40 + i); m.position.set(x, -0.6 + r * 0.4, z); g.add(m); });
        const t = label('灰色:尘土被吹掉的地方', { size: 0.17 }); t.position.set(0.6, 0.35, -0.4); g.add(t); G.push(g); }
      /* 2 尘粒:灰色岩屑 + 周围极细的红褐颗粒 */
      { const g = new THREE.Group(), core = lump(0.7, 0x4a4648, 7); g.add(core);
        const N = 420, pp = new Float32Array(N * 3), cc = new Float32Array(N * 3), r = MR.rnd(13);
        for (let i = 0; i < N; i++) { const u = r() * 2 - 1, a = r() * 6.283, q = Math.sqrt(1 - u * u), d = 0.75 + r() * 0.35; pp.set([Math.cos(a) * q * d, u * d * 0.8, Math.sin(a) * q * d], i * 3); const red = i % 4 !== 0; cc.set(red ? [0.75 + r() * 0.2, 0.3 + r() * 0.12, 0.14] : [0.45, 0.43, 0.42], i * 3); }
        const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pp, 3)); geo.setAttribute('color', new THREE.BufferAttribute(cc, 3));
        g.add(new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.07, vertexColors: true }))); G.push(g); }
      /* 3 原子:Fe 与 O 交替,夹着水分子(示意) */
      { const g = new THREE.Group(), fe = new THREE.MeshStandardMaterial({ color: 0xc8743c, roughness: 0.35, metalness: 0.3 }), ox = new THREE.MeshStandardMaterial({ color: 0xff4a4a, roughness: 0.4 }), hy = new THREE.MeshStandardMaterial({ color: 0xf4f4f4, roughness: 0.4 });
        const sF = new THREE.SphereGeometry(0.2, 24, 16), sO = new THREE.SphereGeometry(0.15, 20, 14), sH = new THREE.SphereGeometry(0.08, 14, 10), n = 4, a = 0.42;
        for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) for (let k = 0; k < n; k++) { const m = new THREE.Mesh((i + j + k) % 2 ? sO : sF, (i + j + k) % 2 ? ox : fe); m.position.set((i - 1.5) * a, (j - 1.5) * a, (k - 1.5) * a); g.add(m); }
        [[0.95, 0.4, 0.2], [-0.9, -0.3, 0.6], [0.2, 0.95, -0.7]].forEach(p => { const w = new THREE.Group(), o = new THREE.Mesh(sO, ox); w.add(o); [-1, 1].forEach(s => { const h = new THREE.Mesh(sH, hy); h.position.set(s * 0.13, 0.1, 0); w.add(h); }); w.position.set(...p); g.add(w); });
        const t = label('铁 Fe(橙) · 氧 O(红) · 水分子(示意,未按比例)', { size: 0.15 }); t.position.set(0, -1.15, 0); g.add(t); G.push(g); }
      G.forEach((g, i) => { g.visible = i === 0; S.scene.add(g); });
      S.onFrame((t, dt) => {
        shown += (st.k - shown) * (RM() ? 1 : 1 - Math.exp(-dt * 4));
        const k = Math.round(shown), f = shown - st.k;
        G.forEach((g, i) => { g.visible = i === k; });
        G[k].scale.setScalar(1 - Math.max(-0.4, Math.min(0.4, f)) * 0.8);
        if (!RM()) { G[0].rotation.y += dt * 0.12; G[2].rotation.y += dt * 0.1; G[3].rotation.y += dt * 0.15; }
        S.orbit(k === 1 ? 5.2 : 4.4, k === 1 ? -0.3 : 0);
      });
    },
    draw(s) { st = s; }
  };
  MR.lens(stage, api, view);
}

EF.M3 = { L0 };
