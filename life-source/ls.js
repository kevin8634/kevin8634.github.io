// 生命源码 Life Source · 公共层(ES module)
// 存储 gn:ls:<任务> / gn:ls:summary / gn:ls:sound;声音默认关;无外部请求、无埋点。
export const WORLD = 'ls';
export const TASKS = {
  parents: { title: '为什么你长得像爸妈,又不完全像?', path: '/life-source/parents/', guide: 'epi', levels: 7 },
  dna:     { title: '四个字母怎么写出一个人?',       path: '/life-source/dna/',     guide: 'cas', levels: 6 },
  zebra:   { title: '为什么斑马会有条纹?',           path: '/life-source/zebra/',   guide: 'adna', levels: 4 },
  virus:   { title: '一场感冒是怎么在班里传开的?',   path: '/life-source/virus/',   guide: 'phage', levels: 4 },
  wolf:    { title: '狼回来之后,河流为什么变了?',   path: '/life-source/wolf/',    guide: 'edna', levels: 4 },
};
export const GUIDES = {
  cas:   { name: '卡丝 Cas',    term: 'CRISPR 基因剪刀', color: '#34d399' },
  epi:   { name: '艾比 Epi',    term: '表观遗传',       color: '#5eead4' },
  adna:  { name: '阿古 aDNA',   term: '古 DNA',         color: '#e2be78' },
  phage: { name: '菲吉 Phage',  term: '噬菌体',         color: '#67e8f9' },
  edna:  { name: '伊蒂 eDNA',   term: '环境 DNA',       color: '#7dd3fc' },
};

/* ---------- 存储 ---------- */
const K = k => `gn:${WORLD}:${k}`;
export const store = {
  get(k, d = null) { try { const v = localStorage.getItem(K(k)); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(K(k), JSON.stringify(v)); } catch {} },
};
export function saveLevel(task, level, stars) {
  const s = store.get(task, { levels: {} });
  s.levels[level] = Math.max(s.levels[level] || 0, stars);
  s.updated = Date.now();
  store.set(task, s);
  const sum = store.get('summary', { tasks: {} });
  const total = Object.values(s.levels).reduce((a, b) => a + b, 0);
  sum.tasks[task] = { stars: total, done: Object.keys(s.levels).length >= (TASKS[task]?.levels || 99) };
  store.set('summary', sum);
}
export const taskStars = task => Object.values(store.get(task, { levels: {} }).levels).reduce((a, b) => a + b, 0);

