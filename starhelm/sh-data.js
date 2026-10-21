/* =====================================================================
 * 天枢 Starhelm · sh-data.js(M1)
 * 七星域、天枢七星向导、知识星、任务目录 —— 纯数据,无逻辑
 * 规则:向导只提问;每关文字不超过一屏;天文无国界(不写竞赛/领先/排名)
 * ===================================================================== */
(function () {
  'use strict';
  var SH = (window.SH = window.SH || {});

  /* 天枢七星:北斗七星从斗口到斗柄;每位向导守一个星域 */
  SH.GUIDES = [
    { id: 'tianshu',  zh: '天枢', en: 'Dubhe',  domain: 1, line: '我是领航员。先别急着往远处看——你脚下这颗星球,正载着你飞。' },
    { id: 'tianxuan', zh: '天璇', en: 'Merak',  domain: 2, line: '天枢和我连成一条线,一直指向北极星。月亮和太阳的秘密,由我来问。' },
    { id: 'tianji',   zh: '天玑', en: 'Phecda', domain: 3, line: '八颗行星,八种完全不同的天气。你想先去哪一颗?' },
    { id: 'tianquan', zh: '天权', en: 'Megrez', domain: 4, line: '我是七星里最暗的一颗,就像太阳系边缘那些看不见的冰冻世界。' },
    { id: 'yuheng',   zh: '玉衡', en: 'Alioth', domain: 5, line: '每一点星光都是一封旧信。猜猜它在路上走了多少年?' },
    { id: 'kaiyang',  zh: '开阳', en: 'Mizar',  domain: 6, line: '仔细看,我身边还有一颗小星「辅」——古人用它测试视力。银河里到处都是这样的伙伴。' },
    { id: 'yaoguang', zh: '摇光', en: 'Alkaid', domain: 7, line: '我在斗柄的最末端,守着最远的光:宇宙开始的地方。' }
  ];

  /* 七星域(由近及远;r = 航图上的对数半径刻度,单位:log10(米)) */
  SH.DOMAINS = [
    { n: 1, zh: '家园',       en: 'Home',            guide: 'tianshu',  scale: 7,  open: true,  blurb: '我在哪、昼夜四季、会动的大地、近地轨道' },
    { n: 2, zh: '日与月',     en: 'Sun & Moon',      guide: 'tianxuan', scale: 9,  open: false, blurb: '月相、潮汐、日月食、太阳活动、极光' },
    { n: 3, zh: '行星世界',   en: 'Planets',         guide: 'tianji',   scale: 12, open: false, blurb: '八大行星、卫星、开普勒定律、探测器' },
    { n: 4, zh: '太阳系边疆', en: 'Outer Frontier',  guide: 'tianquan', scale: 14, open: false, blurb: '小行星、彗星、柯伊伯带、日球层、旅行者号' },
    { n: 5, zh: '群星',       en: 'Stars',           guide: 'yuheng',   scale: 17, open: false, blurb: '光年、恒星一生、系外行星、宜居带' },
    { n: 6, zh: '银河',       en: 'Milky Way',       guide: 'kaiyang',  scale: 21, open: false, blurb: '旋臂、星团、双星、中心黑洞' },
    { n: 7, zh: '宇宙',       en: 'Cosmos',          guide: 'yaoguang', scale: 26, open: false, blurb: '星系、宇宙膨胀、大爆炸、暗物质' }
  ];

  /* 知识星(星域 I + 少量可提前点亮的探索星)
   * by: 'task:关' 通关点亮;'explore:xxx' 探索点亮。bridge:星桥目标(格式待总指挥定,先写自然语言) */
  SH.STARS = [
    { id: 'sh.latlng',     d: 1, zh: '经纬度',           by: 'where:1' },
    { id: 'sh.hemisphere', d: 1, zh: '南北半球',         by: 'where:1' },
    { id: 'sh.daynight',   d: 1, zh: '昼夜与晨昏线',     by: 'where:1' },
    { id: 'sh.magnitude',  d: 1, zh: '数量级',           by: 'where:2', bridge: '星图 Math Atlas · 比例与数量级' },
    { id: 'sh.au',         d: 1, zh: '天文单位',         by: 'where:2' },
    { id: 'sh.lightspeed', d: 1, zh: '光速',             by: 'where:3' },
    { id: 'sh.lightyear',  d: 1, zh: '光年',             by: 'where:3' },
    { id: 'sh.gravity',    d: 1, zh: '万有引力',         by: 'orbit:1', bridge: '宙律 Nomoverse · 引力与轨道' },
    { id: 'sh.curvature',  d: 1, zh: '地球的弧度',       by: 'orbit:1' },
    { id: 'sh.freefall',   d: 1, zh: '轨道=一直在坠落',  by: 'orbit:2' },
    { id: 'sh.v1',         d: 1, zh: '第一宇宙速度',     by: 'orbit:2' },
    { id: 'sh.leo',        d: 1, zh: '近地轨道',         by: 'orbit:3' },
    { id: 'sh.escape',     d: 1, zh: '逃逸速度',         by: 'orbit:3' },
    { id: 'sh.shells',     d: 1, zh: '低轨·中轨·高轨',   by: 'explore:shells' },
    { id: 'sh.pass',       d: 1, zh: '卫星过境',         by: 'explore:pass' },
    { id: 'sh.subsolar',   d: 1, zh: '太阳直射点',       by: 'explore:subsolar' },
    { id: 'sh.seasons',    d: 1, zh: '地轴倾角与四季',   by: 'task:seasons' },
    { id: 'sh.constell',   d: 1, zh: '卫星星座',         by: 'task:sats' },
    { id: 'sh.debris',     d: 1, zh: '太空垃圾',         by: 'task:sats' },
    { id: 'sh.plates',     d: 1, zh: '板块与地震带',     by: 'task:quakes' },
    { id: 'sh.waves',      d: 1, zh: '地震波',           by: 'task:quakes' },
    { id: 'sh.moonphase',  d: 2, zh: '月相',             by: 'explore:moon' }
  ];

  /* 任务目录(星域 I);levels 由各任务脚本注册 */
  SH.TASKS = [
    { id: 'where',   d: 1, q: '此刻,你在宇宙的哪里?', diff: 1, open: true,  bridge: '星图 Math Atlas · 比例与数量级' },
    { id: 'orbit',   d: 1, q: '空间站为什么掉不下来?', diff: 2, open: true,  bridge: '宙律 Nomoverse · 引力与轨道' },
    { id: 'seasons', d: 1, q: '为什么会有四季?',       diff: 1, open: true,  bridge: '生命源码 Life Source · 季节与生物节律' },
    { id: 'sats',    d: 1, q: '天上到底有多少颗卫星?', diff: 2, open: true,  bridge: '奇点前夜 Pre-Singularity · AI 与卫星数据' },
    { id: 'quakes',  d: 1, q: '地震在告诉我们什么?',   diff: 2, open: false, bridge: '元素工坊 Element Forge · 岩石与矿物' }
  ];

  /* 图层卡片上的向导提问(看 → 问) */
  SH.ASK = {
    iss:   { q: '它每秒飞 7.6 公里,却一直没掉下来。是什么在托着它?', task: 'orbit' },
    css:   { q: '天宫和国际空间站飞得几乎一样快。高度差不多的轨道,速度为什么也差不多?', task: 'orbit' },
    hst:   { q: '哈勃在大气层之上看宇宙。为什么望远镜要飞到天上去?', task: null },
    sat:   { q: '你能数出头顶这片天上有多少颗卫星吗?它们会不会撞在一起?', task: 'sats' },
    shell: { q: '导航卫星比星链高近 40 倍。高一点、低一点各有什么好处?', task: null },
    quake: { q: '把一周的地震点连起来,你看到了什么形状?', task: 'quakes' },
    moon:  { q: '月亮今天是这个形状,明天会变胖还是变瘦?', task: null }
  };
})();
