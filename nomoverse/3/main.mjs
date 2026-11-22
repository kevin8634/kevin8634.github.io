/* 宙律 Nomoverse 3.0 · 宇宙配方台入口(3-2:Worker + three r186 渲染层 + /shared/3/ui.js 界面)
 * 数据流:store(配方)→ Worker run → desc(scene.describe)→ 渲染层 update(desc);界面数字读 res,画面只读 desc。
 * 新手层 3 旋钮 G、c、α(×1 吸附)+ 引导三步 + 失败卡两层 + 真实宇宙对比(3-3);
 * 探索层(3-4):基础/进阶切换,+ε、Ω₀(滑块 + 液位表)、Q、Λ(彗星旋钮)、种子翻牌、锁定开关、随机宇宙、题卡叠牌;星桥把恒星系交给天枢。
 * 造物层(3-5):命名(Decrypted Text)、作品卡(Profile Card + Count Up + T7 N 体 Worker 轨道)、带去天枢(Star Border)、
 *   复制分享链接(Glare Hover,?gus= 超长退 ?r=)、导出/导入 JSON(File Upload)、gn:gus:last。 */
import { tier, createRecipeStore, i18n, encodeUniverse, recipeFromGus, registerSelftest, gus, recipeToParam } from './core/adapt.mjs';
import { setLang } from '/shared/3/i18n.js';
import * as ui from '/shared/3/ui.js';
import { call, runLatest, usingWorker } from './core/wclient.mjs';
import { snap1, compareRows, explain, REAL_CREDIT, STAGE, GUIDE, guideStep } from './core/teach.mjs';
import * as X from './core/explore.mjs';
import { cometDial, sloshGauge, rubberSegment, splitFlap, cardStack, lockSwitch } from './core/explore-ui.mjs';
import * as C from './core/create.mjs';
import { profileCard, decryptedText, starBorder, glareHover, fileUpload, orbitCanvas } from './core/create-ui.mjs';

const U = window.NV3_UNIVERSE, G0 = window.NV3_GUS, SC = window.NV3_SCENE;
const $ = (id) => document.getElementById(id);

