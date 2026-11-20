#!/usr/bin/env node
/* 宙律 Nomoverse 3.0 · 宇宙配方台数值单测(node nomoverse/3/tests/universe.test.js,零依赖)
 * 覆盖:真实宇宙基线、与 2.0 core/cosmos.js 标度律一致、弗里德曼解析解、T1–T7 判定、9 种失败码可达、
 * 确定性(固定种子)、N 体(开普勒周期 ≤1%、能量漂移 ≤0.1%/千步)、GUS v0 编解码与校验。 */
"use strict";
var path = require("path");
var U = require(path.join(__dirname, "..", "core", "universe.js"));
var N = require(path.join(__dirname, "..", "core", "nbody.js"));
var S = require(path.join(__dirname, "..", "core", "gus0.js"));
var C2 = require(path.join(__dirname, "..", "..", "core", "cosmos.js"));   // 2.0 模型(只读复用)
var pass = 0, fail = 0, rows = [];
function check(name, got, want, tolRel, tolAbs) {
  var err = Math.abs(got - want), ok = isFinite(got) && err <= Math.max(tolAbs || 0, Math.abs(want) * (tolRel || 0));
  rows.push((ok ? "PASS" : "FAIL") + "  " + name + "  got=" + fmt(got) + "  want=" + fmt(want));
  ok ? pass++ : fail++;
}
function truthy(name, cond, info) { rows.push((cond ? "PASS" : "FAIL") + "  " + name + (info ? "  " + info : "")); cond ? pass++ : fail++; }
function fmt(x) { return typeof x === "number" ? (x !== 0 && (Math.abs(x) < 1e-3 || Math.abs(x) > 1e6) ? x.toExponential(4) : x.toFixed(6)) : String(x); }
function has(r, code) { return r.failures.indexOf(code) >= 0; }
function hasW(r, code) { return r.warnings.indexOf(code) >= 0; }

/* ---- 1. 真实宇宙基线 ---- */
var real = U.run({});
truthy("真实宇宙 status = ok", real.status === "ok", real.status);
truthy("真实宇宙 T1–T7 全部 ok", U.ORDER.every(function (t) { return real.stages[t] === "ok"; }));
truthy("真实宇宙无失败、无警告", real.failures.length === 0 && real.warnings.length === 0);
check("真实宇宙年龄 ≈ 13.797 Gyr(Planck 2018,±0.5%)", real.cosmos.ageGyr, 13.797, 0.005);
check("真实宇宙曲率 Ωk = 0(平直)", real.cosmos.Ok, 0, 0, 1e-12);
truthy("真实宇宙命运 = 持续膨胀", real.cosmos.fate === "expand");
check("原初氦质量分数 Y = 0.25", real.nucleo.Y, 0.25, 1e-12);
check("α 倍数 = 1", real.alphaEff, 1, 0, 0);
check("玻尔半径 52.918 pm", real.atoms.a0pm, 52.917721, 1e-9);
check("最重稳定元素 Z = 82(铅)", real.atoms.zMax, 82, 0, 0);
check("能点燃的恒星比例 = 1(IMF 全在窗口内)", real.ignition.frac, 1, 1e-9);
truthy("真实宇宙至少一颗宜居行星", real.planets.some(function (q) { return q.habitable; }) && real.habitable);
check("1 M☉ 恒星:光度 1 L☉、半径 1 R☉、T_eff 5772 K", U.star(1, U.normalize({})).teff, 5772, 1e-12);
check("1 M☉ 恒星主序寿命 10 Gyr", U.star(1, U.normalize({})).lifeGyr, 10, 1e-12);
check("1/H0 ≈ 14.51 Gyr(H0 = 67.4)", U.HUBBLE_GYR, 14.507, 1e-3);

