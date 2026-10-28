/* 天枢 2.0 · C2.2c 远景标签 LOD(屏幕空间去重叠)
 * 每帧所有图层摆完标签后(微任务)统一做一次:按优先级贪心摆放,与已摆标签重叠的低优先级标签淡出让位。
 * 优先级:当前目标 > 日球层顶/终端激波/旅行者 1·2 > 太阳 > 航点恒星/探测器 > 行星 > 矮行星 > 彗星 > 卫星 > 日鞘/星际风/IBEX > 星座名。
 * 只切换 .xl-hide 类(透明度),不改各图层自己的 display 逻辑。 */
(function () {
  'use strict';
  var X = null, queued = false, PAD = 3;
  var HP = { hp: 900, ts: 880, v1: 860, v2: 860, sh: 850, hs: 420, wd: 400, rb: 380 };
  function css() {
    if (document.getElementById('xl-lod-css')) return;
    var s = document.createElement('style'); s.id = 'xl-lod-css';
    s.textContent = '#shxc .lbl,.xh-lb,#xq-lab .cl{transition:opacity .25s}#shxc .xl-hide{opacity:0!important;pointer-events:none!important}';
    document.head.appendChild(s);
  }
  function vis(e) { return e.style.display !== 'none' && e.offsetParent !== null; }
  function pass() {
    queued = false;
    var root = X._.root && X._.root(); if (!root || !root.isConnected) return;
    var c = [];
    root.querySelectorAll('#xc-lbls .lbl').forEach(function (e) { if (vis(e)) c.push([e, e.classList.contains('t') ? 1000 : +(e.dataset.p || 300)]); });
    root.querySelectorAll('.xh-lb').forEach(function (e) { if (e.closest('.xh-lbs')) return; if (vis(e) && e.style.opacity !== '0') c.push([e, HP[e.dataset.k] || 400]); });
    var q = document.getElementById('xq-lab');
    if (q && q.style.display !== 'none') q.querySelectorAll('.cl').forEach(function (e) { if (e.style.display !== 'none') c.push([e, 100]); });
    if (c.length < 2) { c.forEach(function (x) { x[0].classList.remove('xl-hide'); }); return; }
    c.sort(function (a, b) { return b[1] - a[1]; });
    var placed = [];
    c.forEach(function (x) {
      var r = x[0].getBoundingClientRect(); if (!r.width) return;
      var hit = false;
      for (var i = 0; i < placed.length; i++) { var p = placed[i]; if (r.left < p.right + PAD && r.right > p.left - PAD && r.top < p.bottom + PAD && r.bottom > p.top - PAD) { hit = true; break; } }
      x[0].classList.toggle('xl-hide', hit);
      if (!hit) placed.push(r);
    });
  }
  function hook(ev) {
    if (ev === 'open') css();
    if (ev !== 'frame' || queued) return;
    queued = true; Promise.resolve().then(pass);
  }
  (function wait(n) { if (window.SHXC && SHXC.on) { X = SHXC; SHXC.on(hook); return; } if (n < 100) setTimeout(function () { wait(n + 1); }, 100); })(0);
  window.SHXL = { pass: pass };
})();
