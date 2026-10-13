/* =====================================================================
 * Live Earth 2.0 · le-location.js
 * LE.location：访客真实位置
 *  顺序：① 浏览器 GPS（6 秒）→ ② IP 估算（GeoJS → ipapi.co，各 5 秒）→ ③ 失败则请访客搜索城市
 *  城市搜索：离线城市库 window.CITIES（GeoNames，约 3,350 城，中/英/别名模糊匹配）
 *            + 在线地理编码 Open-Meteo（防抖 350ms，结果标记“在线”）
 *  地球上的“我的位置”定位针：脉冲光环 + 竖直光柱
 * ===================================================================== */
(function () {
  'use strict';
  var LE = window.LE, U = LE.util, C = LE.config, S;

  var L = (LE.location = { current: null });
  var SRC = { gps: 'GPS 定位', ip: 'IP 估算（约城市级）', manual: '手动选择' };
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

  /* ---------------------------- 自动定位 ---------------------------- */
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
  function ipLookup(i) {
    var urls = C.URL.ipGeo;
    if (i >= urls.length) return Promise.reject(new Error('ip failed'));
    return U.fetchTimeout(urls[i], C.TIMEOUT.ip).then(function (r) { return r.json(); }).then(function (j) {
      var lat = parseFloat(j.latitude), lng = parseFloat(j.longitude);
      if (!isFinite(lat) || !isFinite(lng)) throw new Error('bad ip geo');
      return { lat: lat, lng: lng, cityEn: j.city || '', country: j.country_code || j.country || '', source: 'ip' };
    }).catch(function () { return ipLookup(i + 1); });
  }

  /** 自动定位：GPS → IP → 失败 */
  L.locate = function () {
    LE.bus.emit('location:status', { state: 'locating', text: '正在定位…' });
    return gps().catch(function () { return ipLookup(0); }).then(function (p) {
      var nc = L.nearestCity(p.lat, p.lng);
      var name = nc && nc.d < 60 ? nc.c.name : (p.cityEn || (nc ? '靠近 ' + nc.c.name : '我的位置'));
      L.set({ lat: p.lat, lng: p.lng, name: name, country: (nc && nc.c.country) || p.country, source: p.source });
      return true;
    }).catch(function () {
      LE.bus.emit('location:status', { state: 'fail', text: '未获取到定位，请搜索你的城市' });
      return false;
    });
  };

  /** 设定位置（任何来源都走这里） */
  L.set = function (loc) {
    L.current = loc;
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
