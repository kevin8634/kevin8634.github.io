/* 深空 2.4 · 模型炼炉 UI(星系层)。纯静态、零外部请求;本机存储 gn:deep:forge:<炉id>:*
 * openForge(id, {rm}) 打开一炉;炉的一切内容来自 deep/forge/<id>.json,引擎见 engine.js。 */
import * as E from "./engine.js";
import { Formula, Expr } from "../../core/deep/core.js";

const BASE = new URL("./", import.meta.url);
const compile = (s, v) => Expr.compile(s, v);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const TIER = ["#5fe39a", "#ffd36b", "#ff6b6b"], GOLD = "#f2c86b";
const nf = (v, d = 2) => (!isFinite(v) ? "—" : Math.abs(v) >= 1e4 ? v.toExponential(2) : (+v).toFixed(d));
const sig = (v) => { if (!isFinite(v) || v <= 0) return 2; return Math.max(0, Math.min(6, 1 - Math.floor(Math.log10(v)))); };

const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  del(k) { try { localStorage.removeItem(k); } catch (e) {} }
};

const CSS = `
#fg{position:fixed;inset:0;z-index:18;display:none;color:#e9eefb;font-size:13px;
 background:radial-gradient(ellipse 60% 50% at 30% 20%,rgba(120,70,170,.28),transparent 70%),radial-gradient(ellipse 50% 45% at 80% 70%,rgba(30,110,120,.22),transparent 70%),rgba(2,4,12,.93);
 grid-template-columns:minmax(220px,270px) 1fr minmax(250px,310px);grid-template-rows:auto 1fr minmax(180px,27vh);grid-template-areas:"h h h" "l c r" "l b r";gap:10px;padding:10px 14px 12px;overflow:hidden}
#fg.on{display:grid}
#fg *{box-sizing:border-box}
#fgStars{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:-1}
#fg .fh{grid-area:h;display:flex;align-items:center;gap:12px;min-width:0}
#fg .fh .tt{flex:1;min-width:0}#fg .fh b{display:block;font-weight:500;font-size:clamp(16px,1.7vw,22px);letter-spacing:.12em;color:#f5e3b5;text-shadow:0 0 16px rgba(242,200,107,.35)}
#fg .fh span.s{display:block;font-size:11px;color:#8fa0c4;letter-spacing:.06em;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#fgSel{font:inherit;font-size:12px;color:#bff4ff;background:rgba(10,16,36,.75);border:1px solid rgba(160,235,255,.45);border-radius:999px;padding:5px 8px;max-width:9.5em;cursor:pointer}#fgSel:focus-visible{outline:1px dashed #f2c86b;outline-offset:2px}#fgSel[hidden]{display:none}
#fgBadge{display:flex;align-items:center;gap:6px;font-size:11px;color:#6f7a96;border:1px solid rgba(143,160,196,.25);border-radius:999px;padding:4px 10px 4px 6px;white-space:nowrap}
#fgBadge i{width:18px;height:18px;clip-path:polygon(50% 0,93% 25%,93% 75%,50% 100%,7% 75%,7% 25%);background:#38405a;display:block}
#fgBadge.lit{color:#ffe7a8;border-color:rgba(242,200,107,.6);box-shadow:0 0 18px rgba(242,200,107,.25)}#fgBadge.lit i{background:radial-gradient(circle at 40% 35%,#fff6d0,#f2c86b 55%,#b9852c)}
#fg .btn{font:inherit;font-size:12px;color:#f2c86b;background:rgba(10,16,36,.6);border:1px solid rgba(242,200,107,.45);border-radius:999px;padding:6px 12px;cursor:pointer;white-space:nowrap}
#fg .btn:hover,#fg .btn:focus-visible{background:rgba(242,200,107,.15);outline:none}#fg .btn:disabled{opacity:.4;cursor:default}
#fg .btn.cy{color:#bff4ff;border-color:rgba(160,235,255,.45)}#fg .btn.sm{padding:3px 9px;font-size:11px}
#fg .pn{background:linear-gradient(160deg,rgba(150,230,255,.07),rgba(8,14,30,.6) 40%,rgba(6,10,22,.7));border:1px solid rgba(160,235,255,.22);border-radius:12px;padding:12px;overflow:auto;min-height:0}
#fg h3{font-size:11px;font-weight:500;letter-spacing:.2em;color:#9ff0ff;margin:0 0 8px;padding-bottom:5px;border-bottom:1px solid rgba(160,235,255,.18)}
#fg h3+.cd{margin-top:-4px}#fg .cd{font-size:11px;color:#8fa0c4;line-height:1.6}
#fg .fl{grid-area:l}#fg .fr{grid-area:r}#fg .fb{grid-area:b;display:flex;gap:10px;align-items:stretch;min-height:0}
#fg .fc{grid-area:c;display:flex;flex-direction:column;min-height:0;min-width:0;position:relative}
#fgGuide{position:relative;margin:0 0 6px;padding:8px 12px 8px 40px;border:1px solid rgba(242,200,107,.35);border-radius:12px;background:rgba(20,16,8,.55);line-height:1.6;min-height:42px}
#fgGuide:before{content:"?";position:absolute;left:10px;top:9px;width:20px;height:20px;border-radius:50%;border:1px solid #f2c86b;color:#f2c86b;font-size:12px;text-align:center;line-height:19px}
#fgGuide em{display:block;font-style:normal;color:#8fa0c4;font-size:12px}#fgGuide.ok{border-color:rgba(95,227,154,.5);background:rgba(8,24,16,.55)}#fgGuide.ok:before{content:"✓";color:#5fe39a;border-color:#5fe39a}
#fg .chart{position:relative;flex:1;min-height:180px}
#fgCv{position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:pan-y}
#fgTip{position:absolute;display:none;pointer-events:none;padding:5px 9px;border-radius:8px;background:rgba(6,10,22,.92);border:1px solid rgba(242,200,107,.4);font-size:11px;white-space:nowrap;z-index:2}
#fg .lg{display:flex;flex-wrap:wrap;gap:4px 12px;font-size:11px;color:#8fa0c4;margin-top:4px}#fg .lg i{display:inline-block;width:14px;height:2px;vertical-align:middle;margin-right:4px}
/* 方程积木炉 */
#fg .tray{flex:0 0 min(34%,260px);display:flex;flex-direction:column}
#fgTray{display:flex;flex-wrap:wrap;gap:8px;align-content:flex-start}
#fg .ring{flex:1;position:relative;min-width:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:6px 10px 8px;border-radius:14px;border:1px dashed transparent;transition:border-color .2s,background .2s}
#fg .ring.drop{border-color:rgba(242,200,107,.7);background:rgba(242,200,107,.06)}
#fg .ring svg.rg{position:absolute;left:3%;right:3%;bottom:4px;width:94%;height:62%;pointer-events:none}
#fgSlots{position:relative;display:flex;gap:12px;flex-wrap:wrap;justify-content:center;min-height:64px;align-items:center}
#fgSlots .emp{color:#6f7a96;font-size:12px;letter-spacing:.08em}
#fgSum{position:relative;margin-top:6px;font-size:12px;white-space:nowrap;color:#cfd7ef;max-width:100%;overflow-x:auto;overflow-y:hidden}
#fg .ringT{position:relative;font-size:11px;letter-spacing:.24em;color:#f2c86b;margin-bottom:4px}
.fgk{position:relative;display:inline-flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;width:78px;height:64px;padding:4px 2px;cursor:grab;user-select:none;-webkit-user-select:none;touch-action:none;
 font:inherit;color:#e9fbff;border:0;background:none}
.fgk:before{content:"";position:absolute;inset:0;clip-path:polygon(25% 0,75% 0,100% 50%,75% 100%,25% 100%,0 50%);background:linear-gradient(160deg,rgba(255,255,255,.28),rgba(120,220,255,.08) 45%,rgba(40,80,120,.25));z-index:-1}
.fgk:after{content:"";position:absolute;inset:1px;clip-path:polygon(25% 0,75% 0,100% 50%,75% 100%,25% 100%,0 50%);box-shadow:inset 0 0 0 1px var(--kc,#9ff0ff);z-index:-1;opacity:.8}
.fgk .g{font-size:18px;line-height:1;color:var(--kc,#9ff0ff);text-shadow:0 0 10px var(--kc,#9ff0ff)}.fgk .n{font-size:11px;letter-spacing:.04em}.fgk .m{font-size:9px;color:#8fa0c4}
.fgk:focus-visible{outline:1px dashed #f2c86b;outline-offset:2px}.fgk.sel .n{color:#f2c86b}
.fgk .x{position:absolute;right:-4px;top:-4px;width:22px;height:22px;border-radius:50%;border:1px solid rgba(255,140,140,.6);background:rgba(30,8,12,.9);color:#ffb0b0;font-size:12px;line-height:20px;text-align:center;cursor:pointer;padding:0}
.fgk.in{filter:drop-shadow(0 0 8px var(--kc,#9ff0ff))}
#fgGhost{position:fixed;z-index:30;pointer-events:none;opacity:.9;transform:translate(-50%,-50%) scale(1.08)}
/* 拟合仪 */
#fg .dial{display:flex;gap:12px;align-items:center}
#fg .dial svg{flex:none;width:118px;height:118px}
#fgStat{flex:1;display:grid;grid-template-columns:auto 1fr;gap:2px 8px;font-size:12px;align-content:center}#fgStat dt{color:#8fa0c4}#fgStat dd{margin:0;text-align:right;font-variant-numeric:tabular-nums}
#fgPassL{font-size:11px;color:#8fa0c4;margin:6px 0 2px}#fgFitR{font-size:11px;color:#8fa0c4;line-height:1.6;margin-top:6px}#fgFitR b{color:#e9eefb;font-weight:500}
#fg .rowb{display:flex;gap:8px;flex-wrap:wrap;margin:8px 0}
#fgPar .pg{margin-top:10px;padding:8px 10px;border-left:2px solid var(--kc,#9ff0ff);background:rgba(255,255,255,.03);border-radius:0 8px 8px 0}
#fgPar .pg.sel{background:rgba(242,200,107,.07)}
#fgPar .pg>b{font-weight:500;color:var(--kc);font-size:12px}
#fgPar .fx{margin:4px 0;font-size:12px;overflow-x:auto;overflow-y:hidden}
#fgPar .nt{font-size:11px;color:#8fa0c4;line-height:1.55}
#fgPar .pr{margin-top:6px}#fgPar .pr .hd{display:flex;justify-content:space-between;gap:6px;align-items:baseline;font-size:12px}#fgPar .pr .hd span{font-variant-numeric:tabular-nums;color:#f5e3b5;text-align:right}
#fgPar .pr .sg{color:#9ff0ff;font-size:11px}
#fgPar input[type=range]{width:100%;accent-color:#f2c86b;margin:4px 0 0;height:22px}
#fgPar .lk{all:unset;cursor:pointer;font-size:10px;color:#8fa0c4;border:1px solid rgba(143,160,196,.35);border-radius:999px;padding:1px 7px;margin-left:6px}
#fgPar .lk[aria-pressed=true]{color:#ffd36b;border-color:rgba(255,211,107,.55)}
/* 胶囊 + 谱系 */
.cap{display:flex;gap:10px;padding:8px 0 10px;border-bottom:1px dashed rgba(160,235,255,.15)}
.cap .pill{flex:none;width:22px;height:46px;border-radius:12px;border:1.5px solid #7fe3ff;box-shadow:0 0 12px rgba(127,227,255,.45),inset 0 0 8px rgba(127,227,255,.3);background:linear-gradient(#123a4a 50%,rgba(127,227,255,.18) 50%);position:relative;margin-top:2px}
.cap .pill:after{content:"";position:absolute;left:-5px;right:-5px;top:21px;height:3px;border-radius:2px;background:#f2c86b;opacity:.7}
.cap.sealed .pill{background:linear-gradient(#2a3a10 50%,rgba(242,200,107,.35) 50%);border-color:#f2c86b;box-shadow:0 0 14px rgba(242,200,107,.45)}
.cap.open .pill{opacity:.55}
.cap .bd{flex:1;min-width:0}.cap b{font-weight:500;font-size:12px}.cap .tg{font-size:10px;color:#ffcf9a;border:1px solid rgba(255,179,107,.5);border-radius:999px;padding:0 6px;margin-left:6px}
.cap p{margin:3px 0;font-size:11px;color:#8fa0c4;line-height:1.55}.cap p.v{color:#e9eefb}
#fgLin{display:flex;flex-direction:column;gap:6px}
.ln{padding:6px 8px;border-radius:8px;background:rgba(255,255,255,.03);border:1px solid rgba(160,235,255,.12);font-size:11px;line-height:1.5}
.ln.cmp{border-color:rgba(255,255,255,.55)}.ln .t{display:flex;justify-content:space-between;gap:6px;color:#8fa0c4}.ln .t b{color:#e9eefb;font-weight:500}
.ln .gl{letter-spacing:.1em}.ln .ok{color:#5fe39a}.ln .rowb{margin:4px 0 0;gap:6px}
#fgToast{position:fixed;left:50%;top:18%;transform:translateX(-50%);z-index:31;padding:12px 22px;border-radius:999px;border:1px solid rgba(242,200,107,.7);background:rgba(20,16,8,.9);color:#ffe7a8;letter-spacing:.14em;box-shadow:0 0 40px rgba(242,200,107,.35);display:none}
#fgToast.on{display:block;animation:fgT 2.6s ease forwards}@keyframes fgT{0%{opacity:0;transform:translate(-50%,8px)}12%{opacity:1;transform:translate(-50%,0)}80%{opacity:1}100%{opacity:0}}
#fg.rm #fgToast.on{animation:none}
#fg .ft{font-size:10px;color:#5d6b8c;margin-top:8px;line-height:1.5}
/* 中屏 */
@media (max-width:1100px),(max-height:480px){#fgSum{font-size:10.5px}}
@media (max-width:1100px){#fg{grid-template-columns:minmax(200px,220px) 1fr minmax(240px,262px);gap:8px;padding:8px 10px 10px}#fg .tray{flex-basis:min(36%,210px)}.fgk{width:70px;height:60px}}
#fg .fs{display:contents}
/* 手机竖屏:单列滚动,图表吸顶 */
@media (max-width:760px) and (min-height:481px){
 #fg{display:none;overflow-y:auto;overflow-x:hidden;padding:0 10px 24px;-webkit-overflow-scrolling:touch}
 #fg.on{display:flex;flex-direction:column}
 #fg>*{flex:none}
 #fg .fh{position:sticky;top:0;z-index:4;background:rgba(2,4,12,.96);margin:0 -10px;padding:8px 10px}
 #fg .fh{height:56px}#fg .fh b{font-size:16px}
 #fg .fc{position:sticky;top:56px;z-index:3;background:rgba(2,4,12,.96);margin:0 -10px;padding:2px 10px 4px;height:min(44vh,290px)}
 #fgGuide{font-size:12px;padding:6px 10px 6px 34px;min-height:0;max-height:76px;overflow:auto}#fgGuide:before{left:8px;top:7px;width:18px;height:18px;line-height:17px}
 #fg .chart{min-height:150px}
 #fg .fs{display:flex;flex-direction:column;gap:10px;margin-top:10px}
 #fg .fb{flex-direction:column}#fg .tray{flex-basis:auto}
 #fg .ring{min-height:160px}
 #fg .pn{overflow:visible}
 #fg .fh .btn{padding:5px 10px}#fgBadge span{display:none}
 #fg .fh .tt{align-self:flex-start;padding-top:1px}#fg .fh span.s{display:none}
 #fgSel{position:absolute;left:10px;top:31px;font-size:11px;padding:1px 6px;max-width:10em}
}
/* 横屏矮屏:左图右滚 */
@media (max-height:480px) and (min-width:500px){
 #fg{grid-template-columns:54% 1fr;grid-template-rows:auto 1fr;grid-template-areas:"h h" "c s";padding:6px 10px 8px;gap:6px}
 #fg .fh span.s{display:none}#fg .fh b{font-size:15px}#fgBadge span{display:none}#fg .fh .btn{padding:4px 10px}
 #fgGuide{font-size:11px;padding:4px 8px 4px 30px;max-height:58px;overflow:auto;min-height:0}#fgGuide:before{left:6px;top:5px;width:16px;height:16px;line-height:15px;font-size:10px}
 #fg .chart{min-height:100px}#fg .lg{display:none}
 #fg .fs{grid-area:s;display:flex;flex-direction:column;gap:8px;overflow-y:auto;min-height:0;padding-right:2px}
 #fg .fs>*{flex:none}
 #fg .fb{flex-direction:column}#fg .tray{flex-basis:auto}#fg .ring{min-height:150px}#fg .pn{overflow:visible}
 .fgk{width:66px;height:56px}#fg .dial svg{width:96px;height:96px}
}
@media (prefers-reduced-motion:reduce){#fg .ring{transition:none}}
`;

