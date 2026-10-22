/* 天枢 Starhelm · sh-link.js(v0.6.5)—— 星桥深链:?task=<id> 载入后直接打开对应任务或实验室
 * where / orbit / seasons / sats / quakes:进入第一个还没拿到星的关卡;eclipse / tide / sun / moon:打开实验室;archive:星档馆
 * 不认识的 id 忽略;任何失败都不影响首页 */
(function () {
  'use strict';
  var m = /[?&]task=([a-z]+)/.exec(location.search); if (!m) return;
  var id = m[1];
  function first(t) {
    var P = window.SH && SH.progress, L = SH.levels && SH.levels[t], n = 1;
    if (P && L) for (var i = 1; i <= L.length; i++) { if (P.stars(t, i) < 1) { n = i; break; } }
    return n;
  }
  var OPEN = {
    where: function () { SH.play('where', first('where')); },
    orbit: function () { SH.play('orbit', first('orbit')); },
    seasons: function () { SH.seasonsLab.open(); },
    sats: function () { SH.satsLab.open(); },
    quakes: function () { SH.quakesLab.open(); },
    eclipse: function () { SH.eclipseLab.open(); },
    tide: function () { SH.tideLab.open(); },
    sun: function () { SH.sunLab.open(); },
    moon: function () { SH.moonLab.open(); },
    archive: function () { SH.archive.open(); }
  };
  if (!OPEN[id]) return;
  (function w(n) {
    if (window.SH_READY) return setTimeout(function () { try { OPEN[id](); } catch (e) { console.warn('[SH] 深链打开失败', id, e); } }, 300);
    if (n > 300) return;
    setTimeout(function () { w(n + 1); }, 100);
  })(0);
})();
