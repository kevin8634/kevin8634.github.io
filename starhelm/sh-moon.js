/* 天枢 Starhelm · 星域 II「日与月」· M2a 月相实验室
 * 左:从太空俯视(真实光照:太阳从右侧照来,月球永远一半亮)  右:从地球看到的月相(由月日黄经差算出)
 * 向导 3 关:只提问,三级提示「方向 → 线索 → 半步示范」,最少 1 星。存储 gn:sh:moon */
(function () {
  'use strict';
  var SH = window.SH = window.SH || {};
  var KEY = 'gn:sh:moon', SYN = 29.530589;
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(ST)); } catch (e) { } }
  var ST = load(); ST.stars = ST.stars || [0, 0, 0];
  function h(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function n360(x) { return ((x % 360) + 360) % 360; }
  function P(n) { if (window.LE && LE.audio) LE.audio.play(n); }

  var L = { age: 0, play: false, south: false, q: 0, hints: 0 };
  var NAMES = [[10, '新月'], [80, '蛾眉月'], [100, '上弦月'], [170, '盈凸月'], [190, '满月'], [260, '亏凸月'], [280, '下弦月'], [350, '残月'], [361, '新月']];
  function nameOf(a) { for (var i = 0; i < NAMES.length; i++) if (a < NAMES[i][0]) return NAMES[i][1]; return '新月'; }
  function hhmm(hf) { hf = ((hf % 24) + 24) % 24; var H = Math.floor(hf), M = Math.round((hf - H) * 60 / 10) * 10; if (M === 60) { H = (H + 1) % 24; M = 0; } return (H < 10 ? '0' : '') + H + ':' + (M < 10 ? '0' : '') + M; }

  var QS = [
    { kind: 'choice', q: '把月亮沿轨道拖一整圈,只看左边「太空俯视」。被阳光照亮的那一面,大小会变吗?',
      ch: ['会变,有时亮得多有时亮得少', '不变,始终亮一半', '只有满月时才整个亮'], ok: 1,
      hint: ['先别看右边,只盯着左边太空里的月亮。', '阳光一直从右边照来,月亮是个球。一个球被一盏灯照着,亮的是多少?', '无论月亮转到哪里,朝着太阳的那半个球总是亮的。那么变化的到底是什么?'],
      good: '对!太阳永远照亮月球的一半。月相变化,是因为我们从地球上看到亮面的多少在变。' },
    { kind: 'drag', q: '现在把月亮拖到「满月」的位置,然后按「就是这里」。',
      check: function (a) { return a >= 168 && a <= 192; },
      hint: ['满月 = 从地球上能看到整个亮面。', '亮面朝着太阳。地球要站在哪里,才能正对着整个亮面?', '满月时太阳、地球、月亮几乎排成一条线,月亮在太阳的正对面,也就是左边。'],
      good: '找到了!满月时月亮和太阳隔着地球相对。不过它们通常不完全在一条线上,所以不是每个满月都有月食。为什么?「日月食实验室」揭晓。' },
    { kind: 'choice', q: '上弦月时,月亮在天上比太阳偏东大约 90°。它大约几点升到正南方最高处?',
      ch: ['中午 12 点', '傍晚 6 点', '半夜 12 点', '清晨 6 点'], ok: 1,
      hint: ['太阳升到正南方,是中午 12 点。', '地球自转一圈 24 小时,也就是 360°。月亮比太阳晚 90°,要晚几小时才转到正南?', '360° 对应 24 小时,90° 就是 6 小时。12 点再加 6 小时呢?'],
      good: '没错,约傍晚 6 点。所以放学路上抬头,常能在南方天空看到上弦月。满月则是半夜在正南,它整夜都在天上。' }
  ];

  var U = {}, G = null;
  function build() {
    var r = U.root = h('section', 'ml');
    r.innerHTML =
      '<header class="ml-hd"><div><small>星域 II · 羲和与望舒 · 日与月</small><b>月相实验室</b></div><span class="ml-st"></span><button class="ml-x" type="button" aria-label="关闭">✕</button></header>' +
      '<div class="ml-body"><div class="ml-pane ml-space"><div class="ml-cap">太空俯视 · 从北极上方看</div><canvas class="ml-cv3"></canvas><div class="ml-sun">阳光 ☀ →</div><div class="ml-note">实时光照计算 · 大小与距离未按比例(真实地月距离约 30 个地球直径)</div></div>' +
      '<div class="ml-pane ml-earth"><div class="ml-cap">从地球上看 <button class="ml-hemi" type="button">北半球</button></div><canvas class="ml-cv2" width="360" height="360"></canvas>' +
      '<div class="ml-info"><b class="ml-nm"></b><span class="ml-k"></span><span class="ml-t"></span></div></div></div>' +
      '<div class="ml-ctl"><button class="ml-play" type="button">▶ 播放</button><input class="ml-rng" type="range" min="0" max="359.5" step="0.5"><span class="ml-day"></span><button class="ml-now" type="button">回到此刻</button></div>' +
      '<div class="ml-guide"><div class="ml-q"></div><div class="ml-ch"></div><div class="ml-gb"><button class="ml-hint" type="button">给我一点提示</button><span class="ml-hs"></span></div></div>';
    document.body.appendChild(r);
    ['st', 'x', 'cv3', 'cv2', 'nm', 'k', 't', 'play', 'rng', 'day', 'now', 'q', 'ch', 'hint', 'hs', 'hemi'].forEach(function (k) { U[k] = r.querySelector('.ml-' + k); });
    U.x.onclick = close;
    U.play.onclick = function () { L.play = !L.play; U.play.textContent = L.play ? '❚❚ 暂停' : '▶ 播放'; };
    U.rng.oninput = function () { L.age = +U.rng.value; L.play = false; U.play.textContent = '▶ 播放'; upd(); };
    U.now.onclick = function () { setNow(); P('click'); };
    U.hemi.onclick = function () { L.south = !L.south; U.hemi.textContent = L.south ? '南半球' : '北半球'; upd(); };
    U.hint.onclick = hint;
  }

  /* ---------- 3D 太空俯视 ---------- */
  function initGL() {
    var T = window.THREE, cv = U.cv3;
    var rd = new T.WebGLRenderer({ canvas: cv, antialias: true }); rd.setPixelRatio(Math.min(2, devicePixelRatio || 1));
    rd.outputEncoding = T.sRGBEncoding;
    var sc = new T.Scene(), cam = new T.PerspectiveCamera(38, 1, 0.1, 200);
    cam.position.set(0, 15.5, 5.2); cam.lookAt(0, 0, 0.3);
    var sun = new T.DirectionalLight(0xfff4e0, 2.6); sun.position.set(60, 0, 0); sc.add(sun);
    sc.add(new T.AmbientLight(0x223044, 0.06));
    var earth = new T.Mesh(new T.SphereGeometry(1, 48, 32), new T.MeshStandardMaterial({ color: 0x2c6fd6, roughness: 0.7, metalness: 0 }));
    // 北极冰盖:让人看出「从北极上方看」
    var cap = new T.Mesh(new T.SphereGeometry(1.01, 32, 12, 0, Math.PI * 2, 0, 0.42), new T.MeshStandardMaterial({ color: 0xf2f6ff, roughness: 0.8, metalness: 0 }));
    earth.add(cap); sc.add(earth);
    var moon = new T.Mesh(new T.SphereGeometry(0.42, 48, 32), new T.MeshStandardMaterial({ color: 0xb9b6ae, roughness: 1, metalness: 0 })); sc.add(moon);
    // 月面暗斑(仅示意质感)
    for (var i = 0; i < 7; i++) { var s = new T.Mesh(new T.SphereGeometry(0.42 * (0.18 + Math.random() * 0.15), 12, 8), new T.MeshStandardMaterial({ color: 0x77746e, roughness: 1, metalness: 0 })); var a = Math.random() * 6.28, b = (Math.random() - 0.5) * 2; s.position.set(Math.cos(a) * 0.34, b * 0.2, Math.sin(a) * 0.34); s.scale.set(1, 0.35, 1); s.lookAt(0, 0, 0); moon.add(s); }
    var RO = 5.2, pts = [];
    for (var k = 0; k <= 128; k++) { var t = k / 128 * Math.PI * 2; pts.push(new T.Vector3(Math.cos(t) * RO, 0, Math.sin(t) * RO)); }
    sc.add(new T.Line(new T.BufferGeometry().setFromPoints(pts), new T.LineDashedMaterial({ color: 0x5c7aa0, dashSize: 0.25, gapSize: 0.18 })).computeLineDistances());
    // 平行的阳光示意线
    var rays = new T.Group(), rm = new T.LineBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0.22 });
    for (var z = -6; z <= 6; z += 2) rays.add(new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(12, 0, z), new T.Vector3(7.2, 0, z)]), rm));
    sc.add(rays);
    // 8 个月相位置刻度
    var tickM = new T.MeshBasicMaterial({ color: 0x7fe3c4 });
    for (var j = 0; j < 8; j++) { var tt = j / 8 * Math.PI * 2, m = new T.Mesh(new T.SphereGeometry(0.05, 8, 6), tickM); m.position.set(Math.cos(tt) * RO, 0, -Math.sin(tt) * RO); sc.add(m); }
    var stars = new T.BufferGeometry(), sp = [];
    for (var q = 0; q < 600; q++) { var v = new T.Vector3().randomDirection().multiplyScalar(80); if (v.y < 0) v.y = -v.y; sp.push(v.x, v.y - 30, v.z); }
    stars.setAttribute('position', new T.Float32BufferAttribute(sp, 3)); sc.add(new T.Points(stars, new T.PointsMaterial({ color: 0xaab8d0, size: 0.25 })));
    G = { T: T, rd: rd, sc: sc, cam: cam, earth: earth, moon: moon, RO: RO, ray: new T.Raycaster(), pl: new T.Plane(new T.Vector3(0, 1, 0), 0), v2: new T.Vector2(), drag: false };
    function pick(e) {
      var b = cv.getBoundingClientRect(); G.v2.set((e.clientX - b.left) / b.width * 2 - 1, -(e.clientY - b.top) / b.height * 2 + 1);
      G.ray.setFromCamera(G.v2, cam); var p = new T.Vector3(); if (!G.ray.ray.intersectPlane(G.pl, p)) return;
      L.age = n360(Math.atan2(-p.z, p.x) * 180 / Math.PI); L.play = false; U.play.textContent = '▶ 播放'; upd();
    }
    cv.addEventListener('pointerdown', function (e) { G.drag = true; cv.setPointerCapture(e.pointerId); pick(e); });
    cv.addEventListener('pointermove', function (e) { if (G.drag) pick(e); });
    cv.addEventListener('pointerup', function () { G.drag = false; });
    resize();
  }
  function resize() {
    if (!G) return; var b = U.cv3.parentNode.getBoundingClientRect(), w = Math.max(200, b.width), hh = Math.max(200, b.height);
    G.rd.setSize(w, hh, false); U.cv3.style.width = w + 'px'; U.cv3.style.height = hh + 'px'; G.cam.aspect = w / hh;
    var d = 8.6 / Math.tan(19 * Math.PI / 180) / Math.min(1, G.cam.aspect); G.cam.position.set(0, d * 0.96, d * 0.28); G.cam.lookAt(0, 0, 0); G.cam.updateProjectionMatrix();
  }

  /* ---------- 2D:从地球看到的月亮 ---------- */
  function drawFace() {
    var c = U.cv2, g = c.getContext('2d'), W = c.width, R = W * 0.4, cx = W / 2, cy = W / 2, a = L.age * Math.PI / 180;
    g.clearRect(0, 0, W, W);
    var gr = g.createRadialGradient(cx - R * 0.3, cy - R * 0.3, R * 0.1, cx, cy, R);
    gr.addColorStop(0, '#efece4'); gr.addColorStop(1, '#bdb8ac');
    var lit = (1 - Math.cos(a)) / 2;
    // 暗面:新月前后可见「地照」(地球反射的阳光)
    g.fillStyle = 'rgba(70,82,104,' + (0.18 + 0.32 * (1 - lit)) + ')'; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.fill();
    var s = (L.age < 180 ? 1 : -1) * (L.south ? -1 : 1);
    g.save(); g.beginPath();
    for (var i = 0; i <= 60; i++) { var t = -Math.PI / 2 + Math.PI * i / 60; g.lineTo(cx + s * R * Math.cos(t), cy + R * Math.sin(t)); }
    for (var j = 60; j >= 0; j--) { var t2 = -Math.PI / 2 + Math.PI * j / 60; g.lineTo(cx + s * R * Math.cos(a) * Math.cos(t2), cy + R * Math.sin(t2)); }
    g.closePath(); g.clip();
    g.fillStyle = gr; g.fillRect(cx - R, cy - R, 2 * R, 2 * R);
    // 月海(示意位置,北半球视角)
    g.fillStyle = 'rgba(120,116,108,0.28)';
    [[-0.25, -0.3, 0.22], [0.15, -0.35, 0.16], [0.28, -0.05, 0.2], [-0.05, 0.12, 0.15], [-0.38, 0.1, 0.17], [0.1, 0.42, 0.1]].forEach(function (m) {
      var mx = L.south ? -m[0] : m[0], my = L.south ? -m[1] : m[1]; g.beginPath(); g.arc(cx + mx * R, cy + my * R, m[2] * R, 0, 7); g.fill();
    });
    g.restore();
  }

  function upd() {
    var a = L.age, days = a / 360 * SYN, lit = (1 - Math.cos(a * Math.PI / 180)) / 2;
    if (G) { var r = a * Math.PI / 180; G.moon.position.set(Math.cos(r) * G.RO, 0, -Math.sin(r) * G.RO); }
    U.rng.value = a; U.day.textContent = '月龄 ' + days.toFixed(1) + ' 天 / 29.5';
    U.nm.textContent = (L.nowMark && Math.abs(a - L.nowAge) < 0.6 ? '此刻 · ' : '') + nameOf(a);
    U.k.textContent = '可见亮面 ' + Math.round(lit * 100) + '%';
    U.t.textContent = '约 ' + hhmm(12 + a / 15) + ' 在正南方' + (lit < 0.03 ? '(与太阳同升同落,看不见)' : '');
    drawFace();
  }
  function setNow() {
    var A = SH.astro, ph = A && A.moonPhase ? A.moonPhase(new Date()) : { age: 0 };
    L.age = L.nowAge = Math.round(ph.age * 2) / 2; L.nowMark = true; L.play = false; U.play.textContent = '▶ 播放'; upd();
  }

  /* ---------- 向导 ---------- */
  function stars() { var n = ST.stars.reduce(function (s, x) { return s + x; }, 0); U.st.textContent = '★ ' + n + ' / 9'; }
  function showQ() {
    stars(); L.hints = 0; U.hs.textContent = ''; U.ch.innerHTML = ''; U.hint.hidden = false;
    if (L.q >= QS.length) { U.q.innerHTML = '<b>月相三关完成!</b>下一站:日食与月食。也可以继续拖动月亮自由探索。'; U.hint.hidden = true;
      if (SH.eclipseLab) { var go = h('button', 'ml-c ml-c--go', '🌑 去日月食实验室'); go.type = 'button'; go.onclick = function () { close(); SH.eclipseLab.open(); }; U.ch.appendChild(go); }
      return; }
    var Q = QS[L.q]; U.q.innerHTML = '<small>第 ' + (L.q + 1) + ' / 3 关</small>' + Q.q;
    if (Q.kind === 'choice') Q.ch.forEach(function (t, i) { var b = h('button', 'ml-c', t); b.type = 'button'; b.onclick = function () { answer(i === Q.ok, b); }; U.ch.appendChild(b); });
    else { var b = h('button', 'ml-c ml-c--go', '就是这里'); b.type = 'button'; b.onclick = function () { answer(Q.check(L.age), b); }; U.ch.appendChild(b); }
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

  var raf = 0, last = 0;
  function loop(t) {
    raf = requestAnimationFrame(loop); var dt = Math.min(0.1, (t - last) / 1000 || 0); last = t;
    if (L.play) { L.age = n360(L.age + dt * 360 / SYN); L.nowMark = false; upd(); }
    if (G) { G.earth.rotation.y += dt * 1.2; G.moon.rotation.y = -L.age * Math.PI / 180; G.rd.render(G.sc, G.cam); }
  }
  function open() {
    if (!U.root) build();
    U.root.hidden = false; document.body.classList.add('ml-on');
    if (!G && window.THREE) try { initGL(); } catch (e) { console.warn('[moon] WebGL 失败', e); }
    resize(); setNow(); L.q = ST.stars.indexOf(0); if (L.q < 0) L.q = 3; showQ();
    cancelAnimationFrame(raf); raf = requestAnimationFrame(loop); P('open');
  }
  function close() { U.root.hidden = true; document.body.classList.remove('ml-on'); cancelAnimationFrame(raf); P('close'); }
  addEventListener('resize', function () { if (U.root && !U.root.hidden) resize(); });
  SH.moonLab = { open: open, close: close, _L: L };
})();
