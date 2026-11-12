// 深空 2.8 模型炼炉 · 分龄复核(node deep/docs/forge_tiers_check.mjs):四炉 × l1/l2/l4 配置、星辰层滑杆可过关、星穹层全解锁与开放问题来源、卡方尾概率
import fs from "fs"; import path from "path"; import { fileURLToPath } from "url";
import * as E from "../forge/engine.js";
import assert from "assert";
const here = path.dirname(fileURLToPath(import.meta.url)), F = (p) => path.join(here, "../forge", p);
// 卡方上尾概率:已知值
assert(Math.abs(E.chi2Q(3.841459, 1) - 0.05) < 1e-5); assert(Math.abs(E.chi2Q(18.307, 10) - 0.05) < 1e-4); assert(Math.abs(E.chi2Q(2, 2) - Math.exp(-1)) < 1e-9);
assert(Math.abs(E.chi2Q(100, 100) - 0.4812) < 2e-3); assert(E.chi2Q(400, 100) < 1e-30 && E.chi2Q(0, 5) === 1);
console.log("chi2Q ✓");
const init = (cfg, blocks) => { const p = {}, lock = {}; cfg.blocks.forEach((b) => b.params.forEach((q) => { p[q.k] = q.value; if (q.lock) lock[q.k] = true; })); return { blocks, p, lock }; };
for (const { id, file } of JSON.parse(fs.readFileSync(F("index.json"), "utf8"))) {
  const cfg = JSON.parse(fs.readFileSync(F(file), "utf8")), data = E.makeData(JSON.parse(fs.readFileSync(F(cfg.data.file), "utf8")), cfg.data);
  assert(E.applyTier(cfg, "l2") === cfg && E.applyTier(cfg, "zz") === cfg, id + " l2 原样");
  // 星辰层
  const T1 = cfg.tiers.l1, c1 = E.applyTier(cfg, "l1");
  assert(T1.blocks.length >= 1 && T1.blocks.length <= 2, id + " l1 预置 1–2 块");
  c1.blocks.forEach((b) => { const vis = b.params.filter((q) => !q.hide); assert(vis.length >= 1 && vis.length <= 2, id + "/" + b.id + " l1 旋钮 1–2 个"); vis.forEach((q) => assert(!q.lock)); b.params.filter((q) => q.hide).forEach((q) => assert(q.lock)); });
  (T1.knobs || []).forEach((k) => assert(c1.blocks.some((b) => b.params.some((q) => q.k === k)), id + " 旋钮存在 " + k));
  assert(c1.guide.every((g) => !/答案是|就是/.test(g.q)), id + " l1 引导只提问");
  const s0 = init(c1, c1.preset.slice()), ev0 = E.evaluate(c1, data, s0);
  assert(!E.passed(c1, s0, ev0), id + " l1 初始未过关");
  const all = id === "kepler" ? ["pow"] : c1.preset.concat(T1.tray || []); // 开普勒炉的架上积木「正比」是反例,不参与最优
  const s1 = init(c1, all), R1 = E.fit(c1, data, s1), st1 = { ...s1, p: R1.p };
  assert(R1.ev.k === E.freeParams(c1, s1).length && R1.ev.k <= (T1.knobs || []).length, id + " l1 只拟合旋钮");
  const fit1 = E.fitness(R1.ev); assert(E.passed(c1, st1, R1.ev), id + " l1 滑杆最优可过关");
  console.log(`${id} l1 预置 ${T1.blocks.join("+")} · 架上 ${(T1.tray || []).join("+")} · 旋钮 ${T1.knobs.join(",")} · 最优 ${s1.blocks.join("+")} 贴合度 ${fit1}%(门槛 ${T1.pass.fitMin}%)χ²ν ${R1.ev.red.toFixed(2)} ✓`);
  // 星穹层
  const T4 = cfg.tiers.l4, c4 = E.applyTier(cfg, "l4");
  assert(c4.blocks.length === cfg.blocks.length + (T4.extraBlocks || []).length && c4.blocks.every((b) => b.params.every((q) => !q.lock)), id + " l4 全解锁");
  assert(T4.open.length >= 2 && T4.open.length <= 3, id + " 开放问题 2–3");
  T4.open.forEach((o) => { assert(o.t && o.q && o.try && o.checked === "2026-11-12" && o.src.length >= 1); o.src.forEach((s) => assert(/^https:\/\//.test(s.url) && s.t)); assert(!/答案|结论是/.test(o.q)); });
  assert(T4.stats && /ν = n − k/.test(T4.stats));
  for (const b of T4.extraBlocks || []) { const s = init(c4, ["disk", "gas", b.id]); const R = E.fit(c4, data, s); console.log(`${id} l4 专属积木 ${b.name}:恒星盘+气体盘+${b.name} χ²ν ${R.ev.red.toFixed(3)} BIC ${R.ev.bic.toFixed(2)} p ${E.chi2Q(R.ev.chi2, R.ev.nu).toFixed(3)}`); assert(R.ev.red < 2); }
  // 原版不受影响:l1/l4 是深拷贝
  assert(cfg.blocks.every((b) => !b.params.some((q) => q.hide)) && !cfg.tier);
  console.log(`${id} l4 开放问题 ${T4.open.length} 条 · 来源 ${T4.open.reduce((a, o) => a + o.src.length, 0)} 条 ✓`);
}
console.log("ALL OK");
