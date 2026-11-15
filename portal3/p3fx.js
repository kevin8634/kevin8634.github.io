/* 创世计划 门户 3.0 · 首屏文字与按钮动效（11-16）
 * 思路致谢：reactbits「Blur Text / Rotating Text / Shiny Text / Magnet / Click Spark」（MIT + Commons Clause）、uiverse 发光按钮（MIT）。
 * 本项目自写的原生 JS（普通脚本，挂 window.P3FX），样式在 p3ui.css；零依赖、零外部请求。
 * 减少动态（prefers-reduced-motion）：全部不启用——标题直接显示、换词直接替换、无磁吸无火花。 */
(function () {
  "use strict";
  var RM = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  var FINE = !!(window.matchMedia && matchMedia("(pointer: fine)").matches);
  function chars(s) { return Array.from ? Array.from(s) : s.split(""); }

  /* Blur Text：标题逐字由糊变清。跳过换词槽 .rw（整体作为一个单位入场）与 <em>（保留渐变扫光，整体入场）。 */
  function blur(h1) {
    if (RM || !h1) return;
    var n = 0;
    function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (c) {
        if (c.nodeType === 3) {
          var f = document.createDocumentFragment();
          chars(c.nodeValue).forEach(function (ch) {
            var s = document.createElement("span"); s.className = "bc"; s.style.setProperty("--i", n++);
            if (ch === " ") { s.className = "bc sp"; s.textContent = "\u00a0"; } else s.textContent = ch;
            f.appendChild(s);
          });
          node.replaceChild(f, c);
        } else if (c.nodeType === 1) {
          if (c.tagName === "BR") return;
          if (c.classList.contains("rw") || c.tagName === "EM") { c.classList.add("bc"); c.style.setProperty("--i", n); n += 2; return; }
          walk(c);
        }
      });
    }
    walk(h1); h1.classList.add("fxb");
  }

  /* Rotating Text：换词时旧词逐字上飞淡出，新词逐字从下方弹入（带回弹），槽宽平滑过渡 */
  function rotate(el, word, color, anim) {
    if (!el) return;
    el.style.setProperty("--c", color);
    var mk = function (cls) { var w = document.createElement("span"); w.className = cls; w.style.color = color;
      chars(word).forEach(function (ch, i) { var s = document.createElement("span"); s.className = "rc"; s.style.setProperty("--i", i); s.textContent = ch === " " ? "\u00a0" : ch; w.appendChild(s); }); return w; };
    if (!anim || RM) { el.innerHTML = ""; el.style.width = ""; el.appendChild(mk("rwi")); return; }
    var old = el.querySelector(".rwi"), w0 = el.getBoundingClientRect().width;
    Array.prototype.forEach.call(el.querySelectorAll(".rwo"), function (x) { x.remove(); });
    var nw = mk("rwi rin");
    if (old) { old.className = "rwo"; old.style.left = "0px"; }
    el.appendChild(nw);
    var w1 = nw.getBoundingClientRect().width;
    el.style.width = w0 + "px"; void el.offsetWidth;
    el.style.width = w1 + "px";
    requestAnimationFrame(function () { nw.className = "rwi"; if (old) old.classList.add("go"); });
    setTimeout(function () { if (old && old.parentNode) old.remove(); el.style.width = ""; }, 900);
  }

  /* Click Spark：点击处放射 8 道火花，400ms */
  var spk = null, sparks = [], sraf = 0;
  function spark(x, y, color) {
    if (RM) return;
    if (!spk) { spk = document.createElement("canvas"); spk.className = "p3spk"; spk.setAttribute("aria-hidden", "true"); document.body.appendChild(spk); }
    var d = Math.min(devicePixelRatio || 1, 2); spk.width = innerWidth * d; spk.height = innerHeight * d;
    var t = performance.now();
    for (var i = 0; i < 8; i++) sparks.push({ x: x, y: y, a: i / 8 * Math.PI * 2 + Math.random() * .3, t: t, c: color });
    if (!sraf) sraf = requestAnimationFrame(drawSparks);
  }
  function drawSparks(now) {
    sraf = 0; var d = Math.min(devicePixelRatio || 1, 2), x = spk.getContext("2d"); x.setTransform(d, 0, 0, d, 0, 0); x.clearRect(0, 0, innerWidth, innerHeight);
    sparks = sparks.filter(function (s) { return now - s.t < 420; });
    sparks.forEach(function (s) {
      var p = (now - s.t) / 420, e = 1 - Math.pow(1 - p, 3), r0 = 6 + e * 26, len = 12 * (1 - p);
      x.strokeStyle = s.c; x.globalAlpha = 1 - p; x.lineWidth = 2; x.lineCap = "round"; x.beginPath();
      x.moveTo(s.x + Math.cos(s.a) * r0, s.y + Math.sin(s.a) * r0); x.lineTo(s.x + Math.cos(s.a) * (r0 + len), s.y + Math.sin(s.a) * (r0 + len)); x.stroke();
    });
    x.globalAlpha = 1;
    if (sparks.length) sraf = requestAnimationFrame(drawSparks); else { spk.remove(); spk = null; }
  }

  /* Magnet：指针进入按钮外扩 36px 范围时按钮被吸向指针（最多约 10px），离开回弹 */
  function magnet(b, k) {
    var pad = 36, on = false;
    function mv(e) {
      if (e.pointerType === "touch") return;
      var r = b.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, dx = e.clientX - cx, dy = e.clientY - cy;
      var inside = Math.abs(dx) < r.width / 2 + pad && Math.abs(dy) < r.height / 2 + pad;
      if (inside) { on = true; b.classList.add("mg"); b.style.setProperty("--mgx", (dx * k).toFixed(1) + "px"); b.style.setProperty("--mgy", (dy * k * 1.2).toFixed(1) + "px"); }
      else if (on) { on = false; b.classList.remove("mg"); b.style.setProperty("--mgx", "0px"); b.style.setProperty("--mgy", "0px"); }
    }
    window.addEventListener("pointermove", mv, { passive: true });
    return function () { window.removeEventListener("pointermove", mv); };
  }

  /* 主按钮：发光（CSS .gb）+ 磁吸 + 点击火花 */
  var offs = [];
  function buttons(list) {
    list.forEach(function (it) {
      var b = it.el; if (!b) return;
      b.classList.add("gb");
      if (RM) return;
      if (FINE) offs.push(magnet(b, it.k || .18));
      b.addEventListener("click", function (e) { var r = b.getBoundingClientRect(); spark(e.clientX || r.left + r.width / 2, e.clientY || r.top + r.height / 2, it.c || "#ffe29a"); });
    });
  }
  function stop() { offs.forEach(function (f) { f(); }); offs = []; }

  window.P3FX = { rm: RM, blur: blur, rotate: rotate, buttons: buttons, spark: spark, stop: stop };
})();