/* ---------- 文案 ---------- */
const DICT = {
  home: { zh: '← 创世计划', en: '← Genesis' }, homeAria: { zh: '返回创世计划', en: 'Back to Genesis' },
  world: { zh: '宙律', en: 'Nomoverse' }, sub: { zh: '物理 · 宇宙配方台', en: 'Physics · Universe Recipe Bench' },
  undo: { zh: '撤销', en: 'Undo' }, redo: { zh: '重做', en: 'Redo' }, quality: { zh: '画质', en: 'Quality' },
  ask: { zh: '你想造一个什么样的宇宙?', en: 'What kind of universe will you build?',
    zhMore: '拧动三个常数,再按「大爆炸」。宇宙会沿 138 亿年走 7 关:能不能膨胀、造出氦、留住电子、聚成团、点燃恒星、留出时间、长出行星。没有标准答案,只有后果。',
    enMore: 'Turn the three constants, then press Big Bang. Your universe walks 7 stages over 13.8 billion years: expand, make helium, hold electrons, clump, ignite stars, leave time, grow planets. No right answer, only consequences.' },
  askSub: { zh: '改一个数,看它牵动了什么', en: 'Change one number, see what it pulls' },
  kG: { zh: '引力 G', en: 'Gravity G' }, kc: { zh: '光速 c', en: 'Light speed c' }, kA: { zh: '电磁 α', en: 'Electromagnetism α' },
  reset: { zh: '回到真实宇宙', en: 'Back to our universe' },
  sStatus: { zh: '结局', en: 'Outcome' }, sAge: { zh: '宇宙年龄', en: 'Age' }, sTeff: { zh: '恒星表面温度', en: 'Star surface' },
  sPlanets: { zh: '行星', en: 'Planets' }, sHab: { zh: '宜居带行星', en: 'In habitable zone' },
  ok: { zh: '走到了有行星的那一天', en: 'It made it to planets' }, warn: { zh: '走到了,但很勉强', en: 'It made it, barely' }, fail: { zh: '没走到最后', en: 'Did not make it' },
  expand: { zh: '一直膨胀', en: 'expands forever' }, crunch: { zh: '会回缩', en: 'recollapses' },
  gyr: { zh: '{n} 亿年', en: '{n} Gyr' }, none: { zh: '—', en: '—' },
  bang: { zh: '大爆炸', en: 'Big Bang' },
  T1: { zh: '膨胀', en: 'Expand' }, T2: { zh: '核合成', en: 'Nuclei' }, T3: { zh: '原子', en: 'Atoms' }, T4: { zh: '成团', en: 'Clumps' },
  T5: { zh: '点燃', en: 'Ignition' }, T6: { zh: '时间', en: 'Time' }, T7: { zh: '恒星系', en: 'System' },
  failAt: { zh: '卡在第 {n} 关 · {t}', en: 'Stuck at stage {n} · {t}' },
  simp: { zh: '教学简化:轨道半径对数压缩、行星放大显示;真实数值见右侧。', en: 'Teaching simplification: orbits log-compressed, planets enlarged; real values on the right.' },
  qhigh: { zh: '高', en: 'Hi' }, qmedium: { zh: '中', en: 'Mid' }, qlow: { zh: '低', en: 'Lo' },
  cmpT: { zh: '和真实宇宙比一比', en: 'Compare with our universe' }, cmpS: { zh: '拖动竖条', en: 'Drag the bar' },
  real: { zh: '真实宇宙', en: 'Our universe' }, yours: { zh: '你的宇宙', en: 'Your universe' },
  fixL: { zh: '试试:', en: 'Try: ' }, warnAt: { zh: '第 {n} 关有点勉强 · {t}', en: 'Stage {n} is shaky · {t}' },
  skip: { zh: '跳过', en: 'Skip' }, gotit: { zh: '知道了', en: 'Got it' }, help: { zh: '新手引导', en: 'Guide' },
  snapped: { zh: '已吸附到真实值 ×1', en: 'Snapped to real value ×1' },
  qdrop: { zh: '帧率偏低,已自动降到{q}档', en: 'Low frame rate, switched to {q}' },
  mBasic: { zh: '基础', en: 'Basic' }, mAdv: { zh: '进阶', en: 'Explore' }, mode: { zh: '层级', en: 'Level' },
  keps: { zh: '核效率 ε', en: 'Nuclear efficiency ε' }, kOm: { zh: '物质密度 Ω₀', en: 'Matter density Ω₀' },
  kQ: { zh: '涟漪 Q', en: 'Ripples Q' }, kkL: { zh: '暗能量 Λ', en: 'Dark energy Λ' },
  gauge: { zh: '有效 Ωm', en: 'Effective Ωm' }, crit: { zh: '临界 1', en: 'critical 1' },
  seed: { zh: '种子', en: 'Seed' }, reseed: { zh: '换一个种子', en: 'New seed' }, rand: { zh: '随机宇宙', en: 'Random universe' },
  lock: { zh: '锁定{k}(随机与题卡不改它)', en: 'Lock {k} (random and cards leave it)' },
  cardsT: { zh: '题卡', en: 'Puzzle cards' }, flip: { zh: '点一下看答案', en: 'Tap for the answer' }, tryIt: { zh: '试试', en: 'Try it' },
  prev: { zh: '上一张', en: 'Previous' }, next: { zh: '下一张', en: 'Next' }, of: { zh: '/', en: 'of' },
  locked: { zh: '已锁定,没改:{k}', en: 'Locked, left as is: {k}' },
  mMake: { zh: '造物', en: 'Create' }, makeT: { zh: '作品卡', en: 'Universe card' }, nameL: { zh: '给宇宙起名', en: 'Name your universe' },
  tohelm: { zh: '带去天枢', en: 'Take to Starhelm' }, share: { zh: '复制分享链接', en: 'Copy share link' }, export: { zh: '导出 JSON', en: 'Export JSON' },
  imp: { zh: '导入 JSON', en: 'Import JSON' }, impHint: { zh: '点这里或把 .gus.json 拖进来', en: 'Tap or drop a .gus.json file' },
  copied: { zh: '链接已复制', en: 'Link copied' }, copyFail: { zh: '复制不了,请手动复制:', en: 'Could not copy, copy it by hand: ' },
  longLink: { zh: '恒星系太大,链接只带配方和名字', en: 'System too large, the link carries the recipe and name only' },
  saved: { zh: '已导出 {f}', en: 'Exported {f}' }, noPlanets: { zh: '没有行星', en: 'No planets' }, noStar: { zh: '没有恒星', en: 'No star' },
  cAge: { zh: '年龄', en: 'Age' }, cPl: { zh: '行星', en: 'Planets' }, cHab: { zh: '宜居', en: 'Habitable' }, cTeff: { zh: '恒星', en: 'Star' },
  orbitNote: { zh: 'N 体实时积分 · 半径开方压缩', en: 'Live N-body · radius √-compressed' },
  bridge: { zh: '星桥 · 去天枢看恒星系', en: 'Star Bridge · see it in Starhelm' }, mark0: { zh: 'Λ = 0', en: 'Λ = 0' }, mark1: { zh: '真实值', en: 'Real value' }
};
const FAIL_NOTE_EN = {
  crunch: 'Space falls back and squeezes into a point', helium_only: 'Only helium, too little star fuel', hydrogen_only: 'No helium to start, nucleosynthesis stalls',
  no_atoms: 'Electrons cannot be held, the universe stays plasma', few_elements: 'Only the first rows of the periodic table', cold: 'Matter spreads out, a cold fog',
  bh_soup: 'Ripples too strong, everything collapses into black holes', no_ignition: 'Gas clouds never get hot enough to ignite', flash: 'Stars burn out before planets form',
  orbit_break: 'Neighbours tear the orbits apart', chem_freeze: 'Bonds too weak or too cold for molecules'
};
let L = i18n(DICT);

/* ---------- 画质与动效 ---------- */
const RM = matchMedia('(prefers-reduced-motion: reduce)');
const mobile = matchMedia('(pointer: coarse)').matches || Math.min(screen.width, screen.height) < 600;
const probe = (() => { try { return document.createElement('canvas').getContext('webgl2'); } catch (e) { return null; } })();
const tierInfo = tier.pickTier(probe);
const loseCtx = probe && probe.getExtension('WEBGL_lose_context'); loseCtx && loseCtx.loseContext();
tier.set(tierInfo.tier); tier.apply(tierInfo.tier);

/* ---------- 状态 ---------- */
const store = createRecipeStore(U);
const gq = new URLSearchParams(location.search).get('gus');
let uName = C.cleanName(new URLSearchParams(location.search).get('n') || '');   // 用户起的名字;空 = 按种子默认名
if (gq) {
  try { const g = gq === '@last' ? gus.loadLast() : await gus.decode(gq); if (g && g.kind === 'universe') { store.reset(recipeFromGus(g).recipe); uName = C.cleanName(g.name && (g.name.zh || g.name.en)); } }
  catch (e) { /* 坏 GUS 忽略 */ }
}
store.bindKeys();

