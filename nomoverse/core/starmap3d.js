/* 宙律 Nomoverse · 宇宙尺度星图 3D(v0.2-α2)
   ES 模块,仅在 NV.gl3d 可用时由首页动态 import;THREE 由调用方传入(同一份本地 vendor)。
   任何构建 / 渲染 / context lost 失败都通过 cfg.onFail 交回首页,首页回到 2D 星图。
   draw call 控制:知识星 1(Points + 自定义着色器)、星座连线 1、背景星 1、轴 + 刻度 2、地标若干、星云 sprite 若干。 */
export function mount(THREE, cfg) {
  "use strict";
  var D = document, W = window, el = cfg.el, sup = cfg.sup;
  var STARS = cfg.stars, CONS = cfg.cons, COL = cfg.colors, LM = cfg.landmarks;
  var EMIN = -15, EMAX = 21, U = 3.2;                 // 每个数量级 = 3.2 个世界单位
  var RM = !!cfg.RM;
  function X(e) { return (e - EMIN) * U; }
  function clampE(e) { return Math.max(EMIN, Math.min(EMAX, e)); }
  function hash(i) { var x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  function fmtE(e) { var r = Math.round(e); return "10" + sup(r) + " m"; }
  function nearLm(e) { var best = null, bd = 1.3; LM.forEach(function (l) { var d = Math.abs(l[0] - e); if (d < bd) { bd = d; best = l[1]; } }); return best; }

  /* ---------------- DOM:舞台、画布、标签层、玻璃卡、底部刻度条、无障碍列表 ---------------- */
  var stage = el("div", { class: "sm3", "data-state": "loading" });
  var view = el("div", { class: "sm3-view", tabindex: "0", role: "group",
    "aria-label": "3D 宇宙尺度星图视窗:左右方向键沿尺度轴飞行,Tab 进入知识星列表", "aria-describedby": "sm3-help" });
  var cv = el("canvas", { class: "sm3-cv", "aria-hidden": "true" });
  var labels = el("div", { class: "sm3-labels", "aria-hidden": "true" });
  var ring = el("div", { class: "sm3-ring", "aria-hidden": "true" });
  var hud = el("div", { class: "sm3-hud", "aria-hidden": "true" }, [el("b", { text: "SCALE MAP · 3D" }), el("span", { class: "sm3-hint", text: "拖动 / 滚轮 / ← → 飞行 · 点星查看" })]);
  var help = el("p", { id: "sm3-help", class: "sr", text: "画面中央是一条从 10⁻¹⁵ 米(质子)到 10²¹ 米(银河系)的对数尺度轴,8 个星座的知识星环绕排列。用底部滑杆或方向键改变尺度,Tab 到知识星按回车查看说明。" });
  view.appendChild(cv); view.appendChild(labels); view.appendChild(ring); view.appendChild(hud);
  stage.appendChild(view); stage.appendChild(help);

  // 玻璃信息卡(桌面在左侧,竖屏变底部卡)
  var cardBody = el("div", { class: "sm3-cbody" });
  var cardClose = el("button", { class: "sm3-x", type: "button", "aria-label": "关闭星点信息", text: "×", onclick: function () { closeCard(true); } });
  var card = el("aside", { class: "sm3-card", role: "region", "aria-label": "星点信息", hidden: true }, [cardClose, cardBody]);
  var live = el("div", { class: "sr", "aria-live": "polite" });
  stage.appendChild(card); stage.appendChild(live);

  // 底部玻璃条:读数 + 10ⁿ 刻度 + 缩放滑杆 + −/+
  var readE = el("b", { class: "sm3-re" }), readL = el("span", { class: "sm3-rl" });
  var rule = el("div", { class: "sm3-rule" });
  var slider = el("input", { class: "sm3-sl", type: "range", min: String(EMIN), max: String(EMAX), step: "0.1", value: "0", "aria-label": "尺度(10 的幂,米)" });
  var bMinus = el("button", { class: "sm3-z", type: "button", "aria-label": "缩小一个数量级", text: "−" });
  var bPlus = el("button", { class: "sm3-z", type: "button", "aria-label": "放大一个数量级", text: "+" });
  var bar = el("div", { class: "sm3-bar" }, [
    el("div", { class: "sm3-read", "aria-hidden": "true" }, [readE, readL]),
    bMinus,
    el("div", { class: "sm3-track" }, [rule, slider]),
    bPlus
  ]);
  stage.appendChild(bar);
  var ticks = [];
  for (var te = EMIN; te <= EMAX; te++) {
    var pct = (te - EMIN) / (EMAX - EMIN) * 100;
    rule.appendChild(el("i", { class: te % 3 ? "mn" : "mj", style: "left:" + pct + "%" }));
    if (te % 3 === 0) {
      var tb = el("button", { type: "button", class: "sm3-tl" + (te % 6 ? " odd" : "") + (te % 12 ? " n12" : ""), style: "left:" + pct + "%", "data-e": String(te),
        "aria-label": "飞到 10 的 " + te + " 次方米", tabindex: "-1", text: "10" + sup(te) });
      ticks.push(tb); rule.appendChild(tb);
    }
  }
  var ruleCur = el("i", { class: "sm3-cur" }); rule.appendChild(ruleCur);

  // 无障碍:知识星列表(视觉隐藏,聚焦时 3D 画面飞到该星并显示焦点环)
  var list = el("div", { class: "sm3-list sr", role: "group", "aria-label": "知识星列表:" + STARS.length + " 颗,按星座分组;回车查看说明" });
  var btns = [];
  CONS.forEach(function (cn, ci) {
    var g = el("div", { role: "group", "aria-label": cn + " 星座" });
    STARS.forEach(function (s, i) {
      if (s.cons !== ci) return;
      var b = el("button", { type: "button", "data-i": String(i) , text: s.name });
      b.addEventListener("focus", function () { focusI = i; flyTo(s.e); });
      b.addEventListener("blur", function () { if (focusI === i) focusI = -1; });
      b.addEventListener("click", function () { select(i, false); });
      btns[i] = b; g.appendChild(b);
    });
    list.appendChild(g);
  });
  stage.appendChild(list);
  function stateTxt(s) { return s.lit ? "已点亮" : s.task ? "本期可点亮" : "待探索"; }
  function labelBtns() { STARS.forEach(function (s, i) { btns[i].setAttribute("aria-label", s.name + "," + CONS[s.cons] + "星座,约 10 的 " + Math.round(s.e) + " 次方米," + stateTxt(s)); btns[i].setAttribute("aria-pressed", sel === i ? "true" : "false"); }); }

  cfg.host.parentNode.insertBefore(stage, cfg.host);

  /* ---------------- Three.js 场景 ---------------- */
  var renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: false, powerPreference: "low-power" });
  var PR = Math.min(2, W.devicePixelRatio || 1);
  renderer.setPixelRatio(PR);
  renderer.setClearColor(0x05041a, 1);
  var scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x05041a, 16, 58);
  var cam = new THREE.PerspectiveCamera(46, 1, 0.1, 400);
  scene.add(new THREE.AmbientLight(0x8b84d6, 0.9));
  var key = new THREE.DirectionalLight(0xffffff, 2.0); key.position.set(-4, 6, 8); scene.add(key);

  function canvasTex(w, h, paint) { var c = D.createElement("canvas"); c.width = w; c.height = h; paint(c.getContext("2d"), w, h); var t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
  var glowTex = canvasTex(128, 128, function (c, w) { var g = c.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(0.25, "rgba(255,255,255,.45)"); g.addColorStop(1, "rgba(255,255,255,0)"); c.fillStyle = g; c.fillRect(0, 0, w, w); });
  function glow(color, size, op) { var s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: color, transparent: true, opacity: op == null ? 0.8 : op, depthWrite: false, blending: THREE.AdditiveBlending })); s.scale.setScalar(size); return s; }

  var L = X(EMAX);
  // 尺度轴:亮芯 + 外发光(两根细圆柱)
  var axGeo = new THREE.CylinderGeometry(0.035, 0.035, L + 8, 8, 1, true); axGeo.rotateZ(Math.PI / 2);
  var axis = new THREE.Mesh(axGeo, new THREE.MeshBasicMaterial({ color: 0xe0e7ff, transparent: true, opacity: 0.95, fog: true }));
  axis.position.x = L / 2; scene.add(axis);
  var axGeo2 = new THREE.CylinderGeometry(0.16, 0.16, L + 8, 10, 1, true); axGeo2.rotateZ(Math.PI / 2);
  var axisGlow = new THREE.Mesh(axGeo2, new THREE.MeshBasicMaterial({ color: 0x7c8cff, transparent: true, opacity: 0.16, depthWrite: false, blending: THREE.AdditiveBlending }));
  axisGlow.position.x = L / 2; scene.add(axisGlow);
  // 刻度:每个数量级一条大刻度,中间 2–9 的对数小刻度(1 个 LineSegments)
  (function () {
    var p = [];
    for (var e = EMIN; e <= EMAX; e++) {
      var x = X(e), big = e % 3 === 0 ? 0.55 : 0.32;
      p.push(x, -big, 0, x, big * 0.15, 0);
      p.push(x, 0, -big * 0.6, x, 0, big * 0.6);
      if (e < EMAX) for (var k = 2; k <= 9; k++) { var xx = X(e + Math.log10(k)); p.push(xx, -0.12, 0, xx, 0.02, 0); }
    }
    var g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(p, 3));
    scene.add(new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: 0xa5b4fc, transparent: true, opacity: 0.7 })));
  })();

  // 背景星(1 个 Points)
  (function () {
    var N = 2600, p = new Float32Array(N * 3), c = new Float32Array(N * 3), tc = new THREE.Color();
    for (var i = 0; i < N; i++) {
      var th = hash(i * 3 + 1) * Math.PI * 2, r = 26 + hash(i * 3 + 2) * 70;
      p[i * 3] = -40 + hash(i * 3 + 3) * (L + 90); p[i * 3 + 1] = Math.sin(th) * r; p[i * 3 + 2] = Math.cos(th) * r - 10;
      tc.setHSL(0.62 + hash(i + 9) * 0.18, 0.5, 0.72 + hash(i + 5) * 0.25); c[i * 3] = tc.r; c[i * 3 + 1] = tc.g; c[i * 3 + 2] = tc.b;
    }
    var g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(p, 3)); g.setAttribute("color", new THREE.BufferAttribute(c, 3));
    scene.add(new THREE.Points(g, new THREE.PointsMaterial({ size: 1.6, sizeAttenuation: false, vertexColors: true, transparent: true, opacity: 0.75, fog: false, depthWrite: false })));
  })();
  // 远景星云(少量大 sprite)
  [[-6, 0x6d28d9, 34, -30, 12], [12, 0x7c2d12, 40, -40, -10], [28, 0x1e3a8a, 46, -36, 16], [44, 0x581c87, 42, -44, -14], [62, 0x7c2d12, 46, -40, 10], [84, 0x312e81, 50, -46, -12], [104, 0x701a75, 54, -50, 8]].forEach(function (n) {
    var s = glow(n[1], n[2], 0.35); s.material.fog = false; s.position.set(n[0], n[4], n[3]); scene.add(s);
  });

  // 知识星:位置 = 尺度轴上的 X(e),绕轴按星座分角度成团
  var N = STARS.length, pos = new Float32Array(N * 3), colA = new Float32Array(N * 3), stA = new Float32Array(N), selA = new Float32Array(N), seedA = new Float32Array(N);
  var world = [];
  STARS.forEach(function (s, i) {
    var a = s.cons / CONS.length * Math.PI * 2 + 0.35 + (hash(i) - 0.5) * 0.55, r = 2.3 + hash(i + 77) * 1.3;
    var x = X(s.e) + (hash(i + 31) - 0.5) * 0.25, y = Math.sin(a) * r, z = Math.cos(a) * r;
    pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z; world.push(new THREE.Vector3(x, y, z));
    var c = new THREE.Color(COL[s.cons]); colA[i * 3] = c.r; colA[i * 3 + 1] = c.g; colA[i * 3 + 2] = c.b;
    seedA[i] = hash(i + 5) * 6.28;
  });
  var sg = new THREE.BufferGeometry();
  sg.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  sg.setAttribute("aColor", new THREE.BufferAttribute(colA, 3));
  sg.setAttribute("aState", new THREE.BufferAttribute(stA, 1));
  sg.setAttribute("aSel", new THREE.BufferAttribute(selA, 1));
  sg.setAttribute("aSeed", new THREE.BufferAttribute(seedA, 1));
  var uni = { uTime: { value: 0 }, uScale: { value: 300 }, uPR: { value: PR }, uMove: { value: RM ? 0 : 1 } };
  var starMat = new THREE.ShaderMaterial({
    uniforms: uni, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: [
      "attribute vec3 aColor; attribute float aState; attribute float aSel; attribute float aSeed;",
      "uniform float uTime, uScale, uPR, uMove; varying vec3 vC; varying float vS, vSel, vF, vTw;",
      "void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); float d = -mv.z;",
      " vC = aColor; vS = aState; vSel = aSel; vTw = 0.85 + 0.15*sin(uTime*2.1 + aSeed)*uMove;",
      " float base = aState > 1.5 ? 2.4 : (aState > 0.5 ? 1.9 : 1.15); base *= (1.0 + aSel*0.6);",
      " gl_PointSize = clamp(base * uScale * uPR / d, 3.0*uPR, 60.0*uPR);",
      " vF = clamp((70.0 - d) / 48.0, 0.0, 1.0) * clamp((d - 0.8) / 2.0, 0.0, 1.0);",
      " gl_Position = projectionMatrix * mv; }"].join("\n"),
    fragmentShader: [
      "uniform float uTime, uMove; varying vec3 vC; varying float vS, vSel, vF, vTw;",
      "void main(){ float d = length(gl_PointCoord - 0.5) * 2.0; if (d > 1.0) discard; vec3 c; float a;",
      " if (vS > 1.5) { float core = smoothstep(0.30, 0.0, d); float halo = exp(-d*d*5.0);",
      "   c = mix(vC, vec3(1.0), core) * (core*1.6 + halo*0.95) * vTw; a = 1.0; }",
      " else if (vS > 0.5) { float core = smoothstep(0.26, 0.04, d); float halo = exp(-d*d*9.0)*0.55;",
      "   float pulse = 0.55 + 0.45*sin(uTime*2.6)*uMove; float rg = smoothstep(0.1, 0.0, abs(d - 0.74)) * pulse;",
      "   c = vC * (core*1.3 + halo) + vC * rg * 0.95; a = 1.0; }",
      " else { float core = smoothstep(0.34, 0.06, d); vec3 g = mix(vC, vec3(0.62,0.6,0.78), 0.65); c = g * core * 0.62; a = 1.0; }",
      " float sr = smoothstep(0.07, 0.0, abs(d - 0.9)) * vSel; c += vec3(1.0) * sr;",
      " gl_FragColor = vec4(c * vF, a); }"].join("\n")
  });
  var starPts = new THREE.Points(sg, starMat); starPts.frustumCulled = false; scene.add(starPts);

  // 星座连线(按尺度排序串起同星座的星,淡显;1 个 LineSegments)
  (function () {
    var p = [], c = [];
    CONS.forEach(function (cn, ci) {
      var ids = []; STARS.forEach(function (s, i) { if (s.cons === ci) ids.push(i); });
      ids.sort(function (a, b) { return STARS[a].e - STARS[b].e; });
      var col = new THREE.Color(COL[ci]);
      for (var k = 1; k < ids.length; k++) {
        var A = world[ids[k - 1]], B = world[ids[k]];
        if (B.x - A.x > U * 4.2) continue;            // 相隔太远的不连,避免长线横穿画面
        p.push(A.x, A.y, A.z, B.x, B.y, B.z); c.push(col.r, col.g, col.b, col.r, col.g, col.b);
      }
    });
    var g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(p, 3)); g.setAttribute("color", new THREE.Float32BufferAttribute(c, 3));
    scene.add(new THREE.LineSegments(g, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.26, depthWrite: false, blending: THREE.AdditiveBlending })));
  })();
  // 星座星云:每个星座在其星的尺度中位处放一团淡色光晕
  CONS.forEach(function (cn, ci) {
    var xs = [], ys = 0, zs = 0, n = 0;
    STARS.forEach(function (s, i) { if (s.cons === ci && Math.abs(s.e) < 11) { xs.push(world[i].x); ys += world[i].y; zs += world[i].z; n++; } });
    if (!n) return; xs.sort(function (a, b) { return a - b; });
    var g = glow(COL[ci], 5.5, 0.12); g.position.set(xs[xs.length >> 1], ys / n * 1.05, zs / n * 1.05); scene.add(g);
  });

  /* ---------------- 地标(程序几何,无外部贴图) ---------------- */
  function std(col, em, op) { return new THREE.MeshStandardMaterial({ color: col, emissive: em || 0x000000, emissiveIntensity: 1, roughness: 0.7, metalness: 0.05, transparent: op != null, opacity: op == null ? 1 : op }); }
  function basic(col, op, add) { return new THREE.MeshBasicMaterial({ color: col, transparent: op != null, opacity: op == null ? 1 : op, depthWrite: !add, blending: add ? THREE.AdditiveBlending : THREE.NormalBlending }); }
  var lmObjs = [], spin = [];
  function place(e, obj, y) { obj.position.set(X(e), y == null ? 0.75 : y, 0); scene.add(obj); lmObjs.push({ e: e, o: obj }); return obj; }
  LM.forEach(function (l) {
    var e = l[0], g = new THREE.Group(), n = l[1];
    if (n === "质子") {
      g.add(new THREE.Mesh(new THREE.SphereGeometry(0.42, 24, 16), basic(0xffb37a)));
      g.add(glow(0xff7a3d, 2.6, 0.9));
      [0, 1, 2].forEach(function (k) { var q = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), basic([0xff6b6b, 0x6bff9e, 0x6bb5ff][k])); q.position.set(Math.cos(k * 2.09) * 0.2, Math.sin(k * 2.09) * 0.2, 0.3); g.add(q); });
    } else if (n === "原子") {
      g.add(new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 12), basic(0xffa07a))); g.add(glow(0xff8a65, 0.9, 0.7));
      var p = [];
      [0, 1.05, 2.1].forEach(function (rot) { for (var i = 0; i < 48; i++) { var a0 = i / 48 * 6.283, a1 = (i + 1) / 48 * 6.283; function pt(a) { var x = Math.cos(a) * 0.62, y = Math.sin(a) * 0.22; return [x * Math.cos(rot) - y * Math.sin(rot), x * Math.sin(rot) + y * Math.cos(rot), y * 0.6]; } p.push.apply(p, pt(a0)); p.push.apply(p, pt(a1)); } });
      var og = new THREE.BufferGeometry(); og.setAttribute("position", new THREE.Float32BufferAttribute(p, 3));
      g.add(new THREE.LineSegments(og, new THREE.LineBasicMaterial({ color: 0x67e8f9, transparent: true, opacity: 0.85 })));
      spin.push([g, 0.6, "z"]);
    } else if (n === "病毒") {
      g.add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.34, 1), std(0x34d399, 0x064e3b)));
      var sp = [], ico = new THREE.IcosahedronGeometry(0.34, 0).attributes.position;
      for (var i = 0; i < ico.count; i++) { var v = new THREE.Vector3().fromBufferAttribute(ico, i); sp.push(v.x, v.y, v.z, v.x * 1.55, v.y * 1.55, v.z * 1.55); }
      var vg = new THREE.BufferGeometry(); vg.setAttribute("position", new THREE.Float32BufferAttribute(sp, 3));
      g.add(new THREE.LineSegments(vg, new THREE.LineBasicMaterial({ color: 0xa7f3d0 })));
      spin.push([g, 0.4, "y"]);
    } else if (n === "细胞") {
      g.add(new THREE.Mesh(new THREE.SphereGeometry(0.5, 28, 20), std(0x5eead4, 0x0f3d3a, 0.38)));
      var nu = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12), std(0xf97316, 0x7c2d12)); nu.position.set(0.08, 0.04, 0.12); g.add(nu);
    } else if (n === "人") {
      var m = std(0xd8dcf0, 0x2a2a4a);
      var body = new THREE.Mesh(new THREE.CapsuleGeometry(0.14, 0.42, 4, 10), m); body.position.y = 0.05; g.add(body);
      var head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 14, 10), m); head.position.y = 0.48; g.add(head);
      [-1, 1].forEach(function (s) { var leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.36, 3, 8), m); leg.position.set(0.07 * s, -0.42, 0); g.add(leg); });
      g.position.y = 1.15;
    } else if (n === "珠峰") {
      var mt = new THREE.Mesh(new THREE.ConeGeometry(0.75, 0.95, 7, 1), new THREE.MeshStandardMaterial({ color: 0x6b7280, roughness: 0.95, flatShading: true }));
      g.add(mt);
      var cap = new THREE.Mesh(new THREE.ConeGeometry(0.29, 0.36, 7, 1), new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.6, flatShading: true })); cap.position.y = 0.3; g.add(cap);
      g.position.y = 0.55;
    } else if (n === "地球") {
      var et = canvasTex(256, 128, function (c, w, h) {
        c.fillStyle = "#1d4ed8"; c.fillRect(0, 0, w, h);
        for (var i = 0; i < 46; i++) { c.fillStyle = i % 5 ? "#15803d" : "#a16207"; c.beginPath(); c.ellipse(hash(i) * w, h * 0.18 + hash(i + 40) * h * 0.64, 6 + hash(i + 80) * 22, 4 + hash(i + 120) * 12, hash(i + 3) * 3, 0, 7); c.fill(); }
        c.fillStyle = "#e5e7eb"; c.fillRect(0, 0, w, 9); c.fillRect(0, h - 9, w, 9);
        c.globalAlpha = 0.35; c.fillStyle = "#fff"; for (var k = 0; k < 30; k++) c.fillRect(hash(k + 300) * w, hash(k + 400) * h, 10 + hash(k + 500) * 30, 2);
      });
      var earth = new THREE.Mesh(new THREE.SphereGeometry(0.55, 32, 22), new THREE.MeshStandardMaterial({ map: et, roughness: 0.8 }));
      g.add(earth); g.add(glow(0x60a5fa, 1.9, 0.45)); spin.push([earth, 0.3, "y"]);
      g.position.y = 0.95;
    } else if (n === "日地距离") {
      g.add(new THREE.Mesh(new THREE.SphereGeometry(0.62, 28, 20), basic(0xffb347))); g.add(glow(0xff8c1a, 3.6, 0.85));
      g.position.y = 1.05;
    } else if (n === "1 光年") {
      var rg = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.025, 6, 64), basic(0xa5f3fc, 0.85, true)); rg.rotation.y = Math.PI / 2; g.add(rg);
      g.add(glow(0x67e8f9, 1.2, 0.5)); g.position.y = 0;
    } else if (n === "银河系") {
      var NG = 3600, gp = new Float32Array(NG * 3), gc = new Float32Array(NG * 3), cc = new THREE.Color();
      for (var j = 0; j < NG; j++) {
        var arm = j % 2, t = Math.pow(hash(j + 900), 0.7), rr = 0.15 + t * 2.6, ang = arm * Math.PI + t * 7.2 + (hash(j + 1700) - 0.5) * 0.7;
        gp[j * 3] = Math.cos(ang) * rr; gp[j * 3 + 1] = (hash(j + 2500) - 0.5) * 0.14 * (1 - t); gp[j * 3 + 2] = Math.sin(ang) * rr;
        cc.setHSL(t < 0.25 ? 0.1 : 0.7 - t * 0.1, 0.6, 0.62 + (1 - t) * 0.3); gc[j * 3] = cc.r; gc[j * 3 + 1] = cc.g; gc[j * 3 + 2] = cc.b;
      }
      var gg = new THREE.BufferGeometry(); gg.setAttribute("position", new THREE.BufferAttribute(gp, 3)); gg.setAttribute("color", new THREE.BufferAttribute(gc, 3));
      var gal = new THREE.Points(gg, new THREE.PointsMaterial({ size: 0.06, vertexColors: true, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending }));
      var gw = new THREE.Group(); gw.add(gal); gw.add(glow(0xffe4b5, 1.6, 0.8)); gw.rotation.set(0.9, 0, 0.35); g.add(gw); spin.push([gal, 0.08, "y"]);
      g.position.y = 1.2;
    }
    lmObjs.push({ e: e, o: g, name: n }); g.position.x = X(e); if (g.position.y === 0 && n !== "1 光年") g.position.y = 0.75; scene.add(g);
  });

  /* ---------------- 相机飞行 ---------------- */
  var camE = clampE(cfg.startE == null ? 0 : cfg.startE), tgtE = camE, sel = -1, focusI = -1, hoverI = -1;
  var tmpV = new THREE.Vector3(), look = new THREE.Vector3();
  var vw = 1, vh = 1, portrait = false;
  var offX = 0, offY = 0;              // 信息卡打开时把画面让开(桌面右移、竖屏上移),平滑过渡
  function placeCam(k) {
    var x = X(camE), open = !card.hidden;
    var tx = portrait ? (open ? -2.8 : 0) : (open ? (vw > 700 ? -2.6 : -6) : 0), ty = portrait ? (open ? -3.4 : -1.5) : (vh < 400 ? -0.9 : -0.3);
    offX += (tx - offX) * (k == null ? 1 : k); offY += (ty - offY) * (k == null ? 1 : k);
    // 斜后上方俯视,让尺度轴从左下延伸到右上(参照 ui_AC_scalemap)
    if (portrait) { cam.position.set(x - 7.5, 3.6, 12.5); look.set(x + 3.2 + offX, 0.9 + offY, 0); }
    else { cam.position.set(x - 8.5, 2.8, 9.6); look.set(x + 4.5 + offX, 1.4 + offY, 0); }
    cam.lookAt(look);
  }
  function flyTo(e, instant) {
    tgtE = clampE(e); if (instant || RM) camE = tgtE;
    syncUI(); kick();
  }
  function syncUI() {
    if (D.activeElement !== slider) slider.value = String(Math.round(tgtE * 10) / 10);
    var l = nearLm(tgtE);
    slider.setAttribute("aria-valuetext", "约 10 的 " + Math.round(tgtE) + " 次方米" + (l ? "," + l + "的尺度" : ""));
    readE.textContent = fmtE(tgtE); readL.textContent = l ? "· " + l : "";
    ruleCur.style.left = ((tgtE - EMIN) / (EMAX - EMIN) * 100) + "%";
  }
  slider.addEventListener("input", function () { flyTo(+slider.value); });
  slider.addEventListener("change", function () { cfg.snd && cfg.snd.play && cfg.snd.play("tick"); });
  bMinus.addEventListener("click", function () { flyTo(Math.round(tgtE) - 1); });
  bPlus.addEventListener("click", function () { flyTo(Math.round(tgtE) + 1); });
  ticks.forEach(function (b) { b.addEventListener("click", function (ev) { ev.stopPropagation(); flyTo(+b.getAttribute("data-e")); }); });
  rule.addEventListener("click", function (ev) { var r = rule.getBoundingClientRect(); if (r.width > 0) flyTo(EMIN + (ev.clientX - r.left) / r.width * (EMAX - EMIN)); });
  // 键盘:舞台内(非滑杆 / 列表按钮外)左右箭头飞行;列表按钮上左右切换到尺度相邻的星
  var order = STARS.map(function (s, i) { return i; }).sort(function (a, b) { return STARS[a].e - STARS[b].e; });
  stage.addEventListener("keydown", function (ev) {
    var k = ev.key, t = ev.target;
    if (k === "Escape" && !card.hidden) { closeCard(true); ev.preventDefault(); return; }
    if (t === slider || (k !== "ArrowLeft" && k !== "ArrowRight")) return;
    var d = k === "ArrowLeft" ? -1 : 1;
    if (t.parentNode && t.parentNode.parentNode === list) {
      var at = order.indexOf(+t.getAttribute("data-i")), nx = order[Math.max(0, Math.min(order.length - 1, at + d))];
      btns[nx].focus(); ev.preventDefault(); return;
    }
    if (t === view || t.tagName !== "BUTTON") { flyTo(tgtE + d * (ev.shiftKey ? 3 : 0.5)); ev.preventDefault(); }
  });
  // 滚轮:在画面上滚动 = 沿轴飞行;到两端时放行页面滚动
  view.addEventListener("wheel", function (ev) {
    var d = (ev.deltaY || ev.deltaX) * (ev.deltaMode === 1 ? 16 : 1);
    if ((d < 0 && tgtE <= EMIN) || (d > 0 && tgtE >= EMAX)) return;
    ev.preventDefault(); flyTo(tgtE + d * 0.006);
  }, { passive: false });
  // 拖动 / 点选
  var drag = null;
  view.addEventListener("pointerdown", function (ev) { drag = { x: ev.clientX, y: ev.clientY, e: tgtE, moved: false, id: ev.pointerId }; });
  view.addEventListener("pointermove", function (ev) {
    if (drag && drag.id === ev.pointerId) {
      var dx = ev.clientX - drag.x;
      if (Math.abs(dx) > 6 || Math.abs(ev.clientY - drag.y) > 6) drag.moved = true;
      if (drag.moved && Math.abs(dx) > Math.abs(ev.clientY - drag.y) * 0.6) { flyTo(drag.e - dx / Math.max(260, vw) * 9); try { view.setPointerCapture(ev.pointerId); } catch (e) {} }
      return;
    }
    if (ev.pointerType === "mouse") { var h = pick(ev.clientX, ev.clientY, 16); if (h !== hoverI) { hoverI = h; view.style.cursor = h >= 0 ? "pointer" : ""; kick(); } }
  });
  function endDrag(ev) {
    if (!drag || drag.id !== ev.pointerId) return;
    var wasMove = drag.moved; drag = null;
    if (!wasMove && ev.type === "pointerup") { var h = pick(ev.clientX, ev.clientY, ev.pointerType === "mouse" ? 18 : 28); if (h >= 0) select(h, false); }
  }
  view.addEventListener("pointerup", endDrag); view.addEventListener("pointercancel", endDrag);
  view.addEventListener("pointerleave", function () { if (hoverI >= 0) { hoverI = -1; view.style.cursor = ""; kick(); } });

  var scr = new Float32Array(N * 3);      // 每帧星点屏幕坐标 x, y, 可见度
  function project(v, out, k) { tmpV.copy(v).project(cam); out[k] = (tmpV.x + 1) / 2 * vw; out[k + 1] = (1 - tmpV.y) / 2 * vh; out[k + 2] = tmpV.z < 1 && tmpV.z > -1 ? 1 : 0; }
  function pick(cx, cy, rad) {
    var r = view.getBoundingClientRect(), x = cx - r.left, y = cy - r.top, best = -1, bd = rad * rad;
    for (var i = 0; i < N; i++) {
      if (!scr[i * 3 + 2]) continue;
      var dd = cam.position.distanceTo(world[i]); if (dd > 52) continue;
      var dx = scr[i * 3] - x, dy = scr[i * 3 + 1] - y, d2 = dx * dx + dy * dy;
      if (d2 < bd) { bd = d2; best = i; }
    }
    return best;
  }

  /* ---------------- 选中 → 玻璃信息卡 ---------------- */
  function setSelAttr() { for (var i = 0; i < N; i++) selA[i] = i === sel ? 1 : 0; sg.attributes.aSel.needsUpdate = true; }
  function select(i, quiet) {
    sel = i; setSelAttr(); flyTo(STARS[i].e);
    var s = STARS[i];
    cardBody.innerHTML = "";
    var chip = el("span", { class: "sm3-chip " + (s.lit ? "on" : s.task ? "task" : "off"), text: stateTxt(s) });
    cardBody.appendChild(el("div", { class: "sm3-ch" }, [el("i", { class: "sm3-dot", style: "background:" + COL[s.cons] + ";box-shadow:0 0 10px " + COL[s.cons] }),
      el("div", {}, [el("h3", { id: "sm3-ct", text: (s.lit ? "★ " : "") + s.name }), el("p", { class: "sm3-meta", text: CONS[s.cons] + " 星座 · 约 10" + sup(Math.round(s.e)) + " 米" })])]));
    cardBody.appendChild(chip);
    cardBody.appendChild(el("p", { class: "sm3-desc", text: s.desc }));
    if (s.link) {
      cardBody.appendChild(el("p", { class: "sm3-lk", text: (s.lit ? "✓ 已点亮。来自 " : "完成 ") + s.linkTxt + (s.lit ? "" : " 即可点亮。") }));
      cardBody.appendChild(el("a", { class: "nv-btn pri sm", href: s.href, text: s.lit ? "再去玩一次 →" : "去点亮 →", onclick: function () { cfg.snd && cfg.snd.play && cfg.snd.play("whoosh"); } }));
    } else cardBody.appendChild(el("p", { class: "sm3-lk dim", text: "待探索。这颗星会在后续任务中开放。" }));
    cardBody.appendChild(el("p", { class: "sm3-src", text: "简化表述,供科普探究" }));
    card.hidden = false; stage.classList.add("has-card");
    card.setAttribute("aria-labelledby", "sm3-ct");
    if (!quiet) live.textContent = s.name + "," + CONS[s.cons] + "星座," + stateTxt(s) + "。" + s.desc;
    labelBtns(); kick();
  }
  function closeCard(refocus) {
    var was = sel; card.hidden = true; stage.classList.remove("has-card"); sel = -1; setSelAttr(); labelBtns(); kick();
    if (refocus && was >= 0 && btns[was] && card.contains(D.activeElement) ) btns[was].focus();
  }

  /* ---------------- 标签层(DOM,清晰、无额外 draw call) ---------------- */
  var pool = [];
  function lab(i) { if (!pool[i]) { pool[i] = el("span", { class: "sm3-lb" }); labels.appendChild(pool[i]); } return pool[i]; }
  function drawLabels() {
    var used = 0, boxes = [], maxStar = vw < 600 ? 6 : vw < 1000 ? 10 : 16;
    if (!card.hidden) { var cr = card.getBoundingClientRect(), vr = view.getBoundingClientRect(); boxes.push([cr.left - vr.left - 4, cr.top - vr.top - 4, cr.right - vr.left + 4, cr.bottom - vr.top + 4]); }
    function put(x, y, txt, cls, w, force) {
      if (x - w / 2 < 4 || y < 18 || x + w / 2 > vw - 4 || y > vh - (vh < 360 ? 64 : 76)) return false;
      var bx = [x - w / 2, y - 9, x + w / 2, y + 9];
      var upto = force ? (card.hidden ? 0 : 1) : boxes.length;     // 强制标签(选中/焦点)只避开信息卡
      for (var b = 0; b < upto; b++) { var o = boxes[b]; if (bx[0] < o[2] && bx[2] > o[0] && bx[1] < o[3] && bx[3] > o[1]) return false; }
      boxes.push(bx);
      var e = lab(used++); if (e.textContent !== txt) e.textContent = txt; e.className = "sm3-lb " + cls;
      e.style.transform = "translate(" + Math.round(x) + "px," + Math.round(y) + "px) translate(-50%,-50%)"; e.style.display = "";
      return true;
    }
    function tw(s) { var w = 0; for (var i = 0; i < s.length; i++) w += s.charCodeAt(i) > 255 ? 12 : 6.6; return w + 12; }
    // 地标标签(放在物体下方)
    var lmTmp = new Float32Array(3);
    lmObjs.forEach(function (l) {
      if (!l.name) return;
      if (Math.abs(l.e - camE) > 7.5) return;
      tmpV.set(l.o.position.x, l.o.position.y - 0.9, 0); project(tmpV, lmTmp, 0);
      if (lmTmp[2]) put(lmTmp[0], lmTmp[1], l.name, "lm", tw(l.name), false);
    });
    // 星标签:选中 / 焦点 / 悬停优先,然后已点亮 → 可点亮 → 其余,按离镜头距离
    var cand = [];
    for (var i = 0; i < N; i++) {
      if (!scr[i * 3 + 2]) continue;
      var d = cam.position.distanceTo(world[i]); if (d > 30 && i !== sel && i !== focusI) continue;
      var s = STARS[i], pr = (i === sel || i === focusI) ? -100 : i === hoverI ? -90 : (s.lit ? 0 : s.task ? 6 : 12) + d * 0.5;
      cand.push([pr, i]);
    }
    cand.sort(function (a, b) { return a[0] - b[0]; });
    var shown = 0;
    for (var c = 0; c < cand.length && shown < maxStar + 3; c++) {
      var k = cand[c][1], st = STARS[k], force = cand[c][0] < -50;
      if (!force && shown >= maxStar) break;
      if (put(scr[k * 3], scr[k * 3 + 1] - (k === focusI ? 30 : 15), st.name, "st" + (st.lit ? " on" : st.task ? " task" : "") + ((k === sel || k === focusI || k === hoverI) ? " hi" : ""), tw(st.name), force)) shown++;
    }
    for (var u = used; u < pool.length; u++) pool[u].style.display = "none";
    // 焦点环
    var fi = focusI >= 0 ? focusI : -1;
    if (fi >= 0 && scr[fi * 3 + 2]) { ring.style.display = "block"; ring.style.transform = "translate(" + Math.round(scr[fi * 3]) + "px," + Math.round(scr[fi * 3 + 1]) + "px) translate(-50%,-50%)"; }
    else ring.style.display = "none";
  }

  /* ---------------- 渲染循环 ---------------- */
  var raf = 0, visible = true, last = performance.now(), t0 = last, lost = false, dead = false;
  var stat = { frames: 0, fps: 0, calls: 0, tris: 0, t: last, n: 0 };
  W.__nvMap3D = stat;
  function frame(now) {
    raf = 0; if (dead) return;
    try {
      if (lost) throw new Error("WebGL context lost");
      var w = Math.max(1, view.clientWidth), h = Math.max(1, view.clientHeight);
      if (w !== vw || h !== vh) { vw = w; vh = h; renderer.setSize(w, h, false); cam.aspect = w / h; portrait = w / h < 0.9; cam.fov = portrait ? 62 : w / h < 1.4 ? 52 : 44; cam.updateProjectionMatrix(); uni.uScale.value = h * 0.55; }
      var dt = Math.min(0.1, (now - last) / 1000); last = now;
      var diff = tgtE - camE;
      camE = Math.abs(diff) < 0.002 || RM ? tgtE : camE + diff * (1 - Math.exp(-dt * 4.2));
      placeCam(RM ? 1 : 1 - Math.exp(-dt * 5));
      var t = RM ? 0 : (now - t0) / 1000; uni.uTime.value = t;
      if (!RM) spin.forEach(function (s) { s[0].rotation[s[2]] = t * s[1]; });
      renderer.render(scene, cam);
      for (var i = 0; i < N; i++) project(world[i], scr, i * 3);
      drawLabels();
      stat.frames++; stat.n++; stat.calls = renderer.info.render.calls; stat.tris = renderer.info.render.triangles;
      if (now - stat.t > 1000) { stat.fps = Math.round(stat.n * 1000 / (now - stat.t)); stat.n = 0; stat.t = now; }
      if (stage.getAttribute("data-state") !== "ready") stage.setAttribute("data-state", "ready");
    } catch (err) { fail(err); return; }
    if (visible && !D.hidden && !RM) raf = W.requestAnimationFrame(frame);
  }
  function kick() { if (!raf && !dead && visible && !D.hidden) { last = performance.now(); raf = W.requestAnimationFrame(frame); } }
  var io = W.IntersectionObserver ? new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) kick(); }) : null;
  if (io) io.observe(view);
  function onVis() { if (!D.hidden) kick(); }
  D.addEventListener("visibilitychange", onVis);
  cv.addEventListener("webglcontextlost", function (e) { e.preventDefault(); lost = true; fail(new Error("WebGL context lost")); });
  function fail(err) { if (dead) return; dispose(); cfg.onFail && cfg.onFail(err); }
  function dispose() {
    if (dead) return; dead = true; if (raf) W.cancelAnimationFrame(raf); raf = 0;
    if (io) io.disconnect(); D.removeEventListener("visibilitychange", onVis);
    try { scene.traverse(function (o) { if (o.geometry) o.geometry.dispose(); if (o.material) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); } }); glowTex.dispose(); renderer.dispose(); } catch (e) {}
    stage.remove(); if (W.__nvMap3D === stat) W.__nvMap3D = null;
  }
  function update(states) {
    states.forEach(function (st, i) { STARS[i].lit = st.lit; STARS[i].task = st.task; stA[i] = st.lit ? 2 : st.task ? 1 : 0; });
    sg.attributes.aState.needsUpdate = true; labelBtns();
    if (sel >= 0 && !card.hidden) select(sel, true);
    kick();
  }

  // 首帧同步渲染:成功才算挂载成功(失败直接抛给调用方)
  update(STARS.map(function (s) { return { lit: s.lit, task: s.task }; }));
  syncUI();
  if (raf) { W.cancelAnimationFrame(raf); raf = 0; }
  dead = false;
  (function first() {
    var w = Math.max(1, view.clientWidth), h = Math.max(1, view.clientHeight);
    vw = w; vh = h; renderer.setSize(w, h, false); cam.aspect = w / h; portrait = w / h < 0.9; cam.fov = portrait ? 62 : w / h < 1.4 ? 52 : 44; cam.updateProjectionMatrix(); uni.uScale.value = h * 0.55;
    placeCam(); renderer.render(scene, cam);
    var gl = renderer.getContext(); if (gl.isContextLost && gl.isContextLost()) throw new Error("context lost at first frame");
  })();
  kick();
  return { update: update, dispose: dispose, flyTo: flyTo, select: select, stage: stage };
}
