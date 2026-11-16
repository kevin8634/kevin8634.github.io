// 单元自测:node math-atlas/curve/curve-geo.test.mjs (仅开发用,页面不加载)
import * as G from './curve-geo.js';
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL', m); } };
const near = (a, b, t, m) => ok(Math.abs(a - b) < t, `${m}: ${a} vs ${b}`);
const PI = Math.PI;

// 1 八分之一球面:三个直角,面积 π/2(K=1)
{ const V = [[1, 0, 0], [0, 1, 0], [0, 0, 1]], m = G.measure(1, V);
  m.angles.forEach((a, i) => near(a, PI / 2, 1e-9, 'octant angle ' + i));
  near(m.area, PI / 2, 1e-8, 'octant area'); near(m.sum, PI + m.KA, 1e-8, 'octant GB'); }
// 2 同一个八分之一三角形放到半径 R=2 的球(K=1/4):面积 = R²·π/2,角不变
{ const V = [[1, 0, 0], [0, 1, 0], [0, 0, 1]], m = G.measure(0.25, V);
  near(m.area, 4 * PI / 2, 1e-7, 'octant R=2 area'); near(m.sum, 1.5 * PI, 1e-9, 'octant R=2 sum'); }
// 3 随机三角形:高斯–博内 α+β+γ = π + K·A(面积独立积分)
let rs = 7; const rnd = () => (rs = (rs * 1664525 + 1013904223) >>> 0) / 4294967296;
for (const K of [1, 0.6, 0.25, 0.05, 0, -0.05, -0.3, -1]) {
  for (let i = 0; i < 40; i++) {
    const V = [0, 1, 2].map(() => G.fromPolar(K, 0.05 + rnd() * (K > 0 ? 1.4 / Math.sqrt(K) : 2.4), rnd() * 2 * PI));
    const m = G.measure(K, V);
    if (m.area < 1e-4) continue;
    near(m.sum - PI, m.KA, 2e-7, `GB K=${K} #${i}`);
    const t = G.transport(K, G.orientation(K, V) > 0 ? V : [V[0], V[2], V[1]]);
    near(t.rot, m.KA, 2e-6, `holonomy K=${K} #${i}`);
  }
}
// 4 平面:内角和恰为 π
{ const V = [G.fromPolar(0, 1, 0.3), G.fromPolar(0, 2, 2.1), G.fromPolar(0, 1.5, 4)]; near(G.measure(0, V).sum, PI, 1e-12, 'flat sum'); }
// 5 庞加莱圆盘欧氏半径 0.72 的等边三角形(K=−1):每角 = 2·arccot(cosh ρ·tan 60°),ρ = 2 artanh 0.72
{ const rho = 2 * Math.atanh(0.72), want = 2 * Math.atan(1 / (Math.cosh(rho) * Math.tan(PI / 3)));
  const V = [90, 210, 330].map(d => G.fromPolar(-1, rho, d * PI / 180)), m = G.measure(-1, V);
  m.angles.forEach((a, i) => near(a, want, 1e-9, 'hyp equilateral ' + i)); near(G.deg(want), 20.754, 1e-3, 'hyp 20.754°'); }
