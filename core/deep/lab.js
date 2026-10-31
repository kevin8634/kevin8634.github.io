/* 创世计划 Genesis · Lab Kit(创世实验室通用实验台)/core/deep/lab.js v0.4
 * 总指挥维护,七世界只引用、只写 JSON 协议,不改本文件。零外部依赖,运行时零外部请求。
 * 复用 core.js:Expr(白名单表达式,无 eval)、ParamPanel、DataSet/Ledger、DataChart、Sim(RK4)、Card。
 * 协议格式见 README「Lab 协议 gn-lab/1」。 */
import { Expr, ParamPanel, DataSet, DataChart, Ledger, Sim, Card } from "./core.js";

export const LAB_SCHEMA = "gn-lab/1";
const BASE = new URL(".", import.meta.url).href;
const EVID = { confirmed: ["已证实", "#7fe3a8"], inferred: ["推测", "#ffd27a"], conjecture: ["猜想", "#ff9ab8"] };
const SAFE = { green: ["🟢 可在家安全做", "#7fe3a8"], yellow: ["🟡 需成人陪同 / 实验室条件", "#ffd27a"], red: ["🔴 危险 · 仅虚拟演示,切勿模仿", "#ff8a8a"] };
const WORLD = /^[a-z]{2}$/;
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmt = (v) => !isFinite(v) ? "—" : Math.abs(v) >= 1e4 || (Math.abs(v) < 1e-2 && v !== 0) ? v.toExponential(2) : String(+v.toFixed(3));

let cssDone = false;
function css() {
  if (cssDone || typeof document === "undefined") return; cssDone = true;
  for (const f of ["deep.css", "lab.css"]) { const l = document.createElement("link"); l.rel = "stylesheet"; l.href = BASE + f; document.head.appendChild(l); }
}

/* ---------- 协议校验:返回问题列表(空 = 通过) ---------- */
export function validate(p) {
  const bad = [];
  if (!p || typeof p !== "object") return ["协议缺失"];
  if (p.schema !== LAB_SCHEMA) bad.push(`schema 须为 ${LAB_SCHEMA}`);
  if (!/^[a-z]{2}\.lab\.[a-z0-9_-]+$/.test(p.id || "")) bad.push("id 须形如 ef.lab.iron");
  if (!WORLD.test(p.world || "") || (p.id && !p.id.startsWith(p.world + "."))) bad.push("world 须为两位世界码且与 id 前缀一致");
  for (const k of ["title", "question"]) if (!p[k]) bad.push(k + " 缺失");
  if (!EVID[p.evidence]) bad.push("evidence 须为 confirmed / inferred / conjecture");
  if (!SAFE[p.safety]) bad.push("safety 须为 green / yellow / red");
  if (!Array.isArray(p.params)) bad.push("params 须为数组");
  else for (const q of p.params) { if (!/^[a-zA-Z_]\w*$/.test(q.k || "")) bad.push("参数名不合法:" + q.k); if (!(+q.max > +q.min)) bad.push(`参数 ${q.k} 需 min < max`); }
  const m = p.model || {};
  if (!["fn", "ode"].includes(m.type)) bad.push("model.type 须为 fn 或 ode");
  if (m.type === "fn" && (!m.x || !Array.isArray(m.ys) || !m.ys.length)) bad.push("fn 模型需要 x 与 ys");
  if (m.type === "ode" && (!m.state || !m.rhs)) bad.push("ode 模型需要 state 与 rhs");
  if (p.predict && (!Array.isArray(p.predict.options) || !(p.predict.answer in p.predict.options))) bad.push("predict 需要 options 与合法 answer");
  for (const c of p.conclusions || []) if (!EVID[c.evidence]) bad.push("结论证据等级不合法:" + (c.text || "").slice(0, 12));
  if (p.data && !/^(\.{0,2}\/|[\w-])/.test(p.data.src || "")) bad.push("data.src 须为同源相对路径");
  return bad;
}

