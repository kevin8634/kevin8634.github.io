/* 3-8 首页 3.0 化 + 声音:纯逻辑测试  node nomoverse/3/tests/home.test.mjs
 * 覆盖:声音状态机(默认关、手势前不建上下文、减少动态不自动播、隐藏挂起、跨页读键)、存储键读写、反馈音映射、
 *       首页 i18n 词条、向导台词、Text Type 帧、Animated List 错峰与键盘、静态化判定、尺度读数;以及文件级约定(键名、引用、sw 预缓存)。 */
import { readFileSync } from 'fs';
import { createRequire } from 'module';
import * as H from '../core/home.mjs';
import * as SE from '../core/home-stars-en.mjs';
const require = createRequire(import.meta.url);
const S = require('../core/sound.js').logic;
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('✗ ' + m); } };
const has = (fx, x) => fx.includes(x);
const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');

/* ---------------- 存储键 ---------------- */
ok(S.KEY === 'gn:nv:_pref', '沿用 2.0 键 gn:nv:_pref');
ok(S.readOn(null) === false && S.readOn('') === false && S.readOn(undefined) === false, '无键 = 关(默认关)');
ok(S.readOn('{"sound":true}') === true && S.readOn('{"sound":false}') === false, 'sound 字段读写');
ok(S.readOn('{"sound":"true"}') === false && S.readOn('{"sound":1}') === false, '非严格 true 视为关');
ok(S.readOn('not json') === false && S.readOn('[true]') === false && S.readOn('null') === false && S.readOn('42') === false, '坏值视为关');
{ const w = JSON.parse(S.writeOn('{"perf":"high","fps":true}', true)); ok(w.sound === true && w.perf === 'high' && w.fps === true, '写入保留其他字段(perf/fps)'); }
{ const w = JSON.parse(S.writeOn('garbage', false)); ok(w.sound === false && Object.keys(w).length === 1, '坏值覆盖为干净对象'); }
ok(S.readOn(S.writeOn(S.writeOn(null, true), true)) === true && S.readOn(S.writeOn(S.writeOn(null, true), false)) === false, '往返');
ok(S.readOn(S.writeOn('[1,2]', true)) === true, '数组值被替换为对象');

/* ---------------- 状态机 ---------------- */
const run = (s, evs) => { let all = []; for (const e of evs) { const r = S.step(s, e); s = r.s; all = all.concat(r.fx); } return { s, fx: all }; };
{ const s0 = S.init(false, false, false); ok(!s0.on && !s0.gest && !s0.ctx && !s0.music, '初始:关、无手势、无上下文、无音乐'); }
// 默认关:手势也不建上下文
{ const r = run(S.init(false, false, false), [{ t: 'gesture' }, { t: 'gesture' }, { t: 'hidden', v: true }, { t: 'hidden', v: false }]);
  ok(!r.s.ctx && !has(r.fx, 'create') && !has(r.fx, 'music:on'), '关着:手势、切前后台都不建 AudioContext、不放音乐'); }
// 开着,但手势前不建
{ const r = run(S.init(true, false, false), [{ t: 'hidden', v: true }, { t: 'hidden', v: false }, { t: 'reduced', v: false }]);
  ok(!r.s.ctx && !has(r.fx, 'create'), '开着:没有用户手势前不建 AudioContext'); }
// 开着 + 手势 → 建 + 恢复 + 音乐
{ const r = S.step(S.init(true, false, false), { t: 'gesture' });
  ok(has(r.fx, 'create') && has(r.fx, 'resume') && has(r.fx, 'music:on') && r.s.ctx && r.s.music, '开着 + 第一次手势:建上下文、恢复、放背景音乐');
  const r2 = S.step(r.s, { t: 'gesture' }); ok(!has(r2.fx, 'create') && r2.fx.length === 0, '第二次手势无副作用(只建一次)'); }
