/* 宙律 Nomoverse 3.0 · /shared/3/ 适配层(v0.2 起只留宙律专用部分)
 * negotiate、tier current/set/onChange/budget/watchFPS、createStore、i18n two/apply 直接用 /shared/3/ v0.2,本层不再垫片。
 * 本层只保留:宇宙配方 ↔ GUS(数值层 core/gus0.js + shared 编码)、配方紧凑 URL 参数 ?r=、宙律自测钩子。 */
import * as gus from '/shared/3/gus.js';
import * as tier from '/shared/3/tier.js';
import { createStore } from '/shared/3/store.js';
import { lang, makeT, two, apply } from '/shared/3/i18n.js';
import { mulberry32 } from '/shared/3/prng.js';
import { register } from '/shared/3/selftest.js';

export { gus, tier, createStore, lang, makeT, two, apply, mulberry32 };
export const negotiate = gus.negotiate;

/* ---------- 宇宙 ↔ GUS ---------- */
export async function encodeUniverse(res, meta, G0) {
  const g = G0.toGUS(res, meta);
  const local = G0.validate(g);
  if (!local.ok) throw new Error('gus0_invalid: ' + local.errors.join(','));
  const s = await gus.encode(g);
  return { gus: g, str: s, len: s.length, fits: s.length <= gus.URL_MAX };
}
/* 解码 → 配方;常数缺失时标 lossy(v0.2 起 Λ=0/负值已保留) */
export async function decodeToRecipe(str, G0) {
  const g = await gus.decode(str);
  return recipeFromGus(g);
}
export function recipeFromGus(g) {
  const c = g.constants || {};
  const lossy = !c.Lambda || !c.G || !c.alpha;
  const r = {
    kG: c.G && c.G.k, kc: c.c && c.c.k, kA: c.alpha && c.alpha.k, alphaLinked: !!(c.c && c.c.alphaLinked),
    eps: c.epsilon && c.epsilon.si, Q: c.Q && c.Q.si, kL: c.Lambda ? c.Lambda.k : 0, Om: c.Omega0 && c.Omega0.si, seed: g.seed
  };
  return { recipe: r, gus: g, lossy };
}

/* ---------- 配方紧凑 URL 参数(给 shared createStore 的 encode/decode)---------- */
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
/* 宙律配方仓库:shared createStore + ?r= 紧凑参数 */
export function createRecipeStore(U, opts = {}) {
  return createStore(U.normalize({}), Object.assign({ urlParam: 'r', normalize: U.normalize, encode: recipeToParam, decode: (v) => { const r = paramToRecipe(v); if (!r) throw new Error('bad_r'); return r; } }, opts));
}

/* 宙律字典的 t + two 简写 */
export function i18n(dict, l = lang()) {
  const t = makeT(dict, l);
  return { lang: l, t, two: (key) => two(dict[key], l), apply: (root) => apply(root, t) };
}

/* ---------- 自测钩子 ---------- */
export function registerSelftest(api) { return register('nv', api); }
