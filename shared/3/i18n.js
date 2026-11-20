/* 创世计划 3.0 · 中英 /shared/3/i18n.js v0.1
 * 语言:window.GN_LANG > localStorage gn:lang(全站共用)> navigator。
 * 词条:各世界自带字典 {key: {zh, en}} 或两层文本 {key: {zh, en, zhMore, enMore}}(直白一句 + 展开)。
 * 数字/单位格式化:科学计数统一写法,倍数 ×0.5,读屏文案。 */
export function lang() {
  try {
    if (typeof window !== 'undefined' && (window.GN_LANG === 'en' || window.GN_LANG === 'zh')) return window.GN_LANG;
    const s = localStorage.getItem('gn:lang');
    if (s === 'en' || s === 'zh') return s;
  } catch (e) {}
  return typeof navigator !== 'undefined' && /^zh/i.test(navigator.language || '') ? 'zh' : 'en';
}
export function setLang(l) { try { localStorage.setItem('gn:lang', l); } catch (e) {} if (typeof window !== 'undefined') window.GN_LANG = l; }

export function makeT(dict, l = lang()) {
  const t = (key, vars) => {
    const e = dict[key];
    let s = e ? (e[l] != null ? e[l] : e.zh) : key;
    if (vars) s = s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] != null ? vars[k] : ''));
    return s;
  };
  t.more = (key) => { const e = dict[key]; return e ? (l === 'en' ? e.enMore : e.zhMore) || '' : ''; };
  t.lang = l;
  return t;
}

const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
/* 3.3e-11 → "3.3×10⁻¹¹";|x| 在 [0.01, 1e5) 内用普通写法 */
export function sci(x, digits = 2) {
  if (!Number.isFinite(x)) return '—';
  if (x === 0) return '0';
  const a = Math.abs(x);
  if (a >= 0.01 && a < 1e5) return String(+x.toPrecision(digits + 1));
  const e = Math.floor(Math.log10(a)), m = x / Math.pow(10, e);
  return (+m.toFixed(digits)) + '×10' + String(e).split('').map((c) => SUP[c]).join('');
}
/* 倍数:0.5 → "×0.5",1 → "×1" */
export function mult(k) { return '×' + (+k.toPrecision(3)); }
/* 本地化整数/小数 */
export function fmt(x, l = lang(), opts) { try { return new Intl.NumberFormat(l === 'en' ? 'en-US' : 'zh-CN', opts).format(x); } catch (e) { return String(x); } }
/* 读屏:把 ×10⁻¹¹ 写成文字 */
export function aria(x, l = lang()) {
  const s = sci(x);
  return s.replace(/×10([⁻⁰¹²³⁴⁵⁶⁷⁸⁹]+)/, (_, p) => {
    const n = p.split('').map((c) => Object.keys(SUP).find((k) => SUP[k] === c)).join('');
    return l === 'en' ? ' times ten to the ' + n : ' 乘以十的 ' + n + ' 次方';
  });
}
