/* 天枢 Starhelm 2.0 · C2.11a 星域 VI「银河」全景(SHXGX)
 * 王磊 10-30 09:25:开放 VI 银河,可进入一个整体范围 —— 看到银河全貌以及恒星、星团、星云、黑洞等天文元素的模拟渲染,类似太阳系全景。
 * - 独立全屏视图(自带 three 渲染器,r186 与 ?three=169 通用;无 WebGL 时退回 2D 俯视静图)。
 * - 银河结构(模拟渲染 · 非照片):核球、长约 1.7 万光年的中央棒(与日心-银心连线约 27°)、四条对数螺旋臂(俯仰约 15.5°,与 sh-x-cosmos.js
 *   「回望银河」同一套参数)、猎户臂(本地臂)、尘埃带、电离氢区;太阳距银心 26,996 光年(GRAVITY 2019)。
 * - 天体标记:按真实赤经赤纬 + 距离换算到银心坐标(J2000 → 银道,IAU 1958 旋转矩阵)。可飞抵的点「设为目的地」= SHXDV.lock。
 * - 相机:拖动旋转、滚轮 / 双指缩放;预设「全景 / 俯视 / 侧视 / 太阳附近 / 卫星星系」;空闲时缓慢绕转(减少动态时不转)。
 * - 入口:驾驶舱航图 VI「进入银河全景」;视图圆环「5 银河」;深链 ?view=galaxy。Esc 先关资料卡再关全景。
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
    var nLoc = Math.min(40000, N * .05), nB = N * .11, nBar = N * .08, nD = N * .36, nA = N * .33, nL = N * .03 - 0, k;
    for (k = 0; k < nB; k++) { var rr = Math.abs(gauss(R)) * 2600, th = R() * 6.283, ph = Math.acos(2 * R() - 1); put(rr * Math.sin(ph) * Math.cos(th), rr * Math.cos(ph) * .62, rr * Math.sin(ph) * Math.sin(th), 1, .82 + R() * .08, .55 + R() * .1, 260 + R() * 200); }
    for (k = 0; k < nBar; k++) { var u = gauss(R) * 4200, v = gauss(R) * 1300; if (Math.abs(u) > 9000) u *= .5; put(u * bar[0] - v * bar[1], gauss(R) * 500, u * bar[1] + v * bar[0], 1, .85, .62, 240 + R() * 160); }
    for (k = 0; k < nD; k++) { var r = -Math.log(1 - R() * .985) * 10500 + 2500, a = R() * 6.283, c = R(); if (r > RG) r = RG * R(); put(r * Math.cos(a), gauss(R) * (300 + r * .006), r * Math.sin(a), c < .5 ? .85 : .7, c < .5 ? .8 : .78, c < .5 ? .78 : .95, 200 + R() * 150); }
    for (k = 0; k < nA; k++) {
      var A = ARMS[R() < .62 ? (R() < .5 ? 0 : 1) : (R() < .5 ? 2 : 3)], phi, rr2;
      do { phi = -R() * 5.2 + 1.0; rr2 = armR(A, phi); } while (rr2 < 9000 || rr2 > 56000);
      var sp = 900 + rr2 * .03, off = gauss(R) * sp, ang = phi + off / rr2, hii = R() < .055, blue = R();
      var x = rr2 * Math.cos(ang), z = rr2 * Math.sin(ang);
      if (hii) put(x, gauss(R) * 150, z, 1, .42 + R() * .15, .62, 700 + R() * 700);
      else put(x, gauss(R) * 220, z, .62 + blue * .25, .74 + blue * .14, 1, 220 + R() * 180);
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
    var ND = small() ? 2500 : N > 400000 ? 14000 : 8000, DP = new Float32Array(ND * 3), DS = new Float32Array(ND);
    for (k = 0; k < ND; k++) { var A2 = ARMS[k % 4 < 3 ? k % 2 : 2 + (k % 2)], ph2, r2; do { ph2 = -R() * 6.5 + 1; r2 = armR(A2, ph2) * .93; } while (r2 < 8000 || r2 > 50000); var an2 = ph2 + gauss(R) * 500 / r2; DP[k * 3] = r2 * Math.cos(an2); DP[k * 3 + 1] = gauss(R) * 120; DP[k * 3 + 2] = r2 * Math.sin(an2); DS[k] = 900 + R() * 900; }
    return { P: P, C: Cc, S: S, n: i, DP: DP, DS: DS };
  }
  var VSP = 'attribute float aS;attribute vec3 aC;varying vec3 vC;varying float vA;uniform float uK,uB,uM,uT;void main(){vec3 p=position;if(uT>0.0){float r=length(p.xz);float a=uT*767.0/max(r,1500.0);float c=cos(a),s=sin(a);p.xz=vec2(p.x*c-p.z*s,p.x*s+p.z*c);}vec4 mv=modelViewMatrix*vec4(p,1.0);float s=aS*uK/max(-mv.z,1.0);vA=clamp(s,0.15,1.0)*uB*clamp(uM/max(s,1.0)*1.6,.35,1.0);gl_PointSize=clamp(s,1.0,uM);vC=aC;gl_Position=projectionMatrix*mv;}';
  var FSP = 'precision mediump float;varying vec3 vC;varying float vA;void main(){vec2 d=gl_PointCoord-.5;float r=dot(d,d)*4.0;if(r>1.0)discard;float a=exp(-r*3.0)*vA;gl_FragColor=vec4(vC*a,1.0);}';
  var FSDU = 'precision mediump float;varying float vA;void main(){vec2 d=gl_PointCoord-.5;float r=dot(d,d)*4.0;if(r>1.0)discard;gl_FragColor=vec4(.05,.03,.02,(1.0-r)*.22*vA);}';
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
    var ms = new T.ShaderMaterial({ vertexShader: VSP, fragmentShader: FSP, transparent: true, depthWrite: false, depthTest: false, blending: T.AdditiveBlending, uniforms: { uK: { value: 800 }, uB: { value: (small() ? .62 : .42) * Math.max(.3, Math.sqrt(90000 / built.n)) * 1.15 }, uM: { value: 28 }, uT: { value: 0 } } });
    var pts = new T.Points(g, ms); pts.frustumCulled = false; pts.renderOrder = 1; scn.add(pts); mats.push(ms);
    var gd = new T.BufferGeometry(); gd.setAttribute('position', new T.BufferAttribute(built.DP, 3)); gd.setAttribute('aS', new T.BufferAttribute(built.DS, 1)); gd.setAttribute('aC', new T.BufferAttribute(new Float32Array(built.DS.length * 3), 3));
    var md = new T.ShaderMaterial({ vertexShader: VSP, fragmentShader: FSDU, transparent: true, depthWrite: false, depthTest: false, blending: T.NormalBlending, uniforms: { uK: { value: 800 }, uB: { value: 1 }, uM: { value: 28 }, uT: { value: 0 } } });
    var dp = new T.Points(gd, md); dp.frustumCulled = false; dp.renderOrder = 2; scn.add(dp); mats.push(md);
    var mg = new T.ShaderMaterial({ vertexShader: VSG, fragmentShader: FSG, transparent: true, depthWrite: false, depthTest: false, side: T.DoubleSide, blending: T.AdditiveBlending, uniforms: { uA: { value: .9 } } });
    var pl = new T.Mesh(new T.PlaneGeometry(2 * RG, 2 * RG), mg); pl.rotation.x = -Math.PI / 2; pl.renderOrder = 0; pl.frustumCulled = false; scn.add(pl); mats.push(mg);
    var FG = 'precision mediump float;varying vec2 vU;uniform float uA;void main(){float r=length(vU);if(r>1.0)discard;float g=exp(-r*r*10.0)*.85+exp(-r*4.5)*.22;gl_FragColor=vec4(vec3(1.0,.86,.64)*g*uA,1.0);}';
    var mb = new T.ShaderMaterial({ vertexShader: VSG, fragmentShader: FG, transparent: true, depthWrite: false, depthTest: false, blending: T.AdditiveBlending, uniforms: { uA: { value: .55 } } });
    GLOW = new T.Mesh(new T.PlaneGeometry(22000, 22000), mb); GLOW.frustumCulled = false; GLOW.renderOrder = 3; scn.add(GLOW); mats.push(mb);
    // C2.12a 尘埃切片(mats[4]...)+ 核区大光晕(HALO)
    var NS = small() ? 0 : built.n > 400000 ? 12 : 8; DSL = [];
    for (var si = 0; si < NS; si++) {
      var yy = (si / Math.max(1, NS - 1) - .5) * 700, wv = Math.exp(-Math.pow(yy / 260, 2));
      var msl = new T.ShaderMaterial({ vertexShader: VSG, fragmentShader: FSDS, transparent: true, depthWrite: false, depthTest: false, side: T.DoubleSide, blending: T.NormalBlending, uniforms: { uA: { value: 0 }, uY: { value: si * 1.7 } } });
      var sl = new T.Mesh(new T.PlaneGeometry(2 * RG, 2 * RG), msl); sl.rotation.x = -Math.PI / 2; sl.position.y = yy; sl.renderOrder = 2; sl.frustumCulled = false; scn.add(sl); DSL.push({ m: msl, w: wv * 2.6 / Math.max(1, NS) * 4 });
    }
    var FH = 'precision mediump float;varying vec2 vU;uniform float uA;void main(){float r=length(vU);if(r>1.0)discard;float g=(exp(-r*r*3.2)*.5+exp(-r*2.4)*.18)*smoothstep(1.0,.55,r);gl_FragColor=vec4(vec3(1.0,.8,.58)*g*uA,1.0);}';
    var mh = new T.ShaderMaterial({ vertexShader: VSG, fragmentShader: FH, transparent: true, depthWrite: false, depthTest: false, blending: T.AdditiveBlending, uniforms: { uA: { value: .5 } } });
    HALO = new T.Mesh(new T.PlaneGeometry(60000, 60000), mh); HALO.frustumCulled = false; HALO.renderOrder = 3; scn.add(HALO);
    // 大小麦哲伦云:两团模糊光斑
    [['LMC', 30000, 1], ['NGC 292', 18000, .7]].forEach(function (q) {
      var o = OBJ.filter(function (x) { return x[0] === q[0]; })[0], p = pos(o[3], o[4], o[5]);
      var gm = new T.BufferGeometry(), n = 1400, R = rnd(q[0].length * 977), a = new Float32Array(n * 3), cc = new Float32Array(n * 3), ss = new Float32Array(n);
      for (var j = 0; j < n; j++) { a[j * 3] = p[0] + gauss(R) * q[1] * .35; a[j * 3 + 1] = p[1] + gauss(R) * q[1] * .2; a[j * 3 + 2] = p[2] + gauss(R) * q[1] * .3; cc[j * 3] = .8; cc[j * 3 + 1] = .82; cc[j * 3 + 2] = 1; ss[j] = 900 * q[2]; }
      gm.setAttribute('position', new T.BufferAttribute(a, 3)); gm.setAttribute('aC', new T.BufferAttribute(cc, 3)); gm.setAttribute('aS', new T.BufferAttribute(ss, 1));
      var pp = new T.Points(gm, ms.clone()); pp.frustumCulled = false; scn.add(pp);
    });
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
      '@media (max-width:760px){#xgx .hd{left:12px;top:10px;right:60px}#xgx .hd h2{font-size:18px}#xgx .hd p{font-size:11px}#xgx .lg{bottom:auto;top:132px;left:10px}#xgx .sc{bottom:118px}#xgx .bar{bottom:12px}#xgx .bar button{padding:5px 10px;font-size:12px}#xgx .cd{top:auto;bottom:64px;right:10px}}';
    document.head.appendChild(s);
  }
  var MK = [], ARML = [], SUNM = null;
  function dom() {
    css();
    ov = document.createElement('div'); ov.id = 'xgx'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-label', '银河全景');
    ov.innerHTML = '<canvas class="cv" aria-label="银河系模拟渲染,可拖动旋转、滚轮缩放"></canvas><div class="lay"></div>' +
      '<div class="hd"><div class="k">星域 VI · MILKY WAY</div><h2>银河全景<small>THE MILKY WAY</small></h2>' +
      '<p>直径约 10 万光年,约 1,000–4,000 亿颗恒星。太阳在猎户臂上,距银心约 2.7 万光年,绕银心一圈约 2.3 亿年。</p>' +
      '<span class="badge">模拟渲染 · 非照片 · 旋臂为示意模型(对数螺旋)· 天体位置按真实方向与距离</span></div>' +
      '<button class="x" type="button" aria-label="关闭银河全景(Esc)">×</button><div class="lg"></div><div class="sc"><span></span><b></b></div>' +
      '<div class="bar"><button data-p="all" type="button">全景</button><button data-p="whole" type="button">整盘</button><button data-p="top" type="button">俯视</button><button data-p="side" type="button">侧视</button><button data-p="sun" type="button">太阳附近</button><button data-p="mc" type="button">卫星星系</button><button data-p="tf" type="button" title="恒星内快外慢,看旋臂与恒星如何相对运动">差速自转</button><button data-p="intro" type="button">重播开场</button><button data-p="fly" type="button">回驾驶舱</button></div><div class="cap" aria-live="polite"></div><button class="skip" type="button">跳过 ›</button><div class="tfc"></div>';
    document.body.appendChild(ov);
    cv = ov.querySelector('.cv'); lay = ov.querySelector('.lay');
    ov.querySelector('.x').onclick = function () { close(); };
    ov.querySelector('.skip').onclick = function () { endIntro(true); };
    ov.querySelectorAll('.bar button').forEach(function (b) { b.onclick = function () { if (b.dataset.p === 'fly') { cockpit(); return; } if (b.dataset.p === 'tf') { tfToggle(); return; } if (b.dataset.p === 'intro') { intro(true); return; } endIntro(); preset(b.dataset.p); }; });
    var lg = ov.querySelector('.lg');
    Object.keys(CAT).forEach(function (k) { if (k === 'sun') return; var b = document.createElement('button'); b.type = 'button'; b.innerHTML = '<i style="background:' + CAT[k].c + '"></i>' + CAT[k].zh; b.onclick = function () { hidden[k] = !hidden[k]; b.classList.toggle('off', !!hidden[k]); }; lg.appendChild(b); });
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
  function show(m) {
    if (card) card.remove();
    card = document.createElement('div'); card.className = 'cd'; card.setAttribute('role', 'dialog');
    var dgc = Math.hypot(m.p[0], m.p[1], m.p[2]), h;
    if (m.cat === 'sun') h = '<h3>太阳系</h3><div class="ty">我们的家 · 猎户臂</div><p>太阳带着八大行星以约 230 km/s 绕银心公转,转一圈约 2.3 亿年 —— 上一次在这个位置时,地球上刚出现最早的恐龙。</p><dl><dt>距银心</dt><dd>约 26,996 光年</dd><dt>离银盘中面</dt><dd>约 55 光年(北侧)</dd></dl><div class="row"><button class="go" type="button">回驾驶舱</button></div>';
    else h = '<h3>' + m.zh + '</h3><div class="ty">' + CAT[m.cat].zh + (m.fl ? ' · ✦ 可飞抵' : '') + '</div><p>' + m.txt + '</p><dl><dt>距地球</dt><dd>约 ' + fly(m.ly) + '</dd><dt>距银心</dt><dd>约 ' + fly(dgc) + '</dd><dt>光的回看</dt><dd>你看到的是约 ' + fly(m.ly).replace('光年', '年') + '前发出的光</dd></dl>' +
      '<div class="row">' + (m.fl ? '<button class="go" type="button">设为目的地</button>' : '') + '<button class="fo" type="button">飞近看看</button></div>';
    card.innerHTML = '<button class="c" type="button" aria-label="关闭">×</button>' + h; ov.appendChild(card);
    card.querySelector('.c').onclick = function () { card.remove(); card = null; };
    var go = card.querySelector('.go'), fo = card.querySelector('.fo');
    if (go) go.onclick = function () { if (m.cat === 'sun') cockpit(); else target(m); };
    if (fo) fo.onclick = function () { focus(m.p, Math.max(2500, Math.min(60000, m.ly > 1e5 ? 60000 : 9000))); };
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
  function zoom(f) { TW = null; C.d = Math.max(1500, Math.min(600000, C.d * f)); }

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
      var e = m.el, q = hidden[m.cat] ? null : proj(m.p); if (!q || q[0] < -40 || q[0] > W + 40 || q[1] < -20 || q[1] > H - (small() ? 64 : 70)) { e.style.display = 'none'; return; }
      e.style.display = ''; e.style.transform = 'translate(' + (q[0] - 8) + 'px,' + (q[1] - 10) + 'px)';
      var clash = placed.some(function (o) { return Math.abs(o[0] - q[0]) < (mob ? 70 : 96) && Math.abs(o[1] - q[1]) < 16; });
      e.classList.toggle('nl', clash); if (!clash) placed.push(q);
    });
    var far = mode === '3d' ? C.d : 150000;
    ARML.forEach(function (a) { var q = proj(a.p); if (!q || far < 20000 || far > 380000) { a.el.style.display = 'none'; return; } a.el.style.display = ''; a.el.style.transform = 'translate(' + q[0] + 'px,' + q[1] + 'px) translate(-50%,-50%)'; });
    // 比例尺
    var lyPerPx = mode === '3d' ? 2 * C.d * Math.tan(30 * D2R) / H : 2.3 * RG / Math.min(W, H), steps = [100, 500, 1000, 5000, 10000, 20000, 50000, 100000], L = 100, px = 100;
    for (var i = 0; i < steps.length; i++) { px = steps[i] / lyPerPx; L = steps[i]; if (px > 60) break; }
    var sc = ov.querySelector('.sc'); sc.querySelector('span').textContent = fly(L); sc.querySelector('b').style.width = Math.round(px) + 'px';
  }
  function frame(now) {
    if (!open_) return;
    step(now); last = now;
    if (mode === '3d') {
      var cp = Math.cos(C.pit), x = C.tx + C.d * cp * Math.cos(C.yaw), y = C.ty + C.d * Math.sin(C.pit), z = C.tz + C.d * cp * Math.sin(C.yaw);
      cam.position.set(x, y, z); cam.up.set(0, 1, 0); if (C.pit > 1.5) cam.up.set(-Math.cos(C.yaw), 0, -Math.sin(C.yaw)); cam.lookAt(C.tx, C.ty, C.tz);
      var kk = H / (2 * Math.tan(30 * D2R)), um = C.d < 40000 ? 2.2 + 5.8 * C.d / 40000 : 28; mats[0].uniforms.uK.value = kk; mats[1].uniforms.uK.value = kk; mats[0].uniforms.uM.value = um; mats[1].uniforms.uM.value = Math.max(um * 3, 6);
      if (GLOW) { GLOW.quaternion.copy(cam.quaternion); mats[3].uniforms.uA.value = .55 * (1 - .55 * Math.abs(Math.sin(C.pit))); }
      mats[2].uniforms.uA.value = .9 * (.45 + .55 * Math.min(1, C.d / 100000)) * Math.min(1, Math.max(.15, Math.abs(Math.sin(C.pit)) * 1.4)) * (C.d < 20000 ? C.d / 20000 : 1);
      var dsf = Math.max(0, Math.min(1, (C.d - 6000) / 14000)), sp = Math.abs(Math.sin(C.pit));
      DSL.forEach(function (q) { q.m.uniforms.uA.value = q.w * dsf * (sp < .12 ? 1.4 : .55 + .45 * sp); });
      if (HALO) { HALO.quaternion.copy(cam.quaternion); HALO.material.uniforms.uA.value = .5 * Math.min(1, C.d / 30000) * (1 - .4 * sp); }
      if (TFon) { TF = Math.min(230, TF + Math.min(.05, (now - (frame.lt || now)) / 1000) * 20); if (TF >= 230) TF = 230; tfShow(); }
      frame.lt = now; mats[0].uniforms.uT.value = TF; mats[1].uniforms.uT.value = TF;
      rd.render(scn, cam);
    }
    labels();
    raf = requestAnimationFrame(frame);
  }
  function flat() {   // 无 WebGL:2D 俯视静图
    mode = '2d'; ov.querySelectorAll('.bar button').forEach(function (b) { if (b.dataset.p !== 'fly') b.style.display = 'none'; });
    if (!built) built = gen();
    var g = cv.getContext('2d'), D = Math.min(devicePixelRatio || 1, 1.5); cv.width = W * D; cv.height = H * D; g.scale(D, D);
    g.fillStyle = '#010208'; g.fillRect(0, 0, W, H); g.globalCompositeOperation = 'lighter';
    var s = Math.min(W, H) / (2.3 * RG), P = built.P, Cc = built.C;
    for (var i = 0; i < built.n; i += 2) { var x = W / 2 + P[i * 3] * s, y = H / 2 + P[i * 3 + 2] * s; g.fillStyle = 'rgba(' + (Cc[i * 3] * 255 | 0) + ',' + (Cc[i * 3 + 1] * 255 | 0) + ',' + (Cc[i * 3 + 2] * 255 | 0) + ',.35)'; g.fillRect(x, y, 1.3, 1.3); }
    g.globalCompositeOperation = 'source-over';
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
    if (card) { card.remove(); card = null; }
    if (INTRO) endIntro(); if (TFon) tfToggle();
    ov.classList.remove('on'); var o = ov; setTimeout(function () { if (!open_) o.style.display = 'none'; }, 500);
    if (rd) { try { rd.dispose(); if (rd.forceContextLoss) rd.forceContextLoss(); } catch (e) { } rd = null; mats = []; scn = null; var nc = cv.cloneNode(false); cv.parentNode.replaceChild(nc, cv); cv = nc; input(); }
    try { if (/[?&]view=galaxy/.test(location.search)) history.replaceState(null, '', setQ('view', null)); } catch (e) { }
  }
  VP = { set: function (x, y, z) { this.v = this.v || new window.THREE.Vector3(); this.v.set(x, y, z); return this; }, project: function (c) { this.v.project(c); this.x = this.v.x; this.y = this.v.y; this.z = this.v.z; return this; } };
  if (window.SHXESC) SHXESC.reg('galaxy', 110, function () { return open_; }, function () { if (INTRO) endIntro(true); else if (card) { card.remove(); card = null; } else close(); });
  window.SHXGX = { open: open, close: close, isOpen: function () { return open_; }, preset: function (k) { if (open_) preset(k); }, show: function (key) { var m = MK.filter(function (x) { return x.key === key; })[0]; if (m) show(m); }, mode: function () { return mode; }, intro: function () { return !!INTRO; }, skip: function () { endIntro(true); }, n: function () { return built ? built.n : 0; }, tf: function () { if (open_) tfToggle(); return TFon; }, objs: function () { return OBJ.map(function (o) { return { key: o[0], zh: o[1], p: pos(o[3], o[4], o[5]) }; }); } };
})();
