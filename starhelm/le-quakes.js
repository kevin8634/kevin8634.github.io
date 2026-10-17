/* =====================================================================
 * Live Earth 2.0 · le-quakes.js
 * LE.layers.quakes：USGS 过去 7 天 M2.5+ 地震（6 秒超时 → 离线快照 window.QUAKES_FALLBACK）
 * 发光点（大小/颜色按震级）+ M5 以上脉冲环，点击打开详情卡片。
 * ===================================================================== */
(function () {
  'use strict';
  var LE = window.LE, U = LE.util, C = LE.config, S;
  LE.layers = LE.layers || {};

  var Q = (LE.layers.quakes = { list: [], live: false, visible: true });

  Q.color = function (m) { return m > 5.5 ? C.COLOR.q3 : m >= 4 ? C.COLOR.q2 : C.COLOR.q1; };

  Q.load = function () {
    return U.fetchTimeout(C.URL.usgs, C.TIMEOUT.quakes).then(function (r) { return r.json(); }).then(function (j) {
      var list = j.features.filter(function (f) { return f.geometry && f.properties && f.properties.mag != null; }).map(function (f) {
        var c = f.geometry.coordinates, p = f.properties;
        return { lng: c[0], lat: c[1], depth: c[2], mag: p.mag, place: p.place || '未知地点', time: p.time, url: p.url };
      });
      if (!list.length) throw new Error('empty');
      return { list: list, live: true };
    }).catch(function () {
      return { list: (window.QUAKES_FALLBACK || []).filter(function (q) { return q && q.mag != null; }), live: false };
    });
  };

  Q.init = function () {
    S = LE.scene;
    var group = (Q.group = new THREE.Group());
    S.earthScene.add(group);

    Q.load().then(function (d) {
      Q.list = d.list; Q.live = d.live;
      build(d.list);
      LE.bus.emit('data:quakes', d);
    });

    S.addUpdater(function (dt, now) {
      if (!group.visible || !Q.mat) return;
      Q.mat.uniforms.uTime.value = now / 1000 % 1000;
      var t = now / 1000;
      Q.rings.forEach(function (r) {
        var ph = (t * 0.5 + r.userData.off) % 1, s = 0.01 + ph * r.userData.max;
        r.scale.set(s, s, s); r.material.opacity = (1 - ph) * 0.85;
      });
      if (Q.sel) { var ph2 = (t * 1.2) % 1; Q.sel.scale.setScalar(0.03 + ph2 * 0.02); Q.sel.material.opacity = 1 - ph2; }
    });

    S.addPicker({ mode: 'earth', priority: 1, fn: function (ray) {
      if (!group.visible || !Q.points) return null;
      ray.params.Points.threshold = 0.025 * (innerWidth < 640 ? 1.6 : 1);
      var best = null;
      ray.intersectObject(Q.points).forEach(function (h) {
        var q = Q.list[h.index]; if (!q || S.occluded(h.point)) return;
        if (!best || q.mag > best.q.mag) best = { q: q, d: h.distanceToRay };
      });
      return best && { score: 2 - best.d, run: function () { Q.select(best.q); } };
    } });
  };

  function build(list) {
    var n = list.length, pos = new Float32Array(n * 3), col = new Float32Array(n * 3), size = new Float32Array(n);
    var v = new THREE.Vector3(), c = new THREE.Color();
    Q.rings = [];
    list.forEach(function (q, i) {
      U.ll(q.lat, q.lng, 1.004, v); pos.set([v.x, v.y, v.z], i * 3);
      c.set(Q.color(q.mag)); col.set([c.r, c.g, c.b], i * 3);
      size[i] = 3 + Math.pow(Math.max(q.mag - 2.5, 0), 1.4) * 2.2;
      if (q.mag >= 5) {
        var ring = new THREE.Mesh(new THREE.RingGeometry(0.86, 1, 48), new THREE.MeshBasicMaterial({ color: c.clone(), transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
        ring.position.copy(U.ll(q.lat, q.lng, 1.003)); ring.lookAt(0, 0, 0);
        ring.userData = { off: Math.random(), max: 0.02 + (q.mag - 5) * 0.025 };
        Q.rings.push(ring); Q.group.add(ring);
      }
    });
    var g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.setAttribute('size', new THREE.BufferAttribute(size, 1));
    Q.mat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uPR: { value: S.renderer.getPixelRatio() } },
      vertexShader: 'attribute float size; attribute vec3 color; varying vec3 vC; varying float vF; uniform float uPR; void main(){ vC=color; vec4 mv=modelViewMatrix*vec4(position,1.); vec3 n=normalize(position); vec3 wp=(modelMatrix*vec4(position,1.)).xyz; vF=step(0.0, dot(n, normalize(cameraPosition-wp))); gl_PointSize=size*uPR*(1.0+0.6*clamp(3.0/-mv.z-1.0,0.,2.)); gl_Position=projectionMatrix*mv; }',
      fragmentShader: 'varying vec3 vC; varying float vF; void main(){ vec2 p=gl_PointCoord-.5; float d=length(p); float a=smoothstep(.5,.0,d); float core=smoothstep(.18,.0,d); if(a<.01||vF<.5) discard; gl_FragColor=vec4(vC*(0.6+core*1.4)+core*0.4, a); }',
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
    });
    Q.points = new THREE.Points(g, Q.mat);
    Q.group.add(Q.points);
    Q.sel = new THREE.Mesh(new THREE.RingGeometry(0.8, 1, 48), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
    Q.sel.visible = false; Q.group.add(Q.sel);
  }

  Q.select = function (q) {
    Q.sel.visible = true; Q.sel.position.copy(U.ll(q.lat, q.lng, 1.004)); Q.sel.lookAt(0, 0, 0);
    LE.bus.emit('select', { kind: 'quake', item: q });
  };
  Q.unselect = function () { if (Q.sel) Q.sel.visible = false; };

  /** 离某点最近的一次地震（供“我的位置”面板使用） */
  Q.nearest = function (lat, lng) {
    var best = null;
    Q.list.forEach(function (q) { var d = U.haversine({ lat: lat, lng: lng }, q); if (!best || d < best.d) best = { q: q, d: d }; });
    return best;
  };

  Q.setVisible = function (on) { Q.visible = on; if (Q.group) Q.group.visible = on; if (!on) Q.unselect(); };
})();
