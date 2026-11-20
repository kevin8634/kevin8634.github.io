/* 创世计划 3.0 · 玻璃组件 /shared/3/ui.js v0.3(G8)
 * 11 个组件,原生 JS 改写,不含第三方源码(思路参考见 LICENSES.md)。
 * 统一接口:mount(el, opts) → { el, update(opts), destroy() }
 * 共同约定:尊重 prefers-reduced-motion 与 <html class="gn3-q-low">(去掉动效/模糊);触控目标 ≥44px;
 *          可键盘操作;文本一律 textContent 写入;配套样式 /shared/3/ui.css。 */

const RM = () => (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches)
  || (typeof document !== 'undefined' && document.documentElement.classList.contains('gn3-q-low'));
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const h = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
function listen(list, t, ev, f, o) { t.addEventListener(ev, f, o); list.push(() => t.removeEventListener(ev, f, o)); }
const snap = (v, step, min) => (step ? Math.round((v - min) / step) * step + min : v);
const dec = (step) => { const s = String(step); return s.includes('.') ? s.split('.')[1].length : 0; };

/* 1 弹性滑块 Elastic Slider:拖过边界有橡皮筋回弹;onStart/onEnd 对接 store.beginGesture/endGesture
 * opts: min max step value label color(css 颜色或变量) format(v)→文本 onInput(v) onChange(v) onStart() onEnd() log(true=对数刻度) */
export const slider = {
  mount(el, o = {}) {
    let opt = { min: 0, max: 1, step: 0, value: 0, label: '', color: 'var(--gn3-k-c)', format: (v) => String(v), log: false, ...o };
    const off = [];
    el.classList.add('gn3-slider');
    const lab = h('div', 'gn3-slider-lab'), name = h('span', '', opt.label), out = h('output', 'gn3-slider-val');
    lab.append(name, out);
    const track = h('div', 'gn3-slider-track'), fill = h('div', 'gn3-slider-fill'), knob = h('div', 'gn3-slider-knob');
    track.append(fill, knob);
    track.tabIndex = 0; track.setAttribute('role', 'slider');
    el.replaceChildren(lab, track);
    const toT = (v) => (opt.log ? Math.log(v / opt.min) / Math.log(opt.max / opt.min) : (v - opt.min) / (opt.max - opt.min));
    const fromT = (t) => (opt.log ? opt.min * Math.pow(opt.max / opt.min, t) : opt.min + t * (opt.max - opt.min));
    let val = opt.value, stretch = 0, drag = false;
    const render = () => {
      const t = clamp(toT(val), 0, 1);
      el.style.setProperty('--gn3-sl-color', opt.color);
      fill.style.width = (t * 100) + '%';
      knob.style.left = (t * 100) + '%';
      track.style.transform = stretch ? `scaleX(${1 + Math.min(0.06, Math.abs(stretch) / 600)})` : '';
      track.style.transformOrigin = stretch < 0 ? 'right center' : 'left center';
      const txt = opt.format(val);
      out.textContent = txt; name.textContent = opt.label;
      track.setAttribute('aria-valuemin', opt.min); track.setAttribute('aria-valuemax', opt.max);
      track.setAttribute('aria-valuenow', val); track.setAttribute('aria-valuetext', txt); track.setAttribute('aria-label', opt.label);
    };
    const setV = (v, fire = true) => {
      v = clamp(v, opt.min, opt.max);
      if (opt.step && !opt.log) v = +snap(v, opt.step, opt.min).toFixed(dec(opt.step));
      if (v === val) return; val = v; render(); fire && opt.onInput && opt.onInput(val);
    };
    const fromX = (x) => { const r = track.getBoundingClientRect(); const t = (x - r.left) / r.width; stretch = t < 0 ? t * r.width : t > 1 ? (t - 1) * r.width : 0; setV(fromT(clamp(t, 0, 1))); render(); };
    listen(off, track, 'pointerdown', (e) => { drag = true; track.setPointerCapture(e.pointerId); el.classList.add('is-drag'); opt.onStart && opt.onStart(); fromX(e.clientX); });
    listen(off, track, 'pointermove', (e) => { if (drag) fromX(e.clientX); });
    const end = () => {
      if (!drag) return; drag = false; el.classList.remove('is-drag');
      if (stretch && !RM()) { el.classList.add('is-spring'); setTimeout(() => el.classList.remove('is-spring'), 420); }
      stretch = 0; render(); opt.onEnd && opt.onEnd(); opt.onChange && opt.onChange(val);
    };
    listen(off, track, 'pointerup', end); listen(off, track, 'pointercancel', end);
    listen(off, track, 'keydown', (e) => {
      const span = opt.log ? null : opt.max - opt.min, st = opt.step || (span ? span / 100 : 0);
      const stepBy = (k) => setV(opt.log ? fromT(clamp(toT(val) + k / 100, 0, 1)) : val + k * st);
      const big = e.shiftKey ? 10 : 1;
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') stepBy(big);
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') stepBy(-big);
      else if (e.key === 'Home') setV(opt.min); else if (e.key === 'End') setV(opt.max);
      else return;
      e.preventDefault(); opt.onChange && opt.onChange(val);
    });
    render();
    return { el, get value() { return val; },
      update(n = {}) { opt = { ...opt, ...n }; if ('value' in n) val = clamp(n.value, opt.min, opt.max); render(); },
      destroy() { off.forEach((f) => f()); el.replaceChildren(); el.classList.remove('gn3-slider'); } };
  },
};

