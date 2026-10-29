/* 天枢 Starhelm 2.0 · C2.9a 星域 VII「宇宙」第一批(SHXCO)
 * 王磊 10-30 00:11 确认方案(docs/C2.9-PLAN-VII.md):
 * 1) 新航点:大麦哲伦云 LMC、小麦哲伦云 SMC(NGC 292)、巨椭圆星系 M87(M87* 黑洞在 sh-x-exo.js)。都走 SHXDV 真航点(锁定 → 转向 → 跃迁 → 抵达二选一),
 *    真实照片分层(x/dsoimg/lmc|smc|m87-*),舷窗观测走 SHXNB 程序化星系。
 * 2) 回望银河:飞出银河系(距银心 > 约 6 万光年)后,在银心真实方向画出银河系外观 —— 程序化棒旋星系(模拟渲染 · 非照片):
 *    盘面按真实朝向(法向 = 银河北极 J2000 RA 192.859° Dec +27.128°,银心 RA 266.405° Dec −28.936°,距太阳 26,996 光年),
 *    四条对数螺旋臂(俯仰角取约 15°)、长约 1.7 万光年的中央棒(与日心-银心连线约 27°)、核球、尘埃带、电离氢区;张角 = 真实半径 ÷ 真实距离。
 *    同时把原有的「地球上看到的星空」贴图压暗(那是从银河系内部看出去的样子),并标出太阳系位置与回看时间。
 * 3) 远距读数:顶部读数条给出距银心距离、太阳系光到这里需要的年数。
 * 只用 ShaderMaterial / PlaneGeometry,r186 与 ?three=169 通用;减少动态时静止。
 */
