#!/usr/bin/env node
/* 宙律 Nomoverse · 物理自动化测试(node tests/physics.test.js,零依赖)
 * 对照解析解与权威数值:环绕速度 √(GM/r)、开普勒周期、10 圈能量漂移 < 0.1%、
 * 抛体解析解、二次阻力、多普勒 f′ = f·c/(c∓v)、推迟时刻、拍频、马赫角。 */
"use strict";
var path = require("path");
var P = require(path.join(__dirname, "..", "core", "nv.js")).Phys;
var pass = 0, fail = 0, rows = [];
function check(name, got, want, tolRel, tolAbs) {
  var err = Math.abs(got - want), ok = err <= Math.max(tolAbs || 0, Math.abs(want) * (tolRel || 0));
  rows.push((ok ? "PASS" : "FAIL") + "  " + name + "  got=" + fmt(got) + "  want=" + fmt(want) + "  err=" + fmt(err));
  ok ? pass++ : fail++;
}
function truthy(name, cond, info) { rows.push((cond ? "PASS" : "FAIL") + "  " + name + (info ? "  " + info : "")); cond ? pass++ : fail++; }
function fmt(x) { return typeof x === "number" ? (Math.abs(x) < 1e-3 || Math.abs(x) > 1e6 ? x.toExponential(4) : x.toFixed(6)) : String(x); }

/* ---- 1. 常数 ---- */
check("GM_earth SI = 3.986004418e14 m^3/s^2", P.GM_EARTH_SI, 3.986004418e14, 0, 1);
check("MU (km^3/s^2) = GM/1e9", P.MU_EARTH, P.GM_EARTH_SI / 1e9, 1e-15);
check("R_earth = 6371 km", P.R_EARTH, 6371, 0, 0);

/* ---- 2. 环绕速度与周期(空间站高度约 400–420 km) ---- */
var mu = P.MU_EARTH, R = P.R_EARTH;
var r400 = R + 400, r420 = R + 420;
check("v_circ(400 km) ≈ 7.67 km/s (sqrt(mu/r))", P.vCirc(mu, r400), Math.sqrt(398600.4418 / 6771), 1e-12);
truthy("v_circ(400 km) 在 NASA 公布的约 7.66 km/s(17,150 mph)±0.5% 内", Math.abs(P.vCirc(mu, r420) - 7.666) / 7.666 < 0.005, "v(420km)=" + P.vCirc(mu, r420).toFixed(4) + " km/s");
check("地表环绕速度 ≈ 7.91 km/s", P.vCirc(mu, R), 7.9096, 1e-4);
check("逃逸速度(地表) ≈ 11.19 km/s", P.vEsc(mu, R), 11.1859, 1e-4);
var T400 = P.period(mu, r400);
check("开普勒周期 T(400 km) = 2π√(r³/μ) ≈ 92.4 min", T400 / 60, 2 * Math.PI * Math.sqrt(Math.pow(6771, 3) / 398600.4418) / 60, 1e-12);
truthy("T(400–420 km) 落在 NASA 约 90–93 分钟范围", T400 / 60 > 90 && P.period(mu, r420) / 60 < 93.5, "T400=" + (T400 / 60).toFixed(2) + " min");
check("radiusForPeriod 与 period 互逆", P.radiusForPeriod(mu, T400), r400, 1e-12);
check("地表 g = GM/R² ≈ 9.82 m/s²(不计自转)", P.gAt(P.GM_EARTH_SI, 6371e3), 9.8203, 1e-4);
check("400 km 处 g ≈ 8.69 m/s²(约地表 89%)", P.gAt(P.GM_EARTH_SI, 6771e3), 8.6943, 1e-3);

