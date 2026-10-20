/* 宙律 Nomoverse · 开场动画(v0.3「引力之海 × 尺度穿梭」,约 7 秒)
   夸克三色光点 → 镜头一路拉远到地球,地球压出引力井、轨道与空间站点亮 →
   引力波涟漪扩散,「宙律 Nomoverse · 物理」浮现 → 继续拉远,网格延展为宇宙尺度轴、银河出现 → HUD 落位。
   规则(§5.3.1):点任意处 / Esc / 跳过按钮即跳过;首次自动播,之后设置里可重播;声音默认关(关时无声);
   无 WebGL → 静态淡入;减少动态 → 不播放,直接进主界面。THREE 为 null 时走静态版。 */
"use strict";
import { createRenderer, tierInfo, spacetimeGrid, glowTex, canvasTex, earthTex } from "./nvscene.js";

var DUR = 7.2;
function sm(a, b, x) { var t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
function lerp(a, b, t) { return a + (b - a) * t; }

export function run(THREE, opts) {
  opts = opts || {};
  var D = document, W = window, NV = W.NV, SND = NV && NV.snd;
  var done = false, endT = null;
  var ov = D.createElement("div"); ov.className = "nv-intro"; ov.setAttribute("role", "dialog"); ov.setAttribute("aria-label", "开场动画:宙律 Nomoverse");
  ov.innerHTML = '<canvas class="nv-intro-cv" aria-hidden="true"></canvas>' +
    '<div class="nv-intro-title" aria-hidden="true"><span class="zh">宙律</span><span class="en">Nomoverse</span><span class="sub">创世计划 Genesis · 02 · <b>物理</b></span><span class="tag">亲手改写宇宙的规律</span></div>' +
    '<div class="nv-intro-scale" aria-hidden="true"></div>' +
    '<i class="nv-intro-c tl"></i><i class="nv-intro-c tr"></i><i class="nv-intro-c bl"></i><i class="nv-intro-c br"></i>' +
    '<button class="nv-intro-skip" type="button">跳过 ›</button>' +
    '<p class="nv-intro-hint" aria-hidden="true">点击任意处或按 Esc 跳过</p>';
  D.body.appendChild(ov);
  var cv = ov.querySelector("canvas"), title = ov.querySelector(".nv-intro-title"), scaleLbl = ov.querySelector(".nv-intro-scale");
  var skipBtn = ov.querySelector(".nv-intro-skip");
  var prevFocus = D.activeElement; skipBtn.focus({ preventScroll: true });

  var resolveP; var P = new Promise(function (r) { resolveP = r; });
  function finish() {
    if (done) return; done = true;
    W.removeEventListener("keydown", onKey, true);
    ov.classList.add("out");
    setTimeout(function () { try { if (G) G.dispose(); } catch (e) {} ov.remove(); if (prevFocus && prevFocus.focus) try { prevFocus.focus({ preventScroll: true }); } catch (e) {} resolveP(); }, 600);
  }
  function onKey(e) { if (e.key === "Escape" || e.key === "Enter" || e.key === " ") { e.preventDefault(); finish(); } }
  W.addEventListener("keydown", onKey, true);
  ov.addEventListener("pointerdown", function (e) { e.preventDefault(); finish(); });

  /* ---------- 静态版:无 WebGL ---------- */
  var G = null;
  if (!THREE) {
    ov.classList.add("static");
    requestAnimationFrame(function () { ov.classList.add("t-on"); });
    setTimeout(finish, 2400);
    return P;
  }

  /* ---------- WebGL 版 ---------- */
  try { G = build(THREE); }
  catch (err) { if (W.console) console.warn("[宙律] 开场 3D 失败,改静态:", err && err.message); ov.classList.add("static"); requestAnimationFrame(function () { ov.classList.add("t-on"); }); setTimeout(finish, 2400); return P; }

  function build(THREE) {
    var T = tierInfo();
    var lost = false;
    var r = createRenderer(THREE, { canvas: cv, clear: 0x05041a, onLost: function () { lost = true; finish(); } });
    var scene = new THREE.Scene();
    var cam = new THREE.PerspectiveCamera(50, 1, 0.05, 400);
    scene.add(new THREE.AmbientLight(0x8b84d6, 0.55));
    var sun = new THREE.DirectionalLight(0xffffff, 2.6); sun.position.set(-4, 3, 5); scene.add(sun);
    var gT = glowTex(THREE);
    function glow(col, size, op) { var s = new THREE.Sprite(new THREE.SpriteMaterial({ map: gT, color: col, transparent: true, opacity: op, depthWrite: false, blending: THREE.AdditiveBlending })); s.scale.setScalar(size); return s; }

    // ① 夸克:三色光球 + 胶子弹簧线
    var Q = new THREE.Group(); scene.add(Q);
    var qCol = [0xff5a6e, 0x5aff9a, 0x5aa8ff], qPos = [];
    qCol.forEach(function (c, k) {
      var a = k * 2.094 + 1.57, p = new THREE.Vector3(Math.cos(a) * 0.55, Math.sin(a) * 0.55, 0); qPos.push(p);
      var m = new THREE.Mesh(new THREE.SphereGeometry(0.1, 24, 16), new THREE.MeshBasicMaterial({ color: c, transparent: true })); m.position.copy(p); Q.add(m);
      var gl = glow(c, 0.7, 0.8); gl.position.copy(p); Q.add(gl);
    });
    var springGeo = new THREE.BufferGeometry(), SP = 3 * 120, spArr = new Float32Array(SP * 3);
    springGeo.setAttribute("position", new THREE.BufferAttribute(spArr, 3));
    var springs = new THREE.Line(springGeo, new THREE.LineBasicMaterial({ color: 0xdcd6ff, transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending, depthWrite: false }));
    Q.add(springs);
    function updSprings(t) {
      var k = 0, tmp = new THREE.Vector3(), n = new THREE.Vector3();
      for (var s = 0; s < 3; s++) {
        var A = qPos[s], B = qPos[(s + 1) % 3]; n.subVectors(B, A); var nx = -n.y, ny = n.x, len = Math.hypot(nx, ny) || 1; nx /= len; ny /= len;
        for (var i = 0; i < 120; i++) {
          var u = i / 119, amp = 0.05 * Math.sin(u * Math.PI);
          var ph = u * 40 + t * 9;
          tmp.lerpVectors(A, B, u);
          spArr[k++] = tmp.x + nx * Math.sin(ph) * amp; spArr[k++] = tmp.y + ny * Math.sin(ph) * amp; spArr[k++] = Math.cos(ph) * amp;
        }
      }
      springGeo.attributes.position.needsUpdate = true;
    }
    // 拉远时的速度线
    var NS = Math.round(260 * T.particles), stArr = new Float32Array(NS * 6), stSeed = [];
    for (var i = 0; i < NS; i++) { var a = Math.random() * 6.283, rr = 0.9 + Math.random() * 5; stSeed.push([Math.cos(a) * rr, Math.sin(a) * rr, Math.random() * 30]); }
    var stGeo = new THREE.BufferGeometry(); stGeo.setAttribute("position", new THREE.BufferAttribute(stArr, 3));
    var streakMat = new THREE.LineBasicMaterial({ color: 0xc9c4ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
    var streaks = new THREE.LineSegments(stGeo, streakMat); streaks.frustumCulled = false; scene.add(streaks);

    // ② 时空网格 + 地球 + 轨道 + 空间站
    var grid = spacetimeGrid(THREE, { x0: -60, x1: 60, z0: -60, z1: 22, nx: 96, nz: 66, seg: T.tier === "high" ? 160 : 100, opacity: 0, fadeNear: 10, fadeFar: 70 });
    scene.add(grid.mesh);
    var earthG = new THREE.Group(); scene.add(earthG);
    var earth = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 40), new THREE.MeshStandardMaterial({ map: earthTex(THREE), roughness: 0.8, metalness: 0, emissive: 0x0b1840, emissiveIntensity: 0.4 }));
    earth.rotation.z = 0.41; earthG.add(earth);
    var atm = glow(0x6fb6ff, 3.1, 0.45); earthG.add(atm);
    var orbit = new THREE.Mesh(new THREE.TorusGeometry(1.9, 0.012, 8, 160), new THREE.MeshBasicMaterial({ color: 0x67e8f9, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
    var orbG = new THREE.Group(); orbG.rotation.x = Math.PI / 2 - 0.32; orbG.rotation.y = 0.18; earthG.add(orbG); orbG.add(orbit);
    var orbitGlow = new THREE.Mesh(new THREE.TorusGeometry(1.9, 0.05, 8, 160), new THREE.MeshBasicMaterial({ color: 0x67e8f9, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
    orbG.add(orbitGlow);
    var station = new THREE.Group();
    station.add(new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.04, 0.04), new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.5, roughness: 0.4 })));
    [-1, 1].forEach(function (s) { var pnl = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.005, 0.12), new THREE.MeshStandardMaterial({ color: 0x3355aa, emissive: 0x112244 })); pnl.position.x = 0.07 * s; station.add(pnl); });
    var stGlow = glow(0xffffff, 0.25, 0.9); station.add(stGlow);
    orbG.add(station);

    // ③ 远景:背景星 + 银河 + 尺度轴
    var NB = Math.round(1800 * T.particles), bp = new Float32Array(NB * 3);
    for (var b = 0; b < NB; b++) { var th = Math.random() * 6.283, ph = Math.acos(2 * Math.random() - 1), rad = 90 + Math.random() * 120; bp[b * 3] = rad * Math.sin(ph) * Math.cos(th); bp[b * 3 + 1] = rad * Math.cos(ph); bp[b * 3 + 2] = rad * Math.sin(ph) * Math.sin(th); }
    var bgG = new THREE.BufferGeometry(); bgG.setAttribute("position", new THREE.BufferAttribute(bp, 3));
    var bgMat = new THREE.PointsMaterial({ color: 0xe6e1ff, size: 1.4, sizeAttenuation: false, transparent: true, opacity: 0 });
    scene.add(new THREE.Points(bgG, bgMat));
    var galTex = canvasTex(THREE, 512, 512, function (c, w) {
      var cx = w / 2; c.translate(cx, cx);
      var g0 = c.createRadialGradient(0, 0, 0, 0, 0, w * 0.18); g0.addColorStop(0, "rgba(255,240,255,1)"); g0.addColorStop(1, "rgba(196,181,253,0)"); c.fillStyle = g0; c.beginPath(); c.arc(0, 0, w * 0.18, 0, 7); c.fill();
      for (var i = 0; i < 2600; i++) {
        var arm = i % 2, u = Math.random(), ang = u * 7.5 + arm * Math.PI + (Math.random() - 0.5) * 0.6, rr = u * w * 0.46;
        var x = Math.cos(ang) * rr, y = Math.sin(ang) * rr;
        c.fillStyle = Math.random() < 0.3 ? "rgba(103,232,249," + (0.5 - u * 0.4).toFixed(2) + ")" : "rgba(196,181,253," + (0.75 - u * 0.55).toFixed(2) + ")";
        c.fillRect(x, y, 1.6, 1.6);
      }
    });
    var galaxy = new THREE.Mesh(new THREE.PlaneGeometry(56, 56), new THREE.MeshBasicMaterial({ map: galTex, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    galaxy.position.set(58, 14, -70); galaxy.rotation.set(-1.05, 0.2, 0.4); scene.add(galaxy);
    var gGal = glow(0xa78bfa, 40, 0); gGal.position.copy(galaxy.position); scene.add(gGal);
    var A0 = new THREE.Vector3(-14, 0.4, 14), A1 = galaxy.position.clone();
    var axLen = A0.distanceTo(A1), axDir = new THREE.Vector3().subVectors(A1, A0).normalize();
    var axGeo = new THREE.CylinderGeometry(0.06, 0.06, axLen, 8, 1, true); axGeo.translate(0, axLen / 2, 0);
    var axis = new THREE.Mesh(axGeo, new THREE.MeshBasicMaterial({ color: 0xe0e7ff, transparent: true, opacity: 0.95 }));
    var axGeo2 = new THREE.CylinderGeometry(0.32, 0.32, axLen, 10, 1, true); axGeo2.translate(0, axLen / 2, 0);
    var axisGlow = new THREE.Mesh(axGeo2, new THREE.MeshBasicMaterial({ color: 0x7c8cff, transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending, depthWrite: false }));
    var axG = new THREE.Group(); axG.add(axis); axG.add(axisGlow); axG.position.copy(A0);
    axG.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), axDir); axG.scale.set(1, 0.001, 1); scene.add(axG);
    // 尺度轴上的知识星簇
    var NK = Math.round(220 * T.particles), kp = new Float32Array(NK * 3), kc = new Float32Array(NK * 3), cc = [0x5eead4, 0xfbbf24, 0xa78bfa, 0x86efac, 0xf0abfc, 0xfb923c, 0x60a5fa, 0xf87171].map(function (h) { return new THREE.Color(h); });
    for (var k = 0; k < NK; k++) { var u = Math.random(), v = new THREE.Vector3().copy(A0).addScaledVector(axDir, u * axLen); v.x += (Math.random() - 0.5) * 4; v.y += (Math.random() - 0.3) * 3; v.z += (Math.random() - 0.5) * 4; kp[k * 3] = v.x; kp[k * 3 + 1] = v.y; kp[k * 3 + 2] = v.z; var col = cc[k % 8]; kc[k * 3] = col.r; kc[k * 3 + 1] = col.g; kc[k * 3 + 2] = col.b; }
    var kG = new THREE.BufferGeometry(); kG.setAttribute("position", new THREE.BufferAttribute(kp, 3)); kG.setAttribute("color", new THREE.BufferAttribute(kc, 3));
    var kMat = new THREE.PointsMaterial({ size: 3.2, sizeAttenuation: false, vertexColors: true, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
    scene.add(new THREE.Points(kG, kMat));

    var vw = 0, vh = 0, t0 = performance.now(), look = new THREE.Vector3(), cp = new THREE.Vector3(), cues = {};
    function cue(name, t, fn) { if (!cues[name] && t >= 0) { cues[name] = 1; fn(); } }
    function render(now) {
      if (lost) return false;
      var w = W.innerWidth, h = W.innerHeight;
      if (w !== vw || h !== vh) { vw = w; vh = h; r.setSize(w, h, false); cam.aspect = w / h; cam.fov = w / h < 0.9 ? 66 : 50; cam.updateProjectionMatrix(); }
      var t = W.__nvIntroT != null ? W.__nvIntroT : (now - t0) / 1000;      // __nvIntroT:自测钩子,冻结到指定秒
      // —— 夸克阶段 0–1.9 s
      var qa = 1 - sm(1.2, 1.9, t); Q.visible = qa > 0.01; Q.scale.setScalar(lerp(1, 0.02, sm(1.0, 1.9, t)));
      Q.rotation.z = t * 0.6; Q.children.forEach(function (o) { if (o.material) o.material.opacity = (o.isSprite ? 0.85 : o.isLine ? 0.75 : 1) * qa; });
      updSprings(t);
      var sa = sm(0.2, 0.6, t) * (1 - sm(1.6, 2.1, t)); streakMat.opacity = sa * 0.8; streaks.visible = sa > 0.01;
      if (streaks.visible) { for (var i = 0; i < NS; i++) { var s = stSeed[i], z = ((s[2] + t * 26) % 30) - 26, L = 0.6 + sa * 2.4; stArr[i * 6] = s[0]; stArr[i * 6 + 1] = s[1]; stArr[i * 6 + 2] = cam.position.z + z; stArr[i * 6 + 3] = s[0]; stArr[i * 6 + 4] = s[1]; stArr[i * 6 + 5] = cam.position.z + z - L; } stGeo.attributes.position.needsUpdate = true; }
      // —— 地球与引力井 1.5–3.4 s
      var ea = sm(1.5, 2.3, t), depth = 2.2 * sm(1.9, 3.1, t);
      earthG.visible = ea > 0.001; earthG.scale.setScalar(lerp(0.02, 1, ea));
      earthG.position.set(0, 1.05 - depth * 0.62, 0); earth.rotation.y = t * 0.25;
      grid.uni.uOp.value = 0.85 * sm(1.7, 2.6, t); grid.setWells([{ x: 0, z: 0, depth: depth, r: 1.25 }]);
      var oa = sm(2.5, 3.1, t); orbit.material.opacity = oa * 0.95; orbitGlow.material.opacity = oa * 0.35; station.visible = oa > 0.01;
      var sAng = t * 0.9; station.position.set(Math.cos(sAng) * 1.9, Math.sin(sAng) * 1.9, 0);
      // —— 引力波涟漪 + 标题 3.3–5.4 s
      cue("rip", t - 3.3, function () { grid.uni.uRip.value.set(0, 0, t, 2.6); ov.classList.add("t-on"); if (SND) { SND.pulse(41.2, 0.45); } });
      cue("rip2", t - 4.1, function () { grid.uni.uRip.value.set(0, 0, t, 1.8); });
      cue("q", t - 0.05, function () { if (SND) SND.glide(330, 659, 1.6, 0.18); });
      cue("e", t - 1.6, function () { if (SND) SND.glide(247, 494, 1.2, 0.16); });
      cue("s", t - 5.2, function () { if (SND) SND.glide(494, 988, 1.6, 0.12); ov.classList.add("s-on"); });
      cue("t-off", t - 5.9, function () { ov.classList.add("t-off"); });
      cue("hud", t - 6.3, function () { ov.classList.add("hud-on"); });
      grid.uni.uTime.value = t;
      // —— 尺度穿梭 5.1–7.2 s
      var sp = sm(5.1, 7.0, t);
      bgMat.opacity = 0.2 + 0.7 * sm(2.0, 5.5, t);
      axG.scale.set(1, Math.max(0.001, sm(5.3, 6.6, t)), 1); axG.visible = t > 5.2;
      galaxy.material.opacity = sm(5.4, 6.6, t) * 0.95; gGal.material.opacity = sm(5.4, 6.6, t) * 0.35; galaxy.rotation.z = 0.4 + t * 0.05;
      kMat.opacity = sm(5.8, 6.8, t) * 0.9;
      scaleLbl.textContent = "10" + sup(Math.round(lerp(-15, 21, sm(0.3, 6.8, t)))) + " m";
      // —— 镜头路径
      var p1 = sm(0, 1.9, t), p2 = sm(1.7, 3.4, t), p3 = sm(3.3, 5.1, t);
      cp.set(0, 0.15, lerp(2.2, 4.8, p1));                              // 夸克处后退
      cp.lerp(new THREE.Vector3(0.6, 3.0, 8.2), p2);                      // 俯看引力井
      cp.lerp(new THREE.Vector3(2.4, 5.2, 10.4), p3);                      // 涟漪扩散
      cp.lerp(new THREE.Vector3(-22, 16, 34), sp);                        // 拉远到尺度轴
      look.set(0, lerp(0, -0.3, p2) + 2.2 * p3, 0).lerp(new THREE.Vector3(18, 2, -20), sp);
      cam.position.copy(cp); cam.lookAt(look);
      r.render(scene, cam);
      if (t >= DUR) { finish(); return false; }
      return true;
    }
    function dispose() { scene.traverse(function (o) { if (o.geometry) o.geometry.dispose(); if (o.material) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); } }); gT.dispose(); r.dispose(); }
    // 首帧同步渲染,失败直接抛出走静态
    render(performance.now());
    var gl = r.getContext(); if (gl.isContextLost && gl.isContextLost()) throw new Error("context lost");
    return { render: render, dispose: dispose };
  }
  function sup(n) { var m = "⁰¹²³⁴⁵⁶⁷⁸⁹"; return String(n).replace(/-/g, "⁻").replace(/\d/g, function (d) { return m[+d]; }); }
  (function tick(now) { if (done) return; var keep = G.render(now); if (keep !== false && !done) requestAnimationFrame(tick); })(performance.now());
  // 页面隐藏时直接结束开场(不在后台空转)
  D.addEventListener("visibilitychange", function vh() { if (D.hidden) { D.removeEventListener("visibilitychange", vh); finish(); } });
  return P;
}