let root = null, S = null, LIST = null; // S = 当前炉运行态
const $ = (id) => document.getElementById(id);

function buildDom() {
  if (root) return;
  const st = document.createElement("style"); st.id = "fgCss"; st.textContent = CSS; document.head.appendChild(st);
  root = document.createElement("div"); root.id = "fg"; root.setAttribute("role", "dialog"); root.setAttribute("aria-modal", "true"); root.setAttribute("aria-labelledby", "fgT"); root.setAttribute("aria-hidden", "true");
  root.innerHTML = `<canvas id="fgStars" aria-hidden="true"></canvas>
<header class="fh"><div class="tt"><b id="fgT">模型炼炉</b><span class="s" id="fgSub"></span></div><select id="fgSel" aria-label="切换炼炉" title="切换炼炉" hidden></select><div id="fgBadge" title="炉徽章"><i></i><span id="fgBadgeT"></span></div><button class="btn" id="fgX">✕ 返回深空</button></header>
<section class="fc" aria-label="模型与真实数据"><div id="fgGuide" aria-live="polite"></div><div class="chart"><canvas id="fgCv" role="img"></canvas><div id="fgTip"></div></div>
<div class="lg"><span><i style="background:${GOLD}"></i>模型</span><span><i style="background:${TIER[0]}"></i>|残差|/误差&lt;1</span><span><i style="background:${TIER[1]}"></i>1–3</span><span><i style="background:${TIER[2]}"></i>&gt;3</span><span id="fgLgC"></span></div></section>
<div class="fs"><section class="fb" aria-label="方程积木炉"><div class="pn tray"><h3>积 木 架</h3><p class="cd" id="fgTrayH">拖进下方的炉里,或点一下放入。</p><div id="fgTray"></div></div>
<div class="ring" id="fgRing"><svg class="rg" viewBox="0 0 400 120" preserveAspectRatio="none" aria-hidden="true"><ellipse cx="200" cy="72" rx="196" ry="44" fill="none" stroke="rgba(242,200,107,.55)" stroke-width="2"/><ellipse cx="200" cy="72" rx="170" ry="34" fill="none" stroke="rgba(242,200,107,.35)" stroke-width="1.2"/><ellipse cx="200" cy="80" rx="186" ry="40" fill="none" stroke="rgba(127,227,255,.35)" stroke-width="1"/><ellipse cx="200" cy="72" rx="150" ry="24" fill="rgba(127,227,255,.05)"/></svg>
<div class="ringT">方 程 积 木 炉</div><div id="fgSlots" role="list" aria-label="炉中积木"></div><div id="fgSum"></div></div></section>
<section class="pn fr" aria-label="拟合仪与参数"><h3>拟 合 仪</h3><div class="dial"><svg viewBox="0 0 120 120" aria-hidden="true"><defs><radialGradient id="fgGlow"><stop offset="0" stop-color="#7fe3ff" stop-opacity=".55"/><stop offset="1" stop-color="#7fe3ff" stop-opacity="0"/></radialGradient></defs>
<circle id="fgGl" cx="60" cy="60" r="58" fill="url(#fgGlow)" opacity=".1"/><circle cx="60" cy="60" r="46" fill="rgba(4,10,20,.7)" stroke="rgba(160,235,255,.18)" stroke-width="8"/>
<circle id="fgArc" cx="60" cy="60" r="46" fill="none" stroke="#7fe3ff" stroke-width="8" stroke-linecap="round" stroke-dasharray="0 289" transform="rotate(-90 60 60)"/>
<text id="fgSc" x="60" y="62" text-anchor="middle" fill="#e9fbff" font-size="26" font-weight="500">—</text><text x="60" y="80" text-anchor="middle" fill="#8fa0c4" font-size="9" letter-spacing="2">亮度 · 分</text></svg>
<dl id="fgStat"></dl></div><p id="fgPassL"></p>
<div class="rowb"><button class="btn cy" id="fgFit">⟲ 自动拟合</button><button class="btn" id="fgSave">✦ 保存模型</button></div><div id="fgFitR" aria-live="polite"></div>
<h3 style="margin-top:12px">参 数</h3><div id="fgPar"></div>
<p class="ft">亮度分 S = 100·exp(−max(0, (BIC−N)/N)/1.5):残差越小、参数越少越亮。BIC = χ² + k·ln N,AIC = χ² + 2k(高斯误差,省略常数项),k 为自由(未锁定)参数个数。</p></section>
<section class="pn fl" aria-label="玩法、预测胶囊与模型谱系"><h3>玩 法</h3><p class="cd" id="fgIntro"></p><h3 style="margin-top:12px">预 测 胶 囊</h3><p class="cd">把当前模型的预测封进胶囊,到期开封对答案。</p><div id="fgCap"></div>
<h3 style="margin-top:14px">模 型 谱 系</h3><p class="cd">每次「保存模型」都存在这台设备的浏览器里(不上传、无账号),可回看、载入、对比。</p><div id="fgLin"></div><p class="ft" id="fgSrc"></p></section></div>
<div id="fgToast" role="status"></div>`;
  document.body.appendChild(root);
  // 阻断背后深空层的滚轮/触摸/键盘换层
  ["wheel", "touchstart", "touchend", "pointermove", "click", "pointerdown"].forEach((t) => root.addEventListener(t, (e) => e.stopPropagation(), { passive: true }));
  addEventListener("keydown", (e) => { if (!root.classList.contains("on")) return; if (e.key === "Escape") { e.preventDefault(); close(); } e.stopImmediatePropagation(); }, true);
  $("fgX").onclick = () => close();
  $("fgFit").onclick = () => autoFit();
  $("fgSave").onclick = () => saveModel();
  $("fgSel").onchange = (e) => { const id = e.target.value; if (S && id !== S.cfg.id) { saveState(); openForge(id, { rm: root.classList.contains("rm"), onClose: onCloseCb, keep: true }).catch((er) => console.warn(er)); } }; // 深空 2.5 炉选择
  const cv = $("fgCv");
  const tipAt = (e) => { if (!S) return; const r = cv.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top; showTip(mx, my); };
  cv.addEventListener("pointermove", tipAt); cv.addEventListener("pointerdown", tipAt); cv.addEventListener("pointerleave", () => ($("fgTip").style.display = "none"));
  new ResizeObserver(() => { if (root.classList.contains("on")) { stars(); draw(); } }).observe(root);
}

