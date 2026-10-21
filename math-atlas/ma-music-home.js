/* 星图 Math Atlas · 主页背景音乐「星图序曲 · Tonnetz」(v0.8.1)
 * 全部由浏览器实时合成,每一层都藏着一条数学规律:
 *   和声  在 Tonnetz(音网)上行走:每两小节按 π 的下一位数字选 P / L / R 变换(新黎曼理论),和弦每次只动一个音
 *   钟声  FM 合成,调制频率 = 载波 × φ(黄金比),得到不和谐却晶莹的“无理数钟声”
 *   旋律  音高 = 斐波那契数列 mod 7(皮萨诺周期 16),节奏 = 欧几里得节奏 E(5,16)
 *   拨弦  节奏 = Thue–Morse 序列,音高沿 e 的数位走五声音阶
 *   低音  欧几里得节奏 E(3,8);泛音层 = 根音的第 3、5、7 次谐波
 *   编排  各层按斐波那契小节 1,2,3,5,8,13 依次进入,34 小节一轮,第 26–29 小节“呼吸”抽掉鼓与低音
 *   声像  左右漂移的周期之比为 φ,永不重复
 * 默认关;只在用户开声后、开场动画结束后播放。页面隐藏时暂停。
 */
var PHI = (1 + Math.sqrt(5)) / 2;
var PI_D = "31415926535897932384626433832795028841971693993751058209749445923078164062862089986280348253421170679";
var E_D = "27182818284590452353602874713526624977572470936999595749669676277240766303535475945713821785251664274";
var PENTA = [0, 2, 4, 7, 9];
var BPM = 70, SD = 60 / BPM / 4, LOOK = 0.25;

function hz(m) { return 440 * Math.pow(2, (m - 69) / 12); }
function euclid(k, n, i) { return ((i * k) % n) < k; }
function thueMorse(n) { var c = 0; while (n) { c ^= n & 1; n >>= 1; } return c; }
var FIB7 = (function () { var a = 0, b = 1, r = []; for (var i = 0; i < 16; i++) { r.push(a % 7); var t = (a + b) % 7; a = b; b = t; } return r; })();

/* Tonnetz:三和弦 = {根, 大/小};P 平行、L 导音交换、R 关系 */
function triad(ch) { var r = ch.r; return ch.maj ? [r, r + 4, r + 7] : [r, r + 3, r + 7]; }
function plr(ch, op) {
  var r = ch.r;
  if (op === 0) return { r: r, maj: !ch.maj };                         // P
  if (op === 1) return ch.maj ? { r: r + 4, maj: false } : { r: r - 4, maj: true }; // L
  return ch.maj ? { r: r - 3, maj: false } : { r: r + 3, maj: true };  // R
}
function norm(ch) { var r = ((ch.r % 12) + 12) % 12; return { r: r, maj: ch.maj }; }
var NAMES = ["C", "C♯", "D", "E♭", "E", "F", "F♯", "G", "A♭", "A", "B♭", "B"];

