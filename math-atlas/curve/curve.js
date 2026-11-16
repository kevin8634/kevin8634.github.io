/* 星图 Math Atlas 2.0 · ma.curve「改公理·玻璃曲面」—— 三幕:预测 → 改曲率 → 对照 → 结论 + 星桥
 * 一问:三角形的内角和,一定是 180° 吗?
 * 数学:常曲率 K 的测地三角形满足 α+β+γ = π + K·A(高斯–博内);沿三角形平行移动一圈,向量转过同样的角(和乐)。
 * 读数全部由 curve-geo.js 精确计算(面积独立数值积分,不用定理反推)。 */
import * as G from './curve-geo.js';

const EN = window.MA_LANG === 'en';
const Z = (zh, en) => (EN ? en : zh);
const $ = s => document.querySelector(s);
const TASK = 'curve', KEY = 'ma:v1:' + TASK;
const panel = $('#panel'), stage = $('#stage'), status = $('#status'), kbadge = $('#kbadge');
const store = { get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} } };
const pref = k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };
const RM = pref('ma:motion') === 'reduce' || (pref('ma:motion') !== 'full' && matchMedia('(prefers-reduced-motion: reduce)').matches);
const D = r => (r * 180 / Math.PI);
const fmt = (x, n = 1) => (Math.abs(x) < 0.05 && n === 1 ? '0.0' : x.toFixed(n));
const sgnK = k => (k > 0 ? '+' : k < 0 ? '−' : '') + Math.abs(k).toFixed(2);