let onCloseCb = null;
function close() {
  if (!root) return; root.classList.remove("on"); root.setAttribute("aria-hidden", "true"); document.body.classList.remove("fgon");
  if (S) saveState();
  if (onCloseCb) onCloseCb();
}

export function isOpen() { return !!(root && root.classList.contains("on")); }

export async function openForge(id = "dm", opt = {}) {
  buildDom(); onCloseCb = opt.onClose || null;
  root.classList.toggle("rm", !!opt.rm);
  root.classList.add("on"); root.setAttribute("aria-hidden", "false"); document.body.classList.add("fgon");
  if (!LIST) LIST = await fetch(new URL("index.json", BASE)).then((r) => (r.ok ? r.json() : [])).catch(() => []);
  if (LIST.length && !LIST.some((f) => f.id === id)) id = LIST[0].id; // 未知炉 id:回到第一炉
  const sel = $("fgSel"); if (!sel.options.length) sel.innerHTML = LIST.map((f) => `<option value="${esc(f.id)}" title="${esc(f.ver)} · ${esc(f.date)}">⚗ ${esc(f.title)}炉</option>`).join(""); sel.hidden = LIST.length < 2; sel.value = id;
  if (!S || S.cfg.id !== id) {
    let cfg, raw;
    try { cfg = await fetch(new URL(id + ".json", BASE)).then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); }); raw = await fetch(new URL(cfg.data.file, BASE)).then((r) => r.json()); }
    catch (e) { close(); throw new Error("模型炼炉「" + id + "」加载失败:" + e.message); }
    const data = E.makeData(raw, cfg.data);
    const K = (s) => `gn:deep:forge:${cfg.id}:${s}`;
    const def = { blocks: [], p: {}, lock: {} };
    cfg.blocks.forEach((b) => b.params.forEach((q) => { def.p[q.k] = q.value; if (q.lock) def.lock[q.k] = true; }));
    const sv = store.get(K("state"), null);
    const state = sv ? { blocks: (sv.blocks || []).filter((b) => cfg.blocks.some((x) => x.id === b)), p: { ...def.p, ...sv.p }, lock: { ...def.lock, ...sv.lock } } : def;
    S = { cfg, data, K, state, sigma: {}, sel: null, cmp: null, badge: store.get(K("badge"), null) };
    $("fgT").textContent = cfg.title; $("fgSub").textContent = cfg.subtitle;
    $("fgBadgeT").textContent = cfg.badge; $("fgCv").setAttribute("aria-label", cfg.title + ":真实数据星点、模型金线与残差光丝");
    $("fgIntro").textContent = cfg.intro || ""; $("fgSrc").innerHTML = "数据与方法:" + cfg.sources.map(esc).join(";") + "。";
    renderAll();
  } else { renderAll(); }
  requestAnimationFrame(() => { stars(); draw(); });
  if (!opt.keep) $("fgX").focus();
}

