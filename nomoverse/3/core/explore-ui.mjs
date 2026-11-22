/* 宙律 3.0 · 探索层界面组件(3-4,原生 JS/CSS 改写,不含第三方源码;思路署名见 ../../LICENSES.md)
 *   cometDial     React Bits「Comet Dial」思路:刻度环旋钮,按角度拖,亮头后拖彗尾          → Q、Λ
 *   sloshGauge    React Bits「Slosh Gauge」思路:液位追值、移动时倾斜、越线溅起            → Ω 读数(临界密度 1 线)
 *   rubberSegment React Bits「Rubber Segment」思路:分段切换,橡皮滑块拉伸后回弹          → 基础 / 进阶
 *   splitFlap     React Bits「Split Flap Text」思路:机场翻牌逐位翻到目标                 → 种子
 *   cardStack     React Bits「Stack」+「Flip Card」思路:可拖走的叠牌,点击翻面            → 题卡
 *   lockSwitch    Uiverse 开关(MIT)思路:带锁图标的拨动开关                              → 锁定常数
 * 统一接口与 /shared/3/ui.js 相同:mount(el, opts) → { el, update(opts), destroy() }。
 * 约定:尊重 prefers-reduced-motion 与 html.gn3-q-low(去掉动效);触控目标 ≥44px;可键盘操作;文本一律 textContent。 */
import { ticks, pointToT, tToAngle, flapFrame, flapFrames, gauge } from './explore.mjs';

const RM = () => (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches)
  || document.documentElement.classList.contains('gn3-q-low');
const h = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
const NS = 'http://www.w3.org/2000/svg';
const s = (tag, attrs = {}) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); return e; };
function listen(list, t, ev, f, o) { t.addEventListener(ev, f, o); list.push(() => t.removeEventListener(ev, f, o)); }
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const polar = (a, r) => { const q = (a - 90) * Math.PI / 180; return [60 + r * Math.cos(q), 60 + r * Math.sin(q)]; };
const arc = (a0, a1, r) => { const [x0, y0] = polar(a0, r), [x1, y1] = polar(a1, r), big = Math.abs(a1 - a0) > 180 ? 1 : 0, sw = a1 > a0 ? 1 : 0; return `M${x0.toFixed(2)} ${y0.toFixed(2)}A${r} ${r} 0 ${big} ${sw} ${x1.toFixed(2)} ${y1.toFixed(2)}`; };

/* 1 Comet Dial
 * opts: label value toT(v) fromT(t) format(v) snap(v) color marks[{t, cls, title}] n(刻度数) onInput onStart onEnd */
