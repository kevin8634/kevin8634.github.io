/* 天枢 Starhelm · 2.0 穿梭 C1.5 · sh-x-weather.js(SHXW)地球气象监测
 * 挂在 X 页地球视图(1.0 LE.scene.earthScene)上,底部芯片栏新增「气象 WEATHER」一组,全部默认关,偏好 gn:sh:x-wx:
 *  - 环流 CIRC:三圈环流(哈得来 / 费雷尔 / 极地,地球边缘剖面)+ 信风 / 西风带 / 极地东风流动箭头带 + 极锋急流 / 副热带急流(示意)
 *  - 风场 WIND:粒子流线。实时数据开时用 Open-Meteo 当前 10 m 风(15°×20° 网格插值);关时用气候平均风带模型并标「示意」
 *  - 云图 CLOUD:NASA GIBS VIIRS(Suomi NPP)最近一天全球真彩图,亮度→透明度只留云
 *  - 气温 TEMP / 降水 RAIN:Open-Meteo 当前 2 m 气温 / 降水(CC BY 4.0),网格插值成色斑;实时数据关时不显示(不造数据)
 *  - 气旋 TC:复用 1.0 地球之眼的 GDACS 进行中热带气旋,加环形风圈与名字;能取到 GDACS 路径几何时画路径
 * 一切外部请求遵守 gn:sh:live(LE.live.on);失败安静降级,不影响其他图层。 */
