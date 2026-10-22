/* =====================================================================
 * 天枢 Starhelm · sh-sky.js(M1 · P1 迭代)
 *  1) 日与月:太阳直射点、月下点、月球方向(距离压缩)与月相
 *  2) 人类在轨的空间站与望远镜:天宫空间站(48274)、哈勃望远镜(20580),与 ISS 同样可点
 *  3) 过境预报:本机算未来 3 天你所在城市肉眼可见的空间站过境
 *  4) 轨道分层:导航卫星(中轨)+ 地球静止气象卫星(高轨),内置快照
 *  5) 「此刻」:一句话告诉你此刻头顶有什么
 * ===================================================================== */
(function () {
  'use strict';
  var SH = window.SH, LE = window.LE, U = LE.util, C = LE.config, $ = U.$, A = SH.astro, h = SH.h;
  var S, DEG = Math.PI / 180;
  function TNOW() { return window.SHTIME ? SHTIME.now() : new Date(); }   // v1.0-M1b:日月跟随统一时间轴
  var SKY = (SH.sky = {});

  function sprite(tex, size) { var s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false })); s.scale.set(size, size, size); return s; }
  function label(text, cls) { var d = h('div', 'le-pin-label sh-label ' + (cls || ''), U.esc(text)); ($('labels') || document.body).appendChild(d); return d; }
  function placeLabel(el, p, dx, dy, show) {
    if (!show) { el.classList.remove('is-on'); return; }
    var sp = S.toScreen(p), vis = !S.occluded(p) && !sp.behind;
    el.style.transform = 'translate(' + Math.round(sp.x + (dx || 12)) + 'px,' + Math.round(sp.y + (dy || -12)) + 'px)';
    el.classList.toggle('is-on', vis);
  }
  function pickPoint(getP, priority, run) {
    S.addPicker({ mode: 'earth', priority: priority, fn: function (ray) {
      var P = getP(); if (!P) return null;
      var d = ray.ray.distanceToPoint(P), camD = S.earthCam.position.distanceTo(P), th = 0.035 * camD * (innerWidth < 640 ? 1.8 : 1);
      if (d > th || S.occluded(P)) return null;
      return { score: 10 - d / th, run: run };
    } });
  }
  function fmtT(ms) { var d = new Date(ms); return (d.getMonth() + 1) + '月' + d.getDate() + '日 ' + U.pad(d.getHours()) + ':' + U.pad(d.getMinutes()); }
  SKY.fmtT = fmtT;

  /* ------------------------------ 1) 日与月 ------------------------------ */
  function sunTex() {
    var cv = document.createElement('canvas'); cv.width = cv.height = 64; var x = cv.getContext('2d');
    var g = x.createRadialGradient(32, 32, 2, 32, 32, 30); g.addColorStop(0, 'rgba(255,250,220,1)'); g.addColorStop(0.35, 'rgba(255,214,90,0.9)'); g.addColorStop(1, 'rgba(255,180,60,0)');
    x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(cv);
  }
  function moonTex(ph) {
    var cv = document.createElement('canvas'); cv.width = cv.height = 128; var x = cv.getContext('2d'), r = 50;
    x.translate(64, 64);
    var glow = x.createRadialGradient(0, 0, r * 0.9, 0, 0, 62); glow.addColorStop(0, 'rgba(220,226,240,0.25)'); glow.addColorStop(1, 'rgba(220,226,240,0)');
    x.fillStyle = glow; x.beginPath(); x.arc(0, 0, 62, 0, 7); x.fill();
    x.fillStyle = '#2a2e38'; x.beginPath(); x.arc(0, 0, r, 0, 7); x.fill();
    // 亮面:北半球视角,盈月右亮、亏月左亮;明暗界线是一个椭圆,宽度由被照亮比例决定
    var k = ph.k, side = ph.waxing ? 1 : -1, ex = r * Math.abs(1 - 2 * k);
    x.fillStyle = '#e9ecf2'; x.beginPath();
    x.arc(0, 0, r, -Math.PI / 2, Math.PI / 2, side < 0);
    x.ellipse(0, 0, ex, r, 0, Math.PI / 2, -Math.PI / 2, (k < 0.5) === (side > 0));
    x.fill();
    return new THREE.CanvasTexture(cv);
  }
  SKY.initSunMoon = function () {
    var g = new THREE.Group(); S.earthScene.add(g); SKY.smGroup = g;
    var sun = sprite(sunTex(), 0.09); g.add(sun);
    var moon = sprite(moonTex(A.moonPhase(TNOW())), 0.34); g.add(moon);
    var sub = new THREE.Mesh(new THREE.RingGeometry(0.012, 0.018, 24), new THREE.MeshBasicMaterial({ color: 0xdfe6f5, transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false }));
    g.add(sub);
    var lSun = label('☀ 太阳直射点', 'sh-label--sun'), lMoon = label('☾ 月球(距离已压缩)', 'sh-label--moon');
    var st = SKY.sm = { sunP: new THREE.Vector3(), moonP: new THREE.Vector3(), subP: new THREE.Vector3(), ph: null, sub: null, moonLL: null };
    var acc = 99, phAcc = 0;
    function update() {
      var now = TNOW(), s = A.sun(now), m = A.moon(now);
      var ss = A.subPoint(s.ra, s.dec, now), ml = A.subPoint(m.ra, m.dec, now);
      st.sub = ss; st.moonLL = ml; st.moonKm = m.km;
      U.ll(ss.lat, ss.lng, 1.012, st.sunP); sun.position.copy(st.sunP);
      U.ll(ml.lat, ml.lng, 4.2, st.moonP); moon.position.copy(st.moonP);
      U.ll(ml.lat, ml.lng, 1.004, st.subP); sub.position.copy(st.subP); sub.lookAt(0, 0, 0);
    }
    update(); SKY.updateSM = update;
    S.addUpdater(function (dt, nowMs, mode) {
      var on = mode === 'earth' && g.visible;
      var fast = window.SHTIME && !SHTIME.isLive();
      if ((acc += dt) > (fast ? 0.05 : 5) || st.wasFast !== fast) { acc = 0; st.wasFast = fast; update(); }
      if ((phAcc += dt) > 600) { phAcc = 0; moon.material.map.dispose(); moon.material.map = moonTex(A.moonPhase(TNOW())); }
      var camD = S.earthCam.position.length();
      sun.scale.setScalar(0.05 * Math.max(1, camD / 2.2));
      placeLabel(lSun, st.sunP, 10, -10, on && camD < 6);
      placeLabel(lMoon, st.moonP, 18, -8, on);
    });
    pickPoint(function () { return g.visible ? st.sunP : null; }, 1, function () { SKY.cardSubsolar(); });
    pickPoint(function () { return g.visible ? st.moonP : null; }, 1, function () { SKY.cardMoon(); });
  };
  SKY.cardSubsolar = function () {
    var ss = SKY.sm.sub; SH.progress.explore('subsolar');
    LE.ui.showCard({ kind: 'subsolar', color: '#ffd23f', kicker: '太阳直射点', title: '此刻太阳正对着这里',
      blurb: '站在这一点的人,中午影子几乎消失。直射点一年里在南北回归线之间来回移动——这正是四季的线索。',
      rows: [['纬度', Math.abs(ss.lat).toFixed(2) + '°' + (ss.lat >= 0 ? 'N' : 'S'), 1], ['经度', Math.abs(ss.lng).toFixed(2) + '°' + (ss.lng >= 0 ? 'E' : 'W'), 1],
             ['所在半球', ss.lat >= 0 ? '北半球' : '南半球'], ['回归线', '23.44°N ~ 23.44°S']],
      actions: SH.sunLab ? [{ label: '☀ 太阳活动观测台', fn: function () { LE.ui.closeCard && LE.ui.closeCard(); SH.sunLab.open(); } }] : [] });
  };
  SKY.cardMoon = function () {
    var ph = A.moonPhase(TNOW()), ml = SKY.sm.moonLL; SH.progress.explore('moon');
    LE.ui.showCard({ kind: 'moon', color: '#e9ecf2', kicker: '月球 · Moon', title: '今天的月亮:' + ph.name,
      blurb: '月球的方向是真实的,距离被压缩了:真实距离约是地球半径的 60 倍。月亮正下方的地面,就是此刻离月亮最近的地方。',
      rows: [['月相', ph.name + (ph.waxing ? '(渐盈)' : '(渐亏)')], ['被照亮', Math.round(ph.k * 100) + '%', 1],
             ['地月距离', U.fmtNum(Math.round(ph.km)) + ' km', 1], ['光从月球到你', (ph.km / 299792.458).toFixed(2) + ' 秒', 1],
             ['月下点', ml.lat.toFixed(1) + ', ' + ml.lng.toFixed(1), 1]],
      actions: SH.tideLab ? [{ label: '🌊 潮汐实验室', fn: function () { LE.ui.closeCard && LE.ui.closeCard(); SH.tideLab.open(); } }] : [] });
    SH.cardAsk('moon');
  };

  /* ------------------- 2) 人类在轨的空间站与望远镜 ------------------- */
  var NUMF = { MEAN_MOTION: 1, ECCENTRICITY: 1, INCLINATION: 1, RA_OF_ASC_NODE: 1, ARG_OF_PERICENTER: 1, MEAN_ANOMALY: 1, EPHEMERIS_TYPE: 1, NORAD_CAT_ID: 1, ELEMENT_SET_NO: 1, REV_AT_EPOCH: 1, BSTAR: 1, MEAN_MOTION_DOT: 1, MEAN_MOTION_DDOT: 1 };
  function ommRec(header, line) {
    var H = header.split ? header.split(',') : header, v = line.split(',');
    if (v.length !== H.length) return null;
    var o = {}; for (var k = 0; k < H.length; k++) o[H[k]] = NUMF[H[k]] ? parseFloat(v[k]) : v[k];
    try { var rec = satellite.json2satrec(o); return rec && !rec.error ? { rec: rec, name: o.OBJECT_NAME, norad: String(o.NORAD_CAT_ID), epoch: o.EPOCH } : null; } catch (e) { return null; }
  }
  SKY.ommRec = ommRec;
  function geo(rec, date, out, scale) {
    var pv = satellite.propagate(rec, date);
    if (!pv || !pv.position || !isFinite(pv.position.x)) return null;
    var g = satellite.eciToGeodetic(pv.position, satellite.gstime(date));
    var lat = satellite.degreesLat(g.latitude), lng = satellite.degreesLong(g.longitude);
    if (out) U.ll(lat, lng, 1 + g.height / C.EARTH_KM, out);
    return { lat: lat, lng: lng, alt: g.height, speed: Math.hypot(pv.velocity.x, pv.velocity.y, pv.velocity.z) };
  }
  function diamondTex(col) {
    var cv = document.createElement('canvas'); cv.width = cv.height = 128; var x = cv.getContext('2d');
    x.translate(64, 64); x.strokeStyle = col; x.lineWidth = 3; x.beginPath(); x.arc(0, 0, 40, 0, 7); x.stroke();
    x.rotate(Math.PI / 4); x.fillStyle = col; x.shadowColor = col; x.shadowBlur = 16; x.fillRect(-12, -12, 24, 24);
    return new THREE.CanvasTexture(cv);
  }
  var ORB = [
    { id: 'css', norad: '48274', color: '#ff7a7a', zh: '天宫空间站', label: '天宫空间站 CSS', kicker: '载人空间站 · 天宫',
      blurb: '天和核心舱 2021 年发射,与问天、梦天两个实验舱组成 T 字形,约 100 吨级,长期有 3 名航天员驻留。它和国际空间站一样,一直在「绕着地球坠落」。', since: '2021 年 4 月(天和核心舱)' },
    { id: 'hst', norad: '20580', color: '#b6a6ff', zh: '哈勃空间望远镜', label: '哈勃望远镜 HST', kicker: '空间望远镜 · Hubble',
      blurb: '1990 年发射,主镜直径 2.4 米,由 NASA 与 ESA 合作运行。飞到大气层之上,星光不再被空气抖动和吸收,三十多年来拍下了宇宙深处的无数星系。', since: '1990 年 4 月' }
  ];
  SKY.orbiters = {};
  SKY.initOrbiters = function () {
    var D = window.SH_ORBITS;
    ORB.forEach(function (o) {
      var st = SKY.orbiters[o.id] = { def: o, p: new THREE.Vector3(), v: new THREE.Vector3(), t: 0, ok: false, live: false, visible: true };
      var base = D && D.groups[o.id] && ommRec(D.header, D.groups[o.id][0]);
      if (base) { st.rec = base.rec; st.epoch = base.epoch; }
      st.group = new THREE.Group(); S.earthScene.add(st.group);
      st.marker = sprite(diamondTex(o.color), 0.05); st.marker.renderOrder = 5; st.group.add(st.marker);
      st.orbit = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineDashedMaterial({ color: new THREE.Color(o.color), dashSize: 0.02, gapSize: 0.014, transparent: true, opacity: 0.55, depthWrite: false }));
      st.orbit.frustumCulled = false; st.group.add(st.orbit);
      st.label = label(o.label, 'sh-label--' + o.id);
      // 实时刷新:CelesTrak 单星查询,本机缓存 2 小时(与 ISS 相同规则);失败用内置快照
      LE.netcache.text('https://celestrak.org/NORAD/elements/gp.php?CATNR=' + o.norad + '&FORMAT=CSV', 2 * 3600 * 1000, 6000, function (t) { return /^OBJECT_NAME,/.test(t); })
        .then(function (r) { var L = r.text.trim().split(/\r?\n/); var x = ommRec(L[0], L[1]); if (x) { st.rec = x.rec; st.epoch = x.epoch; st.live = r.live; drawOrbit(st); } })
        .catch(function () {});
      if (st.rec) drawOrbit(st);
      pickPoint(function () { return st.ok && st.group.visible ? st.p : null; }, 3, function () { SKY.cardOrbiter(o.id); });
    });
    var acc = 1, oacc = 0, tmp = new THREE.Vector3();
    S.addUpdater(function (dt, now, mode) {
      var refresh = (acc += dt) > 0.5; if (refresh) acc = 0;
      var orbitRe = (oacc += dt) > 20; if (orbitRe) oacc = 0;
      Object.keys(SKY.orbiters).forEach(function (k) {
        var st = SKY.orbiters[k]; if (!st.rec) return;
        var on = mode === 'earth' && st.group.visible;
        if (refresh) {
          var g = geo(st.rec, new Date(now), st.p); var g2 = g && geo(st.rec, new Date(now + 1000), tmp);
          st.ok = !!(g && g2); if (st.ok) { st.v.subVectors(tmp, st.p); st.t = now; st.lat = g.lat; st.lng = g.lng; st.alt = g.alt; st.speed = g.speed; }
          if (SKY._cardKind === k && $('card').classList.contains('is-open') && $('card-title').textContent === st.def.zh) LE.ui.setCardRows(orbRows(st).concat(k === 'css' ? [['下次可见', SKY.passText('css')]] : []));
        }
        if (orbitRe) drawOrbit(st);
        if (!st.ok) return;
        var P = tmp.copy(st.p).addScaledVector(st.v, (now - st.t) / 1000), camD = S.earthCam.position.distanceTo(P);
        st.marker.position.copy(P); st.marker.scale.setScalar(0.04 * camD * (innerWidth < 640 ? 1.3 : 1));
        placeLabel(st.label, P, 14, -12, on);
      });
    });
  };
  function drawOrbit(st) {
    var per = 2 * Math.PI / st.rec.no, pts = [], v = new THREE.Vector3(), now = Date.now();
    for (var i = 0; i <= 200; i++) if (geo(st.rec, new Date(now + (i / 200) * per * 60000), v)) pts.push(v.clone());
    st.orbit.geometry.dispose(); st.orbit.geometry = new THREE.BufferGeometry().setFromPoints(pts); st.orbit.computeLineDistances();
  }
  function orbRows(st) {
    return [['NORAD 编号', st.def.norad, 1], ['当前高度', (st.alt || 0).toFixed(0) + ' km', 1], ['速度', (st.speed || 0).toFixed(2) + ' km/s', 1],
            ['绕地一圈', (2 * Math.PI / st.rec.no).toFixed(1) + ' 分钟', 1], ['星下点', (st.lat || 0).toFixed(2) + ', ' + (st.lng || 0).toFixed(2), 1],
            ['在轨', st.def.since], ['轨道数据', st.live ? 'CelesTrak 实时' : '内置快照(' + String(st.epoch || '').slice(0, 10) + ')']];
  }
  SKY.cardOrbiter = function (id) {
    var st = SKY.orbiters[id]; if (!st || !st.ok) return;
    Object.keys(SKY.orbiters).forEach(function (k) { SKY.orbiters[k].selected = k === id; });
    SKY._cardKind = id;
    var rows = orbRows(st), pv = id === 'css' ? SKY.passText('css') : null;
    if (pv) rows.push(['下次可见', pv]);
    LE.ui.showCard({ kind: id, color: st.def.color, kicker: st.def.kicker, title: st.def.zh, blurb: st.def.blurb, rows: rows,
      actions: [{ label: '◎ 飞过去看看', fn: function () { flyOrbiter(st); } }] });
    SH.cardAsk(id); LE.audio.play('lock');
  };
  function flyOrbiter(st) {
    var fr = { up: new THREE.Vector3(), fwd: new THREE.Vector3() }, P = new THREE.Vector3();
    function live() { return P.copy(st.p).addScaledVector(st.v, (Date.now() - st.t) / 1000); }
    S.cinematic({ get: live, frame: function () { fr.up.copy(live()).normalize(); fr.fwd.copy(st.v).normalize(); return fr; }, offset: { back: 0.12, up: 0.05, side: 0.06 }, ms: 4200 });
  }

  /* ------------------------------ 3) 过境预报 ------------------------------ */
  var passCache = {};   // id -> {key, list}
  SKY.passes = function (id) {
    var L = LE.location.current; if (!L || !window.satellite) return null;
    var rec = id === 'iss' ? (LE.layers.iss && LE.layers.iss.rec) : (SKY.orbiters[id] && SKY.orbiters[id].rec);
    if (!rec) return null;
    var key = L.lat.toFixed(2) + ',' + L.lng.toFixed(2) + ',' + Math.floor(Date.now() / 6e5);
    var c = passCache[id]; if (c && c.key === key) return c.list;
    var list = A.passes(satellite, rec, L.lat, L.lng, Date.now(), 3, { step: 30, minEl: 10, max: 6 });
    passCache[id] = { key: key, list: list }; return list;
  };
  SKY.passText = function (id) {
    var L = LE.location.current; if (!L) return '先选一个城市';
    var ps = SKY.passes(id); if (!ps) return '计算中';
    if (!ps.length) return '未来 3 天看不到';
    var p = ps[0], min = Math.max(1, Math.round((p.end - p.start) / 60000));
    return fmtT(p.start) + ' · ' + A.dir8(p.azStart) + '→' + A.dir8(p.azEnd) + ' · 最高 ' + Math.round(p.maxEl) + '° · 约 ' + min + ' 分钟';
  };
  // 给原有 ISS 卡片加一行「下次可见」
  var _issRows = LE.ui.rows_iss, _issCard = LE.ui.card_iss;
  LE.ui.card_iss = function (I) { _issCard(I); LE.ui.rows_iss(I); };
  LE.ui.rows_iss = function (I) {
    _issRows(I);
    var dl = $('card-rows'); if (!dl) return;
    dl.insertAdjacentHTML('beforeend', '<dt>下次可见</dt><dd>' + U.esc(SKY.passText('iss')) + '</dd>');
  };

  /* ------------------------------ 4) 轨道分层 ------------------------------ */
  var GROUPS = {
    gps:     { zh: 'GPS 导航星座',      c: '#7fd4ff', kind: 'nav' },
    beidou:  { zh: '北斗导航星座',      c: '#ffd27f', kind: 'nav' },
    galileo: { zh: '伽利略导航星座',    c: '#9dffb0', kind: 'nav' },
    glonass: { zh: '格洛纳斯导航星座',  c: '#ff9db0', kind: 'nav' },
    geo:     { zh: '静止轨道气象卫星',  c: '#d6b3ff', kind: 'geo' }
  };
  var USE = {
    nav: '导航卫星不停地广播精确的时间。你的手机同时收到至少 4 颗卫星的信号,比较它们到达的先后,就算出了你在哪。不同的导航系统可以一起用,定位更准。',
    geo: '在约 35,786 km 高处,卫星绕地球一圈正好一天,看起来一直悬在赤道上空同一点。气象卫星在这里一刻不停地拍摄半个地球的云,天气预报里的云图就来自它们。'
  };
  var SH_ = SKY.shells = { on: false, sats: [] };
  function buildShells() {
    var D = window.SH_ORBITS; if (!D) return false;
    Object.keys(GROUPS).forEach(function (g) {
      (D.groups[g] || []).forEach(function (line) { var x = ommRec(D.header, line); if (x) SH_.sats.push({ g: g, name: x.name, norad: x.norad, rec: x.rec, epoch: x.epoch, p: new THREE.Vector3() }); });
    });
    var n = SH_.sats.length, pos = new Float32Array(n * 3), col = new Float32Array(n * 3), c = new THREE.Color();
    SH_.sats.forEach(function (s, i) { c.set(GROUPS[s.g].c); col.set([c.r, c.g, c.b], i * 3); });
    var geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
    geom.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geom.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 8);
    SH_.points = new THREE.Points(geom, new THREE.PointsMaterial({ size: 7, sizeAttenuation: false, vertexColors: true, transparent: true, opacity: 0.95, depthWrite: false }));
    SH_.group = new THREE.Group(); SH_.group.add(SH_.points); SH_.group.visible = false; S.earthScene.add(SH_.group);
    // 三个高度的参考圈(赤道面)
    var RINGS = [{ km: 550, t: '低轨 LEO · 约 550 km(星链、空间站在 400 km 左右)' }, { km: 20200, t: '中轨 MEO · 约 20,000 km(导航卫星)' }, { km: 35786, t: '高轨 GEO · 35,786 km(静止卫星)' }];
    SH_.ringLabels = [];
    RINGS.forEach(function (R) {
      var r = 1 + R.km / C.EARTH_KM, pts = [];
      for (var i = 0; i <= 128; i++) { var a = i / 128 * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r)); }
      var ln = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineDashedMaterial({ color: 0xc8d4f0, dashSize: 0.06, gapSize: 0.05, transparent: true, opacity: 0.35, depthWrite: false }));
      ln.computeLineDistances(); SH_.group.add(ln);
      SH_.ringLabels.push({ el: label(R.t, 'sh-label--ring'), p: new THREE.Vector3(r * 0.707, 0, r * 0.707) });
    });
    S.addPicker({ mode: 'earth', priority: 2, fn: function (ray) {
      if (!SH_.on) return null;
      ray.params.Points.threshold = 0.025 * Math.max(1, S.earthCam.position.length() / 3);
      var best = null;
      ray.intersectObject(SH_.points).forEach(function (hh) { var s = SH_.sats[hh.index]; if (s && (!best || hh.distanceToRay < best.d)) best = { s: s, d: hh.distanceToRay }; });
      return best && { score: 2.5 - best.d, run: function () { SKY.cardShell(best.s); } };
    } });
    var acc = 9;
    S.addUpdater(function (dt, now, mode) {
      var on = SH_.on && mode === 'earth';
      SH_.ringLabels.forEach(function (R) { placeLabel(R.el, R.p, 6, -6, on); });
      if (!on || (acc += dt) < 2) return; acc = 0;
      var arr = SH_.points.geometry.attributes.position.array, d = new Date(now);
      SH_.sats.forEach(function (s, i) { var g = geo(s.rec, d, s.p); if (g) { s.alt = g.alt; s.speed = g.speed; s.lat = g.lat; s.lng = g.lng; arr[i * 3] = s.p.x; arr[i * 3 + 1] = s.p.y; arr[i * 3 + 2] = s.p.z; } });
      SH_.points.geometry.attributes.position.needsUpdate = true;
    });
    return true;
  }
  SKY.setShells = function (on) {
    if (!SH_.points && !buildShells()) return;
    SH_.on = on; SH_.group.visible = on;
    document.querySelectorAll('[data-layer="shells"]').forEach(function (c) { c.setAttribute('aria-pressed', on ? 'true' : 'false'); });
    S.earthCtl.maxDistance = on ? 22 : 12;
    if (on) {
      SH.progress.explore('shells');
      if (S.follow) S.releaseFollow();
      S.flyTo({ position: S.earthCam.position.clone().setLength(17), target: new THREE.Vector3(), ms: 2200 });
      LE.ui.toast('拉远了:内圈是低轨,中间是导航卫星,最外圈是静止卫星。点一颗看看它为你做了什么');
    } else if (S.earthCam.position.length() > 12) {
      S.flyTo({ position: S.earthCam.position.clone().setLength(S.fitDistance()), target: new THREE.Vector3(), ms: 1600 });
    }
  };
  SKY.cardShell = function (s) {
    var G = GROUPS[s.g], per = 2 * Math.PI / s.rec.no;
    LE.ui.showCard({ kind: 'shell', color: G.c, kicker: G.zh, title: s.name, blurb: USE[G.kind],
      rows: [['NORAD 编号', s.norad, 1], ['高度', U.fmtNum(Math.round(s.alt || 0)) + ' km', 1], ['速度', (s.speed || 0).toFixed(2) + ' km/s', 1],
             ['绕地一圈', per >= 600 ? (per / 60).toFixed(1) + ' 小时' : per.toFixed(0) + ' 分钟', 1], ['轨道数据', '内置快照(' + String(s.epoch).slice(0, 10) + ')']] });
    SH.cardAsk('shell'); LE.audio.play('lock');
  };

  /* ------------------------------ 5) 此刻 ------------------------------ */
  var NOW = {};
  function buildNow() {
    var b = h('button', 'sh-now le-earth-only'); b.type = 'button'; b.id = 'sh-now';
    b.innerHTML = '<span class="sh-now__k">此刻</span><span class="sh-now__t">选一个城市,看看你头顶有什么</span><span class="sh-now__go">›</span>';
    document.body.appendChild(b); NOW.btn = b; NOW.t = b.querySelector('.sh-now__t');
    var sh = h('section', 'le-hud sh-panel sh-nowsheet'); sh.id = 'sh-nowsheet'; sh.hidden = true;
    sh.innerHTML = '<div class="le-sheet__head"><h2>此刻 <small>NOW</small></h2><button class="le-close" type="button" aria-label="关闭">×</button></div><div class="sh-nowsheet__body"></div>';
    document.body.appendChild(sh); NOW.sheet = sh; NOW.body = sh.querySelector('.sh-nowsheet__body');
    sh.querySelector('.le-close').addEventListener('click', function () { sh.hidden = true; document.body.classList.remove('sh-side'); });
    b.addEventListener('click', function () {
      if (!LE.location.current) { LE.ui.openSheet('sheet-loc'); setTimeout(function () { $('loc-q').focus(); }, 200); return; }
      if (sh.hidden) { SH.closeTasks(); LE.ui.closeSheets(); drawSheet(); sh.hidden = false; document.body.classList.add('sh-side'); SH.progress.explore('pass'); } else { sh.hidden = true; document.body.classList.remove('sh-side'); }
    });
  }
  function issDist(L) { var I = LE.layers.iss; if (!I || !I.ok) return null; return U.haversine({ lat: L.lat, lng: L.lng }, { lat: I.lat, lng: I.lng }); }
  SKY.nowLine = function () {
    var L = LE.location.current; if (!L) return null;
    var day = LE.earth.isDay(L.lat, L.lng), parts = [L.name + (day ? ' ☀ 白天' : ' 🌙 夜晚')];
    var SL = LE.layers.starlink; if (SL.sats.length) parts.push('头顶 1000 km 内 ' + SL.overhead(L.lat, L.lng, 1000) + ' 颗星链');
    var d = issDist(L); if (d != null) parts.push('空间站距你 ' + U.fmtNum(Math.round(d)) + ' km');
    return parts.join(' · ');
  };
  function drawSheet() {
    var L = LE.location.current; if (!L) return;
    var now = TNOW(), el = A.sunElevation(L.lat, L.lng, now), ph = A.moonPhase(now), ss = SKY.sm && SKY.sm.sub;
    var rows = [
      ['你在', L.name + (L.country ? ',' + L.country : '')],
      ['太阳高度', el.toFixed(1) + '°' + (el > 0 ? '(白天)' : el > -6 ? '(黄昏/黎明)' : '(天黑了)')],
      ['太阳直射点', ss ? Math.abs(ss.lat).toFixed(1) + '°' + (ss.lat >= 0 ? 'N' : 'S') : '—'],
      ['月相', ph.name + ' · 照亮 ' + Math.round(ph.k * 100) + '%']
    ];
    var SL = LE.layers.starlink; if (SL.sats.length) rows.push(['头顶星链', SL.overhead(L.lat, L.lng, 1000) + ' 颗(1000 km 内)']);
    var d = issDist(L); if (d != null) rows.push(['空间站', '距你 ' + U.fmtNum(Math.round(d)) + ' km']);
    var html = '<dl class="le-dl">' + rows.map(function (r) { return '<dt>' + U.esc(r[0]) + '</dt><dd>' + U.esc(r[1]) + '</dd>'; }).join('') + '</dl>';
    html += '<h3 class="sh-h3">今晚抬头 · 肉眼可见的过境</h3>';
    [['iss', '国际空间站'], ['css', '天宫空间站']].forEach(function (x) {
      var ps = SKY.passes(x[0]);
      html += '<p class="sh-pass"><b>' + x[1] + '</b> ';
      if (!ps) html += '轨道数据加载中';
      else if (!ps.length) html += '未来 3 天在你这里看不到(太亮、太低或在地影里)';
      else html += ps.slice(0, 3).map(function (p) { return '<span>' + fmtT(p.start) + ' 从' + A.dir8(p.azStart) + '方升起,最高 ' + Math.round(p.maxEl) + '°,约 ' + Math.max(1, Math.round((p.end - p.start) / 60000)) + ' 分钟后在' + A.dir8(p.azEnd) + '方消失</span>'; }).join('');
      html += '</p>';
    });
    html += '<p class="le-hint">空间站看起来是一颗不闪烁、平稳移动的亮星。到时候放下手机,出门抬头看看。时间按你设备的时区显示,只在本机计算。</p>';
    NOW.body.innerHTML = html;
  }
  SKY.initNow = function () {
    buildNow();
    function tick() {
      var line = SKY.nowLine();
      NOW.t.textContent = line || '选一个城市,看看你头顶有什么';
      if (!NOW.sheet.hidden) drawSheet();
    }
    LE.bus.on('location:changed', function () { passCache = {}; setTimeout(tick, 300); });
    LE.bus.on('data:starlink', tick);
    setInterval(tick, 10000); setTimeout(tick, 1500);
  };

  /* ------------------------------ 初始化 ------------------------------ */
  SKY.init = function () {
    S = LE.scene;
    try { SKY.initSunMoon(); } catch (e) { console.error('[SH] 日月', e); }
    try { SKY.initOrbiters(); } catch (e) { console.error('[SH] 空间站', e); }
    try { SKY.initNow(); } catch (e) { console.error('[SH] 此刻', e); }
    // 新图层开关:日与月、天宫/哈勃、轨道分层
    var chips = $('chips');
    var after = chips.children[0];
    function chip(id, zh, en, c, on) {
      var b = h('button', 'le-chip', zh + '<small>' + en + '</small>'); b.type = 'button'; b.dataset.layer = id; b.setAttribute('aria-pressed', on ? 'true' : 'false'); b.style.setProperty('--c', c);
      chips.insertBefore(b, after.nextSibling); after = b; return b;
    }
    var cOB = chip('orbiters', '天宫·哈勃', 'CSS·HST', '#ff7a7a', true);
    var cSM = chip('sunmoon', '日与月', 'SUN·MOON', '#e9ecf2', true);
    var cSH = chip('shells', '轨道分层', 'SHELLS', '#d6b3ff', false);
    cSM.addEventListener('click', function () { var on = cSM.getAttribute('aria-pressed') !== 'true'; cSM.setAttribute('aria-pressed', on); SKY.smGroup.visible = on; });
    cOB.addEventListener('click', function () {
      var on = cOB.getAttribute('aria-pressed') !== 'true'; cOB.setAttribute('aria-pressed', on);
      Object.keys(SKY.orbiters).forEach(function (k) { SKY.orbiters[k].group.visible = on; if (!on) SKY.orbiters[k].label.classList.remove('is-on'); });
    });
    cSH.addEventListener('click', function () { SKY.setShells(cSH.getAttribute('aria-pressed') !== 'true'); });
    LE.bus.on('mode:changed', function (e) { if (e.mode !== 'earth') document.querySelectorAll('.sh-label').forEach(function (l) { l.classList.remove('is-on'); }); });
  };
})();
