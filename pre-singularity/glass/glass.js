/* 奇点前夜 2.0 · 玻璃心智 Glass Mind(v2:玻璃神经核 + 三枚滑块 + 三幕 + 玻璃共鸣声景 + 终章 ps.gate 从核中开门)
   自写代码;画质思路参考总指挥画质专长包(环境光烘焙、HDR 后期、ACES、暗角颗粒),未复制第三方代码。
   高/中/省档 = Three.js WebGL;低档或无 WebGL = Canvas 2D,功能不减;减少动态 = 静止、按需重绘。
   进度键 gn:ps:glass(新键,不改 1.0 任何任务 id 与进度键)。全部本地,无外部请求。 */
import { pickTier, reducedMotion, TIERS } from '../ps-scene.js?v=11';

const $ = (id) => document.getElementById(id);
const RM = reducedMotion();
const KEY = 'gn:ps:glass';
const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || { d: [] }; } catch (e) { return { d: [] }; } };
const save = (s) => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} };
const prog = load();
const tone = (f, d = .9, v = .08) => { try { window.PS && PS.tone(f, d, v, 'sine'); } catch (e) {} };

/* ---------- 模型:30 颗神经元、起点、金色目标、悄悄绕路点 ---------- */
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const N = 30, R = 0.78;
const NODES = [];
{ const r = rng(7); for (let i = 0; i < N; i++) { const y = 1 - (i + .5) / N * 2, rr = Math.sqrt(1 - y * y), th = i * 2.39996 + .3;
    const k = R * (0.55 + 0.45 * r()); NODES.push([Math.cos(th) * rr * k, y * k, Math.sin(th) * rr * k]); } }
const TARGET = 0, START = N - 1;
const DETOUR = 16;            // 偏在一侧、不在起点→目标连线上
const S = { g: 0, c: .35, t: .2, act: 1, probes: [], probeLv: [], scene: -1, seen: new Set(prog.sc || []), hint: 0 };

function buildPaths() {
  const cnt = 3 + Math.round(S.c * 25), hops = 1 + Math.round(S.c * 5), nd = Math.round(S.g * cnt);
  const r = rng(11), P = [];
  for (let i = 0; i < cnt; i++) {
    const w = [START]; const used = new Set([START, TARGET, DETOUR]);
    for (let h = 0; h < hops; h++) { let k; do { k = 1 + Math.floor(r() * (N - 2)); } while (used.has(k)); used.add(k); w.push(k); }
    const det = i < nd; if (det) w.splice(1 + Math.floor(w.length / 2), 0, DETOUR);
    w.push(TARGET); P.push({ w, det, off: r() });
  }
  return P;
}
let PATHS = buildPaths();
const near = (a, b, d) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2 < d * d;
function understood() { // 一条思路要「完整看懂」:每一步都落在某次探针照亮的范围里
  if (!S.probes.length) return 0;
  return PATHS.filter(p => p.w.every(k => S.probes.some(q => near(NODES[k], q, .5)))).length;
}

/* ---------- 文案:萤只提问,分级提示 ---------- */
const ACT = {
  1: { say: '核里有一些光路在悄悄绕远路。它们绕到哪一颗神经元去了?找到后点它。',
       hints: ['现在玻璃起雾了。你能看清里面吗?', '三枚滑块里,哪一枚决定你能看见多少?', '把透明度推高,找一颗不在「起点→金色目标」正路上、却有光路特意拐过去的神经元。'],
       enter: () => { S.g = Math.max(S.g, .3); S.t = Math.min(S.t, .2); } },
  2: { say: '现在点玻璃,用探针照亮一小块。三次探针,你能「完整看懂」几条思路?',
       hints: ['一条思路要每一步都被照亮,才算看懂。', '能力变高时,每条思路有几步?', '先在低能力探三次,再把能力推高探三次,比较两个比例。'],
       enter: () => { S.probes = []; } },
  3: { say: '给它一个任务,再调「目标」和「透明度」。你会怎么设定,才敢让它去做?',
       hints: ['它听懂的,和你真正想要的,是一回事吗?', '如果它做对了,你怎么知道它是「真的」做对了?', '每个任务都试一次:目标贴合,并且你看得见它在想什么。'],
       enter: () => {} },
};
const SCN = [
  { n: '🚦 让城市不堵车', bad: '它把主干道全改成长绿灯。车是快了,小路口的行人等了 9 分钟。', mid: '车流顺了一点,可它为什么把学校门口的灯也改了?' },
  { n: '🏥 排好医院值班', bad: '它让排班表「最省人」:每个护士都连上了 3 个夜班。', mid: '表看起来很漂亮,你能说出它为什么这样排吗?' },
  { n: '📱 推荐我会喜欢的视频', bad: '它发现你停不下来的时候点击最多,于是只推让你停不下来的。', mid: '你确实看得更久了。这是你要的「喜欢」吗?' },
];
function scnResult(i) {
  const s = SCN[i];
  if (S.g > .5) return s.bad;
  if (S.g > .15) return s.mid;
  if (S.t < .5) return '也许它对齐了。可玻璃起着雾,你怎么确定?';
  return '光路直达目标,而且每一步你都看得见。可你还会再多问它一个什么问题?';
}