// 减少动态:不自动播
{ const r = S.step(S.init(true, true, false), { t: 'gesture' });
  ok(has(r.fx, 'create') && !has(r.fx, 'music:on') && !r.s.music, '减少动态 + 开着 + 手势:建上下文(音效可用),背景音乐不自动播'); }
{ const r = run(S.init(false, true, false), [{ t: 'set', on: true }]);
  ok(has(r.fx, 'create') && has(r.fx, 'music:on') && r.s.explicit, '减少动态下用户亲手打开开关:才播背景音乐'); }
{ const r = run(S.init(true, true, false), [{ t: 'gesture' }, { t: 'sync', on: true }]); ok(!r.s.music, '减少动态:从存储读回「开」不算亲手打开,不播'); }
{ const r = run(S.init(true, false, false), [{ t: 'gesture' }, { t: 'reduced', v: true }]); ok(has(r.fx, 'music:off') && !r.s.music, '播放中切到减少动态:停背景音乐'); }
{ const r = run(S.init(true, false, false), [{ t: 'gesture' }, { t: 'reduced', v: true }, { t: 'reduced', v: false }]); ok(r.s.music && r.fx.filter((x) => x === 'music:on').length === 2, '恢复完整动效:音乐回来'); }
// 开关
{ const r = run(S.init(false, false, false), [{ t: 'set', on: true }]); ok(has(r.fx, 'create') && r.s.on && r.s.gest, '点开关 = 手势:直接建上下文'); }
{ const r = run(S.init(false, false, false), [{ t: 'set', on: true }, { t: 'set', on: false }]);
  ok(has(r.fx, 'suspend') && has(r.fx, 'music:off') && !r.s.music && !r.s.on && r.s.ctx, '再点关:挂起、停音乐(上下文保留复用)'); }
{ const r = run(S.init(false, false, false), [{ t: 'set', on: true }, { t: 'set', on: false }, { t: 'set', on: true }]);
  ok(r.fx.filter((x) => x === 'create').length === 1 && r.fx.filter((x) => x === 'resume').length === 2, '反复开关只建一次上下文'); }
{ const r = run(S.init(false, false, false), [{ t: 'set', on: false }]); ok(!has(r.fx, 'create') && !r.s.ctx, '点开关到「关」不建上下文'); }
// 隐藏
{ const r = run(S.init(true, false, false), [{ t: 'gesture' }, { t: 'hidden', v: true }]); ok(has(r.fx, 'suspend') && has(r.fx, 'music:off'), '页面隐藏:挂起 + 停音乐'); }
{ const r = run(S.init(true, false, false), [{ t: 'gesture' }, { t: 'hidden', v: true }, { t: 'hidden', v: false }]); ok(r.fx.slice(-2).join() === 'resume,music:on', '回到前台:恢复 + 音乐'); }
{ const r = run(S.init(true, false, true), [{ t: 'gesture' }]); ok(has(r.fx, 'create') && !has(r.fx, 'resume') && !r.s.music, '隐藏时的手势:建上下文但不恢复、不放音乐'); }
// 跨页 / 其他标签页 sync
{ const r = run(S.init(true, false, false), [{ t: 'gesture' }, { t: 'sync', on: false }]); ok(!r.s.on && has(r.fx, 'music:off'), '别处关掉 → 本页同步关'); }
{ const r = run(S.init(false, false, false), [{ t: 'sync', on: true }]); ok(r.s.on && !r.s.ctx && !has(r.fx, 'create'), '别处打开 → 本页记为开,但仍等手势才建上下文'); }
{ const r = S.step(S.init(true, false, false), { t: 'bogus' }); ok(r.fx.length === 0, '未知事件无副作用'); }
// 不变量:任何事件序列里 music 为真 ⇒ on && gest && ctx && !hidden
{ let bad = 0, seed = 7; const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  const EV = [() => ({ t: 'gesture' }), () => ({ t: 'set', on: rnd() < 0.5 }), () => ({ t: 'sync', on: rnd() < 0.5 }), () => ({ t: 'hidden', v: rnd() < 0.5 }), () => ({ t: 'reduced', v: rnd() < 0.5 })];
  for (let k = 0; k < 400; k++) { let s = S.init(rnd() < 0.5, rnd() < 0.5, rnd() < 0.3); let creates = 0;
    for (let i = 0; i < 12; i++) { const r = S.step(s, EV[Math.floor(rnd() * EV.length)]()); s = r.s; creates += r.fx.filter((x) => x === 'create').length;
      if (s.music && !(s.on && s.gest && s.ctx && !s.hidden)) bad++; if (s.ctx && !s.gest) bad++; if (s.music && s.reduced && !s.explicit) bad++; }
    if (creates > 1) bad++; }
  ok(bad === 0, '随机 400 组事件序列:音乐只在 开+手势+前台 时播;上下文只建一次且晚于手势;减少动态只在亲手打开时播'); }

