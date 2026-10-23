/* 宙律 Nomoverse · 投篮任务 3D 舞台(v0.3-α4 · 方案 B「星球实景」)
   只负责「画」:各星球实景球场(高清实拍贴图)、篮架、篮球、投篮者、阴影与天空。
   物理仍由关卡 2D 逻辑(NV.Phys.shoot,固定步长)计算;轨迹、预测线、标签继续画在透明 2D 画布上。
   对齐原理:镜头正对投篮平面(z = 0)、不俯仰不偏航,透视下这一平面的投影是严格的等比缩放,
   因此关卡原有的线性坐标 S(x, y) 与 3D 画面逐像素对齐,画预测线(屏幕 → 世界)也无需改动。
   坐标:1 场景单位 = 1 m;x 沿球场指向篮筐,y 向上,+z 朝向镜头。
   贴图:Poly Haven(CC0)地面与天空、NASA(公有领域)地球与木星、NASA SVS 星图;见 LICENSES.md。 */
"use strict";
import { tierInfo, createRenderer, canvasTex } from "./nvscene.js";

var FOV = 34, HX = 4.6, RIM = 3.05, BALL = 0.12, X0 = 0, Y0 = 2.1;
var ASSET = new URL("../assets/hoop/", import.meta.url).href;

/* 各环境:天空、地面、雾、光照、点缀 */
var ENVS = {
  earth:   { sky: "sky_day",   ground: "asphalt", tile: 3.2, fog: [0x959aa9, 40, 260], sun: [0xfff1dc, 3.0, [-6, 9, 7]], hemi: [0xbcd3ff, 0x4a4036, 1.1], exp: 1.0, lines: 0.92, suit: false, rot: 1.2 },
  heavy:   { sky: "sky_dusk",  ground: "asphalt", tile: 3.2, fog: [0x80728a, 34, 220], sun: [0xffb37a, 2.6, [-9, 4, 5]], hemi: [0xb8a8d8, 0x3a2c2a, 0.95], exp: 1.0, lines: 0.85, suit: false, rot: 2.6 },
  moon:    { sky: "sky_space", ground: "moon",    tile: 4.0, fog: [0x050507, 120, 520], sun: [0xffffff, 3.6, [-8, 6, 6]], hemi: [0x30323a, 0x0c0c0e, 0.35], exp: 1.05, lines: 0.55, suit: true, planet: { tex: "planet_earth", r: 7, pos: [-8, 34, -170], spin: 0.02 }, bgI: 0.55, rot: 0.4 },
  mars:    { sky: null,        ground: "mars",    tile: 3.6, fog: [0xc9946a, 30, 240], sun: [0xffe2c4, 2.4, [-7, 7, 6]], hemi: [0xe0a77c, 0x5a3220, 0.9], exp: 1.0, lines: 0.6, suit: true, marsSky: true, rot: 0 },
  jupiter: { sky: "sky_space", ground: "deck",    tile: 2.4, fog: null, sun: [0xfff3e0, 3.2, [-7, 8, 7]], hemi: [0x6c5a48, 0x2a1d14, 0.55], exp: 1.0, lines: 0.8, suit: true, platform: 13, jupiter: true, bgI: 0.45, rot: 2.2 },
  void:    { sky: "sky_space", ground: "pad",     tile: 2.0, fog: null, sun: [0xe8ecff, 2.8, [-6, 9, 8]], hemi: [0x5a62a0, 0x14102a, 0.7], exp: 1.0, lines: 0.75, suit: true, platform: 11, ring: true, bgI: 0.75, rot: 3.6 }
};

