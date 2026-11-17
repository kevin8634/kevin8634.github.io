/* 觉弈 Ludoterra 2.0 · 心之透镜 —— 界面手感(原生 DOM,零依赖,本项目自写)
 * · elastic():弹性滑块。交互思路参考 React Bits「Elastic Slider」(MIT + Commons Clause,reactbits.dev/components/elastic-slider):
 *   拖过两端时轨道像橡皮一样被拉长,松手回弹。本实现只借交互思路,保留原生 <input type=range>(键盘、读屏、自测照旧)。
 * · countUp():数值滚动。思路参考 React Bits「Count Up」(同上许可,reactbits.dev/text-animations/count-up)。
 * · tilt():3D 卡片倾斜。思路参考 Aceternity UI「3D Card Effect」(ui.aceternity.com/components/3d-card-effect)。
 * · compareBar():拖动分割线对照。思路参考 Aceternity UI「Compare」(ui.aceternity.com/components/compare)。
 * 以上均未复制上游源码;减少动态 / ?capture 时全部退化为静止(无弹性、无滚动、无倾斜)。 */

export function elastic(input, still) {
  if (still) return;
  const wrap = document.createElement('div'); wrap.className = 'es'; input.parentNode.insertBefore(wrap, input); wrap.appendChild(input);
  let down = false;
  const reset = () => { input.style.transition = 'transform .5s cubic-bezier(.3,1.7,.45,1)'; input.style.transform = ''; wrap.classList.remove('pull'); };
  input.addEventListener('pointerdown', () => { down = true; input.style.transition = 'none'; });
  addEventListener('pointerup', () => { if (down) { down = false; reset(); } });
  addEventListener('pointercancel', () => { if (down) { down = false; reset(); } });
  addEventListener('pointermove', e => {
    if (!down) return; const r = input.getBoundingClientRect(); let over = 0;
    if (e.clientX < r.left) over = e.clientX - r.left; else if (e.clientX > r.right) over = e.clientX - r.right;
    if (!over) { input.style.transform = ''; wrap.classList.remove('pull'); return; }
    const d = Math.sign(over) * 22 * (1 - Math.exp(-Math.abs(over) / 90)), s = 1 + Math.abs(d) / r.width;
    input.style.transformOrigin = over < 0 ? 'right center' : 'left center';
    input.style.transform = `scaleX(${s.toFixed(4)}) scaleY(${(1 - Math.abs(d) / 160).toFixed(3)})`; wrap.classList.add('pull');
  });
}

const prev = new Map();
export function countUp(el, to, fmt, still) {
  const key = el.dataset.k || el.id; const from = prev.has(key) ? prev.get(key) : to; prev.set(key, to);
  if (still || from === to || !el.isConnected) { el.textContent = fmt(to); return; }
  const t0 = performance.now(), D = 650;
  const step = now => { const k = Math.min(1, (now - t0) / D), e = 1 - Math.pow(1 - k, 3);
    el.textContent = fmt(from + (to - from) * e); if (k < 1 && prev.get(key) === to) requestAnimationFrame(step); else if (k >= 1) el.textContent = fmt(to); };
  el.textContent = fmt(from); requestAnimationFrame(step);
}

export function tilt(el, still, max = 9) {
  if (still || !matchMedia('(hover:hover)').matches) return;
  el.classList.add('t3d');
  el.addEventListener('pointermove', e => { const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
    el.style.transform = `perspective(700px) rotateX(${(-y * max).toFixed(2)}deg) rotateY(${(x * max).toFixed(2)}deg) translateZ(6px)`;
    el.style.setProperty('--gx', (x + .5) * 100 + '%'); el.style.setProperty('--gy', (y + .5) * 100 + '%'); });
  el.addEventListener('pointerleave', () => { el.style.transform = ''; });
}

/* 分割线:onMove(xCss) 回调;返回 { show(x0,x1,x,labels), hide() } */
export function compareBar(onMove) {
  const bar = document.createElement('div'); bar.id = 'cmpBar'; bar.hidden = true;
  bar.innerHTML = '<i class="ln"></i><button type="button" class="kn" aria-label="拖动分割线对照你和 TA 的透镜">⟷</button><span class="la"></span><span class="lb"></span>';
  document.body.appendChild(bar);
  let lo = 0, hi = innerWidth, x = innerWidth / 2, drag = false;
  const set = v => { x = Math.max(lo + 40, Math.min(hi - 40, v)); bar.style.left = x + 'px'; onMove(x); };
  const kn = bar.querySelector('.kn');
  kn.addEventListener('pointerdown', e => { drag = true; kn.setPointerCapture(e.pointerId); e.stopPropagation(); });
  kn.addEventListener('pointermove', e => { if (drag) set(e.clientX); });
  kn.addEventListener('pointerup', () => { drag = false; });
  kn.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') set(x - 24); if (e.key === 'ArrowRight') set(x + 24); });
  return {
    get x() { return x; },
    show(x0, x1, top, h, la, lb, init) { lo = x0; hi = x1; if (init != null) x = init; bar.hidden = false; bar.style.top = top + 'px'; bar.style.height = h + 'px';
      bar.querySelector('.la').textContent = la; bar.querySelector('.lb').textContent = lb; if (x < lo + 40 || x > hi - 40) x = (lo + hi) / 2; set(x); },
    hide() { bar.hidden = true; }
  };
}
