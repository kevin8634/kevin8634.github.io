// 生命源码 · 生命尺度图谱 v0.5:同心椭圆六层尺度 × 八星座,中心是双螺旋长成的生命之树
// Canvas 2D 伪 3D 自绘;无外部资源。图标用系统表情字形着色成单色发光剪影。
import { LAYERS, CONS, STARS } from './atlas-data.js';
import { reducedMotion, sound } from './ls.js';

const ICON = {
  dna: '🧬', parents: '👨‍👩‍👧', zebra: '🦓', virus: '🦠', wolf: '🐺',
  'DNA 双螺旋': '🧬', '碱基配对': '🔗', '染色体': '🧶', '减数分裂': '🔀', '孟德尔定律': '🌱', 'ABO 血型': '🩸',
  '核糖体': '⚙️', '细胞核': '🔵', '线粒体': '🔋', '干细胞': '🌀',
  '突变': '✳️', '古 DNA': '🦴', '化石': '🐚', '自然选择': '🦋', '物种形成': '🐦',
  '食物网': '🕸️', '碳循环': '♻️', '环境 DNA': '💧',
  '抗体': '🛡️', '疫苗': '💉', '传染病传播': '👥', '噬菌体': '🕷️',
  '图灵斑图': '🐆', '胚胎发育': '🥚', '再生': '🦎',
  '酶': '✂️', '光合作用': '🌿', '心脏': '🫀', '消化': '🍎',
  '生物钟': '⏰', '大脑与学习': '🧠', '鸟类迁徙': '🕊️', '蜂群': '🐝',
};
// 金色星桥:通往其他世界的同题任务(端点由总门户登记)
const BRIDGES = [
  { from: 'dna', label: '星桥 → 数学图谱 · 怎样把秘密藏进数字里', href: '/math-atlas/secret/' },
  { from: 'virus', label: '星桥 → 数学图谱 · 传染病为什么会爆发', href: '/math-atlas/epidemic/' },
  { from: 'parents', label: '星桥 → 数学图谱 · 概率', href: '/math-atlas/casino/' },
];

