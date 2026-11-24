/* 宙律 Nomoverse · 声音(3.0-α8,3-8):首页与 /nomoverse/3/ 共用一个引擎、一个开关、一个存储键
 * 存储:沿用 2.0 的 localStorage「gn:nv:_pref」里的 sound 字段(true = 开;缺省/坏值 = 关),其他字段原样保留。
 * 规则(纯逻辑在 logic,有单测 3/tests/home.test.mjs):
 *   · 默认关;关着时永不建 AudioContext、不下载任何音频。
 *   · 开着也要等第一次用户手势(pointerdown / keydown / 点开关)才建 AudioContext,并在那时才懒加载音效;背景音乐要播时才下载。
 *   · 减少动态(系统设置,或 /3/ 页内「动效:减少」):背景音乐不自动播;只有本页里用户亲手把开关打开才播。音效照常(短、无节奏)。
 *   · 页面隐藏:静音并挂起;回到前台恢复。跨页(首页 ↔ /3/)与刷新靠同一个键保持;bfcache 返回与其他标签页改动会重新读键。
 * 素材:audio/music-nomoverse-loop.m4a(背景循环)+ audio/*.m4a 合成音效(audio/synth.py 生成)+ 运行时 WebAudio 合成(boom/chime/pulse/glide/voice)。
 * 接口与 2.0 core/nv.js 的 NV.snd 兼容(on / set / button / play / hover / voice / pulse / glide / boom / duck / stopAll),
 *   首页在加载 nv.js 之前把 window.NV_SND_EXT 设成本引擎,2.0 首页代码与星图无需改调用。
 * 开关 = Squish Switch(思路参考 React Bits「Squish Switch」reactbits.dev/micro/squish-switch,原生改写,见 LICENSES.md)。 */
