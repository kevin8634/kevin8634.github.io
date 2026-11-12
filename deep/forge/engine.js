/* 深空 2.4 · 模型炼炉引擎(纯计算,无 DOM;浏览器与 node 共用)
 * 一炉 = 一份 JSON 配置(deep/forge/<id>.json):数据列、方程积木、合成方式、引导、过关、预测胶囊。
 * 积木类型:
 *   column  —— 数据表中的一列作为「形状」,参数为缩放(如 SPARC Vdisk × √Υ★);
 *   kernel  —— 引擎内置解析函数(KERNELS,如伪等温暗晕 iso、NFW);
 *   expr    —— 配置里的表达式(需由调用方注入 compile,如 core.js 的 Expr.compile);
 *   factor  —— (深空 2.5)乘在合成结果上的修正因子,在数据点 i 处读数据列 col(如行星质量比 μ),
 *              因子 = (1 + β·μ)^pow(默认 pow=−1/2,即牛顿形式的开普勒第三定律 T ∝ a^{3/2}/√(1+m/M☉));
 *              非数据点处 μ 取 0(因子 = 1),只画金线不画分量。
 *   mod     —— (深空 2.6)修饰积木:不单独产生曲线,只把自己的参数交给别的核(如「封城干预」的 q、tL 交给 SIR 核);
 *              不在炉里时,参数取配置的 off 值(如 q=0),于是 SIR 核按无干预计算。
 * 派生量(深空 2.6):cfg.derived[] 引用 DERIVED 中的函数(如 R₀ = β/γ),不确定度由拟合协方差按一阶误差传播给出。
 * 深空 2.7 CO₂ 炉:KERNELS 增补 co2lin / co2quad / co2exp / harm1 / harm2(x 为小数年份,参考年 2000);
 *   DERIVED 函数多收两个参数 (p, blocks, d):blocks 为炉中积木 id、d 为派生量配置(如 d.at 求增长率的时刻),旧函数忽略即可。
 * 截断拟合(深空 2.6):sliceData(data, xmax) 只留 x ≤ xmax 的数据点,供「用前 N 天数据封存」的预测胶囊。
 * 合成:combine="quad" 时 y² = Σ 分量(分量本身给出 v²,可为负,如气体 Vgas|Vgas|),y = √max(0,Σ);
 *       combine="sum" 时 y = Σ 分量。
 * 统计:χ² = Σ((y−model)/σ)²;约化 χ²_ν = χ²/(n−k);AIC = χ²+2k;BIC = χ²+k·ln n(高斯误差,省略常数项;n 为数据点数,
 *       深空 2.8 起文案统一写小写 n,避免与 SIR 的有效人群 N 冲突——代码字段仍叫 ev.N,不改存档格式)。
 * 分龄(深空 2.8):cfg.tiers = { l1: 星辰·滑杆版, l4: 星穹·开放问题版 },applyTier(cfg, tier) 返回该档的炉配置(l2 = 原版原样返回);
 *   贴合度 fitness(ev) = 每颗星按残差光丝颜色计分(绿 1、黄 ½、红 0)的平均 ×100,给星辰层代替 χ²/BIC;
 *   chi2Q(χ², ν) = 卡方上尾概率,星穹层显示。
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
  /* 深空 2.6 疫情炉(x = 距 2020-02-24 的天数,输出累计确诊人数):
     指数 C = C₀·e^{rt};逻辑斯谛 C = K/[1 + (K/C₀ − 1)e^{−rt}](K 以万人计);
     SIR 累计 C = N − S(t)(N 以万人计,S(0) = N − I₀,I(0) = I₀,R(0) = 0),RK4 数值积分,见 sirCum */
  expo(x, p) { return p.C0e * Math.exp(p.re * x); },
  logis(x, p) { const K = p.K * 1e4; return K / (1 + (K / p.C0l - 1) * Math.exp(-p.rl * x)); },
  sir(x, p) { return sirCum(p, x); },
  /* 深空 2.7 CO₂ 炉(x = 小数年份,输出 ppm;参考年 2000):
     线性 a + b(t−2000);二次项 c(t−2000)²;工业前基线 280 ppm + 指数 A·e^{(t−2000)/τ};
     年周期 A₁cos[2π(t − (m₁−½)/12)](m₁ = 峰值月份,1 = 1 月中);半年谐波 A₂cos[4π(t − (m₂−½)/12)] */
  co2lin(x, p) { return p.a + p.b * (x - 2000); },
  co2quad(x, p) { const u = x - 2000; return p.c * u * u; },
  co2exp(x, p) { return 280 + p.A * Math.exp((x - 2000) / p.tau); },
  harm1(x, p) { return p.A1 * Math.cos(2 * Math.PI * (x - (p.m1 - 0.5) / 12)); },
  harm2(x, p) { return p.A2 * Math.cos(4 * Math.PI * (x - (p.m2 - 0.5) / 12)); },
  /* NFW ρ=ρs/[(r/rs)(1+r/rs)²];v²=4πGρs rs³[ln(1+x)−x/(1+x)]/r(备用,F1 暗物质炉未启用) */
  nfw(r, p) {
    const rho = p.rhos * 1e7, rs = p.rs;
    if (r <= 0) return 0;
    const x = r / rs;
    return 4 * Math.PI * G * rho * rs ** 3 * (Math.log(1 + x) - x / (1 + x)) / r;
  }
};

