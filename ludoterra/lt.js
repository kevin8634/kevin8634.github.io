/* 觉弈 Ludoterra · 共用模块:本机存储、年龄段、HUD、顶栏、声音(默认关)、离线
 * 存储键统一 gn:lt:*;不收集任何个人信息,不发外部请求。 */
import { AGES, STATS, TASKS, TRACKS, DOMAINS, ageLabel } from './lt-data.js';
import { applyAge } from './lt-age.js';

export const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const K = k => 'gn:lt:' + k;
export const store = {
  get(k, d = null) { try { const v = localStorage.getItem(K(k)); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(K(k), JSON.stringify(v)); } catch (e) {} }
};
export const getAge = () => store.get('age', null);
export const setAge = id => store.set('age', id);
export const isDone = id => !!(store.get(id, null) || {}).done;
export const markDone = (id, extra = {}) => store.set(id, Object.assign({}, store.get(id, {}) || {}, extra, { done: true, t: Date.now() }));
/* 任务内容按年龄段:未选择时按星火 12+ */
export const userMinAge = () => { const a = AGES.find(x => x.id === getAge()); return a ? a.min : 12; };
export const ageOk = minAge => (minAge || 0) <= userMinAge();

/* 人生时间线:只存本机,最多 60 条 */
export function logChoice(task, choice, alt) {
  const tl = store.get('timeline', []) || []; tl.push({ t: Date.now(), task, choice, alt }); store.set('timeline', tl.slice(-60));
}

/* ---------- 声音:纯程序合成,默认关 ---------- */
let ac = null;
export const sound = {
  on() { return store.get('sound', false) === true; },
  set(v) { store.set('sound', !!v); if (v) this.ctx(); },
  ctx() { if (!ac) { const C = window.AudioContext || window.webkitAudioContext; if (C) ac = new C(); } if (ac && ac.state === 'suspended') ac.resume(); return ac; },
  /* 玻璃钟音:D 五声音阶 */
  bell(step = 0, gain = 0.12, dur = 1.6) {
    if (!this.on()) return; const c = this.ctx(); if (!c) return;
    const scale = [0, 2, 4, 7, 9]; const n = scale[((step % 5) + 5) % 5] + 12 * Math.floor(step / 5);
    const f = 293.66 * Math.pow(2, n / 12); const t = c.currentTime;
    [1, 2.01, 3.98].forEach((m, i) => {
      const o = c.createOscillator(), g = c.createGain(); o.type = 'sine'; o.frequency.value = f * m;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain / (i + 1), t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur / (i + 1));
      o.connect(g).connect(c.destination); o.start(t); o.stop(t + dur);
    });
  },
  /* 不协和:两音相差小二度 */
  clash(gain = 0.08) {
    if (!this.on()) return; const c = this.ctx(); if (!c) return; const t = c.currentTime;
    [233.08, 246.94].forEach(f => { const o = c.createOscillator(), g = c.createGain(); o.type = 'triangle'; o.frequency.value = f;
      g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7); o.connect(g).connect(c.destination); o.start(t); o.stop(t + 0.8); });
  },
  tick() { if (!this.on()) return; const c = this.ctx(); if (!c) return; const t = c.currentTime; const o = c.createOscillator(), g = c.createGain();
    o.frequency.value = 1800; g.gain.setValueAtTime(0.03, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05); o.connect(g).connect(c.destination); o.start(t); o.stop(t + 0.06); }
};

