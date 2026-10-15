/* 星图 Math Atlas · 公共层：底部导航、进度保存、反馈、星空主题。放在每个任务页 </body> 前。 */
(function () {
  "use strict";
  var FEEDBACK_EMAIL = "wanglei19860304@gmail.com";
  var TASKS = {
    nim: "先拿的人一定赢吗", bee: "为什么蜜蜂选六边形", nav: "导航怎么找到最短的路",
    secret: "怎样把秘密藏进数字里", chord: "为什么有的和弦好听", cat: "让 AI 认出一只猫",
    casino: "赌场为什么总赢", atlas: "知识星图"
  };
  var seg = location.pathname.replace(/\/index\.html$/, "").split("/").filter(Boolean);
  var TASK = seg[seg.length - 1] || "";
  if (!TASKS[TASK]) TASK = document.documentElement.getAttribute("data-ma-task") || "page";
  var KEY = "ma:v1:" + TASK;
  var store = {
    get: function (k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } },
    del: function (k) { try { localStorage.removeItem(k); } catch (e) {} }
  };

  /* ---------- 主题：默认深空，可切回浅色 ---------- */
  var theme = store.get("ma:theme") || "dark";
  if (!document.documentElement.hasAttribute("data-ma-lite")) {
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.classList.add("ma-skin");
  }

  /* ---------- 星空背景 ---------- */
  function sky() {
    var c = document.createElement("canvas"); c.className = "ma-sky"; c.setAttribute("aria-hidden", "true");
    document.body.prepend(c);
    var x = c.getContext("2d"), dpr = Math.min(2, window.devicePixelRatio || 1), W, H;
    var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    var pts = [];
    for (var i = 0; i < 160; i++) pts.push({ x: Math.random(), y: Math.random(), r: Math.random() * 1.2 + 0.25, p: Math.random() * 6.28, s: 0.4 + Math.random() });
    function size() { W = c.width = innerWidth * dpr; H = c.height = innerHeight * dpr; }
    size(); addEventListener("resize", size);
    var last = 0;
    function draw(t) {
      if (t - last > 50) {
        last = t; x.clearRect(0, 0, W, H);
        if (document.documentElement.getAttribute("data-theme") === "dark") {
          for (var i = 0; i < pts.length; i++) {
            var s = pts[i];
            x.globalAlpha = 0.25 + 0.6 * Math.abs(Math.sin(s.p + t / 1600 * s.s));
            x.fillStyle = i % 9 === 0 ? "#9fd8ff" : i % 13 === 0 ? "#ffd9a8" : "#ffffff";
            x.beginPath(); x.arc(s.x * W, s.y * H, s.r * dpr, 0, 6.283); x.fill();
          }
        }
      }
      if (!reduce) requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
  }

  /* ---------- 小提示 ---------- */
  function note(msg) {
    var el = document.createElement("div"); el.className = "ma-note"; el.textContent = msg;
    document.body.appendChild(el);
    requestAnimationFrame(function () { el.classList.add("on"); });
    setTimeout(function () { el.classList.remove("on"); setTimeout(function () { el.remove(); }, 400); }, 2600);
  }

  /* ---------- 进度保存 ---------- */
  var hasState = false; try { hasState = typeof State === "object" && State !== null; } catch (e) {}
  var lastJSON = "";
  function merge(dst, src) {
    Object.keys(src).forEach(function (k) {
      var v = src[k];
      if (v && typeof v === "object" && !Array.isArray(v) && dst[k] && typeof dst[k] === "object") merge(dst[k], v);
      else dst[k] = v;
    });
  }
  function callIf(name) { try { var f = window[name]; if (typeof f === "function") f(); } catch (e) {} }
  function levelsTotal() { try { return LEVELS_META.length; } catch (e) { return 0; } }
  function summary(done, total, stars) {
    var all = store.get("ma:v1:summary") || {};
    all[TASK] = { done: done, total: total, stars: stars, t: Date.now() };
    store.set("ma:v1:summary", all);
  }
  function saveState() {
    if (hasState) {
      var j = JSON.stringify(State);
      if (j === lastJSON) return;
      lastJSON = j; store.set(KEY, State);
      var done = Object.keys(State.perLevel || {}).filter(function (k) { return State.perLevel[k] > 0; }).length;
      summary(done, levelsTotal(), State.stars || 0);
    }
  }
  function restoreState() {
    var saved = store.get(KEY);
    if (!saved) return;
    merge(State, saved);
    ["renderBar", "renderBadges", "renderMap", "renderSky", "renderFinal"].forEach(callIf);
    lastJSON = JSON.stringify(State);
    var done = Object.keys(State.perLevel || {}).filter(function (k) { return State.perLevel[k] > 0; }).length;
    if (done) note("欢迎回来！已恢复进度：完成 " + done + " 关，⭐ " + (State.stars || 0));
  }
  /* 和弦任务没有 State：记录点亮的星 */
  function chordSave() {
    if (typeof window.lightStar !== "function") return false;
    var orig = window.lightStar, lit = (store.get(KEY) || {}).lit || [];
    window.lightStar = function (i) {
      orig(i);
      if (lit.indexOf(i) < 0) { lit.push(i); store.set(KEY, { lit: lit }); summary(lit.length, 7, lit.length); }
    };
    if (lit.length) { lit.forEach(function (i) { orig(i); }); note("欢迎回来！已点亮 " + lit.length + " / 7 颗星"); }
    return true;
  }
  function reset() {
    if (!confirm("清空本任务的进度，从头再来？")) return;
    store.del(KEY);
    var all = store.get("ma:v1:summary") || {}; delete all[TASK]; store.set("ma:v1:summary", all);
    lastJSON = "__reset__"; hasState = false;
    location.reload();
  }

  /* ---------- 反馈 ---------- */
  function feedback() {
    var d = document.createElement("div"); d.className = "ma-modal"; d.setAttribute("role", "dialog"); d.setAttribute("aria-modal", "true");
    d.innerHTML =
      '<div class="ma-card"><button class="ma-x" aria-label="关闭">×</button>' +
      "<h3>💬 给星图提个意见</h3><p class='ma-sub'>好玩吗？卡在哪？哪里看不懂？每一条都会被认真读。</p>" +
      '<div class="ma-chips">' + ["😍 好玩", "🤔 看不懂", "🐞 有 bug", "💡 新点子"].map(function (t, i) {
        return '<button type="button" class="ma-chip' + (i === 0 ? " on" : "") + '">' + t + "</button>";
      }).join("") + "</div>" +
      '<textarea rows="5" placeholder="比如：第 3 关的提示太快了 / 希望有排行榜……"></textarea>' +
      '<input type="text" placeholder="年级或年龄（选填）" class="ma-age">' +
      '<div class="ma-row"><button type="button" class="ma-btn ma-send">✉️ 用邮件发送</button><button type="button" class="ma-btn ghost ma-copy">复制内容</button></div>' +
      "<p class='ma-fine'>会打开你的邮件 App，发往 " + FEEDBACK_EMAIL + "</p></div>";
    document.body.appendChild(d);
    var kind = "😍 好玩";
    d.querySelectorAll(".ma-chip").forEach(function (b) {
      b.onclick = function () { d.querySelectorAll(".ma-chip").forEach(function (o) { o.classList.remove("on"); }); b.classList.add("on"); kind = b.textContent; };
    });
    function text() {
      var p = hasState ? ("完成关卡 " + Object.keys(State.perLevel || {}).length + "，⭐ " + (State.stars || 0)) : "";
      return "类型：" + kind + "\n页面：" + (TASKS[TASK] || document.title) + "（" + location.href + "）\n年级/年龄：" + (d.querySelector(".ma-age").value || "未填") +
        "\n进度：" + (p || "—") + "\n\n" + d.querySelector("textarea").value + "\n\n— " + navigator.userAgent;
    }
    function close() { d.remove(); }
    d.querySelector(".ma-x").onclick = close;
    d.onclick = function (e) { if (e.target === d) close(); };
    d.querySelector(".ma-send").onclick = function () {
      location.href = "mailto:" + FEEDBACK_EMAIL + "?subject=" + encodeURIComponent("[星图反馈] " + (TASKS[TASK] || "") + " " + kind) + "&body=" + encodeURIComponent(text());
    };
    d.querySelector(".ma-copy").onclick = function () {
      var t = text();
      (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { note("已复制，可粘贴到邮件发给 " + FEEDBACK_EMAIL); }, function () { prompt("复制下面的内容：", t); });
    };
    setTimeout(function () { d.querySelector("textarea").focus(); }, 50);
  }
  window.MA_feedback = feedback;

  /* ---------- 底部导航坞 ---------- */
  function dock() {
    var notes = { nim: "nim", bee: "bee", nav: "nav", secret: "secret", chord: "chord", cat: "cat", casino: "casino" }[TASK];
    var el = document.createElement("nav"); el.className = "ma-dock"; el.setAttribute("aria-label", "星图导航");
    el.innerHTML =
      '<a href="../" title="回到主页"><span>🏠</span><b>主页</b></a>' +
      (TASK === "atlas" ? "" : '<a href="../atlas/" title="知识星图"><span>✦</span><b>星图</b></a>') +
      '<a href="../notes/' + (notes ? "#" + notes : "") + '" title="知识笔记"><span>📒</span><b>笔记</b></a>' +
      '<button type="button" class="ma-fb" title="反馈"><span>💬</span><b>反馈</b></button>' +
      '<button type="button" class="ma-theme" title="切换明暗"><span>' + (theme === "dark" ? "🌙" : "☀️") + "</span><b>主题</b></button>" +
      (hasState || TASK === "chord" ? '<button type="button" class="ma-reset" title="清空进度重来"><span>↺</span><b>重来</b></button>' : "") +
      (hasState || TASK === "chord" ? '<span class="ma-saved" title="进度自动保存在这台设备的浏览器里">✓ 自动保存</span>' : "");
    document.body.appendChild(el);
    el.querySelector(".ma-fb").onclick = feedback;
    el.querySelector(".ma-theme").onclick = function () {
      theme = theme === "dark" ? "light" : "dark"; store.set("ma:theme", theme);
      document.documentElement.setAttribute("data-theme", theme);
      this.querySelector("span").textContent = theme === "dark" ? "🌙" : "☀️";
    };
    var r = el.querySelector(".ma-reset"); if (r) r.onclick = reset;
  }

  var LITE = document.documentElement.hasAttribute("data-ma-lite");
  function init() {
    if (LITE) return;
    sky(); dock();
    if (hasState) { try { restoreState(); } catch (e) {} setInterval(saveState, 1200); addEventListener("pagehide", saveState); document.addEventListener("visibilitychange", saveState); }
    else if (TASK === "chord") chordSave();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
