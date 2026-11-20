/* 宙律 Nomoverse 3.0 · 场景数据接口 core/scene.js(3-2 起渲染层只读这里,不直接读物理量)
 * 纯函数、无 DOM、无 three:宇宙结果 run() → 可渲染的「场景描述」。同种子同结果,可在 Worker / node 里跑。
 * 渲染层(three r186,3-3 起)只做:按 desc 摆物体、每帧 orbitPos(t) 取位置、按 failVisual 换材质。
 * 视觉单位:轨道半径对数压缩到 [R_IN, R_OUT] 场景单位,行星大小开方压缩(教学简化,真实比例在 HUD 数字里)。 */
(function (root) {
  "use strict";
  var R_IN = 1.2, R_OUT = 9.0;          // 场景单位:第一颗与最外圈行星的显示半径
  var TAU = Math.PI * 2;

  /* 失败可视化(方案 §1.5 + §6.1:失败用红外伪彩、冷灰、霜,不用刺眼红)。mode 给渲染层选材质/后期 */
  var FAIL_VISUAL = {
    crunch:        { mode: "collapse",   palette: ["#c084fc", "#fb7185"], note: "空间回缩,星光蓝移后挤成一点" },
    helium_only:   { mode: "inert_gas",  palette: ["#cbd5e1", "#94a3b8"], note: "只有氦,恒星燃料不够" },
    hydrogen_only: { mode: "no_fusion",  palette: ["#94a3b8", "#64748b"], note: "没有氦起步,核合成卡住" },
    no_atoms:      { mode: "plasma",     palette: ["#c084fc", "#7c3aed"], note: "电子留不住,宇宙一直是等离子体" },
    few_elements:  { mode: "sparse",     palette: ["#cbd5e1", "#c084fc"], note: "元素周期表只剩前几行" },
    cold:          { mode: "frost",      palette: ["#dbe8ff", "#cbd5e1"], note: "物质散开没成团,一片冷雾" },
    bh_soup:       { mode: "black_hole", palette: ["#c084fc", "#0b0716"], note: "涨落太大,直接塌成黑洞汤" },
    no_ignition:   { mode: "dark_star",  palette: ["#7c2d12", "#c084fc"], note: "气团压不热,恒星不点燃" },
    flash:         { mode: "flash",      palette: ["#f5b971", "#c084fc"], note: "恒星烧得太快,行星来不及成形" },
    orbit_break:   { mode: "scatter",    palette: ["#c084fc", "#cbd5e1"], note: "近邻扰动太强,轨道被扯散" },
    chem_freeze:   { mode: "freeze",     palette: ["#dbe8ff", "#94a3b8"], note: "化学键太弱或太冷,分子拼不起来" }
  };
  var FAIL_STAGE = { crunch: "T1", helium_only: "T2", hydrogen_only: "T2", no_atoms: "T3", few_elements: "T3", cold: "T4", bh_soup: "T4", no_ignition: "T5", flash: "T6", orbit_break: "T7", chem_freeze: "T7" };
  var SEVERITY = ["crunch", "no_atoms", "bh_soup", "cold", "no_ignition", "helium_only", "hydrogen_only", "few_elements", "flash", "orbit_break", "chem_freeze"];

  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }

  /* 开普勒方程 M = E − e·sinE(牛顿迭代,e<0.99 收敛) */
  function kepler(M, e) {
    M = ((M % TAU) + TAU) % TAU;
    var E = e < 0.8 ? M : Math.PI;
    for (var i = 0; i < 12; i++) { var d = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E)); E -= d; if (Math.abs(d) < 1e-12) break; }
    return E;
  }

  /* 轨道半径映射:log(a) 线性映射到 [R_IN, R_OUT];所有行星共用同一映射,相对次序保持 */
  function radiusMap(planets) {
    if (!planets.length) return function () { return R_IN; };
    var lo = Math.log(planets[0].aAU), hi = Math.log(planets[planets.length - 1].aAU);
    var span = hi - lo || 1;
    return function (aAU) { return R_IN + (R_OUT - R_IN) * clamp((Math.log(aAU) - lo) / span, 0, 1); };
  }

  /* desc(res, budget):budget 用 /shared/3/tier.js 的 budget(tier) 返回值(只读 particles) */
  function describe(res, budget) {
    var particles = (budget && budget.particles) || 4096;
    var fails = res.failures.slice().sort(function (a, b) { return SEVERITY.indexOf(a) - SEVERITY.indexOf(b); });
    var primary = fails[0] || null;
    var starLit = res.stages.T5 !== "fail";
    var rmap = radiusMap(res.planets);
    var showPlanets = res.stages.T5 !== "fail" && res.stages.T6 !== "fail" && ["T1", "T3", "T4"].every(function (t) { return res.stages[t] !== "fail"; });
    var pYrRef = res.planets.length ? res.planets[0].period_s / 3.15576e7 : 1;

    var planets = showPlanets ? res.planets.map(function (q) {
      return {
        id: q.id, kind: q.kind, habitable: q.habitable,
        r: rmap(q.aAU), e: q.e, phase0: q.phase0_rad,
        size: 0.08 + 0.06 * Math.sqrt(q.radius_m / 6.371e6),      // 开方压缩,地球≈0.14
        periodYr: q.period_s / 3.15576e7,
        omegaVis: TAU / (q.period_s / 3.15576e7) * pYrRef,          // 显示角速度:最内圈 1 圈/显示年
        teq_K: q.teq_K,
        tint: q.habitable ? "#34d399" : q.kind === "gas" ? "#e9c779" : q.teq_K > 310 ? "#ff9a3c" : "#dbe8ff"
      };
    }) : [];

    var hz = null;
    if (showPlanets && res.planets.length) {
      /* 宜居带 200–310 K:teq ∝ L^¼ / √a → a = (255·L^¼/T)² AU */
      var L4 = Math.pow(res.star.L, 0.25);
      var aIn = Math.pow(255 * L4 / 310, 2), aOut = Math.pow(255 * L4 / 200, 2);
      hz = { rIn: rmap(aIn), rOut: rmap(aOut), aInAU: aIn, aOutAU: aOut };
    }

    return {
      v: 1, seed: res.recipe.seed, status: res.status, stages: res.stages,
      star: {
        lit: starLit, rgb: res.star.rgb, teff: res.star.teff,
        size: starLit ? clamp(0.35 * Math.pow(res.star.R, 0.5), 0.15, 1.2) : 0.3,
        glow: starLit ? clamp(0.6 + 0.25 * Math.log10(Math.max(res.star.L, 1e-6)), 0.1, 1.6) : 0.05
      },
      planets: planets, hz: hz,
      sky: {
        particles: particles,
        density: res.stages.T4 === "fail" ? 0.15 : res.stages.T4 === "warn" ? 0.5 : 1,
        fate: res.cosmos.fate
      },
      failVisual: primary ? Object.assign({ code: primary, stage: FAIL_STAGE[primary] }, FAIL_VISUAL[primary]) : null,
      warnCodes: res.warnings.slice()
    };
  }

  /* 每帧取行星位置:tVis 为显示年;返回场景坐标 [x, 0, z](轨道面 y=0) */
  function orbitPos(p, tVis) {
    var M = p.phase0 + p.omegaVis * tVis, E = kepler(M, p.e);
    var x = p.r * (Math.cos(E) - p.e), z = p.r * Math.sqrt(1 - p.e * p.e) * Math.sin(E);
    return [x, 0, z];
  }

  /* 星空背景粒子:同种子同分布(球面均匀 + 星等),长度 = budget.particles */
  function skyField(seed, n, prng) {
    var rnd = prng((seed ^ 0x5eed) >>> 0), out = new Float32Array(n * 4);
    for (var i = 0; i < n; i++) {
      var u = 2 * rnd() - 1, ph = TAU * rnd(), s = Math.sqrt(1 - u * u), R = 60 + 40 * rnd();
      out[i * 4] = R * s * Math.cos(ph); out[i * 4 + 1] = R * u; out[i * 4 + 2] = R * s * Math.sin(ph);
      out[i * 4 + 3] = Math.pow(rnd(), 3);                         // 亮度,少数亮星
    }
    return out;
  }

  var API = { describe: describe, orbitPos: orbitPos, kepler: kepler, skyField: skyField, FAIL_VISUAL: FAIL_VISUAL, SEVERITY: SEVERITY, R_IN: R_IN, R_OUT: R_OUT };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  else root.NV3_SCENE = API;
})(typeof self !== "undefined" ? self : this);
