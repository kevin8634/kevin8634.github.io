/* 深空 2.5.1 · 前沿卡「最冷 9.7 pK」· 冷原子实验柜(星系层 · 宙律)
 * 纯静态、零外部请求、Canvas 2D(不需要 WebGL)、像素比 ≤ 2;本机存储 gn:deep:front:cold(只记向导问题是否走过)。
 * openCold({rm, onClose}) 打开;一张总图 = 左「百年温度阶梯」(对数刻度,数据 deep/data/frontier.cold.ladder.json)
 * + 右「实验舱」(重力开关、光强滑杆、两级光阱、物质波)。画面与原子运动为教学示意,数值端点见卡片与 docs/cold_build.py。 */
import { DataSet } from "../../core/deep/core.js";

const BASE = new URL("./", import.meta.url);
const KEY = "gn:deep:front:cold";
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const store = { get() { try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) { return {}; } }, set(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {} } };
/* 物理常数(SI / CODATA 2018)与端点(一手来源见卡片) */
const H = 6.62607015e-34, KB = 1.380649e-23, M = 86.909180527 * 1.66053906660e-27;
const lamDB = (T) => H / Math.sqrt(2 * Math.PI * M * KB * T);
const LG0 = -6, LG1 = Math.log10(3e-9), LG2 = Math.log10(9.7e-12);   // 起点约 1 μK(示意)→ 蒸发后约 3 nK → 非绝热扩散后 9.7 pK
const P0 = 5, P1 = 0.2e-3, N0 = 2e6, N1 = 2e4;                          // 5 W → 0.2 mW;约 200 万 → 2.0×10⁴ 个原子
const SPILL = 0.55;                                                     // 地面:光调到这里以下就托不住(示意阈值)
const LINKS = [
  ["北京大学新闻网 2026-11-06", "https://news.pku.edu.cn/info/2881/3325821.htm"],
  ["中国科学院 · 转光明日报", "https://www.cas.cn/cm/202611/t20261109_5123775.shtml"],
  ["Science 新闻 2026-11-05", "https://www.science.org/content/article/china-space-experiment-creates-coldest-temperature-ever"],
  ["新华社英文 2026-11-06", "https://english.news.cn/20261106/176b36efd1d645cd9c6cd4a227904fd5/c.html"]];

const CSS = `
#cl{position:fixed;inset:0;z-index:18;display:none;flex-direction:column;gap:8px;padding:10px 14px 12px;color:#e9eefb;font-size:13px;overflow:auto;
 background:radial-gradient(ellipse 60% 45% at 75% 30%,rgba(60,140,220,.22),transparent 70%),radial-gradient(ellipse 45% 40% at 15% 80%,rgba(120,90,200,.18),transparent 70%),rgba(2,5,14,.95)}
#cl.on{display:flex}#cl *{box-sizing:border-box}#cl>*{flex-shrink:0}
#cl .ch{display:flex;align-items:center;gap:10px;min-width:0}
#cl .ch .tt{flex:1;min-width:0}#cl .ch b{display:block;font-weight:500;font-size:clamp(15px,1.6vw,21px);letter-spacing:.1em;color:#d9f1ff;text-shadow:0 0 16px rgba(127,208,255,.35)}
#cl .ch span{display:block;font-size:11px;color:#8fa0c4;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#cl .btn{font:inherit;font-size:12px;color:#bfe9ff;background:rgba(10,16,36,.6);border:1px solid rgba(127,208,255,.45);border-radius:999px;padding:6px 12px;cursor:pointer;white-space:nowrap;min-height:32px}
#cl .btn:hover,#cl .btn:focus-visible{background:rgba(127,208,255,.15);outline:none}#cl .btn:focus-visible{outline:1px dashed #f2c86b;outline-offset:2px}#cl .btn:disabled{opacity:.38;cursor:default}
#cl .btn[aria-pressed="true"]{background:rgba(127,208,255,.22);color:#fff;border-color:#7fd0ff}
#cl .btn.gd{color:#f2c86b;border-color:rgba(242,200,107,.5)}
#clCv{display:block;width:100%;flex:1 0 auto;min-height:220px;border-radius:12px;background:rgba(3,7,18,.7);border:1px solid rgba(127,208,255,.18)}
#cl .cp{display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px}
#cl .seg{display:inline-flex;gap:4px}#cl .sl{display:flex;align-items:center;gap:8px;flex:1 1 220px;min-width:180px}
#cl .sl label{white-space:nowrap;color:#9fd8ff;font-size:12px}#cl .sl input{flex:1;accent-color:#7fd0ff;min-width:90px}
#clR{font-size:12px;color:#c7d3ee;line-height:1.6}#clR i{color:#8fa0c4;font-style:normal}
#clMsg{font-size:12.5px;color:#ffe2a8;min-height:1.6em;line-height:1.6}
#clG{display:flex;flex-wrap:wrap;gap:8px;align-items:flex-start}
#clG .q{flex:1 1 260px;border:1px solid rgba(242,200,107,.3);border-radius:10px;padding:8px 10px;background:rgba(242,200,107,.05)}
#clG .q b{display:block;color:#f2c86b;font-weight:500;font-size:12.5px;margin-bottom:4px}#clG .q p{margin:4px 0 0;font-size:12px;line-height:1.6;color:#c7d3ee}
#clG .q .ok{color:#7fe3a8}
#cl .ft{font-size:11px;color:#6f7a96;line-height:1.7}#cl .ft a{color:#9fd8ff}
@media (max-width:640px){#cl{padding:8px 8px 10px;gap:6px}#cl .ch span{white-space:normal}#clCv{min-height:300px}}
@media (max-height:420px){#cl{gap:5px;padding:6px 10px}#clCv{min-height:190px}#cl .btn{padding:4px 10px;min-height:28px}#clG .q{padding:5px 8px}}`;

