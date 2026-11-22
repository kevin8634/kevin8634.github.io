/* 宙律 Nomoverse 3.0 · 计算 Worker core/worker.js(3-2)
 * 经典 Worker(importScripts),包装 universe(T1–T7 判定)+ scene(场景描述)+ nbody(速度 Verlet)。
 * 主线程只发配方、收「场景描述」;渲染层只读 desc,不碰物理量。node 里 require 本文件可直接测 handle()。
 * 消息:{ id, op, ...args } → { id, ok, data } | { id, ok:false, error }
 *   op "run"   { recipe, budget }        → { res, desc }       res 为 universe.run 结果(结构化克隆)
 *   op "sky"   { seed, n }               → Float32Array(n*4)   已转移(transfer),不拷贝
 *   op "sweep" { recipe, key, n }         → [{ v, pass, status }]  后果指示迷你图
 *   op "nbody" { recipe, years, dt }     → { t, drift, pos }   固定步长积分 years 年,返回能量相对漂移与各体位置
 *   op "orbit" { recipe, frames }        → { n, frames, data(Float32Array,已转移), drift, rMax, years, dt, rgb }  3-5 T7 轨道动画 */
(function (root) {
  "use strict";
  var U, SC, NB;
  if (typeof module !== "undefined" && module.exports) {
    U = require("./universe.js"); SC = require("./scene.js"); NB = require("./nbody.js");
  } else {
    importScripts("universe.js", "scene.js", "nbody.js");
    U = root.NV3_UNIVERSE; SC = root.NV3_SCENE; NB = root.NV3_NBODY;
  }

  var OPS = {
    run: function (m) {
      var res = U.run(m.recipe || {});
      return { res: res, desc: SC.describe(res, m.budget || null) };
    },
    sky: function (m) {
      var n = Math.max(0, Math.min(262144, m.n | 0));
      return SC.skyField((m.seed >>> 0), n, U.prng);
    },
    /* 后果指示:沿某个旋钮的对数范围取 n 点,返回每点通过的关数(0–7)与状态 */
    sweep: function (m) {
      var r = U.RANGE[m.key], n = Math.max(2, Math.min(64, m.n | 0 || 24)), out = [];
      for (var i = 0; i < n; i++) {
        var v = r[0] * Math.pow(r[1] / r[0], i / (n - 1)), rc = {}, k;
        for (k in (m.recipe || {})) rc[k] = m.recipe[k];
        rc[m.key] = v;
        var x = U.run(rc), ok = U.ORDER.filter(function (t) { return x.stages[t] !== "fail"; }).length;
        out.push({ v: v, pass: ok, status: x.status });
      }
      return out;
    },
    orbit: function (m) {
      var res = U.run(m.recipe || {}), o = NB.trace(res, { frames: m.frames, maxSteps: m.maxSteps });
      o.rgb = res.star.rgb; o.lit = res.stages.T5 !== "fail"; o.hab = res.planets.map(function (p) { return !!p.habitable; });
      if (!o.lit) { o.frames = 0; o.data = new Float32Array(0); }
      return o;
    },
    nbody: function (m) {
      var res = U.run(m.recipe || {});
      if (!res.planets.length) return { t: 0, drift: 0, pos: [] };
      var s = NB.fromSystem(res), e0 = NB.energy(s);
      var dt = m.dt || 1e-3, steps = Math.max(1, Math.min(2e5, Math.round((m.years || 1) / dt)));
      NB.step(s, dt, steps);
      var e1 = NB.energy(s);
      return { t: s.t, drift: Math.abs((e1 - e0) / e0), pos: s.b.map(function (b) { return [b.x, b.y]; }) };
    }
  };

  function handle(msg) {
    var f = OPS[msg && msg.op];
    if (!f) return { id: msg && msg.id, ok: false, error: "bad_op" };
    try { return { id: msg.id, ok: true, data: f(msg) }; }
    catch (e) { return { id: msg.id, ok: false, error: String(e && e.message || e) }; }
  }

  if (typeof module !== "undefined" && module.exports) module.exports = { handle: handle, OPS: OPS };
  else root.onmessage = function (ev) {
    var out = handle(ev.data);
    var d = out.ok && out.data, tr = d instanceof Float32Array ? [d.buffer] : d && d.data instanceof Float32Array ? [d.data.buffer] : [];
    root.postMessage(out, tr);
  };
})(typeof self !== "undefined" ? self : this);
