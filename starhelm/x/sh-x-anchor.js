/* 天枢 Starhelm 2.0 · C2.7a 目标锚点卡(SHXAN)
 * 王磊 10-29 11:43:「目标选择定位的锚点按钮除了航图还有右边的快捷窗口……有时候选着不注意就去了别的目标,
 *   在 Armilla 智能球上面弹出目标锚点,方便用户知晓,出发时就渐隐。」
 * - 任何入口锁定 / 更换目标时(航图、快捷目的地、目录、星空点选、星空标签、键盘 T、星域页航图),
 *   在 Armilla 球正上方弹一张小卡:中英名、类型、距离、来源入口;换目标时显示「已切换 旧 → 新」并闪一下。
 * - 卡里「出发」是锁定后的出发入口之一(与航行规划「出发」、G 自动驾驶同一套流程);点火倒计时 / 跃迁 / 自动驾驶开始时渐隐。
 * - 避让:放在 Armilla 球上方;字幕显示时再往上让到字幕上方;不进入屏幕中部(准星)。手机缩成一行。
 * - 减少动态:无动画,直接显示 / 隐藏。
 */
(function () {
  'use strict';
  var X = null, card = null, cur = null, prev = null, tm = 0, hideT = 0;
  function rm() { return matchMedia('(prefers-reduced-motion: reduce)').matches; }
  function css() {
    if (document.getElementById('xan-css')) return; var s = document.createElement('style'); s.id = 'xan-css';
    s.textContent = [
      '#xan{position:absolute;left:50%;bottom:210px;transform:translate(-50%,8px);z-index:6;min-width:250px;max-width:min(420px,86vw);pointer-events:auto;padding:8px 12px 9px;border-radius:12px;',
      'font:12px/1.45 "Noto Sans SC",system-ui,sans-serif;color:#dce8f8;background:linear-gradient(180deg,rgba(14,22,38,.92),rgba(6,10,20,.92));border:1px solid rgba(240,201,122,.55);',
      'box-shadow:0 0 0 1px rgba(0,0,0,.55),0 0 18px rgba(240,201,122,.18),0 8px 26px rgba(0,0,0,.5);opacity:0;transition:opacity .35s,transform .35s,bottom .25s}',
      '#xan.on{opacity:1;transform:translate(-50%,0)}#xan.out{opacity:0;transform:translate(-50%,-6px);transition:opacity .9s,transform .9s;pointer-events:none}',
      '#xan:after{content:"";position:absolute;left:50%;bottom:-7px;width:12px;height:12px;margin-left:-6px;transform:rotate(45deg);background:#070c18;border-right:1px solid rgba(240,201,122,.55);border-bottom:1px solid rgba(240,201,122,.55)}',
      '#xan .h{display:flex;align-items:center;gap:8px;font-size:10.5px;letter-spacing:.14em;color:#f0c97a}#xan .h .x{padding:0 6px;line-height:16px;border:0;background:none;color:#8fa3c2;font-size:15px}#xan .h i{font-style:normal;margin-left:auto;padding:1px 7px;border-radius:9px;background:rgba(127,214,255,.12);border:1px solid rgba(127,214,255,.3);color:#9fdcff;letter-spacing:.04em}',
      '#xan .sw{display:none;margin:3px 0 1px;font-size:11.5px;color:#ffd27a}#xan.chg .sw{display:block}#xan .sw s{color:#8fa3c2}',
      '#xan .n{margin-top:2px;font-size:16px;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#xan .n small{font-size:11px;color:#8fa3c2;margin-left:6px}',
      '#xan .m{color:#a9bad3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#xan .m b{color:#7fd6ff;font-weight:500}',
      '#xan .r{display:flex;gap:6px;margin-top:6px}#xan button{font:inherit;cursor:pointer;border-radius:8px;padding:4px 12px;border:1px solid rgba(127,214,255,.35);background:rgba(127,214,255,.08);color:#dce8f8}',
      '#xan button.go{flex:1;border-color:rgba(240,201,122,.7);background:rgba(240,201,122,.16);color:#ffe2a0;font-weight:600;letter-spacing:.2em}#xan button.go[disabled]{opacity:.5;cursor:default}',
      '#xan.flash{animation:xanf .9s ease-out 1}@keyframes xanf{0%{box-shadow:0 0 0 2px #ffd27a,0 0 36px rgba(255,210,122,.75)}100%{box-shadow:0 0 0 1px rgba(0,0,0,.55),0 0 18px rgba(240,201,122,.18)}}',
      '@media (max-width:640px),(max-height:420px){#xan{min-width:0;max-width:calc(100vw - 16px);padding:5px 6px 5px 10px;border-radius:18px;display:flex;align-items:center;gap:6px;white-space:nowrap}',
      '#xan .h span,#xan .h i,#xan .m,#xan .sw,#xan.chg .sw{display:none}#xan .n{margin:0;font-size:13px;flex:1;min-width:0}#xan .n small{display:none}#xan .src{display:inline!important;font-size:10.5px;color:#9fdcff;margin-left:2px}',
      '#xan .r{margin:0}#xan .h{order:3}#xan button{padding:3px 9px}#xan button.go{letter-spacing:.06em}#xan:after{display:none}}',
      '#xan .src{display:none}',
      '@media (prefers-reduced-motion:reduce){#xan,#xan.out{transition:none}#xan.flash{animation:none}#xan.chg{border-color:#ffd27a}}'
    ].join('');
    document.head.appendChild(s);
  }
  var LY = 9.4607304725808e12, AU = 149597870.7;
  function fd(km) {
    if (!(km >= 0)) return '—'; if (km < 1) return '就在附近';
    if (km < 1e4) return Math.round(km).toLocaleString() + ' km'; if (km < 1e8) return (km / 1e4).toFixed(km < 1e6 ? 1 : 0) + ' 万 km';
    if (km < 0.05 * LY) return (km / AU < 10 ? (km / AU).toFixed(2) : Math.round(km / AU).toLocaleString()) + ' AU';
    var l = km / LY; return (l < 100 ? l.toFixed(2) : l < 1e6 ? Math.round(l).toLocaleString() : (l / 1e4 >= 1e4 ? (l / 1e8).toFixed(1) + ' 亿' : Math.round(l / 1e4).toLocaleString() + ' 万')) + ' 光年';
  }
  function dist(b) {
    if (!b) return null; if (b.far) return b.km;
    var S = X && X._ && X._.S, p = b.wp; if (!S || !p) return null;
    return Math.max(0, Math.hypot(p[0] - S.pos[0], p[1] - S.pos[1], p[2] - S.pos[2]) - (b.R || 0) * (b.id === 'sun' ? 6 : 4));
  }
  function place() {
    if (!card) return; var R = X._.root && X._.root(); if (!R) return;
    var mob = matchMedia('(max-width:640px),(max-height:420px)').matches, orb = R.querySelector('#xa-orb'), sub = R.querySelector('#xa-sub'), rr = R.getBoundingClientRect();
    var bot = mob ? 100 : 210;
    if (orb) { var o = orb.getBoundingClientRect(); if (o.height) bot = rr.bottom - o.top + (mob ? 6 : 12); card.style.left = (o.left + o.width / 2 - rr.left) + 'px'; }
    if (sub && sub.classList.contains('on') && sub.textContent) { var q = sub.getBoundingClientRect(); if (q.height && q.top < rr.bottom - bot + 4 && q.bottom > rr.bottom - bot - card.offsetHeight) bot = Math.max(bot, rr.bottom - q.top + 10); }
    var maxB = rr.height / 2 - 70; if (!mob && bot > maxB) bot = maxB;   // 不进入屏幕中部(准星)
    card.style.bottom = bot + 'px';
  }
  function info() {
    var b = cur.b, d = dist(b);
    return { zh: b.zh || b.id, en: b.en || '', type: b.type || '', d: d };
  }
  function paint(chg) {
    var i = info();
    card.querySelector('.n').innerHTML = esc(i.zh) + (i.en ? '<small>' + esc(i.en) + '</small>' : '') + '<span class="src">· ' + esc(cur.src) + '</span>';
    card.querySelector('.m').innerHTML = esc(i.type) + ' · 距离 <b>' + fd(i.d) + '</b>' + (cur.b.far ? ' · 自地球' : '');
    card.querySelector('.h i').textContent = '来自 ' + cur.src;
    var sw = card.querySelector('.sw'); sw.innerHTML = chg && prev ? '已切换 <s>' + esc(prev) + '</s> → <b>' + esc(i.zh) + '</b>' : '';
    card.classList.toggle('chg', !!(chg && prev));
    var go = card.querySelector('.go'); go.disabled = false; go.textContent = cur.b.far ? '规划 · 即将开放' : (i.d != null && i.d < 1 ? '已在附近' : '出发');
    if (i.d != null && i.d < 1 && !cur.b.far) go.disabled = true;
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function build() {
    var R = X._.root && X._.root(); if (!R) return null; css();
    if (card && card.parentNode === R) return card; if (card) card.remove();
    card = document.createElement('div'); card.id = 'xan'; card.setAttribute('role', 'status'); card.setAttribute('aria-live', 'polite');
    card.innerHTML = '<div class="h"><span>◎ 目标锁定 · TARGET LOCK</span><i></i><button type="button" class="x" aria-label="收起锚点卡">×</button></div><div class="sw"></div><div class="n"></div><div class="m"></div>' +
      '<div class="r"><button type="button" class="go">出发</button></div>';
    card.querySelector('.x').onclick = function () { hide(true); };
    card.querySelector('.go').onclick = depart;
    R.appendChild(card); return card;
  }
  function depart() {
    if (!cur) return; var b = cur.b;
    if (b.id === 'tmpdso' && b.key && window.SHXDV) { SHXDV.fly(b.key); return; }
    if (b.id === 'tmpstar') { if (window.SHXS && SHXS.mode) SHXS.mode('boost'); else X._.S.capV = 0; X._.autopilot(true); return; }
    if (window.SHXS && SHXS.depart) { SHXS.depart(b.id); return; }
    X._.autopilot(true);
  }
  function lock(b, src, changed) {
    X = window.SHXC; if (!X || !b || !build()) return;
    if (cur && cur.zh !== b.zh) changed = true;   // 临时航点槽同一 id 换了天体也算切换
    prev = changed && cur ? cur.zh : null;
    cur = { b: b, src: src, zh: b.zh, t: performance.now() };
    clearTimeout(hideT); card.classList.remove('out', 'flash'); card.style.display = '';
    paint(changed); place();
    if (rm()) card.classList.add('on');
    else { void card.offsetWidth; card.classList.add('on'); if (changed && prev) card.classList.add('flash'); }
    clearInterval(tm); tm = setInterval(function () { if (!card || !cur || !card.classList.contains('on')) return; var dd = card.querySelector('.m b'); if (dd) dd.textContent = fd(dist(cur.b)); place(); }, 1000);
  }
  function hide(now) {
    if (!card) return; clearInterval(tm); clearTimeout(hideT);
    if (now || rm()) { card.classList.remove('on', 'out', 'flash'); card.style.display = 'none'; return; }
    if (!card.classList.contains('on')) return;
    card.classList.add('out'); hideT = setTimeout(function () { if (card) { card.classList.remove('on', 'out', 'flash'); card.style.display = 'none'; } }, 950);
  }
  function fade() { hide(false); }
  window.SHXAN = { lock: lock, fade: fade, hide: function () { hide(true); }, state: function () { return { on: !!(card && card.classList.contains('on') && card.style.display !== 'none' && !card.classList.contains('out')), id: cur && cur.b.id, zh: cur && cur.b.zh, src: cur && cur.src, prev: prev }; } };
  (function hook(n) { if (window.SHXC && SHXC.on) { SHXC.on(function (ev) { if (ev === 'close') hide(true); }); return; } if (n < 200) setTimeout(function () { hook(n + 1); }, 100); })(0);
})();
