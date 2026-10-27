/* 天枢号 C1.9b · 点选任意恒星(HYG v4.1 星表 4,268 颗,CC BY-SA 4.0)
 * 单击星空(拖动不算)→ 找屏幕上 14 px 内最亮的星 → 选定框 + 资料卡。
 * 视星等按飞船当前位置实时计算;光谱型与表面温度由 B−V 色指数估算(Ballesteros 2012),资料卡注明「按颜色估算」。 */
(function () {
  'use strict';
  var LY = 9.4607304725808e12, EPS = 23.4392911 * Math.PI / 180, X, T, ST = null, SEL = -1, box = null, card = null, dn = null;
  function decode() {
    var R = window.SH_STARS; if (!R) return null;
    var bin = atob(R.d), n = R.n, dv = new DataView(new ArrayBuffer(bin.length)), i;
    for (i = 0; i < bin.length; i++) dv.setUint8(i, bin.charCodeAt(i));
    var Q = new Float32Array(n * 3), P = new Float32Array(n * 3), M = new Float32Array(n), BV = new Float32Array(n);
    for (var k = 0; k < n; k++) {
      var o = k * 10, x = dv.getInt16(o, true) / 10, y = dv.getInt16(o + 2, true) / 10, z = dv.getInt16(o + 4, true) / 10;
      Q[k * 3] = x; Q[k * 3 + 1] = y; Q[k * 3 + 2] = z;
      var yy = y * Math.cos(EPS) + z * Math.sin(EPS), zz = -y * Math.sin(EPS) + z * Math.cos(EPS);
      P[k * 3] = x; P[k * 3 + 1] = zz; P[k * 3 + 2] = -yy;
      M[k] = dv.getInt16(o + 6, true) / 100; var c = dv.getInt16(o + 8, true); BV[k] = c === 32767 ? NaN : c / 1000;
    }
    return { n: n, Q: Q, P: P, M: M, BV: BV };
  }
  function shipLy() { var p = X._.S.pos; return [p[0] / LY, p[1] / LY, p[2] / LY]; }
  function appMag(k, s) { var P = ST.P, d = Math.hypot(P[k * 3] - s[0], P[k * 3 + 1] - s[1], P[k * 3 + 2] - s[2]) / 3.26156; return ST.M[k] + 5 * Math.log10(Math.max(d, 1e-9)) - 5; }
  function scr(k, s, cam, W, H) {   // 恒星方向 → 屏幕像素
    var P = ST.P, v = new T.Vector3(P[k * 3] - s[0], P[k * 3 + 1] - s[1], P[k * 3 + 2] - s[2]);
    if (v.lengthSq() < 1e-12) return null; v.normalize().transformDirection(cam.matrixWorldInverse);
    if (v.z >= 0) return null; var e = cam.projectionMatrix.elements;
    return [(e[0] * v.x / -v.z + 1) * W / 2, (1 - e[5] * v.y / -v.z) * H / 2];
  }
  function teff(bv) { return 4600 * (1 / (0.92 * bv + 1.7) + 1 / (0.92 * bv + 0.62)); }
  function cls(t) { return t > 30000 ? ['O', '蓝色'] : t > 10000 ? ['B', '蓝白色'] : t > 7500 ? ['A', '白色'] : t > 6000 ? ['F', '黄白色'] : t > 5200 ? ['G', '黄色'] : t > 3700 ? ['K', '橙色'] : ['M', '红色']; }
  function hms(ra) { ra = (ra + 360) % 360 / 15; var h = Math.floor(ra), m = Math.floor((ra - h) * 60), s = ((ra - h) * 60 - m) * 60; return h + 'h ' + m + 'm ' + s.toFixed(1) + 's'; }
  function dms(d) { var g = d < 0 ? '−' : '+', a = Math.abs(d), D = Math.floor(a), m = Math.floor((a - D) * 60), s = Math.round(((a - D) * 60 - m) * 60); return g + D + '° ' + m + '′ ' + s + '″'; }
  function eye(m) { return m < 6.5 ? '肉眼可见' : m < 9 ? '双筒望远镜' : m < 13 ? '小型望远镜' : '大型望远镜'; }
  function css() {
    if (document.getElementById('xk-css')) return; var st = document.createElement('style'); st.id = 'xk-css';
    st.textContent = '#xk-box{position:absolute;width:26px;height:26px;margin:-13px 0 0 -13px;pointer-events:none;z-index:8;border:1.5px solid transparent;border-image:linear-gradient(#f0c97a,#f0c97a) 1;clip-path:polygon(0 0,35% 0,35% 2px,2px 2px,2px 35%,0 35%,0 65%,2px 65%,2px calc(100% - 2px),35% calc(100% - 2px),35% 100%,65% 100%,65% calc(100% - 2px),calc(100% - 2px) calc(100% - 2px),calc(100% - 2px) 65%,100% 65%,100% 35%,calc(100% - 2px) 35%,calc(100% - 2px) 2px,65% 2px,65% 0,100% 0,100% 0)}' +
      '#xk-card{position:absolute;right:14px;top:64px;width:min(300px,86vw);z-index:30;background:rgba(8,13,24,.9);border:1px solid rgba(240,201,122,.28);border-radius:12px;padding:14px 16px;color:#dfe7f5;font-size:12px;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}' +
      '#xk-card .k{font-size:10px;letter-spacing:.2em;color:#8fa3c2;padding-right:22px}#xk-card h3{margin:6px 0 2px;font-size:20px;font-weight:500}#xk-card .en{color:#9aaccc;font-size:11px}' +
      '#xk-card .sw{display:flex;align-items:center;gap:10px;margin:10px 0}#xk-card .dot{width:26px;height:26px;border-radius:50%;flex:none}#xk-card .bar{flex:1;height:5px;border-radius:3px;background:linear-gradient(90deg,#9bb0ff,#cad7ff,#fff,#fff4ea,#ffd2a1,#ffb56c);position:relative}#xk-card .bar i{position:absolute;top:-3px;width:2px;height:11px;background:#fff}' +
      '#xk-card .r{display:flex;justify-content:space-between;padding:4px 0;border-top:1px solid rgba(150,180,220,.1)}#xk-card .r b{font-weight:400;color:#f0d9a8}#xk-card .n{color:#8fa3c2;font-size:11px;margin-top:8px;line-height:1.5}' +
      '#xk-card .x{position:absolute;right:10px;top:8px;background:none;border:0;color:#aab;font-size:18px}#xk-card .go{margin-top:10px;width:100%;padding:7px;border-radius:16px;border:1px solid #f0c97a;background:rgba(240,201,122,.1);color:#f6d999;font:inherit}';
    document.head.appendChild(st);
  }
  function show(k) {
    var root = X._.root(); if (!root) return; css(); SEL = k;
    if (!box) { box = document.createElement('div'); box.id = 'xk-box'; } root.appendChild(box);
    if (card) card.remove(); card = document.createElement('div'); card.id = 'xk-card';
    var s = shipLy(), m = appMag(k, s), bv = ST.BV[k], nm = (window.SHX_STARNAMES || {})[k], Q = ST.Q;
    var dSun = Math.hypot(Q[k * 3], Q[k * 3 + 1], Q[k * 3 + 2]), dShip = Math.hypot(ST.P[k * 3] - s[0], ST.P[k * 3 + 1] - s[1], ST.P[k * 3 + 2] - s[2]);
    var ra = Math.atan2(Q[k * 3 + 1], Q[k * 3]) * 180 / Math.PI, de = Math.asin(Q[k * 3 + 2] / (dSun || 1)) * 180 / Math.PI;
    var t = isNaN(bv) ? null : teff(bv), c = t ? cls(t) : null, wp = null;
    (X._.B || []).forEach(function (b) { var kk = window.SH_STARS.k || {}; if (b.star && kk[b.id] === k) wp = b; });
    var col = t ? 'hsl(' + (t > 6000 ? 215 : 30) + ',' + Math.min(90, Math.abs(t - 6000) / 60) + '%,80%)' : '#fff', pos = t ? Math.max(0, Math.min(100, (1 - (Math.log(t) - Math.log(2800)) / (Math.log(30000) - Math.log(2800))) * 100)) : 50;
    card.innerHTML = '<button class="x" type="button" aria-label="关闭">×</button><div class="k">HYG v4.1 #' + k + ' · 恒星</div>' +
      '<h3>' + (nm ? nm[0] : '视星等 ' + m.toFixed(1) + ' 的恒星') + '</h3><div class="en">' + (nm ? nm[1] : 'Magnitude ' + m.toFixed(1) + ' star') + '</div>' +
      '<div class="sw"><span class="dot" style="background:radial-gradient(circle,#fff 20%,' + col + ' 60%,transparent 72%)"></span><div class="bar"><i style="left:' + pos + '%"></i></div></div>' +
      (nm ? '<div class="r"><span>类型</span><b>' + nm[2] + '</b></div>' : '') +
      '<div class="r"><span>视星等(从飞船看)</span><b>' + m.toFixed(2) + '</b></div><div class="r"><span>绝对星等</span><b>' + ST.M[k].toFixed(2) + '</b></div>' +
      (t ? '<div class="r"><span>光谱型(按颜色估算)</span><b>' + c[0] + ' · ' + c[1] + '</b></div><div class="r"><span>表面温度(按颜色估算)</span><b>≈ ' + (Math.round(t / 100) * 100).toLocaleString() + ' K</b></div><div class="r"><span>B − V</span><b>' + bv.toFixed(2) + '</b></div>' : '') +
      '<div class="r"><span>距太阳</span><b>' + (dSun < 100 ? dSun.toFixed(2) : Math.round(dSun).toLocaleString()) + ' 光年</b></div><div class="r"><span>距飞船</span><b>' + (dShip < 100 ? dShip.toFixed(2) : Math.round(dShip).toLocaleString()) + ' 光年</b></div>' +
      '<div class="r"><span>赤经(J2000)</span><b>' + hms(ra) + '</b></div><div class="r"><span>赤纬(J2000)</span><b>' + dms(de) + '</b></div>' +
      '<div class="r"><span>所需器材(地球上)</span><b>' + eye(appMag(k, [0, 0, 0])) + '</b></div>' +
      '<div class="n">位置、亮度与颜色来自 HYG v4.1 星表(Hipparcos / Yale / Gliese 汇编)。光谱型与温度只凭颜色估算,巨星与主序星会有偏差。</div>' +
      (wp ? '<button class="go" type="button">设为航行目标</button>' : '');
    root.appendChild(card);
    card.querySelector('.x').onclick = hide; var g = card.querySelector('.go'); if (g) g.onclick = function () { X._.setTarget(wp.id); hide(); };
  }
  function hide() { SEL = -1; if (box) box.remove(); if (card) { card.remove(); card = null; } }
  function pick(cx, cy) {
    var cam = X._.cam && X._.cam(), root = X._.root(); if (!cam || !root || !ST) return;
    var rc = root.getBoundingClientRect(), x = cx - rc.left, y = cy - rc.top, s = shipLy(), out = Math.hypot(s[0], s[1], s[2]) * 63241 > 121;
    var best = -1, bs = 1e9;
    for (var k = 1; k < ST.n; k++) {
      var m = appMag(k, s); if (!out && m > 6.5) continue;
      var p = scr(k, s, cam, rc.width, rc.height); if (!p) continue;
      var d = Math.hypot(p[0] - x, p[1] - y); if (d > 14) continue;
      var sc = d + m * 2; if (sc < bs) { bs = sc; best = k; }
    }
    if (best >= 0) show(best); else hide();
  }
  function frame() {
    if (SEL < 0 || !box) return; var cam = X._.cam(), root = X._.root(); if (!cam || !root) return;
    var rc = root.getBoundingClientRect(), p = scr(SEL, shipLy(), cam, rc.width, rc.height);
    if (!p) { box.style.display = 'none'; return; } box.style.display = ''; box.style.left = p[0] + 'px'; box.style.top = p[1] + 'px';
  }
  function bind() {
    var root = X._.root(); if (!root || root._xk) return; root._xk = 1;
    root.addEventListener('pointerdown', function (e) { dn = e.target.tagName === 'CANVAS' ? [e.clientX, e.clientY] : null; });
    root.addEventListener('pointerup', function (e) { if (dn && Math.abs(e.clientX - dn[0]) + Math.abs(e.clientY - dn[1]) < 5) pick(e.clientX, e.clientY); dn = null; });
  }
  function hook(ev) { if (ev === 'open') { T = window.THREE; if (!ST) ST = decode(); bind(); } else if (ev === 'frame') frame(); else if (ev === 'close') hide(); }
  (function wait(n) { if (window.SHXC && SHXC.on) { X = SHXC; SHXC.on(hook); return; } if (n < 100) setTimeout(function () { wait(n + 1); }, 100); })(0);
  window.SHXK = { pick: pick, show: function (k) { show(k); }, hide: hide, sel: function () { return SEL; } };
})();
