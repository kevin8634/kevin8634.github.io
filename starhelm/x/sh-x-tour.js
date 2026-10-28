/* 天枢 2.0 · C2.2c 太阳系一镜到底导览(约 42 秒)
 * 入口:目标面板「太阳系导览」键 / SHXT.start()。
 * 镜头:从奥尔特云尺度(约 2,600 AU)沿对数距离一路推近到小行星带,最后停在约 55 AU 的全景,可自由操作。
 * 段落:奥尔特云内缘(推测)→ 日球层(终端激波/日鞘/日球层顶)→ 五个逃逸飞行器 → 柯伊伯带与冥王星 → 三颗彗星轨道
 *       → 八大行星轨道依次点亮 → 小行星带与木星 → 全景。每段 1–2 个标签 + 一行字幕。
 * 打断:点击 / 滚轮 / 任意键(含 Esc)立即停在当前位置;减少动态时改为分段静态切换。
 * 数据:飞行器方位与距离取 heavens-above.com「Spacecraft escaping the Solar System」(2026-10 读取),按其给出的日心速度线性外推;
 *       外段轨迹画成直线(示意),行星借力弯折的内段未画。带状天体为示意粒子,不是真实小天体位置。 */
(function () {
  'use strict';
  var X = null, T = null, AU = 149597870.7, EPS = 23.4392911 * Math.PI / 180, RAD = Math.PI / 180;
  var ON = false, t0 = 0, seg = -1, ui = null, G = null, saved = null, endT = 0, rm = false;
  var EP = Date.UTC(2026, 9, 28);   // 飞行器数据读取日(外推起点)
  var PROBES = [   // [中文, RA(h), Dec(°), 日心距(AU), AU/年, 状态]
    ['旅行者 1 号', 17.25, 12.13, 172.20, 3.569, '仍在工作'],
    ['旅行者 2 号', 20.083, -59.80, 144.24, 3.218, '仍在工作'],
    ['新视野号', 19.25, -20.30, 65.88, 2.861, '仍在工作'],
    ['先驱者 10 号', 5.25, 26.03, 142.14, 2.502, '2003 年失联'],
    ['先驱者 11 号', 18.90, -8.98, 119.53, 2.346, '1995 年失联']
  ];
  // 关键帧:R 日心距(AU)、el 仰角(°)、d 本段时长(s)、cap 字幕、show 本段显示的自绘标签/图层、hl 高亮
  var KF = [
    { R: 2600, el: 22, d: 5, cap: '奥尔特云内缘 · 约 2,000 AU 起(推测,从未被直接观测)。太阳在这里只是一颗很亮的星。', tag: '推测' },
    { R: 430, el: 18, d: 6.5, cap: '日球层:太阳风吹出的气泡。终端激波约 94 AU,日鞘之外约 120 AU 是日球层顶——旅行者号实测。外形仍有争议。', tag: '已证实 · 外形推测' },
    { R: 250, el: 32, d: 6, cap: '五个正在离开太阳系的飞行器:旅行者 1/2 号与新视野号仍在工作,先驱者 10/11 号早已失联。', show: 'probe', tag: '已证实' },
    { R: 95, el: 26, d: 5.5, cap: '柯伊伯带 · 30–50 AU 的冰质小天体带,冥王星是其中最有名的一员。', show: 'kuiper', hl: ['pluto'], tag: '已证实 · 粒子示意' },
    { R: 62, el: 38, d: 5, cap: '彗星轨道:哈雷(约 76 年)、67P(约 6.4 年)、海尔-波普(约 2,400 年)。', hl: ['halley', '67p', 'halebopp'], comet: 1, tag: '已证实' },
    { R: 42, el: 52, d: 6.5, cap: '八大行星轨道由外向内依次点亮:海王星、天王星、土星、木星,再到火星、地球、金星、水星。', planets: 1, tag: '已证实' },
    { R: 7.5, el: 48, d: 5, cap: '小行星带 · 约 2.1–3.3 AU,夹在火星与木星之间,总质量不到月球的 4%。', show: 'belt', hl: ['jupiter'], tag: '已证实 · 粒子示意' },
    { R: 55, el: 42, d: 3, cap: '太阳系全景 · 导览结束,可以自由操作了。', end: 1 }
  ];
  var ORDER = ['neptune', 'uranus', 'saturn', 'jupiter', 'mars', 'earth', 'venus', 'mercury'];

  function eq3(raH, decD, au) {   // 赤道 J2000 → three(y=黄北),与驾驶舱 eq2three 同法
    var ra = raH * 15 * RAD, de = decD * RAD, x = Math.cos(de) * Math.cos(ra), y = Math.cos(de) * Math.sin(ra), z = Math.sin(de);
    var ye = y * Math.cos(EPS) + z * Math.sin(EPS), ze = -y * Math.sin(EPS) + z * Math.cos(EPS);
    return [x * au * AU, ze * au * AU, -ye * au * AU];
  }
  function dir(az, el) { az *= RAD; el *= RAD; return [Math.cos(el) * Math.cos(az), Math.sin(el), -Math.cos(el) * Math.sin(az)]; }
  function now() { return window.SHTIME && SHTIME.now ? SHTIME.now() : new Date(); }
  function ss(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }
  function rnd(s) { return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }

  function css() {
    if (document.getElementById('xt-css')) return;
    var s = document.createElement('style'); s.id = 'xt-css';
    s.textContent = '#xt-ui{position:absolute;left:50%;bottom:150px;transform:translateX(-50%);width:min(680px,calc(100vw - 24px));z-index:40;pointer-events:none;text-align:center}' +
      '#xt-ui .cap{display:inline-block;padding:9px 16px;border-radius:12px;background:rgba(6,12,26,.66);border:1px solid rgba(120,200,255,.25);color:#e6f0ff;font-size:14px;line-height:1.55;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);transition:opacity .4s}' +
      '#xt-ui .tg{display:inline-block;margin-left:8px;padding:0 7px;border-radius:9px;font-size:11px;color:#bfe6ff;border:1px solid rgba(120,200,255,.35)}' +
      '#xt-ui .pg{display:flex;gap:4px;justify-content:center;margin-top:8px}#xt-ui .pg i{width:26px;height:3px;border-radius:2px;background:rgba(160,190,230,.25)}#xt-ui .pg i.on{background:#7fd6ff}#xt-ui .pg i.dn{background:rgba(127,214,255,.55)}' +
      '#xt-ui .hint{margin-top:6px;font-size:11px;color:rgba(200,215,240,.6)}' +
      '.xt-lb{position:absolute;left:0;top:0;z-index:6;pointer-events:none;white-space:nowrap;font-size:11.5px;color:#e8f0ff;text-shadow:0 0 4px #000,0 0 8px #000;transition:opacity .4s}.xt-lb::before{content:"";display:inline-block;width:6px;height:6px;border-radius:50%;background:currentColor;margin-right:5px;vertical-align:1px}.xt-lb small{opacity:.65;margin-left:4px}' +
      '#shxc.xt-on .p.nav,#shxc.xt-on .p.lst,#shxc.xt-on .p.tgt{filter:opacity(0);pointer-events:none}#shxc.xt-on .p.clk{filter:opacity(.38)}' +
      '@media (max-width:640px){#xt-ui{bottom:236px}#shxc.xt-on .mob{opacity:.25}#xt-ui .cap{font-size:12.5px;padding:7px 11px}.xt-lb{font-size:10.5px}}';
    document.head.appendChild(s);
  }

  /* ---------- 导览专用图层(加到驾驶舱轨道场景,真实 km 坐标) ---------- */
  function ring(n, a0, a1, inc, col, size, seed) {
    var r = rnd(seed), p = new Float32Array(n * 3);
    for (var i = 0; i < n; i++) {
      var a = (a0 + (a1 - a0) * Math.pow(r(), .8)) * AU, th = r() * Math.PI * 2, h = (r() - .5) * 2 * Math.tan(inc * RAD) * a * r();
      p[i * 3] = Math.cos(th) * a; p[i * 3 + 1] = h; p[i * 3 + 2] = Math.sin(th) * a;
    }
    var g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(p, 3));
    var m = new T.PointsMaterial({ color: col, size: size, sizeAttenuation: false, transparent: true, opacity: 0, depthWrite: false });
    var o = new T.Points(g, m); o.frustumCulled = false; return o;
  }
  function build() {
    if (G) return true;
    var orb = X._.orb && X._.orb(); if (!orb || !T) return false;
    G = { grp: new T.Group(), probes: [], lbs: [] };
    G.belt = ring(rm ? 900 : 1800, 2.1, 3.3, 9, 0xc9b79a, 1.6, 7); G.kuiper = ring(rm ? 1400 : 2800, 30, 50, 12, 0x9fc3e6, 1.4, 11);
    G.grp.add(G.belt); G.grp.add(G.kuiper);
    var yrs = (now().getTime() - EP) / 3.15576e10;
    PROBES.forEach(function (p, i) {
      var d = p[3] + p[4] * yrs, end = eq3(p[1], p[2], d), st = eq3(p[1], p[2], 12);
      var g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(new Float32Array(st.concat(end)), 3));
      var col = p[5] === '仍在工作' ? 0x9fe8ff : 0xb8b0c8;
      var l = new T.Line(g, new T.LineBasicMaterial({ color: col, transparent: true, opacity: 0, depthWrite: false })); l.frustumCulled = false;
      G.grp.add(l); G.probes.push({ l: l, p: end, nm: p[0], d: d, st: p[5] });
    });
    orb.add(G.grp);
    return true;
  }
  function lb(txt, sub, col) {
    var d = document.createElement('div'); d.className = 'xt-lb'; d.innerHTML = txt + (sub ? '<small>' + sub + '</small>' : ''); d.style.color = col || '#e8f0ff'; d.style.opacity = 0;
    X._.root().appendChild(d); G.lbs.push(d); return d;
  }
  function labelsInit() {
    G.lbs.forEach(function (d) { d.remove(); }); G.lbs = [];
    G.probes.forEach(function (p) { p.el = lb(p.nm, Math.round(p.d) + ' AU · ' + p.st, p.st === '仍在工作' ? '#9fe8ff' : '#c8c0d8'); });
    G.beltL = { el: lb('小行星带', '2.1–3.3 AU', '#e6d3ae'), p: [2.7 * AU * Math.cos(.6), 0, 2.7 * AU * Math.sin(.6)] };
    G.kuiL = { el: lb('柯伊伯带', '30–50 AU', '#a9cdf0'), p: [44 * AU * Math.cos(2.2), 0, 44 * AU * Math.sin(2.2)] };
  }
  var tv = null, tq = null;
  function place(o, on, W, H) {
    if (!on) { o.el.style.opacity = 0; return; }
    // 手算投影(主相机 far 只有 1e7 km,远处飞行器会被裁掉):视空间 = 相对位置 × 姿态逆;竖直视场 60°
    var S = X._.S; tq.copy(S.q).invert();
    tv.set(o.p[0] - S.pos[0], o.p[1] - S.pos[1], o.p[2] - S.pos[2]).applyQuaternion(tq);
    var fy = 1 / Math.tan(30 * RAD), fx = fy * H / W, vis = tv.z < 0, x = 0, y = 0;
    if (vis) { x = (tv.x / -tv.z * fx + 1) * W / 2; y = (1 - tv.y / -tv.z * fy) * H / 2; vis = x > 0 && x < W - 40 && y > 0 && y < H; }
    o.el.style.opacity = vis ? 1 : 0;
    if (vis) o.el.style.transform = 'translate(' + (x - 4).toFixed(0) + 'px,' + (y - 8).toFixed(0) + 'px)';
  }

  /* ---------- 轨道高亮 ---------- */
  function orbLines() { var out = []; var orb = X._.orb(); if (orb) orb.traverse(function (o) { if (o.isLine && o.userData && o.userData.id) out.push(o); }); return out; }
  function orbitsTo(fn) { orbLines().forEach(function (l) { var v = fn(l); if (v != null) l.material.opacity = v; }); }
  function orbitsReset() { orbitsTo(function (l) { return l.userData.op; }); }

  /* ---------- 镜头 ---------- */
  function stateOf() {
    var S = X._.S, r = Math.hypot(S.pos[0], S.pos[1], S.pos[2]) / AU || 1;
    return { R: Math.max(r, .05), el: Math.asin(Math.max(-1, Math.min(1, S.pos[1] / (r * AU)))) / RAD, az: Math.atan2(-S.pos[2], S.pos[0]) / RAD };
  }
  var AZ0 = 95, AZ1 = 175, TOT = 0;
  function pose(R, el, az) {
    var S = X._.S, d = dir(az, el), p = [d[0] * R * AU, d[1] * R * AU, d[2] * R * AU];
    S.pos[0] = p[0]; S.pos[1] = p[1]; S.pos[2] = p[2];
    var f = new T.Vector3(-p[0], -p[1], -p[2]).normalize();
    var q = new T.Quaternion().setFromRotationMatrix(new T.Matrix4().lookAt(new T.Vector3(), f, new T.Vector3(0, 1, 0)));
    if (S.q && S.q.copy) S.q.copy(q); else S.q = q;
  }

  function start() {
    if (!X || !X.isOpen || !X.isOpen()) return false;
    T = window.THREE; tv = tv || new T.Vector3(); tq = tq || new T.Quaternion(); rm = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
    if (!build()) return false;
    css(); stop(true);
    var S = X._.S; saved = stateOf();
    S.base = 0; S.auto = false; S.align = false; S.capV = 0; S.tour = true; ON = true;
    TOT = 0; KF.forEach(function (k) { TOT += k.d; }); TOT += 3;   // 前 3 秒:从当前位置拉到起始机位
    t0 = performance.now(); seg = -1; endT = 0;
    var root = X._.root(); root.classList.add('xt-on');
    ui = document.createElement('div'); ui.id = 'xt-ui';
    ui.innerHTML = '<div class="cap"><span class="tx">太阳系导览 · 起飞</span><span class="tg"></span></div><div class="pg">' + KF.map(function () { return '<i></i>'; }).join('') + '</div><div class="hint">点击 · 滚轮 · 任意键 可随时停下自由操作</div>';
    root.appendChild(ui); labelsInit();
    setTimeout(function () { if (!ON) return; addEventListener('pointerdown', intr, true); addEventListener('wheel', intr, { capture: true, passive: true }); addEventListener('keydown', intr, true); }, 300);
    if (X._.toast) X._.toast('太阳系导览 · 约 45 秒');
    return true;
  }
  function intr(e) {
    if (!ON) return;
    if (e.type === 'keydown') { e.preventDefault(); e.stopImmediatePropagation(); }
    stop(false, true);
  }
  function stop(silent, byUser) {
    removeEventListener('pointerdown', intr, true); removeEventListener('wheel', intr, true); removeEventListener('keydown', intr, true);
    var was = ON; ON = false;
    if (X && X._) { X._.S.tour = false; var root = X._.root(); if (root) root.classList.remove('xt-on'); }
    if (ui) { ui.remove(); ui = null; }
    if (G) { G.lbs.forEach(function (d) { d.style.opacity = 0; }); G.fade = performance.now(); }
    if (was) { orbitsReset(); if (!silent && X._.toast) X._.toast(byUser ? '导览已停下 · 自由操作' : '导览结束 · 太阳系全景'); }
  }

  function frame() {
    if (!G) return;
    var nowp = performance.now();
    if (!ON) {   // 结束后带状粒子与轨迹 2.5 秒淡出
      if (G.fade) { var k = 1 - Math.min(1, (nowp - G.fade) / 2500); G.belt.material.opacity *= k; G.kuiper.material.opacity *= k; G.probes.forEach(function (p) { p.l.material.opacity *= k; }); if (k <= 0) G.fade = 0; }
      return;
    }
    var t = (nowp - t0) / 1000, root = X._.root(), W = root.clientWidth, H = root.clientHeight;
    var az = AZ0 + (AZ1 - AZ0) * Math.min(1, t / TOT);
    // 当前段
    var acc = 3, i = -1, u = 0;
    if (t >= 3) { for (var j = 0; j < KF.length; j++) { if (t < acc + KF[j].d) { i = j; u = (t - acc) / KF[j].d; break; } acc += KF[j].d; } if (i < 0) { i = KF.length - 1; u = 1; } }
    var k = KF[Math.max(0, i)], prev = i <= 0 ? (i < 0 ? saved : KF[0]) : KF[i - 1];
    if (i < 0) { u = t / 3; prev = saved; }
    var mv = rm ? 1 : ss(i < 0 ? u : u / .6);
    if (i === 0) mv = 1;
    var R = Math.exp(Math.log(prev.R) + (Math.log(k.R) - Math.log(prev.R)) * mv), el = prev.el + (k.el - prev.el) * mv;
    if (i < 0) az = (saved.az + ((AZ0 - saved.az + 540) % 360 - 180) * mv);
    if (rm) { R = k.R; el = k.el; az = AZ0 + (AZ1 - AZ0) * (Math.max(0, i) / (KF.length - 1)); }
    pose(R, el, az);
    if (i !== seg) {
      seg = i;
      if (i >= 0 && ui) {
        ui.querySelector('.tx').textContent = k.cap; var tg = ui.querySelector('.tg'); tg.textContent = k.tag || ''; tg.style.display = k.tag ? '' : 'none';
        ui.querySelectorAll('.pg i').forEach(function (e, n) { e.className = n < i ? 'dn' : n === i ? 'on' : ''; });
      }
    }
    // 图层透明度
    var fIn = Math.min(1, u * 3), sh = k.show;
    var bO = sh === 'belt' ? .7 * fIn : (i > 6 ? .35 : Math.max(0, G.belt.material.opacity - .02));
    var kO = sh === 'kuiper' ? .6 * fIn : (i > 3 ? .22 : Math.max(0, G.kuiper.material.opacity - .02));
    G.belt.material.opacity = bO; G.kuiper.material.opacity = kO;
    G.probes.forEach(function (p) { p.l.material.opacity = sh === 'probe' ? .75 * fIn : (i > 2 ? .25 : 0); });
    // 轨道:彗星段只亮彗星;行星段由外向内依次点亮
    if (k.comet) orbitsTo(function (l) { return l.userData.comet ? .25 + .6 * fIn : .08; });
    else if (k.planets) orbitsTo(function (l) { var n = ORDER.indexOf(l.userData.id); if (n < 0) return .06; return .08 + .8 * ss((u * 1.25 - n / 8) * 6); });
    else if (i >= 0 && i < 4) orbitsTo(function (l) { return l.userData.op * .5; });
    else if (k.end || i === 6) orbitsReset();
    // 自绘标签:每段 1–2 个(飞行器段显示五个,但 LOD 外另成一组,字号小)
    G.probes.forEach(function (p) { place({ el: p.el, p: p.p }, sh === 'probe', W, H); });
    place(G.beltL, sh === 'belt', W, H); place(G.kuiL, sh === 'kuiper', W, H);
    if (t >= TOT) stop(false, false);
  }

  function hook(ev) {
    if (ev === 'frame') frame();
    else if (ev === 'close') { stop(true); if (G) { G.lbs.forEach(function (d) { d.remove(); }); } G = null; }
  }
  function btn() {   // 目标面板里加「太阳系导览」键
    var root = X._.root && X._.root(); if (!root || root.querySelector('#xc-tour')) return;
    var ap = root.querySelector('#xc-ap'); if (!ap) return;
    var b = document.createElement('button'); b.className = 'btn'; b.id = 'xc-tour'; b.type = 'button'; b.textContent = '太阳系导览'; b.title = '约 45 秒一镜到底:奥尔特云 → 日球层 → 飞行器 → 柯伊伯带 → 彗星 → 行星轨道 → 小行星带';
    b.onclick = function (e) { e.stopPropagation(); start(); };
    ap.parentNode.appendChild(b);
  }
  (function wait(n) {
    if (window.SHXC && SHXC.on) { X = SHXC; SHXC.on(function (ev, a) { if (ev === 'open') setTimeout(btn, 50); hook(ev, a); }); if (SHXC.isOpen()) setTimeout(btn, 50); return; }
    if (n < 100) setTimeout(function () { wait(n + 1); }, 100);
  })(0);
  window.SHXT = { start: start, stop: function () { stop(false, true); }, on: function () { return ON; } };
})();