let root = null, S = null;

function el(html) { const d = document.createElement("div"); d.innerHTML = html.trim(); return d.firstElementChild; }
const fmtT = (T) => T >= 1 ? (T >= 100 ? T.toFixed(0) : T >= 10 ? T.toFixed(1) : T.toFixed(T < 3 ? 3 : 1)) + " K" : T >= 1e-3 ? +(T * 1e3).toPrecision(3) + " mK" : T >= 1e-6 ? +(T * 1e6).toPrecision(3) + " μK" : T >= 1e-9 ? +(T * 1e9).toPrecision(3) + " nK" : +(T * 1e12).toPrecision(3) + " pK";
const fmtP = (p) => p >= 1 ? p.toFixed(p >= 10 ? 0 : 1) + " W" : p >= 1e-3 ? +(p * 1e3).toPrecision(3) + " mW" : +(p * 1e6).toPrecision(3) + " μW";
const fmtN = (n) => n >= 1e4 ? +(n / 1e4).toPrecision(3) + " 万" : String(Math.round(n));
const fmtL = (m) => m >= 1e-6 ? +(m * 1e6).toPrecision(3) + " μm" : +(m * 1e9).toPrecision(3) + " nm";

function build() {
  const st = document.createElement("style"); st.textContent = CSS; document.head.appendChild(st);
  root = el(`<div id="cl" role="dialog" aria-modal="true" aria-labelledby="clT" aria-hidden="true">
  <div class="ch"><div class="tt"><b id="clT">❄ 最冷 9.7 pK · 冷原子实验柜</b><span>给我一束光,我就能让原子停下来 · 中国空间站梦天舱 · 《科学》2026-11-05 · 画面为程序绘制的示意</span></div>
   <button class="btn" id="clSnd" aria-pressed="false" title="越冷音高越低、节奏越慢">♪ 声音 关</button><button class="btn" id="clX">✕ 返回</button></div>
  <canvas id="clCv" role="img" aria-label="百年温度阶梯与冷原子实验舱"></canvas>
  <div class="cp">
   <span class="seg" role="group" aria-label="重力"><button class="btn" id="clGnd" aria-pressed="false">🌍 地面</button><button class="btn" id="clSpc" aria-pressed="true">🛰 空间站</button></span>
   <span class="sl"><label for="clP">光强</label><input id="clP" type="range" min="0" max="1000" step="1" value="0" aria-describedby="clPv"><span id="clPv">5 W</span></span>
   <button class="btn gd" id="clD" disabled>第二步 · 扩散深冷</button><button class="btn" id="clRel">放开 · 观察</button><button class="btn" id="clRst">重来</button></div>
  <div id="clR" aria-live="polite"></div><div id="clMsg" aria-live="polite"></div>
  <div id="clG"></div>
  <div class="ft">示意:原子个数、运动、光束与「一朵波」均为程序绘制的教学示意;端点数值(5 W → 0.2 mW、约 200 万 → 2.0×10⁴ 个原子、约 3 nK、9.7 pK、地面约 0.05 s、空间站 7.0 s)与温度阶梯见卡片来源;起点约 1 μK 为示意。波长按 λ = h/√(2πmk<sub>B</sub>T) 计算。<br>前沿速递 · 一手资讯:${LINKS.map(([t, u]) => `<a href="${u}" target="_blank" rel="noopener noreferrer">${esc(t)} ↗</a>`).join(" · ")}</div></div>`);
  document.body.appendChild(root);
  const $ = (id) => root.querySelector("#" + id);
  $("clX").onclick = closeCold;
  root.addEventListener("keydown", (e) => { e.stopPropagation(); if (e.key === "Escape") { e.preventDefault(); closeCold(); } });
  ["wheel", "touchstart", "touchend", "pointerdown"].forEach((t) => root.addEventListener(t, (e) => e.stopPropagation(), { passive: true }));
  $("clGnd").onclick = () => setGravity(true); $("clSpc").onclick = () => setGravity(false);
  $("clP").oninput = (e) => { if (S.rel || S.p2 > 0 || S.spilled) return; S.s = +e.target.value / 1000; onChange("s"); };
  $("clD").onclick = () => { if (S.g || S.s < 0.985 || S.p2 > 0) return; S.p2run = true; if (S.rm) { S.p2 = 1; S.p2run = false; } onChange("d"); };
  $("clRel").onclick = release; $("clRst").onclick = () => { reset(S.g); onChange("r"); };
  $("clSnd").onclick = () => toggleSound();
  new ResizeObserver(() => { if (S && root.classList.contains("on")) { resize(); draw(); } }).observe($("clCv"));
  document.addEventListener("visibilitychange", () => { if (document.hidden && S && S.snd) stopTicks(); else if (S && S.snd && !S.rm) startTicks(); });
}

