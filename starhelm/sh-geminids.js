/* 天枢 Starhelm · 本月天象「双子座流星雨」(v1.0-M4q,2026-12;套用 M4m 狮子座模板)
 * 数据:IMO《2026 Meteor Shower Calendar》(J. Rendtel 编):活跃期 12-04—12-20;极大 2026-12-14 14h UT(λ⊙=262.2°)= 北京时间 12-14 22:00;
 *   宽极大:ZHR≥100 约持续 10–12 小时;近二十年可靠极大均落在 12-13 21h—12-14 18h UT;ZHR=150;辐射点 α=112° δ=+33°(北河二附近);V∞=35 km/s;r=2.6。
 *   日本国立天文台(NAOJ)2026-12:极大约 12-14 23 时 JST(= 北京时间 22 时);当夜月亮 21 时前后落下。
 *   母体:小行星 3200 法厄同(Phaethon),JPL SBDB 轨道 1034:a 1.271 AU,e 0.890,q 0.140 AU,i 22.31°,周期 523.7 天,直径约 6.25 km。
 * 本机计算(astronomy-engine):所选地点当夜日落/日出、天文昏影、月落、辐射点高度;位置优先「我的位置」(只存本机),否则北京。
 * 「每小时能看到几颗」为粗估示意:ZHR × sin(辐射点高度) × r^(极限星等−6.5),月亮在天上再扣极限星等。时间统一北京时间。
 * 深链 ?task=geminids;存储 gn:sh:geminids(stars[3]);声音默认关(只调 LE.audio;「听速度」按钮由用户点按才发声)。 */
