/* 创世计划 Genesis · 深度组件库 /core/deep/ v0.1(D0-2)
 * 总指挥维护,七世界只引用不改。零外部依赖;KaTeX 本地 vendor(MIT)按需加载。
 * 0.1 = DepthBar / Formula / Card / Depth。ParamPanel、ChainDrag、worker 见 0.2。 */
export const VERSION = "0.1.0";
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
const KIND = { derive: ["推导卡", "#7fd0ff"], model: ["模型卡", "#b08cff"], decide: ["决策卡", "#ffb36b"], hypo: ["假设卡", "#ff7fa8"] };
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

export const reducedMotion = RM;
