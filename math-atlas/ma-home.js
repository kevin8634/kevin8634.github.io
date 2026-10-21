/* 星图 Math Atlas · 首页沉浸版 HUD(v0.8)
 * 顶栏 / 中央 3D 舞台 / 左任务抽屉 / 右向导气泡 / 底部控件条;手机收成底部抽屉。
 * 进度只读 ma:v1:summary(不新增进度键);界面偏好存 ma:gl / ma:motion / ma:intro(与 ma:music、ma:theme 同类,仅本机)。
 */
import { createStage, detectTier, readPref, writePref, reducedMotion, introSound } from "./ma-gl.js";
import { createHomeMusic } from "./ma-music-home.js";
import { createGuideView, GUIDES } from "./ma-guides.js";

var D = document, $ = function (s) { return D.querySelector(s); };
var DATA = window.DATA, TASKS = window.TASKS.filter(function (t) { return !t.soon; }), COLORS = window.COLORS, SEE = window.SEE || {};
var LIT = window.MA_LIT || {};
var sum = readPref("ma:v1:summary") || {};

var GUIDE = {
  nim: ["松鼠博士", "桌上 10 颗松果,每次拿 1–3 颗,拿到最后一颗的赢。你想先拿,还是后拿?", ["如果只剩 4 颗、轮到你拿,会怎样?", "倒着想:哪些数量是“谁碰上谁输”?", "这些数量之间相差几?和余数有什么关系?"]],
  bee: ["蜂博士", "同样一圈蜡,围成正方形、三角形、六边形,哪个装的蜜最多?", ["哪些形状能铺满平面、不留一点缝?", "一圈是 360°,每个角多大才拼得上?", "周长一样时,形状越接近圆,面积会怎样?"]],
  nav: ["蚁博士", "城里七座桥,能不能每座只走一次,把桥全部走完?", ["每块陆地连着几座桥?", "进去一次就得出来一次,桥数是奇是偶要紧吗?", "找最短的路时,每步先走最近的,一定对吗?"]],
  secret: ["枭博士", "每个字母往后挪 3 位,HELLO 会变成什么?别人猜得出来吗?", ["英文里哪个字母出现得最多?", "钥匙是两个大质数的乘积,把它拆开难在哪?", "乘起来容易、拆开来困难,能拿来做什么?"]],
  chord: ["和弦向导", "两根弦长度比 2:1 和 3:2,为什么听起来都很和谐?", ["比越简单,两列声波重合得越多吗?", "把一个八度平均分成 12 步,每步要乘多少?", "一个复杂的声音,能拆成几个简单的波吗?"]],
  cat: ["喵博士", "一张猫的照片,在电脑眼里只是一堆数字。它怎么知道这是猫?", ["一个像素要用几个数字来表示?", "猜错了,往哪个方向改一点会更好?", "很多个简单判断叠起来,能做出复杂判断吗?"]],
  casino: ["浣熊博士", "轮盘每一局,赌场只比你多一点点胜算。玩上 1000 局,会怎样?", ["抛 10 次和抛 1000 次硬币,哪次的正面比例更接近一半?", "每押 1 元,平均能拿回多少?", "1000 个赌徒一起玩,最后谁是赢家?"]],
  epidemic: ["刺猬博士", "一个人传给两个,两个传给四个……第 10 轮会有多少人?", ["每轮翻一倍,几轮就会超过 1000?", "人和人之间的连接,让传播变快还是变慢?", "健康、生病、康复三个水桶,水怎样流?"]],
  rocket: ["狐狸船长", "从地球飞到月球,火箭至少要多快?", ["速度一直在变,怎么知道某一刻有多快?", "把每一小段路加起来,会得到什么?", "燃料越烧越轻,火箭会越飞越快吗?"]],
  cube: ["熊猫教授", "同一个动作一直重复,魔方一定会转回原样吗?", ["同一面转四次,会发生什么?", "先 A 后 B,和先 B 后 A 一样吗?", "做一个动作再“撤销”,中间能悄悄换走什么?"]]
};
var WN = { "01": "星图", "02": "宙律", "03": "元素工坊", "04": "生命源码", "05": "奇点前夜", "06": "觉弈", "07": "天枢" };
/* 星桥:以总门户 BRIDGES 为准(2026-10-21 门户 v0.8.1.4) */
var BRIDGES = {
  chord: [["02", "nv.sound", "为什么救护车经过时声音会变?", "/nomoverse/sound/"]],
  cat: [["05", "ps.cat", "让 AI 认出一只猫", "/pre-singularity/cat/"]],
  casino: [["06", "lt.survivor", "为什么「成功经验」常常骗人?", "/ludoterra/survivor/"], ["04", "ls.parents", "为什么你长得像爸妈,又不完全像?", "/life-source/parents/"]],
  secret: [["04", "ls.dna", "四个字母怎么写出一个人?", "/life-source/dna/"]],
  epidemic: [["04", "ls.virus", "一场感冒是怎么在班里传开的?", "/life-source/virus/"], ["06", "lt.compound", "每天多进步 1%,一年后会怎样?", "/ludoterra/compound/"]],
  rocket: [["07", "sh.orbit", "空间站为什么掉不下来?", "/starhelm/"], ["02", "nv.hoop", "如果引力变成两倍,篮球还能投进吗?", "/nomoverse/hoop/"]],
  cube: [["03", "ef.crystal", "晶体为什么那么整齐?", "/element-forge/crystal/"]],
  bee: [["03", "ef.carbon", "为什么钻石和铅笔芯是同一种东西?", "/element-forge/carbon/"]],
  nim: [["06", "lt.prisoner", "为什么好人不一定吃亏?", "/ludoterra/prisoner/"]]
};

