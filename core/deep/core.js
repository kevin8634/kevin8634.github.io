/* 创世计划 Genesis · 深度组件库 /core/deep/ v0.1(D0-2)
 * 总指挥维护,七世界只引用不改。零外部依赖;KaTeX 本地 vendor(MIT)按需加载。
 * 0.1 = DepthBar / Formula / Card / Depth;0.2 = ParamPanel / ChainDrag / Expr / Sim(worker-sim.js)。DataChart 见 0.3。 */
export const VERSION = "0.4.0";
const BASE = new URL(".", import.meta.url).href;
const RM = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Depth:深度进度,只存本机,键 gn:deep:<taskId> ---------- */
const TIERS = [["d3", "yj"], ["d2", "dx"], ["d1", "xc"]];
export const Depth = {
  key: (task) => `gn:deep:${task}`,
  get(task) {
    let o = {};
    try { o = JSON.parse(localStorage.getItem(this.key(task)) || "{}") || {}; } catch (e) { o = {}; }
    const out = { d1: !!o.d1, d2: !!o.d2, d3: !!o.d3, tier: "" };
    for (const [d, t] of TIERS) if (out[d]) { out.tier = t; break; }
    return out;
  },
  set(task, level, val = true) {
    if (!/^[a-z]{2}\.[a-z0-9_.-]+$/.test(task) || !/^d[123]$/.test(level)) throw new Error("Depth.set: 参数不合法");
    const cur = this.get(task); cur[level] = !!val; delete cur.tier;
    try { localStorage.setItem(this.key(task), JSON.stringify(cur)); } catch (e) {}
    return this.get(task);
  }
};

/* ---------- 样式注入(一次) ---------- */
let cssDone = false;
function css() {
  if (cssDone || typeof document === "undefined") return; cssDone = true;
  const l = document.createElement("link"); l.rel = "stylesheet"; l.href = BASE + "deep.css"; document.head.appendChild(l);
}

/* ---------- DepthBar:深度刻度条 ---------- */
const LV = { d1: "推导", d2: "建模", d3: "前沿" };
export const DepthBar = {
  mount(el, { task, levels = ["d1", "d2", "d3"], start, onChange = () => {}, labels = LV } = {}) {
    css();
    const box = document.createElement("div"); box.className = "gd-depthbar"; box.setAttribute("role", "tablist"); box.setAttribute("aria-label", "深度");
    let cur = start && levels.includes(start) ? start : levels[0];
    const done = task ? Depth.get(task) : {};
    const bs = levels.map((lv) => {
      const b = document.createElement("button"); b.type = "button"; b.setAttribute("role", "tab"); b.dataset.lv = lv;
      b.innerHTML = `<i></i><span>${labels[lv] || lv}</span>`; if (done[lv]) b.classList.add("done");
      b.onclick = () => set(lv, true); box.appendChild(b); return b;
    });
    box.addEventListener("keydown", (e) => {
      const i = levels.indexOf(cur);
      if (e.key === "ArrowRight" || e.key === "ArrowDown") { set(levels[Math.min(levels.length - 1, i + 1)], true); bs[levels.indexOf(cur)].focus(); e.preventDefault(); }
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") { set(levels[Math.max(0, i - 1)], true); bs[levels.indexOf(cur)].focus(); e.preventDefault(); }
    });
    function set(lv, fire) {
      cur = lv; bs.forEach((b) => { const on = b.dataset.lv === lv; b.classList.toggle("on", on); b.setAttribute("aria-selected", on); b.tabIndex = on ? 0 : -1; });
      if (fire) onChange(lv);
    }
    set(cur, false); el.appendChild(box);
    return { get value() { return cur; }, set: (lv) => set(lv, false), markDone: (lv) => { if (task) Depth.set(task, lv, true); const b = bs[levels.indexOf(lv)]; if (b) b.classList.add("done"); }, destroy: () => box.remove() };
  }
};