/* ---------- 文案 ---------- */
document.title = Z(document.title, 'Must a triangle\'s angles add to 180°? · Rewrite the Axiom · Math Atlas 2.0');
$('#ttl').innerHTML = Z('改公理·玻璃曲面<small>星图 2.0</small>', 'Rewrite the Axiom · Glass Space<small>Math Atlas 2.0</small>');
$('#back').textContent = Z('← 星图', '← Math Atlas');
$('#lang').onclick = () => window.MA_setLang?.(EN ? 'zh' : 'en');
const S0 = Math.acos(1 / Math.sqrt(3));            // K=1 时,中心到顶点 s0 的等边三角形 = 八分之一球面
const tri = (s, rot = 90) => [0, 120, 240].map(d => [s, (d + rot) * Math.PI / 180]);
const ACTS = [
  { short: Z('球面', 'Sphere'), name: Z('幕一 · 玻璃球上的三角形', 'Act 1 · A triangle on a glass sphere'),
    q: Z('一只蚂蚁从北极直走到赤道,左转 90° 沿赤道走四分之一圈,再左转 90° 走回北极。这个三角形三个角加起来是多少?', 'An ant walks from the North Pole straight to the equator, turns 90°, walks a quarter of the way round the equator, then turns 90° and walks back to the pole. What do its three angles add up to?'),
    opts: [['180°', 'a'], ['270°', 'b'], ['360°', 'c']], want: 'b', K0: 1, V0: tri(S0), lockK: true,
    task: Z('量一量三个角,再让玻璃箭头沿三条边「平行移动」走一圈。', 'Measure the three angles, then send the glass arrow once round the triangle by parallel transport.'),
    hints: [Z('在赤道上拐弯时,蚂蚁转了多少度?', 'How far does the ant turn at the equator?'), Z('三个角一样大吗?每个是多少?', 'Are the three angles equal? How big is each?')] },
  { short: Z('改公理', 'Rewrite'), name: Z('幕二 · 拧动曲率旋钮', 'Act 2 · Turn the curvature dial'),
    q: Z('把曲率 K 拧成负数,空间会像马鞍一样处处向外张开。这时三角形的内角和会怎样?', 'Turn the curvature K below zero and space flares out everywhere, like a saddle. What happens to the angle sum?'),
    opts: [[Z('比 180° 大', 'More than 180°'), 'a'], [Z('正好 180°', 'Exactly 180°'), 'b'], [Z('比 180° 小', 'Less than 180°'), 'c']], want: 'c', K0: 1, V0: tri(1.2),
    task: Z('拧旋钮、拖顶点:做出一个内角和小于 90° 的三角形。', 'Turn the dial and drag the corners: make a triangle whose angles add to less than 90°.'),
    hints: [Z('负曲率里,三角形越大,内角和越大还是越小?', 'With negative curvature, does a bigger triangle have a bigger or smaller angle sum?'), Z('把三个顶点往圆盘边缘拖,会怎样?', 'What happens if you drag the corners towards the rim of the disc?')] },
  { short: Z('对照', 'Compare'), name: Z('幕三 · 平直与弯曲,并排看', 'Act 3 · Flat and curved, side by side'),
    q: Z('把三角形缩得非常非常小——在弯曲的空间里,它的内角和会接近多少?', 'Shrink the triangle until it is tiny. In curved space, what does its angle sum approach?'),
    opts: [['180°', 'a'], [Z('不变,还是 270°', 'Stays at 270°'), 'b'], [Z('接近 0°', 'Close to 0°'), 'c']], want: 'a', K0: 0.8, V0: tri(0.9),
    task: Z('打开「平直 vs 弯曲」对照,保持 |K| ≥ 0.5,把三角形缩到内角和与 180° 相差不到 1°。', 'Open the flat-vs-curved comparison, keep |K| ≥ 0.5, and shrink the triangle until its angle sum is within 1° of 180°.'),
    hints: [Z('多出来(或少掉)的角度,跟三角形的什么成正比?看那两根玻璃条。', 'The extra (or missing) angle is proportional to something about the triangle. Watch the two glass bars.'), Z('如果三角形只有蚂蚁那么大,蚂蚁还感觉得到弯曲吗?', 'If the triangle were ant-sized, could the ant still feel the curvature?')] },
];
const CONCL = [
  () => Z(`球面上这个三角形三个角都是直角,内角和 <b>270°</b>。多出来的 90°(π/2)恰好等于 <b>面积 ÷ R²</b>:它是球面的 1/8,面积 4πR²/8。绕一圈的箭头也正好转了 90°——弯曲藏在空间里,不在三角形里。`,
    `On the sphere all three angles are right angles: the sum is <b>270°</b>. The extra 90° (π/2) is exactly <b>area ÷ R²</b> — the triangle is 1/8 of the sphere, area 4πR²/8. The arrow carried round the loop turns by the same 90°: the curvature lives in the space, not in the triangle.`),
  () => Z(`曲率为负,内角和就<b>小于 180°</b>,少掉的部分 = |K| × 面积。双曲平面里三角形再大,面积也超不过 π/|K|,内角和可以接近 0°。欧几里得的平行公理换成「过直线外一点有无数条平行线」,得到的就是这种同样自洽的几何(罗巴切夫斯基、鲍耶,19 世纪)。`,
    `With negative curvature the angle sum is <b>less than 180°</b>; the shortfall is |K| × area. However large a hyperbolic triangle grows, its area never exceeds π/|K|, so its angle sum can approach 0°. Replace Euclid's parallel postulate with "through a point off a line there are infinitely many parallels" and you get this equally consistent geometry (Lobachevsky and Bolyai, 19th century).`),
  () => Z(`三角形越小,内角和越接近 180°:超出(或不足)的量与面积成正比——<b>α+β+γ − 180° = K × 面积</b>(高斯–博内,换算成角度)。所以在一小块地面上量不出地球是圆的;要发现空间弯曲,得量足够大的三角形。`,
    `The smaller the triangle, the closer its angle sum is to 180°: the excess (or shortfall) is proportional to area — <b>α+β+γ − 180° = K × area</b> (Gauss–Bonnet, converted to degrees). That is why a small patch of ground cannot show that the Earth is round; to detect curvature you must measure a large enough triangle.`),
];
const CARD_T = [Z('球面:多出来的角 = 弯曲', 'Sphere: the extra angle is the curvature'), Z('双曲:换一条公理', 'Hyperbolic: a different axiom'), Z('高斯–博内', 'Gauss–Bonnet')];
const BRIDGES = [
  ['07', 'sh.where', Z('天枢 · 此刻,你在宇宙的哪里?', 'Starhelm · Where in the universe are you right now?'), '/starhelm/?task=where'],
  ['02', 'nv.cosmos', Z('宙律 · 如果宇宙的规则换一换?', 'Nomoverse · What if the rules of the universe changed?'), '/nomoverse/cosmos/'],
  ['01', 'atlas', Z('知识星图 · 非欧几何 g24', 'Knowledge map · Non-Euclidean geometry g24'), '../atlas/'],
];

