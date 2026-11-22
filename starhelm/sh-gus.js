/* 天枢 Starhelm · sh-gus.js · GUS 接收端(v1.0-M4u)
 * 宙律 3.0「星桥」跳到 /starhelm/?gus=… 时,在天枢里打开「来自宙律的恒星系」浮层。
 * 链接格式(以 /shared/3/gus.js v0.1 与 nomoverse/3/core/gus0.js 为准):
 *   ?gus=<base64url(deflate-raw(JSON))>   浏览器支持 CompressionStream 时宙律默认用这种(无前缀)
 *   ?gus=j.<base64url(UTF-8 JSON)>        无压缩回退(gus0.js encodeJ / shared 回退)
 *   ?gus=@last                            链接超长时宙律改写这个,读同源 localStorage 'gn:gus:last'
 *   (无参数)从 /nomoverse/ 跳来且本机有 gn:gus:last 时也打开(可选兜底)
 * 原则:原生 JS、零依赖、零外部请求;读方严格校验,越界即拒收;用户字符串只走 textContent,绝不 innerHTML;
 * 任何失败只给中文友好提示,不抛错、不影响天枢原有界面。不带 gus 时本文件什么都不做。
 * API:window.SHGUS = { active, open(), close(), parse(str) }
 */
(function () {
  'use strict';
  var LAST_KEY = 'gn:gus:last', MAX_STR = 20000, MAX_JSON = 262144, MAX_PLANETS = 12;
  var MSUN = 1.98847e30, LSUN = 3.828e26, RSUN = 6.957e8, REARTH = 6.371e6, AU = 1.495978707e11, DAY = 86400, YEAR = 365.25 * 86400;
  var NV_HOME = '/nomoverse/3/';

  /* ---------- 判断是否需要接收 ---------- */
  var qs = new URLSearchParams(location.search), raw = qs.get('gus');
  var fromNv = false;
  try { fromNv = !raw && !!document.referrer && new URL(document.referrer).origin === location.origin && /^\/nomoverse\//.test(new URL(document.referrer).pathname) && !!localStorage.getItem(LAST_KEY); } catch (e) { fromNv = false; }
  var S = window.SHGUS = { active: raw !== null || fromNv, open: open, close: close, parse: parse, data: null };
  if (!S.active) return;   // 不带 gus:天枢原行为完全不变

  /* ---------- 文案(中英;默认中文,跟随全站 gn:lang / GN_LANG 显式选了英文时用英文) ---------- */
  var T = {
    kicker: ['星桥 · 来自宙律的恒星系', 'Star Bridge · a star system from Nomoverse'],
    unnamed: ['未命名宇宙', 'Unnamed universe'],
    star: ['恒星', 'Star'], teff: ['表面温度', 'Surface temp.'], lum: ['光度', 'Luminosity'], mass: ['质量', 'Mass'], rad: ['半径', 'Radius'],
    planets: ['行星', 'Planets'], hab: ['宜居带内', 'In habitable zone'], outcome: ['宇宙结局', 'Universe outcome'],
    st_ok: ['走到了有行星的那一天', 'Made it to planets'], st_warn: ['走到了,但很勉强', 'Made it, barely'], st_fail: ['没走到最后', 'Did not make it'],
    noPlanets: ['这颗恒星身边没有形成行星。', 'No planets formed around this star.'],
    noSystem: ['这个宇宙没有留下恒星系,只能看看它的常数与结局。', 'This universe left no star system to show.'],
    simple: ['简化模型', 'Simplified model'],
    simpleNote: ['宙律用标度律与阈值推算的教学简化结果,不是真实恒星演化模拟;轨道半径按对数缩放,公转快慢按周期相对比例。', 'Teaching simplification from scaling laws and thresholds, not a stellar-evolution simulation. Orbit radii are log-scaled; speeds follow relative periods.'],
    sources: ['出处与阈值说明', 'Sources & thresholds'],
    back: ['← 回宙律', '← Back to Nomoverse'], enter: ['关闭,进入天枢', 'Close & enter Starhelm'],
    lang: ['EN', '中'], langAria: ['切换为英文', 'Switch to Chinese'],
    canvasAria: ['恒星系示意图:中央恒星与行星椭圆轨道,绿色为宜居带行星', 'Diagram: the star and elliptical planet orbits; green planets are in the habitable zone'],
    habMark: ['宜居', 'habitable'], rocky: ['岩质', 'rocky'], gas: ['气态', 'gas giant'], ocean: ['海洋', 'ocean'], ice: ['冰质', 'icy'], lava: ['熔岩', 'lava'],
    days: ['天', 'd'], years: ['年', 'yr'], legend: ['轨道半径对数缩放 · 绿色 = 宜居带', 'log-scaled orbits · green = habitable zone'],
    staticNote: ['已开启「减少动态」,行星静止显示。', 'Reduced motion is on, planets are shown still.'],
    errTitle: ['这条星桥链接打不开', 'This Star Bridge link could not be opened'],
    errHint: ['可以回宙律重新点一次「星桥」,或者直接进入天枢。', 'Go back to Nomoverse and press Star Bridge again, or just enter Starhelm.'],
    lastNote: ['这台设备不支持解压长链接,已改读你在宙律最近保存的恒星系。', 'This browser cannot decompress the link, so the system you last saved in Nomoverse is shown.'],
    e_empty: ['链接里没有恒星系数据。', 'The link has no star-system data.'],
    e_too_long: ['链接过长,超出安全上限。', 'The link is too long.'],
    e_bad_chars: ['链接里有不认识的字符(可能被截断或改动过)。', 'The link has unexpected characters (truncated or altered).'],
    e_bad_b64: ['链接编码损坏。', 'The link encoding is damaged.'],
    e_no_decompress: ['这台设备的浏览器不支持解压这种链接。', 'This browser cannot decompress this link.'],
    e_bad_json: ['数据解不开,可能被截断了。', 'The data could not be read; it may be truncated.'],
    e_no_last: ['本机没有找到宙律最近保存的恒星系。', 'No recently saved system from Nomoverse on this device.'],
    e_version: ['数据版本太新或不认识,天枢暂时读不了。', 'Unsupported data version.'],
    e_kind: ['这不是一个宇宙(只接收宙律造的宇宙)。', 'This is not a universe.'],
    e_star: ['恒星参数超出合理范围。', 'Star parameters are out of range.'],
    e_planets: ['行星太多或数据不完整。', 'Too many planets or incomplete planet data.'],
    e_planet: ['有行星的轨道参数超出合理范围。', 'A planet orbit is out of range.'],
    e_bad: ['数据不完整。', 'The data is incomplete.']
  };
  var FAIL = {
    crunch: ['宇宙回缩成一点', 'recollapse'], helium_only: ['只剩氦,恒星缺燃料', 'helium only'], hydrogen_only: ['没有氦,核合成卡住', 'hydrogen only'],
    no_atoms: ['留不住电子', 'no atoms'], few_elements: ['只有前几种元素', 'few elements'], cold: ['物质散成冷雾', 'cold fog'],
    bh_soup: ['都塌成黑洞', 'black-hole soup'], no_ignition: ['恒星点不着', 'no ignition'], flash: ['恒星烧得太快', 'stars burn out'],
    orbit_break: ['轨道被扯散', 'orbits torn'], chem_freeze: ['分子造不出来', 'chemistry frozen']
  };
  var L = 0;
  try { L = (window.GN_LANG || localStorage.getItem('gn:lang')) === 'en' ? 1 : 0; } catch (e) { L = 0; }
  function t(k) { var v = T[k]; return v ? v[L] : k; }

  /* ---------- 解码 ---------- */
  function Err(code) { var e = new Error(code); e.code = code; return e; }
  function b64uToBytes(s) {
    var b = s.replace(/-/g, '+').replace(/_/g, '/'); while (b.length % 4) b += '=';
    var bin; try { bin = atob(b); } catch (e) { throw Err('bad_b64'); }
    var u8 = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    return u8;
  }
  function utf8(u8) { try { return new TextDecoder('utf-8', { fatal: true }).decode(u8); } catch (e) { throw Err('bad_json'); } }
  /* deflate-raw 解压:流式读取,超过 MAX_JSON 字节即中止(防解压炸弹) */
  function inflate(u8) {
    if (typeof DecompressionStream !== 'function') return Promise.reject(Err('no_decompress'));
    var ds; try { ds = new DecompressionStream('deflate-raw'); } catch (e) { return Promise.reject(Err('no_decompress')); }
    var rd = new Blob([u8]).stream().pipeThrough(ds).getReader(), parts = [], n = 0;
    function pump() {
      return rd.read().then(function (r) {
        if (r.done) { var out = new Uint8Array(n), o = 0; parts.forEach(function (p) { out.set(p, o); o += p.length; }); return out; }
        n += r.value.length; if (n > MAX_JSON) { try { rd.cancel(); } catch (e) { } throw Err('too_long'); }
        parts.push(r.value); return pump();
      });
    }
    return pump().catch(function (e) { throw e && e.code ? e : Err('bad_json'); });
  }
  function jsonOf(text) { if (text.length > MAX_JSON) throw Err('too_long'); try { return JSON.parse(text); } catch (e) { throw Err('bad_json'); } }
  function loadLast() {
    var s = null; try { s = localStorage.getItem(LAST_KEY); } catch (e) { s = null; }
    if (!s) throw Err('no_last');
    return jsonOf(s);
  }
  /* 字符串 → Promise<已清洗的对象>;失败 reject { code } */
  function parse(str) {
    return new Promise(function (ok) {
      if (str === '@last') return ok(loadLast());
      if (typeof str !== 'string' || !str) throw Err('empty');
      if (str.length > MAX_STR) throw Err('too_long');
      if (str.slice(0, 2) === 'j.') {
        if (!/^[A-Za-z0-9_-]+$/.test(str.slice(2))) throw Err('bad_chars');
        return ok(jsonOf(utf8(b64uToBytes(str.slice(2)))));
      }
      if (!/^[A-Za-z0-9_-]+$/.test(str)) throw Err('bad_chars');
      ok(inflate(b64uToBytes(str)).then(function (u8) { return jsonOf(utf8(u8)); }));
    }).then(validate);
  }

  /* ---------- 严格校验与清洗(只接收 kind=universe;越界即拒收,可选字段越界则丢弃) ---------- */
  function num(v, lo, hi) { return typeof v === 'number' && isFinite(v) && v >= lo && v <= hi; }
  function cleanText(s, max) {   // 去控制字符、尖括号、双向覆盖字符;只作 textContent 使用
    return typeof s === 'string' ? s.replace(/[\u0000-\u001f\u007f<>\u202a-\u202e\u2066-\u2069\u200b-\u200f\ufeff]/g, '').replace(/\s+/g, ' ').trim().slice(0, max) : '';
  }
  function token(s, re, max) { return typeof s === 'string' && s.length <= max && re.test(s) ? s : ''; }
  function validate(o) {
    if (!o || typeof o !== 'object' || Array.isArray(o)) throw Err('bad');
    if (!/^0\.\d{1,3}$/.test(String(o.gus || ''))) throw Err('version');
    if (o.kind !== 'universe') throw Err('kind');
    var out = { gus: String(o.gus), kind: 'universe', id: token(o.id, /^[A-Za-z0-9_-]+$/, 64), seed: num(o.seed, 0, 4294967295) ? o.seed >>> 0 : null };
    var nm = o.name && typeof o.name === 'object' ? o.name : {};
    out.name = { zh: cleanText(nm.zh, 40), en: cleanText(nm.en, 40) };
    var d = o.derived && typeof o.derived === 'object' ? o.derived : {};
    out.derived = {
      status: ['ok', 'warn', 'fail'].indexOf(d.status) >= 0 ? d.status : null,
      failures: Array.isArray(d.failures) ? d.failures.slice(0, 16).map(function (x) { return token(x, /^[a-z_]+$/, 24); }).filter(Boolean) : [],
      age_s: num(d.age_s, 0, 1e40) ? d.age_s : null
    };
    var sys = o.system;
    if (sys !== undefined && sys !== null) {
      if (typeof sys !== 'object') throw Err('bad');
      var st = sys.star || {};
      if (!num(st.mass_kg, 1e28, 1e33) || !num(st.lum_W, 1e18, 1e33) || !num(st.radius_m, 1e3, 1e12) || !num(st.teff_K, 500, 100000)) throw Err('star');
      var rgb = Array.isArray(st.rgb) && st.rgb.length === 3 && st.rgb.every(function (x) { return num(x, 0, 1); }) ? st.rgb.slice() : [1, 0.96, 0.9];
      var ps = sys.planets === undefined ? [] : sys.planets;
      if (!Array.isArray(ps) || ps.length > MAX_PLANETS) throw Err('planets');
      out.system = {
        star: { mass_kg: st.mass_kg, lum_W: st.lum_W, radius_m: st.radius_m, teff_K: st.teff_K, rgb: rgb },
        planets: ps.map(function (p, i) {
          if (!p || typeof p !== 'object') throw Err('planets');
          if (!num(p.a_m, 1e9, 1e15) || !num(p.period_s, 1e3, 1e14) || !num(p.radius_m, 1e5, 1e9)) throw Err('planet');
          if (p.e !== undefined && !num(p.e, 0, 0.99)) throw Err('planet');
          return {
            id: token(p.id, /^[A-Za-z0-9_-]+$/, 12) || 'p' + (i + 1), a_m: p.a_m, e: num(p.e, 0, 0.99) ? p.e : 0, radius_m: p.radius_m, period_s: p.period_s,
            mass_kg: num(p.mass_kg, 1e18, 1e29) ? p.mass_kg : null, teq_K: num(p.teq_K, 0, 5000) ? p.teq_K : null,
            kind: ['rocky', 'gas', 'ocean', 'ice', 'lava'].indexOf(p.kind) >= 0 ? p.kind : 'rocky', habitable: p.habitable === true,
            phase0: num(p.phase0_rad, -10, 10) ? p.phase0_rad : 0
          };
        })
      };
    }
    out.simplified = o.simplified !== false;
    // 出处只接受本站链接,并改写成同源路径(本地与线上都能打开,不产生跨站请求)
    out.sourcesPath = '';
    if (typeof o.sources === 'string' && o.sources.length <= 200) {
      var m = /^https:\/\/kevin8634\.github\.io(\/[A-Za-z0-9._~\/-]*)$/.exec(o.sources);
      if (m && m[1].indexOf('..') < 0) out.sourcesPath = m[1];
    }
    return out;
  }

  /* ---------- 样式(静态字符串,不含用户数据) ---------- */
  function css() {
    if (document.getElementById('shg-css')) return;
    var s = document.createElement('style'); s.id = 'shg-css';
    s.textContent =
      '.shg{position:fixed;inset:0;z-index:96;display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;background:radial-gradient(120% 90% at 50% 40%,rgba(14,26,52,.94),rgba(2,4,10,.97) 70%);color:#e8eef8;font-family:"Noto Sans SC","Noto Sans CJK SC","PingFang SC","Microsoft YaHei","WenQuanYi Micro Hei","WenQuanYi Zen Hei",sans-serif;font-size:14px;line-height:1.5}' +
      '.shg *{box-sizing:border-box}' +
      '.shg-card{position:relative;width:min(1080px,100%);max-height:100%;display:grid;grid-template-columns:minmax(0,1.25fr) minmax(280px,1fr);gap:0;background:rgba(8,14,30,.92);border:1px solid rgba(140,180,230,.24);border-radius:14px;overflow:hidden}' +
      '.shg-viz{position:relative;min-height:360px;background:#02040a}' +
      '.shg-cv{position:absolute;inset:0;width:100%;height:100%;display:block}' +
      '.shg-leg{position:absolute;left:10px;bottom:8px;right:10px;font-size:11px;color:#9aa8bf;pointer-events:none}' +
      '.shg-info{padding:18px 18px 14px;overflow:auto;display:flex;flex-direction:column;gap:10px;min-height:0}' +
      '.shg-top{display:flex;align-items:flex-start;gap:8px}' +
      '.shg-k{font-size:12px;color:#7fd6ff;letter-spacing:.5px;flex:1;min-width:0}' +
      '.shg h2{margin:0;font-size:21px;font-weight:normal;color:#f0c97a;overflow-wrap:anywhere}' +
      '.shg-id{font-size:12px;color:#6f7c93;margin-top:-6px;overflow-wrap:anywhere}' +
      '.shg-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}' +
      '.shg-stat{border:1px solid rgba(140,180,230,.18);border-radius:9px;padding:6px 8px;min-width:0}' +
      '.shg-stat small{display:block;font-size:11px;color:#9aa8bf;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
      '.shg-stat b{display:block;font-weight:normal;font-size:15px;color:#e8eef8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
      '.shg-stat.is-hab b{color:#7cf0a6}' +
      '.shg-out{font-size:13px;color:#c9d4e6}.shg-out.is-fail{color:#ffb38a}.shg-out.is-warn{color:#f0c97a}' +
      '.shg-pl{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:3px}' +
      '.shg-pl li{display:flex;align-items:baseline;gap:7px;font-size:12.5px;color:#c9d4e6;padding:3px 0;border-bottom:1px dashed rgba(140,180,230,.12)}' +
      '.shg-dot{flex:none;width:9px;height:9px;border-radius:50%;transform:translateY(1px)}' +
      '.shg-pl .n{color:#e8eef8;min-width:24px}.shg-pl .h{color:#7cf0a6;margin-left:auto;white-space:nowrap}.shg-pl .d{min-width:0;overflow-wrap:anywhere}' +
      '.shg-note{font-size:12px;color:#9aa8bf;margin:0}' +
      '.shg-badge{display:inline-block;font-size:11px;color:#0b1220;background:#f0c97a;border-radius:5px;padding:0 6px;margin-right:6px}' +
      '.shg a.shg-src{color:#7fd6ff}' +
      '.shg-acts{display:flex;gap:8px;flex-wrap:wrap;margin-top:auto;padding-top:4px}' +
      '.shg-btn{appearance:none;font:inherit;cursor:pointer;border-radius:9px;padding:8px 14px;min-height:40px;border:1px solid rgba(140,180,230,.35);background:transparent;color:#c9d4e6;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;white-space:nowrap}' +
      '.shg-btn:hover{border-color:rgba(240,201,122,.75);color:#f0c97a}' +
      '.shg-btn.is-pri{background:#f0c97a;border-color:#f0c97a;color:#0b1220}.shg-btn.is-pri:hover{background:#ffd994;color:#0b1220}' +
      '.shg-btn.is-sm{min-height:30px;padding:3px 9px;font-size:12px}' +
      '.shg-btn:focus-visible{outline:2px solid #7fd6ff;outline-offset:2px}' +
      '.shg-card.is-err{display:block;width:min(460px,100%)}.shg-card.is-err .shg-info{padding:22px}' +
      '@media (max-width:720px),(max-height:460px){.shg-acts{position:sticky;bottom:-14px;margin-bottom:-14px;padding:8px 0 14px;background:linear-gradient(rgba(8,14,30,0),rgba(8,14,30,.96) 30%)}}' +
      '@media (max-width:720px){.shg{padding:8px;align-items:stretch}.shg-card{grid-template-columns:1fr;grid-template-rows:minmax(200px,40vh) minmax(0,1fr)}.shg-viz{min-height:0}.shg-info{padding:12px}.shg h2{font-size:18px}.shg-grid{gap:5px}.shg-card.is-err{align-self:center}}' +
      '@media (max-height:460px) and (min-width:480px){.shg{padding:6px;align-items:stretch}.shg-card{grid-template-columns:minmax(0,1fr) minmax(0,1.15fr);grid-template-rows:none}.shg-viz{min-height:0}.shg-info{padding:10px 12px;gap:7px}.shg h2{font-size:16px}.shg-stat{padding:3px 6px}.shg-stat b{font-size:13px}.shg-btn{min-height:34px;padding:5px 10px}.shg-card.is-err{align-self:center}}';
    document.head.appendChild(s);
  }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined && text !== null) e.textContent = String(text); return e; }

  /* ---------- 数值格式 ---------- */
  function sig(x, n) { if (!isFinite(x)) return '—'; var a = Math.abs(x); if (a !== 0 && (a >= 1e5 || a < 1e-3)) return x.toExponential(1).replace('e+', '×10^').replace('e-', '×10^-'); return String(Number(x.toPrecision(n || 3))); }
  function period(s) { return s < 2 * YEAR ? sig(s / DAY, 3) + ' ' + t('days') : sig(s / YEAR, 3) + ' ' + t('years'); }
  function kindName(k) { return t(k); }
  function pColor(p) { return p.habitable ? '#7cf0a6' : ({ rocky: '#c9a77e', gas: '#e2c48f', ocean: '#6fb6ff', ice: '#cfe6ff', lava: '#ff8a5c' })[p.kind] || '#c9a77e'; }

  /* ---------- 浮层 ---------- */
  var root = null, cv = null, g = null, raf = 0, sys = null, t0 = 0, lastFocus = null, cur = null, curErr = null, note = '';
  var RM = matchMedia('(prefers-reduced-motion: reduce)');
  function backHref() {
    if (curErr) return NV_HOME;   // 坏链接不回传
    if (raw === '@last' || !raw || fromNv) return NV_HOME + '?gus=@last';
    return /^(j\.)?[A-Za-z0-9_-]+$/.test(raw) && raw.length <= MAX_STR ? NV_HOME + '?gus=' + raw : NV_HOME;
  }
  function render() {
    if (root) { root.parentNode && root.parentNode.removeChild(root); cancelAnimationFrame(raf); }
    css();
    root = el('div', 'shg'); root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true');
    var card = el('div', 'shg-card'); root.appendChild(card);
    var info = el('div', 'shg-info');
    var top = el('div', 'shg-top'), kick = el('div', 'shg-k', t('kicker'));
    var lb = el('button', 'shg-btn is-sm', t('lang')); lb.type = 'button'; lb.setAttribute('aria-label', t('langAria'));
    lb.addEventListener('click', function () { L = 1 - L; render(); var b = root.querySelector('.shg-btn.is-sm'); if (b) b.focus(); });
    top.appendChild(kick); top.appendChild(lb); info.appendChild(top);
    if (curErr) {
      card.classList.add('is-err'); root.setAttribute('aria-label', t('errTitle'));
      info.appendChild(el('h2', '', t('errTitle')));
      info.appendChild(el('p', 'shg-out is-fail', t('e_' + curErr) !== 'e_' + curErr ? t('e_' + curErr) : t('e_bad')));
      info.appendChild(el('p', 'shg-note', t('errHint')));
    } else {
      var d = cur, nm = (L ? d.name.en || d.name.zh : d.name.zh || d.name.en) || t('unnamed');
      root.setAttribute('aria-label', t('kicker') + ' · ' + nm);
      var viz = el('div', 'shg-viz'); cv = el('canvas', 'shg-cv'); cv.setAttribute('role', 'img'); cv.setAttribute('aria-label', t('canvasAria'));
      viz.appendChild(cv); viz.appendChild(el('div', 'shg-leg', t('legend') + (RM.matches ? ' · ' + t('staticNote') : '')));
      card.appendChild(viz);
      info.appendChild(el('h2', '', nm));
      if (d.id) info.appendChild(el('div', 'shg-id', d.id + (d.seed !== null ? ' · seed ' + d.seed : '')));
      if (note) info.appendChild(el('p', 'shg-note', t(note)));
      if (d.derived.status) {
        var o = el('p', 'shg-out is-' + d.derived.status, t('outcome') + (L ? ': ' : ':') + t('st_' + d.derived.status));
        var fs = d.derived.failures.map(function (f) { return FAIL[f] ? FAIL[f][L] : f; });
        if (fs.length) o.textContent += (L ? ' (' : '(') + fs.join(L ? ', ' : '、') + (L ? ')' : ')');
        info.appendChild(o);
      }
      if (d.system) {
        var s = d.system.star, ps = d.system.planets, nh = ps.filter(function (p) { return p.habitable; }).length;
        var grid = el('div', 'shg-grid');
        [[t('teff'), Math.round(s.teff_K) + ' K'], [t('lum'), sig(s.lum_W / LSUN, 3) + ' L☉'], [t('mass'), sig(s.mass_kg / MSUN, 3) + ' M☉'],
          [t('rad'), sig(s.radius_m / RSUN, 3) + ' R☉'], [t('planets'), String(ps.length)], [t('hab'), String(nh), nh > 0]].forEach(function (r) {
          var c = el('div', 'shg-stat' + (r[2] ? ' is-hab' : '')); c.appendChild(el('small', '', r[0])); c.appendChild(el('b', '', r[1])); grid.appendChild(c);
        });
        info.appendChild(grid);
        if (ps.length) {
          var ul = el('ul', 'shg-pl');
          ps.forEach(function (p) {
            var li = el('li'), dot = el('span', 'shg-dot'); dot.style.background = pColor(p);
            li.appendChild(dot); li.appendChild(el('span', 'n', p.id));
            li.appendChild(el('span', 'd', kindName(p.kind) + ' · ' + sig(p.a_m / AU, 3) + ' AU · e ' + sig(p.e, 2) + ' · ' + period(p.period_s) + (p.teq_K !== null ? ' · ' + Math.round(p.teq_K) + ' K' : '')));
            if (p.habitable) li.appendChild(el('span', 'h', '● ' + t('habMark')));
            ul.appendChild(li);
          });
          info.appendChild(ul);
        } else info.appendChild(el('p', 'shg-note', t('noPlanets')));
      } else info.appendChild(el('p', 'shg-note', t('noSystem')));
      var sn = el('p', 'shg-note');
      if (d.simplified) { sn.appendChild(el('span', 'shg-badge', t('simple'))); sn.appendChild(document.createTextNode(t('simpleNote') + ' ')); }
      if (d.sourcesPath) { var a = el('a', 'shg-src', t('sources')); a.href = d.sourcesPath; a.target = '_blank'; a.rel = 'noopener'; sn.appendChild(a); }
      info.appendChild(sn);
    }
    var acts = el('div', 'shg-acts');
    var back = el('a', 'shg-btn', t('back')); back.href = backHref();
    var go = el('button', 'shg-btn is-pri', t('enter')); go.type = 'button'; go.addEventListener('click', close);
    acts.appendChild(back); acts.appendChild(go); info.appendChild(acts);
    card.appendChild(info);
    document.body.appendChild(root);
    root.addEventListener('keydown', onKey);
    if (cv) { g = cv.getContext('2d'); sys = layout(); size(); t0 = performance.now(); loop(); }
    else { cv = null; g = null; }
    setTimeout(function () { if (root && document.activeElement !== lb) go.focus({ preventScroll: true }); }, 0);
  }
  function onKey(e) {
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key !== 'Tab') return;   // 简易焦点圈:Tab 不跑出浮层
    var f = root.querySelectorAll('a[href],button'); if (!f.length) return;
    var a = f[0], z = f[f.length - 1];
    if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
    else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
  }

  /* ---------- 画图:恒星 + 行星椭圆轨道(对数缩放) ---------- */
  function layout() {
    var d = cur && cur.system; if (!d) return null;
    var ps = d.planets, tmin = Infinity, amin = Infinity, amax = 0;
    ps.forEach(function (p) { tmin = Math.min(tmin, p.period_s); amin = Math.min(amin, p.a_m); amax = Math.max(amax, p.a_m * (1 + p.e)); });
    return { star: d.star, ps: ps, tmin: tmin, amin: amin, amax: amax };
  }
  function size() {
    if (!cv) return;
    var r = cv.getBoundingClientRect(), k = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.max(1, Math.round(r.width * k)); cv.height = Math.max(1, Math.round(r.height * k)); cv._k = k;
  }
  function kepler(M, e) { var E = M; for (var i = 0; i < 8; i++) E = E - (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E)); return E; }
  function draw(sec) {
    if (!g || !sys) return;
    var W = cv.width, H = cv.height, k = cv._k || 1, cx = W / 2, cy = H * 0.47, M = Math.min(W, H);
    g.fillStyle = '#02040a'; g.fillRect(0, 0, W, H);
    // 背景星点(确定性伪随机,不闪烁)
    var sd = 7; g.fillStyle = 'rgba(200,220,255,.35)';
    for (var i = 0; i < 90; i++) { sd = (sd * 16807) % 2147483647; var x = sd % W; sd = (sd * 16807) % 2147483647; var y = sd % H; g.fillRect(x, y, k, k); }
    var tilt = Math.max(0.42, Math.min(0.78, H / W * 1.05));   // 轨道面略微倾斜,宽屏更有纵深
    var rx = W * 0.46, ry = (H * 0.44) / tilt, rmax = Math.min(rx, ry);
    var st = sys.star, rgb = st.rgb, col = 'rgb(' + rgb.map(function (v) { return Math.round(v * 255); }).join(',') + ')';
    var sr = Math.max(4 * k, Math.min(M * 0.09, M * 0.035 * Math.sqrt(st.radius_m / RSUN)));
    var r0 = sr + 16 * k, la = Math.log(sys.amin), lb = Math.log(sys.amax), n = sys.ps.length;
    function aPx(a) { return n === 1 || lb - la < 1e-9 ? (r0 + rmax) / 2 : r0 + (Math.log(a) - la) / (lb - la) * (rmax - r0); }
    // 轨道
    sys.ps.forEach(function (p) {
      var A = aPx(p.a_m), B = A * Math.sqrt(1 - p.e * p.e), c = A * p.e;
      g.beginPath(); g.ellipse(cx - c, cy, A, B * tilt, 0, 0, Math.PI * 2);
      g.strokeStyle = p.habitable ? 'rgba(124,240,166,.55)' : 'rgba(127,214,255,.28)'; g.lineWidth = (p.habitable ? 1.6 : 1) * k; g.stroke();
    });
    // 恒星:画在轨道之上、行星之下
    var gl = g.createRadialGradient(cx, cy, sr * 0.2, cx, cy, sr * 3.2);
    gl.addColorStop(0, 'rgba(' + rgb.map(function (v) { return Math.round(v * 255); }).join(',') + ',.55)'); gl.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gl; g.beginPath(); g.arc(cx, cy, sr * 3.2, 0, Math.PI * 2); g.fill();
    g.fillStyle = col; g.beginPath(); g.arc(cx, cy, sr, 0, Math.PI * 2); g.fill();
    // 行星
    g.font = Math.round(11 * k) + 'px "Noto Sans SC","WenQuanYi Micro Hei",sans-serif'; g.textBaseline = 'middle';
    sys.ps.forEach(function (p) {
      var A = aPx(p.a_m), B = A * Math.sqrt(1 - p.e * p.e);
      var Mn = p.phase0 + 2 * Math.PI * sec / (7 * p.period_s / sys.tmin);   // 最内侧行星约 7 秒一圈,其余按周期比例
      var E = kepler(((Mn % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI), p.e);
      var x = cx + A * (Math.cos(E) - p.e), y = cy + B * Math.sin(E) * tilt;   // 恒星在焦点:x = a(cosE − e),y = b·sinE
      var pr = Math.max(2.5 * k, Math.min(7 * k, 2.6 * k * Math.sqrt(p.radius_m / REARTH)));
      if (p.habitable) { g.strokeStyle = 'rgba(124,240,166,.9)'; g.lineWidth = 1.2 * k; g.beginPath(); g.arc(x, y, pr + 3.5 * k, 0, Math.PI * 2); g.stroke(); }
      g.fillStyle = pColor(p); g.beginPath(); g.arc(x, y, pr, 0, Math.PI * 2); g.fill();
      g.fillStyle = p.habitable ? '#b9ffd2' : 'rgba(201,212,230,.8)'; g.fillText(p.id, x + pr + 5 * k, y);
    });
  }
  function loop() {
    cancelAnimationFrame(raf);
    if (!root || !g) return;
    if (RM.matches) { draw(0); return; }   // 减少动态:静态一帧
    var f = function (now) { if (!root) return; raf = requestAnimationFrame(f); if (!document.hidden) draw((now - t0) / 1000); };
    raf = requestAnimationFrame(f);
  }
  function onResize() { if (root && cv) { size(); if (RM.matches) draw(0); } }
  addEventListener('resize', onResize);
  if (RM.addEventListener) RM.addEventListener('change', function () { if (root && cur) render(); });

  /* ---------- 打开 / 关闭 ---------- */
  function open() {
    if (!cur && !curErr) return false;
    lastFocus = document.activeElement; render(); return true;
  }
  function close() {
    cancelAnimationFrame(raf);
    if (root) { root.removeEventListener('keydown', onKey); if (root.parentNode) root.parentNode.removeChild(root); }
    root = null; cv = null; g = null;
    // 去掉地址栏里的 gus,刷新后不再重复弹出(其余参数保持)
    try { var u = new URL(location.href); if (u.searchParams.has('gus')) { u.searchParams.delete('gus'); history.replaceState(history.state, '', u.pathname + (u.search || '') + u.hash); } } catch (e) { }
    if (lastFocus && lastFocus.focus) try { lastFocus.focus(); } catch (e) { }
  }

  function start() {
    var src = raw !== null ? raw : '@last';
    parse(src).then(function (d) { cur = d; S.data = d; open(); }, function (e) {
      var code = (e && e.code) || 'bad';
      if (code === 'no_decompress') {   // 解压不支持:退回读宙律保存的最近一个
        return parse('@last').then(function (d) { cur = d; S.data = d; note = 'lastNote'; open(); }, function () { curErr = code; open(); });
      }
      curErr = code; open();
      try { console.info('[SH] 星桥 GUS 未能读取:', code); } catch (x) { }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