/* ---------------- 反馈音 ---------------- */
for (const k of ['bang', 'ok', 'warn', 'fail', 'stageOk', 'stageWarn', 'stageFail', 'name', 'share', 'export', 'import', 'importBad', 'tohelm', 'mode', 'tryCard', 'random', 'reset', 'toggleOn', 'entry'])
  ok(S.cue(k).length >= 1, '反馈音:' + k);
{ const files = new Set(S.SFX.concat(['boom', 'chime'])); ok(Object.values(S.CUES).flat().every((n) => files.has(n)), '反馈音只用现有音效文件或合成音(boom/chime)'); }
ok(S.cue('bang').includes('boom'), '大爆炸 = 合成低频轰');
ok(S.cue('ok').includes('chime'), '七关走完 = 合成和弦');
ok(S.outcomeCue('ok') === 'ok' && S.outcomeCue('warn') === 'warn' && S.outcomeCue('fail') === 'fail' && S.outcomeCue('x') === 'fail', '结局 → 反馈音');
ok(S.stageCue('ok') === 'stageOk' && S.stageCue('warn') === 'stageWarn' && S.stageCue('fail') === 'stageFail' && S.stageCue('todo') === null, '逐关 → 反馈音');
ok(S.cue('nope').length === 0, '未知操作无声');
{ const c = S.cue('bang'); c.push('x'); ok(S.cue('bang').length === 2, 'cue 返回副本'); }
ok(S.SFX.length === 8 && !S.SFX.includes(S.MUSIC), '8 个音效 + 背景音乐分开懒加载');
{ const last = {}; ok(S.throttle(last, 'a', 1000) && !S.throttle(last, 'a', 1050) && S.throttle(last, 'a', 1081) && S.throttle(last, 'b', 1081), '同名 80 ms 防连发'); }
{ const z = S.label(true, 'zh'), e = S.label(false, 'en'); ok(z.name === '声音' && z.state === '声音:开' && e.name === 'Sound' && e.state === 'Sound: off' && !H.hasCJK(e.name + e.state), '开关文案中英'); }

/* ---------------- 首页 i18n ---------------- */
ok(H.missingEn(H.HOME_EN).length === 0, '首页新词条英文齐全且无中文:' + H.missingEn(H.HOME_EN).join('|'));
ok(Object.keys(H.HOME_EN).every((k) => H.hasCJK(k)), '词条键都是中文原文');
ok(H.HOME_EN['3.0 · 改宇宙'] && H.HOME_EN['@进入宙律 3.0 · 改宇宙(宇宙配方台)'], '3.0 入口文案与 aria');
ok(H.GTIPS.zh.length === H.GTIPS.en.length && H.GTIPS.zh.length >= 4, '向导台词中英条数一致');
ok(H.GTIPS.en.every((t) => t && !H.hasCJK(t)) && H.GTIPS.zh.every((t) => H.hasCJK(t)), '向导台词英文无中文');
ok(H.tips('en') === H.GTIPS.en && H.tips('zh') === H.GTIPS.zh && H.tips('fr') === H.GTIPS.zh, 'tips 语言回退中文');
ok(H.tipNext(0, 5) === 1 && H.tipNext(4, 5) === 0 && H.tipNext(9, 5) === 0 && H.tipNext(0, 0) === 0, '换句循环');
ok(H.hasCJK('中') && !H.hasCJK('abc 123 ×10⁰') && H.hasCJK('\uff0c'), 'hasCJK');
{ const idx = read('../../i18n.js'); ok(!/"3\.0 · 改宇宙"/.test(idx), '首页新词条不重复写进 2.0 i18n.js(由 home.mjs 追加)'); }