/* ---------- 顶栏 ---------- */
export function chrome({ home = './', extra = '' } = {}) {
  try { const seg = location.pathname.split('/').filter(Boolean).pop(); applyAge(seg, getAge()); } catch (_) {}
  const top = document.createElement('header'); top.className = 'lt-top';
  top.innerHTML = `<a class="brand" href="${home}" aria-label="觉弈 Ludoterra 首页"><b>觉弈</b><span>LUDOTERRA · 06 · 认知觉醒</span></a>
    <span class="sp"></span>${extra}
    <button class="lt-btn lt-age-chip" id="ltAgeChip" type="button" title="更换年龄段"></button>
    <button class="lt-btn" id="ltSound" type="button" aria-pressed="false" aria-label="声音开关(默认关)">🔈</button>
    <a class="lt-btn lt-home" href="/" title="回到创世计划总门户(同窗口)">← 创世<span class="lt-wide">计划</span></a>`;
  document.body.prepend(top);
  const sb = top.querySelector('#ltSound'); const chip0 = top.querySelector('#ltAgeChip');
  const paint = () => { const on = sound.on(); sb.setAttribute('aria-pressed', on); sb.textContent = on ? '🔊' : '🔈'; };
  sb.onclick = () => { sound.set(!sound.on()); paint(); sound.bell(2); }; paint();
  /* v0.13 关卡配乐:每关顶栏「♪ 本关」播放本关曲子(循环,音量压低 40%);偏好记在本机,下一关自动接上 */
  const seg = (location.pathname.match(/\/ludoterra\/([a-z]+)\//) || [])[1]; const tr = seg && TRACKS.find(x => x.task === seg);
  if (tr && home !== './') {
    const mb = document.createElement('button'); mb.className = 'lt-btn lt-lvm'; mb.type = 'button'; mb.title = `本关配乐:${tr.no} ${tr.name}`;
    mb.setAttribute('aria-label', `本关配乐「${tr.name}」开关`); top.insertBefore(mb, chip0);
    const au = new Audio(home + tr.file); au.loop = true; au.preload = 'none'; au.volume = ((store.get('m_vol', 70) ?? 70) / 100) * 0.6;
    const pm = () => { const on = !au.paused; mb.setAttribute('aria-pressed', on); mb.textContent = on ? `♪ ${tr.name}` : '♪ 本关'; };
    const play = () => au.play().then(pm).catch(() => { pm(); const once = () => { au.play().then(pm).catch(() => {}); removeEventListener('pointerdown', once); }; addEventListener('pointerdown', once); });
    mb.onclick = () => { if (au.paused) { store.set('m_lvl', true); play(); } else { store.set('m_lvl', false); au.pause(); pm(); } };
    au.addEventListener('pause', pm); pm(); if (store.get('m_lvl', false) === true) play();
    window.ltLevelMusic = au;
  }
  const chip = top.querySelector('#ltAgeChip');
  const paintAge = () => { const a = getAge(); chip.textContent = a ? ageLabel(a) : '选择年龄段'; };
  paintAge(); chip.addEventListener('lt-age', paintAge);
  /* v0.30 R1 任务背景舞台:关卡页自动挂上本关 3D 背景(首页不挂) */
  if (seg && home !== './') import('./lt-stage.js').then(m => m.initStage(seg)).catch(() => {});
  return { top, chip, paintAge };
}

/* ---------- HUD 2.0(v0.23):八域小星环 + 可展开的隐藏数值 ---------- */
export function hud(parent = document.body) {
  const el = document.createElement('aside'); el.className = 'lt-hud lt-panel ring'; el.setAttribute('aria-label', '八域星环与隐藏数值');
  let open = false;
  const domLit = d => TASKS.some(t => t.live && isDone(t.id) && t.domains.includes(d.id));
  const arc = (i, n, r, gap) => { const a0 = -Math.PI / 2 + i * 2 * Math.PI / n + gap, a1 = a0 + 2 * Math.PI / n - 2 * gap;
    const p = a => [(24 + r * Math.cos(a)).toFixed(2), (24 + r * Math.sin(a)).toFixed(2)]; const [x0, y0] = p(a0), [x1, y1] = p(a1);
    return `M${x0} ${y0}A${r} ${r} 0 0 1 ${x1} ${y1}`; };
  const render = (hold = [], flip = []) => {
    const litN = DOMAINS.filter(domLit).length;
    const svg = `<svg viewBox="0 0 48 48" width="48" height="48" aria-hidden="true"><circle cx="24" cy="24" r="21.5" fill="none" stroke="rgba(245,194,107,.18)" stroke-width=".6"/>${DOMAINS.map((d, i) => `<path d="${arc(i, DOMAINS.length, 18, 0.07)}" class="${domLit(d) ? 'on' : ''}"><title>${d.name}${domLit(d) ? ' · 已点亮' : ' · 迷雾中'}</title></path>`).join('')}<circle cx="24" cy="24" r="2" class="${isDone('meaning') ? 'core on' : 'core'}"/></svg>`;
    const rows = STATS.map(s => {
      const on = isDone(s.by) && !hold.includes(s.id); const v = on ? (store.get('stat_' + s.id, 60) || 60) : 0;
      return `<div class="row ${on ? '' : 'locked'}${on && flip.includes(s.id) ? ' flip' : ''}" data-id="${s.id}" title="${on ? s.name : '通关后显形'}"><span class="n">${on ? s.name : '???'}</span><span class="bar"><i style="width:${v}%"></i></span></div>`;
    }).join('');
    const n = STATS.filter(s => isDone(s.by) && !hold.includes(s.id)).length;
    el.classList.toggle('open', open); el.classList.toggle('pulse', flip.length > 0);
    el.innerHTML = `<button class="rt" type="button" aria-expanded="${open}">${svg}<span class="rl"><b>${litN}/${DOMAINS.length}</b><small>域已点亮</small></span></button>
      <div class="rd"><div class="doms">${DOMAINS.map(d => `<span class="${domLit(d) ? 'on' : ''}">${d.icon} ${d.short}</span>`).join('')}</div>
      <h4>隐藏数值 ${n}/${STATS.length}</h4>${rows}<div class="tip">地球Online 不显示这些数值。每看见一条规则,就显形一条。</div></div>`;
    el.querySelector('.rt').onclick = () => { open = !open; el.classList.toggle('open', open); el.querySelector('.rt').setAttribute('aria-expanded', open); };
  };
  render(); parent.appendChild(el); return { el, render };
}

/* ---------- 离线:SW 作用域仅 /ludoterra/ ---------- */
export function offline() {
  if ('serviceWorker' in navigator && location.pathname.startsWith('/ludoterra/')) {
    navigator.serviceWorker.register('/ludoterra/sw.js', { scope: '/ludoterra/' }).catch(() => {});
  }
}
export { TASKS };
