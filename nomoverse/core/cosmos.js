/* 宙律 Nomoverse 2.0 · 改律·玻璃宇宙 · 物理模型(v2.0-α1,零依赖;浏览器 window.NV_COSMOS / node require)
 * 只改一个常数,其余照旧(科普用简化模型,标度律而非完整演化):
 * 第一幕 引力 G → k·G(太阳质量不变;G 缓慢变化时地球角动量守恒):
 *   轨道半径 r = L²/(G·M·m²) ∝ 1/k;周期 T = 2π√(r³/GM) ∝ k⁻²;轨道速度 ∝ k。
 *   主序星同调关系 L☉ ∝ G⁴M³(电子散射不透明度近似)→ 光度 ∝ k⁴,寿命(燃料/光度)∝ k⁻⁴。
 *   地球接收通量 ∝ L/r² ∝ k⁶;平衡温度 ∝ 通量^¼ ∝ k^1.5。地表均温取 288 K(含温室效应,按同比例缩放)。
 * 第二幕 光速 c → k·c:阳光延迟 τ = 1 AU / c;地球公转 v = 29.78 km/s 相对太阳系质心的时间膨胀
 *   γ = 1/√(1−v²/c²),地球钟每年比"太阳旁静止的钟"慢 (1−1/γ)·365.25 天(只算速度项,忽略引力项)。
 * 第三幕 精细结构常数 α → k·α(电子质量、ħ 不变):玻尔半径 a₀ ∝ 1/k,电离能 13.6 eV ∝ k²,
 *   谱线波长 ∝ k⁻²;氢 Hα 656.28 nm 落在可见光 380–750 nm 之外时,"氢的红光"就看不见了。
 * 数据:IAU 2012 天文单位 149 597 870 700 m;CODATA 2018 c、a₀ = 52.918 pm、Ry = 13.606 eV;NASA 地球概况 v = 29.78 km/s。 */
(function (G) {
  "use strict";
  var AU = 149597870.7;          // km
  var C0 = 299792.458;           // km/s
  var V_EARTH = 29.78;           // km/s
  var YEAR_D = 365.25;
  var T_SURF = 288;              // K
  var A0 = 52.918;               // pm
  var RY = 13.606;               // eV
  var H_ALPHA = 656.28;          // nm
  var VIS = [380, 750];          // nm
  var SUN_LIFE = 10;             // 十亿年(主序寿命约 100 亿年)

  var M = {
    AU: AU, C0: C0, V_EARTH: V_EARTH, T_SURF: T_SURF, A0: A0, RY: RY, H_ALPHA: H_ALPHA, VIS: VIS, SUN_LIFE: SUN_LIFE,
    /* ---- 第一幕 引力 ---- */
    grav: function (k) {
      var r = 1 / k, T = 1 / (k * k), L = Math.pow(k, 4), flux = L / (r * r);
      return { r: r, T: T, days: T * YEAR_D, v: V_EARTH * k, L: L, flux: flux, life: SUN_LIFE / L, temp: T_SURF * Math.pow(flux, 0.25) };
    },
    /* 海洋不沸腾(<373 K)的最大 G 倍数、不结冰(>273 K)的最小倍数 */
    gWindow: function () { return [Math.pow(273 / T_SURF, 1 / 1.5), Math.pow(373 / T_SURF, 1 / 1.5)]; },
    /* ---- 第二幕 光速 ---- */
    light: function (cKm) {
      var b = V_EARTH / cKm, g = b < 1 ? 1 / Math.sqrt(1 - b * b) : Infinity;
      return { c: cKm, k: cKm / C0, delay: AU / cKm, beta: b, gamma: g, lagDays: b < 1 ? b * b / (1 + Math.sqrt(1 - b * b)) * YEAR_D : Infinity };
    },
    /* 地球钟每年慢 lagDays 天时对应的光速(km/s) */
    cForLag: function (lagDays) { var ig = 1 - lagDays / YEAR_D; return V_EARTH / Math.sqrt(1 - ig * ig); },
    /* ---- 第三幕 电磁 ---- */
    atom: function (k) {
      var lam = H_ALPHA / (k * k);
      return { a0: A0 / k, E: RY * k * k, ha: lam, visible: lam >= VIS[0] && lam <= VIS[1], band: lam < VIS[0] ? "uv" : lam > VIS[1] ? "ir" : "vis" };
    },
    aWindow: function () { return [Math.sqrt(H_ALPHA / VIS[1]), Math.sqrt(H_ALPHA / VIS[0])]; },
    /* 波长 → 近似 sRGB(380–750 nm;范围外返回 null) */
    rgb: function (nm) {
      if (nm < 380 || nm > 750) return null;
      var r = 0, g = 0, b = 0;
      if (nm < 440) { r = (440 - nm) / 60; b = 1; } else if (nm < 490) { g = (nm - 440) / 50; b = 1; } else if (nm < 510) { g = 1; b = (510 - nm) / 20; }
      else if (nm < 580) { r = (nm - 510) / 70; g = 1; } else if (nm < 645) { r = 1; g = (645 - nm) / 65; } else r = 1;
      var f = nm < 420 ? 0.3 + 0.7 * (nm - 380) / 40 : nm > 700 ? 0.3 + 0.7 * (750 - nm) / 50 : 1;
      return [r * f, g * f, b * f];
    }
  };
  if (typeof module !== "undefined" && module.exports) module.exports = M; else G.NV_COSMOS = M;
})(typeof window !== "undefined" ? window : this);
