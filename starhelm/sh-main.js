/* 天枢 Starhelm · sh-main.js(M1)—— 等 Live Earth 内核启动完成后再挂上七律框架;任何一块失败都不影响 3D 地球 */
(function () {
  'use strict';
  var SH = window.SH;
  function start() {
    try { SH.initCore(); } catch (e) { console.error('[SH] 框架初始化失败', e); return; }
    try { SH.sky.init(); } catch (e) { console.error('[SH] 天空模块初始化失败', e); }
    window.SH_READY = true;
  }
  (function wait(n) { if (window.LE && LE.ui && LE.ui.setLayer && LE.scene && LE.scene.earthScene && LE.layers && LE.layers.iss && LE.layers.iss.group) return start(); if (n > 600) return console.warn('[SH] 内核未就绪'); setTimeout(function () { wait(n + 1); }, 100); })(0);
})();
