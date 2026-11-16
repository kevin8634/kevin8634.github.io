/* 星图 Math Atlas 2.0 · 改公理·玻璃曲面 —— 精确几何核(纯函数,不依赖 three;2026-11-17)
 *
 * 常曲率 K 的三种二维几何,统一接口:
 *   K > 0:半径 R = 1/√K 的球面。点存为单位球上的单位向量 P,测地距离 = R·∠(P,Q)。
 *   K = 0:欧氏平面。点存为 [x, y, 0]。
 *   K < 0:双曲平面(双曲面模型)。记 a = 1/√(−K),点存为单位双曲面 x²+y²−t² = −1(t>0)上的 [x, y, t],
 *          闵可夫斯基内积 ⟨u,v⟩ = u₀v₀ + u₁v₁ − u₂v₂,测地距离 = a·arcosh(−⟨P,Q⟩)。
 * 顶点用「以中心 O 为原点的测地极坐标」(s, θ) 给出:s = 到 O 的测地距离,θ = 方向。三种几何里这都有意义,
 * 拧曲率旋钮时三个顶点的 (s, θ) 不变,只换几何。
 *
 * 面积用「从顶点 A 出发的测地极坐标」直接积分(Simpson 数值积分),**不用**高斯–博内,
 * 这样 α+β+γ = π + K·A 是两边各自算出来再比较,而不是用定理去算定理。
 * 平行移动:沿测地线,被移动的向量与测地线切向的夹角保持不变;过顶点时切向转过外角。
 */
export const EPS_K = 1e-9;
const sgn = K => (K > EPS_K ? 1 : K < -EPS_K ? -1 : 0);
export const scaleOf = K => (sgn(K) === 0 ? Infinity : 1 / Math.sqrt(Math.abs(K)));   // R 或 a

const add = (u, v) => [u[0] + v[0], u[1] + v[1], u[2] + v[2]];
const mul = (u, k) => [u[0] * k, u[1] * k, u[2] * k];
const cross = (u, v) => [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
const J = u => [u[0], u[1], -u[2]];
const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);

/** 该几何的内积(切向量之间,或模型点之间) */
export function dot(K, u, v) {
  const g = sgn(K);
  if (g > 0) return u[0] * v[0] + u[1] * v[1] + u[2] * v[2];
  if (g < 0) return u[0] * v[0] + u[1] * v[1] - u[2] * v[2];
  return u[0] * v[0] + u[1] * v[1];
}
const norm = (K, u) => Math.sqrt(Math.max(0, dot(K, u, u)));
const unit = (K, u) => { const n = norm(K, u) || 1; return mul(u, 1 / n); };