/* ---------- 渲染层(只读 desc) ---------- */
let R = null, R2 = null, lastDesc = null, last = null;
const cv = $('stage'), cv2 = $('stage2d');
try { R = (await import('./core/render3.mjs')); } catch (e) { R = null; }
let view = R ? R.init(cv, { tier: tier.current(), budget: tier.budget(), reduced: RM.matches, mobile }) : null;
if (!view) {
  cv.hidden = true; cv2.hidden = false; R2 = R;
  let t = 0; const loop = () => { if (lastDesc && R2) R2.draw2D(cv2, lastDesc, t); if (!RM.matches && !document.hidden) t += 0.004; requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
}
async function loadSky() {
  const s = store.get(); const f32 = await call('sky', { seed: s.seed, n: tier.budget().particles });
  view && view.setSky(f32, lastDesc ? lastDesc.sky.density : 1);
}
RM.addEventListener && RM.addEventListener('change', () => view && view.setReduced(RM.matches));

/* ---------- 界面:/shared/3/ui.js ---------- */
const ask = ui.expandableCard.mount($('ask'), { title: L.t('ask'), summary: L.t('askSub'), more: L.two('ask').more });
const KNOBS = [
  { key: 'kG', color: 'var(--gn3-k-G)' }, { key: 'kc', color: 'var(--gn3-k-c)' }, { key: 'kA', color: 'var(--gn3-k-alpha)' }
];
const fmtK = (v) => '×' + (+v.toPrecision(v < 0.1 ? 2 : 3));
KNOBS.forEach((k) => {
  const box = $('k-' + k.key); ui.glassSurface.mount(box, {});
  const [lo, hi] = U.RANGE[k.key];
  k.sl = ui.slider.mount(box.querySelector('.sl'), {
    min: lo, max: hi, log: true, value: store.get()[k.key], label: L.t(k.key), color: k.color, format: fmtK,
    onStart: () => store.beginGesture(), onEnd: () => store.endGesture(),
    onInput: (v) => { const w = snap1(v); store.set((s) => ({ ...s, [k.key]: w })); guide({ type: 'knob', key: k.key, v: w }); }
  });
  /* ×1 刻度:真实宇宙的位置 */
  const tr = box.querySelector('.gn3-slider-track');
  if (tr) { const t1 = Math.log(1 / lo) / Math.log(hi / lo), tick = document.createElement('span'); tick.className = 'one-tick'; tick.style.left = (t1 * 100).toFixed(2) + '%'; tick.setAttribute('aria-hidden', 'true'); tr.append(tick); }
});
/* ---------- 3-4 探索层 ---------- */
const NAME = { kG: 'kG', kc: 'kc', kA: 'kA', eps: 'keps', Om: 'kOm', Q: 'kQ', kL: 'kkL', seed: 'seed' };
const MKEY = 'nv3.mode', LKEY = 'nv3.locks';
const qs = new URLSearchParams(location.search);
let mode = ['adv', 'basic', 'make'].includes(qs.get('mode')) ? qs.get('mode') : (() => { try { return localStorage.getItem(MKEY) || 'basic'; } catch (e) { return 'basic'; } })();
{ const s0 = store.get(); if (mode === 'basic' && (X.ADV.some((k) => X.snapReal(k, s0[k]) !== X.REALV[k]) || s0.seed !== U.DEF.seed)) mode = 'adv'; if ((gq || uName) && mode !== 'make') mode = 'make'; }   // 链接带进阶常数时直接进进阶
let locks = (() => { try { return X.strToLock(localStorage.getItem(LKEY)); } catch (e) { return new Set(); } })();
const seg = rubberSegment.mount($('mode'), { items: [{ id: 'basic', label: '' }, { id: 'adv', label: '' }, { id: 'make', label: '' }], value: mode, onChange: (m) => setMode(m, true) });
function setMode(m, user) {
  mode = m; document.body.classList.toggle('is-adv', m !== 'basic'); document.body.classList.toggle('is-make', m === 'make');
  if (user) { try { localStorage.setItem(MKEY, m); } catch (e) { /* 隐私模式 */ } }
  if (m === 'make') queueOrbit();
  if (m !== 'basic') { requestAnimationFrame(() => { dials.forEach((d) => d.ui.update({})); stack && stack.update({}); }); }
}
const ADVS = [
  { key: 'eps', color: 'var(--gn3-k-eps)', log: false, step: 0.0001 },
  { key: 'Om', color: 'var(--gn3-k-Omega)', log: true }
];
ADVS.forEach((k) => {
  const box = $('k-' + k.key); ui.glassSurface.mount(box, {});
  const [lo, hi] = U.RANGE[k.key];
  k.sl = ui.slider.mount(box.querySelector('.sl'), {
    min: lo, max: hi, log: k.log, step: k.step || 0, value: store.get()[k.key], label: L.t(NAME[k.key]), color: k.color, format: (v) => X.fmt(k.key, v),
    onStart: () => store.beginGesture(), onEnd: () => store.endGesture(),
    onInput: (v) => { const w = X.snapReal(k.key, v); store.set((s) => ({ ...s, [k.key]: w })); }
  });
  const tr = box.querySelector('.gn3-slider-track');
  if (tr) { const tick = document.createElement('span'); tick.className = 'one-tick'; tick.style.left = (X.toT(k.key, X.REALV[k.key]) * 100).toFixed(2) + '%'; tick.setAttribute('aria-hidden', 'true'); tr.append(tick); }
});
const gaugeUI = sloshGauge.mount($('gauge'), { value: U.K.OM0, label: '', lineLabel: '', format: (v) => (+v.toPrecision(v < 0.1 ? 2 : 3)).toString() });
const dials = [{ key: 'Q', color: 'var(--gn3-k-Q)' }, { key: 'kL', color: 'var(--gn3-k-Lambda)' }];
dials.forEach((d) => {
  const marks = () => [{ t: X.toT(d.key, X.REALV[d.key]), cls: 'is-real', title: L.t('mark1') }].concat(d.key === 'kL' ? [{ t: X.toT('kL', 0), cls: 'is-zero', title: L.t('mark0') }] : []);
  d.marks = marks;
  d.ui = cometDial.mount($('k-' + d.key).querySelector('.dial'), {
    label: L.t(NAME[d.key]), value: store.get()[d.key], color: d.color, toT: (v) => X.toT(d.key, v), fromT: (t) => X.fromT(d.key, t), snap: (v) => X.snapReal(d.key, v),
    format: (v) => X.fmt(d.key, v), marks: marks(),
    onStart: () => store.beginGesture(), onEnd: () => store.endGesture(),
    onInput: (v) => store.set((s) => ({ ...s, [d.key]: v }))
  });
});
ui.glassSurface.mount($('k-seed'), {}); ['k-Q', 'k-kL'].forEach((id) => ui.glassSurface.mount($(id), {}));
const flap = splitFlap.mount($('flap'), { text: X.seedText(store.get().seed) });
$('reseed').addEventListener('click', () => store.set((s) => ({ ...s, seed: (Math.random() * 4294967296) >>> 0 })));
$('rand').addEventListener('click', () => store.set((s) => U.normalize(X.randomRecipe(s, locks, Math.random))));
/* 锁定开关:每个常数与种子一只 */
const lockUI = {};
X.LOCKABLE.forEach((k) => {
  const box = $('k-' + k); if (!box) return;
  const w = document.createElement('span'); w.className = 'lk'; box.append(w);
  lockUI[k] = lockSwitch.mount(w, { checked: locks.has(k), label: '', onChange: (on) => { on ? locks.add(k) : locks.delete(k); try { localStorage.setItem(LKEY, X.lockToStr(locks)); } catch (e) { /* 隐私模式 */ } } });
});
/* 题卡叠牌 */
const cardList = () => X.CARDS.map((c, i) => ({ id: c.id, front: c.q[L.lang === 'en' ? 'en' : 'zh'], back: c.a[L.lang === 'en' ? 'en' : 'zh'], tag: (L.lang === 'en' ? 'Card ' : '题 ') + (i + 1) }));
let lockNote = '';
const stack = cardStack.mount($('stack'), {
  cards: cardList(), labels: { prev: L.t('prev'), next: L.t('next'), flip: L.t('flip'), try: L.t('tryIt'), of: L.t('of') },
  onTry: (id) => {
    const c = X.CARDS.find((x) => x.id === id), b = X.blockedBy(c, locks);
    store.set((s) => U.normalize(X.applyCard(s, c, locks)));
    lockNote = b.length ? L.t('locked', { k: b.map((k) => L.t(NAME[k])).join('、') }) : '';
    paintLockNote();
  }
});
function paintLockNote() { let n = $('cardsec').querySelector('.lk-note'); if (!n) { n = document.createElement('p'); n.className = 'lk-note'; $('cardsec').append(n); } n.textContent = lockNote; n.hidden = !lockNote; }
/* 星桥:把当前恒星系编码成 GUS,交给天枢(?gus=,同时存 gn:gus:last) */
async function goHelm(btn) {
  if (!last) return;
  try {
    const e = await encodeUniverse(last, meta(), G0);
    try { gus.saveLast(e.gus); } catch (err) { /* 存储满 */ }
    location.href = e.fits ? await gus.toUrl(e.gus, '/starhelm/') : '/starhelm/?gus=@last';
  } catch (err) { btn.classList.add('is-err'); setTimeout(() => btn.classList.remove('is-err'), 1200); }
}
$('bridge').addEventListener('click', () => goHelm($('bridge')));

/* ---------- 3-5 造物层 ---------- */
const curName = () => C.nameFor(uName, store.get().seed);
const meta = () => ({ name: curName(), created: new Date().toISOString() });
const nmIn = $('nm-in');
nmIn.value = uName;
nmIn.addEventListener('input', () => { uName = C.cleanName(nmIn.value); clearTimeout(nmIn.t); nmIn.t = setTimeout(paintMake, 260); });
nmIn.addEventListener('change', () => { nmIn.value = uName; paintMake(); });
const pc = profileCard.mount($('pcard'), { hue: 262 });
const PC = { cv: document.createElement('canvas'), name: document.createElement('h3'), line: document.createElement('p'), grid: document.createElement('div'), foot: document.createElement('p'), note: document.createElement('span') };
PC.cv.className = 'pc-orbit'; PC.cv.setAttribute('role', 'img'); PC.name.className = 'pc-name'; PC.line.className = 'pc-line'; PC.grid.className = 'pc-grid'; PC.foot.className = 'pc-foot'; PC.note.className = 'pc-note';
const PCS = ['cAge', 'cPl', 'cHab', 'cTeff'].map((k) => { const d = document.createElement('div'), b = document.createElement('b'), sp = document.createElement('span'); d.className = 'pc-s'; sp.dataset.k = k; d.append(b, sp); PC.grid.append(d); return { k, b, sp }; });
pc.inner.append(PC.cv, PC.note, PC.name, PC.line, PC.grid, PC.foot);
const dec = decryptedText.mount(PC.name, { text: '' });
const cuMake = [
  ui.countUp.mount(PCS[0].b, { value: 0, format: (v) => (v ? (L.lang === 'en' ? v.toFixed(1) + ' Gyr' : (v * 10).toFixed(0)) : '—') }),
  ui.countUp.mount(PCS[1].b, { value: 0, format: (v) => String(Math.round(v)) }),
  ui.countUp.mount(PCS[2].b, { value: 0, format: (v) => String(Math.round(v)) }),
  ui.countUp.mount(PCS[3].b, { value: 0, format: (v) => (v ? Math.round(v).toLocaleString() + ' K' : '—') })
];
const orb = orbitCanvas.mount(PC.cv, { orbit: null, empty: '' });
let orbitInfo = null;
starBorder.mount($('tohelm'), { color: '#c4b5fd', speed: 5 });
const glare = glareHover.mount($('share'), {});
glareHover.mount($('export'), {});
$('tohelm').addEventListener('click', () => goHelm($('tohelm')));
const say = (t, ok = true) => { const m = $('mk-msg'); m.textContent = t; m.className = 'mk-msg' + (t ? ok ? ' is-ok' : ' is-err' : ''); };
async function shareUrl() {
  const e = await encodeUniverse(last, meta(), G0);
  try { gus.saveLast(e.gus); } catch (err) { /* 存储满 */ }
  if (C.shareKind(e.len, gus.URL_MAX) === 'gus') return { url: await gus.toUrl(e.gus, '/nomoverse/3/'), kind: 'gus' };
  const u = new URL('/nomoverse/3/', location.href); u.searchParams.set('r', recipeToParam(store.get())); if (uName) u.searchParams.set('n', uName);
  return { url: u.toString(), kind: 'r' };
}
async function copyText(t) {
  try { if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(t); return true; } } catch (e) { /* 回退 */ }
  try { const ta = document.createElement('textarea'); ta.value = t; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;left:-9999px;top:0'; document.body.append(ta); ta.select(); const ok = document.execCommand('copy'); ta.remove(); return ok; } catch (e) { return false; }
}
let lastShare = '';
$('share').addEventListener('click', async () => {
  if (!last) return;
  const s = await shareUrl(); lastShare = s.url; glare.flash();
  const ok = await copyText(s.url);
  say(ok ? L.t('copied') + (s.kind === 'r' ? ' · ' + L.t('longLink') : '') : L.t('copyFail') + s.url, ok);
});
async function exportText() { const e = await encodeUniverse(last, meta(), G0); try { gus.saveLast(e.gus); } catch (err) { /* 存储满 */ } return { text: C.toJSONText(e.gus), file: C.fileName(e.gus) }; }
$('export').addEventListener('click', async () => {
  if (!last) return;
  const x = await exportText();
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([x.text], { type: 'application/json' })); a.download = x.file;
  document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  say(L.t('saved', { f: x.file }));
});
function importText(text) {
  const r = C.parseImport(text, gus.validate), lg = L.lang === 'en' ? 'en' : 'zh';
  if (!r.ok) { const m = C.IMPORT_MSG[r.err][lg]; up.message(m, false); return r; }
  store.set(U.normalize(recipeFromGus(r.g).recipe));
  uName = C.cleanName(r.g.name && (r.g.name[lg] || r.g.name.zh || r.g.name.en)); nmIn.value = uName;
  try { gus.saveLast(r.g); } catch (e) { /* 存储满 */ }
  up.message(C.IMPORT_MSG.ok[lg].replace('{n}', curName()[lg]), true);
  return { ok: true, id: r.g.id };
}
const up = fileUpload.mount($('upload'), { onFile: async (f) => { importText(f.size > C.IMPORT_MAX ? 'x'.repeat(C.IMPORT_MAX + 1) : await f.text()); } });
function paintMake() {
  if (!last) return;
  const lg = L.lang === 'en' ? 'en' : 'zh', st = C.cardStats(last, lastDesc), nm = curName()[lg];
  nmIn.placeholder = C.defaultName(store.get().seed)[lg];
  dec.update({ text: nm });
  PC.line.textContent = C.STATUS_LINE[st.status][lg]; PC.line.className = 'pc-line is-' + st.status;
  PCS.forEach((p) => { p.sp.textContent = L.t(p.k); });
  cuMake[0].update({ value: st.ageGyr || 0 }); cuMake[1].update({ value: st.planets }); cuMake[2].update({ value: st.hab }); cuMake[3].update({ value: st.teffK });
  PCS[0].sp.textContent = L.t('cAge') + (lg === 'en' ? '' : '(亿年)');
  const rgb = lastDesc && lastDesc.star && lastDesc.star.lit ? last.star.rgb : null;
  pc.update({ hue: rgb ? Math.round(200 + 160 * (1 - rgb[2])) % 360 : 262 });
  PC.foot.textContent = 'nv-' + G0.hashId(JSON.stringify([...['kG', 'kc', 'kA', 'alphaLinked', 'eps', 'Q', 'kL', 'Om', 'seed'].map((k) => last.recipe[k])])) + ' · ' + L.t('seed') + ' ' + X.seedText(store.get().seed);
  PC.note.textContent = L.t('orbitNote');
  PC.cv.setAttribute('aria-label', st.planets ? L.t('cPl') + ' ' + st.planets : L.t(st.teffK ? 'noPlanets' : 'noStar'));
  orb.update({ empty: L.t(st.teffK ? 'noPlanets' : 'noStar') });
}
let orbitSeq = 0;
function queueOrbit() { clearTimeout(queueOrbit.t); queueOrbit.t = setTimeout(loadOrbit, 220); }
async function loadOrbit() {
  if (mode !== 'make' || !last) return;
  const my = ++orbitSeq, s = store.get();
  const o = await call('orbit', { recipe: s, frames: tier.current() === 'low' ? 300 : 600 });
  if (my !== orbitSeq) return;
  const showPl = lastDesc ? lastDesc.planets.length : 0;
  orbitInfo = { frames: o.frames, n: o.n, drift: o.drift, years: o.years, lit: o.lit };
  orb.update({ orbit: showPl ? o : null, masses: last.planets.map((p) => p.mass_kg / 5.9722e24) });
  paintMake();
}
setMode(mode, false);