export function createHomeMusic() {
  var AC = window.AudioContext || window.webkitAudioContext;
  var ac = null, out, comp, verb, dly, dlyFb, panL, on = false, timer = 0, step = 0, nextT = 0, subs = [];
  var chord = { r: 2, maj: false }, piI = 0, voicing = [50, 53, 57], padVoices = [], vol = 0.7;
  try { var v = JSON.parse(localStorage.getItem("ma:vol")); if (typeof v === "number") vol = v; } catch (e) {}

  function impulse(sec, decay) {
    var n = Math.floor(ac.sampleRate * sec), b = ac.createBuffer(2, n, ac.sampleRate);
    for (var c = 0; c < 2; c++) { var d = b.getChannelData(c); for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, decay); }
    return b;
  }
  function build() {
    ac = new AC();
    out = ac.createGain(); out.gain.value = 0;
    comp = ac.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 3; comp.attack.value = 0.02; comp.release.value = 0.4;
    out.connect(comp); comp.connect(ac.destination);
    verb = ac.createConvolver(); verb.buffer = impulse(5.5, 2.6); var vg = ac.createGain(); vg.gain.value = 0.55; verb.connect(vg); vg.connect(out);
    dly = ac.createDelay(2); dly.delayTime.value = SD * 3; dlyFb = ac.createGain(); dlyFb.gain.value = 0.38;
    var dlf = ac.createBiquadFilter(); dlf.type = "lowpass"; dlf.frequency.value = 3200;
    dly.connect(dlf); dlf.connect(dlyFb); dlyFb.connect(dly); var dg = ac.createGain(); dg.gain.value = 0.35; dlf.connect(dg); dg.connect(out); dg.connect(verb);
  }
  function bus(node, dry, wet, echo, pan) {
    var p = ac.createStereoPanner ? ac.createStereoPanner() : null, last = node;
    if (p) { p.pan.value = pan || 0; node.connect(p); last = p; }
    var a = ac.createGain(); a.gain.value = dry; last.connect(a); a.connect(out);
    var b = ac.createGain(); b.gain.value = wet; last.connect(b); b.connect(verb);
    if (echo) { var c = ac.createGain(); c.gain.value = echo; last.connect(c); c.connect(dly); }
  }
  function drift(t, period) { return Math.sin(t / period * 6.2832) * 0.6; }

  /* ---------- 乐器 ---------- */
  function pad(t, notes, dur) {
    padVoices.forEach(function (v) { try { v.g.gain.cancelScheduledValues(t); v.g.gain.setTargetAtTime(0.0001, t, 1.2); v.o.forEach(function (o) { o.stop(t + 6); }); } catch (e) {} });
    padVoices = [];
    notes.forEach(function (m, k) {
      var g = ac.createGain(), f = ac.createBiquadFilter(); f.type = "lowpass"; f.Q.value = 0.7;
      /* 截止频率由两个斐波那契周期(13 s、21 s)的慢波叠加控制 */
      var tt = ac.currentTime, base = 900 + 500 * Math.sin(tt / 13 * 6.28) + 300 * Math.sin(tt / 21 * 6.28);
      f.frequency.setValueAtTime(base, t); f.frequency.linearRampToValueAtTime(base + 600, t + dur * 0.5); f.frequency.linearRampToValueAtTime(base, t + dur);
      var os = [-7, 7, 0].map(function (cents, i) { var o = ac.createOscillator(); o.type = i < 2 ? "sawtooth" : "sine"; o.frequency.value = hz(m + (i === 2 ? 12 : 0)); o.detune.value = cents; o.connect(f); o.start(t); return o; });
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.045, t + 2.4); g.gain.setValueAtTime(0.045, t + dur - 0.2);
      f.connect(g); bus(g, 0.5, 0.9, 0, (k - 1) * 0.45);
      padVoices.push({ g: g, o: os });
    });
  }
  function bell(t, m, amp, pan) {
    var c = ac.createOscillator(), mo = ac.createOscillator(), mg = ac.createGain(), g = ac.createGain(), f = hz(m);
    c.frequency.value = f; mo.frequency.value = f * PHI;             // 调制比 = φ
    mg.gain.setValueAtTime(f * 2.2, t); mg.gain.exponentialRampToValueAtTime(f * 0.05, t + 2.5);
    mo.connect(mg); mg.connect(c.frequency); c.connect(g);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(amp, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + 3.2);
    bus(g, 0.55, 0.8, 0.45, pan); c.start(t); mo.start(t); c.stop(t + 3.3); mo.stop(t + 3.3);
  }
  function pluck(t, m, amp, pan) {
    var o = ac.createOscillator(), o2 = ac.createOscillator(), g = ac.createGain(), f = ac.createBiquadFilter();
    o.type = "triangle"; o2.type = "sine"; o.frequency.value = hz(m); o2.frequency.value = hz(m) * 2.001;
    f.type = "lowpass"; f.frequency.setValueAtTime(4200, t); f.frequency.exponentialRampToValueAtTime(600, t + 0.5);
    o.connect(f); o2.connect(f); f.connect(g);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(amp, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
    bus(g, 0.5, 0.45, 0.35, pan); o.start(t); o2.start(t); o.stop(t + 1); o2.stop(t + 1);
  }
  function bass(t, m, dur) {
    var o = ac.createOscillator(), s = ac.createOscillator(), g = ac.createGain(), f = ac.createBiquadFilter();
    o.type = "sawtooth"; s.type = "sine"; o.frequency.value = hz(m); s.frequency.value = hz(m - 12);
    f.type = "lowpass"; f.frequency.value = 260; f.Q.value = 2;
    o.connect(f); s.connect(g); f.connect(g);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.11, t + 0.03); g.gain.setTargetAtTime(0.05, t + 0.1, 0.3); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    bus(g, 0.9, 0.12, 0, 0); o.start(t); s.start(t); o.stop(t + dur + 0.05); s.stop(t + dur + 0.05);
  }
  function harmonics(t, root, dur) { // 第 3、5、7 次谐波
    [3, 5, 7].forEach(function (n, i) {
      var o = ac.createOscillator(), g = ac.createGain(); o.frequency.value = hz(root - 24) * n;
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.012 / (i + 1), t + dur * 0.4); g.gain.linearRampToValueAtTime(0.0001, t + dur);
      o.connect(g); bus(g, 0.2, 1, 0.2, [-0.7, 0.7, 0][i]); o.start(t); o.stop(t + dur + 0.1);
    });
  }
  var noiseBuf = null;
  function pulse(t, amp) { // 极轻的心跳低鼓
    var o = ac.createOscillator(), g = ac.createGain(); o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.18);
    g.gain.setValueAtTime(amp, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4); o.connect(g); bus(g, 0.9, 0.15, 0, 0); o.start(t); o.stop(t + 0.45);
  }
  function tick(t, amp, pan) { // 黄金比 Sturmian 词控制的细碎沙铃
    if (!noiseBuf) { noiseBuf = ac.createBuffer(1, ac.sampleRate * 0.1, ac.sampleRate); var d = noiseBuf.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    var s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(); s.buffer = noiseBuf; f.type = "highpass"; f.frequency.value = 7000;
    g.gain.setValueAtTime(amp, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05); s.connect(f); f.connect(g); bus(g, 0.6, 0.3, 0, pan); s.start(t); s.stop(t + 0.06);
  }
  function sturm(n) { return Math.floor((n + 2) / PHI) - Math.floor((n + 1) / PHI) === 1; }

  /* ---------- 编排 ---------- */
  var ENTER = { pad: 0, harm: 1, bell: 2, bass: 3, pluck: 5, pulse: 8, tick: 13 };
  function act(layer, bar) { var b = bar % 34; if (b < ENTER[layer]) return false; if ((layer === "pulse" || layer === "bass" || layer === "tick") && b >= 26 && b < 30) return false; return true; }
  function voice(notes) { // 每个声部就近移动,保持在 47–71
    return notes.map(function (pc) { var best = null; voicing.forEach(function () {}); for (var m = 47; m <= 71; m++) if (((m - pc) % 12 + 12) % 12 === 0) { var d = Math.min.apply(null, voicing.map(function (v) { return Math.abs(v - m); })); if (!best || d < best.d) best = { m: m, d: d }; } return best.m; }).sort(function (a, b) { return a - b; });
  }
  function schedule(s, t) {
    var i = s % 16, bar = Math.floor(s / 16), ab = (s / 16) * SD * 16;
    if (i === 0 && bar % 2 === 0) {
      if (bar > 0) { var d = +PI_D[piI++ % PI_D.length]; chord = norm(plr(chord, d % 3)); }
      voicing = voice(triad(chord));
      if (act("pad", bar)) pad(t, voicing, SD * 32 + 1.5);
      if (act("harm", bar)) harmonics(t + SD * 4, voicing[0], SD * 28);
      subs.forEach(function (f) { try { f(); } catch (e) {} });
    }
    var tri = triad(chord), root = 36 + chord.r;
    if (act("bass", bar) && i % 2 === 0 && euclid(3, 8, i / 2)) bass(t, root + (i === 0 ? 0 : 12 * (bar % 2) * 0 + (i === 6 ? 7 : 0)), SD * 5);
    if (act("bell", bar) && euclid(5, 16, i)) {
      var deg = FIB7[(s >> 0) % 16], scale = chord.maj ? [0, 2, 4, 5, 7, 9, 11] : [0, 2, 3, 5, 7, 8, 10];
      bell(t, 72 + chord.r + scale[deg] - (chord.r > 5 ? 12 : 0), 0.05, drift(ab, 8 * PHI));
    }
    if (act("pluck", bar) && i % 2 === 1 && thueMorse(s >> 1)) {
      var e = +E_D[(s >> 1) % E_D.length], m = 60 + chord.r - (chord.r > 5 ? 12 : 0) + PENTA[e % 5] + (e > 6 ? 12 : 0);
      pluck(t, m, 0.04, drift(ab, 8));
    }
    if (act("pulse", bar) && (i === 0 || i === 10)) pulse(t, i ? 0.10 : 0.16);
    if (act("tick", bar) && sturm(s)) tick(t, 0.02 + (i % 4 === 0 ? 0.015 : 0), drift(ab, 5 * PHI));
  }
  function loop() { while (nextT < ac.currentTime + LOOK) { schedule(step, nextT); step++; nextT += SD; } }

  function start() {
    if (!AC) return Promise.reject(new Error("no audio"));
    if (!ac) build();
    var p = ac.state === "suspended" ? ac.resume() : Promise.resolve();
    return p.then(function () {
      if (ac.state !== "running") throw new Error("blocked");
      if (on) return;
      on = true; nextT = ac.currentTime + 0.15; clearInterval(timer); timer = setInterval(loop, 40); loop();
      out.gain.cancelScheduledValues(ac.currentTime); out.gain.setValueAtTime(out.gain.value, ac.currentTime); out.gain.linearRampToValueAtTime(vol, ac.currentTime + 4);
      emit();
    });
  }
  function stop() {
    if (!on) return; on = false; clearInterval(timer);
    if (ac) { out.gain.cancelScheduledValues(ac.currentTime); out.gain.setTargetAtTime(0, ac.currentTime, 0.4); padVoices.forEach(function (v) { try { v.o.forEach(function (o) { o.stop(ac.currentTime + 3); }); } catch (e) {} }); padVoices = []; }
    emit();
  }
  function emit() { subs.forEach(function (f) { try { f(); } catch (e) {} }); }
  document.addEventListener("visibilitychange", function () {
    if (!ac) return;
    if (document.hidden) { clearInterval(timer); ac.suspend(); }
    else if (on) { ac.resume().then(function () { nextT = ac.currentTime + 0.1; clearInterval(timer); timer = setInterval(loop, 40); }); }
  });
  return {
    start: start, stop: stop, on: function () { return on; }, sub: function (f) { subs.push(f); },
    name: function () { return "星图序曲"; },
    chordName: function () { return NAMES[chord.r] + (chord.maj ? "" : "m"); }
  };
}
