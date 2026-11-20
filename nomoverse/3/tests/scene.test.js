#!/usr/bin/env node
/* 宙律 3.0 · 场景数据接口测试(node nomoverse/3/tests/scene.test.js) */
var U = require("../core/universe.js"), S = require("../core/scene.js");
var pass = 0, fail = 0;
function ok(n, c, i) { console.log((c ? "PASS" : "FAIL") + "  " + n + (i ? "  " + i : "")); c ? pass++ : fail++; }
var B = { high: { particles: 65536 }, medium: { particles: 16384 }, low: { particles: 4096 } };

var real = S.describe(U.run({ seed: 20261120 }), B.medium);
ok("真实宇宙:恒星点燃、无失败视觉", real.star.lit && real.failVisual === null && real.status === "ok");
ok("真实宇宙:行星 2–5 颗,半径单调递增且在 [R_IN,R_OUT]", real.planets.length >= 2 && real.planets.length <= 5 && real.planets.every(function (p, i, a) { return p.r >= S.R_IN - 1e-9 && p.r <= S.R_OUT + 1e-9 && (!i || p.r > a[i - 1].r); }));
ok("真实宇宙:宜居带内缘 < 外缘", real.hz && real.hz.rIn < real.hz.rOut && Math.abs(real.hz.aInAU - Math.pow(255 * Math.pow(U.run({ seed: 20261120 }).star.L, 0.25) / 310, 2)) < 1e-12, "a " + real.hz.aInAU.toFixed(3) + "–" + real.hz.aOutAU.toFixed(3) + " AU");
ok("太阳色温 → 偏白暖色", real.star.rgb[0] >= real.star.rgb[2] && real.star.rgb[2] > 0.8);
ok("天空粒子数跟画质预算", S.describe(U.run({}), B.high).sky.particles === 65536 && S.describe(U.run({}), B.low).sky.particles === 4096);
ok("确定性:同种子两次 describe 逐位相同", JSON.stringify(S.describe(U.run({ seed: 7 }), B.low)) === JSON.stringify(S.describe(U.run({ seed: 7 }), B.low)));
ok("不同种子行星不同", JSON.stringify(S.describe(U.run({ seed: 7 }), B.low).planets) !== JSON.stringify(S.describe(U.run({ seed: 8 }), B.low).planets));

/* 开普勒与轨道位置 */
var maxErr = 0;
for (var e = 0; e < 0.95; e += 0.05) for (var M = 0; M < 6.3; M += 0.3) { var E = S.kepler(M, e); var d = E - e * Math.sin(E) - M; d -= 2 * Math.PI * Math.round(d / (2 * Math.PI)); maxErr = Math.max(maxErr, Math.abs(d)); }
ok("开普勒方程残差 < 1e-10(e 0–0.9)", maxErr < 1e-10, maxErr.toExponential(1));
var p0 = real.planets[0], a0 = S.orbitPos(p0, 0), a1 = S.orbitPos(p0, 1);
ok("最内圈行星 1 显示年转一整圈", Math.hypot(a0[0] - a1[0], a0[2] - a1[2]) < 1e-9);
var rr = S.orbitPos(p0, 0.37); var rad = Math.hypot(rr[0], rr[2]);
ok("轨道距离在近/远心点之间", rad >= p0.r * (1 - p0.e) - 1e-9 && rad <= p0.r * (1 + p0.e) + 1e-9);
var outer = real.planets[real.planets.length - 1];
ok("外圈角速度更慢(开普勒第三定律)", outer.omegaVis < p0.omegaVis && Math.abs(outer.omegaVis / p0.omegaVis - p0.periodYr / outer.periodYr) < 1e-12);

/* 失败可视化:每个失败码都有视觉、关卡对得上 universe.FAILURES */
var allCodes = Object.keys(U.FAILURES);
ok("11 个失败码都有失败视觉与关卡", allCodes.length === 11 && allCodes.every(function (c) { return S.FAIL_VISUAL[c] && S.SEVERITY.indexOf(c) >= 0; }));
var cases = { crunch: { kG: 10 }, no_ignition: { eps: 0.0005 }, cold: { Q: 5e-7 }, bh_soup: { Q: 5e-4 }, no_atoms: { kA: 15 } };
Object.keys(cases).forEach(function (code) {
  var r = U.run(cases[code]), d = S.describe(r, B.low);
  ok("失败 " + code + ":视觉模式与关卡", r.failures.indexOf(code) >= 0 ? d.failVisual && d.failVisual.stage === U.FAILURES[d.failVisual.code] : true, d.failVisual ? d.failVisual.code + "/" + d.failVisual.mode : "无失败(" + r.status + ")");
});
var dark = S.describe(U.run({ eps: 0.0005 }), B.low);
ok("不点燃:恒星暗、无行星、无宜居带", !dark.star.lit && dark.planets.length === 0 && dark.hz === null);
var frost = S.describe(U.run({ Q: 5e-7 }), B.low);
ok("冷宇宙:星空密度降到 0.15", frost.sky.density === 0.15);

/* 星空粒子 */
var f1 = S.skyField(42, 4096, U.prng), f2 = S.skyField(42, 4096, U.prng), same = true, inShell = true;
for (var i = 0; i < f1.length; i++) if (f1[i] !== f2[i]) { same = false; break; }
for (i = 0; i < 4096; i++) { var R = Math.hypot(f1[i * 4], f1[i * 4 + 1], f1[i * 4 + 2]); if (R < 59.99 || R > 100.01) inShell = false; }
ok("星空粒子同种子逐位相同、全在 60–100 球壳内", same && inShell && f1.length === 4096 * 4);

console.log("\n合计:" + pass + " 通过," + fail + " 失败");
process.exit(fail ? 1 : 0);
