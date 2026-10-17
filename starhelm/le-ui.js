/* =====================================================================
 * Live Earth 2.0 · le-ui.js
 * LE.ui：所有 DOM 交互
 *  - combo()      可复用的“模糊搜索 + 下拉滚动列表”组件（键盘 ↑↓ Enter Esc，触屏惯性滚动）
 *  - card         通用详情卡片（地震 / 卫星 / 星球）
 *  - sheets       右侧/底部面板：我的位置、航线查询、搜索星球（同时只开一个）
 *  - HUD、图层开关、模式切换、时钟、提示条、定位针标签
 * ===================================================================== */
(function () {
  'use strict';
  var LE = window.LE, U = LE.util, $ = U.$;
  var UI = (LE.ui = {});

  /* ------------------------------ 搜索下拉组件 ------------------------------ */
  /**
   * UI.combo(input, list, {
   *   search(q) -> items           同步搜索
   *   searchAsync(q) -> Promise    可选：在线补充结果（防抖 350ms，去重后追加）
   *   key(item) -> string          去重键
   *   render(item) -> html         一行的内容
   *   pick(item)                   选中回调
   *   alwaysOpen: bool             列表常驻（星球搜索）
   *   showOnFocus: bool            聚焦即展示（空关键词也出列表）
   * })
   */
  UI.combo = function (input, list, o) {
    var items = [], active = -1, seq = 0;
    function open(on) { if (o.alwaysOpen) on = true; list.hidden = !on; input.setAttribute('aria-expanded', on ? 'true' : 'false'); }
    function draw() {
      list.innerHTML = '';
      if (!items.length) { var e = document.createElement('li'); e.className = 'is-empty'; e.textContent = input.value ? '没有匹配的结果' : '输入关键词搜索'; list.appendChild(e); return; }
      items.forEach(function (it, i) {
        var li = document.createElement('li');
        li.setAttribute('role', 'option'); li.innerHTML = o.render(it);
        if (i === active) li.className = 'is-active';
        li.addEventListener('pointerdown', function (ev) { ev.preventDefault(); });
        li.addEventListener('click', function () { choose(i); });
        list.appendChild(li);
      });
    }
    function choose(i) { var it = items[i]; if (!it) return; o.pick(it); if (!o.alwaysOpen) open(false); input.blur(); }
    var online = U.debounce(function (q, my) {
      if (!o.searchAsync || q.length < 1) return;
      o.searchAsync(q).then(function (more) {
        if (my !== seq || !more.length) return;
        var seen = {}; items.forEach(function (it) { seen[o.key(it)] = 1; });
        more.forEach(function (m) { if (!seen[o.key(m)]) items.push(m); });
        draw();
      });
    }, 350);
    function run() {
      var q = input.value.trim(); seq++;
      items = q || o.showOnFocus || o.alwaysOpen ? o.search(q).slice(0, 50) : [];
      active = items.length ? 0 : -1; draw(); open(!!(q || o.showOnFocus || o.alwaysOpen));
      online(q, seq);
    }
    input.addEventListener('input', run);
    input.addEventListener('focus', function () { if (input.value || o.showOnFocus) run(); });
    input.addEventListener('blur', function () { setTimeout(function () { open(false); }, 150); });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault(); if (!items.length) return;
        active = (active + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length; draw();
        var el = list.children[active]; if (el) el.scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'Enter') { e.preventDefault(); choose(active < 0 ? 0 : active); }
      else if (e.key === 'Escape') { open(false); input.blur(); }
    });
    if (o.alwaysOpen) run();
    return { refresh: run };
  };

  /* ------------------------------ 通用卡片 ------------------------------ */
  var card = { el: null };
  UI.showCard = function (c) {
    if (UI.closeSheets) UI.closeSheets();
    card.el = card.el || $('card'); card.kind = c.kind;
    $('card-badge').style.background = c.color || '#fff';
    $('card-badge').style.color = c.color || '#fff';
    $('card-kicker').textContent = c.kicker || '';
    $('card-title').textContent = c.title || '';
    var bl = $('card-blurb'); bl.textContent = c.blurb || ''; bl.hidden = !c.blurb;
    UI.setCardRows(c.rows || []);
    var act = $('card-actions'); act.innerHTML = '';
    (c.actions || []).forEach(function (a) {
      var b = document.createElement(a.href ? 'a' : 'button');
      b.className = 'le-btn le-btn--sm'; b.textContent = a.label;
      if (a.href) { b.href = a.href; b.target = '_blank'; b.rel = 'noopener'; } else { b.type = 'button'; b.addEventListener('click', a.fn); }
      act.appendChild(b);
    });
    card.el.classList.add('is-open');
    if (innerWidth < 640) UI.closeSheets();
  };
  UI.setCardRows = function (rows) {
    $('card-rows').innerHTML = rows.map(function (r) { return '<dt>' + U.esc(r[0]) + '</dt><dd' + (r[2] ? ' class="le-mono"' : '') + '>' + U.esc(r[1]) + '</dd>'; }).join('');
  };
  UI.closeCard = function () {
    if (!card.el) return; card.el.classList.remove('is-open');
    LE.layers.quakes.unselect(); LE.layers.starlink.unselect(); if (LE.layers.iss) LE.layers.iss.unselect();
    card.kind = null;
  };

  /* --------------------------------- 面板 --------------------------------- */
  var SHEETS = ['sheet-loc', 'sheet-route', 'sheet-planet'];
  UI.openSheet = function (id) {
    SHEETS.forEach(function (s) { $(s).hidden = s !== id; });
    if (innerWidth < 640) UI.closeCard();
  };
  UI.closeSheets = function () { SHEETS.forEach(function (s) { $(s).hidden = true; }); pickMode(false); };
  UI.toggleSheet = function (id) { if ($(id).hidden) UI.openSheet(id); else UI.closeSheets(); };

  var toastT;
  UI.toast = function (text, ms) {
    var t = $('toast'); t.textContent = text; t.classList.add('is-on');
    clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove('is-on'); }, ms || 2600);
  };

  /* ------------------------------ 位置选点模式 ------------------------------ */
  var picking = false;
  function pickMode(on) { picking = on; var b = $('loc-pick'); if (b) b.setAttribute('aria-pressed', on ? 'true' : 'false'); if (on) UI.toast('点地球上任意一点，设为你的位置'); }

  /* ------------------------------ 初始化 ------------------------------ */
  UI.init = function () {
    var S = LE.scene, Q = LE.layers.quakes, SL = LE.layers.starlink, F = LE.layers.flights, L = LE.location, SO = LE.solar;

    // 时钟：访客本地时区
    var tzName = (Intl.DateTimeFormat().resolvedOptions().timeZone || '').replace('_', ' ');
    var off = -new Date().getTimezoneOffset() / 60;
    $('tz').textContent = (tzName ? tzName + ' · ' : '') + 'UTC' + (off >= 0 ? '+' : '') + off;
    function tick() { var d = new Date(); $('clock').textContent = U.pad(d.getHours()) + ':' + U.pad(d.getMinutes()) + ':' + U.pad(d.getSeconds()); }
    tick(); setInterval(tick, 1000);

    // 关闭按钮
    $('card-close').addEventListener('click', UI.closeCard);
    document.querySelectorAll('[data-close]').forEach(function (b) { b.addEventListener('click', UI.closeSheets); });

    // 模式切换
    document.querySelectorAll('.le-seg button').forEach(function (b) {
      b.addEventListener('click', function () { LE.ui.setMode(b.dataset.mode); });
    });

    // 图层开关
    var layerState = { iss: true, quakes: true, starlink: true, trails: true, terminator: true, clouds: true, lights: false, flights: false };
    function setLayer(id, on) {
      layerState[id] = on;
      document.querySelectorAll('[data-layer="' + id + '"]').forEach(function (c) { c.setAttribute('aria-pressed', on ? 'true' : 'false'); });
      if (id === 'quakes') Q.setVisible(on);
      if (id === 'starlink') { SL.setVisible(on); $('btn-sat').setAttribute('aria-pressed', on ? 'true' : 'false'); }
      if (id === 'trails') SL.setTrails(on);
      if (id === 'iss' && LE.layers.iss) LE.layers.iss.setVisible(on);
      if (id === 'flights') F.setVisible(on);
      if (id === 'terminator' || id === 'lights' || id === 'clouds') LE.earth.setLayer(id, on);
      LE.bus.emit('layer:toggle', { id: id, on: on });
    }
    UI.setLayer = setLayer;
    document.querySelectorAll('#chips .le-chip').forEach(function (c) {
      c.addEventListener('click', function () { setLayer(c.dataset.layer, !layerState[c.dataset.layer]); });
    });
    $('btn-sat').addEventListener('click', function () {
      var on = !layerState.starlink; setLayer('starlink', on);
      if (on) { S.flyTo({ position: S.earthCam.position.clone().setLength(2.6), ms: 1600 }); UI.toast('点任意一颗卫星查看详情；拉近镜头可看到 3D 卫星'); }
    });

    $('btn-reset').addEventListener('click', function () {
      UI.closeCard();
      var loc = L.current;
      if (loc) S.flyToLatLng(loc.lat, loc.lng, S.fitDistance(), 1800);
      else S.flyTo({ position: S.earthCam.position.clone().setLength(S.fitDistance()), ms: 1600 });
    });

    /* ---- 我的位置 ---- */
    $('btn-loc').addEventListener('click', function () {
      UI.toggleSheet('sheet-loc');
      if (L.current && !$('sheet-loc').hidden) S.flyToLatLng(L.current.lat, L.current.lng, 2.6, 1600);
    });
    UI.combo($('loc-q'), $('loc-list'), {
      search: function (q) { return L.searchLocal(q, 50); },
      searchAsync: L.searchOnline,
      key: function (c) { return (c.name + '|' + Math.round(c.lat * 10) + '|' + Math.round(c.lng * 10)); },
      render: function (c) {
        return '<b>' + U.esc(c.name) + '</b><span>' + (c.en && c.en !== c.name ? U.esc(c.en) : '') + '</span><em>' + U.esc(c.country) + (c.pop ? ' · ' + U.fmtPop(c.pop) : '') + '</em>' + (c.online ? '<i class="le-tag le-tag--mini">在线</i>' : '');
      },
      pick: function (c) {
        $('loc-q').value = c.name;
        L.set({ lat: c.lat, lng: c.lng, name: c.name, country: c.country, source: 'manual' });
      }
    });
    $('loc-relocate').addEventListener('click', function () { L.locate(); });
    $('loc-pick').addEventListener('click', function () { pickMode(!picking); });
    S.onGroundClick(function (g) {
      if (!picking) return;
      pickMode(false); L.setFromGlobe(g);
    });

    LE.bus.on('location:status', function (s) {
      var tag = $('loc-src'); tag.textContent = s.state === 'locating' ? '定位中' : s.state === 'fail' ? '未定位' : s.text;
      tag.classList.toggle('is-warn', s.state !== 'ok');
      $('loc-status').textContent = s.state === 'ok' ? '可搜索其他城市，或在地球上点选。' : s.text;
      if (s.state === 'fail') { UI.openSheet('sheet-loc'); setTimeout(function () { $('loc-q').focus(); }, 300); }
    });
    LE.bus.on('location:changed', function (loc) {
      $('me-label').textContent = loc.name;
      S.flyToLatLng(loc.lat, loc.lng, Math.max(2.6, S.fitDistance()), 2400);
      UI.refreshLocation();
    });
    UI.refreshLocation = function () {
      var loc = L.current; if (!loc) return;
      $('loc-info').hidden = false;
      $('li-name').textContent = loc.name + (loc.country ? '，' + loc.country : '');
      $('li-ll').textContent = Math.abs(loc.lat).toFixed(2) + '°' + (loc.lat >= 0 ? 'N' : 'S') + '  ' + Math.abs(loc.lng).toFixed(2) + '°' + (loc.lng >= 0 ? 'E' : 'W');
      $('li-day').textContent = LE.earth.isDay(loc.lat, loc.lng) ? '☀️ 白天' : '🌙 夜晚';
      var nq = Q.nearest(loc.lat, loc.lng);
      $('li-quake').textContent = nq ? 'M' + nq.q.mag.toFixed(1) + ' · 距你 ' + U.fmtNum(Math.round(nq.d)) + ' km' : '数据加载中';
      var n = SL.sats.length ? SL.overhead(loc.lat, loc.lng, 1000) : null;
      $('li-sat').textContent = n == null ? '数据加载中' : n + ' 颗';
      $('st-over').textContent = n == null ? '—' : n;
    };
    setInterval(function () { if (S.mode === 'earth') UI.refreshLocation(); }, 5000);

    /* ---- 航线 ---- */
    $('btn-route').addEventListener('click', function () {
      UI.toggleSheet('sheet-route');
      if (!$('sheet-route').hidden) { setLayer('flights', true); if (!F.from && L.current) F.from = F.nearest(L.current.lat, L.current.lng); syncRoute(); F.render(); }
    });
    function apRow(a) { return '<b class="le-code">' + a.code + '</b><b>' + U.esc(a.name) + '</b><em>UTC' + (a.tz >= 0 ? '+' : '') + a.tz + '</em>'; }
    UI.combo($('r-from'), $('r-from-list'), { search: F.search, key: function (a) { return a.code; }, render: apRow, showOnFocus: true,
      pick: function (a) { F.setRoute(a, F.to, true); } });
    UI.combo($('r-to'), $('r-to-list'), { search: F.search, key: function (a) { return a.code; }, render: apRow, showOnFocus: true,
      pick: function (a) { F.setRoute(F.from, a, true); } });
    $('r-swap').addEventListener('click', function () { if (F.from && F.to) F.setRoute(F.to, F.from, true); });
    $('r-clear').addEventListener('click', function () { F.setRoute(F.from, null, true); });
    function syncRoute() {
      $('r-from').value = F.from ? F.from.name + ' ' + F.from.code : '';
      $('r-to').value = F.to ? F.to.name + ' ' + F.to.code : '';
      var info = $('r-info');
      if (F.from && F.to) {
        var st = F.stats(F.from, F.to), h = Math.floor(st.hours), m = Math.round((st.hours - h) * 60);
        info.hidden = false;
        $('ri-route').textContent = F.from.name + ' → ' + F.to.name;
        $('ri-km').textContent = U.fmtNum(Math.round(st.km)) + ' km';
        $('ri-time').textContent = h + ' 小时 ' + m + ' 分';
        $('ri-tz').textContent = st.tzDiff === 0 ? '无时差' : (st.tzDiff > 0 ? '目的地快 ' : '目的地慢 ') + Math.abs(st.tzDiff) + ' 小时';
      } else info.hidden = true;
    }
    LE.bus.on('route:changed', syncRoute);

    /* ---- 太阳系 ---- */
    $('btn-planet').addEventListener('click', function () { UI.toggleSheet('sheet-planet'); });
    $('btn-overview').addEventListener('click', function () { UI.closeCard(); SO.overview(); });
    UI.planetCombo = UI.combo($('p-q'), $('p-list'), {
      search: SO.search, key: function (b) { return b.id; }, alwaysOpen: true,
      render: function (b) { return '<b>' + U.esc(b.zh) + '</b><span>' + U.esc(b.en) + '</span><em>' + U.esc(b.type) + '</em>'; },
      pick: function (b) { $('p-q').value = b.zh; SO.select(b.id); if (innerWidth < 640) UI.closeSheets(); }
    });
    var sc = $('speed-chips');
    SO.SPEEDS.forEach(function (sp, i) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'le-chip'; b.textContent = sp.label;
      b.style.setProperty('--c', '#4fd8ff'); b.setAttribute('aria-pressed', i === 0 ? 'true' : 'false');
      b.addEventListener('click', function () { SO.speed = sp.v; sc.querySelectorAll('.le-chip').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); }); });
      sc.appendChild(b);
    });
    var now = document.createElement('button'); now.type = 'button'; now.className = 'le-chip le-chip--plain'; now.textContent = '⟲ 回到现在';
    now.addEventListener('click', function () { SO.simTime = Date.now(); });
    sc.appendChild(now);
    LE.bus.on('solar:tick', function (ms) { var el = $('sim-date'); var t = U.fmtDate(ms); if (el.textContent !== t) el.textContent = t; });

    /* ---- 选中对象 → 卡片 ---- */
    LE.bus.on('select', function (e) { UI['card_' + e.kind](e.item); });
    LE.bus.on('select:update', function (e) { if (card.kind === e.kind) UI['rows_' + e.kind](e.item); });

    /* ---- 数据到达 → HUD ---- */
    LE.bus.on('data:quakes', function (d) {
      $('st-count').textContent = U.fmtNum(d.list.length);
      var top = d.list.reduce(function (a, b) { return !a || b.mag > a.mag ? b : a; }, null);
      if (top) { $('st-max').textContent = 'M' + top.mag.toFixed(1); $('st-max').style.color = Q.color(top.mag); $('st-max').title = top.place; }
      var tag = $('st-tag'); tag.textContent = d.live ? '地震 · 实时' : '地震 · 离线快照'; tag.classList.toggle('is-warn', !d.live);
      UI.refreshLocation();
    });
    LE.bus.on('data:starlink', function (d) {
      $('sat-count').textContent = d.count ? U.fmtNum(d.count) : '—';
      var tag = $('sat-tag');
      tag.textContent = d.error ? '星链加载失败' : d.live ? '星链 · 实时 CelesTrak' : '星链 · 离线样本';
      tag.title = d.live ? '' : '离线样本为 2026-10-08 历元的 1/8 抽样，在轨实际约 10,000 颗';
      tag.classList.toggle('is-warn', !d.live);
      UI.refreshLocation();
    });

    /* ---- 视点读数：屏幕中心对准的经纬度 + 相机高度 ---- */
    var roLL = $('ro-ll'), roAlt = $('ro-alt'), roN = 0;
    S.addUpdater(function (dt, nowMs, mode) {
      if (mode !== 'earth' || (roN++ % 6)) return;
      var c = S.earthCam.position, g = U.toLL(c), alt = (c.length() - 1) * LE.config.EARTH_KM;
      roLL.textContent = Math.abs(g.lat).toFixed(2) + '°' + (g.lat >= 0 ? 'N' : 'S') + ' ' + Math.abs(g.lng).toFixed(2) + '°' + (g.lng >= 0 ? 'E' : 'W');
      roAlt.textContent = U.fmtNum(Math.round(alt)) + ' km';
    });

    /* ---- 定位针标签跟随 ---- */
    var meLabel = $('me-label');
    S.addUpdater(function (dt, nowMs, mode) {
      if (mode !== 'earth' || !L.current || !L.pin.visible) { meLabel.classList.remove('is-on'); return; }
      var p = L.pinTop(), sp = S.toScreen(p), vis = !S.occluded(p) && !sp.behind;
      meLabel.style.transform = 'translate(' + Math.round(sp.x + 10) + 'px,' + Math.round(sp.y - 16) + 'px)';
      meLabel.classList.toggle('is-on', vis);
    });
  };

  /* ------------------------------ 卡片内容 ------------------------------ */
  UI.card_quake = function (q) {
    UI.showCard({ kind: 'quake', color: LE.layers.quakes.color(q.mag), kicker: '地震', title: 'M' + q.mag.toFixed(1) + '  ' + q.place,
      rows: [['震级', 'M' + q.mag.toFixed(1), 1], ['深度', q.depth.toFixed(1) + ' km', 1], ['时间', U.fmtDate(q.time) + '（本地时间）', 1], ['坐标', q.lat.toFixed(2) + ', ' + q.lng.toFixed(2), 1]],
      actions: q.url ? [{ label: '在 USGS 查看 ↗', href: q.url }] : [] });
  };
  UI.rows_quake = function () {};

  UI.card_sat = function (s) {
    UI.showCard({ kind: 'sat', color: s.shell.c, kicker: '星链卫星 · ' + s.shell.name, title: s.name,
      blurb: '高度约 550 km 的低轨通信卫星，绕地球一圈约 95 分钟。太阳能板反射阳光时会出现短暂“闪光”。',
      rows: satRows(s), actions: [{ label: '◎ 一镜到底 · 再飞一次', fn: LE.layers.starlink.flyToSelected }] });
  };
  function satRows(s) {
    var per = 2 * Math.PI / s.rec.no;
    return [['NORAD 编号', s.norad, 1], ['轨道倾角', s.inc.toFixed(2) + '°', 1], ['当前高度', s.alt.toFixed(0) + ' km', 1],
            ['速度', s.speed.toFixed(2) + ' km/s', 1], ['绕地一圈', per.toFixed(1) + ' 分钟', 1],
            ['星下点', s.lat.toFixed(2) + ', ' + s.lng.toFixed(2), 1], ['光照', LE.layers.starlink.isLit(s) ? '☀️ 被阳光照亮' : '🌑 在地球阴影里']];
  }
  UI.rows_sat = function (s) { UI.setCardRows(satRows(s)); };

  UI.card_iss = function (I) {
    UI.showCard({ kind: 'iss', color: '#ffb46a', kicker: '载人空间站 · ISS', title: '国际空间站',
      blurb: '人类在轨最大的航天器：长约 109 米、宽约 73 米，约 420 吨，相当于一个足球场。每天绕地球约 16 圈，航天员一天能看到 16 次日出。模型来自 NASA 公开 3D 资源。',
      rows: issRows(I), actions: [{ label: '◎ 一镜到底 · 再飞一次', fn: LE.layers.iss.flyTo }] });
  };
  function issRows(I) {
    return [['NORAD 编号', '25544', 1], ['当前高度', I.alt.toFixed(0) + ' km', 1], ['速度', I.speed.toFixed(2) + ' km/s', 1],
            ['绕地一圈', (2 * Math.PI / I.rec.no).toFixed(1) + ' 分钟', 1], ['星下点', I.lat.toFixed(2) + ', ' + I.lng.toFixed(2), 1],
            ['首个舱段', '1998 年 11 月发射', 0], ['轨道数据', I.live ? 'CelesTrak 实时' : '内嵌 TLE（2026-10-12）', 0],
            ['光照', I.isLit() ? '☀️ 被阳光照亮' : '🌑 在地球阴影里', 0]];
  }
  UI.rows_iss = function (I) { UI.setCardRows(issRows(I)); };

  UI.card_planet = function (b) {
    var acts = [];
    if (b.id === 'earth') acts.push({ label: '⊕ 进入实时地球', fn: function () { UI.setMode('earth'); } });
    UI.showCard({ kind: 'planet', color: '#4fd8ff', kicker: b.type + ' · ' + b.en, title: b.zh, blurb: b.blurb, rows: planetRows(b), actions: acts });
  };
  function planetRows(b) {
    var rows = [['半径', U.fmtNum(Math.round(b.radiusKm)) + ' km', 1]];
    var d = LE.solar.distances(b);
    if (d) {
      rows.push(['离太阳', d.sunAU.toFixed(3) + ' AU', 1]);
      if (d.earthKm) rows.push(['离地球', U.fmtNum(d.earthKm) + ' km · 光行 ' + d.lightSec.toFixed(2) + ' 秒', 1]);
      else if (b.id !== 'earth') rows.push(['离地球', d.earthAU.toFixed(3) + ' AU · 光行 ' + (d.lightMin >= 120 ? (d.lightMin / 60).toFixed(1) + ' 小时' : d.lightMin.toFixed(1) + ' 分钟'), 1]);
    }
    Object.keys(b.facts || {}).forEach(function (k) { rows.push([k, b.facts[k]]); });
    return rows;
  }
  UI.rows_planet = function (b) { UI.setCardRows(planetRows(b)); };

  /* ------------------------------ 模式切换 ------------------------------ */
  UI.setMode = function (mode) {
    UI.closeCard(); UI.closeSheets();
    LE.scene.setMode(mode);
    document.body.dataset.mode = mode;
    document.querySelectorAll('.le-seg button').forEach(function (b) { b.setAttribute('aria-selected', b.dataset.mode === mode ? 'true' : 'false'); });
    if (mode === 'solar') {
      LE.solar.simTime = Date.now();
      if (!UI._solarIntro) { UI._solarIntro = true; LE.scene.solarCam.position.set(0, 260, 420); LE.solar.overview(); }
    }
  };
})();
