/* 宙律 Nomoverse · 首页 3.0 化(3-8 α8)纯逻辑:首页 i18n 补充词条、向导台词、打字帧、列表错峰、静态化判定。
 * 无 DOM 依赖,Node 可测(3/tests/home.test.mjs)。界面组件在 home-ui.mjs。 */

export const hasCJK = (s) => /[\u3400-\u9fff\uf900-\ufaff\u3000-\u303f\uff01-\uff60]/.test(String(s || ''));

/* 首页 3.0 新增 / 2.0 首页漏译的词条(中 → 英),交给 window.NV_I18N.add;以「@」开头的是 aria-label/title 专用 */
export const HOME_EN = {
  '3.0 · 改宇宙': '3.0 · Change the universe',
  '宇宙配方台:拧动宇宙的常数,看它能不能走到有行星的那一天。': 'Universe Recipe Bench: turn the constants of the universe and see whether it makes it to planets.',
  '宇宙配方台': 'Universe Recipe Bench',
  '@进入宙律 3.0 · 改宇宙(宇宙配方台)': 'Enter Nomoverse 3.0 · Change the universe (Universe Recipe Bench)',
  '尺度': 'Scale',
  '@尺度(10 的幂,米)': 'Scale (power of 10, metres)',
  '@缩小一个数量级': 'Zoom out one order of magnitude', '@放大一个数量级': 'Zoom in one order of magnitude',
  '@星点信息': 'Star details', '@关闭星点信息': 'Close star details',
  '拖动 / 滚轮 / ← → 飞行 · 点星查看': 'Drag / scroll / ← → to fly · tap a star',
  '@向导 夸克「阿夸」': 'Guide Quark “Aqua”', '阿夸 · 向导': 'Aqua · Guide',
  '@点一下换一句向导提示': 'Tap for the next guide tip',
  '物理 · 亲手改写宇宙的规律': 'Physics · Rewrite the laws of the universe yourself',
  '前沿速递': 'Frontier brief', '@前沿速递': 'Frontier brief',
  '再去玩一次 →': 'Play it again →', '去点亮 →': 'Go light it →',
  '待探索。这颗星会在后续任务中开放。': 'Unexplored. This star opens in a later quest.',
  '简化表述,供科普探究': 'Simplified wording, for science exploration',
  '本期可点亮': 'Can be lit now'
};

/* 向导「阿夸」台词(Text Type 逐字打出;点气泡换下一句) */
export const GTIPS = {
  zh: [
    '从质子到银河系,每往右一格就放大 10 倍。你自己在哪个尺度?',
    '地球把脚下的时空网格压出了一个坑。引力再大一点,坑会更深吗?',
    '看到地球发出的涟漪了吗?那是引力波的示意。它跑得有多快?',
    '点一颗亮着的知识星看看。哪颗星离你最近?',
    '想亲手改宇宙的常数?点「3.0 · 改宇宙」,让宇宙从大爆炸重新走一遍。'
  ],
  en: [
    'From protons to the Milky Way, each step right is 10× bigger. Which scale are you?',
    'Earth presses a dip into the spacetime grid. With stronger gravity, would the dip get deeper?',
    'See the ripples coming off Earth? They sketch gravitational waves. How fast do they travel?',
    'Tap a lit knowledge star. Which star is closest to you?',
    'Want to change the constants yourself? Tap “3.0 · Change the universe” and replay the Big Bang.'
  ]
};
export const tips = (lang) => GTIPS[lang === 'en' ? 'en' : 'zh'];
export const tipNext = (i, n) => (n > 0 ? ((i % n) + n + 1) % n : 0);

/* Text Type 帧:先把旧句删到公共前缀,再逐字打出新句;按码点切分(不拆 emoji/扩展区汉字) */
export function typeFrames(prev, next, { maxDelete = 24 } = {}) {
  const a = Array.from(String(prev || '')), b = Array.from(String(next || ''));
  let k = 0; while (k < a.length && k < b.length && a[k] === b[k]) k++;
  const out = [];
  const del = a.length - k;
  if (del > 0) {
    // 删得多时按步长整段删(最多 maxDelete 帧),保持节奏
    const stepN = Math.max(1, Math.ceil(del / maxDelete));
    for (let n = a.length - stepN; n > k; n -= stepN) out.push(a.slice(0, n).join(''));
    out.push(a.slice(0, k).join(''));
  }
  for (let n = k + 1; n <= b.length; n++) out.push(b.slice(0, n).join(''));
  if (!out.length || out[out.length - 1] !== b.join('')) out.push(b.join(''));
  return out;
}
/* 每帧间隔:标点后稍停,删字更快 */
export function frameDelay(frame, prevFrame, speed = 38) {
  if (frame.length < prevFrame.length) return Math.round(speed * 0.45);
  const ch = Array.from(frame).pop() || '';
  return /[,。?!;:,.?!;:]/.test(ch) ? speed * 5 : speed;
}

/* Animated List 错峰:第 i 项延迟(ms),封顶避免长列表等太久 */
export const staggerDelay = (i, step = 55, cap = 8) => Math.min(Math.max(0, i | 0), cap) * step;
/* 列表键盘:当前 i,按键 → 新序号(到头停住;Home/End 跳端) */
export function listKey(i, key, n) {
  if (n <= 0) return -1;
  if (key === 'ArrowDown' || key === 'ArrowRight') return Math.min(n - 1, i + 1);
  if (key === 'ArrowUp' || key === 'ArrowLeft') return Math.max(0, i - 1);
  if (key === 'Home') return 0;
  if (key === 'End') return n - 1;
  return i;
}

/* 动画静态化:减少动态,或画质为低(含 3D 不可用回 2D) */
export const staticFx = ({ reduced = false, tier = 'mid' } = {}) => !!reduced || tier === 'low';

/* 尺度读数:e(10 的幂)→ 显示文本 */
const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
export const sup = (n) => String(n).split('').map((c) => SUP[c] || c).join('');
export const scaleText = (e) => '10' + sup(Math.round(e)) + ' m';
export function scaleAria(e, lang, near) {
  const r = Math.round(e);
  return lang === 'en' ? `About 10 to the ${r} metres${near ? ', the scale of ' + near : ''}` : `约 10 的 ${r} 次方米${near ? ',' + near + '的尺度' : ''}`;
}

/* 词典自检:英文值不得含中文、键不得为空 */
export const missingEn = (dict) => Object.keys(dict).filter((k) => !k || typeof dict[k] !== 'string' || !dict[k] || hasCJK(dict[k]));
