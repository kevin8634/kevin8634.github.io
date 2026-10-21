/* 元素工坊 Element Forge · stars 任务玩法 3D 化 ef-stars3d.js v0.3.1
   「你身体里的铁是从哪颗星来的?」四关的动手部分搬进 3D 舞台:拖、点、调规则都在 3D 里发生。
   关卡判定、提示、三星仍由 ef.js 框架负责;低档或这里出错时,stars/index.html 回落 v0.3 平面版。 */
import { THREE, starMaterial, fresnelMaterial, glowSprite, P } from './ef-gl.js?v=2';
const EF = window.EF;
const COL = { H: 0xff8a5c, n: 0x9aa6b8, He: 0xffd27a, C: 0x8a8f99, O: 0x7ad7ff, Ne: 0xff7ad9, Mg: 0xc9e4a0, Si: 0xd9c49a, S: 0xf0e070, Ca: 0xe8e8f0, Fe: 0xc86b3c, Kr: 0x9fd0ff, Ag: 0xd0d6e0, Au: 0xffc640, U: 0x7fdc7f };
const Z = { H: 1, He: 2, C: 6, O: 8, Ne: 10, Mg: 12, Si: 14, Fe: 26, Kr: 36 };
const ease = x => x < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x);
const RM = () => EF.reduced;

/* ---------- 公共:舞台、标签、拖动、拾取 ---------- */
function stage3d(parent, opt = {}) {
  const h = opt.h || (EF.mobile ? 330 : 400);
  document.body.classList.add('stage3d');
  const wrap = document.createElement('div'); wrap.className = 's3d'; wrap.style.height = h + 'px'; parent.appendChild(wrap);
  const renderer = new THREE.WebGLRenderer({ antialias: EF.glTier === 'high', alpha: true });
  renderer.setPixelRatio(EF.dpr()); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.setClearColor(0x000000, 0);
  wrap.appendChild(renderer.domElement);
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(opt.fov || 42, 1, 0.05, 400);
  scene.add(new THREE.AmbientLight(0x9a8aa0, 1.0));
  const key = new THREE.DirectionalLight(0xfff0dd, 2.2); key.position.set(3, 4, 5); scene.add(key);
  const o = { wrap, renderer, scene, camera, cbs: [], yaw: 0, pitch: 0, drag: !!opt.drag, onPick: null, dead: false };
  function rs() { const w = wrap.clientWidth || 600, hh = wrap.clientHeight || h; renderer.setSize(w, hh, false); camera.aspect = w / hh; camera.updateProjectionMatrix(); }
  rs(); const ro = window.ResizeObserver ? new ResizeObserver(rs) : null; if (ro) ro.observe(wrap); else addEventListener('resize', rs);
  /* 拖动旋转 + 点按拾取(移动 < 6px 算点按) */
  let down = null;
  wrap.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY, yaw: o.yaw, pitch: o.pitch, moved: 0 }; wrap.setPointerCapture && wrap.setPointerCapture(e.pointerId); });
  wrap.addEventListener('pointermove', e => {
    if (!down) return; const dx = e.clientX - down.x, dy = e.clientY - down.y; down.moved = Math.max(down.moved, Math.hypot(dx, dy));
    if (o.drag && down.moved > 6) { o.yaw = down.yaw + dx * 0.008; o.pitch = Math.max(-0.9, Math.min(0.9, down.pitch + dy * 0.006)); }
  });
  wrap.addEventListener('pointerup', e => {
    if (down && down.moved < 6 && o.onPick) {
      const r = wrap.getBoundingClientRect(), v = new THREE.Vector2((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      const rc = new THREE.Raycaster(); rc.setFromCamera(v, camera); o.onPick(rc, v);
    }
    down = null;
  });
  wrap.addEventListener('pointercancel', () => { down = null; });
  let last = performance.now();
  function frame(now) {
    if (!wrap.isConnected) { o.dead = true; if (ro) ro.disconnect(); renderer.dispose(); renderer.forceContextLoss(); return; }
    requestAnimationFrame(frame);
    if (document.hidden) { last = now; return; }
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    for (const f of o.cbs) f(now / 1000, dt);
    renderer.render(scene, camera);
  }
  o.onFrame = f => o.cbs.push(f);
  requestAnimationFrame(frame);
  return o;
}
function label(text, opt = {}) {
  const fs = 44, c = document.createElement('canvas'), x = c.getContext('2d');
  x.font = '700 ' + fs + 'px system-ui,"PingFang SC","Noto Sans SC",sans-serif';
  const w = Math.ceil(x.measureText(text).width) + 28; c.width = w; c.height = fs + 22;
  x.font = '700 ' + fs + 'px system-ui,"PingFang SC","Noto Sans SC",sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
  if (opt.bg !== false) { x.fillStyle = opt.bg || 'rgba(10,12,26,.72)'; const r = 14; x.beginPath(); x.roundRect ? x.roundRect(1, 1, w - 2, c.height - 2, r) : x.rect(1, 1, w - 2, c.height - 2); x.fill(); x.strokeStyle = 'rgba(255,179,92,.5)'; x.lineWidth = 2; x.stroke(); }
  x.fillStyle = opt.color || '#f4ede1'; x.fillText(text, w / 2, c.height / 2 + 2);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: opt.depthTest !== false, depthWrite: false }));
  const k = (opt.size || 0.32) / c.height; s.scale.set(w * k, c.height * k, 1); return s;
}
function nucleon(col, r = 0.13, emi = 0.35) { return new THREE.Mesh(new THREE.SphereGeometry(r, 20, 16), new THREE.MeshStandardMaterial({ color: col, roughness: 0.35, metalness: 0.1, emissive: col, emissiveIntensity: emi })); }
function ballLabeled(sym, col, r = 0.13) { const g = new THREE.Group(), m = nucleon(col, r); g.add(m); const l = label(sym, { bg: false, color: '#1b1208', size: r * 1.25, depthTest: false }); l.renderOrder = 3; g.add(l); g.userData.mesh = m; g.userData.lab = l; return g; }
function bgStars(scene, n = 600, R = 60) {
  const p = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const u = Math.random() * 2 - 1, a = Math.random() * 6.283, q = Math.sqrt(1 - u * u), r = R * (0.6 + Math.random() * 0.4); p.set([Math.cos(a) * q * r, u * r, Math.sin(a) * q * r], i * 3); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3));
  const s = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xfff1dc, size: 0.12, transparent: true, opacity: 0.7, depthWrite: false })); scene.add(s); return s;
}
/* GPU 粒子爆发:着色器按时间推开,一次性 */
function burst(scene, n, col, speed, size, life) {
  const pos = new Float32Array(n * 3), vel = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { const u = Math.random() * 2 - 1, a = Math.random() * 6.283, q = Math.sqrt(1 - u * u), v = speed * (0.5 + Math.random() * 0.8); vel.set([Math.cos(a) * q * v, u * v, Math.sin(a) * q * v], i * 3); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('vel', new THREE.BufferAttribute(vel, 3));
  const m = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { uT: { value: 0 }, uC: { value: new THREE.Color(col) }, uS: { value: size * EF.dpr() }, uL: { value: life } },
    vertexShader: 'attribute vec3 vel; uniform float uT,uS,uL; varying float vA; void main(){ vec3 p=position+vel*(1.0-exp(-uT*1.6))/1.6; vA=1.0-clamp(uT/uL,0.0,1.0); vec4 mv=modelViewMatrix*vec4(p,1.0); gl_PointSize=uS*(6.0/-mv.z)*(0.6+vA*0.6); gl_Position=projectionMatrix*mv; }',
    fragmentShader: 'uniform vec3 uC; varying float vA; void main(){ vec2 d=gl_PointCoord-0.5; float a=smoothstep(0.5,0.0,length(d)); gl_FragColor=vec4(uC*1.4,a*vA); }' });
  const pts = new THREE.Points(g, m); scene.add(pts);
  return { pts, step(dt) { m.uniforms.uT.value += dt; if (m.uniforms.uT.value > life) { scene.remove(pts); g.dispose(); m.dispose(); return false; } return true; } };
}
function ctlRow(stage, html) { const c = document.createElement('div'); c.className = 'ctl'; c.innerHTML = html; stage.appendChild(c); return c; }
function note(stage) { const p = document.createElement('p'); p.className = 'note-sm'; stage.appendChild(p); return p; }

