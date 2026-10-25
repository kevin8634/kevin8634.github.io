/* 天枢 Starhelm · 星域 II「日与月」· 新任务 sh.tidelock「月亮为什么总用同一面对着我们?」(v1.0-M1b)
 * 左:太空俯视(北极上方),月球绕地球公转,自转快慢可改:不自转 / 自转=公转(潮汐锁定)/ 自转快一倍
 * 右:从地球上看到的月面(真实月面贴图做正交投影)+「这一圈一共看到了月面的多少」
 * 向导 3 关:只提问,三级提示「方向 → 线索 → 半步示范」,最少 1 星。存储 gn:sh:tidelock(stars[3]),沿用 .ml 实验室样式。
 * 守星人:望舒。星桥 ID:sh.tidelock
 */
(function () {
  'use strict';
  var SH = window.SH = window.SH || {};
  var KEY = 'gn:sh:tidelock', SID = 27.321661;
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(ST)); } catch (e) { } }
  var ST = load(); ST.stars = ST.stars || [0, 0, 0];
  function h(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function P(n, a) { if (window.LE && LE.audio) LE.audio.play(n, a); }
  var TAU = Math.PI * 2;

  // 自转倍数:0 不自转 · 1 自转 = 公转 · 2 自转快一倍
  var MODES = [[0, '不自转'], [1, '自转 = 公转'], [2, '自转快一倍']];
  var L = { orb: 0, play: true, mode: 0, seen: new Uint8Array(72), q: 0, hints: 0, laps: 0 };

  var QS = [
    { kind: 'choice', q: '现在月亮<b>完全不自转</b>,只绕着地球转。看右边:绕一圈下来,地球上的人能看到它的背面吗?',
      ch: ['能,一圈下来整个月面都看过了', '不能,永远只看到同一面', '只有满月那天才看得到背面'], ok: 0,
      hint: ['盯住月面上那个小红点,看它在右边是不是一直都在。', '月亮不自转,就像一直面朝同一面墙的人绕着你走一圈。你会看到他的后脑勺吗?', '看下面的「这一圈看到了月面 __%」。不自转时,这个数会一直涨到 100%。'],
      good: '对!不自转的月亮反而会把背面转给我们看。可现实里我们<b>从来</b>看不到月球背面——说明真实的月亮一定在自转。' },
    { kind: 'mode', q: '试试下面三种自转速度。哪一种能让地球<b>永远只看到同一面</b>?选好后按「就是这个」。',
      check: function () { return L.mode === 1; },
      hint: ['只看右边:哪一种情况下,小红点一直待在原地不动?', '月亮每绕地球转过一点,自己也要跟着转过同样多,才能一直「面朝」地球。', '公转一圈的同时自转刚好一圈,两个时间一样长。'],
      good: '找到了!月球自转一圈和绕地球一圈刚好一样长,所以总是同一面朝着我们。这叫<b>潮汐锁定</b>。' },
    { kind: 'choice', q: '为什么会这么巧?月球刚形成时转得比现在快得多。你猜,是什么把它的自转「刹」慢下来的?',
      ch: ['太阳的光照把它晒慢了', '地球的引力把它拉成微微的蛋形,一直拽着这个「把手」', '月球上的空气产生了摩擦', '纯属巧合'], ok: 1,
      hint: ['地球能在海洋里拉出潮汐,它也能拉月球的「固体」。', '离地球近的一侧被拉得多,远的一侧被拉得少,月亮被拉长了一点点。', '被拉出的「鼓包」如果没对准地球,地球的引力就会拽着它,直到自转慢到鼓包一直对准地球为止。'],
      good: '没错!地球的潮汐力把月球拉出鼓包,几亿年里一点点把自转「刹」到和公转同步。月亮的晃动(天平动)让我们其实能看到约 59% 的月面。同样的力也在让地球自转变慢、让月亮每年远离我们约 3.8 厘米。' }
  ];

  var U = {}, tex = null;
  function build() {
    var r = U.root = h('section', 'ml ml--tl');
    r.innerHTML =
      '<header class="ml-hd"><div><small>星域 II · 羲和与望舒 · 日与月</small><b>月亮为什么总用同一面对着我们?</b></div><span class="ml-st"></span><button class="ml-x" type="button" aria-label="关闭">✕</button></header>' +
      '<div class="ml-body"><div class="ml-pane ml-space"><div class="ml-cap">太空俯视 · 从北极上方看</div><canvas class="ml-cv3"></canvas><div class="ml-note">示意:大小与距离未按比例(真实地月距离约 30 个地球直径)</div></div>' +
      '<div class="ml-pane ml-earth"><div class="ml-cap">从地球上看到的月面</div><canvas class="ml-cv2" width="300" height="300"></canvas>' +
      '<div class="ml-info"><b class="ml-nm"></b><span class="ml-k"></span><span class="ml-t"></span></div></div></div>' +
      '<div class="ml-ctl"><button class="ml-play" type="button">❚❚ 暂停</button><span class="ml-modes"></span><span class="ml-day"></span><button class="ml-go3d" type="button">在 3D 里看真月亮</button></div>' +
      '<div class="ml-guide"><div class="ml-q"></div><div class="ml-ch"></div><div class="ml-gb"><button class="ml-hint" type="button">给我一点提示</button><span class="ml-hs"></span></div></div>';
    document.body.appendChild(r);
    ['st', 'x', 'cv3', 'cv2', 'nm', 'k', 't', 'play', 'modes', 'day', 'go3d', 'q', 'ch', 'hint', 'hs'].forEach(function (k) { U[k] = r.querySelector('.ml-' + k); });
    U.x.onclick = close;
    U.play.onclick = function () { L.play = !L.play; U.play.textContent = L.play ? '❚❚ 暂停' : '▶ 播放'; P('click'); };
    MODES.forEach(function (m, i) {
      var b = h('button', 'ml-mode', m[1]); b.type = 'button';
      b.onclick = function () { setMode(i); P('click'); };
      U.modes.appendChild(b);
    });
    U.go3d.onclick = function () { close(); if (window.SHFOCUS) setTimeout(function () { SHFOCUS.showMoon(true); }, 200); };
    U.hint.onclick = hint;
    var im = LE && LE.assets && LE.assets.image ? LE.assets.image('planet-moon.jpg') : null;
    if (im) im.then(function (img) {
      if (!img) return; var c = document.createElement('canvas'); c.width = 512; c.height = 256;
      var g = c.getContext('2d'); g.drawImage(img, 0, 0, 512, 256); tex = g.getImageData(0, 0, 512, 256);
    });
  }
  function setMode(i) {
    L.mode = i; L.seen = new Uint8Array(72); L.laps = 0;
    [].forEach.call(U.modes.children, function (b, k) { b.classList.toggle('is-on', k === i); });
  }

  /* 月面朝向:spin = mode × orb(弧度,俯视逆时针)。地球所见的月面中心经度 = 指向地球的方向在月球本体坐标里的角度 */
  function visLon() {
    var spin = MODES[L.mode][0] * L.orb;
    var toEarth = L.orb + Math.PI;            // 从月球指向地球的方向
    var lon = toEarth - spin - Math.PI;       // 起点:orb=0 时正面(经度 0)朝向地球
    return ((lon % TAU) + TAU) % TAU;
  }

  function drawSpace() {
    var c = U.cv3, g = c.getContext('2d'), W = c.width, H = c.height, dpr = c._dpr || 1;
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H);
    var cx = W / 2, cy = H / 2, RO = Math.min(W, H) * 0.36, RE = RO * 0.2, RM = RO * 0.11;
    // 轨道
    g.strokeStyle = 'rgba(159,217,198,.35)'; g.setLineDash([6 * dpr, 6 * dpr]); g.lineWidth = dpr; g.beginPath(); g.arc(cx, cy, RO, 0, TAU); g.stroke(); g.setLineDash([]);
    // 地球
    var ge = g.createRadialGradient(cx - RE * 0.3, cy - RE * 0.3, RE * 0.2, cx, cy, RE); ge.addColorStop(0, '#7fb6ff'); ge.addColorStop(1, '#1d4f9a');
    g.fillStyle = ge; g.beginPath(); g.arc(cx, cy, RE, 0, TAU); g.fill();
    g.fillStyle = '#cfe3ff'; g.font = (12 * dpr) + 'px sans-serif'; g.textAlign = 'center'; g.fillText('地球', cx, cy + RE + 16 * dpr);
    // 月球
    var mx = cx + Math.cos(L.orb) * RO, my = cy - Math.sin(L.orb) * RO;
    var spin = MODES[L.mode][0] * L.orb;
    g.save(); g.translate(mx, my); g.rotate(-spin);
    // 正面(经度 0 起点朝 -x,即 orb=0 时朝向地球)画浅色半球,背面深色
    g.fillStyle = '#5b6170'; g.beginPath(); g.arc(0, 0, RM, 0, TAU); g.fill();
    g.fillStyle = '#d9d6cc'; g.beginPath(); g.arc(0, 0, RM, Math.PI / 2, Math.PI * 1.5); g.closePath(); g.fill();
    g.fillStyle = '#ff6b6b'; g.beginPath(); g.arc(-RM * 0.98, 0, RM * 0.22, 0, TAU); g.fill();   // 小红点:正面中心
    g.restore();
    // 地球视线
    g.strokeStyle = 'rgba(255,107,107,.35)'; g.lineWidth = dpr; g.beginPath(); g.moveTo(cx, cy); g.lineTo(mx, my); g.stroke();
    g.fillStyle = '#e6e3da'; g.fillText('月球', mx, my - RM - 8 * dpr);
  }

  function drawFace() {
    var c = U.cv2, g = c.getContext('2d'), W = c.width, R = W * 0.42, cx = W / 2, cy = W / 2, lon0 = visLon();
    g.clearRect(0, 0, W, W);
    if (tex) {
      var img = g.createImageData(W, W), d = img.data, td = tex.data, tw = tex.width, th = tex.height;
      for (var y = 0; y < W; y++) {
        var ny = (cy - y) / R; if (ny < -1 || ny > 1) continue;
        var lat = Math.asin(ny), cl = Math.cos(lat);
        for (var x = 0; x < W; x++) {
          var nx = (x - cx) / R, q = nx * nx + ny * ny; if (q > 1) continue;
          var lon = lon0 + Math.atan2(nx, Math.sqrt(1 - q));
          var u = ((lon / TAU) + 0.5) % 1; if (u < 0) u += 1;
          var tx = Math.floor(u * tw) % tw, ty = Math.min(th - 1, Math.floor((0.5 - lat / Math.PI) * th));
          var si = (ty * tw + tx) * 4, di = (y * W + x) * 4, sh = 0.75 + 0.25 * Math.sqrt(1 - q);
          d[di] = td[si] * sh; d[di + 1] = td[si + 1] * sh; d[di + 2] = td[si + 2] * sh; d[di + 3] = 255;
        }
      }
      g.putImageData(img, 0, 0);
    } else { g.fillStyle = '#bdb8ac'; g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.fill(); }
    // 小红点(正面中心,经度 0)是否在可见半球
    var dl = Math.atan2(Math.sin(-lon0), Math.cos(-lon0));
    if (Math.abs(dl) < Math.PI / 2) { g.fillStyle = '#ff6b6b'; g.beginPath(); g.arc(cx + Math.sin(dl) * R, cy, 7, 0, TAU); g.fill(); }
    // 记录看到过的经度(每 5°一格)
    for (var k = -18; k < 18; k++) { var a = (((lon0 + k * 5 * Math.PI / 180) % TAU) + TAU) % TAU; L.seen[Math.floor(a / TAU * 72) % 72] = 1; }
  }

  function info() {
    var n = 0; for (var i = 0; i < 72; i++) n += L.seen[i];
    var pct = Math.round(n / 72 * 100), back = Math.abs(Math.atan2(Math.sin(visLon()), Math.cos(visLon()))) > Math.PI / 2;
    U.nm.textContent = back ? '正看着背面' : '正看着正面';
    U.k.textContent = '这一圈看到了月面 ' + pct + '%';
    U.t.textContent = MODES[L.mode][1] + (L.mode === 1 ? '(潮汐锁定)' : '');
    U.day.textContent = '第 ' + (L.orb / TAU * SID).toFixed(1) + ' 天 / 27.3';
  }

  /* ---------- 向导 ---------- */
  function stars() { var n = ST.stars.reduce(function (s, x) { return s + x; }, 0); U.st.textContent = '★ ' + n + ' / 9'; }
  function showQ() {
    stars(); L.hints = 0; U.hs.textContent = ''; U.ch.innerHTML = ''; U.hint.hidden = false;
    if (L.q >= QS.length) {
      U.q.innerHTML = '<b>三关完成!</b>你弄明白了月亮的「一面之缘」。去 3D 里飞近真正的月亮看看那张永远朝着我们的脸吧。<br><a class="sh-bridge-a" href="../nomoverse/tide/">✦ 星桥 → 宙律:月亮怎样拉动整片大海?</a>'; U.hint.hidden = true;
      var go = h('button', 'ml-c ml-c--go', '🌕 飞近月亮'); go.type = 'button'; go.onclick = function () { U.go3d.onclick(); }; U.ch.appendChild(go);
      if (SH.tideLab) { var t = h('button', 'ml-c', '🌊 潮汐实验室'); t.type = 'button'; t.onclick = function () { close(); SH.tideLab.open(); }; U.ch.appendChild(t); }
      return;
    }
    var Q = QS[L.q]; U.q.innerHTML = '<small>第 ' + (L.q + 1) + ' / 3 关</small>' + Q.q;
    if (L.q === 0) setMode(0);
    if (Q.kind === 'choice') Q.ch.forEach(function (t, i) { var b = h('button', 'ml-c', t); b.type = 'button'; b.onclick = function () { answer(i === Q.ok, b); }; U.ch.appendChild(b); });
    else { var b = h('button', 'ml-c ml-c--go', '就是这个'); b.type = 'button'; b.onclick = function () { answer(Q.check(), b); }; U.ch.appendChild(b); }
  }
  function answer(ok, b) {
    var Q = QS[L.q];
    if (!ok) { b.classList.add('no'); P('blip'); U.hs.textContent = '再想想,也可以看一条提示。'; return; }
    var got = Math.max(1, 3 - L.hints); ST.stars[L.q] = Math.max(ST.stars[L.q] || 0, got); save(); P('arrive');
    try { SH.progress && SH.progress.explore && SH.progress.explore('tidelock'); } catch (e) { }
    U.ch.innerHTML = ''; U.hint.hidden = true;
    U.q.innerHTML = '<small>第 ' + (L.q + 1) + ' 关 · 获得 ' + '★'.repeat(got) + '</small>' + Q.good;
    var n = h('button', 'ml-c ml-c--go', L.q < 2 ? '下一关' : '完成'); n.type = 'button';
    n.onclick = function () { L.q++; if (L.q === 2) setMode(1); showQ(); }; U.ch.appendChild(n); stars();
    if (window.SHHUD && SHHUD.refreshTasks) SHHUD.refreshTasks();
  }
  function hint() {
    var Q = QS[L.q]; if (!Q || L.hints >= 3) return; P('click');
    U.hs.innerHTML = ['方向', '线索', '半步示范'][L.hints] + ':' + Q.hint[L.hints]; L.hints++;
    if (L.hints >= 3) U.hint.hidden = true;
  }

  function resize() {
    var c = U.cv3, r = c.parentNode.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
    c._dpr = dpr; c.width = Math.max(10, r.width * dpr); c.height = Math.max(10, r.height * dpr);
    c.style.width = r.width + 'px'; c.style.height = r.height + 'px';
  }
  var raf = 0, last = 0, fc = 0;
  var RM = matchMedia('(prefers-reduced-motion: reduce)');
  function loop(t) {
    raf = requestAnimationFrame(loop); var dt = Math.min(0.1, (t - last) / 1000 || 0); last = t;
    if (L.play) L.orb += dt * TAU / (RM.matches ? 24 : 12);   // 12 秒绕一圈(减少动态时 24 秒)
    if (fc % 30 === 0) { var pr = U.cv3.parentNode.getBoundingClientRect(), dp = U.cv3._dpr || 1; if (Math.abs(pr.width * dp - U.cv3.width) > 2 || Math.abs(pr.height * dp - U.cv3.height) > 2) resize(); }
    drawSpace(); if (++fc % 2 === 0) drawFace(); info();
  }
  function open() {
    if (!U.root) build();
    U.root.hidden = false; document.body.classList.add('ml-on');
    resize(); L.q = ST.stars.indexOf(0); if (L.q < 0) L.q = 3; L.orb = 0; setMode(L.q === 2 || L.q === 3 ? 1 : 0); showQ();
    cancelAnimationFrame(raf); raf = requestAnimationFrame(loop); P('open');
  }
  function close() { if (!U.root) return; U.root.hidden = true; document.body.classList.remove('ml-on'); cancelAnimationFrame(raf); P('close'); }
  addEventListener('resize', function () { if (U.root && !U.root.hidden) resize(); });
  SH.tidelockLab = { open: open, close: close, _L: L };
})();
