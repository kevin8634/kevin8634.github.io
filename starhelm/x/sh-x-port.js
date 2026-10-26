/* 天枢 Starhelm · 2.0 穿梭 C1.0 · sh-x-port.js(SHXPORT)
 * 侧舷窗全景舱(王磊 10-27 00:52 确认方案 C2:无中柱单一超宽窗、近景、幽蓝荧光、Armilla + 控制台 + 按钮)。
 * 实时 3D:独立透明 WebGLRenderer 叠在驾驶舱主场景之上,只画舱壁、窗框、顶部灯带、窗台控制台、反光地面;
 * 窗洞透明,窗外就是主场景里的真实星空与星球(不用概念图做素材)。
 * 鼠标 / 转向带视差;减少动态时静止;页面隐藏或离开侧舷窗时停止渲染;无 WebGL 时退回原 CSS 舷窗。 */
(function () {
  'use strict';
  if (!window.SHXC) return;
  var X = SHXC, I = X._, T = null;
  var P = { on: false, ok: null, R: null, host: null, gl: null, scene: null, cam: null, grp: null, raf: 0, t: 0, lt: 0, mx: 0, my: 0, px: 0, py: 0, key: '', btns: null, glass: null, sheen: null, hud: null };
  function reduced() { return matchMedia('(prefers-reduced-motion: reduce)').matches; }
  function mobile() { return innerWidth < 700 || innerHeight < 480; }
  function canGL() {
    T = window.THREE; if (!T || !T.WebGLRenderer || !T.ExtrudeGeometry) return false;
    try { var c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; }
  }
  function rr(path, x, y, w, h, r) { // 圆角矩形(左下角 x,y)
    path.moveTo(x + r, y); path.lineTo(x + w - r, y); path.quadraticCurveTo(x + w, y, x + w, y + r);
    path.lineTo(x + w, y + h - r); path.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    path.lineTo(x + r, y + h); path.quadraticCurveTo(x, y + h, x, y + h - r);
    path.lineTo(x, y + r); path.quadraticCurveTo(x, y, x + r, y); return path;
  }
  function ring(cx, cy, w, h, r, t) { // 圆角矩形环:外框 w+2t,内洞 w
    var s = rr(new T.Shape(), cx - w / 2 - t, cy - h / 2 - t, w + 2 * t, h + 2 * t, r + t);
    s.holes.push(rr(new T.Path(), cx - w / 2, cy - h / 2, w, h, r)); return s;
  }
  function tex(w, h, draw) { var c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); var t = new T.CanvasTexture(c); if (T.SRGBColorSpace) t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4; return t; }
  function glowTex() {
    return tex(128, 128, function (g) { var r = g.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.3, 'rgba(255,255,255,.35)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 128, 128); });
  }
  // 舱壁面板:深靛金属 + 斜切分缝 + 浅六边形纹(程序绘制)
  function wallTex() {
    return tex(1024, 512, function (g, w, h) {
      var bg = g.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#1a1e36'); bg.addColorStop(.5, '#20264a'); bg.addColorStop(1, '#151a30'); g.fillStyle = bg; g.fillRect(0, 0, w, h);
      g.strokeStyle = 'rgba(140,160,230,.07)'; g.lineWidth = 1; var s = 14;
      for (var y = 0; y < h + s; y += s * 1.5) for (var x = 0; x < w + s * 2; x += s * 1.732) { var ox = ((y / (s * 1.5)) % 2) ? s * .866 : 0; g.beginPath(); for (var k = 0; k < 6; k++) { var a = Math.PI / 3 * k + Math.PI / 6; g.lineTo(x + ox + s * .55 * Math.cos(a), y + s * .55 * Math.sin(a)); } g.closePath(); g.stroke(); }
      g.strokeStyle = 'rgba(4,6,14,.85)'; g.lineWidth = 3; [[0, .18, .34, .18, .4, .1], [.6, .1, .66, .18, 1, .18], [0, .86, .3, .86, .36, .94], [.64, .94, .7, .86, 1, .86]].forEach(function (L) { g.beginPath(); g.moveTo(L[0] * w, L[1] * h); g.lineTo(L[2] * w, L[3] * h); g.lineTo(L[4] * w, L[5] * h); g.stroke(); });
      g.strokeStyle = 'rgba(232,194,122,.22)'; g.lineWidth = 1.2; [[.34, .18, .4, .1], [.6, .1, .66, .18], [.3, .86, .36, .94], [.64, .94, .7, .86]].forEach(function (L) { g.beginPath(); g.moveTo(L[0] * w, L[1] * h); g.lineTo(L[2] * w, L[3] * h); g.stroke(); });
    });
  }
  // 窗玻璃上的全息角标(左上雷达、右上曲线、扫描线)
  function hudTex(aspect) {
    var W = 2048, H = Math.round(2048 / aspect);
    return tex(W, H, function (g, w, h) {
      g.clearRect(0, 0, w, h); g.strokeStyle = 'rgba(127,214,255,.55)'; g.fillStyle = 'rgba(127,214,255,.55)'; g.lineWidth = 2;
      var m = w * .025, L = w * .04;
      [[m, m, 1, 1], [w - m, m, -1, 1], [m, h - m, 1, -1], [w - m, h - m, -1, -1]].forEach(function (c) { g.beginPath(); g.moveTo(c[0], c[1] + c[3] * L); g.lineTo(c[0], c[1]); g.lineTo(c[0] + c[2] * L, c[1]); g.stroke(); });
      var rx = m + w * .045, ry = m + h * .1, rd = Math.min(w * .03, h * .07);
      g.globalAlpha = .7; g.beginPath(); g.arc(rx, ry, rd, 0, 7); g.stroke(); g.beginPath(); g.arc(rx, ry, rd * .55, 0, 7); g.stroke();
      g.beginPath(); g.moveTo(rx - rd * 1.2, ry); g.lineTo(rx + rd * 1.2, ry); g.moveTo(rx, ry - rd * 1.2); g.lineTo(rx, ry + rd * 1.2); g.stroke();
      g.font = Math.round(h * .022) + 'px Orbitron, system-ui, sans-serif';
      g.fillText('PANORAMA · OBS', rx + rd * 1.5, ry - rd * .45); g.globalAlpha = .45; for (var i = 0; i < 3; i++) g.fillRect(rx + rd * 1.5, ry - rd * .1 + i * h * .02, w * (.05 - i * .012), 2);
      var gx = w - m - w * .13, gy = m + h * .06, gw = w * .11, gh = h * .1; g.globalAlpha = .6; g.strokeRect(gx, gy, gw, gh);
      g.beginPath(); for (var k = 0; k <= 40; k++) { var xx = gx + gw * k / 40, yy = gy + gh * (.55 - .25 * Math.sin(k * .45) * Math.cos(k * .13)); if (k) g.lineTo(xx, yy); else g.moveTo(xx, yy); } g.stroke();
      g.globalAlpha = .45; g.fillText('ARMILLA · AUTO', gx, gy + gh + h * .03);
      g.globalAlpha = .12; g.fillRect(w * .22, h * .2, w * .56, 2); g.fillRect(w * .22, h * .78, w * .56, 2);
    });
  }
  function sheenTex() {
    return tex(512, 64, function (g, w, h) { var gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, 'rgba(160,210,255,0)'); gr.addColorStop(.5, 'rgba(160,210,255,1)'); gr.addColorStop(1, 'rgba(160,210,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
  }

  function mount() {
    P.R = I.root(); P.host = P.R && P.R.querySelector('#xs-port'); if (!P.host) return false;
    if (P.ok === false) return false; if (P.gl) return true;
    if (!canGL()) { P.ok = false; return false; }
    try {
      var g = P.gl = new T.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
      g.setClearColor(0, 0); g.domElement.className = 'xs-port-gl';
      if (T.ACESFilmicToneMapping) { g.toneMapping = T.ACESFilmicToneMapping; g.toneMappingExposure = 1.05; }
      P.host.insertBefore(g.domElement, P.host.firstChild);
      P.scene = new T.Scene(); P.cam = new T.PerspectiveCamera(50, 1, .1, 200);
      P.scene.add(new T.HemisphereLight(0x8fb4ff, 0x10131f, .9));
      var key = new T.DirectionalLight(0xbcd6ff, 1.1); key.position.set(0, 2, -6); P.scene.add(key); // 窗外星光
      var fill = new T.DirectionalLight(0x6f7fc8, .5); fill.position.set(0, 3, 8); P.scene.add(fill);
      P.ok = true; P.host.classList.add('gl');
      addEventListener('pointermove', function (e) { P.mx = e.clientX / innerWidth * 2 - 1; P.my = e.clientY / innerHeight * 2 - 1; }, { passive: true });
      addEventListener('resize', function () { if (P.on) layout(); });
      document.addEventListener('visibilitychange', function () { if (!document.hidden && P.on) loop(); });
      g.domElement.addEventListener('webglcontextlost', function (e) { e.preventDefault(); P.ok = false; P.host.classList.remove('gl'); stop(); });
      return true;
    } catch (e) { console.warn('[侧舷窗 3D]', e); P.ok = false; if (P.host) P.host.classList.remove('gl'); return false; }
  }

  function dispose(o) { o.traverse(function (n) { if (n.geometry) n.geometry.dispose(); if (n.material) { var ms = [].concat(n.material); ms.forEach(function (m) { if (m.map) m.map.dispose(); m.dispose(); }); } }); }

  // 依视口重建舱体(视口 = 相机在 z=0 平面看到的范围)
  function layout() {
    var w = innerWidth, h = innerHeight, mob = mobile(), k = w + 'x' + h + (mob ? 'm' : '');
    P.gl.setPixelRatio(Math.min(devicePixelRatio || 1, mob ? 1.5 : 2)); P.gl.setSize(w, h, false);
    P.cam.aspect = w / h; P.cam.updateProjectionMatrix();
    if (P.key === k && P.grp) return; P.key = k;
    if (P.grp) { P.scene.remove(P.grp); dispose(P.grp); }
    var G = P.grp = new T.Group(); P.scene.add(G);
    var D = 10, vh = 2 * D * Math.tan(25 * Math.PI / 180), vw = vh * w / h, u = vh / h; // u = 每像素世界长度
    P.cam.position.set(0, 0, D); P.cam.lookAt(0, 0, 0); P.D = D;
    // 窗洞:顶 ~11%,底留给窗台 + 控制台 + Armilla
    var botPx = mob ? 118 : Math.max(150, h * .2), topPx = mob ? Math.max(46, h * .08) : Math.max(64, h * .1);
    var wy0 = -vh / 2 + botPx * u, wy1 = vh / 2 - topPx * u, WH = wy1 - wy0, WW = Math.min(vw * (mob ? .96 : .935), vw - 24 * u), cy = (wy0 + wy1) / 2, rad = Math.min(WH, WW) * .07;
    P.win = { w: WW, h: WH, cy: cy };
    // 舱壁(带圆角窗洞),比视口大,视差时不露边
    var wt = wallTex(); wt.wrapS = wt.wrapT = T.RepeatWrapping;
    var big = rr(new T.Shape(), -vw, -vh, vw * 2, vh * 2, 0); big.holes.push(rr(new T.Path(), -WW / 2, cy - WH / 2, WW, WH, rad));
    var wg = new T.ShapeGeometry(big, 24), pos = wg.attributes.position, uv = wg.attributes.uv;
    for (var i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) + vw) / (vw * 2) * 2, (pos.getY(i) + vh) / (vh * 2) * 1.6);
    G.add(new T.Mesh(wg, new T.MeshStandardMaterial({ map: wt, color: 0xbfc6ff, metalness: .55, roughness: .5 })));
    // 窗框:斜切金属外框(Extrude)
    var fr = new T.ExtrudeGeometry(ring(0, cy, WW, WH, rad, Math.min(.22, WW * .025)), { depth: .14, bevelEnabled: true, bevelThickness: .05, bevelSize: Math.min(.05, WW * .006), bevelSegments: 3, curveSegments: 24 });
    var frm = new T.Mesh(fr, new T.MeshStandardMaterial({ color: 0x1a2038, metalness: .9, roughness: .4 })); frm.position.z = .01; G.add(frm);
    // 内沿幽蓝荧光 + 外沿细金线
    var add = { transparent: true, blending: T.AdditiveBlending, depthWrite: false };
    var rim = new T.Mesh(new T.ShapeGeometry(ring(0, cy, WW, WH, rad, .035), 24), new T.MeshBasicMaterial(Object.assign({ color: 0x5fd0ff, opacity: .85 }, add))); rim.position.z = .3; G.add(rim);
    var rim2 = new T.Mesh(new T.ShapeGeometry(ring(0, cy, WW + .02, WH + .02, rad, .14), 24), new T.MeshBasicMaterial(Object.assign({ color: 0x2f7fd0, opacity: .22 }, add))); rim2.position.z = .29; G.add(rim2);
    var gold = new T.Mesh(new T.ShapeGeometry(ring(0, cy, WW + .64, WH + .64, rad + .3, .012), 24), new T.MeshBasicMaterial({ color: 0xc9a46a, transparent: true, opacity: .5 })); gold.position.z = .02; G.add(gold);
    // 顶部灯带
    var ly = vh / 2 - Math.max(20, topPx * .42) * u;
    var strip = new T.Mesh(new T.BoxGeometry(vw * 1.4, .045, .04), new T.MeshBasicMaterial({ color: 0x8fe8ff })); strip.position.set(0, ly, .25); G.add(strip);
    var gt = glowTex(), halo = new T.Mesh(new T.PlaneGeometry(vw * 1.5, .9), new T.MeshBasicMaterial(Object.assign({ map: gt, color: 0x3fb8ff, opacity: .55 }, add))); halo.position.set(0, ly, .24); G.add(halo);
    P.strip = halo;
    // 窗台(由窗底向镜头伸出)
    var sillT = .14, sillD = 2.2, sill = new T.Mesh(new T.BoxGeometry(WW + .9, sillT, sillD), new T.MeshStandardMaterial({ color: 0x232a48, metalness: .8, roughness: .35 }));
    sill.position.set(0, wy0 - .26 - sillT / 2, sillD / 2); G.add(sill);
    var lip = new T.Mesh(new T.BoxGeometry(WW + .9, .018, .02), new T.MeshBasicMaterial({ color: 0x5fd0ff, transparent: true, opacity: .6 })); lip.position.set(0, wy0 - .26, sillD); G.add(lip);
    // 控制台:斜面台 + 两组按钮 + 中央 Armilla 托盘
    var cw = Math.min(WW * (mob ? .7 : .34), vw * .8), ch = mob ? .34 : .42, cd = 1.05, cz = sillD - .25;
    var cy0 = wy0 - .26 + ch / 2 - .02;
    var cbox = new T.Mesh(new T.BoxGeometry(cw, ch, cd, 1, 1, 1), new T.MeshStandardMaterial({ color: 0x161b30, metalness: .7, roughness: .3 })); cbox.position.set(0, cy0, cz); cbox.rotation.x = -.18; G.add(cbox);
    var ctrim = new T.Mesh(new T.BoxGeometry(cw * .98, .02, .02), new T.MeshBasicMaterial({ color: 0x5fd0ff })); ctrim.position.set(0, cy0 - ch / 2 + .05, cz + cd / 2 + .01); G.add(ctrim);
    var top = cy0 + ch / 2, nb = 8, bw = cw * .052, bgap = cw * .018;
    var bg = new T.BoxGeometry(bw, .03, bw * .62), bm = new T.MeshBasicMaterial({ color: 0xffffff });
    var inst = new T.InstancedMesh(bg, bm, nb * 2), m4 = new T.Matrix4(), q = new T.Quaternion().setFromEuler(new T.Euler(-.18, 0, 0)), n = 0;
    [-1, 1].forEach(function (side) {
      for (var r = 0; r < 2; r++) for (var c = 0; c < 4; c++) {
        var x = side * (cw * .2 + c * (bw + bgap)), zz = cz - .12 + r * (bw * .62 + bgap * 1.4);
        m4.compose(new T.Vector3(x, top + .02 - r * .04, zz), q, new T.Vector3(1, 1, 1)); inst.setMatrixAt(n, m4); inst.setColorAt(n, new T.Color(0x3fc4ff)); n++;
      }
    });
    inst.instanceMatrix.needsUpdate = true; if (inst.instanceColor) inst.instanceColor.needsUpdate = true; G.add(inst); P.btns = inst;
    var pad = new T.Mesh(new T.TorusGeometry(cw * .085, .018, 8, 48), new T.MeshBasicMaterial({ color: 0xf0c97a })); pad.rotation.x = Math.PI / 2 - .18; pad.position.set(0, top + .03, cz); G.add(pad);
    var padg = new T.Mesh(new T.PlaneGeometry(cw * .5, cw * .5), new T.MeshBasicMaterial(Object.assign({ map: gt, color: 0xe8b860, opacity: .55 }, add))); padg.rotation.x = -Math.PI / 2 - .18; padg.position.set(0, top + .04, cz); G.add(padg); P.pad = padg;
    // 地面:深色高光 + 灯带/托盘倒影(加色渐变)
    var fy = -vh / 2 - .6, floor = new T.Mesh(new T.PlaneGeometry(vw * 3, 12), new T.MeshStandardMaterial({ color: 0x07090f, metalness: .9, roughness: .18 }));
    floor.rotation.x = -Math.PI / 2; floor.position.set(0, fy, 4); G.add(floor);
    var refl = new T.Mesh(new T.PlaneGeometry(cw * 1.1, 6), new T.MeshBasicMaterial(Object.assign({ map: gt, color: 0x2f6fb0, opacity: .35 }, add))); refl.rotation.x = -Math.PI / 2; refl.position.set(0, fy + .01, sillD + 2.2); G.add(refl);
    var refg = new T.Mesh(new T.PlaneGeometry(cw * .35, 3.5), new T.MeshBasicMaterial(Object.assign({ map: gt, color: 0xe8b860, opacity: .28 }, add))); refg.rotation.x = -Math.PI / 2; refg.position.set(0, fy + .02, sillD + 1.6); G.add(refg);
    // 玻璃:全息角标 + 缓慢掠过的反光
    var hud = new T.Mesh(new T.PlaneGeometry(WW * .985, WH * .97), new T.MeshBasicMaterial(Object.assign({ map: hudTex(WW / WH), opacity: mob ? .45 : .7 }, add))); hud.position.set(0, cy, -.05); G.add(hud); P.hud = hud;
    var sh = new T.Mesh(new T.PlaneGeometry(WW * .35, WH * 1.6), new T.MeshBasicMaterial(Object.assign({ map: sheenTex(), opacity: .045 }, add))); sh.rotation.z = -.5; sh.position.set(-WW, cy, -.04); G.add(sh); P.sheen = sh;
    // 舱壁暖色点光(控制台)+ 冷色(窗沿)
    var pl = new T.PointLight(0xffc46a, 2.2, 6, 1.6); pl.position.set(0, top + .5, cz + .4); G.add(pl); P.pl = pl;
    var pc = new T.PointLight(0x4fbfff, 3, 9, 1.4); pc.position.set(0, wy0 + .2, 1.2); G.add(pc);
    P.sillZ = sillD;
  }

  function frame(now) {
    if (!P.on || !P.gl) return;
    if (document.hidden) { P.raf = 0; return; }
    P.raf = requestAnimationFrame(frame);
    var dt = Math.min(.1, ((now - (P.lt || now)) / 1000) || .016); P.lt = now; P.t += dt;
    var rm = reduced() ? 0 : 1;
    // 视差:鼠标 + 驾驶舱转向(--hx/--hy 由 sh-x-ship.js 每帧写入)
    var hx = parseFloat(P.R.style.getPropertyValue('--hx')) || 0, hy = parseFloat(P.R.style.getPropertyValue('--hy')) || 0;
    var tx = rm * (P.mx * .55 + hx * .03), ty = rm * (-P.my * .32 - hy * .025);
    P.px += (tx - P.px) * Math.min(1, dt * 3); P.py += (ty - P.py) * Math.min(1, dt * 3);
    P.cam.position.set(P.px, P.py + rm * Math.sin(P.t * .6) * .025, P.D); P.cam.lookAt(P.px * .25, P.py * .25 + (P.win ? P.win.cy * .05 : 0), 0);
    if (rm) {
      if (P.strip) P.strip.material.opacity = .48 + .08 * Math.sin(P.t * 1.3);
      if (P.pad) P.pad.material.opacity = .45 + .12 * Math.sin(P.t * 2.1);
      if (P.sheen && P.win) { var span = P.win.w * 1.4; P.sheen.position.x = -span / 2 + ((P.t * .06) % 1) * span; }
      if (P.btns && P.btns.instanceColor && (P.tb = (P.tb || 0) + dt) > .35) {
        P.tb = 0; var c = new T.Color(); for (var i = 0; i < P.btns.count; i++) { var hi = Math.random() < .12; c.set(hi ? 0xbff0ff : (Math.random() < .08 ? 0xf0c97a : 0x3fc4ff)); P.btns.setColorAt(i, c); } P.btns.instanceColor.needsUpdate = true;
      }
    }
    P.gl.render(P.scene, P.cam);
  }
  function loop() { if (!P.raf && P.on) { P.lt = 0; P.raf = requestAnimationFrame(frame); } }
  function stop() { if (P.raf) cancelAnimationFrame(P.raf); P.raf = 0; }
  function set(on) {
    if (on === P.on) return; P.on = on;
    if (on) { if (!mount()) { P.on = false; return; } layout(); loop(); }
    else stop();
  }
  function watch() {
    var R = I.root(); if (!R) return false; if (R._portObs) return true; R._portObs = 1;
    new MutationObserver(function () { set(R.classList.contains('port')); }).observe(R, { attributes: true, attributeFilter: ['class'] });
    set(R.classList.contains('port')); return true;
  }
  X.on(function (ev) { if (ev === 'open') watch(); else if (ev === 'close') set(false); });
  var css = document.createElement('style');
  css.textContent = '#xs-port .xs-port-gl{position:absolute;inset:0;width:100%;height:100%;display:block}#xs-port.gl{background:none!important}#xs-port{z-index:1}#xs-port .tag{z-index:2;text-shadow:0 0 8px rgba(0,0,0,.8)}#shxc.port #xa-dock,#shxc.port #xa-sub{z-index:3}';
  document.head.appendChild(css);
  window.SHXPORT = { state: function () { return { on: P.on, gl: P.ok, win: P.win || null }; } };
})();
