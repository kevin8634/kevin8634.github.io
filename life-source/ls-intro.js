// 王磊 10-23:恢复 v0.4 开场「编译生命」(粒子双螺旋→生命之树+门屏配乐+生命显微镜头),源自 743e543
// 生命源码 · 开场「编译生命」(WebGL / Three.js 粒子)
// 一镜到底四幕:原始海洋的分子 → 聚成 DNA 双螺旋 → 双螺旋长成生命之树 → 穿过星海进入图谱。
// 约 4200 个粒子,每个粒子带三组目标位置,在顶点着色器里插值;可拖动、可点击激起涟漪。
import * as THREE from './vendor/three.module.min.js';
import { sound, reducedMotion, store } from './ls.js';

const CON_COLORS = ['#34d399', '#5eead4', '#e2be78', '#7dd3fc', '#67e8f9', '#f9a8d4', '#fbbf24', '#c4b5fd'];
const BASE_COL = { A: '#4ade80', T: '#f5b041', G: '#60a5fa', C: '#f87171' };
const HBB = 'ATGGTGCACCTGACTCCTGAGGAGAAGTCTGCCGTTACTGCCCTGTGGGGCAAGGTGAACGTG';
const CAPTIONS = [
  [0.3, '数十亿年前 · 原始海洋里漂着无数分子'],
  [2.8, '有一种分子学会了复制自己 · DNA 双螺旋(示意)'],
  [7.0, '复制、出错、筛选……长成一棵生命之树'],
  [9.8, '几乎所有生物,都在用同一套遗传密码'],
];
const HOLD = 10.6;               // 停在生命之树,等待进入
const css = `
#lsi{position:fixed;inset:0;z-index:50;background:radial-gradient(ellipse at 50% 60%,#0b1f1a 0%,#060a12 60%,#03060b 100%);transition:opacity 1.1s;overflow:hidden;touch-action:none}
#lsi canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
#lsi .cap{position:absolute;left:0;right:0;top:12%;text-align:center;color:#9fd8c4;font-size:clamp(13px,2.2vw,16px);letter-spacing:1px;opacity:0;transition:opacity .8s;padding:0 16px;text-shadow:0 1px 6px #000}
#lsi .cap code{display:block;font:12px/1.6 ui-monospace,Menlo,Consolas,monospace;color:#34d39988;letter-spacing:2px;margin-bottom:6px;white-space:nowrap;overflow:hidden}
#lsi .ttl{position:absolute;left:0;right:0;bottom:15%;text-align:center;pointer-events:none}
#lsi h1{margin:0;font-size:clamp(38px,9vw,72px);letter-spacing:.18em;color:#eefcf6;font-weight:800;text-shadow:0 0 24px #34d39966,0 0 2px #fff}
#lsi h1 span{display:inline-block;min-width:1em}
#lsi .en{color:#e2be78;letter-spacing:.5em;font-size:13px;margin-top:6px;opacity:0;transition:opacity 1s}
#lsi .sub{color:#b9c7c1;margin-top:10px;font-size:15px;opacity:0;transition:opacity 1s .3s}
#lsi .go{position:absolute;left:0;right:0;bottom:5%;display:flex;gap:12px;justify-content:center;flex-wrap:wrap;opacity:0;transform:translateY(12px);transition:all .8s;pointer-events:none;padding:0 12px}
#lsi .go.on{opacity:1;transform:none;pointer-events:auto}
#lsi .go button,#lsi .gate button{font:inherit;font-size:15px;border-radius:999px;padding:11px 22px;cursor:pointer;border:1px solid #34d39999;background:rgba(6,20,16,.6);color:#eefcf6;backdrop-filter:blur(6px)}
#lsi .go button.p,#lsi .gate button.p{background:linear-gradient(135deg,#10b981,#34d399);color:#03130d;border:0;font-weight:700;box-shadow:0 0 24px #34d39977}
#lsi .go button:hover{transform:translateY(-1px)}
#lsi .badge{position:absolute;right:16px;top:14px;color:#e2be78;font-size:13px;letter-spacing:1px}
#lsi .badge b{display:inline-block;background:#34d399;color:#04120c;border-radius:6px;padding:1px 8px;margin-left:6px}
#lsi .skip{position:absolute;left:16px;top:12px;background:none;border:0;color:#94a3a8;font:inherit;font-size:13px;cursor:pointer;padding:6px}
@media (max-width:640px){#lsi .ttl{bottom:21%}#lsi .go{bottom:3.5%}#lsi .go button{width:min(320px,90vw)}}
#lsi .gate{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;text-align:center;transition:opacity .9s;padding:0 16px}
#lsi .gate .ear{font-size:46px;filter:drop-shadow(0 0 18px #34d399);animation:lsiP 2.4s ease-in-out infinite}
@keyframes lsiP{50%{transform:scale(1.12);filter:drop-shadow(0 0 30px #34d399)}}
#lsi .gate h2{margin:0;font-size:clamp(26px,6vw,40px);letter-spacing:.25em;color:#eefcf6;text-shadow:0 0 20px #34d39988}
#lsi .gate p{margin:0;color:#9fb8ae;font-size:14px}
#lsi .gate .row{display:flex;gap:12px;flex-wrap:wrap;justify-content:center;margin-top:8px}
#lsi .ttl{transition:top 1.2s cubic-bezier(.2,.8,.2,1),bottom 1.2s,transform 1.2s}
#lsi .ttl.up{bottom:auto;top:7%}
#lsi .ttl.up .sub{display:none}
#lsi .ttl.up h1{font-size:clamp(30px,6.5vw,52px)}
#lsi .lens{position:absolute;left:50%;bottom:calc(5% + 80px);width:clamp(150px,22vh,200px);aspect-ratio:1;transform:translateX(-50%) scale(.6);opacity:0;transition:all 1s cubic-bezier(.2,.8,.2,1);cursor:pointer;pointer-events:none}
#lsi .lens.on{opacity:1;transform:translateX(-50%) scale(1);pointer-events:auto}
#lsi .lens .lz{position:absolute;inset:9%;border-radius:50%;overflow:hidden;background:#020806;box-shadow:inset 0 0 30px #000,0 0 40px #34d39955}
#lsi .lens .lz canvas{width:100%!important;height:100%!important}
#lsi .lens svg{position:absolute;inset:0;width:100%;height:100%;animation:lsiR 18s linear infinite;pointer-events:none}
#lsi .lens .glass{position:absolute;inset:9%;border-radius:50%;background:radial-gradient(circle at 30% 25%,#ffffff33,transparent 35%);pointer-events:none}
@keyframes lsiR{to{transform:rotate(360deg)}}
#lsi .lens .lab{position:absolute;left:50%;top:100%;transform:translateX(-50%);white-space:nowrap;text-align:center;margin-top:4px;font-size:12px;color:#9fd8c4;text-shadow:0 1px 4px #000}
#lsi .lens .lab b{color:#e2be78;font-weight:600}
#lsi .lens .side{position:absolute;top:50%;transform:translateY(-50%);font:11px ui-monospace,Menlo,monospace;color:#34d399aa;white-space:nowrap}
#lsi .lens .side.l{right:104%;text-align:right}#lsi .lens .side.r{left:104%}
#lsi .lens:hover .lz{box-shadow:inset 0 0 30px #000,0 0 60px #34d399aa}
@media (max-width:640px){#lsi .lens{bottom:calc(3.5% + 70px);width:clamp(120px,19vh,160px)}#lsi .lens .side{display:none}#lsi .ttl.up{top:8%}}
#lsi .hint{position:absolute;left:0;right:0;bottom:1.6%;text-align:center;color:#94a3a855;font-size:11px}
`;