export function mount(THREE, canvas, opts) {
  opts = opts || {};
  var T = tierInfo(), hi = T.tier === "high";
  var renderer = createRenderer(THREE, { canvas: canvas, alpha: false, clear: 0x07061a, onLost: opts.onLost });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = hi ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap;
  var ANISO = Math.min(hi ? 16 : 8, renderer.capabilities.getMaxAnisotropy ? renderer.capabilities.getMaxAnisotropy() : 4);
  // 贴图分辨率:高档 地面 2K + 法线 2K + 天空 4K;中档(含手机)地面仍 2K,法线 1K,天空 2K —— 都是实拍高清,不用低质图
  var RES = { d: "d2k", n: hi ? "n2k" : "n1k", sky: hi ? "4k" : "2k", planet: "2k" };

  var scene = new THREE.Scene();
  var cam = new THREE.PerspectiveCamera(FOV, 1, 0.1, 20000);
  var loader = new THREE.TextureLoader();
  var texCache = {}, disposed = false;
  function tex(name, srgb, repeat) {
    var key = name + (repeat ? "@r" : "");
    if (texCache[key]) return texCache[key];
    var t = loader.load(ASSET + name + ".jpg", function () { if (!disposed) state.dirty = true; }, undefined, function () { if (W.console) console.warn("[nv] 贴图加载失败:", name); });
    t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    t.anisotropy = ANISO;
    if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
    texCache[key] = t; return t;
  }
  var W = window;

  /* ---------- 灯光与阴影 ---------- */
  var hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1); scene.add(hemi);
  var sun = new THREE.DirectionalLight(0xffffff, 3); sun.castShadow = true;
  sun.shadow.mapSize.set(hi ? 2048 : 1024, hi ? 2048 : 1024);
  var sc = sun.shadow.camera; sc.left = -9; sc.right = 9; sc.top = 9; sc.bottom = -9; sc.near = 1; sc.far = 60;
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02;
  sun.target.position.set(HX * 0.5, 0, 0); scene.add(sun); scene.add(sun.target);

  /* ---------- 地面(高清 PBR 贴图 + 去重复的宏观明暗) ---------- */
  var groundMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95, metalness: 0, normalScale: new THREE.Vector2(1, 1) });
  groundMat.onBeforeCompile = function (sh) {
    sh.fragmentShader = sh.fragmentShader.replace("#include <map_fragment>",
      "#include <map_fragment>\n#ifdef USE_MAP\n  vec3 macroA = texture2D( map, vMapUv * 0.073 + vec2(0.37, 0.11) ).rgb;\n  vec3 macroB = texture2D( map, vMapUv * 0.021 + vec2(0.71, 0.53) ).rgb;\n  float mm = dot(macroA, vec3(0.333)) * 0.6 + dot(macroB, vec3(0.333)) * 0.4;\n  diffuseColor.rgb *= clamp(0.72 + mm * 0.75, 0.6, 1.25);\n#endif");
  };
  var groundBig = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), groundMat);
  groundBig.rotation.x = -Math.PI / 2; groundBig.receiveShadow = true; scene.add(groundBig);
  var groundDisc = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.6, hi ? 96 : 64, 1, false), [
    new THREE.MeshStandardMaterial({ color: 0x2a2c34, roughness: 0.6, metalness: 0.7 }), groundMat, groundMat]);
  groundDisc.receiveShadow = true; scene.add(groundDisc);
  // 悬浮平台边缘灯带(木星 / 荒谬宇宙)
  var rimLight = new THREE.Mesh(new THREE.TorusGeometry(1, 0.012, 8, 160), new THREE.MeshBasicMaterial({ color: 0x8be9fd, toneMapped: false }));
  rimLight.rotation.x = Math.PI / 2; scene.add(rimLight);
  var ring = new THREE.Mesh(new THREE.RingGeometry(1, 1.006, 200), new THREE.MeshBasicMaterial({ color: 0xa78bfa, transparent: true, opacity: 0.5, side: THREE.DoubleSide, toneMapped: false }));
  ring.rotation.x = -Math.PI / 2; scene.add(ring);

  /* ---------- 球场线(FIBA 尺寸;篮筐中心在 x = 4.6) ---------- */
  var lines = (function () {
    var N = 2048, M = 16 / N;   // 贴图覆盖 16 m × 16 m,以篮筐为中心
    var t = canvasTex(THREE, N, N, function (c) {
      c.clearRect(0, 0, N, N);
      function P(x, z) { return [(x - HX + 8) / M, (z + 8) / M]; }
      c.strokeStyle = "rgba(255,255,255,1)"; c.lineWidth = 0.05 / M; c.lineCap = "butt";
      var base = HX + 1.575, ft = base - 5.8;
      c.beginPath(); var a = P(base, -7.5), b = P(base, 7.5); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke();      // 底线
      c.beginPath(); a = P(base, -2.45); c.moveTo(a[0], a[1]); b = P(ft, -2.45); c.lineTo(b[0], b[1]); b = P(ft, 2.45); c.lineTo(b[0], b[1]); b = P(base, 2.45); c.lineTo(b[0], b[1]); c.stroke();   // 限制区
      var o = P(ft, 0); c.beginPath(); c.arc(o[0], o[1], 1.8 / M, -Math.PI / 2, Math.PI / 2, true); c.stroke();   // 罚球圈(外半)
      c.save(); c.setLineDash([0.3 / M, 0.3 / M]); c.beginPath(); c.arc(o[0], o[1], 1.8 / M, -Math.PI / 2, Math.PI / 2, false); c.stroke(); c.restore();
      var h = P(HX, 0); c.beginPath(); c.arc(h[0], h[1], 1.25 / M, -Math.PI / 2, Math.PI / 2, true); c.stroke();      // 无撞人区
      // 三分线:直线段 + 半径 6.75 m 弧
      var r3 = 6.75, zc = 6.6, xs = HX - Math.sqrt(r3 * r3 - zc * zc);
      c.beginPath(); a = P(base, -zc); c.moveTo(a[0], a[1]); b = P(xs, -zc); c.lineTo(b[0], b[1]);
      var ang = Math.asin(zc / r3); c.arc(h[0], h[1], r3 / M, -Math.PI + ang, Math.PI - ang, true);
      b = P(base, zc); c.lineTo(b[0], b[1]); c.stroke();
    });
    t.anisotropy = ANISO;
    var m = new THREE.Mesh(new THREE.PlaneGeometry(16, 16), new THREE.MeshStandardMaterial({ map: t, transparent: true, roughness: 0.8, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
    m.rotation.x = -Math.PI / 2; m.position.set(HX, 0.004, 0); m.receiveShadow = true; m.renderOrder = 1;
    scene.add(m); return m;
  })();

  /* ---------- 篮架:立柱、悬臂、钢化玻璃篮板、篮筐、篮网 ---------- */
  var hoopG = new THREE.Group(); scene.add(hoopG);
  var steel = new THREE.MeshStandardMaterial({ color: 0x23262e, roughness: 0.42, metalness: 0.8 });
  var pad = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.7 });
  var bbx = HX + 0.375, polex = HX + 1.3;
  var pole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.1, 3.55, 24), steel); pole.position.set(polex, 1.775, 0); pole.castShadow = true; hoopG.add(pole);
  var poleBase = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.12, 1.1), steel); poleBase.position.set(polex + 0.1, 0.06, 0); poleBase.castShadow = true; poleBase.receiveShadow = true; hoopG.add(poleBase);
  var padM = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 1.8, 24, 1, true), pad); padM.position.set(polex, 0.9, 0); hoopG.add(padM);
  var arm = new THREE.Mesh(new THREE.BoxGeometry(polex - bbx, 0.1, 0.1), steel); arm.position.set((polex + bbx) / 2 + 0.03, 3.45, 0); arm.castShadow = true; hoopG.add(arm);
  var arm2 = new THREE.Mesh(new THREE.BoxGeometry(polex - bbx, 0.08, 0.08), steel); arm2.position.set((polex + bbx) / 2 + 0.03, 3.05, 0); arm2.castShadow = true; hoopG.add(arm2);
  var glass = new THREE.Mesh(new THREE.BoxGeometry(0.03, 1.05, 1.8), new THREE.MeshPhysicalMaterial({ color: 0xdbeafe, roughness: 0.06, metalness: 0, transmission: hi ? 0.85 : 0, transparent: true, opacity: hi ? 1 : 0.32, thickness: 0.03, ior: 1.5 }));
  glass.position.set(bbx, 3.425, 0); hoopG.add(glass);
  var frameMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4, metalness: 0.2 });
  function bar(w, h, d, x, y, z, mat) { var b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat || frameMat); b.position.set(x, y, z); b.castShadow = true; hoopG.add(b); return b; }
  bar(0.045, 0.05, 1.84, bbx, 3.95, 0); bar(0.045, 0.05, 1.84, bbx, 2.9, 0); bar(0.045, 1.1, 0.05, bbx, 3.425, 0.9); bar(0.045, 1.1, 0.05, bbx, 3.425, -0.9);
  bar(0.04, 0.05, 0.59, bbx - 0.02, 3.4, 0); bar(0.04, 0.05, 0.59, bbx - 0.02, 3.0, 0); bar(0.04, 0.45, 0.05, bbx - 0.02, 3.2, 0.295); bar(0.04, 0.45, 0.05, bbx - 0.02, 3.2, -0.295);
  var rimMat = new THREE.MeshStandardMaterial({ color: 0xea580c, roughness: 0.35, metalness: 0.6 });
  var rim = new THREE.Mesh(new THREE.TorusGeometry(0.225, 0.01, 12, 64), rimMat); rim.rotation.x = Math.PI / 2; rim.position.set(HX, RIM, 0); rim.castShadow = true; hoopG.add(rim);
  bar(bbx - (HX + 0.225), 0.03, 0.12, (bbx + HX + 0.225) / 2, RIM - 0.01, 0, rimMat);
  // 篮网:12 根经线 × 交错菱形,底部收口
  var net = (function () {
    var segs = 12, rows = 6, top = 0.225, bot = 0.13, H = 0.42, p = [];
    function pt(i, r) { var a = (i / segs) * Math.PI * 2, k = r / rows, rad = top + (bot - top) * Math.pow(k, 0.8); return [Math.cos(a) * rad, -k * H, Math.sin(a) * rad]; }
    for (var r = 0; r < rows; r++) for (var i = 0; i < segs; i++) {
      var a = pt(i, r), b = pt(i + 0.5, r + 1), c = pt(i - 0.5, r + 1);
      if (r % 2 === 1) { b = pt(i + 0.5, r + 1); c = pt(i - 0.5, r + 1); }
      p.push.apply(p, a); p.push.apply(p, b); p.push.apply(p, a); p.push.apply(p, c);
    }
    var g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(p, 3));
    var m = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: 0xf1f5f9, transparent: true, opacity: 0.92 }));
    m.position.set(HX, RIM - 0.005, 0); hoopG.add(m); return m;
  })();

  /* ---------- 篮球(程序绘制的高清皮革纹 + 法线颗粒) ---------- */
  var ballTex = canvasTex(THREE, 1024, 512, function (c, w, h) {
    var g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#c2410c"); g.addColorStop(0.5, "#ea6a1c"); g.addColorStop(1, "#c2410c");
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    var s = 11; function rnd() { s = (s * 16807) % 2147483647; return s / 2147483647; }
    for (var i = 0; i < 26000; i++) { c.fillStyle = rnd() < 0.5 ? "rgba(120,40,8,.22)" : "rgba(255,170,110,.16)"; var r = 0.8 + rnd() * 1.4; c.beginPath(); c.arc(rnd() * w, rnd() * h, r, 0, 7); c.fill(); }
    c.strokeStyle = "#1b0d06"; c.lineWidth = 7;
    c.beginPath(); c.moveTo(0, h / 2); c.lineTo(w, h / 2); c.stroke();
    c.beginPath(); c.moveTo(w / 4, 0); c.lineTo(w / 4, h); c.moveTo(w * 3 / 4, 0); c.lineTo(w * 3 / 4, h); c.stroke();
    c.beginPath(); for (var x = 0; x <= w; x += 4) { var y = h / 2 + Math.sin(x / w * Math.PI * 4) * h * 0.33; if (x === 0) c.moveTo(x, y); else c.lineTo(x, y); } c.stroke();
  });
  ballTex.anisotropy = ANISO;
  var ball = new THREE.Mesh(new THREE.SphereGeometry(BALL, 48, 32), new THREE.MeshStandardMaterial({ map: ballTex, roughness: 0.62, metalness: 0 }));
  ball.castShadow = true; ball.visible = false; scene.add(ball);

  /* ---------- 投篮者:人体模型(地球 = 球衣;其他星球 = 宇航服 + 金色面罩) ---------- */
  var man = (function () {
    var g = new THREE.Group(), skin = new THREE.MeshStandardMaterial({ color: 0x8d5a3b, roughness: 0.6 });
    var shirt = new THREE.MeshStandardMaterial({ color: 0x6d28d9, roughness: 0.75 });
    var shorts = new THREE.MeshStandardMaterial({ color: 0x1e1b4b, roughness: 0.8 });
    var suit = new THREE.MeshStandardMaterial({ color: 0xeef0f4, roughness: 0.7 });
    var visor = new THREE.MeshStandardMaterial({ color: 0xd4a017, roughness: 0.08, metalness: 1 });
    var shoe = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 });
    function cap(r, l, mat) { var m = new THREE.Mesh(new THREE.CapsuleGeometry(r, l, 6, 16), mat); m.castShadow = true; return m; }
    var torso = cap(0.17, 0.42, shirt); torso.position.set(0, 1.32, 0); g.add(torso);
    var hips = cap(0.16, 0.12, shorts); hips.position.set(0, 0.98, 0); g.add(hips);
    var head = new THREE.Mesh(new THREE.SphereGeometry(0.115, 32, 24), skin); head.position.set(0, 1.84, 0);
    var neck = cap(0.05, 0.06, skin); neck.position.set(0, 1.72, 0); g.add(neck); head.castShadow = true; g.add(head);
    var helmet = new THREE.Mesh(new THREE.SphereGeometry(0.17, 32, 24), new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.05, transmission: 0.6, transparent: true, opacity: 0.55 }));
    helmet.position.copy(head.position); g.add(helmet);
    var vis = new THREE.Mesh(new THREE.SphereGeometry(0.172, 32, 16, -0.9, 1.8, 0.9, 1.0), visor); vis.rotation.y = Math.PI / 2; vis.position.copy(head.position); g.add(vis);
    var pack = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.48, 0.36), suit); pack.position.set(-0.22, 1.36, 0); pack.castShadow = true; g.add(pack);
    function leg(z) { var th = cap(0.075, 0.36, shorts), sh = cap(0.065, 0.38, skin), f = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.08, 0.11), shoe);
      th.position.set(0.02, 0.72, z); sh.position.set(0.03, 0.3, z); f.position.set(0.08, 0.04, z); f.castShadow = true; g.add(th); g.add(sh); g.add(f); return [th, sh]; }
    var l1 = leg(0.1), l2 = leg(-0.1);
    // 投篮臂:肩 → 出手点 (X0, Y0);另一只手扶球
    var arm1 = cap(0.055, 0.5, skin), arm2 = cap(0.055, 0.44, skin);
    g.add(arm1); g.add(arm2);
    g.position.set(X0 - 0.15, 0, 0.08);
    function setSuit(on) {
      torso.material = on ? suit : shirt; hips.material = on ? suit : shorts;
      [l1[0], l2[0], l1[1], l2[1], arm1, arm2].forEach(function (m) { m.material = on ? suit : (m === l1[0] || m === l2[0] ? shorts : skin); });
      head.visible = !on; helmet.visible = on; vis.visible = on; pack.visible = on;
    }
    // 手臂朝向出手点(世界坐标转到人物局部)
    var sh1 = new THREE.Vector3(0.02, 1.58, -0.21), sh2 = new THREE.Vector3(0.02, 1.58, 0.21), tmp = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
    function aim(m, from, to, len) { tmp.subVectors(to, from); var L = Math.min(len, tmp.length()); tmp.normalize(); m.position.copy(from).addScaledVector(tmp, L / 2); m.quaternion.setFromUnitVectors(up, tmp); }
    var rel = new THREE.Vector3();
    function pose(release) {
      rel.set(X0 - g.position.x, Y0, -0.04 - g.position.z);
      aim(arm1, sh1, rel, 0.62);
      tmp.set(rel.x - 0.12, rel.y - 0.1, 0.12);
      aim(arm2, sh2, tmp, 0.58);
    }
    pose(); g.traverse(function (o) { if (o.isMesh) o.castShadow = true; });
    return { g: g, setSuit: setSuit };
  })();
  scene.add(man.g);

  /* ---------- 天空与远景 ---------- */
  var marsSky = (function () {
    var m = new THREE.Mesh(new THREE.SphereGeometry(3000, 48, 24), new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: { uSun: { value: new THREE.Vector3(-0.6, 0.45, 0.6).normalize() } },
      vertexShader: "varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
      fragmentShader: [
        "uniform vec3 uSun; varying vec3 vD;",
        "void main(){",
        "  float h = clamp(vD.y, -0.2, 1.0);",
        "  vec3 zen = vec3(0.47, 0.33, 0.25), hor = vec3(0.86, 0.62, 0.44), low = vec3(0.55, 0.36, 0.24);",
        "  vec3 c = mix(hor, zen, smoothstep(0.0, 0.6, h)); c = mix(low, c, smoothstep(-0.2, 0.02, h));",
        "  float s = max(dot(vD, uSun), 0.0);",
        "  c += vec3(0.45, 0.6, 0.85) * pow(s, 60.0) * 0.6 + vec3(1.0, 0.98, 0.95) * pow(s, 2200.0) * 3.0;",   // 火星黄昏的蓝色日晕 + 小太阳
        "  gl_FragColor = vec4(c, 1.0);",
        "  #include <tonemapping_fragment>\n  #include <colorspace_fragment>",
        "}"].join("\n")
    }));
    m.renderOrder = -10; m.visible = false; scene.add(m); return m;
  })();
  var planet = new THREE.Mesh(new THREE.SphereGeometry(1, hi ? 96 : 64, hi ? 64 : 40), new THREE.MeshStandardMaterial({ roughness: 0.9, metalness: 0 }));
  planet.visible = false; scene.add(planet);
  var atmo = new THREE.Mesh(new THREE.SphereGeometry(1.02, 64, 40), new THREE.MeshBasicMaterial({ color: 0x7ab4ff, transparent: true, opacity: 0.18, side: THREE.BackSide, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
  atmo.visible = false; scene.add(atmo);
  // 木星:平台悬浮在木星近旁,巨大的木星从地平线后升起(视半径约 20°)
  var jup = new THREE.Mesh(new THREE.SphereGeometry(900, hi ? 160 : 96, hi ? 96 : 64), new THREE.MeshStandardMaterial({ roughness: 1, metalness: 0, fog: false }));
  jup.position.set(-260, 120, -2600); jup.rotation.set(0.1, -0.6, 0.12); jup.visible = false; scene.add(jup);

  /* ---------- 环境切换 ---------- */
  var state = { W: 1, H: 1, zone: { x: 0, y: 0, w: 1, h: 1 }, env: null, t0: performance.now(), ok: true, dirty: true, spin: 0, lastX: null, swishT: -9 };
  function setEnv(key) {
    var E = ENVS[key] || ENVS.earth; if (state.env === key) return; state.env = key;
    // 天空
    if (E.sky) {
      var st = tex(E.sky + "_" + RES.sky, true); st.mapping = THREE.EquirectangularReflectionMapping;
      scene.background = st; scene.backgroundIntensity = E.bgI || 1; scene.backgroundRotation.set(0, E.rot || 0, 0);
    } else scene.background = null;
    marsSky.visible = !!E.marsSky;
    // 雾
    scene.fog = E.fog ? new THREE.Fog(E.fog[0], E.fog[1], E.fog[2]) : null;
    // 地面:大平面(有地平线的星球)或悬浮平台
    groundMat.map = tex(E.ground + "_" + RES.d, true, true); groundMat.normalMap = tex(E.ground + "_" + RES.n, false, true);
    groundMat.map.repeat.set(1, 1); groundMat.normalMap.repeat.set(1, 1);
    var plat = E.platform || 0;
    groundBig.visible = !plat; groundDisc.visible = !!plat; rimLight.visible = !!plat; ring.visible = !!E.ring;
    var rep = plat ? (plat * 2) / E.tile : 900 / E.tile;
    groundMat.map.repeat.set(rep, rep); groundMat.normalMap.repeat.set(rep, rep);
    if (plat) { groundDisc.scale.set(plat, 1, plat); groundDisc.position.set(HX * 0.5, -0.3, -2); rimLight.scale.setScalar(plat); rimLight.position.set(HX * 0.5, 0.002, -2); ring.scale.setScalar(plat * 1.35); ring.position.set(HX * 0.5, -0.6, -2); }
    groundMat.needsUpdate = true;
    // 光
    hemi.color.set(E.hemi[0]); hemi.groundColor.set(E.hemi[1]); hemi.intensity = E.hemi[2];
    sun.color.set(E.sun[0]); sun.intensity = E.sun[1]; sun.position.set(HX * 0.5 + E.sun[2][0], E.sun[2][1], E.sun[2][2]);
    renderer.toneMappingExposure = E.exp || 1;
    lines.material.opacity = E.lines;
    man.setSuit(!!E.suit);
    // 远景星球
    if (E.planet) {
      planet.material.map = tex(E.planet.tex + "_" + RES.planet, true); planet.material.needsUpdate = true;
      planet.scale.setScalar(E.planet.r); planet.position.set(E.planet.pos[0], E.planet.pos[1], E.planet.pos[2]); planet.visible = true;
      atmo.scale.setScalar(E.planet.r); atmo.position.copy(planet.position); atmo.visible = true;
      planet.material.fog = false;
    } else { planet.visible = false; atmo.visible = false; }
    jup.visible = !!E.jupiter;
    if (E.jupiter && !jup.material.map) { jup.material.map = tex("planet_jupiter_" + RES.planet, true); jup.material.needsUpdate = true; }
    state.dirty = true;
  }

  var v3 = new THREE.Vector3();
  function size() {
    var r = canvas.getBoundingClientRect(), w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
    if (w !== state.W || h !== state.H || canvas.width === 300) { state.W = w; state.H = h; renderer.setSize(w, h, false); }
  }

  /* 关卡调用:V = { s(px/m), ox, gy }(安全区像素)。镜头正对 z = 0 平面,使该平面的像素比例恰为 s */
  function view(V) {
    size();
    var Z = state.zone, Wd = state.W, Hd = state.H;
    var cxW = (Z.w / 2 - V.ox) / V.s, cyW = (V.gy - Z.h / 2) / V.s;     // 安全区中心对应的世界坐标
    var d = (Hd / 2) / (V.s * Math.tan(FOV * Math.PI / 360));
    cam.position.set(cxW, cyW, d); cam.up.set(0, 1, 0); cam.lookAt(cxW, cyW, 0);
    cam.aspect = Wd / Hd; cam.near = Math.max(0.05, d * 0.05); cam.far = 20000;
    var px = Z.x + Z.w / 2, py = Z.y + Z.h / 2;
    cam.setViewOffset(Wd, Hd, Wd / 2 - px, Hd / 2 - py, Wd, Hd);
    cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    // 镜头离得很远(竖屏小比例)时,把阴影相机跟上
    V.d3 = true;
    return V;
  }

  function envOf(L) {
    var e = L && L.lv && L.lv.env;
    if (typeof e === "function") { try { e = e(L); } catch (err) { e = "earth"; } }
    return e || "earth";
  }

  function render(L) {
    if (!state.ok) return;
    size();
    setEnv(envOf(L));
    var t = (performance.now() - state.t0) / 1000, st = (L && L.st) || {}, RM = L && L.RM;
    // 篮球:关卡把当前位置写在 st.ball3 = [x, y] 中;没有出手时球在投篮者手里
    var b = st.ball3;
    if (b) {
      ball.position.set(b[0], b[1], 0);
      if (state.lastX != null && !RM) state.spin -= (b[0] - state.lastX) / BALL * 0.7;      // 后旋
      state.lastX = b[0];
      ball.rotation.z = state.spin;
    } else { ball.position.set(X0 + 0.02, Y0 + 0.02, -0.04); state.lastX = null; }
    ball.visible = !(b && b[1] < -1);
    // 进球:篮网抖一下
    if (st.swished && state.swishT < 0) state.swishT = t;
    if (!st.swished) state.swishT = -9;
    var k = state.swishT > 0 ? Math.max(0, 1 - (t - state.swishT) / 0.7) : 0;
    net.scale.set(1 - k * 0.12 * Math.sin((t - state.swishT) * 30), 1 + k * 0.25, 1 - k * 0.12 * Math.sin((t - state.swishT) * 30));
    if (planet.visible && !RM) planet.rotation.y = t * 0.02;
    if (jup.visible && !RM) jup.rotation.y = t * 0.004;
    if (ring.visible && !RM) ring.rotation.z = t * 0.05;
    renderer.render(scene, cam);
  }

  function setZone(Z) { state.zone = Z; }
  function show(on) { canvas.style.visibility = on ? "visible" : "hidden"; }
  function dispose() {
    state.ok = false; disposed = true;
    scene.traverse(function (o) { if (o.geometry) o.geometry.dispose(); var ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : []; ms.forEach(function (m) { m.dispose(); }); });
    Object.keys(texCache).forEach(function (k) { texCache[k].dispose(); }); ballTex.dispose(); lines.material.map.dispose();
    renderer.dispose();
  }
  return { sinE: 0, view: view, render: render, setZone: setZone, show: show, dispose: dispose, three: THREE, envs: Object.keys(ENVS) };
}
