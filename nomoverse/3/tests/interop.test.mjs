#!/usr/bin/env node
/* 宙律 3.0 · 与 /shared/3/ 的接口测试(node nomoverse/3/tests/interop.test.mjs,Node ≥ 20)
 * 把 "/shared/3/…" 映射到仓库 shared/3/,加载适配层与 shared 原件,验证:
 * GUS 经 shared deflate 编码 ≤1800 字符、往返复现、shared 校验接受宙律输出、mulberry32 逐位一致、撤销/手势/URL 参数。 */
import { register } from 'node:module';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..', '..', '..');
const hook = `export async function resolve(s, c, n) { if (s.startsWith('/shared/')) return { url: ${JSON.stringify(pathToFileURL(repo).href)} + s, shortCircuit: true }; return n(s, c); }`;
register('data:text/javascript,' + encodeURIComponent(hook));

const require = createRequire(import.meta.url);
const U = require('../core/universe.js'), G0 = require('../core/gus0.js');
const A = await import('../core/adapt.mjs');
const P = await import('/shared/3/prng.js');

let pass = 0, fail = 0; const rows = [];
const ok = (name, c, info) => { rows.push((c ? 'PASS' : 'FAIL') + '  ' + name + (info ? '  ' + info : '')); c ? pass++ : fail++; };

/* 1. mulberry32 与 shared 逐位一致 */
let same = true;
for (const sd of [0, 1, 42, 20261120, 4294967295]) { const a = U.prng(sd), b = P.mulberry32(sd); for (let i = 0; i < 1000; i++) if (a() !== b()) { same = false; break; } }
ok('mulberry32:宙律本地版与 /shared/3/prng.js 5 个种子×1000 个值逐位一致', same);

/* 2. GUS:shared 编码长度、校验、往返 */
const PRESETS = { real: {}, g05: { kG: 0.5 }, g2: { kG: 2 }, a15: { kA: 15 }, q5e4: { Q: 5e-4 }, eps85: { eps: 0.0085 }, L500: { kL: 500 }, c01: { kc: 0.1 }, g001: { kG: 0.01 } };
let maxLen = 0;
for (const [n, p] of Object.entries(PRESETS)) {
  const r = U.run(Object.assign({ seed: 20261120 }, p));
  let e;
  try { e = await A.encodeUniverse(r, { name: { zh: '测试宇宙一号', en: 'Test Universe One' } }, G0); }
  catch (err) { ok('GUS 编码 ' + n, false, String(err.message || err)); continue; }
  maxLen = Math.max(maxLen, e.len);
  ok('GUS ' + n + ' 经 shared deflate 编码 ≤1800 字符', e.fits && !e.str.startsWith('j.'), e.len + ' 字符');
  const nego = A.negotiate(e.gus);
  ok('GUS ' + n + ' 通过 shared validate', nego.ok, nego.code || '');
  const d = await A.decodeToRecipe(e.str, G0);
  const r2 = U.run(d.recipe);
  ok('GUS ' + n + ' 解码→配方→再跑:7 关与恒星系逐位相同', JSON.stringify(r2.stages) === JSON.stringify(r.stages) && JSON.stringify(r2.planets) === JSON.stringify(r.planets) && !d.lossy);
}
/* G1 已补(shared v0.2):Λ=0 与负值往返保留;crunch_s 可为 null */
for (const kL of [0, -5, -1000]) {
  const r = U.run({ kL, seed: 11 }), e = await A.encodeUniverse(r, {}, G0), d = await A.decodeToRecipe(e.str, G0);
  const r2 = U.run(d.recipe);
  ok('G1 Λ=' + kL + '(归一后 ' + r.recipe.kL + ')经 shared 往返保留,7 关与命运逐位相同', !d.lossy && d.recipe.kL === r.recipe.kL && JSON.stringify(r2.stages) === JSON.stringify(r.stages) && r2.cosmos.fate === r.cosmos.fate, 'fate ' + r.cosmos.fate);
}
{
  const r = U.run({}), e = await A.encodeUniverse(r, {}, G0), d = await A.decodeToRecipe(e.str, G0);
  ok('真实宇宙 crunch_s=null 往返保留为 null', r.cosmos.crunchGyr === null && d.gus.derived.crunch_s === null);
  const rc = U.run({ kL: -5 }), ec = await A.encodeUniverse(rc, {}, G0), dc = await A.decodeToRecipe(ec.str, G0);
  ok('大挤压宇宙 crunch_s 数值往返保留', typeof dc.gus.derived.crunch_s === 'number' && Math.abs(dc.gus.derived.crunch_s / (rc.cosmos.crunchGyr * 3.15576e16) - 1) < 1e-5, (rc.cosmos.crunchGyr || 0).toFixed(2) + ' Gyr');
  ok('derived 的 heliumY / habitable / warnings / starLife_s 经 shared 保留', d.gus.derived.heliumY === e.gus.derived.heliumY && d.gus.derived.habitable === e.gus.derived.habitable && Array.isArray(d.gus.derived.warnings) && d.gus.derived.starLife_s === e.gus.derived.starLife_s);
}
ok('坏 GUS 由 shared negotiate 拒收(主版本 1)', !A.negotiate({ gus: '1.0', kind: 'universe' }).ok && A.negotiate({ gus: '1.0', kind: 'universe' }).reason === 'major_mismatch');

