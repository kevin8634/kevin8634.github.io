/* 宙律 Nomoverse 3.0 · GUS v0(Genesis Universe Spec)宇宙侧数据层(3-1 纯函数层,零依赖)
 * 浏览器 window.NV3_GUS / node require。规格见云盘「02_宙律 Nomoverse/开发文档/3.0/」方案 v0.3 §3。
 * 本文件只做:run() 结果 → GUS 对象、GUS → 配方、范围校验、无压缩 JSON 的 base64url 编解码(前缀 "j.")。
 * URL 压缩(deflate-raw)、同源存储读写、版本协商等通用接口等 /shared/3/gus.js 就绪后接入,不在此实现。 */
(function (root) {
  "use strict";
  var VERSION = "0.1";
  var MSUN = 1.98847e30, LSUN = 3.828e26, RSUN = 6.957e8;
  var SI = { G: 6.67430e-11, c: 299792458, alpha: 7.2973525693e-3, Lambda: 1.1056e-52 };

  function r6(x) { return x === null || x === undefined ? x : Number(Number(x).toPrecision(6)); }
  function hashId(str) {                    // FNV-1a 32 位 → 8 位十六进制
    var h = 0x811c9dc5;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    return ("0000000" + h.toString(16)).slice(-8);
  }
  function cleanName(s) { return String(s || "").replace(/[\u0000-\u001f<>]/g, "").slice(0, 40); }

  /* res = NV3_UNIVERSE.run(recipe) 的结果;meta = { name:{zh,en}, created: ISO 字符串 }(可选) */
  function toGUS(res, meta) {
    meta = meta || {};
    var p = res.recipe, s = res.star;
    var recipeKey = JSON.stringify([p.kG, p.kc, p.kA, p.alphaLinked, p.eps, p.Q, p.kL, p.Om, p.seed]);
    var g = {
      gus: VERSION, kind: "universe", id: "nv-" + hashId(recipeKey),
      name: { zh: cleanName(meta.name && meta.name.zh), en: cleanName(meta.name && meta.name.en) },
      created: meta.created || null,
      generator: { world: "nv", app: "nomoverse/3", model: "universe@0.1.0" },
      seed: p.seed,
      constants: {
        G: { k: p.kG, si: r6(SI.G * p.kG), unit: "m^3 kg^-1 s^-2" },
        c: { k: p.kc, si: r6(SI.c * p.kc), unit: "m s^-1", alphaLinked: p.alphaLinked },
        alpha: { k: p.kA, si: r6(SI.alpha * res.alphaEff), unit: "1", effectiveK: r6(res.alphaEff) },
        epsilon: { k: r6(p.eps / 0.007), si: p.eps, unit: "1" },
        Q: { k: r6(p.Q / 1e-5), si: p.Q, unit: "1" },
        Lambda: { k: p.kL, si: r6(SI.Lambda * p.kL), unit: "m^-2" },
        Omega0: { k: r6(p.Om / 0.315), si: p.Om, unit: "1" }
      },
      derived: {
        status: res.status, failures: res.failures.slice(), warnings: res.warnings.slice(), fate: res.cosmos.fate,
        age_s: res.cosmos.ageGyr === null ? null : r6(res.cosmos.ageGyr * 3.15576e16),
        crunch_s: res.cosmos.crunchGyr === null ? null : r6(res.cosmos.crunchGyr * 3.15576e16),
        starLife_s: r6(s.lifeGyr * 3.15576e16),
        bohrRadius_m: r6(res.atoms.a0pm * 1e-12), hAlpha_m: r6(res.atoms.haNM * 1e-9),
        heliumY: r6(res.nucleo.Y), habitable: res.habitable,
        stages: JSON.parse(JSON.stringify(res.stages))
      },
      system: {
        star: { mass_kg: r6(s.M * MSUN), lum_W: r6(s.L * LSUN), radius_m: r6(s.R * RSUN), teff_K: r6(s.teff), rgb: s.rgb.map(r6) },
        planets: res.planets.map(function (q) {
          return { id: q.id, a_m: r6(q.a_m), e: r6(q.e), mass_kg: r6(q.mass_kg), radius_m: r6(q.radius_m), period_s: r6(q.period_s),
            teq_K: r6(q.teq_K), kind: q.kind, habitable: q.habitable, phase0_rad: r6(q.phase0_rad) };
        })
      },
      render: renderHints(res),
      simplified: true,
      sources: "https://kevin8634.github.io/nomoverse/3/SOURCES.md"
    };
    return g;
  }
  /* 画面提示:天空色调随命运、星密度随点燃比例与 Q、星云随氢丰度 */
  function renderHints(res) {
    var dens = Math.max(0, Math.min(4, res.ignition.frac / 0.98 * Math.pow(res.recipe.Q / 1e-5, 0.5)));
    var tint = res.cosmos.fate === "crunch" ? [0.16, 0.06, 0.08] : res.failures.indexOf("cold") >= 0 ? [0.03, 0.04, 0.07] : [0.05, 0.06, 0.15];
    return { skyTint: tint, starDensity: r6(dens), nebula: r6(0.4 * res.nucleo.X / 0.75), quality: "auto" };
  }
  /* GUS → 配方(供宙律复现;天枢不需要) */
  function toRecipe(g) {
    var c = g.constants;
    return { kG: c.G.k, kc: c.c.k, kA: c.alpha.k, alphaLinked: !!c.c.alphaLinked, eps: c.epsilon.si, Q: c.Q.si, kL: c.Lambda.k, Om: c.Omega0.si, seed: g.seed };
  }

  /* 校验:返回 { ok, errors[] };读方越界即拒收 */
  function inR(x, a, b) { return typeof x === "number" && isFinite(x) && x >= a && x <= b; }
  function validate(g) {
    var e = [];
    if (!g || typeof g !== "object") return { ok: false, errors: ["not_object"] };
    var v = String(g.gus || "").split(".");
    if (v[0] !== "0") e.push("major_version");
    if (g.kind !== "universe") e.push("kind");
    if (!inR(g.seed, 0, 4294967295)) e.push("seed");
    var c = g.constants || {};
    [["G", 0.01, 100], ["c", 0.01, 100], ["alpha", 0.05, 20], ["Lambda", -10, 1000]].forEach(function (r) {
      if (!c[r[0]] || !inR(c[r[0]].k, r[1], r[2])) e.push("constants." + r[0]);
    });
    if (!c.epsilon || !inR(c.epsilon.si, 0.004, 0.010)) e.push("constants.epsilon");
    if (!c.Q || !inR(c.Q.si, 1e-7, 1e-3)) e.push("constants.Q");
    if (!c.Omega0 || !inR(c.Omega0.si, 0.01, 5)) e.push("constants.Omega0");
    var sys = g.system || {}, st = sys.star || {};
    if (!inR(st.mass_kg, 1e28, 1e33)) e.push("system.star.mass_kg");
    if (!inR(st.teff_K, 500, 100000)) e.push("system.star.teff_K");
    var pl = sys.planets;
    if (!Array.isArray(pl) || pl.length > 8) e.push("system.planets");
    else pl.forEach(function (q, i) {
      if (!inR(q.a_m, 1e9, 1e15)) e.push("planets[" + i + "].a_m");
      if (!inR(q.e, 0, 0.99)) e.push("planets[" + i + "].e");
      if (!inR(q.period_s, 1e3, 1e14)) e.push("planets[" + i + "].period_s");
      if (q.kind !== "rocky" && q.kind !== "gas") e.push("planets[" + i + "].kind");
    });
    if (g.name && (String(g.name.zh || "").length > 40 || String(g.name.en || "").length > 40)) e.push("name");
    return { ok: e.length === 0, errors: e };
  }

  /* 无压缩回退编码:"j." + base64url(UTF-8 JSON) */
  function b64urlEncode(str) {
    var b64 = typeof Buffer !== "undefined" ? Buffer.from(str, "utf8").toString("base64")
      : btoa(unescape(encodeURIComponent(str)));
    return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  function b64urlDecode(s) {
    var b64 = s.replace(/-/g, "+").replace(/_/g, "/"); while (b64.length % 4) b64 += "=";
    return typeof Buffer !== "undefined" ? Buffer.from(b64, "base64").toString("utf8") : decodeURIComponent(escape(atob(b64)));
  }
  function encodeJ(g) { return "j." + b64urlEncode(JSON.stringify(g)); }
  function decodeJ(s) {
    if (typeof s !== "string" || s.slice(0, 2) !== "j.") return null;
    try { return JSON.parse(b64urlDecode(s.slice(2))); } catch (err) { return null; }
  }

  var API = { VERSION: VERSION, toGUS: toGUS, toRecipe: toRecipe, validate: validate, encodeJ: encodeJ, decodeJ: decodeJ, hashId: hashId };
  if (typeof module !== "undefined" && module.exports) module.exports = API; else root.NV3_GUS = API;
})(typeof window !== "undefined" ? window : this);
