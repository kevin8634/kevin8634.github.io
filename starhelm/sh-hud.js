/* 天枢 Starhelm · sh-hud.js · 1.0 HUD 外壳(v1.0-M1)
 * 定稿(王磊 10-22 18:17):A 舰桥为底 + B 对数尺度尺/常驻小航图 + C 大读数;守星人在底部控制台;任务抽屉默认展开。
 * 依赖(都可缺省):sh-time.js(SHTIME)、sh-now.js(SHNOW)、sh-data.js(SH.DOMAINS/TASKS/GUIDES)、sh-core.js(SH.progress)。
 * API:SHHUD.mount(opts) · setCrumb(n, body) · setScale(km) · guide(id, q, hints) · showNow(body, pt) · hideNow() · setTask(id) · refreshTasks() · on(evt, fn)
 * 事件:atlas gfx sound fullscreen opening task domain fly zoomout drawer
 * 存储(本机):gn:sh:hud(抽屉开合)。
 */
(function () {
  'use strict';
  var AU = 149597870.7, C = 299792.458, LY = 9460730472580.8;
  var DOM = [ // 七星域(scale = 航图对数半径 log10 米,与 sh-data.js 一致)
    { n: 1, zh: '家园', g: '北辰', scale: 7, open: true }, { n: 2, zh: '日与月', g: '羲和与望舒', scale: 9, open: true },
    { n: 3, zh: '行星世界', g: '岁星', scale: 12, open: true }, { n: 4, zh: '太阳系边疆', g: '星槎', scale: 14, open: true }, { n: 5, zh: '群星', g: '织女', scale: 17, open: true },
    { n: 6, zh: '银河', g: '银汉', scale: 21 }, { n: 7, zh: '宇宙', g: '太一', scale: 26 }];
  var ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
  // 星域 II(M1):四个已有实验室 + 两个新任务;星域 I 读 SH.TASKS
  var TASKS2 = [
    { id: 'eclipse', d: 2, q: '日月食实验室', lab: 'eclipseLab', key: 'eclipse' },
    { id: 'tide', d: 2, q: '潮汐实验室', lab: 'tideLab', key: 'tide' },
    { id: 'sun', d: 2, q: '太阳活动观测台', lab: 'sunLab', key: 'sun' },
    { id: 'moon', d: 2, q: '月相实验室', lab: 'moonLab', key: 'moon' },
    { id: 'tidelock', d: 2, q: '月亮为什么总用同一面对着我们?', isNew: true, lab: 'tidelockLab', key: 'tidelock' },
    { id: 'aurora', d: 2, q: '极光是太阳寄来的信吗?', isNew: true, lab: 'auroraLab', key: 'aurora' }];
  // 星域 III(M2a/M2b):四个任务全部开放
  var TASKS4 = [{ id: 'voyager', d: 4, q: '旅行者号此刻飞到哪了?', isNew: true, lab: 'voyagerLab', key: 'voyager' }, { id: 'comet', d: 4, q: '彗星的尾巴为什么总背着太阳?', isNew: true, lab: 'cometLab', key: 'comet' }, { id: 'dino', d: 4, q: '恐龙那天到底发生了什么?', isNew: true, lab: 'dinoLab', key: 'dino' }];
  // 星域 V(v1.0-M4):四个任务,实现见 sh-d5-tasks.js
  var TASKS5 = [{ id: 'starlight', d: 5, q: '你看到的星光有多老?', isNew: true, lab: 'starlightLab', key: 'starlight' }, { id: 'exoearth', d: 5, q: '宇宙里还有别的地球吗?', isNew: true, lab: 'exoearthLab', key: 'exoearth' }, { id: 'sundie', d: 5, q: '太阳会死吗?', isNew: true, lab: 'sundieLab', key: 'sundie' }, { id: 'constel', d: 5, q: '星座为什么会变形?', isNew: true, lab: 'constelLab', key: 'constel' }];
  var TASKS3 = [
    { id: 'marsday', d: 3, q: '火星上的一天有多长?', isNew: true, lab: 'marsdayLab', key: 'marsday' },
    { id: 'tonight', d: 3, q: '今晚抬头能看到哪颗行星?', isNew: true, lab: 'tonightLab', key: 'tonight' },
    { id: 'jupiter', d: 3, q: '木星为什么没变成太阳?', isNew: true, lab: 'jupiterLab', key: 'jupiter' },
    { id: 'retro', d: 3, q: '行星为什么有时会倒着走?', isNew: true, lab: 'retroLab', key: 'retro' }];
  var GUIDES = { zhinv: { zh: '织女', sub: '星域 V 群星', av: '' }, xingcha: { zh: '星槎', sub: '星域 IV 太阳系边疆', av: '' }, suixing: { zh: '岁星', sub: '星域 III 行星世界', av: '' }, tianshu: { zh: '北辰', sub: '星域 I 家园' }, xihe: { zh: '羲和', sub: '管太阳这一边', av: '' }, wangshu: { zh: '望舒', sub: '管月亮这一边', av: 'moon' } };

  var nowT = 0, H = {}, subs = {}, st = { dom: 1, body: '', km: 4e5, task: '', nowBody: null, nowPt: null, hints: [], hintN: 0 };
  function $(s, r) { return (r || document).querySelector(s); }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function emit(k, v) { (subs[k] || []).forEach(function (f) { try { f(v); } catch (e) { console.warn('[SHHUD]', e); } }); }
  function store(k, v) { try { var o = JSON.parse(localStorage.getItem('gn:sh:hud') || '{}'); if (v === undefined) return o[k]; o[k] = v; localStorage.setItem('gn:sh:hud', JSON.stringify(o)); } catch (e) { } }
  function reduced() { return window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches; }

  /* ---------- 数值格式 ---------- */
  function fmtKm(km) {
    if (km >= LY / 10) { var ly = km / LY; return (ly >= 1e9 ? (ly / 1e8).toFixed(0) + ' 亿' : ly >= 1e4 ? (ly / 1e4).toFixed(ly < 1e5 ? 1 : 0) + ' 万' : ly.toFixed(ly < 10 ? 2 : 0)) + ' 光年'; }
    if (km >= 1e8) return (km / 1e8).toFixed(km < 1e9 ? 3 : 1) + ' 亿 km';
    if (km >= 1e4) return (km / 1e4).toFixed(km < 1e5 ? 1 : 0) + ' 万 km';
    return Math.round(km).toLocaleString('en-US') + ' km';
  }
  function fmtLight(km) {
    var s = km / C;
    if (s < 60) return s.toFixed(s < 10 ? 2 : 1) + ' 秒';
    if (s < 3600) return Math.floor(s / 60) + ' 分 ' + Math.round(s % 60) + ' 秒';
    if (s < 86400 * 2) return (s / 3600).toFixed(1) + ' 小时';
    if (s < 86400 * 365.25) return (s / 86400).toFixed(0) + ' 天';
    return fmtKm(km).replace(' 光年', ' 年');
  }
  function bigNum(km) { // 大读数:数字 + 单位分开
    var t = km >= 1e8 && km < LY / 10 ? [(km / 1e8).toFixed(3), '亿 km'] : km < LY / 10 ? [Math.round(km).toLocaleString('en-US'), 'km'] : fmtKm(km).split(' ');
    return t;
  }
  function bigLight(km) { var t = fmtLight(km), m = t.match(/^([\d.]+)\s(.+)$/); return m ? [m[1], m[2]] : [t, '']; }

  /* ---------- 小航图(七层光壳)SVG ---------- */
  function miniSvg(sz, cur) {
    var s = '<svg class="shh-mini" width="' + sz + '" height="' + sz + '" viewBox="0 0 40 40" aria-hidden="true">';
    for (var i = 1; i <= 7; i++) s += '<circle cx="20" cy="20" r="' + (i * 2.7).toFixed(1) + '" class="' + (DOM[i - 1].open ? 'on' : '') + (i === cur ? ' cur' : '') + '"/>';
    return s + '<circle class="c" cx="20" cy="20" r="1.6"/></svg>';
  }

  /* ---------- 任务目录 ---------- */
  function tasksOf(d) {
    if (d === 1) return (window.SH && SH.TASKS ? SH.TASKS : []).map(function (t) { return { id: t.id, d: 1, q: t.q, key: t.id, fw: true }; });
    if (d === 2) return TASKS2;
    if (d === 3) return TASKS3;
    if (d === 4) return TASKS4;
    if (d === 5) return TASKS5;
    return [];
  }
  function lit(t) { // ★:每关至少 1 星
    try {
      if (t.fw && window.SH && SH.progress && SH.levels && SH.levels[t.id]) return SH.progress.task(t.id).done;
      var o = JSON.parse(localStorage.getItem('gn:sh:' + t.key) || 'null');
      if (!o) return false;
      if (o.stars) return o.stars.length > 0 && o.stars.every(function (x) { return x >= 1; });
      if (o.levels) return Object.keys(o.levels).length > 0 && o.done !== false && !!o.done;
      return !!o.done;
    } catch (e) { return false; }
  }
  function drawTasks() {
    var all = 0, on = 0, h = '';
    [1, 2, 3, 4, 5].forEach(function (d) {
      var ts = tasksOf(d), n = ts.filter(lit).length; all += ts.length; on += n;
      h += '<div class="shh-dom" id="shh-dom' + d + '"><span>星域 ' + ROMAN[d] + ' · ' + DOM[d - 1].zh + ' · ' + DOM[d - 1].g + '</span><span>' + n + '/' + ts.length + '</span></div>';
      ts.forEach(function (t) {
        h += '<button type="button" class="shh-task' + (t.id === st.task ? ' cur' : '') + '" data-id="' + t.id + '" data-d="' + d + '"><i>' + (lit(t) ? '★' : '☆') + '</i><span>' + esc(t.q) + (t.isNew ? '<span class="shh-new">新</span>' : t.soon ? '<span class="shh-new is-soon">即将</span>' : '') + '</span></button>';
      });
    });
    h += '<div class="shh-lock">星域 VI–VII · 即将开放</div>';
    H.list.innerHTML = '<div class="shh-list__h">任务<small>' + on + '/' + all + ' 已点亮</small></div>' + h;
    var rb = H.rail.querySelectorAll('button[data-d]');
    for (var i = 0; i < rb.length; i++) rb[i].classList.toggle('cur', +rb[i].dataset.d === st.dom);
  }
  function openTask(id, d) {
    st.task = id; drawTasks(); emit('task', { id: id, d: d });
    var t = tasksOf(d).filter(function (x) { return x.id === id; })[0];
    if (!t || (subs.task && subs.task.length)) return;   // 有外部接管时不自动打开
    if (t.soon) { emit('soon', t); return; }
    if (d !== 5 && window.SHD5 && SHD5.isOpen()) SHD5.close();   // v1.0-M4:离开星域 V 独立视图
    try {
      if (t.fw && window.SH && SH.play && SH.levels && SH.levels[id]) {   // 打开第一个还没拿星的关卡
        var n = 1, L = SH.levels[id].length; for (var i = 1; i <= L; i++) { if (SH.progress.stars(id, i) < 1) { n = i; break; } n = i; }
        return SH.play(id, n);
      }
      if (t.lab && window.SH && SH[t.lab]) return SH[t.lab].open();
      if (window.SH && SH.lab && SH.lab[id]) return SH.lab[id].open();
    } catch (e) { console.warn('[SHHUD] 打开任务失败', id, e); }
  }

  /* ---------- 抽屉开合 ---------- */
  function setDrawer(open, save) {
    H.drawer.classList.toggle('is-closed', !open);
    H.tog.textContent = open ? '‹' : '›'; H.tog.setAttribute('aria-label', open ? '收起任务' : '展开任务');
    H.tog.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (save) store('drawer', open ? 'open' : 'closed');
    document.body.classList.toggle('shh-dclosed', !open); emit('drawer', open); place();
  }
  function defaultDrawer() { var s = store('drawer'); if (s) return s === 'open'; return window.innerWidth > 1180; }

  /* ---------- 时间轴 ---------- */
  var SPAN = 365.25 * 86400000; // ±1 年
  function trackPct(d) { var c = Date.now(); return Math.max(0, Math.min(100, 50 + (d - c) / SPAN * 50)); }
  function drawEvents() {
    var evs = [];
    try {
      if (window.SHNOW && SHNOW.ok) {
        var m = SHNOW.moon(new Date()), s = SHNOW.sun(new Date());
        if (m.nextFull) evs.push({ t: m.nextFull, n: '满月', c: '' });
        if (s.nextSolar) evs.push({ t: s.nextSolar.slice(0, 10), n: s.nextSolar.slice(11), c: '' });
        if (s.nextLunar) evs.push({ t: s.nextLunar.slice(0, 10), n: s.nextLunar.slice(11), c: 'l' });
      }
    } catch (e) { }
    var h = '', lastPct = -99, tw = H.track.offsetWidth || 300;
    evs.forEach(function (e) {
      var d = new Date(e.t.replace(' ', 'T') + (e.t.length > 10 ? ':00+08:00' : 'T12:00:00+08:00')), p = trackPct(d);
      if (p <= 0 || p >= 100) return;
      h += '<div class="ev ' + e.c + '" style="left:' + p + '%" title="' + esc(e.t + ' ' + e.n) + '">' + ((p - lastPct) * tw / 100 > 46 ? '<span>' + esc(e.n) + '</span>' : '') + '</div>'; lastPct = p;
    });
    H.evs.innerHTML = h;
  }
  function onTime(d, s) {
    var f = window.SHTIME ? SHTIME.fmt(d) : d.toISOString().slice(0, 16).replace('T', ' ');
    H.clock.textContent = f.slice(5); H.clock.title = f + ' 北京时间';
    H.year.textContent = f.slice(0, 4) + ' · 北京时间';
    var live = s && s.live; H.live.classList.toggle('on', !!live); H.live.textContent = live ? '实时' : (s && s.rate > 1 ? '快进中' : s && s.rate === 0 ? '已暂停' : '指定时间');
    H.knob.style.left = trackPct(d) + '%';
    var r = s ? s.rate : 1;
    [].forEach.call(H.rates, function (b) { b.setAttribute('aria-pressed', String(+b.dataset.r === r || (b.dataset.r === '1' && r === 1))); });
    if (st.nowBody) { var tt = performance.now(); if (tt - nowT > (r === 1 ? 900 : 250)) { nowT = tt; fillNow(); } }
  }
  function bindTrack() {
    var drag = false;
    function at(ev) {
      var r = H.track.getBoundingClientRect(), x = (ev.touches ? ev.touches[0].clientX : ev.clientX) - r.left, p = Math.max(0, Math.min(1, x / r.width));
      if (window.SHTIME) SHTIME.set(Date.now() + (p - 0.5) * 2 * SPAN);
    }
    H.track.addEventListener('pointerdown', function (e) { drag = true; H.track.setPointerCapture && H.track.setPointerCapture(e.pointerId); at(e); });
    H.track.addEventListener('pointermove', function (e) { if (drag) at(e); });
    H.track.addEventListener('pointerup', function () { drag = false; });
    H.track.addEventListener('keydown', function (e) {
      if (!window.SHTIME) return; var k = { ArrowLeft: -1, ArrowRight: 1 }[e.key]; if (!k) return;
      e.preventDefault(); SHTIME.set(SHTIME.now().getTime() + k * 86400000 * (e.shiftKey ? 30 : 1));
    });
  }

  /* ---------- 对数尺度尺 ---------- */
  var LMIN = 6, LMAX = 27;
  function rulerPct(km) { var l = Math.log10(Math.max(1, km * 1000)); return Math.max(0, Math.min(100, (l - LMIN) / (LMAX - LMIN) * 100)); }
  function drawRuler() {
    var h = '<div class="ln"></div><div class="fill"></div>';
    DOM.forEach(function (d) { var p = (d.scale - LMIN) / (LMAX - LMIN) * 100; h += '<div class="dm" style="left:' + p + '%"></div><div class="dl' + (d.open ? ' on' : '') + '" style="left:' + p + '%">' + ROMAN[d.n] + '</div>'; });
    H.ruler.innerHTML = h + '<div class="me"></div><div class="v"></div>';
  }

  /* ---------- 此刻卡 ---------- */
  function fillNow() {
    if (!window.SHNOW || !SHNOW.ok) { H.nowRows.innerHTML = '<div class="shnow-s">天文计算模块未载入</div>'; return; }
    var d = window.SHTIME ? SHTIME.now() : new Date(), o = SHNOW.card(H.nowRows, st.nowBody, d);
    H.nowName.innerHTML = '<b>' + o.name + '</b><small>' + o.en + '</small>';
    if (!o.distKm) { var su = o.sunAU * AU, sa = bigNum(su), sb = bigLight(su); H.big.innerHTML = '<div><small>离太阳</small><b>' + sa[0] + '<em>' + sa[1] + '</em></b></div><div class="shh-cyan"><small>阳光走</small><b>' + sb[0] + '<em>' + sb[1] + '</em></b></div>'; return; }
    var a = bigNum(o.distKm), b = bigLight(o.distKm); SHHUD.setScale(o.distKm);
    H.big.innerHTML = '<div><small>离地球</small><b>' + a[0] + '<em>' + a[1] + '</em></b></div><div class="shh-cyan"><small>' + (o.id === 'sun' ? '光到地球' : '光从这里到你') + '</small><b>' + b[0] + '<em>' + b[1] + '</em></b></div>';
    // 大读数已显示距离与光行时,行内去重
    [].forEach.call(H.nowRows.querySelectorAll('.shnow-r'), function (r) { var k = r.firstChild.textContent; if (/^离地球$|^光/.test(k)) r.remove(); });
    H.nowLive.textContent = o.badge || (window.SHTIME && !SHTIME.isLive() ? '模拟时间' : '实时');
  }
  function place() {
    if (!st.nowBody || H.now.hidden) return;
    var W = window.innerWidth, sheet = W <= 1180, p = st.nowPt;
    H.now.classList.toggle('is-sheet', sheet);
    if (sheet || !p) { H.lead.innerHTML = ''; if (!p && !sheet) { H.now.style.left = (W - 400) + 'px'; H.now.style.top = '96px'; } return; }
    var w = H.now.offsetWidth, hgt = H.now.offsetHeight, Hh = window.innerHeight;
    var left = p.x - w - 90, top = p.y + (p.r || 60) * 0.5;
    if (left < 340) left = Math.min(W - w - 20, p.x + (p.r || 60) + 60);
    top = Math.max(84, Math.min(Hh - hgt - 130, top));
    H.now.style.left = left + 'px'; H.now.style.top = top + 'px';
    var ax = left + w > p.x ? left : left + w, ay = top + 22, bx = p.x - (p.r || 60) * 0.7 * (ax < p.x ? 1 : -1), by = p.y + (p.r || 60) * 0.7;
    H.lead.innerHTML = '<polyline points="' + ax + ',' + ay + ' ' + (ax + (ax < p.x ? 40 : -40)) + ',' + ay + ' ' + bx + ',' + by + '"/>';
  }

  /* ---------- 守星人(控制台内) ---------- */
  function setGuide(id, q, hints) {
    var g = GUIDES[id] || (window.SH && SH.guide ? { zh: SH.guide(id).zh, sub: '' } : GUIDES.tianshu);
    st.hints = hints || []; st.hintN = 0;
    H.gAv.className = 'av ' + (g.av || '');
    H.gWho.innerHTML = '<span class="shh-gpre">守星人 · </span>' + esc(g.zh) + (g.sub ? '<small>' + esc(g.sub) + '</small>' : '');
    H.gQ.textContent = q || ''; H.gQ.title = q || ''; H.gHint.textContent = ''; H.gQ.style.webkitLineClamp = '';
    var hb = ''; for (var i = 0; i < Math.min(3, st.hints.length); i++) hb += '<button type="button" class="shh-btn" data-h="' + i + '"' + (i ? ' disabled' : '') + '>提示 ' + (i + 1) + '</button>';
    H.gHints.innerHTML = hb;
  }

  /* ---------- 构建 ---------- */
  function build(opts) {
    var root = el('div', 'shh-root'); root.id = 'shh';
    root.innerHTML =
      '<header class="shh-top shh-glass">' +
        '<a class="shh-btn" href="' + esc(opts.genesis || '../') + '" title="回到创世计划总门户">← <span class="t">创世计划</span></a>' +
        '<div class="shh-logo">天枢 <b>Starhelm</b><small>· 天文</small></div><div class="shh-sep"></div>' +
        '<div class="shh-crumb" id="shh-crumb"></div><div class="shh-flex"></div>' +
        '<button type="button" class="shh-btn shh-mtask" id="shh-mtask" aria-controls="shh-drawer">★ 任务</button>' +
        '<div class="shh-scale" aria-live="polite"><div class="shh-scale__a"><div class="shh-scale__bar"></div><span id="shh-sc"></span></div><div class="shh-scale__l" id="shh-sl"></div></div>' +
        '<button type="button" class="shh-atlas" id="shh-atlas" title="宇宙航图">' + miniSvg(34, 1) + '<span>航图</span></button>' +
        '<button type="button" class="shh-btn is-x" data-ev="gfx" id="shh-gfx">◇ <span class="t">画质' + (opts.gfxLabel ? ' ' + esc(opts.gfxLabel) : '') + '</span></button>' +
        '<button type="button" class="shh-btn" data-ev="sound" aria-pressed="false">♪ <span class="t" id="shh-snd">声音 关</span></button>' +
        '<button type="button" class="shh-btn is-ic is-x" data-ev="fullscreen" title="全屏">⛶</button>' +
        (opts.noOpening ? '' : '<button type="button" class="shh-btn is-x" data-ev="opening" title="重播开场">↺ <span class="t">开场</span></button>') +
      '</header>' +
      '<nav class="shh-drawer shh-glass" id="shh-drawer" aria-label="任务抽屉"><div class="shh-rail">' +
        DOM.map(function (d) { return '<button type="button" data-d="' + d.n + '" class="' + (d.open ? 'on' : '') + '" title="星域 ' + ROMAN[d.n] + ' · ' + d.zh + (d.open ? '' : ' · 即将开放') + '"' + (d.open ? '' : ' aria-disabled="true"') + '>' + ROMAN[d.n] + '</button>'; }).join('') +
        '<button type="button" class="shh-vlabel" id="shh-vl">任务 ›</button><button type="button" class="shh-tog" id="shh-tog">‹</button>' +
      '</div><div class="shh-list" id="shh-list"></div></nav>' +
      '<section class="shh-console shh-glass" aria-label="时间与尺度">' +
        '<div class="shh-c-time"><span class="shh-live" id="shh-live">实时</span><b id="shh-clock">--</b><small id="shh-year"></small></div>' +
        '<div class="shh-c-mid"><div class="shh-c-ctl">' +
          '<button type="button" class="shh-btn is-x" data-r="-86400" title="倒放 1 天/秒">◀◀</button>' +
          '<button type="button" class="shh-btn" data-r="1">▶ 1×</button><button type="button" class="shh-btn" data-r="86400">1 天/秒</button><button type="button" class="shh-btn is-x" data-r="2592000">1 月/秒</button>' +
          '<div class="shh-track" id="shh-track" tabindex="0" role="slider" aria-label="时间轴:前后各一年,左右键逐日" aria-valuemin="-365" aria-valuemax="365"><div id="shh-evs"></div><div class="k" id="shh-knob"></div></div>' +
          '<span class="shh-btn is-ic shh-date" title="选日期">📅<input type="date" id="shh-dpick" aria-label="选日期"></span>' +
          '<button type="button" class="shh-btn is-ic" id="shh-back" title="回到此刻">⟲</button>' +
        '</div><div class="shh-ruler" id="shh-ruler" title="对数尺度:镜头此刻所在尺度"></div></div>' +
        '<div class="shh-c-guide" aria-live="polite"><div class="av" id="shh-gav"></div><div class="tx"><div class="who"><span id="shh-gwho"></span><div class="hints" id="shh-ghints"></div></div><div class="q" id="shh-gq"></div><div class="hint" id="shh-ghint"></div></div></div>' +
      '</section>' +
      '<svg class="shh-lead" id="shh-lead" aria-hidden="true"></svg>' +
      '<aside class="shh-now shh-glass" id="shh-now" hidden aria-live="polite"><div class="shh-now__h"><span id="shh-nn"></span><span class="shh-live on" id="shh-nl" style="margin-left:auto">实时</span><button type="button" class="shh-now__x" id="shh-nx" aria-label="关闭此刻卡">×</button></div>' +
        '<div class="shh-big" id="shh-big"></div><div class="shh-rows" id="shh-nr"></div>' +
        '<div class="shh-acts"><button type="button" class="p" id="shh-fly">飞过去 ›</button><button type="button" id="shh-out">拉远 → 星域 II</button></div></aside>' +
      (opts.tag ? '<div class="shh-tag">' + esc(opts.tag) + '</div>' : '');
    document.body.appendChild(root); document.body.classList.add('shh-on');
    var ids = { crumb: 'crumb', sc: 'sc', sl: 'sl', drawer: 'drawer', list: 'list', tog: 'tog', vl: 'vl', live: 'live', clock: 'clock', year: 'year', track: 'track', evs: 'evs', knob: 'knob', ruler: 'ruler',
      gAv: 'gav', gWho: 'gwho', gQ: 'gq', gHint: 'ghint', gHints: 'ghints', now: 'now', nowName: 'nn', nowLive: 'nl', big: 'big', nowRows: 'nr', lead: 'lead', fly: 'fly', out: 'out', snd: 'snd' };
    for (var k in ids) H[k] = document.getElementById('shh-' + ids[k]);
    H.root = root; H.rail = $('.shh-rail', root); H.rates = root.querySelectorAll('.shh-c-ctl [data-r]');

    // 事件
    $('#shh-atlas').addEventListener('click', function () { emit('atlas'); });
    [].forEach.call(root.querySelectorAll('[data-ev]'), function (b) {
      b.addEventListener('click', function () {
        var e = b.dataset.ev;
        if (e === 'fullscreen') { try { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen(); } catch (x) { } }
        if (e === 'sound') { var on = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', String(on)); H.snd.textContent = on ? '声音 开' : '声音 关'; emit('sound', on); return; }
        emit(e);
      });
    });
    H.tog.addEventListener('click', function () { setDrawer(H.drawer.classList.contains('is-closed'), true); });
    H.vl.addEventListener('click', function () { setDrawer(true, true); });
    $('#shh-mtask').addEventListener('click', function () { setDrawer(H.drawer.classList.contains('is-closed'), false); });
    H.rail.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-d]'); if (!b) return; var d = +b.dataset.d;
      if (!DOM[d - 1].open) { emit('domain', { n: d, locked: true }); return; }
      if (H.drawer.classList.contains('is-closed')) setDrawer(true, true);
      var hd = document.getElementById('shh-dom' + d); if (hd) hd.scrollIntoView({ block: 'start', behavior: reduced() ? 'auto' : 'smooth' });
      emit('domain', { n: d });
    });
    H.list.addEventListener('click', function (e) { var b = e.target.closest('.shh-task'); if (b) openTask(b.dataset.id, +b.dataset.d); });
    [].forEach.call(H.rates, function (b) { b.addEventListener('click', function () { if (!window.SHTIME) return; var r = +b.dataset.r; if (r === 1) SHTIME.setRate(1); else SHTIME.setRate(r); }); });
    $('#shh-back').addEventListener('click', function () { if (window.SHTIME) SHTIME.live(); });
    $('#shh-dpick').addEventListener('change', function () { if (window.SHTIME && this.value) { SHTIME.set(new Date(this.value + 'T20:00:00+08:00')); SHTIME.setRate(1); } });
    H.gHints.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-h]'); if (!b || b.disabled) return; var i = +b.dataset.h;
      H.gHint.textContent = st.hints[i] || ''; H.gQ.style.webkitLineClamp = '1'; var nx = H.gHints.querySelector('[data-h="' + (i + 1) + '"]'); if (nx) nx.disabled = false;
    });
    $('#shh-nx').addEventListener('click', function () { SHHUD.hideNow(); });
    H.fly.addEventListener('click', function () { emit('fly', st.nowBody); });
    H.out.addEventListener('click', function () { emit('zoomout', st.nowBody); });
    window.addEventListener('resize', function () { place(); drawEvents(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !H.now.hidden) SHHUD.hideNow(); });

    drawRuler(); drawTasks(); drawEvents(); setDrawer(defaultDrawer(), false);
    if (window.SH && SH.progress && SH.progress.on) SH.progress.on(drawTasks);
    window.addEventListener('storage', function (e) { if (e.key && e.key.indexOf('gn:sh:') === 0) drawTasks(); });
    if (window.SHTIME) SHTIME.on(onTime); else onTime(new Date(), { live: true, rate: 1 });
  }

  var SHHUD = window.SHHUD = {
    mount: function (opts) { if (H.root) return SHHUD; build(opts || {}); SHHUD.setCrumb(1, ''); SHHUD.setScale(st.km); SHHUD.guide('tianshu', '看见旁边那颗月亮了吗?点它,我们飞过去看看。', []); return SHHUD; },
    unmount: function () { if (H.root) H.root.remove(); H = {}; document.body.classList.remove('shh-on'); },
    on: function (k, f) { (subs[k] = subs[k] || []).push(f); return SHHUD; },
    setCrumb: function (n, body) {
      st.dom = n; st.body = body || '';
      H.crumb.innerHTML = '星域 ' + ROMAN[n] + ' · ' + esc(DOM[n - 1].zh) + (body ? ' › <b>' + esc(body) + '</b>' : '');
      var a = $('#shh-atlas'); a.firstChild.outerHTML = miniSvg(34, n); drawTasks();
    },
    setScale: function (km) {
      st.km = km; H.sc.textContent = '约 ' + fmtKm(km); H.sl.textContent = '光走 ' + fmtLight(km);
      var p = rulerPct(km); $('.me', H.ruler).style.left = p + '%'; $('.fill', H.ruler).style.width = p + '%';
      var v = $('.v', H.ruler); v.style.left = Math.max(6, Math.min(94, p)) + '%'; v.textContent = fmtKm(km);
    },
    guide: function (id, q, hints) { setGuide(id, q, hints); return SHHUD; },
    showNow: function (body, pt, acts) {
      st.nowBody = body; st.nowPt = pt || null; H.now.hidden = false;
      if (acts) { H.fly.textContent = acts[0]; H.out.textContent = acts[1]; H.out.hidden = !acts[1]; }
      fillNow(); place(); return SHHUD;
    },
    movePt: function (pt) { st.nowPt = pt; place(); },
    setActs: function (a, b) { H.fly.textContent = a; H.out.textContent = b || ''; H.out.hidden = !b; },
    setSound: function (on) { var b = H.root.querySelector('[data-ev="sound"]'); b.setAttribute('aria-pressed', String(!!on)); H.snd.textContent = on ? '声音 开' : '声音 关'; },
    nowBody: function () { return st.nowBody; },
    hideNow: function () { var was = st.nowBody; st.nowBody = null; H.now.hidden = true; H.lead.innerHTML = ''; if (was) emit('nowclose', was); },
    setTask: function (id) { st.task = id; drawTasks(); },
    refreshTasks: drawTasks,
    drawer: function (open) { setDrawer(open, true); },
    fmtKm: fmtKm, fmtLight: fmtLight, DOMAINS: DOM, TASKS2: TASKS2, TASKS3: TASKS3, TASKS4: TASKS4, TASKS5: TASKS5, tasksOf: tasksOf, lit: lit
  };
})();
