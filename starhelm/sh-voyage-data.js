/* 天枢 Starhelm · sh-voyage-data.js(M1.5)
 * 星际航行的数据:八个星域(七星域 + 猜想外圈)、九种引擎(按科学可信度分级)、随船 AI「星璃」台词。
 * 距离与速度均为公开天文常数/公开任务数据的取整值,只用于科普演示。 */
(function () {
  'use strict';
  var SH = (window.SH = window.SH || {});
  var LY = 9.4607e12;          // 1 光年 = 9.4607 万亿 km
  var AU = 1.496e8;            // 1 天文单位(km)
  var C = 299792.458;          // 光速 km/s

  var V = (SH.voyData = { LY: LY, AU: AU, C: C });

  /* status:open = 已测绘(可互动) / uncharted = 未测绘星域(只有景象) / conjecture = 猜想 */
  V.sectors = [
    { id: 'home',   n: 'I',   zh: '家园',       en: 'HOME',        star: '天枢', status: 'open',
      km: 400, label: '近地轨道 · 离地 400 km', scale: '地表 → 静止轨道 3.6 万 km',
      blurb: '地球、季节、地震、卫星与空间站。我们出发的地方。' },
    { id: 'moon',   n: 'II',  zh: '日与月',     en: 'SUN & MOON',  star: '天璇', status: 'open',
      km: 384400, label: '月球 · 38.4 万 km', scale: '38 万 km → 8 光分',
      blurb: '月相、日月食、潮汐实验室和太阳活动观测台已开放。' },
    { id: 'planets', n: 'III', zh: '行星世界',  en: 'PLANETS',     star: '天玑', status: 'uncharted',
      km: 5.2 * AU, label: '木星 · 约 5.2 AU', scale: '→ 海王星 30 AU(约 4 光时)',
      blurb: '八大行星和它们的卫星,以及飞向它们的探测器。' },
    { id: 'edge',   n: 'IV',  zh: '太阳系边疆', en: 'FRONTIER',    star: '天权', status: 'uncharted',
      km: 170 * AU, label: '旅行者 1 号附近 · 约 170 AU', scale: '柯伊伯带 → 奥尔特云',
      blurb: '冰冷的小天体、彗星的故乡,太阳风吹到尽头的地方。' },
    { id: 'stars',  n: 'V',   zh: '群星',       en: 'STARS',       star: '玉衡', status: 'uncharted',
      km: 4.24 * LY, label: '比邻星 · 4.24 光年', scale: '4.2 光年 → 数千光年',
      blurb: '恒星的诞生与死亡、星云、系外行星。' },
    { id: 'galaxy', n: 'VI',  zh: '银河',       en: 'MILKY WAY',   star: '开阳', status: 'uncharted',
      km: 26000 * LY, label: '银河系中心 · 约 2.6 万光年', scale: '银河直径约 10 万光年',
      blurb: '旋臂、银心黑洞,和太阳在银河中的位置。' },
    { id: 'cosmos', n: 'VII', zh: '宇宙',       en: 'COSMOS',      star: '摇光', status: 'uncharted',
      km: 2.5e6 * LY, label: '仙女座星系 · 约 250 万光年', scale: '→ 可观测宇宙边缘 约 465 亿光年',
      blurb: '星系团、宇宙网、微波背景辐射,一直到大爆炸。' },
    { id: 'outer',  n: '∞',   zh: '猜想',       en: 'CONJECTURE',  star: '', status: 'conjecture',
      km: Infinity, label: '可观测宇宙之外', scale: '光也永远到不了的地方',
      blurb: '暗物质、暗能量、暴胀、宇宙的结局、多重宇宙。这里只能用「想」去抵达。' }
  ];
  V.byId = function (id) { for (var i = 0; i < V.sectors.length; i++) if (V.sectors[i].id === id) return V.sectors[i]; return null; };

  /* tier:实测(已经飞过)/ 推断(物理允许、工程未实现)/ 猜想(理论推演、未被证实)
   * model:
   *   v       —— 平均速度 km/s(时间 = 距离 / 速度)
   *   accel   —— 恒定加速度 g,前半程加速、后半程减速(相对论公式,算飞船时间与地球时间)
   *   warp    —— 曲率:超光速倍数由推力决定(10^0 ~ 10^7 倍光速)
   *   gate    —— 虫洞:穿越时间与距离无关
   *   none    —— 思想实验:到不了
   * ctrl:hold 长按点火 / slider 拨动参数后启动 / timing 在绿区按下 / align 转动对准 */
  V.engines = [
    { id: 'chem', zh: '化学火箭', en: 'CHEMICAL', tier: '实测', icon: '🔥', model: 'v', v: 1.5, vFar: 15, ctrl: 'hold',
      fit: ['home', 'moon'], fact: '燃料燃烧向后喷气。进入轨道需约 7.8 km/s;阿波罗飞到月球用了约 3 天。',
      how: '长按「点火」,等推力条充满。' },
    { id: 'ion', zh: '离子电推进', en: 'ION', tier: '实测', icon: '💠', model: 'v', v: 40, ctrl: 'slider',
      fit: ['moon', 'planets'], fact: '用电场把离子喷出去。推力只有一张纸的重量,但能连续开好几年,越飞越快。',
      how: '拨动「电功率」,再按「启动」。' },
    { id: 'assist', zh: '引力弹射', en: 'GRAVITY ASSIST', tier: '实测', icon: '🪐', model: 'v', v: 17, ctrl: 'timing',
      fit: ['planets', 'edge'], fact: '从行星身边掠过,借它的引力加速。旅行者 1 号靠它飞出太阳系,现在每秒约 17 km。',
      how: '光标扫过时,在绿色「借力窗口」里按下。' },
    { id: 'sail', zh: '太阳帆', en: 'SOLAR SAIL', tier: '实测', icon: '⛵', model: 'v', v: 50, ctrl: 'align',
      fit: ['planets', 'edge'], fact: '阳光的光子会推东西。2010 年,一艘太阳帆飞船第一次在太空里展开并被阳光推动。',
      how: '转动帆面,让它正对太阳。' },
    { id: 'fusion', zh: '核聚变推进', en: 'FUSION', tier: '推断', icon: '☀', model: 'v', v: 0.1 * C, ctrl: 'timing',
      fit: ['edge', 'stars'], fact: '像太阳一样把氢聚变成氦。物理上可行,但还没人造出能上天的聚变发动机。设想速度约 10% 光速。',
      how: '等等离子体稳定,在绿区按下「约束」。' },
    { id: 'laser', zh: '激光光帆', en: 'LASER SAIL', tier: '推断', icon: '✦', model: 'v', v: 0.2 * C, ctrl: 'hold',
      fit: ['stars'], fact: '地面激光阵列推动只有几克重的光帆,设想速度约 20% 光速,约 20 年到比邻星。仍在研究中。',
      how: '长按「充能」,让激光阵列满功率。' },
    { id: 'rel', zh: '近光速航行', en: 'RELATIVISTIC', tier: '推断', icon: '⚡', model: 'accel', ctrl: 'slider',
      fit: ['stars', 'galaxy'], fact: '一直以 1g 加速。速度接近光速时时间会变慢:船上过几十年,地球上已经过了几万年。相对论允许,但需要的能量远超人类现有能力。',
      how: '选择「加速度」(g),再按「启动」。' },
    { id: 'warp', zh: '曲率驱动', en: 'WARP', tier: '猜想', icon: '◎', model: 'warp', ctrl: 'hold',
      fit: ['galaxy', 'cosmos'], fact: '让飞船前方的空间收缩、后方膨胀,飞船本身不动。广义相对论的方程允许,但需要一种从未被发现的「负能量」。',
      how: '长按「负能量充能」,再跃迁。' },
    { id: 'gate', zh: '虫洞', en: 'WORMHOLE', tier: '猜想', icon: '🌀', model: 'gate', ctrl: 'align',
      fit: ['cosmos'], fact: '把两处遥远的时空直接连起来的「捷径」。是广义相对论的一个数学解,从未在自然界发现过。',
      how: '转动坐标环,对准目标。' },
    { id: 'mind', zh: '思想实验', en: 'THOUGHT', tier: '猜想', icon: '💭', model: 'none', ctrl: 'hold',
      fit: ['outer'], fact: '宇宙在加速膨胀,可观测宇宙之外的地方,连光都永远追不上。去那里,只能靠想。',
      how: '长按,闭上眼睛想一想。' }
  ];
  V.engine = function (id) { for (var i = 0; i < V.engines.length; i++) if (V.engines[i].id === id) return V.engines[i]; return null; };

  /* ---------------- 航行计算 ---------------- */
  // 返回 { earthS, shipS, vmax(km/s), reach:false? }
  V.travel = function (eng, km, p) {
    var yr = 365.25 * 86400;
    if (!isFinite(km) || eng.model === 'none') return { reach: eng.model === 'none' && !isFinite(km), earthS: Infinity, shipS: Infinity, vmax: 0, thought: true };
    if (eng.model === 'v') {
      var v = eng.v; if (eng.id === 'chem' && km > 1e6) v = eng.vFar;
      if (eng.id === 'ion') v = eng.v * (0.4 + 0.6 * (p == null ? 1 : p));
      var t = km / v; var g = 1 / Math.sqrt(1 - Math.min(0.999999, (v / C) * (v / C)));
      return { earthS: t, shipS: t / g, vmax: v };
    }
    if (eng.model === 'accel') {
      var a = 9.81e-3 * (p || 1);                       // km/s²
      var half = km / 2, c = C;
      var tauHalf = (c / a) * acosh(1 + a * half / (c * c));
      var tHalf = (c / a) * Math.sinh(a * tauHalf / c);
      var gam = 1 + a * half / (c * c);
      return { earthS: 2 * tHalf, shipS: 2 * tauHalf, vmax: c * Math.sqrt(1 - 1 / (gam * gam)), gamma: gam };
    }
    if (eng.model === 'warp') { var k = Math.pow(10, p == null ? 6 : p); var tw = km / (C * k); return { earthS: tw, shipS: tw, vmax: C * k, warp: k }; }
    if (eng.model === 'gate') return { earthS: 600, shipS: 600, vmax: 0, gate: true };
    return { earthS: Infinity, shipS: Infinity, vmax: 0 };
  };
  function acosh(x) { return Math.log(x + Math.sqrt(x * x - 1)); }

  V.fmtTime = function (s) {
    if (!isFinite(s)) return '永远';
    var yr = 365.25 * 86400;
    if (s < 90) return Math.round(s) + ' 秒';
    if (s < 5400) return Math.round(s / 60) + ' 分钟';
    if (s < 172800) return (s / 3600).toFixed(s < 36000 ? 1 : 0) + ' 小时';
    if (s < yr * 2) return Math.round(s / 86400) + ' 天';
    var y = s / yr;
    if (y < 100) return y.toFixed(y < 10 ? 1 : 0) + ' 年';
    if (y < 1e4) return Math.round(y).toLocaleString('zh-CN') + ' 年';
    if (y < 1e8) return (y / 1e4).toFixed(y < 1e5 ? 1 : 0) + ' 万年';
    return (y / 1e8).toFixed(y < 1e9 ? 1 : 0) + ' 亿年';
  };
  V.fmtDist = function (km) {
    if (!isFinite(km)) return '∞';
    if (km < 1e5) return Math.round(km).toLocaleString('zh-CN') + ' km';
    if (km < 1e8) return (km / 1e4).toFixed(1) + ' 万 km';
    if (km < 0.05 * LY) return (km / AU).toFixed(km < 10 * AU ? 2 : 0) + ' AU';
    var ly = km / LY;
    if (ly < 1e4) return ly.toFixed(ly < 10 ? 2 : 0) + ' 光年';
    if (ly < 1e8) return (ly / 1e4).toFixed(1) + ' 万光年';
    return (ly / 1e8).toFixed(1) + ' 亿光年';
  };
  V.fmtSpeed = function (v) {
    if (v >= C * 1.0001) { var k = v / C; return (k >= 1e4 ? k.toExponential(0).replace('e+', '×10^') : Math.round(k)) + ' 倍光速'; }
    if (v > 0.01 * C) return (v / C * 100).toFixed(v > 0.99 * C ? 4 : 1) + '% 光速';
    return v.toFixed(v < 10 ? 1 : 0) + ' km/s';
  };

  /* ---------------- 星璃台词(脚本式,不接大模型) ----------------
   * 表情:neutral / joy / fun / sorrow / angry / surprised(用 joy+o 口型模拟)/ think(歪头) */
  V.lines = {
    hello: [
      ['joy', '船长你好!我是弦穹号的随船智能,星璃。叫我璃璃也可以~'],
      ['fun', '我的任务:陪你从地球一直飞到可观测宇宙的边上。'],
      ['neutral', '先打开航图,选一个目的地吧。']
    ],
    back: [['joy', '欢迎回舰,船长!今天想去哪里?']],
    pickEngine: ['think', '目标「{to}」,距离 {dist}。你觉得该用哪台引擎?'],
    guessQ: ['think', '先来猜一猜:用「{eng}」飞过去,大约要多久?'],
    guessRight: ['joy', '答对啦!我就知道船长算得准。'],
    guessWrong: ['fun', '差一点~实际是 {t}。'],
    tooSlow: ['sorrow', '用「{eng}」要飞 {t}……船长,我们的零食撑不到那时候。要不要换一台引擎?'],
    tooFastNote: ['think', '注意:「{eng}」属于「{tier}」。接下来的航行建立在尚未证实的理论上。'],
    fitOk: ['joy', '这台引擎很合适!{how}'],
    goAnyway: ['fun', '好吧,演示模式会帮我们快进。{how}'],
    ignite: ['joy', '点火成功!'],
    cruise: ['neutral', '巡航中。真实需要 {t},本次演示快进了 {x} 倍。'],
    relNote: ['surprised', '看!船上只过了 {ship},地球上已经过了 {earth}。这就是时间膨胀。'],
    arriveOpen: ['joy', '抵达「{to}」!{star}向导在这里等你。'],
    arriveUncharted: ['neutral', '抵达「{to}」。这片星域尚未测绘,航图数据还在整理,我们先远远看一看。'],
    arriveOuter: ['think', '我们到不了这里,但可以想。这一圈全部是「猜想」,科学家还在争论。'],
    idle: [
      ['fun', '船长,你知道吗?你现在看到的星光,有的出发时恐龙还在地球上。'],
      ['think', '如果宇宙没有边,那「边缘」指的是什么呢?'],
      ['joy', '我刚刚数了数窗外的星星……数不过来!'],
      ['neutral', '戳我一下我也不会掉线的~']
    ],
    poke: [['fun', '诶嘿,被发现了。'], ['joy', '我在!'], ['surprised', '哇,吓我一跳。'], ['think', '船长有什么吩咐?']]
  };

  V.TIER_COLOR = { '实测': '#7fe3c4', '推断': '#ffd27a', '猜想': '#c9a6ff' };
  V.STATUS_ZH = { open: '已测绘', uncharted: '未测绘星域', conjecture: '猜想' };
})();
