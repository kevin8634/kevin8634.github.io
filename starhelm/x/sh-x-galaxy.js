/* 天枢 Starhelm 2.0 · C2.11a 星域 VI「银河」全景(SHXGX)
 * 王磊 10-30 09:25:开放 VI 银河,可进入一个整体范围 —— 看到银河全貌以及恒星、星团、星云、黑洞等天文元素的模拟渲染,类似太阳系全景。
 * - 独立全屏视图(自带 three 渲染器,r186 与 ?three=169 通用;无 WebGL 时退回 2D 俯视静图)。
 * - 银河结构(模拟渲染 · 非照片):核球、长约 1.7 万光年的中央棒(与日心-银心连线约 27°)、四条对数螺旋臂(俯仰约 15.5°,与 sh-x-cosmos.js
 *   「回望银河」同一套参数)、猎户臂(本地臂)、尘埃带、电离氢区;太阳距银心 26,996 光年(GRAVITY 2019)。
 * - 天体标记:按真实赤经赤纬 + 距离换算到银心坐标(J2000 → 银道,IAU 1958 旋转矩阵)。可飞抵的点「设为目的地」= SHXDV.lock。
 * - 相机:拖动旋转、滚轮 / 双指缩放;预设「全景 / 俯视 / 侧视 / 太阳附近 / 卫星星系」;空闲时缓慢绕转(减少动态时不转)。
 * - 入口:驾驶舱航图 VI「进入银河全景」;视图圆环「5 银河」;深链 ?view=galaxy。Esc 先关资料卡再关全景。
 * C2.12b(10-30 21:xx,设计稿第 02–04 节):天枢银河坐标 TSG(sh-x-gal-core.js SHXTSG)读数、扇区网格开关、十大银河世界 + 麦哲伦门边界与 11 张世界卡
 *   (sh-x-gal-worlds.js SHXGW)、六级尺度 L0–L5 读数与切换(L3–L5 交给驾驶舱 ✦ 航点);天体卡加 TSG 地址 / 银经银纬 / 所属世界。
 * C2.12a4(10-30 20:xx):压核心过曝(核球/棒/内盘星点与弥散光降亮、核区辉光减半并移到尘埃之前绘制,让棒尘道能吸收它)、棒尘道 nBarD 回 6% 且单颗缩小。
 * C2.12a2b(10-30 17:1x 调参):旋臂改团块+碎段、星团离开臂脊散开、暗尘纯吸收(不再发亮)、核球/棒/弥散光降亮露出中央棒与尘道、核区光晕减弱。
 * C2.12a2(10-30 15:40 王磊:要像设计 PDF 第 1 页、真 3D):平面光底与尘埃切片全部换成 3D 粒子 —— 弥散星光大粒子、丝状暗尘吸收粒子(含中央棒尘道)、电离氢粉团与蓝色年轻星团、旋臂碎段。
 * C2.12a 银河震撼版(王磊 10-30 13:53 批准《银河与宇宙世界层总体设计 v1.0》,PC 优先,手机适配延后):
 * - 粒子分档:高 80 万 / 中 30 万 / 低(手机)3.2 万;?gxn= 可覆盖。太阳周围加局部星场 + 猎户座大星云光团,近看不再空。
 * - 尘埃切片:12 层(中档 8 层)盘面切片叠出旋臂内侧暗尘带,侧视即见中央暗带;核区双层辉光 + 光晕。
 * - 默认视角拉近(视场 60°、距约 4.2 万光年),银盘溢出画面;「整盘」预设看全貌。
 * - 首次进入播放 12 秒开场镜头(太阳系 → 本地泡 → 猎户臂 → 升出银盘),之后默认跳过,可「重播开场」;减少动态时直接给终帧。
 * - 差速自转演示:恒星内快外慢(平坦自转曲线约 230 km/s),时间加速最多 2.3 亿年(太阳绕一圈)。
 */
