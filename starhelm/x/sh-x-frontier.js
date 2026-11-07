/* 天枢 Starhelm 2.0 · 天枢号航行「前沿速递」(v1.0-M4r,2026-11-07;总指挥指令_2026-11-07_前沿速递)
 * 数据:../sh-frontier-data.js(window.SH_FRONTIER,数据驱动,加一条只改数据)。
 * - HUD 入口「前沿速递」(桌面:左上任务时间面板按钮行;手机:底部按钮行;无 WebGL/驾驶舱未开:页面左下浮动按钮)。
 * - 每条:飞抵观察(锁定目标 + 自动驾驶,抵达后打开该天体详情卡;减少动态效果时直接切到目标旁)/ 阅读资讯(一手机构页,新标签)/ 特别展。
 * - 天体详情卡(SHXC 星空标签资料卡)挂「前沿速递」段:SHXFR.cardHtml(id) 由 sh-x-cockpit.js lblCard 调用。
 * 不联网、不收集数据;时间一律北京时间。 */
(function () {
  'use strict';
  var SH = window.SH = window.SH || {};
  function L() { return (window.SH_FRONTIER || []).slice().sort(function (a, b) { return b.t - a.t; }); }
  function p2(n) { return ('0' + n).slice(-2); }
  function bj(ms) { var d = new Date(ms + 8 * 3600e3); return d.getUTCFullYear() + '-' + p2(d.getUTCMonth() + 1) + '-' + p2(d.getUTCDate()) + ' ' + p2(d.getUTCHours()) + ':' + p2(d.getUTCMinutes()); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function reduced() { return matchMedia('(prefers-reduced-motion: reduce)').matches; }
  function base() { return location.pathname.replace(/\/x\/?(index\.html)?$/, '/'); }   // /starhelm/
  function X() { return window.SHXC; }
  function canFly(it) { var x = X(); return !!(it.target && x && window.THREE && x._ && x._.BY && x._.BY[it.target]); }   // 驾驶舱没开时先登舰再飞
  function live(it) {
    if (it.live === 'lightday' && SH.lightday && SH.lightday.state) {
      var now = Date.now(), s = SH.lightday.state(now);
      if (s.before) { var r = Math.floor(-s.dt / 1000), d = Math.floor(r / 86400); r -= d * 86400; return '倒计时 ' + d + ' 天 ' + p2(Math.floor(r / 3600)) + ':' + p2(Math.floor(r % 3600 / 60)) + ':' + p2(r % 60); }
      return '已越过一光日 ' + Math.floor(s.dt / 864e5) + ' 天';
    }
    var dd = (it.t - Date.now()) / 864e5; return dd > 0 ? '还有 ' + Math.ceil(dd) + ' 天' : '已过 ' + Math.floor(-dd) + ' 天';
  }
  function acts(it, inCard) {
    return (!inCard && it.target ? '<button type="button" data-fr="fly" data-id="' + it.id + '"' + (canFly(it) ? '' : ' disabled title="这台设备开不了 3D 驾驶舱(需要 WebGL)"') + '>◎ 飞抵观察</button>' : '') +
      (it.lab ? '<button type="button" data-fr="lab" data-id="' + it.id + '">' + (it.target ? '' : '◎ ') + esc(it.labLabel || '打开观察') + '</button>' : '') +
      (it.url ? '<a href="' + esc(it.url) + '" target="_blank" rel="noopener">阅读资讯 ↗</a>' : '') +
      (it.special ? '<a href="' + esc(base() + it.special.href) + '" data-fr="sp">' + esc(it.special.label) + '</a>' : '');
  }
  var css = '#xfr{position:fixed;left:50%;transform:translateX(-50%);top:116px;z-index:2300;width:min(360px,calc(100vw - 24px));max-height:calc(100vh - 140px);overflow:auto;background:rgba(8,14,28,.9);border:1px solid rgba(240,201,122,.45);border-radius:12px;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);color:#e8eef8;font:14px/1.5 "Noto Sans SC","PingFang SC","Microsoft YaHei",sans-serif;padding:10px 12px;box-shadow:0 0 24px rgba(240,201,122,.18)}' +
    '#xfr[hidden]{display:none}#xfr h4{margin:0 0 6px;display:flex;justify-content:space-between;align-items:center;color:#f0c97a;font-size:15px;letter-spacing:.04em}#xfr h4 button{background:none;border:0;color:#9aa8bf;font-size:18px;cursor:pointer}' +
    '#xfr .it{border-top:1px solid rgba(160,180,220,.18);padding:8px 0}#xfr .d{font:12px ui-monospace,Menlo,Consolas,monospace;color:#9aa8bf}#xfr .t{font-weight:700;color:#fff3d6;margin:1px 0}#xfr .l{font-size:12.5px;color:#c9d6e8}#xfr .lv{font:12px ui-monospace,Menlo,Consolas,monospace;color:#ffe6a8;margin-top:2px}' +
    '.xfr-a{display:flex;gap:6px;flex-wrap:wrap;margin-top:6px}.xfr-a button,.xfr-a a{font:inherit;font-size:12.5px;padding:4px 9px;border-radius:8px;border:1px solid rgba(240,201,122,.5);background:rgba(240,201,122,.12);color:#fff0cc;cursor:pointer;text-decoration:none}.xfr-a button[disabled]{opacity:.45;cursor:default}' +
    '#xfr .s{font-size:10.5px;color:#7f93ad;margin-top:6px}#xfr-fab{position:fixed;left:14px;bottom:14px;z-index:320;font:13px "Noto Sans SC","PingFang SC",sans-serif;padding:7px 12px;border-radius:10px;border:1px solid rgba(240,201,122,.55);background:rgba(8,14,28,.82);color:#ffe6a8;cursor:pointer}' +
    '.xfr-btn{color:#ffe6a8!important;border-color:rgba(240,201,122,.6)!important}.xfr-btn i{font-style:normal;display:inline-block;min-width:14px;margin-left:4px;padding:0 3px;border-radius:7px;background:#f0c97a;color:#1a1408;font-size:10.5px;line-height:14px}' +
    '.xfr-card{margin-top:8px;padding:7px 9px;border-radius:9px;border:1px solid rgba(240,201,122,.45);background:rgba(240,201,122,.08)}.xfr-card .c{color:#f0c97a;font-size:12px;letter-spacing:.06em}.xfr-card .t{font-weight:700;color:#fff3d6;font-size:13.5px}' +
    '.xfr-card .r{display:flex;justify-content:space-between;gap:8px;font-size:12px;color:#c9d6e8}.xfr-card .r b{color:#fff;font-weight:600;text-align:right}.xfr-card .lv{font:12px ui-monospace,Menlo,Consolas,monospace;color:#ffe6a8;margin-top:2px}' +
    'body.xfr-on #shx-exit{visibility:hidden}' +
    '@media (max-width:640px){#xfr{left:8px;right:8px;width:auto;transform:none;top:96px;max-height:calc(100vh - 250px)}}';
  var P = null, TM = 0, pend = null;
  function ensureCss() { if (!document.getElementById('xfr-css')) { var s = document.createElement('style'); s.id = 'xfr-css'; s.textContent = css; document.head.appendChild(s); } }
  function render() {
    if (!P) return;
    P.innerHTML = '<h4><span>✦ 前沿速递</span><button type="button" data-fr="x" aria-label="关闭">×</button></h4>' + L().map(function (it) {
      return '<div class="it"><div class="d">' + bj(it.t) + '(北京时间)</div><div class="t">' + esc(it.title) + '</div><div class="l">' + esc(it.line) + '</div><div class="lv" data-lv="' + it.id + '">' + live(it) + '</div><div class="xfr-a">' + acts(it) + '</div></div>';
    }).join('') + '<div class="s">资讯链接为一手机构页面,在新标签打开;本页不收集任何数据。</div>';
  }
  function tick() {
    document.querySelectorAll('[data-lv]').forEach(function (e) { var it = byId(e.getAttribute('data-lv')); if (it) e.textContent = live(it); });
    if (!document.querySelector('[data-lv]')) { clearInterval(TM); TM = 0; }
  }
  function byId(id) { return (window.SH_FRONTIER || []).filter(function (x) { return x.id === id; })[0]; }
  function open() {
    ensureCss();
    if (!P) { P = document.createElement('div'); P.id = 'xfr'; P.setAttribute('role', 'dialog'); P.setAttribute('aria-label', '前沿速递'); document.body.appendChild(P); P.addEventListener('click', onClick); }
    render(); P.hidden = false; document.body.classList.add('xfr-on'); if (!TM) TM = setInterval(tick, 1000);
  }
  function close() { if (P) P.hidden = true; document.body.classList.remove('xfr-on'); }   // 11-07 11:38 王磊:居中显示,开着时隐藏 body 层「结束探索」,不遮挡左侧 HUD
  function toggle() { if (P && !P.hidden) close(); else open(); }
  function onClick(e) {
    var b = e.target.closest('[data-fr]'); if (!b) return; var k = b.getAttribute('data-fr'), it = byId(b.getAttribute('data-id'));
    if (k === 'x') return close();
    if (k === 'fly' && it) { e.preventDefault(); fly(it); }
    if (k === 'lab' && it && SH[it.lab] && SH[it.lab].open) { close(); SH[it.lab].open(); }
  }
  function fly(it) {
    var x = X(); if (!canFly(it)) return;
    close();
    if (!x.isOpen()) {   // 先进入天枢号驾驶舱(登舰),就位后再飞
      if (window.SHXV && SHXV.go) SHXV.go('fly'); else x.open();
      var n = 0, iv = setInterval(function () { if (x.isOpen() && x._.root && x._.root() && x._.root().style.display !== 'none') { clearInterval(iv); setTimeout(function () { fly(it); }, 1200); } else if (++n > 300) clearInterval(iv); }, 200);
      return;
    }
    x.setTarget(it.target, '前沿速递');
    if (!x.jumpTo) { pend = it.target; x.autopilot(true); return; }
    var S = x._.S, p0 = S.pos.slice(); x.jumpTo(it.target);
    if (reduced()) { arriveCard(it.target); return; }   // 减少动态:直接切到目标旁,不做长飞行
    // 远距天体(旅行者号在 170 多 AU 外)按真实速度要飞很多年:做一次时间压缩的跃迁 —— 机头先对准目标,位置按对数距离在 3.5 秒内收拢
    var p1 = S.pos.slice(), tp = x._.BY[it.target].wp || p1, d0 = Math.max(1, Math.hypot(p0[0] - tp[0], p0[1] - tp[1], p0[2] - tp[2])), d1 = Math.max(1, Math.hypot(p1[0] - tp[0], p1[1] - tp[1], p1[2] - tp[2]));
    var u0 = [(p0[0] - tp[0]) / d0, (p0[1] - tp[1]) / d0, (p0[2] - tp[2]) / d0], u1 = [(p1[0] - tp[0]) / d1, (p1[1] - tp[1]) / d1, (p1[2] - tp[2]) / d1];
    S.pos = p0.slice(); var t0 = performance.now(), MS = 3500;
    if (x._.toast) x._.toast('前沿速递 · 跃迁至 ' + x._.BY[it.target].zh + '(时间已压缩)');
    (function step() {
      var k = Math.min(1, (performance.now() - t0) / MS), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      var dd = Math.exp(Math.log(d0) + (Math.log(d1) - Math.log(d0)) * e), u = [u0[0] + (u1[0] - u0[0]) * e, u0[1] + (u1[1] - u0[1]) * e, u0[2] + (u1[2] - u0[2]) * e], ul = Math.hypot(u[0], u[1], u[2]) || 1;
      var tq = x._.BY[it.target].wp || tp; S.auto = false; S.base = 0; S.mult = 1;
      S.pos = [tq[0] + u[0] / ul * dd, tq[1] + u[1] / ul * dd, tq[2] + u[2] / ul * dd];
      if (k < 1) requestAnimationFrame(step); else { x.jumpTo(it.target); if (x._.toast) x._.toast('已抵达 ' + x._.BY[it.target].zh + ' 附近'); arriveCard(it.target); }
    })();
  }
  function arriveCard(id) { var x = X(); pend = null; setTimeout(function () { if (window.SHXE && SHXE.cur && SHXE.cur() && SHXE.hide) SHXE.hide(); if (x && x.card) x.card(id); var c = document.getElementById('xs-lcard'); if (c) { c.style.transform = 'none'; c.style.left = Math.max(8, (innerWidth - c.offsetWidth) / 2) + 'px'; c.style.top = Math.max(8, Math.min(innerHeight - c.offsetHeight - 8, (innerHeight - c.offsetHeight) / 2)) + 'px'; } }, 900); }   // 航段讲解卡让位;详情卡居中
  document.addEventListener('click', function (e) { var b = e.target.closest && e.target.closest('.xfr-card [data-fr=lab]'); if (!b) return; var it = byId(b.getAttribute('data-id')); if (it && SH[it.lab] && SH[it.lab].open) { var c = document.getElementById('xs-lcard'); if (c) c.remove(); SH[it.lab].open(); } }, true);
  function cardHtml(id) {
    var its = L().filter(function (it) { return it.target === id; }); if (!its.length) return '';
    ensureCss(); if (!TM) TM = setInterval(tick, 1000);
    return its.map(function (it) {
      return '<div class="xfr-card"><div class="c">✦ 前沿速递 · ' + bj(it.t).slice(0, 10) + '</div><div class="t">' + esc(it.title) + '</div>' +
        (it.card || []).map(function (r) { return '<div class="r"><span>' + esc(r[0]) + '</span><b>' + esc(r[1]) + '</b></div>'; }).join('') +
        '<div class="lv" data-lv="' + it.id + '">' + live(it) + '</div><div class="xfr-a">' + acts(it, true) + '</div></div>';
    }).join('');
  }
  function hud() {   // 驾驶舱 HUD 入口
    var x = X(), r = x && x._ && x._.root && x._.root(); if (!r) return;
    ensureCss(); var n = L().length;
    var row = r.querySelector('#xc-exit') && r.querySelector('#xc-exit').parentNode;
    if (row && !row.querySelector('.xfr-btn')) { var b = document.createElement('button'); b.type = 'button'; b.className = 'btn xfr-btn'; b.innerHTML = '前沿速递<i>' + n + '</i>'; b.onclick = function (e) { e.stopPropagation(); toggle(); }; row.insertBefore(b, row.firstChild); }
    var mob = r.querySelector('.mob');
    if (mob && !mob.querySelector('.xfr-btn')) { var m = document.createElement('button'); m.type = 'button'; m.className = 'btn xfr-btn'; m.textContent = '速递'; m.onclick = function (e) { e.stopPropagation(); toggle(); }; mob.appendChild(m); }
    var f = document.getElementById('xfr-fab'); if (f) f.hidden = true;
  }
  function fab() {   // 驾驶舱没开 / 无 WebGL:页面左下浮动入口,列表与外链照常可用
    if (document.getElementById('xfr-fab')) return; ensureCss();
    var f = document.createElement('button'); f.id = 'xfr-fab'; f.type = 'button'; f.textContent = '✦ 前沿速递'; f.onclick = toggle; document.body.appendChild(f);
  }
  function hook() {
    var x = X(); if (!x || !x.on) return false;
    x.on(function (ev, a) {
      if (ev === 'open') setTimeout(hud, 50);
      if (ev === 'close') { var f = document.getElementById('xfr-fab'); if (f) f.hidden = false; close(); }
      if (ev === 'arrive' && pend && a && a.id === pend) arriveCard(a.id);
    });
    if (x.isOpen && x.isOpen()) hud();
    return true;
  }
  function init() {
    fab(); if (X() && X().isOpen && X().isOpen()) hud();
    if (!hook()) { var n = 0, iv = setInterval(function () { if (hook() || ++n > 200) clearInterval(iv); }, 150); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  window.SHXFR = { list: L, open: open, close: close, toggle: toggle, cardHtml: cardHtml, fly: function (id) { var it = byId(id); if (it) fly(it); } };
})();