/* ---------------- Text Type 帧 ---------------- */
{ const f = H.typeFrames('', '你好'); ok(f.join('|') === '你|你好', '从空打字'); }
{ const f = H.typeFrames('你好世界', '你们'); ok(f[0] === '你好世' && f.includes('你') && f[f.length - 1] === '你们' && !f.includes(''), '先删到公共前缀再打'); }
{ const f = H.typeFrames('abc', 'abc'); ok(f.length === 1 && f[0] === 'abc', '同句不动'); }
{ const f = H.typeFrames('abc', ''); ok(f[f.length - 1] === '' && f.length <= 3, '删空'); }
{ const f = H.typeFrames('', 'a𝄞b'); ok(f.join('|') === 'a|a𝄞|a𝄞b', '按码点切分,不拆代理对'); }
{ const long = 'x'.repeat(200), f = H.typeFrames(long, 'y'); const dels = f.filter((s) => s.length && s[0] === 'x' || s === ''); ok(dels.length <= 25 && f[f.length - 1] === 'y', '长句删除封顶约 24 帧'); }
{ let mono = true; const f = H.typeFrames('从质子到', '从质子到银河系'); for (let i = 1; i < f.length; i++) if (f[i].length < f[i - 1].length) mono = false; ok(mono && f.length === 3, '续打只增不减'); }
ok(H.frameDelay('ab', 'abc', 40) < 40 && H.frameDelay('你,', '你', 40) === 200 && H.frameDelay('你好', '你', 40) === 40, '帧间隔:删快、标点停顿');

/* ---------------- Animated List ---------------- */
ok(H.staggerDelay(0) === 0 && H.staggerDelay(3) === 165 && H.staggerDelay(100) === 440 && H.staggerDelay(-2) === 0, '错峰延迟与封顶');
ok(H.listKey(0, 'ArrowDown', 6) === 1 && H.listKey(5, 'ArrowDown', 6) === 5 && H.listKey(0, 'ArrowUp', 6) === 0 && H.listKey(3, 'ArrowLeft', 6) === 2, '方向键移动、到头停住');
ok(H.listKey(3, 'Home', 6) === 0 && H.listKey(1, 'End', 6) === 5 && H.listKey(2, 'a', 6) === 2 && H.listKey(0, 'ArrowDown', 0) === -1, 'Home/End/无关键/空列表');

/* ---------------- 静态化与读数 ---------------- */
ok(H.staticFx({ reduced: true }) && H.staticFx({ tier: 'low' }) && !H.staticFx({ tier: 'mid' }) && !H.staticFx({ tier: 'high' }) && !H.staticFx(), '减少动态或低档 → 静态');
ok(H.scaleText(0) === '10⁰ m' && H.scaleText(-15) === '10⁻¹⁵ m' && H.scaleText(20.6) === '10²¹ m', '尺度读数');
ok(H.scaleAria(0, 'zh', '人') === '约 10 的 0 次方米,人的尺度' && H.scaleAria(7.1, 'en', 'Earth') === 'About 10 to the 7 metres, the scale of Earth' && !H.hasCJK(H.scaleAria(3, 'en', '')), '尺度读屏中英');