/* ---------- Formula:KaTeX 本地按需加载,失败退回纯文本 ---------- */
let katexP = null;
function loadKatex() {
  if (globalThis.katex) return Promise.resolve(globalThis.katex);
  if (katexP) return katexP;
  katexP = new Promise((res, rej) => {
    const l = document.createElement("link"); l.rel = "stylesheet"; l.href = BASE + "katex/katex.min.css"; document.head.appendChild(l);
    const s = document.createElement("script"); s.src = BASE + "katex/katex.min.js"; s.onload = () => res(globalThis.katex); s.onerror = rej; document.head.appendChild(s);
  });
  return katexP;
}
export const Formula = {
  async render(el, tex, { display = true } = {}) {
    css(); el.classList.add("gd-formula"); el.setAttribute("role", "math"); el.setAttribute("aria-label", tex);
    try { const k = await loadKatex(); k.render(tex, el, { displayMode: display, throwOnError: false, output: "htmlAndMathml" }); }
    catch (e) { el.textContent = tex; }
    return el;
  },
  preload: loadKatex
};

/* ---------- Card:本机生成 PNG,系统分享,不上传 ---------- */
const KIND = { derive: ["推导卡", "#7fd0ff"], model: ["模型卡", "#b08cff"], decide: ["决策卡", "#ffb36b"], hypo: ["假设卡", "#ff7fa8"], route: ["航线卡", "#7fe3a8"] };
function wrap(x, text, maxW) {
  const out = []; let line = "";
  for (const ch of String(text)) { if (x.measureText(line + ch).width > maxW && line) { out.push(line); line = ch; } else line += ch; }
  if (line) out.push(line); return out;
}
export const Card = {
  make({ kind = "derive", task = "", title = "", lines = [], data = {} } = {}) {
    const [kname, kc] = KIND[kind] || KIND.derive;
    const W = 1080, H = 1350, c = document.createElement("canvas"); c.width = W; c.height = H; const x = c.getContext("2d");
    const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#060b1d"); g.addColorStop(1, "#02040c"); x.fillStyle = g; x.fillRect(0, 0, W, H);
    for (let i = 0; i < 260; i++) { x.fillStyle = `rgba(255,255,255,${Math.random() * .6})`; const r = Math.random() * 1.6; x.beginPath(); x.arc(Math.random() * W, Math.random() * H, r, 0, 6.283); x.fill(); }
    x.strokeStyle = "rgba(232,194,122,.55)"; x.lineWidth = 2; x.strokeRect(48, 48, W - 96, H - 96);
    const F = '"PingFang SC","Microsoft YaHei",sans-serif';
    x.fillStyle = kc; x.font = `600 34px ${F}`; x.fillText(`${kname}${task ? " · " + task : ""}`, 96, 140);
    x.fillStyle = "#e9eefb"; x.font = `600 60px ${F}`; let y = 240;
    for (const l of wrap(x, title, W - 192).slice(0, 3)) { x.fillText(l, 96, y); y += 78; }
    y += 20; x.font = `36px ${F}`; x.fillStyle = "#c8d3ee";
    for (const ln of lines.slice(0, 10)) for (const l of wrap(x, ln, W - 192)) { if (y > H - 200) break; x.fillText(l, 96, y); y += 54; }
    const ks = Object.keys(data).slice(0, 4); x.font = `30px ${F}`; x.fillStyle = "#8fa0c4";
    for (const k of ks) { if (y > H - 180) break; x.fillText(`${k}:${data[k]}`, 96, y); y += 46; }
    x.fillStyle = "#e8c27a"; x.font = `600 32px ${F}`; x.fillText("创世计划 Genesis · 深空层", 96, H - 100);
    x.fillStyle = "#5d6b8c"; x.font = `24px ${F}`; x.fillText(new Date().toISOString().slice(0, 10), W - 240, H - 100);
    return new Promise((res) => c.toBlob((b) => res(b), "image/png"));
  },
  async share(blob, name = "genesis-card.png") {
    const file = new File([blob], name, { type: "image/png" });
    if (navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file], title: "创世计划" }); return "shared"; } catch (e) { if (e && e.name === "AbortError") return "cancel"; } }
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); return "download";
  }
};

