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
      '#xs-port .xpf{position:absolute;left:4vw;right:4vw;top:52px;bottom:168px;border-radius:26px;pointer-events:none;box-shadow:0 0 0 200vmax rgba(4,8,16,.6),inset 0 0 0 1px rgba(160,220,255,.25),inset 0 0 60px rgba(90,170,255,.10);background:linear-gradient(160deg,rgba(150,210,255,.07),rgba(255,255,255,0) 30%,rgba(255,255,255,0) 70%,rgba(180,120,255,.06))}' +
      '#xs-port .xpf svg{position:absolute;inset:-3px;width:calc(100% + 6px);height:calc(100% + 6px);overflow:visible}#xs-port .xpf rect{fill:none}#xs-port .xpf .rim{stroke:url(#xpf-g);stroke-width:2;filter:drop-shadow(0 0 6px rgba(127,214,255,.6))}' +
      '#xs-port .xpf .fl{stroke-linecap:round;mix-blend-mode:screen;animation:xpfF 7s linear infinite}#xs-port .xpf .f1{stroke:#f4fdff;stroke-width:3;stroke-dasharray:110 890;filter:drop-shadow(0 0 4px #fff) drop-shadow(0 0 12px #3fd0ff)}#xs-port .xpf .f2{stroke:#f6c8ff;stroke-width:2.6;stroke-dasharray:70 930;animation-delay:-1.75s;filter:drop-shadow(0 0 5px #e070ff) drop-shadow(0 0 14px #b44cff)}#xs-port .xpf .f3{stroke:#ffe6a8;stroke-width:2.6;stroke-dasharray:70 930;animation-delay:-3.5s;filter:drop-shadow(0 0 5px #ffb347) drop-shadow(0 0 14px #ff7a3d)}#xs-port .xpf .f4{stroke:#c8ffe8;stroke-width:2.4;stroke-dasharray:60 940;animation-delay:-5.25s;filter:drop-shadow(0 0 5px #4dffb8) drop-shadow(0 0 14px #ff5fa8)}' +
      '@keyframes xpfF{from{stroke-dashoffset:0}to{stroke-dashoffset:-1000}}@media (prefers-reduced-motion:reduce){#xs-port .xpf .fl{animation:none;display:none}}' +
      '#xs-port .xpf i{position:absolute;width:22px;height:22px;border:2px solid rgba(240,201,122,.85);filter:drop-shadow(0 0 4px rgba(240,201,122,.6))}#xs-port .xpf i.a{left:-6px;top:-6px;border-right:0;border-bottom:0;border-radius:12px 0 0 0}#xs-port .xpf i.b{right:-6px;top:-6px;border-left:0;border-bottom:0;border-radius:0 12px 0 0}#xs-port .xpf i.c{left:-6px;bottom:-6px;border-right:0;border-top:0;border-radius:0 0 0 12px}#xs-port .xpf i.d{right:-6px;bottom:-6px;border-left:0;border-top:0;border-radius:0 0 12px 0}' +
      '#xs-port .tag{z-index:2;top:22px!important;text-shadow:0 0 8px rgba(127,214,255,.8)}' +
      '#xs-port .xp{background:linear-gradient(180deg,rgba(14,26,46,.55),rgba(6,12,24,.62))!important;-webkit-backdrop-filter:blur(6px) saturate(1.3);backdrop-filter:blur(6px) saturate(1.3)}' +
      '#xs-port .xp.l{left:calc(4vw + 18px)}#xs-port .xp.r{right:calc(4vw + 18px)}' +
      '#xs-port .xp h5{margin:0 0 2px;font-size:10px;letter-spacing:.24em;color:#7fd6ff;font-weight:500;display:flex;justify-content:space-between;cursor:default}#xs-port .xp h5 b{color:#f0c97a;font-weight:500;letter-spacing:.12em}' +
      '#xs-port .xp h4{margin:2px 0 8px;font-size:17px;font-weight:600;color:#f3f7ff;letter-spacing:.04em}#xs-port .xp h4 small{font-size:10.5px;color:#8fa3c2;font-weight:400;margin-left:6px;letter-spacing:.1em}' +
      '#xs-port .xp .kv{display:flex;justify-content:space-between;gap:10px;padding:3px 0;border-bottom:1px dashed rgba(127,214,255,.1)}#xs-port .xp .kv span{color:#8fa3c2;white-space:nowrap}#xs-port .xp .kv b{font:500 12px "JetBrains Mono",ui-monospace,monospace;color:#e8f0fb;text-align:right}' +
      '#xs-port .xp .bar{height:4px;border-radius:2px;background:rgba(127,214,255,.12);margin:8px 0 2px;overflow:hidden}#xs-port .xp .bar i{display:block;height:100%;background:linear-gradient(90deg,#7fd6ff,#f0c97a)}' +
      '#xs-port .xp .sm{display:none}@media (max-width:900px),(max-height:560px){#xs-port .xp .sm{display:block;font:11px "JetBrains Mono",ui-monospace,monospace;color:#e8f0fb;margin-top:2px}#xs-port .xp.r.fold h5:after{content:"展开 ▴";color:#8fa3c2;letter-spacing:.1em}#xs-port .xp.r:not(.fold) h5:after{content:"收起 ▾";color:#8fa3c2}}' +
      '#xs-port .xp .bl{margin-top:8px;color:#b9c6dc;font-size:11.5px}#xs-port .xp .nt{margin-top:8px;font-size:10.5px;color:#8fa3c2}#xs-port .xp .nt em{font-style:normal;color:#0a0d14;background:#f0c97a;border-radius:3px;padding:0 5px;margin-right:6px;font-size:10px}' +
      '@media (max-width:900px),(max-height:560px){#xs-port .xpf{left:8px;right:8px;top:48px;bottom:118px;border-radius:20px}#xs-port .xp{top:auto;transform:none;bottom:130px;width:auto;left:18px;right:18px;max-height:34vh;overflow:auto;padding:9px 12px}#xs-port .xp.l{display:none}#xs-port .xp.r h5{cursor:pointer}#xs-port .xp.r.fold .bd{display:none}#xs-port.st .xp.l{display:block;bottom:auto;top:64px}}';
    document.head.appendChild(s);
  }
  function kv(k, v) { return '<div class="kv"><span>' + k + '</span><b>' + v + '</b></div>'; }
  function build() {
    root = X._.root(); P = root && root.querySelector('#xs-port'); if (!P) return false; if (P.querySelector('.xp.l')) { L = P.querySelector('.xp.l'); Rt = P.querySelector('.xp.r'); return true; } css();
    var fr = el('div', 'xpf', '<i class="a"></i><i class="b"></i><i class="c"></i><i class="d"></i><svg aria-hidden="true"><defs><linearGradient id="xpf-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5fe1ff"/><stop offset=".35" stop-color="#b46cff"/><stop offset=".55" stop-color="#ff6ad5"/><stop offset=".75" stop-color="#ffb347"/><stop offset="1" stop-color="#5fe1ff"/></linearGradient></defs><rect class="rim" x="3" y="3" rx="26" pathLength="1000"/><rect class="fl f1" x="3" y="3" rx="26" pathLength="1000"/><rect class="fl f2" x="3" y="3" rx="26" pathLength="1000"/><rect class="fl f3" x="3" y="3" rx="26" pathLength="1000"/><rect class="fl f4" x="3" y="3" rx="26" pathLength="1000"/></svg>');
    P.insertBefore(fr, P.firstChild); var lay = function () { var rt = P.getBoundingClientRect(), mt = rt.bottom; ['#xa-orb', '#xa-dock', '#xa-sub'].forEach(function (q) { var e = document.querySelector(q); if (e && e.offsetParent !== null) { var r = e.getBoundingClientRect(); if (r.height > 0 && r.top > rt.top + rt.height * .5) mt = Math.min(mt, r.top); } }); fr.style.bottom = Math.max(96, Math.round(rt.bottom - mt + 14)) + 'px'; var w = fr.clientWidth, h = fr.clientHeight, r = innerWidth <= 900 ? 20 : 26; fr.querySelectorAll('rect').forEach(function (e) { e.setAttribute('width', Math.max(0, w)); e.setAttribute('height', Math.max(0, h)); e.setAttribute('rx', r); }); }; P._lay = lay; lay(); setTimeout(lay, 50);
    L = el('div', 'xp l'); Rt = el('div', 'xp r' + (innerWidth <= 900 || innerHeight <= 560 ? ' fold' : '')); P.appendChild(L); P.appendChild(Rt);
    Rt.addEventListener('click', function (e) { if (e.target.closest('h5') && innerWidth <= 900) Rt.classList.toggle('fold'); });
    return true;
  }
  function f0(b) { return b.zh + ' · '; }
  function deg(r) { return (r * 180 / Math.PI).toFixed(1) + '°'; }
  function upd() {
    root = X._.root(); if (!root || !root.classList.contains('port')) return; if (!P || !L || !P.isConnected) { P = null; if (!build()) return; }
    if (P._lay) P._lay();
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