/* ---------- 动效偏好 ---------- */
export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- 声景:Web Audio 程序合成,默认关 ---------- */
// 碱基音高(五声音阶内):A=A4 C=C5 G=G4 T=E4;A–T、G–C 均为纯四度
export const BASE_FREQ = { A: 440, C: 523.25, G: 392, T: 329.63, U: 329.63 };
let ac = null, master = null;
export const sound = {
  get on() { return store.get('sound', false) === true; },
  set on(v) { store.set('sound', !!v); if (v) { ensure(); music.start(); } else music.stop(); },
  musicLevel(l) { music.level = l; music.apply(); },
  tone(f, dur = .35, { type = 'sine', gain = .18, when = 0, detune = 0 } = {}) {
    if (!this.on) return; ensure();
    const t = ac.currentTime + when, o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.value = f; o.detune.value = detune;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + .015); g.gain.exponentialRampToValueAtTime(.0005, t + dur);
    o.connect(g).connect(master); o.start(t); o.stop(t + dur + .05);
  },
  base(b, opt) { const f = BASE_FREQ[b]; if (f) this.tone(f, .3, opt); },
  pair(a, b, opt = {}) { // 正确配对 = 纯四度;错配会落成二度/三度,听得出不稳
    this.base(a, opt); this.base(b, { ...opt, when: (opt.when || 0) + .04 });
    if (!isPair(a, b)) this.tone(BASE_FREQ[b] * 1.06, .3, { ...opt, type: 'triangle', gain: .08, when: (opt.when || 0) + .04 });
  },
  ok() { this.tone(523.25, .18); this.tone(659.25, .3, { when: .1 }); },
  no() { this.tone(220, .25, { type: 'triangle', gain: .12 }); },
  // 星星点亮:五声音阶上行琶音
  sparkle(n = 5, base = 0) { [587.33, 659.25, 739.99, 880, 987.77, 1174.66].slice(0, n).forEach((f, i) => this.tone(f * 2 ** base, .5, { when: i * .07, gain: .09 })); },
  // 过关和弦(D 大九和弦)
  chord() { [293.66, 369.99, 440, 554.37, 659.25].forEach((f, i) => this.tone(f, 1.6, { when: i * .05, gain: .07, type: i % 2 ? 'sine' : 'triangle' })); },
  // 镜头推进:滤波噪声扫频
  whoosh(dur = 1.2, up = true) {
    if (!this.on) return; ensure();
    const t = ac.currentTime, n = ac.createBufferSource(), b = ac.createBuffer(1, ac.sampleRate * dur, ac.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const f = ac.createBiquadFilter(), g = ac.createGain(); f.type = 'bandpass'; f.Q.value = 1.2;
    f.frequency.setValueAtTime(up ? 300 : 3000, t); f.frequency.exponentialRampToValueAtTime(up ? 3000 : 300, t + dur);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.16, t + dur * .6); g.gain.linearRampToValueAtTime(0, t + dur);
    n.buffer = b; n.connect(f).connect(g).connect(master); n.start(t);
  },
};
/* 背景音乐「生命源码」:原创程序合成(_dev/audio/synth.py),无缝循环;跟随声音开关,默认关 */
const music = {
  level: .3, buf: null, src: null, gain: null, loading: null,
  async start() {
    if (!sound.on) return; ensure();
    if (this.src) return this.apply();
    if (!this.buf) this.loading ||= fetch(new URL('./audio/bgm.m4a', import.meta.url)).then(r => r.arrayBuffer()).then(a => new Promise((ok, no) => ac.decodeAudioData(a, ok, no)));
    try { this.buf = await this.loading; } catch { return; }
    if (!sound.on || this.src) return;
    this.gain = ac.createGain(); this.gain.gain.value = 0; this.gain.connect(master);
    this.src = ac.createBufferSource(); this.src.buffer = this.buf; this.src.loop = true; this.src.connect(this.gain); this.src.start();
    this.apply(3);
  },
  apply(fade = 1.2) { if (!this.gain) return; const t = ac.currentTime, v = sound.on && !document.hidden ? this.level : 0; this.gain.gain.cancelScheduledValues(t); this.gain.gain.setValueAtTime(this.gain.gain.value, t); this.gain.gain.linearRampToValueAtTime(v, t + fade); },
  stop() { if (!this.src) return; const s = this.src; this.apply(.8); setTimeout(() => { try { s.stop(); } catch {} }, 900); this.src = null; },
};
document.addEventListener('visibilitychange', () => music.apply(.5));
// 浏览器不允许自动播放:声音已开时,在第一次点击后接上音乐
addEventListener('pointerdown', () => { if (sound.on) music.start(); }, { once: true, capture: true });
function ensure() {
  if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
  ac = new (window.AudioContext || window.webkitAudioContext)();
  master = ac.createGain(); master.gain.value = .8;
  const comp = ac.createDynamicsCompressor(); master.connect(comp).connect(ac.destination);
}

/* ---------- 碱基工具 ---------- */
export const COMP = { A: 'T', T: 'A', G: 'C', C: 'G' };
export const isPair = (a, b) => COMP[a] === b;
export const BASE_COLOR = { A: '#4ade80', T: '#f5b041', G: '#60a5fa', C: '#f87171', U: '#f5b041', N: '#475569' };

/* ---------- 标准遗传密码 ---------- */
const B4 = 'TCAG', AA = 'FFLLSSSSYY**CC*WLLLLPPPPHHQQRRRRIIIMTTTTNNKKSSRRVVVVAAAADDEEGGGG';
export const AA_ZH = { F: '苯丙氨酸', L: '亮氨酸', S: '丝氨酸', Y: '酪氨酸', C: '半胱氨酸', W: '色氨酸', P: '脯氨酸', H: '组氨酸', Q: '谷氨酰胺',
  R: '精氨酸', I: '异亮氨酸', M: '甲硫氨酸', T: '苏氨酸', N: '天冬酰胺', K: '赖氨酸', V: '缬氨酸', A: '丙氨酸', D: '天冬氨酸', E: '谷氨酸', G: '甘氨酸', '*': '终止' };