/* ---------- Expr:安全表达式(白名单函数,无 eval/Function) ---------- */
const FN = { sin: Math.sin, cos: Math.cos, tan: Math.tan, exp: Math.exp, log: Math.log, sqrt: Math.sqrt, pow: Math.pow, abs: Math.abs, min: Math.min, max: Math.max };
const CONST = { pi: Math.PI, e: Math.E };
export const Expr = {
  compile(src, vars = []) {
    const tk = []; const re = /\s*(?:(\d+\.?\d*(?:e[+-]?\d+)?|\.\d+)|([a-zA-Z_]\w*)|(\*\*|[-+*/^(),]))/gy; let m, i = 0;
    src = String(src); while (i < src.length) { re.lastIndex = i; m = re.exec(src); if (!m || m[0].length === 0) { if (/^\s*$/.test(src.slice(i))) break; throw new Error("无法识别:" + src.slice(i, i + 8)); } i = re.lastIndex; tk.push(m[1] != null ? { n: +m[1] } : m[2] != null ? { id: m[2] } : { op: m[3] === "**" ? "^" : m[3] }); }
    let p = 0; const peek = () => tk[p], eat = (op) => { if (tk[p] && tk[p].op === op) { p++; return true; } return false; };
    const V = new Set(vars);
    function prim() {
      const t = tk[p++]; if (!t) throw new Error("表达式不完整");
      if (t.n != null) return () => t.n;
      if (t.op === "(") { const e = add(); if (!eat(")")) throw new Error("缺少 )"); return e; }
      if (t.op === "-") { const e = pw(); return (s) => -e(s); }
      if (t.op === "+") return pw();
      if (t.id) {
        if (FN[t.id] && eat("(")) { const args = [add()]; while (eat(",")) args.push(add()); if (!eat(")")) throw new Error("缺少 )"); const f = FN[t.id]; return (s) => f(...args.map((a) => a(s))); }
        if (V.has(t.id)) return (s) => s[t.id];
        if (t.id in CONST) return () => CONST[t.id];
        throw new Error("未知变量:" + t.id);
      }
      throw new Error("意外符号:" + t.op);
    }
    function pw() { const b = prim(); if (eat("^")) { const e = un(); return (s) => Math.pow(b(s), e(s)); } return b; }
    function un() { if (eat("-")) { const e = un(); return (s) => -e(s); } if (eat("+")) return un(); return pw(); }
    function mul() { let l = un(); for (;;) { if (eat("*")) { const a = l, b = un(); l = (s) => a(s) * b(s); } else if (eat("/")) { const a = l, b = un(); l = (s) => a(s) / b(s); } else if (peek() && (peek().id || peek().op === "(" || peek().n != null)) { const a = l, b = un(); l = (s) => a(s) * b(s); } else return l; } }
    function add() { let l = mul(); for (;;) { if (eat("+")) { const a = l, b = mul(); l = (s) => a(s) + b(s); } else if (eat("-")) { const a = l, b = mul(); l = (s) => a(s) - b(s); } else return l; } }
    const f = add(); if (p < tk.length) throw new Error("多余内容"); return f;
  }
};

/* ---------- ParamPanel:参数面板(滑杆 + 安全表达式) ---------- */
let uid = 0;
export const ParamPanel = {
  mount(el, { params = [], vars = ["t", "x"], onInput = () => {} } = {}) {
    css(); const box = document.createElement("div"); box.className = "gd-params"; const vals = {}, fns = {};
    const fire = () => onInput({ ...vals }, fns);
    for (const q of params) {
      const id = `gdp${++uid}`, row = document.createElement("div"); row.className = "gd-prow";
      if (q.type === "expr") {
        row.innerHTML = `<label for="${id}">${q.label || q.k}</label><input id="${id}" type="text" spellcheck="false" autocomplete="off"><small aria-live="polite"></small>`;
        const inp = row.querySelector("input"), msg = row.querySelector("small"); inp.value = q.value || "";
        const upd = () => { try { fns[q.k] = Expr.compile(inp.value, q.vars || vars.concat(params.filter((x) => x.type !== "expr").map((x) => x.k))); vals[q.k] = inp.value; msg.textContent = ""; inp.removeAttribute("aria-invalid"); fire(); } catch (e) { msg.textContent = e.message; inp.setAttribute("aria-invalid", "true"); } };
        inp.addEventListener("input", upd); box.appendChild(row); upd.call(); continue;
      }
      row.innerHTML = `<label for="${id}">${q.label || q.k}</label><input id="${id}" type="range" min="${q.min ?? 0}" max="${q.max ?? 1}" step="${q.step ?? "any"}"><output for="${id}"></output>`;
      const inp = row.querySelector("input"), out = row.querySelector("output"); inp.value = q.value ?? q.min ?? 0;
      const upd = () => { vals[q.k] = +inp.value; out.textContent = `${inp.value}${q.unit ? " " + q.unit : ""}`; inp.setAttribute("aria-valuetext", out.textContent); fire(); };
      inp.addEventListener("input", upd); vals[q.k] = +inp.value; out.textContent = `${inp.value}${q.unit ? " " + q.unit : ""}`; box.appendChild(row);
    }
    el.appendChild(box); fire();
    return { values: () => ({ ...vals }), fns: () => ({ ...fns }), destroy: () => box.remove() };
  }
};

