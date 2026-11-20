/* 创世计划 3.0 · 确定性工具 /shared/3/prng.js v0.1(标准 §1.3:同种子同结果)
 * 纯函数,无 DOM,可在 Worker 与 node 单测里用。 */

/* 字符串或数字 → 32 位种子 */
export function seedOf(x) {
  if (typeof x === 'number' && Number.isFinite(x)) return x >>> 0;
  let h = 2166136261 >>> 0;
  const s = String(x);
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/* mulberry32:快,够用;返回 [0,1) */
export function mulberry32(seed) {
  let a = seedOf(seed);
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* sfc32:周期更长,适合大量粒子 */
export function sfc32(seed) {
  const r = mulberry32(seed);
  let a = (r() * 4294967296) >>> 0, b = (r() * 4294967296) >>> 0, c = (r() * 4294967296) >>> 0, d = 1;
  return function () {
    a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0;
    let t = (a + b) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    d = (d + 1) | 0;
    t = (t + d) | 0;
    c = (c + t) | 0;
    return (t >>> 0) / 4294967296;
  };
}

/* 便捷:区间、整数、正态 */
export function range(rng, lo, hi) { return lo + (hi - lo) * rng(); }
export function int(rng, lo, hi) { return lo + Math.floor((hi - lo + 1) * rng()); }
export function normal(rng) {
  let u = 0, v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/* RK4 固定步长:f(t, y[]) → dy[];y 为数组,返回新数组 */
export function rk4(f, t, y, h) {
  const n = y.length, tmp = new Array(n);
  const k1 = f(t, y);
  for (let i = 0; i < n; i++) tmp[i] = y[i] + h * k1[i] / 2;
  const k2 = f(t + h / 2, tmp);
  for (let i = 0; i < n; i++) tmp[i] = y[i] + h * k2[i] / 2;
  const k3 = f(t + h / 2, tmp);
  for (let i = 0; i < n; i++) tmp[i] = y[i] + h * k3[i];
  const k4 = f(t + h, tmp);
  const out = new Array(n);
  for (let i = 0; i < n; i++) out[i] = y[i] + h / 6 * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]);
  return out;
}

/* 速度 Verlet(就地更新):pos/vel/acc 为 Float64Array(长度 3N);accel(pos, accOut) 计算加速度 */
export function verletStep(pos, vel, acc, h, accel) {
  const n = pos.length;
  for (let i = 0; i < n; i++) { vel[i] += 0.5 * h * acc[i]; pos[i] += h * vel[i]; }
  accel(pos, acc);
  for (let i = 0; i < n; i++) vel[i] += 0.5 * h * acc[i];
}
