/* 天枢 Starhelm · 2.0 穿梭 C0.5 · sh-x-ship.js(SHXS)
 * 天枢号舰载系统:挂在 SHXC 驾驶舱上(SHXC.on 钩子),不改 1.0 文件。
 *  - Armilla 舰载智能:底部正中的光环形象 + 字幕;既定语音(09_armilla 合成,未到位前只显示字幕)
 *  - 航行规划:航图选目标 / 检索星球 → 选引擎(继承 1.0 弦穹号十种引擎)→ 航程预览 → 播报 → 倒计时出发
 *  - 巡航模式(限速 100 km/s、倍率 ≤×1000)/ 引擎加速模式(自动驾驶 + 大倍率)
 *  - 侧舷窗观测:Armilla 接管;到达后卫星式环绕巡航
 *  - 安全提示(太阳高温、贴近悬停)、航行日志(只存本机)、摄影模式
 *  - 舱内音响:CC0 音乐按场景切换;音效(航行底噪 + 十种引擎 启动/持续/关停)Web Audio 程序合成;全部默认关
 *  - 第一人称 HUD:左右面板带透视,转向时有视差与轻微晃动;桌面放大字号 */
(function () {
  'use strict';
  if (!window.SHXC) return;
  var X = SHXC, I = X._, S = I.S, B = I.B, BY = I.BY, AU = I.AU, C = I.C;
  var SH = window.SH || {}, VD = SH.voyData;
  var LY = 9.4607e12;
  var T;
  function $(s, r) { return (r || document).querySelector(s); }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function reduced() { return matchMedia('(prefers-reduced-motion: reduce)').matches; }
  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }

  /* ---------------- 引擎(继承弦穹号) ---------------- */
  var ENG = (VD && VD.engines) ? VD.engines : [{ id: 'chem', zh: '化学火箭', tier: '实测', model: 'v', v: 15, fact: '' }];
  var TIER = { '实测': '#7fe3c4', '推断': '#ffd27a', '猜想': '#c9a6ff' };
  function eng(id) { for (var i = 0; i < ENG.length; i++) if (ENG[i].id === id) return ENG[i]; return ENG[0]; }

  /* ---------------- Armilla 台词(07_Armilla语音脚本 v1.1) ---------------- */
  var L = {
    a01: '欢迎登上天枢号,探索者。我是 Armilla,你的舰载智能。星海已就绪,随时可以出发。',
    a02: '请在航图上选定目标星域,或者告诉我你想去的星球。',
    a03: '请系好安全带。天枢号即将离港。',
    a04: '已切换至巡航模式。放慢脚步,看看我们身边的星辰。',
    a05: '引擎加速模式已启动。抓稳了,我们要追上光的影子。',
    a06: '点火倒计时:三,二,一。出发!',
    a07: '正在减速,目标就在前方。',
    a08: '已抵达,正在进入环绕轨道。欢迎来到新的世界。',
    a09: '航行已由我接管。请移步侧舷窗,尽情观测吧。',
    a10: '卫星式巡航已启动,我们将绕它飞行一周。',
    a11: '控制权已交还给你,探索者。',
    a12: '警告:前方温度过高。已自动保持安全距离。',
    a13: '我们离这颗星球太近了,已为你悬停。',
    a14: '引力弹弓航线已规划。借行星之力,再快一程。',
    a15: '跃迁引擎充能完毕。星光即将拉成长线,请不要眨眼。',
    a16: '跃迁完成。我们已穿越星域边界。',
    a17: '虫洞已稳定。前方,是另一片宇宙的入口。',
    a18: '航行已取消,天枢号原地待命。',
    a19: '仪表已隐藏。好好记住这一幕吧。',
    a20: '下次见,探索者。星星会等你回来。'
  };
  /* 数字 → 中文读法(每个字都是一个可拼接片段) */
  function zhInt(n) {
    n = Math.round(n); if (n === 0) return '零';
    var d = '零一二三四五六七八九', u = ['', '十', '百', '千'];
    function sec(x) { var s = '', z = false; for (var i = 3; i >= 0; i--) { var q = Math.floor(x / Math.pow(10, i)) % 10; if (!q) { if (s) z = true; } else { if (z) { s += '零'; z = false; } s += d[q] + u[i]; } } return s; }
    var G = [[1e8, '亿'], [1e4, '万'], [1, '']], s = '', gap = false, r = n;
    G.forEach(function (g) { var q = Math.floor(r / g[0]); r = r % g[0]; if (q) { if (s && (gap || q < 1000)) s += '零'; s += sec(q) + g[1]; gap = false; } else if (s) gap = true; });
    return s.replace(/^一十/, '十');
  }
  function zhNum(x, dec) { var i = Math.floor(x), f = dec ? Math.round((x - i) * Math.pow(10, dec)) : 0; if (f >= Math.pow(10, dec || 0)) { i++; f = 0; } var s = zhInt(i); if (dec && f) { var fs = String(f); while (fs.length < dec) fs = '0' + fs; fs = fs.replace(/0+$/, ''); s += '点' + fs.split('').map(function (c) { return '零一二三四五六七八九'[+c]; }).join(''); } return s; }
  function sayDist(km) {   // → [文字片段...]
    if (km < 1e4) return [zhInt(km), '公里'];
    if (km < 1e8) { var w = km / 1e4; return [zhNum(w, w < 100 ? 1 : 0) + '万', '公里']; }
    if (km < 0.05 * LY) { var au = km / AU; return [zhNum(au, au < 10 ? 2 : au < 100 ? 1 : 0), '天文单位']; }
    var ly = km / LY; return [zhNum(ly, ly < 10 ? 2 : 0), '光年'];
  }
  function sayTime(s) {
    var yr = 365.25 * 86400;
    if (!isFinite(s)) return ['无法抵达'];
    if (s < 90) return [zhInt(Math.max(1, s)), '秒'];
    if (s < 5400) return [zhInt(s / 60), '分钟'];
    if (s < 172800) return [zhNum(s / 3600, s < 36000 ? 1 : 0), '小时'];
    if (s < 2 * yr) return [zhInt(s / 86400), '天'];
    return [zhNum(s / yr, s < 10 * yr ? 1 : 0), '年'];
  }

  /* ---------------- 语音播放(manifest 到位后自动启用) ---------------- */
  var VOICE = { on: ls('gn:sh:x-voice') === '1', clips: null, q: [], busy: false, last: null };
  function loadVoice() {   // 09_armilla 交付后:x/armilla/manifest.json + window.SHX_VOICE = true(由 x/armilla/voice.js 设置)
    if (VOICE.clips || !window.SHX_VOICE) return;
    fetch('x/armilla/manifest.json').then(function (r) { return r.ok ? r.json() : null; }).then(function (m) {
      if (!m || !m.items) return; var c = {}; m.items.forEach(function (it) { c[it.id] = it; c['t:' + it.text] = it; }); VOICE.clips = c;
    }).catch(function () { });
  }
  function clipOf(tok) { if (!VOICE.clips) return null; return VOICE.clips[tok] || VOICE.clips['t:' + tok] || null; }
  /* say(['a03', {t:'本次航行将使用'}, ...]) —— 字符串 a01..a20 为整句;{t:} 为拼接片段,数字按字拆开 */
  function say(seq, cb) { VOICE.q.push({ seq: seq, cb: cb }); if (!VOICE.busy) next(); }
  function seqText(seq) { return seq.map(function (k) { return typeof k === 'string' ? (L[k] || k) : k.t; }).join(''); }
  function seqClips(seq) {
    var out = [];
    for (var i = 0; i < seq.length; i++) {
      var k = seq[i];
      if (typeof k === 'string' && L[k]) { var c = clipOf(k); if (!c) return null; out.push(c); continue; }
      var t = typeof k === 'string' ? k : k.t, c2 = clipOf(t);
      if (c2) { out.push(c2); continue; }
      if (/^[零一二两三四五六七八九十百千万亿点]+$/.test(t)) { for (var j = 0; j < t.length; j++) { var cc = clipOf(t[j]); if (!cc) return null; out.push(cc); } continue; }
      return null;
    }
    return out;
  }
  function next() {
    var it = VOICE.q.shift(); if (!it) { VOICE.busy = false; armState(''); return; }
    VOICE.busy = true; VOICE.last = it.seq;
    var txt = seqText(it.seq); sub(txt); armState('speak');
    var clips = VOICE.on ? seqClips(it.seq) : null, done = function () { setTimeout(function () { if (it.cb) it.cb(); next(); }, 260); };
    if (clips && clips.length) {
      var i = 0, play = function () {
        if (i >= clips.length) { done(); return; }
        var a = new Audio('x/armilla/' + clips[i++].file); a.volume = 0.95; a.onended = play; a.onerror = play; a.play().catch(play);
      }; play();
    } else setTimeout(done, Math.min(7000, 900 + txt.length * 150));
  }

  /* ---------------- 音响:音乐 + 音效 ---------------- */
  var SND = { music: ls('gn:sh:x-music') === '1', sfx: ls('gn:sh:x-sfx') === '1', vol: +(ls('gn:sh:x-vol') || 0.5) };
  var TRACKS = {
    idle: { f: 'x/audio/bgm-idle.mp3', zh: 'Space Echo', by: 'Centurion_of_war' },
    cruise: { f: 'x/audio/bgm-cruise.mp3', zh: 'Space Music: Out There', by: 'yd' },
    boost: { f: 'x/audio/bgm-boost.mp3', zh: 'Magic Space', by: 'CodeManu' },
    orbit: { f: 'x/audio/bgm-orbit.mp3', zh: 'Outer Space Loop', by: 'wipics' }
  };
  var MUS = { a: null, b: null, cur: null, want: 'idle', since: 0, order: ['idle', 'cruise', 'boost', 'orbit'] };
  function musPlay(scene) {
    if (!SND.music) return;
    if (MUS.cur === scene && MUS.a) return;
    var tr = TRACKS[scene]; if (!tr) return;
    var old = MUS.a, n = new Audio(tr.f); n.loop = true; n.volume = 0; n.play().catch(function () { });
    MUS.a = n; MUS.cur = scene; fade(n, SND.vol * 0.55, 2500); if (old) fade(old, 0, 2500, function () { old.pause(); });
    var np = $('#xs-np'); if (np) np.textContent = tr.zh + ' · ' + tr.by + '(CC0)';
  }
  function musStop() { if (MUS.a) { var a = MUS.a; fade(a, 0, 900, function () { a.pause(); }); } MUS.a = null; MUS.cur = null; }
  function fade(a, to, ms, cb) { var from = a.volume, t0 = performance.now(); (function st() { var k = Math.min(1, (performance.now() - t0) / ms); try { a.volume = Math.max(0, Math.min(1, from + (to - from) * k)); } catch (e) { } if (k < 1) requestAnimationFrame(st); else if (cb) cb(); })(); }

  var AC = null, M = null, HUM = null, ENGV = null;
  function ac() {
    if (AC) return AC; var Ctx = window.AudioContext || window.webkitAudioContext; if (!Ctx) return null;
    AC = new Ctx(); M = AC.createGain(); M.gain.value = SND.vol; M.connect(AC.destination); return AC;
  }
  var NB = null;
  function noise() { if (NB) return NB; var n = AC.sampleRate * 2, b = AC.createBuffer(1, n, AC.sampleRate), d = b.getChannelData(0); for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; NB = b; return b; }
  function nsrc() { var s = AC.createBufferSource(); s.buffer = noise(); s.loop = true; return s; }
  function osc(type, f) { var o = AC.createOscillator(); o.type = type; o.frequency.value = f; return o; }
  function filt(type, f, q) { var x = AC.createBiquadFilter(); x.type = type; x.frequency.value = f; if (q) x.Q.value = q; return x; }
  function gain(v) { var g = AC.createGain(); g.gain.value = v; return g; }
  function blip(f, d, v) { if (!SND.sfx || !ac()) return; var o = osc('sine', f), g = gain(0), t = AC.currentTime; o.connect(g); g.connect(M); g.gain.linearRampToValueAtTime(v || .08, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + (d || .12)); o.start(t); o.stop(t + (d || .12) + .05); }
  function alarm() { blip(660, .25, .07); setTimeout(function () { blip(520, .3, .07); }, 280); }
  function humOn() {
    if (HUM || !SND.sfx || !ac()) return;
    var s = nsrc(), f = filt('lowpass', 120, .7), g = gain(0), o = osc('sine', 38), og = gain(.25);
    s.connect(f); f.connect(g); o.connect(og); og.connect(g); g.connect(M); s.start(); o.start(); HUM = { s: s, f: f, g: g, o: o };
  }
  function humOff() { if (!HUM) return; var h = HUM; HUM = null; h.g.gain.setTargetAtTime(0, AC.currentTime, .3); setTimeout(function () { try { h.s.stop(); h.o.stop(); } catch (e) { } }, 1500); }
  /* 十种引擎音色:start 升起 → 持续循环 → stop 关停 */
  function engineSound(id) {
    if (!SND.sfx || !ac()) return null;
    var t = AC.currentTime, out = gain(0), nodes = [], lfo, v = .12, up = 1.2, P = { out: out };
    out.connect(M);
    function add(n) { nodes.push(n); return n; }
    function src(n) { add(n); n.start(t); return n; }
    if (id === 'chem') { var s = src(nsrc()), f = filt('lowpass', 380, .8), o = src(osc('sawtooth', 46)), of = filt('lowpass', 160); s.connect(f); f.connect(out); o.connect(of); of.connect(out); v = .2; up = 1.6; f.frequency.setValueAtTime(900, t); f.frequency.exponentialRampToValueAtTime(380, t + 2); }
    else if (id === 'ion') { var a = src(osc('sine', 880)), b = src(osc('sine', 1323)), s2 = src(nsrc()), bp = filt('bandpass', 3200, 6), g2 = gain(.25); a.connect(out); b.connect(out); s2.connect(bp); bp.connect(g2); g2.connect(out); v = .035; up = 2.5; a.frequency.setValueAtTime(300, t); a.frequency.exponentialRampToValueAtTime(880, t + 2.5); }
    else if (id === 'assist') { var s3 = src(nsrc()), bp3 = filt('bandpass', 300, 3); s3.connect(bp3); bp3.connect(out); bp3.frequency.setValueAtTime(250, t); bp3.frequency.exponentialRampToValueAtTime(1900, t + 2.2); bp3.frequency.exponentialRampToValueAtTime(260, t + 4.5); v = .16; up = 2; }
    else if (id === 'sail') { var s4 = src(nsrc()), hp = filt('highpass', 5200), o4 = src(osc('sine', 220)), g4 = gain(.3); lfo = src(osc('sine', .7)); var lg = gain(.25); lfo.connect(lg); lg.connect(g4.gain); s4.connect(hp); hp.connect(out); o4.connect(g4); g4.connect(out); v = .05; up = 3; }
    else if (id === 'fusion') { var o5 = src(osc('sine', 55)), q5 = src(osc('square', 110)), f5 = filt('lowpass', 420), g5 = gain(.6); lfo = src(osc('sine', 2.6)); var l5 = gain(.4); lfo.connect(l5); l5.connect(g5.gain); o5.connect(g5); q5.connect(f5); f5.connect(g5); g5.connect(out); v = .16; up = 2; }
    else if (id === 'laser') { var o6 = src(osc('triangle', 1760)), p6 = src(osc('sine', 2637)), g6 = gain(.5); lfo = src(osc('sine', 5)); var l6 = gain(8); lfo.connect(l6); l6.connect(o6.frequency); o6.connect(out); p6.connect(g6); g6.connect(out); v = .03; up = 1.5; }
    else if (id === 'rel') { var o7 = src(osc('sawtooth', 110)), f7 = filt('lowpass', 300, 4); o7.connect(f7); f7.connect(out); f7.frequency.setValueAtTime(300, t); f7.frequency.exponentialRampToValueAtTime(2600, t + 7); o7.frequency.setValueAtTime(110, t); o7.frequency.exponentialRampToValueAtTime(220, t + 7); v = .09; up = 2; }
    else if (id === 'warp') { var o8 = src(osc('sawtooth', 40)), p8 = src(osc('sawtooth', 40.7)), f8 = filt('lowpass', 300, 6); lfo = src(osc('sine', .3)); var l8 = gain(220); lfo.connect(l8); l8.connect(f8.frequency); o8.connect(f8); p8.connect(f8); f8.connect(out); v = .16; up = 2.5; }
    else if (id === 'gate') { var s9 = src(nsrc()), bp9 = filt('bandpass', 2000, 4), o9 = src(osc('sine', 30)); s9.connect(bp9); bp9.connect(out); o9.connect(out); bp9.frequency.setValueAtTime(2200, t); bp9.frequency.exponentialRampToValueAtTime(90, t + 3.5); v = .18; up = .8; }
    else { var o0 = src(osc('sine', 1047)), p0 = src(osc('sine', 1568)), g0 = gain(0); o0.connect(g0); p0.connect(g0); g0.connect(out); for (var k = 0; k < 40; k++) { var tt = t + k * 2.4; g0.gain.setValueAtTime(.5, tt); g0.gain.exponentialRampToValueAtTime(.001, tt + 2.2); } v = .06; up = .2; }
    out.gain.setValueAtTime(0, t); out.gain.linearRampToValueAtTime(v, t + up);
    P.stop = function () { var t2 = AC.currentTime; out.gain.cancelScheduledValues(t2); out.gain.setValueAtTime(out.gain.value, t2); out.gain.linearRampToValueAtTime(0, t2 + 1.6); setTimeout(function () { nodes.forEach(function (n) { try { n.stop(); } catch (e) { } }); out.disconnect(); }, 1900); };
    return P;
  }
  function engStart(id) { engStop(); ENGV = engineSound(id); }
  function engStop() { if (ENGV) { ENGV.stop(); ENGV = null; } }

  /* ---------------- 界面 ---------------- */
  var R, U = {}, MODE = ls('gn:sh:x-mode') || 'cruise', ENGID = ls('gn:sh:x-engine') || 'ion';
  var ICON = {
    map: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c3 3.2 3 13.8 0 17M12 3.5c-3 3.2-3 13.8 0 17"/></svg>',
    mode: '<svg viewBox="0 0 24 24"><path d="M4 16a8 8 0 1 1 16 0"/><path d="M12 16l4.5-5"/><circle cx="12" cy="16" r="1.4"/></svg>',
    port: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="5"/><path d="M12 3.5v2M12 18.5v2M3.5 12h2M18.5 12h2"/></svg>',
    photo: '<svg viewBox="0 0 24 24"><rect x="3.5" y="7" width="17" height="12" rx="2"/><circle cx="12" cy="13" r="3.4"/><path d="M8.5 7l1.5-2.5h4L15.5 7"/></svg>',
    snd: '<svg viewBox="0 0 24 24"><path d="M4 10v4h3.5L12 18V6L7.5 10z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/></svg>',
    log: '<svg viewBox="0 0 24 24"><path d="M6 4h9l3 3v13H6z"/><path d="M9 10h6M9 13.5h6M9 17h4"/></svg>'
  };
  function css() {
    if ($('#shxs-css')) return;
    var s = el('style'); s.id = 'shxs-css';
    s.textContent = [
      /* 第一人称:左右面板透视 + 视差 */
      '#shxc{--hx:0px;--hy:0px}',
      '#shxc .clk,#shxc .nav{transform:perspective(1100px) rotateY(9deg) translate3d(var(--hx),var(--hy),0);transform-origin:left center}',
      '#shxc .gl-l{transform:perspective(1100px) rotateY(12deg) rotateX(6deg) translate3d(var(--hx),var(--hy),0);transform-origin:left bottom}',
      '#shxc .tgt,#shxc .lst,#shxc .keys{transform:perspective(1100px) rotateY(-9deg) translate3d(var(--hx),var(--hy),0);transform-origin:right center}',
      '#shxc .gl-r{transform:perspective(1100px) rotateY(-12deg) rotateX(6deg) translate3d(var(--hx),var(--hy),0);transform-origin:right bottom}',
      '#shxc .arc{transform:translateX(-50%) perspective(900px) rotateX(-14deg) translate3d(var(--hx),var(--hy),0)}',
      '#shxc::after{content:"";position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse 75% 70% at 50% 46%,transparent 62%,rgba(0,4,10,.42) 100%);z-index:0}',
      '#shxc>*:not(canvas){z-index:1}',
      /* 字号放大(全局 +1px 起,桌面再整体放大) */
      '#shxc{font-size:13.5px}#shxc .cap,#shxc .sec{font-size:11.5px}#shxc .kv span,#shxc .btn{font-size:12.5px}#shxc .kv i,#shxc .g2 span,#shxc .gau .u,#shxc .gau .n{font-size:11.5px}#shxc .blurb{font-size:13px}#shxc .lbl{font-size:12.5px}#shxc .lbl i{font-size:11px}#shxc .lst .ds{font-size:12px}#shxc .hdg{font-size:12.5px}',
      '@media (min-width:1100px) and (min-height:700px){#shxc .p,#shxc .gauges,#shxc .hdg{zoom:1.18}#shxc .lst{top:330px;max-height:max(110px,calc(100vh/1.18 - 545px))}#shxc .keys{bottom:150px}}',
      '@media (min-width:1600px) and (min-height:900px){#shxc .p,#shxc .gauges,#shxc .hdg{zoom:1.3}#shxc .lst{top:320px;max-height:max(110px,calc(100vh/1.3 - 525px))}}',
      '#shxc .ctr{display:none}',
      /* Armilla 坞 */
      '#xa-dock{position:absolute;left:50%;bottom:40px;transform:translateX(-50%);display:flex;align-items:center;gap:10px;pointer-events:auto}',
      '#xa-dock .side{display:flex;gap:8px}',
      '#xa-dock .ib{width:46px;height:46px;border-radius:50%;border:1px solid rgba(150,180,220,.3);background:rgba(10,16,30,.6);color:#cfe0f5;display:grid;place-items:center;cursor:pointer;position:relative;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);padding:0}',
      '#xa-dock .ib svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round}',
      '#xa-dock .ib:hover,#xa-dock .ib:focus-visible{border-color:#7fd6ff;color:#fff;outline:none}#xa-dock .ib.on{border-color:#f0c97a;color:#f0c97a;box-shadow:0 0 12px rgba(240,201,122,.28)}',
      '#xa-dock .ib small{position:absolute;top:50px;left:50%;transform:translateX(-50%);font-size:11.5px;color:rgba(200,214,236,.75);white-space:nowrap;pointer-events:none}',
      '#xa-orb{width:190px;height:150px;border-radius:50%;cursor:pointer;position:relative;border:0;background:radial-gradient(circle at 50% 50%,rgba(240,201,122,.22),rgba(10,16,30,.7) 62%);box-shadow:0 0 24px rgba(127,214,255,.18),inset 0 0 18px rgba(127,214,255,.12);padding:0}',
      '#xa-orb svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}',
      '#xa-orb .r1{animation:xaS 14s linear infinite;transform-origin:50% 50%}#xa-orb .r2{animation:xaS 22s linear infinite reverse;transform-origin:50% 50%}#xa-orb .r3{animation:xaS 9s linear infinite;transform-origin:50% 50%}',
      '#xa-orb .core{transform-origin:50% 50%;animation:xaP 3.2s ease-in-out infinite}',
      '#xa-orb.speak .r1{animation-duration:3.5s}#xa-orb.speak .r2{animation-duration:5s}#xa-orb.speak .r3{animation-duration:2.2s}#xa-orb.speak .core{animation:xaT .42s ease-in-out infinite alternate}',
      '#xa-orb.alert{box-shadow:0 0 26px rgba(255,140,90,.45),inset 0 0 18px rgba(255,140,90,.25)}',
      '#xa-orb .xa-3d{position:absolute;left:50%;top:50%;width:210px;height:210px;transform:translate(-50%,-54%);pointer-events:none}#xa-orb .xa-3d canvas{width:100%!important;height:100%!important;display:block}#xa-orb.gl{background:radial-gradient(circle,rgba(232,194,122,.10),rgba(5,6,15,.35) 55%,transparent 72%);box-shadow:none}#xa-orb.gl>svg{display:none}#xa-orb.gl.alert{background:radial-gradient(circle,rgba(229,72,58,.22),transparent 70%)}',
      '#xa-orb .nm{position:absolute;left:50%;bottom:-4px;transform:translateX(-50%);font:600 11px/1 Orbitron,system-ui,sans-serif;letter-spacing:.24em;color:#9fdcff;white-space:nowrap}',
      '@keyframes xaS{to{transform:rotate(360deg)}}@keyframes xaP{0%,100%{transform:scale(1);opacity:.85}50%{transform:scale(1.12);opacity:1}}@keyframes xaT{from{transform:scale(.9)}to{transform:scale(1.35)}}',
      '#xa-sub{position:absolute;left:50%;bottom:204px;transform:translateX(-50%);max-width:min(760px,80vw);padding:8px 18px;border-radius:14px;background:rgba(6,10,20,.66);border:1px solid rgba(127,214,255,.22);color:#eaf2ff;font-size:16px;line-height:1.55;text-align:center;opacity:0;transition:opacity .35s;pointer-events:none}',
      '#xa-sub b{color:#9fdcff;font-weight:500;margin-right:8px;font-family:Orbitron,system-ui,sans-serif;font-size:12px;letter-spacing:.18em}#xa-sub.on{opacity:1}',
      '#xa-mode{position:absolute;left:50%;bottom:20px;transform:translateX(-50%);font-size:12px;color:rgba(200,214,236,.7);white-space:nowrap;pointer-events:none;display:none}',
      /* 全息卡片 */
      '.xs-card{position:absolute;left:50%;top:50%;transform:translate(-50%,-52%);width:min(620px,92vw);max-height:78vh;overflow:auto;padding:16px 20px;border-radius:16px;background:rgba(6,11,22,.82);border:1px solid rgba(127,214,255,.28);box-shadow:0 0 40px rgba(127,214,255,.12),inset 0 0 30px rgba(127,214,255,.05);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);font-size:14px;z-index:5}',
      '.xs-card h4{margin:0 0 10px;font-size:18px;font-weight:500;color:#fff;letter-spacing:.08em;display:flex;justify-content:space-between;align-items:center}.xs-card h4 small{font-size:11px;color:#7fd6ff;letter-spacing:.2em}',
      '.xs-card .xc{cursor:pointer;color:#aab;font-size:20px;line-height:1;background:none;border:0}',
      '.xs-card input[type=search]{width:100%;box-sizing:border-box;padding:9px 12px;border-radius:10px;border:1px solid rgba(150,180,220,.3);background:rgba(255,255,255,.04);color:#fff;font:inherit;font-size:15px;outline:none}.xs-card input[type=search]:focus{border-color:#7fd6ff}',
      '.xs-grid{display:flex;flex-wrap:wrap;gap:6px;margin:10px 0}.xs-chip{padding:6px 12px;border-radius:16px;border:1px solid rgba(150,180,220,.28);background:rgba(20,30,52,.5);color:#dfe7f5;cursor:pointer;font:inherit;font-size:14px}.xs-chip:hover{border-color:#7fd6ff}.xs-chip.on{border-color:#f0c97a;color:#f0c97a}.xs-chip i{font-style:normal;font-size:11px;margin-left:5px;opacity:.8}',
      '.xs-sec{margin:12px 0 4px;font-size:12px;letter-spacing:.14em;color:rgba(180,195,220,.6)}',
      '.xs-pre{margin-top:10px;padding:10px 12px;border-radius:12px;background:rgba(127,214,255,.06);border:1px solid rgba(127,214,255,.16);line-height:1.75}.xs-pre b{color:#fff;font-weight:500}.xs-pre .f{color:rgba(205,216,236,.75);font-size:13px}',
      '.xs-row{display:flex;gap:10px;margin-top:12px;justify-content:flex-end}.xs-go{padding:9px 22px;border-radius:20px;border:1px solid #f0c97a;background:rgba(240,201,122,.12);color:#f6d999;font:inherit;font-size:15px;cursor:pointer;letter-spacing:.1em}.xs-go:hover{background:rgba(240,201,122,.22)}.xs-no{padding:9px 18px;border-radius:20px;border:1px solid rgba(150,180,220,.3);background:none;color:#cfd8ea;font:inherit;cursor:pointer}',
      '.xs-log{font-size:12.5px;color:rgba(200,212,235,.65);margin-top:8px}',
      '#xs-snd{width:min(380px,92vw)}#xs-snd label{display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid rgba(150,180,220,.1)}#xs-snd input[type=range]{width:160px}#xs-snd .np{font-size:12px;color:rgba(200,212,235,.6);margin-top:8px}#xs-snd .cr{font-size:11px;color:rgba(200,212,235,.45);margin-top:8px;line-height:1.5}',
      '.xs-sw{appearance:none;-webkit-appearance:none;width:42px;height:22px;border-radius:12px;background:rgba(150,170,200,.25);position:relative;cursor:pointer;outline:none}.xs-sw::after{content:"";position:absolute;left:3px;top:3px;width:16px;height:16px;border-radius:50%;background:#dfe7f5;transition:left .2s}.xs-sw:checked{background:rgba(240,201,122,.6)}.xs-sw:checked::after{left:23px}',
      '#xs-offer{position:absolute;left:50%;bottom:290px;transform:translateX(-50%);display:flex;gap:10px;z-index:4}',
      '#xs-cd{position:absolute;left:50%;top:42%;transform:translate(-50%,-50%);font:200 120px/1 Orbitron,system-ui,sans-serif;color:#fff;text-shadow:0 0 30px rgba(127,214,255,.8);pointer-events:none;opacity:0;transition:opacity .2s}',
      /* 侧舷窗 */
      '#xs-port{position:absolute;inset:0;pointer-events:none;display:none;background:radial-gradient(ellipse 44% 46% at 50% 48%,transparent 0 96%,rgba(127,214,255,.5) 96.6%,#141b27 97.4%,#2a3344 98.6%,#0a0d14 100%),radial-gradient(ellipse 60% 64% at 50% 48%,transparent 0 69%,#0b0f17 70%,#161d2a 88%,#05070b 100%)}',
      '#xs-port .tag{position:absolute;left:50%;top:22px;transform:translateX(-50%);font-size:13px;letter-spacing:.3em;color:#9fdcff}',
      '#shxc.port .p,#shxc.port .gauges,#shxc.port .arc,#shxc.port .hdg,#shxc.port .strip,#shxc.port .ret,#shxc.port .ctr,#shxc.port .mob{opacity:0;pointer-events:none;transition:opacity .6s}#shxc.port #xs-port{display:block}',
      '#shxc.photo>*:not(canvas):not(#xs-photo){display:none!important}#shxc.photo::after{display:none}#xs-photo{display:none;position:absolute;right:14px;bottom:12px;font-size:12px;color:rgba(220,230,245,.55);cursor:pointer;padding:6px 10px}#shxc.photo #xs-photo{display:block}',
      /* 手机 / 矮屏 */
      '@media (max-width:640px){#xa-dock{bottom:6px;gap:3px}#xa-dock .side{gap:4px}#xa-dock .ib{width:36px;height:36px}#xa-dock .ib svg{width:19px;height:19px}#xa-dock .ib small{display:none}#xa-orb{width:88px;height:80px}#xa-orb .xa-3d{width:112px;height:112px}#xa-orb .nm{display:none}#xa-sub{bottom:236px;font-size:14px;max-width:92vw}#shxc .strip,#shxc .ctr{display:none}#shxc .gauges{bottom:72px}#shxc .mob{bottom:170px}#xs-offer{bottom:256px}#xs-cd{font-size:84px}}',
      '@media (max-height:420px){#xa-dock{bottom:4px}#xa-dock .ib{width:34px;height:34px}#xa-dock .ib small,#xa-orb .nm{display:none}#xa-orb{width:84px;height:70px}#xa-orb .xa-3d{width:100px;height:100px}#xa-sub{bottom:auto;top:8px;font-size:13px;max-width:60vw}#shxc .ctr{display:none}#xs-offer{bottom:64px}.xs-card{max-height:90vh}}',
      '@media (prefers-reduced-motion:reduce){#xa-orb *{animation:none!important}}'
    ].join('\n');
    document.head.appendChild(s);
  }
  function ib(k, ic, label, title) { return '<button class="ib" type="button" data-a="' + k + '" title="' + title + '" aria-label="' + title + '">' + ICON[ic] + '<small>' + label + '</small></button>'; }
  function build() {
    R = I.root(); if (!R || $('#xa-dock', R)) return;
    T = window.THREE; css();
    var dock = el('div', '', '<div class="side">' + ib('plan', 'map', '航图', '航行规划 · N') + ib('mode', 'mode', '巡航', '巡航 / 引擎加速 · C') + ib('log', 'log', '日志', '航行日志') + '</div>' +
      '<button id="xa-orb" type="button" aria-label="Armilla 舰载智能 · 点我重播 / 开启语音"><svg viewBox="0 0 100 100"><defs><radialGradient id="xag"><stop offset="0" stop-color="#fff6dc"/><stop offset=".45" stop-color="#f0c97a"/><stop offset="1" stop-color="#f0c97a" stop-opacity="0"/></radialGradient></defs>' +
      '<g class="r1"><ellipse cx="50" cy="50" rx="40" ry="14" fill="none" stroke="#7fd6ff" stroke-width="1.3" opacity=".9"/></g>' +
      '<g class="r2"><ellipse cx="50" cy="50" rx="14" ry="40" fill="none" stroke="#dfe7f5" stroke-width="1" opacity=".7"/><ellipse cx="50" cy="50" rx="40" ry="40" fill="none" stroke="#7fd6ff" stroke-width=".7" opacity=".45"/></g>' +
      '<g class="r3"><ellipse cx="50" cy="50" rx="34" ry="22" fill="none" stroke="#f0c97a" stroke-width="1" opacity=".8" transform="rotate(35 50 50)"/></g>' +
      '<circle class="core" cx="50" cy="50" r="13" fill="url(#xag)"/></svg><span class="nm">ARMILLA</span></button>' +
      '<div class="side">' + ib('port', 'port', '侧舷窗', '侧舷窗观测 · V') + ib('photo', 'photo', '摄影', '摄影模式 · P') + ib('snd', 'snd', '音响', '舱内音响 · M') + '</div>');
    dock.id = 'xa-dock'; R.appendChild(dock);
    R.appendChild(el('div', '', '')).id = 'xa-sub';
    var cd = el('div', '', ''); cd.id = 'xs-cd'; R.appendChild(cd);
    var port = el('div', '', '<div class="tag">侧舷窗 · ARMILLA 接管</div>'); port.id = 'xs-port'; R.appendChild(port);
    var ph = el('div', '', '摄影模式 · 点这里或按 P 退出'); ph.id = 'xs-photo'; ph.onclick = function () { photo(false); }; R.appendChild(ph);
    U.orb = $('#xa-orb', R); U.sub = $('#xa-sub', R); U.cd = cd;
    if (window.SHXARM && SHXARM.ok()) { try { var h3 = el('div', 'xa-3d'); U.orb.appendChild(h3); U.arm = SHXARM.mount(h3, { small: innerWidth < 700 || innerHeight < 480 }); U.orb.classList.add('gl'); } catch (e) { console.warn('[Armilla 3D]', e); U.arm = null; } }
    dock.querySelectorAll('.ib').forEach(function (b) { b.onclick = function () { blip(880, .08, .05); act(b.getAttribute('data-a')); }; });
    U.orb.onclick = function () {
      if (!VOICE.on) { VOICE.on = true; ls('gn:sh:x-voice', '1'); loadVoice(); if (!VOICE.clips) I.toast('Armilla 的声音正在录制中,先看字幕'); }
      say(VOICE.last || ['a02']);
    };
    var kp = $('#xc-keys', R); if (kp && !ls('gn:sh:x-keys')) kp.classList.add('min');
    setMode(MODE, true);
  }
  function armState(s) { if (!U.orb) return; U.orb.classList.toggle('speak', s === 'speak'); if (U.arm && U.arm.state !== 'ALERT') U.arm.set(s === 'speak' ? 'SPEAKING' : s === 'think' ? 'THINKING' : s === 'listen' ? 'LISTENING' : 'IDLE'); }
  var subT = 0;
  function sub(t) { if (!U.sub) return; U.sub.innerHTML = '<b>ARMILLA</b>' + esc(t); U.sub.classList.add('on'); clearTimeout(subT); subT = setTimeout(function () { U.sub.classList.remove('on'); }, Math.min(9000, 2600 + t.length * 160)); }
  function alertOrb() { if (!U.orb) return; U.orb.classList.add('alert'); if (U.arm) U.arm.set('ALERT'); setTimeout(function () { U.orb.classList.remove('alert'); if (U.arm) U.arm.set(VOICE.busy ? 'SPEAKING' : 'IDLE'); }, 3000); }
  function btn(a) { return R && $('#xa-dock .ib[data-a="' + a + '"]', R); }

  function act(a) {
    if (a === 'plan') togglePlan();
    else if (a === 'mode') setMode(MODE === 'cruise' ? 'boost' : 'cruise');
    else if (a === 'port') portAct();
    else if (a === 'photo') photo(!R.classList.contains('photo'));
    else if (a === 'snd') toggleSnd();
    else if (a === 'log') toggleLog();
  }
  function setMode(m, quiet) {
    MODE = m; ls('gn:sh:x-mode', m);
    var b = btn('mode'); if (b) { b.classList.toggle('on', m === 'boost'); b.querySelector('small').textContent = m === 'boost' ? '引擎加速' : '巡航'; }
    S.capV = m === 'cruise' ? 100 : 0;
    if (m === 'cruise' && S.mult > 1000) S.mult = 1000;
    if (!quiet) { say([m === 'cruise' ? 'a04' : 'a05']); blip(m === 'cruise' ? 520 : 780, .18, .06); }
  }
  function closeCards(except) { if (U.arm && U.arm.state === 'LISTENING') U.arm.set('IDLE'); ['xs-plan', 'xs-snd', 'xs-log'].forEach(function (id) { if (id !== except) { var c = $('#' + id, R); if (c) c.remove(); } }); }

  /* ---------------- 航行规划 ---------------- */
  var PL = { tgt: null };
  function distTo(b) { var p = b.wp || [0, 0, 0]; return Math.max(0, Math.hypot(p[0] - S.pos[0], p[1] - S.pos[1], p[2] - S.pos[2]) - b.R * (b.id === 'sun' ? 6 : 4)); }
  function togglePlan() {
    if ($('#xs-plan', R)) { closeCards(); return; }
    closeCards(); PL.tgt = PL.tgt || (S.target !== 'earth' ? S.target : 'mars');
    var c = el('div', 'xs-card', ''); c.id = 'xs-plan'; c.setAttribute('role', 'dialog'); c.setAttribute('aria-label', '航行规划');
    c.innerHTML = '<h4><span>航行规划 · 天枢号 <small>NAV PLAN</small></span><button class="xc" type="button" aria-label="关闭">×</button></h4>' +
      '<input type="search" id="xs-q" placeholder="检索目的地星球,例如:火星 / Saturn" autocomplete="off">' +
      '<div class="xs-sec">太阳系 · 目标</div><div class="xs-grid" id="xs-bodies"></div>' +
      '<div class="xs-sec">引擎 · 继承弦穹号 · <span style="color:#7fe3c4">实测</span> / <span style="color:#ffd27a">推断</span> / <span style="color:#c9a6ff">猜想</span></div><div class="xs-grid" id="xs-engs"></div>' +
      '<div class="xs-pre" id="xs-pre"></div>' +
      '<div class="xs-row"><button class="xs-no" type="button">取消</button><button class="xs-go" type="button">出发</button></div>' +
      '<div class="xs-sec" style="margin-top:14px">跨星域跃迁(群星、银河、宇宙)将在 C2 开放</div>';
    R.appendChild(c);
    var bd = $('#xs-bodies', c), eg = $('#xs-engs', c);
    B.forEach(function (b) { var x = el('button', 'xs-chip', '<span style="color:' + b.col + '">●</span> ' + b.zh); x.type = 'button'; x.dataset.id = b.id; x.dataset.k = (b.zh + ' ' + b.en).toLowerCase(); x.onclick = function () { PL.tgt = b.id; I.setTarget(b.id); blip(700, .06, .04); refreshPlan(); }; bd.appendChild(x); });
    ENG.forEach(function (e) { if (e.model === 'none') return; var x = el('button', 'xs-chip', e.zh + '<i style="color:' + TIER[e.tier] + '">' + e.tier + '</i>'); x.type = 'button'; x.dataset.id = e.id; x.onclick = function () { ENGID = e.id; ls('gn:sh:x-engine', e.id); blip(600, .06, .04); refreshPlan(); }; eg.appendChild(x); });
    $('#xs-q', c).oninput = function () { var q = this.value.trim().toLowerCase(), first = null; bd.querySelectorAll('.xs-chip').forEach(function (x) { var ok = !q || x.dataset.k.indexOf(q) >= 0; x.style.display = ok ? '' : 'none'; if (ok && !first) first = x; }); if (q && first) { PL.tgt = first.dataset.id; refreshPlan(); } };
    $('.xc', c).onclick = $('.xs-no', c).onclick = function () { closeCards(); };
    $('.xs-go', c).onclick = launch;
    refreshPlan(); if (U.arm && !VOICE.busy) U.arm.set('LISTENING');
    if (!PL.greeted) { PL.greeted = true; say(['a02']); }
  }
  function plan() {
    var b = BY[PL.tgt] || BY.mars, e = eng(ENGID), km = distTo(b);
    var tr = VD && VD.travel ? VD.travel(e, km, e.model === 'warp' ? 3 : null) : { earthS: km / (e.v || 15), shipS: km / (e.v || 15) };
    var act = e.id === 'assist' ? '引力弹弓' : e.id === 'gate' ? '虫洞穿越' : '星域内穿梭';
    var demo = Math.round(Math.log(Math.max(2, km / Math.max(1, b.R))) / 0.9 + 4);
    return { b: b, e: e, km: km, tr: tr, act: act, demo: demo };
  }
  function refreshPlan() {
    var c = $('#xs-plan', R); if (!c) return; var p = plan();
    c.querySelectorAll('#xs-bodies .xs-chip').forEach(function (x) { x.classList.toggle('on', x.dataset.id === p.b.id); });
    c.querySelectorAll('#xs-engs .xs-chip').forEach(function (x) { x.classList.toggle('on', x.dataset.id === p.e.id); });
    var ft = VD ? VD.fmtTime : I.fdur, fd = VD ? VD.fmtDist : I.fkm;
    var ship = p.tr.shipS && Math.abs(p.tr.shipS - p.tr.earthS) / p.tr.earthS > 0.01 ? '(船上 ' + ft(p.tr.shipS) + ')' : '';
    $('#xs-pre', c).innerHTML = '<div>目标 <b>' + p.b.zh + '</b> · ' + p.act + ' · 航程 <b>' + fd(p.km) + '</b></div>' +
      '<div>引擎 <b style="color:' + TIER[p.e.tier] + '">' + p.e.zh + '</b>(' + p.e.tier + ')· 真实预计耗时 <b>' + ft(p.tr.earthS) + '</b>' + ship + '</div>' +
      '<div class="f">' + esc(p.e.fact || '') + '</div><div class="f">演示中天枢号会压缩时间,约 ' + p.demo + ' 秒抵达;读数里的时间按真实物理计算。</div>';
  }
  var LAUNCH = null;
  function launch() {
    var p = plan(); closeCards(); if (p.km < 1) { I.toast('已经在 ' + p.b.zh + ' 附近了'); return; }
    LAUNCH = p; I.setTarget(p.b.id); S.auto = false; S.base = 0; S.mult = 1; stopOrbit(true);
    var seq = ['a03', { t: '本次航行将使用' }, { t: p.e.zh }, { t: ',即将进行' }, { t: p.act }, { t: '。航程约' }].concat(sayDist(p.km).map(function (t) { return { t: t }; }), [{ t: ',预计耗时' }], sayTime(p.tr.earthS).map(function (t) { return { t: t }; }), [{ t: '。' }]);
    if (p.e.id === 'assist') say(['a14']);
    if (p.e.model === 'warp') say(['a15']);
    if (p.e.model === 'gate') say(['a17']);
    say(seq, function () { countdown(function () { if (MODE !== 'boost') setMode('boost', true); I.autopilot(true); engStart(p.e.id); log('出发', p.b, p.e); }); });
  }
  function countdown(cb) {
    sub(L.a06); armState('think');
    var clips = VOICE.on ? seqClips(['a06']) : null; if (clips) { var a = new Audio('x/armilla/' + clips[0].file); a.play().catch(function () { }); }
    var n = 3, tick = function () {
      if (n === 0) { U.cd.textContent = ''; U.cd.style.opacity = 0; blip(1320, .5, .09); armState(''); cb(); return; }
      U.cd.textContent = n; U.cd.style.opacity = 1; blip(880, .15, .07); n--; setTimeout(tick, 900);
    }; tick();
  }

  /* ---------------- 侧舷窗 + 卫星式巡航 ---------------- */
  var O = null, PEND_PORT = false;
  function portAct() {
    if (O) { stopOrbit(); return; }
    var tb = BY[S.target], d = tb.wp ? Math.hypot(tb.wp[0] - S.pos[0], tb.wp[1] - S.pos[1], tb.wp[2] - S.pos[2]) : Infinity;
    say(['a09']);
    if (d < tb.R * 40) startOrbit(tb);
    else { PEND_PORT = true; if (MODE !== 'boost') setMode('boost', true); I.autopilot(true); engStart(ENGID); R.classList.add('port'); btn('port').classList.add('on'); }
  }
  function startOrbit(b) {
    var p = b.wp, rel = new T.Vector3(S.pos[0] - p[0], S.pos[1] - p[1], S.pos[2] - p[2]), d = rel.length();
    var r = Math.min(b.R * (b.id === 'sun' ? 12 : 8), Math.max(b.R * (b.id === 'sun' ? 6 : 2.2), d));
    var e1 = rel.normalize(), up = new T.Vector3(0, 1, 0), e2 = new T.Vector3().crossVectors(up, e1); if (e2.lengthSq() < 1e-6) e2.set(1, 0, 0); e2.normalize();
    e1 = new T.Vector3().crossVectors(e2, up).normalize().multiplyScalar(-1); e1.addScaledVector(up, 0.18).normalize();
    O = { b: b, r: r, ang: 0, w: 2 * Math.PI / (reduced() ? 160 : 80), e1: e1, e2: e2, t: 0 };
    S.auto = false; S.align = false; S.base = 0; S.mult = 1; engStop();
    R.classList.add('port'); var pb = btn('port'); if (pb) pb.classList.add('on');
    var per = 2 * Math.PI * Math.sqrt(Math.pow(r, 3) / b.GM);
    say(['a10']); I.toast('卫星式巡航 · 轨道半径 ' + I.fkm(r) + ' · 真实绕行一周约 ' + I.fdur(per));
    log('环绕', b);
  }
  function stopOrbit(quiet) {
    PEND_PORT = false; var was = !!O || (R && R.classList.contains('port')); O = null;
    if (R) { R.classList.remove('port'); var pb = btn('port'); if (pb) pb.classList.remove('on'); }
    if (was && !quiet) say(['a11']);
  }
  function photo(on) { if (!R) return; R.classList.toggle('photo', on); if (on) say(['a19']); }

  /* ---------------- 音响面板 ---------------- */
  function toggleSnd() {
    if ($('#xs-snd', R)) { closeCards(); return; }
    closeCards(); var c = el('div', 'xs-card', ''); c.id = 'xs-snd';
    c.innerHTML = '<h4><span>舱内音响 <small>AUDIO</small></span><button class="xc" type="button" aria-label="关闭">×</button></h4>' +
      '<label>舱内音乐<input class="xs-sw" type="checkbox" id="xs-m"' + (SND.music ? ' checked' : '') + '></label>' +
      '<label>航行与引擎音效<input class="xs-sw" type="checkbox" id="xs-f"' + (SND.sfx ? ' checked' : '') + '></label>' +
      '<label>Armilla 语音<input class="xs-sw" type="checkbox" id="xs-v"' + (VOICE.on ? ' checked' : '') + '></label>' +
      '<label>音量<input type="range" min="0" max="1" step="0.05" id="xs-vol" value="' + SND.vol + '"></label>' +
      '<div class="xs-row" style="justify-content:space-between"><span class="np" id="xs-np">' + (MUS.cur ? TRACKS[MUS.cur].zh : '音乐按航行状态自动切换:待命 / 巡航 / 加速 / 环绕') + '</span><button class="xs-no" type="button" id="xs-nx">下一首</button></div>' +
      '<div class="cr">音乐:OpenGameArt.org 公有领域(CC0)曲目 —— Space Echo(Centurion_of_war)、Space Music: Out There(yd)、Magic Space(CodeManu)、Outer Space Loop(wipics)。音效为程序实时合成。</div>';
    R.appendChild(c);
    $('.xc', c).onclick = function () { closeCards(); };
    $('#xs-m', c).onchange = function () { SND.music = this.checked; ls('gn:sh:x-music', SND.music ? '1' : '0'); if (SND.music) musPlay(MUS.want); else musStop(); };
    $('#xs-f', c).onchange = function () { SND.sfx = this.checked; ls('gn:sh:x-sfx', SND.sfx ? '1' : '0'); if (SND.sfx) { ac(); if (AC.state === 'suspended') AC.resume(); humOn(); blip(880, .1, .06); } else { humOff(); engStop(); } };
    $('#xs-v', c).onchange = function () { VOICE.on = this.checked; ls('gn:sh:x-voice', VOICE.on ? '1' : '0'); if (VOICE.on) { loadVoice(); if (!VOICE.clips) I.toast('Armilla 的声音正在录制中,先看字幕'); } };
    $('#xs-vol', c).oninput = function () { SND.vol = +this.value; ls('gn:sh:x-vol', SND.vol); if (M) M.gain.value = SND.vol; if (MUS.a) MUS.a.volume = SND.vol * 0.55; };
    $('#xs-nx', c).onclick = function () { if (!SND.music) { SND.music = true; ls('gn:sh:x-music', '1'); $('#xs-m', c).checked = true; } var i = MUS.order.indexOf(MUS.cur || 'idle'); MUS.lock = performance.now() + 120000; musPlay(MUS.order[(i + 1) % MUS.order.length]); };
  }

  /* ---------------- 航行日志(只存本机) ---------------- */
  function log(kind, b, e) {
    var a = []; try { a = JSON.parse(ls('gn:sh:x-log') || '[]'); } catch (x) { }
    a.unshift({ k: kind, id: b.id, zh: b.zh, e: e ? e.zh : '', t: Date.now() }); a = a.slice(0, 30); ls('gn:sh:x-log', JSON.stringify(a));
  }
  function toggleLog() {
    if ($('#xs-log', R)) { closeCards(); return; }
    closeCards(); var a = []; try { a = JSON.parse(ls('gn:sh:x-log') || '[]'); } catch (x) { }
    var c = el('div', 'xs-card', '<h4><span>航行日志 <small>LOG · 只存在这台设备</small></span><button class="xc" type="button" aria-label="关闭">×</button></h4>' +
      (a.length ? a.map(function (r) { var d = new Date(r.t); return '<div class="kv" style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid rgba(150,180,220,.1)"><span>' + (d.getMonth() + 1) + '-' + d.getDate() + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0') + '</span><b>' + esc(r.k) + ' · ' + esc(r.zh) + (r.e ? ' · ' + esc(r.e) : '') + '</b></div>'; }).join('') : '<div class="xs-log">还没有航行记录。打开航图,选一颗星球出发吧。</div>') +
      '<div class="xs-row"><button class="xs-no" type="button" id="xs-clr">清空</button></div>');
    c.id = 'xs-log'; R.appendChild(c);
    $('.xc', c).onclick = function () { closeCards(); };
    $('#xs-clr', c).onclick = function () { ls('gn:sh:x-log', '[]'); closeCards(); };
  }

  /* ---------------- 到达后的选择 ---------------- */
  function offer(b) {
    var o = $('#xs-offer', R); if (o) o.remove();
    o = el('div', '', ''); o.id = 'xs-offer';
    var a = el('button', 'xs-go', 'AI 接管 · 卫星式巡航'), n = el('button', 'xs-no', '我自己飞'); a.type = n.type = 'button';
    a.onclick = function () { o.remove(); startOrbit(b); }; n.onclick = function () { o.remove(); say(['a11']); };
    o.appendChild(a); o.appendChild(n); R.appendChild(o); setTimeout(function () { if (o.parentNode) o.remove(); }, 15000);
  }

  /* ---------------- 每帧 ---------------- */
  var prevQ = null, hx = 0, hy = 0, warnSun = false, tAcc = 0, lastV = 0;
  function frame(f) {
    var dt = f.dt; tAcc += dt;
    // 自动驾驶时左右两侧面板渐隐,抵达(减速缓冲结束、S.auto 关闭)后渐显
    var rt = SHXC._.root && SHXC._.root(); if (rt) { var ap = !!S.auto; if (rt._ap !== ap) { rt._ap = ap; rt.classList.toggle('xc-ap', ap); } }
    if (MODE === 'cruise' && S.mult > 1000) S.mult = 1000;
    // 卫星式巡航:位置绕目标转,机头缓慢看向星球(侧舷窗视角),拖动可临时环视
    if (O) {
      var kk = S.keys; if (kk.w || kk.s || S.base > 0.01) { stopOrbit(); }
      else {
        var p = O.b.wp; O.ang += O.w * dt; var c = Math.cos(O.ang), s = Math.sin(O.ang);
        S.pos[0] = p[0] + O.r * (c * O.e1.x + s * O.e2.x); S.pos[1] = p[1] + O.r * (c * O.e1.y + s * O.e2.y); S.pos[2] = p[2] + O.r * (c * O.e1.z + s * O.e2.z);
        var to = new T.Vector3(p[0] - S.pos[0], p[1] - S.pos[1], p[2] - S.pos[2]).normalize(), tang = O.e2.clone().multiplyScalar(c).addScaledVector(O.e1, -s);
        var look = to.clone().multiplyScalar(.82).addScaledVector(tang, .18).normalize();
        var want = new T.Quaternion().setFromRotationMatrix(new T.Matrix4().lookAt(new T.Vector3(), look, new T.Vector3(0, 1, 0)));
        var now = performance.now(), rdt = Math.min(.5, ((now - (O.lt || now)) / 1000) || dt); O.lt = now; S.q.slerp(want, 1 - Math.exp(-rdt * (O.t < 2.5 ? 1.6 : 2.4))); O.t += rdt;
      }
    }
    // 太阳高温保护
    var sun = BY.sun; if (sun.surf != null) {
      var fw = new T.Vector3(0, 0, -1).applyQuaternion(S.q), ts = new T.Vector3(sun.wp[0] - S.pos[0], sun.wp[1] - S.pos[1], sun.wp[2] - S.pos[2]).normalize();
      if (!warnSun && sun.surf < sun.R * 20 && f.veff > 1 && fw.dot(ts) > 0.3 && !(S.auto && S.target === 'sun' && sun.surf > sun.R * 5)) { warnSun = true; S.base = 0; S.mult = 1; S.auto = false; engStop(); alarm(); alertOrb(); say(['a12']); }
      if (sun.surf > sun.R * 30) warnSun = false;
    }
    // 引擎音:自动驾驶结束 / 急停后关停
    if (ENGV && !S.auto && !PEND_PORT) engStop();
    // 航行底噪随速度
    if (HUM) { var lv = Math.log10(1 + f.veff); HUM.g.gain.setTargetAtTime(Math.min(.14, lv * .025), AC.currentTime, .4); HUM.f.frequency.setTargetAtTime(90 + lv * 70, AC.currentTime, .4); }
    // 音乐场景
    var want2 = O ? 'orbit' : S.auto ? 'boost' : f.veff > 1 ? 'cruise' : 'idle';
    if (want2 !== MUS.want) { MUS.want = want2; MUS.since = performance.now(); }
    if (SND.music && MUS.want !== MUS.cur && performance.now() - MUS.since > 3500 && !(MUS.lock > performance.now())) musPlay(MUS.want);
    // 第一人称:转向视差 + 速度微晃
    if (!prevQ) prevQ = S.q.clone();
    var dq = prevQ.clone().invert().multiply(S.q), e = new T.Euler().setFromQuaternion(dq, 'YXZ'); prevQ.copy(S.q);
    var rm = reduced() ? 0 : 1, bob = rm * Math.min(1, Math.log10(1 + f.veff) / 4) * 1.6;
    hx += ((Math.max(-14, Math.min(14, -e.y / Math.max(dt, 1e-3) * 26)) * rm) - hx) * Math.min(1, dt * 4);
    hy += ((Math.max(-10, Math.min(10, e.x / Math.max(dt, 1e-3) * 20)) * rm + Math.sin(tAcc * 1.7) * bob) - hy) * Math.min(1, dt * 4);
    R.style.setProperty('--hx', hx.toFixed(1) + 'px'); R.style.setProperty('--hy', hy.toFixed(1) + 'px');
    lastV = f.veff;
  }
  function onKey(e) {
    if (!X.isOpen() || e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
    var k = e.key.toLowerCase();
    if (k === 'n') togglePlan(); else if (k === 'c') act('mode'); else if (k === 'v') portAct(); else if (k === 'p') photo(!R.classList.contains('photo')); else if (k === 'm') toggleSnd();
    else if (k === 'escape' && (R.classList.contains('photo') || $('.xs-card', R))) { photo(false); closeCards(); e.stopImmediatePropagation(); e.preventDefault(); return; }
    else return;
    e.preventDefault(); e.stopPropagation();
  }
  X.on(function (ev, a) {
    if (ev === 'open') {
      build(); loadVoice(); setMode(MODE, true); if (U.arm) { U.arm.resize(); U.arm.reveal(); U.arm.start(); }
      if (SND.sfx) { ac(); if (AC && AC.state === 'suspended') AC.resume(); humOn(); }
      if (SND.music) musPlay('idle');
      if (!sessionStorage.getItem('gn:sh:x-hello')) { sessionStorage.setItem('gn:sh:x-hello', '1'); setTimeout(function () { say(['a01']); say(['a02']); }, 900); }
    } else if (ev === 'close') { if (U.arm) U.arm.stop(); stopOrbit(true); engStop(); humOff(); musStop(); closeCards(); if (R) R.classList.remove('photo'); }
    else if (ev === 'frame') frame(a);
    else if (ev === 'decel') say(['a07']);
    else if (ev === 'arrive') { engStop(); blip(660, .3, .06); if (LAUNCH && LAUNCH.b.id === a.id) { log('抵达', a, LAUNCH.e); LAUNCH = null; } if (PEND_PORT) { PEND_PORT = false; say(['a08']); startOrbit(a); } else { say(['a08']); offer(a); } }
    else if (ev === 'hover') { alarm(); alertOrb(); say(['a13']); }
  });
  addEventListener('keydown', onKey, true);

  /* 取消 1.0 弦穹号飞船入口:巡天子页里统一进天枢号驾驶舱 */
  function takeover() {
    if (!window.SH) return;
    // Esc 分层:侧舷窗/卫星巡航 → 回驾驶舱原位;摄影模式 → 退出摄影;面板 → 收起;都没有 → 交给驾驶舱弹「结束探索」确认
    window.SHXC._esc = function () {
      if (O || (R && R.classList.contains('port'))) { stopOrbit(); return true; }
      if (R && R.classList.contains('photo')) { photo(false); return true; }
      if (R && R.querySelector('.xs-card')) { closeCards(); return true; }
      return false;
    };
    // 驾驶舱入口装进顶栏「航行」方框(圆形视图条里的驾驶舱按钮取消)
    (function lab(k) { var b = document.querySelector('.sh-btn-voy'); if (b) { var t = b.querySelector('.le-btn__txt'); if (t) t.innerHTML = '航行<small>天枢号 · F</small>'; b.title = '进入天枢号驾驶舱(F)'; b.addEventListener('click', function (e) { e.stopImmediatePropagation(); e.preventDefault(); if (window.SHXV) SHXV.go('fly'); else SHXC.open(); }, true); return; } if (k < 300) setTimeout(function () { lab(k + 1); }, 100); })(0);
    SH.voyEnter = function () { if (window.SHXV) SHXV.go('fly'); else SHXC.open(); };
    SH.voySetTarget = function () { if (window.SHXV) SHXV.go('fly'); else SHXC.open(); setTimeout(togglePlan, 400); };
  }
  takeover(); addEventListener('load', takeover);

  window.SHXS = { say: say, lines: L, zhNum: zhNum, sayDist: sayDist, sayTime: sayTime, plan: function () { if (X.isOpen()) togglePlan(); }, orbit: function () { if (X.isOpen()) portAct(); }, mode: function (m) { setMode(m); }, state: function () { return { mode: MODE, engine: ENGID, orbit: !!O, music: SND.music, sfx: SND.sfx, voice: VOICE.on, clips: !!VOICE.clips }; } };
})();
