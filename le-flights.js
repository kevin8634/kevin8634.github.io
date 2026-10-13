/* =====================================================================
 * Live Earth 2.0 · le-flights.js
 * LE.layers.flights：航线查询（示意数据，非实时航班）
 *  只选出发地 → 显示从该机场出发的航线网络；选好两地 → 单条大圆航线 + 飞行中的飞机 + 距离/时长/时差
 *  默认出发地 = 离访客最近的机场（监听 'location:changed'）
 * ===================================================================== */
(function () {
  'use strict';
  var LE = window.LE, U = LE.util, C = LE.config, S;
  LE.layers = LE.layers || {};

  var AIRPORTS = [
    ['FOC', '福州', 26.08, 119.30, 8], ['PVG', '上海浦东', 31.14, 121.80, 8], ['PEK', '北京首都', 40.08, 116.58, 8], ['CAN', '广州', 23.39, 113.30, 8],
    ['SZX', '深圳', 22.64, 113.81, 8], ['CTU', '成都', 30.31, 104.44, 8], ['XMN', '厦门', 24.54, 118.13, 8], ['HKG', '香港', 22.31, 113.91, 8],
    ['TPE', '台北桃园', 25.08, 121.23, 8], ['XIY', '西安', 34.45, 108.75, 8], ['KMG', '昆明', 25.10, 102.93, 8], ['URC', '乌鲁木齐', 43.91, 87.47, 8],
    ['HND', '东京羽田', 35.55, 139.78, 9], ['ICN', '首尔仁川', 37.46, 126.44, 9], ['SIN', '新加坡', 1.36, 103.99, 8], ['BKK', '曼谷', 13.69, 100.75, 7],
    ['KUL', '吉隆坡', 2.74, 101.70, 8], ['DEL', '新德里', 28.56, 77.10, 5.5], ['DXB', '迪拜', 25.25, 55.36, 4], ['DOH', '多哈', 25.27, 51.61, 3],
    ['IST', '伊斯坦布尔', 41.26, 28.74, 3], ['LHR', '伦敦希思罗', 51.47, -0.45, 1], ['CDG', '巴黎戴高乐', 49.01, 2.55, 2], ['FRA', '法兰克福', 50.03, 8.57, 2],
    ['AMS', '阿姆斯特丹', 52.31, 4.76, 2], ['SVO', '莫斯科', 55.97, 37.41, 3], ['JFK', '纽约肯尼迪', 40.64, -73.78, -4], ['LAX', '洛杉矶', 33.94, -118.41, -7],
    ['SFO', '旧金山', 37.62, -122.38, -7], ['YVR', '温哥华', 49.19, -123.18, -7], ['ORD', '芝加哥', 41.98, -87.90, -5], ['MEX', '墨西哥城', 19.44, -99.07, -6],
    ['GRU', '圣保罗', -23.43, -46.47, -3], ['SYD', '悉尼', -33.94, 151.18, 11], ['MEL', '墨尔本', -37.67, 144.84, 11], ['AKL', '奥克兰', -37.01, 174.79, 13],
    ['JNB', '约翰内斯堡', -26.14, 28.24, 2], ['CAI', '开罗', 30.12, 31.41, 3], ['NBO', '内罗毕', -1.32, 36.93, 3]
  ].map(function (a) { return { code: a[0], name: a[1], lat: a[2], lng: a[3], tz: a[4] }; });

  var F = (LE.layers.flights = { airports: AIRPORTS, from: null, to: null, visible: false, CRUISE_KMH: 850 });

  F.byCode = function (code) { return AIRPORTS.filter(function (a) { return a.code === code; })[0]; };
  F.nearest = function (lat, lng) {
    var best = null;
    AIRPORTS.forEach(function (a) { var d = U.haversine({ lat: lat, lng: lng }, a); if (!best || d < best.d) best = { a: a, d: d }; });
    return best && best.a;
  };
  /** 机场模糊搜索（三字码 / 中文名） */
  F.search = function (q) {
    q = U.norm(q);
    return AIRPORTS.map(function (a) {
      return { a: a, s: q ? Math.max(U.fuzzy(q, a.code) + 5, U.fuzzy(q, a.name)) : 1 };
    }).filter(function (x) { return x.s > 0; }).sort(function (x, y) { return y.s - x.s; }).map(function (x) { return x.a; });
  };

  /** 估算：巡航 850 km/h + 起降 30 分钟 */
  F.stats = function (a, b) {
    var km = U.haversine(a, b), h = km / F.CRUISE_KMH + 0.5;
    return { km: km, hours: h, tzDiff: b.tz - a.tz };
  };

  F.init = function () {
    S = LE.scene;
    F.group = new THREE.Group(); F.group.visible = false; S.earthScene.add(F.group);
    F.arcs = new THREE.Group(); F.group.add(F.arcs);
    F.mats = [];

    // 机场小点
    var pos = new Float32Array(AIRPORTS.length * 3), v = new THREE.Vector3();
    AIRPORTS.forEach(function (a, i) { U.ll(a.lat, a.lng, 1.003, v); pos.set([v.x, v.y, v.z], i * 3); });
    var g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    F.dots = new THREE.Points(g, new THREE.PointsMaterial({ color: C.COLOR.route, size: 5 * S.renderer.getPixelRatio(), sizeAttenuation: false, transparent: true, depthWrite: false }));
    F.group.add(F.dots);

    // 飞机：发光三角形
    var shape = new THREE.Shape(); shape.moveTo(0, 0.022); shape.lineTo(0.011, -0.012); shape.lineTo(0, -0.006); shape.lineTo(-0.011, -0.012); shape.closePath();
    F.plane = new THREE.Mesh(new THREE.ShapeGeometry(shape), new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide }));
    F.plane.visible = false; F.group.add(F.plane);

    S.addUpdater(function (dt, now) {
      if (!F.group.visible) return;
      var t = now / 1000;
      F.mats.forEach(function (m) { m.uniforms.uTime.value = t; });
      if (F.curve) {
        var k = (t * 0.08) % 1, p = F.curve.getPointAt(k), q = F.curve.getPointAt(Math.min(1, k + 0.01));
        F.plane.position.copy(p);
        F.plane.up.copy(p).normalize();
        F.plane.lookAt(q); F.plane.rotateX(Math.PI / 2);
      }
    });

    LE.bus.on('location:changed', function (loc) {
      if (!F.userPicked) { F.from = F.nearest(loc.lat, loc.lng); LE.bus.emit('route:changed', { from: F.from, to: F.to }); }
    });
  };

  var ARC_VS = 'varying float vT; void main(){ vT=uv.x; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }';
  var ARC_FS = 'uniform vec3 uColor; uniform float uTime,uSpeed,uOff,uBase; varying float vT; void main(){ float h=fract(uTime*uSpeed+uOff); float d=vT-h; float comet=smoothstep(-0.18,0.0,d)*smoothstep(0.012,0.0,d); float a=uBase+comet; gl_FragColor=vec4(uColor*(0.6+comet*1.6),a); }';

  function curve(a, b) {
    var va = U.ll(a.lat, a.lng, 1), vb = U.ll(b.lat, b.lng, 1);
    var ang = va.angleTo(vb), lift = 0.04 + ang * 0.16;
    var pts = [];
    for (var i = 0; i <= 64; i++) {
      var t = i / 64, d = va.clone().lerp(vb, t).normalize();
      if (ang > 3.1) d = va.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), ang * t); // 近对跖点兜底
      pts.push(d.multiplyScalar(1.004 + Math.sin(Math.PI * t) * lift));
    }
    return new THREE.CatmullRomCurve3(pts);
  }
  function arcMesh(a, b, color, width, base, speed) {
    var c = curve(a, b);
    var mat = new THREE.ShaderMaterial({
      uniforms: { uColor: { value: new THREE.Color(color) }, uTime: { value: 0 }, uSpeed: { value: speed }, uOff: { value: Math.random() }, uBase: { value: base } },
      vertexShader: ARC_VS, fragmentShader: ARC_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
    });
    F.mats.push(mat);
    var m = new THREE.Mesh(new THREE.TubeGeometry(c, 96, width, 6, false), mat);
    m.userData.curve = c;
    return m;
  }

  function clearArcs() {
    F.arcs.children.slice().forEach(function (m) { m.geometry.dispose(); m.material.dispose(); F.arcs.remove(m); });
    F.mats = []; F.curve = null; F.plane.visible = false;
  }

  /** 重新绘制：只有出发地 → 网络；两地 → 单航线 */
  F.render = function () {
    clearArcs();
    if (!F.from) return;
    if (F.to && F.to !== F.from) {
      var m = arcMesh(F.from, F.to, '#ffd27a', 0.0028, 0.35, 0.22);
      F.arcs.add(m); F.curve = m.userData.curve; F.plane.visible = true;
    } else {
      AIRPORTS.forEach(function (b) {
        if (b === F.from || U.haversine(F.from, b) < 600) return;
        F.arcs.add(arcMesh(F.from, b, C.COLOR.route, 0.0012, 0.12, 0.12 + Math.random() * 0.1));
      });
    }
  };

  F.setRoute = function (from, to, byUser) {
    if (byUser) F.userPicked = true;
    F.from = from; F.to = to; F.render();
    LE.bus.emit('route:changed', { from: from, to: to });
    if (from && to) {
      var mid = U.toLL(U.ll(from.lat, from.lng, 1).add(U.ll(to.lat, to.lng, 1)).normalize());
      S.flyToLatLng(mid.lat, mid.lng, 2.2 + U.haversine(from, to) / 9000, 2000);
    } else if (from) S.flyToLatLng(from.lat, from.lng, 3.4, 2000);
  };

  F.setVisible = function (on) { F.visible = on; if (F.group) F.group.visible = on; if (on && !F.arcs.children.length) F.render(); };
})();