$('reset').addEventListener('click', () => store.set(U.normalize({ seed: store.get().seed })));
$('undo').addEventListener('click', () => store.undo());
$('redo').addEventListener('click', () => store.redo());
$('lang').addEventListener('click', () => { setLang(L.lang === 'en' ? 'zh' : 'en'); relabel(); });
const Q = ['high', 'medium', 'low'];
$('q').addEventListener('click', () => { const i = (Q.indexOf(tier.current()) + 1) % 3; setTier(Q[i], true); });
function setTier(t, user) {
  if (tierInfo.software && t !== 'low') t = 'low';               // 软件渲染强制 low
  tier.set(t, { persist: !!user }); tier.apply(t);
  view && view.setTier(t, tier.budget(t)); loadSky(); paintQ(); refresh(store.get());
}
const paintQ = () => { $('q').textContent = L.t('q' + tier.current()); };
tier.watchFPS((t, fps) => { fps0 = fps; setTier(t, false); });
let fps0 = 60;

/* 统计卡(countUp)与时间线 */
const cu = { teff: ui.countUp.mount($('s-teff'), { value: 0, format: (v) => Math.round(v).toLocaleString() + ' K' }) };
const tl = ui.timeline.mount($('tl'), { items: U.ORDER.map((t) => ({ id: t, title: L.t(t), state: 'todo' })), onPick: (id) => { pickedStage = pickedStage === id ? null : id; paintStage(pickedStage); } });
let failCard = null, revealed = 7, playing = 0;

