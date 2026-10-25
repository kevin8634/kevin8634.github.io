/* 天枢 Starhelm · sh-d5-tasks.js · 星域 V「群星」四个任务(v1.0-M4)· 守星人 织女
 *  sh.starlight「你看到的星光有多老?」  停靠面板,3D 恒星场即画面(点星看此刻卡)
 *  sh.exoearth 「宇宙里还有别的地球吗?」 全屏实验室:凌星 + 光变曲线(可改行星大小、换恒星)
 *  sh.sundie   「太阳会死吗?」           全屏实验室:100 光年真实恒星赫罗图 + 太阳一生(年龄滑块)
 *  sh.constel  「星座为什么会变形?」     停靠面板,3D 恒星场即画面(飞离太阳 / 拨动 10 万年)
 * 每个任务 3 关,每关最少 1 星,提示三级(方向 / 线索 / 半步示范),存 gn:sh:<id> = {stars:[a,b,c]}。深链 ?task=<id>。
 * 数据:HYG 恒星库 v4.1(CC BY-SA 4.0)、NASA 系外行星档案(凌星深度、行星半径)、太阳演化轨迹为 1 倍太阳质量恒星模型的取整值(示意)。
 */
(function () {
  'use strict';
  var SH = window.SH = window.SH || {};
  function h(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function P(n, a) { if (window.LE && LE.audio) LE.audio.play(n, a); }
  function D5() { return window.SHD5; }
  function year() { return (window.SHTIME ? SHTIME.now() : new Date()).getFullYear(); }
  function reduced() { return window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches; }

  /* ---------- 通用:三关问答 ---------- */
  function Quiz(key, U, done) {
    var K = 'gn:sh:' + key, ST;
    try { ST = JSON.parse(localStorage.getItem(K)) || {}; } catch (e) { ST = {}; }
    ST.stars = ST.stars || [0, 0, 0];
    var Q = { L: { q: 0, hints: 0 }, QS: [], ST: ST };
    function save() { try { localStorage.setItem(K, JSON.stringify(ST)); } catch (e) { } }
    function stars() { U.st.textContent = '★ ' + ST.stars.reduce(function (s, x) { return s + x; }, 0) + ' / 9'; }
    Q.show = function () {
      var L = Q.L; stars(); L.hints = 0; U.hs.textContent = ''; U.ch.innerHTML = ''; U.hint.hidden = false;
      if (L.q >= Q.QS.length) { U.q.innerHTML = '<b>三关完成!</b>' + done; U.hint.hidden = true; return; }
      var q = Q.QS[L.q]; U.q.innerHTML = '<small>第 ' + (L.q + 1) + ' / 3 关</small>' + q.q;
      if (q.ch) q.ch.map(function (t, i) { return i; }).sort(function () { return Math.random() - 0.5; }).forEach(function (i) {
        var b = h('button', 'ml-c', q.ch[i]); b.type = 'button'; b.onclick = function () { Q.answer(i === q.ok, b); }; U.ch.appendChild(b);
      });
      if (q.enter) q.enter();
    };
    Q.answer = function (ok, b) {
      var L = Q.L, q = Q.QS[L.q]; if (!q) return;
      if (!ok) { if (b) b.classList.add('no'); P('blip'); U.hs.textContent = '再想想,也可以看一条提示。'; return; }
      var got = Math.max(1, 3 - L.hints); ST.stars[L.q] = Math.max(ST.stars[L.q] || 0, got); save(); P('arrive');
      U.ch.innerHTML = ''; U.hint.hidden = true;
      U.q.innerHTML = '<small>第 ' + (L.q + 1) + ' 关 · 获得 ' + '★'.repeat(got) + '</small>' + (typeof q.good === 'function' ? q.good() : q.good);
      var n = h('button', 'ml-c ml-c--go', L.q < 2 ? '下一关' : '完成'); n.type = 'button'; n.onclick = function () { L.q++; Q.show(); }; U.ch.appendChild(n); stars();
      if (window.SHHUD && SHHUD.refreshTasks) SHHUD.refreshTasks();
    };
    Q.check = function () { var q = Q.QS[Q.L.q]; if (q && q.goal && !q._ok && q.goal()) { q._ok = true; Q.answer(true); } };
    Q.hint = function () {
      var L = Q.L, q = Q.QS[L.q]; if (!q || L.hints >= 3) return; P('click');
      U.hs.textContent = ['方向', '线索', '半步示范'][L.hints] + ':' + q.hint[L.hints]; L.hints++; if (L.hints >= 3) U.hint.hidden = true;
    };
    Q.start = function (qs) { Q.QS = qs; Q.L.q = ST.stars.indexOf(0); if (Q.L.q < 0) Q.L.q = 3; Q.show(); };
    return Q;
  }
  function wire(r, U, names) { names.forEach(function (k) { U[k] = r.querySelector('.ml-' + k); }); }
  var GUIDE_HTML = '<div class="ml-guide"><div class="ml-q"></div><div class="ml-ch"></div><div class="ml-gb"><button class="ml-hint" type="button">给我一点提示</button><span class="ml-hs"></span></div></div>';
  function head(t) { return '<header class="ml-hd"><div><small>星域 V · 织女 · 群星</small><b>' + t + '</b></div><span class="ml-st"></span><button class="ml-x" type="button" aria-label="关闭">✕</button></header>'; }
  function enterD5(view) { if (window.SHDOM && SHDOM.go && !(D5() && D5().isOpen())) SHDOM.go(5); if (D5() && view) D5().go(view); }

  /* =============== sh.starlight 你看到的星光有多老? =============== */
  (function () {
    var U = {}, Q;
    function build() {
      var r = U.root = h('section', 'ml ml--dock ml--d5');
      r.innerHTML = head('你看到的星光有多老?') +
        '<div class="ml-ctl"><button class="ml-a1" type="button">◎ 比邻星</button><button class="ml-a2" type="button">◎ 织女星</button><button class="ml-a3" type="button">◎ 北极星</button><button class="ml-a4" type="button">⤢ 全景</button></div>' +
        GUIDE_HTML + '<div class="ml-note">距离来自 HYG 恒星库(依据依巴谷/盖亚卫星测量)。1 光年 ≈ 9.46 万亿 km。</div>';
      document.body.appendChild(r);
      wire(r, U, ['st', 'x', 'q', 'ch', 'hint', 'hs', 'a1', 'a2', 'a3', 'a4']);
      U.x.onclick = close; U.hint.onclick = function () { Q.hint(); };
      U.a1.onclick = function () { P('click'); D5().pick('proxima', true); };
      U.a2.onclick = function () { P('click'); D5().pick('vega', true); };
      U.a3.onclick = function () { P('click'); D5().pick('polaris', true); };
      U.a4.onclick = function () { P('click'); D5().overview(); };
      Q = Quiz('starlight', U, '夜空是一台时光机:你抬头看到的每颗星,都是它过去的样子——有的是几年前,有的是你出生以前,有的是几百年前。');
    }
    function qs() {
      var y = year(), vy = Math.round(y - 25.0), py = Math.round(y - 433);
      return [
        { q: '离太阳最近的恒星是比邻星。它的光要走多久才到地球?(点「◎ 比邻星」,看此刻卡)', ch: ['约 4.2 年', '约 8 分钟', '约 420 年'], ok: 0,
          hint: ['先点上面的「◎ 比邻星」按钮,镜头会推过去,此刻卡会打开。', '此刻卡上「光从这里到你」那一格就是答案。', '比邻星约 4.2 光年远,所以光要走约 4.2 年。'],
          good: '对!约 4.2 年。「光年」不是时间,是距离:光走一年的路,约 9.46 万亿 km。阳光到地球只要 8 分钟,离我们最近的另一颗恒星却要 4 年多。' },
        { q: '今晚你抬头看到织女星。这束光是哪一年从织女星出发的?', ch: ['约 ' + vy + ' 年', '今年', '约 ' + (y - 250) + ' 年'], ok: 0,
          hint: ['点「◎ 织女星」,看它离我们多少光年。', '织女星约 25 光年远:光走了 25 年。', y + ' − 25 = ' + vy + '。'],
          good: function () { return '对!约 ' + vy + ' 年出发。如果你今年 12 岁,这束光出发时你还没出生。'; } },
        { q: '北极星约 433 光年远。你今晚看到的北极星光出发时,中国处在哪个朝代?', ch: ['明朝', '唐朝', '清朝'], ok: 0,
          hint: ['点「◎ 北极星」,先确认它有多远。', '用今年减去 433。', y + ' − 433 ≈ ' + py + ' 年,那时是明朝万历年间。'],
          good: function () { return '对!约公元 ' + py + ' 年,明朝万历年间。那时的光今晚才落进你的眼睛;如果北极星此刻发生了什么,要到约 ' + (y + 433) + ' 年地球上才看得到。'; } }];
    }
    function open() { if (!U.root) build(); enterD5('keep'); if (window.SHHUD) SHHUD.hideNow(); U.root.hidden = false; Q.start(qs()); P('open');
      if (window.SHHUD) SHHUD.guide('zhinv', '光跑得再快,也要花时间。点一颗星,看看它的光在路上走了多少年。', []); }
    function close() { if (U.root) U.root.hidden = true; P('close'); }
    SH.starlightLab = { open: open, close: close, _Q: function () { return Q; } };
  })();

  /* =============== sh.constel 星座为什么会变形? =============== */
  (function () {
    var U = {}, Q;
    function build() {
      var r = U.root = h('section', 'ml ml--dock ml--d5');
      r.innerHTML = head('星座为什么会变形?') +
        '<div class="cs-ctl"><label><span>离开太阳</span><input class="ml-rng cs-ship" type="range" min="0" max="100" step="1" value="0"><b class="cs-sv">0 光年</b></label>' +
        '<label><span>时间</span><input class="ml-rng cs-ep" type="range" min="-100000" max="100000" step="1000" value="0"><b class="cs-ev">今天</b></label>' +
        '<div class="ml-ctl"><button class="ml-r0" type="button">↺ 回到地球视角</button><button class="ml-dub" type="button">★ 天枢</button><button class="ml-mer" type="button">◎ 天璇</button></div></div>' +
        GUIDE_HTML + '<div class="ml-note">画面:飞船从太阳出发侧着飞,一直朝北斗看;七星连线是真实三维位置。拨时间只移动北斗七星(HYG 空间速度)。</div>';
      document.body.appendChild(r);
      wire(r, U, ['st', 'x', 'q', 'ch', 'hint', 'hs', 'r0', 'dub', 'mer']);
      U.ship = r.querySelector('.cs-ship'); U.ep = r.querySelector('.cs-ep'); U.sv = r.querySelector('.cs-sv'); U.ev = r.querySelector('.cs-ev');
      U.x.onclick = close; U.hint.onclick = function () { Q.hint(); };
      U.ship.oninput = function () { D5().setShip(+U.ship.value); U.sv.textContent = U.ship.value + ' 光年'; Q.check(); };
      U.ep.oninput = function () { var v = +U.ep.value; D5().setEpoch(v); U.ev.textContent = v === 0 ? '今天' : (v > 0 ? v / 1e4 + ' 万年后' : (-v / 1e4) + ' 万年前'); Q.check(); };
      U.r0.onclick = function () { P('click'); U.ship.value = 0; U.ep.value = 0; U.ship.oninput(); U.ep.oninput(); };
      U.dub.onclick = function () { P('click'); D5().pick('dubhe', false); };
      U.mer.onclick = function () { P('click'); D5().pick('merak', false); };
      Q = Quiz('constel', U, '星座只是从地球这个角度看过去的「巧合图案」。换个位置、换个年代,夜空就会换一副模样。');
    }
    function qs() {
      return [
        { q: '从地球看,北斗七星像一把勺子。这七颗星离我们一样远吗?(点「★ 天枢」「◎ 天璇」看此刻卡)', ch: ['不一样:天枢约 123 光年,天璇约 80 光年', '一样远,都贴在同一个天球上', '都只有 1 光年左右'], ok: 0,
          hint: ['点「★ 天枢」,看它的距离;再点「◎ 天璇」。', '天枢是 123 光年,天璇是 80 光年。', '远近差了 40 多光年,只是方向碰巧挨在一起。'],
          good: '对!七颗星远近不同,最远的天枢约 123 光年,最近的天璇约 80 光年。它们只是从地球看过去方向相近。' },
        { q: '拖动「飞船离开太阳」,侧飞到 60 光年以外,一直盯着北斗。勺子会怎样?', goal: function () { return D5().ship >= 60; },
          enter: function () { }, hint: ['往右拖第一个滑块。', '看金色连线围成的形状,和刚出发时比一比。', '拖到 60 光年以上,勺柄和勺口都扭了。'],
          good: '你看到了:勺子被拉歪、扭曲了。因为七颗星远近不同,换个位置看,近的星「挪」得多,远的星「挪」得少——这叫视差。去别的恒星旁边,星座全都认不出来。' },
        { q: '先点「↺ 回到地球视角」。飞船不动,把时间拨到 10 万年后。北斗还像勺子吗?', ch: ['不太像了,因为恒星自己也在宇宙里移动', '一模一样,星星是固定在天上的', '七颗星全都熄灭了'], ok: 0,
          hint: ['先回到地球视角,再把「时间」滑块拖到最右边。', '比较天枢、摇光和中间五颗的移动方向。', '中间五颗结伴同行,天枢和摇光各走各的,勺子就变形了。'],
          good: '对!恒星都在银河系里运动。北斗中间五颗属于「大熊座移动星群」,一起向同一方向走;天枢和摇光走自己的路。10 万年后,勺子就变成了别的形状。' }];
    }
    function open() {
      if (!U.root) build(); enterD5('keep'); if (window.SHHUD) SHHUD.hideNow(); U.root.hidden = false;
      U.ship.value = 0; U.ep.value = 0; U.sv.textContent = '0 光年'; U.ev.textContent = '今天';
      setTimeout(function () { if (D5() && D5().isOpen() && !U.root.hidden) { D5().setEpoch(0); D5().constel(true); if (window.SHDOM) SHDOM.tick(true); } }, 300);
      Q.start(qs()); P('open');
      if (window.SHHUD) SHHUD.guide('zhinv', '北斗七星看起来在一个平面上,其实远近不同。开着飞船离开太阳,勺子会变成什么样?', []);
    }
    function close() { if (U.root && !U.root.hidden) { U.root.hidden = true; if (D5()) D5().constel(false); if (window.SHDOM) SHDOM.tick(true); P('close'); } }
    SH.constelLab = { open: open, close: close, _Q: function () { return Q; } };
    SH.d5Close = function () { [].forEach.call(document.querySelectorAll('.ml--d5'), function (e) { e.hidden = true; }); };   // 离开星域 V 时收起停靠面板
  })();

  /* =============== sh.exoearth 宇宙里还有别的地球吗?(凌星光变) =============== */
  (function () {
    var U = {}, Q, raf = 0, last = 0;
    var STARS = { sun: { zh: '太阳', rs: 1, c: '#ffe2a8', c2: '#ff9c3a', per: 365.25 }, t1: { zh: 'TRAPPIST-1', rs: 0.1192, c: '#ff8a5a', c2: '#a8321a', per: 6.1 } };
    var L = { star: 'sun', rp: 1, ph: 0, curve: [], moved: false };
    function depth() { var k = L.rp * 6371 / (STARS[L.star].rs * 696000); return k * k; }   // 遮挡比例
    function fmtPct(f) { return f >= 0.01 ? (f * 100).toFixed(2) + '%' : f >= 0.0001 ? (f * 100).toFixed(4) + '%' : (f * 1e6).toFixed(1) + ' ppm'; }
    function build() {
      var r = U.root = h('section', 'ml ml--ex');
      r.innerHTML = head('宇宙里还有别的地球吗?') +
        '<div class="ml-body"><div class="ml-pane ex-p"><div class="ml-cap">望远镜里:一颗恒星,一颗行星从它前面经过</div><canvas class="ex-cv1"></canvas><div class="ml-note">行星与恒星的大小比例为真实值(太小时至少画成一个点);变暗比例按真实半径计算</div></div>' +
        '<div class="ml-pane ex-p"><div class="ml-cap">光变曲线:星光亮度随时间</div><canvas class="ex-cv2"></canvas><div class="ex-read"></div></div></div>' +
        '<div class="ml-ctl ex-ctl"><span>行星大小</span><input class="ml-rng ex-rp" type="range" min="0" max="1" step="0.001" value="0.25"><b class="ex-rv">1 个地球</b>' +
        '<button type="button" class="ml-mode ex-s" data-s="sun">太阳</button><button type="button" class="ml-mode ex-s" data-s="t1">红矮星 TRAPPIST-1</button><button type="button" class="ex-go">在星图里找它 ›</button></div>' +
        GUIDE_HTML;
      document.body.appendChild(r);
      wire(r, U, ['st', 'x', 'q', 'ch', 'hint', 'hs']);
      U.c1 = r.querySelector('.ex-cv1'); U.c2 = r.querySelector('.ex-cv2'); U.read = r.querySelector('.ex-read'); U.rp = r.querySelector('.ex-rp'); U.rv = r.querySelector('.ex-rv');
      U.x.onclick = close; U.hint.onclick = function () { Q.hint(); };
      U.rp.oninput = function () { L.rp = Math.pow(10, -0.3 + (+U.rp.value) * 1.4); L.moved = true; read(); Q.check(); };
      [].forEach.call(r.querySelectorAll('.ex-s'), function (b) { b.onclick = function () { L.star = b.dataset.s; P('click'); read(); Q.check(); }; });
      r.querySelector('.ex-go').onclick = function () { close(); enterD5('keep'); setTimeout(function () { D5().pick('trappist1', true); }, 300); };
      Q = Quiz('exoearth', U, '天文学家正是用这种「看星光变暗」的办法,找到了几千颗系外行星。截至 2026-10-23,NASA 系外行星档案已确认 6451 颗;离我们 100 光年内就有 300 多个行星系统。下一颗「另一个地球」,也许就在其中。<br><a class="sh-bridge-a" href="../element-forge/spectra/">✦ 星桥 → 元素工坊:隔着几百光年,怎么知道一颗星球的空气?</a>');
    }
    function read() {
      U.rv.textContent = (L.rp < 2 ? L.rp.toFixed(1) : Math.round(L.rp)) + ' 个地球' + (L.rp > 9 ? '(木星级)' : '');
      [].forEach.call(U.root.querySelectorAll('.ex-s'), function (b) { b.classList.toggle('is-on', b.dataset.s === L.star); });
      var s = STARS[L.star];
      U.read.innerHTML = '<span>恒星<b>' + s.zh + '</b></span><span>最多变暗<b>' + fmtPct(depth()) + '</b></span><span>半径之比<b>1 : ' + Math.round(s.rs * 696000 / (L.rp * 6371)) + '</b></span>';
    }
    function fit(c) { var r = c.parentNode.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1); if (Math.abs(c.width - r.width * d) > 2 || Math.abs(c.height - r.height * d) > 2) { c.width = Math.max(10, r.width * d); c.height = Math.max(10, r.height * d); } c._d = d; }
    function draw(dt) {
      fit(U.c1); fit(U.c2);
      var s = STARS[L.star], spd = reduced() ? 0.03 : 0.12; L.ph = (L.ph + dt * spd) % 1;
      var g = U.c1.getContext('2d'), W = U.c1.width, H = U.c1.height, d = U.c1._d, cx = W / 2, cy = H / 2 + 8 * d, R = Math.min(W, H) * 0.3;
      g.clearRect(0, 0, W, H);
      var gl = g.createRadialGradient(cx, cy, R * 0.9, cx, cy, R * 1.8); gl.addColorStop(0, s.c2 + '66'); gl.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gl; g.fillRect(0, 0, W, H);
      var gr = g.createRadialGradient(cx, cy, 0, cx, cy, R); gr.addColorStop(0, '#fff8ea'); gr.addColorStop(0.55, s.c); gr.addColorStop(1, s.c2);   // 临边昏暗
      g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, R, 0, 6.2832); g.fill();
      // 行星:画面放大(最少 6 px)以便看见;横穿恒星
      var x = cx + (L.ph * 2 - 1) * R * 1.9, pr = Math.max(5 * d, R * Math.sqrt(depth())), y = cy + R * 0.12;
      g.fillStyle = '#05070d'; g.beginPath(); g.arc(x, y, Math.min(pr, R * 0.6), 0, 6.2832); g.fill();
      g.strokeStyle = 'rgba(127,214,255,.6)'; g.lineWidth = d; g.stroke();
      // 光变曲线:按相位解析计算(行星盘与临边昏暗恒星盘的重叠,近似),竖线 = 此刻
      var g2 = U.c2.getContext('2d'), W2 = U.c2.width, H2 = U.c2.height, d2 = U.c2._d, top = 48 * d2, bot = H2 - 70 * d2, dep = Math.max(depth() * 1.4, 2e-5), x0 = 10 * d2, x1 = W2 - 10 * d2;
      g2.clearRect(0, 0, W2, H2);
      g2.strokeStyle = 'rgba(140,180,230,.25)'; g2.lineWidth = d2; g2.beginPath(); g2.moveTo(x0, top); g2.lineTo(x1, top); g2.stroke();
      g2.fillStyle = 'rgba(200,215,235,.7)'; g2.font = (11 * d2) + 'px sans-serif'; g2.fillText('100%', x0 + 2 * d2, top - 6 * d2); g2.fillText('−' + fmtPct(dep), x0 + 2 * d2, bot + 14 * d2);
      g2.strokeStyle = '#7fd6ff'; g2.lineWidth = 2 * d2; g2.beginPath();
      for (var q = 0; q <= 200; q++) { var ph = q / 200, yy = top + (1 - flux(ph)) / dep * (bot - top), xx = x0 + ph * (x1 - x0); if (q) g2.lineTo(xx, yy); else g2.moveTo(xx, yy); } g2.stroke();
      var cxp = x0 + L.ph * (x1 - x0); g2.strokeStyle = 'rgba(240,201,122,.8)'; g2.lineWidth = d2; g2.beginPath(); g2.moveTo(cxp, top - 4 * d2); g2.lineTo(cxp, bot + 4 * d2); g2.stroke();
      g2.fillStyle = '#f0c97a'; g2.beginPath(); g2.arc(cxp, top + (1 - flux(L.ph)) / dep * (bot - top), 4 * d2, 0, 6.2832); g2.fill();
    }
    function flux(ph) {   // 相位 0..1:行星从左到右横穿(与左图同一路径)
      var k = Math.sqrt(depth()), xr = (ph * 2 - 1) * 1.9, dd = Math.hypot(xr, 0.12);
      if (dd >= 1 + k) return 1;
      var ov = dd <= 1 - k ? 1 : Math.max(0, (1 + k - dd) / (2 * k)), mu = Math.sqrt(Math.max(0, 1 - Math.min(1, dd) * Math.min(1, dd)));
      return 1 - depth() * ov * (0.4 + 0.6 * mu) / 0.8;
    }
    function loop(t) { raf = requestAnimationFrame(loop); var dt = Math.min(0.1, (t - last) / 1000 || 0); last = t; draw(dt); }
    function qs() {
      return [
        { q: '行星从恒星前面经过时(凌星),我们收到的星光会怎样?盯着右边的曲线看一圈。', ch: ['变暗一点点,过后又恢复', '变得更亮', '一点也不变'], ok: 0,
          hint: ['看左边的小黑点穿过恒星时,右边的曲线发生了什么。', '曲线往下凹了一个「坑」。', '行星挡住了一小部分星光,所以变暗。'],
          good: '对!行星挡住一小块星光,亮度就往下凹一个小坑;它绕回来一次,坑就出现一次。坑多久出现一次,就是这颗行星的「一年」有多长。' },
        { q: '改改规则:把「行星大小」拖到木星那么大(10 个地球以上),看看坑的深度。', goal: function () { return L.rp >= 10 && L.star === 'sun'; },
          hint: ['往右拖「行星大小」滑块,恒星选「太阳」。', '看右下角「最多变暗」的数字。', '地球只遮住约 0.008%,木星约 1%——大约深 120 倍。'],
          good: '看到了吧:行星越大,坑越深。遮住的比例 = (行星半径 ÷ 恒星半径)²。所以先被找到的,大多是又大又近的「热木星」;地球大小的坑浅得像一根头发丝。' },
        { q: '把行星调回 1 个地球,再把恒星换成红矮星 TRAPPIST-1(半径只有太阳的 12%)。坑会怎样?', ch: ['深得多,约 0.6%,是绕太阳时的约 70 倍', '一样深,行星没变', '更浅了'], ok: 0,
          hint: ['点「红矮星 TRAPPIST-1」,把行星拖到 1 个地球附近。', '恒星变小了,同一颗行星挡住的比例就大了。', '(1 ÷ 0.12)² ≈ 70 倍:约 0.008% → 约 0.6%。'],
          good: '对!恒星越小,同样大的行星挡得越多。这就是天文学家爱在红矮星旁边找「另一个地球」的原因。TRAPPIST-1 有 7 颗地球大小的行星,其中 3–4 颗在宜居带——点「在星图里找它」,它离我们约 40 光年。' }];
    }
    function open() { if (!U.root) build(); U.root.hidden = false; document.body.classList.add('ml-on'); L.star = 'sun'; U.rp.value = 0.25; U.rp.oninput(); L.moved = false;
      Q.start(qs()); cancelAnimationFrame(raf); last = performance.now(); raf = requestAnimationFrame(loop); P('open');
      if (window.SHHUD) SHHUD.guide('zhinv', '我们看不清别的恒星身边的小行星,但能看到它挡光时,星光暗了一点点。', []); }
    function close() { if (!U.root) return; U.root.hidden = true; document.body.classList.remove('ml-on'); cancelAnimationFrame(raf); P('close'); }
    SH.exoearthLab = { open: open, close: close, _L: L, _Q: function () { return Q; }, _set: function (rp, star) { if (star) L.star = star; U.rp.value = (Math.log10(rp) + 0.3) / 1.4; U.rp.oninput(); } };
  })();

  /* =============== sh.sundie 太阳会死吗?(赫罗图 + 太阳一生) =============== */
  (function () {
    var U = {}, Q, raf = 0, last = 0, L = { age: 4.6 };
    // 1 倍太阳质量恒星演化(取整示意):[年龄 十亿年, 温度 K, 光度 L☉, 半径 R☉, 阶段]
    var TR = [[0, 5600, 0.7, 0.89, 'ms'], [4.6, 5772, 1, 1, 'ms'], [8, 5800, 1.4, 1.17, 'ms'], [10, 5700, 1.9, 1.4, 'ms'], [11, 5000, 2.5, 2.1, 'sg'],
      [11.8, 4600, 6, 3.9, 'rg'], [12.1, 4000, 100, 21, 'rg'], [12.2, 3100, 2700, 180, 'tip'], [12.22, 4700, 45, 10, 'hb'], [12.3, 4500, 60, 13, 'hb'],
      [12.33, 3500, 1000, 86, 'agb'], [12.35, 3000, 4000, 230, 'agb'], [12.36, 30000, 3500, 0.2, 'pn'], [12.37, 100000, 300, 0.02, 'wd'], [12.6, 30000, 0.5, 0.013, 'wd'], [13.8, 8000, 0.003, 0.012, 'wd']];
    var STAGE = { ms: ['主序星', '核心把氢聚变成氦,稳定发光。现在的太阳就在这里。'], sg: ['亚巨星', '核心的氢用完了,外层开始膨胀。'], rg: ['红巨星', '体积胀大上百倍,表面变冷变红,却亮得多。'],
      tip: ['红巨星顶点', '半径约 180 个太阳,可能吞没水星、金星,甚至地球。'], hb: ['氦燃烧', '核心点燃氦,变成碳和氧,暂时缩小一些。'], agb: ['渐近巨星', '再次膨胀,把外层气体一阵阵吹向太空。'],
      pn: ['行星状星云', '吹出的外壳被炽热内核照亮,像一朵发光的花。'], wd: ['白矮星', '只剩地球大小的炽热内核,慢慢冷却,不再聚变。'] };
    function at(age) {
      var i = 0; while (i < TR.length - 2 && age > TR[i + 1][0]) i++;
      var a = TR[i], b = TR[i + 1], f = Math.max(0, Math.min(1, (age - a[0]) / (b[0] - a[0])));
      function lg(x, y) { return Math.exp(Math.log(x) + (Math.log(y) - Math.log(x)) * f); }
      return { T: lg(a[1], b[1]), L: lg(a[2], b[2]), R: lg(a[3], b[3]), st: f < 0.5 ? a[4] : b[4] };
    }
    function vOf(age) { return age <= 10 ? age / 10 * 0.5 : 0.5 + (age - 10) / 3.8 * 0.5; }   // 后段放大:主序 100 亿年占一半滑块
    function aOf(v) { return v <= 0.5 ? v * 2 * 10 : 10 + (v - 0.5) * 2 * 3.8; }
    var HR = null;
    function hrData() {
      if (HR || !D5()) return HR; var S = D5().data(); if (!S) return null; HR = [];
      for (var i = 0; i < S.n; i++) { if (S.ly[i] > 100.5) continue; var M = S.am[i], T = D5().teff(S.ci[i], M); if (isNaN(S.ci[i]) && i) continue; HR.push([T, D5().lum(M), S.col[i * 3], S.col[i * 3 + 1], S.col[i * 3 + 2]]); }
      return HR;
    }
    function build() {
      var r = U.root = h('section', 'ml ml--sd');
      r.innerHTML = head('太阳会死吗?') +
        '<div class="ml-body"><div class="ml-pane"><div class="ml-cap">赫罗图:100 光年内 4 000 多颗真实恒星(右 = 冷,上 = 亮)</div><canvas class="sd-cv1"></canvas><div class="ml-note">恒星点:HYG 恒星库;太阳轨迹为恒星模型取整值(示意)</div></div>' +
        '<div class="ml-pane"><div class="ml-cap">此时的太阳(与地球轨道比大小)</div><canvas class="sd-cv2"></canvas><div class="sd-read"></div></div></div>' +
        '<div class="ml-ctl"><span>太阳年龄</span><input class="ml-rng sd-age" type="range" min="0" max="1" step="0.0005" value="0.23"><b class="sd-av"></b><button type="button" class="sd-now">回到今天</button></div>' + GUIDE_HTML;
      document.body.appendChild(r);
      wire(r, U, ['st', 'x', 'q', 'ch', 'hint', 'hs']);
      U.c1 = r.querySelector('.sd-cv1'); U.c2 = r.querySelector('.sd-cv2'); U.read = r.querySelector('.sd-read'); U.age = r.querySelector('.sd-age'); U.av = r.querySelector('.sd-av');
      U.x.onclick = close; U.hint.onclick = function () { Q.hint(); };
      U.age.oninput = function () { L.age = aOf(+U.age.value); read(); Q.check(); };
      r.querySelector('.sd-now').onclick = function () { P('click'); U.age.value = vOf(4.6); U.age.oninput(); };
      Q = Quiz('sundie', U, '太阳会「死」,但很温和:不会爆炸,也不会变成黑洞,而是在约 50 亿年后膨胀成红巨星,最后留下一颗白矮星和一朵行星状星云。那是非常非常遥远的事——比地球上有恐龙到今天还要长 70 多倍。');
    }
    function read() {
      var s = at(L.age), sg = STAGE[s.st];
      U.av.textContent = L.age.toFixed(L.age > 12 ? 2 : 1) + ' 十亿岁' + (Math.abs(L.age - 4.6) < 0.05 ? '(今天)' : '');
      U.read.innerHTML = '<span>阶段<b>' + sg[0] + '</b></span><span>表面温度<b>' + Math.round(s.T / 100) * 100 + ' K</b></span><span>亮度<b>' + (s.L < 0.1 ? s.L.toFixed(3) : s.L < 10 ? s.L.toFixed(1) : Math.round(s.L)) + ' 个今天的太阳</b></span><span>半径<b>' + (s.R < 0.1 ? '约地球大小' : (s.R < 10 ? s.R.toFixed(1) : Math.round(s.R)) + ' 倍') + '</b></span><p>' + sg[1] + '</p>';
    }
    function fit(c) { var r = c.parentNode.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1); if (Math.abs(c.width - r.width * d) > 2 || Math.abs(c.height - r.height * d) > 2) { c.width = Math.max(10, r.width * d); c.height = Math.max(10, r.height * d); } c._d = d; }
    function draw(dt) {
      fit(U.c1); fit(U.c2); L.t = (L.t || 0) + dt;
      var g = U.c1.getContext('2d'), W = U.c1.width, H = U.c1.height, d = U.c1._d, x0 = 44 * d, x1 = W - 14 * d, y0 = 30 * d, y1 = H - 66 * d;
      function X(T) { return x0 + (Math.log10(40000) - Math.log10(Math.max(2200, Math.min(40000, T)))) / (Math.log10(40000) - Math.log10(2200)) * (x1 - x0); }
      function Y(Lm) { return y1 - (Math.log10(Math.max(1e-5, Math.min(1e5, Lm))) + 5) / 10 * (y1 - y0); }
      g.clearRect(0, 0, W, H);
      g.strokeStyle = 'rgba(140,180,230,.18)'; g.lineWidth = d; g.fillStyle = 'rgba(200,215,235,.6)'; g.font = (10 * d) + 'px sans-serif';
      [-4, -2, 0, 2, 4].forEach(function (e) { var y = Y(Math.pow(10, e)); g.beginPath(); g.moveTo(x0, y); g.lineTo(x1, y); g.stroke(); g.fillText(e === 0 ? '1 太阳' : '10^' + e, 4 * d, y + 3 * d); });
      [30000, 10000, 6000, 4000, 3000].forEach(function (T) { var x = X(T); g.fillText(T + 'K', x - 14 * d, H - 50 * d); });
      g.fillText('← 更热              更冷 →', x0 + (x1 - x0) / 2 - 60 * d, H - 34 * d);
      var D = hrData();
      if (D) D.forEach(function (p) { g.fillStyle = 'rgba(' + (p[2] * 255 | 0) + ',' + (p[3] * 255 | 0) + ',' + (p[4] * 255 | 0) + ',.55)'; g.fillRect(X(p[0]) - d, Y(p[1]) - d, 2 * d, 2 * d); });
      g.fillStyle = 'rgba(127,214,255,.75)'; g.fillText('主序带', X(9000), Y(30) - 10 * d); g.fillText('巨星', X(4300), Y(300)); g.fillText('白矮星', X(14000), Y(0.0004) + 14 * d);
      // 太阳轨迹(已走过的部分)
      g.strokeStyle = 'rgba(240,201,122,.85)'; g.lineWidth = 1.6 * d; g.beginPath();
      for (var a = 0, f = true; a <= L.age; a += 0.004) { var s = at(a); if (f) { g.moveTo(X(s.T), Y(s.L)); f = false; } else g.lineTo(X(s.T), Y(s.L)); } g.stroke();
      var c = at(L.age), pulse = 1 + 0.25 * Math.sin(L.t * 3);
      g.fillStyle = '#f0c97a'; g.beginPath(); g.arc(X(c.T), Y(c.L), 5 * d * pulse, 0, 6.2832); g.fill(); g.fillStyle = '#fff'; g.fillText('太阳', X(c.T) + 8 * d, Y(c.L) - 6 * d);
      // 右:太阳大小 vs 地球轨道(对数缩放示意)
      var g2 = U.c2.getContext('2d'), W2 = U.c2.width, H2 = U.c2.height, d2 = U.c2._d, cx = W2 / 2, cy = H2 * 0.42, Rm = Math.min(W2, H2) * 0.36;
      g2.clearRect(0, 0, W2, H2);
      var Rorb = Rm * 0.8, Rs = Math.min(Rm * 1.2, Rorb * c.R / 215);   // 地球轨道 = 215 个太阳半径
      var big = Rs < 3 * d2; var rs = Math.max(2.5 * d2, Rs);
      if (c.st === 'pn') { var ng = g2.createRadialGradient(cx, cy, Rorb * 0.3, cx, cy, Rorb * 1.1); ng.addColorStop(0, 'rgba(127,214,255,.0)'); ng.addColorStop(0.6, 'rgba(127,214,255,.35)'); ng.addColorStop(1, 'rgba(255,120,160,0)'); g2.fillStyle = ng; g2.fillRect(0, 0, W2, H2); }
      var rgb = D5() ? D5().tRGB(c.T) : [1, 0.9, 0.7], col = 'rgb(' + (rgb[0] * 255 | 0) + ',' + (rgb[1] * 255 | 0) + ',' + (rgb[2] * 255 | 0) + ')';
      var gg = g2.createRadialGradient(cx, cy, 0, cx, cy, rs * 1.8); gg.addColorStop(0, '#fff'); gg.addColorStop(0.4, col); gg.addColorStop(1, 'rgba(0,0,0,0)');
      g2.fillStyle = gg; g2.beginPath(); g2.arc(cx, cy, rs * 1.8, 0, 6.2832); g2.fill();
      g2.strokeStyle = 'rgba(127,214,255,.55)'; g2.setLineDash([4 * d2, 4 * d2]); g2.lineWidth = d2; g2.beginPath(); g2.arc(cx, cy, Rorb, 0, 6.2832); g2.stroke(); g2.setLineDash([]);
      g2.fillStyle = '#7fd6ff'; g2.beginPath(); g2.arc(cx + Rorb, cy, 3 * d2, 0, 6.2832); g2.fill();
      g2.font = (11 * d2) + 'px sans-serif'; g2.fillStyle = 'rgba(200,215,235,.8)'; g2.fillText('地球轨道', cx + Rorb - 24 * d2, cy - 8 * d2);
      if (big) { g2.textAlign = 'center'; g2.fillText('太阳(已放大画出,按比例只有一个点)', cx, cy + Rorb + 16 * d2); g2.textAlign = 'left'; }
    }
    function loop(t) { raf = requestAnimationFrame(loop); var dt = Math.min(0.1, (t - last) / 1000 || 0); last = t; draw(dt); }
    function qs() {
      return [
        { q: '左边的赫罗图里,大多数恒星排成一条从左上到右下的斜带(主序带)。今天 46 亿岁的太阳在哪?', ch: ['在主序带中间', '在右上角的巨星区', '在左下角的白矮星区'], ok: 0,
          hint: ['找图里那个金色的、写着「太阳」的点。', '右上 = 又冷又亮的巨星;左下 = 又热又暗的白矮星。', '太阳正处在主序带中段,正值「中年」。'],
          good: '对!太阳在主序带中间,和身边大多数恒星一样,正安稳地把氢聚变成氦。它已经这样过了 46 亿年,还能再这样过约 50 亿年。' },
        { q: '改改时间:把「太阳年龄」拖到约 122 亿岁,看看太阳变成了什么。', goal: function () { return L.age >= 12.1 && L.age <= 12.21; },
          hint: ['往右拖年龄滑块,注意右边太阳的大小。', '过了 110 亿岁,太阳会离开主序带,往右上方走。', '拖到 121–122 亿岁之间,它最大最亮。'],
          good: '看到了:太阳胀成了红巨星,半径约 180 倍,快碰到地球轨道,亮度是今天的几千倍。不过那是 70 多亿年以后的事。' },
        { q: '把年龄拖到最右边。太阳的「最后」是什么样子?', ch: ['一颗地球大小、慢慢冷却的白矮星,周围一圈行星状星云', '爆炸成超新星,留下中子星', '变成一个黑洞'], ok: 0,
          hint: ['拖到最右,看右边「阶段」那一格。', '超新星和黑洞需要至少 8 倍太阳质量的恒星。', '太阳质量不够大,结局是白矮星。'],
          good: '对!太阳太「轻」,不会爆炸,也不会变成黑洞。它会吹散外层、留下白矮星。100 光年内就有这样的「前辈」:天狼星的伴星天狼星 B 就是一颗白矮星。' }];
    }
    function open() { if (!U.root) build(); U.root.hidden = false; document.body.classList.add('ml-on'); U.age.value = vOf(4.6); U.age.oninput();
      Q.start(qs()); cancelAnimationFrame(raf); last = performance.now(); raf = requestAnimationFrame(loop); P('open');
      if (window.SHHUD) SHHUD.guide('zhinv', '每颗星都有一生。把太阳的年龄往后拨,看看它会走到哪里。', []); }
    function close() { if (!U.root) return; U.root.hidden = true; document.body.classList.remove('ml-on'); cancelAnimationFrame(raf); P('close'); }
    SH.sundieLab = { open: open, close: close, _L: L, _Q: function () { return Q; }, _set: function (a) { U.age.value = vOf(a); U.age.oninput(); } };
  })();

  /* ---------- 样式 ---------- */
  var css = '.ml--d5 .ml-note{position:static;display:block;margin-top:2px;pointer-events:none}body:has(.ml--d5:not([hidden])) .sh5-info{display:none}' +
    '@media (min-width:1181px){body:has(.shh-now:not([hidden])) .ml--d5{right:calc(var(--shh-pad,16px) + 396px)}}@media (max-width:760px){body:has(.ml--d5:not([hidden])) .shh-now,body:has(.ml--d5:not([hidden])) .sh5-bar{display:none!important}}' +
    '.ml--d5 .ml-hd b{font-size:17px}.ml--d5 .ml-ctl button{font-size:12.5px;white-space:nowrap}' +
    '.cs-ctl{display:flex;flex-direction:column;gap:6px}.cs-ctl label{display:grid;grid-template-columns:5em 1fr 5.5em;align-items:center;gap:8px;font-size:12.5px;color:#c9d6e8}.cs-ctl b{color:#f0c97a;font-weight:500;text-align:right}' +
    '.ml--ex .ml-body,.ml--sd .ml-body{grid-template-columns:1fr 1fr}.ml--ex canvas,.ml--sd canvas{position:absolute;inset:0;width:100%;height:100%;display:block}' +
    '.ex-read,.sd-read{position:absolute;left:10px;right:10px;bottom:8px;display:flex;flex-wrap:wrap;gap:4px 14px;font-size:12px;color:#9fb3cc;pointer-events:none}.ex-read b,.sd-read b{display:block;color:#fff;font-size:15px;font-weight:600}' +
    '.sd-read p{flex-basis:100%;margin:2px 0 0;color:#cfe0f2;font-size:12.5px}.ml--sd .sd-read{top:auto}' +
    '.ex-ctl,.ml--sd .ml-ctl{flex-wrap:wrap}.ex-ctl .ml-mode.is-on{background:rgba(127,227,196,.2);border-color:#7fe3c4;color:#cff8ea}.ex-rv,.sd-av{min-width:7em;color:#f0c97a;font-weight:500}' +
    '@media (max-width:760px),(orientation:portrait){.ml--ex .ml-body,.ml--sd .ml-body{grid-template-columns:1fr;grid-template-rows:1fr 1fr}.ex-read b,.sd-read b{font-size:13px}.sd-read p{display:none}.ml--ex .ml-note,.ml--sd .ml-note{display:none}.ex-ctl,.ml--sd .ml-ctl{gap:6px;font-size:12px}.ex-ctl .ml-rng,.ml--sd .ml-rng{flex-basis:100%;order:3}}' +
    '@media (max-width:760px){.ml--d5 .ml-note{display:none}.cs-ctl label{grid-template-columns:5em 1fr 4.6em;font-size:12px}}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  /* ---------- 深链 ?task=starlight|exoearth|sundie|constel(sh-link.js 不认识这些 id,会忽略) ---------- */
  var m = /[?&]task=([a-z]+)/.exec(location.search), LAB = { starlight: 'starlightLab', exoearth: 'exoearthLab', sundie: 'sundieLab', constel: 'constelLab' };
  if (m && LAB[m[1]]) (function w(n) {
    if (window.SH_READY && window.SHD5 && SHD5.ready) return setTimeout(function () { try { SH[LAB[m[1]]].open(); } catch (e) { console.warn('[SHD5] 深链打开失败', e); } }, 600);
    if (n > 400) return; setTimeout(function () { w(n + 1); }, 150);
  })(0);
})();