/* ---- 2. 与 2.0 core/cosmos.js 标度律一致(3.0 只复用模型) ---- */
[0.5, 2, 3].forEach(function (k) {
  var p = U.normalize({ kG: k }), s = U.star(1, p), g = C2.grav(k);
  check("G×" + k + " 光度与 2.0 一致(∝G⁴)", s.L, g.L, 1e-12);
  check("G×" + k + " 寿命与 2.0 一致(∝G⁻⁴)", s.lifeGyr, g.life, 1e-12);
  /* 1 AU 行星在 G 改变后到 1/k AU:平衡温度比 = 2.0 的地表温度比 k^1.5 */
  var teq = 255 * Math.pow(s.L, 0.25) / Math.sqrt(1 / k);
  check("G×" + k + " 平衡温度比与 2.0 一致(∝G^1.5)", teq / 255, g.temp / C2.T_SURF, 1e-12);
});
[0.5, 1.5, 2].forEach(function (k) {
  var a = U.atoms(k), b = C2.atom(k);
  check("α×" + k + " 玻尔半径与 2.0 一致", a.a0pm, b.a0 * 52.917721 / C2.A0, 1e-4);
  check("α×" + k + " Hα 波长与 2.0 一致", a.haNM, b.ha, 1e-12);
  truthy("α×" + k + " Hα 可见性与 2.0 一致", a.haVisible === b.visible);
});

/* ---- 3. 弗里德曼积分对照解析解 ---- */
var I = U._int;
check("爱因斯坦–德西特(Ωm=1)年龄 = 2/3 · 1/H0", I.ageTo(1, 1, 0, 0), 2 / 3, 1e-4);
var oL = 0.685, oM = 0.315, t0 = 2 / (3 * Math.sqrt(oL)) * Math.asinh(Math.sqrt(oL / oM));
check("平直 ΛCDM 年龄 = 2/(3√ΩΛ)·asinh(√(ΩΛ/Ωm))", I.ageTo(1, oM, 0, oL), t0, 1e-4);
check("闭合纯物质(Ωm=2,Ωk=−1)最大尺度 a_max = 2", I.findTurn(2, -1, 0), 2, 1e-9);
check("闭合纯物质挤压时刻 = π·Ωm/(Ωm−1)^1.5 = 2π", 2 * I.ageTurn(2, 2, -1, 0, 20000), 2 * Math.PI, 5e-3);
truthy("开放无 Λ 宇宙命运 = 惯性滑行", U.run({ kL: 0, Om: 0.1 }).cosmos.fate === "coast");
truthy("负 Λ 必然回缩", U.run({ kL: -1 }).cosmos.fate === "crunch");
truthy("G 增大 → 宇宙更早回缩(G×2 早于 G×1.5)", U.run({ kG: 2 }).cosmos.crunchGyr < U.run({ kG: 1.5 }).cosmos.crunchGyr);
truthy("G 减小 → 宇宙更快变稀(到今天尺度的时间更短)", U.run({ kG: 0.5 }).cosmos.ageGyr < real.cosmos.ageGyr);

