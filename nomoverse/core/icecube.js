/* 宙律 Nomoverse · 冰立方中微子专题 · 物理模型(v0.9-α7,零依赖;浏览器 window.NV_ICE / node require)
 * 资料(2026-11-07 核对):IceCube 官网 icecube.wisc.edu/science/icecube、/about-us/facts;NobelPrize.org 2026 物理奖新闻稿。
 * - 86 串 × 60 个光学模块(DOM),深 1450–2450 m,六边形网格间距 125 m,模块竖直间距 17 m;约 1 立方公里冰。
 * - 「人大小的探测器,在 IceCube 关注的能区约要等 10 万年才见到一次中微子相互作用」→ 等待时间按质量反比换算(简化模型)。
 * - 切伦科夫光:带电粒子在冰中跑得比冰中光速 c/n 还快,沿 cosθ = 1/n 的锥面发光;冰的折射率取 n ≈ 1.32。
 * - 光到达时刻(无散射直射近似):t = t0 + (l + ρ·tanθ)/c,l 为模块在径迹上的投影,ρ 为到径迹的垂直距离,tanθ = √(n²−1)。 */
(function (G) {
  "use strict";
  var C = 0.299792458;                    // 真空光速 m/ns
  var N_ICE = 1.32;                       // 冰的折射率(相速度近似)
  var RHO_ICE = 917;                      // 冰密度 kg/m³
  var SPACING = 125;                      // IceCube 串间距 m
  var HEIGHT = 1000;                      // 1450→2450 m,仪表段高 1000 m
  var PERSON_KG = 70, PERSON_WAIT_YR = 1e5;   // 人大小探测器在 IceCube 能区约 10 万年一次
  var YEAR_D = 365.25;

  var M = {
    C: C, N_ICE: N_ICE, RHO_ICE: RHO_ICE, SPACING: SPACING, HEIGHT: HEIGHT, PERSON_KG: PERSON_KG, PERSON_WAIT_YR: PERSON_WAIT_YR,
    STRINGS_REAL: 86, DOMS_PER_STRING: 60, DOM_DZ: 17, TOP_DEPTH: 1450, BOTTOM_DEPTH: 2450,
    /* 切伦科夫角(度) */
    cherenkovDeg: function (n) { n = n || N_ICE; return Math.acos(1 / n) * 180 / Math.PI; },
    tanC: function (n) { n = n || N_ICE; return Math.sqrt(n * n - 1); },
    vLightIce: function (n) { return C / (n || N_ICE); },           // m/ns
    /* 六边形网格上每串「负责」的冰面积 m² = s²·√3/2 */
    cellArea: function (s) { s = s || SPACING; return s * s * Math.sqrt(3) / 2; },
    volume: function (nStr, s) { return nStr * M.cellArea(s) * HEIGHT; },          // m³
    mass: function (vol) { return vol * RHO_ICE; },                                // kg
    /* 每天能等到的中微子相互作用数(按「人大小 10 万年一次」质量反比换算) */
    ratePerDay: function (kg) { return (kg / PERSON_KG) / (PERSON_WAIT_YR * YEAR_D); },
    waitDays: function (kg) { var r = M.ratePerDay(kg); return r > 0 ? 1 / r : Infinity; },
    /* 六边形网格坐标:半径 R 圈,间距 s;返回 [{x,y,ring}](米) */
    hexGrid: function (R, s) {
      var out = []; s = s || SPACING;
      for (var q = -R; q <= R; q++) for (var r = -R; r <= R; r++) {
        var k = -q - r, ring = Math.max(Math.abs(q), Math.abs(r), Math.abs(k));
        if (ring <= R) out.push({ x: s * (q + r / 2), y: s * r * Math.sqrt(3) / 2, ring: ring });
      }
      out.sort(function (a, b) { return a.ring - b.ring || Math.atan2(a.y, a.x) - Math.atan2(b.y, b.x); });
      return out;
    },
    /* 单位向量:方位角 az(度,0 = +x,逆时针)、仰角 el(度,+ 为地平线以上) */
    dir: function (az, el) { var a = az * Math.PI / 180, e = el * Math.PI / 180; return [Math.cos(e) * Math.cos(a), Math.cos(e) * Math.sin(a), Math.sin(e)]; },
    azel: function (v) { var az = Math.atan2(v[1], v[0]) * 180 / Math.PI; if (az < 0) az += 360; return { az: az, el: Math.asin(Math.max(-1, Math.min(1, v[2]))) * 180 / Math.PI }; },
    angle: function (a, b) { var d = a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; return Math.acos(Math.max(-1, Math.min(1, d))) * 180 / Math.PI; },
    /* 一条径迹:p 为径迹上一点,d 为粒子飞行方向(单位);对每个模块算到达时刻与亮度。
       R = 光能传到的最远垂直距离(随能量),返回按时刻排序的命中 [{i,t,rho,q}] */
    hits: function (doms, p, d, R, n) {
      var tc = M.tanC(n), out = [];
      for (var i = 0; i < doms.length; i++) {
        var D = doms[i], vx = D[0] - p[0], vy = D[1] - p[1], vz = D[2] - p[2];
        var l = vx * d[0] + vy * d[1] + vz * d[2], r2 = vx * vx + vy * vy + vz * vz - l * l, rho = Math.sqrt(Math.max(0, r2));
        if (rho < R) out.push({ i: i, t: (l + rho * tc) / C, rho: rho, q: 1 - rho / R });
      }
      if (out.length) { var t0 = Math.min.apply(null, out.map(function (h) { return h.t; })); out.forEach(function (h) { h.t -= t0; }); }
      out.sort(function (a, b) { return a.t - b.t; });
      return out;
    },
    /* 线性拟合(IceCube 的「LineFit」首猜):r_i ≈ r0 + v·t_i,最小二乘得 v,方向 = v/|v| */
    lineFit: function (doms, hs) {
      var n = hs.length; if (n < 2) return null;
      var mt = 0, mr = [0, 0, 0];
      hs.forEach(function (h) { mt += h.t; for (var k = 0; k < 3; k++) mr[k] += doms[h.i][k]; });
      mt /= n; for (var k = 0; k < 3; k++) mr[k] /= n;
      var stt = 0, str = [0, 0, 0];
      hs.forEach(function (h) { var dt = h.t - mt; stt += dt * dt; for (var k = 0; k < 3; k++) str[k] += dt * (doms[h.i][k] - mr[k]); });
      if (!stt) return null;
      var v = str.map(function (x) { return x / stt; }), L = Math.hypot(v[0], v[1], v[2]);
      return { dir: v.map(function (x) { return x / L; }), speed: L, center: mr };
    },
    /* 由角度误差评星 */
    starsFor: function (errDeg) { return errDeg <= 15 ? 3 : errDeg <= 30 ? 2 : errDeg <= 50 ? 1 : 0; },
    /* 可复现随机数 */
    rng: function (seed) { var s = (seed >>> 0) || 1; return function () { s = (s * 16807) % 2147483647; return s / 2147483647; }; }
  };
  /* 随机生成一条穿过探测器中心附近的径迹(源方向 src = −d)。up: true=穿过地球自下而上,false=自上而下,null=任意 */
  M.event = function (rnd, up, maxOff) {
    var u = rnd() * 2 - 1;
    if (up === true) u = 0.15 + 0.85 * rnd();        // 粒子向上飞(d_z>0)= 来自地平线以下
    if (up === false) u = -(0.15 + 0.85 * rnd());
    var ph = rnd() * Math.PI * 2, s = Math.sqrt(1 - u * u), d = [s * Math.cos(ph), s * Math.sin(ph), u];
    var e1 = Math.abs(d[2]) < 0.9 ? [-d[1], d[0], 0] : [0, -d[2], d[1]], n1 = Math.hypot(e1[0], e1[1], e1[2]); e1 = e1.map(function (x) { return x / n1; });
    var e2 = [d[1] * e1[2] - d[2] * e1[1], d[2] * e1[0] - d[0] * e1[2], d[0] * e1[1] - d[1] * e1[0]];
    var off = maxOff == null ? 160 : maxOff, a = (rnd() * 2 - 1) * off, b = (rnd() * 2 - 1) * off;
    return { p: [a * e1[0] + b * e2[0], a * e1[1] + b * e2[1], a * e1[2] + b * e2[2]], d: d, src: [-d[0], -d[1], -d[2]], R: 120 + 60 * rnd() };
  };
  if (typeof module !== "undefined" && module.exports) module.exports = M;
  G.NV_ICE = M;
})(typeof window !== "undefined" ? window : this);
