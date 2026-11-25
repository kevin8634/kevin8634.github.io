/* 创世计划 门户 3.0 · 首屏背景丰富三层（11-25，本项目自写，纯 DOM + 2D canvas，不用 three、零外部请求）
 *  ① 远景：淡银河带斜贯画面、极慢旋转（观感参考 React Bits「Galaxy」，代码自写：一次性画到离屏 2D canvas，CSS transform 旋转，合成层完成，不逐帧重画）
 *  ② 中景：三层星点视差（随鼠标 / 滚动微移）+ 偶尔流星（观感参考 Aceternity「Stars Background」「Shooting Stars」，代码自写）
 *  ③ 树两侧：按七个世界主色铺极淡流动光雾（观感参考 React Bits「Aurora」，代码自写：径向渐变色块 + CSS 关键帧漂移，无 blur 滤镜）
 * 分档：high 全开；medium 去流星；low / 减少动态 / 无 WebGL → 静态底图 p3bg-still*.webp（由本文件 paintStill() 在本地生成）。
 * 整组以 mix-blend-mode: screen 叠在 WebGL 画布之上、暗角与文字之下，只提亮暗部，不压文字。 */

const COLS = ['#7cc8ff', '#a78bfa', '#ff9a3c', '#5eead4', '#f0c060', '#22d3ee', '#c4b5fd'];   // 数学→星空（树自下而上）