/* 2 数字滚动 Count Up:opts value from duration(ms) format(v) */
export const countUp = {
  mount(el, o = {}) {
    let opt = { value: 0, from: 0, duration: 900, format: (v) => String(Math.round(v)), ...o }, raf = 0, shown = opt.from;
    el.classList.add('gn3-count');
    const run = () => {
      cancelAnimationFrame(raf);
      const a = shown, b = opt.value;
      if (RM() || !(opt.duration > 0) || typeof requestAnimationFrame !== 'function') { shown = b; el.textContent = opt.format(b); return; }
      const t0 = performance.now();
      const tick = (now) => { const k = clamp((now - t0) / opt.duration, 0, 1), e = 1 - Math.pow(1 - k, 3); shown = a + (b - a) * e; el.textContent = opt.format(shown); if (k < 1) raf = requestAnimationFrame(tick); };
      raf = requestAnimationFrame(tick);
    };
    el.textContent = opt.format(shown); run();
    return { el, update(n = {}) { opt = { ...opt, ...n }; run(); }, destroy() { cancelAnimationFrame(raf); el.classList.remove('gn3-count'); } };
  },
};

/* 3 步进器 Stepper:opts value min max step label format onChange */
export const stepper = {
  mount(el, o = {}) {
    let opt = { value: 0, min: -Infinity, max: Infinity, step: 1, label: '', format: (v) => String(v), ...o };
    const off = [];
    el.classList.add('gn3-stepper'); el.setAttribute('role', 'group');
    const minus = h('button', 'gn3-btn gn3-stepper-b', '−'), plus = h('button', 'gn3-btn gn3-stepper-b', '+'), out = h('output', 'gn3-stepper-v');
    minus.type = plus.type = 'button';
    el.replaceChildren(minus, out, plus);
    const render = () => { out.textContent = opt.format(opt.value); minus.disabled = opt.value <= opt.min; plus.disabled = opt.value >= opt.max;
      el.setAttribute('aria-label', opt.label); minus.setAttribute('aria-label', opt.label + ' −'); plus.setAttribute('aria-label', opt.label + ' +'); };
    const go = (k) => { const v = clamp(+(opt.value + k * opt.step).toFixed(dec(opt.step)), opt.min, opt.max); if (v !== opt.value) { opt.value = v; render(); opt.onChange && opt.onChange(v); } };
    listen(off, minus, 'click', () => go(-1)); listen(off, plus, 'click', () => go(1));
    render();
    return { el, get value() { return opt.value; }, update(n = {}) { opt = { ...opt, ...n }; render(); }, destroy() { off.forEach((f) => f()); el.replaceChildren(); el.classList.remove('gn3-stepper'); } };
  },
};

