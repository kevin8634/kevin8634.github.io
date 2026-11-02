/* 宙律 Nomoverse · 规则改写台 3D 舞台(v0.8-α1,按王磊 11-01 19:04 批准的三张效果图)
   只负责「画」;数值全部来自 core/labmodel.js(页面算好后通过 state 传进来)。
   ① 重力:左右分屏 A 现实 / B 改写后,同一个机位;发射点与篮筐同高,篮筐放在地球这一投的落点。
   ② 摩擦:夜间城市路面,两条车道 A / B 并排刹车,30 m 处路口停止线。
   ③ 声速:雨夜街道侧视,救护车发出一圈圈声波(竖直平面上的球面截圆),慢声速时叠成马赫锥。
   ④ 光速(v0.8-α2):深空上下两条信号通道 A / B,地球发出光脉冲飞向目标(城市信标 / 月球 / 火星),到达时目标闪亮。
   ⑤ 潮汐(v0.8-α2):左右分屏,地球 + 被拉长的海水壳(潮差对数夸张)+ 月球 + 红色洛希极限圈;进了极限,月亮碎成光环。
   ④⑤ 首次进入才建场景、才加载贴图(地球 NASA Blue Marble、星空 NASA SVS 复用 assets/hoop/;月球 Solar System Scope CC BY 4.0 复用 assets/tide/);火星为程序着色。
   坐标 1 单位 = 1 m。贴图复用投篮任务 assets/hoop/(Poly Haven CC0、NASA),街景全部程序生成。 */
"use strict";
import { tierInfo, createRenderer, canvasTex, glowTex } from "./nvscene.js";

var ASSET = new URL("../assets/hoop/", import.meta.url).href;
var RIM = 3.05, BALL = 0.12;

