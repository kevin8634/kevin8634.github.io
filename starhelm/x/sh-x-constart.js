/* 天枢 Starhelm 2.0 · C2.0 星座插画 + 星座名标签(SHXCA)
 * - 插画:Stellarium 西方(modern)天空文化,Johan Meuris 绘,Free Art License 1.3(x/vendor/FAL-1.3.txt);转灰度 WebP 放在 x/constart/。
 * - 对齐:每幅图 3 个锚星(Stellarium index.json 的 HIP + 像素坐标;锚星 3D 位置取 HYG v4.1,见 x/sh-x-constart-data.js)。
 *   像素 → 3 锚星当前方向张成的平面(仿射,3 点精确对上)→ 归一化到天球 r=880,8×8 网格贴图,加法混合、低透明度。
 * - 视差:锚星方向按飞船位置实时重算(和 sh-x-deep.js 的连线同一套 HYG 坐标);
 *   太阳系内等同无穷远天球。锚星三角形相对从太阳看的形状变形超过约 13% 起淡出、约 40% 全隐,
 *   或离任一锚星 <0.5 光年时隐去——这时古典星座图已失去意义,连线仍保留实际 3D 变形。
 * - K 键(sh-x-deep.js):连线 → 连线+插画 → 关;本模块只在「连线+插画」档首次打开时按视线方向就近加载贴图。
 *   手机(短边 <700 或内存 <4 GB)用 ≤256 px 版本;「减少动态」时开关不做淡入淡出。
 */
