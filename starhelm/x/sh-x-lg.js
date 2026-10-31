/* 天枢 Starhelm 2.0 · C2.13a 星域 VII 框架 · 本星系群 + 麦哲伦门虫洞(SHXLG)
 * 依据《天枢 银河与宇宙世界层总体设计 v1.0》第 06、08 节;王磊 10-31 10:51「OK 开工」确认 C2.13a 方案与 3 张效果图。
 * - 麦哲伦门:银河全景里(sh-x-galaxy.js)在大麦哲伦云方向、距银心约 15 万光年处放一座虫洞门(环 + 透镜光环);
 *   麦哲伦门世界卡多一个「穿过虫洞门 → 星域 VII」按钮。
 * - 虫洞穿越:与银河内曲率跃迁(蓝前红后拉丝)区分 —— 弯曲隧道壁是被引力透镜拉长的星光与星系,出口是一圈爱因斯坦环;
 *   读数照旧给真实距离与光要走多久。减少动态 / 无 WebGL 时改为淡入淡出。
 * - 星域 VII 本星系群 L0(独立全屏视图,自带 three 渲染器,r186 与 ?three=169 通用;无 WebGL 退回 2D 俯视点图):
 *   银河系、仙女座 M31(含 M32 / M110)、三角座 M33、大小麦哲伦云全部是 3D 粒子星系(发光星点 + 吸收暗尘粒子),
 *   按真实赤经赤纬与距离换算到银心坐标(SHXTSG.scene,单位千光年)摆放,盘面按实测倾角 / 位置角定向;
 *   约 30 个矮星系按 McConnachie 2012 星表真实位置撒点(各自是 3D 小粒子团)。
 * - VII 坐标:以本星系群质心(银河—仙女连线上距银河约 125 万光年,示意)为原点;读数给 VII 地址、距银心、距质心、回看时间。
 * - 五级尺度 L0–L4(L0 本星系群可用;L1–L4 在 C2.13b/c 开放)。世界卡 VII-1「卫星之环 · 银河近邻」、VII-2「仙女之约 · 本星系群」。
 * - 「45 亿年后」碰撞时间加速演示(模拟示意):仙女座以约 110 km/s 接近,约 40–45 亿年后首次近距掠过,约 60 亿年后并合成椭圆星系;
 *   并标注 2025 年 Gaia / 哈勃新测量认为 100 亿年内相撞概率约一半。
 * - 入口:麦哲伦门世界卡;SHXLG.open();深链 ?view=lg。Esc 先关卡片再回银河。
 */
