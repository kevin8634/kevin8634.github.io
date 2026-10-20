/* =====================================================================
 * 天枢 Starhelm · sh-core.js(M1)
 * 七律框架:进度存储 gn:sh:<任务> · 天枢七星向导 · 任务面板 · 关卡运行器 · 航图 · 卡片上的向导提问 · 任务音效
 * 只用本机 localStorage,不上传任何数据。依赖 window.LE(Live Earth 内核)与 sh-data.js。
 * ===================================================================== */
(function () {
  'use strict';
  var SH = (window.SH = window.SH || {});
  var LE = window.LE, U = LE.util, $ = U.$;

  /* ------------------------------ 存储与进度 ------------------------------ */
  function load(k, def) { try { var v = JSON.parse(localStorage.getItem('gn:sh:' + k) || 'null'); return v == null ? def : v; } catch (e) { return def; } }
  function save(k, v) { try { localStorage.setItem('gn:sh:' + k, JSON.stringify(v)); } catch (e) {} }
  var listeners = [];
  var P = (SH.progress = {
    task: function (id) { var t = load(id, null); if (!t || t.v !== 1) t = { v: 1, levels: {}, done: false, t: 0 }; return t; },
    stars: function (id, n) { return +(P.task(id).levels[n] || 0); },
    total: function (id) { var L = P.task(id).levels; return Object.keys(L).reduce(function (a, k) { return a + (+L[k] || 0); }, 0); },
    unlocked: function (id, n) { return n === 1 || P.stars(id, n - 1) >= 1; },
    setLevel: function (id, n, stars) {
      var t = P.task(id), old = +(t.levels[n] || 0);
      t.levels[n] = Math.max(old, stars); t.t = Date.now();
      var def = SH.levels[id] || [];
      t.done = def.length > 0 && def.every(function (_, i) { return (+t.levels[i + 1] || 0) >= 1; });
      save(id, t); P.emit(); return t;
    },
    explore: function (key) { var e = load('explore', {}); if (e[key]) return; e[key] = Date.now(); save('explore', e); P.emit(); },
    explored: function (key) { return !!load('explore', {})[key]; },
    lit: function (star) {
      var b = star.by.split(':');
      if (b[0] === 'explore') return P.explored(b[1]);
      if (b[0] === 'task') return P.task(b[1]).done;
      return P.stars(b[0], +b[1]) >= 1;
    },
    on: function (fn) { listeners.push(fn); },
    emit: function () { listeners.forEach(function (f) { try { f(); } catch (e) { console.error(e); } }); }
  });
  SH.levels = SH.levels || {};    // 各任务脚本注册:SH.levels.where = [level1, level2, level3]

  /* ------------------------------ 任务音效 ------------------------------ */
  // 跟随 LE.audio 的「音效」开关(默认关)。chord/soft 用合成音频文件;glass/hum 的音高随数值变化(声音即规律),实时合成
  var actx = null;
  function ac() {
    if (!LE.audio || !LE.audio.sfx || !LE.audio.started) return null;
    if (!actx) { var A = window.AudioContext || window.webkitAudioContext; if (!A) return null; actx = new A(); }
    if (actx.state === 'suspended') actx.resume();
    return actx;
  }
  var snd = (SH.sound = {
    tone: function (f, dur, vol, type, when) {
      var c = ac(); if (!c) return; var t = c.currentTime + (when || 0);
      var o = c.createOscillator(), g = c.createGain(); o.type = type || 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.12, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + (dur || 0.6));
      o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + (dur || 0.6) + 0.05);
    },
    glass: function (f) { snd.tone(f, 1.6, 0.09); snd.tone(f * 2.76, 1.0, 0.025); },
    chord: function () { LE.audio.play('unlock'); },   // 过关:D 利底亚上行琶音(audio/unlock.m4a)
    soft: function () { LE.audio.play('soft'); },      // 再想想:温和的下行大二度
    hum: null,
    humStart: function (f) {
      var c = ac(); if (!c) return; snd.humStop();
      var o = c.createOscillator(), o2 = c.createOscillator(), g = c.createGain();
      o.type = 'sine'; o2.type = 'triangle'; o.frequency.value = f; o2.frequency.value = f * 1.5; o2.detune.value = 6;
      var g2 = c.createGain(); g2.gain.value = 0.25; o2.connect(g2); g2.connect(g); o.connect(g);
      g.gain.setValueAtTime(0.0001, c.currentTime); g.gain.exponentialRampToValueAtTime(0.05, c.currentTime + 0.3);
      g.connect(c.destination); o.start(); o2.start(); snd.hum = { o: o, o2: o2, g: g, c: c };
    },
    humSet: function (f) { var h = snd.hum; if (!h) return; h.o.frequency.setTargetAtTime(f, h.c.currentTime, 0.08); h.o2.frequency.setTargetAtTime(f * 1.5, h.c.currentTime, 0.08); },
    humStop: function () { var h = snd.hum; if (!h) return; snd.hum = null; var t = h.c.currentTime; h.g.gain.setTargetAtTime(0.0001, t, 0.15); h.o.stop(t + 0.8); h.o2.stop(t + 0.8); }
  });

  /* ------------------------------ 向导徽记 ------------------------------ */
  // 北斗七星(斗口 → 斗柄),当前向导那颗最亮
  var DIPPER = [[0.30, 0.22], [0.27, 0.46], [0.47, 0.53], [0.53, 0.33], [0.67, 0.31], [0.80, 0.34], [0.95, 0.52]];
  SH.guide = function (id) { for (var i = 0; i < SH.GUIDES.length; i++) if (SH.GUIDES[i].id === id) return SH.GUIDES[i]; return SH.GUIDES[0]; };
  SH.guideIcon = function (id, size) {
    size = size || 44; var cv = document.createElement('canvas'), pr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = cv.height = size * pr; cv.style.width = cv.style.height = size + 'px'; cv.className = 'sh-gicon';
    var x = cv.getContext('2d'); x.scale(pr, pr);
    var gi = SH.GUIDES.indexOf(SH.guide(id));
    x.fillStyle = '#0b1230'; x.beginPath(); x.arc(size / 2, size / 2, size / 2, 0, 7); x.fill();
    x.strokeStyle = 'rgba(200,214,240,0.35)'; x.lineWidth = 1; x.beginPath();
    [0, 1, 2, 3, 0].forEach(function (k, i) { var p = DIPPER[k]; x[i ? 'lineTo' : 'moveTo'](p[0] * size, p[1] * size); });
    [3, 4, 5, 6].forEach(function (k, i) { var p = DIPPER[k]; x[i ? 'lineTo' : 'moveTo'](p[0] * size, p[1] * size); });
    x.stroke();
    DIPPER.forEach(function (p, i) {
      var me = i === gi; x.fillStyle = me ? '#ffffff' : 'rgba(200,214,240,0.6)';
      if (me) { x.shadowColor = '#cfe0ff'; x.shadowBlur = 8; }
      x.beginPath(); x.arc(p[0] * size, p[1] * size, me ? size * 0.07 : size * 0.035, 0, 7); x.fill(); x.shadowBlur = 0;
    });
    return cv;
  };

  /* ------------------------------ DOM 工具 ------------------------------ */
  function h(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  SH.h = h;
  SH.btn = function (label, fn, cls) { var b = h('button', 'le-btn le-btn--sm ' + (cls || ''), U.esc(label)); b.type = 'button'; b.addEventListener('click', fn); return b; };
  function starsHtml(n, max) { var s = ''; for (var i = 0; i < (max || 3); i++) s += '<i class="' + (i < n ? 'on' : '') + '">★</i>'; return '<span class="sh-stars">' + s + '</span>'; }
  SH.starsHtml = starsHtml;
  function task(id) { for (var i = 0; i < SH.TASKS.length; i++) if (SH.TASKS[i].id === id) return SH.TASKS[i]; return null; }
  SH.task = task;

  /* ------------------------------ 关卡运行器 ------------------------------ */
  var run = null;   // { id, n, level, cleanup, hints, done }
  var Q = {};
  function buildQuest() {
    var el = h('section', 'le-hud sh-panel sh-quest'); el.id = 'sh-quest'; el.hidden = true;
    el.innerHTML =
      '<div class="sh-quest__head"><span class="sh-quest__g"></span><div class="sh-quest__ttl"><div class="sh-quest__kicker"></div><div class="sh-quest__q"></div></div>' +
      '<button class="le-close" type="button" aria-label="退出任务">×</button></div>' +
      '<div class="sh-quest__lv"></div>' +
      '<h3 class="sh-quest__title"></h3><p class="sh-say"></p>' +
      '<div class="sh-quest__area"></div>' +
      '<div class="sh-hints"><button type="button" class="sh-hintbtn">💡 提示</button><ol></ol></div>' +
      '<p class="sh-feedback" aria-live="polite"></p>' +
      '<div class="sh-quest__foot"></div>';
    document.body.appendChild(el);
    Q.el = el; Q.g = el.querySelector('.sh-quest__g'); Q.kicker = el.querySelector('.sh-quest__kicker'); Q.q = el.querySelector('.sh-quest__q');
    Q.lv = el.querySelector('.sh-quest__lv'); Q.title = el.querySelector('.sh-quest__title'); Q.say = el.querySelector('.sh-say');
    Q.area = el.querySelector('.sh-quest__area'); Q.hintBtn = el.querySelector('.sh-hintbtn'); Q.hintList = el.querySelector('.sh-hints ol');
    Q.fb = el.querySelector('.sh-feedback'); Q.foot = el.querySelector('.sh-quest__foot');
    el.querySelector('.le-close').addEventListener('click', SH.exit);
    Q.hintBtn.addEventListener('click', function () {
      if (!run || run.hints >= 3) return;
      var LBL = ['方向', '线索', '半步示范'];
      var li = h('li', '', '<b>' + LBL[run.hints] + '</b> ' + U.esc(run.level.hints[run.hints]));
      Q.hintList.appendChild(li); run.hints++;
      Q.hintBtn.textContent = run.hints >= 3 ? '💡 提示已全部打开' : '💡 再给一点提示(' + run.hints + '/3)';
      Q.hintBtn.disabled = run.hints >= 3; snd.glass(660 + run.hints * 110);
    });
  }
  SH.play = function (id, n) {
    var lvls = SH.levels[id]; if (!lvls || !lvls[n - 1]) return;
    if (!P.unlocked(id, n)) { LE.ui.toast('先拿到上一关的 1 颗星,这一关就会打开'); return; }
    SH.exit(true); closeTasks();
    if (LE.ui.closeCard) LE.ui.closeCard(); if (LE.ui.closeSheets) LE.ui.closeSheets();
    var T = task(id), level = lvls[n - 1], G = SH.guide(level.guide || 'tianshu');
    run = { id: id, n: n, level: level, hints: 0, done: false, cleanups: [] };
    Q.el.hidden = false; document.body.classList.add('sh-questing');
    Q.g.innerHTML = ''; Q.g.appendChild(SH.guideIcon(G.id, 40));
    Q.kicker.textContent = G.zh + ' · ' + G.en + ' · 第 ' + n + ' / ' + lvls.length + ' 关';
    Q.q.textContent = T.q;
    Q.lv.innerHTML = lvls.map(function (_, i) { return '<span class="' + (i + 1 === n ? 'is-cur' : '') + '">第 ' + (i + 1) + ' 关 ' + starsHtml(P.stars(id, i + 1)) + '</span>'; }).join('');
    Q.title.textContent = level.title; Q.say.textContent = level.ask;
    Q.area.innerHTML = ''; Q.hintList.innerHTML = ''; Q.fb.textContent = ''; Q.fb.className = 'sh-feedback'; Q.foot.innerHTML = '';
    Q.hintBtn.disabled = false; Q.hintBtn.textContent = '💡 提示';
    var api = {
      area: Q.area, foot: Q.foot, guide: G,
      hintsUsed: function () { return run ? run.hints : 0; },
      say: function (t) { Q.say.textContent = t; },
      feedback: function (msg, kind) { Q.fb.textContent = msg || ''; Q.fb.className = 'sh-feedback' + (kind ? ' is-' + kind : ''); },
      /** 通关:stars 1–3;提示用得多不扣到 0,最少 1 星 */
      done: function (stars, msg) {
        if (!run || run.done) return; run.done = true;
        stars = Math.max(1, Math.min(3, stars)); P.setLevel(id, n, stars);
        Q.fb.innerHTML = '<b class="sh-win">' + starsHtml(stars) + '</b> ' + U.esc(msg || '');
        Q.fb.className = 'sh-feedback is-ok'; snd.chord(523.25);
        Q.lv.querySelectorAll(':scope > span')[n - 1].innerHTML = '第 ' + n + ' 关 ' + starsHtml(P.stars(id, n));
        var next = lvls[n] ? SH.btn('下一关 →', function () { SH.play(id, n + 1); }, 'sh-go') : SH.btn('回到任务列表', function () { SH.exit(); SH.openTasks(); }, 'sh-go');
        Q.foot.appendChild(next);
        if (!lvls[n] && T.bridge) Q.foot.appendChild(h('p', 'sh-bridge', '✦ 星桥:' + U.esc(T.bridge) + '(开放后可直达)'));
      },
      starsBy: function (base) { return Math.max(1, base - (run && run.hints >= 2 ? 1 : 0) - (run && run.hints >= 3 ? 1 : 0)); },
      onLeave: function (fn) { if (run) run.cleanups.push(fn); }
    };
    try { level.mount(api); } catch (e) { console.error('[SH] 关卡加载失败', e); api.feedback('这一关加载出错了,请刷新再试。', 'warn'); }
    snd.glass(784);
  };
  SH.exit = function (silent) {
    if (run) { run.cleanups.forEach(function (f) { try { f(); } catch (e) {} }); }
    run = null; snd.humStop();
    if (Q.el) Q.el.hidden = true; document.body.classList.remove('sh-questing');
    if (!silent && LE.scene.mode !== 'earth' && SH._returnEarth) { SH._returnEarth = false; LE.ui.setMode('earth'); }
  };
  SH.running = function () { return run; };

  /* ------------------------------ 任务列表 ------------------------------ */
  var TL = {};
  function buildTasks() {
    var el = h('section', 'le-hud sh-panel sh-tasks'); el.id = 'sh-tasks'; el.hidden = true;
    el.innerHTML = '<div class="le-sheet__head"><h2>任务 <small>QUESTS</small></h2><span class="le-tag">星域 I · 家园</span><button class="le-close" type="button" aria-label="关闭">×</button></div><div class="sh-tasks__g"></div><div class="sh-tasks__list"></div>';
    document.body.appendChild(el);
    TL.el = el; TL.list = el.querySelector('.sh-tasks__list');
    el.querySelector('.le-close').addEventListener('click', closeTasks);
    var g = el.querySelector('.sh-tasks__g'), G = SH.guide('tianshu');
    g.appendChild(SH.guideIcon('tianshu', 48));
    g.appendChild(h('p', 'sh-say', '<b>' + G.zh + '</b>:' + U.esc(G.line)));
  }
  function drawTasks() {
    TL.list.innerHTML = '';
    SH.TASKS.forEach(function (T) {
      var lv = SH.levels[T.id] || [], row = h('div', 'sh-task' + (T.open ? '' : ' is-locked'));
      var diff = '★★★'.slice(0, T.diff) + '<span>' + '★★★'.slice(T.diff) + '</span>';
      row.innerHTML = '<div class="sh-task__q"><b>' + U.esc(T.q) + '</b><em class="sh-diff">' + diff + '</em></div>';
      if (!T.open) { row.appendChild(h('p', 'sh-task__soon', '即将开放 · 星桥 → ' + U.esc(T.bridge))); TL.list.appendChild(row); return; }
      var lvRow = h('div', 'sh-task__lv');
      lv.forEach(function (L, i) {
        var n = i + 1, ok = P.unlocked(T.id, n);
        var b = h('button', 'sh-lvbtn' + (ok ? '' : ' is-locked'), '<span>第 ' + n + ' 关</span><b>' + U.esc(L.title) + '</b>' + starsHtml(P.stars(T.id, n)));
        b.type = 'button'; b.addEventListener('click', function () { SH.play(T.id, n); });
        lvRow.appendChild(b);
      });
      row.appendChild(lvRow); TL.list.appendChild(row);
    });
  }
  SH.openTasks = function () { if (LE.ui.closeSheets) LE.ui.closeSheets(); drawTasks(); TL.el.hidden = false; document.body.classList.add('sh-side'); };
  function closeTasks() { if (TL.el) TL.el.hidden = true; document.body.classList.remove('sh-side'); }
  SH.closeTasks = closeTasks;

  /* ------------------------------ 航图 v0 ------------------------------ */
  var M = {};
  function buildMap() {
    var el = h('section', 'sh-map'); el.id = 'sh-map'; el.hidden = true;
    el.innerHTML = '<div class="sh-map__bar le-hud"><div><div class="le-kicker">STARHELM · ATLAS</div><h2>航图 <small>七星域</small></h2><p class="sh-map__sum"></p></div><button class="le-close" type="button" aria-label="关闭">×</button></div>' +
      '<canvas></canvas><div class="sh-map__tip le-hud" hidden></div>';
    document.body.appendChild(el);
    M.el = el; M.cv = el.querySelector('canvas'); M.tip = el.querySelector('.sh-map__tip'); M.sum = el.querySelector('.sh-map__sum');
    el.querySelector('.le-close').addEventListener('click', function () { el.hidden = true; });
    M.cv.addEventListener('click', function (e) { mapTap(e.clientX, e.clientY); });
    window.addEventListener('resize', function () { if (!el.hidden) drawMap(); });
  }
  function mapLayout() {
    var W = innerWidth, H = innerHeight, cx = W / 2, cy = H / 2 + (W < 640 ? 40 : 30);
    var R = W < 640 ? Math.min(W / 2 - 40, (H - 300) / 2) : Math.min(W, H - 120) / 2 - 20;
    // 已开放的星域 I 占内圈大半(给知识星留位置),II–VII 依次排在外圈
    return { W: W, H: H, cx: cx, cy: cy, ring: function (n) { return W < 640 ? (n === 1 ? R * 0.66 : R * (0.76 + (n - 2) * 0.048)) : (n === 1 ? R * 0.46 : R * (0.6 + (n - 2) * 0.08)); } };
  }
  function drawMap() {
    var pr = Math.min(2, window.devicePixelRatio || 1), L = mapLayout(), cv = M.cv;
    cv.width = L.W * pr; cv.height = L.H * pr; cv.style.width = L.W + 'px'; cv.style.height = L.H + 'px';
    var x = cv.getContext('2d'); x.setTransform(pr, 0, 0, pr, 0, 0); x.clearRect(0, 0, L.W, L.H);
    var bg = x.createRadialGradient(L.cx, L.cy, 10, L.cx, L.cy, Math.max(L.W, L.H) / 1.2);
    bg.addColorStop(0, '#141c45'); bg.addColorStop(1, '#03050f'); x.fillStyle = bg; x.fillRect(0, 0, L.W, L.H);
    M.hits = [];
    SH.DOMAINS.forEach(function (D) {
      var r = L.ring(D.n);
      x.setLineDash(D.open ? [] : [3, 6]); x.lineWidth = D.open ? 1.4 : 1;
      x.strokeStyle = D.open ? 'rgba(214,226,255,0.55)' : 'rgba(150,165,210,0.22)';
      x.beginPath(); x.arc(L.cx, L.cy, r, 0, 7); x.stroke(); x.setLineDash([]);
      var G = SH.guide(D.guide), a = -Math.PI / 2 - 0.42, narrow = L.W < 640;
      var lx = L.cx + Math.cos(a) * r, ly = L.cy + Math.sin(a) * r;
      x.font = '600 12px ' + getComputedStyle(document.body).fontFamily; x.textAlign = 'right';
      if (D.n === 1) { lx = L.cx + 6 + (x.measureText('I 家园 · 天枢').width / 2); ly = L.cy + 36; }
      else if (narrow) { x.textAlign = 'left'; lx = 14; ly = L.H - 14 - (7 - D.n) * 30; }
      x.fillStyle = D.open ? '#e8eeff' : 'rgba(170,182,220,0.55)';
      x.fillText(['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII'][D.n] + ' ' + D.zh + ' · ' + G.zh + (D.open ? '' : ' · 即将点亮'), narrow && D.n > 1 ? lx : lx - 6, ly);
      x.font = '10px ' + getComputedStyle(document.body).fontFamily; x.fillStyle = 'rgba(170,182,220,0.45)';
      x.fillText('约 10^' + D.scale + ' 米', narrow && D.n > 1 ? lx : lx - 6, ly + 13);
      M.hits.push({ x: narrow && D.n > 1 ? lx + 60 : lx - 60, y: ly - 4, r: 40, domain: D });
    });
    // 中心:你
    x.fillStyle = '#9fffd0'; x.shadowColor = '#5dffb0'; x.shadowBlur = 12; x.beginPath(); x.arc(L.cx, L.cy, 4, 0, 7); x.fill(); x.shadowBlur = 0;
    x.font = '600 12px sans-serif'; x.textAlign = 'center'; x.fillStyle = '#c8ffe6'; x.fillText('你', L.cx, L.cy + 18);
    // 知识星
    var lit = 0, tot = 0;
    [1, 2].forEach(function (d) {
      var list = SH.STARS.filter(function (s) { return s.d === d; }), r = L.ring(d);
      list.forEach(function (s, i) {
        var a = (d === 1 ? -Math.PI / 2 + 0.3 : 1.9) + (i / Math.max(1, list.length)) * Math.PI * (d === 1 ? 2 : 0.3);
        var sx = L.cx + Math.cos(a) * r, sy = L.cy + Math.sin(a) * r, on = P.lit(s); tot++; if (on) lit++;
        if (on) { x.fillStyle = '#ffffff'; x.shadowColor = '#cfe0ff'; x.shadowBlur = 14; } else x.fillStyle = 'rgba(160,175,215,0.35)';
        x.beginPath(); x.arc(sx, sy, on ? 4.2 : 2.6, 0, 7); x.fill(); x.shadowBlur = 0;
        if (on || (d === 1 && L.W >= 640)) { var out = i % 2 ? 1 : -1, tx = L.cx + Math.cos(a) * (r + out * 16), ty = L.cy + Math.sin(a) * (r + out * 16) + 4;
          x.font = '11px sans-serif'; x.textAlign = 'center'; x.fillStyle = on ? 'rgba(232,238,255,0.95)' : 'rgba(160,175,215,0.45)'; x.fillText(s.zh, tx, ty); }
        M.hits.push({ x: sx, y: sy, r: 16, star: s, on: on });
      });
    });
    M.sum.textContent = '已点亮 ' + lit + ' / ' + tot + ' 颗知识星 · 由近及远七个星域,圈越大、尺度越大(对数刻度)';
  }
  function mapTap(cx, cy) {
    var best = null;
    (M.hits || []).forEach(function (t) { var d = Math.hypot(t.x - cx, t.y - cy); if (d < t.r && (!best || d < best.d)) best = { t: t, d: d }; });
    if (!best) { M.tip.hidden = true; return; }
    var t = best.t, html;
    if (t.star) {
      var b = t.star.by.split(':'), src;
      if (b[0] === 'explore') src = { shells: '打开「轨道分层」图层', pass: '查看空间站过境预报', subsolar: '点一下地球上的太阳直射点', moon: '点一下月球' }[b[1]];
      else if (b[0] === 'task') src = '任务「' + (task(b[1]) || {}).q + '」(即将开放)';
      else src = '任务「' + task(b[0]).q + '」第 ' + b[1] + ' 关';
      html = '<b>' + U.esc(t.star.zh) + '</b> ' + (t.on ? '<span class="le-tag">已点亮</span>' : '<span class="le-tag is-warn">未点亮</span>') + '<p>来自:' + U.esc(src) + '</p>' + (t.star.bridge ? '<p>✦ 星桥 → ' + U.esc(t.star.bridge) + '</p>' : '');
    } else {
      var D = t.domain, G = SH.guide(D.guide);
      html = '<b>星域 ' + D.n + ' · ' + U.esc(D.zh) + '</b><p>' + U.esc(D.blurb) + '</p><p><i>' + U.esc(G.zh) + ':' + U.esc(G.line) + '</i></p>';
    }
    M.tip.innerHTML = html; M.tip.hidden = false;
  }
  SH.openMapOld = function () { closeTasks(); M.el.hidden = false; M.tip.hidden = true; drawMap(); snd.glass(523.25); };

  /* ------------------------------ 卡片上的向导提问 ------------------------------ */
  SH.cardAsk = function (kind) {
    var a = SH.ASK[kind]; if (!a) return;
    var card = $('card'); if (!card) return;
    var old = card.querySelector('.sh-cardask'); if (old) old.remove();
    var box = h('div', 'sh-cardask');
    box.appendChild(SH.guideIcon(kind === 'moon' ? 'tianxuan' : 'tianshu', 28));
    box.appendChild(h('p', '', U.esc(a.q)));
    var blurb = $('card-blurb'); blurb.parentNode.insertBefore(box, blurb.nextSibling);
    if (a.task) {
      var T = task(a.task), act = $('card-actions');
      if (T && T.open) act.insertBefore(SH.btn('★ 进入任务', function () { SH.play(T.id, firstOpenLevel(T.id)); }), act.firstChild);
      else if (T) box.appendChild(h('small', '', '对应任务「' + T.q + '」即将开放'));
    }
  };
  function firstOpenLevel(id) { var L = SH.levels[id] || []; for (var i = 0; i < L.length; i++) if (P.stars(id, i + 1) < 1) return i + 1; return 1; }

  SH.openMap = function () { closeTasks(); if (SH.voyEnter) SH.voyEnter(); };
  /* ------------------------------ 初始化 ------------------------------ */
  SH.initCore = function () {
    buildQuest(); buildTasks(); buildMap();
    var _show = LE.ui.showCard;   // 每张新卡片先清掉上一张的向导提问
    LE.ui.showCard = function (c) { var o = document.querySelector('#card .sh-cardask'); if (o) o.remove(); _show(c); };
    var nav = document.querySelector('.le-actions');
    var bQ = h('button', 'le-btn le-btn--hero sh-btn-quest', '<span class="le-btn__ico">★</span><span class="le-btn__txt">任务<small>QUESTS</small></span>'); bQ.type = 'button';
    var bM = h('button', 'le-btn sh-btn-map', '<span class="le-btn__ico">✧</span><span class="le-btn__txt">航图<small>ATLAS</small></span>'); bM.type = 'button';
    bQ.addEventListener('click', function () { if (TL.el.hidden) SH.openTasks(); else closeTasks(); });
    nav.insertBefore(bQ, nav.children[1]);   // 10-21:母港「航图 ATLAS」按钮与旧航图页已取消,航图改在飞船星图台打开
    LE.bus.on('select', function (e) { setTimeout(function () { SH.cardAsk(e.kind); }, 0); });
    P.on(function () { if (!TL.el.hidden) drawTasks(); if (!M.el.hidden) drawMap(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { if (!M.el.hidden) M.el.hidden = true; else closeTasks(); } });
  };
})();