export function mount(THREE, canvas, opts) {
  opts = opts || {};
  var T = tierInfo(), hi = T.tier === "high", W = window;
  var renderer = createRenderer(THREE, { canvas: canvas, alpha: false, clear: 0x05040f, onLost: opts.onLost });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.autoClear = false;
  var ANISO = Math.min(hi ? 12 : 6, renderer.capabilities.getMaxAnisotropy ? renderer.capabilities.getMaxAnisotropy() : 4);
  var RES = { d: "d2k", n: hi ? "n2k" : "n1k", sky: hi ? "4k" : "2k", planet: hi ? "2k" : "1k" };
  var loader = new THREE.TextureLoader(), cache = {}, disposed = false, pending = 0;
  function tex(name, srgb, rep) {
    var key = name + (rep || "");
    if (cache[key]) return cache[key];
    pending++;
    var t = loader.load(ASSET + name + ".jpg", function () { pending--; }, undefined, function () { pending--; if (W.console) console.warn("[nv.lab] 贴图加载失败:", name); });
    t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.anisotropy = ANISO;
    if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, rep); }
    cache[key] = t; return t;
  }
  var GLOW = glowTex(THREE);

  /* ================= ① 重力:两个球场 ================= */
  var ENV = {
    earth:   { sky: "sky_dusk",  ground: "asphalt", tile: 0.33, fog: [0x7a6a86, 40, 260], sun: [0xffc08a, 2.6, [-9, 5, 6]], hemi: [0xb8a8d8, 0x3a2c2a, 1.0], skyI: 1, lines: true },
    g2x:     { sky: "sky_dusk",  ground: "asphalt", tile: 0.33, fog: [0x4a3a5e, 30, 200], sun: [0xff9a6a, 2.2, [-9, 4, 5]], hemi: [0x8a78b8, 0x2a1c2a, 0.85], skyI: 0.6, lines: true, tint: 0xb09ad0 },
    moon:    { sky: "sky_space", ground: "moon",    tile: 0.25, fog: [0x050507, 120, 520], sun: [0xffffff, 3.4, [-8, 6, 6]], hemi: [0x30323a, 0x0c0c0e, 0.4], skyI: 0.6, planet: { tex: "planet_earth", r: 9, pos: [30, 22, -150] } },
    mars:    { sky: "sky_day",   ground: "mars",    tile: 0.28, fog: [0xc9946a, 30, 240], sun: [0xffe2c4, 2.4, [-7, 7, 6]], hemi: [0xe0a77c, 0x5a3220, 0.9], skyI: 1, skyTint: 0xe0a070 },
    jupiter: { sky: "sky_space", ground: "deck",    tile: 0.42, fog: null, sun: [0xfff3e0, 3.0, [-7, 8, 7]], hemi: [0x6c5a48, 0x2a1d14, 0.6], skyI: 0.5, planet: { tex: "planet_jupiter", r: 60, pos: [40, 10, -260] } }
  };
  function court() {
    var S = new THREE.Scene(), o = { scene: S };
    o.sky = new THREE.Mesh(new THREE.SphereGeometry(900, 48, 24), new THREE.MeshBasicMaterial({ side: THREE.BackSide, fog: false, depthWrite: false }));
    o.sky.rotation.y = 1.4; S.add(o.sky);
    o.hemi = new THREE.HemisphereLight(0xffffff, 0x333333, 1); S.add(o.hemi);
    o.sun = new THREE.DirectionalLight(0xffffff, 2.5); S.add(o.sun); S.add(o.sun.target);
    o.gmat = new THREE.MeshStandardMaterial({ roughness: 0.95, metalness: 0 });
    o.ground = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), o.gmat); o.ground.rotation.x = -Math.PI / 2; S.add(o.ground);
    // 球场线(罚球区与三分线示意,只在地面球场显示)
    o.lines = new THREE.Mesh(new THREE.PlaneGeometry(24, 16), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.8, depthWrite: false, map: canvasTex(THREE, 1024, 683, function (c, w, h) {
      c.strokeStyle = "rgba(240,240,240,.85)"; c.lineWidth = 5;
      c.strokeRect(20, 20, w - 40, h - 40); c.beginPath(); c.moveTo(w / 2, 20); c.lineTo(w / 2, h - 40 + 20); c.stroke();
      c.beginPath(); c.arc(w - 20, h / 2, h * 0.42, Math.PI * 0.5, Math.PI * 1.5); c.stroke(); c.strokeRect(w - 20 - 250, h / 2 - 100, 250, 200);
    }) }));
    o.lines.rotation.x = -Math.PI / 2; o.lines.position.y = 0.01; S.add(o.lines);
    // 发射台(与篮筐同高)
    var steel = new THREE.MeshStandardMaterial({ color: 0x2a2d36, roughness: 0.45, metalness: 0.8 });
    var glow = new THREE.MeshBasicMaterial({ color: 0x67e8f9, toneMapped: false });
    o.launch = new THREE.Group();
    var col = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, RIM - 0.15, 16), steel); col.position.y = (RIM - 0.15) / 2; o.launch.add(col);
    var cup = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.018, 8, 32), glow); cup.rotation.x = Math.PI / 2; cup.position.y = RIM - 0.13; o.launch.add(cup);
    var base = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 0.08, 24), steel); base.position.y = 0.04; o.launch.add(base);
    S.add(o.launch);
    // 篮架
    o.hoop = new THREE.Group(); S.add(o.hoop);
    var pole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.1, 3.6, 20), steel); pole.position.set(1.3, 1.8, 0); o.hoop.add(pole);
    var arm = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.1, 0.1), steel); arm.position.set(0.85, 3.45, 0); o.hoop.add(arm);
    var glass = new THREE.Mesh(new THREE.BoxGeometry(0.03, 1.05, 1.8), new THREE.MeshStandardMaterial({ color: 0xdbeafe, roughness: 0.08, transparent: true, opacity: 0.35 })); glass.position.set(0.375, 3.425, 0); o.hoop.add(glass);
    var fm = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.4 });
    [[0, 3.95, 0, 0.04, 0.05, 1.84], [0, 2.9, 0, 0.04, 0.05, 1.84], [0, 3.425, 0.9, 0.04, 1.1, 0.05], [0, 3.425, -0.9, 0.04, 1.1, 0.05]].forEach(function (b) { var m = new THREE.Mesh(new THREE.BoxGeometry(b[3], b[4], b[5]), fm); m.position.set(0.375 + b[0], b[1], b[2]); o.hoop.add(m); });
    var rimM = new THREE.MeshStandardMaterial({ color: 0xea580c, roughness: 0.35, metalness: 0.6 });
    var rim = new THREE.Mesh(new THREE.TorusGeometry(0.225, 0.012, 10, 48), rimM); rim.rotation.x = Math.PI / 2; rim.position.set(0, RIM, 0); o.hoop.add(rim);
    var np = []; for (var i = 0; i < 12; i++) { var a = i / 12 * Math.PI * 2, a2 = (i + 0.5) / 12 * Math.PI * 2; np.push(Math.cos(a) * 0.225, 0, Math.sin(a) * 0.225, Math.cos(a2) * 0.13, -0.42, Math.sin(a2) * 0.13); }
    var ng = new THREE.BufferGeometry(); ng.setAttribute("position", new THREE.Float32BufferAttribute(np, 3));
    var net = new THREE.LineSegments(ng, new THREE.LineBasicMaterial({ color: 0xf1f5f9, transparent: true, opacity: 0.85 })); net.position.set(0, RIM, 0); o.hoop.add(net);
    // 篮球
    o.ball = new THREE.Mesh(new THREE.SphereGeometry(BALL, 40, 24), new THREE.MeshStandardMaterial({ map: BALLTEX, roughness: 0.62 })); S.add(o.ball);
    // 轨迹(发光管线)与落点光圈
    o.trailMat = new THREE.MeshBasicMaterial({ color: 0x67e8f9, toneMapped: false, transparent: true, opacity: 0.95 });
    o.trail = new THREE.Mesh(new THREE.BufferGeometry(), o.trailMat); S.add(o.trail);
    o.halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, color: 0x67e8f9, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })); o.halo.scale.setScalar(0.9); S.add(o.halo);
    o.planet = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 40), new THREE.MeshStandardMaterial({ roughness: 0.9, fog: false })); o.planet.visible = false; S.add(o.planet);
    o.cam = new THREE.PerspectiveCamera(38, 1, 0.1, 3000);
    o.env = null; o.key = "";
    return o;
  }
  var BALLTEX = canvasTex(THREE, 512, 256, function (c, w, h) {
    c.fillStyle = "#e0661c"; c.fillRect(0, 0, w, h);
    var s = 7; function r() { s = (s * 16807) % 2147483647; return s / 2147483647; }
    for (var i = 0; i < 6000; i++) { c.fillStyle = r() < 0.5 ? "rgba(120,40,8,.25)" : "rgba(255,170,110,.18)"; c.fillRect(r() * w, r() * h, 1.5, 1.5); }
    c.strokeStyle = "#1b0d06"; c.lineWidth = 5; c.beginPath(); c.moveTo(0, h / 2); c.lineTo(w, h / 2); c.moveTo(w / 4, 0); c.lineTo(w / 4, h); c.moveTo(w * 3 / 4, 0); c.lineTo(w * 3 / 4, h); c.stroke();
  });
  function setEnv(o, name) {
    if (o.env === name) return; o.env = name;
    var E = ENV[name] || ENV.earth;
    o.sky.material.map = tex(E.sky + "_" + RES.sky, true); o.sky.material.color.set(E.skyTint || 0xffffff).multiplyScalar(E.skyI); o.sky.material.needsUpdate = true;
    o.gmat.map = tex(E.ground + "_" + RES.d, true, 600 * E.tile); o.gmat.normalMap = tex(E.ground + "_" + RES.n, false, 600 * E.tile);
    o.gmat.color.set(E.tint || 0xffffff); o.gmat.needsUpdate = true;
    o.scene.fog = E.fog ? new THREE.Fog(E.fog[0], E.fog[1], E.fog[2]) : null;
    o.sun.color.set(E.sun[0]); o.sun.intensity = E.sun[1]; o.sun.position.set(E.sun[2][0], E.sun[2][1], E.sun[2][2]);
    o.hemi.color.set(E.hemi[0]); o.hemi.groundColor.set(E.hemi[1]); o.hemi.intensity = E.hemi[2];
    o.lines.visible = !!E.lines;
    if (E.planet) { o.planet.material.map = tex(E.planet.tex + "_" + RES.planet, true); o.planet.material.needsUpdate = true; o.planet.scale.setScalar(E.planet.r); o.planet.position.set(E.planet.pos[0], E.planet.pos[1], E.planet.pos[2]); o.planet.visible = true; }
    else o.planet.visible = false;
  }
  function arcPts(sh, n) {
    var p = [], T = sh.T; for (var i = 0; i <= n; i++) { var t = T * i / n; p.push(new THREE.Vector3(sh.vx * t, RIM + sh.vy * t - 0.5 * sh.g * t * t, 0)); } return p;
  }
  function setTrail(o, sh, upto, col) {
    var k = Math.max(0.001, Math.min(1, upto)), pts = arcPts(sh, 90).slice(0, Math.max(2, Math.ceil(91 * k)));
    if (o.trail.geometry) o.trail.geometry.dispose();
    o.trail.geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), Math.max(4, pts.length * 2), 0.028, 6, false);
    o.trailMat.color.set(col); o.halo.material.color.set(col);
  }
  var CA = court(), CB = court(), gravKey = "";

  function renderGravity(st, w, h, x0, y0) {
    var a = st.ev.a, b = st.ev.b, hoopX = st.ev.hoop;
    setEnv(CA, "earth"); setEnv(CB, st.envB || "earth");
    [CA, CB].forEach(function (o) { o.hoop.position.set(hoopX, 0, 0); o.launch.position.set(0, 0, 0); o.lines.position.x = hoopX - 6; });
    var tPlay = st.t;  // 显示用秒数(null = 未运行)
    var kA = tPlay == null ? 1 : Math.min(1, tPlay / st.durA), kB = tPlay == null ? (st.revealed ? 1 : 0) : Math.min(1, tPlay / st.durB);
    var key = [a.R, a.H, b.R, b.H, kA.toFixed(3), kB.toFixed(3)].join("|");
    if (key !== gravKey) {
      gravKey = key;
      setTrail(CA, a, kA, 0x67e8f9); setTrail(CB, b, kB, 0xfbbf24);
      CB.trail.visible = kB > 0.002; CB.halo.visible = kB > 0.002;
    }
    function place(o, sh, k) { var t = sh.T * k; o.ball.position.set(sh.vx * t, Math.max(BALL, RIM + sh.vy * t - 0.5 * sh.g * t * t), 0); o.ball.rotation.z = -t * 6; o.halo.position.copy(o.ball.position); }
    place(CA, a, kA); place(CB, b, kB);
    var split = w > 560, half = split ? Math.floor(w / 2) : w;
    var cx = hoopX * 0.55;
    var wide = !!st.wide;   // 桌面:左右两侧有面板,A 画面往右让、B 画面往左让
    [CA, CB].forEach(function (o, i) {
      var por = half / h < 0.9;
      o.cam.aspect = half / h; o.cam.fov = por ? 50 : 36; o.cam.updateProjectionMatrix();
      var dist = Math.max(13, hoopX * 2.25) / (por ? 0.8 : 1), sh = wide && split ? (i === 0 ? -0.36 : 0.62) * hoopX : 0;
      o.cam.position.set(cx + sh, 2.4, dist); o.cam.lookAt(cx + sh, 3.1, 0);
      o.sun.target.position.set(cx, 0, 0);
    });
    if (split) {
      vp(x0, y0, half, h); renderer.render(CA.scene, CA.cam);
      vp(x0 + half, y0, w - half, h); renderer.render(CB.scene, CB.cam);
    } else { vp(x0, y0, w, h); renderer.render(st.side === "a" ? CA.scene : CB.scene, CA.cam); }
    lastCam = CA.cam; lastSplit = split ? half : 0;
  }

  /* ================= 街景(摩擦 / 声速共用) ================= */
  function windowTex(seed, warm) {
    return canvasTex(THREE, 256, 512, function (c, w, h) {
      var s = seed; function r() { s = (s * 16807) % 2147483647; return s / 2147483647; }
      c.fillStyle = "#0b0f1c"; c.fillRect(0, 0, w, h);
      for (var y = 8; y < h - 8; y += 18) for (var x = 8; x < w - 8; x += 16) {
        var on = r(); if (on < 0.42) continue;
        c.fillStyle = on > 0.93 ? "#7dd3fc" : on > 0.7 ? (warm ? "#ffd59a" : "#cfe3ff") : "rgba(255,210,150,.35)";
        c.fillRect(x, y, 10, 11);
      }
    });
  }
  function street(o) {
    var S = new THREE.Scene(), G = new THREE.Group(); S.add(G);
    S.background = new THREE.Color(0x070a16); S.fog = new THREE.FogExp2(0x0a1022, 0.011);
    S.add(new THREE.HemisphereLight(0x6070a0, 0x0a0a12, 0.55));
    var moonL = new THREE.DirectionalLight(0x9fb2e8, 0.6); moonL.position.set(-20, 30, 10); S.add(moonL);
    var roadMat = new THREE.MeshStandardMaterial({ map: tex("asphalt_" + RES.d, true, 1), normalMap: tex("asphalt_" + RES.n, false, 1), color: 0x8a8f9a, roughness: 0.42, metalness: 0.15 });
    var road = new THREE.Mesh(new THREE.PlaneGeometry(14, 420), roadMat); road.rotation.x = -Math.PI / 2; road.position.z = -150;
    road.material.map.repeat.set(4, 120); road.material.normalMap.repeat.set(4, 120); G.add(road);
    var side = new THREE.MeshStandardMaterial({ color: 0x1a1d26, roughness: 0.8 });
    [-1, 1].forEach(function (sx) { var sw = new THREE.Mesh(new THREE.BoxGeometry(5, 0.18, 420), side); sw.position.set(sx * 9.5, 0.09, -150); G.add(sw); });
    var paint = new THREE.MeshBasicMaterial({ color: 0xd8dde6 });
    for (var z = 8; z > -360; z -= 9) { var d = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 4), paint); d.rotation.x = -Math.PI / 2; d.position.set(0, 0.012, z); G.add(d); }
    [-6.6, 6.6].forEach(function (x) { var e = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 420), paint); e.rotation.x = -Math.PI / 2; e.position.set(x, 0.012, -150); G.add(e); });
    // 楼群
    var s = 3; function r() { s = (s * 16807) % 2147483647; return s / 2147483647; }
    var wt = [windowTex(11, true), windowTex(23, false), windowTex(37, true), windowTex(51, false)];
    for (var i = 0; i < 46; i++) {
      var sx = i % 2 ? 1 : -1, hgt = 12 + r() * 48, wd = 8 + r() * 8, z0 = 10 - Math.floor(i / 2) * 15 - r() * 4;
      var m = new THREE.MeshStandardMaterial({ color: 0x0d1220, emissive: 0xffffff, emissiveMap: wt[i % 4], emissiveIntensity: 0.6, roughness: 0.9 });
      m.emissiveMap = wt[i % 4].clone(); m.emissiveMap.wrapS = m.emissiveMap.wrapT = THREE.RepeatWrapping; m.emissiveMap.repeat.set(wd / 14, hgt / 26); m.emissiveMap.needsUpdate = true;
      var b = new THREE.Mesh(new THREE.BoxGeometry(wd, hgt, 12), m); b.position.set(sx * (15 + wd / 2 + r() * 4), hgt / 2, z0); G.add(b);
      if (r() < 0.35) { var nc = [0xff3b8d, 0x22d3ee, 0xa78bfa, 0xfbbf24][i % 4]; var sg = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 3 + r() * 3), new THREE.MeshBasicMaterial({ color: nc, toneMapped: false })); sg.position.set(sx * (14.4), 5 + r() * 4, z0 + 5); sg.rotation.y = sx > 0 ? -Math.PI / 2 : Math.PI / 2; G.add(sg); }
    }
    // 路灯
    var poleM = new THREE.MeshStandardMaterial({ color: 0x30343e, roughness: 0.5, metalness: 0.6 }), bulbM = new THREE.MeshBasicMaterial({ color: 0xfff1d6, toneMapped: false });
    var nL = 0;
    for (var zz = 2; zz > -300; zz -= 26) [-1, 1].forEach(function (sx) {
      var p = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 8, 10), poleM); p.position.set(sx * 7.6, 4, zz); G.add(p);
      var arm = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 0.08), poleM); arm.position.set(sx * 6.9, 7.9, zz); G.add(arm);
      var bl = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 8), bulbM); bl.position.set(sx * 6.2, 7.8, zz); G.add(bl);
      var gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, color: 0xffd9a0, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.8 })); gl.scale.setScalar(3.2); gl.position.copy(bl.position); G.add(gl);
      if (nL < (hi ? 8 : 4) && zz > -130) { var L = new THREE.PointLight(0xffd6a0, 40, 34, 1.6); L.position.set(sx * 6.2, 7.6, zz); G.add(L); nL++; }
    });
    o.scene = S; o.G = G; o.road = road; return o;
  }
  function car(col) {
    var g = new THREE.Group();
    var body = new THREE.MeshStandardMaterial({ color: col, roughness: 0.28, metalness: 0.7 });
    var glassM = new THREE.MeshStandardMaterial({ color: 0x0b1018, roughness: 0.1, metalness: 0.9 });
    var lo = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.62, 4.1), body); lo.position.y = 0.62; g.add(lo);
    var up = new THREE.Mesh(new THREE.BoxGeometry(1.56, 0.52, 2.1), glassM); up.position.set(0, 1.18, 0.25); g.add(up);
    var roof = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.06, 1.9), body); roof.position.set(0, 1.46, 0.25); g.add(roof);
    var tyre = new THREE.MeshStandardMaterial({ color: 0x0c0c0e, roughness: 0.9 });
    [[-0.86, 1.3], [0.86, 1.3], [-0.86, -1.3], [0.86, -1.3]].forEach(function (p) { var w = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.33, 0.24, 18), tyre); w.rotation.z = Math.PI / 2; w.position.set(p[0], 0.33, p[1]); g.add(w); });
    var tl = new THREE.MeshBasicMaterial({ color: 0xff2a2a, toneMapped: false });
    [-0.65, 0.65].forEach(function (x) { var t = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.14, 0.04), tl); t.position.set(x, 0.78, 2.06); g.add(t); });
    var gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, color: 0xff3030, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })); gl.scale.set(2.6, 1.0, 1); gl.position.set(0, 0.8, 2.15); g.add(gl);
    var hl = new THREE.SpotLight(0xeaf2ff, 60, 60, 0.5, 0.6, 1.4); hl.position.set(0, 0.8, -2.1); hl.target.position.set(0, 0, -20); g.add(hl); g.add(hl.target);
    g.userData = { tl: tl, gl: gl };
    return g;
  }

  /* ---------- ② 摩擦 ---------- */
  var F = street({});
  var carA = car(0x9aa3ad), carB = car(0x9aa3ad); F.G.add(carA); F.G.add(carB);
  var LANE = 3.3;
  carA.position.x = -LANE; carB.position.x = LANE;
  var iceMat = new THREE.MeshStandardMaterial({ color: 0xcfe9ff, roughness: 0.05, metalness: 0.2, transparent: true, opacity: 0.32, depthWrite: false });
  var iceLane = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 380), iceMat); iceLane.rotation.x = -Math.PI / 2; iceLane.position.set(LANE, 0.014, -170); F.G.add(iceLane);
  // 停止线 + 斑马线
  var stopG = new THREE.Group(); F.G.add(stopG);
  var white = new THREE.MeshBasicMaterial({ color: 0xf2f4f8 });
  var sl = new THREE.Mesh(new THREE.PlaneGeometry(13.2, 0.45), white); sl.rotation.x = -Math.PI / 2; sl.position.y = 0.016; stopG.add(sl);
  for (var k = -6; k <= 6; k += 1.1) { var zb = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 3.2), white); zb.rotation.x = -Math.PI / 2; zb.position.set(k, 0.016, -2.6); stopG.add(zb); }
  // 10 m 刻度
  var tickM = new THREE.MeshBasicMaterial({ color: 0x67e8f9, toneMapped: false, transparent: true, opacity: 0.85 });
  for (var d = 10; d <= 150; d += 10) { var tk = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.12), tickM); tk.rotation.x = -Math.PI / 2; tk.position.set(0, 0.02, -d); F.G.add(tk); }
  // 刹车痕
  var skidM = new THREE.MeshBasicMaterial({ color: 0x050505, transparent: true, opacity: 0.55, depthWrite: false });
  function skid() { var g = new THREE.Group(); [-0.86, 0.86].forEach(function (x) { var m = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 1), skidM); m.rotation.x = -Math.PI / 2; m.position.set(x, 0.018, 0); g.add(m); }); F.G.add(g); return g; }
  var skA = skid(), skB = skid();
  var camF = new THREE.PerspectiveCamera(46, 1, 0.1, 1200);
  function carZ(s, t) { if (t <= s.tr) return -s.v * t; var tb = Math.min(t - s.tr, s.tBrake), a = s.mu * 9.81; return -(s.react + s.v * tb - 0.5 * a * tb * tb); }
  function renderFriction(st, w, h, x0, y0) {
    var a = st.ev.a, b = st.ev.b;
    a.tr = st.A.tr; b.tr = st.B.tr;
    var env = st.envB || "dry";
    iceLane.visible = env !== "dry"; iceMat.color.set(env === "ice" ? 0xcfe9ff : 0x1c2a3a); iceMat.opacity = env === "ice" ? 0.34 : 0.45; iceMat.roughness = env === "ice" ? 0.03 : 0.08;
    stopG.position.z = -st.ev.line0;
    var t = st.t == null ? (st.revealed ? 1e9 : 0) : st.t * st.warp;
    [[carA, a, skA], [carB, b, skB]].forEach(function (q) {
      var z = carZ(q[1], t); q[0].position.z = z;
      var braking = t > q[1].tr && t < q[1].tTotal + 0.01;
      var on = t > q[1].tr;
      q[0].userData.tl.color.setScalar(1).setRGB(1, on ? 0.2 : 0.06, on ? 0.2 : 0.06); q[0].userData.gl.material.opacity = on ? 1 : 0.35;
      var zs = -q[1].react, len = Math.max(0.001, zs - z);
      q[2].visible = on && len > 0.2; q[2].position.set(q[0].position.x, 0, (zs + z) / 2 + 1.3);
      q[2].children.forEach(function (m) { m.scale.set(1, len, 1); });
      q[0].userData.braking = braking;
    });
    camF.aspect = w / h; camF.fov = w / h < 0.9 ? 62 : 44; camF.updateProjectionMatrix();
    camF.position.set(0, w / h < 0.9 ? 6.5 : 4.6, w / h < 0.9 ? 15 : 11); camF.lookAt(0, 0.6, -38);
    vp(x0, y0, w, h); renderer.render(F.scene, camF);
    lastCam = camF; lastSplit = 0;
  }

  /* ---------- ③ 声速 ---------- */
  var Snd = street({}); Snd.G.rotation.y = Math.PI / 2; Snd.G.position.set(150, 0, -2);   // 道路沿 x 轴
  Snd.scene.fog = new THREE.FogExp2(0x0a1022, 0.008);
  Snd.G.updateMatrixWorld(true);
  (function () { var v = new THREE.Vector3(); Snd.G.children.slice().forEach(function (m) { m.getWorldPosition(v); if (v.z > 5 && m !== Snd.road) m.visible = false; }); })();   // 侧视:去掉镜头这一侧的楼和路灯
  (function () { var gm = new THREE.MeshStandardMaterial({ map: tex("asphalt_" + RES.d, true, 1), color: 0x3a3f4a, roughness: 0.35, metalness: 0.2 }); var g = new THREE.Mesh(new THREE.PlaneGeometry(400, 60), gm); g.rotation.x = -Math.PI / 2; g.position.set(0, -0.01, 26); Snd.scene.add(g); })();   // 镜头这一侧的湿路面(挡住地面以下的半圈声波)
  var amb = (function () {
    var g = new THREE.Group();
    var sideT = canvasTex(THREE, 512, 256, function (c, w, h) {
      c.fillStyle = "#f4f5f7"; c.fillRect(0, 0, w, h);
      c.fillStyle = "#d81b2a"; c.fillRect(0, h * 0.52, w, h * 0.12);
      c.fillStyle = "#1e40af"; c.fillRect(0, h * 0.66, w, h * 0.04);
      c.fillStyle = "#d81b2a"; c.fillRect(w * 0.6, h * 0.12, w * 0.06, h * 0.34); c.fillRect(w * 0.6 - w * 0.06, h * 0.12 + h * 0.11, w * 0.18, h * 0.12);
      c.fillStyle = "#1f2937"; for (var i = 0; i < 2; i++) c.fillRect(w * (0.08 + i * 0.16), h * 0.14, w * 0.12, h * 0.26);
    });
    var bodyM = new THREE.MeshStandardMaterial({ map: sideT, roughness: 0.35, metalness: 0.2 });
    var white = new THREE.MeshStandardMaterial({ color: 0xf4f5f7, roughness: 0.35, metalness: 0.2 });
    var box = new THREE.Mesh(new THREE.BoxGeometry(4.0, 2.4, 2.2), [white, white, white, white, bodyM, bodyM]); box.position.set(-0.6, 1.55, 0); g.add(box);
    var cab = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.7, 2.1), white); cab.position.set(2.1, 1.2, 0); g.add(cab);
    var ws = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.75, 1.9), new THREE.MeshStandardMaterial({ color: 0x0b1018, roughness: 0.1, metalness: 0.9 })); ws.position.set(2.91, 1.55, 0); g.add(ws);
    var tyre = new THREE.MeshStandardMaterial({ color: 0x0c0c0e, roughness: 0.9 });
    [[-1.8, 1], [-1.8, -1], [1.9, 1], [1.9, -1]].forEach(function (p) { var w = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.28, 18), tyre); w.rotation.x = Math.PI / 2; w.position.set(p[0], 0.42, p[1]); g.add(w); });
    var red = new THREE.MeshBasicMaterial({ color: 0xff2030, toneMapped: false }), blue = new THREE.MeshBasicMaterial({ color: 0x3060ff, toneMapped: false });
    var lr = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.18, 0.5), red); lr.position.set(1.0, 2.85, 0.5); g.add(lr);
    var lb = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.18, 0.5), blue); lb.position.set(1.0, 2.85, -0.5); g.add(lb);
    var gr = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, color: 0xff2030, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })); gr.scale.setScalar(4); gr.position.copy(lr.position); g.add(gr);
    var gb = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, color: 0x3060ff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })); gb.scale.setScalar(4); gb.position.copy(lb.position); g.add(gb);
    var pl = new THREE.PointLight(0xff2030, 30, 20, 1.5); pl.position.set(1, 3.2, 0); g.add(pl);
    g.userData = { gr: gr, gb: gb, pl: pl };
    return g;
  })();
  Snd.scene.add(amb);
  var person = (function () {
    var g = new THREE.Group(), m = new THREE.MeshStandardMaterial({ color: 0x14161c, roughness: 0.8 });
    var b = new THREE.Mesh(new THREE.CapsuleGeometry(0.26, 0.9, 6, 12), m); b.position.y = 1.15; g.add(b);
    var hd = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), m); hd.position.y = 1.86; g.add(hd);
    [-0.12, 0.12].forEach(function (x) { var l = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.6, 4, 8), m); l.position.set(x, 0.4, 0); g.add(l); });
    return g;
  })();
  var LISTEN_X = 13; person.position.set(LISTEN_X, 0, 3.2); Snd.scene.add(person);
  var earGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, color: 0x67e8f9, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, opacity: 0 })); earGlow.scale.setScalar(3); earGlow.position.set(LISTEN_X, 1.8, 3.2); Snd.scene.add(earGlow);
  // 声波:平面 + 着色器画圆环(前方青、后方橙),不随半径变粗
  var ringGeo = new THREE.PlaneGeometry(2, 2);
  var ringMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
    uniforms: { uR: { value: 1 }, uW: { value: 0.12 }, uA: { value: 1 } },
    vertexShader: "varying vec2 vP; uniform float uR; void main(){ vP = position.xy * uR; gl_Position = projectionMatrix * modelViewMatrix * vec4(position.xy * uR, 0.0, 1.0); }",
    fragmentShader: "varying vec2 vP; uniform float uR; uniform float uW; uniform float uA; void main(){ float d = abs(length(vP) - uR); float a = 1.0 - smoothstep(0.0, uW, d); a += 0.35 * (1.0 - smoothstep(0.0, uW * 5.0, d)); float f = clamp(vP.x / max(uR, 0.001) * 0.5 + 0.5, 0.0, 1.0); vec3 c = mix(vec3(1.0, 0.62, 0.22), vec3(0.25, 0.95, 1.0), f); gl_FragColor = vec4(c * 1.15, a * uA * 0.85); }"
  });
  var rings = [];
  for (var ri = 0; ri < 60; ri++) { var rm = new THREE.Mesh(ringGeo, ringMat.clone()); rm.visible = false; rm.frustumCulled = false; Snd.scene.add(rm); rings.push({ m: rm, x: 0, t0: 0, on: false }); }
  var camS = new THREE.PerspectiveCamera(40, 1, 0.1, 1500);
  var sndClock = 0, sndLast = -1, sndKey = "", sndHeard = 0, emitAcc = 0;
  var SX0 = -15, SX1 = 22;
  function renderSound(st, w, h, x0, y0, dt) {
    var P = st.side === "a" ? st.A : st.B, c = P.c, v = P.v;
    var key = st.side + "|" + c + "|" + v + "|" + (st.runId || 0);
    if (key !== sndKey) { sndKey = key; sndClock = 0; emitAcc = 0; sndHeard = 0; rings.forEach(function (r) { r.on = false; r.m.visible = false; }); }
    var k = 7 / Math.max(c, v, 1);                                    // 显示速度:较快的一方 ≈ 7 m/s(比例不变)
    var cD = c * k, vD = v * k, run = st.t != null || !st.rm;
    if (run) sndClock += dt;
    var span = (SX1 - SX0) / Math.max(vD, 0.4), tl = sndClock % (span + 3);
    var sx = SX0 + vD * Math.min(tl, span);
    if (tl < dt * 1.5 && sndClock > dt * 2) { rings.forEach(function (r) { r.on = false; r.m.visible = false; }); sndHeard = 0; }
    amb.position.set(sx, 0, -0.6);
    var fl = Math.sin(sndClock * 14) > 0;
    amb.userData.gr.material.opacity = fl ? 1 : 0.15; amb.userData.gb.material.opacity = fl ? 0.15 : 1; amb.userData.pl.color.set(fl ? 0xff2030 : 0x3060ff);
    if (run && tl <= span) { emitAcc += dt; if (emitAcc > 0.16) { emitAcc = 0; var r0 = rings.find(function (r) { return !r.on; }) || rings.reduce(function (a, b) { return a.t0 < b.t0 ? a : b; }); r0.on = true; r0.x = sx + 1.2; r0.t0 = sndClock; } }
    var heard = false;
    rings.forEach(function (r) {
      if (!r.on) return; var R = cD * (sndClock - r.t0);
      if (R > 60) { r.on = false; r.m.visible = false; return; }
      r.m.visible = true; r.m.position.set(r.x, 2.2, -0.6); r.m.material.uniforms.uR.value = Math.max(R, 0.01); r.m.material.uniforms.uW.value = 0.07 + R * 0.002;
      r.m.material.uniforms.uA.value = Math.max(0, 1 - R / 60) * 0.9;
      var dl = Math.hypot(LISTEN_X - r.x, 1.6 - 2.2, 3.8); if (Math.abs(R - dl) < cD * dt * 1.6) heard = true;
    });
    if (heard) sndHeard = 1;
    sndHeard = Math.max(0, sndHeard - dt * 1.5);
    earGlow.material.opacity = sndHeard; earGlow.material.color.set(P.v > P.c ? 0xfbbf24 : 0x67e8f9); earGlow.scale.setScalar(P.v > P.c ? 3 + 4 * sndHeard : 3);
    var por = w / h < 0.9;
    camS.aspect = w / h; camS.fov = por ? 60 : 40; camS.updateProjectionMatrix();
    camS.position.set(por ? 6 : 4, por ? 4.5 : 3.2, por ? 40 : 24); camS.lookAt(por ? 6 : 4, por ? 5.5 : 3.4, 0);
    vp(x0, y0, w, h); renderer.render(Snd.scene, camS);
    lastCam = camS; lastSplit = 0;
    return { heard: sndHeard > 0.5, x: sx };
  }

  /* ================= ④ 光速 · ⑤ 潮汐(深空,按需构建) ================= */
  var TIDE_ASSET = new URL("../assets/tide/", import.meta.url).href;
  function texAt(base, name, srgb) {
    var key = base + name; if (cache[key]) return cache[key]; pending++;
    var t = loader.load(base + name + ".jpg", function () { pending--; }, undefined, function () { pending--; if (W.console) console.warn("[nv.lab] 贴图加载失败:", name); });
    t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.anisotropy = ANISO; cache[key] = t; return t;
  }
  function spaceScene() {
    var S = new THREE.Scene();
    var sky = new THREE.Mesh(new THREE.SphereGeometry(800, 48, 24), new THREE.MeshBasicMaterial({ side: THREE.BackSide, depthWrite: false, map: tex("sky_space_" + RES.sky, true) }));
    sky.material.color.setScalar(0.55); S.add(sky);
    S.add(new THREE.AmbientLight(0x5a6688, 0.9));
    var sun = new THREE.DirectionalLight(0xfff4e6, 2.6); sun.position.set(-4, 7, 16); S.add(sun);
    return S;
  }
  function planet(r, map, col) { return new THREE.Mesh(new THREE.SphereGeometry(r, 64, 40), new THREE.MeshStandardMaterial({ map: map || null, color: col || 0xffffff, roughness: 0.92, metalness: 0 })); }
  var marsTex = null;
  function marsMap() {
    if (marsTex) return marsTex;
    marsTex = canvasTex(THREE, 1024, 512, function (c, w, h) {
      var g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#e9d7c6"); g.addColorStop(0.08, "#c26a3c"); g.addColorStop(0.5, "#b4552e"); g.addColorStop(0.92, "#a8613f"); g.addColorStop(1, "#efe2d4"); c.fillStyle = g; c.fillRect(0, 0, w, h);
      var s = 11; function r() { s = (s * 16807) % 2147483647; return s / 2147483647; }
      for (var i = 0; i < 260; i++) { var x = r() * w, y = h * (0.12 + 0.76 * r()), rr = 6 + r() * 60; c.fillStyle = r() < 0.5 ? "rgba(90,35,20,.22)" : "rgba(230,150,100,.16)"; c.beginPath(); c.ellipse(x, y, rr * 1.8, rr, 0, 0, 7); c.fill(); }
    });
    marsTex.colorSpace = THREE.SRGBColorSpace; return marsTex;
  }

  var Lt = null;
  function lightInit() {
    var S = spaceScene(), o = { scene: S };
    o.earth = planet(2.6, tex("planet_earth_" + RES.planet, true)); o.earth.position.set(-9, 0, 0); S.add(o.earth);
    o.moon = planet(1.4, texAt(TIDE_ASSET, "moon_2k", true)); S.add(o.moon);
    o.mars = planet(1.9, marsMap()); S.add(o.mars);
    o.city = new THREE.Group();
    var tw = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.4, metalness: 0.6 });
    var mast = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.16, 3, 8), tw); o.city.add(mast);
    var dish = new THREE.Mesh(new THREE.SphereGeometry(0.55, 24, 12, 0, Math.PI * 2, 0, 1.0), new THREE.MeshStandardMaterial({ color: 0xe2e8f0, side: THREE.DoubleSide, roughness: 0.35, metalness: 0.4 }));
    dish.rotation.z = Math.PI / 2; dish.position.set(-0.3, 1.2, 0); o.city.add(dish);
    S.add(o.city);
    o.beamMat = new THREE.MeshBasicMaterial({ color: 0x67e8f9, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
    o.beam = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1, 8), o.beamMat); o.beam.rotation.z = Math.PI / 2; S.add(o.beam);
    o.doneMat = o.beamMat.clone(); o.done = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1, 8), o.doneMat); o.done.rotation.z = Math.PI / 2; S.add(o.done);
    o.pulse = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })); o.pulse.scale.setScalar(1.6); S.add(o.pulse);
    o.flash = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })); S.add(o.flash);
    o.cam = new THREE.PerspectiveCamera(36, 1, 0.1, 2000);
    return o;
  }
  function lightLane(o, L, env, k, col) {
    var X1 = 9, tgt = env === "moon" || env === "mars" ? env : "city";
    o.moon.visible = tgt === "moon"; o.mars.visible = tgt === "mars"; o.city.visible = tgt === "city";
    o.moon.position.set(X1, 0, 0); o.mars.position.set(X1, 0, 0); o.city.position.set(X1, -1.4, 0);
    var x0 = -9 + 2.7, x1 = X1 - (tgt === "moon" ? 1.5 : tgt === "mars" ? 2.0 : 0.5), len = x1 - x0, px = x0 + len * k;
    o.beam.scale.set(1, len, 1); o.beam.position.set((x0 + x1) / 2, 0, 0); o.beamMat.color.set(col);
    o.done.visible = k > 0.002; o.done.scale.set(1, Math.max(0.001, len * k), 1); o.done.position.set(x0 + len * k / 2, 0, 0); o.doneMat.color.set(col); o.doneMat.opacity = 0.75;
    o.pulse.visible = k > 0.002 && k < 0.999; o.pulse.position.set(px, 0, 0); o.pulse.material.color.set(col);
    o.flash.visible = k >= 0.999; o.flash.position.set(X1 - (tgt === "city" ? 0.3 : 0), tgt === "city" ? -0.2 : 0, 0.5); o.flash.material.color.set(col); o.flash.scale.setScalar(tgt === "city" ? 2.6 : 5.2);
  }
  function renderLight(st, w, h, x0, y0, dt) {
    if (!Lt) Lt = lightInit();
    var a = st.ev.a, b = st.ev.b, mx = Math.max(a.t, b.t), dur = 4;
    function kk(t1) { if (st.t == null) return st.revealed ? 1 : 0; return Math.min(1, st.t / Math.max(0.05, dur * t1 / mx)); }
    var kA = kk(a.t), kB = kk(b.t);
    Lt.earth.rotation.y += dt * 0.12; Lt.moon.rotation.y += dt * 0.03; Lt.mars.rotation.y += dt * 0.05;
    var pad = w < 560 ? 70 : 0, hh = Math.floor((h - pad) / 2), por = w / hh < 1.2;   // 手机:让出顶栏
    Lt.cam.aspect = w / hh; Lt.cam.fov = por ? 70 : 34; Lt.cam.updateProjectionMatrix();
    Lt.cam.position.set(0, 1.2, por ? 15 : 30); Lt.cam.lookAt(0, por ? 0.4 : 0.6, 0);
    var envA = a.d > 1e7 ? "mars" : a.d > 1e5 ? "moon" : "city", envB = b.d > 1e7 ? "mars" : b.d > 1e5 ? "moon" : "city";
    lightLane(Lt, a, envA, kA, 0x67e8f9); vp(x0, y0 + pad, w, hh); renderer.render(Lt.scene, Lt.cam);
    lightLane(Lt, b, envB, kB, 0xfbbf24); vp(x0, y0 + pad + hh, w, h - pad - hh); renderer.render(Lt.scene, Lt.cam);
    lastCam = Lt.cam; lastSplit = 0;
    return { kA: kA, kB: kB };
  }

  var Td = null, TIDE_RE = 2;
  function tdisp(dm) { return TIDE_RE * Math.pow(dm / 6.371e6, 0.55); }
  function tideInit() {
    var mk = function () {
      var S = spaceScene(), o = { scene: S };
      o.earth = planet(TIDE_RE, tex("planet_earth_" + RES.planet, true)); S.add(o.earth);
      o.sea = new THREE.Mesh(new THREE.SphereGeometry(TIDE_RE * 1.015, 64, 40), new THREE.MeshStandardMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.42, roughness: 0.15, metalness: 0.1, depthWrite: false })); S.add(o.sea);
      o.moon = planet(0.54, texAt(TIDE_ASSET, "moon_2k", true)); S.add(o.moon);
      var rp = []; for (var i = 0; i <= 128; i++) { var q = i / 128 * Math.PI * 2; rp.push(new THREE.Vector3(Math.cos(q), 0, Math.sin(q))); }
      o.roche = new THREE.Line(new THREE.BufferGeometry().setFromPoints(rp), new THREE.LineDashedMaterial({ color: 0xf87171, dashSize: 0.06, gapSize: 0.05, transparent: true, opacity: 0.85 })); o.roche.computeLineDistances(); S.add(o.roche);
      o.orbit = new THREE.Line(new THREE.BufferGeometry().setFromPoints(rp), new THREE.LineBasicMaterial({ color: 0xa78bfa, transparent: true, opacity: 0.25 })); S.add(o.orbit);
      var n = 2200, pp = new Float32Array(n * 3), s2 = 5; function r() { s2 = (s2 * 16807) % 2147483647; return s2 / 2147483647; }
      for (var j = 0; j < n; j++) { var q2 = r() * Math.PI * 2, rr = 1 + (r() - 0.5) * 0.22; pp[j * 3] = Math.cos(q2) * rr; pp[j * 3 + 1] = (r() - 0.5) * 0.02; pp[j * 3 + 2] = Math.sin(q2) * rr; }
      var pg = new THREE.BufferGeometry(); pg.setAttribute("position", new THREE.BufferAttribute(pp, 3));
      o.ring = new THREE.Points(pg, new THREE.PointsMaterial({ color: 0xd6d3d1, size: 0.05, sizeAttenuation: true, transparent: true, opacity: 0.9 })); S.add(o.ring);
      o.cam = new THREE.PerspectiveCamera(40, 1, 0.1, 2000);
      return o;
    };
    return { A: mk(), B: mk(), ang: 0 };
  }
  function tideView(o, T, ang, hidePre) {
    var D = tdisp(T.d), R = tdisp(T.roche), e = hidePre ? 0.05 : Math.min(0.42, 0.045 + 0.08 * Math.log10(1 + T.range / 0.5352));
    o.earth.rotation.y += 0.002;
    o.sea.scale.set(1 + e, 1 - e * 0.35, 1 - e * 0.35); o.sea.rotation.set(0, -ang, 0);
    o.moon.visible = !T.broken || hidePre; o.moon.scale.setScalar(Math.cbrt(T.m)); o.moon.position.set(Math.cos(ang) * D, 0, -Math.sin(ang) * D); o.moon.rotation.y = -ang + Math.PI;
    o.ring.visible = T.broken && !hidePre; o.ring.scale.set(D, 1, D); o.ring.rotation.y = -ang * 1.6;
    o.roche.scale.set(R, 1, R); o.orbit.scale.set(D, 1, D);
    return D;
  }
  function renderTide(st, w, h, x0, y0, dt) {
    if (!Td) Td = tideInit();
    Td.ang += dt * (st.t != null ? 0.9 : 0.18);
    var a = st.ev.a, b = st.ev.b, hide = !st.revealed && st.t == null;
    var split = w > 560, half = split ? Math.floor(w / 2) : w;
    var dA = tideView(Td.A, a, Td.ang, false), dB = tideView(Td.B, b, Td.ang, hide);
    function cam(o, dd, ww, shift) { var por = ww / h < 0.9, f = Math.max(dd, TIDE_RE * 2.4) * (por ? 2.5 : 2.0) + 3; o.cam.aspect = ww / h; o.cam.fov = por ? 52 : 40; o.cam.position.set(0, f * 0.62, f * 0.9); o.cam.lookAt(0, -0.5, 0);
      if (shift) o.cam.setViewOffset(ww, h, shift, 0, ww, h); else o.cam.clearViewOffset(); o.cam.updateProjectionMatrix(); }
    if (split) {
      var sh = st.wide ? Math.round(half * 0.2) : 0;     // 桌面两侧有面板:A 往右让、B 往左让
      cam(Td.A, dA, half, -sh); cam(Td.B, dB, w - half, sh);
      vp(x0, y0, half, h); renderer.render(Td.A.scene, Td.A.cam);
      vp(x0 + half, y0, w - half, h); renderer.render(Td.B.scene, Td.B.cam);
    } else { var o = st.side === "a" ? Td.A : Td.B; cam(o, st.side === "a" ? dA : dB, w, 0); vp(x0, y0, w, h); renderer.render(o.scene, o.cam); }
    lastCam = Td.B.cam; lastSplit = split ? half : 0;
    return null;
  }

  /* ================= 通用 ================= */
  var state = { W: 1, H: 1 }, lastCam = null, lastSplit = 0;
  function vp(x, y, w, h) { var Y = state.H - y - h; renderer.setViewport(x, Y, w, h); renderer.setScissor(x, Y, w, h); renderer.setScissorTest(true); }
  function resize(w, h) { state.W = w; state.H = h; renderer.setSize(w, h, false); }
  var V3 = new THREE.Vector3();
  return {
    resize: resize,
    get loading() { return pending > 0; },
    render: function (st, dt) {
      if (disposed) return null;
      var R = st.rect || { x: 0, y: 0, w: state.W, h: state.H };
      renderer.setScissorTest(false); renderer.setViewport(0, 0, state.W, state.H); renderer.clear();
      if (st.lab === "gravity") renderGravity(st, R.w, R.h, R.x, R.y);
      else if (st.lab === "friction") renderFriction(st, R.w, R.h, R.x, R.y);
      else if (st.lab === "light") return renderLight(st, R.w, R.h, R.x, R.y, dt);
      else if (st.lab === "tide") return renderTide(st, R.w, R.h, R.x, R.y, dt);
      else return renderSound(st, R.w, R.h, R.x, R.y, dt);
      return null;
    },
    /* 3D 点 → 舞台像素(左半屏;重力右半屏另加 half) */
    proj: function (x, y, z, right) {
      if (!lastCam) return null; V3.set(x, y, z).project(lastCam);
      var R = state.rect || null;
      return [(V3.x * 0.5 + 0.5), (-V3.y * 0.5 + 0.5), V3.z < 1];
    },
    carPos: function () { return [carA.position.clone(), carB.position.clone()]; },
    dispose: function () { disposed = true; renderer.dispose(); }
  };
}