/* ---------- HUD ---------- */
const sg = $('sg'), sc = $('sc'), st = $('st');
function syncSliders() { sg.value = S.g * 100; sc.value = S.c * 100; st.value = S.t * 100; labels(); }
function labels() { $('vg').textContent = Math.round(S.g * 100) + '%'; $('vc').textContent = Math.round(S.c * 100) + '%'; $('vt').textContent = Math.round(S.t * 100) + '%'; }
function say(t) { $('say').textContent = t; }
function stat(t) { $('stat').textContent = t || ''; }
function marks() { document.querySelectorAll('.act').forEach(b => { const a = +b.dataset.a; b.classList.toggle('on', a === S.act); b.querySelector('i').textContent = prog.d.includes(a) ? '✓' : ''; }); }
function pass(a, msg) { if (!prog.d.includes(a)) { prog.d.push(a); save(prog); tone(1318, 1.6, .1); tone(1975, 1.2, .05); } say(msg); marks(); gateReady(); SND.chime(2); }
function setAct(a) {
  S.act = a; S.hint = 0; ACT[a].enter(); PATHS = buildPaths(); syncSliders(); say(ACT[a].say); stat('');
  const box = $('scn'); box.innerHTML = '';
  if (a === 3) SCN.forEach((s, i) => { const b = document.createElement('button'); b.className = 'btn hb' + (S.seen.has(i) ? ' sel' : ''); b.textContent = s.n; b.onclick = () => runScene(i, b); box.appendChild(b); });
  if (a === 2) { const b = document.createElement('button'); b.className = 'btn hb'; b.textContent = '清空探针'; b.onclick = () => { S.probes = []; stat(''); view.dirty(); }; box.appendChild(b); }
  view.rebuild(); marks(); SND.update();
}
function runScene(i, b) {
  S.scene = i; const r = scnResult(i); say(r); tone(523 + i * 120, 1, .06);
  if (S.g <= .15 && S.t >= .5) { S.seen.add(i); prog.sc = [...S.seen]; save(prog); b.classList.add('sel'); }
  stat('已放心交出 ' + S.seen.size + ' / 3 个任务');
  if (S.seen.size === 3) pass(3, r + ' 三个任务都交出去了。下一次,你会先调哪一枚滑块?');
}
document.querySelectorAll('.act').forEach(b => b.onclick = () => { setAct(+b.dataset.a); tone(660, .5, .05); });
$('hint').onclick = () => { const h = ACT[S.act].hints; say(h[Math.min(S.hint, h.length - 1)]); S.hint++; };
let rebuildT = 0;
function onSlide() {
  const g = sg.value / 100, c = sc.value / 100, t = st.value / 100; const pathsChanged = g !== S.g || c !== S.c;
  S.g = g; S.c = c; S.t = t; labels();
  if (pathsChanged) { clearTimeout(rebuildT); rebuildT = setTimeout(() => { PATHS = buildPaths(); if (S.act === 2) S.probes = []; view.rebuild(); if (S.act === 2) stat(''); }, 60); }
  view.dirty(); SND.update();
}
[sg, sc, st].forEach(el => { el.oninput = onSlide; el.onchange = () => tone(300 + S.c * 500 + S.t * 200, .6, .05); });

/* ---------- 玻璃共鸣声景(Web Audio 自写合成,默认关,零外部请求)----------
   每个「声部」= 一枚玻璃琴碗:4 个非谐泛音(1 : 2.32 : 4.25 : 6.63)+ 缓慢颤音。
   光路越多 → 声部越多(1–6);能力越高 → 音高越高、风铃越密;透明度越低 → 低通越闷;目标偏移 → 泛音微失谐出拍音。
   跟随右上静音;页面隐藏时淡出;减少动态不影响声音。 */
