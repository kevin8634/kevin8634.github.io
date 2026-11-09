/* 深空 2.4 · 模型炼炉引擎(纯计算,无 DOM;浏览器与 node 共用)
 * 一炉 = 一份 JSON 配置(deep/forge/<id>.json):数据列、方程积木、合成方式、引导、过关、预测胶囊。
 * 积木类型:
 *   column  —— 数据表中的一列作为「形状」,参数为缩放(如 SPARC Vdisk × √Υ★);
 *   kernel  —— 引擎内置解析函数(KERNELS,如伪等温暗晕 iso、NFW);
 *   expr    —— 配置里的表达式(需由调用方注入 compile,如 core.js 的 Expr.compile);
 *   factor  —— (深空 2.5)乘在合成结果上的修正因子,在数据点 i 处读数据列 col(如行星质量比 μ),
 *              因子 = (1 + β·μ)^pow(默认 pow=−1/2,即牛顿形式的开普勒第三定律 T ∝ a^{3/2}/√(1+m/M☉));
 *              非数据点处 μ 取 0(因子 = 1),只画金线不画分量。
 * 合成:combine="quad" 时 y² = Σ 分量(分量本身给出 v²,可为负,如气体 Vgas|Vgas|),y = √max(0,Σ);
 *       combine="sum" 时 y = Σ 分量。
 * 统计:χ² = Σ((y−model)/σ)²;约化 χ²_ν = χ²/(N−k);AIC = χ²+2k;BIC = χ²+k·lnN(高斯误差,省略常数项)。
 * 拟合:Levenberg–Marquardt,自由参数在(对数尺度参数取 ln)变换空间迭代并夹在范围内;
 *       不确定度 σ = √diag[(JᵀWJ)⁻¹] 在原始参数空间计算,χ²_ν>1 时乘 √χ²_ν(写明)。 */
export const G = 4.30091e-6; // kpc·(km/s)²/M☉

export const KERNELS = {
  /* 伪等温球 ρ(r)=ρ0/[1+(r/rc)²];M(<r)=4πρ0 rc³[r/rc − arctan(r/rc)];v²=GM/r
     参数 rho0 以 10⁷ M☉/kpc³ 计,rc 以 kpc 计,返回 v²((km/s)²) */
  iso(r, p) {
    const rho = p.rho0 * 1e7, rc = p.rc;
    if (r <= 0) return 0;
    const x = r / rc;
    // 小 x 展开避免相消误差:1 − arctan(x)/x ≈ x²/3 − x⁴/5
    const f = x < 1e-3 ? x * x / 3 - x ** 4 / 5 : 1 - Math.atan(x) / x;
    return 4 * Math.PI * G * rho * rc * rc * f;
  },
  /* 深空 2.5 开普勒炉:幂律 y = C·x^n、正比 y = k·x */
  pow(x, p) { return p.C * Math.pow(x, p.n); },
  lin(x, p) { return p.kl * x; },
  /* NFW ρ=ρs/[(r/rs)(1+r/rs)²];v²=4πGρs rs³[ln(1+x)−x/(1+x)]/r(备用,F1 暗物质炉未启用) */
  nfw(r, p) {
    const rho = p.rhos * 1e7, rs = p.rs;
    if (r <= 0) return 0;
    const x = r / rs;
    return 4 * Math.PI * G * rho * rs ** 3 * (Math.log(1 + x) - x / (1 + x)) / r;
  }
};

/* 数据集:{x:[], y:[], e:[], cols:{name:[]}} */
export function makeData(json, spec) {
  const ci = (n) => json.columns.indexOf(n);
  const rows = json.rows.slice().sort((a, b) => a[ci(spec.x)] - b[ci(spec.x)]);
  const cols = {};
  json.columns.forEach((n, i) => (cols[n] = rows.map((r) => +r[i])));
  const labels = spec.label ? rows.map((r) => String(r[ci(spec.label)])) : null; // 深空 2.5:点名(如行星名)
  return { x: cols[spec.x], y: cols[spec.y], e: cols[spec.err], cols, labels, meta: json.meta, N: rows.length };
}

/* 某列在任意 x 处的「形状」值:数据范围内线性插值;
   quad 合成且 tail="kepler" 时,外推按 v ∝ 1/√r(质量已全部包含,开普勒下降),内推按 v ∝ r(实心转动)。 */
function colAt(data, name, x, tail) {
  const X = data.x, C = data.cols[name], n = X.length;
  if (x <= X[0]) return tail === "kepler" ? C[0] * Math.max(0, x) / X[0] : C[0];
  if (x >= X[n - 1]) return tail === "kepler" ? C[n - 1] * Math.sqrt(X[n - 1] / x) : C[n - 1];
  let lo = 0, hi = n - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (X[m] <= x) lo = m; else hi = m; }
  const t = (x - X[lo]) / (X[hi] - X[lo]);
  return C[lo] + t * (C[hi] - C[lo]);
}

