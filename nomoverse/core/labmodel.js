/* 宙律 Nomoverse · 规则改写台(v0.8-α1;v0.8-α2 加光速、潮汐)物理模型 —— 只算数,不画图。
   浏览器:window.NVLab;Node:module.exports(tests/physics.test.js 校验)。
   三个实验都遵守「A/B 对照只改一个变量」:A = 现实(地球 / 干燥沥青 / 空气),B = 改写后。 */
(function (root) {
  "use strict";
  var D2R = Math.PI / 180, G0 = 9.81;

  /* ---------- 重力:抛体(同高度出手与落点,不计空气) ---------- */
  function shot(v, angDeg, g) {
    var a = angDeg * D2R, vx = v * Math.cos(a), vy = v * Math.sin(a);
    var T = 2 * vy / g;
    return { R: vx * T, H: vy * vy / (2 * g), T: T, vx: vx, vy: vy, g: g };
  }
  /* 篮筐水平距离 = 地球上这一投的射程(A 必进);B 落点与篮筐差 < 0.25 m 才算进 */
  var HOOP_TOL = 0.25;

  /* ---------- 摩擦:停车距离 = 反应距离 + 制动距离 v²/(2μg) ---------- */
  function stop(kmh, mu, tr, g) {
    g = g || G0;
    var v = kmh / 3.6, react = v * tr, brake = v * v / (2 * mu * g);
    return { v: v, react: react, brake: brake, total: react + brake, tBrake: v / (mu * g), tTotal: tr + v / (mu * g), mu: mu };
  }
  var STOP_LINE = 30;   // 前方 30 m 处有路口停止线

  /* ---------- 声速:多普勒与马赫锥(声源运动、听者静止) ---------- */
  function sound(c, v, f) {
    var M = v / c, sup = v > c;
    return {
      c: c, v: v, f: f, M: M, sup: sup,
      fNear: sup ? Infinity : f * c / (c - v),          // 迎面驶来
      fFar: f * c / (c + v),                              // 驶离
      cone: sup ? Math.asin(c / v) / D2R : null           // 马赫锥半顶角(度)
    };
  }

  /* ---------- 光速:信号延迟 t = d / c;洛伦兹因子 γ = 1/√(1 − v²/c²) ---------- */
  var C_REAL = 299792458, LAG_OK = 0.15;              // ITU-T G.114:单程 ≤ 150 ms 通话基本无感
  function light(c, dkm, v) {
    var t = dkm * 1000 / c, b = v / c, ok = b < 1;
    return { c: c, d: dkm, v: v, t: t, rt: 2 * t, beta: b, ok: ok, gamma: ok ? 1 / Math.sqrt(1 - b * b) : Infinity, g1: ok ? (b < 1e-4 ? 0.5 * b * b : 1 / Math.sqrt(1 - b * b) - 1) : Infinity };
  }

  /* ---------- 潮汐:引潮加速度 2GMr/d³;平衡潮差 1.5·(M/M⊕)(R/d)³·R;洛希极限(流体)2.44·R⊕·(ρ⊕/ρ☾)^(1/3) ---------- */
  var GM_E = 3.986004418e14, GM_M = 4.9028e12, R_E = 6.371e6, D_M = 3.844e8, RHO_E = 5.514, RHO_M = 3.344;
  var ROCHE = 2.44 * R_E * Math.pow(RHO_E / RHO_M, 1 / 3);        // m(月球密度不变时与月球质量无关)
  function tidal(m, dwkm) {
    var d = dwkm * 1e7, GM = GM_M * m;
    return { m: m, d: d, acc: 2 * GM * R_E / (d * d * d), range: 1.5 * GM / GM_E * Math.pow(R_E / d, 3) * R_E, rel: m * Math.pow(D_M / d, 3), roche: ROCHE, broken: d < ROCHE };
  }

  /* ---------- 三个实验的参数、预设与对照 ---------- */
  var LABS = {
    gravity: {
      id: "nv.lab.gravity", name: "重力", vary: "g", def: "moon",
      question: "如果月球上的重力只有地球的 1/6,同样的投篮会飞多远?",
      formula: "R = v² · sin2θ / g",
      params: [
        { k: "g", label: "重力 g", min: 0.5, max: 30, step: 0.01, unit: "m/s²", dp: 2, log: true },
        { k: "v", label: "出手速度", min: 3, max: 12, step: 0.1, unit: "m/s", dp: 1 },
        { k: "ang", label: "出手角度", min: 20, max: 75, step: 1, unit: "°", dp: 0 }
      ],
      base: { g: 9.81, v: 7.5, ang: 52 },
      presets: [
        { id: "earth", label: "地球", set: { g: 9.81 }, tag: "地球 1 g", env: "earth" },
        { id: "moon", label: "月球", set: { g: 1.62 }, tag: "月球 0.17 g", env: "moon" },
        { id: "mars", label: "火星", set: { g: 3.71 }, tag: "火星 0.38 g", env: "mars" },
        { id: "jupiter", label: "木星", set: { g: 24.79 }, tag: "木星云顶 2.5 g", env: "jupiter" },
        { id: "g2x", label: "引力 ×2", set: { g: 19.62 }, tag: "荒谬宇宙 2 g", env: "g2x" }
      ]
    },
    friction: {
      id: "nv.lab.friction", name: "摩擦", vary: "mu", def: "ice",
      question: "路面结冰时,同样车速要多远才能停下?",
      formula: "d = v·t反应 + v² / (2μg)",
      params: [
        { k: "mu", label: "摩擦系数 μ", min: 0.05, max: 1, step: 0.01, unit: "", dp: 2, log: true },
        { k: "kmh", label: "车速", min: 20, max: 120, step: 1, unit: "km/h", dp: 0 },
        { k: "tr", label: "反应时间", min: 0.5, max: 2.5, step: 0.1, unit: "s", dp: 1 }
      ],
      base: { mu: 0.7, kmh: 50, tr: 1.0 },
      presets: [
        { id: "dry", label: "干燥", set: { mu: 0.7 }, tag: "干燥沥青", env: "dry" },
        { id: "wet", label: "湿滑", set: { mu: 0.4 }, tag: "湿滑路面", env: "wet" },
        { id: "ice", label: "结冰", set: { mu: 0.1 }, tag: "冰面", env: "ice" },
        { id: "speed20", label: "车速 +20%", set: { kmh: 60 }, vary: "kmh", tag: "车速 60 km/h", env: "dry" }
      ]
    },
    sound: {
      id: "nv.lab.sound", name: "声速", vary: "c", def: "slow",
      question: "如果声音变慢,救护车会追上自己的声音吗?",
      formula: "f′ = f · c / (c ∓ v);sin θ = c / v",
      params: [
        { k: "c", label: "声速 c", min: 5, max: 1600, step: 1, unit: "m/s", dp: 0, log: true },
        { k: "v", label: "车速", min: 0, max: 60, step: 1, unit: "m/s", dp: 0 },
        { k: "f", label: "警笛频率", min: 200, max: 1500, step: 10, unit: "Hz", dp: 0 }
      ],
      base: { c: 343, v: 25, f: 700 },
      presets: [
        { id: "air", label: "空气 343", set: { c: 343 }, tag: "空气(20 °C)", env: "air" },
        { id: "water", label: "水 1480", set: { c: 1480 }, tag: "水中", env: "water" },
        { id: "helium", label: "氦气 1007", set: { c: 1007 }, tag: "氦气", env: "helium" },
        { id: "slow", label: "慢声速", set: { c: 20 }, tag: "假想慢声速", env: "slow" }
      ]
    },
    light: {
      id: "nv.lab.light", name: "光速", vary: "c", def: "real",
      question: "如果光速只有每秒 10 米,打电话会怎样?",
      formula: "t = d / c;γ = 1 / √(1 − v²/c²)",
      params: [
        { k: "c", label: "光速 c", min: 1, max: 299792458, step: 1, unit: "m/s", dp: 0, log: true },
        { k: "d", label: "通话距离", min: 1, max: 4e8, step: 1, unit: "km", dp: 0, log: true },
        { k: "v", label: "你的速度", min: 0, max: 8, step: 0.1, unit: "m/s", dp: 1 }
      ],
      base: { c: C_REAL, d: 1000, v: 5 },
      presets: [
        { id: "real", label: "现实", set: { c: C_REAL }, tag: "真空光速", env: "city" },
        { id: "moon", label: "打到月球", set: { d: 384400 }, vary: "d", tag: "地月 38.44 万 km", env: "moon" },
        { id: "mars", label: "打到火星", set: { d: 2.25e8 }, vary: "d", tag: "地火平均 2.25 亿 km", env: "mars" },
        { id: "slowc", label: "光速 10 m/s", set: { c: 10 }, tag: "假想慢光速", env: "city" }
      ]
    },
    tide: {
      id: "nv.lab.tide", name: "潮汐", vary: "d", def: "now",
      question: "月亮再近一点,潮水会涨多高?",
      formula: "a潮 = 2GMr / d³;d洛希 = 2.44·R⊕·(ρ⊕/ρ☾)^⅓",
      params: [
        { k: "d", label: "地月距离", min: 1.2, max: 100, step: 0.01, unit: "万 km", dp: 2, log: true },
        { k: "m", label: "月球质量", min: 0.1, max: 10, step: 0.01, unit: "× 月球", dp: 2, log: true }
      ],
      base: { d: 38.44, m: 1 },
      presets: [
        { id: "now", label: "今天", set: { d: 38.44 }, tag: "今天 38.44 万 km", env: "now" },
        { id: "early", label: "月亮刚形成", set: { d: 2.55 }, tag: "约 4 个地球半径(推测)", env: "early" },
        { id: "m2x", label: "月球 ×2", set: { m: 2 }, vary: "m", tag: "质量 ×2、密度不变", env: "now" },
        { id: "roche", label: "洛希极限内", set: { d: 1.7 }, tag: "1.7 万 km", env: "roche" }
      ]
    }
  };
  function sci(x, n) { if (!isFinite(x)) return "—"; if (x === 0) return "0"; var e = Math.floor(Math.log10(Math.abs(x))), m = x / Math.pow(10, e); if (+m.toFixed(n || 2) >= 10) { m /= 10; e++; } var SUP = "⁰¹²³⁴⁵⁶⁷⁸⁹"; return m.toFixed(n == null ? 2 : n) + "×10" + (e < 0 ? "⁻" : "") + String(Math.abs(e)).split("").map(function (d) { return SUP[+d]; }).join(""); }
  function fmtT(t) {
    if (!isFinite(t)) return "—";
    if (t < 1e-3) return (+(t * 1e6).toPrecision(3)) + " µs"; if (t < 1) return (+(t * 1e3).toPrecision(3)) + " ms";
    if (t < 120) return (+t.toPrecision(3)) + " s"; if (t < 7200) return (+(t / 60).toPrecision(3)) + " 分钟";
    if (t < 172800) return (+(t / 3600).toPrecision(3)) + " 小时"; if (t < 3.156e7 * 2) return (+(t / 86400).toPrecision(3)) + " 天";
    return (+(t / 3.156e7).toPrecision(3)) + " 年";
  }
  function bigX(r) { if (!isFinite(r) || r <= 0) return "—"; if (r >= 1e8) return (+(r / 1e8).toPrecision(3)) + " 亿"; if (r >= 1e4) return (+(r / 1e4).toPrecision(3)) + " 万"; return ratioTxt(r); }
  function cTxt(c) { return c >= 1e6 ? sci(c, 2) + " m/s" : M2(c) + " m/s"; }
  function M2(x) { return (+x.toPrecision(3)).toString(); }
  function dTxt(km) { return km >= 1e8 ? (+(km / 1e8).toPrecision(3)) + " 亿 km" : km >= 1e4 ? (+(km / 1e4).toPrecision(4)) + " 万 km" : M2(km) + " km"; }
  function gTxt(L) { return !L.ok ? "γ:v ≥ c 不可能" : L.g1 < 1e-4 ? "γ ≈ 1 + " + sci(L.g1, 1) : "γ = " + L.gamma.toFixed(3); }
  function rangeTxt(m) { return m >= 1000 ? (+(m / 1000).toPrecision(3)) + " km" : m >= 10 ? Math.round(m) + " m" : (+m.toPrecision(3)) + " m"; }

  function preset(lab, pid) {
    var L = LABS[lab]; if (!L) return null;
    for (var i = 0; i < L.presets.length; i++) if (L.presets[i].id === pid) return L.presets[i];
    for (var j = 0; j < L.presets.length; j++) if (L.presets[j].id === L.def) return L.presets[j];
    return L.presets[0];
  }
  /* 由基准参数 + 预设得到 A / B 两组参数(只差 vary 一个变量) */
  function pair(lab, pid, base) {
    var L = LABS[lab], P = preset(lab, pid), vary = P.vary || L.vary, A = {}, B = {}, k;
    for (k in L.base) A[k] = base && base[k] != null ? +base[k] : L.base[k];
    A[vary] = L.base[vary];                                     // A 永远是现实
    for (k in A) B[k] = A[k];
    B[vary] = base && base["b_" + vary] != null ? +base["b_" + vary] : P.set[vary];
    return { A: A, B: B, vary: vary, preset: P };
  }

  /* ---------- 计算结果 + 读数卡文字 ---------- */
  function fmt(x, dp) { if (!isFinite(x)) return "—"; var a = Math.abs(x); if (dp == null) dp = a >= 100 ? 0 : a >= 10 ? 1 : a >= 1 ? 1 : 2; return (+x.toFixed(dp)).toString(); }
  function ratioTxt(r) { if (!isFinite(r) || r <= 0) return "—"; return r >= 10 ? r.toFixed(0) : r >= 1.95 ? r.toFixed(1) : r.toFixed(2); }

  function evaluate(lab, A, B) {
    if (lab === "gravity") {
      var a = shot(A.v, A.ang, A.g), b = shot(B.v, B.ang, B.g), hoop = a.R;
      var inB = Math.abs(b.R - hoop) < HOOP_TOL;
      return { a: a, b: b, hoop: hoop, ratio: b.R / a.R, key: "R",
        A: ["g = " + fmt(A.g, 2), "射程 " + fmt(a.R) + " m", "升高 " + fmt(a.H) + " m", "进筐 ✓"],
        B: ["g = " + fmt(B.g, 2), "射程 " + fmt(b.R) + " m", "升高 " + fmt(b.H) + " m", inB ? "进筐 ✓" : (b.R > hoop ? "飞过篮板" : "够不着篮筐")],
        bOk: inB, summary: "射程 ×" + ratioTxt(b.R / a.R),
        line: Math.abs(B.g - A.g) < 1e-9 ? "现在 A、B 一样:选一个星球,或拧动重力旋钮。" : "只改 g:射程与 g 成反比 → 射程约是地球的 " + ratioTxt(b.R / a.R) + " 倍" };
    }
    if (lab === "friction") {
      var sa = stop(A.kmh, A.mu, A.tr), sb = stop(B.kmh, B.mu, B.tr), okA = sa.total <= STOP_LINE, okB = sb.total <= STOP_LINE;
      var rb = sb.brake / sa.brake, which = B.kmh !== A.kmh ? "车速" : "μ";
      return { a: sa, b: sb, line0: STOP_LINE, ratio: rb, key: "brake",
        A: [which === "μ" ? "μ = " + fmt(A.mu, 2) : fmt(A.kmh, 0) + " km/h", "制动 " + fmt(sa.brake) + " m", "总停车 " + fmt(sa.total) + " m", okA ? "停在线前 ✓" : "冲过路口"],
        B: [which === "μ" ? "μ = " + fmt(B.mu, 2) : fmt(B.kmh, 0) + " km/h", "制动 " + fmt(sb.brake) + " m", "总停车 " + fmt(sb.total) + " m", okB ? "停在线前 ✓" : "冲过路口"],
        bOk: okB, summary: "制动 ×" + ratioTxt(rb),
        line: Math.abs(rb - 1) < 1e-9 ? "现在 A、B 一样:选一种路面,或拧动摩擦旋钮。"
          : which === "μ" ? "只改 μ:制动距离与 μ 成反比 → 制动距离约是干燥沥青的 " + ratioTxt(rb) + " 倍"
          : "只改车速:制动距离与 v² 成正比 → 快 " + Math.round((B.kmh / A.kmh - 1) * 100) + "%,制动距离 ×" + ratioTxt(rb) };
    }
    if (lab === "light") {
      var la = light(A.c, A.d, A.v), lb = light(B.c, B.d, B.v), rl = lb.t / la.t, which2 = Math.abs(B.c - A.c) > 1e-9 ? "c" : "d";
      var okLa = la.t <= LAG_OK, okLb = lb.t <= LAG_OK;
      function card(c, L, ok) { return ["c = " + cTxt(c), dTxt(L.d) + " · 单程 " + fmtT(L.t), "一来一回 " + fmtT(L.rt), ok ? "通话顺畅 ✓" : "要等 " + fmtT(L.rt) + " 才听到回话"]; }
      return { a: la, b: lb, ratio: rl, key: "t",
        A: card(A.c, la, okLa).concat([gTxt(la)]), B: card(B.c, lb, okLb).concat([gTxt(lb)]),
        bOk: okLb, summary: "单程 " + fmtT(lb.t),
        line: Math.abs(rl - 1) < 1e-9 ? "现在 A、B 一样:选一个预设,或拧动光速旋钮。"
          : which2 === "c" ? "只改 c:延迟与 c 成反比 → 单程 " + fmtT(lb.t) + "(现实 " + fmtT(la.t) + ")" + (lb.ok && lb.g1 >= 1e-4 ? ";你以 " + M2(B.v) + " m/s 运动,γ = " + lb.gamma.toFixed(3) + ",钟慢效应肉眼可见" : "")
          : "只改距离:延迟与 d 成正比 → 单程 " + fmtT(lb.t) + ",一来一回 " + fmtT(lb.rt) };
    }
    if (lab === "tide") {
      var ta = tidal(A.m, A.d), tb = tidal(B.m, B.d), rt = tb.acc / ta.acc;
      function tcard(m, T) { return ["d = " + (+(T.d / 1e7).toPrecision(4)) + " 万 km · M ×" + M2(m), "引潮加速度 " + sci(T.acc, 2) + " m/s²", "平衡潮差 " + rangeTxt(T.range), T.broken ? "进了洛希极限:被撕碎成环" : "月亮完好 ✓"]; }
      return { a: ta, b: tb, ratio: rt, key: "acc",
        A: tcard(A.m, ta), B: tcard(B.m, tb),
        bOk: !tb.broken, summary: tb.broken ? "撕碎成环" : "潮汐 ×" + bigX(rt),
        line: Math.abs(rt - 1) < 1e-9 ? "现在 A、B 一样:选一个预设,或拧动距离旋钮。"
          : Math.abs(B.m - A.m) > 1e-9 ? "只改质量:潮汐与 M 成正比 → 潮汐 ×" + bigX(rt) + ";洛希极限不变(" + M2(ROCHE / 1e7) + " 万 km,只看密度)"
          : tb.broken ? "只改距离:进了洛希极限(" + M2(ROCHE / 1e7) + " 万 km),引潮力胜过月亮自身引力 → 月亮被撕碎,铺成光环"
          : "只改距离:潮汐与 1/d³ 成正比 → 距离 ×" + ratioTxt(B.d / A.d) + ",潮汐 ×" + bigX(rt) };
    }
    var xa = sound(A.c, A.v, A.f), xb = sound(B.c, B.v, B.f);
    var shA = (xa.fNear - A.f) / A.f, shB = xb.sup ? Infinity : (xb.fNear - B.f) / B.f;
    return { a: xa, b: xb, ratio: shB / shA, key: "shift",
      A: ["c = " + fmt(A.c, 0) + " m/s", "靠近 " + fmt(xa.fNear, 0) + " Hz", "远离 " + fmt(xa.fFar, 0) + " Hz", "马赫 " + fmt(xa.M, 2)],
      B: xb.sup ? ["c = " + fmt(B.c, 0) + " m/s", "车比声快", "马赫 " + fmt(xb.M, 2), "出现马赫锥 " + fmt(xb.cone, 0) + "°"]
        : ["c = " + fmt(B.c, 0) + " m/s", "靠近 " + fmt(xb.fNear, 0) + " Hz", "远离 " + fmt(xb.fFar, 0) + " Hz", "马赫 " + fmt(xb.M, 2)],
      bOk: !xb.sup,
      summary: xb.sup ? "马赫锥 " + fmt(xb.cone, 0) + "°" : "靠近 +" + (shB * 100).toFixed(1) + "%",
      line: xb.sup ? "只改 c:c < v 时波纹叠成锥 → 前方听不到,锥扫过时一声巨响"
        : Math.abs(B.c - A.c) < 1e-9 ? "现在 A、B 一样:换一种介质,或拧动声速旋钮。"
        : "只改 c:声速越快,音调变化越小 → 靠近时升高 " + (shB * 100).toFixed(1) + "%(空气 " + (shA * 100).toFixed(1) + "%)" };
  }

  /* ---------- 先猜再看:随当前 A/B 生成三个选项 ---------- */
  function predict(lab, A, B) {
    var E = evaluate(lab, A, B);
    if (lab === "sound") {
      if (E.b.sup) return { q: "先猜再看:你猜声速降到 " + fmt(B.c, 0) + " m/s,前方的人会听到?", options: ["更高的警笛", "什么也听不到,然后一声巨响", "和原来一样"], answer: 1 };
      if (Math.abs(B.c - A.c) < 1e-9) return null;
      var r = E.ratio; return { q: "先猜再看:换成这种声速,救护车靠近时的音调变化比空气里……", options: ["更大", "差不多", "更小"], answer: r > 1.25 ? 0 : r < 0.8 ? 2 : 1 };
    }
    if (lab === "light") {
      if (Math.abs(E.ratio - 1) < 0.02) return null; var tb2 = E.b.t;
      return { q: "先猜再看:" + (Math.abs(B.c - A.c) > 1e-9 ? "光速改成 " + cTxt(B.c) + "," + dTxt(B.d) + " 外的朋友要多久才听到你?" : "打到 " + dTxt(B.d) + " 外,对方要多久才听到你?"),
        options: [fmtT(tb2 / 10), fmtT(tb2), fmtT(tb2 * 10)], answer: 1 };
    }
    if (lab === "tide") {
      if (Math.abs(E.ratio - 1) < 0.02) return null;
      if (E.b.broken) return { q: "先猜再看:把月亮放到 " + M2(B.d) + " 万 km,会发生什么?", options: ["潮水涨一点,一切照旧", "潮水涨成高山,月亮完好", "月亮被潮汐撕碎,铺成光环"], answer: 2 };
      var r3 = E.ratio, o3 = r3 > 1 ? [Math.sqrt(r3), r3, r3 * r3] : [r3 * r3, r3, Math.sqrt(r3)];
      return { q: "先猜再看:你猜 B 的潮汐是 A 的几倍?", options: o3.map(function (x) { return "≈ " + bigX(x) + " 倍"; }), answer: 1 };
    }
    var rr = E.ratio; if (!isFinite(rr) || Math.abs(rr - 1) < 0.02) return null;
    var q = lab === "gravity" ? "先猜再看:你猜 B 的射程是 A 的几倍?" : "先猜再看:你猜 B 的制动距离是 A 的几倍?";
    var c = rr > 1 ? [Math.sqrt(rr), rr, rr * rr] : [rr * rr, rr, Math.sqrt(rr)];
    return { q: q, options: c.map(function (x) { return "≈ " + ratioTxt(x) + " 倍"; }), answer: 1 };
  }

  /* ---------- 模型自动校验(参考值来自效果图与教科书公式复算) ---------- */
  var CHECKS = [
    { lab: "gravity", label: "地球 v7.5 m/s 52°:射程 5.56 m", f: function () { return shot(7.5, 52, 9.81).R; }, expect: 5.5637, tol: 0.002 },
    { lab: "gravity", label: "月球射程 ×6.06", f: function () { return shot(7.5, 52, 1.62).R / shot(7.5, 52, 9.81).R; }, expect: 6.0556, tol: 0.001 },
    { lab: "gravity", label: "地球升高 1.78 m", f: function () { return shot(7.5, 52, 9.81).H; }, expect: 1.7814, tol: 0.003 },
    { lab: "friction", label: "干燥 50 km/h:总停车 28.0 m", f: function () { return stop(50, 0.7, 1).total; }, expect: 27.94, tol: 0.003 },
    { lab: "friction", label: "冰面 μ0.1:制动 98.3 m", f: function () { return stop(50, 0.1, 1).brake; }, expect: 98.32, tol: 0.003 },
    { lab: "friction", label: "车速 +20%:制动 ×1.44", f: function () { return stop(60, 0.7, 1).brake / stop(50, 0.7, 1).brake; }, expect: 1.44, tol: 0.001 },
    { lab: "sound", label: "空气 25 m/s:靠近 755 Hz", f: function () { return sound(343, 25, 700).fNear; }, expect: 755.03, tol: 0.001 },
    { lab: "sound", label: "空气:远离 652 Hz", f: function () { return sound(343, 25, 700).fFar; }, expect: 652.45, tol: 0.001 },
    { lab: "sound", label: "慢声速 20 m/s:马赫锥 53.1°", f: function () { return sound(20, 25, 700).cone; }, expect: 53.13, tol: 0.001 },
    { lab: "light", label: "地月单程 1.28 s", f: function () { return light(C_REAL, 384400, 5).t; }, expect: 1.2822, tol: 0.001 },
    { lab: "light", label: "地火平均单程 12.5 分钟", f: function () { return light(C_REAL, 2.25e8, 5).t / 60; }, expect: 12.509, tol: 0.001 },
    { lab: "light", label: "光速 10 m/s:1000 km 单程 27.8 小时", f: function () { return light(10, 1000, 5).t / 3600; }, expect: 27.778, tol: 0.001 },
    { lab: "light", label: "光速 10 m/s、骑车 5 m/s:γ = 1.155", f: function () { return light(10, 1000, 5).gamma; }, expect: 1.1547, tol: 0.001 },
    { lab: "tide", label: "今天:引潮加速度 1.10×10⁻⁶ m/s²", f: function () { return tidal(1, 38.44).acc; }, expect: 1.1000e-6, tol: 0.003 },
    { lab: "tide", label: "今天:平衡潮差 0.54 m", f: function () { return tidal(1, 38.44).range; }, expect: 0.5352, tol: 0.002 },
    { lab: "tide", label: "距离减半:潮汐 ×8", f: function () { return tidal(1, 19.22).acc / tidal(1, 38.44).acc; }, expect: 8, tol: 1e-6 },
    { lab: "tide", label: "洛希极限(流体)1.84 万 km", f: function () { return ROCHE / 1e3; }, expect: 18365, tol: 0.001 }
  ];
  function selfCheck(lab) {
    var n = 0, ok = 0, rows = [];
    CHECKS.forEach(function (c) { if (lab && c.lab !== lab) return; n++; var y = c.f(), pass = Math.abs(y - c.expect) <= Math.abs(c.expect) * c.tol; if (pass) ok++; rows.push({ label: c.label, got: y, expect: c.expect, pass: pass }); });
    return { n: n, ok: ok, rows: rows };
  }

  var API = { shot: shot, stop: stop, sound: sound, light: light, tidal: tidal, ROCHE: ROCHE, C_REAL: C_REAL, LAG_OK: LAG_OK, fmtT: fmtT, sci: sci, bigX: bigX, LABS: LABS, preset: preset, pair: pair, evaluate: evaluate, predict: predict, selfCheck: selfCheck, CHECKS: CHECKS, STOP_LINE: STOP_LINE, HOOP_TOL: HOOP_TOL, fmt: fmt, ratioTxt: ratioTxt };
  if (typeof module !== "undefined" && module.exports) module.exports = API; else root.NVLab = API;
})(typeof window !== "undefined" ? window : this);
