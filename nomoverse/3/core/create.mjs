/* 宙律 Nomoverse 3.0 · 造物层纯函数 core/create.mjs(3-5,零 DOM,node 可测)
 * 宇宙命名、作品卡数值、导出/导入 JSON、分享链接选择、Decrypted Text 帧、T7 轨道画布坐标。
 * GUS 导出格式保持 α5 现状(core/gus0.js toGUS + /shared/3/gus.js 编码),本文件不改字段。 */

/* ---------- 命名 ---------- */
export const NAME_MAX = 40;
export function cleanName(s) {
  return String(s == null ? '' : s).replace(/[\u0000-\u001f\u007f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, NAME_MAX);
}
/* 默认名:由种子确定(同种子同名),中英各一,不含失败与否 */
const ZH_A = ['静', '远', '赤', '霜', '鸣', '澜', '曜', '渊', '岚', '烬', '朔', '溟', '琥', '翡', '昙', '星'];
const ZH_B = ['海', '原', '湾', '岭', '庭', '渚', '野', '川', '泽', '岬', '林', '谷', '屿', '湖', '坞', '垣'];
const EN_A = ['Quiet', 'Far', 'Crimson', 'Frost', 'Singing', 'Tidal', 'Bright', 'Deep', 'Misty', 'Ember', 'New', 'Dark', 'Amber', 'Jade', 'Night', 'Star'];
const EN_B = ['Sea', 'Plain', 'Bay', 'Ridge', 'Court', 'Shoal', 'Wild', 'River', 'Marsh', 'Cape', 'Wood', 'Vale', 'Isle', 'Lake', 'Dock', 'Wall'];
export function defaultName(seed) {
  const s = seed >>> 0, a = s & 15, b = (s >>> 4) & 15, n = (s >>> 8) % 100;
  return { zh: ZH_A[a] + ZH_B[b] + '宇宙 ' + String(n).padStart(2, '0'), en: EN_A[a] + ' ' + EN_B[b] + ' Universe ' + String(n).padStart(2, '0') };
}
/* 用户输入一个名字:两种语言都用它(不机翻);空则回默认 */
export function nameFor(input, seed) {
  const c = cleanName(input);
  return c ? { zh: c, en: c } : defaultName(seed);
}

/* ---------- 作品卡 ---------- */
/* res = universe.run();desc 可选(scene.describe),有则行星数以画面为准(上游失败时为 0) */
export function cardStats(res, desc) {
  const pl = desc ? desc.planets : (res.stages.T5 === 'fail' || res.stages.T6 === 'fail' ? [] : res.planets);
  const lit = desc ? !!desc.star.lit : res.stages.T5 !== 'fail';
  return {
    status: res.status, fate: res.cosmos.fate,
    ageGyr: res.cosmos.ageGyr == null ? null : +res.cosmos.ageGyr.toFixed(2),
    planets: pl.length, hab: pl.filter((p) => p.habitable).length,
    teffK: lit ? Math.round(res.star.teff) : 0,
    stagesPassed: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].filter((t) => res.stages[t] !== 'fail').length
  };
}
/* 作品卡标题(状态一句) */
export const STATUS_LINE = {
  ok: { zh: '走到了有行星的那一天', en: 'Made it to planets' },
  warn: { zh: '走到了,但很勉强', en: 'Made it, barely' },
  fail: { zh: '没走到最后', en: 'Did not make it' }
};

/* ---------- 导出 / 导入 JSON ---------- */
export const IMPORT_MAX = 65536;   // 64 KB:GUS 实测 < 6 KB
export const fileName = (g) => 'nomoverse-' + String((g && g.id) || 'universe').replace(/[^a-z0-9-]/gi, '').slice(0, 24) + '.gus.json';
export const toJSONText = (g) => JSON.stringify(g, null, 2) + '\n';
/* text → { ok, g } | { ok:false, err };validate 为 /shared/3/gus.js validate(抛 GusError) */
export function parseImport(text, validate) {
  if (typeof text !== 'string' || !text.trim()) return { ok: false, err: 'empty' };
  if (text.length > IMPORT_MAX) return { ok: false, err: 'too_big' };
  let o;
  try { o = JSON.parse(text.replace(/^\uFEFF/, '')); } catch (e) { return { ok: false, err: 'bad_json' }; }
  if (o && typeof o === 'object' && !o.gus && o.data && o.data.gus) o = o.data;   // 兼容 {data: gus} 包一层
  let g;
  try { g = validate(o); } catch (e) { return { ok: false, err: 'not_gus', detail: e && e.code }; }
  if (!g || g.kind !== 'universe') return { ok: false, err: 'not_universe' };
  if (!g.constants || !g.constants.G) return { ok: false, err: 'no_constants' };
  return { ok: true, g };
}
export const IMPORT_MSG = {
  ok: { zh: '已载入:{n}', en: 'Loaded: {n}' },
  empty: { zh: '文件是空的', en: 'The file is empty' },
  too_big: { zh: '文件太大(上限 64 KB)', en: 'File too large (64 KB max)' },
  bad_json: { zh: '不是 JSON 文件', en: 'Not a JSON file' },
  not_gus: { zh: '不是 GUS 宇宙档案', en: 'Not a GUS universe file' },
  not_universe: { zh: '这是 GUS,但不是宇宙(可能来自别的世界)', en: 'A GUS file, but not a universe' },
  no_constants: { zh: '档案里缺常数', en: 'The file has no constants' }
};

/* ---------- 分享链接 ---------- */
/* 编码串 ≤ URL_MAX 用 ?gus=(含名字与恒星系);超长退回 ?r= 紧凑配方(名字放 &n=) */
export function shareKind(len, urlMax) { return len <= urlMax ? 'gus' : 'r'; }

/* ---------- Decrypted Text(React Bits 思路):逐位从乱码揭到目标 ---------- */
export const SCRAMBLE = 'ΛΩαεπΣΦΨ∂∞≈01234789#*+';
/* 第 f 帧(0..steps):前 floor(len*f/steps) 位已揭示,其余位为乱码(空格保留);rnd ∈ [0,1) */
export function decryptFrame(target, f, steps, rnd, cs = SCRAMBLE) {
  const a = [...target], k = steps <= 0 ? a.length : Math.floor(a.length * Math.min(1, f / steps));
  return a.map((c, i) => (i < k || c === ' ' ? c : cs[Math.floor(rnd() * cs.length) % cs.length])).join('');
}

/* ---------- T7 轨道画布:半径开方压缩(教学简化),保留方向 ---------- */
/* x,y(AU,质心系) → 画布像素;R 画布半径(像素),rMax 最外远日点 AU */
export function project(x, y, rMax, R) {
  const r = Math.hypot(x, y); if (!r || !rMax) return [0, 0];
  const k = R * Math.sqrt(Math.min(1, r / rMax)) / r;
  return [x * k, y * k];
}
/* 行星画半径(像素):按质量开三次方,1–4.5 px */
export const dotR = (massEarth) => Math.max(1.2, Math.min(4.5, 1.6 * Math.cbrt(Math.max(0.01, massEarth))));