export function codonAA(c) { c = c.toUpperCase().replace(/U/g, 'T'); const i = B4.indexOf(c[0]) * 16 + B4.indexOf(c[1]) * 4 + B4.indexOf(c[2]); return AA[i] || '?'; }
export function translate(dna) { const out = []; for (let i = 0; i + 3 <= dna.length; i += 3) { const a = codonAA(dna.slice(i, i + 3)); out.push(a); if (a === '*') break; } return out; }

/* ---------- 页面骨架 ---------- */
export function chrome({ title = '', task = null } = {}) {
  if (task) music.level = .18;
  const top = document.createElement('header');
  top.className = 'ls-top';
  top.innerHTML = `<a class="brand" href="/life-source/">生命源码</a><div class="title"></div>
    ${task ? `<span class="ls-stars" id="ls-stars"></span>` : ''}
    <button class="ls-btn" id="ls-snd" aria-label="声音">🔇</button>`;
  top.querySelector('.title').textContent = title;
  document.body.prepend(top);
  const snd = top.querySelector('#ls-snd');
  const paint = () => { snd.textContent = sound.on ? '🔊' : '🔇'; snd.classList.toggle('on', sound.on); };
  snd.onclick = () => { sound.on = !sound.on; paint(); if (sound.on) sound.sparkle(3); };
  addEventListener('ls-sound', paint);
  paint();
  const foot = document.createElement('footer');
  foot.className = 'ls-foot';
  foot.textContent = '用于知识学习与科学研究科普 · 不替代医生意见 · 免费免注册,不收集个人信息';
  document.body.append(foot);
  return { top, foot, setStars(n, max) { const el = top.querySelector('#ls-stars'); if (el) el.textContent = `★ ${n}/${max}`; } };
}

/* ---------- 向导:只提问,三级提示 ---------- */
export function guide(id) {
  const g = GUIDES[id] || GUIDES.cas;
  const box = document.createElement('div');
  box.className = 'ls-guide';
  box.innerHTML = `<div class="ava" style="background:radial-gradient(circle at 35% 30%,#ecfdf5,${g.color} 60%,#064e3b)">${g.name.split(' ')[1]}</div>
    <div class="bubble"><div class="who"></div><div class="say"></div><div class="hints"></div></div>`;
  box.querySelector('.who').textContent = `${g.name} · ${g.term}`;
  document.body.append(box);
  let used = 0;
  return {
    get hintsUsed() { return used; },
    ask(text, hints = []) { // hints: [反问, 高亮线索, 演示一半]
      used = 0; box.querySelector('.say').textContent = text;
      const h = box.querySelector('.hints'); h.innerHTML = '';
      hints.forEach((hint, i) => {
        const b = document.createElement('button'); b.className = 'ls-btn'; b.textContent = ['提示 1', '提示 2', '提示 3'][i];
        b.disabled = i > 0;
        b.onclick = () => {
          used = Math.max(used, i + 1);
          if (typeof hint === 'function') hint(); else box.querySelector('.say').textContent = hint;
          const nx = h.children[i + 1]; if (nx) nx.disabled = false;
        };
        h.append(b);
      });
    },
    say(text) { box.querySelector('.say').textContent = text; box.querySelector('.hints').innerHTML = ''; },
    hide(v = true) { box.style.display = v ? 'none' : ''; },
  };
}

export function toast(msg, ms = 1800) {
  let t = document.querySelector('.ls-toast');
  if (!t) { t = document.createElement('div'); t.className = 'ls-toast'; document.body.append(t); }
  t.textContent = msg; t.classList.add('show');
  clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), ms);
}

// 三星:1 通关;2 先预测且误差在范围内;3 未用第三级提示
export const starsFor = ({ predicted = false, hintsUsed = 0 }) => 1 + (predicted ? 1 : 0) + (hintsUsed < 3 ? 1 : 0);

/* ---------- 离线缓存(作用域仅 /life-source/) ---------- */
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  addEventListener('load', () => {
    navigator.serviceWorker.register(new URL('./sw.js', import.meta.url), { scope: '/life-source/' }).catch(() => {});
  });
}
