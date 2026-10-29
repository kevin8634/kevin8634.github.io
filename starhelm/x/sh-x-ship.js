/* 天枢 Starhelm · 2.0 穿梭 C0.5 · sh-x-ship.js(SHXS)
 * C1.4:三引擎电影化特效挂钩(近光速 / 曲率 / 虫洞,见 sh-x-fx.js)
 * C1.3:悬停/待命音乐 3 首轮播(+2 首程序合成原创)
 * C1.2:Armilla ⇄ JARVIS 人格切换(偏好 starhelm.voice.persona,默认 armilla;JARVIS 英文台词/拼读 + 奇点形象;两人格共用 AI 空间感)
 * 天枢号舰载系统:挂在 SHXC 驾驶舱上(SHXC.on 钩子),不改 1.0 文件。
 *  - Armilla 舰载智能:底部正中的光环形象 + 字幕;既定语音(09_armilla 合成,未到位前只显示字幕)
 *  - 航行规划:航图选目标 / 检索星球 → 选引擎(继承 1.0 弦穹号十种引擎)→ 航程预览 → 播报 → 倒计时出发
 *  - 巡航模式(限速 100 km/s、倍率 ≤×1000)/ 引擎加速模式(自动驾驶 + 大倍率)
 *  - 侧舷窗观测:Armilla 接管;到达后卫星式环绕巡航
 *  - 安全提示(太阳高温、贴近悬停)、航行日志(只存本机)、摄影模式
 *  - 舱内音响:CC0 音乐按场景切换;音效(航行底噪 + 十种引擎 启动/持续/关停)Web Audio 程序合成;全部默认关
 *  - 第一人称 HUD:左右面板带透视,转向时有视差与轻微晃动;桌面放大字号
 *  - C2.1:日球层顶「等离子体波之声」—— 旅行者 1 号 PWS 实测录音(NASA/JPL-Caltech/University of Iowa,PIA17045);
 *    接近 100 AU 预加载(整段下载完才可播),穿越时淡入、压低音乐、不与语音重叠;跟随音量;开关默认跟随舰载语音开关 */
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
  /* ---------------- JARVIS 英文台词(09 交付 jarvis_voice v1.0.0,脚本 v1.1 英文版)+ 人格切换 ---------------- */
  var LE = {
    a01: "Welcome aboard the Starhelm, Explorer. I am JARVIS, your onboard intelligence. The stars are ready whenever you are.",
    a02: "Please select a target region on the star chart, or tell me which world you'd like to visit.",
    a03: "Please fasten your seatbelt. The Starhelm is about to depart.",
    a04: "Switching to cruise mode. Let's slow down and take in the stars around us.",
    a05: "Engine boost engaged. Hold on tight, we're about to chase the shadow of light.",
    a06: "Ignition in three, two, one. Launch!",
    a07: "Decelerating. Our destination is just ahead.",
    a08: "We have arrived and are entering orbit. Welcome to a new world.",
    a09: "I have the helm. Please make your way to the side viewport and enjoy the view.",
    a10: "Satellite cruise engaged. We'll complete one full orbit.",
    a11: "Control has been returned to you, Explorer.",
    a12: "Warning: extreme temperature ahead. Holding a safe distance automatically.",
    a13: "We're a little too close to this planet. Holding position for you.",
    a14: "Gravity slingshot trajectory plotted. Borrowing a planet's pull for a little extra speed.",
    a15: "Jump drive fully charged. Starlight is about to stretch into lines, so try not to blink.",
    a16: "Jump complete. We have crossed the regional boundary.",
    a17: "The wormhole is stable. Ahead lies the entrance to another universe.",
    a18: "Voyage cancelled. The Starhelm is standing by.",
    a19: "Instruments hidden. Take a moment to remember this.",
    a20: "Until next time, Explorer. The stars will wait for you."
  };
  var PER = { id: ls('starhelm.voice.persona') === 'jarvis' ? 'jarvis' : 'armilla' };   // 偏好 starhelm.voice.persona,默认 armilla
  function isJ() { return PER.id === 'jarvis'; }
  function pname() { return isJ() ? 'JARVIS' : 'ARMILLA'; }
  function pnice() { return isJ() ? 'JARVIS' : 'Armilla'; }
  function line(k) { return (isJ() ? LE : L)[k]; }
  /* 英文数字 → num 片段(42 = forty two;1,300 = one thousand three hundred;不读 and) */
  var EN1 = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'],
    EN10 = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'], ENW = {};
  EN1.concat(['twenty'], EN10.slice(3), ['hundred', 'thousand', 'million', 'billion', 'point']).forEach(function (w, i) { ENW[w] = 'num' + String(i + 1).padStart(2, '0'); });
  function enInt(n) {
    n = Math.round(n); if (n === 0) return ['zero'];
    function h3(x) { var o = [], hh = Math.floor(x / 100), r = x % 100; if (hh) o.push(EN1[hh], 'hundred'); if (r) { if (r < 20) o.push(EN1[r]); else { o.push(EN10[Math.floor(r / 10)]); if (r % 10) o.push(EN1[r % 10]); } } return o; }
    var o = [], G = [[1e9, 'billion'], [1e6, 'million'], [1e3, 'thousand'], [1, '']];
    G.forEach(function (g) { var q = Math.floor(n / g[0]); n -= q * g[0]; if (q) { o = o.concat(h3(q)); if (g[1]) o.push(g[1]); } });
    return o;
  }
  function enNum(x, dec) { var i = Math.floor(x), f = dec ? Math.round((x - i) * Math.pow(10, dec)) : 0; if (f >= Math.pow(10, dec || 0)) { i++; f = 0; } var o = enInt(i); if (dec && f) { var fs = String(f).padStart(dec, '0').replace(/0+$/, ''); o.push('point'); for (var k = 0; k < fs.length; k++) o.push(EN1[+fs[k]]); } return o; }
  function sig3(x) { if (x < 1000) return Math.round(x); var p = Math.pow(10, Math.floor(Math.log10(x)) - 2); return Math.round(x / p) * p; }
  function enTok(words, unit, uid) { return words.map(function (w) { return { t: w, id: ENW[w] }; }).concat([{ t: unit, id: uid }]); }
  function enDist(km) {
    if (km < 1e6) return enTok(enInt(sig3(Math.max(1, km))), 'kilometers', 'unit01');
    if (km < 1e8) { var mm = km / 1e6; return enTok(enNum(mm, mm < 10 ? 1 : 0).concat(['million']), 'kilometers', 'unit01'); }
    if (km < 0.05 * LY) { var au = km / AU; return enTok(enNum(au, au < 10 ? 2 : au < 100 ? 1 : 0), 'astronomical units', 'unit02'); }
    var ly = km / LY; return enTok(ly < 10 ? enNum(ly, 2) : enInt(sig3(ly)), 'light-years', 'unit03');
  }
  function enTime(s) {
    var yr = 365.25 * 86400;
    if (!isFinite(s)) return [{ t: 'beyond reach' }];
    if (s < 90) return enTok(enInt(Math.max(1, s)), 'seconds', 'unit04');
    if (s < 5400) return enTok(enInt(s / 60), 'minutes', 'unit05');
    if (s < 172800) return enTok(enNum(s / 3600, s < 36000 ? 1 : 0), 'hours', 'unit06');
    if (s < 2 * yr) return enTok(enInt(s / 86400), 'days', 'unit07');
    return enTok(s < 10 * yr ? enNum(s / yr, 1) : enInt(sig3(s / yr)), 'years', 'unit08');
  }
  var TECH = { chem: 'tech01', ion: 'tech02', assist: 'tech03', sail: 'tech04', fusion: 'tech05', laser: 'tech06', rel: 'tech07', warp: 'tech08', gate: 'tech09', mind: 'tech10' };
  var TECH_EN = { tech01: 'chemical rocket', tech02: 'ion propulsion', tech03: 'gravity assist', tech04: 'solar sail', tech05: 'fusion drive', tech06: 'laser light sail', tech07: 'near-light-speed travel', tech08: 'warp drive', tech09: 'wormhole', tech10: 'thought experiment' };
  var ACT = { '星域内穿梭': ['act01', 'in-region transit'], '星际跃迁': ['act02', 'interstellar jump'], '虫洞穿越': ['act03', 'wormhole transit'], '引力弹弓': ['act04', 'gravity slingshot'] };

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
  var VOICE = { on: ls('gn:sh:x-voice') !== '0', clips: null, pack: null, q: [], busy: false, last: null, cur: null, gen: 0 };
  // 「AI 空间感 / Spatial FX」—— 与 ARMILLA PWA v2.2.1 同参数(x/armilla/armilla-spacefx.js 的 ES5 移植),偏好键 armilla.voice.spaceFx,默认开
  var SFX = { on: (function () { try { return localStorage.getItem('armilla.voice.spaceFx') !== '0'; } catch (e) { return true; } })(), node: null };
  function sfxChain() {
    if (SFX.node) return SFX.node; var c = ac(); if (!c) return null;
    var inp = c.createGain(), out = c.createGain(), byp = c.createGain(), fxIn = c.createGain();
    inp.connect(byp); inp.connect(fxIn); byp.connect(out);
    function bq(t, f, q, g) { var b = c.createBiquadFilter(); b.type = t; b.frequency.value = f; if (q != null) b.Q.value = q; if (g != null) b.gain.value = g; return b; }
    var hp = bq('highpass', 85, .7), lsf = bq('lowshelf', 220, null, -1.5), pk = bq('peaking', 3200, .9, 2.4), hs = bq('highshelf', 9000, null, 3);
    fxIn.connect(hp); hp.connect(lsf); lsf.connect(pk); pk.connect(hs);
    var dir = c.createGain(); dir.gain.value = .92; var pre = c.createDelay(.1); pre.delayTime.value = .018;
    var cv = c.createConvolver(), rate = c.sampleRate, len = Math.floor(rate * 1.05), buf = c.createBuffer(2, len, rate);
    for (var ch = 0; ch < 2; ch++) { var d = buf.getChannelData(ch), lp = 0; for (var i = 0; i < len; i++) { var p = i / len; lp += (Math.random() * 2 - 1 - lp) * (.55 - .35 * p); d[i] = lp * Math.pow(1 - p, 3.2) * .9; }
      [.011, .019, .027, .041].forEach(function (t, k) { var ix = Math.floor((t + ch * .003) * rate); if (ix < len) d[ix] += .5 / (k + 1.4); }); }
    cv.buffer = buf; var wet = c.createGain(); wet.gain.value = .2;
    hs.connect(dir); dir.connect(out); hs.connect(pre); pre.connect(cv); cv.connect(wet); wet.connect(out); out.connect(c.destination);
    SFX.node = { input: inp, set: function (on, now) { var t = c.currentTime, tc = now ? .001 : .12; byp.gain.cancelScheduledValues(t); fxIn.gain.cancelScheduledValues(t); byp.gain.setTargetAtTime(on ? 0 : 1, t, tc); fxIn.gain.setTargetAtTime(on ? 1 : 0, t, tc); } };
    SFX.node.set(SFX.on, true); return SFX.node;
  }
  function setSpaceFx(on) { SFX.on = !!on; try { localStorage.setItem('armilla.voice.spaceFx', on ? '1' : '0'); } catch (e) { } if (SFX.node) SFX.node.set(SFX.on); }
  function voiceAudio(it) {   // 有 Web Audio:原声 dry/ 走实时空间感链;没有:开=fx/ 预烘焙、关=dry/
    var ch = sfxChain(), a = new Audio('x/' + PER.id + '/' + (ch ? it.file : (SFX.on && it.file_fx ? it.file_fx : it.file)));
    if (ch) { try { if (AC.state === 'suspended') AC.resume(); AC.createMediaElementSource(a).connect(ch.input); } catch (e) { } }
    return a;
  }
  function loadVoice() {   // 语音包:x/armilla/(中文,window.SHX_VOICE 由 x/armilla/voice.js 设置)/ x/jarvis/(英文)
    var pk = PER.id; if ((VOICE.clips && VOICE.pack === pk) || (pk === 'armilla' && !window.SHX_VOICE)) return;
    VOICE.clips = null; VOICE.pack = pk;
    fetch('x/' + pk + '/manifest.json').then(function (r) { return r.ok ? r.json() : null; }).then(function (m) {
      if (!m || !m.items || VOICE.pack !== pk) return; var c = {};
      m.items.forEach(function (it) { c[it.id] = it; c['t:' + it.text] = it; }); VOICE.clips = c;
    }).catch(function () { });
  }
  function clipOf(tok) { if (!VOICE.clips) return null; return VOICE.clips[tok] || VOICE.clips['t:' + tok] || null; }
  /* say(['a03', {t:'本次航行将使用'}, ...]) —— 字符串 a01..a20 为整句;{t:} 为拼接片段,数字按字拆开 */
  function hush() { VOICE.gen++; VOICE.q = []; VOICE.busy = false; if (VOICE.cur) { try { VOICE.cur.onended = null; VOICE.cur.pause(); } catch (e) { } VOICE.cur = null; } }
  function say(seq, cb) { VOICE.q.push({ seq: seq, cb: cb }); if (!VOICE.busy) next(); }
  function seqText(seq) { var a = seq.map(function (k) { return typeof k === 'string' ? (line(k) || k) : k.t; }); return isJ() ? a.join(' ').replace(/\s+([,.!?])/g, '$1') : a.join(''); }
  function seqClips(seq) {
    var out = [];
    for (var i = 0; i < seq.length; i++) {
      var k = seq[i];
      if (k && k.p) continue;                                   // 纯标点
      if (k && k.id) { var ci = clipOf(k.id); if (!ci) return null; out.push(ci); continue; }
      if (isJ()) { if (typeof k === 'string' && LE[k]) { var cj = clipOf(k); if (!cj) return null; out.push(cj); continue; } return null; }
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
    VOICE.busy = true; VOICE.last = it.seq; var gen = VOICE.gen;
    var txt = seqText(it.seq); sub(txt); armState('speak');
    var clips = VOICE.on ? seqClips(it.seq) : null; if (VOICE.on && !clips && typeof it.seq[0] === 'string') { var c0 = clipOf(it.seq[0]); if (c0) clips = [c0]; }   // 拼接句缺片段时只播开头整句,字幕给全文
    var done = function () { if (done.d) return; done.d = 1; setTimeout(function () { if (gen !== VOICE.gen) return; if (it.cb) it.cb(); next(); }, 260); };
    if (clips && clips.length) {
      var i = 0, play = function () {
        if (i >= clips.length) { done(); return; }
        if (gen !== VOICE.gen) return; var a = VOICE.cur = voiceAudio(clips[i++]), adv = function () { if (adv.d) return; adv.d = 1; play(); }; a.volume = 0.95; a.onended = a.onerror = adv; a.play().catch(adv);   // 10-27 修:onerror 与 catch 同时触发会重复推进 → 重复语音/两次倒计时
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
  // C1.3:悬停(待命)场景扩成 3 首轮播 —— Space Echo(CC0)+ 两首本项目程序合成原创氛围曲(风格一致:慢 pad + 回声钟声 + 星际风噪)
  var IDLE = [TRACKS.idle,
    { f: 'x/audio/bgm-idle-2.mp3', zh: 'Starhelm Drift', by: '天枢号程序合成', lic: '原创' },
    { f: 'x/audio/bgm-idle-3.mp3', zh: 'Starhelm Halo', by: '天枢号程序合成', lic: '原创' }];
  var MUS = { a: null, b: null, cur: null, want: 'idle', since: 0, ii: 0, order: ['idle', 'cruise', 'boost', 'orbit'] };
  function musPlay(scene) {
    if (!SND.music) return;
    if (MUS.cur === scene && MUS.a) return;
    var tr = scene === 'idle' ? IDLE[MUS.ii % IDLE.length] : TRACKS[scene]; if (!tr) return;
    var old = MUS.a, n = new Audio(tr.f); n.loop = scene !== 'idle'; n.volume = 0; n.play().catch(function () { });
    if (scene === 'idle') {   // 轮播:每首播完前 2.5 s 交叉淡入下一首
      var nx = function () { if (n._x || MUS.a !== n || MUS.cur !== 'idle') return; n._x = 1; MUS.ii++; MUS.cur = null; musPlay('idle'); };
      n.addEventListener('timeupdate', function () { if (isFinite(n.duration) && n.duration - n.currentTime < 2.5) nx(); });
      n.addEventListener('ended', nx);
    }
    MUS.a = n; MUS.cur = scene; fade(n, SND.vol * 0.55, 2500); if (old) fade(old, 0, 2500, function () { old.pause(); });
    var np = $('#xs-np'); if (np) np.textContent = tr.zh + ' · ' + tr.by + '(' + (tr.lic || 'CC0') + ')';
  }
  /* C2.1 等离子体波之声(SHXS.pws) */
  var PWS = { f: 'x/audio/v1-pws-interstellar.mp3', url: null, ready: false, loading: false, cbs: [], a: null, playing: false, on: ls('gn:sh:x-pws') == null ? VOICE.on : ls('gn:sh:x-pws') === '1' };
  function pwsLoad(cb) {
    if (PWS.ready) { if (cb) cb(true); return; } if (cb) PWS.cbs.push(cb); if (PWS.loading) return; PWS.loading = true;
    fetch(PWS.f).then(function (r) { if (!r.ok) throw 0; return r.blob(); }).then(function (b) { PWS.url = URL.createObjectURL(b); PWS.ready = true; })
      .catch(function () { }).then(function () { PWS.loading = false; var c = PWS.cbs; PWS.cbs = []; c.forEach(function (f) { try { f(PWS.ready); } catch (e) { } }); });
  }
  function pwsVol() { return Math.max(0, Math.min(1, SND.vol * 0.85)); }
  function pwsStop(fast) { var a = PWS.a; if (!a) return; PWS.a = null; PWS.playing = false; fade(a, 0, fast ? 200 : 900, function () { a.pause(); }); if (MUS.a) fade(MUS.a, SND.vol * 0.55, 1500); }
  function pwsPlay(user, tries) {
    if (!user && (!PWS.on || SND.vol <= 0 || !X.isOpen())) return false;
    if (!PWS.ready) { if (user) { I.toast('等离子体波录音载入中…'); pwsLoad(function (ok) { if (ok) pwsPlay(true); else I.toast('等离子体波录音载入失败'); }); } return false; }
    if (!user && VOICE.busy && (tries || 0) < 12) { setTimeout(function () { pwsPlay(false, (tries || 0) + 1); }, 700); return true; }   // 不与语音播报重叠
    pwsStop(true);
    var a = new Audio(PWS.url); a.volume = 0; PWS.a = a; PWS.playing = true;
    a.onended = function () { if (PWS.a === a) { PWS.a = null; PWS.playing = false; if (MUS.a) fade(MUS.a, SND.vol * 0.55, 1800); } };
    a.play().then(function () { fade(a, pwsVol(), 1500); if (MUS.a) fade(MUS.a, SND.vol * 0.55 * 0.25, 1200); }).catch(function () { PWS.a = null; PWS.playing = false; });
    sub(isJ() ? 'Playing Voyager 1 plasma wave data (2012–13, 2–3 kHz): electron plasma oscillations of interstellar space. NASA/JPL-Caltech/University of Iowa.' : '正在播放旅行者 1 号等离子体波仪实测录音(2012–13 年,2–3 kHz 电子等离子体振荡)· NASA/JPL-Caltech/University of Iowa');
    return true;
  }
  function pwsCue() {   // 穿越日球层顶:已预加载则 2.6 s 后淡入;6 s 内仍未就绪就不播(避免迟到的声音突然冒出),讲解卡里可点播
    if (!PWS.on || SND.vol <= 0) return;
    var t0 = performance.now();
    if (PWS.ready) { setTimeout(function () { pwsPlay(false); }, 2600); return; }
    pwsLoad(function (ok) { if (ok && performance.now() - t0 < 6000) setTimeout(function () { pwsPlay(false); }, Math.max(400, 2600 - (performance.now() - t0))); else I.toast('等离子体波录音未就绪 · 可在「日球层顶」讲解卡中点播'); });
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
  // C1.4:三引擎电影化特效(SHXFX,sh-x-fx.js)与引擎启停同步;音效关时也照常出画面
  var FXM = { rel: [1, '近光速航行(推断)'], warp: [2, '曲率驱动(猜想)'], gate: [3, '虫洞(猜想)'] }, FXON = null;
  function engStart(id) { engStop(); ENGV = engineSound(id); var m = FXM[id]; if (m && window.SHXFX) { FXON = id; SHXFX.set(m[0], m[1]); } }
  function engStop() { if (ENGV) { ENGV.stop(); ENGV = null; } if (FXON) { FXON = null; if (window.SHXFX) SHXFX.set(0); } }

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
      /* JARVIS 奇点形象(09 交付 avatar/,SVG 自带 SMIL 动画;speaking 态换图) */
      '#xa-orb .xa-jv{display:none;position:absolute;left:50%;top:50%;width:176px;height:176px;transform:translate(-50%,-55%);pointer-events:none;filter:drop-shadow(0 0 14px rgba(255,170,90,.28))}#xa-orb.jv .xa-jv.i{display:block}#xa-orb.jv.speak .xa-jv.i{display:none}#xa-orb.jv.speak .xa-jv.s{display:block}#xa-orb.jv>svg,#xa-orb.jv .xa-3d{display:none!important}#xa-orb.jv{background:radial-gradient(circle,rgba(255,170,90,.10),rgba(5,6,15,.35) 55%,transparent 72%)!important;box-shadow:none!important}#xa-orb.jv .nm{color:#ffc98a}#xa-sub.jv b{color:#ffc98a}',
      '#xs-per{display:flex;gap:6px}#xs-per .xs-chip{padding:4px 12px;font-size:13px;white-space:nowrap}',
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
      '.xs-grid{display:flex;flex-wrap:wrap;gap:6px;margin:10px 0}.xs-chip{padding:6px 12px;border-radius:16px;border:1px solid rgba(150,180,220,.28);background:rgba(20,30,52,.5);color:#dfe7f5;cursor:pointer;font:inherit;font-size:14px}.xs-chip:hover{border-color:#7fd6ff}.xs-chip.on{border-color:#f0c97a;color:#f0c97a}.xs-chip.lock{opacity:.38;filter:grayscale(1);cursor:not-allowed}.xs-chip.lock::after{content:" 🔒";font-size:11px}.xs-chip i{font-style:normal;font-size:11px;margin-left:5px;opacity:.8}',
      '.xs-sec{margin:12px 0 4px;font-size:12px;letter-spacing:.14em;color:rgba(180,195,220,.6)}',
      '.xs-pre{margin-top:10px;padding:10px 12px;border-radius:12px;background:rgba(127,214,255,.06);border:1px solid rgba(127,214,255,.16);line-height:1.75}.xs-pre b{color:#fff;font-weight:500}.xs-pre .f{color:rgba(205,216,236,.75);font-size:13px}',
      '.xs-row{display:flex;gap:10px;margin-top:12px;justify-content:flex-end}.xs-go{padding:9px 22px;border-radius:20px;border:1px solid #f0c97a;background:rgba(240,201,122,.12);color:#f6d999;font:inherit;font-size:15px;cursor:pointer;letter-spacing:.1em}.xs-go:hover{background:rgba(240,201,122,.22)}.xs-no{padding:9px 18px;border-radius:20px;border:1px solid rgba(150,180,220,.3);background:none;color:#cfd8ea;font:inherit;cursor:pointer}',
      '.xs-log{font-size:12.5px;color:rgba(200,212,235,.65);margin-top:8px}',
      '#xs-snd{width:min(380px,92vw)}#xs-snd label{display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid rgba(150,180,220,.1)}#xs-snd input[type=range]{width:160px}#xs-snd .np{font-size:12px;color:rgba(200,212,235,.6);margin-top:8px}#xs-snd .cr{font-size:11px;color:rgba(200,212,235,.45);margin-top:8px;line-height:1.5}',
      '.xs-sw{appearance:none;-webkit-appearance:none;width:42px;height:22px;border-radius:12px;background:rgba(150,170,200,.25);position:relative;cursor:pointer;outline:none}.xs-sw::after{content:"";position:absolute;left:3px;top:3px;width:16px;height:16px;border-radius:50%;background:#dfe7f5;transition:left .2s}.xs-sw:checked{background:rgba(240,201,122,.6)}.xs-sw:checked::after{left:23px}',
      '#xs-offer{position:absolute;left:50%;bottom:290px;transform:translateX(-50%);display:flex;gap:10px;z-index:4}',
      '@font-face{font-family:"DSEG7";src:url(x/font/DSEG7Classic-Bold.woff2) format("woff2");font-display:swap}',
      // 王磊 10-27 17:13:倒计时改液晶七段字体,蓝色半透明科技感(背后淡淡的 8 为未点亮段)
      '#xs-cd{position:absolute;left:50%;top:42%;transform:translate(-50%,-50%);font:700 128px/1 DSEG7,Orbitron,system-ui,monospace;color:rgba(120,214,255,.78);text-shadow:0 0 6px rgba(120,214,255,.9),0 0 26px rgba(60,160,255,.6),0 0 60px rgba(40,120,255,.35);padding:22px 34px;border:1px solid rgba(120,200,255,.28);border-radius:14px;background:linear-gradient(180deg,rgba(40,120,200,.14),rgba(10,40,80,.08));backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px);box-shadow:inset 0 0 24px rgba(90,180,255,.15),0 0 30px rgba(60,150,255,.15);pointer-events:none;opacity:0;transition:opacity .2s}',
      '#xs-cd::before{content:"8";position:absolute;left:34px;top:22px;color:rgba(120,214,255,.07);text-shadow:none}',
      '#xs-cd:empty{padding:0;border:0;background:none;box-shadow:none}',
      /* 侧舷窗 */
      '#xs-port{position:absolute;inset:0;pointer-events:none;display:none}',
      '#xs-port .tag{position:absolute;left:50%;top:22px;transform:translateX(-50%);font-size:13px;letter-spacing:.3em;color:#9fdcff}',
      '#shxc.port .p,#shxc.port .gauges,#shxc.port .arc,#shxc.port .hdg,#shxc.port .strip,#shxc.port .ret,#shxc.port .ctr,#shxc.port .mob{opacity:0;pointer-events:none;transition:opacity .6s}#shxc.port #xs-port{display:block}',
      '#shxc.photo>*:not(canvas):not(#xs-photo){display:none!important}#shxc.photo::after{display:none}#xs-photo{display:none;position:absolute;right:14px;bottom:12px;font-size:12px;color:rgba(220,230,245,.55);cursor:pointer;padding:6px 10px}#shxc.photo #xs-photo{display:block}',
      /* 手机 / 矮屏 */
      '@media (max-width:640px){#xa-dock{bottom:6px;gap:3px}#xa-dock .side{gap:4px}#xa-dock .ib{width:36px;height:36px}#xa-dock .ib svg{width:19px;height:19px}#xa-dock .ib small{display:none}#xa-orb{width:88px;height:80px}#xa-orb .xa-3d{width:112px;height:112px}#xa-orb .xa-jv{width:96px;height:96px}#xa-orb .nm{display:none}#xa-sub{bottom:236px;font-size:14px;max-width:92vw}#shxc .strip,#shxc .ctr{display:none}#shxc .gauges{bottom:72px}#shxc .mob{bottom:170px}#xs-offer{bottom:256px}#xs-cd{font-size:84px}}',
      '@media (max-height:420px){#xa-dock{bottom:4px}#xa-dock .ib{width:34px;height:34px}#xa-dock .ib small,#xa-orb .nm{display:none}#xa-orb{width:84px;height:70px}#xa-orb .xa-3d{width:100px;height:100px}#xa-orb .xa-jv{width:86px;height:86px}#xa-sub{bottom:auto;top:8px;font-size:13px;max-width:60vw}#shxc .ctr{display:none}#xs-offer{bottom:64px}.xs-card{max-height:90vh}}',
      '@media (prefers-reduced-motion:reduce){#xa-orb *{animation:none!important}}'
    ].join('\n');
    document.head.appendChild(s);
  }
  /* C2.2b 仪表台(王磊 10-28 16:25 定稿 C:弧形半透明玻璃台 + 边框流动光条 + 弧形玻璃键)
   * 台面轮廓按仪表/按钮/Armilla 的实际位置实时计算:两角托住仪表、中段压低让出前方视野、中央隆起托住 Armilla。
   * 玻璃 = clip-path 的 div(backdrop-filter 轻模糊)+ 同轮廓 SVG 边框;流光从 Armilla 向两侧循环,减少动态时静止。 */
  function deck() {
    if ($('#xc-deck', R)) return;
    var d = el('div', '', '<div class="gl"></div><svg aria-hidden="true"><defs>' +
      '<linearGradient id="xdk-rim" x1="0" x2="1"><stop offset="0" stop-color="#3fd0ff" stop-opacity=".5"/><stop offset=".22" stop-color="#5fe1ff"/><stop offset=".4" stop-color="#b46cff"/><stop offset=".5" stop-color="#ff6ad5"/><stop offset=".6" stop-color="#ffb347"/><stop offset=".78" stop-color="#5fe1ff"/><stop offset="1" stop-color="#3fd0ff" stop-opacity=".5"/></linearGradient>' +
      '<linearGradient id="xdk-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a3a6a" stop-opacity=".16"/><stop offset="1" stop-color="#050c1c" stop-opacity=".42"/></linearGradient>' +
      '<filter id="xdk-glow" x="-5%" y="-50%" width="110%" height="200%"><feGaussianBlur stdDeviation="3"/></filter></defs>' +
      '<path class="fill" fill="url(#xdk-fill)"/><path class="halo" fill="none" stroke="url(#xdk-rim)" stroke-width="5" filter="url(#xdk-glow)" opacity=".55"/>' +
      '<path class="rim" fill="none" stroke="url(#xdk-rim)" stroke-width="1.4"/>' +
      '<path class="fl l" pathLength="1000" fill="none"/><path class="fl r" pathLength="1000" fill="none"/>' +
      '<path class="fl l b" pathLength="1000" fill="none"/><path class="fl r b" pathLength="1000" fill="none"/>' +
      '<path class="fl l c" pathLength="1000" fill="none"/><path class="fl r c" pathLength="1000" fill="none"/>' +
      '<path class="fl l d" pathLength="1000" fill="none"/><path class="fl r d" pathLength="1000" fill="none"/></svg>');
    d.id = 'xc-deck';
    var g = $('.gauges', R); R.insertBefore(d, g || R.firstChild);
    U.deck = d; deckLay(); addEventListener('resize', function () { clearTimeout(U.dkT); U.dkT = setTimeout(deckLay, 60); });
    setTimeout(deckLay, 600); setTimeout(deckLay, 2500);
  }
  function deckLay() {
    var d = U.deck; if (!d) return;
    var W = innerWidth, H = innerHeight, q = function (s) { var e = $(s, R); return e && e.getBoundingClientRect(); };
    var gl = q('.gl-l'), gr = q('.gl-r'), sd = R.querySelectorAll('#xa-dock .side'), orb = q('#xa-orb');
    if (!gl || !gr || !orb || sd.length < 2 || !gl.height) return;
    var sl = sd[0].getBoundingClientRect(), sr = sd[1].getBoundingClientRect();
    var yG = Math.min(gl.top, gr.top) - 12, yK = Math.min(sl.top, sr.top) - 12, yB = orb.top + orb.height * 0.12;
    if (W <= 640 || yK > yG + 60) { yK = Math.min(yK, yG); yB = Math.min(yB, yK); }   // 手机:仪表在按钮上方,台面改成平直上沿
    var top = Math.max(0, Math.min(yG, yK, yB) - 12), h = H - top;
    yG -= top; yK -= top; yB -= top;
    var cx = (orb.left + orb.right) / 2, bw = orb.width / 2 + 18;
    var a = Math.max(gl.right, 0) + 22, b = sl.left - 26, a2 = Math.min(gr.left, W) - 22, b2 = sr.right + 26;
    if (b < a + 40) b = a + 40; if (b2 > a2 - 40) b2 = a2 - 40;
    var c1 = cx - bw, c2 = cx + bw, r = 16, f = function (n) { return Math.round(n * 10) / 10; };
    if (c1 < b + 20) { b = c1 - 20; } if (c2 > b2 - 20) { b2 = c2 + 20; }
    // 左半(由中心向左)与右半(由中心向右),供流光从 Armilla 向两侧流动
    var L = 'M' + f(cx) + ',' + f(yB) + ' C' + f(cx - bw * .55) + ',' + f(yB) + ' ' + f(c1 + 10) + ',' + f(yK) + ' ' + f(c1 - 34) + ',' + f(yK) +
      ' L' + f(b) + ',' + f(yK) + ' C' + f(b - 70) + ',' + f(yK) + ' ' + f(a + 70) + ',' + f(yG) + ' ' + f(a) + ',' + f(yG) + ' L' + r + ',' + f(yG) + ' Q0,' + f(yG) + ' 0,' + f(yG + r);
    var Rr = 'M' + f(cx) + ',' + f(yB) + ' C' + f(cx + bw * .55) + ',' + f(yB) + ' ' + f(c2 - 10) + ',' + f(yK) + ' ' + f(c2 + 34) + ',' + f(yK) +
      ' L' + f(b2) + ',' + f(yK) + ' C' + f(b2 + 70) + ',' + f(yK) + ' ' + f(a2 - 70) + ',' + f(yG) + ' ' + f(a2) + ',' + f(yG) + ' L' + f(W - r) + ',' + f(yG) + ' Q' + W + ',' + f(yG) + ' ' + W + ',' + f(yG + r);
    // 闭合轮廓(左下 → 左上 → 中心 → 右上 → 右下)
    var Lrev = 'M0,' + f(h) + ' L0,' + f(yG + r) + ' Q0,' + f(yG) + ' ' + r + ',' + f(yG) + ' L' + f(a) + ',' + f(yG) + ' C' + f(a + 70) + ',' + f(yG) + ' ' + f(b - 70) + ',' + f(yK) + ' ' + f(b) + ',' + f(yK) +
      ' L' + f(c1 - 34) + ',' + f(yK) + ' C' + f(c1 + 10) + ',' + f(yK) + ' ' + f(cx - bw * .55) + ',' + f(yB) + ' ' + f(cx) + ',' + f(yB);
    var close = Lrev + ' C' + f(cx + bw * .55) + ',' + f(yB) + ' ' + f(c2 - 10) + ',' + f(yK) + ' ' + f(c2 + 34) + ',' + f(yK) + ' L' + f(b2) + ',' + f(yK) +
      ' C' + f(b2 + 70) + ',' + f(yK) + ' ' + f(a2 - 70) + ',' + f(yG) + ' ' + f(a2) + ',' + f(yG) + ' L' + f(W - r) + ',' + f(yG) + ' Q' + W + ',' + f(yG) + ' ' + W + ',' + f(yG + r) + ' L' + W + ',' + f(h) + ' Z';
    d.style.height = h + 'px';
    var sv = d.querySelector('svg'); sv.setAttribute('viewBox', '0 0 ' + W + ' ' + f(h)); sv.setAttribute('width', W); sv.setAttribute('height', f(h));
    d.querySelector('.fill').setAttribute('d', close);
    d.querySelector('.rim').setAttribute('d', Lrev.replace(/^M0,[\d.]+ L/, 'M') + ' ' + Rr.replace(/^M[\d.]+,[\d.]+ /, ''));
    d.querySelector('.halo').setAttribute('d', d.querySelector('.rim').getAttribute('d'));
    d.querySelectorAll('.fl.l').forEach(function (p) { p.setAttribute('d', L); });
    d.querySelectorAll('.fl.r').forEach(function (p) { p.setAttribute('d', Rr); });
    var gp = "path('" + close + "')"; d.querySelector('.gl').style.clipPath = gp; d.querySelector('.gl').style.webkitClipPath = gp;
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
    U.orb = $('#xa-orb', R); U.sub = $('#xa-sub', R); U.cd = cd; U.port = port;
    deck();
    ['i', 's'].forEach(function (k) { var im = el('img', 'xa-jv ' + k); im.alt = ''; im.decoding = 'async'; im.dataset.src = 'x/jarvis/avatar/jarvis_' + (k === 'i' ? 'idle' : 'speaking') + '.svg'; U.orb.appendChild(im); });
    if (window.SHXARM && SHXARM.ok()) { try { var h3 = el('div', 'xa-3d'); U.orb.appendChild(h3); U.arm = SHXARM.mount(h3, { small: innerWidth < 700 || innerHeight < 480 }); U.orb.classList.add('gl'); } catch (e) { console.warn('[Armilla 3D]', e); U.arm = null; } }
    dock.querySelectorAll('.ib').forEach(function (b) { b.onclick = function () { blip(880, .08, .05); act(b.getAttribute('data-a')); }; });
    U.orb.onclick = function () {
      if (!VOICE.on) { VOICE.on = true; ls('gn:sh:x-voice', '1'); loadVoice(); if (!VOICE.clips) I.toast(pnice() + ' 语音载入中…'); }
      // 10-27 王磊反馈①:到达/悬停后再点 AI 不再催选星域
      if (O) say(['a10']); else if (ARR && ARR === S.target) say(['a09']); else say(VOICE.last && VOICE.last[0] !== 'a02' ? VOICE.last : ['a02']);
    };
    applyPersona();
    var kp = $('#xc-keys', R); if (kp && !ls('gn:sh:x-keys')) kp.classList.add('min');
    setMode(MODE, true);
  }
  function applyPersona() {
    if (!U.orb) return; var j = isJ();
    U.orb.classList.toggle('jv', j);
    if (j) U.orb.querySelectorAll('.xa-jv').forEach(function (im) { if (!im.src) im.src = im.dataset.src; });
    var nm = U.orb.querySelector('.nm'); if (nm) nm.textContent = pname();
    U.orb.setAttribute('aria-label', pnice() + ' 舰载智能 · 点我重播 / 开启语音');
    if (U.sub) U.sub.classList.toggle('jv', j);
    if (U.port) { var tg = U.port.querySelector('.tag'); if (tg) tg.textContent = '侧舷窗 · ' + pname() + ' 接管'; }
    if (U.arm) { if (j) U.arm.stop(); else if (X.isOpen && X.isOpen()) U.arm.start(); }
  }
  function setPersona(id) {
    id = id === 'jarvis' ? 'jarvis' : 'armilla'; if (id === PER.id) return;
    PER.id = id; ls('starhelm.voice.persona', id);
    VOICE.gen++; VOICE.q = []; VOICE.busy = false; if (VOICE.cur) { try { VOICE.cur.onended = null; VOICE.cur.pause(); } catch (e) { } VOICE.cur = null; }
    VOICE.clips = null; loadVoice(); applyPersona(); armState('');
    setTimeout(function () { say(['a01']); }, VOICE.on ? 500 : 0);
  }
  function armState(s) { if (!U.orb) return; U.orb.classList.toggle('speak', s === 'speak'); if (U.arm && U.arm.state !== 'ALERT') U.arm.set(s === 'speak' ? 'SPEAKING' : s === 'think' ? 'THINKING' : s === 'listen' ? 'LISTENING' : 'IDLE'); }
  var subT = 0;
  function sub(t) { if (!U.sub) return; U.sub.innerHTML = '<b>' + pname() + '</b>' + esc(t); U.sub.classList.add('on'); clearTimeout(subT); subT = setTimeout(function () { U.sub.classList.remove('on'); }, Math.min(9000, 2600 + t.length * 160)); }
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
    closeCards(); PL.tgt = S.target; PL.pick = null;   // 王磊 10-27:目标沿用驾驶舱里已选定的星球,不再重选
    var c = el('div', 'xs-card', ''); c.id = 'xs-plan'; c.setAttribute('role', 'dialog'); c.setAttribute('aria-label', '航行规划');
    c.innerHTML = '<h4><span>航行规划 · 天枢号 <small>NAV PLAN</small></span><button class="xc" type="button" aria-label="关闭">×</button></h4>' +
      '<div class="xs-sec">目的地 · 已在导航目标中选定(右侧列表可换)</div><div class="xs-dst" id="xs-dst"></div><div id="xs-bodies" hidden></div>' +
      '<div class="xs-sec">' + (window.SHXL ? '航图 · 尺度阶梯 · 七星域与快捷目的地' : '星域 · 航图只选星域') + '</div><div class="' + (window.SHXL ? '' : 'xs-grid') + '" id="xs-doms"></div>' +
      '<div class="xs-sec">引擎 · 继承弦穹号 · <span style="color:#7fe3c4">实测</span> / <span style="color:#ffd27a">推断</span> / <span style="color:#c9a6ff">猜想</span></div><div class="xs-grid" id="xs-engs"></div>' +
      '<div class="xs-pre" id="xs-pre"></div>' +
      '<div class="xs-row"><button class="xs-no" type="button">取消</button><button class="xs-go" type="button">出发</button></div>' +
      '';
    R.appendChild(c);
    var bd = $('#xs-bodies', c), eg = $('#xs-engs', c);
    ENG.forEach(function (e) { if (e.model === 'none') return; var x = el('button', 'xs-chip', e.zh + '<i style="color:' + TIER[e.tier] + '">' + e.tier + '</i>'); x.type = 'button'; x.dataset.id = e.id; x.onclick = function () { var r = engRule(e.id); if (!r.ok) { I.toast('🔒 ' + e.zh + ':' + r.why); return; } ENGID = e.id; ls('gn:sh:x-engine', e.id); blip(600, .06, .04); refreshPlan(); }; eg.appendChild(x); });
    if (window.SHXL) {
      // C1.7 尺度阶梯航图:选快捷目的地;太阳系内有星球的直接设为驾驶舱目标,其余只做规划(跃迁第 4 步开放)
      PL.domOf = SHXL.dom;
      PL.lad = SHXL.render($('#xs-doms', c), PL.tgt, function (x) {
        PL.pick = x; PL.tgt = x.body || x.id; if (x.body && S.target !== x.body) I.setTarget(x.body); blip(560, .06, .04); refreshPlan();
      }, function (x) { return x.body && BY[x.body] ? (x.id === 'iss' ? 420 : distTo(BY[x.body])) : x.km; });
    } else {
    var DOMS = [['I', '家园', 'earth'], ['II', '日与月', 'moon'], ['III', '行星世界', null], ['IV', '太阳系边疆', 'pluto'], ['V', '群星', 0], ['VI', '银河', 0], ['VII', '宇宙', 0]], dg = $('#xs-doms', c);
      function domOf(id) { return id === 'earth' ? 0 : id === 'moon' || id === 'sun' ? 1 : id === 'pluto' ? 3 : 2; }
      DOMS.forEach(function (d, i) { var x = el('button', 'xs-chip' + (d[2] === 0 ? ' off' : ''), '<i style="color:#f0c97a;font-style:normal">' + d[0] + '</i> ' + d[1] + (d[2] === 0 ? '<i>跃迁 · 即将</i>' : '')); x.type = 'button'; x.dataset.d = i;
        x.onclick = function () { if (d[2] === 0) { I.toast('星域 ' + d[0] + ' ' + d[1] + ':跨星域跃迁即将开放'); return; } if (domOf(PL.tgt) !== i) { PL.tgt = d[2] || 'mars'; I.setTarget(PL.tgt); } refreshPlan(); }; dg.appendChild(x); });
      PL.domOf = domOf;
    }
    $('.xc', c).onclick = $('.xs-no', c).onclick = function () { closeCards(); };
    $('.xs-go', c).onclick = launch;
    refreshPlan(); if (U.arm && !VOICE.busy) U.arm.set('LISTENING');
    if (!PL.greeted) { PL.greeted = true; say(['a02']); }
  }
  function plan() {
    var far = !BY[PL.tgt] && window.SHXL && SHXL.get(PL.tgt), e = eng(ENGID);
    var b = far ? { id: far.id, zh: far.zh, R: 1, far: true, col: SHXL.DOMS[far.dom].c1, note: far.note } : (BY[PL.tgt] || BY.mars), km = far ? far.km : distTo(b);
    var tr = VD && VD.travel ? VD.travel(e, km, e.model === 'warp' ? 3 : null) : { earthS: km / (e.v || 15), shipS: km / (e.v || 15) };
    var act = e.id === 'assist' ? '引力弹弓' : e.id === 'gate' ? '虫洞穿越' : (window.SHXL ? SHXL.dom(b.id) : 2) >= 4 ? (e.model === 'warp' ? '跨星域跃迁' : '跨星域航行') : '星域内穿梭';
    var demo = Math.round(Math.log(Math.max(2, km / Math.max(1, b.R))) / 0.9 + 4);
    return { b: b, e: e, km: km, tr: tr, act: act, demo: demo };
  }
  // C1.6 引擎可达范围(SHXE.rule):目标星域超出引擎能力则锁定;当前引擎被锁时自动换成第一个可用的
  function engRule(id) { if (!window.SHXE) return { ok: true }; var d = PL.domOf ? PL.domOf(PL.tgt) : 2; return SHXE.rule(id, d); }
  function refreshPlan() {
    var c = $('#xs-plan', R); if (!c) return;
    if (!engRule(ENGID).ok) { var alt = ENG.filter(function (e) { return e.model !== 'none' && engRule(e.id).ok; })[0]; if (alt) { I.toast('🔒 ' + eng(ENGID).zh + ':' + engRule(ENGID).why + ' · 已换成 ' + alt.zh); ENGID = alt.id; } }
    var p = plan();
    var nm = PL.pick && PL.pick.body === p.b.id ? PL.pick.zh : p.b.zh;
    var dd = $('#xs-dst', R); if (dd) dd.innerHTML = '<span style="color:' + (p.b.col || '#7fd6ff') + '">●</span> <b>' + nm + '</b> <small>' + (p.km < 1 ? '就在附近' : (VD ? VD.fmtDist(p.km) : I.fkm(p.km))) + (p.b.far ? ' · 自地球' : '') + '</small>';
    var go = $('.xs-go', c); if (go) { go.textContent = p.b.far ? '跃迁 · 即将开放' : '出发'; go.style.opacity = p.b.far ? '.55' : ''; }
    R.querySelectorAll('#xs-doms .xs-chip').forEach(function (x) { x.classList.toggle('on', PL.domOf && +x.dataset.d === PL.domOf(p.b.id)); });
    c.querySelectorAll('#xs-bodies .xs-chip').forEach(function (x) { x.classList.toggle('on', x.dataset.id === p.b.id); });
    c.querySelectorAll('#xs-engs .xs-chip').forEach(function (x) { var r = engRule(x.dataset.id); x.classList.toggle('lock', !r.ok); x.title = r.ok ? (r.note || '') : '🔒 ' + r.why; x.classList.toggle('on', x.dataset.id === p.e.id); });
    var er = engRule(p.e.id);
    var ft = VD ? VD.fmtTime : I.fdur, fd = VD ? VD.fmtDist : I.fkm;
    var ship = p.tr.shipS && Math.abs(p.tr.shipS - p.tr.earthS) / p.tr.earthS > 0.01 ? '(船上 ' + ft(p.tr.shipS) + ')' : '';
    $('#xs-pre', c).innerHTML = '<div>目标 <b>' + p.b.zh + '</b> · ' + p.act + ' · 航程 <b>' + fd(p.km) + '</b></div>' +
      '<div>引擎 <b style="color:' + TIER[p.e.tier] + '">' + p.e.zh + '</b>(' + p.e.tier + ')· 真实预计耗时 <b>' + ft(p.tr.earthS) + '</b>' + ship + '</div>' +
      (er.note ? '<div class="f" style="color:#f0c97a">⚠ ' + esc(er.note) + '</div>' : '') + (p.b.far ? '<div class="f" style="color:#9fd0e8">' + esc(p.b.note || '') + '。本阶段只做航线规划:出太阳系星空(第 3 步)和跃迁序列(第 4 步)开放后即可出发。</div>' : '') + '<div class="f">' + esc(p.e.fact || '') + '</div>' + (p.b.far ? '' : '<div class="f">演示中天枢号会压缩时间,约 ' + p.demo + ' 秒抵达;读数里的时间按真实物理计算。</div>');
  }
  var LAUNCH = null, ARR = null;
  function launch() {
    var p = plan(); if (p.b.far) { I.toast('已规划航线:' + p.b.zh + ' · 跨星域跃迁即将开放'); blip(420, .12, .05); return; } if (!engRule(p.e.id).ok) { I.toast('🔒 ' + p.e.zh + ':' + engRule(p.e.id).why); return; } closeCards(); if (p.km < 1) { I.toast('已经在 ' + p.b.zh + ' 附近了'); return; }
    LAUNCH = p; ARR = null; I.setTarget(p.b.id); S.auto = false; S.base = 0; S.mult = 1; stopOrbit(true);
    var seq = isJ() ? enLaunch(p) : ['a03', { t: '本次航行将使用' }, { t: p.e.zh }, { t: ',即将进行' }, { t: p.act }, { t: '。航程约' }].concat(sayDist(p.km).map(function (t) { return { t: t }; }), [{ t: ',预计耗时' }], sayTime(p.tr.earthS).map(function (t) { return { t: t }; }), [{ t: '。' }]);
    if (p.e.id === 'assist') say(['a14']);
    if (p.e.model === 'warp') say(['a15']);
    if (p.e.model === 'gate') say(['a17']);
    say(seq, function () { countdown(function () { if (MODE !== 'boost') setMode('boost', true); I.autopilot(true); engStart(p.e.id); log('出发', p.b, p.e); }); });
  }
  function enLaunch(p) {
    var tk = TECH[p.e.id] || 'tech10', ac2 = ACT[p.act] || ACT['星域内穿梭'];
    return ['a03', { t: 'This voyage will use', id: 'b01' }, { t: TECH_EN[tk], id: tk }, { t: '.', p: 1 }, { t: 'Now initiating', id: 'b02' }, { t: ac2[1], id: ac2[0] }, { t: '.', p: 1 }, { t: 'Distance', id: 'b03' }, { t: ',', p: 1 }, { t: 'approximately', id: 'b08' }]
      .concat(enDist(p.km), [{ t: '.', p: 1 }, { t: 'Estimated time', id: 'b04' }, { t: ',', p: 1 }, { t: 'approximately', id: 'b08' }], enTime(p.tr.earthS), [{ t: '.', p: 1 }]);
  }
  function countdown(cb) {
    if (VOICE.cd) return; VOICE.cd = 1; var cb0 = cb; cb = function () { VOICE.cd = 0; cb0(); };
    sub(line('a06')); armState('think');
    var a = null, clips = VOICE.on ? seqClips(['a06']) : null; if (clips) { a = voiceAudio(clips[0]); a.play().catch(function () { }); }
    var n = 3, step = 900, tick = function () {
      if (n === 0) { U.cd.textContent = ''; U.cd.style.opacity = 0; blip(1320, .5, .09); armState(''); cb(); return; }
      U.cd.textContent = n; U.cd.style.opacity = 1; blip(880, .15, .07); n--; setTimeout(tick, step);
    }, go = function () { if (go.d) return; go.d = 1; tick(); };
    // 10-27 王磊反馈③:3-2-1 跟播报同步。"点火倒计时:"约占语音前 40%,其后 三/二/一/出发 四拍均分
    if (a) {
      var arm = function () { var d = isFinite(a.duration) && a.duration > 1 ? a.duration * 1000 : 3600; step = Math.max(500, d * .6 / 4); setTimeout(go, d * .4); };
      if (a.readyState >= 1) arm(); else { a.addEventListener('loadedmetadata', arm, { once: true }); setTimeout(go, 2500); }
    } else tick();
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
      '<label>舰载智能 · Persona<span id="xs-per"><button type="button" class="xs-chip' + (isJ() ? '' : ' on') + '" data-p="armilla">Armilla</button><button type="button" class="xs-chip' + (isJ() ? ' on' : '') + '" data-p="jarvis">JARVIS</button></span></label>' +
      '<label>舰载语音<input class="xs-sw" type="checkbox" id="xs-v"' + (VOICE.on ? ' checked' : '') + '></label>' +
      '<label title="与 Armilla PWA 同款的舰载空间声场">AI 空间感 · Spatial FX<input class="xs-sw" type="checkbox" id="xs-sfx"' + (SFX.on ? ' checked' : '') + '></label>' +
      '<label title="穿越日球层顶时播放旅行者 1 号等离子体波仪实测录音">等离子体波之声 · Voyager PWS<input class="xs-sw" type="checkbox" id="xs-pws"' + (PWS.on ? ' checked' : '') + '></label>' +
      '<label>音量<input type="range" min="0" max="1" step="0.05" id="xs-vol" value="' + SND.vol + '"></label>' +
      '<div class="xs-row" style="justify-content:space-between"><span class="np" id="xs-np">' + (MUS.cur ? (MUS.cur === 'idle' ? IDLE[MUS.ii % IDLE.length] : TRACKS[MUS.cur]).zh : '音乐按航行状态自动切换:待命(3 首轮播)/ 巡航 / 加速 / 环绕') + '</span><button class="xs-no" type="button" id="xs-nx">下一首</button></div>' +
      '<div class="cr">音乐:OpenGameArt.org 公有领域(CC0)曲目 —— Space Echo(Centurion_of_war)、Space Music: Out There(yd)、Magic Space(CodeManu)、Outer Space Loop(wipics);待命轮播另含 Starhelm Drift、Starhelm Halo 两首本项目程序合成原创曲。音效为程序实时合成。<br>等离子体波之声:旅行者 1 号 PWS 实测录音(2012–13),NASA/JPL-Caltech/University of Iowa · PIA17045。<br>舰载语音:Armilla(中文)与 JARVIS(英文)均由 AI 合成 · Voice generated by AI (MiniMax)。</div>';
    R.appendChild(c);
    $('.xc', c).onclick = function () { closeCards(); };
    $('#xs-m', c).onchange = function () { SND.music = this.checked; ls('gn:sh:x-music', SND.music ? '1' : '0'); if (SND.music) musPlay(MUS.want); else musStop(); };
    $('#xs-f', c).onchange = function () { SND.sfx = this.checked; ls('gn:sh:x-sfx', SND.sfx ? '1' : '0'); if (SND.sfx) { ac(); if (AC.state === 'suspended') AC.resume(); humOn(); blip(880, .1, .06); } else { humOff(); engStop(); } };
    $('#xs-sfx', c).onchange = function () { setSpaceFx(this.checked); if (VOICE.on) say(['a06']); };
    $('#xs-v', c).onchange = function () { VOICE.on = this.checked; ls('gn:sh:x-voice', VOICE.on ? '1' : '0'); if (VOICE.on) { loadVoice(); if (!VOICE.clips) I.toast(pnice() + ' 语音载入中…'); } };
    c.querySelectorAll('#xs-per .xs-chip').forEach(function (b) { b.onclick = function (e) { e.preventDefault(); setPersona(b.dataset.p); c.querySelectorAll('#xs-per .xs-chip').forEach(function (x) { x.classList.toggle('on', x.dataset.p === PER.id); }); }; });
    $('#xs-vol', c).oninput = function () { SND.vol = +this.value; ls('gn:sh:x-vol', SND.vol); if (M) M.gain.value = SND.vol; if (MUS.a) MUS.a.volume = SND.vol * 0.55 * (PWS.playing ? 0.25 : 1); if (PWS.a) PWS.a.volume = pwsVol(); };
    $('#xs-pws', c).onchange = function () { PWS.on = this.checked; ls('gn:sh:x-pws', PWS.on ? '1' : '0'); if (PWS.on) pwsLoad(); else pwsStop(); };
    $('#xs-nx', c).onclick = function () { if (!SND.music) { SND.music = true; ls('gn:sh:x-music', '1'); $('#xs-m', c).checked = true; } var i = MUS.order.indexOf(MUS.cur || 'idle'); MUS.lock = performance.now() + 120000; if (MUS.cur === 'idle' && (MUS.ii + 1) % IDLE.length) { MUS.ii++; MUS.cur = null; musPlay('idle'); } else { if (MUS.cur === 'idle') MUS.ii++; musPlay(MUS.order[(i + 1) % MUS.order.length]); } };
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
  var LAY = 0;
  function frame(f) {
    var dt = f.dt; tAcc += dt;
    // 右侧:导航目标列表紧跟在目标卡下方(目标卡高度随星球变化,避免两窗重叠)
    if ((LAY = (LAY || 0) + 1) % 10 === 1) { var rr = SHXC._.root && SHXC._.root(), tg = rr && rr.querySelector('.p.tgt'), ls2 = rr && rr.querySelector('.p.lst'); if (tg && ls2 && getComputedStyle(ls2).display !== 'none') { var ky = rr.querySelector('.p.keys'), gb = innerHeight - 175, kb = ky && ky.offsetHeight ? Math.min(gb, ky.offsetTop) : gb, top = tg.offsetTop + tg.offsetHeight + 12, mh = Math.max(90, kb - 12 - top); if (ls2._t !== top + ':' + mh) { ls2._t = top + ':' + mh; ls2.style.top = top + 'px'; ls2.style.maxHeight = mh + 'px'; ls2.style.minHeight = '0'; } }
      var nv = rr && rr.querySelector('.p.nav'); if (nv) { var nmh = Math.max(120, innerHeight - 175 - nv.offsetTop); if (nv._m !== nmh) { nv._m = nmh; nv.style.maxHeight = nmh + 'px'; nv.style.overflowY = 'auto'; } } }
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
    if ((ENGV || FXON) && !S.auto && !S.voy && !PEND_PORT) engStop();   // C2.6b S.voy:深空跃迁控制器接管期间不关引擎
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
    if (window.SHXT && SHXT.on()) return;
    if (!X.isOpen() || e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
    var k = e.key.toLowerCase();
    if (k === 'n') togglePlan(); else if (k === 'c') act('mode'); else if (k === 'v') portAct(); else if (k === 'p') photo(!R.classList.contains('photo')); else if (k === 'm') toggleSnd(); else if (k === 'j') setPersona(isJ() ? 'armilla' : 'jarvis');
    else if (k === 'escape' && (R.classList.contains('photo') || $('.xs-card', R))) { photo(false); closeCards(); e.stopImmediatePropagation(); e.preventDefault(); return; }
    else return;
    e.preventDefault(); e.stopPropagation();
  }
  /* C1.9 登舰:舱门遮罩 + 「舰载智能语音 / 舱内音响」两条真实下载进度;最短 3.2 s、最长 12 s(超时也放行),可跳过 */
  function pull(url, onp) {   // 带进度的预取(写入浏览器缓存,随后 new Audio 直接命中)
    return fetch(url).then(function (r) {
      if (!r.ok) throw 0; var tot = +r.headers.get('content-length') || 0, got = 0;
      if (!r.body || !r.body.getReader) return r.blob().then(function () { onp(1); });
      var rd = r.body.getReader();
      return (function pump() { return rd.read().then(function (x) { if (x.done) { onp(1); return; } got += x.value.length; onp(tot ? Math.min(.99, got / tot) : .5); return pump(); }); })();
    }).catch(function () { onp(1); });
  }
  function board(hg, done) {
    var root = R || (I.root && I.root()); if (!root) { done(); return; }
    var ov = $('#xa-board', root); if (ov) ov.remove();
    ov = el('div', '', '<div class="bd-door l"></div><div class="bd-door r"></div><div class="bd-mid"><div class="bd-k">BOARDING · 登舰</div><div class="bd-t">天枢号 STARHELM</div>' +
      '<div class="bd-row"><span>舰载智能语音 · ' + pname() + '</span><i><b id="bd-v"></b></i><em id="bd-vp">0%</em></div>' +
      '<div class="bd-row"><span>舱内音响系统</span><i><b id="bd-m"></b></i><em id="bd-mp">0%</em></div>' +
      '<div class="bd-s" id="bd-s">气闸加压中…</div><button type="button" class="bd-skip">跳过 ›</button></div>');
    ov.id = 'xa-board'; root.appendChild(ov);
    var pv = { v: 0, m: 0 }, t0 = performance.now(), fin = false, ok = { v: false, m: false };
    function bar(k, f) { pv[k] = Math.max(pv[k], f); var b = $('#bd-' + k, ov), e = $('#bd-' + k + 'p', ov); if (b) b.style.width = (pv[k] * 100).toFixed(0) + '%'; if (e) e.textContent = (pv[k] * 100).toFixed(0) + '%'; if (pv[k] >= 1) ok[k] = true; check(); }
    function finish() {
      if (fin) return; fin = true; var st = $('#bd-s', ov); if (st) st.textContent = '舱门开启';
      blip(520, .25, .05); ov.classList.add('open'); setTimeout(function () { ov.remove(); }, 1600);
      if (hg === VOICE.gen) done();
    }
    function check() { if (fin) return; if (ok.v && ok.m) { var st = $('#bd-s', ov); if (st) st.textContent = '系统就绪'; setTimeout(finish, Math.max(400, 3200 - (performance.now() - t0))); } }
    $('.bd-skip', ov).onclick = finish; setTimeout(finish, 12000);
    setTimeout(function () { var st = $('#bd-s', ov); if (st && !fin) st.textContent = '校准星图 · 唤醒舰载智能…'; }, 1300);
    // 音乐:当前待命曲
    if (SND.music !== false) pull(IDLE[MUS.ii % IDLE.length].f, function (f) { bar('m', f); }); else bar('m', 1);
    // 语音:清单 + 欢迎语两句(a01/a02)
    if (!VOICE.on) bar('v', 1);
    else fetch('x/' + PER.id + '/manifest.json').then(function (r) { return r.json(); }).then(function (m) {
      var c = {}; m.items.forEach(function (it) { c[it.id] = it; c['t:' + it.text] = it; }); if (!VOICE.clips) { VOICE.clips = c; VOICE.pack = PER.id; }
      var fs = ['a01', 'a02'].map(function (id) { var it = c[id]; return it && ('x/' + PER.id + '/' + (sfxChain() ? it.file : (SFX.on && it.file_fx ? it.file_fx : it.file))); }).filter(Boolean);
      var part = fs.map(function () { return 0; }); bar('v', .1);
      if (!fs.length) { bar('v', 1); return; }
      fs.forEach(function (u, k) { pull(u, function (f) { part[k] = f; bar('v', .1 + .9 * part.reduce(function (x, y) { return x + y; }, 0) / fs.length); }); });
    }).catch(function () { bar('v', 1); });
  }
  X.on(function (ev, a) {
    if (ev === 'open') {
      var rq = SHXC._.root && SHXC._.root(); if (rq && !rq._cur) { rq._cur = 1; var dn = null;
        rq.addEventListener('pointerdown', function (e) { if (e.target.closest('button,input,label,.xs-card,.p')) return; dn = [e.clientX, e.clientY]; });
        addEventListener('pointermove', function (e) { if (dn && Math.abs(e.clientX - dn[0]) + Math.abs(e.clientY - dn[1]) > 4) rq.classList.add('xc-drag'); });
        addEventListener('pointerup', function () { dn = null; rq.classList.remove('xc-drag'); }); }
      build(); loadVoice(); setMode(MODE, true); if (U.arm && !isJ()) { U.arm.resize(); U.arm.reveal(); U.arm.start(); }
      if (SND.sfx) { ac(); if (AC && AC.state === 'suspended') AC.resume(); humOn(); }
      // 王磊 10-27 00:10:进入航行时自动关掉 1.0 背景音乐,开启驾驶舱音乐系统;离开驾驶舱再恢复原背景音乐
      var bm = document.getElementById('btn-music'); MUS.bgm = !!(bm && bm.getAttribute('aria-pressed') === 'true'); if (MUS.bgm) bm.click();
      SND.music = true; var mc = R && R.querySelector('#xs-m'); if (mc) mc.checked = true;
      // 王磊 10-27 22:16:先登舰 —— 舱门动画期间预载语音与音乐(带进度条),都就绪后音乐淡入、再播欢迎语,不再突然冒出声音
      hush(); PL.greeted = true; var hg = ++VOICE.gen;
      board(hg, function () { if (hg !== VOICE.gen) return; musPlay('idle'); setTimeout(function () { if (hg !== VOICE.gen) return; say(['a01']); say(['a02']); }, 1200); });
    } else if (ev === 'close') { pwsStop(true); hush(); if (window.SHXE) SHXE.hide(); if (U.arm) U.arm.stop(); stopOrbit(true); engStop(); humOff(); musStop(); closeCards(); if (R) R.classList.remove('photo'); if (MUS.bgm) { MUS.bgm = false; var bm2 = document.getElementById('btn-music'); if (bm2 && bm2.getAttribute('aria-pressed') !== 'true') bm2.click(); } }
    else if (ev === 'frame') frame(a);
    else if (ev === 'decel') { say(['a07']); if (FXON && window.SHXFX) SHXFX.set(0); }
    else if (ev === 'arrive') { ARR = a.id; engStop(); blip(660, .3, .06); if (LAUNCH && LAUNCH.b.id === a.id) { log('抵达', a, LAUNCH.e); var xk = LAUNCH.e.id; if (window.SHXE) setTimeout(function () { SHXE.show(xk); }, 1800); LAUNCH = null; } if (PEND_PORT) { PEND_PORT = false; say(['a08']); startOrbit(a); } else { say(['a08']); offer(a); } }
    else if (ev === 'hover') { ARR = S.target; alarm(); alertOrb(); say(['a13']); }
  });
  addEventListener('keydown', onKey, true);

  /* 取消 1.0 弦穹号飞船入口:巡天子页里统一进天枢号驾驶舱 */
  function takeover() {
    if (!window.SH || takeover.done) return; takeover.done = true;
    // Esc 分层:侧舷窗/卫星巡航 → 回驾驶舱原位;摄影模式 → 退出摄影;面板 → 收起;都没有 → 交给驾驶舱弹「结束探索」确认
    window.SHXC._esc = function () {
      if (O || (R && R.classList.contains('port'))) { stopOrbit(); return true; }
      if (R && R.classList.contains('photo')) { photo(false); return true; }
      if (R && R.querySelector('.xs-card')) { closeCards(); return true; }
      return false;
    };
    // 驾驶舱入口装进顶栏「航行」方框(圆形视图条里的驾驶舱按钮取消)
    // 1.0 sh-voyage.js 已归档,「航行」方框由这里自己建(位置同 1.0:任务按钮之后)
    (function mk(n) { if (document.querySelector('.sh-btn-voy')) return; var nav = document.querySelector('.le-actions'), bq = nav && nav.querySelector('.sh-btn-quest'); if (!bq) { if (n < 600) setTimeout(function () { mk(n + 1); }, 100); return; } var b = document.createElement('button'); b.type = 'button'; b.className = 'le-btn le-btn--hero sh-btn-voy'; b.innerHTML = '<span class="le-btn__ico">🚀</span><span class="le-btn__txt">航行<small>VOYAGE</small></span>'; nav.insertBefore(b, bq.nextSibling); })(0);
    if (/[?&]voy=1/.test(location.search)) (function w3(n) { if (window.SH_READY && window.SHXV) return SHXV.go('fly'); if (n < 600) setTimeout(function () { w3(n + 1); }, 100); })(0);
    (function lab(k) { var b = document.querySelector('.sh-btn-voy'); if (b) { var t = b.querySelector('.le-btn__txt'); if (t) t.innerHTML = '航行<small>天枢号 · F</small>'; b.title = '进入天枢号驾驶舱(F)'; b.addEventListener('click', function (e) { e.stopImmediatePropagation(); e.preventDefault(); if (window.SHXV) SHXV.go('fly'); else SHXC.open(); }, true); return; } if (k < 300) setTimeout(function () { lab(k + 1); }, 100); })(0);
    SH.voyEnter = function () { if (window.SHXV) SHXV.go('fly'); else SHXC.open(); };
    // 1.0 弦穹号航行已在 X 页归档:航图「前往」等旧入口全部转进驾驶舱;能直达的星域映射成驾驶舱目标
    var SEC2T = { home: 'earth', moon: 'moon', planets: 'mars', edge: 'pluto', outer: 'pluto' };
    SH.voyReady = function () { return !!(window.SHXC && SHXC.isOpen && SHXC.isOpen()); };
    SH.voySetTarget = function (id) {
      if (!SH.voyReady()) { if (window.SHXV) SHXV.go('fly'); else SHXC.open(); }
      var n = 0; (function go() { if (!SH.voyReady() && n++ < 40) { setTimeout(go, 150); return; } setTimeout(function () { var t = SEC2T[id] || id, BY = SHXC._ && SHXC._.BY; if (BY && BY[t]) { SHXC.setTarget(t); setTimeout(function () { if (SHXC.state().target !== t) SHXC.setTarget(t); }, 1200); SHXC._.toast('航图目的地:' + BY[t].zh + ' · 按 G 自动驾驶'); } else togglePlan(); }, 300); })();
    };
    SH.voyLand = function (id) { SH.voySetTarget(id); };
    SH.voyExit = function () { if (window.SHXC && SHXC.confirmEnd) SHXC.confirmEnd(); };
    // 航图里的旧文案「弦穹号」→「天枢号」
    (function relabel(k) { var A = document.querySelector('section.sha'); if (!A) { if (k < 600) setTimeout(function () { relabel(k + 1); }, 200); return; } var mo = new MutationObserver(function () { document.querySelectorAll('.sha button').forEach(function (b) { if (b.textContent.indexOf('弦穹号') >= 0) b.textContent = b.textContent.replace('驾驶弦穹号前往', '驾驶天枢号前往').replace('弦穹号', '天枢号'); }); }); mo.observe(A, { childList: true, subtree: true }); })(0);
  }
  takeover(); addEventListener('load', takeover);

  window.SHXS = { eng: function (id) { if (id) engStart(id); else engStop(); }, orbitState: function () { return O ? { id: O.b.id, r: O.r, ang: O.ang } : PEND_PORT ? { pend: true } : null; }, pws: { load: pwsLoad, play: pwsPlay, stop: pwsStop, cue: pwsCue, state: function () { return { ready: PWS.ready, loading: PWS.loading, on: PWS.on, playing: PWS.playing, vol: pwsVol() }; } }, persona: function (id) { if (id) setPersona(id); return PER.id; }, enDist: enDist, enTime: enTime, voiceDbg: function () { return { on: VOICE.on, persona: PER.id, pack: VOICE.pack, n: VOICE.clips ? Object.keys(VOICE.clips).length : 0, sfx: SFX.on }; }, spaceFx: setSpaceFx, say: say, lines: L, zhNum: zhNum, sayDist: sayDist, sayTime: sayTime, plan: function () { if (X.isOpen()) togglePlan(); }, orbit: function () { if (X.isOpen()) portAct(); }, mode: function (m) { setMode(m); }, state: function () { return { mode: MODE, engine: ENGID, orbit: !!O, music: SND.music, sfx: SND.sfx, voice: VOICE.on, clips: !!VOICE.clips }; } };
})();