(function (root, factory) {
  var api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root && root.document) root.NV3_SOUND = api;
})(typeof window !== 'undefined' ? window : null, function (W) {
  'use strict';

  /* ======================= 纯逻辑(Node 可测) ======================= */
  var KEY = 'gn:nv:_pref';
  var MUSIC = 'music-nomoverse-loop';
  var SFX = ['select', 'whoosh', 'close', 'tick', 'unlock', 'star', 'swish', 'thud'];
  function parse(raw) { try { var o = JSON.parse(raw == null ? 'null' : raw); return o && typeof o === 'object' && !Array.isArray(o) ? o : null; } catch (e) { return null; } }
  function readOn(raw) { var o = parse(raw); return !!(o && o.sound === true); }
  function writeOn(raw, on) { var o = parse(raw) || {}; o.sound = !!on; return JSON.stringify(o); }

  /* 状态机:s = { on, gest, ctx, hidden, reduced, explicit, music } → step(s, ev) = { s, fx[] }
   * ev.t: 'gesture' | 'set'(on, 用户亲手) | 'sync'(on, 从存储读回,非手势) | 'hidden'(v) | 'reduced'(v)
   * fx: 'create'(建 AudioContext + 懒加载音效)| 'resume' | 'suspend' | 'music:on' | 'music:off' */
  function init(on, reduced, hidden) { return { on: !!on, gest: false, ctx: false, hidden: !!hidden, reduced: !!reduced, explicit: false, music: false }; }
  function wantCtx(s) { return s.on && s.gest; }
  function wantMusic(s) { return s.on && s.gest && !s.hidden && (!s.reduced || s.explicit); }
  function step(s, ev) {
    var n = {}, k; for (k in s) n[k] = s[k];
    var fx = [];
    switch (ev && ev.t) {
      case 'gesture': n.gest = true; break;
      case 'set': n.on = !!ev.on; n.gest = true; n.explicit = !!ev.on; break;
      case 'sync': if (n.on !== !!ev.on) { n.on = !!ev.on; n.explicit = false; } break;
      case 'hidden': n.hidden = !!ev.v; break;
      case 'reduced': n.reduced = !!ev.v; break;
      default: return { s: n, fx: fx };
    }
    if (wantCtx(n) && !n.ctx) { n.ctx = true; fx.push('create'); }
    if (n.ctx) {
      var run = n.on && !n.hidden, was = s.ctx && s.on && !s.hidden;
      if (run && (!was || fx.length)) fx.push('resume'); else if (!run && was) fx.push('suspend');
    }
    var m = wantMusic(n);
    if (m !== s.music) fx.push(m ? 'music:on' : 'music:off');
    n.music = m;
    return { s: n, fx: fx };
  }

  /* 3.0 关键操作 → 反馈音(文件音效名或合成音);同一事件不同结局给不同音 */
  var CUES = {
    bang: ['boom', 'whoosh'],          // 大爆炸:低频轰 + 呼啸
    stageOk: ['tick'], stageWarn: ['swish'], stageFail: ['thud'],
    ok: ['chime', 'unlock'],           // 七关走完:和弦 + 解锁
    warn: ['star'], fail: ['thud', 'close'],
    name: ['select'], share: ['select'], export: ['swish'], import: ['star'], importBad: ['close'],
    tohelm: ['whoosh'], mode: ['select'], card: ['select'], tryCard: ['star'], random: ['swish'], reset: ['close'],
    toggleOn: ['select'], entry: ['whoosh']
  };
  function cue(name) { return (CUES[name] || []).slice(); }
  function outcomeCue(status) { return status === 'ok' ? 'ok' : status === 'warn' ? 'warn' : 'fail'; }
  function stageCue(state) { return state === 'ok' ? 'stageOk' : state === 'warn' ? 'stageWarn' : state === 'fail' ? 'stageFail' : null; }
  var LABEL = { zh: { name: '声音', on: '声音:开', off: '声音:关' }, en: { name: 'Sound', on: 'Sound: on', off: 'Sound: off' } };
  function label(on, lang) { var L = LABEL[lang === 'en' ? 'en' : 'zh']; return { name: L.name, state: on ? L.on : L.off }; }
  /* 防连发:同名音效 80 ms 内只响一次 */
  function throttle(last, n, now, ms) { if (now - (last[n] || -1e9) < (ms || 80)) return false; last[n] = now; return true; }

  var logic = { KEY: KEY, MUSIC: MUSIC, SFX: SFX, readOn: readOn, writeOn: writeOn, init: init, step: step, wantMusic: wantMusic, wantCtx: wantCtx,
    CUES: CUES, cue: cue, outcomeCue: outcomeCue, stageCue: stageCue, label: label, throttle: throttle };
  if (!W || !W.document) return { logic: logic };

  /* ======================= 浏览器引擎 ======================= */
  var D = W.document;
  var ROOT = (function () {
    var s = D.currentScript && D.currentScript.src;
    try { return new URL('../../', s || W.location.href).href; } catch (e) { return '/nomoverse/'; }
  })();
  function lsGet(k) { try { return W.localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { W.localStorage.setItem(k, v); } catch (e) {} }
  function lang() {
    if (W.NV_LANG === 'en' || W.GN_LANG === 'en') return 'en';
    if (W.NV_LANG === 'zh' || W.GN_LANG === 'zh') return 'zh';
    var s = lsGet('gn:lang'); if (s === 'en' || s === 'zh') return s;
    // 与 /shared/3/i18n.js 一致:没有显式语言时看浏览器语言(首页的 i18n.js 总会设 NV_LANG,走不到这里)
    return W.navigator && /^zh/i.test(W.navigator.language || '') ? 'zh' : 'en';
  }
  function rmNow() { try { return !!(W.matchMedia && W.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { return false; } }
  var ICON0 = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M17 9l5 6M22 9l-5 6"/></svg>';
  var ICON1 = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg>';

  var eng = null;
  function get() { return eng || (eng = create()); }

  function create() {
    var st = init(readOn(lsGet(KEY)), rmNow(), D.hidden);
    var ctx = null, mG = null, sG = null, src = null, stopT = 0, duckN = 0, buf = {}, pend = {}, last = {}, voices = [], sws = [];
    var stats = { ctxCreated: 0, musicLoads: 0, musicStarts: 0, sfxLoads: 0, played: [], lastFx: [] };
    var DUMMY = { alive: false, freq: function () {}, gain: function () {}, stop: function () {} };
    function live() { return st.on && ctx && ctx.state === 'running' && !D.hidden; }
    function load(n) {
      if (buf[n] || pend[n] || !ctx) return pend[n] || Promise.resolve(buf[n]);
      if (n === MUSIC) stats.musicLoads++; else stats.sfxLoads++;
      pend[n] = fetch(ROOT + 'audio/' + n + '.m4a').then(function (r) { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
        .then(function (ab) { return new Promise(function (ok, no) { ctx.decodeAudioData(ab, ok, no); }); })
        .then(function (b) { buf[n] = b; delete pend[n]; return b; })
        .catch(function () { delete pend[n]; return null; });
      return pend[n];
    }
    function makeCtx() {
      var AC = W.AudioContext || W.webkitAudioContext;
      if (ctx || !AC) return;
      try { ctx = new AC(); } catch (e) { ctx = null; return; }
      stats.ctxCreated++;
      mG = ctx.createGain(); mG.gain.value = 0; mG.connect(ctx.destination);
      var comp = ctx.createDynamicsCompressor(); comp.connect(ctx.destination);
      sG = ctx.createGain(); sG.gain.value = 0.7; sG.connect(comp);
      SFX.forEach(load);                      // 懒加载:有了上下文才下载音效(8 个小文件)
    }
    function ramp(g, v, sec) { if (!ctx) return; var t = ctx.currentTime; g.cancelScheduledValues(t); g.setValueAtTime(g.value, t); g.linearRampToValueAtTime(v, t + sec); }
    function musicOn() {
      clearTimeout(stopT);
      load(MUSIC).then(function (b) {
        if (!b || !st.music || !ctx) return;
        if (!src) {
          src = ctx.createBufferSource(); src.buffer = b; src.loop = true; src.loopStart = 0; src.loopEnd = Math.min(b.duration, 96);
          src.connect(mG); src.start(); stats.musicStarts++;
        }
        ramp(mG.gain, duckN > 0 ? 0 : 0.3, 2);
      });
    }
    function musicOff() {
      if (!ctx) return;
      ramp(mG.gain, 0, 0.4);
      clearTimeout(stopT);
      stopT = setTimeout(function () { if (!st.music && src) { try { src.stop(); } catch (e) {} src.disconnect(); src = null; } }, 500);
    }
    function apply(fx) {
      stats.lastFx = fx;
      fx.forEach(function (f) {
        if (f === 'create') makeCtx();
        else if (f === 'resume') { if (ctx && ctx.state !== 'running') ctx.resume().catch(function () {}); if (sG) ramp(sG.gain, 0.7, 0.2); }
        else if (f === 'suspend') { voices.forEach(function (v) { v.stop(); }); voices = []; if (sG) ramp(sG.gain, 0, 0.2); setTimeout(function () { if (ctx && (!st.on || D.hidden)) ctx.suspend().catch(function () {}); }, 700); }
        else if (f === 'music:on') musicOn();
        else if (f === 'music:off') musicOff();
      });
    }
    function fire(ev) { var r = step(st, ev); st = r.s; apply(r.fx); paint(); }
    function set(v) { lsSet(KEY, writeOn(lsGet(KEY), v)); fire({ t: 'set', on: v }); }
    function sync() { var v = readOn(lsGet(KEY)); if (v !== st.on) fire({ t: 'sync', on: v }); else paint(); }

    function gesture(e) {
      if (e && e.target && e.target.closest && e.target.closest('[data-snd]')) return;   // 点开关本身由 set 处理
      W.removeEventListener('pointerdown', gesture, true); W.removeEventListener('keydown', gesture, true);
      fire({ t: 'gesture' });
    }
    W.addEventListener('pointerdown', gesture, true); W.addEventListener('keydown', gesture, true);
    D.addEventListener('visibilitychange', function () { fire({ t: 'hidden', v: D.hidden }); });
    W.addEventListener('pageshow', function (e) { if (e.persisted) sync(); });
    W.addEventListener('storage', function (e) { if (!e.key || e.key === KEY) sync(); });

    /* ---------- Squish Switch(role=switch;按下时滑块被「压扁」,松开弹回并切换) ---------- */
    function paint() {
      var lg = lang(), L = label(st.on, lg);
      sws.forEach(function (b) {
        b.setAttribute('aria-checked', st.on ? 'true' : 'false');
        b.setAttribute('aria-label', L.name);
        if (b._title) b.title = L.state; else b.removeAttribute('title');
        b.classList.toggle('is-on', st.on);
        var ic = b.querySelector('.nv-sq-ic'); if (ic) ic.innerHTML = st.on ? ICON1 : ICON0;
        var tx = b.querySelector('.nv-sq-l'); if (tx) tx.textContent = L.name;
      });
    }
    function squish(o) {
      o = o || {};
      var b = D.createElement('button');
      b._title = o.title !== false;
      b.type = 'button'; b.className = 'nv-sq' + (o.text ? ' has-l' : '') + (o.cls ? ' ' + o.cls : '');
      b.setAttribute('role', 'switch'); b.setAttribute('data-snd', '1'); b.setAttribute('data-noi18n', '');
      b.innerHTML = '<span class="nv-sq-ic" aria-hidden="true"></span>' + (o.text ? '<span class="nv-sq-l"></span>' : '') +
        '<span class="nv-sq-tr" aria-hidden="true"><span class="nv-sq-th"></span></span>';
      var up = function () { b.classList.remove('is-press'); };
      b.addEventListener('pointerdown', function () { b.classList.add('is-press'); });
      b.addEventListener('pointerup', up); b.addEventListener('pointerleave', up); b.addEventListener('pointercancel', up);
      b.addEventListener('click', function () { set(!st.on); if (st.on) playCue('toggleOn'); });
      sws.push(b); paint();
      return b;
    }

    /* ---------- 播放 ---------- */
    function play(n, e, gain) {
      if (!live() || (e && e.pointerType === 'touch')) return;
      if (n === 'boom') return boom();
      if (n === 'chime') return chime();
      if (!buf[n]) { load(n); return; }
      if (!throttle(last, n, performance.now())) return;
      if ((n === 'tick' || n === 'select' || n === 'whoosh' || n === 'close') && (duckN > 0 || voices.some(function (v) { return v.alive; }))) return;
      var s = ctx.createBufferSource(); s.buffer = buf[n];
      if (gain != null) { var g = ctx.createGain(); g.gain.value = gain; s.connect(g); g.connect(sG); } else s.connect(sG);
      s.start(); stats.played.push(n); if (stats.played.length > 40) stats.played.shift();
    }
    function playCue(name) { cue(name).forEach(function (n, i) { if (i === 0) play(n); else setTimeout(function () { play(n); }, 90 * i); }); }
    function boom() {
      if (!live() || !throttle(last, 'boom', performance.now(), 600)) return;
      var t = ctx.currentTime, n = Math.floor(ctx.sampleRate * 1.2), b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0);
      for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.25));
      var s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      s.buffer = b; f.type = 'lowpass'; f.frequency.value = 380; g.gain.value = 1.0; s.connect(f); f.connect(g); g.connect(sG); s.start(t);
      stats.played.push('boom');
    }
    function chime() {
      if (!live() || !throttle(last, 'chime', performance.now(), 400)) return;
      var t = ctx.currentTime;
      [523.25, 659.25, 783.99].forEach(function (f, i) {       // C 大三和弦依次响起
        var o = ctx.createOscillator(), g = ctx.createGain(), t0 = t + i * 0.09;
        o.type = 'sine'; o.frequency.value = f; g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(0.22, t0 + 0.02); g.gain.exponentialRampToValueAtTime(0.0008, t0 + 1.1);
        o.connect(g); g.connect(sG); o.start(t0); o.stop(t0 + 1.2);
      });
      stats.played.push('chime');
    }
    var api = {
      get on() { return st.on; },
      set: set,
      sync: sync,
      button: function () { return squish({}); },
      squish: squish,
      play: play,
      cue: playCue,
      hover: function (e) { if (e && e.pointerType === 'mouse') play('tick', e); },
      boom: boom, chime: chime,
      voice: function (type, cutoff) {
        if (!live()) return DUMMY;
        var o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain(), dead = false;
        o.type = type || 'triangle'; f.type = 'lowpass'; f.frequency.value = cutoff || 2600; g.gain.value = 0;
        o.connect(f); f.connect(g); g.connect(sG); o.start();
        var v = { alive: true,
          freq: function (x) { if (!dead && isFinite(x) && x > 0) o.frequency.setTargetAtTime(Math.min(8000, x), ctx.currentTime, 0.012); },
          gain: function (x) { if (!dead) g.gain.setTargetAtTime(Math.max(0, x), ctx.currentTime, 0.03); },
          stop: function () { if (dead) return; dead = true; v.alive = false; var t = ctx.currentTime; g.gain.cancelScheduledValues(t); g.gain.setTargetAtTime(0, t, 0.04); try { o.stop(t + 0.3); } catch (e) {} } };
        voices.push(v); if (voices.length > 12) voices.shift().stop();
        return v;
      },
      pulse: function (f, gain) {
        if (!live() || !throttle(last, 'pulse', performance.now())) return;
        var t = ctx.currentTime, g = ctx.createGain(), peak = gain == null ? 0.5 : gain;
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0008, t + 1.1); g.connect(sG);
        [[1, 1], [2, 0.45], [3, 0.18]].forEach(function (p) {
          var o = ctx.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(f * p[0] * 1.5, t); o.frequency.exponentialRampToValueAtTime(f * p[0], t + 0.06);
          var gg = ctx.createGain(); gg.gain.value = p[1]; o.connect(gg); gg.connect(g); o.start(t); o.stop(t + 1.2);
        });
      },
      glide: function (f0, f1, d, gain) {
        if (!live() || !throttle(last, 'glide', performance.now())) return;
        var t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'triangle'; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + d);
        g.gain.setValueAtTime(gain || 0.3, t); g.gain.exponentialRampToValueAtTime(0.001, t + d + 0.1);
        o.connect(g); g.connect(sG); o.start(t); o.stop(t + d + 0.15);
      },
      duck: function (d) { duckN += d ? 1 : -1; if (duckN < 0) duckN = 0; if (ctx && st.music) ramp(mG.gain, duckN > 0 ? 0 : 0.3, duckN > 0 ? 0.4 : 2); },
      stopAll: function () { voices.forEach(function (v) { v.stop(); }); voices = []; },
      /* /3/ 页内「动效」改了以后通知引擎(减少动态 → 背景音乐不自动播) */
      motion: function (reduced) { fire({ t: 'reduced', v: reduced == null ? rmNow() : !!reduced }); },
      relabel: paint,
      stats: function () { return { on: st.on, gest: st.gest, ctx: !!ctx, ctxState: ctx ? ctx.state : 'none', reduced: st.reduced, explicit: st.explicit, music: st.music, musicPlaying: !!src,
        loaded: Object.keys(buf), ctxCreated: stats.ctxCreated, musicLoads: stats.musicLoads, musicStarts: stats.musicStarts, sfxLoads: stats.sfxLoads, played: stats.played.slice(), lastFx: stats.lastFx.slice(), root: ROOT }; }
    };
    return api;
  }

  return { logic: logic, get: get };
});