/* ============ 第 1 关:点燃恒星(规则可改:核心温度) ============ */
function L0(stage, api) {
  const S = stage3d(stage, { drag: true }), { scene, camera } = S; bgStars(scene);
  camera.position.set(0, 1.4, 9.6); camera.lookAt(0, 0, 0);
  const world = new THREE.Group(); scene.add(world);
  const shell = new THREE.Mesh(new THREE.SphereGeometry(2.9, 64, 48), fresnelMaterial(0xff9a3c, 2.2, 0.03, THREE.BackSide)); world.add(shell);
  const shellF = new THREE.Mesh(new THREE.SphereGeometry(2.9, 64, 48), fresnelMaterial(0xffb35c, 3.0, 0.0)); world.add(shellF);
  const coreM = starMaterial(), core = new THREE.Mesh(new THREE.SphereGeometry(0.62, 64, 48), coreM); world.add(core);
  const glow = glowSprite([[0, 'rgba(255,220,160,.9)'], [0.3, 'rgba(255,150,60,.4)'], [1, 'rgba(0,0,0,0)']], 3.2); world.add(glow);
  const ringCore = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.008, 6, 96), new THREE.MeshBasicMaterial({ color: 0xffc884, transparent: true, opacity: 0.5 })); ringCore.rotation.x = Math.PI / 2; world.add(ringCore);
  const coreLab = label('恒星核心', { size: 0.26 }); coreLab.position.set(0, -1.15, 0); world.add(coreLab);

  const ctl = ctlRow(stage, '<span>核心温度</span><input type="range" min="0" max="100" value="18" id="tp" aria-label="核心温度"><output id="to" style="min-width:8.5em"></output>');
  const hud = note(stage), tp = ctl.querySelector('#tp'), to = ctl.querySelector('#to');
  const THR = 4e6; let T = 0, warned = false;
  const tempOf = v => 1e6 * Math.pow(30, v / 100);
  function syncT() { T = tempOf(+tp.value); to.textContent = '约 ' + Math.round(T / 1e5) / 10 + ' 百万 K'; to.style.color = T >= THR ? '#ffc46b' : '#7ad7ff'; }
  tp.oninput = syncT; syncT();

  const free = [], fly = [], inCore = [], heList = [], bursts = []; let he = 0, done = false, flash = 0;
  function spawn(p) {
    const g = p || ballLabeled('H', COL.H, 0.15); g.userData.orb = { r: 1.55 + Math.random() * 0.9, a: Math.random() * 6.283, v: (Math.random() < 0.5 ? -1 : 1) * (0.25 + Math.random() * 0.35), tilt: (Math.random() - 0.5) * 1.2, ph: Math.random() * 6 };
    if (!p) { world.add(g); free.push(g); } return g;
  }
  for (let i = 0; i < 10; i++) spawn();
  function upd() {
    hud.innerHTML = '核心里的氢核:<b>' + inCore.length + ' / 4</b> · 已炼出氦核:<b>' + he + ' / 3</b><br>' +
      (he ? '4 个氢原子 4 × 1.008 = 4.032 → 1 个氦原子 4.003(真实恒星里要经过好几步反应),<b style="color:#ffc46b">少了 0.029(约 0.7%)</b>,这点质量变成了能量。'
          : '点 3D 里漂浮的氢核(H),把它送进恒星核心;拖动可以转着看。' + (T < THR ? '<br><span style="color:#7ad7ff">示意:核心低于约 400 万 K 时,氢几乎烧不起来。太阳核心约 1500 万 K。</span>' : ''));
  }
  tp.addEventListener('input', upd); upd();
  S.onPick = rc => {
    if (inCore.length + fly.length >= 4) return;
    const hits = rc.intersectObjects(free.map(g => g.userData.mesh));
    if (!hits.length) return; const g = free.find(q => q.userData.mesh === hits[0].object);
    free.splice(free.indexOf(g), 1); fly.push({ g, from: g.position.clone(), t: 0, bounce: T < THR }); EF.tone(1);
  };
  EF._s3t = { pickH() { const g = free[0]; if (g && inCore.length + fly.length < 4) { free.splice(0, 1); fly.push({ g, from: g.position.clone(), t: 0, bounce: T < THR }); } } };   /* 自动化自测用 */
  S.onFrame((t, dt) => {
    const tt = RM() ? 0 : t, hot = Math.min(1, Math.log(T / 1e6) / Math.log(30));
    coreM.uniforms.uT.value = tt; core.scale.setScalar(0.8 + hot * 0.35 + flash * 0.3);
    glow.material.opacity = 0.35 + hot * 0.65; glow.scale.setScalar(2.2 + hot * 1.6 + flash * 3);
    world.rotation.y = S.yaw + (RM() ? 0 : t * 0.05); world.rotation.x = S.pitch * 0.6;
    free.forEach(g => { const o = g.userData.orb; o.a += o.v * dt * (RM() ? 0.3 : 1); g.position.set(Math.cos(o.a) * o.r, Math.sin(o.a + o.ph) * o.tilt, Math.sin(o.a) * o.r); });
    for (let i = fly.length - 1; i >= 0; i--) {
      const f = fly[i]; f.t += dt * 1.8; const k = ease(Math.min(1, f.t));
      if (f.bounce) {
        const kk = f.t < 0.6 ? ease(f.t / 0.6) * 0.62 : 0.62 * (1 - ease((f.t - 0.6) / 0.6));
        f.g.position.copy(f.from).multiplyScalar(1 - kk);
        if (f.t >= 1.2) { fly.splice(i, 1); spawn(f.g); free.push(f.g); EF.play('tick');
          if (!warned) { warned = true; api.say('弹开了!质子都带正电,会互相推开。怎样才能让它们撞得更猛、挤到一起?'); } }
      } else {
        f.g.position.copy(f.from).multiplyScalar(1 - k);
        if (f.t >= 1) { fly.splice(i, 1); inCore.push(f.g); upd(); }
      }
    }
    inCore.forEach((g, i) => { const a = tt * 2.2 + i * 1.571; g.position.set(Math.cos(a) * 0.32, Math.sin(a * 1.3) * 0.12, Math.sin(a) * 0.32); });
    if (inCore.length === 4) {
      inCore.forEach(g => world.remove(g)); inCore.length = 0; he++; flash = 1; EF.play('fuse'); EF.tone(2, 0.15);
      const n = new THREE.Group(); [COL.H, COL.n, COL.H, COL.n].forEach((c, i) => { const m = nucleon(c, 0.11); m.position.set((i % 2 ? 1 : -1) * 0.07, (i < 2 ? 1 : -1) * 0.07, (i % 3 ? 1 : -1) * 0.05); n.add(m); });
      const hl = label('He', { size: 0.22 }); hl.position.y = 0.3; n.add(hl); n.userData.a = Math.random() * 6.283; world.add(n); heList.push(n);
      if (!RM()) bursts.push(burst(world, P.bubbles * 3, 0xffe2a0, 3.2, 0.32, 1.6));
      for (let k = 0; k < 4; k++) spawn();
      upd(); if (he >= 3 && !done) { done = true; setTimeout(api.complete, 700); }
    }
    heList.forEach((n, i) => { n.userData.a += dt * 0.5; const a = n.userData.a; n.position.set(Math.cos(a) * 1.05, 0.15 * Math.sin(a * 2 + i), Math.sin(a) * 1.05); });
    for (let i = bursts.length - 1; i >= 0; i--) if (!bursts[i].step(dt)) bursts.splice(i, 1);
    flash *= 0.93;
  });
}

