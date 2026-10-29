/* 天枢 C2.6a · Esc 分层:先关最上层的视图 / 卡片,没有可关的东西时才交给驾驶舱(弹「结束探索」确认)。
 * 本文件最先加载,它在 window 捕获阶段的 keydown 监听排在驾驶舱(打开时才注册)之前。
 * 层级(数字越大越先关):深空视图 100 › 抵达报告 80 › 星体/深空资料卡 70 › 讲解卡 60 › 手机目录抽屉 50。
 * 驾驶舱自己的确认框 #xe-dlg 在最上层,存在时本模块让出,由驾驶舱处理。其他模块可用 SHXESC.reg() 追加层。 */
(function () {
  'use strict';
  var L = [];
  function reg(id, prio, isOpen, close) { L = L.filter(function (x) { return x.id !== id; }); L.push({ id: id, p: prio, on: isOpen, close: close }); L.sort(function (a, b) { return b.p - a.p; }); }
  function q(s) { return document.querySelector(s); }
  function vis(e) { return !!(e && e.isConnected && e.getClientRects().length); }
  reg('dsoview', 100, function () { return !!(window.SHXDV && SHXDV.isOpen()); }, function () { SHXDV.close(); });
  reg('arrive', 80, function () { return vis(q('#xr-rep')); }, function () { if (window.SHXR) SHXR.hide(); });
  reg('card', 70, function () { return vis(q('#xk-card')); }, function () { if (window.SHXK) SHXK.hide(); });
  reg('explain', 60, function () { return !!(window.SHXE && SHXE.cur && SHXE.cur()); }, function () { SHXE.hide(); });
  reg('catalog', 50, function () { var r = q('#shxc'); return !!(r && r.classList.contains('xg-cat')); }, function () { q('#shxc').classList.remove('xg-cat'); });
  function top() { for (var i = 0; i < L.length; i++) { try { if (L[i].on()) return L[i]; } catch (e) { } } return null; }
  addEventListener('keydown', function (e) {
    if (e.key !== 'Escape' || e.isComposing) return;
    if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName || '')) return;   // 搜索框自己处理 Esc(清空并失焦)
    if (window.SHXT && SHXT.on && SHXT.on()) return;                               // 导览中 Esc = 打断导览
    var d = q('#xe-dlg'); if (d && d.isConnected) return;                            // 确认框在最上层,交给驾驶舱
    var t = top(); if (!t) return;                                                  // 没有可关的 → 交给驾驶舱
    e.preventDefault(); e.stopImmediatePropagation();
    try { t.close(); } catch (er) { console.warn('[SHXESC]', t.id, er); }
  }, true);
  window.SHXESC = { reg: reg, top: function () { var t = top(); return t ? t.id : null; } };
})();
