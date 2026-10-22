/* =====================================================================
 * 天枢 Starhelm · le-audio.js(M1.5 起按《创世计划 Genesis 声音设计指南 v1.0》重做)
 * LE.audio:播放 audio/ 下的原创合成音频(源码 audio/synth.py,numpy+scipy 纯程序合成,无采样)。
 *  - 调式 D 利底亚(与门户同调),音色:钟声 + 深空垫;背景音乐「天枢 · 深空巡航」96 秒无缝循环。
 *  - 声音默认关闭;偏好存 localStorage「gn:sh:_pref」({music, sfx}),全部 try/catch。
 *  - 只在用户手势后创建 AudioContext,并在此时才下载音频;切到后台淡出并挂起。
 *  - 同一音效 80ms 内不重复;本世界没有悬停音效(触屏也就不会误触发)。
 *  - 声音即规律:七星域越远音越高;引擎越接近「猜想」音色越飘;
 *    太阳系时间加速与星际航行时的嗡鸣,音高/亮度随速度(取对数)升高 —— 这两种连续变化的声音实时合成。
 * ===================================================================== */
(function () {
  'use strict';
  var LE = window.LE;
  var A = (LE.audio = { music: false, sfx: false, started: false });
  var PKEY = 'gn:sh:_pref';
  var BASE = 'audio/';
  var NAMES = ['click', 'tick', 'blip', 'toggle-on', 'toggle-off', 'select', 'lock', 'whoosh', 'boom', 'open', 'close', 'unlock', 'soft', 'arrive',
    'sector-1', 'sector-2', 'sector-3', 'sector-4', 'sector-5', 'sector-6', 'sector-7', 'sector-8', 'ignite-1', 'ignite-2', 'ignite-3'];
  var ctx, comp, musicGain, sfxGain, buf = {}, musicBuf = null, musicSrc = null, loading = false, last = {}, noiseBuf;

  /* ---------- 偏好 ---------- */
  function readPref() {
    try { var p = JSON.parse(localStorage.getItem(PKEY) || 'null'); if (p) { A.music = !!p.music; A.sfx = !!p.sfx; return; } } catch (e) { }
    // 旧版本迁移:只迁移用户曾主动打开的开关
    try { if (LE.settings && LE.settings.get('music') === true) A.music = true; } catch (e) { }
  }
  function savePref() { try { localStorage.setItem(PKEY, JSON.stringify({ music: A.music ? 1 : 0, sfx: A.sfx ? 1 : 0 })); } catch (e) { } }
  readPref();

  /* ---------- 音频图 ---------- */
  function setup() {
    var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
    try { ctx = new AC(); } catch (e) { return false; }
    comp = ctx.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 3; comp.connect(ctx.destination);
    musicGain = ctx.createGain(); musicGain.gain.value = 0; musicGain.connect(ctx.destination);
    sfxGain = ctx.createGain(); sfxGain.gain.value = 0.7; sfxGain.connect(comp);
    var n = ctx.sampleRate * 4; noiseBuf = ctx.createBuffer(1, n, ctx.sampleRate);
    var d = noiseBuf.getChannelData(0), l = 0; for (var i = 0; i < n; i++) { var w = Math.random() * 2 - 1; l = (l + 0.02 * w) / 1.02; d[i] = l * 3.5; }
    return true;
  }
  function fetchBuf(name) {
    return fetch(BASE + name + '.m4a').then(function (r) { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
      .then(function (ab) { return new Promise(function (res, rej) { ctx.decodeAudioData(ab, res, rej); }); });
  }
  function loadSfx() {
    if (loading) return; loading = true;
    NAMES.forEach(function (n) { fetchBuf(n).then(function (b) { buf[n] = b; }).catch(function () { }); });
  }
  function loadMusic() {
    if (musicBuf || A._mLoading) return Promise.resolve(musicBuf); A._mLoading = true;
    return fetchBuf('music-starhelm-loop').then(function (b) { musicBuf = b; return b; }).catch(function () { A._mLoading = false; return null; });
  }

  /* ---------- 背景音乐 ---------- */
  function setMusic(on) {
    A.music = on; savePref(); if (!ctx) return;
    var t = ctx.currentTime;
    if (on) {
      loadMusic().then(function (b) {
        if (!b || !A.music) return;
        if (!musicSrc) { musicSrc = ctx.createBufferSource(); musicSrc.buffer = b; musicSrc.loop = true; musicSrc.loopEnd = 96; musicSrc.connect(musicGain); musicSrc.start(); }
        musicGain.gain.cancelScheduledValues(ctx.currentTime); musicGain.gain.setValueAtTime(musicGain.gain.value, ctx.currentTime);
        musicGain.gain.linearRampToValueAtTime(A._duck ? 0.06 : 0.35, ctx.currentTime + 2);
      });
    } else { musicGain.gain.cancelScheduledValues(t); musicGain.gain.setValueAtTime(musicGain.gain.value, t); musicGain.gain.linearRampToValueAtTime(0, t + 0.6); }
  }
  A.duck = function (on) { A._duck = !!on; if (ctx && A.music) musicGain.gain.setTargetAtTime(on ? 0.06 : 0.35, ctx.currentTime, 0.3); };

  /* ---------- 音效 ---------- */
  function play(name, opt) {
    if (!ctx || !A.sfx || !A.started) return;
    var b = buf[name]; if (!b) return;
    var now = performance.now(); if (last[name] && now - last[name] < 80) return; last[name] = now;
    var s = ctx.createBufferSource(); s.buffer = b; if (opt && opt.rate) s.playbackRate.value = opt.rate;
    var g = ctx.createGain(); g.gain.value = opt && opt.gain != null ? opt.gain : 1; s.connect(g); g.connect(sfxGain); s.start();
  }
  var MAP = {
    click: function () { play('click'); },
    toggle: function (on) { play(on ? 'toggle-on' : 'toggle-off'); },
    lock: function () { play('lock'); },
    // v1.0-M1b(王磊 10-22:一镜到底音效太吓人)→ 改为本机合成的柔和「星海涌动」:慢起慢落的滤波噪声 + 空五度长音,不再用 whoosh/boom 采样
    whoosh: function (dur) { swell(typeof dur === 'number' ? dur : (dur && dur.dur) || 2.4); },
    boom: function () { softBoom(); }
  };
  function env(g, t, peak, up, len) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + up);
    g.gain.setTargetAtTime(0.0001, t + up, Math.max(0.2, (len - up) / 3.2));
  }
  function swell(dur) {
    if (!ctx || !A.sfx || !A.started || !noiseBuf) return;
    var now = performance.now(); if (last._sw && now - last._sw < 600) return; last._sw = now;
    dur = Math.max(1.6, Math.min(6, dur || 2.4));
    var t = ctx.currentTime + 0.02, up = Math.min(1.6, dur * 0.4), end = t + dur + 1.5;
    var out = ctx.createGain(); env(out, t, 0.32, up, dur); out.connect(sfxGain);
    // 星风:低通噪声,截止频率缓慢升起再落下
    var n = ctx.createBufferSource(); n.buffer = noiseBuf; n.loop = true;
    var f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.Q.value = 0.6;
    f.frequency.setValueAtTime(160, t); f.frequency.exponentialRampToValueAtTime(720, t + up); f.frequency.exponentialRampToValueAtTime(200, t + dur);
    var ng = ctx.createGain(); ng.gain.value = 0.55; n.connect(f); f.connect(ng); ng.connect(out);
    // 空五度长音(A2 + E3 + A3 轻微失谐),像远处的星海和声
    [[110, 0.10], [164.81, 0.07], [220.6, 0.045], [329.2, 0.02]].forEach(function (p) {
      var o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = p[0];
      var og = ctx.createGain(); og.gain.value = p[1]; o.connect(og); og.connect(out); o.start(t); o.stop(end);
    });
    n.start(t); n.stop(end);
  }
  function softBoom() {
    if (!ctx || !A.sfx || !A.started || !noiseBuf) return;
    var t = ctx.currentTime + 0.02, end = t + 3;
    var out = ctx.createGain(); env(out, t, 0.22, 0.35, 2.2); out.connect(sfxGain);
    var o = ctx.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(82, t); o.frequency.exponentialRampToValueAtTime(55, t + 2);
    o.connect(out); o.start(t); o.stop(end);
    var n = ctx.createBufferSource(); n.buffer = noiseBuf; var f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 140;
    var ng = ctx.createGain(); ng.gain.value = 0.25; n.connect(f); f.connect(ng); ng.connect(out); n.start(t); n.stop(end);
  }
  A.swell = swell;
  A.play = function (name, arg) { try { if (MAP[name]) MAP[name](arg); else play(name, arg); } catch (e) { } };

  /* ---------- 连续变化的声音:嗡鸣(实时合成,随速度变化) ---------- */
  var hum = null, voyLvl = 0;
  A.setVoyageHum = function (lvl) { voyLvl = Math.max(0, Math.min(1, lvl || 0)); updateHum(); };
  function updateHum() {
    if (!ctx || !A.started) return;
    var sp = LE.solar && LE.solar.speed || 1;
    var solar = document.body.dataset.mode === 'solar' && sp > 1 ? Math.min(1, Math.log10(sp) / 6.5) : 0;
    var lvl = A.sfx ? Math.max(solar, voyLvl) : 0;
    if (!hum && lvl === 0) return;
    if (!hum) {
      var n = ctx.createBufferSource(); n.buffer = noiseBuf; n.loop = true;
      var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 200;
      var o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 36.7;   // D1
      var og = ctx.createGain(); og.gain.value = 0.08; o.connect(og); og.connect(lp);
      var g = ctx.createGain(); g.gain.value = 0; n.connect(lp); lp.connect(g); g.connect(sfxGain);
      n.start(); o.start(); hum = { g: g, lp: lp, o: o };
    }
    var t = ctx.currentTime;
    hum.g.gain.setTargetAtTime(lvl * 0.35, t, 0.4);
    hum.lp.frequency.setTargetAtTime(160 + lvl * 1400, t, 0.4);
    hum.o.frequency.setTargetAtTime(36.7 * Math.pow(2, lvl * 1.5), t, 0.4);   // D1 往上,速度越快越高
  }

  /* ---------- 启动 / 后台 ---------- */
  function start() {
    if (A.started) return true;
    if (!ctx && !setup()) return false;
    if (ctx.state === 'suspended') ctx.resume();
    A.started = true; loadSfx(); setMusic(A.music);
    return true;
  }
  document.addEventListener('visibilitychange', function () {
    if (!ctx) return; var t = ctx.currentTime;
    if (document.hidden) { musicGain.gain.setTargetAtTime(0, t, 0.2); setTimeout(function () { if (document.hidden) ctx.suspend(); }, 700); }
    else { ctx.resume().then(function () { if (A.music) setMusic(true); }); }
  });

  A.init = function () {
    var bm = document.getElementById('btn-music'), bs = document.getElementById('btn-sfx');
    function sync() { if (bm) bm.setAttribute('aria-pressed', A.music ? 'true' : 'false'); if (bs) bs.setAttribute('aria-pressed', A.sfx ? 'true' : 'false'); }
    sync();
    // 已开启声音的回访者:第一次手势时才创建 AudioContext;默认关闭的用户什么都不加载
    var first = function () { if (A.music || A.sfx) start(); window.removeEventListener('pointerdown', first, true); window.removeEventListener('keydown', first, true); };
    window.addEventListener('pointerdown', first, true); window.addEventListener('keydown', first, true);
    if (bm) bm.addEventListener('click', function (e) { e.stopPropagation(); start(); setMusic(!A.music); sync(); });
    if (bs) bs.addEventListener('click', function (e) {
      e.stopPropagation(); A.sfx = !A.sfx; savePref(); start(); sync();
      if (A.sfx) setTimeout(function () { A.play('toggle', true); }, 250); else updateHum();
    });
    document.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('button, .le-list li');
      if (!b || b.closest('.le-sound') || b.closest('.voy')) return;   // 航行界面自己管声音
      if (b.classList.contains('le-chip') && b.hasAttribute('aria-pressed')) A.play('toggle', b.getAttribute('aria-pressed') === 'true');
      else A.play('click');
    }, true);
    LE.bus.on('cinematic:start', function () { A.play('whoosh', 5.4); });
    LE.bus.on('cinematic:end', function () { A.play('lock'); });
    LE.bus.on('select', function (e) { if (e.kind === 'planet') { A.play('whoosh', 2.6); setTimeout(function () { A.play('lock'); }, 1800); } else if (e.kind === 'quake') A.play('lock'); });
    LE.bus.on('mode:changed', function () { A.play('whoosh', 3.2); });
    setInterval(updateHum, 400);
  };
})();