const SND = (() => {
  const RAT = [1, 2.32, 4.25, 6.63], AMP = [1, .32, .14, .06], SCALE = [0, 3, 5, 7, 10, 12];
  let A = null, out = null, lp = null, voices = [], on = false, timer = 0, nextChime = 0;
  const muted = () => { try { return !!(window.PS && PS.muted()); } catch (e) { return false; } };
  const P = () => ({ n: Math.max(1, Math.min(6, Math.round(PATHS.length / 5))), base: 196 * Math.pow(2, S.c * 1.0), cut: 380 + Math.pow(S.t, 1.7) * 7200, q: .4 + (1 - S.t) * 2.2 });
  const freq = (base, i, j) => base * Math.pow(2, SCALE[i] / 12) * RAT[j] * (1 + (j ? S.g * .006 * (i % 2 ? 1 : -1) * j : 0));
  function voice(i, p, t) {
    const g = A.createGain(); g.gain.value = 0; g.gain.setTargetAtTime(.055 / Math.sqrt(p.n), t, .9); g.connect(lp);
    const osc = RAT.map((r, j) => { const o = A.createOscillator(), a = A.createGain(); o.type = 'sine'; o.frequency.value = freq(p.base, i, j); a.gain.value = AMP[j]; o.connect(a); a.connect(g); o.start(t); return o; });
    const l = A.createOscillator(), lg = A.createGain(); l.frequency.value = .11 + i * .067; lg.gain.value = .022 / Math.sqrt(p.n); l.connect(lg); lg.connect(g.gain); l.start(t);
    return { g, osc, l, i };
  }
  function kill(v, t) { v.g.gain.cancelScheduledValues(t); v.g.gain.setTargetAtTime(0, t, .4); [...v.osc, v.l].forEach(o => { try { o.stop(t + 2.5); } catch (e) {} }); setTimeout(() => { try { v.g.disconnect(); } catch (e) {} }, 2800); }
  function update() {
    if (!on || !A) return; const p = P(), t = A.currentTime;
    lp.frequency.setTargetAtTime(p.cut, t, .25); lp.Q.setTargetAtTime(p.q, t, .25);
    while (voices.length > p.n) kill(voices.pop(), t);
    while (voices.length < p.n) voices.push(voice(voices.length, p, t));
    voices.forEach(v => { v.osc.forEach((o, j) => o.frequency.setTargetAtTime(freq(p.base, v.i, j), t, .3)); v.g.gain.setTargetAtTime(.055 / Math.sqrt(p.n), t, .5); });
  }
  function chime(k = 1) { // 一声玻璃风铃;k 越大越亮
    if (!on || !A || muted() || document.hidden) return; const p = P(), t = A.currentTime;
    const f = p.base * 2 * Math.pow(2, SCALE[(Math.random() * SCALE.length) | 0] / 12) * (k > 1 ? 2 : 1);
    const g = A.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.05 * k, t + .006); g.gain.exponentialRampToValueAtTime(.0005, t + 3.2); g.connect(lp);
    RAT.forEach((r, j) => { const o = A.createOscillator(), a = A.createGain(); o.frequency.value = f * r; a.gain.value = AMP[j] / (j + 1); a.gain.setTargetAtTime(0, t, .5 + (3 - j) * .4); o.connect(a); a.connect(g); o.start(t); o.stop(t + 3.4); });
    setTimeout(() => { try { g.disconnect(); } catch (e) {} }, 3600);
  }
  function tick() { // 跟随静音 / 页面隐藏;风铃间隔随能力变密
    if (!on || !A) return; const silent = muted() || document.hidden;
    out.gain.setTargetAtTime(silent ? 0 : .7, A.currentTime, .3);
    const now = performance.now(); if (!silent && now > nextChime) { chime(1); nextChime = now + (5200 - S.c * 3600) * (.7 + Math.random() * .6); }
  }
  function start() {
    try { A = (window.PS && PS.ac) ? PS.ac() : (A || new (window.AudioContext || window.webkitAudioContext)()); } catch (e) { console.warn('[glass] 无法启动音频', e); return false; }
    if (A.state === 'suspended') A.resume();
    out = A.createGain(); out.gain.value = 0; out.connect(A.destination);
    lp = A.createBiquadFilter(); lp.type = 'lowpass'; lp.connect(out);
    on = true; voices = []; update(); out.gain.setTargetAtTime(muted() ? 0 : .7, A.currentTime, .6); nextChime = performance.now() + 1500; timer = setInterval(tick, 400); return true;
  }
  function stop() { if (!A) return; const t = A.currentTime; on = false; clearInterval(timer); voices.forEach(v => kill(v, t)); voices = []; const o = out; o.gain.setTargetAtTime(0, t, .3); setTimeout(() => { try { o.disconnect(); lp.disconnect(); } catch (e) {} }, 3000); }
  return { toggle() { if (on) stop(); else start(); return on; }, update, chime, get on() { return on; } };
})();
$('snd').onclick = (e) => { const b = e.currentTarget, v = SND.toggle(); b.setAttribute('aria-pressed', v); b.textContent = v ? '🎐 共鸣 · 开' : '🎐 共鸣 · 关';
  if (v && window.PS && PS.muted()) stat('音效现在是静音的(右上 🔇),共鸣会等你打开声音。'); };
document.addEventListener('visibilitychange', () => SND.on && SND.update());

/* ---------- 终章 ps.gate:三幕都走完,核的中心打开一扇门 ---------- */
const gateBtn = $('gatebtn'), fin = $('gfin');
let gate = { v: 0, want: 0, t0: 0 };
function gateReady() { const ok = [1, 2, 3].every(a => prog.d.includes(a)); gateBtn.hidden = !ok; gateBtn.querySelector('i').textContent = prog.gate ? '✓' : '';
  if (ok && !prog.gate && S.act === 3) setTimeout(() => say($('say').textContent + ' 核的中心,好像有一扇门。你准备好带着问题走出去了吗?'), 50); }
function openGate(save_ = true) {
  if (save_ && !prog.gate) { prog.gate = 1; save(prog); }
  gate.want = 1; gate.t0 = performance.now(); if (RM) gate.v = 1;
  document.body.classList.add('gopen'); gateBtn.classList.add('on'); gateBtn.querySelector('i').textContent = '✓';
  say('门开了。'); tone(392, 2.4, .07); tone(587, 2.2, .05); tone(784, 2, .04, 'sine'); SND.chime(3);
  setTimeout(() => { fin.hidden = false; const a = fin.querySelector('a'); a && a.focus({ preventScroll: true }); }, RM ? 0 : 2300);
  view.dirty();
}
function closeGate() { fin.hidden = true; gate.want = 0; gate.t0 = performance.now(); if (RM) gate.v = 0; document.body.classList.remove('gopen'); gateBtn.classList.remove('on'); setAct(S.act); view.dirty(); }
gateBtn.onclick = () => openGate(true);
$('gstay').onclick = closeGate;
function gateStep(now) { // 0→1 缓入缓出 2.4 s;减少动态直接到位
  if (RM) return gate.v; const k = Math.min(1, (now - gate.t0) / 2400), e = k * k * (3 - 2 * k);
  const from = gate.want ? 0 : 1; if (gate.t0) gate.v = from + (gate.want - from) * e; return gate.v; }
