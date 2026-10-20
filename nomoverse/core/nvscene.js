/* 宙律 Nomoverse · 共享场景模块 nvscene(v0.3,HANDOFF §5.3.1)
   集中管理:渲染器创建、性能分级(高/中/低)、像素比上限(桌面 ≤2 / 手机 ≤1.5)、
   页面隐藏暂停、context lost 回调、通用贴图与网格工具。开场动画、星图、任务 3D 场景都走这里。
   THREE 由调用方传入(同一份本地 vendor/three.module.min.js,r169)。 */
"use strict";

export function tierInfo() {
  var NV = window.NV, P = NV && NV.perf;
  var tier = P ? P.tier : "high";
  return {
    tier: tier,
    mobile: P ? P.mobile : false,
    prCap: P ? P.prCap : 2,
    particles: tier === "high" ? 1 : 0.5,      // 中档粒子减半
    dof: tier === "high",                       // 景深/重光效仅高档
    rm: !!(NV && NV.RM)
  };
}

/* 创建渲染器:opts = { canvas, alpha, clear, onLost } */
export function createRenderer(THREE, opts) {
  var T = tierInfo(), W = window;
  var r = new THREE.WebGLRenderer({ canvas: opts.canvas, antialias: T.tier === "high", alpha: !!opts.alpha, powerPreference: T.tier === "high" ? "high-performance" : "low-power" });
  r.setPixelRatio(Math.min(T.prCap, W.devicePixelRatio || 1) * (T.tier === "mid" ? 0.85 : 1));
  if (opts.clear != null) r.setClearColor(opts.clear, opts.alpha ? 0 : 1);
  if (opts.onLost) opts.canvas.addEventListener("webglcontextlost", function (e) { e.preventDefault(); opts.onLost(new Error("WebGL context lost")); });
  return r;
}

/* 帧循环:页面隐藏 / 元素不可见时暂停;返回 { start, stop, kick } */
export function loop(fn, watchEl) {
  var W = window, D = document, raf = 0, on = false, vis = true;
  function frame(now) { raf = 0; if (!on) return; var keep = fn(now); if (keep !== false && on && vis && !D.hidden) raf = W.requestAnimationFrame(frame); }
  function kick() { if (on && !raf && vis && !D.hidden) raf = W.requestAnimationFrame(frame); }
  function onVis() { if (!D.hidden) kick(); }
  var io = watchEl && W.IntersectionObserver ? new IntersectionObserver(function (es) { vis = es[0].isIntersecting; kick(); }) : null;
  return {
    start: function () { on = true; D.addEventListener("visibilitychange", onVis); if (io) io.observe(watchEl); kick(); },
    stop: function () { on = false; if (raf) W.cancelAnimationFrame(raf); raf = 0; D.removeEventListener("visibilitychange", onVis); if (io) io.disconnect(); },
    kick: kick
  };
}

