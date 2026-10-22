/* 天枢 Starhelm · sh-time.js · 1.0 统一时间源(v1.0-M1 框架)
 * window.SHTIME:实时 / 快进 / 指定日期;所有星域、此刻卡共用这一个时钟。
 * 用法:SHTIME.on(function(date, st){...});SHTIME.setRate(86400) 即 1 天/秒;SHTIME.live()
 */
(function () {
  'use strict';
  var subs = [], rate = 1, base = Date.now(), wall = performance.now(), running = true, raf = 0;
  var RATES = { live: 1, day: 86400, month: 86400 * 30 };
  function now() { return new Date(base + (performance.now() - wall) * rate); }
  function rebase() { base = now().getTime(); wall = performance.now(); }
  function emit() {
    var d = now(), st = { rate: rate, live: rate === 1 && Math.abs(d - Date.now()) < 2000 };
    for (var i = 0; i < subs.length; i++) { try { subs[i](d, st); } catch (e) { console.warn('[SHTIME]', e); } }
  }
  var last = 0;
  function loop(t) {
    raf = requestAnimationFrame(loop);
    // 实时每秒刷新一次;快进每帧刷新
    if (rate === 1 && t - last < 1000) return;
    last = t; emit();
  }
  function start() { if (!raf && running) raf = requestAnimationFrame(loop); }
  function stop() { if (raf) cancelAnimationFrame(raf); raf = 0; }
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { rebase(); stop(); } else { wall = performance.now(); start(); }
  });
  window.SHTIME = {
    RATES: RATES,
    now: now,
    isLive: function () { return rate === 1 && Math.abs(now() - Date.now()) < 2000; },
    rate: function () { return rate; },
    setRate: function (r) { rebase(); rate = +r || 1; emit(); },
    live: function () { base = Date.now(); wall = performance.now(); rate = 1; emit(); },
    set: function (d) { base = new Date(d).getTime(); wall = performance.now(); emit(); },
    on: function (fn) { subs.push(fn); start(); fn(now(), { rate: rate, live: this.isLive() }); return function () { subs = subs.filter(function (f) { return f !== fn; }); }; },
    pause: function () { running = false; rebase(); rate = 0; stop(); },
    resume: function () { running = true; rate = rate || 1; wall = performance.now(); start(); },
    fmt: function (d) { // 北京时间显示
      var p = new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(d || now());
      var o = {}; p.forEach(function (x) { o[x.type] = x.value; });
      return o.year + '-' + o.month + '-' + o.day + ' ' + o.hour + ':' + o.minute;
    }
  };
})();
