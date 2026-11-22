/* 宙律 3.0 · 3-5 造物层单测:命名、作品卡数值、导出/导入 JSON 往返、分享链接选择、Decrypted 帧、T7 轨道 trace、worker orbit */
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
globalThis.localStorage = { _m: {}, getItem(k) { return this._m[k] ?? null; }, setItem(k, v) { this._m[k] = String(v); } };
globalThis.location = { href: 'https://kevin8634.github.io/nomoverse/3/', search: '' };
const U = require('../core/universe.js'), NB = require('../core/nbody.js'), G0 = require('../core/gus0.js'), SC = require('../core/scene.js'), W = require('../core/worker.js');
const C = await import('../core/create.mjs');
const gus = await import('../../../shared/3/gus.js');
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('✗', m); } };

/* 命名 */
ok(C.cleanName('  a<b>\u0001c  ') === 'abc', 'cleanName 去尖括号与控制字符');
ok(C.cleanName('x'.repeat(60)).length === 40, 'cleanName 截 40');
ok(C.cleanName('a   b') === 'a b', 'cleanName 合并空白');
const d1 = C.defaultName(20261120), d2 = C.defaultName(20261120), d3 = C.defaultName(7);
ok(d1.zh === d2.zh && d1.en === d2.en, '默认名确定');
ok(d1.zh !== d3.zh, '不同种子不同名');
ok(/宇宙 \d\d$/.test(d1.zh) && /Universe \d\d$/.test(d1.en), '默认名格式');
for (let s = 0; s < 64; s++) { const n = C.defaultName(s * 2654435761); ok(n.zh.length <= 40 && n.en.length <= 40, '默认名长度 ' + s); }
ok(C.nameFor('  ', 1).zh === C.defaultName(1).zh, '空名回默认');
ok(C.nameFor('我的宇宙', 1).en === '我的宇宙', '用户名两种语言同');

/* 作品卡 */
const r0 = U.run({}), dsc = SC.describe(r0, null), st = C.cardStats(r0, dsc);
ok(st.status === r0.status && st.planets === dsc.planets.length, '作品卡行星数以画面为准');
ok(st.teffK > 5000 && st.teffK < 6500, '真实宇宙恒星温度 ' + st.teffK);
ok(st.stagesPassed === 7, '真实宇宙 7 关');
ok(Math.abs(st.ageGyr - 13.8) < 1, '年龄约 138 亿年 ' + st.ageGyr);
const rf = U.run({ kG: 0.02 }), sf = C.cardStats(rf, SC.describe(rf, null));
ok(rf.stages.T5 === 'fail' ? sf.teffK === 0 && sf.planets === 0 : true, '没点燃:无恒星温度、0 行星');
const rc = U.run({ Om: 4.5 }), scc = C.cardStats(rc);
ok(scc.fate === rc.cosmos.fate, 'fate 透传');
ok(['ok', 'warn', 'fail'].every((k) => C.STATUS_LINE[k].zh && C.STATUS_LINE[k].en), '状态句中英');

/* 导出/导入往返(格式保持 α5:gus0.toGUS + shared validate) */
const presets = [{}, { kG: 3 }, { kA: 2, kc: 0.5 }, { eps: 0.0068, Q: 2e-5, kL: 0, Om: 0.5, seed: 42 }, { kL: -3 }, { Q: 5e-4 }, { kG: 0.02 }];
for (const p of presets) {
  const res = U.run(p), g = G0.toGUS(res, { name: { zh: '测试', en: 'Test' }, created: '2026-11-22T00:00:00Z' });
  const txt = C.toJSONText(g), back = C.parseImport(txt, gus.validate);
  ok(back.ok, '导入成功 ' + JSON.stringify(p));
  if (!back.ok) continue;
  ok(back.g.id === g.id && back.g.name.zh === '测试', 'id 与名字往返');
  const c = back.g.constants, rr = U.normalize({ kG: c.G.k, kc: c.c.k, kA: c.alpha.k, alphaLinked: c.c.alphaLinked, eps: c.epsilon.si, Q: c.Q.si, kL: c.Lambda.k, Om: c.Omega0.si, seed: back.g.seed });
  const res2 = U.run(rr);
  ok(res2.status === res.status && res2.planets.length === res.planets.length, '导入后结局与行星数不变 ' + JSON.stringify(p));
  ok(C.fileName(g) === 'nomoverse-' + g.id + '.gus.json', '文件名');
  ok(txt.endsWith('\n') && txt.length < C.IMPORT_MAX, 'JSON 文本大小 ' + txt.length);
  const enc = await gus.encode(g); ok(typeof enc === 'string' && enc.length > 0, 'URL 编码可用');
  ok(['gus', 'r'].includes(C.shareKind(enc.length, gus.URL_MAX)), 'shareKind');
  const dec = await gus.decode(enc); ok(dec.id === g.id, 'URL 往返 id');
}
ok(C.parseImport('', gus.validate).err === 'empty', '空文件');
ok(C.parseImport('x'.repeat(C.IMPORT_MAX + 1), gus.validate).err === 'too_big', '超 64KB');
ok(C.parseImport('{oops', gus.validate).err === 'bad_json', '坏 JSON');
ok(C.parseImport('{"a":1}', gus.validate).err === 'not_gus', '非 GUS');
ok(C.parseImport('{"gus":"9.0","kind":"universe"}', gus.validate).err === 'not_gus', '大版本不符');
ok(C.parseImport('{"gus":"0.1","kind":"element"}', gus.validate).ok === false, '别的 kind 不收');
ok(C.parseImport('{"gus":"0.1","kind":"universe","id":"x"}', gus.validate).err === 'no_constants', '缺常数');
ok(C.parseImport('\uFEFF' + C.toJSONText(G0.toGUS(r0, {})), gus.validate).ok, '带 BOM 也能读');
ok(C.parseImport(JSON.stringify({ data: G0.toGUS(r0, {}) }), gus.validate).ok, '包一层 data 也能读');
const evil = G0.toGUS(r0, { name: { zh: '<img src=x onerror=1>', en: 'a' } });
ok(!/[<>]/.test(evil.name.zh), 'toGUS 名字去尖括号');
ok(Object.keys(C.IMPORT_MSG).every((k) => C.IMPORT_MSG[k].zh && C.IMPORT_MSG[k].en), '导入提示中英');
ok(C.shareKind(1800, 1800) === 'gus' && C.shareKind(1801, 1800) === 'r', 'shareKind 边界');

