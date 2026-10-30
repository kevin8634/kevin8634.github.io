/* 天枢 C2.10b · 「航行」入口提示 + 星舰图标(王磊 10-30 09:22)
 * 进入天枢页面后,在顶栏「航行」按钮旁出现 Tips:点「航行」登上天枢号,开始宇宙航行;按钮图标由 🚀 换成天枢号剪影(SVG)。
 * - 等按钮真正露出(没有开场/载入层挡住)才出现;12 s 后淡出,点 × / 点按钮 / 进驾驶舱即关闭。
 * - 不存任何数据;减少动态时不做脉冲。 */
(function () {
  'use strict';
  var SHIP = '<svg class="sh-voy-ship" viewBox="0 0 32 20" width="26" height="17" aria-hidden="true" focusable="false">' +
    '<path d="M2 10 L7 5.2 H19 L23 7 H26 V13 H23 L19 14.8 H7 Z" fill="rgba(127,214,255,.16)" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/>' +
    '<path d="M4.6 10 L8 7.2 H13 M4.6 10 L8 12.8 H13" fill="none" stroke="#b48cff" stroke-width="1" stroke-linecap="round"/>' +
    '<path d="M12 5.2 L14 2.6 H18 L19 5.2" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linejoin="round"/>' +
    '<rect x="26" y="6" width="3.2" height="3" rx="1" fill="currentColor"/><rect x="26" y="11" width="3.2" height="3" rx="1" fill="currentColor"/>' +
    '<circle cx="30.4" cy="7.5" r="1.1" fill="#f0c97a"/><circle cx="30.4" cy="12.5" r="1.1" fill="#f0c97a"/></svg>';
  function css() {
    if (document.getElementById('sh-voytip-css')) return;
    var s = document.createElement('style'); s.id = 'sh-voytip-css';
    s.textContent =
      '.sh-btn-voy .le-btn__ico{width:28px}.sh-btn-voy .sh-voy-ship{display:block;color:#7fd6ff;filter:drop-shadow(0 0 4px rgba(127,214,255,.8))}' +
      '.sh-btn-voy.sh-voy-hint{position:relative}.sh-btn-voy.sh-voy-hint::after{content:"";position:absolute;inset:-5px;border:1.5px solid rgba(240,201,122,.85);border-radius:4px;pointer-events:none;animation:shvoyp 1.8s ease-out infinite}' +
      '@keyframes shvoyp{0%{opacity:.95;transform:scale(1)}100%{opacity:0;transform:scale(1.12)}}' +
      '#sh-voytip{position:fixed;z-index:60;max-width:min(300px,78vw);padding:10px 30px 10px 12px;border:1px solid rgba(127,214,255,.55);background:rgba(6,12,24,.86);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);color:#dceeff;font:13px/1.5 system-ui,"PingFang SC","Microsoft YaHei",sans-serif;border-radius:6px;box-shadow:0 0 18px rgba(127,214,255,.22);opacity:0;transform:translateY(4px);transition:opacity .45s,transform .45s;pointer-events:auto}' +
      '#sh-voytip.on{opacity:1;transform:none}#sh-voytip b{color:#f0c97a;font-weight:600}#sh-voytip .k{display:block;font-size:10px;letter-spacing:.14em;color:#7fd6ff;margin-bottom:2px}' +
      '#sh-voytip .x{position:absolute;top:4px;right:4px;width:24px;height:24px;border:0;background:none;color:#9fb4cc;font-size:16px;line-height:24px;cursor:pointer}' +
      '#sh-voytip .ar{position:absolute;width:10px;height:10px;background:inherit;border:inherit;border-width:0 1px 1px 0;transform:rotate(-45deg)}' +
      '#sh-voytip.l .ar{right:-6px;top:calc(50% - 5px)}#sh-voytip.b .ar{top:-6px;left:var(--ax,50%);transform:rotate(-135deg)}' +
      '@media (prefers-reduced-motion:reduce){.sh-btn-voy.sh-voy-hint::after{animation:none;opacity:.8}#sh-voytip{transition:none}}';
    document.head.appendChild(s);
  }
  var tip = null, btn = null, t0 = 0, iv = 0, shown = false, done = false;
  function cockpit() { try { return !!(window.SHXC && SHXC.isOpen && SHXC.isOpen()); } catch (e) { return false; } }
  function visible(b) {
    if (!b || !b.offsetParent) return false; var r = b.getBoundingClientRect(); if (r.width < 8 || r.bottom < 0 || r.top > innerHeight) return false;
    var e = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return !!(e && (e === b || b.contains(e) || (tip && tip.contains(e))));
  }
  function place() {
    var r = btn.getBoundingClientRect(), tw = tip.offsetWidth, th = tip.offsetHeight, left = r.left - tw - 14;
    if (left > 8) { tip.className = 'on l'; tip.style.left = left + 'px'; tip.style.top = Math.max(8, r.top + r.height / 2 - th / 2) + 'px'; }
    else { var x = Math.min(innerWidth - tw - 8, Math.max(8, r.left + r.width / 2 - tw / 2)); tip.className = 'on b'; tip.style.left = x + 'px'; tip.style.top = (r.bottom + 12) + 'px'; tip.style.setProperty('--ax', (r.left + r.width / 2 - x - 5) + 'px'); }
  }
  function close() {
    if (done) return; done = true; clearInterval(iv); if (btn) btn.classList.remove('sh-voy-hint');
    if (tip) { tip.classList.remove('on'); var t = tip; setTimeout(function () { if (t.parentNode) t.remove(); }, 500); }
  }
  function show() {
    shown = true; t0 = performance.now(); btn.classList.add('sh-voy-hint');
    tip = document.createElement('div'); tip.id = 'sh-voytip'; tip.setAttribute('role', 'note');
    tip.innerHTML = '<span class="k">TIPS · 提示</span>点 <b>「航行」</b> 登上天枢号,开始宇宙航行<button type="button" class="x" aria-label="关闭提示">×</button><i class="ar"></i>';
    document.body.appendChild(tip); tip.querySelector('.x').onclick = close; place();
  }
  function loop() {
    if (done) return;
    if (!btn || !btn.isConnected) btn = document.querySelector('.sh-btn-voy');
    if (!btn) return;
    if (!btn.querySelector('.sh-voy-ship')) { var ic = btn.querySelector('.le-btn__ico'); if (ic) ic.innerHTML = SHIP; btn.addEventListener('click', close); }
    if (cockpit()) { if (shown) close(); return; }
    if (!shown) { if (visible(btn)) show(); return; }
    if (!btn.offsetParent) { tip.classList.remove('on'); return; }
    place();
    if (performance.now() - t0 > 12000) close();
  }
  css(); iv = setInterval(loop, 400);
  addEventListener('resize', function () { if (tip && !done) place(); });
  window.SHXVT = { close: close, state: function () { return { shown: shown, done: done }; } };
})();
