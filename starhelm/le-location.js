/* =====================================================================
 * Live Earth 2.0 · le-location.js
 * LE.location：访客真实位置
 *  天枢 Starhelm:默认不定位。用户手选城市(记在本机)或点「用我的位置」才调用浏览器定位,坐标不上传
 *  城市搜索：离线城市库 window.CITIES（GeoNames，约 3,350 城，中/英/别名模糊匹配）
 *            + 在线地理编码 Open-Meteo（防抖 350ms，结果标记“在线”）
 *  地球上的“我的位置”定位针：脉冲光环 + 竖直光柱
 * ===================================================================== */
(function () {
  'use strict';
  var LE = window.LE, U = LE.util, C = LE.config, S;

  var L = (LE.location = { current: null });
  var SRC = { gps: '本机定位', manual: '手动选择' };
  L.SRC = SRC;

  /* ---------------------------- 城市库 ---------------------------- */
  // window.CITIES: [zhName, enName, countryCode, lat, lng, population, [zhAliases]]
  function city(row) { return { name: row[0] || row[1], en: row[1], country: row[2], lat: row[3], lng: row[4], pop: row[5], aka: row[6] || [] }; }
  L.cities = function () { return (window.CITIES || []).map(city); };
  var CITY_LIST = null;
  function cities() { return CITY_LIST || (CITY_LIST = L.cities()); }

  /** 最近的城市（用于给 GPS 坐标起名字） */
  L.nearestCity = function (lat, lng) {
    var best = null;
    cities().forEach(function (c) {
      var d = U.haversine({ lat: lat, lng: lng }, c);
      if (!best || d < best.d) best = { c: c, d: d };
    });
    return best;
  };

  /** 离线模糊搜索，返回前 limit 个 */
  L.searchLocal = function (q, limit) {
    q = U.norm(q); if (!q) return [];
    var out = [];
    cities().forEach(function (c) {
      var s = Math.max(U.fuzzy(q, c.name), U.fuzzy(q, c.en));
      for (var i = 0; i < c.aka.length; i++) s = Math.max(s, U.fuzzy(q, c.aka[i]) - 2);
      if (s > 0) out.push({ c: c, s: s + Math.log10(c.pop + 10) * 3 });
    });
    out.sort(function (a, b) { return b.s - a.s; });
    return out.slice(0, limit || 50).map(function (x) { return x.c; });
  };

  /** 在线地理编码（Open-Meteo，无需密钥，支持中文） */
  L.searchOnline = function (q) {
    var url = C.URL.geocode + '?name=' + encodeURIComponent(q) + '&count=10&language=zh&format=json';
    return U.fetchTimeout(url, 5000).then(function (r) { return r.json(); }).then(function (j) {
      return (j.results || []).map(function (r) {
        return { name: r.name, en: r.admin1 || '', country: r.country_code || r.country || '', lat: r.latitude, lng: r.longitude, pop: r.population || 0, online: true };
      });
    }).catch(function () { return []; });
  };

  /* ---------------------------- 定位(用户触发) ---------------------------- */
  function gps() {
    return new Promise(function (res, rej) {
      if (!navigator.geolocation) return rej(new Error('no geolocation'));
      var done = false, t = setTimeout(function () { if (!done) { done = true; rej(new Error('timeout')); } }, C.TIMEOUT.gps);
      try {
        navigator.geolocation.getCurrentPosition(function (p) {
          if (done) return; done = true; clearTimeout(t);
          res({ lat: p.coords.latitude, lng: p.coords.longitude, source: 'gps' });
        }, function (e) { if (!done) { done = true; clearTimeout(t); rej(e); } }, { enableHighAccuracy: false, timeout: C.TIMEOUT.gps, maximumAge: 600000 });
      } catch (e) { clearTimeout(t); rej(e); }
    });
  }
  /** 用我的位置:只在用户点击时调用浏览器定位;坐标只在本机计算,不上传任何服务器(天枢 Starhelm 隐私规则) */
  L.locate = function () {
    LE.bus.emit('location:status', { state: 'locating', text: '正在获取你的位置(只在本机计算)…' });
    return gps().then(function (p) {
      var nc = L.nearestCity(p.lat, p.lng);
      var name = nc && nc.d < 60 ? nc.c.name : (nc ? '靠近 ' + nc.c.name : '我的位置');
      L.set({ lat: p.lat, lng: p.lng, name: name, country: (nc && nc.c.country) || '', source: p.source });
      return true;
    }).catch(function () {
      LE.bus.emit('location:status', { state: 'fail', text: '没有获得定位授权，请搜索你的城市或在地球上点选' });
      return false;
    });
  };

  /** 启动:不自动定位。若本机记过上次手选的城市就用它,否则提示用户自己选 */
  L.restore = function () {
    var saved = LE.settings.get('home');
    if (saved && isFinite(saved.lat) && isFinite(saved.lng)) { L.set(saved, true); return true; }
    LE.bus.emit('location:status', { state: 'idle', text: '选一个城市，或点「用我的位置」（只在本机计算，不上传）' });
    return false;
  };

  /** 设定位置（任何来源都走这里） */
  L.set = function (loc, restoring) {
    L.current = loc;
    if (!restoring && loc.source === 'manual') LE.settings.set('home', { lat: loc.lat, lng: loc.lng, name: loc.name, country: loc.country, source: 'manual' });
    placePin(loc);
    LE.bus.emit('location:status', { state: 'ok', text: SRC[loc.source] || '' });
    LE.bus.emit('location:changed', loc);
  };

  /** 点击地球选点 */
  L.setFromGlobe = function (g) {
    var nc = L.nearestCity(g.lat, g.lng);
    var name = nc && nc.d < 80 ? nc.c.name : (nc ? '靠近 ' + nc.c.name + '（' + Math.round(nc.d) + ' km）' : '自选位置');
    L.set({ lat: g.lat, lng: g.lng, name: name, country: nc ? nc.c.country : '', source: 'manual' });
  };

  /* ---------------------------- 定位针 ---------------------------- */
  L.init = function () {
    S = LE.scene;
    var g = (L.pin = new THREE.Group()); g.visible = false;
    var col = new THREE.Color(C.COLOR.me);
    var beam = new THREE.Mesh(new THREE.CylinderGeometry(0.0016, 0.0016, 0.12, 8).translate(0, 0.06, 0),
      new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false }));
    var dot = new THREE.Mesh(new THREE.SphereGeometry(0.008, 16, 12), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    dot.position.y = 0.12;
    var ring = new THREE.Mesh(new THREE.RingGeometry(0.8, 1, 48).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: col, transparent: true, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
    g.add(beam, dot, ring); g.userData.ring = ring; g.userData.top = dot;
    S.earthScene.add(g);
    S.addUpdater(function (dt, now) {
      if (!g.visible) return;
      var ph = (now / 1000 * 0.6) % 1, s = 0.01 + ph * 0.06;
      ring.scale.set(s, s, s); ring.material.opacity = (1 - ph) * 0.9;
    });
  };
  function placePin(loc) {
    var g = L.pin; if (!g) return;
    var p = U.ll(loc.lat, loc.lng, 1.001);
    g.position.copy(p);
    g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), p.clone().normalize());
    g.visible = true;
  }
  /** 定位针顶端的世界坐标（UI 用来贴标签） */
  L.pinTop = function () { var v = new THREE.Vector3(); L.pin.userData.top.getWorldPosition(v); return v; };
})();
