/* 宙律 Nomoverse 3.0 · 宇宙配方台 · 物理模型(3-1 纯函数层,零依赖;浏览器 window.NV3_UNIVERSE / node require)
 * 输入一份「配方」(常数倍数 + 种子),按 138 亿年时间线 7 关(T1–T7)逐关判定成功/警告/失败,
 * 并生成一个确定性的恒星系(同配方同种子 ⇒ 逐位相同的结果)。
 * 只复用 2.0 core/cosmos.js 的标度律(G:光度 ∝ G⁴、轨道 ∝ 1/G;α:玻尔半径 ∝ 1/α、电离能 ∝ α²、Hα ∝ α⁻²)。
 * 全部为教学简化:标度律 + 阈值,不做完整恒星演化或结构形成模拟;阈值出处与「inferred」标注见 ../SOURCES.md。
 *
 * 配方字段(全部可选,缺省 = 真实宇宙):
 *   kG    引力常数倍数(0.01–100)          kc   光速倍数(0.01–100)
 *   kA    精细结构常数倍数(0.05–20)        alphaLinked  true:只改 c 时 α ∝ 1/c(e、ħ 不变,诚实开关);false:单位换算,α 不动
 *   eps   核效率(0.004–0.010,真实 0.007)  Q    原初涨落幅度(1e-7–1e-3,真实 1e-5)
 *   kL    宇宙学常数倍数(-10–1000)          Om   今天的物质密度参数 Ω₀(0.01–5,真实 0.315)
 *   seed  32 位无符号整数种子 */
