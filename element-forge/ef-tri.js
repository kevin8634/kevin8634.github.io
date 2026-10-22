/* 元素工坊 Element Forge · 三窗联动框架 ef-tri.js v0.5
   左「看得见」宏观现象 · 中「看不见」微观粒子 · 右「写下来」符号与方程式。
   三窗共用一个状态:任何一窗(或控件条)改了状态,另两窗同步重画。
   手机竖屏:三窗改为上下切换的标签页,未显示的窗口有变化时标签上亮一个小点。
   cabbage 首用;fireworks、battery 复用。依赖 ef.js(window.EF)。 */
(function () {
  var EF = window.EF;
  var NAMES = { macro: ['看得见', '宏观'], micro: ['看不见', '微观'], sym: ['写下来', '符号'] };
  /* EF.tri(parent, { state, panes:['macro','micro','sym'], h }) */
  EF.tri = function (parent, opt) {
    opt = opt || {};
    var keys = opt.panes || ['macro', 'micro', 'sym'], subs = [], state = opt.state || {}, cur = keys[0];
    var el = document.createElement('div'); el.className = 'tri';
    var tabs = document.createElement('div'); tabs.className = 'tri-tabs seg';
    tabs.innerHTML = keys.map(function (k, i) { return '<button data-k="' + k + '"' + (i ? '' : ' class="on"') + '>' + NAMES[k][0] + '<i></i></button>'; }).join('');
    el.appendChild(tabs);
    var grid = document.createElement('div'); grid.className = 'tri-grid'; el.appendChild(grid);
    var pane = {};
    keys.forEach(function (k, i) {
      var p = document.createElement('section'); p.className = 'tri-pane tri-' + k + (i ? '' : ' on');
      p.innerHTML = '<header><b>' + NAMES[k][0] + '</b><small>' + NAMES[k][1] + '</small></header>';
      var body = document.createElement('div'); body.className = 'tri-body'; if (opt.h) body.style.minHeight = opt.h + 'px';
      p.appendChild(body); grid.appendChild(p); pane[k] = body;
    });
    parent.appendChild(el);
    function show(k) {
      cur = k;
      tabs.querySelectorAll('button').forEach(function (b) { var on = b.dataset.k === k; b.classList.toggle('on', on); if (on) b.classList.remove('ping'); });
      grid.querySelectorAll('.tri-pane').forEach(function (p) { p.classList.toggle('on', p.classList.contains('tri-' + k)); });
      /* 刚显示的窗口里,画布按新宽度重排 */
      setTimeout(function () { window.dispatchEvent(new Event('resize')); }, 0);
    }
    tabs.querySelectorAll('button').forEach(function (b) { b.onclick = function () { EF.play('tick'); show(b.dataset.k); }; });
    var o = {
      el: el, pane: pane, state: state, show: show,
      /* 订阅:fn(state, changedKeys, src) */
      on: function (fn) { subs.push(fn); fn(state, Object.keys(state), 'init'); return o; },
      /* 改状态:src 为发起的窗口名;其余窗口的标签在手机上亮小点 */
      set: function (patch, src) {
        var ch = [];
        Object.keys(patch).forEach(function (k) { if (state[k] !== patch[k]) { state[k] = patch[k]; ch.push(k); } });
        if (!ch.length) return o;
        subs.forEach(function (fn) { fn(state, ch, src || ''); });
        if (getComputedStyle(tabs).display !== 'none') keys.forEach(function (k) { if (k !== cur && k !== src) { var b = tabs.querySelector('[data-k="' + k + '"]'); if (b) b.classList.add('ping'); } });
        el.classList.remove('pulse'); void el.offsetWidth; if (!EF.reduced) el.classList.add('pulse');
        return o;
      }
    };
    return o;
  };
})();
