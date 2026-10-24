/* 宙律 Nomoverse · 恒星任务 3D 舞台(v0.5-α1 · 方案 A「写实太阳剖面」)
   只负责「画」:高清日面(Solar System Scope 贴图,CC BY 4.0)、切开一角的剖面(核心 / 辐射区光子乱走 / 对流区翻滚)、
   日冕光晕、日珥、核心聚变闪光、星空背景(NASA SVS Deep Star Maps)。
   物理仍由关卡逻辑(NV.Phys 恒星部分)计算;关卡每帧把画面参数写进 st.sun3 = { T, dim, core, flash, cut }。
   对齐:镜头正对太阳中心,z = 0 平面上 1 单位 = V.R0 像素;太阳缩放 = V.R / V.R0。剖面标签锚点由 anchors() 投影给 2D 层。 */
"use strict";
import { tierInfo, createRenderer, canvasTex, glowTex } from "./nvscene.js";

var FOV = 30;
var ASSET = new URL("../assets/", import.meta.url).href;

function bb(T) {   // 黑体颜色近似(0–1)
  var t = Math.max(1000, Math.min(40000, T)) / 100, r, g, b;
  r = t <= 66 ? 255 : 329.698727446 * Math.pow(t - 60, -0.1332047592);
  g = t <= 66 ? 99.4708025861 * Math.log(t) - 161.1195681661 : 288.1221695283 * Math.pow(t - 60, -0.0755148492);
  b = t >= 66 ? 255 : (t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.0447927307);
  return [r, g, b].map(function (v) { return Math.max(0, Math.min(255, v)) / 255; });
}

var NOISE = [
  "float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }",
  "vec2 h22(vec2 p){ float n = h21(p); return vec2(n, h21(p + n)); }",
  "float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);",
  "  return mix(mix(h21(i), h21(i + vec2(1,0)), f.x), mix(h21(i + vec2(0,1)), h21(i + vec2(1,1)), f.x), f.y); }",
  "float fbm(vec2 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { s += a * vn(p); p *= 2.03; a *= 0.5; } return s; }",
  "float cells(vec2 p, float t){ vec2 i = floor(p), f = fract(p); float d = 9.0, d2 = 9.0;",
  "  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) { vec2 g = vec2(float(x), float(y)); vec2 o = h22(i + g);",
  "    o = 0.5 + 0.45 * sin(t + 6.2831 * o); float dd = length(g + o - f); if (dd < d) { d2 = d; d = dd; } else if (dd < d2) d2 = dd; }",
  "  return d2 - d; }"
].join("\n");

