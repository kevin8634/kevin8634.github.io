/* 宙律 3.0 · 探索层纯函数(3-4)
 * 刻度映射(对数 / 线性 / 对称对数)、真实值吸附、旋钮角度、锁定 + 随机、题卡数据与判定、种子翻牌序列、Ω₀ 液位。
 * 全部纯函数,node 可测,不碰 DOM。物理全在 universe.js(RANGE 见其 L37),本层不改模型。 */

/* ---------- 刻度 ---------- */
export const RANGE = { kG: [0.01, 100], kc: [0.01, 100], kA: [0.05, 20], eps: [0.004, 0.010], Q: [1e-7, 1e-3], kL: [-10, 1000], Om: [0.01, 5] };
export const REALV = { kG: 1, kc: 1, kA: 1, eps: 0.007, Q: 1e-5, kL: 1, Om: 0.315 };
export const SCALE = { kG: 'log', kc: 'log', kA: 'log', eps: 'lin', Q: 'log', kL: 'symlog', Om: 'log' };
export const KEYS = ['kG', 'kc', 'kA', 'eps', 'Q', 'kL', 'Om'];
export const BASIC = ['kG', 'kc', 'kA'];
export const ADV = ['eps', 'Q', 'kL', 'Om'];
export const LOCKABLE = [...KEYS, 'seed'];
const SYM = 1;                                   // 对称对数的线性区宽度:|Λ| ≲ 1 近似线性,之外按对数
const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
/* 值 → [0,1] */
export function toT(key, v) {
  const [lo, hi] = RANGE[key], s = SCALE[key];
  v = clamp(+v, lo, hi);
  let t;
  if (s === 'log') t = Math.log(v / lo) / Math.log(hi / lo);
  else if (s === 'symlog') t = (Math.asinh(v / SYM) - Math.asinh(lo / SYM)) / (Math.asinh(hi / SYM) - Math.asinh(lo / SYM));
  else t = (v - lo) / (hi - lo);
  return clamp(t, 0, 1);
}
/* [0,1] → 值 */
export function fromT(key, t) {
  const [lo, hi] = RANGE[key], s = SCALE[key];
  t = clamp(t, 0, 1);
  if (s === 'log') return lo * Math.pow(hi / lo, t);
  if (s === 'symlog') { const a = Math.asinh(lo / SYM), b = Math.asinh(hi / SYM); return SYM * Math.sinh(a + t * (b - a)); }
  return lo + t * (hi - lo);
}
/* 吸附:真实值(及 Λ=0)附近吸过去;对数量 ±4%,ε 与 Λ 用绝对距离 */
export function snapReal(key, v) {
  if (key === 'kL') { if (Math.abs(v - 1) <= 0.05) return 1; if (Math.abs(v) <= 0.05) return 0; return v; }
  if (key === 'eps') return Math.abs(v - 0.007) <= 0.00005 ? 0.007 : v;
  const r = REALV[key];
  return v > 0 && Math.abs(Math.log(v / r)) <= Math.log(1.04) ? r : v;
}
/* 刻度标签(旋钮/滑块上显示) */
export function fmt(key, v) {
  if (key === 'eps') return v.toFixed(4);
  if (key === 'Q') { const e = Math.floor(Math.log10(v)), m = v / Math.pow(10, e); return (Math.abs(m - 1) < 0.005 ? '' : m.toFixed(m < 9.95 ? 1 : 0) + '×') + '10' + sup(e); }
  if (key === 'kL') return '×' + (v === 0 ? '0' : Math.abs(v) >= 100 ? Math.round(v) : +v.toPrecision(2));
  if (key === 'Om') return (+v.toPrecision(v < 0.1 ? 2 : 3)).toString();
  return '×' + (+v.toPrecision(v < 0.1 ? 2 : 3));
}
const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
export const sup = (n) => String(n).split('').map((c) => SUP[c] || c).join('');

/* ---------- 旋钮(Comet Dial)角度:顺时针自正上方计,-135° … +135° ---------- */
export const DIAL = { a0: -135, a1: 135 };
export const tToAngle = (t) => DIAL.a0 + clamp(t, 0, 1) * (DIAL.a1 - DIAL.a0);
/* 指针相对圆心的位移 (dx, dy;屏幕坐标 y 向下)→ t;落在底部缺口时贴向近端 */
export function pointToT(dx, dy) {
  const a = Math.atan2(dx, -dy) * 180 / Math.PI;     // -180..180,0 = 正上方
  if (a > DIAL.a1) return 1; if (a < DIAL.a0) return 0;
  return (a - DIAL.a0) / (DIAL.a1 - DIAL.a0);
}
/* 刻度环:n 格,点亮到 t;返回每格 {a, lit, head} */
export function ticks(t, n = 36) {
  const out = [], k = Math.round(clamp(t, 0, 1) * (n - 1));
  for (let i = 0; i < n; i++) out.push({ a: tToAngle(i / (n - 1)), lit: i <= k, head: i === k });
  return out;
}