/* ---------- 状态 ---------- */
let act = Math.min(3, Math.max(1, +new URLSearchParams(location.search).get('l') || 1)) - 1;
let phase = 'predict', pred = null, hints = 0, K = 1, V = null, m = null, view = null, cmp = false, did = {}, busy = false;
const saved = () => (store.get(KEY) || { perLevel: {}, stars: 0 });
function saveLevel(n, stars) {
  const s = saved(); s.perLevel[n] = Math.max(s.perLevel[n] || 0, stars); s.stars = Object.values(s.perLevel).reduce((a, b) => a + b, 0); store.set(KEY, s);
  const all = store.get('ma:v1:summary') || {}; all[TASK] = { done: Object.keys(s.perLevel).filter(k => s.perLevel[k] > 0).length, total: 3, stars: s.stars, t: Date.now() }; store.set('ma:v1:summary', all);
}

/* ---------- 声音:三个角各一个音,内角和偏离 180° 越多拍音越明显(默认关) ---------- */
let AC = null, soundOn = false;
$('#snd').onclick = () => { soundOn = !soundOn; $('#snd').setAttribute('aria-pressed', soundOn); $('#snd').textContent = soundOn ? Z('♪ 声音 开', '♪ Sound on') : Z('♪ 声音 关', '♪ Sound off'); if (soundOn) chord(); };
$('#snd').textContent = Z('♪ 声音 关', '♪ Sound off');
function tone(f, t0, dur, g = 0.05) { const o = AC.createOscillator(), a = AC.createGain(); o.type = 'sine'; o.frequency.value = f; a.gain.setValueAtTime(0, t0); a.gain.linearRampToValueAtTime(g, t0 + 0.02); a.gain.exponentialRampToValueAtTime(0.0001, t0 + dur); o.connect(a).connect(AC.destination); o.start(t0); o.stop(t0 + dur + 0.05); }
function chord() {
  if (!soundOn || !m) return; try { AC = AC || new AudioContext(); } catch { return; }
  const t = AC.currentTime + 0.02, base = 261.63;
  m.angles.forEach((a, i) => tone(base * Math.pow(2, a / Math.PI), t + i * 0.16, 0.6));
  // 两个同频音,失谐量 ∝ (内角和 − 180°):平面时纯净,弯曲时「拍」
  const det = (m.sum - Math.PI) / Math.PI * 6; tone(392, t + 0.55, 1.6, 0.04); tone(392 + det, t + 0.55, 1.6, 0.04);
}

/* ---------- 数字滚动(React Bits Count Up 思路改写) ---------- */
function countTo(el, from, to, ms = 900, dec = 1) {
  if (RM || !el) { if (el) el.textContent = to.toFixed(dec); return; }
  const st = performance.now(); const step = now => { const u = Math.min(1, (now - st) / ms), e = 1 - Math.pow(1 - u, 3); el.textContent = (from + (to - from) * e).toFixed(dec); if (u < 1) requestAnimationFrame(step); }; requestAnimationFrame(step);
}

/* ---------- 舞台 ---------- */
async function boot() {
  const gpref = pref('ma:gl') || 'auto';
  let gl = false; try { const c = document.createElement('canvas'); gl = !!(c.getContext('webgl2') || c.getContext('webgl')); } catch {}
  const small = matchMedia('(pointer: coarse)').matches || Math.min(screen.width, screen.height) < 600;
  const tier = gpref === 'hi' || gpref === 'mid' ? gpref : (navigator.hardwareConcurrency || 4) <= 4 || small ? 'mid' : 'hi';
  try {
    if (!gl || gpref === 'lo' || RM) throw 0;
    view = await (await import('./curve-3d.js')).mountStage(stage, { tier, reduced: RM, small });
  } catch (e) { if (e) console.warn('curve: 3D unavailable, using flat view', e); stage.innerHTML = ''; view = await (await import('./curve-2d.js')).mountStage(stage, { reduced: RM }); }
  view.onVerts((i, sp) => { if (busy || phase === 'predict' || phase === 'done') return; V = V.map((v, j) => (j === i ? sp : v)); refresh(); });
  restart();
}
function refresh(opts = {}) {
  const Wm = V.map(([s, th]) => G.fromPolar(K, s, th)); m = G.measure(K, Wm);
  view.set(K, V, { fans: true, ...opts });
  view.lock(phase === 'predict' || phase === 'done' || busy);
  kbadge.innerHTML = Math.abs(K) < 1e-9 ? Z('K = 0 · <b>平面</b>:欧几里得的平行公理成立', 'K = 0 · <b>flat</b>: Euclid\'s parallel postulate holds')
    : K > 0 ? Z(`K = ${sgnK(K)} · <b>球面</b>,半径 R = ${(1 / Math.sqrt(K)).toFixed(2)}`, `K = ${sgnK(K)} · <b>sphere</b>, radius R = ${(1 / Math.sqrt(K)).toFixed(2)}`)
    : Z(`K = ${sgnK(K)} · <b>双曲平面</b>(庞加莱圆盘,紫色边界 = 无穷远)`, `K = ${sgnK(K)} · <b>hyperbolic plane</b> (Poincaré disc; violet rim = infinity)`);
  paintRead(); checkGoal();
}

