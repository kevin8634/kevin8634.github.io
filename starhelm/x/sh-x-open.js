/* 天枢 Starhelm · 2.0 · sh-x-open.js(SHXOPEN)—— 2.0 开场「唤醒 → 离港 → 跃迁」(约 8 秒,实时 3D)
 * 王磊 10-26 23:30 确认三幕概念图后实现。取代 1.0 的两个开场(开机日志 loader、sh-opening.js 学科开场),
 * 只在 /starhelm/x/ 生效(build_x_index.py 从 X 页去掉 sh-opening.js,并由本文件提供 window.SHOPEN 兼容接口)。
 * 幕一 唤醒:北斗七星按真实赤经赤纬(J2000)从天枢(Dubhe)起逐颗点亮、连线,星光化作粒子汇成 Armilla 浑天环。
 * 幕二 离港:镜头下摇,地球弯月与日冕光晕,天枢号驶离近地轨道。
 * 幕三 跃迁:星光拉成光线,隧道加速,白闪后进入驾驶舱/星图。
 * 可跳过(点击、Esc、空格、「跳过」);减少动态 → 静态标题 1.6 秒;无 WebGL → 2D 标题淡出。默认无声。 */
(function () {
  'use strict';
  var KEY = 'gn:sh:x-opening', root, R, scene, cam, raf, t0, done = [], playing = false, objs = {};
  var DUR = 8.8;
  // 北斗七星 J2000:赤经(小时)、赤纬(度)、视星等
  var DIPPER = [['天枢', 11.0621, 61.751, 1.8], ['天璇', 11.0307, 56.382, 2.4], ['天玑', 11.8972, 53.695, 2.4], ['天权', 12.2571, 57.033, 3.3], ['玉衡', 12.9005, 55.960, 1.8], ['开阳', 13.3987, 54.925, 2.2], ['摇光', 13.7923, 49.313, 1.9]];
  function reduced() { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } }
  function glOK() { try { var c = document.createElement('canvas'), g = window.THREE && (c.getContext('webgl2') || c.getContext('webgl')); if (g) { var x = g.getExtension('WEBGL_lose_context'); if (x) x.loseContext(); } return !!g; } catch (e) { return false; } }   // C2.2a:探测完立即释放上下文
  function sm(x, a, b) { var t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
  function css() {
    if (document.getElementById('xo-css')) return;
    var s = document.createElement('style'); s.id = 'xo-css';
    s.textContent = '#xo{position:fixed;inset:0;z-index:2147483000;background:#010208;overflow:hidden;color:#e9eef8;font-family:"Noto Sans SC","PingFang SC","Microsoft YaHei",sans-serif;transition:opacity .7s}' +
      '#xo canvas{position:absolute;inset:0;width:100%;height:100%;display:block}#xo.out{opacity:0;pointer-events:none}' +
      '#xo .cap{position:absolute;left:50%;transform:translateX(-50%);text-align:center;letter-spacing:.32em;white-space:nowrap;opacity:0;transition:opacity .8s}' +
      '#xo .cap.on{opacity:1}#xo .c1{bottom:16%;font-size:15px;color:#f0c97a}#xo .c1 b{display:block;font-size:12px;color:#9fb4d0;letter-spacing:.5em;font-weight:400;margin-top:8px}' +
      '#xo .c3{top:50%;transform:translate(-50%,-50%);font-size:clamp(26px,4vw,46px);font-weight:300;color:#fff;text-shadow:0 0 24px rgba(127,214,255,.6),0 0 3px #000}#xo .c3 b{display:block;font-size:13px;letter-spacing:.6em;color:#f0c97a;font-weight:400;margin-top:14px}' +
      '#xo .skip{position:absolute;right:22px;bottom:22px;background:rgba(10,16,32,.5);border:1px solid rgba(207,214,230,.25);color:#cfd6e6;font-size:14px;padding:8px 16px;border-radius:20px;cursor:pointer;letter-spacing:.15em}#xo .skip:hover{border-color:#f0c97a;color:#f0c97a}' +
      '#xo .ai{position:absolute;left:24px;bottom:22px;font-size:11px;color:rgba(207,214,230,.45);letter-spacing:.1em}' +
      'body.xo-on #loader{opacity:0!important}';
    document.head.appendChild(s);
  }
  function seen() { try { return !!localStorage.getItem(KEY); } catch (e) { return false; } }
  function build() {
    css();
    root = document.createElement('div'); root.id = 'xo';
    root.innerHTML = '<div class="cap c1">天枢号 · ARMILLA 已唤醒<b>TIANSHU · AWAKENING</b></div><div class="cap c2 c1">离港 · 近地轨道<b>DEPARTURE · LOW EARTH ORBIT</b></div>' +
      '<div class="cap c3">天枢 Starhelm<b>巡天 · 2.0</b></div><button type="button" class="skip">跳过 ›</button><div class="ai">实时渲染 · 星位为真实北斗七星(J2000)</div>';
    document.body.appendChild(root);
    root.querySelector('.skip').addEventListener('click', function (e) { e.stopPropagation(); end(); });
    root.addEventListener('click', end);
  }
  function onKey(e) { if (playing && (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); end(); } }

  function glowTex() {
    var c = document.createElement('canvas'); c.width = c.height = 128; var g = c.getContext('2d'), r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.15, 'rgba(255,255,255,.7)'); r.addColorStop(.4, 'rgba(255,255,255,.15)'); r.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = r; g.fillRect(0, 0, 128, 128); var t = new THREE.CanvasTexture(c); return t;
  }
  function radec(ra, dec, d) { var a = ra / 24 * Math.PI * 2, b = dec * Math.PI / 180; return new THREE.Vector3(Math.cos(b) * Math.cos(a), Math.sin(b), -Math.cos(b) * Math.sin(a)).multiplyScalar(d); }

  function setup() {
    var T = THREE, mob = innerWidth < 700;
    R = new T.WebGLRenderer({ antialias: !mob, powerPreference: 'high-performance' });
    R.setPixelRatio(Math.min(devicePixelRatio || 1, mob ? 1.5 : 2)); R.setClearColor(0x010208, 1);
    root.insertBefore(R.domElement, root.firstChild);
    scene = new T.Scene(); cam = new T.PerspectiveCamera(50, 1, .1, 5000);
    var G = glowTex(); objs.G = G;
    // 北斗:把七星中心方向转到相机正前方(-Z)
    var dirs = DIPPER.map(function (s) { return radec(s[1], s[2], 1); }), mid = new T.Vector3(); dirs.forEach(function (d) { mid.add(d); }); mid.normalize();
    var q = new T.Quaternion().setFromUnitVectors(mid, new T.Vector3(0, 0, -1)), roll = new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 0, 1), .35); q.premultiply(roll);
    var sky = new T.Group(); scene.add(sky); objs.sky = sky;
    // 背景星:随机 + 少量银河带
    var N = mob ? 5000 : 9000, P = new Float32Array(N * 3), C = new Float32Array(N * 3), col = new T.Color();
    for (var i = 0; i < N; i++) {
      var v = new T.Vector3(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1).normalize();
      if (i % 3 === 0) { v.y *= .18; v.normalize(); }
      v.multiplyScalar(900 + Math.random() * 600); P.set([v.x, v.y, v.z], i * 3);
      col.setHSL(.55 + Math.random() * .12, .3, .35 + Math.random() * .5); if (Math.random() < .08) col.setHSL(.1, .6, .7); C.set([col.r, col.g, col.b], i * 3);
    }
    var bg = new T.BufferGeometry(); bg.setAttribute('position', new T.BufferAttribute(P, 3)); bg.setAttribute('color', new T.BufferAttribute(C, 3));
    objs.bgM = new T.PointsMaterial({ size: mob ? 2.2 : 1.8, sizeAttenuation: false, vertexColors: true, transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending });
    objs.bgPos = P.slice(); objs.bgGeo = bg;
    sky.add(new T.Points(bg, objs.bgM));
    // 七星
    objs.stars = []; var pts = [];
    DIPPER.forEach(function (s, k) {
      var p = radec(s[1], s[2], 400).applyQuaternion(q); pts.push(p);
      var sp = new T.Sprite(new T.SpriteMaterial({ map: G, color: new T.Color(k === 0 ? '#ffe2a8' : '#dfe8ff'), transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending }));
      sp.position.copy(p); sp.userData.s = (4.2 - s[3]) * 7 + 6; sp.scale.setScalar(.01); sky.add(sp); objs.stars.push(sp);
    });
    var lg = new T.BufferGeometry().setFromPoints(pts.concat([pts[3]])); // 斗勺闭合:天枢-天璇-天玑-天权-天枢 + 斗柄
    var order = [0, 1, 2, 3, 0, 3, 4, 5, 6], lp = []; order.forEach(function (i) { lp.push(pts[i]); });
    lg = new T.BufferGeometry().setFromPoints(lp); objs.lineN = lp.length;
    objs.lineM = new T.LineBasicMaterial({ color: 0xf0c97a, transparent: true, opacity: .55, depthWrite: false, blending: T.AdditiveBlending });
    objs.line = new T.Line(lg, objs.lineM); lg.setDrawRange(0, 0); sky.add(objs.line); objs.pts = pts;
    // 汇聚粒子 → Armilla 浑天环(三道交叉环)
    var M = mob ? 1800 : 3600, A = new Float32Array(M * 3), B = new Float32Array(M * 3), cur = new Float32Array(M * 3), dl = new Float32Array(M), pc = new Float32Array(M * 3);
    var ringC = new T.Vector3(0, 0, -60);
    for (var j = 0; j < M; j++) {
      var src = pts[j % 7].clone().add(new T.Vector3((Math.random() - .5) * 14, (Math.random() - .5) * 14, (Math.random() - .5) * 14));
      var ring = j % 3, a = Math.random() * Math.PI * 2, rr = ring === 0 ? 9 : ring === 1 ? 7.6 : 6.4, pr = new T.Vector3(Math.cos(a) * rr, Math.sin(a) * rr, (Math.random() - .5) * .3);
      if (ring === 1) pr.applyAxisAngle(new T.Vector3(1, 0, 0), 1.25); if (ring === 2) pr.applyAxisAngle(new T.Vector3(.3, 1, 0).normalize(), 1.15);
      pr.add(ringC); A.set([src.x, src.y, src.z], j * 3); B.set([pr.x, pr.y, pr.z], j * 3); dl[j] = Math.random() * .5;
      col.set(ring === 1 ? '#cfd6e6' : '#ffd98e').multiplyScalar(.6 + Math.random() * .5); pc.set([col.r, col.g, col.b], j * 3);
    }
    var cg = new T.BufferGeometry(); cg.setAttribute('position', new T.BufferAttribute(cur, 3)); cg.setAttribute('color', new T.BufferAttribute(pc, 3));
    objs.cA = A; objs.cB = B; objs.cD = dl; objs.cGeo = cg; objs.cM = new T.PointsMaterial({ size: mob ? 2.6 : 2.4, sizeAttenuation: false, vertexColors: true, transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending });
    var cp = new T.Points(cg, objs.cM); cp.frustumCulled = false; scene.add(cp);
    objs.core = new T.Sprite(new T.SpriteMaterial({ map: G, color: 0xffd98e, transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending })); objs.core.position.copy(ringC); objs.core.scale.setScalar(10); scene.add(objs.core);
    objs.ringC = ringC;
    // 地球(幕二):地球在相机下方,太阳在地球背后 → 弯月
    var E = new T.Group(); E.position.set(0, -260, -420); scene.add(E); objs.E = E;
    var em = new T.MeshPhongMaterial({ color: 0x1c3a66, emissive: 0x000000, shininess: 12, specular: 0x334466 });
    var earth = new T.Mesh(new T.SphereGeometry(220, mob ? 64 : 96, mob ? 48 : 72), em); E.add(earth); objs.earth = earth; objs.em = em;
    var tl = new T.TextureLoader(); tl.load('hd/earth-day-4k.jpg', function (t) { if (T.SRGBColorSpace) t.colorSpace = T.SRGBColorSpace; em.map = t; em.color.set(0xffffff); em.needsUpdate = true; });
    tl.load('hd/earth-night-4k.jpg', function (t) { if (T.SRGBColorSpace) t.colorSpace = T.SRGBColorSpace; em.emissiveMap = t; em.emissive.set(0xffc27a); em.emissiveIntensity = .55; em.needsUpdate = true; });
    earth.rotation.set(.35, 2.4, 0);
    var atm = new T.Mesh(new T.SphereGeometry(228, 64, 48), new T.ShaderMaterial({
      uniforms: { uSun: { value: new T.Vector3() }, uA: { value: 0 } }, transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.BackSide,
      vertexShader: 'varying vec3 vN; varying vec3 vW; void main(){ vN = normalize(mat3(modelMatrix) * normal); vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
      fragmentShader: 'uniform vec3 uSun; uniform float uA; varying vec3 vN; varying vec3 vW; void main(){ vec3 v = normalize(cameraPosition - vW); float rim = pow(1.0 - abs(dot(vN, v)), 3.0); float lit = smoothstep(-0.4, 0.6, dot(-vN, normalize(uSun))); gl_FragColor = vec4(vec3(0.35,0.65,1.0) * rim * (0.25 + 1.6 * lit) * uA, 1.0); }'
    })); E.add(atm); objs.atm = atm;
    var sunDir = new T.Vector3(.95, .32, -.55).normalize(); objs.sunDir = sunDir;
    var light = new T.DirectionalLight(0xfff2dd, 2.6); light.position.copy(sunDir).multiplyScalar(1000); scene.add(light); objs.light = light;
    scene.add(new T.AmbientLight(0x223355, .12));
    objs.sun = new T.Sprite(new T.SpriteMaterial({ map: G, color: 0xfff1d0, transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending })); scene.add(objs.sun);
    objs.sun2 = new T.Sprite(new T.SpriteMaterial({ map: G, color: 0xffb060, transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending })); scene.add(objs.sun2);
    objs.streak = new T.Sprite(new T.SpriteMaterial({ map: G, color: 0xbfe6ff, transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending })); scene.add(objs.streak);
    // 跃迁光线(幕三)
    var W = mob ? 700 : 1400, wp = new Float32Array(W * 6), wc = new Float32Array(W * 6); objs.wSeed = [];
    for (var w = 0; w < W; w++) {
      var an = Math.random() * Math.PI * 2, rd = 6 + Math.pow(Math.random(), .6) * 70, z = -Math.random() * 900;
      objs.wSeed.push([Math.cos(an) * rd, Math.sin(an) * rd, z]);
      col.setHSL(.55 + Math.random() * .1, .7, .55 + Math.random() * .3); if (Math.random() < .15) col.set('#ffd98e');
      wc.set([col.r * .2, col.g * .2, col.b * .2, col.r, col.g, col.b], w * 6);
    }
    var wg = new T.BufferGeometry(); wg.setAttribute('position', new T.BufferAttribute(wp, 3)); wg.setAttribute('color', new T.BufferAttribute(wc, 3));
    objs.wGeo = wg; objs.wM = new T.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending });
    objs.warp = new T.LineSegments(wg, objs.wM); objs.warp.frustumCulled = false; scene.add(objs.warp);
    objs.flash = new T.Sprite(new T.SpriteMaterial({ map: G, color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending })); scene.add(objs.flash);
    size();
  }
  function size() { if (!R) return; R.setSize(innerWidth, innerHeight, false); cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix(); }

  var V = null;
  function frame() {
    var T = THREE, t = window.__xoT != null ? +window.__xoT : (performance.now() - t0) / 1000;   // __xoT:测试定格
    if (!V) V = { look: new T.Vector3(), up: new T.Vector3(), fwd: new T.Vector3(), tmp: new T.Vector3() };
    // —— 相机轨迹 ——
    var a2 = sm(t, 2.6, 4.2), drift = sm(t, 3.6, 6.0), a3 = sm(t, 5.5, 6.4);
    cam.position.set(0, -40 * a2 + 8 * drift, 30 * (1 - a2) - 120 * drift - 700 * Math.pow(sm(t, 6.0, 8.2), 2));
    V.look.set(0, -150 * a2 + 120 * a3, -400).add(cam.position);
    cam.up.set(Math.sin(a2 * .18 - a3 * .18), 1, 0).normalize(); cam.lookAt(V.look);
    cam.fov = 50 + 38 * sm(t, 5.8, 7.4) - 30 * sm(t, 7.6, 8.3); cam.updateProjectionMatrix();
    objs.sky.position.copy(cam.position);
    // —— 幕一:背景星与北斗 ——
    objs.bgM.opacity = sm(t, .1, 1.2) * (1 - sm(t, 6.0, 6.8));
    var ns = objs.stars.length;
    objs.stars.forEach(function (sp, k) {
      var on = sm(t, .35 + k * .22, .55 + k * .22), fade = 1 - sm(t, 2.2, 3.0);
      sp.material.opacity = on * (.55 + .45 * fade) * (1 - sm(t, 5.8, 6.4)); sp.scale.setScalar(sp.userData.s * (.4 + on * .6) * (1 + .7 * Math.exp(-Math.pow((t - .5 - k * .22) * 7, 2))));
    });
    var draw = sm(t, .5, 2.2); objs.line.geometry.setDrawRange(0, Math.round(draw * objs.lineN)); objs.lineM.opacity = .55 * draw * (1 - sm(t, 2.4, 3.2));
    // 粒子汇聚:北斗 → 浑天环
    var cv = sm(t, 1.5, 3.0), cA = objs.cA, cB = objs.cB, cD = objs.cD, pos = objs.cGeo.attributes.position.array, sp = cam.position;
    var ringOn = t < 4.6;
    objs.cM.opacity = sm(t, 1.4, 1.8) * (1 - sm(t, 3.4, 4.2));
    if (ringOn) {
      var rot = t * .6;
      for (var i = 0; i < cD.length; i++) {
        var u = sm(cv, cD[i], cD[i] + .5), i3 = i * 3;
        var ax = cA[i3] + sp.x, ay = cA[i3 + 1] + sp.y, az = cA[i3 + 2] + sp.z;
        var bx = cB[i3] - objs.ringC.x, by = cB[i3 + 1] - objs.ringC.y, cr = Math.cos(rot), sr = Math.sin(rot);
        var rx = bx * cr - by * sr, ry = bx * sr + by * cr;
        pos[i3] = ax + (rx + objs.ringC.x - ax) * u; pos[i3 + 1] = ay + (ry + objs.ringC.y - ay) * u; pos[i3 + 2] = az + (cB[i3 + 2] - az) * u;
      }
      objs.cGeo.attributes.position.needsUpdate = true;
    }
    objs.core.material.opacity = sm(t, 2.2, 2.8) * (1 - sm(t, 3.5, 4.2)) * (.8 + .2 * Math.sin(t * 6)); objs.core.scale.setScalar(8 + 6 * sm(t, 2.2, 2.9));
    // —— 幕二:地球弯月与日冕 ——
    var eA = sm(t, 2.8, 4.0) * (1 - sm(t, 6.2, 7.0));
    objs.E.visible = eA > .001; objs.atm.material.uniforms.uA.value = eA; objs.atm.material.uniforms.uSun.value.copy(objs.sunDir);
    objs.earth.rotation.y = 2.4 + t * .03; objs.light.intensity = 2.6 * eA;
    var sp2 = V.tmp.copy(objs.sunDir).multiplyScalar(1200).add(cam.position);
    [objs.sun, objs.sun2, objs.streak].forEach(function (s) { s.position.copy(sp2); });
    var sA = sm(t, 3.2, 4.4) * (1 - sm(t, 6.0, 6.8));
    objs.sun.material.opacity = sA; objs.sun.scale.setScalar(150 + 30 * Math.sin(t * 2)); objs.sun2.material.opacity = sA * .45; objs.sun2.scale.setScalar(520);
    objs.streak.material.opacity = sA * .6; objs.streak.scale.set(1500, 16, 1);
    // —— 幕三:跃迁 ——
    var wA = sm(t, 5.6, 6.3), spd = Math.pow(sm(t, 5.6, 7.8), 2), L = 4 + 260 * spd, wp = objs.wGeo.attributes.position.array, cz = cam.position.z;
    objs.wM.opacity = wA * (1 - sm(t, 7.9, 8.3));
    if (wA > 0) {
      cam.getWorldDirection(V.fwd);
      for (var w = 0; w < objs.wSeed.length; w++) {
        var s = objs.wSeed[w], z = ((s[2] - t * 1400 * spd) % 900 + 900) % 900; var zz = cz - 40 - z;
        var cx = cam.position.x + s[0], cy = cam.position.y + s[1], o = w * 6;
        wp[o] = cx; wp[o + 1] = cy; wp[o + 2] = zz + L; wp[o + 3] = cx; wp[o + 4] = cy; wp[o + 5] = zz;
      }
      objs.wGeo.attributes.position.needsUpdate = true;
      objs.warp.quaternion.identity(); objs.warp.position.set(0, 0, 0);
    }
    var fl = Math.exp(-Math.pow((t - 7.45) * 5.5, 2));
    objs.flash.position.copy(V.fwd.clone().multiplyScalar(30).add(cam.position)); objs.flash.material.opacity = fl + wA * .1 * spd * (1 - sm(t, 7.5, 7.9)); objs.flash.scale.setScalar(20 + 160 * fl + 30 * spd);
    R.render(scene, cam);
    // 字幕
    cap('.c1:not(.c2)', t > .9 && t < 2.9); cap('.c2', t > 3.6 && t < 5.5); cap('.c3', t > 7.55);
    if (t > DUR && window.__xoT == null) { end(); return; }
    raf = requestAnimationFrame(frame);
  }
  function cap(sel, on) { var e = root.querySelector(sel); if (e) e.classList.toggle('on', !!on); }

  function staticPlay(ms) {
    root.querySelector('.ai').textContent = '';
    var c3 = root.querySelector('.c3'); c3.classList.add('on'); setTimeout(end, ms);
  }
  function play(force, cb) {
    if (playing) { if (cb) done.push(cb); return true; }
    if (!force && seen()) { if (cb) cb(); return false; }
    if (!root) build(); else { root.classList.remove('out'); root.style.display = ''; }
    if (cb) done.push(cb);
    playing = true; document.body.classList.add('xo-on'); addEventListener('keydown', onKey, true);
    if (reduced() || !glOK()) { staticPlay(1600); return true; }
    try { if (!R) setup(); } catch (e) { console.warn('[SHXOPEN]', e); staticPlay(1200); return true; }
    t0 = performance.now(); cancelAnimationFrame(raf); raf = requestAnimationFrame(frame);
    return true;
  }
  function end() {
    if (!playing) return; playing = false; cancelAnimationFrame(raf); removeEventListener('keydown', onKey, true);
    try { localStorage.setItem(KEY, '1'); } catch (e) { }
    root.classList.add('out'); document.body.classList.remove('xo-on');
    setTimeout(function () { if (!playing && root) { root.style.display = 'none'; root.querySelectorAll('.cap').forEach(function (c) { c.classList.remove('on'); }); release(); } }, 750);
    var f = done; done = []; f.forEach(function (fn) { try { fn(); } catch (e) { } });
  }
  // C2.2a:开场结束后释放它的 WebGL 上下文(原来一直占着一个全屏上下文,挤压驾驶舱的上下文预算);重播时 setup() 重建
  function release() { if (!R) return; try { if (scene) scene.traverse(function (o) { if (o.geometry) o.geometry.dispose(); if (o.material) [].concat(o.material).forEach(function (m) { if (m.map) m.map.dispose(); m.dispose(); }); }); R.dispose(); R.forceContextLoss(); if (R.domElement.parentNode) R.domElement.remove(); } catch (e) { } R = null; scene = null; objs = {}; }
  addEventListener('resize', size);
  window.SHXOPEN = { play: play, end: end, seen: seen, get playing() { return playing; } };
  // 兼容 1.0 接口:HUD「↺ 开场」等调用 SHOPEN.play 时改播 2.0 开场;1.0 开场脚本在 X 页已不加载(归档)
  window.SHOPEN = { play: function (force, cb) { return play(true, cb); }, seen: seen, archived: true };
  // 进入即播(星桥深链 ?domain= / ?task= 与 ?xopen=0 不播);等 three 就绪
  (function wait(k) {
    if (/[?&](domain|task)=|[?&]xopen=0/.test(location.search)) return;
    if (window.THREE && THREE.WebGLRenderer) { play(true); return; }
    if (k > 150) { play(true); return; } setTimeout(function () { wait(k + 1); }, 40);
  })(0);
})();