function stageItems(res) {
  return U.ORDER.map((t, i) => ({ id: t, title: L.t(t), sub: i < revealed ? '' : '', state: i < revealed ? res.stages[t] : 'todo' }));
}
function paintStats(res, desc) {
  $('s-status').textContent = L.t(res.status);
  $('s-status').className = 'is-' + res.status;
  $('s-age').textContent = res.cosmos.ageGyr ? L.t('gyr', { n: (res.cosmos.ageGyr * 10).toFixed(0) }) + ' · ' + L.t(res.cosmos.fate === 'crunch' ? 'crunch' : 'expand') : L.t(res.cosmos.fate === 'crunch' ? 'crunch' : 'expand');
  cu.teff.update({ value: desc.star.lit ? res.star.teff : 0 });
  $('s-pl').textContent = String(desc.planets.length);
  $('s-hab').textContent = String(desc.planets.filter((p) => p.habitable).length);
  paintCard(res, desc);
}

/* 失败卡两层:第一层一句话(卡在第几关),第二层因果 + 数字 + 往哪拧 + 真实宇宙对比 */
const FB = { body: document.createElement('div'), why: document.createElement('p'), fix: document.createElement('p'), cmp: document.createElement('div'), credit: document.createElement('p'),
  a: document.createElement('div'), b: document.createElement('div') };