export const cometDial = {
  mount(el, o = {}) {
    let opt = { label: '', value: 0, toT: (v) => v, fromT: (t) => t, format: String, snap: (v) => v, color: 'var(--gn3-k-Q)', marks: [], n: 36, ...o };
    const off = [];
    el.classList.add('nv-dial'); el.style.setProperty('--dc', opt.color);
    const svg = s('svg', { viewBox: '0 0 120 120', class: 'nv-dial-svg' });
    const gT = s('g', { class: 'nv-dial-ticks' }), gM = s('g', { class: 'nv-dial-marks' });
    const tail = s('path', { class: 'nv-dial-tail', fill: 'none' }), head = s('circle', { class: 'nv-dial-head', r: 4.2 });
    svg.append(s('path', { class: 'nv-dial-groove', d: arc(-135, 135, 47), fill: 'none' }), gT, gM, tail, head);
    const mid = h('div', 'nv-dial-mid'), out = h('output', 'nv-dial-val'), name = h('span', 'nv-dial-lab');
    mid.append(out, name);
    const box = h('div', 'nv-dial-box'); box.append(svg, mid);
    box.tabIndex = 0; box.setAttribute('role', 'slider');
    el.replaceChildren(box);
    let val = opt.value, shown = opt.toT(val), raf = 0, trail = null;
    const tickEls = [];
    const build = () => {
      gT.replaceChildren(); tickEls.length = 0;
      for (const tk of ticks(0, opt.n)) {
        const [x0, y0] = polar(tk.a, 41), [x1, y1] = polar(tk.a, 51);
        const l = s('line', { x1: x0.toFixed(2), y1: y0.toFixed(2), x2: x1.toFixed(2), y2: y1.toFixed(2) }); gT.append(l); tickEls.push(l);
      }
      gM.replaceChildren(...opt.marks.map((m) => { const [x0, y0] = polar(tToAngle(m.t), 36), [x1, y1] = polar(tToAngle(m.t), 55); const l = s('line', { x1: x0, y1: y0, x2: x1, y2: y1, class: 'nv-dial-mark ' + (m.cls || '') }); if (m.title) l.append(Object.assign(s('title'), { textContent: m.title })); return l; }));
    };
    const paint = () => {
      const t = opt.toT(val), tk = ticks(t, opt.n);
      tk.forEach((x, i) => tickEls[i].setAttribute('class', x.head ? 'is-head' : x.lit ? 'is-lit' : ''));
      const [hx, hy] = polar(tToAngle(t), 47); head.setAttribute('cx', hx.toFixed(2)); head.setAttribute('cy', hy.toFixed(2));
      if (trail && Math.abs(trail.t - t) > 0.004) { tail.setAttribute('d', arc(tToAngle(trail.t), tToAngle(t), 47)); tail.style.opacity = trail.op.toFixed(3); }
      else tail.style.opacity = 0;
      const txt = opt.format(val); out.textContent = txt; name.textContent = opt.label;
      box.setAttribute('aria-label', opt.label); box.setAttribute('aria-valuetext', txt); box.setAttribute('aria-valuenow', String(val));
      box.setAttribute('aria-valuemin', String(opt.fromT(0))); box.setAttribute('aria-valuemax', String(opt.fromT(1)));
    };
    /* 彗尾:跟在亮头后面,约 450ms 收拢、淡出 */
    const comet = (from) => {
      if (RM()) { trail = null; paint(); return; }
      trail = { t: from, op: 0.9 }; cancelAnimationFrame(raf);
      const t0 = performance.now(), f0 = from;
      const step = (now) => { const k = clamp((now - t0) / 450, 0, 1), t = opt.toT(val); trail.t = f0 + (t - f0) * (1 - Math.pow(1 - k, 3)); trail.op = 0.9 * (1 - k); paint(); if (k < 1) raf = requestAnimationFrame(step); else { trail = null; paint(); } };
      raf = requestAnimationFrame(step);
    };
    const setV = (v, fire = true) => {
      v = opt.snap(v); if (v === val) return;
      const from = trail ? trail.t : opt.toT(val); val = v; comet(from); fire && opt.onInput && opt.onInput(val);
    };
    let drag = false;
    const fromPt = (e) => { const r = svg.getBoundingClientRect(); setV(opt.fromT(pointToT(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2)))); };
    listen(off, box, 'pointerdown', (e) => { drag = true; box.setPointerCapture(e.pointerId); el.classList.add('is-drag'); opt.onStart && opt.onStart(); fromPt(e); });
    listen(off, box, 'pointermove', (e) => { if (drag) fromPt(e); });
    const end = () => { if (!drag) return; drag = false; el.classList.remove('is-drag'); opt.onEnd && opt.onEnd(); };
    listen(off, box, 'pointerup', end); listen(off, box, 'pointercancel', end);
    listen(off, box, 'keydown', (e) => {
      const big = e.shiftKey ? 10 : 1, t = opt.toT(val);
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') setV(opt.fromT(t + big / 100));
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') setV(opt.fromT(t - big / 100));
      else if (e.key === 'Home') setV(opt.fromT(0)); else if (e.key === 'End') setV(opt.fromT(1));
      else return;
      e.preventDefault();
    });
    build(); paint();
    return { el, get value() { return val; },
      update(n = {}) { const rebuild = 'marks' in n || 'n' in n; opt = { ...opt, ...n }; el.style.setProperty('--dc', opt.color); if (rebuild) build();
        if ('value' in n && n.value !== val) { const from = opt.toT(val); val = n.value; comet(from); } else paint(); },
      destroy() { cancelAnimationFrame(raf); off.forEach((f) => f()); el.replaceChildren(); el.classList.remove('nv-dial'); } };
  }
};

