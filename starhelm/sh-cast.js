/* 天枢 Starhelm · sh-cast.js(v1.0-M3b)—— 地球重要播报
 * 地球模式右上(按钮行下方)常驻面板,替代旧左上角看板。优先播报「你所在国家」的灾害与「你那里看得到」的天象:
 *  灾害:GDACS 全球灾害预警(地震、热带气旋、洪水、火山、山火、干旱;按受影响国家匹配定位国家)+ USGS 地震(定位 1200 km 内 M4.5+);
 *  空间天气:NOAA SWPC Kp 指数(地磁暴 / 极光);
 *  天象:astronomy-engine 本机计算 —— 本地可见的日食、月食(看月亮在不在地平线上)、满月/新月、行星冲日、流星雨极大(IMO 年历)、空间站与天宫过境(SGP4)。
 * 没设定位时播报全球最重要的事件,并提示「设定位置」。只在本机计算,不上传位置。点条目:飞到事发地 / 打开对应实验室。 */
(function () {
  'use strict';
  var URL_G = 'https://www.gdacs.org/gdacsapi/api/events/geteventlist/EVENTS4APP';
  var TYPE = { EQ: ['地震', '≋', '#ff8a1f'], TC: ['热带气旋', '֍', '#5ec8ff'], FL: ['洪水', '≈', '#4d9bff'], VO: ['火山', '▲', '#ff5a3c'], WF: ['山火', '✶', '#ffb02e'], DR: ['干旱', '☀', '#e0b060'] };
  var ALERT = { Red: ['红色', 3], Orange: ['橙色', 2], Green: ['绿色', 1] };
  var SHOWERS = [   // IMO 年历极大日(月, 日, 名称, ZHR)
    [1, 3, '象限仪座流星雨', 80], [4, 22, '天琴座流星雨', 18], [5, 6, '宝瓶座 η 流星雨', 50], [7, 30, '南宝瓶座 δ 流星雨', 25], [8, 12, '英仙座流星雨', 100],
    [10, 21, '猎户座流星雨', 20], [11, 17, '狮子座流星雨', 15], [12, 14, '双子座流星雨', 150], [12, 22, '小熊座流星雨', 10]];
  var C = { g: null, gTime: 0, items: [], open: true };
  function $(id) { return document.getElementById(id); }
  function h(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var DN = null; try { DN = new Intl.DisplayNames(['zh-CN'], { type: 'region' }); } catch (e) { }
  function cz(iso2, fallback) { try { return iso2 && DN ? DN.of(iso2.toUpperCase()) : fallback; } catch (e) { return fallback || iso2; } }
  function hav(a, b) { var R = 6371, d = Math.PI / 180, x = Math.sin((b.lat - a.lat) * d / 2), y = Math.sin((b.lng - a.lng) * d / 2); return 2 * R * Math.asin(Math.sqrt(x * x + Math.cos(a.lat * d) * Math.cos(b.lat * d) * y * y)); }
  function ago(ms) { var m = Math.round((Date.now() - ms) / 60000); if (m < 60) return Math.max(1, m) + ' 分钟前'; var hh = Math.round(m / 60); if (hh < 48) return hh + ' 小时前'; return Math.round(hh / 24) + ' 天前'; }
  function inDays(ms) { var d = (ms - Date.now()) / 864e5; if (d < 1) return d * 24 < 1 ? '1 小时内' : Math.round(d * 24) + ' 小时后'; return Math.round(d) + ' 天后'; }
  function bj(ms) { var d = new Date(ms + 8 * 3600e3); return (d.getUTCMonth() + 1) + '月' + d.getUTCDate() + '日 ' + ('0' + d.getUTCHours()).slice(-2) + ':' + ('0' + d.getUTCMinutes()).slice(-2); }
  function loc() { return window.LE && LE.location && LE.location.current; }

  /* ---------- 灾害 ---------- */
  function disasters(L) {
    var out = [], cc = L && L.country ? String(L.country).toUpperCase() : '', wf = {};
    (C.g || []).forEach(function (f) {
      var p = f.properties || {}, t = TYPE[p.eventtype]; if (!t || String(p.iscurrent) !== 'true') return;
      var start = Date.parse(p.fromdate + 'Z'); if (p.eventtype === 'EQ' && Date.now() - start > 7 * 864e5) return;
      var aff = (p.affectedcountries || []).map(function (a) { return a.iso2; }), mine = cc && aff.indexOf(cc) >= 0;
      var al = ALERT[p.alertlevel] || ALERT.Green, c = f.geometry && f.geometry.coordinates;
      var where = aff.length ? aff.slice(0, 3).map(function (x) { return cz(x, x); }).join('、') : (p.country || '海域');
      if (p.eventtype === 'WF' || p.eventtype === 'DR') {   // 山火/干旱按国家合并
        var k = p.eventtype + where; if (wf[k]) { wf[k].n++; return; }
      }
      var mag = p.eventtype === 'EQ' && p.severitydata && p.severitydata.severity ? ' M' + (+p.severitydata.severity).toFixed(1) : '';
      var name = p.eventtype === 'TC' && p.eventname ? ' ' + p.eventname : '';
      var it = { kind: 'dis', ico: t[1], col: al[1] === 3 ? '#ff4d4d' : al[1] === 2 ? '#ffa02e' : t[2], title: t[0] + name + mag + ' · ' + where,
        meta: al[0] + '预警 · ' + ago(start), tag: mine ? '你所在国家' : '全球', score: (mine ? 70 : 20) + al[1] * (mine ? 10 : 14) + (p.eventtype === 'EQ' ? 0 : 3),
        lat: c && c[1], lng: c && c[0], url: p.url && (p.url.report || p.url.details), n: 1 };
      if (p.eventtype === 'WF' || p.eventtype === 'DR') wf[p.eventtype + where] = it;
      if (!mine && al[1] < 2) return;      // 外国的绿色预警不播
      out.push(it);
    });
    Object.keys(wf).forEach(function (k) { if (wf[k].n > 1) wf[k].title += ' 等 ' + wf[k].n + ' 处'; });
    // USGS:定位附近的地震(GDACS 小震不全)
    var Q = window.LE && LE.layers && LE.layers.quakes;
    if (L && Q && Q.list) Q.list.forEach(function (q) {
      if (q.mag < 4.5 || Date.now() - q.time > 3 * 864e5) return;
      var d = hav(L, q); if (d > 1200) return;
      if (out.some(function (o) { return o.kind === 'dis' && o.lat != null && hav(o, q) < 60 && /地震/.test(o.title); })) return;
      out.push({ kind: 'dis', ico: '≋', col: q.mag >= 6 ? '#ff4d4d' : '#ff8a1f', title: '地震 M' + q.mag.toFixed(1) + ' · 距你 ' + Math.round(d) + ' km', meta: (q.place || '') + ' · ' + ago(q.time), tag: '附近', score: 60 + q.mag * 4 - d / 100, lat: q.lat, lng: q.lng, url: q.url });
    });
    return out;
  }
  /* ---------- 空间天气 ---------- */
  function spaceWx(L) {
    var E = window.SH && SH.eye, kp = E && E.kp; if (kp == null) return [];
    if (kp < 5 && !(L && Math.abs(L.lat) >= 50 && kp >= 4)) return [];
    var g = kp >= 9 ? 'G5 极端' : kp >= 8 ? 'G4 严重' : kp >= 7 ? 'G3 强' : kp >= 6 ? 'G2 中等' : kp >= 5 ? 'G1 小' : '活跃';
    var lat = kp >= 8 ? 40 : kp >= 7 ? 45 : kp >= 6 ? 50 : 55, see = L && Math.abs(L.lat) >= lat;
    return [{ kind: 'aurora', ico: '✦', col: '#5dff9a', title: '地磁暴 ' + g + ' · Kp ' + kp.toFixed(0), meta: '纬度约 ' + lat + '° 以上夜里可能看到极光' + (see ? ' · 你那里有机会' : ''), tag: see ? '你那里可见' : '全球', score: (see ? 82 : 40) + kp * 2 }];
  }
  /* ---------- 天象(本机计算) ---------- */
  function sky(L) {
    var A = window.Astronomy, out = []; if (!A) return out;
    var now = new Date(), t = A.MakeTime(now), obs = L ? new A.Observer(L.lat, L.lng, 0) : null;
    try {   // 日食
      if (obs) {
        var se = A.SearchLocalSolarEclipse(t, obs), ms = se.peak.time.date.getTime();
        if (ms - now < 60 * 864e5) out.push({ kind: 'sky', lab: 'eclipseLab', ico: '◐', col: '#ffd27a', title: (se.kind === 'total' ? '日全食' : se.kind === 'annular' ? '日环食' : '日偏食') + ' · 你那里看得到', meta: bj(ms) + ' 食甚 · 太阳高度 ' + Math.round(se.peak.altitude) + '° · ' + inDays(ms), tag: '本地天象', score: 88 - (ms - now) / 864e5 * 0.3 });
      }
    } catch (e) { }
    try {   // 月食
      var le = A.SearchLunarEclipse(t), lm = le.peak.date.getTime();
      if (lm - now < 45 * 864e5) {
        var up = true, alt = null; if (obs) { var eq = A.Equator(A.Body.Moon, le.peak, obs, true, true), hz = A.Horizon(le.peak, obs, eq.ra, eq.dec, 'normal'); alt = hz.altitude; up = alt > 0; }
        var nm = le.kind === 'total' ? '月全食' : le.kind === 'partial' ? '月偏食' : '半影月食';
        out.push({ kind: 'sky', lab: 'eclipseLab', ico: '◑', col: '#ff9d7a', title: nm + (obs ? (up ? ' · 你那里看得到' : ' · 你那里月亮在地平线下') : ''), meta: bj(lm) + ' 食甚 · ' + inDays(lm), tag: obs && up ? '本地天象' : '全球', score: (obs && up ? 80 : 35) - (lm - now) / 864e5 * 0.4 + (le.kind === 'penumbral' ? -15 : 0) });
      }
    } catch (e) { }
    try {   // 满月 / 新月
      var mp = A.SearchMoonPhase(180, t, 30), np = A.SearchMoonPhase(0, t, 30), fm = mp && mp.date.getTime(), nmn = np && np.date.getTime();
      if (fm && fm - now < 4 * 864e5) out.push({ kind: 'sky', lab: 'moonLab', ico: '○', col: '#f4f1e0', title: '满月 · ' + inDays(fm), meta: bj(fm) + '(北京时间)· 整夜可见', tag: '天象', score: 48 });
      if (nmn && nmn - now < 3 * 864e5) out.push({ kind: 'sky', lab: 'moonLab', ico: '●', col: '#9fb4d0', title: '新月 · 适合看星星', meta: bj(nmn) + ' · 没有月光干扰,银河和暗星更清楚', tag: '天象', score: 42 });
    } catch (e) { }
    try {   // 行星冲日(火星/木星/土星)
      [['Mars', '火星'], ['Jupiter', '木星'], ['Saturn', '土星']].forEach(function (b) {
        var o = A.SearchRelativeLongitude(A.Body[b[0]], 0, t), om = o.date.getTime();
        if (om - now < 30 * 864e5) out.push({ kind: 'sky', lab: 'tonightLab', ico: '◉', col: '#ffb46a', title: b[1] + '冲日 · ' + inDays(om), meta: bj(om) + ' · 整夜可见、最亮最近', tag: '天象', score: 58 });
      });
    } catch (e) { }
    // 流星雨
    var y = now.getUTCFullYear();
    SHOWERS.forEach(function (s) {
      [y, y + 1].forEach(function (yy) {
        var ms = Date.UTC(yy, s[0] - 1, s[1], 12), dd = (ms - now) / 864e5;
        if (dd > -1 && dd < 10) out.push({ kind: 'sky', ico: '☄', col: '#c9b0ff', title: s[2] + '极大 · ' + (dd < 0.5 ? '就在今晚前后' : inDays(ms)), meta: '每小时最多约 ' + s[3] + ' 颗(理想条件)· 后半夜最佳' + (L && s[2] === '宝瓶座 η 流星雨' ? '' : ''), tag: '天象', score: 52 + Math.min(20, s[3] / 8) - dd });
      });
    });
    // 空间站 / 天宫过境
    var SKY = window.SH && SH.sky;
    if (L && SKY && SKY.passes) [['iss', '国际空间站'], ['css', '天宫空间站']].forEach(function (x) {
      try {
        var ps = SKY.passes(x[0]); if (!ps || !ps.length) return; var p = ps[0];
        if (p.start - now > 36 * 3600e3) return;
        out.push({ kind: 'pass', id: x[0], ico: '✧', col: x[0] === 'css' ? '#ff7a7a' : '#ffb46a', title: x[1] + '过境 · ' + inDays(p.start), meta: bj(p.start) + ' · 最高 ' + Math.round(p.maxEl) + '° · 约 ' + Math.max(1, Math.round((p.end - p.start) / 60000)) + ' 分钟', tag: '你头顶', score: 62 + p.maxEl / 6 });
      } catch (e) { }
    });
    return out;
  }

  /* ---------- 面板 ---------- */
  var U = {};
  function build() {
    var r = U.root = h('section', 'sh-cast le-earth-only');
    r.innerHTML = '<header class="sh-cast__h"><span class="sh-cast__live"></span><b>地球重要播报</b><small>LIVE</small><button class="sh-cast__fold" type="button" aria-label="收起">–</button></header>' +
      '<div class="sh-cast__for"></div><ol class="sh-cast__list"></ol><div class="sh-cast__src">GDACS · USGS · NOAA SWPC · 天象本机计算</div>';
    document.body.appendChild(r);
    U.for = r.querySelector('.sh-cast__for'); U.list = r.querySelector('.sh-cast__list');
    r.querySelector('.sh-cast__fold').onclick = function () { r.classList.toggle('is-fold'); this.textContent = r.classList.contains('is-fold') ? '+' : '–'; };
    r.querySelector('.sh-cast__h').addEventListener('click', function (e) { if (r.classList.contains('is-fold') && e.target.tagName !== 'BUTTON') { r.classList.remove('is-fold'); r.querySelector('.sh-cast__fold').textContent = '–'; } });
    if (innerHeight <= 500) { r.classList.add('is-fold'); r.querySelector('.sh-cast__fold').textContent = '+'; }
  }
  function draw() {
    var L = loc();
    U.for.innerHTML = L ? '为你关注:<b>' + esc(L.name) + (L.country ? ' · ' + esc(cz(L.country, L.country)) : '') + '</b>' : '还没有位置,先播全球 · <button type="button" class="sh-cast__set">设定位置</button>';
    var b = U.for.querySelector('.sh-cast__set'); if (b) b.onclick = function () { if (LE.ui.openSheet) LE.ui.openSheet('sheet-loc'); };
    var all = disasters(L).concat(spaceWx(L), sky(L)).sort(function (a, b) { return b.score - a.score; });
    var seen = {}; all = all.filter(function (x) { if (seen[x.title]) return false; seen[x.title] = 1; return true; }).slice(0, 7);
    C.items = all;
    if (!all.length) { U.list.innerHTML = '<li class="sh-cast__none">' + (C.g ? '此刻没有需要特别关注的事件。' : '正在连接全球灾害与天象数据…') + '</li>'; return; }
    U.list.innerHTML = all.map(function (x, i) {
      return '<li><button type="button" data-i="' + i + '" style="--c:' + x.col + '"><i>' + x.ico + '</i><span><b>' + esc(x.title) + '</b><small>' + esc(x.meta) + '</small></span><em class="' + (/你|附近|本地/.test(x.tag) ? 'me' : '') + '">' + x.tag + '</em></button></li>';
    }).join('');
    [].forEach.call(U.list.querySelectorAll('button'), function (bt) { bt.onclick = function () { act(C.items[+bt.dataset.i]); }; });
    var cnt = all.filter(function (x) { return /你|附近|本地/.test(x.tag); }).length;
    U.root.dataset.n = cnt ? cnt : '';
  }
  function act(x) {
    if (!x) return; if (LE.audio && LE.audio.play) LE.audio.play('lock');
    var S = LE.scene;
    if (x.lat != null && x.lng != null && LE.util && LE.util.ll) {
      if (S.mode !== 'earth' && LE.ui.setMode) LE.ui.setMode('earth');
      var p = LE.util.ll(x.lat, x.lng, 1, new THREE.Vector3()); S.flyTo({ target: new THREE.Vector3(), position: p.clone().multiplyScalar(2.6), ms: 1800 });
      if (LE.ui.toast) LE.ui.toast(x.title);
      return;
    }
    if (x.kind === 'aurora') { var ac = document.querySelector('[data-eye="aurora"]'); if (ac && ac.getAttribute('aria-pressed') !== 'true') ac.click(); if (LE.ui.toast) LE.ui.toast(x.title + ' · ' + x.meta); return; }
    if (x.kind === 'pass' && SH.sky && SH.sky.cardOrbiter && x.id === 'css') { SH.sky.cardOrbiter('css'); return; }
    if (x.kind === 'pass' && LE.layers.iss && LE.layers.iss.select) { LE.layers.iss.select(); return; }
    if (x.lab && SH[x.lab] && SH[x.lab].open) { SH[x.lab].open(); return; }
    if (LE.ui.toast) LE.ui.toast(x.title + ' · ' + x.meta);
  }
  function fetchG() {
    if (!LE.netcache) return;
    LE.netcache.text(URL_G, 10 * 60 * 1000, 9000, function (t) { return /FeatureCollection/.test(t); })
      .then(function (r) { try { C.g = JSON.parse(r.text).features || []; C.gTime = r.time || Date.now(); } catch (e) { C.g = []; } draw(); })
      .catch(function () { C.g = C.g || []; draw(); });
  }
  function init() {
    build(); draw(); fetchG();
    setInterval(fetchG, 10 * 60 * 1000); setInterval(draw, 60 * 1000);
    if (LE.bus) { LE.bus.on('location:changed', function () { setTimeout(draw, 300); }); LE.bus.on('mode:changed', function () { }); }
    setTimeout(draw, 6000); setTimeout(draw, 15000);   // 地震 / Kp / 过境数据陆续到位
  }
  window.SHCAST = { draw: draw, items: function () { return C.items; }, _set: function (g) { C.g = g; draw(); } };
  (function wait(k) {
    if (window.SH_READY && window.LE && LE.scene && LE.location && document.body.classList.contains('shh-on')) { try { init(); } catch (e) { console.error('[SHCAST]', e); } return; }
    if (window.SH_READY && k > 60 && window.LE && LE.scene) { try { init(); } catch (e) { console.error('[SHCAST]', e); } return; }
    if (k > 900) return; setTimeout(function () { wait(k + 1); }, 150);
  })(0);
})();
