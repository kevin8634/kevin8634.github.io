/* 天枢 Starhelm 2.0 · C2.7d 「结束探索」重做(SHXEX)
 * 王磊 10-29 12:04:「结束探索按钮依旧有问题。如果修复不了就重新做它。」
 * 旧按钮(#xc-exit 在时钟面板里、手机 .mob [data-k=end])已在 C2.2b、C2.4、C2.6a 修过三轮仍有偶发点不动:
 * 它挂在驾驶舱根节点里,受自动驾驶淡出、各类卡片 / HUD / 全屏层层级、pointerup 兜底等多处状态影响,无法一次查清 → 按要求重做。
 * - 新按钮 + 确认框都挂在 <body> 最外层,z-index 2147483600,独立事件,不依赖驾驶舱状态机;只在驾驶舱打开时显示。
 * - 旧按钮隐藏并解绑;SHXC.confirmEnd(Esc 链、1.0 voyExit)改指向新确认框,全页只有一个「结束探索」。
 * - 确认后统一退出:中止跃迁 → 关深空视图 / 抵达报告 / 卡片 / 锚点卡 / 讲解卡 → 停引擎与录音 → SHXC.endExplore()(关驾驶舱 + SHXV.go 回四级视图)。
 * - 自检:每 2 s 用 elementFromPoint 查按钮中心,被遮挡就把按钮移到 body 末尾并抬层级,console.warn 记录遮挡者。
 */
