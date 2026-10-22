/* 天枢 Starhelm · 星域 III「行星世界」· 新任务 sh.retro「行星为什么有时会倒着走?」(v1.0-M2b)
 * 左:俯视地球和火星绕太阳(圆轨道示意,周期比真实:1 年 vs 1.881 年),一条视线从地球指向火星并延伸到远方星空。
 * 上方星空条:火星在天上的位置(视黄经;纬度按轨道倾角放大 5 倍让「圈」看得清),留下轨迹。地球超过火星时,火星往回走、画出一个圈。
 * 下一次真实的火星冲日由 astronomy-engine 本机计算,出在第 3 关。
 * 向导 3 关,最少 1 星。存储 gn:sh:retro(stars[3])。守星人:岁星。星桥 ID:sh.retro
 */
(function () {
  'use strict';
  var SH = window.SH = window.SH || {};
  var KEY = 'gn:sh:retro', TAU = Math.PI * 2, DEG = Math.PI / 180;
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(ST)); } catch (e) { } }
  var ST = load(); ST.stars = ST.stars || [0, 0, 0];
  function h(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function P(n) { if (window.LE && LE.audio) LE.audio.play(n); }

  var RM = 1.524, PM = 1.881, INC = 1.85 * 5 * DEG, TMAX = 0.85, OPP = 0.4;
  var TH0 = TAU * OPP - TAU / PM * OPP;          // 让第 0.4 年时冲日
  var L = { t: 0, play: true, q: 0, hints: 0, trail: [], retro: false };
  function pos(t) {
    var ae = TAU * t, am = TH0 + TAU * t / PM;
    var e = [Math.cos(ae), Math.sin(ae), 0], m = [RM * Math.cos(am), RM * Math.sin(am), RM * Math.sin(am - (TAU * OPP - 0.52)) * Math.sin(INC)];
    var dx = m[0] - e[0], dy = m[1] - e[1], dz = m[2], lam = Math.atan2(dy, dx), beta = Math.atan2(dz, Math.hypot(dx, dy));
    return { e: e, m: m, lam: lam, beta: beta };
  }
  function lamRel(lam) { var c = TAU * OPP, x = lam - c; while (x > Math.PI) x -= TAU; while (x < -Math.PI) x += TAU; return x; }
  function isRetro(t) { var a = pos(t - 0.002).lam, b = pos(t + 0.002).lam, d = b - a; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; return d < 0; }

  function nextOpp() {
    try { var A = window.Astronomy, now = window.SHTIME ? SHTIME.now() : new Date(); var t = A.SearchRelativeLongitude(A.Body.Mars, 0, A.MakeTime(now)); return t.date; } catch (e) { return null; }
  }
  function ymd(d) { return d.getFullYear() + ' 年 ' + (d.getMonth() + 1) + ' 月'; }
  var QS = [];
  function qset() {
    var op = nextOpp(), q3;
    if (op) {
      var wrong1 = new Date(op.getTime() - 182 * 864e5), wrong2 = new Date(op.getTime() + 365 * 864e5);
      q3 = { kind: 'choice', q: '火星每次「倒着走」,中间都正好是地球从太阳和火星之间穿过的时刻,叫「火星冲日」,这时火星最近也最亮。下一次真实的火星冲日是哪个月?(提示:冲日大约每 26 个月一次)',
        ch: [ymd(op), ymd(wrong1), ymd(wrong2)], ok: 0,
        hint: ['在星域 III 里点开火星,此刻卡上有一行「下一次冲日」。', '动画里,地球、太阳、火星排成一条直线的那一刻就是冲日。', '答案是 ' + ymd(op) + '。'],
        good: '对!下一次火星冲日在 ' + ymd(op) + '(本机实时计算)。前后两个多月里,火星会在星空中倒着走一段,那段时间晚上它整夜可见、又红又亮。' };
    } else q3 = { kind: 'choice', q: '火星倒着走的中间那一刻,地球、太阳、火星是什么位置?', ch: ['地球在太阳和火星中间,三者成一线', '太阳在地球和火星中间', '三者成直角'], ok: 0,
      hint: ['看动画里火星往回走最快的时候。', '那时地球正在超车。', '超车最近的一刻,地球正好夹在中间。'], good: '对,这叫「冲日」,火星这时离我们最近、最亮。' };
    return [
      { kind: 'choice', q: '按播放,盯住上面的星空条:火星大部分时间向左(向东)走,有一段却往回走、画了个圈。那时下面的俯视图里正在发生什么?',
        ch: ['跑内圈的地球追上并超过了火星', '火星真的在轨道上掉头了', '火星离太阳最远'], ok: 0,
        hint: ['在下面的俯视图里看:火星有没有真的掉头?', '地球跑内圈,一年一圈;火星跑外圈,将近两年一圈。谁快?', '就像在高速上超车时,旁边慢车看起来在往后退。'],
        good: '对!火星从来没掉头,是我们坐的「地球车」从内道超车,视线扫过去,火星看起来就往后退了。古人为了解释这个圈,发明了复杂的「本轮」,直到哥白尼把太阳放到中心才简单起来。' },
      { kind: 'retro', q: '现在自己找:暂停后拖动时间滑块,停在火星<b>正在倒着走</b>的时刻,然后按「就是现在」。',
        hint: ['星空条上,火星的箭头指向右边时就是在倒着走。', '倒着走发生在地球和火星离得最近的那段时间。', '在俯视图里,地球、太阳、火星接近排成一条线时。'],
        good: '找到了!倒着走的这段在真实世界里约持续 2 个多月。土星、木星也会倒着走,而且一年就有一次,因为地球超它们更频繁。' },
      q3];
  }

  var U = {};
  function build() {
    var r = U.root = h('section', 'ml ml--rt');
    r.innerHTML =
      '<header class="ml-hd"><div><small>星域 III · 岁星 · 行星世界</small><b>行星为什么有时会倒着走?</b></div><span class="ml-st"></span><button class="ml-x" type="button" aria-label="关闭">✕</button></header>' +
      '<div class="ml-body rt-body"><div class="ml-pane ml-space"><div class="ml-cap">夜空中的火星(背景是远方恒星)</div><canvas class="ml-cv3"></canvas><div class="ml-note">示意:轨道画成圆,上下起伏放大 5 倍;周期比例真实</div></div></div>' +
      '<div class="ml-ctl"><button class="ml-play" type="button">❚❚ 暂停</button><input class="ml-rng" type="range" min="0" max="' + TMAX + '" step="0.001"><span class="ml-day"></span></div>' +
      '<div class="ml-guide"><div class="ml-q"></div><div class="ml-ch"></div><div class="ml-gb"><button class="ml-hint" type="button">给我一点提示</button><span class="ml-hs"></span></div></div>';
    document.body.appendChild(r);
    ['st', 'x', 'cv3', 'play', 'rng', 'day', 'q', 'ch', 'hint', 'hs'].forEach(function (k) { U[k] = r.querySelector('.ml-' + k); });
    U.x.onclick = close; U.hint.onclick = hint;
    U.play.onclick = function () { setPlay(!L.play); P('click'); };
    U.rng.oninput = function () { setPlay(false); seek(+U.rng.value); };
  }
  function setPlay(p) { L.play = p; U.play.textContent = p ? '❚❚ 暂停' : '▶ 播放'; }
  function seek(t) { L.t = t; L.trail = []; for (var x = 0; x <= t; x += 0.004) L.trail.push(pos(x)); }
  var STARS = []; for (var i = 0; i < 90; i++) STARS.push([Math.random(), Math.random(), Math.random()]);
  function draw() {
    var c = U.cv3, g = c.getContext('2d'), W = c.width, H = c.height, d = c._dpr || 1;
    g.clearRect(0, 0, W, H);
    var stripH = Math.min(H * 0.38, 220 * d), top = 30 * d;
    // 星空条
    g.fillStyle = '#050a18'; g.fillRect(10 * d, top, W - 20 * d, stripH);
    STARS.forEach(function (s) { g.fillStyle = 'rgba(220,230,255,' + (0.25 + s[2] * 0.6) + ')'; g.fillRect(10 * d + s[0] * (W - 20 * d), top + s[1] * stripH, (1 + s[2]) * d, (1 + s[2]) * d); });
    var SPAN = 70 * DEG;
    function sx(p) { return W / 2 - lamRel(p.lam) / SPAN * (W / 2 - 20 * d); }   // 东在左
    function sy(p) { return top + stripH / 2 - Math.max(-1, Math.min(1, (p.beta - 9 * DEG) / (22 * DEG))) * stripH * 0.4; }
    g.strokeStyle = 'rgba(255,138,92,.8)'; g.lineWidth = 2 * d; g.beginPath();
    L.trail.forEach(function (p, i) { var x = sx(p), y = sy(p); if (i) g.lineTo(x, y); else g.moveTo(x, y); }); g.stroke();
    var cur = pos(L.t), x = sx(cur), y = sy(cur), retro = L.retro = isRetro(L.t);
    g.fillStyle = '#ff8a5c'; g.beginPath(); g.arc(x, y, 6 * d, 0, TAU); g.fill();
    g.fillStyle = retro ? '#ff6b6b' : '#7fe3c4'; g.font = (13 * d) + 'px sans-serif'; g.textAlign = 'center';
    g.fillText(retro ? '→ 倒着走(逆行)' : '← 正常向东走(顺行)', x, y - 14 * d);
    g.fillStyle = 'rgba(200,215,235,.7)'; g.font = (11 * d) + 'px sans-serif'; g.textAlign = 'left'; g.fillText('东', 16 * d, top + 14 * d); g.textAlign = 'right'; g.fillText('西', W - 16 * d, top + 14 * d);
    // 俯视图
    var oy = top + stripH + (H - top - stripH) / 2 + 4 * d, R = Math.min(W * 0.42, (H - top - stripH) / 2 - 24 * d) / RM, ox = W / 2;
    var sg = g.createRadialGradient(ox, oy, 0, ox, oy, 14 * d); sg.addColorStop(0, '#fff3c4'); sg.addColorStop(1, 'rgba(255,180,60,0)'); g.fillStyle = sg; g.beginPath(); g.arc(ox, oy, 14 * d, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(159,217,198,.25)'; g.setLineDash([4 * d, 5 * d]); g.lineWidth = d;
    g.beginPath(); g.arc(ox, oy, R, 0, TAU); g.stroke(); g.beginPath(); g.arc(ox, oy, R * RM, 0, TAU); g.stroke(); g.setLineDash([]);
    var ex = ox + cur.e[0] * R, ey = oy - cur.e[1] * R, mx = ox + cur.m[0] * R, my = oy - cur.m[1] * R;
    var k = 4, vx = mx + (mx - ex) * k, vy = my + (my - ey) * k;
    g.strokeStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.moveTo(ex, ey); g.lineTo(vx, vy); g.stroke();
    g.fillStyle = '#5aa8ff'; g.beginPath(); g.arc(ex, ey, 6 * d, 0, TAU); g.fill();
    g.fillStyle = '#ff8a5c'; g.beginPath(); g.arc(mx, my, 5 * d, 0, TAU); g.fill();
    g.fillStyle = '#e8f2ff'; g.font = (12 * d) + 'px sans-serif'; g.textAlign = 'left'; g.fillText('地球', ex + 9 * d, ey + 4 * d); g.fillText('火星', mx + 8 * d, my + 4 * d);
    U.day.textContent = '第 ' + Math.round(L.t * 365) + ' 天';
  }
  function stars() { var n = ST.stars.reduce(function (s, x) { return s + x; }, 0); U.st.textContent = '★ ' + n + ' / 9'; }
  function showQ() {
    stars(); L.hints = 0; U.hs.textContent = ''; U.ch.innerHTML = ''; U.hint.hidden = false;
    if (L.q >= QS.length) { U.q.innerHTML = '<b>三关完成!</b>下次听说「水逆」「火星逆行」,你就知道那只是地球在超车,行星并没有掉头。'; U.hint.hidden = true; return; }
    var Q = QS[L.q]; U.q.innerHTML = '<small>第 ' + (L.q + 1) + ' / 3 关</small>' + Q.q;
    if (Q.kind === 'choice') {
      var o = Q.ch.map(function (t, i) { return i; }).sort(function () { return Math.random() - 0.5; });
      o.forEach(function (i) { var b = h('button', 'ml-c', Q.ch[i]); b.type = 'button'; b.onclick = function () { answer(i === Q.ok, b); }; U.ch.appendChild(b); });
    } else { var b = h('button', 'ml-c ml-c--go', '就是现在'); b.type = 'button'; b.onclick = function () { answer(isRetro(L.t), b); }; U.ch.appendChild(b); }
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
    c._dpr = dpr; c.width = Math.max(10, r.width * dpr); c.height = Math.max(10, r.height * dpr); c.style.width = r.width + 'px'; c.style.height = r.height + 'px';
  }
  var raf = 0, last = 0, fc = 0, MQ = matchMedia('(prefers-reduced-motion: reduce)');
  function loop(t) {
    raf = requestAnimationFrame(loop); var dt = Math.min(0.1, (t - last) / 1000 || 0); last = t;
    if (++fc % 30 === 0) { var pr = U.cv3.parentNode.getBoundingClientRect(), dp = U.cv3._dpr || 1; if (Math.abs(pr.width * dp - U.cv3.width) > 2 || Math.abs(pr.height * dp - U.cv3.height) > 2) resize(); }
    if (L.play) {
      L.t += dt / (MQ.matches ? 24 : 12);
      if (L.t > TMAX) { L.t = 0; L.trail = []; }
      if (!L.trail.length || L.t - (L.trail._t || 0) > 0.004) { L.trail.push(pos(L.t)); L.trail._t = L.t; }
      U.rng.value = L.t;
    }
    draw();
  }
  function open() {
    if (!U.root) build();
    U.root.hidden = false; document.body.classList.add('ml-on');
    QS = qset(); resize(); seek(0); setPlay(true); L.q = ST.stars.indexOf(0); if (L.q < 0) L.q = 3; showQ();
    cancelAnimationFrame(raf); last = performance.now(); raf = requestAnimationFrame(loop); P('open'); setTimeout(resize, 60);
  }
  function close() { if (!U.root) return; U.root.hidden = true; document.body.classList.remove('ml-on'); cancelAnimationFrame(raf); P('close'); }
  addEventListener('resize', function () { if (U.root && !U.root.hidden) resize(); });
  SH.retroLab = { open: open, close: close, _L: L, _seek: function (t) { setPlay(false); seek(t); U.rng.value = t; }, _isRetro: isRetro };
})();
