/* 天枢 C2.8a · T7 特殊天体:黑洞 / 中子星 / 脉冲星
 * 五个目标装进深空航点(真实方向与距离,SHXDV.add),飞抵后在驾驶舱里用广义相对论光线追踪实时渲染:
 *   · 史瓦西度规下逐像素积分光线(单位 Rs = 1):事件视界阴影、光子环、背景星空的引力透镜(直接按方向采样星空贴图,背后的星也能被弯过来);
 *   · 吸积盘:薄盘温度剖面 T ∝ r^-3/4 (1-√(r_in/r))^1/4,多普勒增亮 + 引力红移;倾角按观测值;
 *   · 中子星:表面同样参与光线弯曲(能看到超过一半的球面);脉冲星双锥辐射束绕自转轴按真实周期旋转(可慢放)。
 *   追踪球外的光线用弱场偏折公式补齐,保证球边界连续。
 * 读数:距离(km / Rs)、引力时间膨胀、潮汐加速度(2 m 身长)、安全停泊线(15 Rs,自动驾驶与手动推进都不越过)。
 * 颜色为示意色温,不是照片;所有物理量注明来源。 */
(function () {
  'use strict';
  var LY = 9.4607e12, RS1 = 2.95325;   // km;1 倍太阳质量的史瓦西半径(km)
  var G = 6.674e-11, MSUN = 1.989e30;
  function hms(h, m, s) { return (h + m / 60 + s / 3600) * 15; }
  function dms(d, m, s) { var g = d < 0 || Object.is(d, -0) ? -1 : 1; return g * (Math.abs(d) + m / 60 + s / 3600); }
  // k: bh 黑洞 / ns 中子星 / psr 脉冲星;m 质量(太阳);inc 吸积盘(或自转轴)与视线夹角(度);T0 示意色温(K)
  function magSp(t) {   // 磁星:多块热斑缓慢游走、合并、缩小(仿 NASA NICER 对 SGR 1830−0645 的观测;时间大幅压缩)
    var c = (t / 40) % 1, a = Math.sin(c * Math.PI);
    return [[50 + 18 * Math.sin(t / 23), 0 + 40 * Math.sin(t / 31), 14 * (0.6 + 0.4 * a), 1.2], [70 + 14 * Math.sin(t / 19 + 1), 50 - 35 * c, 10 * (0.5 + 0.5 * a), 1.0], [60 + 20 * Math.cos(t / 27), 95 - 70 * c, 8 * (0.4 + 0.6 * a), .9], [130, 200, 25, .25]];
  }
  var EX = {
    'Sgr A*': { k: 'bh', m: 4.297e6, ly: 26996, ra: hms(17, 45, 40.0409), dec: dms(-29, 0, 28.118), inc: 30, disk: [3, 12], T0: 3600, br: .8,
      img: 1, f: 'sgra', fit: 'contain', zoom: .92, phl: '真实照片<small>EHT 射电影像 · 2022</small>', pnote: '。照片为事件视界望远镜 EHT 2022 年发布的真实影像(1.3 mm 射电,多台望远镜组成地球大小的干涉阵),颜色为伪彩,不是可见光',
      zh: '银心黑洞 · 人马座 A*', en: 'Sagittarius A* · Sgr A*', type: '超大质量黑洞 · 银河系中心',
      facts: [['距离', '约 26,996 光年(8,277 秒差距)', '证'], ['质量', '约 430 万倍太阳(4.297×10⁶)', '证'], ['事件视界', '史瓦西半径约 1,270 万 km(约 0.085 AU)', '证'], ['影像', 'EHT 2022 年发布 1.3 mm 射电「光环」', '证'], ['自转', '无量纲自转参数约 0.9', '推']],
      blurb: '银河系中心的超大质量黑洞。质量来自几十年追踪附近恒星(如 S2)的轨道;它目前吃得很少,吸积流暗弱,EHT 在射电波段拍到的是视界外被引力弯曲的发光气体环。',
      cr: '数据:GRAVITY 合作组(质量、距离)。照片:EHT Collaboration / ESO,CC BY 4.0。舷窗画面为广义相对论光线追踪模拟,吸积盘颜色为示意' },
    // C2.9a 星域 VII:M87*(室女座星系团中心巨椭圆星系 M87 的核心黑洞),2019 年人类首张黑洞照片
    'M87*': { k: 'bh', m: 6.5e9, ly: 5.35e7, ra: hms(12, 30, 49.42338), dec: dms(12, 23, 28.0439), inc: 17, disk: [3, 14], T0: 4200, br: .85, lab: '超大质量黑洞', vii: 1,
      img: 1, f: 'm87bh', fit: 'contain', zoom: .92, phl: '真实照片<small>EHT 射电影像 · 2019</small>', pnote: '。照片为事件视界望远镜 EHT 2019 年 4 月发布的人类第一张黑洞照片(1.3 mm 射电,2017 年观测),颜色为伪彩,不是可见光',
      zh: 'M87* · 室女座 A 黑洞', en: 'M87* · Messier 87 black hole', type: '超大质量黑洞 · 星域 VII · 室女座星系团中心',
      facts: [['距离', '约 5,350 万光年(16.4 百万秒差距)', '证'], ['回看时间', '你看到的是约 5,350 万年前发出的光', '证'], ['质量', '约 65 亿倍太阳(6.5×10⁹,EHT 2019)', '证'], ['事件视界', '史瓦西半径约 190 亿 km(约 128 AU,比海王星轨道大三倍多)', '证'], ['喷流', '从核心射出约 5,000 光年长的相对论性喷流', '证']],
      blurb: '这是人类拍下的第一个黑洞。它比银心黑洞重约 1,500 倍,视界大到能装下整个太阳系;正因为又大又相对近,EHT 才能在射电波段分辨出它的阴影和发光环。环下半部更亮,是因为那里的气体朝我们运动,被多普勒效应增亮。',
      cr: '数据:EHT Collaboration 2019(质量、距离)。照片:EHT Collaboration / ESO,CC BY 4.0。舷窗画面为广义相对论光线追踪模拟,吸积盘颜色为示意' },
    'Cyg X-1': { k: 'bh', m: 21.2, ly: 7240, ra: hms(19, 58, 21.67574), dec: dms(35, 12, 5.7845), inc: 27.5, disk: [3, 16], T0: 5e6, br: .9, co: { R: 1.55e7, a: 3.65e7, T: 31000, br: 1.5, ph: 40 },
      zh: '天鹅座 X-1', en: 'Cygnus X-1', type: '恒星级黑洞 · X 射线双星',
      facts: [['距离', '约 7,240 光年(2.22 千秒差距)', '证'], ['质量', '约 21 倍太阳', '证'], ['伴星', '蓝超巨星 HDE 226868,轨道周期约 5.6 天', '证'], ['吸积', '伴星星风被吸入,形成发出 X 射线的吸积盘', '证'], ['历史', '1964 年发现,最早被普遍认定的黑洞', '证']],
      blurb: '黑洞从近旁的蓝超巨星吸走气体,气体盘旋落入时被加热到上千万度,发出强烈 X 射线。盘的一侧朝我们运动,被多普勒效应增亮;视界上方那道弧是盘背面被引力弯过来的像。旁边那颗巨大的蓝色恒星就是伴星 HDE 226868,半径约 22 个太阳,只在 0.24 AU 外,占去舷窗一大片天。',
      cr: '数据:Miller-Jones 等 2021《Science》(距离、质量);盘倾角约 27.5°。舷窗画面为广义相对论光线追踪模拟,X 射线不可见,颜色为示意' },
    'Gaia BH1': { k: 'bh', m: 9.27, ly: 1560, ra: hms(17, 28, 41.09661), dec: dms(-0, 34, 51.5234), inc: 60, disk: null, co: { R: 6.9e5, a: 2.09e8, T: 5850, br: 2.2, ph: 25 },
      zh: '盖亚黑洞 1 号', en: 'Gaia BH1', type: '恒星级黑洞 · 已知最近',
      facts: [['距离', '约 1,560 光年(478 秒差距)', '证'], ['质量', '约 9.3 倍太阳', '证'], ['伴星', '类太阳 G 型星,轨道周期约 185.4 天', '证'], ['状态', '「沉睡」黑洞:没有吸积盘,几乎不发光', '证'], ['发现', '2022 年由盖亚卫星天体测量发现', '证']],
      blurb: '它不吃东西,所以不发光,只能靠引力被发现:盖亚卫星测出伴星在天上画出一个小椭圆,而那个看不见的伴侣有 9 倍太阳质量。舷窗里看到的只有被它弯曲的星空和一圈漆黑的阴影;约 1.4 AU 外那颗黄色亮星就是它的伴星。',
      cr: '数据:El-Badry 等 2023《MNRAS》;Nagarajan 等 2024(质量)。舷窗画面为广义相对论光线追踪模拟' },
    'RX J1856': { P: 7.055, mag: 40, spots: [[40, 0, 30, .18], [150, 190, 25, .14]], an: .2, k: 'ns', m: 1.5, rk: 12.1, ly: 400, ra: hms(18, 56, 35.41), dec: dms(-37, 54, 35.8), inc: 50, T0: 434000, br: 1.3,
      zh: '孤立中子星 RX J1856.5−3754', en: 'RX J1856.5−3754', type: '孤立中子星 · 已知最近',
      facts: [['距离', '约 400 光年', '证'], ['半径', '约 12 km(+1.3/−1.6)', '证'], ['质量', '约 1.5 倍太阳', '推'], ['表面温度', '约 43.4 万 °C(主要发 X 射线)', '证'], ['磁场', '约 10¹³ 高斯;VLT 2016 见真空双折射迹象', '推']],
      blurb: '超新星留下的城市大小的残核,一茶匙物质重约十亿吨。它不是脉冲星,只是靠余热发光。光线在它表面附近被强烈弯曲,所以你能同时看到它超过一半的表面。',
      cr: '数据:Walter 等;Potekhin 2014(半径);Ho 等 2007。舷窗画面为广义相对论光线追踪模拟,表面颜色为示意' },
    'J0030': { k: 'psr', m: 1.34, rk: 12.71, P: 0.004865453, ly: 1060, ra: hms(0, 30, 27.4303), dec: dms(4, 51, 39.707), inc: 140, mag: 128, T0: 3.2e5, br: 1.1, bc: [.1, .16, .32], an: .1, sf: 0.0005, sf0: 1, pa: 1.8, bwd: 18,
      spots: [[128, 0, 4.3, 2.6], [157, 166, 22, 1.5, 147, 166, 19]],   // Riley 等 2019 ST+PST 最佳拟合近似:小圆斑 + 月牙,都在南半球;我们从北半球方向看
      zh: '毫秒脉冲星 J0030+0451', en: 'PSR J0030+0451', type: '毫秒脉冲星 · NICER 首张中子星表面图', lab: '脉冲星',
      facts: [['距离', '约 1,060 光年(325 秒差距)', '证'], ['自转周期', '4.87 毫秒(每秒约 205 圈)', '证'], ['质量 / 半径', '约 1.34 倍太阳、12.7 km(NICER,Riley 等 2019)', '证'], ['热斑', '一个小圆斑 + 一条长月牙,全在南半球,约百万度', '证'], ['磁场', '不是教科书式的对称偶极,而是偏心 / 多极', '推']],
      blurb: '(舷窗从南半球一侧看,和 NASA 的可视化一样;从地球方向看,热斑都挤在下缘。)NASA 的 NICER 望远镜盯着它的 X 射线随自转起伏,反推出了人类第一张中子星表面图:热斑不在南北两极正对,而是一个小圆斑和一条弯弯的月牙,全挤在南半球。舷窗里的热斑位置按这次拟合摆放;其余表面没有测到,这里填了很淡的斑驳底纹;颜色按百万度黑体算,是淡蓝白,而不是 NASA 示意图里的深蓝假色。光线弯曲让你能看到大半个星球。',
      cr: '数据:Riley 等 2019、Miller 等 2019《ApJL》887 L21/L24;NASA SVS 13240 可视化。舷窗画面为广义相对论光线追踪模拟,底色与辐射束为示意' },
    'Vela PSR': { spots: [[50, 0, 3.0, 1.6], [155, 205, 3.0, 1.4], [150, 200, 11, .5, 143, 200, 10]], an: .3, k: 'psr', m: 1.4, rk: 12, P: 0.089328385, ly: 959, ra: hms(8, 35, 20.65525), dec: dms(-45, 10, 35.1545), inc: 63.6, mag: 50, T0: 680000, br: 1.1,
      zh: '船帆座脉冲星', en: 'Vela Pulsar · PSR B0833−45', type: '脉冲星 · 船帆座超新星遗迹',
      facts: [['距离', '约 959 光年(哈勃视差)', '证'], ['自转周期', '89.33 毫秒(每秒约 11.2 圈)', '证'], ['身世', '约 1.1–1.2 万年前的超新星留下', '推'], ['自转突变', '平均约 3 年一次「glitch」突然加速', '证'], ['亮度', '高能伽马射线天空中最亮的持续源', '证']],
      blurb: '磁轴与自转轴不重合,两束辐射像灯塔一样扫过太空,扫到地球时我们就收到一个脉冲。质量与半径按典型中子星取值(约 1.4 倍太阳、12 km)。辐射束本身主要在射电与伽马波段,肉眼看不见,这里用伪彩画出,半宽按周期估算约 18°。表面约 68 万 K,在可见光里是刺眼的蓝白色,两极热斑更亮。',
      cr: '数据:ATNF 脉冲星表(周期);Caraveo 等 2001(距离)。舷窗画面为广义相对论光线追踪模拟,辐射束为伪彩示意;热斑位置无实测,按偏心偶极 + 极旁小尺度多极推测(参照 NICER 对 J0030 的结果)' },
    'Crab PSR': { spots: [[55, 0, 4.9, 1.6], [150, 200, 4.9, 1.4], [146, 196, 14, .5, 138, 196, 13]], an: .3, k: 'psr', m: 1.4, rk: 12, P: 0.0337, ly: 6500, ra: hms(5, 34, 31.94), dec: dms(22, 0, 52.2), inc: 61.3, mag: 55, T0: 1.5e6, br: 1.1, bc: [.7, .85, 1],
      zh: '蟹状星云脉冲星', en: 'Crab Pulsar · PSR B0531+21', type: '脉冲星 · 蟹状星云(M1)中心', lab: '脉冲星',
      facts: [['距离', '约 6,500 光年(约 2 千秒差距,与 M1 相同)', '证'], ['自转周期', '约 33.7 毫秒(每秒约 30 圈)', '证'], ['身世', '1054 年中国宋代记录的「天关客星」超新星留下', '证'], ['能量', '自转变慢释放的能量点亮整个蟹状星云', '证'], ['质量 / 半径', '按典型中子星取约 1.4 倍太阳、12 km', '推']],
      blurb: '它就藏在蟹状星云(M1)正中央:九百多年前爆发的超新星,把恒星核心压成这颗每秒自转约 30 圈的中子星。它在变慢,丢掉的转动能量变成高速粒子风,让整团星云至今仍在发光。辐射束在射电到伽马波段,这里用伪彩画出。',
      cr: '数据:ATNF 脉冲星表 / Jodrell Bank 蟹状脉冲星月历(周期);Trimble 1973、Kaplan 等 2008(距离);《宋会要》客星记录。舷窗画面为广义相对论光线追踪模拟,辐射束为伪彩示意;热斑位置无实测,按偏心偶极 + 极旁小尺度多极推测(参照 NICER 对 J0030 的结果)' },
    'Geminga': { spots: [[40, 0, 1.9, 1.6], [160, 210, 1.9, 1.4], [154, 205, 9, .45, 148, 205, 8]], an: .3, k: 'psr', m: 1.4, rk: 12, P: 0.2371, ly: 815, ra: hms(6, 33, 54.153), dec: dms(17, 46, 12.91), inc: 55, mag: 40, T0: 490000, br: 1.1, bc: [.75, .65, 1],
      zh: '杰敏卡(Geminga)', en: 'Geminga · PSR J0633+1746', type: '脉冲星 · 射电宁静的伽马射线源', lab: '脉冲星',
      facts: [['距离', '约 815 光年(250 秒差距,哈勃视差)', '推'], ['自转周期', '约 237 毫秒(每秒约 4.2 圈)', '证'], ['年龄', '约 34 万年', '推'], ['特点', '几乎没有射电脉冲,主要在 X 射线与伽马射线可见', '证'], ['发现', '1972 年 SAS-2 卫星发现的伽马射线源,1992 年才确认是脉冲星', '证']],
      blurb: '名字来自米兰方言「它不在那儿」:多年来天文学家只看到伽马射线,却找不到对应的天体。它的射电束没有扫过地球,所以几乎「静音」。离我们只有八百多光年,是最近的脉冲星之一,周围还拖着一圈数光年宽的高能粒子晕。',
      cr: '数据:Faherty 等 2007(距离);Bignami & Caraveo 1996;Fermi-LAT(周期)。舷窗画面为广义相对论光线追踪模拟,辐射束为伪彩示意;热斑位置无实测,按偏心偶极 + 极旁小尺度多极推测(参照 NICER 对 J0030 的结果)' },
    'SGR 1806': { spots: magSp, an: .25, k: 'mag', m: 1.4, rk: 12, P: 7.6022, ly: 28400, ra: hms(18, 8, 39.32), dec: dms(-20, 24, 39.5), inc: 50, mag: 35, T0: 7e6, br: 1.2, bc: [1, .55, .78],
      zh: '磁星 SGR 1806−20', en: 'SGR 1806−20 · magnetar', type: '磁星 · 已知磁场最强的天体之一', lab: '磁星',
      facts: [['距离', '约 2.8 万光年(8.7 千秒差距)', '推'], ['自转周期', '约 7.6 秒', '证'], ['磁场', '表面约 2×10¹⁵ 高斯,约为地磁的千万亿倍', '推'], ['巨耀发', '2004 年 12 月 27 日,0.2 秒内放出相当于太阳数十万年的能量,扰动了地球电离层', '证'], ['质量 / 半径', '按典型中子星取约 1.4 倍太阳、12 km', '推']],
      blurb: '磁星是磁场最强的一类中子星。它的磁场强到会撕裂自己的外壳,引发「星震」并喷出伽马射线耀发。2004 年那次巨耀发远在 2.8 万光年外,却仍让地球上的卫星探测器饱和。它没有灯塔式的射电束:舷窗里是一颗约 700 万 K 的蓝白色星体,几块大热斑随 7.6 秒的自转转过来又转过去,还会慢慢游走、合并、缩小——NASA 的 NICER 在另一颗磁星上真的看到过这一幕。',
      cr: '数据:Kaplan 等 2002(Chandra 定位);Tendulkar 等 2012(周期、磁场);Bibby 等 2008(距离);Hurley 等 2005(巨耀发)。舷窗画面为广义相对论光线追踪模拟;多块热斑游走合并仿 NASA NICER 对磁星 SGR 1830−0645 的观测,时间大幅压缩' }
  };
  Object.keys(EX).forEach(function (k) { var e = EX[k]; e.rs = RS1 * e.m; e.rsurf = e.k === 'bh' ? 1 : e.rk / e.rs; e.R = 15 * e.rs; e.rly = e.R / LY; e.exo = e.k; e.n = e.img ? 1 : 0; });

  function bbJS(T) { T = Math.min(40000, Math.max(1000, T)) / 100; var r = T <= 66 ? 1 : Math.min(1, 1.292936 * Math.pow(T - 60, -.1332047)), g = T <= 66 ? Math.min(1, Math.max(0, .3900816 * Math.log(T) - .6318414)) : Math.min(1, 1.1298909 * Math.pow(T - 60, -.0755148)), b = T >= 66 ? 1 : T <= 19 ? 0 : Math.min(1, Math.max(0, .5432068 * Math.log(T - 10) - 1.1962541)); return [r, g, b]; }
  var NOISE = [
    'float h3(vec3 p){p=fract(p*0.3183099+.1);p*=17.0;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}',
    'float n3(vec3 x){vec3 i=floor(x);vec3 f=fract(x);f=f*f*(3.0-2.0*f);',
    ' return mix(mix(mix(h3(i),h3(i+vec3(1,0,0)),f.x),mix(h3(i+vec3(0,1,0)),h3(i+vec3(1,1,0)),f.x),f.y),mix(mix(h3(i+vec3(0,0,1)),h3(i+vec3(1,0,1)),f.x),mix(h3(i+vec3(0,1,1)),h3(i+vec3(1,1,1)),f.x),f.y),f.z);}'
  ].join('\n');
  var VS = 'varying vec2 vN;void main(){vN=position.xy;gl_Position=vec4(position.xy,0.0,1.0);}';
  var FS = [
    'precision highp float;varying vec2 vN;',
    'uniform mat4 uIP,uMW;uniform mat3 uSkyM;uniform vec3 uC,uN,uS,uMg,uTint,uBc,uCo,uCoC;uniform sampler2D tSky;',
    'uniform float uT,uSteps,uRb,uSurf,uK,uRin,uRo,uT0,uBr,uHas,uH,uLod,uHasD,uBw,uHs,uCoA,uTw,uAn;uniform vec4 uSp[4],uSm[4];uniform vec3 uSt;uniform float uPa;uniform float uSw[4];', NOISE,
    'vec3 sky(vec3 d,float lod){float cz=dot(normalize(d),uCo);if(cz>uCoA){float q=clamp((cz-uCoA)/(1.0-uCoA),0.0,1.0);float mu=sqrt(1.0-(1.0-q)*(1.0-q));return uCoC*(0.4+0.6*mu);}vec3 l=normalize(uSkyM*d);float th=acos(clamp(l.y,-1.0,1.0));float ph=atan(l.z,-l.x);return textureLod(tSky,vec2(fract(ph/6.2831853),1.0-th/3.1415927),lod).rgb*uTint;}',
    // Tanner Helland 黑体色近似(T 单位 K)
    'vec3 bb(float T){T=clamp(T,1000.0,40000.0)/100.0;float r=T<=66.0?1.0:clamp(1.292936*pow(T-60.0,-0.1332047),0.0,1.0);',
    ' float g=T<=66.0?clamp(0.3900816*log(T)-0.6318414,0.0,1.0):clamp(1.1298909*pow(T-60.0,-0.0755148),0.0,1.0);',
    ' float b=T>=66.0?1.0:(T<=19.0?0.0:clamp(0.5432068*log(T-10.0)-1.1962541,0.0,1.0));return vec3(r,g,b);}',
    'float dn(float ph,float rr){float sw=ph+log(rr)*2.2;return n3(vec3(cos(sw)*2.2,sin(sw)*2.2,log(rr)*3.0))*0.65+n3(vec3(cos(sw)*5.0,sin(sw)*5.0,log(rr)*3.5))*0.35;}',
    'vec3 bend(vec3 v,vec3 p,float a){vec3 m=-normalize(p);vec3 q=m-v*dot(m,v);float l=length(q);if(l<1e-6)return v;q/=l;return normalize(v*cos(a)+q*sin(a));}',
    'float sig(float s,float b){return s/sqrt(b*b+s*s);}',
    'void main(){',
    ' vec4 v4=uIP*vec4(vN,1.0,1.0);vec3 rd=normalize(mat3(uMW)*normalize(v4.xyz/v4.w));',
    ' vec3 C=-uC;float B=dot(C,rd);float b0=length(cross(C,rd));float c=dot(C,C)-uRb*uRb;float h=B*B-c;',
    ' vec3 col=vec3(0.0);float tr=1.0;vec3 fd=rd;float sw=0.0;',   // C2.8c:最终方向 fd 统一在末尾采样星空,按像素间方向差选 mip(透镜缩小区不再因欠采样发黑)
    ' if(c>0.0&&(h<0.0||-B-sqrt(max(h,0.0))<0.0)){',   // 光线不进追踪球:弱场偏折
    '  float a=(1.0-sig(B,b0))/max(b0,1.0);fd=bend(rd,C,a);sw=1.0;',
    ' }else{',
    ' float t0=c>0.0?-B-sqrt(h):0.0;vec3 p=C+rd*t0;vec3 v=rd;',
    ' if(c>0.0){v=bend(rd,C,(sig(t0+B,b0)-sig(B,b0))/max(b0,1.0));}',   // 进球前已累积的偏折
    ' vec3 L=cross(p,v);float h2=dot(L,L);bool esc=false;bool hit=false;',
    ' vec3 e1=normalize(abs(uN.y)<0.9?cross(uN,vec3(0,1,0)):cross(uN,vec3(1,0,0)));vec3 e2=cross(uN,e1);',
    ' for(int i=0;i<220;i++){if(float(i)>=uSteps)break;',
    '  float r=length(p);float hs=clamp(uH*(r-uSurf*0.9)+0.012,0.012,uHasD);',
    '  vec3 ac=-1.5*h2*p/pow(r,5.0);vec3 pn=p+v*hs+0.5*ac*hs*hs;float rn=length(pn);vec3 an=-1.5*h2*pn/pow(rn,5.0);vec3 vn=v+0.5*(ac+an)*hs;',
    '  if(uHas>0.5){float s0=dot(p,uN),s1=dot(pn,uN);if(s0*s1<0.0){vec3 q=mix(p,pn,s0/(s0-s1));float rr=length(q);',
    '   if(rr>uRin&&rr<uRo){float ph0=atan(dot(q,e2),dot(q,e1));float om=0.6*pow(rr/uRin,-1.5);',
    '    float ta=mod(uT,16.0),tb=mod(uT+8.0,16.0),wa=1.0-abs(ta-8.0)/8.0;float nz=mix(dn(ph0-om*tb,rr),dn(ph0-om*ta,rr),wa);',
    '    float f=pow(rr/uRin,-0.75)*pow(max(0.0,1.0-sqrt(uRin/rr)),0.25)/0.488;',
    '    vec3 u=normalize(cross(uN,q));float be=min(sqrt(0.5/(rr-1.0)),0.7);float ga=1.0/sqrt(1.0-be*be);vec3 k=-normalize(v);',
    '    float g=sqrt(1.0-1.0/rr)/(ga*(1.0-be*dot(u,k)));',
    '    float a=smoothstep(uRin,uRin*1.25,rr)*(1.0-smoothstep(uRo*0.55,uRo,rr))*(0.55+0.45*nz);',
    '    vec3 em=bb(uT0*f*g)*pow(f*g,3.0)*uBr*2.6*(0.5+0.9*nz);col+=tr*a*em;tr*=1.0-a*0.85;}}}',
    '  if(uK>1.5&&uK<2.5){vec3 pm=0.5*(p+pn);float rm=length(pm);float ca=abs(dot(pm/rm,uMg));float an2=acos(min(ca,1.0));',   // 脉冲星辐射束(伪彩)
    '   float bm=exp(-pow(an2/uBw,2.0))*smoothstep(uSurf,uSurf*1.6,rm)*exp(-rm/22.0);col+=tr*uBc*bm*hs*0.09;}',
    '  if(rn<uSurf){hit=true;',
    '   if(uK>0.5){vec3 q=normalize(mix(p,pn,clamp((r-uSurf)/max(r-rn,1e-4),0.0,1.0)));float mu=max(dot(q,-normalize(v)),0.0);float g=sqrt(1.0-1.0/uSurf);',
    // C2.8d 表面温度图(仿 NASA/NICER):各向异性壳层导热 → 磁极暖、磁赤道冷(Greenstein & Hartke 1983);热斑 = 球冠减遮挡球冠(可成月牙,X-PSI);底色斑驳为示意
    '    float sp=0.0;for(int i=0;i<4;i++){float w=uSw[i];if(w<=0.0)continue;float ce=uSp[i].w,cm=uSm[i].w,ed=max(1.0-ce,1e-4)*0.25+0.002;',
    '     float a1=smoothstep(ce-ed,ce+ed,dot(q,uSp[i].xyz));float a2=cm<1.5?smoothstep(cm-ed,cm+ed,dot(q,uSm[i].xyz)):0.0;sp+=w*a1*(1.0-a2);}',
    '    float tf=1.0-uAn*(1.0-sqrt(abs(dot(q,uMg))));float gr=((n3(q*4.0)-0.5)*0.16+(n3(q*11.0)-0.5)*0.08)*uPa;',
    '    col+=tr*mix(uSt,vec3(1.0),min(sp,1.0))*bb(uT0*g*(1.0+0.6*sp))*(0.6+0.4*mu)*(tf+gr+sp*2.2)*uBr;}',
    '   tr=0.0;break;}',
    '  p=pn;v=vn;if(rn>uRb&&dot(p,v)>0.0){esc=true;break;}',
    ' }',
    ' if(esc){vec3 vv=normalize(v);float bb2=length(cross(p,vv));fd=bend(vv,p,(1.0-sig(dot(p,vv),bb2))/max(bb2,1.0));sw=tr;}',
    ' }',
    ' float px=max(length(dFdx(fd)),length(dFdy(fd)));float lod=clamp(log2(max(px*uTw/6.2831853,1e-4)),uLod,9.0);',
    ' if(sw>0.0)col+=sw*sky(fd,lod);',
    ' col=col/(1.0+max(col.r,max(col.g,col.b))*0.15);',
    ' gl_FragColor=vec4(col,1.0);',
    ' #include <colorspace_fragment>',
    '}'
  ].join('\n');

  var T, X, scn = null, mat = null, cur = null, tier = 1, obs = false, slow = 1, hud = null, st = {}, added = false, warned = false, t0 = 0, AX = {};
  function rm() { return matchMedia('(prefers-reduced-motion: reduce)').matches; }
  function small() { return Math.min(screen.width, screen.height) < 700 || innerWidth <= 760 || (navigator.deviceMemory && navigator.deviceMemory < 4); }
  function pickTier() { if (small()) return 0; return (navigator.hardwareConcurrency || 4) >= 8 ? 2 : 1; }
  function nf(x, d) { return x.toLocaleString('zh-CN', { maximumFractionDigits: d || 0, minimumFractionDigits: d || 0 }); }

  function build() {
    scn = new T.Scene(); var g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
    mat = new T.ShaderMaterial({ vertexShader: VS, fragmentShader: FS, depthWrite: false, depthTest: false, transparent: false,
      uniforms: { uIP: { value: new T.Matrix4() }, uMW: { value: new T.Matrix4() }, uSkyM: { value: new T.Matrix3() }, uC: { value: new T.Vector3() }, uN: { value: new T.Vector3(0, 1, 0) }, uS: { value: new T.Vector3(0, 1, 0) }, uMg: { value: new T.Vector3(0, 1, 0) }, uBc: { value: new T.Vector3(.55, .62, 1) },
        uTint: { value: new T.Color(0x9aa0ae) }, tSky: { value: null }, uT: { value: 0 }, uSteps: { value: 120 }, uRb: { value: 80 }, uSurf: { value: 1 }, uK: { value: 0 }, uAn: { value: 0 }, uSt: { value: new T.Vector3(1, 1, 1) }, uPa: { value: 1 }, uSp: { value: [0, 1, 2, 3].map(function () { return new T.Vector4(0, 0, 1, 2); }) }, uSm: { value: [0, 1, 2, 3].map(function () { return new T.Vector4(0, 0, 1, 2); }) }, uSw: { value: [0, 0, 0, 0] }, uRin: { value: 3 }, uRo: { value: 14 }, uT0: { value: 6000 }, uBr: { value: 1 }, uHas: { value: 0 }, uH: { value: .07 }, uLod: { value: 0 }, uHasD: { value: 6 }, uBw: { value: .1 }, uHs: { value: .25 }, uCoA: { value: 2 }, uTw: { value: 4096 }, uCo: { value: new T.Vector3(0, 0, 1) }, uCoC: { value: new T.Vector3() } } });
    var me = new T.Mesh(g, mat); me.frustumCulled = false; scn.add(me);
  }
  // 吸积盘法线 / 自转轴:与「从地球方向来的视线」成 inc 角(观测倾角),方位固定
  function axes(key, b) {
    if (AX[key]) return AX[key]; var e = EX[key], S = X._.S;
    var u = new T.Vector3(S.pos[0] - b.wp[0], S.pos[1] - b.wp[1], S.pos[2] - b.wp[2]).normalize();   // 指向来船方向(锁定时多在太阳系附近,≈ 地球方向)
    var p = new T.Vector3().crossVectors(u, new T.Vector3(0, 0, 1)); if (p.lengthSq() < 1e-6) p.set(1, 0, 0); p.normalize();
    var w = new T.Vector3().crossVectors(p, u).normalize(), i = (e.inc || 60) * Math.PI / 180;
    var n = u.clone().multiplyScalar(Math.cos(i)).add(w.clone().multiplyScalar(Math.sin(i))).normalize();
    var e1 = new T.Vector3().crossVectors(n, p).normalize(), e2 = new T.Vector3().crossVectors(n, e1);
    AX[key] = { n: n, e1: e1, e2: e2 }; return AX[key];
  }
  function setKey(key) {
    var e = EX[key], u = mat.uniforms; cur = key; tier = pickTier();
    u.uSteps.value = [100, 150, 200][tier]; u.uH.value = [.12, .08, .06][tier]; u.uHasD.value = e.disk ? [1.6, 1.0, .7][tier] : 6;   // 有吸积盘时限制最大步长,避免盘面出现同心条纹
    // C2.8c 修:下面一行曾被误并进上一行注释,导致中子星/脉冲星/磁星全部按黑洞渲染(只有阴影和透镜,没有表面和辐射束)
    u.uK.value = e.k === 'bh' ? 0 : e.k === 'ns' ? 1 : e.k === 'mag' ? 3 : 2; u.uSurf.value = e.k === 'bh' ? 1 : e.rsurf;
    u.uBw.value = e.bwd ? e.bwd * Math.PI / 180 : e.P ? Math.min(35, 5.4 / Math.sqrt(e.P)) * Math.PI / 180 : .1;   // 辐射束半宽 ρ ≈ 5.4° P^-1/2(Rankin 1993 经验关系)
    u.uHs.value = e.k === 'mag' ? .55 : .25;   // 极冠热斑角半径(磁星热斑大)
    slow = e.sf0 ? e.sf : 1;   // 毫秒脉冲星每秒数百圈,默认先慢放,否则热斑糊成环
    var nsk = e.k === 'psr' || e.k === 'mag' || e.k === 'ns';   // 中子星表面:颜色按黑体(10^5–10^6 K 已到瑞利-金斯极限色,淡蓝白,不用 NASA 的深蓝假色);热斑只更亮、过曝成白
    u.uSt.value.fromArray(e.st || [1, 1, 1]); u.uPa.value = e.pa || (nsk ? 1.4 : 1);
    u.uAn.value = e.an == null ? (e.k === 'bh' ? 0 : .3) : e.an;   // 磁赤道相对磁极变暗幅度
    var co = e.co; u.uCoA.value = co ? Math.cos(Math.asin(Math.min(.99, co.R / co.a))) : 2; if (co) { var cc = bbJS(co.T); u.uCoC.value.set(cc[0] * co.br, cc[1] * co.br, cc[2] * co.br); }
    u.uHas.value = e.disk ? 1 : 0; if (e.disk) { u.uRin.value = e.disk[0]; u.uRo.value = e.disk[1]; } u.uT0.value = e.T0 || 6000; u.uBr.value = (e.br || 1) * (e.k === 'psr' || e.k === 'mag' || e.k === 'ns' ? .72 : 1); var bc = e.bc || [.55, .62, 1]; u.uBc.value.set(bc[0], bc[1], bc[2]);
  }
  function layer(LI) {
    var b = X._.BY && X._.BY.tmpdso, e = b && !b.off && b.wp && EX[b.key];
    if (!e) { hudOff(); st.on = false; return; }
    if (!mat) build(); if (cur !== b.key) setKey(b.key);
    var S = X._.S, dx = b.wp[0] - S.pos[0], dy = b.wp[1] - S.pos[1], dz = b.wp[2] - S.pos[2], dd = Math.hypot(dx, dy, dz), D = dd / e.rs;
    st = { on: false, key: b.key, D: D, tier: tier };
    hudUpd(e, dd, D);
    if (!(D < 4000)) return;
    var skyG = X._.skyG && X._.skyG(), sm = skyG && skyG.children[0]; if (!sm || !sm.material || !sm.material.map || !sm.material.map.image) return;
    var u = mat.uniforms, c = LI.cam0, ax = axes(b.key, b); c.updateMatrixWorld(); sm.updateMatrixWorld();
    u.uIP.value.copy(c.projectionMatrixInverse || new T.Matrix4().copy(c.projectionMatrix).invert()); u.uMW.value.copy(c.matrixWorld);
    var M = new T.Matrix4().copy(sm.matrixWorld).invert(); u.uSkyM.value.setFromMatrix4(M);
    u.tSky.value = sm.material.map; u.uTint.value.copy(sm.material.color);
    var im = sm.material.map.image, tw = (im && im.width) || 4096, ppr = LI.H * (LI.rd.getPixelRatio ? LI.rd.getPixelRatio() : 1) / (Math.PI / 3);   // 屏幕每弧度像素
    u.uLod.value = Math.max(0, Math.log2(tw / (2 * Math.PI) / ppr)) * 0; u.uTw.value = tw;   // C2.8c:mip 改由像素间方向差决定   // 透镜区固定 mip,避免自动 mip 把强放大区糊成灰黑
    u.uC.value.set(dx / e.rs, dy / e.rs, dz / e.rs); u.uRb.value = Math.min(Math.max(D * 1.02, 30), 120);
    u.uN.value.copy(ax.n);
    if (e.co) { var pu = new T.Vector3(-dx, -dy, -dz).normalize().negate(), pr = pu.clone().addScaledVector(ax.n, -pu.dot(ax.n)); if (pr.lengthSq() < 1e-6) pr.copy(ax.e1); pr.normalize(); var ps = e.co.ph * Math.PI / 180; u.uCo.value.copy(pr.multiplyScalar(Math.cos(ps)).addScaledVector(new T.Vector3().crossVectors(ax.n, pr), Math.sin(ps))).normalize(); }
    var tt = rm() ? 0 : (performance.now() - t0) / 1000; u.uT.value = tt;
    var w = e.P ? 2 * Math.PI / e.P * slow * tt : 0, mi = (e.mag || 45) * Math.PI / 180;   // 磁轴绕自转轴(取 ax.n)旋转
    function bv(th, ph) { th *= Math.PI / 180; ph = ph * Math.PI / 180 + w; return ax.n.clone().multiplyScalar(Math.cos(th)).add(ax.e1.clone().multiplyScalar(Math.sin(th) * Math.cos(ph))).add(ax.e2.clone().multiplyScalar(Math.sin(th) * Math.sin(ph))); }
    if (e.k !== 'bh') { u.uMg.value.copy(bv(e.mag || 45, 0)).normalize();
      var sps = typeof e.spots === 'function' ? e.spots(tt) : (e.spots || []);   // [余纬°, 经度°, 角半径°, 权重, 遮挡余纬°, 遮挡经度°, 遮挡角半径°]
      for (var si = 0; si < 4; si++) { var q = sps[si]; if (!q) { u.uSw.value[si] = 0; continue; }
        var d1 = bv(q[0], q[1]); u.uSp.value[si].set(d1.x, d1.y, d1.z, Math.cos(q[2] * Math.PI / 180)); u.uSw.value[si] = q[3];
        if (q[6]) { var d2 = bv(q[4], q[5]); u.uSm.value[si].set(d2.x, d2.y, d2.z, Math.cos(q[6] * Math.PI / 180)); } else u.uSm.value[si].w = 2; } }
    LI.rd.render(scn, c); st.on = true;
  }
  /* ---------- 读数 HUD ---------- */
  function css() {
    if (document.getElementById('xeo-css')) return; var s = document.createElement('style'); s.id = 'xeo-css';
    s.textContent = '#xeo-hud{position:absolute;left:50%;top:150px;transform:translateX(-50%);z-index:5;pointer-events:auto;max-width:min(560px,calc(100vw - 20px));padding:6px 12px;border-radius:10px;font:11.5px/1.5 "Noto Sans SC",system-ui,sans-serif;color:#dfe8f6;background:rgba(8,12,22,.66);border:1px solid rgba(255,159,178,.4);text-align:center}' +
      '#xeo-hud .t{color:#ff9fb2}#xeo-hud .t i{font-style:normal;color:#a9bad3;margin-left:6px}#xeo-hud .r{display:flex;flex-wrap:wrap;justify-content:center;gap:2px 14px}#xeo-hud .r b{font-weight:500;color:#ffe2a0;font-family:"JetBrains Mono",ui-monospace,monospace}#xeo-hud .w{color:#ff8a8a}' +
      '#xeo-hud button{font:inherit;font-size:11px;cursor:pointer;border-radius:8px;padding:1px 9px;margin-left:6px;border:1px solid rgba(240,201,122,.6);background:rgba(240,201,122,.14);color:#ffe2a0}' +
      '.xdv-on #xeo-hud{display:none}@media (max-width:760px){#xeo-hud{top:auto;bottom:250px;font-size:10px;padding:4px 8px;width:calc(100vw - 24px)}#xeo-hud .t i{display:none}}';
    document.head.appendChild(s);
  }
  function hudOff() { if (hud) hud.style.display = 'none'; }
  function km(x) { return x >= 1e8 ? nf(x / 1.496e8, 2) + ' AU' : nf(x) + ' km'; }
  function sci(x) { if (x < 1e-3 || x >= 1e6) { var p = Math.floor(Math.log10(x)); return (x / Math.pow(10, p)).toFixed(1) + '×10^' + p; } return x < 10 ? x.toFixed(2) : nf(x); }
  function hudUpd(e, dd, D) {
    var root = X._.root && X._.root(); if (!root) return;
    if (D > 3000 || (window.SHXDV && SHXDV.flying && SHXDV.flying())) { hudOff(); return; }
    css(); if (!hud || hud.parentNode !== root) { if (hud) hud.remove(); hud = document.createElement('div'); hud.id = 'xeo-hud'; root.appendChild(hud); hud.addEventListener('click', function (ev) { var bt = ev.target.closest('button'); if (bt) { slow = slow === 1 ? (EX[cur].sf || 0.02) : 1; X._.toast(slow === 1 ? '辐射束恢复真实转速 · ' + (EX[cur].P >= 1 ? '每 ' + EX[cur].P.toFixed(1) + ' 秒一圈' : '每秒约 ' + (1 / EX[cur].P).toFixed(1) + ' 圈') : '慢放 ×1/' + Math.round(1 / slow) + ' · 便于看清热斑与辐射束扫过'); hud.dataset.k = ''; } }); }
    var r = dd * 1000, M = e.m * MSUN, dil = Math.sqrt(Math.max(0, 1 - 1 / D)), tid = 2 * G * M * 2 / (r * r * r), gs = tid / 9.81;
    var html = '<div class="t">模拟渲染 · 广义相对论光线追踪 · 非照片<i>' + e.zh + '</i>' + ((e.k === 'psr' || e.k === 'mag') ? '<button type="button">' + (slow === 1 ? '慢放 ×1/' + Math.round(1 / (e.sf || 0.02)) : '真实转速') + '</button>' : '') + '</div>' +
      '<div class="r"><span>距中心 <b>' + km(dd) + '</b>(' + nf(D, 1) + ' Rs)</span><span>时间流速 <b>' + dil.toFixed(4) + '×</b></span>' +
      '<span' + (gs > 10 ? ' class="w"' : '') + '>潮汐(2 m 身长)<b>' + sci(gs) + ' g</b>' + (gs > 10 ? ' · 致命' : gs > 1 ? ' · 危险' : '') + '</span>' +
      (e.k === 'bh' ? '<span>距事件视界 <b>' + km(Math.max(0, dd - e.rs)) + '</b></span>' : '<span>表面重力 <b>' + sci(G * M / Math.pow(e.rk * 1000, 2) / 9.81) + ' g</b></span>') +
      '<span>停泊线 15 Rs · 自动驾驶不越过</span></div>';
    var k = html.replace(/<b>[^<]*<\/b>/g, '');   // 只有数字变化时只改数字,避免每帧重建按钮
    if (hud.dataset.k !== k) { hud.innerHTML = html; hud.dataset.k = k; } else { var bs = hud.querySelectorAll('b'), tmp = document.createElement('div'); tmp.innerHTML = html; var nb = tmp.querySelectorAll('b'); for (var i = 0; i < bs.length; i++) if (nb[i] && bs[i].textContent !== nb[i].textContent) bs[i].textContent = nb[i].textContent; }
    hud.style.display = '';
  }
  function observe(key) {
    if (!X || !X.isOpen || !X.isOpen()) return false; var b = X._.BY.tmpdso;
    if (!b || b.off || b.key !== key) { if (!window.SHXDV || !SHXDV.lock(key, '抵达')) return false; }
    obs = true; var S = X._.S; S.auto = false; S.base = 0; S.mult = 1; S.align = true;
    if (window.SHXAN) SHXAN.hide();
    X._.toast('舷窗观测 · 广义相对论光线追踪(模拟渲染,非照片)· 拖动环视,看星空如何被弯曲');
    return true;
  }
  function init() {
    T = window.THREE; X = window.SHXC; if (!T || !X || !X.layers || added) return; added = true; t0 = performance.now();
    X.layers.bg.push(function (LI) { try { layer(LI); } catch (er) { if (!warned) { warned = true; console.warn('[SHXEO]', er); } } });
  }
  function hook(ev) {
    if (ev === 'open' || ev === 'renderer' || ev === 'frame') { if (!added) init(); }
    if (ev === 'close') { obs = false; hudOff(); }
  }
  (function reg(n) { if (window.SHXDV && SHXDV.add) { Object.keys(EX).forEach(function (k) { SHXDV.add(k, EX[k]); }); return; } if (n < 150) setTimeout(function () { reg(n + 1); }, 100); })(0);
  (function wait(n) { if (window.SHXC && SHXC.on) { SHXC.on(hook); return; } if (n < 150) setTimeout(function () { wait(n + 1); }, 100); })(0);
  window.SHXEO = { has: function (k) { return !!EX[k]; }, list: function () { return Object.keys(EX); }, get: function (k) { return EX[k]; }, observe: observe, endObs: function () { obs = false; }, slow: function (v) { if (v != null) slow = v; return slow; },
    state: function () { return { on: !!st.on, key: st.key || null, D: st.D ? +st.D.toFixed(2) : null, tier: tier, hud: !!(hud && hud.style.display !== 'none'), obs: obs }; } };
})();
