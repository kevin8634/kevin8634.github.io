/* 3-3 新手层纯函数测试:node nomoverse/3/tests/teach.test.mjs */
import { createRequire } from 'module';
import { snap1, REAL, REAL_CREDIT, compareRows, explain, CODES, STAGE, GUIDE, guideStep } from '../core/teach.mjs';
const U = createRequire(import.meta.url)('../core/universe.js');
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('✗ ' + m); } };
// ×1 吸附
ok(snap1(1.03) === 1 && snap1(0.97) === 1 && snap1(1.04) === 1, '±4% 吸到 1');
ok(snap1(1.05) === 1.05 && snap1(0.95) === 0.95, '超出 4% 不吸');
ok(snap1(100) === 100 && snap1(0.01) === 0.01, '端点不动');
ok(snap1(0) === 0 && Number.isNaN(snap1(NaN)), '非正数原样');
// 键盘步长(对数 1%)能走出吸附区:从 1 走一步不被吸回
ok(snap1(0.01 * Math.pow(1e4, 0.51)) !== 1, 'kG 键盘一步离开 ×1');
// 真实数据都带出处与许可
for (const [k, r] of Object.entries(REAL)) ok(r.src && r.lic && typeof r.v === 'number', 'REAL.' + k + ' 有出处与许可');
ok(REAL_CREDIT.zh.includes('Planck') && REAL_CREDIT.en.includes('NASA'), '署名行');
// 默认宇宙:无失败卡,对照行 5 行,真实列固定
const r0 = U.run({});
ok(explain(r0, U) === null, '真实配方无失败卡');
const rows = compareRows(r0, 'zh');
ok(rows.length === 5 && rows.every((x) => x.k && x.real && x.yours), '对照 5 行完整');
ok(rows[0].real === '138 亿年' && rows[2].real === 'Z = 82', '真实列');
ok(compareRows(r0, 'en')[0].real === '13.8 Gyr', '英文年龄');
// 每种失败码都有中英两层文本,且能从某个配方触发
const presets = { crunch: { kG: 100 }, helium_only: { eps: 0.01 }, hydrogen_only: { eps: 0.0055 }, no_atoms: { kA: 20 }, few_elements: { kA: 4 },
  cold: { Q: 1e-7 }, bh_soup: { Q: 1e-3 }, no_ignition: { kG: 0.01 }, flash: { kG: 8 }, orbit_break: { Q: 1e-3 }, chem_freeze: { kA: 0.2 } };
ok(CODES.length === 11 && CODES.every((c) => U.FAILURES[c]), '11 码与 universe 对齐');
for (const c of CODES) {
  for (const lang of ['zh', 'en']) {
    const fake = { ...r0, failures: [c], warnings: [] };
    const e = explain(fake, U, lang);
    ok(e && e.code === c && e.stage === U.FAILURES[c] && e.why.length > 20 && e.fix.length > 4 && !/undefined|NaN/.test(e.why + e.fix), `${c}/${lang} 文本`);
  }
}
let hit = 0;
for (const [c, p] of Object.entries(presets)) { const r = U.run(p); const all = r.failures.concat(r.warnings); if (all.includes(c)) hit++; else console.log('  (未触发)', c, JSON.stringify(p), all); 
  const e = explain(r, U); if (e) ok(!/undefined|NaN/.test(e.why), c + ' 真实数字无 NaN'); const cr = compareRows(r, 'zh'); ok(cr.every((x) => !/undefined|NaN/.test(x.yours)), c + ' 对照无 NaN'); }
ok(hit >= 9, '预设触发失败码 ' + hit + '/11');
// 失败时对照里「你的宇宙」不撒谎:恒星没点燃显示 0 行星
const rn = U.run({ kG: 0.01 }); if (rn.stages.T5 === 'fail') ok(compareRows(rn, 'zh')[3].yours === '0', '没点燃 0 行星');
const rf = U.run({ kG: 8 }); if (rf.stages.T6 === 'fail') ok(compareRows(rf, 'zh')[3].yours === '0', '恒星早夭 0 行星');
const ra = U.run({ kA: 20 }); ok(compareRows(ra, 'zh')[1].yours === '没有恒星' && compareRows(ra, 'zh')[3].yours === '0', '原子关失败无恒星');
ok(compareRows(r0, 'zh')[3].yours === String(r0.planets.length), '真实配方行星照实');
// 每关讲解与引导文本
ok(U.ORDER.every((t) => STAGE[t] && STAGE[t].zh && STAGE[t].en), '7 关讲解中英');
ok(GUIDE.zh.length === 3 && GUIDE.en.length === 3 && GUIDE.zh[2].ok && GUIDE.en[2].ok, '引导三步');
// 引导状态机
ok(guideStep(0, { type: 'knob', key: 'kG', v: 1.5 }) === 0, '拧不够 2 倍不前进');
ok(guideStep(0, { type: 'knob', key: 'kc', v: 10 }) === 0, '拧别的不算');
ok(guideStep(0, { type: 'knob', key: 'kG', v: 0.4 }) === 1, '往小拧也算');
ok(guideStep(0, { type: 'bang' }) === 0, '没拧先按不跳步');
ok(guideStep(1, { type: 'bang' }) === 2 && guideStep(2, { type: 'done' }) === 3, '按序走完');
ok(guideStep(1, { type: 'skip' }) === 3, '可跳过');
console.log(`teach(3-3):合计:${pass} 通过,${fail} 失败`); if (fail) process.exit(1);
