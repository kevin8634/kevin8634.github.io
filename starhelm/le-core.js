/* =====================================================================
 * Live Earth 2.0 · le-core.js
 * 基础层：LE.config（常量）· LE.util（工具函数）· LE.bus（事件总线）· LE.assets（纹理加载）
 * 所有模块都挂在全局命名空间 window.LE 下，经典 <script> 顺序加载，不用 ES module。
 * ===================================================================== */
(function () {
  'use strict';
  var LE = (window.LE = window.LE || {});

  /* ----------------------------- LE.config ----------------------------- */
  LE.config = {
    VERSION: '2.0.0',
    EARTH_R: 1,                 // 地球半径 = 1 个场景单位
    EARTH_KM: 6371,
    ALT_SCALE: 1,               // 卫星高度比例（1 = 真实比例，科普准确）
    TIMEOUT: { quakes: 6000, tle: 12000, gps: 10000 },
    URL: {
      usgs: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_week.geojson',
      // 星链:OMM CSV(支持 6 位以上编号;CelesTrak 2026-07-11 起新目标不再提供 TLE)
      celestrak: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=starlink&FORMAT=CSV',
      // 天枢 Starhelm:已删除 IP 定位(GeoJS / ipapi.co)——定位默认关、只在本机计算
      geocode: 'https://geocoding-api.open-meteo.com/v1/search'
    },
    TEX: {
      earthDay: 'earth-day-2k.jpg', earthNight: 'earth-night-2k.jpg', earthBump: 'earth-topology.png',
      earthSpec: 'earth-specular-1k.jpg', earthClouds: 'earth-clouds-1k.jpg',
      sky: 'night-sky-2k.jpg', milkyway: 'milkyway-2k.jpg'
    },
    COLOR: { q1: '#ffd23f', q2: '#ff8a1f', q3: '#ff3b30', me: '#30d158', accent: '#4fd8ff', route: '#ffb340' }
  };

  /* ------------------------------ LE.util ------------------------------ */
  var DEG = Math.PI / 180;
  var U = (LE.util = {
    DEG: DEG,
    $: function (id) { return document.getElementById(id); },
    clamp: function (v, a, b) { return Math.max(a, Math.min(b, v)); },
    lerp: function (a, b, t) { return a + (b - a) * t; },
    ease: function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; },
    /** 经纬度 → 三维坐标（Y 轴朝北极，经度 0 对准 +Z 方向的贴图中心） */
    ll: function (lat, lng, r, out) {
      var phi = (90 - lat) * DEG, th = (lng + 180) * DEG;
      out = out || new THREE.Vector3();
      return out.set(-(r || 1) * Math.sin(phi) * Math.cos(th), (r || 1) * Math.cos(phi), (r || 1) * Math.sin(phi) * Math.sin(th));
    },
    /** 三维坐标 → 经纬度 */
    toLL: function (v) {
      var r = v.length();
      var lat = 90 - Math.acos(v.y / r) / DEG;
      var lng = Math.atan2(v.z, -v.x) / DEG - 180;
      if (lng < -180) lng += 360;
      return { lat: lat, lng: lng };
    },
    /** 大圆距离（km） */
    haversine: function (a, b) {
      var dLat = (b.lat - a.lat) * DEG, dLng = (b.lng - a.lng) * DEG;
      var h = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(a.lat * DEG) * Math.cos(b.lat * DEG) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
      return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(h)));
    },
    debounce: function (fn, ms) {
      var t; return function () { var a = arguments, s = this; clearTimeout(t); t = setTimeout(function () { fn.apply(s, a); }, ms); };
    },
    fetchTimeout: function (url, ms, opt) {
      var ctrl = new AbortController(); var t = setTimeout(function () { ctrl.abort(); }, ms);
      return fetch(url, Object.assign({ signal: ctrl.signal, cache: 'no-store' }, opt || {}))
        .then(function (r) { clearTimeout(t); if (!r.ok) throw new Error('HTTP ' + r.status); return r; },
              function (e) { clearTimeout(t); throw e; });
    },
    pad: function (n) { return (n < 10 ? '0' : '') + n; },
    fmtDate: function (ms, withSec) {
      var d = new Date(ms), p = U.pad;
      return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes()) + (withSec ? ':' + p(d.getSeconds()) : '');
    },
    fmtNum: function (n) { return Number(n).toLocaleString('zh-CN'); },
    fmtPop: function (p) { return p >= 1e4 ? (p / 1e4).toFixed(p >= 1e6 ? 0 : 1) + ' 万' : String(p || ''); },
    esc: function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); },
    /**
     * 模糊匹配打分：完全相同 > 前缀 > 包含 > 按顺序出现的字符（子序列）。0 = 不匹配。
     * 大小写、空格、连字符都忽略，所以 "new york" / "NewYork" / "nyc"(子序列) 都能命中。
     */
    norm: function (s) { return String(s || '').toLowerCase().replace(/[\s\-_'·.]/g, ''); },
    fuzzy: function (q, text) {
      if (!q || !text) return 0;
      var t = U.norm(text);
      if (!t) return 0;
      if (t === q) return 100;
      if (t.indexOf(q) === 0) return 80 - Math.min(10, t.length - q.length) * 0.5;
      var i = t.indexOf(q);
      if (i > 0) return 60 - Math.min(20, i);
      var j = 0, gaps = 0, last = -1;
      for (var k = 0; k < t.length && j < q.length; k++) {
        if (t[k] === q[j]) { if (last >= 0) gaps += k - last - 1; last = k; j++; }
      }
      return j === q.length ? Math.max(5, 35 - gaps) : 0;
    }
  });

  /* ---------------------------- LE.settings ---------------------------- */
  // 天枢 Starhelm 设置:只存本机 localStorage,键 gn:sh:settings(Genesis Core 约定);首次读取时迁移旧键 le.*
  var SKEY = 'gn:sh:settings', SET = null;
  function loadSet() {
    if (SET) return SET;
    try { SET = JSON.parse(localStorage.getItem(SKEY) || 'null'); } catch (e) { SET = null; }
    if (!SET) {
      SET = {};
      try {
        ['music', 'sfx'].forEach(function (k) { var v = localStorage.getItem('le.' + k); if (v !== null) SET[k] = v === '1'; });
        localStorage.setItem(SKEY, JSON.stringify(SET));
      } catch (e) { /* 隐私模式等 */ }
    }
    return SET;
  }
  LE.settings = {
    get: function (k, def) { var s = loadSet(); return s.hasOwnProperty(k) ? s[k] : def; },
    set: function (k, v) { var s = loadSet(); s[k] = v; try { localStorage.setItem(SKEY, JSON.stringify(s)); } catch (e) {} }
  };

  /* ---------------------------- LE.netcache ---------------------------- */
  // 外部实时数据的本机缓存(Cache API,缓存名 shdata-v1,不受 SW 版本清理影响)
  // 规则:缓存未过期 → 直接用,不发请求;过期 → 请求一次;失败(403/404/超时)→ 用旧缓存,并在 maxAge 内不再重试
  // 用于遵守 CelesTrak「每次更新只下载一次(约 2 小时)」的使用政策
  var DCACHE = 'shdata-v1';
  LE.netcache = {
    text: function (url, maxAgeMs, timeoutMs, validate) {
      var now = Date.now(), failKey = 'gn:sh:netfail:' + url;
      var hasCache = typeof caches !== 'undefined';
      function readCache() {
        if (!hasCache) return Promise.resolve(null);
        return caches.open(DCACHE).then(function (c) { return c.match(url); }).then(function (r) {
          if (!r) return null;
          var t = +r.headers.get('x-sh-time') || 0;
          return r.text().then(function (txt) { return { text: txt, time: t }; });
        }).catch(function () { return null; });
      }
      function lastFail() { try { return +localStorage.getItem(failKey) || 0; } catch (e) { return 0; } }
      return readCache().then(function (cached) {
        if (cached && now - cached.time < maxAgeMs) return { text: cached.text, live: true, time: cached.time, cached: true };
        if (now - lastFail() < maxAgeMs) { if (cached) return { text: cached.text, live: false, time: cached.time, cached: true }; throw new Error('recent failure, not retrying'); }
        return U.fetchTimeout(url, timeoutMs).then(function (r) { return r.text(); }).then(function (txt) {
          if (validate && !validate(txt)) throw new Error('bad data');
          if (hasCache) caches.open(DCACHE).then(function (c) { return c.put(url, new Response(txt, { headers: { 'content-type': 'text/plain; charset=utf-8', 'x-sh-time': String(Date.now()) } })); }).catch(function () {});
          try { localStorage.removeItem(failKey); } catch (e) {}
          return { text: txt, live: true, time: Date.now(), cached: false };
        }).catch(function (e) {
          try { localStorage.setItem(failKey, String(Date.now())); } catch (x) {}
          if (cached) return { text: cached.text, live: false, time: cached.time, cached: true };
          throw e;
        });
      });
    }
  };

  /* ------------------------------- LE.bus ------------------------------ */
  /* 事件一览：
   *  'location:changed' {lat,lng,name,country,source}   访客位置变化
   *  'location:status'  {state:'locating'|'ok'|'fail', text}
   *  'layer:toggle'     {id, on}                          图层开关
   *  'select'           {kind:'quake'|'sat'|'planet'|'airport', item}
   *  'mode:changed'     {mode:'earth'|'solar'}
   *  'data:quakes'      {list, live}   'data:starlink' {count, live}
   *  'route:changed'    {from, to}
   */
  var handlers = {};
  LE.bus = {
    on: function (ev, fn) { (handlers[ev] = handlers[ev] || []).push(fn); return fn; },
    off: function (ev, fn) { handlers[ev] = (handlers[ev] || []).filter(function (f) { return f !== fn; }); },
    emit: function (ev, data) {
      (handlers[ev] || []).slice().forEach(function (fn) {
        try { fn(data); } catch (e) { console.error('[LE.bus] ' + ev, e); }
      });
    }
  };

  /* ------------------------------ LE.assets ---------------------------- */
  /* 贴图加载策略（托管页面运行在无同源权限的沙盒 iframe 中，普通跨域图片会“污染”画布，WebGL 拒绝上传 → 黑球）：
   *  1) 优先用贴图包 tex-*.js 里的 data URI（不受跨域限制）；贴图包异步注入，不阻塞首屏；
   *  2) 贴图包缺失时，以 crossOrigin=anonymous 加载原图；3) 再失败则不带 crossOrigin 重试。 */
  var cache = {};
  function loadScript(src) {
    return new Promise(function (res) {
      var s = document.createElement('script'); s.src = src; s.async = true;
      s.onload = function () { res(true); }; s.onerror = function () { console.warn('[LE.assets] 贴图包加载失败', src); res(false); };
      document.head.appendChild(s);
    });
  }
  var packs = null;
  function pack(src) {
    if (!packs) packs = { earth: Promise.resolve(true), sky: Promise.resolve(true), planets: Promise.resolve(true) };
    return /^planet-/.test(src) ? packs.planets : /^milkyway/.test(src) ? packs.sky : packs.earth;
  }
  function loadImg(src, cors) {
    return new Promise(function (res) {
      var img = new Image();
      if (cors) img.crossOrigin = 'anonymous';
      img.onload = function () { res(img); };
      img.onerror = function () { res(null); };
      img.src = src;
    });
  }
  LE.assets = {
    progress: { done: 0, total: 0 },
    preload: function () { pack('earth'); pack('milkyway'); pack('planet-'); },
    image: function (src) {
      if (cache[src]) return cache[src];
      var P = LE.assets.progress; P.total++;
      cache[src] = pack(src).then(function () {
        var data = window.LE_TEX && window.LE_TEX[src];
        if (data) return loadImg(data, false);
        return loadImg(src, true).then(function (img) { return img || loadImg(src, false); });
      }).then(function (img) {
        P.done++; LE.bus.emit('assets:progress', P);
        if (!img) console.warn('[LE.assets] 加载失败', src);
        return img;
      });
      return cache[src];
    },
    /** 返回立即可用的 Texture，图片到达后自动刷新 */
    texture: function (src, srgb) {
      var tex = new THREE.Texture();
      if (srgb) tex.encoding = THREE.sRGBEncoding;
      tex.anisotropy = 4;
      tex.ready = LE.assets.image(src).then(function (img) {
        if (img) { tex.image = img; tex.needsUpdate = true; }
        return tex;
      });
      return tex;
    }
  };
})();