export function canvasTex(THREE, w, h, paint) {
  var c = document.createElement("canvas"); c.width = w; c.height = h; paint(c.getContext("2d"), w, h);
  var t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
export function glowTex(THREE) {
  return canvasTex(THREE, 128, 128, function (c, w) { var g = c.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(0.25, "rgba(255,255,255,.45)"); g.addColorStop(1, "rgba(255,255,255,0)"); c.fillStyle = g; c.fillRect(0, 0, w, w); });
}

/* 时空网格(着色器线框):顶点在 GPU 上按引力井 + 引力波涟漪位移。
   opts = { x0, x1, z0, z1, nx, nz, seg, color, color2, opacity }
   返回 { mesh, uni, setWells(list) } —— wells: [{x, z, depth, r}] 最多 6 个;ripple: uniform uRip (中心 xz, 起始时间, 强度) */
export function spacetimeGrid(THREE, o) {
  var nx = o.nx || 40, nz = o.nz || 30, seg = o.seg || 80, p = [];
  var x0 = o.x0, x1 = o.x1, z0 = o.z0, z1 = o.z1;
  for (var i = 0; i <= nz; i++) { var z = z0 + (z1 - z0) * i / nz; for (var j = 0; j < seg; j++) { p.push(x0 + (x1 - x0) * j / seg, 0, z, x0 + (x1 - x0) * (j + 1) / seg, 0, z); } }
  for (var a = 0; a <= nx; a++) { var x = x0 + (x1 - x0) * a / nx; for (var b = 0; b < seg; b++) { p.push(x, 0, z0 + (z1 - z0) * b / seg, x, 0, z0 + (z1 - z0) * (b + 1) / seg); } }
  var g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(p, 3));
  var uni = {
    uTime: { value: 0 },
    uWells: { value: [0, 1, 2, 3, 4, 5].map(function () { return new THREE.Vector4(0, 0, 0, 1); }) },
    uRip: { value: new THREE.Vector4(0, 0, -99, 0) },
    uRipSpeed: { value: 3.0 },
    uC1: { value: new THREE.Color(o.color || 0xa78bfa) },
    uC2: { value: new THREE.Color(o.color2 || 0x67e8f9) },
    uOp: { value: o.opacity == null ? 0.8 : o.opacity },
    uFade: { value: new THREE.Vector2(o.fadeNear || 6, o.fadeFar || 40) },
    uCam: { value: new THREE.Vector3() }
  };
  var mat = new THREE.ShaderMaterial({
    uniforms: uni, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: [
      "uniform float uTime; uniform vec4 uWells[6]; uniform vec4 uRip; uniform float uRipSpeed; uniform vec3 uCam;",
      "varying float vGlow; varying float vDist; varying float vRip;",
      "void main(){",
      "  vec3 p = position; float g = 0.0;",
      "  for(int i=0;i<6;i++){ vec4 w = uWells[i]; float d2 = dot(p.xz - w.xy, p.xz - w.xy); p.y -= w.z / sqrt(d2 / (w.w*w.w) + 1.0); g += w.z * exp(-d2/(w.w*w.w*6.0)); }",
      "  float rt = uTime - uRip.z; float rr = length(p.xz - uRip.xy); float front = rt * uRipSpeed;",
      "  float rip = (rt > 0.0) ? uRip.w * exp(-pow(rr - front, 2.0) * 0.9) * exp(-rt * 0.45) : 0.0;",
      "  p.y += rip * 0.35 * sin((rr - front) * 3.0);",
      "  vRip = rip; vGlow = clamp(g, 0.0, 1.5);",
      "  vec4 mv = modelViewMatrix * vec4(p, 1.0); vDist = -mv.z; gl_Position = projectionMatrix * mv;",
      "}"
    ].join("\n"),
    fragmentShader: [
      "uniform vec3 uC1; uniform vec3 uC2; uniform float uOp; uniform vec2 uFade;",
      "varying float vGlow; varying float vDist; varying float vRip;",
      "void main(){",
      "  float f = 1.0 - smoothstep(uFade.x, uFade.y, vDist);",
      "  vec3 c = mix(uC1, uC2, clamp(vGlow * 0.8 + vRip * 1.5, 0.0, 1.0));",
      "  gl_FragColor = vec4(c, uOp * f * (0.55 + 0.45 * clamp(vGlow + vRip * 2.0, 0.0, 1.0)));",
      "}"
    ].join("\n")
  });
  var mesh = new THREE.LineSegments(g, mat); mesh.frustumCulled = false;
  function setWells(list) { for (var i = 0; i < 6; i++) { var w = list[i]; uni.uWells.value[i].set(w ? w.x : 0, w ? w.z : 0, w ? w.depth : 0, w ? (w.r || 1) : 1); } }
  return { mesh: mesh, uni: uni, setWells: setWells };
}

/* 地球贴图(程序生成,无外部素材):海洋 + 大陆噪声 + 云 */
export function earthTex(THREE) {
  return canvasTex(THREE, 512, 256, function (c, w, h) {
    var g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#1b3a6b"); g.addColorStop(0.5, "#1d5fa0"); g.addColorStop(1, "#1b3a6b");
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    function rnd(i) { var x = Math.sin(i * 91.7 + 13.1) * 43758.5; return x - Math.floor(x); }
    var blobs = [[0.18, 0.35, 0.09], [0.24, 0.62, 0.07], [0.5, 0.3, 0.08], [0.53, 0.55, 0.09], [0.72, 0.35, 0.11], [0.8, 0.7, 0.06]];
    blobs.forEach(function (b, k) {
      for (var i = 0; i < 70; i++) {
        var a = rnd(k * 100 + i) * 6.283, r = rnd(k * 100 + i + 50) * b[2];
        var x = (b[0] + Math.cos(a) * r * 1.3) * w, y = (b[1] + Math.sin(a) * r) * h, s = (0.25 + rnd(i + k) * 0.5) * b[2] * w * 0.5;
        c.fillStyle = rnd(i * 3 + k) > 0.6 ? "#7a6a3e" : "#2f7a3f"; c.globalAlpha = 0.8;
        c.beginPath(); c.ellipse(x, y, s, s * 0.7, a, 0, 6.283); c.fill();
      }
    });
    c.globalAlpha = 0.9; c.fillStyle = "#e8f1ff"; c.fillRect(0, 0, w, h * 0.06); c.fillRect(0, h * 0.94, w, h * 0.06);
    c.globalAlpha = 0.28; c.fillStyle = "#ffffff";
    for (var q = 0; q < 160; q++) { c.beginPath(); c.ellipse(rnd(q + 900) * w, rnd(q + 1900) * h, 6 + rnd(q) * 26, 2 + rnd(q + 7) * 5, 0, 0, 6.283); c.fill(); }
    c.globalAlpha = 1;
  });
}
