/* 天枢 C2.4c · 抵达报告:飞抵任一航点后弹出座舱风格报告卡(数据来自 SHXI,与侧舷窗右窗同源)
 * 只展示已有数据与由已有数据直接推算的量(宜居带按光度估算、轨道速度按 GM),不编造。 */
(function () {
  'use strict';
  var X, card = null, tm = 0;
  function el(t, c, h) { var e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; }
  function css() {
    if (document.getElementById('xr-css')) return; var s = el('style'); s.id = 'xr-css';
    s.textContent = '#xr-rep{position:absolute;left:50%;bottom:150px;transform:translate(-50%,12px);opacity:0;width:min(560px,calc(100vw - 24px));z-index:30;pointer-events:auto;color:#d6e2f4;font:12px/1.5 "Noto Sans SC",system-ui,sans-serif;' +
      'background:linear-gradient(180deg,rgba(14,22,36,.93),rgba(6,10,18,.95));border:1px solid rgba(127,214,255,.25);border-radius:12px;padding:12px 16px 12px;box-shadow:0 12px 40px rgba(0,0,0,.6),inset 0 0 30px rgba(127,214,255,.05);transition:opacity .5s,transform .5s}' +
      '.xr-old{position:absolute;left:50%;bottom:150px;transform:translate(-50%,12px);opacity:0;transition:opacity .5s,transform .5s;pointer-events:none}#xr-rep.in{opacity:1;transform:translate(-50%,0)}#xr-rep:before{content:"";position:absolute;left:16px;right:16px;top:0;height:2px;background:linear-gradient(90deg,transparent,#f0c97a,transparent)}' +
      '#xr-rep .hd{display:flex;align-items:center;justify-content:space-between;font-size:10px;letter-spacing:.26em;color:#7fd6ff}#xr-rep .hd b{color:#f0c97a;font-weight:500}#xr-rep .xr-x{background:none;border:0;color:#8fa3c2;font-size:18px;cursor:pointer;line-height:1;padding:0 2px}' +
      '#xr-rep h3{margin:4px 0 8px;font-size:20px;color:#f3f7ff;font-weight:600}#xr-rep h3 small{font-size:11px;color:#8fa3c2;font-weight:400;margin-left:8px;letter-spacing:.1em}' +
      '#xr-rep .gr{display:grid;grid-template-columns:1fr 1fr;gap:0 18px}#xr-rep .kv{display:flex;justify-content:space-between;gap:8px;padding:3px 0;border-bottom:1px dashed rgba(127,214,255,.1)}#xr-rep .kv span{color:#8fa3c2;white-space:nowrap}#xr-rep .kv b{font:500 12px "JetBrains Mono",ui-monospace,monospace;color:#e8f0fb;text-align:right}' +
      '#xr-rep .sec{margin:9px 0 3px;font-size:10px;letter-spacing:.22em;color:#7fd6ff}#xr-rep .bl{margin-top:8px;color:#b9c6dc}#xr-rep .nt{margin-top:8px;font-size:10.5px;color:#8fa3c2}#xr-rep .nt em{font-style:normal;color:#0a0d14;background:#f0c97a;border-radius:3px;padding:0 5px;margin-right:6px;font-size:10px}' +
      '@media (max-width:900px),(max-height:560px){#xr-rep{bottom:110px;max-height:46vh;overflow:auto;padding:10px 12px}#xr-rep .gr{grid-template-columns:1fr}#xr-rep h3{font-size:17px}}';
    document.head.appendChild(s);
  }
  function kv(k, v) { return '<div class="kv"><span>' + k + '</span><b>' + v + '</b></div>'; }
  function hide() { clearTimeout(tm); if (!card) return; var c = card; card = null; c.id = ''; c.classList.add('xr-old'); c.classList.remove('in'); setTimeout(function () { c.remove(); }, 500); }
  function show(id) {
    var f = window.SHXI && SHXI.facts(id), b = X._.BY[id], root = X._.root(); if (!f || !b || !root) return; css(); hide();
    var extra = '', sec = '基本资料';
    if (b.star) {
      sec = '恒星';
      if (b.L) { var L = b.L, hi = Math.sqrt(L / 1.1), ho = Math.sqrt(L / 0.53); extra = '<div class="sec">宜居带(按光度估算)</div><div class="gr">' + kv('内缘', fmtAU(hi)) + kv('外缘', fmtAU(ho)) + kv('光度', SHXI.sig(L, 3) + ' 个太阳') + kv('相当于', L < 0.05 ? '比水星轨道更近' : L > 5 ? '在火星轨道以外' : '与地球轨道相近') + '</div>'; }
    } else if (b.craft) sec = '任务时间线 · 当前状态';
    else if (b.comet) sec = '彗星';
    else if (b.GM && b.R > 1) {
      var vc = Math.sqrt(b.GM / (b.R * 2)), ve = Math.sqrt(2 * b.GM / b.R);
      extra = '<div class="sec">入轨参数(推算)</div><div class="gr">' + kv('表面逃逸速度', SHXI.sig(ve, 3) + ' km/s') + kv('2 倍半径圆轨道速度', SHXI.sig(vc, 3) + ' km/s') + '</div>';
    }
    card = el('div'); card.id = 'xr-rep';
    card.innerHTML = '<div class="hd"><span>抵达报告 · ARRIVAL REPORT</span><span><b>' + (f.type || '') + '</b> <button class="xr-x" type="button" aria-label="关闭">×</button></span></div>' +
      '<h3>' + f.zh + '<small>' + f.en + '</small></h3><div class="sec">' + sec + '</div><div class="gr">' + f.rows.slice(0, 8).map(function (r) { return kv(r[0], r[1]); }).join('') + '</div>' + extra +
      (f.blurb ? '<div class="bl">' + f.blurb + '</div>' : '') + '<div class="nt"><em>' + f.nature + '</em>' + f.src + '</div>';
    root.appendChild(card); requestAnimationFrame(function () { if (card) card.classList.add('in'); });
    card.querySelector('.xr-x').onclick = hide;
    tm = setTimeout(hide, 16000);
  }
  function fmtAU(a) { return a < 0.1 ? (a * 149.6).toFixed(1) + ' 百万 km' : a.toFixed(2) + ' AU'; }
  function hook(ev, a) {
    if (ev === 'arrive' && a && a.id) { var id = a.id; setTimeout(function () { var S = X._.S; if (S.target === id && !S.tour) show(id); }, 1200); }
    else if (ev === 'close') hide();
  }
  (function wait(n) { if (window.SHXC && SHXC.on) { X = SHXC; SHXC.on(hook); return; } if (n < 100) setTimeout(function () { wait(n + 1); }, 100); })(0);
  addEventListener('keydown', function (e) { if (card && e.key === 'Escape') { hide(); } }, true);
  window.SHXR = { show: function (id) { show(id); }, hide: hide };
})();
