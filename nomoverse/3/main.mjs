/* 宙律 Nomoverse 3.0 · 入口骨架(3-1):画质、语言、状态/撤销/URL、GUS、自测钩子全部接到 /shared/3/。
 * 界面与组件 3-3 起再做;这里只显示 7 关结果一行,证明链路通。 */
import { tier, createRecipeStore, i18n, encodeUniverse, decodeToRecipe, recipeFromGus, registerSelftest, gus } from './core/adapt.mjs';

const U = window.NV3_UNIVERSE, G0 = window.NV3_GUS, SC = window.NV3_SCENE;
const DICT = {
  title: { zh: '宙律 3.0 · 造一个宇宙', en: 'Nomoverse 3.0 · Build a Universe' },
  wip: { zh: '建造中。配方台界面正在做,先用下面这行看看你的宇宙走完 7 关。', en: 'Under construction. The recipe bench is on its way; meanwhile, here is how your universe does across the 7 stages.' },
  loading: { zh: '计算中…', en: 'Computing…' },
  back2: { zh: '回到宙律 2.0 · 改律·玻璃宇宙', en: 'Back to Nomoverse 2.0 · Glass Cosmos' },
  ok: { zh: '走到了有行星的那一天', en: 'It made it to planets' },
  warn: { zh: '走到了,但很勉强', en: 'It made it, barely' },
  fail: { zh: '这个宇宙没走到最后', en: 'This universe did not make it' }
};
const L = i18n(DICT);
document.documentElement.lang = L.lang === 'en' ? 'en' : 'zh-CN';
L.apply(document);

const tierInfo = tier.pickTier();
tier.set(tierInfo.tier);
let fps = 60;
tier.watchFPS((t, f) => { fps = f; });

/* 状态:配方 + 撤销 + URL(?r=);?gus= 优先 */
const store = createRecipeStore(U);   // ?r= 由 shared store 读写
const gq = new URLSearchParams(location.search).get('gus');
if (gq) {
  try { const g = gq === '@last' ? gus.loadLast() : await gus.decode(gq); if (g && g.kind === 'universe') store.reset(recipeFromGus(g).recipe); }
  catch (e) { /* 坏 GUS 忽略,用默认配方 */ }
}
store.bindKeys();

let last = null;
function render(s) {
  last = U.run(s);
  document.getElementById('summary').textContent = L.t(last.status);
  const box = document.getElementById('stages');
  box.textContent = '';
  U.ORDER.forEach((t) => {
    const el = document.createElement('span');
    el.setAttribute('role', 'listitem');
    el.className = last.stages[t];
    el.textContent = t;
    el.setAttribute('aria-label', t + ' ' + last.stages[t]);
    box.appendChild(el);
  });
}
store.subscribe(render);
render(store.get());


/* 自测钩子:window.__nv3 / window.__gn3.nv(?selftest=1) */
registerSelftest({
  ready: () => Promise.resolve(true),
  run: async (preset) => {
    const r = U.run(preset || {});
    const e = await encodeUniverse(r, {}, G0);
    return { status: r.status, failures: r.failures, stages: r.stages, gusLen: e.len, gusFits: e.fits, ageGyr: r.cosmos.ageGyr };
  },
  scene: (preset) => SC.describe(preset ? U.run(preset) : last, tier.budget()),
  state: () => store.get(),
  tier: () => tier.current(),
  fps: () => fps,
  info: () => ({ tierInfo, last })
});
