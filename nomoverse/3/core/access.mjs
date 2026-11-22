/* 宙律 3.0 · 画质与可达性纯函数(3-6,α7)—— 不碰 DOM / three,node 可测。
 *   QBUDGET / budgetFor / effectiveTier / gpgpuSide   三档画质预算(粒子数、像素比、后期)与软件渲染强制 low
 *   FlashGate / lumFollow / pulseEnv / clampLum       亮度上限与防闪:大幅亮度跳变 ≤3 次/秒,包络平滑,峰值钳制
 *   motionReduced / MOTION                            减少动态:跟随系统 / 减少 / 完整
 *   swipeDismiss / toastQueue                         Swipe Toast 逻辑(滑动关闭阈值、去重、上限)
 *   tipPlace / longPressMs                            Warm Tooltip 定位(不出视口)
 *   hitOK / smallTargets                              触控目标 ≥44px
 *   layoutFor                                         横竖屏四档布局判定(与 nv3.css 断点一致)
 *   hasCJK / missingEn / cjkLeft                      英文全量检查
 *   heapTrend / heapOK                                切档内存:不持续增长、总量 ≤500MB
 *   stageAnnounce / outcomeAnnounce                   读屏播报文本(时间线关卡结果、结局) */

/* ---------- 画质三档 ---------- */
export const TIERS = ['low', 'medium', 'high'];
/* 粒子数与 /shared/3/tier.js BUDGET 一致(方案 §5.2:64k/16k/4k);post = 后期管线 */
export const QBUDGET = {
  low:    { particles: 4096,  dpr: 1,   gpgpu: false, post: false, glow: 0,    samples: 0, glass: 'phong',    nebula: 5, aa: false, label: { zh: '低', en: 'Low' } },
  medium: { particles: 16384, dpr: 1.5, gpgpu: true,  post: true,  glow: 0,    samples: 2, glass: 'physical', nebula: 9, aa: true,  label: { zh: '中', en: 'Mid' } },
  high:   { particles: 65536, dpr: 2,   gpgpu: true,  post: true,  glow: 0.55, samples: 4, glass: 'physical', nebula: 9, aa: true,  label: { zh: '高', en: 'High' } }
};
/* 后期说明(给界面与读屏):low 不开后期;medium = HDR 渲染目标(2×MSAA)+ 亮度上限钳制 + 暗角;high 再加 1/4 分辨率柔光(bright-pass + 两次模糊)与 4× MSAA */
export const POST_NOTE = {
  low: { zh: '静态点云星空 · 像素比 1 · 无后期', en: 'Static point stars · pixel ratio 1 · no post' },
  medium: { zh: 'GPGPU 星空 1.6 万 · 像素比 ≤1.5 · 亮度钳制 + 暗角', en: 'GPGPU stars 16k · pixel ratio ≤1.5 · luminance clamp + vignette' },
  high: { zh: 'GPGPU 星空 6.5 万 · 像素比 ≤2 · 柔光 + 4×MSAA + 亮度钳制', en: 'GPGPU stars 65k · pixel ratio ≤2 · soft glow + 4×MSAA + luminance clamp' }
};
export function effectiveTier(t, software) { if (!TIERS.includes(t)) t = 'medium'; return software ? 'low' : t; }
/* 实际预算:手机像素比再封顶 1.5;无浮点渲染目标时关 GPGPU(退普通点云) */
export function budgetFor(t, { mobile = false, floatRT = true } = {}) {
  const b = { ...(QBUDGET[t] || QBUDGET.low) };
  b.tier = QBUDGET[t] ? t : 'low';
  if (mobile) b.dpr = Math.min(b.dpr, 1.5);
  if (!floatRT) b.gpgpu = false;
  return b;
}
/* GPGPU 数据纹理边长:≥√n 的 2 的幂(4096→64、16384→128、65536→256) */
export function gpgpuSide(n) { let s = 1; while (s * s < n) s <<= 1; return s; }