/* ---------- 模型:fn(逐点表达式,可带中间量 defs)/ ode(RK4 Worker) ---------- */
function compileFn(p) {
  const m = p.model, xk = m.x.k || "x", pk = p.params.map((q) => q.k), vars = [xk, ...pk];
  const defs = (m.defs || []).map((d) => { const f = Expr.compile(d.expr, vars.slice()); vars.push(d.k); return [d.k, f]; });
  const ys = m.ys.map((y) => ({ label: y.label, color: y.color, f: Expr.compile(y.expr, vars.slice()) }));
  const lim = (v, s) => typeof v === "number" ? v : Expr.compile(String(v), pk)(s);
  return (vals, xsOverride) => {
    const s0 = { ...vals }; let xs = xsOverride;
    if (!xs) { xs = []; const a = lim(m.x.from, s0), b = lim(m.x.to, s0), st = Math.abs(lim(m.x.step ?? (b - a) / 200, s0)) || 1; for (let v = a, n = 0; v <= b + st / 2 && n < 5000; v += st, n++) xs.push(+v.toFixed(10)); }
    return { xs, ys: ys.map((y) => ({ label: y.label, color: y.color, v: xs.map((x) => { const s = { ...s0, [xk]: x }; for (const [k, f] of defs) s[k] = f(s); const r = y.f(s); return isFinite(r) ? r : NaN; }) })) };
  };
}
async function runModel(p, fn, vals, xsData) {
  if (p.model.type === "fn") return fn(vals, p.model.x?.from === "data" ? xsData : null);
  const m = p.model, out = await Sim.run({ state: m.state, rhs: m.rhs, params: vals, dt: m.dt || 0.01, steps: m.steps || 1000, every: m.every || 10 });
  const names = Object.keys(m.state), show = m.show || names;
  return { xs: out.map((r) => +r[0].toFixed(6)), ys: show.map((n, k) => ({ label: (m.labels || {})[n] || n, v: out.map((r) => r[1 + names.indexOf(n)]) })) };
}

/* ---------- 自动校验:模型对参考值(防「好看但算错」) ---------- */
export async function selfCheck(p) {
  const fn = p.model.type === "fn" ? compileFn(p) : null, def = Object.fromEntries(p.params.map((q) => [q.k, +(q.value ?? q.min)]));
  const res = [];
  for (const c of p.checks || []) {
    const r = await runModel(p, fn, { ...def, ...(c.params || {}) }, [c.x]);
    let got; const s = r.ys[c.y || 0];
    if (p.model.type === "fn") got = s.v[0];
    else { let bi = 0; r.xs.forEach((x, i) => { if (Math.abs(x - c.x) < Math.abs(r.xs[bi] - c.x)) bi = i; }); got = s.v[bi]; }
    res.push({ ...c, got, ok: Math.abs(got - c.expect) <= (c.tol ?? Math.abs(c.expect) * 0.01) });
  }
  return res;
}

/* ---------- 实验记录本:只存本机,键 gn:<世界码>:lab ---------- */
export const Notebook = {
  key: (w) => `gn:${w}:lab`,
  list(w) { try { const o = JSON.parse(localStorage.getItem(this.key(w)) || "[]"); return Array.isArray(o) ? o : []; } catch (e) { return []; } },
  add(w, entry) { const a = this.list(w); a.unshift({ t: new Date().toISOString(), ...entry }); a.length = Math.min(a.length, 60); try { localStorage.setItem(this.key(w), JSON.stringify(a)); } catch (e) {} return a; },
  remove(w, t) { const a = this.list(w).filter((e) => e.t !== t); try { localStorage.setItem(this.key(w), JSON.stringify(a)); } catch (e) {} return a; },
  exportJSON(w) { return JSON.stringify({ schema: "gn-lab-notebook/1", world: w, exported: new Date().toISOString(), entries: this.list(w) }, null, 1); }
};

