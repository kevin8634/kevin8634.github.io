/* 天枢 Starhelm 2.0 · C2.12b 星域 VI 十大银河世界 + 麦哲伦门(SHXGW)
 * 依据《天枢 银河与宇宙世界层总体设计 v1.0》第 04 节(世界表、世界构成卡)与图 A;王磊 10-30 13:53 定:「意象名 · 天文名」双名、自由探索(信标只收集)。
 * - 锚点:有真实天体的用其赤经赤纬 + 距离换算(天鹅座 X-1、鹰状星云、仙后座 A、韦斯特隆德 1、半人马座 ω、大麦哲伦云);
 *   中央棒 / 外盘 / 远端没有单一天体,用 TSG 极坐标示意锚点(卡片注明「示意锚点」)。
 * - 边界:在 TSG 极坐标 (扇区角 φ, 环带半径 r) 平面上用轴对齐多边形划出,互不重叠;家园 = 以太阳为心半径 3,000 光年;
 *   核区 C 层分银心(< 1,500 光年)与中央棒(1,500–5,000 光年);H 晕层归 VI-9;距银心 ≥ 15 万光年归麦哲伦门。
 *   设计稿只给锚点和地址,未画边界线 —— 这里的边界为本窗口按锚点地址与旋臂走向划定的保守方案(待王磊过目)。
 * - 世界内「信标站 / 跃迁」属 C2.12c;本批只给世界卡与边界。
 */
