/* 创世计划 3.0 · GUS 星球互通格式 /shared/3/gus.js v0.1(规格见 02 宙律 3.0 方案 v0.3 §3)
 * encode/decode:JSON → deflate-raw → base64url(不支持 CompressionStream 时用 "j." 前缀的纯 base64url)
 * validate:版本协商 + 数值范围 + 字段清洗;读方绝不执行字段内容,字符串只作 textContent。
 * 存储:localStorage gn:gus:last(最近一个)、gn:gus:lib(最多 20 个)。 */

export const VERSION = '0.1';   // 模块 v0.2:G1 Λ 可为 0/负、G2 derived 白名单扩充、G7 negotiate()
export const MAJOR = 0;
export const URL_MAX = 1800;
const LIB_KEY = 'gn:gus:lib', LAST_KEY = 'gn:gus:last', LIB_MAX = 20;
const KINDS = ['universe', 'system', 'molecule'];

/* ---------- base64url ---------- */
function bytesToB64u(u8) {
  let s = '';
  for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64uToBytes(s) {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  const bin = atob(s), u8 = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  return u8;
}
async function pipe(u8, stream) {
  const out = new Response(new Blob([u8]).stream().pipeThrough(stream));
  return new Uint8Array(await out.arrayBuffer());
}
const hasCS = () => typeof CompressionStream === 'function' && typeof DecompressionStream === 'function';

/* ---------- 编码 / 解码 ---------- */
export async function encode(obj, { trim = true } = {}) {
  let o = obj;
  let json = JSON.stringify(o);
  const enc = async (j) => {
    const u8 = new TextEncoder().encode(j);
    if (hasCS()) return bytesToB64u(await pipe(u8, new CompressionStream('deflate-raw')));
    return 'j.' + bytesToB64u(u8);
  };
  let s = await enc(json);
  if (s.length > URL_MAX && trim) {   // 超长:先去 derived.stages 与选读字段
    o = JSON.parse(json);
    if (o.derived) delete o.derived.stages;
    delete o.render; delete o.sources;
    s = await enc(JSON.stringify(o));
  }
  return s;
}

export async function decode(s) {
  if (typeof s !== 'string' || !s) throw new GusError('empty');
  if (s.length > 20000) throw new GusError('too_long');
  let json;
  if (s.startsWith('j.')) json = new TextDecoder().decode(b64uToBytes(s.slice(2)));
  else {
    if (!hasCS()) throw new GusError('no_decompress');
    json = new TextDecoder().decode(await pipe(b64uToBytes(s), new DecompressionStream('deflate-raw')));
  }
  let o;
  try { o = JSON.parse(json); } catch (e) { throw new GusError('bad_json'); }
  return validate(o);
}

/* ---------- 校验与清洗 ---------- */
export class GusError extends Error {
  constructor(code, detail) { super(code + (detail ? ': ' + detail : '')); this.code = code; this.detail = detail || ''; }
}
const num = (v, lo, hi) => typeof v === 'number' && Number.isFinite(v) && v >= lo && v <= hi;
const str = (v, max = 40) => (typeof v === 'string' ? v.slice(0, max) : '');

/* G7 版本协商:不抛错,返回 {ok, version, major, minor, newer, reason} */
export function negotiate(o) {
  const v = String((o && o.gus) || ''), m = /^(\d+)\.(\d+)$/.exec(v);
  if (!m) return { ok: false, version: v, reason: 'no_version' };
  const major = +m[1], minor = +m[2], [, mi] = VERSION.split('.').map(Number);
  if (major !== MAJOR) return { ok: false, version: v, major, minor, reason: 'major_mismatch' };
  return { ok: true, version: v, major, minor, newer: minor > mi };
}

export function validate(o) {
  if (!o || typeof o !== 'object') throw new GusError('not_object');
  const v = String(o.gus || '');
  const m = /^(\d+)\.(\d+)$/.exec(v);
  if (!m) throw new GusError('no_version');
  if (+m[1] !== MAJOR) throw new GusError('major_mismatch', v);   // 次版本更高:照常读,忽略未知字段
  if (!KINDS.includes(o.kind)) throw new GusError('bad_kind', String(o.kind));
  const out = { gus: v, kind: o.kind, id: str(o.id, 64), seed: num(o.seed, 0, 4294967295) ? o.seed >>> 0 : 0 };
  out.name = { zh: str(o.name && o.name.zh), en: str(o.name && o.name.en) };
  if (o.generator) out.generator = { world: str(o.generator.world, 8), app: str(o.generator.app, 40), model: str(o.generator.model, 40) };
  if (o.created) out.created = str(o.created, 40);
  if (o.constants && typeof o.constants === 'object') {
    out.constants = {};
    for (const k of Object.keys(o.constants).slice(0, 16)) {
      const c = o.constants[k];
      const lo = /^(Lambda|Λ|L)$/.test(k) ? -1e3 : 1e-6;   // G1:Λ 允许 0 与负值(大挤压宇宙)
      if (c && num(c.k, lo, 1e6)) out.constants[k.slice(0, 16)] = { k: c.k, si: num(c.si, -1e300, 1e300) ? c.si : undefined, unit: str(c.unit, 24), alphaLinked: !!c.alphaLinked };
    }
  }
  if (o.derived && typeof o.derived === 'object') {
    const d = o.derived;
    out.derived = {
      status: ['ok', 'warn', 'fail'].includes(d.status) ? d.status : 'ok',
      failures: Array.isArray(d.failures) ? d.failures.slice(0, 16).map((x) => str(x, 24)) : [],
      fate: ['expand', 'crunch', 'coast'].includes(d.fate) ? d.fate : undefined,
    };
    for (const k of ['age_s', 'starLifeSun_s', 'starLife_s', 'bohrRadius_m', 'hAlpha_m']) if (num(d[k], 0, 1e40)) out.derived[k] = d[k];
    if (d.crunch_s === null) out.derived.crunch_s = null; else if (num(d.crunch_s, 0, 1e40)) out.derived.crunch_s = d.crunch_s;   // G2
    if (num(d.heliumY, 0, 1)) out.derived.heliumY = d.heliumY;
    if (typeof d.habitable === 'boolean') out.derived.habitable = d.habitable;
    out.derived.warnings = Array.isArray(d.warnings) ? d.warnings.slice(0, 16).map((x) => str(x, 24)) : [];
    if (d.stages && typeof d.stages === 'object') { out.derived.stages = {}; for (const k of Object.keys(d.stages).slice(0, 12)) out.derived.stages[k.slice(0, 4)] = str(d.stages[k], 6); }
  }
  if (o.system) {
    const s = o.system, st = s.star || {};
    if (!num(st.mass_kg, 1e28, 1e33) || !num(st.lum_W, 1e18, 1e33) || !num(st.radius_m, 1e3, 1e12)) throw new GusError('star_range');
    out.system = { star: { mass_kg: st.mass_kg, lum_W: st.lum_W, radius_m: st.radius_m, teff_K: num(st.teff_K, 500, 60000) ? st.teff_K : 5772, rgb: rgb(st.rgb) } };
    const ps = Array.isArray(s.planets) ? s.planets : [];
    if (ps.length > 8) throw new GusError('too_many_planets');
    out.system.planets = ps.map((p, i) => {
      if (!num(p.a_m, 1e9, 1e14)) throw new GusError('planet_range', 'a_m#' + i);
      if (!num(p.radius_m, 1e5, 1e9)) throw new GusError('planet_range', 'radius_m#' + i);
      if (!num(p.period_s, 1e3, 1e14)) throw new GusError('planet_range', 'period_s#' + i);
      const q = { id: str(p.id, 12) || 'p' + (i + 1), a_m: p.a_m, e: num(p.e, 0, 0.99) ? p.e : 0, radius_m: p.radius_m, period_s: p.period_s,
        mass_kg: num(p.mass_kg, 1e18, 1e29) ? p.mass_kg : undefined, teq_K: num(p.teq_K, 0, 5000) ? p.teq_K : undefined,
        kind: ['rocky', 'ocean', 'ice', 'gas', 'lava'].includes(p.kind) ? p.kind : 'rocky', habitable: !!p.habitable,
        phase0_rad: num(p.phase0_rad, -10, 10) ? p.phase0_rad : 0 };
      if (Array.isArray(p.atmosphere)) q.atmosphere = p.atmosphere.slice(0, 12).filter((a) => a && num(a.frac, 0, 1)).map((a) => ({ ef: str(a.ef, 24), frac: a.frac }));
      return q;
    });
  }
  if (o.render) out.render = { skyTint: rgb(o.render.skyTint), starDensity: num(o.render.starDensity, 0, 4) ? o.render.starDensity : 1, nebula: num(o.render.nebula, 0, 1) ? o.render.nebula : 0.4, quality: ['auto', 'high', 'medium', 'low'].includes(o.render.quality) ? o.render.quality : 'auto' };
  out.simplified = o.simplified !== false;
  if (typeof o.sources === 'string' && /^https:\/\/kevin8634\.github\.io\//.test(o.sources)) out.sources = o.sources.slice(0, 200);
  return out;
}
function rgb(a) { return Array.isArray(a) && a.length === 3 && a.every((x) => num(x, 0, 1)) ? a.slice() : [1, 1, 1]; }

/* ---------- 同源存储 ---------- */
export function saveLast(obj) {
  try {
    localStorage.setItem(LAST_KEY, JSON.stringify(obj));
    const lib = loadLib().filter((x) => x.id !== obj.id);
    lib.unshift(obj);
    localStorage.setItem(LIB_KEY, JSON.stringify(lib.slice(0, LIB_MAX)));
    return true;
  } catch (e) { return false; }
}
export function loadLast() { try { const s = localStorage.getItem(LAST_KEY); return s ? validate(JSON.parse(s)) : null; } catch (e) { return null; } }
export function loadLib() { try { const a = JSON.parse(localStorage.getItem(LIB_KEY) || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; } }

/* ---------- URL ---------- */
/* 读当前页 ?gus=…(或 ?gus=@last);失败返回 {error} 不抛 */
export async function fromLocation(param = 'gus') {
  const v = new URLSearchParams(location.search).get(param);
  if (!v) return null;
  try { return v === '@last' ? loadLast() : await decode(v); }
  catch (e) { return { error: e.code || 'bad' }; }
}
export async function toUrl(obj, base, param = 'gus') {
  const u = new URL(base, location.href);
  u.searchParams.set(param, await encode(obj));
  return u.toString();
}