/* SIR:dS/dt = −β(t)·S·I/N,dI/dt = β(t)·S·I/N − γI;C = N − S = I + R(累计感染)
   β(t) = β·[1 − q/(1 + e^{−(t − t_L)/w})],w = 1 天(平滑台阶;q = 0 即无干预)。
   RK4 步长 0.05 天,积分到 max(160, x) 天,整条轨迹按参数缓存(拟合时同一组参数会被反复取值)。 */
const SIR_DT = 0.05, SIR_CACHE = new Map();
function sirTraj(p, H) {
  const b = p.beta, g = p.gamma, N = p.N * 1e4, I0 = p.I0, q = p.q || 0, tL = p.tL || 0;
  const n = Math.ceil(H / SIR_DT), C = new Float64Array(n + 1), dt = SIR_DT;
  const bt = (t) => (q ? b * (1 - q / (1 + Math.exp(-(t - tL)))) : b);
  const f = (t, S, I) => { const k = bt(t) * S * I / N; return [-k, k - g * I]; };
  let S = N - I0, I = I0; C[0] = N - S;
  for (let i = 0; i < n; i++) {
    const t = i * dt, a = f(t, S, I), c = f(t + dt / 2, S + dt / 2 * a[0], I + dt / 2 * a[1]), d = f(t + dt / 2, S + dt / 2 * c[0], I + dt / 2 * c[1]), e = f(t + dt, S + dt * d[0], I + dt * d[1]);
    S += dt / 6 * (a[0] + 2 * c[0] + 2 * d[0] + e[0]); I += dt / 6 * (a[1] + 2 * c[1] + 2 * d[1] + e[1]);
    C[i + 1] = N - S;
  }
  return C;
}
export function sirCum(p, x) {
  if (!(x > 0)) return p.I0;
  const key = [p.beta, p.gamma, p.N, p.I0, p.q || 0, p.tL || 0].join("|");
  let C = SIR_CACHE.get(key);
  if (!C || (C.length - 1) * SIR_DT < x) { C = sirTraj(p, Math.max(160, Math.ceil(x) + 10)); if (SIR_CACHE.size > 48) SIR_CACHE.clear(); SIR_CACHE.set(key, C); }
  const u = x / SIR_DT, i = Math.floor(u), t = u - i;
  return i + 1 < C.length ? C[i] + t * (C[i + 1] - C[i]) : C[C.length - 1];
}