/* 4 玻璃面板 Glass Surface:给已有元素加玻璃材质与随指针移动的高光;opts tint(css 颜色) */
export const glassSurface = {
  mount(el, o = {}) {
    let opt = { tint: '', ...o }; const off = [];
    el.classList.add('gn3-glass', 'gn3-glass-surface');
    const apply = () => { if (opt.tint) el.style.setProperty('--gn3-tint', opt.tint); };
    listen(off, el, 'pointermove', (e) => { if (RM()) return; const r = el.getBoundingClientRect(); el.style.setProperty('--gn3-mx', ((e.clientX - r.left) / r.width * 100) + '%'); el.style.setProperty('--gn3-my', ((e.clientY - r.top) / r.height * 100) + '%'); });
    apply();
    return { el, update(n = {}) { opt = { ...opt, ...n }; apply(); }, destroy() { off.forEach((f) => f()); el.classList.remove('gn3-glass', 'gn3-glass-surface'); } };
  },
};

/* 5 聚光卡 Spotlight Card:指针处一圈柔光;opts color */
export const spotlightCard = {
  mount(el, o = {}) {
    let opt = { color: 'var(--gn3-k-c)', ...o }; const off = [];
    el.classList.add('gn3-glass', 'gn3-spot');
    const apply = () => el.style.setProperty('--gn3-spot', opt.color);
    listen(off, el, 'pointermove', (e) => { const r = el.getBoundingClientRect(); el.style.setProperty('--gn3-mx', (e.clientX - r.left) + 'px'); el.style.setProperty('--gn3-my', (e.clientY - r.top) + 'px'); el.classList.add('is-lit'); });
    listen(off, el, 'pointerleave', () => el.classList.remove('is-lit'));
    apply();
    return { el, update(n = {}) { opt = { ...opt, ...n }; apply(); }, destroy() { off.forEach((f) => f()); el.classList.remove('gn3-glass', 'gn3-spot', 'is-lit'); } };
  },
};

/* 6 倾斜卡 Tilted Card:指针处 3D 倾斜;opts max(度) scale */
export const tiltedCard = {
  mount(el, o = {}) {
    let opt = { max: 10, scale: 1.03, ...o }; const off = [];
    el.classList.add('gn3-tilt');
    const reset = () => { el.style.transform = ''; };
    listen(off, el, 'pointermove', (e) => {
      if (RM() || e.pointerType === 'touch') return;
      const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = `perspective(800px) rotateX(${(-y * opt.max).toFixed(2)}deg) rotateY(${(x * opt.max).toFixed(2)}deg) scale(${opt.scale})`;
    });
    listen(off, el, 'pointerleave', reset);
    return { el, update(n = {}) { opt = { ...opt, ...n }; }, destroy() { off.forEach((f) => f()); reset(); el.classList.remove('gn3-tilt'); } };
  },
};

