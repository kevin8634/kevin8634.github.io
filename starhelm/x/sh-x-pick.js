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
      '#xk-card{position:absolute;right:14px;top:64px;width:min(300px,86vw);z-index:30;background:rgba(8,13,24,.9);border:1px solid rgba(240,201,122,.28);border-radius:12px;padding:14px 16px;color:#dfe7f5;font-size:12px;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);overflow:auto;overscroll-behavior:contain;transition:opacity .25s}#xk-card.dim{opacity:.3;pointer-events:none}#xk-card.drawer{border-radius:14px;padding:10px 14px;font-size:11.5px}#xk-card.drawer h3{font-size:17px;margin:3px 0 0}#xk-card.drawer .n{display:none}' +
      '#xk-card .k{font-size:10px;letter-spacing:.2em;color:#8fa3c2;padding-right:22px}#xk-card h3{margin:6px 0 2px;font-size:20px;font-weight:500}#xk-card .en{color:#9aaccc;font-size:11px}' +
      '#xk-card .sw{display:flex;align-items:center;gap:10px;margin:10px 0}#xk-card .dot{width:26px;height:26px;border-radius:50%;flex:none}#xk-card .bar{flex:1;height:5px;border-radius:3px;background:linear-gradient(90deg,#9bb0ff,#cad7ff,#fff,#fff4ea,#ffd2a1,#ffb56c);position:relative}#xk-card .bar i{position:absolute;top:-3px;width:2px;height:11px;background:#fff}' +
      '#xk-card .r{display:flex;justify-content:space-between;padding:4px 0;border-top:1px solid rgba(150,180,220,.1)}#xk-card .r b{font-weight:400;color:#f0d9a8}#xk-card .n{color:#8fa3c2;font-size:11px;margin-top:8px;line-height:1.5}' +
      '#xk-dso{position:absolute;inset:0;pointer-events:none;z-index:7;overflow:hidden}#xk-dso .m{position:absolute;left:0;top:0;opacity:.55;transition:opacity .3s}#xk-dso .m i{position:absolute;border:1px dashed rgba(170,200,255,.55);border-radius:50%}#xk-dso .m span{position:absolute;top:-7px;white-space:nowrap;font-size:10.5px;color:#b9c8e6;text-shadow:0 0 4px #000}#xk-dso .m.sel{opacity:1}#xk-dso .m.sel i{border:1.5px solid #f0c97a}' +
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
      (wp ? '<button class="go" type="button">设为航行目标</button>' : (k > 0 && dSun > 0.01 && X._.tempStar ? '<button class="go" type="button">前往 · 生成临时航点</button>' : ''));
    root.appendChild(card); place(); clearInterval(PT); PT = setInterval(place, 700);
    card.querySelector('.x').onclick = hide; var g = card.querySelector('.go'); if (g) g.onclick = wp ? function () { X._.setTarget(wp.id); hide(); } : function () { go(k, nm, m, t, c, col, dSun, ra, de); };
  }
  /* C2.2d T5:任意 HYG 恒星「前往」——按星表数值估算外观参数,装进驾驶舱临时航点槽,随后自动驾驶(远距沿用曲率跃迁) */
  function go(k, nm, m, t, c, col, dSun, ra, de) {
    var L = Math.pow(10, (4.83 - ST.M[k]) / 2.5), T0 = t || 5800, Rs = Math.max(.08, Math.min(1500, Math.sqrt(L) * Math.pow(5772 / T0, 2))), Ms = Math.max(.08, Math.min(60, Math.pow(L, 1 / 3.5)));
    var u = Math.max(0, Math.min(1, (Math.log(T0) - Math.log(3000)) / (Math.log(12000) - Math.log(3000))));
    var tint = [1.25 + (1.05 - 1.25) * u, .62 + (1.22 - .62) * u, .4 + (1.55 - .4) * u];
    var name = nm ? nm[0] : 'HYG #' + k, ly = dSun < 100 ? dSun.toFixed(2) : Math.round(dSun).toLocaleString();
    var b = X._.tempStar({ zh: name, en: nm ? nm[1] : 'HYG ' + k, type: nm ? nm[2] : (c ? c[0] + ' 型恒星' : '恒星'), R: Rs * 696340, GM: Ms * 1.32712e11, L: L, temp: t ? '≈ ' + (Math.round(t / 100) * 100).toLocaleString() + '(按颜色估算)' : '—',
      col: col, tint: tint, sat: T0 > 8000 ? .1 : 1, fix: [(ra + 360) % 360, de, dSun * 63241.077], hyg: k,
      info: [['光谱型', c ? c[0] + ' · ' + c[1] + '(按颜色估算)' : '—'], ['光度', '约 ' + (L < 10 ? L.toFixed(2) : Math.round(L).toLocaleString()) + ' 个太阳'], ['半径', '约 ' + (Rs < 10 ? Rs.toFixed(2) : Math.round(Rs)) + ' 个太阳(估算)'], ['距离', ly + ' 光年'], ['外观', '程序化模拟 · 数值来自 HYG v4.1']] });
    hide(); if (!b) return;
    if (window.SHXS && SHXS.mode) SHXS.mode('boost'); else X._.S.capV = 0;   // 恒星际距离:切到引擎加速(曲率跃迁),否则巡航 100 km/s 上限
    X._.autopilot(true); X._.toast('已生成临时航点「' + name + '」· ' + ly + ' 光年 · 自动驾驶出发');
  }
  /* C2.3 T5 第二部分:深空天体(OpenNGC,CC BY-SA 4.0)——梅西耶 110 + 视星等 ≤ 9 的 NGC/IC,天球上淡圈标注,可点选看资料 */
  var DS = null, SELD = -1, mk = null, MKP = [], mkN = 0;
  function dsoInit() {
    var R = window.SH_DSO; if (!R || DS) return;
    DS = R.d.map(function (o) { var a = o[4] * Math.PI / 180, d = o[5] * Math.PI / 180, x = Math.cos(d) * Math.cos(a), y = Math.cos(d) * Math.sin(a), z = Math.sin(d);
      return { o: o, v: [x, -y * Math.sin(EPS) + z * Math.cos(EPS), -(y * Math.cos(EPS) + z * Math.sin(EPS))] }; });
  }
  function dscr(i, cam, W, H) {
    var v = new T.Vector3(DS[i].v[0], DS[i].v[1], DS[i].v[2]).transformDirection(cam.matrixWorldInverse);
    if (v.z >= 0) return null; var e = cam.projectionMatrix.elements;
    return [(e[0] * v.x / -v.z + 1) * W / 2, (1 - e[5] * v.y / -v.z) * H / 2, e[5] * H / 2];
  }
  function dsoOn() {   // 离太阳 3000 光年内天球方向才近似成立;导览/拍照/标签关闭时隐藏
    var root = X._.root(); if (!root || !DS || X._.S.tour || root.classList.contains('photo')) return false;
    var lb = root.querySelector('#xc-lbls'); if (lb && getComputedStyle(lb).display === 'none') return false;
    var s = shipLy(); return Math.hypot(s[0], s[1], s[2]) < 3000;
  }
  function dsoRad(i, f) { var a = DS[i].o[7] || 2; return Math.max(7, Math.min(70, a / 60 * Math.PI / 180 * f / 2)); }
  function dsoMarks() {
    var root = X._.root(), cam = X._.cam && X._.cam(); if (!root || !cam) return;
    if (!mk) { css(); mk = document.createElement('div'); mk.id = 'xk-dso'; }
    if (!mk.isConnected) root.appendChild(mk);
    var on = dsoOn(); mk.style.display = on ? '' : 'none'; if (!on) return;
    var rc = root.getBoundingClientRect(), W = rc.width, H = rc.height, n = 0, lim = W < 640 ? 12 : 20;
    for (var i = 0; i < DS.length && n < lim; i++) {
      var o = DS[i].o; if (!(o[9] != null && o[9] <= 7.5) && !o[1]) continue;
      var p = dscr(i, cam, W, H); if (!p || p[0] < -40 || p[0] > W + 40 || p[1] < -40 || p[1] > H + 40) continue;
      var el = MKP[n]; if (!el) { el = MKP[n] = document.createElement('div'); el.className = 'm'; el.innerHTML = '<i></i><span></span>'; mk.appendChild(el); }
      var r = dsoRad(i, p[2]); el.style.display = ''; el.style.transform = 'translate(' + p[0].toFixed(1) + 'px,' + p[1].toFixed(1) + 'px)';
      var ii = el.firstChild; ii.style.width = ii.style.height = (r * 2).toFixed(0) + 'px'; ii.style.margin = (-r).toFixed(0) + 'px 0 0 ' + (-r).toFixed(0) + 'px';
      var sp = el.lastChild, t = o[1] ? (o[1].indexOf(o[0]) === 0 ? o[1] : o[0] + ' ' + o[1]) : o[0]; if (sp.textContent !== t) sp.textContent = t; sp.style.left = (r + 3).toFixed(0) + 'px';
      el.classList.toggle('sel', i === SELD); n++;
    }
    for (var j = n; j < MKP.length; j++) MKP[j].style.display = 'none';
  }
  function dsoHit(x, y, cam, W, H) {
    if (!dsoOn()) return null; var best = null;
    for (var i = 0; i < DS.length; i++) {
      var p = dscr(i, cam, W, H); if (!p) continue; var d = Math.hypot(p[0] - x, p[1] - y), r = Math.max(14, dsoRad(i, p[2]));
      if (d > r) continue; var sc = d / r + (DS[i].o[9] || 10) * .05 - (DS[i].o[1] ? .2 : 0); if (!best || sc < best.sc) best = { i: i, d: d, sc: sc };
    }
    return best;
  }
  function showD(i) {
    var root = X._.root(); if (!root) return; css(); hide(); SELD = i;
    var o = DS[i].o, R = window.SH_DSO, ty = R.ty[o[3]] || o[3], nm = o[1] || o[2] || o[0];
    card = document.createElement('div'); card.id = 'xk-card';
    var sz = o[7] ? (o[7] >= 60 ? (o[7] / 60).toFixed(1) + '°' : o[7].toFixed(1) + '′') + (o[8] && o[8] !== o[7] ? ' × ' + (o[8] >= 60 ? (o[8] / 60).toFixed(1) + '°' : o[8].toFixed(1) + '′') : '') : '—';
    var moon = o[7] ? (o[7] / 31).toFixed(o[7] > 62 ? 0 : 1) : 0;
    card.innerHTML = '<button class="x" type="button" aria-label="关闭">×</button><div class="k">OpenNGC · ' + ty + '</div>' +
      '<h3>' + nm + '</h3><div class="en">' + o[0] + (o[11] ? ' · ' + o[11] : '') + (o[2] && o[2] !== nm ? ' · ' + o[2] : '') + '</div>' +
      '<div class="r"><span>类型</span><b>' + ty + (o[10] ? '(' + o[10] + ')' : '') + '</b></div>' +
      '<div class="r"><span>所在星座</span><b>' + ((R.con || {})[o[6]] || o[6]) + '</b></div>' +
      '<div class="r"><span>视星等(地球上)</span><b>' + (o[9] != null ? o[9].toFixed(1) : '—') + '</b></div>' +
      '<div class="r"><span>视大小</span><b>' + sz + '</b></div>' + (moon >= 0.5 ? '<div class="r"><span>相当于</span><b>约 ' + moon + ' 个满月宽</b></div>' : '') +
      '<div class="r"><span>赤经(J2000)</span><b>' + hms(o[4]) + '</b></div><div class="r"><span>赤纬(J2000)</span><b>' + dms(o[5]) + '</b></div>' +
      '<div class="r"><span>所需器材(地球上)</span><b>' + (o[9] != null ? eye(o[9] + (o[7] > 20 ? 1 : 0)) : '—') + '</b></div>' +
      '<div class="n">数据来自 OpenNGC(CC BY-SA 4.0)。深空天体远在千光年以外,天枢号目前只能远观;' + (window.SHXV && SHXV.has(o[0]) ? '飞抵后为真实影像分层呈现。</div><button class="go" type="button">前往 · 深空抵达</button>' : '飞抵星云、星系的真实影像正在逐个上线。</div>');
    root.appendChild(card); place(); clearInterval(PT); PT = setInterval(place, 700);
    card.querySelector('.x').onclick = hide; dsoMarks(); var gd = card.querySelector('.go'); if (gd) gd.onclick = function () { hide(); SHXV.open(o[0]); };
  }
  function hide() { SELD = -1; SEL = -1; clearInterval(PT); if (box) box.remove(); if (card) { card.remove(); card = null; } }
  /* C2.2b 信息卡避让:不与目标面板(含日球层栏)、仪表、底部按钮条、讲解卡重叠。
     桌面:目标面板下方空间够就同列堆叠;不够就停靠在目标面板左侧;卡内限高滚动。
     窄屏(≤640px):底部抽屉,上沿不越过屏幕中线(准星)。 */
  var PT = 0;
  function rc(q) { var e = document.querySelector(q); if (!e || e.offsetParent === null && getComputedStyle(e).position !== 'fixed') return null; var r = e.getBoundingClientRect(); return r.width && r.height ? r : null; }
  function place() {
    if (!card || !card.isConnected) { clearInterval(PT); return; }
    var R = card.parentNode.getBoundingClientRect(), W = R.width, H = R.height, st = card.style;
    var low = H; ['#xa-dock', '#shxc .gauges', '#xc-deck .top', '#shxc .mob'].forEach(function (q) { var r = rc(q); if (r && r.top - R.top > H * .45) low = Math.min(low, r.top - R.top); });
    st.left = st.right = st.top = st.bottom = st.width = st.maxHeight = ''; card.classList.remove('drawer');
    if (W <= 640) {
      card.classList.add('drawer'); st.top = 'auto'; st.left = '8px'; st.right = '8px'; st.width = 'auto';
      st.bottom = Math.round(H - low + 8) + 'px'; st.maxHeight = Math.max(150, Math.round(low - 8 - (H / 2 + 34))) + 'px';
    } else {
      var t = rc('#shxc .tgt'), l = rc('#shxc .lst');
      if (t && l && l.left < t.right && l.right > t.left) t = { left: Math.min(t.left, l.left), right: Math.max(t.right, l.right), top: Math.min(t.top, l.top), bottom: Math.max(t.bottom, l.bottom) };
      else if (!t && l) t = l;
      var lim = low - 10, cw = Math.min(300, W * .86);
      if (!t) { st.right = '14px'; st.top = '64px'; st.maxHeight = Math.max(160, lim - 64) + 'px'; }
      else {
        var top = t.bottom - R.top + 10;
        if (lim - top >= 280) { st.right = Math.round(R.right - t.right) + 'px'; st.top = Math.round(top) + 'px'; st.maxHeight = Math.round(lim - top) + 'px'; }
        else { st.right = Math.round(R.right - t.left + 10) + 'px'; st.top = Math.round(t.top - R.top) + 'px'; st.maxHeight = Math.max(160, Math.round(lim - (t.top - R.top))) + 'px'; }
      }
      st.width = cw + 'px';
    }
    var x = rc('#xe-box'), c = card.getBoundingClientRect();
    card.classList.toggle('dim', !!(x && x.left < c.right && x.right > c.left && x.top < c.bottom && x.bottom > c.top));
  }
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
    var h = DS ? dsoHit(x, y, cam, rc.width, rc.height) : null;
    if (h && (best < 0 || h.d + 4 < Math.hypot.apply(null, (function () { var p = scr(best, s, cam, rc.width, rc.height); return [p[0] - x, p[1] - y]; })()))) { showD(h.i); return; }
    if (best >= 0) show(best); else hide();
  }
  function frame() {
    if (DS && (++mkN % 2 === 0 || SELD >= 0)) dsoMarks();
    if (SEL < 0 || !box) return; var cam = X._.cam(), root = X._.root(); if (!cam || !root) return;
    var rc = root.getBoundingClientRect(), p = scr(SEL, shipLy(), cam, rc.width, rc.height);
    if (!p) { box.style.display = 'none'; return; } box.style.display = ''; box.style.left = p[0] + 'px'; box.style.top = p[1] + 'px';
  }
  function bind() {
    var root = X._.root(); if (!root || root._xk) return; root._xk = 1;
    root.addEventListener('pointerdown', function (e) { dn = e.target.tagName === 'CANVAS' ? [e.clientX, e.clientY] : null; });
    root.addEventListener('pointerup', function (e) { if (dn && Math.abs(e.clientX - dn[0]) + Math.abs(e.clientY - dn[1]) < 5) pick(e.clientX, e.clientY); dn = null; });
  }
  function hook(ev) { if (ev === 'open') { T = window.THREE; if (!ST) ST = decode(); dsoInit(); bind(); } else if (ev === 'frame') frame(); else if (ev === 'close') hide(); }
  (function wait(n) { if (window.SHXC && SHXC.on) { X = SHXC; SHXC.on(hook); return; } if (n < 100) setTimeout(function () { wait(n + 1); }, 100); })(0);
  window.SHXK = { starDir: function (k) { if (!ST) ST = decode(); var sh = shipLy(), P = ST.P; return [P[k * 3] - sh[0], P[k * 3 + 1] - sh[1], P[k * 3 + 2] - sh[2]]; }, mag0: function (k) { if (!ST) ST = decode(); return appMag(k, [0, 0, 0]); }, eq2p: function (x, y, z) { return [x, -y * Math.sin(EPS) + z * Math.cos(EPS), -(y * Math.cos(EPS) + z * Math.sin(EPS))]; }, dso: function (i) { if (!DS) dsoInit(); showD(i); }, dsoList: function () { return DS; }, pick: pick, show: function (k) { show(k); }, hide: hide, sel: function () { return SEL; } };
})();