/* ---------- 面板 ---------- */
function stepsHTML() {
  const S = ['predict', 'play', 'done'], Zs = [Z('预测', 'Predict'), Z('改 · 量', 'Change · measure'), Z('结论', 'Conclusion')], i = S.indexOf(phase);
  return `<div class="steps">${Zs.map((z, k) => `<span class="${k === i ? 'on' : k < i ? 'ok' : ''}">${z}</span>`).join('')}</div>`;
}
function sliderHTML(A) {
  return `<div class="ks${A.lockK ? ' locked' : ''}" id="ks"><div class="ks-row"><span class="ks-val" id="kval">K = ${sgnK(K)}</span>
    <div class="ks-track" id="kt" role="slider" tabindex="${A.lockK ? -1 : 0}" aria-label="${Z('曲率 K', 'Curvature K')}" aria-valuemin="-1" aria-valuemax="1" aria-valuenow="${K.toFixed(2)}" ${A.lockK ? 'aria-disabled="true"' : ''}>
    <div class="ks-rail" id="krail"></div><div class="ks-zero"></div><div class="ks-knob" id="knob"></div></div></div>
    <div class="ks-lab"><span>${Z('K<0 双曲', 'K<0 hyperbolic')}</span><span>${Z('0 平面', '0 flat')}</span><span>${Z('K>0 球面', 'K>0 sphere')}</span></div></div>`;
}
function readHTML() {
  return `<div class="read">${[0, 1, 2].map(i => `<div class="chip" style="border-color:${['#ff8fb1', '#6ff0c8', '#7fb0ff'][i]}66"><i>${['α', 'β', 'γ'][i]}</i><span id="a${i}">—</span>°</div>`).join('')}</div>
    <div class="sum"><span id="sumv">—</span>°<small>${Z('内角和 α + β + γ', 'angle sum α + β + γ')}</small></div>
    <div class="gb"><span>${Z('内角和 − 180°', 'sum − 180°')}</span><div class="bar"><b id="bx"></b></div><span class="v" id="vx"></span>
    <span>${Z('K × 面积', 'K × area')}</span><div class="bar ka"><b id="bk"></b></div><span class="v" id="vk"></span></div>
    <div class="goal" id="area"></div>`;
}
let shown = false;
function paintRead() {
  if (!m || phase === 'predict') return; const show = shown || act > 0;
  [0, 1, 2].forEach(i => { const e = $('#a' + i); if (e) e.textContent = show ? fmt(D(m.angles[i])) : '?'; });
  const sv = $('#sumv'); if (sv && show && !sv.dataset.anim) sv.textContent = fmt(D(m.sum));
  const bar = (b, v, deg) => { const e = $(b), t = $(v); if (!e) return; const w = Math.min(50, Math.abs(deg) / 180 * 50); e.style.left = (deg >= 0 ? 50 : 50 - w) + '%'; e.style.width = w + '%'; t.textContent = (deg >= 0 ? '+' : '−') + Math.abs(deg).toFixed(1) + '°'; };
  if (show) { bar('#bx', '#vx', D(m.sum - Math.PI)); bar('#bk', '#vk', D(m.KA)); }
  const ar = $('#area'); if (ar && show) ar.innerHTML = Z(`面积 A = ${m.area.toFixed(3)}　·　K × A = ${m.KA.toFixed(3)} 弧度 = ${D(m.KA).toFixed(1)}°`, `area A = ${m.area.toFixed(3)} · K × A = ${m.KA.toFixed(3)} rad = ${D(m.KA).toFixed(1)}°`);
}
function render() {
  const A = ACTS[act], L = saved().perLevel;
  let h = `<div class="acts">${ACTS.map((a, i) => `<button type="button" class="${i === act ? 'on' : ''}" data-act="${i}">${a.short}${L[i + 1] ? `<span class="s">${'★'.repeat(L[i + 1])}</span>` : ''}</button>`).join('')}</div>${stepsHTML()}`;
  h += `<p class="q">${A.q}<small>${A.name}</small></p>`;
  if (phase === 'predict') {
    h += `<div class="choices">${A.opts.map(([t, k]) => `<button type="button" class="btn" data-pred="${k}">${t}</button>`).join('')}</div><div class="goal">${Z('先猜一猜,再动手。', 'Guess first, then try it.')}</div>`;
  } else if (phase === 'play') {
    h += `<div class="goal">${A.task}</div>` + sliderHTML(A) + readHTML();
    h += `<div class="go">`;
    if (act === 0) h += `<button type="button" class="btn${did.measure ? '' : ' primary'}" id="meas">📐 ${Z('量一量', 'Measure')}</button><button type="button" class="btn${did.measure && !did.transport ? ' primary' : ''}" id="trans" ${did.measure ? '' : 'disabled'}>➰ ${Z('箭头绕一圈', 'Arrow round the loop')}</button>`;
    else h += `<button type="button" class="btn${cmp ? ' on' : act === 2 ? ' primary' : ''}" id="cmp">⇆ ${Z('平直 vs 弯曲', 'Flat vs curved')}</button><button type="button" class="btn" id="trans">➰ ${Z('箭头绕一圈', 'Arrow round the loop')}</button>`;
    h += `<button type="button" class="btn" id="reset">↺ ${Z('复原', 'Reset')}</button><button type="button" class="btn" id="hint">🔎 ${Z('向导提问', 'Guide\'s question')}</button></div><div id="hintbox"></div><div class="goal" id="goal"></div>`;
  } else {
    const st = L[act + 1] || 0;
    h += `<div class="card3d"><div class="card" id="card"><h3>${CARD_T[act]}</h3><div class="body">${CONCL[act]()}</div>
      ${act === 2 ? `<div class="formula">α + β + γ = π + K · A</div><p class="body" style="margin:6px 0 0">${Z('收束一问:180° 不是三角形天生的,而是「平行公理」这条规则的结果。我们住的宇宙,是平的吗?', 'Closing question: 180° is not built into triangles; it comes from one rule, the parallel postulate. Is the universe we live in flat?')}</p>` : ''}
      <div class="body" style="margin-top:6px"><span class="stars">${'★'.repeat(st)}${'☆'.repeat(3 - st)}</span> <small style="color:var(--mute)">${Z('完成', 'Done')} · ${pred === A.want ? Z('预测对了', 'prediction right') : Z('预测和结果不同(很正常)', 'prediction differed (that\'s normal)')} · ${hints ? Z('问过向导', 'asked the guide') : Z('没问向导', 'no guide')}</small></div>
      <div class="bridge">${BRIDGES.map(([w, id, t, u]) => `<a href="${u}" title="${id}">${w === '01' ? '✦' : '⇢'} ${t}</a>`).join('')}</div></div></div>
      <div class="go">${act < 2 ? `<button type="button" class="btn primary" id="next">${Z('下一幕 ›', 'Next act ›')}</button>` : `<a class="btn primary" href="../" style="text-decoration:none">${Z('回星图', 'Back to Math Atlas')}</a>`}<button type="button" class="btn" id="again">${Z('自己再玩一次', 'Play again')}</button></div>`;
  }
  h += `<div class="credit">${Z('读数由精确模型实时计算:球面、平面、庞加莱圆盘(双曲);面积为独立数值积分。蚂蚁与箭头为示意。', 'Readings are computed live from exact models (sphere, plane, Poincaré disc); area by independent numerical integration. Ant and arrow are illustrations.')}</div>`;
  panel.innerHTML = h; wire(); paintRead(); paintKnob(); checkGoal();
}
function wire() {
  panel.querySelectorAll('[data-act]').forEach(b => b.onclick = () => { if (busy) return; act = +b.dataset.act; restart(); });
  panel.querySelectorAll('[data-pred]').forEach(b => b.onclick = () => { pred = b.dataset.pred; phase = 'play'; render(); refresh(); });
  $('#meas') && ($('#meas').onclick = () => { shown = true; did.measure = true; const sv = $('#sumv'); sv.dataset.anim = 1; countTo(sv, 0, D(m.sum)); setTimeout(() => { delete sv.dataset.anim; paintRead(); }, RM ? 0 : 950); chord(); render(); });
  $('#trans') && ($('#trans').onclick = transport);
  $('#cmp') && ($('#cmp').onclick = () => setCompare(!cmp));
  $('#reset') && ($('#reset').onclick = () => { V = ACTS[act].V0.map(v => v.slice()); if (!ACTS[act].lockK) K = ACTS[act].K0; refresh(); render(); });
  $('#hint') && ($('#hint').onclick = () => { const H = ACTS[act].hints; $('#hintbox').innerHTML = `<div class="hint">${H[Math.min(hints, H.length - 1)]}</div>`; hints++; });
  $('#next') && ($('#next').onclick = () => { act++; restart(); });
  $('#again') && ($('#again').onclick = () => restart(true));
  wireSlider(); tiltCard();
}