/* 派生量:由参数算出的物理量(深空 2.6) */
export const DERIVED = {
  R0: (p) => p.beta / p.gamma,                  // 基本再生数 R₀ = β/γ
  Rq: (p) => p.beta * (1 - p.q) / p.gamma,      // 干预后再生数 β(1−q)/γ(未计易感者减少)
  Td: (p) => Math.LN2 / p.re,                   // 指数翻倍时间 ln2/r
  TdL: (p) => Math.LN2 / p.rl,                  // 深空 2.8(01 C10):逻辑斯谛早期翻倍时间 ln2/r(只在 C ≪ K 的早期成立)
  /* 深空 2.7:趋势(线性/二次/指数积木之和)在 d.at 时刻的斜率 ppm/年(中心差分,h = 0.01 年) */
  co2g: (p, B = [], d = {}) => { const t = d.at ?? 2026.7, h = 0.01, K = { lin: "co2lin", quad: "co2quad", exp: "co2exp" }; let s = 0; for (const id of B) if (K[id]) s += (KERNELS[K[id]](t + h, p) - KERNELS[K[id]](t - h, p)) / (2 * h); return s; },
  /* 季节项(年周期 + 半年谐波)一年内的峰谷差 ppm(取样 720 点) */
  co2amp: (p, B = []) => { let hi = -Infinity, lo = Infinity; for (let i = 0; i < 720; i++) { const t = i / 720; let v = 0; if (B.includes("ann")) v += KERNELS.harm1(t, p); if (B.includes("semi")) v += KERNELS.harm2(t, p); hi = Math.max(hi, v); lo = Math.min(lo, v); } return hi - lo; }
};
/* 返回 [{d, v, s}]:只列出 need 积木都在炉里的派生量;fitR 给出协方差时 s 为一阶误差传播的 σ */
export function derived(cfg, state, fitR) {
  return (cfg.derived || []).filter((d) => (d.need || []).every((id) => state.blocks.includes(id)) && (!d.needAny || d.needAny.some((id) => state.blocks.includes(id)))).map((d) => { // 深空 2.7:needAny = 其中任一块在炉里即可
    const B = state.blocks, fn = (q) => DERIVED[d.fn](q, B, d), p = state.p, v = fn(p); let s = null;
    if (fitR && fitR.cov) {
      const ks = Object.keys(fitR.cov), gr = ks.map((k) => { const h = 1e-6 * Math.max(Math.abs(p[k]), 1e-9); return (fn({ ...p, [k]: p[k] + h }) - v) / h; });
      let s2 = 0; ks.forEach((a, i) => ks.forEach((b, j) => (s2 += gr[i] * gr[j] * fitR.cov[a][b]))); s = Math.sqrt(Math.max(0, s2));
    }
    return { d, v, s };
  });
}

/* 修饰积木:不在炉里的 mod 积木,其参数取 off 值(无 mod 积木的炉原样返回 state.p) */
export function effP(cfg, state) {
  let p = state.p;
  for (const b of cfg.blocks) if (b.kind === "mod" && b.off && !state.blocks.includes(b.id)) { if (p === state.p) p = { ...p }; Object.assign(p, b.off); }
  return p;
}

/* 截断数据:只留 x ≤ xmax 的点(各列同步截断),供「用前 N 天数据封存」的胶囊 */
export function sliceData(data, xmax) {
  const n = data.x.filter((x) => x <= xmax).length, cols = {};
  for (const k of Object.keys(data.cols)) cols[k] = data.cols[k].slice(0, n);
  return { ...data, x: data.x.slice(0, n), y: data.y.slice(0, n), e: data.e.slice(0, n), cols, labels: data.labels ? data.labels.slice(0, n) : null, N: n };
}

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
  let s = 0, f = 1, any = false; const p = effP(cfg, state);
  for (const id of state.blocks) { const b = cfg.blocks.find((q) => q.id === id); if (!b || b.kind === "mod") continue; const v = blockAt(cfg, data, b, p, x, i, compile); if (b.kind === "factor") f *= v; else { s += v; any = true; } }
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
  if (P.fitMin != null && fitness(ev) < P.fitMin) return false; // 深空 2.8 星辰层:贴合度门槛
  if (P.params) for (const [k, r] of Object.entries(P.params)) if (!(state.p[k] >= r[0] && state.p[k] <= r[1])) return false; // 深空 2.5:参数须落在区间
  if (P.fitMin != null && P.redMax == null) return true; // 深空 2.8 星辰层:只看贴合度,不设 χ²_ν 线
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
  const C = inv(A), sc = Math.sqrt(Math.max(1, ev.red)), sigma = {}, atBound = {}, cov = C ? {} : null;
  Q.forEach((q, j) => { sigma[q.k] = C && C[j][j] > 0 ? Math.sqrt(C[j][j]) * sc : NaN; atBound[q.k] = Math.abs(p[q.k] - q.min) < 1e-9 * Math.max(1, Math.abs(q.min)) || Math.abs(p[q.k] - q.max) < 1e-9 * Math.max(1, Math.abs(q.max)); });
  if (C) Q.forEach((a, i) => { cov[a.k] = {}; Q.forEach((b, j) => (cov[a.k][b.k] = C[i][j] * sc * sc)); }); // 深空 2.6:协方差(同样乘 χ²_ν>1 的缩放),供派生量误差传播
  return { p: { ...p }, sigma, cov, atBound, ev, iter: it, ok: true };
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