/* ---------- 渲染 ---------- */
function renderAll() { renderBlocks(); renderPar(); update(); renderCaps(); renderLin(); }

function blockEl(b, inRing) {
  const el = document.createElement("button");
  el.type = "button"; el.className = "fgk" + (inRing ? " in" : "") + (S.sel === b.id && inRing ? " sel" : ""); el.style.setProperty("--kc", b.color);
  el.dataset.b = b.id; el.setAttribute("aria-label", (inRing ? "炉中积木:" : "放入积木:") + b.name);
  el.innerHTML = `<span class="g">${esc(b.glyph)}</span><span class="n">${esc(b.name)}</span><span class="m">${esc(b.short)}</span>`;
  if (inRing) { const x = document.createElement("span"); x.className = "x"; x.textContent = "×"; x.setAttribute("role", "button"); x.setAttribute("aria-label", "取出 " + b.name); x.tabIndex = -1; el.appendChild(x); el.setAttribute("role", "listitem"); }
  dragify(el, b.id, inRing);
  return el;
}

function renderBlocks() {
  const T = $("fgTray"), R = $("fgSlots"); T.innerHTML = ""; R.innerHTML = "";
  const st = S.state;
  S.cfg.blocks.filter((b) => !st.blocks.includes(b.id)).forEach((b) => T.appendChild(blockEl(b, false)));
  if (!T.children.length) T.innerHTML = '<span class="cd">积木都在炉里了。</span>';
  st.blocks.forEach((id) => { const b = S.cfg.blocks.find((x) => x.id === id); if (b) R.appendChild(blockEl(b, true)); });
  if (!st.blocks.length) R.innerHTML = '<span class="emp">把积木拖到这里</span>';
  const rw = $("fgRing").clientWidth; Formula.render($("fgSum"), rw && rw < 380 && S.cfg.sumTexShort ? S.cfg.sumTexShort : S.cfg.sumTex, { display: false });
}

function addBlock(id) { const st = S.state; if (st.blocks.includes(id)) return; st.blocks.push(id); S.sel = id; S.sigma = {}; S.fitInfo = null; renderBlocks(); renderPar(); update(); }
function removeBlock(id) { const st = S.state; st.blocks = st.blocks.filter((x) => x !== id); if (S.sel === id) S.sel = null; S.sigma = {}; S.fitInfo = null; renderBlocks(); renderPar(); update(); }

/* 拖拽(指针事件,鼠标/触摸通用);未移动即视为点选 */
function dragify(el, id, inRing) {
  let sx = 0, sy = 0, drag = false, ghost = null, pid = null;
  const ring = () => $("fgRing").getBoundingClientRect();
  const over = (x, y) => { const r = ring(); return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom; };
  el.addEventListener("pointerdown", (e) => { if (e.button > 0) return; sx = e.clientX; sy = e.clientY; drag = false; pid = e.pointerId; try { el.setPointerCapture(pid); } catch (er) {} });
  el.addEventListener("pointermove", (e) => {
    if (pid !== e.pointerId) return;
    if (!drag && Math.hypot(e.clientX - sx, e.clientY - sy) > 8) { drag = true; ghost = el.cloneNode(true); ghost.id = "fgGhost"; document.body.appendChild(ghost); el.style.opacity = ".35"; }
    if (drag) { ghost.style.left = e.clientX + "px"; ghost.style.top = e.clientY + "px"; $("fgRing").classList.toggle("drop", over(e.clientX, e.clientY)); }
  });
  const end = (e, cancel) => {
    if (pid !== e.pointerId) return; pid = null;
    if (drag) {
      ghost && ghost.remove(); ghost = null; el.style.opacity = ""; $("fgRing").classList.remove("drop");
      if (!cancel) { const o = over(e.clientX, e.clientY); if (!inRing && o) addBlock(id); else if (inRing && !o) removeBlock(id); }
      drag = false; el.dataset.dragged = "1"; setTimeout(() => delete el.dataset.dragged, 50);
    }
  };
  el.addEventListener("pointerup", (e) => end(e, false)); el.addEventListener("pointercancel", (e) => end(e, true));
  el.addEventListener("click", (e) => {
    if (el.dataset.dragged) return;
    if (inRing) { const xb = el.querySelector(".x"), xr = xb && xb.getBoundingClientRect(); if (e.target.closest(".x") || (xr && e.clientX >= xr.left - 2 && e.clientX <= xr.right + 2 && e.clientY >= xr.top - 2 && e.clientY <= xr.bottom + 2 && e.detail)) { removeBlock(id); return; } S.sel = id; renderBlocks(); renderPar(); const g = document.querySelector(`#fgPar .pg[data-b="${id}"]`); if (g) g.scrollIntoView({ block: "nearest" }); }
    else addBlock(id);
  });
  el.addEventListener("keydown", (e) => { if (inRing && (e.key === "Delete" || e.key === "Backspace")) { e.preventDefault(); removeBlock(id); } });
}

