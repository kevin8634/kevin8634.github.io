/* 天枢 Starhelm · 星域 III「行星世界」· 新任务 sh.tonight「今晚抬头能看到哪颗行星?」(v1.0-M2a)
 * 用 astronomy-engine 在本机算今晚(日落到次日日出)水星、金星、火星、木星、土星的高度、方向、亮度,
 * 左:你头顶的天空(圆盘全天图,中心是天顶,边缘是地平线),时间滑块从日落拖到日出;右:今晚行星清单。
 * 位置:优先用「我的位置」(LE.location.current,仅存本机),否则北京。无账号、不上传。
 * 向导 3 关:题目跟着今晚的真实天空出;最少 1 星。存储 gn:sh:tonight(stars[3])。守星人:岁星。星桥 ID:sh.tonight
 */
(function () {
  'use strict';
  var SH = window.SH = window.SH || {};
  var KEY = 'gn:sh:tonight', TAU = Math.PI * 2, DEG = Math.PI / 180;
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(ST)); } catch (e) { } }
  var ST = load(); ST.stars = ST.stars || [0, 0, 0];
  function h(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function P(n) { if (window.LE && LE.audio) LE.audio.play(n); }
  function A() { return window.Astronomy; }
  var PL = [['Mercury', '水星', '#c9c2b8'], ['Venus', '金星', '#fff1c2'], ['Mars', '火星', '#ff8a5c'], ['Jupiter', '木星', '#ffd9a8'], ['Saturn', '土星', '#f3dc9a']];
  var DIRS = ['北', '东北', '东', '东南', '南', '西南', '西', '西北'];
  function dir(az) { return DIRS[Math.round(((az % 360) + 360) % 360 / 45) % 8]; }
  function fmtT(d) { return window.SHTIME ? SHTIME.fmt(d).slice(11) : d.toTimeString().slice(0, 5); }
  function magTxt(m) { return (m < 0 ? '−' + Math.abs(m).toFixed(1) : m.toFixed(1)) + ' 等'; }

  var N = null;   // 今晚数据
  var L = { t: 0.5, q: 0, hints: 0 };

  function where() {
    var c = window.LE && LE.location && LE.location.current;
    if (c && isFinite(c.lat) && isFinite(c.lng)) return { lat: c.lat, lng: c.lng, name: c.name || '我的位置' };
    return { lat: 39.9042, lng: 116.4074, name: '北京(默认,可在「我的位置」里改)' };
  }
  function compute() {
    var a = A(), loc = where(), ob = new a.Observer(loc.lat, loc.lng, 50);
    var now = window.SHTIME ? SHTIME.now() : new Date();
    // 今晚:从今天日落开始(若此刻已过日出前的夜里,就从上一次日落算)
    var base = new Date(now.getTime() - 12 * 3600e3);
    var set = a.SearchRiseSet(a.Body.Sun, ob, -1, a.MakeTime(base), 2);
    if (set && set.date.getTime() + 14 * 3600e3 < now.getTime()) set = a.SearchRiseSet(a.Body.Sun, ob, -1, a.MakeTime(now), 2);
    var t0 = set ? set.date : now, rise = a.SearchRiseSet(a.Body.Sun, ob, +1, a.MakeTime(t0), 2), t1 = rise ? rise.date : new Date(t0.getTime() + 12 * 3600e3);
    var STEP = 96, list = PL.map(function (p) {
      var B = a.Body[p[0]], best = { alt: -90 }, upN = 0, samples = [];
      for (var i = 0; i <= STEP; i++) {
        var d = new Date(t0.getTime() + (t1 - t0) * i / STEP), eq = a.Equator(B, a.MakeTime(d), ob, true, true), hz = a.Horizon(a.MakeTime(d), ob, eq.ra, eq.dec, 'normal');
        samples.push([hz.altitude, hz.azimuth]);
        // 太阳在地平线下 6° 以后才算「天黑能看」
        var sun = a.Horizon(a.MakeTime(d), ob, a.Equator(a.Body.Sun, a.MakeTime(d), ob, true, true).ra, a.Equator(a.Body.Sun, a.MakeTime(d), ob, true, true).dec, 'normal').altitude;
        if (sun < -6 && hz.altitude > 8) upN++;
        if (sun < -6 && hz.altitude > best.alt) best = { alt: hz.altitude, az: hz.azimuth, d: d, i: i };
      }
      var mag = a.Illumination(B, a.MakeTime(new Date((t0.getTime() + t1.getTime()) / 2))).mag;
      return { id: p[0], zh: p[1], col: p[2], mag: mag, best: best, vis: upN >= 3 && mag < 5.5, hours: upN * (t1 - t0) / STEP / 3600e3, samples: samples };
    });
    N = { loc: loc, t0: t0, t1: t1, list: list };
  }

  /* ---------- 题目(按今晚真实天空出) ---------- */
  function qset() {
    var vis = N.list.filter(function (x) { return x.vis; }).sort(function (a, b) { return a.mag - b.mag; });
    var all = N.list.slice().sort(function (a, b) { return a.mag - b.mag; });
    var q1;
    if (vis.length >= 2) q1 = { kind: 'choice', q: '看右边的清单和左边的天空:今晚能看到的行星里,哪一颗最亮?(星等越小越亮,负数最亮)',
      ch: vis.map(function (x) { return x.zh; }), ok: 0,
      hint: ['先只看清单里标「能看到」的行星。', '比较它们的「亮度」:星等数字越小越亮,−4 比 1 亮得多。', '找星等最小的那一颗。'],
      good: '对!今晚最亮的是' + vis[0].zh + '(' + magTxt(vis[0].mag) + '),最佳时刻约 ' + fmtT(vis[0].best.d) + ',在' + dir(vis[0].best.az) + '方。行星不像恒星那样一闪一闪,光比较稳,这是认出它们的小窍门。' };
    else q1 = { kind: 'choice', q: '今晚能看到的行星很少。行星的亮度主要取决于什么?',
      ch: ['离地球多近、离太阳多近、被照亮的部分多大', '行星自己发光的强弱', '行星的颜色'], ok: 0,
      hint: ['行星自己会发光吗?', '行星和月亮一样,靠反射阳光。', '离太阳近、离我们近、亮面朝着我们,就更亮。'],
      good: '对!行星自己不发光,反射的是阳光。所以同一颗行星,有时亮有时暗;离地球最近时(冲日前后)最亮。' };
    var tgt = vis.length ? vis.slice().sort(function (a, b) { return b.hours - a.hours; })[0] : null;
    var q2 = tgt ? { kind: 'time', q: '拖动下面的时间滑块,找到<b>' + tgt.zh + '</b>升到今晚最高的时刻,然后按「就是这时」。',
      check: function () { var i = Math.round(L.t * 96); return Math.abs(i - tgt.best.i) <= 6; },
      hint: ['盯住左边天空里的' + tgt.zh + ',它离圆心(头顶)越近就越高。', '拖滑块时看右下的「此刻高度」读数,找最大的那个。', '它最高大约在 ' + fmtT(tgt.best.d) + ' 前后。'],
      good: '找到了!行星和太阳一样东升西落,升到正南方附近时最高,这时空气最少挡光,看得最清楚。' }
      : { kind: 'choice', q: '今晚的行星大多和太阳一起在白天的天上。为什么白天看不到它们?', ch: ['阳光太亮,把它们「淹没」了', '它们白天不存在', '白天它们跑到地球背面了'], ok: 0,
        hint: ['行星一直都在天上,只是位置在变。', '想想为什么白天也看不到星星。', '天空被阳光照亮,暗弱的光点就分辨不出来了。'],
        good: '对!行星白天也在天上,只是被明亮的天空淹没了。等过几周,它们和太阳拉开距离,就会出现在黄昏或黎明。' };
    var q3 = { kind: 'choice', q: '仔细看左边:所有行星都排在天空中差不多一条线上。为什么它们不会跑到北极星旁边?',
      ch: ['八颗行星差不多在同一个平面上绕太阳转,从地球看就沿着「黄道」排开', '北极星把它们推开了', '纯属巧合,明天就不一样了'], ok: 0,
      hint: ['回想星域 III 的太阳系视图:行星轨道是不是像一张薄薄的光盘?', '我们也在这张「光盘」上,从里面往外看,盘子就变成了天上的一条线。', '这条线就是太阳一年里走过的路,叫黄道。'],
      good: '没错!太阳系像一张扁平的光盘,地球也在盘上,所以太阳、月亮和行星都沿着黄道附近运行。看到一串排成线的亮星,多半就是行星。' };
    return [q1, q2, q3];
  }

  var U = {}, QS = [];
  function build() {
    var r = U.root = h('section', 'ml ml--tn');
    r.innerHTML =
      '<header class="ml-hd"><div><small>星域 III · 岁星 · 行星世界</small><b>今晚抬头能看到哪颗行星?</b></div><span class="ml-st"></span><button class="ml-x" type="button" aria-label="关闭">✕</button></header>' +
      '<div class="ml-body"><div class="ml-pane ml-space"><div class="ml-cap tn-where"></div><canvas class="ml-cv3"></canvas><div class="ml-note">圆心是你的头顶,圆周是地平线;上北下南,左东右西(仰望时的方向)</div></div>' +
      '<div class="ml-pane ml-earth tn-r"><div class="ml-cap">今晚的行星</div><div class="tn-list"></div><div class="tn-now"></div></div></div>' +
      '<div class="ml-ctl"><span class="tn-a"></span><input class="ml-rng" type="range" min="0" max="1" step="0.0025"><span class="tn-b"></span><span class="ml-day"></span></div>' +
      '<div class="ml-guide"><div class="ml-q"></div><div class="ml-ch"></div><div class="ml-gb"><button class="ml-hint" type="button">给我一点提示</button><span class="ml-hs"></span></div></div>';
    document.body.appendChild(r);
    ['st', 'x', 'cv3', 'rng', 'day', 'q', 'ch', 'hint', 'hs'].forEach(function (k) { U[k] = r.querySelector('.ml-' + k); });
    U.where = r.querySelector('.tn-where'); U.list = r.querySelector('.tn-list'); U.now = r.querySelector('.tn-now'); U.a = r.querySelector('.tn-a'); U.b = r.querySelector('.tn-b');
    U.x.onclick = close; U.hint.onclick = hint;
    U.rng.oninput = function () { L.t = +U.rng.value; draw(); };
  }
  function fillList() {
    U.where.textContent = '📍 ' + N.loc.name;
    U.a.textContent = '日落 ' + fmtT(N.t0); U.b.textContent = '日出 ' + fmtT(N.t1);
    U.list.innerHTML = N.list.map(function (x) {
      return '<div class="tn-row' + (x.vis ? ' ok' : '') + '"><i style="background:' + x.col + '"></i><b>' + x.zh + '</b><span>' + magTxt(x.mag) + '</span><span>' +
        (x.vis ? '能看到 · 约 ' + fmtT(x.best.d) + ' ' + dir(x.best.az) + '方 高 ' + Math.round(x.best.alt) + '°' : (x.best.alt > 0 && x.mag > 5.5 ? '太暗' : '今晚看不到')) + '</span></div>';
    }).join('');
  }
  function draw() {
    var c = U.cv3, g = c.getContext('2d'), W = c.width, H = c.height, d = c._dpr || 1;
    g.clearRect(0, 0, W, H);
    var cx = W / 2, cy = H / 2 + 12 * d, R = Math.min(W, H) * 0.40, i = Math.round(L.t * 96);
    var tm = new Date(N.t0.getTime() + (N.t1 - N.t0) * L.t);
    // 天色:越接近日落/日出越亮
    var tw = Math.min(L.t, 1 - L.t), sky = tw < 0.08 ? 'rgba(40,60,110,' + (1 - tw / 0.08 * 0.6) + ')' : '#060d1e';
    g.fillStyle = '#04070f'; g.fillRect(0, 0, W, H);
    g.fillStyle = sky; g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(160,190,230,.25)'; g.lineWidth = d;
    [30, 60].forEach(function (alt) { g.beginPath(); g.arc(cx, cy, R * (90 - alt) / 90, 0, TAU); g.stroke(); });
    g.strokeStyle = 'rgba(160,190,230,.5)'; g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.stroke();
    g.fillStyle = 'rgba(200,215,235,.8)'; g.font = (12 * d) + 'px sans-serif'; g.textAlign = 'center';
    g.fillText('北', cx, cy - R - 6 * d); g.fillText('南', cx, cy + R + 16 * d); g.fillText('东', cx - R - 12 * d, cy + 4 * d); g.fillText('西', cx + R + 12 * d, cy + 4 * d);
    function xy(alt, az) { var r = R * (90 - alt) / 90, a = az * DEG; return [cx - Math.sin(a) * r, cy - Math.cos(a) * r]; }   // 仰视:东在左
    // 黄道(用太阳系行星大致位置连线不准确,这里画每颗行星今晚的轨迹)
    var info = [];
    N.list.forEach(function (x) {
      g.strokeStyle = x.col + '55'; g.lineWidth = d; g.beginPath(); var pen = false;
      x.samples.forEach(function (s) { if (s[0] < 0) { pen = false; return; } var p = xy(s[0], s[1]); if (!pen) { g.moveTo(p[0], p[1]); pen = true; } else g.lineTo(p[0], p[1]); });
      g.stroke();
      var s = x.samples[i]; if (s[0] < 0) return;
      var p = xy(s[0], s[1]), rr = Math.max(2.5, 7 - x.mag) * d;
      var gl = g.createRadialGradient(p[0], p[1], 0, p[0], p[1], rr * 2.6); gl.addColorStop(0, x.col); gl.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gl; g.beginPath(); g.arc(p[0], p[1], rr * 2.6, 0, TAU); g.fill();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(p[0], p[1], rr * 0.55, 0, TAU); g.fill();
      g.fillStyle = '#e8f2ff'; g.textAlign = 'left'; g.fillText(x.zh, p[0] + rr + 4 * d, p[1] - 4 * d);
      info.push(x.zh + ' ' + Math.round(s[0]) + '°');
    });
    U.day.textContent = fmtT(tm);
    U.now.textContent = info.length ? '此刻高度:' + info.join(' · ') : '此刻地平线上没有肉眼可见的行星';
  }

  function stars() { var n = ST.stars.reduce(function (s, x) { return s + x; }, 0); U.st.textContent = '★ ' + n + ' / 9'; }
  function showQ() {
    stars(); L.hints = 0; U.hs.textContent = ''; U.ch.innerHTML = ''; U.hint.hidden = false;
    if (L.q >= QS.length) { U.q.innerHTML = '<b>三关完成!</b>今晚找个开阔的地方,朝清单里写的方向抬头看看吧。别忘了让眼睛先适应黑暗几分钟。'; U.hint.hidden = true; return; }
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
    if (window.SHHUD && SHHUD.refreshTasks) SHHUD.refreshTasks();
  }
  function hint() {
    var Q = QS[L.q]; if (!Q || L.hints >= 3) return; P('click');
    U.hs.textContent = ['方向', '线索', '半步示范'][L.hints] + ':' + Q.hint[L.hints]; L.hints++;
    if (L.hints >= 3) U.hint.hidden = true;
  }
  function resize() {
    var c = U.cv3, r = c.parentNode.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
    c._dpr = dpr; c.width = Math.max(10, r.width * dpr); c.height = Math.max(10, r.height * dpr);
    c.style.width = r.width + 'px'; c.style.height = r.height + 'px'; if (N) draw();
  }
  function open() {
    if (!A()) { if (LE && LE.ui && LE.ui.toast) LE.ui.toast('天文计算模块未载入'); return; }
    if (!U.root) build();
    U.root.hidden = false; document.body.classList.add('ml-on');
    try { compute(); } catch (e) { console.warn('[tonight]', e); U.q.textContent = '今晚的天空暂时算不出来,稍后再试。'; return; }
    QS = qset(); resize(); fillList();
    var v = N.list.filter(function (x) { return x.vis; })[0]; L.t = v ? 0.25 : 0.5; U.rng.value = L.t; draw();
    L.q = ST.stars.indexOf(0); if (L.q < 0) L.q = 3; showQ(); P('open');
    setTimeout(resize, 60);
  }
  function close() { if (!U.root) return; U.root.hidden = true; document.body.classList.remove('ml-on'); P('close'); }
  addEventListener('resize', function () { if (U.root && !U.root.hidden) resize(); });
  SH.tonightLab = { open: open, close: close, _L: L, _N: function () { return N; } };
})();