/* ---------- 亮度上限与防闪 ---------- */
export const LUM_MAX = 2.4;          // 后期钳制:进 AgX 前的线性亮度上限
export const GLOW_MAX = 0.85;        // 与 tokens.css --gn3-glow-max 一致
export const FLASH_HZ = 3;           // WCAG 2.3.1:每秒闪烁 ≤3 次
export const clampLum = (v, max = LUM_MAX) => (v > max ? max : v < 0 ? 0 : v);
/* 闸门:相对亮度跳变 ≥ jump 视为一次「闪」;两次闪之间至少 1000/hz ms,期间新目标先挂起,到点再放行(只放最新的) */
export class FlashGate {
  constructor({ hz = FLASH_HZ, jump = 0.1 } = {}) { this.gap = 1000 / hz; this.jump = jump; this.shown = null; this.lastFlash = -Infinity; this.pending = null; this.flashes = []; }
  push(t, v) {
    if (this.shown === null) { this.shown = v; return v; }
    if (Math.abs(v - this.shown) < this.jump) { this.shown = v; this.pending = null; return v; }
    if (t - this.lastFlash >= this.gap) { this.shown = v; this.lastFlash = t; this.pending = null; this.flashes.push(t); if (this.flashes.length > 64) this.flashes.shift(); return v; }
    this.pending = v; return this.shown;
  }
  /* 帧里调用:挂起的目标到点放行 */
  tick(t) { if (this.pending !== null && t - this.lastFlash >= this.gap) { const v = this.pending; this.pending = null; return this.push(t, v); } return this.shown; }
  wait(t) { return this.pending === null ? 0 : Math.max(0, this.gap - (t - this.lastFlash)); }
}
/* 任意 1 秒窗口内的闪烁次数最大值 */
export function maxFlashRate(times) { let m = 0; for (let i = 0; i < times.length; i++) { let n = 0; for (let j = i; j < times.length && times[j] - times[i] < 1000; j++) n++; m = Math.max(m, n); } return m; }
/* 一阶跟随(指数平滑):tau 秒;reduced 时直接到位 */
export function lumFollow(cur, target, dt, tau = 0.12, reduced = false) { if (reduced || tau <= 0) return target; return cur + (target - cur) * (1 - Math.exp(-dt / tau)); }
/* 单次脉冲包络 0→1→0(半正弦),时长 ms;峰值 ≤ peak */
export function pulseEnv(elapsed, ms = 900, peak = 1) { if (elapsed <= 0 || elapsed >= ms) return 0; return Math.min(peak, Math.sin(Math.PI * elapsed / ms) * peak); }

/* ---------- 减少动态 ---------- */
export const MOTION = ['auto', 'reduce', 'full'];
export function motionReduced(setting, systemReduce) { return setting === 'reduce' || (setting !== 'full' && !!systemReduce); }

/* ---------- Swipe Toast ---------- */
/* 横向拖过宽度 35% 或速度 >0.6 px/ms 关闭;竖向为主的拖动不算 */
export function swipeDismiss(dx, dy, w, vx = 0) { if (Math.abs(dy) > Math.abs(dx)) return false; return Math.abs(dx) > 0.35 * w || (Math.abs(vx) > 0.6 && Math.abs(dx) > 24); }
/* 队列:同 key 合并为最新,最多 max 条(挤掉最旧的) */
export function toastQueue(list, item, max = 3) {
  const out = list.filter((x) => x.key !== item.key); out.push(item);
  while (out.length > max) out.shift();
  return out;
}

/* ---------- Warm Tooltip 定位:优先上方,放不下翻到下方;水平夹在视口内(留 8px) ---------- */
export const longPressMs = 480;
export function tipPlace(r, tw, th, vw, vh, gap = 8, pad = 8) {
  let side = 'top', y = r.top - gap - th;
  if (y < pad) { side = 'bottom'; y = r.bottom + gap; }
  if (y + th > vh - pad) y = Math.max(pad, vh - pad - th);
  let x = r.left + r.width / 2 - tw / 2;
  x = Math.min(Math.max(pad, x), Math.max(pad, vw - pad - tw));
  return { x: Math.round(x), y: Math.round(y), side, arrow: Math.round(Math.min(Math.max(10, r.left + r.width / 2 - x), tw - 10)) };
}

/* ---------- 触控目标 ---------- */
export const HIT = 44;
export const hitOK = (r, min = HIT) => r.width >= min - 0.5 && r.height >= min - 0.5;
export function smallTargets(list, min = HIT) { return list.filter((x) => x.width > 0 && x.height > 0 && !hitOK(x, min)); }

