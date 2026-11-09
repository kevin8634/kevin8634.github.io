// 深空 2.5 模型炼炉 · 开普勒炉复算(node deep/docs/forge_kepler_check.mjs):用引擎同一份代码拟合 JPL 八大行星,assert 物理与过关逻辑
import fs from "fs"; import path from "path"; import { fileURLToPath } from "url";
import * as E from "../forge/engine.js";
import assert from "assert";
const here = path.dirname(fileURLToPath(import.meta.url));
const cfg = JSON.parse(fs.readFileSync(path.join(here, "../forge/kepler.json"), "utf8"));
const raw = JSON.parse(fs.readFileSync(path.join(here, "../forge", cfg.data.file), "utf8"));
const data = E.makeData(raw, cfg.data);
const idx = JSON.parse(fs.readFileSync(path.join(here, "../forge/index.json"), "utf8"));
assert(idx.some((f) => f.id === "kepler" && f.file === "kepler.json"), "index.json 登记开普勒炉");
const init = (blocks) => { const p = {}, lock = {}; cfg.blocks.forEach((b) => b.params.forEach((q) => { p[q.k] = q.value; if (q.lock) lock[q.k] = true; })); return { blocks, p, lock }; };
const f = (v, d = 3) => (+v).toFixed(d);
// 0) 数据:8 颗行星、按 a 排序、标签、地球 T≈1
assert.strictEqual(data.N, 8); assert.strictEqual(data.labels[0], "水星"); assert.strictEqual(data.labels[7], "海王星");
assert(Math.abs(data.y[2] - 1) < 1e-4, "地球 T≈1 年"); console.log("数据 8 行 ✓ 标签 ✓");
// 1) 周期 = 36000/L̇(JPL Table 1)
assert(Math.abs(data.y[4] - 36000 / 3034.74612775) < 1e-6 && Math.abs(data.y[7] - 36000 / 218.45945325) < 1e-6); console.log("T=36000/L̇ ✓");
// 2) 核函数与修正因子
assert(Math.abs(E.KERNELS.pow(4, { C: 1, n: 1.5 }) - 8) < 1e-12 && E.KERNELS.lin(3, { kl: 2 }) === 6); console.log("pow/lin 核 ✓");
const nw = cfg.blocks.find((b) => b.id === "newton");
const fJ = E.blockAt(cfg, data, nw, { beta: 1 }, data.x[4], 4); assert(Math.abs(fJ - 1 / Math.sqrt(1 + data.cols.mu[4])) < 1e-15, "木星修正因子");
assert.strictEqual(E.blockAt(cfg, data, nw, { beta: 1 }, 2.5, null), 1, "非数据点因子 = 1"); console.log("牛顿因子 木星 =", fJ.toFixed(6), "✓");
const out = {};
for (const [name, bl] of [["正比", ["lin"]], ["幂律", ["pow"]], ["幂律+牛顿修正", ["pow", "newton"]], ["正比+幂律", ["lin", "pow"]]]) {
  const st = init(bl); const R = E.fit(cfg, data, st);
  const ps = Object.keys(R.sigma).map((k) => `${k}=${f(R.p[k], 5)}±${f(R.sigma[k], 5)}`).join(" ");
  const tc = E.modelAt(cfg, data, { ...st, p: R.p }, cfg.capsules[0].x), tp = E.modelAt(cfg, data, { ...st, p: R.p }, cfg.capsules[1].x);
  out[name] = { R, st, tc, tp };
  console.log(`${name.padEnd(8)} k=${R.ev.k} χ²=${f(R.ev.chi2, 2)} χ²_ν=${f(R.ev.red, 3)} AIC=${f(R.ev.aic, 2)} BIC=${f(R.ev.bic, 2)} 分=${E.score(R.ev)} 过关=${E.passed(cfg, { ...st, p: R.p }, R.ev)} ${ps} 谷神星T=${f(tc, 4)} 冥王星T=${f(tp, 2)}`);
}
const L = out["正比"].R, P = out["幂律"].R, N = out["幂律+牛顿修正"].R;
assert(L.ev.red > 1e5, "正比远远对不上"); assert(!E.passed(cfg, { ...out["正比"].st, p: L.p }, L.ev), "正比不过关");
assert(Math.abs(P.p.n - 1.5) < 1e-3 && Math.abs(P.p.C - 1) < 1e-3, "幂律 n≈1.5、C≈1");
assert(P.ev.red < 2 && E.passed(cfg, { ...out["幂律"].st, p: P.p }, P.ev), "幂律过关");
assert(L.ev.bic - P.ev.bic > 1e6, "BIC 强烈支持幂律");
assert(Math.abs(P.p.n - 1.49986) < 2e-5 && Math.abs(P.p.C - 0.99997) < 2e-5, "与 scipy least_squares 一致(C=0.99997, n=1.49986)");
assert(N.ev.chi2 > P.ev.chi2, "这份数据里牛顿修正不降 χ²(摄动大于质量项)");
// 过关的 n 区间:n 离开 [1.45,1.55] 即不过关
assert(!E.passed(cfg, { blocks: ["pow"], p: { ...P.p, n: 1.6 }, lock: {} }, P.ev), "n 越界不过关");
// 3) 胶囊
for (const [i, c] of cfg.capsules.entries()) {
  const T = E.capsuleTruth(data, c.truth), pred = i ? out["幂律"].tp : out["幂律"].tc, z = (pred - T.v) / T.e;
  console.log(`胶囊 ${c.title}:真值 ${f(T.v, 4)} ± ${T.e},幂律最优预测 ${f(pred, 4)},差 ${f(z, 2)}σ`); assert(Math.abs(z) < 3, "胶囊预测 3σ 内");
}
// 4) 开普勒第三定律 T² ∝ a³:最佳 n 的 2n ≈ 3
console.log("2n =", f(2 * P.p.n, 5), "≈ 3 ✓");
console.log("ALL OK");