/* ---------------- 星图英文补全 ---------------- */
{ const idx = read('../../index.html'), sm = read('../../core/starmap3d.js');
  const descs = [...idx.matchAll(/\[(\d), "([^"]+)", (-?[\d.]+), "([^"]+)"/g)].map((m) => m[4]);
  ok(descs.length === 60, '首页 60 颗知识星说明');
  ok(descs.every((d) => SE.STAR_DESC_EN[d]), '60 条说明都有英文:' + descs.filter((d) => !SE.STAR_DESC_EN[d]).slice(0, 2).join('|'));
  ok(SE.missingStarEn().length === 0 && Object.keys(SE.STAR_DESC_EN).length === 60, '星说明英文无中文、无多余');
  ok(Object.keys(SE.STAGE_EN).every((k) => sm.includes(k.replace(/^@/, ''))), '星图读屏原文与 starmap3d.js 一致');
  ok(H.missingEn(SE.STAGE_EN).length === 0, '星图读屏英文无中文');
  // 句式:用一个最小的递归 T 模拟 i18n.js
  const D = Object.assign({ '抛体运动': 'Projectile motion', '运动': 'Motion', '人': 'Human', '如果引力变成两倍,篮球还能投进吗?': 'If gravity doubled, could you still make the shot?', '地球投篮': 'Shooting on Earth' }, SE.STAR_DESC_EN);
  let RX; const T = (x) => { if (D[x]) return D[x]; for (const [re, f] of RX) { if (re.test(x)) { const r = x.replace(re, f); if (r !== x && !r.includes('null') && !H.hasCJK(r)) return r; } } return x; };
  RX = SE.patterns(T);
  const cases = [
    ['抛体运动,运动星座,约 10 的 1 次方米,本期可点亮', 'Projectile motion, Motion constellation, about 10 to the 1 metres, can be lit now'],
    ['运动 星座', 'Motion constellation'], ['飞到 10 的 -12 次方米', 'Fly to 10 to the -12 metres'],
    ['运动 星座 · 约 10¹ 米', 'Motion constellation · about 10¹ m'],
    ['知识星列表:60 颗,按星座分组;回车查看说明', 'Knowledge star list: 60 stars, grouped by constellation; press Enter for details'],
    ['完成 「如果引力变成两倍,篮球还能投进吗?」第 1 关 · 地球投篮 即可点亮。', 'Complete “If gravity doubled, could you still make the shot?” level 1 · Shooting on Earth to light it.'],
    ['约 10 的 0 次方米,人的尺度', 'About 10 to the 0 metres, the scale of Human'], ['★ 抛体运动', '★ Projectile motion'],
    ['典型尺度:约 10⁻⁶ 米 · 简化表述,供科普探究', 'Typical scale: about 10⁻⁶ m · simplified wording, for science exploration']
  ];
  for (const [zh, en] of cases) ok(T(zh) === en, '句式:' + zh + ' → ' + T(zh));
  { const live = '抛体运动,运动星座,本期可点亮。不计空气阻力,抛出的物体走一条抛物线,篮球也一样。'; ok(T(live).startsWith('Projectile motion, Motion constellation, can be lit now. Ignoring air'), '读屏整句(名 + 星座 + 状态 + 说明)'); }
  ok(T('未知星,运动星座,约 10 的 1 次方米,待探索') === '未知星,运动星座,约 10 的 1 次方米,待探索', '片段缺译 → 整句回退中文(不留半截英文)');
}

/* ---------------- 文件级约定 ---------------- */
{ const idx = read('../../index.html'), nv = read('../../core/nv.js'), sw = read('../../sw.js'), v3 = read('../index.html'), mm = read('../main.mjs');
  ok(/<script src="3\/core\/sound\.js"><\/script>\s*<script>window\.NV_SND_EXT/.test(idx) && idx.indexOf('3/core/sound.js') < idx.indexOf('core/nv.js"'), '首页先载共用声音引擎再载 nv.js');
  ok(/var SND = W\.NV_SND_EXT \|\| \(function \(\) \{/.test(nv), 'nv.js 只加一个可选钩子(任务页不设,行为不变)');
  ok(v3.indexOf('core/sound.js') > 0 && v3.indexOf('core/sound.js') < v3.indexOf('main.mjs') && v3.includes('kit.css'), '/3/ 载同一引擎与开关样式');
  ok(mm.includes("sfx('bang')") && mm.includes("sfx('export')") && mm.includes("sfx('tohelm')") && mm.includes('outcomeCue') && mm.includes('stageCue'), '/3/ 关键操作有反馈音');
  ok(idx.includes('3/core/home3.mjs') && idx.includes('../shared/3/tokens.css') && idx.includes('3/home3.css'), '首页引用 3.0 令牌、玻璃样式与组件');
  for (const f of ['3/core/sound.js', '3/core/home.mjs', '3/core/home-stars-en.mjs', '3/core/home-ui.mjs', '3/core/home3.mjs', '3/home3.css', '3/kit.css', '/shared/3/tokens.css', '/shared/3/ui.css'])
    ok(sw.includes("'" + f + "'"), 'sw 预缓存:' + f);
  ok(!sw.includes("'audio/music-nomoverse-loop.m4a'"), '背景音乐不预缓存(用到时再缓存)');
  ok(/const C = 'nv-v2\.0-a3_v3\.0-a8_s3-0\.3'/.test(sw), 'sw 版本 nv-v2.0-a3_v3.0-a8_s3-0.3');
  // 任务 id 与进度键不变
  ok(['hoop', 'orbit', 'sound', 'stars', 'tide', 'energy'].every((id) => idx.includes('{ id: "' + id + '"')), '六个任务 id 不变');
  ok(nv.includes('"gn:nv:" + id') && nv.includes('"gn:nv:_pref"'), '进度键 gn:nv:<id>、偏好键 gn:nv:_pref 不变');
  ok(!/AudioContext/.test(read('../core/home3.mjs') + read('../core/home-ui.mjs')), '首页组件不直接碰 AudioContext(统一走引擎)');
}

console.log(`home.test: ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