/* ---------- 布局(与 nv3.css 断点一致) ---------- */
export function layoutFor(w, h) {
  if (w <= 760 && h >= w) return 'portrait';
  if (h <= 480 && w > h) return 'short';
  if (w <= 1100) return 'mid';
  return 'desk';
}

/* ---------- 英文全量 ---------- */
export const hasCJK = (s) => /[\u3400-\u9fff\uf900-\ufaff\u3000-\u303f\uff01-\uff60]/.test(String(s || ''));
/* 字典里缺英文或英文里混中文的词条 */
export function missingEn(dict) { return Object.keys(dict).filter((k) => { const e = dict[k]; return !e || typeof e.en !== 'string' || hasCJK(e.en) || ('zhMore' in e && (!e.enMore || hasCJK(e.enMore))); }); }
/* 文本列表里残留中文的(allow 为数据名称白名单) */
export function cjkLeft(texts, allow = []) { return texts.filter((t) => hasCJK(t) && !allow.some((a) => String(t).includes(a))); }

/* ---------- 内存 ---------- */
/* 最小二乘斜率(每次切档 MB)与首末差;samples 为 MB */
export function heapTrend(s) {
  const n = s.length; if (n < 2) return { slope: 0, growth: 0, max: s[0] || 0 };
  let sx = 0, sy = 0, sxy = 0, sxx = 0;
  s.forEach((y, x) => { sx += x; sy += y; sxy += x * y; sxx += x * x; });
  const slope = (n * sxy - sx * sy) / (n * sxx - sx * sx);
  return { slope, growth: s[n - 1] - s[0], max: Math.max(...s) };
}
/* 不持续增长:斜率 < tolSlope MB/次,且后半段均值不比前半段高 tolMB 以上;总量 ≤ maxMB */
export function heapOK(s, { maxMB = 500, tolSlope = 0.5, tolMB = 3 } = {}) {
  const tr = heapTrend(s), h = Math.floor(s.length / 2);
  const avg = (a) => a.reduce((x, y) => x + y, 0) / (a.length || 1);
  const rise = avg(s.slice(h)) - avg(s.slice(0, h));
  return { ok: tr.max <= maxMB && tr.slope < tolSlope && rise < tolMB, ...tr, rise };
}

/* ---------- 读屏播报 ---------- */
const ST = { ok: { zh: '通过', en: 'passed' }, warn: { zh: '勉强', en: 'shaky' }, fail: { zh: '失败', en: 'failed' }, todo: { zh: '未揭示', en: 'not shown' } };
export const stateWord = (s, lang = 'zh') => (ST[s] || ST.todo)[lang === 'en' ? 'en' : 'zh'];
/* 单关:「第 3 关 原子:通过」 */
export function stageLabel(i, title, state, lang = 'zh') { return lang === 'en' ? `Stage ${i + 1} ${title}: ${stateWord(state, 'en')}` : `第 ${i + 1} 关 ${title}:${stateWord(state, 'zh')}`; }
/* 一次大爆炸后的总结:通过数 + 卡在哪关 */
export function stageAnnounce(stages, order, titles, lang = 'zh') {
  const en = lang === 'en', n = order.filter((t) => stages[t] === 'ok' || stages[t] === 'warn').length;
  const fi = order.findIndex((t) => stages[t] === 'fail'), wi = order.findIndex((t) => stages[t] === 'warn');
  let s = en ? `Timeline: ${n} of ${order.length} stages passed.` : `时间线:${order.length} 关通过 ${n} 关。`;
  if (fi >= 0) s += en ? ` Stuck at stage ${fi + 1}, ${titles[order[fi]]}.` : `卡在第 ${fi + 1} 关「${titles[order[fi]]}」。`;
  else if (wi >= 0) s += en ? ` Stage ${wi + 1}, ${titles[order[wi]]}, is shaky.` : `第 ${wi + 1} 关「${titles[order[wi]]}」有点勉强。`;
  return s;
}
export function outcomeAnnounce(statusText, planets, hab, lang = 'zh') {
  return lang === 'en' ? `Outcome: ${statusText}. Planets ${planets}, in habitable zone ${hab}.` : `结局:${statusText}。行星 ${planets} 颗,宜居带 ${hab} 颗。`;
}