FB.body.className = 'fb'; FB.fix.className = 'fb-fix'; FB.cmp.className = 'fb-cmp'; FB.credit.className = 'fb-credit'; FB.a.className = 'cmp-p is-real'; FB.b.className = 'cmp-p is-yours';
FB.body.append(FB.why, FB.fix, FB.cmp, FB.credit);
const cmp = ui.compare.mount(FB.cmp, { before: FB.a, after: FB.b, value: 0.5, labels: ['', ''] });
function fillCmp(res) {
  const rows = compareRows(res, L.lang);
  const col = (el, key) => el.replaceChildren(...rows.map((r) => { const d = document.createElement('div'); d.className = 'cmp-r'; const k = document.createElement('span'), v = document.createElement('b'); k.textContent = r.k; v.textContent = r[key]; d.append(k, v); return d; }));
  col(FB.a, 'real'); col(FB.b, 'yours');
  cmp.update({ labels: [L.t('real'), L.t('yours')] });
  FB.credit.textContent = REAL_CREDIT[L.lang === 'en' ? 'en' : 'zh'];
}
function paintCard(res, desc) {
  const ex = explain(res, U, L.lang), fv = desc.failVisual;
  fillCmp(res);
  FB.why.hidden = FB.fix.hidden = !ex;
  let o;
  if (ex) {
    const n = +ex.stage.slice(1);
    FB.why.textContent = ex.why; FB.fix.textContent = L.t('fixL') + ex.fix;
    const note = ex.level !== 'fail' ? ex.fix : L.lang === 'en' ? FAIL_NOTE_EN[ex.code] : fv && fv.code === ex.code ? fv.note : ex.why.split('。')[0] + '。';
    o = { title: L.t(ex.level === 'fail' ? 'failAt' : 'warnAt', { n, t: L.t(ex.stage) }), summary: note || '', more: FB.body };
  } else o = { title: L.t('cmpT'), summary: L.t('cmpS'), more: FB.body };
  failCard ? failCard.update(o) : (failCard = ui.expandableCard.mount($('fail'), o));
  $('fail').hidden = false; $('fail').className = 'gn3-glass gn3-exp lvl-' + (ex ? ex.level : 'ok') + (failCard.el.classList.contains('is-open') ? ' is-open' : '');
  $('fail').style.setProperty('--fv', ex && ex.level === 'fail' && fv ? fv.palette[0] : ex ? 'var(--gn3-warn)' : 'var(--gn3-ok)');
}
const openCard = () => { if (!$('fail').classList.contains('is-open')) $('fail').querySelector('.gn3-exp-head').click(); };