/* ---- 3. 数值积分:圆轨道 10 圈 ---- */
function runOrbit(r, vfac, dt, orbits, drag) {
  var v = P.vCirc(mu, r) * vfac, s = P.body(r, 0, 0, v);
  var el = P.elements(mu, s), T = el.T, E0 = P.energy(mu, s), steps = Math.round(orbits * T / dt), maxDrift = 0, minR = 1e9, maxR = 0;
  for (var i = 0; i < steps; i++) {
    P.advance(s, mu, dt, dt, drag);
    var e = Math.abs((P.energy(mu, s) - E0) / E0); if (e > maxDrift) maxDrift = e;
    var rr = Math.hypot(s.x, s.y); if (rr < minR) minR = rr; if (rr > maxR) maxR = rr;
  }
  return { s: s, T: T, drift: maxDrift, minR: minR, maxR: maxR, E0: E0, steps: steps, el: el };
}
// 与站内一致的子步长:orbit 关卡用 dt ≤ 2 s
var o1 = runOrbit(r400, 1, 2, 10);
truthy("Verlet dt=2 s,圆轨道 10 圈能量漂移 < 0.1%", o1.drift < 1e-3, "maxDrift=" + o1.drift.toExponential(3));
truthy("圆轨道 10 圈半径变化 < 0.1%", (o1.maxR - o1.minR) / r400 < 1e-3, "Δr=" + (o1.maxR - o1.minR).toFixed(4) + " km");
check("10 圈后回到起点附近(相位误差 < 0.2%圈)", Math.atan2(o1.s.y, o1.s.x), 0, 0, 2 * Math.PI * 0.002);
var o2 = runOrbit(r400, 1.15, 2, 10);
truthy("椭圆轨道(v×1.15)10 圈能量漂移 < 0.1%", o2.drift < 1e-3, "maxDrift=" + o2.drift.toExponential(3) + " e=" + o2.el.e.toFixed(3));
// 数值周期:测一圈穿过 +x 轴的时间
(function () {
  var r = R + 2000, s = P.body(r, 0, 0, P.vCirc(mu, r)), dt = 1, t = 0, prevY = 0, Tnum = 0;
  for (var i = 0; i < 20000; i++) {
    P.verletStep(s, mu, dt); t += dt;
    if (prevY < 0 && s.y >= 0 && s.x > 0) { Tnum = t - dt * s.y / (s.y - prevY); break; }
    prevY = s.y;
  }
  check("数值周期 = 开普勒周期(r=R+2000 km)", Tnum, P.period(mu, r), 1e-4);
})();
// RK4 同样守恒(用于含阻力情形的积分器本身)
(function () {
  var s = P.body(r400, 0, 0, P.vCirc(mu, r400)), E0 = P.energy(mu, s), T = P.period(mu, r400), n = Math.round(10 * T / 2);
  for (var i = 0; i < n; i++) P.rk4Step(s, function (x, y) { return P.gravAcc(mu, x, y); }, 2);
  truthy("RK4 dt=2 s,10 圈能量漂移 < 0.1%", Math.abs((P.energy(mu, s) - E0) / E0) < 1e-3, "drift=" + Math.abs((P.energy(mu, s) - E0) / E0).toExponential(3));
})();
// 引力加倍:环绕速度 ×√2,周期 ÷√2
check("质量 ×2 → v_circ ×√2", P.vCirc(2 * mu, r400) / P.vCirc(mu, r400), Math.SQRT2, 1e-12);
check("质量 ×4 → 周期 ÷2", P.period(mu, r400) / P.period(4 * mu, r400), 2, 1e-12);
check("开普勒第三定律 T²/a³ 恒定", Math.pow(P.period(mu, R + 400), 2) / Math.pow(R + 400, 3), Math.pow(P.period(mu, R + 5000), 2) / Math.pow(R + 5000, 3), 1e-12);
// 霍曼式相位:降低轨道后周期变短
(function () {
  var s = P.body(r420, 0, 0, P.vCirc(mu, r420) - 0.03), el = P.elements(mu, s);
  truthy("向后点火 30 m/s:周期变短(追上前方目标)", el.T < P.period(mu, r420), "ΔT=" + (P.period(mu, r420) - el.T).toFixed(1) + " s/圈");
  truthy("向后点火后近地点降低、远地点仍在点火处", el.rp < r420 && Math.abs(el.ra - r420) < 0.01, "rp=" + el.rp.toFixed(1) + " ra=" + el.ra.toFixed(3));
})();