/* ---------- 曲率旋钮 ---------- */
function paintKnob() { const k = $('#knob'); if (!k) return; k.style.left = ((K + 1) / 2 * 100) + '%'; $('#kval').textContent = 'K = ' + sgnK(K); $('#kt').setAttribute('aria-valuenow', K.toFixed(2)); }
function setK(k) { k = Math.max(-1, Math.min(1, k)); if (Math.abs(k) < 0.04) k = 0; if (k === K) return; K = k; paintKnob(); refresh(); if (cmp) tags(); }
function wireSlider() {
  const t = $('#kt'); if (!t || ACTS[act].lockK) return; const rail = $('#krail');
  let on = false;
  const at = e => { const r = t.getBoundingClientRect(), u = (e.clientX - r.left) / r.width; const over = u < 0 ? u : u > 1 ? u - 1 : 0;
    rail.style.transition = 'none'; rail.style.transform = over ? `scaleX(${1 + Math.min(0.08, Math.abs(over) * 0.25)}) translateX(${Math.sign(over) * Math.min(6, Math.abs(over) * 30)}px)` : ''; setK(u * 2 - 1); };
  t.addEventListener('pointerdown', e => { if (busy) return; on = true; t.setPointerCapture(e.pointerId); at(e); });
  t.addEventListener('pointermove', e => on && at(e));
  const end = () => { on = false; rail.style.transition = ''; rail.style.transform = ''; };
  t.addEventListener('pointerup', end); t.addEventListener('pointercancel', end);
  t.addEventListener('keydown', e => { const d = e.key === 'ArrowRight' || e.key === 'ArrowUp' ? 0.05 : e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -0.05 : 0; if (d) { e.preventDefault(); setK(Math.abs(K) < 1e-9 ? d * 1.2 : K + d); } });
}