/* 每关一句讲解:点时间线某关 */
function paintStage(id) {
  const n = $('stage-note'); if (!id || !STAGE[id]) { n.hidden = true; return; }
  n.hidden = false; n.querySelector('b').textContent = L.t(id); n.querySelector('p').textContent = STAGE[id][L.lang === 'en' ? 'en' : 'zh'];
}
let pickedStage = null;

/* ---------- 引导三步(首访自动;? 按钮重放;?guide=0 关闭) ---------- */
const GKEY = 'nv3.guide';
let gStep = 3;
const gTarget = () => [$('k-kG'), $('bang'), $('fail')][gStep];
function paintGuide() {
  document.querySelectorAll('.coach-target').forEach((e) => e.classList.remove('coach-target'));
  const c = $('coach');
  if (gStep >= 3) { c.hidden = true; return; }
  const g = GUIDE[L.lang === 'en' ? 'en' : 'zh'][gStep], okRun = last && !explain(last, U);
  c.hidden = false; c.querySelector('b').textContent = g.t; c.querySelector('p').textContent = gStep === 2 && okRun ? g.ok : g.d;
  $('g-skip').textContent = L.t('skip'); $('g-next').textContent = L.t('gotit'); $('g-next').hidden = gStep !== 2; $('g-skip').hidden = gStep === 2;
  const t = gTarget(); if (t) { t.classList.add('coach-target'); t.scrollIntoView && t.scrollIntoView({ block: 'nearest', behavior: RM.matches ? 'auto' : 'smooth' }); }
}
function guide(ev) {
  if (gStep >= 3) return;
  const n = guideStep(gStep, ev);
  if (n === gStep) return;
  gStep = n;
  if (gStep === 2) openCard();
  if (gStep >= 3) { try { localStorage.setItem(GKEY, 'done'); } catch (e) { /* 隐私模式 */ } }
  paintGuide();
}
$('g-skip').addEventListener('click', () => guide({ type: 'skip' }));
$('g-next').addEventListener('click', () => guide({ type: 'done' }));
$('help').addEventListener('click', () => { gStep = 0; paintGuide(); });
{ let seen = false; try { seen = localStorage.getItem(GKEY) === 'done'; } catch (e) { seen = true; }
  if (!seen && !/[?&]guide=0\b/.test(location.search)) gStep = 0; }

/* 后果指示:每个旋钮沿其范围 24 点的「通过关数」迷你图 + 当前位置 */
async function paintSparks(s) {
  for (const k of mode === 'adv' ? KNOBS.concat(ADVS) : KNOBS) {
    const pts = await call('sweep', { recipe: s, key: k.key, n: 24 });
    const x = (v) => X.toT(k.key, v) * 100, y = (p) => 26 - (p / 7) * 24;
    const d = pts.map((p, i) => (i ? 'L' : 'M') + x(p.v).toFixed(1) + ' ' + y(p.pass).toFixed(1)).join(' ');
    const cur = U.run(s), pass = U.ORDER.filter((t) => cur.stages[t] !== 'fail').length;
    const svg = $('k-' + k.key).querySelector('.spark');
    svg.innerHTML = `<path d="${d}" fill="none" stroke="${k.color}" stroke-width="1.6" vector-effect="non-scaling-stroke" stroke-linejoin="round" opacity=".9"/><circle cx="${x(s[k.key]).toFixed(1)}" cy="${y(pass).toFixed(1)}" r="2.6" fill="${k.color}"/>`;
  }
}

async function refresh(s) {
  const out = await runLatest(s, tier.budget());
  if (!out) return;
  last = out.res; lastDesc = out.desc;
  view && view.update(out.desc);
  tl.update({ items: stageItems(last) });
  paintStats(last, out.desc);
  KNOBS.concat(ADVS).forEach((k) => { if (Math.abs(k.sl.value - s[k.key]) > 1e-12) k.sl.update({ value: s[k.key] }); });
  dials.forEach((d) => { if (d.ui.value !== s[d.key]) d.ui.update({ value: s[d.key] }); });
  gaugeUI.update({ value: last.cosmos.Om, label: L.t('gauge'), lineLabel: L.t('crit') });
  flap.update({ text: X.seedText(s.seed) });
  $('undo').disabled = !store.canUndo; $('redo').disabled = !store.canRedo;
  clearTimeout(refresh.t); refresh.t = setTimeout(() => paintSparks(s), 120);
  if (mode === 'make') { paintMake(); queueOrbit(); }
}
store.subscribe(refresh);

/* 大爆炸:逐关揭示(每关 ≤300ms;减少动态时一次给出) */
$('bang').addEventListener('click', () => {
  if (!last) return;
  const my = ++playing;
  if (RM.matches) { revealed = 7; tl.update({ items: stageItems(last) }); guide({ type: 'bang' }); return; }
  revealed = 0; tl.update({ items: stageItems(last) });
  const step = () => { if (my !== playing) return; revealed++; tl.update({ items: stageItems(last), active: U.ORDER[revealed - 1] }); if (revealed < 7) setTimeout(step, 280); else guide({ type: 'bang' }); };
  setTimeout(step, 200);
});