/* ============ 第 2 关:恒星的洋葱(规则可改:恒星质量) ============ */
function L1(stage, api) {
  const S = stage3d(stage, { drag: true }), { scene, camera } = S; bgStars(scene);
  camera.position.set(0, 0.9, 7.4); camera.lookAt(0, 0, 0);
  const world = new THREE.Group(); scene.add(world);
  const NAME = { H: 'H 氢', He: 'He 氦', C: 'C 碳', Ne: 'Ne 氖', O: 'O 氧', Si: 'Si 硅', Fe: 'Fe 铁', 'C/O': 'C 碳 / O 氧' };
  const ctl = ctlRow(stage, '<span>恒星质量</span><input type="range" min="0" max="100" value="30" id="ms" aria-label="恒星质量"><output id="mo"></output><button class="ef-btn" id="go">点火,看它能炼到哪</button>');
  const res = note(stage), ms = ctl.querySelector('#ms'), mo = ctl.querySelector('#mo');
  const m = () => Math.round(0.3 * Math.pow(25 / 0.3, ms.value / 100) * 10) / 10;
  const plan = M => M < 0.5 ? ['H', 'He'] : M < 8 ? ['H', 'He', 'C/O'] : ['H', 'He', 'C', 'Ne', 'O', 'Si', 'Fe'];
  let mass = 1, layers = [], shown = 0, running = false, parts = [], R = 1.6;
  const outerM = fresnelMaterial(0xffd27a, 1.6, 0.12), outer = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 48, 0, Math.PI * 1.5), outerM); outerM.side = THREE.DoubleSide; world.add(outer);
  const glow = glowSprite([[0, 'rgba(255,240,200,.55)'], [0.4, 'rgba(255,200,120,.15)'], [1, 'rgba(0,0,0,0)']], 6); world.add(glow);
  const typeLab = label('类太阳恒星', { size: 0.3 }); scene.add(typeLab);
  const leg = document.createElement('div'); leg.className = 's3d-leg'; S.wrap.appendChild(leg);
  function clearParts() { parts.forEach(p => { world.remove(p); }); parts = []; }
  function build() {
    clearParts(); const L = layers.length;
    for (let i = 0; i < Math.min(shown, L); i++) {
      const el = layers[i], col = COL[el] || COL[el.split('/')[0]] || 0x9aa0aa, rr = R * (1 - i / L) * 0.95;
      const mat = new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.55, roughness: 0.5, side: THREE.DoubleSide });
      const sh = new THREE.Mesh(new THREE.SphereGeometry(rr, 56, 40, 0, Math.PI * 1.5), mat); world.add(sh); parts.push(sh);
      /* 切面:每层只画自己那一圈(半环),避免层与层重叠闪烁;缺口朝 -x/-z 方向 */
      const rin = i < L - 1 ? R * (1 - (i + 1) / L) * 0.95 : 0;
      [Math.PI, Math.PI / 2].forEach(ry => { const d = new THREE.Mesh(new THREE.RingGeometry(rin, rr, 48, 1, -Math.PI / 2, Math.PI), mat); d.rotation.y = ry; world.add(d); parts.push(d); });
    }
  }
  function legend() { leg.innerHTML = layers.slice(0, shown).map((el, i) => { const c = '#' + new THREE.Color(COL[el] || COL[el.split('/')[0]] || 0x9aa0aa).getHexString(); return '<span><i style="background:' + c + '"></i>' + (i ? '' : '外层 ') + (NAME[el] || el) + (i === layers.length - 1 && i ? ' · 中心' : '') + '</span>'; }).join(''); }
  function sync() {
    mass = m(); mo.textContent = mass + ' 倍太阳';
    R = 0.9 + 1.0 * (Math.log(mass / 0.3) / Math.log(25 / 0.3)); outer.scale.setScalar(R);
    const c = mass < 0.5 ? 0xff5a2a : mass < 2 ? 0xffd27a : mass < 8 ? 0xfff1d0 : 0xcfe3ff; outerM.uniforms.uC.value.set(c);
    glow.material.color.set(c); glow.scale.setScalar(R * 3.6);
    const ty = mass < 0.5 ? '红矮星' : mass < 2 ? '类太阳恒星' : mass < 8 ? '中等质量恒星' : '大质量恒星';
    if (typeLab.userData.t !== ty) { scene.remove(typeLab.userData.cur || typeLab); const nl = label(ty, { size: 0.3 }); nl.position.set(0, -2.45, 0); scene.add(nl); typeLab.userData.cur = nl; typeLab.userData.t = ty; }
    if (!running) { shown = 0; layers = []; build(); legend(); }
  }
  typeLab.visible = false; ms.oninput = sync; sync();
  ctl.querySelector('#go').onclick = () => {
    if (running) return; running = true; layers = plan(mass); shown = 0; EF.play('anvil');
    const step = () => {
      shown++; build(); legend(); EF.tone(Z[layers[shown - 1]] || 7);
      if (shown < layers.length) setTimeout(step, RM() ? 120 : 520);
      else {
        running = false; const last = layers[layers.length - 1];
        if (last === 'Fe') { res.innerHTML = '<b style="color:#ffc46b">炼到铁了!</b>核心一层层分开,像洋葱:氢 → 氦 → 碳 → 氖 → 氧 → 硅 → 铁。拖动转一圈看看切面。'; setTimeout(api.complete, 900); }
        else if (last === 'C/O') { res.innerHTML = '这颗星最远只能炼到<b>碳和氧</b>,最后变成一颗白矮星。太阳就是这样。'; api.say('碳和氧已经很了不起了。可是铁呢?想想:要让更重的原子核发生反应,核心得怎样?'); }
        else { res.innerHTML = '这颗小星只能把氢炼成<b>氦</b>,它会安静地燃烧几千亿年——比宇宙现在的年龄长得多。'; api.say('它太小了,核心不够热。你觉得该往哪个方向拉滑块?'); }
      }
    };
    step();
  };
  S.onFrame((t) => { world.rotation.y = S.yaw + 2.2 + (RM() ? 0 : Math.sin(t * 0.3) * 0.45); world.rotation.x = 0.22 + S.pitch * 0.6; });
}