/* 参数面板 */
const toS = (q, v) => (q.scale === "log" ? Math.round(1000 * Math.log(v / q.min) / Math.log(q.max / q.min)) : v);
const fromS = (q, s) => (q.scale === "log" ? q.min * Math.pow(q.max / q.min, s / 1000) : +s);
function renderPar() {
  const P = $("fgPar"), st = S.state; P.innerHTML = "";
  if (!st.blocks.length) { P.innerHTML = '<p class="cd">炉里放入积木后,这里出现它的公式和旋钮。</p>'; return; }
  st.blocks.forEach((id) => {
    const b = S.cfg.blocks.find((x) => x.id === id); if (!b) return;
    const g = document.createElement("div"); g.className = "pg" + (S.sel === id ? " sel" : ""); g.dataset.b = id; g.style.setProperty("--kc", b.color);
    g.innerHTML = `<b>${esc(b.glyph)} ${esc(b.name)}</b><div class="fx"></div><p class="nt">${esc(b.note)}</p>`;
    Formula.render(g.querySelector(".fx"), b.tex, { display: false });
    b.params.forEach((q) => {
      const r = document.createElement("div"); r.className = "pr";
      const v = st.p[q.k], lk = !!st.lock[q.k];
      r.innerHTML = `<div class="hd"><label for="fgP_${q.k}">${esc(q.name)}<button type="button" class="lk" aria-pressed="${lk}" title="锁定后不参与拟合,也不计入参数个数 k">${lk ? "🔒 固定" : "拟合"}</button></label><span><span class="vv"></span> ${esc(q.unit)} <span class="sg"></span></span></div>
<input type="range" id="fgP_${q.k}" min="${q.scale === "log" ? 0 : q.min}" max="${q.scale === "log" ? 1000 : q.max}" step="${q.scale === "log" ? 1 : q.step}" value="${toS(q, v)}" aria-valuetext="${nf(v, 3)} ${esc(q.unit)}">`;
      const inp = r.querySelector("input"), vv = r.querySelector(".vv"), sg = r.querySelector(".sg");
      const show = () => { const x = st.p[q.k]; vv.textContent = nf(x, q.dp ?? (x < 10 ? 3 : 2)); const s = S.sigma[q.k]; sg.textContent = s != null && isFinite(s) ? "± " + nf(s, sig(s)) : ""; inp.setAttribute("aria-valuetext", nf(x, 3) + " " + q.unit); };
      show(); r._show = show;
      inp.addEventListener("input", () => { st.p[q.k] = fromS(q, inp.value); S.sigma = {}; S.fitInfo = null; P.querySelectorAll(".sg").forEach((e) => (e.textContent = "")); show(); update(); });
      r.querySelector(".lk").onclick = (e) => { e.preventDefault(); st.lock[q.k] = !st.lock[q.k]; S.sigma = {}; S.fitInfo = null; renderPar(); update(); };
      g.appendChild(r);
    });
    P.appendChild(g);
  });
}

/* 计算 + 拟合仪 + 引导 + 图 */
function update() {
  const ev = E.evaluate(S.cfg, S.data, S.state, compile); S.ev = ev;
  const sc = E.score(ev), ok = E.passed(S.cfg, S.state, ev);
  $("fgSc").textContent = ev.empty ? "—" : sc;
  $("fgArc").setAttribute("stroke-dasharray", `${(289 * sc / 100).toFixed(1)} 289`);
  $("fgArc").setAttribute("stroke", ok ? "#5fe39a" : sc > 40 ? "#7fe3ff" : "#4a7f99");
  $("fgGl").setAttribute("opacity", (0.08 + 0.92 * sc / 100).toFixed(2));
  const last = store.get(S.K("lineage"), [])[0];
  const dB = last && !ev.empty ? ev.bic - last.bic : null;
  $("fgStat").innerHTML = ev.empty ? `<dt>χ²<sub>ν</sub></dt><dd>—</dd><dt>参数 k</dt><dd>0</dd><dt>数据点 N</dt><dd>${ev.N}</dd>` :
    `<dt>约化 χ²<sub>ν</sub></dt><dd style="color:${ok ? "#5fe39a" : ev.red > 10 ? "#ff8a8a" : "#ffd36b"}">${nf(ev.red, ev.red < 10 ? 2 : 1)}</dd><dt>自由参数 k</dt><dd>${ev.k}</dd><dt>数据点 N</dt><dd>${ev.N}</dd><dt>χ²</dt><dd>${nf(ev.chi2, 1)}</dd><dt>BIC</dt><dd>${nf(ev.bic, 1)}</dd><dt>AIC</dt><dd>${nf(ev.aic, 1)}</dd>${dB != null ? `<dt>ΔBIC 较上一存档</dt><dd>${dB > 0 ? "+" : ""}${nf(dB, 1)}</dd>` : ""}`;
  const P = S.cfg.pass;
  $("fgPassL").innerHTML = `过关线:χ²<sub>ν</sub> &lt; ${P.redMax}${P.require ? " 且炉中含" + P.require.map((id) => "「" + esc(S.cfg.blocks.find((b) => b.id === id).name) + "」").join("") : ""} · ${ok ? '<span style="color:#5fe39a">已达成</span>' : "未达成"}`;
  $("fgSave").disabled = ev.empty; $("fgFit").disabled = ev.empty || !E.freeParams(S.cfg, S.state).length;
  // 引导:只提问
  const g = E.guide(S.cfg, S.state, ev), G = $("fgGuide"); S.focus = g && g.focus || null;
  G.className = ok ? "ok" : ""; G.innerHTML = g ? esc(g.q) + (g.sub ? `<em>${esc(g.sub)}</em>` : "") : "";
  if (ok && !S.badge) { S.badge = new Date().toISOString(); store.set(S.K("badge"), S.badge); toast("点亮 · " + S.cfg.badge); }
  $("fgBadge").classList.toggle("lit", !!S.badge); $("fgBadge").title = S.badge ? S.cfg.badge + " · 已点亮 " + S.badge.slice(0, 10) : S.cfg.badge + " · 未点亮";
  renderFitR(); draw(); saveState(); renderCapsLive();
}

function renderFitR() {
  const F = S.fitInfo, el = $("fgFitR");
  if (!F) { el.innerHTML = ""; return; }
  const Q = Object.keys(F.sigma);
  el.innerHTML = `<b>最小二乘结果</b>(Levenberg–Marquardt,${F.iter} 步):` + Q.map((k) => { const q = paramQ(k); return `${esc(q.name)} = <b>${nf(F.p[k], sig(F.sigma[k]))} ± ${nf(F.sigma[k], sig(F.sigma[k]))}</b> ${esc(q.unit)}${F.atBound[k] ? '<span style="color:#ffd36b">(触到范围边界)</span>' : ""}`; }).join(";") +
    `。χ²<sub>ν</sub> = ${nf(F.ev.red, 3)}。σ 取 (JᵀWJ)⁻¹ 对角${F.ev.red > 1 ? ",并乘 √χ²<sub>ν</sub>" : ""};参数之间有相关,单看 σ 会低估简并。`;
}
const paramQ = (k) => { for (const b of S.cfg.blocks) for (const q of b.params) if (q.k === k) return q; return { name: k, unit: "" }; };

function autoFit() {
  const R = E.fit(S.cfg, S.data, S.state, compile);
  Object.assign(S.state.p, R.p); S.sigma = R.sigma; S.fitInfo = R;
  renderPar(); update();
}

function saveState() { if (!S) return; store.set(S.K("state"), { blocks: S.state.blocks, p: S.state.p, lock: S.state.lock }); }

