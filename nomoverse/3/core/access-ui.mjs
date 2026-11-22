/* 宙律 3.0 · 可达性界面组件(3-6,α7;原生 JS/CSS 改写,不含第三方源码;思路署名见 ../../LICENSES.md)
 *   warmTooltip  React Bits「Warm Tooltip」思路:暖色气泡说明;鼠标悬停 / 键盘聚焦 / 触屏长按显示,Esc 关闭,键盘可达
 *   swipeToast   React Bits「Swipe Toast」思路:原生 toast,可横向滑动关闭,自动消失(悬停/聚焦暂停),减少动态下无动画
 *   announcer    读屏播报:视觉隐藏的 aria-live 区,同一句话重复播报也会念
 * 纯逻辑(定位、滑动阈值、队列)在 ./access.mjs,node 有单测。 */
import { tipPlace, longPressMs, swipeDismiss, toastQueue } from './access.mjs';

const h = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
const reducedNow = () => document.documentElement.classList.contains('nv-rm');

/* ---------- Warm Tooltip ---------- */
let tipEl = null, tipFor = null, tipTimer = 0;
function ensureTip() {
  if (tipEl) return tipEl;
  tipEl = h('div', 'nv-tip'); tipEl.id = 'nv-tip'; tipEl.setAttribute('role', 'tooltip'); tipEl.hidden = true;
  tipEl.append(h('span', 'nv-tip-t'), h('i', 'nv-tip-a'));
  document.body.append(tipEl);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && tipFor) hideTip(); });
  window.addEventListener('scroll', () => hideTip(), true);
  return tipEl;
}
function showTip(el, text) {
  if (!text) return;
  const t = ensureTip(); clearTimeout(tipTimer);
  t.querySelector('.nv-tip-t').textContent = text; t.hidden = false; t.classList.remove('is-on');
  const r = el.getBoundingClientRect(), p = tipPlace(r, t.offsetWidth, t.offsetHeight, innerWidth, innerHeight);
  t.style.left = p.x + 'px'; t.style.top = p.y + 'px'; t.dataset.side = p.side; t.style.setProperty('--ax', p.arrow + 'px');
  if (tipFor && tipFor !== el) tipFor.removeAttribute('aria-describedby');
  tipFor = el; el.setAttribute('aria-describedby', 'nv-tip');
  requestAnimationFrame(() => t.classList.add('is-on'));
}
function hideTip() {
  clearTimeout(tipTimer);
  if (tipFor) tipFor.removeAttribute('aria-describedby');
  tipFor = null; if (tipEl) { tipEl.classList.remove('is-on'); tipEl.hidden = true; }
}
export const warmTooltip = {
  /* text: 字符串或函数(每次显示时取,跟随语言) */
  attach(el, text) {
    const get = () => (typeof text === 'function' ? text() : text);
    let lp = 0, longed = 0, hov = 0;
    const off = [];
    const on = (t, ev, f, o) => { t.addEventListener(ev, f, o); off.push(() => t.removeEventListener(ev, f, o)); };
    on(el, 'pointerenter', (e) => { if (e.pointerType === 'mouse') { clearTimeout(hov); hov = setTimeout(() => showTip(el, get()), 380); } });
    on(el, 'pointerleave', (e) => { clearTimeout(hov); clearTimeout(lp); if (e.pointerType === 'mouse' && tipFor === el) hideTip(); });
    on(el, 'focus', () => { if (el.matches(':focus-visible')) showTip(el, get()); });
    on(el, 'blur', () => { if (tipFor === el) hideTip(); });
    /* 触屏长按:显示说明,并吞掉松手后的那次点击 */
    on(el, 'pointerdown', (e) => { if (e.pointerType === 'mouse') return; clearTimeout(lp); lp = setTimeout(() => { longed = Date.now(); showTip(el, get()); clearTimeout(tipTimer); tipTimer = setTimeout(hideTip, 2600); }, longPressMs); });
    on(el, 'pointerup', () => clearTimeout(lp)); on(el, 'pointercancel', () => clearTimeout(lp)); on(el, 'pointermove', (e) => { if (Math.abs(e.movementX) + Math.abs(e.movementY) > 6) clearTimeout(lp); });
    on(el, 'click', (e) => { if (longed && Date.now() - longed < 1500) { longed = 0; e.preventDefault(); e.stopImmediatePropagation(); } }, true);
    on(el, 'contextmenu', (e) => { if (longed || e.pointerType === 'touch') e.preventDefault(); });
    el.classList.add('has-tip');
    return () => { off.forEach((f) => f()); if (tipFor === el) hideTip(); el.classList.remove('has-tip'); };
  },
  show: showTip, hide: hideTip,
  get current() { return tipFor; }
};

