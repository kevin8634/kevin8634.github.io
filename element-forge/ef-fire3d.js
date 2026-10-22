/* 元素工坊 Element Forge · fireworks 任务 3D 玩法 ef-fire3d.js v0.6
   「为什么烟花有不同的颜色?」:L0 夜空点单(3D 夜空,七颗颜色星放虚拟烟花)。
   颜色数据来自页面里的 EF.FW;关卡判定、提示、三星由 ef.js 负责;低档或出错时回落 fireworks/index.html 平面版。
   校园版:无白色闪光、粒子更少;减少动态:直接炸开、粒子不飞散。 */
import { THREE } from './ef-gl.js?v=2';
const EF = window.EF, FW = EF.FW;
const RM = () => EF.reduced;
const c3 = h => new THREE.Color(h);
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


/* 一朵 3D 烟花:Points 粒子球壳炸开,加色混合 */
function burst(scene, pos, color) {
  const soft = EF.campus, N = soft ? 160 : (EF.glTier === 'high' ? 520 : 320), p = new Float32Array(N * 3), v = [];
  for (let i = 0; i < N; i++) { const u = Math.random() * 2 - 1, a = Math.random() * 6.283, q = Math.sqrt(1 - u * u), s = (0.85 + Math.random() * 0.3) * (soft ? 1.1 : 1.6); v.push([Math.cos(a) * q * s, u * s, Math.sin(a) * q * s]); p.set([pos.x, pos.y, pos.z], i * 3); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3));
  const m = new THREE.PointsMaterial({ color, size: soft ? 0.06 : 0.075, transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false });
  const pts = new THREE.Points(g, m); scene.add(pts);
  let fl = null; if (!soft) { fl = new THREE.PointLight(0xffffff, 6, 6); fl.position.copy(pos); scene.add(fl); }
  const b = { t: 0, done: false };
  b.step = dt => {
    b.t += RM() ? 0.6 : dt; const k = b.t, ease = 1 - Math.exp(-k * 3.2);
    for (let i = 0; i < N; i++) p.set([pos.x + v[i][0] * ease, pos.y + v[i][1] * ease - k * k * 0.18, pos.z + v[i][2] * ease], i * 3);
    g.attributes.position.needsUpdate = true; m.opacity = Math.max(0, 1 - k / 2.2);
    if (fl) fl.intensity = Math.max(0, 6 * (1 - k * 3)) ;
    if (k > 2.2) { scene.remove(pts); g.dispose(); m.dispose(); if (fl) scene.remove(fl); b.done = true; }
  };
  return b;
}