/* ---- 4. 抛体 ---- */
var g = 9.80665;
check("同高射程 R = v² sin2θ / g (v=10, 45°)", P.range(10, 45, g), 100 / g, 1e-12);
check("平抛落地 x = v√(2h/g) (v=18, h=20)", P.hRange(18, 20, g), 18 * Math.sqrt(40 / g), 1e-12);
(function () {
  // 无阻力:shoot 的轨迹点与解析解 y(x) 一致
  var o = { v: 7.4, ang: 52, g: g, x0: 0, y0: 2.1, k: 0, hoopX: 4.6, rimY: 3.05 };
  var r = P.shoot(o), maxErr = 0;
  r.pts.forEach(function (p) { if (p[0] > 0.01) maxErr = Math.max(maxErr, Math.abs(p[1] - P.projY(p[0], 7.4, 52, g, 2.1))); });
  truthy("无阻力投篮轨迹与解析抛物线一致(误差 < 1 µm)", maxErr < 1e-6, "maxErr=" + maxErr.toExponential(2));
  // 解析求进球速度:y(4.6)=3.05
  var th = 52 * Math.PI / 180, x = 4.6, dy = 0.95;
  var vNeed = Math.sqrt(g * x * x / (2 * Math.cos(th) * Math.cos(th) * (x * Math.tan(th) - dy)));
  var r2 = P.shoot({ v: vNeed, ang: 52, g: g, x0: 0, y0: 2.1, k: 0, hoopX: 4.6, rimY: 3.05 });
  truthy("解析进球速度投篮 → 命中", r2.res === "made", "v=" + vNeed.toFixed(3) + " m/s, cross=" + r2.cross.toFixed(4));
  var r3 = P.shoot({ v: vNeed, ang: 52, g: 2 * g, x0: 0, y0: 2.1, k: 0, hoopX: 4.6, rimY: 3.05 });
  truthy("同样出手、g×2 → 不进(偏短)", r3.res !== "made" && (r3.res === "short" || r3.res === "low" || r3.res === "rim"), "res=" + r3.res);
  check("g×2 时所需速度 = 原速度×√2", Math.sqrt(2 * g * x * x / (2 * Math.cos(th) * Math.cos(th) * (x * Math.tan(th) - dy))) / vNeed, Math.SQRT2, 1e-12);
  // 半隐式欧拉在 k→0 时收敛到解析解
  var rk = P.shoot({ v: 10, ang: 45, g: g, x0: 0, y0: 0, k: 1e-12, hoopX: 99, rimY: 99, xMax: 50 });
  var last = rk.pts[rk.pts.length - 1], prev = rk.pts[rk.pts.length - 2];
  var xLand = prev[0] + (last[0] - prev[0]) * prev[1] / (prev[1] - last[1]);
  check("数值积分(k≈0, dt=1/240)射程 ≈ 解析射程(<0.5%)", xLand, P.range(10, 45, g), 5e-3);
  // 二次阻力:射程变短,且与高精度 RK4 参考解一致
  var rd = P.shoot({ v: 10, ang: 45, g: g, x0: 0, y0: 0, k: P.K_BALL, hoopX: 99, rimY: 99, xMax: 50 });
  var l2 = rd.pts[rd.pts.length - 1], p2 = rd.pts[rd.pts.length - 2], xd = p2[0] + (l2[0] - p2[0]) * p2[1] / (p2[1] - l2[1]);
  var s = { x: 0, y: 0, vx: 10 * Math.SQRT1_2, vy: 10 * Math.SQRT1_2 }, k = P.K_BALL, py = 0, px = 0;
  function acc(x, y, vx, vy) { var sp = Math.hypot(vx, vy); return [-k * sp * vx, -g - k * sp * vy]; }
  for (var i = 0; i < 400000; i++) { px = s.x; py = s.y; P.rk4Step(s, acc, 1e-5); if (s.y < 0) break; }
  var xRef = px + (s.x - px) * py / (py - s.y);
  truthy("二次阻力使射程变短", xd < P.range(10, 45, g), "有阻力 " + xd.toFixed(3) + " m < 无阻力 " + P.range(10, 45, g).toFixed(3) + " m");
  check("二次阻力:半隐式欧拉 vs RK4 参考解(<1%)", xd, xRef, 1e-2);
  check("篮球阻力系数 k = ρCdA/(2m)", P.K_BALL, 1.2 * 0.47 * Math.PI * 0.0144 / 1.2, 1e-12);
  // 风:顺风有阻力时射程更远
  var rw = P.shoot({ v: 10, ang: 45, g: g, x0: 0, y0: 0, k: P.K_BALL, wind: 5, hoopX: 99, rimY: 99, xMax: 50 });
  var l3 = rw.pts[rw.pts.length - 1];
  truthy("顺风 5 m/s 射程大于无风", l3[0] > xd, "顺风 " + l3[0].toFixed(2) + " m");
  // g=0:不会向下穿过篮筐
  var r0 = P.shoot({ v: 6, ang: 10, g: 0, x0: 0, y0: 2.1, k: 0, hoopX: 4.6, rimY: 3.05 });
  truthy("g=0:直线飞行,不可能从上方落入篮筐", r0.res !== "made", "res=" + r0.res);
})();