/* ---------- ChainDrag:推导链排序(拖拽 + 键盘 ↑↓) ---------- */
export const ChainDrag = {
  mount(el, { steps = [], answer, onDone = () => {}, shuffle = true } = {}) {
    css(); const ans = answer || steps.map((_, i) => i);
    let order = steps.map((_, i) => i); if (shuffle) { for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; } if (order.every((v, i) => v === ans[i]) && order.length > 1) [order[0], order[1]] = [order[1], order[0]]; }
    const box = document.createElement("div"); box.className = "gd-chain"; const ol = document.createElement("ol"); ol.setAttribute("aria-label", "推导步骤排序:选中后按上下键移动");
    const chk = document.createElement("button"); chk.type = "button"; chk.className = "gd-chk"; chk.textContent = "检查顺序"; const msg = document.createElement("p"); msg.setAttribute("aria-live", "polite");
    let drag = null;
    function draw(focus) {
      ol.innerHTML = ""; order.forEach((si, pos) => {
        const li = document.createElement("li"); li.tabIndex = 0; li.draggable = true; li.textContent = steps[si]; li.dataset.pos = pos;
        li.addEventListener("keydown", (e) => { const d = e.key === "ArrowUp" ? -1 : e.key === "ArrowDown" ? 1 : 0; if (!d) return; const np = pos + d; if (np < 0 || np >= order.length) return; [order[pos], order[np]] = [order[np], order[pos]]; e.preventDefault(); e.stopPropagation(); draw(np); });
        li.addEventListener("dragstart", () => { drag = pos; li.classList.add("drag"); });
        li.addEventListener("dragover", (e) => e.preventDefault());
        li.addEventListener("drop", (e) => { e.preventDefault(); if (drag == null) return; const [v] = order.splice(drag, 1); order.splice(pos, 0, v); drag = null; draw(pos); });
        li.addEventListener("dragend", () => li.classList.remove("drag"));
        ol.appendChild(li); if (focus === pos) li.focus();
      });
    }
    chk.onclick = () => { const ok = order.every((v, i) => v === ans[i]); msg.textContent = ok ? "顺序正确。" : "还不对,看看哪一步要先成立。"; msg.className = ok ? "ok" : "no"; onDone(ok); };
    box.append(ol, chk, msg); el.appendChild(box); draw();
    return { order: () => order.slice(), destroy: () => box.remove() };
  }
};

/* ---------- Sim:通用数值积分 Worker(RK4) ---------- */
export const Sim = {
  /* rhs:安全表达式数组,变量为 t 与状态名;返回 Promise<[[t,...y]]> */
  run({ state = {}, rhs = {}, params = {}, dt = 0.01, steps = 1000, every = 10 } = {}) {
    return new Promise((res, rej) => {
      const w = new Worker(BASE + "worker-sim.js");
      w.onmessage = (e) => { w.terminate(); e.data.error ? rej(new Error(e.data.error)) : res(e.data.out); };
      w.onerror = (e) => { w.terminate(); rej(e); };
      w.postMessage({ state, rhs, params, dt, steps, every, expr: BASE + "core.js" });
    });
  }
};

