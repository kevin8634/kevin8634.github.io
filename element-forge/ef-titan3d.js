/* 元素工坊 Element Forge · titan 任务 3D 玩法 ef-titan3d.js v0.10
   「土卫六为什么是橙色的?」:L0 −179 °C 的世界(3D 四瓶物态台 + 背后的土卫六,可拖动转看)。
   状态与判定由页面里的 EF.TT.temp 控制器负责(与平面版共用);低档或出错时回落 titan/index.html 平面版。
   减少动态:不自转、液面不晃、气体粒子静止。 */
import { THREE } from './ef-gl.js?v=2';
const EF = window.EF, TT = EF.TT, MR = { rnd: TT.rnd };
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
  const rim = new THREE.DirectionalLight(0xffa040, 1.0); rim.position.set(-4, 1, -3); scene.add(rim);
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
function lump(rad, col, seed) {
  const g = new THREE.IcosahedronGeometry(rad, 2), p = g.attributes.position, v = new THREE.Vector3(), r = MR.rnd(seed), k = r() * 5;
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); v.multiplyScalar(1 + 0.18 * Math.sin(v.x * 7 / rad + k) * Math.cos(v.y * 6 / rad + k)); p.setXYZ(i, v.x, v.y * 0.75, v.z); }
  g.computeVertexNormals(); return new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: col, roughness: 0.9, flatShading: true }));
}
function titanTex() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 128; const x = c.getContext('2d'), r = TT.rnd(17);
  const g = x.createLinearGradient(0, 0, 0, 128); g.addColorStop(0, '#b06a20'); g.addColorStop(0.5, '#e09a40'); g.addColorStop(1, '#a8601c'); x.fillStyle = g; x.fillRect(0, 0, 256, 128);
  for (let i = 0; i < 24; i++) { x.fillStyle = `rgba(255,200,120,${0.05 + r() * 0.08})`; x.fillRect(0, r() * 128, 256, 2 + r() * 6); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

/* ---------- L0 3D 四瓶物态台 ---------- */
function L0(stage, api) {
  let S, st = { T: 15 };
  const J = [];
  const view = {
    mount(stage) {
      S = stage3d(stage, { h: EF.mobile ? 320 : 380 });
      /* 背后的土卫六:橙色球 + 厚厚的雾壳 */
      const ti = new THREE.Group(); ti.position.set(0, 0.9, -4.5);
      ti.add(new THREE.Mesh(new THREE.SphereGeometry(1.6, 48, 32), new THREE.MeshStandardMaterial({ map: titanTex(), roughness: 1 })));
      ti.add(new THREE.Mesh(new THREE.SphereGeometry(1.75, 48, 32), new THREE.MeshBasicMaterial({ color: 0xffb060, transparent: true, opacity: 0.16, side: THREE.BackSide })));
      S.scene.add(ti);
      const glass = new THREE.MeshStandardMaterial({ color: 0xdfefff, transparent: true, opacity: 0.16, roughness: 0.1, metalness: 0.1, depthWrite: false });
      const rim = new THREE.MeshBasicMaterial({ color: 0xffd6a0, transparent: true, opacity: 0.5 });
      TT.SUBS.forEach((sub, i) => {
        const g = new THREE.Group(), col = new THREE.Color(sub.c); g.position.set((i - 1.5) * 1.05, -0.35, 0);
        const jar = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 1.3, 32, 1, true), glass); g.add(jar);
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.012, 6, 40), rim); ring.rotation.x = Math.PI / 2; ring.position.y = 0.65; g.add(ring);
        const base = new THREE.Mesh(new THREE.CircleGeometry(0.38, 32), new THREE.MeshStandardMaterial({ color: 0x2a1a10 })); base.rotation.x = -Math.PI / 2; base.position.y = -0.65; g.add(base);
        const solid = lump(0.26, col, 30 + i); solid.position.y = -0.45; g.add(solid);
        const liq = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.5, 32), new THREE.MeshStandardMaterial({ color: col, transparent: true, opacity: 0.6, roughness: 0.15 })); liq.position.y = -0.4; g.add(liq);
        const N = 40, pp = new Float32Array(N * 3), r = TT.rnd(50 + i); for (let k = 0; k < N; k++) { const a = r() * 6.283, d = Math.sqrt(r()) * 0.32; pp.set([Math.cos(a) * d, -0.6 + r() * 1.2, Math.sin(a) * d], k * 3); }
        const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pp, 3)); const gas = new THREE.Points(pg, new THREE.PointsMaterial({ color: col, size: 0.06, transparent: true, opacity: 0.9, depthWrite: false })); g.add(gas);
        const tag = label(sub.n + ' ' + sub.f, { size: 0.16 }); tag.position.y = 0.9; g.add(tag);
        const tags = TT.PH.map((p, k) => { const s = label(p, { size: 0.15, color: k === 0 ? '#bfe9ff' : k === 1 ? '#ffd27a' : '#c9a6ff' }); s.position.y = -0.88; s.visible = false; g.add(s); return s; });
        S.scene.add(g); J.push({ sub, g, solid, liq, gas, tags, seed: r() * 6 });
      });
      S.onFrame((t, dt) => {
        J.forEach(j => {
          const p = TT.phase(j.sub, st.T);
          j.solid.visible = p === 0; j.liq.visible = p === 1; j.gas.visible = p === 2; j.tags.forEach((s, k) => { s.visible = k === p; });
          if (!RM()) { j.liq.scale.y = 1 + Math.sin(t * 1.5 + j.seed) * 0.03; j.gas.rotation.y += dt * 0.6; j.gas.position.y = Math.sin(t * 0.8 + j.seed) * 0.05; j.solid.rotation.y += dt * 0.2; }
        });
        if (!RM()) ti.rotation.y += dt * 0.05;
        S.orbit(EF.mobile ? 6.4 : 5.4, 0);
      });
    },
    draw(s) { st = s; }
  };
  TT.temp(stage, api, view);
}

EF.T3 = { L0 };