(function () {
  'use strict';
  var D2R = Math.PI / 180, KLY = 1000;
  var T, TS, rd, scn, cam, cv, ov, lay, card, raf = 0, open_ = false, mode = '3d', mats = [], GR = {}, LBL = [], last = 0, idle = 0, TW = null, WH = null, demo = null;
  var C = { tx: 0, ty: 0, tz: 0, d: 4200, pit: .55, yaw: -.6 };
  function rm() { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } }
  function small() { return Math.min(screen.width, screen.height) < 700 || innerWidth <= 760; }
  function rnd(s) { return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
  function gauss(R) { var u = R() || 1e-9, v = R(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(6.2831853 * v); }
  function nf(x) { return Math.round(x).toLocaleString('zh-CN'); }
  function fly(l) { return l >= 1e8 ? (l / 1e8).toFixed(1) + ' 亿光年' : l >= 1e4 ? (l / 1e4).toFixed(l >= 1e6 ? 0 : 1) + ' 万光年' : nf(l) + ' 光年'; }
  function yrs(y) { return y >= 1e8 ? (y / 1e8).toFixed(1) + ' 亿年' : y >= 1e4 ? (y / 1e4).toFixed(y >= 1e6 ? 0 : 1) + ' 万年' : nf(y) + ' 年'; }
  function sc(ra, de, kly) { var p = TS.scene(ra, de, kly * KLY); return [p[0] / KLY, p[1] / KLY, p[2] / KLY]; }
  function norm(v) { var l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; }
  function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
  // 天球方向向量(赤道直角)→ 场景方向
  function eqDir(v) { var ra = Math.atan2(v[1], v[0]) / D2R, de = Math.asin(Math.max(-1, Math.min(1, v[2]))) / D2R; var a = TS.scene(ra, de, 1), o = TS.scene(ra, de, 0); return norm(sub(a, o)); }
  // 盘面法向:倾角 i、位置角 PA(北向东)
  function diskN(ra, de, inc, pa) {
    var a = ra * D2R, d = de * D2R, r = [Math.cos(d) * Math.cos(a), Math.cos(d) * Math.sin(a), Math.sin(d)], e = [-Math.sin(a), Math.cos(a), 0], n = [-Math.sin(d) * Math.cos(a), -Math.sin(d) * Math.sin(a), Math.cos(d)];
    var p = pa * D2R, mi = [-n[0] * Math.sin(p) + e[0] * Math.cos(p), -n[1] * Math.sin(p) + e[1] * Math.cos(p), -n[2] * Math.sin(p) + e[2] * Math.cos(p)], ci = Math.cos(inc * D2R), si = Math.sin(inc * D2R);
    return eqDir([ci * r[0] + si * mi[0], ci * r[1] + si * mi[1], ci * r[2] + si * mi[2]]);
  }

  /* ---------- 星系表(距离千光年;R 半径千光年) ---------- */
  var G = [
    { k: 'MW', zh: '银河系', en: 'Milky Way', ty: 'sp', R: 50, N: 130000, arms: 4, pitch: 13, bar: 9, bulge: .14, c: '#f0c97a', vii: 'VII-1', d: 0,
      fx: [['直径', '约 10 万光年(盘)'], ['恒星', '约 1,000–4,000 亿颗'], ['类型', '棒旋星系 SBbc'], ['你在哪', '太阳距银心约 2.7 万光年']] },
    { k: 'LMC', zh: '大麦哲伦云', en: 'Large Magellanic Cloud', ty: 'ir', ra: 80.894, de: -69.756, d: 161.7, R: 7.5, N: 22000, inc: 25, pa: 170, c: '#ff9fd0', vii: 'VII-1', dv: 'LMC',
      fx: [['距离', '约 16.2 万光年(食双星测距)'], ['直径', '约 3 万光年(含外盘)'], ['亮点', '蜘蛛星云:本星系群最活跃的恒星工厂'], ['状态', '可能是第一次掠过银河系']] },
    { k: 'SMC', zh: '小麦哲伦云', en: 'Small Magellanic Cloud', ty: 'ir', ra: 13.187, de: -72.829, d: 203.5, R: 3.6, N: 9000, inc: 60, pa: 45, c: '#ff9fd0', vii: 'VII-1', dv: 'NGC 292',
      fx: [['距离', '约 20 万光年'], ['直径', '约 1.9 万光年'], ['麦哲伦流', '大小麦哲伦云被扯出的气体长尾,横跨天空 100° 以上']] },
    { k: 'M31', zh: '仙女座星系', en: 'Andromeda · M31', ty: 'sp', ra: 10.6847, de: 41.2690, d: 2537, R: 76, N: 170000, arms: 2, pitch: 12, bar: 0, bulge: .18, ring: .43, inc: 77, pa: 38, c: '#7fd6ff', vii: 'VII-2', dv: 'M31',
      fx: [['距离', '约 254 万光年'], ['直径', '约 15 万光年以上'], ['恒星', '约 1 万亿颗'], ['特征', '距中心约 3.3 万光年的尘埃环;肉眼可见的最远天体之一']] },
    { k: 'M32', zh: 'M32', en: 'M32 · 致密椭圆', ty: 'el', ra: 10.674, de: 40.865, d: 2490, R: 3.2, N: 5000, q: .75, c: '#f0c97a', vii: 'VII-2',
      fx: [['类型', '致密椭圆星系'], ['伴星系', '仙女座星系的卫星']] },
    { k: 'M110', zh: 'M110', en: 'M110 · NGC 205', ty: 'el', ra: 10.092, de: 41.685, d: 2690, R: 8, N: 6000, q: .55, c: '#f0c97a', vii: 'VII-2',
      fx: [['类型', '矮椭圆星系'], ['伴星系', '仙女座星系的卫星']] },
    { k: 'M33', zh: '三角座星系', en: 'Triangulum · M33', ty: 'sp', ra: 23.462, de: 30.660, d: 2730, R: 30, N: 50000, arms: 2, pitch: 22, bar: 0, bulge: .05, inc: 55, pa: 23, loose: 1, c: '#7fd6ff', vii: 'VII-2', dv: 'M33',
      fx: [['距离', '约 273 万光年'], ['直径', '约 6 万光年'], ['类型', '旋涡星系 Sc,本星系群第三大'], ['亮点', 'NGC 604:巨大的电离氢区']] }
  ];
  // 矮星系(McConnachie 2012 星表,赤经 / 赤纬 / 距离千光年,约数)
  var DW = [['人马矮椭球', 283.83, -30.55, 65], ['天龙矮星系', 260.05, 57.92, 248], ['小熊矮星系', 227.29, 67.22, 248], ['玉夫矮星系', 15.04, -33.71, 280], ['六分仪矮星系', 153.26, -1.61, 280],
    ['船底矮星系', 100.40, -50.97, 330], ['天炉矮星系', 39.99, -34.45, 460], ['狮子 II', 168.37, 22.15, 690], ['狮子 I', 152.12, 12.31, 820], ['牧夫 I', 210.02, 14.50, 197], ['猎犬 I', 202.01, 33.56, 711],
    ['巨爵 II', 177.31, -18.41, 380], ['唧筒 2', 143.89, -36.77, 430], ['武仙矮星系', 247.76, 12.79, 430], ['网罟 II', 53.93, -54.05, 98], ['狮子 T', 143.72, 17.05, 1360],
    ['NGC 6822(巴纳德星系)', 296.24, -14.80, 1630], ['IC 1613', 16.20, 2.12, 2380], ['WLM', 0.49, -15.46, 3040], ['狮子 A', 149.86, 30.75, 2600], ['NGC 185', 9.74, 48.34, 2020], ['NGC 147', 8.30, 48.51, 2350],
    ['仙女 I', 11.42, 38.04, 2400], ['仙女 II', 19.12, 33.42, 2130], ['飞马矮不规则', 352.15, 14.74, 3010], ['IC 10', 5.07, 59.30, 2610], ['宝瓶矮星系', 311.72, -12.85, 3190], ['凤凰矮星系', 27.78, -44.44, 1360],
    ['杜鹃矮星系', 340.46, -64.42, 2870], ['鲸鱼矮星系', 6.55, -11.04, 2460], ['人马矮不规则', 292.50, -17.68, 3480]];
  var BARY = null, GATE = null;
  var W7 = [
    { id: 'VII-1', im: '卫星之环', zh: '银河近邻', dist: '7–20 万光年(到最远卫星约 140 万光年)', q: '银河有卫星吗?', q2: '卫星星系为什么会被「扯碎」?',
      land: '银河系四周散落着几十个矮星系。大小麦哲伦云最亮,人马矮椭球正被银河撕成一条绕银晕的星流;麦哲伦流是被扯出的气体长尾。', o: ['LMC', 'SMC', 'D0', 'D1', 'D3'] },
    { id: 'VII-2', im: '仙女之约', zh: '本星系群', dist: '250–300 万光年', q: '我们会和仙女座相撞吗?', q2: '两个星系相撞,恒星会撞在一起吗?',
      land: '本星系群直径约 1,000 万光年,由银河系与仙女座两大旋涡主导,三角座第三,再加约 80 个矮星系。仙女座正以约 110 km/s 向我们靠近。', o: ['M31', 'M33', 'M32', 'M110', 'D20'] }
  ];
  var LV7 = [{ k: 'L0', zh: '本星系群', sc: '1,000 万光年 · 银河系、仙女座、三角座 + 约 80 个矮星系' }, { k: 'L1', zh: '星系群 / 星系团', sc: '千万光年 · 室女座星系团、M81 群' },
    { k: 'L2', zh: '超星系团', sc: '5 亿光年 · 拉尼亚凯亚' }, { k: 'L3', zh: '宇宙网', sc: '数十亿光年 · 纤维、节点、空洞' }, { k: 'L4', zh: '可观测宇宙', sc: '直径约 930 亿光年 · CMB 边界' }];

  /* ---------- 粒子星系生成(局部坐标:盘在 xz 平面,y 为法向) ---------- */
  function hex(c) { var n = parseInt(c.slice(1), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; }
  function genGal(g, sf) {
    var R = rnd(g.k.length * 7919 + Math.round(g.R * 13)), N = Math.max(600, Math.round(g.N * sf)), P = [], Cc = [], S = [], DP = [], DS = [];
    function put(x, y, z, r, gg, b, s) { P.push(x, y, z); Cc.push(r, gg, b); S.push(s); }
    function dust(x, y, z, s) { DP.push(x, y, z); DS.push(s); }
    var Rg = g.R, k, i;
    if (g.ty === 'sp') {
      var nb = N * g.bulge, nbar = g.bar ? N * .07 : 0, nring = g.ring ? N * .22 : 0, tp = Math.tan(g.pitch * D2R);
      for (k = 0; k < nb; k++) { var rb = Math.abs(gauss(R)) * Rg * .07, th = R() * 6.283, ph = Math.acos(2 * R() - 1); put(rb * Math.sin(ph) * Math.cos(th), rb * Math.cos(ph) * .62, rb * Math.sin(ph) * Math.sin(th), 1, .82 + R() * .08, .55 + R() * .12, Rg * .006 * (1 + R())); }
      for (k = 0; k < nbar; k++) { var u = gauss(R) * g.bar * .45, v = gauss(R) * g.bar * .11, a = 27 * D2R; put(u * Math.cos(a) - v * Math.sin(a), gauss(R) * Rg * .006, u * Math.sin(a) + v * Math.cos(a), 1, .8, .52, Rg * .006); }
      for (k = 0; k < nring; k++) { var rr = Rg * g.ring * (1 + gauss(R) * .06), ta = R() * 6.283, cl = R() < .1; put(rr * Math.cos(ta), gauss(R) * Rg * .006, rr * Math.sin(ta), cl ? 1 : .62, cl ? .45 : .74, cl ? .7 : 1, Rg * (cl ? .007 : .005)); if (R() < .5) dust(rr * .985 * Math.cos(ta + gauss(R) * .02), gauss(R) * Rg * .004, rr * .985 * Math.sin(ta + gauss(R) * .02), Rg * .012); }
      var rest = N - nb - nbar - nring;
      for (k = 0; k < rest; k++) {
        var r = Math.min(Rg, -Math.log(1 - R() * .985) * Rg * .26 + Rg * .03), onArm = R() < (g.loose ? .55 : .68), t;
        if (onArm) { var ai = Math.floor(R() * g.arms), w = ai >= 2 ? .6 : 1; if (R() > w) ai = ai % 2; t = Math.log(r / (Rg * .08)) / tp + ai * 6.283 / g.arms + gauss(R) * (g.loose ? .32 : .16); }
        else t = R() * 6.283;
        var fr = Math.min(1, r / Rg), x = r * Math.cos(t), z = r * Math.sin(t), y = gauss(R) * Rg * (.008 + .012 * fr), young = onArm && R() < .55, pink = onArm && R() < .06;
        if (pink) { for (i = 0; i < 6; i++) put(x + gauss(R) * Rg * .004, y + gauss(R) * Rg * .002, z + gauss(R) * Rg * .004, 1, .35, .62, Rg * .006); continue; }
        put(x, y, z, young ? .62 + R() * .1 : .95 - fr * .2, young ? .74 + R() * .08 : .86 - fr * .1, young ? 1 : .7 + fr * .2, Rg * (young ? .0055 : .0045) * (1 + R() * .6));
        if (onArm && R() < .35 * Math.min(1, Math.pow(r / (Rg * .4), 2))) { var td = t - .07 - R() * .05; dust(r * Math.cos(td), gauss(R) * Rg * .004, r * Math.sin(td), Rg * (.008 + R() * .01)); }
      }
      for (k = 0; k < N * .05; k++) {   // 弥散星光:大而淡的 3D 光粒子,给盘面体积感(核区暖、外盘冷)
        var rd2 = Math.min(Rg, -Math.log(1 - R() * .97) * Rg * .22), td2 = R() < .6 ? Math.log(Math.max(rd2, Rg * .08) / (Rg * .08)) / tp + Math.floor(R() * g.arms) * 6.283 / g.arms + gauss(R) * .3 : R() * 6.283, f2 = rd2 / Rg;
        put(rd2 * Math.cos(td2), gauss(R) * Rg * (.01 + .03 * (1 - f2)), rd2 * Math.sin(td2), .16 - f2 * .06, .13 - f2 * .03, .1 + f2 * .04, Rg * (.05 - f2 * .02));
      }
      for (k = 0; k < N * .025; k++) {   // C2.13a2 恒星晕:3D 椭球淡光,侧看不再是薄片
        var rh = Math.abs(gauss(R)) * Rg * .35, th2 = R() * 6.283, ph2 = Math.acos(2 * R() - 1), fh = Math.min(1, rh / Rg);
        put(rh * Math.sin(ph2) * Math.cos(th2), rh * Math.cos(ph2) * .55, rh * Math.sin(ph2) * Math.sin(th2), .12 - fh * .05, .1 - fh * .03, .08, Rg * (.07 - fh * .03));
      }
      for (k = 0; k < N * .012; k++) {   // C2.13a2 丝状暗尘体积:沿旋臂内缘的成串吸收粒子,带厚度
        var rd3 = Rg * (.3 + R() * .6), ai3 = Math.floor(R() * g.arms), t5 = Math.log(rd3 / (Rg * .08)) / tp + ai3 * 6.283 / g.arms - .1 + gauss(R) * .05;
        for (i = 0; i < 2; i++) { var j3 = (i - .5) * .015; dust((rd3 + gauss(R) * Rg * .01) * Math.cos(t5 + j3), gauss(R) * Rg * .007, (rd3 + gauss(R) * Rg * .01) * Math.sin(t5 + j3), Rg * (.007 + R() * .007)); }
      }
    } else if (g.ty === 'el') {
      for (k = 0; k < N; k++) { var su = Math.sqrt(R() * .97), rr2 = Rg * .25 * su / (1 - su), t2 = R() * 6.283, p2 = Math.acos(2 * R() - 1); put(rr2 * Math.sin(p2) * Math.cos(t2), rr2 * Math.cos(p2) * g.q, rr2 * Math.sin(p2) * Math.sin(t2), 1, .84, .62, Rg * .02 * (1 + R())); }
      for (k = 0; k < N * .06; k++) { var su3 = Math.sqrt(R() * .9), rr4 = Rg * .35 * su3 / (1 - su3), t6 = R() * 6.283, p6 = Math.acos(2 * R() - 1), f6 = Math.min(1, rr4 / Rg); put(rr4 * Math.sin(p6) * Math.cos(t6), rr4 * Math.cos(p6) * g.q, rr4 * Math.sin(p6) * Math.sin(t6), .14 - f6 * .06, .11 - f6 * .05, .08 - f6 * .04, Rg * (.09 - f6 * .04)); }   // C2.13a2 弥散体积光
    } else if (g.ty === 'ir') {   // 偏心棒 + 团块盘 + 一端的粉色巨型电离氢区(LMC = 蜘蛛星云)
      for (k = 0; k < N; k++) {
        var mode_ = R(), x2, y2, z2, cc = [.9, .85, .8], ss = Rg * .012;
        if (mode_ < .3) { x2 = gauss(R) * Rg * .38 + Rg * .1; z2 = gauss(R) * Rg * .1; y2 = gauss(R) * Rg * .05; cc = [1, .86, .64]; }
        else if (mode_ < .9) { var r3 = Math.abs(gauss(R)) * Rg * .5, t3 = R() * 6.283; x2 = r3 * Math.cos(t3); z2 = r3 * Math.sin(t3) * .85; y2 = gauss(R) * Rg * .06; if (R() < .5) cc = [.66, .76, 1]; }
        else { var cx = Rg * .55, cz = Rg * .25; if (g.k === 'SMC') { cx = -Rg * .3; cz = Rg * .2; } x2 = cx + gauss(R) * Rg * .06; z2 = cz + gauss(R) * Rg * .06; y2 = gauss(R) * Rg * .03; cc = R() < .7 ? [1, .4, .66] : [.7, .8, 1]; ss = Rg * .014; }
        put(x2, y2, z2, cc[0], cc[1], cc[2], ss * (1 + R()));
        if (R() < .08) dust(x2 + gauss(R) * Rg * .03, y2, z2 + gauss(R) * Rg * .03, Rg * .03);
      }
      for (k = 0; k < N * .05; k++) { var r7 = Math.abs(gauss(R)) * Rg * .45, t7 = R() * 6.283; put(r7 * Math.cos(t7) + Rg * .05, gauss(R) * Rg * .08, r7 * Math.sin(t7) * .85, .12, .11, .12, Rg * .06); }   // C2.13a2 弥散体积光
    } else {   // dSph:Plummer 球,稀疏暗淡
      for (k = 0; k < N; k++) { var su2 = R(), rp = Rg / Math.sqrt(Math.pow(su2 * .98, -2 / 3) - 1), t4 = R() * 6.283, p4 = Math.acos(2 * R() - 1); put(rp * Math.sin(p4) * Math.cos(t4), rp * Math.cos(p4) * .8, rp * Math.sin(p4) * Math.sin(t4), .95, .88, .75, Rg * .12); }
    }
    return { P: new Float32Array(P), C: new Float32Array(Cc), S: new Float32Array(S), DP: new Float32Array(DP), DS: new Float32Array(DS) };
  }

  /* ---------- 着色器 ---------- */
  var VS = 'attribute float aS;attribute vec3 aC;varying vec3 vC;varying float vA;uniform float uK,uB,uM;void main(){vec4 mv=modelViewMatrix*vec4(position,1.0);float s=aS*uK/max(-mv.z,1e-3);vA=clamp(s*.7,0.4,1.0)*uB*clamp(uM/max(s,1.0)*1.5,.25,1.0);gl_PointSize=clamp(s,1.0,uM);vC=aC;gl_Position=projectionMatrix*mv;}';
  var FS = 'precision mediump float;varying vec3 vC;varying float vA;void main(){vec2 d=gl_PointCoord-.5;float r=dot(d,d)*4.0;if(r>1.0)discard;float a=exp(-r*3.0)*vA;gl_FragColor=vec4(vC*a,1.0);}';
  var FSD = 'precision mediump float;varying vec3 vC;varying float vA;void main(){vec2 d=gl_PointCoord-.5;float r=dot(d,d)*4.0;if(r>1.0)discard;gl_FragColor=vec4(.03,.02,.02,(1.0-r)*(1.0-r)*.45*vA);}';
  function pts(b, dustMat) {
    var g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(dustMat ? b.DP : b.P, 3));
    if (dustMat) { g.setAttribute('aC', new T.BufferAttribute(new Float32Array(b.DS.length * 3), 3)); g.setAttribute('aS', new T.BufferAttribute(b.DS, 1)); }
    else { g.setAttribute('aC', new T.BufferAttribute(b.C, 3)); g.setAttribute('aS', new T.BufferAttribute(b.S, 1)); }
    var m = new T.ShaderMaterial({ vertexShader: VS, fragmentShader: dustMat ? FSD : FS, transparent: true, depthWrite: false, depthTest: false, blending: dustMat ? T.NormalBlending : T.AdditiveBlending, uniforms: { uK: { value: 600 }, uB: { value: dustMat ? 1 : .55 }, uM: { value: dustMat ? 60 : 24 } } });
    var o = new T.Points(g, m); o.frustumCulled = false; mats.push(m); return o;
  }
  function orient(o, n, spin) { var q = new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), new T.Vector3(n[0], n[1], n[2])); var q2 = new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 1, 0), spin || 0); o.quaternion.copy(q.multiply(q2)); }

  function layout() {
    G.forEach(function (g) {
      if (g.k === 'MW') { g.p = [0, 0, 0]; g.n = [0, 1, 0]; }
      else { g.p = sc(g.ra, g.de, g.d); g.n = g.inc != null ? diskN(g.ra, g.de, g.inc, g.pa) : norm([.3, 1, .2]); }
    });
    DW.forEach(function (d, i) { d.p = sc(d[1], d[2], d[3]); d.k = 'D' + i; });
    var m31 = G[3].p; BARY = [m31[0] * .49, m31[1] * .49, m31[2] * .49];   // 质心:银河—仙女连线上约 125 万光年处(示意;两者质量相近,仙女略大)
    var l = G[1].p, u = norm(l); GATE = [u[0] * 150, u[1] * 150, u[2] * 150];
  }
  function find(k) { var g = G.filter(function (x) { return x.k === k; })[0]; if (g) return g; if (k && k[0] === 'D') { var d = DW[+k.slice(1)]; if (d) return { k: k, zh: d[0], en: 'dwarf', ty: 'ds', p: d.p, d: d[3], R: 1.2, ra: d[1], de: d[2], c: '#cdb8ff', vii: d[3] > 1000 ? 'VII-2' : 'VII-1', fx: [['类型', '矮星系'], ['距离', '约 ' + fly(d[3] * KLY)]] }; } return null; }

  function build3d() {
    T = window.THREE; if (!T || !T.WebGLRenderer) return false;
    try { rd = new T.WebGLRenderer({ canvas: cv, antialias: false, alpha: false, powerPreference: 'high-performance' }); } catch (e) { rd = null; return false; }
    rd.setPixelRatio(Math.min(devicePixelRatio || 1, small() ? 1.25 : 1.5)); rd.setClearColor(0x010208, 1);
    scn = new T.Scene(); cam = new T.PerspectiveCamera(55, 1, .5, 2e5);
    var sf = small() ? .22 : 1; mats = []; GR = {};
    G.forEach(function (g) {
      var b = genGal(g, sf), grp = new T.Group(); grp.add(pts(b)); if (b.DS.length) { var dd = pts(b, true); dd.renderOrder = 2; grp.add(dd); }
      grp.position.set(g.p[0], g.p[1], g.p[2]); orient(grp, g.n, g.k === 'MW' ? 0 : g.d * .01); scn.add(grp); GR[g.k] = grp;
    });
    DW.forEach(function (d, i) { var b = genGal({ k: 'D' + i, ty: 'ds', R: d[3] > 1000 ? 1.6 : 1.1, N: d[3] > 1000 ? 900 : 600 }, sf), o = pts(b); o.position.set(d.p[0], d.p[1], d.p[2]); scn.add(o); });
    // 麦哲伦流:两云之间及其后方的淡粉气体长尾(3D 粒子)
    var R = rnd(271), sp = [], scl = [], ss = [], a = G[1].p, b2 = G[2].p, nS = small() ? 1500 : 6000;
    for (var k = 0; k < nS; k++) { var t = R() * 1.6 - .1, base = [a[0] + (b2[0] - a[0]) * t, a[1] + (b2[1] - a[1]) * t, a[2] + (b2[2] - a[2]) * t], wob = 18 * Math.sin(t * 3); sp.push(base[0] + gauss(R) * 2.5 + wob, base[1] + gauss(R) * 2.5 + t * t * 40, base[2] + gauss(R) * 2.5); scl.push(.55, .3, .5); ss.push(.8 + R() * .8); }
    var stream = pts({ P: new Float32Array(sp), C: new Float32Array(scl), S: new Float32Array(ss) }); stream.material.uniforms.uB.value = .06; stream.material.uniforms.uM.value = 14; scn.add(stream);
    // 远处背景星系(很远的几千个小光斑,只作纵深)
    var bp = [], bc = [], bs = [], R2 = rnd(99);
    for (k = 0; k < (small() ? 800 : 3000); k++) { var th = R2() * 6.283, ph = Math.acos(2 * R2() - 1), rr = 30000 + R2() * 40000; bp.push(rr * Math.sin(ph) * Math.cos(th), rr * Math.cos(ph), rr * Math.sin(ph) * Math.sin(th)); var w = R2(); bc.push(.8 + w * .2, .75 + w * .1, .7 + (1 - w) * .3); bs.push(60 + R2() * 120); }
    var bg = pts({ P: new Float32Array(bp), C: new Float32Array(bc), S: new Float32Array(bs) }); bg.material.uniforms.uB.value = .25; bg.material.uniforms.uM.value = 3; scn.add(bg);
    // 本星系群质心标记:细环 + 示意坐标盘(L0 网格)
    var ring = [], seg = 128; for (var ri = 1; ri <= 5; ri++) for (k = 0; k < seg; k++) { var a1 = k / seg * 6.283, a2 = (k + 1) / seg * 6.283, r0 = ri * 1000; ring.push(BARY[0] + r0 * Math.cos(a1), BARY[1] - 400, BARY[2] + r0 * Math.sin(a1), BARY[0] + r0 * Math.cos(a2), BARY[1] - 400, BARY[2] + r0 * Math.sin(a2)); }
    var rg = new T.BufferGeometry(); rg.setAttribute('position', new T.BufferAttribute(new Float32Array(ring), 3));
    GR.grid = new T.LineSegments(rg, new T.LineBasicMaterial({ color: 0x8fa6c8, transparent: true, opacity: .16, depthTest: false, depthWrite: false })); GR.grid.frustumCulled = false; scn.add(GR.grid);
    // 仙女座接近路径(虚线)
    var m31 = G[3].p, ap = [], na = 40; for (k = 0; k < na; k++) { var t1 = k / na, t2 = (k + .55) / na; ap.push(m31[0] * (1 - t1), m31[1] * (1 - t1) + Math.sin(t1 * 3.14) * 180, m31[2] * (1 - t1), m31[0] * (1 - t2), m31[1] * (1 - t2) + Math.sin(t2 * 3.14) * 180, m31[2] * (1 - t2)); }
    var ag = new T.BufferGeometry(); ag.setAttribute('position', new T.BufferAttribute(new Float32Array(ap), 3));
    GR.path = new T.LineSegments(ag, new T.LineBasicMaterial({ color: 0xf0c97a, transparent: true, opacity: .35, depthTest: false, depthWrite: false })); GR.path.frustumCulled = false; scn.add(GR.path);
    // 并合后的椭圆星系(演示用,初始隐藏)
    var mg = genGal({ k: 'MILKOMEDA', ty: 'el', R: 70, N: 120000, q: .7 }, sf); GR.merge = pts(mg); GR.merge.visible = false; scn.add(GR.merge);
    return true;
  }

  /* ---------- 视图 DOM ---------- */
  function css() {
    if (document.getElementById('xlg-css')) return; var s = document.createElement('style'); s.id = 'xlg-css';
    s.textContent = '#xlg{position:fixed;inset:0;z-index:97;background:#010208;color:#dfe9f7;font:13px/1.5 "Noto Sans SC",system-ui,"PingFang SC","Microsoft YaHei",sans-serif;opacity:0;transition:opacity .5s;touch-action:none;user-select:none;-webkit-user-select:none}#xlg.on{opacity:1}#xlg:not(.on){pointer-events:none}' +
      'body.xlg-on #shx-badge,body.xlg-on #xvt-tip{display:none!important}#xlg canvas.cv{position:absolute;inset:0;width:100%;height:100%;display:block;cursor:grab}#xlg canvas.wh{position:absolute;inset:0;width:100%;height:100%;display:none;pointer-events:none;z-index:6}' +
      '#xlg .hd{position:absolute;left:18px;top:14px;right:70px;pointer-events:none}#xlg .hd .k{font-size:11px;letter-spacing:.18em;color:#b8a8ff}#xlg .hd h2{margin:2px 0;font-size:22px;font-weight:600;letter-spacing:.04em}#xlg .hd h2 small{font-size:12px;color:#9fb3cf;margin-left:8px;letter-spacing:.14em;font-weight:400}' +
      '#xlg .hd p{margin:0;color:#b8c6dc;font-size:12px}#xlg .rd{display:inline-block;margin-top:6px;padding:3px 10px;border:1px solid rgba(127,214,255,.35);border-radius:10px;background:rgba(4,10,24,.6);color:#bfe6ff;font-size:12px;font-variant-numeric:tabular-nums}' +
      '#xlg .x{position:absolute;right:16px;top:12px;width:36px;height:36px;border-radius:50%;border:1px solid rgba(255,255,255,.25);background:rgba(10,16,32,.6);color:#fff;font-size:18px;cursor:pointer;z-index:5}' +
      '#xlg .bar{position:absolute;left:50%;bottom:14px;transform:translateX(-50%);display:flex;gap:6px;flex-wrap:wrap;justify-content:center;max-width:94vw;z-index:4}#xlg .bar button,#xlg .lv button{padding:6px 12px;border-radius:14px;border:1px solid rgba(255,255,255,.22);background:rgba(8,14,30,.72);color:#dfe9f7;font:inherit;font-size:12px;cursor:pointer}#xlg .bar button.on{border-color:#f0c97a;color:#f0c97a}' +
      '#xlg .bar button.bk{border-color:rgba(184,168,255,.6);color:#d8ccff}#xlg .lv{position:absolute;right:14px;top:64px;display:flex;flex-direction:column;gap:4px;z-index:4}#xlg .lv button{text-align:left;padding:4px 10px}#xlg .lv button b{color:#7fd6ff;margin-right:6px}#xlg .lv button.on{border-color:#7fd6ff}#xlg .lv button.ext{opacity:.5}' +
      '#xlg .lay{position:absolute;inset:0;pointer-events:none;z-index:3}#xlg .m{position:absolute;left:0;top:0;white-space:nowrap;font-size:12px;pointer-events:auto;cursor:pointer;text-shadow:0 0 4px #000,0 0 8px #000}#xlg .m:before{content:"";display:inline-block;width:7px;height:7px;border-radius:50%;background:currentColor;margin-right:5px;vertical-align:1px;box-shadow:0 0 6px currentColor}#xlg .m small{color:#9fb3cf;margin-left:4px}' +
      '#xlg .m.dw{font-size:11px;opacity:.75}#xlg .m.dw:before{width:5px;height:5px}#xlg .m.sun{color:#f0c97a}' +
      '#xlg .cd{position:absolute;left:16px;top:120px;width:300px;max-width:calc(100vw - 32px);max-height:calc(100vh - 200px);overflow:auto;padding:14px 16px;border-radius:14px;border:1px solid rgba(127,214,255,.3);background:rgba(6,12,28,.88);backdrop-filter:blur(6px);z-index:5}#xlg .cd h3{margin:0 0 2px;font-size:17px}#xlg .cd .ty{color:#9fb3cf;font-size:12px}#xlg .cd dl{display:grid;grid-template-columns:auto 1fr;gap:3px 10px;margin:8px 0}#xlg .cd dt{color:#9fb3cf}#xlg .cd dd{margin:0}' +
      '#xlg .cd .q{margin:8px 0;padding:6px 10px;border-radius:10px;background:rgba(240,201,122,.1);color:#f6dfa9}#xlg .cd .c{position:absolute;right:8px;top:6px;border:0;background:none;color:#fff;font-size:18px;cursor:pointer}#xlg .cd .nt{color:#8ea0bb;font-size:11px;margin-top:6px}#xlg .cd .row{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}#xlg .cd .row button{padding:6px 12px;border-radius:12px;border:1px solid rgba(240,201,122,.6);background:rgba(240,201,122,.12);color:#f6dfa9;font:inherit;cursor:pointer}#xlg .cd ul{margin:4px 0;padding-left:18px}#xlg .cd li a{color:#7fd6ff;cursor:pointer}' +
      '#xlg .tl{position:absolute;left:50%;bottom:58px;transform:translateX(-50%);width:min(520px,90vw);display:none;padding:8px 14px;border-radius:12px;background:rgba(6,12,28,.85);border:1px solid rgba(240,201,122,.4);z-index:4;text-align:center}#xlg .tl input{width:100%}#xlg .tl .v{color:#f6dfa9;font-variant-numeric:tabular-nums}#xlg .tl small{color:#8ea0bb}' +
      '#xlg .whr{position:absolute;left:50%;top:62%;transform:translateX(-50%);z-index:7;display:none;padding:8px 16px;border-radius:12px;background:rgba(4,8,20,.7);border:1px solid rgba(184,168,255,.45);text-align:center;font-variant-numeric:tabular-nums;color:#e4dcff}#xlg .whr b{font-size:16px;color:#fff}' +
      '@media (max-width:760px){#xlg .lv{display:none}#xlg .cd{top:auto;bottom:110px;left:8px;width:auto;right:8px;max-height:45vh}#xlg .hd h2{font-size:18px}}';
    document.head.appendChild(s);
  }
  function dom() {
    css(); ov = document.createElement('div'); ov.id = 'xlg'; ov.style.display = 'none';   /* C2.13a3:未打开时必须隐藏,否则透明层盖住银河全景吃掉所有点击/拖动 */ ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-label', '星域 VII 本星系群');
    ov.innerHTML = '<canvas class="cv"></canvas><canvas class="wh"></canvas><div class="lay"></div>' +
      '<div class="hd"><div class="k">星域 VII · 宇宙 · L0</div><h2>本星系群<small>THE LOCAL GROUP</small></h2><p>直径约 1,000 万光年 · 银河系、仙女座、三角座 + 约 80 个矮星系 · 模拟渲染(位置与倾角按实测)</p><div class="rd"></div></div>' +
      '<button class="x" type="button" aria-label="返回银河">×</button><div class="lv"></div><div class="tl"><div class="v"></div><input type="range" min="0" max="80" value="0" step="1" aria-label="时间"><small>模拟示意:按 van der Marel 等 2012 模型约 40–45 亿年后首次近距掠过、约 60 亿年后并合;2025 年 Gaia / 哈勃新测量认为 100 亿年内相撞概率约一半。</small></div>' +
      '<div class="whr"></div><div class="bar">' +
      '<button type="button" data-p="all" class="on">本星系群</button><button type="button" data-p="MW">银河系</button><button type="button" data-p="M31">仙女座</button><button type="button" data-p="M33">三角座</button><button type="button" data-p="mc">麦哲伦云</button>' +
      '<button type="button" data-a="w1">VII-1</button><button type="button" data-a="w2">VII-2</button><button type="button" data-a="tl">45 亿年后</button><button type="button" data-a="back" class="bk">↩ 穿门回银河</button></div>';
    document.body.appendChild(ov); cv = ov.querySelector('canvas.cv'); lay = ov.querySelector('.lay');
    ov.querySelector('.x').onclick = function () { back(); };
    ov.querySelectorAll('.bar button[data-p]').forEach(function (b) { b.onclick = function () { preset(b.dataset.p); }; });
    ov.querySelectorAll('.bar button[data-a]').forEach(function (b) { b.onclick = function () { var a = b.dataset.a; if (a === 'w1') world('VII-1'); else if (a === 'w2') world('VII-2'); else if (a === 'tl') tl(); else back(); }; });
    var lv = ov.querySelector('.lv'); LV7.forEach(function (L, i) { var b = document.createElement('button'); b.type = 'button'; b.title = L.sc; b.innerHTML = '<b>' + L.k + '</b>' + L.zh; if (i) { b.classList.add('ext'); b.title += '(C2.13b/c 开放)'; } else b.classList.add('on'); b.onclick = function () { if (!i) preset('all'); else hint(L.k + ' ' + L.zh + ':' + L.sc + ' —— C2.13b/c 开放'); }; lv.appendChild(b); });
    var tr = ov.querySelector('.tl input'); tr.oninput = function () { setT(+tr.value / 10); };
    // 标签
    LBL = [];
    G.forEach(function (g) { var e = document.createElement('div'); e.className = 'm'; e.style.color = g.c; e.innerHTML = g.zh + '<small>' + (g.d ? fly(g.d * KLY) : '你在这里') + '</small>'; e.onclick = function (ev) { ev.stopPropagation(); show(g.k); }; lay.appendChild(e); LBL.push({ el: e, k: g.k, big: g.R > 20 || g.k === 'LMC' }); });
    DW.forEach(function (d, i) { var e = document.createElement('div'); e.className = 'm dw'; e.style.color = '#cdb8ff'; e.textContent = d[0]; e.onclick = function (ev) { ev.stopPropagation(); show('D' + i); }; lay.appendChild(e); LBL.push({ el: e, k: 'D' + i, dw: 1 }); });
    var su = document.createElement('div'); su.className = 'm sun'; su.textContent = '太阳系'; lay.appendChild(su); LBL.push({ el: su, k: 'sun', p: [TS.R0 / KLY, 0, 0] });
    var bc = document.createElement('div'); bc.className = 'm'; bc.style.color = '#8fa6c8'; bc.innerHTML = '本星系群质心<small>VII 原点</small>'; lay.appendChild(bc); LBL.push({ el: bc, k: 'bary', p: BARY });
    input();
  }
  function hint(t) { var r = ov.querySelector('.rd'); r.dataset.h = t; r.textContent = t; clearTimeout(hint.t); hint.t = setTimeout(function () { delete r.dataset.h; }, 3500); }
  function size() { if (!cv) return; var w = innerWidth, h = innerHeight; if (rd) { rd.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); } else { cv.width = w; cv.height = h; } var wc = ov.querySelector('canvas.wh'); wc.width = Math.round(w * (small() ? .7 : 1)); wc.height = Math.round(h * (small() ? .7 : 1)); }

  /* ---------- 相机 ---------- */
  var PRE = { all: { t: 'bary', d: 3600, pit: .55, yaw: -.9 }, MW: { t: 'MW', d: 190, pit: .7, yaw: .3 }, M31: { t: 'M31', d: 300, pit: .35, yaw: -1.2 }, M33: { t: 'M33', d: 130, pit: .5, yaw: -.6 }, mc: { t: 'LMC', d: 260, pit: .45, yaw: .9 } };
  function tgt(k) { if (k === 'bary') return BARY; var g = find(k); return g ? g.p : [0, 0, 0]; }
  function tween(p, d, pit, yaw, ms) { if (rm() || mode === '2d') { C.tx = p[0]; C.ty = p[1]; C.tz = p[2]; C.d = d; if (pit != null) C.pit = pit; if (yaw != null) C.yaw = yaw; TW = null; if (mode === '2d') flat(); return; } TW = { a: [C.tx, C.ty, C.tz, C.d, C.pit, C.yaw], b: [p[0], p[1], p[2], d, pit == null ? C.pit : pit, yaw == null ? C.yaw : yaw], t0: performance.now(), ms: ms || 1600 }; }
  function preset(k) { var P = PRE[k]; if (!P) return; ov.querySelectorAll('.bar button[data-p]').forEach(function (b) { b.classList.toggle('on', b.dataset.p === k); }); tween(tgt(P.t), P.d, P.pit, P.yaw, k === 'all' ? 2200 : 1800); idle = performance.now() + 5000; }
  function input() {
    var pts_ = {}, dn = null;
    cv.addEventListener('pointerdown', function (e) { cv.setPointerCapture(e.pointerId); pts_[e.pointerId] = [e.clientX, e.clientY]; dn = [e.clientX, e.clientY]; TW = null; idle = performance.now() + 6000; });
    cv.addEventListener('pointermove', function (e) {
      var p = pts_[e.pointerId]; if (!p) return; var ks = Object.keys(pts_);
      if (ks.length === 1) { C.yaw -= (e.clientX - p[0]) * .005; C.pit = Math.max(-1.45, Math.min(1.5, C.pit + (e.clientY - p[1]) * .005)); }
      else if (ks.length === 2) { var o = pts_[ks[0] == e.pointerId ? ks[1] : ks[0]], d0 = Math.hypot(p[0] - o[0], p[1] - o[1]), d1 = Math.hypot(e.clientX - o[0], e.clientY - o[1]); if (d0 > 0 && d1 > 0) zoom(d0 / d1); }
      pts_[e.pointerId] = [e.clientX, e.clientY]; if (mode === '2d') flat();
    });
    function up(e) { delete pts_[e.pointerId]; }
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    cv.addEventListener('wheel', function (e) { e.preventDefault(); zoom(Math.exp(e.deltaY * .0012)); idle = performance.now() + 6000; if (mode === '2d') flat(); }, { passive: false });
  }
  function zoom(f) { C.d = Math.max(4, Math.min(16000, C.d * f)); }
  function camPos() { var cp = Math.cos(C.pit); return [C.tx + C.d * cp * Math.sin(C.yaw), C.ty + C.d * Math.sin(C.pit), C.tz + C.d * cp * Math.cos(C.yaw)]; }

  /* ---------- 卡片 ---------- */
  function vii(p) {   // VII 地址:以本星系群质心为原点,按距质心每 50 万光年一环(示意)
    var d = Math.hypot(p[0] - BARY[0], p[1] - BARY[1], p[2] - BARY[2]) * KLY, dm = Math.hypot(p[0], p[1], p[2]) * KLY;
    return { d: d, dm: dm, addr: 'VII·L0-' + (d < 5e6 ? 'R' + (Math.floor(d / 5e5) + 1) : '外') };
  }
  function closeCard() { if (card) { card.remove(); card = null; } }
  function show(k) {
    var g = k === 'MW' ? G[0] : find(k); if (!g) return; closeCard();
    var v = vii(g.p), dsun = g.k === 'MW' ? 0 : g.d * KLY;
    card = document.createElement('div'); card.className = 'cd'; card.setAttribute('role', 'dialog');
    card.innerHTML = '<button class="c" type="button" aria-label="关闭">×</button><h3>' + g.zh + '</h3><div class="ty">' + (g.en || '') + ' · 所属 ' + g.vii + '</div><dl>' +
      '<dt>VII 地址</dt><dd>' + v.addr + '</dd><dt>距本星系群质心</dt><dd>约 ' + fly(v.d) + '</dd>' + (g.k !== 'MW' ? '<dt>距太阳</dt><dd>约 ' + fly(dsun) + '</dd><dt>回看时间</dt><dd>你看到的是约 ' + yrs(dsun) + '前的光</dd>' : '') +
      (g.fx || []).map(function (f) { return '<dt>' + f[0] + '</dt><dd>' + f[1] + '</dd>'; }).join('') + '</dl><div class="row"><button type="button" class="go">飞近看</button>' + (g.dv ? '<button type="button" class="dv">驾驶舱 ✦ 航点</button>' : '') + '</div>' +
      '<div class="nt">模拟渲染(3D 粒子),非照片;距离为约数,来源 NASA / ESA / McConnachie 2012。' + (g.dv ? '✦ = 可在驾驶舱锁定飞抵的深空航点。' : '') + '</div>';
    ov.appendChild(card); card.querySelector('.c').onclick = closeCard;
    card.querySelector('.go').onclick = function () { tween(g.p, Math.max(8, (g.R || 2) * 3.2), null, null, 1600); };
    var dv = card.querySelector('.dv'); if (dv) dv.onclick = function () { var key = g.dv; close(true); if (window.SHXDV && SHXDV.lock) try { SHXDV.lock(key); } catch (e) { } };
  }
  function world(id) {
    var w = W7.filter(function (x) { return x.id === id; })[0]; if (!w) return; closeCard();
    card = document.createElement('div'); card.className = 'cd'; card.setAttribute('role', 'dialog'); card.setAttribute('aria-label', '世界卡 ' + w.id);
    card.innerHTML = '<button class="c" type="button" aria-label="关闭">×</button><h3>' + w.id + ' · ' + w.im + '<small style="font-size:12px;color:#9fb3cf;margin-left:6px">' + w.zh + '</small></h3><div class="ty">星域 VII · 宇宙世界</div>' +
      '<div class="q">❓ ' + w.q + '<br><small style="color:#b8c6dc">' + w.q2 + '</small></div><p>' + w.land + '</p><dl><dt>范围</dt><dd>' + w.dist + '</dd></dl><div class="ty">代表天体</div><ul>' +
      w.o.map(function (k) { var g = find(k); return g ? '<li><a data-k="' + k + '">' + g.zh + '</a></li>' : ''; }).join('') + '</ul><div class="row"><button type="button" class="go">进入世界 · L0</button></div><div class="nt">自由探索;VII-3 至 VII-7 在 C2.13b/c 开放。</div>';
    ov.appendChild(card); card.querySelector('.c').onclick = closeCard;
    card.querySelectorAll('li a').forEach(function (a) { a.onclick = function () { var k = a.dataset.k; var g = find(k); if (g) { tween(g.p, Math.max(8, (g.R || 2) * 3.4), null, null, 1600); show(k); } }; });
    card.querySelector('.go').onclick = function () { preset(id === 'VII-1' ? 'MW' : 'all'); if (id === 'VII-1') tween([0, 0, 0], 900, .6, .5, 1800); };
  }

  /* ---------- 碰撞时间加速(模拟示意) ---------- */
  function tl() { var e = ov.querySelector('.tl'), on = e.style.display !== 'block'; e.style.display = on ? 'block' : 'none'; ov.querySelector('.bar button[data-a="tl"]').classList.toggle('on', on); if (on) { tween([G[3].p[0] * .3, G[3].p[1] * .3, G[3].p[2] * .3], 3400, .7, -.9, 1800); } else { e.querySelector('input').value = 0; setT(0); } }
  function setT(gy) {   // gy:十亿年(0–8)
    ov.querySelector('.tl .v').textContent = gy < .05 ? '现在' : '约 ' + (gy * 10).toFixed(0) + ' 亿年后' + (gy >= 5.8 ? ' · 已并合成一个椭圆星系(示意)' : gy >= 3.8 && gy < 4.8 ? ' · 首次近距掠过' : '');
    if (!GR.M31) return; var m31 = G[3].p, f, o;
    if (gy < 4.2) { f = 1 - Math.pow(gy / 4.2, 1.6) * .96; o = [m31[0] * f, m31[1] * f + Math.sin(gy / 4.2 * 3.14) * 160, m31[2] * f]; }
    else { var s = Math.min(1, (gy - 4.2) / 1.8); o = [m31[0] * .04 * (1 - s) - 90 * Math.sin(s * 3.14), m31[1] * .04 * (1 - s), m31[2] * .04 * (1 - s) + 70 * Math.sin(s * 3.14)]; }
    var dk = ['M31', 'M32', 'M110']; dk.forEach(function (k) { var g = find(k), d = [g.p[0] - m31[0], g.p[1] - m31[1], g.p[2] - m31[2]]; GR[k].position.set(o[0] + d[0], o[1] + d[1], o[2] + d[2]); });
    var mf = gy < 5 ? 0 : Math.min(1, (gy - 5) / 1.2); GR.merge.visible = mf > 0; GR.merge.material.uniforms.uB.value = .55 * mf;
    ['MW', 'M31', 'M32', 'M110'].forEach(function (k) { GR[k].visible = mf < 1; GR[k].children.forEach(function (c) { c.material.uniforms.uB.value = (c.material.blending === T.NormalBlending ? 1 : .55) * (1 - mf); }); });
    if (gy >= 4) { var s2 = Math.min(1, (gy - 4) / 2); GR.MW.rotation.z = s2 * .5; GR.M31.rotation.x += 0; }
    GR.path.visible = gy < .05;
    demo = gy;
  }

  /* ---------- 帧 ---------- */
  function frame(now) {
    raf = requestAnimationFrame(frame); var dt = Math.min(.1, (now - last) / 1000); last = now;
    if (WH) whStep(now); if (!open_) return; if (WH && WH.cover >= .99 && !WH.rev) return;
    if (TW) { var k = Math.min(1, (now - TW.t0) / TW.ms), e = k * k * (3 - 2 * k); var lgk = function (a, b) { return Math.exp(Math.log(a) + (Math.log(b) - Math.log(a)) * e); }; C.tx = TW.a[0] + (TW.b[0] - TW.a[0]) * e; C.ty = TW.a[1] + (TW.b[1] - TW.a[1]) * e; C.tz = TW.a[2] + (TW.b[2] - TW.a[2]) * e; C.d = lgk(TW.a[3], TW.b[3]); C.pit = TW.a[4] + (TW.b[4] - TW.a[4]) * e; C.yaw = TW.a[5] + (TW.b[5] - TW.a[5]) * e; if (k >= 1) TW = null; }
    else if (!rm() && now > idle) C.yaw += dt * .025;
    if (mode === '2d') return;
    var p = camPos(); cam.position.set(p[0], p[1], p[2]); cam.near = Math.max(.05, C.d * .002); cam.far = 2e5; cam.updateProjectionMatrix(); cam.lookAt(C.tx, C.ty, C.tz);
    var kk = innerHeight / (2 * Math.tan(cam.fov * D2R / 2)) * Math.min(devicePixelRatio || 1, small() ? 1.25 : 1.5); mats.forEach(function (m) { m.uniforms.uK.value = kk; });
    rd.render(scn, cam); labels(); readout();
  }
  function proj(q) { var v = new T.Vector3(q[0], q[1], q[2]).project(cam); if (v.z > 1 || v.z < -1) return null; return [(v.x + 1) / 2 * innerWidth, (1 - v.y) / 2 * innerHeight]; }
  function labels() {
    var cp = camPos();
    LBL.forEach(function (L) {
      var g = L.p ? { p: L.p } : (L.k === 'MW' ? G[0] : find(L.k)); if (!g) return; var pp = L.k === 'M31' || L.k === 'M32' || L.k === 'M110' || L.k === 'MW' ? (GR[L.k] ? [GR[L.k].position.x, GR[L.k].position.y, GR[L.k].position.z] : g.p) : g.p;
      var dd = Math.hypot(pp[0] - cp[0], pp[1] - cp[1], pp[2] - cp[2]), hide = (L.dw && dd > 2600) || (L.k === 'sun' && dd > 400) || (L.k === 'bary' && dd < 600) || (demo > 5.5 && /^(M31|M32|M110)$/.test(L.k));
      var q = hide ? null : proj(pp); if (!q || q[1] < 96 || q[1] > innerHeight - 60) { L.el.style.display = 'none'; return; }
      L.el.style.display = ''; L.el.style.transform = 'translate(' + Math.round(q[0]) + 'px,' + Math.round(q[1]) + 'px)';
    });
  }
  function readout() {
    var r = ov.querySelector('.rd'); if (r.dataset.h) return; var t = [C.tx, C.ty, C.tz], v = vii(t);
    r.textContent = '视点 ' + v.addr + ' · 距银心 ' + fly(v.dm) + ' · 距质心 ' + fly(v.d) + ' · 视野约 ' + fly(C.d * KLY * 1.04);
  }
  function flat() {   // 无 WebGL:2D 俯视点图(可点标签)
    var g = cv.getContext('2d'), W = cv.width, H = cv.height; g.fillStyle = '#010208'; g.fillRect(0, 0, W, H);
    var s = Math.min(W, H) / (C.d * 1.4), cx = W / 2, cy = H / 2;
    function P(p) { var x = p[0] - C.tx, z = p[2] - C.tz, c = Math.cos(C.yaw), si = Math.sin(C.yaw); return [cx + (x * c - z * si) * s, cy + (x * si + z * c) * s]; }
    G.forEach(function (gg) { var q = P(gg.p), rr = Math.max(2, gg.R * s); var gr = g.createRadialGradient(q[0], q[1], 0, q[0], q[1], rr); gr.addColorStop(0, 'rgba(255,236,200,.9)'); gr.addColorStop(.4, 'rgba(150,180,255,.35)'); gr.addColorStop(1, 'rgba(20,30,60,0)'); g.fillStyle = gr; g.beginPath(); g.arc(q[0], q[1], rr, 0, 6.283); g.fill(); });
    g.fillStyle = 'rgba(205,184,255,.8)'; DW.forEach(function (d) { var q = P(d.p); g.beginPath(); g.arc(q[0], q[1], 1.6, 0, 6.283); g.fill(); });
    LBL.forEach(function (L) { var gg = L.p ? { p: L.p } : (L.k === 'MW' ? G[0] : find(L.k)); var q = gg && P(gg.p); if (!q || q[1] < 96 || q[1] > H - 60 || q[0] < 0 || q[0] > W || (L.dw && C.d > 2600)) { L.el.style.display = 'none'; return; } L.el.style.display = ''; L.el.style.transform = 'translate(' + Math.round(q[0]) + 'px,' + Math.round(q[1]) + 'px)'; });
    readout();
  }

  /* ---------- 虫洞穿越 ---------- */
  function whStart(rev, done) {
    var c = ov.querySelector('canvas.wh'), r = ov.querySelector('.whr'), dly = Math.hypot(G[3].p[0], G[3].p[1], G[3].p[2]) * KLY, gate = 150000;
    r.innerHTML = rev ? '虫洞门 · 返回银河<br><b>星域 VII → VI</b>' : '虫洞门 · 穿越中<br><b>' + fly(gate) + ' → 本星系群</b><br>真实尺度:光走到仙女座要 ' + yrs(dly) + ',旅行者 1 号要约 ' + yrs(dly * 17600) + '<br><small>虫洞为科幻设定,用来压缩时间;距离与光行时间是真实的</small>';
    if (rm() || !c.getContext) { r.style.display = 'block'; ov.style.transition = 'opacity .6s'; WH = { t0: performance.now(), ms: 1400, fade: 1, rev: rev, done: done, cover: 1 }; return; }
    var R = rnd(rev ? 7 : 3), S = []; for (var i = 0; i < (small() ? 700 : 2200); i++) S.push({ a: R() * 6.283, z: R(), w: R() < .08 ? 2 : 1, h: R() < .6 ? 250 + R() * 30 : R() < .5 ? 200 + R() * 40 : 300 + R() * 30 });
    c.style.display = 'block'; r.style.display = 'block'; WH = { t0: performance.now(), ms: rev ? 2600 : 4600, S: S, rev: rev, done: done, cover: 0, c: c, g: c.getContext('2d') };
  }
  function whStep(now) {
    if (!WH.st) { WH.st = 1; WH.t0 = now; } var u = Math.min(1, (now - WH.t0) / WH.ms);
    if (WH.fade) { WH.cover = 1; ov.querySelector('.whr').style.opacity = String(1 - Math.max(0, u - .7) / .3); if (u >= 1) whEnd(); return; }
    var g = WH.g, W = WH.c.width, H = WH.c.height, cx = W / 2, cy = H / 2, M = Math.hypot(W, H) / 2, cov = Math.min(1, u / .12) * Math.min(1, (1 - u) / .16);
    WH.cover = Math.max(0, Math.min(1, cov * 1.05)); var spd = Math.sin(Math.min(1, u) * Math.PI);
    g.globalCompositeOperation = 'source-over'; g.fillStyle = 'rgba(4,3,16,' + (.18 + .82 * (1 - WH.cover * .6)) * WH.cover + ')'; g.fillRect(0, 0, W, H);
    g.globalCompositeOperation = 'lighter';
    var tw = (now - WH.t0) / 1000;
    WH.S.forEach(function (s) {
      s.z -= (.004 + .03 * spd) * (WH.rev ? -1 : 1); if (s.z < .02) s.z += 1; if (s.z > 1) s.z -= 1;
      var bend = Math.sin(tw * .9 + s.z * 4) * .35, ang = s.a + tw * .45 + (1 - s.z) * 2.2 + bend, r1 = M * .06 / Math.max(.03, s.z), r0 = M * .06 / Math.max(.03, s.z + .03 + spd * .05);
      var ox = Math.sin(tw * .7) * M * .08 * (1 - s.z), oy = Math.cos(tw * .5) * M * .05 * (1 - s.z);
      var a1 = ang - .06 * spd, x0 = cx + ox + Math.cos(a1) * r0, y0 = cy + oy + Math.sin(a1) * r0 * .9, x1 = cx + ox + Math.cos(ang) * r1, y1 = cy + oy + Math.sin(ang) * r1 * .9;
      var al = Math.min(1, (1 - s.z) * 1.4) * WH.cover; g.strokeStyle = 'hsla(' + s.h + ',70%,' + (62 + s.w * 10) + '%,' + al * .55 + ')'; g.lineWidth = s.w * (1 + (1 - s.z) * 1.6); g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
    });
    // 出口:爱因斯坦环
    var er = M * (.05 + .5 * Math.pow(u, 3)), ring = g.createRadialGradient(cx, cy, er * .78, cx, cy, er * 1.12);
    ring.addColorStop(0, 'rgba(0,0,0,0)'); ring.addColorStop(.55, 'rgba(225,235,255,' + .55 * WH.cover + ')'); ring.addColorStop(1, 'rgba(120,110,255,0)'); g.fillStyle = ring; g.beginPath(); g.arc(cx, cy, er * 1.12, 0, 6.283); g.fill();
    var core = g.createRadialGradient(cx, cy, 0, cx, cy, er * .7); core.addColorStop(0, 'rgba(255,230,190,' + .35 * WH.cover * u + ')'); core.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = core; g.beginPath(); g.arc(cx, cy, er * .7, 0, 6.283); g.fill();
    g.globalCompositeOperation = 'source-over';
    if (u > .82) { g.fillStyle = 'rgba(1,2,8,' + (1 - (u - .82) / .18) * .0 + ')'; }
    WH.c.style.opacity = String(Math.min(1, (1 - u) / .14));
    if (u >= 1) whEnd();
  }
  function whEnd() { var w = WH; WH = null; ov.querySelector('.whr').style.display = 'none'; ov.querySelector('.whr').style.opacity = ''; var c = ov.querySelector('canvas.wh'); c.style.display = 'none'; c.style.opacity = ''; var g = c.getContext && c.getContext('2d'); if (g) g.clearRect(0, 0, c.width, c.height); if (w && w.done) w.done(); }

  /* ---------- 开关 ---------- */
  function ensure() { TS = window.SHXTSG; if (!TS) return false; if (!BARY) layout(); if (!ov) dom(); return true; }
  function open(o) {
    o = o || {}; if (open_ || !ensure()) return false;
    open_ = true; ov.style.display = ''; document.body.classList.add('xlg-on');
    if (mode !== '2d' && !rd) { if (!build3d()) mode = '2d'; }
    size(); closeCard(); demo = 0;
    var P = PRE.all; C.tx = BARY[0]; C.ty = BARY[1]; C.tz = BARY[2]; C.d = P.d; C.pit = P.pit; C.yaw = P.yaw;
    last = performance.now(); idle = last + 5000; requestAnimationFrame(function () { ov.classList.add('on'); });
    addEventListener('resize', onR); raf = requestAnimationFrame(frame);
    if (mode === '2d') flat();
    if (o.gate && !o.fast) { C.tx = 0; C.ty = 0; C.tz = 0; C.d = 420; C.pit = .5; C.yaw = .9; whStart(false, function () { tween(BARY, PRE.all.d, PRE.all.pit, PRE.all.yaw, rm() ? 0 : 3200); }); }
    try { var u = new URL(location.href); u.searchParams.set('view', 'lg'); history.replaceState(null, '', u.pathname + u.search + u.hash); } catch (e) { }
    return true;
  }
  function onR() { size(); if (mode === '2d') flat(); }
  function close(silent) {
    if (!open_) return; open_ = false; document.body.classList.remove('xlg-on'); cancelAnimationFrame(raf); removeEventListener('resize', onR); closeCard(); WH = null;
    ov.classList.remove('on'); var o = ov; setTimeout(function () { if (!open_) o.style.display = 'none'; }, 500);
    var t = ov.querySelector('.tl'); if (t) { t.style.display = 'none'; t.querySelector('input').value = 0; }
    if (rd) { try { rd.dispose(); if (rd.forceContextLoss) rd.forceContextLoss(); } catch (e) { } rd = null; mats = []; scn = null; GR = {}; var nc = cv.cloneNode(false); cv.parentNode.replaceChild(nc, cv); cv = nc; input(); }
    mode = '3d';
    try { var u = new URL(location.href); if (u.searchParams.get('view') === 'lg') { u.searchParams.delete('view'); history.replaceState(null, '', u.pathname + u.search + u.hash); } } catch (e) { }
  }
  function back() {   // 穿门回银河:短虫洞 → 银河全景卫星星系视角
    if (!open_ || WH) return; closeCard();
    whStart(true, function () { close(); if (window.SHXGX) { SHXGX.open({ noIntro: true }); setTimeout(function () { SHXGX.preset('mc'); }, 60); } });
  }
  // 从银河穿门:先在银河全景上方盖上虫洞,再关银河
  function enter(o) {
    o = o || {}; if (!ensure()) return false; var gx = window.SHXGX && SHXGX.isOpen && SHXGX.isOpen();
    if (!open({ gate: true, fast: !!o.fast })) return false;
    if (gx) setTimeout(function () { try { SHXGX.close(); } catch (e) { } }, rm() ? 300 : 700);
    return true;
  }

  /* ---------- 挂到银河全景:麦哲伦门(3D 门环 + 透镜光环)与门卡按钮 ---------- */
  function hookGX() {
    var X = window.SHXGX && SHXGX._; if (!X || !X.hook) return false; var GM = null, GL = null;
    X.hook('build', function (T3, scn3) {
      TS = window.SHXTSG; if (!TS || !ensure()) return;
      var g = GATE.map(function (v) { return v * KLY; }), n = norm(GATE), grp = new T3.Group(), R = rnd(151), P = [], Cc = [], S = [], k;
      for (k = 0; k < 2600; k++) { var a = R() * 6.283, rr = 5200 + gauss(R) * 140, seg = Math.floor(a / 6.283 * 24), lit = seg % 3 === 0 && R() < .5; P.push(rr * Math.cos(a), gauss(R) * 120, rr * Math.sin(a)); Cc.push(lit ? .5 : .62, lit ? .95 : .66, lit ? 1 : .85); S.push(lit ? 380 : 240); }
      for (k = 0; k < 1800; k++) { var a2 = R() * 6.283, r2 = 4300 + Math.abs(gauss(R)) * 450; P.push(r2 * Math.cos(a2), gauss(R) * 60, r2 * Math.sin(a2)); Cc.push(.85, .88, 1); S.push(300); }   // 爱因斯坦环
      for (k = 0; k < 1200; k++) { var a3 = R() * 6.283, r3 = Math.sqrt(R()) * 4000; P.push(r3 * Math.cos(a3), gauss(R) * 40, r3 * Math.sin(a3)); Cc.push(.55, .45, .95); S.push(420); }   // 门内透镜光
      var geo = new T3.BufferGeometry(); geo.setAttribute('position', new T3.BufferAttribute(new Float32Array(P), 3)); geo.setAttribute('aC', new T3.BufferAttribute(new Float32Array(Cc), 3)); geo.setAttribute('aS', new T3.BufferAttribute(new Float32Array(S), 1));
      var m = new T3.ShaderMaterial({ vertexShader: VS, fragmentShader: FS, transparent: true, depthWrite: false, depthTest: false, blending: T3.AdditiveBlending, uniforms: { uK: { value: 600 }, uB: { value: .8 }, uM: { value: 18 } } });
      var o = new T3.Points(geo, m); o.frustumCulled = false; grp.add(o); grp.position.set(g[0], g[1], g[2]);
      var q = new T3.Quaternion().setFromUnitVectors(new T3.Vector3(0, 1, 0), new T3.Vector3(n[0], n[1], n[2])); grp.quaternion.copy(q); scn3.add(grp); GM = { g: grp, m: m };
    });
    X.hook('frame', function (now, vis) { if (!GM) return; GM.g.visible = vis; GM.g.rotation.y = 0; var ov2 = X.ov(); var hh = ov2 && innerHeight; GM.m.uniforms.uK.value = hh / (2 * Math.tan(30 * D2R)) * Math.min(devicePixelRatio || 1, 1.5); GM.m.uniforms.uB.value = .7 + .2 * Math.sin(now / 600); });
    X.hook('labels', function (proj, W, H, far) {
      var lay3 = X.lay(); if (!lay3 || !GATE) return;
      if (!GL) { GL = document.createElement('div'); GL.className = 'wl'; GL.style.color = '#d8ccff'; GL.innerHTML = '⊙ 虫洞门<small>穿门去星域 VII</small>'; GL.style.pointerEvents = 'auto'; GL.style.cursor = 'pointer'; GL.onclick = function (ev) { ev.stopPropagation(); enter(); }; lay3.appendChild(GL); }
      var q = proj(GATE.map(function (v) { return v * KLY; })); if (!q || far < 60000 || q[0] < 0 || q[0] > W || q[1] < 120 || q[1] > H - 70) { GL.style.display = 'none'; return; }
      GL.style.display = ''; GL.style.transform = 'translate(' + q[0] + 'px,' + q[1] + 'px)';
    });
    X.hook('close', function () { if (GL) GL.remove(); GL = null; GM = null; });
    X.hook('card', function (card3, w) {
      if (w.id !== 'GATE') return;
      card3.querySelectorAll('.nt,.jr').forEach(function (n) { n.innerHTML = n.innerHTML.replace('信标站与虫洞门:C2.13a 开放', '信标站与虫洞门已开放').replace('穿虫洞门去星域 VII 在 C2.13a 开放', '到门槛信标站后可穿虫洞门去星域 VII'); });
      var row = card3.querySelector('.row'); if (!row) return; var b = document.createElement('button'); b.type = 'button'; b.className = 'go wg'; b.textContent = '⊙ 穿过虫洞门 → 星域 VII'; b.style.borderColor = 'rgba(184,168,255,.7)'; b.style.color = '#e4dcff'; b.onclick = function () { enter(); }; row.insertBefore(b, row.firstChild);
    });
    return true;
  }
  (function wait(n) { if (hookGX()) return; if (n < 200) setTimeout(function () { wait(n + 1); }, 100); })(0);
  if (window.SHXESC) SHXESC.reg('lg', 112, function () { return open_; }, function () { if (WH) return; if (card) closeCard(); else back(); });
  // 深链 ?view=lg
  try { if (/[?&]view=lg\b/.test(location.search)) (function w2(n) { if (window.SHXTSG && document.body && (window.SHDOM ? SHDOM.ready : true)) { setTimeout(function () { open(); }, 400); return; } if (n < 200) setTimeout(function () { w2(n + 1); }, 100); })(0); } catch (e) { }

  window.SHXLG = { open: open, close: close, enter: enter, back: back, isOpen: function () { return open_; }, busy: function () { return !!WH; }, mode: function () { return mode; }, preset: function (k) { if (open_) preset(k); }, show: function (k) { if (open_) show(k); return card ? card.textContent : ''; }, world: function (id) { if (open_) world(id); return card ? card.textContent : ''; }, t: function (gy) { if (open_) { if (ov.querySelector('.tl').style.display !== 'block') tl(); ov.querySelector('.tl input').value = Math.round(gy * 10); setT(gy); } return demo; }, hud: function () { return ov ? ov.querySelector('.rd').textContent : ''; },
    list: function () { if (!BARY && window.SHXTSG) { TS = SHXTSG; layout(); } return G.map(function (g) { return { k: g.k, zh: g.zh, p: g.p, d: g.d }; }).concat(DW.map(function (d, i) { return { k: 'D' + i, zh: d[0], p: d.p, d: d[3] }; })); }, gate: function () { return GATE; } };
})();