export function playIntro({ onDone, onDive, replay = false } = {}) {
  const st = document.createElement('style'); st.textContent = css; document.head.append(st);
  const box = document.createElement('div'); box.id = 'lsi';
  box.innerHTML = `<canvas></canvas><div class="badge">创世计划 · 04/07<b>生物</b></div><button class="skip">跳过 ›</button>
    <div class="cap"><code></code><span></span></div>
    <div class="ttl"><h1>${'生命源码'.split('').map(() => '<span></span>').join('')}</h1><div class="en">LIFE SOURCE</div><div class="sub">读懂生命写好的代码</div></div>
    <div class="lens"><div class="lz"></div><div class="glass"></div><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="none" stroke="#34d39966" stroke-width=".6"/><circle cx="50" cy="50" r="45.5" fill="none" stroke="#34d399" stroke-width="1.4" stroke-dasharray=".6 2.2"/><circle cx="50" cy="50" r="45.5" fill="none" stroke="#e2be78" stroke-width="2.2" stroke-dasharray="14 57.5"/></svg><div class="side l">放大 ×<span class="mag">1</span></div><div class="side r">比例尺 <span class="bar">1 mm</span></div><div class="lab"><b>一镜到底</b> · <span class="obj">指尖皮肤 · 指纹</span></div></div><div class="go"></div><div class="gate"><div class="ear">🎧</div><h2>生命源码</h2><p>建议戴上耳机,听听生命的声音</p><div class="row"></div></div><div class="hint">拖动可以转动 · 点一下激起涟漪</div>`;
  document.body.append(box);
  const seen = store.get('intro', false); let speed = seen ? 1.7 : 1, gated = true, cue = null, musicOn = false;
  fetch(new URL('./audio/intro.m4a', import.meta.url)).catch(() => {}); // 预取开场曲
  const $ = s => box.querySelector(s);
  let done = false, warpAt = 0;
  const finish = () => { if (done) return; done = true; store.set('intro', true); box.style.opacity = 0; if (cue) cue.fade(1.2); if (sound.on) sound.startMusic(); setTimeout(() => { box.remove(); st.remove(); renderer && renderer.dispose(); zm && zm.dispose(); zm = null; }, 1100); onDone && onDone(); };
  $('.skip').onclick = () => (sound.whoosh(.8, false), finish());
  const onKey = e => { if (e.key === 'Escape') { removeEventListener('keydown', onKey); finish(); } }; addEventListener('keydown', onKey);

  /* ---- 按钮:声音默认关,只有学习者自己点了才开 ---- */
  const go = $('.go');
  const enter = withSound => {
    if (withSound && !sound.on) { sound.on = true; dispatchEvent(new Event('ls-sound')); }
    sound.sparkle(6); sound.whoosh(1.4);
    warpAt = clock; go.classList.remove('on'); lens.classList.remove('on'); $('.ttl').style.opacity = 0; $('.cap').style.opacity = 0;
    setTimeout(finish, reducedMotion() ? 200 : 1300);
  };
  const b1 = document.createElement('button'); b1.className = 'p'; b1.textContent = '进入生命图谱 ›'; b1.onclick = () => enter(false);
  go.append(b1);
  /* ---- 门屏:声音默认关,由学习者自己选 ---- */
  const gate = $('.gate'), row = $('.gate .row');
  const begin = async withSound => {
    if (!gated) return; row.querySelectorAll('button').forEach(b => b.disabled = true);
    if (withSound) { sound.enableQuiet(); speed = 1; cue = await sound.cue('./audio/intro.m4a', .95, clock); }
    gated = false; gate.style.opacity = 0; gate.style.pointerEvents = 'none'; setTimeout(() => gate.remove(), 900);
  };
  const g1 = document.createElement('button'); g1.className = 'p'; g1.textContent = '🎧 带着声音进入'; g1.onclick = () => begin(true);
  const g2 = document.createElement('button'); g2.textContent = '静音进入'; g2.onclick = () => begin(false);
  row.append(g1, g2);
  // 王磊 10-21:每次进入都播放;第一次出声音门屏,之后静音自动播放(可点跳过)
  if (replay) { gate.style.display = 'none'; begin(false); }
  /* ---- 镜头模块:循环播放一镜到底,点击展开全屏 ---- */
  const lens = $('.lens'); let zm = null;
  const MAG = ['1', '50', '500', '10⁵', '10⁶', '5×10⁶'];
  lens.onclick = () => { if (done) return; sound.whoosh(1, true); onDive && setTimeout(onDive, 600); enter(false); };
  const showLens = async () => {
    lens.classList.add('on');
    try {
      const { createZoom } = await import('./ls-zoom.js');
      zm = createZoom(lens.querySelector('.lz'), { onLevel(i, L) { lens.querySelector('.obj').textContent = L.obj.split(/[::]/)[0]; lens.querySelector('.bar').textContent = L.bar; lens.querySelector('.mag').textContent = MAG[i] || ''; } });
      (async function loop() { while (zm && box.isConnected) { await zm.dive({ from: 0, per: 1.8, dwell: 700 }); await new Promise(r => setTimeout(r, 1200)); } })();
    } catch {}
  };

  /* ---- 标题「解码」:随机碱基字母逐个落定成汉字 ---- */
  const spans = [...box.querySelectorAll('h1 span')], word = '生命源码';
  let decodeStart = 0;
  const decode = c => {
    if (!decodeStart) decodeStart = c;
    const k = (c - decodeStart) * 3.2;
    spans.forEach((s, i) => { s.textContent = k > i + 1 ? word[i] : k > i - 1.5 ? 'ATGC'[Math.floor(Math.random() * 4)] : ''; s.style.color = k > i + 1 ? '' : '#34d399'; });
    if (k > 5) { $('.en').style.opacity = 1; $('.sub').style.opacity = 1; }
  };

  /* ---- WebGL ---- */
  const cv = $('canvas');
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: false, alpha: true, powerPreference: 'high-performance' }); }
  catch { renderer = null; }
  let clock = 0;
  if (!renderer) { decode(1); decodeStart = -10; decode(10); go.classList.add('on'); return { finish }; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(50, 1, .1, 400);
  const group = new THREE.Group(); scene.add(group);

  let seed = 7; const rnd = () => (seed = seed * 16807 % 2147483647) / 2147483647;
  const gauss = () => (rnd() + rnd() + rnd() - 1.5) / 1.5;
  const P0 = [], P1 = [], P2 = [], C0 = [], C1 = [], C2 = [], DL = [], SZ = [], KD = [];
  const col = h => new THREE.Color(h);
  // 双螺旋:y ∈ [-6, 4.5],半径 1.15,右手螺旋,两条骨架相差约 150°
  const Y0 = -6, Y1 = 4.5, R = 1.15, TURN = 3.4, OFF = 150 * Math.PI / 180;
  const helixAt = (y, s) => { const a = (y - Y0) / TURN * 2 * Math.PI + s * OFF; return [Math.cos(a) * R, y, Math.sin(a) * R]; };
  // 生命之树(三维分枝):树干就是双螺旋下半段
  const TRUNK_TOP = -0.5, segs = [], leaves = [];
  (function grow(p, dir, len, depth) {
    const q = [p[0] + dir[0] * len, p[1] + dir[1] * len, p[2] + dir[2] * len];
    segs.push({ a: p, b: q, depth });
    if (depth === 6) { leaves.push({ p: q, c: CON_COLORS[leaves.length % 8] }); return; }
    const n = depth < 2 ? 3 : 2, az0 = rnd() * 6.28;
    for (let i = 0; i < n; i++) {
      const az = az0 + i * 6.28 / n + rnd() * .5, tilt = .55 + rnd() * .35;
      const d = [dir[0] * Math.cos(tilt) + Math.cos(az) * Math.sin(tilt), dir[1] * Math.cos(tilt) + .12, dir[2] * Math.cos(tilt) + Math.sin(az) * Math.sin(tilt)];
      const m = Math.hypot(...d); grow(q, d.map(v => v / m), len * (.76 + rnd() * .1), depth + 1);
    }
  })([0, TRUNK_TOP, 0], [0, 1, 0], 2.6, 0);
  const totalLen = segs.reduce((s, g) => s + Math.hypot(g.b[0] - g.a[0], g.b[1] - g.a[1], g.b[2] - g.a[2]) * (1.4 - g.depth * .12), 0);
  const pickSeg = () => { let r = rnd() * totalLen; for (const g of segs) { r -= Math.hypot(g.b[0] - g.a[0], g.b[1] - g.a[1], g.b[2] - g.a[2]) * (1.4 - g.depth * .12); if (r <= 0) return g; } return segs[segs.length - 1]; };

  const push = (p1, c1, size, kind) => {
    // 原始海洋:扁平的旋涡云
    const r = 3 + rnd() * 9, a = rnd() * 6.28; P0.push(Math.cos(a) * r, gauss() * 2.5, Math.sin(a) * r);
    C0.push(...col(rnd() < .15 ? BASE_COL['ATGC'[Math.floor(rnd() * 4)]] : '#2dd4bf').toArray());
    P1.push(...p1); C1.push(...c1.toArray());
    let p2, c2, dd;
    if (p1[1] <= TRUNK_TOP) { p2 = [p1[0] * .8, p1[1], p1[2] * .8]; c2 = c1.clone().lerp(col('#6ee7b7'), .4); dd = 0; }
    else if (rnd() < .3) { const L = leaves[Math.floor(rnd() * leaves.length)]; p2 = L.p.map(v => v + gauss() * .45); c2 = col(L.c); dd = 2.2 + rnd() * .4; size *= 1.5; kind = 2; }
    else { const g = pickSeg(), t = rnd(); p2 = g.a.map((v, i) => v + (g.b[i] - v) * t + gauss() * .06 * (7 - g.depth) * .5); c2 = col('#6ee7b7').lerp(col('#a7f3d0'), g.depth / 6); dd = g.depth * .32 + t * .3; }
    P2.push(...p2); C2.push(...c2.toArray()); DL.push(rnd(), dd); SZ.push(size); KD.push(kind);
  };
  // 骨架
  for (let s = 0; s < 2; s++) for (let i = 0; i < 1300; i++) { const y = Y0 + (Y1 - Y0) * (i / 1300); push(helixAt(y, s).map(v => v + gauss() * .05), col(s ? '#6ee7b7' : '#10b981'), 1.1, 0); }
  // 碱基对横档:颜色来自 HBB 序列
  const RISE = .34;
  for (let k = 0; Y0 + k * RISE < Y1; k++) {
    const y = Y0 + k * RISE, b = HBB[k % HBB.length], pair = { A: 'T', T: 'A', G: 'C', C: 'G' }[b];
    const a = helixAt(y, 0), c = helixAt(y, 1);
    for (let j = 0; j < 22; j++) { const t = j / 21; push([a[0] + (c[0] - a[0]) * t, y, a[2] + (c[2] - a[2]) * t], col(BASE_COL[t < .5 ? b : pair]), .9, 1); }
  }
  const N = SZ.length, geo = new THREE.BufferGeometry();
  const A = (arr, n) => new THREE.Float32BufferAttribute(arr, n);
  geo.setAttribute('position', A(P0, 3)); geo.setAttribute('p1', A(P1, 3)); geo.setAttribute('p2', A(P2, 3));
  geo.setAttribute('c0', A(C0, 3)); geo.setAttribute('c1', A(C1, 3)); geo.setAttribute('c2', A(C2, 3));
  geo.setAttribute('dl', A(DL, 2)); geo.setAttribute('sz', A(SZ, 1)); geo.setAttribute('kd', A(KD, 1));
  const U = { uT: { value: 0 }, uPR: { value: renderer.getPixelRatio() }, uWarp: { value: 0 }, uRip: { value: new THREE.Vector4(0, 0, 0, -9) } };
  const mat = new THREE.ShaderMaterial({
    uniforms: U, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `
      attribute vec3 p1; attribute vec3 p2; attribute vec3 c0; attribute vec3 c1; attribute vec3 c2; attribute vec2 dl; attribute float sz; attribute float kd;
      uniform float uT; uniform float uPR; uniform float uWarp; uniform vec4 uRip; varying vec3 vC; varying float vA;
      void main(){
        float a = uT * .18 + dl.x * 6.28;
        vec3 soup = vec3(position.x * cos(uT*.12) - position.z * sin(uT*.12), position.y + sin(uT*.8 + dl.x*20.)*.25, position.x * sin(uT*.12) + position.z * cos(uT*.12));
        float k1 = smoothstep(2.6 + dl.x*1.3, 2.6 + dl.x*1.3 + 1.6, uT);
        float k2 = smoothstep(7.0 + dl.y, 7.0 + dl.y + 1.3, uT);
        vec3 p = mix(mix(soup, p1, k1), p2, k2);
        vec3 c = mix(mix(c0, c1, k1), c2, k2);
        // 一道亮光沿双螺旋向上扫过("读取"序列)
        float sweep = exp(-pow((p1.y - mix(-7., 6., fract((uT-4.6)/2.6))) * 1.6, 2.)) * k1 * (1. - k2) * step(4.6, uT);
        // 点击涟漪
        float rd = length(p - uRip.xyz), rt = uT - uRip.w;
        float rip = exp(-pow(rd - rt*6., 2.)) * exp(-rt*1.5) * step(0., rt);
        p += normalize(p - uRip.xyz + 1e-4) * rip * .6;
        // 进入:向外飞散成星海
        p *= 1. + uWarp * uWarp * (6. + dl.x * 18.);
        vec4 mv = modelViewMatrix * vec4(p, 1.);
        float bloom = kd > 1.5 ? smoothstep(9.2, 10.4, uT) * (1. + .35*sin(uT*3. + dl.x*30.)) : 1.;
        gl_PointSize = sz * uPR * (1. + sweep*1.8 + rip*2.) * bloom * (210. / -mv.z) * (1. + uWarp*2.);
        gl_Position = projectionMatrix * mv;
        vC = c * (1. + sweep*1.5 + rip); vA = (.55 + .45*k1) * (1. - uWarp*.9) * smoothstep(0., 1.2, uT);
      }`,
    fragmentShader: `varying vec3 vC; varying float vA;
      void main(){ float d = length(gl_PointCoord - .5); float a = smoothstep(.5, 0., d); gl_FragColor = vec4(vC * (a*a*1.4), a * vA); }`,
  });
  group.add(new THREE.Points(geo, mat));
  // 远处星尘
  const sg = new THREE.BufferGeometry(), sp = [];
  for (let i = 0; i < 900; i++) { const r = 40 + rnd() * 80, t = rnd() * 6.28, f = Math.acos(2 * rnd() - 1); sp.push(r * Math.sin(f) * Math.cos(t), r * Math.cos(f), r * Math.sin(f) * Math.sin(t)); }
  sg.setAttribute('position', A(sp, 3));
  const stars = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0x9fe8d0, size: 1.4, sizeAttenuation: false, transparent: true, opacity: .55, blending: THREE.AdditiveBlending, depthWrite: false }));
  scene.add(stars);

  /* ---- 交互:拖动转动、点击涟漪、指针视差 ---- */
  let drag = null, spin = 0, spinV = 0, px = 0, py = 0;
  box.addEventListener('pointerdown', e => { if (e.target.closest('button')) return; drag = { x: e.clientX, m: 0 }; });
  addEventListener('pointermove', e => {
    px = e.clientX / innerWidth - .5; py = e.clientY / innerHeight - .5;
    if (drag) { const dx = e.clientX - drag.x; drag.x = e.clientX; drag.m += Math.abs(dx); spinV = dx * .006; spin += spinV; }
  });
  addEventListener('pointerup', e => {
    if (drag && drag.m < 6 && !done) { // 视为点击:在点击处投射到 z=0 平面激起涟漪
      const v = new THREE.Vector3(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1, .5).unproject(cam).sub(cam.position).normalize();
      const p = cam.position.clone().add(v.multiplyScalar(-cam.position.z / v.z)); group.worldToLocal(p);
      U.uRip.value.set(p.x, p.y, p.z, U.uT.value); sound.tone(587.33 * (1 + Math.random() * .5), .6, { gain: .08 });
    }
    drag = null;
  });
  const resize = () => { renderer.setSize(innerWidth, innerHeight, false); cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix(); };
  addEventListener('resize', resize); resize();

  /* ---- 时间线 ---- */
  const capCode = $('.cap code'), capTxt = $('.cap span'); let capIdx = -1;
  let last = performance.now(), shown = false, holdAt = 0, runAt = 0, runFrom = 0;
  const ease = x => x < .5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2;
  function frame(now) {
    if (!box.isConnected) return;
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    if (reducedMotion() && clock < HOLD) clock = HOLD;
    if (warpAt) clock += dt; else if (gated) clock = Math.min(1.6, clock + dt); else { if (!runAt) { runAt = now; runFrom = clock; } clock = Math.min(HOLD, runFrom + (now - runAt) / 1000 * speed); }
    if (!gated && sound.on && !musicOn && (now - holdAt > 2500 && holdAt)) { musicOn = true; sound.startMusic(); }
    const t = warpAt ? HOLD : clock;
    U.uT.value = warpAt ? HOLD + (clock - warpAt) : clock;
    U.uWarp.value = warpAt ? Math.min(1, (clock - warpAt) / 1.2) : 0;
    // 镜头:从近处的分子云拉远,环绕双螺旋,最后仰望整棵树
    const k = ease(Math.min(1, t / HOLD));
    const dist = 22 - 6 * Math.sin(Math.min(1, t / 6) * Math.PI) + (t > 7 ? Math.min(1, (t - 7) / 3) * (innerWidth < innerHeight ? 15 : 10) : 0);
    const camY = -1 + (t > 7 ? Math.min(1, (t - 7) / 3) * 1.5 : 0);
    const orbit = reducedMotion() ? .6 : t * .22 + spin;
    spinV *= .95; if (!drag) spin += spinV;
    cam.position.set(Math.sin(orbit) * dist + px * 2, camY - py * 1.5, Math.cos(orbit) * dist);
    cam.lookAt(0, -1 + (t > 7 ? Math.min(1, (t - 7) / 3) * (innerWidth < innerHeight ? .2 : 2.2) : 0), 0);
    if (warpAt) { const w = U.uWarp.value; cam.position.multiplyScalar(1 - w * .7); }
    stars.rotation.y = now * .00002;
    renderer.render(scene, cam);
    // 字幕
    let ci = -1; CAPTIONS.forEach(([s], i) => { if (U.uT.value >= s) ci = i; });
    if (ci !== capIdx && !warpAt && !shown) {
      capIdx = ci; const cap = $('.cap'); cap.style.opacity = 0;
      setTimeout(() => { capTxt.textContent = CAPTIONS[ci][1]; cap.style.opacity = 1; }, 350);
    }
    if (!warpAt) capCode.textContent = '> ' + HBB.slice(0, Math.floor(clock * 6) % HBB.length + 6);
    if (t >= 9.6 && !warpAt) decode(now / 1000);
    if (t >= HOLD && !shown) { shown = true; holdAt = now; go.classList.add('on'); $('.ttl').classList.add('up'); $('.cap').style.opacity = 0; setTimeout(showLens, 500); }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  return { finish };
}
