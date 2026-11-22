/* 宙律 Nomoverse 3.0 · Worker 客户端 core/wclient.mjs(3-2)
 * call(op, args) → Promise。Worker 不可用或出错时回退到主线程同步计算(window.NV3_*),结果一致(确定性)。
 * run 请求自动合并:拖滑块时只算最新一次,旧请求直接丢弃(latest-wins)。 */
const W = (() => {
  try { return typeof Worker === 'function' ? new Worker(new URL('./worker.js', import.meta.url)) : null; }
  catch (e) { return null; }
})();
let seq = 0, broken = !W;
const wait = new Map();
if (W) {
  W.onmessage = (ev) => { const m = ev.data, p = wait.get(m.id); if (!p) return; wait.delete(m.id); m.ok ? p.res(m.data) : p.rej(new Error(m.error)); };
  W.onerror = (e) => { e.preventDefault && e.preventDefault(); broken = true; wait.forEach((p, id) => p.fallback()); wait.clear(); };
}

/* 主线程回退:与 worker.js 的 OPS 同逻辑 */
function local(op, a) {
  const U = window.NV3_UNIVERSE, SC = window.NV3_SCENE, NB = window.NV3_NBODY;
  if (op === 'run') { const res = U.run(a.recipe || {}); return { res, desc: SC.describe(res, a.budget || null) }; }
  if (op === 'sky') return SC.skyField(a.seed >>> 0, a.n | 0, U.prng);
  if (op === 'sweep') {
    const r = U.RANGE[a.key], n = a.n || 24, out = [];
    for (let i = 0; i < n; i++) { const v = r[0] * Math.pow(r[1] / r[0], i / (n - 1)); const x = U.run({ ...(a.recipe || {}), [a.key]: v }); out.push({ v, pass: U.ORDER.filter((t) => x.stages[t] !== 'fail').length, status: x.status }); }
    return out;
  }
  if (op === 'orbit') {
    const res = U.run(a.recipe || {}), o = NB.trace(res, { frames: a.frames, maxSteps: a.maxSteps });
    o.rgb = res.star.rgb; o.lit = res.stages.T5 !== 'fail'; o.hab = res.planets.map((p) => !!p.habitable);
    if (!o.lit) { o.frames = 0; o.data = new Float32Array(0); }
    return o;
  }
  if (op === 'nbody') {
    const res = U.run(a.recipe || {}); if (!res.planets.length) return { t: 0, drift: 0, pos: [] };
    const s = NB.fromSystem(res), e0 = NB.energy(s), dt = a.dt || 1e-3;
    NB.step(s, dt, Math.max(1, Math.round((a.years || 1) / dt)));
    return { t: s.t, drift: Math.abs((NB.energy(s) - e0) / e0), pos: s.b.map((b) => [b.x, b.y]) };
  }
  throw new Error('bad_op');
}

export const usingWorker = () => !broken;

export function call(op, args = {}) {
  if (broken) return Promise.resolve().then(() => local(op, args));
  const id = ++seq;
  return new Promise((res, rej) => {
    wait.set(id, { res, rej, fallback: () => { try { res(local(op, args)); } catch (e) { rej(e); } } });
    W.postMessage(Object.assign({ id, op }, args));
  });
}

/* 只要最新:返回 null 表示被更新的请求取代 */
let latest = 0;
export async function runLatest(recipe, budget) {
  const my = ++latest;
  const out = await call('run', { recipe, budget });
  return my === latest ? out : null;
}