/* ---------------------------------------------------------------- 状态 */
function reset(g) {
  const keep = S ? { rm: S.rm, onClose: S.onClose, ladder: S.ladder, snd: S.snd, ac: S.ac, tick: S.tick, q: S.q } : {};
  S = Object.assign({ g: !!g, s: 0, p2: 0, p2run: false, rel: false, relT: 0, spilled: false, esc: [], atoms: [], t: 0 }, keep);
  const n = 150; let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const gs = () => Math.sqrt(-2 * Math.log(rnd() + 1e-9)) * Math.cos(2 * Math.PI * rnd());
  for (let i = 0; i < n; i++) S.atoms.push({ x: gs() * 0.33, y: gs() * 0.33, vx: gs(), vy: gs(), out: 0 });
  if (root) { root.querySelector("#clP").value = 0; root.querySelector("#clP").disabled = false; }
}
const lgT = () => S.p2 > 0 ? LG1 + (LG2 - LG1) * S.p2 : LG0 + (LG1 - LG0) * S.s;
const tau = () => Math.max(0.02, Math.min(1, (lgT() + 11.4) / 5.4));          // 0..1 视觉「热度」
const power = () => P0 * Math.pow(P1 / P0, S.s);
const nTarget = () => S.p2 > 0 ? 38 : Math.round(150 * Math.pow(38 / 150, S.s));   // 屏上原子数(示意)
const nReal = () => S.p2 > 0 ? N1 : N0 * Math.pow(N1 / N0, S.s);

function setGravity(g) {
  if (S.g === g) return; reset(g);
  root.querySelector("#clGnd").setAttribute("aria-pressed", g); root.querySelector("#clSpc").setAttribute("aria-pressed", !g);
  onChange("g");
}
function release() {
  if (S.rel || S.spilled) return; S.rel = true; S.relT = 0; root.querySelector("#clP").disabled = true;
  if (S.rm) S.relT = S.g ? 0.05 : 7; onChange("rel");
}

