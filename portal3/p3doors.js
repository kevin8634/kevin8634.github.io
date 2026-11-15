/* 创世计划 门户 3.0 · 「造」三道门（11-16）
 * 思路致谢 Aceternity UI「3D Card Effect」（鼠标倾斜 + 层次视差）与「Glowing Effect」（沿边框追随指针的流光）。
 * 本项目自写原生 JS/CSS，未复制源码；样式在 p3ui.css（.door3）。「造」尚未开放：按钮 aria-disabled，点击不跳转。
 * 减少动态：不倾斜、不追光，只保留静态渐变描边。 */
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* doors: [{t, d, no, c, svg}]，soon: 「即将开放」 */
export function mount(host, doors, soon, rm) {
  host.classList.add('dg3');
  host.innerHTML = doors.map(d => `<button type="button" class="door3" aria-disabled="true" style="--c:${esc(d.c)}"><span class="gw" aria-hidden="true"></span><span class="in"><span class="no" aria-hidden="true">${esc(d.no)}</span><svg viewBox="0 0 80 96" aria-hidden="true">${d.svg}</svg><b>${esc(d.t)}</b><span class="ds">${esc(d.d)}</span><small>${esc(soon)}</small></span></button>`).join('');
  const els = Array.from(host.querySelectorAll('.door3'));
  if (rm) return { dispose() {} };
  const st = els.map(() => ({ a: 0, ta: 0, o: 0, rx: 0, ry: 0, trx: 0, try_: 0 }));
  let px = -1e4, py = -1e4, raf = 0;
  function tick() {
    raf = 0; let busy = false;
    if (!host.closest('.open')) return;
    els.forEach((el, i) => {
      const r = el.getBoundingClientRect(), s = st[i];
      if (!r.width) return;
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2, pad = 80;
      const near = px > r.left - pad && px < r.right + pad && py > r.top - pad && py < r.bottom + pad;
      const inside = px > r.left && px < r.right && py > r.top && py < r.bottom;
      if (near) s.ta = Math.atan2(py - cy, px - cx) * 180 / Math.PI + 90;
      let d = ((s.ta - s.a) % 360 + 540) % 360 - 180; s.a += d * .2;
      s.o += ((near ? 1 : 0) - s.o) * .16;
      s.trx = inside ? -(py - cy) / r.height * 14 : 0; s.try_ = inside ? (px - cx) / r.width * 16 : 0;
      s.rx += (s.trx - s.rx) * .14; s.ry += (s.try_ - s.ry) * .14;
      el.style.setProperty('--a', s.a.toFixed(1) + 'deg'); el.style.setProperty('--o', s.o.toFixed(3));
      el.style.setProperty('--rx', s.rx.toFixed(2) + 'deg'); el.style.setProperty('--ry', s.ry.toFixed(2) + 'deg');
      el.style.setProperty('--mx', ((px - r.left) / r.width * 100).toFixed(1) + '%'); el.style.setProperty('--my', ((py - r.top) / r.height * 100).toFixed(1) + '%');
      if (Math.abs(d) > .3 || Math.abs(s.o - (near ? 1 : 0)) > .01 || Math.abs(s.trx - s.rx) > .05 || Math.abs(s.try_ - s.ry) > .05) busy = true;
    });
    if (busy) raf = requestAnimationFrame(tick);
  }
  const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };
  const onMove = e => { if (e.pointerType === 'touch') return; px = e.clientX; py = e.clientY; kick(); };
  const onLeave = () => { px = py = -1e4; kick(); };
  window.addEventListener('pointermove', onMove, { passive: true });
  document.documentElement.addEventListener('pointerleave', onLeave);
  return { dispose() { cancelAnimationFrame(raf); window.removeEventListener('pointermove', onMove); document.documentElement.removeEventListener('pointerleave', onLeave); } };
}