/* ---------- 结论卡倾斜 ---------- */
function tiltCard() {
  const c = $('#card'); if (!c || RM) return;
  c.parentElement.addEventListener('pointermove', e => { const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5; c.style.transform = `rotateY(${x * 10}deg) rotateX(${-y * 8}deg)`; });
  c.parentElement.addEventListener('pointerleave', () => { c.style.transform = ''; });
}

/* ---------- 对照(分割线) ---------- */
const split = $('#split'), handle = split.querySelector('.h');
let sx = 0.5;
function stageW() { return stage.getBoundingClientRect().width; }
function tags() {
  const L = $('#tagL'), R = $('#tagR'), w = stageW();
  if (!cmp) { L.classList.remove('show'); R.classList.remove('show'); return; }
  L.textContent = Z('平面 K = 0 · 180°', 'Flat K = 0 · 180°'); R.textContent = (K > 0 ? Z('球面', 'Sphere') : K < 0 ? Z('双曲', 'Hyperbolic') : Z('平面', 'Flat')) + ` K = ${sgnK(K)}`;
  L.style.left = Math.max(70, w * sx / 2) + 'px'; R.style.left = Math.min(w - 70, w * sx + w * (1 - sx) / 2) + 'px'; L.classList.add('show'); R.classList.add('show');
}
function placeSplit() { split.style.left = stageW() * sx + 'px'; handle.setAttribute('aria-valuenow', Math.round(sx * 100)); view?.setSplit(sx); tags(); }
function setCompare(on) { cmp = on; did.compare = did.compare || on; split.classList.toggle('on', on); view.compare(on); placeSplit(); render(); refresh(); }
handle.addEventListener('pointerdown', e => { handle.setPointerCapture(e.pointerId); const mv = ev => { sx = Math.max(0.05, Math.min(0.95, (ev.clientX - stage.getBoundingClientRect().left) / stageW())); placeSplit(); }; handle.onpointermove = mv; handle.onpointerup = () => { handle.onpointermove = null; }; });
handle.addEventListener('keydown', e => { const d = e.key === 'ArrowRight' ? 0.05 : e.key === 'ArrowLeft' ? -0.05 : 0; if (d) { sx = Math.max(0.05, Math.min(0.95, sx + d)); placeSplit(); } });
addEventListener('resize', () => cmp && placeSplit());