/* ---------- 深空 2.8 分龄 ---------- */
/* 贴合度 0–100:绿光丝(|z|<1)计 1、黄(1–3)计 ½、红(>3)计 0,取平均 */
export function fitness(ev) { if (!ev || ev.empty) return 0; let s = 0; for (const z of ev.z) s += tier(z) === 0 ? 1 : tier(z) === 1 ? 0.5 : 0; return Math.round(100 * s / ev.N); }
export function tierCount(ev) { const c = [0, 0, 0]; if (ev && !ev.empty) for (const z of ev.z) c[tier(z)]++; return c; }

/* 卡方上尾概率 Q(ν/2, χ²/2)(正则化上不完全 Γ;级数 / 连分式,Numerical Recipes 6.2) */
function lnGamma(x) { const c = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5]; let y = x, t = x + 5.5; t -= (x + 0.5) * Math.log(t); let s = 1.000000000190015; for (const v of c) s += v / ++y; return -t + Math.log(2.5066282746310005 * s / x); }
export function chi2Q(chi2, nu) {
  const a = nu / 2, x = chi2 / 2; if (!(x > 0)) return 1; const gl = lnGamma(a);
  if (x < a + 1) { let ap = a, sum = 1 / a, del = sum; for (let n = 0; n < 500; n++) { ap++; del *= x / ap; sum += del; if (Math.abs(del) < Math.abs(sum) * 1e-14) break; } return Math.max(0, 1 - sum * Math.exp(-x + a * Math.log(x) - gl)); }
  let b = x + 1 - a, c = 1e300, d = 1 / b, h = d; for (let i = 1; i < 500; i++) { const an = -i * (i - a); b += 2; d = an * d + b; if (Math.abs(d) < 1e-300) d = 1e-300; c = b + an / c; if (Math.abs(c) < 1e-300) c = 1e-300; d = 1 / d; const del = d * c; h *= del; if (Math.abs(del - 1) < 1e-14) break; }
  return Math.exp(-x + a * Math.log(x) - gl) * h;
}

/* 分档配置:l2(或无 tiers)= 原版原样返回(同一对象,星系层零改动);
   l1 = 只留 blocks ∪ tray 的积木,非 knobs 的参数隐藏并锁定在 p 给的值;guide/intro/pass/sumTex/emptyHint/积木文案 可覆盖;
   l4 = 原版积木 + extraBlocks,所有参数默认解锁(lock 只是初值,用户仍可手动锁) */
export const TIERS = ["l1", "l2", "l4"];
export function applyTier(cfg, t) {
  const T = cfg.tiers && cfg.tiers[t];
  if (!T || t === "l2") return cfg;
  const c = JSON.parse(JSON.stringify(cfg)); c.tier = t; c.tierCfg = T;
  for (const k of ["guide", "intro", "pass", "sumTex", "sumTexShort", "emptyHint", "subtitle", "derived"]) if (T[k] != null) c[k] = T[k];
  if (t === "l1") {
    const keep = (T.blocks || []).concat(T.tray || []);
    c.blocks = keep.map((id) => c.blocks.find((b) => b.id === id)).filter(Boolean);
    const knobs = new Set(T.knobs || []);
    c.blocks.forEach((b) => { const o = (T.text || {})[b.id]; if (o) Object.assign(b, o);
      b.params.forEach((q) => { if (T.p && T.p[q.k] != null) q.value = T.p[q.k]; if (knobs.has(q.k)) { delete q.lock; if (T.range && T.range[q.k]) Object.assign(q, T.range[q.k]); } else { q.lock = true; q.hide = true; } }); });
    c.preset = (T.blocks || []).slice();
  } else if (t === "l4") {
    c.blocks = c.blocks.concat(T.extraBlocks || []);
    c.blocks.forEach((b) => b.params.forEach((q) => delete q.lock));
  }
  return c;
}