/* 2 Slosh Gauge:液面追值(弹簧),移动时倾斜,越过上沿或临界线时溅起
 * opts: value label lineLabel format(v) */
export const sloshGauge = {
  mount(el, o = {}) {
    let opt = { value: 0, label: '', lineLabel: '1', format: (v) => String(v), ...o };
    el.classList.add('nv-slosh');
    const tank = h('div', 'nv-slosh-tank'), liq = h('div', 'nv-slosh-liq'), wave = h('div', 'nv-slosh-wave'), line = h('div', 'nv-slosh-line'), lt = h('span', 'nv-slosh-lt'), drop = h('i', 'nv-slosh-drop');
    liq.append(wave); line.append(lt); tank.append(liq, line, drop);
    const cap = h('div', 'nv-slosh-cap'), out = h('b'), lab = h('span');
    cap.append(lab, out);
    el.replaceChildren(tank, cap);
    tank.setAttribute('role', 'meter');
    let lvl = gauge(opt.value).level, vel = 0, raf = 0, prevSide = gauge(opt.value).side;
    const draw = (tilt) => {
      liq.style.height = (lvl * 100).toFixed(2) + '%';
      wave.style.transform = `skewY(${clamp(tilt, -14, 14).toFixed(2)}deg)`;
    };
    const paint = () => {
      const g = gauge(opt.value);
      line.style.bottom = (g.line * 100) + '%'; lt.textContent = opt.lineLabel;
      out.textContent = opt.format(opt.value) + (g.over ? '↑' : ''); lab.textContent = opt.label;
      el.dataset.side = g.side;
      tank.setAttribute('aria-label', opt.label); tank.setAttribute('aria-valuenow', String(opt.value)); tank.setAttribute('aria-valuetext', opt.format(opt.value));
      tank.setAttribute('aria-valuemin', '0'); tank.setAttribute('aria-valuemax', '2');
      if ((g.side !== prevSide && prevSide !== 'flat' && g.side !== 'flat') || (g.over && !el.classList.contains('is-over'))) splash();
      el.classList.toggle('is-over', g.over); prevSide = g.side;
      if (RM()) { lvl = g.level; draw(0); return; }
      cancelAnimationFrame(raf);
      const step = () => { const d = g.level - lvl; vel = vel * 0.82 + d * 0.16; lvl += vel; draw(-vel * 260); if (Math.abs(d) > 0.0008 || Math.abs(vel) > 0.0008) raf = requestAnimationFrame(step); else { lvl = g.level; vel = 0; draw(0); } };
      raf = requestAnimationFrame(step);
    };
    const splash = () => { if (RM()) return; el.classList.remove('is-splash'); void el.offsetWidth; el.classList.add('is-splash'); setTimeout(() => el.classList.remove('is-splash'), 600); };
    draw(0); paint();
    return { el, update(n = {}) { opt = { ...opt, ...n }; paint(); }, destroy() { cancelAnimationFrame(raf); el.replaceChildren(); el.classList.remove('nv-slosh'); } };
  }
};

/* 3 Rubber Segment:选中块先拉伸跨过间隙,再收拢到位
 * opts: items[{id,label}] value onChange(id) label(aria) */