/* 单块积木在 x 处的贡献。quad 时返回 v²(可负),sum 时返回 y 分量 */
export function blockAt(cfg, data, b, p, x, i, compile) {
  if (b.kind === "column") {
    const v = i != null && data.x[i] === x ? data.cols[b.col][i] : colAt(data, b.col, x, b.tail);
    const s = p[b.params[0].k];
    return cfg.combine === "quad" ? s * v * Math.abs(v) : s * v;
  }
  if (b.kind === "kernel") return KERNELS[b.kernel](x, p);
  if (b.kind === "factor") {
    const mu = i != null && data.x[i] === x ? data.cols[b.col][i] : 0;
    return Math.pow(1 + p[b.params[0].k] * mu, b.pow ?? -0.5);
  }
  if (b.kind === "expr") {
    if (!b._fn) b._fn = compile(b.expr, [cfg.data.x].concat(b.params.map((q) => q.k)));
    return +b._fn({ ...p, [cfg.data.x]: x });
  }
  return 0;
}

const combineOut = (cfg, s) => (cfg.combine === "quad" ? Math.sqrt(Math.max(0, s)) : s);

/* state = { blocks:[id...], p:{k:value}, lock:{k:true} } */
export function modelAt(cfg, data, state, x, i, compile) {
  let s = 0, f = 1, any = false;
  for (const id of state.blocks) { const b = cfg.blocks.find((q) => q.id === id); if (!b) continue; const v = blockAt(cfg, data, b, state.p, x, i, compile); if (b.kind === "factor") f *= v; else { s += v; any = true; } }
  return any ? combineOut(cfg, s) * f : 0; // 只有修正因子、没有主项时模型为 0
}

/* 分量曲线(quad:单独显示 √|v²|·sign) */
export function compAt(cfg, data, b, p, x, compile) {
  const v = blockAt(cfg, data, b, p, x, null, compile);
  return cfg.combine === "quad" ? Math.sign(v) * Math.sqrt(Math.abs(v)) : v;
}

export function freeParams(cfg, state) {
  const out = [];
  for (const id of state.blocks) { const b = cfg.blocks.find((q) => q.id === id); if (!b) continue; for (const q of b.params) if (!state.lock[q.k]) out.push(q); }
  return out;
}

export function evaluate(cfg, data, state, compile) {
  const N = data.N, k = freeParams(cfg, state).length;
  const m = data.x.map((x, i) => modelAt(cfg, data, state, x, i, compile));
  const z = data.y.map((y, i) => (y - m[i]) / data.e[i]);
  const chi2 = z.reduce((a, v) => a + v * v, 0), nu = Math.max(1, N - k);
  return { m, z, chi2, k, N, nu, red: chi2 / nu, aic: chi2 + 2 * k, bic: chi2 + k * Math.log(N), empty: state.blocks.length === 0 };
}

/* 评分 0–100:每点 BIC 超额 e=(BIC−N)/N,S=100·exp(−max(0,e)/1.5);越简越准越亮 */
export function score(ev) { if (ev.empty) return 0; const e = (ev.bic - ev.N) / ev.N; return Math.round(100 * Math.exp(-Math.max(0, e) / 1.5)); }

export function passed(cfg, state, ev) {
  const P = cfg.pass || {};
  if (ev.empty) return false;
  if (P.require && !P.require.every((id) => state.blocks.includes(id))) return false;
  if (P.params) for (const [k, r] of Object.entries(P.params)) if (!(state.p[k] >= r[0] && state.p[k] <= r[1])) return false; // 深空 2.5:参数须落在区间
  return ev.red < (P.redMax ?? 2);
}

/* 线性代数:小矩阵求逆(高斯-约当) */
function inv(A) {
  const n = A.length, M = A.map((r, i) => r.concat(Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))));
  for (let c = 0; c < n; c++) {
    let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    if (Math.abs(M[p][c]) < 1e-300) return null;
    [M[c], M[p]] = [M[p], M[c]];
    const d = M[c][c]; for (let j = 0; j < 2 * n; j++) M[c][j] /= d;
    for (let r = 0; r < n; r++) if (r !== c) { const f = M[r][c]; if (f) for (let j = 0; j < 2 * n; j++) M[r][j] -= f * M[c][j]; }
  }
  return M.map((r) => r.slice(n));
}

const tf = (q, v) => (q.scale === "log" ? Math.log(v) : v);
const itf = (q, u) => (q.scale === "log" ? Math.exp(u) : u);
const clampQ = (q, v) => Math.min(q.max, Math.max(q.min, v));