/* ---------------------------------------------------------------- 向导:只提问 */
const Q = [
  { id: "q1", t: "为什么到了太空,原子能更冷?", ask: "切到「地面」,再把光慢慢调弱——原子还待得住吗?换回「空间站」再试一次呢?" },
  { id: "q2", t: "把光调弱,谁会先离开?", ask: "盯住变红飞走的原子:它们是跑得快的,还是跑得慢的?", pick: ["跑得快的", "跑得慢的"] }];
function guide() {
  const G = root.querySelector("#clG"), q = S.q;
  G.innerHTML = Q.map((x) => {
    let body = `<p>${esc(x.ask)}</p>`;
    if (x.id === "q1") body += q.q1 === 2 ? `<p class="ok">✓ 地面上光一弱就托不住,原子漏下去;空间站里没有往下拉的力,极弱的光也拢得住它们。还能更冷吗?按「第二步」。</p>` : q.q1 === 1 ? `<p>原子漏下去了。那在「空间站」里,把光调到最弱会怎样?</p>` : "";
    if (x.id === "q2") body += q.q2 === 2 ? `<p class="ok">✓ 最快(最热)的原子先翻出光阱,留下的平均更慢——所以更冷。</p>` : q.q2 === 3 ? `<p>再看一次:红色的那些一出阱就飞得很快。</p><p>${x.pick.map((p, i) => `<button class="btn" data-pk="${i}">${p}</button>`).join(" ")}</p>` : q.q2 === 1 ? `<p>${x.pick.map((p, i) => `<button class="btn" data-pk="${i}">${p}</button>`).join(" ")}</p>` : "";
    return `<div class="q" data-q="${x.id}"><b>? ${esc(x.t)}</b>${body}</div>`;
  }).join("");
  G.querySelectorAll("[data-pk]").forEach((b) => b.onclick = () => { q.q2 = +b.dataset.pk === 0 ? 2 : 3; save(); guide(); });
}
const save = () => store.set({ q1: S.q.q1 === 2, q2: S.q.q2 === 2 });

/* ---------------------------------------------------------------- 变化 → 读数、消息、声音 */
function onChange(why) {
  const $ = (id) => root.querySelector("#" + id);
  if (S.g && S.s > SPILL && !S.spilled && !S.rel) { S.spilled = true; S.relT = 0; $("clP").disabled = true; if (S.q.q1 !== 2) S.q.q1 = 1; }
  if (!S.g && S.s >= 0.985 && S.q.q1 === 1) S.q.q1 = 2;
  if (S.s > 0.15 && !S.q.q2) S.q.q2 = 1;
  if (why !== "tick") { save(); guide(); }
  $("clD").disabled = S.g || S.s < 0.985 || S.p2 > 0 || S.rel;
  $("clPv").textContent = fmtP(power());
  const T = Math.pow(10, lgT());
  $("clR").innerHTML = `<i>光阱功率</i> ${fmtP(power())} · <i>示意温度</i> ${fmtT(T)} · <i>原子</i> 约 ${fmtN(nReal())} 个 · <i>物质波长</i> ${fmtL(lamDB(T))} · <i>重力</i> ${S.g ? "地面 1 g" : "微重力"}${S.rel ? ` · <i>已自由飞</i> ${S.relT.toFixed(S.g ? 3 : 1)} s` : ""}`;
  let m = "";
  if (S.spilled) m = "光太弱,托不住:重力把原子从光阱里拉了出去。地面上光阱必须够强,原子就挤得紧、冷不到底。";
  else if (S.rel && S.g) m = S.relT >= 0.05 ? "约 0.05 秒,原子云已经掉出视野(下落约 12 毫米)。要看 7 秒,得有约 240 米高的真空管。" : "放开了:原子云一边散开一边往下掉……";
  else if (S.rel) m = S.relT >= 7 ? "7 秒后它还在视野里,只是慢慢胀大:由膨胀速度反推出的就是「等效温度」。" : "放开了:没有重力,原子云原地慢慢胀大……";
  else if (S.p2 >= 1) m = "9.7 pK:原子的波长长到彼此重叠,凝成一朵波(玻色—爱因斯坦凝聚,示意)。";
  else if (S.p2 > 0) m = "原子扩散进更宽的第二束交叉光里,相互作用能降下来,温度再降约 300 倍……";
  else if (!S.g && S.s >= 0.985) m = "光已降到 0.2 mW。按「第二步 · 扩散深冷」继续。";
  else if (S.s > 0) m = "光在变弱:能量最高的原子翻出光阱飞走(红色),剩下的更冷。";
  $("clMsg").textContent = m;
  $("clCv").setAttribute("aria-label", `百年温度阶梯:室温 300 K、液氦 4.2 K、宇宙微波背景 2.725 K、1995 年 170 nK、2003 年 450 pK、2021 年 38 pK、2026 年 9.7 pK;你的原子云示意温度 ${fmtT(T)}。实验舱:${S.g ? "地面" : "空间站"}。${m}`);
  if (S.snd && why !== "tick") { if (S.rm) blip(); }
  if (S.rm && why !== "tick") { for (let i = 0; i < 90; i++) draw(1 / 60); }
  if (S.rm || why !== "tick") draw();
}