export function createAtlas(cv, { onSelect, onBridge, isDone, litCon } = {}) {
  const g = cv.getContext('2d');
  let W, H, D, cx, cy, R, ry, narrow, pts = [], hover = null, sel = null, rip = null, focus = -1, focusT = -1;
  const V = { s: 1, ox: 0, oy: 0, ts: 1 };
  const bg = Array.from({ length: 320 }, () => [Math.random(), Math.random(), Math.random()]);
  const tint = {};  // 着色后的图标缓存
  const glyph = (ch, col, px) => {
    const k = ch + col + px; if (tint[k]) return tint[k];
    const c = document.createElement('canvas'); c.width = c.height = px * 1.4; const q = c.getContext('2d');
    q.font = `${px}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`; q.textAlign = 'center'; q.textBaseline = 'middle';
    q.fillText(ch, c.width / 2, c.height / 2 + px * .05);
    const d = q.getImageData(0, 0, c.width, c.height).data; let any = false; for (let i = 3; i < d.length; i += 16) if (d[i] > 30) { any = true; break; }
    if (!any) return (tint[k] = null);
    // 亮度保留为细节,统一染成星座色
    const im = q.getImageData(0, 0, c.width, c.height), a = im.data, [r0, g0, b0] = [1, 3, 5].map(i => parseInt(col.slice(i, i + 2), 16));
    for (let i = 0; i < a.length; i += 4) { const l = (a[i] * .3 + a[i + 1] * .59 + a[i + 2] * .11) / 255, m = .55 + .45 * l; a[i] = r0 * m + 40 * l; a[i + 1] = g0 * m + 40 * l; a[i + 2] = b0 * m + 40 * l; }
    q.putImageData(im, 0, 0); return (tint[k] = c);
  };
  // 每颗星的角度:按星座分扇区,扇区内按原 x 排序,避免挤在一起
  const conKeys = Object.keys(CONS);
  const stars = STARS.map((s, i) => {
    const sec = conKeys.indexOf(s.con), same = STARS.filter(t => t.con === s.con && t.layer === s.layer), j = same.indexOf(s);
    const a = (sec + .5 + (j - (same.length - 1) / 2) * .34 + (s.layer % 2) * .18) / conKeys.length * Math.PI * 2 - Math.PI / 2;
    return { s, a, ic: ICON[s.name] || ICON[s.id] || '✦' };
  });
  // 每层的氛围图标(不可点,只营造尺度感):分子→细胞→器官→个体→种群→生态
const DECOR = [['⚛️', '🧪', '⚗️', '🔬'], ['🦠', '🧫', '🔵', '🫧', '🧬'], ['🧠', '🫀', '🫁', '🦷', '👁️'], ['🧍', '🦋', '🐸', '🦓', '🐺', '🌻'], ['👨‍👩‍👧‍👦', '🐟', '🐜', '🐺', '🦌', '🐧'], ['🌲', '🏞️', '🌳', '🏔️', '🌾', '🌊', '🏝️']];
  const decor = []; DECOR.forEach((list, layer) => {
    const n = list.length + 3;
    for (let k = 0; k < n; k++) {
      const a = (k + .5) / n * Math.PI * 2 - Math.PI / 2 + layer * .4;
      if (stars.some(st => st.s.layer === layer && Math.abs(Math.atan2(Math.sin(st.a - a), Math.cos(st.a - a))) < .32)) continue;
      decor.push({ a, layer, ic: list[k % list.length] });
    }
  });
  // 生命之树:预生成分枝
  const branches = []; (function grow(x, y, ang, len, dep) {
    const x2 = x + Math.cos(ang) * len, y2 = y + Math.sin(ang) * len; branches.push({ x, y, x2, y2, dep });
    if (dep < 6) { const n = dep < 2 ? 3 : 2; for (let k = 0; k < n; k++) grow(x2, y2, ang + (k - (n - 1) / 2) * (.55 + Math.random() * .25) + (Math.random() - .5) * .2, len * (.68 + Math.random() * .1), dep + 1); }
  })(0, 0, -Math.PI / 2, .3, 0);
  const leaves2 = [];
  const leaves = branches.filter(b => b.dep >= 4).flatMap(b => [b, { ...b, x2: b.x2 + (Math.random() - .5) * .05, y2: b.y2 + (Math.random() - .5) * .05 }]).map(b => ({ x: b.x2, y: b.y2, c: Object.values(CONS)[Math.floor(Math.random() * 8)].color, p: Math.random() * 6 }));

  const rx = i => R * (.2 + i * .16), ryOf = i => rx(i) * ry;
  function layout() {
    D = devicePixelRatio; W = cv.width = innerWidth * D; H = cv.height = innerHeight * D; narrow = innerWidth < 640;
    const padTop = (narrow ? 120 : 64) * D, padBot = (narrow ? 110 : 70) * D;
    cx = W / 2; cy = padTop + (H - padTop - padBot) / 2;
    ry = narrow ? 1.0 : .46;
    R = Math.min((W / 2 - (narrow ? -10 : 70) * D) / 1.0, (H - padTop - padBot) / 2 / ry / 1.0);
    R /= (.2 + 5 * .16) * 1.0; R *= 1.0;
  }
  const T = (x, y) => [(x - W / 2) * V.s + W / 2 + V.ox, (y - H / 2) * V.s + H / 2 + V.oy];

  function draw(now) {
    const rm = reducedMotion(), spin = rm ? 0 : now / 1000 * .012;
    // 平滑缩放到焦点层(滑杆=穿越尺度)
    if (focusT !== focus) focusT = focus;
    if (V.tox !== undefined) { V.s += (V.ts - V.s) * .08; V.ox += (V.tox - V.ox) * .08; V.oy += (V.toy - V.oy) * .08; if (Math.abs(V.ts - V.s) < .002) V.tox = undefined; }
    g.clearRect(0, 0, W, H);
    const grd = g.createRadialGradient(...T(cx, cy), 0, ...T(cx, cy), R * 1.2 * V.s); grd.addColorStop(0, 'rgba(20,80,60,.35)'); grd.addColorStop(1, 'rgba(6,10,18,0)'); g.fillStyle = grd; g.fillRect(0, 0, W, H);
    for (const [x0, y0, z] of bg) { const x = ((x0 + V.ox / W * z * .3) % 1 + 1) % 1, y = ((y0 + V.oy / H * z * .3) % 1 + 1) % 1; g.fillStyle = `rgba(200,255,230,${.12 + z * .35 * (rm ? 1 : (.6 + .4 * Math.sin(now / 900 + z * 20)))})`; g.fillRect(x * W, y * H, 1.2 * D, 1.2 * D); }
    const [ccx, ccy] = T(cx, cy);
    // 星云雾带
    g.save(); g.translate(ccx, ccy); g.rotate(-.18); g.scale(1, .22);
    const hz = g.createRadialGradient(0, 0, 0, 0, 0, W * .6 * V.s); hz.addColorStop(0, 'rgba(60,140,120,.16)'); hz.addColorStop(.5, 'rgba(40,90,110,.07)'); hz.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = hz; g.beginPath(); g.arc(0, 0, W * .6 * V.s, 0, 7); g.fill(); g.restore();
    // 放射网格
    g.strokeStyle = 'rgba(110,231,183,.07)'; g.lineWidth = 1 * D;
    for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2 + spin; g.beginPath(); g.moveTo(ccx + Math.cos(a) * rx(0) * V.s * .7, ccy + Math.sin(a) * ryOf(0) * V.s * .7); g.lineTo(ccx + Math.cos(a) * rx(5) * 1.08 * V.s, ccy + Math.sin(a) * ryOf(5) * 1.08 * V.s); g.stroke(); }
    // 六层椭圆环
    for (let i = 5; i >= 0; i--) { g.beginPath(); g.ellipse(ccx, ccy, rx(i) * V.s, ryOf(i) * V.s, 0, 0, 7); g.fillStyle = i % 2 ? 'rgba(20,70,55,.10)' : 'rgba(10,40,35,.12)'; g.fill(); }
    for (let i = 0; i < 6; i++) {
      const on = focus === i, a = focus < 0 ? .42 : on ? .85 : .14;
      g.beginPath(); g.ellipse(ccx, ccy, rx(i) * V.s, ryOf(i) * V.s, 0, 0, 7);
      g.strokeStyle = `rgba(110,231,183,${a})`; g.lineWidth = (on ? 3 : 1.8) * D; g.shadowColor = '#34d399'; g.shadowBlur = on ? 20 * D : 10 * D; g.stroke(); g.shadowBlur = 0;
      // 层名:前方(下侧)
      g.font = `${(on ? 13 : 11) * D}px "PingFang SC","Noto Sans SC",sans-serif`; g.textAlign = 'center';
      g.fillStyle = on ? '#bff5dc' : 'rgba(170,200,190,.55)'; g.fillText(LAYERS[i], ccx, ccy + ryOf(i) * V.s - 5 * D);
    }
    g.textAlign = 'left';
    // 星位置(随时间缓慢公转,内层快外层慢,前后有深度)
    pts = stars.map(st => {
      const a = st.a + spin * (1.6 - st.s.layer * .2), x = cx + Math.cos(a) * rx(st.s.layer), y = cy + Math.sin(a) * ryOf(st.s.layer);
      const [X, Y] = T(x, y), depth = .72 + .28 * (Math.sin(a) + 1) / 2;
      return { ...st, X, Y, depth };
    });
    // 星座连线(同星座按角度相邻相连)
    const fc = (hover || sel) && (hover || sel).s.con;
    for (const k of conKeys) {
      const ps = pts.filter(p => p.s.con === k).sort((a, b) => a.s.layer - b.s.layer || a.a - b.a); if (ps.length < 2) continue;
      const lit = litCon && litCon(k), on = fc === k || lit; g.strokeStyle = on ? CONS[k].color + (fc && fc !== k ? '55' : 'dd') : `rgba(220,235,230,${fc ? .06 : .22})`; g.lineWidth = (on ? 1.8 : .8) * D;
      if (lit) { g.shadowColor = CONS[k].color; g.shadowBlur = 10 * D; }
      g.beginPath(); ps.forEach((p, i) => i ? g.lineTo(p.X, p.Y) : g.moveTo(p.X, p.Y)); g.stroke(); g.shadowBlur = 0;
      for (let i = 1; i < ps.length; i++) { const mx = (ps[i - 1].X + ps[i].X) / 2, my = (ps[i - 1].Y + ps[i].Y) / 2; g.fillStyle = '#fff6d8'; g.globalAlpha = fc && !on ? .2 : .8; g.beginPath(); g.arc(mx, my, 1.3 * D, 0, 7); g.fill(); g.globalAlpha = 1; }
    }
    // 生命之树(中心):双螺旋树干 + 分枝 + 发光叶点
    const ts = Math.min(rx(1) * 1.2, ryOf(2) * 1.45) * V.s, sway = rm ? 0 : Math.sin(now / 2200) * .04, base = ccy + ryOf(0) * V.s * .95;
    for (let s = 0; s < 2; s++) {
      g.beginPath();
      for (let k = 0; k <= 40; k++) { const t = k / 40, y = base - t * ts * .55, x = ccx + Math.sin(t * 9 + now / 700 * (rm ? 0 : 1) + s * Math.PI) * ts * .07 * (1 - t * .3); k ? g.lineTo(x, y) : g.moveTo(x, y); }
      g.strokeStyle = s ? '#5eead4' : '#34d399'; g.lineWidth = 3.6 * D; g.shadowColor = '#34d399'; g.shadowBlur = 12 * D; g.stroke();
    }
    g.shadowBlur = 0; g.strokeStyle = 'rgba(226,190,120,.7)'; g.lineWidth = 1 * D;
    for (let k = 1; k < 14; k++) { const t = k / 14, y = base - t * ts * .55, ph = t * 9 + now / 700 * (rm ? 0 : 1), w = Math.sin(ph) * ts * .07 * (1 - t * .3); if (Math.abs(Math.cos(ph)) < .25) continue; g.beginPath(); g.moveTo(ccx + w, y); g.lineTo(ccx - w, y); g.stroke(); }
    const top = base - ts * .55, tx = (x, y) => [ccx + (x * Math.cos(sway) - y * Math.sin(sway)) * ts, top + (x * Math.sin(sway) + y * Math.cos(sway)) * ts];
    for (const b of branches) { const [x1, y1] = tx(b.x, b.y), [x2, y2] = tx(b.x2, b.y2); g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.strokeStyle = `rgba(110,231,183,${.85 - b.dep * .09})`; g.lineWidth = Math.max(.6, 4.6 - b.dep * .6) * D; g.shadowColor = '#34d399'; g.shadowBlur = 6 * D; g.stroke(); } g.shadowBlur = 0;
    for (const l of leaves) { const [x, y] = tx(l.x, l.y), r = (2.6 + (rm ? 0 : Math.sin(now / 600 + l.p)) * 1.2) * D; g.beginPath(); g.arc(x, y, Math.max(1, r), 0, 7); g.fillStyle = l.c; g.shadowColor = l.c; g.shadowBlur = 10 * D; g.fill(); }
    g.shadowBlur = 0;
    // 金色星桥
    for (const br of BRIDGES) {
      const p = pts.find(q => q.s.id === br.from); if (!p) continue;
      const ex = p.X + (p.X - ccx) * 9, ey = p.Y + (p.Y - ccy) * 9, ang = Math.atan2(ey - p.Y, ex - p.X);
      const L = Math.min(Math.hypot(ex - p.X, ey - p.Y), 120 * D * V.s + 60 * D), endX = p.X + Math.cos(ang) * L, endY = p.Y + Math.sin(ang) * L;
      const gr = g.createLinearGradient(p.X, p.Y, endX, endY); gr.addColorStop(0, 'rgba(226,190,120,.9)'); gr.addColorStop(1, 'rgba(226,190,120,0)');
      g.strokeStyle = gr; g.lineWidth = 1.6 * D; g.beginPath(); g.moveTo(p.X, p.Y); g.lineTo(endX, endY); g.stroke();
      const f = rm ? .6 : (now / 2200 + BRIDGES.indexOf(br) * .33) % 1; g.beginPath(); g.arc(p.X + Math.cos(ang) * L * f, p.Y + Math.sin(ang) * L * f, 2.4 * D, 0, 7); g.fillStyle = '#ffe2a0'; g.shadowColor = '#e2be78'; g.shadowBlur = 12 * D; g.fill(); g.shadowBlur = 0;
      br.end = [p.X + Math.cos(ang) * L * .7, p.Y + Math.sin(ang) * L * .7];
      g.beginPath(); g.arc(endX - Math.cos(ang) * 6 * D, endY - Math.sin(ang) * 6 * D, 3 * D, 0, 7); g.fillStyle = '#9ad8ff'; g.shadowColor = '#7dd3fc'; g.shadowBlur = 14 * D; g.fill(); g.shadowBlur = 0;
      if (hover && hover.bridge === br) { g.font = `${12 * D}px "PingFang SC","Noto Sans SC",sans-serif`; g.fillStyle = '#ffe2a0'; const tw = g.measureText(br.label).width; g.fillText(br.label, Math.min(Math.max(br.end[0] - tw / 2, 6 * D), W - tw - 6 * D), br.end[1] - 10 * D); }
    }
    // 涟漪
    if (rip) { const k = (now - rip.t) / 900; if (k > 1) rip = null; else { for (const d of [0, .25]) { const kk = Math.max(0, k - d); g.beginPath(); g.arc(rip.p.X, rip.p.Y, (10 + kk * 70) * D, 0, 7); g.strokeStyle = CONS[rip.p.s.con].color; g.globalAlpha = (1 - kk) * .8; g.lineWidth = 2 * D; g.stroke(); } g.globalAlpha = 1; } }
    // 氛围图标
    for (const d of decor) {
      const a = d.a + spin * (1.6 - d.layer * .2), x = cx + Math.cos(a) * rx(d.layer), y = cy + Math.sin(a) * ryOf(d.layer), [X, Y] = T(x, y), depth = .72 + .28 * (Math.sin(a) + 1) / 2;
      const im = glyph(d.ic, '#6ee7b7', 48); if (!im) continue; const px = (narrow ? 15 : 22) * D * depth * Math.min(1.6, V.s ** .5);
      g.globalAlpha = (focus >= 0 && focus !== d.layer ? .12 : .5) * depth; g.drawImage(im, X - px * .7, Y - px * .7, px * 1.4, px * 1.4); g.globalAlpha = 1;
    }
    // 星(后面的先画)
    for (const p of [...pts].sort((a, b) => a.Y - b.Y)) {
      const c = CONS[p.s.con].color, isTask = !!p.s.task, dim = focus >= 0 && focus !== p.s.layer, act = p === hover || p === sel;
      const px = Math.round((isTask ? (narrow ? 34 : 44) : (narrow ? 20 : 27)) * D * p.depth * Math.min(1.6, V.s ** .5) * (act ? 1.2 : 1));
      g.globalAlpha = (dim ? .28 : 1) * (p.s.soon ? .5 : 1) * (.55 + .45 * p.depth);
      const pulse = isTask && !rm ? 1 + .18 * Math.sin(now / 500) : 1;
      // 光晕底盘
      const hg = g.createRadialGradient(p.X, p.Y, 0, p.X, p.Y, px * .9 * pulse); hg.addColorStop(0, c + '55'); hg.addColorStop(1, c + '00'); g.fillStyle = hg; g.beginPath(); g.arc(p.X, p.Y, px * .9 * pulse, 0, 7); g.fill();
      const im = glyph(p.ic, c, 48);
      if (im) { g.shadowColor = c; g.shadowBlur = (isTask ? 16 : 8) * D; g.drawImage(im, p.X - px * .7, p.Y - px * .7, px * 1.4, px * 1.4); g.shadowBlur = 0; }
      else { g.beginPath(); g.arc(p.X, p.Y, px * .2, 0, 7); g.fillStyle = c; g.fill(); }
      if (isTask) { g.beginPath(); g.arc(p.X, p.Y, px * .82 * pulse, 0, 7); g.strokeStyle = isDone && isDone(p.s.task) ? '#e2be78' : c; g.lineWidth = 1.4 * D; g.stroke(); }
      if (isTask || act || V.s > 1.8 || (focus === p.s.layer)) {
        const label = p.s.name; g.font = `${(isTask ? 13 : 11.5) * D}px "PingFang SC","Noto Sans SC",sans-serif`;
        const tw = g.measureText(label).width, lx = Math.min(Math.max(p.X - tw / 2, 6 * D), W - tw - 6 * D), ly = p.Y + px * .95 + 10 * D;
        g.fillStyle = 'rgba(6,10,18,.6)'; g.fillRect(lx - 4 * D, ly - 12 * D, tw + 8 * D, 16 * D);
        g.fillStyle = isTask ? '#eefcf6' : '#cfe9df'; g.fillText(label, lx, ly);
      }
      p.r = px * .8; g.globalAlpha = 1;
    }
    raf = requestAnimationFrame(draw);
  }
  let raf;
  const near = e => {
    const x = e.clientX * D, y = e.clientY * D; let best = null, bd = Infinity;
    for (const p of pts) { const d = Math.hypot(p.X - x, p.Y - y); if (d < Math.max(p.r, 22 * D) && d < bd) { bd = d; best = p; } }
    if (!best) for (const br of BRIDGES) if (br.end && Math.hypot(br.end[0] - x, br.end[1] - y) < 40 * D) return { bridge: br };
    return best;
  };
  // 交互:悬停、点击、拖动平移、双指/滚轮缩放、双击复位
  const ptr = new Map(); let moved = false, pinch0 = null;
  const clampV = () => { const m = (V.s - 1) / 2 + .15; V.ox = Math.max(-W * m, Math.min(W * m, V.ox)); V.oy = Math.max(-H * m, Math.min(H * m, V.oy)); };
  const zoomAt = (f, x, y) => { const s2 = Math.min(3.4, Math.max(1, V.s * f)), k = s2 / V.s; V.ox = x - W / 2 - (x - W / 2 - V.ox) * k; V.oy = y - H / 2 - (y - H / 2 - V.oy) * k; V.s = V.ts = s2; V.tox = undefined; clampV(); };
  cv.addEventListener('pointerdown', e => { ptr.set(e.pointerId, [e.clientX, e.clientY]); moved = false; if (ptr.size === 2) { const [a, b] = [...ptr.values()]; pinch0 = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), s: V.s }; } });
  cv.addEventListener('pointermove', e => {
    const q = ptr.get(e.pointerId);
    if (!q) { hover = near(e); cv.style.cursor = hover ? 'pointer' : ''; return; }
    if (ptr.size === 1) { const dx = e.clientX - q[0], dy = e.clientY - q[1]; if (Math.abs(dx) + Math.abs(dy) > 3) moved = true; if (moved) { V.tox = undefined; V.ox += dx * D; V.oy += dy * D; clampV(); } }
    ptr.set(e.pointerId, [e.clientX, e.clientY]);
    if (ptr.size === 2 && pinch0) { const [a, b] = [...ptr.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]); moved = true; zoomAt(pinch0.s * d / pinch0.d / V.s, (a[0] + b[0]) / 2 * D, (a[1] + b[1]) / 2 * D); }
  });
  const up = e => { ptr.delete(e.pointerId); if (ptr.size < 2) pinch0 = null; };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  cv.addEventListener('wheel', e => { e.preventDefault(); zoomAt(Math.exp(-e.deltaY * .0015), e.clientX * D, e.clientY * D); }, { passive: false });
  cv.addEventListener('dblclick', () => api.setFocus(-1));
  cv.addEventListener('click', e => {
    if (moved) return; const h = near(e);
    if (h && h.bridge) { sound.whoosh(.8, true); onBridge && onBridge(h.bridge); return; }
    sel = h; if (sel) rip = { p: sel, t: performance.now() }; onSelect && onSelect(sel ? sel.s : null);
  });
  addEventListener('resize', layout); layout(); raf = requestAnimationFrame(draw);
  const api = {
    // 滑杆:-1 全景;0 分子 … 5 生态。缩放让该层环占满视野
    setFocus(i) {
      focus = i;
      V.ts = i < 0 ? 1 : Math.min(3.4, Math.max(1, rx(5) / rx(i) * .62)); V.tox = -(cx - W / 2) * (V.ts - 1); V.toy = -(cy - H / 2) * (V.ts - 1);
      if (i >= 0) sound.tone(392 * Math.pow(1.122, 5 - i), .35, { gain: .08 });
    },
    clear() { sel = null; },
    get focus() { return focus; },
  };
  return api;
}