/* 可复现随机 */
function rng(s) { return () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function gauss(R) { let u = 0, v = 0; while (u === 0) u = R(); v = R(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(6.2832 * v); }
function rgba(hex, a) { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${n >> 8 & 255},${n & 255},${a})`; }

/* 银河带：画在 N×N 方画布中心，沿水平轴（显示时整体旋转成斜向）；k = 点数系数 */
export function paintGalaxy(ctx, N, k) {
  const R = rng(3086), c = N / 2, len = N * .5, wid = N * .085;
  ctx.save(); ctx.translate(c, c);
  ctx.globalCompositeOperation = 'lighter';
  // 底层柔光：横向渐变 × 纵向高斯（用多条细带叠出来）
  for (let i = 0; i < 9; i++) {
    const w = wid * (2.6 - i * .26), a = .022 + i * .004;
    const g = ctx.createLinearGradient(-len, 0, len, 0);
    g.addColorStop(0, 'rgba(120,90,200,0)'); g.addColorStop(.22, `rgba(150,120,230,${a})`); g.addColorStop(.5, `rgba(235,215,255,${a * 1.25})`); g.addColorStop(.78, `rgba(120,170,240,${a})`); g.addColorStop(1, 'rgba(120,170,240,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 0, len, w * .5, 0, 0, 6.2832); ctx.fill();
  }
  // 星云团：沿带分布的柔光团
  for (let i = 0; i < 150 * k; i++) {
    const x = (R() * 2 - 1) * len * .92, fall = 1 - Math.abs(x) / len, y = gauss(R) * wid * .34, r = wid * (.25 + R() * .7) * (.5 + fall * .7);
    const hue = R(), col = hue < .45 ? [190, 160, 255] : hue < .75 ? [150, 200, 255] : [255, 170, 215];
    const g = ctx.createRadialGradient(x, y, 0, x, y, r); const a = (.018 + R() * .03) * (.35 + fall);
    g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(1, `rgba(${col},0)`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fill();
  }
  // 细密星尘
  const n = Math.round(16000 * k);
  for (let i = 0; i < n; i++) {
    const x = (R() * 2 - 1) * len, fall = 1 - Math.abs(x) / len, y = gauss(R) * wid * (.18 + .32 * R());
    const s = .35 + R() * R() * 1.1, a = (.2 + R() * .5) * (.25 + fall * .9);
    ctx.fillStyle = R() < .8 ? `rgba(235,232,255,${a})` : `rgba(190,215,255,${a})`;
    ctx.fillRect(x, y, s, s);
  }
  // 暗尘带：沿轴线的几段暗纹（让带子有结构）
  ctx.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 40 * k; i++) {
    const x = (R() * 2 - 1) * len * .8, y = (R() - .5) * wid * .3, rx = wid * (.8 + R() * 2.2), ry = wid * (.09 + R() * .12);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1); g.addColorStop(0, 'rgba(0,0,0,.22)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.save(); ctx.translate(x, y); ctx.rotate((R() - .5) * .12); ctx.scale(rx, ry); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 1, 0, 6.2832); ctx.fill(); ctx.restore();
  }
  ctx.restore();
}

/* 星点层：w×h（css px）× dpr；layer 0 远（多、小、暗）/ 1 中 / 2 近（少、大、带光晕） */
const STAR = [{ per: 2000, s: [.5, .95], a: [.35, .7], glow: 0 }, { per: 9000, s: [.8, 1.35], a: [.45, .85], glow: 0 }, { per: 32000, s: [1.1, 1.9], a: [.6, 1], glow: 1 }];
export function paintStars(ctx, w, h, dpr, layer, seed) {
  const R = rng(seed || (911 + layer * 77)), L = STAR[layer], n = Math.round(w * h / L.per);
  ctx.save(); ctx.scale(dpr, dpr); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    const x = R() * w, y = R() * h, s = L.s[0] + R() * (L.s[1] - L.s[0]), a = L.a[0] + R() * (L.a[1] - L.a[0]);
    const t = R(), col = t < .7 ? '236,238,255' : t < .86 ? '190,214,255' : t < .95 ? '255,226,190' : '255,200,230';
    if (L.glow && s > 1.4) { const g = ctx.createRadialGradient(x, y, 0, x, y, s * 4); g.addColorStop(0, `rgba(${col},${a * .35})`); g.addColorStop(1, `rgba(${col},0)`); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, s * 4, 0, 6.2832); ctx.fill(); }
    ctx.fillStyle = `rgba(${col},${a})`; ctx.beginPath(); ctx.arc(x, y, s * .5, 0, 6.2832); ctx.fill();
  }
  ctx.restore();
}

/* 光雾色块：七个世界主色，树两侧按层高排（数学在左下 … 星空在右上），返回百分比坐标 */
function auroraSpots() {
  // [x%, y%, 宽%, 高%, 颜色序号]；左右交替，自下而上
  return [[10, 84, 46, 34, 0], [90, 72, 44, 34, 1], [8, 60, 44, 36, 2], [92, 50, 46, 36, 3], [9, 38, 44, 34, 4], [91, 28, 44, 34, 5], [14, 14, 46, 30, 6]];
}
function auroraGrad(hex, a) { return `radial-gradient(closest-side, ${rgba(hex, a)}, ${rgba(hex, a * .45)} 45%, ${rgba(hex, 0)})`; }

/* 静态底图：把三层按某一时刻画到一张图上（本地生成 p3bg-still*.webp 用；运行时不调用） */
export function paintStill(ctx, w, h) {
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, h);
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  // 光雾
  auroraSpots().forEach(([x, y, sw, sh, ci]) => {
    const cx = x / 100 * w, cy = y / 100 * h, rx = sw / 100 * w / 2, ry = sh / 100 * h / 2;
    ctx.save(); ctx.translate(cx, cy); ctx.scale(rx, ry);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1); g.addColorStop(0, rgba(COLS[ci], .16)); g.addColorStop(.45, rgba(COLS[ci], .072)); g.addColorStop(1, rgba(COLS[ci], 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 1, 0, 6.2832); ctx.fill(); ctx.restore();
  });
  // 银河带
  const D = Math.ceil(Math.hypot(w, h)), oc = document.createElement('canvas'); oc.width = oc.height = D;
  paintGalaxy(oc.getContext('2d'), D, Math.min(1.4, D / 1400));
  ctx.globalAlpha = .62; ctx.translate(w / 2, h / 2); ctx.rotate(-.5); ctx.drawImage(oc, -D / 2, -D / 2); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1;
  for (let l = 0; l < 3; l++) { const sc = document.createElement('canvas'); sc.width = w; sc.height = h; paintStars(sc.getContext('2d'), w, h, 1, l); ctx.drawImage(sc, 0, 0); }
  ctx.restore();
}

/* ---------- 运行时 ---------- */
const CSS = `
#p3hero .p3bg { position: absolute; inset: 0; z-index: 0; pointer-events: none; overflow: hidden; mix-blend-mode: screen; opacity: 0; transition: opacity 1.6s ease; contain: strict; }
#p3hero .p3bg.on { opacity: 1; }
#p3hero .p3bg > * { position: absolute; pointer-events: none; }
#p3hero .p3bg .gx { left: 50%; top: 50%; opacity: .42; will-change: transform; animation: p3bgRot 900s linear infinite; }
@keyframes p3bgRot { from { transform: translate(-50%, -50%) rotate(-29deg); } to { transform: translate(-50%, -50%) rotate(331deg); } }
#p3hero .p3bg .st { left: calc(var(--m) * -1); top: calc(var(--m) * -1); will-change: transform; transform: translate3d(var(--x, 0px), var(--y, 0px), 0); }
#p3hero .p3bg .au { inset: 0; }
#p3hero .p3bg .au i { position: absolute; display: block; border-radius: 50%; will-change: transform; animation: p3bgAu var(--d) ease-in-out var(--dl) infinite alternate; }
@keyframes p3bgAu { 0% { transform: translate(-50%, -50%) translate(0, 0) scale(1, 1); opacity: .75; } 50% { transform: translate(-50%, -50%) translate(var(--dx), calc(var(--dy) * -1)) scale(1.12, .9); opacity: 1; } 100% { transform: translate(-50%, -50%) translate(calc(var(--dx) * -.6), var(--dy)) scale(.92, 1.1); opacity: .65; } }
#p3hero .p3bg .ms { inset: 0; }
#p3hero .p3bg .ms b { position: absolute; display: block; width: 150px; height: 1.6px; border-radius: 2px; background: linear-gradient(90deg, rgba(255,255,255,0), rgba(220,230,255,.85) 80%, #fff); transform-origin: 100% 50%; opacity: 0; animation: p3bgMs 1.25s cubic-bezier(.3,.6,.4,1) forwards; }
#p3hero .p3bg .ms b::after { content: ""; position: absolute; right: -2px; top: -2px; width: 5px; height: 5px; border-radius: 50%; background: #fff; box-shadow: 0 0 8px 2px rgba(200,220,255,.8); }
@keyframes p3bgMs { 0% { opacity: 0; transform: rotate(var(--a)) translateX(0); } 12% { opacity: 1; } 75% { opacity: .9; } 100% { opacity: 0; transform: rotate(var(--a)) translateX(var(--l)); } }
#p3hero .p3bg .sl { inset: 0; background: url("portal3/p3bg-still.webp") center / cover no-repeat; display: none; }
@media (max-aspect-ratio: 4/5) { #p3hero .p3bg .sl { background-image: url("portal3/p3bg-still-p.webp"); } }
#p3hero .p3bg.still .sl { display: block; }
#p3hero .p3bg.still .gx, #p3hero .p3bg.still .st, #p3hero .p3bg.still .au, #p3hero .p3bg.still .ms { display: none; }
@media (prefers-reduced-motion: reduce) { #p3hero .p3bg .gx, #p3hero .p3bg .au i { animation: none !important; } #p3hero .p3bg .ms { display: none; } }
`;

export function mount(host, opt) {
  opt = opt || {};
  const doc = document, root = doc.createElement('div'); root.className = 'p3bg still'; root.setAttribute('aria-hidden', 'true');
  if (!doc.getElementById('p3bgcss')) { const st = doc.createElement('style'); st.id = 'p3bgcss'; st.textContent = CSS; doc.head.appendChild(st); }
  const cv = host.querySelector('#p3cv'); if (cv && cv.nextSibling) host.insertBefore(root, cv.nextSibling); else host.insertBefore(root, host.firstChild);
  const sl = doc.createElement('div'); sl.className = 'sl'; root.appendChild(sl);
  let mode = 'still', built = false, gx = null, sts = [], au = null, ms = null, msT = 0, raf = 0, dead = false, rzT = 0;
  const DEP = [5, 12, 22];   // 三层视差位移上限（px）
  const tgt = { x: 0, y: 0 }, cur = { x: 0, y: 0 };
  const small = () => innerWidth < 800 || innerHeight < 500;

  function build() {
    if (built) return; built = true;
    gx = doc.createElement('canvas'); gx.className = 'gx'; root.appendChild(gx);
    for (let l = 0; l < 3; l++) { const c = doc.createElement('canvas'); c.className = 'st'; c.style.setProperty('--m', DEP[l] + 4 + 'px'); root.appendChild(c); sts.push(c); }
    au = doc.createElement('div'); au.className = 'au'; root.appendChild(au);
    auroraSpots().forEach(([x, y, sw, sh, ci], i) => {
      const e = doc.createElement('i'), a = small() ? .1 : .12;
      e.style.cssText = `left:${x}%;top:${y}%;width:${sw}vw;height:${sh}vh;background:${auroraGrad(opt.cols && opt.cols[ci] || COLS[ci], a)};--d:${16 + i * 2.3}s;--dl:${-i * 3.7}s;--dx:${(i % 2 ? -1 : 1) * (2.5 + i * .4)}vw;--dy:${2 + (i % 3)}vh`;
      au.appendChild(e);
    });
    ms = doc.createElement('div'); ms.className = 'ms'; root.appendChild(ms);
    paint();
  }
  function paint() {
    if (!built) return;
    const w = innerWidth, h = innerHeight, sm = small();
    const D = Math.ceil(Math.hypot(w, h)), N = Math.min(sm ? 768 : 1280, D);
    gx.width = gx.height = N; gx.style.width = gx.style.height = D + 'px';
    paintGalaxy(gx.getContext('2d'), N, sm ? .55 : N / 1280);
    const px = Math.min(window.devicePixelRatio || 1, 1.5, Math.sqrt((sm ? 1.1e6 : 2.2e6) / (w * h)));
    sts.forEach((c, l) => { const m = DEP[l] + 4, cw = w + 2 * m, ch = h + 2 * m; c.width = Math.round(cw * px); c.height = Math.round(ch * px); c.style.width = cw + 'px'; c.style.height = ch + 'px';
      paintStars(c.getContext('2d'), cw, ch, px, l, 911 + l * 77 + (sm ? 5 : 0)); });
  }
  /* 视差：鼠标位置（-1..1）+ 滚动；只在有输入时跑 rAF，静止后自停 */
  function onMove(e) { tgt.x = e.clientX / innerWidth * 2 - 1; tgt.y = e.clientY / innerHeight * 2 - 1; kick(); }
  function onScroll() { kick(); }
  function kick() { if (mode === 'still' || raf || dead) return; raf = requestAnimationFrame(step); }
  function step() {
    raf = 0; const sy = Math.min(1, (window.scrollY || 0) / Math.max(1, innerHeight));
    cur.x += (tgt.x - cur.x) * .08; cur.y += (tgt.y - cur.y) * .08;
    sts.forEach((c, l) => { c.style.setProperty('--x', (-cur.x * DEP[l]).toFixed(2) + 'px'); c.style.setProperty('--y', (-cur.y * DEP[l] * .7 - sy * DEP[l] * 1.6).toFixed(2) + 'px'); });
    if (Math.abs(tgt.x - cur.x) + Math.abs(tgt.y - cur.y) > .002) raf = requestAnimationFrame(step);
  }
  /* 流星：只在 high；页面不可见或首屏离场时不放 */
  function meteor() {
    clearTimeout(msT); if (mode !== 'high' || dead) return;
    msT = setTimeout(meteor, 5200 + Math.random() * 7000);
    if (document.hidden || !ms) return;
    const b = doc.createElement('b'), w = innerWidth, h = innerHeight, a = 145 + Math.random() * 22;   // 向左下划过
    b.style.left = (w * (.35 + Math.random() * .6)) + 'px'; b.style.top = (h * (.04 + Math.random() * .3)) + 'px';
    b.style.setProperty('--a', a + 'deg'); b.style.setProperty('--l', Math.round(Math.min(w, h) * (.35 + Math.random() * .25)) + 'px');
    ms.appendChild(b); setTimeout(() => b.remove(), 1400);
  }
  function onResize() { clearTimeout(rzT); rzT = setTimeout(paint, 220); }
  addEventListener('pointermove', onMove, { passive: true }); addEventListener('scroll', onScroll, { passive: true }); addEventListener('resize', onResize);

  /* 档位：'high' | 'medium' | 'still' */
  function set(m) {
    if (dead) return; if (m !== 'high' && m !== 'medium') m = 'still';
    mode = m; if (m !== 'still') build();
    root.classList.toggle('still', m === 'still'); clearTimeout(msT); if (m === 'high') msT = setTimeout(meteor, 2500);
    if (ms && m !== 'high') ms.textContent = '';
    requestAnimationFrame(() => root.classList.add('on'));
  }
  function dispose() { dead = true; clearTimeout(msT); clearTimeout(rzT); cancelAnimationFrame(raf); removeEventListener('pointermove', onMove); removeEventListener('scroll', onScroll); removeEventListener('resize', onResize);
    root.classList.remove('on'); setTimeout(() => { root.remove(); }, 800); }
  return { set, dispose, mode: () => mode, el: root };
}