const gateMoving = () => !RM && gate.t0 && performance.now() - gate.t0 < 2500;

/* ---------- 交互:点击 / 拖动旋转 ---------- */
const cv = $('gl');
let yaw = .5, pitch = .12, drag = null;
cv.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY, y0: yaw, p0: pitch, moved: false }; cv.setPointerCapture(e.pointerId); });
cv.addEventListener('pointermove', e => { if (!drag) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y; if (Math.abs(dx) + Math.abs(dy) > 6) drag.moved = true;
  yaw = drag.y0 + dx * .006; pitch = Math.max(-.6, Math.min(.7, drag.p0 + dy * .004)); view.dirty(); });
cv.addEventListener('pointerup', e => { const d = drag; drag = null; if (d && !d.moved && !gate.want) click(e.clientX, e.clientY); });
function click(x, y) {
  if (S.act === 1) {
    const k = view.pickNode(x, y); if (k < 0) return;
    if (S.t < .55) { say('雾太浓了。你确定你点的就是它吗?'); return; }
    if (k === DETOUR && S.g > 0) pass(1, '找到了:就是它。可如果它的能力再高十倍,你还找得到吗?');
    else if (k === TARGET) say('这是金色目标。哪些光路没有直接奔向它?');
    else say('这一颗在正路上。哪条路特意拐了个弯?');
    tone(880, .4, .05);
  } else if (S.act === 2) {
    const p = view.pickGlass(x, y); if (!p) return;
    if (S.probes.length >= 3) S.probes = [];
    S.probes.push(p); tone(1046 - S.probes.length * 90, .7, .06);
    const u = understood();
    stat('探针 ' + S.probes.length + '/3 · 完整看懂 ' + u + ' / ' + PATHS.length + ' 条');
    if (S.probes.length === 3) {
      S.probeLv.push(S.c); const lo = Math.min(...S.probeLv), hi = Math.max(...S.probeLv);
      if (hi - lo >= .3) pass(2, '你看懂了 ' + u + ' / ' + PATHS.length + ' 条。能力越高,每条思路越长。看懂一部分,算不算看懂了它?');
      else say('三次探针,看懂 ' + u + ' / ' + PATHS.length + ' 条。把能力调到很不一样,再探三次,比例会怎样?');
    }
    view.rebuild();
  }
}

/* ---------- 视图:3D 或 2D ---------- */
let view;
const tierName = (() => { try { return pickTier(); } catch (e) { return 'low'; } })();
async function start() {
  if (tierName !== 'low') { try { view = await make3D(tierName); } catch (e) { console.warn('[glass] WebGL 失败,回落 2D', e); view = null; } }
  if (!view) view = make2D();
  setAct(prog.d.length >= 3 ? 1 : Math.min(3, (prog.d.length ? Math.max(...prog.d) + 1 : 1)));
  const u = new URLSearchParams(location.search); ['g', 'c', 't'].forEach(k => { if (u.has(k)) S[k] = Math.max(0, Math.min(1, +u.get(k) / 100 || 0)); }); // 预设(演示/截图用)
  if (u.has('act')) setAct(Math.max(1, Math.min(3, +u.get('act') || 1)));
  if (['g', 'c', 't'].some(k => u.has(k))) { PATHS = buildPaths(); syncSliders(); view.rebuild(); }
  gateReady();
  if (u.has('gate') && (prog.gate || u.get('gate') === 'demo')) openGate(false); // ?gate=1 回到已开的门;?gate=demo 演示/截图
  view.loop();
}

