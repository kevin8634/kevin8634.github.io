/* 星图 Math Atlas 2.0 · 改公理·玻璃曲面 —— 平面版(无 WebGL / 画质「低」/ 减少动态)
 * 与三维版同一套几何核与接口,功能不减:用共形图画——球面用球极投影、双曲用庞加莱圆盘、平面照原样。
 * 共形 = 角度不变形,所以画出来的角扇就是真实的角。 */
import * as G from './curve-geo.js';
const FAN = ['rgba(255,143,177,.6)', 'rgba(111,240,200,.6)', 'rgba(127,176,255,.6)'];
const VIEW = 2.8;

export async function mountStage(el, { reduced = true } = {}) {
  const cv = document.createElement('canvas'); cv.style.display = 'block'; cv.style.width = '100%'; cv.style.height = '100%'; cv.style.touchAction = 'none';
  el.appendChild(cv);
  const x = cv.getContext('2d'); let W = 1, H = 1, dpr = 1, sc = 1, cx = 0, cy = 0;
  let K = 1, V = null, show = { fans: true }, cmp = false, split = 0.5, arrow = null, ghost = null, onV = null, locked = false, raf = 0;
  const px = c => [cx + c[0] * sc, cy - c[1] * sc];
  function resize() { const r = el.getBoundingClientRect(); W = Math.max(1, r.width); H = Math.max(1, r.height); dpr = Math.min(2, devicePixelRatio || 1); cv.width = W * dpr; cv.height = H * dpr; sc = Math.min(W, H) / 2 / (VIEW + 0.15); cx = W / 2; cy = H / 2; draw(); }
  function world(k, clipX0, clipX1) {
    const S = G.scaleOf(k), g = Math.abs(k) < G.EPS_K ? 0 : Math.sign(k);
    x.save(); x.beginPath(); x.rect(clipX0, 0, clipX1 - clipX0, H); x.clip();
    // 玻璃片
    const R = g < 0 ? Math.min(VIEW, 2 * S) : VIEW;
    const gr = x.createRadialGradient(cx - R * sc * .3, cy - R * sc * .35, 4, cx, cy, R * sc);
    gr.addColorStop(0, 'rgba(240,247,255,.30)'); gr.addColorStop(.6, 'rgba(127,176,255,.10)'); gr.addColorStop(1, 'rgba(199,155,255,.26)');
    x.fillStyle = gr; x.strokeStyle = g < 0 && 2 * S <= VIEW ? 'rgba(199,155,255,.9)' : 'rgba(230,240,255,.45)'; x.lineWidth = g < 0 && 2 * S <= VIEW ? 2.2 : 1.2;
    x.beginPath(); x.arc(cx, cy, R * sc, 0, 7); x.fill(); x.stroke();
    if (g > 0 && 2 * S < VIEW) { x.setLineDash([4, 5]); x.strokeStyle = 'rgba(159,194,255,.45)'; x.beginPath(); x.arc(cx, cy, 2 * S * sc, 0, 7); x.stroke(); x.setLineDash([]); }
    // 等距圆
    x.strokeStyle = 'rgba(159,194,255,.2)'; x.lineWidth = 1;
    for (let s = 0.5; s < 6; s += 0.5) { const c = G.chart(k, G.fromPolar(k, s, 0)); const r = Math.hypot(...c); if (r > R) break; x.beginPath(); x.arc(cx, cy, r * sc, 0, 7); x.stroke(); }
    if (show.par) {   // 平行线挑战:L 白、过 O 的直线(相交粉/平行青)、双曲两条极限平行线
      const { d, th } = show.par, L = G.parSetup(k, d), S2 = G.scaleOf(k), span = g > 0 ? Math.PI * S2 : 8;
      const seg = (f, c, w) => { x.strokeStyle = c; x.lineWidth = w; x.beginPath(); let on = false;
        for (let i = 0; i <= 600; i++) { const P = f(-span + 2 * span * i / 600), q = G.chart(k, P); if (Math.hypot(...q) > R || !isFinite(q[0])) { on = false; continue; } const p = px(q); on ? x.lineTo(...p) : x.moveTo(...p); on = true; } x.stroke(); };
      const radial = t => s => (s >= 0 ? G.fromPolar(k, s, t) : G.fromPolar(k, -s, t + Math.PI));
      seg(t => G.expMap(k, L.F, L.T, t), '#ffffff', 3.2);
      const Pi = G.anglePar(k, d); if (Pi !== null) for (const t of g < 0 ? [-Math.PI / 2 + Pi, -Math.PI / 2 - Pi] : [0]) seg(radial(t), 'rgba(111,240,200,.55)', 1.5);
      const r = G.meetRadial(k, L, th); seg(radial(th), r.meet ? '#ff8fb1' : '#7ff7ff', 3);
      const glow = (P, rad) => { const q = G.chart(k, P); if (Math.hypot(...q) > R) return; const [a, b] = px(q), g2 = x.createRadialGradient(a, b, 0, a, b, rad); g2.addColorStop(0, 'rgba(255,244,196,1)'); g2.addColorStop(1, 'rgba(255,211,110,0)'); x.fillStyle = g2; x.beginPath(); x.arc(a, b, rad, 0, 7); x.fill(); };
      glow(L.O, 18); if (r.meet) glow(r.X, 12);
    }
    if (V) {
      const Wm = V.map(([s, th]) => G.fromPolar(k, s, th));
      const edge = e => { const a = []; for (let i = 0; i <= 64; i++) a.push(px(G.chart(k, G.geodesic(k, Wm[e], Wm[(e + 1) % 3], i / 64)))); return a; };
      const E = [0, 1, 2].map(edge);
      x.beginPath(); E.forEach((pts, e) => pts.forEach((p, i) => (e === 0 && i === 0 ? x.moveTo(...p) : x.lineTo(...p)))); x.closePath(); x.fillStyle = 'rgba(255,211,110,.16)'; x.fill();
      const rf = Math.min(0.26, 0.32 * Math.min(G.dist(k, Wm[0], Wm[1]), G.dist(k, Wm[1], Wm[2]), G.dist(k, Wm[2], Wm[0])));
      if (show.fans) Wm.forEach((P, v) => {
        const t1 = G.towards(k, P, Wm[(v + 1) % 3]), t2 = G.towards(k, P, Wm[(v + 2) % 3]), al = G.angleAt(k, P, Wm[(v + 1) % 3], Wm[(v + 2) % 3]);
        const d = G.dot(k, t2, t1), e2r = t2.map((q, i) => q - d * t1[i]), n2 = Math.sqrt(Math.max(1e-18, G.dot(k, e2r, e2r))), e2 = e2r.map(q => q / n2);
        x.beginPath(); x.moveTo(...px(G.chart(k, P)));
        for (let i = 0; i <= 24; i++) { const ph = al * i / 24, T = t1.map((q, j) => Math.cos(ph) * q + Math.sin(ph) * e2[j]); x.lineTo(...px(G.chart(k, G.expMap(k, P, T, rf)))); }
        x.closePath(); x.fillStyle = FAN[v]; x.fill();
      });
      x.strokeStyle = '#ffe7a3'; x.lineWidth = 3; x.lineJoin = 'round';
      E.forEach(pts => { x.beginPath(); pts.forEach((p, i) => (i ? x.lineTo(...p) : x.moveTo(...p))); x.stroke(); });
      Wm.forEach(P => { const [a, b] = px(G.chart(k, P)); const g2 = x.createRadialGradient(a, b, 0, a, b, 16); g2.addColorStop(0, 'rgba(255,244,196,1)'); g2.addColorStop(.45, 'rgba(255,211,110,.5)'); g2.addColorStop(1, 'rgba(255,211,110,0)'); x.fillStyle = g2; x.beginPath(); x.arc(a, b, 16, 0, 7); x.fill(); x.fillStyle = '#fff'; x.beginPath(); x.arc(a, b, 3.5, 0, 7); x.fill(); });
      const drawArrow = (fr, col, w) => { if (!fr) return; const a = px(G.chart(k, fr.P)), b = px(G.chart(k, G.expMap(k, fr.P, fr.v, 0.02))); let dx = b[0] - a[0], dy = b[1] - a[1]; const n = Math.hypot(dx, dy) || 1; dx /= n; dy /= n; const L = 34;
        x.strokeStyle = col; x.fillStyle = col; x.lineWidth = w; x.beginPath(); x.moveTo(a[0], a[1]); x.lineTo(a[0] + dx * L, a[1] + dy * L); x.stroke();
        x.beginPath(); x.moveTo(a[0] + dx * (L + 10), a[1] + dy * (L + 10)); x.lineTo(a[0] + dx * L - dy * 6, a[1] + dy * L + dx * 6); x.lineTo(a[0] + dx * L + dy * 6, a[1] + dy * L - dx * 6); x.closePath(); x.fill(); };
      if (k === K) { drawArrow(ghost, 'rgba(255,255,255,.4)', 3); drawArrow(arrow, '#7ff7ff', 3.5); }
    }
    x.restore();
  }
  function draw() {
    x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, W, H);
    const bg = x.createRadialGradient(W / 2, H * .42, 10, W / 2, H / 2, Math.max(W, H) * .8); bg.addColorStop(0, '#16193d'); bg.addColorStop(1, '#04050f'); x.fillStyle = bg; x.fillRect(0, 0, W, H);
    if (cmp) { world(0, 0, W * split); world(K, W * split, W); x.strokeStyle = 'rgba(255,255,255,.5)'; x.beginPath(); x.moveTo(W * split, 0); x.lineTo(W * split, H); x.stroke(); }
    else world(K, 0, W);
  }
  const ro = new ResizeObserver(resize); ro.observe(el); resize();
  let drag = -1;
  const loc = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left - cx) / sc, -(e.clientY - r.top - cy) / sc]; };
  cv.addEventListener('pointerdown', e => {
    if (locked || !V) return; const [X, Y] = loc(e);
    V.forEach(([s, th], i) => { const c = G.chart(K, G.fromPolar(K, s, th)); if (Math.hypot(c[0] - X, c[1] - Y) * sc < 22) drag = i; });
    if (drag >= 0) cv.setPointerCapture(e.pointerId);
  });
  cv.addEventListener('pointermove', e => {
    if (drag < 0) return; const [X, Y] = loc(e); const r = Math.hypot(X, Y), S = G.scaleOf(K);
    const lim = K > G.EPS_K ? Math.min(2.4, 0.9 * Math.PI * S) : K < -G.EPS_K ? Math.min(2.45, 2 * S * Math.atanh(0.96)) : 2.4;
    let rr = r; if (K < -G.EPS_K) rr = Math.min(r, 2 * S * 0.995);
    let [s, th] = G.toPolar(K, G.unchart(K, X * rr / (r || 1), Y * rr / (r || 1))); s = Math.min(lim, s); onV?.(drag, [s, th]);
  });
  const up = () => { drag = -1; }; cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  return {
    tier: 'flat',
    set(k, verts, opts = {}) { K = k; V = verts; Object.assign(show, opts); arrow = ghost = null; draw(); },
    lock(b) { locked = b; }, onVerts(cb) { onV = cb; },
    compare(on) { cmp = on; draw(); }, setSplit(v) { split = Math.max(0.05, Math.min(0.95, v)); draw(); },
    transport(ms = 5200) {
      const Wm = V.map(([s, th]) => G.fromPolar(K, s, th)), ccw = G.orientation(K, Wm) > 0 ? Wm : [Wm[0], Wm[2], Wm[1]];
      const tr = G.transport(K, ccw, Math.PI / 2.2, 60), F = tr.frames; ghost = F[0];
      if (reduced) { arrow = F[F.length - 1]; draw(); return Promise.resolve(tr.rot); }
      return new Promise(res => { const st = performance.now(); const step = now => { const u = Math.min(1, (now - st) / ms); arrow = F[Math.min(F.length - 1, Math.floor(u * (F.length - 1)))]; draw(); if (u < 1) raf = requestAnimationFrame(step); else res(tr.rot); }; raf = requestAnimationFrame(step); });
    },
    hideArrow() { arrow = ghost = null; draw(); },
    dispose() { cancelAnimationFrame(raf); ro.disconnect(); cv.remove(); }
  };
}
