/* 天枢 Starhelm · 星域 II「日与月」· M2d 太阳活动观测台(任务 sh.sun)
 * 左:NASA SDO 太阳动力学天文台最新实拍(可见光黑子 HMI / 日冕 AIA 171 / 色球 AIA 304),图片直接显示,不经画布读取。
 * 右:NOAA SWPC 实时数据 —— GOES X 射线 24 小时曲线(耀斑等级 A/B/C/M/X)、近 30 年月均太阳黑子数(太阳活动周期)、太阳风速度。
 * 数据失败时显示「暂不可用」,向导照常可做。向导 3 关,三级提示,最少 1 星。存储 gn:sh:sun */
(function () {
  'use strict';
  var SH = window.SH = window.SH || {};
  var KEY = 'gn:sh:sun';
  var URL_XR = 'https://services.swpc.noaa.gov/json/goes/primary/xrays-1-day.json';
  var URL_SSN = 'https://services.swpc.noaa.gov/json/solar-cycle/observed-solar-cycle-indices.json';
  var URL_SW = 'https://services.swpc.noaa.gov/products/summary/solar-wind-speed.json';
  var SDO = 'https://sdo.gsfc.nasa.gov/assets/img/latest/latest_';
  var BANDS = [
    { id: 'HMIIC', zh: '可见光 · 黑子', t: '人眼看到的太阳表面(光球,约 5500°C)。暗斑就是太阳黑子。' },
    { id: '0171', zh: '日冕 · 171Å', t: '极紫外光下的日冕,约 100 万°C。亮环是被磁场约束的高温等离子体。' },
    { id: '0304', zh: '色球 · 304Å', t: '色球层和日珥,约 5 万°C。边缘飘起的「火舌」就是日珥。' }];
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(ST)); } catch (e) { } }
  var ST = load(); ST.stars = ST.stars || [0, 0, 0];
  function h(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function P(n) { if (window.LE && LE.audio) LE.audio.play(n); }
  function cls(f) {   // X 射线通量(W/m²,0.1–0.8 nm)→ 耀斑等级
    if (!(f > 0)) return '—';
    var L = ['A', 'B', 'C', 'M', 'X'], e = Math.floor(Math.log10(f)) + 8; e = Math.max(0, Math.min(4, e));
    return L[e] + (f / Math.pow(10, e - 8)).toFixed(1);
  }
  function hm(d) { return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }

  var D = { xr: null, ssn: null, sw: null, err: {} }, L = { band: 0, q: 0, hints: 0, loaded: false };

  var QS = [
    { kind: 'choice', q: '左边切到「可见光 · 黑子」。太阳黑子为什么看起来是黑的?',
      ch: ['它比周围冷,约 3500–4500°C,相比之下显得暗', '那里是太阳上的洞', '是行星挡在太阳前面的影子'], ok: 0,
      hint: ['黑子其实也在发光,而且很亮。它「黑」是跟谁比出来的?', '太阳表面约 5500°C。黑子是温度更高还是更低的地方?', '黑子处磁场很强,挡住了下面热量往上冒,温度低了一两千度,在更亮的背景衬托下就显得黑。'],
      good: '对!黑子约 3500–4500°C,比周围低 1000–2000°C。单独拿出来它仍然比电焊弧光还亮,只是被更亮的背景衬得发黑。' },
    { kind: 'choice', q: '看右边「太阳黑子数」那张图:黑子多的高峰,大约每隔多少年出现一次?',
      ch: ['约 11 年', '约 1 年', '约 50 年'], ok: 0,
      hint: ['找到图上两个相邻的高峰,看看它们下面的年份。', '图上能看到几座「山峰」:2001 年前后、2014 年前后,还有最近一座。', '1989、2001、2014 年前后各有一个高峰,相隔 12 年左右;几百年的记录平均下来约 11 年,这叫太阳活动周期。'],
      good: '没错!太阳活动大约 11 年一个周期,黑子、耀斑和极光都随它起伏。第 25 个周期的高峰在 2024–2025 年前后,现在正慢慢回落。' },
    { kind: 'choice', q: '耀斑按 X 射线强度分 A、B、C、M、X 五级(看曲线右边的刻度)。M 级耀斑比 C 级强多少?',
      ch: ['10 倍', '2 倍', '100 倍'], ok: 0,
      hint: ['看右边刻度:相邻两级之间的线,数值差多少?', '这张图的纵轴是「对数」刻度:每往上一格,数值乘以 10。', 'C 级 = 10⁻⁶ W/m²,M 级 = 10⁻⁵ W/m²,相差 10 倍;X 级又是 M 级的 10 倍。'],
      good: '对!每升一级强 10 倍,所以 X 级是 C 级的 100 倍。强耀斑和日冕物质抛射会引发地磁暴,让极光一直扩展到中纬度。' }
  ];

  var U = {};
  function build() {
    var r = U.root = h('section', 'ml ml--sun');
    r.innerHTML =
      '<header class="ml-hd"><div><small>星域 II · 天璇 · 日与月</small><b>太阳活动观测台</b></div><span class="ml-st"></span><button class="ml-x" type="button" aria-label="关闭">✕</button></header>' +
      '<div class="ml-body"><div class="ml-pane sn-img"><div class="ml-cap">NASA SDO 最新实拍 <span class="sn-bands"></span></div>' +
      '<div class="sn-wrap"><img class="sn-sun" alt="太阳最新实拍" referrerpolicy="no-referrer"><div class="sn-fail" hidden>实拍图暂时取不到</div></div>' +
      '<div class="ml-note sn-note"></div></div>' +
      '<div class="ml-pane ml-earth sn-data"><div class="ml-cap">NOAA SWPC 实时数据</div>' +
      '<canvas class="sn-xr" width="420" height="190"></canvas><canvas class="sn-ssn" width="420" height="150"></canvas>' +
      '<div class="ml-info"><b class="ml-nm"></b><span class="ml-k"></span><span class="ml-t"></span></div></div></div>' +
      '<div class="ml-guide"><div class="ml-q"></div><div class="ml-ch"></div><div class="ml-gb"><button class="ml-hint" type="button">给我一点提示</button><span class="ml-hs"></span></div></div>';
    document.body.appendChild(r);
    ['st', 'x', 'nm', 'k', 't', 'q', 'ch', 'hint', 'hs'].forEach(function (k) { U[k] = r.querySelector('.ml-' + k); });
    U.img = r.querySelector('.sn-sun'); U.fail = r.querySelector('.sn-fail'); U.note = r.querySelector('.sn-note'); U.bands = r.querySelector('.sn-bands');
    U.xr = r.querySelector('.sn-xr'); U.ssn = r.querySelector('.sn-ssn');
    BANDS.forEach(function (b, i) { var e = h('button', 'ml-hemi', b.zh); e.type = 'button'; e.onclick = function () { setBand(i); P('click'); }; U.bands.appendChild(e); });
    U.img.onerror = function () { U.img.hidden = true; U.fail.hidden = false; };
    U.img.onload = function () { U.img.hidden = false; U.fail.hidden = true; };
    U.x.onclick = close; U.hint.onclick = hint;
    if (!document.getElementById('sn-css')) {
      var s = document.createElement('style'); s.id = 'sn-css';
      s.textContent = '.sn-wrap{flex:1;display:flex;align-items:center;justify-content:center;padding:34px 10px 26px;min-height:0}.sn-sun{max-width:100%;max-height:100%;aspect-ratio:1;mix-blend-mode:screen}.sn-fail{color:#9fb3cc;font-size:13px}' +
        '.sn-bands{display:inline-flex;gap:6px;flex-wrap:wrap}.sn-bands .on{background:rgba(214,178,94,.3);border-color:#d6b25e;color:#fff}.sn-data{justify-content:flex-start;padding-top:30px;gap:4px}.sn-data canvas{width:min(100%,400px);height:auto}' +
        '@media (max-width:760px),(orientation:portrait){.sn-data{flex-direction:column}.sn-data canvas{width:auto;max-width:100%;max-height:110px}}';
      document.head.appendChild(s);
    }
  }
  function setBand(i) {
    L.band = i; var b = BANDS[i];
    [].forEach.call(U.bands.children, function (e, k) { e.classList.toggle('on', k === i); });
    U.img.src = SDO + (innerWidth < 900 ? '512_' : '1024_') + b.id + '.jpg?t=' + Math.floor(Date.now() / 9e5);   // 15 分钟换一次缓存键
    U.note.textContent = b.t + ' 图像:NASA/SDO 及 AIA、HMI 科学团队';
  }

  /* ---------- 数据 ---------- */
  function fetchAll() {
    if (L.loaded) return; L.loaded = true;
    fetch(URL_XR).then(function (r) { return r.json(); }).then(function (j) {
      D.xr = (Array.isArray(j) ? j : []).filter(function (x) { return x && x.energy === '0.1-0.8nm' && x.flux > 0; }).map(function (x) { return { t: new Date(x.time_tag), f: +x.flux }; });
      drawXr(); info();
    }).catch(function (e) { D.err.xr = 1; drawXr(); info(); console.warn('[sun] xrays', e); });
    fetch(URL_SSN).then(function (r) { return r.json(); }).then(function (j) {
      D.ssn = (Array.isArray(j) ? j : []).map(function (x) { var p = String(x['time-tag'] || '').split('-'); return { y: +p[0] + (+p[1] - 0.5) / 12, v: +x.ssn }; }).filter(function (x) { return x.y >= 1986 && x.v >= 0; });
      drawSsn(); info();
    }).catch(function (e) { D.err.ssn = 1; drawSsn(); console.warn('[sun] ssn', e); });
    fetch(URL_SW).then(function (r) { return r.json(); }).then(function (j) {
      var x = Array.isArray(j) ? j[j.length - 1] : j; D.sw = x && +(x.proton_speed || x.WindSpeed) || null; info();
    }).catch(function () { D.err.sw = 1; info(); });
  }
  function drawXr() {
    var c = U.xr, g = c.getContext('2d'), W = c.width, H = c.height, x0 = 36, y0 = 18, w = W - x0 - 22, hh = H - y0 - 22;
    g.clearRect(0, 0, W, H); g.font = '11px sans-serif';
    g.fillStyle = '#9fd9c6'; g.fillText('X 射线 · 近 24 小时(GOES)', x0, 12);
    function Y(f) { return y0 + (-4 - Math.log10(f)) / 5 * hh; }   // 10⁻⁹ … 10⁻⁴ W/m²
    var LV = [['A', 1e-8], ['B', 1e-7], ['C', 1e-6], ['M', 1e-5], ['X', 1e-4]], col = { A: '#5a7', B: '#7bc', C: '#fd5', M: '#f93', X: '#f46' };
    LV.forEach(function (l) { var y = Y(l[1]); g.strokeStyle = 'rgba(255,255,255,.1)'; g.beginPath(); g.moveTo(x0, y); g.lineTo(x0 + w, y); g.stroke(); g.fillStyle = col[l[0]]; g.fillText(l[0], x0 + w + 6, y + 12 > H ? y : y + 12); g.fillStyle = 'rgba(160,180,210,.55)'; g.fillText('1e' + Math.log10(l[1]), 2, y + 4); });
    if (!D.xr || !D.xr.length) { g.fillStyle = '#9fb3cc'; g.fillText(D.err.xr ? '暂不可用' : '加载中…', x0 + w / 2 - 20, y0 + hh / 2); return; }
    var t1 = D.xr[D.xr.length - 1].t.getTime(), t0 = t1 - 864e5;
    g.strokeStyle = '#ffb347'; g.lineWidth = 1.5; g.beginPath();
    D.xr.forEach(function (p, i) { var x = x0 + (p.t - t0) / 864e5 * w, y = Math.max(y0, Math.min(y0 + hh, Y(p.f))); if (i) g.lineTo(x, y); else g.moveTo(x, y); }); g.stroke(); g.lineWidth = 1;
    g.fillStyle = 'rgba(160,180,210,.6)'; [0, 6, 12, 18, 24].forEach(function (k) { var d = new Date(t0 + k * 36e5); g.fillText(hm(d), x0 + k / 24 * w - 14, H - 6); });
  }
  function drawSsn() {
    var c = U.ssn, g = c.getContext('2d'), W = c.width, H = c.height, x0 = 36, y0 = 18, w = W - x0 - 22, hh = H - y0 - 22;
    g.clearRect(0, 0, W, H); g.font = '11px sans-serif'; g.fillStyle = '#9fd9c6'; g.fillText('太阳黑子数 · 月均(1986 年至今)', x0, 12);
    if (!D.ssn || !D.ssn.length) { g.fillStyle = '#9fb3cc'; g.fillText(D.err.ssn ? '暂不可用' : '加载中…', x0 + w / 2 - 20, y0 + hh / 2); return; }
    var ya = 1986, yb = D.ssn[D.ssn.length - 1].y, vm = 300;
    function X(y) { return x0 + (y - ya) / (yb - ya) * w; } function Y(v) { return y0 + (1 - Math.min(v, vm) / vm) * hh; }
    g.fillStyle = 'rgba(160,180,210,.6)'; for (var y = 1990; y <= yb; y += 5) { g.strokeStyle = 'rgba(255,255,255,.08)'; g.beginPath(); g.moveTo(X(y), y0); g.lineTo(X(y), y0 + hh); g.stroke(); g.fillText(y, X(y) - 12, H - 6); }
    [0, 100, 200, 300].forEach(function (v) { g.fillText(v, 8, Y(v) + 4); });
    g.beginPath(); g.moveTo(X(ya), Y(0)); D.ssn.forEach(function (p) { g.lineTo(X(p.y), Y(p.v)); }); g.lineTo(X(yb), Y(0)); g.closePath();
    var gr = g.createLinearGradient(0, y0, 0, y0 + hh); gr.addColorStop(0, 'rgba(255,190,80,.7)'); gr.addColorStop(1, 'rgba(255,120,40,.1)'); g.fillStyle = gr; g.fill();
    var last = D.ssn[D.ssn.length - 1]; g.fillStyle = '#ffd23f'; g.beginPath(); g.arc(X(last.y), Y(last.v), 3, 0, 7); g.fill();
  }
  function info() {
    var xr = D.xr && D.xr.length ? D.xr[D.xr.length - 1] : null, mx = 0;
    if (D.xr) D.xr.forEach(function (p) { if (p.f > mx) mx = p.f; });
    U.nm.textContent = xr ? '此刻 X 射线:' + cls(xr.f) + ' 级' : D.err.xr ? 'X 射线数据暂不可用' : '加载中…';
    U.k.textContent = (mx ? '24 小时最强:' + cls(mx) + ' 级' : '') + (D.sw ? (mx ? ' · ' : '') + '太阳风 ' + Math.round(D.sw) + ' km/s' : '');
    var kp = SH.eye && SH.eye.kp; var ss = D.ssn && D.ssn.length ? D.ssn[D.ssn.length - 1] : null;
    U.t.textContent = (ss ? '上月黑子数 ' + Math.round(ss.v) : '') + (kp != null ? (ss ? ' · ' : '') + '地磁 Kp ' + kp.toFixed(0) + (kp >= 5 ? '(磁暴,极光南扩)' : '') : '');
  }

  /* ---------- 向导 ---------- */
  function stars() { var n = ST.stars.reduce(function (s, x) { return s + x; }, 0); U.st.textContent = '★ ' + n + ' / 9'; }
  function showQ() {
    stars(); L.hints = 0; U.hs.textContent = ''; U.ch.innerHTML = ''; U.hint.hidden = false;
    if (L.q >= QS.length) { U.q.innerHTML = '<b>太阳活动三关完成!</b>星域「日与月」的四个实验室都开放了。回到地球,打开「极光」图层看看太阳风正在哪里点亮天空。'; U.hint.hidden = true; return; }
    var Q = QS[L.q]; U.q.innerHTML = '<small>第 ' + (L.q + 1) + ' / 3 关</small>' + Q.q;
    if (L.q === 0 && L.band !== 0) setBand(0);
    Q.ch.forEach(function (t, i) { var b = h('button', 'ml-c', t); b.type = 'button'; b.onclick = function () { answer(i === Q.ok, b); }; U.ch.appendChild(b); });
  }
  function answer(ok, b) {
    var Q = QS[L.q];
    if (!ok) { b.classList.add('no'); P('blip'); U.hs.textContent = '再想想,也可以看一条提示。'; setTimeout(function () { b.classList.remove('no'); }, 900); return; }
    var got = Math.max(1, 3 - L.hints); ST.stars[L.q] = Math.max(ST.stars[L.q] || 0, got); save(); P('arrive');
    if (SH.progress && SH.progress.explore) try { SH.progress.explore('sun'); } catch (e) { }
    U.ch.innerHTML = ''; U.hint.hidden = true;
    U.q.innerHTML = '<small>第 ' + (L.q + 1) + ' 关 · 获得 ' + '★'.repeat(got) + '</small>' + Q.good;
    var n = h('button', 'ml-c ml-c--go', L.q < 2 ? '下一关' : '完成'); n.type = 'button'; n.onclick = function () { L.q++; showQ(); }; U.ch.appendChild(n); stars();
  }
  function hint() {
    var Q = QS[L.q]; if (!Q || L.hints >= 3) return; P('click');
    U.hs.textContent = ['方向', '线索', '半步示范'][L.hints] + ':' + Q.hint[L.hints]; L.hints++;
    if (L.hints >= 3) U.hint.hidden = true;
  }

  function open() {
    if (!U.root) build();
    U.root.hidden = false; document.body.classList.add('ml-on');
    setBand(L.band); fetchAll(); drawXr(); drawSsn(); info();
    L.q = ST.stars.indexOf(0); if (L.q < 0) L.q = 3; showQ(); P('open');
  }
  function close() { U.root.hidden = true; document.body.classList.remove('ml-on'); P('close'); }
  SH.sunLab = { open: open, close: close, _D: D, _cls: cls };
})();