/* ===== 0.3 数据台账接口 Ledger + DataSet ===== */
const REQ = ["id", "title", "source", "license", "retrieved"];
const NC = /非商业|noncommercial|non-commercial|\bNC\b/i;
const _ledger = new Map();
export const Ledger = {
  REQUIRED: REQ,
  /* 校验一条数据台账,返回缺失/问题列表(空数组=通过) */
  validate(m) {
    const bad = [];
    if (!m || typeof m !== "object") return ["meta 缺失"];
    for (const k of REQ) if (m[k] == null || String(m[k]).trim() === "") bad.push(k + " 缺失");
    if (m.retrieved && !/^\d{4}-\d{2}-\d{2}$/.test(m.retrieved)) bad.push("retrieved 须为 YYYY-MM-DD");
    if (m.url && !/^https:\/\//.test(m.url)) bad.push("url 须为 https");
    return bad;
  },
  register(m) {
    const bad = Ledger.validate(m);
    if (bad.length) throw new Error("数据台账不完整:" + bad.join(";"));
    const e = Object.assign({ unit: "", ai_generated: false, note: "" }, m, { nc: NC.test(m.license) });
    _ledger.set(m.id, e);
    return e;
  },
  get: (id) => _ledger.get(id),
  list: () => [..._ledger.values()],
  /* 署名一行:图表角标与卡片引用共用 */
  credit(id) {
    const e = _ledger.get(id); if (!e) return "";
    return `数据:${e.source} · ${e.license} · 取于 ${e.retrieved}`;
  },
  /* 导出为 1.0 台账规范格式的 Markdown 表 */
  toMarkdown() {
    const h = "| # | 数据集 | id | 来源 | 许可 | 取用日期 | AI 生成/标注 |\n|---|---|---|---|---|---|---|\n";
    return h + Ledger.list().map((e, i) => `| ${i + 1} | ${e.title}${e.unit ? "(" + e.unit + ")" : ""} | ${e.id} | ${e.url ? `[${e.source}](${e.url})` : e.source} | ${e.license} | ${e.retrieved} | ${e.ai_generated ? "是" : "否"} |`).join("\n");
  }
};
export const DataSet = {
  /* 数据文件格式:{meta:{id,title,source,license,retrieved,url?,unit?,ai_generated?,note?},columns:[...],rows:[[...]]}
     仅允许同源相对路径,运行时零外部请求;meta 不全直接拒绝 */
  async load(src) {
    const u = new URL(src, location.href);
    if (u.origin !== location.origin) throw new Error("DataSet 只读同源本地快照:" + src);
    const r = await fetch(u.href); if (!r.ok) throw new Error("DataSet " + r.status + " " + src);
    return DataSet.from(await r.json());
  },
  from(d) {
    if (!d || !Array.isArray(d.columns) || !Array.isArray(d.rows)) throw new Error("DataSet 需要 columns 与 rows");
    const meta = Ledger.register(d.meta);
    const idx = Object.fromEntries(d.columns.map((c, i) => [c, i]));
    return { meta, columns: d.columns, rows: d.rows, col: (c) => d.rows.map((r) => +r[idx[c]]) };
  }
};

/* ===== 0.3 DataChart:canvas 2D 折线/柱/散点,可键盘、读屏表格、自动署名 ===== */
function nice(lo, hi, n = 5) {
  if (!(hi > lo)) { hi = lo + 1; }
  const raw = (hi - lo) / n, p = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / p;
  const st = (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) * p;
  const a = Math.floor(lo / st) * st, b = Math.ceil(hi / st) * st, t = [];
  for (let v = a; v <= b + st / 2; v += st) t.push(+v.toFixed(10));
  return { lo: a, hi: b, t };
}
const PAL = ["#7fd0ff", "#ffb36b", "#b08cff", "#7fe3a8", "#ff7fa8", "#e8c27a"];
const fmt = (v) => Math.abs(v) >= 1e4 || (Math.abs(v) < 1e-2 && v !== 0) ? v.toExponential(2) : +v.toFixed(2) + "";
export const DataChart = {
  /* el:容器;opts:{data:DataSet, x:"列名", ys:[{col,label?,color?}], type:"line"|"bar"|"scatter", xlabel?, ylabel?, height?, from?, to?, marks?:[{x,label}]} */
  mount(el, opts) {
    css();
    const o = Object.assign({ type: "line", height: 220 }, opts), D = o.data;
    if (!D || !D.meta) throw new Error("DataChart 需要 DataSet(先过数据台账)");
    const box = document.createElement("figure"); box.className = "dc";
    box.style.cssText = "margin:10px 0;position:relative";
    const cv = document.createElement("canvas"); cv.tabIndex = 0; cv.setAttribute("role", "img");
    cv.style.cssText = "width:100%;display:block;background:rgba(2,4,12,.6);border-radius:8px;outline-offset:2px";
    const tip = document.createElement("div");
    tip.style.cssText = "position:absolute;pointer-events:none;font:12px/1.4 system-ui,sans-serif;background:rgba(10,14,30,.92);color:#e6ecff;border:1px solid rgba(232,194,122,.4);border-radius:6px;padding:4px 7px;display:none;white-space:nowrap";
    const cap = document.createElement("figcaption"); cap.style.cssText = "font-size:11px;color:#6c7a9c;margin-top:4px;line-height:1.5";
    cap.textContent = Ledger.credit(D.meta.id) + (D.meta.nc ? "(非商业使用)" : "");
    const tbl = document.createElement("table"); tbl.style.cssText = "position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)";
    box.append(cv, tip, cap, tbl); el.appendChild(box);
    let X, YS, cur = -1, geo;
    const prep = () => {
      let xs = D.col(o.x), keep = xs.map((v, i) => (o.from == null || v >= o.from) && (o.to == null || v <= o.to) ? i : -1).filter((i) => i >= 0);
      X = keep.map((i) => xs[i]);
      YS = o.ys.map((y, k) => ({ label: y.label || y.col, color: y.color || PAL[k % PAL.length], v: keep.map((i) => D.col(y.col)[i]) }));
      cv.setAttribute("aria-label", `${D.meta.title}:${o.ylabel || ""},${o.xlabel || o.x} ${fmt(X[0])}–${fmt(X[X.length - 1])},` + YS.map((s) => `${s.label} ${fmt(s.v[0])} 到 ${fmt(s.v[s.v.length - 1])}`).join(";"));
      tbl.innerHTML = `<caption>${D.meta.title}</caption><tr><th>${o.xlabel || o.x}</th>${YS.map((s) => `<th>${s.label}</th>`).join("")}</tr>` + X.map((x, i) => `<tr><td>${x}</td>${YS.map((s) => `<td>${s.v[i]}</td>`).join("")}</tr>`).join("");
    };
    const draw = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1), W = Math.max(200, box.clientWidth || 360), H = o.height;
      cv.width = W * dpr; cv.height = H * dpr; cv.style.height = H + "px";
      const g = cv.getContext("2d"); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
      const L = 46, R = 10, T = YS.length > 1 ? 22 : 10, B = 30;
      const all = YS.flatMap((s) => s.v).filter(Number.isFinite);
      const xr = nice(Math.min(...X), Math.max(...X)), yr = nice(o.type === "bar" ? Math.min(0, ...all) : Math.min(...all), Math.max(...all));
      if (o.type === "bar" || o.tightX !== false) { xr.lo = Math.min(...X); xr.hi = Math.max(...X); }
      const bw = o.type === "bar" ? (W - L - R) / X.length : 0;
      const px = (x) => L + bw / 2 + (xr.hi === xr.lo ? 0.5 : (x - xr.lo) / (xr.hi - xr.lo)) * (W - L - R - bw), py = (y) => T + (1 - (y - yr.lo) / (yr.hi - yr.lo)) * (H - T - B);
      geo = { px, py, L, R, T, B, W, H };
      g.font = "11px system-ui,sans-serif"; g.fillStyle = "#8a97b8"; g.strokeStyle = "rgba(140,160,200,.18)"; g.lineWidth = 1;
      g.textAlign = "right"; g.textBaseline = "middle";
      for (const v of yr.t) { const y = py(v); g.beginPath(); g.moveTo(L, y); g.lineTo(W - R, y); g.stroke(); g.fillText(fmt(v), L - 5, y); }
      g.textAlign = "center"; g.textBaseline = "top";
      const xt = nice(xr.lo, xr.hi, Math.max(2, Math.floor((W - L - R) / 70))).t.filter((v) => v >= xr.lo && v <= xr.hi);
      for (const v of xt) g.fillText(fmt(v), px(v), H - B + 6);
      if (o.ylabel) { g.save(); g.translate(11, T + (H - T - B) / 2); g.rotate(-Math.PI / 2); g.textBaseline = "middle"; g.fillText(o.ylabel, 0, 0); g.restore(); }
      for (const m of o.marks || []) { const x = px(m.x); g.save(); g.setLineDash([4, 4]); g.strokeStyle = "rgba(232,194,122,.6)"; g.beginPath(); g.moveTo(x, T); g.lineTo(x, H - B); g.stroke(); g.restore(); g.fillStyle = "#e8c27a"; g.textAlign = "left"; g.textBaseline = "top"; g.fillText(m.label || "", x + 3, T + 2); }
      YS.forEach((s, k) => {
        g.strokeStyle = g.fillStyle = s.color; g.lineWidth = 2;
        if (o.type === "line") { g.beginPath(); let st = false; s.v.forEach((v, i) => { if (!Number.isFinite(v)) { st = false; return; } st ? g.lineTo(px(X[i]), py(v)) : g.moveTo(px(X[i]), py(v)); st = true; }); g.stroke(); }
        else if (o.type === "scatter") s.v.forEach((v, i) => { if (Number.isFinite(v)) { g.beginPath(); g.arc(px(X[i]), py(v), 2.5, 0, 7); g.fill(); } });
        else { const w = Math.max(1, bw / YS.length - 1); s.v.forEach((v, i) => { const y0 = py(Math.max(0, yr.lo)), y1 = py(v); g.fillRect(px(X[i]) - bw / 2 + k * (w + 1) + .5, Math.min(y0, y1), w, Math.abs(y1 - y0)); }); }
        if (YS.length > 1) { g.textAlign = "left"; g.textBaseline = "top"; g.fillRect(L + k * 110, 6, 10, 3); g.fillText(s.label, L + 14 + k * 110, 1); }
      });
      if (cur >= 0) {
        const x = px(X[cur]); g.strokeStyle = "rgba(230,236,255,.5)"; g.lineWidth = 1; g.beginPath(); g.moveTo(x, T); g.lineTo(x, H - B); g.stroke();
        YS.forEach((s) => { if (Number.isFinite(s.v[cur])) { g.fillStyle = s.color; g.beginPath(); g.arc(x, py(s.v[cur]), 4, 0, 7); g.fill(); } });
        tip.style.display = "block"; tip.textContent = `${o.xlabel || o.x} ${X[cur]} · ` + YS.map((s) => `${s.label} ${fmt(s.v[cur])}${D.meta.unit ? " " + D.meta.unit : ""}`).join(" · ");
        const tw = tip.offsetWidth; tip.style.left = Math.min(Math.max(0, x - tw / 2), W - tw) + "px"; tip.style.top = "2px";
      } else tip.style.display = "none";
    };
    const near = (cx) => { let b = 0, d = 1e9; X.forEach((x, i) => { const e = Math.abs(geo.px(x) - cx); if (e < d) { d = e; b = i; } }); return b; };
    cv.addEventListener("pointermove", (e) => { const r = cv.getBoundingClientRect(); cur = near(e.clientX - r.left); draw(); });
    cv.addEventListener("pointerleave", () => { cur = -1; draw(); });
    cv.addEventListener("keydown", (e) => {
      const k = e.key; if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(k)) return;
      e.preventDefault(); e.stopPropagation();
      cur = k === "Home" ? 0 : k === "End" ? X.length - 1 : Math.min(X.length - 1, Math.max(0, (cur < 0 ? 0 : cur) + (k === "ArrowRight" ? 1 : -1)));
      draw();
    });
    cv.addEventListener("blur", () => { cur = -1; draw(); });
    const ro = typeof ResizeObserver === "function" ? new ResizeObserver(() => draw()) : null; ro && ro.observe(box);
    prep(); draw();
    return {
      el: box, get cursor() { return cur; },
      update(p) { Object.assign(o, p); prep(); draw(); },
      destroy() { ro && ro.disconnect(); box.remove(); }
    };
  }
};

export const reducedMotion = RM;