/* ---------- 图 ---------- */
let geo = null;
function stars() {
  const c = $("fgStars"), dpr = Math.min(2, devicePixelRatio || 1), w = root.clientWidth, h = root.clientHeight;
  c.width = w * dpr; c.height = h * dpr; const g = c.getContext("2d"); g.scale(dpr, dpr);
  let s = 7; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < Math.round(w * h / 2600); i++) { const r = rnd() * 1.2 + .2; g.fillStyle = `rgba(${200 + rnd() * 55},${210 + rnd() * 45},255,${.15 + rnd() * .55})`; g.beginPath(); g.arc(rnd() * w, rnd() * h, r, 0, 6.283); g.fill(); }
}
function star(g, x, y, r, col) {
  const gr = g.createRadialGradient(x, y, 0, x, y, r * 3.2); gr.addColorStop(0, "rgba(255,255,255,.9)"); gr.addColorStop(.25, col); gr.addColorStop(1, "rgba(150,200,255,0)");
  g.fillStyle = gr; g.beginPath(); g.arc(x, y, r * 3.2, 0, 6.283); g.fill();
  g.fillStyle = "#fff"; g.beginPath(); g.moveTo(x, y - r * 2); g.quadraticCurveTo(x, y, x + r * 2, y); g.quadraticCurveTo(x, y, x, y + r * 2); g.quadraticCurveTo(x, y, x - r * 2, y); g.quadraticCurveTo(x, y, x, y - r * 2); g.fill();
}
function draw() {
  if (!S || !root.classList.contains("on")) return;
  const cv = $("fgCv"), box = cv.parentElement, w = box.clientWidth, h = box.clientHeight; if (w < 10 || h < 10) return;
  const dpr = Math.min(2, devicePixelRatio || 1); cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
  const g = cv.getContext("2d"); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h);
  const A = S.cfg.axes, sm = w < 420, L = sm ? 34 : 46, R = 10, T = 10, B = sm ? 26 : 32;
  // 深空 2.5:轴可为对数(axes.x.log / axes.y.log),默认线性(暗物质炉不变)
  const tx = (v) => (A.x.log ? Math.log10(v) : v), ty = (v) => (A.y.log ? Math.log10(v) : v);
  const px = (x) => L + (tx(x) - tx(A.x.min)) / (tx(A.x.max) - tx(A.x.min)) * (w - L - R), py = (y) => h - B - (ty(y) - ty(A.y.min)) / (ty(A.y.max) - ty(A.y.min)) * (h - T - B);
  geo = { px, py };
  const D = S.data, X0 = D.x[0], X1 = D.x[D.N - 1];
  // 关注区
  if (S.focus) { g.fillStyle = "rgba(242,200,107,.06)"; g.fillRect(px(Math.max(A.x.min, S.focus[0])), T, px(Math.min(A.x.max, S.focus[1])) - px(Math.max(A.x.min, S.focus[0])), h - T - B); }
  // 外推区
  g.fillStyle = "rgba(127,227,255,.04)"; g.fillRect(px(X1), T, px(A.x.max) - px(X1), h - T - B);
  // 轴
  g.strokeStyle = "rgba(143,160,196,.16)"; g.lineWidth = 1; g.fillStyle = "#8fa0c4"; g.font = (sm ? 10 : 11) + "px -apple-system,'PingFang SC',sans-serif";
  const fmt = (v) => String(+v.toPrecision(3));
  /* 对数轴刻度:每十倍 1、2、5 画网格;像素够宽才标 2、5 */
  const logTicks = (min, max, span) => { const out = []; for (let e = Math.floor(Math.log10(min)); e <= Math.ceil(Math.log10(max)); e++) for (const m of [1, 2, 5]) { const v = m * Math.pow(10, e); if (v >= min * 0.999 && v <= max * 1.001) out.push({ v, lab: m === 1 || span > 110 }); } return out; };
  const xT = A.x.log ? logTicks(A.x.min, A.x.max, (w - L - R) / (tx(A.x.max) - tx(A.x.min))) : (() => { const o = [], xs = sm ? A.x.stepSm || 20 : A.x.step || 10; for (let x = A.x.min; x <= A.x.max; x += xs) o.push({ v: x, lab: true }); return o; })();
  const yT = A.y.log ? logTicks(A.y.min, A.y.max, (h - T - B) / (ty(A.y.max) - ty(A.y.min)) * 0.5) : (() => { const o = []; for (let y = A.y.min; y <= A.y.max; y += A.y.step || 50) o.push({ v: y, lab: true }); return o; })();
  xT.forEach((t) => { g.globalAlpha = t.lab ? 1 : .55; g.beginPath(); g.moveTo(px(t.v), T); g.lineTo(px(t.v), h - B); g.stroke(); g.globalAlpha = 1; if (t.lab) { g.textAlign = "center"; g.fillText(fmt(t.v), px(t.v), h - B + 14); } });
  yT.forEach((t) => { g.globalAlpha = t.lab ? 1 : .55; g.beginPath(); g.moveTo(L, py(t.v)); g.lineTo(w - R, py(t.v)); g.stroke(); g.globalAlpha = 1; if (t.lab) { g.textAlign = "right"; g.fillText(fmt(t.v), L - 5, py(t.v) + 4); } });
  g.textAlign = "right"; g.fillText(sm ? A.x.short || A.x.label : A.x.label, w - R, h - 3);
  g.save(); g.translate(11, T + 4); g.textAlign = "left"; if (!sm) { g.rotate(Math.PI / 2); g.fillText(A.y.label, 0, 0); } g.restore();
  if (sm) { g.textAlign = "left"; g.fillText(A.y.short || "v (km/s)", L + 4, T + 10); }
  const st = S.state, ev = S.ev, nC = Math.max(80, Math.round(w / 3));
  const xsC = Array.from({ length: nC + 1 }, (_, i) => (A.x.log ? A.x.min * Math.pow(A.x.max / A.x.min, i / nC) : Math.max(0.05, A.x.min + (A.x.max - A.x.min) * i / nC)));
  const clampY = (y) => (A.y.log ? Math.max(A.y.min / 3, Math.min(A.y.max * 3, y > 0 ? y : A.y.min / 3)) : Math.max(A.y.min - 20, Math.min(A.y.max + 20, y)));
  const path = (fy, col, wd, dash) => { g.beginPath(); xsC.forEach((x, i) => { const y = clampY(fy(x)); i ? g.lineTo(px(x), py(y)) : g.moveTo(px(x), py(y)); }); g.strokeStyle = col; g.lineWidth = wd; g.setLineDash(dash || []); g.stroke(); g.setLineDash([]); };
  /* 曲线标签避让(深空 2.5 修 375×667「胶囊」与分量标签重叠):先排胶囊标签,分量标签与之相交就下移 */
  const capY = T + (sm ? 24 : 28), capS = store.get(S.K("capsules"), {}), boxes = [], labY = {};
  (S.cfg.capsules || []).forEach((c) => { const tw = g.measureText("胶囊").width, s = capS[c.id]; let ly = capY;
    if (s && isFinite(s.pred)) { const yy = py(clampY(s.pred)); boxes.push({ x0: px(c.x) - 9, x1: px(c.x) + 9, y0: yy - 9, y1: yy + 9 }); if (Math.abs(yy - (capY - 4)) < 16) ly = yy + 21; } // 封存圆圈压到标签时,标签挪到圆圈下方
    labY[c.id] = ly; boxes.push({ x0: px(c.x) - tw / 2 - 3, x1: px(c.x) + tw / 2 + 3, y0: ly - 11, y1: ly + 3 }); });
  if (!sm) { const xo = (px(X1) + px(A.x.max)) / 2, two = g.measureText("数据外").width / 2; let yo = T + 12; if (boxes.some((bx) => xo - two < bx.x1 && xo + two > bx.x0 && yo - 11 < bx.y1 && yo + 3 > bx.y0)) yo = h - B - 6; // 「数据外」也避让胶囊
    g.textAlign = "center"; g.fillStyle = "rgba(127,227,255,.55)"; g.fillText("数据外", xo, yo); boxes.push({ x0: xo - two, x1: xo + two, y0: yo - 11, y1: yo + 3 }); } // 已封存胶囊的圆圈也要避让
  // 分量
  const comps = st.blocks.map((id) => S.cfg.blocks.find((x) => x.id === id)).filter((b) => b && b.kind !== "factor");
  if (!ev.empty && comps.length > 1) { const lab = [];
    comps.forEach((b) => { g.globalAlpha = .7; path((x) => E.compAt(S.cfg, D, b, st.p, x, compile), b.color, 1.2, [4, 4]); g.globalAlpha = 1; const xe = A.x.max * .97; lab.push({ b, y: py(Math.max(A.y.min, Math.min(A.y.max, E.compAt(S.cfg, D, b, st.p, xe, compile)))) - 6, x: px(xe) }); });
    lab.sort((a, c) => a.y - c.y);
    const placed = boxes.slice();
    const hit = (x, tw, y) => placed.find((bx) => x - tw < bx.x1 && x > bx.x0 && y - 11 < bx.y1 && y + 3 > bx.y0);
    lab.forEach((l) => { const tw = g.measureText(l.b.name).width; let y = Math.max(T + 11, l.y), guard = 0, bx;
      if (hit(l.x, tw, y) && !hit(l.x, tw, l.y + 20)) y = l.y + 20; // 先试曲线下方
      while ((bx = hit(l.x, tw, y)) && guard++ < 12) y = bx.y1 + 12;
      y = Math.min(h - B - 6, y); placed.push({ x0: l.x - tw, x1: l.x, y0: y - 11, y1: y + 3 }); g.fillStyle = l.b.color; g.textAlign = "right"; g.fillText(l.b.name, l.x, y); }); }
  // 谱系对比
  if (S.cmp) { const c = S.cmp; path((x) => E.modelAt(S.cfg, D, c, x, null, compile), "rgba(255,255,255,.7)", 1.4, [6, 5]); }
  // 残差光丝
  if (!ev.empty) D.x.forEach((x, i) => { const z = ev.z[i], t = E.tier(z), c = TIER[t]; g.strokeStyle = c; g.globalAlpha = t === 0 ? .8 : .95; g.lineWidth = t === 2 ? 1.8 : 1.4; g.beginPath(); g.moveTo(px(x), py(D.y[i])); g.lineTo(px(x), py(ev.m[i])); g.stroke(); g.fillStyle = c; g.beginPath(); g.arc(px(x), py(ev.m[i]), t === 2 ? 2.4 : 1.8, 0, 6.283); g.fill(); g.globalAlpha = 1; });
  // 模型金线
  if (!ev.empty) { g.save(); g.shadowColor = GOLD; g.shadowBlur = 12; path((x) => E.modelAt(S.cfg, D, st, x, null, compile), GOLD, 2.4); g.restore(); path((x) => E.modelAt(S.cfg, D, st, x, null, compile), "rgba(255,245,215,.9)", 1); }
  // 误差棒 + 星
  D.x.forEach((x, i) => { const y = D.y[i], e = D.e[i]; g.strokeStyle = "rgba(220,235,255,.38)"; g.lineWidth = 1; g.beginPath(); g.moveTo(px(x), py(y - e)); g.lineTo(px(x), py(y + e)); g.moveTo(px(x) - 2.5, py(y - e)); g.lineTo(px(x) + 2.5, py(y - e)); g.moveTo(px(x) - 2.5, py(y + e)); g.lineTo(px(x) + 2.5, py(y + e)); g.stroke(); });
  D.x.forEach((x, i) => star(g, px(x), py(D.y[i]), sm ? 2.2 : 2.8, "rgba(170,215,255,.6)"));
  if (D.labels && S.cfg.data.showLabels) { g.fillStyle = "rgba(233,238,251,.8)"; g.font = (sm ? 9 : 11) + "px -apple-system,'PingFang SC',sans-serif"; g.textAlign = "left"; D.x.forEach((x, i) => { const t = sm || w < 640 ? D.labels[i].replace(/[(\uFF08].*[)\uFF09]/, "") : D.labels[i], tw = g.measureText(t).width, ex = px(x) + 7, ey = py(D.y[i]) + (sm ? 12 : 14);
    const bad = ex + tw > w - R || boxes.some((bx) => ex < bx.x1 && ex + tw > bx.x0 && ey - 10 < bx.y1 && ey + 2 > bx.y0);
    if (bad) { g.textAlign = "right"; g.fillText(t, px(x) - 7, py(D.y[i]) - 6); g.textAlign = "left"; } else g.fillText(t, ex, ey); }); /* 点名避让胶囊标签与右边界 */ g.font = (sm ? 10 : 11) + "px -apple-system,'PingFang SC',sans-serif"; }
  // 胶囊标记
  (S.cfg.capsules || []).forEach((c) => { const s = store.get(S.K("capsules"), {})[c.id]; g.strokeStyle = "rgba(127,227,255,.35)"; g.setLineDash([2, 4]); g.beginPath(); g.moveTo(px(c.x), T); g.lineTo(px(c.x), h - B); g.stroke(); g.setLineDash([]);
    if (s) { g.strokeStyle = "#7fe3ff"; g.lineWidth = 2; g.beginPath(); g.arc(px(c.x), py(s.pred), 6, 0, 6.283); g.stroke(); } g.fillStyle = "#7fe3ff"; g.textAlign = "center"; g.fillText("胶囊", px(c.x), labY[c.id] ?? capY); });
  if (ev.empty) { g.fillStyle = "rgba(233,238,251,.55)"; g.textAlign = "center"; g.font = (sm ? 12 : 14) + "px -apple-system,'PingFang SC',sans-serif"; const tx = S.cfg.emptyHint || "星点 = 真实观测 · 放入积木,金线就会出现"; if (w < 560) { const k = tx.indexOf("·"); g.fillText(tx.slice(0, k).trim(), (L + w - R) / 2, T + (h - T - B) * .7); g.fillText(tx.slice(k + 1).trim(), (L + w - R) / 2, T + (h - T - B) * .7 + 18); } else g.fillText(tx, (L + w - R) / 2, T + (h - T - B) * .82); }
  $("fgLgC").innerHTML = S.cmp ? '<i style="background:#fff"></i>对比:谱系 #' + S.cmp.n : "";
}

