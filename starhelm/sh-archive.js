/* 天枢 Starhelm · 星档馆 v0(M2,方向 A「全息展厅」)
 * 弦穹号舰内的环形全息展厅:真实望远镜/探测器影像立在全息投影光柱上,地面能量环、悬浮粒子、自研泛光(bloom)。
 * 每件展品讲清「怎么拍的、哪个波段、离我们多远、光走了多久」;多波段展品拖动波段滑杆,扫描线把图像切换到另一种「眼睛」。
 * 图像均为公开授权的真实影像(署名见每件展品与 docs/DATA-SOURCES.md),自托管于 arc/。存储 gn:sh:archive */
(function () {
  'use strict';
  var SH = window.SH = window.SH || {};
  var KEY = 'gn:sh:archive';
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(ST)); } catch (e) { } }
  var ST = load(); ST.seen = ST.seen || [];
  function h(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function P(n) { if (window.LE && LE.audio) LE.audio.play(n); }
  var MOBILE = Math.min(innerWidth, innerHeight) < 560 || /Mobi|Android|iPhone|iPad/.test(navigator.userAgent);

  /* ---------------- 展品 ---------------- */
  var EX = [
    { id: 'sun', zh: '太阳', en: 'THE SUN', dist: '1.5 亿 km', light: '8 分 20 秒',
      how: '太阳动力学天文台(SDO)在地球同步倾斜轨道上,每 12 秒给太阳拍一组照片,一天约 1.5 TB 数据。',
      bands: [{ zh: '可见光', k: 'vis', img: 'sun-vis', t: '人眼看到的光球层,约 5500°C,暗斑是黑子。', cr: 'NASA/SDO 及 HMI 科学团队' },
              { zh: '极紫外 171Å', k: 'uv', img: 'sun-171', t: '约 100 万°C 的日冕,亮环是被磁场捆住的高温等离子体。', cr: 'NASA/SDO 及 AIA 科学团队' },
              { zh: '极紫外 304Å', k: 'uv', img: 'sun-304', t: '约 5 万°C 的色球层,边缘飘起的是日珥。', cr: 'NASA/SDO 及 AIA 科学团队' }],
      fact: '你看到的太阳,永远是它 8 分 20 秒以前的样子。' },
    { id: 'earth', zh: '蓝色弹珠', en: 'THE BLUE MARBLE', dist: '约 2.9 万 km', light: '0.1 秒',
      how: '1972 年 12 月 7 日,阿波罗 17 号的宇航员在飞往月球途中,用一台手持哈苏相机拍下。太阳正好在身后,整个地球都被照亮。',
      bands: [{ zh: '可见光', k: 'vis', img: 'earth', t: '非洲、阿拉伯半岛和南极冰盖清晰可见。', cr: 'NASA' }],
      fact: '这是人类第一次拍到完整、被太阳全部照亮的地球。' },
    { id: 'pbd', zh: '暗淡蓝点', en: 'PALE BLUE DOT', dist: '约 60 亿 km', light: '约 5.5 小时',
      how: '1990 年 2 月 14 日,即将飞出太阳系的旅行者 1 号回过头拍下地球。2020 年工程师用现代软件重新处理了原始数据。',
      bands: [{ zh: '可见光', k: 'vis', img: 'pbd', t: '右侧光带中那个不到一个像素的小点,就是地球。光带是相机里的太阳散射光。', cr: 'NASA/JPL-Caltech' }],
      fact: '我们知道的每一个人,都生活在这个小点上。' },
    { id: 'jupiter', zh: '木星与欧罗巴', en: 'JUPITER', dist: '约 6.5 亿 km', light: '约 36 分钟',
      how: '2020 年 8 月 25 日哈勃空间望远镜的广域相机 3 拍摄,属于每年给外行星「体检」的 OPAL 计划。',
      bands: [{ zh: '可见光', k: 'vis', img: 'jupiter', t: '大红斑是一个比地球还大的风暴,已经刮了至少 190 年。左边的小点是卫星欧罗巴。', cr: 'NASA, ESA, A. Simon (GSFC), M. H. Wong (UC Berkeley), OPAL 团队' }],
      fact: '欧罗巴的冰壳下面,可能藏着一片比地球海洋还多的液态水。' },
    { id: 'pillars', zh: '创生之柱', en: 'PILLARS OF CREATION', dist: '约 6500 光年', light: '约 6500 年',
      how: '鹰状星云 M16 里的冷气体尘埃柱。哈勃看可见光,韦布的近红外相机 NIRCam 和中红外仪器 MIRI 看穿尘埃、看见尘埃本身。',
      bands: [{ zh: '可见光', k: 'vis', img: 'pillars-vis', t: '哈勃 2014:厚厚的尘埃挡住了柱子里面。', cr: 'NASA, ESA/Hubble, Hubble Heritage Team' },
              { zh: '近红外', k: 'nir', img: 'pillars-nir', t: '韦布 NIRCam 2022:红外光穿过尘埃,柱子里新生的恒星亮了起来。', cr: 'NASA, ESA, CSA, STScI; J. DePasquale, A. Koekemoer, A. Pagan (STScI)' },
              { zh: '中红外', k: 'mir', img: 'pillars-miri', t: '韦布 MIRI 2022:大部分恒星「消失」了,发光的是温暖的尘埃本身。', cr: 'NASA, ESA, CSA, STScI, J. DePasquale (STScI), A. Pagan (STScI)' }],
      fact: '柱子最高的一根约 4 光年,光从底走到顶要 4 年。' },
    { id: 'crab', zh: '蟹状星云', en: 'CRAB NEBULA', dist: '约 6500 光年', light: '约 6500 年',
      how: '1054 年一颗恒星爆炸,宋代天文学家记录下这颗白天都看得见的「客星」。今天它的残骸中心是一颗每秒自转 30 圈的中子星。',
      bands: [{ zh: '可见光', k: 'vis', img: 'crab-vis', t: '哈勃:爆炸抛出的气体丝,至今仍以每秒约 1500 km 向外扩张。', cr: 'NASA, ESA, J. Hester, A. Loll (ASU)' },
              { zh: '红外', k: 'nir', img: 'crab-ir', t: '韦布 2023:橙红色是尘埃,中心乳白色烟雾是中子星磁场里高速电子发出的同步辐射。', cr: 'NASA, ESA, CSA, STScI, T. Temim (Princeton University)' },
              { zh: 'X 射线', k: 'xray', img: 'crab-xray', t: '钱德拉 X 射线天文台:中子星的「风」吹出亮环和喷流,只有 X 射线才看得到。', cr: 'NASA/CXC/SAO' }],
      fact: '同一个天体,换一双「眼睛」就是完全不同的样子。' },
    { id: 'cliffs', zh: '宇宙悬崖', en: 'COSMIC CLIFFS', dist: '约 7600 光年', light: '约 7600 年',
      how: '韦布空间望远镜 2022 年首批照片之一,船底座星云 NGC 3324 的边缘。韦布在离地球 150 万 km 的日地 L2 点工作。',
      bands: [{ zh: '近红外', k: 'nir', img: 'cliffs', t: '「山峰」是气体云的边缘,上方年轻炽热的恒星发出的紫外线正在把它一点点蚀掉。', cr: 'NASA, ESA, CSA, STScI' }],
      fact: '最高的「山峰」大约有 7 光年高。' },
    { id: 'm87', zh: '第一张黑洞照片', en: 'M87* BLACK HOLE', dist: '约 5500 万光年', light: '约 5500 万年',
      how: '2017 年全球 8 台射电望远镜同时观测,组成一台口径相当于地球大小的「虚拟望远镜」,数据处理了两年,2019 年公布。',
      bands: [{ zh: '射电 1.3 mm', k: 'radio', img: 'm87', t: '亮环是被黑洞引力弯折的热气体辐射,中间暗的地方是黑洞的「影子」。', cr: 'EHT Collaboration(CC BY 4.0)' }],
      fact: '这个黑洞的质量约是太阳的 65 亿倍。' },
    { id: 'deep', zh: '韦布第一深场', en: 'WEBB\'S FIRST DEEP FIELD', dist: '星系团约 46 亿光年', light: '最远的光走了 130 多亿年',
      how: '韦布对准南天一小块天区曝光 12.5 小时。这块天空的大小,相当于你伸直手臂捏着的一粒沙子。',
      bands: [{ zh: '近红外', k: 'nir', img: 'deep', t: '几乎每个光点都是一个星系。被拉成弧形的,是更远星系的光被前景星系团引力弯折(引力透镜)。', cr: 'NASA, ESA, CSA, STScI' }],
      fact: '这张照片里,有些光比地球的年纪还大两倍多。' }
  ];
  var BAND_COL = { vis: '#ffe08a', uv: '#c58cff', nir: '#ff9a5c', mir: '#ff5c7a', xray: '#7fd0ff', radio: '#7fe3c4' };

  /* ---------------- DOM ---------------- */
  var U = {}, G = null, L = { rot: 0, rotT: 0, vel: 0, focus: -1, fx: 0, band: 0, bandT: 0, hover: -1, t: 0 };
  var STEP = Math.PI * 2 / EX.length, R = 8.2;
  function build() {
    var r = U.root = h('section', 'ar');
    r.innerHTML =
      '<canvas class="ar-cv"></canvas><div class="ar-vig"></div>' +
      '<header class="ar-hd"><div class="ar-ttl"><small>弦穹号 · 舰内</small><b>星档馆 <span>STAR ARCHIVE</span></b></div><span class="ar-cnt"></span><button class="ar-x" type="button" aria-label="关闭">✕</button></header>' +
      '<aside class="ar-info" hidden><div class="ar-k"></div><h3 class="ar-nm"></h3><div class="ar-en"></div>' +
      '<div class="ar-row"><span>距离</span><b class="ar-dist"></b></div><div class="ar-row"><span>光走到我们</span><b class="ar-light"></b></div>' +
      '<div class="ar-sec">怎么拍的</div><p class="ar-how"></p><div class="ar-sec">这一波段</div><p class="ar-bt"></p><p class="ar-fact"></p><div class="ar-cr"></div></aside>' +
      '<div class="ar-band" hidden><div class="ar-chips"></div><input class="ar-rng" type="range" min="0" max="2" step="0.001"></div>' +
      '<nav class="ar-nav"><button class="ar-prev" type="button" aria-label="上一件">‹</button><span class="ar-tip">拖动旋转展厅 · 点照片走近看</span><button class="ar-next" type="button" aria-label="下一件">›</button></nav>' +
      '<div class="ar-foot">影像:NASA、ESA、CSA、STScI、NASA/SDO、NASA/CXC/SAO、NASA/JPL-Caltech、EHT Collaboration 等,均为公开授权影像 · 不代表任何机构背书</div>' +
      '<div class="ar-fb" hidden></div>';
    document.body.appendChild(r);
    ['cv', 'cnt', 'x', 'info', 'k', 'nm', 'en', 'dist', 'light', 'how', 'bt', 'fact', 'cr', 'band', 'chips', 'rng', 'prev', 'next', 'tip', 'fb'].forEach(function (k) { U[k] = r.querySelector('.ar-' + k); });
    U.x.onclick = close;
    U.prev.onclick = function () { go(-1); }; U.next.onclick = function () { go(1); };
    U.rng.oninput = function () { L.bandT = L.band = +U.rng.value; bandText(); };
    U.rng.onchange = function () { L.bandT = Math.round(+U.rng.value); };
    document.addEventListener('keydown', function (e) {
      if (!U.root || U.root.hidden) return;
      if (e.key === 'Escape') { if (L.focus >= 0) unfocus(); else close(); }
      else if (e.key === 'ArrowRight') go(1); else if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === 'Enter' && L.focus < 0) focus(nearest());
    });
  }
  function nearest() { var i = Math.round(L.rotT / STEP) % EX.length; return (i + EX.length) % EX.length; }
  function go(d) {
    P('tick');
    if (L.focus >= 0) { var n = (L.focus + d + EX.length) % EX.length; L.rotT += d * STEP; focus(n, true); }
    else L.rotT = Math.round(L.rotT / STEP + d) * STEP;
  }
  function count() { U.cnt.textContent = '已看 ' + ST.seen.length + ' / ' + EX.length; }
  function focus(i, keepRot) {
    var E = EX[i]; L.focus = i; L.band = L.bandT = 0;
    if (!keepRot) { var cur = L.rotT / STEP, k = Math.round((cur - i) / EX.length) * EX.length + i; L.rotT = k * STEP; }
    if (ST.seen.indexOf(E.id) < 0) { ST.seen.push(E.id); save(); }
    if (SH.progress && SH.progress.explore) try { SH.progress.explore('archive'); } catch (e) { }
    count();
    U.info.hidden = false; U.info.style.setProperty('--bc', BAND_COL[E.bands[0].k]);
    U.k.textContent = '展品 ' + (i + 1) + ' / ' + EX.length; U.nm.textContent = E.zh; U.en.textContent = E.en;
    U.dist.textContent = E.dist; U.light.textContent = E.light; U.how.textContent = E.how; U.fact.textContent = E.fact;
    U.band.hidden = E.bands.length < 2; U.rng.max = E.bands.length - 1; U.rng.value = 0; U.chips.innerHTML = '';
    E.bands.forEach(function (b, j) {
      var c = h('button', 'ar-chip', b.zh); c.type = 'button'; c.style.setProperty('--bc', BAND_COL[b.k]);
      c.onclick = function () { L.bandT = j; P('click'); }; U.chips.appendChild(c);
    });
    bandText(); U.tip.textContent = E.bands.length > 1 ? '拖动波段滑杆,换一双眼睛看它' : '‹ › 切换展品 · Esc 返回展厅';
    P('select');
  }
  function unfocus() { L.focus = -1; U.info.hidden = true; U.band.hidden = true; U.tip.textContent = '拖动旋转展厅 · 点照片走近看'; P('soft'); }
  function bandText() {
    if (L.focus < 0) return; var E = EX[L.focus], j = Math.round(L.band), b = E.bands[Math.min(j, E.bands.length - 1)];
    U.bt.textContent = b.t; U.cr.textContent = '影像:' + b.cr; U.info.style.setProperty('--bc', BAND_COL[b.k]);
    [].forEach.call(U.chips.children, function (c, k) { c.classList.toggle('on', k === j); });
  }

  /* ---------------- 3D ---------------- */
  var FSQ_VS = 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }';
  var PANEL_VS = 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }';
  var PANEL_FS = [
    'uniform sampler2D tA, tB; uniform float uMix, uT, uHot, uOn, uLoad; uniform vec3 uCol; varying vec2 vUv;',
    'float hash(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453); }',
    'void main(){',
    '  vec2 uv=vUv; float edge=min(min(uv.x,1.-uv.x),min(uv.y,1.-uv.y));',
    '  float glitch=step(.985,hash(vec2(floor(uv.y*60.),floor(uT*8.))))*(1.-uOn)*.012; uv.x+=glitch;',
    '  vec3 a=texture2D(tA,uv).rgb, b=texture2D(tB,uv).rgb;',
    '  float sx=uMix*1.16-.08; float w=smoothstep(sx-.004,sx+.004,uv.x); vec3 c=mix(b,a,w);',
    '  float scan=exp(-abs(uv.x-sx)*90.)*step(.001,uMix)*step(uMix,.999);',
    '  float lines=.94+.06*sin(uv.y*900.+uT*6.);',
    '  c*=mix(lines,1.,uOn*.7); c*=uLoad;',
    '  float fr=smoothstep(.018,.0,edge);',
    '  vec3 col=c*(.8+.08*uOn+.1*uHot) + uCol*fr*(1.1+1.1*uHot+1.2*uOn) + vec3(.55,.95,1.)*scan*2.2;',
    '  col+=uCol*.06*(1.-uLoad)*(.5+.5*sin(uv.y*40.-uT*5.));',
    '  gl_FragColor=vec4(col,1.);',
    '}'].join('\n');
  var FLOOR_FS = [
    'uniform float uT; uniform vec3 uC, uG; varying vec2 vUv;',
    'void main(){ vec2 p=(vUv-.5)*60.; float r=length(p), a=atan(p.y,p.x);',
    '  float rings=pow(abs(sin(r*1.9)),40.)*.9; float spokes=pow(abs(cos(a*18.)),220.)*smoothstep(3.,4.,r);',
    '  float pulse=exp(-pow(r-mod(uT*4.,30.),2.)*1.5)*1.6; float fade=smoothstep(28.,6.,r);',
    '  float core=smoothstep(2.4,2.2,r)*smoothstep(1.6,1.9,r)*2.;',
    '  float nearF=smoothstep(1.5,9.,r); vec3 col=uC*(rings*.3+spokes*.22+pulse*.32)*fade*nearF + uG*core*.45 + uC*.025*fade;',
    '  gl_FragColor=vec4(col,1.); }'].join('\n');
  var BEAM_VS = 'varying vec2 vUv; varying vec3 vN, vV; void main(){ vUv=uv; vN=normalize(normalMatrix*normal); vec4 mv=modelViewMatrix*vec4(position,1.); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }';
  var BEAM_FS = 'uniform vec3 uC; uniform float uT, uI; varying vec2 vUv; varying vec3 vN, vV; void main(){ float f=pow(1.-abs(dot(vN,vV)),1.5); float a=(1.-vUv.y)*.9+.1; float n=.75+.25*sin(vUv.y*30.-uT*4.+vUv.x*20.); gl_FragColor=vec4(uC*f*a*n*uI,1.); }';
  var PT_VS = [
    'attribute float aS, aP; uniform float uT, uPx, uH; varying float vA;',
    'void main(){ vec3 p=position; float y=mod(p.y+uT*aS,uH); p.y=y; vA=sin(y/uH*3.1416)*(.6+.4*sin(uT*3.+aP*6.28));',
    '  p.x+=sin(uT*.6+aP*12.)*.15; p.z+=cos(uT*.5+aP*9.)*.15;',
    '  vec4 mv=modelViewMatrix*vec4(p,1.); gl_PointSize=uPx*(14./-mv.z)*(.6+aP); gl_Position=projectionMatrix*mv; }'].join('\n');
  var PT_FS = 'uniform vec3 uC; varying float vA; void main(){ vec2 d=gl_PointCoord-.5; float r=length(d); float a=smoothstep(.5,.0,r); gl_FragColor=vec4(uC*a*a*vA*1.6,1.); }';

  function initGL() {
    var T = window.THREE, cv = U.cv;
    var rd = new T.WebGLRenderer({ canvas: cv, antialias: false, alpha: false, powerPreference: 'high-performance' });
    var PR = MOBILE ? 1 : Math.min(1.75, devicePixelRatio || 1); rd.setPixelRatio(PR); rd.setClearColor(0x01030a, 1);
    var sc = new T.Scene(), cam = new T.PerspectiveCamera(55, 1, 0.05, 400);
    sc.fog = new T.FogExp2(0x01030a, 0.025);
    var CY = new T.Color(0x3fe0ff), GD = new T.Color(0xffc861);
    var ring = new T.Group(); sc.add(ring);
    var loader = new T.TextureLoader(), panels = [], UT = { value: 0 };
    function tex(name, cb) { var t = loader.load('arc/' + name + '.webp', cb); t.minFilter = T.LinearFilter; t.generateMipmaps = false; return t; }
    // 地面能量环
    var floor = new T.Mesh(new T.PlaneGeometry(60, 60), new T.ShaderMaterial({ uniforms: { uT: UT, uC: { value: CY }, uG: { value: GD } }, vertexShader: PANEL_VS, fragmentShader: FLOOR_FS, depthWrite: false }));
    floor.rotation.x = -Math.PI / 2; sc.add(floor);
    // 穹顶结构:金色分段环 + 青色光带
    function arcRing(rad, y, col, segs, th) {
      var g = new T.Group();
      for (var s = 0; s < segs; s++) {
        var m = new T.Mesh(new T.TorusGeometry(rad, th, 6, 24, (Math.PI * 2 / segs) * 0.78), new T.MeshBasicMaterial({ color: col }));
        m.rotation.x = Math.PI / 2; m.rotation.z = s * Math.PI * 2 / segs; m.position.y = y; g.add(m);
      }
      sc.add(g); return g;
    }
    var c1 = CY.clone().multiplyScalar(1.6), g1 = GD.clone().multiplyScalar(1.8);
    var roofA = arcRing(R + 2.2, 5.4, g1, 18, 0.03), roofB = arcRing(R + 1.2, 6.3, c1, 9, 0.02), baseR = arcRing(R + 0.4, 0.02, c1, 36, 0.025);
    // 展品:照片面板 + 投影光柱 + 底座环 + 上升粒子
    EX.forEach(function (E, i) {
      var a = i * STEP, grp = new T.Group(); grp.position.set(Math.sin(a) * R, 0, -Math.cos(a) * R); grp.lookAt(0, 0, 0); ring.add(grp);
      var col = new T.Color(BAND_COL[E.bands[0].k]);
      var texs = E.bands.map(function () { return null; });
      var mat = new T.ShaderMaterial({ uniforms: { tA: { value: null }, tB: { value: null }, uMix: { value: 0 }, uT: UT, uHot: { value: 0 }, uOn: { value: 0 }, uLoad: { value: 0 }, uCol: { value: CY.clone() } }, vertexShader: PANEL_VS, fragmentShader: PANEL_FS });
      var pm = new T.Mesh(new T.PlaneGeometry(1, 1), mat); pm.position.y = 2.25; pm.userData.i = i; grp.add(pm);
      texs[0] = tex(E.bands[0].img, function (t) { var im = t.image, asp = im.width / im.height, hh = asp > 1.3 ? 1.75 : 2.3; pm.scale.set(hh * asp, hh, 1); P_.load[i] = 1; });
      mat.uniforms.tA.value = mat.uniforms.tB.value = texs[0];
      pm.scale.set(2.3, 2.3, 1);
      var beam = new T.Mesh(new T.CylinderGeometry(0.62, 0.95, 1.05, 32, 1, true), new T.ShaderMaterial({ uniforms: { uC: { value: CY.clone() }, uT: UT, uI: { value: 0.55 } }, vertexShader: BEAM_VS, fragmentShader: BEAM_FS, transparent: true, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide }));
      beam.position.y = 0.55; grp.add(beam);
      var pad = new T.Mesh(new T.TorusGeometry(0.95, 0.03, 8, 64), new T.MeshBasicMaterial({ color: CY.clone().multiplyScalar(2.2) })); pad.rotation.x = Math.PI / 2; pad.position.y = 0.04; grp.add(pad);
      var pad2 = new T.Mesh(new T.RingGeometry(0.3, 0.85, 48), new T.MeshBasicMaterial({ color: CY.clone().multiplyScalar(0.35), transparent: true, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide })); pad2.rotation.x = -Math.PI / 2; pad2.position.y = 0.03; grp.add(pad2);
      var n = MOBILE ? 60 : 140, pos = new Float32Array(n * 3), aS = new Float32Array(n), aP = new Float32Array(n);
      for (var k = 0; k < n; k++) { var rr = Math.sqrt(Math.random()) * 0.9, th = Math.random() * 6.283; pos[k * 3] = Math.cos(th) * rr; pos[k * 3 + 1] = Math.random() * 3.6; pos[k * 3 + 2] = Math.sin(th) * rr; aS[k] = 0.15 + Math.random() * 0.5; aP[k] = Math.random(); }
      var pg = new T.BufferGeometry(); pg.setAttribute('position', new T.BufferAttribute(pos, 3)); pg.setAttribute('aS', new T.BufferAttribute(aS, 1)); pg.setAttribute('aP', new T.BufferAttribute(aP, 1));
      var pmat = new T.ShaderMaterial({ uniforms: { uT: UT, uPx: { value: PR * 3 }, uH: { value: 3.6 }, uC: { value: CY.clone() } }, vertexShader: PT_VS, fragmentShader: PT_FS, transparent: true, blending: T.AdditiveBlending, depthWrite: false });
      var pts = new T.Points(pg, pmat); grp.add(pts);
      panels.push({ E: E, grp: grp, mesh: pm, mat: mat, beam: beam, pad: pad, pts: pts, col: col, texs: texs, hot: 0, on: 0, load: 0 });
    });
    // 舱内悬浮尘埃 + 远处星空
    function dust(n, rad, hgt, size, col, speed) {
      var pos = new Float32Array(n * 3), aS = new Float32Array(n), aP = new Float32Array(n);
      for (var k = 0; k < n; k++) { var rr = Math.sqrt(Math.random()) * rad, th = Math.random() * 6.283; pos[k * 3] = Math.cos(th) * rr; pos[k * 3 + 1] = Math.random() * hgt; pos[k * 3 + 2] = Math.sin(th) * rr; aS[k] = speed * (0.3 + Math.random()); aP[k] = Math.random(); }
      var g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.setAttribute('aS', new T.BufferAttribute(aS, 1)); g.setAttribute('aP', new T.BufferAttribute(aP, 1));
      var p = new T.Points(g, new T.ShaderMaterial({ uniforms: { uT: UT, uPx: { value: PR * size }, uH: { value: hgt }, uC: { value: col } }, vertexShader: PT_VS, fragmentShader: PT_FS, transparent: true, blending: T.AdditiveBlending, depthWrite: false }));
      sc.add(p); return p;
    }
    dust(MOBILE ? 500 : 1400, R + 1, 7, 1.6, CY.clone().multiplyScalar(0.7), 0.05);
    dust(MOBILE ? 120 : 300, R, 7, 2.4, GD.clone().multiplyScalar(0.8), 0.08);
    var sp = [], sc2 = []; for (var q = 0; q < (MOBILE ? 1200 : 3000); q++) { var v = new T.Vector3().randomDirection(); if (v.y < -0.05) v.y = -v.y; v.multiplyScalar(150 + Math.random() * 60); sp.push(v.x, v.y, v.z); var b = 0.4 + Math.random() * 0.8; sc2.push(b, b, b * 1.1); }
    var sg = new T.BufferGeometry(); sg.setAttribute('position', new T.Float32BufferAttribute(sp, 3)); sg.setAttribute('color', new T.Float32BufferAttribute(sc2, 3));
    sc.add(new T.Points(sg, new T.PointsMaterial({ size: 0.6 * PR, vertexColors: true, fog: false, sizeAttenuation: true })));
    // 中央全息投影仪:旋转的环与光柱
    var core = new T.Group(); sc.add(core);
    [0.9, 1.25, 1.6].forEach(function (rad, k) { var m = new T.Mesh(new T.TorusGeometry(rad, 0.012, 6, 96), new T.MeshBasicMaterial({ color: (k === 1 ? GD : CY).clone().multiplyScalar(1.8) })); m.rotation.x = Math.PI / 2; m.position.y = 0.05 + k * 0.02; core.add(m); });

    /* ---- 自研泛光:亮部提取 → 半分辨率/四分之一分辨率可分离高斯 → 合成 + 色调映射 ---- */
    var HT = rd.capabilities.isWebGL2 ? T.HalfFloatType : T.UnsignedByteType;
    function rt(w, hh) { return new T.WebGLRenderTarget(w, hh, { type: HT, minFilter: T.LinearFilter, magFilter: T.LinearFilter, depthBuffer: false }); }
    var rtS = new T.WebGLRenderTarget(4, 4, { type: HT, minFilter: T.LinearFilter, magFilter: T.LinearFilter, samples: rd.capabilities.isWebGL2 && !MOBILE ? 4 : 0 });
    var rA = rt(4, 4), rB = rt(4, 4), rC = rt(4, 4), rD = rt(4, 4);
    var fsCam = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1), fsSc = new T.Scene(), quad = new T.Mesh(new T.PlaneGeometry(2, 2)); fsSc.add(quad);
    var mBright = new T.ShaderMaterial({ uniforms: { t: { value: null }, th: { value: 0.82 } }, vertexShader: FSQ_VS, fragmentShader: 'uniform sampler2D t; uniform float th; varying vec2 vUv; void main(){ vec3 c=texture2D(t,vUv).rgb; float l=max(c.r,max(c.g,c.b)); gl_FragColor=vec4(c*smoothstep(th,th+.5,l),1.); }', depthTest: false });
    var mBlur = new T.ShaderMaterial({ uniforms: { t: { value: null }, d: { value: new T.Vector2() } }, vertexShader: FSQ_VS, depthTest: false,
      fragmentShader: 'uniform sampler2D t; uniform vec2 d; varying vec2 vUv; void main(){ vec3 c=texture2D(t,vUv).rgb*.227; c+=(texture2D(t,vUv+d*1.385).rgb+texture2D(t,vUv-d*1.385).rgb)*.316; c+=(texture2D(t,vUv+d*3.23).rgb+texture2D(t,vUv-d*3.23).rgb)*.07; gl_FragColor=vec4(c,1.); }' });
    var mComp = new T.ShaderMaterial({ uniforms: { tS: { value: null }, tA: { value: null }, tC: { value: null }, k: { value: new T.Vector2(0.75, 0.95) }, uT: UT }, vertexShader: FSQ_VS, depthTest: false,
      fragmentShader: 'uniform sampler2D tS,tA,tC; uniform vec2 k; uniform float uT; varying vec2 vUv; void main(){ vec3 c=texture2D(tS,vUv).rgb+texture2D(tA,vUv).rgb*k.x+texture2D(tC,vUv).rgb*k.y; c=c*(2.51*c+.03)/(c*(2.43*c+.59)+.14); vec2 q=vUv-.5; c*=1.-dot(q,q)*.55; gl_FragColor=vec4(clamp(c,0.,1.),1.); }' });
    function pass(m, target) { quad.material = m; rd.setRenderTarget(target); rd.render(fsSc, fsCam); }
    function bloomRender() {
      rd.setRenderTarget(rtS); rd.render(sc, cam);
      mBright.uniforms.t.value = rtS.texture; pass(mBright, rA);
      mBlur.uniforms.t.value = rA.texture; mBlur.uniforms.d.value.set(1 / rA.width, 0); pass(mBlur, rB);
      mBlur.uniforms.t.value = rB.texture; mBlur.uniforms.d.value.set(0, 1 / rA.height); pass(mBlur, rA);
      mBlur.uniforms.t.value = rA.texture; mBlur.uniforms.d.value.set(1 / rC.width, 0); pass(mBlur, rD);   // 下采样 + 横向
      mBlur.uniforms.t.value = rD.texture; mBlur.uniforms.d.value.set(0, 1 / rC.height); pass(mBlur, rC);
      mBlur.uniforms.t.value = rC.texture; mBlur.uniforms.d.value.set(2 / rC.width, 0); pass(mBlur, rD);
      mBlur.uniforms.t.value = rD.texture; mBlur.uniforms.d.value.set(0, 2 / rC.height); pass(mBlur, rC);
      mComp.uniforms.tS.value = rtS.texture; mComp.uniforms.tA.value = rA.texture; mComp.uniforms.tC.value = rC.texture; pass(mComp, null);
    }
    G = { T: T, rd: rd, sc: sc, cam: cam, ring: ring, panels: panels, UT: UT, core: core, roofA: roofA, roofB: roofB, baseR: baseR, rts: [rtS, rA, rB, rC, rD], render: bloomRender, ray: new T.Raycaster(), v2: new T.Vector2(), tex: tex, lookY: 2.1 };
    // 交互:拖动旋转、点选
    var drag = null;
    cv.addEventListener('pointerdown', function (e) { drag = { x: e.clientX, y: e.clientY, r0: L.rotT, moved: 0, t: performance.now() }; cv.setPointerCapture(e.pointerId); });
    cv.addEventListener('pointermove', function (e) {
      if (drag) { var dx = e.clientX - drag.x; drag.moved = Math.max(drag.moved, Math.abs(dx) + Math.abs(e.clientY - drag.y)); if (drag.moved > 6) { if (L.focus >= 0) unfocus(); L.rotT = drag.r0 - dx * 0.006; L.vel = 0; } }
      else hoverAt(e);
    });
    cv.addEventListener('pointerup', function (e) {
      if (!drag) return; var d = drag; drag = null;
      if (d.moved <= 6) { var i = pick(e); if (i >= 0) { if (L.focus === i) unfocus(); else focus(i); } else if (L.focus >= 0) unfocus(); }
      else { L.rotT = Math.round(L.rotT / STEP) * STEP; P('tick'); }
    });
    cv.addEventListener('wheel', function (e) { e.preventDefault(); if (L.focus >= 0) return; L.rotT += Math.sign(e.deltaY || e.deltaX) * STEP; L.rotT = Math.round(L.rotT / STEP) * STEP; }, { passive: false });
    resize();
  }
  var P_ = { load: {} };
  function pick(e) {
    if (!G) return -1; var b = U.cv.getBoundingClientRect();
    G.v2.set((e.clientX - b.left) / b.width * 2 - 1, -(e.clientY - b.top) / b.height * 2 + 1); G.ray.setFromCamera(G.v2, G.cam);
    var hit = G.ray.intersectObjects(G.panels.map(function (p) { return p.mesh; }), false); return hit.length ? hit[0].object.userData.i : -1;
  }
  function hoverAt(e) { var i = pick(e); if (i !== L.hover) { L.hover = i; U.cv.style.cursor = i >= 0 ? 'pointer' : 'grab'; if (i >= 0) P('tick'); } }
  function resize() {
    if (!G) return; var w = innerWidth, hh = innerHeight, pr = G.rd.getPixelRatio();
    G.rd.setSize(w, hh, false); U.cv.style.width = w + 'px'; U.cv.style.height = hh + 'px';
    G.cam.aspect = w / hh; G.cam.fov = w / hh < 1.2 ? 68 : 55; G.cam.updateProjectionMatrix();
    var W = Math.round(w * pr), H = Math.round(hh * pr);
    G.rts[0].setSize(W, H); G.rts[1].setSize(W >> 1, H >> 1); G.rts[2].setSize(W >> 1, H >> 1); G.rts[3].setSize(W >> 2, H >> 2); G.rts[4].setSize(W >> 2, H >> 2);
  }

  /* 多波段贴图:聚焦时才加载其余波段 */
  function ensureBands(p) {
    p.E.bands.forEach(function (b, j) { if (!p.texs[j]) p.texs[j] = G.tex(b.img); });
  }
  var raf = 0, last = 0, camP = null, camL = null;
  function loop(t) {
    raf = requestAnimationFrame(loop); var dt = Math.min(0.05, (t - last) / 1000 || 0.016); last = t; L.t += dt;
    if (!G) return; var T = G.T; G.UT.value = L.t;
    L.rot += (L.rotT - L.rot) * Math.min(1, dt * 5);
    G.ring.rotation.y = L.rot;
    L.band += (L.bandT - L.band) * Math.min(1, dt * 3.2); if (Math.abs(L.bandT - L.band) < 0.002) L.band = L.bandT;
    if (L.focus >= 0 && document.activeElement !== U.rng && Math.abs(+U.rng.value - L.band) > 0.001) { U.rng.value = L.band; if (Math.round(L.band) !== L.bj) { L.bj = Math.round(L.band); bandText(); } }
    L.fx += ((L.focus >= 0 ? 1 : 0) - L.fx) * Math.min(1, dt * 3);
    // 相机:展厅中心略后 → 走近展品
    var near = MOBILE || innerWidth / innerHeight < 1.2 ? 1 : 0, sideX = L.focus >= 0 && !near ? 0.95 : 0;
    camP = camP || new T.Vector3(); camL = camL || new T.Vector3();
    var z0 = 3.4, z1 = -R + (near ? 4.7 : 3.9);
    camP.set(sideX * L.fx + Math.sin(L.t * 0.21) * 0.08, 1.75 + 0.35 * L.fx + Math.sin(L.t * 0.33) * 0.05, z0 + (z1 - z0) * L.fx);
    camL.set(sideX * L.fx, 2.15 + 0.05 * L.fx, -R);
    G.cam.position.lerp(camP, Math.min(1, dt * 4)); G.cam.lookAt(camL);
    G.panels.forEach(function (p, i) {
      var on = L.focus === i ? 1 : 0, hot = L.hover === i ? 1 : 0;
      p.on += (on - p.on) * Math.min(1, dt * 4); p.hot += (hot - p.hot) * Math.min(1, dt * 6);
      p.load += ((P_.load[i] ? 1 : 0) - p.load) * Math.min(1, dt * 1.5);
      var u = p.mat.uniforms; u.uOn.value = p.on; u.uHot.value = p.hot; u.uLoad.value = p.load;
      var c = BAND_COL[p.E.bands[0].k];
      if (on && p.E.bands.length > 1) {
        ensureBands(p); var j = Math.min(Math.floor(L.band), p.E.bands.length - 2), f = L.band - j;
        u.tA.value = p.texs[j]; u.tB.value = p.texs[j + 1]; u.uMix.value = f; c = BAND_COL[p.E.bands[Math.round(L.band)].k];
      } else if (!on) { u.tA.value = u.tB.value = p.texs[0]; u.uMix.value = 0; }
      u.uCol.value.lerp(p.col.set(L.focus === i ? c : '#3fe0ff'), Math.min(1, dt * 4));
      p.mesh.position.y = 2.25 + Math.sin(L.t * 0.9 + i) * 0.05 + p.on * 0.1;
      p.grp.scale.setScalar(1 + p.on * 0.06 + p.hot * 0.03);
      p.beam.material.uniforms.uI.value = 0.4 + p.on * 0.3 + p.hot * 0.2; p.beam.material.uniforms.uC.value.copy(u.uCol.value);
      p.pad.rotation.z += dt * (0.3 + p.on);
      p.pts.material.uniforms.uC.value.copy(u.uCol.value);
    });
    G.core.rotation.y += dt * 0.4; G.core.children.forEach(function (m, k) { if (m.geometry.type === 'TorusGeometry') m.rotation.z += dt * (k % 2 ? -0.6 : 0.8); });
    G.roofA.rotation.y += dt * 0.03; G.roofB.rotation.y -= dt * 0.05; G.baseR.rotation.y = L.rot;
    G.render();
  }

  /* 没有 WebGL 时:平铺画廊 */
  function fallback() {
    U.fb.hidden = false; U.cv.hidden = true; U.fb.innerHTML = '';
    EX.forEach(function (E, i) { var c = h('button', 'ar-fbc', '<img alt="" src="arc/' + E.bands[0].img + '.webp"><b>' + E.zh + '</b><small>' + E.dist + '</small>'); c.type = 'button'; c.onclick = function () { focus(i); }; U.fb.appendChild(c); });
  }
  var leRender = null;
  function pauseLE(p) {   // 展厅打开时停掉母港地球的渲染,省一半 GPU
    var lr = window.LE && LE.scene && LE.scene.renderer; if (!lr) return;
    if (p) { if (!leRender && !document.body.classList.contains('voy-on')) { leRender = lr.render; lr.render = function () { }; } }
    else if (leRender) { lr.render = leRender; leRender = null; }
  }
  function open() {
    if (!U.root) { build(); css(); }
    pauseLE(true);
    U.root.hidden = false; document.body.classList.add('ml-on', 'ar-on'); count();
    if (!G && window.THREE) try { initGL(); } catch (e) { console.warn('[archive] WebGL 失败', e); }
    if (!G) fallback();
    resize(); cancelAnimationFrame(raf); raf = requestAnimationFrame(loop); P('open');
    if (window.LE && LE.bus) try { LE.bus.emit('archive:open'); } catch (e) { }
  }
  function close() { U.root.hidden = true; document.body.classList.remove('ml-on', 'ar-on'); cancelAnimationFrame(raf); pauseLE(false); if (L.focus >= 0) unfocus(); P('close'); }
  addEventListener('resize', function () { if (U.root && !U.root.hidden) resize(); });

  function css() {
    if (document.getElementById('ar-css')) return; var s = document.createElement('style'); s.id = 'ar-css';
    s.textContent = [
      '.ar{position:fixed;inset:0;z-index:85;background:#01030a;color:#e8f2ff;font-family:"Noto Sans SC","PingFang SC","Microsoft YaHei",sans-serif;overflow:hidden}.ar[hidden]{display:none}',
      '.ar-cv{position:absolute;inset:0;display:block;touch-action:none;cursor:grab}',
      '.ar-vig{position:absolute;inset:0;pointer-events:none;background:linear-gradient(180deg,rgba(1,3,10,.75),transparent 18%,transparent 78%,rgba(1,3,10,.8))}',
      '.ar-hd{position:absolute;top:0;left:0;right:0;display:flex;align-items:center;gap:14px;padding:14px 18px;pointer-events:none}',
      '.ar-ttl small{display:block;font-size:11px;letter-spacing:.2em;color:#7fd8ef}.ar-ttl b{font-size:24px;letter-spacing:.14em;color:#fff;text-shadow:0 0 18px rgba(63,224,255,.7)}.ar-ttl b span{font-size:11px;letter-spacing:.4em;color:#ffc861;margin-left:8px;font-weight:600}',
      '.ar-cnt{margin-left:auto;color:#ffc861;font-size:13px;letter-spacing:.1em;text-shadow:0 0 10px rgba(255,200,97,.6)}',
      '.ar-x{pointer-events:auto;width:36px;height:36px;border-radius:50%;border:1px solid rgba(63,224,255,.55);background:rgba(5,20,34,.6);color:#bff3ff;cursor:pointer;box-shadow:0 0 14px rgba(63,224,255,.35)}',
      '.ar-info{--bc:#3fe0ff;position:absolute;right:22px;top:76px;width:min(340px,34vw);max-height:calc(100% - 190px);overflow:auto;padding:16px 18px 14px;background:linear-gradient(160deg,rgba(10,30,48,.78),rgba(4,10,20,.82));border:1px solid rgba(63,224,255,.35);backdrop-filter:blur(8px);box-shadow:0 0 30px rgba(63,224,255,.18),inset 0 0 24px rgba(63,224,255,.06);clip-path:polygon(0 0,calc(100% - 18px) 0,100% 18px,100% 100%,18px 100%,0 calc(100% - 18px));animation:arIn .45s ease}',
      '.ar-info::before{content:"";position:absolute;left:0;top:0;width:60px;height:2px;background:var(--bc);box-shadow:0 0 12px var(--bc)}',
      '@keyframes arIn{from{opacity:0;transform:translateX(30px)}to{opacity:1;transform:none}}',
      '.ar-k{font-size:11px;letter-spacing:.2em;color:#7fd8ef}.ar-nm{margin:4px 0 0;font-size:24px;letter-spacing:.08em;text-shadow:0 0 14px var(--bc)}.ar-en{font-size:11px;letter-spacing:.3em;color:#ffc861;margin-bottom:10px}',
      '.ar-row{display:flex;justify-content:space-between;align-items:baseline;border-bottom:1px solid rgba(63,224,255,.15);padding:5px 0;font-size:13px;color:#9fc3d8}.ar-row b{color:#fff;font-size:15px;font-weight:600}',
      '.ar-sec{margin-top:10px;font-size:11px;letter-spacing:.24em;color:var(--bc)}.ar-info p{margin:4px 0;font-size:13px;line-height:1.65;color:#d5e4f2}.ar-fact{color:#ffe3a3!important;border-left:2px solid #ffc861;padding-left:8px}.ar-cr{margin-top:8px;font-size:10.5px;color:#7f93ad;line-height:1.5}',
      '.ar-band{position:absolute;left:50%;bottom:70px;transform:translateX(-50%);width:min(560px,80vw);padding:10px 16px 12px;background:rgba(4,14,26,.72);border:1px solid rgba(63,224,255,.4);border-radius:12px;box-shadow:0 0 24px rgba(63,224,255,.2);backdrop-filter:blur(6px)}',
      '.ar-chips{display:flex;justify-content:space-between;gap:8px;margin-bottom:6px}.ar-chip{--bc:#3fe0ff;flex:1;background:none;border:1px solid rgba(255,255,255,.18);color:#c9d6e8;border-radius:8px;padding:5px 6px;font:inherit;font-size:12px;cursor:pointer;transition:.25s}',
      '.ar-chip.on{border-color:var(--bc);color:#fff;box-shadow:0 0 14px var(--bc),inset 0 0 10px var(--bc);text-shadow:0 0 8px var(--bc)}',
      '.ar-rng{width:100%;accent-color:#3fe0ff;height:18px}',
      '.ar-nav{position:absolute;left:50%;bottom:22px;transform:translateX(-50%);display:flex;align-items:center;gap:14px}',
      '.ar-nav button{width:40px;height:40px;border-radius:50%;border:1px solid rgba(255,200,97,.6);background:rgba(20,16,6,.5);color:#ffe3a3;font-size:22px;line-height:1;cursor:pointer;box-shadow:0 0 14px rgba(255,200,97,.3)}',
      '.ar-tip{font-size:12px;letter-spacing:.12em;color:#9fd9ef;text-shadow:0 0 8px rgba(63,224,255,.6);white-space:nowrap}',
      '.ar-foot{position:absolute;left:14px;bottom:6px;right:14px;font-size:10px;color:rgba(160,180,210,.55);text-align:center;pointer-events:none}',
      '.ar-fb[hidden]{display:none}.ar-fb{position:absolute;inset:70px 20px 70px;display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px;overflow:auto}.ar-fbc{background:rgba(8,20,34,.7);border:1px solid rgba(63,224,255,.3);border-radius:10px;color:#fff;padding:8px;cursor:pointer;display:flex;flex-direction:column;gap:4px;font:inherit}.ar-fbc img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:6px}.ar-fbc small{color:#9fb3cc}',
      '@media (max-width:760px),(max-height:480px){.ar-info{left:12px;right:auto;top:auto;bottom:60px;width:min(300px,46vw);max-height:calc(100% - 130px);padding:10px 12px}.ar-nm{font-size:18px}.ar-info p{font-size:12px;line-height:1.5}.ar-band{left:auto;right:12px;transform:none;bottom:60px;width:min(300px,44vw);padding:6px 10px}.ar-chip{font-size:11px;padding:3px 4px}.ar-ttl b{font-size:18px}.ar-hd{padding:8px 12px}.ar-tip{font-size:11px}.ar-nav{bottom:12px}.ar-foot{display:none}}'
    ].join('\n');
    document.head.appendChild(s);
  }

  /* 入口:母港右侧「星档馆」按钮;?arc=1 直接打开 */
  function addEntry() {
    var nav = document.querySelector('.le-actions'); if (!nav || document.querySelector('.sh-btn-arc')) return;
    var b = h('button', 'le-btn le-btn--hero sh-btn-arc', '<span class="le-btn__ico">✦</span><span class="le-btn__txt">星档馆<small>ARCHIVE</small></span>'); b.type = 'button';
    b.addEventListener('click', open); var bv = nav.querySelector('.sh-btn-voy') || nav.querySelector('.sh-btn-quest'); nav.insertBefore(b, bv ? bv.nextSibling : null);
  }
  (function wait(n) { if (document.querySelector('.sh-btn-voy') || (n > 80 && document.querySelector('.sh-btn-quest'))) return addEntry(); if (n > 600) return; setTimeout(function () { wait(n + 1); }, 100); })(0);
  if (/[?&]arc=1/.test(location.search)) (function w3(n) { if (window.SH_READY || n > 80) return open(); setTimeout(function () { w3(n + 1); }, 100); })(0);
  SH.archive = { open: open, close: close, focus: function (i) { focus(i); }, unfocus: unfocus, _L: L, EX: EX, _G: function () { return G; } };
})();
