/* 宙律 Nomoverse 3.0 · N 体积分(3-1 纯函数层,零依赖;浏览器 window.NV3_NBODY / node require;可直接放进 Web Worker)
 * 单位:AU、年、太阳质量;引力常数 G = 4π²·kG(kG = 引力倍数)。
 * 积分器:速度 Verlet(kick-drift-kick,辛格式,长期能量误差有界),固定步长 ⇒ 结果确定。 */
(function (root) {
  "use strict";
  var FOURPI2 = 4 * Math.PI * Math.PI;
  var MEARTH_MSUN = 5.9722e24 / 1.98847e30;

  /* 由 universe.run() 的结果建初始状态:恒星在原点,行星在近日点、按 vis-viva 给切向速度;再整体平移到质心系 */
  function fromSystem(res) {
    var kG = res.recipe.kG, G = FOURPI2 * kG, Ms = res.star.M;
    var b = [{ m: Ms, x: 0, y: 0, vx: 0, vy: 0 }];
    res.planets.forEach(function (p) {
      var m = p.mass_kg / 1.98847e30, a = p.aAU, e = p.e, r = a * (1 - e), th = p.phase0_rad;
      var v = Math.sqrt(G * (Ms + m) * (2 / r - 1 / a));
      b.push({ m: m, x: r * Math.cos(th), y: r * Math.sin(th), vx: -v * Math.sin(th), vy: v * Math.cos(th) });
    });
    return toCOM({ G: G, t: 0, b: b });
  }
  function toCOM(s) {
    var M = 0, px = 0, py = 0, cx = 0, cy = 0;
    s.b.forEach(function (o) { M += o.m; px += o.m * o.vx; py += o.m * o.vy; cx += o.m * o.x; cy += o.m * o.y; });
    s.b.forEach(function (o) { o.vx -= px / M; o.vy -= py / M; o.x -= cx / M; o.y -= cy / M; });
    return s;
  }
  function clone(s) { return { G: s.G, t: s.t, b: s.b.map(function (o) { return { m: o.m, x: o.x, y: o.y, vx: o.vx, vy: o.vy }; }) }; }

  function acc(s) {
    var n = s.b.length, ax = new Array(n).fill(0), ay = new Array(n).fill(0);
    for (var i = 0; i < n; i++) for (var j = i + 1; j < n; j++) {
      var A = s.b[i], B = s.b[j], dx = B.x - A.x, dy = B.y - A.y, r2 = dx * dx + dy * dy, r = Math.sqrt(r2), f = s.G / (r2 * r);
      ax[i] += f * B.m * dx; ay[i] += f * B.m * dy; ax[j] -= f * A.m * dx; ay[j] -= f * A.m * dy;
    }
    return [ax, ay];
  }
  /* 原地推进 steps 步,步长 dt(年) */
  function step(s, dt, steps) {
    var a = acc(s), h = dt / 2;
    for (var k = 0; k < steps; k++) {
      s.b.forEach(function (o, i) { o.vx += h * a[0][i]; o.vy += h * a[1][i]; o.x += dt * o.vx; o.y += dt * o.vy; });
      a = acc(s);
      s.b.forEach(function (o, i) { o.vx += h * a[0][i]; o.vy += h * a[1][i]; });
      s.t += dt;
    }
    return s;
  }
  function energy(s) {
    var K = 0, U = 0, n = s.b.length;
    for (var i = 0; i < n; i++) {
      var o = s.b[i]; K += 0.5 * o.m * (o.vx * o.vx + o.vy * o.vy);
      for (var j = i + 1; j < n; j++) { var q = s.b[j]; U -= s.G * o.m * q.m / Math.hypot(q.x - o.x, q.y - o.y); }
    }
    return K + U;
  }
  /* 两体解析周期(年):T = 2π√(a³/(G(M+m))) */
  function keplerPeriod(G, M, m, a) { return 2 * Math.PI * Math.sqrt(a * a * a / (G * (M + m))); }

  /* 量第 i 颗行星相对恒星转过的角度,返回数值周期(年):积分直到累计转角 ≥ 2π,线性插值过零 */
  function measurePeriod(s0, i, dt, maxSteps) {
    var s = clone(s0), prev = Math.atan2(s.b[i].y - s.b[0].y, s.b[i].x - s.b[0].x), tot = 0;
    for (var k = 0; k < maxSteps; k++) {
      step(s, dt, 1);
      var ang = Math.atan2(s.b[i].y - s.b[0].y, s.b[i].x - s.b[0].x), d = ang - prev;
      if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI;
      if (tot + d >= 2 * Math.PI) return s.t - dt + dt * (2 * Math.PI - tot) / d;
      tot += d; prev = ang;
    }
    return NaN;
  }

  var API = { FOURPI2: FOURPI2, MEARTH_MSUN: MEARTH_MSUN, fromSystem: fromSystem, toCOM: toCOM, clone: clone, step: step, energy: energy, keplerPeriod: keplerPeriod, measurePeriod: measurePeriod };
  if (typeof module !== "undefined" && module.exports) module.exports = API; else root.NV3_NBODY = API;
})(typeof window !== "undefined" ? window : this);
