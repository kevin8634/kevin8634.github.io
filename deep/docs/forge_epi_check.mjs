// 深空 2.6 模型炼炉 · 疫情炉复算(node deep/docs/forge_epi_check.mjs):用引擎同一份代码拟合意大利第一波累计确诊,assert 数据、模型与过关逻辑
import fs from "fs"; import path from "path"; import { fileURLToPath } from "url";
import * as E from "../forge/engine.js";
import assert from "assert";
const here = path.dirname(fileURLToPath(import.meta.url));
const cfg = JSON.parse(fs.readFileSync(path.join(here, "../forge/epi.json"), "utf8"));
const raw = JSON.parse(fs.readFileSync(path.join(here, "../forge", cfg.data.file), "utf8"));
const data = E.makeData(raw, cfg.data);
const idx = JSON.parse(fs.readFileSync(path.join(here, "../forge/index.json"), "utf8"));
assert(idx.some((f) => f.id === "epi" && f.file === "epi.json"), "index.json 登记疫情炉");
const init = (blocks) => { const p = {}, lock = {}; cfg.blocks.forEach((b) => b.params.forEach((q) => { p[q.k] = q.value; if (q.lock) lock[q.k] = true; })); return { blocks, p, lock }; };
const f = (v, d = 3) => (+v).toFixed(d);
// 0) 数据:128 天,2020-02-24 起,误差 = 5%
assert.strictEqual(data.N, 128); assert.strictEqual(data.labels[0], "2020-02-24"); assert.strictEqual(data.labels[127], "2020-06-30");
assert.strictEqual(data.y[0], 229); assert.strictEqual(data.y[36], 105792); assert.strictEqual(data.y[97], 233019); assert.strictEqual(data.y[127], 240578);
data.y.forEach((y, i) => assert(Math.abs(data.e[i] - 0.05 * y) <= 0.5, "5% 教学误差"));
data.cols.removed.forEach((r, i) => assert(r >= data.cols.deaths[i]));
console.log("数据 128 行 ✓ 2020-02-24…06-30 ✓ 5% 误差 ✓");
// 1) 核函数
assert(Math.abs(E.KERNELS.expo(10, { C0e: 100, re: 0.1 }) - 100 * Math.E) < 1e-9);
assert(Math.abs(E.KERNELS.logis(0, { K: 10, rl: 0.2, C0l: 229 }) - 229) < 1e-9 && Math.abs(E.KERNELS.logis(500, { K: 10, rl: 0.2, C0l: 229 }) - 1e5) < 1e-6);
// SIR:t=0 为 I₀;S 单调减;R₀<1 时几乎不增长;无干预与 q=0 一致;与解析早期增长 e^{(β−γ)t} 一致
const ps = { beta: 0.4, gamma: 1 / 7, N: 6000, I0: 100, q: 0, tL: 0 };
assert.strictEqual(E.sirCum(ps, 0), 100);
const early = E.sirCum(ps, 10) - 0, rr = ps.beta - ps.gamma; // N 很大时 I ≈ I₀e^{rt},C = I₀ + ∫γI + I − I₀ → C ≈ I₀[1 + (β/r)(e^{rt} − 1)]
const exact = 100 * (1 + ps.beta / rr * (Math.exp(rr * 10) - 1));
assert(Math.abs(early / exact - 1) < 2e-3, "早期指数近似 " + early + " vs " + exact);
assert(E.sirCum({ ...ps, beta: 0.1 }, 100) < 100 * (1 + 0.1 / (1 / 7 - 0.1)) + 1, "R₀<1 链条断开");
// 终末规模:z = 1 − e^{−R₀ z}(I₀ → 0 时)
const R0 = 2.5; let z = 0.9; for (let i = 0; i < 200; i++) z = 1 - Math.exp(-R0 * z);
const fin = E.sirCum({ beta: R0 / 7, gamma: 1 / 7, N: 100, I0: 1, q: 0, tL: 0 }, 900) / 1e6;
assert(Math.abs(fin - z) < 2e-3, "SIR 终末规模 " + fin + " vs " + z);
console.log("expo/logis/sir 核 ✓ 终末规模 z =", f(fin, 4), "(解析", f(z, 4) + ")");
// 修饰积木:不在炉里时 q 取 0
const st0 = init(["sir"]); assert.strictEqual(E.effP(cfg, st0).q, 0); assert.strictEqual(E.effP(cfg, init(["sir", "lock"])).q, 0.5);
assert.strictEqual(E.modelAt(cfg, data, init(["lock"]), 20), 0, "只有干预、没有 SIR 时模型为 0");
const out = {};
const combos = [["指数", ["exp"]], ["逻辑斯谛", ["logis"]], ["SIR", ["sir"]], ["SIR+封城", ["sir", "lock"]], ["指数+逻辑斯谛", ["exp", "logis"]], ["SIR+逻辑斯谛", ["sir", "logis"]], ["逻辑斯谛+封城", ["logis", "lock"]]];
for (const [name, bl] of combos) {
  const st = init(bl); const R = E.fit(cfg, data, st); const s2 = { ...st, p: R.p };
  const dv = E.derived(cfg, s2, R).map((x) => `${x.d.fn}=${f(x.v, 4)}±${f(x.s, 4)}`).join(" ");
  const pz = Object.keys(R.sigma).map((k) => `${k}=${f(R.p[k], 5)}±${f(R.sigma[k], 5)}${R.atBound[k] ? "(边界)" : ""}`).join(" ");
  const nred = R.ev.z.filter((v) => Math.abs(v) > 3).length;
  out[name] = { R, st: s2 };
  console.log(`${name.padEnd(8)} k=${R.ev.k} χ²=${f(R.ev.chi2, 2)} χ²_ν=${f(R.ev.red, 3)} AIC=${f(R.ev.aic, 2)} BIC=${f(R.ev.bic, 2)} 分=${E.score(R.ev)} 红=${nred} 过关=${E.passed(cfg, s2, R.ev)} ${pz} ${dv}`);
}
const X = out["指数"].R, L = out["逻辑斯谛"].R, S = out["SIR"].R, SL = out["SIR+封城"].R;
// 2) 指数:前两周对得上,后半段全红
const zx = X.ev.z; const st = init(["exp"]);
const early14 = E.fit(cfg, E.sliceData(data, 14), st); assert(early14.ev.red < 10 && early14.ev.z.every((v) => Math.abs(v) < 5), "前 15 天指数拟合:光丝最多 5σ(早期报告噪声,χ²_ν≈7.6)");
console.log(`指数只拟合前 15 天:r=${f(early14.p.re, 4)}/天 翻倍 ${f(Math.LN2 / early14.p.re, 2)} 天 χ²_ν=${f(early14.ev.red, 3)}`);
const zz = E.evaluate(cfg, data, { ...st, p: early14.p }).z, late = zz.slice(30); assert(late.every((v) => Math.abs(v) > 3), "用早期指数外推,t≥30 全红");
for (const t of [20, 30, 60, 127]) console.log(`  早期指数外推 t=${t}:残差 ${f(zz[t], 1)}σ`);
assert(X.ev.red > 100 && L.ev.red > 5 && S.ev.red > 2, "指数、逻辑斯谛、无干预 SIR 都不过关");
assert(!E.passed(cfg, out["SIR"].st, S.ev) && !E.passed(cfg, out["逻辑斯谛"].st, L.ev));
// 3) SIR+封城过关,BIC 最小;与 scipy(epi_forge_build.py --scipy)一致
assert(SL.ev.red < 1.2 && E.passed(cfg, out["SIR+封城"].st, SL.ev), "SIR+封城过关");
assert(X.ev.bic > L.ev.bic && L.ev.bic > S.ev.bic && S.ev.bic > SL.ev.bic, "BIC:指数 > 逻辑斯谛 > SIR > SIR+封城");
assert(Math.abs(SL.ev.chi2 - 119.64) < 0.5 && Math.abs(S.ev.chi2 - 1047.26) < 2 && Math.abs(L.ev.chi2 - 2088.18) < 1 && Math.abs(X.ev.chi2 - 32034.2) < 5, "χ² 与 scipy 一致");
const r0 = E.derived(cfg, out["SIR+封城"].st, SL).find((x) => x.d.fn === "R0"); assert(Math.abs(r0.v - 2.538) < 0.01 && r0.s > 0.005 && r0.s < 0.05, "R0≈2.54");
assert(Math.abs(SL.p.tL - 19.11) < 0.3 && Math.abs(SL.p.q - 0.3708) < 0.01, "t_L≈19.1、q≈0.371");
// 4) N 锁成全国人口 6000 万:SIR 弯不下来
const sN = init(["sir"]); sN.p.N = 6000; sN.lock.N = true; const RN = E.fit(cfg, data, sN); assert(RN.ev.red > 50, "N=6000 万时无干预 SIR 对不上");
console.log(`N 锁 6000 万的 SIR:χ²_ν=${f(RN.ev.red, 1)} R0=${f(RN.p.beta / RN.p.gamma, 3)}`);
// 5) γ 解锁:R0 的系统不确定
const sg = init(["sir", "lock"]); sg.lock.gamma = false; Object.assign(sg.p, SL.p); const RG = E.fit(cfg, data, sg);
const r0g = E.derived(cfg, { ...sg, p: RG.p }, RG).find((x) => x.d.fn === "R0");
console.log(`γ 解锁 SIR+封城:χ²_ν=${f(RG.ev.red, 3)} BIC=${f(RG.ev.bic, 2)} γ=${f(RG.p.gamma, 4)}±${f(RG.sigma.gamma, 4)} R0=${f(r0g.v, 3)}±${f(r0g.s, 3)}`);
// 6) 胶囊:用前 N 天数据重新拟合,再预测
for (const c of cfg.capsules) {
  const T = E.capsuleTruth(data, c.truth), sub = E.sliceData(data, c.fitTo);
  assert.strictEqual(sub.N, c.fitTo + 1); assert(T.n === 1);
  for (const nm of ["指数", "逻辑斯谛", "SIR+封城"]) {
    const s0 = { ...out[nm].st, p: { ...out[nm].st.p } }, Rf = E.fit(cfg, sub, s0), pred = E.modelAt(cfg, data, { ...s0, p: Rf.p }, c.x); // 与界面相同:从当前(全数据拟合)参数出发,只用前 N 天重新拟合
    if (nm === "指数") assert(pred > 3 * T.v, "早期指数外推严重高估");
    console.log(`胶囊 ${c.id} [${nm}] 前 ${c.fitTo + 1} 天拟合 χ²_ν=${f(Rf.ev.red, 2)} 预测 ${Math.round(pred)} 真值 ${T.v}±${f(T.e, 0)} 差 ${f((pred - T.v) / T.e, 1)}σ`);
  }
}
console.log("ALL OK");
