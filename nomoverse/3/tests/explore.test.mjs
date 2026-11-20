/* 3-4 探索层纯函数测试:node nomoverse/3/tests/explore.test.mjs */
import { createRequire } from 'module';
import * as X from '../core/explore.mjs';
const U = createRequire(import.meta.url)('../core/universe.js');
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('✗ ' + m); } };
const near = (a, b, e = 1e-9) => Math.abs(a - b) <= e * Math.max(1, Math.abs(b));

// 范围与模型一致
for (const k of X.KEYS) ok(X.RANGE[k][0] === U.RANGE[k][0] && X.RANGE[k][1] === U.RANGE[k][1], 'RANGE.' + k + ' 与 universe 一致');
for (const k of X.KEYS) ok(near(X.REALV[k], k === 'eps' ? U.K.EPS0 : k === 'Q' ? U.K.Q0 : k === 'Om' ? U.K.OM0 : 1), 'REALV.' + k + ' 与模型默认一致');
// 刻度往返与端点
for (const k of X.KEYS) {
  const [lo, hi] = X.RANGE[k];
  ok(X.toT(k, lo) === 0 && near(X.toT(k, hi), 1), k + ' 端点 0/1');
  for (const t of [0, 0.13, 0.5, 0.77, 1]) ok(near(X.toT(k, X.fromT(k, t)), t, 1e-9), k + ' 往返 t=' + t);
  ok(X.toT(k, lo - 1e9) === 0 && X.toT(k, hi * 10 + 1) === 1, k + ' 越界夹紧');
}
// 对数刻度:Q 每个数量级等宽(4 个数量级)
ok(near(X.toT('Q', 1e-5), 0.5) && near(X.toT('Q', 1e-6), 0.25), 'Q 对数:1e-5 在正中');
// 对称对数:Λ 单调、过零、负区存在
{ let prev = -1, mono = true; for (let i = 0; i <= 200; i++) { const v = X.fromT('kL', i / 200); if (v <= prev && i) mono = false; prev = v; } ok(mono, 'Λ symlog 单调'); }
ok(X.toT('kL', 0) > 0.2 && X.toT('kL', 0) < 0.35, 'Λ=0 落在左侧约 1/4(负区可拧)');
ok(X.toT('kL', 1) - X.toT('kL', 0) > 0.05, 'Λ 0→1 有足够刻度距离');
ok(near(X.fromT('kL', X.toT('kL', -10)), -10) && near(X.fromT('kL', X.toT('kL', 1000)), 1000, 1e-6), 'Λ 端点往返');
ok(X.fromT('kL', 0.5) > 1 && X.fromT('kL', 0.5) < 100, 'Λ 中点在 1–100');
// 吸附
ok(X.snapReal('Q', 1.03e-5) === 1e-5 && X.snapReal('Q', 1.1e-5) === 1.1e-5, 'Q ±4% 吸到 1e-5');
ok(X.snapReal('Om', 0.32) === 0.315 && X.snapReal('Om', 0.35) === 0.35, 'Ω₀ 吸到 0.315');
ok(X.snapReal('kL', 1.04) === 1 && X.snapReal('kL', 0.03) === 0 && X.snapReal('kL', -0.04) === 0 && X.snapReal('kL', 0.5) === 0.5, 'Λ 吸到 1 与 0');
ok(X.snapReal('eps', 0.00702) === 0.007 && X.snapReal('eps', 0.0072) === 0.0072, 'ε 吸到 0.007');
ok(X.snapReal('kG', 0.97) === 1, 'G 吸附与 teach.snap1 一致');
// 键盘一步(1%)能离开 Λ 吸附区
ok(X.snapReal('kL', X.fromT('kL', X.toT('kL', 1) + 0.01)) !== 1, 'Λ 键盘一步离开 ×1');
ok(X.snapReal('Q', X.fromT('Q', 0.5 + 0.01)) !== 1e-5, 'Q 键盘一步离开 1e-5');
// 格式
ok(X.fmt('Q', 1e-5) === '10⁻⁵' && X.fmt('Q', 3e-4) === '3.0×10⁻⁴', 'Q 科学计数');
ok(X.fmt('kL', 0) === '×0' && X.fmt('kL', -5) === '×-5' && X.fmt('kL', 1000) === '×1000', 'Λ 格式');
ok(X.fmt('eps', 0.007) === '0.0070' && X.fmt('Om', 0.315) === '0.315', 'ε/Ω₀ 格式');
// 旋钮角度
ok(X.tToAngle(0) === -135 && X.tToAngle(1) === 135 && X.tToAngle(0.5) === 0, '角度端点');
ok(near(X.pointToT(0, -1), 0.5) && near(X.pointToT(1, 0), 0.5 + 90 / 270) && near(X.pointToT(-1, 0), 0.5 - 90 / 270), '指针 → t');
ok(X.pointToT(0.1, 1) === 1 && X.pointToT(-0.1, 1) === 0, '底部缺口贴近端');
{ const tk = X.ticks(0.5, 37); ok(tk.length === 37 && tk.filter((x) => x.lit).length === 19 && tk.filter((x) => x.head).length === 1, '刻度环点亮'); }
ok(X.ticks(0, 10).filter((x) => x.lit).length === 1 && X.ticks(1, 10).every((x) => x.lit), '刻度环端点');
// 锁定 + 随机
const rng = U.prng(42), base = U.normalize({});
{
  const L = new Set(['kG', 'Q', 'seed']);
  let allKept = true, inRange = true, changed = 0;
  for (let i = 0; i < 200; i++) {
    const r = X.randomRecipe(base, L, rng);
    if (r.kG !== base.kG || r.Q !== base.Q || r.seed !== base.seed) allKept = false;
    for (const k of X.KEYS) if (!(r[k] >= X.RANGE[k][0] && r[k] <= X.RANGE[k][1])) inRange = false;
    if (r.kA !== base.kA) changed++;
  }
  ok(allKept, '锁定的常数与种子随机后不变'); ok(inRange, '随机值都在范围内'); ok(changed > 150, '未锁的常数会变');
}
{ const r = X.randomRecipe(base, [], U.prng(7)); ok(r.seed !== base.seed && Number.isInteger(r.seed) && r.seed >= 0, '未锁种子换新'); }
{ const r1 = X.randomRecipe(base, [], U.prng(9)), r2 = X.randomRecipe(base, [], U.prng(9)); ok(JSON.stringify(r1) === JSON.stringify(r2), '同 rng 同结果'); }
{ // 随机落点:走通、警告、失败都会出现(spread 0.15)
  const seen = new Set(), g = U.prng(3); for (let i = 0; i < 300; i++) seen.add(U.run(X.randomRecipe(base, [], g)).status);
  ok(seen.has("ok") && seen.has("fail") && seen.has("warn"), '随机宇宙有成有败:' + [...seen].join(','));
}
ok(X.lockToStr(new Set(['Q', 'kG', 'bogus'])) === 'Q,kG' && X.strToLock('kG,Q,x').size === 2, '锁定存取');
ok(X.lockToStr({ kL: true, Om: false }) === 'kL', '对象形式锁定');
// 题卡
ok(X.CARDS.length >= 8 && new Set(X.CARDS.map((c) => c.id)).size === X.CARDS.length, '题卡 ≥8 张且 id 唯一');
for (const c of X.CARDS) {
  ok(c.q.zh && c.q.en && c.a.zh && c.a.en, c.id + ' 中英题面与答案');
  const r = X.applyCard(base, c, []);
  ok(X.checkGoal(U.run(r), c.goal), c.id + ' 答案配方达成目标');
  ok(!X.checkGoal(U.run(base), c.goal), c.id + ' 真实宇宙不满足该题(题目有意义)');
  for (const k of Object.keys(c.recipe)) ok(k === 'seed' || (c.recipe[k] >= X.RANGE[k][0] && c.recipe[k] <= X.RANGE[k][1]), c.id + '.' + k + ' 在范围内');
}
{ // 载入题卡时锁定的常数不被改,并能报告
  const cur = { ...base, Q: 3e-5 }, card = X.CARDS.find((c) => c.id === 'fog');
  const r = X.applyCard(cur, card, ['Q']);
  ok(r.Q === 3e-5, '锁定的 Q 不被题卡改'); ok(X.blockedBy(card, ['Q']).join() === 'Q', 'blockedBy 报告');
  const r2 = X.applyCard({ ...base, kA: 3 }, card, []); ok(r2.kA === 1 && r2.Q === 1e-7, '未锁常数回到真实值 + 卡片改动');
}
ok(X.cycle([1, 2, 3]).join() === '2,3,1' && X.cycle([1, 2, 3], -1).join() === '3,1,2', 'Stack 轮换');
// 种子翻牌
ok(X.seedText(20261120) === '0020261120' && X.seedText(4294967295) === '4294967295', '种子 10 位');
ok(X.flapSteps('09', '10').join() === '1,1', '翻牌只往前、绕圈');
{ const a = X.seedText(1), b = X.seedText(20261120), n = X.flapFrames(a, b);
  ok(X.flapFrame(a, b, 0) === a && X.flapFrame(a, b, n) === b, '翻牌首帧/末帧');
  let mono = true; for (let f = 0; f < n; f++) { const s1 = X.flapSteps(a, X.flapFrame(a, b, f)), s2 = X.flapSteps(a, X.flapFrame(a, b, f + 1)); if (s2.some((x, i) => x < s1[i])) mono = false; } ok(mono, '翻牌逐帧前进'); }
ok(X.flapFrames('0000000000', '0000000000') === 9, '相同不翻(只剩错开延迟)');
// 液位
ok(X.gauge(1).side === 'flat' && X.gauge(0.315).side === 'open' && X.gauge(3).side === 'closed', '液位开/平/闭');
ok(X.gauge(1).level === 0.5 && X.gauge(1).line === 0.5 && X.gauge(5).over && X.gauge(5).level === 1, '液位刻度与溢出');

console.log(`explore.test: ${pass}/${pass + fail} 通过`);
process.exit(fail ? 1 : 0);
