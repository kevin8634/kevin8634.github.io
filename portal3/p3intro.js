/* 创世计划 门户 3.0 · 开场动画（阶段 1，11-15）约 6 秒，每会话一次，可跳过（按钮 / Esc / 点击）。
 * 0–1.5 蓝图描线（北斗七星 → 八芒星线框，LOADING%）→ 1.5–2.5 玻璃星核 + 七色光桥 → 2.5–3.5 闪白/RGB 错位/切片冲出「GENESIS 3.0」
 * → 3.5–5 紫青星云 + 格子墙 + 淡字带视差 + 副标 → 5–6 镜头穿过八芒星，淡出到 #p3hero。
 * 分档见 p3tier.js（与 p3hero 共用）：high（只能手动选）= 物理透射玻璃（色散、虹彩）+ bloom；medium（所有真 GPU 的默认，含手机/苹果）= 菲涅尔假玻璃 + bloom；
 * low（软件渲染、无 WebGL2）= 纯 2D canvas 描线 + 切片故障，不加载 three。
 * fps 监测：玻璃阶段连续约 1 秒平均 <24fps 就降一档（high→medium→low），不中断时间线；右下「画质」可手动切换（写 gn:p3q，即时生效）。
 * 每一帧都是时间 t 的纯函数：?p3it=秒 冻结时间截帧；?p3intro=1 强制再播。three r186 本地（ludoterra/vendor/r186，MIT）。代码为本项目自写。 */
import { pickTier, save, lower, SLOW, toast } from './p3tier.js';
const DUR = 6, TAU = Math.PI * 2;
const cl = x => x < 0 ? 0 : x > 1 ? 1 : x;
const lin = (a, b, x) => cl((x - a) / (b - a));
const sm = (a, b, x) => { const s = lin(a, b, x); return s * s * (3 - 2 * s); };
const eo = x => 1 - Math.pow(1 - cl(x), 3), ei = x => Math.pow(cl(x), 3);
const mix = (a, b, k) => a + (b - a) * k;
const h1 = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const MONO = 'ui-monospace,SFMono-Regular,Menlo,Consolas,"DejaVu Sans Mono","Liberation Mono",monospace';
const HEAVY = '"Arial Black","Helvetica Neue","Segoe UI Black",Arial,"DejaVu Sans",sans-serif';

/* 八芒星：竖向尖 1.0、横向 0.86、斜向 0.5，凹点 0.24（顺时针，从正上开始） */
const STAR = (() => { const R = [1, .5, .86, .5, 1, .5, .86, .5], p = [];
  for (let k = 0; k < 8; k++) { const a = Math.PI / 2 - k * Math.PI / 4, b = a - Math.PI / 8;
    p.push([R[k] * Math.cos(a), R[k] * Math.sin(a)], [.24 * Math.cos(b), .24 * Math.sin(b)]); }
  return p; })();
/* 北斗：摇光 开阳 玉衡 天权 天枢 天璇 天玑（单位同星），7 段连线 = 七色光桥 */
const DIP = [[-.95, .55], [-.5, .42], [-.25, .22], [.02, .03], [.6, -.04], [.53, -.33], [.1, -.27]];
const DSEG = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 3]];
const RAINBOW = [[1, .22, .25], [1, .55, .12], [1, .9, .2], [.25, 1, .4], [.15, .9, 1], [.3, .45, 1], [.7, .3, 1]];
const DIPK = .28; // 收拢后的北斗缩放（光桥在星核内）

function viewH(asp) { return Math.max(2 / .62, (1.72 / .86) / asp); }