/* Levenberg–Marquardt 最小二乘;返回 {p, sigma, ev, iter, ok} */
export function fit(cfg, data, state, compile, opt = {}) {
  const Q = freeParams(cfg, state);
  const p = { ...state.p };
  const st = { ...state, p };
  const resid = () => evaluate(cfg, data, st, compile).z;
  if (!Q.length) { const ev = evaluate(cfg, data, st, compile); return { p, sigma: {}, ev, iter: 0, ok: true }; }
  let u = Q.map((q) => tf(q, clampQ(q, p[q.k])));
  const setU = (uu) => Q.forEach((q, j) => (p[q.k] = clampQ(q, itf(q, uu[j]))));
  setU(u);
  let r = resid(), c = r.reduce((a, v) => a + v * v, 0), lam = 1e-3, it = 0, done = false;
  const jac = (uu, r0) => {
    const J = r0.map(() => new Array(Q.length).fill(0));
    Q.forEach((q, j) => {
      const h = 1e-6 * Math.max(1, Math.abs(uu[j])); const u2 = uu.slice(); u2[j] += h; setU(u2);
      const r2 = resid(); r2.forEach((v, i) => (J[i][j] = (v - r0[i]) / h));
    });
    setU(uu); return J;
  };
  for (; it < (opt.maxIter || 200); it++) {
    const J = jac(u, r), n = Q.length;
    const A = Array.from({ length: n }, (_, a) => Array.from({ length: n }, (_, b) => J.reduce((s, row) => s + row[a] * row[b], 0)));
    const g = Array.from({ length: n }, (_, a) => J.reduce((s, row, i) => s + row[a] * r[i], 0));
    let improved = false;
    for (let t = 0; t < 12; t++) {
      const B = A.map((row, a) => row.map((v, b) => (a === b ? v * (1 + lam) + 1e-12 : v)));
      const Bi = inv(B); if (!Bi) { lam *= 10; continue; }
      const du = Bi.map((row) => -row.reduce((s, v, b) => s + v * g[b], 0));
      const u2 = u.map((v, j) => v + du[j]);
      setU(u2); const u3 = Q.map((q) => tf(q, p[q.k])); // 夹紧后的真实位置
      const r2 = resid(), c2 = r2.reduce((a, v) => a + v * v, 0);
      if (c2 < c) { const rel = (c - c2) / Math.max(c, 1e-12); u = u3; r = r2; c = c2; lam = Math.max(1e-9, lam / 5); improved = true; if (rel < 1e-10) done = true; break; }
      setU(u); lam *= 8;
    }
    if (!improved || done) { it++; break; }
  }
  setU(u);
  const ev = evaluate(cfg, data, st, compile);
  // 原始参数空间的协方差
  const r0 = ev.z, J = r0.map(() => new Array(Q.length).fill(0));
  Q.forEach((q, j) => {
    const v0 = p[q.k], h = 1e-6 * Math.max(Math.abs(v0), 1e-6);
    p[q.k] = v0 + h; const r2 = resid(); r2.forEach((v, i) => (J[i][j] = (v - r0[i]) / h)); p[q.k] = v0;
  });
  const n = Q.length, A = Array.from({ length: n }, (_, a) => Array.from({ length: n }, (_, b) => J.reduce((s, row) => s + row[a] * row[b], 0)));
  const C = inv(A), sc = Math.sqrt(Math.max(1, ev.red)), sigma = {}, atBound = {};
  Q.forEach((q, j) => { sigma[q.k] = C && C[j][j] > 0 ? Math.sqrt(C[j][j]) * sc : NaN; atBound[q.k] = Math.abs(p[q.k] - q.min) < 1e-9 * Math.max(1, Math.abs(q.min)) || Math.abs(p[q.k] - q.max) < 1e-9 * Math.max(1, Math.abs(q.max)); });
  return { p: { ...p }, sigma, atBound, ev, iter: it, ok: true };
}

/* 引导:按配置顺序取第一条满足条件的提问 */
export function guide(cfg, state, ev) {
  const has = (a) => (a || []).every((id) => state.blocks.includes(id));
  const lacks = (a) => (a || []).every((id) => !state.blocks.includes(id));
  const ok = passed(cfg, state, ev);
  for (const g of cfg.guide || []) {
    const c = g.if || {};
    if (c.empty != null && c.empty !== ev.empty) continue;
    if (!has(c.has) || !lacks(c.lacks)) continue;
    if (c.pass != null && c.pass !== ok) continue;
    if (c.redAbove != null && !(ev.red > c.redAbove)) continue;
    if (c.redBelow != null && !(ev.red < c.redBelow)) continue;
    return g;
  }
  return null;
}

/* 残差等级:|z|<1 绿,1–3 黄,>3 红 */
export const tier = (z) => (Math.abs(z) < 1 ? 0 : Math.abs(z) <= 3 ? 1 : 2);

/* 预测胶囊真值:数据区间 [from,to] 内观测点的误差加权平均 */
export function capsuleTruth(data, t) {
  if (t.type === "value") return { v: t.v, e: t.e, n: 1 };
  let sw = 0, swy = 0, n = 0;
  data.x.forEach((x, i) => { if (x >= t.from && x <= t.to) { const w = 1 / data.e[i] ** 2; sw += w; swy += w * data.y[i]; n++; } });
  return n ? { v: swy / sw, e: Math.sqrt(1 / sw), n } : null;
}