/* ---------- 锁定 + 随机 ---------- */
/* 随机宇宙:每个未锁常数在「真实位置 ± spread(默认 0.15,约三成走通)」(刻度空间)内取值;种子未锁则换新。rnd 为 [0,1) 函数。 */
export function randomRecipe(cur, locked, rnd, spread = 0.15) {
  const o = { ...cur }, L = lockSet(locked);
  for (const k of KEYS) {
    if (L.has(k)) continue;
    const t0 = toT(k, REALV[k]);
    o[k] = snapReal(k, fromT(k, t0 + (rnd() * 2 - 1) * spread));
  }
  if (!L.has('seed')) o.seed = Math.floor(rnd() * 4294967296) >>> 0;
  return o;
}
/* 题卡载入:真实宇宙 + 卡片改动;锁定的常数保持当前值 */
export function applyCard(cur, card, locked) {
  const L = lockSet(locked), o = { ...cur };
  for (const k of KEYS) if (!L.has(k)) o[k] = k in card.recipe ? card.recipe[k] : REALV[k];
  if (!L.has('alphaLinked')) o.alphaLinked = 'alphaLinked' in card.recipe ? card.recipe.alphaLinked : true;
  if ('seed' in card.recipe && !L.has('seed')) o.seed = card.recipe.seed;
  return o;
}
/* 卡片里哪些常数因锁定没被载入(给界面提示) */
export const blockedBy = (card, locked) => Object.keys(card.recipe).filter((k) => lockSet(locked).has(k));
const lockSet = (l) => (l instanceof Set ? l : new Set(Array.isArray(l) ? l : Object.keys(l || {}).filter((k) => l[k])));
/* 锁定集合 ↔ 存储字符串 */
export const lockToStr = (l) => [...lockSet(l)].filter((k) => LOCKABLE.includes(k)).sort().join(',');
export const strToLock = (s) => new Set(String(s || '').split(',').filter((k) => LOCKABLE.includes(k)));

/* ---------- 种子翻牌(Split Flap)---------- */
export const FLAP = '0123456789';
export const seedText = (seed) => String(seed >>> 0).padStart(10, '0');
/* 每位从 a 翻到 b 需要几步(只往前翻,绕一圈) */
export function flapSteps(a, b, cs = FLAP) {
  return b.split('').map((ch, i) => { const x = cs.indexOf(a[i] || cs[0]), y = cs.indexOf(ch); return x < 0 || y < 0 ? 0 : (y - x + cs.length) % cs.length; });
}
/* 第 i 位在第 f 帧显示的字符(stagger 帧错开) */
export function flapFrame(a, b, f, stagger = 1, cs = FLAP) {
  const st = flapSteps(a, b, cs);
  return b.split('').map((ch, i) => { const k = clamp(f - i * stagger, 0, st[i]); return cs[(cs.indexOf(a[i] || cs[0]) + k) % cs.length]; }).join('');
}
export const flapFrames = (a, b, stagger = 1, cs = FLAP) => Math.max(0, ...flapSteps(a, b, cs).map((s, i) => s + i * stagger));

/* ---------- Ω₀ 液位(Slosh Gauge):0–2 线性,临界密度 1 在正中 ---------- */
export const GAUGE_MAX = 2;
export function gauge(om) {
  const level = clamp(om / GAUGE_MAX, 0, 1);
  return { level, line: 1 / GAUGE_MAX, over: om > GAUGE_MAX, side: Math.abs(om - 1) < 0.02 ? 'flat' : om > 1 ? 'closed' : 'open' };
}

