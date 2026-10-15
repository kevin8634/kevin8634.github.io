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

  /* ---------- 全站背景音乐：实时合成，多曲目，跨页面接着放 ---------- */
  var Music = (function () {
    var TR = [
      { name: "星海漫游", d: "温柔和弦 · 远处的钟声", ch: [[48, 55, 59, 64, 71], [45, 52, 57, 60, 67], [41, 48, 53, 57, 64], [43, 50, 55, 59, 62]], sc: [60, 62, 64, 67, 69, 72, 74, 76, 79, 81], wave: "triangle", lp: [500, 1100], dur: 9, bells: [2, 4], bg: 0.035, pg: 0.05, ratio: 2.01 },
      { name: "极光", d: "明亮长音 · 缓慢闪烁", ch: [[50, 57, 64, 66, 73], [47, 54, 61, 64, 71], [52, 59, 66, 68, 75], [45, 52, 59, 64, 68]], sc: [62, 64, 66, 69, 71, 73, 76, 78, 81, 83], wave: "sine", lp: [900, 2400], dur: 11, bells: [3, 6], bg: 0.026, pg: 0.055, ratio: 2.76 },
      { name: "深空引力", d: "低沉的长波 · 适合专注", ch: [[36, 43, 50, 55], [34, 41, 48, 53], [31, 38, 45, 50], [33, 40, 47, 52]], sc: [55, 60, 62, 67, 72], wave: "sawtooth", lp: [160, 420], dur: 14, bells: [1, 2], bg: 0.03, pg: 0.045, ratio: 2.76 },
      { name: "星云摇篮", d: "八音盒般的星光", ch: [[48, 55, 64], [45, 52, 60], [41, 48, 57], [43, 50, 59]], sc: [72, 74, 76, 79, 81, 84, 86, 88], wave: "sine", lp: [400, 800], dur: 8, bells: [6, 10], bg: 0.028, pg: 0.04, ratio: 5.4 }
    ];
    var ac, master, verb, dly, on = false, timer, step = 0, blocked = false, subs = [];
    var trk = store.get("ma:track"); if (trk === null || trk === undefined) trk = 0;
    var vol = store.get("ma:vol"); if (typeof vol !== "number") vol = 0.7;
    var cur = trk < 0 ? 0 : trk;
    var pos = store.get("ma:mpos");
    if (pos && Date.now() - pos.at < 15 * 60 * 1000) { step = pos.step || 0; if (trk < 0) cur = pos.cur || 0; }
    function hz(m) { return 440 * Math.pow(2, (m - 69) / 12); }
    function emit() { subs.forEach(function (f) { try { f(); } catch (e) {} }); }
    function build() {
      ac = new (window.AudioContext || window.webkitAudioContext)();
      master = ac.createGain(); master.gain.value = 0; master.connect(ac.destination);
      verb = ac.createConvolver(); var len = ac.sampleRate * 5, buf = ac.createBuffer(2, len, ac.sampleRate);
      for (var ch = 0; ch < 2; ch++) { var d = buf.getChannelData(ch); for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3); }
      verb.buffer = buf; var wet = ac.createGain(); wet.gain.value = 0.7; verb.connect(wet); wet.connect(master);
      dly = ac.createDelay(2); dly.delayTime.value = 0.62; var fb = ac.createGain(); fb.gain.value = 0.36; dly.connect(fb); fb.connect(dly); dly.connect(verb);
    }
    function pad(T, notes, t, dur) {
      var lp = ac.createBiquadFilter(); lp.type = "lowpass"; lp.Q.value = 0.3;
      lp.frequency.setValueAtTime(T.lp[0], t); lp.frequency.linearRampToValueAtTime(T.lp[1], t + dur * 0.5); lp.frequency.linearRampToValueAtTime(T.lp[0], t + dur);
      var g = ac.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(T.pg, t + 3); g.gain.setValueAtTime(T.pg, t + dur - 3); g.gain.linearRampToValueAtTime(0, t + dur + 1);
      lp.connect(g); g.connect(verb); g.connect(master);
      notes.forEach(function (m) {
        [-6, 6].forEach(function (det) {
          var o = ac.createOscillator(); o.type = T.wave; o.frequency.value = hz(m); o.detune.value = det;
          o.connect(lp); o.start(t); o.stop(t + dur + 1.2);
        });
      });
    }
    function bell(T, t, m, gain) {
      m = m || T.sc[Math.floor(Math.random() * T.sc.length)] + (Math.random() < 0.3 ? 12 : 0);
      var o = ac.createOscillator(), o2 = ac.createOscillator(), g = ac.createGain(), g2 = ac.createGain();
      o.type = o2.type = "sine"; o.frequency.value = hz(m); o2.frequency.value = hz(m) * T.ratio; g2.gain.value = 0.22;
      o2.connect(g2); g2.connect(g); o.connect(g);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain || T.bg, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + 3.5);
      g.connect(dly); g.connect(verb);
      o.start(t); o2.start(t); o.stop(t + 3.6); o2.stop(t + 3.6);
    }
    function loop() {
      if (!on) return;
      if (trk < 0 && step > 0 && step % 4 === 0) { cur = (cur + 1) % TR.length; emit(); }
      var T = TR[cur], t = ac.currentTime + 0.1, dur = T.dur;
      pad(T, T.ch[step % T.ch.length], t, dur);
      var nb = T.bells[0] + Math.floor(Math.random() * (T.bells[1] - T.bells[0] + 1));
      for (var i = 0; i < nb; i++) bell(T, t + 0.8 + Math.random() * (dur - 2));
      step++; store.set("ma:mpos", { step: step, cur: cur, at: Date.now() });
      timer = setTimeout(loop, (dur - 1) * 1000);
    }
    function begin() {
      if (ac.state !== "running") return false;
      blocked = false;
      if (!on) { on = true; master.gain.cancelScheduledValues(ac.currentTime); master.gain.setTargetAtTime(vol, ac.currentTime, 0.8); loop(); }
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
    function stop() { on = false; clearTimeout(timer); if (ac) master.gain.setTargetAtTime(0, ac.currentTime, 0.3); emit(); }
    function setTrack(i) {
      trk = i; store.set("ma:track", i); cur = i < 0 ? cur : i; step = 0;
      if (on) { clearTimeout(timer); master.gain.setTargetAtTime(0, ac.currentTime, 0.4); setTimeout(function () { if (on) { master.gain.setTargetAtTime(vol, ac.currentTime, 0.8); loop(); } }, 900); }
      store.set("ma:music", "on"); if (!on) start().catch(function () {});
      emit();
    }
    function setVol(v) { vol = v; store.set("ma:vol", v); if (ac && on) master.gain.setTargetAtTime(v, ac.currentTime, 0.1); }
    function tap() { if (on && ac) bell(TR[cur], ac.currentTime, null, TR[cur].bg * 1.2); }
    return {
      TR: TR, start: start, stop: stop, tap: tap, setTrack: setTrack, setVol: setVol,
      on: function () { return on; }, blocked: function () { return blocked; }, setBlocked: function (b) { blocked = b; emit(); },
      track: function () { return trk; }, cur: function () { return cur; }, vol: function () { return vol; },
      name: function () { return TR[cur].name; }, sub: function (f) { subs.push(f); }
    };
  })();
  window.MA_Music = Music;
  function wantMusic() { return store.get("ma:music") !== "off"; }
  function toggleMusic() {
    if (Music.on()) { Music.stop(); store.set("ma:music", "off"); }
    else { store.set("ma:music", "on"); Music.start().catch(function () { note("点一下页面任意处，音乐就会响起"); }); }
  }
  function autoMusic() {
    if (!wantMusic()) return;
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
    var t = Music.track(), on = Music.on();
    return '<div class="ma-pop__h"><b>🎵 背景音乐</b><button type="button" class="ma-sw' + (on ? " on" : "") + '" data-tg aria-pressed="' + on + '"><i></i></button></div>' +
      Music.TR.map(function (T, i) {
        return '<button type="button" class="ma-it' + (t === i ? " on" : "") + '" data-tr="' + i + '"><span class="ma-it__e">' + (t === i && on ? '<span class="ma-eq"><s></s><s></s><s></s></span>' : "♪") + "</span><span><b>" + T.name + "</b><small>" + T.d + "</small></span></button>";
      }).join("") +
      '<button type="button" class="ma-it' + (t < 0 ? " on" : "") + '" data-tr="-1"><span class="ma-it__e">🔀</span><span><b>轮播全部</b><small>每隔约半分钟换一首' + (t < 0 && on ? " · 正在放「" + Music.name() + "」" : "") + "</small></span></button>" +
      '<label class="ma-vol">🔈<input type="range" min="0" max="1" step="0.05" value="' + Music.vol() + '" aria-label="音量">🔊</label>' +
      '<p class="ma-pop__f">换页面会接着放。浏览器不允许网页自己出声，换页后如果没声音，点一下页面就好。</p>';
  }
  function openMusic(anchor) {
    openPop(anchor, musicHTML(), function (p) {
      function re() { p.innerHTML = musicHTML(); bind(); }
      function bind() {
        p.querySelector("[data-tg]").onclick = function () { toggleMusic(); setTimeout(re, 60); };
        p.querySelectorAll("[data-tr]").forEach(function (b) { b.onclick = function () { Music.setTrack(+b.dataset.tr); setTimeout(re, 80); }; });
        p.querySelector(".ma-vol input").oninput = function () { Music.setVol(+this.value); };
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
    var notes = { nim: "nim", bee: "bee", nav: "nav", secret: "secret", chord: "chord", cat: "cat", casino: "casino" }[TASK];
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

  function init() {
    if (!LITE) {
      sky(); dock();
      if (hasState) { try { restoreState(); } catch (e) {} setInterval(saveState, 1200); addEventListener("pagehide", saveState); document.addEventListener("visibilitychange", saveState); }
      else if (TASK === "chord") chordSave();
      /* 页面内任意按钮的轻微星光反馈 */
      document.addEventListener("click", function (e) { if (e.target.closest && e.target.closest(".ma-dock a")) Music.tap(); }, true);
    }
    autoMusic();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
