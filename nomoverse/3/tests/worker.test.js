/* 宙律 3.0 · Worker 包装单测(node nomoverse/3/tests/worker.test.js)
 * 验:Worker 结果与直接调用逐位一致(确定性)、sky 长度与种子复现、sweep 形状、nbody 能量漂移 ≤0.1%/千步、坏消息不抛错。 */
const W = require('../core/worker.js'), U = require('../core/universe.js'), SC = require('../core/scene.js');
let pass = 0, fail = 0;
function ok(c, name) { if (c) { pass++; console.log('PASS  ' + name); } else { fail++; console.log('FAIL  ' + name); } }

const B = { particles: 4096 };
const presets = [{}, { kG: 100 }, { kA: 10 }, { Q: 1e-3 }, { kL: 1000 }, { kG: 0.01 }, { kc: 0.05, alphaLinked: true }, { seed: 7 }];
presets.forEach((p) => {
  const m = W.handle({ id: 1, op: 'run', recipe: p, budget: B });
  const res = U.run(p), desc = SC.describe(res, B);
  ok(m.ok && m.id === 1, 'run 成功 ' + JSON.stringify(p));
  ok(JSON.stringify(m.data.desc) === JSON.stringify(desc), 'run desc 与直接调用一致 ' + JSON.stringify(p));
  ok(JSON.stringify(m.data.res) === JSON.stringify(res), 'run res 与直接调用一致 ' + JSON.stringify(p));
});
const s1 = W.handle({ id: 2, op: 'sky', seed: 42, n: 1000 }).data, s2 = W.handle({ id: 3, op: 'sky', seed: 42, n: 1000 }).data;
ok(s1 instanceof Float32Array && s1.length === 4000, 'sky 返回 Float32Array(n*4)');
ok(Buffer.from(s1.buffer).equals(Buffer.from(s2.buffer)), 'sky 同种子逐位相同');
ok(W.handle({ id: 4, op: 'sky', seed: 1, n: 1e9 }).data.length === 262144 * 4, 'sky 粒子数上限 262144');
const sw = W.handle({ id: 5, op: 'sweep', key: 'kG', n: 24, recipe: {} }).data;
ok(sw.length === 24 && sw.every((x) => x.pass >= 0 && x.pass <= 7), 'sweep 24 点,通过关数 0–7');
ok(Math.abs(sw[0].v - 0.01) < 1e-12 && Math.abs(sw[23].v - 100) < 1e-9, 'sweep 覆盖 kG 全范围(对数)');
const mid = W.handle({ id: 6, op: 'sweep', key: 'kA', n: 3, recipe: {} }).data[1];
ok(Math.abs(mid.v - 1) < 1e-9 && mid.pass === 7, 'sweep 中点 = 真实宇宙,7 关全过');
const nb = W.handle({ id: 7, op: 'nbody', recipe: {}, years: 1, dt: 1e-3 }).data;
ok(nb.drift <= 1e-3, 'nbody 1 千步能量漂移 ≤0.1%(' + nb.drift.toExponential(2) + ')');
ok(Math.abs(nb.t - 1) < 1e-9 && nb.pos.length === 1 + U.run({}).planets.length, 'nbody 时间与天体数正确');
ok(W.handle({ id: 8, op: 'nbody', recipe: { kG: 0.01 }, years: 1 }).ok, 'nbody 无行星宇宙不报错');
const bad = W.handle({ id: 9, op: 'nope' });
ok(!bad.ok && bad.error === 'bad_op' && bad.id === 9, '未知 op 返回 bad_op');
ok(W.handle(null).ok === false, '空消息不抛错');
console.log(`合计:${pass} 通过,${fail} 失败`);
process.exitCode = fail ? 1 : 0;
