/* 天枢 Starhelm · sh-voyage.js(M1.5)
 * 星际航行:弦穹号 Chordion 驾驶舱 + 随船智能「星璃」+ 引擎系统 + 航图选点 + 穿梭。
 * 独立渲染器;进入航行时暂停 Live Earth 的渲染,退出后恢复,原有任务与地球模式不受影响。
 * 星璃形象(M1.7 B3 版):VRoid 官方 AvatarSample_G(pixiv Inc.,CC0)贴图重绘 + 程序附加双马尾/耳机/立领。
 * three-vrm 0.6.11(pixiv,MIT)。台词为写好的脚本,不接任何大模型。 */
(function () {
  'use strict';
  var SH = (window.SH = window.SH || {});
  var V = SH.voyData, FX = SH.voyFx, T = THREE;
  var VY = (SH.voy = { active: false, state: 'idle', at: 'home', target: null, engine: null, param: null });
  var KEY = 'gn:sh:voyage';

  /* ---------- 存储 ---------- */
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function save(o) { try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) { } }
  var ST = load(); ST.visited = ST.visited || ['home']; ST.engines = ST.engines || [];

  /* ---------- 声音:按系列声音设计指南 v1.0,统一走 LE.audio(默认关,合成音频文件 + 速度嗡鸣) ---------- */
  function P(n, o) { if (window.LE && LE.audio) LE.audio.play(n, o); }
  var TIER_N = { '实测': 1, '推断': 2, '猜想': 3 };
  var sfx = {
    tick: function () { P('tick'); },
    click: function () { P('click'); },
    glass: function () { P('select'); },
    open: function () { P('open'); },
    close: function () { P('close'); },
    ignite: function (e) { P('ignite-' + (TIER_N[e && e.tier] || 1)); },   // 实测低沉 / 推断明亮 / 猜想飘忽
    sector: function (id) { var i = V.sectors.indexOf(V.byId(id)); if (i >= 0) P('sector-' + (i + 1)); },   // 越远音越高
    arrive: function (id) { P('arrive'); setTimeout(function () { sfx.sector(id); }, 700); },
    blip: function () { P('blip', { gain: 0.5 }); },
    whoosh: function (d) { P('whoosh', d); },
    hum: function (lvl) { if (window.LE && LE.audio && LE.audio.setVoyageHum) LE.audio.setVoyageHum(lvl); }
  };

  /* ---------- DOM ---------- */
  function h(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function fill(s, o) { return s.replace(/\{(\w+)\}/g, function (_, k) { return o[k] != null ? o[k] : ''; }); }

  var R = {}; // 渲染相关
  var UI = {};

  function tierOf() {
    var mob = matchMedia('(pointer:coarse)').matches || innerWidth < 820;
    var mem = navigator.deviceMemory || 4, cores = navigator.hardwareConcurrency || 4;
    if (mob && (mem <= 3 || cores <= 4)) return 'low';
    return mob ? 'mid' : 'high';
  }

  function buildDom() {
    var root = h('section', 'voy'); root.id = 'voy'; root.hidden = true;
    root.innerHTML =
      '<div class="voy-stage"></div>' +
      '<div class="voy-fade"></div>' +
      '<header class="voy-top">' +
        '<div class="voy-brand"><b>弦穹号</b><span>CHORDION</span></div>' +
        '<div class="voy-loc"><span class="voy-loc__n"></span><b class="voy-loc__zh"></b><em class="voy-loc__st"></em></div>' +
        '<div class="voy-topbtns"><button type="button" class="voy-b voy-b--map" hidden>✧ 航图</button><button type="button" class="voy-b voy-b--eva" hidden>⇱ 舱外观景</button><button type="button" class="voy-b voy-b--tts" title="星璃朗读(默认关)">🔈</button><button type="button" class="voy-b voy-b--exit">返回母港</button></div>' +
      '</header>' +
      '<div class="voy-banner" hidden></div>' +
      '<aside class="voy-eng"><div class="voy-eng__h">引擎 <small>ENGINES</small></div><div class="voy-eng__list"></div><div class="voy-eng__info"></div></aside>' +
      '<div class="voy-say"><div class="voy-say__name">星璃 <small>XINGLI</small></div><p class="voy-say__t"></p><div class="voy-say__ch"></div></div>' +
      '<div class="voy-ctrl" hidden></div>' +
      '<div class="voy-look" hidden></div>' +
      '<button type="button" class="voy-evaback" hidden>↩ 回到舱内</button>' +
      '<div class="voy-evanote">弦穹号 · 外观为设计示意 · 中段<em>曲率环</em>是「猜想」装置,尚无实验支持</div>' +
      '<footer class="voy-dash">' +
        '<div><small>目标</small><b class="d-to">—</b></div>' +
        '<div><small>距离</small><b class="d-dist">—</b></div>' +
        '<div><small>速度</small><b class="d-v">0 km/s</b></div>' +
        '<div><small>地球时间</small><b class="d-te">—</b></div>' +
        '<div><small>船上时间</small><b class="d-ts">—</b></div>' +
        '<div><small>信号回地球</small><b class="d-sig">—</b></div>' +
        '<div class="d-x-w"><small>演示快进</small><b class="d-x">—</b></div>' +
      '</footer>' +
      '<div class="voy-credit">影像:NASA, ESA, CSA, STScI(CC BY 4.0)· 驾驶舱与星璃形象:天枢原创设计图· 不代表任何机构背书</div>' +
      '<section class="voy-map" hidden><div class="voy-map__bar"><div><small>STARHELM · ATLAS</small><h2>航图 <span>选择目的地</span></h2></div><button type="button" class="voy-b voy-map__x">×</button></div>' +
        '<canvas></canvas><div class="voy-map__legend"><i class="lg-open"></i>已测绘 <i class="lg-un"></i>未测绘星域 <i class="lg-cj"></i>猜想 <i class="lg-here"></i>当前位置</div><div class="voy-map__hint">拖动旋转 · 滚轮/双指缩放 · 越往外越远(对数尺度)</div><div class="voy-map__card" hidden></div></section>' +
      '<div class="voy-holotag" hidden><b>航图</b><small>ATLAS · 点击星图选择目的地</small><i></i></div>' +
      '<div class="voy-boardcap" hidden><small>BOARDING</small><b>登舰 · 弦穹号</b><span>CHORDION</span></div><button type="button" class="voy-boardskip" hidden>跳过 ›</button>' +
      '<div class="voy-load"><div class="voy-load__ring"></div><p>弦穹号启动中……</p></div>';
    document.body.appendChild(root);
    UI.root = root; UI.stage = root.querySelector('.voy-stage'); UI.fade = root.querySelector('.voy-fade');
    UI.locN = root.querySelector('.voy-loc__n'); UI.locZh = root.querySelector('.voy-loc__zh'); UI.locSt = root.querySelector('.voy-loc__st');
    UI.banner = root.querySelector('.voy-banner'); UI.engList = root.querySelector('.voy-eng__list'); UI.engInfo = root.querySelector('.voy-eng__info');
    UI.sayT = root.querySelector('.voy-say__t'); UI.sayCh = root.querySelector('.voy-say__ch'); UI.say = root.querySelector('.voy-say');
    UI.ctrl = root.querySelector('.voy-ctrl'); UI.map = root.querySelector('.voy-map'); UI.mapCv = UI.map.querySelector('canvas'); UI.mapCard = UI.map.querySelector('.voy-map__card');
    UI.load = root.querySelector('.voy-load'); UI.boardCap = root.querySelector('.voy-boardcap'); UI.holoTag = root.querySelector('.voy-holotag'); UI.boardSkip = root.querySelector('.voy-boardskip');
    UI.boardSkip.addEventListener('click', function () { boardEnd(); });
    UI.d = {}; ['to', 'dist', 'v', 'te', 'ts', 'sig', 'x'].forEach(function (k) { UI.d[k] = root.querySelector('.d-' + k); });
    root.querySelector('.voy-b--exit').addEventListener('click', function () { SH.voyExit(); });
    root.querySelector('.voy-b--map').addEventListener('click', function () { openMap(); });
    UI.evaBtn = root.querySelector('.voy-b--eva'); UI.evaBack = root.querySelector('.voy-evaback'); UI.look = root.querySelector('.voy-look');
    UI.evaBtn.addEventListener('click', function () { evaIn(); });
    UI.evaBack.addEventListener('click', function () { evaOut(); });
    root.querySelector('.voy-map__x').addEventListener('click', function () { UI.map.hidden = true; sfx.close(); });
    var tts = root.querySelector('.voy-b--tts');
    tts.addEventListener('click', function () { VY.tts = !VY.tts; tts.textContent = VY.tts ? '🔊' : '🔈'; tts.classList.toggle('on', VY.tts); if (!VY.tts && window.speechSynthesis) speechSynthesis.cancel(); });
    buildEngines(); buildHubDom(root);
  }

  /* ============================ 3D:舱外 + 驾驶舱 ============================ */
  function initGL() {
    R.tier = tierOf();
    var r = new T.WebGLRenderer({ antialias: R.tier !== 'low', alpha: false, powerPreference: 'high-performance' });
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, R.tier === 'high' ? 2 : R.tier === 'mid' ? 1.5 : 1.15));
    r.setSize(innerWidth, innerHeight); r.outputEncoding = T.sRGBEncoding; r.toneMapping = T.ACESFilmicToneMapping; r.toneMappingExposure = 0.82;
    r.autoClear = false; UI.stage.appendChild(r.domElement); R.r = r;
    R.out = new T.Scene(); R.outCam = new T.PerspectiveCamera(55, innerWidth / innerHeight, 0.5, 4000);
    FX.build(R.out, R.tier); if (FX.buildEngines) { FX.buildEngines(R.out, R.tier); FX.buildShip(R.out); }
    R.in = new T.Scene(); R.cam = new T.PerspectiveCamera(62, innerWidth / innerHeight, 0.02, 50);
    R.cam.position.set(0, 1.58, 2.05); R.look = new T.Vector3(0.05, 1.05, -1.5); R.cam.lookAt(R.look);
    buildCockpit();
    R.mode25 = !/[?&]ck=3d/.test(location.search); if (R.mode25) { build25(); UI.root.classList.add('m25'); }
    R.clock = new T.Clock(); R.t = 0; R.shake = 0;
    R.ray = new T.Raycaster(); R.ptr = new T.Vector2(); R.mouse = new T.Vector2();
    r.domElement.addEventListener('pointermove', function (e) { R.mouse.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); });
    r.domElement.addEventListener('click', onClick3D);
    window.addEventListener('resize', onResize);
    onResize();
  }
  function onResize() {
    if (!R.r) return; var w = innerWidth, hh = innerHeight; R.r.setSize(w, hh);
    R.outCam.aspect = R.cam.aspect = w / hh;
    R.cam.fov = w / hh < 0.8 ? 78 : 62; // 竖屏手机拉宽视野
    var port = w / hh < 0.8;
    if (R.pad) { if (port) R.pad.position.set(0.42, 0, -0.2); else R.pad.position.set(0.95, 0, -0.45); R.padLight.position.set(R.pad.position.x, 1.5, R.pad.position.z + 0.25); }
    if (R.bench) R.bench.position.x = port ? 0.25 : 0.55;
    R.outCam.updateProjectionMatrix(); R.cam.updateProjectionMatrix(); lay25();
  }

  function mat(c, e, ei, rough, metal) { return new T.MeshStandardMaterial({ color: c, emissive: e || 0x000000, emissiveIntensity: ei || 1, roughness: rough == null ? 0.55 : rough, metalness: metal == null ? 0.6 : metal }); }
  function screenTex(draw, w, hh) {
    var c = document.createElement('canvas'); c.width = w || 512; c.height = hh || 256; var t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding;
    return { c: c, g: c.getContext('2d'), t: t, draw: draw };
  }

  /* M1.6b 驾驶舱 2.0(概念图 B:白色复合材料 + 石墨 + 鎏金灯带 + 中央全息星图台)
   * 全部程序生成;PBR 反射用 PMREM 从一个小的"灯箱"场景生成环境贴图,不加载任何外部 HDR。 */
  function roundRect(w, hh, r) {
    var s = new T.Shape(), x = -w / 2, y = -hh / 2;
    s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + hh - r); s.quadraticCurveTo(x + w, y + hh, x + w - r, y + hh);
    s.lineTo(x + r, y + hh); s.quadraticCurveTo(x, y + hh, x, y + hh - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s;
  }
  function roundPath(w, hh, r) { var s = roundRect(w, hh, r); var p = new T.Path(); p.curves = s.curves; return p; }
  /* M1.7 驾驶舱 3.0 —— 按概念图 cockpit_B_luxury 重建:
   * 全景大舷窗 + 白色复合材料舱壁 + 顶部两组暖光灯槽 + 石墨地板鎏金线 + 中央全息星图台(大旋涡星系)
   * + 左右两张白色驾驶座与弧形控制台 + 前景长条操作台(引擎旋钮/推杆) + 右侧通往副舱的开口。全部程序生成。 */
  function rbox(w, hh, d, r, m, bev) {
    var g = new T.ExtrudeGeometry(roundRect(w, hh, Math.min(r, w / 2 - 1e-3, hh / 2 - 1e-3)), { depth: d, bevelEnabled: bev !== false, bevelThickness: Math.min(0.012, d * 0.3), bevelSize: Math.min(0.012, r * 0.5), bevelSegments: 3, curveSegments: 10 });
    g.translate(0, 0, -d / 2); return new T.Mesh(g, m);
  }
  function glowTex(c0, soft) {
    var c = document.createElement('canvas'); c.width = 256; c.height = 64; var g = c.getContext('2d');
    var gr = g.createLinearGradient(0, 0, 0, 64); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.5, c0); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 256, 64);
    var gx = g.createLinearGradient(0, 0, 256, 0); gx.addColorStop(0, 'rgba(0,0,0,1)'); gx.addColorStop(soft || 0.08, 'rgba(0,0,0,0)'); gx.addColorStop(1 - (soft || 0.08), 'rgba(0,0,0,0)'); gx.addColorStop(1, 'rgba(0,0,0,1)');
    g.globalCompositeOperation = 'destination-out'; g.fillStyle = gx; g.fillRect(0, 0, 256, 64);
    var t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; return t;
  }
  function radialTex(stops) {
    var c = document.createElement('canvas'); c.width = c.height = 128; var g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    stops.forEach(function (s) { gr.addColorStop(s[0], s[1]); }); g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    var t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; return t;
  }
  function floorTex() {
    var c = document.createElement('canvas'); c.width = c.height = 512; var g = c.getContext('2d');
    g.fillStyle = '#16181c'; g.fillRect(0, 0, 512, 512);
    for (var i = 0; i < 2600; i++) { g.fillStyle = 'rgba(255,255,255,' + (Math.random() * 0.025) + ')'; g.fillRect(Math.random() * 512, Math.random() * 512, 2, 2); }
    g.strokeStyle = 'rgba(0,0,0,0.55)'; g.lineWidth = 3;
    for (var k = 0; k <= 4; k++) { g.beginPath(); g.moveTo(k * 128, 0); g.lineTo(k * 128, 512); g.stroke(); g.beginPath(); g.moveTo(0, k * 128); g.lineTo(512, k * 128); g.stroke(); }
    g.strokeStyle = 'rgba(255,255,255,0.05)'; g.lineWidth = 1;
    for (k = 0; k <= 4; k++) { g.beginPath(); g.moveTo(k * 128 + 2, 0); g.lineTo(k * 128 + 2, 512); g.stroke(); }
    var t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(3, 3); t.anisotropy = 4; return t;
  }
  function holoTopTex() {
    var c = document.createElement('canvas'); c.width = c.height = 512; var g = c.getContext('2d'), C = 256;
    var gr = g.createRadialGradient(C, C, 0, C, C, C); gr.addColorStop(0, '#2a8fd0'); gr.addColorStop(0.55, '#0b3f78'); gr.addColorStop(0.92, '#04172e'); gr.addColorStop(1, '#020a14');
    g.fillStyle = gr; g.beginPath(); g.arc(C, C, C, 0, 7); g.fill();
    g.strokeStyle = 'rgba(140,220,255,0.55)'; g.lineWidth = 1.5;
    [60, 110, 160, 205, 240].forEach(function (r) { g.beginPath(); g.arc(C, C, r, 0, 7); g.stroke(); });
    for (var a = 0; a < 24; a++) { g.beginPath(); g.moveTo(C + Math.cos(a / 24 * 6.283) * 60, C + Math.sin(a / 24 * 6.283) * 60); g.lineTo(C + Math.cos(a / 24 * 6.283) * 240, C + Math.sin(a / 24 * 6.283) * 240); g.globalAlpha = a % 6 ? 0.25 : 0.6; g.stroke(); }
    g.globalAlpha = 1;
    for (var i = 0; i < 260; i++) { var rr = Math.sqrt(Math.random()) * 235, th = Math.random() * 6.283; g.fillStyle = Math.random() < 0.15 ? '#ffd890' : '#bdf0ff'; g.fillRect(C + Math.cos(th) * rr, C + Math.sin(th) * rr, 2, 2); }
    g.strokeStyle = '#ffcf8a'; g.lineWidth = 6; g.beginPath(); g.arc(C, C, 250, 0, 7); g.stroke();
    var t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; return t;
  }
  function holoPanelTex(seed) {
    var c = document.createElement('canvas'); c.width = 256; c.height = 160; var g = c.getContext('2d');
    g.fillStyle = 'rgba(40,190,255,0.10)'; g.fillRect(0, 0, 256, 160); g.strokeStyle = 'rgba(120,230,255,0.9)'; g.lineWidth = 2; g.strokeRect(3, 3, 250, 154);
    g.fillStyle = 'rgba(160,240,255,0.85)';
    for (var i = 0; i < 6; i++) g.fillRect(14, 18 + i * 20, 40 + ((seed * 37 + i * 53) % 150), 6);
    g.strokeStyle = 'rgba(255,210,130,0.9)'; g.beginPath(); for (var x = 0; x < 230; x += 5) { var y = 140 - 20 * Math.abs(Math.sin(x * 0.05 + seed)); if (x) g.lineTo(13 + x, y); else g.moveTo(13, y); } g.stroke();
    var t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; return t;
  }
  function cabinEnv() {
    var es = new T.Scene(), box = new T.Mesh(new T.BoxGeometry(10, 6, 10), new T.MeshBasicMaterial({ color: 0x1b1d22, side: T.BackSide })); es.add(box);
    function lamp(c, w, hh, x, y, z, ry, rx) { var m = new T.Mesh(new T.PlaneGeometry(w, hh), new T.MeshBasicMaterial({ color: c, side: T.DoubleSide })); m.position.set(x, y, z); m.rotation.set(rx || 0, ry || 0, 0); es.add(m); }
    lamp(0xfff0d8, 1.6, 3.2, -1.4, 2.95, 0, 0, Math.PI / 2); lamp(0xfff0d8, 1.6, 3.2, 1.4, 2.95, 0, 0, Math.PI / 2);   // 顶部两组暖光灯槽
    lamp(0x9fd8ff, 6, 2.6, 0, 1.4, -4.9);                         // 前方舷窗
    lamp(0xffc070, 0.2, 5, -4.9, 0.3, 0, Math.PI / 2); lamp(0xffc070, 0.2, 5, 4.9, 0.3, 0, -Math.PI / 2);
    lamp(0xd8e2ec, 3, 2, 0, 1.5, 4.9);                            // 背后舱壁
    var pm = new T.PMREMGenerator(R.r); var rt = pm.fromScene(es, 0.04); pm.dispose(); return rt.texture;
  }
  function chair(S, white, graph, gold, x, z, ry) {
    var g = new T.Group(); g.position.set(x, 0, z); g.rotation.y = ry; S.add(g);
    var base = new T.Mesh(new T.CylinderGeometry(0.2, 0.26, 0.05, 40), graph); base.position.y = 0.025; g.add(base);
    var bring = new T.Mesh(new T.TorusGeometry(0.235, 0.004, 6, 60), gold); bring.rotation.x = Math.PI / 2; bring.position.y = 0.05; g.add(bring);
    var post = new T.Mesh(new T.CylinderGeometry(0.05, 0.07, 0.36, 24), white); post.position.y = 0.23; g.add(post);
    var seat = rbox(0.56, 0.52, 0.11, 0.12, white); seat.rotation.x = -Math.PI / 2; seat.position.set(0, 0.46, 0.02); g.add(seat);
    var cush = rbox(0.44, 0.44, 0.06, 0.1, graph); cush.rotation.x = -Math.PI / 2; cush.position.set(0, 0.53, 0.01); g.add(cush);
    var back = rbox(0.54, 0.86, 0.12, 0.16, white); back.position.set(0, 0.98, 0.27); back.rotation.x = -0.18; g.add(back);
    var bc = rbox(0.4, 0.66, 0.05, 0.12, graph); bc.position.set(0, 0.96, 0.2); bc.rotation.x = -0.18; g.add(bc);
    var head = rbox(0.34, 0.2, 0.12, 0.08, white); head.position.set(0, 1.5, 0.37); head.rotation.x = -0.18; g.add(head);
    [-1, 1].forEach(function (s) {
      var arm = rbox(0.08, 0.5, 0.07, 0.035, white); arm.rotation.x = -Math.PI / 2; arm.position.set(s * 0.32, 0.68, 0.0); g.add(arm);
      var sup = rbox(0.06, 0.2, 0.05, 0.025, white); sup.position.set(s * 0.32, 0.58, 0.12); g.add(sup);
      var gl = new T.Mesh(new T.BoxGeometry(0.006, 0.8, 0.006), gold); gl.position.set(s * 0.275, 0.98, 0.335); gl.rotation.x = -0.18; g.add(gl);
    });
    return g;
  }
  function buildCockpit() {
    var S = R.in;
    R.env = cabinEnv(); S.environment = R.env;
    var white = new T.MeshPhysicalMaterial({ color: 0xcfcdc8, roughness: 0.34, metalness: 0.04, clearcoat: 0.7, clearcoatRoughness: 0.2, envMapIntensity: 1.0 });
    var white2 = new T.MeshPhysicalMaterial({ color: 0xbcbab5, roughness: 0.48, metalness: 0.05, clearcoat: 0.35 });
    var graph = new T.MeshStandardMaterial({ color: 0x2a2d33, roughness: 0.4, metalness: 0.6 });
    var graph2 = new T.MeshStandardMaterial({ color: 0x17191d, roughness: 0.55, metalness: 0.45 });
    var gold = new T.MeshBasicMaterial({ color: 0xffc27a, toneMapped: false });
    var goldM = new T.MeshStandardMaterial({ color: 0xc9a062, roughness: 0.25, metalness: 1 });
    var edge = new T.MeshBasicMaterial({ color: 0x5fdcff, toneMapped: false });
    R.goldMat = gold; R.edgeMat = edge;
    S.add(new T.HemisphereLight(0xf4f2ee, 0x2a2c32, 0.38));
    var key = new T.PointLight(0xfff1dc, 0.6, 8); key.position.set(0, 2.5, -0.2); S.add(key); R.cabinLight = key;
    [-1.4, 1.4].forEach(function (x) { var l = new T.PointLight(0xffe6c4, 0.45, 5); l.position.set(x, 2.45, 0.2); S.add(l); });
    var cool = new T.PointLight(0x7fd0ff, 0.5, 4); cool.position.set(0, 1.3, -1.6); S.add(cool);

    var Z = -2.3, YC = 1.55;   // 前壁 z,舷窗中心高度
    // —— 前壁:全景大舷窗
    var fw = new T.Shape(); fw.moveTo(-3.4, -0.2); fw.lineTo(3.4, -0.2); fw.lineTo(3.4, 3.4); fw.lineTo(-3.4, 3.4); fw.lineTo(-3.4, -0.2);
    var hole = roundPath(5.0, 2.15, 0.62); hole.curves.forEach(function (c) { ['v0', 'v1', 'v2'].forEach(function (k) { if (c[k]) c[k].y += YC; }); }); fw.holes.push(hole);
    var front = new T.Mesh(new T.ExtrudeGeometry(fw, { depth: 0.18, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.08, bevelSegments: 5, curveSegments: 28 }), white);
    front.position.set(0, 0, Z - 0.12); S.add(front);
    var lp = roundRect(4.9, 2.05, 0.58).getPoints(100).map(function (p) { return new T.Vector3(p.x, p.y + YC, Z + 0.15); });
    S.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(lp, true), 240, 0.008, 6, true), gold));
    var glass = new T.Mesh(new T.PlaneGeometry(5.2, 2.4), new T.MeshPhysicalMaterial({ color: 0xbfe6ff, transparent: true, opacity: 0.04, roughness: 0.03, metalness: 0, depthWrite: false, envMapIntensity: 0.6 }));
    glass.position.set(0, YC, Z - 0.05); S.add(glass);
    // 舷窗下沿:暖光灯带(概念图窗下一道金线)
    var sill = new T.Mesh(new T.PlaneGeometry(4.6, 0.09), new T.MeshBasicMaterial({ map: glowTex('rgba(255,200,130,1)', 0.12), transparent: true, blending: T.AdditiveBlending, depthWrite: false, toneMapped: false }));
    sill.position.set(0, YC - 1.14, Z + 0.17); S.add(sill);

    // —— 侧壁:左侧弧形白壁 + 小舷窗;右侧开口通往副舱
    function sideWall(s) {
      var sh = new T.Shape(); sh.moveTo(-2.3, -0.2); sh.lineTo(2.4, -0.2); sh.lineTo(2.4, 3.2); sh.lineTo(-2.3, 3.2); sh.lineTo(-2.3, -0.2);
      var hp = roundPath(s > 0 ? 1.9 : 1.1, s > 0 ? 1.55 : 1.5, 0.35);
      hp.curves.forEach(function (c) { ['v0', 'v1', 'v2'].forEach(function (k) { if (c[k]) { c[k].x += (s > 0 ? -0.75 : -1.25); c[k].y += 1.45; } }); });
      sh.holes.push(hp);
      var w = new T.Mesh(new T.ExtrudeGeometry(sh, { depth: 0.14, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 4, curveSegments: 20 }), white2);
      w.rotation.y = -s * Math.PI / 2 + s * 0.12; w.position.set(s * 2.55, 0, -0.3); S.add(w);
      var gl = new T.Mesh(new T.BoxGeometry(0.02, 0.025, 4.2), gold); gl.position.set(s * 2.42, 0.32, -0.25); gl.rotation.y = s * 0.12; S.add(gl);
      return w;
    }
    sideWall(-1); sideWall(1);
    // 副舱(右侧开口后):暗色小舱 + 几块屏幕
    var ann = new T.Group(); ann.position.set(3.35, 0, -0.85); ann.rotation.y = 0.12; S.add(ann);
    var abox = new T.Mesh(new T.BoxGeometry(1.6, 2.8, 2.6), new T.MeshStandardMaterial({ color: 0x101216, roughness: 0.8, metalness: 0.3, side: T.BackSide })); abox.position.set(0.3, 1.3, 0); ann.add(abox);
    [[1.08, 1.75, -0.6, 0.5, 0.3], [1.08, 1.75, 0.15, 0.55, 0.32], [1.08, 1.3, -0.25, 0.7, 0.22], [1.08, 1.85, 0.75, 0.4, 0.26]].forEach(function (p, i) {
      var m = new T.Mesh(new T.PlaneGeometry(p[3], p[4]), new T.MeshBasicMaterial({ map: holoPanelTex(i + 3), toneMapped: false, transparent: true }));
      m.position.set(p[0], p[1], p[2]); m.rotation.y = -Math.PI / 2; ann.add(m);
    });
    var al = new T.Mesh(new T.BoxGeometry(0.02, 0.02, 2.4), gold); al.position.set(1.05, 2.4, 0); ann.add(al);
    var aLight = new T.PointLight(0x6fd0ff, 0.35, 2.5); aLight.position.set(0.5, 1.6, 0); ann.add(aLight);

    // —— 顶棚:白色曲面 + 两组暖光灯槽(概念图最醒目的元素)
    var ceil = new T.Mesh(new T.PlaneGeometry(6, 5), white2); ceil.rotation.x = Math.PI / 2; ceil.position.set(0, 2.95, -0.2); S.add(ceil);
    var coveGlow = glowTex('rgba(255,226,180,1)', 0.05);
    [-1, 1].forEach(function (s) {
      var cg = new T.Group(); cg.position.set(s * 1.35, 2.78, -0.35); cg.rotation.y = s * 0.22; S.add(cg);
      var ring = new T.Shape(); var o = roundRect(1.7, 3.0, 0.4); ring.curves = o.curves; ring.holes.push(roundPath(1.25, 2.55, 0.3));
      var rm = new T.Mesh(new T.ExtrudeGeometry(ring, { depth: 0.1, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 4, curveSegments: 16 }), white);
      rm.rotation.x = Math.PI / 2; cg.add(rm);
      var lp2 = roundRect(1.3, 2.6, 0.32).getPoints(80).map(function (p) { return new T.Vector3(p.x, 0.03, p.y); });
      cg.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(lp2, true), 200, 0.02, 6, true), new T.MeshBasicMaterial({ color: 0xffe2b8, toneMapped: false })));
      var inner = new T.Mesh(new T.PlaneGeometry(1.25, 2.55), new T.MeshBasicMaterial({ color: 0xfff0d8, toneMapped: false }));
      inner.rotation.x = Math.PI / 2; inner.position.y = 0.12; cg.add(inner);
      [0, 1].forEach(function (k) {   // 灯槽向下散开的柔光
        var gp = new T.Mesh(new T.PlaneGeometry(2.7, 0.5), new T.MeshBasicMaterial({ map: coveGlow, transparent: true, opacity: 0.35, blending: T.AdditiveBlending, depthWrite: false, toneMapped: false, side: T.DoubleSide }));
        gp.position.set((k ? 1 : -1) * 0.66, -0.12, 0); gp.rotation.set(0, Math.PI / 2, 0); cg.add(gp);
      });
    });
    // 窗上横梁暖光
    var hb = new T.Mesh(new T.PlaneGeometry(5.2, 0.14), new T.MeshBasicMaterial({ map: glowTex('rgba(255,215,160,1)', 0.1), transparent: true, blending: T.AdditiveBlending, depthWrite: false, toneMapped: false }));
    hb.position.set(0, 2.82, Z + 0.25); hb.rotation.x = 0.6; S.add(hb);

    // —— 地板:石墨分块 + 鎏金导光线
    var floor = new T.Mesh(new T.PlaneGeometry(6, 5), new T.MeshStandardMaterial({ map: floorTex(), roughness: 0.38, metalness: 0.55, envMapIntensity: 0.7 }));
    floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, -0.2); S.add(floor);
    [[-1.2, 0.35], [1.2, -0.35], [-2.0, 0.15], [2.0, -0.15]].forEach(function (p) {
      var fl = new T.Mesh(new T.BoxGeometry(0.012, 0.004, 3.2), gold); fl.position.set(p[0], 0.003, -0.4); fl.rotation.y = p[1]; S.add(fl);
    });
    var fring = new T.Mesh(new T.RingGeometry(0.78, 0.8, 96), new T.MeshBasicMaterial({ color: 0xffc27a, toneMapped: false, side: T.DoubleSide })); fring.rotation.x = -Math.PI / 2; fring.position.set(0, 0.004, -1.0); S.add(fring);

    // —— 中央:全息星图台(大旋涡星系;点它打开航图)
    var holo = new T.Group(); holo.position.set(0, 0, -1.0); S.add(holo); R.holo = holo;
    var prof = [[0, 0], [0.42, 0], [0.44, 0.03], [0.3, 0.08], [0.2, 0.2], [0.17, 0.52], [0.24, 0.62], [0.5, 0.7], [0.56, 0.74], [0.56, 0.79], [0, 0.79]].map(function (p) { return new T.Vector2(p[0], p[1]); });
    holo.add(new T.Mesh(new T.LatheGeometry(prof, 64), white));
    var band = new T.Mesh(new T.CylinderGeometry(0.205, 0.205, 0.04, 48, 1, true), graph); band.position.y = 0.36; holo.add(band);
    var hr = new T.Mesh(new T.TorusGeometry(0.545, 0.007, 6, 100), gold); hr.rotation.x = Math.PI / 2; hr.position.y = 0.785; holo.add(hr);
    var top = new T.Mesh(new T.CircleGeometry(0.5, 64), new T.MeshBasicMaterial({ map: holoTopTex(), toneMapped: false })); top.rotation.x = -Math.PI / 2; top.position.y = 0.792; holo.add(top);
    var gN = R.tier === 'low' ? 4000 : 9000, gp = new Float32Array(gN * 3), gc = new Float32Array(gN * 3);
    for (var i = 0; i < gN; i++) {
      var arm = i % 2, rr = Math.pow(Math.random(), 0.55) * 0.4, th = Math.log(rr / 0.02 + 1) * 2.6 + arm * Math.PI + (Math.random() - 0.5) * (0.5 + rr), core = rr < 0.06;
      if (Math.random() < 0.18) { th = Math.random() * 6.283; }
      gp[i * 3] = Math.cos(th) * rr; gp[i * 3 + 2] = Math.sin(th) * rr; gp[i * 3 + 1] = (Math.random() - 0.5) * 0.03 * Math.exp(-rr * 6);
      var w = Math.random(), c = core ? [1.0, 0.85, 0.6] : (w < 0.2 ? [0.95, 0.9, 1.0] : [0.35, 0.65, 1.0]);
      var f = core ? 1 : 0.5 + 0.5 * Math.exp(-rr * 3); gc[i * 3] = c[0] * f; gc[i * 3 + 1] = c[1] * f; gc[i * 3 + 2] = c[2] * f;
    }
    var gg = new T.BufferGeometry(); gg.setAttribute('position', new T.BufferAttribute(gp, 3)); gg.setAttribute('color', new T.BufferAttribute(gc, 3));
    var gal = new T.Points(gg, new T.PointsMaterial({ size: 0.012, map: radialTex([[0, 'rgba(255,255,255,1)'], [0.4, 'rgba(255,255,255,0.5)'], [1, 'rgba(255,255,255,0)']]), vertexColors: true, transparent: true, opacity: 0.9, blending: T.AdditiveBlending, depthWrite: false, toneMapped: false }));
    var galG = new T.Group(); galG.position.y = 1.2; galG.rotation.set(0.5, 0, 0.12); holo.add(galG); galG.add(gal); R.holoGal = gal;
    var coreS = new T.Sprite(new T.SpriteMaterial({ map: radialTex([[0, 'rgba(255,240,210,1)'], [0.25, 'rgba(255,200,120,0.6)'], [1, 'rgba(255,160,80,0)']]), blending: T.AdditiveBlending, depthWrite: false, toneMapped: false }));
    coreS.scale.set(0.32, 0.32, 1); galG.add(coreS);
    var haloS = new T.Sprite(new T.SpriteMaterial({ map: radialTex([[0, 'rgba(120,190,255,0.45)'], [1, 'rgba(60,120,255,0)']]), blending: T.AdditiveBlending, depthWrite: false, toneMapped: false }));
    haloS.scale.set(1.0, 0.7, 1); galG.add(haloS);
    var cone = new T.Mesh(new T.CylinderGeometry(0.42, 0.48, 0.4, 64, 1, true), new T.ShaderMaterial({
      uniforms: { t: { value: 0 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
      fragmentShader: 'uniform float t; varying vec2 vUv; void main(){ float s = 0.5+0.5*sin(vUv.y*70.0 - t*3.0); gl_FragColor = vec4(0.35,0.8,1.0,(1.0-vUv.y)*0.10*(0.6+0.4*s)); }',
      transparent: true, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide
    }));
    cone.position.y = 1.0; holo.add(cone); R.holoCone = cone;
    var hl = new T.PointLight(0x6cc6ff, 0.8, 3); hl.position.set(0, 1.25, 0); holo.add(hl);
    var hit = new T.Mesh(new T.CylinderGeometry(0.56, 0.56, 1.3, 16), new T.MeshBasicMaterial({ visible: false })); hit.position.y = 0.75; holo.add(hit); R.holoHit = hit;

    // —— 左:驾驶座 + 弧形控制台(主屏 = 航行数据 + 浮动全息小窗)
    chair(S, white, graph, gold, -1.85, -0.6, 0.4);
    var lc = new T.Group(); lc.position.set(-1.4, 0, -1.2); lc.rotation.y = 0.35; S.add(lc);
    var lcb = rbox(0.22, 0.75, 0.5, 0.08, white); lcb.position.set(0.25, 0.37, 0); lc.add(lcb);
    var lct = rbox(1.15, 0.5, 0.07, 0.12, white); lct.rotation.x = -Math.PI / 2 + 0.12; lct.position.set(0, 0.78, 0); lc.add(lct);
    var lcs = rbox(1.0, 0.36, 0.02, 0.08, graph); lcs.rotation.x = -Math.PI / 2 + 0.12; lcs.position.set(0, 0.82, 0); lc.add(lcs);
    var lcg = new T.Mesh(new T.BoxGeometry(1.12, 0.008, 0.008), gold); lcg.position.set(0, 0.76, 0.26); lc.add(lcg);
    R.scr = screenTex(null, 512, 256);
    var scr = new T.Mesh(new T.PlaneGeometry(0.62, 0.31), new T.MeshBasicMaterial({ map: R.scr.t, transparent: true, toneMapped: false }));
    scr.rotation.x = -Math.PI / 2 + 0.12; scr.position.set(0, 0.835, 0); lc.add(scr); R.scrMesh = scr; R.scrBack = lcs; R.scrBaseX = 0;
    [[-0.32, 1.05, -0.12], [-0.12, 1.1, -0.15], [0.3, 1.02, -0.1]].forEach(function (p, k) {
      var hp2 = new T.Mesh(new T.PlaneGeometry(0.18, 0.12), new T.MeshBasicMaterial({ map: holoPanelTex(k), transparent: true, opacity: 0.85, blending: T.AdditiveBlending, depthWrite: false, toneMapped: false, side: T.DoubleSide }));
      hp2.position.set(p[0], p[1], p[2]); lc.add(hp2);
    });

    // —— 右:驾驶座 + 小控制台(全息小窗)
    chair(S, white, graph, gold, 2.05, -1.75, -0.5);
    var rc = new T.Group(); rc.position.set(1.55, 0, -2.0); rc.rotation.y = -0.45; S.add(rc);
    var rcb = rbox(0.2, 0.72, 0.4, 0.07, white); rcb.position.set(0, 0.36, 0); rc.add(rcb);
    var rct = rbox(0.8, 0.4, 0.06, 0.1, white); rct.rotation.x = -Math.PI / 2 + 0.1; rct.position.set(0, 0.74, 0); rc.add(rct);
    R.mini = [];
    [[-0.18, 0.77, 0], [0.18, 0.77, 0]].forEach(function (p) {
      var st = screenTex(null, 256, 160);
      var m = new T.Mesh(new T.PlaneGeometry(0.32, 0.2), new T.MeshBasicMaterial({ map: st.t, transparent: true, toneMapped: false }));
      m.position.set(p[0], p[1] + 0.012, p[2]); m.rotation.x = -Math.PI / 2 + 0.1; rc.add(m); R.mini.push(st);
    });
    var rh = new T.Mesh(new T.PlaneGeometry(0.14, 0.2), new T.MeshBasicMaterial({ map: holoPanelTex(9), transparent: true, opacity: 0.85, blending: T.AdditiveBlending, depthWrite: false, toneMapped: false, side: T.DoubleSide }));
    rh.position.set(-0.1, 0.98, -0.08); rc.add(rh);

    // —— 前景长条操作台(白色侧板 + 石墨台面 + 鎏金前缘;引擎旋钮、推力推杆、全息圆盘)
    var bench = new T.Group(); bench.position.set(0.55, 0, 0.55); bench.rotation.y = -0.32; S.add(bench); R.bench = bench;
    var bsh = new T.Shape(); bsh.moveTo(-1.0, 0); bsh.lineTo(1.0, 0); bsh.quadraticCurveTo(1.08, 0.0, 1.08, 0.1); bsh.lineTo(1.08, 0.5); bsh.quadraticCurveTo(1.08, 0.62, 0.95, 0.62); bsh.lineTo(-0.95, 0.62); bsh.quadraticCurveTo(-1.08, 0.62, -1.08, 0.5); bsh.lineTo(-1.08, 0.1); bsh.quadraticCurveTo(-1.08, 0, -1.0, 0);
    var bb = new T.Mesh(new T.ExtrudeGeometry(bsh, { depth: 0.55, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 4, curveSegments: 10 }), white);
    bb.position.set(0, 0, -0.275); bench.add(bb);
    var btop = rbox(2.0, 0.5, 0.03, 0.12, graph); btop.rotation.x = -Math.PI / 2; btop.position.set(0, 0.66, 0); bench.add(btop);
    var bgl = new T.Mesh(new T.BoxGeometry(2.05, 0.008, 0.008), gold); bgl.position.set(0, 0.6, 0.305); bench.add(bgl);
    var bgl2 = new T.Mesh(new T.BoxGeometry(2.05, 0.006, 0.006), gold); bgl2.position.set(0, 0.06, 0.3); bench.add(bgl2);
    var puck = new T.Mesh(new T.CylinderGeometry(0.1, 0.1, 0.015, 40), new T.MeshBasicMaterial({ color: 0x4fd8ff, toneMapped: false })); puck.position.set(-0.72, 0.68, 0.02); bench.add(puck);
    var pr = new T.Mesh(new T.TorusGeometry(0.115, 0.006, 6, 60), edge); pr.rotation.x = Math.PI / 2; pr.position.set(-0.72, 0.69, 0.02); bench.add(pr);
    var ps = new T.Sprite(new T.SpriteMaterial({ map: radialTex([[0, 'rgba(120,230,255,0.8)'], [1, 'rgba(60,180,255,0)']]), blending: T.AdditiveBlending, depthWrite: false, toneMapped: false })); ps.scale.set(0.35, 0.18, 1); ps.position.set(-0.72, 0.72, 0.02); bench.add(ps);
    // 引擎选择旋钮(10 段)
    var knobG = new T.Group(); knobG.position.set(-0.32, 0.675, 0.05); bench.add(knobG);
    knobG.add(new T.Mesh(new T.CylinderGeometry(0.15, 0.17, 0.03, 48), white));
    var knob = new T.Mesh(new T.CylinderGeometry(0.09, 0.1, 0.07, 40), goldM); knob.position.y = 0.045; knobG.add(knob);
    var ptr = new T.Mesh(new T.BoxGeometry(0.012, 0.012, 0.07), edge); ptr.position.set(0, 0.04, -0.04); knob.add(ptr);
    R.ticks = [];
    V.engines.forEach(function (e, i) {
      var a = -Math.PI * 0.8 + i / (V.engines.length - 1) * Math.PI * 1.6;
      var tk = new T.Mesh(new T.BoxGeometry(0.012, 0.006, 0.028), new T.MeshBasicMaterial({ color: V.TIER_COLOR[e.tier], toneMapped: false }));
      tk.position.set(Math.sin(a) * 0.13, 0.02, -Math.cos(a) * 0.13); tk.rotation.y = -a; knobG.add(tk); R.ticks.push(tk);
    });
    R.knob = knob; knob.userData.pick = 'knob';
    // 推力推杆(局部坐标 z 前后推)
    var rail = new T.Mesh(new T.BoxGeometry(0.05, 0.015, 0.34), graph2); rail.position.set(0.05, 0.68, 0.0); bench.add(rail);
    var lever = new T.Group(); lever.position.set(0.05, 0.69, 0.1); bench.add(lever);
    var stick = new T.Mesh(new T.CylinderGeometry(0.012, 0.012, 0.16, 12), goldM); stick.position.y = 0.08; lever.add(stick);
    var grip = new T.Mesh(new T.SphereGeometry(0.032, 20, 14), white); grip.position.y = 0.17; lever.add(grip);
    R.lever = lever; R.leverZ0 = 0.1;

    // —— 星璃全息投影台(右前;半身全息像从光环中升起)
    var pad = new T.Group(); pad.position.set(0.95, 0, -0.45); S.add(pad);
    var pprof = [[0, 0], [0.26, 0], [0.27, 0.03], [0.14, 0.08], [0.11, 0.62], [0.2, 0.7], [0.24, 0.74], [0.24, 0.78], [0, 0.78]].map(function (p) { return new T.Vector2(p[0], p[1]); });
    pad.add(new T.Mesh(new T.LatheGeometry(pprof, 48), white));
    var ring = new T.Mesh(new T.TorusGeometry(0.235, 0.006, 8, 72), gold); ring.rotation.x = Math.PI / 2; ring.position.y = 0.78; pad.add(ring);
    var ring2 = new T.Mesh(new T.TorusGeometry(0.17, 0.005, 8, 72), edge); ring2.rotation.x = Math.PI / 2; ring2.position.y = 0.785; pad.add(ring2);
    var beam = new T.Mesh(new T.CylinderGeometry(0.26, 0.22, 0.8, 48, 1, true), new T.ShaderMaterial({
      uniforms: { t: { value: 0 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
      fragmentShader: 'uniform float t; varying vec2 vUv; void main(){ float s = 0.5+0.5*sin(vUv.y*90.0 - t*4.0); float a = pow(1.0-vUv.y,2.0)*0.16*(0.6+0.4*s); gl_FragColor = vec4(0.35,0.85,1.0,a); }',
      transparent: true, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide
    }));
    beam.position.y = 1.18; pad.add(beam); R.beam = beam; R.pad = pad; R.padTop = 0.78;
    R.padLight = new T.PointLight(0x6fe0ff, 0.6, 1.6); R.padLight.position.set(1.05, 1.5, -0.3); S.add(R.padLight);
    var face = new T.PointLight(0xfff4ea, 0.7, 2.4); face.position.set(0.6, 1.7, 0.4); S.add(face);
    var rim = new T.PointLight(0x7fe6ff, 0.9, 1.5); rim.position.set(1.15, 1.6, -1.0); S.add(rim);
    if (FX.setShipEnv) FX.setShipEnv(R.env);
  }

  function drawScreens() {
    var s = R.scr, g = s.g, w = s.c.width, hh = s.c.height;
    g.clearRect(0, 0, w, hh); g.fillStyle = 'rgba(6,18,30,0.85)'; g.fillRect(0, 0, w, hh);
    g.strokeStyle = 'rgba(80,220,255,0.6)'; g.lineWidth = 2; g.strokeRect(4, 4, w - 8, hh - 8);
    g.fillStyle = '#7fe3ff'; g.font = 'bold 22px sans-serif'; g.fillText('弦穹号 · 航行数据', 18, 36);
    var e = VY.engine ? V.engine(VY.engine) : null;
    g.font = '18px sans-serif'; g.fillStyle = '#cfe9ff';
    g.fillText('当前位置  ' + V.byId(VY.at).zh, 18, 74);
    g.fillText('目标  ' + (VY.target ? V.byId(VY.target).zh : '未设定'), 18, 104);
    g.fillText('引擎  ' + (e ? e.zh + '(' + e.tier + ')' : '未选择'), 18, 134);
    g.fillStyle = e ? V.TIER_COLOR[e.tier] : '#557'; g.fillRect(18, 150, 120 + 360 * (R.power || 0), 8);
    // 波形
    g.strokeStyle = 'rgba(127,227,255,0.8)'; g.beginPath();
    for (var x = 0; x < w - 36; x += 4) { var y = 205 + Math.sin(x * 0.05 + R.t * 4) * (6 + 18 * (R.power || 0)) * Math.sin(x * 0.011 + R.t); if (x) g.lineTo(18 + x, y); else g.moveTo(18 + x, y); }
    g.stroke(); s.t.needsUpdate = true;
    R.mini.forEach(function (m, k) {
      var gg = m.g, W = m.c.width, H = m.c.height; gg.clearRect(0, 0, W, H); gg.fillStyle = 'rgba(6,18,30,0.8)'; gg.fillRect(0, 0, W, H);
      gg.fillStyle = k ? '#ffd27a' : '#7fe3c4'; gg.font = '14px sans-serif'; gg.fillText(k ? '反应堆' : '生命维持', 10, 20);
      for (var b = 0; b < 8; b++) { var v = 0.5 + 0.45 * Math.sin(R.t * (1.3 + b * 0.37) + b + k); gg.fillRect(12 + b * 29, H - 12 - v * 100, 18, v * 100); }
      m.t.needsUpdate = true;
    });
  }

  /* ============================ 星璃 2.0(B3 半身全息版) ============================
   * 底模 VRoid AvatarSample_G(CC0),贴图重绘:银青发、青色瞳、银白潮牌科技夹克 + 鎏金流光饰线、灰色高领内搭。
   * 程序附加:双马尾 + 鎏金发扣、颈挂耳机、夹克高立领;全息效果:腰部以下裁切(光环升起的半身像)、浮动六边形图标、光点。 */
  var A = { vrm: null, mood: 'neutral', talk: 0, blinkT: 2, look: new T.Object3D(), waveT: 0, tilt: 0, bob: 0, wink: 0, acc: [] };
  function hairTex() {
    var c = document.createElement('canvas'); c.width = 256; c.height = 128; var g = c.getContext('2d');
    var gr = g.createLinearGradient(0, 0, 256, 0); gr.addColorStop(0, '#eef8fb'); gr.addColorStop(0.45, '#d8eef4'); gr.addColorStop(0.8, '#a6e2ef'); gr.addColorStop(1, '#7fd7ea');
    g.fillStyle = gr; g.fillRect(0, 0, 256, 128);
    for (var y = 0; y < 128; y += 2) { g.fillStyle = 'rgba(70,120,140,' + (0.05 + Math.random() * 0.16) + ')'; g.fillRect(0, y, 256, 1); }
    for (y = 0; y < 128; y += 9) { g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(0, y + (Math.random() * 4 | 0), 256, 1); }
    var t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; return t;
  }
  function taperTube(curve, r0, seg, rad, prof) {
    var g = new T.TubeGeometry(curve, seg, 1, rad, false), p = g.attributes.position, v = new T.Vector3(), c = new T.Vector3();
    for (var i = 0; i <= seg; i++) {
      var t = i / seg; curve.getPointAt(t, c); var r = r0 * prof(t);
      for (var j = 0; j <= rad; j++) { var k = i * (rad + 1) + j; v.fromBufferAttribute(p, k).sub(c); v.x *= r; v.y *= r; v.z *= r * 0.75; v.add(c); p.setXYZ(k, v.x, v.y, v.z); }
    }
    g.computeVertexNormals(); return g;
  }
  function hexTex(glyph) {
    var c = document.createElement('canvas'); c.width = c.height = 128; var g = c.getContext('2d');
    g.strokeStyle = 'rgba(140,235,255,0.95)'; g.lineWidth = 5; g.fillStyle = 'rgba(40,170,230,0.18)';
    g.beginPath(); for (var i = 0; i < 6; i++) { var a = Math.PI / 6 + i * Math.PI / 3; g[i ? 'lineTo' : 'moveTo'](64 + Math.cos(a) * 54, 64 + Math.sin(a) * 54); } g.closePath(); g.fill(); g.stroke();
    g.strokeStyle = 'rgba(255,205,120,1)'; g.lineWidth = 4; g.beginPath();
    if (glyph === 0) { g.arc(64, 64, 20, 0, 6.283); g.moveTo(40, 64); g.lineTo(88, 64); }
    else if (glyph === 1) { g.moveTo(44, 80); g.lineTo(64, 44); g.lineTo(84, 80); g.closePath(); }
    else if (glyph === 2) { g.moveTo(42, 64); g.lineTo(86, 64); g.moveTo(74, 52); g.lineTo(86, 64); g.lineTo(74, 76); }
    else { g.arc(64, 64, 8, 0, 6.283); g.moveTo(84, 64); g.arc(64, 64, 20, 0, 4.5); }
    g.stroke(); var t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; return t;
  }
  function addAccessories(vrm, clip) {
    var head = bone('Head'), neck = bone('Neck');
    var hm = new T.MeshStandardMaterial({ map: hairTex(), roughness: 0.45, metalness: 0.1, emissive: 0x2a5a66, emissiveIntensity: 0.25, side: T.DoubleSide });
    var gold = new T.MeshBasicMaterial({ color: 0xffc77e, toneMapped: false });
    var graph = new T.MeshStandardMaterial({ color: 0x2a2e35, roughness: 0.35, metalness: 0.7 });
    var silver = new T.MeshStandardMaterial({ color: 0xdfe4ea, roughness: 0.25, metalness: 0.85 });
    var jacket = new T.MeshPhysicalMaterial({ color: 0xeef0f2, roughness: 0.5, metalness: 0.05, clearcoat: 0.3, side: T.DoubleSide });
    [hm, gold, graph, silver, jacket].forEach(function (m) { m.clippingPlanes = clip; });
    if (head) {
      [-1, 1].forEach(function (s) {
        var tg = new T.Group(); tg.position.set(s * 0.085, 0.165, 0.035); head.add(tg); A.acc.push({ g: tg, s: s });
        var cv = new T.CatmullRomCurve3([[0, 0, 0], [s * 0.05, 0.0, 0.02], [s * 0.1, -0.08, 0.05], [s * 0.13, -0.3, 0.06], [s * 0.13, -0.58, 0.05], [s * 0.1, -0.86, 0.06], [s * 0.07, -1.02, 0.08]].map(function (p) { return new T.Vector3(p[0], p[1], p[2]); }));
        var prof = function (t) { return t < 0.08 ? 0.45 + t * 6 : Math.max(0.06, 1.0 - Math.pow((t - 0.08) / 0.92, 1.6) * 0.95) * (0.92 + 0.08 * Math.sin(t * 12)); };
        tg.add(new T.Mesh(taperTube(cv, 0.065, 72, 14, prof), hm));
        // 外层几缕发丝,让发束更蓬松
        [[0.012, 0.01], [-0.014, -0.008]].forEach(function (o, k) {
          var cv2 = new T.CatmullRomCurve3(cv.points.map(function (p, i) { return new T.Vector3(p.x + o[0] * i, p.y, p.z + o[1] * i); }));
          tg.add(new T.Mesh(taperTube(cv2, 0.035, 60, 10, function (t) { return Math.max(0.05, 1 - t * 0.95); }), hm));
        });
        // 鎏金发扣(概念图:发根处发光金色圆筒)
        var clipG = new T.Group(); clipG.position.set(s * 0.02, 0.0, 0.005); clipG.rotation.z = s * 1.2; tg.add(clipG);
        clipG.add(new T.Mesh(new T.CylinderGeometry(0.034, 0.034, 0.05, 28, 1, true), graph));
        [-0.022, 0.022].forEach(function (y) { var r = new T.Mesh(new T.TorusGeometry(0.035, 0.005, 6, 32), gold); r.rotation.x = Math.PI / 2; r.position.y = y; clipG.add(r); });
      });
    }
    if (neck) {
      // 颈挂耳机
      var hp = new T.Group(); hp.position.set(0, 0.0, 0.0); neck.add(hp);
      var arc = new T.Mesh(new T.TorusGeometry(0.082, 0.011, 10, 40, Math.PI * 1.15), graph); arc.rotation.set(Math.PI / 2 - 0.25, 0, Math.PI * 0.0 - Math.PI * 0.075); arc.position.set(0, -0.005, 0.015); hp.add(arc);
      [-1, 1].forEach(function (s) {
        var cup = new T.Group(); cup.position.set(s * 0.086, -0.03, -0.012); cup.rotation.z = s * 0.25; hp.add(cup);
        var c1 = new T.Mesh(new T.CylinderGeometry(0.043, 0.043, 0.034, 32), silver); c1.rotation.z = Math.PI / 2; cup.add(c1);
        var c2 = new T.Mesh(new T.CylinderGeometry(0.032, 0.032, 0.038, 32), graph); c2.rotation.z = Math.PI / 2; c2.position.x = s * 0.004; cup.add(c2);
        var gr = new T.Mesh(new T.TorusGeometry(0.04, 0.0035, 6, 36), gold); gr.rotation.y = Math.PI / 2; gr.position.x = s * 0.019; cup.add(gr);
      });
      // 夹克高立领(前方敞开)
      var col = new T.Mesh(new T.CylinderGeometry(0.098, 0.072, 0.085, 40, 1, true, Math.PI + 0.55, Math.PI * 2 - 1.1), jacket); col.position.set(0, -0.045, 0.005); neck.add(col);
      var ce = new T.Mesh(new T.TorusGeometry(0.098, 0.003, 6, 60, Math.PI * 2 - 1.1), gold); ce.rotation.set(Math.PI / 2, 0, -(Math.PI / 2 + 0.55) + Math.PI); ce.position.set(0, -0.0025, 0.005); neck.add(ce);
    }
    // 全息:裁切环、浮动六边形图标、光点
    var ringS = new T.Sprite(new T.SpriteMaterial({ map: radialTex([[0, 'rgba(140,230,255,0.0)'], [0.55, 'rgba(140,230,255,0.0)'], [0.8, 'rgba(140,230,255,0.55)'], [1, 'rgba(140,230,255,0)']]), blending: T.AdditiveBlending, depthWrite: false, toneMapped: false }));
    ringS.scale.set(0.42, 0.1, 1); ringS.material.opacity = 0.7; ringS.position.set(0, R.cutY + 0.005, 0); R.pad.add(ringS);
    A.hex = [];
    for (var i = 0; i < 4; i++) {
      var sp = new T.Sprite(new T.SpriteMaterial({ map: hexTex(i), transparent: true, opacity: 0.9, blending: T.AdditiveBlending, depthWrite: false, toneMapped: false }));
      sp.scale.setScalar(i % 2 ? 0.075 : 0.09); R.pad.add(sp); A.hex.push({ s: sp, a: i / 4 * 6.283 + 0.4, y: [1.38, 1.18, 1.5, 1.08][i], r: [0.3, 0.32, 0.26, 0.28][i] });
    }
    var n = R.tier === 'low' ? 80 : 180, sp3 = new Float32Array(n * 3), sc = new Float32Array(n * 3); A.spk = [];
    for (i = 0; i < n; i++) { A.spk.push([Math.random() * 6.283, 0.12 + Math.random() * 0.24, R.cutY + Math.random() * 0.85, 0.2 + Math.random() * 0.6]); var gc2 = Math.random() < 0.35 ? [1, 0.8, 0.45] : [0.5, 0.9, 1]; sc.set(gc2, i * 3); }
    var spg = new T.BufferGeometry(); spg.setAttribute('position', new T.BufferAttribute(sp3, 3)); spg.setAttribute('color', new T.BufferAttribute(sc, 3));
    A.spkPts = new T.Points(spg, new T.PointsMaterial({ size: 0.01, map: radialTex([[0, 'rgba(255,255,255,1)'], [1, 'rgba(255,255,255,0)']]), vertexColors: true, transparent: true, blending: T.AdditiveBlending, depthWrite: false, toneMapped: false }));
    R.pad.add(A.spkPts);
  }
  function updHolo(dt, t) {
    A.acc.forEach(function (a) { a.g.rotation.z = a.s * (0.03 * Math.sin(t * 1.3 + a.s)) ; a.g.rotation.x = 0.04 * Math.sin(t * 1.1); });
    if (A.hex) A.hex.forEach(function (h, i) { var a = h.a + t * 0.25; h.s.position.set(Math.cos(a) * h.r, h.y + Math.sin(t * 1.2 + i) * 0.02, Math.sin(a) * h.r * 0.6); h.s.material.opacity = 0.55 + 0.35 * Math.sin(t * 2 + i * 1.7); });
    if (A.spkPts) {
      var p = A.spkPts.geometry.attributes.position;
      A.spk.forEach(function (s, i) { s[2] += dt * 0.06 * s[3]; if (s[2] > R.cutY + 0.9) s[2] = R.cutY; var a = s[0] + t * 0.3 * s[3]; p.setXYZ(i, Math.cos(a) * s[1], s[2], Math.sin(a) * s[1] * 0.7); });
      p.needsUpdate = true;
    }
  }
  function loadAvatar() {
    if (R.mode25) return R.c25.ready.then(function () { UI.load.classList.add('out'); setTimeout(function () { UI.load.hidden = true; }, 400); return board(); });
    return new Promise(function (res) {
      if (!window.THREE_VRM || !T.GLTFLoader) { console.warn('[voy] VRM 库缺失'); return res(null); }
      fetch('xingli.vrm').then(function (r) { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); }).then(function (buf) {
        new T.GLTFLoader().parse(buf, '', function (gltf) {
          THREE_VRM.VRMUtils.removeUnnecessaryJoints(gltf.scene);
          THREE_VRM.VRM.from(gltf, { materialImporter: new THREE_VRM.VRMMaterialImporter({ encoding: T.sRGBEncoding }) }).then(function (vrm) {
            A.vrm = vrm; var s = vrm.scene;
            // 半身像:按髋部高度定位,腰部以下用裁切平面隐去
            s.updateMatrixWorld(true); var hip = vrm.humanoid.getBoneNode(THREE_VRM.VRMSchema.HumanoidBoneName.Hips), hp = new T.Vector3();
            hip.getWorldPosition(hp); var K = 0.8; A.K = K; A.y0 = R.padTop + 0.1 - hp.y * K;
            R.cutY = R.padTop + 0.11 + 0.06;
            R.clip = [new T.Plane(new T.Vector3(0, 1, 0), -R.cutY)]; R.r.localClippingEnabled = true;
            s.traverse(function (o) { o.frustumCulled = false; if (o.material) [].concat(o.material).forEach(function (m) { m.toneMapped = false; m.clippingPlanes = R.clip; m.clipping = true; }); });
            s.scale.setScalar(K); s.position.set(0, A.y0, 0); s.rotation.y = Math.PI - 0.35;   // VRM 0.x 默认朝 -Z,转向船长
            R.pad.add(s);
            A.look.position.set(0, 1.5, 1.2); R.in.add(A.look); vrm.lookAt.target = A.look;
            pose(0); addAccessories(vrm, R.clip); res(vrm);
          }).catch(function (e) { console.warn('[voy] VRM 解析失败', e); res(null); });
        }, function (e) { console.warn('[voy] glTF 解析失败', e); res(null); });
      }).catch(function (e) { console.warn('[voy] 星璃模型加载失败', e); res(null); });
    });
  }
  function bone(n) { var H = THREE_VRM.VRMSchema.HumanoidBoneName; return A.vrm && A.vrm.humanoid.getBoneNode(H[n]); }
  function bs(n, v) { if (!A.vrm || !A.vrm.blendShapeProxy) return; var P = THREE_VRM.VRMSchema.BlendShapePresetName; try { A.vrm.blendShapeProxy.setValue(P[n] || n, v); } catch (e) { } }
  var REST = {}, QE = new T.Quaternion(), EU = new T.Euler();
  function rot(n, x, y, z) {
    var b = bone(n); if (!b) return;
    if (!REST[n]) REST[n] = b.quaternion.clone();
    EU.set(x || 0, y || 0, z || 0); QE.setFromEuler(EU); b.quaternion.copy(REST[n]).multiply(QE);
  }
  function pose(t) {
    if (!A.vrm) return;
    var br = Math.sin(t * 1.6) * 0.025, wave = A.waveT > 0 ? Math.min(1, A.waveT) : 0, S = SH.voyArm || { s: -1 };
    rot('LeftUpperArm', 0.05, 0, S.s * (-1.15 - br));
    rot('LeftLowerArm', 0, S.s * -0.25, S.s * -0.12);
    rot('RightUpperArm', 0.05 + wave * -0.3, 0, S.s * (1.15 + br - wave * 2.25));
    rot('RightLowerArm', 0, S.s * 0.25, S.s * (0.12 + wave * (0.9 + 0.35 * Math.sin(t * 10))));
    rot('Spine', br * 0.6, 0, 0); rot('Chest', 0, Math.sin(t * 0.7) * 0.04, 0);
    rot('Head', 0, 0, A.tilt * 0.22 + Math.sin(t * 0.9) * 0.03);
    rot('Neck', Math.sin(t * 1.1) * 0.02, 0, 0);
  }
  var MOOD = { neutral: {}, joy: { Joy: 0.8 }, fun: { Fun: 0.7 }, sorrow: { Sorrow: 0.6 }, angry: { Angry: 0.5 }, surprised: { Joy: 0.25, O: 0.0, surprise: 1 }, think: { Fun: 0.15, tilt: 1 } };
  function setMood(m) {
    A.mood = m; var o = MOOD[m] || {};
    ['Joy', 'Fun', 'Sorrow', 'Angry'].forEach(function (k) { A['m_' + k] = o[k] || 0; });
    A.tiltT = o.tilt ? 1 : 0; A.surprise = o.surprise ? 0.9 : 0;
  }
  var CUR = { Joy: 0, Fun: 0, Sorrow: 0, Angry: 0 };
  function updAvatar(dt, t) {
    if (!A.vrm) return;
    ['Joy', 'Fun', 'Sorrow', 'Angry'].forEach(function (k) { CUR[k] += ((A['m_' + k] || 0) - CUR[k]) * Math.min(1, dt * 6); bs(k, CUR[k]); });
    A.tilt += ((A.tiltT || 0) - A.tilt) * Math.min(1, dt * 4);
    // 眨眼
    A.blinkT -= dt; var bl = 0; if (A.blinkT < 0.15) bl = Math.sin(Math.max(0, A.blinkT) / 0.15 * Math.PI); if (A.blinkT < 0) A.blinkT = 2 + Math.random() * 3.5;
    bs('Blink', CUR.Joy > 0.5 ? 0 : bl);
    if (A.wink > 0) { A.wink -= dt * 1.4; bs('BlinkR', Math.sin(Math.min(1, Math.max(0, A.wink)) * Math.PI)); }
    // 说话口型:A I U E O 轮换
    var mouth = { A: 0, I: 0, U: 0, E: 0, O: 0 };
    if (A.talk > 0) { var seq = ['A', 'I', 'U', 'E', 'O'], ph = t * 11, k = seq[Math.floor(ph) % 5]; mouth[k] = 0.35 + 0.45 * Math.abs(Math.sin(ph * Math.PI)); }
    if (A.surprise > 0) { mouth.O = Math.max(mouth.O, A.surprise); A.surprise = Math.max(0, A.surprise - dt * 0.5); }
    Object.keys(mouth).forEach(function (k) { bs(k, mouth[k]); });
    if (A.waveT > 0) A.waveT -= dt * 0.45;
    // 视线跟随指针
    A.look.position.set(R.mouse.x * 0.9, 1.5 + R.mouse.y * 0.5, 1.6);
    A.vrm.scene.position.y = A.y0 + Math.sin(t * 1.4) * 0.006;
    pose(t); A.vrm.update(dt);
  }

  /* ---------- 对话 ---------- */
  var sayTimer = null;
  function say(line, opts, choices) {
    var mood = line[0], text = fill(line[1], opts || {});
    setMood(mood); UI.say.classList.remove('is-in'); void UI.say.offsetWidth; UI.say.classList.add('is-in');
    UI.sayT.textContent = ''; UI.sayCh.innerHTML = '';
    clearInterval(sayTimer); var i = 0; A.talk = 1;
    if (VY.tts && window.speechSynthesis) { try { speechSynthesis.cancel(); var u = new SpeechSynthesisUtterance(text.replace(/[~「」]/g, '')); u.lang = 'zh-CN'; u.pitch = 1.45; u.rate = 1.05; speechSynthesis.speak(u); } catch (e) { } }
    return new Promise(function (res) {
      sayTimer = setInterval(function () {
        i += 1; UI.sayT.textContent = text.slice(0, i); if (i % 2) sfx.blip();
        if (i >= text.length) {
          clearInterval(sayTimer); A.talk = 0;
          if (choices && choices.length) {
            choices.forEach(function (c) { var b = h('button', 'voy-ch' + (c.cls ? ' ' + c.cls : ''), esc(c.label)); b.type = 'button'; b.addEventListener('click', function () { sfx.click(); UI.sayCh.innerHTML = ''; res(c.value); }); UI.sayCh.appendChild(b); });
          } else res();
        }
      }, 34);
    });
  }
  function sayList(list, opts) { var p = Promise.resolve(); list.forEach(function (l) { p = p.then(function () { return say(l, opts); }).then(function () { return wait(900); }); }); return p; }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  /* ============================ 引擎面板 ============================ */
  function buildEngines() {
    UI.engList.innerHTML = '';
    V.engines.forEach(function (e, i) {
      var b = h('button', 'voy-e', '<i style="background:' + V.TIER_COLOR[e.tier] + '"></i><span>' + e.icon + ' ' + esc(e.zh) + '</span><em style="color:' + V.TIER_COLOR[e.tier] + '">' + e.tier + '</em>');
      b.type = 'button'; b.dataset.id = e.id; b.addEventListener('click', function () { pickEngine(e.id); });
      UI.engList.appendChild(b);
    });
  }
  function markEngines() {
    var to = VY.target;
    UI.root.querySelectorAll('.voy-e, .hub-e').forEach(function (b) {
      var e = V.engine(b.dataset.id); b.classList.toggle('is-sel', VY.engine === e.id); b.classList.toggle('is-fit', !!(to && e.fit.indexOf(to) >= 0));
      b.disabled = VY.state === 'travel' || (to === 'outer' ? e.id !== 'mind' : e.id === 'mind');
    });
    var e = VY.engine && V.engine(VY.engine);
    UI.engInfo.innerHTML = e ? '<b style="color:' + V.TIER_COLOR[e.tier] + '">' + e.tier + '</b> ' + esc(e.fact) : '<span class="voy-dim">转动左侧旋钮或点选引擎。三种颜色代表科学可信度:<b style="color:#7fe3c4">实测</b> / <b style="color:#ffd27a">推断</b> / <b style="color:#c9a6ff">猜想</b>。</span>';
    if (R.knob) { var idx = e ? V.engines.indexOf(e) : 0; R.knobTarget = -(-Math.PI * 0.8 + idx / (V.engines.length - 1) * Math.PI * 1.6); }
  }

  /* ============================ 航图 ============================ */
  function openMap() { UI.map.hidden = false; UI.mapCard.hidden = true; atlasOpen(); sfx.open(); }
  function mapTap(cx, cy) {
    var rect = UI.mapCv.getBoundingClientRect(), x = cx - rect.left, y = cy - rect.top, best = null, bd = 30;
    V.sectors.forEach(function (s) { if (!s._xy) return; var d = Math.hypot(s._xy[0] - x, s._xy[1] - y); if (d < bd) { bd = d; best = s; } });
    if (!best) return; sfx.sector(best.id); if (AT) { AT.sel = best.id; atlasRoute(); }
    var here = best.id === VY.at;
    UI.mapCard.hidden = false;
    UI.mapCard.innerHTML = '<div class="voy-mc__k">星域 ' + best.n + (best.star ? ' · ' + best.star : '') + ' · <em>' + V.STATUS_ZH[best.status] + '</em></div><h3>' + esc(best.zh) + ' <small>' + best.en + '</small></h3>' +
      '<p>' + esc(best.blurb) + '</p><p class="voy-dim">' + esc(best.label) + ' · ' + esc(best.scale) + '</p>';
    var b = h('button', 'voy-go', here ? '你在这里' : '设为航线目标 →'); b.type = 'button'; b.disabled = here || VY.state === 'travel';
    b.addEventListener('click', function () { UI.map.hidden = true; setTarget(best.id); });
    UI.mapCard.appendChild(b);
    if (here && best.id === 'moon' && SH.moonLab) { var ml = h('button', 'voy-go', '🌓 进入月相实验室'); ml.type = 'button'; ml.addEventListener('click', function () { UI.map.hidden = true; SH.moonLab.open(); }); UI.mapCard.appendChild(ml); }
  }

  /* ============================ 航行流程 ============================ */
  function distKm(from, to) {
    var a = V.byId(from), b = V.byId(to);
    if (!isFinite(b.km)) return Infinity;
    return Math.max(400, Math.abs(b.km - (a.id === 'home' ? 0 : a.km)));
  }
  function setLoc() {
    var s = V.byId(VY.at); UI.locN.textContent = '星域 ' + s.n; UI.locZh.textContent = s.zh; UI.locSt.textContent = V.STATUS_ZH[s.status]; UI.locSt.className = 'voy-loc__st st-' + s.status;
  }
  function dash(o) {
    o = o || {};
    UI.d.to.textContent = VY.target ? V.byId(VY.target).zh : '—';
    if (o.dist != null) UI.d.dist.textContent = V.fmtDist(o.dist);
    if (o.v != null) UI.d.v.textContent = V.fmtSpeed(o.v);
    if (o.te != null) UI.d.te.textContent = V.fmtTime(o.te);
    if (o.ts != null) UI.d.ts.textContent = V.fmtTime(o.ts);
    if (o.sig != null) UI.d.sig.textContent = V.fmtTime(o.sig);
    if (o.x != null) UI.d.x.textContent = o.x;
  }
  function setTarget(id) {
    VY.target = id; VY.engine = null; VY.state = 'plan'; markEngines(); hideCtrl();
    var d = distKm(VY.at, id); VY.dist = d;
    dash({ dist: d, te: 0, ts: 0, v: 0, x: '—' });
    var s = V.byId(id);
    say(V.lines.pickEngine, { to: s.zh, dist: V.fmtDist(d) });
    UI.root.classList.add('pick-engine'); if (R.mode25) setTimeout(openHub, 350);
  }
  function pickEngine(id) {
    if (VY.state === 'travel') return;
    if (!VY.target) { closeHub(true); say(['think', '船长,先在航图上选一个目的地哦~']).then(function () { openMap(); }); return; }
    VY.engine = id; sfx.tick(); markEngines(); UI.root.classList.remove('pick-engine');
    var e = V.engine(id), d = VY.dist;
    if (e.model === 'none') { VY.state = 'control'; say(V.lines.arriveOuter).then(function () { showCtrl(e); }); return; }
    var tr = V.travel(e, d, e.ctrl === 'slider' ? (e.id === 'rel' ? 1 : 1) : (e.id === 'warp' ? 6 : null));
    VY.state = 'guess';
    // 先猜:真实时间 / 慢一百倍 / 快一百倍
    var real = tr.earthS, opts = [real, real * 120, real / 90].map(function (s) { return { label: V.fmtTime(s), value: s === real }; });
    if (opts[2].label === opts[0].label) opts[2] = { label: V.fmtTime(real / 3000), value: false };
    opts.sort(function () { return Math.random() - 0.5; });
    say(V.lines.guessQ, { eng: e.zh }, opts).then(function (ok) {
      if (!ST.engines.includes(e.id)) { ST.engines.push(e.id); save(ST); }
      return (ok ? say(V.lines.guessRight) : say(V.lines.guessWrong, { t: V.fmtTime(real) })).then(function () { return wait(500); });
    }).then(function () {
      var fit = e.fit.indexOf(VY.target) >= 0, slow = tr.earthS > 3.15e9 && tr.shipS > 3.15e9; // 船上、地球都超过 100 年
      var p = Promise.resolve();
      if (slow) p = say(V.lines.tooSlow, { eng: e.zh, t: V.fmtTime(tr.shipS) }, [{ label: '换一台引擎', value: 'swap' }, { label: '演示模式,照样出发', value: 'go', cls: 'alt' }]);
      return p.then(function (v) {
        if (v === 'swap') { VY.engine = null; VY.state = 'plan'; markEngines(); UI.root.classList.add('pick-engine'); return; }
        var q = Promise.resolve();
        if (e.tier === '猜想') q = say(V.lines.tooFastNote, { eng: e.zh, tier: e.tier }).then(function () { return wait(700); });
        return q.then(function () { VY.state = 'control'; showCtrl(e); return say(fit ? V.lines.fitOk : V.lines.goAnyway, { how: e.how }); });
      });
    });
  }

  /* ---------- 操纵:四种控件 ---------- */
  function hideCtrl() { UI.ctrl.hidden = true; UI.ctrl.innerHTML = ''; R.power = 0; }
  function showCtrl(e) {
    var c = UI.ctrl; c.hidden = false; c.innerHTML = '<div class="voy-ctrl__h">' + e.icon + ' ' + esc(e.zh) + ' <em style="color:' + V.TIER_COLOR[e.tier] + '">' + e.tier + '</em></div>';
    var body = h('div', 'voy-ctrl__b'); c.appendChild(body);
    var done = function (param) { hideCtrl(); launch(e, param); };
    if (e.ctrl === 'hold') {
      var lbl = { chem: '点火', laser: '充能', warp: '负能量充能', mind: '闭上眼睛想' }[e.id] || '点火';
      var bar = h('div', 'voy-bar', '<i></i>'), b = h('button', 'voy-hold', '按住 · ' + lbl); b.type = 'button'; body.appendChild(bar); body.appendChild(b);
      var v = 0, hold = false, raf;
      var stepH = function () { v = Math.max(0, Math.min(1, v + (hold ? 0.012 : -0.02))); bar.firstChild.style.width = (v * 100) + '%'; R.power = v; if (v >= 1) { done(e.id === 'warp' ? 6 : null); return; } raf = requestAnimationFrame(stepH); };
      var on = function (ev) { ev.preventDefault(); hold = true; sfx.click(); }, off = function () { hold = false; };
      b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointerleave', off); b.addEventListener('pointercancel', off);
      raf = requestAnimationFrame(stepH);
      if (e.id === 'warp') body.insertBefore(h('p', 'voy-dim', '曲率按 100 万倍光速演示(纯属假设)。'), bar);
    } else if (e.ctrl === 'slider') {
      var isRel = e.id === 'rel';
      var lab = h('label', 'voy-sl', (isRel ? '加速度 ' : '电功率 ') + '<b></b><input type="range" min="' + (isRel ? 0.5 : 0.1) + '" max="' + (isRel ? 3 : 1) + '" step="' + (isRel ? 0.5 : 0.1) + '" value="1">');
      var out = h('p', 'voy-dim'); body.appendChild(lab); body.appendChild(out);
      var inp = lab.querySelector('input'), bv = lab.querySelector('b');
      var upd = function () {
        var p = +inp.value, tr = V.travel(e, VY.dist, p); R.power = isRel ? p / 3 : p;
        bv.textContent = isRel ? p + ' g' : Math.round(p * 100) + '%';
        out.innerHTML = '地球时间 <b>' + V.fmtTime(tr.earthS) + '</b> · 船上时间 <b>' + V.fmtTime(tr.shipS) + '</b>' + (isRel ? ' · 最高 ' + V.fmtSpeed(tr.vmax) : '');
        R.leverTarget = (R.power - 0.5) * 0.2;
      };
      inp.addEventListener('input', function () { sfx.tick(); upd(); }); upd();
      var go = h('button', 'voy-go', '启动 →'); go.type = 'button'; go.addEventListener('click', function () { done(+inp.value); }); body.appendChild(go);
    } else if (e.ctrl === 'timing') {
      var track = h('div', 'voy-track', '<span class="voy-track__zone"></span><span class="voy-track__cur"></span>'), tb = h('button', 'voy-hold', e.id === 'assist' ? '借力!' : '约束!'); tb.type = 'button';
      var msg = h('p', 'voy-dim', e.id === 'assist' ? '飞船正掠过木星。窗口只有一瞬间。' : '等离子体在晃动,稳住它。');
      body.appendChild(msg); body.appendChild(track); body.appendChild(tb);
      var zone = track.querySelector('.voy-track__zone'), cur = track.querySelector('.voy-track__cur'), z0 = 0.55 + Math.random() * 0.25, zw = 0.13, pos = 0, dir = 1, rafT, tries = 0;
      zone.style.left = (z0 * 100) + '%'; zone.style.width = (zw * 100) + '%';
      var stepT = function () { pos += dir * 0.011; if (pos > 1) { pos = 1; dir = -1; } if (pos < 0) { pos = 0; dir = 1; } cur.style.left = (pos * 100) + '%'; rafT = requestAnimationFrame(stepT); };
      rafT = requestAnimationFrame(stepT);
      tb.addEventListener('click', function () {
        tries++;
        if (pos >= z0 && pos <= z0 + zw) { cancelAnimationFrame(rafT); sfx.glass(988); R.power = 1; done(null); }
        else { sfx.tick(); msg.textContent = tries >= 3 ? '没关系,星璃帮你算好时机了。' : '差一点!再试一次。'; if (tries >= 3) { cancelAnimationFrame(rafT); setTimeout(function () { done(null); }, 900); } }
      });
    } else if (e.ctrl === 'align') {
      var dial = h('div', 'voy-dial', '<div class="voy-dial__t"></div><div class="voy-dial__n"></div>'), info = h('p', 'voy-dim', e.id === 'sail' ? '拖动转盘,让帆面(白针)对准太阳(金点)。' : '拖动坐标环,对准目标(青点)。');
      body.appendChild(info); body.appendChild(dial);
      var tgtA = (Math.random() * 300 + 30) * Math.PI / 180, ang = 0, drag = false;
      var tEl = dial.querySelector('.voy-dial__t'), nEl = dial.querySelector('.voy-dial__n');
      tEl.style.transform = 'rotate(' + tgtA + 'rad) translateY(-62px)'; if (e.id !== 'sail') tEl.classList.add('cyan');
      var set = function () { nEl.style.transform = 'rotate(' + ang + 'rad)'; var dlt = Math.abs(Math.atan2(Math.sin(ang - tgtA), Math.cos(ang - tgtA))); R.power = 1 - dlt / Math.PI; if (dlt < 0.09) { drag = false; sfx.glass(1175); info.textContent = '对准了!'; setTimeout(function () { done(null); }, 500); dial.style.pointerEvents = 'none'; } };
      var mv = function (ev) { if (!drag) return; var rc = dial.getBoundingClientRect(); ang = Math.atan2(ev.clientX - (rc.left + rc.width / 2), -(ev.clientY - (rc.top + rc.height / 2))); set(); };
      dial.addEventListener('pointerdown', function (ev) { drag = true; dial.setPointerCapture(ev.pointerId); mv(ev); });
      dial.addEventListener('pointermove', mv); dial.addEventListener('pointerup', function () { drag = false; });
      set();
    }
  }

  function launch(e, param) {
    var d = VY.dist, to = VY.target, from = VY.at, tr = V.travel(e, d, param);
    VY.state = 'travel'; markEngines(); sfx.ignite(e); R.shake = e.id === 'chem' ? 1 : 0.35;
    if (e.model === 'none') tr = { earthS: Infinity, shipS: Infinity, vmax: 0 };
    say(e.id === 'mind' ? ['think', '闭上眼睛……想象我们越过了宇宙视界。从这里开始,只有理论,没有观测。'] : V.lines.ignite);
    var dur = e.id === 'gate' ? 6000 : e.id === 'mind' ? 6500 : 8000, t0 = performance.now(), swapped = false;
    var x = isFinite(tr.earthS) ? Math.max(1, tr.earthS / (dur / 1000)) : null;
    setTimeout(function () { sfx.whoosh(dur / 1000); }, 400);
    dash({ x: x ? '×' + fmtBig(x) : '—' });
    if (!FX.CINEMATIC || FX.CINEMATIC[e.id]) FX.setWarp(e.id, true); if (FX.engStart) FX.engStart(e.id); showLook(e.id); fade(0); evaBtnSync();
    if (e.id === 'warp' && FX.evaSet) {   // 曲率点火:切舱外镜头 2.6 秒看曲率环亮起(猜想,示意)
      FX.evaSet(true); FX.eva.k = 0.8; FX.eva.warp = 1;
      setTimeout(function () { if (FX.eva.warp) { FX.evaSet(false); FX.eva.k = 0; FX.ship.visible = false; R.evaView = false; } }, 2600);
    }
    var cruiseSaid = false, relSaid = false;
    function step(now) {
      var k = Math.min(1, (now - t0) / dur), ease = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      var done = isFinite(d) ? d * ease : null;
      var v = e.model === 'accel' ? tr.vmax * Math.sin(Math.PI * k) : e.model === 'warp' ? tr.vmax * Math.sin(Math.PI * k) : tr.vmax * Math.min(1, Math.sin(Math.PI * k) * 1.4);
      var fromKm = V.byId(from).id === 'home' ? 0 : V.byId(from).km, curKm = isFinite(d) ? fromKm + (V.byId(to).km > fromKm ? 1 : -1) * done : Infinity;
      dash({ dist: isFinite(d) ? d - done : Infinity, v: Math.max(0, v), te: isFinite(tr.earthS) ? tr.earthS * ease : Infinity, ts: isFinite(tr.shipS) ? tr.shipS * ease : Infinity, sig: isFinite(curKm) ? Math.max(0.001, curKm / V.C) : Infinity });
      if (k > 0.25 && !cruiseSaid && isFinite(tr.earthS)) { cruiseSaid = true; say(V.lines.cruise, { t: V.fmtTime(tr.earthS), x: fmtBig(x) }); }
      if (k > 0.6 && !relSaid && e.model === 'accel') { relSaid = true; say(V.lines.relNote, { ship: V.fmtTime(tr.shipS), earth: V.fmtTime(tr.earthS) }); }
      if (k > 0.55 && !swapped) { swapped = true; fade(1); setTimeout(function () { FX.show(to); fade(0); }, 450); }
      if (k > 0.8) { FX.setWarp(e.id, false); if (FX.engStop) FX.engStop(); }
      if (FX.engStep) FX.engStep(k, (e.model === 'accel' || e.id === 'fusion' || e.id === 'laser') ? Math.max(0, v) / V.C : 0);
      R.power = Math.sin(Math.PI * k);
      sfx.hum(isFinite(tr.earthS) && v > 0 ? Math.min(1, Math.max(0.05, Math.log10(Math.max(1, v)) / 8)) : 0.3 * R.power);   // 嗡鸣随速度(对数)升高
      if (k < 1) requestAnimationFrame(step); else arrive(to);
    }
    requestAnimationFrame(step);
  }
  /* ---------- 画面说明角标:真实物理 / 艺术示意 ---------- */
  function showLook(id) {
    if (!UI.look) return; var L = id && FX.ENG_LOOK && FX.ENG_LOOK[id];
    if (!L) { UI.look.hidden = true; return; }
    UI.look.hidden = false; UI.look.className = 'voy-look' + (L[0] === '艺术示意' ? ' is-art' : '');
    UI.look.innerHTML = '<b>画面:' + L[0] + '</b><span>' + esc(L[1]) + '</span>';
  }
  /* ---------- 舱外观景:只在未测绘星域 / 猜想外圈开放 ---------- */
  function evaBtnSync() { if (!UI.evaBtn) return; var s = V.byId(VY.at); UI.evaBtn.hidden = !(s && s.status !== 'open' && VY.state !== 'travel' && !(FX.eva && FX.eva.on)); }
  function evaIn() {
    if (!FX.evaSet || VY.state === 'travel' || (FX.eva && FX.eva.on)) return;
    UI.map.hidden = true; fade(1); P('whoosh', 4);
    setTimeout(function () { FX.evaSet(true); R.evaView = true; UI.root.classList.add('voy-eva'); UI.evaBack.hidden = false; evaBtnSync(); fade(0); }, 450);
  }
  function evaOut(quick) {
    if (!FX.eva || !FX.eva.on) return;
    var back = function () { FX.evaSet(false); FX.eva.k = 0; FX.ship.visible = false; R.evaView = false; UI.root.classList.remove('voy-eva'); UI.evaBack.hidden = true; evaBtnSync(); };
    if (quick) return back();
    fade(1); P('close'); setTimeout(function () { back(); fade(0); A.waveT = 1.2; say(['happy', '欢迎回舱,船长!外面很美吧?']); }, 450);
  }
  function fmtBig(x) { if (x < 1e4) return Math.round(x).toLocaleString('zh-CN'); if (x < 1e8) return (x / 1e4).toFixed(0) + ' 万'; if (x < 1e12) return (x / 1e8).toFixed(0) + ' 亿'; return x.toExponential(1).replace('e+', '×10^'); }
  function fade(on) { UI.fade.classList.toggle('on', !!on); }

  function arrive(id) {
    VY.at = id; VY.target = null; VY.engine = null; VY.state = 'idle'; R.shake = 0; R.power = 0; FX.setWarp(null, false); if (FX.engStop) FX.engStop(); showLook(null);
    if (ST.visited.indexOf(id) < 0) ST.visited.push(id); save(ST);
    setLoc(); markEngines(); dash({ v: 0, x: '—' }); UI.d.to.textContent = '—';
    var s = V.byId(id); sfx.arrive(id); sfx.hum(0); A.waveT = 1.4;
    banner(s);
    var line = s.status === 'open' ? V.lines.arriveOpen : s.status === 'conjecture' ? V.lines.arriveOuter : V.lines.arriveUncharted;
    var ch = [{ label: '打开航图', value: 'map' }, { label: s.status === 'open' ? '看看风景' : '⇱ 舱外观景', value: s.status === 'open' ? 'stay' : 'eva', cls: 'alt' }];
    if (id === 'moon' && SH.moonLab) ch.unshift({ label: '🌓 进入月相实验室', value: 'moonlab' });
    evaBtnSync();
    say(line, { to: s.zh, star: s.star }, ch).then(function (v) { if (v === 'map') openMap(); else if (v === 'eva') evaIn(); else if (v === 'moonlab') SH.moonLab.open(); });
  }
  function banner(s) {
    UI.banner.hidden = false;
    UI.banner.innerHTML = '<small>星域 ' + s.n + (s.star ? ' · ' + s.star + '向导' : '') + '</small><b>' + esc(s.zh) + '</b><span class="st-' + s.status + '">' + V.STATUS_ZH[s.status] + '</span><em>' + esc(s.scale) + '</em>';
    UI.banner.classList.remove('on'); void UI.banner.offsetWidth; UI.banner.classList.add('on');
    clearTimeout(UI.bT); UI.bT = setTimeout(function () { UI.banner.hidden = true; }, 5200);
  }

  function onClick3D(e) {
    if (R.mode25) {
      if (R.board || R.evaView || (R.hub && R.hub.k > 0)) return;
      var k = hit25(e);
      if (k === 'xl') { var l0 = V.lines.poke[(Math.random() * V.lines.poke.length) | 0]; A.waveT = 1.2; A.gl = 1; say(l0); }
      else if (k === 'map' && VY.state !== 'travel') { sfx.glass(880); openMap(); }
      else if (k === 'hub') { sfx.glass(660); openHub(); }
      return;
    }
    R.ptr.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); R.ray.setFromCamera(R.ptr, R.cam);
    var hits = R.ray.intersectObjects(R.in.children, true);
    for (var i = 0; i < hits.length; i++) {
      var o = hits[i].object, isAv = false, p = o; while (p) { if (A.vrm && p === A.vrm.scene) isAv = true; p = p.parent; }
      if (isAv) { var l = V.lines.poke[(Math.random() * V.lines.poke.length) | 0]; A.waveT = 1.2; A.wink = 1; setMood('joy'); say(l); return; }
      if (o === R.holoHit) { if (VY.state !== 'travel') { sfx.glass ? sfx.glass(880) : 0; openMap(); } return; }
      if (o === R.knob || o.parent === R.knob) { if (VY.state === 'travel') return; var idx = VY.engine ? V.engines.indexOf(V.engine(VY.engine)) : -1; var nx = V.engines[(idx + 1) % V.engines.length]; pickEngine(nx.id); return; }
    }
  }

  /* ============================ 驾驶舱 2.5D(M1.7b:概念图贴图 + 深度视差) ============================ */
  // 驾驶舱 = cockpit_B_luxury 原图贴图(舷窗区抠透明,露出真实舱外场景),MiDaS 深度图做鼠标视差;
  // 星璃 = B3 概念图抠像,全息着色器(扫描线/闪烁/发梢摆动/眨眼)。?ck=3d 可回到程序建模版。
  var IMG_ASP = 1408 / 768, XL_ASP = 780 / 768;
  var GAL = [480 / 900, 1 - 228 / 491], TABLE = [476 / 900, 1 - 292 / 491], DISC = [622 / 900, 1 - 342 / 491];
  function build25() {
    var L = new T.TextureLoader(), n = 0, done; R.c25 = { ready: new Promise(function (r) { done = r; }) };
    var S = new T.Scene(), cam = new T.OrthographicCamera(0, 1, 1, 0, -1, 1); R.s25 = S; R.cam25 = cam;
    function tex(u) { var t = L.load(u, function () { if (++n === 7) done(); }, undefined, function () { console.warn('[voy] 贴图加载失败', u); if (++n === 7) done(); }); t.minFilter = T.LinearFilter; t.generateMipmaps = false; return t; }
    var U = R.c25.u = { map: { value: tex('ck25.webp') }, dep: { value: tex('ck25d.jpg') }, mouse: { value: new T.Vector2() }, t: { value: 0 }, power: { value: 0 },
      sc: { value: new T.Vector4(0, 0, 1, 1) }, op: { value: 1 }, zm: { value: 1 }, zf: { value: new T.Vector2(0.5, 0.5) }, shake: { value: new T.Vector2() }, gal: { value: new T.Vector2(GAL[0], GAL[1]) } };
    var q = new T.Mesh(new T.PlaneGeometry(1, 1), new T.ShaderMaterial({ uniforms: U, transparent: true, depthWrite: false, depthTest: false,
      vertexShader: 'varying vec2 vS;void main(){vS=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader: [
        'uniform sampler2D map,dep;uniform vec2 mouse,shake,gal,zf;uniform float t,power,op,zm;uniform vec4 sc;varying vec2 vS;',
        'void main(){',
        ' vec2 uv=sc.xy+((vS-zf)/zm+zf)*sc.zw+shake;',
        ' float d=texture2D(dep,uv).r;',
        ' uv-=mouse*(d-0.32)*vec2(0.016,0.010);',             // 深度视差:近处动得多,舷窗几乎不动
        ' vec2 P=(uv-gal)*vec2(900.,491.)/vec2(80.,44.);float r=length(P);',
        ' if(r<1.){float a=0.10*sin(t*0.35)*(1.-r)*smoothstep(1.,0.6,r);float c=cos(a),s=sin(a);P=mat2(c,-s,s,c)*P;uv=mix(uv,gal+P*vec2(80.,44.)/vec2(900.,491.),smoothstep(1.,0.8,r));}',
        ' vec4 c=texture2D(map,uv);',
        ' float g=r<1.?1.+0.18*sin(t*2.1)*(1.-r):1.;',
        ' c.rgb*=g*(1.+power*0.14*vec3(1.,0.78,0.48));',
        ' gl_FragColor=vec4(c.rgb,c.a*op);}'].join('\n') }));
    q.position.set(0.5, 0.5, 0); q.renderOrder = -2; S.add(q); R.c25.bg = q;
    // —— 星璃全息像
    var X = R.c25.xu = { map: { value: tex('xl25.webp') }, bk: { value: tex('xl25b.webp') }, br: { value: new T.Vector4(0.3359, 0.6693, 0.1231, 0.0677) },
      blink: { value: 0 }, t: { value: 0 }, talk: { value: 0 }, glitch: { value: 0 }, fade: { value: 0 }, vis: { value: 1 } };
    var xm = new T.Mesh(new T.PlaneGeometry(1, 1), new T.ShaderMaterial({ uniforms: X, transparent: true, depthWrite: false, depthTest: false,
      vertexShader: 'varying vec2 vU;void main(){vU=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader: [
        'uniform sampler2D map,bk;uniform vec4 br;uniform float blink,t,talk,glitch,fade,vis;varying vec2 vU;',
        'float h(float x){return fract(sin(x*91.7)*43758.5);}',
        'void main(){vec2 uv=vU;',
        ' float side=smoothstep(0.30,0.04,uv.x)+smoothstep(0.70,0.96,uv.x);',     // 双马尾发梢在两侧,越往下摆幅越大
        ' uv.x+=side*(1.-uv.y)*0.010*sin(t*1.25+uv.y*4.);',
        ' float band=step(0.985,h(floor(uv.y*40.)+floor(t*14.)));uv.x+=band*glitch*0.02;',
        ' vec4 c=texture2D(map,uv);',
        ' vec2 b=(uv-br.xy)/br.zw;if(blink>0.&&b.x>0.&&b.x<1.&&b.y>0.&&b.y<1.){vec4 e=texture2D(bk,b);c.rgb=mix(c.rgb,e.rgb,e.a*blink);}',
        ' float l=dot(c.rgb,vec3(.3,.59,.11));',
        ' float a=c.a*mix(0.5,1.,smoothstep(0.04,0.22,l));',
        ' a*=smoothstep(0.0,0.14,uv.y);float sw=fade*1.2-0.08;a*=smoothstep(sw+0.04,sw-0.04,uv.y);',                                       // 腰部以下渐隐 = 从投影台升起
        ' float scan=0.94+0.06*sin(gl_FragCoord.y*1.6+t*9.);',
        ' float fl=0.975+0.025*sin(t*23.)*sin(t*7.3);',
        ' vec3 col=c.rgb*(1.04+talk*0.08)*scan+vec3(0.02,0.06,0.09)*(1.-uv.y*0.5);',
        ' col+=vec3(0.4,0.9,1.)*smoothstep(0.035,0.,abs(uv.y-sw))*step(fade,0.999)*c.a;',
        ' gl_FragColor=vec4(col,clamp(a*fl*min(1.,fade*1.6)*vis,0.,1.));}'].join('\n') }));
    S.add(xm); R.c25.xl = xm;
    // —— 投影光锥
    var cone = new T.Mesh(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ map: radialTex([[0, 'rgba(120,230,255,0.55)'], [0.4, 'rgba(80,200,255,0.18)'], [1, 'rgba(80,200,255,0)']]), transparent: true, blending: T.AdditiveBlending, depthWrite: false, depthTest: false }));
    S.add(cone); R.c25.cone = cone;
    buildShip25(tex); buildGal25(S); buildHub25(S, tex);
    lay25();
  }
  /* ---------- 弦穹号外观 2.5D(概念图 chordion_B_manifold 抠像 + 深度视差;曲率环为「猜想」装置)---------- */
  var SHIP_ASP = 1155 / 576, CANOPY = [0.177, 0.47], NOZZLE = [0.962, 0.565];
  function buildShip25(tex) {
    var S = new T.Scene(); R.sh25 = S;
    var U = R.sh25u = { map: { value: tex('ship25.webp') }, aux: { value: tex('ship25a.jpg') }, mouse: { value: new T.Vector2() }, t: { value: 0 }, k: { value: 0 }, warp: { value: 0 } };
    var m = new T.Mesh(new T.PlaneGeometry(1, 1), new T.ShaderMaterial({ uniforms: U, transparent: true, depthWrite: false, depthTest: false,
      vertexShader: 'varying vec2 vU;void main(){vU=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader: [
        'uniform sampler2D map,aux;uniform vec2 mouse;uniform float t,k,warp;varying vec2 vU;',
        'void main(){vec2 uv=vU;vec4 x=texture2D(aux,uv);uv-=mouse*(x.r-0.45)*vec2(0.012,0.008);x=texture2D(aux,uv);',
        ' vec4 c=texture2D(map,uv);float ring=x.g;',
        ' float pulse=0.18+0.12*sin(t*1.6);',
        ' c.rgb+=vec3(0.62,0.45,1.)*ring*(pulse+warp*2.2);',
        ' float a=clamp(c.a+ring*warp*0.6,0.,1.);',
        ' gl_FragColor=vec4(c.rgb,a*k);}'].join('\n') }));
    S.add(m); R.ship25 = m;
    var plume = new T.Mesh(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ map: radialTex([[0, 'rgba(190,230,255,0.95)'], [0.25, 'rgba(110,190,255,0.45)'], [1, 'rgba(60,140,255,0)']]), transparent: true, blending: T.AdditiveBlending, depthWrite: false, depthTest: false }));
    S.add(plume); R.plume25 = plume;
    var halo = new T.Mesh(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ map: radialTex([[0, 'rgba(170,120,255,0.5)'], [0.5, 'rgba(140,100,255,0.15)'], [1, 'rgba(140,100,255,0)']]), transparent: true, blending: T.AdditiveBlending, depthWrite: false, depthTest: false, opacity: 0 }));
    S.add(halo); R.halo25 = halo;
  }
  // 摆放飞船:zoom=1 为常规取景;focus 为放大时对准的船体 uv(登舰时对准驾驶舱舷窗)
  function placeShip(zoom, focus, dx, k) {
    var w = innerWidth, hh = innerHeight, sa = w / hh, W0 = sa < 0.8 ? 1.15 : 0.8, H0 = W0 * sa / SHIP_ASP;
    var Wq = W0 * zoom, Hq = H0 * zoom, z = Math.min(1, Math.max(0, (zoom - 1) / 3));
    var fx0 = 0.5 + (focus[0] - 0.5) * W0 + dx, fy0 = 0.52 + (focus[1] - 0.5) * H0;
    var px = fx0 + (0.5 - fx0) * z, py = fy0 + (0.5 - fy0) * z;
    var cx = px + (0.5 - focus[0]) * Wq, cy = py + (0.5 - focus[1]) * Hq;
    R.ship25.scale.set(Wq, Hq, 1); R.ship25.position.set(cx, cy, 0); R.sh25u.k.value = k;
    var nx = cx + (NOZZLE[0] - 0.5) * Wq, ny = cy + (NOZZLE[1] - 0.5) * Hq, fl = 0.85 + 0.15 * Math.sin(R.t * 31) * Math.sin(R.t * 7);
    R.plume25.scale.set(Wq * 0.3 * fl, Hq * 0.16, 1); R.plume25.position.set(nx + Wq * 0.07, ny, 0); R.plume25.material.opacity = k * 0.8;
    R.halo25.scale.set(Wq * 0.5, Hq * 1.3, 1); R.halo25.position.set(cx + Wq * 0.04, cy, 0); R.halo25.material.opacity = k * R.sh25u.warp.value;
  }
  function eio(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }
  /* ---------- 登舰动画:远景接近弦穹号 → 推进驾驶舱舷窗 → 舱内落定 → 星璃投影扫描成像 ---------- */
  function board() {
    return new Promise(function (res) {
      var B = R.board = { t0: performance.now(), res: res, dur: 4300 };
      UI.root.classList.add('voy-boarding'); UI.boardCap.hidden = false; UI.boardSkip.hidden = false;
      R.c25.xu.fade.value = 0; R.c25.t0 = 0; P('whoosh', 3);
    });
  }
  function boardEnd() {
    var B = R.board; if (!B) return; R.board = null;
    UI.root.classList.remove('voy-boarding'); UI.boardCap.hidden = true; UI.boardSkip.hidden = true;
    R.c25.u.op.value = 1; R.c25.u.zm.value = 1; if (!R.c25.t0) R.c25.t0 = performance.now(); R.sh25u.k.value = 0;
    B.res();
  }
  function updBoard() {
    var B = R.board; if (!B) return false;
    var s = (performance.now() - B.t0) / 1000, fz = /[?&]bt=([\d.]+)/.exec(location.search); if (fz) s = +fz[1];   // bt= 仅供截图调试
    if (s > B.dur / 1000) { boardEnd(); return false; }
    var a = eio(s / 1.8), zoom, dx, k = 1;
    if (s < 1.8) { zoom = 0.38 + 0.62 * a; dx = 0.28 * (1 - a); }
    else { var b = (s - 1.8) / 1.2; zoom = 1 + 11 * Math.pow(Math.min(1, b), 2.6); dx = 0; }
    placeShip(zoom, CANOPY, dx, s < 3.05 ? 1 : Math.max(0, 1 - (s - 3.05) / 0.25));
    var ck = eio((s - 2.55) / 0.5); R.c25.u.op.value = ck; R.c25.u.zm.value = 1 + 0.32 * (1 - eio((s - 2.55) / 1.6));
    if (s > 3.2 && !R.c25.t0) { R.c25.t0 = performance.now(); P('open'); }
    UI.boardCap.style.opacity = String(Math.min(1, s / 0.5) * (1 - eio((s - 2.2) / 0.5)));
    return true;
  }
  /* ---------- 全息星图:3D 粒子旋涡星系(替换概念图里的静态星系;差速自转,内快外慢)---------- */
  var GALC = [742 / 1408, 1 - 357 / 768], GALR = 140 / 1408;
  function buildGal25(S) {
    var N = 16000, M = 300, pos = new Float32Array((N + M) * 3), col = new Float32Array((N + M) * 3), sz = new Float32Array(N + M), kind = new Float32Array(N + M);
    function g() { return (Math.random() + Math.random() + Math.random() - 1.5) / 1.5; }
    for (var i = 0; i < N; i++) {
      var r, th, h, c, s = 1, u = Math.random();
      if (u < 0.2) { r = Math.abs(g()) * 0.22; th = Math.random() * 6.283; h = g() * 0.05; c = [1, 0.9, 0.7]; s = 1.3; }   // 核球:暖黄白
      else {
        var arm = (Math.random() < 0.5 ? 0 : Math.PI); r = 0.12 + Math.pow(Math.random(), 0.8) * 0.9;
        th = arm + Math.log(r / 0.12) / 0.26 + g() * (0.38 + 0.25 * r); h = g() * 0.03; if (Math.random() < 0.25) th = Math.random() * 6.283;
        var w = Math.random(); c = w < 0.06 ? [1, 0.55, 0.75] : w < 0.12 ? [1, 0.82, 0.45] : [0.25 + 0.25 * Math.random(), 0.55 + 0.2 * Math.random(), 1]; s = w < 0.12 ? 1.6 : 1;   // 粉色 HII 区 / 鎏金光点 / 蓝白年轻恒星
      }
      pos[i * 3] = r; pos[i * 3 + 1] = th; pos[i * 3 + 2] = h; col.set(c, i * 3); sz[i] = s * (1 + 1.4 * Math.random()); kind[i] = 0;
    }
    for (var j = N; j < N + M; j++) { pos[j * 3] = (Math.random() - 0.5) * 0.25; pos[j * 3 + 1] = Math.random(); pos[j * 3 + 2] = (Math.random() - 0.5) * 0.25; col.set([0.5, 0.9, 1], j * 3); sz[j] = 0.8 + Math.random(); kind[j] = 1; }   // 星图台升起的全息光尘
    var G = new T.BufferGeometry();
    G.setAttribute('position', new T.BufferAttribute(pos, 3)); G.setAttribute('color', new T.BufferAttribute(col, 3)); G.setAttribute('sz', new T.BufferAttribute(sz, 1)); G.setAttribute('kind', new T.BufferAttribute(kind, 1));
    var U = { t: { value: 0 }, px: { value: 1 }, asp: { value: 1 }, hot: { value: 0 }, fade: { value: 0 } };
    var P = new T.Points(G, new T.ShaderMaterial({ uniforms: U, transparent: true, depthWrite: false, depthTest: false, blending: T.AdditiveBlending, vertexColors: true,
      vertexShader: [
        'attribute float sz,kind;uniform float t,px,asp,hot;varying vec3 vC;varying float vA;',
        'void main(){vec3 p;float a=1.;',
        ' if(kind<0.5){float r=position.x,th=position.y-t*(0.05+0.16/(r+0.25));',
        '  vec3 d=vec3(r*cos(th),position.z,r*sin(th));',
        '  d=vec3(d.x,d.z*0.44+d.y*0.9,0.);',   // 倾角约 64°
        '  float cr=cos(-0.12),sr=sin(-0.12);p=vec3(d.x*cr-d.y*sr,d.x*sr+d.y*cr,0.);',
        '  a=0.55+0.45*sin(t*2.+position.y*7.);}',
        ' else{float k=fract(position.y+t*0.18);p=vec3(position.x*(1.-k*0.4),-1.05+k*0.95,0.);a=sin(k*3.1416);}',
        ' vC=color*(1.+hot*0.6);vA=a;',
        ' gl_Position=projectionMatrix*modelViewMatrix*vec4(p.x,p.y*asp,0.,1.);gl_PointSize=sz*px*(kind<0.5?1.:0.8);}'].join('\n'),
      fragmentShader: 'uniform float fade;varying vec3 vC;varying float vA;void main(){vec2 q=gl_PointCoord-0.5;float d=dot(q,q);if(d>0.25)discard;gl_FragColor=vec4(vC*vA*fade*pow((0.25-d)*4.,1.5)*0.3,1.);}' }));
    P.renderOrder = -1; P.frustumCulled = false; S.add(P); R.gal25 = { p: P, u: U };
    var glow = new T.Mesh(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ map: radialTex([[0, 'rgba(255,240,210,0.9)'], [0.15, 'rgba(160,200,255,0.35)'], [1, 'rgba(80,140,255,0)']]), transparent: true, blending: T.AdditiveBlending, depthWrite: false, depthTest: false }));
    glow.renderOrder = -1; S.add(glow); R.gal25.glow = glow;
  }
  function layGal25(x0, y0, zx, zy) {
    if (!R.gal25) return; var w = innerWidth, hh = innerHeight, c = img2scr(GALC[0], GALC[1]);
    var rpx = GALR * w / zx;   // 星系半径(像素)
    R.gal25.p.position.set(c[0], c[1], 0); R.gal25.p.scale.set(rpx / w, rpx / w, 1); R.gal25.u.asp.value = w / hh;
    R.gal25.u.px.value = Math.max(1.2, rpx / 70) * (window.devicePixelRatio > 1 ? 1.4 : 1);
    R.gal25.glow.position.set(c[0], c[1], 0); R.gal25.glow.scale.set(rpx * 1.1 / w, rpx * 0.55 / hh, 1);
    var tag = UI.holoTag; if (tag) { tag.hidden = false; var tp = img2scr(GALC[0], 1 - 286 / 768); tag.style.left = (tp[0] * 100) + '%'; tag.style.top = ((1 - tp[1]) * 100) + '%'; }
  }
  /* ============ 指令台(2.5D 近景 hub25.webp + 全息操作屏):引擎 / 舷窗观景 / 返回母港 ============ */
  var HUB_P = { eng: [77, 126, 490, 484], eva: [512, 176, 913, 429], home: [935, 126, 1364, 484] };
  function buildHub25(S, tex) {
    var U = R.hubU = { map: { value: tex('hub25.webp') }, sc: { value: new T.Vector4(0, 0, 1, 1) }, zm: { value: 1.25 }, op: { value: 0 }, mouse: { value: new T.Vector2() } };
    var q = new T.Mesh(new T.PlaneGeometry(1, 1), new T.ShaderMaterial({ uniforms: U, transparent: true, depthWrite: false, depthTest: false,
      vertexShader: 'varying vec2 vS;void main(){vS=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader: 'uniform sampler2D map;uniform vec4 sc;uniform float zm,op;uniform vec2 mouse;varying vec2 vS;void main(){vec2 uv=sc.xy+((vS-0.5)/zm+0.5)*sc.zw-mouse*vec2(0.006,0.004);vec4 c=texture2D(map,uv);gl_FragColor=vec4(c.rgb,op);}' }));
    q.position.set(0.5, 0.5, 0); q.renderOrder = 2; S.add(q); R.hub25 = q;
    R.hub = { k: 0, to: 0 };
  }
  function buildHubDom(root) {
    var hub = h('div', 'voy-hub'); hub.hidden = true;
    hub.innerHTML =
      '<section class="hp hp-eng"><header>引擎 <small>ENGINES</small></header><div class="hp-ring"></div><div class="hp-read"><b>选择引擎</b><p>三种颜色代表科学可信度:<i style="color:#7fe3c4">实测</i> / <i style="color:#ffd27a">推断</i> / <i style="color:#c9a6ff">猜想</i></p></div></section>' +
      '<section class="hp hp-eva"><header>舷窗观景 <small>EXTERIOR</small></header><div class="hp-ship"><img src="ship25.webp" alt=""></div><button type="button" class="hp-go hp-go--eva">⇱ 出舱看看弦穹号</button><p class="hp-note">外观为设计示意 · 曲率环属「猜想」</p></section>' +
      '<section class="hp hp-home"><header>返回母港 <small>HOME</small></header><canvas class="hp-globe" width="240" height="240"></canvas><button type="button" class="hp-go hp-go--home">⌂ 返回地球母港</button></section>' +
      '<button type="button" class="hp-back">↩ 回到驾驶座</button>';
    root.appendChild(hub); UI.hub = hub; UI.hubRing = hub.querySelector('.hp-ring'); UI.hubRead = hub.querySelector('.hp-read'); UI.globe = hub.querySelector('.hp-globe');
    V.engines.forEach(function (e, i) {
      var a = -Math.PI / 2 + i / V.engines.length * Math.PI * 2;
      var b = h('button', 'hub-e', '<span>' + e.icon + '</span>'); b.type = 'button'; b.dataset.id = e.id; b.title = e.zh;
      b.style.left = (50 + Math.cos(a) * 40) + '%'; b.style.top = (50 + Math.sin(a) * 40) + '%'; b.style.setProperty('--c', V.TIER_COLOR[e.tier]);
      b.addEventListener('mouseenter', function () { hubRead(e); }); b.addEventListener('focus', function () { hubRead(e); });
      b.addEventListener('click', function () { hubRead(e); if (!VY.target) { pickEngine(e.id); return; } closeHub(); setTimeout(function () { pickEngine(e.id); }, 650); });
      UI.hubRing.appendChild(b);
    });
    hub.querySelector('.hp-go--eva').addEventListener('click', function () { closeHub(true); evaIn(); });
    hub.querySelector('.hp-go--home').addEventListener('click', function () { closeHub(true); SH.voyExit(); });
    hub.querySelector('.hp-back').addEventListener('click', function () { closeHub(); });
    var tag = h('div', 'voy-holotag voy-holotag--hub', '<i></i><b>指令台</b><small>CONSOLE · 引擎 / 观景 / 返航</small>'); tag.hidden = true; root.appendChild(tag); UI.hubTag = tag;
    tag.addEventListener('click', function () { sfx.glass(660); openHub(); });
    root.querySelector('.voy-holotag').addEventListener('click', function () { if (VY.state !== 'travel') { sfx.glass(880); openMap(); } });
  }
  function hubRead(e) {
    var c = V.TIER_COLOR[e.tier], fit = VY.target && e.fit.indexOf(VY.target) >= 0;
    UI.hubRead.innerHTML = '<b>' + e.icon + ' ' + esc(e.zh) + ' <em style="color:' + c + '">' + e.tier + '</em>' + (fit ? ' <em class="fit">适合本航线</em>' : '') + '</b><p>' + esc(e.fact) + '</p>';
  }
  function openHub() {
    if (!R.mode25 || !R.hub || R.hub.to === 1 || VY.state === 'travel' || R.board || R.evaView) return;
    UI.map.hidden = true; R.hub.to = 1; P('whoosh', 2); markEngines();
    var e = VY.engine && V.engine(VY.engine); if (e) hubRead(e);
    UI.root.classList.add('voy-inhub');
  }
  function closeHub(quick) {
    if (!R.hub || R.hub.to === 0) return; R.hub.to = 0; UI.hub.classList.remove('on'); UI.root.classList.remove('voy-inhub');
    if (quick) { R.hub.k = 0; UI.hub.hidden = true; }
  }
  function updHub(dt) {
    var H = R.hub; if (!H) return;
    var sp = dt / 0.9; H.k = H.to ? Math.min(1, H.k + sp) : Math.max(0, H.k - sp * 1.3);
    var e = eio(H.k), U = R.c25.u, f = img2scr(DISC[0], DISC[1] + 0.03);
    U.zm.value = (R.board ? U.zm.value : 1 + 0.75 * e); U.zf.value.set(f[0], f[1]);
    var ho = eio((H.k - 0.35) / 0.5); R.hubU.op.value = ho; R.hubU.zm.value = 1 + 0.22 * (1 - ho); R.hub25.visible = ho > 0.001;
    R.hubU.mouse.value.copy(U.mouse.value);
    var vis = 1 - eio(H.k / 0.35); R.c25.xu.vis.value = vis; if (R.gal25) R.gal25.u.fade.value *= vis;
    if (H.to && H.k >= 1 && UI.hub.hidden) { UI.hub.hidden = false; layHub(); requestAnimationFrame(function () { UI.hub.classList.add('on'); }); }
    if (!H.to && H.k <= 0.6 && !UI.hub.hidden) UI.hub.hidden = true;
    if (!UI.hub.hidden) drawGlobe(R.t);
    var show = H.k === 0 && !R.board && !R.evaView && VY.state !== 'travel';
    if (UI.holoTag) UI.holoTag.style.visibility = show ? '' : 'hidden';
    if (UI.hubTag) UI.hubTag.style.visibility = show ? '' : 'hidden';
  }
  function layHub() {
    if (!R.c25 || !UI.hub) return; var port = innerWidth / innerHeight < 0.8; UI.hub.classList.toggle('port', port);
    R.hubU.sc.value.copy(R.c25.u.sc.value);
    var tp = img2scr(DISC[0], DISC[1] - 0.05), xr = R.c25.xr; if (port) tp = [xr[0] + xr[2] / 2, xr[1] + 0.035];
    if (UI.hubTag) { UI.hubTag.hidden = false; UI.hubTag.style.left = (tp[0] * 100) + '%'; UI.hubTag.style.top = ((1 - tp[1]) * 100 + (port ? 0 : 1.5)) + '%'; }
    UI.hub.querySelectorAll('.hp').forEach(function (el) {
      if (port) { el.style.cssText = ''; return; }
      var k = el.classList.contains('hp-eng') ? 'eng' : el.classList.contains('hp-eva') ? 'eva' : 'home', b = HUB_P[k];
      var a = img2scr(b[0] / 1408, 1 - b[1] / 768), c = img2scr(b[2] / 1408, 1 - b[3] / 768);
      el.style.left = (a[0] * 100) + '%'; el.style.top = ((1 - a[1]) * 100) + '%'; el.style.width = ((c[0] - a[0]) * 100) + '%'; el.style.height = ((a[1] - c[1]) * 100) + '%';
    });
  }
  function drawGlobe(t) {
    var cv = UI.globe, g = cv.getContext('2d'), W = cv.width, r = W * 0.38, cx = W / 2, cy = W / 2, rot = t * 0.35;
    g.clearRect(0, 0, W, W);
    var gr = g.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r); gr.addColorStop(0, 'rgba(120,220,255,0.35)'); gr.addColorStop(1, 'rgba(30,110,200,0.08)');
    g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.fill();
    g.strokeStyle = 'rgba(140,230,255,0.55)'; g.lineWidth = 1;
    for (var la = -60; la <= 60; la += 30) { var y = cy - Math.sin(la * Math.PI / 180) * r, rr = Math.cos(la * Math.PI / 180) * r; g.beginPath(); g.ellipse(cx, y, rr, rr * 0.12, 0, 0, 7); g.stroke(); }
    for (var lo = 0; lo < 180; lo += 30) { var a = lo * Math.PI / 180 + rot, sx = Math.cos(a); g.beginPath(); g.ellipse(cx, cy, Math.abs(sx) * r, r, 0, 0, 7); g.stroke(); }
    g.strokeStyle = 'rgba(160,240,255,0.9)'; g.lineWidth = 1.5; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.stroke();
    // 返航弧线(鎏金)
    var k = (t * 0.4) % 1; g.strokeStyle = 'rgba(255,205,120,0.9)'; g.lineWidth = 2; g.beginPath(); g.arc(cx, cy, r * 1.22, -2.6, -2.6 + 2.2 * k); g.stroke();
    var ea = -2.6 + 2.2 * k; g.fillStyle = '#ffd88a'; g.beginPath(); g.arc(cx + Math.cos(ea) * r * 1.22, cy + Math.sin(ea) * r * 1.22, 3.5, 0, 7); g.fill();
  }

  /* ============ 航图:Three.js 全息星域沙盘(对数尺度同心环,可拖动旋转、滚轮/双指缩放)============ */
  var AT = null;
  function atlasInit() {
    var cv = UI.mapCv, r = new T.WebGLRenderer({ canvas: cv, antialias: true, alpha: true }); r.setPixelRatio(Math.min(2, devicePixelRatio || 1)); r.setClearColor(0x000000, 0);
    var S = new T.Scene(), cam = new T.PerspectiveCamera(42, 1, 0.1, 200);
    AT = { r: r, S: S, cam: cam, th: -0.5, ph: 0.66, dist: 15.5, auto: 1, nodes: [], labels: [], sel: null, flow: [] };
    // 背景星尘
    var n = 1800, p = new Float32Array(n * 3); for (var i = 0; i < n; i++) { var u = Math.random() * 2 - 1, a = Math.random() * 6.283, rr = 30 + Math.random() * 30, q = Math.sqrt(1 - u * u); p.set([Math.cos(a) * q * rr, u * rr, Math.sin(a) * q * rr], i * 3); }
    var sg = new T.BufferGeometry(); sg.setAttribute('position', new T.BufferAttribute(p, 3));
    S.add(new T.Points(sg, new T.PointsMaterial({ color: 0x9fc8ff, size: 0.12, transparent: true, opacity: 0.7, depthWrite: false })));
    var grid = new T.PolarGridHelper(9.5, 24, 10, 96, 0x2c6c8c, 0x1a3c52); grid.position.y = -0.03; grid.material.transparent = true; grid.material.opacity = 0.35; S.add(grid);
    // 中心:地球(我们出发的地方)
    var earth = new T.Mesh(new T.SphereGeometry(0.13, 32, 16), new T.MeshBasicMaterial({ color: 0x4fb4ff })); S.add(earth);
    var eg = new T.Sprite(new T.SpriteMaterial({ map: radialTex([[0, 'rgba(140,220,255,0.9)'], [0.4, 'rgba(60,150,255,0.25)'], [1, 'rgba(40,120,255,0)']]), blending: T.AdditiveBlending, depthWrite: false })); eg.scale.set(1.3, 1.3, 1); S.add(eg);
    var N = V.sectors.length;
    V.sectors.forEach(function (s, i) {
      var rad = 0.75 + i * (8.6 / N), col = new T.Color(s.status === 'open' ? 0x7fe3c4 : s.status === 'conjecture' ? 0xc9a6ff : 0x7fa6d8);
      var pts = []; for (var k = 0; k <= 160; k++) { var a = k / 160 * Math.PI * 2; pts.push(new T.Vector3(Math.cos(a) * rad, 0, Math.sin(a) * rad)); }
      var lg = new T.BufferGeometry().setFromPoints(pts), dashed = s.status !== 'open';
      var line = new T.Line(lg, dashed ? new T.LineDashedMaterial({ color: col, dashSize: 0.18, gapSize: 0.14, transparent: true, opacity: 0.75 }) : new T.LineBasicMaterial({ color: col, transparent: true, opacity: 0.85 }));
      if (dashed) line.computeLineDistances(); S.add(line);
      var band = new T.Mesh(new T.RingGeometry(rad - 0.06, rad + 0.06, 160), new T.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.16, side: T.DoubleSide, blending: T.AdditiveBlending, depthWrite: false }));
      band.rotation.x = -Math.PI / 2; S.add(band);
      var a = -Math.PI * 0.82 + i * (Math.PI * 1.3 / Math.max(1, N - 1)), pos = new T.Vector3(Math.cos(a) * rad, 0, Math.sin(a) * rad);
      var glow = new T.Sprite(new T.SpriteMaterial({ map: radialTex([[0, 'rgba(255,255,255,1)'], [0.22, 'rgba(' + Math.round(col.r * 255) + ',' + Math.round(col.g * 255) + ',' + Math.round(col.b * 255) + ',0.8)'], [1, 'rgba(0,0,0,0)']]), blending: T.AdditiveBlending, depthWrite: false }));
      glow.position.copy(pos); glow.scale.set(0.55, 0.55, 1); S.add(glow);
      var beam = new T.Mesh(new T.CylinderGeometry(0.012, 0.012, 1.6, 6, 1, true), new T.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false }));
      beam.position.copy(pos).add(new T.Vector3(0, 0.8, 0)); S.add(beam);
      AT.nodes.push({ s: s, pos: pos, glow: glow, line: line, band: band, beam: beam, col: col, rad: rad });
      var lb = h('div', 'at-lb', '<b>' + s.n + ' ' + esc(s.zh) + '</b><small>' + V.STATUS_ZH[s.status] + '</small>'); UI.map.appendChild(lb); AT.labels.push(lb);
    });
    // 航线弧 + 流动光点
    AT.route = new T.Line(new T.BufferGeometry(), new T.LineBasicMaterial({ color: 0xffcf7a, transparent: true, opacity: 0.95 })); S.add(AT.route);
    for (var j = 0; j < 36; j++) { var f = new T.Sprite(new T.SpriteMaterial({ map: radialTex([[0, 'rgba(255,230,170,1)'], [1, 'rgba(255,200,100,0)']]), blending: T.AdditiveBlending, depthWrite: false })); f.scale.set(0.16, 0.16, 1); f.visible = false; S.add(f); AT.flow.push(f); }
    AT.here = new T.Mesh(new T.RingGeometry(0.3, 0.34, 48), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, side: T.DoubleSide, depthWrite: false })); AT.here.rotation.x = -Math.PI / 2; S.add(AT.here);
    // 拖动旋转 / 缩放 / 点选
    var pts = {}, down = null, pinch = 0;
    cv.addEventListener('pointerdown', function (e) { pts[e.pointerId] = [e.clientX, e.clientY]; down = { x: e.clientX, y: e.clientY, m: 0 }; AT.auto = 0; cv.setPointerCapture(e.pointerId); });
    cv.addEventListener('pointermove', function (e) {
      if (!pts[e.pointerId]) return; var o = pts[e.pointerId], dx = e.clientX - o[0], dy = e.clientY - o[1]; pts[e.pointerId] = [e.clientX, e.clientY];
      var ids = Object.keys(pts);
      if (ids.length >= 2) { var A = pts[ids[0]], B = pts[ids[1]], d = Math.hypot(A[0] - B[0], A[1] - B[1]); if (pinch) AT.dist = Math.max(5, Math.min(24, AT.dist * pinch / d)); pinch = d; if (down) down.m = 99; return; }
      AT.th -= dx * 0.006; AT.ph = Math.max(0.15, Math.min(1.35, AT.ph + dy * 0.004)); if (down) down.m += Math.abs(dx) + Math.abs(dy);
    });
    var up = function (e) { delete pts[e.pointerId]; pinch = 0; if (down && down.m < 8 && e.type === 'pointerup') mapTap(e.clientX, e.clientY); down = null; };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    cv.addEventListener('wheel', function (e) { e.preventDefault(); AT.dist = Math.max(5, Math.min(24, AT.dist * (1 + e.deltaY * 0.001))); }, { passive: false });
  }
  function atlasRoute() {
    var to = AT.sel || VY.target, a = AT.nodes.filter(function (n) { return n.s.id === VY.at; })[0], b = AT.nodes.filter(function (n) { return n.s.id === to; })[0];
    AT.curve = null; AT.route.visible = false; AT.flow.forEach(function (f) { f.visible = false; });
    AT.nodes.forEach(function (n) { n.beam.material.opacity = n.s.id === to ? 0.8 : 0; });
    if (!a || !b || a === b) return;
    var mid = a.pos.clone().add(b.pos).multiplyScalar(0.5); mid.y = 0.6 + a.pos.distanceTo(b.pos) * 0.25;
    AT.curve = new T.QuadraticBezierCurve3(a.pos.clone(), mid, b.pos.clone());
    AT.route.geometry.dispose(); AT.route.geometry = new T.BufferGeometry().setFromPoints(AT.curve.getPoints(80)); AT.route.visible = true;
    AT.flow.forEach(function (f) { f.visible = true; });
  }
  function atlasOpen() {
    if (!AT) atlasInit(); AT.sel = null; AT.auto = 1; atlasRoute();
    var go = function () { if (UI.map.hidden) return; atlasFrame(); requestAnimationFrame(go); }; requestAnimationFrame(go);
  }
  function atlasFrame() {
    var cv = UI.mapCv, w = cv.clientWidth, hh = cv.clientHeight; if (!w || !hh) return;
    if (AT.w !== w || AT.h !== hh) { AT.w = w; AT.h = hh; AT.r.setSize(w, hh, false); AT.cam.aspect = w / hh; AT.cam.fov = w / hh < 0.8 ? 62 : 42; AT.cam.updateProjectionMatrix(); }
    var t = performance.now() / 1000; if (AT.auto) AT.th += 0.0012;
    var c = AT.cam; c.position.set(Math.cos(AT.th) * Math.cos(AT.ph) * AT.dist, Math.sin(AT.ph) * AT.dist, Math.sin(AT.th) * Math.cos(AT.ph) * AT.dist); c.lookAt(0, -0.4, 0); c.updateMatrixWorld();
    var to = AT.sel || VY.target;
    AT.nodes.forEach(function (n, i) {
      var on = n.s.id === to, here = n.s.id === VY.at, pul = 1 + 0.12 * Math.sin(t * 3 + i);
      n.glow.scale.setScalar((on ? 0.85 : here ? 0.7 : 0.5) * pul); n.band.material.opacity = on ? 0.42 : 0.14; n.line.material.opacity = on ? 1 : 0.7;
      if (here) { AT.here.position.copy(n.pos); AT.here.scale.setScalar(1 + 0.25 * Math.sin(t * 3)); }
      var v = n.pos.clone().project(c), x = (v.x + 1) / 2 * w, y = (1 - v.y) / 2 * hh, lb = AT.labels[i];
      n.s._xy = [x, y]; lb.style.transform = 'translate(' + x.toFixed(1) + 'px,' + (y + 14).toFixed(1) + 'px) translateX(-50%)'; lb.classList.toggle('on', on); lb.classList.toggle('here', here);
    });
    if (AT.curve) AT.flow.forEach(function (f, j) { var k = (t * 0.25 + j / AT.flow.length) % 1; f.position.copy(AT.curve.getPoint(k)); f.material.opacity = Math.sin(k * Math.PI); });
    AT.r.render(AT.S, c);
  }
  function lay25() {
    if (!R.c25) return; var w = innerWidth, hh = innerHeight, sa = w / hh, port = sa < 0.8, U = R.c25.u;
    var zx, zy, fx = 0.5, fy = 0.5;
    if (sa < IMG_ASP) { zy = 0.97; zx = zy * sa / IMG_ASP; fx = port ? 0.55 : 0.5; } else { zx = 0.97; zy = zx * IMG_ASP / sa; fy = 0.55; }
    var x0 = Math.max(0.012, Math.min(1 - zx - 0.012, fx - zx / 2)), y0 = Math.max(0.012, Math.min(1 - zy - 0.012, fy - zy / 2));
    U.sc.value.set(x0, y0, zx, zy); R.c25.view = [x0, y0, zx, zy];
    var xl = R.c25.xl, H, cx, by;
    if (!port) { H = 0.5; cx = (DISC[0] - x0) / zx; by = (DISC[1] - y0) / zy - 0.035; }
    else { H = 0.36; cx = 0.7; by = 0.235; }
    var W = H * XL_ASP / sa; if (W > 0.86) { W = 0.86; H = W * sa / XL_ASP; }
    xl.scale.set(W, H, 1); xl.position.set(cx, by + H / 2, 0); R.c25.xr = [cx - W / 2, by, W, H];
    R.c25.cone.scale.set(W * 0.75, H * 0.28, 1); R.c25.cone.position.set(cx, by + H * 0.05, 0);
    layGal25(x0, y0, zx, zy); layHub();
  }
  function img2scr(u, v) { var s = R.c25.view; return [(u - s[0]) / s[2], (v - s[1]) / s[3]]; }
  function hit25(e) {
    var sx = e.clientX / innerWidth, sy = 1 - e.clientY / innerHeight, r = R.c25.xr;
    var pd = img2scr(DISC[0], DISC[1]), s0 = R.c25.view, px = (sx - pd[0]) * s0[2] * 1408 / 95, py = (sy - pd[1]) * s0[3] * 768 / 34; if (px * px + py * py < 1) return 'hub';
    if (sx > r[0] + r[2] * 0.2 && sx < r[0] + r[2] * 0.8 && sy > r[1] + r[3] * 0.12 && sy < r[1] + r[3] * 0.95) return 'xl';
    var t = img2scr(TABLE[0], TABLE[1]), s = R.c25.view, dx = (sx - t[0]) * s[2] * 900 / 112, dy = (sy - t[1]) * s[3] * 491 / 70;
    if (dx * dx + dy * dy < 1) return 'map';
    var gc = img2scr(GALC[0], GALC[1]), gx = (sx - gc[0]) * s[2] / (GALR * 1.1), gy = (sy - gc[1]) * s[3] * (768 / 1408) / (GALR * 0.6);
    if (gx * gx + gy * gy < 1) return 'map';
    return null;
  }
  function upd25(dt, t, sx, sy) {
    if (!R.c25) return; var U = R.c25.u, X = R.c25.xu;
    U.t.value = t; U.power.value = R.power || 0; U.shake.value.set(sx * 0.05, sy * 0.05);
    U.mouse.value.x += (R.mouse.x - U.mouse.value.x) * Math.min(1, dt * 4); U.mouse.value.y += (R.mouse.y - U.mouse.value.y) * Math.min(1, dt * 4);
    X.t.value = t; if (!R.board && !R.c25.t0) R.c25.t0 = performance.now(); X.fade.value = R.c25.t0 ? Math.min(1, (performance.now() - R.c25.t0) / 1500) : 0;
    if (R.gal25) { R.gal25.u.t.value = t; R.gal25.u.fade.value = U.op.value; }
    updHub(dt);
    var SU = R.sh25u; SU.t.value = t; SU.mouse.value.copy(U.mouse.value); SU.warp.value += ((FX.eva && FX.eva.warp ? 1 : 0) - SU.warp.value) * Math.min(1, dt * 3);
    // 眨眼(她本是 wink 表情,另一只眼也合上 = 眨眼)
    A.blinkT -= dt; if (A.blinkT < 0) { A.blinkT = 2.6 + Math.random() * 3; A.bl = 0.16; }
    if (A.bl > 0) { A.bl -= dt; X.blink.value = Math.sin(Math.max(0, A.bl) / 0.16 * Math.PI); } else X.blink.value = 0;
    X.talk.value += ((A.talk ? 0.6 + 0.4 * Math.abs(Math.sin(t * 9)) : 0) - X.talk.value) * Math.min(1, dt * 10);
    A.gl = Math.max(0, (A.gl || 0) - dt * 2); if (Math.random() < dt * 0.15) A.gl = 0.6; X.glitch.value = A.gl;
    var r = R.c25.xr, xl = R.c25.xl, bob = Math.sin(t * 1.4) * 0.004 + (A.waveT > 0 ? Math.sin(A.waveT * 9) * 0.006 : 0) + X.talk.value * 0.002 * Math.sin(t * 18);
    if (A.waveT > 0) A.waveT -= dt;
    xl.position.y = r[1] + r[3] / 2 + bob; var br = 1 + Math.sin(t * 1.4) * 0.004; xl.scale.y = r[3] * br;
    R.c25.cone.material.opacity = 0.75 + 0.25 * Math.sin(t * 3.1);
    UI.stage.style.cursor = '';
  }

  /* ---------- 循环 ---------- */
  function loop() {
    if (!VY.active) return;
    requestAnimationFrame(loop);
    var dt = Math.min(0.05, R.clock.getDelta()); R.t += dt;
    // 舱外相机:轻微漂浮 + 震动
    var sh = R.shake * (0.4 + 0.6 * (R.power || 0)), sx = (Math.random() - 0.5) * 0.02 * sh, sy = (Math.random() - 0.5) * 0.02 * sh;
    R.evaView = FX.evaUpdate ? FX.evaUpdate(dt, R.t, R.outCam, R.mouse.x, R.mouse.y) : false;
    if (!R.evaView) {
    R.outCam.position.set(Math.sin(R.t * 0.13) * 0.6, Math.sin(R.t * 0.17) * 0.4, 0);
    R.outCam.rotation.set(-0.06 + R.mouse.y * 0.015 + sy, -R.mouse.x * 0.03 + sx, 0);
    }
    R.cam.position.set(R.mouse.x * 0.06 + sx * 2, 1.58 + R.mouse.y * 0.03 + sy * 2, 2.05); R.cam.lookAt(R.look);
    FX.update(dt, R.t, R.outCam); if (FX.engUpdate) FX.engUpdate(dt, R.t, R.outCam);
    if (R.knob && R.knobTarget != null) R.knob.rotation.y += (R.knobTarget - R.knob.rotation.y) * Math.min(1, dt * 8);
    if (R.lever) R.lever.position.z += ((R.leverZ0 - (R.leverTarget != null ? R.leverTarget + 0.1 : (R.power || 0) * 0.2)) - R.lever.position.z) * Math.min(1, dt * 6);
    R.beam.material.uniforms.t.value = R.t;
    if (R.holoGal) { R.holoGal.rotation.y = R.t * 0.12; R.holoCone.material.uniforms.t.value = R.t; R.goldMat.color.setHSL(0.1, 1, 0.68 + (R.power || 0) * 0.1 + Math.sin(R.t * 1.2) * 0.02); }
    R.cabinLight.intensity = 0.8 + (R.power || 0) * 0.6 + (VY.state === 'travel' ? Math.sin(R.t * 30) * 0.05 : 0);
    if ((R.frame = (R.frame || 0) + 1) % 3 === 0) drawScreens();
    if (R.mode25) upd25(dt, R.t, sx, sy); else { updAvatar(dt, R.t); updHolo(dt, R.t); }
    // 闲聊
    if (VY.state === 'idle' && UI.map.hidden) { R.idle = (R.idle || 0) + dt; if (R.idle > 28) { R.idle = 0; say(V.lines.idle[(Math.random() * V.lines.idle.length) | 0]); } } else R.idle = 0;
    var r = R.r; r.clear(); r.render(R.out, R.outCam);
    if (R.mode25) {
      r.clearDepth();
      if (updBoard()) { r.render(R.sh25, R.cam25); r.render(R.s25, R.cam25); }
      else if (R.evaView) { if (FX.ship) FX.ship.visible = false; var ek = FX.eva ? FX.eva.k : 0, ee = eio(ek); placeShip(1 + 2.4 * (1 - ee), CANOPY, 0, Math.min(1, ek * 3)); r.render(R.sh25, R.cam25); }
      else r.render(R.s25, R.cam25);
    } else if (!R.evaView) { r.clearDepth(); r.render(R.in, R.cam); }
  }

  /* ============================ 进入 / 退出 ============================ */
  var leRender = null;
  function pauseLE(p) {
    var lr = window.LE && LE.scene && LE.scene.renderer; if (!lr) return;
    if (p) { if (!leRender) { leRender = lr.render; lr.render = function () { }; } }
    else if (leRender) { lr.render = leRender; leRender = null; }
  }
  var booted = false;
  SH.voyEnter = function () {
    if (VY.active) return;
    if (!UI.root) buildDom();
    UI.root.hidden = false; VY.active = true; document.body.classList.add('voy-on'); pauseLE(true); P('open');
    if (window.LE && LE.ui && LE.ui.closeSheets) try { LE.ui.closeSheets(); } catch (e) { }
    if (!booted) {
      booted = true; initGL(); FX.show(VY.at); setLoc(); markEngines(); evaBtnSync(); dash({ dist: 0, v: 0, te: 0, ts: 0, sig: 0.0013, x: '—' });
      UI.load.hidden = false;
      loop();
      loadAvatar().then(function () {
        UI.load.classList.add('out'); setTimeout(function () { UI.load.hidden = true; }, 600);
        A.waveT = 1.6;
        var first = !ST.met; ST.met = 1; save(ST);
        (first ? sayList(V.lines.hello) : say(V.lines.back[0])).then(function () { return say(['neutral', '中间那团星系就是航图,点它选目的地;我面前的指令台能选引擎、出舱观景和返航。'], {}, [{ label: '打开航图', value: 'map' }]); }).then(function (v) { if (v === 'map') openMap(); });
      });
    } else { R.clock.getDelta(); loop(); (R.mode25 ? board() : Promise.resolve()).then(function () { say(V.lines.back[0]); }); }
    fade(1); setTimeout(function () { fade(0); }, 60);
  };
  SH.voyExit = function () {
    closeHub(true);
    if (!VY.active) return;
    if (VY.state === 'travel') return;
    if (R.evaView || (FX.eva && FX.eva.on)) evaOut(true);
    VY.active = false; UI.root.hidden = true; document.body.classList.remove('voy-on'); pauseLE(false); sfx.hum(0); P('boom');
    if (window.speechSynthesis) speechSynthesis.cancel();
  };

  /* ---------- 入口按钮 ---------- */
  function addEntry() {
    var nav = document.querySelector('.le-actions'); if (!nav || document.querySelector('.sh-btn-voy')) return;
    var b = h('button', 'le-btn le-btn--hero sh-btn-voy', '<span class="le-btn__ico">🚀</span><span class="le-btn__txt">航行<small>VOYAGE</small></span>'); b.type = 'button';
    b.addEventListener('click', SH.voyEnter); var bq = nav.querySelector('.sh-btn-quest'); nav.insertBefore(b, bq ? bq.nextSibling : null);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && VY.active) { if (UI.map && !UI.map.hidden) UI.map.hidden = true; else SH.voyExit(); } });
  }
  (function wait2(n) { if (document.querySelector('.sh-btn-quest')) return addEntry(); if (n > 600) return; setTimeout(function () { wait2(n + 1); }, 100); })(0);
  if (/[?&]voy=1/.test(location.search)) (function w3(n) { if (window.SH_READY) return SH.voyEnter(); if (n < 600) setTimeout(function () { w3(n + 1); }, 100); })(0);
})();