/* ---- 5. 声学 ---- */
check("多普勒(靠近)f′=f·c/(c−v):700 Hz, 30 m/s, 343 m/s", P.doppler(700, 343, 30), 700 * 343 / 313, 1e-12);
check("多普勒(远离)f′=f·c/(c+v)", P.doppler(700, 343, -30), 700 * 343 / 373, 1e-12);
check("多普勒靠近数值 ≈ 767.09 Hz", P.doppler(700, 343, 30), 767.0927, 1e-6);
check("观察者运动一般式 f(c+vo)/(c−vs)", P.dopplerGeneral(500, 343, 10, 0), 500 * 353 / 343, 1e-12);
check("拍频 |f1−f2|:220 与 223 Hz → 3 Hz", P.beat(220, 223), 3, 0, 1e-12);
check("波长 λ = c/f:343/440", P.wavelength(343, 440), 0.779545, 1e-5);
check("马赫锥半角 sinθ = c/v(M=2 → 30°)", P.machHalfAngle(686, 343) * 180 / Math.PI, 30, 1e-9);
truthy("亚音速无马赫锥", P.machHalfAngle(100, 343) === null);
(function () {
  // 推迟时刻:声源沿 x 匀速,观察者在 (0, 20);从很远处驶来
  var c = 343, v = 30, x0 = -400, f = 700;
  var tA = 2;  // 声源仍在左侧远处 → 接收频率接近 f c/(c−v)
  var te = P.retarded(tA, -10, x0, v, c, 0, 20);
  truthy("亚音速:任一时刻恰有一个推迟解", te.length === 1, "n=" + te.length);
  var fr = P.receivedFreq(f, c, te[0], x0, v, 0, 20);
  truthy("远处驶来时接收频率接近 f·c/(c−v)", Math.abs(fr - P.doppler(f, c, v)) / fr < 0.003, "f'=" + fr.toFixed(2));
  // 推迟方程本身成立:c(t−te) = 距离
  var d = Math.hypot(x0 + v * te[0], 20);
  check("推迟方程 c(t−te)=|r_s(te)−r_L|", c * (tA - te[0]), d, 1e-6);
  // 超音速:锥面扫过前无解,扫过后两个解
  var vs = 600, xs0 = -300;
  var early = P.retarded(0.2, -5, xs0, vs, c, 0, 20), late = P.retarded(1.2, -5, xs0, vs, c, 0, 20);
  truthy("超音速:马赫锥到达前听不到(0 个解)", early.length === 0, "n=" + early.length);
  truthy("超音速:锥面扫过后同时收到两段声音(2 个解)", late.length === 2, "n=" + late.length);
})();