/* 3. 状态 / 撤销 / 手势 / URL 参数 */
const st0 = A.createRecipeStore(U, { syncUrl: false });
const st = Object.assign(Object.create(st0), { set: (p) => st0.set((s) => Object.assign({}, s, p)) });   // shared set 收整个状态,补丁用函数式
let hits = 0; st.subscribe(() => hits++);
st.set({ kG: 2 }); st.set({ kA: 3 });
ok('store.set 两步后 kG=2 kA=3', st.get().kG === 2 && st.get().kA === 3);
st.undo(); ok('undo 一步 → kA 回到 1', st.get().kA === 1 && st.get().kG === 2);
st.redo(); ok('redo → kA=3', st.get().kA === 3);
st.beginGesture(); for (let i = 1; i <= 20; i++) st.set({ kc: 1 + i / 10 }); st.endGesture();
st.undo(); ok('拖动 20 次合并为一步撤销', st.get().kc === 1);
st.set({ kG: 1e9 }); ok('store 经 normalize 夹回范围', st.get().kG === 100);
ok('订阅回调被触发', hits >= 5);
const rp = A.recipeToParam(U.normalize({ kG: 0.5, kL: -2, alphaLinked: false, seed: 7 }));
const back = A.paramToRecipe(rp);
ok('URL 配方参数往返', JSON.stringify(U.normalize(back)) === JSON.stringify(U.normalize({ kG: 0.5, kL: -2, alphaLinked: false, seed: 7 })), '?r=' + rp + '(' + rp.length + ' 字符)');
ok('URL 配方参数拒收坏数据', A.paramToRecipe('1_2_<x>') === null && A.paramToRecipe(null) === null);

/* 4. 画质预算 */
ok('画质预算(shared):high/medium/low 粒子 65536/16384/4096,low 关后期', A.tier.budget('high').particles === 65536 && A.tier.budget('medium').particles === 16384 && A.tier.budget('low').particles === 4096 && !A.tier.budget('low').post);

/* 5. i18n 两层文本 */
const L = A.i18n({ k: { zh: '甲', en: 'A', zhMore: '甲的展开', enMore: 'A more' } }, 'en');
ok('i18n two()(shared)返回直白 + 展开', L.two('k').short === 'A' && L.two('k').more === 'A more');

console.log(rows.join('\n'));
console.log('\nGUS 最长编码 ' + maxLen + ' 字符');
console.log('合计:' + pass + ' 通过,' + fail + ' 失败');
process.exit(fail ? 1 : 0);