(function () {
  'use strict';
  var LY = 9.4607e12, AU = 149597870.7, EPS = 23.4392911 * Math.PI / 180;
  var DV = {
    LMC: { zh: '大麦哲伦云', en: 'Large Magellanic Cloud · LMC', f: 'lmc', n: 4, ly: 161700, rly: 16000, par: .35, fit: 'contain', zoom: 1.0, vii: 1, type: '矮星系(棒旋 SBm)· 星域 VII · 银河系卫星星系',
      facts: [['距离', '约 16.2 万光年(49.6 千秒差距,食双星测距)', '证'], ['回看时间', '你看到的是约 16 万年前发出的光', '证'], ['直径', '约 3 万光年', '推'], ['亮点', '蜘蛛星云(30 Dor):本星系群最活跃的恒星形成区', '证'], ['超新星', '1987 年 SN 1987A,近 400 年来肉眼可见的最近超新星', '证'], ['观测波段', '可见光(拉西拉天文台,单反相机)']],
      blurb: '南半球肉眼可见的一团「云」,其实是一个绕着(也可能第一次掠过)银河系的小星系。左侧那团粉红色就是蜘蛛星云,如果它在猎户座大星云的位置,会亮到在地面投下影子。',
      cr: 'Zdeněk Bardon / ESO · CC BY 4.0', cat: 'LMC' },
    'NGC 292': { zh: '小麦哲伦云', en: 'Small Magellanic Cloud · SMC', f: 'smc', n: 4, ly: 203500, rly: 9500, par: .35, fit: 'contain', zoom: 1.0, vii: 1, type: '矮不规则星系 · 星域 VII · 银河系卫星星系',
      facts: [['距离', '约 20.4 万光年(62.4 千秒差距,食双星测距)', '证'], ['回看时间', '你看到的是约 20 万年前发出的光', '证'], ['直径', '约 1.9 万光年', '推'], ['亮点', 'NGC 346 恒星形成区(图中下方偏亮处)', '证'], ['互动', '被大麦哲伦云的引力拉扯,两者之间有「麦哲伦桥」气体流', '证'], ['观测波段', '可见光蓝 + 红双色(数字化巡天 DSS2)']],
      blurb: '肉眼能看到的最远天体之一。它的形状被大麦哲伦云和银河系一起撕扯得很不规则,沿视线方向被拉长了数万光年,所以各处测得的距离并不一样。',
      cr: 'ESO / Digitized Sky Survey 2;致谢 Davide De Martin · CC BY 4.0', cat: 'NGC 292' },
    M87: { zh: '室女座 A · M87', en: 'Virgo A · Messier 87', f: 'm87', n: 4, ly: 5.35e7, rly: 60000, par: .3, fit: 'contain', zoom: .95, vii: 1, type: '巨椭圆星系(E0)· 星域 VII · 室女座星系团中心',
      facts: [['距离', '约 5,350 万光年(16.4 百万秒差距)', '证'], ['回看时间', '你看到的是约 5,350 万年前发出的光', '证'], ['球状星团', '约 1.2 万个(银河系约 150 个)', '证'], ['喷流', '核心黑洞 M87* 射出约 5,000 光年长的喷流(图中蓝色细线)', '证'], ['质量', '约数万亿个太阳(含暗物质)', '推'], ['观测波段', '可见光 + 紫外(哈勃 ACS / WFC3,2024 年发布)']],
      blurb: '室女座星系团中心最重的星系之一,几乎是一个没有旋臂、发着黄光的巨大恒星球。中心的黑洞 M87* 就是 2019 年人类拍下的第一个黑洞,它的喷流沿途还会触发新星爆发。',
      cr: 'NASA, ESA, A. Lessing, E. Baltz(斯坦福大学), M. Shara(AMNH), J. DePasquale(STScI) · ESA/Hubble CC BY 4.0', cat: 'M87' }
  };
  // C2.9b 星系团 / 深场
  DV['Virgo Cl'] = { zh: '室女座星系团', en: 'Virgo Cluster', f: 'virgo', n: 4, ly: 5.4e7, rly: 4e6, ra: 186.75, dec: 12.72, par: .3, fit: 'contain', zoom: 1.0, vii: 1, type: '星系团 · 星域 VII · 本超星系团的中心',
    facts: [['距离', '约 5,400 万光年(16.5 百万秒差距)', '证'], ['回看时间', '你看到的是约 5,400 万年前发出的光', '证'], ['成员', '1,300 多个(可能约 2,000 个)星系', '证'], ['大小', '天上跨约 8°(16 个满月宽),实际直径约 1,500 万光年', '推'], ['质量', '约 1.2 千万亿个太阳(1.2×10¹⁵,大部分是暗物质)', '推'], ['观测波段', '可见光(薇拉·鲁宾天文台首批影像,2025)']],
    blurb: '离我们最近的大型星系团。图中最亮的几团是巨椭圆星系 M84、M86,右侧一串是「马卡良星系链」;整个星系团正以平均约 1,100 km/s 的速度远离我们,而本星系群也正被它的引力往那边拉。舷窗模拟里 16 个梅西耶星系按真实角距摆放,大小放大约 6 倍以便看清。',
    cr: 'NSF–DOE Vera C. Rubin Observatory / NOIRLab / SLAC / AURA · CC BY 4.0' };
  DV['SMACS 0723'] = { zh: '韦布深场 · SMACS 0723', en: "Webb's First Deep Field · SMACS J0723.3−7327", f: 'smacs', n: 4, ly: 4.33e9, rly: 1.2e6, ra: 110.83, dec: -73.4543, par: .25, fit: 'contain', zoom: 1.0, vii: 1, type: '星系团 + 引力透镜 · 星域 VII · 深空',
    facts: [['红移', 'z ≈ 0.39(星系团本身)', '证'], ['光行距离', '约 43 亿光年(= 回看时间约 43 亿年)', '证'], ['共动距离', '约 51 亿光年:光在路上时宇宙还在膨胀,星系团「此刻」已在更远处', '推'], ['透镜', '星系团质量把背后更远星系的光弯成弧;最远的像来自约 131 亿年前', '证'], ['视场', '只有一粒沙子举在一臂远处那么大', '证'], ['观测波段', '近红外(JWST NIRCam,2022 年 7 月首批科学影像)']],
    blurb: '韦布望远镜的第一张科学深场。前景是 43 亿年前的星系团,它的引力像放大镜,把身后更远、更古老的星系拉成橙红色的细弧;带六芒衍射芒的是银河系里的前景恒星。距离用 Planck 2018 宇宙学参数换算。',
    cr: 'NASA, ESA, CSA, STScI · ESA/Webb CC BY 4.0', lookback: 1 };
  function rnd(s) { return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
  function virgoMem() {   // 16 个梅西耶成员按真实角距(相对星系团中心)摆放;大小按视直径换算后 ×2 便于看清;另加暗弱矮星系
    var L = (window.SH_DSO && SH_DSO.d) || [], ids = ['M87', 'M84', 'M86', 'M49', 'M60', 'M59', 'M58', 'M89', 'M90', 'M88', 'M91', 'M99', 'M100', 'M98', 'M85', 'M61'], m = [], R = rnd(4486), c = DV['Virgo Cl'];
    var k = Math.PI / 180 * c.ly / c.rly, cd = Math.cos(c.dec * Math.PI / 180);
    L.forEach(function (o) { if (ids.indexOf(o[0]) < 0) return; var dx = -(o[4] - c.ra) * cd * k, dy = (o[5] - c.dec) * k, sz = Math.max(.03, (o[7] || 4) / 60 * k * .5 * 6), ell = o[8] && o[7] ? Math.max(.25, o[8] / o[7]) : .8, sp = /^S[abcdm]|^SAB|^SB/.test(o[10] || '');
      m.push([dx, dy, sz * (sp ? 1 : 1.3), ell, R() * 180, sp ? 1 : 0, sp ? 1 : 0, o[0] === 'M87' ? 1.4 : 1]); });
    for (var i = 0; i < 160; i++) { var a = R() * 6.283, r = Math.pow(R(), .7) * 1.05; m.push([Math.cos(a) * r - .05, Math.sin(a) * r * .8, (.01 + R() * .016), .6 + R() * .4, R() * 180, 2, 0, .8]); }
    return m;
  }
  function smacsMem() {
    var m = [[0, 0, .13, .78, 30, 0, 0, 1.6]], R = rnd(723);
    function gs() { return (R() + R() + R() - 1.5) * .25; }
    for (var i = 0; i < 38; i++) m.push([gs(), gs() * .85, .016 + R() * .035, .55 + R() * .45, R() * 180, 0, 0, 1.2]);
    for (i = 0; i < 70; i++) { var a = R() * 6.283, r = .15 + Math.sqrt(R()) * .85, sp = R() < .45; m.push([Math.cos(a) * r, Math.sin(a) * r, .01 + R() * .03, .3 + R() * .6, R() * 180, sp ? 1 : 2, sp ? 1 : 0, 1]); }
    return m;
  }
  var NB = {
    LMC: { k: 'gal', c: ['#4d4a58', '#b08ab8', '#fff2e0'], inc: 30, arms: 0, wind: 0, sat: 1.4, pa: 150, bulge: .5, bar: [.42, .12], ell: .85 },
    'NGC 292': { k: 'gal', c: ['#444655', '#9aa8d0', '#f4f0ff'], inc: 65, arms: 0, wind: 0, sat: 1.3, pa: 45, bulge: .4, bar: [.5, .16] },
    M87: { k: 'gal', c: ['#4a4038', '#b8a080', '#ffe8c0'], inc: 0, arms: 0, wind: 0, sat: 1.1, bulge: 2.2, ell: .94, jet: -70 },
    'Virgo Cl': { k: 'clu', c: ['#000', '#000', '#000'], sat: 1.15, nbg: 700, bgC: [[1, .85, .6], [.7, .8, 1]], pal: [['#3a3530', '#c8b090', '#fff0d0'], ['#303848', '#8aa0d0', '#fff4e0'], ['#201e1c', '#9a8a78', '#d8ccb8']], mem: null },
    'SMACS 0723': { k: 'clu', c: ['#000', '#000', '#000'], sat: 1.3, nbg: 1600, bgC: [[1, .62, .35], [.65, .72, 1], [1, .4, .3], [1, .85, .6]], pal: [['#3a2a18', '#d8a060', '#fff0c0'], ['#202838', '#7f90ff', '#ffd0a0'], ['#200808', '#c05030', '#ffa070']], mem: null, arcC: ['#000000', '#ff8a50', '#ffd8b0'],
      arcs: [[.24, 20, .35], [.28, 135, .25], [.33, 250, .4], [.38, 80, .2], [.41, 310, .3], [.45, 190, .22], [.3, 350, .18], [.5, 40, .15]] }
  };
  (function reg(n) {
    if (window.SHXDV && SHXDV.add && window.SHXNB && SHXNB.add && window.SH_DSO) { Object.keys(DV).forEach(function (k) { SHXDV.add(k, DV[k]); }); NB['Virgo Cl'].mem = virgoMem(); NB['SMACS 0723'].mem = smacsMem(); Object.keys(NB).forEach(function (k) { SHXNB.add(k, NB[k]); }); return; }
    if (n < 150) setTimeout(function () { reg(n + 1); }, 100);
  })(0);

  /* ---------------- 回望银河 ---------------- */
  function eq(ra, de, d) {   // 赤道 J2000(度, km) → three(与 sh-x-cockpit.js eq2three 一致,y = 黄北)
    ra *= Math.PI / 180; de *= Math.PI / 180;
    var x = Math.cos(de) * Math.cos(ra), y0 = Math.cos(de) * Math.sin(ra), z0 = Math.sin(de);
    var y = y0 * Math.cos(EPS) + z0 * Math.sin(EPS), z = -y0 * Math.sin(EPS) + z0 * Math.cos(EPS);
    return [x * d, z * d, -y * d];
  }
  var GC_LY = 26996, RG = 60000;   // 银心距离;画面盘半径(光年,含暗弱外盘)
  var GC = eq(266.40500, -28.93617, GC_LY * LY), NGP = eq(192.85948, 27.12825, 1);
  var NOISE = [
    'float h3(vec3 p){p=fract(p*0.3183099+.1);p*=17.0;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}',
    'float n3(vec3 x){vec3 i=floor(x);vec3 f=fract(x);f=f*f*(3.0-2.0*f);',
    ' return mix(mix(mix(h3(i),h3(i+vec3(1,0,0)),f.x),mix(h3(i+vec3(0,1,0)),h3(i+vec3(1,1,0)),f.x),f.y),mix(mix(h3(i+vec3(0,0,1)),h3(i+vec3(1,0,1)),f.x),mix(h3(i+vec3(0,1,1)),h3(i+vec3(1,1,1)),f.x),f.y),f.z);}',
    'uniform float uOct;',
    'float fbm(vec3 p){float a=.5,s=0.0;for(int i=0;i<6;i++){if(float(i)>=uOct)break;s+=a*n3(p);p=p*2.03+vec3(1.7,9.2,4.1);a*=.5;}return s;}'
  ].join('\n');
  var VS = 'varying vec2 vU;void main(){vU=uv*2.0-1.0;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}';
  // 盘面:局部 x 轴指向太阳一侧,z 轴 = 银河北极;银河系从北极看顺时针转,旋臂为拖曳臂(半径越大相位越大)
  var FSD = [
    'precision highp float;varying vec2 vU;uniform float uA,uT;', NOISE,
    'const float K=3.6;',   // 约 1/tan(15.5°) 俯仰角
    'float arm(float th,float lr,float o,float w){float s=cos(2.0*(th-K*lr-o));return pow(max(s,0.0),w);}',
    'void main(){vec2 p=vU;float r=length(p);if(r>1.0)discard;float th=atan(p.y,p.x),lr=log(max(r,.02));',
    ' float n=fbm(vec3(p*7.0,1.3+uT*.004)),m=fbm(vec3(p*22.0+n,4.1));',
    ' float ca=-0.471;vec2 q=vec2(p.x*cos(ca)+p.y*sin(ca),-p.x*sin(ca)+p.y*cos(ca));',   // 棒与日心-银心连线约 27°(近端在银经正方向)
    ' float bar=exp(-(q.x*q.x/0.0225+q.y*q.y/0.0028));float bul=exp(-r*r/0.0042);',
    ' float disk=exp(-r/0.2)*smoothstep(1.0,.75,r);',
    ' float rin=smoothstep(.1,.2,r),rout=smoothstep(1.0,.55,r);',
    ' float a1=arm(th,lr,-0.6,3.0),a2=arm(th,lr,-0.6+1.5708,5.0);',   // 两条主臂(英仙臂 / 盾牌-半人马臂)+ 两条次臂
    ' float arms=(a1+0.55*a2)*rin*rout*(0.55+0.9*n);',
    ' float dust=arm(th,lr,-0.6+0.22,10.0)*rin*rout*smoothstep(.35,.7,n)*0.75;',
    ' float hii=pow(max(m-0.62,0.0)*3.0,2.0)*(a1+a2)*rin*rout;',
    ' vec3 cB=vec3(1.0,.84,.6),cD=vec3(.78,.76,.86),cA=vec3(.62,.76,1.0),cH=vec3(1.0,.45,.62);',
    ' vec3 c=cB*(bar*1.1+bul*1.6)+cD*disk*.55+cA*arms*.62*(.35+.65*smoothstep(.08,.5,r))+cH*hii*1.4;',
    ' c*=1.0-dust;c+=cA*m*.05*rout*disk*3.0;',
    ' gl_FragColor=vec4(c*uA,1.0);}'
  ].join('\n');
  var FSG = 'precision highp float;varying vec2 vU;uniform float uA;void main(){float r=length(vU);if(r>1.0)discard;float g=exp(-r*r*9.0)*.9+exp(-r*4.0)*.25;gl_FragColor=vec4(vec3(1.0,.86,.64)*g*uA,1.0);}';
  var T, X, scn = null, grp = null, disk = null, glow = null, mats = [], added = false, warned = false, t0 = 0, R = 650, st = { a: 0, dgc: 0, dsun: 0 }, hud = null, tag = null, skyBase = null, skyF = 1;
  function rm() { return matchMedia('(prefers-reduced-motion: reduce)').matches; }
  function small() { return Math.min(screen.width, screen.height) < 700 || innerWidth <= 760; }
  function sstep(a, b, x) { var t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
  function nf(x, d) { return x.toLocaleString('zh-CN', { maximumFractionDigits: d || 0, minimumFractionDigits: d || 0 }); }
  function fly(ly) { return ly >= 1e8 ? nf(ly / 1e8, 2) + ' 亿光年' : ly >= 1e4 ? nf(ly / 1e4, ly >= 1e6 ? 0 : 1) + ' 万光年' : nf(ly) + ' 光年'; }
  function yrs(ly) { return fly(ly).replace('光年', '年'); }
  function build() {
    scn = new T.Scene(); grp = new T.Group();
    var ez = new T.Vector3(NGP[0], NGP[1], NGP[2]).normalize(), g = new T.Vector3(-GC[0], -GC[1], -GC[2]).normalize();   // 银心 → 太阳
    var ex = g.sub(ez.clone().multiplyScalar(g.dot(ez))).normalize(), ey = new T.Vector3().crossVectors(ez, ex);
    disk = new T.Group(); disk.quaternion.setFromRotationMatrix(new T.Matrix4().makeBasis(ex, ey, ez)); grp.add(disk);
    var md = new T.ShaderMaterial({ vertexShader: VS, fragmentShader: FSD, transparent: true, depthWrite: false, depthTest: false, side: T.DoubleSide, blending: T.AdditiveBlending, uniforms: { uA: { value: 0 }, uT: { value: 0 }, uOct: { value: small() ? 4 : 5 } } });
    var me = new T.Mesh(new T.PlaneGeometry(2, 2), md); me.frustumCulled = false; disk.add(me); mats.push(md);
    var mg = new T.ShaderMaterial({ vertexShader: VS, fragmentShader: FSG, transparent: true, depthWrite: false, depthTest: false, blending: T.AdditiveBlending, uniforms: { uA: { value: 0 } } });
    glow = new T.Mesh(new T.PlaneGeometry(2, 2), mg); glow.frustumCulled = false; glow.scale.setScalar(.09); grp.add(glow); mats.push(mg);   // 核球(始终面向相机,侧视时也可见)
    scn.add(grp); t0 = performance.now();
  }
  function sky(f) {   // 压暗「地球视角」星空贴图
    var sg = X._.skyG && X._.skyG(); if (!sg) return;
    sg.traverse(function (o) { var m = o.material; if (!m || !m.color) return; if (!m.userData.c0) m.userData.c0 = m.color.clone(); m.color.copy(m.userData.c0).multiplyScalar(f); });
    skyF = f;
  }
  function css() {
    if (document.getElementById('xco-css')) return; var s = document.createElement('style'); s.id = 'xco-css';
    s.textContent = '#xco-hud{position:absolute;left:50%;top:168px;transform:translateX(-50%);z-index:5;pointer-events:none;max-width:min(620px,calc(100vw - 20px));padding:5px 14px;border-radius:9px;font:11.5px/1.55 "Noto Sans SC",system-ui,sans-serif;color:#f3e2b8;background:rgba(10,12,22,.62);border:1px solid rgba(240,201,122,.45);text-align:center;white-space:nowrap}' +
      '#xco-hud b{font-weight:500;color:#ffe2a0;font-family:"JetBrains Mono",ui-monospace,monospace}#xco-hud i{font-style:normal;color:#ff9fb2}' +
      '#xco-tag{position:absolute;left:0;top:0;z-index:5;pointer-events:none;display:none;font:11px/1.3 "Noto Sans SC",system-ui,sans-serif;color:#9fdcff;white-space:nowrap;text-shadow:0 0 6px #000}#xco-tag::before{content:"";display:inline-block;width:12px;height:12px;margin:0 6px -2px 0;border:1.5px dashed #9fdcff;border-radius:50%}' +
      '.xdv-on #xco-hud,.xdv-on #xco-tag{display:none!important}' +
      '@media (max-width:760px){#xco-hud{top:auto;bottom:212px;font-size:10px;padding:3px 8px;white-space:normal;width:calc(100vw - 24px)}#xco-tag{font-size:10px}}';
    document.head.appendChild(s);
  }
  function layer(LI) {
    var S = X._.S; if (!S || !S.pos) return;
    var dx = GC[0] - S.pos[0], dy = GC[1] - S.pos[1], dz = GC[2] - S.pos[2], dd = Math.hypot(dx, dy, dz), dgc = dd / LY, dsun = Math.hypot(S.pos[0], S.pos[1], S.pos[2]) / LY;
    var a = sstep(60000, 95000, dgc); st.a = a; st.dgc = dgc; st.dsun = dsun;
    var f = 1 - .85 * a; if (Math.abs(f - skyF) > .004) sky(f);
    var root = X._.root && X._.root();
    if (a <= .002) { if (hud) hud.style.display = 'none'; if (tag) tag.style.display = 'none'; return; }
    if (!scn) build();
    var tn = RG * LY / dd;
    grp.position.set(dx / dd * R, dy / dd * R, dz / dd * R); disk.scale.setScalar(R * Math.min(tn, 2)); glow.scale.setScalar(R * Math.min(tn, 2) * .1); glow.quaternion.copy(LI.cam0.quaternion);
    var tt = rm() ? 0 : (performance.now() - t0) / 1000;
    mats[0].uniforms.uA.value = a * 1.15; mats[0].uniforms.uT.value = tt; mats[1].uniforms.uA.value = a * .8;
    LI.rd.render(scn, LI.cam0);
    if (!root) return; css();
    if (!hud || hud.parentNode !== root) { if (hud) hud.remove(); hud = document.createElement('div'); hud.id = 'xco-hud'; root.appendChild(hud); }
    var eh = document.getElementById('xeo-hud'), ehOn = eh && eh.style.display !== 'none' && eh.offsetParent;
    var h = '<i>回望银河 · 模拟渲染 · 非照片</i> · 距银心 <b>' + fly(dgc) + '</b> · 此刻看到的太阳系附近的光约 <b>' + yrs(dsun) + '</b>前发出';
    if (hud.dataset.h !== h) { hud.innerHTML = h; hud.dataset.h = h; }
    hud.style.display = ehOn || (window.SHXDV && SHXDV.isOpen && SHXDV.isOpen()) ? 'none' : '';
    // 太阳系标记
    if (!tag || tag.parentNode !== root) { if (tag) tag.remove(); tag = document.createElement('div'); tag.id = 'xco-tag'; root.appendChild(tag); }
    var v = new T.Vector3(-S.pos[0], -S.pos[1], -S.pos[2]).normalize().applyQuaternion(S.q.clone().invert());
    var W = root.clientWidth || innerWidth, H = root.clientHeight || innerHeight;
    if (v.z > -0.05 || a < .5) { tag.style.display = 'none'; return; }
    var fy = 1 / Math.tan(Math.PI / 6), fx = fy * H / W, x = (v.x / -v.z * fx + 1) * W / 2, y = (1 - v.y / -v.z * fy) * H / 2;
    if (x < 20 || x > W - 20 || y < 60 || y > H - 200) { tag.style.display = 'none'; return; }
    var tx = '太阳系 · 你出发的地方(' + fly(dsun) + '外)'; if (tag.textContent !== tx) tag.textContent = tx;
    tag.style.display = 'block'; var tw = tag.offsetWidth || 200, x0 = Math.max(6, Math.min(W - tw - 6, x - 7));   // 靠右边时整体左移,标签不被裁掉
    tag.style.transform = 'translate(' + x0.toFixed(0) + 'px,' + (y - 8).toFixed(0) + 'px)';
  }
  function init() {
    T = window.THREE; X = window.SHXC; if (!T || !X || !X.layers || added) return; added = true;
    X.layers.bg.push(function (LI) { try { layer(LI); } catch (e) { if (!warned) { warned = true; console.warn('[SHXCO]', e); } } });
  }
  function hook(ev) {
    if (ev === 'open' || ev === 'renderer' || ev === 'frame') { if (!added) init(); }
    if (ev === 'close') { if (hud) hud.style.display = 'none'; if (tag) tag.style.display = 'none'; }
  }
  (function wait(n) { if (window.SHXC && SHXC.on) { SHXC.on(hook); return; } if (n < 150) setTimeout(function () { wait(n + 1); }, 100); })(0);
  window.SHXCO = { extra: function () { return ['Virgo Cl', 'SMACS 0723']; }, get: function (k) { return DV[k]; }, gc: function () { return GC.slice(); }, list: function () { return Object.keys(DV); }, state: function () { return { a: +st.a.toFixed(3), dgc: Math.round(st.dgc), dsun: Math.round(st.dsun), sky: +skyF.toFixed(2), hud: !!(hud && hud.style.display !== 'none'), tag: !!(tag && tag.style.display === 'block') }; } };
})();
