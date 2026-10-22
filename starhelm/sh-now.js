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
  function card(el, body, d) {
    d = d || (window.SHTIME ? SHTIME.now() : new Date());
    var o = body === 'sun' ? sun(d) : moon(d), h = '<div class="shnow-h"><b>' + o.name + '</b><small>' + o.en + '</small></div>';
    rows(o).forEach(function (r) { h += '<div class="shnow-r"><span>' + r[0] + '</span><span>' + esc(r[1]) + '</span></div>'; });
    h += '<div class="shnow-s">' + o.source + ' · 更新于 ' + (window.SHTIME ? SHTIME.fmt(d).slice(11) : '') + '</div>';
    el.innerHTML = h; return o;
  }
  window.SHNOW = { ok: !!A, moon: moon, sun: sun, card: card, fmtKm: km, fmtLight: light };
})();
