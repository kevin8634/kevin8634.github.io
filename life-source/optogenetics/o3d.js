// 生命源码 · ls.optogenetics 全息标本(Three.js r169,本地 vendor)
// mountSpec(host, kind) → { set(state), dispose() }
// kind:alga 衣藻(眼点+鞭毛+台灯) / channel 通道视紫红质(膜上的光控门+正离子) / neuron 神经元(光锥+放电沿轴突跑) / worm 卡通小虫(培养皿)
// 卡通化、示意;低画质、无 WebGL 或加载失败:回落 Canvas 2D,数值与交互相同;减少动态效果:只在状态变化时画一帧;页面隐藏暂停。
import { tier, pixelRatio, particleScale, reducedMotion, visible } from '../ls-scene.js';

const EM = '#34d399', GOLD = '#e2be78';
export const LIGHT = { blue: '#4f8cff', yellow: '#ffd23f' };
/** 波长(纳米)→ 可见光颜色(近似) */
export function wlColor(nm) {
  let r = 0, g = 0, b = 0;
  if (nm < 440) { r = (440 - nm) / 60; b = 1; } else if (nm < 490) { g = (nm - 440) / 50; b = 1; } else if (nm < 510) { g = 1; b = (510 - nm) / 20; }
  else if (nm < 580) { r = (nm - 510) / 70; g = 1; } else if (nm < 645) { r = 1; g = (645 - nm) / 65; } else r = 1;
  const h = v => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}`;
}

export async function mountSpec(host, kind) {
  const box = document.createElement('div'); box.className = 'r3d'; host.append(box);
  if (tier() !== 'low') {
    try { return await mount3d(box, kind); } catch (e) { box.innerHTML = ''; }
  }
  return mountFlat(box, kind);
}

/* ---------------- 3D ---------------- */
async function mount3d(box, kind) {
  const THREE = await import('../vendor/three.module.min.js');
  const cv = document.createElement('canvas'); box.append(cv);
  const renderer = new THREE.WebGLRenderer({ canvas: cv, alpha: true, antialias: tier() === 'high', powerPreference: 'low-power' });
  renderer.setPixelRatio(pixelRatio());
  const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(34, 1, .1, 100);
  cam.position.set(0, 1.2, 7.4); cam.lookAt(0, 0, 0);
  const root = new THREE.Group(); scene.add(root);
  const glow = (col, op = 1) => new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: op, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
  const st = {}; let upd = () => {}, spin = 0, zNear = 7.4, zFar = 9.4;

  if (kind === 'alga') {
    // 衣藻:一个细胞,杯状叶绿体,红色眼点,前端两根鞭毛;左右可放台灯
    const cell = new THREE.Group(); root.add(cell);
    const body = new THREE.Mesh(new THREE.SphereGeometry(.7, 36, 24), glow('#5eead4', .22)); body.scale.set(1, .85, .85); cell.add(body);
    const rim = new THREE.Mesh(new THREE.SphereGeometry(.72, 36, 24), new THREE.MeshBasicMaterial({ color: EM, wireframe: true, transparent: true, opacity: .12 })); rim.scale.copy(body.scale); cell.add(rim);
    const cup = new THREE.Mesh(new THREE.SphereGeometry(.58, 30, 20, 0, Math.PI * 2, Math.PI * .35, Math.PI * .65), glow('#22c55e', .45)); cup.rotation.z = Math.PI / 2; cup.scale.set(.85, 1, .85); cell.add(cup);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(.1, 16, 12), glow('#ff5a4f', 1)); eye.position.set(.25, .45, .3); cell.add(eye);
    const eyeHalo = new THREE.Mesh(new THREE.SphereGeometry(.18, 16, 12), glow('#ff5a4f', .25)); eyeHalo.position.copy(eye.position); cell.add(eyeHalo);
    const flag = [0, 1].map(k => { const pts = Array.from({ length: 24 }, () => new THREE.Vector3()); const g = new THREE.BufferGeometry().setFromPoints(pts); const l = new THREE.Line(g, new THREE.LineBasicMaterial({ color: '#d1fae5', transparent: true, opacity: .85 })); cell.add(l); return { l, pts, k }; });
    const lamp = new THREE.Group(); root.add(lamp);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(.2, 20, 14), glow(GOLD, 1)); lamp.add(bulb);
    const halo = new THREE.Mesh(new THREE.SphereGeometry(.55, 20, 14), glow(GOLD, .15)); lamp.add(halo);
    st.lamp = -1; st.pos = 0; st.on = 1; let t = 0;
    upd = (dt = 0) => {
      t += dt; lamp.visible = !!st.on; lamp.position.set(st.lamp * 2.7, .2, 0);
      cell.position.x = st.pos; const face = st.on ? Math.sign(st.lamp - st.pos) || 1 : 1; cell.rotation.z = face > 0 ? 0 : Math.PI; cell.rotation.x = Math.sin(t * 2) * .08;
      flag.forEach(({ l, pts, k }) => { pts.forEach((p, i) => { const u = i / 23, a = (k ? 1 : -1) * (.35 + u * .9), w = Math.sin(t * 9 - u * 6 + k * 3) * .18 * u;
        p.set(.62 + u * .9 * Math.cos(a * .5), (k ? 1 : -1) * (u * .55) + w, 0); }); l.geometry.setFromPoints(pts); });
    };
  }

  if (kind === 'channel') {
    // 细胞膜上的一扇门:7 根螺旋柱围成通道,中间一根视黄醛;光从上方照下,正离子从上往下流过
    const memb = new THREE.Group(); root.add(memb);
    const N = Math.round(140 * particleScale() + 60), lip = new THREE.SphereGeometry(.06, 8, 6), lipM = glow('#5eead4', .35);
    for (let i = 0; i < N; i++) { const a = Math.random() * 6.28, r = 1 + Math.random() * 2.4; for (const y of [.55, -.55]) { const m = new THREE.Mesh(lip, lipM); m.position.set(Math.cos(a) * r, y, Math.sin(a) * r * .6); memb.add(m); } }
    const helix = []; const hg = new THREE.CylinderGeometry(.13, .13, 1.5, 12);
    for (let i = 0; i < 7; i++) { const m = new THREE.Mesh(hg, glow('#a78bfa', .6)); m.userData.a = i / 7 * 6.28; root.add(m); helix.push(m); }
    const ret = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, .7, 6), glow(GOLD, 1)); ret.rotation.z = 1.2; root.add(ret);
    const beam = new THREE.Mesh(new THREE.ConeGeometry(1.1, 2.6, 40, 1, true), glow('#4f8cff', .14)); beam.position.y = 1.9; root.add(beam);
    const ions = [], ig = new THREE.SphereGeometry(.07, 10, 8), IN = Math.round(30 * particleScale() + 12);
    for (let i = 0; i < IN; i++) { const m = new THREE.Mesh(ig, glow('#fb7185', .9)); m.userData = { a: Math.random() * 6.28, r: .9 + Math.random() * 1.4, y: 1 + Math.random() * 1.6, s: Math.random() }; root.add(m); ions.push(m); }
    st.open = 0; st.col = '#4f8cff'; st.light = 0; let t = 0;
    upd = (dt = 0) => {
      t += dt; const o = st.open, R = .26 + o * .2;
      helix.forEach(m => { const a = m.userData.a; m.position.set(Math.cos(a) * R, 0, Math.sin(a) * R); m.rotation.set(Math.sin(a) * .25 * (1 - o), 0, Math.cos(a) * .25 * (1 - o)); });
      ret.rotation.y = o * 1.5; beam.visible = !!st.light; beam.material.color.set(st.col); beam.material.opacity = .08 + .12 * st.light;
      ions.forEach(m => { const d = m.userData;
        if (o > .15) { d.y -= dt * (1.2 + o * 2.2) * (d.s + .5); d.r = Math.max(.02, d.r - dt * 2.2 * o); if (d.y < -2.2) { d.y = 2.2 + Math.random(); d.r = .9 + Math.random() * 1.4; d.a = Math.random() * 6.28; } }
        else { d.y += Math.sin(t * 3 + d.a) * dt * .2; if (d.y < .85) d.y = .85 + Math.random() * 1.2; d.r = Math.max(d.r, .8); }
        m.position.set(Math.cos(d.a + t * .3) * d.r, d.y, Math.sin(d.a + t * .3) * d.r * .6); });
    };
    root.rotation.x = .12; zNear = 7.8; zFar = 10;
  }

  if (kind === 'neuron') {
    // 神经元:胞体 + 树突 + 轴突;装上光开关后胞体表面出现小门;光锥从上照向胞体;每次放电一颗亮珠沿轴突跑
    const soma = new THREE.Mesh(new THREE.SphereGeometry(.55, 32, 22), glow('#5eead4', .35)); soma.position.set(-1.7, 0, 0); root.add(soma);
    const core = new THREE.Mesh(new THREE.SphereGeometry(.22, 20, 14), glow(EM, .8)); core.position.copy(soma.position); root.add(core);
    const tube = (pts, r, col, op) => { const c = new THREE.CatmullRomCurve3(pts); root.add(new THREE.Mesh(new THREE.TubeGeometry(c, 60, r, 8), glow(col, op))); return c; };
    const V = (x, y, z = 0) => new THREE.Vector3(x, y, z);
    [[-2.6, .9], [-2.8, -.2], [-2.4, -1], [-1.5, 1.1], [-1.2, -1]].forEach(([x, y]) => tube([V(-1.7, 0), V((x - 1.7) / 2 - .3, y * .6), V(x, y, (Math.random() - .5) * .5)], .04, '#6ee7b7', .55));
    const axon = tube([V(-1.2, 0), V(-.2, .25), V(.9, -.15), V(2.1, .1), V(2.6, 0)], .07, '#6ee7b7', .7);
    const ends = [[2.95, .4], [3, -.3], [2.7, -.6]].map(([x, y]) => { tube([V(2.6, 0), V(x, y)], .035, '#6ee7b7', .55); const b = new THREE.Mesh(new THREE.SphereGeometry(.09, 12, 8), glow(GOLD, .8)); b.position.set(x, y, 0); root.add(b); return b; });
    const gates = [], gg = new THREE.TorusGeometry(.07, .025, 6, 14);
    for (let i = 0; i < 16; i++) { const m = new THREE.Mesh(gg, glow('#a78bfa', .9)); const ph = Math.acos(1 - 2 * (i + .5) / 16), th = i * 2.4; const n = V(Math.sin(ph) * Math.cos(th), Math.cos(ph), Math.sin(ph) * Math.sin(th)); m.position.copy(soma.position).addScaledVector(n, .56); m.lookAt(soma.position); root.add(m); gates.push(m); }
    const cone = new THREE.Mesh(new THREE.ConeGeometry(.9, 2.4, 36, 1, true), glow(LIGHT.blue, .2)); cone.position.set(-1.7, 1.6, 0); root.add(cone);
    const beads = []; const bg = new THREE.SphereGeometry(.13, 14, 10);
    st.installed = 0; st.light = null; st.flash = 0; st.spike = 0; st.silenced = 0; let lastSpike = 0, flashT = 0;
    upd = (dt = 0) => {
      gates.forEach((m, i) => { const s = Math.min(1, Math.max(0, st.installed * 16 - i)); m.scale.setScalar(s || .0001); m.visible = s > 0; });
      if (st.spike !== lastSpike) { lastSpike = st.spike; flashT = 1; const b = new THREE.Mesh(bg, glow('#fff7d6', 1)); b.userData.u = 0; root.add(b); beads.push(b); ends.forEach(e => (e.userData.f = 1)); }
      flashT = Math.max(0, flashT - dt * 6); core.material.color.set(flashT > .05 ? '#fff7d6' : st.silenced ? '#64748b' : EM); core.scale.setScalar(1 + flashT * .6);
      for (let i = beads.length - 1; i >= 0; i--) { const b = beads[i]; b.userData.u += dt * 1.6; if (b.userData.u >= 1) { root.remove(b); b.material.dispose(); beads.splice(i, 1); continue; } b.position.copy(axon.getPointAt(b.userData.u)); }
      ends.forEach(e => { e.userData.f = Math.max(0, (e.userData.f || 0) - dt * 2); e.scale.setScalar(1 + e.userData.f * .8); });
      cone.visible = !!st.light; if (st.light) { cone.material.color.set(LIGHT[st.light]); cone.material.opacity = .08 + .22 * st.flash; }
      soma.material.color.set(st.silenced ? '#64748b' : '#5eead4');
      if (reducedMotion() && beads.length) { beads.forEach(b => { root.remove(b); b.material.dispose(); }); beads.length = 0; }
    };
    root.rotation.x = .15; zNear = 8.6; zFar = 12;
  }

  if (kind === 'worm') {
    // 卡通小虫在培养皿里游;蓝光 = 身体收缩变短;黄光 = 停下、放松;叶子是终点(卡通示意,不表现实验细节)
    const dish = new THREE.Mesh(new THREE.TorusGeometry(2.9, .05, 8, 120), glow('#d1fae5', .45)); dish.rotation.x = Math.PI / 2; root.add(dish);
    const floor = new THREE.Mesh(new THREE.CircleGeometry(2.9, 80), glow('#0e7490', .12)); floor.rotation.x = -Math.PI / 2; floor.position.y = -.02; root.add(floor);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(3.05, .09, 8, 120), glow(LIGHT.blue, .0)); ring.rotation.x = Math.PI / 2; root.add(ring);
    const leaf = new THREE.Mesh(new THREE.CircleGeometry(.42, 30), new THREE.MeshBasicMaterial({ color: '#16a34a', transparent: true, opacity: .8 })); leaf.rotation.x = -Math.PI / 2; leaf.scale.set(1.5, .8, 1); leaf.position.y = .01; root.add(leaf);
    const vein = new THREE.Mesh(new THREE.PlaneGeometry(1.1, .03), glow('#bbf7d0', .7)); vein.rotation.x = -Math.PI / 2; vein.position.y = .02; root.add(vein);
    const NS = 18, segs = [];
    for (let i = 0; i < NS; i++) { const u = i / (NS - 1), r = .15 * (1 - Math.abs(u - .4) * .9) + .05; const m = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), new THREE.MeshBasicMaterial({ color: i === 0 ? '#fde68a' : i % 2 ? '#f472b6' : '#f9a8d4' })); root.add(m); segs.push(m); }
    const eyes = [-1, 1].map(s => { const m = new THREE.Mesh(new THREE.SphereGeometry(.035, 8, 6), new THREE.MeshBasicMaterial({ color: '#0b1220' })); root.add(m); return { m, s }; });
    st.x = -1.8; st.dir = 1; st.mode = 'swim'; st.light = null; st.leaf = 1.2; let ph = 0, amp = .22, len = 1.3;
    upd = (dt = 0) => {
      const m = st.mode, ampT = m === 'swim' ? .22 : m === 'stop' ? .03 : .12, lenT = m === 'contract' ? .85 : m === 'stop' ? 1.42 : 1.3;
      amp += (ampT - amp) * Math.min(1, dt * 6); len += (lenT - len) * Math.min(1, dt * 6); if (m === 'swim') ph += dt * 7; if (m === 'contract') ph += dt * 1.5;
      segs.forEach((s, i) => { const u = i / (NS - 1), x = st.x - st.dir * (u - .3) * len, z = Math.sin(ph - u * 5) * amp * (.4 + u * .8); s.position.set(x, .1, z); });
      const h = segs[0].position; eyes.forEach(({ m: e, s }) => e.position.set(h.x + st.dir * .1, .24, h.z + s * .07));
      leaf.position.x = vein.position.x = st.leaf;
      ring.material.opacity = st.light ? .55 : 0; if (st.light) ring.material.color.set(LIGHT[st.light]);
    };
    cam.position.set(0, 7.6, 4.2); cam.lookAt(0, 0, 0); zNear = 4.2; zFar = 6.2;
  }

  const size = () => { const w = box.clientWidth, h = box.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); cam.aspect = w / h;
    const z = w / h < 1 ? zFar : zNear; if (kind === 'worm') { cam.position.set(0, z * 1.8, z); cam.lookAt(0, 0, 0); } else cam.position.z = z; cam.updateProjectionMatrix(); };
  const ro = new ResizeObserver(() => { size(); if (reducedMotion()) draw(0); }); ro.observe(box); size();
  const draw = dt => { upd(dt); renderer.render(scene, cam); };
  let raf = 0, last = performance.now(), dead = false;
  const frame = now => { if (dead) return; const dt = Math.min(.05, (now - last) / 1000); last = now; if (visible()) { root.rotation.y += dt * spin; draw(dt); } raf = requestAnimationFrame(frame); };
  if (reducedMotion()) draw(0); else raf = requestAnimationFrame(frame);
  return {
    gl: true,
    set(s) { Object.assign(st, s); if (reducedMotion()) draw(0); },
    dispose() { dead = true; cancelAnimationFrame(raf); ro.disconnect(); renderer.dispose(); box.remove(); },
  };
}

/* ---------------- 2D 回落(低画质 / 无 WebGL) ---------------- */
function mountFlat(box, kind) {
  box.classList.add('flat');
  const cv = document.createElement('canvas'); box.append(cv);
  const st = { lamp: -1, pos: 0, on: 1, open: 0, col: '#4f8cff', light: null, installed: 0, flash: 0, spike: 0, silenced: 0, x: -1.8, dir: 1, mode: 'swim', leaf: 1.2 };
  let lastSpike = 0, hot = 0;
  const draw = () => {
    const D = Math.min(devicePixelRatio || 1, 2), W = box.clientWidth, H = box.clientHeight; if (!W || !H) return;
    cv.width = W * D; cv.height = H * D; const g = cv.getContext('2d'); g.scale(D, D); g.clearRect(0, 0, W, H);
    const cx = W / 2, cy = H / 2, S = Math.min(W / 7, H / 3.6); g.lineCap = 'round';
    const dot = (x, y, r, c) => { g.fillStyle = c; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); };
    if (kind === 'alga') {
      const x = cx + st.pos * S, f = st.on ? Math.sign(st.lamp - st.pos) || 1 : 1;
      if (st.on) { dot(cx + st.lamp * 2.7 * S, cy, S * .5, 'rgba(226,190,120,.18)'); dot(cx + st.lamp * 2.7 * S, cy, S * .2, GOLD); }
      g.fillStyle = 'rgba(94,234,212,.25)'; g.strokeStyle = EM; g.lineWidth = 2; g.beginPath(); g.ellipse(x, cy, S * .7, S * .6, 0, 0, 7); g.fill(); g.stroke();
      dot(x - f * S * .15, cy, S * .4, 'rgba(34,197,94,.45)'); dot(x + f * S * .3, cy - S * .3, S * .1, '#ff5a4f');
      g.strokeStyle = '#d1fae5'; g.lineWidth = 2; [-1, 1].forEach(s => { g.beginPath(); g.moveTo(x + f * S * .6, cy); g.quadraticCurveTo(x + f * S * 1.2, cy + s * S * .2, x + f * S * 1.4, cy + s * S * .6); g.stroke(); });
    }
    if (kind === 'channel') {
      g.fillStyle = 'rgba(94,234,212,.18)'; g.fillRect(0, cy - S * .55, W, S * 1.1);
      const gap = S * (.18 + st.open * .3);
      g.fillStyle = 'rgba(167,139,250,.75)'; g.fillRect(cx - gap - S * .35, cy - S * .7, S * .35, S * 1.4); g.fillRect(cx + gap, cy - S * .7, S * .35, S * 1.4);
      if (st.light) { g.fillStyle = st.col + '33'; g.beginPath(); g.moveTo(cx - S * .3, 0); g.lineTo(cx + S * .3, 0); g.lineTo(cx + S * 1.1, cy - S * .6); g.lineTo(cx - S * 1.1, cy - S * .6); g.fill(); }
      for (let i = 0; i < 9; i++) { const k = i / 9; const flowing = st.open > .15 && i < Math.round(st.open * 9); dot(flowing ? cx + (k - .5) * gap : cx + (k - .5) * S * 3.4, flowing ? cy - S * .9 + k * S * 1.9 : cy - S * 1.1 - (i % 3) * 8, 5, '#fb7185'); }
    }
    if (kind === 'neuron') {
      if (st.spike !== lastSpike) { lastSpike = st.spike; hot = 1; }
      const sx = cx - S * 1.7;
      g.strokeStyle = '#6ee7b7'; g.lineWidth = 4; g.beginPath(); g.moveTo(sx, cy); g.bezierCurveTo(cx - S * .4, cy - S * .4, cx + S, cy + S * .3, cx + S * 2.6, cy); g.stroke();
      g.lineWidth = 2; [[-1, -.8], [-1.1, .3], [-.6, 1]].forEach(([a, b]) => { g.beginPath(); g.moveTo(sx, cy); g.lineTo(sx + a * S, cy + b * S); g.stroke(); });
      if (st.light) { g.fillStyle = LIGHT[st.light] + Math.round(40 + 120 * st.flash).toString(16).padStart(2, '0'); g.beginPath(); g.moveTo(sx - S * .2, 0); g.lineTo(sx + S * .2, 0); g.lineTo(sx + S * .8, cy - S * .3); g.lineTo(sx - S * .8, cy - S * .3); g.fill(); }
      dot(sx, cy, S * .55, st.silenced ? 'rgba(100,116,139,.55)' : 'rgba(94,234,212,.4)'); dot(sx, cy, S * .22, hot > .5 ? '#fff7d6' : st.silenced ? '#64748b' : EM);
      for (let i = 0; i < Math.round(st.installed * 10); i++) { const a = i / 10 * 6.28; g.strokeStyle = '#a78bfa'; g.lineWidth = 2; g.beginPath(); g.arc(sx + Math.cos(a) * S * .55, cy + Math.sin(a) * S * .55, 4, 0, 7); g.stroke(); }
      if (hot > .5) dot(cx + S * 2.6, cy, 7, GOLD); hot *= .4;
    }
    if (kind === 'worm') {
      g.strokeStyle = st.light ? LIGHT[st.light] : 'rgba(209,250,229,.5)'; g.lineWidth = st.light ? 4 : 2; g.beginPath(); g.ellipse(cx, cy, S * 3, S * 1.5, 0, 0, 7); g.stroke();
      g.fillStyle = 'rgba(74,222,128,.5)'; g.beginPath(); g.ellipse(cx + st.leaf * S, cy, S * .6, S * .3, 0, 0, 7); g.fill();
      const len = st.mode === 'contract' ? .85 : st.mode === 'stop' ? 1.42 : 1.3, amp = st.mode === 'stop' ? .03 : st.mode === 'contract' ? .1 : .2;
      g.strokeStyle = '#f9a8d4'; g.lineWidth = 9; g.beginPath();
      for (let i = 0; i <= 16; i++) { const u = i / 16, x = cx + (st.x - st.dir * (u - .3) * len) * S, y = cy + Math.sin(performance.now() / 150 * (st.mode === 'swim' ? 1 : 0) - u * 5) * amp * S * (.4 + u); i ? g.lineTo(x, y) : g.moveTo(x, y); }
      g.stroke(); dot(cx + (st.x + st.dir * .3 * len) * S, cy, 6, '#fde68a');
    }
  };
  const ro = new ResizeObserver(draw); ro.observe(box); draw();
  return { gl: false, set(s) { Object.assign(st, s); draw(); }, dispose() { ro.disconnect(); box.remove(); } };
}