/* ============ 第 3 关:铁为什么是终点(3D 能量山) ============ */
function L2(stage, api) {
  const S = stage3d(stage, { drag: true }), { scene, camera } = S; bgStars(scene, 400);
  camera.position.set(0, 3.0, 7.6); camera.lookAt(0, 0.9, 0);
  const world = new THREE.Group(); scene.add(world);
  const PTS = [['H', 1, 0], ['He', 4, 7.07], ['C', 12, 7.68], ['O', 16, 7.98], ['Ne', 20, 8.03], ['Mg', 24, 8.26], ['Si', 28, 8.45], ['S', 32, 8.49], ['Ca', 40, 8.55], ['Fe', 56, 8.79], ['Kr', 84, 8.72], ['Ag', 107, 8.55], ['Au', 197, 7.92], ['U', 238, 7.57]];
  const CHAIN = ['He', 'C', 'O', 'Ne', 'Mg', 'Si', 'Fe', 'Kr']; let ci = 0, energy = 0;
  const X = A => -3.4 + Math.log(A) / Math.log(240) * 6.8, Y = v => v / 9.2 * 2.6;
  const xs = PTS.map(p => X(p[1])), ys = PTS.map(p => Y(p[2]));
  function hAt(x) { /* 分段三次插值(单调近似) */
    if (x <= xs[0]) return ys[0]; for (let i = 0; i < xs.length - 1; i++) if (x <= xs[i + 1]) { const k = (x - xs[i]) / (xs[i + 1] - xs[i]); return ys[i] + (ys[i + 1] - ys[i]) * ease(k); } return ys[ys.length - 1]; }
  const geo = new THREE.PlaneGeometry(7.2, 2.4, 160, 24); geo.rotateX(-Math.PI / 2);
  const pa = geo.attributes.position, colA = new Float32Array(pa.count * 3), c = new THREE.Color();
  for (let i = 0; i < pa.count; i++) { const x = pa.getX(i), z = pa.getZ(i), f = Math.cos(z / 1.2 * Math.PI / 2), h = hAt(x) * Math.max(0, f); pa.setY(i, h);
    const k = h / Y(8.79); c.setHSL(0.6 - 0.52 * Math.min(1, k * k), 0.8, 0.28 + 0.32 * k); colA.set([c.r, c.g, c.b], i * 3); }
  geo.setAttribute('color', new THREE.BufferAttribute(colA, 3)); geo.computeVertexNormals();
  const hill = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6, metalness: 0.1, flatShading: false, emissive: 0x150a04 })); world.add(hill);
  const wire = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0xffb35c, wireframe: true, transparent: true, opacity: 0.08 })); world.add(wire);
  const ridge = []; for (let i = 0; i <= 200; i++) { const x = -3.4 + i / 200 * 6.8; ridge.push(new THREE.Vector3(x, hAt(x) + 0.01, 0)); }
  world.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(ridge), new THREE.LineBasicMaterial({ color: 0xffd27a })));
  /* 山顶:铁和镍一带 */
  const peak = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 3.2), new THREE.MeshBasicMaterial({ color: 0xffc46b, transparent: true, opacity: 0.1, side: THREE.DoubleSide, depthWrite: false })); peak.position.set(X(56), 1.6, 0); world.add(peak);
  const pkL = label('山顶:铁和镍一带', { size: 0.22, color: '#ffc46b' }); pkL.position.set(X(56), 3.35, 0); world.add(pkL);
  const axL = label('原子核越来越重 →', { size: 0.2, color: '#a9a29a', bg: false }); axL.position.set(0, -0.05, 1.55); world.add(axL);
  const marks = {};
  PTS.forEach(p => { const on = CHAIN.indexOf(p[0]) === 0; const g = ballLabeled(p[0], on ? (COL[p[0]] || 0xffb35c) : 0x3a3f55, 0.11); g.position.set(X(p[1]), Y(p[2]) + 0.12, 0); world.add(g); marks[p[0]] = g; });
  const cur = ballLabeled(CHAIN[0], COL.He, 0.19); world.add(cur); const curRing = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.015, 8, 48), new THREE.MeshBasicMaterial({ color: 0xffffff })); world.add(curRing);
  let mv = null; const posOf = s => { const p = PTS.find(q => q[0] === s); return new THREE.Vector3(X(p[1]), Y(p[2]) + 0.26, 0); };
  cur.position.copy(posOf(CHAIN[0]));
  /* 能量表(3D 柱) */
  const meter = new THREE.Group(); meter.position.set(4.1, 0, 0); world.add(meter);
  meter.add(new THREE.Mesh(new THREE.BoxGeometry(0.34, 3.0, 0.34), new THREE.MeshBasicMaterial({ color: 0x1a1f33, transparent: true, opacity: 0.6 }))); meter.children[0].position.y = 1.1;
  const barM = new THREE.MeshStandardMaterial({ color: 0xffb35c, emissive: 0xffb35c, emissiveIntensity: 0.6 }), bar = new THREE.Mesh(new THREE.BoxGeometry(0.28, 1, 0.28), barM); meter.add(bar);
  const zero = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.02, 0.5), new THREE.MeshBasicMaterial({ color: 0xffffff })); zero.position.y = 0.4; meter.add(zero);
  const mL = label('能量', { size: 0.2, bg: false, color: '#a9a29a' }); mL.position.set(0, -0.35, 0); meter.add(mL);
  const ctl = ctlRow(stage, '<button class="ef-btn" id="fz">再熔合一步 →</button><output id="eo" style="min-width:auto"></output>');
  const info = note(stage); info.innerHTML = '山的高度:原子核里每个质子或中子"抱得多紧"(比结合能,MeV)。越高越稳定。能量表为<b>示意</b>:按每个核子"抱紧程度"的变化估算。拖动可以转着看。';
  ctl.querySelector('#fz').onclick = () => {
    if (ci >= CHAIN.length - 1 || mv) return; const a = PTS.find(q => q[0] === CHAIN[ci]), b = PTS.find(q => q[0] === CHAIN[ci + 1]), d = b[2] - a[2]; ci++;
    energy += d; EF.play(d >= 0 ? 'fuse' : 'absorb'); EF.tone(Z[b[0]] || 20, 0.1);
    mv = { from: cur.position.clone(), to: posOf(b[0]), t: 0, sym: b[0], up: d >= 0 };
    ctl.querySelector('#eo').innerHTML = a[0] + ' → ' + b[0] + ':' + (d >= 0 ? '<span style="color:#ffc46b">放出能量 +' + d.toFixed(2) + '</span>' : '<span style="color:#7ad7ff">反而吸收 ' + d.toFixed(2) + '</span>') + ' MeV / 核子(示意)';
    if (b[0] === 'Fe') api.say('到山顶了。再往前一步试试,看看能量表会怎样?');
    if (b[0] === 'Kr') { ctl.querySelector('#fz').disabled = true; setTimeout(api.complete, 1300); }
  };
  let pulse = 0;
  S.onFrame((t, dt) => {
    world.rotation.y = S.yaw * 0.8 + (RM() ? 0 : Math.sin(t * 0.15) * 0.12); world.rotation.x = S.pitch * 0.35;
    if (mv) { mv.t += dt * (RM() ? 4 : 2.2); const k = ease(Math.min(1, mv.t)); cur.position.lerpVectors(mv.from, mv.to, k); cur.position.y += Math.sin(k * Math.PI) * 0.45;
      if (mv.t >= 1) { const s = mv.sym; world.remove(cur.userData.lab); const nl = label(s, { bg: false, color: '#1b1208', size: 0.24, depthTest: false }); nl.renderOrder = 3; cur.remove(cur.userData.lab); cur.add(nl); cur.userData.lab = nl;
        cur.userData.mesh.material.color.set(COL[s] || 0xffb35c); cur.userData.mesh.material.emissive.set(mv.up ? (COL[s] || 0xffb35c) : 0x7ad7ff);
        const mk = marks[s]; if (mk) mk.userData.mesh.material.color.set(COL[s] || 0xffb35c); pulse = 1; mv = null; } }
    curRing.position.copy(cur.position); curRing.lookAt(camera.position); curRing.scale.setScalar(1 + pulse * 0.6 + (RM() ? 0 : Math.sin(t * 3) * 0.05)); pulse *= 0.92;
    const eh = Math.max(-0.4, Math.min(1, energy / 1.8)) * 2.2; bar.scale.y = Math.max(0.02, Math.abs(eh)); bar.position.y = 0.4 + eh / 2;
    barM.color.set(energy >= 0 ? 0xffb35c : 0x7ad7ff); barM.emissive.set(energy >= 0 ? 0xffb35c : 0x7ad7ff);
  });
}