(function () {
  'use strict';
  var SH = window.SH = window.SH || {};
  var KEY = 'gn:sh:geminids', TAU = Math.PI * 2, DEG = Math.PI / 180;
  var PEAK = Date.UTC(2026, 11, 14, 14, 0), MASLOV = PEAK;
  var ACT0 = Date.UTC(2026, 11, 3, 16), ACT1 = Date.UTC(2026, 11, 20, 16);   // 北京时间 12-04 00:00 — 12-21 00:00
  var RA = 112, DEC = 33, ZHR = 150, POP = 2.6, VEL = 35, VEL_LEO = 71;
  var TRAILS = [];
  var NIGHTS = [[13, '13→14 日夜'], [14, '14→15 日夜 · 极大'], [15, '15→16 日夜']];
  var SKYQ = [[6.5, '郊外暗夜'], [5.5, '乡镇'], [4.0, '城市']];
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(ST)); } catch (e) { } }
  var ST = load(); ST.stars = ST.stars || [0, 0, 0];
  function h(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function P(n) { if (window.LE && LE.audio && LE.audio.play) LE.audio.play(n); }
  function A() { return window.Astronomy; }
  function reduced() { return window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches; }
  function p2(n) { return ('0' + n).slice(-2); }
  function bjD(ms) { return new Date(ms + 8 * 3600e3); }
  function hm(ms) { var d = bjD(ms); return p2(d.getUTCHours()) + ':' + p2(d.getUTCMinutes()); }
  function md(ms) { var d = bjD(ms); return (d.getUTCMonth() + 1) + '月' + d.getUTCDate() + '日 ' + hm(ms); }
  var DIRS = ['北', '东北', '东', '东南', '南', '西南', '西', '西北'];
  function dir(az) { return DIRS[Math.round(((az % 360) + 360) % 360 / 45) % 8]; }

  var L = { n: 1, q: 0, sq: 0, t: 0.75, hints: 0 }, N = null;

  function where() {
    var c = window.LE && LE.location && LE.location.current;
    if (c && isFinite(c.lat) && isFinite(c.lng)) return { lat: c.lat, lng: c.lng, name: c.name || '我的位置', mine: 1 };
    return { lat: 39.9042, lng: 116.4074, name: '北京' };
  }
  function zhrAt(ms) { var dd = Math.abs(ms - PEAK) / 864e5; return Math.max(2, ZHR * Math.pow(2, -dd / 0.45)); }   // 宽极大:ZHR≥100 约 10–12 小时,约 0.45 天减半(示意)
  function compute() {
    var a = A(), loc = where(), ob = new a.Observer(loc.lat, loc.lng, 50), day = NIGHTS[L.n][0];
    var base = new Date(Date.UTC(2026, 11, day, 4) - loc.lng / 15 * 3600e3 + 8 * 3600e3);   // 当地中午前后
    var ss = a.SearchRiseSet(a.Body.Sun, ob, -1, a.MakeTime(base), 2), t0 = ss ? ss.date.getTime() : base.getTime() + 5 * 3600e3;
    var sr = a.SearchRiseSet(a.Body.Sun, ob, +1, a.MakeTime(new Date(t0)), 2), t1 = sr ? sr.date.getTime() : t0 + 14 * 3600e3;
    var STEP = 144, S = [], best = null, rr = null, mset = null, mrise = null, dark0 = null, dark1 = null, prevM = null;
    for (var i = 0; i <= STEP; i++) {
      var ms = t0 + (t1 - t0) * i / STEP, T = a.MakeTime(new Date(ms));
      var se = a.Equator(a.Body.Sun, T, ob, true, true), sun = a.Horizon(T, ob, se.ra, se.dec, 'normal').altitude;
      var me = a.Equator(a.Body.Moon, T, ob, true, true), mh = a.Horizon(T, ob, me.ra, me.dec, 'normal');
      var rh = a.Horizon(T, ob, RA / 15, DEC, 'normal');
      var ill = a.Illumination(a.Body.Moon, T).phase_fraction;
      var lm = SKYQ[L.sq][0] - (sun > -18 ? Math.min(4, (sun + 18) / 3) : 0) - (mh.altitude > 0 ? ill * 1.5 : 0);
      var rate = rh.altitude > 0 && sun < -18 ? zhrAt(ms) * Math.sin(rh.altitude * DEG) * Math.pow(POP, lm - 6.5) : 0;
      var s = { ms: ms, sun: sun, moon: mh.altitude, maz: mh.azimuth, ill: ill, ralt: rh.altitude, raz: rh.azimuth, rate: rate, dark: sun < -18 };
      S.push(s);
      if (rr == null && rh.altitude > 0) rr = ms;
      if (prevM && prevM.moon > 0 && mh.altitude <= 0) mset = ms;
      if (prevM && prevM.moon <= 0 && mh.altitude > 0) mrise = ms;
      if (dark0 == null && s.dark) dark0 = ms; if (s.dark) dark1 = ms;
      if (!best || rate > best.rate) best = s;
      prevM = s;
    }
    // 最佳时段:流量 ≥ 当夜最高的 70%
    var win = S.filter(function (s) { return best.rate > 0 && s.rate >= best.rate * 0.7; });
    N = { loc: loc, t0: t0, t1: t1, S: S, best: best, rr: rr, mset: mset, mrise: mrise, dark0: dark0, dark1: dark1, w0: win.length ? win[0].ms : null, w1: win.length ? win[win.length - 1].ms : null, moonUp0: S[0].moon > 0 };
  }

  /* ---------- 题目 ---------- */
  function qset() {
    return [
      { kind: 'time', q: '拖动下面的时间滑块,找出今夜(' + NIGHTS[L.n][1].replace(' · 极大', '') + ')最值得出门看的时刻,然后点「就是这时」。',
        check: function () { var s = cur(); return N.best.rate > 0 && s.rate >= N.best.rate * 0.7; },
        hint: ['看右边的流量柱:越高,每小时能看到的流星越多。', '双子座的辐射点(北河二旁边)天黑就从东北方升起,不必熬到凌晨;但它越高,流星越多。', '娥眉月早早落下,辐射点在午夜到凌晨 2 点前后最高,大约在 ' + (N.best ? hm(N.best.ms) : '午夜后') + ' 前后。'],
        good: '就是这段!双子座流星雨是少有的「前半夜就开场」的流星雨,午夜后辐射点最高,流量最大;今年月亮早落,条件极好。' },
      { kind: 'choice', q: '为什么一颗小行星也能下流星雨?', ch: ['法厄同绕太阳时离太阳只有 0.14 AU,表面被烤到七八百摄氏度,岩石受热开裂、碎屑被抛出,沿着它的轨道铺成一条碎屑带', '小行星互相撞碎后,碎块正好朝地球飞来', '法厄同其实一直在拖着彗星那样的长尾巴'], ok: 0,
        hint: ['流星雨的条件只有一个:地球每年穿过同一条「颗粒带」。谁撒下的都行。', '彗星靠冰升华把尘埃「吹」出来;法厄同几乎没有冰,得靠别的办法掉渣。', '它的近日点比水星还近,反复被烤热又冷却,岩石会热裂。'],
        good: '对!彗星像「融化的脏雪球」,冰一升华就把尘埃喷出来;法厄同是块岩石,靠被太阳反复烤裂掉渣。两种来源,地球穿过时都会下流星雨。也有天文学家叫它「岩石彗星」。' },
      { kind: 'choice', q: '双子座流星以约 35 km/s 撞进大气,狮子座流星约 71 km/s。速度慢一半,看起来会怎样?(可以先点「听速度」比一比)', ch: ['划得更慢、更从容,常常更亮、颜色更多,但很少留下发光的余迹', '因为太慢,在大气里烧不起来', '速度越慢颗数越少,所以双子座流星更少'], ok: 0,
        hint: ['两者都远超每秒 11 公里,都会在一百公里高空烧起来。', '速度决定一颗流星在天上停留多久、烧得多猛。', '狮子座流星快到能把空气电离,常留下余迹;双子座的颗粒更致密、走得慢,划过的时间更长。'],
        good: '对!35 km/s 也是子弹的 40 倍,但比狮子座慢一半:双子座流星走得从容、亮、颜色多,适合拍照;颗数多少则看 ZHR,双子座约 150,是狮子座的 10 倍。' }];
  }
  var AC = null;
  function hear() {   // 声音即规律:速度映射音高(35 → 330 Hz,71 → 670 Hz),仅在用户点按时发声
    try {
      AC = AC || new (window.AudioContext || window.webkitAudioContext)(); var t = AC.currentTime;
      [[VEL, 0], [VEL_LEO, 1.0]].forEach(function (v) {
        var o = AC.createOscillator(), g = AC.createGain(); o.type = 'sine'; o.frequency.value = v[0] * 9.43; o.connect(g); g.connect(AC.destination);
        var t0 = t + v[1], d = 0.75; g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.14, t0 + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t0 + d); o.start(t0); o.stop(t0 + d + 0.05);
      });
    } catch (e) { }
  }

  /* ---------- 界面 ---------- */
  var U = {}, QS = [], RAF = 0, MET = [];
  function css() {
    if (document.getElementById('gm-css')) return;
    var s = document.createElement('style'); s.id = 'gm-css';
    s.textContent = '.ml--gm .ml-body{grid-template-columns:3fr 2fr}.ml--gm .ml-earth.ln-r{flex-direction:column;padding:30px 12px 10px;gap:8px;overflow:auto;align-items:stretch;justify-content:flex-start}' +
      '.ln-cd{font-size:12px;color:#ffcf7a;letter-spacing:.04em}.ln-cd b{font-size:20px;color:#fff0cc;margin:0 2px}' +
      '.ln-facts{display:grid;grid-template-columns:auto 1fr;gap:3px 10px;font-size:12.5px;color:#c9d6e8;line-height:1.45}.ln-facts dt{color:#8fa6c4}.ln-facts dd{margin:0}.ln-facts b{color:#f3cf7a;font-weight:600}' +
      '.ln-chart{width:100%;height:120px;display:block;flex:none}.ln-win{font-size:13px;color:#cff8ea;line-height:1.5;background:rgba(127,227,196,.08);border:1px solid rgba(127,227,196,.3);border-radius:10px;padding:6px 9px}' +
      '.ln-vs{display:flex;flex-direction:column;gap:2px;font-size:12px;color:#c9d6e8;background:rgba(255,207,122,.07);border:1px solid rgba(255,207,122,.25);border-radius:10px;padding:6px 9px}.ln-vs b{color:#ffcf7a}.ln-vs button{align-self:flex-start;margin-top:3px;padding:3px 9px;border-radius:8px;border:1px solid rgba(255,207,122,.5);background:rgba(255,207,122,.12);color:#fff0cc;cursor:pointer;font-size:12px}' +
      '.ln-src{font-size:10.5px;color:#7f93ad;line-height:1.45}.ml--gm .ml-ctl{flex-wrap:wrap;gap:6px 10px}.ml--gm .ln-seg{display:flex;gap:4px;flex-wrap:wrap}' +
      '.ml--gm .ln-seg button{padding:4px 9px;font-size:12px}.ml--gm .ln-seg button.is-on{background:rgba(255,207,122,.22);border-color:#ffcf7a;color:#efe6ff}.ml--gm .ml-rng{accent-color:#ffcf7a;min-width:160px}' +
      '.ln-tm{min-width:92px;text-align:center;color:#fff0cc}.ln-read{position:absolute;right:12px;top:8px;font-size:12px;color:#c9d6e8;text-align:right;z-index:2;line-height:1.5}.ln-read b{color:#fff0cc}' +
      '@media (max-width:760px),(orientation:portrait){.ml--gm .ml-body{grid-template-columns:1fr;grid-template-rows:1.15fr 1fr}.ml--gm .ml-rng{order:3;flex-basis:100%}.ln-chart{height:96px}.ln-read{font-size:11px}.ml--gm .ml-note{display:none}.ln-cd b{font-size:17px}}' +
      '@media (max-height:520px){.ml--gm .ml-guide{padding:6px 10px}.ml--gm .ml-q{font-size:13px}.ln-facts{font-size:11.5px}.ml--gm .ml-note{display:none}}';
    document.head.appendChild(s);
  }
  function build() {
    css();
    var r = U.root = h('section', 'ml ml--gm');
    r.innerHTML =
      '<header class="ml-hd"><div><small>本月天象 · 2026 年 12 月</small><b>双子座流星雨</b></div><span class="ml-st"></span><button class="ml-x" type="button" aria-label="关闭">✕</button></header>' +
      '<div class="ml-body"><div class="ml-pane ml-space"><div class="ml-cap ln-where"></div><div class="ln-read"></div><canvas class="ml-cv3"></canvas><div class="ml-note">圆心是你的头顶,圆周是地平线;上北下南,左东右西(仰望时的方向)· 流星为示意</div></div>' +
      '<div class="ml-pane ml-earth ln-r"><div class="ml-cap">极大倒计时 · 北京时间</div><div class="ln-cd"></div><div class="ln-win"></div><canvas class="ln-chart"></canvas>' +
      '<dl class="ln-facts"></dl><div class="ln-vs"><b>小行星 vs 彗星</b><span>双子座 · 母体 3200 法厄同(岩石小行星)· 35 km/s</span><span>狮子座 · 母体 55P(冰尘彗星)· 71 km/s</span><button class="ln-hear" type="button">▶ 听速度(会发声)</button></div><div class="ln-src">数据:国际流星组织 IMO《2026 Meteor Shower Calendar》(J. Rendtel 编)、日本国立天文台;法厄同轨道 JPL SBDB;日月与辐射点位置由 astronomy-engine 在本机计算。每小时颗数按 ZHR × sin(辐射点高度) × 天空条件粗估,实际常更少。</div></div></div>' +
      '<div class="ml-ctl"><span class="ln-seg ln-night"></span><span class="ln-seg ln-sky"></span><input class="ml-rng" type="range" min="0" max="1" step="0.002" aria-label="时间"><span class="ln-tm"></span></div>' +
      '<div class="ml-guide"><div class="ml-q"></div><div class="ml-ch"></div><div class="ml-gb"><button class="ml-hint" type="button">给我一点提示</button><span class="ml-hs"></span></div></div>';
    document.body.appendChild(r);
    ['st', 'x', 'cv3', 'rng', 'q', 'ch', 'hint', 'hs'].forEach(function (k) { U[k] = r.querySelector('.ml-' + k); });
    ['where', 'read', 'cd', 'win', 'chart', 'facts', 'night', 'sky', 'tm'].forEach(function (k) { U[k] = r.querySelector('.ln-' + k); });
    U.x.onclick = close; U.hint.onclick = hint; r.querySelector('.ln-hear').onclick = hear;
    U.rng.oninput = function () { L.t = +U.rng.value; draw(); };
    NIGHTS.forEach(function (n, i) { var b = h('button', '', n[1]); b.type = 'button'; b.onclick = function () { L.n = i; P('click'); recalc(); }; U.night.appendChild(b); });
    SKYQ.forEach(function (n, i) { var b = h('button', '', n[1]); b.type = 'button'; b.onclick = function () { L.sq = i; P('click'); recalc(); }; U.sky.appendChild(b); });
    U.chart.addEventListener('pointerdown', function (e) { var rc = U.chart.getBoundingClientRect(); L.t = Math.max(0, Math.min(1, (e.clientX - rc.left - 6) / (rc.width - 12))); U.rng.value = L.t; draw(); });
  }
  function seg() {
    [].forEach.call(U.night.children, function (b, i) { b.classList.toggle('is-on', i === L.n); });
    [].forEach.call(U.sky.children, function (b, i) { b.classList.toggle('is-on', i === L.sq); });
  }
  function cur() { return N.S[Math.round(L.t * (N.S.length - 1))]; }
  function fill() {
    U.where.textContent = '📍 ' + N.loc.name + (N.loc.mine ? '' : '(默认,可在「我的位置」里改)');
    var mtxt = N.mset ? '月落 ' + hm(N.mset) : (N.moonUp0 ? '月亮整夜在天上' : '入夜时月亮已落');
    var ill0 = Math.round(Math.max.apply(null, N.S.slice(0, 3).map(function (x) { return x.ill; })) * 100);
    U.facts.innerHTML =
      '<dt>极大</dt><dd><b>12月14日 22:00</b> 前后(IMO;极大很宽,ZHR≥100 约持续 10–12 小时)</dd>' +
      '<dt>流量</dt><dd>ZHR ≈ <b>150</b>,全年最强的流星雨之一</dd>' +
      '<dt>活跃期</dt><dd>12月4日 — 12月20日</dd>' +
      '<dt>月相</dt><dd>娥眉月,约 ' + ill0 + '% 亮;当夜' + mtxt + '</dd>' +
      '<dt>辐射点</dt><dd>双子座北河二附近,' + (N.S[0].ralt > 0 ? '日落时已在东北方低空,前半夜就有流星' : N.rr ? hm(N.rr) + ' 从东北方升起,前半夜就有流星' : '当夜不升起') + '</dd>' +
      '<dt>速度</dt><dd>约 35 km/s,中慢速,亮、颜色多,很少留余迹</dd>' +
      '<dt>母体</dt><dd>小行星 3200 法厄同:直径约 6 km,近日点 0.14 AU(比水星近),周期约 1.4 年</dd>';
    var b = N.best;
    U.win.innerHTML = b && b.rate > 0.3 ? '最佳时段:<b>' + hm(N.w0) + '—' + hm(N.w1) + '</b>,' + hm(b.ms) + ' 前后辐射点高 ' + Math.round(b.ralt) + '°,' + SKYQ[L.sq][1] + '约每小时 <b>' + Math.max(1, Math.round(b.rate)) + '</b> 颗。' + (L.n === 1 ? '天冷,注意保暖。' : '')
      : '在' + SKYQ[L.sq][1] + '几乎看不到——换个更暗的地方,或选别的夜晚。';
  }
  function countdown() {
    var now = Date.now(), d = PEAK - now;
    if (now > ACT1) U.cd.textContent = '今年的双子座流星雨已结束,明年 12 月中旬再见。';
    else if (d > 0) { var dd = Math.floor(d / 864e5), hh = Math.floor(d % 864e5 / 3600e3), mm = Math.floor(d % 3600e3 / 60000); U.cd.innerHTML = '距极大还有<b>' + dd + '</b>天<b>' + hh + '</b>时<b>' + mm + '</b>分'; }
    else U.cd.textContent = '极大刚过,活跃期持续到 12 月 20 日,夜里仍能看到不少。';
  }
  function drawChart() {
    var c = U.chart, g = c.getContext('2d'), d = c._dpr || 1, W = c.width, H = c.height, x0 = 6 * d, x1 = W - 6 * d, y1 = H - 16 * d, y0 = 8 * d;
    g.clearRect(0, 0, W, H);
    var S = N.S, mx = Math.max(4, N.best.rate * 1.15), n = S.length, bw = (x1 - x0) / n;
    S.forEach(function (s, i) {
      var x = x0 + (x1 - x0) * i / (n - 1);
      g.fillStyle = s.dark ? 'rgba(10,18,40,.9)' : s.sun < -6 ? 'rgba(30,44,80,.9)' : 'rgba(60,80,120,.8)'; g.fillRect(x - bw / 2, y0, bw + 0.5, y1 - y0);
      if (s.moon > 0) { g.fillStyle = 'rgba(244,241,224,.16)'; g.fillRect(x - bw / 2, y1 - 5 * d, bw + 0.5, 5 * d); }
      if (s.rate > 0) { var hh = (y1 - y0) * Math.min(1, s.rate / mx); g.fillStyle = s.rate >= N.best.rate * 0.7 ? '#ffcf7a' : 'rgba(255,207,122,.45)'; g.fillRect(x - bw / 2, y1 - hh, bw + 0.5, hh); }
    });
    var i = Math.round(L.t * (n - 1)), xc = x0 + (x1 - x0) * i / (n - 1);
    g.strokeStyle = '#ffe9a8'; g.lineWidth = 1.5 * d; g.beginPath(); g.moveTo(xc, y0); g.lineTo(xc, y1); g.stroke();
    g.fillStyle = '#8fa6c4'; g.font = (10 * d) + 'px sans-serif'; g.textAlign = 'center';
    for (var k = 0; k < n; k++) { var dk = bjD(S[k].ms); if (dk.getUTCMinutes() < 7 && dk.getUTCHours() % 3 === 0 && (k === 0 || bjD(S[k - 1].ms).getUTCHours() !== dk.getUTCHours())) g.fillText(dk.getUTCHours() + '时', x0 + (x1 - x0) * k / (n - 1), H - 4 * d); }
    g.textAlign = 'left'; g.fillStyle = 'rgba(244,241,224,.7)'; g.fillText('▁ 月亮在天上', x0 + 2 * d, y0 + 11 * d);
  }
  function xyF(cx, cy, R) { return function (alt, az) { var r = R * (90 - alt) / 90, a = az * DEG; return [cx - Math.sin(a) * r, cy - Math.cos(a) * r]; }; }
  function draw() {
    if (!N) return;
    var c = U.cv3, g = c.getContext('2d'), W = c.width, H = c.height, d = c._dpr || 1, s = cur();
    var cx = W / 2, cy = H / 2 + 10 * d, R = Math.min(W, H) * 0.40, xy = xyF(cx, cy, R);
    g.fillStyle = '#04070f'; g.fillRect(0, 0, W, H);
    var sky = s.sun > -6 ? '#2a3d6a' : s.sun > -12 ? '#16244a' : s.sun > -18 ? '#0b1530' : (s.moon > 0 ? '#0d1a36' : '#050b1a');
    g.fillStyle = sky; g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.fill();
    // 背景星(固定伪随机,随时间绕天极转动的效果省略)
    g.fillStyle = 'rgba(220,230,255,' + (s.sun < -12 && !(s.moon > 0 && s.ill > 0.4) ? .8 : .35) + ')';
    for (var k = 0; k < 160; k++) { var aa = (k * 137.5) % 360, rr = Math.sqrt(((k * 9301 + 49297) % 233280) / 233280) * R; g.fillRect(cx + Math.cos(aa * DEG) * rr, cy + Math.sin(aa * DEG) * rr, d * (k % 7 ? 1 : 1.6), d * (k % 7 ? 1 : 1.6)); }
    g.strokeStyle = 'rgba(160,190,230,.22)'; g.lineWidth = d; [30, 60].forEach(function (alt) { g.beginPath(); g.arc(cx, cy, R * (90 - alt) / 90, 0, TAU); g.stroke(); });
    g.strokeStyle = 'rgba(160,190,230,.5)'; g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.stroke();
    g.fillStyle = 'rgba(200,215,235,.8)'; g.font = (12 * d) + 'px sans-serif'; g.textAlign = 'center';
    g.fillText('北', cx, cy - R - 6 * d); g.fillText('南', cx, cy + R + 16 * d); g.fillText('东', cx - R - 12 * d, cy + 4 * d); g.fillText('西', cx + R + 12 * d, cy + 4 * d);
    // 月亮
    if (s.moon > 0) { var mp = xy(s.moon, s.maz), mr = 9 * d, gl = g.createRadialGradient(mp[0], mp[1], 0, mp[0], mp[1], mr * 5); gl.addColorStop(0, 'rgba(255,250,225,.55)'); gl.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gl; g.beginPath(); g.arc(mp[0], mp[1], mr * 5, 0, TAU); g.fill(); g.fillStyle = '#f4f1e0'; g.beginPath(); g.arc(mp[0], mp[1], mr, 0, TAU); g.fill(); g.fillStyle = '#e8f2ff'; g.textAlign = 'left'; g.fillText('月亮 ' + Math.round(s.ill * 100) + '%', mp[0] + mr + 4 * d, mp[1] + 4 * d); }
    // 辐射点
    if (s.ralt > 0) {
      var rp = xy(s.ralt, s.raz); g.strokeStyle = '#ffcf7a'; g.lineWidth = 1.5 * d; g.beginPath(); g.arc(rp[0], rp[1], 7 * d, 0, TAU); g.stroke();
      g.beginPath(); g.moveTo(rp[0] - 11 * d, rp[1]); g.lineTo(rp[0] + 11 * d, rp[1]); g.moveTo(rp[0], rp[1] - 11 * d); g.lineTo(rp[0], rp[1] + 11 * d); g.stroke();
      g.fillStyle = '#fff0cc'; g.textAlign = 'left'; g.fillText('辐射点 · 双子座', rp[0] + 12 * d, rp[1] - 8 * d);
      U._rp = rp;
    } else U._rp = null;
    // 流星
    MET.forEach(function (m) {
      var k = m.age / m.life; if (k > 1) return; var len = m.len * Math.min(1, k * 3), a = 1 - k;
      var hx = m.x + Math.cos(m.ang) * m.dist * k, hy = m.y + Math.sin(m.ang) * m.dist * k;
      var gr = g.createLinearGradient(hx, hy, hx - Math.cos(m.ang) * len, hy - Math.sin(m.ang) * len); gr.addColorStop(0, 'rgba(255,255,255,' + a + ')'); gr.addColorStop(1, 'rgba(255,207,122,0)');
      g.strokeStyle = gr; g.lineWidth = 1.6 * d; g.beginPath(); g.moveTo(hx, hy); g.lineTo(hx - Math.cos(m.ang) * len, hy - Math.sin(m.ang) * len); g.stroke();
    });
    U.tm.textContent = md(s.ms).replace(/^\d+月/, '');
    U.read.innerHTML = '太阳 ' + Math.round(s.sun) + '° · ' + (s.sun < -18 ? '全黑' : s.sun < -12 ? '天文昏影' : s.sun < 0 ? '暮光' : '白天') + '<br>辐射点 ' + (s.ralt > 0 ? '高 <b>' + Math.round(s.ralt) + '°</b> ' + dir(s.raz) + '方' : '在地平线下') + '<br>此刻约每小时 <b>' + (s.rate >= 0.5 ? Math.round(s.rate) : 0) + '</b> 颗';
    drawChart();
  }
  function tick() {
    RAF = 0; if (!U.root || U.root.hidden) return;
    var s = cur(), c = U.cv3, d = c._dpr || 1, R = Math.min(c.width, c.height) * 0.40;
    MET.forEach(function (m) { m.age += 1; }); MET = MET.filter(function (m) { return m.age < m.life; });
    // 示意:按此刻流量放大 30 倍出现
    if (U._rp && Math.random() < Math.min(0.25, s.rate * 30 / 3600 / 60 * 60 * 0.6)) {
      var ang = Math.random() * TAU, st = (25 + Math.random() * 70) * d;
      MET.push({ x: U._rp[0] + Math.cos(ang) * st, y: U._rp[1] + Math.sin(ang) * st, ang: ang, dist: (50 + Math.random() * 90) * d, len: (30 + Math.random() * 50) * d, age: 0, life: 22 + Math.random() * 16 });
    }
    draw(); RAF = requestAnimationFrame(tick);
  }
  function stars() { var n = ST.stars.reduce(function (s, x) { return s + x; }, 0); U.st.textContent = '★ ' + n + ' / 9'; }
  function showQ() {
    stars(); L.hints = 0; U.hs.textContent = ''; U.ch.innerHTML = ''; U.hint.hidden = false;
    if (L.q >= QS.length) { U.q.innerHTML = '<b>三关完成!</b>14 日晚上月亮落下后,找个远离路灯的开阔地,躺下看整片天空,先让眼睛适应黑暗 20 分钟。12 月夜里很冷,穿厚一点。'; U.hint.hidden = true; return; }
    var Q = QS[L.q]; U.q.innerHTML = '<small>第 ' + (L.q + 1) + ' / 3 关</small>' + Q.q;
    if (Q.kind === 'choice') {
      var order = Q.ch.map(function (t, i) { return i; }); order.sort(function () { return Math.random() - 0.5; });
      order.forEach(function (i) { var b = h('button', 'ml-c', Q.ch[i]); b.type = 'button'; b.onclick = function () { answer(i === Q.ok, b); }; U.ch.appendChild(b); });
    } else { var b = h('button', 'ml-c ml-c--go', '就是这时'); b.type = 'button'; b.onclick = function () { answer(Q.check(), b); }; U.ch.appendChild(b); }
  }
  function answer(ok, b) {
    var Q = QS[L.q];
    if (!ok) { b.classList.add('no'); P('blip'); U.hs.textContent = '再想想,也可以看一条提示。'; return; }
    var got = Math.max(1, 3 - L.hints); ST.stars[L.q] = Math.max(ST.stars[L.q] || 0, got); save(); P('arrive');
    U.ch.innerHTML = ''; U.hint.hidden = true;
    U.q.innerHTML = '<small>第 ' + (L.q + 1) + ' 关 · 获得 ' + '★'.repeat(got) + '</small>' + Q.good;
    var n = h('button', 'ml-c ml-c--go', L.q < 2 ? '下一关' : '完成'); n.type = 'button'; n.onclick = function () { L.q++; showQ(); }; U.ch.appendChild(n); stars();
  }
  function hint() {
    var Q = QS[L.q]; if (!Q || L.hints >= 3) return; P('click');
    U.hs.textContent = ['方向', '线索', '半步示范'][L.hints] + ':' + Q.hint[L.hints]; L.hints++;
    if (L.hints >= 3) U.hint.hidden = true;
  }
  function resize() {
    [U.cv3, U.chart].forEach(function (c) {
      var r = (c === U.cv3 ? c.parentNode : c).getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
      c._dpr = dpr; c.width = Math.max(10, r.width * dpr); c.height = Math.max(10, r.height * dpr);
      if (c === U.cv3) { c.style.width = r.width + 'px'; c.style.height = r.height + 'px'; }
    });
    draw();
  }
  function recalc() {
    try { compute(); } catch (e) { console.warn('[geminids]', e); U.q.textContent = '今夜的天空暂时算不出来,稍后再试。'; return; }
    seg(); fill(); MET = [];
    if (N.best && N.best.rate > 0) L.t = (N.best.ms - N.t0) / (N.t1 - N.t0); U.rng.value = L.t; draw();
  }
  function open() {
    if (!A()) { if (window.LE && LE.ui && LE.ui.toast) LE.ui.toast('天文计算模块未载入'); return; }
    if (!U.root) build();
    U.root.hidden = false; document.body.classList.add('ml-on');
    var now = Date.now(); L.n = now < Date.UTC(2026, 11, 14, 22) ? 1 : 2;
    recalc(); resize(); countdown();
    var qq = L.t; L.t = 0.15; U.rng.value = L.t; draw(); L._best = qq;   // 题一:从傍晚开始找
    QS = qset(); L.q = ST.stars.indexOf(0); if (L.q < 0) L.q = 3; showQ(); P('open');
    setTimeout(resize, 60);
    if (!reduced() && !RAF) RAF = requestAnimationFrame(tick);
    clearInterval(U.cdT); U.cdT = setInterval(countdown, 30000);
  }
  function close() { if (!U.root) return; U.root.hidden = true; document.body.classList.remove('ml-on'); clearInterval(U.cdT); if (RAF) cancelAnimationFrame(RAF); RAF = 0; P('close'); }
  addEventListener('resize', function () { if (U.root && !U.root.hidden) resize(); });
  addEventListener('keydown', function (e) { if (e.key === 'Escape' && U.root && !U.root.hidden) close(); });
  SH.geminidsLab = { open: open, close: close, _L: L, _N: function () { return N; },
    calc: function (n, sq) { L.n = n; L.sq = sq; compute(); return N; }, K: { PEAK: PEAK, MASLOV: MASLOV, ACT0: ACT0, ACT1: ACT1, RA: RA, DEC: DEC, ZHR: ZHR, TRAILS: TRAILS, NIGHTS: NIGHTS, SKYQ: SKYQ }, zhrAt: zhrAt, where: where, VEL: VEL, hear: hear, active: function () { var t = Date.now(); return t >= Date.UTC(2026, 10, 25, 16) && t < Date.UTC(2026, 11, 16, 16); } };   // 播报置顶:北京时间 11-26 — 12-16

  /* 入口:地球重要播报置顶条目(sh-cast.js,北京时间 11-26 至 12-16)、深链 ?task=geminids */
})();