/* ---------- L0 夜空点单 ---------- */
function L0(stage, api) {
  const S = stage3d(stage, { yaw: 0, pitch: 0.12, drag: false, h: EF.mobile ? 340 : 400, fov: 50 });
  const msg = note(stage, '七颗"颜色星"各藏着一种金属元素。点一颗,放一朵虚拟烟花。');
  const cd = document.createElement('div'); cd.className = 'cab-card warn'; cd.innerHTML = EF.FWUI.DANGER; stage.appendChild(cd);
  /* 远处城市剪影 + 星星 */
  const sp = new Float32Array(400 * 3); for (let i = 0; i < 400; i++) sp.set([(Math.random() - 0.5) * 30, Math.random() * 12 - 1, -8 - Math.random() * 6], i * 3);
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  S.scene.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xfff1dc, size: 0.04, transparent: true, opacity: 0.7, depthWrite: false })));
  const city = new THREE.Group(), cm = new THREE.MeshStandardMaterial({ color: 0x141428, roughness: 1 });
  for (let i = 0; i < 26; i++) { const h = 0.3 + Math.random() * 1.1, m = new THREE.Mesh(new THREE.BoxGeometry(0.4 + Math.random() * 0.4, h, 0.4), cm); m.position.set(-7 + i * 0.56, -1.6 + h / 2, -4); city.add(m); }
  S.scene.add(city);
  const ground = new THREE.Mesh(new THREE.BoxGeometry(10, 0.1, 3), new THREE.MeshStandardMaterial({ color: 0x1a1626, roughness: 0.9 })); ground.position.set(0, -1.65, -1); S.scene.add(ground);
  /* 七颗颜色星 */
  const orbs = FW.EL.map((e, i) => {
    const g = new THREE.Group(), x = (i - 3) * (EF.mobile ? 0.62 : 0.78);
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.2, 28, 20), new THREE.MeshStandardMaterial({ color: c3(e.c), roughness: 0.3, emissive: c3(e.c), emissiveIntensity: 0.25 }));
    g.add(m); g.position.set(x, -1.25, 0.6);
    const t = label(e.n + ' ' + e.k, { size: 0.15 }); t.position.set(0, -0.36, 0); g.add(t);
    const hit = new THREE.Mesh(new THREE.SphereGeometry(0.34, 8, 6), new THREE.MeshBasicMaterial({ visible: false })); g.add(hit);
    S.scene.add(g); return { e, g, m, hit, seen: 0 };
  });
  const rockets = [], bursts = [], O = FW.ORDERS; let phase = 'try', oi = 0;
  function launch(o) {
    const tr = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffe6c8 }));
    tr.position.copy(o.g.position); S.scene.add(tr); rockets.push({ tr, o, ty: 0.9 + Math.random() * 0.9, x: o.g.position.x * 1.3 + (Math.random() - 0.5) * 0.6, z: -0.5 - Math.random() });
    EF.play('whoosh');
  }
  S.onPick = rc => {
    const h = rc.intersectObjects(orbs.map(o => o.hit), false)[0]; if (!h) return; const o = orbs.find(z => z.hit === h.object), e = o.e;
    launch(o);
    if (phase === 'try') {
      o.seen = 1; o.m.material.emissiveIntensity = 0.9; const n = orbs.filter(z => z.seen).length;
      msg.innerHTML = e.n + '(' + e.k + ')→ <b style="color:' + e.c + '">' + e.cn + '</b>。' + (n < 7 ? '还有 ' + (7 - n) + ' 颗没试。' : '');
      if (n === 7) setTimeout(() => { phase = 'order'; msg.innerHTML = '七种元素,七种颜色!现在接订单:客人想要' + O[0].w + ',该点哪颗星?'; EF.play('unlock'); }, 1500);
    } else if (phase === 'order') {
      if (e.k === O[oi].k) { oi++; EF.play('select'); if (oi === O.length) { phase = 'done'; msg.innerHTML = '三张订单都完成了。颜色由烟花里的<b>金属元素</b>决定。'; setTimeout(api.complete, 1600); } else msg.innerHTML = '对了!下一位客人想要' + O[oi].w + '。'; }
      else { EF.play('tick'); msg.innerHTML = '这朵是' + e.cn + '色的。客人要的是' + O[oi].w + ',再找找。'; }
    }
  };
  S.onFrame((t, dt) => {
    S.camera.position.set(0, 0.1, EF.mobile ? 6.2 : 5.4); S.camera.lookAt(0, 0, 0);
    for (let i = rockets.length - 1; i >= 0; i--) { const r = rockets[i], p = r.tr.position, k = RM() ? 1 : Math.min(1, dt * 3.2);
      p.x += (r.x - p.x) * k; p.z += (r.z - p.z) * k; p.y += (r.ty - p.y) * k;
      if (Math.abs(p.y - r.ty) < 0.04) { S.scene.remove(r.tr); bursts.push(burst(S.scene, p.clone(), c3(r.o.e.c))); EF.tone(r.o.e.z % 21 + 1); rockets.splice(i, 1); } }
    for (let i = bursts.length - 1; i >= 0; i--) { bursts[i].step(dt); if (bursts[i].done) bursts.splice(i, 1); }
    orbs.forEach((o, i) => { if (!RM()) o.g.position.y = -1.25 + Math.sin(t * 1.4 + i) * 0.04; });
  });
}

EF.F3 = { L0 };