function showTip(mx, my) {
  if (!geo || !S) return; const D = S.data, ev = S.ev; let bi = -1, bd = 22;
  D.x.forEach((x, i) => { const d = Math.hypot(geo.px(x) - mx, geo.py(D.y[i]) - my); if (d < bd) { bd = d; bi = i; } });
  const tip = $("fgTip"); if (bi < 0) { tip.style.display = "none"; return; }
  const i = bi, z = ev.empty ? null : ev.z[i];
  const A = S.cfg.axes, ys = A.y.sym || "v", dp = A.y.dp ?? 1;
  tip.innerHTML = (D.labels ? esc(D.labels[i]) + " · " : "") + `${esc(A.x.sym || "r")} = ${D.x[i]} ${esc(A.x.unit || "kpc")} · ${esc(ys)} = ${D.y[i]} ± ${D.e[i]} ${esc(A.y.unit || "km/s")}` + (z == null ? "" : `<br>模型 ${nf(ev.m[i], dp)} · 残差 <span style="color:${TIER[E.tier(z)]}">${z > 0 ? "+" : ""}${nf(z, 1)}σ</span>`);
  tip.style.display = "block"; const bw = tip.offsetWidth, cw = $("fgCv").clientWidth;
  tip.style.left = Math.min(Math.max(0, geo.px(D.x[i]) - bw / 2), cw - bw) + "px"; tip.style.top = Math.max(0, geo.py(D.y[i]) - 48) + "px";
}

