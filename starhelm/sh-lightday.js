/* 天枢 Starhelm · 特别展「旅行者 1 号 · 一光日」(v1.0-M4p,2026-11)
 * 挂在任务 sh.voyager(「旅行者号此刻飞到哪了?」)面板顶部;深链 ?task=voyager(id 不变)。
 * 事实(NASA science.nasa.gov/mission/voyager/where-are-they-now,总指挥 11-07 核对):
 *   2026-11-18 5:16:07 a.m. EST = 北京时间 11-18 18:16:07,旅行者 1 号距地球 16.094 billion miles(约 259.02 亿 km)= 一光日;
 *   首个达到此距离的人造物体;一来一回通信约 48 小时;1977-09-05 发射;2012 年进入星际空间;速度约 61,155 km/h。
 *   NASA 活动「Shine Bright for Voyager's Light-Day」:11-17 日落后对天用灯光闪 V-G-R 摩尔斯码。
 * 此刻距离 = 一光日 ± 速度 × 时间差 的线性粗估(相对太阳的速度,未计地球公转带来的小幅起伏),画面注明。
 * 互动:点按发送「VGR」摩尔斯码。灯光闪烁;声音默认关,可手动打开(WebAudio 本机合成);减少动态效果时只亮不闪。不收集任何数据,不联网。
 * 不用 NASA logo,无外部图片。 */
