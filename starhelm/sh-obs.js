/* 天枢 Starhelm · 天枢天文台 v1(v1.0-M3g,取代星档馆入口)
 * 王磊 10-23:星档馆改为天文台。点击 → 圆顶天窗打开、望远镜转向目标、镜头沿镜筒「一镜到底」推进,画面收成圆形目镜;
 * 目镜里先是星空,再一路放大到探测器/望远镜实拍。左侧按距离由近到远分七类目录,右侧信息卡注明怎么拍、多远、来源署名;
 * 多波段目标底部可切换「眼睛」(可见光/红外/X 射线/射电)。
 * 图像全部为公开授权真实影像,自托管于 arc/;署名见每条与 docs/DATA-SOURCES.md。存储 gn:sh:obs */
(function () {
  'use strict';
  var SH = window.SH = window.SH || {};
  var KEY = 'gn:sh:obs';
  var ST = (function () { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } })(); ST.seen = ST.seen || [];
  function save() { try { localStorage.setItem(KEY, JSON.stringify(ST)); } catch (e) { } }
  function h(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function P(n) { if (window.LE && LE.audio) try { LE.audio.play(n); } catch (e) { } }
  var MOBILE = Math.min(innerWidth, innerHeight) < 560 || /Mobi|Android|iPhone|iPad/.test(navigator.userAgent);

  /* ---------------- 目录:按距离由近到远 ---------------- */
  var CATS = [
    { k: 'sun', zh: '太阳与地月', en: 'SUN · EARTH · MOON', d: '0 – 1.5 亿 km' },
    { k: 'pl', zh: '行星与卫星', en: 'PLANETS & MOONS', d: '0.8 – 45 亿 km' },
    { k: 'edge', zh: '太阳系边疆', en: 'OUTER SOLAR SYSTEM', d: '40 – 60 亿 km' },
    { k: 'neb', zh: '恒星与星云', en: 'STARS & NEBULAE', d: '数千光年' },
    { k: 'mw', zh: '银河系', en: 'THE MILKY WAY', d: '2.6 万光年', soon: 1 },
    { k: 'gal', zh: '星系', en: 'GALAXIES', d: '数百万 – 数亿光年' },
    { k: 'deep', zh: '宇宙深处', en: 'DEEP UNIVERSE', d: '100 亿光年以上' }
  ];
  var CAT_OF = { sun: 'sun', earth: 'sun', pbd: 'edge', jupiter: 'pl', pillars: 'neb', crab: 'neb', cliffs: 'neb', m87: 'gal', deep: 'deep' };
  var SCOPE_OF = { sun: '太阳动力学天文台 SDO', earth: '阿波罗 17 号 · 哈苏相机', pbd: '旅行者 1 号', jupiter: '哈勃空间望远镜', pillars: '哈勃 / 韦布空间望远镜', crab: '哈勃 / 韦布 / 钱德拉', cliffs: '韦布空间望远镜', m87: '事件视界望远镜 EHT', deep: '韦布空间望远镜' };
  var RADEC = { pillars: [274.70, -13.84], crab: [83.63, 22.01], cliffs: [159.20, -58.62], m87: [187.71, 12.39], deep: [110.83, -73.45] };
  var BODY = { sun: 'Sun', moon: 'Moon', mercury: 'Mercury', venus: 'Venus', mars: 'Mars', jupiter: 'Jupiter', saturn: 'Saturn', uranus: 'Uranus', neptune: 'Neptune', pluto: 'Pluto', io: 'Jupiter', europa: 'Jupiter' };
  function V(zh, k, img, t, cr) { return { zh: zh, k: k, img: img, t: t, cr: cr }; }
  var NEW = [
    { id: 'moon', cat: 'sun', zh: '满月', en: 'THE FULL MOON', dist: '约 38 万 km', light: '1.3 秒', scope: '地面望远镜 · 加州',
      how: '2010 年天文爱好者 Gregory H. Revera 在美国亚利桑那州用一台 9.25 英寸望远镜拍摄,多张照片拼合。',
      bands: [V('可见光', 'vis', 'moon', '暗色的「月海」是 30 多亿年前流出的玄武岩熔岩,亮的是更古老的高地。', 'Gregory H. Revera(CC BY-SA 3.0)')],
      fact: '月球永远用同一面对着地球,因为它被地球「潮汐锁定」了。' },
    { id: 'earthrise', cat: 'sun', zh: '地出', en: 'EARTHRISE', dist: '约 38 万 km', light: '1.3 秒', scope: '阿波罗 8 号 · 哈苏相机',
      how: '1968 年 12 月 24 日,阿波罗 8 号绕月飞行时,宇航员比尔·安德斯从舷窗看到地球从月平线升起,抓拍下这张照片。',
      bands: [V('可见光', 'vis', 'earthrise', '前景是灰色的月面,远处半个蓝白色的地球悬在黑暗里。', 'NASA / Bill Anders(公有领域)')],
      fact: '这是人类第一次从另一个世界回望地球。' },
    { id: 'mercury', cat: 'pl', zh: '水星', en: 'MERCURY', dist: '约 0.8 – 2.2 亿 km', light: '约 5 分钟', scope: '信使号探测器',
      how: '2008 年信使号(MESSENGER)第一次飞掠水星时用彩色滤镜拍摄,颜色被增强以显示不同的岩石成分。',
      bands: [V('增强色', 'vis', 'mercury', '布满撞击坑,浅蓝的亮纹是较新的撞击溅射物。', 'NASA / JHUAPL / Carnegie Institution(公有领域)')],
      fact: '水星白天约 430°C,夜里降到约 -180°C。' },
    { id: 'venus', cat: 'pl', zh: '金星', en: 'VENUS', dist: '约 0.4 – 2.6 亿 km', light: '约 2 – 14 分钟', scope: '水手 10 号',
      how: '1974 年水手 10 号飞往水星途中经过金星拍摄,按人眼看到的颜色重新处理。',
      bands: [V('近似真彩', 'vis', 'venus', '你看不到地面:整颗星球被浓厚的硫酸云包着。', 'NASA / 水手 10 号;处理 Ricardo Nunes(公有领域)')],
      fact: '金星表面约 465°C,比离太阳更近的水星还热:温室效应失控了。' },
    { id: 'mars', cat: 'pl', zh: '火星', en: 'MARS', dist: '约 0.6 – 4 亿 km', light: '约 3 – 22 分钟', scope: '罗塞塔号 OSIRIS 相机',
      how: '2007 年欧洲的罗塞塔号借火星引力加速时,在约 24 万 km 外拍下。',
      bands: [V('真彩色', 'vis', 'mars', '红色来自氧化铁(铁锈)尘土,底部白色的是南极冰盖。', 'ESA & MPS for OSIRIS Team(CC BY-SA 3.0 IGO)')],
      fact: '火星上的奥林波斯山约 22 km 高,是珠穆朗玛峰的两倍多。' },
    { id: 'saturn', cat: 'pl', zh: '土星', en: 'SATURN', dist: '约 13 – 16 亿 km', light: '约 75 分钟', scope: '卡西尼号探测器',
      how: '2008 年卡西尼号在土星分点(阳光正好照在环平面)前后拍摄的拼接图。',
      bands: [V('真彩色', 'vis', 'saturn', '土星环宽约 28 万 km,但大部分地方只有约 10 米厚。', 'NASA / JPL / Space Science Institute(公有领域)')],
      fact: '土星的密度比水还小,理论上能浮在一个足够大的浴缸里。' },
    { id: 'uranus', cat: 'pl', zh: '天王星', en: 'URANUS', dist: '约 26 – 32 亿 km', light: '约 2.7 小时', scope: '旅行者 2 号',
      how: '1986 年 1 月旅行者 2 号飞掠天王星时拍摄,按真实颜色校准。至今只有这一艘探测器去过。',
      bands: [V('真彩色', 'vis', 'uranus', '淡青色来自大气里的甲烷吸收了红光。', 'NASA / JPL;色彩校准 Ardenau4(CC0)')],
      fact: '天王星是「躺着」自转的,自转轴倾斜约 98°。' },
    { id: 'neptune', cat: 'pl', zh: '海王星', en: 'NEPTUNE', dist: '约 43 – 47 亿 km', light: '约 4 小时', scope: '旅行者 2 号',
      how: '1989 年 8 月旅行者 2 号飞掠海王星时拍摄,后人用原始数据重新处理。',
      bands: [V('可见光', 'vis', 'neptune', '中间的暗斑是「大暗斑」,一个和地球差不多大的风暴。', 'NASA / JPL / Voyager-ISS;处理 Aster Cowart(公有领域)')],
      fact: '海王星的风速可达每小时 2000 km,是太阳系最快的风。' },
    { id: 'io', cat: 'pl', zh: '木卫一 · 伊奥', en: 'IO', dist: '约 6.3 亿 km', light: '约 35 分钟', scope: '伽利略号探测器',
      how: '1990 年代伽利略号绕木星飞行时拍摄的最高分辨率真彩色图像。',
      bands: [V('真彩色', 'vis', 'io', '黄色是硫,黑点是正在活动的火山口。', 'NASA / JPL / University of Arizona(公有领域)')],
      fact: '伊奥有 400 多座活火山,是太阳系火山最活跃的地方。' },
    { id: 'europa', cat: 'pl', zh: '木卫二 · 欧罗巴', en: 'EUROPA', dist: '约 6.3 亿 km', light: '约 35 分钟', scope: '伽利略号探测器',
      how: '伽利略号 1990 年代拍摄的近似真彩色拼接图。',
      bands: [V('近似真彩', 'vis', 'europa', '棕红色的裂纹是冰壳破裂后,下面的物质涌上来留下的痕迹。', 'NASA / JPL / DLR(公有领域)')],
      fact: '冰壳下可能有一片全球海洋,水量比地球所有海洋加起来还多。' },
    { id: 'pluto', cat: 'edge', zh: '冥王星', en: 'PLUTO', dist: '约 50 亿 km', light: '约 4.6 小时', scope: '新视野号探测器',
      how: '2015 年 7 月 14 日新视野号飞掠冥王星前约 45 万 km 处拍摄,LORRI 黑白相机叠加 Ralph 彩色数据。',
      bands: [V('真彩色', 'vis', 'pluto', '右下那块心形的亮区是氮冰平原「斯普特尼克平原」。', 'NASA / JHUAPL / SwRI(公有领域)')],
      fact: '新视野号飞了 9 年半才到冥王星。' },
    { id: 'c67p', cat: 'edge', zh: '67P 彗星', en: 'COMET 67P', dist: '拍摄时约 4 亿 km', light: '约 22 分钟', scope: '罗塞塔号导航相机',
      how: '2014 年 9 月 19 日罗塞塔号在约 28 km 外环绕拍摄的拼接图。两个月后它放下了「菲莱」着陆器。',
      bands: [V('可见光', 'vis', 'c67p', '像一只「橡皮鸭」的彗核,约 4 km 长,右上方已经有淡淡的喷流。', 'ESA / Rosetta / NAVCAM(CC BY-SA 3.0 IGO)')],
      fact: '这是人类第一次环绕并降落在一颗彗星上。' }
  ];

  var EX = [];
  function buildList() {
    if (EX.length) return EX;
    var old = (SH.archive && SH.archive.EX) || [];
    old.forEach(function (E) { E.cat = CAT_OF[E.id] || 'neb'; E.scope = SCOPE_OF[E.id] || ''; EX.push(E); });
    NEW.forEach(function (E) { EX.push(E); });
    var order = {}; CATS.forEach(function (c, i) { order[c.k] = i; });
    var rank = ['sun', 'earth', 'moon', 'earthrise', 'mercury', 'venus', 'mars', 'jupiter', 'io', 'europa', 'saturn', 'uranus', 'neptune', 'pluto', 'c67p', 'pbd'];
    EX.sort(function (a, b) { return (order[a.cat] - order[b.cat]) || ((rank.indexOf(a.id) + 99) % 199 - (rank.indexOf(b.id) + 99) % 199); });
    return EX;
  }

  /* ---------------- 坐标(赤经赤纬)---------------- */
  function radec(E) {
    if (RADEC[E.id]) return RADEC[E.id];
    var A = window.Astronomy, b = BODY[E.id]; if (!A || !b) return null;
    try { var t = A.MakeTime(new Date()), obs = new A.Observer(39.9, 116.4, 50), eq = A.Equator(b, t, obs, true, true); return [eq.ra * 15, eq.dec]; } catch (e) { return null; }
  }
  function fmtRA(d) { var hh = d / 15, H = Math.floor(hh), m = Math.round((hh - H) * 60); if (m === 60) { H++; m = 0; } return H + 'h ' + (m < 10 ? '0' : '') + m + 'm'; }
  function fmtDec(d) { return (d >= 0 ? '+' : '−') + Math.abs(d).toFixed(1) + '°'; }

  /* ---------------- 3D:圆顶 + 望远镜 + 星空 ---------------- */
  var G = null, U = {}, L = { cur: -1, band: 0, phase: 'idle', t0: 0, slew: 0, alt: 0.25, az: 0, altT: 0.95, azT: 0, cat: 'sun' }, raf = 0, leRender = null;
  var DOME_FS = [
    'uniform float uOpen,uT;varying vec3 vP;',
    'void main(){',
    ' vec3 n=normalize(vP); float az=atan(n.x,-n.z), el=asin(clamp(n.y,-1.,1.));',
    ' float slit=step(abs(n.x),.16*uOpen+.001)*step(-.05,n.z*-1.+.9)*step(.08,n.y);',
    ' if(slit>.5 && n.z<.35) discard;',
    ' float rib=smoothstep(.985,1.,abs(cos(az*12.)))*.8; float ring=smoothstep(.97,1.,abs(cos(el*14.)))*.6;',
    ' float edge=smoothstep(.02,0.,abs(abs(n.x)-.16*uOpen))*step(.08,n.y)*step(n.z,.35)*uOpen;',
    ' vec3 base=vec3(.025,.035,.055)*(.6+.4*n.y);',
    ' vec3 c=base+vec3(.15,.55,.75)*(rib+ring)*.18+vec3(.35,.9,1.)*edge*1.2;',
    ' gl_FragColor=vec4(c,1.);}'
  ].join('\n');
  var VS = 'varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}';
  function initGL() {
    var T = THREE, cv = U.cv;
    var rd = new T.WebGLRenderer({ canvas: cv, antialias: !MOBILE, alpha: false, powerPreference: 'high-performance' });
    var PR = MOBILE ? 1 : Math.min(1.75, devicePixelRatio || 1); rd.setPixelRatio(PR); rd.setClearColor(0x000005, 1);
    var sc = new T.Scene(), cam = new T.PerspectiveCamera(55, 1, 0.05, 600);
    var UT = { value: 0 }, UO = { value: 0 };
    // 星空:真实感星点 + 银河带
    var n = MOBILE ? 5000 : 14000, pos = new Float32Array(n * 3), col = new Float32Array(n * 3), sz = new Float32Array(n);
    for (var i = 0; i < n; i++) {
      var u = Math.random() * 2 - 1, a = Math.random() * 6.2832, r = Math.sqrt(1 - u * u), band = i < n * 0.45;
      var x = Math.cos(a) * r, y = u, z = Math.sin(a) * r;
      if (band) { var t = Math.random() * 6.2832, w = (Math.random() - 0.5) * 0.22 * Math.random(); x = Math.cos(t); y = w + Math.sin(t) * 0.45; z = Math.sin(t) * 0.89; var l = Math.hypot(x, y, z); x /= l; y /= l; z /= l; }
      pos[i * 3] = x * 300; pos[i * 3 + 1] = y * 300; pos[i * 3 + 2] = z * 300;
      var tc = Math.random(), m = band ? 0.55 : 1; col[i * 3] = (0.8 + 0.2 * tc) * m; col[i * 3 + 1] = (0.85 + 0.1 * tc) * m; col[i * 3 + 2] = (1.0 - 0.25 * tc) * m;
      sz[i] = band ? 0.6 + Math.random() * 0.8 : Math.pow(Math.random(), 6) * 4 + 0.8;
    }
    var sg = new T.BufferGeometry(); sg.setAttribute('position', new T.BufferAttribute(pos, 3)); sg.setAttribute('color', new T.BufferAttribute(col, 3)); sg.setAttribute('sz', new T.BufferAttribute(sz, 1));
    var stars = new T.Points(sg, new T.ShaderMaterial({ uniforms: { uPx: { value: PR }, uT: UT },
      vertexShader: 'attribute float sz;attribute vec3 color;varying vec3 vC;uniform float uPx,uT;void main(){vC=color*(.75+.25*sin(uT*2.+position.x));gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_PointSize=sz*uPx*1.4;}',
      fragmentShader: 'varying vec3 vC;void main(){vec2 d=gl_PointCoord-.5;float a=exp(-dot(d,d)*18.);gl_FragColor=vec4(vC*a,1.);}', transparent: true, blending: T.AdditiveBlending, depthWrite: false }));
    sc.add(stars);
    // 圆顶
    var dome = new T.Mesh(new T.SphereGeometry(9, 96, 48, 0, Math.PI * 2, 0, Math.PI / 2), new T.ShaderMaterial({ uniforms: { uOpen: UO, uT: UT }, vertexShader: VS, fragmentShader: DOME_FS, side: T.BackSide }));
    sc.add(dome);
    // 地面:发光同心环
    var floor = new T.Mesh(new T.CircleGeometry(9, 96), new T.ShaderMaterial({ uniforms: { uT: UT }, vertexShader: VS,
      fragmentShader: 'uniform float uT;varying vec3 vP;void main(){float r=length(vP.xy);float g=smoothstep(.04,0.,abs(fract(r*.9-uT*.08)-.5)-.44)*.5+smoothstep(.06,0.,abs(r-2.3))*1.2;vec3 c=vec3(.01,.02,.035)+vec3(.2,.8,1.)*g*.35*(1.-r/9.);gl_FragColor=vec4(c,1.);}' }));
    floor.rotation.x = -Math.PI / 2; sc.add(floor);
    // 望远镜:墩 + 叉式支架 + 镜筒(桁架感的发光环)
    var metal = new T.MeshStandardMaterial({ color: 0x9aa7b8, metalness: 0.85, roughness: 0.32 }), dark = new T.MeshStandardMaterial({ color: 0x1a2130, metalness: 0.7, roughness: 0.45 });
    var glow = new T.MeshBasicMaterial({ color: new T.Color(0x5fe8ff).multiplyScalar(1.6) });
    var pier = new T.Mesh(new T.CylinderGeometry(0.55, 0.8, 1.6, 48), dark); pier.position.y = 0.8; sc.add(pier);
    var azG = new T.Group(); azG.position.y = 1.6; sc.add(azG);
    var base = new T.Mesh(new T.CylinderGeometry(0.9, 0.9, 0.18, 64), metal); azG.add(base);
    [-1, 1].forEach(function (s) { var arm = new T.Mesh(new T.BoxGeometry(0.16, 1.5, 0.5), metal); arm.position.set(s * 0.78, 0.8, 0); azG.add(arm); });
    var altG = new T.Group(); altG.position.y = 1.35; azG.add(altG);
    var tube = new T.Group(); altG.add(tube);
    var tb = new T.Mesh(new T.CylinderGeometry(0.62, 0.62, 4.2, 64, 1, true), new T.MeshStandardMaterial({ color: 0xdfe6ee, metalness: 0.6, roughness: 0.35, side: T.DoubleSide })); tb.rotation.x = Math.PI / 2; tube.add(tb);
    for (var k = -2; k <= 2; k++) { var rg = new T.Mesh(new T.TorusGeometry(0.64, 0.025, 8, 64), k === 2 ? glow : dark); rg.position.z = -k * 1.0; tube.add(rg); }
    var lens = new T.Mesh(new T.CircleGeometry(0.6, 48), new T.MeshBasicMaterial({ color: 0x0a1830 })); lens.position.z = 2.08; tube.add(lens);
    var eyep = new T.Mesh(new T.CylinderGeometry(0.08, 0.1, 0.4, 16), metal); eyep.position.set(0.66, 0, -1.6); eyep.rotation.z = Math.PI / 2; tube.add(eyep);
    sc.add(new T.HemisphereLight(0x9fdfff, 0x05070c, 0.9));
    var key = new T.PointLight(0x7fe7ff, 18, 14); key.position.set(-3, 5, 3); sc.add(key);
    var rim = new T.PointLight(0xffc27a, 10, 12); rim.position.set(3, 2, -4); sc.add(rim);
    G = { rd: rd, sc: sc, cam: cam, UT: UT, UO: UO, azG: azG, altG: altG, tube: tube, stars: stars };
  }
  function resize() { if (!G) return; var w = innerWidth, hh = innerHeight; G.rd.setSize(w, hh, false); G.cam.aspect = w / hh; G.cam.updateProjectionMatrix(); }
  var V3 = null;
  function loop(now) {
    raf = requestAnimationFrame(loop);
    var dt = Math.min(0.05, (now - (L.last || now)) / 1000); L.last = now;
    if (!G) return;
    var T = THREE; V3 = V3 || { a: new T.Vector3(), b: new T.Vector3(), c: new T.Vector3(), d: new T.Vector3() };
    G.UT.value = now / 1000;
    L.el = (L.el || 0) + dt; var el = L.el;   // 用累计帧时间,低帧率设备也能完整看完开场
    // 圆顶天窗
    var openT = L.phase === 'idle' ? 0 : Math.min(1, el / 1.3);
    G.UO.value += ((L.phase === 'idle' ? 0 : 1) * (0.5 - 0.5 * Math.cos(Math.PI * openT)) - G.UO.value) * Math.min(1, dt * 8);
    // 望远镜转向
    L.alt += (L.altT - L.alt) * Math.min(1, dt * (L.phase === 'eye' ? 1.6 : 1.1)); L.az += (L.azT - L.az) * Math.min(1, dt * (L.phase === 'eye' ? 1.6 : 1.1));
    G.azG.rotation.y = L.az; G.altG.rotation.x = -L.alt;
    // 镜头:入口 → 一镜到底(沿镜筒推进,最后穿过镜筒口进入星空)
    G.tube.updateMatrixWorld(true);
    var front = V3.a.set(0, 0, 2.1).applyMatrix4(G.tube.matrixWorld), back = V3.b.set(0, 0, -2.6).applyMatrix4(G.tube.matrixWorld), ax = V3.c.copy(front).sub(back).normalize();
    var cam = G.cam;
    if (L.phase === 'intro') {
      var q = Math.max(0, Math.min(1, (el - 1.0) / 2.6)), e = q * q * (3 - 2 * q);
      var p0 = V3.d.set(Math.sin(now / 4000) * 0.4 + 3.6, 2.2, 6.2);
      var p1 = back.clone().addScaledVector(ax, -0.4).add(new T.Vector3(0, 0.25, 0));
      var p2 = front.clone().addScaledVector(ax, 6);
      var pos = q < 0.6 ? p0.clone().lerp(p1, (e / 0.6 > 1 ? 1 : (function (x) { return x * x * (3 - 2 * x); })(q / 0.6))) : p1.clone().lerp(p2, Math.pow((q - 0.6) / 0.4, 2));
      cam.position.copy(pos);
      var look = q < 0.6 ? new T.Vector3(0, 2.6, 0).lerp(front.clone().addScaledVector(ax, 20), Math.min(1, q / 0.6)) : front.clone().addScaledVector(ax, 40);
      cam.lookAt(look); cam.fov = 55 - 25 * Math.max(0, (q - 0.6) / 0.4); cam.updateProjectionMatrix();
      if (q >= 1) { L.phase = 'eye'; showEye(); }
    } else if (L.phase === 'eye') {
      // 目镜里:沿镜筒方向看星空,换目标时带着拖影转过去
      cam.position.copy(front).addScaledVector(ax, 6); cam.lookAt(V3.d.copy(front).addScaledVector(ax, 50)); cam.fov = 30; cam.updateProjectionMatrix();
    } else {
      cam.position.set(3.6, 2.2, 6.2); cam.lookAt(0, 2.6, 0);
    }
    G.rd.render(G.sc, cam);
  }

  /* ---------------- 目镜 + HUD ---------------- */
  function build() {
    var r = U.root = h('section', 'ob'); r.hidden = true;
    r.innerHTML = '<canvas class="ob-cv"></canvas><div class="ob-vig"></div>' +
      '<header class="ob-hd"><div class="ob-ttl"><small>STARHELM OBSERVATORY</small><b>天枢天文台</b></div><span class="ob-cnt"></span><button class="ob-x" type="button" aria-label="关闭">✕</button></header>' +
      '<aside class="ob-cat"></aside>' +
      '<div class="ob-eye"><div class="ob-lens"><div class="ob-slew"></div><img class="ob-img" alt=""><div class="ob-cross"></div></div>' +
      '<svg class="ob-ring" viewBox="0 0 200 200"></svg><div class="ob-coord"><span class="ob-ra"></span><span class="ob-dec"></span></div><div class="ob-scope"></div></div>' +
      '<aside class="ob-info"></aside><div class="ob-bands"></div>' +
      '<div class="ob-hint">点击目录选择目标 · 望远镜会转过去</div>' +
      '<p class="ob-cr"></p>';
    document.body.appendChild(r);
    ['cv', 'cat', 'eye', 'img', 'ring', 'ra', 'dec', 'scope', 'info', 'bands', 'cnt', 'x', 'cr', 'slew', 'hint'].forEach(function (k) { U[k] = r.querySelector('.ob-' + k); });
    U.x.onclick = close;
    addEventListener('keydown', function (e) { if (!U.root.hidden && e.key === 'Escape') close(); });
    // 刻度环
    var s = '<circle cx="100" cy="100" r="97" class="r1"/><circle cx="100" cy="100" r="91" class="r2"/>';
    for (var i = 0; i < 120; i++) { var a = i * 3 * Math.PI / 180, l = i % 10 === 0 ? 7 : i % 5 === 0 ? 4.5 : 2.5; s += '<line x1="' + (100 + Math.sin(a) * 97).toFixed(2) + '" y1="' + (100 - Math.cos(a) * 97).toFixed(2) + '" x2="' + (100 + Math.sin(a) * (97 - l)).toFixed(2) + '" y2="' + (100 - Math.cos(a) * (97 - l)).toFixed(2) + '"/>'; }
    s += '<g class="ob-rg"><path d="M100 3 l3 6 h-6z" class="mk"/></g>';
    U.ring.innerHTML = s; U.rg = U.ring.querySelector('.ob-rg');
    buildCat();
  }
  function buildCat() {
    var html = '<div class="ob-ch">目录 · 由近到远</div>';
    CATS.forEach(function (c, ci) {
      var items = EX.filter(function (E) { return E.cat === c.k; });
      html += '<div class="ob-c' + (c.k === L.cat ? ' is-open' : '') + '" data-k="' + c.k + '"><button type="button" class="ob-cb"><i>' + (ci + 1) + '</i><span><b>' + c.zh + '</b><small>' + c.d + '</small></span><em>' + (c.soon ? '下一轮' : items.length) + '</em></button><div class="ob-ci">';
      items.forEach(function (E) { var i = EX.indexOf(E); html += '<button type="button" class="ob-it' + (ST.seen.indexOf(E.id) >= 0 ? ' seen' : '') + '" data-i="' + i + '"><b>' + E.zh + '</b><small>' + E.dist + '</small></button>'; });
      if (!items.length) html += '<p class="ob-soon">银心、人马座 A* 黑洞、银河全景等即将加入</p>';
      html += '</div></div>';
    });
    U.cat.innerHTML = html;
    U.cat.querySelectorAll('.ob-cb').forEach(function (b) { b.onclick = function () { var c = b.parentNode, k = c.dataset.k; L.cat = L.cat === k ? '' : k; U.cat.querySelectorAll('.ob-c').forEach(function (x) { x.classList.toggle('is-open', x.dataset.k === L.cat); }); P('click'); }; });
    U.cat.querySelectorAll('.ob-it').forEach(function (b) { b.onclick = function () { pick(+b.dataset.i); }; });
    count();
  }
  function count() { if (U.cnt) U.cnt.textContent = '已观测 ' + ST.seen.filter(function (id) { return EX.some(function (E) { return E.id === id; }); }).length + ' / ' + EX.length; }
  function pick(i) {
    var E = EX[i]; if (!E) return;
    L.cur = i; L.band = 0; P('click');
    U.cat.querySelectorAll('.ob-it').forEach(function (b) { b.classList.toggle('is-on', +b.dataset.i === i); });
    // 望远镜转向:按赤经赤纬给一个高度/方位
    var rd = radec(E) || [((i * 47) % 360), 20];
    L.azT = (rd[0] / 360) * Math.PI * 0.9 - 0.45 * Math.PI * 0.5; L.altT = 0.55 + Math.max(-0.3, Math.min(0.35, rd[1] / 90 * 0.6));
    U.ra.textContent = '赤经 ' + fmtRA(rd[0]); U.dec.textContent = '赤纬 ' + fmtDec(rd[1]);
    U.rg.style.transform = 'rotate(' + rd[0].toFixed(1) + 'deg)';
    U.scope.textContent = E.scope || '';
    if (ST.seen.indexOf(E.id) < 0) { ST.seen.push(E.id); save(); count(); var it = U.cat.querySelector('.ob-it[data-i="' + i + '"]'); if (it) it.classList.add('seen'); }
    U.hint.hidden = true;
    slewTo(E.bands[0]);
    info(); bands();
  }
  function slewTo(B) {
    // 一镜到底:旧图缩回星空 → 拖影转向 → 新图从远处一路放大
    var img = U.img; img.classList.remove('in'); U.eye.classList.add('slewing');
    clearTimeout(L.st);
    L.st = setTimeout(function () {
      var nimg = new Image(); nimg.onload = nimg.onerror = function () { img.src = nimg.src; U.eye.classList.remove('slewing'); void img.offsetWidth; img.classList.add('in'); P('arrive'); };
      nimg.src = 'arc/' + B.img + '.webp';
    }, 650);
  }
  function info() {
    var E = EX[L.cur], B = E.bands[L.band];
    U.info.innerHTML = '<small>' + CATS.filter(function (c) { return c.k === E.cat; })[0].zh + '</small><b>' + E.zh + '</b><em>' + E.en + '</em>' +
      '<dl><dt>距离</dt><dd>' + E.dist + '</dd><dt>光走到我们</dt><dd>' + E.light + '</dd><dt>拍摄</dt><dd>' + (E.scope || '—') + '</dd><dt>波段</dt><dd>' + B.zh + '</dd></dl>' +
      '<h4>怎么拍的</h4><p>' + E.how + '</p><h4>这一张</h4><p>' + B.t + '</p><p class="ob-fact">' + E.fact + '</p><p class="ob-src">影像来源:' + B.cr + '</p>';
    U.info.classList.add('on');
    U.cr.textContent = '影像:' + B.cr + ' · 公开授权影像,不代表任何机构背书';
  }
  function bands() {
    var E = EX[L.cur]; U.bands.innerHTML = '';
    U.bands.hidden = E.bands.length < 2; if (E.bands.length < 2) return;
    E.bands.forEach(function (B, j) {
      var b = h('button', 'ob-b ob-b--' + B.k + (j === L.band ? ' is-on' : ''), B.zh); b.type = 'button';
      b.onclick = function () { if (j === L.band) return; L.band = j; U.bands.querySelectorAll('.ob-b').forEach(function (x, m) { x.classList.toggle('is-on', m === j); }); swapBand(B); info(); P('click'); };
      U.bands.appendChild(b);
    });
  }
  function swapBand(B) {   // 换「眼睛」:同一目标就地扫描切换
    var img = U.img; U.eye.classList.add('scan');
    setTimeout(function () { img.src = 'arc/' + B.img + '.webp'; }, 260);
    setTimeout(function () { U.eye.classList.remove('scan'); }, 700);
  }
  function showEye() { U.root.classList.add('eye-on'); if (L.cur < 0) setTimeout(function () { pick(0); }, 400); }

  function pauseLE(p) {
    var lr = window.LE && LE.scene && LE.scene.renderer; if (!lr) return;
    if (p) { if (!leRender && !document.body.classList.contains('voy-on')) { leRender = lr.render; lr.render = function () { }; } }
    else if (leRender) { lr.render = leRender; leRender = null; }
  }
  function open() {
    buildList();
    if (!U.root) { build(); css(); }
    pauseLE(true);
    U.root.hidden = false; U.root.classList.remove('eye-on'); document.body.classList.add('ml-on', 'ob-on');
    if (!G && window.THREE) try { initGL(); } catch (e) { console.warn('[obs] WebGL 失败', e); }
    resize(); L.phase = G ? 'intro' : 'eye'; L.t0 = performance.now(); L.el = 0; L.alt = 0.25; L.altT = 0.95; L.az = -0.6; L.azT = 0;
    if (!G) showEye();
    cancelAnimationFrame(raf); L.last = 0; raf = requestAnimationFrame(loop); P('open');
    if (window.LE && LE.bus) try { LE.bus.emit('archive:open'); } catch (e) { }
  }
  function close() {
    if (!U.root) return; U.root.hidden = true; document.body.classList.remove('ml-on', 'ob-on'); cancelAnimationFrame(raf); pauseLE(false);
    L.phase = 'idle'; G && (G.UO.value = 0); P('close');
  }
  addEventListener('resize', function () { if (U.root && !U.root.hidden) resize(); });

  function css() {
    if (document.getElementById('ob-css')) return; var s = document.createElement('style'); s.id = 'ob-css';
    var E = 'min(64vh,46vw)';
    s.textContent = [
      '.ob{position:fixed;inset:0;z-index:86;background:#000005;color:#e8f2ff;font-family:"Noto Sans SC","PingFang SC","Microsoft YaHei",sans-serif;overflow:hidden}.ob[hidden]{display:none}',
      '.ob-cv{position:absolute;inset:0;width:100%;height:100%;display:block}',
      '.ob-vig{position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse at center,transparent 45%,rgba(0,0,6,.75) 100%);opacity:0;transition:opacity 1s}',
      '.ob.eye-on .ob-vig{opacity:1;background:radial-gradient(circle at 50% 50%,transparent calc(' + E + '/2 + 30px),rgba(0,2,8,.9) calc(' + E + '/2 + 120px))}',
      '.ob-hd{position:absolute;top:0;left:0;right:0;display:flex;align-items:center;gap:14px;padding:14px 18px;z-index:3}',
      '.ob-ttl small{display:block;font-size:10px;letter-spacing:.32em;color:#7fd8ef}.ob-ttl b{font-size:24px;letter-spacing:.2em;color:#fff;text-shadow:0 0 18px rgba(63,224,255,.7)}',
      '.ob-cnt{margin-left:auto;font-size:12px;color:#ffd58a;letter-spacing:.1em}',
      '.ob-x{width:36px;height:36px;border-radius:50%;border:1px solid rgba(127,216,239,.5);background:rgba(4,14,26,.6);color:#cfefff;font-size:15px;cursor:pointer}',
      // 目镜
      '.ob-eye{position:absolute;left:50%;top:52%;width:' + E + ';height:' + E + ';transform:translate(-50%,-50%) scale(.2);opacity:0;transition:transform 1.1s cubic-bezier(.2,.8,.2,1),opacity .8s;pointer-events:none;z-index:2}',
      '.ob.eye-on .ob-eye{transform:translate(-50%,-50%) scale(1);opacity:1}',
      '.ob-lens{position:absolute;inset:0;border-radius:50%;overflow:hidden;background:radial-gradient(circle,rgba(4,10,24,.25),rgba(0,0,6,.6));box-shadow:0 0 0 2px rgba(127,216,239,.55),0 0 60px rgba(63,224,255,.25),inset 0 0 80px rgba(0,0,0,.9)}',
      '.ob-img{position:absolute;inset:6%;width:88%;height:88%;object-fit:contain;opacity:0;transform:scale(.06);filter:blur(10px) brightness(1.6);transition:none}',
      '.ob-img.in{opacity:1;transform:scale(1);filter:none;transition:transform 1.8s cubic-bezier(.12,.75,.15,1),opacity .6s,filter 1.4s}',
      '.ob-eye.slewing .ob-img{opacity:0;transform:scale(.4) translateX(-30%);filter:blur(14px);transition:all .55s ease-in}',
      '.ob-slew{position:absolute;inset:0;opacity:0;background:repeating-linear-gradient(100deg,transparent 0 22px,rgba(190,230,255,.18) 22px 24px);transition:opacity .3s}',
      '.ob-eye.slewing .ob-slew{opacity:1;animation:obSlew .5s linear infinite}@keyframes obSlew{from{background-position:0 0}to{background-position:-240px 0}}',
      '.ob-eye.scan .ob-img{filter:hue-rotate(60deg) brightness(1.8) blur(3px);transition:filter .25s}',
      '.ob-cross{position:absolute;inset:0;background:linear-gradient(rgba(127,216,239,.18),rgba(127,216,239,.18)) center/1px 100% no-repeat,linear-gradient(90deg,rgba(127,216,239,.18),rgba(127,216,239,.18)) center/100% 1px no-repeat;opacity:.5}',
      '.ob-ring{position:absolute;inset:-7%;width:114%;height:114%;overflow:visible}.ob-ring line{stroke:rgba(127,216,239,.55);stroke-width:.5}.ob-ring .r1{fill:none;stroke:rgba(127,216,239,.35);stroke-width:.4}.ob-ring .r2{fill:none;stroke:rgba(255,200,97,.25);stroke-width:.3;stroke-dasharray:1 2}',
      '.ob-rg{transform-origin:100px 100px;transition:transform 1.4s cubic-bezier(.3,.8,.2,1)}.ob-rg .mk{fill:#ffc861}',
      '.ob-coord{position:absolute;left:50%;bottom:-11%;transform:translateX(-50%);display:flex;gap:16px;font:600 12px/1 ui-monospace,Menlo,monospace;color:#9fe6ff;letter-spacing:.08em;white-space:nowrap}',
      '.ob-scope{position:absolute;left:50%;top:-10%;transform:translateX(-50%);font-size:12px;color:#ffd58a;letter-spacing:.14em;white-space:nowrap}',
      // 目录
      '.ob-cat{position:absolute;left:16px;top:76px;bottom:70px;width:236px;overflow:auto;z-index:3;padding:10px;border-radius:14px;background:linear-gradient(180deg,rgba(6,18,34,.72),rgba(3,9,18,.6));border:1px solid rgba(127,216,239,.22);backdrop-filter:blur(8px);opacity:0;transform:translateX(-20px);transition:all .6s .3s}',
      '.ob.eye-on .ob-cat,.ob.eye-on .ob-info.on,.ob.eye-on .ob-bands{opacity:1;transform:none}',
      '.ob-ch{font-size:11px;letter-spacing:.2em;color:#7fd8ef;margin:2px 4px 8px}',
      '.ob-cb{display:flex;align-items:center;gap:10px;width:100%;padding:8px 6px;border:0;background:none;color:#e8f2ff;text-align:left;cursor:pointer;border-radius:8px}.ob-cb:hover{background:rgba(127,216,239,.08)}',
      '.ob-cb i{font-style:normal;width:20px;height:20px;border-radius:50%;border:1px solid rgba(255,200,97,.6);color:#ffd58a;font-size:11px;display:grid;place-items:center;flex:none}',
      '.ob-cb span{flex:1}.ob-cb b{display:block;font-size:14px}.ob-cb small{font-size:11px;color:#8fb3c7}.ob-cb em{font-style:normal;font-size:11px;color:#7fd8ef}',
      '.ob-ci{display:none;padding:2px 0 6px 30px}.ob-c.is-open .ob-ci{display:block}',
      '.ob-it{display:flex;justify-content:space-between;gap:8px;width:100%;padding:6px 8px;margin:2px 0;border:1px solid transparent;border-radius:7px;background:none;color:#cfe3f2;font-size:13px;cursor:pointer;text-align:left}.ob-it small{color:#6f93a8;font-size:10px;white-space:nowrap}',
      '.ob-it:hover{border-color:rgba(127,216,239,.25)}.ob-it.is-on{background:rgba(63,224,255,.14);border-color:rgba(127,216,239,.6);color:#fff}.ob-it.seen b::after{content:" ·";color:#ffd58a}',
      '.ob-soon{font-size:11px;color:#6f93a8;margin:4px 0}',
      // 信息卡
      '.ob-info{position:absolute;right:16px;top:76px;width:300px;max-height:calc(100% - 150px);overflow:auto;z-index:3;padding:14px 16px;border-radius:14px;background:linear-gradient(180deg,rgba(6,18,34,.78),rgba(3,9,18,.66));border:1px solid rgba(127,216,239,.22);backdrop-filter:blur(8px);opacity:0;transform:translateX(20px);transition:all .6s}',
      '.ob-info small{font-size:11px;letter-spacing:.16em;color:#7fd8ef}.ob-info b{display:block;font-size:20px;margin-top:4px}.ob-info em{display:block;font-style:normal;font-size:10px;letter-spacing:.24em;color:#ffd58a;margin-bottom:8px}',
      '.ob-info dl{display:grid;grid-template-columns:auto 1fr;gap:4px 12px;font-size:12px;margin:8px 0;padding:8px 0;border-top:1px solid rgba(127,216,239,.15);border-bottom:1px solid rgba(127,216,239,.15)}.ob-info dt{color:#8fb3c7}.ob-info dd{margin:0;text-align:right;color:#fff}',
      '.ob-info h4{margin:10px 0 3px;font-size:11px;color:#7fd8ef;letter-spacing:.12em;font-weight:600}.ob-info p{margin:0;font-size:13px;line-height:1.65;color:#d6e6f2}',
      '.ob-fact{margin-top:10px!important;padding-left:8px;border-left:2px solid #ffc861;color:#ffe6b8!important}.ob-src{margin-top:10px!important;font-size:11px!important;color:#8fb3c7!important}',
      '.ob-bands{position:absolute;left:50%;bottom:28px;transform:translateX(-50%);display:flex;gap:8px;z-index:3;opacity:0;transition:opacity .6s}.ob-bands[hidden]{display:none}',
      '.ob-b{padding:7px 14px;border-radius:999px;border:1px solid rgba(127,216,239,.35);background:rgba(4,14,26,.7);color:#cfefff;font-size:12px;cursor:pointer}.ob-b.is-on{background:rgba(63,224,255,.22);border-color:#7fd8ef;color:#fff;box-shadow:0 0 16px rgba(63,224,255,.35)}',
      '.ob-b--nir.is-on,.ob-b--mir.is-on{background:rgba(255,140,80,.25);border-color:#ffa070}.ob-b--xray.is-on{background:rgba(170,120,255,.25);border-color:#b48cff}',
      '.ob-hint{position:absolute;left:50%;bottom:66px;transform:translateX(-50%);font-size:12px;color:#8fb3c7;letter-spacing:.12em;z-index:3}',
      '.ob-cr{position:absolute;left:0;right:0;bottom:8px;margin:0;text-align:center;font-size:10px;color:#6f8ea3;z-index:3;padding:0 20px}',
      '@media (max-width:900px){.ob-cat{width:190px}.ob-info{width:240px}}',
      '@media (max-width:760px){.ob-eye{top:44%;width:min(46vh,70vw);height:min(46vh,70vw)}.ob-cat{left:8px;top:auto;bottom:40px;width:46%;max-height:38vh}.ob-info{right:8px;top:auto;bottom:40px;width:46%;max-height:38vh}.ob-bands{bottom:auto;top:66px}.ob-coord{display:none}}'
    ].join('\n');
    document.head.appendChild(s);
  }

  /* ---------------- 接管入口:「星档馆」按钮改为「天文台」---------------- */
  function hook() {
    SH.archive = SH.archive || {};
    SH.archive.openOld = SH.archive.open; SH.archive.open = open; SH.archive.close = close; SH.obs = { open: open, close: close, pick: pick, _L: L, EX: EX };
    var b = document.querySelector('.sh-btn-arc');
    if (b && !b.dataset.obs) {
      var nb = b.cloneNode(false); nb.dataset.obs = 1; nb.className = b.className;
      nb.innerHTML = '<span class="le-btn__ico">◉</span><span class="le-btn__txt">天文台<small>OBSERVATORY</small></span>';
      nb.addEventListener('click', open); b.parentNode.replaceChild(nb, b); return true;
    }
    return !!b;
  }
  (function wait(n) { if (SH.archive && SH.archive.EX && hook()) return; if (n > 600) return; setTimeout(function () { wait(n + 1); }, 120); })(0);
  if (/[?&]obs=1/.test(location.search)) (function w3(n) { if ((window.SH_READY && SH.archive && SH.archive.EX) || n > 120) return open(); setTimeout(function () { w3(n + 1); }, 100); })(0);
})();