(function () {
  'use strict';
  var KEY = 'gn:sh:x-wx', DEG = Math.PI / 180;
  var PREF = (function () { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } })();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(PREF)); } catch (e) { } }
  function live() { return !window.LE || !LE.live || LE.live.on; }
  function toast(t) { if (window.LE && LE.ui && LE.ui.toast) LE.ui.toast(t, 3200); }
  var W = { G: null, L: {}, grid: null, gridAt: 0, gridBusy: false, t0: performance.now() };
  var CH = [
    { id: 'circ', zh: '环流', en: 'CIRCULATION', c: '#ff9f5a' },
    { id: 'wind', zh: '风场', en: 'WIND', c: '#7fe3ff' },
    { id: 'cloud', zh: '云图', en: 'GIBS', c: '#eef4ff' },
    { id: 'temp', zh: '气温', en: 'TEMP', c: '#ff6b6b' },
    { id: 'rain', zh: '降水', en: 'RAIN', c: '#6aa8ff' },
    { id: 'tc', zh: '气旋', en: 'CYCLONE', c: '#ffd23f' }];

  function ll(lat, lng, r) { return LE.util.ll(lat, lng, r); }

  /* ---------------- 环流:流动箭头带(球面带状网格,UV.x 沿流向) ---------------- */
  var BAND_FS = [
    'varying vec2 vUv; uniform float uT, uN, uSp; uniform vec3 uC; uniform float uA;',
    'void main(){ float v=abs(vUv.y-.5)*2.; float f=fract(vUv.x*uN-uT*uSp);',
    ' float chev=smoothstep(.10,0.,abs(f-.55+v*.22))+.25*smoothstep(1.,.2,v);',
    ' float a=chev*smoothstep(1.,.6,v)*uA; gl_FragColor=vec4(uC*(.8+.6*chev),a); }'].join('\n');
  var VS_UV = 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }';
  function band(latFn, w, r, dir, col, n, sp, alpha) {
    var seg = 256, pos = [], uv = [], idx = [];
    for (var i = 0; i <= seg; i++) {
      var u = i / seg, lng = dir > 0 ? -180 + 360 * u : 180 - 360 * u, la = latFn(lng);
      [-1, 1].forEach(function (s, k) { var p = ll(la + s * w, lng, r); pos.push(p.x, p.y, p.z); uv.push(u, k); });
      if (i < seg) { var o = i * 2; idx.push(o, o + 1, o + 2, o + 1, o + 3, o + 2); }
    }
    var g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
    var m = new THREE.ShaderMaterial({ uniforms: { uT: { value: 0 }, uN: { value: n }, uSp: { value: sp }, uC: { value: new THREE.Color(col) }, uA: { value: alpha } }, vertexShader: VS_UV, fragmentShader: BAND_FS, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending });
    return new THREE.Mesh(g, m);
  }
  function label(text, sub, col) {
    var cv = document.createElement('canvas'); cv.width = 512; cv.height = 128; var x = cv.getContext('2d');
    x.font = '600 46px system-ui,"PingFang SC","Microsoft YaHei",sans-serif'; x.fillStyle = col; x.shadowColor = 'rgba(0,0,0,.85)'; x.shadowBlur = 10; x.fillText(text, 12, 58);
    x.font = '600 26px system-ui,sans-serif'; x.fillStyle = 'rgba(220,235,255,.8)'; x.fillText(sub, 14, 100);
    var t = new THREE.CanvasTexture(cv); t.anisotropy = 4;
    var s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false })); s.scale.set(.42, .105, 1); s.renderOrder = 5; return s;
  }
  /* 三圈环流剖面:贴在地球边缘、始终朝向镜头的环形面板;按屏幕上北极方向换算纬度(示意) */
  var CELL_FS = [
    'varying vec2 vUv; uniform float uT, uLimb, uRot;',
    'vec4 cell(vec2 q, float c, float w, float dir, vec3 col){',
    ' vec2 e=vec2((q.x-c)/w,(q.y-.5)/.36); float r=length(e); float ring=smoothstep(.13,0.,abs(r-1.));',
    ' float an=atan(e.y,e.x)*dir; float f=fract(an/6.2832*3.-uT*.25); float head=smoothstep(.09,0.,abs(f-.5))*smoothstep(.2,0.,abs(r-1.));',
    ' return vec4(col*(.7+head*1.4),ring*(.45+.55*head)); }',
    'void main(){ vec2 p=(vUv-.5)*2.*1.45; float r=length(p); float a=atan(p.y,p.x)-uRot;',
    ' float lat=degrees(a); if(abs(lat)>88.) discard; float h=(r/uLimb-1.03)/.2; if(h<0.||h>1.) discard;',
    ' float L=abs(lat); vec2 q=vec2(L,h); float s=lat>=0.?1.:-1.;',
    ' vec4 o=cell(q,15.,15.,1.*s,vec3(1.,.48,.25))+cell(q,45.,15.,-1.*s,vec3(.62,.72,.85))+cell(q,75.,13.,1.*s,vec3(.35,.85,1.));',
    ' float fade=smoothstep(0.,.12,h)*smoothstep(1.,.85,h); gl_FragColor=vec4(o.rgb,clamp(o.a,0.,1.)*fade*.9); }'].join('\n');
  function buildCirc() {
    var g = new THREE.Group(), bands = [];
    // 地表风带:信风(偏东风,吹向赤道)、西风带、极地东风;两半球各一条
    [1, -1].forEach(function (h) {
      bands.push(band(function () { return 14 * h; }, 2.4, 1.012, -1, '#ffb070', 30, .35, .55));
      bands.push(band(function () { return 45 * h; }, 2.4, 1.012, 1, '#9fd0ff', 26, .35, .5));
      bands.push(band(function () { return 72 * h; }, 1.8, 1.012, -1, '#a8f0ff', 16, .3, .45));
      // 急流(对流层顶附近的高空强风,画在更高一层):极锋急流蜿蜒、副热带急流较平直
      bands.push(band(function (l) { return h * (55 + 9 * Math.sin((l + (h > 0 ? 20 : 70)) * 4 * DEG) + 3 * Math.sin(l * 7 * DEG)); }, 1.5, 1.03, 1, '#ff8a2a', 40, .9, .9));
      bands.push(band(function (l) { return h * (30 + 2.5 * Math.sin((l + 40) * 3 * DEG)); }, 1.1, 1.028, 1, '#ffd27a', 34, .7, .55));
    });
    bands.forEach(function (b) { g.add(b); });
    [[14, '信风', 'Trade winds · 偏东风', '#ffc08a'], [45, '西风带', 'Westerlies', '#bfe0ff'], [72, '极地东风', 'Polar easterlies', '#c8f6ff'], [57, '极锋急流', 'Polar jet · 高空', '#ffae6a'], [30, '副热带急流', 'Subtropical jet · 高空', '#ffe2a0']].forEach(function (d) {
      [0, 120, 240].forEach(function (lng) { var s = label(d[1], d[2], d[3]); s.position.copy(ll(d[0] + 4, lng + (d[0] === 57 ? 30 : d[0] === 30 ? 60 : 0), 1.06)); g.add(s); });
    });
    var cm = new THREE.ShaderMaterial({ uniforms: { uT: { value: 0 }, uLimb: { value: 1.1 }, uRot: { value: 0 } }, vertexShader: VS_UV, fragmentShader: CELL_FS, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending });
    var cq = new THREE.Mesh(new THREE.PlaneGeometry(2.9, 2.9), cm); cq.renderOrder = 4; g.add(cq);
    var cl = [label('哈得来环流', 'Hadley cell', '#ffb08a'), label('费雷尔环流', 'Ferrel cell', '#cfe0f0'), label('极地环流', 'Polar cell', '#a8ecff')];
    cl.forEach(function (s) { s.material.depthTest = false; s.scale.set(.34, .085, 1); g.add(s); });
    g.userData = { bands: bands, cq: cq, cm: cm, cl: cl };
    return g;
  }
  function tickCirc(g, t) {
    var u = g.userData; u.bands.forEach(function (b) { b.material.uniforms.uT.value = t; }); u.cm.uniforms.uT.value = t;
    var cam = LE.scene.earthCam, d = cam.position.length(); u.cq.quaternion.copy(cam.quaternion);
    u.cm.uniforms.uLimb.value = d / Math.sqrt(Math.max(1.0001, d * d - 1));
    // 北极在屏幕上的方向 → 剖面纬度零点(赤道)放在其右侧 90°
    var n = new THREE.Vector3(0, 1, 0).applyQuaternion(cam.quaternion.clone().invert()), rot = Math.atan2(n.y, n.x) - Math.PI / 2;
    u.cm.uniforms.uRot.value = rot;
    var lim = u.cm.uniforms.uLimb.value * 1.13, right = new THREE.Vector3(1, 0, 0).applyQuaternion(cam.quaternion), up = new THREE.Vector3(0, 1, 0).applyQuaternion(cam.quaternion);
    [15, 45, 75].forEach(function (lat, i) { var a = lat * DEG + rot, s = u.cl[i]; s.position.copy(right).multiplyScalar(Math.cos(a) * lim * 1.18).addScaledVector(up, Math.sin(a) * lim * 1.18); s.center.set(0, .5); });
  }

  /* ---------------- Open-Meteo 网格(15° 纬 × 20° 经,198 点,一次请求,1 小时内复用) ---------------- */
  var LATS = [], LNGS = [];
  for (var a = -75; a <= 75; a += 15) LATS.push(a);
  for (var b = -180; b < 180; b += 20) LNGS.push(b);
  function loadGrid(cb) {
    if (W.grid && performance.now() - W.gridAt < 3.6e6) return cb(W.grid);
    if (!live()) return cb(null);
    if (W.gridBusy) { W.gridWait = (W.gridWait || []).concat(cb); return; }
    try { var c = JSON.parse(sessionStorage.getItem('gn:sh:x-wxgrid') || 'null'); if (c && Date.now() - c.at < 3.6e6) { W.grid = c; W.gridAt = performance.now(); return cb(c); } } catch (e) { }
    W.gridBusy = true; var la = [], lo = [];
    LATS.forEach(function (y) { LNGS.forEach(function (x) { la.push(y); lo.push(x); }); });
    var url = 'https://api.open-meteo.com/v1/forecast?latitude=' + la.join(',') + '&longitude=' + lo.join(',') + '&current=temperature_2m,precipitation,wind_speed_10m,wind_direction_10m&wind_speed_unit=ms&timezone=GMT';
    fetch(url).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
      W.gridBusy = false; var arr = Array.isArray(j) ? j : j ? [j] : [];
      if (arr.length !== la.length) throw new Error('grid');
      var g = { at: Date.now(), time: arr[0].current && arr[0].current.time, t: [], p: [], u: [], v: [] };
      arr.forEach(function (o) { var c = o.current || {}, sp = +c.wind_speed_10m || 0, dr = (+c.wind_direction_10m || 0) * DEG; g.t.push(+c.temperature_2m); g.p.push(+c.precipitation || 0); g.u.push(-sp * Math.sin(dr)); g.v.push(-sp * Math.cos(dr)); });
      W.grid = g; W.gridFail = false; W.gridAt = performance.now(); try { sessionStorage.setItem('gn:sh:x-wxgrid', JSON.stringify(g)); } catch (e) { }
      cb(g); (W.gridWait || []).forEach(function (f) { f(g); }); W.gridWait = [];
    }).catch(function () { W.gridBusy = false; W.gridFail = true; cb(null); (W.gridWait || []).forEach(function (f) { f(null); }); W.gridWait = []; });
  }
  function samp(arr, lat, lng) {   // 双线性(经度环绕,纬度夹在 ±75)
    var y = (Math.max(-75, Math.min(75, lat)) + 75) / 15, x = ((lng + 180) % 360 + 360) % 360 / 20;
    var y0 = Math.min(LATS.length - 2, Math.floor(y)), fy = y - y0, x0 = Math.floor(x) % LNGS.length, x1 = (x0 + 1) % LNGS.length, fx = x - Math.floor(x), n = LNGS.length;
    function A(i, j) { return arr[i * n + j]; }
    return (A(y0, x0) * (1 - fx) + A(y0, x1) * fx) * (1 - fy) + (A(y0 + 1, x0) * (1 - fx) + A(y0 + 1, x1) * fx) * fy;
  }
  /* 气候平均风带模型(示意):纬向风 u、经向风 v,m/s */
  function climo(lat, lng) {
    var L = Math.abs(lat), s = lat >= 0 ? 1 : -1, u, v;
    if (L < 30) { u = -7 * Math.sin(L / 30 * Math.PI) - 1; v = -s * 3 * Math.sin(L / 30 * Math.PI); }
    else if (L < 60) { u = 9 * Math.sin((L - 30) / 30 * Math.PI) + 1; v = s * 2.5 * Math.sin((L - 30) / 30 * Math.PI); }
    else { u = -4 * Math.sin((L - 60) / 30 * Math.PI); v = -s * 1.5 * Math.sin((L - 60) / 30 * Math.PI); }
    u += 2.5 * Math.sin(lng * 3 * DEG + lat * 5 * DEG); v += 2 * Math.cos(lng * 4 * DEG - lat * 3 * DEG);
    return [u, v];
  }

  /* ---------------- 风场粒子 ---------------- */
  function buildWind() {
    var N = matchMedia('(max-width:700px)').matches ? 1400 : 2600;
    var pos = new Float32Array(N * 6), col = new Float32Array(N * 6), P = [];
    for (var i = 0; i < N; i++) P.push(seed({}));
    function seed(p) { p.lat = Math.asin(Math.random() * 2 - 1) / DEG * .95; p.lng = Math.random() * 360 - 180; p.age = Math.random() * 6; p.life = 4 + Math.random() * 4; return p; }
    var g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    var m = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: .9, blending: THREE.AdditiveBlending, depthWrite: false }));
    m.frustumCulled = false; m.userData = { P: P, N: N, pos: pos, col: col, seed: seed };
    return m;
  }
  function tickWind(m, dt) {
    var u = m.userData, G = W.grid, sc = 0.9, tv = new THREE.Vector3();
    for (var i = 0; i < u.N; i++) {
      var p = u.P[i]; p.age += dt; if (p.age > p.life) u.seed(p);
      var uv = G ? [samp(G.u, p.lat, p.lng), samp(G.v, p.lat, p.lng)] : climo(p.lat, p.lng), sp = Math.hypot(uv[0], uv[1]);
      var cl = Math.max(.15, Math.cos(p.lat * DEG));
      p.lat += uv[1] * dt * sc * .25; p.lng += uv[0] * dt * sc * .25 / cl; if (p.lng > 180) p.lng -= 360; if (p.lng < -180) p.lng += 360;
      if (Math.abs(p.lat) > 84) u.seed(p);
      var tl = Math.min(4, .35 + sp * .18), a = ll(p.lat, p.lng, 1.009, tv), o = i * 6;
      u.pos[o] = a.x; u.pos[o + 1] = a.y; u.pos[o + 2] = a.z;
      var b2 = ll(p.lat - uv[1] * tl * .25, p.lng - uv[0] * tl * .25 / cl, 1.009, tv); u.pos[o + 3] = b2.x; u.pos[o + 4] = b2.y; u.pos[o + 5] = b2.z;
      var f = Math.sin(Math.min(1, p.age / p.life) * Math.PI), k = Math.min(1, sp / 15);
      var r = (.35 + .65 * k) * f, gg = (.75 + .25 * k) * f, bb = f;
      u.col[o] = r; u.col[o + 1] = gg; u.col[o + 2] = bb; u.col[o + 3] = 0; u.col[o + 4] = 0; u.col[o + 5] = 0;
    }
    m.geometry.attributes.position.needsUpdate = true; m.geometry.attributes.color.needsUpdate = true;
  }

  /* ---------------- 色斑图(气温 / 降水) ---------------- */
  function ramp(stops, x) { for (var i = 1; i < stops.length; i++) if (x <= stops[i][0]) { var a = stops[i - 1], b = stops[i], f = (x - a[0]) / (b[0] - a[0]); return [0, 1, 2, 3].map(function (k) { return a[1][k] + (b[1][k] - a[1][k]) * f; }); } return stops[stops.length - 1][1]; }
  var TSTOP = [[-40, [120, 60, 200, .75]], [-20, [60, 110, 255, .7]], [0, [70, 200, 255, .55]], [10, [90, 230, 160, .45]], [20, [255, 230, 90, .5]], [30, [255, 140, 50, .6]], [45, [220, 30, 60, .75]]];
  var PSTOP = [[0, [80, 140, 255, 0]], [.1, [80, 160, 255, .25]], [1, [60, 120, 255, .55]], [4, [150, 90, 255, .7]], [10, [230, 80, 220, .85]]];
  function sheet(kind, G) {
    var cv = document.createElement('canvas'); cv.width = 360; cv.height = 180; var x = cv.getContext('2d'), im = x.createImageData(360, 180);
    for (var j = 0; j < 180; j++) for (var i = 0; i < 360; i++) {
      var lat = 89.5 - j, lng = i - 179.5, v = samp(kind === 'temp' ? G.t : G.p, lat, lng), c = ramp(kind === 'temp' ? TSTOP : PSTOP, v), o = (j * 360 + i) * 4;
      var fade = Math.abs(lat) > 75 ? Math.max(0, 1 - (Math.abs(lat) - 75) / 12) : 1;
      im.data[o] = c[0]; im.data[o + 1] = c[1]; im.data[o + 2] = c[2]; im.data[o + 3] = 255 * c[3] * fade;
    }
    x.putImageData(im, 0, 0);
    var t = new THREE.CanvasTexture(cv); t.wrapS = THREE.RepeatWrapping;
    var m = new THREE.Mesh(new THREE.SphereGeometry(1.004, 128, 64), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, opacity: .8, toneMapped: false }));
    return m;
  }

  /* ---------------- GIBS 云图 ---------------- */
  function gibs(cb) {
    if (!live()) return cb(null);
    var tries = [1, 2], k = 0;
    (function go() {
      if (k >= tries.length) return cb(null);
      var d = new Date(Date.now() - tries[k++] * 864e5), ds = d.toISOString().slice(0, 10);
      var img = new Image(); img.crossOrigin = 'anonymous';
      img.onload = function () {
        try {
          var cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height; var x = cv.getContext('2d'); x.drawImage(img, 0, 0);
          var im = x.getImageData(0, 0, cv.width, cv.height), D = im.data, blank = 0;
          for (var i = 0; i < D.length; i += 4) { var r = D[i], g = D[i + 1], bb = D[i + 2], mx = Math.max(r, g, bb), mn = Math.min(r, g, bb), br = (r + g + bb) / 3, sat = mx ? (mx - mn) / mx : 0;
            if (!mx) blank++; var a = Math.max(0, Math.min(1, (br - 120) / 110)) * Math.max(0, 1 - sat * 2.2); D[i] = D[i + 1] = D[i + 2] = 255; D[i + 3] = a * 235; }
          if (blank > D.length / 4 * .45) return go();   // 当天拼图还没出全 → 再往前一天
          x.putImageData(im, 0, 0); var t = new THREE.CanvasTexture(cv); cb({ tex: t, date: ds });
        } catch (e) { cb(null); }
      };
      img.onerror = go;
      img.src = 'https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&LAYERS=VIIRS_SNPP_CorrectedReflectance_TrueColor&CRS=EPSG:4326&BBOX=-90,-180,90,180&WIDTH=2048&HEIGHT=1024&FORMAT=image/jpeg&TIME=' + ds;
    })();
  }

  /* ---------------- 热带气旋 ---------------- */
  var RING_FS = 'varying vec2 vUv; uniform float uT; uniform vec3 uC; void main(){ vec2 p=(vUv-.5)*2.; float r=length(p); if(r>1.) discard; float a=atan(p.y,p.x);' +
    ' float arm=smoothstep(.25,0.,abs(fract(a/6.2832*3.+log(r+.05)*.8-uT*.3)-.5)-.2); float ring=smoothstep(.05,0.,abs(r-.92))+smoothstep(.04,0.,abs(r-.62))*.5;' +
    ' float al=(ring*.9+arm*.35*smoothstep(1.,.3,r))*smoothstep(.08,.2,r); gl_FragColor=vec4(uC,al); }';
  function buildTC() {
    var g = new THREE.Group(), E = window.SH && SH.eye, st = E && E.storms || [];
    st.forEach(function (s) {
      var col = new THREE.Color(s.wind >= 150 ? '#ff4d6d' : s.wind >= 118 ? '#ff8a1f' : s.wind >= 62 ? '#ffd23f' : '#9fe8ff');
      var m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShaderMaterial({ uniforms: { uT: { value: 0 }, uC: { value: col } }, vertexShader: VS_UV, fragmentShader: RING_FS, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
      m.scale.setScalar(.2 + Math.min(1, s.wind / 250) * .14); m.position.copy(ll(s.lat, s.lng, 1.016)); m.lookAt(0, 0, 0); g.add(m);
      var lb = label(s.name || '热带气旋', Math.round(s.wind) + ' km/h · GDACS', '#' + col.getHexString()); lb.position.copy(ll(s.lat + 4, s.lng + 4, 1.05)); g.add(lb);
      trackOf(s, g, col);
    });
    g.userData.n = st.length; return g;
  }
  function trackOf(s, g, col) {   // GDACS 路径几何(可选):取不到就不画
    var m = /eventid=(\d+)/i.exec(s.url || ''); if (!m || !live()) return;
    var ep = /episodeid=(\d+)/i.exec(s.url || '');
    fetch('https://www.gdacs.org/gdacsapi/api/polygons/getgeometry?eventtype=TC&eventid=' + m[1] + (ep ? '&episodeid=' + ep[1] : '')).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
      if (!j || !j.features) return; var pts = [];
      j.features.forEach(function (f) { var gm = f.geometry; if (!gm) return; if (gm.type === 'LineString') gm.coordinates.forEach(function (c) { pts.push(c); }); });
      if (pts.length < 2) return;
      var v = pts.map(function (c) { return ll(c[1], c[0], 1.014); }), geo = new THREE.BufferGeometry().setFromPoints(v);
      var ln = new THREE.Line(geo, new THREE.LineDashedMaterial({ color: col, dashSize: .012, gapSize: .008, transparent: true, opacity: .9, depthWrite: false })); ln.computeLineDistances(); g.add(ln);
    }).catch(function () { });
  }

  /* ---------------- 开关 ---------------- */
  function setOn(id, on, quiet) {
    PREF[id] = !!on; save();
    var chip = document.querySelector('.xw-chip[data-wx="' + id + '"]'); if (chip) chip.setAttribute('aria-pressed', on ? 'true' : 'false');
    var L = W.L[id];
    if (!on) { if (L) L.visible = false; legend(); return; }
    if (L) { L.visible = true; legend(); return; }
    if (id === 'circ') { L = W.L.circ = buildCirc(); W.G.add(L); }
    else if (id === 'wind') { L = W.L.wind = buildWind(); W.G.add(L); loadGrid(function (g) { if (!quiet) toast(g ? '风场:Open-Meteo 当前 10 米风' : '风场:实时数据关闭或暂不可用,显示气候平均风带(示意)'); legend(); }); }
    else if (id === 'cloud') {
      if (!live()) { if (!quiet) toast('云图来自 NASA GIBS,需要先打开「实时数据」'); }
      gibs(function (r) { if (!PREF.cloud) return; if (!r) { W.cloudFail = true; legend(); if (!quiet && live()) toast('GIBS 云图暂不可用'); return; }
        var m = W.L.cloud = new THREE.Mesh(new THREE.SphereGeometry(1.008, 128, 64), new THREE.MeshBasicMaterial({ map: r.tex, transparent: true, depthWrite: false, toneMapped: false }));
        m.userData.date = r.date; W.G.add(m); legend(); });
    }
    else if (id === 'temp' || id === 'rain') {
      if (!live()) { if (!quiet) toast((id === 'temp' ? '气温' : '降水') + '来自 Open-Meteo,需要先打开「实时数据」'); }
      loadGrid(function (g) { if (!PREF[id] || W.L[id]) return; if (!g) { if (!quiet && live()) toast('Open-Meteo 暂不可用'); return; } var m = W.L[id] = sheet(id, g); W.G.add(m); legend(); });
    }
    else if (id === 'tc') {
      var E = window.SH && SH.eye;
      var mk = function () { if (!PREF.tc || W.L.tc) return; L = W.L.tc = buildTC(); W.G.add(L); if (!quiet) toast(L.userData.n ? '热带气旋:GDACS 进行中 ' + L.userData.n + ' 个' : '目前没有进行中的热带气旋(或 GDACS 暂不可用)'); legend(); };
      if (E && (E.tcOk !== undefined)) mk(); else setTimeout(mk, 4000);
    }
    legend();
  }
  function legend() {
    var mi = document.querySelector('.sh-mod[data-g="wx"] i'); if (mi) mi.textContent = CH.filter(function (c) { return PREF[c.id]; }).length + '/' + CH.length;
    var el = document.getElementById('xw-leg'), any = CH.some(function (c) { return PREF[c.id]; });
    if (!el) { el = document.createElement('div'); el.id = 'xw-leg'; document.body.appendChild(el); }
    if (!any) { el.style.display = 'none'; return; }
    var G = W.grid, rows = [];
    if (PREF.circ) rows.push('<b style="color:#ff9f5a">环流</b> 三圈环流 · 信风 / 西风带 / 极地东风 · 急流 <i>示意</i>');
    if (PREF.wind) rows.push('<b style="color:#7fe3ff">风场</b> ' + (G ? 'Open-Meteo 10 m 风 · ' + (G.time || '') + ' UTC' : '气候平均风带 <i>示意</i>'));
    if (PREF.cloud) rows.push('<b>云图</b> ' + (W.L.cloud && W.L.cloud.userData.date ? 'NASA GIBS VIIRS · ' + W.L.cloud.userData.date : (!live() ? '需开实时数据' : W.cloudFail ? '暂不可用' : '载入中…')));
    if (PREF.temp) rows.push('<b style="color:#ff6b6b">气温</b> ' + (W.L.temp ? '<span class="xw-bar t"></span> −40 … 45 °C · Open-Meteo' : (!live() ? '需开实时数据' : W.gridFail ? '暂不可用' : '载入中…')));
    if (PREF.rain) rows.push('<b style="color:#6aa8ff">降水</b> ' + (W.L.rain ? '<span class="xw-bar p"></span> 0.1 … 10 mm/h · Open-Meteo' : (!live() ? '需开实时数据' : W.gridFail ? '暂不可用' : '载入中…')));
    if (PREF.tc) rows.push('<b style="color:#ffd23f">气旋</b> GDACS 进行中热带气旋' + (W.L.tc ? ' · ' + W.L.tc.userData.n + ' 个' : ''));
    el.innerHTML = '<div class="h">气象 WEATHER</div>' + rows.map(function (r) { return '<div>' + r + '</div>'; }).join('') + '<div class="cr">Open-Meteo(CC BY 4.0)· NASA GIBS · GDACS · 网格 15°×20° 插值,只作科普示意</div>';
    el.style.display = '';
  }
  function css() {
    var s = document.createElement('style'); s.textContent =
      '.xw-sep{display:inline-flex;flex-direction:column;justify-content:center;padding:0 6px 0 14px;margin-left:6px;border-left:1px solid rgba(150,190,255,.25);color:#9fc6ff;font:600 11px/1.15 system-ui,sans-serif;letter-spacing:.08em;white-space:nowrap}.xw-sep small{font-size:8.5px;letter-spacing:.22em;opacity:.75}' +
      '#xw-leg{position:fixed;right:18px;top:334px;z-index:20;max-width:340px;padding:8px 12px;border-radius:10px;background:rgba(8,14,30,.62);border:1px solid rgba(150,190,255,.22);color:#dfe8f8;font:12px/1.6 system-ui,"PingFang SC",sans-serif;pointer-events:none;backdrop-filter:blur(6px)}' +
      '#xw-leg .h{font-weight:700;letter-spacing:.14em;color:#9fd0ff;font-size:11px}#xw-leg i{font-style:normal;color:#ffd27a;font-size:11px;border:1px solid rgba(255,210,122,.4);border-radius:6px;padding:0 4px;margin-left:2px}#xw-leg .cr{opacity:.6;font-size:10.5px;margin-top:2px}' +
      '.xw-bar{display:inline-block;width:70px;height:7px;border-radius:4px;vertical-align:middle}.xw-bar.t{background:linear-gradient(90deg,#783cc8,#3c6eff,#46c8ff,#5ae6a0,#ffe65a,#ff8c32,#dc1e3c)}.xw-bar.p{background:linear-gradient(90deg,rgba(80,160,255,.3),#3c78ff,#965aff,#e650dc)}' +
      '@media (max-width:700px){#xw-leg{top:auto;bottom:196px;left:8px;right:8px;max-width:none;font-size:10.5px;padding:6px 9px;line-height:1.45}#xw-leg .cr{display:none}}';
    document.head.appendChild(s);
  }
  function chips() {   // 仿 1.0 底部分组(sh-swind.js 的 .sh-mod):自建「气象 WEATHER」模块,与其它模块互斥展开
    var bar = document.getElementById('chips'); if (!bar || bar.querySelector('.sh-mod[data-g="wx"]')) return;
    var m = document.createElement('div'); m.className = 'sh-mod'; m.dataset.g = 'wx';
    m.innerHTML = '<button type="button" class="sh-mod__h"><b>气象</b><small>WEATHER</small><i></i></button><div class="sh-mod__in"></div>';
    bar.appendChild(m); var inn = m.querySelector('.sh-mod__in');
    CH.forEach(function (c) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'le-chip xw-chip sh-nogroup'; b.dataset.wx = c.id; b.style.setProperty('--c', c.c);
      b.setAttribute('aria-pressed', PREF[c.id] ? 'true' : 'false'); b.innerHTML = c.zh + '<small>' + c.en + '</small>';
      b.addEventListener('click', function () { setOn(c.id, !PREF[c.id]); count(); }); inn.appendChild(b);
    });
    function count() { var n = CH.filter(function (c) { return PREF[c.id]; }).length; m.querySelector('i').textContent = n + '/' + CH.length; }
    m.querySelector('.sh-mod__h').onclick = function () { bar.querySelectorAll('.sh-mod').forEach(function (x) { x.classList.toggle('is-open', x === m); }); if (LE.audio) LE.audio.play('click'); };
    bar.addEventListener('click', function (e) { var h = e.target.closest('.sh-mod__h'); if (h && !m.contains(h)) m.classList.remove('is-open'); });
    count();
  }
  function init() {
    if (W.G) return; W.G = new THREE.Group(); W.G.name = 'shx-weather'; LE.scene.earthScene.add(W.G);
    css(); (function g(n) { var bar = document.getElementById('chips'); if ((bar && bar.dataset.grouped) || n > 40) chips(); else setTimeout(function () { g(n + 1); }, 250); })(0);
    LE.scene.addUpdater(function (dt, now, mode) {
      if (mode && mode !== 'earth') return; var t = (performance.now() - W.t0) / 1000; dt = Math.min(.1, dt || .016);
      if (W.L.circ && W.L.circ.visible) tickCirc(W.L.circ, t);
      if (W.L.wind && W.L.wind.visible) tickWind(W.L.wind, dt);
      if (W.L.tc && W.L.tc.visible) W.L.tc.children.forEach(function (m) { if (m.material.uniforms && m.material.uniforms.uT) m.material.uniforms.uT.value = t; });
    });
    CH.forEach(function (c) { if (PREF[c.id]) setOn(c.id, true, true); });
  }
  (function wait(n) { if (window.LE && LE.scene && LE.scene.earthScene && LE.util && LE.scene.addUpdater && document.getElementById('chips') && window.THREE) return init(); if (n < 400) setTimeout(function () { wait(n + 1); }, 150); })(0);
  window.SHXW = { set: setOn, state: function () { return { pref: PREF, grid: !!W.grid, layers: Object.keys(W.L) }; } };
})();