export const rubberSegment = {
  mount(el, o = {}) {
    let opt = { items: [], value: null, label: '', ...o };
    const off = [];
    el.classList.add('nv-seg'); el.setAttribute('role', 'radiogroup');
    const thumb = h('span', 'nv-seg-thumb'); let btns = [];
    const build = () => {
      btns = opt.items.map((it) => { const b = h('button', 'nv-seg-b', it.label); b.type = 'button'; b.setAttribute('role', 'radio'); b.dataset.id = it.id; return b; });
      el.replaceChildren(thumb, ...btns);
      btns.forEach((b) => listen(off, b, 'click', () => pick(b.dataset.id, true)));
    };
    const place = (stretchFrom) => {
      const i = Math.max(0, opt.items.findIndex((x) => x.id === opt.value)), b = btns[i]; if (!b) return;
      btns.forEach((x, j) => { x.setAttribute('aria-checked', String(j === i)); x.tabIndex = j === i ? 0 : -1; x.classList.toggle('is-on', j === i); });
      const L = b.offsetLeft, W = b.offsetWidth;
      if (stretchFrom != null && !RM()) {
        const a = btns[stretchFrom]; const l0 = Math.min(a.offsetLeft, L), r0 = Math.max(a.offsetLeft + a.offsetWidth, L + W);
        thumb.classList.add('is-stretch'); thumb.style.left = l0 + 'px'; thumb.style.width = (r0 - l0) + 'px';
        clearTimeout(place.t); place.t = setTimeout(() => { thumb.classList.remove('is-stretch'); thumb.classList.add('is-squash'); thumb.style.left = L + 'px'; thumb.style.width = W + 'px'; setTimeout(() => thumb.classList.remove('is-squash'), 380); }, 140);
      } else { thumb.style.left = L + 'px'; thumb.style.width = W + 'px'; }
    };
    const pick = (id, fire) => { if (id === opt.value) return; const from = opt.items.findIndex((x) => x.id === opt.value); opt.value = id; place(from); fire && opt.onChange && opt.onChange(id); };
    listen(off, el, 'keydown', (e) => {
      const i = opt.items.findIndex((x) => x.id === opt.value); let j = i;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') j = (i + 1) % opt.items.length; else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') j = (i - 1 + opt.items.length) % opt.items.length; else return;
      e.preventDefault(); pick(opt.items[j].id, true); btns[j].focus();
    });
    const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(() => place()) : null; ro && ro.observe(el);
    build(); el.setAttribute('aria-label', opt.label); requestAnimationFrame(() => place());
    return { el, get value() { return opt.value; },
      update(n = {}) { const lab = 'items' in n; opt = { ...opt, ...n }; if (lab) btns.forEach((b, i) => { b.textContent = opt.items[i].label; }); el.setAttribute('aria-label', opt.label); place(); },
      destroy() { ro && ro.disconnect(); off.forEach((f) => f()); el.replaceChildren(); el.classList.remove('nv-seg'); } };
  }
};

/* 4 Split Flap:逐位往前翻到目标,位与位错开一帧
 * opts: text frameMs */
export const splitFlap = {
  mount(el, o = {}) {
    let opt = { text: '', frameMs: 42, ...o };
    el.classList.add('nv-flap'); el.setAttribute('aria-live', 'off');
    let cur = opt.text, timer = 0, cells = [];
    const sr = h('span', 'nv-sr');
    const render = (txt, flipping) => {
      if (cells.length !== txt.length) { cells = txt.split('').map(() => h('span', 'nv-flap-c')); el.replaceChildren(...cells, sr); }
      txt.split('').forEach((c, i) => { if (cells[i].textContent !== c) { cells[i].textContent = c; if (flipping) { cells[i].classList.remove('is-flip'); void cells[i].offsetWidth; cells[i].classList.add('is-flip'); } } });
    };
    const go = (to) => {
      clearInterval(timer); sr.textContent = to;
      if (RM() || cur.length !== to.length) { cur = to; render(to, false); return; }
      const from = cur, n = flapFrames(from, to); let f = 0;
      timer = setInterval(() => { f++; render(flapFrame(from, to, f), true); if (f >= n) { clearInterval(timer); cur = to; } }, opt.frameMs);
      cur = to;
    };
    render(cur, false); sr.textContent = cur;
    return { el, update(n = {}) { opt = { ...opt, ...n }; if ('text' in n) go(n.text); }, destroy() { clearInterval(timer); el.replaceChildren(); el.classList.remove('nv-flap'); } };
  }
};