/* ---- 4. 七关判定 ---- */
var r;
r = U.run({ kG: 10 }); truthy("T1 G×10 → 1 Gyr 内大挤压(crunch 失败)", has(r, "crunch") && r.stages.T1 === "fail", r.cosmos.crunchGyr.toFixed(3) + " Gyr");
r = U.run({ kG: 2 }); truthy("T1 G×2 → 回缩但晚于 1 Gyr(警告)", hasW(r, "crunch") && r.stages.T1 === "warn");
r = U.run({ eps: 0.0059 }); truthy("T2 ε=0.0059 → 只有氢(警告)且 T5 不点燃", hasW(r, "hydrogen_only") && has(r, "no_ignition"));
r = U.run({ eps: 0.0081 }); truthy("T2 ε=0.0081 → 全是氦(失败)", has(r, "helium_only") && r.nucleo.Y === 1);
check("T2 ε=0.0075 氦比例插值 Y = 0.625", U.nucleo(U.normalize({ eps: 0.0075 })).Y, 0.625, 1e-12);
r = U.run({ kA: 15 }); truthy("T3 α×15 → 无原子(Z_max < 6)", has(r, "no_atoms"), "Zmax=" + r.atoms.zMax);
r = U.run({ kA: 5 }); truthy("T3 α×5 → 元素稀少(警告,Z_max=16)", hasW(r, "few_elements") && r.atoms.zMax === 16);
r = U.run({ kA: 0.3 }); truthy("T7 α×0.3 → 化学键太弱(化学冻结)", has(r, "chem_freeze"));
r = U.run({ Q: 1e-7 }); truthy("T4 Q=1e-7 → 冷寂", has(r, "cold"));
r = U.run({ Q: 5e-4 }); truthy("T4 Q=5e-4 → 黑洞汤 + T7 轨道瓦解", has(r, "bh_soup") && has(r, "orbit_break"));
r = U.run({ kL: 500 }); truthy("T4 Λ×500 → 来不及成团(冷寂)", has(r, "cold"));
r = U.run({ kG: 0.1 }); truthy("T5 G×0.1 → 恒星不点燃", has(r, "no_ignition"), "frac=" + r.ignition.frac.toFixed(4));
r = U.run({ kG: 0.5 }); truthy("T5 G×0.5 → 点燃比例下降(警告)", hasW(r, "no_ignition"));
check("T5 点燃下限 ∝ G^-1.5:G×4 → 0.01 M☉", U.ignition(U.normalize({ kG: 4 })).mMin, 0.01, 1e-12);
check("T5 点燃上限 ∝ G^-1.5:G×0.25 → 1200 M☉", U.ignition(U.normalize({ kG: 0.25 })).mMax, 1200, 1e-12);
r = U.run({ kG: 3 }); truthy("T6 G×3 → 恒星闪灭(寿命 < 1 亿年)", has(r, "flash"), r.star.lifeGyr.toFixed(4) + " Gyr");
r = U.run({ kG: 2 }); truthy("T6 G×2 → 寿命不足 10 亿年(警告)", hasW(r, "flash"));
check("T6 寿命 ∝ ε:ε=0.0075 时 1 M☉ 寿命 = 10.714 Gyr", U.star(1, U.normalize({ eps: 0.0075 })).lifeGyr, 10 * 0.0075 / 0.007, 1e-12);
truthy("上游失败 → T7 至少警告", U.run({ kA: 15 }).stages.T7 !== "ok");

/* 9 种失败可视化(方案 §1.6)全部可达 */
var NINE = { crunch: { kG: 10 }, cold: { Q: 1e-7 }, bh_soup: { Q: 5e-4 }, no_atoms: { kA: 15 }, helium_only: { eps: 0.0085 },
  no_ignition: { kG: 0.05 }, flash: { kG: 3 }, orbit_break: { Q: 2e-4 }, chem_freeze: { kA: 0.3 } };
Object.keys(NINE).forEach(function (code) {
  var rr = U.run(NINE[code]);
  truthy("失败码可达:" + code + "(→" + U.FAILURES[code] + ")", has(rr, code) && rr.stages[U.FAILURES[code]] === "fail" && rr.status === "fail");
});

/* ---- 5. c 的诚实开关 ---- */
check("只改 c(联动):c×0.1 → α 实际 ×10", U.run({ kc: 0.1 }).alphaEff, 10, 1e-12);
check("只改 c(不联动 = 单位换算):α 不变", U.run({ kc: 0.1, alphaLinked: false }).alphaEff, 1, 0, 0);
(function () {
  var a = U.run({ kc: 0.1, alphaLinked: false }), b = U.run({});
  delete a.recipe; delete b.recipe;
  truthy("不联动时只改 c,宇宙的一切可观测结果与真实宇宙逐位相同", JSON.stringify(a) === JSON.stringify(b));
})();
truthy("同时改 α 与 c 使 α/c 不变 → 等同真实宇宙", U.run({ kA: 2, kc: 2 }).alphaEff === 1);