/* 7 对比滑块 Compare:两层内容左右对比(真实宇宙 vs 你的宇宙);opts before(Node) after(Node) value(0..1) labels[2] onChange */
export const compare = {
  mount(el, o = {}) {
    let opt = { value: 0.5, labels: ['', ''], ...o }; const off = [];
    el.classList.add('gn3-compare');
    const a = h('div', 'gn3-compare-a'), b = h('div', 'gn3-compare-b'), bar = h('div', 'gn3-compare-bar'), la = h('span', 'gn3-compare-la'), lb = h('span', 'gn3-compare-lb');
    if (opt.before) a.append(opt.before); if (opt.after) b.append(opt.after);
    bar.tabIndex = 0; bar.setAttribute('role', 'slider'); bar.setAttribute('aria-valuemin', 0); bar.setAttribute('aria-valuemax', 100);
    el.replaceChildren(a, b, bar, la, lb);
    const render = () => { const p = clamp(opt.value, 0, 1) * 100; b.style.clipPath = `inset(0 0 0 ${p}%)`; bar.style.left = p + '%'; bar.setAttribute('aria-valuenow', Math.round(p));
      la.textContent = opt.labels[0] || ''; lb.textContent = opt.labels[1] || ''; bar.setAttribute('aria-label', (opt.labels[0] || '') + ' / ' + (opt.labels[1] || '')); };
    const set = (v) => { opt.value = clamp(v, 0, 1); render(); opt.onChange && opt.onChange(opt.value); };
    let drag = false;
    const at = (x) => { const r = el.getBoundingClientRect(); set((x - r.left) / r.width); };
    listen(off, el, 'pointerdown', (e) => { drag = true; el.setPointerCapture(e.pointerId); at(e.clientX); });
    listen(off, el, 'pointermove', (e) => { if (drag) at(e.clientX); });
    listen(off, el, 'pointerup', () => { drag = false; }); listen(off, el, 'pointercancel', () => { drag = false; });
    listen(off, bar, 'keydown', (e) => { if (e.key === 'ArrowLeft') set(opt.value - 0.05); else if (e.key === 'ArrowRight') set(opt.value + 0.05); else return; e.preventDefault(); });
    render();
    return { el, update(n = {}) { opt = { ...opt, ...n }; if (n.before) a.replaceChildren(n.before); if (n.after) b.replaceChildren(n.after); render(); },
      destroy() { off.forEach((f) => f()); el.replaceChildren(); el.classList.remove('gn3-compare'); } };
  },
};

/* 8 时间线 Timeline:items [{id,title,sub,state:'ok'|'warn'|'fail'|'todo'}] active(id) onPick(id)(七关 T1–T7 用) */
export const timeline = {
  mount(el, o = {}) {
    let opt = { items: [], active: null, ...o }; const off = [];
    el.classList.add('gn3-timeline'); el.setAttribute('role', 'list');
    const render = () => {
      el.replaceChildren(...opt.items.map((it, i) => {
        const li = h('button', 'gn3-tl-item is-' + (it.state || 'todo') + (it.id === opt.active ? ' is-active' : ''));
        li.type = 'button'; li.setAttribute('role', 'listitem'); li.dataset.id = it.id;
        if (it.id === opt.active) li.setAttribute('aria-current', 'step');
        li.style.setProperty('--gn3-tl-c', `var(--gn3-w0${(i % 7) + 1})`);
        li.append(h('span', 'gn3-tl-dot'), h('span', 'gn3-tl-t', it.title || it.id), h('span', 'gn3-tl-s', it.sub || ''));
        return li;
      }));
    };
    listen(off, el, 'click', (e) => { const b = e.target.closest('.gn3-tl-item'); if (b && el.contains(b)) { opt.active = b.dataset.id; render(); opt.onPick && opt.onPick(opt.active); } });
    render();
    return { el, update(n = {}) { opt = { ...opt, ...n }; render(); }, destroy() { off.forEach((f) => f()); el.replaceChildren(); el.classList.remove('gn3-timeline'); } };
  },
};