/* 5 Card Stack + Flip Card:顶牌可拖走(放到底)、点击/回车翻面;背面有「试试」
 * opts: cards[{id, front, back, tag}] onTry(id) labels{prev,next,flip,try,of} */
export const cardStack = {
  mount(el, o = {}) {
    let opt = { cards: [], labels: { prev: '‹', next: '›', flip: '翻面', try: '试试', of: '/' }, onTry: null, ...o };
    const off = [];
    el.classList.add('nv-stack');
    const deck = h('div', 'nv-stack-deck'), bar = h('div', 'nv-stack-bar');
    const prev = h('button', 'gn3-btn nv-stack-nav'), next = h('button', 'gn3-btn nv-stack-nav'), cnt = h('span', 'nv-stack-n');
    prev.type = next.type = 'button'; prev.textContent = '‹'; next.textContent = '›';
    bar.append(prev, cnt, next);
    el.replaceChildren(deck, bar);
    let order = opt.cards.map((_, i) => i), flipped = false, els = [];
    const build = () => {
      els = opt.cards.map((c, i) => {
        const card = h('div', 'nv-card'), inner = h('div', 'nv-card-in'), fr = h('div', 'nv-card-f nv-card-front'), bk = h('div', 'nv-card-f nv-card-back');
        const tag = h('span', 'nv-card-tag', c.tag || ''), q = h('p', 'nv-card-q', c.front), hint = h('span', 'nv-card-hint', opt.labels.flip);
        fr.append(tag, q, hint);
        const a = h('p', 'nv-card-a', c.back), tr = h('button', 'gn3-btn nv-card-try', opt.labels.try); tr.type = 'button'; tr.dataset.id = c.id;
        bk.append(a, tr); inner.append(fr, bk); card.append(inner); card.dataset.i = i;
        listen(off, tr, 'click', (e) => { e.stopPropagation(); opt.onTry && opt.onTry(c.id); });
        return card;
      });
      deck.replaceChildren(...els); layout();
    };
    const layout = () => {
      order.forEach((ci, depth) => {
        const c = els[ci]; c.style.zIndex = String(100 - depth);
        c.style.transform = depth > 2 ? 'translateY(16px) scale(.88)' : `translateY(${depth * 7}px) scale(${1 - depth * 0.04})`;
        c.style.opacity = depth > 2 ? '0' : String(1 - depth * 0.18);
        c.classList.toggle('is-top', depth === 0); c.classList.toggle('is-flipped', depth === 0 && flipped);
        c.setAttribute('aria-hidden', String(depth !== 0)); c.tabIndex = depth === 0 ? 0 : -1;
        if (depth === 0) { c.setAttribute('role', 'button'); c.setAttribute('aria-pressed', String(flipped)); c.setAttribute('aria-label', (flipped ? opt.cards[ci].back : opt.cards[ci].front)); } else { c.removeAttribute('role'); c.removeAttribute('aria-label'); }
        c.querySelector('.nv-card-try').tabIndex = depth === 0 && flipped ? 0 : -1;
      });
      cnt.textContent = (order[0] + 1) + ' ' + opt.labels.of + ' ' + opt.cards.length;
      prev.setAttribute('aria-label', opt.labels.prev); next.setAttribute('aria-label', opt.labels.next);
    };
    const turn = (dir) => { flipped = false; order = dir > 0 ? [...order.slice(1), order[0]] : [order[order.length - 1], ...order.slice(0, -1)]; layout(); };
    const flip = () => { flipped = !flipped; layout(); };
    listen(off, prev, 'click', () => turn(-1)); listen(off, next, 'click', () => turn(1));
    /* 拖顶牌:横向拖过 70px 放到底;否则当作点击翻面 */
    let drag = null;
    listen(off, deck, 'pointerdown', (e) => { const c = e.target.closest('.nv-card.is-top'); if (!c || e.target.closest('.nv-card-try')) return; drag = { c, x: e.clientX, dx: 0 }; c.setPointerCapture(e.pointerId); c.classList.add('is-drag'); });
    listen(off, deck, 'pointermove', (e) => { if (!drag) return; drag.dx = e.clientX - drag.x; drag.c.style.transform = `translateX(${drag.dx}px) rotate(${drag.dx / 14}deg)`; });
    const end = () => {
      if (!drag) return; const { c, dx } = drag; drag = null; c.classList.remove('is-drag');
      if (Math.abs(dx) > 70) { if (!RM()) { c.classList.add('is-fly'); c.style.transform = `translateX(${dx > 0 ? 260 : -260}px) rotate(${dx > 0 ? 18 : -18}deg)`; setTimeout(() => { c.classList.remove('is-fly'); turn(1); }, 220); } else turn(1); }
      else if (Math.abs(dx) < 6) flip(); else layout();
    };
    listen(off, deck, 'pointerup', end); listen(off, deck, 'pointercancel', end);
    listen(off, deck, 'keydown', (e) => {
      if (!e.target.classList.contains('is-top')) return;
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); } else if (e.key === 'ArrowRight') { e.preventDefault(); turn(1); } else if (e.key === 'ArrowLeft') { e.preventDefault(); turn(-1); }
    });
    build();
    return { el, get top() { return opt.cards[order[0]] && opt.cards[order[0]].id; }, get flipped() { return flipped; }, flip, turn,
      show(id) { const i = opt.cards.findIndex((c) => c.id === id); if (i < 0) return; while (order[0] !== i) order = [...order.slice(1), order[0]]; flipped = false; layout(); },
      update(n = {}) { opt = { ...opt, ...n }; if ('cards' in n) { if (order.length !== opt.cards.length) order = opt.cards.map((_, i) => i); build(); } else layout(); },
      destroy() { off.forEach((f) => f()); el.replaceChildren(); el.classList.remove('nv-stack'); } };
  }
};