export function mount(THREE, canvas, opts) {
  opts = opts || {};
  var T = tierInfo(), hi = T.tier === "high", lite = T.tier === "low" || T.mobile;
  var W = window;
  var renderer = createRenderer(THREE, { canvas: canvas, alpha: false, clear: 0x05040f, onLost: opts.onLost });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  var ANISO = Math.min(hi ? 16 : 8, renderer.capabilities.getMaxAnisotropy ? renderer.capabilities.getMaxAnisotropy() : 4);
  // 高清贴图:高档 日面 4K + 星空 4K;中档 / 手机 日面 2K + 星空 2K(实拍高清,不用低质图)
  var RES = hi ? "4k" : "2k";
  var scene = new THREE.Scene();
  var cam = new THREE.PerspectiveCamera(FOV, 1, 0.1, 20000);
  var loader = new THREE.TextureLoader(), disposed = false, texs = [];
  var state = { ok: true, W: 0, H: 0, zone: { x: 0, y: 0, w: 1, h: 1 }, t0: performance.now(), cur: { T: 5772, dim: 1, core: 1, flash: 0 } };
  function tex(path, srgb, fatal) {
    var t = loader.load(ASSET + path, undefined, undefined, function () {
      if (W.console) console.warn("[nv] 贴图加载失败:", path);
      if (fatal && !disposed && opts.onLost) opts.onLost(new Error("贴图加载失败:" + path));
    });
    t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.anisotropy = ANISO; texs.push(t); return t;
  }

  /* ---------- 星空背景(NASA SVS Deep Star Maps,与投篮任务共用) ---------- */
  var sky = new THREE.Mesh(new THREE.SphereGeometry(6000, 64, 32), new THREE.MeshBasicMaterial({ map: tex("hoop/sky_space_" + RES + ".jpg", true), side: THREE.BackSide, depthWrite: false, fog: false }));
  sky.material.color.setScalar(0.55); sky.rotation.set(0.3, 2.1, 0.1); sky.renderOrder = -10; scene.add(sky);

  /* ---------- 太阳本体:切口固定朝右上前方 ---------- */
  var sun = new THREE.Group(); scene.add(sun);
  var body = new THREE.Group(); sun.add(body);
  body.quaternion.setFromUnitVectors(new THREE.Vector3(1, 1, 1).normalize(), new THREE.Vector3(0.36, 0.33, 0.87).normalize());
  var sunMap = tex("stars/sun_" + RES + ".jpg", true, true);
  sunMap.wrapS = THREE.RepeatWrapping;
  var U = {
    map: { value: sunMap }, uTime: { value: 0 }, uTint: { value: new THREE.Vector3(1, 1, 1) }, uTintW: { value: 0 },
    uDim: { value: 1 }, uCut: { value: 1 }, uCore: { value: 1 }
  };
  var surf = new THREE.Mesh(new THREE.SphereGeometry(1, hi ? 160 : 112, hi ? 96 : 64), new THREE.ShaderMaterial({
    uniforms: U,
    vertexShader: [
      "varying vec2 vUv; varying vec3 vL; varying vec3 vN; varying vec3 vV;",
      "void main(){ vUv = uv; vL = position; vec4 wp = modelMatrix * vec4(position, 1.0);",
      "  vN = normalize(mat3(modelMatrix) * normal); vV = normalize(cameraPosition - wp.xyz); gl_Position = projectionMatrix * viewMatrix * wp; }"
    ].join("\n"),
    fragmentShader: [
      "uniform sampler2D map; uniform float uTime, uTintW, uDim, uCut; uniform vec3 uTint;",
      "varying vec2 vUv; varying vec3 vL; varying vec3 vN; varying vec3 vV;",
      NOISE,
      "void main(){",
      "  if (uCut > 0.5 && vL.x > 0.0 && vL.y > 0.0 && vL.z > 0.0) discard;",
      "  vec2 uv = vUv + vec2(uTime * 0.004, 0.0);",
      "  vec3 c = texture2D(map, uv).rgb;",
      "  float g = fbm(vUv * vec2(260.0, 130.0) + uTime * 0.15);",             // 细米粒组织(在实拍贴图上叠一层慢慢翻滚的细节)
      "  c *= 0.86 + 0.28 * g;",
      "  float mu = clamp(dot(normalize(vN), normalize(vV)), 0.0, 1.0);",
      "  c *= 0.42 + 0.58 * pow(mu, 0.55);",                                 // 临边昏暗
      "  float lum = dot(c, vec3(0.3, 0.59, 0.11));",
      "  c = mix(c, lum * uTint * 1.75, uTintW);",                            // 非太阳温度时换成对应黑体色
      "  c *= 1.32 * uDim;",
      "  gl_FragColor = vec4(c, 1.0);",
      "  #include <tonemapping_fragment>\n  #include <colorspace_fragment>",
      "}"].join("\n")
  }));
  body.add(surf);

  /* ---------- 剖面:三个四分之一圆面(z=0、x=0、y=0) ---------- */
  var FU = { uTime: U.uTime, uCore: U.uCore, uDim: U.uDim, uTint: U.uTint, uTintW: U.uTintW };
  function faceMat(shade, seed) {
    return new THREE.ShaderMaterial({
      uniforms: Object.assign({ uShade: { value: shade }, uSeed: { value: seed } }, FU), side: THREE.DoubleSide,
      vertexShader: "varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: [
        "uniform float uTime, uCore, uDim, uShade, uSeed, uTintW; uniform vec3 uTint; varying vec2 vP;",
        NOISE,
        "void main(){",
        "  float r = length(vP), a = atan(vP.y, vP.x);",
        "  vec3 c;",
        "  float core = smoothstep(0.27, 0.0, r);",
        "  vec3 cCore = mix(vec3(1.0, 0.62, 0.16), vec3(1.2, 1.1, 0.85), smoothstep(0.22, 0.04, r)) * (0.7 + 0.45 * uCore);",
        "  float rad = smoothstep(0.24, 0.3, r) * (1.0 - smoothstep(0.68, 0.72, r));",
        "  float strk = fbm(vec2(a * 26.0 + uSeed, r * 7.0 - uTime * 0.12));",
        "  vec3 cRad = mix(vec3(1.0, 0.46, 0.04), vec3(0.85, 0.2, 0.01), smoothstep(0.28, 0.7, r)) * (0.62 + 0.5 * strk);",
        "  float cv = cells(vec2(a * 9.0 + uSeed, r * 22.0 - uTime * 0.35), uTime * 0.6);",   // 对流元胞,热气往外翻
        "  float edge = smoothstep(0.06, 0.0, cv);",
        "  vec3 cConv = mix(vec3(0.45, 0.08, 0.0), vec3(0.92, 0.3, 0.02), smoothstep(0.0, 0.45, cv)) * (0.65 + 0.4 * fbm(vP * 18.0 + uTime * 0.2));",
        "  cConv = mix(cConv, vec3(0.3, 0.05, 0.0), edge * 0.45);",
        "  c = r < 0.27 ? mix(cRad, cCore, core) : (r < 0.7 ? cRad : cConv);",
        "  c = mix(c, cConv, smoothstep(0.66, 0.74, r) * step(0.27, r));",
        "  c += vec3(1.0, 0.85, 0.55) * 0.35 * (smoothstep(0.012, 0.0, abs(r - 0.27)) + smoothstep(0.012, 0.0, abs(r - 0.7)));",   // 层与层的分界辉线
        "  c *= mix(0.55, 1.0, smoothstep(1.0, 0.94, r));",
        "  float lum = dot(c, vec3(0.3, 0.59, 0.11)); c = mix(c, lum * uTint * 1.6, uTintW * 0.6);",
        "  c *= uShade * (0.25 + 0.75 * uDim) * 0.95;",
        "  gl_FragColor = vec4(c, 1.0);",
        "  #include <tonemapping_fragment>\n  #include <colorspace_fragment>",
        "}"].join("\n")
    });
  }
  var qd = new THREE.CircleGeometry(0.999, hi ? 96 : 64, 0, Math.PI / 2);
  var faces = new THREE.Group(); body.add(faces);
  var fz = new THREE.Mesh(qd, faceMat(1.0, 1.3)); faces.add(fz);
  var fx = new THREE.Mesh(qd, faceMat(0.82, 4.1)); fx.rotation.y = -Math.PI / 2; faces.add(fx);
  var fy = new THREE.Mesh(qd, faceMat(0.92, 7.7)); fy.rotation.x = Math.PI / 2; faces.add(fy);

  /* ---------- 光子乱走:每个剖面上几条随机折线,逐段点亮 ---------- */
  var glow = glowTex(THREE);
  var walks = [];
  (function () {
    var seed = 11; function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
    var per = lite ? 2 : 3;
    [fz, fx, fy].forEach(function (f) {
      for (var k = 0; k < per; k++) {
        var a0 = (k + 0.5 + (rnd() - 0.5) * 0.6) / per * Math.PI / 2, x = Math.cos(a0) * 0.24, y = Math.sin(a0) * 0.24, pts = [];
        pts.push(x, y, 0.004);
        for (var j = 0; j < 90; j++) {
          var ang = rnd() * Math.PI * 2, st = 0.035 + rnd() * 0.03;
          var nx = x + Math.cos(ang) * st + 0.009 * x / Math.hypot(x, y), ny = y + Math.sin(ang) * st + 0.009 * y / Math.hypot(x, y);
          if (nx < 0.02 || ny < 0.02) continue;
          x = nx; y = ny; pts.push(x, y, 0.004);
          if (Math.hypot(x, y) > 0.69) break;
        }
        var g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
        var m = new THREE.LineBasicMaterial({ color: 0xfff1c8, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false });
        var line = new THREE.Line(g, m); f.add(line);
        var head = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: 0xfff6dd, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
        head.scale.setScalar(0.07); f.add(head);
        walks.push({ line: line, n: pts.length / 3, pts: pts, head: head, off: rnd() * 10, spd: 6 + rnd() * 5 });
      }
    });
  })();

  /* ---------- 核心聚变闪光 ---------- */
  var flashes = [];
  (function () {
    for (var i = 0; i < (lite ? 6 : 12); i++) {
      var s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: 0xffffff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 }));
      var a = Math.random() * Math.PI / 2, b = Math.random() * Math.PI / 2, r = 0.04 + Math.random() * 0.16;
      s.position.set(r * Math.cos(a) * Math.sin(b) + 0.01, r * Math.sin(a) * Math.sin(b) + 0.01, r * Math.cos(b) + 0.01);
      body.add(s); flashes.push({ s: s, ph: Math.random() * 10, f: 1.5 + Math.random() * 3 });
    }
  })();

  /* ---------- 日冕光晕与日珥(在屏幕平面上,围着日面边缘) ---------- */
  var halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: canvasTex(THREE, 256, 256, function (c, w) {
    var g = c.createRadialGradient(w / 2, w / 2, w * 0.18, w / 2, w / 2, w / 2);
    g.addColorStop(0, "rgba(255,190,90,0.95)"); g.addColorStop(0.12, "rgba(255,140,40,0.55)"); g.addColorStop(0.35, "rgba(255,100,20,0.16)"); g.addColorStop(1, "rgba(255,80,10,0)");
    c.fillStyle = g; c.fillRect(0, 0, w, w);
  }), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  halo.scale.setScalar(5.6); halo.renderOrder = -1; halo.position.z = -0.6; sun.add(halo);
  var promU = { uTime: U.uTime, uDim: U.uDim, uTint: U.uTint, uTintW: U.uTintW };
  var proms = new THREE.Group(); sun.add(proms);
  [[2.4, 0.2, 1.2], [3.5, 0.13, 1.13], [4.5, 0.17, 1.17], [5.75, 0.1, 1.1]].forEach(function (p, i) {
    var a0 = p[0] - p[1], a1 = p[0] + p[1], h = p[2];
    var curve = new THREE.CatmullRomCurve3([0, 0.2, 0.5, 0.8, 1].map(function (u) {
      var a = a0 + (a1 - a0) * u, rr = 0.985 + (h - 0.985) * Math.sin(Math.PI * u) * (0.9 + 0.2 * Math.sin(u * 9 + i));
      return new THREE.Vector3(Math.cos(a) * rr, Math.sin(a) * rr, 0.05);
    }));
    var tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 64, 0.015 + 0.007 * (i % 2), 6, false), new THREE.ShaderMaterial({
      uniforms: Object.assign({ uSeed: { value: i * 3.7 } }, promU), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
      vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: [
        "uniform float uTime, uSeed, uDim, uTintW; uniform vec3 uTint; varying vec2 vUv;", NOISE,
        "void main(){ float n = fbm(vec2(vUv.x * 14.0 - uTime * 0.5 + uSeed, vUv.y * 3.0));",
        "  float a = 0.95 * smoothstep(0.25, 0.7, n) * smoothstep(0.0, 0.15, vUv.x) * smoothstep(1.0, 0.85, vUv.x);",
        "  vec3 c = mix(vec3(1.0, 0.42, 0.12), vec3(1.0, 0.75, 0.35), n); c = mix(c, uTint, uTintW * 0.7);",
        "  gl_FragColor = vec4(c * a * uDim * 1.4, a * uDim); }"].join("\n")
    }));
    proms.add(tube);
  });


  /* ---------- 视图对齐 ---------- */
  function size() {
    var r = canvas.getBoundingClientRect(), w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
    if (w !== state.W || h !== state.H || canvas.width === 300) { state.W = w; state.H = h; renderer.setSize(w, h, false); }
  }
  /* V = { cx, cy, R0, R }(安全区像素) */
  function view(V) {
    size();
    var Z = state.zone, Wd = state.W, Hd = state.H;
    var d = (Hd / 2) / (V.R0 * Math.tan(FOV * Math.PI / 360));
    cam.position.set(0, 0, d); cam.up.set(0, 1, 0); cam.lookAt(0, 0, 0);
    cam.aspect = Wd / Hd; cam.near = Math.max(0.05, d * 0.05); cam.far = d + 12000;
    var px = Z.x + V.cx, py = Z.y + V.cy;
    cam.setViewOffset(Wd, Hd, Wd / 2 - px, Hd / 2 - py, Wd, Hd);
    cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    sun.scale.setScalar(V.R / V.R0);
    sky.position.copy(cam.position);
    state.V = V; V.d3 = true;
    return V;
  }
  var v3 = new THREE.Vector3();
  function proj(x, y, z) {
    sun.updateMatrixWorld(true);
    v3.set(x, y, z).applyMatrix4(body.matrixWorld).project(cam);
    return [(v3.x + 1) / 2 * state.W - state.zone.x, (1 - v3.y) / 2 * state.H - state.zone.y];
  }
  function anchors() {
    return { core: proj(0.06, 0.06, 0.06), rad: proj(0.34, 0.34, 0.002), conv: proj(0.002, 0.6, 0.6), surf: proj(-0.5, -0.5, 0.7) };
  }

  function render(L) {
    if (!state.ok) return;
    size();
    var t = (performance.now() - state.t0) / 1000, st = (L && L.st) || {}, s = st.sun3 || {}, RM = L && L.RM, cur = state.cur;
    var k = RM ? 1 : 0.12;
    cur.T += ((s.T || 5772) - cur.T) * k; cur.dim += ((s.dim == null ? 1 : s.dim) - cur.dim) * k;
    cur.core += ((s.core == null ? 1 : s.core) - cur.core) * k; cur.flash += ((s.flash || 0) - cur.flash) * k;
    var c = bb(cur.T), c0 = bb(5772);
    U.uTint.value.set(c[0], c[1], c[2]);
    U.uTintW.value = Math.min(1, Math.abs(Math.log(cur.T / 5772)) * 2.2);
    U.uTime.value = RM ? 0 : t; U.uDim.value = cur.dim; U.uCore.value = cur.core; U.uCut.value = s.cut === false ? 0 : 1;
    faces.visible = s.cut !== false;
    halo.material.color.setRGB(Math.min(1, c[0] / c0[0]), Math.min(1, c[1] / c0[1]), Math.min(1, c[2] / c0[2]));
    halo.material.opacity = Math.min(1, 0.25 + 0.75 * cur.dim);
    // 光子逐段点亮(示意:真实太阳里光子要乱走约十几万年才能离开辐射区)
    walks.forEach(function (w) {
      var ph = RM ? 1 : ((t * w.spd / w.n + w.off) % 1.25) / 1.0, n = Math.max(2, Math.min(w.n, Math.floor(ph * w.n)));
      w.line.geometry.setDrawRange(0, n); w.line.material.opacity = 0.8 * cur.dim * (s.photons === false ? 0.3 : 1);
      var i = (n - 1) * 3; w.head.position.set(w.pts[i], w.pts[i + 1], 0.006); w.head.material.opacity = ph <= 1 ? cur.dim : 0;
    });
    flashes.forEach(function (f) {
      var a = RM ? 0 : Math.pow(Math.max(0, Math.sin(t * f.f + f.ph)), 12);
      f.s.material.opacity = a * cur.flash; f.s.scale.setScalar(0.05 + 0.09 * a);
    });
    proms.visible = cur.dim > 0.2;
    renderer.render(scene, cam);
  }

  function setZone(Z) { state.zone = Z; }
  function show(on) { canvas.style.visibility = on ? "visible" : "hidden"; }
  function dispose() {
    state.ok = false; disposed = true;
    scene.traverse(function (o) { if (o.geometry) o.geometry.dispose(); var ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : []; ms.forEach(function (m) { if (m.map) m.map.dispose(); m.dispose(); }); });
    texs.forEach(function (x) { x.dispose(); }); glow.dispose();
    renderer.dispose();
  }
  return { view: view, anchors: anchors, render: render, setZone: setZone, show: show, dispose: dispose, three: THREE };
}
