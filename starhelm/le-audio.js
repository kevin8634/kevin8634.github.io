/* =====================================================================
 * Live Earth 2.2 · le-audio.js
 * LE.audio：全部用 Web Audio 实时合成，零音频文件、零版权问题
 *  背景音乐（生成式太空氛围，类似星空 App 的漂浮感）：
 *   - 慢速和弦铺底：D 利底亚调式 4 个和弦循环，每个 14 秒，交叉淡入淡出
 *   - 每个音 = 正弦 + 微失谐三角波 → 低通（缓慢呼吸的 LFO）→ 长混响
 *   - 低频 D 持续音 + “宇宙风”噪声（带通缓慢扫频）
 *   - 随机高音“星光”铃音（五声音阶），几乎全进混响
 *  音效：按钮点击、开关、镜头飞行呼啸、目标锁定、太阳系时间加速时的轨道嗡鸣
 *  浏览器要求用户先交互才能出声：第一次点击页面时创建 AudioContext 并开始播放背景音乐。
 * ===================================================================== */
(function () {
  'use strict';
  var LE = window.LE;
  var A = (LE.audio = { music: false, sfx: true, started: false });   // 天枢 Starhelm:背景音乐默认关,用户手动开启后记住
  var ctx, master, musicBus, sfxBus, reverb, wet, noiseBuf;

  function store(k, v) { if (v === undefined) { var x = LE.settings.get(k); return x === undefined ? null : (x ? '1' : '0'); } LE.settings.set(k, v === '1'); }
  if (store('music') === '1') A.music = true;
  if (store('sfx') === '0') A.sfx = false;

  /* ------------------------------ 基础图 ------------------------------ */
  function impulse(sec, decay) {
    var n = ctx.sampleRate * sec, b = ctx.createBuffer(2, n, ctx.sampleRate);
    for (var c = 0; c < 2; c++) { var d = b.getChannelData(c); for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, decay); }
    return b;
  }
  function makeNoise() {
    var n = ctx.sampleRate * 4, b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0), last = 0;
    for (var i = 0; i < n; i++) { var w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }   // 棕噪声，柔和
    return b;
  }
  function setup() {
    var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
    ctx = new AC();
    master = ctx.createDynamicsCompressor(); master.threshold.value = -18; master.ratio.value = 3; master.connect(ctx.destination);
    reverb = ctx.createConvolver(); reverb.buffer = impulse(6, 2.6);
    wet = ctx.createGain(); wet.gain.value = 0.9; reverb.connect(wet); wet.connect(master);
    musicBus = ctx.createGain(); musicBus.gain.value = 0; musicBus.connect(master);
    sfxBus = ctx.createGain(); sfxBus.gain.value = A.sfx ? 0.55 : 0; sfxBus.connect(master);
    noiseBuf = makeNoise();
    return true;
  }
  function send(node, dry, wetAmt, bus) {
    var d = ctx.createGain(); d.gain.value = dry; node.connect(d); d.connect(bus);
    var w = ctx.createGain(); w.gain.value = wetAmt; node.connect(w); w.connect(reverb);
    // 混响也要跟随所属总线的音量：把湿声单独经过一个跟随增益
    return { dry: d, wet: w };
  }

  /* ------------------------------ 背景音乐 ------------------------------ */
  var mtof = function (m) { return 440 * Math.pow(2, (m - 69) / 12); };
  // D 利底亚：Dmaj9 → Bm11 → Gmaj7(#11) → Aadd9/E —— 明亮、悬浮、不落地
  var CHORDS = [[50, 57, 64, 66, 69], [47, 54, 61, 62, 66], [43, 50, 54, 61, 64], [45, 52, 59, 61, 64]];
  var PENTA = [74, 76, 78, 81, 83, 86, 88, 90, 93];
  var musicNodes = [], chordIdx = 0, chordTimer = null, bellTimer = null, padWet;

  function padNote(m, t0, dur) {
    var g = ctx.createGain(); g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(0.055, t0 + 5); g.gain.setValueAtTime(0.055, t0 + dur - 6); g.gain.linearRampToValueAtTime(0, t0 + dur);
    var f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 700 + Math.random() * 500; f.Q.value = 0.4;
    var lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 0.05 + Math.random() * 0.05; lg.gain.value = 350; lfo.connect(lg); lg.connect(f.frequency);
    var o1 = ctx.createOscillator(); o1.type = 'sine'; o1.frequency.value = mtof(m);
    var o2 = ctx.createOscillator(); o2.type = 'triangle'; o2.frequency.value = mtof(m); o2.detune.value = (Math.random() < 0.5 ? -1 : 1) * (5 + Math.random() * 5);
    var o2g = ctx.createGain(); o2g.gain.value = 0.45;
    o1.connect(f); o2.connect(o2g); o2g.connect(f); f.connect(g);
    g.connect(musicBus); g.connect(padWet);
    [o1, o2, lfo].forEach(function (o) { o.start(t0); o.stop(t0 + dur + 0.5); });
  }
  function playChord() {
    var t = ctx.currentTime + 0.05, ch = CHORDS[chordIdx++ % CHORDS.length];
    ch.forEach(function (m, i) { padNote(m, t + i * 0.35, 20); });
    chordTimer = setTimeout(playChord, 14000);
  }
  function bell() {
    if (!A.music || !A.started) return;
    var t = ctx.currentTime + 0.02, m = PENTA[Math.floor(Math.random() * PENTA.length)];
    var o = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine'; o.frequency.value = mtof(m); o2.type = 'sine'; o2.frequency.value = mtof(m) * 2.76;   // 非谐泛音 → 钟声质感
    var g2 = ctx.createGain(); g2.gain.value = 0.18; o2.connect(g2); g2.connect(g); o.connect(g);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.03, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0005, t + 4.5);
    var pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    if (pan) { pan.pan.value = Math.random() * 1.6 - 0.8; g.connect(pan); pan.connect(padWet); var d = ctx.createGain(); d.gain.value = 0.25; pan.connect(d); d.connect(musicBus); }
    else { g.connect(padWet); }
    o.start(t); o2.start(t); o.stop(t + 5); o2.stop(t + 5);
    bellTimer = setTimeout(bell, 2500 + Math.random() * 6000);
  }
  function startMusic() {
    padWet = ctx.createGain(); padWet.gain.value = 1.1; padWet.connect(reverb);
    // 湿声同样受 musicBus 开关影响：通过一个跟随增益
    var follow = ctx.createGain(); follow.gain.value = 0; padWet.disconnect(); padWet.connect(follow); follow.connect(reverb);
    A._padFollow = follow;
    // 低频持续音
    var sub = ctx.createOscillator(), sg = ctx.createGain(); sub.type = 'sine'; sub.frequency.value = mtof(38); sg.gain.value = 0.05;
    sub.connect(sg); sg.connect(musicBus); sub.start();
    // 宇宙风
    var n = ctx.createBufferSource(); n.buffer = noiseBuf; n.loop = true;
    var bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 500; bp.Q.value = 0.8;
    var lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 0.03; lg.gain.value = 380; lfo.connect(lg); lg.connect(bp.frequency);
    var ng = ctx.createGain(); ng.gain.value = 0.05; n.connect(bp); bp.connect(ng); ng.connect(musicBus); ng.connect(follow);
    n.start(); lfo.start();
    playChord(); bellTimer = setTimeout(bell, 4000);
  }
  function setMusic(on) {
    A.music = on; store('music', on ? '1' : '0');
    if (!ctx) return;
    var t = ctx.currentTime;
    [musicBus.gain, A._padFollow && A._padFollow.gain].forEach(function (p) {
      if (!p) return; p.cancelScheduledValues(t); p.setValueAtTime(p.value, t); p.linearRampToValueAtTime(on ? (p === musicBus.gain ? 0.75 : 0.6) : 0, t + (on ? 4 : 1.2));
    });
    if (on && !bellTimer) bell();
  }

  /* ------------------------------ 音效 ------------------------------ */
  function env(g, t, a, peak, d) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); }
  function tone(type, f0, f1, t, a, peak, d, wetAmt) {
    var o = ctx.createOscillator(), g = ctx.createGain(); o.type = type;
    o.frequency.setValueAtTime(f0, t); if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + a + d);
    env(g, t, a, peak, d); o.connect(g); send(g, 1, wetAmt || 0.15, sfxBus);
    o.start(t); o.stop(t + a + d + 0.05);
  }
  var SFX = {
    click: function () { var t = ctx.currentTime; tone('sine', 1500, 900, t, 0.004, 0.18, 0.07, 0.1); tone('triangle', 3200, 2400, t, 0.002, 0.03, 0.03, 0); },
    toggle: function (on) { var t = ctx.currentTime; tone('sine', on ? 660 : 990, null, t, 0.005, 0.12, 0.08); tone('sine', on ? 990 : 660, null, t + 0.07, 0.005, 0.12, 0.12, 0.2); },
    lock: function () { var t = ctx.currentTime; [880, 1318.5, 1760].forEach(function (f, i) { tone('sine', f, null, t + i * 0.06, 0.006, 0.09, 0.9, 0.5); }); },
    whoosh: function (dur) {
      dur = dur || 3; var t = ctx.currentTime;
      var n = ctx.createBufferSource(); n.buffer = noiseBuf; n.loop = true;
      var bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.2;
      bp.frequency.setValueAtTime(220, t); bp.frequency.exponentialRampToValueAtTime(1800, t + dur * 0.55); bp.frequency.exponentialRampToValueAtTime(300, t + dur);
      var g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.5, t + dur * 0.45); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      n.connect(bp); bp.connect(g); send(g, 1, 0.5, sfxBus); n.start(t); n.stop(t + dur + 0.1);
      // 低频推进感
      tone('sine', 55, 90, t, dur * 0.5, 0.25, dur * 0.5, 0.3);
    },
    boom: function () { var t = ctx.currentTime; tone('sine', 120, 38, t, 0.01, 0.4, 1.4, 0.6); }
  };
  A.play = function (name, arg) { if (!ctx || !A.sfx || !A.started) return; try { SFX[name](arg); } catch (e) { /* 忽略 */ } };

  /* ---------- 太阳系时间加速：轨道“嗡鸣”，速度越快越亮 ---------- */
  var hum = null;
  function updateHum() {
    if (!ctx || !A.started) return;
    var sp = LE.solar && LE.solar.speed || 1, on = A.sfx && document.body.dataset.mode === 'solar' && sp > 1;
    if (!hum) {
      var n = ctx.createBufferSource(); n.buffer = noiseBuf; n.loop = true;
      var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 200;
      var o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 55;
      var og = ctx.createGain(); og.gain.value = 0.08; o.connect(og); og.connect(lp);
      var g = ctx.createGain(); g.gain.value = 0; n.connect(lp); lp.connect(g); send(g, 1, 0.4, sfxBus);
      n.start(); o.start(); hum = { g: g, lp: lp, o: o };
    }
    var lvl = on ? Math.min(1, Math.log10(sp) / 6.5) : 0, t = ctx.currentTime;
    hum.g.gain.setTargetAtTime(lvl * 0.35, t, 0.6);
    hum.lp.frequency.setTargetAtTime(160 + lvl * 1400, t, 0.6);
    hum.o.frequency.setTargetAtTime(45 + lvl * 40, t, 0.6);
  }

  /* ------------------------------ 绑定 ------------------------------ */
  function start() {
    if (A.started) return;
    if (!ctx && !setup()) return;
    if (ctx.state === 'suspended') ctx.resume();
    A.started = true;
    startMusic();
    setMusic(A.music);
  }
  A.init = function () {
    var bm = document.getElementById('btn-music'), bs = document.getElementById('btn-sfx');
    function sync() { if (bm) bm.setAttribute('aria-pressed', A.music ? 'true' : 'false'); if (bs) bs.setAttribute('aria-pressed', A.sfx ? 'true' : 'false'); }
    sync();
    // 第一次与页面交互：启动音频（浏览器自动播放策略要求）
    var first = function () { start(); sync(); window.removeEventListener('pointerdown', first, true); window.removeEventListener('keydown', first, true); };
    window.addEventListener('pointerdown', first, true); window.addEventListener('keydown', first, true);
    if (bm) bm.addEventListener('click', function (e) { e.stopPropagation(); start(); setMusic(!A.music); sync(); });
    if (bs) bs.addEventListener('click', function (e) {
      e.stopPropagation(); start(); A.sfx = !A.sfx; store('sfx', A.sfx ? '1' : '0');
      sfxBus.gain.setTargetAtTime(A.sfx ? 0.55 : 0, ctx.currentTime, 0.05); sync(); if (A.sfx) SFX.toggle(true);
    });
    // 所有按钮的点击声（声音开关自己除外）
    document.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('button, .le-list li');
      if (!b || b.closest('.le-sound')) return;
      if (b.classList.contains('le-chip') && b.hasAttribute('aria-pressed')) A.play('toggle', b.getAttribute('aria-pressed') === 'true');
      else A.play('click');
    }, true);
    LE.bus.on('cinematic:start', function () { A.play('whoosh', 5.4); });
    LE.bus.on('cinematic:end', function () { A.play('lock'); });
    LE.bus.on('select', function (e) { if (e.kind === 'planet') { A.play('whoosh', 2.6); setTimeout(function () { A.play('lock'); }, 1800); } else if (e.kind === 'quake') A.play('lock'); });
    LE.bus.on('mode:changed', function () { A.play('boom'); A.play('whoosh', 2.4); });
    setInterval(updateHum, 400);
  };
})();
