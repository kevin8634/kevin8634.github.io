// 深空 2.8 模型炼炉 · 分龄复核(node deep/docs/forge_tiers_check.mjs):四炉 × l1/l2/l4 配置、星辰层滑杆可过关、星穹层全解锁与开放问题来源、卡方尾概率
// 深空 2.8.1:星辰层按 240 像素滑杆量化后仍能手动过关(06 C1/C2);tierData 教学误差;胶囊文案覆盖只作用于 l1
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
  const cfg = JSON.parse(fs.readFileSync(F(file), "utf8")), data0 = E.makeData(JSON.parse(fs.readFileSync(F(cfg.data.file), "utf8")), cfg.data);
  let data = data0;
  assert(E.applyTier(cfg, "l2") === cfg && E.applyTier(cfg, "zz") === cfg, id + " l2 原样");
  // 星辰层
  const T1 = cfg.tiers.l1, c1 = E.applyTier(cfg, "l1"); data = E.tierData(c1, data0);
  assert(E.tierData(cfg, data0) === data0 && E.tierData(E.applyTier(cfg, "l4"), data0) === data0, id + " 只有 l1 换教学误差");
  assert(T1.blocks.length >= 1 && T1.blocks.length <= 2, id + " l1 预置 1–2 块");
  c1.blocks.forEach((b) => { const vis = b.params.filter((q) => !q.hide); assert(vis.length >= 1 && vis.length <= 2, id + "/" + b.id + " l1 旋钮 1–2 个"); vis.forEach((q) => assert(!q.lock)); b.params.filter((q) => q.hide).forEach((q) => assert(q.lock)); });
  (T1.knobs || []).forEach((k) => assert(c1.blocks.some((b) => b.params.some((q) => q.k === k)), id + " 旋钮存在 " + k));
  assert(c1.guide.every((g) => !/答案是|就是/.test(g.q)), id + " l1 引导只提问");
  const s0 = init(c1, c1.preset.slice()), ev0 = E.evaluate(c1, data, s0);
  assert(!E.passed(c1, s0, ev0), id + " l1 初始未过关");
  const all = c1.preset.concat(T1.tray || []).filter((b) => !(T1.contrast || []).includes(b)); // 2.8.1:对照/反例积木(开普勒「正比」、疫情「逻辑斯谛」)不参与最优
  const s1 = init(c1, all), R1 = E.fit(c1, data, s1), st1 = { ...s1, p: R1.p };
  assert(R1.ev.k === E.freeParams(c1, s1).length && R1.ev.k <= (T1.knobs || []).length, id + " l1 只拟合旋钮");
  const fit1 = E.fitness(R1.ev); assert(E.passed(c1, st1, R1.ev), id + " l1 滑杆最优可过关");
  // 2.8.1:240 像素滑杆量化(log 刻度按 0..1000 映射)后,从连续最优点出发做像素格坐标搜索,仍须能手动过关
  { const PX = 240, qs = E.freeParams(c1, s1), toU = (q, v) => (q.scale === "log" ? Math.log(v / q.min) / Math.log(q.max / q.min) : (v - q.min) / (q.max - q.min)), fromU = (q, u) => (q.scale === "log" ? q.min * Math.pow(q.max / q.min, u) : q.min + u * (q.max - q.min));
    const snap = (q, v) => fromU(q, Math.round(toU(q, v) * PX) / PX), ev = (p) => { const st = { ...s1, p: { ...s1.p, ...p } }, e = E.evaluate(c1, data, st); return { f: E.fitness(e), ok: E.passed(c1, st, e) }; };
    let p = Object.fromEntries(qs.map((q) => [q.k, snap(q, R1.p[q.k])])), b = ev(p);
    for (let it = 0; it < 4; it++) for (const q of qs) { const u0 = Math.round(toU(q, p[q.k]) * PX); for (let d = -12; d <= 12; d++) { const t = { ...p, [q.k]: snap(q, fromU(q, (u0 + d) / PX)) }, r = ev(t); if (r.f > b.f || (r.ok && !b.ok)) { b = r; p = t; } } }
    assert(b.ok, id + " l1 240 像素滑杆可手动过关"); console.log(`${id} l1 240px 滑杆最优贴合度 ${b.f}% 可过关 ✓`); }
  (c1.capsules || []).forEach((cp) => { const o = ((T1.text || {}).cap || {})[cp.id]; if (o) { assert(cp.note === o.note); const c0 = cfg.capsules.find((x) => x.id === cp.id); assert(c0.note !== o.note, id + " 原版胶囊文案不变"); } });
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