/* ---------- 平行移动 ---------- */
async function transport() {
  if (busy) return; busy = true; view.lock(true);
  status.textContent = Z('玻璃箭头沿三条边走一圈:沿每条测地线,它和边的夹角始终不变。', 'The glass arrow travels round the three sides, keeping a fixed angle to each geodesic.');
  const rot = await view.transport(RM ? 0 : 5200); busy = false; view.lock(false);
  did.transport = true; chord();
  status.textContent = Z(`回到起点,箭头转过了 ${D(Math.abs(rot)).toFixed(1)}°;内角和 − 180° = ${D(m.sum - Math.PI).toFixed(1)}°。`, `Back at the start the arrow has turned ${D(Math.abs(rot)).toFixed(1)}°; angle sum − 180° = ${D(m.sum - Math.PI).toFixed(1)}°.`);
  if (act === 0) render(); else checkGoal();
}

/* ---------- 目标 ---------- */
function checkGoal() {
  const g = $('#goal'); if (!g || phase !== 'play' || !m) return;
  let ok = false, msg = '';
  const sum = D(m.sum);
  if (act === 0) { ok = did.measure && did.transport; msg = !did.measure ? Z('先按「量一量」。', 'Press "Measure" first.') : !did.transport ? Z('现在让箭头沿三角形走一圈,看它回来时转了多少。', 'Now send the arrow round the triangle and see how far it has turned.') : ''; }
  if (act === 1) { ok = K < 0 && sum < 90; msg = K >= 0 ? Z('先把旋钮拧到负数一侧。', 'First turn the dial to the negative side.') : Z(`现在内角和 <b>${sum.toFixed(1)}°</b>,目标:小于 90°。`, `Angle sum now <b>${sum.toFixed(1)}°</b>; target: below 90°.`); }
  if (act === 2) { ok = cmp && Math.abs(K) >= 0.5 && Math.abs(sum - 180) < 1; msg = !cmp ? Z('先打开「平直 vs 弯曲」对照。', 'Open "Flat vs curved" first.') : Math.abs(K) < 0.5 ? Z('保持 |K| ≥ 0.5,空间要足够弯。', 'Keep |K| ≥ 0.5 so space is curved enough.') : Z(`和 180° 相差 <b>${Math.abs(sum - 180).toFixed(2)}°</b>,目标:不到 1°。`, `Off from 180° by <b>${Math.abs(sum - 180).toFixed(2)}°</b>; target: under 1°.`); }
  if (ok && !busy) { finish(); return; }
  g.innerHTML = msg;
}
function finish() {
  const A = ACTS[act]; saveLevel(act + 1, 1 + (pred === A.want ? 1 : 0) + (hints === 0 ? 1 : 0));
  phase = 'done'; render(); view.lock(true);
}
function restart(keepPred = false) {
  const A = ACTS[act]; K = A.K0; V = A.V0.map(v => v.slice()); hints = 0; did = {}; shown = false; busy = false;
  phase = keepPred && pred ? 'play' : 'predict'; if (!keepPred) pred = null;
  if (cmp) { cmp = false; split.classList.remove('on'); view.compare(false); tags(); }
  status.textContent = ''; history.replaceState(null, '', `?l=${act + 1}${location.search.match(/[?&]lang=en/) ? '&lang=en' : ''}`);
  view.hideArrow(); render(); refresh();
}
/* 自动化自测钩子(只读写本页状态,等同拖动旋钮与顶点) */
window.MA_CURVE_TEST = { setK: k => { K = k; paintKnob(); refresh(); }, setV: v => { V = v; refresh(); }, tri, state: () => ({ act, phase, K, sum: m && D(m.sum), KA: m && D(m.KA), cmp }) };
boot();
