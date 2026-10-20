/* 天枢 Starhelm · 星域 II「日与月」· M2b 日月食实验室
 * 左:3D 侧视(太阳在左,月球轨道相对黄道面倾斜 5.1°,示意放大 3 倍;地球本影锥、交点线)
 * 右:从地球看(新月前后看太阳,满月前后看月亮)—— 视角大小按真实角度(度)计算,地心视角简化
 * 向导 3 关,三级提示「方向 → 线索 → 半步示范」,最少 1 星。存储 gn:sh:eclipse */
(function () {
  'use strict';
  var SH = window.SH = window.SH || {};
  var KEY = 'gn:sh:eclipse', SYN = 29.530589, INC = 5.145, VIS = 3;   // VIS:3D 中倾角放大倍数
  var RS = 0.267, RU = 0.70, RP = 1.25, RM_NEAR = 0.279, RM_FAR = 0.245, PAR = 0.95;   // PAR:月球视差 ≈ 地球半径对月距的张角,站在地球不同地方,月亮相对太阳的位置可差这么多   // 视半径(°):太阳、地影本影/半影(月球距离处)、月球近/远地点
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(ST)); } catch (e) { } }
  var ST = load(); ST.stars = ST.stars || [0, 0, 0];
  function h(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function n360(x) { return ((x % 360) + 360) % 360; }
  function w180(x) { x = n360(x); return x > 180 ? x - 360 : x; }
  function P(n) { if (window.LE && LE.audio) LE.audio.play(n); }

  // age:月日黄经差(0 新月,180 满月);node:升交点相对太阳的方向(随一年中的时间变化)
  var L = { age: 0, node: 30, near: true, play: false, q: 0, hints: 0, st: '' };
  function beta() { return INC * Math.sin((L.age - L.node) * Math.PI / 180); }   // 月球黄纬(°)
  function rm() { return L.near ? RM_NEAR : RM_FAR; }
  function status() {
    var b = beta(), m = rm();
    var ds = Math.max(0, Math.hypot(w180(L.age), b) - PAR), dl = Math.hypot(w180(L.age - 180), b);   // 日食:取地球上看得最完整的地点
    if (ds < RS + m) return ds <= Math.abs(m - RS) ? (m >= RS ? '日全食' : '日环食') : '日偏食';
    if (dl <= RU - m) return '月全食';
    if (dl < RU + m) return '月偏食';
    if (dl < RP + m) return '半影月食';
    return '';
  }

  var QS = [
    { kind: 'choice', q: '每个月都有一次新月,月亮都会从太阳和地球之间经过。为什么不是每个月都有日食?先拖动下面的「月龄」看看左边。',
      ch: ['月球轨道相对地球公转面倾斜了约 5°', '新月时月亮离地球太远', '太阳太大,月亮挡不住'], ok: 0,
      hint: ['从侧面看左边:新月时,月亮是正好挡在太阳前面,还是偏上或偏下?', '月亮的轨道(虚线圈)和地球绕太阳的平面(金色圆盘)是同一个平面吗?', '两个平面有一个夹角,只在两条交线上相交。新月时月亮多半在交线的上方或下方,影子就落不到地球上。'],
      good: '对!月球轨道倾斜约 5.1°。大多数新月,月亮从太阳的上方或下方「擦过去」,只有恰好在交点附近时才会发生日食。' },
    { kind: 'make', q: '自己做一次「日全食」:调「月龄」和「交点方向」,让右边的太阳被完全挡住。',
      check: function () { return status() === '日全食'; },
      hint: ['日食只可能发生在哪种月相?', '光是新月还不够:还要让交点线(左边的青色虚线)正好指向太阳。拖「交点方向」试试。', '如果太阳中间还剩一圈亮环,说明月亮离地球太远、显得太小,这叫日环食。把月亮切换到「近地点」。'],
      good: '成功!新月 + 月亮在交点附近 + 月亮离地球够近,三个条件同时满足,才有日全食。月亮远一点,就成了中间留一圈亮环的日环食。' },
    { kind: 'choice', q: '再把月龄拖到满月,做一次月全食。月全食时,月亮为什么是暗红色,而不是完全看不见?',
      ch: ['地球大气把阳光折射进影子里,红光最容易穿过来', '月亮自己会发出红光', '太阳的红外线照到了月亮'], ok: 0,
      hint: ['月全食时,月亮在地球的影子里。影子里真的一点光都没有吗?', '想想日落时的天空:阳光斜着穿过很厚的大气层,是什么颜色?', '地球的大气像一圈透镜,把日落、日出那圈红色的光弯进了影子里。'],
      good: '没错!那是地球上所有日出日落的红光照在月亮上。所以月全食时,月亮红得像铜一样。' }
  ];

  var U = {}, G = null;
  function build() {
    var r = U.root = h('section', 'ml ml--ecl');
    r.innerHTML =
      '<header class="ml-hd"><div><small>星域 II · 天璇 · 日与月</small><b>日月食实验室</b></div><span class="ml-st"></span><button class="ml-x" type="button" aria-label="关闭">✕</button></header>' +
      '<div class="ml-body"><div class="ml-pane ml-space"><div class="ml-cap">太空侧视 · 太阳在左边</div><canvas class="ml-cv3"></canvas>' +
      '<div class="ml-note">实时计算 · 轨道倾角放大 3 倍示意(真实 5.1°),大小与距离未按比例</div></div>' +
      '<div class="ml-pane ml-earth"><div class="ml-cap"><span class="ec-view">从地球上最佳地点看太阳</span> <button class="ml-hemi ec-near" type="button">月亮:近地点</button></div><canvas class="ml-cv2" width="360" height="360"></canvas>' +
      '<div class="ml-info"><b class="ml-nm"></b><span class="ml-k"></span><span class="ml-t"></span></div></div></div>' +
      '<div class="ml-ctl ec-ctl"><button class="ml-play" type="button">▶ 播放</button><label>月龄<input class="ml-rng ec-age" type="range" min="0" max="359.5" step="0.5"></label><span class="ml-day"></span>' +
      '<label>交点方向<input class="ml-rng ec-node" type="range" min="0" max="359" step="1"></label><button class="ml-now" type="button">回到此刻</button></div>' +
      '<div class="ml-guide"><div class="ml-q"></div><div class="ml-ch"></div><div class="ml-gb"><button class="ml-hint" type="button">给我一点提示</button><span class="ml-hs"></span></div></div>';
    document.body.appendChild(r);
    ['st', 'x', 'cv3', 'cv2', 'nm', 'k', 't', 'play', 'day', 'now', 'q', 'ch', 'hint', 'hs'].forEach(function (k) { U[k] = r.querySelector('.ml-' + k); });
    U.age = r.querySelector('.ec-age'); U.node = r.querySelector('.ec-node'); U.near = r.querySelector('.ec-near'); U.view = r.querySelector('.ec-view');
    U.x.onclick = close;
    U.play.onclick = function () { L.play = !L.play; U.play.textContent = L.play ? '❚❚ 暂停' : '▶ 播放'; };
    U.age.oninput = function () { L.age = +U.age.value; stop(); upd(); };
    U.node.oninput = function () { L.node = +U.node.value; stop(); upd(); };
    U.near.onclick = function () { L.near = !L.near; U.near.textContent = L.near ? '月亮:近地点' : '月亮:远地点'; P('click'); upd(); };
    U.now.onclick = function () { setNow(); P('click'); };
    U.hint.onclick = hint;
  }
  function stop() { L.play = false; U.play.textContent = '▶ 播放'; }

  /* ---------- 3D 侧视 ---------- */
  var SUN_X = -8.2, RO = 4.6;
  function moonPos(a, T, v) {   // a:月龄;太阳方向 = -x
    var r = a * Math.PI / 180, b = INC * VIS * Math.sin((a - L.node) * Math.PI / 180) * Math.PI / 180;
    return v.set(-Math.cos(r) * Math.cos(b) * RO, Math.sin(b) * RO, Math.sin(r) * Math.cos(b) * RO);
  }
  function initGL() {
    var T = window.THREE, cv = U.cv3;
    var rd = new T.WebGLRenderer({ canvas: cv, antialias: true, alpha: true }); rd.setPixelRatio(Math.min(2, devicePixelRatio || 1)); rd.outputEncoding = T.sRGBEncoding;
    var sc = new T.Scene(), cam = new T.PerspectiveCamera(36, 1, 0.1, 300);
    var light = new T.DirectionalLight(0xfff4e0, 2.8); light.position.set(-60, 0, 0); sc.add(light); sc.add(new T.AmbientLight(0x223044, 0.08));
    var sun = new T.Mesh(new T.SphereGeometry(1.5, 40, 24), new T.MeshBasicMaterial({ color: 0xffd27a })); sun.position.x = SUN_X; sc.add(sun);
    var gc = document.createElement('canvas'); gc.width = gc.height = 128; var gg = gc.getContext('2d'), gr = gg.createRadialGradient(64, 64, 8, 64, 64, 64);
    gr.addColorStop(0, 'rgba(255,220,140,0.9)'); gr.addColorStop(1, 'rgba(255,180,80,0)'); gg.fillStyle = gr; gg.fillRect(0, 0, 128, 128);
    var glow = new T.Sprite(new T.SpriteMaterial({ map: new T.CanvasTexture(gc), blending: T.AdditiveBlending, depthWrite: false })); glow.scale.setScalar(7); glow.position.x = SUN_X; sc.add(glow);
    var earth = new T.Mesh(new T.SphereGeometry(0.8, 48, 32), new T.MeshStandardMaterial({ color: 0x2c6fd6, roughness: 0.7, metalness: 0 })); sc.add(earth);
    var moon = new T.Mesh(new T.SphereGeometry(0.3, 32, 20), new T.MeshStandardMaterial({ color: 0xbab6ad, roughness: 1, metalness: 0 })); sc.add(moon);
    // 黄道面(地球公转面)
    var disc = new T.Mesh(new T.RingGeometry(0.9, 6.4, 72), new T.MeshBasicMaterial({ color: 0xd6b25e, transparent: true, opacity: 0.08, side: T.DoubleSide, depthWrite: false }));
    disc.rotation.x = -Math.PI / 2; sc.add(disc);
    var rim = []; for (var k = 0; k <= 96; k++) { var t = k / 96 * 6.2832; rim.push(new T.Vector3(Math.cos(t) * 6.4, 0, Math.sin(t) * 6.4)); }
    sc.add(new T.Line(new T.BufferGeometry().setFromPoints(rim), new T.LineBasicMaterial({ color: 0xd6b25e, transparent: true, opacity: 0.35 })));
    // 月球轨道(倾斜)+ 交点线
    var orb = new T.Line(new T.BufferGeometry().setFromPoints(new Array(129).fill(0).map(function () { return new T.Vector3(); })), new T.LineDashedMaterial({ color: 0x9fb3cc, dashSize: 0.22, gapSize: 0.14 }));
    sc.add(orb);
    var nodeL = new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(), new T.Vector3()]), new T.LineDashedMaterial({ color: 0x7fe3c4, dashSize: 0.18, gapSize: 0.12 }));
    sc.add(nodeL);
    var nm = new T.MeshBasicMaterial({ color: 0x7fe3c4 }), n1 = new T.Mesh(new T.SphereGeometry(0.08, 10, 8), nm), n2 = n1.clone(); sc.add(n1); sc.add(n2);
    // 地球本影锥(指向背离太阳的方向)
    var cone = new T.Mesh(new T.ConeGeometry(0.8, 7, 40, 1, true), new T.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.55, depthWrite: false, side: T.DoubleSide }));
    cone.rotation.z = Math.PI / 2; cone.position.x = 3.5; sc.add(cone);
    // 月影(新月前后才显示)
    var mcone = new T.Mesh(new T.ConeGeometry(0.3, 1, 24, 1, true), new T.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.6, depthWrite: false, side: T.DoubleSide }));
    sc.add(mcone);
    var sp = []; for (var q = 0; q < 700; q++) { var v = new T.Vector3().randomDirection().multiplyScalar(120); sp.push(v.x, v.y, v.z); }
    var sg = new T.BufferGeometry(); sg.setAttribute('position', new T.Float32BufferAttribute(sp, 3)); sc.add(new T.Points(sg, new T.PointsMaterial({ color: 0xaab8d0, size: 0.3 })));
    G = { T: T, rd: rd, sc: sc, cam: cam, earth: earth, moon: moon, orb: orb, nodeL: nodeL, n1: n1, n2: n2, mcone: mcone, v: new T.Vector3(), drag: null, yaw: 0.25 };
    // 拖动空白处:旋转视角
    cv.addEventListener('pointerdown', function (e) { G.drag = { x: e.clientX, y0: G.yaw }; cv.setPointerCapture(e.pointerId); });
    cv.addEventListener('pointermove', function (e) { if (G.drag) { G.yaw = G.drag.y0 + (e.clientX - G.drag.x) * 0.006; place(); } });
    cv.addEventListener('pointerup', function () { G.drag = null; });
    resize();
  }
  function place() {
    if (!G) return; var d = 21 / Math.min(1, G.cam.aspect * 0.8);
    G.cam.position.set(Math.sin(G.yaw) * d * 0.5 - 2.4, d * 0.3, Math.cos(G.yaw) * d); G.cam.lookAt(-2.4, -0.3, 0);
  }
  function resize() {
    if (!G) return; var b = U.cv3.parentNode.getBoundingClientRect(), w = Math.max(200, b.width), hh = Math.max(200, b.height);
    G.rd.setSize(w, hh, false); U.cv3.style.width = w + 'px'; U.cv3.style.height = hh + 'px'; G.cam.aspect = w / hh; G.cam.updateProjectionMatrix(); place();
  }
  function upd3() {
    if (!G) return; var T = G.T, v = G.v;
    var pts = G.orb.geometry.attributes.position;
    for (var k = 0; k <= 128; k++) { moonPos(k / 128 * 360, T, v); pts.setXYZ(k, v.x, v.y, v.z); }
    pts.needsUpdate = true; G.orb.computeLineDistances();
    moonPos(L.node, T, v); G.n1.position.copy(v); var a = v.clone(); moonPos(L.node + 180, T, v); G.n2.position.copy(v);
    var np = G.nodeL.geometry.attributes.position; np.setXYZ(0, a.x * 1.25, 0, a.z * 1.25); np.setXYZ(1, v.x * 1.25, 0, v.z * 1.25); np.needsUpdate = true; G.nodeL.computeLineDistances();
    moonPos(L.age, T, G.moon.position);
    var st = status(); G.moon.material.color.setHex(st === '月全食' ? 0x5a1c0c : st === '月偏食' ? 0x8a5a4a : st === '半影月食' ? 0x8f8c86 : 0xbab6ad);
    var near = Math.abs(w180(L.age)) < 25, mc = G.mcone;
    mc.visible = near;
    if (near) {   // 月影锥:从月球指向背离太阳的方向,长度到地球
      var len = Math.max(0.3, G.moon.position.length());
      mc.scale.set(1, len, 1); mc.position.set(G.moon.position.x + len / 2, G.moon.position.y, G.moon.position.z); mc.rotation.set(0, 0, Math.PI / 2);
    }
  }

  /* ---------- 2D:从地球看 ---------- */
  function drawFace() {
    var c = U.cv2, g = c.getContext('2d'), W = c.width, cx = W / 2, cy = W / 2, K = W / 3.4;   // K:每度多少像素
    var b = beta(), m = rm() * K, solar = Math.abs(w180(L.age)) <= 90;
    g.clearRect(0, 0, W, W);
    if (solar) {
      var st = status(), sx = cx, sy = cy, dx0 = -w180(L.age), dy0 = -b, d0 = Math.hypot(dx0, dy0), sh = d0 > 0 ? Math.max(0, d0 - PAR) / d0 : 0, mx = cx + dx0 * sh * K, my = cy + dy0 * sh * K, rs = RS * K;
      var cover = st === '日全食';
      // 日冕:只有全食时才看得见
      if (cover) { var cg = g.createRadialGradient(sx, sy, rs * 0.9, sx, sy, rs * 3.2); cg.addColorStop(0, 'rgba(235,240,255,0.85)'); cg.addColorStop(0.35, 'rgba(180,200,255,0.25)'); cg.addColorStop(1, 'rgba(120,150,255,0)'); g.fillStyle = cg; g.fillRect(0, 0, W, W); }
      else { var hg = g.createRadialGradient(sx, sy, rs, sx, sy, rs * 2.2); hg.addColorStop(0, 'rgba(255,210,120,0.45)'); hg.addColorStop(1, 'rgba(255,180,80,0)'); g.fillStyle = hg; g.fillRect(0, 0, W, W); }
      g.fillStyle = '#ffdc8a'; g.beginPath(); g.arc(sx, sy, rs, 0, 7); g.fill();
      if (Math.abs(mx - cx) < W) { g.fillStyle = '#05070c'; g.beginPath(); g.arc(mx, my, m, 0, 7); g.fill(); }
      if (cover) { g.fillStyle = 'rgba(255,90,90,0.9)'; [0.7, 2.4, 4.1].forEach(function (t) { g.beginPath(); g.arc(sx + Math.cos(t) * rs, sy + Math.sin(t) * rs, 2.2, 0, 7); g.fill(); }); }   // 日珥
    } else {
      var lx = cx - w180(L.age - 180) * K, ly = cy - b * K;
      g.strokeStyle = 'rgba(255,255,255,0.18)'; g.setLineDash([4, 4]);
      g.beginPath(); g.arc(cx, cy, RP * K, 0, 7); g.stroke(); g.strokeStyle = 'rgba(255,120,80,0.35)'; g.beginPath(); g.arc(cx, cy, RU * K, 0, 7); g.stroke(); g.setLineDash([]);
      g.fillStyle = 'rgba(160,180,210,0.6)'; g.font = '11px sans-serif'; g.fillText('地球半影', cx + RP * K * 0.72, cy - RP * K * 0.72); g.fillText('本影', cx + RU * K * 0.72, cy - RU * K * 0.72);
      g.save(); g.beginPath(); g.arc(lx, ly, m, 0, 7); g.clip();
      g.fillStyle = '#e6e2d8'; g.fillRect(lx - m, ly - m, m * 2, m * 2);
      g.fillStyle = 'rgba(0,0,0,0.22)'; g.beginPath(); g.arc(cx, cy, RP * K, 0, 7); g.fill();
      var ug = g.createRadialGradient(cx, cy, 0, cx, cy, RU * K); ug.addColorStop(0, 'rgba(70,14,4,0.96)'); ug.addColorStop(1, 'rgba(130,40,16,0.9)');
      g.fillStyle = ug; g.beginPath(); g.arc(cx, cy, RU * K, 0, 7); g.fill();
      g.restore();
    }
    g.fillStyle = 'rgba(160,180,210,0.55)'; g.font = '11px sans-serif'; g.fillText('视野约 3.4°,大小按真实视角', 8, W - 8);
  }

  function upd() {
    var a = L.age, st = status(), solar = Math.abs(w180(a)) <= 90;
    U.age.value = a; U.node.value = Math.round(n360(L.node));
    U.day.textContent = '月龄 ' + (a / 360 * SYN).toFixed(1) + ' 天';
    U.view.textContent = solar ? '从地球上最佳地点看太阳' : '从地球看月亮';
    U.nm.textContent = st || (solar ? '没有日食' : '没有月食');
    U.k.textContent = '月亮偏离黄道 ' + Math.abs(beta()).toFixed(2) + '°' + (beta() >= 0 ? '(偏北)' : '(偏南)');
    U.t.textContent = st === '日环食' ? '月亮在远地点,显得比太阳小,留下一圈亮环' : st === '月全食' ? '地球大气把红光折射进影子,月亮呈古铜色' : st ? (st.charAt(0) === '日' ? '只有地球上月影扫过的一条窄带能看到这样的' + st : '这时整个夜半球都能看到') : '要发生日月食:新月或满月 + 月亮在交点附近';
    if (st && st !== L.st) P('glass'); L.st = st;
    upd3(); drawFace();
  }
  function setNow() {
    var now = new Date(), A = SH.astro, ph = A && A.moonPhase ? A.moonPhase(now) : { age: 0 };
    var d = (now.getTime() / 86400000 + 2440587.5) - 2451545.0, T = d / 36525;
    var lsun = n360(280.460 + 0.9856474 * d + 1.915 * Math.sin((357.528 + 0.9856003 * d) * Math.PI / 180));
    var om = n360(125.04452 - 1934.136261 * T);   // 月球升交点平黄经
    L.age = Math.round(ph.age * 2) / 2; L.node = Math.round(n360(om - lsun)); stop(); upd();
  }

  /* ---------- 向导 ---------- */
  function stars() { var n = ST.stars.reduce(function (s, x) { return s + x; }, 0); U.st.textContent = '★ ' + n + ' / 9'; }
  function showQ() {
    stars(); L.hints = 0; U.hs.textContent = ''; U.ch.innerHTML = ''; U.hint.hidden = false;
    if (L.q >= QS.length) { U.q.innerHTML = '<b>日月食三关完成!</b>星域「日与月」的两个实验室都通关了。可以继续自由探索:试试找一次日环食和半影月食。'; U.hint.hidden = true; return; }
    var Q = QS[L.q]; U.q.innerHTML = '<small>第 ' + (L.q + 1) + ' / 3 关</small>' + Q.q;
    if (Q.kind === 'choice') Q.ch.forEach(function (t, i) { var b = h('button', 'ml-c', t); b.type = 'button'; b.onclick = function () { answer(i === Q.ok, b); }; U.ch.appendChild(b); });
    else { var b = h('button', 'ml-c ml-c--go', '做到了'); b.type = 'button'; b.onclick = function () { answer(Q.check(), b); }; U.ch.appendChild(b); }
  }
  function answer(ok, b) {
    var Q = QS[L.q];
    if (!ok) { b.classList.add('no'); P('blip'); U.hs.textContent = Q.kind === 'make' ? '右边的太阳还没被完全挡住,再调调,或看一条提示。' : '再想想,也可以看一条提示。'; setTimeout(function () { b.classList.remove('no'); }, 900); return; }
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
    if (L.play) { L.age = n360(L.age + dt * 360 / SYN * 1.5); L.node = n360(L.node - dt * 360 / 365.25 * 1.5 * 1.0748); upd(); }   // 节点相对太阳每年约退 360°×(1+1/18.6)
    if (G) { G.earth.rotation.y += dt * 1.2; G.rd.render(G.sc, G.cam); }
  }
  function open() {
    if (!U.root) build();
    U.root.hidden = false; document.body.classList.add('ml-on');
    if (!G && window.THREE) try { initGL(); } catch (e) { console.warn('[eclipse] WebGL 失败', e); }
    resize(); setNow(); L.q = ST.stars.indexOf(0); if (L.q < 0) L.q = 3; showQ();
    cancelAnimationFrame(raf); raf = requestAnimationFrame(loop); P('open');
  }
  function close() { U.root.hidden = true; document.body.classList.remove('ml-on'); cancelAnimationFrame(raf); P('close'); }
  addEventListener('resize', function () { if (U.root && !U.root.hidden) resize(); });
  SH.eclipseLab = { open: open, close: close, _L: L, _status: status, _upd: function () { upd(); } };
})();
