/* 天枢 Starhelm · 星域 I「家园」· 任务 sh.seasons「为什么会有四季?」(M2 #2)
 * 左:公转全息沙盘(太阳居中,地球按日期在轨道上,地轴方向在太空中保持不变;所选纬度画成一圈,看它有多少在白天)
 * 右:地面视角(朝南看的太阳轨迹:夏至/春秋分/冬至参考线 + 当天)+ 一年昼长曲线
 * 计算:太阳视黄经与日地距离(低精度太阳星历,误差 <0.01°),赤纬 δ = asin(sin ε · sin λ),昼长含 -0.833° 大气折射与日面半径。
 * 向导 3 关(三级提示「方向 → 线索 → 半步示范」,最少 1 星),进度走任务框架 gn:sh:seasons。 */
(function () {
  'use strict';
  var SH = window.SH = window.SH || {};
  var D2R = Math.PI / 180, EPS0 = 23.44, AU = 1.495978707e8, YEAR = 2026;
  var J0 = Date.UTC(YEAR, 0, 1) / 86400000 + 2440587.5 - 2451545.0;   // 2026-01-01 0h UT 距 J2000 的天数
  var NDAYS = 365;
  function h(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function n360(x) { return ((x % 360) + 360) % 360; }
  function P(n) { if (window.LE && LE.audio) LE.audio.play(n); }

  /* ---------- 天文计算(纯函数) ---------- */
  function sunAt(doy) {   // doy:0 = 1 月 1 日 0 时(UT),可带小数
    var d = J0 + doy, g = n360(357.529 + 0.98560028 * d) * D2R;
    var lam = n360(280.459 + 0.98564736 * d + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g));
    var r = 1.00014 - 0.01671 * Math.cos(g) - 0.00014 * Math.cos(2 * g);
    return { lam: lam, r: r };
  }
  function decl(lam, tilt) { return Math.asin(Math.sin(tilt * D2R) * Math.sin(lam * D2R)) / D2R; }
  function dayLen(lat, dec) {   // 小时
    var f = lat * D2R, d = dec * D2R, c = (Math.sin(-0.833 * D2R) - Math.sin(f) * Math.sin(d)) / (Math.cos(f) * Math.cos(d));
    if (c <= -1) return 24; if (c >= 1) return 0; return 2 * Math.acos(c) / D2R / 15;
  }
  function noonAlt(lat, dec) { return 90 - Math.abs(lat - dec); }
  function altAz(lat, dec, H) {   // H:时角(°);方位从正北顺时针
    var f = lat * D2R, d = dec * D2R, hh = H * D2R;
    var s = Math.sin(f) * Math.sin(d) + Math.cos(f) * Math.cos(d) * Math.cos(hh), alt = Math.asin(Math.max(-1, Math.min(1, s)));
    var az = Math.atan2(-Math.cos(d) * Math.sin(hh), Math.sin(d) * Math.cos(f) - Math.cos(d) * Math.sin(f) * Math.cos(hh));
    return { alt: alt / D2R, az: n360(az / D2R) };
  }
  function mdOf(doy) { var t = new Date(Date.UTC(YEAR, 0, 1) + Math.floor(doy) * 86400000); return (t.getUTCMonth() + 1) + ' 月 ' + t.getUTCDate() + ' 日'; }
  function doyOf(m, dd) { return (Date.UTC(YEAR, m - 1, dd) - Date.UTC(YEAR, 0, 1)) / 86400000; }
  function doyAtLam(L0) {   // 太阳视黄经 = L0 的日子(二分二至)
    var best = 0, bd = 1e9; for (var k = 0; k < NDAYS * 4; k++) { var x = k / 4, dl = Math.abs(((sunAt(x).lam - L0 + 540) % 360) - 180); if (dl < bd) { bd = dl; best = x; } } return best;
  }
  var KEY_DAYS = null;
  function keyDays() {
    if (!KEY_DAYS) KEY_DAYS = [{ zh: '春分', lam: 0, c: '#9fe8c8' }, { zh: '夏至', lam: 90, c: '#ffcf6a' }, { zh: '秋分', lam: 180, c: '#e8b48a' }, { zh: '冬至', lam: 270, c: '#8fc4ff' }].map(function (k) { k.doy = doyAtLam(k.lam); return k; });
    return KEY_DAYS;
  }
  SH.seasonsMath = { sunAt: sunAt, decl: decl, dayLen: dayLen, noonAlt: noonAlt, altAz: altAz, doyAtLam: doyAtLam };

  var CITIES = [['哈尔滨', 45.8], ['北京', 39.9], ['广州', 23.1], ['新加坡', 1.3], ['悉尼', -33.9], ['北极圈', 66.6]];
  var L = { doy: 0, lat: 39.9, tilt: EPS0, play: false, n: 1, api: null, hints: 0, done: false };

  var QS = [
    { kind: 'choice', title: '离太阳近,就是夏天吗?',
      q: '北京的夏天比冬天热得多。是因为夏天地球离太阳更近吗?先拖动「日期」,看看右下角的日地距离。',
      ch: ['不是。北半球的夏天,地球反而离太阳最远', '是,夏天地球离太阳近', '夏天太阳本身变得更大更亮'], ok: 0,
      hint: ['把日期拖到 1 月初,再拖到 7 月初,分别看看日地距离是多少。', '1 月初地球离太阳最近(约 1.471 亿 km),7 月初最远(约 1.521 亿 km),只差约 3%。北京 1 月是什么季节?', '同一天,南半球和北半球的季节正好相反。如果原因是距离,两边应该同时是夏天才对。'],
      good: '对!7 月初地球离太阳最远,北半球却正是盛夏。距离只差约 3%,不是季节的原因。真正的原因,就藏在左边那根歪着的地轴里。' },
    { kind: 'make', title: '找到北京的夏至',
      q: '城市选「北京」。拖动日期,找到一年里北京正午太阳最高、白天最长的那一天(前后 3 天内都算)。',
      check: function () { var k = keyDays()[1].doy; return Math.abs(L.lat - 39.9) < 0.6 && Math.abs(L.tilt - EPS0) < 0.6 && Math.abs(L.doy - k) <= 3; },
      hint: ['看右边:太阳轨迹什么时候爬得最高、弧线拉得最长?', '再看左边:地轴的北端什么时候正好歪向太阳?那时北京那一圈(金色圆环)大部分都在白天里。', '这一天叫「夏至」,在 6 月 21 日前后。把日期拖到 6 月下旬试试。'],
      good: '找到了,这就是夏至!北京正午太阳高约 73.5°,白天约 15 小时。阳光越陡,同一束光铺开的面积越小,地面就越热;白天越长,晒的时间也越久。' },
    { kind: 'choice', title: '如果地轴不歪',
      q: '把「地轴倾角」拨到 0°,再按「播放」看一整年。地轴如果不歪,会发生什么?',
      ch: ['四季消失:每天的太阳高度和昼长都一样', '四季变得更明显', '只有北半球没有四季'], ok: 0,
      hint: ['拨到 0° 后播放一年,看看右边的太阳轨迹还会上下移动吗?', '倾角为 0 时,太阳一年到头都直射赤道。北京那一圈,白天和黑夜各占多少?', '每天都是昼夜各约 12 小时、正午太阳高度不变——既没有夏天,也没有冬天。'],
      good: '没错。四季来自地轴约 23.4° 的倾斜:它让太阳直射点在南北回归线之间来回移动。天王星倾斜约 98°,那里的一个季节要持续约 21 年!' }
  ];

  /* ---------- 界面 ---------- */
  var U = {}, G = null;
  function build() {
    var r = U.root = h('section', 'ml ml--sea');
    r.innerHTML =
      '<header class="ml-hd"><div><small>星域 I · 天枢 · 家园</small><b>四季实验室 · 为什么会有四季?</b></div><span class="ml-st"></span><button class="ml-x" type="button" aria-label="关闭">✕</button></header>' +
      '<div class="ml-body"><div class="ml-pane ml-space"><div class="ml-cap">公转沙盘 · 拖动转换视角</div><canvas class="ml-cv3"></canvas>' +
      '<div class="ml-note">日期、距离、倾角按真实计算 · 地球和太阳的大小、距离未按比例</div></div>' +
      '<div class="ml-pane sea-r"><div class="ml-cap"><span class="sea-view">站在北京,朝南看太阳</span></div><div class="sea-cvw"><canvas class="sea-cv" width="420" height="380"></canvas></div>' +
      '<div class="sea-info"><span><small>正午太阳高度</small><b class="sea-alt"></b></span><span><small>白天长度</small><b class="sea-day"></b></span><span><small>日地距离</small><b class="sea-dist"></b></span><span><small>季节</small><b class="sea-sea"></b></span></div></div></div>' +
      '<div class="ml-ctl sea-ctl"><button class="ml-play" type="button">▶ 播放</button><label>日期<input class="ml-rng sea-doy" type="range" min="0" max="364.75" step="0.25"></label><span class="sea-md"></span>' +
      '<label class="sea-l2">城市<select class="sea-city"></select></label><label class="sea-l2">地轴倾角<input class="ml-rng sea-tilt" type="range" min="0" max="45" step="0.5"></label><span class="sea-tv"></span><button class="ml-now" type="button">回到今天</button></div>' +
      '<div class="ml-guide"><div class="ml-q"></div><div class="ml-ch"></div><div class="ml-gb"><button class="ml-hint" type="button">给我一点提示</button><span class="ml-hs"></span></div></div>';
    document.body.appendChild(r);
    ['st', 'x', 'cv3', 'play', 'now', 'q', 'ch', 'hint', 'hs'].forEach(function (k) { U[k] = r.querySelector('.ml-' + k); });
    ['cv', 'view', 'alt', 'day', 'dist', 'sea', 'doy', 'md', 'city', 'tilt', 'tv'].forEach(function (k) { U[k] = r.querySelector('.sea-' + k); });
    CITIES.forEach(function (c) { var o = h('option', '', c[0] + '(' + (c[1] >= 0 ? '北纬 ' : '南纬 ') + Math.abs(c[1]) + '°)'); o.value = c[1]; U.city.appendChild(o); });
    U.x.onclick = function () { if (SH.exit && L.api) SH.exit(); else close(); };
    U.play.onclick = function () { L.play = !L.play; U.play.textContent = L.play ? '❚❚ 暂停' : '▶ 播放'; };
    U.doy.oninput = function () { L.doy = +U.doy.value; stop(); upd(); };
    U.tilt.oninput = function () { L.tilt = +U.tilt.value; upd(); };
    U.city.onchange = function () { L.lat = +U.city.value; P('click'); upd(); };
    U.now.onclick = function () { setNow(); P('click'); };
    U.hint.onclick = hint;
  }
  function stop() { L.play = false; if (U.play) U.play.textContent = '▶ 播放'; }
  function cityName() { for (var i = 0; i < CITIES.length; i++) if (Math.abs(CITIES[i][1] - L.lat) < 0.01) return CITIES[i][0]; return '这里'; }

  /* ---------- 3D 公转沙盘 ---------- */
  var RO = 6, RE = 0.75;
  function lamToPos(lam, T, v, rr) {   // 地球日心黄经 = 太阳视黄经 + 180°;黄道面 = xz 平面
    var t = (lam + 180) * D2R, R = RO * (rr || 1); return v.set(Math.cos(t) * R, 0, -Math.sin(t) * R);
  }
  function label(T, txt, col, w) {
    var c = document.createElement('canvas'); c.width = 256; c.height = 64; var g = c.getContext('2d');
    g.font = '600 30px "Noto Sans SC","PingFang SC",sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.shadowColor = col; g.shadowBlur = 10; g.fillStyle = col; g.fillText(txt, 128, 32);
    var s = new T.Sprite(new T.SpriteMaterial({ map: new T.CanvasTexture(c), depthWrite: false, transparent: true })); s.scale.set(w || 1.6, (w || 1.6) / 4, 1); return s;
  }
  function initGL() {
    var T = window.THREE, cv = U.cv3;
    var rd = new T.WebGLRenderer({ canvas: cv, antialias: true, alpha: true }); rd.setPixelRatio(Math.min(innerWidth < 900 ? 1.5 : 2, devicePixelRatio || 1)); rd.outputEncoding = T.sRGBEncoding;
    var sc = new T.Scene(), cam = new T.PerspectiveCamera(38, 1, 0.1, 400);
    var pl = new T.PointLight(0xfff2dc, 2.6, 0, 0); sc.add(pl); sc.add(new T.AmbientLight(0x2a3a5c, 0.32));
    var sun = new T.Mesh(new T.SphereGeometry(1.25, 48, 28), new T.MeshBasicMaterial({ color: 0xffd27a })); sc.add(sun);
    var gc = document.createElement('canvas'); gc.width = gc.height = 128; var gg = gc.getContext('2d'), gr = gg.createRadialGradient(64, 64, 6, 64, 64, 64);
    gr.addColorStop(0, 'rgba(255,226,150,0.95)'); gr.addColorStop(0.4, 'rgba(255,190,90,0.35)'); gr.addColorStop(1, 'rgba(255,170,70,0)'); gg.fillStyle = gr; gg.fillRect(0, 0, 128, 128);
    var glow = new T.Sprite(new T.SpriteMaterial({ map: new T.CanvasTexture(gc), blending: T.AdditiveBlending, depthWrite: false })); glow.scale.setScalar(6.5); sc.add(glow);
    // 轨道(按真实偏心率 0.0167,肉眼几乎是圆)+ 黄道面
    var op = []; for (var k = 0; k <= 180; k++) { var s0 = sunAt(k / 180 * NDAYS); op.push(lamToPos(s0.lam, T, new T.Vector3(), s0.r)); }
    sc.add(new T.Line(new T.BufferGeometry().setFromPoints(op), new T.LineBasicMaterial({ color: 0xd6b25e, transparent: true, opacity: 0.7 })));
    var disc = new T.Mesh(new T.RingGeometry(1.6, RO * 1.08, 96), new T.MeshBasicMaterial({ color: 0xd6b25e, transparent: true, opacity: 0.05, side: T.DoubleSide, depthWrite: false }));
    disc.rotation.x = -Math.PI / 2; sc.add(disc);
    // 二分二至标记
    keyDays().forEach(function (kd) {
      var s0 = sunAt(kd.doy), p = lamToPos(s0.lam, T, new T.Vector3(), s0.r);
      var dot = new T.Mesh(new T.SphereGeometry(0.07, 10, 8), new T.MeshBasicMaterial({ color: new T.Color(kd.c) })); dot.position.copy(p); sc.add(dot);
      var lb = label(T, kd.zh + ' ' + mdOf(kd.doy).replace(/ /g, ''), kd.c, 2.3); lb.position.copy(p).multiplyScalar(1.17); lb.position.y = 0.35; sc.add(lb);
    });
    // 地球:组(地轴方向固定)→ 自转球 + 纬度圈 + 地轴
    var eg = new T.Group(); sc.add(eg);
    var tilt = new T.Group(); eg.add(tilt);
    var mat = new T.MeshLambertMaterial({ color: 0xffffff });
    try { if (window.LE && LE.assets && LE.config) { mat.map = LE.assets.texture(LE.config.TEX.earthDay, true); mat.needsUpdate = true; } } catch (e) { mat.color.setHex(0x2c6fd6); }
    var earth = new T.Mesh(new T.SphereGeometry(RE, 64, 40), mat); tilt.add(earth);
    var ax = new T.Mesh(new T.CylinderGeometry(0.018, 0.018, RE * 3.2, 8), new T.MeshBasicMaterial({ color: 0x7fe8ff })); tilt.add(ax);
    var npl = label(T, '北', '#7fe8ff', 0.9); npl.position.y = RE * 1.85; tilt.add(npl);
    var lc = []; for (var q = 0; q <= 96; q++) lc.push(new T.Vector3());
    var latRing = new T.Line(new T.BufferGeometry().setFromPoints(lc), new T.LineBasicMaterial({ color: 0xffd27a })); tilt.add(latRing);
    var eq = []; for (var q2 = 0; q2 <= 96; q2++) { var a2 = q2 / 96 * 6.2832; eq.push(new T.Vector3(Math.cos(a2) * RE * 1.004, 0, Math.sin(a2) * RE * 1.004)); }
    tilt.add(new T.Line(new T.BufferGeometry().setFromPoints(eq), new T.LineBasicMaterial({ color: 0x9fb3cc, transparent: true, opacity: 0.45 })));
    // 北极星方向(地轴延长线指向)
    var pol = label(T, '→ 北极星', '#cfe0ff', 1.8); sc.add(pol);
    // 阳光:从太阳射向地球的光束
    var beam = new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(), new T.Vector3()]), new T.LineDashedMaterial({ color: 0xffd27a, dashSize: 0.25, gapSize: 0.15, transparent: true, opacity: 0.6 })); sc.add(beam);
    var sp = []; for (var s = 0; s < 900; s++) { var v = new T.Vector3().randomDirection().multiplyScalar(150); sp.push(v.x, v.y, v.z); }
    var sg = new T.BufferGeometry(); sg.setAttribute('position', new T.Float32BufferAttribute(sp, 3)); sc.add(new T.Points(sg, new T.PointsMaterial({ color: 0xaab8d0, size: 0.35 })));
    G = { T: T, rd: rd, sc: sc, cam: cam, eg: eg, tilt: tilt, earth: earth, latRing: latRing, pol: pol, beam: beam, v: new T.Vector3(), yaw: -1.05, pitch: 0.42, drag: null };
    cv.addEventListener('pointerdown', function (e) { G.drag = { x: e.clientX, y: e.clientY, a: G.yaw, b: G.pitch }; cv.setPointerCapture(e.pointerId); });
    cv.addEventListener('pointermove', function (e) { if (!G.drag) return; G.yaw = G.drag.a + (e.clientX - G.drag.x) * 0.006; G.pitch = Math.max(0.05, Math.min(1.35, G.drag.b + (e.clientY - G.drag.y) * 0.004)); place(); });
    cv.addEventListener('pointerup', function () { G.drag = null; });
    resize();
  }
  function place() {
    if (!G) return; var d = 17 / Math.min(1, G.cam.aspect * 0.75);
    G.cam.position.set(Math.sin(G.yaw) * Math.cos(G.pitch) * d, Math.sin(G.pitch) * d, Math.cos(G.yaw) * Math.cos(G.pitch) * d); G.cam.lookAt(0, -0.4, 0);
  }
  function resize() {
    if (!G) return; var b = U.cv3.parentNode.getBoundingClientRect(), w = Math.max(200, b.width), hh = Math.max(200, b.height);
    G.rd.setSize(w, hh, false); U.cv3.style.width = w + 'px'; U.cv3.style.height = hh + 'px'; G.cam.aspect = w / hh; G.cam.updateProjectionMatrix(); place();
  }
  function upd3(s) {
    if (!G) return; var T = G.T;
    lamToPos(s.lam, T, G.eg.position, s.r);
    // 地轴:在太空中方向固定,北端在夏至(太阳黄经 90°)时朝向太阳 → 指向 -x̂… 由 lamToPos 推得指向 (0, cosε, -sinε)
    var e = L.tilt * D2R, pole = new T.Vector3(0, Math.cos(e), -Math.sin(e));
    G.tilt.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), pole);
    var f = L.lat * D2R, pts = G.latRing.geometry.attributes.position, rr = RE * 1.01 * Math.cos(f), yy = RE * 1.01 * Math.sin(f);
    for (var k = 0; k <= 96; k++) { var a = k / 96 * 6.2832; pts.setXYZ(k, Math.cos(a) * rr, yy, Math.sin(a) * rr); }
    pts.needsUpdate = true;
    G.pol.position.copy(G.eg.position).addScaledVector(pole, RE * 2.6); G.pol.position.x += 0.5;
    var bp = G.beam.geometry.attributes.position, dir = G.eg.position.clone().normalize();
    bp.setXYZ(0, dir.x * 1.6, 0, dir.z * 1.6); bp.setXYZ(1, G.eg.position.x - dir.x * RE * 1.05, 0, G.eg.position.z - dir.z * RE * 1.05); bp.needsUpdate = true; G.beam.computeLineDistances();
  }

  /* ---------- 2D:地面视角 + 一年昼长曲线 ---------- */
  function drawGround(dec) {
    var c = U.cv, g = c.getContext('2d'), W = c.width, H = c.height, south = L.lat >= 0;
    var top = 18, hz = H * 0.6, x0 = 26, x1 = W - 14;
    g.clearRect(0, 0, W, H);
    var sky = g.createLinearGradient(0, top, 0, hz); sky.addColorStop(0, 'rgba(30,70,130,0.55)'); sky.addColorStop(1, 'rgba(90,140,200,0.25)'); g.fillStyle = sky; g.fillRect(x0, top, x1 - x0, hz - top);
    g.fillStyle = 'rgba(40,50,46,0.55)'; g.fillRect(x0, hz, x1 - x0, 6);
    // 方位:朝南(南半球朝北)看,左东右西 → x 映射:方位 az,中心为 180°(或 0°)
    var cen = south ? 180 : 0;
    function X(az) { var d = ((az - cen + 540) % 360) - 180; return x0 + (x1 - x0) * (0.5 + d / 360); }
    function Y(alt) { return hz - (hz - top) * alt / 90; }
    g.strokeStyle = 'rgba(255,255,255,0.12)'; g.lineWidth = 1; g.font = '11px sans-serif'; g.fillStyle = 'rgba(200,214,240,0.7)';
    [30, 60].forEach(function (a) { g.beginPath(); g.moveTo(x0, Y(a)); g.lineTo(x1, Y(a)); g.stroke(); g.fillText(a + '°', 2, Y(a) + 4); });
    var dirs = south ? [['东', 90], ['南', 180], ['西', 270]] : [['东', 90], ['北', 0], ['西', 270]];
    dirs.forEach(function (d) { g.fillText(d[0], X(d[1]) - 6, hz + 20); });
    function path(dc, col, wdt, dash) {
      g.strokeStyle = col; g.lineWidth = wdt; g.setLineDash(dash || []); g.beginPath(); var on = false, px = 0;
      for (var Hh = -180; Hh <= 180; Hh += 2) {
        var p = altAz(L.lat, dc, Hh), x = X(p.az), y = Y(Math.max(-3, p.alt));
        if (p.alt < -2 || (on && Math.abs(x - px) > (x1 - x0) / 2)) { on = false; continue; }
        if (!on) { g.moveTo(x, y); on = true; } else g.lineTo(x, y); px = x;
      }
      g.stroke(); g.setLineDash([]);
    }
    var KD = keyDays();
    [[KD[1], '夏至'], [KD[0], '春秋分'], [KD[3], '冬至']].forEach(function (k) { path(decl(sunAt(k[0].doy).lam, L.tilt), k[0].c + '88', 1.2, [5, 4]); var na = noonAlt(L.lat, decl(sunAt(k[0].doy).lam, L.tilt)); if (na > 0 && (L.tilt >= 1 || k[1] === '春秋分')) { g.fillStyle = k[0].c; g.fillText(k[1], X(cen) + 6, Y(Math.min(88, na)) - 4); } });
    path(dec, '#ffe08a', 2.6);
    var na = noonAlt(L.lat, dec);
    if (na > 0) { var sx = X(cen), sy = Y(Math.min(90, na)); var sg2 = g.createRadialGradient(sx, sy, 2, sx, sy, 16); sg2.addColorStop(0, '#fff6d0'); sg2.addColorStop(0.4, 'rgba(255,214,110,0.8)'); sg2.addColorStop(1, 'rgba(255,200,90,0)'); g.fillStyle = sg2; g.beginPath(); g.arc(sx, sy, 16, 0, 7); g.fill(); }
    // 立杆影子(正午)
    var px0 = x0 + 34, py0 = hz + 2; g.strokeStyle = '#d9e6f5'; g.lineWidth = 2; g.beginPath(); g.moveTo(px0, py0); g.lineTo(px0, py0 - 22); g.stroke();
    if (na > 0.5) { var sl = Math.min(140, 22 / Math.tan(na * D2R)); g.strokeStyle = 'rgba(10,14,24,0.85)'; g.lineWidth = 4; g.beginPath(); g.moveTo(px0, py0 + 1); g.lineTo(px0 + sl, py0 + 1); g.stroke(); }
    g.fillStyle = 'rgba(200,214,240,0.65)'; g.fillText('正午影子', px0 - 22, py0 + 34);
    // 一年昼长曲线
    var cy0 = H - 8, ch = H - hz - 46, cx0 = x0 + 110, cx1 = x1;
    g.strokeStyle = 'rgba(255,255,255,0.15)'; g.lineWidth = 1; g.beginPath(); g.moveTo(cx0, cy0 - ch / 2); g.lineTo(cx1, cy0 - ch / 2); g.stroke();
    g.fillStyle = 'rgba(200,214,240,0.65)'; g.fillText('一年的白天长度', cx0, cy0 - ch - 4); g.fillText('12 时', cx1 - 34, cy0 - ch / 2 - 3);
    g.strokeStyle = '#7fe3c4'; g.lineWidth = 1.8; g.beginPath();
    for (var k = 0; k <= 73; k++) { var dd = k / 73 * NDAYS, dl = dayLen(L.lat, decl(sunAt(dd).lam, L.tilt)), x = cx0 + (cx1 - cx0) * k / 73, y = cy0 - ch * dl / 24; if (k) g.lineTo(x, y); else g.moveTo(x, y); }
    g.stroke();
    var mx = cx0 + (cx1 - cx0) * L.doy / NDAYS, my = cy0 - ch * dayLen(L.lat, dec) / 24; g.fillStyle = '#ffe08a'; g.beginPath(); g.arc(mx, my, 4, 0, 7); g.fill();
  }

  function season(dec) {
    if (L.tilt < 1) return '无四季';
    var lam = sunAt(L.doy).lam, n = lam < 90 ? '春' : lam < 180 ? '夏' : lam < 270 ? '秋' : '冬', m = { '春': '秋', '夏': '冬', '秋': '春', '冬': '夏' };
    if (Math.abs(L.lat) < 10) return '热带 · 少有四季';
    return L.lat >= 0 ? '北半球 ' + n : '南半球 ' + m[n];
  }
  function upd() {
    var s = sunAt(L.doy), dec = decl(s.lam, L.tilt), na = noonAlt(L.lat, dec), dl = dayLen(L.lat, dec);
    U.doy.value = L.doy; U.md.textContent = mdOf(L.doy); U.tilt.value = L.tilt; U.tv.textContent = L.tilt.toFixed(1) + '°';
    U.city.value = String(L.lat);
    U.view.textContent = '站在' + cityName() + ',朝' + (L.lat >= 0 ? '南' : '北') + '看太阳';
    U.alt.textContent = na > 0 ? na.toFixed(1) + '°' : '太阳不升起';
    U.day.textContent = Math.floor(dl) + ' 时 ' + Math.round((dl % 1) * 60) + ' 分';
    U.dist.textContent = (s.r * AU / 1e8).toFixed(3) + ' 亿 km';
    U.sea.textContent = season(dec);
    upd3(s); drawGround(dec);
  }
  function setNow() {
    var now = new Date(), d0 = (now.getTime() - Date.UTC(now.getUTCFullYear(), 0, 1)) / 86400000;
    L.doy = Math.max(0, Math.min(364.75, Math.round(d0 * 4) / 4)); stop(); upd();
  }

  /* ---------- 向导 ---------- */
  function stars() { var p = SH.progress, n = 0; if (p) for (var i = 1; i <= 3; i++) n += p.stars('seasons', i); U.st.textContent = '★ ' + n + ' / 9'; }
  function showQ() {
    stars(); L.hints = 0; L.done = false; U.hs.textContent = ''; U.ch.innerHTML = ''; U.hint.hidden = false;
    var Q = QS[L.n - 1]; U.q.innerHTML = '<small>第 ' + L.n + ' / 3 关 · ' + Q.title + '</small>' + Q.q;
    if (Q.kind === 'choice') Q.ch.forEach(function (t, i) { var b = h('button', 'ml-c', t); b.type = 'button'; b.onclick = function () { answer(i === Q.ok, b); }; U.ch.appendChild(b); });
    else { var b = h('button', 'ml-c ml-c--go', '就是这一天'); b.type = 'button'; b.onclick = function () { answer(Q.check(), b); }; U.ch.appendChild(b); }
  }
  function answer(ok, b) {
    var Q = QS[L.n - 1]; if (L.done) return;
    if (!ok) { b.classList.add('no'); P('blip'); U.hs.textContent = Q.kind === 'make' ? '还不是这一天(也确认一下城市是北京、倾角是 23.4°)。再找找,或看一条提示。' : '再想想,也可以看一条提示。'; setTimeout(function () { b.classList.remove('no'); }, 900); return; }
    L.done = true; var got = Math.max(1, 3 - L.hints);
    if (L.api) L.api.done(got, Q.good); P('arrive');
    U.ch.innerHTML = ''; U.hint.hidden = true;
    U.q.innerHTML = '<small>第 ' + L.n + ' 关 · 获得 ' + '★'.repeat(got) + '</small>' + Q.good; stars();
    var nx = h('button', 'ml-c ml-c--go', L.n < 3 ? '下一关 →' : '完成,回到地球'); nx.type = 'button';
    nx.onclick = function () { if (L.n < 3) { if (SH.play) SH.play('seasons', L.n + 1); } else if (SH.exit) SH.exit(); else close(); };
    U.ch.appendChild(nx);
    if (L.n === 3) U.ch.appendChild(h('span', 'ml-hs', '✦ 星桥:生命源码 Life Source · 季节与生物节律(开放后可直达)'));
  }
  function hint() {
    var Q = QS[L.n - 1]; if (!Q || L.hints >= 3) return; P('click');
    U.hs.textContent = ['方向', '线索', '半步示范'][L.hints] + ':' + Q.hint[L.hints]; L.hints++;
    if (L.hints >= 3) U.hint.hidden = true;
  }

  var raf = 0, last = 0;
  function loop(t) {
    raf = requestAnimationFrame(loop); var dt = Math.min(0.1, (t - last) / 1000 || 0); last = t;
    if (document.hidden) return;
    if (L.play) { L.doy += dt * NDAYS / 20; if (L.doy > 364.75) L.doy -= 364.75; upd(); }   // 20 秒一年
    if (G) { G.earth.rotation.y += dt * 0.6; G.rd.render(G.sc, G.cam); }
  }
  function open(n, api) {
    if (!U.root) build();
    L.n = n || 1; L.api = api || null;
    if (L.n === 2) { L.lat = 39.9; L.tilt = EPS0; }
    U.root.hidden = false; document.body.classList.add('ml-on');
    if (!G && window.THREE) try { initGL(); } catch (e) { console.warn('[seasons] WebGL 失败', e); }
    resize(); if (L.n === 1) { L.tilt = EPS0; L.lat = 39.9; } setNow(); showQ();
    cancelAnimationFrame(raf); raf = requestAnimationFrame(loop); P('open');
  }
  function close(silent) { if (!U.root || U.root.hidden) return; U.root.hidden = true; stop(); document.body.classList.remove('ml-on'); cancelAnimationFrame(raf); if (!silent) P('close'); }
  addEventListener('resize', function () { if (U.root && !U.root.hidden) resize(); });

  /* ---------- 注册到任务框架 ---------- */
  SH.levels = SH.levels || {};
  SH.levels.seasons = QS.map(function (Q, i) {
    return { title: Q.title, ask: Q.q, guide: 'tianshu', hints: Q.hint,
      mount: function (api) { open(i + 1, api); api.onLeave(function () { close(true); }); } };
  });
  SH.seasonsLab = { open: function () { var p = SH.progress, n = 1; if (p) for (var i = 1; i <= 3; i++) { if (p.stars('seasons', i) < 1) { n = i; break; } if (i === 3) n = 1; } if (SH.play) SH.play('seasons', n); else open(n); }, close: close, _L: L, _upd: function () { upd(); } };
})();