function relabel() {
  L = i18n(DICT); L.apply(document);
  $('lang').textContent = L.lang === 'en' ? '中' : 'EN'; $('lang').setAttribute('aria-label', L.lang === 'en' ? '中文' : 'English');
  ask.update({ title: L.t('ask'), summary: L.t('askSub'), more: L.two('ask').more });
  KNOBS.forEach((k) => k.sl.update({ label: L.t(k.key) }));
  ADVS.forEach((k) => k.sl.update({ label: L.t(NAME[k.key]) }));
  dials.forEach((d) => d.ui.update({ label: L.t(NAME[d.key]), marks: d.marks() }));
  seg.update({ items: [{ id: 'basic', label: L.t('mBasic') }, { id: 'adv', label: L.t('mAdv') }, { id: 'make', label: L.t('mMake') }], label: L.t('mode') });
  up.update({ label: L.t('imp'), hint: L.t('impHint') }); paintMake();
  Object.entries(lockUI).forEach(([k, u]) => u.update({ label: L.t('lock', { k: L.t(NAME[k]) }) }));
  stack.update({ cards: cardList(), labels: { prev: L.t('prev'), next: L.t('next'), flip: L.t('flip'), try: L.t('tryIt'), of: L.t('of') } });
  if (last) gaugeUI.update({ value: last.cosmos.Om, label: L.t('gauge'), lineLabel: L.t('crit') });
  lockNote = ''; paintLockNote();
  $('help').setAttribute('aria-label', L.t('help'));
  paintQ(); if (last) { tl.update({ items: stageItems(last) }); paintStats(last, lastDesc); }
  paintStage(pickedStage); paintGuide();
}
relabel();
await refresh(store.get());
await loadSky();
paintGuide();

/* SW:作用域 /nomoverse/(与 2.0 共用同一 SW);?nosw=1 注销 */
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  if (/[?&]nosw=1\b/.test(location.search)) navigator.serviceWorker.getRegistrations().then((rs) => rs.forEach((r) => r.scope.endsWith('/nomoverse/') && r.unregister()));
  else navigator.serviceWorker.register('/nomoverse/sw.js', { scope: '/nomoverse/' }).catch(() => {});
}

/* 自测钩子:window.__nv3 / window.__gn3.nv(?selftest=1) */
registerSelftest({
  ready: () => Promise.resolve(true),
  run: async (preset) => {
    const r = U.run(preset || {});
    const e = await encodeUniverse(r, {}, G0);
    return { status: r.status, failures: r.failures, stages: r.stages, gusLen: e.len, gusFits: e.fits, ageGyr: r.cosmos.ageGyr };
  },
  scene: (preset) => SC.describe(preset ? U.run(preset) : last, tier.budget()),
  set: (recipe) => store.set(U.normalize(recipe)),
  /* 仅自测:绕过「软件渲染强制 low」,验证 high/medium 渲染路径(透射玻璃、粒子量)不报错 */
  forceTier: async (t) => { tier.set(t); tier.apply(t); view && view.setTier(t, tier.budget(t)); await loadSky(); paintQ(); await refresh(store.get()); return tier.current(); },
  view: () => ({ webgl: !!view, worker: usingWorker(), ...(view ? view.snapshot() : {}), desc: lastDesc && { status: lastDesc.status, fail: lastDesc.failVisual && lastDesc.failVisual.code, planets: lastDesc.planets.length } }),
  guide: (ev) => { if (ev === 'start') { gStep = 0; paintGuide(); } else if (ev) guide(ev); return gStep; },
  card: () => ({ title: $('fail').querySelector('.gn3-exp-t').textContent, open: $('fail').classList.contains('is-open'), real: FB.a.textContent, yours: FB.b.textContent }),
  snap: (v) => snap1(v),
  state: () => store.get(),
  tier: () => tier.current(),
  fps: () => fps0,
  info: () => ({ tierInfo, last }),
  /* 3-4 探索层 */
  mode: (m) => { if (m) { seg.update({ value: m }); setMode(m, false); } return mode; },
  lock: (keys) => { if (keys) { locks = new Set(keys); Object.entries(lockUI).forEach(([k, u]) => u.update({ checked: locks.has(k) })); } return [...locks]; },
  random: () => { store.set((s) => U.normalize(X.randomRecipe(s, locks, Math.random))); return store.get(); },
  tryCard: (id) => { stack.show(id); stack.flip(); $('stack').querySelector('.nv-card.is-top .nv-card-try').click(); return store.get(); },
  explore: () => ({ mode, locks: [...locks], top: stack.top, flipped: stack.flipped, flap: $('flap').textContent.slice(0, 10), gauge: $('gauge').dataset.side,
    dials: dials.map((d) => ({ key: d.key, v: d.ui.value, aria: $('k-' + d.key).querySelector('[role=slider]').getAttribute('aria-valuetext') })), lockNote }),
  /* 3-5 造物层 */
  make: async () => { await new Promise((r) => setTimeout(r, 400)); return { mode, name: curName(), shown: PC.name.querySelector('.nv-dec-v').textContent, line: PC.line.textContent, stats: last && C.cardStats(last, lastDesc), orbit: orbitInfo, frame: orb.frame, msg: $('mk-msg').textContent, up: $('upload').textContent.slice(0, 80), foot: PC.foot.textContent }; },
  name: (n) => { nmIn.value = n; nmIn.dispatchEvent(new Event('input')); nmIn.dispatchEvent(new Event('change')); return curName(); },
  share: async () => { const s = await shareUrl(); return { ...s, len: s.url.length }; },
  exportText: async () => (await exportText()).text,
  importText: (t) => importText(t),
  last: () => { const g = gus.loadLast(); return g && { id: g.id, name: g.name }; }
});