(function (root) {
  "use strict";

  /* ---------- 常数(SI 与常用单位;CODATA 2018、IAU 2015、Planck 2018) ---------- */
  var K = {
    G: 6.67430e-11, C: 299792458, ALPHA: 7.2973525693e-3,
    MSUN: 1.98847e30, LSUN: 3.828e26, RSUN: 6.957e8, TSUN: 5772,
    AU_M: 149597870700, YEAR_S: 365.25 * 86400, GYR_S: 365.25 * 86400 * 1e9,
    MEARTH: 5.9722e24, REARTH: 6.371e6,
    H0: 67.4,                           // km/s/Mpc(Planck 2018)
    OM0: 0.315, OL0: 0.685,             // Planck 2018 ΛCDM
    EPS0: 0.007, Q0: 1e-5,
    SUN_LIFE_GYR: 10,
    A0_PM: 52.917721, RY_EV: 13.605693, HALPHA_NM: 656.28,
    Z_STABLE0: 82,                      // 真实宇宙最重的稳定元素:铅
    BOND_EV: 4.3,                       // 典型 C–H 键能
    KB_EV: 8.617333e-5,
    IMF: [0.08, 150]                    // 恒星初始质量范围(M☉),Salpeter 斜率 2.35
  };
  var MPC_M = 3.0856775814913673e22;
  var H0_S = K.H0 * 1000 / MPC_M;        // 1/s
  var HUBBLE_GYR = 1 / H0_S / K.GYR_S;   // 1/H0 ≈ 14.5 Gyr

  var DEF = { kG: 1, kc: 1, kA: 1, alphaLinked: true, eps: K.EPS0, Q: K.Q0, kL: 1, Om: K.OM0, seed: 20261120 };
  var RANGE = { kG: [0.01, 100], kc: [0.01, 100], kA: [0.05, 20], eps: [0.004, 0.010], Q: [1e-7, 1e-3], kL: [-10, 1000], Om: [0.01, 5] };

  /* ---------- 工具 ---------- */
  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function num(x, d) { return typeof x === "number" && isFinite(x) ? x : d; }
  /* 规范化配方:越界夹到范围内,非法值回默认;seed 取 32 位无符号整数 */
  function normalize(p) {
    p = p || {};
    var o = {};
    for (var k in RANGE) o[k] = clamp(num(p[k], DEF[k]), RANGE[k][0], RANGE[k][1]);
    o.alphaLinked = p.alphaLinked === undefined ? DEF.alphaLinked : !!p.alphaLinked;
    o.seed = (num(p.seed, DEF.seed) >>> 0);
    return o;
  }
  /* mulberry32:带种子的确定性 PRNG,返回 [0,1) */
  function prng(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  /* 实际起作用的 α 倍数(诚实开关) */
  function alphaEff(p) { return p.kA * (p.alphaLinked ? 1 / p.kc : 1); }

  /* ---------- T1 宇宙命运:弗里德曼方程 ----------
   * (H/H0)² = E(a)² = Ωm/a³ + Ωk/a² + ΩΛ(忽略辐射;H0 = 真实宇宙今天的哈勃常数,时间单位 1/H0)。
   * 教学简化:在早期参考时刻 a_i = 0.1 让所有宇宙「起跑一样快」(膨胀速率与物理密度都取真实宇宙的值),
   * 只改引力(Ωm = Ω₀·kG,Ω ∝ G)与 Λ(ΩΛ = 0.685·kL);由此反推曲率项
   *   Ωk = (0.315 − Ωm)/a_i + a_i²·(0.685 − ΩΛ)。真实宇宙得 Ωk = 0(平直)。
   * 引力多一点 → 闭合、回缩;少一点 → 开放、膨胀更快。真实宇宙对此敏感得多(平直性问题),a_i 取 0.1 是为了让旋钮可玩。
   * 若 E² 在 a>0 处降到 0 → 到达最大尺度 a_max 后回缩(弗里德曼方程时间可逆,挤压时刻 = 2·t_turn)。 */
  var A_I = 0.1;
  function E2(a, om, ok, ol) { return om / (a * a * a) + ok / (a * a) + ol; }
  function findTurn(om, ok, ol) {
    /* 在 a ∈ (0, 1e4] 上找 E² 的第一个零点;找不到返回 0(永远膨胀) */
    var lo = 1e-4, hi, a = lo, step = 1.02;
    if (E2(lo, om, ok, ol) <= 0) return lo;
    while (a < 1e4) {
      var b = a * step;
      if (E2(b, om, ok, ol) <= 0) { hi = b; lo = a; break; }
      a = b;
    }
    if (!hi) return 0;
    for (var i = 0; i < 200; i++) { var m = 0.5 * (lo + hi); if (E2(m, om, ok, ol) > 0) lo = m; else hi = m; }
    return 0.5 * (lo + hi);
  }
  /* ∫₀^A da / (a·E(a)),单位 1/H0;用 a = A·u²(消去 a→0 端奇点),中点法 */
  function ageTo(A, om, ok, ol, n) {
    n = n || 4000;
    var s = 0, h = 1 / n;
    for (var i = 0; i < n; i++) {
      var u = (i + 0.5) * h, a = A * u * u, e2 = E2(a, om, ok, ol);
      if (e2 <= 0) continue;
      s += (2 * A * u) / (a * Math.sqrt(e2)) * h;
    }
    return s;
  }
  /* 到达 a_max 的时间:a = A(1 − x²),消去 a_max 端的平方根奇点 */
  function ageTurn(A, om, ok, ol, n) {
    n = n || 4000;
    var s = 0, h = 1 / n;
    for (var i = 0; i < n; i++) {
      var x = (i + 0.5) * h, a = A * (1 - x * x), e2 = E2(a, om, ok, ol);
      if (e2 <= 0 || a <= 0) continue;
      s += (2 * A * x) / (a * Math.sqrt(e2)) * h;
    }
    return s;
  }
  function fate(p) {
    var om = p.Om * p.kG, ol = K.OL0 * p.kL, ok = (K.OM0 - om) / A_I + A_I * A_I * (K.OL0 - ol);
    var aMax = findTurn(om, ok, ol);
    var r = { Om: om, OL: ol, Ok: ok, aI: A_I, aMax: aMax, fate: "expand", crunchGyr: null, ageGyr: null };
    if (aMax > 0) {
      r.fate = "crunch";
      r.crunchGyr = 2 * ageTurn(aMax, om, ok, ol) * HUBBLE_GYR;
      if (aMax > 1) r.ageGyr = ageTo(1, om, ok, ol) * HUBBLE_GYR;
    } else {
      r.ageGyr = ageTo(1, om, ok, ol) * HUBBLE_GYR;
      if (ol <= 0 && ok > 1e-12) r.fate = "coast";   // 无 Λ 的开宇宙:惯性滑行
    }
    return r;
  }

  /* ---------- T2 原初核合成(Rees《Just Six Numbers》第 4 章,阈值示意) ----------
   * ε < 0.006:氘不稳定,只有氢,聚变链断(T5 不点燃);ε > 0.008:双质子束缚,原初氢全部烧掉。
   * 氦质量分数 Y:真实 0.25,向两端线性插值(inferred,仅作画面元素条)。 */
  function nucleo(p) {
    var e = p.eps, Y;
    if (e <= 0.006) Y = 0;
    else if (e <= K.EPS0) Y = 0.25 * (e - 0.006) / (K.EPS0 - 0.006);
    else if (e < 0.008) Y = 0.25 + 0.75 * (e - K.EPS0) / (0.008 - K.EPS0);
    else Y = 1;
    return { Y: Y, X: 1 - Y, deuterium: e > 0.006, freeH: e < 0.008 };
  }

  /* ---------- T3 原子(沿用 2.0 第三幕 + 重核库仑稳定性) ----------
   * a₀ ∝ 1/α、电离能 ∝ α²、Hα ∝ α⁻²;最重稳定核 Z_max ≈ 82/α倍数(库仑排斥 ∝ αZ²/核力,示意)。 */
  function atoms(kA) {
    var ha = K.HALPHA_NM / (kA * kA);
    return {
      kA: kA, alpha: K.ALPHA * kA, a0pm: K.A0_PM / kA, ryEV: K.RY_EV * kA * kA, haNM: ha,
      haVisible: ha >= 380 && ha <= 750,
      zMax: Math.floor(K.Z_STABLE0 / kA), bondEV: K.BOND_EV * kA * kA
    };
  }

  /* ---------- T5 恒星点燃:质量窗口 ----------
   * 最小点燃质量与最大稳定质量都 ∝ (ħc/G)^1.5 / m_p² → ∝ G^-1.5(此处 c 只经 α 进入,见诚实开关)。
   * 恒星初始质量函数固定在 0.08–150 M☉(Salpeter dN/dM ∝ M^-2.35);能点燃的比例 = 落在窗口内的个数比例。 */
  function salpeterN(m1, m2) { var s = -1.35; return (Math.pow(m2, s) - Math.pow(m1, s)) / s; }
  function ignition(p) {
    var f = Math.pow(p.kG, -1.5), mMin = 0.08 * f, mMax = 150 * f;
    var lo = Math.max(K.IMF[0], mMin), hi = Math.min(K.IMF[1], mMax);
    var frac = hi > lo ? salpeterN(lo, hi) / salpeterN(K.IMF[0], K.IMF[1]) : 0;
    if (p.eps <= 0.006) frac = 0;      // 无氘:pp 链第一步走不通
    return { mMin: mMin, mMax: mMax, frac: frac };
  }

  /* ---------- 主序星(太阳为基准的同调标度) ----------
   * L = L☉·M³·kG⁴;R = R☉·M^0.8·kG;寿命 = 10 Gyr·(ε/0.007)·M⁻²·kG⁻⁴;T_eff 由 L = 4πR²σT⁴。 */
  function star(M, p) {
    var L = Math.pow(M, 3) * Math.pow(p.kG, 4), R = Math.pow(M, 0.8) * p.kG;
    var life = K.SUN_LIFE_GYR * (p.eps / K.EPS0) * Math.pow(M, -2) * Math.pow(p.kG, -4);
    var teff = K.TSUN * Math.pow(L / (R * R), 0.25);
    return { M: M, L: L, R: R, lifeGyr: life, teff: teff, rgb: bbRGB(teff) };
  }
  /* 黑体色温 → 近似 sRGB(0–1),Tanner Helland 拟合,1000–40000 K */
  function bbRGB(T) {
    var t = clamp(T, 1000, 40000) / 100, r, g, b;
    if (t <= 66) { r = 255; g = 99.4708025861 * Math.log(t) - 161.1195681661; }
    else { r = 329.698727446 * Math.pow(t - 60, -0.1332047592); g = 288.1221695283 * Math.pow(t - 60, -0.0755148492); }
    if (t >= 66) b = 255; else if (t <= 19) b = 0; else b = 138.5177312231 * Math.log(t - 10) - 305.0447927307;
    function c(x) { return Math.round(clamp(x, 0, 255)) / 255; }
    return [c(r), c(g), c(b)];
  }

  /* ---------- T7 恒星系(确定性生成) ----------
   * 行星半长轴按几何级数排列(间距比 1.5–2.0),整体 ∝ 1/kG(沿用 2.0 角动量守恒标度);
   * 平衡温度 T_eq = 255 K·L^¼/√a(Bond 反照率 0.3);T_eq > 150 K 为岩质,否则为气态;
   * 宜居(示意):岩质且 200 K ≤ T_eq ≤ 310 K。周期由开普勒第三定律 T = 2π√(a³/(G·kG·M))。 */
  function system(p, st, rnd) {
    var n = 2 + Math.floor(rnd() * 4);                        // 2–5 颗
    var a = (0.35 + 0.35 * rnd()) / p.kG, planets = [];
    var GM = K.G * p.kG * st.M * K.MSUN;
    for (var i = 0; i < n; i++) {
      var teq = 255 * Math.pow(st.L, 0.25) / Math.sqrt(a);
      var rocky = teq > 150, mE = rocky ? 0.1 + 1.9 * rnd() : 10 + 290 * rnd();
      var rE = rocky ? Math.pow(mE, 0.27) : Math.min(11.2, 4 * Math.pow(mE / 17, 0.25));
      var aM = a * K.AU_M;
      planets.push({
        id: "p" + (i + 1), aAU: a, a_m: aM, e: 0.005 + 0.05 * rnd(),
        mass_kg: mE * K.MEARTH, radius_m: rE * K.REARTH,
        period_s: 2 * Math.PI * Math.sqrt(aM * aM * aM / GM),
        teq_K: teq, kind: rocky ? "rocky" : "gas",
        habitable: rocky && teq >= 200 && teq <= 310,
        phase0_rad: 2 * Math.PI * rnd()
      });
      a *= 1.5 + 0.5 * rnd();
    }
    return planets;
  }

  /* ---------- 主入口:跑完 7 关 ---------- */
  var ORDER = ["T1", "T2", "T3", "T4", "T5", "T6", "T7"];
  function run(recipe) {
    var p = normalize(recipe), rnd = prng(p.seed);
    var st = {}, fails = [], warns = [];
    function mark(t, s, code) {
      if (!st[t] || rank(s) > rank(st[t])) st[t] = s;
      if (code) { if (s === "fail" && fails.indexOf(code) < 0) fails.push(code); if (s === "warn" && warns.indexOf(code) < 0) warns.push(code); }
    }
    for (var i = 0; i < ORDER.length; i++) st[ORDER[i]] = "ok";

    /* T1 */
    var f = fate(p);
    if (f.fate === "crunch") { if (f.crunchGyr < 1) mark("T1", "fail", "crunch"); else mark("T1", "warn", "crunch"); }
    /* T2 */
    var nu = nucleo(p);
    if (!nu.freeH) mark("T2", "fail", "helium_only");
    else if (!nu.deuterium) mark("T2", "warn", "hydrogen_only");
    /* T3 */
    var kA = alphaEff(p), at = atoms(kA);
    if (at.zMax < 6) mark("T3", "fail", "no_atoms");
    else if (at.zMax < 26) mark("T3", "warn", "few_elements");
    /* T4 星系:Q 窗口(Rees 第 8 章)+ Λ 过大来不及成团(Weinberg 1987,倍数阈值 inferred) */
    if (p.Q < 1e-6 || p.kL > 200) mark("T4", "fail", "cold");
    else if (p.Q < 3e-6 || p.kL > 50) mark("T4", "warn", "cold");
    if (p.Q > 1e-4) mark("T4", "fail", "bh_soup");
    else if (p.Q > 3e-5) mark("T4", "warn", "bh_soup");
    /* T5 */
    var ig = ignition(p);
    if (ig.frac < 0.01) mark("T5", "fail", "no_ignition");
    else if (ig.frac < 0.3) mark("T5", "warn", "no_ignition");
    /* 代表恒星:种子在 0.6–1.4 M☉(对数均匀)里取,再夹进点燃窗口 */
    var M = Math.exp(Math.log(0.6) + rnd() * Math.log(1.4 / 0.6));
    if (ig.frac > 0) M = clamp(M, Math.max(ig.mMin, K.IMF[0]) * 1.0001, Math.min(ig.mMax, K.IMF[1]) * 0.9999);
    var s = star(M, p);
    /* T6 */
    if (st.T5 !== "fail") {
      if (s.lifeGyr < 0.1) mark("T6", "fail", "flash");
      else if (s.lifeGyr < 1) mark("T6", "warn", "flash");
    }
    /* T7 */
    var planets = system(p, s, rnd);
    if (p.Q > 1e-4) mark("T7", "fail", "orbit_break");
    else if (p.Q > 3e-5) mark("T7", "warn", "orbit_break");
    var hz = planets.filter(function (q) { return q.habitable; });
    var tChem = hz.length ? hz[0].teq_K : 288;
    var chemRatio = at.bondEV / (K.KB_EV * tChem);              // 键能 / 热运动能
    if (chemRatio < 40) mark("T7", "fail", "chem_freeze");
    else if (chemRatio < 80) mark("T7", "warn", "chem_freeze");
    /* 上游失败传递到下游:没有恒星就没有恒星系 */
    var upstream = ["T1", "T2", "T3", "T4", "T5", "T6"].some(function (t) { return st[t] === "fail"; });
    if (upstream && st.T7 === "ok") st.T7 = "warn";

    var status = fails.length ? "fail" : (warns.length || ORDER.some(function (t) { return st[t] === "warn"; })) ? "warn" : "ok";
    return {
      recipe: p, alphaEff: kA, status: status, failures: fails, warnings: warns, stages: st,
      cosmos: f, nucleo: nu, atoms: at, ignition: ig, star: s, planets: planets,
      habitable: !fails.length && hz.length > 0 && s.lifeGyr >= 1
    };
  }
  function rank(s) { return s === "fail" ? 2 : s === "warn" ? 1 : 0; }

  /* 失败码 → 关卡(界面用) */
  var FAILURES = {
    crunch: "T1", helium_only: "T2", hydrogen_only: "T2", no_atoms: "T3", few_elements: "T3",
    cold: "T4", bh_soup: "T4", no_ignition: "T5", flash: "T6", orbit_break: "T7", chem_freeze: "T7"
  };

  var API = {
    K: K, DEF: DEF, RANGE: RANGE, ORDER: ORDER, FAILURES: FAILURES, HUBBLE_GYR: HUBBLE_GYR,
    normalize: normalize, prng: prng, alphaEff: alphaEff,
    fate: fate, nucleo: nucleo, atoms: atoms, ignition: ignition, star: star, bbRGB: bbRGB, run: run,
    _int: { E2: E2, findTurn: findTurn, ageTo: ageTo, ageTurn: ageTurn, salpeterN: salpeterN }
  };
  if (typeof module !== "undefined" && module.exports) module.exports = API; else root.NV3_UNIVERSE = API;
})(typeof window !== "undefined" ? window : this);