let RUN = null;
export function play(opts) {
  if (RUN) return RUN;
  opts = opts || {};
  const q = location.search, en = window.GN_LANG === 'en';
  const mt = /[?&]p3it=([\d.]+)/.exec(q), frozen = mt ? Math.min(DUR - .01, +mt[1]) : null;
  const pk = pickTier(); let tierName = pk.tier; const gpu = pk.gpu;
  try { sessionStorage.setItem('gn:portal:p3intro', '1'); } catch (e) {}

  /* ---------- DOM ---------- */
  const st = document.createElement('style');
  st.textContent = `#p3intro{position:fixed;inset:0;z-index:90;background:#030407;overflow:hidden;cursor:pointer;opacity:1;transition:opacity .45s ease}
#p3intro canvas{position:absolute;inset:0;width:100%;height:100%;display:block}#p3intro .gl{opacity:0}
#p3intro .sub{position:absolute;left:0;right:0;text-align:center;color:#e8ecff;font:400 clamp(14px,1.9vw,22px)/1.4 system-ui,"PingFang SC","Microsoft YaHei",sans-serif;letter-spacing:.32em;text-shadow:0 0 18px rgba(150,120,255,.7),0 2px 10px rgba(0,0,0,.8);opacity:0;pointer-events:none;padding:0 16px}
#p3intro .ctl{position:absolute;right:calc(18px + env(safe-area-inset-right));bottom:calc(18px + env(safe-area-inset-bottom));display:flex;gap:8px;align-items:center}
#p3intro .qm{position:absolute;right:0;bottom:calc(100% + 8px);display:none;flex-direction:column;gap:4px;padding:6px;border:1px solid rgba(220,228,255,.3);border-radius:12px;background:rgba(6,8,16,.82);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px)}
#p3intro .qm.on{display:flex}
#p3intro .qm button{padding:6px 14px;border:1px solid transparent;border-radius:999px;background:none;color:#dfe5f7;font:12px/1 ${MONO};letter-spacing:.12em;cursor:pointer;text-align:left;white-space:nowrap}
#p3intro .qm button[aria-checked=true]{border-color:rgba(220,228,255,.55);color:#fff}
#p3intro .qm button:hover,#p3intro .qm button:focus-visible{background:rgba(220,228,255,.12);outline:none}
#p3intro .p3qt{position:absolute;left:50%;bottom:calc(64px + env(safe-area-inset-bottom));transform:translateX(-50%);padding:6px 14px;border-radius:999px;background:rgba(6,8,16,.7);border:1px solid rgba(220,228,255,.3);color:#dfe5f7;font:12px/1.3 system-ui,"PingFang SC","Microsoft YaHei",sans-serif;letter-spacing:.06em;white-space:nowrap;opacity:0;transition:opacity .6s ease;pointer-events:none}
#p3intro .p3qt.on{opacity:1}
#p3intro .sk{position:relative;padding:8px 16px;border:1px solid rgba(220,228,255,.4);border-radius:999px;background:rgba(6,8,16,.45);color:#dfe5f7;font:12px/1 ${MONO};letter-spacing:.18em;cursor:pointer;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px)}
#p3intro .sk:hover,#p3intro .sk:focus-visible{border-color:#fff;color:#fff;outline:none}`;
  document.head.appendChild(st);
  let root = document.getElementById('p3intro');
  if (!root) { root = document.createElement('div'); root.id = 'p3intro'; document.body.appendChild(root); }
  root.removeAttribute('style'); root.setAttribute('role', 'presentation');
  let glc = document.createElement('canvas'); glc.className = 'gl';
  const c2 = document.createElement('canvas');
  const sub = document.createElement('div'); sub.className = 'sub'; sub.textContent = en ? 'Master a world, then build one' : '玩懂一个世界，再亲手造一个';
  const skip = document.createElement('button'); skip.type = 'button'; skip.className = 'sk'; skip.textContent = en ? 'Skip ›' : '跳过 ›'; skip.setAttribute('aria-label', en ? 'Skip intro' : '跳过开场动画');
  const QL = en ? { high: 'High', medium: 'Medium', low: 'Low' } : { high: '高', medium: '中', low: '低' };
  const QS = en ? { high: 'H', medium: 'M', low: 'L' } : QL;
  const ctl = document.createElement('div'); ctl.className = 'ctl';
  const qb = document.createElement('button'); qb.type = 'button'; qb.className = 'sk qb'; qb.setAttribute('aria-haspopup', 'menu'); qb.setAttribute('aria-expanded', 'false');
  const qm = document.createElement('div'); qm.className = 'qm'; qm.setAttribute('role', 'menu');
  ['high', 'medium', 'low'].forEach(n => { const o = document.createElement('button'); o.type = 'button'; o.dataset.q = n; o.setAttribute('role', 'menuitemradio'); o.textContent = QL[n]; qm.appendChild(o); });
  function qLabel() { qb.textContent = (en ? 'Quality ' : '画质 ') + QS[tierName]; qb.setAttribute('aria-label', (en ? 'Quality: ' : '画质：') + QL[tierName]);
    qm.querySelectorAll('button').forEach(o => o.setAttribute('aria-checked', String(o.dataset.q === tierName))); }
  qb.addEventListener('click', e => { e.stopPropagation(); const on = !qm.classList.contains('on'); qm.classList.toggle('on', on); qb.setAttribute('aria-expanded', String(on)); });
  qm.addEventListener('click', e => { e.stopPropagation(); const n = e.target && e.target.dataset && e.target.dataset.q; if (!n) return;
    qm.classList.remove('on'); qb.setAttribute('aria-expanded', 'false'); save(n); setTier(n, false); });
  skip.addEventListener('click', e => { e.stopPropagation(); end(true); });
  ctl.append(qm, qb, skip); qLabel();
  root.append(glc, c2, sub, ctl);
  const ctx = c2.getContext('2d');

  /* ---------- 尺寸 / 投影（2D 与 3D 同一相机：fov 35°，星在 z=0 平面） ---------- */
  const G = {};
  let titleCv = null, titleR = null, titleC = null;
  function resize() {
    const W = innerWidth, H = innerHeight, d = Math.min(devicePixelRatio || 1, 2);
    c2.width = Math.round(W * d); c2.height = Math.round(H * d);
    Object.assign(G, { W, H, d, cx: W / 2, cy: H / 2, vh: viewH(W / H) }); G.s = H / G.vh;
    G.fs = Math.min(W * .84 / 7.3, H * .17);           // 标题字号（约 7.3 个字宽）
    sub.style.top = (G.cy + G.fs * .62 + 16) + 'px';
    titleCv = makeTitle(W, H, Math.min(d, 1.5));
    if (lowFx) lowFx.resize();
    if (GLX) GLX.resize();
  }
  const P = (x, y, k = 1) => [G.cx + x * G.s * k, G.cy - y * G.s * k];

  function makeTitle(W, H, d) {
    const c = document.createElement('canvas'); c.width = Math.round(W * d); c.height = Math.round(H * d);
    const x = c.getContext('2d'); x.scale(d, d);
    x.font = `900 ${G.fs}px ${HEAVY}`; x.textAlign = 'center'; x.textBaseline = 'middle';
    try { x.letterSpacing = (G.fs * .02) + 'px'; } catch (e) {}
    const tw = x.measureText('GENESIS 3.0').width; if (tw > W * .9) { G.fs *= W * .9 / tw; x.font = `900 ${G.fs}px ${HEAVY}`; sub.style.top = (G.cy + G.fs * .62 + 16) + 'px'; }
    x.shadowColor = 'rgba(150,110,255,.9)'; x.shadowBlur = G.fs * .5; x.fillStyle = 'rgba(255,255,255,.55)'; x.fillText('GENESIS 3.0', W / 2, H / 2);
    x.shadowBlur = G.fs * .12; x.shadowColor = 'rgba(120,220,255,.8)'; x.fillStyle = '#fff'; x.fillText('GENESIS 3.0', W / 2, H / 2);
    x.shadowBlur = 0; x.fillText('GENESIS 3.0', W / 2, H / 2);
    // 低档 RGB 错位用的两张染色副本
    const tint = col => { const t = document.createElement('canvas'); t.width = c.width; t.height = c.height; const y = t.getContext('2d');
      y.drawImage(c, 0, 0); y.globalCompositeOperation = 'source-in'; y.fillStyle = col; y.fillRect(0, 0, t.width, t.height); return t; };
    titleR = tint('#ff2a6a'); titleC = tint('#22e6ff');
    return c;
  }

  /* ---------- 2D：蓝图描线（所有档位的 0–2.5s） ---------- */
  function seg(x1, y1, x2, y2) { ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); }
  function grid(a) {
    if (a <= 0) return;
    const { W, H, cx, cy } = G, m = 32;
    ctx.lineWidth = 1; ctx.beginPath();
    for (let x = cx % m; x < W; x += m) seg(x + .5, 0, x + .5, H);
    for (let y = cy % m; y < H; y += m) seg(0, y + .5, W, y + .5);
    ctx.strokeStyle = `rgba(150,165,190,${.045 * a})`; ctx.stroke();
    ctx.beginPath(); const M = m * 4;
    for (let x = cx % M; x < W; x += M) seg(x + .5, 0, x + .5, H);
    for (let y = cy % M; y < H; y += M) seg(0, y + .5, W, y + .5);
    ctx.strokeStyle = `rgba(160,175,200,${.07 * a})`; ctx.stroke();
    ctx.beginPath();
    for (let x = cx % M; x < W; x += M) for (let y = cy % M; y < H; y += M) { seg(x - 3, y + .5, x + 4, y + .5); seg(x + .5, y - 3, x + .5, y + 4); }
    ctx.strokeStyle = `rgba(210,220,240,${.22 * a})`; ctx.stroke();
  }
  function sparkle(x, y, r, a, col) {
    if (a <= 0) return;
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(x, y, 0, x, y, r * 4);
    g.addColorStop(0, `rgba(255,255,255,${a})`); g.addColorStop(.18, `rgba(${col || '200,215,255'},${a * .55})`); g.addColorStop(1, 'rgba(120,140,255,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 4, 0, TAU); ctx.fill();
    ctx.strokeStyle = `rgba(255,255,255,${a * .7})`; ctx.lineWidth = 1; ctx.beginPath();
    seg(x - r * 6, y, x + r * 6, y); seg(x, y - r * 6, x, y + r * 6); ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';
  }
  function pathPart(pts, prog, k, close) {
    const n = pts.length + (close ? 1 : 0) - 1, L = prog * n; if (L <= 0) return;
    ctx.beginPath(); let p = P(pts[0][0], pts[0][1], k); ctx.moveTo(p[0], p[1]);
    for (let i = 1; i <= n; i++) { const q = pts[i % pts.length], pr = pts[i - 1], f = cl(L - (i - 1)); if (f <= 0) break;
      const a = P(pr[0], pr[1], k), b = P(q[0], q[1], k); ctx.lineTo(mix(a[0], b[0], f), mix(a[1], b[1], f)); }
    ctx.stroke();
  }
  function blueprint(t, A, pct) {
    const { W, H, cx, cy, s } = G;
    ctx.save(); ctx.globalAlpha = A;
    // 四边扫入的定位线
    const p = eo(lin(.05, .6, t)), p2 = eo(lin(.12, .75, t));
    ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(205,215,235,.3)'; ctx.beginPath();
    seg(0, cy, p * cx, cy); seg(W, cy, W - p * cx, cy); seg(cx, 0, cx, p * cy); seg(cx, H, cx, H - p * cy); ctx.stroke();
    ctx.strokeStyle = 'rgba(205,215,235,.13)'; ctx.beginPath();
    for (const [x0, y0] of [[0, 0], [W, 0], [0, H], [W, H]]) seg(x0, y0, mix(x0, cx, p2), mix(y0, cy, p2)); ctx.stroke();
    if (p < 1) for (const [x, y] of [[p * cx, cy], [W - p * cx, cy], [cx, p * cy], [cx, H - p * cy]]) sparkle(x, y, 1.2, .9 * (1 - p));
    // 同心圆（中圈虚线）
    const cp = eo(lin(.2, 1, t));
    [[.62, .12, 0], [1.12, .1, 1], [1.34, .14, 0]].forEach(([r, a, dash]) => {
      ctx.strokeStyle = `rgba(200,210,235,${a})`; ctx.setLineDash(dash ? [3, 6] : []); ctx.beginPath(); ctx.arc(cx, cy, r * s, -Math.PI / 2, -Math.PI / 2 + cp * TAU); ctx.stroke(); });
    ctx.setLineDash([]);
    ctx.strokeStyle = 'rgba(220,228,245,.5)'; ctx.beginPath();
    for (const [x, y] of [[cx - 1.34 * s, cy], [cx + 1.34 * s, cy], [cx, cy - 1.34 * s], [cx, cy + 1.34 * s]]) { seg(x - 5, y, x + 6, y); seg(x, y - 5, x, y + 6); }
    if (cp > .5) ctx.stroke();
    // 北斗：逐颗点亮、逐段连线，随后收拢进星核
    const col = sm(.95, 1.4, t), kb = Math.min(1, G.W * .46 / (.95 * s)), k = mix(kb, DIPK, eo(col)), da = mix(1, .75, col);
    ctx.strokeStyle = `rgba(240,244,255,${.85 * da})`; ctx.lineWidth = 1.3;
    DSEG.forEach(([i, j], n) => { const f = lin(.42 + n * .065, .52 + n * .065, t); if (f <= 0) return;
      const a = P(DIP[i][0], DIP[i][1], k), b = P(DIP[j][0], DIP[j][1], k);
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(mix(a[0], b[0], f), mix(a[1], b[1], f)); ctx.stroke(); });
    DIP.forEach((d, n) => { const f = sm(.3 + n * .05, .4 + n * .05, t), q = P(d[0], d[1], k);
      sparkle(q[0], q[1], mix(2.6, 1.6, col) * (1 + .6 * Math.max(0, 1 - Math.abs(t - .35 - n * .05) * 8)), f * da); });
    // 八芒星线框（双线）+ 中心棱线
    const op = lin(.85, 1.35, t);
    ctx.lineWidth = 1.2; ctx.strokeStyle = 'rgba(235,240,255,.9)'; pathPart(STAR, op, 1, true);
    ctx.lineWidth = .8; ctx.strokeStyle = 'rgba(220,228,250,.55)'; pathPart(STAR, op, .955, true);
    const rf = lin(1.1, 1.45, t);
    if (rf > 0) { ctx.strokeStyle = 'rgba(225,232,255,.35)'; ctx.beginPath();
      for (let i = 0; i < 16; i++) { const a = P(STAR[i][0], STAR[i][1]); seg(cx, cy, mix(cx, a[0], rf), mix(cy, a[1], rf)); } ctx.stroke(); }
    for (let i = 0; i < 16; i += 2) { const f = 1 - Math.abs(op * 16 - i) / 1.5; if (f > 0) { const a = P(STAR[i][0], STAR[i][1]); sparkle(a[0], a[1], 1.4, f); } }
    // 底部 LOADING
    const la = sm(.15, .45, t) * (1 - sm(1.5, 1.9, t));
    if (la > 0) {
      const fsz = W < 520 ? 10 : 11; ctx.font = `${fsz}px ${MONO}`; try { ctx.letterSpacing = (W < 520 ? 1 : 2.5) + 'px'; } catch (e) {}
      const txt = `GENESIS 3.0 · ${en ? 'FROM PLAY TO BUILD' : '从玩到造'} · LOADING ${String(pct).padStart(2, '0')}%`;
      const tw = ctx.measureText(txt).width, y = H - Math.max(44, H * .1);
      ctx.fillStyle = `rgba(215,222,238,${.8 * la})`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, cx, y);
      ctx.strokeStyle = `rgba(200,210,230,${.3 * la})`; ctx.beginPath(); seg(24, y, cx - tw / 2 - 14, y); seg(cx + tw / 2 + 14, y, W - 24, y); ctx.stroke();
      try { ctx.letterSpacing = '0px'; } catch (e) {}
    }
    ctx.restore();
  }
  function hud(t, a) {
    if (a <= 0) return;
    const { W, H } = G, sz = W < 520 ? 9.5 : 10.5;
    ctx.save(); ctx.font = `${sz}px ${MONO}`; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; try { ctx.letterSpacing = '1.5px'; } catch (e) {}
    const L = [`GENESIS 3.0 // ${GLX ? 'WEBGL' : 'CANVAS'} EXPERIENCE`, en ? 'GENESIS PROJECT · FROM PLAY TO BUILD' : '创世计划 · 从玩到造', `BUILD 3.0.0 · T+${t.toFixed(2)}`];
    L.forEach((s, i) => { const n = Math.floor(s.length * lin(.15 + i * .12, .5 + i * .12, t)); ctx.fillStyle = `rgba(220,226,240,${.6 * a})`; ctx.fillText(s.slice(0, n), 22, 20 + i * (sz + 7)); });
    ctx.strokeStyle = `rgba(220,226,240,${.35 * a})`; ctx.lineWidth = 1; ctx.beginPath();
    for (const [x, y] of [[14, H - 14], [W - 14, 14]]) { seg(x - 6, y, x + 6, y); seg(x, y - 6, x, y + 6); } ctx.stroke();
    ctx.restore();
  }

  /* ---------- 低档：纯 2D 的 1.5–6s ---------- */
  let lowFx = null;
  function makeLow() {
    const B = document.createElement('canvas'), b = B.getContext('2d'), N = document.createElement('canvas');
    const o = {
      resize() { B.width = c2.width; B.height = c2.height;
        const w = N.width = Math.max(64, Math.round(G.W / 4)), hh = N.height = Math.max(64, Math.round(G.H / 4)), n = N.getContext('2d');
        n.fillStyle = '#05030c'; n.fillRect(0, 0, w, hh); n.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 90; i++) { const x = h1(i) * w, y = h1(i + 50) * hh, r = (.08 + .22 * h1(i + 9)) * Math.max(w, hh), k = x / w;
          const c = [mix(150, 20, k), mix(40, 150, k), mix(255, 255, k)], g = n.createRadialGradient(x, y, 0, x, y, r);
          g.addColorStop(0, `rgba(${c.map(Math.round)},${.05 + .09 * h1(i + 3)})`); g.addColorStop(1, 'rgba(0,0,0,0)'); n.fillStyle = g; n.fillRect(0, 0, w, hh); }
        for (let i = 0; i < 260; i++) { n.fillStyle = `rgba(230,235,255,${.3 + .7 * h1(i + 400)})`; n.fillRect(h1(i + 200) * w, h1(i + 300) * hh, .5, .5); }
      },
      draw(t) {
        const { W, H, cx, cy, s, d } = G;
        b.setTransform(d, 0, 0, d, 0, 0); b.globalAlpha = 1; b.globalCompositeOperation = 'source-over';
        b.fillStyle = '#030407'; b.fillRect(0, 0, W, H);
        const neb = sm(2.5, 2.9, t), pz = Math.pow(lin(5, 5.8, t), 1.6), push = pz, zoom = (1 + .05 * sm(3.5, 5, t)) / Math.max(.06, 1 - .94 * pz);
        if (neb > 0) {   // 星云 + 格子墙 + 淡字带
          b.globalAlpha = neb; const z = 1 + .04 * sm(2.5, 5, t) + push * .3;
          b.drawImage(N, cx - W * z / 2, cy - H * z / 2, W * z, H * z);
          const ts = H / 5.5; b.lineWidth = 2; b.strokeStyle = 'rgba(0,0,0,.55)'; b.beginPath();
          for (let x = cx % ts; x < W; x += ts) { b.moveTo(x, 0); b.lineTo(x, H); } for (let y = cy % ts; y < H; y += ts) { b.moveTo(0, y); b.lineTo(W, y); } b.stroke();
          b.font = `900 ${H * .2}px ${HEAVY}`; b.textBaseline = 'middle'; b.fillStyle = 'rgba(190,200,255,.07)';
          const word = 'GENESIS  ', ww = b.measureText(word).width;
          for (let r = 0; r < 4; r++) { const y = H * (.14 + r * .245), off = ((r % 2 ? 1 : -1) * (t - 2.5) * 22 * (1 + r * .3)) % ww;
            for (let x = -ww + off - (r * 97) % ww; x < W + ww; x += ww) b.fillText(word, x, y); }
          b.globalAlpha = 1;
        }
        // 玻璃星（扫描显形）+ 七色光桥
        const rev = mix(-1.05, 1.05, sm(1.5, 2.15, t));
        b.save(); b.translate(cx, cy); b.scale(zoom, zoom); b.translate(-cx, -cy);
        const ry = cy - rev * s; b.beginPath(); b.rect(0, ry, W, H); b.clip();
        const L = [-.45, .6, .66], ln = Math.hypot(...L), dz = .3;
        for (let i = 0; i < 16; i++) { const A = STAR[i], Bp = STAR[(i + 1) % 16];
          const nx = A[1] * dz - dz * Bp[1], ny = dz * Bp[0] - A[0] * dz, nz = A[0] * Bp[1] - A[1] * Bp[0], nl = Math.hypot(nx, ny, nz);
          const sh = .5 + .5 * Math.abs(nx * L[0] + ny * L[1] + nz * L[2]) / nl / ln * (nz < 0 ? -1 : 1), k = cl((A[0] + Bp[0]) * .5 + .5);
          const pa = P(A[0], A[1]), pb = P(Bp[0], Bp[1]), mx = (pa[0] + pb[0]) / 2, my = (pa[1] + pb[1]) / 2;
          const g = b.createLinearGradient(cx, cy, mx, my);
          const c0 = [mix(200, 150, k), mix(170, 220, k), 255], c1 = [mix(70, 20, k) + 90 * sh, mix(30, 90, k) + 70 * sh, mix(160, 170, k) + 60 * sh];
          g.addColorStop(0, `rgba(${c0.map(Math.round)},${.9})`); g.addColorStop(1, `rgba(${c1.map(Math.round)},${.55 + .3 * sh})`);
          b.fillStyle = g; b.beginPath(); b.moveTo(cx, cy); b.lineTo(pa[0], pa[1]); b.lineTo(pb[0], pb[1]); b.closePath(); b.fill(); }
        b.globalCompositeOperation = 'lighter'; b.lineWidth = 1.2; b.strokeStyle = 'rgba(230,236,255,.75)'; b.beginPath();
        STAR.forEach((p, i) => { const q = P(p[0], p[1]); i ? b.lineTo(q[0], q[1]) : b.moveTo(q[0], q[1]); }); b.closePath();
        for (let i = 0; i < 16; i++) { const q = P(STAR[i][0], STAR[i][1]); b.moveTo(cx, cy); b.lineTo(q[0], q[1]); } b.stroke();
        b.restore(); b.save(); b.translate(cx, cy); b.scale(zoom, zoom); b.translate(-cx, -cy); b.globalCompositeOperation = 'lighter';
        if (rev < 1.04) { const hw = s * Math.sqrt(Math.max(0, 1.1 - rev * rev)); b.fillStyle = 'rgba(200,215,255,.9)'; b.fillRect(cx - hw, ry - 1, 2 * hw, 2); }
        DSEG.forEach(([i, j], n) => { const f = sm(1.72 + n * .065, 1.84 + n * .065, t); if (f <= 0) return; const c = RAINBOW[n].map(v => Math.round(v * 255));
          const a = P(DIP[i][0], DIP[i][1], DIPK), q = P(DIP[j][0], DIP[j][1], DIPK);
          b.strokeStyle = `rgba(${c},${f})`; b.shadowColor = `rgb(${c})`; b.shadowBlur = 12; b.lineWidth = 2.2; b.beginPath(); b.moveTo(a[0], a[1]); b.lineTo(q[0], q[1]); b.stroke(); });
        b.shadowBlur = 0;
        const core = sm(1.6, 2.3, t) * (1 + .3 * Math.sin(t * 5)) + push * 3, cg = b.createRadialGradient(cx, cy, 0, cx, cy, s * .7);
        cg.addColorStop(0, `rgba(235,225,255,${cl(.55 * core)})`); cg.addColorStop(.3, `rgba(150,110,255,${cl(.22 * core)})`); cg.addColorStop(1, 'rgba(60,40,160,0)');
        b.fillStyle = cg; b.fillRect(cx - s, cy - s, 2 * s, 2 * s);
        b.restore();
        // 标题（RGB 错位）
        const ta = titleA(t), tsc = titleS(t), g = glitch(t), seed = Math.floor(t * 24);
        if (ta > 0) { b.save(); b.globalAlpha = ta; b.translate(cx, cy); b.scale(tsc, tsc); b.translate(-cx, -cy);
          const dx = (3 + 26 * g) * (h1(seed) - .3);
          b.globalCompositeOperation = 'lighter'; b.drawImage(titleR, -dx, 0, W, H); b.drawImage(titleC, dx, 0, W, H);
          b.globalCompositeOperation = 'source-over'; b.drawImage(titleCv, 0, 0, W, H); b.restore(); }
        b.globalAlpha = 1; b.globalCompositeOperation = 'source-over';
        const fl = flash(t) + .9 * sm(5.55, 5.85, t); if (fl > 0) { b.fillStyle = `rgba(240,236,255,${cl(fl)})`; b.fillRect(0, 0, W, H); }
        // 输出：切片错位
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        if (g <= .02) { ctx.drawImage(B, 0, 0); return; }
        const rows = 14 + Math.floor(h1(seed + 7) * 30), rh = B.height / rows;
        for (let r = 0; r < rows; r++) { const k = h1(r * 1.7 + seed * 3.1), off = k < g * .7 ? (h1(r + seed * 5.3) - .5) * .14 * g * B.width : 0;
          ctx.drawImage(B, 0, r * rh, B.width, rh + 1, off, r * rh, B.width, rh + 1); }
        for (let i = 0; i < 6 * g; i++) { const y = h1(seed * 9 + i) * B.height, w = h1(seed + i * 3) * B.width * .4;
          ctx.fillStyle = i % 2 ? 'rgba(34,230,255,.55)' : 'rgba(255,42,106,.5)'; ctx.fillRect(h1(i + seed) * B.width, y, w, 2 + 4 * h1(i * 7)); }
      }
    };
    return o;
  }

  /* ---------- 时间曲线（2D/3D 共用） ---------- */
  function glitch(t) { return Math.max(t >= 2.47 && t < 3.5 ? (t < 2.6 ? lin(2.47, 2.6, t) : .15 + .85 * Math.exp(-(t - 2.6) * 6)) * (1 - sm(3.2, 3.5, t)) : 0,
    t > 3.95 && t < 4.04 ? .5 : 0, t > 4.6 && t < 4.66 ? .35 : 0, t > 5 && t < 5.1 ? .45 : 0); }
  function flash(t) { return t < 2.47 ? .25 * Math.max(0, 1 - Math.abs(t - 1.52) * 10) : t < 2.52 ? lin(2.47, 2.52, t) : Math.exp(-(t - 2.52) * 11); }
  function titleA(t) { return sm(2.5, 2.56, t) * (1 - sm(5.0, 5.4, t)); }
  function titleS(t) { return t < 5 ? 1 + .55 * Math.exp(-Math.max(0, t - 2.52) * 9) : 1 + .4 * ei(lin(5, 5.4, t)); }

  /* ---------- WebGL（中/高档） ---------- */
  let GLX = null, TM = null, glState = tierName === 'low' ? 'off' : 'loading';
  if (glState === 'loading') {
    import('../ludoterra/vendor/r186/three.module.min.js').then(T => { TM = T; if (dead || tierName === 'low') return; try { GLX = makeGL(T, tierName === 'high'); GLX.resize(); glState = 'ready'; } catch (e) { console.warn('p3intro gl', e); GLX = null; glState = 'off'; lowFx = makeLow(); lowFx.resize(); } })
      .catch(() => { glState = 'off'; lowFx = makeLow(); lowFx.resize(); });
  } else lowFx = makeLow();

  function makeGL(THREE, hi) {
    const TT = hi ? { budget: 2.4e6, dpr: 2, msaa: 4, mips: 6, oct: 5 } : { budget: 1.4e6, dpr: 1.5, msaa: 0, mips: 5, oct: 4 };
    const R = new THREE.WebGLRenderer({ canvas: glc, antialias: false, alpha: false, stencil: false, powerPreference: 'high-performance' });
    if (!R.capabilities.isWebGL2) throw new Error('no webgl2');
    R.setClearColor(0x030407, 1); R.toneMapping = THREE.NoToneMapping;
    const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(35, 1, .01, 50);
    const fs = new THREE.PlaneGeometry(2, 2);
    // 淡字带纹理（横向可无缝平铺）
    const bc = document.createElement('canvas'), bx = bc.getContext('2d'); bx.font = `900 180px ${HEAVY}`;
    const bw = Math.ceil(bx.measureText('GENESIS ').width); bc.width = bw; bc.height = 220;
    bx.font = `900 180px ${HEAVY}`; bx.textBaseline = 'middle'; bx.fillStyle = '#fff'; bx.fillText('GENESIS ', 0, 116);
    const bandTex = new THREE.CanvasTexture(bc); bandTex.wrapS = THREE.RepeatWrapping;
    const NOISE = `float h21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h21(i),h21(i+vec2(1,0)),f.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float a=.5,s=0.;mat2 r=mat2(.8,.6,-.6,.8);for(int i=0;i<${TT.oct};i++){s+=a*vn(p);p=r*p*2.03+11.7;a*=.5;}return s;}`;
    const U = { uT: { value: 0 }, uAsp: { value: 1 }, uNeb: { value: 0 }, uZ: { value: 1 }, tBand: { value: bandTex }, uBandAsp: { value: bw / 220 } };
    const bg = new THREE.Mesh(fs, new THREE.ShaderMaterial({ uniforms: U, depthWrite: false, depthTest: false,
      vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,.9999,1.);}',
      fragmentShader: `varying vec2 vUv;uniform float uT,uAsp,uNeb,uZ,uBandAsp;uniform sampler2D tBand;${NOISE}
void main(){ if(uNeb<=0.){gl_FragColor=vec4(.0012,.0016,.0024,1.);return;}
 vec2 p=(vUv-.5)*vec2(uAsp,1.)/uZ; float sx=p.x/max(uAsp*.5,.4);
 float side=smoothstep(-.75,.75,sx+.25*(fbm(p*1.5+3.)-.5));
 vec3 cA=vec3(.42,.08,1.),cB=vec3(.02,.5,1.),tint=mix(cA,cB,side);
 vec2 q=p*2.1+vec2(uT*.015,0.); float w=fbm(q*1.3-uT*.01); float n=fbm(q+w*1.4), n2=fbm(q*3.3+7.+w);
 vec3 neb=tint*(pow(n,3.)*2.4+pow(n2,5.)*2.+.03);
 neb+=mix(vec3(.9,.5,1.),vec3(.5,.95,1.),side)*pow(max(0.,1.-abs(n2-.55)*5.),3.)*.25*n;
 vec2 sg=p*90.; float sr=h21(floor(sg)); neb+=vec3(.85,.9,1.)*step(.99,sr)*smoothstep(.12,.0,length(fract(sg)-.5-(vec2(h21(floor(sg)+1.),h21(floor(sg)+2.))-.5)*.6))*(1.5+sin(uT*3.+sr*40.));
 float ts=1./5.5; vec2 tg=p/ts+vec2(0.,.5); vec2 fi=fract(tg)-.5; vec2 id=floor(tg);
 float e=max(abs(fi.x),abs(fi.y)); float groove=smoothstep(.5,.475,e);
 float bev=smoothstep(.43,.49,e)*step(0.,fi.y-fi.x)*.6;
 vec3 col=neb*mix(.1,.62+.3*h21(id+3.),groove)+tint*bev*.1; col*=mix(.4,1.,smoothstep(.05,.75,length(p*vec2(.8,1.))));
 float rowH=.245; float ry=(p.y+.06)/rowH; float row=floor(ry); float v=fract(ry);
 float dir=mod(row,2.)<1.?1.:-1.; float u=p.x/(rowH*uBandAsp)+dir*uT*(.035+.012*abs(row))+row*.37;
 float txt=texture2D(tBand,vec2(u,v)).a;
 col=col*(1.-txt*.55)+tint*txt*.04;
 col+=vec3(.5,.36,1.)*.06*exp(-length(p)*1.8);
 gl_FragColor=vec4(col*uNeb,1.);}` }));
    bg.frustumCulled = false; bg.renderOrder = -10; scene.add(bg);

    // 八芒星几何（非索引，平面法线）
    const dz = .3, pos = [];
    for (let i = 0; i < 16; i++) { const a = STAR[i], b = STAR[(i + 1) % 16]; pos.push(0, 0, dz, b[0], b[1], 0, a[0], a[1], 0, 0, 0, -dz, a[0], a[1], 0, b[0], b[1], 0); }
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); sg.computeVertexNormals();
    const uRev = { value: -2 }, uCore = { value: 0 }, uLum = { value: 0 };
    const ENV = `vec3 env(vec3 d){vec3 c=mix(vec3(.5,.12,1.),vec3(.04,.55,1.),smoothstep(-.7,.7,d.x))*(.15+.6*smoothstep(-.4,.9,d.y));
 c+=vec3(5.)*smoothstep(.93,.985,dot(d,normalize(vec3(.6,.75,.5))))+vec3(3.)*smoothstep(.9,.98,dot(d,normalize(vec3(-.8,.3,.6))));return c;}`;
    let glass = null;
    if (hi) {
      // 程序化环境：紫/青渐变球 + 几条亮灯带 → PMREM
      const es = new THREE.Scene();
      es.add(new THREE.Mesh(new THREE.SphereGeometry(10, 32, 16), new THREE.ShaderMaterial({ side: THREE.BackSide,
        vertexShader: 'varying vec3 vD;void main(){vD=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
        fragmentShader: 'varying vec3 vD;void main(){vec3 c=mix(vec3(.5,.12,1.),vec3(.04,.55,1.),smoothstep(-.7,.7,vD.x));gl_FragColor=vec4(c*(.15+.5*smoothstep(-.4,.9,vD.y)),1.);}' })));
      [[4, 5, 4, 9], [-5, 2, 3, 6], [1, -4, 5, 3.5], [-2, 6, -3, 4], [5, -1, 2, 5]].forEach(([x, y, z, k]) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(4, .6), new THREE.MeshBasicMaterial({ color: new THREE.Color(k, k, k * 1.05), side: THREE.DoubleSide }));
        m.position.set(x, y, z); m.lookAt(0, 0, 0); es.add(m); });
      const pm = new THREE.PMREMGenerator(R), env = pm.fromScene(es, .02); scene.environment = env.texture; pm.dispose();
      glass = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(.88, .82, 1), metalness: 0, roughness: .04, transmission: .7, thickness: 1.6, ior: 1.7,
        dispersion: 6, iridescence: .9, iridescenceIOR: 1.3, attenuationColor: new THREE.Color(.62, .45, 1), attenuationDistance: 2.6, envMapIntensity: 2.2, specularIntensity: 1 });
      glass.onBeforeCompile = sh => {
        sh.uniforms.uRev = uRev; sh.uniforms.uCore = uCore;
        sh.vertexShader = 'varying vec3 vLp;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvLp=position;');
        const a = '#include <clipping_planes_fragment>', b = '#include <tonemapping_fragment>';
        if (sh.fragmentShader.indexOf(a) < 0 || sh.fragmentShader.indexOf(b) < 0) console.warn('patch miss', 'p3intro glass');
        sh.fragmentShader = 'uniform float uRev,uCore;varying vec3 vLp;\n' + ENV + '\n' + sh.fragmentShader.replace(a, a + '\nif(vLp.y>uRev)discard;')
          .replace(b, 'float ndv=abs(dot(normalize(normal),normalize(vViewPosition)));float frs=pow(1.-ndv,2.5);gl_FragColor.rgb*=mix(.5,1.3,pow(ndv,2.));vec3 Vv=normalize(vViewPosition),Nn=normalize(normal);gl_FragColor.rgb+=env(reflect(-Vv,Nn))*clamp((.04+.96*pow(1.-ndv,5.))*1.6+.1,0.,1.)*.7+vec3(.3,.22,.6)*.3+vec3(.5,.4,1.)*frs*.8+vec3(.6,.7,1.)*5.*smoothstep(.07,0.,uRev-vLp.y)+vec3(.7,.55,1.)*uCore*.18*exp(-length(vLp.xy)*6.);\n' + b);
      };
    }
    {
      var fake = new THREE.ShaderMaterial({ uniforms: { uRev, uCore, uLum, uA: { value: hi ? .6 : 1 } }, transparent: true, depthWrite: false,
        vertexShader: 'varying vec3 vN,vW,vLp;void main(){vLp=position;vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;vN=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*viewMatrix*w;}',
        fragmentShader: `varying vec3 vN,vW,vLp;uniform float uRev,uCore,uA,uLum;
${ENV}
void main(){ if(vLp.y>uRev)discard; vec3 N=normalize(vN),V=normalize(cameraPosition-vW); if(!gl_FrontFacing)N=-N; float c=max(dot(N,V),0.);
 float F=.04+.96*pow(1.-c,5.); vec3 refl=env(reflect(-V,N)); vec3 rr=refract(-V,N,.66);
 vec3 body=env(rr)*.55+vec3(.22,.14,.5)*.5; vec3 ir=.5+.5*cos(6.2831*(c*1.7+vec3(0.,.33,.67)));
 vec3 col=mix(body,refl,clamp(F*1.6+.1,0.,1.))+ir*.12+vec3(.7,.55,1.)*uCore*.6*exp(-length(vLp.xy)*3.5);
 col+=vec3(.6,.7,1.)*5.*smoothstep(.07,0.,uRev-vLp.y)+vec3(.55,.45,1.)*uLum*(.2+1.*exp(-length(vLp.xy)*2.6))*(.15+1.25*pow(max(dot(N,normalize(vec3(-.55,.6,.55))),0.),2.));
 gl_FragColor=vec4(col,(.62+.35*F)*uA);}` });
      if (!glass) glass = fake;
    }
    const star = new THREE.Group(); scene.add(star);
    const sMesh = new THREE.Mesh(sg, glass); sMesh.renderOrder = 2; star.add(sMesh);
    if (glass !== fake) { const f2 = new THREE.Mesh(sg, fake); f2.renderOrder = 3; star.add(f2); }   // 高档：物理透射打底 + 菲涅尔外壳提亮刻面
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(sg, 1), new THREE.LineBasicMaterial({ color: new THREE.Color(1.6, 1.7, 2.2), transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false }));
    edges.renderOrder = 4; star.add(edges);
    // 七色光桥（不透明 HDR 细管，高档会被玻璃折射）+ 节点辉光
    const bridge = DSEG.map(([i, j], n) => { const a = new THREE.Vector3(DIP[i][0] * DIPK, DIP[i][1] * DIPK, 0), b = new THREE.Vector3(DIP[j][0] * DIPK, DIP[j][1] * DIPK, 0);
      const m = new THREE.Mesh(new THREE.CylinderGeometry(.017, .017, 1, 6, 1), new THREE.MeshBasicMaterial({ color: new THREE.Color(...RAINBOW[n]), transparent: true, depthTest: false, depthWrite: false }));
      m.position.copy(a).add(b).multiplyScalar(.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()); m.userData.len = a.distanceTo(b); m.renderOrder = 6; star.add(m); return m; });
    const gc = document.createElement('canvas'); gc.width = gc.height = 128; const gx = gc.getContext('2d'), gg = gx.createRadialGradient(64, 64, 0, 64, 64, 64);
    gg.addColorStop(0, 'rgba(255,255,255,1)'); gg.addColorStop(.12, 'rgba(255,255,255,.55)'); gg.addColorStop(.4, 'rgba(255,255,255,.12)'); gg.addColorStop(1, 'rgba(255,255,255,0)');
    gx.fillStyle = gg; gx.fillRect(0, 0, 128, 128);
    const gTex = new THREE.CanvasTexture(gc);
    const sprites = DIP.map((d, i) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: gTex, color: new THREE.Color(...RAINBOW[i]), blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false, transparent: true }));
      sp.position.set(d[0] * DIPK, d[1] * DIPK, .02); sp.renderOrder = 7; star.add(sp); return sp; });
    const core = new THREE.Sprite(new THREE.SpriteMaterial({ map: gTex, color: new THREE.Color(.8, .65, 1), blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false, transparent: true }));
    core.renderOrder = 7; star.add(core);

    // 后期：HalfFloat RT → bloom → 合成（AgX/ACES、故障、标题、闪白、暗角、颗粒、sRGB）
    const oc = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), ps = new THREE.Scene(), quad = new THREE.Mesh(fs); quad.frustumCulled = false; ps.add(quad);
    const VS = 'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}';
    const down = new THREE.ShaderMaterial({ uniforms: { tIn: { value: null }, uTx: { value: new THREE.Vector2() }, uK: { value: 0 } }, vertexShader: VS, depthTest: false, depthWrite: false,
      fragmentShader: `varying vec2 vUv;uniform sampler2D tIn;uniform vec2 uTx;uniform float uK;
float kw(vec3 c){return mix(1.,1./(1.+dot(c,vec3(.2126,.7152,.0722))),uK);}
void main(){vec3 a=texture2D(tIn,vUv+uTx*vec2(-1,-1)).rgb,b=texture2D(tIn,vUv+uTx*vec2(1,-1)).rgb,c=texture2D(tIn,vUv+uTx*vec2(-1,1)).rgb,d=texture2D(tIn,vUv+uTx*vec2(1,1)).rgb;
float wa=kw(a),wb=kw(b),wc=kw(c),wd=kw(d);gl_FragColor=vec4(min((a*wa+b*wb+c*wc+d*wd)/(wa+wb+wc+wd),vec3(60.)),1.);}` });
    const up = new THREE.ShaderMaterial({ uniforms: { tLo: { value: null }, tHi: { value: null }, uTx: { value: new THREE.Vector2() } }, vertexShader: VS, depthTest: false, depthWrite: false,
      fragmentShader: `varying vec2 vUv;uniform sampler2D tLo,tHi;uniform vec2 uTx;void main(){vec3 s=vec3(0.);
for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){float w=(x==0?2.:1.)*(y==0?2.:1.);s+=w*texture2D(tLo,vUv+vec2(float(x),float(y))*uTx).rgb;}
gl_FragColor=vec4(mix(texture2D(tHi,vUv).rgb,s/16.,.62),1.);}` });
    const titleTex = new THREE.CanvasTexture(titleCv); titleTex.premultiplyAlpha = true;
    const CU = { tS: { value: null }, tB: { value: null }, tTitle: { value: titleTex }, uG: { value: 0 }, uFlash: { value: 0 }, uTA: { value: 0 }, uTS: { value: 1 }, uBloom: { value: .08 },
      uExp: { value: 1 }, uSeed: { value: 0 }, uT: { value: 0 }, uAsp: { value: 1 } };
    const comp = new THREE.ShaderMaterial({ uniforms: CU, vertexShader: VS, depthTest: false, depthWrite: false,
      fragmentShader: `varying vec2 vUv;uniform sampler2D tS,tB,tTitle;uniform float uG,uFlash,uTA,uTS,uBloom,uExp,uSeed,uT,uAsp;
float hh(float x){return fract(sin(x*127.1+311.7)*43758.5453);}
vec3 aces(vec3 c){const mat3 A=mat3(vec3(.59719,.076,.0284),vec3(.35458,.90834,.13383),vec3(.04823,.01566,.83777));const mat3 B=mat3(vec3(1.60475,-.10208,-.00327),vec3(-.53108,1.10813,-.07276),vec3(-.07367,-.00605,1.07602));
 c=A*(c/.6);vec3 n=c*(c+.0245786)-.000090537,d=c*(.983729*c+.432951)+.238081;return clamp(B*(n/d),0.,1.);}
vec3 agx(vec3 c){const mat3 I=mat3(vec3(.856627,.137319,.111898),vec3(.095121,.761242,.076799),vec3(.048252,.10144,.811302));
 const mat3 O=mat3(vec3(1.127101,-.14133,-.14133),vec3(-.110607,1.157824,-.110607),vec3(-.016494,-.016494,1.251936));
 c=I*c;c=clamp((log2(max(c,1e-10))+12.47393)/16.5,0.,1.);vec3 x2=c*c,x4=x2*x2;
 c=15.5*x4*x2-40.14*x4*c+31.96*x4-6.868*x2*c+.4298*x2+.1191*c-.00232;c=O*c;return clamp(pow(max(c,0.),vec3(2.2)),0.,1.);}
void main(){vec2 uv=vUv;float g=uG;
 float rows=mix(14.,48.,hh(uSeed));float row=floor(uv.y*rows);float r=hh(row*1.7+uSeed*13.);
 float off=r<g*.7?(hh(row+uSeed*5.3)-.5)*.14*g:0.; vec2 u=uv+vec2(off,0.);
 float ca=.0015+.018*g; vec3 col;
 col.r=texture2D(tS,u+vec2(ca,0.)).r;col.g=texture2D(tS,u).g;col.b=texture2D(tS,u-vec2(ca,0.)).b;
 col=mix(col,texture2D(tB,u).rgb,uBloom);
 vec2 q=uv-.5;float vig=1.-.32*dot(q*vec2(uAsp,1.),q*vec2(uAsp,1.))/(.25*(1.+uAsp*uAsp))*2.;
 col*=uExp*max(vig,.35);
 col=mix(aces(col),agx(col),.45);
 vec2 tu=(u-.5)/uTS+.5;float tc=ca*1.6+.002;
 vec4 tg=texture2D(tTitle,tu);vec3 tr=vec3(texture2D(tTitle,tu+vec2(tc,0.)).r,tg.g,texture2D(tTitle,tu-vec2(tc,0.)).b);
 col=col*(1.-tg.a*uTA)+tr*uTA;
 float bk=hh(floor(uv.y*42.)*3.1+floor(uv.x*7.)+uSeed*7.);
 if(bk<g*.07)col=mix(col,hh(bk*91.)>.5?vec3(.13,.9,1.):vec3(1.,.16,.42),.65);
 col=mix(col,vec3(.96,.94,1.),clamp(uFlash,0.,1.));
 float lu=dot(col,vec3(.2126,.7152,.0722));col+=(hh(dot(gl_FragCoord.xy,vec2(.071,.113))+fract(uT*7.))-.5)*.022*mix(.2,1.,smoothstep(.02,.35,lu));
 col=mix(col*12.92,1.055*pow(max(col,0.),vec3(1./2.4))-.055,step(.0031308,col));
 gl_FragColor=vec4(col,1.);}` });
    let rt = null, dn = [], upR = [], bw0 = 1, bh0 = 1;
    function pass(m, tgt) { quad.material = m; R.setRenderTarget(tgt); R.render(ps, oc); }
    const o = {
      resize() {
        const W = G.W, H = G.H, pr = Math.min(devicePixelRatio || 1, TT.dpr, Math.sqrt(TT.budget / (W * H)));
        R.setPixelRatio(pr); R.setSize(W, H, false); cam.aspect = W / H; cam.updateProjectionMatrix();
        U.uAsp.value = CU.uAsp.value = W / H; titleTex.image = titleCv; titleTex.needsUpdate = true;
        const v = new THREE.Vector2(); R.getDrawingBufferSize(v); bw0 = v.x; bh0 = v.y;
        if (rt) rt.dispose(); dn.forEach(x => x.dispose()); upR.forEach(x => x.dispose()); dn = []; upR = [];
        rt = new THREE.WebGLRenderTarget(bw0, bh0, { type: THREE.HalfFloatType, samples: TT.msaa, depthBuffer: true });
        let w = bw0, h = bh0;
        for (let i = 0; i < TT.mips; i++) { w = Math.max(1, w >> 1); h = Math.max(1, h >> 1); const o2 = { type: THREE.HalfFloatType, depthBuffer: false };
          dn.push(new THREE.WebGLRenderTarget(w, h, o2)); if (i < TT.mips - 1) upR.push(new THREE.WebGLRenderTarget(w, h, o2)); }
      },
      render(t) {
        const D = G.vh / 2 / Math.tan(17.5 * Math.PI / 180), push = Math.pow(lin(5, 5.8, t), 1.6);
        const zHold = D * (1 - .1 * sm(2.5, 5, t));
        cam.fov = 35 + 12 * push; cam.updateProjectionMatrix();
        cam.position.set(0, 0, mix(zHold, -.6, push)); cam.lookAt(0, 0, -5);
        const k = t - 1.5, on = sm(1.5, 2.3, t);
        star.rotation.set(.13 * Math.sin(k * .7) * on, (.3 * Math.sin(k * .95) + .06 * Math.sin(k * 2.1)) * on, .025 * Math.max(0, k));
        uRev.value = mix(-1.08, 1.08, sm(1.5, 2.15, t)); uLum.value = .35 * sm(1.6, 2.4, t) + .75 * sm(2.5, 3.2, t);
        uCore.value = sm(1.6, 2.4, t) * (1 + .15 * Math.sin(t * 5)) + .6 * sm(2.6, 3.4, t) + push * 6;
        edges.material.opacity = t < 2.3 ? mix(1, .5, sm(1.9, 2.3, t)) : .5 + .2 * sm(5, 5.4, t);
        bridge.forEach((m, n) => { const f = sm(1.72 + n * .065, 1.84 + n * .065, t); m.visible = f > .01; m.scale.set(1, m.userData.len * f, 1);
          m.material.color.setRGB(...RAINBOW[n].map(c => c * (1.2 + 1.3 * f))); });
        sprites.forEach((sp, i) => { const f = sm(1.68 + i * .065, 1.8 + i * .065, t); sp.scale.setScalar(.09 + .05 * f); sp.material.opacity = f * (.9 + .1 * Math.sin(t * 6 + i)); });
        core.scale.setScalar(.32 + .22 * uCore.value); core.material.opacity = cl(.4 * uCore.value);
        U.uT.value = t; U.uNeb.value = sm(2.5, 2.9, t); U.uZ.value = 1 + .04 * sm(2.5, 5, t) + .4 * push;
        R.setRenderTarget(rt); R.render(scene, cam);
        let src = rt.texture, w = bw0, h = bh0;
        for (let i = 0; i < dn.length; i++) { down.uniforms.tIn.value = src; down.uniforms.uTx.value.set(.5 / w, .5 / h); down.uniforms.uK.value = i ? 0 : 1; pass(down, dn[i]); src = dn[i].texture; w = dn[i].width; h = dn[i].height; }
        let lo = dn[dn.length - 1];
        for (let i = dn.length - 2; i >= 0; i--) { up.uniforms.tLo.value = lo.texture; up.uniforms.tHi.value = dn[i].texture; up.uniforms.uTx.value.set(1 / lo.width, 1 / lo.height); pass(up, upR[i]); lo = upR[i]; }
        const g = glitch(t);
        Object.assign(CU.uG, { value: g }); CU.uFlash.value = flash(t) + .9 * sm(5.55, 5.85, t); CU.uTA.value = titleA(t); CU.uTS.value = titleS(t);
        CU.uBloom.value = .08 + .25 * Math.max(flash(t), push) + .06 * uCore.value * (t < 2.5 ? 1 : 0);
        CU.uExp.value = 1 + 4 * ei(lin(5.3, 5.8, t)); CU.uSeed.value = Math.floor(t * 24); CU.uT.value = t;
        CU.tS.value = rt.texture; CU.tB.value = lo.texture; pass(comp, null);
      },
      dispose() { scene.traverse(x => { if (x.geometry) x.geometry.dispose(); if (x.material) x.material.dispose(); }); [rt, ...dn, ...upR].forEach(x => x && x.dispose());
        [bandTex, gTex, titleTex].forEach(x => x.dispose()); if (scene.environment) scene.environment.dispose(); R.dispose(); try { R.forceContextLoss(); } catch (e) {} },
      R, scene, cam
    };
    R.compile(scene, cam);
    return o;
  }

  /* ---------- 换档（手动或自动），不中断时间线 ---------- */
  let switchAt = -1;
  function dropGL() { if (GLX) { try { GLX.dispose(); } catch (e) {} GLX = null; }
    const n = document.createElement('canvas'); n.className = 'gl'; glc.replaceWith(n); glc = n; }   // 旧 canvas 已 forceContextLoss，换新的
  function toLow() { dropGL(); glState = 'off'; if (!lowFx) { lowFx = makeLow(); lowFx.resize(); } }
  function buildGL() { try { GLX = makeGL(TM, tierName === 'high'); GLX.resize(); glState = 'ready'; } catch (e) { console.warn('p3intro gl', e); tierName = 'low'; dbg.tier = 'low'; toLow(); } }
  function setTier(n, auto) {
    if (dead || n === tierName) { qLabel(); return; }
    tierName = n; dbg.tier = n; switchAt = performance.now(); mAcc = 0; mN = 0; mLong = 0;
    if (n === 'low') toLow();
    else if (glState === 'loading') { /* three 仍在加载：加载完按新档建 */ }
    else { dropGL(); if (TM) buildGL();
      else { glState = 'off'; if (!lowFx) { lowFx = makeLow(); lowFx.resize(); }   // 低档起步再升档：先用 2D 顶着，three 到了再接上
        import('../ludoterra/vendor/r186/three.module.min.js').then(T => { TM = T; if (!dead && tierName !== 'low' && !GLX) { buildGL(); switchAt = performance.now(); } }).catch(() => {}); } }
    qLabel();
    if (auto) { dbg.autoLowered = (dbg.autoLowered || 0) + 1; toast(root, en, 'br'); }
  }
  /* fps 监测：只在玻璃（WebGL）真正出图时计；玻璃出图后前 0.5 秒、换档后 0.5 秒、单帧 >250ms（加载/编译卡顿）都不计 */
  let mAcc = 0, mN = 0, mLong = 0, glFrom = -1;
  function monitor(raw, now, t) {
    if (frozen != null || tierName === 'low' || glState !== 'ready' || t < 1.5 || document.hidden) { glFrom = -1; return; }
    if (glFrom < 0) glFrom = now;
    if (now - glFrom < 500 || now - switchAt < 500 || raw <= 0) { mLong = 0; return; }
    if (raw > .25) { if (++mLong >= 3) { mLong = 0; dbg.fps = 1 / raw; setTier(lower(tierName), true); } return; }   // 单帧 >250ms 不计；连续 3 帧都这样才算
    mLong = 0; mAcc += SLOW ? 1 / 12 : raw; mN++;
    if (mAcc < 1) return;
    const fps = mN / mAcc; dbg.fps = fps; mAcc = 0; mN = 0;
    if (fps < 24) setTier(lower(tierName), true);
  }

  /* ---------- 主循环 ---------- */
  let dead = false, raf = 0, last = performance.now(), clock = 0, held = 0, frames = 0, lastT = 0;
  const dbg = window.__p3intro = { tier: tierName, gpu, frozen, get gl() { return glState; }, frames: 0, t: 0, skip: () => end(true) };
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const raw = (now - last) / 1000;
    let t;
    if (frozen != null) t = frozen;
    else { clock += Math.min(.25, Math.max(0, (now - last) / 1000)); last = now; t = clock - held;   // 主线程卡顿时放慢而不是跳帧
      if (glState === 'loading' && t > 1.45) { if (t + held < 4.5) { held += t - 1.45; t = 1.45; } else { glState = 'off'; lowFx = makeLow(); lowFx.resize(); } } }
    lastT = t;
    if (t >= DUR && frozen == null) { end(false); return; }
    monitor(raw, now, t);
    const glOn = glState === 'ready', pct = Math.min(glState === 'loading' ? 92 : 100, Math.floor(100 * eo(lin(0, 1.42, t))));
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, c2.width, c2.height);
    if (t >= 1.5 && lowFx && !glOn) { lowFx.draw(t); ctx.setTransform(G.d, 0, 0, G.d, 0, 0); }
    else {
      ctx.setTransform(G.d, 0, 0, G.d, 0, 0);
      if (glOn && t >= 1.5) { GLX.render(t); glc.style.opacity = 1; } else glc.style.opacity = 0;
      if (t < 2.5) { grid(sm(0, .4, t) * (glOn && t > 1.5 ? 1 - sm(2.3, 2.5, t) : 1)); blueprint(t, t < 1.5 ? 1 : 1 - sm(1.6, 2.35, t), pct); }
    }
    if (t >= 1.5 && lowFx && !glOn && t < 2.5) { grid(1 - sm(2.0, 2.5, t)); blueprint(t, 1 - sm(1.55, 2.2, t), pct); }
    hud(t, sm(.1, .4, t) * (1 - sm(5.2, 5.6, t)));
    const sa = sm(3.45, 3.9, t) * (1 - sm(4.95, 5.25, t));
    sub.style.opacity = sa; sub.style.letterSpacing = mix(.6, .32, eo(lin(3.45, 4.3, t))) + 'em';
    root.style.opacity = 1 - sm(5.7, 6, t);
    dbg.frames = ++frames; dbg.t = t;
    if (frozen != null && frames >= 5 && glState !== 'loading') cancelAnimationFrame(raf);   // 冻结截帧：画够几帧就停，省 CPU
  }
  function end(skipped) {
    if (dead) return; dead = true; cancelAnimationFrame(raf);
    removeEventListener('keydown', onKey, true); removeEventListener('resize', resize);
    root.style.opacity = 0;
    setTimeout(() => { try { if (GLX) GLX.dispose(); } catch (e) {} root.remove(); st.remove(); RUN = null;
      window.__p3introOn = 0; dbg.done = true; dispatchEvent(new Event('p3intro:end')); }, skipped ? 460 : 60);
  }
  function onKey(e) { if (e.key !== 'Escape' && ctl.contains(e.target)) return;   // 焦点在画质/跳过按钮上：回车空格交给按钮本身
    if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopImmediatePropagation(); end(true); } }
  addEventListener('keydown', onKey, true);
  root.addEventListener('click', () => end(true));
  addEventListener('resize', resize);
  resize(); if (lowFx) lowFx.resize();
  raf = requestAnimationFrame(frame);
  RUN = { end };
  return RUN;
}
