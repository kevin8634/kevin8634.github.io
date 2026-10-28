/* 天枢 2.0 · x/sh-x-layout.js —— C2.2b 窗口避让(王磊 10-28 16:25:窗口不要重叠,用渐隐、收起按钮避免遮挡)
 * 1.0 视图里右侧停靠的任务面板(.ml--dock)加「收起 / 展开」按钮:收起后只留标题栏;
 * 目标信息卡打开时任务面板自动收起并渐隐,鼠标移上去恢复;收起状态按任务记在本次会话。 */
(function () {
  'use strict';
  var K = 'gn:sh:x-dockfold:';
  function key(r) { var b = r.querySelector('.ml-hd b'); return K + (r.className.match(/ml--(?!dock)[\w-]+/) || [''])[0] + (b ? b.textContent.slice(0, 12) : ''); }
  function arm(r) {
    if (r.__xl) return; r.__xl = 1;
    var hd = r.querySelector('.ml-hd'); if (!hd) return;
    var bt = document.createElement('button'); bt.type = 'button'; bt.className = 'xl-fold';
    var x = hd.querySelector('.ml-x'); hd.insertBefore(bt, x || null);
    function set(f) { r.classList.toggle('is-fold', f); bt.textContent = f ? '展开 ▾' : '收起 ▴'; bt.setAttribute('aria-expanded', String(!f)); bt.title = f ? '展开任务面板' : '收起任务面板,只留标题'; try { sessionStorage.setItem(key(r), f ? '1' : '0'); } catch (e) { } }
    var f0 = false; try { f0 = sessionStorage.getItem(key(r)) === '1'; } catch (e) { }
    set(f0);
    bt.onclick = function (e) { e.stopPropagation(); set(!r.classList.contains('is-fold')); r.classList.add('xl-pin'); };
    hd.addEventListener('dblclick', function (e) { if (e.target.closest('button')) return; set(!r.classList.contains('is-fold')); r.classList.add('xl-pin'); });
  }
  function scan() { document.querySelectorAll('.ml.ml--dock').forEach(arm); }
  function card() { var c = document.querySelector('#card'); var on = !!(c && c.classList.contains('is-open')); document.body.classList.toggle('xl-card', on); if (!on) document.querySelectorAll('.ml--dock.xl-pin').forEach(function (r) { r.classList.remove('xl-pin'); }); }
  // 面板上沿:按钮行与视图圆环(#shx-nav)两者中更低的那个之下(窄屏时圆环会伸到面板上方)
  function top() {
    var d = document.querySelector('.ml.ml--dock:not([hidden])'); if (!d) return;
    var a = document.querySelector('.le-actions'), n = document.querySelector('#shx-nav'), y = 0, dr = d.getBoundingClientRect();
    if (a) { var ra = a.getBoundingClientRect(); if (ra.height) y = ra.bottom; }
    if (n && getComputedStyle(n).display !== 'none') { var rn = n.getBoundingClientRect(); if (rn.height && rn.right > dr.left - 8 && rn.left < dr.right && rn.top < innerHeight / 2) y = Math.max(y, rn.bottom); }
    if (y) document.documentElement.style.setProperty('--xl-top', Math.round(y + 8) + 'px');
  }
  function go() { scan(); card(); top(); addEventListener('resize', function () { setTimeout(top, 80); }); setInterval(top, 1500); new MutationObserver(function (m) { var s = false, c = false; m.forEach(function (x) { if (x.type === 'childList') s = true; else c = true; }); if (s) { scan(); top(); } card(); }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
})();
