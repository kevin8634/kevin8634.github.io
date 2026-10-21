/* 天枢 Starhelm · 星域 II「日与月」· M2c 潮汐实验室(任务 sh.tide)
 * 左:3D 太空俯视(太阳在左),海水被月亮和太阳拉成两头鼓起的「潮汐椭球」(平衡潮理论,隆起放大示意)
 * 右:海边一个地点 48 小时的潮高曲线,竖线 = 此刻。大潮/小潮随月相变化;每天涨潮推迟约 50 分钟。
 * 向导 3 关,三级提示,最少 1 星。存储 gn:sh:tide */
(function () {
  'use strict';
  var SH = window.SH = window.SH || {};
  var KEY = 'gn:sh:tide', SYN = 29.530589, KS = 0.46;   // KS:太阳引潮力约为月亮的 46%
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(ST)); } catch (e) { } }
  var ST = load(); ST.stars = ST.stars || [0, 0, 0];
  function h(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function n360(x) { return ((x % 360) + 360) % 360; }
  function P(n) { if (window.LE && LE.audio) LE.audio.play(n); }
  var D2R = Math.PI / 180, LAT = 30;   // 示意地点:北纬 30° 的海边

  // age:月日黄经差(0 新月,180 满月);hr:地点的地方时(0–24)
  var L = { age: 0, hr: 9, play: false, q: 0, hints: 0 };
  function dirAt(theta, v) { return v.set(-Math.cos(theta), 0, Math.sin(theta)); }   // 太阳在 -x;逆时针(从北极上方看)
  function P2(x) { return (3 * x * x - 1) / 2; }
  // 地点在地方时 hr、月龄 age 时的潮高(相对单位:月亮单独作用的最大潮差 = 1.5)
  function tideAt(hr, age) {
    var th = (hr - 12) * 15 * D2R, cl = Math.cos(LAT * D2R);
    var px = -Math.cos(th) * cl, pz = Math.sin(th) * cl;                // 地点方向(赤道面分量)
    var am = age * D2R, mdot = px * -Math.cos(am) + pz * Math.sin(am);   // 与月亮方向的夹角余弦(月亮在赤道面上,简化)
    var sdot = px * -1;                                                  // 与太阳方向
    return P2(mdot) + KS * P2(sdot);
  }
  function range(age) {   // 当天潮差:扫 24 小时
    var mx = -9, mn = 9; for (var t = 0; t < 24.84; t += 0.25) { var v = tideAt(t, age + t / 24 * 360 / SYN); if (v > mx) mx = v; if (v < mn) mn = v; } return mx - mn;
  }
  var R_MAX = range(0), R_MIN = range(90);
  function kind(age) { var r = range(age), f = (r - R_MIN) / (R_MAX - R_MIN); return f > 0.85 ? '大潮' : f < 0.15 ? '小潮' : '中潮'; }

  var QS = [
    { kind: 'choice', q: '按「▶ 播放」,看右边海边小镇的潮高曲线。一天(约 24 小时 50 分)里,海水会涨起来几次?',
      ch: ['两次', '一次', '四次'], ok: 0,
      hint: ['数一数右边曲线在一天里有几个高峰。', '看左边:海水鼓起来的地方有几处?是不是只有朝着月亮那一边?', '月亮把近的一侧海水拉过去,同时把地球本身拉得比远侧海水更多,所以背着月亮的一侧也鼓起来。地球自转一圈,小镇经过两个「鼓包」。'],
      good: '对!海水被拉成两头鼓的椭球,一边朝着月亮,一边背着月亮。地球转一圈,海边就涨潮两次、落潮两次。' },
    { kind: 'make', q: '太阳也会拉海水。调「月龄」,让潮差变到最大(大潮)。',
      check: function () { return kind(L.age) === '大潮'; },
      hint: ['太阳的拉力约是月亮的一半。两股拉力什么时候能「拧成一股」?', '让太阳、地球、月亮排成一条直线。这时是什么月相?', '把月龄拖到 0(新月)或 15 天左右(满月)。上弦、下弦时日月拉力垂直,互相抵消一部分,就是小潮。'],
      good: '成功!新月和满月时,太阳、地球、月亮在一条直线上,两股引潮力叠加,潮差最大,叫大潮;上弦、下弦时是小潮。' },
    { kind: 'choice', q: '仔细看曲线:今天的高潮比昨天同一个高潮晚了大约 50 分钟。为什么?',
      ch: ['月亮也在绕地球转,地球要多转一会儿才能再次对准月亮', '海水流得慢,越来越跟不上', '因为夏令时和时区'], ok: 0,
      hint: ['涨潮跟着谁走?太阳还是月亮?', '一天里,月亮在它的轨道上往前走了多远?(提示:约 29.5 天绕一圈)', '月亮每天向东挪约 12°,地球要多转 12°(约 50 分钟)才能重新对准它,所以月出和涨潮每天都推迟约 50 分钟。'],
      good: '没错!月亮每天在轨道上前进约 12°,地球得多转约 50 分钟才追得上。所以潮汐和月出一样,每天推迟约 50 分钟。' }
  ];

  var U = {}, G = null;
  function build() {
    var r = U.root = h('section', 'ml ml--tide');
    r.innerHTML =
      '<header class="ml-hd"><div><small>星域 II · 天璇 · 日与月</small><b>潮汐实验室</b></div><span class="ml-st"></span><button class="ml-x" type="button" aria-label="关闭">✕</button></header>' +
      '<div class="ml-body"><div class="ml-pane ml-space"><div class="ml-cap">太空俯视 · 从北极上方看</div><canvas class="ml-cv3"></canvas><div class="ml-sun" style="left:10px;right:auto">☀ 阳光 →</div>' +
      '<div class="ml-note">平衡潮理论 · 海水隆起放大约 10 万倍示意 · 大小与距离未按比例</div></div>' +
      '<div class="ml-pane ml-earth"><div class="ml-cap">海边小镇(北纬 30°)的潮高 · 48 小时</div><canvas class="ml-cv2 td-cv" width="420" height="300" style="aspect-ratio:7/5;width:min(100%,380px)"></canvas>' +
      '<div class="ml-info"><b class="ml-nm"></b><span class="ml-k"></span><span class="ml-t"></span></div></div></div>' +
      '<div class="ml-ctl ec-ctl"><button class="ml-play" type="button">▶ 播放</button><label>月龄<input class="ml-rng td-age" type="range" min="0" max="359.5" step="0.5"></label><span class="ml-day"></span>' +
      '<label>时刻<input class="ml-rng td-hr" type="range" min="0" max="23.9" step="0.1"></label><span class="td-hrv"></span><button class="ml-now" type="button">回到此刻</button></div>' +
      '<div class="ml-guide"><div class="ml-q"></div><div class="ml-ch"></div><div class="ml-gb"><button class="ml-hint" type="button">给我一点提示</button><span class="ml-hs"></span></div></div>';
    document.body.appendChild(r);
    ['st', 'x', 'cv3', 'cv2', 'nm', 'k', 't', 'play', 'day', 'now', 'q', 'ch', 'hint', 'hs'].forEach(function (k) { U[k] = r.querySelector('.ml-' + k); });
    U.age = r.querySelector('.td-age'); U.hr = r.querySelector('.td-hr'); U.hrv = r.querySelector('.td-hrv');
    U.x.onclick = close;
    U.play.onclick = function () { L.play = !L.play; U.play.textContent = L.play ? '❚❚ 暂停' : '▶ 播放'; };
    U.age.oninput = function () { L.age = +U.age.value; stop(); upd(); };
    U.hr.oninput = function () { L.hr = +U.hr.value; stop(); upd(); };
    U.now.onclick = function () { setNow(); P('click'); };
    U.hint.onclick = hint;
  }
  function stop() { L.play = false; U.play.textContent = '▶ 播放'; }

  /* ---------- 3D ---------- */
  var RO = 3.4;
  var OCEAN_VS = [
    'uniform vec3 uM, uS; uniform float uA; varying vec3 vN; varying float vH;',
    'float P2(float x){ return 1.5*x*x-.5; }',
    'void main(){ vec3 n=normalize(position); float t=P2(dot(n,uM))+' + KS.toFixed(2) + '*P2(dot(n,uS)); vH=t;',
    ' vec3 p=n*(.83+uA*t); vN=normalize(normalMatrix*n); gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.); }'].join('\n');
  var OCEAN_FS = 'uniform vec3 uSV; varying vec3 vN; varying float vH; void main(){ vec3 n=normalize(vN); float l=.45+.55*max(dot(n,uSV),0.); float rim=pow(1.-abs(n.z),2.); vec3 c=mix(vec3(.1,.4,.85),vec3(.55,.92,1.),clamp(vH*.5+.35,0.,1.)); gl_FragColor=vec4(c*l+rim*.25,.5+.3*rim); }';
  function initGL() {
    var T = window.THREE, cv = U.cv3;
    var rd = new T.WebGLRenderer({ canvas: cv, antialias: true, alpha: true }); rd.setPixelRatio(Math.min(2, devicePixelRatio || 1)); rd.outputEncoding = T.sRGBEncoding;
    var sc = new T.Scene(), cam = new T.PerspectiveCamera(36, 1, 0.1, 300);
    var light = new T.DirectionalLight(0xfff4e0, 2.6); light.position.set(-60, 0, 0); sc.add(light); sc.add(new T.AmbientLight(0x223044, 0.25));
    var day = window.LE && LE.earth && LE.earth.uniforms && LE.earth.uniforms.uDay && LE.earth.uniforms.uDay.value;
    var earth = new T.Mesh(new T.SphereGeometry(0.8, 48, 32), new T.MeshStandardMaterial(day ? { map: day, roughness: 0.8, metalness: 0 } : { color: 0x2c6fd6, roughness: 0.7, metalness: 0 })); sc.add(earth);
    var ocean = new T.Mesh(new T.SphereGeometry(1, 64, 40), new T.ShaderMaterial({ uniforms: { uM: { value: new T.Vector3(1, 0, 0) }, uS: { value: new T.Vector3(-1, 0, 0) }, uA: { value: 0.2 }, uSV: { value: new T.Vector3() } },
      vertexShader: OCEAN_VS, fragmentShader: OCEAN_FS, transparent: true, depthWrite: false }));
    sc.add(ocean);
    var moon = new T.Mesh(new T.SphereGeometry(0.26, 32, 20), new T.MeshStandardMaterial({ color: 0xbab6ad, roughness: 1, metalness: 0 })); sc.add(moon);
    var ring = []; for (var k = 0; k <= 96; k++) { var t = k / 96 * 6.2832; ring.push(new T.Vector3(Math.cos(t) * RO, 0, Math.sin(t) * RO)); }
    var orb = new T.Line(new T.BufferGeometry().setFromPoints(ring), new T.LineDashedMaterial({ color: 0x9fb3cc, dashSize: 0.2, gapSize: 0.14 })); orb.computeLineDistances(); sc.add(orb);
    var pin = new T.Mesh(new T.SphereGeometry(0.06, 12, 8), new T.MeshBasicMaterial({ color: 0xffd23f })); sc.add(pin);   // 海边小镇
    // 日、月引潮力方向箭头
    var am = new T.ArrowHelper(new T.Vector3(1, 0, 0), new T.Vector3(), 1.6, 0xbfd3ff, 0.18, 0.1), as = new T.ArrowHelper(new T.Vector3(-1, 0, 0), new T.Vector3(), 1.4, 0xffd27a, 0.18, 0.1);
    sc.add(am); sc.add(as);
    var sp = []; for (var q = 0; q < 600; q++) { var v = new T.Vector3().randomDirection().multiplyScalar(120); sp.push(v.x, v.y, v.z); }
    var sg = new T.BufferGeometry(); sg.setAttribute('position', new T.Float32BufferAttribute(sp, 3)); sc.add(new T.Points(sg, new T.PointsMaterial({ color: 0xaab8d0, size: 0.3 })));
    G = { T: T, rd: rd, sc: sc, cam: cam, earth: earth, ocean: ocean, moon: moon, pin: pin, am: am, as: as, v: new T.Vector3(), drag: null, tilt: 1.15 };
    cv.addEventListener('pointerdown', function (e) { G.drag = { y: e.clientY, t0: G.tilt }; cv.setPointerCapture(e.pointerId); });
    cv.addEventListener('pointermove', function (e) { if (G.drag) { G.tilt = Math.max(0.15, Math.min(1.5, G.drag.t0 - (e.clientY - G.drag.y) * 0.005)); place(); } });
    cv.addEventListener('pointerup', function () { G.drag = null; });
    resize();
  }
  function place() { if (!G) return; var d = 11.5 / Math.min(1, G.cam.aspect * 0.85); G.cam.position.set(0, Math.sin(G.tilt) * d, Math.cos(G.tilt) * d); G.cam.lookAt(0, 0, 0); }
  function resize() {
    if (!G) return; var b = U.cv3.parentNode.getBoundingClientRect(), w = Math.max(200, b.width), hh = Math.max(200, b.height);
    G.rd.setSize(w, hh, false); U.cv3.style.width = w + 'px'; U.cv3.style.height = hh + 'px'; G.cam.aspect = w / hh; G.cam.updateProjectionMatrix(); place();
  }
  function upd3() {
    if (!G) return; var v = G.v, am = L.age * D2R, th = (L.hr - 12) * 15 * D2R;
    dirAt(am, v); G.moon.position.copy(v).multiplyScalar(RO); G.ocean.material.uniforms.uM.value.copy(v);
    G.am.setDirection(v); G.am.position.copy(v).multiplyScalar(1.05);
    G.as.position.set(-1.05, 0, 0);
    G.ocean.material.uniforms.uSV.value.set(-1, 0, 0).transformDirection(G.cam.matrixWorldInverse);
    var cl = Math.cos(LAT * D2R); G.pin.position.set(-Math.cos(th) * cl * 0.83, Math.sin(LAT * D2R) * 0.83, Math.sin(th) * cl * 0.83);
    G.earth.rotation.y = -th + Math.PI / 2 + 2.1;   // 贴图跟着自转(经度示意)
  }

  /* ---------- 2D 潮高曲线 ---------- */
  function drawChart() {
    var c = U.cv2, g = c.getContext('2d'), W = c.width, H = c.height, x0 = 34, y0 = 16, w = W - x0 - 10, hh = H - y0 - 34;
    g.clearRect(0, 0, W, H);
    var lo = -1.1, hi = 1.6;
    function X(t) { return x0 + t / 48 * w; } function Y(v) { return y0 + (hi - v) / (hi - lo) * hh; }
    g.strokeStyle = 'rgba(255,255,255,.08)'; g.lineWidth = 1; g.fillStyle = 'rgba(160,180,210,.6)'; g.font = '11px sans-serif';
    for (var d = 0; d <= 48; d += 6) { g.beginPath(); g.moveTo(X(d), y0); g.lineTo(X(d), y0 + hh); g.stroke(); g.fillText(((d % 24) + ':00'), X(d) - 12, H - 18); }
    g.fillText('第 1 天', X(9), H - 4); g.fillText('第 2 天', X(33), H - 4);
    g.fillText('高', 6, Y(1.3)); g.fillText('低', 6, Y(-0.9));
    // 曲线:从当天 0 点起 48 小时,月龄随时间推进
    var a0 = L.age - L.hr / 24 * 360 / SYN, pts = [], peaks = [];
    for (var t = 0; t <= 48; t += 0.1) pts.push([t, tideAt(t % 24, a0 + t / 24 * 360 / SYN)]);
    g.beginPath(); g.moveTo(X(0), Y(lo)); pts.forEach(function (p) { g.lineTo(X(p[0]), Y(p[1])); }); g.lineTo(X(48), Y(lo)); g.closePath();
    var gr = g.createLinearGradient(0, y0, 0, y0 + hh); gr.addColorStop(0, 'rgba(90,190,255,.55)'); gr.addColorStop(1, 'rgba(20,60,140,.15)'); g.fillStyle = gr; g.fill();
    g.strokeStyle = '#7fd0ff'; g.lineWidth = 2; g.beginPath(); pts.forEach(function (p, i) { if (i) g.lineTo(X(p[0]), Y(p[1])); else g.moveTo(X(p[0]), Y(p[1])); }); g.stroke();
    for (var i = 1; i < pts.length - 1; i++) if (pts[i][1] > pts[i - 1][1] && pts[i][1] >= pts[i + 1][1]) peaks.push(pts[i]);
    g.fillStyle = '#f3cf7a'; peaks.forEach(function (p) { g.beginPath(); g.arc(X(p[0]), Y(p[1]), 3, 0, 7); g.fill(); g.fillText(hm(p[0] % 24), X(p[0]) - 14, Y(p[1]) - 7); });
    g.strokeStyle = '#ffd23f'; g.setLineDash([4, 3]); g.beginPath(); g.moveTo(X(L.hr), y0); g.lineTo(X(L.hr), y0 + hh); g.stroke(); g.setLineDash([]);
    L.peaks = peaks;
  }
  function hm(t) { var m = Math.round(t * 60); return Math.floor(m / 60) % 24 + ':' + ('0' + m % 60).slice(-2); }

  function upd() {
    U.age.value = L.age; U.hr.value = L.hr;
    var day = L.age / 360 * SYN, ph = day < 1.8 || day > 27.7 ? '新月' : Math.abs(day - 14.77) < 1.8 ? '满月' : Math.abs(day - 7.4) < 1.8 ? '上弦' : Math.abs(day - 22.1) < 1.8 ? '下弦' : day < 14.77 ? '渐盈' : '渐亏';
    U.day.textContent = '月龄 ' + day.toFixed(1) + ' 天 · ' + ph; U.hrv.textContent = hm(L.hr);
    var k = kind(L.age), v = tideAt(L.hr, L.age), dv = tideAt(L.hr + 0.2, L.age + 0.2 / 24 * 360 / SYN) - v;
    U.nm.textContent = k;
    U.k.textContent = '此刻:' + (Math.abs(dv) < 0.004 ? (v > 0.3 ? '高潮' : '低潮') : dv > 0 ? '正在涨潮' : '正在落潮') + ' · 潮差约为大潮的 ' + Math.round(range(L.age) / R_MAX * 100) + '%';
    U.t.textContent = k === '大潮' ? '日、月、地球几乎排成一线,两股拉力叠加' : k === '小潮' ? '日、月拉力互成直角,互相抵消一部分' : '真实海岸的潮时还受海底地形影响,常比月亮过中天晚几小时';
    upd3(); drawChart();
  }
  function setNow() {
    var now = new Date(), A = SH.astro, ph = A && A.moonPhase ? A.moonPhase(now) : { age: 0 };
    L.age = Math.round(n360(ph.age) * 2) / 2; L.hr = Math.round((now.getHours() + now.getMinutes() / 60) * 10) / 10; stop(); upd();
  }

  /* ---------- 向导 ---------- */
  function stars() { var n = ST.stars.reduce(function (s, x) { return s + x; }, 0); U.st.textContent = '★ ' + n + ' / 9'; }
  function showQ() {
    stars(); L.hints = 0; U.hs.textContent = ''; U.ch.innerHTML = ''; U.hint.hidden = false;
    if (L.q >= QS.length) {
      U.q.innerHTML = '<b>潮汐三关完成!</b>可以继续自由探索:找找「小潮」时曲线有什么不同。'; U.hint.hidden = true;
      if (SH.sunLab) { var go = h('button', 'ml-c ml-c--go', '☀ 去太阳活动观测台'); go.type = 'button'; go.onclick = function () { close(); SH.sunLab.open(); }; U.ch.appendChild(go); }
      return;
    }
    var Q = QS[L.q]; U.q.innerHTML = '<small>第 ' + (L.q + 1) + ' / 3 关</small>' + Q.q;
    if (Q.kind === 'choice') Q.ch.forEach(function (t, i) { var b = h('button', 'ml-c', t); b.type = 'button'; b.onclick = function () { answer(i === Q.ok, b); }; U.ch.appendChild(b); });
    else { var b = h('button', 'ml-c ml-c--go', '做到了'); b.type = 'button'; b.onclick = function () { answer(Q.check(), b); }; U.ch.appendChild(b); }
  }
  function answer(ok, b) {
    var Q = QS[L.q];
    if (!ok) { b.classList.add('no'); P('blip'); U.hs.textContent = Q.kind === 'make' ? '潮差还不是最大,再调调月龄,或看一条提示。' : '再想想,也可以看一条提示。'; setTimeout(function () { b.classList.remove('no'); }, 900); return; }
    var got = Math.max(1, 3 - L.hints); ST.stars[L.q] = Math.max(ST.stars[L.q] || 0, got); save(); P('arrive');
    if (SH.progress && SH.progress.explore) try { SH.progress.explore('tide'); } catch (e) { }
    U.ch.innerHTML = ''; U.hint.hidden = true;
    U.q.innerHTML = '<small>第 ' + (L.q + 1) + ' 关 · 获得 ' + '★'.repeat(got) + '</small>' + Q.good;
    var n = h('button', 'ml-c ml-c--go', L.q < 2 ? '下一关' : '完成'); n.type = 'button'; n.onclick = function () { L.q++; showQ(); }; U.ch.appendChild(n); stars();
  }
  function hint() {
    var Q = QS[L.q]; if (!Q || L.hints >= 3) return; P('click');
    U.hs.textContent = ['方向', '线索', '半步示范'][L.hints] + ':' + Q.hint[L.hints]; L.hints++;
    if (L.hints >= 3) U.hint.hidden = true;
  }

  var raf = 0, last = 0;
  function loop(t) {
    raf = requestAnimationFrame(loop); var dt = Math.min(0.1, (t - last) / 1000 || 0); last = t;
    if (L.play) { var dh = dt * 3; L.hr += dh; L.age = n360(L.age + dh / 24 * 360 / SYN); if (L.hr >= 24) L.hr -= 24; upd(); }   // 1 秒 = 3 小时
    if (G) G.rd.render(G.sc, G.cam);
  }
  function open() {
    if (!U.root) build();
    U.root.hidden = false; document.body.classList.add('ml-on');
    if (!G && window.THREE) try { initGL(); } catch (e) { console.warn('[tide] WebGL 失败', e); }
    resize(); setNow(); L.q = ST.stars.indexOf(0); if (L.q < 0) L.q = 3; showQ();
    cancelAnimationFrame(raf); raf = requestAnimationFrame(loop); P('open');
  }
  function close() { U.root.hidden = true; document.body.classList.remove('ml-on'); cancelAnimationFrame(raf); P('close'); }
  addEventListener('resize', function () { if (U.root && !U.root.hidden) resize(); });
  SH.tideLab = { open: open, close: close, _L: L, _kind: kind, _tide: tideAt, _upd: function () { upd(); } };
})();
