/* 天枢 Starhelm · 巡天 C0 · sh-x-cockpit.js · 驾驶舱(星域内实时飞行)
 * 真实比例:天体位置来自 astronomy-engine(此刻),半径/质量为真实值;单位 km。
 * 画面:SHFX3D 星空 + SHFX3D 太阳;远处天体按「对数压缩距离、保持视角大小」绘制,避免深度精度问题;
 *       屏幕空间太阳光晕/镜头光斑(星芒、横向拖影、鬼影圆斑、六边形光圈、大光环),被天体遮挡时淡出。
 * 仪表:导航/环境/引力读数,航向弧,目标资料卡,导航目标列表,速度/高度/距目标/倍率四个表盘,行星航线条。
 * 飞行:实际速度(≤0.1c)× 倍率 = 等效速度;倍率是模拟手段,天体仍按真实时间运行。
 * 依赖:THREE(r186 兼容层)、Astronomy、SHFX3D、SOLAR(planets-data.js)、LE_TEX。无 WebGL 时入口提示不可用。
 */
(function () {
  'use strict';
  var T, AU = 149597870.7, C = 299792.458, EPS = 23.4392911 * Math.PI / 180, G = 6.674e-20, D0 = 1.5e6;
  var MAXV = 0.1 * C;
  // GM km^3/s^2(JPL),平均温度 °C(NASA 行星概况)
  var B = [
    { id: 'sun', zh: '太阳', en: 'Sun', type: '恒星', R: 696340, GM: 1.32712440018e11, temp: '5,500(光球)', ab: 'Sun', col: '#f0c97a' },
    { id: 'mercury', zh: '水星', en: 'Mercury', type: '行星', R: 2439.7, GM: 22031.9, temp: '167', ab: 'Mercury', col: '#b9b2a8', hd: 'hd/mercury-4k.jpg', lo: 'planet-mercury.jpg', per: 1407.6 },
    { id: 'venus', zh: '金星', en: 'Venus', type: '行星', R: 6051.8, GM: 324858.6, temp: '464', ab: 'Venus', col: '#e8cf9a', hd: 'hd/venus-4k.jpg', lo: 'planet-venus.jpg', per: -5832.5, atm: [1, .85, .55] },
    { id: 'earth', zh: '地球', en: 'Earth', type: '行星', R: 6371, GM: 398600.44, temp: '15', ab: 'Earth', col: '#7fb8ff', hd: 'hd/earth-day-4k.jpg', lo: 'earth-day-2k.jpg', atm: [.35, .6, 1] },
    { id: 'moon', zh: '月球', en: 'Moon', type: '卫星', R: 1737.4, GM: 4902.8, temp: '-20(昼夜 -173~127)', ab: 'Moon', col: '#cfcfcf', hd: 'hd/moon-4k.jpg', lo: 'planet-moon.jpg' },
    { id: 'mars', zh: '火星', en: 'Mars', type: '行星', R: 3389.5, GM: 42828.4, temp: '-65', ab: 'Mars', col: '#e07a52', hd: 'hd/mars-4k.jpg', lo: 'planet-mars.jpg', per: 24.62, atm: [1, .6, .45] },
    { id: 'jupiter', zh: '木星', en: 'Jupiter', type: '行星', R: 69911, GM: 126686534, temp: '-110(云顶)', ab: 'Jupiter', col: '#d8b48a', hd: 'hd/jupiter-4k.jpg', lo: 'planet-jupiter.jpg', per: 9.925, atm: [1, .9, .75] },
    { id: 'saturn', zh: '土星', en: 'Saturn', type: '行星', R: 58232, GM: 37931187, temp: '-140(云顶)', ab: 'Saturn', col: '#e6cf98', hd: 'hd/saturn-4k.jpg', lo: 'planet-saturn.jpg', per: 10.66, ring: true, atm: [1, .92, .7] },
    { id: 'uranus', zh: '天王星', en: 'Uranus', type: '行星', R: 25362, GM: 5793939, temp: '-195', ab: 'Uranus', col: '#9fe0e8', lo: 'planet-uranus.jpg', per: -17.24, atm: [.6, .95, 1] },
    { id: 'neptune', zh: '海王星', en: 'Neptune', type: '行星', R: 24622, GM: 6836529, temp: '-200', ab: 'Neptune', col: '#5d86ff', lo: 'planet-neptune.jpg', per: 16.11, atm: [.4, .6, 1] },
    { id: 'pluto', zh: '冥王星', en: 'Pluto', type: '矮行星', R: 1188.3, GM: 869.6, temp: '-225', ab: 'Pluto', col: '#d9c3a8', hd: 'hd/pluto-2k.jpg', lo: 'planet-pluto.jpg', per: -153.3 },
    // C1.8 出太阳系航点:固定方向(赤经/赤纬,J2000)+ 日心距离;不画星球,只有标签与目标框
    { id: 'voyager1', zh: '旅行者 1 号', en: 'Voyager 1', type: '探测器', R: 0.0065, GM: 722 * 6.674e-20, temp: '约 -270(星际空间)', col: '#9fd0e8', fix: [258.75, 12.13, 172.2], ghost: true, craft: 'x/models/voyager.glb', span: 13, info: [['发射', '1977 年 9 月 5 日'], ['日心距离', '约 172 AU(2026-10)'], ['速度', '约 17 km/s(相对太阳)'], ['2012 年 8 月', '穿越日球层顶'], ['状态', '仍在工作'], ['模型', 'NASA 3D Resources · 光照按曝光拉伸']] },
    { id: 'voyager2', zh: '旅行者 2 号', en: 'Voyager 2', type: '探测器', R: 0.0065, GM: 722 * 6.674e-20, temp: '约 -270(星际空间)', col: '#9fd0e8', fix: [301.245, -59.8, 144.24], ghost: true, craft: 'x/models/voyager.glb', span: 13, info: [['发射', '1977 年 8 月 20 日'], ['日心距离', '约 144 AU(2026-10)'], ['速度', '约 15 km/s(相对太阳)'], ['2018 年 11 月', '穿越日球层顶'], ['唯一', '飞掠过天王星与海王星的探测器'], ['模型', 'NASA 3D Resources(与 1 号同型)']] },
    { id: 'newhorizons', zh: '新视野号', en: 'New Horizons', type: '探测器', R: 0.0014, GM: 478 * 6.674e-20, temp: '约 -230', col: '#9fd0e8', fix: [288.75, -20.3, 65.88], ghost: true, craft: 'x/models/newhorizons.glb', span: 2.7, info: [['发射', '2006 年 1 月 19 日'], ['日心距离', '约 66 AU(2026-10)'], ['速度', '约 13.6 km/s(相对太阳)'], ['2015 年 7 月', '飞掠冥王星'], ['2019 年 1 月', '飞掠柯伊伯带天体 阿罗科斯'], ['模型', 'NASA VTAD 3D 模型']] },
    { id: 'pioneer10', zh: '先驱者 10 号', en: 'Pioneer 10', type: '探测器', R: 0.0045, GM: 258 * 6.674e-20, temp: '约 -270', col: '#8fa6b8', fix: [78.75, 26.03, 142.14], ghost: true, craft: 'x/models/pioneer.glb', span: 9, info: [['发射', '1972 年 3 月 3 日'], ['日心距离', '约 142 AU(2026-10,推算)'], ['速度', '约 11.9 km/s(相对太阳)'], ['1973 年 12 月', '首个飞掠木星的探测器'], ['状态', '2003 年 1 月失联'], ['模型', 'NASA 3D Resources']] },
    { id: 'pioneer11', zh: '先驱者 11 号', en: 'Pioneer 11', type: '探测器', R: 0.0045, GM: 259 * 6.674e-20, temp: '约 -270', col: '#8fa6b8', fix: [283.5, -8.98, 119.53], ghost: true, craft: 'x/models/pioneer.glb', span: 9, info: [['发射', '1973 年 4 月 6 日'], ['日心距离', '约 120 AU(2026-10,推算)'], ['速度', '约 11.1 km/s(相对太阳)'], ['1979 年 9 月', '首个飞掠土星的探测器'], ['状态', '1995 年 9 月失联'], ['模型', 'NASA 3D Resources(与 10 号同型)']] },
    { id: 'oort', zh: '奥尔特云内缘', en: 'Inner Oort Cloud', type: '推测区域', R: 0.02, GM: 0, temp: '约 -268', col: '#b8c8e0', fix: [258.3, 12.0, 2000], ghost: true, info: [['距离', '内缘约 2,000 AU(推测)'], ['外缘', '可达约 10 万 AU'], ['组成', '数以万亿计的冰质天体'], ['证据', '长周期彗星轨道反推,尚无直接观测']] },
    // C1.8b 群星航点(位置取自 HYG v4.1 星表,与星空点完全重合);GM=质量×太阳GM、L=光度(太阳=1),公开资料约数
    { id: 'proxima', zh: '比邻星', en: 'Proxima Centauri', type: '红矮星', R: 107280, GM: 1.62042e+10, L: 0.00155, temp: '—', col: '#ff8a5c', fix: [218.6598, -63.183, 269281], star: true, tint: [1.25, .62, .4], info: [['光谱型', 'M5.5 V 红矮星'], ['半径', '约 0.15 个太阳'], ['行星', '比邻星 b、d(宜居带内有 b)'], ['距离', '4.25 光年(离太阳最近)']] },
    { id: 'sirius', zh: '天狼星', en: 'Sirius', type: '恒星', R: 1191000, GM: 2.73786e+11, L: 25.4, temp: '—', col: '#cfe0ff', fix: [101.1738, -16.8459, 545581], star: true, tint: [1.05, 1.22, 1.6], sat: .1, info: [['光谱型', 'A1 V(主星)+ 白矮星伴星'], ['半径', '约 1.7 个太阳'], ['亮度', '约 25 个太阳'], ['距离', '8.6 光年']] },
    { id: 'vega', zh: '织女星', en: 'Vega', type: '恒星', R: 1640000, GM: 2.83341e+11, L: 40.1, temp: '—', col: '#dfe8ff', fix: [279.125, 38.7706, 1585580], star: true, tint: [1.08, 1.22, 1.55], sat: .1, info: [['光谱型', 'A0 V'], ['半径', '约 2.4 个太阳(快速自转,赤道更宽)'], ['亮度', '约 40 个太阳'], ['距离', '25 光年']] },
    { id: 'trappist1', zh: 'TRAPPIST-1', en: 'TRAPPIST-1', type: '红矮星', R: 82900, GM: 1.19176e+10, L: 0.000553, temp: '—', col: '#ff7046', fix: [346.6864, -5.0939, 2564173], star: true, tint: [1.2, .5, .3], info: [['光谱型', 'M8 V 超冷红矮星'], ['半径', '约 0.12 个太阳'], ['行星', '7 颗岩质行星,3 颗在宜居带'], ['距离', '约 40.5 光年']] }
  ];
  // C2.2 卫星插在母行星之后、彗星插在冥王星之后(数据与传播见 sh-x-bodies.js)
  if (window.SHXB) (function () { var cm = []; SHXB.list.forEach(function (b) { if (b.parent) { var j = -1; B.forEach(function (x, k) { if (x.id === b.parent || x.parent === b.parent) j = k; }); B.splice(j + 1, 0, b); } else cm.push(b); }); var pj = B.map(function (x) { return x.id; }).indexOf('pluto'); Array.prototype.splice.apply(B, [pj + 1, 0].concat(cm)); })();
  // C2.2d T5 临时恒星航点槽:点选任意 HYG 恒星「前往」时填入(off 时不显示、不进列表)
  B.push({ id: 'tmpstar', zh: '临时航点', en: 'Temporary waypoint', type: '恒星', R: 696340, GM: 1.32712e11, L: 1, temp: '—', col: '#ffffff', fix: [0, 0, 1e9], star: true, off: true, tint: [1, 1, 1], info: [] });
  // C2.6b T6 深空航点槽:星云 / 星系(真实方向 J2000 + 真实距离);不画球体,只有标签与目标框,飞行由 sh-x-dsoview.js 的跃迁控制器接管
  B.push({ id: 'tmpdso', zh: '深空航点', en: 'Deep-sky waypoint', type: '深空天体', R: 1e13, GM: 0, temp: '—', col: '#f0c97a', fix: [0, 0, 1e12], ghost: true, dso: true, off: true, info: [] });
  var BY = {}; B.forEach(function (b) { BY[b.id] = b; });
  var K = { open: false, built: false };
  var X = window.SHXC = { isOpen: function () { return K.open; } };
  X.hooks = []; X.on = function (f) { X.hooks.push(f); };
  X.layers = { bg: [], fg: [], post: [] };   // C2.1:每帧在主场景前(bg)/尘埃后(fg)调用 f({rd,cam0,W,H,dt,pf});C2.2a post:引擎特效上屏之后(侧舷窗舱体,不被特效扭曲)
  function emit(ev, a) { for (var i = 0; i < X.hooks.length; i++) { try { X.hooks[i](ev, a); } catch (e) { console.warn('[SHXC hook]', e); } } }

  function reduced() { return matchMedia('(prefers-reduced-motion: reduce)').matches; }
  function $(s, r) { return (r || document).querySelector(s); }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function nf(x, d) { return x.toLocaleString('zh-CN', { maximumFractionDigits: d == null ? 0 : d, minimumFractionDigits: d == null ? 0 : d }); }
  function sig(x, n) { if (!isFinite(x)) return '—'; if (x === 0) return '0'; var a = Math.abs(x); if (a >= 1e5 || a < 1e-3) return x.toExponential(n - 1).replace('e+', 'e'); return nf(x, Math.max(0, n - 1 - Math.floor(Math.log10(a)))); }
  function fkm(km) { if (km < 1e6) return nf(km) + ' km'; var au = km / AU; if (au < 1e4) return (au < 10 ? au.toFixed(3) : au.toFixed(2)) + ' AU'; var ly = km / 9.4607e12; return (ly < 10 ? ly.toFixed(3) : ly < 1000 ? nf(ly, 1) : nf(ly)) + ' 光年'; }   // C2.7c:>1000 光年用千分位整数(原 toFixed(3) 的「120.000 光年」易被读成 12 万)
  function fdur(s) { if (!isFinite(s) || s < 0) return '—'; if (s < 10) return s.toFixed(2) + ' 秒'; if (s < 60) return s.toFixed(0) + ' 秒'; if (s < 3600) return Math.floor(s / 60) + ' 分 ' + Math.round(s % 60) + ' 秒'; if (s < 86400) return Math.floor(s / 3600) + ' 时 ' + Math.round(s % 3600 / 60) + ' 分'; return (s / 86400).toFixed(1) + ' 天'; }
  function now() { return window.SHTIME && SHTIME.now ? SHTIME.now() : new Date(); }

  /* ---------------- 星历 ---------------- */
  function eq2three(v, out) {   // 赤道 J2000(AU) → 黄道 → three(y=黄北)
    var y = v.y * Math.cos(EPS) + v.z * Math.sin(EPS), z = -v.y * Math.sin(EPS) + v.z * Math.cos(EPS);
    out[0] = v.x * AU; out[1] = z * AU; out[2] = -y * AU; return out;
  }
  function helio(b, d) {
    var A = window.Astronomy, o = [0, 0, 0];
    if (b.fix) { var ra = b.fix[0] * Math.PI / 180, de = b.fix[1] * Math.PI / 180; return eq2three({ x: Math.cos(de) * Math.cos(ra) * b.fix[2], y: Math.cos(de) * Math.sin(ra) * b.fix[2], z: Math.sin(de) * b.fix[2] }, o); }
    if (b.el && window.SHXB) return SHXB.pos(b, d, b.parent ? helio(BY[b.parent], d) : null);
    if (!A || b.id === 'sun') return o;
    if (b.id === 'moon') { var e = eq2three(A.HelioVector(A.Body.Earth, d), [0, 0, 0]), m = eq2three(A.GeoVector(A.Body.Moon, d, true), [0, 0, 0]); return [e[0] + m[0], e[1] + m[1], e[2] + m[2]]; }
    return eq2three(A.HelioVector(A.Body[b.ab], d), o);
  }
  var ephT = 0;
  function ephem(force) {   // 每 2 秒重算位置与速度,其余帧线性外推
    var t = Date.now(); if (!force && t - ephT < 2000) return; ephT = t;
    var d = now(), d2 = new Date(d.getTime() + 10000);
    B.forEach(function (b) { var p = helio(b, d), q = helio(b, d2); b.p0 = p; b.v = [(q[0] - p[0]) / 10, (q[1] - p[1]) / 10, (q[2] - p[2]) / 10]; b.t0 = t; });   // C2.2:外推基准用真实时钟(SHTIME 被调到别的年代时也不会外推到天边)
  }
  function bpos(b, ms) { var dt = (ms - b.t0) / 1000; return [b.p0[0] + b.v[0] * dt, b.p0[1] + b.v[1] * dt, b.p0[2] + b.v[2] * dt]; }

  /* ---------------- 3D ---------------- */
  var rd, cam, cam0, camO, sSky, sOrb, sMain, sDust, sFx, camFx, sunFx, dust, fxEls = [], tmpV, tmpQ;
  function tex(b, key) {
    var t = new T.Texture(); t.encoding = T.sRGBEncoding; t.anisotropy = Math.min(8, rd.capabilities.getMaxAnisotropy());
    var src = null, small = Math.min(screen.width, screen.height) < 700 || (navigator.deviceMemory && navigator.deviceMemory < 4);
    if (key) src = key; else if (b.hd && !small && rd.capabilities.maxTextureSize >= 4096) src = b.hd; else if (b.lo && window.LE_TEX) src = LE_TEX[b.lo];
    if (!src && b.lo && window.LE_TEX) src = LE_TEX[b.lo];
    if (src) { var im = new Image(); im.decoding = 'async'; im.onload = function () { t.image = im; t.needsUpdate = true; t.ok = 1; }; im.onerror = function () { if (b.lo && window.LE_TEX && src !== LE_TEX[b.lo]) { src = LE_TEX[b.lo]; im.src = src; } };
      // C2.7b:地球昼/夜/云贴图计入登舰「模型 · 贴图」真实进度(字节 + onload 才算就绪);其余贴图照旧后台载入
      if (window.SHXLD && b.id === 'earth') SHXLD.img(im, src, { id: 'tex:earth-' + (key ? (/^data:/.test(key) ? 'inl' + (++K.texN || (K.texN = 1)) : String(key).slice(0, 60)) : 'day'), grp: 'vis', label: '地球贴图', est: 1.6e6 }); else im.src = src; }
    return t;
  }
  var PV = 'varying vec2 vU;varying vec3 vN;varying vec3 vW;void main(){vU=uv;vN=normalize(mat3(modelMatrix)*normal);vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}';
  var PF = 'uniform sampler2D map;uniform sampler2D night;uniform float hasMap,hasNight,emis;uniform vec3 sunP,col,atm;varying vec2 vU;varying vec3 vN;varying vec3 vW;' +
    'void main(){vec3 L=normalize(sunP-vW);vec3 V=normalize(cameraPosition-vW);vec3 N=normalize(vN);float nl=dot(N,L);' +
    'vec3 base=hasMap>.5?texture2D(map,vU).rgb:col;base=pow(base,vec3(2.2));' +
    'float d=smoothstep(-.06,.25,nl);vec3 c=base*max(nl,0.)*1.25+base*.012;' +
    'if(hasNight>.5){vec3 n=pow(texture2D(night,vU).rgb,vec3(2.2));c+=n*1.4*(1.-smoothstep(-.12,.08,nl));}' +
    'float fr=pow(1.-max(dot(N,V),0.),3.);c+=atm*fr*smoothstep(-.25,.35,nl)*.9;' +
    'c+=base*emis;c=c/(1.+c*.15);gl_FragColor=vec4(pow(c,vec3(1./2.2)),1.);}';
  function body3d(b) {
    var g = new T.Group(), tilt = new T.Group(), spin = new T.Group(); g.add(tilt); tilt.add(spin);
    if (b.star) {   // C1.8b 恒星航点:发光球 + 辉光 + 远距离亮点
      var cc = new T.Color(b.col), tint = new T.Vector3().fromArray(b.tint || [1, 1, 1]);
      // C1.8d 恒星表面:复用 1.0 太阳着色器(米粒组织/临边昏暗/日冕/日珥),按光谱型整体染色;红矮星偏橙红、A 型星偏蓝白
      var sf = window.SHFX3D && SHFX3D.sun ? SHFX3D.sun({ radius: b.R, wind: false }) : null;
      if (sf) {
        sf.group.traverse(function (o) {
          var m = o.material; if (!m) return;
          if (m.isShaderMaterial) { m.uniforms.uTint = { value: tint }; m.uniforms.uSat = { value: b.sat == null ? 1 : b.sat };
            m.fragmentShader = 'uniform vec3 uTint;uniform float uSat;' + m.fragmentShader.replace(/\}\s*$/, 'float shL=dot(gl_FragColor.rgb,vec3(.3,.59,.11));gl_FragColor.rgb=mix(vec3(shL),gl_FragColor.rgb,uSat)*uTint;}'); m.needsUpdate = true; }
          else if ((b.sat == null ? 1 : b.sat) < .5) o.visible = false;   // A 型星:不画橙色日珥
          else if (m.color) m.color.multiply(new T.Color(tint.x, tint.y, tint.z));
        });
        g.add(sf.group); b.fx = sf;
      } else g.add(new T.Mesh(new T.SphereGeometry(b.R, 64, 32), new T.MeshBasicMaterial({ color: cc.clone().lerp(new T.Color(1, 1, 1), .35), toneMapped: false })));
      var gc = document.createElement('canvas'); gc.width = gc.height = 128; var gx = gc.getContext('2d'), gr = gx.createRadialGradient(64, 64, 0, 64, 64, 64);
      gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.12, 'rgba(255,255,255,.85)'); gr.addColorStop(.3, '#' + cc.getHexString()); gr.addColorStop(1, 'rgba(0,0,0,0)');
      gx.fillStyle = gr; gx.fillRect(0, 0, 128, 128); var gt = new T.CanvasTexture(gc);
      var sp = new T.Sprite(new T.SpriteMaterial({ map: gt, color: cc, blending: T.AdditiveBlending, transparent: true, opacity: .35, depthWrite: false })); sp.scale.setScalar(b.R * 4); g.add(sp);
      var pg = new T.BufferGeometry(); pg.setAttribute('position', new T.BufferAttribute(new Float32Array(3), 3));
      b.pt = new T.Points(pg, new T.PointsMaterial({ map: gt, color: cc, size: 14 * Math.min(2, window.devicePixelRatio || 1), sizeAttenuation: false, transparent: true, depthWrite: false, blending: T.AdditiveBlending }));
      b.pt.frustumCulled = false; g.add(b.pt); b.g = g; return g;
    }
    if (b.id === 'sun') {
      var s = window.SHFX3D && SHFX3D.sun ? SHFX3D.sun({ radius: b.R }) : null;
      if (s) { g.add(s.group); b.fx = s; } else g.add(new T.Mesh(new T.SphereGeometry(b.R, 48, 24), new T.MeshBasicMaterial({ color: 0xffe2a0 })));
      b.g = g; return g;
    }
    var U = { map: { value: tex(b) }, night: { value: null }, hasMap: { value: 0 }, hasNight: { value: 0 }, emis: { value: 0 }, sunP: { value: new T.Vector3() }, col: { value: new T.Color(b.col) }, atm: { value: new T.Vector3().fromArray(b.atm || [0, 0, 0]) } };
    if (b.id === 'earth') { U.night.value = tex(b, rd.capabilities.maxTextureSize >= 4096 && Math.min(screen.width, screen.height) >= 700 ? 'hd/earth-night-4k.jpg' : (window.LE_TEX && LE_TEX['earth-night-2k.jpg'])); U.hasNight.value = 1; }
    // C2.2e 卫星:优先用 NASA/JPL/USGS 公有领域全球拼图(x/tex/,已着色、缺测区程序化填充);土卫六可见光下只见橙色雾霾,仍用程序化
    if (b.proc && window.SHXB && SHXB.img && SHXB.img[b.id]) { U.map.value = tex(b, SHXB.img[b.id]); }
    else if (b.proc && window.SHXB) { var pt0 = new T.CanvasTexture(SHXB.tex(b)); pt0.encoding = T.sRGBEncoding; pt0.anisotropy = Math.min(8, rd.capabilities.getMaxAnisotropy()); pt0.ok = 1; U.map.value = pt0; }
    b.U = U;
    var seg = b.R > 20000 ? 160 : 128;
    var m = new T.Mesh(new T.SphereGeometry(b.R, seg, seg / 2), new T.ShaderMaterial({ uniforms: U, vertexShader: PV, fragmentShader: PF }));
    spin.add(m); b.mesh = m; if (b.ghost) m.visible = false;
    if (b.craft) { b.cg = new T.Group(); g.add(b.cg); }   // C2.2g 探测器:靠近时再懒加载 GLB 模型
    if (b.id === 'earth') {   // 云层
      var ct = tex(b, Math.min(screen.width, screen.height) >= 700 ? 'hd/earth-clouds-4k.jpg' : (window.LE_TEX && LE_TEX['earth-clouds-1k.jpg'])); ct.encoding = T.LinearEncoding;
      var cu = { map: { value: ct }, sunP: U.sunP };
      var cm = new T.Mesh(new T.SphereGeometry(b.R * 1.006, 128, 64), new T.ShaderMaterial({
        uniforms: cu, transparent: true, depthWrite: false, vertexShader: PV,
        fragmentShader: 'uniform sampler2D map;uniform vec3 sunP;varying vec2 vU;varying vec3 vN;varying vec3 vW;void main(){float a=texture2D(map,vU).r;float nl=dot(normalize(vN),normalize(sunP-vW));float l=smoothstep(-.1,.3,nl);gl_FragColor=vec4(vec3(l*.95+.02),a*(.15+.85*l)*.9);}'
      }));
      spin.add(cm); b.cloud = cm;
      // 大气辉光壳
      var am = new T.Mesh(new T.SphereGeometry(b.R * 1.025, 96, 48), new T.ShaderMaterial({
        uniforms: { sunP: U.sunP }, transparent: true, depthWrite: false, side: T.BackSide, blending: T.AdditiveBlending, vertexShader: PV,
        fragmentShader: 'uniform vec3 sunP;varying vec2 vU;varying vec3 vN;varying vec3 vW;void main(){vec3 V=normalize(cameraPosition-vW);float f=pow(1.-abs(dot(normalize(vN),V)),2.2);float l=smoothstep(-.35,.4,dot(normalize(vN),normalize(sunP-vW)));gl_FragColor=vec4(vec3(.3,.55,1.)*f*l*1.3,1.);}'
      }));
      g.add(am);
    }
    if (b.ring) {
      var rin = 74500, rout = 140220, rg = new T.RingGeometry(rin, rout, 256, 1), uv = rg.attributes.uv, p = rg.attributes.position;
      for (var i = 0; i < uv.count; i++) { var r = Math.hypot(p.getX(i), p.getY(i)); uv.setXY(i, (r - rin) / (rout - rin), 0.5); }
      var rt = tex(b, 'hd/saturn-ring.png'); if (!window.LE_TEX) { } else rt.fallback = LE_TEX['planet-saturn-ring.png'];
      var ru = { map: { value: rt }, sunP: U.sunP, pc: { value: new T.Vector3() }, pr: { value: b.R } };
      var ring = new T.Mesh(rg, new T.ShaderMaterial({
        uniforms: ru, transparent: true, side: T.DoubleSide, depthWrite: false,
        vertexShader: PV,
        fragmentShader: 'uniform sampler2D map;uniform vec3 sunP,pc;uniform float pr;varying vec2 vU;varying vec3 vN;varying vec3 vW;void main(){vec4 t=texture2D(map,vU);vec3 L=normalize(sunP-vW);vec3 o=vW-pc;float b=dot(o,L);float sh=1.;if(b<0.){float d2=dot(o,o)-b*b;sh=smoothstep(pr*pr*.96,pr*pr*1.04,d2);}vec3 c=pow(t.rgb,vec3(2.2))*(.08+.92*sh)*1.15;gl_FragColor=vec4(pow(c,vec3(1./2.2)),t.a*.95);}'
      }));
      ring.rotation.x = -Math.PI / 2; spin.add(ring); b.ringU = ru;
    }
    if (b.comet && window.SHXB) { m.geometry.dispose(); m.geometry = SHXB.nucleus(T, b); SHXB.cometFx(T, b, g); }
    // 自转轴:地球用真实恒星时;其余按黄道倾角近似
    if (b.id === 'earth') tilt.rotation.x = -EPS;
    else if (b.id !== 'moon' && !b.parent && !b.comet) { var sd = window.SOLAR && SOLAR.bodies.filter(function (x) { return x.id === b.id; })[0]; tilt.rotation.x = -((sd && sd.tilt) || 0) * Math.PI / 180; }
    b.tilt = tilt; b.spin = spin; b.g = g; return g;
  }
  function orbits() {
    var grp = new T.Group(), A = window.Astronomy; if (!A) return grp;
    B.forEach(function (b) {
      if (b.id === 'sun' || b.id === 'moon' || b.fix || b.parent) return;
      if (b.comet && window.SHXB) { var cg = new T.BufferGeometry(); cg.setAttribute('position', new T.BufferAttribute(SHXB.orbit(b), 3)); var cl = new T.LineLoop(cg, new T.LineBasicMaterial({ color: new T.Color(b.col), transparent: true, opacity: .22, depthWrite: false })); cl.userData.id = b.id; cl.userData.op = .22; cl.userData.comet = 1; grp.add(cl); return; }
      var per = { mercury: 88, venus: 225, earth: 365.25, mars: 687, jupiter: 4333, saturn: 10759, uranus: 30687, neptune: 60190, pluto: 90560 }[b.id], N = 360, arr = new Float32Array(N * 3), d0 = now().getTime();
      for (var i = 0; i < N; i++) { var p = helio(b, new Date(d0 + i / N * per * 864e5)); arr[i * 3] = p[0]; arr[i * 3 + 1] = p[1]; arr[i * 3 + 2] = p[2]; }
      var g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(arr, 3));
      var l = new T.LineLoop(g, new T.LineBasicMaterial({ color: new T.Color(b.col), transparent: true, opacity: .32, depthWrite: false }));
      l.userData.id = b.id; l.userData.op = .32; grp.add(l);
    });
    return grp;
  }
  function dustField() {
    var N = reduced() ? 0 : 900, pos = new Float32Array(N * 6), seed = [];
    for (var i = 0; i < N; i++) seed.push([(Math.random() - .5) * 400, (Math.random() - .5) * 400, (Math.random() - .5) * 400]);
    var g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos, 3));
    var m = new T.LineSegments(g, new T.LineBasicMaterial({ color: 0xbfd6ff, transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending }));
    m.frustumCulled = false; return { m: m, seed: seed, pos: pos, N: N };
  }

  /* ---------- 太阳光晕 / 镜头光斑(屏幕空间,像素坐标) ---------- */
  var FXV = 'varying vec2 vU;void main(){vU=uv*2.-1.;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}';
  var FXF = 'uniform float typ,amt,rot;uniform vec3 col;varying vec2 vU;' +
    'void main(){vec2 p=vU;float r=length(p);float a=0.;' +
    'if(typ<.5){a=exp(-r*r*7.)*.9+exp(-r*3.2)*.35;}' +                                    // 0 暖色大光晕
    'else if(typ<1.5){float an=atan(p.y,p.x)+rot;float s=pow(abs(cos(an*3.)),220.)+pow(abs(cos(an*3.+.5236)),600.)*.5;a=s*exp(-r*2.6)*(1.-smoothstep(.85,1.,r))+exp(-r*r*400.)*1.4;}' + // 1 星芒
    'else if(typ<2.5){a=exp(-p.y*p.y*9000.)*exp(-abs(p.x)*2.2)*.9+exp(-p.y*p.y*600.)*exp(-abs(p.x)*5.)*.25;}' + // 2 横向拖影
    'else if(typ<3.5){a=exp(-pow((r-.86)/.05,2.))*.8+exp(-pow((r-.8)/.16,2.))*.12;}' +     // 3 光环
    'else if(typ<4.5){vec2 q=abs(p);float h=max(q.x*.866+q.y*.5,q.y);a=(1.-smoothstep(.82,.9,h))*.55+exp(-pow((h-.86)/.04,2.))*.5;}' + // 4 六边形光圈
    'else{a=(1.-smoothstep(.55,1.,r))*.8;}' +                                               // 5 圆斑
    'gl_FragColor=vec4(col*a*amt,1.);}';
  function fxPlane(typ, col) {
    var m = new T.Mesh(new T.PlaneGeometry(1, 1), new T.ShaderMaterial({ uniforms: { typ: { value: typ }, amt: { value: 0 }, rot: { value: 0 }, col: { value: new T.Color().setRGB(col[0], col[1], col[2]) } }, vertexShader: FXV, fragmentShader: FXF, transparent: true, depthTest: false, depthWrite: false, blending: T.AdditiveBlending }));
    sFx.add(m); return m;
  }
  function buildFx() {
    sFx = new T.Scene(); camFx = new T.OrthographicCamera(0, 1, 1, 0, -1, 1);
    // [类型, 颜色, 尺寸(×屏高), 位于 太阳→屏心 轴上的系数 k(0=太阳,1=屏心,2=对称点), 强度]
    var spec = [
      [0, [1, .72, .42], 1.15, 0, .85], [0, [1, .9, .75], .32, 0, 1], [1, [1, .95, .85], .62, 0, .8], [2, [.55, .7, 1], 2.4, 0, .42],
      [5, [.45, .6, 1], .045, .28, .32], [3, [1, .62, .32], .2, .55, .35], [5, [.45, .95, .6], .028, .8, .45], [5, [.7, .5, 1], .06, 1.18, .12],
      [4, [1, .72, .3], .095, 1.45, .32], [3, [.35, .85, .85], .36, 1.7, .26], [5, [1, .35, .2], .035, 2.05, .4], [5, [.4, .7, 1], .16, 1.3, .06]
    ];
    spec.forEach(function (s) { var m = fxPlane(s[0], s[1]); fxEls.push({ m: m, size: s[2], k: s[3], amt: s[4] }); });
  }
  var sunVis = 0;
  function updFx(W, H, sunW) {
    camFx.right = W; camFx.top = H; camFx.updateProjectionMatrix();
    var sp = tmpV.set(sunW[0], sunW[1], sunW[2]).project(cam), front = sp.z < 1 && sp.z > -1;
    var x = (sp.x * .5 + .5) * W, y = (sp.y * .5 + .5) * H;
    var ds = BY.sun.dist || 1;
    // 遮挡:太阳圆面被天体挡住的比例(按角距软化)
    var sl = Math.hypot(sunW[0], sunW[1], sunW[2]) || 1, occ = 1, dx = sunW[0] / sl, dy = sunW[1] / sl, dz = sunW[2] / sl, sunAng = Math.atan(696340 / ds);
    B.forEach(function (b) {
      if (b.id === 'sun' || !b.wp) return;
      var ox = b.wp[0] - S.pos[0], oy = b.wp[1] - S.pos[1], oz = b.wp[2] - S.pos[2], od = Math.hypot(ox, oy, oz); if (od > ds) return;
      var sep = Math.acos(Math.max(-1, Math.min(1, (ox * dx + oy * dy + oz * dz) / od))), br = Math.asin(Math.min(1, b.R / od));
      occ *= Math.max(0, Math.min(1, (sep - br + sunAng) / (2 * sunAng + 1e-9)));
    });
    var edge = front ? Math.max(0, 1 - Math.max(0, Math.max(Math.abs(sp.x), Math.abs(sp.y)) - 1) * 3) : 0;
    var target = edge * occ;
    sunVis += (target - sunVis) * 0.25;
    var bright = Math.max(.25, Math.min(1.25, Math.pow(AU / ds, .45)));     // 远离太阳光晕变弱
    var cx = W / 2, cy = H / 2, roll = 0;
    fxEls.forEach(function (f, i) {
      var px = x + (cx - x) * f.k, py = y + (cy - y) * f.k, s = f.size * H;
      var a = f.amt * sunVis * (f.k > 0 ? Math.min(1, bright) * (0.4 + 0.6 * Math.min(1, Math.hypot(cx - x, cy - y) / (H * .25))) : bright);
      if (i === 3) s = W * 1.4;   // 横向拖影随屏宽
      f.m.position.set(px, py, 0); f.m.scale.set(i === 3 ? s : s, i === 3 ? H * .5 : s, 1); f.m.material.uniforms.amt.value = a; f.m.visible = a > .003;
      if (i === 2) f.m.material.uniforms.rot.value = roll;
    });
    return { x: x, y: y, front: front, vis: sunVis };
  }

  /* ---------------- 船 ---------------- */
  var S = { pos: [0, 0, 0], q: null, base: 6.14, mult: 1, dir: 1, trip: 0, t0: 0, target: 'earth', auto: false, align: false, labels: true, orb: true, look: [0, 0], roll: 0, boost: 1, keys: {} };
  function startPose(tid) {
    ephem(true); var ms = Date.now(), tb = BY[tid] || BY.earth, tp = bpos(tb, ms), sp = bpos(BY.sun, ms);
    var toS = [sp[0] - tp[0], sp[1] - tp[1], sp[2] - tp[2]], l = Math.hypot(toS[0], toS[1], toS[2]); toS = toS.map(function (v) { return v / l; });
    // 站在目标「背光侧」偏 20°:目标呈逆光弯月,太阳在视野里(光晕可见)
    var dist = tb.id === 'sun' ? tb.R * 40 : Math.max(tb.R * 7, 45000 * tb.R / 6371);
    var up = new T.Vector3(0, 1, 0), a = new T.Vector3(-toS[0], -toS[1], -toS[2]), side = new T.Vector3().crossVectors(a, up).normalize();
    a.applyAxisAngle(up, 0.36).add(new T.Vector3(0, .12, 0)).normalize();
    S.pos = [tp[0] + a.x * dist, tp[1] + a.y * dist, tp[2] + a.z * dist];
    var m = new T.Matrix4().lookAt(new T.Vector3(0, 0, 0), new T.Vector3(tp[0] - S.pos[0], tp[1] - S.pos[1], tp[2] - S.pos[2]).normalize(), up);
    S.q = new T.Quaternion().setFromRotationMatrix(m);
    // 把机头往太阳方向偏一点,让太阳也进画面
    var toSun = new T.Vector3(sp[0] - S.pos[0], sp[1] - S.pos[1], sp[2] - S.pos[2]).normalize(), fw = new T.Vector3(0, 0, -1).applyQuaternion(S.q);
    var mid = fw.clone().multiplyScalar(.72).add(toSun.multiplyScalar(.28)).normalize();
    S.q.setFromRotationMatrix(new T.Matrix4().lookAt(new T.Vector3(), mid, up));
    S.target = tb.id; S.base = tb.id === 'earth' ? 6.14 : 10; S.mult = 1; S.auto = false; S.trip = 0; S.t0 = performance.now();
  }

  /* ---------------- HUD ---------------- */
  var H = {}, root;
  function css() {
    if ($('#shxc-css')) return;
    var s = el('style'); s.id = 'shxc-css';
    s.textContent = [
      '#shxc{position:fixed;inset:0;z-index:2000;background:#000;color:#d6deee;font:12px/1.45 "Noto Sans SC",system-ui,sans-serif;overflow:hidden;user-select:none;-webkit-user-select:none;touch-action:none}',
      '#shxc canvas.gl{position:absolute;inset:0;width:100%;height:100%;display:block}',
      '#shxc .p{position:absolute;background:rgba(8,12,22,.52);border:1px solid rgba(150,180,220,.16);border-radius:10px;backdrop-filter:blur(5px);-webkit-backdrop-filter:blur(5px);box-shadow:inset 0 0 18px rgba(127,214,255,.04)}',
      '#shxc .mono{font-family:ui-monospace,"SF Mono",Menlo,Consolas,monospace;font-variant-numeric:tabular-nums}',
      '#shxc .cap{font-size:10px;letter-spacing:.14em;color:rgba(180,195,220,.55);text-transform:uppercase}',
      '#shxc .sec{margin:8px 0 3px;font-size:10px;letter-spacing:.14em;color:rgba(180,195,220,.5);border-bottom:1px solid rgba(150,180,220,.12);padding-bottom:2px}',
      '#shxc .kv{display:flex;justify-content:space-between;gap:10px;line-height:1.75}#shxc .kv b{font-weight:500;color:#eef3fb}#shxc .kv span{color:rgba(190,202,225,.62);font-size:11px}#shxc .kv i{font-style:normal;color:rgba(190,202,225,.5);font-size:10px;margin-left:3px}',
      '#shxc .clk{left:16px;top:14px;width:224px;padding:10px 14px}#shxc .clk .t{font-size:24px;letter-spacing:.04em;color:#fff;margin:2px 0}',
      '#shxc.nodata .nav{display:none!important}#shxc #xc-more.on{border-color:rgba(255,206,84,.6);color:#ffd27a}#shxc .nav{left:16px;top:134px;width:224px;padding:6px 14px 10px;max-height:calc(100vh - 300px);overflow:auto}',
      '#shxc .tgt{right:16px;top:14px;width:258px;padding:10px 14px}#shxc .tgt h3{margin:2px 0 6px;font-size:22px;font-weight:500;color:#fff;letter-spacing:.06em}#shxc .tgt h3::before{content:"◆ ";color:#7fd6ff;font-size:13px;vertical-align:3px}',
      '#shxc .g2{display:grid;grid-template-columns:1fr 1fr;gap:2px 12px}#shxc .g2 div{line-height:1.25;margin:3px 0}#shxc .g2 span{display:block;font-size:10px;color:rgba(190,202,225,.55)}#shxc .g2 b{font-weight:500;color:#eef3fb}',
      '#shxc .blurb{margin:6px 0 2px;color:rgba(210,220,238,.78);font-size:11.5px;line-height:1.55}',
      '#shxc .btn{border:1px solid rgba(150,180,220,.3);background:rgba(20,30,52,.55);color:#dfe7f5;border-radius:16px;padding:4px 10px;font:inherit;font-size:11px;cursor:pointer}#shxc .btn:hover{border-color:#7fd6ff;color:#fff}#shxc .btn.on{border-color:#f0c97a;color:#f0c97a;box-shadow:0 0 10px rgba(240,201,122,.25)}',
      '#shxc .row{display:flex;gap:6px;flex-wrap:wrap;margin-top:6px}',
      '#shxc .lst{right:16px;top:300px;width:258px;padding:8px 6px 8px 10px;max-height:calc(100vh - 650px);min-height:110px;overflow:auto}',
      '#shxc .lst .it{display:flex;align-items:center;gap:8px;padding:3px 8px;border-radius:6px;cursor:pointer;line-height:1.6}#shxc .lst .it:hover{background:rgba(127,214,255,.08)}#shxc .lst .it.on{background:rgba(127,214,255,.13);box-shadow:inset 2px 0 #7fd6ff}#shxc .lst .it.sub{padding-left:22px;font-size:.92em;opacity:.88}#shxc .lst .grp{font-size:10.5px;letter-spacing:.14em;color:#7fb6dd;opacity:.75;padding:6px 8px 2px}',
      '#shxc .lst .dot{width:7px;height:7px;border-radius:50%}#shxc .lst .nm{flex:1}#shxc .lst .ds{color:rgba(190,202,225,.6);font-size:10.5px}',
      '#shxc .keys{right:16px;bottom:120px;width:258px;padding:8px 12px;font-size:11px}#shxc .keys .kg{display:grid;grid-template-columns:auto 1fr auto 1fr;gap:3px 8px;align-items:center}#shxc kbd{font:10px ui-monospace,monospace;border:1px solid rgba(180,200,230,.35);border-radius:4px;padding:0 4px;color:#e8eef9;background:rgba(255,255,255,.04)}#shxc .keys.min .kg{display:none}',
      '#shxc .arc{left:50%;top:10px;transform:translateX(-50%);position:absolute;pointer-events:none}',
      '#shxc .hdg{left:50%;top:112px;transform:translateX(-50%);position:absolute;padding:3px 14px;border-radius:14px;background:rgba(8,12,22,.5);border:1px solid rgba(150,180,220,.16);font-size:11px;white-space:nowrap}#shxc .hdg b{color:#fff;font-weight:500;margin:0 10px 0 4px}',
      '#shxc .ctr{position:absolute;left:50%;bottom:62px;transform:translateX(-50%);text-align:center;pointer-events:none}#shxc .ctr .nm{font-size:22px;color:#fff;letter-spacing:.12em}#shxc .ctr .sub{display:inline-block;margin-top:3px;padding:1px 10px;border:1px solid rgba(150,180,220,.25);border-radius:10px;font-size:11px;color:rgba(210,220,238,.8)}',
      '#shxc .strip{position:absolute;left:50%;bottom:12px;transform:translateX(-50%);width:min(560px,60vw);height:40px}',
      '#shxc .gauges{position:absolute;bottom:10px;display:flex;gap:14px}#shxc .gl-l{left:14px}#shxc .gl-r{right:14px}',
      '#shxc .gau{width:104px;height:104px;position:relative;text-align:center}#shxc .gau svg{position:absolute;inset:0}#shxc .gau .v{position:absolute;left:0;right:0;top:34px;font-size:19px;color:#fff}#shxc .gau .u{position:absolute;left:0;right:0;top:60px;font-size:10px;color:rgba(200,212,235,.6)}#shxc .gau .n{position:absolute;left:-10px;right:-10px;top:88px;font-size:10px;color:rgba(200,212,235,.7)}',
      '#shxc .gau.warm .v{color:#f0c97a}',
      '#shxc .lbl{position:absolute;left:0;top:0;pointer-events:auto;cursor:pointer;white-space:nowrap;font-size:11px;color:#e8eef9;text-shadow:0 0 4px #000,0 0 8px #000;transform:translate(-9px,-9px)}#shxc .lbl::before{content:"";display:inline-block;width:12px;height:12px;margin-right:5px;vertical-align:-2px;border:1px solid rgba(220,230,245,.75);border-radius:2px;-webkit-mask:linear-gradient(#000 0 0) top left/4px 4px no-repeat,linear-gradient(#000 0 0) top right/4px 4px no-repeat,linear-gradient(#000 0 0) bottom left/4px 4px no-repeat,linear-gradient(#000 0 0) bottom right/4px 4px no-repeat}#shxc .lbl i{display:block;font-style:normal;font-size:9.5px;color:rgba(200,212,235,.6);margin-left:17px}',
      '#shxc .lbl.t{color:#7fd6ff}#shxc .lbl.t::before{border-color:#7fd6ff}',
      '#shxc .ret{position:absolute;left:50%;top:50%;width:26px;height:26px;margin:-13px 0 0 -13px;pointer-events:none;opacity:.8}',
      '#shxc .tmk{position:absolute;width:64px;height:64px;margin:-32px 0 0 -32px;pointer-events:none;border:1px solid rgba(127,214,255,.0)}#shxc .tmk::before,#shxc .tmk::after{content:"";position:absolute;width:14px;height:14px;border:1.5px solid #7fd6ff}#shxc .tmk::before{left:0;top:0;border-right:0;border-bottom:0}#shxc .tmk::after{right:0;bottom:0;border-left:0;border-top:0}',
      '#shxc .arw{position:absolute;width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-bottom:14px solid #7fd6ff;margin:-7px 0 0 -7px;pointer-events:none;filter:drop-shadow(0 0 4px #7fd6ff)}',
      '#shxc .x{position:absolute;left:50%;top:136px;transform:translateX(-50%)}',
      '#shxc .toast{position:absolute;left:50%;top:40%;transform:translate(-50%,-50%);padding:8px 16px;border-radius:18px;background:rgba(8,12,22,.75);border:1px solid rgba(240,201,122,.4);color:#f0c97a;opacity:0;transition:opacity .4s;pointer-events:none}',
      '#shxc .credit{position:absolute;left:50%;bottom:0;transform:translateX(-50%);font-size:9px;color:rgba(180,195,220,.35);white-space:nowrap;pointer-events:none}',
      '#shxc .mob{display:none}',
      '@media (max-width:900px),(max-height:560px){#shxc .nav,#shxc .keys,#shxc .lst{display:none}#shxc.more .nav{display:block;top:96px;max-height:calc(100vh - 230px)}#shxc .tgt{width:210px}#shxc .tgt .blurb,#shxc .tgt .g2 .x2{display:none}#shxc .clk{width:auto}#shxc .mob{display:flex}}',
      '@media (max-width:640px){#shxc .clk{left:8px;top:8px;padding:6px 10px}#shxc .clk .t{font-size:17px}#shxc .clk .cap,#shxc .clk .row{display:none}#shxc .tgt{right:8px;top:8px;width:168px;padding:6px 10px}#shxc .tgt h3{font-size:17px}#shxc .tgt .g2 div:nth-child(n+5){display:none}#shxc .tgt .row .btn{padding:3px 7px}' +
      '#shxc .arc{transform:translateX(-50%) scale(.62);transform-origin:top center;top:84px}#shxc .hdg{top:158px;font-size:10px}#shxc .x{top:186px}#shxc .gau{width:78px;height:78px}#shxc .gau svg{transform:scale(.75);transform-origin:0 0}#shxc .gau .v{top:24px;font-size:14px}#shxc .gau .u{top:44px}#shxc .gau .n{top:64px;font-size:9px}#shxc .gauges{gap:2px;bottom:64px}#shxc .gl-l .gau:nth-child(2),#shxc .gl-r .gau:nth-child(1){display:none}#shxc .ctr{bottom:40px}#shxc .ctr .nm{font-size:16px}#shxc .strip{width:86vw;bottom:2px;height:34px}#shxc.more .nav{left:8px;right:8px;width:auto;top:120px}}',
      '@media (max-height:420px){#shxc .mob{top:8px;bottom:auto!important;left:auto;right:8px;transform:none;top:auto;bottom:auto}#shxc .mob{top:62px!important}#shxc .tgt{display:none}#shxc .mob .btn{padding:4px 9px;font-size:11px}#shxc .arc,#shxc .hdg,#shxc .strip{display:none}#shxc .x{top:8px}#shxc .tgt .g2{display:none}#shxc .gauges{bottom:4px}#shxc .ctr{bottom:8px}}',
      '#shxc .mob{position:absolute;left:50%;transform:translateX(-50%);bottom:130px;gap:6px;width:max-content;align-items:center;height:auto}#shxc .mob .btn{padding:7px 11px;font-size:12px;white-space:nowrap}#shxc .ctr .sub{white-space:nowrap}#shxc .btn{white-space:nowrap}',
      '@media (max-width:640px){#shxc .mob{bottom:146px}#shxc .arc{display:none}#shxc .hdg{left:8px;top:58px;transform:none;padding:2px 8px}#shxc .hdg b{margin:0 5px 0 2px}#shxc .x{display:none}#shxc #xc-utc{display:none}#shxc .clk{max-width:150px}#shxc .tgt{width:150px}#shxc .tgt .g2{grid-template-columns:1fr}#shxc .tgt .g2 div:nth-child(n+3){display:none}#shxc .tgt .g2 b{font-size:11px}#shxc .tgt .row{flex-direction:column}#shxc .credit{display:none}#shxc .lbl i{display:none}}'
    ].join('\n');
    document.head.appendChild(s);
  }
  function gauge(id, unit, name, warm) {
    var r = 44, c = 2 * Math.PI * r, arc = c * 0.75;
    return '<div class="gau' + (warm ? ' warm' : '') + '" id="' + id + '"><svg width="104" height="104" viewBox="0 0 104 104"><g transform="rotate(135 52 52)">' +
      '<circle cx="52" cy="52" r="' + r + '" fill="none" stroke="rgba(150,180,220,.18)" stroke-width="2" stroke-dasharray="' + arc + ' ' + c + '"/>' +
      '<circle cx="52" cy="52" r="' + (r - 6) + '" fill="none" stroke="rgba(150,180,220,.22)" stroke-width="5" stroke-dasharray="1 ' + (2 * Math.PI * (r - 6) * 0.75 / 30 - 1) + '"/>' +
      '<circle class="a" cx="52" cy="52" r="' + r + '" fill="none" stroke="' + (warm ? '#f0c97a' : '#e8eef9') + '" stroke-width="2.4" stroke-linecap="round" stroke-dasharray="0 ' + c + '"/></g></svg>' +
      '<div class="v mono">—</div><div class="u">' + unit + '</div><div class="n">' + name + '</div></div>';
  }
  function setG(id, frac, val, note, unit) {
    var g = H[id] || (H[id] = $('#' + id, root)); if (!g) return;
    var c = 2 * Math.PI * 44, a = c * 0.75 * Math.max(0, Math.min(1, frac));
    g.querySelector('.a').setAttribute('stroke-dasharray', a + ' ' + c); g.querySelector('.v').textContent = val; if (note != null) g.querySelector('.n').textContent = note; if (unit) g.querySelector('.u').textContent = unit;
  }
  function buildHud() {
    root = el('div'); root.id = 'shxc'; root.setAttribute('role', 'application'); root.setAttribute('aria-label', '天枢 Starhelm 驾驶舱');
    root.innerHTML =
      '<div class="p clk"><div class="cap">真实比例飞行 · 任务时间</div><div class="t mono" id="xc-t">T+ 00:00:00</div><div class="mono" style="font-size:10.5px;color:rgba(190,202,225,.6)" id="xc-utc"></div>' +
      '<div class="row"><button class="btn" id="xc-more" type="button">数据</button><button class="btn" id="xc-exit" type="button">结束探索</button></div></div>' +
      '<div class="p nav mono" id="xc-nav"></div>' +
      '<div class="p tgt"><div class="cap" id="xc-tt">目标 · 行星</div><h3 id="xc-tn">地球</h3><div class="g2 mono" id="xc-tg"></div><div class="blurb" id="xc-tb"></div>' +
      '<div class="row"><button class="btn" id="xc-al" type="button">对准 · Z</button><button class="btn" id="xc-ap" type="button">自动驾驶 · G</button></div></div>' +
      '<div class="p lst" id="xc-lst"><div class="cap" style="margin:0 6px 4px">导航目标 · 单击锁定 · 出发见锚点卡 · T</div></div>' +
      '<div class="p keys" id="xc-keys"><div class="cap" style="display:flex;justify-content:space-between;margin-bottom:4px"><span>操作</span><a id="xc-kt" style="cursor:pointer">收起 · H</a></div><div class="kg">' +
      '<kbd>W</kbd><span>加速</span><kbd>S</kbd><span>减速</span><kbd>A</kbd><span>左转</span><kbd>D</kbd><span>右转</span><kbd>R</kbd><span>抬头</span><kbd>F</kbd><span>低头</span>' +
      '<kbd>Q</kbd><span>左滚</span><kbd>E</kbd><span>右滚</span><kbd>Shift</kbd><span>×10 推进</span><kbd>X</kbd><span>急停</span><kbd>[ ]</kbd><span>倍率</span><kbd>滚轮</kbd><span>巡航速度</span>' +
      '<kbd>T</kbd><span>下一目标</span><kbd>Z</kbd><span>对准目标</span><kbd>G</kbd><span>自动驾驶</span><kbd>L</kbd><span>标签</span><kbd>O</kbd><span>轨道</span><kbd>拖动</kbd><span>转视角</span></div></div>' +
      '<canvas class="arc" id="xc-arc" width="600" height="104"></canvas><div class="hdg mono" id="xc-hdg"></div>' +
      '<svg class="ret" viewBox="0 0 26 26"><circle cx="13" cy="13" r="2.5" fill="none" stroke="#e8eef9" stroke-width="1"/><path d="M13 1v7M13 18v7M1 13h7M18 13h7" stroke="#e8eef9" stroke-width="1"/></svg>' +
      '<div class="tmk" id="xc-tmk"></div><div class="arw" id="xc-arw"></div><div id="xc-lbls"></div>' +
      '<div class="gauges gl-l">' + gauge('xc-g1', 'km/s', '速度') + gauge('xc-g2', 'km', '高度') + '</div>' +
      '<div class="gauges gl-r">' + gauge('xc-g3', 'km', '距目标') + gauge('xc-g4', '倍', '倍率', true) + '</div>' +
      '<div class="ctr"><div class="cap">目标</div><div class="nm" id="xc-cn">地球</div><div class="sub mono" id="xc-cs"></div></div>' +
      '<canvas class="strip" id="xc-strip" width="1120" height="80"></canvas>' +
      '<div class="mob"><button class="btn" data-k="end" type="button">结束探索</button><button class="btn" data-k="-" type="button">减速</button><button class="btn" data-k="+" type="button">加速</button><button class="btn" data-k="m" type="button">倍率×10</button><button class="btn" data-k="g" type="button">自动驾驶</button></div>' +
      '<div class="toast" id="xc-toast"></div>' +
      '<div class="credit">星历 astronomy-engine(MIT)· 贴图 Solar System Scope(CC BY 4.0)· 星空 NASA SVS · 距离与大小为真实比例,远处天体按视角大小压缩绘制</div>';
    document.body.appendChild(root);
    var lst = $('#xc-lst', root);
    B.forEach(function (b) {
      if (b.comet && !lst.querySelector('.grp')) lst.appendChild(el('div', 'grp', '彗星 · COMETS'));
      var it = el('div', 'it' + (b.parent ? ' sub' : ''), '<span class="dot" style="background:' + b.col + '"></span><span class="nm">' + b.zh + '</span><span class="ds mono"></span>');
      it.setAttribute('data-id', b.id); b.li = it; lst.appendChild(it); if (b.off) it.style.display = 'none';
      // C2.7a:单击/双击都只锁定目标(双击不再直接自动驾驶);出发统一走锚点卡「出发」/ 航行规划「出发」/ G
      it.addEventListener('click', function () { setTarget(b.id, root.classList.contains('xg-cat') ? '目录' : '快捷目的地'); });
    });
    $('#xc-exit', root).onclick = function () { confirmEnd(); };
    $('#xc-more', root).onclick = function () {
      /* C2.2b:「数据」= 航行数据栏开/关。窄屏默认隐藏 → 点开;桌面默认显示 → 点收起。按钮高亮 + 提示,避免“点了没反应” */
      var narrow = matchMedia('(max-width:900px),(max-height:560px)').matches, b = this;
      if (narrow) root.classList.toggle('more'); else root.classList.toggle('nodata');
      var shown = narrow ? root.classList.contains('more') : !root.classList.contains('nodata');
      b.classList.toggle('on', shown); b.setAttribute('aria-pressed', shown ? 'true' : 'false');
      toast(shown ? '航行数据栏已展开(各天体距离 · 光行时 · 数据来源)' : '航行数据栏已收起 · 再点「数据」展开');
    };
    $('#xc-al', root).onclick = function () { S.align = !S.align; if (S.align) S.auto = false; };
    $('#xc-ap', root).onclick = function () { autopilot(!S.auto); };
    $('#xc-kt', root).onclick = function () { $('#xc-keys', root).classList.toggle('min'); };
    root.querySelectorAll('.mob .btn').forEach(function (b) {
      b.onclick = function () { var k = b.getAttribute('data-k'); if (k === 'end') { confirmEnd(); return; } if (k === '+') S.base = Math.min(MAXV, S.base * 1.6 + .5); if (k === '-') S.base = Math.max(0, S.base / 1.6 - .2); if (k === 'm') S.mult = S.mult >= 1e6 ? 1 : S.mult * 10; if (k === 'g') autopilot(!S.auto); S.auto = k === 'g' ? S.auto : false; };
    });
    B.forEach(function (b) { var l = el('div', 'lbl', b.zh + '<i></i>'); l.dataset.id = b.id; l.dataset.p = b.id === 'sun' ? 800 : b.ghost ? 760 : b.star ? 700 : b.comet ? 380 : b.parent ? 300 : b.type === '矮行星' ? 480 : 650; l.onclick = function (e) { if (e) e.stopPropagation(); lblCard(b, l); }; /* C2.7-AUDIT ① 标签只看资料,不改目标 */ $('#xc-lbls', root).appendChild(l); b.lb = l; });
  }
  function toast(m) { var t = $('#xc-toast', root); t.textContent = m; t.style.opacity = 1; clearTimeout(t._h); t._h = setTimeout(function () { t.style.opacity = 0; }, 2400); }
  function tempStar(o) {   // C2.2d:把任意恒星装进临时航点槽,重建恒星外观
    var b = BY.tmpstar; if (!b || !sMain) return null;
    ['zh', 'en', 'type', 'R', 'GM', 'L', 'temp', 'col', 'fix', 'tint', 'sat', 'info', 'hyg'].forEach(function (k) { if (o[k] != null) b[k] = o[k]; });
    b.off = false;
    if (b.g) { if (b.g.parent) b.g.parent.remove(b.g); b.g.traverse(function (x) { if (x.geometry) x.geometry.dispose(); if (x.material && x.material.dispose) x.material.dispose(); }); }
    b.fx = null; sMain.add(body3d(b)); ephem(true); b.wp = bpos(b, Date.now());
    b.li.style.display = ''; b.li.querySelector('.nm').textContent = b.zh + ' · 临时'; b.li.querySelector('.dot').style.background = b.col;
    b.lb.innerHTML = b.zh + '<i></i>';
    setTarget('tmpstar', o.src); return b;
  }
  function tempDso(o) {   // C2.6b:把深空天体装进深空航点槽
    var b = BY.tmpdso; if (!b || !b.li) return null;
    ['zh', 'en', 'type', 'R', 'fix', 'info', 'key'].forEach(function (k) { if (o[k] != null) b[k] = o[k]; });
    b.off = false; ephem(true); b.wp = bpos(b, Date.now());   // C2.7c:立即刷新航点位置 —— 否则锚点卡首帧读到占位 fix(1e12 AU ≈ 1,581 万光年)
    b.li.style.display = ''; b.li.querySelector('.nm').textContent = b.zh + ' · 深空'; b.li.querySelector('.dot').style.background = b.col;
    b.lb.innerHTML = b.zh + '<i></i>';
    setTarget('tmpdso', o.src); return b;
  }
  var GLP = null, GLC = {};
  function gltf() {
    if (GLP) return GLP;
    GLP = window.SHX_GLTFLoader ? Promise.resolve() : new Promise(function (res, rej) { var sc = document.createElement('script'); sc.src = 'x/vendor/three-r186/GLTFLoader.min.js'; sc.onload = res; sc.onerror = rej; document.head.appendChild(sc); });
    return GLP;
  }
  function loadCraft(b) {
    b.cReq = true;
    gltf().then(function () {
      if (!GLC[b.craft]) GLC[b.craft] = new Promise(function (res, rej) { new window.SHX_GLTFLoader().load(b.craft, function (g) { res(g.scene); }, null, rej); });
      return GLC[b.craft];
    }).then(function (sc0) {
      if (!b.cg) return;
      var sc = sc0.clone(true), box = new T.Box3().setFromObject(sc), sz = box.getSize(new T.Vector3()), c = box.getCenter(new T.Vector3());
      var k = (b.span / 1000) / Math.max(sz.x, sz.y, sz.z, 1e-9);   // 按真实最大尺寸(米)缩放到 km
      sc.position.copy(c).multiplyScalar(-k); sc.scale.setScalar(k);
      var piv = new T.Group(); piv.add(sc); b.cg.add(piv);
      sc.traverse(function (o) { if (o.isMesh && o.material) { o.frustumCulled = false; var ms = Array.isArray(o.material) ? o.material : [o.material]; ms.forEach(function (m) { if (m.envMapIntensity != null) m.envMapIntensity = 0; }); } });
      // 远离太阳处真实光照极弱,这里按曝光拉伸:一束指向太阳的平行光 + 很弱的环境光(示意)
      var L = new T.DirectionalLight(0xfff4e6, 3.2); L.target = b.cg; b.cg.add(L); b.cL = L;
      b.cg.add(new T.AmbientLight(0x8aa0c0, .25));
      b.cMesh = piv;
    }).catch(function (e) { console.warn('[SHXC craft]', b.id, e); });
  }
  /* C2.7a 王磊 10-29:选定目标只「锁定」,不自动出发。带来源(src)的切换:自动驾驶中换目标 → 暂停自动驾驶,并在 Armilla 上方弹目标锚点卡 */
  function setTarget(id, src) {
    var old = S.target; S.target = id;
    if (S.auto && src && old !== id) { S.auto = false; if (root) root.classList.remove('xc-ap'); toast('目标已切换为 ' + BY[id].zh + ' · 自动驾驶已暂停,确认后再点「出发」'); }
    else if (S.auto) autopilot(true);
    B.forEach(function (b) { b.li.classList.toggle('on', b.id === id); });
    if (src && window.SHXAN) SHXAN.lock(BY[id], src, old !== id);
  }
  function autopilot(on) { S.auto = on; S.align = false; if (on) { toast('自动驾驶:飞往 ' + BY[S.target].zh); if (window.SHXAN) SHXAN.fade(); } }

  /* C1.9c 日球层读数(30 AU 以外显示):按旅行者 1/2 号实测剖面插值的示意值
   * 终端激波 ~94 AU(V1 2004-12;V2 ~84 AU 2007-08):太阳风由超音速 ~400 km/s 骤降到 ~130 km/s,等离子体被压缩加热、磁场增强
   * 日球层顶 121.6 AU(V1 2012-08-25;V2 119 AU 2018-11-05):太阳风粒子几乎消失,银河宇宙线骤增,等离子体密度跳升约 40 倍(V1 等离子体波测得 ~0.08 /cm³) */
  function helioHud(r) {
    if (r < 30) return '';
    var TS = 94, HP = 121.6, zone, v, n, B, gcr, hp;
    function L(a, b, t) { t = Math.max(0, Math.min(1, t)); return a + (b - a) * t; }
    if (r < TS) { zone = '超音速太阳风区'; v = 400; n = 7 / (r * r); B = 0.1 * 30 / r + .03; gcr = L(55, 70, (r - 30) / (TS - 30)); hp = 100; }
    else if (r < HP) { var t = (r - TS) / (HP - TS); zone = '日鞘(亚音速)'; v = L(130, 20, t); n = L(.002, .004, t); B = L(.12, .2, t); gcr = L(72, 80, t); hp = L(100, 90, t); }
    else { var u = Math.min(1, (r - HP) / 30); zone = r < 2000 ? '本地星际介质' : '星际空间'; v = L(20, 0, u * 3); n = .08; B = .5; gcr = 100; hp = L(2, 1, u); }
    function bar(x) { return '<span style="display:inline-block;width:60px;height:5px;border-radius:3px;background:linear-gradient(90deg,#f0c97a ' + x + '%,rgba(150,180,220,.18) ' + x + '%);vertical-align:middle"></span> ' + Math.round(x); }
    return '<div class="sec">日球层 · 旅行者号实测剖面(示意) <a onclick="window.SHXE&&SHXE.show(\'heliosphere\',1)" style="cursor:pointer;color:#f0c97a;pointer-events:auto">?</a></div>' + kv('所在区域', zone) + kv('太阳风径向速度', v < 1 ? '≈ 0' : Math.round(v), 'km/s') +
      kv('等离子体密度', sig(n, 2), '/cm³') + kv('磁场强度', sig(B, 2), 'nT') + kv('银河宇宙线(相对)', bar(gcr)) + kv('太阳风粒子(相对)', bar(hp)) +
      (window.SHXH ? kv('外形示意 · 推测', '<a onclick="window.SHXH&&SHXH.model()" style="cursor:pointer;color:#f0c97a;pointer-events:auto" title="切换日球层外形模型(形状仍有争议)">' + SHXH.modelName() + ' ⇄</a>') : '');
  }

  /* ---------------- 输入 ---------------- */
  var drag = null;
  function bindInput(cv) {
    cv.addEventListener('pointerdown', function (e) { drag = { x: e.clientX, y: e.clientY, id: e.pointerId }; cv.setPointerCapture(e.pointerId); });
    cv.addEventListener('pointermove', function (e) { if (!drag || drag.id !== e.pointerId) return; S.look[0] += (e.clientX - drag.x) * 0.0032; S.look[1] += (e.clientY - drag.y) * 0.0032; drag.x = e.clientX; drag.y = e.clientY; S.auto = false; S.align = false; });
    function up() { drag = null; }
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    cv.addEventListener('wheel', function (e) { e.preventDefault(); var f = e.deltaY < 0 ? 1.25 : 0.8; if (e.ctrlKey) S.mult = Math.max(1, Math.min(1e6, S.mult * f)); else S.base = Math.max(0, Math.min(MAXV, S.base * f + (f > 1 ? .05 : 0))); S.auto = false; }, { passive: false });
  }
  function onBlur() { S.keys = {}; S.boost = 1; }   // C2.2f 切走窗口时按键松开事件会丢,避免「卡键」
  function onEndUp(e) {   // C2.2f 兜底:「结束探索」按钮即使被重绘/被半透明层压住,也在捕获阶段响应
    var t = e.target && e.target.closest ? e.target.closest('#xc-exit,#shxc .mob [data-k=end]') : null;
    if (!t && !(e.target && e.target.closest && e.target.closest('button,a,input,select,.it,.lbl,#xe-dlg,.xs-card'))) { var ex = $('#xc-exit', root); if (ex && ex.offsetParent) { var r = ex.getBoundingClientRect(); if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom && !(dlg && dlg.isConnected)) t = ex; } }
    if (t) setTimeout(confirmEnd, 0);
  }
  function onKey(e) {
    if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName || '')) return;   // C2.4 目录搜索框里打字不操纵飞船
    if (dlg && !dlg.isConnected) dlg = null;   // C2.2f 对话框已被移除但引用残留 → 会吞掉所有按键
    if (S.tour && !(window.SHXT && SHXT.on())) S.tour = false;
    if (!K.open || S.tour) return; var k = e.key.length === 1 ? e.key.toLowerCase() : e.key, down = e.type === 'keydown';
    if (e.key === 'Escape') { e.stopPropagation(); e.preventDefault(); }
    if (dlg && e.key !== 'Escape' && e.key !== 'Enter') return;
    if (e.key === 'Shift') S.boost = down ? 10 : 1;
    S.keys[k] = down;
    if (!down) return;
    if (k === 'Escape') { if (dlg) { endDlg(false); return; } if (X._esc && X._esc()) return; confirmEnd(); }
    else if (dlg && k === 'Enter') { endDlg(true); }
    else if (k === 'x') { S.base = 0; S.mult = 1; S.auto = false; toast('急停'); }
    else if (k === 't') { var i = B.map(function (b) { return b.id; }).indexOf(S.target); setTarget(B[(i + 1) % B.length].id, '键盘 T'); }
    else if (k === 'z') { S.align = !S.align; S.auto = false; }
    else if (k === 'g') autopilot(!S.auto);
    else if (k === 'l') S.labels = !S.labels;
    else if (k === 'o') { S.orb = !S.orb; }
    else if (k === 'h') $('#xc-keys', root).classList.toggle('min');
    else if (k === ']') { S.mult = Math.min(1e6, S.mult * 10); S.auto = false; }
    else if (k === '[') { S.mult = Math.max(1, S.mult / 10); S.auto = false; }
    else return;
    e.preventDefault(); e.stopPropagation();
  }

  /* ---------------- 循环 ---------------- */
  var raf = 0, last = 0, fwd, upv, rgt, frame = 0;
  // C2.2f 防卡死:每帧整体 try/catch;目标失效、位置/姿态/速度出现 NaN 时回退到上一帧的有效状态并解除自动驾驶
  var GOOD = null, ERRN = 0;
  function sane() {
    if (!BY[S.target]) S.target = 'sun';
    var ok = isFinite(S.base) && isFinite(S.mult) && S.pos.every(isFinite) && S.q && isFinite(S.q.x + S.q.y + S.q.z + S.q.w);
    if (ok) { GOOD = { pos: S.pos.slice(), q: S.q.clone() }; return; }
    if (GOOD) { S.pos = GOOD.pos.slice(); S.q.copy(GOOD.q); }
    S.base = 0; S.mult = 1; S.auto = false; S.align = false; S.keys = {};
    console.warn('[SHXC] 状态出现 NaN,已回退'); toast('导航数据异常,已复位到上一位置');
  }
  function loop(t) {
    raf = requestAnimationFrame(loop);
    try { sane(); loop1(t); ERRN = 0; } catch (e) {
      ERRN++; if (ERRN < 4 || ERRN % 300 === 0) console.warn('[SHXC loop]', e);
      if (ERRN === 3) { S.auto = false; S.align = false; S.base = 0; S.mult = 1; S.keys = {}; toast('导航出错,已解除自动驾驶'); }
    }
  }
  function loop1(t) {
    var dt = Math.min(0.1, (t - (last || t)) / 1000); last = t; frame++;
    // C2.2a:上下文丢失期间 / 视口尺寸为 0(手机旋转、地址栏塌缩、宿主被隐藏)时不渲染;尺寸与画布不一致时先补 setSize
    if (K.lost) return;
    if (root.clientWidth < 2 || root.clientHeight < 2) return;
    if (rd.domElement.width !== Math.floor(root.clientWidth * rd.getPixelRatio()) || rd.domElement.height !== Math.floor(root.clientHeight * rd.getPixelRatio())) size();
    ephem(false);
    var ms = Date.now(), W = root.clientWidth, Hh = root.clientHeight;
    B.forEach(function (b) { b.wp = bpos(b, ms); });
    var tb = BY[S.target], tp = tb.wp;
    // --- 姿态 ---
    var yaw = 0, pit = 0, rol = 0, kk = S.keys;
    if (kk.a || kk.ArrowLeft) yaw += 1; if (kk.d || kk.ArrowRight) yaw -= 1; if (kk.r || kk.ArrowUp) pit += 1; if (kk.f || kk.ArrowDown) pit -= 1; if (kk.q) rol += 1; if (kk.e) rol -= 1;
    if (yaw || pit || rol) { S.auto = false; S.align = false; }
    yaw = yaw * 0.9 * dt - S.look[0]; pit = pit * 0.9 * dt - S.look[1]; S.look = [0, 0]; rol = rol * 1.2 * dt;
    tmpQ.setFromEuler(new T.Euler(pit, yaw, rol, 'YXZ')); S.q.multiply(tmpQ).normalize();
    var toT = new T.Vector3(tp[0] - S.pos[0], tp[1] - S.pos[1], tp[2] - S.pos[2]), dT = toT.length(), surfT = Math.max(0, dT - tb.R);
    if (S.auto || S.align) {   // 机头缓慢转向目标
      var want = new T.Quaternion().setFromRotationMatrix(new T.Matrix4().lookAt(new T.Vector3(), toT.clone().normalize(), new T.Vector3(0, 1, 0).applyQuaternion(S.q)));
      S.q.slerp(want, Math.min(1, dt * (S.auto ? 1.6 : 2.4)));
      if (S.align && S.q.angleTo(want) < 0.002) S.align = false;
    }
    // --- 速度 ---
    if (kk.w) { S.base = Math.min(MAXV, S.base + (S.base * 0.9 + 0.5) * dt * S.boost); S.auto = false; }
    if (kk.s) { S.base = Math.max(0, S.base - (S.base * 0.9 + 0.5) * dt * S.boost); S.auto = false; }
    var veff;
    if (S.auto) {
      var stopAt = tb.R * (tb.id === 'sun' || tb.star ? 6 : 4), rem = Math.max(0, dT - stopAt), fw0 = new T.Vector3(0, 0, -1).applyQuaternion(S.q), ali = Math.max(0, fw0.dot(toT.clone().normalize()));
      veff = Math.max(0.5, rem * 0.9) * Math.pow(ali, 8);
      S.base = Math.min(veff, 30); S.mult = Math.max(1, veff / Math.max(S.base, 1e-6));
      if (rem < 1) { S.auto = false; S.base = 0; S.mult = 1; toast('已抵达 ' + tb.zh + ' 附近'); emit('arrive', tb); }
      else if (rem < tb.R * 25 && S._decel !== tb.id) { S._decel = tb.id; emit('decel', tb); }
    }
    veff = S.base * S.mult * (S.auto ? 1 : S.boost);
    if (S.capV && veff > S.capV) veff = S.capV;
    fwd = new T.Vector3(0, 0, -1).applyQuaternion(S.q);
    var step = veff * dt;
    // 防撞:不进入天体表面
    var nx = S.pos[0] + fwd.x * step, ny = S.pos[1] + fwd.y * step, nz = S.pos[2] + fwd.z * step, hit = null;
    // C1.8c:只拦「继续往里飞」的一步;停着被天体追上时轻推到表面外,不再每帧重复报警。同一天体离开 1.5 倍警戒距离前只播报一次
    B.forEach(function (b) {
      var lim = b.R * (b.id === 'sun' ? 1.6 : 1.004), d0 = Math.hypot(S.pos[0] - b.wp[0], S.pos[1] - b.wp[1], S.pos[2] - b.wp[2]), d = Math.hypot(nx - b.wp[0], ny - b.wp[1], nz - b.wp[2]);
      if (step > 0 && d < lim && d < d0) hit = b;
      if (d0 < lim && d0 > 0) { var k = lim * 1.0005 / d0; S.pos = [b.wp[0] + (S.pos[0] - b.wp[0]) * k, b.wp[1] + (S.pos[1] - b.wp[1]) * k, b.wp[2] + (S.pos[2] - b.wp[2]) * k]; nx = S.pos[0] + fwd.x * step; ny = S.pos[1] + fwd.y * step; nz = S.pos[2] + fwd.z * step; }
      if (S._hov === b.id && d0 > lim * 1.5) S._hov = null;
    });
    if (hit && S.auto && hit.id !== S.target) {   // C1.8d 自动驾驶途中挡路的天体:贴着表面绕过去,不停船
      var hn0 = new T.Vector3(S.pos[0] - hit.wp[0], S.pos[1] - hit.wp[1], S.pos[2] - hit.wp[2]).normalize(), tg0 = fwd.clone().addScaledVector(hn0, -fwd.dot(hn0));
      if (tg0.lengthSq() < 1e-8) tg0.set(hn0.y, -hn0.x, 0); tg0.normalize().addScaledVector(hn0, .35).normalize();
      S.pos = [S.pos[0] + tg0.x * step, S.pos[1] + tg0.y * step, S.pos[2] + tg0.z * step]; S.trip += step; hit = null; step = -1;
    }
    if (step === -1) { }
    else if (hit) { S.base = 0; S.mult = 1; S.auto = false; step = 0; if (S._hov !== hit.id) { S._hov = hit.id; toast('靠得太近了:已在 ' + hit.zh + ' 上空悬停'); emit('hover', hit); } }
    else { S.pos = [nx, ny, nz]; S.trip += step; }
    // 随最近天体一起运动(在行星附近悬停时,不会被它甩在身后)
    var near = null, nd = Infinity;
    B.forEach(function (b) { var d = Math.hypot(S.pos[0] - b.wp[0], S.pos[1] - b.wp[1], S.pos[2] - b.wp[2]) - b.R; b.dist = d + b.R; b.surf = d; if (d < nd && b.id !== 'sun') { nd = d; near = b; } });
    var bsun = BY.sun; if (bsun.surf < nd) { near = bsun; nd = bsun.surf; }
    var soi = near.id === 'sun' ? 0 : near.R * (near.id === 'moon' ? 30 : near.id === 'earth' ? 140 : near.parent ? 40 : 300);
    if (near.dist < soi) { S.pos[0] += near.v[0] * dt; S.pos[1] += near.v[1] * dt; S.pos[2] += near.v[2] * dt; }
    emit('frame', { dt: dt, veff: veff, near: near, nd: nd, tb: tb, dT: dT, surfT: surfT, ms: ms });
    // --- 相机 ---
    cam.position.set(0, 0, 0); cam.quaternion.copy(S.q);   // 浮动原点:相机永远在原点,天体按相对位置摆放(GPU float32 精度够用)
    cam.near = Math.max(near && near.craft ? 0.0005 : 0.05, Math.min(2000, nd * 0.35)); cam.far = 5e6; cam.aspect = W / Hh; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    cam0.quaternion.copy(S.q); cam0.aspect = W / Hh; cam0.updateProjectionMatrix();
    camO.position.set(S.pos[0], S.pos[1], S.pos[2]); camO.quaternion.copy(S.q); camO.aspect = W / Hh; camO.updateProjectionMatrix();
    // --- 天体:近处真实位置;远处对数压缩距离、按比例缩小(视角大小不变)---
    var sp = BY.sun.wp, sunLocal = new T.Vector3();
    B.forEach(function (b) {
      var dx = b.wp[0] - S.pos[0], dy = b.wp[1] - S.pos[1], dz = b.wp[2] - S.pos[2], d = Math.hypot(dx, dy, dz), s = 1;
      if (d > D0) { var d2 = D0 * (1 + 0.1 * Math.log(d / D0)); s = d2 / d; }
      b.g.position.set(dx * s, dy * s, dz * s); b.g.scale.setScalar(s); b.sc = s;
      if (b.id === 'sun') sunLocal.copy(b.g.position);
    });
    B.forEach(function (b) {
      if (b.U) { b.U.sunP.value.copy(sunLocal); b.U.hasMap.value = b.U.map.value.ok ? 1 : 0; b.U.hasNight.value = b.U.night.value && b.U.night.value.ok ? 1 : 0; }
      if (b.ringU) b.ringU.pc.value.copy(b.g.position), b.ringU.pr.value = b.R * b.sc;
      if (b.id === 'earth' && window.Astronomy) { b.spin.rotation.y = Astronomy.SiderealTime(now()) / 24 * 2 * Math.PI; }
      else if (b.id === 'moon' || b.parent) { var e = BY[b.parent || 'earth'].g.position; b.spin.lookAt(e.x, e.y, e.z); b.spin.rotateY(-Math.PI / 2); }
      else if (b.per && b.spin) b.spin.rotation.y = (ms / 3.6e6 / b.per) * 2 * Math.PI % (2 * Math.PI);
      if (b.cloud) b.cloud.rotation.y += dt * 0.004;
      if (b.cf) SHXB.update(b, BY.sun.wp, dt, reduced());
      if (b.pt) b.pt.visible = b.dist < 2.8e11;   // 0.03 光年内由航点亮点接管(远处交给 HYG 星空)
    });
    if (BY.sun.fx) BY.sun.fx.update(dt, cam);
    B.forEach(function (b) { if (b.star && b.fx && b.dist < b.R * 400) b.fx.update(dt, cam); });
    B.forEach(function (b) {   // C2.2g 探测器:500 万 km 内懒加载模型;光源始终指向太阳
      if (!b.craft || !b.cg) return;
      if (!b.cReq && b.dist < 5e6) loadCraft(b);
      if (b.cL) { var sd = new T.Vector3(BY.sun.wp[0] - b.wp[0], BY.sun.wp[1] - b.wp[1], BY.sun.wp[2] - b.wp[2]).normalize(); b.cL.position.copy(sd); }
    });
    // --- 尘埃拖影 ---
    if (dust.N) {
      var vis = Math.min(1, Math.log10(1 + veff) / 3), sv = Math.min(160, 6 + Math.log10(1 + veff) * 25) * dt, len = Math.min(26, 0.4 + Math.log10(1 + veff) * 4);
      var inv = S.q.clone().invert(), lv = fwd.clone().applyQuaternion(inv);
      for (var i = 0; i < dust.N; i++) {
        var p = dust.seed[i]; p[0] -= lv.x * sv; p[1] -= lv.y * sv; p[2] -= lv.z * sv;
        for (var j = 0; j < 3; j++) { if (p[j] > 200) p[j] -= 400; if (p[j] < -200) p[j] += 400; }
        var o = i * 6; dust.pos[o] = p[0]; dust.pos[o + 1] = p[1]; dust.pos[o + 2] = p[2]; dust.pos[o + 3] = p[0] + lv.x * len; dust.pos[o + 4] = p[1] + lv.y * len; dust.pos[o + 5] = p[2] + lv.z * len;
      }
      dust.m.geometry.attributes.position.needsUpdate = true; dust.m.material.opacity = 0.32 * vis * (veff > 0.2 ? 1 : 0);
      dust.m.quaternion.copy(S.q);   // 尘埃在船体坐标里
    }
    // --- 渲染 ---
    // C1.4:三引擎电影化特效 —— 激活时先画到离屏 RT,末尾由 SHXFX 全屏 pass 上屏
    var PF = window.SHXFX && SHXFX.begin(rd);
    rd.autoClear = false; rd.clear();
    rd.render(sSky, cam0);
    if (S.orb) { sOrb.visible = true; rd.render(sOrb, camO); }
    var LI = { rd: rd, cam0: cam0, W: W, H: Hh, dt: dt, pf: !!PF };   // C2.1 外挂渲染层(日球层外形 bg / 太阳风粒子流 fg,见 sh-x-helio.js)
    for (var li = 0; li < X.layers.bg.length; li++) { try { X.layers.bg[li](LI); } catch (e) { console.warn('[SHXC layer]', e); X.layers.bg.splice(li--, 1); } }
    rd.clearDepth(); rd.render(sMain, cam);
    if (dust.N) rd.render(sDust, cam0);
    for (li = 0; li < X.layers.fg.length; li++) { try { X.layers.fg[li](LI); } catch (e) { console.warn('[SHXC layer]', e); X.layers.fg.splice(li--, 1); } }
    var fx = updFx(W, Hh, [sunLocal.x, sunLocal.y, sunLocal.z]);
    rd.clearDepth(); rd.render(sFx, camFx);
    if (PF) SHXFX.end(rd, dt);
    for (li = 0; li < X.layers.post.length; li++) { try { X.layers.post[li](LI); } catch (e) { console.warn('[SHXC layer]', e); X.layers.post.splice(li--, 1); } }
    blackCheck(t);
    // --- HUD ---
    hud(dt, W, Hh, veff, near, nd, tb, dT, surfT, fx);
  }
  var lastHud = 0, prevDT = null;
  function proj(p, W, H) { var v = tmpV.set(p.x, p.y, p.z).project(cam); return { x: (v.x * .5 + .5) * W, y: (-v.y * .5 + .5) * H, z: v.z, front: v.z < 1 && tmpV.set(p.x, p.y, p.z).sub(cam.position).dot(fwd) > 0 }; }
  function hud(dt, W, Hh, veff, near, nd, tb, dT, surfT, fx) {
    // 每帧:标签 / 目标框 / 箭头
    var tg = null;
    B.forEach(function (b) {
      var p = proj(b.g.position, W, Hh), on = !b.off && S.labels && p.front && p.x > -50 && p.x < W + 50 && p.y > -20 && p.y < Hh + 20;
      b.pp = p; if (on && b.parent && b.id !== S.target) { var pq = BY[b.parent].pp; if (pq && pq.front && Math.hypot(p.x - pq.x, p.y - pq.y) < 40) on = false; }   // C2.2 卫星离母星屏幕距离 <40 px 时让位
      b.lb.style.display = on ? 'block' : 'none';
      if (on) { b.lb.style.transform = 'translate(' + (p.x - 9) + 'px,' + (p.y - 9) + 'px)'; b.lb.classList.toggle('t', b.id === S.target); }
      if (b.id === S.target) tg = p;
    });
    var tmk = H.tmk || (H.tmk = $('#xc-tmk', root)), arw = H.arw || (H.arw = $('#xc-arw', root));
    var inView = tg.front && tg.x > 0 && tg.x < W && tg.y > 0 && tg.y < Hh;
    tmk.style.display = inView ? 'block' : 'none'; if (inView) { tmk.style.left = tg.x + 'px'; tmk.style.top = tg.y + 'px'; }
    arw.style.display = inView ? 'none' : 'block';
    if (!inView) {
      var lv = tmpV.set(tb.g.position.x, tb.g.position.y, tb.g.position.z).sub(cam.position).applyQuaternion(S.q.clone().invert());
      var ang = Math.atan2(-lv.y, lv.x), rx = W / 2 - 70, ry = Hh / 2 - 90;
      arw.style.left = (W / 2 + Math.cos(ang) * rx) + 'px'; arw.style.top = (Hh / 2 + Math.sin(ang) * ry) + 'px'; arw.style.transform = 'rotate(' + (ang * 180 / Math.PI + 90) + 'deg)';
    }
    drawArc(W);
    if (performance.now() - lastHud < 120) return; var hdt = (performance.now() - lastHud) / 1000; lastHud = performance.now();
    // 读数
    var el0 = (performance.now() - S.t0) / 1000, hh = Math.floor(el0 / 3600), mm = Math.floor(el0 % 3600 / 60), ss = Math.floor(el0 % 60);
    $('#xc-t', root).textContent = 'T+ ' + [hh, mm, ss].map(function (x) { return (x < 10 ? '0' : '') + x; }).join(':');
    $('#xc-utc', root).textContent = now().toISOString().replace('T', ' ').slice(0, 19) + ' UTC · 实时';
    var sun = BY.sun, rs = sun.dist, rau = rs / AU;
    var acc = [0, 0, 0], accN = 0;
    B.forEach(function (b) { var dx = b.wp[0] - S.pos[0], dy = b.wp[1] - S.pos[1], dz = b.wp[2] - S.pos[2], d = Math.hypot(dx, dy, dz), a = b.GM / (d * d); acc[0] += a * dx / d; acc[1] += a * dy / d; acc[2] += a * dz / d; if (b === near) accN = a; });
    var accT = Math.hypot(acc[0], acc[1], acc[2]) * 1000, gam = 1 / Math.sqrt(1 - Math.min(.999999, Math.pow(S.base / C, 2)));
    var vesc = Math.sqrt(2 * near.GM / near.dist), vcir = Math.sqrt(near.GM / near.dist), lt = rs / C;
    // C1.8d 主星:太阳或最近的恒星航点(辐照/温度/视直径按它算)
    var hs = sun; B.forEach(function (b) { if (b.star && b.dist < hs.dist) hs = b; });
    var hau = hs.dist / AU, hL = hs.L || 1, hn = hs === sun ? '太阳' : hs.zh;
    var tempC = 278.6 * Math.pow(hL, .25) / Math.sqrt(hau) - 273.15, sunD = 2 * Math.atan(hs.R / hs.dist) * 180 / Math.PI * 60;
    $('#xc-nav', root).innerHTML =
      '<div class="sec">导航</div>' + kv('日心距离', rau.toFixed(4), 'AU') + kv('参考系', near.dist < (near.R * 300) && near.id !== 'sun' ? near.zh : '日心') + kv('最近天体', near.zh) + kv('本次航程', fkm(S.trip)) +
      '<div class="sec">环境</div>' + kv(hn + '辐照', sig(1361 * hL / (hau * hau), 4), 'W/m²') + kv('舱外平衡温度', nf(Math.max(-270.4, tempC)), '°C') + kv(hn + '视直径', sunD >= 1 ? sunD.toFixed(1) + '′' : (sunD * 60).toFixed(1) + '″') + kv('光行时 · 太阳', fdur(lt)) +
      '<div class="sec">引力</div>' + kv('合引力加速度', sig(accT, 4), 'm/s²') + kv('来自' + near.zh, sig(accN * 1000, 4), 'm/s²') + kv('逃逸速度', sig(vesc, 3), 'km/s') + kv('圆轨道速度', sig(vcir, 3), 'km/s') + kv('洛伦兹因子 γ', gam.toFixed(6)) + helioHud(rau) +
      '<div class="sec">航速</div>' + kv('实际速度', sig(S.base, 4), 'km/s') + kv('等效速度', veff / C >= 0.01 ? sig(veff / C, 3) + ' c' : sig(veff, 4) + ' km/s') + kv('倍率(模拟)', '×' + sig(S.mult * (S.auto ? 1 : S.boost), 3));
    // 目标卡
    var sd = window.SOLAR && (tb.id === 'sun' ? SOLAR.sun : SOLAR.bodies.filter(function (x) { return x.id === tb.id; })[0]);
    var rate = prevDT == null ? 0 : (dT - prevDT) / hdt; prevDT = dT;
    $('#xc-tt', root).textContent = '目标 · ' + tb.type; $('#xc-tn', root).textContent = tb.zh;
    $('#xc-tg', root).innerHTML = g2('距离', fkm(dT)) + g2('接近率', (rate <= 0 ? '−' : '+') + sig(Math.abs(rate), 3) + ' km/s') + g2('预计到达', rate < -1e-6 ? fdur(surfT / -rate) : '—') + (tb.info ? '' : g2('半径', nf(tb.R) + ' km')) +
      (tb.info ? tb.info.map(function (r) { return g2(r[0], r[1], 'x2'); }).join('') + (tb.comet ? g2('此刻日心距离', (tb.rau || 0).toFixed(2) + ' AU', 'x2') : '') + g2('光行时', fdur(dT / C), 'x2') :
      g2('质量', sig(tb.GM / G, 3).replace(/e(\d+)/, '×10^$1') + ' kg', 'x2') + g2('表面重力', sig(tb.GM / (tb.R * tb.R) * 1000, 3) + ' m/s²', 'x2') + g2('平均温度', tb.temp + ' °C', 'x2') + g2('光行时', fdur(dT / C), 'x2'));
    if (H.tbId !== tb.id) { H.tbId = tb.id; var tbe = $('#xc-tb', root); tbe.textContent = sd && sd.blurb ? sd.blurb : (tb.comet ? '彗尾为示意:离子尾背向太阳、尘埃尾背日并向轨道后方弯曲,长度随日距变化;远离太阳(>4 AU)时彗核冻结、没有彗尾。' : tb.parent ? (tb.parent === 'jupiter' ? '位置按 astronomy-engine 伽利略卫星理论实时推算' : '位置按 JPL 平均轨道根数实时推算') + ';与母星同一尺度绘制。' : '');
      if (tb.ex && window.SHXE && SHXE.ex[tb.ex]) { var xa = el('a', '', ' 讲解 ›'); xa.style.cssText = 'cursor:pointer;color:#f0c97a;pointer-events:auto;white-space:nowrap'; xa.onclick = function () { SHXE.show(tb.ex, 1); }; tbe.appendChild(xa); } }
    $('#xc-al', root).classList.toggle('on', S.align); $('#xc-ap', root).classList.toggle('on', S.auto);
    $('#xc-cn', root).textContent = tb.zh; $('#xc-cs', root).textContent = fkm(dT) + ' · ETA ' + (rate < -1e-6 ? fdur(surfT / -rate) : '—');
    B.forEach(function (b) { b.li.querySelector('.ds').textContent = fkm(b.dist); b.li.classList.toggle('on', b.id === S.target); if (b.lb.style.display !== 'none') b.lb.querySelector('i').textContent = (b.id === S.target ? fkm(b.dist) : fkmL(b.dist)) + (b.dso && b.fix && b.fix[2] * AU > 9.4607e13 ? ' · 距地球 ' + fkmL(b.fix[2] * AU) : ''); });   // C2.7c:深空航点同时标距地球(抵达后「距此」只剩约 3 倍半径)
    // 表盘(对数刻度)
    var lg = function (v, a, b) { return (Math.log10(Math.max(v, Math.pow(10, a))) - a) / (b - a); };
    setG('xc-g1', lg(S.base, -1, 5), sig(S.base, 3), '速度 · 等效 ' + (veff / C >= 0.01 ? sig(veff / C, 2) + 'c' : sig(veff, 3) + ' km/s'));
    setG('xc-g2', lg(nd, 1, 10), fkmS(nd), '高度 · ' + near.zh, nd < 1e6 ? 'km' : 'AU');
    setG('xc-g3', lg(surfT, 1, 10), fkmS(dT), '距目标 · ' + tb.zh, dT < 1e6 ? 'km' : 'AU');
    setG('xc-g4', lg(S.mult * (S.auto ? 1 : S.boost), 0, 6), '×' + sig(S.mult * (S.auto ? 1 : S.boost), 2), S.auto ? '倍率 · 自动驾驶' : '倍率 · [ ] 调节');
    drawStrip();
  }
  /* C2.2c 非目标标签用短距离:远看只留两三位有效数字 */
  function fkmL(km) { if (km < 1e5) return nf(km) + ' km'; if (km < 1e6) return Math.round(km / 1e4) + ' 万 km'; var au = km / AU; if (au < 1e4) return (au < 10 ? au.toFixed(1) : nf(Math.round(au))) + ' AU'; var ly = km / 9.4607e12; return (ly < 10 ? ly.toFixed(2) : ly < 1000 ? ly.toFixed(1) : nf(Math.round(ly))) + ' 光年'; }
  function fkmS(km) { if (km < 1e5) return nf(km); if (km < 1e6) return nf(km / 1e3) + 'k'; return (km / AU).toFixed(km < 10 * AU ? 3 : 1); }
  function kv(k, v, u) { return '<div class="kv"><span>' + k + '</span><b>' + v + (u ? '<i>' + u + '</i>' : '') + '</b></div>'; }
  function g2(k, v, c) { return '<div' + (c ? ' class="' + c + '"' : '') + '><span>' + k + '</span><b>' + v + '</b></div>'; }
  function hdgPitchRoll() {
    var f = fwd, hd = (Math.atan2(-f.z, f.x) * 180 / Math.PI + 360) % 360, pt = Math.asin(Math.max(-1, Math.min(1, f.y))) * 180 / Math.PI;
    var u = new T.Vector3(0, 1, 0).applyQuaternion(S.q), r = new T.Vector3(1, 0, 0).applyQuaternion(S.q), rl = Math.atan2(r.y, u.y) * 180 / Math.PI;
    return [hd, pt, -rl];
  }
  function drawArc(W) {
    var cv = H.arc || (H.arc = $('#xc-arc', root)), g = cv.getContext('2d'), w = cv.width, h = cv.height, cx = w / 2, R = 520, cy = R + 22;
    g.clearRect(0, 0, w, h); g.strokeStyle = 'rgba(220,230,245,.55)'; g.fillStyle = 'rgba(220,230,245,.6)'; g.lineWidth = 1; g.font = '10px ui-monospace,monospace'; g.textAlign = 'center';
    var span = 150 * Math.PI / 180, a0 = -Math.PI / 2 - span / 2 * 0.62;
    g.beginPath(); g.arc(cx, cy, R, -Math.PI / 2 - .3, -Math.PI / 2 + .3); g.stroke();
    var map = function (deg) { return -Math.PI / 2 + deg / 150 * 0.3; };
    for (var d = -150; d <= 150; d += 10) { var a = map(d), l = d % 30 === 0 ? 9 : 4; g.beginPath(); g.moveTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); g.lineTo(cx + Math.cos(a) * (R + l), cy + Math.sin(a) * (R + l)); g.stroke(); if (d % 30 === 0 && d) { g.save(); g.translate(cx + Math.cos(a) * (R - 12), cy + Math.sin(a) * (R - 12)); g.rotate(a + Math.PI / 2); g.fillText((d < 0 ? 'L' : 'R') + Math.abs(d), 0, 0); g.restore(); } }
    g.fillStyle = '#fff'; g.beginPath(); g.moveTo(cx, 6); g.lineTo(cx - 5, 0); g.lineTo(cx + 5, 0); g.fill();
    // 天体方位(相对机头的水平偏角)
    var inv = S.q.clone().invert();
    B.forEach(function (b) {
      var v = tmpV.set(b.g.position.x, b.g.position.y, b.g.position.z).sub(cam.position).applyQuaternion(inv), az = Math.atan2(v.x, -v.z) * 180 / Math.PI, el = Math.atan2(v.y, Math.hypot(v.x, v.z)) * 180 / Math.PI;
      if (Math.abs(az) > 150 || (b.parent && b.id !== S.target)) return; var a = map(az), x = cx + Math.cos(a) * R, y = cy + Math.sin(a) * R;
      g.fillStyle = b.col; g.strokeStyle = b.id === S.target ? '#7fd6ff' : 'rgba(0,0,0,0)'; g.beginPath(); g.arc(x, y - 1, b.id === S.target ? 4.5 : 3, 0, 7); g.fill(); g.stroke();
      if (b.id === S.target || b.id === 'sun' || Math.abs(az) < 60) { g.fillStyle = 'rgba(230,236,248,.8)'; g.fillText(b.zh, x, y - 10); g.fillStyle = 'rgba(200,212,235,.5)'; g.fillText((el >= 0 ? '▲' : '▼') + Math.abs(el).toFixed(0) + '°', x, y + 12); }
    });
    var hp = hdgPitchRoll();
    var hd = H.hdg || (H.hdg = $('#xc-hdg', root)); hd.innerHTML = '航向<b>' + hp[0].toFixed(0) + '°</b>俯仰<b>' + (hp[1] >= 0 ? '+' : '−') + Math.abs(hp[1]).toFixed(1) + '°</b>滚转<b>' + (hp[2] >= 0 ? '+' : '−') + Math.abs(hp[2]).toFixed(0) + '°</b>';
  }
  function drawStrip() {
    var cv = H.strip || (H.strip = $('#xc-strip', root)), g = cv.getContext('2d'), w = cv.width, h = cv.height;
    g.clearRect(0, 0, w, h); var tgS = BY[S.target] || {}, HI = BY.sun.dist / AU > 2500 || tgS.star ? 3e6 : BY.sun.dist / AU > 45 || tgS.fix ? 3000 : 50;   // C1.8b 群星:延伸到约 47 光年   // C1.8 出太阳系时刻度延伸到 3,000 AU
    var lx = function (au) { return 30 + (Math.log10(Math.min(HI, Math.max(au, .2))) - Math.log10(.2)) / (Math.log10(HI) - Math.log10(.2)) * (w - 60); };
    g.strokeStyle = 'rgba(200,215,240,.35)'; g.beginPath(); g.moveTo(20, 40); g.lineTo(w - 20, 40); g.stroke();
    for (var a = .2; a < HI; a *= HI > 3000 ? 1.6 : HI > 50 ? 1.25 : 1.12) { var x = lx(a); g.beginPath(); g.moveTo(x, 37); g.lineTo(x, 43); g.stroke(); }
    g.font = '18px "Noto Sans SC",sans-serif'; g.textAlign = 'center';
    B.forEach(function (b) { if (b.off || b.id === 'sun' || b.id === 'moon' || b.parent || (b.fix && HI <= 50) || (b.star && HI <= 3000) || (HI > 3000 && !b.fix && b.id !== 'earth')) return; var r = Math.hypot(b.wp[0] - BY.sun.wp[0], b.wp[1] - BY.sun.wp[1], b.wp[2] - BY.sun.wp[2]) / AU, x = lx(r); g.fillStyle = b.col; g.beginPath(); g.arc(x, 40, b.id === S.target ? 7 : 5, 0, 7); g.fill(); g.fillStyle = b.id === S.target ? '#7fd6ff' : 'rgba(210,220,238,.7)'; g.fillText(b.zh, x, 72); });
    var me = lx(BY.sun.dist / AU); g.fillStyle = '#fff'; g.beginPath(); g.moveTo(me, 30); g.lineTo(me - 7, 16); g.lineTo(me + 7, 16); g.fill(); g.font = '16px sans-serif'; g.fillText('你', me, 12);
  }

  /* ---------------- 开/关 ---------------- */
  /* C2.7-AUDIT ① 星空标签资料卡:只看资料;要改目标须点卡里「锁定为目标」(不出发,出发仍走锚点卡 / 航图 / Enter) */
  function lblCard(b, l) {
    if (!root) return;
    var old = document.getElementById('xs-lcard'); if (old) { old.remove(); if (old._id === b.id) return; }
    var f = window.SHXI && SHXI.facts(b.id), rows = f ? f.rows.slice(0, 4) : [];
    var c = el('div', 'xs-card', '<h4><span>' + b.zh + ' <small>' + ((f && f.en) || b.en || '') + '</small></span><button class="xc" type="button" aria-label="关闭">×</button></h4>' +
      '<div class="lc-t">' + ((f && f.type) || b.type || '') + (S.target === b.id ? ' · 当前目标' : '') + '</div>' +
      rows.map(function (r) { return '<div class="lc-r"><span>' + r[0] + '</span><b>' + r[1] + '</b></div>'; }).join('') +
      (f && f.blurb ? '<div class="lc-b">' + f.blurb + '</div>' : '') +
      (f ? '<div class="lc-n">' + f.nature + ' · ' + f.src + '</div>' : '') +
      '<div class="lc-a">' + (S.target === b.id ? '' : '<button type="button" class="lc-lock">锁定为目标</button>') + '</div>');
    c.id = 'xs-lcard'; c._id = b.id; c.setAttribute('role', 'dialog'); c.setAttribute('aria-label', b.zh + ' 资料');
    c.querySelector('.xc').onclick = function () { c.remove(); };
    var lk = c.querySelector('.lc-lock'); if (lk) lk.onclick = function () { c.remove(); setTarget(b.id, '星空标签'); };
    root.appendChild(c);
    var r = l.getBoundingClientRect(), W = innerWidth, H = innerHeight, cw = c.offsetWidth, ch = c.offsetHeight;
    c.style.left = Math.max(8, Math.min(W - cw - 8, r.left + 14)) + 'px'; c.style.top = Math.max(8, Math.min(H - ch - 8, r.bottom + 8)) + 'px';
  }
  function build() {
    T = window.THREE; tmpV = new T.Vector3(); tmpQ = new T.Quaternion();
    css(); buildHud();
    var cv = makeRd();
    cam = new T.PerspectiveCamera(60, 1, 1, 1e7); cam0 = new T.PerspectiveCamera(60, 1, 0.1, 5000); camO = new T.PerspectiveCamera(60, 1, 1e3, 2e11);
    sSky = new T.Scene(); sOrb = new T.Scene(); sMain = new T.Scene(); sDust = new T.Scene();
    // C2.7b:星空球照旧用 SHFX3D.skyMesh —— 贴图与 1.0 场景共用同一份(1.0 首页启动时 upgradeSkies 已在下载/已下好),
    // 另起带进度的 fetch 会在无缓存头的服务器上重复下载 6 MB。登舰门以贴图 ready(已解码上传)为准:已就绪立即记 ok。
    if (window.SHFX3D && SHFX3D.skyMesh) {
      K.skyG = SHFX3D.skyMesh(rd, 1000, 0x9aa0ae); sSky.add(K.skyG);
      var skyT = SHFX3D.skyTexture && SHFX3D.skyTexture(rd);
      if (window.SHXLD && skyT) {
        var big = /8k/.test(SHXLD.skyUrl(rd)); SHXLD.add('sky', { grp: 'vis', label: '星空', est: big ? 6.1e6 : 1.55e6 });
        if (skyT.image) SHXLD.set('sky', 'ok'); else { SHXLD.get('sky').st = 'load'; (skyT.ready || Promise.resolve()).then(function () { SHXLD.set('sky', 'ok'); }); }
      }
    }
    sOrb.add(orbits());
    ephem(true); B.forEach(function (b) { sMain.add(body3d(b)); });
    dust = dustField(); if (dust.N) sDust.add(dust.m);
    buildFx();
    K.built = true;
  }
  /* C2.2a 侧舷窗偶发全黑 —— 根因:WebGL 上下文预算耗尽。页面里同时存活的上下文(1.0 舞台、开场、三处只探测不释放的 probe、
   * Armilla、侧舷窗独立 renderer、讲解卡小窗……)超过浏览器上限(手机常见 8、桌面 16)时,浏览器强制丢失「最旧」的上下文,
   * 驾驶舱主画布正是较早创建的那个;首次进侧舷窗会再新建一个 renderer,正好成为压垮它的那一个,且这种丢失不会自动恢复。
   * 修法:侧舷窗改由主 renderer 画(不再新建上下文)、probe 用完立即释放、开场结束释放、小窗关闭释放;
   * 主 renderer 监听丢失:可恢复就等 restored,2.5 s 内没恢复就换新画布重建;尺寸为 0 不渲染;全黑采样自愈。 */
  function makeRd() {
    var cv = el('canvas', 'gl'), old = rd && rd.domElement;
    if (old && old.parentNode) old.parentNode.replaceChild(cv, old); else root.insertBefore(cv, root.firstChild);
    rd = new T.WebGLRenderer({ canvas: cv, antialias: true, powerPreference: 'high-performance' });
    rd.setPixelRatio(Math.min(window.devicePixelRatio || 1, Math.min(screen.width, screen.height) < 700 ? 1.5 : 3)); rd.outputEncoding = T.sRGBEncoding;   // C2.1:手机像素比 ≤1.5
    cv.addEventListener('webglcontextlost', function (e) {
      e.preventDefault(); if (cv !== rd.domElement) return; K.lost = true; K.nLost = (K.nLost || 0) + 1; clearTimeout(K.lostT);
      K.lostT = setTimeout(function () { if (K.lost && cv === rd.domElement) rebuildRd(); }, 2500);
    }, false);
    cv.addEventListener('webglcontextrestored', function () { if (cv !== rd.domElement) return; K.lost = false; clearTimeout(K.lostT); K.nRest = (K.nRest || 0) + 1; if (window.SHXFX && SHXFX.reset) SHXFX.reset(); size(); }, false);
    bindInput(cv); return cv;
  }
  function rebuildRd() {   // 被浏览器强制回收的上下文不会再 restored:换新画布、新 renderer;纹理/几何体由 three 按需重新上传
    var o = rd; try { o.dispose(); } catch (e) { }
    try { makeRd(); } catch (e) { console.warn('[SHXC rebuild]', e); K.lostT = setTimeout(rebuildRd, 4000); return; }
    K.lost = false; K.nRebuild = (K.nRebuild || 0) + 1; if (window.SHXFX && SHXFX.reset) SHXFX.reset(); size();
    if (K.skyG) K.skyG.traverse(function (n) { var m = n.material; if (m && m.map) m.map.needsUpdate = !!m.map.image; });
    emit('renderer', rd);
  }
  function size() { if (!rd) return; var w = root.clientWidth, h = root.clientHeight; if (w < 2 || h < 2) return; rd.setSize(w, h, false); }
  function checkCtx() { if (!rd || !K.open) return; try { var g = rd.getContext(); if (g && g.isContextLost() && !K.lost) { K.lost = true; clearTimeout(K.lostT); K.lostT = setTimeout(function () { if (K.lost) rebuildRd(); }, 2500); } } catch (e) { } size(); }
  // 全黑采样(每 3 s 读 9 个 4×4 小块,同一帧内读默认帧缓冲):连续 3 次全为 0 → 软复位(释放特效 RT、复位渲染状态、重设尺寸);再黑 → 重建 renderer
  var BK = { t: 0, n: 0, heal: 0, px: null };
  function blackCheck(t) {
    if (t - BK.t < 3000) return; BK.t = t;
    try {
      var g = rd.getContext(), w = g.drawingBufferWidth, h = g.drawingBufferHeight, mx = 0; if (w < 16 || h < 16) return;
      BK.px = BK.px || new Uint8Array(64);
      for (var i = 0; i < 9; i++) { g.readPixels(Math.floor(w * (.2 + .3 * (i % 3))), Math.floor(h * (.2 + .3 * Math.floor(i / 3))), 4, 4, g.RGBA, g.UNSIGNED_BYTE, BK.px); for (var k = 0; k < 64; k++) if ((k & 3) !== 3 && BK.px[k] > mx) mx = BK.px[k]; }
      if (mx > 0) { BK.n = 0; return; }
      if (++BK.n < 3) return; BK.n = 0; BK.heal++;
      if (BK.heal % 2) { if (window.SHXFX && SHXFX.reset) SHXFX.reset(); rd.setRenderTarget(null); if (rd.resetState) rd.resetState(); size(); }
      else rebuildRd();
    } catch (e) { }
  }
  X.open = function (o) {
    o = o || {};
    if (!window.THREE || !window.Astronomy) { if (window.LE && LE.ui && LE.ui.toast) LE.ui.toast('这台设备暂时开不了驾驶舱(需要 WebGL)'); return false; }
    try { if (!K.built) build(); } catch (e) { console.warn('[SHXC]', e); if (window.LE && LE.ui && LE.ui.toast) LE.ui.toast('驾驶舱载入失败'); return false; }
    root.style.display = 'block'; K.open = true; document.body.classList.add('shx-flying');
    size(); if (K.resume && !o.fresh) { toast('从上次结束探索的位置继续'); } else startPose(o.target || 'earth'); K.resume = false; setTarget(S.target);
    addEventListener('resize', size); document.addEventListener('visibilitychange', onVis); addEventListener('keydown', onKey, true); addEventListener('keyup', onKey, true); addEventListener('blur', onBlur); document.addEventListener('pointerup', onEndUp, true);
    last = 0; cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
    toast('驾驶舱已就位 · 拖动转视角,W/S 加减速,G 自动驾驶'); emit('open', o);
    try { var u = new URL(location.href); u.searchParams.set('view', 'fly'); history.replaceState(null, '', u.pathname + u.search); } catch (e) { }
    return true;
  };
  function onVis() { if (!document.hidden) { last = 0; checkCtx(); } }
  /* 结束探索:驾驶舱风格确认窗;Esc 只关窗/回驾驶舱,不会把人送回地球或任务页 */
  var dlg = null;
  function nearest() {
    var ok = ['sun', 'mercury', 'venus', 'earth', 'moon', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'], best = null, bd = Infinity;
    B.forEach(function (b) { if (ok.indexOf(b.id) < 0 || !b.wp) return; var d = Math.hypot(b.wp[0] - S.pos[0], b.wp[1] - S.pos[1], b.wp[2] - S.pos[2]) - (b.R || 0); if (d < bd) { bd = d; best = b; } });
    return best ? { b: best, d: Math.max(0, bd) } : null;
  }
  function confirmEnd() {
    if (window.SHXEX) { SHXEX.open(); return; }   // C2.7d:结束探索已重做为 body 层独立按钮 + 确认框(x/sh-x-exit.js)
    if (dlg && !dlg.isConnected) dlg = null; if (dlg) { root.appendChild(dlg); var pb0 = dlg.querySelector('.pri'); if (pb0) pb0.focus(); return; } var n = null; try { n = nearest(); } catch (e) { }
    var where = n ? (n.b.zh || n.b.id) + '附近 · 距离 ' + fkm(n.d) : '星际空间';
    dlg = document.createElement('div'); dlg.id = 'xe-dlg';
    dlg.innerHTML = '<div class="bx"><div class="hd">结束本次探索? <small>END EXPLORATION</small></div><p>天枢号当前位于<b>' + where + '</b>。结束后视角停在这里的太阳系,下次进入驾驶舱会从这个位置继续。</p>' +
      '<div class="ac"><button type="button" data-a="0">继续航行 <small>Esc</small></button><button type="button" class="pri" data-a="1">结束探索 <small>Enter</small></button></div></div>';
    dlg.addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) endDlg(b.getAttribute('data-a') === '1'); else if (e.target === dlg) endDlg(false); });
    root.appendChild(dlg); S.keys = {};
    if (!document.getElementById('xe-css')) { var st = document.createElement('style'); st.id = 'xe-css'; st.textContent = '#shxc>#xe-dlg{z-index:2147483000}#xe-dlg{position:absolute;inset:0;z-index:60;display:grid;place-items:center;background:rgba(1,3,10,.45);backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px)}#xe-dlg .bx{width:min(440px,90vw);padding:20px 22px 18px;border:1px solid rgba(127,214,255,.45);background:linear-gradient(180deg,rgba(12,22,40,.92),rgba(5,10,22,.94));box-shadow:0 0 30px rgba(127,214,255,.18),inset 0 0 24px rgba(127,214,255,.06);clip-path:polygon(12px 0,100% 0,100% calc(100% - 12px),calc(100% - 12px) 100%,0 100%,0 12px);color:#dfe7f5}#xe-dlg .hd{font-size:18px;letter-spacing:.12em;color:#f0c97a}#xe-dlg .hd small{display:block;font-size:10px;letter-spacing:.4em;color:#7fd6ff;margin-top:4px}#xe-dlg p{font-size:15px;line-height:1.7;margin:14px 0 18px;color:#cfd8ea}#xe-dlg p b{color:#fff;font-weight:600;margin:0 .2em}#xe-dlg .ac{display:flex;gap:12px;justify-content:flex-end}#xe-dlg button{font:inherit;font-size:15px;color:#dfe7f5;padding:9px 18px;cursor:pointer}#xe-dlg button small{font-size:11px;opacity:.6;margin-left:6px}#xe-dlg button.pri{color:#f0c97a}'; document.head.appendChild(st); }
    var pb = dlg.querySelector('.pri'); if (pb) pb.focus();
    emit('confirm', true);
  }
  function endDlg(yes) {
    if (!dlg) return; dlg.remove(); dlg = null; emit('confirm', false);
    if (yes) endExplore();
  }
  function endExplore() {
    var n = nearest(); K.resume = true;
    X.close(true);
    if (!window.SHXV) return;
    if (n && (n.b.id === 'earth' || n.b.id === 'moon') && n.d < 2e6) { SHXV.go('leo'); return; }
    SHXV.go('solar');
    if (n && window.LE && LE.solar && LE.solar.select) { var id = n.b.id === 'moon' ? 'earth' : n.b.id; setTimeout(function () { try { LE.solar.select(id); } catch (e) { } }, 700); }
  }
  X.confirmEnd = confirmEnd; X.endExplore = endExplore;
  X.close = function (quiet) {
    if (!K.open) return; K.open = false; cancelAnimationFrame(raf); root.style.display = 'none'; document.body.classList.remove('shx-flying');
    removeEventListener('resize', size); document.removeEventListener('visibilitychange', onVis); removeEventListener('blur', onBlur); document.removeEventListener('pointerup', onEndUp, true); removeEventListener('keydown', onKey, true); removeEventListener('keyup', onKey, true); S.keys = {};
    emit('close');
    if (dlg) { dlg.remove(); dlg = null; }
    if (!quiet) { K.resume = true; if (window.SHXV) SHXV.go('solar'); }
  };
  X._ = { S: S, B: B, BY: BY, AU: AU, C: C, MAXV: MAXV, toast: function (m) { toast(m); }, setTarget: function (id, src) { setTarget(id, src); }, tempStar: function (o) { return tempStar(o); }, tempDso: function (o) { return tempDso(o); }, autopilot: function (on) { autopilot(on); }, root: function () { return root; }, rd: function () { return rd; }, fdur: fdur, fkm: fkm, sky: function () { return sSky; }, orb: function () { return sOrb; }, cam: function () { return cam; }, skyG: function () { return K.skyG; }, emit: function (e, a) { emit(e, a); } };
  X.state = function () { return { pos: S.pos.slice(), target: S.target, base: S.base, mult: S.mult, auto: S.auto, sunVis: sunVis }; };
  X.health = function () { return { lost: !!K.lost, nLost: K.nLost || 0, restored: K.nRest || 0, rebuilt: K.nRebuild || 0, heal: BK.heal, w: rd ? rd.domElement.width : 0, h: rd ? rd.domElement.height : 0 }; };
  X._rebuild = function () { rebuildRd(); };
  X.setTarget = function (id, src) { if (BY[id]) setTarget(id, src); };
  X.autopilot = function (on) { autopilot(on !== false); };
})();
