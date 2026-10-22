/* 天枢 Starhelm · sh-now.js · 「此刻卡」数据与渲染(v1.0-M1 框架)
 * 依赖:vendor/astronomy-engine/astro.p1–p3.js(按序加载,全局 Astronomy,MIT)、sh-time.js(可选)
 * window.SHNOW.moon(date) / sun(date) 返回此刻数据;SHNOW.card(el, body, date) 渲染卡片。
 */
(function () {
  'use strict';
  var A = window.Astronomy, AU = 149597870.7, C = 299792.458;
  function fmtD(t) { return window.SHTIME ? SHTIME.fmt(t.date) : t.date.toISOString().slice(0, 16).replace('T', ' '); }
  function day(t) { return fmtD(t).slice(0, 10); }
  function phaseName(a) { // a: 月相角 0–360
    if (a < 6 || a >= 354) return '新月';
    if (a < 84) return '蛾眉月';
    if (a < 96) return '上弦月';
    if (a < 174) return '盈凸月';
    if (a < 186) return '满月';
    if (a < 264) return '亏凸月';
    if (a < 276) return '下弦月';
    return '残月';
  }
  var SE = { total: '日全食', annular: '日环食', partial: '日偏食', hybrid: '日全环食' }, LE = { total: '月全食', partial: '月偏食', penumbral: '半影月食' };
  function moon(d) {
    var t = A.MakeTime(d), ang = A.MoonPhase(t), ill = A.Illumination(A.Body.Moon, t);
    var km = A.GeoMoon(t).Length() * AU, lib = A.Libration(t);
    var full = A.SearchMoonPhase(180, t, 40), nw = A.SearchMoonPhase(0, t, 40);
    return {
      id: 'moon', name: '月球', en: 'Moon',
      phaseAngle: ang, phase: phaseName(ang), fraction: ill.phase_fraction,
      ageDays: ang / 360 * 29.530588, distKm: km, lightSec: km / C,
      libLon: lib.elon, libLat: lib.elat,
      nextFull: full && fmtD(full), nextNew: nw && fmtD(nw),
      source: '本机实时计算 · astronomy-engine'
    };
  }
  function sun(d) {
    var t = A.MakeTime(d), km = A.GeoVector(A.Body.Sun, t, true).Length() * AU;
    var se = A.SearchGlobalSolarEclipse(t), le = A.SearchLunarEclipse(t);
    return {
      id: 'sun', name: '太阳', en: 'Sun', distKm: km, lightSec: km / C,
      nextSolar: day(se.peak) + ' ' + (SE[se.kind] || '日食'),
      nextLunar: day(le.peak) + ' ' + (LE[le.kind] || '月食'),
      source: '日月食本机计算 · astronomy-engine;太阳实拍 NASA SDO;活动 NOAA SWPC'
    };
  }
  function km(n) { return n >= 1e8 ? (n / 1e8).toFixed(3) + ' 亿 km' : Math.round(n).toLocaleString('en-US') + ' km'; }
  function light(s) { return s < 60 ? s.toFixed(2) + ' 秒' : Math.floor(s / 60) + ' 分 ' + Math.round(s % 60) + ' 秒'; }
  function rows(o) {
    if (o.id === 'moon') return [
      ['此刻月相', o.phase + ' · 亮面 ' + Math.round(o.fraction * 100) + '%'],
      ['月龄', '约 ' + o.ageDays.toFixed(1) + ' 天'],
      ['离地球', km(o.distKm)], ['光从月球到这里', light(o.lightSec)],
      ['下一次满月', o.nextFull], ['下一次新月', o.nextNew]];
    if (o.id === 'sun') return [
      ['离地球', km(o.distKm)], ['光到地球', light(o.lightSec)],
      ['下一次日食', o.nextSolar], ['下一次月食', o.nextLunar]];
    return [];
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  /* ---------- 行星(v1.0-M2a):离地球/太阳、光行时、亮度、一天一年、下一次冲日或大距 ---------- */
  var PL = { // 太阳日 / 恒星日 / 公转 / 卫星(约数,2025 年统计)
    mercury: { zh: '水星', en: 'Mercury', day: '约 176 个地球日', spin: '58.6 天', year: '88.0 天', moons: '0', inner: true },
    venus: { zh: '金星', en: 'Venus', day: '约 117 个地球日(太阳西升东落)', spin: '243 天(倒着转)', year: '224.7 天', moons: '0', inner: true },
    earth: { zh: '地球', en: 'Earth', day: '24 小时', spin: '23 小时 56 分', year: '365.25 天', moons: '1' },
    mars: { zh: '火星', en: 'Mars', day: '24 小时 39 分 35 秒', spin: '24 小时 37 分', year: '687 天', moons: '2' },
    jupiter: { zh: '木星', en: 'Jupiter', day: '约 9 小时 56 分', spin: '约 9 小时 56 分', year: '11.86 年', moons: '90 多颗' },
    saturn: { zh: '土星', en: 'Saturn', day: '约 10 小时 34 分', spin: '约 10 小时 34 分', year: '29.4 年', moons: '270 多颗' },
    uranus: { zh: '天王星', en: 'Uranus', day: '约 17 小时 14 分(躺着转)', spin: '约 17 小时 14 分', year: '84.0 年', moons: '20 多颗' },
    neptune: { zh: '海王星', en: 'Neptune', day: '约 16 小时 6 分', spin: '约 16 小时 6 分', year: '164.8 年', moons: '16' }
  };
  function bodyOf(id) { return A.Body[id.charAt(0).toUpperCase() + id.slice(1)]; }
  function planet(d, id) {
    var p = PL[id], t = A.MakeTime(d), B = bodyOf(id), o = { id: id, name: p.zh, en: p.en, p: p, source: '本机实时计算 · astronomy-engine' };
    o.sunAU = A.HelioVector(B, t).Length();
    if (id !== 'earth') {
      o.distKm = A.GeoVector(B, t, true).Length() * AU; o.lightSec = o.distKm / C;
      try { o.mag = A.Illumination(B, t).mag; } catch (e) { }
      try {
        if (p.inner) { var me = A.SearchMaxElongation(B, t); o.next = ['下一次大距(最好看)', day(me.time) + (me.visibility === 'morning' ? ' 清晨东方' : ' 黄昏西方')]; }
        else { var op = A.SearchRelativeLongitude(B, 0, t); o.next = ['下一次冲日(最近最亮)', day(op)]; }
      } catch (e) { }
    }
    return o;
  }
  function prows(o) {
    var r = [];
    if (o.id !== 'earth') { r.push(['离地球', km(o.distKm)], ['光从它到这里', light(o.lightSec)]); }
    r.push(['离太阳', o.sunAU.toFixed(3) + ' AU']);
    if (o.mag != null) r.push(['亮度', (o.mag < 0 ? '−' + Math.abs(o.mag).toFixed(1) : o.mag.toFixed(1)) + ' 等' + (o.mag < 1 ? '(比大多数恒星亮)' : o.mag > 6 ? '(肉眼看不到)' : '')]);
    r.push(['一天(日出到日出)', o.p.day], ['一年', o.p.year], ['卫星', o.p.moons]);
    if (o.next) r.push(o.next);
    return r;
  }
  function card(el, body, d) {
    d = d || (window.SHTIME ? SHTIME.now() : new Date());
    var o = PL[body] ? planet(d, body) : body === 'sun' ? sun(d) : moon(d), h = '<div class="shnow-h"><b>' + o.name + '</b><small>' + o.en + '</small></div>';
    (PL[body] ? prows(o) : rows(o)).forEach(function (r) { h += '<div class="shnow-r"><span>' + r[0] + '</span><span>' + esc(r[1]) + '</span></div>'; });
    h += '<div class="shnow-s">' + o.source + ' · 更新于 ' + (window.SHTIME ? SHTIME.fmt(d).slice(11) : '') + '</div>';
    el.innerHTML = h; return o;
  }
  window.SHNOW = { ok: !!A, moon: moon, sun: sun, planet: planet, PLANETS: PL, card: card, fmtKm: km, fmtLight: light };
})();
