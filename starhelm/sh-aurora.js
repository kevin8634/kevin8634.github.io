/* 天枢 Starhelm · 星域 II「日与月」· 新任务 sh.aurora「极光是太阳寄来的信吗?」(v1.0-M1c)
 * 左:太阳风(带电粒子)吹向地球,被地球磁场挡住,沿磁力线滑向南北两极,在极区上空点亮极光。太阳风强弱可调(对应 Kp 0–9)。
 * 右:从北极上空俯视的极光椭圆(按地磁纬度示意),Kp 越大越往低纬扩张;可一键读取此刻 Kp(NOAA SWPC,来自 sh-eye.js)。
 * 向导 3 关:只提问,三级提示,最少 1 星。存储 gn:sh:aurora(stars[3]),沿用 .ml 实验室样式。守星人:羲和。星桥 ID:sh.aurora
 */
(function () {
  'use strict';
  var SH = window.SH = window.SH || {};
  var KEY = 'gn:sh:aurora', TAU = Math.PI * 2;
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(ST)); } catch (e) { } }
  var ST = load(); ST.stars = ST.stars || [0, 0, 0];
  function h(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function P(n) { if (window.LE && LE.audio) LE.audio.play(n); }
  var L = { kp: 3, play: true, q: 0, hints: 0, parts: [], glowN: 0, glowS: 0 };
  // 极光椭圆赤道侧边界(地磁纬度,示意):Kp 0 ≈ 66°,每级约低 2°,Kp 9 ≈ 48°
  function eqLat(kp) { return 66 - 2 * kp; }

  var QS = [
    { kind: 'choice', q: '看左边:太阳吹来的带电粒子,最后大多落到了地球的哪里?',
      ch: ['赤道上空', '南北两极附近', '均匀地落满全球'], ok: 1,
      hint: ['盯住几颗粒子,看它们碰到地球磁场以后往哪儿拐。', '地球像一块大磁铁,磁力线从南极附近出来、在北极附近钻进去。带电粒子喜欢顺着磁力线走。', '磁力线在哪里「扎」进地球?粒子就会在那里撞上高层大气。'],
      good: '对!地球磁场像一把伞挡住了大部分太阳风,漏进来的粒子顺着磁力线滑向两极,撞上高空大气发光,这就是极光。北边叫北极光,南边叫南极光。' },
    { kind: 'kp', q: '把太阳风调强到 <b>Kp 7 以上</b>(强磁暴),看看右边的极光环怎么变,然后按「就是这样」。',
      check: function () { return L.kp >= 7; },
      hint: ['拖动下面的「太阳风强度」滑块。', '往右拖,太阳风越强,看右图那圈绿色往哪个方向跑。', '拖到 7、8 或 9,再按「就是这样」。'],
      good: '看到了吧:磁暴越强,极光环越往低纬度扩张。2024 年 5 月 10–11 日的特大磁暴(Kp 9),连中国北方很多地方都拍到了红色极光。' },
    { kind: 'choice', q: '太阳上发生一次大爆发(日冕物质抛射)后,那团带电粒子大约多久到达地球?',
      ch: ['约 8 分钟', '约 1–3 天', '约 1 年'], ok: 1,
      hint: ['8 分钟是光从太阳到地球的时间。粒子比光慢得多。', '日冕物质抛射的速度大约每秒几百到两千多公里。日地距离约 1.5 亿公里。', '1.5 亿公里 ÷ 每秒 1000 公里 ≈ 15 万秒,算算是几天?'],
      good: '没错,大约 1–3 天。所以科学家看到太阳爆发,就能提前一两天发布极光和磁暴预报。极光的绿色来自约 100–250 公里高的氧原子,更高处的氧发红光,氮发紫蓝色的光——它真像一封从太阳寄来、用颜色写成的信。' }
  ];

  var U = {};
  function build() {
    var r = U.root = h('section', 'ml ml--au');
    r.innerHTML =
      '<header class="ml-hd"><div><small>星域 II · 羲和与望舒 · 日与月</small><b>极光是太阳寄来的信吗?</b></div><span class="ml-st"></span><button class="ml-x" type="button" aria-label="关闭">✕</button></header>' +
      '<div class="ml-body"><div class="ml-pane ml-space"><div class="ml-cap">太阳风与地球磁场 · 侧视</div><canvas class="ml-cv3"></canvas><div class="ml-note">示意:太阳与地球的大小、距离未按比例</div></div>' +
      '<div class="ml-pane ml-earth"><div class="ml-cap">从北极上空看极光环</div><canvas class="ml-cv2" width="320" height="320"></canvas>' +
      '<div class="ml-info"><b class="ml-nm"></b><span class="ml-k"></span><span class="ml-t"></span></div></div></div>' +
      '<div class="ml-ctl"><button class="ml-play" type="button">❚❚ 暂停</button><span class="au-l">太阳风强度</span><input class="ml-rng" type="range" min="0" max="9" step="1"><span class="ml-day"></span><button class="ml-now" type="button">此刻 Kp</button></div>' +
      '<div class="ml-guide"><div class="ml-q"></div><div class="ml-ch"></div><div class="ml-gb"><button class="ml-hint" type="button">给我一点提示</button><span class="ml-hs"></span></div></div>';
    document.body.appendChild(r);
    ['st', 'x', 'cv3', 'cv2', 'nm', 'k', 't', 'play', 'rng', 'day', 'now', 'q', 'ch', 'hint', 'hs'].forEach(function (k) { U[k] = r.querySelector('.ml-' + k); });
    U.x.onclick = close;
    U.play.onclick = function () { L.play = !L.play; U.play.textContent = L.play ? '❚❚ 暂停' : '▶ 播放'; P('click'); };
    U.rng.oninput = function () { L.kp = +U.rng.value; upd(); };
    U.now.onclick = function () {
      var k = SH.eye && SH.eye.kp; P('click');
      if (k == null || isNaN(k)) { U.t.textContent = '此刻 Kp 暂时取不到(NOAA SWPC),先自己调调看'; return; }
      L.kp = Math.max(0, Math.min(9, Math.round(k))); U.rng.value = L.kp; upd(true);
    };
    U.hint.onclick = hint;
  }

  function word(kp) { return kp >= 8 ? '特大磁暴' : kp >= 7 ? '强磁暴' : kp >= 5 ? '磁暴' : kp >= 4 ? '活跃' : '平静'; }
  function upd(fromNow) {
    U.rng.value = L.kp; U.day.textContent = 'Kp ' + L.kp + ' · ' + word(L.kp);
    U.nm.textContent = '极光环约在地磁纬度 ' + eqLat(L.kp) + '° 以北';
    U.k.textContent = L.kp >= 7 ? '中纬度也可能看到(多为红色)' : L.kp >= 5 ? '高纬度城市常能看到' : '主要在北极圈附近';
    U.t.textContent = fromNow ? '已读取此刻 Kp(NOAA SWPC)' : '地磁纬度与地理纬度不同:中国大部分地区的地磁纬度比地理纬度低约 10°';
  }

  /* ---------- 左:太阳风 + 磁层 ---------- */
  function spawn(W, H) {
    return { x: -Math.random() * W * 0.04, y: H * (0.2 + Math.random() * 0.6), vx: 1, mode: 0, t: 0, L: 0, hemi: 1, s: 0 };
  }
  function drawSide(dt) {
    var c = U.cv3, g = c.getContext('2d'), W = c.width, H = c.height, d = c._dpr || 1;
    g.clearRect(0, 0, W, H);
    var ex = W * 0.68, ey = H * 0.5, R = Math.min(W, H) * 0.075, k = L.kp;
    // 太阳(左边缘)
    var sg = g.createRadialGradient(0, ey, 0, 0, ey, H * 0.45); sg.addColorStop(0, 'rgba(255,220,140,1)'); sg.addColorStop(0.35, 'rgba(255,170,60,.55)'); sg.addColorStop(1, 'rgba(255,140,40,0)');
    g.fillStyle = sg; g.fillRect(0, 0, W * 0.4, H);
    g.fillStyle = '#ffd98a'; g.font = (12 * d) + 'px sans-serif'; g.textAlign = 'left'; g.fillText('太阳', 10 * d, ey - H * 0.2);
    // 磁层顶:太阳风越强,被压得越近
    var mp = R * (10 - 0.55 * k);
    g.strokeStyle = 'rgba(127,214,255,.35)'; g.lineWidth = d * 1.2; g.beginPath();
    for (var a = -2.3; a <= 2.3; a += 0.05) { var rr = mp * Math.pow(2 / (1 + Math.cos(a)), 0.55); g.lineTo(ex - rr * Math.cos(a), ey - rr * Math.sin(a)); }
    g.stroke();
    // 磁力线(偶极子 r = Lsin²θ,向阳面被压缩)
    g.lineWidth = d;
    for (var Lk = 2; Lk <= 6; Lk++) {
      g.strokeStyle = 'rgba(127,214,255,' + (0.42 - Lk * 0.05) + ')';
      [-1, 1].forEach(function (side) {
        g.beginPath();
        for (var th = 0.15; th <= Math.PI - 0.15; th += 0.04) {
          var r = Lk * R * 1.1 * Math.pow(Math.sin(th), 2) * (side < 0 ? (1 - 0.06 * k * Math.sin(th)) : (1 + 0.12 * Math.sin(th) * Lk / 3));
          g.lineTo(ex + side * r * Math.sin(th), ey - r * Math.cos(th));
        }
        g.stroke();
      });
    }
    // 地球
    var eg = g.createRadialGradient(ex - R * 0.4, ey - R * 0.3, R * 0.1, ex, ey, R); eg.addColorStop(0, '#8fc4ff'); eg.addColorStop(1, '#1d4f9a');
    g.fillStyle = eg; g.beginPath(); g.arc(ex, ey, R, 0, TAU); g.fill();
    g.fillStyle = '#cfe3ff'; g.textAlign = 'center'; g.fillText('地球', ex, ey + R + 16 * d);
    // 极区辉光
    L.glowN *= Math.pow(0.4, dt); L.glowS *= Math.pow(0.4, dt);
    [[-1, L.glowN], [1, L.glowS]].forEach(function (p) {
      var a2 = Math.min(1, 0.25 + p[1] * 0.08 + k * 0.05), yy = ey + p[0] * R * 0.92, gg = g.createRadialGradient(ex, yy, 0, ex, yy, R * (0.55 + k * 0.05));
      gg.addColorStop(0, 'rgba(93,255,154,' + a2 + ')'); if (k >= 7) gg.addColorStop(0.6, 'rgba(255,90,110,' + a2 * 0.5 + ')'); gg.addColorStop(1, 'rgba(93,255,154,0)');
      g.fillStyle = gg; g.beginPath(); g.arc(ex, yy, R * (0.55 + k * 0.05), 0, TAU); g.fill();
    });
    g.fillStyle = 'rgba(207,255,226,.85)'; g.fillText('北极光', ex, ey - R * 1.55); g.fillText('南极光', ex, ey + R * 1.85);
    // 粒子
    var rate = L.play ? (4 + k * 3) : 0, sp = (W * 0.18) * (0.6 + k * 0.1);
    for (var n = 0; n < rate * dt * 6; n++) if (L.parts.length < 420) L.parts.push(spawn(W, H));
    g.fillStyle = 'rgba(255,214,120,.9)';
    for (var i = L.parts.length - 1; i >= 0; i--) {
      var q = L.parts[i];
      if (L.play) {
        if (q.mode === 0) {
          q.x += sp * dt;
          var dx = q.x - ex, dy = q.y - ey, rr2 = Math.hypot(dx, dy);
          if (rr2 < mp && dx < 0) {
            // 撞上磁层顶:多数被绕开,少数(磁暴时更多)被引向两极
            if (Math.random() < 0.18 + k * 0.06) { q.mode = 1; q.hemi = dy < 0 ? -1 : 1; q.L = Math.max(2, Math.min(6, rr2 / (R * 1.1))); q.t = Math.acos(Math.max(-1, Math.min(1, -dy / (rr2 || 1)))); }
            else { q.mode = 2; q.vy = (dy < 0 ? -1 : 1) * sp * 0.9; }
          }
        } else if (q.mode === 1) {
          // 沿磁力线滑向极区
          var tgt = q.hemi < 0 ? 0.2 : Math.PI - 0.2;
          q.t += (tgt - q.t) * Math.min(1, dt * 2.2);
          var r3 = q.L * R * 1.1 * Math.pow(Math.sin(q.t), 2);
          q.x = ex - r3 * Math.sin(q.t); q.y = ey - r3 * Math.cos(q.t);
          if (Math.abs(q.t - tgt) < 0.05) { if (q.hemi < 0) L.glowN++; else L.glowS++; L.parts.splice(i, 1); continue; }
        } else { q.x += sp * dt * 0.9; q.y += q.vy * dt; }
        if (q.x > W + 10 || q.y < -10 || q.y > H + 10) { L.parts.splice(i, 1); continue; }
      }
      g.fillStyle = q.mode === 1 ? 'rgba(130,255,180,.95)' : 'rgba(255,214,120,.85)';
      g.fillRect(q.x - d, q.y - d, 2 * d, 2 * d);
    }
  }

  /* ---------- 右:北极俯视极光环 ---------- */
  function drawPolar(t) {
    var c = U.cv2, g = c.getContext('2d'), W = c.width, cx = W / 2, cy = W / 2, R = W * 0.46;
    g.clearRect(0, 0, W, W);
    function rOf(lat) { return R * (90 - lat) / 50; }   // 40°N 到边缘
    g.fillStyle = '#0b1f3a'; g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.fill();
    // 极光环(夜侧偏向下方,日侧收窄)
    var e = eqLat(L.kp), pole = e + 8 + L.kp * 0.3, flick = 0.85 + 0.15 * Math.sin(t / 300);
    for (var a = 0; a < TAU; a += 0.04) {
      var night = (1 + Math.sin(a)) / 2;   // 屏幕下方 = 夜侧
      var r1 = rOf(e - 3 * night + 2), r2 = rOf(pole + 2 * (1 - night)), cxo = cx, cyo = cy + R * 0.05;
      var gr = g.createRadialGradient(cxo, cyo, r2, cxo, cyo, r1);
      var al = (0.35 + 0.45 * night) * flick;
      gr.addColorStop(0, 'rgba(93,255,154,0)'); gr.addColorStop(0.5, 'rgba(93,255,154,' + al + ')');
      gr.addColorStop(1, L.kp >= 7 ? 'rgba(255,90,110,' + al * 0.6 + ')' : 'rgba(93,255,154,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(cxo, cyo, r1, a, a + 0.05); g.arc(cxo, cyo, r2, a + 0.05, a, true); g.closePath(); g.fill();
    }
    // 纬度圈
    g.strokeStyle = 'rgba(160,190,230,.35)'; g.fillStyle = 'rgba(190,210,240,.8)'; g.font = '11px sans-serif'; g.textAlign = 'left'; g.lineWidth = 1;
    [80, 70, 60, 50].forEach(function (lat) { g.beginPath(); g.arc(cx, cy, rOf(lat), 0, TAU); g.stroke(); g.fillText(lat + '°', cx + 3, cy - rOf(lat) + 12); });
    g.fillStyle = '#fff'; g.beginPath(); g.arc(cx, cy, 2.5, 0, TAU); g.fill();
    g.textAlign = 'center'; g.fillStyle = '#ffd98a'; g.fillText('☀ 日侧', cx, 14); g.fillStyle = '#9fb3cc'; g.fillText('夜侧', cx, W - 5);
  }

  /* ---------- 向导 ---------- */
  function stars() { var n = ST.stars.reduce(function (s, x) { return s + x; }, 0); U.st.textContent = '★ ' + n + ' / 9'; }
  function showQ() {
    stars(); L.hints = 0; U.hs.textContent = ''; U.ch.innerHTML = ''; U.hint.hidden = false;
    if (L.q >= QS.length) {
      U.q.innerHTML = '<b>三关完成!</b>你读懂了太阳寄来的信。打开地球上的「极光」图层,看看此刻的极光椭圆吧。'; U.hint.hidden = true;
      if (SH.sunLab) { var s = h('button', 'ml-c ml-c--go', '☀ 去太阳活动观测台'); s.type = 'button'; s.onclick = function () { close(); SH.sunLab.open(); }; U.ch.appendChild(s); }
      return;
    }
    var Q = QS[L.q]; U.q.innerHTML = '<small>第 ' + (L.q + 1) + ' / 3 关</small>' + Q.q;
    if (Q.kind === 'choice') Q.ch.forEach(function (t, i) { var b = h('button', 'ml-c', t); b.type = 'button'; b.onclick = function () { answer(i === Q.ok, b); }; U.ch.appendChild(b); });
    else { var b = h('button', 'ml-c ml-c--go', '就是这样'); b.type = 'button'; b.onclick = function () { answer(Q.check(), b); }; U.ch.appendChild(b); }
  }
  function answer(ok, b) {
    var Q = QS[L.q];
    if (!ok) { b.classList.add('no'); P('blip'); U.hs.textContent = '再想想,也可以看一条提示。'; return; }
    var got = Math.max(1, 3 - L.hints); ST.stars[L.q] = Math.max(ST.stars[L.q] || 0, got); save(); P('arrive');
    try { SH.progress && SH.progress.explore && SH.progress.explore('aurora'); } catch (e) { }
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
    c.style.width = r.width + 'px'; c.style.height = r.height + 'px'; L.parts = [];
  }
  var raf = 0, last = 0, fc = 0, RM = matchMedia('(prefers-reduced-motion: reduce)');
  function loop(t) {
    raf = requestAnimationFrame(loop); var dt = Math.min(0.1, (t - last) / 1000 || 0); last = t;
    if (RM.matches) dt *= 0.5;
    if (++fc % 30 === 0) { var pr = U.cv3.parentNode.getBoundingClientRect(), dp = U.cv3._dpr || 1; if (Math.abs(pr.width * dp - U.cv3.width) > 2 || Math.abs(pr.height * dp - U.cv3.height) > 2) resize(); }
    drawSide(dt); if (fc % 2 === 0) drawPolar(RM.matches ? 0 : t);
  }
  function open() {
    if (!U.root) build();
    U.root.hidden = false; document.body.classList.add('ml-on');
    resize(); L.q = ST.stars.indexOf(0); if (L.q < 0) L.q = 3; L.kp = 3; upd(); showQ();
    cancelAnimationFrame(raf); last = performance.now(); raf = requestAnimationFrame(loop); P('open');
  }
  function close() { if (!U.root) return; U.root.hidden = true; document.body.classList.remove('ml-on'); cancelAnimationFrame(raf); P('close'); }
  addEventListener('resize', function () { if (U.root && !U.root.hidden) resize(); });
  SH.auroraLab = { open: open, close: close, _L: L };
})();
