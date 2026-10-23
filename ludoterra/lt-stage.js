/* 觉弈 Ludoterra · 任务背景舞台(R1,v0.30)
 * 每关一个 Three.js 3D 背景舞台,按关卡主题与所属域配色;随关卡四步变化:
 *   ① 先中招 = 平静  ② 再看见 = 规则显形  ③ 坐到庄家那边 = 视角翻转  ④ 玩家手册 = 定格
 * 从首页星盘俯冲进来时,先穿过一段金色粒子隧道(约 1.1 秒)。
 * 性能三档:高(全量粒子,DPR 桌面≤2/手机≤1.5)、中(粒子减半,DPR≤1.25)、低(不用 WebGL,CSS 渐变)。
 * 自动检测,顶栏「画质」可手动切换(gn:lt:quality,仅本机);页面隐藏暂停;减少动态效果时静止;无 WebGL 自动降级。 */

const KEY = 'gn:lt:quality';
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const MOBILE = matchMedia('(pointer: coarse)').matches || Math.min(screen.width, screen.height) < 600;
const LABEL = { high: '高', mid: '中', low: '低' };
const CSSBG = {
  compound: ['#f5c26b', '#3a2a0c'], prisoner: ['#f0a860', '#3a1f10'], sunk: ['#e9c779', '#1c1a33'], cocoon: ['#e9d39a', '#14243a'],
  survivor: ['#e9d39a', '#2a2412'], nature: ['#f0a860', '#202036'], sleep: ['#b9b4ff', '#15123a'], wave: ['#8fd3ff', '#0d2236'],
  echo: ['#f7b98a', '#2a1630'], meaning: ['#fff3d6', '#2a2410']
};

function autoTier() {
  const c = document.createElement('canvas'); let gl = null;
  try { gl = c.getContext('webgl2') || c.getContext('webgl'); } catch (_) {}
  if (!gl) return 'low';
  const cores = navigator.hardwareConcurrency || 4, mem = navigator.deviceMemory || 4;
  if (MOBILE || cores <= 4 || mem <= 4) return 'mid';
  return 'high';
}
export function getTier() { const s = localStorage.getItem(KEY); return s === 'high' || s === 'mid' || s === 'low' ? s : autoTier(); }

let current = null;

export async function initStage(id) {
  if (!id || !CSSBG[id]) return;
  addButton(id);
  start(id);
}

function addButton(id) {
  const top = document.querySelector('.lt-top'); if (!top || top.querySelector('#ltQ')) return;
  const b = document.createElement('button'); b.className = 'lt-btn lt-q'; b.id = 'ltQ'; b.type = 'button';
  const paint = () => { const t = getTier(); b.textContent = '画质 ' + LABEL[t]; b.title = '背景舞台画质:高 = 全效粒子;中 = 粒子减半;低 = 不用 3D(功能不变)。点按切换'; b.setAttribute('aria-label', '背景画质:' + LABEL[t] + ',点按切换'); };
  b.onclick = () => { const order = ['high', 'mid', 'low']; const n = order[(order.indexOf(getTier()) + 1) % 3]; localStorage.setItem(KEY, n); paint(); stop(); start(id, true); };
  const snd = top.querySelector('#ltSound'); top.insertBefore(b, snd || null); paint();
}

function cssFallback(id) {
  const [c, d] = CSSBG[id];
  document.documentElement.classList.add('lt-stage-css');
  document.documentElement.style.setProperty('--st-c', c); document.documentElement.style.setProperty('--st-d', d);
}

function stop() { if (current) { current.dispose(); current = null; } document.documentElement.classList.remove('lt-stage-css'); }

function readStep() { const tabs = [...document.querySelectorAll('#steps span')]; const i = tabs.findIndex(t => t.classList.contains('on')); return i < 0 ? 0 : i; }

