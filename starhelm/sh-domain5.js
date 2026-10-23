/* 天枢 Starhelm · sh-domain5.js · 星域 V「群星」独立视图(v1.0-M4)
 * 太阳周围约 100 光年的真实 3D 恒星场(HYG 恒星库 v4.1,4 268 颗;另含 100–3000 光年内视星等 ≤3.5 的亮星):
 *  - GPU 粒子:颜色 = 温度(由 B−V 色指数换算),大小/亮度 = 从镜头位置看到的亮度(绝对星等 + 真实距离在着色器里算视星等);
 *    所以站在太阳旁看出去就是真实的星空,飞远了星座会变形。
 *  - 点星 → 「此刻卡」(距离、你看到的是多少年前的它、温度/颜色、亮度、类型、趣闻)+ 一镜到底推近(三层着色器恒星特写,按温度换色)。
 *  - 北斗七星(天枢 = 大熊座α,本世界同名星)、近邻恒星标签、系外行星宿主光环(NASA 系外行星档案)。
 * API:window.SHD5.go(view) / close() / isOpen() / camKm() / crumb() / focusKey(key) / constel(on) / setShip(ly) / setEpoch(yr)
 * 守星人:织女。深链 ?domain=5;任务见 sh-d5-tasks.js。距离为真实值;特写里恒星的大小为示意(画面角注已标明)。
 */