/* Decrypted Text 帧 */
let q = 1; const rnd = () => ((q = (q * 16807) % 2147483647) / 2147483647);
ok(C.decryptFrame('静远宇宙 07', 14, 14, rnd) === '静远宇宙 07', '末帧 = 目标');
ok(C.decryptFrame('ab cd', 0, 14, rnd)[2] === ' ', '空格保留');
ok([...C.decryptFrame('abcdef', 7, 14, rnd)].slice(0, 3).join('') === 'abc', '中途前半已揭');
ok([...C.decryptFrame('静远宇宙', 0, 14, rnd)].length === 4, '多字节长度不变');
ok(C.decryptFrame('x', 3, 0, rnd) === 'x', 'steps=0 直接给目标');

/* 轨道投影 */
const [px, py] = C.project(1, 0, 4, 100); ok(Math.abs(px - 50) < 1e-9 && py === 0, '开方压缩 r=1/4 → 半径一半');
ok(C.project(0, 0, 4, 100).join() === '0,0', '原点');
ok(Math.abs(Math.hypot(...C.project(10, 10, 4, 100)) - 100) < 1e-9, '超出最远点夹到边');
ok(C.dotR(1) > 1 && C.dotR(1e6) === 4.5 && C.dotR(0) === 1.2, '点半径夹区间');

/* T7 N 体 trace */
const t0 = NB.trace(r0, { frames: 240 });
ok(t0.n === r0.planets.length + 1 && t0.frames === 240 && t0.data.length === 240 * t0.n * 2, 'trace 形状');
ok(t0.drift < 1e-4, '能量漂移 < 1e-4:' + t0.drift.toExponential(2));
ok(t0.rMax > 0 && t0.years > 0 && t0.dt > 0, 'trace 元信息');
ok([...t0.data].every(Number.isFinite), '帧数据有限');
const tA = NB.trace(r0, { frames: 60 }), tB = NB.trace(r0, { frames: 60 });
ok(tA.data.every((v, i) => v === tB.data[i]), 'trace 确定');
const inner = r0.planets.reduce((m, p) => (p.aAU < m.aAU ? p : m));
let maxR = 0; for (let f = 0; f < t0.frames; f++) { const i = 1 + r0.planets.indexOf(inner); maxR = Math.max(maxR, Math.hypot(t0.data[(f * t0.n + i) * 2] - t0.data[f * t0.n * 2], t0.data[(f * t0.n + i) * 2 + 1] - t0.data[f * t0.n * 2 + 1])); }
ok(maxR < inner.aAU * (1 + inner.e) * 1.05, '内侧行星不飞出:' + maxR.toFixed(3));
ok((() => { const pm = Math.min(...r0.planets.map((p) => NB.keplerPeriod(t0.n && NB.fromSystem(r0).G, NB.fromSystem(r0).b[0].m, 0, p.aAU))); return t0.years <= pm * 240 / 24 * 1.01; })(), '最内行星每圈 ≥24 帧');
ok(NB.trace(r0, { frames: 1 }).frames === 2 && NB.trace(r0, { frames: 9999 }).frames === 600, '帧数夹 2–600');
const tc = NB.trace(r0, { frames: 50, maxSteps: 100 }); ok(tc.dt > t0.dt && Math.round(tc.years / tc.dt) <= 100, '步数上限放大步长');
for (const p of presets) { const res = U.run(p), o = W.handle({ id: 1, op: 'orbit', recipe: p, frames: 80 }); ok(o.ok && (o.data.lit ? o.data.frames === 80 || !res.planets.length : o.data.frames === 0), 'worker orbit ' + JSON.stringify(p)); }
const wo = W.handle({ id: 2, op: 'orbit', recipe: {}, frames: 30 }).data;
ok(wo.data instanceof Float32Array && Array.isArray(wo.hab) && wo.hab.length === r0.planets.length && wo.rgb.length === 3, 'orbit 带 hab 与 rgb');
ok(wo.hab.some(Boolean), '真实宇宙有宜居行星');

console.log(`create.test: ${pass}/${pass + fail} 通过`);
process.exit(fail ? 1 : 0);
