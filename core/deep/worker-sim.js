/* 创世计划 · 深度组件库 worker-sim.js v0.2:RK4 数值积分(表达式经 core.js Expr 安全编译,无 eval) */
self.onmessage = async (e) => {
  try {
    const { state, rhs, params, dt, steps, every, expr } = e.data;
    const { Expr } = await import(expr);
    const names = Object.keys(state), pk = Object.keys(params || {});
    const f = names.map((n) => { if (!(n in rhs)) throw new Error("缺少 d" + n + "/dt"); return Expr.compile(rhs[n], ["t", ...names, ...pk]); });
    const scope = (t, y) => { const s = { t, ...params }; names.forEach((n, i) => (s[n] = y[i])); return s; };
    const F = (t, y) => f.map((g) => g(scope(t, y)));
    let t = 0, y = names.map((n) => +state[n]); const out = [[t, ...y]];
    const N = Math.min(+steps || 0, 2e6);
    for (let k = 1; k <= N; k++) {
      const k1 = F(t, y), k2 = F(t + dt / 2, y.map((v, i) => v + dt / 2 * k1[i])), k3 = F(t + dt / 2, y.map((v, i) => v + dt / 2 * k2[i])), k4 = F(t + dt, y.map((v, i) => v + dt * k3[i]));
      y = y.map((v, i) => v + dt / 6 * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i])); t += dt;
      if (k % every === 0) out.push([t, ...y]);
    }
    self.postMessage({ out });
  } catch (err) { self.postMessage({ error: String(err && err.message || err) }); }
};
