/* 天枢 Starhelm 2.0 · C2.13b 星系世界模板 · 首个 G 星系:仙女座 M31(SHXGW)
 * 依据《天枢 银河与宇宙世界层总体设计 v1.0》6.4 节「星系世界模板」;首批 M31 → LMC → M87 → M51(王磊 10-30 13:53 确认)。
 * - 从本星系群 L0(sh-x-lg.js)仙女座卡片「进入星系世界」进入;独立全屏视图,自带 three 渲染器(r186 与 ?three=169 通用)。
 * - 星系本体全部是 3D 粒子(王磊 10-30 渲染标准:禁平面贴图 / billboard):局部坐标盘面在 xz 平面,单位千光年。
 *   M31:金色核球 + 双核(P1 / P2,哈勃 1993 发现;P2 旁有约 1.4 亿太阳质量黑洞)+ 内环(约 1.5 kpc,疑与 M32 穿盘有关)
 *   + 10 kpc 尘埃环(约 3.3 万光年,斯皮策红外最醒目)+ 紧绕旋臂碎段 + NGC 206 蓝色星云 + 恒星晕 + M32 / M110 + 巨型南方星流。
 * - 区域世界(双名):G-M31-1 双核之心 · G-M31-2 火环 · G-M31-3 NGC 206 · G-M31-4 伴星与星流;每个有核心问题与讲解。
 * - 回望银河:按真实方向(由 SHXLG.geo 给出的 M31 位置与盘面朝向换算)在 254 万光年外画出银河系,并标「你看到的是 254 万年前的银河」。
 * - C2.13b2 模板化:GAL 表(M31、LMC);大麦哲伦云 = 偏心棒 + 单旋臂 + 蜘蛛星云/R136 + SN 1987A 三环 + N11 + 小麦哲伦云/麦哲伦桥/麦哲伦流;近距自动降亮防核区过曝。
 * - C2.13b3 M87:巨椭圆 + 中心尖峰 + 约 1.3 万球状星团 + 5,000 光年喷流(对数分布,一直连到视界附近,HST-1/A/B 等亮结示意)+ M87* 光环(EHT 2019,南侧多普勒增亮);入口 L0 层级栏 L1。
 * - 无 WebGL 时不进入(按钮提示);减少动态时相机直接切换。Esc / × 回本星系群。深链 ?view=gw。
 * - 数字为约数:距离 254 万光年(NASA)、倾角 77°、10 kpc 环、NGC 206 约 4,000 光年宽、M32 投影距中心约 2.4 万光年、巨型星流长约 40 万光年。
 */