/* 6 Lock Switch(Uiverse 开关思路,MIT):role=switch,滑块里有锁图标
 * opts: checked label onChange(bool) */
export const lockSwitch = {
  mount(el, o = {}) {
    let opt = { checked: false, label: '', ...o };
    const off = [];
    const b = h('button', 'nv-lock'); b.type = 'button'; b.setAttribute('role', 'switch');
    const tr = h('span', 'nv-lock-tr'), th = h('span', 'nv-lock-th');
    const ic = s('svg', { viewBox: '0 0 12 12', 'aria-hidden': 'true' });
    ic.append(s('rect', { x: 2.5, y: 5.5, width: 7, height: 5, rx: 1.2 }), s('path', { class: 'nv-lock-sh', d: 'M4 5.5V4a2 2 0 0 1 4 0v1.5', fill: 'none' }));
    th.append(ic); tr.append(th); b.append(tr); el.replaceChildren(b);
    const paint = () => { b.setAttribute('aria-checked', String(!!opt.checked)); b.setAttribute('aria-label', opt.label); b.classList.toggle('is-on', !!opt.checked); };
    listen(off, b, 'click', () => { opt.checked = !opt.checked; paint(); opt.onChange && opt.onChange(opt.checked); });
    paint();
    return { el, get checked() { return !!opt.checked; }, update(n = {}) { opt = { ...opt, ...n }; paint(); }, destroy() { off.forEach((f) => f()); el.replaceChildren(); } };
  }
};