async function start(id, manual = false) {
  const tier = getTier();
  if (tier === 'low') return cssFallback(id);
  let THREE; try { THREE = await import('./vendor/three.module.min.js'); } catch (_) { return cssFallback(id); }
  const cv = document.createElement('canvas'); cv.className = 'lt-stage'; cv.setAttribute('aria-hidden', 'true');
  let R;
  try { R = new THREE.WebGLRenderer({ canvas: cv, antialias: tier === 'high', alpha: false, powerPreference: 'high-performance' }); }
  catch (_) { return cssFallback(id); }
  document.body.prepend(cv); const vig = document.createElement('div'); vig.className = 'lt-vig'; cv.after(vig);
  const q = tier === 'high' ? 1 : 0.5;
  const dprCap = tier === 'high' ? (MOBILE ? 1.5 : 2) : 1.25;
  R.setPixelRatio(Math.min(devicePixelRatio || 1, dprCap));
  const scene = new THREE.Scene(); const bg = new THREE.Color(0x070814); scene.background = bg; scene.fog = new THREE.FogExp2(0x070814, 0.035);
  const cam = new THREE.PerspectiveCamera(55, 1, 0.1, 200);
  const size = () => { const w = innerWidth, h = innerHeight; R.setSize(w, h, false); cam.aspect = w / h; cam.fov = w / h < 0.8 ? 70 : 55; cam.updateProjectionMatrix(); };
  size(); addEventListener('resize', size);

  /* 共用:柔光粒子材质(每点颜色、大小) */
  const ptsMat = (opts = {}) => new THREE.ShaderMaterial({
    uniforms: { uT: { value: 0 }, uA: { value: opts.alpha ?? 1 }, uS: { value: (opts.size ?? 1) * R.getPixelRatio() } },
    vertexShader: `attribute float size; attribute vec3 color; varying vec3 vC; uniform float uS; uniform float uT;
      void main(){ vC=color; vec4 mv=modelViewMatrix*vec4(position,1.); gl_PointSize=size*uS*(42./max(.5,-mv.z)); gl_Position=projectionMatrix*mv; }`,
    fragmentShader: `varying vec3 vC; uniform float uA; void main(){ vec2 p=gl_PointCoord-.5; float d=length(p); float a=smoothstep(.5,0.,d); a=a*a; gl_FragColor=vec4(vC*a*uA,1.); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
  });
  const makePts = (n, fill, opts = {}) => {
    const pos = new Float32Array(n * 3), col = new Float32Array(n * 3), sz = new Float32Array(n);
    for (let i = 0; i < n; i++) fill(i, pos, col, sz);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setAttribute('size', new THREE.BufferAttribute(sz, 1));
    const m = ptsMat(opts); const p = new THREE.Points(g, m); p.frustumCulled = false; return p;
  };
  const C = hex => new THREE.Color(hex);
  const setC = (arr, i, c, k = 1) => { arr[i * 3] = c.r * k; arr[i * 3 + 1] = c.g * k; arr[i * 3 + 2] = c.b * k; };
  const rnd = (a, b) => a + Math.random() * (b - a);

  /* 星空底 */
  const stars = makePts(Math.round(1400 * q), (i, p, c, s) => {
    const r = rnd(30, 80), th = rnd(0, Math.PI * 2), ph = Math.acos(rnd(-1, 1));
    p[i * 3] = r * Math.sin(ph) * Math.cos(th); p[i * 3 + 1] = r * Math.cos(ph); p[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
    setC(c, i, C(Math.random() < .3 ? 0xffe3a6 : 0xcfd6ff), rnd(.25, .8)); s[i] = rnd(.6, 1.8);
  }, { size: 1 });
  scene.add(stars);
  scene.add(new THREE.AmbientLight(0x404060, 1.2));
  const key = new THREE.PointLight(0xffd79a, 60, 40); key.position.set(4, 6, 6); scene.add(key);

  const ctx = { THREE, scene, q, makePts, C, setC, rnd, cam };
  const theme = (BUILD[id] || BUILD.meaning)(ctx);
  const rig = theme.rig || { r: 11, y: 2, look: [0, 0.5, 0], a: 0 };

  /* 进关转场:金色粒子隧道 */
  let warp = 0;
  try { const t = +sessionStorage.getItem('gn:lt:dive'); sessionStorage.removeItem('gn:lt:dive'); if (t && Date.now() - t < 4000 && !RM && !manual) warp = 1; } catch (_) {}
  let tunnel = null;
  if (warp) {
    const n = Math.round(900 * q); const pos = new Float32Array(n * 6), col = new Float32Array(n * 6), seeds = [];
    for (let i = 0; i < n; i++) { seeds.push([rnd(0, Math.PI * 2), rnd(0.6, 4), rnd(-40, 2)]); const k = rnd(.4, 1); const cc = C(Math.random() < .7 ? 0xf5c26b : 0xfff3d6); setC(col, i * 2, cc, k); setC(col, i * 2 + 1, cc, k * .1); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const m = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
    tunnel = new THREE.LineSegments(g, m); tunnel.frustumCulled = false; scene.add(tunnel); tunnel.userData.seeds = seeds;
    document.documentElement.classList.add('lt-warping');
  }

  /* 渲染循环 */
  let step = readStep(), s = step, t0 = performance.now(), last = t0, raf = 0, alive = true, slow = 0, frames = 0;
  const mo = new MutationObserver(() => { step = readStep(); if (RM) { s = step; frame(performance.now()); } });
  const steps = document.getElementById('steps'); if (steps) mo.observe(steps, { subtree: true, attributes: true, attributeFilter: ['class'] });
  const look = new THREE.Vector3();
  function frame(now) {
    const dt = Math.min(0.1, (now - last) / 1000); last = now; const t = (now - t0) / 1000;
    s += (step - s) * Math.min(1, dt * 1.6);
    const flip = Math.min(1, Math.max(0, s - 1)), hold = Math.max(0, s - 2);
    const ang = rig.a + flip * (rig.flip ?? 0.85) + (RM ? 0 : Math.sin(t * 0.07) * 0.06);
    const rr = rig.r * (1 + hold * 0.18) * (1 + warp * warp * 0.0);
    cam.position.set(Math.sin(ang) * rr, rig.y + flip * 1.2 + hold * 0.8, Math.cos(ang) * rr - warp * warp * 0);
    look.set(...rig.look); cam.lookAt(look);
    if (tunnel) {
      warp = Math.max(0, warp - dt / 1.1);
      const p = tunnel.geometry.attributes.position.array, seeds = tunnel.userData.seeds, sp = 60 * (0.3 + warp);
      const fw = new THREE.Vector3(); cam.getWorldDirection(fw); const up = new THREE.Vector3(0, 1, 0), rt = new THREE.Vector3().crossVectors(fw, up).normalize(); up.crossVectors(rt, fw);
      seeds.forEach((sd, i) => { sd[2] += sp * dt; if (sd[2] > 2) sd[2] -= 42; const len = 0.4 + warp * 3.5;
        for (let k = 0; k < 2; k++) { const z = sd[2] - k * len; const o = cam.position.clone().addScaledVector(fw, -z).addScaledVector(rt, Math.cos(sd[0]) * sd[1]).addScaledVector(up, Math.sin(sd[0]) * sd[1]);
          p[(i * 2 + k) * 3] = o.x; p[(i * 2 + k) * 3 + 1] = o.y; p[(i * 2 + k) * 3 + 2] = o.z; } });
      tunnel.geometry.attributes.position.needsUpdate = true; tunnel.material.opacity = Math.min(1, warp * 1.6);
      cam.fov = (innerWidth / innerHeight < 0.8 ? 70 : 55) + warp * 30; cam.updateProjectionMatrix();
      if (warp <= 0) { scene.remove(tunnel); tunnel.geometry.dispose(); tunnel.material.dispose(); tunnel = null; document.documentElement.classList.remove('lt-warping'); size(); }
    }
    theme.update(RM ? 0 : t, RM ? 0 : dt, s);
    stars.rotation.y = RM ? 0 : t * 0.004;
    R.render(scene, cam);
    /* 卡顿保护:高档前 90 帧平均 > 34ms 自动降到中档(只改本次,不写偏好) */
    if (!RM) { frames++; if (dt > 0.034) slow++; if (frames === 90 && slow > 60 && R.getPixelRatio() > 1) { R.setPixelRatio(1); size(); } }
  }
  function loop(now) { if (!alive) return; raf = requestAnimationFrame(loop); frame(now); }
  const vis = () => { if (document.hidden) { cancelAnimationFrame(raf); raf = 0; } else if (!RM && !raf && alive) { last = performance.now(); raf = requestAnimationFrame(loop); } };
  document.addEventListener('visibilitychange', vis);
  cv.addEventListener('webglcontextlost', e => { e.preventDefault(); cancelAnimationFrame(raf); raf = 0; });
  cv.addEventListener('webglcontextrestored', () => { stop(); start(id, true); });
  if (RM) frame(performance.now()); else raf = requestAnimationFrame(loop);
  requestAnimationFrame(() => cv.classList.add('on'));
  window.__ltStage = { id, tier, get step() { return step; } };
  current = { dispose() { alive = false; cancelAnimationFrame(raf); mo.disconnect(); removeEventListener('resize', size); document.removeEventListener('visibilitychange', vis);
    scene.traverse(o => { o.geometry && o.geometry.dispose(); if (o.material) [].concat(o.material).forEach(m => m.dispose()); }); R.dispose(); cv.remove(); vig.remove(); document.documentElement.classList.remove('lt-warping'); } };
}

/* ---------------- 九关 + 终章 舞台 ---------------- */
const BUILD = {
  /* 复利:金色复利曲线 + 金币堆;看见时曲线陡升 */
  compound({ THREE, scene, q, makePts, C, setC, rnd }) {
    const N = Math.round(3200 * q), gold = C(0xf5c26b), pale = C(0xffe3a6);
    const u = new Float32Array(N), off = new Float32Array(N * 3);
    const pts = makePts(N, (i, p, c, s) => { u[i] = Math.random(); off[i * 3] = rnd(-.25, .25); off[i * 3 + 1] = rnd(-.25, .25) * (1 + Math.random() * 2); off[i * 3 + 2] = rnd(-.35, .35); setC(c, i, Math.random() < .2 ? pale : gold, rnd(.5, 1)); s[i] = rnd(.8, 2.4); }, { size: 1 });
    scene.add(pts);
    const grid = new THREE.GridHelper(40, 40, 0xf5c26b, 0xf5c26b); grid.material.transparent = true; grid.material.opacity = .12; grid.position.y = -2.4; scene.add(grid);
    const coinG = new THREE.CylinderGeometry(.42, .42, .07, 28), coinM = new THREE.MeshStandardMaterial({ color: 0xf5c26b, metalness: .9, roughness: .28, emissive: 0x3a2508 });
    const MAXC = 160; const coins = new THREE.InstancedMesh(coinG, coinM, MAXC); scene.add(coins);
    const M = new THREE.Matrix4(), V = new THREE.Vector3(), Q = new THREE.Quaternion(), S = new THREE.Vector3(1, 1, 1);
    const curve = (x, k) => -2.2 + (Math.exp((x + 6) * k) - 1) * (5.6 / (Math.exp(12 * k) - 1));
    return { rig: { r: 12, y: 1.5, look: [0, .6, 0], a: -0.25 },
      update(t, dt, s) {
        const k = 0.12 + Math.min(1, s) * 0.16; const pa = pts.geometry.attributes.position.array;
        for (let i = 0; i < N; i++) { const uu = (u[i] + t * 0.03) % 1; const x = -6 + uu * 12; pa[i * 3] = x + off[i * 3]; pa[i * 3 + 1] = curve(x, k) + off[i * 3 + 1] * (0.4 + uu); pa[i * 3 + 2] = off[i * 3 + 2]; }
        pts.geometry.attributes.position.needsUpdate = true;
        let n = 0; for (let j = 0; j < 10 && n < MAXC; j++) { const x = -5.4 + j * 1.2, h = Math.max(1, Math.round((curve(x, k) + 2.4) * 3.2 * (0.6 + 0.4 * Math.min(1, s + .4))));
          for (let c = 0; c < h && n < MAXC; c++, n++) { V.set(x, -2.36 + c * .075, 1.1); Q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), c * .3 + t * .1); M.compose(V, Q, S); coins.setMatrixAt(n, M); } }
        coins.count = n; coins.instanceMatrix.needsUpdate = true;
      } };
  },
  /* 合作与博弈:两群玩家,信任连线随「再见面」变多变亮 */
  prisoner({ THREE, scene, q, makePts, C, setC, rnd }) {
    const n = 46, nodes = [];
    for (let i = 0; i < n; i++) { const side = i < n / 2 ? -1 : 1; nodes.push(new THREE.Vector3(side * rnd(1.5, 5), rnd(-1.8, 2.6), rnd(-2.5, 2.5))); }
    const pts = makePts(n, (i, p, c, s) => { p.set([nodes[i].x, nodes[i].y, nodes[i].z], i * 3); setC(c, i, C(i < n / 2 ? 0xf0a860 : 0xf5c26b)); s[i] = 7; }, { size: 1 });
    scene.add(pts);
    const pairs = []; for (let i = 0; i < 90; i++) pairs.push([Math.floor(Math.random() * n / 2), n / 2 + Math.floor(Math.random() * n / 2), Math.random()]);
    const pos = new Float32Array(pairs.length * 6), col = new Float32Array(pairs.length * 6);
    pairs.forEach(([a, b], i) => { pos.set([nodes[a].x, nodes[a].y, nodes[a].z, nodes[b].x, nodes[b].y, nodes[b].z], i * 6); });
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const lines = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); scene.add(lines);
    const gc = C(0xf5c26b);
    return { rig: { r: 11, y: 1.2, look: [0, .4, 0], a: 0 },
      update(t, dt, s) { const vis = 0.12 + Math.min(1, s) * 0.55;
        pairs.forEach(([, , ph], i) => { const k = (ph < vis ? 1 : 0.06) * (0.35 + 0.65 * Math.max(0, Math.sin(t * 1.4 + ph * 20))); setC(col, i * 2, gc, k); setC(col, i * 2 + 1, gc, k); });
        g.attributes.color.needsUpdate = true; pts.rotation.y = lines.rotation.y = Math.sin(t * .1) * .15; } };
  },
  /* 沉没成本:空荡影院、灰暗银幕,侧门的金光;看见时出口越来越亮 */
  sunk({ THREE, scene, q, makePts, C, setC, rnd }) {
    const seatG = new THREE.BoxGeometry(.7, .55, .6), seatM = new THREE.MeshStandardMaterial({ color: 0x3a2236, roughness: .8 });
    const rows = 6, cols = 11; const seats = new THREE.InstancedMesh(seatG, seatM, rows * cols); const M = new THREE.Matrix4(); let k = 0;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { M.makeTranslation((c - (cols - 1) / 2) * .9, -2 + r * .32, 2 - r * 1.1); seats.setMatrixAt(k++, M); }
    scene.add(seats);
    const screenM = new THREE.MeshBasicMaterial({ color: 0x8a8fa0 }); const scr = new THREE.Mesh(new THREE.PlaneGeometry(9, 4.2), screenM); scr.position.set(0, 1.6, -6); scene.add(scr);
    const doorM = new THREE.MeshBasicMaterial({ color: 0xf5c26b }); const door = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 2.4), doorM); door.position.set(6.2, -.8, -1.5); door.rotation.y = -Math.PI / 2.4; scene.add(door);
    const beamM = new THREE.MeshBasicMaterial({ color: 0xf5c26b, transparent: true, opacity: .1, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    const beam = new THREE.Mesh(new THREE.ConeGeometry(2.6, 8, 24, 1, true), beamM); beam.position.set(3.4, -1.2, -.6); beam.rotation.z = Math.PI / 2.1; beam.rotation.y = .5; scene.add(beam);
    const dust = makePts(Math.round(500 * q), (i, p, c, s) => { p.set([rnd(-5, 7), rnd(-2, 3), rnd(-5, 3)], i * 3); setC(c, i, C(0xe9c779), rnd(.2, .6)); s[i] = rnd(.5, 1.4); });
    scene.add(dust); const L = new THREE.PointLight(0xf5c26b, 20, 14); L.position.set(5.6, -.5, -1.2); scene.add(L);
    return { rig: { r: 9.5, y: 1.4, look: [0, .2, -2], a: -0.15, flip: -0.4 },
      update(t, dt, s) { const v = .35 + .1 * Math.sin(t * 7) * Math.sin(t * 2.3); screenM.color.setScalar(v * (1 - Math.min(1, s) * .35));
        const g = .55 + Math.min(1, s) * .45; doorM.color.setRGB(.96 * g, .76 * g, .42 * g); beamM.opacity = .06 + Math.min(1, s) * .12; L.intensity = 12 + 28 * Math.min(1, s);
        dust.rotation.y = t * .02; } };
  },
  /* 信息茧房:信息粒子被一层层回声壳裹紧 */
  cocoon({ THREE, scene, q, makePts, C, setC, rnd }) {
    const N = Math.round(3600 * q), dir = new Float32Array(N * 3), rad = new Float32Array(N), sp = new Float32Array(N);
    const pts = makePts(N, (i, p, c, s) => { const th = rnd(0, Math.PI * 2), ph = Math.acos(rnd(-1, 1)); dir.set([Math.sin(ph) * Math.cos(th), Math.cos(ph) * 1.25, Math.sin(ph) * Math.sin(th)], i * 3); rad[i] = rnd(2.5, 5.8); sp[i] = rnd(.2, 1);
      setC(c, i, C(Math.random() < .5 ? 0xe9d39a : 0x9fd0ff), rnd(.5, 1)); s[i] = rnd(1.6, 3.4); });
    scene.add(pts); const core = makePts(1, (i, p, c, s) => { setC(c, 0, C(0xfff3d6)); s[0] = 40; }); scene.add(core);
    return { rig: { r: 12, y: 1, look: [0, 0, 0], a: 0 },
      update(t, dt, s) { const tight = Math.min(1, s); const pa = pts.geometry.attributes.position.array;
        for (let i = 0; i < N; i++) { const shell = 2.2 + (Math.floor(rad[i]) - 2) * 0.45; const r = rad[i] * (1 - tight) + shell * tight; const w = t * sp[i] * .25;
          const x = dir[i * 3], y = dir[i * 3 + 1], z = dir[i * 3 + 2]; pa[i * 3] = (x * Math.cos(w) - z * Math.sin(w)) * r; pa[i * 3 + 1] = y * r; pa[i * 3 + 2] = (x * Math.sin(w) + z * Math.cos(w)) * r; }
        pts.geometry.attributes.position.needsUpdate = true; } };
  },
  /* 幸存者偏差:一千个创业者落下,只有少数留在台上;看见时,沉没的那一大片显形 */
  survivor({ THREE, scene, q, makePts, C, setC, rnd }) {
    const N = Math.round(1000 * Math.max(.6, q)); const base = new Float32Array(N * 3), surv = new Uint8Array(N), ph = new Float32Array(N);
    const pts = makePts(N, (i, p, c, s) => { base.set([rnd(-5, 5), 0, rnd(-3, 3)], i * 3); surv[i] = Math.random() < .03 ? 1 : 0; ph[i] = Math.random(); setC(c, i, C(surv[i] ? 0xfff3d6 : 0xe9d39a), surv[i] ? 1 : .6); s[i] = surv[i] ? 6 : 2.6; });
    scene.add(pts);
    const pedG = new THREE.CylinderGeometry(.25, .3, .15, 16), pedM = new THREE.MeshStandardMaterial({ color: 0xf5c26b, metalness: .8, roughness: .3, emissive: 0x2a1a06 });
    for (let i = 0; i < N; i++) if (surv[i]) { const m = new THREE.Mesh(pedG, pedM); m.position.set(base[i * 3], 2.32, base[i * 3 + 2]); scene.add(m); }
    const col = pts.geometry.attributes.color.array; const gc = C(0xe9d39a);
    return { rig: { r: 12, y: 2.2, look: [0, .3, 0], a: 0.2 },
      update(t, dt, s) { const pa = pts.geometry.attributes.position.array, see = Math.min(1, s);
        for (let i = 0; i < N; i++) { if (surv[i]) { pa[i * 3] = base[i * 3]; pa[i * 3 + 1] = 2.55 + Math.sin(t + i) * .05; pa[i * 3 + 2] = base[i * 3 + 2]; continue; }
          const f = (ph[i] + t * .06) % 1; pa[i * 3] = base[i * 3]; pa[i * 3 + 1] = 2.5 - f * f * 7; pa[i * 3 + 2] = base[i * 3 + 2];
          setC(col, i, gc, (f < .85 ? .25 + (1 - f) * .75 : .12) + see * .4 * (f > .6 ? 1 : 0)); }
        pts.geometry.attributes.position.needsUpdate = true; pts.geometry.attributes.color.needsUpdate = true; } };
  },
  /* 人性与处境:两座小镇,头顶各有一圈「规则」光环 */
  nature({ THREE, scene, q, makePts, C, setC, rnd }) {
    const bG = new THREE.BoxGeometry(.5, 1, .5); const towns = [];
    [[-4, 0xf5c26b, 0x3a2508], [4, 0x9fb7ff, 0x0e1838]].forEach(([x, col, em]) => {
      const m = new THREE.MeshStandardMaterial({ color: col, emissive: em, metalness: .3, roughness: .6 }); const n = 26; const im = new THREE.InstancedMesh(bG, m, n); const M = new THREE.Matrix4();
      for (let i = 0; i < n; i++) { const h = rnd(.4, 2); M.compose(new THREE.Vector3(x + rnd(-1.8, 1.8), -2 + h / 2, rnd(-1.8, 1.8)), new THREE.Quaternion(), new THREE.Vector3(1, h, 1)); im.setMatrixAt(i, M); }
      scene.add(im); const disc = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.2, .3, 40), new THREE.MeshStandardMaterial({ color: 0x1a1830, roughness: .9 })); disc.position.set(x, -2.15, 0); scene.add(disc);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(2.2, .03, 8, 80), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0, blending: THREE.AdditiveBlending })); ring.rotation.x = Math.PI / 2; ring.position.set(x, 1.6, 0); scene.add(ring); towns.push(ring);
    });
    const fl = makePts(Math.round(600 * q), (i, p, c, s) => { p.set([rnd(-7, 7), rnd(-1.5, 3), rnd(-3, 3)], i * 3); setC(c, i, C(0xf0a860), rnd(.2, .7)); s[i] = rnd(.6, 1.6); }); scene.add(fl);
    return { rig: { r: 12, y: 2.5, look: [0, -.4, 0], a: 0 },
      update(t, dt, s) { towns.forEach((r, i) => { r.material.opacity = Math.min(1, s) * (.6 + .3 * Math.sin(t * 2 + i)); r.rotation.z = t * (i ? -.3 : .3); }); fl.rotation.y = t * .03; } };
  },
  /* 睡眠负债:沙漏漏光、月亮、远处城市;精力越欠画面越暗 */
  sleep({ THREE, scene, q, makePts, C, setC, rnd }) {
    const N = Math.round(1800 * q), ph = new Float32Array(N), ang = new Float32Array(N), rr = new Float32Array(N);
    const sand = makePts(N, (i, p, c, s) => { ph[i] = Math.random(); ang[i] = rnd(0, Math.PI * 2); rr[i] = Math.sqrt(Math.random()); setC(c, i, C(0xf5c26b), rnd(.5, 1)); s[i] = rnd(.8, 1.8); });
    sand.position.set(-4, 0, 0); scene.add(sand);
    const glass = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 4.6, 32, 1, true), new THREE.MeshBasicMaterial({ color: 0x9fb7ff, transparent: true, opacity: .05, side: THREE.DoubleSide, depthWrite: false })); glass.position.copy(sand.position); scene.add(glass);
    const capM = new THREE.MeshStandardMaterial({ color: 0xc9a25a, metalness: .8, roughness: .35 });
    [2.4, -2.4].forEach(y => { const cap = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, .18, 32), capM); cap.position.set(-4, y, 0); scene.add(cap); });
    const moon = new THREE.Mesh(new THREE.SphereGeometry(.7, 32, 16), new THREE.MeshBasicMaterial({ color: 0xfff1cf })); moon.position.set(6, 3.6, -9); scene.add(moon);
    const frM = new THREE.MeshStandardMaterial({ color: 0x2a2850, roughness: .7 });
    [[0, 1.6, 3.2, .12], [0, -1.6, 3.2, .12], [-1.6, 0, .12, 3.2], [1.6, 0, .12, 3.2], [0, 0, .06, 3.2], [0, 0, 3.2, .06]].forEach(([x, y, w, h]) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, .12), frM); b.position.set(4 + x, .6 + y, -1); scene.add(b); });
    const city = makePts(Math.round(900 * q), (i, p, c, s) => { p.set([rnd(-20, 20), rnd(-6, -4.5), rnd(-30, -10)], i * 3); setC(c, i, C(Math.random() < .7 ? 0xffc977 : 0xb9c4ff), rnd(.3, 1)); s[i] = rnd(.6, 1.6); }); scene.add(city);
    const fire = makePts(Math.round(160 * q), (i, p, c, s) => { p.set([rnd(-8, 8), rnd(-2, 4), rnd(-4, 3)], i * 3); setC(c, i, C(0xffe3a6), rnd(.3, .9)); s[i] = rnd(1.5, 3); }); scene.add(fire);
    scene.fog.color.set(0x0b0a22); scene.background.set(0x0b0a22);
    return { rig: { r: 11, y: .8, look: [0, .2, 0], a: 0 },
      update(t, dt, s) { const pa = sand.geometry.attributes.position.array, rate = .08 + Math.min(1, s) * .12;
        for (let i = 0; i < N; i++) { const f = (ph[i] + t * rate) % 1; const r = rr[i];
          if (f < .45) { const lvl = f / .45; const hgt = .2 + 2 * (1 - lvl) * r; pa[i * 3] = Math.cos(ang[i]) * r * 1.2 * (hgt / 2.2); pa[i * 3 + 1] = hgt; pa[i * 3 + 2] = Math.sin(ang[i]) * r * 1.2 * (hgt / 2.2); }
          else if (f < .55) { pa[i * 3] = rnd(-.03, .03); pa[i * 3 + 1] = .2 - (f - .45) * 22; pa[i * 3 + 2] = rnd(-.03, .03); }
          else { const lvl = (f - .55) / .45; const hgt = -2.2 + 2 * lvl * (1 - r); pa[i * 3] = Math.cos(ang[i]) * r * 1.3; pa[i * 3 + 1] = Math.min(hgt, -0.2 - r); pa[i * 3 + 2] = Math.sin(ang[i]) * r * 1.3; } }
        sand.geometry.attributes.position.needsUpdate = true;
        const dim = 1 - Math.min(1, s) * .35 + Math.max(0, s - 2.5) * .3; city.material.uniforms.uA.value = dim; fire.material.uniforms.uA.value = dim * (.6 + .4 * Math.sin(t)); fire.rotation.y = t * .02; } };
  },
  /* 情绪浪:金色浪面,看见时浪头最高,写下规则后平静 */
  wave({ THREE, scene, q, makePts, C, setC }) {
    const W = Math.round(110 * Math.sqrt(q)), N = W * W; const gx = new Float32Array(N), gz = new Float32Array(N);
    const pts = makePts(N, (i, p, c, s) => { const x = (i % W) / (W - 1) * 18 - 9, z = Math.floor(i / W) / (W - 1) * 18 - 9; gx[i] = x; gz[i] = z; s[i] = 1.4; });
    scene.add(pts); const col = pts.geometry.attributes.color.array; const lo = C(0x2a4a8a), hi = C(0xf5c26b);
    scene.fog.color.set(0x081428); scene.background.set(0x081428);
    return { rig: { r: 11, y: 4.2, look: [0, -.5, 0], a: 0.3 },
      update(t, dt, s) { const A = .35 + Math.min(1, s) * .9 - Math.max(0, s - 2) * .9; const pa = pts.geometry.attributes.position.array;
        for (let i = 0; i < N; i++) { const x = gx[i], z = gz[i];
          const y = (Math.sin(x * .55 + t * 1.1) * .6 + Math.sin(z * .7 - t * .8) * .4 + Math.sin((x + z) * .9 + t * 1.7) * .25) * A - 1.5;
          pa[i * 3] = x; pa[i * 3 + 1] = y; pa[i * 3 + 2] = z; const k = Math.max(0, Math.min(1, (y + 1.5) / (A * 1.2 + .01) * .5 + .5));
          col[i * 3] = lo.r + (hi.r - lo.r) * k; col[i * 3 + 1] = lo.g + (hi.g - lo.g) * k; col[i * 3 + 2] = lo.b + (hi.b - lo.b) * k; }
        pts.geometry.attributes.position.needsUpdate = true; pts.geometry.attributes.color.needsUpdate = true; } };
  },
  /* 回声:两个人各自发出声波圈;看见时,传过去的波形被「扭曲」 */
  echo({ THREE, scene, q, makePts, C, setC, rnd }) {
    const rings = []; const mk = (x, col) => { for (let i = 0; i < 7; i++) { const m = new THREE.Mesh(new THREE.TorusGeometry(1, .025, 6, 96), new THREE.MeshBasicMaterial({ color: col, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
      m.rotation.x = Math.PI / 2; m.position.set(x, -1, 0); m.userData = { x, ph: i / 7, col }; scene.add(m); rings.push(m); } };
    mk(-3.4, 0xf7b98a); mk(3.4, 0x9fb7ff);
    [[-3.4, 0xf7b98a], [3.4, 0x9fb7ff]].forEach(([x, c]) => { const o = new THREE.Mesh(new THREE.SphereGeometry(.35, 24, 12), new THREE.MeshBasicMaterial({ color: c })); o.position.set(x, -1, 0); scene.add(o); });
    const dust = makePts(Math.round(700 * q), (i, p, c, s) => { p.set([rnd(-8, 8), rnd(-1.2, 3), rnd(-5, 5)], i * 3); setC(c, i, C(0xf7b98a), rnd(.15, .5)); s[i] = rnd(.6, 1.4); }); scene.add(dust);
    return { rig: { r: 11, y: 4, look: [0, -1, 0], a: 0 },
      update(t, dt, s) { const warpK = Math.min(1, s) * (1 - Math.max(0, s - 2));
        rings.forEach(r => { const f = (r.userData.ph + t * .12) % 1; const R = .5 + f * 6.5; r.scale.set(R * (1 + warpK * .25 * Math.sin(t * 3 + R)), R * (1 - warpK * .2 * Math.cos(t * 2 + R)), 1); r.material.opacity = (1 - f) * .8; }); dust.rotation.y = t * .02; } };
  },
  /* 意义终章:金莲八瓣,随步骤慢慢开 */
  meaning({ THREE, scene, q, makePts, C, setC, rnd }) {
    const N = Math.round(4000 * q), pp = new Float32Array(N), pv = new Float32Array(N), pk = new Uint8Array(N);
    const pts = makePts(N, (i, p, c, s) => { pk[i] = i % 8; pp[i] = Math.random(); pv[i] = rnd(-1, 1); setC(c, i, C(Math.random() < .25 ? 0xfff3d6 : 0xf5c26b), rnd(.5, 1)); s[i] = rnd(1.5, 3); });
    scene.add(pts); const core = makePts(1, (i, p, c, s) => { p.set([0, -.6, 0], 0); setC(c, 0, C(0xfff3d6)); s[0] = 60; }); scene.add(core);
    const up = makePts(Math.round(400 * q), (i, p, c, s) => { p.set([rnd(-6, 6), rnd(-3, 6), rnd(-6, 6)], i * 3); setC(c, i, C(0xffe3a6), rnd(.2, .7)); s[i] = rnd(.8, 1.8); }); scene.add(up);
    return { rig: { r: 10, y: 4.5, look: [0, -.3, 0], a: 0 },
      update(t, dt, s) { const open = .35 + Math.min(3, s) / 3 * .65; const pa = pts.geometry.attributes.position.array;
        for (let i = 0; i < N; i++) { const a0 = pk[i] / 8 * Math.PI * 2 + t * .03, u = pp[i], v = pv[i];
          const len = 3.4 * u, wdt = Math.sin(u * Math.PI) * .9 * v; const tilt = (1 - open) * 1.3 + .15;
          const lx = len * Math.cos(tilt), ly = len * Math.sin(tilt) - .6; pa[i * 3] = Math.cos(a0) * lx - Math.sin(a0) * wdt; pa[i * 3 + 1] = ly + Math.sin(u * Math.PI) * .2; pa[i * 3 + 2] = Math.sin(a0) * lx + Math.cos(a0) * wdt; }
        pts.geometry.attributes.position.needsUpdate = true; const ua = up.geometry.attributes.position.array; for (let i = 1; i < ua.length; i += 3) { ua[i] += dt * .4; if (ua[i] > 6) ua[i] = -3; } up.geometry.attributes.position.needsUpdate = true; } };
  }
};
