// 生命源码 · 任务外壳:关卡导航、向导、星级、通关弹窗
import { chrome, guide, saveLevel, store, sound, TASKS, GUIDES, starsFor } from './ls.js';
import { mountAlbum, saveCard, flipCard, helixMap, transition, burst } from './ls-cards.js';

export function runTask(taskId, levels) {
  const meta = TASKS[taskId];
  document.body.classList.add('ls-task', 'lab');
  document.body.innerHTML = '';
  const ui = chrome({ title: meta.title, task: taskId });
  mountAlbum(ui.top);
  // v0.9 全息实验台骨架:顶部关卡螺旋 / 中央标本台 / 右侧向导 / 底部工具槽 / 左侧观察记录抽屉
  const lab = document.createElement('div'); lab.className = 'ls-lab';
  const nav = document.createElement('nav'); nav.className = 'ls-levels'; nav.setAttribute('aria-label', '关卡');
  const stage = document.createElement('main'); stage.className = 'ls-stage';
  const dock = document.createElement('section'); dock.className = 'ls-dock';
  const actions = document.createElement('div'); actions.className = 'ls-actions'; actions.setAttribute('aria-label', '工具槽');
  const phase = document.createElement('ol'); phase.className = 'lab-phase'; phase.setAttribute('aria-label', '本关进度');
  phase.innerHTML = '<li data-p="0">猜</li><li data-p="1">跑</li><li data-p="2">收</li>';
  const logTab = document.createElement('button'); logTab.className = 'lab-logtab'; logTab.setAttribute('aria-expanded', 'false');
  logTab.innerHTML = '<span>观察记录</span>';
  const log = document.createElement('aside'); log.className = 'lab-log ls-panel'; log.setAttribute('aria-label', '观察记录');
  log.innerHTML = '<h4>观察记录</h4><div class="lg"></div>';
  const foot = document.querySelector('.ls-foot');
  lab.append(nav, phase, stage, dock, actions, logTab, log);
  document.body.insertBefore(lab, foot);
  const g0 = guide(meta.guide); dock.append(document.querySelector('.ls-guide'));
  import('./ls-lab.js').then(m => m.mountBench(lab, GUIDES[meta.guide]?.color)).catch(() => {});

  // 观察记录:本次游玩的提问、发现与收获(只在本机内存,不另存)
  const lg = log.querySelector('.lg');
  const note = (kind, text) => {
    if (!text) return; const last = lg.lastElementChild;
    if (last && last.dataset.t === text) return;
    const d = document.createElement('div'); d.className = 'lg-' + kind; d.dataset.t = text;
    d.innerHTML = `<i>${{ q: '问', s: '看', w: '收', h: '关' }[kind]}</i><span></span>`; d.querySelector('span').textContent = text;
    lg.append(d); lg.scrollTop = lg.scrollHeight;
    if (kind === 'w' && !log.classList.contains('on')) logTab.classList.add('new');
  };
  const setLog = v => { log.classList.toggle('on', v); logTab.setAttribute('aria-expanded', v); logTab.classList.remove('new'); };
  logTab.onclick = () => setLog(!log.classList.contains('on'));
  addEventListener('keydown', e => { if (e.key === 'Escape') setLog(false); });
  const g = Object.create(g0);
  g.ask = (t, h) => { note('q', t); g0.ask(t, h); };
  g.say = t => { note('s', t); g0.say(t); };
  Object.defineProperty(g, 'hintsUsed', { get: () => g0.hintsUsed });
  let ph = 0;
  const setPhase = p => { ph = p; phase.querySelectorAll('li').forEach((li, k) => { li.classList.toggle('on', k === p); li.classList.toggle('done', k < p); }); stage.dataset.phase = p; };
  // 学习者第一次动手(点选项、拖工具、按按钮)= 进入「跑」
  const toRun = e => { if (ph === 0 && !e.target.closest('.ls-guide,.lab-log,.lab-logtab,.ls-levels')) setPhase(1); };
  lab.addEventListener('pointerdown', toRun, true);

  let cur = 0, cleanup = null;
  const saved = () => store.get(taskId, { levels: {} }).levels;
  const paintNav = () => {
    const s = saved(); helixMap(nav, levels, cur, s, i => go(i, true));
    const total = Object.values(s).reduce((a, b) => a + b, 0); ui.setStars(total, levels.length * 3);
  };
  async function go(i, anim = false) {
    if (anim) await transition(i, levels[i].title);
    if (cleanup) { try { cleanup(); } catch {} cleanup = null; }
    cur = i; stage.innerHTML = ''; actions.innerHTML = '';
    const h = document.createElement('h2'); h.textContent = `${i + 1} · ${levels[i].title}`; stage.append(h);
    note('h', `第 ${i + 1} 关 · ${levels[i].title}`);
    paintNav(); setPhase(0);
    let predicted = false;
    const api = {
      stage, guide: g, sound, lab,
      center() { const c = document.createElement('div'); c.className = 'ls-center'; stage.append(c); return c; },
      button(label, fn, cls = '') { const b = document.createElement('button'); b.className = 'ls-btn ' + cls; b.textContent = label; b.onclick = fn; actions.append(b); return b; },
      clearActions() { actions.innerHTML = ''; },
      predicted(v = true) { predicted = v; if (ph === 0) setPhase(1); },
      phase: setPhase,
      note: t => note('s', t),
      win(msg) {
        const stars = starsFor({ predicted, hintsUsed: g.hintsUsed });
        saveLevel(taskId, i, stars); paintNav(); sound.ok(); burst(); setPhase(2); note('w', msg);
        const full = saveCard(taskId, i, levels[i].title, msg); dispatchEvent(new Event('ls-cards'));
        const m = document.createElement('div'); m.className = 'ls-modal';
        const last = i === levels.length - 1;
        m.innerHTML = `<div class="ls-panel"><div class="fc-slot"></div><div class="stars">${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}</div>
          <p class="ls-note">★ 通关 · ★ 先预测再验证 · ★ 没用到第 3 级提示 · 收获已记进左侧「观察记录」</p>
          <div class="ls-actions"><button class="ls-btn" data-a="again">再玩一次</button><button class="ls-btn primary" data-a="next">${last ? '回到图谱' : '下一关'}</button></div></div>`;
        m.querySelector('.fc-slot').append(flipCard(taskId, i, levels[i].title, msg, full));
        m.onclick = e => {
          const a = e.target.dataset.a; if (!a) return; m.remove();
          if (a === 'again') go(i, true); else if (last) location.href = '/life-source/'; else go(i + 1, true);
        };
        document.body.append(m);
      },
      onCleanup(fn) { cleanup = fn; },
    };
    levels[i].run(api);
  }
  // 从第一个未通关的关卡开始
  const s = saved(); let start = levels.findIndex((_, i) => !s[i]); if (start < 0) start = 0;
  const q = new URLSearchParams(location.search).get('l'); if (q && levels[+q - 1]) start = +q - 1;
  go(start);
}

