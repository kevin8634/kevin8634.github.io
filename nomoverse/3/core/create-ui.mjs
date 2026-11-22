/* 宙律 3.0 · 造物层界面组件(3-5,原生 JS/CSS 改写,不含第三方源码;思路署名见 ../../LICENSES.md)
 *   profileCard   React Bits「Profile Card」思路:随指针倾斜的卡 + 全息光斑;低档/减少动态退成静态卡  → 作品卡
 *   decryptedText React Bits「Decrypted Text」思路:乱码逐位揭成目标文字                         → 宇宙命名
 *   starBorder    React Bits「Star Border」思路:两颗光点沿上下边框反向流动                       → 带去天枢
 *   glareHover    React Bits「Glare Hover」思路:悬停时一道斜光扫过                               → 复制分享链接
 *   fileUpload    Aceternity「File Upload」思路:网格虚线投放区,文件卡片落入并显示名称/大小      → 导入 JSON
 *   orbitCanvas   自研:canvas 播放 Worker 算好的 N 体帧(半径开方压缩)                         → T7 恒星系
 * 统一接口:mount(el, opts) → { el, update(opts), destroy() };文本一律 textContent;尊重减少动态与 html.gn3-q-low。 */
import { decryptFrame, project, dotR } from './create.mjs';

const RM = () => (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches)
  || document.documentElement.classList.contains('gn3-q-low');
const h = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
function listen(list, t, ev, f, o) { t.addEventListener(ev, f, o); list.push(() => t.removeEventListener(ev, f, o)); }
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

/* 1 Profile Card:el 内放 children(由调用方填),本组件只管外壳、倾斜与光斑 */
export const profileCard = {
  mount(el, o = {}) {
    let opt = { hue: 260, ...o };
    const off = [];
    el.classList.add('nv-pc');
    const shell = h('div', 'nv-pc-shell'), holo = h('div', 'nv-pc-holo'), glow = h('div', 'nv-pc-glow'), inner = h('div', 'nv-pc-in');
    holo.setAttribute('aria-hidden', 'true'); glow.setAttribute('aria-hidden', 'true');
    shell.append(glow, holo, inner); el.replaceChildren(shell);
    const set = (px, py, on) => {
      shell.style.setProperty('--px', (px * 100).toFixed(1) + '%'); shell.style.setProperty('--py', (py * 100).toFixed(1) + '%');
      shell.style.setProperty('--rx', ((0.5 - py) * 14).toFixed(2) + 'deg'); shell.style.setProperty('--ry', ((px - 0.5) * 18).toFixed(2) + 'deg');
      shell.classList.toggle('is-active', on);
    };
    const paint = () => { el.style.setProperty('--pc-h', String(opt.hue)); el.classList.toggle('is-static', RM()); };
    listen(off, shell, 'pointermove', (e) => {
      if (RM() || e.pointerType === 'touch') return;
      const r = shell.getBoundingClientRect(); set(clamp((e.clientX - r.left) / r.width, 0, 1), clamp((e.clientY - r.top) / r.height, 0, 1), true);
    });
    listen(off, shell, 'pointerleave', () => set(0.5, 0.5, false));
    set(0.5, 0.5, false); paint();
    return { el, inner, update(n = {}) { opt = { ...opt, ...n }; paint(); }, destroy() { off.forEach((f) => f()); el.replaceChildren(); el.classList.remove('nv-pc', 'is-static'); } };
  }
};

/* 2 Decrypted Text:update({text}) 时从乱码揭到新文字(约 0.6 s);读屏只读最终文字 */
export const decryptedText = {
  mount(el, o = {}) {
    let opt = { text: '', steps: 14, frameMs: 40, ...o };
    el.classList.add('nv-dec');
    const vis = h('span', 'nv-dec-v'), sr = h('span', 'nv-sr'); vis.setAttribute('aria-hidden', 'true');
    el.replaceChildren(vis, sr);
    let timer = 0;
    const run = (txt) => {
      clearInterval(timer); sr.textContent = txt;
      if (RM() || !txt) { vis.textContent = txt; el.classList.remove('is-run'); return; }
      let f = 0; el.classList.add('is-run');
      timer = setInterval(() => { f++; vis.textContent = decryptFrame(txt, f, opt.steps, Math.random); if (f >= opt.steps) { clearInterval(timer); vis.textContent = txt; el.classList.remove('is-run'); } }, opt.frameMs);
    };
    run(opt.text);
    return { el, get text() { return opt.text; },
      update(n = {}) { const ch = 'text' in n && n.text !== opt.text; opt = { ...opt, ...n }; if (ch) run(opt.text); },
      destroy() { clearInterval(timer); el.replaceChildren(); el.classList.remove('nv-dec'); } };
  }
};