(function () {
  'use strict';
  var T = window.SHXTSG; if (!T) return;
  var D2R = Math.PI / 180;
  function polar(r, f, z) { return [r * Math.cos(f * D2R), r * Math.sin(f * D2R), z || 0]; }
  function hms(h, m, s) { return (h + m / 60 + s / 3600) * 15; }
  function dms(d, m, s) { var g = d < 0 ? -1 : 1; return g * (Math.abs(d) + m / 60 + s / 3600); }
  function rect(f1, f2, r1, r2) { return [[f1, r1], [f2, r1], [f2, r2], [f1, r2]]; }
  // o: [中文, SHXGX 键 | null]
  var W = [
    { id: 'VI-1', im: '家园', zh: '本地泡与猎户臂', tag: ['起点', '已有资源最多'], dist: '0(你在这里)', anc: T.sun, an: '太阳系',
      q: '我们的邻居是谁?', q2: '为什么太阳周围这么空?',
      land: '直径约 1,000 光年的低密度气泡,泡壁上是古尔德带年轻星协;猎户臂是一条短「支臂」。星域 V 群星(太阳周围 100 光年)就是这里的 L3–L4。',
      o: [['太阳系', 'sun'], ['猎户座大星云', 'M42'], ['昴星团', 'M45'], ['船帆座脉冲星', 'Vela PSR'], ['杰敏卡', 'Geminga'], ['盖亚 BH1', 'Gaia BH1'], ['RX J1856', 'RX J1856']],
      br: '旅行者 1 号 → 土卫六星桥已通;规划 VI-1 ↔ 地球星空(1.0)。', reg: { c: [T.R0, 0], rad: 3000 } },
    { id: 'VI-2', im: '天鹅座裂谷', zh: '天鹅座方向', tag: ['黑洞'], dist: '约 7,200 光年', anc: T.fromEq(hms(19, 58, 21.68), dms(35, 12, 5.8), 7240), an: '天鹅座 X-1',
      q: '黑洞怎么「吃」星?',
      land: '夏夜银河在天鹅座被一条暗尘带(天鹅座大裂缝)劈成两股;尘带后面是恒星形成区与 X 射线双星。',
      o: [['天鹅座 X-1', 'Cyg X-1'], ['北美洲星云', 'NGC 7000'], ['新月星云', null], ['面纱星云', null]], reg: { p: rect(7, 24, 22000, 27500) } },
    { id: 'VI-3', im: '星云长廊', zh: '人马-船底臂', tag: ['最震撼', '恒星诞生'], dist: '4,000–7,500 光年', anc: T.fromEq(274.7007, -13.8072, 7000), an: '鹰状星云',
      q: '恒星在哪里出生?', q2: '一团冷气体怎么变成一颗恒星?',
      land: '旋臂内侧暗尘带 + 外侧粉红电离氢区串珠,体积星云最密的区段。可在星云里切换可见光 / 红外。',
      o: [['鹰状星云', 'M16'], ['礁湖星云', 'M8'], ['三叶星云', 'M20'], ['船底座星云与海山二', 'NGC 3372']],
      reg: { p: [[-30, 19000], [7, 19000], [7, 23500], [-8, 23500], [-8, 27000], [-30, 27000]] } },
    { id: 'VI-4', im: '恒星墓园', zh: '英仙臂', tag: ['死亡'], dist: '6,500–11,000 光年', anc: T.fromEq(350.85, 58.815, 11000), an: '仙后座 A',
      q: '恒星怎么死去?',
      land: '银河外侧的英仙臂:超新星遗迹、脉冲星和年轻星团并存。',
      o: [['蟹状星云(1054 年宋代记载)', 'M1'], ['仙后座 A', 'Cas A'], ['英仙座双星团', 'h Per']],
      br: '可连中华古代天象记录(历史 / 文化世界)。', reg: { p: rect(-15, 30, 30000, 37000) } },
    { id: 'VI-5', im: '巨星工厂', zh: '盾牌-半人马臂', tag: ['巨星'], dist: '约 1.3 万光年', anc: T.fromEq(251.7667, -45.8514, 13000), an: '韦斯特隆德 1',
      q: '最大的恒星有多大?',
      land: '盾牌-半人马臂的内段,银河系里质量最大的年轻星团与红超巨星集中在这里。',
      o: [['韦斯特隆德 1', 'Wd 1'], ['盾牌座 UY', null], ['磁星 SGR 1806−20', 'SGR 1806']], reg: { p: rect(-60, -8, 9000, 19000) } },
    { id: 'VI-6', im: '中央棒', zh: '三千秒差距臂', tag: ['结构'], dist: '约 2.3 万光年', anc: polar(4200, 32), an: '长棒近端(示意锚点)',
      q: '银河为什么是「棒旋」?',
      land: '长约 1.7 万光年的中央棒(与日心-银心连线约 27°)、核盘,棒的两端连着近 / 远三千秒差距臂。',
      o: [['长棒', null], ['核盘', null], ['近 / 远三千秒差距臂', null]], reg: { ring: [1500, 5000] } },
    { id: 'VI-7', im: '银心', zh: '人马座 A*', tag: ['高潮', '黑洞'], dist: '26,996 光年', anc: [0, 0, 0], an: '人马座 A*',
      q: '银河中心藏着什么?', q2: '我们怎么知道那里有一个看不见的黑洞?—— 看 S2 星的轨道(2020 诺贝尔奖)。',
      land: '核星团(每立方光年上百颗星)、环核分子环、射电丝、费米气泡;人马座 A* 约 430 万太阳质量(EHT 2022 照片),S2 星周期约 16 年。',
      o: [['人马座 A*', 'Sgr A*'], ['S2 星轨道', null], ['核星团', null], ['费米气泡', null]], reg: { ring: [0, 1500] } },
    { id: 'VI-8', im: '外盘边疆', zh: '矩尺-外臂', tag: ['边界'], dist: '约 2.6 万光年', anc: polar(47000, 27), an: '外盘(示意锚点)',
      q: '银河的边在哪里?',
      land: '恒星越来越稀,气体盘向上下翘曲(外盘翘曲),远外臂上仍有零星电离氢区。',
      o: [['外盘翘曲', null], ['稀疏恒星', null], ['远外臂电离氢区', null]], reg: { p: rect(-20, 40, 42000, 56000) } },
    { id: 'VI-9', im: '银晕', zh: '球状星团群', tag: ['时间考古'], dist: '1.5–2.2 万光年', anc: T.fromEq(201.6912, -47.4769, 17090), an: '半人马座 ω',
      q: '银河里最老的星在哪?', q2: '银河是怎么一口一口「吃」小星系长大的?',
      land: '银盘之外的稀疏球形空间(盘面上下 1,500 光年以外),约 150 个球状星团,恒星流像幽灵丝带。',
      o: [['半人马座 ω', 'NGC 5139'], ['武仙座 M13(1974 阿雷西博信息方向)', 'M13'], ['杜鹃座 47', 'NGC 104'], ['人马矮星系星流', null]], reg: { halo: 1 } },
    { id: 'VI-10', im: '远端', zh: '隐带之后', tag: ['未知', '科学诚实'], dist: '约 5.4 万光年', anc: polar(27000, 195), an: '远侧旋臂(示意锚点)',
      q: '看不见的那一半银河长什么样?', q2: '看不见的东西,科学家怎么画地图?',
      land: '可见光被银心尘埃完全挡住;以红外 / 射电数据重建,半透明虚线表示「推测旋臂」(重建 · 不确定)。',
      o: [['以红外 / 射电重建的远侧旋臂', null]], reg: { p: rect(160, 220, 18000, 40000) } },
    { id: 'GATE', im: '麦哲伦门', zh: '通往星域 VII', tag: ['门槛'], dist: '16–20 万光年', anc: T.fromEq(80.8938, -69.7561, 161700), an: '大麦哲伦云',
      q: '银河有没有「卫星」?',
      land: '银晕外缘(距银心约 15 万光年以外)。虫洞门与星域 VII 将在 C2.13a 打通。',
      o: [['大麦哲伦云', 'LMC'], ['小麦哲伦云', 'NGC 292'], ['麦哲伦流', null]], reg: { gate: 150000 } }
  ];
  var BY = {}; W.forEach(function (w) { BY[w.id] = w; w.a = T.addr(w.anc); w.name = w.im + ' · ' + w.zh; w.oc = w.o.length; });
  // 设计稿世界表里列出的天体 → 世界(优先于几何判断;如磁星 SGR 1806−20 实际在银心背后,设计稿归 VI-5)
  var OW = {}; W.forEach(function (w) { w.o.forEach(function (o) { if (o[1]) OW[o[1]] = w.id; }); });
  function inPoly(P, f, r) {
    for (var k = -1; k <= 1; k++) {
      var x = f + k * 360, c = false;
      for (var i = 0, j = P.length - 1; i < P.length; j = i++) { var a = P[i], b = P[j]; if ((a[1] > r) !== (b[1] > r) && x < (b[0] - a[0]) * (r - a[1]) / (b[1] - a[1]) + a[0]) c = !c; }
      if (c) return true;
    }
    return false;
  }
  function at(t) {   // TSG 坐标 → 世界(无则 null:世界之间的「航道空域」)
    var a = T.addr(t);
    if (a.rs >= 150000) return BY.GATE;
    if (a.L === 'C') return a.rs < 1500 ? BY['VI-7'] : BY['VI-6'];
    if (a.L === 'H') return BY['VI-9'];
    if (Math.hypot(t[0] - T.R0, t[1]) < 3000) return BY['VI-1'];
    var f = a.phi > 180 ? a.phi - 360 : a.phi;
    for (var i = 0; i < W.length; i++) { var w = W[i]; if (w.reg.p && inPoly(w.reg.p, f, a.r)) return w; }
    return null;
  }
  function ofKey(k, t) { return OW[k] ? BY[OW[k]] : t ? at(t) : null; }
  // 边界折线(TSG 盘面 [X, Y] 点列,闭合);halo / gate 返回圆
  function outline(w) {
    var R = w.reg, out = [], i, n;
    function arc(r, f1, f2) { var m = Math.max(2, Math.ceil(Math.abs(f2 - f1) / 2)); for (var k = 0; k <= m; k++) { var f = f1 + (f2 - f1) * k / m; out.push(polar(r, f)); } }
    if (R.c) { for (i = 0; i <= 72; i++) out.push([R.c[0] + R.rad * Math.cos(i * 5 * D2R), R.c[1] + R.rad * Math.sin(i * 5 * D2R), 0]); return [out]; }
    if (R.ring) { var res = []; R.ring.forEach(function (r) { if (r <= 0) return; out = []; arc(r, 0, 360); res.push(out); }); return res; }
    if (R.halo || R.gate) { out = []; arc(R.halo ? 60000 : R.gate, 0, 360); return [out]; }
    var P = R.p; n = P.length;
    for (i = 0; i < n; i++) { var a = P[i], b = P[(i + 1) % n]; if (a[1] === b[1]) arc(a[1], a[0], b[0]); else { out.push(polar(a[1], a[0])); out.push(polar(b[1], b[0])); } }
    return [out];
  }
  window.SHXGW = { list: W, get: function (id) { return BY[id]; }, at: at, ofKey: ofKey, outline: outline, count: W.length };
})();