/* ---------------------------------------------------------------- 声音即规律:越冷音高越低、节奏越慢(默认静音) */
function toggleSound() {
  S.snd = !S.snd; const b = root.querySelector("#clSnd"); b.setAttribute("aria-pressed", S.snd); b.textContent = S.snd ? "♪ 声音 开" : "♪ 声音 关";
  if (S.snd) { try { S.ac = S.ac || new (window.AudioContext || window.webkitAudioContext)(); S.ac.resume && S.ac.resume(); } catch (e) { S.snd = false; return; } if (S.rm) blip(); else startTicks(); } else stopTicks();
}
function blip() {
  if (!S.ac) return; const a = S.ac, t0 = a.currentTime, o = a.createOscillator(), g = a.createGain(), k = tau();
  o.type = "sine"; o.frequency.value = 110 + 990 * Math.pow(k, 1.3); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.05, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.16);
  o.connect(g); g.connect(a.destination); o.start(t0); o.stop(t0 + 0.18);
}
function startTicks() { stopTicks(); const loop = () => { if (!S.snd) return; blip(); S.tick = setTimeout(loop, (0.16 + 1.1 * (1 - tau())) * 1000); }; loop(); }
function stopTicks() { if (S && S.tick) { clearTimeout(S.tick); S.tick = null; } }