/* ---------- 题卡(Stack + Flip Card):正面题目,背面答案配方;goal 由单测逐张核对 ---------- */
export const CARDS = [
  { id: 'fog', recipe: { Q: 1e-7 }, goal: { fail: 'cold' },
    q: { zh: '造一片冷雾:物质永远聚不成团。', en: 'Make a cold fog: matter never clumps.' },
    a: { zh: '把初始涟漪 Q 拧到 10⁻⁷。起伏太平,引力找不到抓手,第 4 关卡住。', en: 'Turn ripples Q down to 10⁻⁷. Too smooth: gravity has nothing to grab, stuck at stage 4.' } },
  { id: 'bh', recipe: { Q: 1e-3 }, goal: { fail: 'bh_soup' },
    q: { zh: '造一锅黑洞汤。', en: 'Cook a black-hole soup.' },
    a: { zh: 'Q 拧到 10⁻³(真实的 100 倍)。涟漪太深,物质直接塌成黑洞。', en: 'Q up to 10⁻³ (100× real). Ripples so deep matter collapses straight into black holes.' } },
  { id: 'neg', recipe: { kL: -5 }, goal: { fate: 'crunch' },
    q: { zh: '只动暗能量,让宇宙最后塌回去。', en: 'Touch only dark energy and make the universe fall back.' },
    a: { zh: '把 Λ 拧成负数(×−5)。负的暗能量也往回拉,膨胀终会掉头。', en: 'Make Λ negative (×−5). Negative dark energy pulls too, so expansion turns around.' } },
  { id: 'rip', recipe: { kL: 1000 }, goal: { fail: 'cold' },
    q: { zh: '暗能量开到最大,会怎样?', en: 'What if dark energy is maxed out?' },
    a: { zh: 'Λ ×1000:空间膨胀得太快,物质还没成团就被扯散,同样是冷雾。', en: 'Λ ×1000: space expands so fast matter is pulled apart before it clumps, another cold fog.' } },
  { id: 'coast', recipe: { kL: 0 }, goal: { fate: 'coast' },
    q: { zh: '没有暗能量的宇宙还能走通吗?', en: 'Can a universe without dark energy still make it?' },
    a: { zh: 'Λ = 0 也能走通:膨胀越来越慢但不回头(滑行),行星照样长出来。', en: 'Yes with Λ = 0: expansion slows but never turns back (coasting), planets still form.' } },
  { id: 'dense', recipe: { Om: 5 }, goal: { fail: 'crunch' },
    q: { zh: '不动 G,只靠物质让宇宙塌缩。', en: 'Leave G alone; crush the universe with matter alone.' },
    a: { zh: 'Ω₀ 拧到 5(远超临界密度 1)。物质的拉力赢过暗能量,第 1 关就回缩。', en: 'Ω₀ up to 5 (far above critical density 1). Matter outpulls dark energy, collapse at stage 1.' } },
  { id: 'save', recipe: { kG: 3, Om: 0.105 }, goal: { fateNot: 'crunch', fail: 'flash' },
    q: { zh: 'G ×3 会让宇宙回缩。不碰 G,能救回第 1 关吗?', en: 'G ×3 makes the universe recollapse. Without touching G, can you save stage 1?' },
    a: { zh: '把 Ω₀ 降到 0.105(= 0.315÷3),有效物质密度回到真实值,不再回缩。但恒星仍烧得太猛,卡在第 6 关。', en: 'Lower Ω₀ to 0.105 (0.315÷3): effective matter density is back to real, no collapse. Stars still burn too fast, stuck at stage 6.' } },
  { id: 'he', recipe: { eps: 0.010 }, goal: { fail: 'helium_only' },
    q: { zh: '让最初三分钟把氢全烧光。', en: 'Burn all the hydrogen in the first three minutes.' },
    a: { zh: '核效率 ε 拧到 0.010。质子全焊进氦,恒星没有燃料。', en: 'Nuclear efficiency ε up to 0.010. Every proton ends up in helium, no star fuel.' } },
  { id: 'h', recipe: { eps: 0.0055 }, goal: { warn: 'hydrogen_only', fail: 'no_ignition' },
    q: { zh: '让核合成第一步就停住。', en: 'Stop nucleosynthesis at its first step.' },
    a: { zh: 'ε 拧到 0.0055。氘核粘不住,宇宙几乎只剩氢;恒星里的聚变也要先造氘,于是点不着火,卡在第 5 关。', en: 'ε down to 0.0055. Deuterium cannot hold, so the universe is nearly all hydrogen; fusion in stars also starts with deuterium, so nothing ignites: stuck at stage 5.' } },
  { id: 'seed', recipe: { seed: 7 }, goal: { status: 'ok', planetsNot: 4 },
    q: { zh: '常数全不动,恒星系能变样吗?', en: 'Keep every constant; can the star system still change?' },
    a: { zh: '换种子(试试 7)。物理不变,行星的数目与位置换一套:同样的规律,不同的偶然。', en: 'Change the seed (try 7). Same physics, a different set of planets: same laws, different chance.' } }
];
/* 判定一张题卡的答案是否达成目标 */
export function checkGoal(res, g) {
  if (g.fail && !res.failures.includes(g.fail)) return false;
  if (g.warn && !res.warnings.includes(g.warn)) return false;
  if (g.fate && res.cosmos.fate !== g.fate) return false;
  if (g.fateNot && res.cosmos.fate === g.fateNot) return false;
  if (g.status && res.status !== g.status) return false;
  if (g.planetsNot != null && res.planets.length === g.planetsNot) return false;
  return true;
}
/* Stack:把顶牌移到底 / 底牌移到顶 */
export const cycle = (order, dir = 1) => (dir > 0 ? [...order.slice(1), order[0]] : [order[order.length - 1], ...order.slice(0, -1)]);