(function () {
  'use strict';
  var btn = null, dlg = null, Z = 2147483600, chk = 0, warned = 0;
  function css() {
    if (document.getElementById('shx-exit-css')) return; var s = document.createElement('style'); s.id = 'shx-exit-css';
    s.textContent = '#shx-exit{position:fixed;left:16px;top:16px;z-index:' + Z + ';display:none;pointer-events:auto;font:600 13px/1 "Noto Sans SC",system-ui,sans-serif;letter-spacing:.12em;color:#ffe2a0;' +
      'padding:9px 14px;border-radius:10px;border:1px solid rgba(240,201,122,.7);background:rgba(20,14,6,.82);box-shadow:0 0 0 1px rgba(0,0,0,.6),0 0 14px rgba(240,201,122,.2);cursor:pointer;touch-action:manipulation}' +
      '#shx-exit:hover,#shx-exit:focus-visible{background:rgba(60,40,10,.92);outline:2px solid #ffd27a;outline-offset:2px}body.shx-flying #shx-exit{display:block}' +
      '#shx-exit-dlg{position:fixed;inset:0;z-index:' + (Z + 1) + ';display:grid;place-items:center;background:rgba(1,3,10,.55);pointer-events:auto}' +
      '#shx-exit-dlg .bx{width:min(420px,90vw);padding:18px 20px;border-radius:14px;background:linear-gradient(180deg,#0f1828,#070b14);border:1px solid rgba(240,201,122,.6);color:#dce8f8;font:14px/1.6 "Noto Sans SC",system-ui,sans-serif;box-shadow:0 20px 60px rgba(0,0,0,.6)}' +
      '#shx-exit-dlg .hd{font-size:17px;color:#fff;margin-bottom:6px}#shx-exit-dlg .hd small{font-size:11px;color:#8fa3c2;letter-spacing:.14em;margin-left:6px}#shx-exit-dlg .ac{display:flex;gap:10px;margin-top:14px}' +
      '#shx-exit-dlg button{flex:1;font:inherit;padding:9px 0;border-radius:10px;cursor:pointer;border:1px solid rgba(127,214,255,.4);background:rgba(127,214,255,.08);color:#dce8f8}#shx-exit-dlg button.pri{border-color:rgba(240,201,122,.8);background:rgba(240,201,122,.2);color:#ffe2a0;font-weight:600}' +
      '#shx-exit-dlg button small{opacity:.6;font-size:11px;margin-left:4px}' +
      '#shxc #xc-exit,#shxc .mob [data-k=end]{visibility:hidden!important;pointer-events:none!important}' +
      '@media (max-width:640px){#shx-exit{font-size:13px;letter-spacing:.04em}}';
    document.head.appendChild(s);
  }
  function mk() {
    css(); if (btn && btn.isConnected) return;
    btn = document.createElement('button'); btn.id = 'shx-exit'; btn.type = 'button'; btn.textContent = '结束探索'; btn.title = '结束本次探索(Esc)';
    btn.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); open(); });
    document.body.appendChild(btn);
  }
  function where() {
    try { var X = window.SHXC, S = X._.S, best = null; X._.B.forEach(function (b) { if (!b.wp || b.off) return; var d = Math.hypot(b.wp[0] - S.pos[0], b.wp[1] - S.pos[1], b.wp[2] - S.pos[2]) - (b.R || 0); if (!best || d < best.d) best = { b: b, d: d }; });
      if (best && best.d < 9.46e12 * 0.5) return best.b.zh + '附近'; var V = window.SHXDV && SHXDV.flying(); return V ? '跃迁途中' : '星际空间'; } catch (e) { return '当前位置'; }
  }
  function open() {
    if (dlg && dlg.isConnected) { document.body.appendChild(dlg); dlg.querySelector('.pri').focus(); return; }
    dlg = document.createElement('div'); dlg.id = 'shx-exit-dlg'; dlg.setAttribute('role', 'dialog'); dlg.setAttribute('aria-modal', 'true');
    dlg.innerHTML = '<div class="bx"><div class="hd">结束本次探索?<small>END EXPLORATION</small></div><p>天枢号当前位于<b>' + where() + '</b>。结束后回到星域视图,下次进入驾驶舱从这里继续。</p>' +
      '<div class="ac"><button type="button" data-a="0">继续航行<small>Esc</small></button><button type="button" class="pri" data-a="1">结束探索<small>Enter</small></button></div></div>';
    dlg.addEventListener('click', function (e) { e.stopPropagation(); var b = e.target.closest('button'); if (b) close(b.getAttribute('data-a') === '1'); else if (e.target === dlg) close(false); });
    document.body.appendChild(dlg); dlg.querySelector('.pri').focus();
    if (window.SHXC && SHXC._ && SHXC._.S) SHXC._.S.keys = {};
  }
  function close(yes) { if (dlg) { dlg.remove(); dlg = null; } if (yes) leave(); }
  function t(f) { try { f(); } catch (e) { console.warn('[SHXEX]', e); } }
  function leave() {
    t(function () { if (window.SHXDV) { if (SHXDV.flying()) SHXDV.abort(); if (SHXDV.isOpen && SHXDV.isOpen()) SHXDV.close(true); } });
    t(function () { if (window.SHXS) { SHXS.eng(null); if (SHXS.pws) SHXS.pws.stop(true); } });
    t(function () { if (window.SHXAN) SHXAN.hide(); }); t(function () { if (window.SHXE && SHXE.hide) SHXE.hide(); }); t(function () { if (window.SHXK && SHXK.hide) SHXK.hide(); });
    t(function () { document.querySelectorAll('#xr-card,.xs-card,#xk-card,#xdv-hud').forEach(function (e) { e.remove(); }); });
    t(function () { var X = window.SHXC; if (!X || !X.isOpen || !X.isOpen()) return; if (X.endExplore) X.endExplore(); else { X.close(true); if (window.SHXV) SHXV.go('solar'); } });
  }
  // 新按钮落在旧按钮的版位上(旧按钮只隐藏、保留占位),找不到旧版位时在左上角
  function place() {
    if (!btn) return; var o = document.querySelector(innerWidth <= 900 ? '#shxc .mob [data-k=end]' : '#shxc #xc-exit'), r = o && o.getBoundingClientRect();
    if (!r || !r.width) { o = document.querySelector('#shxc #xc-exit,#shxc .mob [data-k=end]'); r = o && o.getBoundingClientRect(); }
    if (r && r.width && r.height) { btn.style.left = Math.round(r.left) + 'px'; btn.style.top = Math.round(r.top) + 'px'; btn.style.width = Math.round(r.width) + 'px'; btn.style.height = Math.round(r.height) + 'px'; btn.style.right = btn.style.bottom = 'auto'; btn.style.padding = '0'; }
    else { btn.style.cssText = 'z-index:' + Z; }
  }
  function self() {   // 每 2 s 自检:按钮中心最上层是否是它自己
    if (!btn || !document.body.classList.contains('shx-flying') || dlg) return; place();
    var r = btn.getBoundingClientRect(); if (!r.width) return;
    var top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    if (top && top !== btn && !btn.contains(top)) {
      if (warned++ < 20) console.warn('[SHXEX] 结束探索按钮被遮挡:', top.id || top.className || top.tagName, '→ 已移到最上层');
      document.body.appendChild(btn); btn.style.zIndex = String(++Z);
    }
  }
  function init() {
    if (!window.SHXC) { setTimeout(init, 200); return; }
    mk(); SHXC.confirmEnd = open;   // Esc 链(sh-x-esc.js)、1.0 SH.voyExit 都走这里
    addEventListener('keydown', function (e) { if (!dlg) return; if (e.key === 'Escape') { close(false); e.preventDefault(); e.stopImmediatePropagation(); } else if (e.key === 'Enter') { close(true); e.preventDefault(); e.stopImmediatePropagation(); } }, true);
    clearInterval(chk); chk = setInterval(self, 2000); addEventListener('resize', function () { setTimeout(place, 60); });
    (function hk(n) { if (SHXC.on) SHXC.on(function (ev) { if (ev === 'open') { mk(); setTimeout(place, 50); setTimeout(place, 600); } else if (ev === 'close') close(false); }); else if (n < 50) setTimeout(function () { hk(n + 1); }, 100); })(0);
  }
  window.SHXEX = { place: place, open: open, close: close, leave: leave, check: self, btn: function () { return btn; }, isOpen: function () { return !!(dlg && dlg.isConnected); } };
  if (document.body) init(); else addEventListener('DOMContentLoaded', init);
})();
