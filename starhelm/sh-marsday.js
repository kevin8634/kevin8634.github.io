/* 天枢 Starhelm · 星域 III「行星世界」· 新任务 sh.marsday「火星上的一天有多长?」(v1.0-M2a)
 * 左:俯视一颗行星绕太阳公转,同时自转;地面上插一面小旗。数「自转一圈」(恒星日)和「太阳再次到头顶」(太阳日)。
 *     为了看得清,公转被大大加快(每年只自转几圈),画面角注已说明;真实数字在右侧。
 * 右:地球 / 火星 / 金星的一天、自转一圈、一年;火星时钟(从此刻起地球时间 vs 火星时间)。
 * 向导 3 关:只提问,三级提示,最少 1 星。存储 gn:sh:marsday(stars[3]),沿用 .ml 实验室样式。守星人:岁星。星桥 ID:sh.marsday
 */
(function () {
  'use strict';
  var SH = window.SH = window.SH || {};
  var KEY = 'gn:sh:marsday', TAU = Math.PI * 2;
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(ST)); } catch (e) { } }
  var ST = load(); ST.stars = ST.stars || [0, 0, 0];
  function h(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function P(n) { if (window.LE && LE.audio) LE.audio.play(n); }

  // 真实数据(小时):恒星日、太阳日、公转周期(地球日)。示意动画里每年自转 vis 圈(金星为负 = 倒着转)
  var PL = {
    earth: { zh: '地球', col: '#5aa8ff', sid: 23.9345, sol: 24, year: 365.256, vis: 6, txt: ['24 小时', '23 小时 56 分', '365.25 天'] },
    mars: { zh: '火星', col: '#ff8a5c', sid: 24.6229, sol: 24.6597, year: 686.98, vis: 6, txt: ['24 小时 39 分 35 秒', '24 小时 37 分', '687 地球日(668.6 个火星日)'] },
    venus: { zh: '金星', col: '#f3d48a', sid: -5832.5, sol: 2802, year: 224.701, vis: -0.92, txt: ['约 117 个地球日', '243 个地球日(倒着转)', '224.7 地球日'] }
  };
  var L = { id: 'mars', orb: 0, spin: 0, play: true, sid: 0, sol: 0, q: 0, hints: 0, lastFace: null, lastAng: 0 };

  var QS = [
    { kind: 'choice', q: '左边的行星每自转一圈(小旗回到同一个方向),计数「自转」加 1;太阳重新回到小旗头顶,计数「一天」加 1。看一会儿:哪个数涨得快?',
      ch: ['「自转」涨得快:自转一圈后还要多转一点,太阳才回到头顶', '「一天」涨得快', '两个永远一样'], ok: 0,
      hint: ['盯住小旗:它转回原来方向时,太阳在不在它正上方?', '行星自转的同时也在绕太阳走。走了一段之后,太阳的方向变了。', '所以自转一圈还不够,要再多转一点点才能重新对准太阳。'],
      good: '对!自转一圈叫「恒星日」,太阳回到头顶叫「太阳日」。地球上差约 4 分钟:23 小时 56 分 vs 24 小时。火星上,一个太阳日是 24 小时 39 分 35 秒,叫一个「火星日(sol)」。' },
    { kind: 'choice', q: '把行星换成「金星」。金星自转一圈要 243 个地球日,还是倒着转,比它绕太阳一圈(225 天)还慢。金星上从日出到下一次日出,大约多久?',
      ch: ['约 117 个地球日', '约 243 个地球日', '永远不会再日出'], ok: 0, onShow: function () { setPlanet('venus'); },
      hint: ['看左边:金星倒着转,公转又是正着走。太阳在它天上是往哪边走的?', '倒着自转和正着公转,两个效果是叠加的,太阳反而回来得更快。', '1 ÷ 243 + 1 ÷ 225 ≈ 1 ÷ 117。'],
      good: '没错,约 117 天!金星上太阳西升东落,一个「白天」就有将近两个月。金星的一年(225 天)还不到两个金星日。' },
    { kind: 'choice', q: '火星车的工程师要跟着火星的太阳上下班。一个火星日比地球日长 39 分 35 秒。他们每天的上班时间,按地球时钟会怎么变?',
      ch: ['每天推迟约 40 分钟', '每天提前约 40 分钟', '一直不变'], ok: 0, onShow: function () { setPlanet('mars'); },
      hint: ['火星上的「早上 9 点」,要等一个火星日才会再来。', '一个火星日比 24 小时多 39 分 35 秒。', '所以按地球时钟,每天都要晚这么久;大约 36 天后就晚了整整一天。'],
      good: '对!这叫「火星时间」。勇气号、好奇号刚着陆时,团队真的按火星日倒班,作息每天推迟约 40 分钟,大约每 37 天就绕回一圈。右边的火星时钟就是这么走的。' }
  ];

  var U = {};
  function build() {
    var r = U.root = h('section', 'ml ml--md');
    r.innerHTML =
      '<header class="ml-hd"><div><small>星域 III · 岁星 · 行星世界</small><b>火星上的一天有多长?</b></div><span class="ml-st"></span><button class="ml-x" type="button" aria-label="关闭">✕</button></header>' +
      '<div class="ml-body"><div class="ml-pane ml-space"><div class="ml-cap">从北极上方俯视</div><canvas class="ml-cv3"></canvas><div class="ml-note">示意:为了看清,公转加快了很多倍(真实的一年里地球自转约 366 圈)</div></div>' +
      '<div class="ml-pane ml-earth md-r"><div class="ml-cap">真实的一天与一年</div><div class="md-tbl"></div><div class="md-clk"></div></div></div>' +
      '<div class="ml-ctl"><button class="ml-play" type="button">❚❚ 暂停</button><span class="ml-modes"></span><span class="ml-day"></span></div>' +
      '<div class="ml-guide"><div class="ml-q"></div><div class="ml-ch"></div><div class="ml-gb"><button class="ml-hint" type="button">给我一点提示</button><span class="ml-hs"></span></div></div>';
    document.body.appendChild(r);
    ['st', 'x', 'cv3', 'play', 'modes', 'day', 'q', 'ch', 'hint', 'hs'].forEach(function (k) { U[k] = r.querySelector('.ml-' + k); });
    U.tbl = r.querySelector('.md-tbl'); U.clk = r.querySelector('.md-clk');
    U.x.onclick = close;
    U.play.onclick = function () { L.play = !L.play; U.play.textContent = L.play ? '❚❚ 暂停' : '▶ 播放'; P('click'); };
    ['earth', 'mars', 'venus'].forEach(function (id) { var b = h('button', 'ml-mode', PL[id].zh); b.type = 'button'; b.dataset.id = id; b.onclick = function () { setPlanet(id); P('click'); }; U.modes.appendChild(b); });
    U.hint.onclick = hint;
    var rows = '<div class="md-h"><span></span><span>一天(日出到日出)</span><span>自转一圈</span><span>一年</span></div>';
    ['earth', 'mars', 'venus'].forEach(function (id) { var p = PL[id]; rows += '<div class="md-row" data-id="' + id + '"><b style="color:' + p.col + '">' + p.zh + '</b><span>' + p.txt[0] + '</span><span>' + p.txt[1] + '</span><span>' + p.txt[2] + '</span></div>'; });
    U.tbl.innerHTML = rows;
  }
  function setPlanet(id) {
    L.id = id; L.orb = 0; L.spin = 0; L.sid = 0; L.sol = 0; L.lastAng = 0; L.lastSol = 0;
    [].forEach.call(U.modes.children, function (b) { b.classList.toggle('is-on', b.dataset.id === id); });
    [].forEach.call(U.tbl.querySelectorAll('.md-row'), function (r) { r.classList.toggle('is-on', r.dataset.id === id); });
  }

  function draw() {
    var c = U.cv3, g = c.getContext('2d'), W = c.width, H = c.height, d = c._dpr || 1, p = PL[L.id];
    g.clearRect(0, 0, W, H);
    var cx = W / 2, cy = H / 2 - (W < 600 * d ? 12 * d : 0), RO = Math.min(W, H) * 0.32, RP = Math.min(W, H) * 0.075;
    var sg = g.createRadialGradient(cx, cy, 0, cx, cy, RO * 0.35); sg.addColorStop(0, '#fff3c4'); sg.addColorStop(0.4, '#ffc45a'); sg.addColorStop(1, 'rgba(255,170,60,0)');
    g.fillStyle = sg; g.beginPath(); g.arc(cx, cy, RO * 0.35, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(159,217,198,.3)'; g.setLineDash([5 * d, 6 * d]); g.lineWidth = d; g.beginPath(); g.arc(cx, cy, RO, 0, TAU); g.stroke(); g.setLineDash([]);
    var px = cx + Math.cos(L.orb) * RO, py = cy - Math.sin(L.orb) * RO;
    // 行星:朝阳半球亮
    var toSun = Math.atan2(-(cy - py), cx - px);   // 屏幕坐标里朝向太阳的角(数学方向)
    g.fillStyle = '#1a2233'; g.beginPath(); g.arc(px, py, RP, 0, TAU); g.fill();
    g.save(); g.translate(px, py); g.rotate(-toSun);
    g.fillStyle = p.col; g.beginPath(); g.arc(0, 0, RP, -Math.PI / 2, Math.PI / 2); g.closePath(); g.fill();
    g.restore();
    // 小旗(随自转)
    var fa = L.spin;
    var fx = px + Math.cos(fa) * RP, fy = py - Math.sin(fa) * RP, tx = px + Math.cos(fa) * RP * 1.8, ty = py - Math.sin(fa) * RP * 1.8;
    g.strokeStyle = '#fff'; g.lineWidth = 2 * d; g.beginPath(); g.moveTo(fx, fy); g.lineTo(tx, ty); g.stroke();
    g.fillStyle = '#ff6b6b'; g.beginPath(); g.moveTo(tx, ty); g.lineTo(tx + Math.cos(fa + 1.9) * 10 * d, ty - Math.sin(fa + 1.9) * 10 * d); g.lineTo(px + Math.cos(fa) * RP * 1.5, py - Math.sin(fa) * RP * 1.5); g.fill();
    // 参照方向(远处恒星方向)
    g.strokeStyle = 'rgba(255,255,255,.18)'; g.setLineDash([3 * d, 4 * d]); g.beginPath(); g.moveTo(px, py); g.lineTo(px + RP * 2.6, py); g.stroke(); g.setLineDash([]);
    g.fillStyle = 'rgba(200,215,235,.7)'; g.font = (11 * d) + 'px sans-serif'; g.textAlign = 'left'; g.fillText('→ 远方恒星', px + RP * 2.7, py + 4 * d);
    // 太阳方向
    g.strokeStyle = 'rgba(255,200,90,.35)'; g.beginPath(); g.moveTo(px, py); g.lineTo(cx, cy); g.stroke();
    // 计数
    g.fillStyle = '#e8f2ff'; g.font = (13 * d) + 'px sans-serif'; g.textAlign = 'left';
    var nar = W < 600 * d, y1 = nar ? H - 30 * d : 46 * d; g.font = ((nar ? 12 : 15) * d) + 'px sans-serif'; g.fillText('自转:' + L.sid + ' 圈', 12 * d, y1); g.fillStyle = '#f0c97a'; g.fillText('一天(太阳回到头顶):' + L.sol + ' 次', 12 * d, y1 + (nar ? 18 : 24) * d);
  }
  function step(dt) {
    var p = PL[L.id], w = 0.55;                       // 公转角速度(示意)
    var dOrb = dt * w, dSpin = dOrb * p.vis;
    L.orb += dOrb; L.spin += dSpin;
    // 恒星日:小旗相对远方恒星转过整圈
    var s = Math.floor(Math.abs(L.spin) / TAU); if (s !== L.sid) { L.sid = s; }
    // 太阳日:小旗相对太阳方向转过整圈(相对角 = spin − (orb+π))
    var rel = L.spin - L.orb; var so = Math.floor(Math.abs(rel) / TAU); if (so !== L.sol) { L.sol = so; }
  }
  function clock() {
    var now = window.SHTIME ? SHTIME.now() : new Date();
    // 火星协调时 MTC(NASA GISS Mars24 算法,简化)
    var jd = now.getTime() / 864e5 + 2440587.5, jdtt = jd + 69.184 / 86400;
    var msd = (jdtt - 2405522.0028779) / 1.0274912517, mtc = ((msd % 1) + 1) % 1 * 24;
    var H = Math.floor(mtc), M = Math.floor((mtc - H) * 60), S = Math.floor(((mtc - H) * 60 - M) * 60);
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    var bj = window.SHTIME ? SHTIME.fmt(now).slice(11) : '';
    var html = '<div><small>北京时间</small><b>' + bj + '</b></div><div class="md-m"><small>火星协调时 MTC</small><b>' + pad(H) + ':' + pad(M) + ':' + pad(S) + '</b></div><div><small>火星日编号</small><b>第 ' + Math.floor(msd).toLocaleString('en-US') + ' 个</b></div>';
    if (html !== U._clk) { U._clk = html; U.clk.innerHTML = html; }
  }

  function stars() { var n = ST.stars.reduce(function (s, x) { return s + x; }, 0); U.st.textContent = '★ ' + n + ' / 9'; }
  function showQ() {
    stars(); L.hints = 0; U.hs.textContent = ''; U.ch.innerHTML = ''; U.hint.hidden = false;
    if (L.q >= QS.length) {
      U.q.innerHTML = '<b>三关完成!</b>你已经会算外星球的一天了。去太阳系里点开别的行星,看看它们的一天和一年。<br><a class="sh-bridge-a" href="../element-forge/mars/">✦ 星桥 → 元素工坊:火星为什么是红的?</a>'; U.hint.hidden = true;
      if (window.SHDOM) { var go = h('button', 'ml-c ml-c--go', '🪐 去行星世界'); go.type = 'button'; go.onclick = function () { close(); SHDOM.go(3); }; U.ch.appendChild(go); }
      return;
    }
    var Q = QS[L.q]; if (Q.onShow) Q.onShow(); U.q.innerHTML = '<small>第 ' + (L.q + 1) + ' / 3 关</small>' + Q.q;
    Q.ch.forEach(function (t, i) { var b = h('button', 'ml-c', t); b.type = 'button'; b.onclick = function () { answer(i === Q.ok, b); }; U.ch.appendChild(b); });
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
    c.style.width = r.width + 'px'; c.style.height = r.height + 'px';
  }
  var raf = 0, last = 0, fc = 0, RM = matchMedia('(prefers-reduced-motion: reduce)');
  function loop(t) {
    raf = requestAnimationFrame(loop); var dt = Math.min(0.1, (t - last) / 1000 || 0); last = t;
    if (++fc % 30 === 0) { var pr = U.cv3.parentNode.getBoundingClientRect(), dp = U.cv3._dpr || 1; if (Math.abs(pr.width * dp - U.cv3.width) > 2 || Math.abs(pr.height * dp - U.cv3.height) > 2) resize(); }
    if (L.play) step(dt * (RM.matches ? 0.5 : 1));
    draw(); if (fc % 10 === 0) clock();
  }
  function open() {
    if (!U.root) build();
    U.root.hidden = false; document.body.classList.add('ml-on');
    resize(); L.q = ST.stars.indexOf(0); if (L.q < 0) L.q = 3; setPlanet('mars'); showQ(); clock();
    cancelAnimationFrame(raf); last = performance.now(); raf = requestAnimationFrame(loop); P('open'); setTimeout(resize, 60);
  }
  function close() { if (!U.root) return; U.root.hidden = true; document.body.classList.remove('ml-on'); cancelAnimationFrame(raf); P('close'); }
  addEventListener('resize', function () { if (U.root && !U.root.hidden) resize(); });
  SH.marsdayLab = { open: open, close: close, _L: L };
})();