/* ============ 第 4 关:超新星与你的血(3D 旅程) ============ */
function L3(stage, api) {
  const S = stage3d(stage, { drag: false }), { scene, camera } = S; bgStars(scene, 900, 90);
  const STA = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(14, 1, -6), new THREE.Vector3(28, -0.5, -2), new THREE.Vector3(42, 0.5, 2)];
  const NODES = [['超新星爆发', '塌缩的铁核心变成中子星;冲击波在外层瞬间炼出新的铁,撒向太空', '铁是从哪里飞出来的:塌缩的核心,还是外面的壳层?'],
    ['星云', '铁和其他元素混进巨大的气体尘埃云', '这团云里除了铁,还会混进哪些上一代恒星留下的元素?'],
    ['太阳系与地球', '约 46 亿年前,星云塌缩成太阳和地球', '地球为什么会有一个大部分是铁的核心?'],
    ['你的血液', '铁进入食物,再进入血红蛋白,帮你运氧', '血为什么是红的?会不会和铁有关?']];
  camera.position.set(0, 0.6, 7); const look = new THREE.Vector3(0, 0, 0); camera.lookAt(look);
  /* 站 0:大质量恒星(洋葱层) */
  const star = new THREE.Group(); scene.add(star);
  const LAY = [[1.6, 0xff8a5c, 0.25], [1.3, 0xffd27a, 0.3], [1.05, 0x8a8f99, 0.35], [0.85, 0xff7ad9, 0.4], [0.68, 0x7ad7ff, 0.45], [0.52, 0xd9c49a, 0.6]];
  const shells = LAY.map(([r, c, o]) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 48, 36), new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.5, transparent: true, opacity: o, depthWrite: false })); star.add(m); return m; });
  const feCore = new THREE.Mesh(new THREE.SphereGeometry(0.3, 40, 30), new THREE.MeshStandardMaterial({ color: COL.Fe, metalness: 0.8, roughness: 0.3, emissive: 0x3a1a08, emissiveIntensity: 0.8 })); star.add(feCore);
  const feL = label('铁核心', { size: 0.22 }); feL.position.set(0, -0.62, 1.7); star.add(feL);
  const siL = label('硅层', { size: 0.2, color: '#d9c49a' }); siL.position.set(0.95, 0.75, 0.6); star.add(siL);
  const ns = new THREE.Mesh(new THREE.SphereGeometry(0.07, 20, 16), new THREE.MeshBasicMaterial({ color: 0xdfefff })); ns.visible = false; scene.add(ns);
  const nsG = glowSprite([[0, 'rgba(210,230,255,1)'], [0.25, 'rgba(150,190,255,.35)'], [1, 'rgba(0,0,0,0)']], 1.0); nsG.visible = false; scene.add(nsG);
  const shock = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 48), fresnelMaterial(0xffc884, 2.0, 0.02)); shock.visible = false; scene.add(shock);
  /* 站 1:星云 */
  const neb = new THREE.Group(); neb.position.copy(STA[1]); scene.add(neb);
  { const n = P.cloud >> 1, p = new Float32Array(n * 3), cc = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const u = Math.random() * 2 - 1, a = Math.random() * 6.283, q = Math.sqrt(1 - u * u), r = Math.pow(Math.random(), 0.6) * 3.2; p.set([Math.cos(a) * q * r * 1.4, u * r * 0.7, Math.sin(a) * q * r], i * 3);
      const col = new THREE.Color().setHSL(Math.random() < 0.15 ? 0.06 : 0.75 + Math.random() * 0.12, 0.7, 0.45 + Math.random() * 0.25); cc.set([col.r, col.g, col.b], i * 3); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3)); g.setAttribute('color', new THREE.BufferAttribute(cc, 3));
    neb.add(new THREE.Points(g, new THREE.PointsMaterial({ size: 0.07, vertexColors: true, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false }))); }
  /* 站 2:太阳系 */
  const sol = new THREE.Group(); sol.position.copy(STA[2]); scene.add(sol);
  const sunM = starMaterial(), sun = new THREE.Mesh(new THREE.SphereGeometry(0.7, 48, 36), sunM); sol.add(sun);
  sol.add(glowSprite([[0, 'rgba(255,220,150,.8)'], [0.35, 'rgba(255,150,60,.25)'], [1, 'rgba(0,0,0,0)']], 3.4));
  const orbit = new THREE.Mesh(new THREE.TorusGeometry(2.0, 0.006, 6, 128), new THREE.MeshBasicMaterial({ color: 0x5aa0e0, transparent: true, opacity: 0.45 })); orbit.rotation.x = Math.PI / 2; sol.add(orbit);
  const earth = new THREE.Group(); sol.add(earth);
  earth.add(new THREE.Mesh(new THREE.SphereGeometry(0.22, 32, 24), new THREE.MeshStandardMaterial({ color: 0x3a7ad0, roughness: 0.6, emissive: 0x0a1a3a })));
  const eCore = new THREE.Mesh(new THREE.SphereGeometry(0.1, 20, 16), new THREE.MeshStandardMaterial({ color: COL.Fe, emissive: COL.Fe, emissiveIntensity: 0.5 })); earth.add(eCore);
  earth.children[0].material.transparent = true; earth.children[0].material.opacity = 0.75;
  /* 站 3:红细胞(双凹圆盘) */
  const rbcG = new THREE.Group(); rbcG.position.copy(STA[3]); scene.add(rbcG);
  const prof = []; for (let i = 0; i <= 40; i++) { const r = i / 40 * 1.3, k = r / 1.3, th = 0.5 * Math.sqrt(Math.max(0, 1 - k * k)) * (0.207 + 2.003 * k * k - 1.123 * k * k * k * k); prof.push(new THREE.Vector2(r, th)); }
  for (let i = 40; i >= 0; i--) prof.push(new THREE.Vector2(prof[i].x, -prof[i].y));
  const rbcM = new THREE.MeshStandardMaterial({ color: 0xd0302a, roughness: 0.45, emissive: 0x3a0606, side: THREE.DoubleSide });
  for (let i = 0; i < 5; i++) { const m = new THREE.Mesh(new THREE.LatheGeometry(prof, 48), rbcM); const s = i ? 0.6 : 1; m.scale.setScalar(s); m.position.set(i ? (Math.random() - 0.5) * 6 : 0, i ? (Math.random() - 0.5) * 3 : 0, i ? -2 - Math.random() * 3 : 0); m.rotation.set(1.2 + Math.random() * 0.4, Math.random(), Math.random() * 0.5); rbcG.add(m); }
  const hb = label('血红蛋白里的铁', { size: 0.24 }); hb.position.set(0, 1.0, 0.4); rbcG.add(hb);
  /* 跟随的铁原子 */
  const fe = ballLabeled('Fe', COL.Fe, 0.16); fe.visible = false; scene.add(fe); const feGlow = glowSprite([[0, 'rgba(255,170,100,.7)'], [1, 'rgba(0,0,0,0)']], 0.9); fe.add(feGlow);

  const ctl = ctlRow(stage, '<button class="ef-btn" id="bang">让铁核心塌缩</button><button class="ef-btn" id="nx" hidden>铁的下一站 →</button>');
  const cap = note(stage), bang = ctl.querySelector('#bang'), nx = ctl.querySelector('#nx');
  cap.textContent = '这是一颗快要走到尽头的大质量恒星,中心已经堆满了铁。';
  let ph = 'core', t0 = 0, node = 0, mvT = 1, bursts = [], camFrom = camera.position.clone(), camTo = camera.position.clone(), lookFrom = look.clone(), lookTo = look.clone();
  bang.onclick = () => { bang.disabled = true; ph = 'collapse'; t0 = performance.now() / 1000; EF.play('whoosh'); };
  function goNode(k) {
    const op = document.getElementById('opts'); if (op) op.innerHTML = '';   /* 旅程中收起开头那道猜测题 */
    node = k; mvT = 0; camFrom.copy(camera.position); lookFrom.copy(look);
    const off = k === 3 ? new THREE.Vector3(0, 0.4, 3.6) : k === 2 ? new THREE.Vector3(0, 2.2, 5.2) : new THREE.Vector3(0, 0.8, 6.5);
    lookTo.copy(STA[k]); camTo.copy(STA[k]).add(off);
    cap.textContent = NODES[k][1]; api.say('<em>第 ' + (k + 1) + ' 站 · ' + NODES[k][0] + '</em><br>' + NODES[k][2]);
  }
  nx.onclick = () => { if (node < 3 && mvT >= 1) { EF.play(node === 2 ? 'fuse' : 'select'); EF.tone(26); goNode(node + 1); if (node === 3) { nx.disabled = true; setTimeout(api.complete, 1800); } } };
  S.onFrame((t, dt) => {
    const now = t, e = now - t0, tt = RM() ? 0 : t;
    sunM.uniforms.uT.value = tt; earth.position.set(Math.cos(tt * 0.3) * 2.0, 0, Math.sin(tt * 0.3) * 2.0); neb.rotation.y = tt * 0.03; rbcG.rotation.z = Math.sin(tt * 0.3) * 0.1;
    if (ph === 'core') star.rotation.y = tt * 0.1;
    if (ph === 'collapse') {
      const k = Math.min(1, e / 0.8); feCore.scale.setScalar(1 - k * 0.8); feL.visible = siL.visible = false;
      if (e > 0.85) {
        ph = 'boom'; t0 = now; EF.play('boom'); feCore.visible = false; ns.visible = nsG.visible = true; shock.visible = true;
        /* 铁从硅层(外壳)被冲击波新炼出、抛出,而不是从核心 */
        const n = RM() ? 0 : P.bubbles * 2, pos = [];
        bursts.push(shellBurst(scene, n || 1, 0.55, COL.Fe, 3.0, 0.3, 3.5), shellBurst(scene, (RM() ? 1 : P.bubbles * 4), 1.2, 0xffd8b0, 4.2, 0.16, 3.5));
      }
    } else if (ph === 'boom') {
      const s = e; shells.forEach((m, i) => { m.scale.setScalar(1 + s * (1.2 + i * 0.1)); m.material.opacity = Math.max(0, LAY[i][2] * (1 - s / 2.2)); });
      shock.scale.setScalar(0.6 + s * 2.4); shock.material.uniforms.uA.value = Math.max(0, 1 - s / 2.6);
      if (s > 2.6) { ph = 'trip'; star.visible = false; shock.visible = false; fe.visible = true; fe.position.set(1.2, 0.6, 1.5); nx.hidden = false; goNode(0); }
    }
    for (let i = bursts.length - 1; i >= 0; i--) if (!bursts[i].step(dt)) bursts.splice(i, 1);
    ns.position.set(0, 0, 0); nsG.position.copy(ns.position); nsG.scale.setScalar(0.9 + (RM() ? 0 : Math.sin(t * 6) * 0.1));
    if (ph === 'trip') {
      if (mvT < 1) { mvT = Math.min(1, mvT + dt * (RM() ? 10 : 0.55)); const k = ease(mvT); camera.position.lerpVectors(camFrom, camTo, k); camera.position.y += Math.sin(k * Math.PI) * 1.2; look.lerpVectors(lookFrom, lookTo, k); }
      const tgt = node === 3 ? STA[3].clone().add(new THREE.Vector3(0.15, 0.08, 0.35)) : node === 2 ? sol.position.clone().add(earth.position).add(new THREE.Vector3(0, 0.35, 0)) : look.clone().add(new THREE.Vector3(1.0, 0.5, 2.0));
      fe.position.lerp(tgt, 1 - Math.exp(-dt * 3)); 
    }
    camera.lookAt(look);
  });
}
/* 从球壳(半径 r)上发射的粒子:演示铁来自外层 */
function shellBurst(scene, n, r, col, speed, size, life) {
  const b = burst(scene, n, col, speed, size, life), pa = b.pts.geometry.attributes.position, va = b.pts.geometry.attributes.vel;
  for (let i = 0; i < n; i++) { const vx = va.getX(i), vy = va.getY(i), vz = va.getZ(i), l = Math.hypot(vx, vy, vz) || 1; pa.setXYZ(i, vx / l * r, vy / l * r, vz / l * r); }
  pa.needsUpdate = true; return b;
}

EF.S3 = { L0, L1, L2, L3 };
