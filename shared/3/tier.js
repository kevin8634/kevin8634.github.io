/* 创世计划 3.0 · 画质分档 /shared/3/tier.js v0.1(标准 §2.3;规则与门户 portal3/p3tier.js 一致,供各世界 3.0 共用)
 * 优先级:?q=high|medium|low(兼容 ?p3q=)> localStorage gn:p3q(用户手动,全站共用)> 自动。
 * 自动:软件渲染(swiftshader/llvmpipe/software/basic render)或无 WebGL2 → low;其余 GPU → medium;high 只能手动。
 * FpsGuard:连续 <24fps 自动降一档并回调(不写回 localStorage)。
 * 档位写到 <html class="gn3-q-high|medium|low">,tokens.css 的 low 档样式据此生效。 */
export const TIERS = ['high', 'medium', 'low'];
export const KEY = 'gn:p3q';
export const SLOW = typeof location !== 'undefined' && /[?&]p3slow=1\b/.test(location.search);

export function override() {
  try {
    const m = /[?&](?:q|p3q)=(high|medium|low)\b/.exec(location.search);
    if (m) return m[1];
    const ls = localStorage.getItem(KEY);
    if (TIERS.includes(ls)) return ls;
  } catch (e) {}
  return null;
}

export function gpuName(gl) {
  let own = false;
  try {
    if (!gl) { gl = document.createElement('canvas').getContext('webgl2'); own = true; }
    if (!gl) return 'no-webgl2';
    const x = gl.getExtension('WEBGL_debug_renderer_info');
    const n = String((x ? gl.getParameter(x.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)) || '');
    if (own) { const lc = gl.getExtension('WEBGL_lose_context'); if (lc) lc.loseContext(); }
    return n;
  } catch (e) { return ''; }
}
export const isSoftware = (name) => name === 'no-webgl2' || /swiftshader|llvmpipe|software|basic render/i.test(name);

/* 返回 {tier, forced, gpu, software};软件渲染即使手动选了 high 也强制 low(标准:软件渲染强制 low) */
export function pickTier(gl) {
  const gpu = gpuName(gl), sw = isSoftware(gpu), o = override();
  if (sw) return { tier: 'low', forced: !!o, gpu, software: true };
  if (o) return { tier: o, forced: true, gpu, software: false };
  return { tier: 'medium', forced: false, gpu, software: false };
}
export function apply(tier) {
  const h = document.documentElement;
  TIERS.forEach((t) => h.classList.toggle('gn3-q-' + t, t === tier));
  h.dataset.gn3q = tier;
}
export function save(t) { try { localStorage.setItem(KEY, t); } catch (e) {} }
export function lower(t) { return t === 'high' ? 'medium' : 'low'; }

/* 帧率守卫:每帧调用 tick(now);窗口 2 秒、平均 <minFps 则降档一次,冷却 4 秒 */
export class FpsGuard {
  constructor(tier, onDrop, { minFps = 24, windowMs = 2000, cooldownMs = 4000 } = {}) {
    Object.assign(this, { tier, onDrop, minFps, windowMs, cooldownMs, t0: 0, n: 0, last: 0, cool: 0, fps: 60 });
  }
  tick(now) {
    if (!this.t0) { this.t0 = now; this.last = now; return; }
    const dt = SLOW ? 1000 / 12 : now - this.last; this.last = now;
    if (dt > 500) { this.t0 = now; this.n = 0; return; }   // 切后台回来,不算
    this.n++;
    const span = SLOW ? this.n * dt : now - this.t0;
    if (span >= this.windowMs) {
      this.fps = this.n * 1000 / span;
      this.t0 = now; this.n = 0;
      if (this.fps < this.minFps && this.tier !== 'low' && now > this.cool) {
        this.tier = lower(this.tier); this.cool = now + this.cooldownMs;
        this.onDrop && this.onDrop(this.tier, this.fps);
      }
    }
  }
}
