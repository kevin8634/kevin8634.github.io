/* =====================================================================
 * 天枢 Starhelm · sh-astro.js(M1)
 * 纯数学天文计算(不依赖 three.js,可在 Node 中测试):
 *  太阳/月球位置(低精度解析式,精度约 0.5°)· 月相 · 太阳高度角 · 卫星过境预报(satellite.js SGP4)
 * ===================================================================== */
(function (root) {
  'use strict';
  var SH = (root.SH = root.SH || {});
  var D2R = Math.PI / 180, R2D = 180 / Math.PI, RE = 6371, AU = 149597870.7;
  function n360(x) { x %= 360; return x < 0 ? x + 360 : x; }
  function days(date) { return (date.getTime() / 864e5) + 2440587.5 - 2451545.0; }   // 自 J2000.0 起的日数
  function gmst(date) {   // 格林尼治平恒星时(弧度)
    var d = days(date), t = d / 36525;
    var g = 280.46061837 + 360.98564736629 * d + 0.000387933 * t * t;
    return n360(g) * D2R;
  }
  function eclToEq(lon, lat, eps) {   // 黄道 → 赤道(度 → 弧度)
    var l = lon * D2R, b = lat * D2R, e = eps * D2R;
    var x = Math.cos(b) * Math.cos(l), y = Math.cos(e) * Math.cos(b) * Math.sin(l) - Math.sin(e) * Math.sin(b), z = Math.sin(e) * Math.cos(b) * Math.sin(l) + Math.cos(e) * Math.sin(b);
    return { ra: Math.atan2(y, x), dec: Math.asin(z) };
  }
  var A = (SH.astro = {
    gmst: gmst,
    /** 太阳:黄经(度)、赤经赤纬(弧度)、日地距离(AU) */
    sun: function (date) {
      var d = days(date), g = n360(357.529 + 0.98560028 * d), q = n360(280.459 + 0.98564736 * d);
      var lon = n360(q + 1.915 * Math.sin(g * D2R) + 0.020 * Math.sin(2 * g * D2R));
      var eps = 23.439 - 0.00000036 * d, eq = eclToEq(lon, 0, eps);
      var r = 1.00014 - 0.01671 * Math.cos(g * D2R) - 0.00014 * Math.cos(2 * g * D2R);
      return { lon: lon, ra: eq.ra, dec: eq.dec, au: r };
    },
    /** 月球:黄经黄纬(度)、赤经赤纬(弧度)、地月距离(km) */
    moon: function (date) {
      var d = days(date);
      var L = 218.316 + 13.176396 * d, M = 134.963 + 13.064993 * d, F = 93.272 + 13.229350 * d;
      var Dm = 297.850 + 12.190749 * d, Ms = 357.529 + 0.98560028 * d;
      var s = function (x) { return Math.sin(x * D2R); }, c = function (x) { return Math.cos(x * D2R); };
      var lon = L + 6.289 * s(M) - 1.274 * s(M - 2 * Dm) + 0.658 * s(2 * Dm) - 0.186 * s(Ms) - 0.059 * s(2 * M - 2 * Dm) - 0.057 * s(M - 2 * Dm + Ms) + 0.053 * s(M + 2 * Dm) + 0.046 * s(2 * Dm - Ms) + 0.041 * s(M - Ms) - 0.035 * s(Dm) - 0.031 * s(M + Ms);
      var lat = 5.128 * s(F) + 0.281 * s(M + F) - 0.278 * s(F - M) - 0.173 * s(F - 2 * Dm);
      var dist = 385001 - 20905 * c(M) - 3699 * c(2 * Dm - M) - 2956 * c(2 * Dm);
      var eq = eclToEq(n360(lon), lat, 23.439 - 0.00000036 * d);
      return { lon: n360(lon), lat: lat, ra: eq.ra, dec: eq.dec, km: dist };
    },
    /** 赤经赤纬 → 此刻正下方的地理经纬度(度) */
    subPoint: function (ra, dec, date) {
      var lng = (ra - gmst(date)) * R2D; lng = n360(lng + 180) - 180;
      return { lat: dec * R2D, lng: lng };
    },
    /** 月相:age = 月日黄经差(0 新月,180 满月),k = 被照亮比例 */
    moonPhase: function (date) {
      var m = A.moon(date), s = A.sun(date), age = n360(m.lon - s.lon);
      var el = Math.acos(Math.cos((m.lon - s.lon) * D2R) * Math.cos(m.lat * D2R));
      var k = (1 - Math.cos(el)) / 2, name;
      if (age < 10 || age >= 350) name = '新月'; else if (age < 80) name = '蛾眉月'; else if (age < 100) name = '上弦月';
      else if (age < 170) name = '盈凸月'; else if (age < 190) name = '满月'; else if (age < 260) name = '亏凸月';
      else if (age < 280) name = '下弦月'; else name = '残月';
      return { age: age, k: k, name: name, waxing: age < 180, km: m.km };
    },
    /** 某地太阳高度角(度) */
    sunElevation: function (lat, lng, date) {
      var s = A.sun(date), H = gmst(date) + lng * D2R - s.ra, p = lat * D2R;
      return Math.asin(Math.sin(p) * Math.sin(s.dec) + Math.cos(p) * Math.cos(s.dec) * Math.cos(H)) * R2D;
    },
    /** 太阳在 ECI 中的位置(km),用于地影判定 */
    sunEci: function (date) {
      var s = A.sun(date), r = s.au * AU;
      return { x: r * Math.cos(s.dec) * Math.cos(s.ra), y: r * Math.cos(s.dec) * Math.sin(s.ra), z: r * Math.sin(s.dec) };
    },
    /** 卫星是否被阳光照亮(圆柱地影近似) */
    sunlit: function (p, sunE) {
      var sl = Math.hypot(sunE.x, sunE.y, sunE.z), ux = sunE.x / sl, uy = sunE.y / sl, uz = sunE.z / sl;
      var along = p.x * ux + p.y * uy + p.z * uz;
      if (along > 0) return true;
      var px = p.x - along * ux, py = p.y - along * uy, pz = p.z - along * uz;
      return Math.hypot(px, py, pz) > RE;
    },
    /**
     * 过境预报:未来 days 天内,在 (lat,lng) 能用肉眼看到的过境
     * 条件:仰角 > minEl、卫星被照亮、观测者处太阳高度 < -6°(天已黑)
     * 返回 [{start,end,peak(ms), maxEl, azStart, azEnd}]
     */
    passes: function (sat, rec, lat, lng, fromMs, daysN, opt) {
      opt = opt || {}; var step = (opt.step || 30) * 1000, minEl = opt.minEl == null ? 10 : opt.minEl;
      var obs = { longitude: lng * D2R, latitude: lat * D2R, height: 0 }, out = [], cur = null;
      var end = fromMs + daysN * 864e5;
      for (var t = fromMs; t <= end; t += step) {
        var date = new Date(t), pv = sat.propagate(rec, date);
        var ok = false, el = -90, az = 0;
        if (pv && pv.position && isFinite(pv.position.x)) {
          var ecf = sat.eciToEcf(pv.position, sat.gstime(date)), look = sat.ecfToLookAngles(obs, ecf);
          el = look.elevation * R2D; az = look.azimuth * R2D;
          if (el > minEl) ok = A.sunlit(pv.position, A.sunEci(date)) && A.sunElevation(lat, lng, date) < -6;
        }
        if (ok) {
          if (!cur) cur = { start: t, end: t, peak: t, maxEl: el, azStart: az, azEnd: az };
          cur.end = t; cur.azEnd = az; if (el > cur.maxEl) { cur.maxEl = el; cur.peak = t; }
        } else if (cur) { out.push(cur); cur = null; if (opt.max && out.length >= opt.max) return out; }
      }
      if (cur) out.push(cur);
      return out;
    },
    dir8: function (az) { return ['北', '东北', '东', '东南', '南', '西南', '西', '西北'][Math.round(n360(az) / 45) % 8]; },
    RE: RE, AU: AU
  });
})(typeof window !== 'undefined' ? window : globalThis);
