/* 天枢 Starhelm · 星域 I「家园」· 任务 sh.sats「天上到底有多少颗卫星?」(M2 #4)
 * 数据:sh-sats-data.js(CelesTrak GP 活跃卫星 + SATCAT 在轨编目快照,按需加载)。
 * 工作中卫星:真实轨道根数,着色器内解开普勒方程 + J2 节点/近地点进动,GPU 一次画 3.5 万个点。
 * 失效卫星 / 火箭残骸 / 碎片:轨道高度、偏心率、倾角真实(SATCAT 远地点/近地点/倾角),轨道面与位置为示意。
 * 向导 3 关,三级提示,最少 1 星;进度走任务框架 gn:sh:sats。 */
(function () {
  'use strict';
  var SH = window.SH = window.SH || {};
  var RE = 6371, MU = 398600.4418, SID = 86164.0905;
  function h(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function P(n) { if (window.LE && LE.audio) LE.audio.play(n); }
  function fmt(n) { return Math.round(n).toLocaleString('en-US'); }
  function wan(n) { return (n / 10000).toFixed(n >= 100000 ? 0 : 2).replace(/\.?0+$/, '') + ' 万'; }

  var L = { n: 1, api: null, hints: 0, done: false, year: 2026, speed: 60, mask: [1, 0, 0, 0], simT: 0, st: null };
  var D = null;   // { cnt, years, t0ms, starlink, orb:{LEO,MEO,GEO,HEO} }

  var QS = [
    { title: '卫星是从什么时候变多的?',
      q: '1957 年,人类送上了第一颗人造卫星。拖动「时间机器」,同时看右边每年发射的数量:卫星是从哪段时间开始暴涨的?',
      ch: ['2019 年以后', '1960 年代太空竞赛时', '2000 年前后'], ok: 0,
      hint: ['把年份从 1957 慢慢拖到今天,看左边的点和右边的柱子什么时候突然多起来。', '2018 年全世界一年发射多少颗卫星?2025 年呢?点一下柱子旁边的数字比比看。', '2019 年起,大型通信星座开始成批发射,一枚火箭一次能送上去几十颗卫星。'],
      good: function () { return '对!2018 年全年发射约 ' + fmt(D.years['2018'] || 0) + ' 颗,2025 年约 ' + fmt(D.years['2025'] || 0) + ' 颗。现在正在工作的卫星约 ' + wan(D.cnt.active) + ' 颗,其中约 ' + wan(D.starlink) + ' 颗属于星链一个星座。'; } },
    { title: '一动不动的那一圈',
      q: '把时间调到「×600」。离地球很远的那一圈金色卫星,好像一直待在地球的同一侧。为什么?',
      ch: ['它们绕地球一圈正好约 1 天,和地球自转同步', '它们停在太空里,没有在动', '它们太远了,看不出在动'], ok: 0,
      hint: ['盯住那一圈金色的点和它下面的大陆:它们之间的位置变了吗?', '近地卫星大约 90 分钟绕地球一圈。轨道越高,绕一圈就越久。到约 35,786 km 高的地方,一圈要多久?', '正好 23 小时 56 分,和地球自转一样快。所以从地面看,它一直挂在天空的同一个位置。'],
      good: function () { return '没错!这是地球静止轨道,离地面约 35,786 km,绕一圈 23 小时 56 分。气象卫星和电视直播卫星多在这里,地球之眼里的向日葵 9 号云图就是从这条轨道拍的。'; } },
    { title: '天上的「垃圾」有多少?',
      q: '打开「失效卫星」「火箭残骸」「碎片」三个开关。已经不工作的这些东西,和正在工作的卫星比,哪个多?',
      ch: ['不工作的更多', '正在工作的卫星更多', '差不多一样多'], ok: 0,
      hint: ['把四个开关都打开,看右边的数字。', '把失效卫星、火箭残骸、碎片三个数加起来,和工作中的卫星比一比。', function () { return '三项加起来约 ' + wan(D.cnt.dead + D.cnt.rb + D.cnt.deb) + ' 个,比工作中的 ' + wan(D.cnt.active) + ' 颗还多。'; }],
      good: function () { var t = D.cnt.active + D.cnt.dead + D.cnt.rb + D.cnt.deb; return '对。已编目、仍在轨道上的物体约 ' + wan(t) + ' 个,其中约 ' + wan(t - D.cnt.active) + ' 个已经不工作。比 10 厘米更小、追踪不到的碎片还多得多。所以新卫星要在寿命结束时主动降低轨道,让大气层把它烧掉。'; } }
  ];

  /* ---------- 数据 ---------- */
  function loadData(cb) {
    if (window.SH_SATS && window.SH_SATS.b64) return cb();
    var s = document.createElement('script'); s.src = 'sh-sats-data.js'; s.onload = function () { cb(); }; s.onerror = function () { cb(new Error('load')); }; document.head.appendChild(s);
  }
  function decode() {
    var M = window.SH_SATS, bin = atob(M.b64), n = M.n, buf = new ArrayBuffer(bin.length), u8 = new Uint8Array(buf);
    for (var k = 0; k < bin.length; k++) u8[k] = bin.charCodeAt(k);
    var dv = new DataView(buf), A = new Float32Array(n * 4), B = new Float32Array(n * 4), sl = 0, orb = { LEO: 0, MEO: 0, GEO: 0, HEO: 0 };
    for (var i = 0; i < n; i++) {
      var o = i * 14, a = dv.getUint16(o, true), e = dv.getUint16(o + 2, true) / 65535;
      A[i * 4] = a; A[i * 4 + 1] = e; A[i * 4 + 2] = dv.getUint16(o + 4, true) / 65535 * Math.PI; A[i * 4 + 3] = dv.getUint16(o + 6, true) / 65535 * 2 * Math.PI;
      var f = dv.getUint8(o + 12), kind = f & 3;
      B[i * 4] = dv.getUint16(o + 8, true) / 65535 * 2 * Math.PI; B[i * 4 + 1] = dv.getUint16(o + 10, true) / 65535 * 2 * Math.PI;
      B[i * 4 + 2] = kind + ((f >> 2) & 1) * 4; B[i * 4 + 3] = 1957 + dv.getUint8(o + 13);
      if (kind === 0) { if (f & 4) sl++; var alt = a - 6378; orb[e > 0.25 ? 'HEO' : alt < 2000 ? 'LEO' : alt > 34000 && alt < 37600 ? 'GEO' : 'MEO']++; }
    }
    var io = M.inorbit;
    D = { A: A, B: B, n: n, cnt: { active: io.active, dead: io.dead, rb: io.rb, deb: io.deb }, years: M.years, t0ms: Date.parse(M.t0), starlink: sl, orb: orb };
  }

  /* ---------- 界面 ---------- */
  var U = {}, G = null;
  var KINDS = [['工作中卫星', '#4de8ff'], ['失效卫星', '#9aa3b2'], ['火箭残骸', '#ff9a4a'], ['碎片', '#ff5a6a']];
  function build() {
    var r = U.root = h('section', 'ml ml--sat');
    r.innerHTML =
      '<header class="ml-hd"><div><small>星域 I · 天枢 · 家园</small><b>卫星星海 · 天上到底有多少颗卫星?</b></div><span class="ml-st"></span><button class="ml-x" type="button" aria-label="关闭">✕</button></header>' +
      '<div class="ml-body"><div class="ml-pane ml-space"><div class="ml-cap"><span class="sat-time"></span></div><canvas class="ml-cv3"></canvas><div class="sat-load">正在加载 3.5 万个轨道…</div>' +
      '<div class="sat-leg"><i style="--c:#8fd0ff"></i>星链 <i style="--c:#4de8ff"></i>近地 <i style="--c:#7dff9a"></i>中轨 <i style="--c:#ffd23f"></i>地球静止 <i style="--c:#d68bff"></i>大椭圆</div>' +
      '<div class="ml-note">工作中卫星按真实轨道推算 · 失效卫星/残骸/碎片的高度与倾角真实,位置为示意 · 地球与轨道同比例</div></div>' +
      '<div class="ml-pane sat-r"><div class="sat-kinds"></div><div class="sat-orb"></div><canvas class="sat-cv" width="440" height="200"></canvas><div class="sat-src">数据:CelesTrak(GP 活跃卫星 + SATCAT 编目),快照 2026-10-22 · 不代表任何机构背书</div></div></div>' +
      '<div class="ml-ctl sat-ctl"><label>时间机器<input class="ml-rng sat-yr" type="range" min="1957" max="2026" step="1"></label><span class="sat-yv"></span>' +
      '<span class="sat-sp"></span><button class="ml-now" type="button">回到此刻</button></div>' +
      '<div class="ml-guide"><div class="ml-q"></div><div class="ml-ch"></div><div class="ml-gb"><button class="ml-hint" type="button">给我一点提示</button><span class="ml-hs"></span></div></div>';
    document.body.appendChild(r);
    ['st', 'x', 'cv3', 'now', 'q', 'ch', 'hint', 'hs'].forEach(function (k) { U[k] = r.querySelector('.ml-' + k); });
    ['time', 'load', 'kinds', 'orb', 'cv', 'yr', 'yv', 'sp'].forEach(function (k) { U[k] = r.querySelector('.sat-' + k); });
    KINDS.forEach(function (k, i) {
      var b = h('button', 'sat-k', '<i style="--c:' + k[1] + '"></i><span>' + k[0] + '</span><b>—</b>'); b.type = 'button'; b.dataset.i = i;
      b.onclick = function () { L.mask[i] = L.mask[i] ? 0 : 1; P('click'); syncUI(); }; U.kinds.appendChild(b);
    });
    [['实时', 1], ['×60', 60], ['×600', 600], ['×3600', 3600]].forEach(function (s) {
      var b = h('button', 'sat-spb', s[0]); b.type = 'button'; b.dataset.v = s[1]; b.onclick = function () { L.speed = s[1]; P('click'); syncUI(); }; U.sp.appendChild(b);
    });
    U.x.onclick = function () { if (SH.exit && L.api) SH.exit(); else close(); };
    U.yr.oninput = function () { L.year = +U.yr.value; syncUI(); };
    U.now.onclick = function () { L.simT = (Date.now() - D.t0ms) / 1000; L.year = 2026; L.speed = 1; P('click'); syncUI(); };
    U.hint.onclick = hint;
  }

  /* ---------- 3D ---------- */
  var VS = [
    'attribute vec4 aA; attribute vec4 aB; uniform float uT; uniform float uYear; uniform vec4 uMask; uniform float uPx; varying vec3 vC; varying float vOn; varying float vA;',
    'const float MU=398600.4418; const float J2=1.08262668e-3; const float RE=6378.137;',
    'void main(){',
    ' float a=aA.x, e=aA.y, inc=aA.z, kind=mod(aB.z,4.0), sl=step(3.5,aB.z);',
    ' float on=step(aB.w,uYear+0.5)*(kind<0.5?uMask.x:kind<1.5?uMask.y:kind<2.5?uMask.z:uMask.w); vOn=on;',
    ' float n=sqrt(MU/(a*a*a)), p=a*(1.0-e*e), k=1.5*n*J2*(RE/p)*(RE/p);',
    ' float t=uT, O=aA.w-k*cos(inc)*t, w=aB.x+k*(2.0-2.5*sin(inc)*sin(inc))*t;',
    ' float M=mod(aB.y+mod(n*t,6.2831853),6.2831853), E=M;',
    ' for(int j=0;j<7;j++){ E=E-(E-e*sin(E)-M)/(1.0-e*cos(E)); }',
    ' float xp=a*(cos(E)-e), yp=a*sqrt(1.0-e*e)*sin(E);',
    ' float cO=cos(O), sO=sin(O), cw=cos(w), sw=sin(w), ci=cos(inc), si=sin(inc);',
    ' vec3 r=vec3((cO*cw-sO*sw*ci)*xp+(-cO*sw-sO*cw*ci)*yp, (sO*cw+cO*sw*ci)*xp+(-sO*sw+cO*cw*ci)*yp, (sw*si)*xp+(cw*si)*yp);',
    ' vec3 pos=vec3(r.x, r.z, -r.y)/6371.0;',
    ' float alt=a-RE;',
    ' vC = kind>0.5 ? (kind<1.5?vec3(.6,.64,.7):kind<2.5?vec3(1.,.6,.29):vec3(1.,.35,.42)) : sl>0.5?vec3(.56,.82,1.):e>0.25?vec3(.84,.55,1.):alt<2000.0?vec3(.3,.91,1.):(alt>34000.0&&alt<37600.0)?vec3(1.,.82,.25):vec3(.49,1.,.6);',
    ' vA = (kind<0.5 && alt<2000.0) ? 0.55 : (kind>2.5 ? 0.6 : 0.9);',
    ' vec4 mv=modelViewMatrix*vec4(pos,1.0); gl_Position=projectionMatrix*mv;',
    ' gl_PointSize = on>0.5 ? uPx*(kind>2.5?1.4:kind>0.5?1.8:(alt>2000.0?3.2:1.6)) : 0.0;',
    ' if(on<0.5) gl_Position=vec4(2.,2.,2.,1.);',
    '}'].join('\n');
  var FS = 'varying vec3 vC; varying float vOn; varying float vA; void main(){ vec2 d=gl_PointCoord-0.5; float r=dot(d,d); if(r>0.25) discard; gl_FragColor=vec4(vC*(1.2-r*3.0), (1.0-r*4.0)*vA); }';
  function initGL() {
    var T = window.THREE, cv = U.cv3;
    var rd = new T.WebGLRenderer({ canvas: cv, antialias: true, alpha: true }); var pr = Math.min(innerWidth < 900 ? 1.5 : 2, devicePixelRatio || 1); rd.setPixelRatio(pr); rd.outputEncoding = T.sRGBEncoding;
    var sc = new T.Scene(), cam = new T.PerspectiveCamera(40, 1, 0.05, 500);
    var sunL = new T.DirectionalLight(0xfff4e0, 1.6); sc.add(sunL); sc.add(new T.AmbientLight(0x33445e, 0.45));
    var mat = new T.MeshLambertMaterial({ color: 0xffffff });
    try { if (window.LE && LE.assets && LE.config) mat.map = LE.assets.texture(LE.config.TEX.earthDay, true); } catch (e) { mat.color.setHex(0x2c6fd6); }
    var earth = new T.Mesh(new T.SphereGeometry(1, 64, 40), mat); sc.add(earth);
    var atm = new T.Mesh(new T.SphereGeometry(1.025, 48, 32), new T.MeshBasicMaterial({ color: 0x5fb4ff, transparent: true, opacity: 0.12, side: T.BackSide, depthWrite: false })); sc.add(atm);
    var geo = []; for (var q = 0; q <= 128; q++) { var t = q / 128 * 6.2832; geo.push(new T.Vector3(Math.cos(t) * 6.62, 0, Math.sin(t) * 6.62)); }
    sc.add(new T.Line(new T.BufferGeometry().setFromPoints(geo), new T.LineDashedMaterial({ color: 0xffd23f, transparent: true, opacity: 0.25, dashSize: 0.2, gapSize: 0.2 })).computeLineDistances());
    var sp = []; for (var s = 0; s < 900; s++) { var v = new T.Vector3().randomDirection().multiplyScalar(200); sp.push(v.x, v.y, v.z); }
    var sg = new T.BufferGeometry(); sg.setAttribute('position', new T.Float32BufferAttribute(sp, 3)); sc.add(new T.Points(sg, new T.PointsMaterial({ color: 0x8090a8, size: 0.5 })));
    G = { T: T, rd: rd, sc: sc, cam: cam, earth: earth, sunL: sunL, pr: pr, yaw: 0.6, pitch: 0.35, dist: 15, drag: null, pts: null };
    cv.addEventListener('pointerdown', function (e) { G.drag = { x: e.clientX, y: e.clientY, a: G.yaw, b: G.pitch }; cv.setPointerCapture(e.pointerId); });
    cv.addEventListener('pointermove', function (e) { if (!G.drag) return; G.yaw = G.drag.a - (e.clientX - G.drag.x) * 0.006; G.pitch = Math.max(-1.4, Math.min(1.4, G.drag.b + (e.clientY - G.drag.y) * 0.005)); place(); });
    cv.addEventListener('pointerup', function () { G.drag = null; });
    cv.addEventListener('wheel', function (e) { e.preventDefault(); G.dist = Math.max(2.4, Math.min(40, G.dist * (e.deltaY > 0 ? 1.1 : 0.9))); place(); }, { passive: false });
    resize();
  }
  function initPts() {
    if (!G || G.pts || !D) return; var T = G.T, g = new T.BufferGeometry();
    g.setAttribute('position', new T.BufferAttribute(new Float32Array(D.n * 3), 3));
    g.setAttribute('aA', new T.BufferAttribute(D.A, 4)); g.setAttribute('aB', new T.BufferAttribute(D.B, 4));
    g.boundingSphere = new T.Sphere(new T.Vector3(), 50);
    var m = new T.ShaderMaterial({ vertexShader: VS, fragmentShader: FS, transparent: true, depthWrite: false, blending: T.AdditiveBlending,
      uniforms: { uT: { value: 0 }, uYear: { value: 2026 }, uMask: { value: new T.Vector4(1, 0, 0, 0) }, uPx: { value: G.pr } } });
    G.pts = new T.Points(g, m); G.pts.frustumCulled = false; G.sc.add(G.pts);
  }
  function place() { if (!G) return; var d = G.dist / Math.min(1, G.cam.aspect * 0.9); G.cam.position.set(Math.sin(G.yaw) * Math.cos(G.pitch) * d, Math.sin(G.pitch) * d, Math.cos(G.yaw) * Math.cos(G.pitch) * d); G.cam.lookAt(0, 0, 0); }
  function resize() {
    if (!G) return; var b = U.cv3.parentNode.getBoundingClientRect(), w = Math.max(200, b.width), hh = Math.max(160, b.height);
    G.rd.setSize(w, hh, false); U.cv3.style.width = w + 'px'; U.cv3.style.height = hh + 'px'; G.cam.aspect = w / hh; G.cam.updateProjectionMatrix(); place();
  }
  function gmst(ms) { var d = ms / 86400000 + 2440587.5 - 2451545.0; return ((280.46061837 + 360.98564736629 * d) % 360) * Math.PI / 180; }

  /* ---------- 右侧:数字 + 每年发射柱状图 ---------- */
  function drawChart() {
    var c = U.cv, g = c.getContext('2d'), W = c.width, H = c.height, x0 = 34, x1 = W - 8, y0 = H - 22, top = 26;
    g.clearRect(0, 0, W, H); var ys = [], mx = 0; for (var y = 1957; y <= 2026; y++) { var v = D.years[y] || 0; ys.push(v); if (v > mx) mx = v; }
    g.font = '11px sans-serif'; g.fillStyle = 'rgba(200,214,240,0.75)'; g.fillText('每年发射的卫星数量', x0, 14);
    var bw = (x1 - x0) / ys.length;
    ys.forEach(function (v, i) { var yr = 1957 + i, hh = (y0 - top) * v / mx; g.fillStyle = yr <= L.year ? (yr >= 2019 ? '#4de8ff' : '#d6b25e') : 'rgba(255,255,255,0.12)'; g.fillRect(x0 + i * bw + 0.5, y0 - hh, Math.max(1, bw - 1), hh); });
    g.fillStyle = 'rgba(200,214,240,0.6)'; [1957, 1980, 2000, 2026].forEach(function (yr) { g.fillText(String(yr), x0 + (yr - 1957) * bw - 10, H - 6); });
    [0, 0.5, 1].forEach(function (f) { var v = Math.round(mx * f / 100) * 100; g.fillText(String(v), 2, y0 - (y0 - top) * v / mx + 4); });
    var cy = L.year, cv = D.years[cy] || 0, cx = x0 + (cy - 1957 + 0.5) * bw; g.strokeStyle = '#ffe08a'; g.beginPath(); g.moveTo(cx, top - 4); g.lineTo(cx, y0); g.stroke();
    g.fillStyle = '#ffe08a'; var lbl = cy + ' 年:' + fmt(cv) + ' 颗' + (cy === 2026 ? '(至今)' : ''); g.fillText(lbl, Math.min(x1 - g.measureText(lbl).width, Math.max(x0, cx - 40)), top - 8);
  }
  function syncUI() {
    if (!D) return;
    var cnt = [D.cnt.active, D.cnt.dead, D.cnt.rb, D.cnt.deb];
    U.kinds.querySelectorAll('.sat-k').forEach(function (b, i) { b.classList.toggle('on', !!L.mask[i]); b.querySelector('b').textContent = fmt(cnt[i]); });
    var o = D.orb, tot = D.cnt.active;
    U.orb.innerHTML = '<span>工作中卫星按轨道分</span>' + [['近地 <2000 km', o.LEO, '#4de8ff'], ['中轨', o.MEO, '#7dff9a'], ['地球静止', o.GEO, '#ffd23f'], ['大椭圆', o.HEO, '#d68bff']].map(function (x) { return '<em style="--c:' + x[2] + '">' + x[0] + '<b>' + (x[1] / tot * 100).toFixed(1) + '%</b></em>'; }).join('') + '<span>其中星链 ' + fmt(D.starlink) + ' 颗</span>';
    U.yr.value = L.year; U.yv.textContent = L.year < 2026 ? L.year + ' 年前发射、今天仍在轨道上的' : '今天';
    U.sp.querySelectorAll('.sat-spb').forEach(function (b) { b.classList.toggle('on', +b.dataset.v === L.speed); });
    if (G && G.pts) { var u = G.pts.material.uniforms; u.uYear.value = L.year; u.uMask.value.set(L.mask[0], L.mask[1], L.mask[2], L.mask[3]); }
    drawChart();
  }

  /* ---------- 向导 ---------- */
  function stars() { var p = SH.progress, n = 0; if (p) for (var i = 1; i <= 3; i++) n += p.stars('sats', i); U.st.textContent = '★ ' + n + ' / 9'; }
  function showQ() {
    stars(); L.hints = 0; L.done = false; U.hs.textContent = ''; U.ch.innerHTML = ''; U.hint.hidden = false;
    var Q = QS[L.n - 1]; U.q.innerHTML = '<small>第 ' + L.n + ' / 3 关 · ' + Q.title + '</small>' + Q.q;
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
    nx.onclick = function () { if (L.n < 3) { if (SH.play) SH.play('sats', L.n + 1); } else if (SH.exit) SH.exit(); else close(); };
    U.ch.appendChild(nx);
    if (L.n === 3) U.ch.appendChild(h('span', 'ml-hs', '✦ 星桥:奇点前夜 Pre-Singularity · AI 与卫星数据(开放后可直达)'));
  }
  function hint() {
    var Q = QS[L.n - 1]; if (!Q || L.hints >= 3 || !D) return; P('click');
    var t = Q.hint[L.hints]; if (typeof t === 'function') t = t();
    U.hs.textContent = ['方向', '线索', '半步示范'][L.hints] + ':' + t; L.hints++;
    if (L.hints >= 3) U.hint.hidden = true;
  }

  var raf = 0, last = 0, tl = 0;
  function loop(t) {
    raf = requestAnimationFrame(loop); var dt = Math.min(0.1, (t - last) / 1000 || 0); last = t;
    if (document.hidden || !G) return;
    if (D) {
      L.simT += dt * L.speed; var ms = D.t0ms + L.simT * 1000;
      if (G.pts) G.pts.material.uniforms.uT.value = L.simT;
      G.earth.rotation.y = gmst(ms);
      if (t - tl > 500) { tl = t; var dd = new Date(ms); U.time.textContent = (L.speed === 1 ? '此刻 ' : '模拟时间 ') + dd.toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Shanghai' }) + '(北京时间)';
        if (SH.astro && SH.astro.sunEci) { var s = SH.astro.sunEci(dd); G.sunL.position.set(s.x, s.z, -s.y).normalize().multiplyScalar(50); } }
    }
    G.rd.render(G.sc, G.cam);
  }
  function setup(n) {
    L.year = 2026; L.speed = n === 2 ? 600 : 60; L.mask = n === 3 ? [1, 1, 1, 1] : [1, 0, 0, 0];
    if (n === 3) L.mask = [1, 0, 0, 0];
    if (n === 1) L.year = 1990;
    if (n === 2) { G && (G.dist = 18); } else if (G) G.dist = 13;
    place();
  }
  function open(n, api) {
    if (!U.root) build();
    L.n = n || 1; L.api = api || null;
    U.root.hidden = false; document.body.classList.add('ml-on');
    if (!G && window.THREE) try { initGL(); } catch (e) { console.warn('[sats] WebGL 失败', e); }
    resize(); U.q.innerHTML = '<small>第 ' + L.n + ' / 3 关</small>正在加载轨道数据…'; U.ch.innerHTML = ''; U.hint.hidden = true;
    cancelAnimationFrame(raf); raf = requestAnimationFrame(loop); P('open');
    loadData(function (err) {
      if (err || !window.SH_SATS) { U.load.textContent = '轨道数据加载失败,请检查网络后重新打开'; return; }
      if (!D) decode(); if (L.simT === 0) L.simT = (Date.now() - D.t0ms) / 1000;
      U.load.hidden = true; try { initPts(); } catch (e) { console.warn('[sats] 点云失败', e); }
      setup(L.n); syncUI(); showQ();
    });
  }
  function close(silent) { if (!U.root || U.root.hidden) return; U.root.hidden = true; document.body.classList.remove('ml-on'); cancelAnimationFrame(raf); if (!silent) P('close'); }
  addEventListener('resize', function () { if (U.root && !U.root.hidden) resize(); });

  SH.levels = SH.levels || {};
  SH.levels.sats = QS.map(function (Q, i) {
    return { title: Q.title, ask: Q.q, guide: 'tianshu', hints: Q.hint.map(function (x) { return typeof x === 'string' ? x : '看右边的数字。'; }),
      mount: function (api) { open(i + 1, api); api.onLeave(function () { close(true); }); } };
  });
  SH.satsLab = { open: function () { var p = SH.progress, n = 1; if (p) for (var i = 1; i <= 3; i++) if (p.stars('sats', i) < 1) { n = i; break; } if (SH.play) SH.play('sats', n); else open(n); }, close: close, _L: L, _sync: function () { syncUI(); } };
})();