(function () {
  'use strict';
  var R0 = 26996, RG = 60000, D2R = Math.PI / 180;
  var MAT = [[-0.0548755604, -0.8734370902, -0.4838350155], [0.4941094279, -0.4448296300, 0.7469822445], [-0.8676661490, -0.1980763734, 0.4559837762]];
  function hms(h, m, s) { return (h + m / 60 + s / 3600) * 15; }
  function dms(d, m, s) { var g = d < 0 || (d === 0 && 1 / d < 0) ? -1 : 1; return g * (Math.abs(d) + m / 60 + s / 3600); }
  // 赤经赤纬(度)+ 距离(光年)→ 场景坐标(x 轴:银心 → 太阳;y:银河北极;z:银经 90° 方向 = 银河自转方向)
  function pos(ra, de, ly) {
    ra *= D2R; de *= D2R; var e = [Math.cos(de) * Math.cos(ra), Math.cos(de) * Math.sin(ra), Math.sin(de)];
    var g = MAT.map(function (r) { return r[0] * e[0] + r[1] * e[1] + r[2] * e[2]; });
    return [R0 - g[0] * ly, g[2] * ly, g[1] * ly];
  }
  var CAT = {
    sun: { zh: '太阳系', c: '#f0c97a' }, bh: { zh: '黑洞', c: '#ff7ab0' }, neb: { zh: '星云', c: '#ff9fd0' }, psr: { zh: '中子星 · 脉冲星', c: '#9fdcff' },
    cl: { zh: '星团', c: '#ffe2a0' }, gal: { zh: '卫星星系', c: '#c9b4ff' }
  };
  // [key(SHXDV 键), 中文, 类别, ra, dec, 距离光年, 一句话, 优先级(小=先显示标签)]
  var OBJ = [
    ['Sgr A*', '银心 · 人马座 A*', 'bh', hms(17, 45, 40.04), dms(-29, 0, 28.1), 26996, '银河系中心的超大质量黑洞,约 430 万个太阳质量;银河的所有恒星都绕着这里转。', 1],
    ['NGC 3372', '船底座星云', 'neb', 161.2855, -59.8667, 7500, '银河系里最亮、最大的恒星形成区之一,住着极不稳定的巨星海山二。', 3],
    ['M16', '鹰状星云 · 创生之柱', 'neb', 274.7007, -13.8072, 7000, '「创生之柱」所在,气体柱里正在诞生新恒星。', 3],
    ['M42', '猎户座大星云', 'neb', 83.8187, -5.3897, 1344, '离太阳最近的大质量恒星诞生地,肉眼可见。', 4],
    ['M1', '蟹状星云', 'neb', 83.6332, 22.0145, 6500, '1054 年中国史书记载的超新星留下的遗迹,中心是一颗脉冲星。', 4],
    ['M8', '礁湖星云', 'neb', 270.922, -24.3802, 4000, '人马座方向的发射星云,夏夜肉眼可见一团光雾。', 5],
    ['M20', '三叶星云', 'neb', 270.6755, -22.9719, 5000, '红色发射、蓝色反射、黑色暗尘三种星云挤在一起。', 6],
    ['M57', '环状星云', 'neb', 283.3959, 33.0286, 2500, '类太阳恒星临终抛出的气体壳 —— 太阳约 50 亿年后的样子。', 5],
    ['Cyg X-1', '天鹅座 X-1', 'bh', hms(19, 58, 21.68), dms(35, 12, 5.8), 7240, '第一个被确认的恒星级黑洞,约 21 个太阳质量,正在吞噬伴星。', 3],
    ['Gaia BH1', '盖亚 BH1', 'bh', hms(17, 28, 41.10), dms(-0, 34, 51.5), 1560, '目前已知离地球最近的黑洞,安静地带着一颗类太阳伴星。', 6],
    ['Vela PSR', '船帆座脉冲星', 'psr', hms(8, 35, 20.66), dms(-45, 10, 35.2), 959, '每秒转 11 圈,约 1.1 万年前的超新星留下的中子星。', 6],
    ['Geminga', '杰敏卡', 'psr', hms(6, 33, 54.15), dms(17, 46, 12.9), 815, '几乎不发射电波的伽马射线脉冲星。', 7],
    ['RX J1856', 'RX J1856.5−3754', 'psr', hms(18, 56, 35.41), dms(-37, 54, 35.8), 400, '离地球最近的孤立中子星之一,「七姐妹」之一。', 8],
    ['SGR 1806', '磁星 SGR 1806−20', 'psr', hms(18, 8, 39.32), dms(-20, 24, 39.5), 28400, '已知磁场最强的天体之一;2004 年的一次爆发在 5 万光年外仍扰动了地球电离层。', 4],
    ['M45', '昴星团', 'cl', 56.8692, 24.1053, 444, '约 1 亿岁的年轻疏散星团,中国古称「昴宿」。', 7],
    ['NGC 5139', '半人马座 ω', 'cl', 201.6912, -47.4769, 17090, '银河系最大的球状星团,约 1000 万颗恒星,可能是被吞并矮星系的核心。', 4],
    ['NGC 104', '杜鹃座 47', 'cl', 6.0223, -72.0814, 14700, '南天第二亮的球状星团,年龄约 120 亿年。', 5],
    ['M13', '武仙座球状星团', 'cl', 250.4235, 36.4613, 22200, '北天最亮的球状星团;1974 年阿雷西博信息就是发往这里。', 5],
    ['Cas A', '仙后座 A', 'neb', 350.85, 58.815, 11000, '最年轻的已知银河超新星遗迹之一,爆发的光约 340 年前到达地球。', 6],
    ['Wd 1', '韦斯特隆德 1', 'cl', 251.7667, -45.8514, 13000, '银河系里质量最大的年轻星团之一,挤满红超巨星和沃尔夫-拉叶星。', 6],
    ['h Per', '英仙座双星团', 'cl', 34.75, 57.15, 7500, '肉眼可见的一对年轻疏散星团,约 1,300 万岁。', 7],
    ['NGC 7000', '北美洲星云', 'neb', 314.82, 44.53, 2590, '形状像北美洲的发射星云,天鹅座方向。', 7],
    ['LMC', '大麦哲伦云', 'gal', 80.8938, -69.7561, 161700, '银河系最大的卫星星系,约 16 万光年外。', 2],
    ['NGC 292', '小麦哲伦云', 'gal', 13.1866, -72.8286, 203500, '被大麦哲伦云和银河系一起撕扯的矮星系。', 2]
  ];
  var ARMS = [   // 与 cosmos.js 同参:局部角 th = K·ln(r/60000) + o + nπ,K = 3.6
    { zh: '英仙臂', o: -0.6, n: 1, w: 1 }, { zh: '盾牌-半人马臂', o: -0.6, n: 2, w: 1 },
    { zh: '人马-船底臂', o: 0.9708, n: 1, w: .6 }, { zh: '矩尺-外臂', o: 0.9708, n: 0, w: .6 }
  ];
  var K = 3.6;
  function armR(a, phi) { return RG * Math.exp((-phi - a.o - a.n * Math.PI) / K); }   // phi = 场景 atan2(z, x)

  var GLOW = null, HALO = null, DSL = [], INTRO = null, TF = 0, TFon = false, T = null, ov = null, cv = null, lay = null, card = null, rd = null, scn = null, cam = null, raf = 0, open_ = false, built = null, mats = [], idle = 0, last = 0, t0 = 0, mode = '3d', hidden = {};
  var C = { tx: 3000, ty: 0, tz: 0, d: 42000, yaw: -0.35, pit: 0.5 }, TW = null;
  function rm() { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } }
  function small() { return Math.min(screen.width, screen.height) < 700 || innerWidth <= 760; }
  function low() { return small() || (navigator.hardwareConcurrency || 8) <= 4; }
  function tierN() {
    var q = /[?&]gxn=(\d+)/.exec(location.search); if (q) return Math.max(20000, Math.min(1500000, +q[1]));
    if (small()) return 32000; if (low()) return 300000; return (navigator.hardwareConcurrency || 8) >= 8 ? 800000 : 300000;
  }
  function nf(x) { return Math.round(x).toLocaleString('zh-CN'); }
  function fly(ly) { return ly >= 1e4 ? (ly / 1e4).toFixed(ly >= 1e5 ? 1 : 2).replace(/\.?0+$/, '') + ' 万光年' : nf(ly) + ' 光年'; }
  function rnd(s) { return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
  function gauss(R) { var u = R() || 1e-9, v = R(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }

  /* ---------- 粒子 ---------- */
  function gen() {
    var N = tierN(), R = rnd(20261030), P = new Float32Array(N * 3), Cc = new Float32Array(N * 3), S = new Float32Array(N), i = 0;
    var bar = [Math.cos(27 * D2R), Math.sin(27 * D2R)];
    var SF = Math.max(.45, Math.pow(90000 / N, .35));   // C2.12a 粒子越多单颗越小,颗粒感代替糊成白带
    function put(x, y, z, r, g, b, s) { if (i >= N) return; P[i * 3] = x; P[i * 3 + 1] = y; P[i * 3 + 2] = z; Cc[i * 3] = r; Cc[i * 3 + 1] = g; Cc[i * 3 + 2] = b; S[i] = s * SF; i++; }
    var nLoc = Math.min(40000, N * .05), nB = N * .08, nBar = N * .13, nD = N * .36, nA = N * .33, nL = N * .03 - 0, k;
    for (k = 0; k < nB; k++) { var rr = Math.abs(gauss(R)) * 1900, th = R() * 6.283, ph = Math.acos(2 * R() - 1); put(rr * Math.sin(ph) * Math.cos(th), rr * Math.cos(ph) * .62, rr * Math.sin(ph) * Math.sin(th), .19, .13 + R() * .02, .065 + R() * .02, 240 + R() * 180); }
    for (k = 0; k < nBar; k++) { var u = gauss(R) * 5200, v = gauss(R) * (900 - Math.min(500, Math.abs(u) * .04)); if (Math.abs(u) > 9500) u *= .5; put(u * bar[0] - v * bar[1], gauss(R) * 380, u * bar[1] + v * bar[0], .24, .17 + R() * .02, .09 + R() * .025, 220 + R() * 150); }
    for (k = 0; k < nD; k++) { var r = -Math.log(1 - R() * .985) * 10500 + 2500, a = R() * 6.283, c = R(); if (r > RG) r = RG * R(); var dm = .22 + .78 * Math.min(1, Math.pow(r / 14000, 1.3)); put(r * Math.cos(a), gauss(R) * (300 + r * .006), r * Math.sin(a), (c < .5 ? .85 : .7) * dm, (c < .5 ? .8 : .78) * dm, (c < .5 ? .78 : .95) * dm, 200 + R() * 150); }
    // C2.12a2b 旋臂 = 团块 + 碎段(对照 gx_c1:不是平滑彩带)。每条臂预生成团块中心,70% 恒星落在团块里,30% 为臂间薄雾
    var CL = ARMS.map(function (A, ai) { var a = [], nc = ai < 2 ? 260 : 150; for (var c = 0; c < nc; c++) { var ph, r; do { ph = -R() * 5.2 + 1.0; r = armR(A, ph); } while (r < 8500 || r > 56000); var w = 350 + R() * 1400; a.push([r * Math.cos(ph + gauss(R) * (900 + r * .03) / r), r * Math.sin(ph + gauss(R) * (900 + r * .03) / r), w, R() < .5 ? 1 : .55 + R() * .45]); } return a; });
    for (k = 0; k < nA; k++) {
      var ai2 = R() < .62 ? (R() < .5 ? 0 : 1) : (R() < .5 ? 2 : 3), A = ARMS[ai2], x, z, hii = R() < .05, blue = R();
      if (R() < .7) { var cc = CL[ai2][R() * CL[ai2].length | 0], wv = cc[2] * (R() < .3 ? 2.2 : 1); x = cc[0] + gauss(R) * wv; z = cc[1] + gauss(R) * wv * .8; if (R() > cc[3]) { k--; continue; } }
      else { var phi, rr2; do { phi = -R() * 5.2 + 1.0; rr2 = armR(A, phi); } while (rr2 < 9000 || rr2 > 56000); var ang = phi + gauss(R) * (1600 + rr2 * .05) / rr2; x = rr2 * Math.cos(ang); z = rr2 * Math.sin(ang); }
      if (hii) put(x, gauss(R) * 150, z, 1, .42 + R() * .15, .62, 600 + R() * 600);
      else put(x, gauss(R) * 220, z, .62 + blue * .25, .74 + blue * .14, 1, 200 + R() * 160);
    }
    for (k = 0; k < nL; k++) {   // 猎户臂(本地臂):穿过太阳的一小段,俯仰约 12°
      var t = (R() - .5) * 0.75, rl = R0 * Math.exp(-t * Math.tan(12 * D2R)) + gauss(R) * 700, al = t + gauss(R) * .012;
      put(rl * Math.cos(al), gauss(R) * 200, rl * Math.sin(al), .75, .82, 1, 200 + R() * 150);
    }
    for (k = 0; k < nLoc; k++) {   // 太阳周围局部星场(本地泡 + 古尔德带一带),近看时不空
      var rl2 = Math.abs(gauss(R)) * 1300 + R() * 300, al2 = R() * 6.283, tc = R();
      put(R0 + rl2 * Math.cos(al2), gauss(R) * 260, rl2 * Math.sin(al2), tc < .15 ? 1 : tc < .6 ? 1 : .72, tc < .15 ? .7 : tc < .6 ? .93 : .82, tc < .15 ? .5 : tc < .6 ? .82 : 1, 18 + R() * 40);
    }
    var o42 = pos(83.8187, -5.3897, 1344);   // 猎户座大星云光团
    for (k = 0; k < 600; k++) put(o42[0] + gauss(R) * 45, o42[1] + gauss(R) * 30, o42[2] + gauss(R) * 45, 1, .45 + R() * .2, .7, 60 + R() * 120);
    // 尘埃(暗,普通混合):沿主臂内侧
    // C2.12a2 电离氢团块(粉)+ 年轻星团(蓝):3D 小团,贴旋臂外缘
    var nK = Math.min(700, N / 900) | 0;
    for (k = 0; k < nK && i < N - 60; k++) {
      var Ak = ARMS[R() < .65 ? (R() < .5 ? 0 : 1) : (R() < .5 ? 2 : 3)], pk, rk; do { pk = -R() * 5.2 + 1.0; rk = armR(Ak, pk); } while (rk < 7000 || rk > 52000);
      pk += gauss(R) * (1500 + rk * .045) / rk; rk *= 1 + gauss(R) * .03; var cx = rk * Math.cos(pk), cz = rk * Math.sin(pk), cy = gauss(R) * 90, pink = R() < .55, m = pink ? 14 + R() * 18 | 0 : 16 + R() * 22 | 0, w = pink ? 110 : 220;
      for (var j = 0; j < m; j++) { if (pink) put(cx + gauss(R) * w, cy + gauss(R) * w * .6, cz + gauss(R) * w, 1, .3 + R() * .15, .55 + R() * .12, 260 + R() * 420); else put(cx + gauss(R) * w, cy + gauss(R) * w * .5, cz + gauss(R) * w, .62, .76, 1, 160 + R() * 220); }
    }
    // C2.12a2 暗尘:全部是 3D 吸收粒子 —— 旋臂内缘丝状尘带 + 支刺 + 中央棒前缘两条尘道
    var ND = small() ? 9000 : N > 400000 ? 150000 : 80000, DP = new Float32Array(ND * 3), DS = new Float32Array(ND), d = 0;
    function dput(x, y, z, sz) { if (d >= ND) return; DP[d * 3] = x; DP[d * 3 + 1] = y; DP[d * 3 + 2] = z; DS[d] = sz; d++; }
    var nBarD = ND * .06;   // C2.12a4 棒尘道回 6%,单颗缩小 → 细而深
    for (k = 0; k < nBarD; k++) { var ub = (R() * 2 - 1) * 9000, sd = k % 2 ? 1 : -1; if (R() > .35 + .65 * Math.pow(.5 + .5 * Math.sin(ub * .0011 * (sd > 0 ? 1.3 : 1) + sd * 2.1), 2)) { k--; continue; } var vb = sd * (900 + Math.abs(ub) * .05) + gauss(R) * 320 * (.6 + Math.abs(ub) / 9000), ux = ub + sd * Math.abs(ub) * .0; var curl = Math.max(0, Math.abs(ub) - 6500) / 2500; vb += curl * curl * 1200 * Math.sign(ub);
      dput(ux * bar[0] - vb * bar[1], gauss(R) * 60, ux * bar[1] + vb * bar[0], 200 + R() * 280); }
    while (d < ND) {   // C2.12a3 丝状暗尘:55% 沿旋臂内缘的长尘带,30% 横跨旋臂的支刺,15% 内盘(棒周围)乱向细丝
      var ty = R(), x0, z0, ang0, L, cnt, bend = gauss(R) * .5, y0 = gauss(R) * 60;
      if (ty < .9) {
        var Ad = ARMS[R() < .6 ? (R() < .5 ? 0 : 1) : (R() < .5 ? 2 : 3)], pd, rd2; do { pd = -R() * 5.6 + 1.0; rd2 = armR(Ad, pd); } while (rd2 < 6000 || rd2 > 52000);
        if (ty < .55) { rd2 *= .95 + gauss(R) * .025; ang0 = pd + Math.PI / 2 + gauss(R) * .18; L = 3000 + R() * 7000; cnt = 30 + R() * 40 | 0; }
        else { rd2 *= .97 + gauss(R) * .05; ang0 = pd + Math.PI / 2 + (R() < .5 ? 1 : -1) * (0.5 + R() * .7); L = 1500 + R() * 3500; cnt = 16 + R() * 20 | 0; }
        var pa = pd + gauss(R) * 600 / rd2; x0 = rd2 * Math.cos(pa); z0 = rd2 * Math.sin(pa);
      } else { var ri = 4500 + R() * 6000, ai = R() * 6.283; x0 = ri * Math.cos(ai); z0 = ri * Math.sin(ai); ang0 = ai + Math.PI / 2 + gauss(R) * .6; L = 1000 + R() * 3000; cnt = 14 + R() * 18 | 0; }
      for (var q = 0; q < cnt; q++) { var t = q / cnt - .5, aa = ang0 + bend * t; dput(x0 + Math.cos(aa) * L * t + gauss(R) * 60, y0 + gauss(R) * 40, z0 + Math.sin(aa) * L * t + gauss(R) * 60, 200 + R() * 420 * (1 - Math.abs(t))); }
    }
    // C2.12a3 弥散星光:中号柔光 3D 粒子,按核球/棒 + 旋臂 + 盘三种密度分布,把臂间填成连续的盘光(对照概念图:盘不是黑底上的点)
    var NG = small() ? 8000 : N > 400000 ? 90000 : 60000, GP = new Float32Array(NG * 3), GC = new Float32Array(NG * 3), GS = new Float32Array(NG);
    for (k = 0; k < NG; k++) {
      var gx, gy, gz, cr, cg, cb, gsz, u0 = R();
      if (u0 < .22) { var rb = Math.abs(gauss(R)) * 2600, tb = R() * 6.283, pb = Math.acos(2 * R() - 1), ub2 = R() < .55 ? gauss(R) * 4800 : 0; if (Math.abs(ub2) > 9500) ub2 *= .5; gx = rb * Math.sin(pb) * Math.cos(tb) + ub2 * bar[0]; gy = rb * Math.cos(pb) * .5; gz = rb * Math.sin(pb) * Math.sin(tb) + ub2 * bar[1]; var fb = (.42 + .58 * Math.min(1, rb / 4000)) * (ub2 ? .75 : 1); cr = .3 * fb; cg = .215 * fb; cb = .115 * fb; gsz = 1300 + R() * 1600; }
      else if (u0 < .56) { var Ag = ARMS[R() < .62 ? (R() < .5 ? 0 : 1) : (R() < .5 ? 2 : 3)], pg, rgA; do { pg = -R() * 5.4 + 1.0; rgA = armR(Ag, pg); } while (rgA < 7000 || rgA > 58000); var ang = pg + gauss(R) * (2600 + rgA * .08) / rgA; gx = rgA * Math.cos(ang); gz = rgA * Math.sin(ang); gy = gauss(R) * 260; var w2 = Math.min(1, rgA / 30000), mA = .45 + .55 * Math.min(1, rgA / 16000); cr = (.9 - .2 * w2) * mA; cg = (.88 - .06 * w2) * mA; cb = (.86 + .14 * w2) * mA; gsz = 900 + R() * 1300; }
      else { var rg = -Math.log(1 - R() * .97) * 12500 + 2500, ag = R() * 6.283; gx = rg * Math.cos(ag); gz = rg * Math.sin(ag); gy = gauss(R) * (250 + rg * .004); var wr = Math.max(0, 1 - rg / 28000), mD = .3 + .7 * Math.min(1, Math.pow(rg / 15000, 1.2)); cr = (.78 + .22 * wr) * mD; cg = (.72 + .04 * wr) * mD; cb = (.86 - .42 * wr) * mD; gsz = 1500 + R() * 2200; }
      GP[k * 3] = gx; GP[k * 3 + 1] = gy; GP[k * 3 + 2] = gz; GC[k * 3] = cr; GC[k * 3 + 1] = cg; GC[k * 3 + 2] = cb; GS[k] = gsz;
    }
    return { P: P, C: Cc, S: S, n: i, DP: DP, DS: DS, dn: d, GP: GP, GC: GC, GS: GS };
  }
  var VSP = 'attribute float aS;attribute vec3 aC;varying vec3 vC;varying float vA;uniform float uK,uB,uM,uT;void main(){vec3 p=position;if(uT>0.0){float r=length(p.xz);float a=uT*767.0/max(r,1500.0);float c=cos(a),s=sin(a);p.xz=vec2(p.x*c-p.z*s,p.x*s+p.z*c);}vec4 mv=modelViewMatrix*vec4(p,1.0);float s=aS*uK/max(-mv.z,1.0);vA=clamp(s,0.15,1.0)*uB*clamp(uM/max(s,1.0)*1.6,.35,1.0);gl_PointSize=clamp(s,1.0,uM);vC=aC;gl_Position=projectionMatrix*mv;}';
  var FSP = 'precision mediump float;varying vec3 vC;varying float vA;void main(){vec2 d=gl_PointCoord-.5;float r=dot(d,d)*4.0;if(r>1.0)discard;float a=exp(-r*3.0)*vA;gl_FragColor=vec4(vC*a,1.0);}';
  var FSDU = 'precision mediump float;varying float vA;void main(){vec2 d=gl_PointCoord-.5;float r=dot(d,d)*4.0;if(r>1.0)discard;float a=clamp((1.0-r)*(1.0-r)*.55*vA,0.0,1.0);gl_FragColor=vec4(mix(vec3(1.0),vec3(.5,.36,.27),a),1.0);}';   // C2.12a3 乘法吸收:暗且偏棕,像真实尘带
  var VSG = 'varying vec2 vU;void main(){vU=uv*2.0-1.0;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}';
  var FSG = [   // 弥散光底(与回望银河同一张盘面公式,只取柔光)
    'precision mediump float;varying vec2 vU;uniform float uA;const float K=3.6;',
    'float arm(float th,float lr,float o,float w){return pow(max(cos(2.0*(th-K*lr-o)),0.0),w);}',
    'void main(){vec2 p=vU;float r=length(p);if(r>1.0)discard;float th=atan(p.y,p.x),lr=log(max(r,.02));',
    ' float ca=-0.471;vec2 q=vec2(p.x*cos(ca)+p.y*sin(ca),-p.x*sin(ca)+p.y*cos(ca));',
    ' float bar=exp(-(q.x*q.x/0.0225+q.y*q.y/0.0028));float bul=exp(-r*r/0.0042);float disk=exp(-r/0.2)*smoothstep(1.0,.7,r);',
    ' float rin=smoothstep(.1,.2,r),rout=smoothstep(1.0,.55,r);float a=(arm(th,lr,-0.6,2.0)+.55*arm(th,lr,0.9708,3.0))*rin*rout;',
    ' vec3 c=vec3(1.0,.84,.6)*(bar*.7+bul*1.1)+vec3(.75,.74,.85)*disk*.32+vec3(.5,.62,1.0)*a*.22*smoothstep(.08,.5,r);',
    ' gl_FragColor=vec4(c*uA,1.0);}'].join('\n');
  var FSDS = [   // C2.12a 尘埃切片:旋臂内侧暗带 + 噪声团块;叠 8–12 层出体积感
    'precision mediump float;varying vec2 vU;uniform float uA,uY;const float K=3.6;',
    'float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
    'float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}',
    'float fb(vec2 p){return n(p)*.5+n(p*2.1)*.27+n(p*4.3)*.15+n(p*8.7)*.08;}',
    'float arm(float th,float lr,float o,float w){return pow(max(cos(2.0*(th-K*lr-o)),0.0),w);}',
    'void main(){vec2 p=vU;float r=length(p);if(r>.95)discard;float th=atan(p.y,p.x),lr=log(max(r,.02));',
    ' float a=arm(th,lr,-0.6-0.32,6.0)+.6*arm(th,lr,0.9708-0.32,7.0);',
    ' float nz=fb(p*14.0+uY*3.1);float d=a*smoothstep(.14,.26,r)*smoothstep(.92,.6,r)*smoothstep(.25,.75,nz)*1.6;',
    ' d+=smoothstep(.2,.12,r)*smoothstep(.04,.1,r)*.35*smoothstep(.4,.8,nz);',
    ' gl_FragColor=vec4(.035,.022,.015,clamp(d,0.0,1.0)*uA);}'].join('\n');

  function build3d() {
    T = window.THREE; if (!T || !T.WebGLRenderer) return false;
    try { rd = new T.WebGLRenderer({ canvas: cv, antialias: false, alpha: false, powerPreference: 'high-performance' }); } catch (e) { rd = null; return false; }
    if (!rd || !rd.getContext || !rd.getContext()) return false;
    rd.setPixelRatio(Math.min(devicePixelRatio || 1, small() ? 1.25 : 1.5)); rd.setClearColor(0x010208, 1);
    scn = new T.Scene(); cam = new T.PerspectiveCamera(60, 1, 20, 3e6);
    if (!built) built = gen();
    var g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(built.P, 3)); g.setAttribute('aC', new T.BufferAttribute(built.C, 3)); g.setAttribute('aS', new T.BufferAttribute(built.S, 1)); g.setDrawRange(0, built.n);
    var ms = new T.ShaderMaterial({ vertexShader: VSP, fragmentShader: FSP, transparent: true, depthWrite: false, depthTest: false, blending: T.AdditiveBlending, uniforms: { uK: { value: 800 }, uB: { value: (small() ? .62 : .42) * Math.max(.3, Math.sqrt(90000 / built.n)) * .8 }, uM: { value: 28 }, uT: { value: 0 } } });
    var pts = new T.Points(g, ms); pts.frustumCulled = false; pts.renderOrder = 1; scn.add(pts); mats.push(ms);
    var gd = new T.BufferGeometry(); gd.setAttribute('position', new T.BufferAttribute(built.DP, 3)); gd.setAttribute('aS', new T.BufferAttribute(built.DS, 1)); gd.setAttribute('aC', new T.BufferAttribute(new Float32Array(built.DS.length * 3), 3)); gd.setDrawRange(0, built.dn);
    var md = new T.ShaderMaterial({ vertexShader: VSP, fragmentShader: FSDU, transparent: true, depthWrite: false, depthTest: false, blending: T.CustomBlending, blendEquation: T.AddEquation, blendSrc: T.ZeroFactor, blendDst: T.SrcColorFactor, uniforms: { uK: { value: 800 }, uB: { value: 1 }, uM: { value: 28 }, uT: { value: 0 } } });
    var dp = new T.Points(gd, md); dp.frustumCulled = false; dp.renderOrder = 2; scn.add(dp); mats.push(md);
    var gg = new T.BufferGeometry(); gg.setAttribute('position', new T.BufferAttribute(built.GP, 3)); gg.setAttribute('aC', new T.BufferAttribute(built.GC, 3)); gg.setAttribute('aS', new T.BufferAttribute(built.GS, 1));
    var mg = new T.ShaderMaterial({ vertexShader: VSP, fragmentShader: FSP, transparent: true, depthWrite: false, depthTest: false, blending: T.AdditiveBlending, uniforms: { uK: { value: 800 }, uB: { value: .05 }, uM: { value: 900 }, uT: { value: 0 } } });
    var gpn = new T.Points(gg, mg); gpn.frustumCulled = false; gpn.renderOrder = 0; scn.add(gpn); mats.push(mg);
    var FG = 'precision mediump float;varying vec2 vU;uniform float uA;void main(){float r=length(vU);if(r>1.0)discard;float g=exp(-r*r*10.0)*.85+exp(-r*4.5)*.22;gl_FragColor=vec4(vec3(1.0,.86,.64)*g*uA,1.0);}';
    var mb = new T.ShaderMaterial({ vertexShader: VSG, fragmentShader: FG, transparent: true, depthWrite: false, depthTest: false, blending: T.AdditiveBlending, uniforms: { uA: { value: .55 } } });
    GLOW = new T.Mesh(new T.PlaneGeometry(22000, 22000), mb); GLOW.frustumCulled = false; GLOW.renderOrder = 1.5; scn.add(GLOW); mats.push(mb);
    // C2.12a 尘埃切片(mats[4]...)+ 核区大光晕(HALO)
    var NS = 0; DSL = [];   // C2.12a2 平面尘埃切片停用(渲染标准:主体一律 3D 粒子)
    for (var si = 0; si < NS; si++) {
      var yy = (si / Math.max(1, NS - 1) - .5) * 700, wv = Math.exp(-Math.pow(yy / 260, 2));
      var msl = new T.ShaderMaterial({ vertexShader: VSG, fragmentShader: FSDS, transparent: true, depthWrite: false, depthTest: false, side: T.DoubleSide, blending: T.NormalBlending, uniforms: { uA: { value: 0 }, uY: { value: si * 1.7 } } });
      var sl = new T.Mesh(new T.PlaneGeometry(2 * RG, 2 * RG), msl); sl.rotation.x = -Math.PI / 2; sl.position.y = yy; sl.renderOrder = 2; sl.frustumCulled = false; scn.add(sl); DSL.push({ m: msl, w: wv * 2.6 / Math.max(1, NS) * 4 });
    }
    var FH = 'precision mediump float;varying vec2 vU;uniform float uA;void main(){float r=length(vU);if(r>1.0)discard;float g=(exp(-r*r*3.2)*.5+exp(-r*2.4)*.18)*smoothstep(1.0,.55,r);gl_FragColor=vec4(vec3(1.0,.8,.58)*g*uA,1.0);}';
    var mh = new T.ShaderMaterial({ vertexShader: VSG, fragmentShader: FH, transparent: true, depthWrite: false, depthTest: false, blending: T.AdditiveBlending, uniforms: { uA: { value: .5 } } });
    HALO = new T.Mesh(new T.PlaneGeometry(60000, 60000), mh); HALO.frustumCulled = false; HALO.renderOrder = 1.5; scn.add(HALO);
    // 大小麦哲伦云:两团模糊光斑
    [['LMC', 30000, 1], ['NGC 292', 18000, .7]].forEach(function (q) {
      var o = OBJ.filter(function (x) { return x[0] === q[0]; })[0], p = pos(o[3], o[4], o[5]);
      var gm = new T.BufferGeometry(), n = 1400, R = rnd(q[0].length * 977), a = new Float32Array(n * 3), cc = new Float32Array(n * 3), ss = new Float32Array(n);
      for (var j = 0; j < n; j++) { a[j * 3] = p[0] + gauss(R) * q[1] * .35; a[j * 3 + 1] = p[1] + gauss(R) * q[1] * .2; a[j * 3 + 2] = p[2] + gauss(R) * q[1] * .3; cc[j * 3] = .8; cc[j * 3 + 1] = .82; cc[j * 3 + 2] = 1; ss[j] = 900 * q[2]; }
      gm.setAttribute('position', new T.BufferAttribute(a, 3)); gm.setAttribute('aC', new T.BufferAttribute(cc, 3)); gm.setAttribute('aS', new T.BufferAttribute(ss, 1));
      var pp = new T.Points(gm, ms.clone()); pp.frustumCulled = false; scn.add(pp);
    });
    // C2.12b TSG 扇区网格 + 世界边界(线框叠加层,非天体渲染)
    if (TS) {
      var gp = [], k, j;
      for (k = 1; k <= 12; k++) for (j = 0; j < 120; j++) { var a1 = j * 3 * D2R, a2 = (j + 1) * 3 * D2R, rr = k * 5000; gp.push(rr * Math.cos(a1), 0, rr * Math.sin(a1), rr * Math.cos(a2), 0, rr * Math.sin(a2)); }
      for (k = 0; k < 12; k++) { var fa = k * 30 * D2R; gp.push(0, 0, 0, 60000 * Math.cos(fa), 0, 60000 * Math.sin(fa)); }
      var gg2 = new T.BufferGeometry(); gg2.setAttribute('position', new T.BufferAttribute(new Float32Array(gp), 3));
      GRID = new T.LineSegments(gg2, new T.LineBasicMaterial({ color: 0x7fd6ff, transparent: true, opacity: .2, depthTest: false, depthWrite: false })); GRID.frustumCulled = false; GRID.renderOrder = 3; scn.add(GRID);
    }
    if (GW) {
      WLN = new T.Group(); WLN.renderOrder = 3;
      GW.list.forEach(function (w) {
        var lp = [], ys = w.reg.halo ? [1500, -1500] : [0];
        ys.forEach(function (yy) { GW.outline(w).forEach(function (L) { for (var i = 0; i < L.length - 1; i++) lp.push(L[i][0], yy, L[i][1], L[i + 1][0], yy, L[i + 1][1]); }); });
        var g3 = new T.BufferGeometry(); g3.setAttribute('position', new T.BufferAttribute(new Float32Array(lp), 3));
        var ln = new T.LineSegments(g3, new T.LineBasicMaterial({ color: w.id === 'VI-10' ? 0x9fb3cf : w.id === 'GATE' ? 0xc9b4ff : 0xf0c97a, transparent: true, opacity: .34, depthTest: false, depthWrite: false }));
        ln.frustumCulled = false; ln.renderOrder = 3; ln.userData.w = w.id; WLN.add(ln);
      });
      scn.add(WLN);
    }
    hk('build', T, scn);
    return true;
  }

  /* ---------- DOM ---------- */
  function css() {
    if (document.getElementById('xgx-css')) return; var s = document.createElement('style'); s.id = 'xgx-css';
    s.textContent =
      '#xgx{position:fixed;inset:0;z-index:96;background:#010208;color:#dfe9f7;font:13px/1.5 "Noto Sans SC",system-ui,"PingFang SC","Microsoft YaHei",sans-serif;opacity:0;transition:opacity .5s;touch-action:none;user-select:none;-webkit-user-select:none}#xgx.on{opacity:1}' +
      'body.xgx-on #shx-badge,body.xgx-on #xvt-tip{display:none!important}#xgx canvas.cv{position:absolute;inset:0;width:100%;height:100%;display:block;cursor:grab}#xgx canvas.cv:active{cursor:grabbing}' +
      '#xgx .hd{position:absolute;left:18px;top:14px;right:70px;pointer-events:none}#xgx .hd .k{font-size:11px;letter-spacing:.18em;color:#b8a8ff}#xgx .hd h2{margin:2px 0 2px;font-size:22px;font-weight:600;letter-spacing:.04em}#xgx .hd h2 small{font-size:12px;color:#9fb3cf;margin-left:8px;letter-spacing:.14em;font-weight:400}' +
      '#xgx .hd p{margin:0;font-size:12px;color:#a8b8d0;max-width:640px}#xgx .badge{display:inline-block;margin-top:6px;font-size:11px;color:#ff9fb2;border:1px solid rgba(255,159,178,.45);border-radius:10px;padding:1px 8px;background:rgba(20,8,16,.5)}' +
      '#xgx .x{position:absolute;right:14px;top:12px;width:40px;height:40px;border-radius:50%;border:1px solid rgba(150,180,220,.4);background:rgba(10,16,30,.7);color:#dfe9f7;font-size:20px;cursor:pointer}' +
      '#xgx .bar{position:absolute;left:50%;bottom:18px;transform:translateX(-50%);display:flex;gap:6px;flex-wrap:wrap;justify-content:center;max-width:calc(100vw - 20px)}' +
      '#xgx .bar button,#xgx .lg button{border:1px solid rgba(150,180,220,.35);background:rgba(10,16,30,.72);color:#dfe9f7;border-radius:16px;padding:6px 13px;font:inherit;font-size:12.5px;cursor:pointer;-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}' +
      '#xgx .bar button:hover{border-color:#b8a8ff}#xgx .bar button.on{border-color:#f0c97a;color:#f0c97a}' +
      '#xgx .lg{position:absolute;left:16px;bottom:70px;display:flex;flex-direction:column;gap:5px;align-items:flex-start}#xgx .lg button{padding:3px 10px;font-size:11.5px}#xgx .lg button i{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:6px}#xgx .lg button.off{opacity:.4}' +
      '#xgx .sc{position:absolute;right:18px;bottom:72px;font-size:11px;color:#a8b8d0;text-align:right;pointer-events:none}#xgx .sc b{display:block;height:2px;background:#a8b8d0;margin-top:3px;margin-left:auto}' +
      '#xgx .lay{position:absolute;inset:0;pointer-events:none;overflow:hidden}' +
      '#xgx .m{position:absolute;left:0;top:0;transform:translate(-50%,-50%);pointer-events:auto;cursor:pointer;display:flex;align-items:center;gap:5px;white-space:nowrap;padding:4px}#xgx .m i{width:9px;height:9px;border-radius:50%;flex:none;box-shadow:0 0 8px currentColor;background:currentColor}' +
      '#xgx .m span{font-size:11.5px;color:#e8eefa;text-shadow:0 0 4px #000,0 0 8px #000}#xgx .m span em{font-style:normal;color:#f0c97a;margin-left:4px;font-size:10px}#xgx .m.nl span{display:none}#xgx .m.nl:hover span{display:inline}' +
      '#xgx .m.sun i{width:12px;height:12px;background:none;border:2px solid #f0c97a;box-shadow:0 0 10px #f0c97a}#xgx .m.sun span{color:#ffe2a0;font-weight:600}' +
      '#xgx .arm{position:absolute;left:0;top:0;transform:translate(-50%,-50%);font-size:11px;letter-spacing:.2em;color:rgba(190,205,255,.55);white-space:nowrap;text-shadow:0 0 6px #000}' +
      '#xgx .cd{position:absolute;right:16px;top:70px;width:min(320px,calc(100vw - 32px));padding:14px 16px 12px;border-radius:12px;border:1px solid rgba(184,168,255,.45);background:rgba(8,12,26,.88);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);box-shadow:0 0 24px rgba(120,100,255,.18)}' +
      '#xgx .cd h3{margin:0 24px 2px 0;font-size:16px}#xgx .cd .ty{font-size:11.5px;color:#b8a8ff}#xgx .cd p{margin:8px 0;font-size:12.5px;color:#c8d4e8}#xgx .cd dl{margin:6px 0;display:grid;grid-template-columns:auto 1fr;gap:2px 10px;font-size:12px}#xgx .cd dt{color:#8fa3c0}#xgx .cd dd{margin:0}' +
      '#xgx .cd .c{position:absolute;right:8px;top:6px;border:0;background:none;color:#9fb4cc;font-size:18px;cursor:pointer}#xgx .cd .row{display:flex;gap:8px;margin-top:10px}#xgx .cd .row button{flex:1;border-radius:16px;padding:7px 10px;font:inherit;font-size:12.5px;cursor:pointer;border:1px solid rgba(150,180,220,.4);background:rgba(20,30,52,.6);color:#dfe9f7}#xgx .cd .row .go{border-color:#f0c97a;color:#f0c97a}' +
      '#xgx .cap{position:absolute;left:50%;bottom:16%;transform:translateX(-50%);max-width:min(720px,90vw);text-align:center;font-size:19px;letter-spacing:.06em;color:#eef3ff;text-shadow:0 0 10px #000,0 0 22px #000;opacity:0;transition:opacity .8s;pointer-events:none}#xgx .cap.on{opacity:1}#xgx .cap small{display:block;font-size:11px;letter-spacing:.3em;color:#b8a8ff;margin-bottom:4px}' +
      '#xgx .skip{position:absolute;right:18px;bottom:72px;display:none;border:1px solid rgba(150,180,220,.4);background:rgba(10,16,30,.7);color:#dfe9f7;border-radius:16px;padding:6px 14px;font:inherit;font-size:12.5px;cursor:pointer}#xgx.intro .skip{display:block}#xgx.intro .bar,#xgx.intro .lg,#xgx.intro .sc,#xgx.intro .lay,#xgx.intro .hd p,#xgx.intro .badge{opacity:0;pointer-events:none}#xgx .bar,#xgx .lg,#xgx .sc,#xgx .lay{transition:opacity .8s}' +
      '#xgx .tfc{position:absolute;left:50%;top:76px;transform:translateX(-50%);font-size:13px;color:#f0c97a;text-shadow:0 0 8px #000;display:none;text-align:center}#xgx.tf .tfc{display:block}#xgx.tf .lay{opacity:0}#xgx .tfc small{display:block;color:#a8b8d0;font-size:11px}' +
      '#xgx .tsg{position:absolute;left:18px;top:132px;font-size:11.5px;line-height:1.55;color:#a8b8d0;pointer-events:none;text-shadow:0 0 6px #000}#xgx .tsg b{color:#7fd6ff;font-weight:600;letter-spacing:.04em}#xgx .tsg em{font-style:normal;color:#f0c97a}' +
      '#xgx .lv{position:absolute;left:16px;top:212px;display:flex;flex-direction:column;gap:3px}#xgx .lv button{display:flex;gap:6px;align-items:center;border:1px solid rgba(150,180,220,.22);background:rgba(10,16,30,.55);color:#9fb3cf;border-radius:10px;padding:2px 9px;font:inherit;font-size:11px;cursor:pointer;text-align:left}#xgx .lv button b{color:#dfe9f7;width:18px}#xgx .lv button.on{border-color:#7fd6ff;color:#dfe9f7;background:rgba(20,40,70,.7)}#xgx .lv button.ext{opacity:.62}#xgx .lv .h{font-size:10.5px;color:#8fa3c0;max-width:200px;margin-top:2px;min-height:14px}' +
      '#xgx .wl{position:absolute;left:0;top:0;pointer-events:auto;cursor:pointer;white-space:nowrap;font-size:11px;letter-spacing:.06em;color:rgba(240,201,122,.82);text-shadow:0 0 5px #000,0 0 10px #000;padding:2px 4px}#xgx .wl small{display:block;font-size:9.5px;letter-spacing:.12em;color:rgba(160,190,230,.7)}#xgx .wl:hover,#xgx .wl.on{color:#ffe2a0}#xgx .wl.cp small,#xgx .wl.cp .n{display:none}#xgx .wl.cp:hover .n{display:inline}#xgx .wl::before{content:"\\25C7";margin-right:4px;color:#f0c97a}' +
      '#xgx .gl{position:absolute;left:0;top:0;transform:translate(-50%,-50%);font-size:10px;letter-spacing:.08em;color:rgba(127,214,255,.6);text-shadow:0 0 4px #000;pointer-events:none}' +
      '#xgx .cd .tsgv{font-family:ui-monospace,Consolas,monospace;color:#7fd6ff;letter-spacing:.03em}#xgx .cd a.wk{color:#f0c97a;cursor:pointer;text-decoration:underline dotted}#xgx .cd .q{margin:8px 0;padding:6px 10px;border-left:2px solid #b8a8ff;background:rgba(40,30,80,.25);font-size:12.5px;color:#e8eefa}#xgx .cd .tg{display:inline-block;font-size:10.5px;color:#f0c97a;border:1px solid rgba(240,201,122,.4);border-radius:8px;padding:0 6px;margin:4px 4px 0 0}' +
      '#xgx .cd ul{margin:4px 0 6px;padding-left:18px;font-size:12px;color:#c8d4e8}#xgx .cd ul li a{color:#dfe9f7;cursor:pointer;text-decoration:underline dotted}#xgx .cd .nt{font-size:11px;color:#8fa3c0;margin-top:6px}#xgx .cd.wc{max-height:calc(100vh - 160px);overflow:auto}#xgx .cd .wlist button{display:block;width:100%;text-align:left;margin:3px 0;border:1px solid rgba(150,180,220,.25);background:rgba(20,30,52,.5);color:#dfe9f7;border-radius:10px;padding:5px 9px;font:inherit;font-size:12px;cursor:pointer}#xgx .cd .wlist button small{color:#8fa3c0;margin-left:6px}' +
      '#xgx.m2d .lv{display:none}#xgx.intro .tsg,#xgx.intro .lv,#xgx.tf .tsg,#xgx.tf .lv{opacity:0;pointer-events:none}' +
      '@media (max-width:760px){#xgx .tsg{top:136px;left:12px;font-size:10.5px;line-height:1.4}#xgx .lv{display:none}#xgx .lg{top:194px!important}#xgx .wl small{display:none}#xgx .hd{left:12px;top:10px;right:60px}#xgx .hd h2{font-size:18px}#xgx .hd p{font-size:11px}#xgx .lg{bottom:auto;top:132px;left:10px}#xgx .sc{bottom:118px}#xgx .bar{bottom:12px}#xgx .bar button{padding:5px 10px;font-size:12px}#xgx .cd{top:auto;bottom:64px;right:10px}}';
    document.head.appendChild(s);
  }
  var MK = [], ARML = [], SUNM = null, WLB = [], GLB = [], GRID = null, WLN = null, WSEL = null, LAYS = { grid: false, wb: true, jr: true }, LASTM = null, HUDS = '';
  var TS = window.SHXTSG, GW = window.SHXGW, KEYL = 'gn:sh:x-gxlay';
  var HK = { build: [], frame: [], labels: [], close: [], flat: [], card: [], step: [], skip3d: [] };   // C2.12c 扩展钩子(sh-x-gal-jump.js)
  function hk(n) { var a = [].slice.call(arguments, 1), r = false; HK[n].forEach(function (f) { try { if (f.apply(null, a)) r = true; } catch (e) { if (window.console) console.warn('xgx hook', n, e); } }); return r; }
  try { var _l = JSON.parse(localStorage.getItem(KEYL) || 'null'); if (_l) { LAYS.grid = !!_l.grid; LAYS.wb = _l.wb !== false; LAYS.jr = _l.jr !== false; } } catch (e) { }
  function dom() {
    css();
    ov = document.createElement('div'); ov.id = 'xgx'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-label', '银河全景');
    ov.innerHTML = '<canvas class="cv" aria-label="银河系模拟渲染,可拖动旋转、滚轮缩放"></canvas><div class="lay"></div>' +
      '<div class="hd"><div class="k">星域 VI · MILKY WAY</div><h2>银河全景<small>THE MILKY WAY</small></h2>' +
      '<p>直径约 10 万光年,约 1,000–4,000 亿颗恒星。太阳在猎户臂上,距银心约 2.7 万光年,绕银心一圈约 2.3 亿年。</p>' +
      '<span class="badge">模拟渲染 · 非照片 · 旋臂为示意模型(对数螺旋)· 天体位置按真实方向与距离</span></div>' +
      '<button class="x" type="button" aria-label="关闭银河全景(Esc)">×</button><div class="tsg" aria-live="off"></div><div class="lv" role="group" aria-label="六级尺度"></div><div class="lg"></div><div class="sc"><span></span><b></b></div>' +
      '<div class="bar"><button data-p="all" type="button">全景</button><button data-p="whole" type="button">整盘</button><button data-p="top" type="button">俯视</button><button data-p="side" type="button">侧视</button><button data-p="sun" type="button">太阳附近</button><button data-p="mc" type="button">卫星星系</button><button data-p="worlds" type="button" title="十大银河世界 + 麦哲伦门">十大世界</button><button data-p="tf" type="button" title="恒星内快外慢,看旋臂与恒星如何相对运动">差速自转</button><button data-p="intro" type="button">重播开场</button><button data-p="fly" type="button">回驾驶舱</button></div><div class="cap" aria-live="polite"></div><button class="skip" type="button">跳过 ›</button><div class="tfc"></div>';
    document.body.appendChild(ov);
    cv = ov.querySelector('.cv'); lay = ov.querySelector('.lay');
    ov.querySelector('.x').onclick = function () { close(); };
    ov.querySelector('.skip').onclick = function () { endIntro(true); };
    ov.querySelectorAll('.bar button').forEach(function (b) { b.onclick = function () { if (b.dataset.p === 'fly') { cockpit(); return; } if (b.dataset.p === 'tf') { tfToggle(); return; } if (b.dataset.p === 'intro') { intro(true); return; } if (b.dataset.p === 'worlds') { endIntro(); worldList(); return; } endIntro(); preset(b.dataset.p); }; });
    var lg = ov.querySelector('.lg');
    Object.keys(CAT).forEach(function (k) { if (k === 'sun') return; var b = document.createElement('button'); b.type = 'button'; b.innerHTML = '<i style="background:' + CAT[k].c + '"></i>' + CAT[k].zh; b.onclick = function () { hidden[k] = !hidden[k]; b.classList.toggle('off', !!hidden[k]); }; lg.appendChild(b); });
    // C2.12b 图层开关:扇区网格 / 世界边界
    [['grid', '▦ TSG 网格'], ['wb', '◇ 世界边界'], ['jr', '┅ 天枢航道']].forEach(function (q) { var b = document.createElement('button'); b.type = 'button'; b.dataset.l = q[0]; b.textContent = q[1]; b.classList.toggle('off', !LAYS[q[0]]); b.onclick = function () { LAYS[q[0]] = !LAYS[q[0]]; b.classList.toggle('off', !LAYS[q[0]]); try { localStorage.setItem(KEYL, JSON.stringify(LAYS)); } catch (e) { } if (mode === '2d') flat(); }; lg.appendChild(b); });
    // 六级尺度
    var lv = ov.querySelector('.lv'); if (TS) { TS.LV.forEach(function (L, i) { var b = document.createElement('button'); b.type = 'button'; b.dataset.i = i; b.title = L.sc; b.innerHTML = '<b>' + L.k + '</b>' + L.zh; if (i >= 3) b.classList.add('ext'); b.onclick = function () { lvGo(i); }; lv.appendChild(b); }); var hh = document.createElement('div'); hh.className = 'h'; lv.appendChild(hh); }
    // 世界标签 + 网格标签
    WLB = []; GLB = [];
    if (GW) GW.list.forEach(function (w) { var e = document.createElement('div'); e.className = 'wl'; e.innerHTML = w.id + '<span class="n"> ' + w.im + '</span><small>' + w.zh + '</small>'; e.title = w.name + ' · ' + w.a.addr; e.onclick = function (ev) { ev.stopPropagation(); showWorld(w); }; lay.appendChild(e); WLB.push({ el: e, w: w, p: TS.toScene(w.anc) }); });
    if (TS) { for (var ri = 1; ri <= 12; ri++) { var ge = document.createElement('div'); ge.className = 'gl'; ge.textContent = 'R' + ri; lay.appendChild(ge); var f = -4 * D2R, rr = (ri - .5) * 5000; GLB.push({ el: ge, p: [rr * Math.cos(f), 0, rr * Math.sin(f)] }); }
      for (var si = 0; si < 12; si++) { var ge2 = document.createElement('div'); ge2.className = 'gl'; ge2.textContent = 'S' + (si < 10 ? '0' : '') + si; lay.appendChild(ge2); var f2 = (si * 30 + 15) * D2R; GLB.push({ el: ge2, p: [63000 * Math.cos(f2), 0, 63000 * Math.sin(f2)] }); } }
    // 标记
    MK = [];
    var sun = { key: 'sun', zh: '太阳系 · 你在这里', cat: 'sun', p: [R0, 55, 0], pri: 0, ly: 0 };
    [sun].concat(OBJ.map(function (o) { return { key: o[0], zh: o[1], cat: o[2], p: pos(o[3], o[4], o[5]), ly: o[5], txt: o[6], pri: o[7] }; })).forEach(function (m) {
      var e = document.createElement('div'); e.className = 'm' + (m.cat === 'sun' ? ' sun' : ''); e.style.color = CAT[m.cat].c;
      var fl = m.cat !== 'sun' && window.SHXDV && SHXDV.has(m.key);
      e.innerHTML = '<i></i><span>' + m.zh + (fl ? '<em>✦</em>' : '') + '</span>'; e.title = m.zh;
      e.onclick = function (ev) { ev.stopPropagation(); show(m); };
      lay.appendChild(e); m.el = e; m.fl = fl; MK.push(m); if (m.cat === 'sun') SUNM = m;
    });
    MK.sort(function (a, b) { return a.pri - b.pri; });
    ARML = ARMS.map(function (a) { var phi = a.n === 2 ? 1.2 : a.n === 1 && a.w === 1 ? -1.9 : a.n === 1 ? -2.5 : -.8, r = armR(a, phi), e = document.createElement('div'); e.className = 'arm'; e.textContent = a.zh; lay.appendChild(e); return { el: e, p: [r * Math.cos(phi), 0, r * Math.sin(phi)] }; });
    var lo = document.createElement('div'); lo.className = 'arm'; lo.textContent = '猎户臂(本地臂)'; lo.style.color = 'rgba(240,201,122,.7)'; lay.appendChild(lo); ARML.push({ el: lo, p: [R0 * 1.03 * Math.cos(.22), 0, R0 * 1.03 * Math.sin(.22)] });
    var bl = document.createElement('div'); bl.className = 'arm'; bl.textContent = '中央棒'; lay.appendChild(bl); ARML.push({ el: bl, p: [6500 * Math.cos(27 * D2R) * -1, 0, 6500 * Math.sin(27 * D2R) * -1] });
    input();
  }
  function tsgRows(t, wk) {   // C2.12b TSG 地址 + 银经银纬 + 所属世界
    if (!TS) return ''; var a = TS.addr(t), w = GW ? GW.ofKey(wk, t) : null;
    return '<dt>TSG 地址</dt><dd class="tsgv">' + a.addr + '</dd><dt>银经 / 银纬</dt><dd>' + TS.fmtLB(TS.lb(t)) + '</dd><dt>所属世界</dt><dd>' + (w ? '<a class="wk" data-w="' + w.id + '">' + w.id + ' ' + w.name + '</a>' : '世界之间 · 航道空域') + '</dd>';
  }
  function wire(c) { c.querySelectorAll('a.wk').forEach(function (a) { a.onclick = function () { showWorld(GW.get(a.dataset.w)); }; }); }
  function show(m) {
    if (card) card.remove(); LASTM = m;
    card = document.createElement('div'); card.className = 'cd'; card.setAttribute('role', 'dialog');
    var dgc = Math.hypot(m.p[0], m.p[1], m.p[2]), h;
    if (m.cat === 'sun') h = '<h3>太阳系</h3><div class="ty">我们的家 · 猎户臂</div><p>太阳带着八大行星以约 230 km/s 绕银心公转,转一圈约 2.3 亿年 —— 上一次在这个位置时,地球上刚出现最早的恐龙。</p><dl><dt>距银心</dt><dd>约 26,996 光年</dd><dt>离银盘中面</dt><dd>约 55 光年(北侧)</dd>' + tsgRows(TS ? TS.sun : null, 'sun') + '</dl><div class="row"><button class="go" type="button">回驾驶舱</button></div>';
    else h = '<h3>' + m.zh + '</h3><div class="ty">' + CAT[m.cat].zh + (m.fl ? ' · ✦ 可飞抵' : '') + '</div><p>' + m.txt + '</p><dl><dt>距地球</dt><dd>约 ' + fly(m.ly) + '</dd><dt>距银心</dt><dd>约 ' + fly(dgc) + '</dd><dt>光的回看</dt><dd>你看到的是约 ' + fly(m.ly).replace('光年', '年') + '前发出的光</dd>' + tsgRows(TS ? TS.fromScene(m.p) : null, m.key) + '</dl>' +
      '<div class="row">' + (m.fl ? '<button class="go" type="button">设为目的地</button>' : '') + '<button class="fo" type="button">飞近看看</button></div>';
    card.innerHTML = '<button class="c" type="button" aria-label="关闭">×</button>' + h; ov.appendChild(card);
    card.querySelector('.c').onclick = function () { card.remove(); card = null; }; wire(card);
    var go = card.querySelector('.go'), fo = card.querySelector('.fo');
    if (go) go.onclick = function () { if (m.cat === 'sun') cockpit(); else target(m); };
    if (fo) fo.onclick = function () { focus(m.p, Math.max(2500, Math.min(60000, m.ly > 1e5 ? 60000 : 9000))); };
  }
  function mkByKey(k) { return MK.filter(function (x) { return x.key === k; })[0]; }
  function showWorld(w) {   // C2.12b 世界卡(11 张:VI-1…VI-10 + 麦哲伦门)
    if (!w) return; if (card) card.remove(); WSEL = w; LASTM = null;
    card = document.createElement('div'); card.className = 'cd wc'; card.setAttribute('role', 'dialog'); card.setAttribute('aria-label', '世界卡 ' + w.name);
    var lbv = TS.lb(w.anc), li = w.o.map(function (o) { var m = o[1] && mkByKey(o[1]); return '<li>' + (m ? '<a data-k="' + o[1] + '">' + o[0] + '</a>' + (m.fl ? ' ✦' : '') : o[0]) + '</li>'; }).join('');
    card.innerHTML = '<button class="c" type="button" aria-label="关闭">×</button><h3>' + w.id + ' · ' + w.im + '<small style="font-size:12px;color:#9fb3cf;margin-left:6px">' + w.zh + '</small></h3>' +
      '<div class="ty">' + (w.id === 'GATE' ? '星域 VI 门槛' : '星域 VI · 银河世界') + '</div><div>' + w.tag.map(function (t) { return '<span class="tg">' + t + '</span>'; }).join('') + '</div>' +
      '<div class="q">❓ ' + w.q + (w.q2 ? '<br><small style="color:#b8c6dc">' + w.q2 + '</small>' : '') + '</div><p>' + w.land + '</p>' +
      '<dl><dt>TSG 地址</dt><dd class="tsgv">' + w.a.addr + '</dd><dt>锚点</dt><dd>' + w.an + '</dd><dt>银经 / 银纬</dt><dd>' + TS.fmtLB(lbv) + '</dd><dt>距太阳</dt><dd>' + w.dist + '</dd><dt>距银心</dt><dd>约 ' + fly(w.a.rs) + '</dd></dl>' +
      '<div class="ty" style="margin-top:6px">代表天体(✦ 已可飞抵)</div><ul>' + li + '</ul>' + (w.br ? '<div class="nt">星桥:' + w.br + '</div>' : '') +
      '<div class="nt">信标站与' + (w.id === 'GATE' ? '虫洞门:C2.13a 开放' : '曲率跃迁航道:C2.12c 开放') + ' · 自由探索,信标只做收集。距离为约数,来源 NASA / ESA / ESO 公开资料、Gaia DR3、Reid et al. 2019。</div>' +
      '<div class="row"><button class="go" type="button">进入世界 · L1</button><button class="wa" type="button">十大世界</button></div>';
    ov.appendChild(card);
    card.querySelector('.c').onclick = function () { card.remove(); card = null; WSEL = null; };
    card.querySelectorAll('li a').forEach(function (a) { a.onclick = function () { var m = mkByKey(a.dataset.k); if (m) { focus(m.p, Math.max(2500, Math.min(60000, m.ly > 1e5 ? 60000 : 9000))); show(m); } }; });
    card.querySelector('.go').onclick = function () { enterWorld(w); };
    card.querySelector('.wa').onclick = function () { worldList(); };
    hk('card', card, w);
  }
  function enterWorld(w) { if (w.id === 'GATE') { preset('mc'); return; } if (w.id === 'VI-9') { tween(TS.toScene(w.anc), 30000, .25); return; } focus(TS.toScene(w.anc), w.id === 'VI-7' ? 9000 : 15000); }
  function worldList() {
    if (!GW) return; if (card) card.remove(); WSEL = null; LASTM = null;
    card = document.createElement('div'); card.className = 'cd wc'; card.setAttribute('role', 'dialog'); card.setAttribute('aria-label', '十大银河世界');
    card.innerHTML = '<button class="c" type="button" aria-label="关闭">×</button><h3>十大银河世界</h3><div class="ty">星域 VI · 天枢银河坐标 TSG(环带 R × 扇区 S × 层)</div><div class="wlist">' +
      GW.list.map(function (w) { return '<button type="button" data-w="' + w.id + '">' + w.id + ' ' + w.name + '<small>' + w.a.addr + '</small></button>'; }).join('') + '</div><div class="nt">点世界看世界卡;边界为示意划分,跨世界的航道与跃迁在 C2.12c 开放。</div>';
    ov.appendChild(card);
    card.querySelector('.c').onclick = function () { card.remove(); card = null; };
    card.querySelectorAll('.wlist button').forEach(function (b) { b.onclick = function () { showWorld(GW.get(b.dataset.w)); }; });
  }
  function lvHint(t) { var h = ov && ov.querySelector('.lv .h'); if (h) h.textContent = t || ''; }
  function lvGo(i) {   // 六级尺度切换:L0–L2 在全景里缩放;L3–L5 交给驾驶舱的 ✦ 航点(近景复用 SHXDV / T7)
    endIntro(); var tg = [C.tx, C.ty, C.tz], w = GW && GW.at(TS.fromScene(tg));
    if (i === 0) { preset('whole'); lvHint(''); return; }
    if (i === 1) { var ww = WSEL || w || GW.get('VI-1'); enterWorld(ww); lvHint('L1 · ' + ww.id + ' ' + ww.name); return; }
    if (i === 2) { focus(LASTM ? LASTM.p : tg, 2200); lvHint('L2 星区:盘内立体星场在 C2.12d 加入'); return; }
    var m = LASTM && LASTM.fl ? LASTM : null;
    if (m) { lvHint(''); target(m); return; }
    lvHint('L3–L5:先点一个带 ✦ 的天体,再从这里进驾驶舱飞抵');
  }
  function cockpit(after) {
    close();
    var open = function () { return window.SHXC && SHXC.isOpen && SHXC.isOpen(); };
    if (!open()) { if (window.SHXV && SHXV.go) SHXV.go('fly'); else if (window.SHXC) SHXC.open(); }
    if (after) { var n = 0; (function w() { if (open() && window.SHXC._ && SHXC._.tempDso) { setTimeout(after, 400); return; } if (n++ < 200) setTimeout(w, 150); })(); }
  }
  function target(m) {
    cockpit(function () { try { if (window.SHXDV && SHXDV.lock(m.key, '银河全景') && window.SHXC && SHXC._) SHXC._.toast('目的地 ' + m.zh + ' 已锁定 · 点锚点卡「出发」或按 Enter'); } catch (e) { } });
  }

  /* ---------- 相机 ---------- */
  var PRE = { all: { t: [3000, 0, 0], d: 42000, pit: .5, yaw: -.35 }, whole: { t: [0, 0, 0], d: 105000, pit: .8 }, top: { t: [0, 0, 0], d: 100000, pit: 1.55 }, side: { t: [0, 0, 0], d: 82000, pit: .03 }, sun: { t: [R0, 0, 0], d: 9000, pit: .6 }, mc: { t: [-15000, -60000, -70000], d: 400000, pit: .15, yaw: .25 } };
  function preset(k) { var p = PRE[k]; if (!p) return; tween(p.t, p.d, p.pit, p.yaw != null ? p.yaw : k === 'top' ? -Math.PI / 2 : null); ov.querySelectorAll('.bar button').forEach(function (b) { b.classList.toggle('on', b.dataset.p === k); }); idle = performance.now() + 4000; }
  function focus(p, d) { tween(p, d, Math.max(.35, C.pit)); ov.querySelectorAll('.bar button').forEach(function (b) { b.classList.remove('on'); }); }
  function tween(t, d, pit, yaw) {
    var a = { tx: C.tx, ty: C.ty, tz: C.tz, d: C.d, pit: C.pit, yaw: C.yaw }, b = { tx: t[0], ty: t[1], tz: t[2], d: d, pit: pit, yaw: yaw == null ? C.yaw : yaw };
    b.yaw = a.yaw + ((((b.yaw - a.yaw) % 6.2832) + 9.4248) % 6.2832 - 3.1416);
    if (rm()) { for (var k in b) C[k] = b[k]; return; }
    TW = { a: a, b: b, t0: performance.now(), dur: 1400 };
  }
  function step(now) {
    if (INTRO) { introStep(now); return; }
    if (hk('step', now)) return;
    if (TW) { var k = Math.min(1, (now - TW.t0) / TW.dur), e = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; ['tx', 'ty', 'tz', 'pit', 'yaw'].forEach(function (n) { C[n] = TW.a[n] + (TW.b[n] - TW.a[n]) * e; }); C.d = TW.a.d * Math.pow(TW.b.d / TW.a.d, e); if (k >= 1) TW = null; }
    else if (!rm() && now > idle) C.yaw += Math.min(.05, (now - last) / 1000) * .025;
  }
  function input() {
    var pts = {}, pd = 0, dn = null;
    cv.addEventListener('pointerdown', function (e) { if (INTRO) endIntro(true); cv.setPointerCapture(e.pointerId); pts[e.pointerId] = [e.clientX, e.clientY]; dn = [e.clientX, e.clientY]; TW = null; idle = performance.now() + 6000; });
    cv.addEventListener('pointermove', function (e) {
      if (!pts[e.pointerId]) return; var ids = Object.keys(pts), p = pts[e.pointerId], dx = e.clientX - p[0], dy = e.clientY - p[1];
      if (ids.length === 2) { var o = pts[ids[0] == e.pointerId ? ids[1] : ids[0]], d = Math.hypot(e.clientX - o[0], e.clientY - o[1]); if (pd) zoom(pd / d); pd = d; }
      else { C.yaw -= dx * .005; C.pit = Math.max(-1.5, Math.min(1.56, C.pit + dy * .005)); }
      pts[e.pointerId] = [e.clientX, e.clientY]; idle = performance.now() + 6000;
    });
    function up(e) { delete pts[e.pointerId]; pd = 0; if (dn && Math.hypot(e.clientX - dn[0], e.clientY - dn[1]) < 4 && card) { card.remove(); card = null; } dn = null; }
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    cv.addEventListener('wheel', function (e) { e.preventDefault(); if (INTRO) endIntro(true); zoom(Math.exp(e.deltaY * .0012)); idle = performance.now() + 6000; }, { passive: false });
  }
  function zoom(f) { TW = null; C.d = Math.max(800, Math.min(600000, C.d * f)); }

  /* ---------- C2.12a 开场镜头 · 差速自转 ---------- */
  var KEY = 'gn:sh:x-gxintro';
  var KF = [   // [秒, 目标, 距离, 俯仰, 方位, 字幕]
    [0, [R0, 0, 0], 260, .1, .55, ['离开太阳系', '下一站:我们所在的整个星系。']],
    [3, [R0, 0, 0], 2600, .14, .35, ['本地泡', '你正穿过本地泡 —— 一个被古老超新星吹空的气泡。']],
    [6, [R0 - 1200, 0, -300], 8000, .2, .15, ['猎户臂', '猎户座大星云从下方滑过,太阳就住在这条短短的旋臂上。']],
    [9, [R0 * .55, 0, 0], 22000, .34, -.1, ['升出银盘', '抬头,是银河的中心,2.7 万光年外。']],
    [12, [3000, 0, 0], 42000, .5, -.35, ['银河系', '约 2,000 亿颗恒星,我们只是其中一颗。']]];
  function introStep(now) {
    var t = (now - INTRO.t0) / 1000, i = 0; while (i < KF.length - 2 && t > KF[i + 1][0]) i++;
    var a = KF[i], b = KF[i + 1], k = Math.max(0, Math.min(1, (t - a[0]) / (b[0] - a[0]))), e = k * k * (3 - 2 * k);
    C.tx = a[1][0] + (b[1][0] - a[1][0]) * e; C.ty = 0; C.tz = a[1][2] + (b[1][2] - a[1][2]) * e;
    C.d = a[2] * Math.pow(b[2] / a[2], e); C.pit = a[3] + (b[3] - a[3]) * e; C.yaw = a[4] + (b[4] - a[4]) * e;
    var ci = t >= 11.2 ? 4 : t < .4 ? -1 : Math.min(3, Math.floor((t - .4) / 3) + (t >= 3.4 ? 0 : 0));
    if (t >= .4 && t < 11.2) ci = Math.min(3, Math.floor((t - .4) / 2.9));
    if (ci !== INTRO.ci) { INTRO.ci = ci; capSet(ci >= 0 ? KF[ci][5] : null); }
    if (t >= 14.5) endIntro();
  }
  function capSet(c) { var e = ov && ov.querySelector('.cap'); if (!e) return; if (!c) { e.classList.remove('on'); return; } e.classList.remove('on'); setTimeout(function () { e.innerHTML = '<small>' + c[0] + '</small>' + c[1]; e.classList.add('on'); }, 260); }
  function intro(force) {
    if (mode !== '3d' || rm()) return false;
    if (!force) { try { if (localStorage.getItem(KEY)) return false; } catch (e) { } }
    if (TFon) tfToggle(); if (card) { card.remove(); card = null; }
    TW = null; INTRO = { t0: performance.now(), ci: -2 }; ov.classList.add('intro'); introStep(INTRO.t0);
    try { localStorage.setItem(KEY, '1'); } catch (e) { }
    return true;
  }
  function endIntro(jump) {
    if (!INTRO) return; INTRO = null; ov.classList.remove('intro'); capSet(null);
    var f = KF[KF.length - 1]; if (jump) { C.tx = f[1][0]; C.ty = 0; C.tz = f[1][2]; C.d = f[2]; C.pit = f[3]; C.yaw = f[4]; }
    idle = performance.now() + 4000; ov.querySelectorAll('.bar button').forEach(function (b) { b.classList.toggle('on', b.dataset.p === 'all'); });
  }
  function tfShow() { var e = ov.querySelector('.tfc'); e.innerHTML = '差速自转演示 · +' + (TF / 100).toFixed(2) + ' 亿年<small>恒星内快外慢(约 230 km/s):太阳绕银心一圈约 2.3 亿年 · 天体标记暂时隐藏</small>'; }
  function tfToggle() {
    TFon = !TFon; ov.classList.toggle('tf', TFon); var b = ov.querySelector('.bar button[data-p="tf"]'); if (b) { b.classList.toggle('on', TFon); b.textContent = TFon ? '回到今天' : '差速自转'; }
    if (TFon) { TF = 0; if (rm()) TF = 115; tfShow(); } else TF = 0;
  }

  /* ---------- 帧 ---------- */
  var W = 0, H = 0, VP = null;
  function size() { W = ov.clientWidth; H = ov.clientHeight; if (rd) { rd.setSize(W, H, false); cam.aspect = W / H; cam.updateProjectionMatrix(); } }
  function proj(p) {   // → [x, y, 深度] 或 null
    if (mode === '3d') { VP.set(p[0], p[1], p[2]).project(cam); if (VP.z > 1 || VP.z < -1) return null; return [(VP.x + 1) / 2 * W, (1 - VP.y) / 2 * H, VP.z]; }
    var s = Math.min(W, H) / (2.3 * RG); return [W / 2 + p[0] * s, H / 2 + p[2] * s, 0];
  }
  function labels() {
    var placed = [], mob = small();
    MK.forEach(function (m) {
      var e = m.el, q = hidden[m.cat] ? null : proj(m.p); if (!q || q[0] < -40 || q[0] > W + 40 || q[1] < -20 || q[1] > H - (small() ? 64 : 70) || (q[1] < 120 && q[0] < Math.min(W - 60, 660))) { e.style.display = 'none'; return; }
      e.style.display = ''; e.style.transform = 'translate(' + (q[0] - 8) + 'px,' + (q[1] - 10) + 'px)';
      var clash = placed.some(function (o) { return Math.abs(o[0] - q[0]) < (mob ? 70 : 96) && Math.abs(o[1] - q[1]) < 16; });
      e.classList.toggle('nl', clash); if (!clash) placed.push(q);
    });
    var far = mode === '3d' ? C.d : 150000;
    WLB.forEach(function (o) {
      var q = LAYS.wb ? proj(o.p) : null, sel = WSEL === o.w;
      if (!q || (o.w.id === 'GATE' && far < 150000 && !sel && !(window.SHXGJ && SHXGJ.busy())) || (o.w.id !== 'GATE' && far > 380000) || q[0] < -60 || q[0] > W + 20 || q[1] < 40 || q[1] > H - 80 || (q[1] < 120 && q[0] < Math.min(W - 60, 660))) { o.el.style.display = 'none'; return; }
      var cl = placed.some(function (z) { return Math.abs(z[0] - q[0] - 30) < 100 && Math.abs(z[1] - q[1] - 10) < 22; }); placed.push([q[0] + 30, q[1] + 10]);
      o.el.style.display = ''; o.el.classList.toggle('on', sel); o.el.classList.toggle('cp', cl && !sel); o.el.style.transform = 'translate(' + (q[0] + 8) + 'px,' + (q[1] + 6) + 'px)';
    });
    GLB.forEach(function (o) { var q = LAYS.grid ? proj(o.p) : null; if (!q || far > 400000 || q[0] < 0 || q[0] > W || q[1] < 0 || q[1] > H) { o.el.style.display = 'none'; return; } o.el.style.display = ''; o.el.style.transform = 'translate(' + q[0] + 'px,' + q[1] + 'px) translate(-50%,-50%)'; });
    hk('labels', proj, W, H, far);
    hud();
    ARML.forEach(function (a) { var q = proj(a.p); if (!q || far < 20000 || far > 380000) { a.el.style.display = 'none'; return; } a.el.style.display = ''; a.el.style.transform = 'translate(' + q[0] + 'px,' + q[1] + 'px) translate(-50%,-50%)'; });
    // 比例尺
    var lyPerPx = mode === '3d' ? 2 * C.d * Math.tan(30 * D2R) / H : 2.3 * RG / Math.min(W, H), steps = [100, 500, 1000, 5000, 10000, 20000, 50000, 100000], L = 100, px = 100;
    for (var i = 0; i < steps.length; i++) { px = steps[i] / lyPerPx; L = steps[i]; if (px > 60) break; }
    var sc = ov.querySelector('.sc'); sc.querySelector('span').textContent = fly(L); sc.querySelector('b').style.width = Math.round(px) + 'px';
  }
  function hud() {   // C2.12b 视点 TSG 读数 + 尺度层级
    if (!TS || !ov) return; var tg = TS.fromScene([C.tx, C.ty, C.tz]), a = TS.addr(tg), w = GW && GW.at(tg), d = mode === '3d' ? C.d : 150000, li = TS.level(d), L = TS.LV[li];
    var s = '<b>TSG 视点 ' + a.addr + '</b><br>' + (w ? '<em>' + w.id + ' ' + w.name + '</em>' : '世界之间 · 航道空域') + '<br>尺度 ' + L.k + ' ' + L.zh + ' · 视距约 ' + fly(d);
    if (s !== HUDS) { HUDS = s; ov.querySelector('.tsg').innerHTML = s; ov.querySelectorAll('.lv button').forEach(function (b) { b.classList.toggle('on', +b.dataset.i === li); }); }
  }
  function frame(now) {
    if (!open_) return;
    step(now); last = now;
    if (mode === '3d') {
      var cp = Math.cos(C.pit), x = C.tx + C.d * cp * Math.cos(C.yaw), y = C.ty + C.d * Math.sin(C.pit), z = C.tz + C.d * cp * Math.sin(C.yaw);
      cam.position.set(x, y, z); cam.up.set(0, 1, 0); if (C.pit > 1.5) cam.up.set(-Math.cos(C.yaw), 0, -Math.sin(C.yaw)); cam.lookAt(C.tx, C.ty, C.tz);
      var kk = H / (2 * Math.tan(30 * D2R)), um = C.d < 40000 ? 2.2 + 5.8 * C.d / 40000 : 28; mats[0].uniforms.uK.value = kk; mats[1].uniforms.uK.value = kk; mats[0].uniforms.uM.value = um; mats[1].uniforms.uM.value = Math.max(um * 8, 14);
      if (GLOW) { GLOW.quaternion.copy(cam.quaternion); mats[3].uniforms.uA.value = .075 * (1 - .55 * Math.abs(Math.sin(C.pit))); }
      mats[2].uniforms.uK.value = kk; mats[2].uniforms.uB.value = (small() ? .026 : .018) * Math.sqrt(60000 / built.GS.length) * Math.min(1, C.d / 25000); mats[2].uniforms.uT.value = TF;
      var dsf = Math.max(0, Math.min(1, (C.d - 6000) / 14000)), sp = Math.abs(Math.sin(C.pit));
      DSL.forEach(function (q) { q.m.uniforms.uA.value = q.w * dsf * (sp < .12 ? 1.4 : .55 + .45 * sp); });
      if (HALO) { HALO.quaternion.copy(cam.quaternion); HALO.material.uniforms.uA.value = .06 * Math.min(1, C.d / 30000) * (1 - .4 * sp); }
      if (TFon) { TF = Math.min(230, TF + Math.min(.05, (now - (frame.lt || now)) / 1000) * 20); if (TF >= 230) TF = 230; tfShow(); }
      var ov2 = !INTRO && !TFon; if (GRID) GRID.visible = ov2 && LAYS.grid; if (WLN) { WLN.visible = ov2 && LAYS.wb; WLN.children.forEach(function (l) { var se = WSEL && WSEL.id === l.userData.w; l.material.opacity = se ? .85 : .3; if (l.userData.w === 'GATE') l.visible = se || C.d > 120000; }); }
      hk('frame', now, ov2);
      frame.lt = now; mats[0].uniforms.uT.value = TF; mats[1].uniforms.uT.value = TF;
      if (!hk('skip3d', now)) rd.render(scn, cam);   // C2.12c:跃迁隧道全遮挡时跳过银河粒子绘制(近盘过度绘制是不出帧主因)
    }
    labels();
    raf = requestAnimationFrame(frame);
  }
  function flat() {   // 无 WebGL:2D 俯视静图
    mode = '2d'; ov.classList.add('m2d'); ov.querySelectorAll('.bar button').forEach(function (b) { if (b.dataset.p !== 'fly') b.style.display = 'none'; });
    if (!built) built = gen();
    var g = cv.getContext('2d'), D = Math.min(devicePixelRatio || 1, 1.5); cv.width = W * D; cv.height = H * D; g.scale(D, D);
    g.fillStyle = '#010208'; g.fillRect(0, 0, W, H); g.globalCompositeOperation = 'lighter';
    var s = Math.min(W, H) / (2.3 * RG), P = built.P, Cc = built.C;
    for (var i = 0; i < built.n; i += 2) { var x = W / 2 + P[i * 3] * s, y = H / 2 + P[i * 3 + 2] * s; g.fillStyle = 'rgba(' + (Cc[i * 3] * 255 | 0) + ',' + (Cc[i * 3 + 1] * 255 | 0) + ',' + (Cc[i * 3 + 2] * 255 | 0) + ',.35)'; g.fillRect(x, y, 1.3, 1.3); }
    g.globalCompositeOperation = 'source-over';
    if (TS && LAYS.grid) { g.strokeStyle = 'rgba(127,214,255,.22)'; g.lineWidth = 1; for (var k = 1; k <= 12; k++) { g.beginPath(); g.arc(W / 2, H / 2, k * 5000 * s, 0, 6.2832); g.stroke(); } for (k = 0; k < 12; k++) { g.beginPath(); g.moveTo(W / 2, H / 2); g.lineTo(W / 2 + 60000 * s * Math.cos(k * 30 * D2R), H / 2 + 60000 * s * Math.sin(k * 30 * D2R)); g.stroke(); } }
    hk('flat', g, s, W, H);
    if (GW && LAYS.wb) GW.list.forEach(function (w) { if (w.reg.gate) return; g.strokeStyle = w.id === 'VI-10' ? 'rgba(159,179,207,.5)' : 'rgba(240,201,122,.45)'; GW.outline(w).forEach(function (L) { g.beginPath(); L.forEach(function (p, i) { var x = W / 2 + p[0] * s, y = H / 2 + p[1] * s; if (i) g.lineTo(x, y); else g.moveTo(x, y); }); g.stroke(); }); });
  }

  function open(o) {
    if (open_) return; o = o || {};
    if (!ov) dom(); else { ov.style.display = ''; }
    open_ = true; document.body.classList.add('xgx-on'); size();
    if (mode !== '2d' && !rd) { if (!build3d()) flat(); else size(); }
    if (mode === '2d') flat();
    C.tx = 3000; C.ty = 0; C.tz = 0; C.d = 42000; C.pit = .5; C.yaw = -.35;
    if (o.at === 'sun') { C.tx = R0; C.d = 60000; preset('all'); } else ov.querySelector('.bar button[data-p="all"]').classList.add('on');
    if (!(o.at !== 'sun' && !o.noIntro && intro(!!o.intro)) && !rm() && mode === '3d' && o.at !== 'sun') { C.d = 160000; C.pit = 1.0; tween([3000, 0, 0], 42000, .5, -.35); }
    idle = performance.now() + 3000; last = performance.now();
    requestAnimationFrame(function () { ov.classList.add('on'); });
    addEventListener('resize', onR); raf = requestAnimationFrame(frame);
    if (mode === '2d') labels();
    try { history.replaceState(null, '', setQ('view', 'galaxy')); } catch (e) { }
  }
  function onR() { size(); if (mode === '2d') { flat(); labels(); } }
  function setQ(k, v) { var u = new URL(location.href); if (v) u.searchParams.set(k, v); else u.searchParams.delete(k); return u.pathname + u.search + u.hash; }
  function close() {
    if (!open_) return; open_ = false; document.body.classList.remove('xgx-on'); cancelAnimationFrame(raf); removeEventListener('resize', onR);
    if (card) { card.remove(); card = null; } WSEL = null; LASTM = null;
    if (INTRO) endIntro(); if (TFon) tfToggle(); hk('close');
    ov.classList.remove('on'); var o = ov; setTimeout(function () { if (!open_) o.style.display = 'none'; }, 500);
    if (rd) { try { rd.dispose(); if (rd.forceContextLoss) rd.forceContextLoss(); } catch (e) { } rd = null; mats = []; scn = null; GRID = null; WLN = null; var nc = cv.cloneNode(false); cv.parentNode.replaceChild(nc, cv); cv = nc; input(); }
    try { if (/[?&]view=galaxy/.test(location.search)) history.replaceState(null, '', setQ('view', null)); } catch (e) { }
  }
  VP = { set: function (x, y, z) { this.v = this.v || new window.THREE.Vector3(); this.v.set(x, y, z); return this; }, project: function (c) { this.v.project(c); this.x = this.v.x; this.y = this.v.y; this.z = this.v.z; return this; } };
  if (window.SHXESC) SHXESC.reg('galaxy', 110, function () { return open_; }, function () { if (INTRO) endIntro(true); else if (card) { card.remove(); card = null; } else close(); });
  // C2.13a3 深链 ?view=galaxy(1.0 星域 VI 卡片跳转用):等页面就绪后直接打开银河全景;关闭后回到驾驶舱首页可正常操作
  try { if (/[?&]view=galaxy\b/.test(location.search)) (function w3(n) { if (document.body && (window.THREE || n > 80) && (window.SHDOM ? SHDOM.ready : true) || n > 120) { setTimeout(function () { if (!open_) open({ src: "深链" }); }, 500); return; } if (n < 250) setTimeout(function () { w3(n + 1); }, 100); })(0); } catch (e) { }
  window.SHXGX = { open: open, close: close, isOpen: function () { return open_; }, preset: function (k) { if (open_) preset(k); }, show: function (key) { var m = MK.filter(function (x) { return x.key === key; })[0]; if (m) show(m); }, mode: function () { return mode; }, intro: function () { return !!INTRO; }, skip: function () { endIntro(true); }, n: function () { return built ? built.n : 0; }, tf: function () { if (open_) tfToggle(); return TFon; }, world: function (id) { if (open_ && GW) { if (id) showWorld(GW.get(id)); else worldList(); } return !!card; }, enter: function (id) { if (open_ && GW && GW.get(id)) enterWorld(GW.get(id)); }, lv: function (i) { if (open_) lvGo(i); return TS ? TS.level(C.d) : -1; }, layers: function (o) { if (o) { for (var k in o) LAYS[k] = !!o[k]; if (ov) ov.querySelectorAll('.lg button[data-l]').forEach(function (b) { b.classList.toggle('off', !LAYS[b.dataset.l]); }); if (mode === '2d' && open_) flat(); } return { grid: LAYS.grid, wb: LAYS.wb, jr: LAYS.jr }; }, hud: function () { return ov ? ov.querySelector('.tsg').textContent : ''; }, card: function () { return card ? card.textContent : ''; }, _: { hook: function (n, f) { HK[n].push(f); }, C: C, tween: tween, showWorld: function (w) { showWorld(w); }, enterWorld: function (w) { enterWorld(w); }, ov: function () { return ov; }, lay: function () { return lay; }, rm: rm, mode: function () { return mode; }, fly: fly, small: small, layers: LAYS, closeCard: function () { if (card) { card.remove(); card = null; } WSEL = null; }, setSel: function (w) { WSEL = w; } }, objs: function () { return OBJ.map(function (o) { return { key: o[0], zh: o[1], p: pos(o[3], o[4], o[5]) }; }); } };
})();