// 6 很小的三角形几乎是 180°
{ const V = [0, 120, 240].map(d => G.fromPolar(1, 0.01, d * PI / 180)); { const d = G.deg(G.measure(1, V).sum) - 180; ok(d > 0 && d < 0.01, 'small ≈180 ' + d); }; }
// 7 理想三角形极限:双曲中顶点趋于无穷,内角和 → 0
{ const V = [90, 210, 330].map(d => G.fromPolar(-1, 12, d * PI / 180)); ok(G.deg(G.measure(-1, V).sum) < 0.1, 'ideal → 0'); }
// 8 图与展示的往返
for (const K of [1, 0.3, 0, -0.4, -1]) for (let i = 0; i < 20; i++) {
  const s = 0.1 + rnd() * 2, th = rnd() * 6.28, P = G.fromPolar(K, s, th);
  const c = G.chart(K, P), Q = G.unchart(K, c[0], c[1]); near(G.dist(K, P, Q), 0, 1e-7, `chart rt K=${K}`);
  const d = G.disp3(K, P), R = G.undisp3(K, ...d); near(G.dist(K, P, R), 0, 1e-7, `disp rt K=${K}`);
  const [s2, t2] = G.toPolar(K, P); near(s2, s, 1e-9, `polar s K=${K}`);
}
// 9 测地极坐标:顶点到中心 O 的测地距离就是 s
for (const K of [0.7, -0.7]) { const O = G.fromPolar(K, 0, 0), P = G.fromPolar(K, 1.3, 2); near(G.dist(K, O, P), 1.3, 1e-9, 'dist from O K=' + K); }
// 10 本关招牌:K=1、O 到顶点 s0 = arccos(1/√3) 的等边三角形就是八分之一球面 → 270°
{ const s0 = Math.acos(1 / Math.sqrt(3)), V = [90, 210, 330].map(d => G.fromPolar(1, s0, d * PI / 180)), m = G.measure(1, V);
  near(G.deg(m.sum), 270, 1e-7, 'signature 270'); }
// 7 平行公理:三种曲率下的相交判定、平行角、交点确在 L 上
{ let p7 = 0;
  for (const K of [1, 0.4, 0.05]) for (const d of [0.3, 0.8, 1.2]) {
    const L = G.parSetup(K, Math.min(d, 0.45 * PI / Math.sqrt(K)));
    for (let i = 0; i < 24; i++) { const th = rnd() * 2 * PI, r = G.meetRadial(K, L, th); ok(r.meet, `sphere meets K=${K} th=${th}`);
      if (r.meet) { near(Math.abs(Math.sin(G.angleAt(K, L.F, G.expMap(K, L.F, L.T, 0.3), r.X))), 0, 1e-6, `sphere X on L K=${K}`); } }
    ok(G.parallelCount(K) === 0 && G.sweepParallels(K, L, 720).count === 0, 'sphere 0 parallels'); p7++; }
  for (const d of [0.4, 1, 1.7]) { const L = G.parSetup(0, d);
    for (let i = 0; i < 24; i++) { const th = rnd() * 2 * PI, r = G.meetRadial(0, L, th); ok(r.meet, 'flat meets'); near(r.X[1], -d, 1e-9, 'flat X on L'); }
    ok(!G.meetRadial(0, L, 0).meet && !G.meetRadial(0, L, PI).meet, 'flat parallel θ=0');
    ok(G.sweepParallels(0, L, 3600).count === 1, 'flat exactly 1 parallel'); near(G.anglePar(0, d), PI / 2, 1e-12, 'flat Π=90°'); }
  for (const K of [-1, -0.3, -0.05]) for (const d of [0.2, 0.7, 1.5]) {
    const L = G.parSetup(K, d), P = G.anglePar(K, d), e = 1e-4, down = -PI / 2;
    ok(G.meetRadial(K, L, down + P - e).meet && G.meetRadial(K, L, down - P + e).meet, `hyp meets inside Π K=${K} d=${d}`);
    ok(!G.meetRadial(K, L, down + P + e).meet && !G.meetRadial(K, L, down - P - e).meet, `hyp misses outside Π K=${K} d=${d}`);
    const sw = G.sweepParallels(K, L, 7200); ok(sw.count === Infinity, 'hyp infinitely many'); near(sw.open, PI - 2 * P, 2e-3, `hyp open wedge = π − 2Π K=${K} d=${d}`);
    const r = G.meetRadial(K, L, down + 0.6 * P); near(Math.abs(Math.sin(G.angleAt(K, L.F, G.expMap(K, L.F, L.T, 0.3), r.X))), 0, 1e-6, 'hyp X on L');
    near(G.dist(K, L.O, L.F), d, 1e-9, 'hyp d'); near(G.angleAt(K, L.F, L.O, G.expMap(K, L.F, L.T, 0.3)), PI / 2, 1e-9, 'hyp perpendicular'); }
  near(G.anglePar(-1e-6, 1), PI / 2, 2e-3, 'Π→90° as K→0⁻');
}
console.log(`curve-geo: ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