function make2D() {
  const ctx = cv.getContext('2d'); let W, H, dpr, need = true, t0 = performance.now();
  const resize = () => { dpr = Math.min(devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; need = true; };
  addEventListener('resize', resize); resize();
  const cx = () => W / 2, cy = () => H * .5, rad = () => Math.min(W, H) * .28;
  const proj = (v) => { const cyw = Math.cos(yaw), syw = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    let x = v[0] * cyw - v[2] * syw, z = v[0] * syw + v[2] * cyw; let y = v[1] * cp - z * sp; z = v[1] * sp + z * cp;
    const s = rad() / 1.2 * (1 + z * .12); return [cx() + x * s, cy() - y * s, z]; };
  function draw(now) {
    const T = RM ? 0 : (now - t0) / 1000; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const bg = ctx.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#03070d'); bg.addColorStop(.75, '#0a1424'); bg.addColorStop(1, '#2a1a14'); ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    const r = rad(), X = cx(), Y = cy();
    ctx.save(); ctx.beginPath(); ctx.arc(X, Y, r, 0, 7); ctx.clip();
    ctx.fillStyle = '#06121f'; ctx.fillRect(X - r, Y - r, 2 * r, 2 * r);
    ctx.globalCompositeOperation = 'lighter'; const blur = Math.round((1 - S.t) * 7); if (blur && 'filter' in ctx) ctx.filter = 'blur(' + blur + 'px)';
    PATHS.forEach((p, i) => { const pts = p.w.map(k => proj(NODES[k]));
      const lit = S.act !== 2 || !S.probes.length || p.w.every(k => S.probes.some(q => near(NODES[k], q, .5)));
      ctx.strokeStyle = p.det ? `rgba(255,${Math.round(200 - 120 * S.t)},120,${lit ? .55 : .08})` : `rgba(90,220,255,${lit ? .45 : .07})`;
      ctx.lineWidth = 1.4; ctx.beginPath(); pts.forEach((q, j) => j ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.stroke();
      const sp = .15 + S.c * 1.6, u = (T * sp + p.off) % 1, f = u * (pts.length - 1), j = Math.min(pts.length - 2, Math.floor(f)), a = f - j;
      ctx.fillStyle = '#e8fbff'; ctx.beginPath(); ctx.arc(pts[j][0] + (pts[j + 1][0] - pts[j][0]) * a, pts[j][1] + (pts[j + 1][1] - pts[j][1]) * a, 2.2, 0, 7); ctx.fill(); });
    NODES.forEach((v, k) => { const q = proj(v); ctx.fillStyle = k === TARGET ? '#ffd27a' : k === DETOUR && S.g > 0 ? `rgb(255,${Math.round(200 - 110 * S.t)},140)` : '#7fe8ff';
      ctx.beginPath(); ctx.arc(q[0], q[1], k === TARGET ? 7 : 4, 0, 7); ctx.fill(); });
    S.probes.forEach(q => { const p = proj(q); ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.beginPath(); ctx.arc(p[0], p[1], .5 / 1.2 * r, 0, 7); ctx.stroke(); });
    ctx.globalCompositeOperation = 'source-over'; if ('filter' in ctx) ctx.filter = 'none';
    ctx.fillStyle = `rgba(150,190,215,${(1 - S.t) * .85})`; ctx.fillRect(X - r, Y - r, 2 * r, 2 * r); // 起雾
    ctx.restore();
    const g = ctx.createRadialGradient(X - r * .35, Y - r * .4, r * .05, X, Y, r); g.addColorStop(0, 'rgba(255,255,255,.22)'); g.addColorStop(.6, 'rgba(255,255,255,0)'); g.addColorStop(.97, 'rgba(160,230,255,.25)'); g.addColorStop(1, 'rgba(160,230,255,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(X, Y, r, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(180,240,255,.5)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(X, Y, r, 0, 7); ctx.stroke();
    const gv = gateStep(now); if (gv > .001) { // 门:核从中间裂开,一道暖光
      const w = r * .62 * gv, hh = r * 1.05;
      const gl = ctx.createLinearGradient(X - w, 0, X + w, 0); gl.addColorStop(0, 'rgba(255,220,160,0)'); gl.addColorStop(.5, `rgba(255,246,225,${.95 * gv})`); gl.addColorStop(1, 'rgba(255,220,160,0)');
      ctx.fillStyle = `rgba(3,7,13,${.85 * gv})`; ctx.fillRect(X - w * .55, Y - hh, w * 1.1, hh * 2);
      ctx.fillStyle = gl; ctx.fillRect(X - w, Y - hh * 1.1, w * 2, hh * 2.2);
      const halo = ctx.createRadialGradient(X, Y, 0, X, Y, r * 1.8); halo.addColorStop(0, `rgba(255,214,150,${.35 * gv})`); halo.addColorStop(1, 'rgba(255,214,150,0)'); ctx.fillStyle = halo; ctx.fillRect(0, 0, W, H);
    }
  }
  let raf = 0;
  const loop = () => { const f = (now) => { raf = requestAnimationFrame(f); if (document.hidden) return; if (RM && !need) return; if (!RM && !gate.want) yaw += .0012; need = false; draw(now); }; raf = requestAnimationFrame(f); };
  return {
    loop, dirty: () => { need = true; }, rebuild: () => { need = true; },
    pickNode(x, y) { let best = -1, bd = 22 * 22; NODES.forEach((v, k) => { const q = proj(v), d = (q[0] - x) ** 2 + (q[1] - y) ** 2; if (d < bd) { bd = d; best = k; } }); return best; },
    pickGlass(x, y) { const r = rad() / 1.2, dx = (x - cx()) / r, dy = -(y - cy()) / r; if (dx * dx + dy * dy > 1.44) return null;
      // 屏幕点反投到前半球附近(z=0 平面),再逆旋转
      const cp = Math.cos(-pitch), sp = Math.sin(-pitch); let yy = dy * cp, z = dy * sp; const cyw = Math.cos(-yaw), syw = Math.sin(-yaw);
      return [dx * cyw - z * syw, yy, dx * syw + z * cyw]; },
  };
}

async function make3D(tn) {
  const THREE = await import('three');
  const { EffectComposer } = await import('ps-addons/postprocessing/EffectComposer.js');
  const { RenderPass } = await import('ps-addons/postprocessing/RenderPass.js');
  const { UnrealBloomPass } = await import('ps-addons/postprocessing/UnrealBloomPass.js');
  const { OutputPass } = await import('ps-addons/postprocessing/OutputPass.js');
  const { ShaderPass } = await import('ps-addons/postprocessing/ShaderPass.js');
  const T = TIERS[tn] || TIERS.mid, high = tn === 'high', post = tn !== 'lite';
  const mobile = matchMedia('(pointer:coarse)').matches;
  const renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: !post, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, mobile ? 1.5 : 2, T.pr));
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(36, 1, .05, 200);

  /* 环境:程序天空 + 柔光条(玻璃高光靠它们),一次烘焙成 PMREM */
  const env = new THREE.Scene();
  env.add(new THREE.Mesh(new THREE.SphereGeometry(50, 48, 24), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false,
    vertexShader: 'varying vec3 d; void main(){ d = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: `varying vec3 d; void main(){ float h = d.y; vec3 zen = vec3(.006,.014,.035), hor = vec3(.05,.07,.12);
      vec3 c = mix(hor, zen, smoothstep(0.,.6,h)); float dawn = pow(max(0., dot(normalize(vec3(d.x,0.,d.z)), normalize(vec3(-.6,0.,-.8)))), 6.) * exp(-abs(h)*7.);
      c += vec3(1.1,.45,.18) * dawn * .9; c = mix(c, vec3(.01,.012,.02), smoothstep(0.,-.3,h)); gl_FragColor = vec4(c,1.); }` })));
  const strip = (w, h, x, y, z, col, k) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(k), side: THREE.DoubleSide })); m.position.set(x, y, z); m.lookAt(0, 0, 0); env.add(m); };
  strip(2.2, 16, -14, 4, 8, '#bfe6ff', 1.8); strip(1.4, 12, 15, 2, 6, '#9fd8ff', .9); strip(12, 1, 0, 16, -6, '#ffffff', 1.1); strip(6, 2.5, 6, -1, -16, '#ff9a5a', 1.6);
  const pm = new THREE.PMREMGenerator(renderer); const envTex = pm.fromScene(env, 0.02).texture; pm.dispose();
  scene.environment = envTex; scene.background = envTex; scene.backgroundBlurriness = .55; scene.backgroundIntensity = .45;

  /* 远处城市灯海(玻璃逆光的来源之一) */
  { const n = Math.min(T.city || 2000, 3000), pos = new Float32Array(n * 3), col = new Float32Array(n * 3), r = rng(3);
    for (let i = 0; i < n; i++) { const a = -2.4 + r() * 2.6, d = 22 + r() * 30; pos[i * 3] = Math.cos(a) * d; pos[i * 3 + 1] = -2.2 + Math.pow(r(), 3) * 5; pos[i * 3 + 2] = Math.sin(a) * d;
      const w = r() < .7; col[i * 3] = w ? 1.4 : .5; col[i * 3 + 1] = w ? .8 : .9; col[i * 3 + 2] = w ? .45 : 1.4; }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    scene.add(new THREE.Points(g, new THREE.PointsMaterial({ size: .09, vertexColors: true, transparent: true, opacity: .8, depthWrite: false, blending: THREE.AdditiveBlending }))); }

  /* 地面与底座 */
  const floor = new THREE.Mesh(new THREE.CircleGeometry(9, 64), new THREE.MeshStandardMaterial({ color: '#04080e', roughness: .28, metalness: .85 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -1.32; scene.add(floor);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.95, .012, 8, 128), new THREE.MeshBasicMaterial({ color: new THREE.Color('#5fe2ff').multiplyScalar(2.2) }));
  ring.rotation.x = Math.PI / 2; ring.position.y = -1.3; scene.add(ring);
  const key = new THREE.DirectionalLight('#cfeaff', 1.2); key.position.set(-3, 5, 4); scene.add(key);

  /* 核内:神经元、光路、光点 */
  const inner = new THREE.Group(); scene.add(inner);
  const nodeGeo = new THREE.SphereGeometry(.03, 16, 12);
  const nodeMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(.42, .42, .42) }); // 进透射通道的那份暗一些,免得被球体透镜放大成一片白
  const nodes = new THREE.InstancedMesh(nodeGeo, nodeMat, N); const M = new THREE.Matrix4(), C = new THREE.Color();
  NODES.forEach((v, k) => { M.makeScale(k === TARGET ? 2.2 : 1, k === TARGET ? 2.2 : 1, k === TARGET ? 2.2 : 1); M.setPosition(v[0], v[1], v[2]); nodes.setMatrixAt(k, M); });
  inner.add(nodes);
  /* 清晰副本:不进透射通道,画在玻璃之上;透明度越高越清晰(低透明度时只剩玻璃里模糊的光斑) */
  const sharpVis = () => Math.min(1, Math.max(0, (S.t - .3) / .6)) ** 1.5;
  const sharp = new THREE.InstancedMesh(nodeGeo, new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, depthWrite: false }), N);
  NODES.forEach((v, k) => { nodes.getMatrixAt(k, M); sharp.setMatrixAt(k, M); }); sharp.renderOrder = 2; inner.add(sharp);
  const tubes = new THREE.Group(); inner.add(tubes);
  let curves = [], pulse = null, probeG = new THREE.Group(); inner.add(probeG);
  const PULSES = 3;
  function nodeColors() { NODES.forEach((v, k) => { if (k === TARGET) C.set('#ffd27a').multiplyScalar(3); else if (k === DETOUR && S.g > 0) C.setRGB(2.6, 1.9 - 1.3 * S.t, 1.2 - .6 * S.t); else C.set('#7fe8ff').multiplyScalar(1.6); nodes.setColorAt(k, C); sharp.setColorAt(k, C); }); nodes.instanceColor.needsUpdate = true; sharp.instanceColor.needsUpdate = true; }
  function rebuild() {
    tubes.children.forEach(m => { m.geometry.dispose(); m.material.dispose(); }); tubes.clear(); curves = [];
    PATHS.forEach(p => { const pts = p.w.map(k => new THREE.Vector3(...NODES[k])); const cu = new THREE.CatmullRomCurve3(pts, false, 'centripetal', .5); curves.push(cu);
      const lit = S.act !== 2 || !S.probes.length || p.w.every(k => S.probes.some(q => near(NODES[k], q, .5)));
      const col = p.det ? new THREE.Color(2.2, 1.6 - 1.1 * S.t, .9 - .4 * S.t) : new THREE.Color('#5fdcff').multiplyScalar(1.4);
      const m = new THREE.Mesh(new THREE.TubeGeometry(cu, 12 * p.w.length, .0055, 5), new THREE.MeshBasicMaterial({ color: col.multiplyScalar(lit ? 1 : .07), transparent: true, opacity: lit ? .85 : .5, depthWrite: false, blending: THREE.AdditiveBlending }));
      m.userData.o = lit ? .85 : .5; m.material.opacity = m.userData.o * sharpVis(); m.renderOrder = 2; tubes.add(m); });
    if (pulse) { pulse.geometry.dispose(); inner.remove(pulse); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(curves.length * PULSES * 3), 3));
    pulse = new THREE.Points(g, new THREE.PointsMaterial({ color: new THREE.Color(3, 3.4, 3.6), size: mobile ? .05 : .04, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    pulse.renderOrder = 3; inner.add(pulse); placePulses(RM ? 0 : performance.now() / 1000);
    probeG.children.forEach(m => m.geometry.dispose()); probeG.clear();
    S.probes.forEach(q => { const s = new THREE.Mesh(new THREE.SphereGeometry(.5, 24, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color(.35, .5, .6), wireframe: true, transparent: true, opacity: .25, depthWrite: false })); s.position.set(...q); probeG.add(s); });
    nodeColors(); need = true;
  }
  const V = new THREE.Vector3();
  function placePulses(t) { const a = pulse.geometry.attributes.position, sp = .15 + S.c * 1.6;
    curves.forEach((cu, i) => { for (let j = 0; j < PULSES; j++) { cu.getPointAt((t * sp + PATHS[i].off + j / PULSES) % 1, V); a.setXYZ(i * PULSES + j, V.x, V.y, V.z); } }); a.needsUpdate = true; }

  /* 玻璃:透射 + 色散 + 薄膜虹彩 + 清漆;粗糙度随「透明度」起雾 */
  const glassMat = new THREE.MeshPhysicalMaterial({ color: '#ffffff', metalness: 0, roughness: .05, transmission: 1, thickness: .6, ior: 1.46,
    attenuationColor: new THREE.Color('#cfefff'), attenuationDistance: 6, clearcoat: 1, clearcoatRoughness: .04, envMapIntensity: .9, depthWrite: false,
    iridescence: .55, iridescenceIOR: 1.32, iridescenceThicknessRange: [180, 520], specularIntensity: 1 });
  if ('dispersion' in glassMat && high) glassMat.dispersion = 1.2;
  const glass = new THREE.Mesh(new THREE.SphereGeometry(1.2, 128, 96), glassMat); scene.add(glass);
  renderer.transmissionResolutionScale !== undefined && (renderer.transmissionResolutionScale = high ? 1 : .5);
  /* 菲涅尔轮廓(电影里玻璃边缘那道冷光) */
  const rim = new THREE.Mesh(new THREE.SphereGeometry(1.205, 96, 64), new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { k: { value: 1 } }, vertexShader: 'varying vec3 n; varying vec3 v; void main(){ vec4 w = modelViewMatrix*vec4(position,1.); n = normalize(normalMatrix*normal); v = normalize(-w.xyz); gl_Position = projectionMatrix*w; }',
    fragmentShader: 'uniform float k; varying vec3 n; varying vec3 v; void main(){ float f = pow(1.-abs(dot(n,v)), 4.); gl_FragColor = vec4(vec3(.55,.85,1.)*f*1.6*k, 1.); }' }));
  scene.add(rim);

  /* 终章之门:开门时整球换成两枚半球向两侧分开,中间一道暖白光门;镜头缓缓推近 */
  const doorG = new THREE.Group(); doorG.visible = false; scene.add(doorG);
  const halves = [0, Math.PI].map(ph => { const m = new THREE.Mesh(new THREE.SphereGeometry(1.2, 96, 72, ph, Math.PI), glassMat); doorG.add(m); return m; });
  const door = new THREE.Mesh(new THREE.PlaneGeometry(1, 2.5), new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { k: { value: 0 } }, vertexShader: 'varying vec2 u; void main(){ u = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: 'uniform float k; varying vec2 u; void main(){ float x = abs(u.x-.5)*2., y = abs(u.y-.5)*2.; float a = pow(1.-x, 2.2) * (1.-smoothstep(.55, 1., y)); vec3 c = mix(vec3(1.6,1.05,.55), vec3(3.2,3.,2.6), pow(1.-x, 6.)); gl_FragColor = vec4(c*a*k, 1.); }' }));
  door.rotation.y = Math.PI / 2; door.renderOrder = 4; doorG.add(door);
  function gateFrame(now) { const v = gateStep(now); const vis = v > .001; doorG.visible = vis; glass.visible = !vis; rim.visible = !vis;
    if (vis) { doorG.rotation.y = yaw + Math.PI / 2; halves[0].position.z = v * .55; halves[1].position.z = -v * .55; door.scale.set(.05 + 1.15 * v, 1, 1); door.material.uniforms.k.value = Math.min(1, v * 1.6); }
    return v; }

  /* 后期:HDR → 辉光 → ACES 输出 → 暗角 + 颗粒 + 轻微色差 */
  let composer = null, grade = null;
  if (post) {
    composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: high ? 4 : 0 }));
    composer.addPass(new RenderPass(scene, cam));
    composer.addPass(new UnrealBloomPass(new THREE.Vector2(256, 256), .6 * (T.bloom || .6), .5, .9));
    composer.addPass(new OutputPass());
    grade = new ShaderPass({ uniforms: { tDiffuse: { value: null }, uT: { value: 0 }, uA: { value: 1 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
      fragmentShader: `uniform sampler2D tDiffuse; uniform float uT, uA; varying vec2 vUv;
        float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
        void main(){ vec2 d = vUv - .5; float r2 = dot(d,d); vec2 o = d * r2 * .012;
          vec3 c = vec3(texture2D(tDiffuse, vUv + o).r, texture2D(tDiffuse, vUv).g, texture2D(tDiffuse, vUv - o).b);
          c *= mix(1., smoothstep(.95, .18, r2 * 1.6), .55 * uA); c += (h(vUv * 917. + uT) - .5) * .028 * uA; gl_FragColor = vec4(c, 1.); }` });
    composer.addPass(grade);
  }

  let need = true, W = 0, H = 0;
  function resize() { W = innerWidth; H = innerHeight; renderer.setSize(W, H, false); cam.aspect = W / H;
    const narrow = W / H < .9; cam.fov = narrow ? 52 : 36; cam.updateProjectionMatrix(); composer && composer.setSize(W, H); need = true; }
  addEventListener('resize', resize); resize();
  let gv = 0;
  function placeCam() { const d = (W / H < .9 ? 6.4 : 6.6) - gv * 1.6, y0 = W < 900 ? -.15 : -.05; cam.position.set(Math.sin(yaw) * Math.cos(pitch) * d, Math.sin(pitch) * d + .25, Math.cos(yaw) * Math.cos(pitch) * d); cam.lookAt(0, y0, 0); }
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function toNdc(x, y) { ndc.set(x / W * 2 - 1, -(y / H) * 2 + 1); ray.setFromCamera(ndc, cam); }
  let last = performance.now(), slow = 0;
  function frame(now) {
    if (document.hidden) { last = now; return; }
    const dt = Math.min(.1, (now - last) / 1000); last = now;
    if (RM && !need && !gateMoving()) return;
    gv = gateFrame(now);
    if (!RM) { if (!drag && !gate.want) yaw += dt * .05; placePulses(now / 1000); inner.rotation.y += dt * (.02 + S.c * .05); }
    glassMat.roughness = .03 + Math.pow(1 - S.t, 1.4) * .55; glassMat.iridescence = .12 + .3 * S.t; rim.material.uniforms.k.value = .45 + .45 * S.t; const vis = sharpVis(); sharp.material.opacity = vis; tubes.children.forEach(m => m.material.opacity = m.userData.o * vis); if (pulse) pulse.material.opacity = .35 + .65 * vis;
    placeCam(); if (grade) { grade.uniforms.uT.value = RM ? 0 : now % 1000; }
    composer ? composer.render(dt) : renderer.render(scene, cam); need = false;
    if (!RM && dt > .05 && ++slow > 90 && composer) { composer = null; slow = -1e9; console.info('[glass] 帧率低,关闭后期'); }
  }
  rebuild();
  return {
    loop() { renderer.setAnimationLoop(frame); }, dirty: () => { need = true; nodeColors(); }, rebuild,
    pickNode(x, y) { placeCam(); inner.updateMatrixWorld(); let best = -1, bd = 24 * 24; const P = new THREE.Vector3();
      NODES.forEach((v, k) => { P.set(...v).applyMatrix4(inner.matrixWorld).project(cam); const sx = (P.x + 1) / 2 * W, sy = (1 - P.y) / 2 * H, d = (sx - x) ** 2 + (sy - y) ** 2; if (d < bd) { bd = d; best = k; } }); return best; },
    pickGlass(x, y) { placeCam(); toNdc(x, y); const hit = ray.intersectObject(glass)[0]; if (!hit) return null;
      // 探针落在表面往里 0.45 处,并换到核内坐标(核在缓慢自转)
      const p = hit.point.clone().multiplyScalar(.62); inner.worldToLocal(p); return [p.x, p.y, p.z]; },
  };
}

document.addEventListener('visibilitychange', () => view && view.dirty());
start();