var info = detectTier();
var root = D.documentElement;

function fallback(why) {
  root.removeAttribute("data-ma-gl");
  var g = $("#gl"); if (g) g.hidden = true;
  if (window.MA_classic) window.MA_classic();
  if (why) console.info("[星图] 回落经典版:", why);
}
window.MA_GL_FALLBACK = fallback;

function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

function start() {
  if (info.tier === "lo") { fallback("低画质档"); return; }
  var gl = $("#gl"); gl.hidden = false;
  var reduce = reducedMotion();
  var firstVisit = !readPref("ma:intro");
  var playIntro = firstVisit && !reduce;
  var soundOn = function () { return readPref("ma:music") === "on"; };
  var snd = null;

  var bridgesForStage = TASKS.filter(function (t) { return BRIDGES[t.id]; }).map(function (t) { return { task: t.id, stars: t.stars }; });
  var stage = createStage({
    host: $("#glStage"), titleEl: $("#glTitle"), offsetX: 130, data: DATA, colors: COLORS, lit: LIT, tier: info.tier, intro: playIntro, bridges: bridgesForStage,
    sound: playIntro && soundOn() ? (snd = introSound()) : null,
    onHud: showHud, onIntroDone: introDone,
    onHover: onHover, onPick: onPick,
    onSlow: function () { if (info.tier === "hi" && (readPref("ma:gl") || "auto") === "auto") { info.tier = "mid"; stage.setTier("mid"); syncSettings(); } },
    onLost: function () { fallback("WebGL 上下文丢失"); }
  });
  if (!stage) { fallback("无法创建渲染器"); return; }
  window.MA_STAGE = stage;
  root.classList.toggle("intro-on", playIntro);
  if (!playIntro) showHud();

  /* ---------- 开场 ---------- */
  var skip = $("#introSkip");
  skip.hidden = !playIntro;
  skip.onclick = function () { stage.skipIntro(); };
  function anySkip(e) { if (!stage.isIntro()) return; if (e.type === "keydown" && e.key !== "Escape" && e.key !== " " && e.key !== "Enter") return; stage.skipIntro(); }
  addEventListener("keydown", anySkip); $("#glStage").addEventListener("pointerdown", anySkip);
  function showHud() { root.classList.add("hud-on"); }
  function introDone() { root.classList.remove("intro-on"); skip.hidden = true; writePref("ma:intro", 1); showHud(); if (soundOn()) playBgm(); }

  /* ---------- 顶栏 ---------- */
  /* 声音:主页背景音乐「星图序曲」(ma-music-home.js);声音默认关,开场动画结束后才开始播放 */
  var M = window.MA_Music, H = createHomeMusic(), sb = $("#hSound"), waitGesture = null;
  function anyOn() { return H.on() || (M && M.on()); }
  function soundUi() { var on = anyOn(); sb.innerHTML = "♪ 声音 " + (on ? "开" : "关"); sb.title = H.on() ? "星图序曲 · 和弦 " + H.chordName() + "(在 Tonnetz 音网上按 π 的数位行走)" : "背景音乐"; sb.setAttribute("aria-pressed", on ? "true" : "false"); }
  function playBgm() {
    if (stage.isIntro()) return;           /* 开场中不播,等 introDone */
    if (M && M.on()) M.stop();
    H.start().then(soundUi).catch(function () {
      /* 浏览器自动播放拦截:等用户第一次点按后再开始 */
      if (waitGesture) return;
      waitGesture = function () { removeEventListener("pointerdown", waitGesture, true); removeEventListener("keydown", waitGesture, true); waitGesture = null; if (soundOn() && !stage.isIntro()) H.start().then(soundUi).catch(function () {}); };
      addEventListener("pointerdown", waitGesture, true); addEventListener("keydown", waitGesture, true);
    });
  }
  sb.onclick = function () {
    if (anyOn()) { H.stop(); if (M && M.on()) M.stop(); writePref("ma:music", "off"); }
    else { writePref("ma:music", "on"); playBgm(); }
    setTimeout(soundUi, 80);
  };
  H.sub(soundUi); window.MA_HOME_MUSIC = H;
  if (M && M.sub) M.sub(function () { if (M.on() && H.on()) H.stop(); soundUi(); });
  soundUi();
  if (!playIntro && soundOn()) playBgm();
  var fb = $("#hFull");
  if (!D.documentElement.requestFullscreen) fb.hidden = true;
  fb.onclick = function () { if (D.fullscreenElement) D.exitFullscreen(); else D.documentElement.requestFullscreen().catch(function () {}); };
  D.addEventListener("fullscreenchange", function () { fb.textContent = D.fullscreenElement ? "退出全屏" : "全屏"; });

  /* ---------- 左:任务抽屉 ---------- */
  var list = $("#hTaskList");
  $("#hLit").textContent = Object.keys(LIT).length; D.querySelectorAll(".lit-n").forEach(function (e) { e.textContent = Object.keys(LIT).length; });
  TASKS.forEach(function (t) {
    var s = sum[t.id] || {}, done = s.done || 0, total = s.total || t.n;
    var li = D.createElement("li");
    li.innerHTML = '<button type="button" class="ht-item" data-id="' + t.id + '" style="--c:' + t.c + '">' +
      '<span class="ht-em">' + t.em + '</span><span class="ht-txt"><b>' + esc(t.t) + '</b><span class="ht-dots">' +
      Array.from({ length: total }, function (_, i) { return "<i" + (i < done ? ' class="on"' : "") + "></i>"; }).join("") + "</span></span></button>";
    list.appendChild(li);
  });
  list.addEventListener("click", function (e) { var b = e.target.closest(".ht-item"); if (b) selectTask(b.dataset.id, true); });
  $("#hTasksToggle").onclick = function () { root.classList.toggle("sheet-open"); };

  /* ---------- 右:向导气泡 ---------- */
  var cur = null, hintI = -1;
  function selectTask(id, fromList) {
    var t = TASKS.find(function (x) { return x.id === id; }); if (!t) return;
    cur = t; hintI = -1;
    D.querySelectorAll(".ht-item").forEach(function (b) { b.classList.toggle("on", b.dataset.id === id); });
    var g = GUIDE[id] || [t.em + " 向导", t.t, []], gi = GUIDES[id];
    $("#hgName").textContent = gi ? gi.title + " · " + gi.name : g[0];
    $("#hgWhy").textContent = gi ? gi.why : "";
    if (gview) { gview.set(id); $("#hgEm").classList.add("is3d"); } else { $("#hgEm").textContent = t.em; }
    $("#hgQ").textContent = g[1]; $("#hgHint").textContent = ""; $("#hgHintBtn").textContent = "提示 0/" + g[2].length;
    $("#hgGo").href = "./" + t.id + "/"; $("#hgGo").textContent = "去这一关 →";
    $("#hgTask").textContent = t.t;
    var br = BRIDGES[id] || [];
    $("#hgBridges").innerHTML = br.length ? '<p class="hg-bt">星桥 · 同一个问题在别的世界</p>' + br.map(function (b) {
      var lab = "ma." + id + " ⇄ " + b[1] + " · " + WN[b[0]];
      return b[3] ? '<a class="hg-br" href="' + b[3] + '"><small>' + esc(lab) + "</small>" + esc(b[2]) + "</a>"
        : '<span class="hg-br off"><small>' + esc(lab) + "</small>" + esc(b[2]) + " · 即将开通</span>";
    }).join("") : "";
    $("#hGuide").hidden = false; root.classList.add("guide-on");
    var ids = t.stars.slice(), set = {}; ids.forEach(function (x) { set[x] = 1; });
    var edges = []; ids.forEach(function (x) { var n = stage.byId[x]; if (n) n.pre.forEach(function (p) { if (set[p]) edges.push([p, x]); }); });
    stage.setHighlight(ids, edges); hidePath(); hideCard();
    if (fromList && innerWidth < 760) root.classList.remove("sheet-open");
  }
  $("#hgHintBtn").onclick = function () {
    if (!cur) return; var g = GUIDE[cur.id]; if (!g || !g[2].length) return;
    hintI = (hintI + 1) % g[2].length; $("#hgHint").textContent = g[2][hintI]; this.textContent = "提示 " + (hintI + 1) + "/" + g[2].length;
  };
  var gview = null;
  try { gview = createGuideView($("#hgCanvas"), { reduce: reducedMotion() }); } catch (e) { gview = null; }
  $("#hgClose").onclick = function () { if (gview) gview.stop(); $("#hGuide").hidden = true; root.classList.remove("guide-on"); cur = null; D.querySelectorAll(".ht-item").forEach(function (b) { b.classList.remove("on"); }); stage.setHighlight([], []); };

  /* ---------- 悬停浮卡 / 点星规划路径 ---------- */
  var card = $("#hCard"), pathTag = $("#hPath"), planOn = true, pinned = null;
  function tasksOf(id) { return TASKS.filter(function (t) { return t.stars.indexOf(id) >= 0; }); }
  function cardHtml(n) {
    var pre = n.pre.map(function (p) { var q = stage.byId[p]; return q ? q.name : p; });
    var ts = tasksOf(n.id);
    return '<div class="hc-top"><span class="hc-id" style="--c:' + COLORS[n.ci] + '">' + n.id.toUpperCase() + '</span><span class="hc-st">' + (LIT[n.id] ? "✦ 已点亮" : "○ 未点亮") + "</span></div>" +
      "<b>" + esc(n.name) + "</b>" +
      '<p class="hc-row"><span style="color:' + COLORS[n.ci] + '">' + DATA.c[n.ci] + "</span> · 层级 " + "★★★★★".slice(0, n.d) + '<span class="dim">' + "★★★★★".slice(n.d) + "</span></p>" +
      (SEE[n.id] ? '<p class="hc-row">👁 看见它:' + esc(SEE[n.id]) + "</p>" : "") +
      (pre.length ? '<p class="hc-row dim">先修:' + esc(pre.join("、")) + "</p>" : '<p class="hc-row dim">起点星,无需先修</p>') +
      (ts.length ? '<p class="hc-row">点亮它:' + ts.map(function (t) { return '<a href="./' + t.id + '/">' + t.em + " " + esc(t.t) + "</a>"; }).join(" ") + "</p>" : "");
  }
  function placeAt(elm, x, y) {
    var w = elm.offsetWidth, h = elm.offsetHeight, px = x + 18, py = y + 14;
    if (px + w > innerWidth - 12) px = x - w - 18; if (py + h > innerHeight - 90) py = innerHeight - 90 - h; if (py < 70) py = 70; if (px < 12) px = 12;
    elm.style.transform = "translate(" + px + "px," + py + "px)";
  }
  function hideCard() { card.hidden = true; pinned = null; }
  function hidePath() { pathTag.hidden = true; }
  function onHover(h, x, y) {
    if (pinned) return;
    if (!h || h.type !== "star") { card.hidden = true; return; }
    card.innerHTML = cardHtml(h.star); card.hidden = false; placeAt(card, x, y);
  }
  function ancestors(id) {
    var seen = {}, out = [];
    (function walk(k) { var n = stage.byId[k]; if (!n) return; n.pre.forEach(function (p) { if (!seen[p]) { seen[p] = 1; walk(p); out.push(p); } }); })(id);
    return out;
  }
  function onPick(h, x, y) {
    if (!h) { hideCard(); hidePath(); if (!cur) stage.setHighlight([], []); return; }
    if (h.type === "bridge") { selectTask(h.task); return; }
    var n = h.star;
    pinned = n; card.innerHTML = cardHtml(n) + '<button type="button" class="hc-x" aria-label="关闭">×</button>'; card.hidden = false; placeAt(card, x, y);
    card.querySelector(".hc-x").onclick = function () { hideCard(); };
    if (!planOn) return;
    var anc = ancestors(n.id), need = anc.filter(function (a) { return !LIT[a]; });
    var set = {}; need.forEach(function (a) { set[a] = 1; }); set[n.id] = 1;
    var edges = []; Object.keys(set).forEach(function (k) { stage.byId[k].pre.forEach(function (p) { if (set[p]) edges.push([p, k]); }); });
    stage.setHighlight(Object.keys(set), edges);
    pathTag.innerHTML = "规划路径:" + DATA.c[n.ci] + " → " + esc(n.name) + (LIT[n.id] ? " · 已点亮" : need.length ? " · 先点亮 " + need.length + " 颗先修星" : " · 现在就能点亮");
    pathTag.hidden = false;

  }

  /* ---------- 底部控件条 ---------- */
  var labelsOn = false, labelEls = DATA.c.map(function (name, i) {
    var d = D.createElement("span"); d.className = "gl-cons"; d.style.setProperty("--c", COLORS[i]); d.textContent = name; $("#glLabels").appendChild(d); return d;
  });
  var V = stage.THREE.Vector3;
  stage.consCenter.forEach(function (c, i) { labelEls[i]._p = new V(c.x * 1.2, c.y + 0.9, c.z * 1.2); });
  var tickLabels = function () { if (!labelsOn) return; labelEls.forEach(function (d) { var p = stage.screenOf(d._p); d.style.transform = "translate(" + Math.round(p.x) + "px," + Math.round(p.y) + "px) translate(-50%,-50%)"; }); requestAnimationFrame(tickLabels); };
  function bar(id, fn) { var b = $(id); b.onclick = function () { fn(b); }; return b; }
  bar("#bCons", function (b) { labelsOn = !labelsOn; b.classList.toggle("on", labelsOn); $("#glLabels").hidden = !labelsOn; if (labelsOn) tickLabels(); });
  bar("#bPlan", function (b) { planOn = !planOn; b.classList.toggle("on", planOn); if (!planOn) { hidePath(); if (!cur) stage.setHighlight([], []); } });
  bar("#bLit", function (b) { var on = !b.classList.contains("on"); b.classList.toggle("on", on); stage.setOnlyLit(on); stage.wake(); });
  bar("#bTheme", function (b) { if (window.MA_openTheme) MA_openTheme(b); });
  bar("#bMusic", function (b) { if (window.MA_openMusic) MA_openMusic(b); });
  bar("#bReset", function () { stage.resetView(); stage.wake(); });
  $("#bPlan").classList.add("on");

  /* ---------- 设置 ---------- */
  var setP = $("#hSettings");
  $("#hSet").onclick = function () { setP.hidden = !setP.hidden; syncSettings(); };
  $("#hsClose").onclick = function () { setP.hidden = true; };
  function syncSettings() {
    var pref = readPref("ma:gl") || "auto", mo = readPref("ma:motion") || "auto";
    setP.querySelectorAll("[data-q]").forEach(function (b) { b.classList.toggle("on", b.dataset.q === pref); });
    setP.querySelectorAll("[data-m]").forEach(function (b) { b.classList.toggle("on", b.dataset.m === mo); });
    $("#hsNow").textContent = "当前:" + ({ hi: "高", mid: "中", lo: "低" })[info.tier] + (pref === "auto" ? "(自动检测)" : "");
  }
  setP.addEventListener("click", function (e) {
    var q = e.target.closest("[data-q]"), m = e.target.closest("[data-m]");
    if (q) {
      writePref("ma:gl", q.dataset.q);
      if (q.dataset.q === "lo") { location.reload(); return; }
      info = detectTier(); if (info.tier === "lo") { location.reload(); return; }
      stage.setTier(info.tier); syncSettings();
    }
    if (m) { writePref("ma:motion", m.dataset.m); stage.setReduce(reducedMotion()); if (gview) gview.setReduce(reducedMotion()); syncSettings(); }
  });
  $("#hsReplay").onclick = function () { setP.hidden = true; if (reducedMotion()) return; root.classList.remove("hud-on"); root.classList.add("intro-on"); skip.hidden = false; stage.replay(); };
  $("#hsFeedback").onclick = function () { if (window.MA_feedback) MA_feedback(); };

  addEventListener("keydown", function (e) { if (e.key === "Escape") { setP.hidden = true; hideCard(); } });
  root.setAttribute("data-ma-ready", "");
}

try { start(); } catch (e) { console.error(e); fallback(String(e && e.message || e)); }
