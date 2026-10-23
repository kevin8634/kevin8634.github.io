// 生命源码 · 源码卡收集 + 关卡螺旋地图 + 过场 + 通关粒子(v0.6)
import { store, TASKS, sound, reducedMotion } from './ls.js';

export const TASK_ICON = { parents: '👨‍👩‍👧', dna: '🧬', zebra: '🦓', virus: '🦠', wolf: '🐺' };
const TOTAL = () => Object.values(TASKS).reduce((a, t) => a + t.levels, 0);
export const cards = () => store.get('cards', {});
export const cardCount = () => Object.values(cards()).reduce((a, t) => a + Object.keys(t).length, 0);
export function saveCard(task, i, title, msg) {
  const c = cards(); (c[task] ||= {})[i] = { t: title, m: msg }; store.set('cards', c);
  return Object.keys(c[task]).length >= TASKS[task].levels; // 集齐 → 点亮星座
}

/* 头部「源码卡」按钮 + 卡册 */
export function mountAlbum(top) {
  const b = document.createElement('button'); b.className = 'ls-btn ls-albtn'; b.setAttribute('aria-label', '源码卡册');
  const paint = () => { b.innerHTML = `🃏 <span class="al-t">源码卡 </span>${cardCount()}/${TOTAL()}`; b.title = '源码卡册:每通过一关收一张'; };
  paint(); addEventListener('ls-cards', paint);
  b.onclick = openAlbum;
  const snd = top.querySelector('#ls-snd'); top.insertBefore(b, snd);
  return b;
}
export function openAlbum() {
  const c = cards(), m = document.createElement('div'); m.className = 'ls-modal';
  let html = `<div class="ls-panel ls-album"><h3>源码卡册 · ${cardCount()}/${TOTAL()}</h3><p class="ls-note">每通过一关得一张;集齐一个任务,图谱上它的星座会点亮。</p>`;
  for (const [id, t] of Object.entries(TASKS)) {
    const got = c[id] || {}, full = Object.keys(got).length >= t.levels;
    html += `<div class="al-row${full ? ' full' : ''}"><a href="${t.path}">${TASK_ICON[id] || '✦'} ${esc(t.title)}</a><div class="al-cards">`;
    for (let i = 0; i < t.levels; i++) html += got[i] ? `<button class="al-c on" data-t="${id}" data-i="${i}" title="${esc(got[i].t)}">${i + 1}</button>` : `<span class="al-c">?</span>`;
    html += `</div></div>`;
  }
  html += `<div class="al-view"></div><div class="ls-actions"><button class="ls-btn primary" data-x>关闭</button></div></div>`;
  m.innerHTML = html;
  m.onclick = e => {
    if (e.target === m || e.target.dataset.x !== undefined) return m.remove();
    const k = e.target.closest('.al-c.on'); if (!k) return;
    const d = c[k.dataset.t][k.dataset.i]; m.querySelector('.al-view').innerHTML = `<div class="al-big"><b>${esc(d.t)}</b><p>${esc(d.m)}</p></div>`; sound.sparkle(3);
  };
  document.body.append(m);
}
const esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));

/* 翻转卡片(通关弹窗里用) */
export function flipCard(task, i, title, msg, full) {
  const w = document.createElement('div'); w.className = 'ls-flip';
  w.innerHTML = `<div class="fc-in"><div class="fc fc-f"><span class="ic">${TASK_ICON[task] || '✦'}</span><b>源码卡 #${i + 1}</b><small>点我翻开</small></div>
    <div class="fc fc-b"><b></b><p></p>${full ? '<em>✦ 集齐!星座已点亮</em>' : ''}</div></div>`;
  w.querySelector('.fc-b b').textContent = title; w.querySelector('.fc-b p').textContent = msg;
  const flip = () => { if (!w.classList.contains('on')) { w.classList.add('on'); sound.sparkle(full ? 6 : 4); if (full) sound.chord(); } };
  w.onclick = flip; setTimeout(flip, reducedMotion() ? 0 : 700);
  return w;
}