/* ---- 恒星(v0.5 nv.stars)---- */
(function () {
  check("M☉ = GM☉/G ≈ 1.9884e30 kg", P.M_SUN, 1.98841e30, 1e-4);
  check("4¹H→⁴He 质量亏损 ≈ 0.712%", P.massDefect(), 0.0071185, 1e-4);
  check("每秒变成光的质量 L/c² ≈ 4.26e9 kg(426 万吨)", P.massToLight(), 3.828e26 / Math.pow(299792458, 2), 1e-12);
  truthy("每秒烧掉的氢 ≈ 6.0 亿吨(5.9–6.1e11 kg)", P.hydrogenBurnRate() > 5.9e11 && P.hydrogenBurnRate() < 6.1e11, P.hydrogenBurnRate().toExponential(4));
  check("E=mc²:power(L/c²) 还原 L☉", P.powerFromMass(P.massToLight()), 3.828e26, 1e-12);
  var coal = P.sunFuelYears("coal"), kh = P.sunFuelYears("gravity"), nuc = P.sunFuelYears("fusion");
  truthy("煤:约 5 千年(3e3–8e3 年)", coal > 3e3 && coal < 8e3, coal.toFixed(0) + " 年");
  truthy("引力收缩 GM²/RL:约 3 千万年(2e7–5e7)", kh > 2e7 && kh < 5e7, kh.toExponential(3) + " 年");
  truthy("核聚变:约 100 亿年(0.8e10–1.3e10)", nuc > 8e9 && nuc < 1.3e10, nuc.toExponential(3) + " 年");
  truthy("只有核聚变撑过地球年龄 45.4 亿年", nuc > P.AGE_EARTH && kh < P.AGE_EARTH && coal < P.AGE_EARTH);
  check("维恩:太阳 5772 K 峰值 ≈ 502 nm", P.wienPeak(5772) * 1e9, 502.04, 1e-4);
  check("斯特藩–玻尔兹曼:4πR²σT⁴ 与 L☉ 相符(±0.5%)", P.stefanL(P.R_SUN, P.T_SUN), 3.828e26, 5e-3);
  var s1 = P.mainSeq(1), s10 = P.mainSeq(10), s2g = P.mainSeq(1, 2);
  check("主序简化:太阳寿命 100 亿年", s1.life, 1e10, 1e-12);
  check("主序简化:10 M☉ 寿命 = 1e10·10^-2.5", s10.life, 1e10 * Math.pow(10, -2.5), 1e-12);
  truthy("更重 → 更热更蓝:10 M☉ 表面温度 > 1.5 万 K(蓝白色)", s10.T > 1.5e4, s10.T.toFixed(0) + " K");
  check("引力 ×2:L × 16,寿命 ÷ 16", s2g.life, 1e10 / 16, 1e-12);
  var x = 1 / 1.2; for (var i = 0; i < 2000; i++) x = P.thermoStep(x, 0.005, true);
  check("恒温器:核心热 20% 后回到平衡半径 1", x, 1, 0, 1e-6);
  var y = 1; for (var j = 0; j < 200; j++) y = P.thermoStep(y, 0.005, false);
  check("无聚变:按 x = 1/(1+2t) 收缩", y, 1 / (1 + 2 * 1.0), 2e-4);
})();

console.log(rows.join("\n"));
console.log("\n合计:" + pass + " 通过," + fail + " 失败");
process.exit(fail ? 1 : 0);