/** 测地极坐标 (s, θ) → 模型点 */
export function fromPolar(K, s, th) {
  const g = sgn(K), c = Math.cos(th), d = Math.sin(th);
  if (g === 0) return [s * c, s * d, 0];
  const f = s / scaleOf(K);
  if (g > 0) return [Math.sin(f) * c, Math.sin(f) * d, Math.cos(f)];
  return [Math.sinh(f) * c, Math.sinh(f) * d, Math.cosh(f)];
}
/** 模型点 → 测地极坐标 (s, θ) */
export function toPolar(K, P) {
  const g = sgn(K), th = Math.atan2(P[1], P[0]);
  if (g === 0) return [Math.hypot(P[0], P[1]), th];
  const S = scaleOf(K);
  if (g > 0) return [S * Math.acos(clamp(P[2], -1, 1)), th];
  return [S * Math.acosh(Math.max(1, P[2])), th];
}
/** 测地距离 */
export function dist(K, P, Q) {
  const g = sgn(K);
  if (g === 0) return Math.hypot(P[0] - Q[0], P[1] - Q[1]);
  const S = scaleOf(K);
  if (g > 0) return S * Math.acos(clamp(dot(K, P, Q), -1, 1));
  return S * Math.acosh(Math.max(1, -dot(K, P, Q)));
}
/** P 处指向 Q 的单位切向量 */
export function towards(K, P, Q) {
  const g = sgn(K);
  if (g === 0) return unit(K, [Q[0] - P[0], Q[1] - P[1], 0]);
  if (g > 0) return unit(K, add(Q, mul(P, -dot(K, P, Q))));
  return unit(K, add(Q, mul(P, dot(K, P, Q))));
}
/** 切平面里与单位切向量 T 正交、按统一定向(从曲面外侧看为逆时针)的单位向量 */
export function leftOf(K, P, T) {
  const g = sgn(K);
  if (g === 0) return [-T[1], T[0], 0];
  if (g > 0) return unit(K, cross(P, T));
  return unit(K, J(cross(P, T)));
}
/** 测地线 P→Q 上参数 λ∈[0,1] 的点 */
export function geodesic(K, P, Q, l) {
  const g = sgn(K);
  if (g === 0) return [P[0] + (Q[0] - P[0]) * l, P[1] + (Q[1] - P[1]) * l, 0];
  if (g > 0) {
    const w = Math.acos(clamp(dot(K, P, Q), -1, 1));
    if (w < 1e-9) return P.slice();
    const sw = Math.sin(w);
    return add(mul(P, Math.sin((1 - l) * w) / sw), mul(Q, Math.sin(l * w) / sw));
  }
  const d = Math.acosh(Math.max(1, -dot(K, P, Q)));
  if (d < 1e-9) return P.slice();
  const sd = Math.sinh(d);
  return add(mul(P, Math.sinh((1 - l) * d) / sd), mul(Q, Math.sinh(l * d) / sd));
}
/** 指数映射:从 P 沿单位切向 T 走测地距离 r */
export function expMap(K, P, T, r) {
  const g = sgn(K);
  if (g === 0) return [P[0] + T[0] * r, P[1] + T[1] * r, 0];
  const f = r / scaleOf(K);
  if (g > 0) return add(mul(P, Math.cos(f)), mul(T, Math.sin(f)));
  return add(mul(P, Math.cosh(f)), mul(T, Math.sinh(f)));
}
/** 顶点 P 处、两条边 P→Q1、P→Q2 之间的内角(弧度) */
export function angleAt(K, P, Q1, Q2) {
  return Math.acos(clamp(dot(K, towards(K, P, Q1), towards(K, P, Q2)), -1, 1));
}
export function angles(K, V) {
  return [angleAt(K, V[0], V[1], V[2]), angleAt(K, V[1], V[2], V[0]), angleAt(K, V[2], V[0], V[1])];
}

/** 面积:从顶点 A 出发的测地极坐标积分 ∫₀^α ∫₀^ρ(φ) J(r) dr dφ(Simpson,n 段)。不用高斯–博内。 */
export function area(K, V, n = 600) {
  const g = sgn(K);
  // 以最小角的顶点为极点:另两个角都不小,射线不会掠过对边,被积函数平滑
  const an0 = angles(K, V), k0 = an0.indexOf(Math.min(...an0));
  const [A, B, C] = [V[k0], V[(k0 + 1) % 3], V[(k0 + 2) % 3]];
  if (g === 0) return Math.abs((B[0] - A[0]) * (C[1] - A[1]) - (C[0] - A[0]) * (B[1] - A[1])) / 2;
  const S = scaleOf(K);
  const e1 = towards(K, A, B), tc = towards(K, A, C);
  const e2 = unit(K, add(tc, mul(e1, -dot(K, tc, e1))));
  const al = Math.acos(clamp(dot(K, e1, tc), -1, 1));
  const nBC = g > 0 ? cross(B, C) : J(cross(B, C));        // 过 B、C 的测地线所在「平面」的法向
  const an = dot(K, A, nBC);
  const F = phi => {
    const U = add(mul(e1, Math.cos(phi)), mul(e2, Math.sin(phi)));
    const un = dot(K, U, nBC);
    if (g > 0) { let t = Math.atan2(-an, un); if (t < 0) t += Math.PI; return S * S * (1 - Math.cos(t)); }
    const t = Math.atanh(clamp(-an / un, -1 + 1e-15, 1 - 1e-15));
    return S * S * (Math.cosh(t) - 1);
  };
  if (n % 2) n++;
  const h = al / n; let s = F(0) + F(al);
  for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * F(i * h);
  return s * h / 3;
}