(function () {
  'use strict';
  var SH = window.SH = window.SH || {};
  var T = Date.UTC(2026, 10, 18, 10, 16, 7);           // 北京时间 2026-11-18 18:16:07
  var CAST_END = Date.UTC(2026, 10, 25, 16, 0, 0);      // 播报置顶至北京时间 11-25 当天结束
  var LD_KM = 25902068371, V_KMH = 61155;               // 一光日(km)、速度(km/h)
  var MORSE = [['V', '...-'], ['G', '--.'], ['R', '.-.']], UNIT = 200;
  var LIGHT = [['太阳', 500, '8 分 20 秒'], ['冥王星', 19700, '约 5.5 小时'], ['旅行者 1 号', 86400, '24 小时']];
  function reduced() { return window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches; }
  function p2(n) { return ('0' + n).slice(-2); }
  function h(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }

  var css = '.ld{margin:2px 0 10px;padding:10px 12px;border-radius:12px;border:1px solid rgba(255,210,122,.38);background:linear-gradient(160deg,rgba(255,210,122,.10),rgba(127,214,255,.05))}' +
    '.ld small{display:block;color:#ffd27a;letter-spacing:.06em;font-size:11px}.ld b.ld-t{display:block;font-size:15px;color:#fff3d6;margin:2px 0 6px}' +
    '.ld-cd{font:600 22px/1.2 ui-monospace,Menlo,Consolas,monospace;color:#ffe6a8;letter-spacing:.03em}.ld-cd i{font-style:normal;font-size:12px;opacity:.7;margin:0 4px 0 1px}' +
    '.ld-sub{font-size:12px;color:#cfe;opacity:.85;margin:3px 0 8px}' +
    '.ld-row{display:grid;grid-template-columns:5.2em 1fr 5.6em;gap:6px;align-items:center;font-size:11.5px;color:#dfe9f6;margin:3px 0}' +
    '.ld-bar{height:6px;border-radius:3px;background:rgba(255,255,255,.08);overflow:hidden;position:relative}.ld-bar span{position:absolute;left:0;top:0;bottom:0;border-radius:3px;background:linear-gradient(90deg,#7fd6ff,#ffd27a)}' +
    '.ld-row em{font-style:normal;text-align:right;color:#ffd27a}.ld-cap{font-size:10.5px;opacity:.55;margin:1px 0 8px}' +
    '.ld-mo{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.ld-lamp{width:30px;height:30px;border-radius:50%;background:#2a2f3a;border:1px solid rgba(255,230,168,.4);flex:none;transition:background .04s,box-shadow .04s}' +
    '.ld-lamp.on{background:#fff3c4;box-shadow:0 0 18px 6px rgba(255,220,140,.75)}' +
    '.ld-mo button{padding:6px 10px;border-radius:9px;border:1px solid rgba(255,210,122,.5);background:rgba(255,210,122,.12);color:#fff3d6;cursor:pointer;font-size:12.5px}' +
    '.ld-mo button[aria-pressed="true"]{background:rgba(255,210,122,.32)}.ld-code{font:600 14px ui-monospace,Menlo,Consolas,monospace;color:#cfe;letter-spacing:.12em}.ld-code span.cur{color:#ffe6a8;text-shadow:0 0 8px #ffd27a}' +
    '.ld-act{font-size:11.5px;color:#dfe9f6;opacity:.8;margin-top:6px}.ld-src{font-size:10.5px;opacity:.5;margin-top:4px}';

  var U = null, tick = 0, sending = false, sound = false, ac = null;
  function build() {
    if (!document.getElementById('ld-css')) { var s = h('style'); s.id = 'ld-css'; s.textContent = css; document.head.appendChild(s); }
    var r = U = h('div', 'ld');
    r.innerHTML = '<small>特别展 · 2026 年 11 月</small><b class="ld-t">旅行者 1 号 · 一光日</b>' +
      '<div class="ld-cd"></div><div class="ld-sub"></div>' +
      '<div class="ld-rows"></div><div class="ld-cap">光从那里出发到地球要走多久(条长按对数刻度)</div>' +
      '<div class="ld-mo"><div class="ld-lamp" aria-hidden="true"></div><button class="ld-send" type="button">✦ 发送 VGR</button><button class="ld-snd" type="button" aria-pressed="false">声音 关</button><span class="ld-code"></span></div>' +
      '<div class="ld-act">NASA 邀请大家 11 月 17 日日落后对着天空用灯光闪出 V-G-R(…- / --. / .-.),向旅行者号致意。</div>' +
      '<div class="ld-src">资料:NASA 旅行者任务页(Where Are They Now)。此刻距离按速度约 61,155 km/h 线性粗估。本页不收集任何数据。</div>';
    var rows = r.querySelector('.ld-rows'), lmax = Math.log10(86400);
    LIGHT.forEach(function (x) {
      var w = Math.max(6, Math.log10(x[1]) / lmax * 100);
      rows.appendChild(h('div', 'ld-row', '<span>' + x[0] + '</span><div class="ld-bar"><span style="width:' + w.toFixed(1) + '%"></span></div><em>' + x[2] + '</em>'));
    });
    U.cd = r.querySelector('.ld-cd'); U.sub = r.querySelector('.ld-sub'); U.lamp = r.querySelector('.ld-lamp'); U.code = r.querySelector('.ld-code');
    U.code.innerHTML = MORSE.map(function (m, i) { return '<span data-i="' + i + '">' + m[0] + ' ' + m[1].replace(/\./g, '·').replace(/-/g, '–') + '</span>'; }).join('  ');
    r.querySelector('.ld-send').onclick = send;
    var sb = r.querySelector('.ld-snd');
    sb.onclick = function () { sound = !sound; sb.setAttribute('aria-pressed', String(sound)); sb.textContent = '声音 ' + (sound ? '开' : '关'); };
    return r;
  }
  function state(now) {
    var dt = now - T, km = LD_KM + V_KMH * dt / 3600e3;
    return { before: dt < 0, dt: dt, km: km, lh: km / 1079252848.8 };
  }
  function draw() {
    if (!U || !U.isConnected) return;
    var now = Date.now(), S = state(now);
    if (S.before) {
      var s = Math.floor(-S.dt / 1000), d = Math.floor(s / 86400); s -= d * 86400;
      U.cd.innerHTML = d + '<i>天</i>' + p2(Math.floor(s / 3600)) + '<i>时</i>' + p2(Math.floor(s % 3600 / 60)) + '<i>分</i>' + p2(s % 60) + '<i>秒</i>';
      U.sub.textContent = '到 11 月 18 日 18:16:07(北京时间),它离地球就有一光日:光要走整整一天。此刻约 ' + (S.km / 1e8).toFixed(1) + ' 亿 km,光走约 ' + S.lh.toFixed(2) + ' 小时。';
    } else {
      var dd = Math.floor(S.dt / 864e5);
      U.cd.innerHTML = '已越过一光日 ' + dd + '<i>天</i>';
      U.sub.textContent = '2026 年 11 月 18 日 18:16:07(北京时间),它成为第一个飞到一光日外的人造物体。此刻约 ' + (S.km / 1e8).toFixed(1) + ' 亿 km,光走约 ' + S.lh.toFixed(2) + ' 小时,一问一答要两天多。';
    }
  }
  function beep(on) {
    if (!sound) return;
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      if (on) { var o = ac.createOscillator(), g = ac.createGain(); o.frequency.value = 660; g.gain.value = 0.0001; o.connect(g); g.connect(ac.destination); o.start(); g.gain.exponentialRampToValueAtTime(0.12, ac.currentTime + 0.01); beep.o = o; beep.g = g; }
      else if (beep.o) { beep.g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.02); beep.o.stop(ac.currentTime + 0.03); beep.o = null; }
    } catch (e) { }
  }
  function send() {
    if (sending || !U) return; sending = true;
    var seq = [];   // [亮?, 毫秒, 字母序号]
    MORSE.forEach(function (m, i) {
      m[1].split('').forEach(function (c, j) { seq.push([1, (c === '.' ? 1 : 3) * UNIT, i]); if (j < m[1].length - 1) seq.push([0, UNIT, i]); });
      if (i < MORSE.length - 1) seq.push([0, 3 * UNIT, i]);
    });
    var cur = U.code.querySelectorAll('span');
    function mark(i) { for (var k = 0; k < cur.length; k++) cur[k].classList.toggle('cur', k === i); }
    if (reduced()) {   // 只亮不闪:灯常亮,字母依次高亮
      U.lamp.classList.add('on'); var i = 0; mark(0); beep(true);
      var iv = setInterval(function () { i++; if (i < MORSE.length) { mark(i); return; } clearInterval(iv); U.lamp.classList.remove('on'); beep(false); mark(-1); sending = false; }, 900);
      return;
    }
    var k = 0;
    (function step() {
      if (k >= seq.length) { U.lamp.classList.remove('on'); beep(false); mark(-1); sending = false; return; }
      var s = seq[k++]; mark(s[2]);
      if (s[0]) { U.lamp.classList.add('on'); beep(true); } else { U.lamp.classList.remove('on'); beep(false); }
      setTimeout(function () { if (s[0]) { U.lamp.classList.remove('on'); beep(false); } step(); }, s[1]);
    })();
  }
  function attach() {
    var root = document.querySelector('.ml--vg'); if (!root) return;
    if (!U) build();
    if (!root.contains(U)) { var g = root.querySelector('.ml-ctl') || root.querySelector('.ml-guide'); root.insertBefore(U, g); }
    draw(); if (!tick) tick = setInterval(draw, 1000);
  }
  function hook() {
    var L = SH.voyagerLab; if (!L || L._ld) return !!(L && L._ld);
    var o = L.open; L.open = function () { var r; try { r = o.apply(this, arguments); } catch (e) { var v = document.querySelector('.ml--vg'); if (v) v.hidden = false; } try { attach(); } catch (e) { } return r; }; L._ld = 1; return true;
  }
  if (!hook()) { var n = 0, iv = setInterval(function () { if (hook() || ++n > 120) clearInterval(iv); }, 250); }
  // 无 WebGL 降级:3D 场景画不出来时,深链 ?task=voyager 仍直接打开面板,特别展照常可用
  function noGL() { try { var c = document.createElement('canvas'); return !(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return true; } }
  if (/[?&]task=voyager\b/.test(location.search) && noGL()) setTimeout(function () { if (!document.querySelector('.ld') && SH.voyagerLab) SH.voyagerLab.open(); }, 2500);
  SH.lightday = { T: T, CAST_END: CAST_END, state: state, active: function () { return Date.now() < CAST_END; }, send: send };
})();