(function () {
  'use strict';
  var AU = 149597870.7, LY = 9.4607304725808e12, EPS = 23.4392911 * Math.PI / 180, R = 880, N = 8;
  var T, X, inited = false, grp, items = [], lab, lastP = null, lastT = 0, artA = 0, labA = 0, active = 0, wantLoad = false, keysAdded = false;
  var small = Math.min(screen.width, screen.height) < 700 || (navigator.deviceMemory && navigator.deviceMemory < 4);
  var MAXLOAD = small ? 3 : 5;
  function reduced() { return matchMedia('(prefers-reduced-motion: reduce)').matches; }
  function eq3(x, y, z) { return [x, -y * Math.sin(EPS) + z * Math.cos(EPS), -(y * Math.cos(EPS) + z * Math.sin(EPS))]; }
  function nrm(v) { var l = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; }
  function ang(a, b) { return Math.acos(Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]))); }
  function sstep(a, b, x) { var t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); }

  function css() {
    if (document.getElementById('xq-css')) return;
    var s = document.createElement('style'); s.id = 'xq-css';
    s.textContent = '#xq-lab{position:absolute;inset:0;pointer-events:none;z-index:2;overflow:hidden}' +
      '#xq-lab .cl{position:absolute;left:0;top:0;white-space:nowrap;text-align:center;transform:translate(-50%,-50%);color:rgba(196,210,238,.78);font:12px/1.25 "Noto Sans SC",system-ui,sans-serif;letter-spacing:.14em;text-shadow:0 0 6px #01030c,0 0 12px #01030c;will-change:transform}' +
      '#xq-lab .cl i{display:block;font-style:normal;font-size:9.5px;letter-spacing:.22em;color:rgba(150,170,215,.62);text-transform:uppercase}' +
      '@media (max-width:700px){#xq-lab .cl{font-size:10.5px;letter-spacing:.08em}#xq-lab .cl i{font-size:8.5px;letter-spacing:.12em}}' +
      '@media (max-width:430px){#shxc .mob{gap:4px}#shxc .mob .btn{padding-left:8px;padding-right:8px}}';
    document.head.appendChild(s);
  }

  function init() {
    T = window.THREE; X = window.SHXC; var sky = X && X._ && X._.sky && X._.sky(), root = X && X._ && X._.root && X._.root();
    if (!T || !sky || !root || !window.SHX_CONSTART || !window.SHXD) return false;
    css();
    grp = new T.Group(); grp.renderOrder = -6; grp.visible = false; sky.add(grp);
    lab = document.createElement('div'); lab.id = 'xq-lab'; lab.setAttribute('aria-hidden', 'true');
    var gl = root.querySelector('canvas'); if (gl && gl.nextSibling) root.insertBefore(lab, gl.nextSibling); else root.appendChild(lab);
    SHX_CONSTART.forEach(function (c) {
      var it = { ab: c[0], lat: c[1], zh: c[2], fn: c[3], w: c[4], h: c[5], sm: c[6], A: c[7].map(function (a) { return eq3(a[2], a[3], a[4]); }), P: c[7].map(function (a) { return [a[0], a[1]]; }), la: c[8][0], lb: c[8][1], k: 1, s: null, mesh: null, st: 0 };
      // 参考形状:从太阳看的三角形边长(角距)
      var s0 = it.A.map(nrm); it.ref = [ang(s0[0], s0[1]), ang(s0[1], s0[2]), ang(s0[2], s0[0])];
      if (it.fn) {   // 网格顶点的像素 → 锚点重心系数 (a,b):p = p1 + a(p2−p1) + b(p3−p1)
        var p = it.P, ux = p[1][0] - p[0][0], uy = p[1][1] - p[0][1], vx = p[2][0] - p[0][0], vy = p[2][1] - p[0][1], det = ux * vy - uy * vx;
        it.ab2 = new Float32Array((N + 1) * (N + 1) * 2);
        for (var j = 0; j <= N; j++) for (var i = 0; i <= N; i++) {
          var px = it.w * i / N - p[0][0], py = it.h * j / N - p[0][1], o = (j * (N + 1) + i) * 2;
          it.ab2[o] = (px * vy - py * vx) / det; it.ab2[o + 1] = (ux * py - uy * px) / det;
        }
      }
      var d = document.createElement('div'); d.className = 'cl'; d.innerHTML = it.zh + '<i>' + it.lat + '</i>'; d.style.display = 'none'; lab.appendChild(d); it.el = d;
      items.push(it);
    });
    addKeys(root);
    inited = true; return true;
  }
  // 操作说明里补 K 键;手机底部按钮条补「星座」
  function addKeys(root) {
    if (keysAdded) return; keysAdded = true;
    var kg = root.querySelector('#xc-keys .kg'); if (kg) { var k = document.createElement('kbd'); k.textContent = 'K'; var s = document.createElement('span'); s.textContent = '星座'; kg.appendChild(k); kg.appendChild(s); }
    var cr = root.querySelector('.credit'); if (cr && cr.textContent.indexOf('Meuris') < 0) cr.appendChild(document.createTextNode(' · 星座插画 Johan Meuris / Stellarium(Free Art License 1.3)· 星表 HYG v4.1(CC BY-SA 4.0)'));
    var mob = root.querySelector('.mob'); if (mob) { var b = document.createElement('button'); b.className = 'btn'; b.type = 'button'; b.textContent = '星座'; b.onclick = function () { SHXD.cycle(); }; var g = mob.querySelector('[data-k="g"]'); mob.insertBefore(b, g || null); }
  }

  function buildMesh(it) {
    var n = (N + 1) * (N + 1), g = new T.BufferGeometry(), uv = new Float32Array(n * 2), idx = [];
    for (var j = 0; j <= N; j++) for (var i = 0; i <= N; i++) { var o = (j * (N + 1) + i) * 2; uv[o] = i / N; uv[o + 1] = 1 - j / N; }
    for (j = 0; j < N; j++) for (i = 0; i < N; i++) { var a = j * (N + 1) + i, b = a + 1, c = a + N + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
    g.setAttribute('position', new T.BufferAttribute(new Float32Array(n * 3), 3)); g.setAttribute('uv', new T.BufferAttribute(uv, 2)); g.setIndex(idx);
    var m = new T.MeshBasicMaterial({ map: it.tex, color: 0xc2cff0, transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false, depthTest: false, side: T.DoubleSide, toneMapped: false });
    it.mesh = new T.Mesh(g, m); it.mesh.renderOrder = -6; grp.add(it.mesh);
    if (it.s) place(it);
  }
  function load(it) {
    it.st = 1; active++;
    var tex = new T.Texture(); tex.encoding = T.sRGBEncoding; tex.minFilter = T.LinearMipmapLinearFilter; tex.magFilter = T.LinearFilter; tex.generateMipmaps = true;
    var img = new Image(); img.decoding = 'async';
    img.onload = function () { active--; tex.image = img; tex.needsUpdate = true; it.tex = tex; it.st = 2; buildMesh(it); };
    img.onerror = function () { active--; it.st = 3; };
    img.src = 'x/constart/' + (small && it.sm ? 's/' : '') + it.fn + '.webp';   // <base href="../"> → /starhelm/x/constart/
  }
  // 按与视线的夹角排队,同时最多 MAXLOAD 张
  function pump() {
    if (!wantLoad || active >= MAXLOAD) return;
    var q = X._.S.q, f = new T.Vector3(0, 0, -1).applyQuaternion(q), best = null, bd = 9;
    items.forEach(function (it) { if (!it.fn || it.st || !it.s) return; var c = it.s[0], d = ang([f.x, f.y, f.z], c); if (d < bd) { bd = d; best = it; } });
    if (best) { load(best); pump(); }
  }

  function place(it) {
    var s = it.s, e1 = [s[1][0] - s[0][0], s[1][1] - s[0][1], s[1][2] - s[0][2]], e2 = [s[2][0] - s[0][0], s[2][1] - s[0][1], s[2][2] - s[0][2]];
    if (it.mesh && it.k > 0) {
      var pa = it.mesh.geometry.attributes.position.array, ab = it.ab2;
      for (var v = 0; v < ab.length / 2; v++) {
        var a = ab[v * 2], b = ab[v * 2 + 1], x = s[0][0] + a * e1[0] + b * e2[0], y = s[0][1] + a * e1[1] + b * e2[1], z = s[0][2] + a * e1[2] + b * e2[2], l = Math.sqrt(x * x + y * y + z * z) || 1;
        pa[v * 3] = x / l * R; pa[v * 3 + 1] = y / l * R; pa[v * 3 + 2] = z / l * R;
      }
      it.mesh.geometry.attributes.position.needsUpdate = true; it.mesh.geometry.computeBoundingSphere();
    }
    it.L = nrm([s[0][0] + it.la * e1[0] + it.lb * e2[0], s[0][1] + it.la * e1[1] + it.lb * e2[1], s[0][2] + it.la * e1[2] + it.lb * e2[2]]);
  }
  function update(S) {
    var sx = S.pos[0] / LY, sy = S.pos[1] / LY, sz = S.pos[2] / LY;
    items.forEach(function (it) {
      var dmin = 1e9;
      it.s = it.A.map(function (p) { var d = [p[0] - sx, p[1] - sy, p[2] - sz], l = Math.sqrt(d[0] * d[0] + d[1] * d[1] + d[2] * d[2]); dmin = Math.min(dmin, l); return nrm(d); });
      var now = [ang(it.s[0], it.s[1]), ang(it.s[1], it.s[2]), ang(it.s[2], it.s[0])], q = 0;
      for (var i = 0; i < 3; i++) q = Math.max(q, Math.abs(Math.log(Math.max(1e-6, now[i]) / it.ref[i])));
      it.k = dmin < 0.5 ? 0 : 1 - sstep(0.12, 0.35, q);
      place(it);
    });
  }

  var tv = null, tq = null;
  function labels(W, H) {
    var show = labA > 0.01; lab.style.display = show ? '' : 'none'; if (!show) return;
    tq.copy(X._.S.q).invert();
    var fy = 1 / Math.tan(30 * Math.PI / 180), fx = fy * H / W, op = labA.toFixed(3);
    lab.style.opacity = op;
    items.forEach(function (it) {
      var vis = false;
      if (it.L && it.k > 0.05) {
        tv.set(it.L[0], it.L[1], it.L[2]).applyQuaternion(tq);
        if (tv.z < -0.05) { var x = (tv.x / -tv.z * fx + 1) * W / 2, y = (1 - tv.y / -tv.z * fy) * H / 2; if (x > -80 && x < W + 80 && y > -40 && y < H + 40) { vis = true; it.el.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) translate(-50%,-50%)'; it.el.style.opacity = it.k.toFixed(2); } }
      }
      if (vis !== it.vis) { it.el.style.display = vis ? '' : 'none'; it.vis = vis; }
    });
  }

  function hook(ev, a) {
    if (ev === 'close') { if (lab) lab.style.display = 'none'; return; }
    if (ev !== 'frame') return;
    if (!inited && !init()) return;
    if (!tv) { tv = new T.Vector3(); tq = new T.Quaternion(); }
    var S = X._.S, mode = SHXD.mode(), lf = SHXD.lf ? SHXD.lf() : 0, dt = Math.min(0.1, (a && a.dt) || 0.016), rm = reduced();
    var tA = mode === 1 ? 1 : 0;
    artA = rm ? tA : artA + (tA - artA) * Math.min(1, dt * 3);
    labA = lf;
    if (tA && !wantLoad) wantLoad = true;
    var now = performance.now();
    if ((artA > 0.001 || labA > 0.01) && (!lastP || now - lastT > 250)) {
      var mv = lastP ? Math.hypot(S.pos[0] - lastP[0], S.pos[1] - lastP[1], S.pos[2] - lastP[2]) : Infinity;
      if (mv > 0.5 * AU) { update(S); lastP = S.pos.slice(); }
      lastT = now;
    }
    pump();
    grp.visible = artA > 0.001;
    if (grp.visible) items.forEach(function (it) { if (it.mesh) { it.mesh.visible = it.k > 0.001; it.mesh.material.opacity = 0.34 * artA * it.k; } });
    var root = X._.root(); labels(root.clientWidth || innerWidth, root.clientHeight || innerHeight);
  }
  (function wait(n) { if (window.SHXC && SHXC.on) { SHXC.on(hook); return; } if (n < 100) setTimeout(function () { wait(n + 1); }, 100); })(0);
  window.SHXCA = {
    state: function () { var L = 0, F = 0; items.forEach(function (it) { if (it.st === 2) L++; if (it.st === 3) F++; }); return { inited: inited, n: items.length, art: items.filter(function (i) { return i.fn; }).length, loaded: L, failed: F, artA: artA, labA: labA, small: small }; },
    // 调试:某星座锚点/任意 HIP 锚星当前在屏幕上的像素位置
    project: function (ab) { var it = items.filter(function (i) { return i.ab === ab; })[0]; if (!it || !it.s) return null; var root = X._.root(), W = root.clientWidth, H = root.clientHeight, q = X._.S.q.clone().invert(), fy = 1 / Math.tan(Math.PI / 6), fx = fy * H / W;
      return it.s.concat([it.L]).map(function (d) { var v = new T.Vector3(d[0], d[1], d[2]).applyQuaternion(q); return v.z < 0 ? [(v.x / -v.z * fx + 1) * W / 2, (1 - v.y / -v.z * fy) * H / 2] : null; }); },
    item: function (ab) { return items.filter(function (i) { return i.ab === ab; })[0]; }
  };
})();