/* 9 多步加载 Multi Step Loader:steps [{text, state:'todo'|'run'|'ok'|'fail'}];也可 play(ms) 自动依次推进 */
export const multiStepLoader = {
  mount(el, o = {}) {
    let opt = { steps: [], ...o }, timer = 0;
    el.classList.add('gn3-msl'); el.setAttribute('role', 'status'); el.setAttribute('aria-live', 'polite');
    const render = () => el.replaceChildren(...opt.steps.map((s) => { const r = h('div', 'gn3-msl-row is-' + (s.state || 'todo')); r.append(h('span', 'gn3-msl-ic'), h('span', 'gn3-msl-tx', s.text)); return r; }));
    const api = { el,
      update(n = {}) { opt = { ...opt, ...n }; render(); },
      set(i, state) { if (opt.steps[i]) { opt.steps[i] = { ...opt.steps[i], state }; render(); } },
      play(ms = 500, done) { clearTimeout(timer); let i = 0; const step = () => { if (i > 0) api.set(i - 1, 'ok'); if (i < opt.steps.length) { api.set(i, 'run'); i++; timer = setTimeout(step, RM() ? 0 : ms); } else done && done(); }; step(); },
      destroy() { clearTimeout(timer); el.replaceChildren(); el.classList.remove('gn3-msl'); } };
    render();
    return api;
  },
};

/* 10 展开卡 Expandable Card:两层文本(直白一句 + 展开);opts title summary more(Node 或文本) open onToggle */
export const expandableCard = {
  mount(el, o = {}) {
    let opt = { title: '', summary: '', more: '', open: false, ...o }; const off = [];
    el.classList.add('gn3-glass', 'gn3-exp');
    const head = h('button', 'gn3-exp-head'), t = h('span', 'gn3-exp-t'), s = h('span', 'gn3-exp-s'), chev = h('span', 'gn3-exp-chev', '⌄'), body = h('div', 'gn3-exp-body');
    head.type = 'button'; head.append(t, s, chev);
    const id = 'gn3x' + Math.random().toString(36).slice(2, 8); body.id = id; head.setAttribute('aria-controls', id);
    el.replaceChildren(head, body);
    const render = () => { t.textContent = opt.title; s.textContent = opt.summary;
      body.replaceChildren(typeof opt.more === 'string' ? h('p', '', opt.more) : opt.more || '');
      head.setAttribute('aria-expanded', String(!!opt.open)); el.classList.toggle('is-open', !!opt.open); body.hidden = !opt.open; };
    listen(off, head, 'click', () => { opt.open = !opt.open; render(); opt.onToggle && opt.onToggle(opt.open); });
    render();
    return { el, update(n = {}) { opt = { ...opt, ...n }; render(); }, destroy() { off.forEach((f) => f()); el.replaceChildren(); el.classList.remove('gn3-glass', 'gn3-exp', 'is-open'); } };
  },
};

/* 11 景深卡 3D Card:子元素 data-depth="0..1" 随指针视差;opts strength(px) */
export const card3d = {
  mount(el, o = {}) {
    let opt = { strength: 14, ...o }; const off = [];
    el.classList.add('gn3-card3d');
    const layers = () => el.querySelectorAll('[data-depth]');
    const reset = () => { el.style.transform = ''; layers().forEach((l) => { l.style.transform = ''; }); };
    listen(off, el, 'pointermove', (e) => {
      if (RM() || e.pointerType === 'touch') return;
      const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = `perspective(900px) rotateX(${(-y * 8).toFixed(2)}deg) rotateY(${(x * 8).toFixed(2)}deg)`;
      layers().forEach((l) => { const d = +l.dataset.depth || 0; l.style.transform = `translate3d(${(x * opt.strength * d).toFixed(1)}px, ${(y * opt.strength * d).toFixed(1)}px, ${(d * 40).toFixed(0)}px)`; });
    });
    listen(off, el, 'pointerleave', reset);
    return { el, update(n = {}) { opt = { ...opt, ...n }; }, destroy() { off.forEach((f) => f()); reset(); el.classList.remove('gn3-card3d'); } };
  },
};

export const ALL = { slider, countUp, stepper, glassSurface, spotlightCard, tiltedCard, compare, timeline, multiStepLoader, expandableCard, card3d };
