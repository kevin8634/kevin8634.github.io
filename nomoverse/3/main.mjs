/* 宙律 Nomoverse 3.0 · 宇宙配方台入口(3-2:Worker + three r186 渲染层 + /shared/3/ui.js 界面)
 * 数据流:store(配方)→ Worker run → desc(scene.describe)→ 渲染层 update(desc);界面数字读 res,画面只读 desc。
 * 新手层 3 旋钮 G、c、α;探索层与题卡 3-4 起。 */
import { tier, createRecipeStore, i18n, encodeUniverse, recipeFromGus, registerSelftest, gus } from './core/adapt.mjs';
import { setLang } from '/shared/3/i18n.js';
import * as ui from '/shared/3/ui.js';
import { call, runLatest, usingWorker } from './core/wclient.mjs';

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
  T5: { zh: '点燃', en: 'Ignition' }, T6: { zh: '行星', en: 'Planets' }, T7: { zh: '恒星系', en: 'System' },
  failAt: { zh: '卡在第 {n} 关 · {t}', en: 'Stuck at stage {n} · {t}' },
  simp: { zh: '教学简化:轨道半径对数压缩、行星放大显示;真实数值见右侧。', en: 'Teaching simplification: orbits log-compressed, planets enlarged; real values on the right.' },
  qhigh: { zh: '高', en: 'Hi' }, qmedium: { zh: '中', en: 'Mid' }, qlow: { zh: '低', en: 'Lo' },
  qdrop: { zh: '帧率偏低,已自动降到{q}档', en: 'Low frame rate, switched to {q}' }
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
if (gq) {
  try { const g = gq === '@last' ? gus.loadLast() : await gus.decode(gq); if (g && g.kind === 'universe') store.reset(recipeFromGus(g).recipe); }
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
    onInput: (v) => store.set((s) => ({ ...s, [k.key]: v }))
  });
});
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
const tl = ui.timeline.mount($('tl'), { items: U.ORDER.map((t) => ({ id: t, title: L.t(t), state: 'todo' })) });
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
  const fv = desc.failVisual;
  if (fv) {
    const n = +fv.stage.slice(1), note = L.lang === 'en' ? FAIL_NOTE_EN[fv.code] : fv.note;
    const o = { title: L.t('failAt', { n, t: L.t(fv.stage) }), summary: note, more: '' };
    failCard ? failCard.update(o) : (failCard = ui.expandableCard.mount($('fail'), o));
    $('fail').hidden = false; $('fail').style.setProperty('--fv', fv.palette[0]);
  } else { $('fail').hidden = true; }
}

/* 后果指示:每个旋钮沿其范围 24 点的「通过关数」迷你图 + 当前位置 */
async function paintSparks(s) {
  for (const k of KNOBS) {
    const pts = await call('sweep', { recipe: s, key: k.key, n: 24 });
    const [lo, hi] = U.RANGE[k.key], x = (v) => (Math.log(v / lo) / Math.log(hi / lo)) * 100, y = (p) => 26 - (p / 7) * 24;
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
  KNOBS.forEach((k) => { if (Math.abs(k.sl.value - s[k.key]) > 1e-12) k.sl.update({ value: s[k.key] }); });
  $('undo').disabled = !store.canUndo; $('redo').disabled = !store.canRedo;
  clearTimeout(refresh.t); refresh.t = setTimeout(() => paintSparks(s), 120);
}
store.subscribe(refresh);

/* 大爆炸:逐关揭示(每关 ≤300ms;减少动态时一次给出) */
$('bang').addEventListener('click', () => {
  if (!last) return;
  const my = ++playing;
  if (RM.matches) { revealed = 7; tl.update({ items: stageItems(last) }); return; }
  revealed = 0; tl.update({ items: stageItems(last) });
  const step = () => { if (my !== playing) return; revealed++; tl.update({ items: stageItems(last), active: U.ORDER[revealed - 1] }); if (revealed < 7) setTimeout(step, 280); };
  setTimeout(step, 200);
});

function relabel() {
  L = i18n(DICT); L.apply(document);
  $('lang').textContent = L.lang === 'en' ? '中' : 'EN'; $('lang').setAttribute('aria-label', L.lang === 'en' ? '中文' : 'English');
  ask.update({ title: L.t('ask'), summary: L.t('askSub'), more: L.two('ask').more });
  KNOBS.forEach((k) => k.sl.update({ label: L.t(k.key) }));
  paintQ(); if (last) { tl.update({ items: stageItems(last) }); paintStats(last, lastDesc); }
}
relabel();
await refresh(store.get());
await loadSky();

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
  state: () => store.get(),
  tier: () => tier.current(),
  fps: () => fps0,
  info: () => ({ tierInfo, last })
});