/* ---------- 预测胶囊 ---------- */
function capsState() { return store.get(S.K("capsules"), {}); }
function renderCaps() {
  const box = $("fgCap"); box.innerHTML = "";
  (S.cfg.capsules || []).forEach((c) => {
    const s = capsState()[c.id], now = Date.now(), due = !c.unlockAt || now >= Date.parse(c.unlockAt);
    const el = document.createElement("div"); el.className = "cap" + (s ? (s.opened ? " open" : " sealed") : ""); el.dataset.c = c.id;
    let body = `<b>${esc(c.title)}</b>${c.demo ? '<span class="tg">演示</span>' : ""}<p>${esc(c.q)}</p>`;
    if (!s) body += `<p class="v" data-live></p><div class="rowb"><button class="btn sm cy" data-a="seal">封存预测</button></div>`;
    else {
      body += `<p class="v">已封存:${esc(S.cfg.axes.y.sym || "v")} = <b>${nf(s.pred, c.dp ?? 1)}</b> ${esc(c.unit)}(${esc(s.glyphs)},χ²<sub>ν</sub> ${nf(s.red, 2)})· ${new Date(s.at).toLocaleString("zh-CN", { hour12: false })}</p>`;
      if (s.opened) {
        const T = E.capsuleTruth(S.data, c.truth), d = s.pred - T.v, n = Math.abs(d) / T.e;
        const cd = c.dp ?? 1;
        body += `<p class="v">开封:实测 ${nf(T.v, cd)} ± ${nf(T.e, cd)} ${esc(c.unit)}(${c.truth.label ? esc(c.truth.label) : T.n + " 个观测点加权平均"})· 差 ${d > 0 ? "+" : ""}${nf(d, cd)},<span style="color:${TIER[n < 1 ? 0 : n <= 3 ? 1 : 2]}">${nf(n, 1)}σ</span> ${n < 1 ? "命中" : n <= 3 ? "接近" : "偏离"}</p><div class="rowb"><button class="btn sm" data-a="reset">重新封存</button></div>`;
      } else if (due) body += `<div class="rowb"><button class="btn sm" data-a="open">开封对答案</button><button class="btn sm" data-a="reset">作废</button></div>`;
      else { const dd = Math.ceil((Date.parse(c.unlockAt) - now) / 864e5); body += `<p>到期开封:${esc(c.unlockAt.slice(0, 10))} · 还有 ${dd} 天</p><div class="rowb"><button class="btn sm" disabled>未到期</button><button class="btn sm" data-a="reset">作废</button></div>`; }
    }
    if (c.note) body += `<p>${esc(c.note)}</p>`;
    el.innerHTML = `<div class="pill" aria-hidden="true"></div><div class="bd">${body}</div>`;
    el.querySelectorAll("[data-a]").forEach((b) => (b.onclick = () => capAct(c, b.dataset.a)));
    box.appendChild(el);
  });
  renderCapsLive();
}
function renderCapsLive() {
  if (!S) return;
  (S.cfg.capsules || []).forEach((c) => { const el = document.querySelector(`#fgCap [data-c="${c.id}"]`); if (!el) return; const p = el.querySelector("[data-live]"), b = el.querySelector('[data-a="seal"]');
    if (p) p.textContent = S.ev.empty ? "炉里还没有模型,先合成一个。" : `当前模型预测:${S.cfg.axes.y.sym || "v"}(${+(+c.x).toPrecision(5)}) = ${nf(E.modelAt(S.cfg, S.data, S.state, c.x, null, compile), c.dp ?? 1)} ${c.unit}`; if (b) b.disabled = S.ev.empty; });
}
function capAct(c, a) {
  const all = capsState();
  if (a === "seal") { if (S.ev.empty) return; all[c.id] = { pred: E.modelAt(S.cfg, S.data, S.state, c.x, null, compile), blocks: S.state.blocks.slice(), p: { ...S.state.p }, red: S.ev.red, glyphs: glyphs(S.state.blocks), at: new Date().toISOString(), unlockAt: c.unlockAt || null, opened: false }; }
  if (a === "open") { if (all[c.id] && (!c.unlockAt || Date.now() >= Date.parse(c.unlockAt))) { all[c.id].opened = true; all[c.id].openedAt = new Date().toISOString(); } }
  if (a === "reset") delete all[c.id];
  store.set(S.K("capsules"), all); renderCaps(); draw();
}
const glyphs = (bl) => bl.map((id) => { const b = S.cfg.blocks.find((x) => x.id === id); return b ? b.name : id; }).join(" + ");

/* ---------- 模型谱系 ---------- */
function saveModel() {
  if (S.ev.empty) return;
  const L = store.get(S.K("lineage"), []), n = (L[0] ? L[0].n : 0) + 1, ev = S.ev;
  L.unshift({ n, at: new Date().toISOString(), blocks: S.state.blocks.slice(), p: { ...S.state.p }, lock: { ...S.state.lock }, sigma: { ...S.sigma }, chi2: ev.chi2, red: ev.red, k: ev.k, N: ev.N, aic: ev.aic, bic: ev.bic, score: E.score(ev), pass: E.passed(S.cfg, S.state, ev) });
  store.set(S.K("lineage"), L.slice(0, 40)); renderLin(); update();
}
function renderLin() {
  const L = store.get(S.K("lineage"), []), box = $("fgLin"); box.innerHTML = "";
  if (!L.length) { box.innerHTML = '<p class="cd">还没有存档。合成一个模型后点「✦ 保存模型」。</p>'; return; }
  L.forEach((m, i) => {
    const prev = L[i + 1], el = document.createElement("div"); el.className = "ln" + (S.cmp && S.cmp.n === m.n ? " cmp" : "");
    const ps = Object.keys(m.p).filter((k) => m.blocks.some((id) => S.cfg.blocks.find((b) => b.id === id).params.some((q) => q.k === k))).map((k) => `${esc(paramQ(k).name.split(" ").pop())}=${nf(m.p[k], paramQ(k).dp ?? (m.p[k] < 10 ? 3 : 2))}`).join(" ");
    el.innerHTML = `<div class="t"><b>#${m.n} ${esc(glyphs(m.blocks))}</b><span>${new Date(m.at).toLocaleString("zh-CN", { hour12: false, month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span></div>
<div>k=${m.k} · χ²<sub>ν</sub>=${nf(m.red, m.red < 10 ? 2 : 1)} · BIC=${nf(m.bic, 1)}${prev ? ` (Δ ${m.bic - prev.bic > 0 ? "+" : ""}${nf(m.bic - prev.bic, 1)})` : ""} · 分 ${m.score}${m.pass ? ' <span class="ok">✓过关</span>' : ""}</div><div class="cd">${ps}</div>
<div class="rowb"><button class="btn sm" data-a="load">载入</button><button class="btn sm cy" data-a="cmp" aria-pressed="${!!(S.cmp && S.cmp.n === m.n)}">${S.cmp && S.cmp.n === m.n ? "取消对比" : "对比"}</button><button class="btn sm" data-a="del" aria-label="删除 #${m.n}">删</button></div>`;
    el.querySelector('[data-a="load"]').onclick = () => { S.state = { blocks: m.blocks.slice(), p: { ...S.state.p, ...m.p }, lock: { ...S.state.lock, ...(m.lock || {}) } }; S.sigma = { ...(m.sigma || {}) }; S.fitInfo = null; S.sel = null; renderBlocks(); renderPar(); update(); };
    el.querySelector('[data-a="cmp"]').onclick = () => { S.cmp = S.cmp && S.cmp.n === m.n ? null : { n: m.n, blocks: m.blocks, p: m.p }; renderLin(); draw(); };
    el.querySelector('[data-a="del"]').onclick = () => { const A = store.get(S.K("lineage"), []).filter((x) => x.n !== m.n); store.set(S.K("lineage"), A); if (S.cmp && S.cmp.n === m.n) S.cmp = null; renderLin(); update(); };
    box.appendChild(el);
  });
}

let tt = 0;
function toast(t) { const e = $("fgToast"); e.textContent = "✦ " + t; e.classList.remove("on"); void e.offsetWidth; e.classList.add("on"); clearTimeout(tt); tt = setTimeout(() => e.classList.remove("on"), 2700); }

/* 自测钩子 */
export const __test = { get S() { return S; }, addBlock: (id) => addBlock(id), removeBlock: (id) => removeBlock(id), autoFit: () => autoFit(), saveModel: () => saveModel() };
