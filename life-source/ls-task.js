// 生命源码 · 任务外壳:关卡导航、向导、星级、通关弹窗
import { chrome, guide, saveLevel, store, sound, TASKS, starsFor } from './ls.js';

export function runTask(taskId, levels) {
  const meta = TASKS[taskId];
  document.body.classList.add('ls-task');
  document.body.innerHTML = '';
  const ui = chrome({ title: meta.title, task: taskId });
  const nav = document.createElement('nav'); nav.className = 'ls-levels';
  const stage = document.createElement('main'); stage.className = 'ls-stage';
  const dock = document.createElement('section'); dock.className = 'ls-dock';
  const actions = document.createElement('div'); actions.className = 'ls-actions';
  const foot = document.querySelector('.ls-foot');
  document.body.insertBefore(nav, foot); document.body.insertBefore(stage, foot); document.body.insertBefore(dock, foot);
  const g = guide(meta.guide); dock.append(document.querySelector('.ls-guide'), actions);

  let cur = 0, cleanup = null;
  const saved = () => store.get(taskId, { levels: {} }).levels;
  const paintNav = () => {
    const s = saved(); nav.innerHTML = '';
    levels.forEach((L, i) => {
      const b = document.createElement('button'); b.textContent = i + 1; b.title = L.title;
      b.className = (i === cur ? 'cur ' : '') + (s[i] ? 'done' : '');
      b.disabled = i > 0 && !s[i - 1] && !s[i] && i !== cur;
      b.onclick = () => go(i); nav.append(b);
    });
    const total = Object.values(s).reduce((a, b) => a + b, 0); ui.setStars(total, levels.length * 3);
  };
  function go(i) {
    if (cleanup) { try { cleanup(); } catch {} cleanup = null; }
    cur = i; stage.innerHTML = ''; actions.innerHTML = '';
    const h = document.createElement('h2'); h.textContent = `${i + 1} · ${levels[i].title}`; stage.append(h);
    paintNav();
    let predicted = false;
    const api = {
      stage, guide: g, sound,
      center() { const c = document.createElement('div'); c.className = 'ls-center'; stage.append(c); return c; },
      button(label, fn, cls = '') { const b = document.createElement('button'); b.className = 'ls-btn ' + cls; b.textContent = label; b.onclick = fn; actions.append(b); return b; },
      clearActions() { actions.innerHTML = ''; },
      predicted(v = true) { predicted = v; },
      win(msg) {
        const stars = starsFor({ predicted, hintsUsed: g.hintsUsed });
        saveLevel(taskId, i, stars); paintNav(); sound.ok();
        const m = document.createElement('div'); m.className = 'ls-modal';
        const last = i === levels.length - 1;
        m.innerHTML = `<div class="ls-panel"><div class="stars">${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}</div><p class="msg"></p>
          <p class="ls-note">★ 通关 · ★ 先预测再验证 · ★ 没用到第 3 级提示</p>
          <div class="ls-actions"><button class="ls-btn" data-a="again">再玩一次</button><button class="ls-btn primary" data-a="next">${last ? '回到图谱' : '下一关'}</button></div></div>`;
        m.querySelector('.msg').textContent = msg;
        m.onclick = e => {
          const a = e.target.dataset.a; if (!a) return; m.remove();
          if (a === 'again') go(i); else if (last) location.href = '/life-source/'; else go(i + 1);
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