/** 共形二维图:球面用球极投影、双曲用庞加莱圆盘,公式相同:X = 2S·(x, y)/(1+z);平面为恒等。角度不变形。 */
export function chart(K, P) {
  if (sgn(K) === 0) return [P[0], P[1]];
  const S = scaleOf(K), k = 2 * S / (1 + P[2]);
  return [P[0] * k, P[1] * k];
}
export function unchart(K, X, Y) {
  const g = sgn(K), r = Math.hypot(X, Y), th = Math.atan2(Y, X);
  if (g === 0) return fromPolar(K, r, th);
  const S = scaleOf(K);
  const s = g > 0 ? 2 * S * Math.atan(r / (2 * S)) : 2 * S * Math.atanh(Math.min(r / (2 * S), 1 - 1e-9));
  return fromPolar(K, s, th);
}
/** 三维展示(Y 轴朝上,O 在原点):K>0 为半径 R 的球冠(等距嵌入);K≤0 为水平的平面/庞加莱圆盘玻璃片 */
export function disp3(K, P) {
  const g = sgn(K);
  if (g > 0) { const R = scaleOf(K); return [R * P[0], R * (P[2] - 1), R * P[1]]; }
  if (g < 0) { const c = chart(K, P); return [c[0], 0, c[1]]; }
  return [P[0], 0, P[1]];
}
export function undisp3(K, X, Y, Z) {
  const g = sgn(K);
  if (g > 0) { const R = scaleOf(K); let u = [X / R, Z / R, 1 + Y / R]; const n = Math.hypot(...u) || 1; return mul(u, 1 / n); }
  if (g < 0) return unchart(K, X, Z);
  return [X, Z, 0];
}
/** 三角形定向(>0 为逆时针):在顶点 A 处,看 C 是否在边 AB 的左侧(内蕴判断,不受图的弯曲影响) */
export function orientation(K, V) {
  const T = towards(K, V[0], V[1]);
  return Math.sign(dot(K, towards(K, V[0], V[2]), leftOf(K, V[0], T)));
}

/** 平行移动:沿三角形 A→B→C→A 移动一个切向量。返回采样帧与转角(= 逆时针时 Σ角 − π,即 K·面积)。
 *  每帧 {P, T(行进切向), v(被移动的向量)};ψ 为 v 相对 T 的夹角,沿测地线不变,过顶点时减去转弯角。 */
export function transport(K, V, psi0 = Math.PI / 3, per = 48) {
  const frames = []; let psi = psi0, Tprev = null, Pprev = null;
  for (let e = 0; e < 3; e++) {
    const P0 = V[e], P1 = V[(e + 1) % 3];
    const T0 = towards(K, P0, P1);
    if (Tprev) {                                             // 在顶点处转弯
      const N = leftOf(K, P0, Tprev);
      psi -= Math.atan2(dot(K, T0, N), dot(K, T0, Tprev));
    }
    for (let i = 0; i <= per; i++) {
      const l = i / per, P = geodesic(K, P0, P1, l);
      const T = i < per ? towards(K, P, P1) : mul(towards(K, P, P0), -1);
      const N = leftOf(K, P, T);
      frames.push({ P, T, v: add(mul(T, Math.cos(psi)), mul(N, Math.sin(psi))), edge: e });
    }
    Tprev = mul(towards(K, P1, P0), -1); Pprev = P1;
  }
  const T0 = towards(K, V[0], V[1]), N0 = leftOf(K, V[0], T0);
  const last = frames[frames.length - 1].v;
  const psiEnd = Math.atan2(dot(K, last, N0), dot(K, last, T0));
  let rot = psiEnd - psi0; rot = Math.atan2(Math.sin(rot), Math.cos(rot));
  return { frames, rot };
}

/** 一次算全:角、和、面积、K·A */
export function measure(K, V) {
  const a = angles(K, V), sum = a[0] + a[1] + a[2], A = area(K, V);
  return { angles: a, sum, area: A, KA: K * A, excess: sum - Math.PI };
}
export const deg = r => r * 180 / Math.PI;
