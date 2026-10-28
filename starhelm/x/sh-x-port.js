/* 天枢 C2.4b · 侧舷窗座舱双面板:左窗环绕状态,右窗目标资料(SHXI 共用数据源);手机为底部抽屉 */
(function () {
  'use strict';
  var X, root, P, L, Rt, last = 0, lastId = null;
  function el(t, c, h) { var e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; }
  function css() {
    if (document.getElementById('xp-css')) return; var s = el('style'); s.id = 'xp-css';
    s.textContent = '#xs-port .xp{position:absolute;top:50%;transform:translateY(-50%);width:min(268px,22vw);pointer-events:auto;padding:12px 14px 12px;color:#d6e2f4;font:12px/1.5 "Noto Sans SC",system-ui,sans-serif;' +
      'background:linear-gradient(180deg,rgba(14,22,36,.88),rgba(6,10,18,.9));border:1px solid rgba(127,214,255,.22);border-radius:10px;box-shadow:0 0 0 1px rgba(0,0,0,.6),inset 0 0 24px rgba(127,214,255,.05),0 10px 30px rgba(0,0,0,.5)}' +
      '#xs-port .xp:before,#xs-port .xp:after{content:"";position:absolute;width:14px;height:14px;border:2px solid rgba(240,201,122,.7)}#xs-port .xp:before{left:-1px;top:-1px;border-right:0;border-bottom:0;border-radius:10px 0 0 0}#xs-port .xp:after{right:-1px;bottom:-1px;border-left:0;border-top:0;border-radius:0 0 10px 0}' +
      '#xs-port .xp.l{left:max(18px,3vw)}#xs-port .xp.r{right:max(18px,3vw)}' +
      '#xs-port .xp h5{margin:0 0 2px;font-size:10px;letter-spacing:.24em;color:#7fd6ff;font-weight:500;display:flex;justify-content:space-between;cursor:default}#xs-port .xp h5 b{color:#f0c97a;font-weight:500;letter-spacing:.12em}' +
      '#xs-port .xp h4{margin:2px 0 8px;font-size:17px;font-weight:600;color:#f3f7ff;letter-spacing:.04em}#xs-port .xp h4 small{font-size:10.5px;color:#8fa3c2;font-weight:400;margin-left:6px;letter-spacing:.1em}' +
      '#xs-port .xp .kv{display:flex;justify-content:space-between;gap:10px;padding:3px 0;border-bottom:1px dashed rgba(127,214,255,.1)}#xs-port .xp .kv span{color:#8fa3c2;white-space:nowrap}#xs-port .xp .kv b{font:500 12px "JetBrains Mono",ui-monospace,monospace;color:#e8f0fb;text-align:right}' +
      '#xs-port .xp .bar{height:4px;border-radius:2px;background:rgba(127,214,255,.12);margin:8px 0 2px;overflow:hidden}#xs-port .xp .bar i{display:block;height:100%;background:linear-gradient(90deg,#7fd6ff,#f0c97a)}' +
      '#xs-port .xp .sm{display:none}@media (max-width:900px),(max-height:560px){#xs-port .xp .sm{display:block;font:11px "JetBrains Mono",ui-monospace,monospace;color:#e8f0fb;margin-top:2px}#xs-port .xp.r.fold h5:after{content:"展开 ▴";color:#8fa3c2;letter-spacing:.1em}#xs-port .xp.r:not(.fold) h5:after{content:"收起 ▾";color:#8fa3c2}}' +
      '#xs-port .xp .bl{margin-top:8px;color:#b9c6dc;font-size:11.5px}#xs-port .xp .nt{margin-top:8px;font-size:10.5px;color:#8fa3c2}#xs-port .xp .nt em{font-style:normal;color:#0a0d14;background:#f0c97a;border-radius:3px;padding:0 5px;margin-right:6px;font-size:10px}' +
      '@media (max-width:900px),(max-height:560px){#xs-port .xp{top:auto;transform:none;bottom:96px;width:auto;left:10px;right:10px;max-height:34vh;overflow:auto;padding:9px 12px}#xs-port .xp.l{display:none}#xs-port .xp.r h5{cursor:pointer}#xs-port .xp.r.fold .bd{display:none}#xs-port.st .xp.l{display:block;bottom:auto;top:64px}}';
    document.head.appendChild(s);
  }
  function kv(k, v) { return '<div class="kv"><span>' + k + '</span><b>' + v + '</b></div>'; }
  function build() {
    root = X._.root(); P = root && root.querySelector('#xs-port'); if (!P) return false; if (P.querySelector('.xp.l')) { L = P.querySelector('.xp.l'); Rt = P.querySelector('.xp.r'); return true; } css();
    L = el('div', 'xp l'); Rt = el('div', 'xp r' + (innerWidth <= 900 || innerHeight <= 560 ? ' fold' : '')); P.appendChild(L); P.appendChild(Rt);
    Rt.addEventListener('click', function (e) { if (e.target.closest('h5') && innerWidth <= 900) Rt.classList.toggle('fold'); });
    return true;
  }
  function f0(b) { return b.zh + ' · '; }
  function deg(r) { return (r * 180 / Math.PI).toFixed(1) + '°'; }
  function upd() {
    root = X._.root(); if (!root || !root.classList.contains('port')) return; if (!P || !L || !P.isConnected) { P = null; if (!build()) return; }
    var S = X._.S, o = window.SHXS && SHXS.orbitState && SHXS.orbitState(), id = o && o.id || S.target, b = X._.BY[id]; if (!b) return;
    var fk = X._.fkm, fd = X._.fdur;
    if (o && o.r) {
      var r = o.r, v = Math.sqrt(b.GM / r), per = 2 * Math.PI * Math.sqrt(r * r * r / b.GM), p = b.wp, rel = [S.pos[0] - p[0], S.pos[1] - p[1], S.pos[2] - p[2]], rl = Math.hypot(rel[0], rel[1], rel[2]) || 1;
      var lat = Math.asin(rel[1] / rl), lon = Math.atan2(rel[0], rel[2]), k = (o.ang / (2 * Math.PI)) % 1;
      L.innerHTML = '<h5>环绕状态 <b>ORBIT</b></h5><h4>' + b.zh + '<small>卫星式巡航</small></h4>' + kv('轨道高度', fk(Math.max(0, r - b.R))) + kv('轨道半径', fk(r)) + kv('轨道速度(圆)', SHXI.sig(v, 3) + ' km/s') + kv('真实周期', fd(per)) +
        kv('下方纬度', (lat >= 0 ? 'N ' : 'S ') + deg(Math.abs(lat))) + kv('下方经度', (lon >= 0 ? 'E ' : 'W ') + deg(Math.abs(lon))) + '<div class="bar"><i style="width:' + (k * 100).toFixed(1) + '%"></i></div>' +
        '<div class="nt">巡航一周 ' + (k * 100).toFixed(0) + '% · 演示时长已压缩;经纬为黄道坐标,未计自转</div>';
    } else {
      var d = b.wp ? Math.hypot(b.wp[0] - S.pos[0], b.wp[1] - S.pos[1], b.wp[2] - S.pos[2]) : 0;
      L.innerHTML = '<h5>环绕状态 <b>APPROACH</b></h5><h4>' + b.zh + '<small>接近中</small></h4>' + kv('距离', fk(d)) + kv('当前速度', SHXI.sig(S.base, 3) + ' km/s') + kv('入轨距离', fk(b.R * 40)) + '<div class="nt">Armilla 接管 · 抵达后自动转入卫星式巡航</div>';
    }
    var sm = o && o.r ? '高度 ' + fk(Math.max(0, o.r - b.R)) + ' · ' + SHXI.sig(Math.sqrt(b.GM / o.r), 3) + ' km/s · 周期 ' + fd(2 * Math.PI * Math.sqrt(o.r * o.r * o.r / b.GM)) : '接近 ' + b.zh;
    if (lastId !== id) {
      lastId = id; var f = window.SHXI && SHXI.facts(id); if (!f) return;
      Rt.innerHTML = '<h5>目标资料 · ' + (f.type || 'TARGET') + '</h5><div class="sm"></div><div class="bd"><h4>' + f.zh + '<small>' + f.en + '</small></h4>' + f.rows.slice(0, 8).map(function (r) { return kv(r[0], r[1]); }).join('') +
        (f.blurb ? '<div class="bl">' + f.blurb + '</div>' : '') + '<div class="nt"><em>' + f.nature + '</em>' + f.src + '</div></div>';
    }
    var se = Rt.querySelector('.sm'); if (se) se.textContent = f0(b) + sm;
  }
  function hook(ev) { if (ev === 'open') { lastId = null; } else if (ev === 'frame') { var t = performance.now(); if (t - last > 400) { last = t; try { upd(); } catch (e) { if (window.console) console.warn('[port]', e); } } } }
  (function wait(n) { if (window.SHXC && SHXC.on) { X = SHXC; SHXC.on(hook); return; } if (n < 100) setTimeout(function () { wait(n + 1); }, 100); })(0);
  window.SHXP = { refresh: function () { lastId = null; upd(); } };
})();
