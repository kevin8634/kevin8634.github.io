/* 天枢 Starhelm · sh-domain2.js · 星域 II「日与月」独立视图(v1.0-M1c)
 * 日-地-月三体:太阳在中心,地球与月球的方向、地轴倾角、地球自转、月球潮汐锁定都来自 astronomy-engine 真实计算,
 * 跟随统一时间轴 SHTIME(快进时月亮绕地球、地球绕太阳)。大小与距离为示意压缩(画面角注已标明)。
 * API:window.SHD2.open() / close() / isOpen() / camKm()。打开时暂停母港地球渲染(同 sh-archive 的做法)。
 * 守星人:羲和(太阳)、望舒(月亮)。
 */
(function () {
  'use strict';
  var T = window.THREE, AU = 149597870.7, C = 299792.458, EPS = 23.4393 * Math.PI / 180;
  var RE = 14, MD = 2.3;          // 场景:1 AU = 14 单位;地月距离压缩成 2.3 单位(真实约 0.036)
  var D2 = { open: false }, G = null, raf = 0, last = 0, leRender = null;
  function A() { return window.Astronomy; }
  function now() { return window.SHTIME ? SHTIME.now() : new Date(); }
  function h(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function P(n) { if (window.LE && LE.audio) LE.audio.play(n); }
  function reduced() { return matchMedia('(prefers-reduced-motion: reduce)').matches; }
  // 黄道坐标 → 场景:x = 春分点方向,y = 黄道北,-z = 黄经 90°
  function eclVec(lonDeg, latDeg, r, out) {
    var l = lonDeg * Math.PI / 180, b = (latDeg || 0) * Math.PI / 180;
    return (out || new T.Vector3()).set(r * Math.cos(b) * Math.cos(l), r * Math.sin(b), -r * Math.cos(b) * Math.sin(l));
  }
  function bodies(d) {
    var a = A(), t = a.MakeTime(d);
    var ev = a.HelioVector(a.Body.Earth, t), ee = a.Ecliptic(ev);
    var mv = a.GeoMoon(t), me = a.Ecliptic(mv);
    return { eLon: ee.elon, eLat: ee.elat, eAU: Math.hypot(ev.x, ev.y, ev.z), mLon: me.elon, mLat: me.elat, mKm: Math.hypot(mv.x, mv.y, mv.z) * AU, gst: a.SiderealTime(t) };
  }
  function glowTex(c0, c1) {
    var c = document.createElement('canvas'); c.width = c.height = 256; var g = c.getContext('2d');
    var gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    gr.addColorStop(0, c0); gr.addColorStop(0.25, c1); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 256, 256); var t = new T.CanvasTexture(c); return t;
  }

  function build() {
    var root = D2.root = h('div', 'sh2');
    root.innerHTML = '<canvas class="sh2-cv"></canvas><div class="sh2-lbls"></div>' +
      '<div class="sh2-info"><div class="sh2-kick">星域 II · 日与月 · 羲和与望舒</div><div class="sh2-rows"></div></div>' +
      '<div class="sh2-note">示意:太阳、地球、月球的大小和距离都按比例压缩了;方向、地轴倾斜、月相按真实时间计算</div>' +
      '<button class="sh2-back" type="button">← 回到家园</button>';
    document.body.appendChild(root);
    root.querySelector('.sh2-back').onclick = function () { if (window.SHDOM) SHDOM.go(1); else close(); };
    var cv = root.querySelector('.sh2-cv');
    var rd = new T.WebGLRenderer({ canvas: cv, antialias: true }); rd.setPixelRatio(Math.min(2, devicePixelRatio || 1));
    rd.outputEncoding = T.sRGBEncoding; rd.toneMapping = T.ACESFilmicToneMapping; rd.toneMappingExposure = 1.05;
    var sc = new T.Scene(), cam = new T.PerspectiveCamera(42, 1, 0.05, 2000);
    var tex = LE.assets.texture;
    // 星空
    var sky = window.SHFX3D ? SHFX3D.skyMesh(rd, 900) : new T.Mesh(new T.SphereGeometry(900, 48, 24), new T.MeshBasicMaterial({ map: tex(LE.config.TEX.milkyway, true), side: T.BackSide, color: 0x8899aa }));
    sc.add(sky);
    // 太阳
    var sunFx = window.SHFX3D ? SHFX3D.sun({ radius: 1.6 }) : null, sun;   // v1.0-M2c:着色器太阳 + 日冕 + 日珥/太阳风粒子
    if (sunFx) { sun = sunFx.core; sc.add(sunFx.group); }
    else {
      sun = new T.Mesh(new T.SphereGeometry(1.6, 48, 24), new T.MeshBasicMaterial({ color: 0xffd98a }));
      var halo = new T.Sprite(new T.SpriteMaterial({ map: glowTex('rgba(255,236,190,1)', 'rgba(255,190,90,.45)'), blending: T.AdditiveBlending, depthWrite: false, transparent: true }));
      halo.scale.set(9, 9, 1); sun.add(halo); sc.add(sun);
    }
    var light = new T.PointLight(0xffffff, 2.2, 0, 0); sc.add(light); sc.add(new T.AmbientLight(0x3a4a6a, 0.7));
    // 地球(地轴倾斜 23.44°,自转跟恒星时)
    var eTilt = new T.Group(); eTilt.rotation.x = -EPS;
    var earth = new T.Mesh(new T.SphereGeometry(0.5, 64, 32), new T.MeshPhongMaterial({ map: tex(LE.config.TEX.earthDay, true), specular: 0x222222, shininess: 12 }));
    eTilt.add(earth);
    var axis = new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(0, -0.8, 0), new T.Vector3(0, 0.8, 0)]), new T.LineBasicMaterial({ color: 0x7fd6ff, transparent: true, opacity: 0.6 }));
    eTilt.add(axis);
    var atm = new T.Sprite(new T.SpriteMaterial({ map: glowTex('rgba(120,190,255,.0)', 'rgba(110,180,255,.35)'), blending: T.AdditiveBlending, depthWrite: false, transparent: true }));
    atm.scale.set(1.5, 1.5, 1);
    var eG = new T.Group(); eG.add(eTilt); eG.add(atm); sc.add(eG);
    // 月球(潮汐锁定:近地面始终朝地球)
    var mPivot = new T.Group(), moon = new T.Mesh(new T.SphereGeometry(0.14, 48, 24), new T.MeshPhongMaterial({ map: tex('planet-moon.jpg', true), shininess: 2 }));
    moon.rotation.y = -Math.PI / 2; mPivot.add(moon); sc.add(mPivot);
    // 地球轨道
    var op = []; for (var i = 0; i <= 360; i += 2) op.push(eclVec(i, 0, RE));
    sc.add(new T.Line(new T.BufferGeometry().setFromPoints(op), new T.LineBasicMaterial({ color: 0x7fd6ff, transparent: true, opacity: 0.28 })));
    var mOrb = new T.Line(new T.BufferGeometry(), new T.LineBasicMaterial({ color: 0xf0c97a, transparent: true, opacity: 0.45 })); sc.add(mOrb);
    var ctl = new T.OrbitControls(cam, cv); ctl.enableDamping = true; ctl.dampingFactor = 0.08; ctl.minDistance = 1.2; ctl.maxDistance = 60; ctl.enablePan = false;
    G = { rd: rd, sc: sc, cam: cam, ctl: ctl, sun: sun, sunFx: sunFx, earth: earth, eG: eG, mPivot: mPivot, moon: moon, mOrb: mOrb, light: light, orbDay: -1e9, ePrev: new T.Vector3() };
    // 标签
    var L = root.querySelector('.sh2-lbls');
    G.lbl = {
      sun: mk('太阳 · 羲和', 'sun'), earth: mk('地球 · 家园', 'earth'), moon: mk('月球 · 望舒', 'moon')
    };
    function mk(t, k) { var b = h('button', 'sh2-l sh2-l--' + k, t); b.type = 'button'; b.onclick = function () { pick(k); }; L.appendChild(b); return b; }
    // 点击拾取
    var ray = new T.Raycaster(), v2 = new T.Vector2(), down = null;
    cv.addEventListener('pointerdown', function (e) { down = [e.clientX, e.clientY]; });
    cv.addEventListener('pointerup', function (e) {
      if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 6) return;
      var r = cv.getBoundingClientRect(); v2.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1);
      ray.setFromCamera(v2, cam);
      var hit = ray.intersectObjects([sun, earth, moon], false)[0];
      if (hit) pick(hit.object === sun ? 'sun' : hit.object === earth ? 'earth' : 'moon');
    });
    addEventListener('resize', function () { if (D2.open) resize(); });
  }
  function resize() { var w = innerWidth, hh = innerHeight; G.rd.setSize(w, hh, false); G.cam.aspect = w / hh; G.cam.updateProjectionMatrix(); }

  function pick(k) {
    P('click'); var H = window.SHHUD;
    if (k === 'sun') { if (H) H.guide('xihe', '太阳离我们约 1.5 亿公里,阳光要走 8 分多钟。太阳脾气好不好,和地球有什么关系?', []); offer([['☀ 太阳活动观测台', 'sunLab'], ['🌌 极光是太阳寄来的信吗?', 'auroraLab'], ['🌑 日月食实验室', 'eclipseLab']]); }
    else if (k === 'moon') { if (H) H.guide('wangshu', '我一直用同一面看着你们。想飞近看看我吗?', []); offer([['🌕 飞近月亮', 'fly'], ['🌗 月相实验室', 'moonLab'], ['🔒 为什么总是同一面?', 'tidelockLab'], ['🌊 潮汐实验室', 'tideLab']]); }
    else { if (H) H.guide('tianshu', '这就是我们的家。要回到地球身边吗?', []); offer([['🌍 回到家园', 'home']]); }
  }
  function offer(list) {
    var box = D2.root.querySelector('.sh2-offer'); if (box) box.remove();
    box = h('div', 'sh2-offer'); var x = h('button', 'sh2-ox', '✕'); x.type = 'button'; x.onclick = function () { box.remove(); }; box.appendChild(x);
    list.forEach(function (o) {
      var b = h('button', 'sh2-ob', o[0]); b.type = 'button';
      b.onclick = function () {
        box.remove();
        if (o[1] === 'home') { SHDOM.go(1); return; }
        if (o[1] === 'fly') { SHDOM.go(1, { quiet: true }); setTimeout(function () { if (window.SHFOCUS) SHFOCUS.showMoon(true); }, 250); return; }
        var lab = window.SH && SH[o[1]]; if (lab && lab.open) lab.open();
      };
      box.appendChild(b);
    });
    D2.root.appendChild(box);
  }

  var tmp = new T.Vector3(), tmp2 = new T.Vector3();
  function place(d, first) {
    var b = bodies(d), ep = eclVec(b.eLon, b.eLat, RE * b.eAU, tmp);
    var delta = tmp2.copy(ep).sub(G.ePrev);
    G.eG.position.copy(ep);
    G.earth.rotation.y = b.gst / 24 * Math.PI * 2;
    var mp = eclVec(b.mLon, b.mLat, MD, new T.Vector3()).add(ep);
    G.mPivot.position.copy(mp); G.mPivot.lookAt(ep);
    var day = d.getTime() / 864e5;
    if (Math.abs(day - G.orbDay) > 3) {      // 月球轨道:采样未来一个恒星月的真实方向
      G.orbDay = day; var pts = [];
      for (var i = -14; i <= 14; i++) { var bb = bodies(new Date(d.getTime() + i * 0.5 * 864e5)); pts.push(eclVec(bb.mLon, bb.mLat, MD)); }
      G.mOrb.geometry.dispose(); G.mOrb.geometry = new T.BufferGeometry().setFromPoints(pts);
    }
    G.mOrb.position.copy(ep);
    if (first) {
      var s = ep.clone().negate().normalize(), side = new T.Vector3(0, 1, 0).cross(s).normalize();
      // 从侧面看:地球半边亮、太阳在画面一侧,月球轨道整圈可见
      var mob = innerWidth < 760;
      G.ctl.target.copy(ep).addScaledVector(s, mob ? 5.5 : 1.5);
      G.cam.position.copy(ep).addScaledVector(side, mob ? -3 : -4).addScaledVector(s, mob ? -14 : -7).add(new T.Vector3(0, mob ? 7 : 2, 0));
    } else if (G.ePrev.lengthSq() > 0) { G.ctl.target.add(delta); G.cam.position.add(delta); }
    G.ePrev.copy(ep);
    return b;
  }
  function info(b) {
    var km = b.eAU * AU, ph = window.SH && SH.astro && SH.astro.moonPhase ? SH.astro.moonPhase(now()) : null;
    var lt = km / C, m = Math.floor(lt / 60), s = Math.round(lt % 60);
    var rows = [
      ['日地距离', (km / 1e8).toFixed(3) + ' 亿 km', '阳光走 ' + m + ' 分 ' + s + ' 秒'],
      ['地月距离', (b.mKm / 1e4).toFixed(2) + ' 万 km', '月光走 ' + (b.mKm / C).toFixed(2) + ' 秒'],
      ['此刻月相', ph ? (ph.name || '') + ' · 亮 ' + Math.round(ph.k * 100) + '%' : '—', window.SHTIME ? SHTIME.fmt(now()) : '']
    ];
    var html = rows.map(function (r) { return '<div class="sh2-r"><small>' + r[0] + '</small><b>' + r[1] + '</b><i>' + r[2] + '</i></div>'; }).join('');
    if (html !== D2.lastInfo) { D2.lastInfo = html; D2.root.querySelector('.sh2-rows').innerHTML = html; }
  }
  function labels() {
    var w = innerWidth, hh = innerHeight;
    [['sun', G.sun, 2.2], ['earth', G.eG, 0.75], ['moon', G.mPivot, 0.3]].forEach(function (x) {
      var p = x[1].getWorldPosition(tmp).clone(); p.y += x[2]; p.project(G.cam);
      var el = G.lbl[x[0]], vis = p.z < 1 && Math.abs(p.x) < 1.05 && Math.abs(p.y) < 1.05;
      el.style.display = vis ? '' : 'none';
      if (vis) el.style.transform = 'translate(' + ((p.x + 1) / 2 * w).toFixed(0) + 'px,' + ((1 - p.y) / 2 * hh).toFixed(0) + 'px) translate(-50%,-100%)';
    });
  }
  var acc = 0;
  function loop(t) {
    raf = requestAnimationFrame(loop); var dt = Math.min(0.1, (t - last) / 1000 || 0); last = t;
    var d = now(), b = place(d, false);
    if ((acc += dt) > 0.25) { acc = 0; info(b); }
    if (G.sunFx) G.sunFx.update(dt, G.cam);
    G.ctl.update(); G.rd.render(G.sc, G.cam); labels();
  }
  function pauseLE(p) {
    var lr = window.LE && LE.scene && LE.scene.renderer; if (!lr) return;
    if (p) { if (!leRender) { leRender = lr.render; lr.render = function () { }; } }
    else if (leRender) { lr.render = leRender; leRender = null; }
  }
  function open() {
    if (!T || !A() || !window.LE || !LE.scene || !LE.scene.renderer) return false;
    if (!D2.root) try { build(); } catch (e) { console.warn('[SHD2] 构建失败', e); return false; }
    if (D2.open) return true;
    D2.open = true; D2.root.hidden = false; document.body.classList.add('sh2-on'); pauseLE(true);
    resize(); G.ePrev.set(0, 0, 0); G.orbDay = -1e9; var b = place(now(), true); info(b);
    G.ctl.autoRotate = false; cancelAnimationFrame(raf); last = performance.now(); raf = requestAnimationFrame(loop);
    if (window.SHHUD) SHHUD.guide('wangshu', '这是太阳、地球和我。点我们任何一个,看看能问些什么。', []);
    P('whoosh');
    return true;
  }
  function close() {
    if (!D2.open) return; D2.open = false; D2.root.hidden = true; document.body.classList.remove('sh2-on');
    cancelAnimationFrame(raf); pauseLE(false); var o = D2.root.querySelector('.sh2-offer'); if (o) o.remove();
  }
  window.SHD2 = {
    open: open, close: close, isOpen: function () { return D2.open; },
    camKm: function () { return G ? G.cam.position.distanceTo(G.ctl.target) * AU / RE : 0; },
    _G: function () { return G; }
  };
})();
