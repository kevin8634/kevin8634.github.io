/* 天枢 Starhelm · sh-atlas.js · 宇宙航图(统一版 v1.0-M2c)
 * 外场 HUD 的「航图」和弦穹号航行中的「航图」合并为同一张:Three.js 全息星域沙盘(对数尺度同心环,可拖动旋转、滚轮/双指缩放)
 * + 右侧星域卡(一问、守星人、尺度、光行时、任务进度)。无 WebGL 时退回 SVG 平面图。
 * 外场打开:已开放星域「跃迁前往」(SHDOM.go,直接进 3D 场景),任何星域都可「驾驶弦穹号前往」。
 * 航行中打开(open({voy:true})):「设为目的地」交给弦穹号;所在星域已开放时「进入 3D 场景」。
 * API:window.SHATLAS.open(opts) / close() / isOpen()
 */
(function () {
  'use strict';
  var BLURB = {
    1: '我在哪、昼夜四季、会动的大地、近地轨道', 2: '月相、潮汐、日月食、太阳活动、极光', 3: '八大行星、卫星、开普勒定律、探测器',
    4: '小行星、彗星、柯伊伯带、日球层、旅行者号', 5: '光年、恒星一生、系外行星、宜居带', 6: '旋臂、星团、双星、中心黑洞', 7: '星系、宇宙膨胀、大爆炸、暗物质',
    8: '已知物理的边缘之外:曲率、虫洞、多重宇宙。这里只有猜想,没有航线。'
  };
  var Q = {
    1: '此刻,你在宇宙的哪里?', 2: '月亮为什么会变脸?', 3: '别的行星上,一天有多长?', 4: '太阳系的边界在哪里?',
    5: '星星为什么有不同的颜色?', 6: '我们在银河系的哪个位置?', 7: '宇宙有边吗?', 8: '宇宙之外还有什么?'
  };
  var SECTOR = ['', 'home', 'moon', 'planets', 'edge', 'stars', 'galaxy', 'cosmos', 'outer'];
  var ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', '∞'];
  var U = {}, sel = 1, mode = { voy: false }, G3 = null, raf = 0;
  function h(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function P(n) { if (window.LE && LE.audio) LE.audio.play(n); }
  function H() { return window.SHHUD; }
  function T() { return window.THREE; }
  function doms() {
    var d = ((H() && H().DOMAINS) || []).slice();
    d.push({ n: 8, zh: '猜想', g: '—', open: false, conj: true, scale: 27 });
    return d;
  }
  function domOfSector(id) { return SECTOR.indexOf(id); }
  function curDom() { if (mode.voy && window.SH && SH.voy) return domOfSector(SH.voy.at) || 1; return window.SHDOM && SHDOM.cur || 1; }

  function build() {
    var r = U.root = h('section', 'sha'); r.setAttribute('role', 'dialog'); r.setAttribute('aria-label', '宇宙航图');
    r.innerHTML = '<header class="sha-hd"><div><small>天枢 Starhelm · 宇宙航图 · ATLAS</small><b>七星域 · 从家园到宇宙</b></div>' +
      '<button class="sha-x" type="button" aria-label="关闭">✕</button></header>' +
      '<div class="sha-body"><div class="sha-map"><canvas class="sha-cv"></canvas><div class="sha-lbls"></div><svg class="sha-svg" viewBox="-130 -130 260 260" hidden></svg>' +
      '<div class="sha-legend"><i class="lg-on"></i>已开放 <i class="lg-off"></i>建造中 <i class="lg-cj"></i>猜想 <i class="lg-here"></i>你在这里</div>' +
      '<div class="sha-hint">拖动旋转 · 滚轮/双指缩放 · 每往外一圈,尺度放大约 100 到 10 000 倍</div></div>' +
      '<aside class="sha-card"></aside></div>';
    document.body.appendChild(r);
    r.querySelector('.sha-x').onclick = close;
    r.addEventListener('keydown', function (e) { if (e.key === 'Escape') { e.stopPropagation(); close(); } });
    U.svg = r.querySelector('.sha-svg'); U.card = r.querySelector('.sha-card'); U.cv = r.querySelector('.sha-cv'); U.lbls = r.querySelector('.sha-lbls');
    try { init3d(); } catch (e) { console.warn('[SHATLAS] 3D 不可用,改用平面图', e); G3 = null; }
    if (!G3) { U.cv.hidden = true; U.svg.hidden = false; }
  }

  /* ---------------- 3D 全息沙盘 ---------------- */
  function radTex(stops) {
    var c = document.createElement('canvas'); c.width = c.height = 128; var g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    stops.forEach(function (s) { gr.addColorStop(s[0], s[1]); }); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return new (T().CanvasTexture)(c);
  }
  function ringR(n) { return 0.9 + (n - 1) * 1.12; }
  function init3d() {
    var TH = T(); if (!TH) return;
    var rd = new TH.WebGLRenderer({ canvas: U.cv, antialias: true, alpha: true }); rd.setPixelRatio(Math.min(2, devicePixelRatio || 1)); rd.setClearColor(0, 0);
    var S = new TH.Scene(), cam = new TH.PerspectiveCamera(42, 1, 0.1, 300);
    G3 = { rd: rd, S: S, cam: cam, th: -0.6, ph: 0.62, dist: 17, auto: 1, nodes: [], t: 0 };
    // 远景星尘(三层,颜色/大小不同,制造纵深)
    var dot = radTex([[0, 'rgba(255,255,255,1)'], [0.3, 'rgba(255,255,255,.45)'], [1, 'rgba(255,255,255,0)']]);
    [[2600, 40, 90, 0.22, 0x9fc8ff], [900, 25, 40, 0.3, 0xffe2b0], [300, 14, 24, 0.42, 0xffffff]].forEach(function (L) {
      var p = new Float32Array(L[0] * 3);
      for (var i = 0; i < L[0]; i++) { var u = Math.random() * 2 - 1, a = Math.random() * 6.283, rr = L[1] + Math.random() * (L[2] - L[1]), q = Math.sqrt(1 - u * u); p[i * 3] = Math.cos(a) * q * rr; p[i * 3 + 1] = u * rr * 0.6; p[i * 3 + 2] = Math.sin(a) * q * rr; }
      var g = new TH.BufferGeometry(); g.setAttribute('position', new TH.BufferAttribute(p, 3));
      S.add(new TH.Points(g, new TH.PointsMaterial({ color: L[4], size: L[3], map: dot, transparent: true, opacity: 0.85, depthWrite: false, blending: TH.AdditiveBlending })));
    });
    var grid = new TH.PolarGridHelper(10.2, 24, 12, 128, 0x2c6c8c, 0x16324a); grid.position.y = -0.02; grid.material.transparent = true; grid.material.opacity = 0.3; S.add(grid);
    // 中心:地球
    var earth = new TH.Mesh(new TH.SphereGeometry(0.16, 48, 24), new TH.MeshBasicMaterial({ color: 0x4fb4ff }));
    if (window.LE && LE.assets && LE.config) earth.material.map = LE.assets.texture(LE.config.TEX.earthDay, true), earth.material.color.set(0xffffff);
    S.add(earth); G3.earth = earth;
    var eg = new TH.Sprite(new TH.SpriteMaterial({ map: radTex([[0, 'rgba(140,220,255,.9)'], [0.4, 'rgba(60,150,255,.25)'], [1, 'rgba(40,120,255,0)']]), blending: TH.AdditiveBlending, depthWrite: false })); eg.scale.set(1.2, 1.2, 1); S.add(eg);
    // 光壳:每个星域一圈(已开放实线发光,建造中虚线,猜想紫色虚线)+ 环上流动粒子
    doms().forEach(function (d, i) {
      var rad = ringR(d.n), col = new TH.Color(d.conj ? 0xc9a6ff : d.open ? 0x7fe3c4 : 0x7fa6d8);
      var pts = []; for (var k = 0; k <= 200; k++) { var a = k / 200 * Math.PI * 2; pts.push(new TH.Vector3(Math.cos(a) * rad, 0, Math.sin(a) * rad)); }
      var lg = new TH.BufferGeometry().setFromPoints(pts), dashed = !d.open;
      var line = new TH.Line(lg, dashed ? new TH.LineDashedMaterial({ color: col, dashSize: 0.2, gapSize: 0.16, transparent: true, opacity: 0.7 }) : new TH.LineBasicMaterial({ color: col, transparent: true, opacity: 0.9 }));
      if (dashed) line.computeLineDistances(); S.add(line);
      var band = new TH.Mesh(new TH.RingGeometry(rad - 0.08, rad + 0.08, 200), new TH.MeshBasicMaterial({ color: col, transparent: true, opacity: d.open ? 0.2 : 0.08, side: TH.DoubleSide, blending: TH.AdditiveBlending, depthWrite: false }));
      band.rotation.x = -Math.PI / 2; S.add(band);
      var np = d.open ? 60 : 24, fp = new Float32Array(np * 3), ph = []; for (var j = 0; j < np; j++) ph.push(Math.random() * 6.283);
      var fg = new TH.BufferGeometry(); fg.setAttribute('position', new TH.BufferAttribute(fp, 3));
      var flow = new TH.Points(fg, new TH.PointsMaterial({ color: col, size: d.open ? 0.14 : 0.09, map: dot, transparent: true, opacity: d.open ? 0.9 : 0.5, depthWrite: false, blending: TH.AdditiveBlending })); S.add(flow);
      var a0 = -Math.PI * 0.8 + i * (Math.PI * 1.35 / 7), pos = new TH.Vector3(Math.cos(a0) * rad, 0, Math.sin(a0) * rad);
      var glow = new TH.Sprite(new TH.SpriteMaterial({ map: radTex([[0, 'rgba(255,255,255,1)'], [0.22, 'rgba(' + Math.round(col.r * 255) + ',' + Math.round(col.g * 255) + ',' + Math.round(col.b * 255) + ',.8)'], [1, 'rgba(0,0,0,0)']]), blending: TH.AdditiveBlending, depthWrite: false }));
      glow.position.copy(pos); S.add(glow);
      var beam = new TH.Mesh(new TH.CylinderGeometry(0.014, 0.014, 1.8, 8, 1, true), new TH.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0, blending: TH.AdditiveBlending, depthWrite: false }));
      beam.position.copy(pos).add(new TH.Vector3(0, 0.9, 0)); S.add(beam);
      var lb = h('button', 'sha-lb' + (d.open ? ' on' : '') + (d.conj ? ' cj' : ''), '<b>' + ROMAN[d.n] + ' ' + d.zh + '</b><small>' + (d.conj ? '猜想' : d.open ? '已开放' : '建造中') + '</small>');
      lb.type = 'button'; lb.onclick = function () { pick(d.n); }; U.lbls.appendChild(lb);
      G3.nodes.push({ d: d, rad: rad, pos: pos, glow: glow, band: band, line: line, beam: beam, flow: flow, fp: fp, ph: ph, lb: lb });
    });
    G3.here = new TH.Mesh(new TH.RingGeometry(0.3, 0.35, 64), new TH.MeshBasicMaterial({ color: 0xffffff, transparent: true, side: TH.DoubleSide, depthWrite: false })); G3.here.rotation.x = -Math.PI / 2; S.add(G3.here);
    // 交互
    var pts2 = {}, down = null, pinch = 0, cv = U.cv;
    cv.addEventListener('pointerdown', function (e) { pts2[e.pointerId] = [e.clientX, e.clientY]; down = { m: 0 }; G3.auto = 0; try { cv.setPointerCapture(e.pointerId); } catch (x) { } });
    cv.addEventListener('pointermove', function (e) {
      if (!pts2[e.pointerId]) return; var o = pts2[e.pointerId], dx = e.clientX - o[0], dy = e.clientY - o[1]; pts2[e.pointerId] = [e.clientX, e.clientY];
      var ids = Object.keys(pts2);
      if (ids.length >= 2) { var A = pts2[ids[0]], B = pts2[ids[1]], dd = Math.hypot(A[0] - B[0], A[1] - B[1]); if (pinch) G3.dist = Math.max(6, Math.min(30, G3.dist * pinch / dd)); pinch = dd; if (down) down.m = 99; return; }
      G3.th -= dx * 0.006; G3.ph = Math.max(0.12, Math.min(1.4, G3.ph + dy * 0.004)); if (down) down.m += Math.abs(dx) + Math.abs(dy);
    });
    var up = function (e) { delete pts2[e.pointerId]; pinch = 0; if (down && down.m < 8 && e.type === 'pointerup') tap(e.clientX, e.clientY); down = null; };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    cv.addEventListener('wheel', function (e) { e.preventDefault(); G3.dist = Math.max(6, Math.min(30, G3.dist * (1 + e.deltaY * 0.001))); }, { passive: false });
  }
  function tap(cx, cy) {   // 点在哪一圈:视线与 y=0 平面的交点半径
    var TH = T(), r = U.cv.getBoundingClientRect(), v = new TH.Vector2((cx - r.left) / r.width * 2 - 1, -(cy - r.top) / r.height * 2 + 1);
    var ray = new TH.Raycaster(); ray.setFromCamera(v, G3.cam);
    var p = new TH.Vector3(); if (!ray.ray.intersectPlane(new TH.Plane(new TH.Vector3(0, 1, 0), 0), p)) return;
    var rr = Math.hypot(p.x, p.z), best = null, bd = 0.5;
    G3.nodes.forEach(function (n) { var d = Math.abs(n.rad - rr); if (d < bd) { bd = d; best = n; } });
    if (best) pick(best.d.n);
  }
  function frame() {
    if (!U.root || U.root.hidden) return; raf = requestAnimationFrame(frame);
    var cv = U.cv, w = cv.clientWidth, hh = cv.clientHeight; if (!w || !hh) return;
    if (G3.w !== w || G3.h !== hh) { G3.w = w; G3.h = hh; G3.rd.setSize(w, hh, false); G3.cam.aspect = w / hh; G3.cam.fov = w / hh < 0.8 ? 64 : 42; G3.cam.updateProjectionMatrix(); }
    var red = matchMedia('(prefers-reduced-motion: reduce)').matches, t = (G3.t += red ? 0.004 : 0.016);
    if (G3.auto && !red) G3.th += 0.0012;
    var c = G3.cam; c.position.set(Math.cos(G3.th) * Math.cos(G3.ph) * G3.dist, Math.sin(G3.ph) * G3.dist, Math.sin(G3.th) * Math.cos(G3.ph) * G3.dist); c.lookAt(0, -0.5, 0); c.updateMatrixWorld();
    G3.earth.rotation.y += 0.004;
    var here = curDom();
    G3.nodes.forEach(function (n, i) {
      var on = n.d.n === sel, isHere = n.d.n === here, pul = 1 + 0.12 * Math.sin(t * 3 + i);
      n.glow.scale.setScalar((on ? 0.95 : isHere ? 0.75 : 0.5) * pul);
      n.band.material.opacity = on ? 0.45 : n.d.open ? 0.2 : 0.08; n.line.material.opacity = on ? 1 : 0.7; n.beam.material.opacity = on ? 0.8 : 0;
      for (var j = 0; j < n.ph.length; j++) { var a = n.ph[j] + t * (0.25 / Math.sqrt(n.rad)); n.fp[j * 3] = Math.cos(a) * n.rad; n.fp[j * 3 + 1] = Math.sin(a * 3 + j) * 0.03; n.fp[j * 3 + 2] = Math.sin(a) * n.rad; }
      n.flow.geometry.attributes.position.needsUpdate = true;
      if (isHere) { G3.here.position.copy(n.pos); G3.here.scale.setScalar(1 + 0.25 * Math.sin(t * 3)); }
      var v = n.pos.clone().project(c), x = (v.x + 1) / 2 * w, y = (1 - v.y) / 2 * hh;
      n.lb.style.transform = 'translate(' + x.toFixed(1) + 'px,' + (y + 12).toFixed(1) + 'px) translateX(-50%)';
      n.lb.classList.toggle('sel', on); n.lb.classList.toggle('here', isHere);
    });
    G3.rd.render(G3.S, c);
  }
  function drawSvg() {
    var s = '';
    doms().forEach(function (d) {
      var r = 12 + (d.n - 1) * 14.5, cls = 'sha-ring' + (d.open ? ' on' : '') + (d.n === sel ? ' sel' : '') + (d.n === curDom() ? ' cur' : '');
      s += '<g class="' + cls + '" data-n="' + d.n + '" tabindex="0" role="button"><circle r="' + r + '" class="sha-c"/><circle r="' + r + '" class="sha-hit"/><text y="' + (-r + 4.2) + '" class="sha-t">' + ROMAN[d.n] + ' ' + d.zh + '</text></g>';
    });
    U.svg.innerHTML = s + '<circle r="1.8" fill="#7fd6ff"/>';
    [].forEach.call(U.svg.querySelectorAll('.sha-ring'), function (g) { g.addEventListener('click', function () { pick(+g.dataset.n); }); });
  }
  function pick(n) { sel = n; P('click'); if (!G3) drawSvg(); card(); }

  /* ---------------- 星域卡 ---------------- */
  function prog(n) {
    var ts = H() && H().tasksOf && n <= 7 ? H().tasksOf(n) : [], done = 0, live = 0;
    ts.forEach(function (t) { if (t.soon) return; live++; if (H().lit(t)) done++; });
    return { ts: ts, done: done, live: live };
  }
  function voySector(id) { return window.SH && SH.voyData ? SH.voyData.byId(id) : null; }
  function card() {
    var d = doms()[sel - 1]; if (!d) return;
    var F = H(), sec = voySector(SECTOR[d.n]), here = curDom() === d.n;
    var sc = d.conj ? '' : '<div class="sha-sc"><span>尺度约 <b>' + F.fmtKm(Math.pow(10, d.scale) / 1000) + '</b></span><span>光走 <b>' + F.fmtLight(Math.pow(10, d.scale) / 1000) + '</b></span></div>';
    var p = prog(d.n), list = p.ts.map(function (t) {
      return '<li class="' + (t.soon ? 'soon' : F.lit(t) ? 'lit' : '') + '">' + (t.soon ? '◌' : F.lit(t) ? '★' : '☆') + ' ' + t.q + (t.soon ? ' <em>即将</em>' : '') + '</li>';
    }).join('');
    U.card.innerHTML = '<small>星域 ' + ROMAN[d.n] + (d.g && d.g !== '—' ? ' · 守星人 ' + d.g : '') + (here ? ' · <span class="sha-here">你在这里</span>' : '') + '</small><h3>' + d.zh + '</h3>' +
      '<p class="sha-q">「' + Q[d.n] + '」</p><p class="sha-b">' + BLURB[d.n] + '</p>' + sc +
      (sec && sec.label ? '<p class="sha-b">航标:' + sec.label + '</p>' : '') +
      (d.open ? (p.ts.length ? '<div class="sha-pg">已点亮 ' + p.done + ' / ' + p.live + '</div><ul class="sha-ls">' + list + '</ul>' : '') : '<p class="sha-lock">' + (d.conj ? '这里没有 3D 场景,只能驾驶弦穹号去想象。' : '3D 场景还在建造中;可以先驾驶弦穹号飞过去看看。') + '</p>') +
      '<div class="sha-acts"></div>';
    var box = U.card.querySelector('.sha-acts');
    function btn(t, cls, fn) { var b = h('button', 'sha-go' + (cls ? ' ' + cls : ''), t); b.type = 'button'; b.onclick = fn; box.appendChild(b); }
    if (mode.voy) {
      if (here && d.open) btn('进入星域 ' + ROMAN[d.n] + ' 的 3D 场景 →', '', function () { close(); if (SH.voyLand) SH.voyLand(SECTOR[d.n]); });
      else if (!here) btn('设为目的地 · 选择引擎', '', function () { close(); if (SH.voySetTarget) SH.voySetTarget(SECTOR[d.n]); });
      else btn('留在这里看风景', 'alt', close);
    } else {
      if (d.open && !here) btn('跃迁前往星域 ' + ROMAN[d.n] + ' →', '', function () { close(); if (window.SHDOM) SHDOM.go(d.n); });
      if (d.open && here) btn('你已经在这里了', 'alt', close);
      if (window.SH && SH.voyEnter && !here) btn('🚀 驾驶弦穹号前往', d.open ? 'alt' : '', function () { close(); voyTo(SECTOR[d.n]); });
    }
  }
  function voyTo(id) {
    SH.voyEnter(); var k = 0;
    (function w() { if (SH.voyReady && SH.voyReady()) { if (SH.voySetTarget) SH.voySetTarget(id); } else if (k++ < 120) setTimeout(w, 250); })();
  }

  function open(opts) {
    mode = opts || {}; mode.voy = !!mode.voy;
    if (!H() || !H().DOMAINS) { return; }
    if (!U.root) build();
    sel = curDom(); U.root.hidden = false; U.root.classList.toggle('sha--voy', mode.voy); document.body.classList.add('sha-on');
    if (G3) { G3.auto = 1; cancelAnimationFrame(raf); raf = requestAnimationFrame(frame); } else drawSvg();
    card(); P('open');
  }
  function close() { if (!U.root || U.root.hidden) return; U.root.hidden = true; document.body.classList.remove('sha-on'); cancelAnimationFrame(raf); P('close'); }
  window.SHATLAS = { open: open, close: close, isOpen: function () { return !!U.root && !U.root.hidden; }, _sel: function () { return sel; } };
})();
