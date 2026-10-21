/* 星图 Math Atlas · 公共层：底部导航、进度保存、反馈、星空主题。放在每个任务页 </body> 前。 */
(function () {
  "use strict";
  var FEEDBACK_EMAIL = "wanglei19860304@gmail.com";
  var TASKS = {
    nim: "先拿的人一定赢吗", bee: "为什么蜜蜂选六边形", nav: "导航怎么找到最短的路",
    secret: "怎样把秘密藏进数字里", chord: "为什么有的和弦好听", cat: "让 AI 认出一只猫",
    casino: "赌场为什么总赢", epidemic: "传染病为什么会爆发", rocket: "火箭怎样飞上月球", cube: "魔方为什么能复原",
    atlas: "知识星图"
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
  /* v0.7 迁移：10-17 首发的传染病任务未登记，进度误存在 ma:v1:page，这里一次性搬回 ma:v1:epidemic */
  (function () {
    var old = store.get("ma:v1:page");
    if (!old || store.get("ma:v1:epidemic")) return;
    if (TASK !== "epidemic" && TASK !== "home" && TASK !== "atlas" && TASK !== "notes") return;
    store.set("ma:v1:epidemic", old); store.del("ma:v1:page");
    var all = store.get("ma:v1:summary") || {};
    if (all.page) { all.epidemic = all.page; delete all.page; store.set("ma:v1:summary", all); }
  })();

  /* ---------- 主题：星系风格列表 ---------- */
  var LITE = document.documentElement.hasAttribute("data-ma-lite");
  var THEMES = [
    { id: "deep", em: "🌌", name: "深空", d: "默认 · 靛蓝夜空", base: "#070b1d", n1: "rgb(64 52 160 / .38)", n2: "rgb(20 120 160 / .24)", map: "#05070f", acc: "#8ea2ff", st: ["#ffffff", "#9fd8ff", "#ffd9a8"] },
    { id: "andromeda", em: "🌸", name: "仙女座星系", d: "粉紫旋臂 · 梦幻", base: "#0d0717", n1: "rgb(178 64 160 / .36)", n2: "rgb(96 64 210 / .3)", map: "#090512", acc: "#ff9ad5", st: ["#ffffff", "#ffc2ec", "#c7b5ff"] },
    { id: "orion", em: "🔥", name: "猎户座星云", d: "赤橙星云 · 温暖", base: "#120808", n1: "rgb(210 72 52 / .32)", n2: "rgb(235 145 60 / .2)", map: "#0c0505", acc: "#ffab7a", st: ["#ffffff", "#ffcf9e", "#ff9f8a"] },
    { id: "aurora", em: "🟢", name: "北极光", d: "青绿光带 · 清透", base: "#04100f", n1: "rgb(40 205 150 / .27)", n2: "rgb(60 120 225 / .24)", map: "#030b0b", acc: "#6ff0c8", st: ["#ffffff", "#a8ffe6", "#9fd8ff"] },
    { id: "milky", em: "✨", name: "银河", d: "暖金星带 · 沉静", base: "#0b0a12", n1: "rgb(205 165 92 / .24)", n2: "rgb(125 105 205 / .22)", map: "#08070d", acc: "#ffd27a", st: ["#ffffff", "#ffe6b0", "#e0d6ff"] },
    { id: "sirius", em: "❄️", name: "天狼星", d: "冰蓝寒光 · 专注", base: "#050d1a", n1: "rgb(80 160 255 / .3)", n2: "rgb(180 225 255 / .12)", map: "#040a14", acc: "#9fd8ff", st: ["#ffffff", "#cfeaff", "#9fc4ff"] },
    { id: "light", em: "☀️", name: "白昼", d: "浅色 · 适合投影", light: 1, base: "#f6f7fb", n1: "rgb(255 255 255 / 0)", n2: "rgb(255 255 255 / 0)", map: "#05070f", acc: "#5b6cff", st: ["#ffffff", "#ffffff", "#ffffff"] }
  ];
  function findTheme(id) { for (var i = 0; i < THEMES.length; i++) if (THEMES[i].id === id) return THEMES[i]; return THEMES[0]; }
  var saved = store.get("ma:theme");
  if (saved === "dark") saved = "deep";
  var theme = findTheme(saved);
  if (LITE && theme.light) theme = THEMES[0];
  var styleEl = document.createElement("style"); styleEl.id = "ma-theme-style"; document.head.appendChild(styleEl);
  function applyTheme(t) {
    theme = t; var root = document.documentElement;
    if (!LITE) { root.setAttribute("data-theme", t.light ? "light" : "dark"); root.classList.add("ma-skin"); }
    root.setAttribute("data-galaxy", t.id);
    var bg = "radial-gradient(1200px 520px at 15% -10%, " + t.n1 + ", transparent 62%), radial-gradient(900px 520px at 100% 8%, " + t.n2 + ", transparent 62%), " + t.base;
    styleEl.textContent = ":root{--ma-base:" + t.base + ";--ma-n1:" + t.n1 + ";--ma-n2:" + t.n2 + ";--ma-map:" + t.map + ";--ma-acc:" + t.acc + "}" +
      (t.light ? "" : ":root.ma-skin[data-theme=dark] body, html[data-ma-lite] body{background:" + bg + " !important;background-attachment:fixed !important}") +
      ".x-map{background:radial-gradient(ellipse at 30% 20%, " + t.n1 + ", transparent 65%)," + t.map + " !important}";
    try { window.dispatchEvent(new CustomEvent("ma-theme", { detail: t })); } catch (e) {}
  }
  applyTheme(theme);
  window.MA_theme = function () { return theme; };

  /* ---------- 星空背景 ---------- */
  function sky() {
    var c = document.createElement("canvas"); c.className = "ma-sky"; c.setAttribute("aria-hidden", "true");
    document.body.prepend(c);
    var x = c.getContext("2d"), dpr = Math.min(2, window.devicePixelRatio || 1), W, H;
    var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    var pts = [];
    for (var i = 0; i < 170; i++) pts.push({ x: Math.random(), y: Math.random(), r: Math.random() * 1.2 + 0.25, p: Math.random() * 6.28, s: 0.4 + Math.random() });
    function size() { W = c.width = innerWidth * dpr; H = c.height = innerHeight * dpr; }
    size(); addEventListener("resize", size);
    var last = 0;
    function draw(t) {
      if (t - last > 50) {
        last = t; x.clearRect(0, 0, W, H);
        if (!theme.light) {
          for (var i = 0; i < pts.length; i++) {
            var s = pts[i];
            x.globalAlpha = 0.25 + 0.6 * Math.abs(Math.sin(s.p + t / 1600 * s.s));
            x.fillStyle = i % 9 === 0 ? theme.st[1] : i % 13 === 0 ? theme.st[2] : theme.st[0];
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

  /* ---------- 全站背景音乐 v2：步进音序器 + 多种合成乐器，每首藏一个数学彩蛋 ---------- */
  var Music = (function () {
    var PHI = (1 + Math.sqrt(5)) / 2;
    var PI_D = "31415926535897932384626433832795028841971693993751058209749445923078164062862089986280348253421170679821480865132823066470938446095505822317253594081284811174502841027019385211055596446229489549303819644288109756659334461284756482337867831652712019091456485669234603486104543266482133936072602491412737245870066063155881748815209209628292540917153643678925903600113305305488204665213841469519415116094330572703657595919530921861173819326117931051185480744623799627495673518857527248912279381830119491";
    var E_D = "27182818284590452353602874713526624977572470936999595749669676277240766303535475945713821785251664274";
    var MODE = {
      ion: [0, 2, 4, 5, 7, 9, 11], dor: [0, 2, 3, 5, 7, 9, 10], lyd: [0, 2, 4, 6, 7, 9, 11],
      mix: [0, 2, 4, 5, 7, 9, 10], aeo: [0, 2, 3, 5, 7, 8, 10], hmin: [0, 2, 3, 5, 7, 8, 11]
    };
    var ac, out, master, verb, dly, noiseBuf, ksCache = {}, on = false, timer = null, blocked = false, subs = [];
    var step = 0, nextT = 0, LOOK = 0.3, mem = {};
    function hz(m) { return 440 * Math.pow(2, (m - 69) / 12); }
    function deg(T, d, oct) { var L = T.mode.length, o = Math.floor(d / L), i = ((d % L) + L) % L; return T.root + 12 * (o + (oct || 0)) + T.mode[i]; }
    function chord(T, d, n, oct) { var r = []; for (var i = 0; i < (n || 4); i++) r.push(deg(T, d + i * 2, oct)); return r; }
    function primeQ(n) { if (n < 2) return false; for (var i = 2; i * i <= n; i++) if (n % i === 0) return false; return true; }
    function euclid(k, n, i) { return ((i * k) % n) < k; }
    function sturm(n) { return Math.floor((n + 2) / PHI) - Math.floor((n + 1) / PHI) === 1; }

    /* ---- 乐器（全部实时合成） ---- */
    function env(g, t, a, peak, d) { g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); }
    function osc(type, f, t, stop) { var o = ac.createOscillator(); o.type = type; o.frequency.value = f; o.start(t); o.stop(stop); return o; }
    function send(node, dry, wet, echo) {
      if (dry) { var a = ac.createGain(); a.gain.value = dry; node.connect(a); a.connect(master); }
      if (wet) { var b = ac.createGain(); b.gain.value = wet; node.connect(b); b.connect(verb); }
      if (echo) { var c = ac.createGain(); c.gain.value = echo; node.connect(c); c.connect(dly); }
    }
    var I = {
      kick: function (t, v) { var o = osc("sine", 150, t, t + 0.5), g = ac.createGain(); o.frequency.exponentialRampToValueAtTime(42, t + 0.12); env(g, t, 0.003, 0.9 * v, 0.38); o.connect(g); send(g, 1, 0.05); },
      noise: function (t, dur, type, f, q, v, wet) {
        var s = ac.createBufferSource(); s.buffer = noiseBuf; var fl = ac.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q || 1;
        var g = ac.createGain(); env(g, t, 0.002, v, dur); s.connect(fl); fl.connect(g); send(g, 1, wet || 0.1); s.start(t, Math.random() * 1.5); s.stop(t + dur + 0.05); return fl;
      },
      snare: function (t, v) { I.noise(t, 0.18, "bandpass", 1800, 0.8, 0.35 * v, 0.25); var o = osc("triangle", 190, t, t + 0.12), g = ac.createGain(); env(g, t, 0.002, 0.25 * v, 0.1); o.connect(g); send(g, 1, 0.1); },
      clap: function (t, v) { for (var i = 0; i < 3; i++) I.noise(t + i * 0.011, 0.09 + i * 0.03, "bandpass", 1300, 1.2, 0.3 * v, 0.3); },
      hat: function (t, v, open) { I.noise(t, open ? 0.28 : 0.045, "highpass", 7500, 0.7, 0.16 * v, 0.06); },
      shaker: function (t, v) { I.noise(t, 0.07, "bandpass", 6000, 2, 0.12 * v, 0.1); },
      ride: function (t, v) { I.noise(t, 0.5, "highpass", 5200, 1.5, 0.08 * v, 0.2); var o = osc("square", 3110, t, t + 0.4), g = ac.createGain(); env(g, t, 0.002, 0.012 * v, 0.35); o.connect(g); send(g, 1, 0.2); },
      tick: function (t, v) { I.noise(t, 0.02, "highpass", 4000, 3, 0.2 * v, 0.15); },
      bass: function (t, m, dur, v, type) {
        var o = osc(type || "sine", hz(m), t, t + dur + 0.1), o2 = osc("triangle", hz(m), t, t + dur + 0.1), lp = ac.createBiquadFilter(), g = ac.createGain();
        lp.type = "lowpass"; lp.frequency.setValueAtTime(type === "sawtooth" ? 1400 : 600, t); lp.frequency.exponentialRampToValueAtTime(type === "sawtooth" ? 260 : 300, t + dur);
        g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.42 * v, t + 0.01); g.gain.setTargetAtTime(0.0001, t + dur * 0.7, dur * 0.15);
        o.connect(lp); o2.connect(lp); lp.connect(g); send(g, 1, 0.04);
      },
      epiano: function (t, m, dur, v) {
        var f = hz(m), c = osc("sine", f, t, t + dur + 1.2), mo = osc("sine", f, t, t + dur + 1.2), mg = ac.createGain(), g = ac.createGain();
        mg.gain.setValueAtTime(f * 2.2, t); mg.gain.exponentialRampToValueAtTime(f * 0.15, t + 0.6); mo.connect(mg); mg.connect(c.frequency);
        var tr = osc("sine", 5.2, t, t + dur + 1.2), tg = ac.createGain(); tg.gain.value = 0.25; tr.connect(tg);
        g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.12 * v, t + 0.006); g.gain.exponentialRampToValueAtTime(0.05 * v, t + 0.5); g.gain.setTargetAtTime(0.0001, t + dur, 0.25);
        c.connect(g); send(g, 0.8, 0.35, 0.1);
      },
      pluck: function (t, m, v, bright) {
        var key = m + ":" + (bright || 0), b = ksCache[key];
        if (!b) {
          var sr = ac.sampleRate, N = Math.round(sr / hz(m)), len = Math.floor(sr * 1.6); b = ac.createBuffer(1, len, sr); var d = b.getChannelData(0), buf = new Float32Array(N);
          for (var i = 0; i < N; i++) buf[i] = Math.random() * 2 - 1; var damp = bright ? 0.4985 : 0.496;
          for (var j = 0; j < len; j++) { var k = j % N, nx = (k + 1) % N; d[j] = buf[k]; buf[k] = damp * (buf[k] + buf[nx]); }
          ksCache[key] = b;
        }
        var s = ac.createBufferSource(), g = ac.createGain(); s.buffer = b; g.gain.value = 0.32 * v; s.connect(g); send(g, 0.8, 0.3, 0.18); s.start(t); s.stop(t + 1.6);
      },
      box: function (t, m, v) {
        var f = hz(m), g = ac.createGain(); [[1, 1, 1.6], [3.02, 0.25, 0.35], [5.4, 0.12, 0.18], [8.9, 0.05, 0.08]].forEach(function (p) {
          var o = osc("sine", f * p[0], t, t + p[2] + 0.1), gg = ac.createGain(); env(gg, t, 0.002, p[1], p[2]); o.connect(gg); gg.connect(g);
        }); g.gain.value = 0.6 * v; send(g, 0.8, 0.45, 0.12);
      },
      marimba: function (t, m, v) {
        var f = hz(m), g = ac.createGain(); [[1, 1, 0.5], [3.93, 0.35, 0.12], [9.4, 0.08, 0.04]].forEach(function (p) {
          var o = osc("sine", f * p[0], t, t + p[2] + 0.1), gg = ac.createGain(); env(gg, t, 0.002, p[1], p[2]); o.connect(gg); gg.connect(g);
        }); g.gain.value = 0.16 * v; send(g, 0.9, 0.2, 0.08);
      },
      bell: function (t, m, v, ratio) {
        var f = hz(m), o = osc("sine", f, t, t + 4), o2 = osc("sine", f * (ratio || 2.76), t, t + 4), g = ac.createGain(), g2 = ac.createGain(); g2.gain.value = 0.25;
        o2.connect(g2); g2.connect(g); o.connect(g); env(g, t, 0.01, 0.06 * v, 3.6); send(g, 0.4, 0.8, 0.35);
      },
      lead: function (t, m, dur, v, type) {
        var o = osc(type || "square", hz(m), t, t + dur + 0.4), lp = ac.createBiquadFilter(), g = ac.createGain(); lp.type = "lowpass"; lp.frequency.setValueAtTime(2600, t); lp.frequency.exponentialRampToValueAtTime(700, t + dur);
        g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.05 * v, t + 0.01); g.gain.setTargetAtTime(0.0001, t + dur, 0.08); o.connect(lp); lp.connect(g); send(g, 0.8, 0.25, 0.25);
      },
      padF: function (t, freqs, dur, v, type, lpA, lpB) {
        var lp = ac.createBiquadFilter(), g = ac.createGain(); lp.type = "lowpass"; lp.Q.value = 0.4;
        lp.frequency.setValueAtTime(lpA || 500, t); lp.frequency.linearRampToValueAtTime(lpB || 1400, t + dur * 0.5); lp.frequency.linearRampToValueAtTime(lpA || 500, t + dur);
        var a = Math.min(1.5, dur * 0.3); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.045 * v, t + a); g.gain.setValueAtTime(0.045 * v, t + dur - a); g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.6);
        lp.connect(g); send(g, 0.7, 0.6);
        freqs.forEach(function (f) { [-7, 7].forEach(function (dt) { var o = osc(type || "sawtooth", f, t, t + dur + 0.8); o.detune.value = dt; o.connect(lp); }); });
      },
      pad: function (t, ms, dur, v, type, lpA, lpB) { I.padF(t, ms.map(hz), dur, v, type, lpA, lpB); },
      drone: function (t, m, dur, v) {
        var o = osc("sine", hz(m), t, t + dur + 1), o2 = osc("sawtooth", hz(m + 7), t, t + dur + 1), lp = ac.createBiquadFilter(), g = ac.createGain(), l = osc("sine", 0.11, t, t + dur + 1), lg = ac.createGain();
        lp.type = "lowpass"; lp.frequency.value = 220; lg.gain.value = 120; l.connect(lg); lg.connect(lp.frequency);
        g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.16 * v, t + 2); g.gain.setValueAtTime(0.16 * v, t + dur - 1.5); g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.8);
        o.connect(g); o2.connect(lp); lp.connect(g); send(g, 0.8, 0.5);
      },
      heart: function (t, v) { [0, 0.22].forEach(function (d, i) { var o = osc("sine", 62, t + d, t + d + 0.3), g = ac.createGain(); o.frequency.exponentialRampToValueAtTime(38, t + d + 0.18); env(g, t + d, 0.01, (i ? 0.28 : 0.4) * v, 0.22); o.connect(g); send(g, 1, 0.15); }); },
      wind: function (t, dur, v) {
        var s = ac.createBufferSource(); s.buffer = noiseBuf; s.loop = true; var bp = ac.createBiquadFilter(); bp.type = "bandpass"; bp.Q.value = 3;
        bp.frequency.setValueAtTime(300, t); bp.frequency.exponentialRampToValueAtTime(1600, t + dur * 0.5); bp.frequency.exponentialRampToValueAtTime(260, t + dur);
        var g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.05 * v, t + dur * 0.4); g.gain.linearRampToValueAtTime(0.0001, t + dur);
        s.connect(bp); bp.connect(g); send(g, 0.7, 0.6); s.start(t); s.stop(t + dur + 0.1);
      },
      buzz: function (t, m, dur, v) {
        var o = osc("sawtooth", hz(m), t, t + dur + 0.5), vib = osc("sine", 23, t, t + dur + 0.5), vg = ac.createGain(), bp = ac.createBiquadFilter(), g = ac.createGain();
        vg.gain.value = 6; vib.connect(vg); vg.connect(o.detune); bp.type = "bandpass"; bp.frequency.value = 650; bp.Q.value = 4;
        g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.05 * v, t + 0.8); g.gain.setValueAtTime(0.05 * v, t + dur - 0.6); g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.3);
        o.connect(bp); bp.connect(g); send(g, 0.6, 0.3);
      },
      crackle: function (t, dur) { for (var i = 0; i < 6; i++) if (Math.random() < 0.5) I.noise(t + Math.random() * dur, 0.004, "highpass", 3000, 1, 0.05 + Math.random() * 0.05, 0); }
    };

    /* ---- 曲目：每首一套骨架 + 一个数学彩蛋 ---- */
    function bar(T, s) { return Math.floor(s / T.meter); }
    function voss(key, n) { var r = mem[key] || (mem[key] = [0, 0, 0, 0].map(function () { return Math.random(); })); var c = n, k = 0; while (c > 0 && (c & 1) === 0 && k < 3) { c >>= 1; k++; } r[k] = Math.random(); return (r[0] + r[1] + r[2] + r[3]) / 4; }
    var TR = [
      { id: "voyage", name: "星海漫游", d: "Lo-fi · 慢鼓点与电钢琴", math: "旋律音高 = 斐波那契数列 mod 7，16 个音后正好循环（皮萨诺周期）", bpm: 78, meter: 16, swing: 0.28, root: 50, mode: MODE.dor, prog: [0, 3, 1, 4],
        play: function (T, s, t, sd) {
          var i = s % 16, b = bar(T, s), c = T.prog[b % 4];
          if (i === 0 || i === 10 || (i === 7 && b % 2)) I.kick(t, i === 0 ? 1 : 0.7);
          if (i === 4 || i === 12) I.snare(t, 0.7);
          if (i % 2 === 0) I.hat(t, 0.6 + Math.random() * 0.4);
          if (i === 0) { I.bass(t, deg(T, c, -1), sd * 6, 1); chord(T, c, 4, 0).forEach(function (m, k) { I.epiano(t + k * 0.012, m, sd * 9, 0.55); }); I.crackle(t, sd * 16); }
          if (i === 10) I.bass(t, deg(T, c + 4, -1), sd * 4, 0.8);
          if (i === 6 && b % 2) chord(T, c, 3, 0).forEach(function (m) { I.epiano(t, m, sd * 2, 0.5); });
          if ([0, 3, 6, 8, 11, 14].indexOf(i) >= 0 && (b % 4 > 0) && Math.random() < 0.75) {
            var fa = mem.fa || [0, 1], f = (fa[0] + fa[1]) % 7; mem.fa = [fa[1], f]; I.epiano(t, deg(T, f, 1), sd * 2.5, 0.75);
          }
        } },
      { id: "aurora", name: "极光", d: "闪烁琶音 · 明亮长音", math: "重音按黄金比例 φ 撒落（斐波那契词），节奏永远不会完全重复", bpm: 112, meter: 16, root: 53, mode: MODE.lyd, prog: [0, 1, 5, 4],
        play: function (T, s, t, sd) {
          var i = s % 16, b = bar(T, s), c = T.prog[b % 4], ch = chord(T, c, 4, 0).concat(chord(T, c, 4, 1)), ord = [0, 1, 2, 3, 4, 5, 6, 7, 6, 5, 4, 3, 2, 1, 2, 3];
          if (i === 0) { I.pad(t, chord(T, c, 4, 0), sd * 16, 0.9, "triangle", 900, 2600); I.bass(t, deg(T, c, -2), sd * 7, 0.8, "sine"); }
          if (i === 8) I.bass(t, deg(T, c, -1), sd * 6, 0.6, "sine");
          I.pluck(t, ch[ord[i]], sturm(s) ? 0.9 : 0.4, 1);
          if (i === 12 && b % 2 === 1) I.bell(t, deg(T, c + 4, 2), 0.8, 2.76);
          if (sturm(s) && i % 4 === 2) I.shaker(t, 0.6);
        } },
      { id: "gravity", name: "深空引力", d: "无鼓氛围 · 心跳与风 · 适合专注", math: "零星的钟声由 1/f 粉红噪声（Voss 算法）生成，像海岸线一样自相似", bpm: 60, meter: 16, root: 38, mode: MODE.aeo, prog: [0, 5, 3, 4],
        play: function (T, s, t, sd) {
          var i = s % 16, b = bar(T, s), c = T.prog[Math.floor(b / 2) % 4];
          if (i === 0 && b % 2 === 0) { I.drone(t, deg(T, c, 0), sd * 32, 1.8); I.pad(t, chord(T, c, 3, 1), sd * 32, 1.3, "sawtooth", 180, 520); }
          if (i === 0 && b % 4 === 0) I.wind(t, sd * 40, 1.6);
          if (i === 0 || i === 8) I.heart(t, 0.55);
          if (i % 4 === 0 && Math.random() < 0.4) I.bell(t + Math.random() * sd, deg(T, 14 + Math.round(voss("g", s >> 2) * 9), 0), 2.2, 2.76);
        } },
      { id: "cradle", name: "星云摇篮", d: "八音盒华尔兹 · 3/4 拍", math: "主旋律依次读圆周率 π 的数字 3.14159…，每个数字对应五声音阶上的一个音", bpm: 92, meter: 12, root: 60, mode: MODE.ion, prog: [0, 5, 3, 4],
        play: function (T, s, t, sd) {
          var i = s % 12, b = bar(T, s), c = T.prog[b % 4], P = [0, 1, 2, 4, 5];
          if (i === 0) { I.pluck(t, deg(T, c, -2), 0.8); I.pad(t, chord(T, c, 3, -1), sd * 12, 0.45, "sine", 600, 900); }
          if (i === 4 || i === 8) chord(T, c, 3, 0).forEach(function (m) { I.box(t, m, 0.35); });
          if (i % 4 === 0 || (i === 6 && b % 2)) { var k = mem.pi || 0, dg = +PI_D[k % PI_D.length]; mem.pi = k + 1; I.box(t, deg(T, P[dg % 5] + 7 * Math.floor(dg / 5), 1), 1); }
          if (i === 10 && b % 4 === 3) I.box(t, deg(T, c + 7, 2), 0.5);
        } },
      /* —— 任务专属曲 —— */
      { id: "overture", name: "星图序曲", d: "电影感氛围 · 钟声、长音与拨弦 · 主页主题曲", math: "和弦在 Tonnetz 音网上按 π 的数位做 P/L/R 变换；钟声调制比 = 黄金比 φ；各声部按斐波那契小节 1、2、3、5、8、13 依次进场", bpm: 70, meter: 16, root: 50, mode: MODE.dor,
        play: function (T, s, t, sd) {
          var X = mem.ov || (mem.ov = { ch: { r: 2, maj: false }, pi: 0, v: [50, 53, 57], pads: [] }), i = s % 16, bar = Math.floor(s / 16), b34 = bar % 34;
          var ENTER = { pad: 0, harm: 1, bell: 2, bass: 3, pluck: 5, pulse: 8, tick: 13 };
          function act(l) { if (b34 < ENTER[l]) return false; return !((l === "pulse" || l === "bass" || l === "tick") && b34 >= 26 && b34 < 30); }
          function pan(node, p) { if (!ac.createStereoPanner) return node; var q = ac.createStereoPanner(); q.pan.value = p; node.connect(q); return q; }
          function drift(per) { return Math.sin(t / per * 6.2832) * 0.6; }
          var tri = X.ch.maj ? [0, 4, 7] : [0, 3, 7];
          if (i === 0 && bar % 2 === 0) {
            if (bar > 0) { var d = +PI_D[X.pi++ % PI_D.length] % 3, r = X.ch.r, mj = X.ch.maj;          /* 新黎曼变换 P / L / R */
              X.ch = d === 0 ? { r: r, maj: !mj } : d === 1 ? (mj ? { r: r + 4, maj: false } : { r: r - 4, maj: true }) : (mj ? { r: r - 3, maj: false } : { r: r + 3, maj: true });
              X.ch.r = ((X.ch.r % 12) + 12) % 12; tri = X.ch.maj ? [0, 4, 7] : [0, 3, 7]; }
            X.v = tri.map(function (iv) { var pc = (X.ch.r + iv) % 12, best = 0, bd = 99; for (var m = 47; m <= 71; m++) if ((m - pc) % 12 === 0) { var dd = Math.min.apply(null, X.v.map(function (v) { return Math.abs(v - m); })); if (dd < bd) { bd = dd; best = m; } } return best; }).sort(function (a, b) { return a - b; });
            if (act("pad")) {
              X.pads.forEach(function (p) { try { p.g.gain.cancelScheduledValues(t); p.g.gain.setTargetAtTime(0.0001, t, 1.2); p.o.forEach(function (o) { o.stop(t + 6); }); } catch (e) {} }); X.pads = [];
              X.v.forEach(function (m, k) {
                var g = ac.createGain(), f = ac.createBiquadFilter(), dur = sd * 32 + 1.5, base = 900 + 500 * Math.sin(t / 13 * 6.28) + 300 * Math.sin(t / 21 * 6.28);
                f.type = "lowpass"; f.frequency.setValueAtTime(base, t); f.frequency.linearRampToValueAtTime(base + 600, t + dur / 2); f.frequency.linearRampToValueAtTime(base, t + dur);
                var os = [-7, 7, 0].map(function (c, j) { var o = ac.createOscillator(); o.type = j < 2 ? "sawtooth" : "sine"; o.frequency.value = hz(m + (j === 2 ? 12 : 0)); o.detune.value = c; o.connect(f); o.start(t); o.stop(t + dur + 6); return o; });
                g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.05, t + 2.4); g.gain.setValueAtTime(0.05, t + dur - 0.2); g.gain.setTargetAtTime(0.0001, t + dur, 1);
                f.connect(g); send(pan(g, (k - 1) * 0.45), 0.5, 0.9); X.pads.push({ g: g, o: os });
              });
            }
            if (act("harm")) [3, 5, 7].forEach(function (n, j) {   /* 根音的第 3、5、7 次谐波 */
              var o = ac.createOscillator(), g = ac.createGain(), dur = sd * 28, t0 = t + sd * 4; o.frequency.value = hz(X.v[0] - 24) * n;
              g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(0.013 / (j + 1), t0 + dur * 0.4); g.gain.linearRampToValueAtTime(0.0001, t0 + dur);
              o.connect(g); send(pan(g, [-0.7, 0.7, 0][j]), 0.2, 1, 0.2); o.start(t0); o.stop(t0 + dur + 0.1);
            });
          }
          var R = X.ch.r, lo = R > 5 ? -12 : 0;
          if (act("bass") && i % 2 === 0 && euclid(3, 8, i / 2)) {   /* 欧几里得节奏 E(3,8) */
            var bo = ac.createOscillator(), bs = ac.createOscillator(), bg = ac.createGain(), bf = ac.createBiquadFilter(), m0 = 36 + R + (i === 6 ? 7 : 0), bd = sd * 5;
            bo.type = "sawtooth"; bo.frequency.value = hz(m0); bs.frequency.value = hz(m0 - 12); bf.type = "lowpass"; bf.frequency.value = 260; bf.Q.value = 2;
            bo.connect(bf); bf.connect(bg); bs.connect(bg); bg.gain.setValueAtTime(0.0001, t); bg.gain.linearRampToValueAtTime(0.13, t + 0.03); bg.gain.setTargetAtTime(0.06, t + 0.1, 0.3); bg.gain.exponentialRampToValueAtTime(0.0001, t + bd);
            send(bg, 0.9, 0.12); bo.start(t); bs.start(t); bo.stop(t + bd + 0.05); bs.stop(t + bd + 0.05);
          }
          if (act("bell") && euclid(5, 16, i)) {                   /* FM 钟声:调制比 φ;音高 = 斐波那契 mod 7 */
            if (!X.fib) { X.fib = []; for (var a = 0, c2 = 1, k2 = 0; k2 < 16; k2++) { X.fib.push(a % 7); var tt = (a + c2) % 7; a = c2; c2 = tt; } }
            var sc = X.ch.maj ? [0, 2, 4, 5, 7, 9, 11] : [0, 2, 3, 5, 7, 8, 10], fq = hz(72 + R + lo + sc[X.fib[s % 16]]);
            var car = ac.createOscillator(), mo = ac.createOscillator(), mg = ac.createGain(), eg = ac.createGain();
            car.frequency.value = fq; mo.frequency.value = fq * PHI; mg.gain.setValueAtTime(fq * 2.2, t); mg.gain.exponentialRampToValueAtTime(fq * 0.05, t + 2.5);
            mo.connect(mg); mg.connect(car.frequency); car.connect(eg); eg.gain.setValueAtTime(0.0001, t); eg.gain.linearRampToValueAtTime(0.06, t + 0.006); eg.gain.exponentialRampToValueAtTime(0.0001, t + 3.2);
            send(pan(eg, drift(8 * PHI)), 0.55, 0.8, 0.45); car.start(t); mo.start(t); car.stop(t + 3.3); mo.stop(t + 3.3);
          }
          if (act("pluck") && i % 2 === 1) {                         /* Thue–Morse 节奏 + e 的数位 */
            var n = s >> 1, tm = 0; while (n) { tm ^= n & 1; n >>= 1; }
            if (tm) { var ed = +E_D[(s >> 1) % E_D.length], pm = 60 + R + lo + [0, 2, 4, 7, 9][ed % 5] + (ed > 6 ? 12 : 0);
              var p1 = ac.createOscillator(), p2 = ac.createOscillator(), pg = ac.createGain(), pf = ac.createBiquadFilter();
              p1.type = "triangle"; p1.frequency.value = hz(pm); p2.frequency.value = hz(pm) * 2.001; pf.type = "lowpass"; pf.frequency.setValueAtTime(4200, t); pf.frequency.exponentialRampToValueAtTime(600, t + 0.5);
              p1.connect(pf); p2.connect(pf); pf.connect(pg); pg.gain.setValueAtTime(0.0001, t); pg.gain.linearRampToValueAtTime(0.05, t + 0.004); pg.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
              send(pan(pg, drift(8)), 0.5, 0.45, 0.35); p1.start(t); p2.start(t); p1.stop(t + 1); p2.stop(t + 1); }
          }
          if (act("pulse") && (i === 0 || i === 10)) I.kick(t, i ? 0.22 : 0.32);
          if (act("tick") && sturm(s)) I.hat(t, 0.25 + (i % 4 === 0 ? 0.15 : 0));
        } },
      { id: "nim", task: "nim", name: "松果蹦蹦", d: "🐿️ 轻快木琴 · 松鼠的游戏", math: "拍手只落在第 2、3、5、7、11、13 个八分拍上，全是质数", bpm: 124, meter: 16, root: 55, mode: MODE.ion, prog: [0, 4, 5, 3],
        play: function (T, s, t, sd) {
          var i = s % 16, b = bar(T, s), c = T.prog[b % 4], e = (s % 32) / 2;
          if (i === 0 || i === 8) I.kick(t, 0.9);
          if (s % 2 === 0 && primeQ(e)) I.clap(t, 0.8);
          if (i % 2 === 0) I.shaker(t, 0.5);
          if (i % 2 === 0) I.bass(t, deg(T, c, i % 4 ? -1 : -2), sd * 1.4, 0.8, "triangle");
          var pat = [0, 2, 4, 2, 7, 4, 2, 4]; if (i % 2 === 0 && !(b % 4 === 3 && i > 10)) I.marimba(t, deg(T, c + pat[(i / 2) % 8], 1), 0.9);
          if (i === 14 && b % 2) I.marimba(t, deg(T, c + 9, 1), 0.7);
        } },
      { id: "bee", task: "bee", name: "蜂巢圆舞", d: "🐝 6/8 拍 · 嗡嗡的和声", math: "6 拍一组，6 个和弦像蜂巢的 6 条边，转一圈回到原点", bpm: 132, meter: 12, root: 57, mode: MODE.mix, prog: [0, 4, 1, 5, 2, 3],
        play: function (T, s, t, sd) {
          var i = s % 12, b = bar(T, s), c = T.prog[b % 6], pat = [0, 2, 4, 7, 4, 2];
          if (i === 0) { I.buzz(t, deg(T, c, 0), sd * 12, 0.9); I.bass(t, deg(T, c, -1), sd * 5, 0.9, "sine"); }
          if (i === 0 || i === 6) I.kick(t, i ? 0.6 : 0.85);
          if (i % 2 === 0) { I.shaker(t, i % 6 ? 0.4 : 0.7); I.marimba(t, deg(T, c + pat[i / 2], 1), 0.8); }
          if (i === 9 && b % 2) I.bell(t, deg(T, c + 4, 2), 0.5, 3.0);
        } },
      { id: "nav", task: "nav", name: "蚂蚁行军", d: "🐜 推进的鼓与琶音", math: "鼓点用欧几里得算法（就是求最大公约数那个）把 5 拍尽量均匀地撒进 16 格", bpm: 116, meter: 16, root: 52, mode: MODE.dor, prog: [0, 0, 5, 6],
        play: function (T, s, t, sd) {
          var i = s % 16, b = bar(T, s), c = T.prog[b % 4];
          if (euclid(5, 16, i)) I.kick(t, i === 0 ? 1 : 0.7);
          if (i === 4 || i === 12) I.snare(t, 0.5);
          if (euclid(7, 16, (i + 2) % 16)) I.tick(t, 0.8);
          if (euclid(3, 8, i % 8)) I.bass(t, deg(T, c, -1), sd * 1.6, 0.85, "sawtooth");
          I.pluck(t, deg(T, c + [0, 2, 4, 6, 7, 4][s % 6], 0), euclid(7, 16, i) ? 0.75 : 0.35, 1);
          if (i === 0) I.pad(t, chord(T, c, 3, 0), sd * 16, 0.5, "sawtooth", 400, 1100);
        } },
      { id: "secret", task: "secret", name: "密室时钟", d: "🦉 神秘小调 · 滴答作响", math: "主旋律是把 MATH ATLAS 用凯撒密码右移 3 位，再 mod 7 变成音阶", bpm: 84, meter: 16, root: 45, mode: MODE.hmin, prog: [0, 5, 3, 4],
        play: function (T, s, t, sd) {
          var i = s % 16, b = bar(T, s), c = T.prog[b % 4], W = "MATHATLAS";
          if (i % 4 === 0) I.tick(t, i ? 0.6 : 1);
          if (i === 0) { I.pad(t, chord(T, c, 3, 0), sd * 16, 0.45, "sawtooth", 260, 800); I.bass(t, deg(T, c, -1), sd * 7, 0.8); I.kick(t, 0.6); }
          if (i === 8) I.heart(t, 0.35);
          if (i % 2 === 0) I.pluck(t, deg(T, c + [0, 4, 2, 4][(i / 2) % 4], 0), 0.8);
          if (b % 2 === 1 && i % 4 === 0) { var k = mem.cz || 0, L = W.charCodeAt(k % W.length) - 65, n = (L + 3) % 26 % 7; mem.cz = k + 1; I.bell(t, deg(T, n, 2), 0.7, 3.5); }
        } },
      { id: "chord", task: "chord", name: "纯律之歌", d: "🎹 温暖电钢琴 · 整数比和声", math: "和弦频率按 4:5:6 的整数比调准（纯律），比钢琴的十二平均律更「纯」", bpm: 72, meter: 16, root: 48, mode: MODE.ion, prog: [0, 3, 4, 0],
        play: function (T, s, t, sd) {
          var i = s % 16, b = bar(T, s), R = [0, 5, 7, -3][b % 4], minor = b % 4 === 3, f0 = hz(T.root + R), rat = minor ? [10, 12, 15, 20] : [4, 5, 6, 8], fs = rat.map(function (r) { return f0 * r / rat[0]; });
          if (i === 0) { I.padF(t, fs, sd * 16, 0.9, "triangle", 700, 1800); I.bass(t, T.root + R - 12, sd * 8, 0.8); I.kick(t, 0.45); }
          if (i === 8) I.bass(t, T.root + R - 5, sd * 6, 0.6);
          if (i === 4 || i === 12) I.hat(t, 0.4);
          if (i % 4 === 2) { var f = fs[(s >> 2) % 4] * 2; I.box(t, 69 + 12 * Math.log2(f / 440), 0.6); }
        } },
      { id: "cat", task: "cat", name: "神经脉冲", d: "🐱 电子节拍 · 合成器琶音", math: "反拍踩镲在用二进制计数：第 n 小节的 4 个反拍正好打出 n 的 4 位二进制", bpm: 120, meter: 16, root: 50, mode: MODE.aeo, prog: [0, 5, 2, 6],
        play: function (T, s, t, sd) {
          var i = s % 16, b = bar(T, s), c = T.prog[b % 4], n = b % 16;
          if (i % 4 === 0) I.kick(t, 0.9);
          if (i === 4 || i === 12) I.clap(t, 0.6);
          if (i % 4 === 2) { if ((n >> (3 - (i >> 2))) & 1) I.hat(t, 1, true); else I.hat(t, 0.35); }
          if (i % 2 === 1) I.bass(t, deg(T, c, -1), sd * 0.9, 0.75, "sawtooth");
          if (i % 2 === 0) I.lead(t, deg(T, c + [0, 2, 4, 7][(i / 2) % 4], 1), sd * 0.8, 0.8, "square");
          if (i === 0) I.pad(t, chord(T, c, 3, 0), sd * 16, 0.45, "sawtooth", 300, 1500);
        } },
      { id: "casino", task: "casino", name: "浣熊爵士", d: "🦝 摇摆节奏 · 行走低音", math: "低音每拍随机向上或向下走一步，这就是随机游走（BOSS 关同款）", bpm: 100, meter: 16, swing: 0.33, root: 53, mode: MODE.ion, prog: [1, 4, 0, 5],
        play: function (T, s, t, sd) {
          var i = s % 16, b = bar(T, s), c = T.prog[b % 4];
          if (i % 4 === 0 || i % 8 === 6) I.ride(t, i % 4 ? 0.6 : 1);
          if (i === 4 || i === 12) I.noise(t, 0.12, "bandpass", 2500, 0.6, 0.08, 0.3);
          if (i % 4 === 0) { var w = i === 0 ? c : (mem.walk === undefined ? c : mem.walk) + (Math.random() < 0.5 ? -1 : 1); mem.walk = w; I.bass(t, deg(T, w, -1), sd * 3.6, 0.9, "triangle"); }
          if ((i === 6 || i === 10 || i === 14) && Math.random() < 0.45) chord(T, c, 4, 0).forEach(function (m) { I.epiano(t, m, sd * 1.5, 0.6); });
          if (i === 0 && b % 2 === 0) chord(T, c, 4, 0).forEach(function (m) { I.epiano(t, m, sd * 3, 0.7); });
          if (i % 4 === 2 && Math.random() < 0.5) { var v = (mem.vib === undefined ? 4 : mem.vib) + (Math.random() < 0.5 ? -1 : 1); v = Math.max(0, Math.min(9, v)); mem.vib = v; I.box(t, deg(T, v, 1), 0.7); }
        } },
      { id: "epidemic", task: "epidemic", name: "刺猬巡诊", d: "🦔 轻柔木琴 · 越来越密的音符", math: "每小节的木琴音符数按 1、2、4、8 翻倍，然后归零重来：这就是指数增长 2ⁿ", bpm: 96, meter: 16, root: 52, mode: MODE.dor, prog: [0, 3, 5, 4],
        play: function (T, s, t, sd) {
          var i = s % 16, b = bar(T, s), c = T.prog[b % 4], cnt = Math.pow(2, b % 4), gap = 16 / cnt;
          if (i === 0) { I.pad(t, chord(T, c, 3, 0), sd * 16, 0.5, "triangle", 500, 1400); I.bass(t, deg(T, c, -1), sd * 8, 0.8); I.kick(t, 0.6); }
          if (i === 8) { I.bass(t, deg(T, c + 4, -1), sd * 6, 0.6); I.kick(t, 0.45); }
          if (i === 4 || i === 12) I.snare(t, 0.35);
          if (i % 2 === 0) I.shaker(t, 0.35);
          if (i % gap === 0) { var k = mem.ep || 0; mem.ep = k + 1; I.marimba(t, deg(T, c + [0, 2, 4, 7, 4, 2][k % 6], 1), 0.85); }
        } },
      { id: "rocket", task: "rocket", name: "升空", d: "🦊 推进节拍 · 明亮的上行琶音", math: "每小节 4 个音的音级是 0、1、4、9（平方数）；相邻的差 1、3、5 是奇数，正是平方数的「导数」", bpm: 104, meter: 16, root: 50, mode: MODE.lyd, prog: [0, 4, 5, 3],
        play: function (T, s, t, sd) {
          var i = s % 16, b = bar(T, s), c = T.prog[b % 4];
          if (i === 0 || i === 8 || (i === 11 && b % 2)) I.kick(t, i === 0 ? 1 : 0.7);
          if (i === 4 || i === 12) I.clap(t, 0.5);
          if (i % 2 === 0) I.hat(t, 0.5);
          if (i === 0) { I.pad(t, chord(T, c, 4, 0), sd * 16, 0.6, "sawtooth", 400, 1800); I.bass(t, deg(T, c, -2), sd * 6, 0.9, "sawtooth"); }
          if (i === 8) I.bass(t, deg(T, c, -1), sd * 6, 0.7, "sawtooth");
          if (i % 4 === 0) I.pluck(t, deg(T, c + [0, 1, 4, 9][i / 4], 0), 0.85, 1);
          if (i === 14 && b % 4 === 3) I.bell(t, deg(T, c + 11, 1), 0.6, 2.76);
        } },
      { id: "cube", task: "cube", name: "转动群", d: "🐼 沉稳律动 · 六和弦循环", math: "6 个和弦一轮回到原位：魔方公式 R U R′ U′ 连做 6 次，魔方也会回到原样（这个动作的阶是 6）", bpm: 90, meter: 16, root: 57, mode: MODE.aeo, prog: [0, 3, 4, 5, 2, 6],
        play: function (T, s, t, sd) {
          var i = s % 16, b = bar(T, s), c = T.prog[b % 6];
          if (i === 0 || i === 10) I.kick(t, i ? 0.7 : 0.9);
          if (i === 4 || i === 12) I.snare(t, 0.4);
          if (i % 4 === 2) I.tick(t, 0.6);
          if (i === 0) { chord(T, c, 4, 0).forEach(function (m, k) { I.epiano(t + k * 0.01, m, sd * 10, 0.55); }); I.bass(t, deg(T, c, -1), sd * 7, 0.85); }
          if (i === 8) I.bass(t, deg(T, c + 2, -1), sd * 6, 0.6);
          if (i % 4 === 0 && (b + i / 4) % 3 !== 2) I.box(t, deg(T, c + [4, 2, 0, 2][i / 4], 1), 0.7);
        } }
    ];
    var GLOBAL = 5, BYTASK = {}; TR.forEach(function (T, k) { if (T.task) BYTASK[T.task] = k; });

    var trk = store.get("ma:track"); if (trk === null || trk === undefined || trk >= GLOBAL) trk = 0;
    var auto = store.get("ma:mauto") !== "off";
    var vol = store.get("ma:vol"); if (typeof vol !== "number") vol = 0.7;
    function pick() { return auto && BYTASK[TASK] !== undefined ? BYTASK[TASK] : (trk < 0 ? (mem.rot || 0) : trk); }
    var cur = pick(), pos = store.get("ma:mpos");
    if (pos && Date.now() - pos.at < 15 * 60 * 1000 && pos.id === TR[cur].id) step = pos.step || 0;
    if (pos && trk < 0 && pos.rot !== undefined) { mem.rot = pos.rot; cur = pick(); }
    function emit() { subs.forEach(function (f) { try { f(); } catch (e) {} }); }
    function build(ctx) {
      ac = ctx || new (window.AudioContext || window.webkitAudioContext)();
      var comp = ac.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 3; comp.attack.value = 0.01; comp.release.value = 0.25; comp.connect(ac.destination);
      out = ac.createGain(); out.gain.value = 0; out.connect(comp);
      master = ac.createGain(); master.gain.value = 0.8; master.connect(out);
      var len = ac.sampleRate * 3.5, rb = ac.createBuffer(2, len, ac.sampleRate);
      for (var ch = 0; ch < 2; ch++) { var d = rb.getChannelData(ch); for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
      verb = ac.createConvolver(); verb.buffer = rb; var vg = ac.createGain(); vg.gain.value = 0.55; verb.connect(vg); vg.connect(master);
      dly = ac.createDelay(2); var fb = ac.createGain(); fb.gain.value = 0.32; var dlp = ac.createBiquadFilter(); dlp.type = "lowpass"; dlp.frequency.value = 2400;
      dly.connect(dlp); dlp.connect(fb); fb.connect(dly); dlp.connect(verb);
      noiseBuf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate); var nd = noiseBuf.getChannelData(0); for (var k = 0; k < nd.length; k++) nd[k] = Math.random() * 2 - 1;
    }
    function tick() {
      if (!on) return;
      var T = TR[cur], sd = 60 / T.bpm / 4; dly.delayTime.setTargetAtTime(sd * 3, ac.currentTime, 0.1);
      while (nextT < ac.currentTime + LOOK) {
        var sw = (T.swing && step % 4 === 2) ? T.swing * sd : 0;
        try { T.play(T, step, nextT + sw, sd); } catch (e) {}
        step++; nextT += sd;
        if (step % T.meter === 0) {
          store.set("ma:mpos", { id: T.id, step: step, rot: mem.rot, at: Date.now() });
          if (trk < 0 && !(auto && BYTASK[TASK] !== undefined) && step >= T.meter * 16) { mem.rot = ((mem.rot || 0) + 1) % GLOBAL; switchTo(pick()); return; }
        }
      }
    }
    function run() { clearInterval(timer); nextT = ac.currentTime + 0.12; timer = setInterval(tick, 40); tick(); }
    document.addEventListener("visibilitychange", function () { LOOK = document.hidden ? 1.6 : 0.3; });
    function switchTo(k) {
      cur = k; step = 0; mem = { rot: mem.rot }; emit();
      if (!on) return; clearInterval(timer);
      out.gain.setTargetAtTime(0, ac.currentTime, 0.25);
      setTimeout(function () { if (on) { out.gain.setTargetAtTime(vol, ac.currentTime, 0.6); run(); } }, 900);
    }
    function begin() {
      if (ac.state !== "running") return false;
      blocked = false;
      if (!on) { on = true; out.gain.cancelScheduledValues(ac.currentTime); out.gain.setValueAtTime(0, ac.currentTime); out.gain.setTargetAtTime(vol, ac.currentTime, 0.9); run(); }
      emit(); return true;
    }
    function start() {
      try { if (!ac) build(); } catch (e) { return Promise.reject(e); }
      if (begin()) return Promise.resolve();
      return new Promise(function (res, rej) {
        var r = ac.resume ? ac.resume() : Promise.resolve();
        r.then(function () { if (store.get("ma:music") !== "off" && begin()) res(); else rej(0); }, rej);
        setTimeout(function () { if (ac.state !== "running") rej(0); }, 450);
      });
    }
    function stop() { on = false; clearInterval(timer); if (ac) out.gain.setTargetAtTime(0, ac.currentTime, 0.3); emit(); }
    function setTrack(i) {
      if (i >= GLOBAL) { auto = true; store.set("ma:mauto", "on"); }
      else { trk = i; store.set("ma:track", i); if (BYTASK[TASK] !== undefined) { auto = false; store.set("ma:mauto", "off"); } }
      store.set("ma:music", "on");
      var k = pick(); if (k !== cur || !on) switchTo(k);
      if (!on) start().catch(function () {});
      emit();
    }
    function setAuto(a) { auto = a; store.set("ma:mauto", a ? "on" : "off"); var k = pick(); if (k !== cur) switchTo(k); emit(); }
    function setVol(v) { vol = v; store.set("ma:vol", v); if (ac && on) out.gain.setTargetAtTime(v, ac.currentTime, 0.1); }
    function tap() { if (on && ac) { var T = TR[cur]; I.bell(ac.currentTime + 0.02, deg(T, 7 + Math.floor(Math.random() * 7), 1), 0.6, 2.76); } }
    return {
      TR: TR, GLOBAL: GLOBAL, taskTrack: function () { return BYTASK[TASK]; }, start: start, stop: stop, tap: tap, setTrack: setTrack, setVol: setVol, setAuto: setAuto,
      auto: function () { return auto; }, on: function () { return on; }, blocked: function () { return blocked; }, setBlocked: function (b) { blocked = b; emit(); },
      track: function () { return trk; }, cur: function () { return cur; },
      curId: function () { return TR[cur].id; }, chordName: function () { var X = mem.ov; if (!X) return "Dm"; return ["C","C♯","D","E♭","E","F","F♯","G","A♭","A","B♭","B"][X.ch.r] + (X.ch.maj ? "" : "m"); },
      playId: function (id) { var k = -1; TR.forEach(function (T, j) { if (T.id === id) k = j; }); if (k >= 0 && k !== cur) switchTo(k); }, vol: function () { return vol; },
      name: function () { return TR[cur].name; }, sub: function (f) { subs.push(f); },
      _offline: function (k, secs) {
        var save = [ac, out, master, verb, dly, noiseBuf, ksCache, mem], sr = 44100;
        ksCache = {}; mem = {}; build(new OfflineAudioContext(2, sr * secs, sr)); out.gain.value = 0.7;
        var T = TR[k], sd = 60 / T.bpm / 4, tt = 0.05, n = 0;
        while (tt < secs - 0.5) { T.play(T, n, tt + ((T.swing && n % 4 === 2) ? T.swing * sd : 0), sd); n++; tt += sd; }
        var oc = ac; ac = save[0]; out = save[1]; master = save[2]; verb = save[3]; dly = save[4]; noiseBuf = save[5]; ksCache = save[6]; mem = save[7];
        return oc.startRendering();
      }
    };
  })();
  window.MA_Music = Music;
  function wantMusic() { return store.get("ma:music") === "on"; } /* v0.8:按系列规则 5.10,背景音乐默认关,只有用户开过才自动续播 */
  function toggleMusic() {
    if (Music.on()) { Music.stop(); store.set("ma:music", "off"); }
    else { store.set("ma:music", "on"); Music.start().catch(function () { note("点一下页面任意处，音乐就会响起"); }); }
  }
  function autoMusic() {
    if (!wantMusic()) return;
    if (document.documentElement.hasAttribute("data-ma-gl")) return; /* v0.8.1:沉浸版主页由「星图序曲」接管,开场结束后再播 */
    Music.start().catch(function () {
      Music.setBlocked(true);
      var go = function (e) {
        if (e.target && e.target.closest && e.target.closest(".ma-pop,.ma-mbtn,#music")) return;
        Music.start().then(function () { ["pointerdown", "keydown", "touchend"].forEach(function (ev) { removeEventListener(ev, go, true); }); }).catch(function () {});
      };
      ["pointerdown", "keydown", "touchend"].forEach(function (ev) { addEventListener(ev, go, true); });
    });
  }

  /* ---------- 弹出面板：音乐 / 主题 ---------- */
  var pop = null;
  function closePop() { if (pop) { pop.remove(); pop = null; } }
  function openPop(anchor, html, bind) {
    var same = pop && pop._a === anchor; closePop(); if (same) return;
    pop = document.createElement("div"); pop.className = "ma-pop"; pop._a = anchor; pop.innerHTML = html;
    document.body.appendChild(pop); bind(pop);
    var r = anchor.getBoundingClientRect(), pw = pop.offsetWidth, ph = pop.offsetHeight;
    var left = Math.max(8, Math.min(innerWidth - pw - 8, r.left + r.width / 2 - pw / 2));
    var top = r.top > innerHeight / 2 ? r.top - ph - 10 : r.bottom + 10;
    pop.style.left = left + "px"; pop.style.top = Math.max(8, top) + "px";
    requestAnimationFrame(function () { if (pop) pop.classList.add("on"); });
  }
  document.addEventListener("pointerdown", function (e) { if (pop && !pop.contains(e.target) && !(pop._a && pop._a.contains(e.target))) closePop(); }, true);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closePop(); });

  function musicHTML() {
    var t = Music.track(), on = Music.on(), cur = Music.cur(), tt = Music.taskTrack(), au = Music.auto();
    function item(T, i, sel) {
      return '<button type="button" class="ma-it' + (sel ? " on" : "") + '" data-tr="' + i + '"><span class="ma-it__e">' + (cur === i && on ? '<span class="ma-eq"><s></s><s></s><s></s></span>' : "♪") + "</span><span><b>" + T.name + "</b><small>" + T.d + '</small><small class="ma-math">🔢 ' + T.math + "</small></span></button>";
    }
    var h = '<div class="ma-pop__h"><b>🎵 背景音乐</b><button type="button" class="ma-sw' + (on ? " on" : "") + '" data-tg aria-pressed="' + on + '"><i></i></button></div>';
    if (tt !== undefined) {
      h += '<p class="ma-pop__s">本任务主题曲</p>' + item(Music.TR[tt], tt, au) +
        '<label class="ma-chk"><input type="checkbox" data-auto' + (au ? " checked" : "") + '> 进入任务时自动换成专属曲</label><p class="ma-pop__s">星空曲目</p>';
    }
    h += Music.TR.slice(0, Music.GLOBAL).map(function (T, i) { return item(T, i, !(tt !== undefined && au) && t === i); }).join("") +
      '<button type="button" class="ma-it' + (t < 0 && !(tt !== undefined && au) ? " on" : "") + '" data-tr="-1"><span class="ma-it__e">🔀</span><span><b>轮播全部</b><small>每首放 16 小节后换下一首' + (t < 0 && on && cur < Music.GLOBAL ? " · 正在放「" + Music.name() + "」" : "") + "</small></span></button>" +
      '<label class="ma-vol">🔈<input type="range" min="0" max="1" step="0.05" value="' + Music.vol() + '" aria-label="音量">🔊</label>' +
      '<p class="ma-pop__f">每首曲子都藏着一个数学规律，听出来了吗？换页面会接着放；如果换页后没声音，点一下页面就好。</p>';
    return h;
  }
  function openMusic(anchor) {
    openPop(anchor, musicHTML(), function (p) {
      function re() { p.innerHTML = musicHTML(); bind(); }
      function bind() {
        p.querySelector("[data-tg]").onclick = function () { toggleMusic(); setTimeout(re, 60); };
        p.querySelectorAll("[data-tr]").forEach(function (b) { b.onclick = function () { Music.setTrack(+b.dataset.tr); setTimeout(re, 80); }; });
        p.querySelector(".ma-vol input").oninput = function () { Music.setVol(+this.value); };
        var ck = p.querySelector("[data-auto]"); if (ck) ck.onchange = function () { Music.setAuto(this.checked); setTimeout(re, 80); };
      }
      bind();
    });
  }
  function themeHTML() {
    return '<div class="ma-pop__h"><b>🎨 星系主题</b></div><div class="ma-grid">' +
      THEMES.filter(function (t) { return !(LITE && t.light); }).map(function (t) {
        return '<button type="button" class="ma-th' + (t.id === theme.id ? " on" : "") + '" data-th="' + t.id + '"><span class="ma-th__sw" style="background:radial-gradient(circle at 30% 30%,' + t.n1 + ',transparent 70%),radial-gradient(circle at 80% 70%,' + t.n2 + ',transparent 70%),' + t.base + '"><i style="background:' + t.acc + '"></i></span><b>' + t.em + " " + t.name + "</b><small>" + t.d + "</small></button>";
      }).join("") + "</div>" + (LITE ? '<p class="ma-pop__f">「白昼」浅色主题只在任务页里提供。</p>' : "");
  }
  function openTheme(anchor) {
    openPop(anchor, themeHTML(), function (p) {
      p.addEventListener("click", function (e) {
        var b = e.target.closest("[data-th]"); if (!b) return;
        applyTheme(findTheme(b.dataset.th)); store.set("ma:theme", theme.id); Music.tap();
        p.querySelectorAll("[data-th]").forEach(function (o) { o.classList.toggle("on", o === b); });
        var tb = document.querySelector(".ma-theme span"); if (tb) tb.textContent = theme.em;
      });
    });
  }
  window.MA_openMusic = openMusic; window.MA_openTheme = openTheme;

  /* ---------- 底部导航坞 ---------- */
  function dock() {
    var notes = { nim: "nim", bee: "bee", nav: "nav", secret: "secret", chord: "chord", cat: "cat", casino: "casino", epidemic: "epidemic", rocket: "rocket", cube: "cube" }[TASK];
    var el = document.createElement("nav"); el.className = "ma-dock"; el.setAttribute("aria-label", "星图导航");
    el.innerHTML =
      '<a href="../" title="回到主页"><span>🏠</span><b>主页</b></a>' +
      (TASK === "atlas" ? "" : '<a href="../atlas/" title="知识星图"><span>✦</span><b>星图</b></a>') +
      '<a href="../notes/' + (notes ? "#" + notes : "") + '" title="知识笔记"><span>📒</span><b>笔记</b></a>' +
      '<button type="button" class="ma-mbtn" title="背景音乐"><span class="ma-eq"><s></s><s></s><s></s></span><b>音乐</b></button>' +
      '<button type="button" class="ma-theme" title="星系主题"><span>' + theme.em + "</span><b>主题</b></button>" +
      '<button type="button" class="ma-fb" title="反馈"><span>💬</span><b>反馈</b></button>' +
      (hasState || TASK === "chord" ? '<button type="button" class="ma-reset" title="清空进度重来"><span>↺</span><b>重来</b></button>' : "") +
      (hasState || TASK === "chord" ? '<span class="ma-saved" title="进度自动保存在这台设备的浏览器里">✓ 自动保存</span>' : "");
    document.body.appendChild(el);
    el.querySelector(".ma-fb").onclick = feedback;
    el.querySelector(".ma-theme").onclick = function () { openTheme(this); };
    var mb = el.querySelector(".ma-mbtn");
    mb.onclick = function () { openMusic(this); };
    function mui() { mb.classList.toggle("on", Music.on()); mb.classList.toggle("wait", !Music.on() && Music.blocked()); mb.querySelector("b").textContent = Music.on() ? Music.name() : Music.blocked() ? "点一下开声" : "音乐 关"; }
    Music.sub(mui); mui();
    var r = el.querySelector(".ma-reset"); if (r) r.onclick = reset;
  }


  /* ---------- 页面转场 ---------- */
  (function () {
    var warp = document.createElement("div"); warp.className = "ma-warp"; warp.setAttribute("aria-hidden", "true");
    function mount() { if (!warp.parentNode) document.body.appendChild(warp); }
    if (document.body) mount(); else document.addEventListener("DOMContentLoaded", mount);
    addEventListener("pageshow", function () { document.documentElement.classList.remove("ma-leaving"); });
    document.addEventListener("click", function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target.closest && e.target.closest("a[href]"); if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      var u; try { u = new URL(a.href, location.href); } catch (er) { return; }
      if (u.origin !== location.origin || u.protocol.indexOf("http") !== 0) return;
      if (u.pathname === location.pathname && u.search === location.search) return;
      if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      e.preventDefault(); mount(); store.set("ma:mpos", store.get("ma:mpos"));
      document.documentElement.classList.add("ma-leaving");
      setTimeout(function () { location.href = u.href; }, 280);
    });
  })();

  /* ---------- 赌场任务入口：一次性反赌提示 ---------- */
  function casinoNotice() {
    if (TASK !== "casino" || store.get("ma:v1:casino-ack")) return;
    var d = document.createElement("div"); d.className = "ma-modal"; d.setAttribute("role", "dialog"); d.setAttribute("aria-modal", "true"); d.setAttribute("aria-labelledby", "ma-cn-h");
    d.innerHTML = '<div class="ma-card"><h3 id="ma-cn-h">🦝 开始之前，先读一句</h3>' +
      "<p class='ma-sub'>这是一个用概率回答「赌场为什么总赢」的数学任务。这里只有虚拟筹码，不涉及任何真钱。</p>" +
      "<p class='ma-sub'>数学的结论很清楚：赌博的期望是负数，玩得越久，输得越确定。赌博有害，未成年人禁止参与任何形式的赌博。</p>" +
      '<div class="ma-row"><button type="button" class="ma-btn ma-ok">我明白了，开始学概率</button></div></div>';
    document.body.appendChild(d);
    var ok = d.querySelector(".ma-ok");
    ok.onclick = function () { store.set("ma:v1:casino-ack", 1); d.remove(); };
    setTimeout(function () { ok.focus(); }, 50);
  }

  function init() {
    if (!LITE) {
      sky(); dock(); casinoNotice();
      if (hasState) { try { restoreState(); } catch (e) {} setInterval(saveState, 1200); addEventListener("pagehide", saveState); document.addEventListener("visibilitychange", saveState); }
      else if (TASK === "chord") chordSave();
      /* 页面内任意按钮的轻微星光反馈 */
      document.addEventListener("click", function (e) { if (e.target.closest && e.target.closest(".ma-dock a")) Music.tap(); }, true);
    }
    autoMusic();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
