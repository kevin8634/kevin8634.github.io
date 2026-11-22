/* 3-6 画质与可达性纯函数测试:node nomoverse/3/tests/access.test.mjs */
import { readFileSync } from 'fs';
import * as A from '../core/access.mjs';
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('✗ ' + m); } };
const near = (a, b, e = 1e-9) => Math.abs(a - b) <= e * Math.max(1, Math.abs(b));

/* ---- 三档预算 ---- */
ok(A.TIERS.join() === 'low,medium,high', '三档顺序 low/medium/high');
ok(A.QBUDGET.low.particles === 4096 && A.QBUDGET.medium.particles === 16384 && A.QBUDGET.high.particles === 65536, '粒子 4k/16k/65k(方案 §5.2)');
ok(A.QBUDGET.low.dpr === 1 && A.QBUDGET.medium.dpr === 1.5 && A.QBUDGET.high.dpr === 2, '像素比 1/1.5/2');
ok(!A.QBUDGET.low.post && A.QBUDGET.medium.post && A.QBUDGET.high.post, '后期:low 关、mid/high 开');
ok(A.QBUDGET.high.glow > 0 && A.QBUDGET.medium.glow === 0 && A.QBUDGET.low.glow === 0, '柔光只在 high');
ok(A.QBUDGET.high.samples === 4 && A.QBUDGET.medium.samples === 2 && A.QBUDGET.low.samples === 0, 'MSAA 4/2/0');
ok(!A.QBUDGET.low.gpgpu && A.QBUDGET.medium.gpgpu && A.QBUDGET.high.gpgpu, 'GPGPU:low 退普通点云');
for (const t of A.TIERS) { ok(A.QBUDGET[t].label.zh && A.QBUDGET[t].label.en && !A.hasCJK(A.QBUDGET[t].label.en), t + ' 档名中英'); ok(A.POST_NOTE[t].zh && !A.hasCJK(A.POST_NOTE[t].en), t + ' 后期说明中英'); }
ok(A.QBUDGET.low.particles <= A.QBUDGET.medium.particles && A.QBUDGET.medium.particles <= A.QBUDGET.high.particles, '粒子单调');
// 与 /shared/3/tier.js BUDGET 粒子数一致
{ const src = readFileSync(new URL('../../../shared/3/tier.js', import.meta.url), 'utf8');
  const m = { high: /high:\s*\{\s*particles:\s*(\d+)/.exec(src), medium: /medium:\s*\{\s*particles:\s*(\d+)/.exec(src), low: /low:\s*\{\s*particles:\s*(\d+)/.exec(src) };
  for (const t of A.TIERS) ok(m[t] && +m[t][1] === A.QBUDGET[t].particles, t + ' 粒子数与 shared tier.js 一致'); }
// 软件渲染强制 low
for (const t of A.TIERS) ok(A.effectiveTier(t, true) === 'low', '软件渲染 ' + t + ' → low');
for (const t of A.TIERS) ok(A.effectiveTier(t, false) === t, 'GPU ' + t + ' 保持');
ok(A.effectiveTier('ultra', false) === 'medium', '未知档 → medium');
ok(A.budgetFor('high', { mobile: true }).dpr === 1.5, '手机 high 像素比封顶 1.5');
ok(A.budgetFor('high', { floatRT: false }).gpgpu === false, '无浮点渲染目标 → 关 GPGPU');
ok(A.budgetFor('nope').tier === 'low' && A.budgetFor('nope').particles === 4096, '未知档预算按 low');
{ const b = A.budgetFor('medium'); b.dpr = 9; ok(A.QBUDGET.medium.dpr === 1.5, 'budgetFor 返回副本,不改常量'); }
ok(A.gpgpuSide(4096) === 64 && A.gpgpuSide(16384) === 128 && A.gpgpuSide(65536) === 256, 'GPGPU 纹理边长 64/128/256');
ok(A.gpgpuSide(5000) === 128 && A.gpgpuSide(1) === 1, '非整方数向上取 2 的幂');

/* ---- 亮度上限与防闪 ---- */
ok(A.clampLum(10) === A.LUM_MAX && A.clampLum(-1) === 0 && A.clampLum(1) === 1, 'clampLum');
ok(A.GLOW_MAX === 0.85, 'GLOW_MAX 与 tokens --gn3-glow-max 一致');
{ const css = readFileSync(new URL('../../../shared/3/tokens.css', import.meta.url), 'utf8'); ok(/--gn3-glow-max:\s*\.85/.test(css), 'tokens.css glow-max = .85'); }
ok(A.FLASH_HZ <= 3, '闪烁上限 ≤3 Hz');
// 10 Hz 来回跳:实际放行 ≤3 次/秒
for (const hz of [5, 10, 30, 60]) {
  const g = new A.FlashGate(); const shown = [];
  for (let t = 0; t <= 3000; t += 1000 / hz) { const v = g.push(t, Math.floor(t * hz / 1000) % 2 ? 1 : 0.05); shown.push(v); }
  ok(A.maxFlashRate(g.flashes) <= 3, hz + ' Hz 输入 → 任意 1 秒 ≤3 次闪(实际 ' + A.maxFlashRate(g.flashes) + ')');
}
{ const g = new A.FlashGate(); g.push(0, 0.1); ok(g.push(10, 0.15) === 0.15, '小变化直接通过'); ok(g.push(20, 1) === 1, '第一次大跳变立即放行');
  ok(g.push(100, 0.1) === 1, '333ms 内第二次大跳变挂起'); ok(g.wait(100) > 0 && near(g.wait(100), 1000 / 3 - 80), 'wait 给出剩余时间');
  ok(g.tick(200) === 1, '未到点不放行'); ok(g.tick(360) === 0.1, '到点放行挂起的最新目标'); ok(g.wait(360) === 0, '放行后无挂起'); }
{ const g = new A.FlashGate(); g.push(0, 0); g.push(400, 1); g.push(450, 0.5); g.push(460, 0.0); ok(g.pending === 0.0, '挂起时只保留最新目标'); }
ok(A.maxFlashRate([0, 100, 200, 300, 1500]) === 4 && A.maxFlashRate([]) === 0, 'maxFlashRate 窗口计数');
ok(near(A.lumFollow(0, 1, 0.14, 0.14), 1 - Math.exp(-1)), 'lumFollow 一个 tau 到 63%');
ok(A.lumFollow(0, 1, 0.01, 0.14, true) === 1, '减少动态直接到位');
ok(A.lumFollow(0.3, 1, 0, 0.14) === 0.3, 'dt=0 不动');
ok(A.pulseEnv(0) === 0 && A.pulseEnv(900) === 0 && near(A.pulseEnv(450), 1) && A.pulseEnv(450, 900, 0.6) <= 0.6, '脉冲半正弦,峰值钳制');
{ let mx = 0; for (let t = 0; t <= 900; t += 5) mx = Math.max(mx, A.pulseEnv(t)); ok(mx <= 1, '脉冲不超过 1'); }

/* ---- 减少动态 ---- */
ok(A.motionReduced('auto', true) && !A.motionReduced('auto', false), '跟随系统');
ok(A.motionReduced('reduce', false) && A.motionReduced('reduce', true), '页内「减少」总是生效');
ok(!A.motionReduced('full', true) && !A.motionReduced('full', false), '页内「完整」覆盖系统');
ok(A.MOTION.join() === 'auto,reduce,full', '动效三选一');

/* ---- Swipe Toast ---- */
ok(A.swipeDismiss(150, 5, 300) && A.swipeDismiss(-150, 5, 300), '拖过 35% 关闭(左右都行)');
ok(!A.swipeDismiss(60, 5, 300), '拖得不够不关');
ok(A.swipeDismiss(40, 2, 300, 0.9) && !A.swipeDismiss(10, 2, 300, 2), '快速甩动关闭,太短不算');
ok(!A.swipeDismiss(100, 200, 300), '竖向为主不算');
{ let q = []; q = A.toastQueue(q, { key: 'a' }); q = A.toastQueue(q, { key: 'b' }); q = A.toastQueue(q, { key: 'a', v: 2 });
  ok(q.length === 2 && q[1].key === 'a' && q[1].v === 2, '同 key 合并为最新');
  q = A.toastQueue(q, { key: 'c' }); q = A.toastQueue(q, { key: 'd' }); ok(q.length === 3 && q[0].key === 'a', '最多 3 条,挤掉最旧'); }

/* ---- Warm Tooltip 定位 ---- */
{ const r = { left: 100, top: 300, width: 44, height: 44, right: 144, bottom: 344 };
  const p = A.tipPlace(r, 120, 30, 1440, 900); ok(p.side === 'top' && p.y === 300 - 8 - 30, '默认在上方');
  ok(p.x === Math.round(122 - 60), '水平居中');
  const q = A.tipPlace({ left: 10, top: 4, width: 44, height: 44, right: 54, bottom: 48 }, 200, 30, 375, 667); ok(q.side === 'bottom' && q.y === 56 && q.x === 8, '贴顶翻到下方、左侧夹 8px');
  const z = A.tipPlace({ left: 340, top: 300, width: 30, height: 30, right: 370, bottom: 330 }, 200, 30, 375, 667); ok(z.x + 200 <= 375 - 8, '右侧不出视口');
  ok(z.arrow >= 10 && z.arrow <= 190, '箭头指向按钮且在气泡内');
  const s = A.tipPlace({ left: 10, top: 2, width: 40, height: 316, right: 50, bottom: 318 }, 120, 40, 568, 320); ok(s.y >= 8 && s.y + 40 <= 320 - 8 + 0.01, '矮屏上下都放不下时夹在视口内'); }
ok(A.longPressMs >= 400 && A.longPressMs <= 600, '长按 400–600ms');

/* ---- 触控目标 ---- */
ok(A.HIT === 44, '触控目标 44px');
ok(A.hitOK({ width: 44, height: 44 }) && !A.hitOK({ width: 43, height: 60 }) && !A.hitOK({ width: 60, height: 36 }), 'hitOK');
ok(A.smallTargets([{ width: 44, height: 44 }, { width: 30, height: 50 }, { width: 0, height: 0 }]).length === 1, 'smallTargets 忽略不可见');

/* ---- 布局 ---- */
ok(A.layoutFor(1440, 900) === 'desk' && A.layoutFor(1000, 760) === 'mid' && A.layoutFor(375, 667) === 'portrait' && A.layoutFor(568, 320) === 'short', '四档布局');
ok(A.layoutFor(667, 375) === 'short' && A.layoutFor(320, 568) === 'portrait', '旋转后布局切换');

/* ---- 英文全量 ---- */
ok(A.hasCJK('宙律') && !A.hasCJK('Nomoverse ×1 Λ Ω₀ ⁻¹¹') && A.hasCJK('a\uff0cb') && A.hasCJK('「x」'), 'hasCJK(含全角标点)');
ok(A.missingEn({ a: { zh: '甲', en: 'A' }, b: { zh: '乙' }, c: { zh: '丙', en: '丙' }, d: { zh: 'x', en: 'x', zhMore: '长', enMore: '' } }).join() === 'b,c,d', 'missingEn');
ok(A.cjkLeft(['Hello', '静远宇宙', 'abc'], ['静远']).length === 0 && A.cjkLeft(['Hello', '中文']).length === 1, 'cjkLeft 白名单');
// main.mjs 的界面字典:每条都有英文、英文里无中文
{ const src = readFileSync(new URL('../main.mjs', import.meta.url), 'utf8');
  const a = src.indexOf('const DICT = {'), b = src.indexOf('\n};', a);
  const DICT = Function('return ' + src.slice(a + 'const DICT = '.length, b + 2))();
  const miss = A.missingEn(DICT); ok(miss.length === 0, '界面字典英文全量(缺:' + miss.join(',') + ')');
  ok(Object.keys(DICT).length >= 120, '字典词条 ≥120(实际 ' + Object.keys(DICT).length + ')');
  for (const k of ['title', 'qT', 'qTier', 'qMotion', 'mAuto', 'mReduce', 'mFull', 'swForced', 'qdrop', 'qSet', 'mOn', 'mOff', 'kbd', 'close', 'toastsAria', 'tlAria', 'leftAria', 'rightAria', 'tipHelp', 'tipUndo', 'tipRedo', 'tipQ', 'tipLang', 'tipLock'])
    ok(DICT[k] && DICT[k].zh && DICT[k].en, '3-6 词条 ' + k);
  // FAIL_NOTE_EN 覆盖全部失败码
  const fa = src.indexOf('const FAIL_NOTE_EN = {'), fb = src.indexOf('\n};', fa);
  const FN = Function('return ' + src.slice(fa + 'const FAIL_NOTE_EN = '.length, fb + 2))();
  ok(Object.values(FN).every((x) => x && !A.hasCJK(x)), 'FAIL_NOTE_EN 全英文'); }
// index.html:写死的中文都有 data-i18n / data-i18n-aria 接管(或由脚本 relabel 覆盖的 id)
{ const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const body = html.slice(html.indexOf('<body>'), html.indexOf('<script'));
  const tags = body.match(/<[^>]+>[^<]*/g) || [];
  const RELABEL = ['help', 'q', 'lang', 'g-skip', 'g-next', 'qpanel'];
  const bad = tags.filter((t) => { const txt = t.replace(/^<[^>]+>/, ''); const attrs = t.match(/^<[^>]+>/)[0];
    const id = (attrs.match(/id="([^"]+)"/) || [])[1];
    const txtBad = A.hasCJK(txt) && !/data-i18n="/.test(attrs) && !RELABEL.includes(id);
    const ariaBad = /aria-label="[^"]*[\u4e00-\u9fff]/.test(attrs) && !/data-i18n-aria="/.test(attrs) && !RELABEL.includes(id);
    return txtBad || ariaBad; });
  ok(bad.length === 0, 'index.html 写死中文都有 i18n 接管(' + bad.slice(0, 3).join(' | ') + ')');
  ok(/id="sr-live"/.test(html) && /id="toasts"/.test(html) && /id="qpanel"[^>]*role="dialog"/.test(html), '读屏播报区、toast 区、画质面板 dialog');
  ok(!/class="right[^"]*"[^>]*aria-live/.test(html), '结果栏不再整块 aria-live(改为精简播报)'); }

/* ---- 内存 ---- */
ok(A.heapOK([20, 21, 20.5, 21, 20.8, 21.1, 20.9, 21, 20.7, 21, 20.9]).ok, '平稳 → 通过');
ok(!A.heapOK([20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40]).ok, '每次 +2MB → 不通过');
ok(!A.heapOK([600, 600, 600]).ok, '超过 500MB → 不通过');
ok(near(A.heapTrend([1, 2, 3, 4]).slope, 1) && A.heapTrend([5]).slope === 0, 'heapTrend 斜率');

/* ---- 读屏播报 ---- */
{ const order = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'], ti = { T1: '膨胀', T2: '核合成', T3: '原子', T4: '成团', T5: '点燃', T6: '时间', T7: '恒星系' };
  const allOk = Object.fromEntries(order.map((t) => [t, 'ok']));
  ok(A.stageAnnounce(allOk, order, ti, 'zh') === '时间线:7 关通过 7 关。', '全过播报(中)');
  const f = { ...allOk, T4: 'fail', T5: 'fail', T6: 'fail', T7: 'fail' };
  ok(A.stageAnnounce(f, order, ti, 'zh').includes('卡在第 4 关「成团」'), '失败播报卡在哪关');
  const tiEn = { T1: 'Expand', T2: 'Nuclei', T3: 'Atoms', T4: 'Clumps', T5: 'Ignition', T6: 'Time', T7: 'System' };
  const en = A.stageAnnounce({ ...allOk, T6: 'warn' }, order, tiEn, 'en'); ok(en === 'Timeline: 7 of 7 stages passed. Stage 6, Time, is shaky.' && !A.hasCJK(en), '勉强播报(英)');
  ok(A.stageLabel(2, '原子', 'ok') === '第 3 关 原子:通过' && A.stageLabel(0, 'Expand', 'fail', 'en') === 'Stage 1 Expand: failed', 'stageLabel');
  ok(A.stageLabel(0, 'x', 'weird', 'en').endsWith('not shown'), '未知状态 = 未揭示');
  ok(!A.hasCJK(A.outcomeAnnounce('It made it to planets', 3, 1, 'en')) && A.outcomeAnnounce('走到了', 3, 1).includes('行星 3 颗'), '结局播报'); }

console.log(`access.test: ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