/* 3 Star Border:包住一个按钮,加两颗流动光点;color 光点颜色,speed 秒 */
export const starBorder = {
  mount(btn, o = {}) {
    let opt = { color: '#c4b5fd', speed: 5, ...o };
    btn.classList.add('nv-sb');
    const a = h('span', 'nv-sb-a'), b = h('span', 'nv-sb-b'); a.setAttribute('aria-hidden', 'true'); b.setAttribute('aria-hidden', 'true');
    btn.prepend(a, b);
    const paint = () => { btn.style.setProperty('--sb-c', opt.color); btn.style.setProperty('--sb-s', opt.speed + 's'); };
    paint();
    return { el: btn, update(n = {}) { opt = { ...opt, ...n }; paint(); }, destroy() { a.remove(); b.remove(); btn.classList.remove('nv-sb'); } };
  }
};

/* 4 Glare Hover:悬停/聚焦时一道斜光扫过;flash() 供点击后反馈 */
export const glareHover = {
  mount(btn, o = {}) {
    let opt = { color: '#ffffff', opacity: 0.35, ...o };
    btn.classList.add('nv-gh');
    const g = h('span', 'nv-gh-g'); g.setAttribute('aria-hidden', 'true'); btn.prepend(g);
    const paint = () => { btn.style.setProperty('--gh-c', opt.color); btn.style.setProperty('--gh-o', String(opt.opacity)); };
    paint();
    return { el: btn,
      flash() { if (RM()) return; btn.classList.remove('is-flash'); void btn.offsetWidth; btn.classList.add('is-flash'); },
      update(n = {}) { opt = { ...opt, ...n }; paint(); }, destroy() { g.remove(); btn.classList.remove('nv-gh', 'is-flash'); } };
  }
};

/* 5 File Upload:点或拖文件进来 → onFile(file);只收 .json / application/json;显示文件卡 */
export const fileUpload = {
  mount(el, o = {}) {
    let opt = { label: '', hint: '', accept: '.json,application/json', onFile: null, ...o };
    const off = [];
    el.classList.add('nv-fu');
    const input = h('input'); input.type = 'file'; input.accept = opt.accept; input.className = 'nv-sr nv-fu-in'; input.tabIndex = -1;
    const zone = h('button', 'nv-fu-zone'); zone.type = 'button';
    const grid = h('span', 'nv-fu-grid'); grid.setAttribute('aria-hidden', 'true');
    const ic = h('span', 'nv-fu-ic', '⇪'); ic.setAttribute('aria-hidden', 'true');
    const lab = h('b', 'nv-fu-lab'), hint = h('span', 'nv-fu-hint');
    const card = h('span', 'nv-fu-card'), cn = h('span', 'nv-fu-cn'), cs = h('span', 'nv-fu-cs'), msg = h('span', 'nv-fu-msg');
    card.append(cn, cs); card.hidden = true; msg.setAttribute('role', 'status');
    zone.append(grid, ic, lab, hint, card);
    el.replaceChildren(zone, input, msg);
    const paint = () => { lab.textContent = opt.label; hint.textContent = opt.hint; zone.setAttribute('aria-label', opt.label + (opt.hint ? ' · ' + opt.hint : '')); };
    const take = (f) => {
      if (!f) return;
      card.hidden = false; cn.textContent = f.name.slice(0, 48); cs.textContent = f.size < 1024 ? f.size + ' B' : (f.size / 1024).toFixed(1) + ' KB';
      el.classList.remove('is-drop'); el.classList.remove('is-in'); void el.offsetWidth; el.classList.add('is-in');
      opt.onFile && opt.onFile(f);
    };
    listen(off, zone, 'click', () => input.click());
    listen(off, input, 'change', () => { take(input.files && input.files[0]); input.value = ''; });
    listen(off, zone, 'dragover', (e) => { e.preventDefault(); el.classList.add('is-drop'); });
    listen(off, zone, 'dragleave', () => el.classList.remove('is-drop'));
    listen(off, zone, 'drop', (e) => { e.preventDefault(); take(e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]); });
    paint();
    return { el, input, take,
      message(text, ok) { msg.textContent = text || ''; msg.className = 'nv-fu-msg' + (text ? ok ? ' is-ok' : ' is-err' : ''); },
      update(n = {}) { opt = { ...opt, ...n }; paint(); }, destroy() { off.forEach((f) => f()); el.replaceChildren(); el.classList.remove('nv-fu'); } };
  }
};