/* 关卡螺旋地图:双链 + 每关一级碱基对台阶 */
export function helixMap(nav, levels, cur, saved, go) {
  nav.innerHTML = ''; nav.classList.add('ls-map');
  const n = levels.length, step = 46, W = n * step + 20, H = 64, mid = H / 2, A = 18;
  const y1 = x => mid + Math.sin((x - 10) / step * Math.PI) * A, y2 = x => mid - Math.sin((x - 10) / step * Math.PI) * A;
  let p1 = '', p2 = '';
  for (let x = 0; x <= W; x += 3) { p1 += (x ? 'L' : 'M') + x + ' ' + y1(x).toFixed(1); p2 += (x ? 'L' : 'M') + x + ' ' + y2(x).toFixed(1); }
  let rungs = '';
  levels.forEach((_, i) => { const x = 10 + step * (i + .5); const on = saved[i] ? 'done' : i === cur ? 'cur' : ''; rungs += `<line class="${on}" x1="${x}" x2="${x}" y1="${y1(x)}" y2="${y2(x)}"/>`; });
  const box = document.createElement('div'); box.className = 'map-in'; box.style.width = W + 'px';
  box.innerHTML = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><path class="s1" d="${p1}"/><path class="s2" d="${p2}"/>${rungs}</svg>`;
  levels.forEach((L, i) => {
    const b = document.createElement('button'); b.textContent = i + 1; b.title = L.title;
    b.className = (i === cur ? 'cur ' : '') + (saved[i] ? 'done' : '');
    b.disabled = i > 0 && !saved[i - 1] && !saved[i] && i !== cur;
    b.title = b.disabled ? `第 ${i + 1} 关 · ${L.title}(先通过第 ${i} 关)` : `第 ${i + 1} 关 · ${L.title}`; b.setAttribute('aria-label', b.title);
    b.style.left = (10 + step * (i + .5)) + 'px';
    b.onclick = () => go(i); box.append(b);
  });
  nav.append(box);
}

/* 关间过场 */
export function transition(i, title) {
  if (reducedMotion()) return Promise.resolve();
  const t = document.createElement('div'); t.className = 'ls-trans';
  t.innerHTML = `<div><small>第 ${i + 1} 关</small><b></b></div>`; t.querySelector('b').textContent = title;
  document.body.append(t); sound.whoosh?.(.9, true);
  return new Promise(r => { setTimeout(r, 650); setTimeout(() => t.classList.add('out'), 900); setTimeout(() => t.remove(), 1350); });
}

/* 通关粒子 */
export function burst(colors = ['#34d399', '#e2be78', '#7dd3fc', '#f9a8d4']) {
  if (reducedMotion()) return;
  const c = document.createElement('canvas'), D = devicePixelRatio || 1; c.className = 'ls-burst';
  c.width = innerWidth * D; c.height = innerHeight * D; document.body.append(c);
  const g = c.getContext('2d'), cx = c.width / 2, cy = c.height * .42;
  const ps = Array.from({ length: 90 }, () => { const a = Math.random() * 7, v = (3 + Math.random() * 9) * D; return { x: cx, y: cy, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 3 * D, r: (1.5 + Math.random() * 3) * D, c: colors[Math.random() * colors.length | 0] }; });
  const t0 = performance.now();
  (function f(now) {
    const k = (now - t0) / 1100; g.clearRect(0, 0, c.width, c.height);
    if (k >= 1) return c.remove();
    for (const p of ps) { p.x += p.vx; p.y += p.vy; p.vy += .25 * D; p.vx *= .98; g.globalAlpha = 1 - k; g.fillStyle = p.c; g.shadowColor = p.c; g.shadowBlur = 8 * D; g.beginPath(); g.arc(p.x, p.y, p.r, 0, 7); g.fill(); }
    requestAnimationFrame(f);
  })(t0);
}