(function () {
  'use strict';
  var D2R = Math.PI / 180, DIST = 2537;
  var GMAIN = null, T, rd, scn, cam, cv, ov, lay, card, raf = 0, open_ = false, mats = [], LBL = [], last = 0, idle = 0, TW = null, MWP = null, FOV = 55, fovT = 55, VO = 0;
  var C = { tx: 0, ty: 0, tz: 0, d: 260, pit: .5, yaw: -.8 };
  function rm() { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } }
  function small() { return Math.min(screen.width, screen.height) < 700 || innerWidth <= 760; }
  function rnd(s) { return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
  function gs(R) { var u = R() || 1e-9, v = R(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(6.2831853 * v); }

  /* ---------- 结构(千光年) ---------- */
  var RG = 76, NGC206 = [-38, 0, -14], M32 = [6, 3.5, -16], M110 = [-24, -8, 30];
  var RW = [
    { id: 'G-M31-1', im: '双核之心', zh: '核球与双核', t: [.0008, 0, 0], d: .03, pit: .6, yaw: -.6, q: '一个星系为什么有两个核?', q2: '仙女座的超大质量黑洞有多重?',
      land: '哈勃在 1993 年发现仙女座中心有两个亮核:较亮的 P1 是绕黑洞偏心运动的老年恒星盘的远心点堆积,P2 里藏着约 1.4 亿倍太阳质量的黑洞和一团蓝色年轻星团。两核相距约 5 光年。', tag: ['已证实', '偏心盘模型为主流解释(推测)'] },
    { id: 'G-M31-2', im: '火环', zh: '10 kpc 尘埃环', t: [0, 0, 0], d: 110, pit: 1.05, yaw: -.4, q: '仙女座为什么更像一个环?', q2: '环是怎么来的?',
      land: '红外里仙女座最醒目的是距中心约 3.3 万光年的尘埃环,恒星形成大多在这里。它和中心附近一个偏心小环,可能是约 2–4 亿年前 M32 穿过盘面激起的涟漪。', tag: ['环结构已证实', 'M32 撞击成因(推测)'] },
    { id: 'G-M31-3', im: '蓝色星云', zh: 'NGC 206', t: NGC206, d: 14, pit: .7, yaw: .4, q: '恒星在哪里成群诞生?', q2: '为什么这片星云是蓝的?',
      land: 'NGC 206 是仙女座最亮的星协,宽约 4,000 光年,挤满上千万年内诞生的炽热蓝色恒星,在旋臂尘埃缝隙里透出光来。', tag: ['已证实'] },
    { id: 'G-M31-4', im: '伴星与星流', zh: 'M32 · M110 · 巨型南方星流', t: [-20, -40, -80], d: 420, pit: .35, yaw: -1.3, q: '大星系怎样吃掉小星系?', q2: 'M32 是被剥光的旋涡星系吗?',
      land: '致密椭圆 M32 紧贴盘面南侧,矮椭圆 M110 在西北。盘南方拖出一条长约 40 万光年的巨型恒星流,是约 20 亿年前一个较大伴星系被撕碎的残迹;有研究认为 M32 就是那个星系剩下的核心。', tag: ['星流已证实', 'M32 为残核(猜想)'] }
  ];

  function gen(sf) {
    var R = rnd(31337), P = [], Cc = [], S = [], DP = [], DS = [], k, i;
    function put(x, y, z, r, g, b, s) { P.push(x, y, z); Cc.push(r, g, b); S.push(s); }
    function dust(x, y, z, s) { DP.push(x, y, z); DS.push(s); }
    var N = Math.round(260000 * sf), tp = Math.tan(7 * D2R);
    // 核球:金色 3D 椭球
    for (k = 0; k < N * .16; k++) { var rb = Math.abs(gs(R)) * RG * .055, th = R() * 6.283, ph = Math.acos(2 * R() - 1); put(rb * Math.sin(ph) * Math.cos(th), rb * Math.cos(ph) * .7, rb * Math.sin(ph) * Math.sin(th), .95, .78 + R() * .08, .5 + R() * .1, .03 + rb * .012 + R() * .03); }
    // 双核:P1(偏心盘远心点,老年红黄)、P2(中心 + 蓝色年轻星团)
    var kc = .045 / Math.max(sf, .25);   // C2.13b4:双核粒子在极小体积里叠加,按粒子档位归一亮度(手机 / 桌面一致,不过曝)
    for (k = 0; k < N * .006; k++) { put(.0016 + gs(R) * .0011, gs(R) * .0006, gs(R) * .0009, .95 * kc * 3, .76 * kc * 3, .5 * kc * 3, .0011 + R() * .0009); }   // C2.13b4 压暗(原 3 / 2.4 / 1.6 过曝)
    for (k = 0; k < N * .004; k++) { put(gs(R) * .0008, gs(R) * .0005, gs(R) * .0008, .5 * kc * 3, .6 * kc * 3, .85 * kc * 3, .0009 + R() * .0007); }
    for (k = 0; k < N * .02; k++) { var rn = Math.abs(gs(R)) * .02; var tn = R() * 6.283; put(rn * Math.cos(tn) + .0006, gs(R) * .004, rn * Math.sin(tn) * .8, .6, .5, .37, .003 + R() * .003); }
    // 内环(偏心,约 1.5 kpc ≈ 5 千光年)
    for (k = 0; k < N * .025; k++) { var ti = R() * 6.283, ri = 4.9 * (1 + gs(R) * .12) + .8 * Math.sin(ti * 2 + 1); put(ri * Math.cos(ti) + .8, gs(R) * .08, ri * Math.sin(ti) * .78 - .4, .75, .6, .55, .04 + R() * .04); if (R() < .5) dust(ri * .99 * Math.cos(ti) + .8, gs(R) * .05, ri * .99 * Math.sin(ti) * .78 - .4, .3); }
    // 10 kpc 尘埃环(约 33 千光年):蓝白年轻星 + 粉色电离氢区 + 吸收尘
    for (k = 0; k < N * .2; k++) { var t2 = R() * 6.283, r2 = 33 * (1 + gs(R) * .08) + 2.5 * Math.sin(t2 * 3) + 1.5 * Math.sin(t2 * 7 + 2), cl = R() < .07; var x = r2 * Math.cos(t2), z = r2 * Math.sin(t2);
      put(x, gs(R) * .35, z, cl ? 1 : .6 + R() * .1, cl ? .42 : .72 + R() * .06, cl ? .7 : 1, cl ? .25 : .14 + R() * .14); if (R() < .6) dust(x * .985 + gs(R) * .4, gs(R) * .25, z * .985 + gs(R) * .4, .6 + R() * .7); }
    // 紧绕旋臂碎段 + 老年盘
    var rest = N * .42;
    for (k = 0; k < rest; k++) {
      var r = Math.min(RG, -Math.log(1 - R() * .985) * RG * .24 + 3), arm = R() < .55, t;
      t = arm ? Math.log(r / 4) / tp + Math.floor(R() * 2) * Math.PI + gs(R) * .17 : R() * 6.283;
      var fr = r / RG, xx = r * Math.cos(t), zz = r * Math.sin(t), yy = gs(R) * (.3 + .9 * fr), young = arm && R() < .45 && r > 14;
      put(xx, yy, zz, young ? .62 : .9 - fr * .2, young ? .74 : .82 - fr * .1, young ? 1 : .65 + fr * .25, young ? .12 + R() * .1 : .09 + R() * .09);
      if (arm && r > 10 && R() < .3) dust(r * Math.cos(t - .04), gs(R) * .25, r * Math.sin(t - .04), .5 + R() * .6);
    }
    // NGC 206:蓝色星协(约 4 千光年宽)
    for (k = 0; k < N * .03; k++) { put(NGC206[0] + gs(R) * 1.2, NGC206[1] + gs(R) * .3, NGC206[2] + gs(R) * .9, .55 + R() * .1, .7 + R() * .1, 1, .05 + R() * .07); }
    for (k = 0; k < N * .006; k++) { put(NGC206[0] + gs(R) * 1.5, NGC206[1] + gs(R) * .3, NGC206[2] + gs(R) * 1.2, 1, .4, .7, .07); }
    // 弥散盘光(大而淡,给体积感)
    for (k = 0; k < N * .05; k++) { var rd2 = Math.min(RG, -Math.log(1 - R() * .97) * RG * .22), td = R() * 6.283, f2 = rd2 / RG; put(rd2 * Math.cos(td), gs(R) * (.6 + 2.2 * (1 - f2)), rd2 * Math.sin(td), .14 - f2 * .05, .12 - f2 * .03, .1 + f2 * .03, 2.4 - f2 * 1.2); }
    // 恒星晕(半径约 15 万光年以上的稀薄球)
    for (k = 0; k < N * .03; k++) { var rh = Math.abs(gs(R)) * 55, th2 = R() * 6.283, ph2 = Math.acos(2 * R() - 1); put(rh * Math.sin(ph2) * Math.cos(th2), rh * Math.cos(ph2) * .7, rh * Math.sin(ph2) * Math.sin(th2), .5, .45, .4, .2 + R() * .3); }
    // M32(致密椭圆)与 M110(矮椭圆)
    function ell(c, Rr, n, q) { for (var j = 0; j < n; j++) { var su = Math.sqrt(R() * .97), rr = Rr * .25 * su / (1 - su), a = R() * 6.283, b = Math.acos(2 * R() - 1); put(c[0] + rr * Math.sin(b) * Math.cos(a), c[1] + rr * Math.cos(b) * q, c[2] + rr * Math.sin(b) * Math.sin(a), 1, .84, .62, .05 + R() * .08); } }
    ell(M32, 2.2, N * .025, .8); ell(M110, 6, N * .03, .55);
    // 巨型南方星流:从盘南缘向前下方拖出约 40 万光年的弧
    for (k = 0; k < N * .04; k++) { var s = Math.pow(R(), .8), w = 3 + s * 14; put(-6 - s * 60 + gs(R) * w, -10 - s * 120 + gs(R) * w * .6, -20 - s * 260 + gs(R) * w, .75, .65, .55, .5 + R() * .7); }
    return { P: new Float32Array(P), C: new Float32Array(Cc), S: new Float32Array(S), DP: new Float32Array(DP), DS: new Float32Array(DS) };
  }

  /* ---------- 大麦哲伦云(局部坐标千光年;盘半径约 1.5 万光年) ---------- */
  var D30 = [4, 0, 3], SN87 = [3.1, .05, 2.3], N11 = [-6, 0, 6], SMCP = null;
  function genLMC(sf) {
    var R = rnd(1987), P = [], Cc = [], S = [], DP = [], DS = [], k, j, N = Math.round(200000 * sf), tp = Math.tan(20 * D2R), a0 = 12 * D2R;
    function put(x, y, z, r, g, b, s) { P.push(x, y, z); Cc.push(r, g, b); S.push(s); }
    function dust(x, y, z, s) { DP.push(x, y, z); DS.push(s); }
    for (k = 0; k < N * .2; k++) { var u = gs(R) * 2.6, v = gs(R) * .55; put(-1.2 + u * Math.cos(a0) - v * Math.sin(a0), gs(R) * .25, .4 + u * Math.sin(a0) + v * Math.cos(a0), .85, .74, .55, .03 + R() * .04); }   // 偏心棒(约 1 万光年长)
    for (k = 0; k < N * .5; k++) {   // 盘 + 单旋臂
      var r = Math.min(16, -Math.log(1 - R() * .98) * 4.2 + .5), arm = R() < .35 && r > 4, t = arm ? Math.log(r / 4) / tp + .6 + gs(R) * .22 : R() * 6.283, x = r * Math.cos(t), z = r * Math.sin(t) * .9, bl = R() < (arm ? .6 : .3);
      put(x, gs(R) * (.2 + r * .03), z, bl ? .55 : .8, bl ? .66 : .74, bl ? 1 : .62, .03 + R() * .05);
      if (R() < .06) dust(x + gs(R) * .3, gs(R) * .1, z + gs(R) * .3, .25 + R() * .3);
    }
    for (k = 0; k < N * .04; k++) { var rd2 = Math.abs(gs(R)) * 5, td = R() * 6.283; put(rd2 * Math.cos(td) - .6, gs(R) * .7, rd2 * Math.sin(td) * .9, .09, .08, .085, .9 + R() * .6); }   // 弥散光
    function neb(c, sc, n, col) { for (j = 0; j < n; j++) { var th = R() * 6.283, ph = Math.acos(2 * R() - 1), rr = sc * (.4 + .6 * Math.pow(R(), .5)) * (1 + .35 * Math.sin(th * 5 + ph * 3)); put(c[0] + rr * Math.sin(ph) * Math.cos(th), c[1] + rr * Math.cos(ph) * .45, c[2] + rr * Math.sin(ph) * Math.sin(th), col[0], col[1], col[2], sc * (.1 + R() * .16)); } }
    var kn = .025 / Math.max(sf, .25);   // C2.13b4:星云粒子叠加按档位归一(原手机 / 桌面近看均过曝成白团)
    neb(D30, .5, N * .05, [2.2 * kn, .8 * kn, 1.35 * kn]); neb(D30, .32, N * .015, [.8 * kn, 1.8 * kn, 1.6 * kn]); neb(N11, .4, N * .015, [2 * kn, .8 * kn, 1.3 * kn]);   // 蜘蛛星云(30 Dor,宽约 1,000 光年)+ N11
    for (k = 0; k < N * .006; k++) put(D30[0] + gs(R) * .006, D30[1] + gs(R) * .004, D30[2] + gs(R) * .006, 2.2, 2.6, 3, .002 + R() * .003);   // R136 星团
    for (k = 0; k < N * .0015; k++) dust(D30[0] + gs(R) * .6, gs(R) * .12, D30[2] + gs(R) * .6, .05 + R() * .06);
    function ring(c, r0, dy, n, col) { for (j = 0; j < n; j++) { var t2 = R() * 6.283, rr = r0 * (1 + gs(R) * .04), x = rr * Math.cos(t2), z = rr * Math.sin(t2), y = dy; put(c[0] + x, c[1] + y * .8 + z * .6, c[2] + z * .8 - y * .6, col[0], col[1], col[2], .00006 + R() * .00005); } }
    ring(SN87, .00065, 0, 900, [3, 2.5, 1.9]); ring(SN87, .0016, .0006, 700, [2.4, .9, 1]); ring(SN87, .0016, -.0006, 700, [2.4, .9, 1]);   // SN 1987A 三环(内环直径约 1.3 光年)
    for (k = 0; k < 300; k++) put(SN87[0] + gs(R) * .00012, SN87[1] + gs(R) * .00009, SN87[2] + gs(R) * .00012, 2, 1.4, 1, .00005);
    if (SMCP) {   // 小麦哲伦云 + 麦哲伦桥
      for (k = 0; k < N * .08; k++) { var rs = Math.abs(gs(R)) * 2.4; put(SMCP[0] + gs(R) * 2.2, SMCP[1] + gs(R) * 1.2, SMCP[2] + gs(R) * 1.6, .6, .65, .85, .05 + R() * .05); }
      for (k = 0; k < N * .02; k++) { var tb = R(); put(SMCP[0] * tb + gs(R) * 2.5, SMCP[1] * tb + gs(R) * 2, SMCP[2] * tb + gs(R) * 2.5, .35, .3, .45, .4 + R() * .4); }
      for (k = 0; k < N * .02; k++) { var tf = 1 + R() * 2.5; put(SMCP[0] * tf + gs(R) * 4 * tf, SMCP[1] * tf + tf * tf * 6 + gs(R) * 4, SMCP[2] * tf + gs(R) * 4 * tf, .45, .25, .4, 1 + R()); }   // 麦哲伦流(拖尾,示意)
    }
    return { P: new Float32Array(P), C: new Float32Array(Cc), S: new Float32Array(S), DP: new Float32Array(DP), DS: new Float32Array(DS) };
  }
  var RWL = [
    { id: 'G-LMC-1', im: '偏心棒', zh: '星系棒与单旋臂', t: [-1, 0, .3], d: 30, pit: 1.15, yaw: .3, q: '它的棒为什么不在中心?', q2: '矮星系也能有旋臂吗?',
      land: '大麦哲伦云是「麦哲伦型」棒旋矮星系:一条约 1 万光年长的恒星棒明显偏离盘心,只有一条旋臂。哈勃与 Gaia 数据显示,数亿年前小麦哲伦云从它盘中穿过,可能把棒和盘扯得错位。', tag: ['偏心棒已证实', '碰撞成因(推测)'] },
    { id: 'G-LMC-2', im: '蜘蛛星云', zh: '30 Dor · R136', t: D30, d: 2.6, pit: .7, yaw: -.5, q: '本星系群最猛的恒星工厂长什么样?', q2: '已知最重的恒星住在哪里?',
      land: '蜘蛛星云(剑鱼座 30)宽约 1,000 光年,是本星系群最大最亮的恒星形成区。中心星团 R136 只有几光年宽,却挤着 R136a1 等约 200 倍太阳质量的恒星,它们的星风把气体吹成一条条蛛腿。', tag: ['已证实', 'R136a1 质量约 170–230 倍(测量仍有误差)'] },
    { id: 'G-LMC-3', im: '超新星 1987A', zh: 'SN 1987A', t: SN87, d: .006, pit: 1.05, yaw: .8, q: '近 400 年最近的肉眼超新星留下了什么?', q2: '三个光环是怎么来的?',
      land: '1987 年 2 月 23 日,一颗蓝超巨星在这里爆发,是开普勒 1604 年以来最近的肉眼超新星;中微子比光早约 3 小时到达地球。三个光环是恒星死前抛出的气体环被闪光照亮,内环直径约 1.3 光年。2024 年韦布望远镜在中心找到中子星存在的强证据。', tag: ['已证实', '中心中子星(2024 韦布强证据)'] },
    { id: 'G-LMC-4', im: '麦哲伦桥', zh: '大小云 · 麦哲伦流', t: null, d: 140, pit: .5, yaw: -1, q: '银河会把它们吞掉吗?', q2: '大小麦哲伦云是第一次来吗?',
      land: '小麦哲伦云在约 7.5 万光年外,两云之间由气体与年轻恒星组成的麦哲伦桥相连,身后拖着横跨天空 100° 以上的麦哲伦流。它们可能是第一次掠过银河;模拟认为约 20–25 亿年后大麦哲伦云会并入银河。', tag: ['桥与流已证实', '首次掠过(主流观点)', '20–25 亿年后并合(推测)'] }
  ];

  /* ---------- M87 巨椭圆(局部千光年;按天球真实方向放置,椭圆无盘面朝向) ---------- */
  /* C2.13b4:喷流按真实天球位置角对齐。PA ≈ 290°(北起向东,Walker 等 2018),与视线夹角约 17°(朝向我们)。
   * 局部坐标轴与银河场景坐标(SHXTSG.scene)平行;天北 / 天东方向由 SHXTSG 在 M87 位置差分得到。
   * 投影长度约 5,000 光年(观测值),故三维长度 JL = 5 / sin17° ≈ 1.7 万光年。 */
  var JD = [.82, .3, -.48], JS = [0, -1, 0], JI = 17 * D2R, JL = 5 / Math.sin(17 * D2R), JPA = 290;
  function skyB(ra, de) {   // 场景坐标中的:e 地球→天体方向、n 天北、ea 天东(单位向量)
    var T2 = window.SHXTSG; if (!T2) return null;
    function u(a, d) { var p = T2.scene(a, d, 1), o = T2.scene(a, d, 0), v = [p[0] - o[0], p[1] - o[1], p[2] - o[2]], l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; }
    function nz(v) { var l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; }
    var e = u(ra, de), h = .01, a = u(ra, de + h), b = u(ra + h / Math.cos(de * D2R), de);
    var n = [a[0] - e[0], a[1] - e[1], a[2] - e[2]], dn = n[0] * e[0] + n[1] * e[1] + n[2] * e[2]; n = nz([n[0] - dn * e[0], n[1] - dn * e[1], n[2] - dn * e[2]]);
    var ea = [b[0] - e[0], b[1] - e[1], b[2] - e[2]], de2 = ea[0] * e[0] + ea[1] * e[1] + ea[2] * e[2], dn2 = ea[0] * n[0] + ea[1] * n[1] + ea[2] * n[2]; ea = nz([ea[0] - de2 * e[0] - dn2 * n[0], ea[1] - de2 * e[1] - dn2 * n[1], ea[2] - de2 * e[2] - dn2 * n[2]]);
    return { e: e, n: n, ea: ea };
  }
  function m87Axes() {
    var B = skyB(187.706, 12.391); if (!B) return; var c = Math.cos(JPA * D2R), s2 = Math.sin(JPA * D2R), si = Math.sin(JI), ci = Math.cos(JI), k;
    var sky = [c * B.n[0] + s2 * B.ea[0], c * B.n[1] + s2 * B.ea[1], c * B.n[2] + s2 * B.ea[2]];
    for (k = 0; k < 3; k++) JD[k] = si * sky[k] - ci * B.e[k];
    var dj = -(B.n[0] * JD[0] + B.n[1] * JD[1] + B.n[2] * JD[2]);   // 南方向(去掉沿喷流分量),用于 M87* 光环南侧增亮
    JS = [-B.n[0] + dj * JD[0] * -1, -B.n[1] + dj * JD[1] * -1, -B.n[2] + dj * JD[2] * -1]; var sl = Math.hypot(JS[0], JS[1], JS[2]); JS = [JS[0] / sl, JS[1] / sl, JS[2] / sl];
    var w = RWM[1], v = [JD[2], 0, -JD[0]], vl = Math.hypot(v[0], v[2]) || 1; v = [v[0] / vl, .25, v[2] / vl];   // 侧面看喷流
    w.t = [JD[0] * JL * .45, JD[1] * JL * .45, JD[2] * JL * .45]; w.d = JL * 1.25; w.pit = Math.asin(v[1] / Math.hypot(v[0], v[1], v[2])); w.yaw = Math.atan2(v[0], v[2]);
  }
  function genM87(sf) {
    var R = rnd(8787), P = [], Cc = [], S = [], k, j, N = Math.round(220000 * sf);
    function put(x, y, z, r, g, b, s) { P.push(x, y, z); Cc.push(r, g, b); S.push(s); }
    for (k = 0; k < N * .62; k++) { var su = Math.sqrt(R() * .985), rr = 60 * .25 * su / (1 - su), t = R() * 6.283, ph = Math.acos(2 * R() - 1); put(rr * Math.sin(ph) * Math.cos(t), rr * Math.cos(ph) * .86, rr * Math.sin(ph) * Math.sin(t), 1, .82 + R() * .06, .58 + R() * .1, .05 + Math.min(rr, 40) * .006 + R() * .05); }
    for (k = 0; k < N * .05; k++) { var rd = Math.abs(gs(R)) * 30, t2 = R() * 6.283, p2 = Math.acos(2 * R() - 1); put(rd * Math.sin(p2) * Math.cos(t2), rd * Math.cos(p2) * .86, rd * Math.sin(p2) * Math.sin(t2), .13, .11, .08, 3 + R() * 3); }   // 弥散体积光
    for (k = 0; k < N * .08; k++) { var lr = Math.pow(10, -4 + R() * 4), t3 = R() * 6.283, p3 = Math.acos(2 * R() - 1); put(lr * Math.sin(p3) * Math.cos(t3), lr * Math.cos(p3) * .86, lr * Math.sin(p3) * Math.sin(t3), 1, .85, .65, lr * .04); }   // 中心星团尖峰(对数分布,放大时仍有星)
    for (k = 0; k < Math.round(13000 * Math.max(sf, .4)); k++) { var gr = 4 + Math.pow(R(), 2.2) * 320, t4 = R() * 6.283, p4 = Math.acos(2 * R() - 1); put(gr * Math.sin(p4) * Math.cos(t4), gr * Math.cos(p4), gr * Math.sin(p4) * Math.sin(t4), 2, 1.75, 1.3, .12 + R() * .1); }   // 约 1.3 万个球状星团
    var ex = Math.abs(JD[2]) < .9 ? [-JD[1], JD[0], 0] : [0, -JD[2], JD[1]], el = Math.hypot(ex[0], ex[1], ex[2]); ex = [ex[0] / el, ex[1] / el, ex[2] / el]; var ey = [JD[1] * ex[2] - JD[2] * ex[1], JD[2] * ex[0] - JD[0] * ex[2], JD[0] * ex[1] - JD[1] * ex[0]];
    var KN = [.02, .17, .3, .42, .55, .7, .86];   // HST-1、D、E、F、A、B、C 结(示意位置,占 5,000 光年长度比例)
    for (k = 0; k < N * .06; k++) {   // 喷流:从黑洞视界附近到 5,000 光年,对数分布,宽度随距离张开
      var L = Math.pow(10, -5.5 + R() * 6.2) * JL / 5, w = .00002 + L * .028 * 5 / JL, a = R() * 6.283, rr2 = Math.abs(gs(R)) * w, br = 1;
      var f = L / JL; KN.forEach(function (q) { if (Math.abs(f - q) < .025) br = 2.4; });
      put(JD[0] * L + (ex[0] * Math.cos(a) + ey[0] * Math.sin(a)) * rr2, JD[1] * L + (ex[1] * Math.cos(a) + ey[1] * Math.sin(a)) * rr2, JD[2] * L + (ex[2] * Math.cos(a) + ey[2] * Math.sin(a)) * rr2, .55 * br, .75 * br, 1.3 * br, Math.max(L * .012, .0000015));
    }
    for (k = 0; k < 4000; k++) {   // M87* 阴影外的光环(EHT 2019;环直径约 0.006 光年,南侧更亮)
      var t5 = R() * 6.283, r5 = .0000032 * (1 + gs(R) * .07), rv = [ex[0] * Math.cos(t5) + ey[0] * Math.sin(t5), ex[1] * Math.cos(t5) + ey[1] * Math.sin(t5), ex[2] * Math.cos(t5) + ey[2] * Math.sin(t5)], b5 = 1.2 + 1.3 * Math.max(0, rv[0] * JS[0] + rv[1] * JS[1] + rv[2] * JS[2]);
      put(rv[0] * r5, rv[1] * r5, rv[2] * r5, 2.6 * b5, 1.3 * b5, .45 * b5, .0000007);
    }
    return { P: new Float32Array(P), C: new Float32Array(Cc), S: new Float32Array(S), DP: new Float32Array(0), DS: new Float32Array(0) };
  }
  var RWM = [
    { id: 'G-M87-1', im: '巨椭圆', zh: '室女座星系团中心', t: [0, 0, 0], d: 320, pit: .4, yaw: -.6, q: '为什么它是一个光滑的大球?', q2: '它为什么几乎不再造新恒星?',
      land: 'M87 是室女座星系团中心的巨椭圆星系,质量约是银河系的数倍,由数万亿颗老年恒星组成。它很可能是许多星系一次次并合的产物:旋臂被搅散,气体被中心黑洞加热,新恒星几乎不再诞生。', tag: ['已证实', '并合成因(主流观点)'] },
    { id: 'G-M87-2', im: '喷流', zh: '5,000 光年的等离子体束', t: [JD[0] * 2.5, JD[1] * 2.5, JD[2] * 2.5], d: 7, pit: .2, yaw: .9, q: '黑洞怎样射出 5,000 光年长的喷流?', q2: '为什么哈勃看到它「超光速」?',
      land: '1918 年柯蒂斯首次记下这条「奇特的直线光束」(天球位置角约 290°,指向西北偏西;与视线约成 17°,所以真实长度比投影的 5,000 光年更长)。它是黑洞附近磁场把物质加速到接近光速后射出的等离子体束,沿途一个个亮结。哈勃测到亮结的视速度达光速的 4–6 倍 —— 这是接近光速、几乎朝我们运动造成的视觉效应,并非真的超光速。', tag: ['已证实', '方向按真实天球位置角', '磁场驱动机制(主流观点)'] },
    { id: 'G-M87-3', im: '黑洞 M87*', zh: '人类第一张黑洞照片', t: [0, 0, 0], d: .000022, pit: .1, yaw: .3, q: '黑洞长什么样?', q2: '为什么光环一边更亮?',
      land: '2019 年事件视界望远镜公布 M87* 的照片:约 65 亿倍太阳质量,中间的暗影是光无法逃出的区域,周围光环直径约 0.006 光年(约 400 天文单位)。光环南侧更亮,是绕黑洞高速旋转的物质朝我们运动造成的多普勒增亮。', tag: ['已证实', '光环亮区随年份移动(2018 数据)'] },
    { id: 'G-M87-4', im: '球状星团群', zh: '约 1.3 万个球状星团', t: [0, 0, 0], d: 900, pit: .7, yaw: -1.4, q: '一个星系怎么会有上万个球状星团?', q2: '银河系有多少个?',
      land: 'M87 周围约有 1.2–1.5 万个球状星团,银河系只有约 160 个。它们大多是被 M87 吞并的星系带进来的,像化石一样记录着它的成长史。', tag: ['数量已证实', '吞并来源(主流观点)'] }
  ];

  /* ---------- C2.13b5 M51 涡状星系(局部千光年;盘面 xz,法线 +y;按真实天球方向与倾角放置) ----------
   * 距离约 2,300 万光年;直径约 7.6 万光年;倾角约 22°(近正面),盘面主轴位置角约 170°;旋臂螺距约 20°。
   * 伴星系 NGC 5195 在 M51 北偏东约 4.5′(投影约 3 万光年),位于 M51 盘面后方;北旋臂末端经潮汐桥伸向它。 */
  var M51B = null, N5195 = [0, -6, -30], M51HII = [12, 0, 6], M51DL = [0, 0, 9];
  function set3(a, v) { a[0] = v[0]; a[1] = v[1]; a[2] = v[2]; return a; }
  function m51Basis() {   // 局部 ← 场景:x 主轴、y 盘法线、z = x × y
    var B = skyB(202.4696, 47.1953); if (!B) { M51B = null; return; }
    var pa = 170 * D2R, inc = 22 * D2R, m = [Math.cos(pa) * B.n[0] + Math.sin(pa) * B.ea[0], Math.cos(pa) * B.n[1] + Math.sin(pa) * B.ea[1], Math.cos(pa) * B.n[2] + Math.sin(pa) * B.ea[2]];
    var t = [-B.e[0], -B.e[1], -B.e[2]], mi = [m[1] * t[2] - m[2] * t[1], m[2] * t[0] - m[0] * t[2], m[0] * t[1] - m[1] * t[0]];   // 绕主轴把「朝地球」倾 22° 得盘法线
    var y = [Math.cos(inc) * t[0] + Math.sin(inc) * mi[0], Math.cos(inc) * t[1] + Math.sin(inc) * mi[1], Math.cos(inc) * t[2] + Math.sin(inc) * mi[2]];
    var z = [m[1] * y[2] - m[2] * y[1], m[2] * y[0] - m[0] * y[2], m[0] * y[1] - m[1] * y[0]];
    M51B = { x: m, y: y, z: z };
    function L(v) { return [v[0] * m[0] + v[1] * m[1] + v[2] * m[2], v[0] * y[0] + v[1] * y[1] + v[2] * y[2], v[0] * z[0] + v[1] * z[1] + v[2] * z[2]]; }
    var off = [30 * (.97 * B.n[0] + .24 * B.ea[0]) + 10 * B.e[0], 30 * (.97 * B.n[1] + .24 * B.ea[1]) + 10 * B.e[1], 30 * (.97 * B.n[2] + .24 * B.ea[2]) + 10 * B.e[2]];   // 投影约 3 万光年(北偏东)、后方约 1 万光年
    set3(N5195, L(off));
  }
  function m51Local(v) { if (!M51B) return v; var B = M51B; return [v[0] * B.x[0] + v[1] * B.x[1] + v[2] * B.x[2], v[0] * B.y[0] + v[1] * B.y[1] + v[2] * B.y[2], v[0] * B.z[0] + v[1] * B.z[1] + v[2] * B.z[2]]; }
  function genM51(sf) {
    var R = rnd(5194), P = [], Cc = [], S = [], DP = [], DS = [], k, N = Math.round(240000 * Math.max(sf, .45)),   // 手机至少 45% 档,旋臂才连得起来
      RG2 = 38, b = 1 / Math.tan(20 * D2R);
    function put(x, y, z, r, g, bb, s) { P.push(x, y, z); Cc.push(r, g, bb); S.push(s); }
    function dust(x, y, z, s) { DP.push(x, y, z); DS.push(s); }
    var a0 = Math.atan2(N5195[2], N5195[0]), rN = Math.hypot(N5195[0], N5195[2]), th0 = a0 - Math.log(Math.min(rN, 34) / 3) * b;   // 让一条旋臂末端指向 NGC 5195
    function arm(i, r) { return th0 + i * Math.PI + Math.log(r / 3) * b; }
    // 黄色核球 + 活动核(赛弗特 2 型)
    for (k = 0; k < N * .07; k++) { var rb = Math.abs(gs(R)) * 1.8, t = R() * 6.283, ph = Math.acos(2 * R() - 1); put(rb * Math.sin(ph) * Math.cos(t), rb * Math.cos(ph) * .6, rb * Math.sin(ph) * Math.sin(t), .9, .68 + R() * .06, .34 + R() * .08, .05 + rb * .03 + R() * .04); }
    for (k = 0; k < N * .01; k++) { var rc = Math.abs(gs(R)) * .08; put(gs(R) * rc, gs(R) * rc * .5, gs(R) * rc, .8, .66, .45, .01 + R() * .01); }
    // 双旋臂:臂脊(白)+ 外侧蓝色年轻星团 + 内侧尘埃带 + 粉红 HII 结
    var hii = [];
    for (k = 0; k < N * .4; k++) {
      var i = R() < .5 ? 0 : 1, r = 2.5 + Math.pow(R(), .8) * (RG2 - 2.5), th = arm(i, r), w = .7 + r * .06, off = gs(R) * w, rr = r + off, x = rr * Math.cos(th), z = rr * Math.sin(th), fr = r / RG2, y = gs(R) * (.15 + .25 * fr), blue = off > 0 && R() < .55;
      put(x, y, z, blue ? .55 : .85 - fr * .15, blue ? .7 : .85 - fr * .08, blue ? 1 : .8 + fr * .15, blue ? .08 + R() * .09 : .07 + R() * .07);
      if (R() < .11 && r > 3.5) { var rd = r - w * (.8 + R() * .5); dust(rd * Math.cos(th) + gs(R) * .3, gs(R) * .12, rd * Math.sin(th) + gs(R) * .3, .3 + R() * .35); }   // 尘埃带沿臂内侧
      if (R() < .004 && r > 5) hii.push([x, y, z, .25 + R() * .45]);
    }
    hii.forEach(function (h, j) { var n = Math.round(60 + h[3] * 160); for (var q = 0; q < n; q++) { var p = R() < .7; put(h[0] + gs(R) * h[3], h[1] + gs(R) * h[3] * .3, h[2] + gs(R) * h[3], p ? 1.25 : .7, p ? .45 : .85, p ? .8 : 1.2, .06 + R() * .07); } });
    if (hii.length) { var hb = hii[Math.floor(hii.length * .35)]; set3(M51HII, hb); }
    var rdl = 13, tdl = arm(1, rdl); set3(M51DL, [(rdl - 1) * Math.cos(tdl), 0, (rdl - 1) * Math.sin(tdl)]);
    // 臂间老年盘 + 弥散盘光
    for (k = 0; k < N * .2; k++) { var r2 = Math.min(RG2, -Math.log(1 - R() * .98) * 9 + 1), t2 = R() * 6.283, f2 = r2 / RG2; put(r2 * Math.cos(t2), gs(R) * (.25 + .4 * f2), r2 * Math.sin(t2), .8, .74, .6, .06 + R() * .06); }
    for (k = 0; k < N * .04; k++) { var r3 = Math.min(RG2, -Math.log(1 - R() * .97) * 8), t3 = R() * 6.283, f3 = r3 / RG2; put(r3 * Math.cos(t3), gs(R) * (.5 + 1.2 * (1 - f3)), r3 * Math.sin(t3), .12 - f3 * .04, .11 - f3 * .03, .1, 1.8 - f3 * .9); }
    // 潮汐桥:旋臂末端 → NGC 5195(弧形,偏淡红褐 + 少量蓝)
    var e0 = [34 * Math.cos(arm(0, 34)), 0, 34 * Math.sin(arm(0, 34))];
    for (k = 0; k < N * .045; k++) { var u = R(), bx = e0[0] + (N5195[0] - e0[0]) * u, by = e0[1] + (N5195[1] - e0[1]) * u, bz = e0[2] + (N5195[2] - e0[2]) * u, bend = Math.sin(u * Math.PI) * 5, wb = 1.2 + 2 * Math.sin(u * Math.PI); bx += -Math.sin(a0) * bend; bz += Math.cos(a0) * bend;
      var bl = R() < .25; put(bx + gs(R) * wb, by + gs(R) * wb * .5, bz + gs(R) * wb, bl ? .55 : .8, bl ? .66 : .68, bl ? .95 : .55, .08 + R() * .1); if (R() < .04) dust(bx + gs(R) * wb * .6, by + gs(R) * .3, bz + gs(R) * wb * .6, .3 + R() * .3); }
    // NGC 5195:黄褐色无定形(SB0 pec)+ 尘埃斑 + 外侧潮汐羽
    for (k = 0; k < N * .09; k++) { var su = Math.sqrt(R() * .97), r4 = 4.5 * .25 * su / (1 - su), t4 = R() * 6.283, p4 = Math.acos(2 * R() - 1); put(N5195[0] + r4 * Math.sin(p4) * Math.cos(t4), N5195[1] + r4 * Math.cos(p4) * .7, N5195[2] + r4 * Math.sin(p4) * Math.sin(t4), 1, .76 + R() * .06, .46 + R() * .08, .1 + Math.min(r4, 6) * .03 + R() * .08); }
    for (k = 0; k < N * .002; k++) dust(N5195[0] + gs(R) * 1.6, N5195[1] + gs(R) * .6, N5195[2] + gs(R) * 1.6, .2 + R() * .3);
    for (k = 0; k < N * .015; k++) { var tp2 = Math.pow(R(), .7), ang = a0 + gs(R) * .35, rp = rN + 3 + tp2 * 12; put(rp * Math.cos(ang) + gs(R) * 2, N5195[1] - tp2 * 3 + gs(R) * 1.5, rp * Math.sin(ang) + gs(R) * 2, .55, .45, .36, .2 + R() * .3); }   // 背离 M51 一侧的淡潮汐羽
    return { P: new Float32Array(P), C: new Float32Array(Cc), S: new Float32Array(S), DP: new Float32Array(DP), DS: new Float32Array(DS) };
  }
  var RW51 = [
    { id: 'G-M51-1', im: '核心', zh: '黄色核球与活动核', t: [0, 0, 0], d: 9, pit: .9, yaw: .4, q: '旋涡的中心藏着什么?', q2: '为什么核球是黄色的?',
      land: 'M51 的核球由老年红黄色恒星组成,中心是一个低光度的活动星系核(赛弗特 2 型):超大质量黑洞吞食气体,X 射线与射电里能看到它吹出的小喷流和电离气泡。核球周围几乎不再造新星。', tag: ['已证实', '黑洞质量约百万倍太阳质量量级(测量不确定)'] },
    { id: 'G-M51-2', im: '尘埃带', zh: '沿旋臂内侧的暗带', t: M51DL, d: 16, pit: 1.1, yaw: -.3, q: '旋臂为什么一侧黑一侧亮?', q2: '密度波是什么?',
      land: '哈勃照片里每条旋臂内侧都有一条暗褐色尘埃带。按密度波理论,气体追上旋臂时被压缩,尘埃先在内侧变浓,随后坍缩出新恒星,于是外侧排着蓝色年轻星团和粉红色电离氢区。', tag: ['尘埃带已证实', '密度波理论(主流解释)'] },
    { id: 'G-M51-3', im: 'HII 区与星团', zh: '粉红色恒星工厂', t: M51HII, d: 5, pit: .8, yaw: .9, q: '旋臂上那些粉红色的结是什么?', q2: '蓝色星团有多年轻?',
      land: '粉红色的结是电离氢(HII)区:新生大质量恒星的紫外光把周围氢气照得发出红色 Hα 光。旁边的蓝色星团多在 1,000 万年以内诞生。哈勃在 M51 里编目了数千个这样的年轻星团。', tag: ['已证实'] },
    { id: 'G-M51-4', im: 'NGC 5195', zh: '伴星系与潮汐桥', t: null, d: 70, pit: .6, yaw: -1, q: '一个小星系怎样把旋臂「拉」出来?', q2: 'NGC 5195 在前面还是后面?',
      land: '伴星系 NGC 5195 在 M51 北侧,位于盘面后方,一条旋臂像桥一样伸向它。模拟认为它在约数亿年前穿过 M51 的盘面,潮汐力激发并加强了这对宏象旋臂;M51 的尘埃带在照片里压在 NGC 5195 前面,说明它在后方。', tag: ['相互作用已证实', '穿盘次数与时间(模拟,仍有争议)'] }
  ];
  var GAL = {
    M31: { k: 'M31', zh: '仙女座星系', en: 'ANDROMEDA · M31', vii: 'VII·G-M31', sub: '距太阳约 254 万光年 · 直径约 15 万光年以上 · 倾角 77° · 模拟渲染(3D 粒子,结构按观测)', dist: DIST, rw: RW, home: [190, .5, -.8], ref: 3, lo: .07, lgp: 'M31',
      lab: function () { return [['双核 P1 / P2', [0, 0, 0], '#f0c97a', 0, 3], ['10 kpc 尘埃环', [0, 0, 33], '#7fd6ff', 1, 400], ['NGC 206', NGC206, '#9fc8ff', 2, 150], ['M32', M32, '#f0c97a', 3, 500], ['M110', M110, '#f0c97a', 3, 900], ['巨型南方星流', [-40, -90, -190], '#cdb8ff', 3, 2000], ['银河系 · 254 万年前的光', null, '#f0c97a', -1, 1e5]]; },
      look: { up: 40, fov: 4, h: '从仙女座看向家园', p: '那一小团旋涡就是银河系,太阳系在它的一条旋臂里。你看到的是 <b>约 254 万年前</b> 发出的光 —— 那时地球上人属刚刚出现。', tg: ['方向按真实位置换算', '窄视场放大约 14 倍'] } },
    LMC: { k: 'LMC', zh: '大麦哲伦云', en: 'LARGE MAGELLANIC CLOUD', vii: 'VII·G-LMC', sub: '距太阳约 16.2 万光年 · 盘直径约 3 万光年 · 倾角约 25° · 模拟渲染(3D 粒子,结构按观测)', dist: 161.7, rw: RWL, home: [42, .75, .5], ref: 1.2, lgp: 'mc',
      lab: function () { return [['偏心棒', [-1.2, 0, .4], '#f0c97a', 0, 60], ['蜘蛛星云 30 Dor', D30, '#ff9fd0', 1, 40], ['R136', D30, '#bfe6ff', 1, .3], ['SN 1987A', SN87, '#ffd9a0', 2, 2], ['N11', N11, '#ff9fd0', 0, 40], ['小麦哲伦云', SMCP, '#bfe6ff', 3, 600], ['银河系 · 16 万年前的光', null, '#f0c97a', -1, 1e5]]; },
      look: { up: 6, fov: 55, h: '从大麦哲伦云看银河', p: '银河系横跨半个天空,侧着向你展开。你看到的是 <b>约 16 万年前</b> 发出的光 —— 那时现代人类的祖先还生活在非洲。', tg: ['方向按真实位置换算'] } }
  };
  GAL.M87 = { k: 'M87', zh: 'M87 室女座 A', en: 'VIRGO A · M87', vii: 'VII·G-M87', sub: '距太阳约 5,350 万光年 · 巨椭圆星系 E0–1 · 中心黑洞 M87* 约 65 亿倍太阳质量 · 模拟渲染(3D 粒子)', dist: 53500, ra: 187.706, de: 12.391, rw: RWM, home: [320, .4, -.6], ref: 40, lgp: 'all',
      lab: function () { return [['M87* 黑洞', [0, 0, 0], '#ffb070', 2, .02], ['喷流 · 投影约 5,000 光年', [JD[0] * JL * .6, JD[1] * JL * .6, JD[2] * JL * .6], '#9fc8ff', 1, 120], ['球状星团群', [150, 60, 0], '#f0c97a', 3, 3000], ['银河系 · 5,350 万年前的光', null, '#f0c97a', -1, 1e9]]; },
      look: { up: 20, fov: .35, h: '从室女座星系团看本星系群', p: '那颗几乎看不见的小光点就是银河系。你看到的是 <b>约 5,350 万年前</b> 发出的光 —— 那时恐龙灭绝才过去约 1,300 万年。', tg: ['方向按真实位置换算', '窄视场放大约 150 倍'] } };
  GAL.M51 = { k: 'M51', zh: '涡状星系 M51', en: 'WHIRLPOOL · M51', vii: 'VII·G-M51', sub: '距太阳约 2,300 万光年 · 直径约 7.6 万光年 · 宏象旋涡 + 伴星系 NGC 5195 · 模拟渲染(3D 粒子,外观依哈勃照片)', dist: 23000, ra: 202.4696, de: 47.1953, rw: RW51, home: [120, 1.15, -.5], ref: 8, dB: .6, lgp: 'all',
      lab: function () { return [['活动核', [0, 0, 0], '#f0c97a', 0, 25], ['旋臂尘埃带', M51DL, '#d9b48a', 1, 120], ['HII 区 · 年轻星团', M51HII, '#ff9fd0', 2, 80], ['NGC 5195', N5195, '#f0c97a', 3, 600], ['潮汐桥', [N5195[0] * .8, N5195[1] * .8, N5195[2] * .8], '#cdb8ff', 3, 300], ['银河系 · 2,300 万年前的光', null, '#f0c97a', -1, 1e9]]; },
      look: { up: 20, fov: .5, h: '从 M51 看本星系群', p: '那一小点模糊的光就是银河系。你看到的是 <b>约 2,300 万年前</b> 发出的光 —— 那时地球上还没有人类,猿类刚刚在非洲和欧亚大陆兴起。', tg: ['方向按真实位置换算(RA 13h29m52.7s Dec +47°11′43″)', '窄视场放大约 110 倍'] } };
  var G0 = GAL.M31;
  function genMW(sf) {   // 回望用的远方银河:棒旋 4 臂(小粒子数)
    var R = rnd(4242), P = [], Cc = [], S = [], N = Math.round(40000 * sf), tp = Math.tan(13 * D2R);
    for (var k = 0; k < N; k++) {
      var m = R(), x, y, z, c;
      if (m < .15) { var rb = Math.abs(gs(R)) * 4; x = gs(R) * 3.5; z = gs(R) * 1.2; y = gs(R) * 1; c = [1, .82, .55]; }
      else { var r = Math.min(50, -Math.log(1 - R() * .98) * 12 + 2), t = Math.log(r / 4) / tp + Math.floor(R() * 4) * 1.5708 + gs(R) * .2; x = r * Math.cos(t); z = r * Math.sin(t); y = gs(R) * .4; c = R() < .5 ? [.65, .75, 1] : [.95, .88, .75]; }
      P.push(x, y, z); Cc.push(c[0], c[1], c[2]); S.push(.6 + R() * .6);
    }
    return { P: new Float32Array(P), C: new Float32Array(Cc), S: new Float32Array(S) };
  }

  var VS = 'attribute float aS;attribute vec3 aC;varying vec3 vC;varying float vA;uniform float uK,uB,uM;void main(){vec4 mv=modelViewMatrix*vec4(position,1.0);float s=aS*uK/max(-mv.z,1e-4);vA=clamp(s*.7,0.35,1.0)*uB*clamp(uM/max(s,1.0)*1.5,.25,1.0);gl_PointSize=clamp(s,1.0,uM);vC=aC;gl_Position=projectionMatrix*mv;}';
  var FS = 'precision mediump float;varying vec3 vC;varying float vA;void main(){vec2 d=gl_PointCoord-.5;float r=dot(d,d)*4.0;if(r>1.0)discard;gl_FragColor=vec4(vC*exp(-r*3.0)*vA,1.0);}';
  var FSD = 'precision mediump float;varying vec3 vC;varying float vA;void main(){vec2 d=gl_PointCoord-.5;float r=dot(d,d)*4.0;if(r>1.0)discard;gl_FragColor=vec4(.035,.022,.016,(1.0-r)*(1.0-r)*.5*vA);}';
  function pts(Pp, Cp, Sp, dust, uB, uM) {
    var g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(Pp, 3)); g.setAttribute('aC', new T.BufferAttribute(Cp || new Float32Array(Pp.length), 3)); g.setAttribute('aS', new T.BufferAttribute(Sp, 1));
    var m = new T.ShaderMaterial({ vertexShader: VS, fragmentShader: dust ? FSD : FS, transparent: true, depthWrite: false, depthTest: false, blending: dust ? T.NormalBlending : T.AdditiveBlending, uniforms: { uK: { value: 600 }, uB: { value: uB }, uM: { value: uM } } });
    var o = new T.Points(g, m); o.frustumCulled = false; mats.push(m); if (dust) o.renderOrder = 2; return o;
  }
  function mwDir() {   // 从 M31 看银河的方向(M31 局部坐标)
    try {
      if (G0.ra != null && window.SHXTSG) { var a = SHXTSG.scene(G0.ra, G0.de, 1e9), o = SHXTSG.scene(G0.ra, G0.de, 0), l = Math.hypot(a[0] - o[0], a[1] - o[1], a[2] - o[2]), r0 = [-(a[0] - o[0]) / l, -(a[1] - o[1]) / l, -(a[2] - o[2]) / l]; return G0.k === 'M51' ? m51Local(r0) : r0; }
      var G = window.SHXLG && SHXLG.geo && SHXLG.geo(G0.k); if (!G) return null;
      var q = new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), new T.Vector3(G.n[0], G.n[1], G.n[2])).multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 1, 0), G.spin || 0));
      var qi = q.clone().invert(), v = new T.Vector3(-G.p[0], -G.p[1], -G.p[2]).normalize().applyQuaternion(qi); if (G0.k === 'LMC') { var S2 = SHXLG.geo('SMC'); if (S2) { var w = new T.Vector3(S2.p[0] - G.p[0], S2.p[1] - G.p[1], S2.p[2] - G.p[2]).applyQuaternion(qi); SMCP = [w.x, w.y, w.z]; } } return [v.x, v.y, v.z];
    } catch (e) { return null; }
  }
  function build() {
    T = window.THREE; if (!T || !T.WebGLRenderer) return false;
    try { rd = new T.WebGLRenderer({ canvas: cv, antialias: false, alpha: false, powerPreference: 'high-performance' }); } catch (e) { rd = null; return false; }
    rd.setPixelRatio(Math.min(devicePixelRatio || 1, small() ? 1.25 : 1.5)); rd.setClearColor(0x010208, 1);
    scn = new T.Scene(); cam = new T.PerspectiveCamera(FOV, 1, .001, 1e4); mats = [];
    var sf = small() ? .25 : 1, d = mwDir() || [.3, -.2, .93]; if (G0.k === 'LMC' && !SMCP) SMCP = [-50, -20, -50];
    var b = G0.k === 'LMC' ? genLMC(sf) : G0.k === 'M87' ? genM87(sf) : G0.k === 'M51' ? genM51(sf) : gen(sf), main = pts(b.P, b.C, b.S, false, .5, 26); main.userData.b0 = .5; GMAIN = main; scn.add(main); scn.add(pts(b.DP, null, b.DS, true, G0.dB || 1, 60));
    MWP = [d[0] * G0.dist, d[1] * G0.dist, d[2] * G0.dist];
    if (G0.k === 'M51') { G0.home[1] = Math.max(-1.45, Math.min(1.45, Math.asin(d[1]))); G0.home[2] = Math.atan2(d[0], d[2]); }   // 全貌 = 从地球方向看(与哈勃照片同视角)
    var mw = genMW(sf * (G0.k === 'LMC' ? 1.5 : 1)), mo = pts(mw.P, mw.C, mw.S, false, G0.k === 'LMC' ? .09 : .9, G0.k === 'LMC' ? 20 : 6); mo.position.set(MWP[0], MWP[1], MWP[2]); mo.rotation.set(.9, .3, .4); scn.add(mo);
    var bp = [], bc = [], bs = [], R2 = rnd(77);
    for (var k = 0; k < (small() ? 1500 : 5000); k++) { var th = R2() * 6.283, ph = Math.acos(2 * R2() - 1), rr = 5000 + R2() * 3000; bp.push(rr * Math.sin(ph) * Math.cos(th), rr * Math.cos(ph), rr * Math.sin(ph) * Math.sin(th)); var w = R2(); bc.push(.8 + w * .2, .78, .75 + (1 - w) * .25); bs.push(4 + R2() * 8); }
    scn.add(pts(new Float32Array(bp), new Float32Array(bc), new Float32Array(bs), false, .3, 2.5));
    return true;
  }

  /* ---------- DOM ---------- */
  function css() {
    if (document.getElementById('xgw-css')) return; var s = document.createElement('style'); s.id = 'xgw-css';
    s.textContent = '#xgw{position:fixed;inset:0;z-index:2102;background:#010208;color:#dfe9f7;font:13px/1.5 "Noto Sans SC",system-ui,"PingFang SC","Microsoft YaHei",sans-serif;opacity:0;transition:opacity .6s;touch-action:none;user-select:none;-webkit-user-select:none}#xgw.on{opacity:1}#xgw:not(.on){pointer-events:none}body.xgw-on #shx-badge{display:none!important}' +
      '#xgw canvas{position:absolute;inset:0;width:100%;height:100%;display:block;cursor:grab}#xgw .hd{position:absolute;left:18px;top:14px;right:70px;pointer-events:none}#xgw .hd .k{font-size:11px;letter-spacing:.18em;color:#7fd6ff}#xgw .hd h2{margin:2px 0;font-size:22px;font-weight:600}#xgw .hd h2 small{font-size:12px;color:#9fb3cf;margin-left:8px;letter-spacing:.14em;font-weight:400}#xgw .hd p{margin:0;color:#b8c6dc;font-size:12px}' +
      '#xgw .rd{display:inline-block;margin-top:6px;padding:3px 10px;border:1px solid rgba(127,214,255,.35);border-radius:10px;background:rgba(4,10,24,.6);color:#bfe6ff;font-size:12px}#xgw .x{position:absolute;right:16px;top:12px;width:36px;height:36px;border-radius:50%;border:1px solid rgba(255,255,255,.25);background:rgba(10,16,32,.6);color:#fff;font-size:18px;cursor:pointer;z-index:5}' +
      '#xgw .bar{position:absolute;left:50%;bottom:14px;transform:translateX(-50%);display:flex;gap:6px;flex-wrap:wrap;justify-content:center;max-width:94vw;z-index:4}#xgw .bar button{padding:6px 12px;border-radius:14px;border:1px solid rgba(255,255,255,.22);background:rgba(8,14,30,.72);color:#dfe9f7;font:inherit;font-size:12px;cursor:pointer}#xgw .bar button.on{border-color:#f0c97a;color:#f0c97a}#xgw .bar button.bk{border-color:rgba(184,168,255,.6);color:#d8ccff}' +
      '#xgw .lay{position:absolute;inset:0;pointer-events:none;z-index:3}#xgw .m{position:absolute;left:0;top:0;white-space:nowrap;font-size:12px;pointer-events:auto;cursor:pointer;text-shadow:0 0 4px #000,0 0 8px #000}#xgw .m:before{content:"";display:inline-block;width:6px;height:6px;border-radius:50%;background:currentColor;margin-right:5px;vertical-align:1px;box-shadow:0 0 6px currentColor}#xgw .m small{color:#9fb3cf;margin-left:4px}' +
      '#xgw .cd{position:absolute;left:16px;top:120px;width:310px;max-width:calc(100vw - 32px);max-height:calc(100vh - 200px);overflow:auto;padding:14px 16px;border-radius:14px;border:1px solid rgba(127,214,255,.3);background:rgba(6,12,28,.88);backdrop-filter:blur(6px);z-index:5}#xgw .cd h3{margin:0 0 2px;font-size:17px;padding-right:20px}#xgw .cd .ty{color:#9fb3cf;font-size:12px}#xgw .cd .q{margin:8px 0;padding:6px 10px;border-radius:10px;background:rgba(240,201,122,.1);color:#f6dfa9}' +
      '#xgw .cd .c{position:absolute;right:8px;top:6px;border:0;background:none;color:#fff;font-size:18px;cursor:pointer}#xgw .cd .tg{display:inline-block;margin:2px 4px 0 0;padding:1px 8px;border-radius:8px;font-size:11px;border:1px solid rgba(127,214,255,.4);color:#bfe6ff}#xgw .cd .nt{color:#8ea0bb;font-size:11px;margin-top:6px}' +
      '@media (max-width:760px){#xgw .hd{left:12px;top:10px;right:58px}#xgw .hd .k{font-size:10px;letter-spacing:.1em}#xgw .hd h2{font-size:17px}#xgw .hd h2 small{display:block;margin:0;font-size:10px}#xgw .hd p{font-size:11px;line-height:1.35}#xgw .rd{font-size:11px;padding:2px 8px}#xgw .x{right:10px;top:10px}' +
      '#xgw .bar{left:0;right:0;bottom:calc(8px + env(safe-area-inset-bottom,0px));transform:none;max-width:none;flex-wrap:nowrap;justify-content:flex-start;overflow-x:auto;overflow-y:hidden;padding:0 10px;scrollbar-width:none;-webkit-overflow-scrolling:touch;touch-action:pan-x}#xgw .bar::-webkit-scrollbar{display:none}#xgw .bar{-webkit-mask-image:linear-gradient(90deg,transparent 0,#000 10px,#000 calc(100% - 28px),transparent);mask-image:linear-gradient(90deg,transparent 0,#000 10px,#000 calc(100% - 28px),transparent)}#xgw .bar button{flex:0 0 auto;padding:7px 12px}' +
      '#xgw .cd{top:auto;bottom:calc(54px + env(safe-area-inset-bottom,0px));left:8px;right:8px;width:auto;max-height:38vh;padding:12px 14px;font-size:12px}#xgw .cd h3{font-size:15px;padding-right:22px}#xgw .cd p{margin:6px 0}}';
    document.head.appendChild(s);
  }
  function dom() {
    css(); ov = document.createElement('div'); ov.id = 'xgw'; ov.style.display = 'none'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-label', '星系世界 ' + G0.zh);
    ov.innerHTML = '<canvas></canvas><div class="lay"></div><div class="hd"><div class="k">星域 VII · 星系世界 · ' + G0.vii + '</div><h2>' + G0.zh + '<small>' + G0.en + '</small></h2><p>' + G0.sub + '</p><div class="rd"></div></div>' +
      '<button class="x" type="button" aria-label="返回本星系群">×</button><div class="bar"><button type="button" data-p="all" class="on">全貌</button>' +
      G0.rw.map(function (w, i) { return '<button type="button" data-w="' + i + '">' + w.im + '</button>'; }).join('') + '<button type="button" data-a="mw">回望银河</button><button type="button" data-a="back" class="bk">↩ 回本星系群</button></div>';
    document.body.appendChild(ov); cv = ov.querySelector('canvas'); lay = ov.querySelector('.lay');
    ov.querySelector('.x').onclick = back;
    ov.querySelectorAll('.bar button').forEach(function (b) { b.onclick = function () { mark(b); if (b.dataset.p) { closeCard(); home(); } else if (b.dataset.w) region(+b.dataset.w); else if (b.dataset.a === 'mw') look(); else back(); }; });
    LBL = []; G0.lab().forEach(function (a) {
      var e = document.createElement('div'); e.className = 'm'; e.style.color = a[2]; e.textContent = a[0]; e.onclick = function (ev) { ev.stopPropagation(); if (a[3] >= 0) region(a[3]); else look(); }; lay.appendChild(e); LBL.push({ el: e, p: a[1], max: a[4], mw: a[3] < 0 });
    });
    input();
  }
  function pz() { var a = innerWidth / innerHeight; return a < .8 ? Math.min(1.6, .6 / a) : 1; }   // 竖屏视野窄:拉远
  function home() { go(0, 0, 0, G0.home[0] * pz(), G0.home[1], G0.home[2]); }
  function mark(b) { ov.querySelectorAll('.bar button').forEach(function (x) { x.classList.toggle('on', x === b); }); }
  function closeCard() { if (card) { card.remove(); card = null; } }
  function go(x, y, z, d, pit, yaw, fov) { fovT = fov || 55; if (rm()) { C.tx = x; C.ty = y; C.tz = z; C.d = d; C.pit = pit; C.yaw = yaw; TW = null; return; } TW = { a: [C.tx, C.ty, C.tz, C.d, C.pit, C.yaw], b: [x, y, z, d, pit, yaw], t0: performance.now(), ms: 2000 }; idle = performance.now() + 6000; }
  function region(i) {
    var w = G0.rw[i]; if (!w) return; var wt = w.t || (G0.k === 'M51' ? N5195.map(function (x) { return x * .6; }) : SMCP.map(function (x) { return x * .5; })); closeCard(); var b = ov.querySelector('.bar button[data-w="' + i + '"]'); if (b) mark(b);
    go(wt[0], wt[1], wt[2], w.d * pz(), w.pit, w.yaw);
    card = document.createElement('div'); card.className = 'cd'; card.setAttribute('role', 'dialog'); card.setAttribute('aria-label', '区域世界 ' + w.id);
    card.innerHTML = '<button class="c" type="button" aria-label="关闭">×</button><h3>' + w.id + ' · ' + w.im + '<small style="font-size:12px;color:#9fb3cf;margin-left:6px">' + w.zh + '</small></h3><div class="ty">' + G0.zh + ' · 区域世界</div>' +
      '<div class="q">❓ ' + w.q + '<br><small style="color:#b8c6dc">' + w.q2 + '</small></div><p>' + w.land + '</p>' + w.tag.map(function (t) { return '<span class="tg">' + t + '</span>'; }).join('') +
      '<div class="nt">模拟渲染(3D 粒子),非照片;数据为约数,来源 NASA / ESA / 哈勃 / 斯皮策。</div>';
    ov.appendChild(card); card.querySelector('.c').onclick = closeCard;
  }
  function look() {   // 回望银河:相机放在 M31 盘面上方,望向 254 万光年外的银河(窄视场)
    if (!MWP) return; closeCard(); var b = ov.querySelector('.bar button[data-a="mw"]'); if (b) mark(b);
    var L = G0.look, cp = [0, L.up, 0], v = [cp[0] - MWP[0], cp[1] - MWP[1], cp[2] - MWP[2]], d = Math.hypot(v[0], v[1], v[2]);
    go(MWP[0], MWP[1], MWP[2], d, Math.asin(v[1] / d), Math.atan2(v[0], v[2]), L.fov);
    card = document.createElement('div'); card.className = 'cd'; card.innerHTML = '<button class="c" type="button" aria-label="关闭">×</button><h3>回望银河</h3><div class="ty">' + L.h + '</div><p>' + L.p + '</p>' + L.tg.map(function (t) { return '<span class="tg">' + t + '</span>'; }).join('') + '<div class="nt">银河外形为模拟渲染。</div>';
    ov.appendChild(card); card.querySelector('.c').onclick = closeCard;
  }
  function input() {
    var P = {};
    cv.addEventListener('pointerdown', function (e) { cv.setPointerCapture(e.pointerId); P[e.pointerId] = [e.clientX, e.clientY]; TW = null; idle = performance.now() + 6000; });
    cv.addEventListener('pointermove', function (e) {
      var p = P[e.pointerId]; if (!p) return; var ks = Object.keys(P);
      if (ks.length === 1) { var k = fovT / 55; C.yaw -= (e.clientX - p[0]) * .005 * k; C.pit = Math.max(-1.5, Math.min(1.5, C.pit + (e.clientY - p[1]) * .005 * k)); }
      else if (ks.length === 2) { var o = P[ks[0] == e.pointerId ? ks[1] : ks[0]], d0 = Math.hypot(p[0] - o[0], p[1] - o[1]), d1 = Math.hypot(e.clientX - o[0], e.clientY - o[1]); if (d0 > 0 && d1 > 0) zoom(d0 / d1); }
      P[e.pointerId] = [e.clientX, e.clientY];
    });
    function up(e) { delete P[e.pointerId]; } cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    cv.addEventListener('wheel', function (e) { e.preventDefault(); zoom(Math.exp(e.deltaY * .0012)); idle = performance.now() + 6000; }, { passive: false });
  }
  function zoom(f) { C.d = Math.max(G0.k === 'M87' ? .000008 : .002, Math.min(G0.k === 'M87' ? 3000 : 4000, C.d * f)); }
  function camPos() { var cp = Math.cos(C.pit); return [C.tx + C.d * cp * Math.sin(C.yaw), C.ty + C.d * Math.sin(C.pit), C.tz + C.d * cp * Math.cos(C.yaw)]; }
  function size() { if (!rd) return; rd.setSize(innerWidth, innerHeight, false); cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix(); }
  function ly(k) { if (k < .001) return (k * 6.324e7).toFixed(0) + ' 天文单位'; return k >= 10 ? (k / 10).toFixed(k >= 1000 ? 0 : 1) + ' 万光年' : Math.round(k * 1000).toLocaleString('zh-CN') + ' 光年'; }
  function frame(now) {
    raf = requestAnimationFrame(frame); if (!open_) return; var dt = Math.min(.1, (now - last) / 1000); last = now;
    if (TW) { var k = Math.min(1, (now - TW.t0) / TW.ms), e = k * k * (3 - 2 * k), L = function (a, b) { return Math.exp(Math.log(a) + (Math.log(b) - Math.log(a)) * e); }; C.tx = TW.a[0] + (TW.b[0] - TW.a[0]) * e; C.ty = TW.a[1] + (TW.b[1] - TW.a[1]) * e; C.tz = TW.a[2] + (TW.b[2] - TW.a[2]) * e; C.d = L(TW.a[3], TW.b[3]); C.pit = TW.a[4] + (TW.b[4] - TW.a[4]) * e; var dy = TW.b[5] - TW.a[5]; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); C.yaw = TW.a[5] + dy * e; if (k >= 1) TW = null; }
    else if (!rm() && now > idle && fovT > 10) C.yaw += dt * .02;
    FOV += (fovT - FOV) * Math.min(1, dt * 3); if (Math.abs(FOV - fovT) < .01) FOV = fovT;
    var p = camPos(); cam.fov = FOV; cam.position.set(p[0], p[1], p[2]); cam.near = Math.max(1e-9, Math.min(C.d * .002, 5)); cam.far = Math.max(1e4, C.d * 3);
    var vo = small() && card ? innerHeight * .17 : 0; VO += (vo - VO) * Math.min(1, dt * 4); if (VO > .5) cam.setViewOffset(innerWidth, innerHeight, 0, Math.round(VO), innerWidth, innerHeight); else if (cam.view && cam.view.enabled) cam.clearViewOffset();   // C2.13b4 手机:卡片在下方时把目标上移
    cam.updateProjectionMatrix(); cam.lookAt(C.tx, C.ty, C.tz);
    var kk = innerHeight / (2 * Math.tan(FOV * D2R / 2)) * Math.min(devicePixelRatio || 1, small() ? 1.25 : 1.5); mats.forEach(function (m) { m.uniforms.uK.value = kk; }); if (GMAIN) GMAIN.material.uniforms.uB.value = GMAIN.userData.b0 * Math.max(G0.lo || .12, Math.min(1, Math.sqrt(C.d / G0.ref)));
    rd.render(scn, cam);
    LBL.forEach(function (Lb) {
      var q = Lb.mw ? MWP : Lb.p; if (!q) { Lb.el.style.display = 'none'; return; } var dd = Math.hypot(q[0] - p[0], q[1] - p[1], q[2] - p[2]);
      var v = new T.Vector3(q[0], q[1], q[2]).project(cam); if ((!Lb.mw && dd > Lb.max) || v.z > 1 || v.z < -1) { Lb.el.style.display = 'none'; return; }
      var x = (v.x + 1) / 2 * innerWidth, y = (1 - v.y) / 2 * innerHeight; if (y < 96 || y > innerHeight - 60 || x < 0 || x > innerWidth) { Lb.el.style.display = 'none'; return; }
      Lb.el.style.display = ''; Lb.el.style.transform = 'translate(' + Math.round(x) + 'px,' + Math.round(y) + 'px)';
    });
    var r = ov.querySelector('.rd'), dc = Math.hypot(p[0], p[1], p[2]);
    r.textContent = '视点距' + G0.zh + '中心 ' + ly(dc) + ' · 视野约 ' + ly(C.d * 1.04 * Math.tan(FOV * D2R / 2) / Math.tan(27.5 * D2R)) + (fovT < 10 ? ' · 窄视场' : '');
  }
  function open(o) {
    o = o || {}; if (open_) return true; if (!window.THREE) return false; var ng = GAL[o.k] || GAL.M31; if (ng.k === 'M87') m87Axes(); if (ng.k === 'M51') m51Basis(); if (ng !== G0 || !ov) { if (rd) { try { rd.dispose(); } catch (e) { } rd = null; } if (ov) ov.remove(); G0 = ng; SMCP = null; dom(); }
    if (!rd && !build()) return false;
    LBL.forEach(function (L) { if (L.el.textContent === '小麦哲伦云') L.p = SMCP; });
    open_ = true; ov.style.display = ''; document.body.classList.add('xgw-on'); size(); closeCard();
    C.tx = 0; C.ty = 0; C.tz = 0; C.d = (o.fast || rm() ? G0.home[0] : G0.home[0] * 8) * pz(); C.pit = G0.home[1]; C.yaw = G0.home[2]; FOV = fovT = 55; mark(ov.querySelector('.bar button[data-p]'));
    if (!o.fast) home();
    last = performance.now(); idle = last + 5000; requestAnimationFrame(function () { ov.classList.add('on'); });
    addEventListener('resize', size); raf = requestAnimationFrame(frame);
    try { var u = new URL(location.href); u.searchParams.set('view', 'gw'); u.searchParams.set('g', G0.k); history.replaceState(null, '', u.pathname + u.search + u.hash); } catch (e) { }
    return true;
  }
  function close() {
    if (!open_) return; open_ = false; document.body.classList.remove('xgw-on'); cancelAnimationFrame(raf); removeEventListener('resize', size); closeCard();
    ov.classList.remove('on'); var o = ov; setTimeout(function () { if (!open_) o.style.display = 'none'; }, 600);
    if (rd) { try { rd.dispose(); if (rd.forceContextLoss) rd.forceContextLoss(); } catch (e) { } rd = null; mats = []; scn = null; var nc = cv.cloneNode(false); cv.parentNode.replaceChild(nc, cv); cv = nc; input(); }
    try { var u = new URL(location.href); if (u.searchParams.get('view') === 'gw') { u.searchParams.delete('view'); u.searchParams.delete('g'); history.replaceState(null, '', u.pathname + u.search + u.hash); } } catch (e) { }
  }
  function back() {   // 回本星系群仙女座视角
    var lg = window.SHXLG; if (lg && !lg.isOpen()) lg.open(); close(); if (lg) setTimeout(function () { lg.preset(G0.lgp); }, 80);
  }
  function enter(k) {   // 从本星系群进入:先开本视图再关 L0
    if (!open({ k: k })) return false; var lg = window.SHXLG; if (lg && lg.isOpen()) setTimeout(function () { try { lg.close(true); } catch (e) { } }, rm() ? 200 : 650); return true;
  }
  (function w(n) { if (window.SHXESC) { SHXESC.reg('gw', 114, function () { return open_; }, function () { if (card) closeCard(); else back(); }); return; } if (n < 100) setTimeout(function () { w(n + 1); }, 100); })(0);
  try { if (/[?&]view=gw\b/.test(location.search)) (function w2(n) { if (window.THREE && window.SHXLG && document.body) { setTimeout(function () { var m = /[?&]g=(\w+)/.exec(location.search); open({ fast: 1, k: m && m[1] }); }, 600); return; } if (n < 200) setTimeout(function () { w2(n + 1); }, 100); })(0); } catch (e) { }
  window.SHXGW = { jet: function () { return JD.slice(); }, open: open, enter: enter, close: close, back: back, isOpen: function () { return open_; }, region: function (i) { if (open_) region(i); return card ? card.textContent : ''; }, look: function () { if (open_) look(); }, all: function () { if (open_) { closeCard(); home(); } }, cur: function () { return G0.k; }, mw: function () { return MWP; }, worlds: function () { return G0.rw.map(function (w) { return w.id + ' ' + w.im; }); } };
})();