/* ---------------------------------------------------------------- 绘制 */
let cv, g, W = 0, Hh = 0, raf = 0, last = 0;
function resize() {
  const dpr = Math.min(2, window.devicePixelRatio || 1), r = cv.getBoundingClientRect();
  W = Math.max(240, r.width); Hh = Math.max(180, r.height); cv.width = Math.round(W * dpr); cv.height = Math.round(Hh * dpr); g.setTransform(dpr, 0, 0, dpr, 0, 0);
}
function layout() {
  const narrow = W < 520, lw = Math.round(W * (narrow ? 0.5 : W < 900 ? 0.4 : 0.36));
  return { narrow, L: { x: 0, y: 0, w: lw, h: Hh }, C: { x: lw + 6, y: 8, w: W - lw - 14, h: Hh - 16 } };
}
function drawLadder(L, narrow) {
  const top = L.y + 28, bot = L.y + L.h - 18, ax = L.x + (narrow ? 34 : 46), lo = 3, hi = -12;
  const Y = (v) => top + (lo - v) / (lo - hi) * (bot - top);
  g.font = `500 ${narrow ? 11 : 12.5}px system-ui,sans-serif`; g.fillStyle = "#9fd8ff"; g.textAlign = "left"; g.fillText(narrow ? "百年温度阶梯" : "百年温度阶梯 · 对数刻度", L.x + 8, L.y + 17);
  const grd = g.createLinearGradient(0, top, 0, bot); grd.addColorStop(0, "#ff9a6b"); grd.addColorStop(0.35, "#c9a8ff"); grd.addColorStop(1, "#7fd0ff");
  g.strokeStyle = grd; g.lineWidth = 3; g.beginPath(); g.moveTo(ax, top); g.lineTo(ax, bot); g.stroke();
  g.font = `${narrow ? 9 : 10.5}px system-ui,sans-serif`; g.textAlign = "right"; g.fillStyle = "#6f7a96";
  for (let v = 3; v >= -12; v -= 3) { const y = Y(v); g.fillRect(ax - 4, y, 4, 1); g.fillText(v === 0 ? "1 K" : "10" + toSup(v), ax - 6, y + 3); }
  const rows = S.ladder || [], fs = narrow ? 9.5 : 12, gap = fs + 3;
  const pos = rows.map((r) => Y(r.lgT)); const lab = pos.slice();
  for (let i = 1; i < lab.length; i++) if (lab[i] - lab[i - 1] < gap) lab[i] = lab[i - 1] + gap;
  for (let i = lab.length - 1; i >= 0; i--) { if (lab[i] > bot + 6) lab[i] = bot + 6; if (i < lab.length - 1 && lab[i + 1] - lab[i] < gap) lab[i] = lab[i + 1] - gap; }
  g.textAlign = "left";
  rows.forEach((r, i) => {
    const y = pos[i], ly = lab[i], rec = r.kind === "record", cur = r.i === 7;
    g.fillStyle = cur ? "#ffe7a8" : rec ? "#bfe9ff" : "#8fa0c4"; g.beginPath(); g.arc(ax, y, cur ? 5 : 3.5, 0, 7); g.fill();
    g.strokeStyle = "rgba(160,200,255,.35)"; g.lineWidth = 1; g.beginPath(); g.moveTo(ax + 5, y); g.lineTo(ax + 14, ly); g.stroke();
    g.font = `${cur ? 600 : 400} ${fs}px system-ui,sans-serif`;
    const t = `${fmtT(r.T)} ${narrow ? r.short : r.label}${r.year ? " · " + r.year : ""}`;
    g.fillText(fit(t, L.x + L.w - ax - 18), ax + 16, ly + fs * 0.36);
  });
  /* 你的原子云(示意)在阶梯上的位置 */
  const v = lgT(), y = Y(v), k = tau();
  g.fillStyle = `hsl(${200 + 120 * k},90%,70%)`; g.shadowColor = g.fillStyle; g.shadowBlur = 12; g.beginPath(); g.moveTo(ax - 9, y); g.lineTo(ax - 17, y - 6); g.lineTo(ax - 17, y + 6); g.closePath(); g.fill(); g.shadowBlur = 0;
}
const SUP = { "-": "⁻", 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹" };
const toSup = (v) => String(v).split("").map((c) => SUP[c] || c).join("") + " K";
function fit(t, w) { if (g.measureText(t).width <= w) return t; while (t.length > 2 && g.measureText(t + "…").width > w) t = t.slice(0, -1); return t + "…"; }

function drawChamber(C, dt) {
  const cx = C.x + C.w / 2, cy = C.y + C.h * 0.46, R = Math.min(C.w, C.h) * 0.4, k = tau();
  g.save(); g.beginPath(); roundRect(C.x, C.y, C.w, C.h, 12); g.clip();
  g.fillStyle = "rgba(6,12,28,.85)"; g.fillRect(C.x, C.y, C.w, C.h);
  g.font = "500 12px system-ui,sans-serif"; g.fillStyle = "#9fd8ff"; g.textAlign = "left"; g.fillText(S.g ? "实验舱 · 地面(1 g)" : "实验舱 · 空间站(微重力)", C.x + 10, C.y + 18);
  /* 两级交叉光阱:内阱窄(54 μm)、外阱宽(124 μm),亮度随光强 */
  const on = S.rel || S.spilled ? 0 : 1, pin = on * (S.p2 > 0 ? 1 - S.p2 : 0.25 + 0.75 * Math.pow(1 - S.s, 1.5)), pout = on * (S.p2 > 0 ? 0.25 + 0.5 * S.p2 : 0);
  beam(cx, cy, R * 0.9, R * 0.16, Math.PI / 4, pin, "255,90,90"); beam(cx, cy, R * 0.9, R * 0.16, -Math.PI / 4, pin, "255,90,90");
  if (pout > 0) { beam(cx, cy, R * 1.05, R * 0.38, Math.PI / 4, pout * 0.6, "255,170,90"); beam(cx, cy, R * 1.05, R * 0.38, -Math.PI / 4, pout * 0.6, "255,170,90"); }
  /* 原子:谐振势 + 重力 + 蒸发(示意) */
  const A = S.atoms, vT = 0.18 + 1.9 * Math.pow(k, 1.2), w2 = S.p2 > 0 ? 3 + 6 * (1 - S.p2) : 9;
  const gv = S.g ? 6 * (S.rel || S.spilled ? 1 : 0.35 + S.s) : 0;
  if (dt > 0) {
    const want = nTarget(); let alive = A.filter((a) => !a.out);
    while (!S.rel && !S.spilled && alive.length > want) {
      let best = null, be = -1; alive.forEach((a) => { const e = a.vx * a.vx + a.vy * a.vy + w2 * (a.x * a.x + a.y * a.y); if (e > be) { be = e; best = a; } });
      const sp = Math.hypot(best.vx, best.vy) || 1, d = Math.hypot(best.x, best.y) || 1; best.out = 1; best.vx = best.vx / sp * 2.4 + best.x / d * 0.6; best.vy = best.vy / sp * 2.4 + best.y / d * 0.6; alive = A.filter((a) => !a.out);
      if (S.q.q2 === 0) S.q.q2 = 1;
    }
    const vr = Math.sqrt(alive.reduce((s, a) => s + a.vx * a.vx + a.vy * a.vy, 0) / Math.max(1, alive.length) / 2) || 1;
    const ts = 1;
    A.forEach((a) => {
      const h = dt * ts;
      if (a.out) { a.x += a.vx * h; a.y += a.vy * h; a.vy += (S.g ? 6 : 0) * h * 0.3; return; }
      if (!S.rel && !S.spilled) { a.vx += (-w2 * a.x) * h; a.vy += (-w2 * a.y + gv * 0.12) * h; const f = 1 + Math.max(-0.5, Math.min(0.5, vT / vr - 1)) * Math.min(1, 2 * h); a.vx *= f; a.vy *= f; }
      else { a.vy += gv * h; }
      a.x += a.vx * h * 0.4; a.y += a.vy * h * 0.4;
    });
  }
  const sc = R / 1.6, lam = Math.max(1.5, Math.min(R * 0.5, 2 * Math.pow(10, (LG0 - lgT()) / 2 * 0.56)));
  const alive = A.filter((a) => !a.out && Math.abs(a.x) < 4 && Math.abs(a.y) < 4);
  if (S.p2 >= 1 && !S.rel) {
    const mx = alive.reduce((s, a) => s + a.x, 0) / Math.max(1, alive.length), my = alive.reduce((s, a) => s + a.y, 0) / Math.max(1, alive.length);
    const bx = cx + mx * sc, by = cy + my * sc, rr = R * 0.42, gr = g.createRadialGradient(bx, by, 0, bx, by, rr);
    gr.addColorStop(0, "rgba(220,245,255,.95)"); gr.addColorStop(0.45, "rgba(127,208,255,.45)"); gr.addColorStop(1, "rgba(127,208,255,0)"); g.fillStyle = gr; g.beginPath(); g.arc(bx, by, rr, 0, 7); g.fill();
    const ph = S.rm ? 0 : (S.t * 0.6) % 1; g.strokeStyle = "rgba(190,235,255,.5)"; g.lineWidth = 1.2;
    for (let j = 0; j < 4; j++) { const r = rr * (0.3 + 0.2 * j + 0.2 * ph); g.beginPath(); g.arc(bx, by, r, 0, 7); g.stroke(); }
    g.fillStyle = "#e6f6ff"; g.font = "600 12px system-ui,sans-serif"; g.textAlign = "center"; g.fillText("一朵波(示意)", bx, by + rr + 14);
  } else {
    A.forEach((a) => {
      const x = cx + a.x * sc, y = cy + a.y * sc; if (x < C.x - 30 || x > C.x + C.w + 30 || y < C.y - 30 || y > C.y + C.h + 30) return;
      if (!a.out && lam > 3) { g.strokeStyle = `rgba(127,208,255,${Math.min(0.5, 0.08 + lam / 120)})`; g.lineWidth = 1; g.beginPath(); g.arc(x, y, lam, 0, 7); g.stroke(); }
      g.fillStyle = a.out ? "#ff7b6b" : `hsl(${200 + 120 * k},95%,${62 + 20 * (1 - k)}%)`; g.beginPath(); g.arc(x, y, a.out ? 2.4 : 2.2, 0, 7); g.fill();
    });
  }
  /* 视野框与说明 */
  g.strokeStyle = "rgba(160,200,255,.25)"; g.setLineDash([4, 5]); g.beginPath(); roundRect(cx - R * 1.1, cy - R * 1.1, R * 2.2, R * 2.2, 10); g.stroke(); g.setLineDash([]);
  g.font = "11px system-ui,sans-serif"; g.fillStyle = "#6f7a96"; g.textAlign = "left";
  g.fillText(fit(lam > 3 ? "蓝圈 = 每个原子的物质波大小(示意)" : "越冷,每个原子的物质波越大", C.w - 20), C.x + 10, C.y + C.h - 10);
  if (S.g) { g.fillStyle = "rgba(255,200,140,.7)"; g.textAlign = "right"; g.fillText("↓ g", C.x + C.w - 10, C.y + 18); }
  g.restore();
}
function beam(cx, cy, len, wd, ang, a, rgb) {
  if (a <= 0.01) return; g.save(); g.translate(cx, cy); g.rotate(ang);
  const gr = g.createLinearGradient(0, -wd, 0, wd); gr.addColorStop(0, `rgba(${rgb},0)`); gr.addColorStop(0.5, `rgba(${rgb},${0.32 * a})`); gr.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = gr; g.fillRect(-len, -wd, len * 2, wd * 2); g.restore();
}
function roundRect(x, y, w, h, r) { g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function draw(dt = 0) {
  if (!g) return; g.clearRect(0, 0, W, Hh); const { narrow, L, C } = layout();
  drawLadder(L, narrow); drawChamber(C, dt);
}
function frame(ts) {
  if (!root.classList.contains("on")) return;
  const dt = last ? Math.min(0.05, (ts - last) / 1000) : 0; last = ts; S.t += dt;
  if (S.p2run) { S.p2 = Math.min(1, S.p2 + dt / 2.6); if (S.p2 >= 1) { S.p2run = false; onChange("d"); } else onChange("tick"); }
  if (S.rel || S.spilled) { const lim = S.g ? 0.05 : 7; if (S.relT < lim) { S.relT = Math.min(lim, S.relT + dt * (S.g ? 0.05 / 1.6 : 1)); onChange(S.relT >= lim ? "done" : "tick"); } }
  draw(dt); raf = requestAnimationFrame(frame);
}

/* ---------------------------------------------------------------- 打开 / 关闭 */
export async function openCold(opts = {}) {
  if (!root) build();
  const rm = !!opts.rm || matchMedia("(prefers-reduced-motion: reduce)").matches;
  S = null; reset(false); S.rm = rm; S.onClose = opts.onClose; const sv = store.get(); S.q = { q1: sv.q1 ? 2 : 0, q2: sv.q2 ? 2 : 0 };
  if (!S.ladder) {
    try { const D = DataSet.from(await (await fetch(new URL("../data/frontier.cold.ladder.json", BASE))).json()); const c = D.columns;
      S.ladder = D.rows.map((r) => Object.fromEntries(c.map((k, i) => [k, r[i]]))).map((o) => ({ ...o, T: +o.T_K, lgT: +o.lgT })); } catch (e) { S.ladder = []; console.warn("温度阶梯数据未通过台账", e); }
  }
  root.querySelector("#clGnd").setAttribute("aria-pressed", "false"); root.querySelector("#clSpc").setAttribute("aria-pressed", "true");
  const sb = root.querySelector("#clSnd"); sb.setAttribute("aria-pressed", "false"); sb.textContent = "♪ 声音 关"; S.snd = false;
  root.classList.add("on"); root.setAttribute("aria-hidden", "false"); document.body.classList.add("clon");
  cv = root.querySelector("#clCv"); g = cv.getContext("2d"); resize(); onChange("open");
  root.querySelector("#clX").focus();
  if (!rm) { last = 0; cancelAnimationFrame(raf); raf = requestAnimationFrame(frame); }
}
export function closeCold() {
  if (!root || !root.classList.contains("on")) return false;
  stopTicks(); if (S) S.snd = false; cancelAnimationFrame(raf); root.classList.remove("on"); root.setAttribute("aria-hidden", "true"); document.body.classList.remove("clon");
  const cb = S && S.onClose; if (cb) cb(); return true;
}
