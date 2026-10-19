/* 天枢 Starhelm · sh-voyage.js(M1.5)
 * 星际航行:弦穹号 Chordion 驾驶舱 + 随船智能「星璃」+ 引擎系统 + 航图选点 + 穿梭。
 * 独立渲染器;进入航行时暂停 Live Earth 的渲染,退出后恢复,原有任务与地球模式不受影响。
 * 星璃形象:VRoid 官方 β Ver AvatarSample_3(pixiv Inc.,CC0),已改为高领驾驶服并压缩贴图。
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
        '<div class="voy-topbtns"><button type="button" class="voy-b voy-b--map">✧ 航图</button><button type="button" class="voy-b voy-b--eva" hidden>⇱ 舱外观景</button><button type="button" class="voy-b voy-b--tts" title="星璃朗读(默认关)">🔈</button><button type="button" class="voy-b voy-b--exit">返回母港</button></div>' +
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
      '<div class="voy-credit">影像:NASA, ESA, CSA, STScI(CC BY 4.0)· 星璃形象底模:VRoid β AvatarSample_3(CC0)· 不代表任何机构背书</div>' +
      '<section class="voy-map" hidden><div class="voy-map__bar"><div><small>STARHELM · ATLAS</small><h2>航图 <span>选择目的地</span></h2></div><button type="button" class="voy-b voy-map__x">×</button></div>' +
        '<canvas></canvas><div class="voy-map__legend"><i class="lg-open"></i>已测绘 <i class="lg-un"></i>未测绘星域 <i class="lg-cj"></i>猜想 <i class="lg-here"></i>当前位置</div><div class="voy-map__card" hidden></div></section>' +
      '<div class="voy-load"><div class="voy-load__ring"></div><p>弦穹号启动中……</p></div>';
    document.body.appendChild(root);
    UI.root = root; UI.stage = root.querySelector('.voy-stage'); UI.fade = root.querySelector('.voy-fade');
    UI.locN = root.querySelector('.voy-loc__n'); UI.locZh = root.querySelector('.voy-loc__zh'); UI.locSt = root.querySelector('.voy-loc__st');
    UI.banner = root.querySelector('.voy-banner'); UI.engList = root.querySelector('.voy-eng__list'); UI.engInfo = root.querySelector('.voy-eng__info');
    UI.sayT = root.querySelector('.voy-say__t'); UI.sayCh = root.querySelector('.voy-say__ch'); UI.say = root.querySelector('.voy-say');
    UI.ctrl = root.querySelector('.voy-ctrl'); UI.map = root.querySelector('.voy-map'); UI.mapCv = UI.map.querySelector('canvas'); UI.mapCard = UI.map.querySelector('.voy-map__card');
    UI.load = root.querySelector('.voy-load');
    UI.d = {}; ['to', 'dist', 'v', 'te', 'ts', 'sig', 'x'].forEach(function (k) { UI.d[k] = root.querySelector('.d-' + k); });
    root.querySelector('.voy-b--exit').addEventListener('click', function () { SH.voyExit(); });
    root.querySelector('.voy-b--map').addEventListener('click', function () { openMap(); });
    UI.evaBtn = root.querySelector('.voy-b--eva'); UI.evaBack = root.querySelector('.voy-evaback'); UI.look = root.querySelector('.voy-look');
    UI.evaBtn.addEventListener('click', function () { evaIn(); });
    UI.evaBack.addEventListener('click', function () { evaOut(); });
    root.querySelector('.voy-map__x').addEventListener('click', function () { UI.map.hidden = true; sfx.close(); });
    var tts = root.querySelector('.voy-b--tts');
    tts.addEventListener('click', function () { VY.tts = !VY.tts; tts.textContent = VY.tts ? '🔊' : '🔈'; tts.classList.toggle('on', VY.tts); if (!VY.tts && window.speechSynthesis) speechSynthesis.cancel(); });
    UI.mapCv.addEventListener('click', function (e) { mapTap(e.clientX, e.clientY); });
    buildEngines();
  }

  /* ============================ 3D:舱外 + 驾驶舱 ============================ */
  function initGL() {
    R.tier = tierOf();
    var r = new T.WebGLRenderer({ antialias: R.tier !== 'low', alpha: false, powerPreference: 'high-performance' });
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, R.tier === 'high' ? 2 : R.tier === 'mid' ? 1.5 : 1.15));
    r.setSize(innerWidth, innerHeight); r.outputEncoding = T.sRGBEncoding; r.toneMapping = T.ACESFilmicToneMapping; r.toneMappingExposure = 1.0;
    r.autoClear = false; UI.stage.appendChild(r.domElement); R.r = r;
    R.out = new T.Scene(); R.outCam = new T.PerspectiveCamera(55, innerWidth / innerHeight, 0.5, 4000);
    FX.build(R.out, R.tier); if (FX.buildEngines) { FX.buildEngines(R.out, R.tier); FX.buildShip(R.out); }
    R.in = new T.Scene(); R.cam = new T.PerspectiveCamera(62, innerWidth / innerHeight, 0.02, 50);
    R.cam.position.set(0, 1.3, 0.8); R.look = new T.Vector3(0, 1.05, -1.6); R.cam.lookAt(R.look);
    buildCockpit();
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
    if (R.pad) { if (port) R.pad.position.set(0.3, 0.86, -0.42); else R.pad.position.set(0.74, 0.86, -0.72); R.padLight.position.set(R.pad.position.x, 1.3, R.pad.position.z + 0.15); }
    if (R.scrMesh) { R.scrMesh.position.x = port ? -0.36 : R.scrBaseX; R.scrBack.position.x = R.scrMesh.position.x; }
    R.outCam.updateProjectionMatrix(); R.cam.updateProjectionMatrix();
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
  function cabinEnv() {
    var es = new T.Scene(), box = new T.Mesh(new T.BoxGeometry(10, 6, 10), new T.MeshBasicMaterial({ color: 0x15171c, side: T.BackSide })); es.add(box);
    function lamp(c, w, hh, x, y, z, ry, rx) { var m = new T.Mesh(new T.PlaneGeometry(w, hh), new T.MeshBasicMaterial({ color: c, side: T.DoubleSide })); m.position.set(x, y, z); m.rotation.set(rx || 0, ry || 0, 0); es.add(m); }
    lamp(0xfff0d8, 6, 0.4, 0, 2.9, 0, 0, Math.PI / 2);        // 顶部暖白灯带
    lamp(0x8fd8ff, 5, 2.4, 0, 1.2, -4.9);                      // 前方舷窗(偏冷)
    lamp(0xffc070, 0.25, 5, -4.9, 0.5, 0, Math.PI / 2);        // 两侧鎏金灯带
    lamp(0xffc070, 0.25, 5, 4.9, 0.5, 0, -Math.PI / 2);
    var pm = new T.PMREMGenerator(R.r); var rt = pm.fromScene(es, 0.04); pm.dispose(); return rt.texture;
  }
  function buildCockpit() {
    var S = R.in;
    R.env = cabinEnv(); S.environment = R.env;
    var white = new T.MeshPhysicalMaterial({ color: 0xcfccc6, roughness: 0.36, metalness: 0.05, clearcoat: 0.6, clearcoatRoughness: 0.25 });
    var white2 = new T.MeshPhysicalMaterial({ color: 0xb9b6b0, roughness: 0.5, metalness: 0.05, clearcoat: 0.3 });
    var graph = new T.MeshStandardMaterial({ color: 0x23262c, roughness: 0.42, metalness: 0.65 });
    var graph2 = new T.MeshStandardMaterial({ color: 0x15171b, roughness: 0.6, metalness: 0.4 });
    var gold = new T.MeshBasicMaterial({ color: 0xffc27a, toneMapped: false });      // 鎏金灯带(自发光)
    var goldM = new T.MeshStandardMaterial({ color: 0xc9a062, roughness: 0.25, metalness: 1 });
    var edge = new T.MeshBasicMaterial({ color: 0x5fdcff, toneMapped: false });
    R.goldMat = gold; R.edgeMat = edge;
    S.add(new T.HemisphereLight(0xf2f0ff, 0x24262c, 0.35));
    var key = new T.PointLight(0xfff1dc, 0.7, 7); key.position.set(0, 2.35, -0.3); S.add(key); R.cabinLight = key;
    var cool = new T.PointLight(0x7fd8ff, 0.35, 5); cool.position.set(0, 1.6, -1.9); S.add(cool);

    // 前壁:圆角大舷窗(挤出 + 倒角,软质感)
    var Z = -1.75, fw = new T.Shape(); fw.moveTo(-3.2, -0.6); fw.lineTo(3.2, -0.6); fw.lineTo(3.2, 3.2); fw.lineTo(-3.2, 3.2); fw.lineTo(-3.2, -0.6);
    var hole = roundPath(4.3, 2.25, 0.55); hole.curves.forEach(function (c) { ['v0', 'v1', 'v2'].forEach(function (k) { if (c[k]) c[k].y += 1.5; }); }); fw.holes.push(hole);
    var front = new T.Mesh(new T.ExtrudeGeometry(fw, { depth: 0.14, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.06, bevelSegments: 4, curveSegments: 24 }), white);
    front.position.set(0, 0, Z - 0.1); S.add(front);
    // 舷窗内圈鎏金细线
    var lp = roundRect(4.22, 2.17, 0.52).getPoints(80).map(function (p) { return new T.Vector3(p.x, p.y + 1.5, Z + 0.11); });
    S.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(lp, true), 200, 0.007, 6, true), gold));
    var glass = new T.Mesh(new T.PlaneGeometry(4.4, 2.4), new T.MeshPhysicalMaterial({ color: 0xbfe6ff, transparent: true, opacity: 0.05, roughness: 0.04, metalness: 0, depthWrite: false, envMapIntensity: 0.5 }));
    glass.position.set(0, 1.5, Z - 0.05); S.add(glass);
    // 两侧弧形舱壁 + 顶棚
    [-1, 1].forEach(function (s) {
      var wall = new T.Mesh(new T.CylinderGeometry(3.0, 3.0, 3.2, 40, 1, true, s > 0 ? Math.PI * 0.2 : Math.PI * 1.55, Math.PI * 0.25), white2);
      wall.position.set(0, 1.1, -0.1); S.add(wall);
      var gs = new T.Mesh(new T.BoxGeometry(0.02, 0.02, 2.6), gold); gs.position.set(s * 2.62, 0.42, -0.35); S.add(gs);
      var gs2 = gs.clone(); gs2.position.y = 2.15; S.add(gs2);
      var pnl = new T.Mesh(new T.BoxGeometry(0.03, 0.55, 1.0), graph2); pnl.position.set(s * 2.58, 1.25, -0.55); pnl.rotation.y = s * 0.18; S.add(pnl);
    });
    var ceil = new T.Mesh(new T.ExtrudeGeometry(roundRect(4.6, 2.6, 0.5), { depth: 0.08, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 3 }), white);
    ceil.rotation.x = Math.PI / 2; ceil.position.set(0, 2.55, -0.45); S.add(ceil);
    var cove = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(roundRect(3.6, 1.7, 0.45).getPoints(60).map(function (p) { return new T.Vector3(p.x, 2.48, p.y - 0.45); }), true), 160, 0.012, 6, true), gold); S.add(cove);
    var floor = new T.Mesh(new T.BoxGeometry(5.6, 0.06, 3.4), graph2); floor.position.set(0, -0.05, -0.3); S.add(floor);
    for (var fl = -2; fl <= 2; fl++) { var fs = new T.Mesh(new T.BoxGeometry(0.012, 0.004, 3.2), gold); fs.position.set(fl * 0.9, -0.018, -0.3); S.add(fs); }

    // 弧形控制台:白色主体 + 石墨台面 + 鎏金前缘
    var desk = new T.Mesh(new T.CylinderGeometry(1.75, 1.85, 0.1, 72, 1, false, Math.PI * 1.16, Math.PI * 0.68), graph);
    desk.position.set(0, 0.8, 0.55); S.add(desk);
    var deskBody = new T.Mesh(new T.CylinderGeometry(1.86, 1.55, 0.78, 72, 1, true, Math.PI * 1.16, Math.PI * 0.68), white);
    deskBody.position.set(0, 0.37, 0.55); S.add(deskBody);
    var deskEdge = new T.Mesh(new T.TorusGeometry(1.86, 0.008, 6, 120, Math.PI * 0.68), gold);
    deskEdge.rotation.set(Math.PI / 2, 0, Math.PI * 0.16 + Math.PI); deskEdge.position.set(0, 0.85, 0.55); S.add(deskEdge);

    // 中央:全息星图台(点它打开航图)
    var holo = new T.Group(); holo.position.set(0, 0.8, -0.98); S.add(holo); R.holo = holo;
    var ped = new T.Mesh(new T.CylinderGeometry(0.2, 0.24, 0.07, 48), white); ped.position.y = 0.035; holo.add(ped);
    var top = new T.Mesh(new T.CylinderGeometry(0.19, 0.19, 0.012, 48), new T.MeshBasicMaterial({ color: 0x06202e, toneMapped: false })); top.position.y = 0.075; holo.add(top);
    var hr = new T.Mesh(new T.TorusGeometry(0.2, 0.004, 6, 80), gold); hr.rotation.x = Math.PI / 2; hr.position.y = 0.075; holo.add(hr);
    var gN = R.tier === 'low' ? 1400 : 3200, gp = new Float32Array(gN * 3), gc = new Float32Array(gN * 3);
    for (var i = 0; i < gN; i++) {
      var arm = i % 2, rr = Math.pow(Math.random(), 0.7) * 0.17, th = rr * 26 + arm * Math.PI + (Math.random() - 0.5) * 0.7, core = rr < 0.03;
      gp[i * 3] = Math.cos(th) * rr; gp[i * 3 + 2] = Math.sin(th) * rr; gp[i * 3 + 1] = (Math.random() - 0.5) * 0.012 * (1 - rr * 4);
      var c = core ? [0.7, 0.55, 0.35] : [0.18, 0.42, 0.6]; gc[i * 3] = c[0]; gc[i * 3 + 1] = c[1]; gc[i * 3 + 2] = c[2];
    }
    var gg = new T.BufferGeometry(); gg.setAttribute('position', new T.BufferAttribute(gp, 3)); gg.setAttribute('color', new T.BufferAttribute(gc, 3));
    var gal = new T.Points(gg, new T.PointsMaterial({ size: 0.005, vertexColors: true, transparent: true, opacity: 0.6, blending: T.AdditiveBlending, depthWrite: false, toneMapped: false }));
    gal.position.y = 0.2; gal.rotation.x = 0.35; holo.add(gal); R.holoGal = gal;
    var cone = new T.Mesh(new T.CylinderGeometry(0.19, 0.17, 0.14, 48, 1, true), new T.ShaderMaterial({
      uniforms: { t: { value: 0 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
      fragmentShader: 'uniform float t; varying vec2 vUv; void main(){ float s = 0.5+0.5*sin(vUv.y*60.0 - t*3.0); gl_FragColor = vec4(0.35,0.85,1.0,(1.0-vUv.y)*0.12*(0.6+0.4*s)); }',
      transparent: true, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide
    }));
    cone.position.y = 0.15; holo.add(cone); R.holoCone = cone;
    var hit = new T.Mesh(new T.CylinderGeometry(0.24, 0.24, 0.35, 16), new T.MeshBasicMaterial({ visible: false })); hit.position.y = 0.15; holo.add(hit); R.holoHit = hit;

    // 左:主屏(航行数据)
    R.scr = screenTex(null, 512, 256);
    var scr = new T.Mesh(new T.PlaneGeometry(0.56, 0.28), new T.MeshBasicMaterial({ map: R.scr.t, transparent: true, toneMapped: false }));
    R.scrBaseX = -0.62; scr.position.set(-0.62, 1.0, -0.9); scr.rotation.set(-0.5, 0.32, 0); S.add(scr); R.scrMesh = scr;
    var scrBack = new T.Mesh(new T.ExtrudeGeometry(roundRect(0.62, 0.34, 0.04), { depth: 0.02, bevelEnabled: false }), graph);
    scrBack.position.set(-0.62, 1.0, -0.925); scrBack.rotation.copy(scr.rotation); S.add(scrBack); R.scrBack = scrBack;

    // 左前:引擎选择旋钮(10 段)
    var knobG = new T.Group(); knobG.position.set(-0.98, 0.88, -0.55); S.add(knobG);
    knobG.add(new T.Mesh(new T.CylinderGeometry(0.15, 0.17, 0.04, 48), white));
    var knob = new T.Mesh(new T.CylinderGeometry(0.09, 0.1, 0.07, 40), goldM); knob.position.y = 0.05; knobG.add(knob);
    var ptr = new T.Mesh(new T.BoxGeometry(0.012, 0.012, 0.07), edge); ptr.position.set(0, 0.04, -0.04); knob.add(ptr);
    R.ticks = [];
    V.engines.forEach(function (e, i) {
      var a = -Math.PI * 0.8 + i / (V.engines.length - 1) * Math.PI * 1.6;
      var tk = new T.Mesh(new T.BoxGeometry(0.012, 0.006, 0.028), new T.MeshBasicMaterial({ color: V.TIER_COLOR[e.tier], toneMapped: false }));
      tk.position.set(Math.sin(a) * 0.13, 0.025, -Math.cos(a) * 0.13); tk.rotation.y = -a; knobG.add(tk); R.ticks.push(tk);
    });
    knobG.rotation.x = -0.25; R.knob = knob; knob.userData.pick = 'knob';

    // 推力推杆
    var rail = new T.Mesh(new T.BoxGeometry(0.05, 0.02, 0.32), graph); rail.position.set(-0.3, 0.86, -0.62); rail.rotation.x = -0.25; S.add(rail);
    var lever = new T.Group(); lever.position.set(-0.3, 0.87, -0.5); S.add(lever);
    var stick = new T.Mesh(new T.CylinderGeometry(0.012, 0.012, 0.16, 12), goldM); stick.position.y = 0.08; lever.add(stick);
    var grip = new T.Mesh(new T.SphereGeometry(0.032, 20, 14), white); grip.position.y = 0.17; lever.add(grip);
    R.lever = lever;

    // 右:全息投影台(星璃)
    var pad = new T.Group(); pad.position.set(0.74, 0.86, -0.72); S.add(pad);
    pad.add(new T.Mesh(new T.CylinderGeometry(0.17, 0.2, 0.035, 56), white));
    var ring = new T.Mesh(new T.TorusGeometry(0.165, 0.005, 8, 72), gold); ring.rotation.x = Math.PI / 2; ring.position.y = 0.019; pad.add(ring);
    var ring2 = new T.Mesh(new T.TorusGeometry(0.12, 0.004, 8, 72), edge); ring2.rotation.x = Math.PI / 2; ring2.position.y = 0.019; pad.add(ring2);
    var beam = new T.Mesh(new T.CylinderGeometry(0.16, 0.17, 0.62, 40, 1, true), new T.ShaderMaterial({
      uniforms: { t: { value: 0 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
      fragmentShader: 'uniform float t; varying vec2 vUv; void main(){ float s = 0.5+0.5*sin(vUv.y*80.0 - t*4.0); float a = (1.0-vUv.y)*0.14*(0.6+0.4*s); gl_FragColor = vec4(0.35,0.85,1.0,a); }',
      transparent: true, blending: T.AdditiveBlending, depthWrite: false, side: T.BackSide
    }));
    beam.position.y = 0.32; pad.add(beam); R.beam = beam; R.pad = pad;
    R.padLight = new T.PointLight(0x6fe0ff, 0.3, 1.2); R.padLight.position.set(0.8, 1.3, -0.65); S.add(R.padLight);
    var face = new T.PointLight(0xfff4ea, 0.8, 2.2); face.position.set(0.55, 1.45, -0.2); S.add(face);

    // 两侧小屏
    R.mini = [];
    [[-1.3, 0.98, -0.3, 0.6], [1.3, 0.98, -0.3, -0.6]].forEach(function (p) {
      var st = screenTex(null, 256, 160);
      var m = new T.Mesh(new T.PlaneGeometry(0.32, 0.2), new T.MeshBasicMaterial({ map: st.t, transparent: true, toneMapped: false }));
      m.position.set(p[0], p[1], p[2]); m.rotation.set(-0.5, p[3], 0); S.add(m); R.mini.push(st);
      var bk = new T.Mesh(new T.ExtrudeGeometry(roundRect(0.36, 0.24, 0.03), { depth: 0.015, bevelEnabled: false }), graph); bk.position.set(p[0], p[1], p[2] - 0.012); bk.rotation.copy(m.rotation); S.add(bk);
    });
    // 舱外飞船也用同一张环境贴图,金属有反射
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

  /* ============================ 星璃(VRM) ============================ */
  var A = { vrm: null, mood: 'neutral', talk: 0, blinkT: 2, look: new T.Object3D(), waveT: 0, tilt: 0, bob: 0 };
  function loadAvatar() {
    return new Promise(function (res) {
      if (!window.THREE_VRM || !T.GLTFLoader) { console.warn('[voy] VRM 库缺失'); return res(null); }
      fetch('xingli.vrm').then(function (r) { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); }).then(function (buf) {
        new T.GLTFLoader().parse(buf, '', function (gltf) {
          THREE_VRM.VRMUtils.removeUnnecessaryJoints(gltf.scene);
          THREE_VRM.VRM.from(gltf, { materialImporter: new THREE_VRM.VRMMaterialImporter({ encoding: T.sRGBEncoding }) }).then(function (vrm) {
            A.vrm = vrm; var s = vrm.scene;
            s.traverse(function (o) { o.frustumCulled = false; if (o.material) [].concat(o.material).forEach(function (m) { m.toneMapped = false; }); });
            s.scale.setScalar(0.37); s.position.set(0, 0.016, 0); s.rotation.y = Math.PI;   // VRM 0.x 默认朝 -Z,转向船长
            R.pad.add(s);
            A.look.position.set(0, 1.25, 0.2); R.in.add(A.look); vrm.lookAt.target = A.look;
            pose(0); res(vrm);
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
    // 说话口型:A I U E O 轮换
    var mouth = { A: 0, I: 0, U: 0, E: 0, O: 0 };
    if (A.talk > 0) { var seq = ['A', 'I', 'U', 'E', 'O'], ph = t * 11, k = seq[Math.floor(ph) % 5]; mouth[k] = 0.35 + 0.45 * Math.abs(Math.sin(ph * Math.PI)); }
    if (A.surprise > 0) { mouth.O = Math.max(mouth.O, A.surprise); A.surprise = Math.max(0, A.surprise - dt * 0.5); }
    Object.keys(mouth).forEach(function (k) { bs(k, mouth[k]); });
    if (A.waveT > 0) A.waveT -= dt * 0.45;
    // 视线跟随指针
    A.look.position.set(R.mouse.x * 0.8, 1.2 + R.mouse.y * 0.5, 0.3);
    A.vrm.scene.position.y = 0.016 + Math.sin(t * 1.4) * 0.006;
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
    UI.engList.querySelectorAll('.voy-e').forEach(function (b) {
      var e = V.engine(b.dataset.id); b.classList.toggle('is-sel', VY.engine === e.id); b.classList.toggle('is-fit', !!(to && e.fit.indexOf(to) >= 0));
      b.disabled = VY.state === 'travel' || (to === 'outer' ? e.id !== 'mind' : e.id === 'mind');
    });
    var e = VY.engine && V.engine(VY.engine);
    UI.engInfo.innerHTML = e ? '<b style="color:' + V.TIER_COLOR[e.tier] + '">' + e.tier + '</b> ' + esc(e.fact) : '<span class="voy-dim">转动左侧旋钮或点选引擎。三种颜色代表科学可信度:<b style="color:#7fe3c4">实测</b> / <b style="color:#ffd27a">推断</b> / <b style="color:#c9a6ff">猜想</b>。</span>';
    if (R.knob) { var idx = e ? V.engines.indexOf(e) : 0; R.knobTarget = -(-Math.PI * 0.8 + idx / (V.engines.length - 1) * Math.PI * 1.6); }
  }

  /* ============================ 航图 ============================ */
  function openMap() { UI.map.hidden = false; UI.mapCard.hidden = true; drawMap(); sfx.open(); }
  function mapGeom() {
    var cv = UI.mapCv, w = cv.clientWidth, hh = cv.clientHeight, cx = w / 2, cy = hh / 2 + 10, R0 = Math.min(w, hh) * 0.06, R1 = Math.min(w, hh) * 0.46;
    return { w: w, h: hh, cx: cx, cy: cy, r: function (i) { return R0 + (R1 - R0) * (i + 0.5) / V.sectors.length; } };
  }
  function drawMap() {
    var cv = UI.mapCv, pr = Math.min(2, devicePixelRatio || 1), Gm = mapGeom(); cv.width = Gm.w * pr; cv.height = Gm.h * pr;
    var g = cv.getContext('2d'); g.setTransform(pr, 0, 0, pr, 0, 0); g.clearRect(0, 0, Gm.w, Gm.h);
    V.sectors.forEach(function (s, i) {
      var r = Gm.r(i), here = s.id === VY.at, tgt = s.id === VY.target, col = s.status === 'open' ? '#7fe3c4' : s.status === 'conjecture' ? '#c9a6ff' : '#8aa0c0';
      g.beginPath(); g.arc(Gm.cx, Gm.cy, r, 0, Math.PI * 2);
      g.setLineDash(s.status === 'conjecture' ? [4, 6] : s.status === 'uncharted' ? [2, 4] : []);
      g.strokeStyle = tgt ? '#ffffff' : col; g.globalAlpha = tgt ? 1 : 0.55; g.lineWidth = tgt ? 2.4 : 1.2; g.stroke(); g.setLineDash([]); g.globalAlpha = 1;
      var a = -Math.PI * 0.92 + i * (Math.PI * 1.25 / (V.sectors.length - 1)), x = Gm.cx + Math.cos(a) * r, y = Gm.cy + Math.sin(a) * r;
      s._xy = [x, y];
      g.beginPath(); g.arc(x, y, here ? 9 : 6, 0, Math.PI * 2); g.fillStyle = here ? '#ffffff' : col; g.fill();
      if (here) { g.beginPath(); g.arc(x, y, 14 + Math.sin(R.t * 3) * 2, 0, Math.PI * 2); g.strokeStyle = '#7fe3ff'; g.stroke(); }
      g.font = '600 13px sans-serif'; g.fillStyle = '#e8f2ff'; g.textAlign = 'center';
      var narrow = Gm.w < 560, side = Math.cos(a) < -0.2 ? -1 : Math.cos(a) > 0.2 ? 1 : 0;
      g.font = (narrow ? '600 12px' : '600 13px') + ' sans-serif';
      var lx = x + side * (narrow ? 12 : 14), ly = side ? y + 4 : y - 16; g.textAlign = side < 0 ? 'right' : side > 0 ? 'left' : 'center';
      if (here) { lx = x; ly = y + 26; g.textAlign = 'center'; }
      g.fillText(s.n + ' ' + s.zh, lx, ly);
      g.font = '11px sans-serif'; g.fillStyle = col; g.fillText(V.STATUS_ZH[s.status], lx, ly + 14);
    });
    g.font = '11px sans-serif'; g.fillStyle = 'rgba(200,220,255,0.6)'; g.textAlign = 'center';
    g.fillText('越往外越远(对数尺度:每一圈都比上一圈远几十到几十万倍)', Gm.cx, Gm.h - 40);
  }
  function mapTap(cx, cy) {
    var rect = UI.mapCv.getBoundingClientRect(), x = cx - rect.left, y = cy - rect.top, best = null, bd = 30;
    V.sectors.forEach(function (s) { if (!s._xy) return; var d = Math.hypot(s._xy[0] - x, s._xy[1] - y); if (d < bd) { bd = d; best = s; } });
    if (!best) return; sfx.sector(best.id);
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
    UI.root.classList.add('pick-engine');
  }
  function pickEngine(id) {
    if (VY.state === 'travel') return;
    if (!VY.target) { say(['think', '船长,先在航图上选一个目的地哦~']).then(function () { openMap(); }); return; }
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
    R.ptr.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); R.ray.setFromCamera(R.ptr, R.cam);
    var hits = R.ray.intersectObjects(R.in.children, true);
    for (var i = 0; i < hits.length; i++) {
      var o = hits[i].object, isAv = false, p = o; while (p) { if (A.vrm && p === A.vrm.scene) isAv = true; p = p.parent; }
      if (isAv) { var l = V.lines.poke[(Math.random() * V.lines.poke.length) | 0]; A.waveT = 1.2; say(l); return; }
      if (o === R.holoHit) { if (VY.state !== 'travel') { sfx.glass ? sfx.glass(880) : 0; openMap(); } return; }
      if (o === R.knob || o.parent === R.knob) { if (VY.state === 'travel') return; var idx = VY.engine ? V.engines.indexOf(V.engine(VY.engine)) : -1; var nx = V.engines[(idx + 1) % V.engines.length]; pickEngine(nx.id); return; }
    }
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
    R.cam.position.set(R.mouse.x * 0.05 + sx * 2, 1.3 + R.mouse.y * 0.025 + sy * 2, 0.8); R.cam.lookAt(R.look);
    FX.update(dt, R.t, R.outCam); if (FX.engUpdate) FX.engUpdate(dt, R.t, R.outCam);
    if (R.knob && R.knobTarget != null) R.knob.rotation.y += (R.knobTarget - R.knob.rotation.y) * Math.min(1, dt * 8);
    if (R.lever) R.lever.position.z += ((-0.6 - (R.leverTarget || (R.power || 0) * 0.12)) - R.lever.position.z) * Math.min(1, dt * 6);
    R.beam.material.uniforms.t.value = R.t;
    if (R.holoGal) { R.holoGal.rotation.y = R.t * 0.12; R.holoCone.material.uniforms.t.value = R.t; R.goldMat.color.setHSL(0.1, 1, 0.68 + (R.power || 0) * 0.1 + Math.sin(R.t * 1.2) * 0.02); }
    R.cabinLight.intensity = 0.8 + (R.power || 0) * 0.6 + (VY.state === 'travel' ? Math.sin(R.t * 30) * 0.05 : 0);
    if ((R.frame = (R.frame || 0) + 1) % 3 === 0) drawScreens();
    updAvatar(dt, R.t);
    if (!UI.map.hidden && R.frame % 6 === 0) drawMap();
    // 闲聊
    if (VY.state === 'idle' && UI.map.hidden) { R.idle = (R.idle || 0) + dt; if (R.idle > 28) { R.idle = 0; say(V.lines.idle[(Math.random() * V.lines.idle.length) | 0]); } } else R.idle = 0;
    var r = R.r; r.clear(); r.render(R.out, R.outCam); if (!R.evaView) { r.clearDepth(); r.render(R.in, R.cam); }
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
        (first ? sayList(V.lines.hello) : say(V.lines.back[0])).then(function () { return say(['neutral', '点击「航图」选择目的地,或者直接点左边的引擎看看。'], {}, [{ label: '打开航图', value: 'map' }]); }).then(function (v) { if (v === 'map') openMap(); });
      });
    } else { R.clock.getDelta(); loop(); say(V.lines.back[0]); }
    fade(1); setTimeout(function () { fade(0); }, 60);
  };
  SH.voyExit = function () {
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
    b.addEventListener('click', SH.voyEnter); var bm = nav.querySelector('.sh-btn-map'); nav.insertBefore(b, bm ? bm.nextSibling : null);
    var mb = document.querySelector('#sh-map .sh-map__bar');   // M1 航图里也能直接登舰
    if (mb) { var g = h('button', 'le-btn le-btn--sm sh-map__voy', '🚀 登舰航行'); g.type = 'button'; g.addEventListener('click', function () { document.getElementById('sh-map').hidden = true; SH.voyEnter(); }); mb.insertBefore(g, mb.lastElementChild); }
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && VY.active) { if (UI.map && !UI.map.hidden) UI.map.hidden = true; else SH.voyExit(); } });
  }
  (function wait2(n) { if (document.querySelector('.sh-btn-quest')) return addEntry(); if (n > 600) return; setTimeout(function () { wait2(n + 1); }, 100); })(0);
  if (/[?&]voy=1/.test(location.search)) (function w3(n) { if (window.SH_READY) return SH.voyEnter(); if (n < 600) setTimeout(function () { w3(n + 1); }, 100); })(0);
})();