/* ---- 6. 确定性(固定种子) ---- */
var P1 = U.prng(1);
check("mulberry32(1) 第 1 个值(参考实现)", P1(), 0.6270739405881613, 0, 1e-16);
truthy("同配方同种子:两次结果逐位相同", JSON.stringify(U.run({ kG: 1.3, seed: 42 })) === JSON.stringify(U.run({ kG: 1.3, seed: 42 })));
(function () {
  var same = 0, differ = 0;
  for (var sd = 1; sd <= 50; sd++) {
    if (JSON.stringify(U.run({ seed: sd })) === JSON.stringify(U.run({ seed: sd }))) same++;
    if (JSON.stringify(U.run({ seed: sd }).planets) !== JSON.stringify(U.run({ seed: sd + 1000 }).planets)) differ++;
  }
  check("50 个种子各跑两次全部一致", same, 50, 0, 0);
  check("不同种子生成不同恒星系(50/50)", differ, 50, 0, 0);
})();
(function () {
  var n = U.normalize({ kG: 1e6, eps: -1, Q: "x", seed: -1 });
  truthy("越界配方被夹回范围、非法值回默认、种子取 32 位无符号", n.kG === 100 && n.eps === 0.004 && n.Q === 1e-5 && n.seed === 4294967295);
})();
truthy("行星 2–5 颗,半长轴单调递增", [1, 2, 3, 4, 5, 6, 7, 8].every(function (sd) {
  var pl = U.run({ seed: sd }).planets; return pl.length >= 2 && pl.length <= 5 && pl.every(function (q, i) { return i === 0 || q.aAU > pl[i - 1].aAU; });
}));

/* ---- 7. N 体(验收关卡 C:开普勒周期 ≤1%,能量漂移 ≤0.1%/千步) ---- */
[1, 2].forEach(function (k) {
  var res = U.run({ kG: k, seed: 7 }), s0 = N.fromSystem(res);
  var inner = res.planets[0], Tk = N.keplerPeriod(s0.G, res.star.M, inner.mass_kg / 1.98847e30, inner.aAU);
  check("G×" + k + " 行星表周期 = 开普勒公式(SI 与 AU/年互证)", inner.period_s / 3.15576e7, Tk, 1e-4);
  var dt = Tk / 400;
  var Tm = N.measurePeriod(s0, 1, dt, 4000);
  var e = inner.e, Tw = Tk;                         // 近日点出发,周期与偏心率无关
  truthy("G×" + k + " N 体实测周期与开普勒周期相差 ≤1%", Math.abs(Tm - Tw) / Tw <= 0.01, "rel=" + (Math.abs(Tm - Tw) / Tw).toExponential(3) + " e=" + e.toFixed(3));
  var s = N.clone(s0), E0 = N.energy(s); N.step(s, dt, 1000); var E1 = N.energy(s);
  truthy("G×" + k + " 1000 步能量漂移 ≤0.1%", Math.abs((E1 - E0) / E0) <= 1e-3, "rel=" + Math.abs((E1 - E0) / E0).toExponential(3));
  N.step(s, dt, 9000); var E2 = N.energy(s);
  truthy("G×" + k + " 10000 步能量漂移仍 ≤0.1%(辛积分有界)", Math.abs((E2 - E0) / E0) <= 1e-3, "rel=" + Math.abs((E2 - E0) / E0).toExponential(3));
});
(function () {
  var res = U.run({ seed: 7 }), a = N.step(N.fromSystem(res), 0.001, 500), b = N.step(N.fromSystem(res), 0.001, 500);
  truthy("N 体固定步长:两次积分逐位相同", JSON.stringify(a) === JSON.stringify(b));
  var px = 0, py = 0; a.b.forEach(function (o) { px += o.m * o.vx; py += o.m * o.vy; });
  check("N 体总动量守恒(质心系 ≈ 0)", Math.hypot(px, py), 0, 0, 1e-12);
})();

