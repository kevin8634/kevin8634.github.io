// 深空 2.7 模型炼炉 · CO₂ 炉复算(node deep/docs/forge_co2_check.mjs):用引擎同一份代码拟合莫纳罗亚月均 CO₂,assert 数据、模型、派生量、胶囊与过关逻辑
// 加 --official 时打印「总指挥封存」胶囊的预测值与误差(写进 co2.json 的 official 字段时用)
import fs from "fs"; import path from "path"; import { fileURLToPath } from "url";
import * as E from "../forge/engine.js";
import assert from "assert";
const here = path.dirname(fileURLToPath(import.meta.url));
const cfg = JSON.parse(fs.readFileSync(path.join(here, "../forge/co2.json"), "utf8"));
const raw = JSON.parse(fs.readFileSync(path.join(here, "../forge", cfg.data.file), "utf8"));
const data = E.makeData(raw, cfg.data);
const idx = JSON.parse(fs.readFileSync(path.join(here, "../forge/index.json"), "utf8"));
assert(idx.some((f) => f.id === "co2" && f.file === "co2.json"), "index.json 登记 CO₂ 炉");
const init = (blocks) => { const p = {}, lock = {}; cfg.blocks.forEach((b) => b.params.forEach((q) => { p[q.k] = q.value; if (q.lock) lock[q.k] = true; })); return { blocks, p, lock }; };
const f = (v, d = 3) => (+v).toFixed(d);
// 0) 数据
const LAST = raw.meta.last, N = data.N;
assert.strictEqual(data.labels[0], "1958-03"); assert.strictEqual(data.labels[N - 1], LAST);
assert.strictEqual(data.y[0], 315.71);
const i2005 = data.labels.indexOf("2020-05"); assert.strictEqual(data.y[i2005], 417.28); assert.strictEqual(data.x[i2005], 2020.375);
data.e.forEach((e) => assert.strictEqual(e, 0.8, "0.8 ppm 教学误差"));
for (let i = 1; i < N; i++) assert(data.x[i] > data.x[i - 1]);
console.log(`数据 ${N} 行 ✓ 1958-03…${LAST} ✓ 0.8 ppm 教学误差 ✓`);
// 1) 核函数
assert(Math.abs(E.KERNELS.co2lin(2010, { a: 370, b: 2 }) - 390) < 1e-12);
assert(Math.abs(E.KERNELS.co2quad(1990, { c: 0.01 }) - 1) < 1e-12);
assert(Math.abs(E.KERNELS.co2exp(2000, { A: 90, tau: 50 }) - 370) < 1e-12);
assert(Math.abs(E.KERNELS.harm1(2001 + 4.5 / 12, { A1: 3, m1: 5 }) - 3) < 1e-9, "m₁ = 5 → 5 月中为峰");
assert(Math.abs(E.KERNELS.harm2(2001 + 0.5 + 2.5 / 12, { A2: 1, m2: 3 }) - 1) < 1e-9, "半年谐波周期半年");
// 派生量:线性 + 二次的解析增长率 b + 2c(t−2000);季节峰谷差纯年周期 = 2A₁
const g = E.DERIVED.co2g({ a: 0, b: 1.5, c: 0.01, A: 90, tau: 50 }, ["lin", "quad"], { at: 2026.7083 });
assert(Math.abs(g - (1.5 + 2 * 0.01 * 26.7083)) < 1e-6, "co2g " + g);
assert(Math.abs(E.DERIVED.co2g({ A: 90, tau: 50 }, ["exp"], { at: 2000 }) - 90 / 50) < 1e-5);
assert(Math.abs(E.DERIVED.co2amp({ A1: 3, m1: 5, A2: 0, m2: 1 }, ["ann"]) - 6) < 1e-3);
console.log("co2lin/co2quad/co2exp/harm1/harm2 核 ✓ 派生量 co2g/co2amp ✓");
// 2) 组合拟合(从配置初值出发)
const out = {};
const combos = [["线性", ["lin"]], ["线性+二次", ["lin", "quad"]], ["基线+指数", ["exp"]], ["线性+年周期", ["lin", "ann"]], ["线性+二次+年周期", ["lin", "quad", "ann"]], ["线性+二次+年周期+半年", ["lin", "quad", "ann", "semi"]], ["指数+年周期", ["exp", "ann"]], ["指数+年周期+半年", ["exp", "ann", "semi"]]];
for (const [name, bl] of combos) {
  const st = init(bl); const R = E.fit(cfg, data, st); const s2 = { ...st, p: R.p };
  const ev = E.evaluate(cfg, data, s2), sc = E.score(ev), pass = E.passed(cfg, s2, ev), red = ev.z.filter((z) => Math.abs(z) > 3).length;
  const D = E.derived(cfg, s2, R);
  out[name] = { R, s2, ev };
  console.log(`${name.padEnd(14, " ")} k=${ev.k} χ²=${f(ev.chi2, 1)} χ²ν=${f(ev.red, 3)} BIC=${f(ev.bic, 1)} 分=${sc} 红丝=${red} 过关=${pass}`,
    Object.keys(R.sigma).map((k) => `${k}=${f(R.p[k], 4)}±${f(R.sigma[k], 4)}`).join(" "), D.map((x) => `${x.d.name}=${f(x.v, 3)}±${f(x.s, 3)}`).join(" "));
}
const red = (n) => out[n].ev.red, bic = (n) => out[n].ev.bic;
// 期望(与 co2_forge_build.py --scipy 独立复算一致)
assert(Math.abs(red("线性") - 43.11) < 0.05); assert(Math.abs(red("线性+二次") - 7.861) < 0.01); assert(Math.abs(red("基线+指数") - 10.60) < 0.02);
assert(Math.abs(red("线性+二次+年周期") - 1.544) < 0.005); assert(Math.abs(red("线性+二次+年周期+半年") - 1.039) < 0.005); assert(Math.abs(red("指数+年周期+半年") - 3.860) < 0.01);
assert(bic("线性") > bic("线性+二次") && bic("线性+二次") > bic("线性+二次+年周期") && bic("线性+二次+年周期") > bic("线性+二次+年周期+半年"), "BIC 逐级下降");
assert(bic("指数+年周期+半年") - bic("线性+二次+年周期+半年") > 2000, "二次趋势比 280+指数 BIC 低得多");
assert(!E.passed(cfg, out["线性+二次"].s2, out["线性+二次"].ev) && E.passed(cfg, out["线性+二次+年周期"].s2, out["线性+二次+年周期"].ev));
// 线性残差系统性:两端为正、中段为负
const zl = out["线性"].ev.z, mean = (a, b) => { let s = 0, n = 0; data.x.forEach((x, i) => { if (x >= a && x < b) { s += zl[i]; n++; } }); return s / n; };
assert(mean(1958, 1970) > 1 && mean(1985, 2000) < -1 && mean(2015, 2027) > 1, "线性残差 U 形");
console.log(`线性残差均值 1958–70 ${f(mean(1958, 1970), 2)}σ · 1985–2000 ${f(mean(1985, 2000), 2)}σ · 2015–27 ${f(mean(2015, 2027), 2)}σ(U 形)`);
// 季节:峰值月份与峰谷差
const best = out["线性+二次+年周期+半年"], P = best.R.p;
let hiM = 0, hiV = -1e9, loM = 0, loV = 1e9; for (let m = 1; m <= 12; m++) { const t = 2001 + (m - 0.5) / 12, v = E.KERNELS.harm1(t, P) + E.KERNELS.harm2(t, P); if (v > hiV) { hiV = v; hiM = m; } if (v < loV) { loV = v; loM = m; } }
assert.strictEqual(hiM, 5, "季节峰在 5 月"); assert(loM === 9 || loM === 10, "季节谷在 9–10 月");
console.log(`季节(年+半年)月中取样:峰 ${hiM} 月 ${f(hiV, 2)} ppm,谷 ${loM} 月 ${f(loV, 2)} ppm`);
// 3) 胶囊
const cap = cfg.capsules.find((c) => c.id === "co2.2027may"), demo = cfg.capsules.find((c) => c.id === "co2.demo2000");
assert(cap.unlockAt && !cap.demo && E.capsuleTruth(data, cap.truth) === null, "真实胶囊:到期月份尚无数据");
assert(demo.demo && E.capsuleTruth(data, demo.truth).v === 417.28);
// 预测误差:参数协方差一阶传播(梯度数值求)⊕ 0.8 ppm 年际起伏
function predict(st, R, x) {
  const v = E.modelAt(cfg, data, st, x); const ks = Object.keys(R.cov); const gr = ks.map((k) => { const h = 1e-6 * Math.max(Math.abs(st.p[k]), 1e-6); return (E.modelAt(cfg, data, { ...st, p: { ...st.p, [k]: st.p[k] + h } }, x) - v) / h; });
  let s2 = 0; ks.forEach((a, i) => ks.forEach((b, j) => (s2 += gr[i] * gr[j] * R.cov[a][b]))); const sm = Math.sqrt(s2);
  return { v, sm, s: Math.hypot(sm, 0.8) };
}
const pr = predict(best.s2, best.R, cap.x);
console.log(`总指挥封存(线性+二次+年周期+半年,数据至 ${LAST}):2027-05 = ${f(pr.v, 2)} ± ${f(pr.s, 2)} ppm(参数 ±${f(pr.sm, 2)} ⊕ 年际 0.8)`);
const alt = predict(out["线性+二次+年周期"].s2, out["线性+二次+年周期"].R, cap.x), alt2 = predict(out["指数+年周期+半年"].s2, out["指数+年周期+半年"].R, cap.x);
console.log(`对照:线性+二次+年周期 ${f(alt.v, 2)};指数+年周期+半年 ${f(alt2.v, 2)}`);
if (cap.official) {
  assert.strictEqual(cap.official.pred, +pr.v.toFixed(2), "official.pred 与复算一致"); assert.strictEqual(cap.official.err, +pr.s.toFixed(2), "official.err 与复算一致");
  assert.deepStrictEqual(cap.official.blocks, best.s2.blocks); assert.strictEqual(cap.official.dataTo, LAST);
}
// 演示胶囊:只用 2000 年底以前的数据
const sub = E.sliceData(data, demo.fitTo); assert.strictEqual(data.labels[sub.N - 1], "2000-12");
const st3 = { ...best.s2, p: { ...best.R.p } }, R3 = E.fit(cfg, sub, st3), p3 = E.modelAt(cfg, data, { ...st3, p: R3.p }, demo.x);
console.log(`演示胶囊 2000-12 → 2020-05:最优组合预测 ${f(p3, 2)} ppm,实测 417.28,差 ${f(p3 - 417.28, 2)} ppm = ${f((p3 - 417.28) / 0.8, 1)}σ(前 ${sub.N} 个月,χ²ν ${f(R3.ev.red, 3)})`);
const stL = init(["lin", "ann"]); const RL = E.fit(cfg, sub, stL); const pL = E.modelAt(cfg, data, { ...stL, p: RL.p }, demo.x);
console.log(`演示胶囊 · 线性+年周期:${f(pL, 2)} ppm,差 ${f(pL - 417.28, 2)}`);
if (process.argv.includes("--official")) console.log(JSON.stringify({ pred: +pr.v.toFixed(2), err: +pr.s.toFixed(2), errModel: +pr.sm.toFixed(2), blocks: best.s2.blocks, p: Object.fromEntries(Object.entries(best.R.p).filter(([k]) => ["a", "b", "c", "A1", "m1", "A2", "m2"].includes(k)).map(([k, v]) => [k, +v.toPrecision(7)])), red: +best.ev.red.toFixed(3), dataTo: LAST }));
console.log("ALL OK");
