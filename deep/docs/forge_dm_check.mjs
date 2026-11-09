// 深空 2.4 模型炼炉 · 暗物质炉复算(node deep/docs/forge_dm_check.mjs):用引擎同一份代码拟合 SPARC NGC 3198,assert 物理与过关逻辑
import fs from "fs"; import path from "path"; import { fileURLToPath } from "url";
import * as E from "../forge/engine.js";
import assert from "assert";
const here = path.dirname(fileURLToPath(import.meta.url));
const cfg = JSON.parse(fs.readFileSync(path.join(here, "../forge/dm.json"), "utf8"));
const raw = JSON.parse(fs.readFileSync(path.join(here, "../forge", cfg.data.file), "utf8"));
const data = E.makeData(raw, cfg.data);
const init = (blocks) => { const p = {}, lock = {}; cfg.blocks.forEach((b) => b.params.forEach((q) => { p[q.k] = q.value; if (q.lock) lock[q.k] = true; })); return { blocks, p, lock }; };
const f = (v, d = 3) => (+v).toFixed(d);
// 1) 单位:ρ0=1e7 M☉/kpc³、rc=1 kpc 的伪等温晕渐近速度 √(4πGρ0) rc
const vinf = Math.sqrt(4 * Math.PI * E.G * 1e7) * 1; const vbig = Math.sqrt(E.KERNELS.iso(1e6, { rho0: 1, rc: 1 }));
assert(Math.abs(vbig / vinf - 1) < 1e-3, "iso 渐近速度"); console.log("iso v∞(ρ0=1e7,rc=1)=", f(vinf, 2), "km/s ✓");
// 2) 小 r 实心转动:v² ≈ (4π/3)Gρ0 r²
const r = 0.01; assert(Math.abs(E.KERNELS.iso(r, { rho0: 1, rc: 1 }) / (4 / 3 * Math.PI * E.G * 1e7 * r * r) - 1) < 1e-3, "iso 核心"); console.log("iso 核心 v²∝r² ✓");
// 3) Υ=1 时 column 积木在数据点上原样返回 Vdisk²
const s = init(["disk"]); s.p.Yd = 1; const m = E.evaluate(cfg, data, s).m; assert(Math.abs(m[10] - data.cols.Vdisk[10]) < 1e-9); console.log("disk 列 ✓");
const out = {};
for (const [name, bl] of [["恒星盘", ["disk"]], ["恒星盘+气体", ["disk", "gas"]], ["暗晕", ["halo"]], ["恒星盘+气体+暗晕", ["disk", "gas", "halo"]]]) {
  const st = init(bl); const R = E.fit(cfg, data, st);
  const ps = Object.keys(R.sigma).map((k) => `${k}=${f(R.p[k])}±${f(R.sigma[k])}`).join(" ");
  const v40 = E.modelAt(cfg, data, { ...st, p: R.p }, 40);
  out[name] = R; console.log(`${name.padEnd(10)} k=${R.ev.k} χ²=${f(R.ev.chi2, 1)} χ²_ν=${f(R.ev.red)} AIC=${f(R.ev.aic, 1)} BIC=${f(R.ev.bic, 1)} 分=${E.score(R.ev)} 过关=${E.passed(cfg, st, R.ev)} ${ps} v(40)=${f(v40, 1)}`);
}
const a = out["恒星盘+气体"], b = out["恒星盘+气体+暗晕"];
assert(a.ev.red > 100, "无暗晕应远远对不上"); assert(b.ev.red < 1.5, "加暗晕后约化 χ² 应 <1.5"); assert(a.ev.red / b.ev.red > 50, "加暗晕后显著下降");
assert(b.ev.bic < a.ev.bic - 1000, "BIC 支持暗晕");
assert(Math.abs(b.p.Yd - 0.5165) < 0.01 && Math.abs(b.p.rho0 - 4.866) < 0.05 && Math.abs(b.p.rc - 2.776) < 0.02, "与 scipy least_squares 一致(Υ★=0.5165, ρ0=4.866, rc=2.776)");
assert(!E.passed(cfg, { blocks: ["halo"] }, out["暗晕"].ev), "只有暗晕不过关");
// 胶囊真值
const T = E.capsuleTruth(data, cfg.capsules[0].truth); console.log("胶囊真值 r∈[38,42.5]:", f(T.v, 2), "±", f(T.e, 2), "n=", T.n); assert(T.n === 3);
console.log("ALL OK");