/* ---- 8. GUS v0 ---- */
var meta = { name: { zh: "长明宇宙", en: "Everlight" }, created: "2026-11-20T21:00:00+08:00" };
var g = S.toGUS(U.run({ kG: 0.5, seed: 20261120 }), meta);
truthy("GUS 版本 0.1、kind = universe", g.gus === "0.1" && g.kind === "universe");
truthy("GUS 生成即通过校验", S.validate(g).ok, S.validate(g).errors.join(","));
check("GUS G 的 SI 值 = 0.5 × 6.6743e-11", g.constants.G.si, 3.33715e-11, 1e-6);
check("GUS 恒星光度(G×0.5)= M³/16 L☉", g.system.star.lum_W / 3.828e26, Math.pow(U.run({ kG: 0.5, seed: 20261120 }).star.M, 3) / 16, 1e-5);
var enc = S.encodeJ(g), dec = S.decodeJ(enc);
truthy("GUS j. 编码 → 解码逐字段相同", JSON.stringify(dec) === JSON.stringify(g), "长度 " + enc.length + " 字符");
truthy("GUS 编码只含 URL 安全字符", /^j\.[A-Za-z0-9_-]+$/.test(enc));
truthy("GUS 中文名称往返不乱码", dec.name.zh === "长明宇宙");
truthy("GUS → 配方 → 再跑 → 再导出:与原 GUS 逐位相同(复现性)", JSON.stringify(S.toGUS(U.run(S.toRecipe(g)), meta)) === JSON.stringify(g));
truthy("GUS id 由配方决定:同配方同 id、换种子换 id", S.toGUS(U.run({ seed: 1 })).id === S.toGUS(U.run({ seed: 1 })).id && S.toGUS(U.run({ seed: 1 })).id !== S.toGUS(U.run({ seed: 2 })).id);
truthy("GUS 名称去掉尖括号与控制字符、截到 40 字", S.toGUS(real, { name: { zh: "<b>x</b>" + "长".repeat(60) } }).name.zh.indexOf("<") < 0 && S.toGUS(real, { name: { zh: "长".repeat(60) } }).name.zh.length === 40);
truthy("九种失败宇宙导出的 GUS 都能通过校验", Object.keys(NINE).every(function (c) { return S.validate(S.toGUS(U.run(NINE[c]))).ok; }));
function bad(name, mut) { var x = JSON.parse(JSON.stringify(g)); mut(x); truthy("GUS 拒收:" + name, !S.validate(x).ok); }
bad("主版本 1.0", function (x) { x.gus = "1.0"; });
bad("kind ≠ universe", function (x) { x.kind = "star"; });
bad("行星 9 颗", function (x) { while (x.system.planets.length < 9) x.system.planets.push(x.system.planets[0]); });
bad("行星半长轴越界", function (x) { x.system.planets[0].a_m = 1; });
bad("偏心率 ≥ 0.99", function (x) { x.system.planets[0].e = 1.2; });
bad("行星类型未知", function (x) { x.system.planets[0].kind = "<script>"; });
bad("G 倍数越界", function (x) { x.constants.G.k = 1000; });
bad("缺少 Q", function (x) { delete x.constants.Q; });
bad("种子为负", function (x) { x.seed = -5; });
truthy("GUS 次版本更高(0.2)仍可读", (function () { var x = JSON.parse(JSON.stringify(g)); x.gus = "0.2"; x.extra = { a: 1 }; return S.validate(x).ok; })());
truthy("GUS 解码拒收非 j. 前缀与坏数据", S.decodeJ("x.abc") === null && S.decodeJ("j.%%%") === null);

/* ---- 输出 ---- */
console.log(rows.join("\n"));
console.log("\n合计:" + pass + " 通过," + fail + " 失败");
process.exit(fail ? 1 : 0);
