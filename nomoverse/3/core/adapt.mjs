/* 宙律 Nomoverse 3.0 · /shared/3/ 薄适配层(3-1 接口部分)
 * 只引用 /shared/3/,不复制、不修改。把宙律需要而 /shared/3/ v0.1 还没有的接口在这里补齐,
 * 待 /shared/3/ v0.2 提供后逐个删掉本层对应函数。浏览器与 node(createRequire 加载模型)都能用。
 * 依赖:全局或传入的 NV3_UNIVERSE / NV3_GUS(classic script 已挂到 window)。 */
import * as gus from '/shared/3/gus.js';
import * as tierMod from '/shared/3/tier.js';
import { createUndo } from '/shared/3/undo.js';
import { lang, makeT } from '/shared/3/i18n.js';
import { mulberry32 } from '/shared/3/prng.js';
import { register } from '/shared/3/selftest.js';

export { gus, tierMod, lang, mulberry32 };

/* ---------- GUS:数值层(core/gus0.js)+ 编码统一走 /shared/3/gus.js ---------- */
/* 缺口 G1:shared validate 丢弃 k ≤ 0 的常数(Λ 可为 0 或负)。宙律自身复现用本地 gus0 字段兜底。 */
export function negotiate(obj) {
  try { gus.validate(obj); return { ok: true }; }
  catch (e) { return { ok: false, reason: e.code === 'major_mismatch' ? 'major' : 'invalid', code: e.code || 'bad' }; }
}
export async function encodeUniverse(res, meta, G0) {
  const g = G0.toGUS(res, meta);
  const local = G0.validate(g);
  if (!local.ok) throw new Error('gus0_invalid: ' + local.errors.join(','));
  const s = await gus.encode(g);
  return { gus: g, str: s, len: s.length, fits: s.length <= gus.URL_MAX };
}
/* 解码 → 配方。shared 清洗后 Λ 缺失(k ≤ 0)时回退为 kL = 0 并标 lossy */
export async function decodeToRecipe(str, G0) {
  const g = await gus.decode(str);
  const c = g.constants || {};
  const lossy = !c.Lambda;
  const r = {
    kG: c.G && c.G.k, kc: c.c && c.c.k, kA: c.alpha && c.alpha.k, alphaLinked: !!(c.c && c.c.alphaLinked),
    eps: c.epsilon && c.epsilon.si, Q: c.Q && c.Q.si, kL: lossy ? 0 : c.Lambda.k, Om: c.Omega0 && c.Omega0.si, seed: g.seed
  };
  return { recipe: r, gus: g, lossy };
}

/* ---------- 画质:detect / current / set / onChange / budget ---------- */
const BUDGET = {
  high: { particles: 65536, dpr: 2, transmission: true, bloom: true },
  medium: { particles: 16384, dpr: 1.5, transmission: true, bloom: false },
  low: { particles: 4096, dpr: 1, transmission: false, bloom: false }
};
let curTier = 'medium', subs = [];
export const tier = {
  detect(gl) { const r = tierMod.pickTier(gl); curTier = r.tier; tierMod.apply(curTier); return r; },
  current() { return curTier; },
  set(t, { persist = true, why = 'user' } = {}) {
    if (!tierMod.TIERS.includes(t)) return;
    curTier = t; tierMod.apply(t); if (persist) tierMod.save(t);
    subs.forEach((f) => f(t, why));
  },
  onChange(fn) { subs.push(fn); return () => { subs = subs.filter((f) => f !== fn); }; },
  budget(t = curTier) { return Object.assign({}, BUDGET[t] || BUDGET.low); },
  guard() { return new tierMod.FpsGuard(curTier, (t) => tier.set(t, { persist: false, why: 'auto-fps' })); }
};

/* ---------- 状态:createStore(get/set/subscribe + 撤销 + 手势合并 + URL) ---------- */
const URL_KEYS = ['kG', 'kc', 'kA', 'alphaLinked', 'eps', 'Q', 'kL', 'Om', 'seed'];
export function recipeToParam(r) {
  return URL_KEYS.map((k) => (k === 'alphaLinked' ? (r[k] ? 1 : 0) : +(+r[k]).toPrecision(6))).join('_');
}
export function paramToRecipe(s) {
  if (typeof s !== 'string') return null;
  const a = s.split('_');
  if (a.length !== URL_KEYS.length || a.some((x) => !/^-?[0-9.eE+-]+$/.test(x))) return null;
  const r = {};
  URL_KEYS.forEach((k, i) => { r[k] = k === 'alphaLinked' ? a[i] === '1' : Number(a[i]); });
  return r;
}
export function createStore(initial, { urlParam = 'r', normalize = (x) => x, syncUrl = typeof location !== 'undefined' } = {}) {
  let listeners = [];
  const u = createUndo(normalize(initial), { onChange: (s) => { if (syncUrl) writeUrl(s); listeners.forEach((f) => f(s)); } });
  function writeUrl(s) {
    try { const url = new URL(location.href); url.searchParams.set(urlParam, recipeToParam(s)); history.replaceState(null, '', url); } catch (e) {}
  }
  return {
    get: () => u.state,
    set(patch) { u.push(normalize(Object.assign(u.state, patch))); },
    subscribe(fn) { listeners.push(fn); return () => { listeners = listeners.filter((f) => f !== fn); }; },
    undo: () => u.undo(), redo: () => u.redo(),
    canUndo: () => u.canUndo, canRedo: () => u.canRedo,
    beginGesture: () => u.begin(), endGesture: () => u.end(),
    reset: (s) => u.reset(normalize(s)),
    toJSON: () => JSON.stringify(u.state),
    fromJSON(str) { try { u.push(normalize(JSON.parse(str))); return true; } catch (e) { return false; } },
    bindKeys: (t) => u.bindKeys(t),
    fromUrl() { try { return paramToRecipe(new URLSearchParams(location.search).get(urlParam)); } catch (e) { return null; } }
  };
}

/* ---------- i18n:t / two / apply ---------- */
export function i18n(dict, l = lang()) {
  const t = makeT(dict, l);
  return {
    lang: l, t,
    two: (key) => ({ plain: t(key), deep: t.more(key) }),
    apply(root) {
      root.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
      root.querySelectorAll('[data-i18n-aria]').forEach((el) => { el.setAttribute('aria-label', t(el.dataset.i18nAria)); });
      root.querySelectorAll('[data-i18n-title]').forEach((el) => { el.setAttribute('title', t(el.dataset.i18nTitle)); });
    }
  };
}

/* ---------- 自测钩子 ---------- */
export function registerSelftest(api) { return register('nv', api); }