/* ---------- Swipe Toast ---------- */
export const swipeToast = {
  mount(el, o = {}) {
    let opt = { closeLabel: 'Close', ms: 5200, max: 3, ...o };
    el.classList.add('nv-toasts'); el.setAttribute('role', 'region'); el.setAttribute('aria-live', 'polite'); el.setAttribute('aria-relevant', 'additions text');
    if (opt.label) el.setAttribute('aria-label', opt.label);
    let list = [];   // [{key, text, kind, node, timer}]
    const remove = (item, how) => {
      clearTimeout(item.timer);
      list = list.filter((x) => x !== item);
      const n = item.node;
      if (reducedNow() || how === 'swipe') { n.remove(); return; }
      n.classList.add('is-out'); setTimeout(() => n.remove(), 220);
    };
    const arm = (item) => { clearTimeout(item.timer); if (item.ms > 0) item.timer = setTimeout(() => remove(item), item.ms); };
    function show({ key = String(Math.random()), text = '', kind = 'info', ms = opt.ms } = {}) {
      const old = list.find((x) => x.key === key);
      if (old) { old.node.querySelector('.nv-toast-t').textContent = text; old.text = text; old.ms = ms; arm(old); return old; }
      const n = h('div', 'nv-toast is-' + kind), t = h('p', 'nv-toast-t', text), x = h('button', 'nv-toast-x', '×');
      n.setAttribute('role', kind === 'warn' ? 'alert' : 'status'); n.dataset.key = key;
      x.type = 'button'; x.setAttribute('aria-label', opt.closeLabel); x.title = opt.closeLabel;
      n.append(t, x);
      const item = { key, text, kind, node: n, ms, timer: 0 };
      const before = list.slice();
      list = toastQueue(list, item, opt.max);
      before.filter((b) => !list.includes(b)).forEach((b) => remove(b));
      el.append(n);
      x.addEventListener('click', () => remove(item));
      n.addEventListener('pointerenter', () => clearTimeout(item.timer)); n.addEventListener('pointerleave', () => arm(item));
      n.addEventListener('focusin', () => clearTimeout(item.timer)); n.addEventListener('focusout', () => arm(item));
      n.addEventListener('keydown', (e) => { if (e.key === 'Escape') remove(item); });
      /* 横向滑动关闭 */
      let d = null;
      n.addEventListener('pointerdown', (e) => { if (e.target === x) return; d = { x: e.clientX, y: e.clientY, t: performance.now(), dx: 0, dy: 0 }; n.setPointerCapture(e.pointerId); n.classList.add('is-drag'); clearTimeout(item.timer); });
      n.addEventListener('pointermove', (e) => { if (!d) return; d.dx = e.clientX - d.x; d.dy = e.clientY - d.y; if (Math.abs(d.dx) > Math.abs(d.dy)) { n.style.transform = `translateX(${d.dx}px)`; n.style.opacity = String(Math.max(0.2, 1 - Math.abs(d.dx) / (n.offsetWidth || 300))); } });
      const up = () => {
        if (!d) return; const vx = d.dx / Math.max(1, performance.now() - d.t), go = swipeDismiss(d.dx, d.dy, n.offsetWidth || 300, vx); d = null; n.classList.remove('is-drag');
        if (go) remove(item, 'swipe'); else { n.style.transform = ''; n.style.opacity = ''; arm(item); }
      };
      n.addEventListener('pointerup', up); n.addEventListener('pointercancel', up);
      arm(item);
      return item;
    }
    return { el, show, dismiss(key) { const it = list.find((x) => x.key === key); if (it) remove(it); }, clear() { list.slice().forEach((x) => remove(x)); },
      get items() { return list.map((x) => ({ key: x.key, text: x.text, kind: x.kind })); },
      update(n = {}) { opt = { ...opt, ...n }; if (opt.label) el.setAttribute('aria-label', opt.label); el.querySelectorAll('.nv-toast-x').forEach((b) => { b.setAttribute('aria-label', opt.closeLabel); b.title = opt.closeLabel; }); },
      destroy() { list.forEach((x) => clearTimeout(x.timer)); list = []; el.replaceChildren(); } };
  }
};

/* ---------- 读屏播报 ---------- */
export function announcer(el) {
  el.classList.add('nv-sr'); el.setAttribute('aria-live', 'polite'); el.setAttribute('aria-atomic', 'true'); el.setAttribute('role', 'status');
  let t = 0, lastText = '';
  return {
    say(text) { clearTimeout(t); el.textContent = ''; lastText = text; t = setTimeout(() => { el.textContent = text; }, 40); },
    get last() { return lastText; }
  };
}