/* 6 Orbit Canvas:播放 trace 帧;静态时画整条轨迹 + 第 0 帧位置 */
export const orbitCanvas = {
  mount(cv, o = {}) {
    let opt = { orbit: null, masses: [], empty: '', ...o };
    const ctx = cv.getContext('2d'); let raf = 0, f = 0, last = 0, W = 0, H = 0, dpr = 1;
    const size = () => { const r = cv.getBoundingClientRect(); dpr = Math.min(2, window.devicePixelRatio || 1); W = Math.max(60, r.width); H = Math.max(60, r.height); cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); };
    const col = (rgb, a = 1) => { const c = (rgb || [1, 0.9, 0.7]).map((x) => Math.round(clamp(x, 0, 1) * 255)); return `rgba(${c[0]},${c[1]},${c[2]},${a})`; };
    const draw = (fr, trails) => {
      const O = opt.orbit; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
      const cx = W / 2, cy = H / 2, R = Math.min(W, H) / 2 - 8;
      if (!O || !O.frames) {
        ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.font = '12px system-ui,sans-serif'; ctx.textAlign = 'center'; ctx.fillText(opt.empty || '', cx, cy + 4); return;
      }
      const n = O.n, P = (fi, i) => project(O.data[(fi * n + i) * 2] - O.data[(fi * n) * 2], O.data[(fi * n + i) * 2 + 1] - O.data[(fi * n) * 2 + 1], O.rMax, R);
      // 轨迹
      for (let i = 1; i < n; i++) {
        ctx.beginPath(); const to = trails ? O.frames : fr + 1, from = trails ? 0 : Math.max(0, fr - 60);
        for (let k = from; k < to; k++) { const [x, y] = P(k, i); k === from ? ctx.moveTo(cx + x, cy + y) : ctx.lineTo(cx + x, cy + y); }
        ctx.strokeStyle = O.hab && O.hab[i - 1] ? 'rgba(110,231,183,.55)' : 'rgba(196,181,253,.35)'; ctx.lineWidth = 1; ctx.stroke();
      }
      // 恒星
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 14); g.addColorStop(0, col(O.rgb, 1)); g.addColorStop(1, col(O.rgb, 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, 14, 0, 7); ctx.fill();
      ctx.fillStyle = col(O.rgb, 1); ctx.beginPath(); ctx.arc(cx, cy, 3.5, 0, 7); ctx.fill();
      // 行星
      for (let i = 1; i < n; i++) {
        const [x, y] = P(fr, i); ctx.fillStyle = O.hab && O.hab[i - 1] ? '#6ee7b7' : '#e9e4ff';
        ctx.beginPath(); ctx.arc(cx + x, cy + y, dotR(opt.masses[i - 1] || 1), 0, 7); ctx.fill();
      }
    };
    const loop = (t) => {
      raf = requestAnimationFrame(loop);
      if (document.hidden || !opt.orbit || !opt.orbit.frames) return;
      if (t - last < 33) return; last = t; f = (f + 1) % opt.orbit.frames; draw(f, false);
    };
    const start = () => { cancelAnimationFrame(raf); size(); f = 0; if (RM() || !opt.orbit || !opt.orbit.frames) { draw(0, true); return; } draw(0, false); raf = requestAnimationFrame(loop); };
    const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(() => { size(); draw(f, RM()); }) : null; ro && ro.observe(cv);
    start();
    return { el: cv, get frame() { return f; },
      update(n = {}) { opt = { ...opt, ...n }; start(); },
      destroy() { cancelAnimationFrame(raf); ro && ro.disconnect(); } };
  }
};