(function () {
  'use strict';
  var LYKM = 9460730472580.8, EPS = 23.4393 * Math.PI / 180;
  var D5 = { open: false, ready: false, mode: 'overview', focus: -1, ship: 0, epoch: 0 };
  var T = null, G = null, raf = 0, last = 0, leRender = null;
  function h(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function P(n, a) { if (window.LE && LE.audio) LE.audio.play(n, a); }
  function reduced() { return window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches; }
  function small() { return innerWidth < 760; }
  function toast(m) { if (window.LE && LE.ui && LE.ui.toast) LE.ui.toast(m); }
  function year() { return (window.SHTIME ? SHTIME.now() : new Date()).getFullYear(); }
  function guide(q) { if (window.SHHUD) SHHUD.guide('zhinv', q, []); }

  /* ---------------- 数据 ---------------- */
  var META = {   // 标注星:中文名 · 英文/拜耳名 · 类型 · 趣闻 · 标签优先级(小=先)· 标签类别
    sol: ['太阳', 'Sun', '黄矮星(G2 主序星)', '你的恒星。它的光到地球只要 8 分 20 秒,今年它约 46 亿岁,正值中年。', 0],
    proxima: ['比邻星', 'Proxima Centauri', '红矮星(M5.5)', '离太阳最近的恒星,却暗得肉眼看不见;它有一颗地球大小的行星比邻星 b,位于宜居带。', 1, 'exo'],
    rigil: ['南门二 A', 'α Centauri A', '黄矮星(G2 主序星)', '几乎是太阳的「双胞胎」,和 B 星约 80 年互绕一圈;比邻星在远处绕着它俩转。', 30],
    toliman: ['南门二 B', 'α Centauri B', '橙矮星(K1 主序星)', '比太阳略小略冷的橙色恒星,和 A 星组成一对。', 40],
    barnard: ['巴纳德星', "Barnard's Star", '红矮星(M4)', '天空中「跑」得最快的恒星,每年挪动约 10 角秒;2024–2025 年发现 4 颗小行星绕着它转。', 12, 'exo'],
    wolf359: ['沃尔夫 359', 'Wolf 359', '红矮星(M6)', '很暗的红矮星,质量只有太阳的约 1/10。', 40],
    lalande: ['拉兰德 21185', 'Lalande 21185', '红矮星(M2)', '北天最亮的红矮星之一,但肉眼仍然看不到。', 40],
    sirius: ['天狼星', 'Sirius · α CMa', '白色主序星(A1)', '夜空中最亮的恒星。它有一颗白矮星伴星天狼星 B——那就是太阳遥远的未来。', 2],
    epseri: ['天苑四', 'ε Eridani', '橙矮星(K2 主序星)', '一颗年轻的类太阳恒星,周围有尘埃盘和一颗巨行星。', 16, 'exo'],
    procyon: ['南河三', 'Procyon · α CMi', '黄白色恒星(F5)', '它也有一颗白矮星伴星,冬季大三角之一。', 6],
    taucet: ['天仓五', 'τ Ceti', '黄矮星(G8 主序星)', '1960 年人类第一次用射电望远镜「监听」外星信号,目标之一就是它。', 15, 'exo'],
    altair: ['牛郎星', 'Altair · 河鼓二', '白色主序星(A7)', '自转极快,约 9 小时转一圈,被甩成了扁球。七夕故事里它和织女星隔着银河。', 4],
    vega: ['织女星', 'Vega · 织女一', '白色主序星(A0)', '本星域守星人织女的星。约 1.2 万年后,它会接替北极星的位置。', 3],
    fomalhaut: ['北落师门', 'Fomalhaut', '白色主序星(A3)', '被一圈巨大的尘埃环包围,秋夜南天最亮的星。', 9],
    arcturus: ['大角星', 'Arcturus', '橙巨星(K1.5 III)', '北天最亮的恒星。它已经老了、胀大了——太阳几十亿年后也会走这条路。', 5],
    pollux: ['北河三', 'Pollux', '橙巨星(K0 III)', '离我们最近的巨星之一,身边有一颗巨行星。', 10],
    capella: ['五车二', 'Capella', '一对黄巨星', '看起来是一颗,其实是两颗黄色巨星互相绕转。', 8],
    castor: ['北河二', 'Castor', '六合星系统', '看起来是一颗,其实是 6 颗星组成的大家族。', 13],
    aldebaran: ['毕宿五', 'Aldebaran', '橙巨星(K5 III)', '金牛座的「红眼睛」。它并不属于身后的毕星团,只是恰好在同一方向。', 11],
    regulus: ['轩辕十四', 'Regulus', '蓝白色主序星(B8)', '自转快得接近被甩散。', 14],
    polaris: ['北极星', 'Polaris · 勾陈一', '黄白超巨星(F7 Ib)', '几乎正对地球自转轴,所以整夜看起来不动。它的光要走约 430 年。', 7, 'far'],
    dubhe: ['天枢', 'Dubhe · 大熊座α', '橙巨星(K0 III)', '北斗第一星,也是「天枢 Starhelm」这个世界的同名星。它比北斗中间五颗远得多,也走着自己的路。', 0, 'dubhe'],
    merak: ['天璇', 'Merak · 大熊座β', '白色主序星(A1)', '把天璇—天枢的连线延长约 5 倍,就能找到北极星。', 20, 'dip'],
    phecda: ['天玑', 'Phecda · 大熊座γ', '白色主序星(A0)', '和天璇、天权、玉衡、开阳一起,属于同一群结伴同行的「大熊座移动星群」。', 20, 'dip'],
    megrez: ['天权', 'Megrez · 大熊座δ', '白色主序星(A3)', '北斗七星里最暗的一颗。', 20, 'dip'],
    alioth: ['玉衡', 'Alioth · 大熊座ε', '白色特殊星(A1p)', '北斗七星里最亮的一颗。', 20, 'dip'],
    mizar: ['开阳', 'Mizar · 大熊座ζ', '白色主序星(A2)', '和身旁的「辅」组成著名的开阳双星,古人用它来测视力。', 20, 'dip'],
    alkaid: ['摇光', 'Alkaid · 大熊座η', '蓝白色主序星(B3)', '斗柄最末一颗,年轻的热星;和天枢一样,它不跟中间五颗一起走。', 20, 'dip'],
    alcor: ['辅', 'Alcor · 大熊座 80', '白色主序星(A5)', '开阳旁边的小星,能看清它说明眼力不错。', 60, 'dip'],
    betelgeuse: ['参宿四', 'Betelgeuse', '红超巨星(M1–2 Ia)', '一颗快要走到生命尽头的红超巨星,将来会爆发成超新星——它约 500 光年远,对地球没有危险。', 7, 'far'],
    rigel: ['参宿七', 'Rigel', '蓝超巨星(B8 Ia)', '亮度是太阳的数万倍,860 多光年外依然耀眼。', 8, 'far'],
    deneb: ['天津四', 'Deneb', '白超巨星(A2 Ia)', '约 1400 光年远仍是一等亮星,和织女、牛郎组成夏季大三角。', 8, 'far'],
    antares: ['心宿二', 'Antares · 大火', '红超巨星(M1 Ib)', '「七月流火」说的就是它。它的个头能装下火星轨道。', 9, 'far'],
    spica: ['角宿一', 'Spica', '蓝白色主序星(B1)', '其实是两颗炽热的蓝星紧紧互绕。', 9, 'far'],
    canopus: ['老人星', 'Canopus', '白超巨星(F0 Ib)', '夜空第二亮星,中国古人称它「寿星」。', 9, 'far'],
    denebola: ['五帝座一', 'Denebola', '白色主序星(A3)', '狮子座的尾巴。', 40],
    ross128: ['罗斯 128', 'Ross 128', '红矮星(M4)', '一颗很「安静」、少有耀斑的红矮星,它的行星罗斯 128 b 温度可能比较温和。', 22, 'exo'],
    peg51: ['飞马座 51', '51 Pegasi · Helvetios', '黄矮星(G5)', '1995 年,人类在它身边发现了第一颗绕类太阳恒星的系外行星,这项发现获得 2019 年诺贝尔物理学奖。', 14, 'exo'],
    cnc55: ['巨蟹座 55', '55 Cancri · Copernicus', '黄矮星(G8)', '至少 5 颗行星;其中 55 Cnc e 可能有熔岩海洋。', 24, 'exo'],
    wolf1061: ['沃尔夫 1061', 'Wolf 1061', '红矮星(M3)', '有 3 颗已确认行星,其中 c 在宜居带内侧边缘。', 30, 'exo'],
    gj581: ['格利泽 581', 'Gliese 581', '红矮星(M3)', '它的行星曾引发「宜居行星」大争论,争论推动了探测方法的进步。', 30, 'exo'],
    lhs1140: ['LHS 1140', 'LHS 1140', '红矮星(M4.5)', '它的行星 LHS 1140 b 在宜居带,可能是一颗冰雪或海洋世界。', 18, 'exo'],
    hd189733: ['HD 189733', 'HD 189733', '橙矮星(K2)', '它的「热木星」呈钴蓝色,大气里刮着每秒数千米的狂风。', 30, 'exo'],
    trappist1: ['TRAPPIST-1', 'TRAPPIST-1', '超冷红矮星(M8)', '只比木星略大的小恒星,却有 7 颗地球大小的行星,其中 3–4 颗在宜居带。', 6, 'exo'],
    teegarden: ['蒂加登星', "Teegarden's Star", '红矮星(M7)', '很暗的红矮星,有 3 颗地球大小的行星,b 是已知最像地球的候选之一。', 21, 'exo']
  };
  var DIP = ['dubhe', 'merak', 'phecda', 'megrez', 'alioth', 'mizar', 'alkaid'];
  var DIP_LINES = [[0, 1], [1, 2], [2, 3], [3, 0], [3, 4], [4, 5], [5, 6]];
  var S = null;   // 解码后的星表
  function decode() {
    var R = window.SH_STARS; if (!R || S) return S;
    var bin = atob(R.d), n = R.n, buf = new ArrayBuffer(bin.length), u8 = new Uint8Array(buf);
    for (var i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    var dv = new DataView(buf), pos = new Float32Array(n * 3), am = new Float32Array(n), ci = new Float32Array(n), ly = new Float32Array(n), col = new Float32Array(n * 3);
    for (var k = 0; k < n; k++) {
      var o = k * 10, x = dv.getInt16(o, true) / 10, y = dv.getInt16(o + 2, true) / 10, z = dv.getInt16(o + 4, true) / 10;
      pos[k * 3] = -x; pos[k * 3 + 1] = z; pos[k * 3 + 2] = y;   // 赤道坐标 → 组内坐标(y = 北天极;与 SHFX3D 星空球贴图同向,已对照北斗/猎户校准),组再按黄赤交角放进场景
      am[k] = dv.getInt16(o + 6, true) / 100; var c = dv.getInt16(o + 8, true); ci[k] = c === 32767 ? NaN : c / 1000;
      ly[k] = Math.sqrt(x * x + y * y + z * z);
      var rgb = tRGB(teff(k === 0 ? 0.656 : ci[k], am[k])); col[k * 3] = rgb[0]; col[k * 3 + 1] = rgb[1]; col[k * 3 + 2] = rgb[2];
    }
    var exo = {}; (R.e || []).forEach(function (p) { exo[p[0]] = p[1]; });
    var key = {}; for (var kk in R.k) key[R.k[kk]] = kk;
    S = { n: n, pos: pos, pos0: new Float32Array(pos), am: am, ci: ci, ly: ly, col: col, exo: exo, k: R.k, key: key, v: R.v || {}, R: R };
    return S;
  }
  // B−V → 有效温度(Ballesteros 2012);缺色指数时按亮度粗估
  function teff(bv, M) {
    if (isNaN(bv)) bv = M > 9 ? 1.5 : M > 5 ? 0.9 : 0.3;
    bv = Math.max(-0.4, Math.min(2.0, bv));
    return 4600 * (1 / (0.92 * bv + 1.7) + 1 / (0.92 * bv + 0.62));
  }
  // 温度 → 显示颜色(黑体近似,略提饱和,保证在深空背景上辨得出红/橙/黄/白/蓝)
  function tRGB(t) {
    var x = t / 100, r, g, b;
    if (x <= 66) { r = 255; g = 99.47 * Math.log(x) - 161.12; b = x <= 19 ? 0 : 138.52 * Math.log(x - 10) - 305.04; }
    else { r = 329.7 * Math.pow(x - 60, -0.1332); g = 288.12 * Math.pow(x - 60, -0.0755); b = 255; }
    function c(v) { return Math.max(0, Math.min(255, v)) / 255; }
    r = c(r); g = c(g); b = c(b);
    var m = (r + g + b) / 3; return [Math.min(1, m + (r - m) * 1.25), Math.min(1, m + (g - m) * 1.25), Math.min(1, m + (b - m) * 1.25)];
  }
  function colorName(t) { return t < 3700 ? '红色' : t < 5200 ? '橙色' : t < 6000 ? '黄色' : t < 7500 ? '黄白色' : t < 10500 ? '白色' : '蓝白色'; }
  function lum(M) { return Math.pow(10, -0.4 * (M - 4.83)); }
  function fmtL(L) { return L >= 100 ? Math.round(L).toLocaleString('en-US') : L >= 1 ? L.toFixed(L < 10 ? 1 : 0) : L >= 0.01 ? L.toFixed(2) : L >= 0.0001 ? (L * 1e4).toFixed(1) + '/万' : '不到万分之一'; }
  function kindOf(i) {
    var k = S.key[i]; if (k && META[k]) return META[k][2];
    var M = S.am[i], t = teff(S.ci[i], M);
    if (M > 10 && t > 7000) return '白矮星(恒星燃尽后的余烬)';
    if (t < 3900 && M > 8) return '红矮星(M 型主序星)';
    if (M < 1 && t < 5500) return '巨星(' + colorName(t) + ')';
    return (t < 5200 ? '橙矮星(K 型' : t < 6000 ? '黄矮星(G 型' : t < 7500 ? '黄白星(F 型' : t < 10000 ? '白色恒星(A 型' : '蓝白色恒星(B 型') + '主序星)';
  }
  function nameOf(i) { var k = S.key[i]; return k && META[k] ? META[k][0] : kindOf(i).replace(/\s*[(（].*$/, '') + ' · 星表 ' + i + ' 号'; }
  function enOf(i) { var k = S.key[i]; return k && META[k] ? META[k][1] : 'HYG v4.1 #' + i; }
  function factOf(i) {
    var k = S.key[i]; if (k && META[k]) return META[k][3];
    var t = kindOf(i);
    if (/红矮星/.test(t)) return '银河系里最多的就是这样的红矮星:又小又冷又长寿,大多数肉眼看不见。';
    if (/白矮星/.test(t)) return '这是一颗已经燃尽的恒星内核,大小和地球差不多,一勺就有好几吨重。';
    if (/巨星/.test(t)) return '一颗已经老去、膨胀起来的恒星。';
    return '100 光年内有四千多颗恒星,大多数没有名字——它也许也有自己的行星。';
  }
  D5.META = META; D5.data = function () { return decode(); }; D5.teff = teff; D5.tRGB = tRGB; D5.lum = lum; D5.colorName = colorName;
  D5.idx = function (k) { decode(); return S && S.k[k] != null ? S.k[k] : -1; };

  /* ---------------- 3D ---------------- */
  var VS = 'uniform float uPx,uExp,uFar,uNear,uK,uA0;attribute vec3 aCol;attribute vec2 aM;varying vec3 vC;varying float vA;' +
    'void main(){vec4 mv=modelViewMatrix*vec4(position,1.);float d=max(length(mv.xyz),1e-5);' +
    'float m=aM.x+5.*log(d/3.26156)/2.302585-5.;float b=clamp((uExp-m)*.16,0.,1.6);' +
    'float s=uK*(1.8+13.*b*b);float a=clamp(uA0+b*.95,0.,1.);a*=smoothstep(uNear*.35,uNear,d);a*=mix(1.,uFar,aM.y);' +
    'vC=aCol;vA=a;gl_PointSize=s*uPx;gl_Position=projectionMatrix*mv;}';
  var FS = 'varying vec3 vC;varying float vA;void main(){vec2 p=gl_PointCoord-.5;float r=length(p)*2.;if(r>1.)discard;' +
    'float core=exp(-r*r*5.);float halo=exp(-r*r*2.2)*.55;vec3 c=vC*(halo+core)+vec3(core*.6);gl_FragColor=vec4(c*vA,1.);}';
  var RING_FS = 'uniform vec3 uC;uniform float uA;void main(){vec2 p=gl_PointCoord-.5;float r=length(p)*2.;float a=smoothstep(.62,.74,r)*(1.-smoothstep(.86,1.,r));gl_FragColor=vec4(uC*a*uA,1.);}';
  var RING_VS = 'uniform float uPx,uS;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);gl_PointSize=uS*uPx;gl_Position=projectionMatrix*mv;}';

  function fxColor(t) {   // 色温 → 特写色:黑体近似 + 提饱和(冷星更橙红、热星更蓝)
    var c = new T.Color(), hsl = {}, x = t / 100, r, g, b;
    r = x <= 66 ? 255 : 329.7 * Math.pow(x - 60, -0.1332);
    g = x <= 66 ? 99.47 * Math.log(x) - 161.12 : 288.12 * Math.pow(x - 60, -0.0755);
    b = x >= 66 ? 255 : x <= 19 ? 0 : 138.52 * Math.log(x - 10) - 305.04;
    c.setRGB(Math.min(255, Math.max(0, r)) / 255, Math.min(255, Math.max(0, g)) / 255, Math.min(255, Math.max(0, b)) / 255);
    c.getHSL(hsl);
    var sat = t < 5300 ? Math.min(1, hsl.s * 2.4 + 0.25) : t < 6500 ? Math.min(1, hsl.s * 1.6) : Math.min(1, hsl.s * 1.8 + 0.1);
    c.setHSL(hsl.h, sat, t < 5300 ? 0.52 : t < 6500 ? 0.6 : 0.62);
    return [c.r, c.g, c.b];
  }
  function starFx(rgb) {   // 特写恒星:着色器光球(噪声纹理 + 临边昏暗)+ 边缘壳层 + 面向镜头的冕(规范 §2)
    var g = new T.Group(), U = { uT: { value: 0 }, uC: { value: new T.Color(rgb[0], rgb[1], rgb[2]) } };
    var noise = 'float hs(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}' +
      'float vn(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);return mix(mix(mix(hs(i),hs(i+vec3(1,0,0)),f.x),mix(hs(i+vec3(0,1,0)),hs(i+vec3(1,1,0)),f.x),f.y),mix(mix(hs(i+vec3(0,0,1)),hs(i+vec3(1,0,1)),f.x),mix(hs(i+vec3(0,1,1)),hs(i+vec3(1,1,1)),f.x),f.y),f.z);}' +
      'float fb(vec3 p){float s=0.,a=.5;for(int i=0;i<4;i++){s+=a*vn(p);p*=2.1;a*=.5;}return s;}';
    var core = new T.Mesh(new T.SphereGeometry(1, 64, 32), new T.ShaderMaterial({ uniforms: U,
      vertexShader: 'varying vec3 vP;varying vec3 vN;varying vec3 vV;void main(){vP=position;vN=normalize(normalMatrix*normal);vec4 mv=modelViewMatrix*vec4(position,1.);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',
      fragmentShader: 'uniform float uT;uniform vec3 uC;varying vec3 vP;varying vec3 vN;varying vec3 vV;' + noise +
        'void main(){vec3 p=normalize(vP);float gr=fb(p*14.+vec3(0.,uT*.05,uT*.03));float sg=fb(p*3.+uT*.01);float mu=clamp(dot(vN,vV),0.,1.);' +
        'float k=.55+.5*gr+.15*sg;vec3 c=uC*k*(.35+.85*pow(mu,.6));c+=uC*pow(k,5.)*.18;gl_FragColor=vec4(c,1.);}' }));
    g.add(core);
    var shell = new T.Mesh(new T.SphereGeometry(1.05, 48, 24), new T.ShaderMaterial({ uniforms: U, transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.BackSide,
      vertexShader: 'varying vec3 vN;varying vec3 vV;void main(){vN=normalize(normalMatrix*normal);vec4 mv=modelViewMatrix*vec4(position,1.);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',
      fragmentShader: 'uniform vec3 uC;varying vec3 vN;varying vec3 vV;void main(){float f=pow(1.-abs(dot(vN,vV)),4.);gl_FragColor=vec4(uC*f*1.4,1.);}' }));
    g.add(shell);
    var cor = new T.Mesh(new T.PlaneGeometry(9, 9), new T.ShaderMaterial({ uniforms: U, transparent: true, depthWrite: false, blending: T.AdditiveBlending,
      vertexShader: 'varying vec2 vU;void main(){vU=uv*2.-1.;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader: 'uniform float uT;uniform vec3 uC;varying vec2 vU;' + noise +
        'void main(){float r=length(vU)*4.5;if(r<.98)discard;float a=atan(vU.y,vU.x);float ray=fb(vec3(cos(a)*2.5,sin(a)*2.5,uT*.05));ray=pow(ray,1.6);' +
        'float fall=exp(-(r-1.)*2.2);float s=fall*(.4+1.3*ray)+exp(-(r-1.)*.8)*.15;gl_FragColor=vec4(mix(uC,vec3(1.),fall*.5)*s,1.);}' }));
    cor.renderOrder = 2; g.add(cor);
    return { group: g, U: U, cor: cor, set: function (c) { U.uC.value.setRGB(c[0], c[1], c[2]); }, update: function (dt, cam) { U.uT.value += dt * (reduced() ? 0.25 : 1); cor.quaternion.copy(cam.quaternion); } };
  }

  function build() {
    T = window.THREE; decode();
    var root = D5.root = h('div', 'sh5');
    root.innerHTML = '<canvas class="sh5-cv"></canvas><div class="sh5-lbls"></div>' +
      '<div class="sh5-info"><div class="sh5-kick">星域 V · 群星 · 守星人 织女</div><div class="sh5-rows"></div></div>' +
      '<div class="sh5-note">恒星位置、距离为真实数据(HYG 恒星库 v4.1 · CC BY-SA 4.0);系外行星:NASA 系外行星档案。推近后恒星的大小为示意。</div>' +
      '<div class="sh5-bar"><button type="button" data-a="sun">☉ 站在太阳旁看星空</button><button type="button" data-a="all">⤢ 100 光年全景</button><button type="button" data-a="dipper">✦ 北斗七星</button><button type="button" data-a="exo">◎ 系外行星</button></div>' +
      '<button class="sh5-back" type="button">← 回到家园</button>';
    document.body.appendChild(root);
    root.querySelector('.sh5-back').onclick = function () { if (window.SHDOM) SHDOM.go(1); else close(); };
    root.querySelector('.sh5-bar').onclick = function (e) {
      var b = e.target.closest('button[data-a]'); if (!b) return; P('click');
      var a = b.dataset.a;
      if (a === 'sun') sunView(); else if (a === 'all') overview(); else if (a === 'dipper') dipperView(); else exoTour();
    };
    var cv = root.querySelector('.sh5-cv'), rd = null;
    try { rd = new T.WebGLRenderer({ canvas: cv, antialias: true }); } catch (e) { rd = null; }
    if (!rd) { console.warn('[SHD5] WebGL 不可用,改用 2D 星图'); }
    G = { rd: rd, cv: cv, ctx2d: rd ? null : cv.getContext('2d') };
    var cam = G.cam = new T.PerspectiveCamera(55, 1, 0.0005, 30000);
    var sc = G.sc = new T.Scene();
    var grp = G.grp = new T.Group(); grp.rotation.x = -EPS; sc.add(grp);   // 组内 = 赤道坐标(y 北天极);组本身按黄赤交角放进场景,与星空球一致
    if (rd) {
      rd.setPixelRatio(Math.min(small() ? 1.5 : 2, devicePixelRatio || 1));
      if ('outputColorSpace' in rd && T.SRGBColorSpace) rd.outputColorSpace = T.SRGBColorSpace; else if (T.sRGBEncoding) rd.outputEncoding = T.sRGBEncoding;
      G.sky = window.SHFX3D ? SHFX3D.skyMesh(rd, 20000, 0x3c3e46) : null;
      if (G.sky) sc.add(G.sky);
      // 恒星粒子
      var geo = new T.BufferGeometry(), am2 = new Float32Array(S.n * 2);
      for (var i = 0; i < S.n; i++) { am2[i * 2] = S.am[i]; am2[i * 2 + 1] = S.ly[i] > 100.5 ? 1 : 0; }
      geo.setAttribute('position', new T.BufferAttribute(S.pos, 3)); geo.setAttribute('aCol', new T.BufferAttribute(S.col, 3)); geo.setAttribute('aM', new T.BufferAttribute(am2, 2));
      geo.boundingSphere = new T.Sphere(new T.Vector3(), 4000);
      G.U = { uPx: { value: rd.getPixelRatio() }, uExp: { value: 12.5 }, uFar: { value: 0.3 }, uNear: { value: 0.5 }, uK: { value: small() ? 0.85 : 1 }, uA0: { value: 0.16 } };
      G.pts = new T.Points(geo, new T.ShaderMaterial({ uniforms: G.U, vertexShader: VS, fragmentShader: FS, transparent: true, depthWrite: false, blending: T.AdditiveBlending }));
      G.pts.frustumCulled = false; grp.add(G.pts);
      // 系外行星宿主光环
      var ex = Object.keys(S.exo), ep = new Float32Array(ex.length * 3);
      ex.forEach(function (ix, j) { ix = +ix; ep[j * 3] = S.pos[ix * 3]; ep[j * 3 + 1] = S.pos[ix * 3 + 1]; ep[j * 3 + 2] = S.pos[ix * 3 + 2]; });
      var eg = new T.BufferGeometry(); eg.setAttribute('position', new T.BufferAttribute(ep, 3));
      G.UE = { uPx: G.U.uPx, uS: { value: small() ? 7 : 8 }, uC: { value: new T.Color(0x7fd6ff) }, uA: { value: 0.45 } };
      G.exoPts = new T.Points(eg, new T.ShaderMaterial({ uniforms: G.UE, vertexShader: RING_VS, fragmentShader: RING_FS, transparent: true, depthWrite: false, blending: T.AdditiveBlending }));
      G.exoPts.frustumCulled = false; grp.add(G.exoPts);
      // 太阳标记(金色光环)
      var sg = new T.BufferGeometry(); sg.setAttribute('position', new T.BufferAttribute(new Float32Array(3), 3));
      G.US = { uPx: G.U.uPx, uS: { value: 20 }, uC: { value: new T.Color(0xf0c97a) }, uA: { value: 0.9 } };
      G.sunMk = new T.Points(sg, new T.ShaderMaterial({ uniforms: G.US, vertexShader: RING_VS, fragmentShader: RING_FS, transparent: true, depthWrite: false, blending: T.AdditiveBlending }));
      grp.add(G.sunMk);
      // 距离刻度环(赤道面,25 / 50 / 100 光年)
      G.rings = new T.Group(); grp.add(G.rings);
      [25, 50, 100].forEach(function (r) {
        var pts = []; for (var a = 0; a <= 128; a++) { var t = a / 128 * Math.PI * 2; pts.push(new T.Vector3(Math.cos(t) * r, 0, Math.sin(t) * r)); }
        G.rings.add(new T.Line(new T.BufferGeometry().setFromPoints(pts), new T.LineBasicMaterial({ color: 0x7fd6ff, transparent: true, opacity: r === 100 ? 0.26 : 0.14, depthWrite: false, blending: T.AdditiveBlending })));
      });
      // 北斗连线
      G.dipGeo = new T.BufferGeometry(); G.dipGeo.setAttribute('position', new T.BufferAttribute(new Float32Array(DIP_LINES.length * 6), 3));
      G.dip = new T.LineSegments(G.dipGeo, new T.LineBasicMaterial({ color: 0xf0c97a, transparent: true, opacity: 0.0, depthWrite: false, blending: T.AdditiveBlending }));
      G.dip.frustumCulled = false; grp.add(G.dip); dipLines();
      // 特写恒星
      G.fx = starFx([1, 0.9, 0.7]); G.fx.group.visible = false; grp.add(G.fx.group);
    }
    var ctl = G.ctl = new T.OrbitControls(cam, cv); ctl.enableDamping = true; ctl.dampingFactor = 0.08; ctl.enablePan = false; ctl.minDistance = 0.002; ctl.maxDistance = 900; ctl.rotateSpeed = 0.6;
    ctl.addEventListener('start', function () { G.fly = null; ctl.autoRotate = false; });
    // 标签
    var L = root.querySelector('.sh5-lbls'); G.lbl = {}; G.lblKeys = Object.keys(META).filter(function (k) { return S.k[k] != null; });
    G.lblKeys.forEach(function (k) {
      var m = META[k], b = h('button', 'sh5-l' + (m[5] ? ' sh5-l--' + m[5] : ''), k === 'dubhe' ? '★ 天枢 <small>本世界同名星</small>' : k === 'sol' ? '太阳 <small>你在这里</small>' : (m[5] === 'exo' ? '◎ ' : '') + m[0]);
      b.type = 'button'; b.style.display = 'none'; b.onclick = function () { pick(S.k[k], true); }; L.appendChild(b); G.lbl[k] = b;
    });
    G.rlbl = [25, 50, 100].map(function (r) { var e = h('div', 'sh5-rl', r + ' 光年'); L.appendChild(e); return e; });
    // 点选
    var down = null;
    cv.addEventListener('pointerdown', function (e) { down = [e.clientX, e.clientY]; });
    cv.addEventListener('pointerup', function (e) {
      if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 6) return;
      var r = cv.getBoundingClientRect(), i = hitTest(e.clientX - r.left, e.clientY - r.top); if (i >= 0) pick(i, true);
    });
    addEventListener('resize', function () { if (D5.open) resize(); });
    document.addEventListener('visibilitychange', function () { if (D5.open && !document.hidden) { last = performance.now(); } });
  }
  function resize() { var w = innerWidth, hh = innerHeight; if (G.rd) G.rd.setSize(w, hh, false); else { G.cv.width = w; G.cv.height = hh; } G.cam.aspect = w / hh; viewOff(); G.cam.updateProjectionMatrix(); }
  // 手机上任务面板占下半屏:把画面中心往上挪,让北斗留在上半屏
  function viewOff() { var w = innerWidth, hh = innerHeight; if (small() && D5.mode === 'constel') G.cam.setViewOffset(w, hh, 0, Math.round(hh * 0.24), w, hh); else if (G.cam.view && G.cam.view.enabled) G.cam.clearViewOffset(); }

  /* ---------- 坐标 ---------- */
  var tv = null;
  function wpos(i, out) { out = out || new T.Vector3(); out.set(S.pos[i * 3], S.pos[i * 3 + 1], S.pos[i * 3 + 2]); return out.applyMatrix4(G.grp.matrixWorld); }
  function appMag(i, camPos) { var p = wpos(i, tv), d = Math.max(1e-5, p.distanceTo(camPos)); return S.am[i] + 5 * Math.log10(d / 3.26156) - 5; }
  function sizePx(i, camPos) { var b = Math.max(0, Math.min(1.6, ((G.U ? G.U.uExp.value : 12.5) - appMag(i, camPos)) * 0.16)); return (1.8 + 13 * b * b) * (G.U ? G.U.uK.value : 1); }
  function hitTest(x, y) {
    G.grp.updateMatrixWorld(); G.cam.updateMatrixWorld();
    var W = innerWidth, H = innerHeight, cp = G.cam.position, best = -1, bs = 1e9, v = new T.Vector3();
    for (var i = 0; i < S.n; i++) {
      if (G.U && G.U.uFar.value < 0.2 && S.ly[i] > 100.5) continue;
      wpos(i, v); var d = v.distanceTo(cp); if (d < 0.05) continue; v.project(G.cam); if (v.z > 1) continue;
      var sx = (v.x + 1) / 2 * W, sy = (1 - v.y) / 2 * H, dd = Math.hypot(sx - x, sy - y), r = sizePx(i, cp) / 2 + 9;
      if (dd > r) continue; var sc = dd - r * 0.6;   // 同样近时,亮的(画得大的)优先
      if (sc < bs) { bs = sc; best = i; }
    }
    return best;
  }
  function screenPt(i) {
    var v = wpos(i); v.project(G.cam); if (v.z > 1 || Math.abs(v.x) > 1.1 || Math.abs(v.y) > 1.1) return null;
    return { x: (v.x + 1) / 2 * innerWidth, y: (1 - v.y) / 2 * innerHeight, r: 14 };
  }
  D5.screenPt = function (k) { var i = typeof k === 'number' ? k : D5.idx(k); return i >= 0 && G ? screenPt(i) : null; };

  /* ---------- 北斗:连线与随时间移动(只移动北斗七星,用 HYG 空间速度) ---------- */
  function dipLines() {
    if (!G.dipGeo) return; var a = G.dipGeo.attributes.position.array, j = 0;
    DIP_LINES.forEach(function (l) { [l[0], l[1]].forEach(function (q) { var i = S.k[DIP[q]]; a[j++] = S.pos[i * 3]; a[j++] = S.pos[i * 3 + 1]; a[j++] = S.pos[i * 3 + 2]; }); });
    G.dipGeo.attributes.position.needsUpdate = true;
  }
  D5.setEpoch = function (yr) {
    decode(); D5.epoch = yr;
    DIP.forEach(function (k) {
      var i = S.k[k], v = S.v[k] || [0, 0, 0];   // 光年/年(赤道 x,y,z)
      S.pos[i * 3] = S.pos0[i * 3] - v[0] * yr; S.pos[i * 3 + 1] = S.pos0[i * 3 + 1] + v[2] * yr; S.pos[i * 3 + 2] = S.pos0[i * 3 + 2] + v[1] * yr;
      var x = S.pos[i * 3], y = S.pos[i * 3 + 1], z = S.pos[i * 3 + 2]; S.ly[i] = Math.sqrt(x * x + y * y + z * z);
    });
    if (G && G.pts) G.pts.geometry.attributes.position.needsUpdate = true;
    if (G) dipLines();
  };
  function dipCentroid() { var c = new T.Vector3(), v = new T.Vector3(); DIP.slice(1, 6).forEach(function (k) { c.add(wpos(S.k[k], v)); }); return c.multiplyScalar(1 / 5); }
  // 飞船:从太阳出发,沿垂直于北斗方向侧飞 ly 光年,始终朝北斗看
  D5.setShip = function (ly) {
    D5.ship = ly; if (!G) return;
    var c = dipCentroid(), dir = c.clone().normalize(), side = new T.Vector3(0, 1, 0).cross(dir).normalize();
    G.fly = null; G.ctl.autoRotate = false;
    var p = side.multiplyScalar(ly); G.cam.position.copy(p); G.ctl.target.copy(c); G.cam.fov = small() ? 62 : 48; G.cam.updateProjectionMatrix();
  };

  /* ---------- 镜头 ---------- */
  function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function flyTo(target, dist, ms, dir) {
    var c = G.cam, t0 = G.ctl.target.clone(), off = c.position.clone().sub(t0), d0 = Math.max(1e-4, off.length()), u0 = off.normalize();
    var u1 = (dir || u0.clone().lerp(new T.Vector3(0, 0.35, 0).add(u0), 0.4)).clone().normalize();
    G.fly = { t0ms: performance.now(), ms: reduced() ? 400 : (ms || 2400), t0: t0, t1: target.clone(), d0: d0, d1: dist, u0: u0, u1: u1 };
    G.ctl.autoRotate = false; G.ctl.minDistance = Math.min(G.ctl.minDistance, dist * 0.6);
  }
  function stepFly(dt) {
    var F = G.fly; if (!F) return; var k = Math.min(1, (performance.now() - F.t0ms) / F.ms), e = ease(k), e2 = ease(Math.min(1, k * 1.1));
    var tg = F.t0.clone().lerp(F.t1, e), d = Math.exp(Math.log(F.d0) + (Math.log(F.d1) - Math.log(F.d0)) * e2), u = F.u0.clone().lerp(F.u1, e).normalize();
    G.ctl.target.copy(tg); G.cam.position.copy(tg).addScaledVector(u, d);
    if (k >= 1) { G.fly = null; if (F.done) F.done(); }
  }
  function setLook(mode) {
    D5.mode = mode;
    var U = G.U; if (!U) return;
    if (mode === 'sky' || mode === 'constel') { U.uExp.value = 8.2; U.uA0.value = 0.0; } else { U.uExp.value = 11.8; U.uA0.value = 0.3; }
  }
  function overview() {
    D5.focus = -1; setMode('overview'); if (G.cam.fov !== 55) { G.cam.fov = 55; G.cam.updateProjectionMatrix(); }
    var d = small() ? 330 : 240; flyTo(new T.Vector3(), d, 2600, new T.Vector3(0.55, 0.62, 0.56));
    G.fly.done = function () { G.ctl.autoRotate = !reduced(); G.ctl.autoRotateSpeed = 0.25; };
    G.ctl.minDistance = 0.002;
    guide('这是太阳周围约 100 光年里的真实恒星。颜色代表温度,越亮画得越大。点任意一颗星,看看它的光走了多少年才到你眼里。');
  }
  function sunView() {
    D5.focus = -1; setMode('sky'); if (G.cam.fov !== 60) { G.cam.fov = 60; G.cam.updateProjectionMatrix(); }
    var c = dipCentroid().normalize();
    flyTo(c.clone().multiplyScalar(0.02), 0.02, 2600, c.clone().negate());
    guide('现在你站在太阳旁边,看到的就是地球夜空里的星星。拖动看看四周:找得到北斗七星和天狼星吗?');
  }
  function dipperView() {
    D5.focus = -1; setMode('sky'); if (G.cam.fov !== 50) { G.cam.fov = small() ? 62 : 50; G.cam.updateProjectionMatrix(); }
    var c = dipCentroid(), dir = c.clone().normalize();
    flyTo(dir.clone().multiplyScalar(30), 30, 2800, dir.clone().negate());   // 站在太阳附近,朝北斗看
    if (G.dip) G.dip.material.opacity = 0.7;
    guide('北斗七星像一把勺子。第一颗「天枢」就是这个世界的名字来源。它们看起来挨在一起,其实远近差了四十多光年。点天枢看看。');
  }
  function exoTour() {
    var i = S.k.trappist1; pick(i, true);
    guide('青色小圆环标出的,都是已经确认有行星的恒星:100 光年内有 300 多个这样的系统。TRAPPIST-1 有 7 颗地球大小的行星。');
  }
  function setMode(m) {
    setLook(m === 'constel' ? 'constel' : m);
    if (G.dip) G.dip.material.opacity = (m === 'constel' || m === 'sky') ? 0.6 : 0.25;
  }
  D5.overview = function () { if (G) overview(); }; D5.sunView = function () { if (G) sunView(); }; D5.dipperView = function () { if (G) dipperView(); };
  D5.constel = function (on) {
    if (!G) return;
    if (on) { D5.focus = -1; if (window.SHHUD && SHHUD.hideNow) SHHUD.hideNow(); setMode('constel'); G.ctl.enabled = false; D5.setShip(D5.ship || 0); if (G.dip) G.dip.material.opacity = 0.85; }
    else { G.ctl.enabled = true; D5.setEpoch(0); D5.ship = 0; setMode('sky'); }
    viewOff(); G.cam.updateProjectionMatrix();
  };

  /* ---------- 点星:此刻卡 + 一镜到底 ---------- */
  function rVis(i) { var t = kindOf(i); return /超巨星/.test(t) ? 0.06 : /巨星/.test(t) ? 0.035 : /白矮星/.test(t) ? 0.006 : /红矮星|超冷/.test(t) ? 0.009 : 0.016; }   // 示意大小(光年)
  function pick(i, fly) {
    if (i < 0 || !G) return; if (D5.mode === 'constel') { showCard(i); return; }
    D5.focus = i; P('lock'); showCard(i);
    var k = S.key[i];
    guide(k === 'dubhe' ? '这就是天枢——北斗第一星,也是我们这个世界的名字。你此刻看到的天枢光,是 120 多年前、清朝末年出发的。' :
      k === 'vega' ? '这是我的星。你看到的我,是 25 年前的样子。要是我此刻发生了什么,你还要再等 25 年才知道。' :
      '你看到的' + nameOf(i).replace(/ · 星表.*/, '') + ',是 ' + fmtLy(S.ly[i]) + ' 年前的样子。光从那里出发时,地球上是 ' + (year() - Math.round(S.ly[i])) + ' 年前后。');
    if (fly !== false) push(i);
    if (window.SHDOM) SHDOM.tick(true);
  }
  function push(i) {
    var p = wpos(i), r = rVis(i), cp = G.cam.position, dir = cp.clone().sub(p).normalize();
    if (i === 0) dir = new T.Vector3(0.4, 0.3, 0.86).normalize();
    var rgb = fxColor(i === 0 ? 5772 : teff(S.ci[i], S.am[i]));   // M4b:特写按温度取饱和色(橙巨星要真橙,不再奶油色)
    if (G.fx) { G.fx.set(rgb); G.fx.group.position.set(S.pos[i * 3], S.pos[i * 3 + 1], S.pos[i * 3 + 2]); G.fx.group.scale.setScalar(r); G.fx.group.visible = true; } G.fxIdx = i;
    setMode(D5.mode === 'sky' ? 'sky' : 'overview'); D5.mode = 'focus';
    flyTo(p, r * 4.2, 3200, dir.add(new T.Vector3(0, 0.25, 0)).normalize());
    G.ctl.minDistance = r * 1.6; P('whoosh', 3.2);
  }
  function fmtLy(ly) { return ly < 10 ? ly.toFixed(2) : ly < 100 ? ly.toFixed(1) : Math.round(ly).toString(); }
  D5.fmtLy = fmtLy;
  function showCard(i) { if (!window.SHHUD) return; SHHUD.showNow('s5:' + i, null, ['◎ 推近 / 环绕', '⤢ 回到全景']); }
  function patchCard() {
    if (!window.SHNOW || D5.patched) return; D5.patched = true;
    var orig = SHNOW.card;
    SHNOW.card = function (el, body, d) {
      if (!/^s5:\d+$/.test(body || '')) return orig(el, body, d);
      var i = +body.slice(3), ly = S.ly[i], M = S.am[i], t = teff(i === 0 ? 0.656 : S.ci[i], M), L = lum(M), y = (d || new Date()).getFullYear();
      var o = { id: body, name: i === S.k.dubhe ? '天枢 · 本世界同名星' : nameOf(i), en: enOf(i), distKm: i === 0 ? 149597870.7 : ly * LYKM, badge: i === 0 ? '实时' : '星表数据', source: 'HYG 恒星库 v4.1(CC BY-SA 4.0)' + (S.exo[i] ? ' · NASA 系外行星档案' : '') };
      var rows = i === 0 ? [['你看到的是', '8 分 20 秒前的它'], ['颜色 · 温度', '黄白色 · 约 5 772 K'], ['亮度', '1 个太阳(以它为尺子)'], ['类型', kindOf(i)], ['趣闻', factOf(i)]] : [
        ['你看到的是', '<b class="sh5-y">' + fmtLy(ly) + ' 年前</b>的它'], ['星光出发于', ly < 1 ? '不到一年前' : '约公元 ' + Math.round(y - ly) + ' 年'],
        ['颜色 · 温度', colorName(t) + ' · 约 ' + (Math.round(t / 100) * 100).toLocaleString('en-US') + ' K'], ['亮度', '约 ' + fmtL(L) + ' 个太阳(可见光)'],
        ['类型', kindOf(i)]];
      if (i && S.exo[i]) rows.push(['行星', S.exo[i] + ' 颗已确认的系外行星']);
      if (i) rows.push(['趣闻', factOf(i)]);
      var hh = '<div class="shnow-h"><b>' + o.name + '</b><small>' + o.en + '</small></div>';
      rows.forEach(function (r) { hh += '<div class="shnow-r' + (r[0] === '趣闻' ? ' sh5-fact' : '') + '"><span>' + r[0] + '</span><span>' + r[1] + '</span></div>'; });
      hh += '<div class="shnow-s">' + o.source + '</div>';
      el.innerHTML = hh; return o;
    };
  }

  /* ---------- 标签 ---------- */
  var lp = null;
  function labels() {
    var W = innerWidth, H = innerHeight, cp = G.cam.position, sunD = cp.length(), boxes = [], v = lp || (lp = new T.Vector3());
    var sm = small(), cap = sm ? 9 : 22, n = 0, cm = D5.mode === 'constel';
    var order = G.lblKeys.slice().sort(function (a, b) { return META[a][4] - META[b][4]; });
    order.forEach(function (k) {
      var el = G.lbl[k], m = META[k], i = S.k[k], show = true;
      if (cm) show = m[5] === 'dip' || m[5] === 'dubhe';
      else if (m[5] === 'far') show = sunD < 60;
      else if (m[5] === 'dip' && k !== 'dubhe') show = D5.mode === 'sky' || (D5.focus >= 0 && DIP.indexOf(S.key[D5.focus]) >= 0);
      if (k === 'alcor') show = show && sunD > 60 && sunD < 120;
      if (show && n >= cap && k !== 'dubhe') show = false;
      if (show) {
        wpos(i, v); var dd = v.distanceTo(cp); if (dd < 0.03 || (i === D5.focus && dd < 0.6)) show = false;
        v.project(G.cam); if (v.z > 1 || (k !== 'dubhe' && (Math.abs(v.x) > 1.02 || Math.abs(v.y) > 1.02))) show = false;
      }
      if (show) {
        var x = (v.x + 1) / 2 * W, y = (1 - v.y) / 2 * H, bw = (k === 'dubhe' ? 130 : 22 + m[0].length * 14), b = [x + 8, y - 22, x + 8 + bw, y];
        var safeTop = (sm ? 100 : 122), safeBot = H - (sm ? 90 : 120), edge = false;
        if (k === 'dubhe') {   // M4b:天枢标签不再被顶栏/边缘吞掉 —— 出了安全区就贴边显示并加方向箭头
          var y0 = y, x0 = x; y = Math.max(safeTop + 22, Math.min(safeBot, y)); x = Math.max(8, Math.min(W - bw - 24, x));
          edge = y !== y0 || x !== x0; el.classList.toggle('is-edge', edge); el.dataset.dir = y0 < y ? 'up' : y0 > y ? 'down' : x0 < x ? 'left' : 'right';
          b = [x + 8, y - 22, x + 8 + bw, y]; boxes.push(b); n++; el.style.transform = 'translate(' + Math.round(x + 8) + 'px,' + Math.round(y - 22) + 'px)';
        } else if (y < safeTop || y > safeBot) show = false;
        else if (k !== 'dubhe' && boxes.some(function (q) { return b[0] < q[2] && b[2] > q[0] && b[1] < q[3] && b[3] > q[1]; })) show = false;
        else { boxes.push(b); n++; el.style.transform = 'translate(' + Math.round(x + 8) + 'px,' + Math.round(y - 22) + 'px)'; }
      }
      el.style.display = show ? '' : 'none';
      el.classList.toggle('is-cur', i === D5.focus);
    });
    // 距离环标签
    [25, 50, 100].forEach(function (r, j) {
      var e = G.rlbl[j], vis = D5.mode === 'overview' || (D5.mode === 'focus' && sunD > 40);
      if (vis) { v.set(r, 0, 0).applyMatrix4(G.grp.matrixWorld).project(G.cam); vis = v.z < 1 && Math.abs(v.x) < 1 && Math.abs(v.y) < 1; if (vis) e.style.transform = 'translate(' + Math.round((v.x + 1) / 2 * W + 4) + 'px,' + Math.round((1 - v.y) / 2 * H) + 'px)'; }
      e.style.display = vis ? '' : 'none';
    });
  }
  function info() {
    var cp = G.cam.position, sunLy = cp.length(), y = year();
    var rows = [['镜头离太阳', fmtLy(sunLy) + ' 光年', sunLy < 0.5 ? '就在太阳旁边' : '光要走 ' + fmtLy(sunLy) + ' 年'],
      ['100 光年内', '4 000+ 颗恒星', '肉眼能看到的约 470 颗'],
      ['系外行星', S.R.exoNearSys + ' 个系统', '全天已确认 ' + S.R.exoTotal.toLocaleString('en-US') + ' 颗(截至 ' + S.R.asOf + ')']];
    if (D5.mode === 'constel') rows[0] = ['飞船离太阳', fmtLy(D5.ship) + ' 光年', '时间 公元 ' + Math.round(y + D5.epoch) + ' 年'];
    var html = rows.map(function (r) { return '<div class="sh2-r"><small>' + r[0] + '</small><b>' + r[1] + '</b><i>' + r[2] + '</i></div>'; }).join('');
    if (html !== D5.lastInfo) { D5.lastInfo = html; D5.root.querySelector('.sh5-rows').innerHTML = html; }
  }

  /* ---------- 2D 退回(无 WebGL) ---------- */
  function draw2d() {
    var g = G.ctx2d, W = G.cv.width, H = G.cv.height, v = new T.Vector3(), cp = G.cam.position;
    g.fillStyle = '#02040a'; g.fillRect(0, 0, W, H);
    var sky = D5.mode === 'sky' || D5.mode === 'constel', ex = sky ? 8.2 : 11.8, a0 = sky ? 0 : 0.3;
    for (var i = 0; i < S.n; i++) {
      if (S.ly[i] > 100.5 && cp.length() > 60) continue;
      wpos(i, v); var d = v.distanceTo(cp); if (d < 0.05) continue; v.project(G.cam); if (v.z > 1) continue;
      var x = (v.x + 1) / 2 * W, y = (1 - v.y) / 2 * H; if (x < -5 || y < -5 || x > W + 5 || y > H + 5) continue;
      var m = S.am[i] + 5 * Math.log10(d / 3.26156) - 5, b = Math.max(0, Math.min(1.6, (ex - m) * 0.16)), s = Math.max(0.5, (1.8 + 13 * b * b) * 0.2), a = Math.min(1, a0 + b * 0.95);
      g.fillStyle = 'rgba(' + Math.round(S.col[i * 3] * 255) + ',' + Math.round(S.col[i * 3 + 1] * 255) + ',' + Math.round(S.col[i * 3 + 2] * 255) + ',' + a.toFixed(2) + ')';
      if (a < 0.02) continue; g.beginPath(); g.arc(x, y, s, 0, 6.283); g.fill();
    }
  }

  /* ---------- 循环 ---------- */
  var acc = 0;
  function loop(t) {
    raf = requestAnimationFrame(loop); if (document.hidden) return;
    var dt = Math.max(0, Math.min(0.1, (t - last) / 1000 || 0)); last = Math.max(last, t);
    stepFly(dt); G.ctl.update();
    var cp = G.cam.position, sunD = cp.length();
    if (G.rd) {
      G.U.uFar.value = Math.max(0.12, Math.min(1, 1 - (sunD - 40) / 80));
      var fd = G.fxIdx != null ? cp.distanceTo(wpos(G.fxIdx, new T.Vector3())) : 1e9;
      G.U.uNear.value = G.fx.group.visible && fd < 1 ? Math.max(0.05, rVis(G.fxIdx) * 12) : 0.08;
      G.fx.group.visible = fd < 3 && D5.mode !== 'constel';
      G.exoPts.visible = D5.mode !== 'constel' && sunD > 1; G.UE.uA.value = D5.mode === 'sky' ? 0.3 : 0.45;
      G.sunMk.visible = sunD > 2; G.rings.visible = D5.mode === 'overview' || (D5.mode === 'focus' && sunD > 40);
      if (G.sky) G.sky.position.copy(cp);
      G.cam.near = Math.max(0.0002, Math.min(0.5, G.ctl.target.distanceTo(cp) * 0.02)); G.cam.updateProjectionMatrix();
      if (G.fx.group.visible) G.fx.update(dt, G.cam);
      G.rd.render(G.sc, G.cam);
    } else draw2d();
    labels();
    if ((acc += dt) > 0.3) { acc = 0; info(); }
  }
  function pauseLE(p) {
    var lr = window.LE && LE.scene && LE.scene.renderer; if (!lr) return;
    if (p) { if (!leRender) { leRender = lr.render; lr.render = function () { }; } }
    else if (leRender) { lr.render = leRender; leRender = null; }
  }
  function open(view) {
    if (!window.THREE || !window.SH_STARS || !THREE.OrbitControls) return false;
    if (!D5.root) try { build(); } catch (e) { console.warn('[SHD5] 构建失败', e); return false; }
    patchCard();
    if (!D5.open) {
      D5.open = true; D5.root.hidden = false; document.body.classList.add('sh5-on'); pauseLE(true);
      resize(); G.cam.position.set(600, 420, 600); G.ctl.target.set(0, 0, 0); G.cam.lookAt(0, 0, 0); G.ctl.enabled = true;
      cancelAnimationFrame(raf); last = performance.now(); raf = requestAnimationFrame(loop);
      P('whoosh', 3.2);
    }
    if (view === 'sky') sunView(); else if (view === 'dipper') dipperView(); else if (view !== 'keep') overview();
    return true;
  }
  function close() {
    if (!D5.open) return; D5.open = false; D5.root.hidden = true; document.body.classList.remove('sh5-on');
    cancelAnimationFrame(raf); pauseLE(false); if (D5.mode === 'constel') D5.constel(false); D5.focus = -1;
    if (window.SHHUD && SHHUD.nowBody && /^s5:/.test(SHHUD.nowBody() || '')) SHHUD.hideNow();
    if (window.SH && SH.d5Close) SH.d5Close();
    if (window.SHDOM && SHDOM.tick) SHDOM.tick(true);
  }
  D5.isOpen = function () { return D5.open; };
  D5._dbg = function () { return { acc: acc, last: last, raf: raf }; };
  D5.camKm = function () { if (!G) return 1e14; if (D5.mode === 'sky' || D5.mode === 'constel') return 100 * LYKM; return Math.max(0.05, G.cam.position.distanceTo(G.ctl.target)) * LYKM; };
  D5.crumb = function () { if (D5.mode === 'constel') return '北斗七星'; if (D5.focus >= 0) return D5.focus === S.k.dubhe ? '天枢' : nameOf(D5.focus).replace(/ · 星表.*/, ''); return D5.mode === 'sky' ? '太阳旁的星空' : '100 光年恒星场'; };
  D5.pick = function (k, fly) { decode(); var i = typeof k === 'number' ? k : S.k[k]; if (!D5.open) open('keep'); pick(i, fly); };
  D5.focusKey = function (k) { D5.pick(k, true); };
  D5.open = false; D5.go = open; D5.close = close; D5._G = function () { return G; };
  D5.nameOf = function (i) { decode(); return nameOf(i); }; D5.kindOf = function (i) { decode(); return kindOf(i); };
  window.SHD5 = D5;
  // 兼容 SHD2 风格的布尔接口
  Object.defineProperty(D5, 'opened', { get: function () { return D5.open; } });

  /* ---------- 样式(本星域自带,不改公共 CSS) ---------- */
  var css = '.sh5{position:fixed;inset:0;z-index:35;background:#02040a}.sh5[hidden]{display:none}' +
    '.sh5-cv{position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none;cursor:grab}' +
    'body.sh5-on .le-actions,body.sh5-on .le-bottom,body.sh5-on .le-labels,body.sh5-on .le-sheet,body.sh5-on .le-foot,body.sh5-on .le-hint,body.sh5-on .sh-now,body.sh5-on .le-card,body.sh5-on .le-chips,body.sh5-on .sh-cast{visibility:hidden!important}' +
    '.sh5-lbls{position:absolute;inset:0;pointer-events:none;overflow:hidden}' +
    '.sh5-l.is-edge::before{content:"↑ ";color:#f0c97a}.sh5-l.is-edge[data-dir=down]::before{content:"↓ "}.sh5-l.is-edge[data-dir=left]::before{content:"← "}.sh5-l.is-edge[data-dir=right]::before{content:"→ "}' +
    '.sh5-l{position:absolute;left:0;top:0;pointer-events:auto;background:rgba(8,14,30,.62);border:1px solid rgba(200,214,235,.32);color:#dfe8f6;border-radius:11px;padding:1px 8px;font:12px "Noto Sans SC","PingFang SC",sans-serif;cursor:pointer;white-space:nowrap;line-height:18px}' +
    '.sh5-l small{font-size:10px;opacity:.8;margin-left:3px}.sh5-l--exo{border-color:rgba(127,214,255,.55);color:#cfefff}.sh5-l--far{opacity:.75}' +
    '.sh5-l--dubhe{border-color:#f0c97a;color:#f6e2b0;background:rgba(40,30,8,.7);box-shadow:0 0 12px rgba(240,201,122,.35);font-weight:600}.sh5-l--dip{border-color:rgba(240,201,122,.45);color:#f6e2b0}' +
    '.sh5-l.is-cur{border-color:#f0c97a;box-shadow:0 0 0 1px #f0c97a}' +
    '.sh5-rl{position:absolute;left:0;top:0;font:10px "Noto Sans SC",sans-serif;color:rgba(127,214,255,.6);pointer-events:none}' +
    '.sh5-info{position:absolute;right:var(--shh-pad,16px);top:calc(var(--shh-top,56px) + 28px);width:250px;background:rgba(8,14,30,.78);border:1px solid rgba(140,180,230,.25);border-radius:14px;padding:10px 12px;color:#e8f2ff;font-family:"Noto Sans SC","PingFang SC",sans-serif;pointer-events:none}' +
    '.sh5-kick{font-size:11px;color:#f0c97a;letter-spacing:.06em;margin-bottom:4px}' +
    '.sh5-note{position:absolute;right:var(--shh-pad,16px);bottom:calc(var(--shh-console,96px) + 34px);font:11px "Noto Sans SC",sans-serif;color:#7f93ad;max-width:380px;text-align:right;pointer-events:none}' +
    '.sh5-back{position:absolute;left:calc(var(--shh-drawer,300px) + var(--shh-pad,16px) + 14px);top:calc(var(--shh-top,56px) + 28px);background:rgba(8,14,30,.75);border:1px solid rgba(127,214,255,.5);color:#cfefff;border-radius:12px;padding:6px 12px;font:13px "Noto Sans SC",sans-serif;cursor:pointer}' +
    'body.shh-dclosed .sh5-back{left:calc(var(--shh-pad,16px) + 60px)}' +
    '.sh5-bar{position:absolute;left:50%;transform:translateX(-50%);top:calc(var(--shh-top,56px) + 28px);display:flex;gap:6px;flex-wrap:wrap;justify-content:center;max-width:min(560px,60vw)}' +
    '.sh5-bar button{background:rgba(8,14,30,.72);border:1px solid rgba(240,201,122,.45);color:#f6e2b0;border-radius:12px;padding:5px 11px;font:12.5px "Noto Sans SC",sans-serif;cursor:pointer;white-space:nowrap}' +
    '.sh5-bar button:hover{background:rgba(240,201,122,.15)}.sh5-y{color:#f0c97a}' +
    '.shh-now .sh5-fact{display:block!important}.shh-now .sh5-fact span{display:block;text-align:left!important}.shh-now .sh5-fact span:last-child{white-space:normal;font-size:12px;line-height:1.55;color:#cfe0f2;margin-top:2px}' +
    'body:has(.shh-now:not([hidden])) .sh5-info{opacity:0;transition:opacity .2s}' +
    '@media (max-width:1180px){.sh5-bar{left:auto;right:var(--shh-pad,16px);transform:none;top:calc(var(--shh-top,56px) + 150px);flex-direction:column;align-items:flex-end}}' +
    '@media (max-width:760px){.sh5-info{top:calc(var(--shh-top,46px) + 56px);right:8px;left:8px;width:auto;padding:6px 8px}.sh5-kick{display:none}.sh5-info .sh2-rows,.sh5-rows{display:flex;gap:6px;width:100%}' +
    '.sh5-rows .sh2-r{flex:1;display:block;border:0;padding:0;text-align:center}.sh5-rows .sh2-r small{font-size:10px}.sh5-rows .sh2-r b{font-size:12.5px;display:block;text-align:center}.sh5-rows .sh2-r i{display:none}' +
    '.sh5-note{display:none}.sh5-back{left:8px;top:calc(var(--shh-top,46px) + 16px);padding:4px 10px;font-size:12px}' +
    '.sh5-bar{top:calc(var(--shh-top,46px) + 116px);right:8px;gap:5px}.sh5-bar button{padding:4px 9px;font-size:11.5px}}' +
    '@media (max-height:500px){.sh5-bar{display:none}.sh5-note{display:none}}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  /* ---------- 接入 HUD ---------- */
  (function wait(k) {
    if (window.SHHUD && SHHUD.on && window.SHDOM && SHDOM.ready && window.SHNOW && SHNOW.ok) {
      try {
        patchCard();
        SHHUD.on('fly', function (b) { if (/^s5:/.test(b || '') && G) { var i = +b.slice(3); D5.focus = i; push(i); } });
        SHHUD.on('zoomout', function (b) { if (/^s5:/.test(b || '') && G) { SHHUD.hideNow(); overview(); } });
        SHHUD.on('nowclose', function (b) { if (/^s5:/.test(b || '')) { D5.focus = -1; if (window.SHDOM) SHDOM.tick(true); } });
        D5.ready = true;
      } catch (e) { console.error('[SHD5]', e); }
      return;
    }
    if (k > 900) return; setTimeout(function () { wait(k + 1); }, 150);
  })(0);
})();
