/* 天枢 Starhelm · 星域 I「家园」· 任务 sh.quakes「地震在告诉我们什么?」(M2 #5)
 * 数据:sh-quakes-data.js(USGS 近一年 M5+ 快照 + PB2002 板块边界,按需加载);「近 7 天」实时取 USGS 4.5_week,失败用快照。
 * 3D:地球 + 震中点(大小=震级,颜色=深度)+ 板块边界;「透视深度」把地球变半透明,震源按真实深度(放大 3 倍)画在地下。
 * 向导 3 关,三级提示,最少 1 星;进度走任务框架 gn:sh:quakes。 */
(function () {
  'use strict';
  var SH = window.SH = window.SH || {};
  var DEX = 3, LIVE = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_week.geojson';
  function h(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function P(n) { if (window.LE && LE.audio) LE.audio.play(n); }
  function fmt(n) { return Math.round(n).toLocaleString('en-US'); }

  var L = { n: 1, api: null, hints: 0, done: false, mode: 'year', plates: false, deep: false, live: null, liveSrc: '' };
  var D = null;
  var VIEWS = { '全球': [15, 150, 3.6], '环太平洋': [5, -170, 3.9], '南美西岸': [-22, -66, 2.3], '日本': [36, 140, 2.3] };

  function cntMag(ev) { var c = { 5: 0, 6: 0, 7: 0, 8: 0 }; ev.forEach(function (e) { var m = Math.min(8, Math.floor(e[3])); if (m >= 5) c[m]++; }); return c; }
  function maxDepth(ev) { return ev.reduce(function (m, e) { return Math.max(m, e[2]); }, 0); }
  var QS = [
    { title: '地震在哪里?',
      q: function () { return '这是过去一年全世界 5 级以上的 ' + fmt(D.ev.length) + ' 次地震。转动地球看一看:它们是怎么分布的?'; },
      ch: ['连成长长的带子,很多绕着太平洋一圈', '均匀地撒在地球各处', '大多在大陆的正中间'], ok: 0,
      hint: ['拖动地球转一圈,特别留意太平洋的四周。', '打开「板块边界」开关:这些点和线是什么关系?', '地震集中在板块的交界处,太平洋四周这一圈叫「环太平洋地震带」。'],
      good: function () { return '对!地震几乎都排在板块的交界线上。环绕太平洋的这一圈叫环太平洋地震带,全世界大部分地震都发生在这里。地球的外壳像一只碎成十几块的蛋壳,碎片之间互相挤压、错动,就会发生地震。'; } },
    { title: '越往里越深',
      q: '打开「透视深度」,再点「南美西岸」。从海边往大陆里面走,地震是越来越深,还是越来越浅?',
      ch: ['越来越深', '越来越浅', '深浅都差不多'], ok: 0,
      hint: ['看颜色:红色是浅的(<70 km),黄色是中等深度,蓝色是很深的(≥300 km)。', '从海岸线往东(往大陆里面)看,点的颜色是怎么变的?它们在地下排成了什么样子?', '海洋板块在这里斜着插到大陆板块下面,地震就沿着这块往下沉的板块,一路变深。'],
      good: function () { return '没错!太平洋一侧的纳斯卡板块正斜着俯冲到南美洲板块下面,地震沿着这块下沉的板块越来越深。这一年里最深的一次约在地下 ' + fmt(maxDepth(D.ev)) + ' km。日本下面也是同样的故事。'; } },
    { title: '大地震多,还是小地震多?',
      q: '看右边的柱状图:一年里 5 级、6 级、7 级地震各发生了多少次?你发现了什么规律?',
      ch: ['每大 1 级,次数大约少 10 倍', '每一级的次数都差不多', '震级越大,次数越多'], ok: 0,
      hint: ['先读出 5 级、6 级、7 级三根柱子上的数字。', function () { var c = cntMag(D.ev); return '5 级 ' + fmt(c[5]) + ' 次,6 级 ' + fmt(c[6]) + ' 次:前一个大约是后一个的几倍?'; }, '用 5 级的次数除以 6 级的次数,再用 6 级除以 7 级,两个结果都接近同一个数。'],
      good: function () { var c = cntMag(D.ev); return '对!一年里 5 级 ' + fmt(c[5]) + ' 次、6 级 ' + fmt(c[6]) + ' 次、7 级以上 ' + fmt(c[7] + c[8]) + ' 次,每大 1 级大约少 10 倍。可每大 1 级,释放的能量约是 32 倍:一次 7 级地震的能量约等于 1,000 次 5 级地震。'; } }
  ];

  function loadData(cb) {
    if (window.SH_QK && window.SH_QK.ev) return cb();
    var s = document.createElement('script'); s.src = 'sh-quakes-data.js'; s.onload = function () { cb(); }; s.onerror = function () { cb(new Error('load')); }; document.head.appendChild(s);
  }
  function fetchLive() {
    if (L.live) return;
    var done = false, to = setTimeout(function () { if (!done) { done = true; useSnapWeek(); } }, 7000);
    fetch(LIVE).then(function (r) { return r.json(); }).then(function (j) {
      if (done) return; done = true; clearTimeout(to); var now = Date.now();
      L.live = j.features.filter(function (f) { return f.properties.type === 'earthquake'; }).map(function (f) { var c = f.geometry.coordinates; return [c[1], c[0], Math.round(c[2]), f.properties.mag, (now - f.properties.time) / 86400000, f.properties.place]; });
      L.liveSrc = '实时 USGS · M4.5+'; if (L.mode === 'week') { rebuildPts(); syncUI(); }
    }).catch(function () { if (!done) { done = true; clearTimeout(to); useSnapWeek(); } });
  }
  function useSnapWeek() { L.live = D.ev.filter(function (e) { return e[4] <= 7; }); L.liveSrc = '离线快照 · 截至 2026-10-22 的 7 天 · M5+'; if (L.mode === 'week') { rebuildPts(); syncUI(); } }
  function curEv() { return L.mode === 'week' ? (L.live || []) : D.ev; }

  /* ---------- 界面 ---------- */
  var U = {}, G = null;
  function build() {
    var r = U.root = h('section', 'ml ml--qk');
    r.innerHTML =
      '<header class="ml-hd"><div><small>星域 I · 天枢 · 家园</small><b>地震实验室 · 地震在告诉我们什么?</b></div><span class="ml-st"></span><button class="ml-x" type="button" aria-label="关闭">✕</button></header>' +
      '<div class="ml-body"><div class="ml-pane ml-space"><div class="ml-cap"><span class="qk-cap"></span></div><canvas class="ml-cv3"></canvas><div class="qk-load">正在加载地震数据…</div>' +
      '<div class="qk-leg"><i style="--c:#ff4d5e"></i>浅 <70 km <i style="--c:#ffc94d"></i>中 70–300 km <i style="--c:#5aa8ff"></i>深 ≥300 km · 圆点越大震级越高</div>' +
      '<div class="ml-note qk-note">震中位置、深度、震级均为 USGS 实测 · 地球与板块按真实比例</div></div>' +
      '<div class="ml-pane qk-r"><div class="qk-tiles"></div><canvas class="qk-cv" width="440" height="190"></canvas><div class="qk-dep"></div><div class="qk-src">数据:USGS 地震灾害计划;板块边界 PB2002(Bird, 2003),Ahlenius/Nordpil 数字化,ODC-By · 不代表任何机构背书</div></div></div>' +
      '<div class="ml-ctl qk-ctl"><span class="qk-md"></span><span class="qk-tg"></span><span class="qk-vw"></span></div>' +
      '<div class="ml-guide"><div class="ml-q"></div><div class="ml-ch"></div><div class="ml-gb"><button class="ml-hint" type="button">给我一点提示</button><span class="ml-hs"></span></div></div>';
    document.body.appendChild(r);
    ['st', 'x', 'cv3', 'q', 'ch', 'hint', 'hs'].forEach(function (k) { U[k] = r.querySelector('.ml-' + k); });
    ['cap', 'load', 'tiles', 'cv', 'dep', 'md', 'tg', 'vw', 'note'].forEach(function (k) { U[k] = r.querySelector('.qk-' + k); });
    [['year', '近一年 · 5 级以上'], ['week', '近 7 天']].forEach(function (m) {
      var b = h('button', 'qk-b', m[1]); b.type = 'button'; b.dataset.m = m[0]; b.onclick = function () { L.mode = m[0]; P('click'); if (m[0] === 'week') fetchLive(); rebuildPts(); syncUI(); }; U.md.appendChild(b);
    });
    [['plates', '板块边界'], ['deep', '透视深度']].forEach(function (m) {
      var b = h('button', 'qk-b qk-t', m[1]); b.type = 'button'; b.dataset.t = m[0]; b.onclick = function () { L[m[0]] = !L[m[0]]; P('click'); applyToggles(); syncUI(); }; U.tg.appendChild(b);
    });
    Object.keys(VIEWS).forEach(function (k) { var b = h('button', 'qk-b qk-v', k); b.type = 'button'; b.onclick = function () { flyTo(k); P('click'); }; U.vw.appendChild(b); });
    U.x.onclick = function () { if (SH.exit && L.api) SH.exit(); else close(); };
    U.hint.onclick = hint;
  }

  /* ---------- 3D ---------- */
  function v3(lat, lon, r) { var a = lat * Math.PI / 180, b = lon * Math.PI / 180; return [r * Math.cos(a) * Math.cos(b), r * Math.sin(a), -r * Math.cos(a) * Math.sin(b)]; }
  var VS = 'attribute vec3 aC; attribute float aS; uniform float uPx; varying vec3 vC; void main(){ vC=aC; vec4 mv=modelViewMatrix*vec4(position,1.0); gl_Position=projectionMatrix*mv; gl_PointSize=aS*uPx*(3.6/max(1.5,-mv.z)); }';
  var FS = 'varying vec3 vC; void main(){ vec2 d=gl_PointCoord-0.5; float r=dot(d,d); if(r>0.25) discard; float ring=smoothstep(0.25,0.16,r); gl_FragColor=vec4(vC*(1.15-r*1.6), ring*0.9); }';
  function depthCol(d) { return d < 70 ? [1, 0.3, 0.37] : d < 300 ? [1, 0.79, 0.3] : [0.35, 0.66, 1]; }
  function initGL() {
    var T = window.THREE, cv = U.cv3;
    var rd = new T.WebGLRenderer({ canvas: cv, antialias: true, alpha: true }); var pr = Math.min(innerWidth < 900 ? 1.5 : 2, devicePixelRatio || 1); rd.setPixelRatio(pr); rd.outputEncoding = T.sRGBEncoding;
    var sc = new T.Scene(), cam = new T.PerspectiveCamera(40, 1, 0.01, 200);
    sc.add(new T.AmbientLight(0xffffff, 0.75)); var dl = new T.DirectionalLight(0xffffff, 0.5); dl.position.set(3, 2, 4); sc.add(dl);
    var mat = new T.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 1 });
    try { if (window.LE && LE.assets && LE.config) mat.map = LE.assets.texture(LE.config.TEX.earthDay, true); } catch (e) { mat.color.setHex(0x2c6fd6); }
    var earth = new T.Mesh(new T.SphereGeometry(1, 72, 48), mat); earth.renderOrder = 0; sc.add(earth);
    var core = new T.Mesh(new T.SphereGeometry(1 - 720 * DEX / 6371, 48, 32), new T.MeshBasicMaterial({ color: 0x241a14 })); core.visible = false; sc.add(core);
    var sp = []; for (var s = 0; s < 700; s++) { var q = new T.Vector3().randomDirection().multiplyScalar(80); sp.push(q.x, q.y, q.z); }
    var sg = new T.BufferGeometry(); sg.setAttribute('position', new T.Float32BufferAttribute(sp, 3)); sc.add(new T.Points(sg, new T.PointsMaterial({ color: 0x8090a8, size: 0.25 })));
    G = { T: T, rd: rd, sc: sc, cam: cam, earth: earth, core: core, pr: pr, lat: 15, lon: 150, dist: 3.6, to: null, drag: null, pts: null, pb: null };
    cv.addEventListener('pointerdown', function (e) { G.to = null; G.drag = { x: e.clientX, y: e.clientY, a: G.lon, b: G.lat }; cv.setPointerCapture(e.pointerId); });
    cv.addEventListener('pointermove', function (e) { if (!G.drag) return; var k = 0.25 * G.dist / 3.6; G.lon = G.drag.a - (e.clientX - G.drag.x) * k; G.lat = Math.max(-80, Math.min(80, G.drag.b + (e.clientY - G.drag.y) * k)); place(); });
    cv.addEventListener('pointerup', function () { G.drag = null; });
    cv.addEventListener('wheel', function (e) { e.preventDefault(); G.to = null; G.dist = Math.max(1.5, Math.min(8, G.dist * (e.deltaY > 0 ? 1.1 : 0.9))); place(); }, { passive: false });
    resize();
  }
  function rebuildPts() {
    if (!G || !D) return; var T = G.T, ev = curEv(), n = ev.length, pos = new Float32Array(n * 3), col = new Float32Array(n * 3), sz = new Float32Array(n);
    ev.forEach(function (e, i) { var r = L.deep ? 1 - e[2] * DEX / 6371 : 1.004, p = v3(e[0], e[1], r), c = depthCol(e[2]); pos.set(p, i * 3); col.set(c, i * 3); sz[i] = 1.6 + Math.pow(Math.max(0, e[3] - 4), 1.6) * 1.7; });
    if (G.pts) { G.sc.remove(G.pts); G.pts.geometry.dispose(); }
    var g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.setAttribute('aC', new T.BufferAttribute(col, 3)); g.setAttribute('aS', new T.BufferAttribute(sz, 1));
    G.pts = new T.Points(g, new T.ShaderMaterial({ vertexShader: VS, fragmentShader: FS, transparent: true, depthWrite: false, depthTest: true, uniforms: { uPx: { value: G.pr } } }));
    G.pts.renderOrder = 3; G.sc.add(G.pts);
  }
  function initPlates() {
    if (!G || G.pb || !D) return; var T = G.T, arr = [];
    D.pb.forEach(function (s) { for (var i = 0; i + 3 < s.length; i += 2) { if (Math.abs(s[i + 1] - s[i + 3]) > 180) continue; arr.push.apply(arr, v3(s[i], s[i + 1], 1.003)); arr.push.apply(arr, v3(s[i + 2], s[i + 3], 1.003)); } });
    var g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(arr, 3));
    G.pb = new T.LineSegments(g, new T.LineBasicMaterial({ color: 0xffe08a, transparent: true, opacity: 0.85 })); G.pb.renderOrder = 2; G.pb.visible = false; G.sc.add(G.pb);
  }
  function applyToggles() {
    if (!G) return; if (G.pb) G.pb.visible = L.plates;
    G.earth.material.opacity = L.deep ? 0.32 : 1; G.earth.material.depthWrite = !L.deep; G.core.visible = L.deep;
    U.note.textContent = L.deep ? '透视深度:震源按真实深度画在地下(深度放大 3 倍),深色球挡住地球背面' : '震中位置、深度、震级均为 USGS 实测 · 地球与板块按真实比例';
    rebuildPts();
  }
  function flyTo(k) { var v = VIEWS[k]; G.to = { lat: v[0], lon: v[1], dist: v[2] }; }
  function place() { if (!G) return; var d = G.dist / Math.min(1, G.cam.aspect * 0.9), p = v3(G.lat, G.lon, d); G.cam.position.set(p[0], p[1], p[2]); G.cam.lookAt(0, 0, 0); }
  function resize() {
    if (!G) return; var b = U.cv3.parentNode.getBoundingClientRect(), w = Math.max(200, b.width), hh = Math.max(160, b.height);
    G.rd.setSize(w, hh, false); U.cv3.style.width = w + 'px'; U.cv3.style.height = hh + 'px'; G.cam.aspect = w / hh; G.cam.updateProjectionMatrix(); place();
  }

  /* ---------- 右侧 ---------- */
  function drawChart(ev) {
    var c = U.cv, g = c.getContext('2d'), W = c.width, H = c.height, cm = cntMag(ev), ks = [5, 6, 7, 8], mx = Math.max(1, cm[5], cm[6], cm[7], cm[8]);
    g.clearRect(0, 0, W, H); g.font = '12px sans-serif'; g.fillStyle = 'rgba(200,214,240,0.75)'; g.fillText('按震级数一数(' + (L.mode === 'week' ? '近 7 天' : '近一年') + ')', 8, 16);
    var x0 = 30, bw = (W - x0 - 10) / 4, y0 = H - 24, top = 34;
    ks.forEach(function (m, i) {
      var v = cm[m], hh = v ? Math.max(3, (y0 - top) * Math.log10(v + 1) / Math.log10(mx + 1)) : 0, x = x0 + i * bw + bw * 0.18, w = bw * 0.64;
      g.fillStyle = ['#ff7a5a', '#ffb24d', '#ffe08a', '#fff4c4'][i]; g.fillRect(x, y0 - hh, w, hh);
      g.fillStyle = '#f3cf7a'; g.font = 'bold 13px sans-serif'; var t = fmt(v) + ' 次'; g.fillText(t, x + w / 2 - g.measureText(t).width / 2, y0 - hh - 6);
      g.fillStyle = 'rgba(200,214,240,0.8)'; g.font = '12px sans-serif'; var l = m === 8 ? '8 级+' : m + ' 级'; g.fillText(l, x + w / 2 - g.measureText(l).width / 2, H - 7);
    });
    g.fillStyle = 'rgba(200,214,240,0.45)'; g.font = '10px sans-serif'; g.fillText('柱高按对数刻度', W - 82, 16);
  }
  function syncUI() {
    if (!D) return; var ev = curEv(), big = ev.reduce(function (m, e) { return !m || e[3] > m[3] ? e : m; }, null);
    var bigName = big ? (big[5] || (D.big && D.big[String(D.ev.indexOf(big))]) || '') : '';
    var d = [0, 0, 0]; ev.forEach(function (e) { d[e[2] < 70 ? 0 : e[2] < 300 ? 1 : 2]++; });
    U.tiles.innerHTML = '<div><span>地震次数</span><b>' + fmt(ev.length) + '</b></div><div><span>最强一次</span><b>' + (big ? 'M' + big[3].toFixed(1) : '—') + '</b><small>' + U_esc(bigName) + '</small></div>';
    U.dep.innerHTML = '<span>按震源深度</span>' + [['浅', d[0], '#ff4d5e'], ['中', d[1], '#ffc94d'], ['深', d[2], '#5aa8ff']].map(function (x) { return '<em style="--c:' + x[2] + '">' + x[0] + '<b>' + fmt(x[1]) + '</b></em>'; }).join('');
    U.cap.textContent = L.mode === 'week' ? (L.live ? '近 7 天 · ' + L.liveSrc : '近 7 天 · 正在取实时数据…') : '近一年 · USGS 实测 · 2025-10-22 至 2026-10-22 · M5+';
    U.md.querySelectorAll('.qk-b').forEach(function (b) { b.classList.toggle('on', b.dataset.m === L.mode); });
    U.tg.querySelectorAll('.qk-b').forEach(function (b) { b.classList.toggle('on', !!L[b.dataset.t]); });
    drawChart(ev);
  }
  function U_esc(s) { return String(s || '').replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  /* ---------- 向导 ---------- */
  function stars() { var p = SH.progress, n = 0; if (p) for (var i = 1; i <= 3; i++) n += p.stars('quakes', i); U.st.textContent = '★ ' + n + ' / 9'; }
  function showQ() {
    stars(); L.hints = 0; L.done = false; U.hs.textContent = ''; U.ch.innerHTML = ''; U.hint.hidden = false;
    var Q = QS[L.n - 1], q = typeof Q.q === 'function' ? Q.q() : Q.q; U.q.innerHTML = '<small>第 ' + L.n + ' / 3 关 · ' + Q.title + '</small>' + q;
    Q.ch.forEach(function (t, i) { var b = h('button', 'ml-c', t); b.type = 'button'; b.onclick = function () { answer(i === Q.ok, b); }; U.ch.appendChild(b); });
  }
  function answer(ok, b) {
    var Q = QS[L.n - 1]; if (L.done || !D) return;
    if (!ok) { b.classList.add('no'); P('blip'); U.hs.textContent = '再想想,也可以看一条提示。'; setTimeout(function () { b.classList.remove('no'); }, 900); return; }
    L.done = true; var got = Math.max(1, 3 - L.hints), msg = Q.good();
    if (L.api) L.api.done(got, msg); P('arrive');
    U.ch.innerHTML = ''; U.hint.hidden = true;
    U.q.innerHTML = '<small>第 ' + L.n + ' 关 · 获得 ' + '★'.repeat(got) + '</small>' + msg; stars();
    var nx = h('button', 'ml-c ml-c--go', L.n < 3 ? '下一关 →' : '完成,回到地球'); nx.type = 'button';
    nx.onclick = function () { if (L.n < 3) { if (SH.play) SH.play('quakes', L.n + 1); } else if (SH.exit) SH.exit(); else close(); };
    U.ch.appendChild(nx);
    if (L.n === 3) U.ch.appendChild(h('span', 'ml-hs', '✦ 星桥:元素工坊 Element Forge · 岩石与矿物(开放后可直达)'));
  }
  function hint() {
    var Q = QS[L.n - 1]; if (!Q || L.hints >= 3 || !D) return; P('click');
    var t = Q.hint[L.hints]; if (typeof t === 'function') t = t();
    U.hs.textContent = ['方向', '线索', '半步示范'][L.hints] + ':' + t; L.hints++;
    if (L.hints >= 3) U.hint.hidden = true;
  }

  var raf = 0;
  function loop() {
    raf = requestAnimationFrame(loop); if (document.hidden || !G) return;
    if (G.to) {
      var dl = ((G.to.lon - G.lon + 540) % 360) - 180; G.lon += dl * 0.08; G.lat += (G.to.lat - G.lat) * 0.08; G.dist += (G.to.dist - G.dist) * 0.08;
      if (Math.abs(dl) < 0.1 && Math.abs(G.to.lat - G.lat) < 0.1 && Math.abs(G.to.dist - G.dist) < 0.01) G.to = null; place();
    } else if (!G.drag && L.n === 1 && !L.done) { G.lon += 0.04; place(); }
    G.rd.render(G.sc, G.cam);
  }
  function setup(n) {
    L.mode = 'year'; L.plates = false; L.deep = false;
    G && (G.lat = 15, G.lon = 150, G.dist = 3.6, G.to = null);
    applyToggles(); place();
  }
  function open(n, api) {
    if (!U.root) build();
    L.n = n || 1; L.api = api || null;
    U.root.hidden = false; document.body.classList.add('ml-on');
    if (!G && window.THREE) try { initGL(); } catch (e) { console.warn('[quakes] WebGL 失败', e); }
    resize(); U.q.innerHTML = '<small>第 ' + L.n + ' / 3 关</small>正在加载地震数据…'; U.ch.innerHTML = ''; U.hint.hidden = true;
    cancelAnimationFrame(raf); raf = requestAnimationFrame(loop); P('open');
    loadData(function (err) {
      if (err || !window.SH_QK) { U.load.textContent = '地震数据加载失败,请检查网络后重新打开'; return; }
      if (!D) D = { ev: window.SH_QK.ev, pb: window.SH_QK.pb, big: window.SH_QK.big };
      U.load.hidden = true; try { initPlates(); } catch (e) { console.warn('[quakes] 板块失败', e); }
      setup(L.n); syncUI(); showQ();
    });
  }
  function close(silent) { if (!U.root || U.root.hidden) return; U.root.hidden = true; document.body.classList.remove('ml-on'); cancelAnimationFrame(raf); if (!silent) P('close'); }
  addEventListener('resize', function () { if (U.root && !U.root.hidden) resize(); });

  SH.levels = SH.levels || {};
  SH.levels.quakes = QS.map(function (Q, i) {
    return { title: Q.title, ask: typeof Q.q === 'string' ? Q.q : '转动地球,看看过去一年的地震是怎么分布的?', guide: 'tianshu', hints: Q.hint.map(function (x) { return typeof x === 'string' ? x : '看右边的柱状图。'; }),
      mount: function (api) { open(i + 1, api); api.onLeave(function () { close(true); }); } };
  });
  SH.quakesLab = { open: function () { var p = SH.progress, n = 1; if (p) for (var i = 1; i <= 3; i++) if (p.stars('quakes', i) < 1) { n = i; break; } if (SH.play) SH.play('quakes', n); else open(n); }, close: close, _L: L };
})();
