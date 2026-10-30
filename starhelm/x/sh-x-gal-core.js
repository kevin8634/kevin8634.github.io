/* 天枢 Starhelm 2.0 · C2.12b 天枢银河坐标 TSG(SHXTSG)
 * 依据《天枢 银河与宇宙世界层总体设计 v1.0》第 02、03 节(王磊 10-30 13:53 确认)。
 * - 原点:银心人马座 A*(GRAVITY 2019:R₀ = 8.178 kpc ≈ 26,996 光年)。单位:光年。
 * - X 指向太阳;Z 指向银河北极;Y = 银经 90° 方向(银河自转方向)。太阳 = (26,996, 0, +55)。
 *   注:设计稿写「Y 由右手法则确定,即银经 90° 方向」,两者其实互斥(X 指太阳、Z 指北时右手系的 Y 是银经 270°);
 *   这里以「银经 90° / 自转方向」为准(与 C2.11a 场景坐标一致),界面不出现手性字样。
 * - 环带 R:距银心(盘面投影)每 5,000 光年一环,R1 核区 … R6 太阳 … R12 外盘边缘,≥ 6 万光年记 R13+。
 * - 扇区 S:以太阳方向为起点,沿自转方向每 30° 一格 S00–S11(S00 = 0°–30°;按设计稿各世界地址反推)。
 * - 层:C 核(距银心 < 5,000 光年)· D 盘(|Z| < 1,500 光年)· H 晕(其余)。地址写法 VI·R6-S00-D。
 * - 六级尺度 L0–L5,相机距离阈值约 5 万 / 8,000 / 800 / 20 光年(设计稿 3.1)。
 * 与银河全景场景坐标的关系:场景 (x, y, z) = (X, Z − 55, Y),即场景以太阳所在高度为 y = 0(sh-x-galaxy.js pos())。
 */
(function () {
  'use strict';
  var R0 = 26996, Z0 = 55, D2R = Math.PI / 180;
  var MAT = [[-0.0548755604, -0.8734370902, -0.4838350155], [0.4941094279, -0.4448296300, 0.7469822445], [-0.8676661490, -0.1980763734, 0.4559837762]];
  function gal(ra, de) {   // J2000 赤经赤纬(度)→ 日心银道单位向量
    ra *= D2R; de *= D2R; var e = [Math.cos(de) * Math.cos(ra), Math.cos(de) * Math.sin(ra), Math.sin(de)];
    return MAT.map(function (r) { return r[0] * e[0] + r[1] * e[1] + r[2] * e[2]; });
  }
  function scene(ra, de, ly) { var g = gal(ra, de); return [R0 - g[0] * ly, g[2] * ly, g[1] * ly]; }
  function fromScene(p) { return [p[0], p[2], p[1] + Z0]; }
  function toScene(t) { return [t[0], t[2] - Z0, t[1]]; }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  // TSG 直角坐标 [X, Y, Z] → 地址与分量
  function addr(t) {
    var X = t[0], Y = t[1], Z = t[2], r = Math.hypot(X, Y), rs = Math.hypot(X, Y, Z);
    var f = r < 1 ? 0 : Math.atan2(Y, X) / D2R; if (f < 0) f += 360;
    var ri = Math.floor(r / 5000) + 1, si = Math.floor(f / 30) % 12, ly = rs < 5000 ? 'C' : Math.abs(Z) < 1500 ? 'D' : 'H';
    var R = ri >= 13 ? 'R13+' : 'R' + ri;
    return { X: X, Y: Y, Z: Z, r: r, rs: rs, phi: f, R: R, ri: ri, S: 'S' + pad(si), si: si, L: ly, addr: 'VI·' + R + '-S' + pad(si) + '-' + ly };
  }
  function lb(t) {   // TSG → 银经银纬(度)、距地球(光年);太阳本身返回 null
    var h = [R0 - t[0], t[1], t[2] - Z0], d = Math.hypot(h[0], h[1], h[2]); if (d < 1) return null;
    var l = Math.atan2(h[1], h[0]) / D2R; if (l < 0) l += 360;
    return { l: l, b: Math.asin(h[2] / d) / D2R, d: d };
  }
  function fmtLB(o) { if (!o) return '—(观测原点)'; return 'l ' + o.l.toFixed(1) + '° · b ' + (o.b >= 0 ? '+' : '−') + Math.abs(o.b).toFixed(1) + '°'; }
  function fromEq(ra, de, ly) { var g = gal(ra, de); return [R0 - g[0] * ly, g[1] * ly, g[2] * ly + Z0]; }
  // 六级尺度
  var LV = [
    { k: 'L0', zh: '银河全景', sc: '10 万光年 · 整个银盘 + 银晕', d: 50000 },
    { k: 'L1', zh: '区域世界', sc: '1–2 万光年 · 一段旋臂 / 核区 / 银晕一角', d: 8000 },
    { k: 'L2', zh: '星区', sc: '1,000–3,000 光年 · 星云复合体或星协', d: 800 },
    { k: 'L3', zh: '天体群', sc: '10–300 光年 · 星团、星云内部、超新星遗迹', d: 20 },
    { k: 'L4', zh: '恒星系统', sc: '光日–光年 · 一颗恒星、双星、黑洞系统', d: 0.01 },
    { k: 'L5', zh: '天体近景', sc: '天体本身 · 吸积盘、脉冲星磁层、行星', d: 0 }
  ];
  function level(d) { for (var i = 0; i < 4; i++) if (d >= LV[i].d) return i; return 4; }
  window.SHXTSG = { R0: R0, Z0: Z0, sun: [R0, 0, Z0], gal: gal, scene: scene, fromEq: fromEq, fromScene: fromScene, toScene: toScene, addr: addr, lb: lb, fmtLB: fmtLB, LV: LV, level: level };
})();