// 小工具
export const sleep = ms => new Promise(r => setTimeout(r, ms));
export function el(tag, attrs = {}, html = '') { const e = document.createElement(tag); Object.assign(e, attrs); if (html) e.innerHTML = html; return e; }
export function dots(container, items, cols = 20) { // items: 颜色数组
  const d = el('div', { className: 'ls-dots' }); d.style.gridTemplateColumns = `repeat(${cols},12px)`;
  items.forEach(c => { const i = document.createElement('i'); i.style.background = c; d.append(i); });
  container.append(d); return d;
}

// 预测选择题:第一次作答计入"先预测"星
export function choice(api, opts, correct, onDone, record = true) {
  const box = el('div', { className: 'ls-choice' }); let first = true;
  opts.forEach(o => { const b = el('button', { className: 'ls-btn', textContent: o }); b.onclick = () => {
    const ok = correct == null || o === correct; if (first && record) api.predicted(ok); first = false;
    ok ? api.sound.ok() : api.sound.no(); onDone(ok, o, box);
  }; box.append(b); });
  return box;
}
// 折线图:series [{name,color,data:[]}]
export function lineChart(canvas, series, { max } = {}) {
  const D = devicePixelRatio, W = canvas.width = canvas.clientWidth * D, H = canvas.height = canvas.clientHeight * D, g = canvas.getContext('2d');
  g.clearRect(0, 0, W, H);
  const n = Math.max(...series.map(s => s.data.length)), m = max || Math.max(1, ...series.flatMap(s => s.data));
  series.forEach((s, k) => {
    g.strokeStyle = s.color; g.lineWidth = 2 * D; g.beginPath();
    s.data.forEach((v, i) => { const x = 8 * D + i / Math.max(1, n - 1) * (W - 16 * D), y = H - 18 * D - v / m * (H - 30 * D); i ? g.lineTo(x, y) : g.moveTo(x, y); });
    g.stroke(); g.fillStyle = s.color; g.font = `${11 * D}px sans-serif`; g.fillText(s.name, 10 * D + k * 70 * D, 12 * D);
  });
}
