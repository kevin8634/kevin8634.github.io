/* 元素工坊 Element Forge · rocks 任务 3D 玩法 ef-rock3d.js v0.8
   「岩石是怎么"长"出来的?」:L0 岩石三兄弟(3D 标本架:六块程序纹理岩石,可拖动转看、点选后分类)。
   状态与判定由页面里的 EF.RK.sorter 控制器负责(与平面版共用);低档或出错时回落 rocks/index.html 平面版。
   减少动态:岩石不自转。 */
import { THREE } from './ef-gl.js?v=2';
const EF = window.EF, RK = EF.RK;
const RM = () => EF.reduced;

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
  const rim = new THREE.DirectionalLight(0xffb35c, 0.9); rim.position.set(-4, 1, -3); scene.add(rim);
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
  if (opt.bg !== false) { x.fillStyle = 'rgba(14,10,26,.78)'; x.beginPath(); x.roundRect ? x.roundRect(1, 1, w - 2, c.height - 2, 14) : x.rect(1, 1, w - 2, c.height - 2); x.fill(); x.strokeStyle = 'rgba(255,179,92,.6)'; x.lineWidth = 2; x.stroke(); }
  x.fillStyle = opt.color || '#f4ede1'; x.fillText(text, w / 2, c.height / 2 + 2);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false, depthWrite: false }));
  const k = (opt.size || 0.2) / c.height; s.scale.set(w * k, c.height * k, 1); s.renderOrder = 5; return s;
}

function rockGeo(seed) {
  const g = new THREE.IcosahedronGeometry(0.42, 3), p = g.attributes.position, r = RK.rnd(seed), v = new THREE.Vector3();
  const k = [r() * 3, r() * 3, r() * 3];
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const n = 1 + 0.12 * Math.sin(v.x * 6 + k[0]) * Math.cos(v.y * 5 + k[1]) + 0.06 * Math.sin(v.z * 9 + k[2]); v.multiplyScalar(n); v.y *= 0.78; p.setXYZ(i, v.x, v.y, v.z); }
  g.computeVertexNormals(); return g;
}
function rockTex(kind, seed) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 256; RK.tex(c.getContext('2d'), kind, 0, 0, 256, 256, seed);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}

/* ---------- L0 岩石三兄弟 ---------- */
function L0(stage, api) {
  let S, st = { sel: -1, put: {} }; const items = [], ring = new THREE.Mesh(new THREE.TorusGeometry(0.56, 0.025, 8, 48), new THREE.MeshBasicMaterial({ color: 0xffd27a }));
  const view = {
    mount(stage, pick) {
      S = stage3d(stage, { yaw: 0, pitch: 0.3, drag: true, h: EF.mobile ? 330 : 380, fov: 40 });
      const shelf = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.1, 1.4), new THREE.MeshStandardMaterial({ color: 0x3a2c3c, roughness: 0.8 })); shelf.position.y = -0.5; S.scene.add(shelf);
      const cols = EF.mobile ? 3 : 6;
      RK.ROCKS.forEach((R, i) => {
        const g = new THREE.Group(), row = Math.floor(i / cols), col = i % cols, sp = EF.mobile ? 1.15 : 1.05;
        const m = new THREE.Mesh(rockGeo(31 + i), new THREE.MeshStandardMaterial({ map: rockTex(R.k, 31 + i), roughness: R.k === 'obsidian' ? 0.2 : 0.85, metalness: 0 }));
        g.add(m); g.position.set((col - (cols - 1) / 2) * sp, row ? -1.6 : 0, row ? 0.3 : 0);
        const t = label(R.n, { size: 0.16 }); t.position.set(0, -0.62, 0); g.add(t);
        S.scene.add(g); items.push({ g, m, t, R, done: '' });
      });
      if (EF.mobile) { const s2 = shelf.clone(); s2.position.set(0, -2.1, 0.3); S.scene.add(s2); }
      ring.rotation.x = Math.PI / 2; ring.visible = false; S.scene.add(ring);
      S.onPick = rc => { const h = rc.intersectObjects(items.map(o => o.m), false)[0]; if (h) pick(items.findIndex(o => o.m === h.object)); };
      S.onFrame((t, dt) => {
        S.orbit(EF.mobile ? 6.4 : 4.9, EF.mobile ? -0.8 : -0.05);
        items.forEach((o, i) => { if (!RM()) o.m.rotation.y += dt * (i === st.sel ? 0.9 : 0.15); });
        if (st.sel >= 0) { ring.visible = true; ring.position.copy(items[st.sel].g.position); ring.position.y -= 0.32; } else ring.visible = false;
      });
    },
    draw(s) {
      st = s;
      items.forEach((o, i) => { const c = s.put[i]; if (c && o.done !== c) { o.done = c; o.g.remove(o.t); o.t.material.map.dispose(); o.t = label(o.R.n + ' · ' + RK.CAT[c][0], { size: 0.16, color: RK.CAT[c][1] }); o.t.position.set(0, -0.62, 0); o.g.add(o.t); } });
    }
  };
  RK.sorter(stage, api, view);
}

EF.R3 = { L0 };
