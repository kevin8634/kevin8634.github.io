/* 天枢 Starhelm · 星域 III「行星世界」· 新任务 sh.jupiter「木星为什么没变成太阳?」(v1.0-M2b)
 * 左:一颗气体球,质量滑块 1–200 个木星质量(对数)。核心温度随质量升高(示意曲线,锚点:木星约 2 万 K;
 *     约 13 木星质量开始短暂燃烧氘 → 褐矮星;约 80 木星质量(0.08 太阳质量)核心约 300 万 K 以上,氢聚变点燃 → 红矮星)。
 *     有趣的事实:这一整段里球的大小几乎不变(约 1 个木星半径),变的是温度和亮度。
 * 右:读数(质量、相当于太阳的几分之几、核心温度、身份)+ 太阳系质量对比条。
 * 向导 3 关,最少 1 星。存储 gn:sh:jupiter(stars[3])。守星人:岁星。星桥 ID:sh.jupiter
 */
(function () {
  'use strict';
  var SH = window.SH = window.SH || {};
  var KEY = 'gn:sh:jupiter', TAU = Math.PI * 2;
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(ST)); } catch (e) { } }
  var ST = load(); ST.stars = ST.stars || [0, 0, 0];
  function h(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function P(n) { if (window.LE && LE.audio) LE.audio.play(n); }
  var L = { m: 1, q: 0, hints: 0, t: 0 };
  function kind(m) { return m >= 80 ? { zh: '红矮星(一颗真正的恒星)', c: '#ff7a4a' } : m >= 13 ? { zh: '褐矮星(「失败的恒星」)', c: '#c46a5a' } : { zh: '气态巨行星', c: '#e8c39a' }; }
  function coreK(m) {   // 示意:对数插值 1 MJ≈2 万 K · 13 MJ≈1 百万 K(氘燃烧)· 80 MJ≈3 百万 K(氢聚变)· 200 MJ≈6 百万 K
    var P = [[1, 2e4], [13, 1e6], [80, 3e6], [200, 6e6]], i = 0; while (i < 2 && m > P[i + 1][0]) i++;
    var f = (Math.log(m) - Math.log(P[i][0])) / (Math.log(P[i + 1][0]) - Math.log(P[i][0]));
    return Math.exp(Math.log(P[i][1]) + f * (Math.log(P[i + 1][1]) - Math.log(P[i][1])));
  }
  function fmtK(k) { return k >= 1e6 ? (k / 1e6).toFixed(1) + ' 百万 K' : Math.round(k / 1e4) + ' 万 K'; }
  function mOf(v) { return Math.pow(10, v * Math.log10(200)); }
  function vOf(m) { return Math.log10(m) / Math.log10(200); }

  var QS = [
    { kind: 'goal', q: '拖动下面的「质量」滑块,给木星不停加料,直到它的核心点燃氢聚变,变成一颗真正的恒星。',
      check: function () { return L.m >= 80; },
      hint: ['往右拖,看右边「核心温度」和「身份」怎么变。', '到 13 倍左右它会变成褐矮星,但还不够。', '大约要 80 个木星那么重,也就是太阳的 8%。'],
      good: '点燃了!大约 80 个木星质量(太阳的 8%)时,核心达到约 300 万度,氢开始聚变成氦,它就成了一颗红矮星。注意看:它的大小几乎没变,变的是温度和亮度。' },
    { kind: 'choice', q: '要是把太阳系所有行星、卫星、小行星全都捏成一团,大约有几个木星重?',
      ch: ['不到 1.5 个', '大约 80 个', '大约 1000 个'], ok: 0,
      hint: ['看右边的质量对比条:木星一个就占了所有行星总质量的大头。', '木星约是地球的 318 倍,所有行星加起来约 447 个地球。', '447 ÷ 318 ≈ 1.4。'],
      good: '对,还不到 1.5 个木星!离点燃需要的 80 个差了五六十倍。所以太阳系里没有材料再造一颗太阳,木星只是「最大的行星」,不是差一点的恒星。' },
    { kind: 'choice', q: '奇怪的是,木星向外放出的热量,比它从太阳那里收到的还多(大约 2 倍)。这些多出来的热量从哪里来?',
      ch: ['它还在非常缓慢地收缩,引力把物质往里压,压出了热', '它内部其实已经有少量核聚变', '它把以前晒到的阳光存起来了'], ok: 0,
      hint: ['刚才的第一关告诉你:木星核心离聚变需要的温度差得很远。', '想想给自行车打气时,打气筒为什么会发热?', '气体被压缩会变热。木星每年仍在缩小约 2 厘米。'],
      good: '没错!木星从诞生起就在慢慢收缩,引力能变成热,所以它比只靠阳光时更暖。这不是核聚变,只是一颗还在「冷却」的巨行星。' }
  ];

  var U = {};
  function build() {
    var r = U.root = h('section', 'ml ml--jp');
    r.innerHTML =
      '<header class="ml-hd"><div><small>星域 III · 岁星 · 行星世界</small><b>木星为什么没变成太阳?</b></div><span class="ml-st"></span><button class="ml-x" type="button" aria-label="关闭">✕</button></header>' +
      '<div class="ml-body"><div class="ml-pane ml-space"><div class="ml-cap">一颗不断加料的气体球</div><canvas class="ml-cv3"></canvas><div class="ml-note">示意:温度曲线为教学简化;门槛约 13 与约 80 个木星质量</div></div>' +
      '<div class="ml-pane ml-earth jp-r"><div class="ml-cap">读数</div><div class="jp-read"></div><div class="jp-bar"></div></div></div>' +
      '<div class="ml-ctl"><span class="tn-a">质量</span><input class="ml-rng" type="range" min="0" max="1" step="0.001" value="0"><span class="ml-day"></span></div>' +
      '<div class="ml-guide"><div class="ml-q"></div><div class="ml-ch"></div><div class="ml-gb"><button class="ml-hint" type="button">给我一点提示</button><span class="ml-hs"></span></div></div>';
    document.body.appendChild(r);
    ['st', 'x', 'cv3', 'rng', 'day', 'q', 'ch', 'hint', 'hs'].forEach(function (k) { U[k] = r.querySelector('.ml-' + k); });
    U.read = r.querySelector('.jp-read'); U.bar = r.querySelector('.jp-bar');
    U.x.onclick = close; U.hint.onclick = hint;
    U.rng.oninput = function () { var was = L.m >= 80; L.m = mOf(+U.rng.value); read(); if (!was && L.m >= 80) P('arrive'); var Q = QS[L.q]; if (Q && Q.kind === 'goal' && Q.check()) answer(true); };
    // 质量对比条(地球质量)
    var parts = [['木星', 317.8, '#e8c39a'], ['土星', 95.2, '#f3dc9a'], ['海王星', 17.1, '#7aa8ff'], ['天王星', 14.5, '#8fe0e8'], ['其余', 2.0, '#9fb3cc']], tot = 446.6;
    U.bar.innerHTML = '<small>太阳系所有行星的质量(合计约 447 个地球 ≈ 1.4 个木星)</small><div class="jp-stack">' +
      parts.map(function (p) { return '<i style="flex:' + p[1] + ';background:' + p[2] + '" title="' + p[0] + '"></i>'; }).join('') + '</div><div class="jp-leg">' +
      parts.map(function (p) { return '<span><i style="background:' + p[2] + '"></i>' + p[0] + ' ' + Math.round(p[1] / tot * 100) + '%</span>'; }).join('') + '</div>' +
      '<small>点燃一颗最小的恒星,需要约 80 个木星</small><div class="jp-need"><i style="width:' + (1.4 / 80 * 100) + '%"></i></div>';
  }
  function read() {
    var k = kind(L.m), sun = L.m / 1047.6;
    U.day.textContent = (L.m < 10 ? L.m.toFixed(1) : Math.round(L.m)) + ' 个木星';
    U.read.innerHTML = '<div><small>质量</small><b>' + (L.m < 10 ? L.m.toFixed(1) : Math.round(L.m)) + '<em> 个木星</em></b></div>' +
      '<div><small>相当于太阳的</small><b>' + (sun * 100).toFixed(sun < 0.01 ? 2 : 1) + '<em> %</em></b></div>' +
      '<div><small>核心温度(示意)</small><b>' + fmtK(coreK(L.m)) + '</b></div>' +
      '<div><small>身份</small><b style="color:' + k.c + ';font-size:16px">' + k.zh + '</b></div>';
  }
  function draw(dt) {
    var c = U.cv3, g = c.getContext('2d'), W = c.width, H = c.height, d = c._dpr || 1;
    L.t += dt; g.clearRect(0, 0, W, H);
    var cx = W / 2, cy = H / 2, R = Math.min(W, H) * 0.26, m = L.m, f = Math.min(1, Math.log10(m) / Math.log10(80));
    var star = m >= 80, bd = m >= 13 && !star;
    // 光晕
    if (f > 0.4) {
      var a = star ? 0.85 : (f - 0.4) * 0.6, gl = g.createRadialGradient(cx, cy, R * 0.8, cx, cy, R * (star ? 2.6 : 1.7));
      gl.addColorStop(0, star ? 'rgba(255,140,70,' + a + ')' : 'rgba(190,80,70,' + a + ')'); gl.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gl; g.beginPath(); g.arc(cx, cy, R * 2.6, 0, TAU); g.fill();
    }
    // 球体:木星条纹 → 暗红 → 亮橙
    g.save(); g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.clip();
    var base = star ? ['#ffd2a0', '#ff8a4a'] : bd ? ['#8a4a40', '#4a2028'] : ['#e8c39a', '#b0784a'];
    for (var i = 0; i < 12; i++) {
      var y = cy - R + i * R * 2 / 12, k = (i % 2 ? 0 : 1);
      g.fillStyle = base[k]; g.fillRect(cx - R, y, R * 2, R * 2 / 12 + 1);
    }
    if (!star && !bd) { g.fillStyle = 'rgba(190,90,60,.85)'; g.beginPath(); g.ellipse(cx + Math.cos(L.t * 0.4) * R * 0.4, cy + R * 0.35, R * 0.18, R * 0.09, 0, 0, TAU); g.fill(); }
    if (star) { for (var j = 0; j < 40; j++) { var aa = j * 2.4 + L.t * 0.3, rr = R * ((j * 0.37) % 1); g.fillStyle = 'rgba(255,240,200,.18)'; g.beginPath(); g.arc(cx + Math.cos(aa) * rr, cy + Math.sin(aa) * rr, R * 0.08, 0, TAU); g.fill(); } }
    var sh = g.createRadialGradient(cx - R * 0.35, cy - R * 0.35, R * 0.1, cx, cy, R * 1.05); sh.addColorStop(0, 'rgba(255,255,255,.12)'); sh.addColorStop(1, 'rgba(0,0,0,' + (star ? 0.05 : 0.55) + ')');
    g.fillStyle = sh; g.fillRect(cx - R, cy - R, R * 2, R * 2); g.restore();
    // 大小参照:木星原大小虚线圈
    g.strokeStyle = 'rgba(255,255,255,.35)'; g.setLineDash([4 * d, 5 * d]); g.lineWidth = d; g.beginPath(); g.arc(cx, cy, R * 1.0, 0, TAU); g.stroke(); g.setLineDash([]);
    g.fillStyle = 'rgba(200,215,235,.75)'; g.font = (12 * d) + 'px sans-serif'; g.textAlign = 'center';
    g.fillText('虚线 = 今天木星的大小:加料 80 倍,个头几乎不变', cx, cy + R * 1.0 + 26 * d);
  }
  function stars() { var n = ST.stars.reduce(function (s, x) { return s + x; }, 0); U.st.textContent = '★ ' + n + ' / 9'; }
  function showQ() {
    stars(); L.hints = 0; U.hs.textContent = ''; U.ch.innerHTML = ''; U.hint.hidden = false;
    if (L.q >= QS.length) { U.q.innerHTML = '<b>三关完成!</b>木星是太阳系里最大的行星,但离成为恒星还差得远。下一次在夜空里看到它,你就知道它为什么那么亮了。'; U.hint.hidden = true; return; }
    var Q = QS[L.q]; U.q.innerHTML = '<small>第 ' + (L.q + 1) + ' / 3 关</small>' + Q.q;
    if (Q.kind === 'choice') {
      var o = Q.ch.map(function (t, i) { return i; }).sort(function () { return Math.random() - 0.5; });
      o.forEach(function (i) { var b = h('button', 'ml-c', Q.ch[i]); b.type = 'button'; b.onclick = function () { answer(i === Q.ok, b); }; U.ch.appendChild(b); });
    }
  }
  function answer(ok, b) {
    var Q = QS[L.q];
    if (!ok) { if (b) b.classList.add('no'); P('blip'); U.hs.textContent = '再想想,也可以看一条提示。'; return; }
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
  var raf = 0, last = 0, fc = 0;
  function loop(t) {
    raf = requestAnimationFrame(loop); var dt = Math.min(0.1, (t - last) / 1000 || 0); last = t;
    if (++fc % 30 === 0) { var pr = U.cv3.parentNode.getBoundingClientRect(), dp = U.cv3._dpr || 1; if (Math.abs(pr.width * dp - U.cv3.width) > 2 || Math.abs(pr.height * dp - U.cv3.height) > 2) resize(); }
    draw(dt);
  }
  function open() {
    if (!U.root) build();
    U.root.hidden = false; document.body.classList.add('ml-on');
    L.m = 1; U.rng.value = 0; resize(); read(); L.q = ST.stars.indexOf(0); if (L.q < 0) L.q = 3; showQ();
    cancelAnimationFrame(raf); last = performance.now(); raf = requestAnimationFrame(loop); P('open'); setTimeout(resize, 60);
  }
  function close() { if (!U.root) return; U.root.hidden = true; document.body.classList.remove('ml-on'); cancelAnimationFrame(raf); P('close'); }
  addEventListener('resize', function () { if (U.root && !U.root.hidden) resize(); });
  SH.jupiterLab = { open: open, close: close, _L: L, _set: function (m) { U.rng.value = vOf(m); U.rng.oninput(); } };
})();
