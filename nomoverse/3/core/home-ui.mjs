/* 宙律 Nomoverse · 首页 3.0 化界面组件(3-8 α8,原生 JS/CSS 改写,不含第三方源码;思路署名见 ../../LICENSES.md)
 *   animatedList  React Bits「Animated List」思路:列表项进入视野时错峰弹入,方向键在项之间移动并高亮,滚动时上下渐隐 → 探究任务抽屉
 *   shinyText     React Bits「Shiny Text」思路:文字上一道缓慢扫过的光泽                                          → 标题
 *   textType      React Bits「Text Type」思路:逐字打出、闪烁光标、换句时先删后打                                → 向导气泡
 *   (Elastic Slider 用 /shared/3/ui.js slider、Spotlight Card 用 /shared/3/ui.js spotlightCard、Star Border 用 ./create-ui.mjs,均只引用)
 * 统一接口:mount(el, opts) → { el, update(opts), destroy() };文本一律 textContent;
 * 减少动态 / 低档(html.gn3-q-low)下全部静态:列表直接显示、光泽不动、文字整句出现且无光标闪烁。 */
import { typeFrames, frameDelay, staggerDelay, listKey } from './home.mjs';

const RM = () => (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches)
  || document.documentElement.classList.contains('gn3-q-low') || document.documentElement.classList.contains('nv-rm');
const h = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
function listen(list, t, ev, f, o) { t.addEventListener(ev, f, o); list.push(() => t.removeEventListener(ev, f, o)); }

/* 1 Animated List:el 是列表容器,opts.item 选择器(默认直接子元素) */
export const animatedList = {
  mount(el, o = {}) {
    let opt = { item: ':scope > *', step: 55, ...o };
    const off = [];
    let io = null;
    el.classList.add('nv-al');
    const items = () => Array.from(el.querySelectorAll(opt.item));
    const edges = () => {
      const sc = el.scrollHeight > el.clientHeight + 2 || el.scrollWidth > el.clientWidth + 2;
      el.classList.toggle('has-top', sc && (el.scrollTop > 2 || el.scrollLeft > 2));
      el.classList.toggle('has-bot', sc && (el.scrollTop + el.clientHeight < el.scrollHeight - 2 || el.scrollLeft + el.clientWidth < el.scrollWidth - 2));
    };
    const refresh = () => {
      if (io) io.disconnect();
      const list = items(), still = RM() || typeof IntersectionObserver !== 'function';
      list.forEach((it, i) => {
        it.classList.add('nv-al-i');
        it.style.setProperty('--al-d', staggerDelay(i, opt.step) + 'ms');
        if (still) it.classList.add('is-in');
      });
      if (!still) {
        io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { threshold: 0 });
        list.forEach((it) => { if (!it.classList.contains('is-in')) io.observe(it); });
      }
      edges();
    };
    listen(off, el, 'keydown', (e) => {
      const list = items(), i = list.indexOf(document.activeElement && document.activeElement.closest(opt.item));
      if (i < 0) return;
      const j = listKey(i, e.key, list.length);
      if (j === i && !['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
      e.preventDefault(); e.stopPropagation();
      if (j !== i && list[j]) { list[j].focus(); list[j].scrollIntoView && list[j].scrollIntoView({ block: 'nearest', inline: 'nearest' }); }
    });
    listen(off, el, 'focusin', (e) => { items().forEach((it) => it.classList.toggle('is-sel', it.contains(e.target))); });
    listen(off, el, 'focusout', () => setTimeout(() => { if (!el.contains(document.activeElement)) items().forEach((it) => it.classList.remove('is-sel')); }, 0));
    listen(off, el, 'scroll', edges, { passive: true });
    listen(off, window, 'resize', edges);
    refresh();
    return { el, refresh, update(n = {}) { opt = { ...opt, ...n }; refresh(); },
      destroy() { off.forEach((f) => f()); if (io) io.disconnect(); el.classList.remove('nv-al', 'has-top', 'has-bot'); } };
  }
};

/* 2 Shiny Text:给已有文字元素加一道扫光;speed 秒/次 */
export const shinyText = {
  mount(el, o = {}) {
    let opt = { speed: 4, ...o };
    el.classList.add('nv-shiny');
    const paint = () => el.style.setProperty('--shine-s', opt.speed + 's');
    paint();
    return { el, update(n = {}) { opt = { ...opt, ...n }; paint(); }, destroy() { el.classList.remove('nv-shiny'); } };
  }
};

/* 3 Text Type:el 内放「可见打字层(aria-hidden)+ 光标 + 读屏整句层」。show(text) 换句。
 *   读屏只在整句就绪时更新一次(el 自带的 aria-live 播报整句,不会逐字念)。 */
export const textType = {
  mount(el, o = {}) {
    let opt = { text: '', speed: 38, ...o };
    el.classList.add('nv-tt');
    // 幽灵层(整句、不可见)撑住高度,打字层叠在上面:打字时气泡不跳动
    const ghost = h('span', 'nv-tt-g'), vis = h('span', 'nv-tt-v'), txt = h('span', 'nv-tt-t'), cur = h('span', 'nv-tt-c'), sr = h('span', 'sr');
    ghost.setAttribute('aria-hidden', 'true'); vis.setAttribute('aria-hidden', 'true');
    [ghost, vis, sr].forEach((x) => x.setAttribute('data-noi18n', ''));
    vis.append(txt, cur);
    el.replaceChildren(ghost, vis, sr);
    let shown = '', timer = 0, frames = [], k = 0, target = '';
    const done = () => { el.classList.remove('is-typing'); };
    const tick = () => {
      if (k >= frames.length) { done(); return; }
      shown = frames[k++]; txt.textContent = shown;
      if (k >= frames.length) { done(); return; }
      timer = setTimeout(tick, frameDelay(frames[k], shown, opt.speed));
    };
    const show = (text) => {
      clearTimeout(timer); target = String(text || '');
      sr.textContent = target; ghost.textContent = target;
      if (RM()) { shown = target; txt.textContent = target; done(); return; }
      frames = typeFrames(shown, target); k = 0; el.classList.add('is-typing');
      timer = setTimeout(tick, 60);
    };
    show(opt.text);
    return { el, show, get text() { return target; }, get shown() { return shown; }, get typing() { return el.classList.contains('is-typing'); },
      update(n = {}) { opt = { ...opt, ...n }; if ('text' in n) show(n.text); }, destroy() { clearTimeout(timer); el.replaceChildren(); el.classList.remove('nv-tt', 'is-typing'); } };
  }
};
