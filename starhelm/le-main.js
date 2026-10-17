/* =====================================================================
 * Live Earth 2.2 · le-main.js
 * LE.main：启动顺序与容错
 *  等待 three.js / OrbitControls 就绪 → 场景 → 地球 → 各图层 → 太阳系 → UI → 开场动画 → 恢复本机记住的城市(不自动定位)
 *  任何一个图层初始化失败都不会拖垮整个页面（单独 try/catch）。
 * ===================================================================== */
(function () {
  'use strict';
  var LE = window.LE, $ = LE.util.$;

  function waitFor(test, ms) {
    return new Promise(function (res, rej) {
      var t0 = performance.now();
      (function check() { if (test()) return res(); if (performance.now() - t0 > ms) return rej(new Error('timeout')); setTimeout(check, 50); })();
    });
  }
  function safe(name, fn) { try { fn(); } catch (e) { console.error('[LE.main] 模块初始化失败：' + name, e); } }

  LE.main = {
    boot: function () {
      LE.bus.on('assets:progress', function (p) { var b = $('loader-bar'); if (b) b.style.width = Math.round(p.done / Math.max(1, p.total) * 100) + '%'; });
      // 开机日志：逐行打出，纯装饰
      var LOG = ['ESTABLISHING UPLINK…', 'USGS SEISMIC FEED · 地震数据', 'CELESTRAK OMM · 星链轨道', 'JPL EPHEMERIS · 行星星历', 'RENDER CORE ONLINE · 渲染就绪'], li = 0;
      var logT = setInterval(function () { var el = $('loader-text'); if (!el || li >= LOG.length) return clearInterval(logT); el.textContent = LOG.slice(Math.max(0, li - 2), li + 1).join('\n'); li++; }, 420);
      waitFor(function () { return window.THREE && THREE.OrbitControls; }, 20000).then(function () {
        LE.scene.init($('stage'));
        LE.earth.init();
        safe('quakes', LE.layers.quakes.init);
        safe('starlink', LE.layers.starlink.init);
        safe('iss', LE.layers.iss.init);
        safe('flights', LE.layers.flights.init);
        safe('location', LE.location.init);
        safe('solar', LE.solar.init);
        LE.ui.init();
        safe('audio', LE.audio.init);
        var bi = $('btn-iss'); if (bi) bi.addEventListener('click', function () { if (!LE.layers.iss.visible) LE.ui.setLayer('iss', true); LE.layers.iss.select(); LE.layers.iss.flyTo(); });
        document.body.dataset.mode = 'earth';
        return LE.earth.ready;
      }).then(function () {
        $('stage').classList.add('is-on');
        $('loader').classList.add('is-done');
        setTimeout(function () { var l = $('loader'); if (l) l.remove(); }, 900);
        LE.scene.flyTo({ position: new THREE.Vector3(0, 0.8, LE.scene.fitDistance()), ms: 2600 });
        setTimeout(function () { LE.location.restore(); }, 1200);   // 天枢 Starhelm:不自动定位
        window.READY = true;
      }).catch(function (e) {
        console.error(e);
        $('loader-text').textContent = '三维引擎加载失败，请检查网络后刷新';
      });
    }
  };

  LE.main.boot();
})();