/* ---------- 分享链接:#lab=<id>&p=<参数>&b=<B 组>(无账号,打开即复现) ---------- */
export function shareHash(id, a, b) {
  const enc = (o) => Object.entries(o).map(([k, v]) => `${k}:${+(+v).toFixed(6)}`).join(",");
  return `#lab=${encodeURIComponent(id)}&p=${enc(a)}${b ? "&b=" + enc(b) : ""}`;
}
function readHash(id) {
  const h = new URLSearchParams((typeof location !== "undefined" ? location.hash : "").slice(1));
  if (h.get("lab") !== id) return null;
  const dec = (s) => s ? Object.fromEntries(s.split(",").map((kv) => kv.split(":")).filter((x) => x.length === 2 && isFinite(+x[1])).map(([k, v]) => [k, +v])) : null;
  return { a: dec(h.get("p")), b: dec(h.get("b")) };
}

/* ---------- 挂载实验台 ---------- */
export const Lab = {
  validate, selfCheck, Notebook, shareHash, SCHEMA: LAB_SCHEMA,
  async load(src) {
    const u = new URL(src, location.href);
    if (u.origin !== location.origin) throw new Error("Lab 协议只读同源本地文件:" + src);
    const r = await fetch(u.href); if (!r.ok) throw new Error("Lab 协议 " + r.status + " " + src);
    const p = await r.json(); p.__base = u.href; return p;
  },
  /* el:容器;proto:协议对象或同源路径;opts:{color?, onRecord?(entry), onBridge?(id)} */
  async mount(el, proto, opts = {}) {
    css();
    const p = typeof proto === "string" ? await Lab.load(proto) : proto;
    const bad = validate(p); if (bad.length) { el.textContent = "实验协议不合格:" + bad.join(";"); throw new Error("Lab 协议不合格:" + bad.join(";")); }
    const color = opts.color || p.color || "#e8c27a";
    let data = null; if (p.data) data = await DataSet.load(new URL(p.data.src, p.__base || location.href).href);
    const fn = p.model.type === "fn" ? compileFn(p) : null;
    const xsData = data ? data.col(p.data.x) : null;
    const hashed = readHash(p.id);
    const def = Object.fromEntries(p.params.map((q) => [q.k, +(q.value ?? q.min)]));
    const A = { ...def, ...(hashed?.a || {}) }, B = { ...A };
    let vary = p.ab?.vary || p.params[0]?.k, abOn = !!hashed?.b, guess = null, revealed = !p.predict, chart = null, last = null;
    if (hashed?.b) { const k = Object.keys(hashed.b).find((k) => hashed.b[k] !== A[k]); if (k) { vary = k; B[k] = hashed.b[k]; } }

    const root = document.createElement("section"); root.className = "gl"; root.style.setProperty("--gl-c", color);
    root.setAttribute("aria-label", "实验台:" + p.title);
    const [en, ec] = EVID[p.evidence], [sn, sc] = SAFE[p.safety];
    root.innerHTML = `
      <header class="gl-h"><div class="gl-t"><b>${esc(p.title)}</b><span class="gl-q">${esc(p.question)}</span></div>
        <div class="gl-tags"><span class="gl-tag" style="--tc:${ec}" title="证据等级">${en}</span><span class="gl-tag" style="--tc:${sc}" title="安全标签">${sn}</span><span class="gl-chk" hidden></span></div>
        ${p.safety !== "green" && p.safetyNote ? `<p class="gl-safe">${esc(p.safetyNote)}</p>` : ""}</header>
      <div class="gl-body">
        <aside class="gl-left">
          <div class="gl-pred" ${p.predict ? "" : "hidden"}><h4>① 先猜一猜</h4><p>${esc(p.predict?.q)}</p><div class="gl-opts" role="radiogroup"></div></div>
          <h4>${p.predict ? "② " : ""}调变量 <small class="gl-ablab">A 组</small></h4><div class="gl-pa"></div>
          <label class="gl-abt"><input type="checkbox"> A/B 对照(只改一个变量)</label>
          <div class="gl-ab" hidden><label>B 组改变 <select class="gl-vary"></select></label><div class="gl-pb"></div></div>
        </aside>
        <div class="gl-main">
          <div class="gl-stage"><div class="gl-chart"></div><div class="gl-lock" ${revealed ? "hidden" : ""}><p>先在左边选一个猜测,再看结果。</p></div></div>
          <p class="gl-diff" aria-live="polite"></p>
          <div class="gl-reveal" aria-live="polite" hidden></div>
          <div class="gl-concl" hidden></div>
          <div class="gl-acts"><button type="button" class="gl-b gl-rec">记入实验记录本</button><button type="button" class="gl-b gl-link">复制复现链接</button><button type="button" class="gl-b gl-card">导出图片卡</button><button type="button" class="gl-b gl-reset">重置</button></div>
          <details class="gl-nb"><summary>实验记录本(只存本机)<span class="gl-nbn"></span></summary><textarea class="gl-note" rows="2" maxlength="300" placeholder="写下你的发现(可选,最多 300 字)"></textarea><ol class="gl-nbl"></ol><button type="button" class="gl-b gl-exp">导出记录 JSON</button></details>
          <p class="gl-bridge" ${p.bridges?.length ? "" : "hidden"}></p>
          <p class="gl-cred"></p>
        </div>
      </div>`;
    el.appendChild(root);
    const $ = (s) => root.querySelector(s);

    /* 参数面板 */
    let panA, panB;
    const mountA = () => { $(".gl-pa").innerHTML = ""; panA = ParamPanel.mount($(".gl-pa"), { params: p.params.map((q) => ({ ...q, value: A[q.k] })), onInput: (v) => { Object.assign(A, v); if (abOn) for (const k in A) if (k !== vary) B[k] = A[k]; draw(); } }); };
    const mountB = () => { $(".gl-pb").innerHTML = ""; const q = p.params.find((x) => x.k === vary); panB = ParamPanel.mount($(".gl-pb"), { params: [{ ...q, label: (q.label || q.k) + "(B)", value: B[vary] }], onInput: (v) => { Object.assign(B, v); draw(); } }); };
    $(".gl-vary").innerHTML = p.params.map((q) => `<option value="${q.k}"${q.k === vary ? " selected" : ""}>${esc(q.label || q.k)}</option>`).join("");
    $(".gl-vary").onchange = (e) => { vary = e.target.value; for (const k in A) B[k] = A[k]; mountB(); draw(); };
    $(".gl-abt input").checked = abOn;
    $(".gl-abt input").onchange = (e) => { abOn = e.target.checked; $(".gl-ab").hidden = !abOn; $(".gl-ablab").hidden = !abOn; if (abOn) { for (const k in A) if (k !== vary) B[k] = A[k]; mountB(); } draw(); };
    $(".gl-ab").hidden = !abOn; $(".gl-ablab").hidden = !abOn; if (abOn) mountB();

    /* 先猜再看 */
    if (p.predict) {
      const box = $(".gl-opts");
      p.predict.options.forEach((t, i) => { const b = document.createElement("button"); b.type = "button"; b.className = "gl-opt"; b.setAttribute("role", "radio"); b.setAttribute("aria-checked", "false"); b.textContent = t; b.onclick = () => choose(i); box.appendChild(b); });
    }
    function choose(i) {
      if (revealed) return; guess = i; revealed = true;
      root.querySelectorAll(".gl-opt").forEach((b, k) => { b.setAttribute("aria-checked", k === i ? "true" : "false"); b.classList.toggle("pick", k === i); b.classList.toggle("ans", k === p.predict.answer); b.disabled = true; });
      $(".gl-lock").hidden = true;
      const ok = i === p.predict.answer, rv = $(".gl-reveal"); rv.hidden = false; rv.className = "gl-reveal " + (ok ? "ok" : "no");
      rv.innerHTML = `<b>${ok ? "猜对了。" : "和你猜的不一样。"}</b> ${esc(p.predict.why || "")}`;
      showConcl(); draw();
      Notebook.add(p.world, { id: p.id, kind: "guess", guess: p.predict.options[i], correct: ok }); drawNB();
    }
    function showConcl() {
      if (!p.conclusions?.length) return; const c = $(".gl-concl"); c.hidden = false;
      c.innerHTML = "<h4>结论</h4><ul>" + p.conclusions.map((x) => `<li><span class="gl-tag sm" style="--tc:${EVID[x.evidence][1]}">${EVID[x.evidence][0]}</span>${esc(x.text)}</li>`).join("") + "</ul>";
    }

    /* 绘图(DataChart 复用;模型曲线 + 可选实测数据,同一 x 轴) */
    let busy = 0;
    async function draw() {
      const tk = ++busy;
      let ra, rb;
      try { ra = await runModel(p, fn, A, xsData); rb = abOn ? await runModel(p, fn, B, xsData) : null; } catch (e) { $(".gl-diff").textContent = "模型出错:" + e.message; return; }
      if (tk !== busy) return;
      last = { ra, rb };
      const cols = [p.model.x?.k || (p.model.type === "ode" ? "t" : "x")], ys = [], series = [];
      ra.ys.forEach((s, i) => { cols.push("a" + i); ys.push({ col: "a" + i, label: (abOn ? "A · " : "") + s.label, color: s.color || color }); series.push(s.v); });
      if (rb) rb.ys.forEach((s, i) => { cols.push("b" + i); ys.push({ col: "b" + i, label: "B · " + s.label, color: "#9fd6ff" }); series.push(s.v); });
      let xs = ra.xs;
      if (data && p.data.ys) {
        const dx = data.col(p.data.x), map = new Map(dx.map((x, i) => [x, i]));
                p.data.ys.forEach((y, j) => { cols.push("d" + j); ys.push({ col: "d" + j, label: y.label || y.col, color: y.color || "#e9eefb" }); const dv = data.col(y.col); series.push(xs.map((x) => map.has(x) ? dv[map.get(x)] : NaN)); });
      }
      const rows = xs.map((x, i) => [x, ...series.map((s) => s[i])]).filter((r) => r.slice(1).some((v) => isFinite(v)));
      const meta = data ? { ...data.meta, id: data.meta.id + "+" + p.id, title: p.title, note: "实测 = 数据台账;模型曲线由本站按协议计算" } : { id: p.id, title: p.title, source: "模型计算(创世计划 Lab Kit)", license: "本站原创", retrieved: p.updated || "2026-10-31", unit: p.unit || "" };
      const D = DataSet.from({ meta, columns: cols, rows });
      const o = { data: D, x: cols[0], ys, type: p.chart?.type || "line", xlabel: p.chart?.xlabel, ylabel: p.chart?.ylabel, height: p.chart?.height || 260, from: p.chart?.from, to: p.chart?.to, marks: p.chart?.marks };
      /* DataChart.update 不换数据源,故每次重挂 */
      if (chart) chart.destroy(); chart = DataChart.mount($(".gl-chart"), o);
      $(".gl-cred").textContent = data ? "模型曲线由本站按协议计算;实测数据署名见图下" : "模型:本站按公开公式计算";
      /* A/B 差异 */
      if (rb) {
        let mi = 0, md = -1; ra.ys[0].v.forEach((v, i) => { const d = Math.abs(v - rb.ys[0].v[i]); if (isFinite(d) && d > md) { md = d; mi = i; } });
        const q = p.params.find((x) => x.k === vary);
        $(".gl-diff").innerHTML = `只改了 <b>${esc(q.label || q.k)}</b>:A = ${fmt(A[vary])},B = ${fmt(B[vary])}。差别最大在 ${esc(p.chart?.xlabel || "x")} = ${fmt(ra.xs[mi])},A ${fmt(ra.ys[0].v[mi])} 对 B ${fmt(rb.ys[0].v[mi])}。`;
      } else if (p.readout) {
        const s = ra.ys[0].v; let bi = 0; s.forEach((v, i) => { if (isFinite(v) && (p.readout === "max" ? v > s[bi] : v < s[bi])) bi = i; });
        $(".gl-diff").innerHTML = `当前${p.readout === "max" ? "最高" : "最低"}点:${esc(p.chart?.xlabel || "x")} = <b>${fmt(ra.xs[bi])}</b>,${esc(ra.ys[0].label)} = <b>${fmt(s[bi])}</b>${p.unit ? " " + esc(p.unit) : ""}`;
      } else $(".gl-diff").textContent = "";
    }

    /* 记录本 */
    function drawNB() {
      const a = Notebook.list(p.world).filter((e) => e.id === p.id); $(".gl-nbn").textContent = a.length ? ` · ${a.length} 条` : "";
      $(".gl-nbl").innerHTML = a.slice(0, 12).map((e) => `<li><time>${e.t.slice(5, 16).replace("T", " ")}</time> ${e.kind === "guess" ? `猜「${esc(e.guess)}」${e.correct ? "✓" : "✗"}` : `参数 ${esc(Object.entries(e.a || {}).map(([k, v]) => k + "=" + fmt(v)).join(" "))}${e.b ? " · B " + esc(e.vary) + "=" + fmt(e.b[e.vary]) : ""}${e.note ? " · " + esc(e.note) : ""}`} <button type="button" data-t="${e.t}" aria-label="删除这条">×</button></li>`).join("");
      $(".gl-nbl").querySelectorAll("button").forEach((b) => (b.onclick = () => { Notebook.remove(p.world, b.dataset.t); drawNB(); }));
    }
    $(".gl-rec").onclick = () => { const e = { id: p.id, kind: "run", a: { ...A }, b: abOn ? { ...B } : null, vary: abOn ? vary : null, note: $(".gl-note").value.trim() }; Notebook.add(p.world, e); $(".gl-note").value = ""; drawNB(); $(".gl-nb").open = true; opts.onRecord && opts.onRecord(e); };
    $(".gl-exp").onclick = () => { const b = new Blob([Notebook.exportJSON(p.world)], { type: "application/json" }); const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = `genesis-${p.world}-lab.json`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); };
    $(".gl-link").onclick = async () => { const u = location.href.split("#")[0] + shareHash(p.id, A, abOn ? B : null); try { await navigator.clipboard.writeText(u); $(".gl-link").textContent = "已复制"; } catch (e) { prompt("复制这个链接:", u); } setTimeout(() => ($(".gl-link").textContent = "复制复现链接"), 1600); };
    $(".gl-card").onclick = async () => {
      const lines = [p.question, ...(p.conclusions || []).slice(0, 3).map((c) => `【${EVID[c.evidence][0]}】${c.text}`)];
      const dataKV = Object.fromEntries(p.params.slice(0, 4).map((q) => [q.label || q.k, fmt(A[q.k]) + (q.unit ? " " + q.unit : "")]));
      const blob = await Card.make({ kind: "model", task: p.id, title: p.title, lines, data: dataKV }); Card.share(blob, `${p.id}.png`);
    };
    $(".gl-reset").onclick = () => { Object.assign(A, def); Object.assign(B, def); mountA(); if (abOn) mountB(); draw(); };
    if (p.bridges?.length) { const br = $(".gl-bridge"); br.innerHTML = "星桥:" + p.bridges.map((b) => `<button type="button" class="gl-b sm" data-b="${esc(b)}">${esc(b)}</button>`).join(" "); br.querySelectorAll("button").forEach((b) => (b.onclick = () => opts.onBridge ? opts.onBridge(b.dataset.b) : null)); }

    mountA(); drawNB();
    if (revealed) showConcl();
    await draw();
    selfCheck(p).then((r) => { if (!r.length) return; const n = r.filter((x) => x.ok).length, s = $(".gl-chk"); s.hidden = false; s.textContent = `模型校验 ${n}/${r.length}`; s.className = "gl-chk " + (n === r.length ? "ok" : "no"); s.title = r.map((x) => `${x.label || ""} 期望 ${x.expect} 实算 ${fmt(x.got)}`).join("\n"); if (n < r.length) console.warn("[Lab] 模型校验未通过", p.id, r); });
    return { protocol: p, values: () => ({ A: { ...A }, B: abOn ? { ...B } : null, vary, guess }), redraw: draw, last: () => last, destroy: () => { root.remove(); } };
  }
};
