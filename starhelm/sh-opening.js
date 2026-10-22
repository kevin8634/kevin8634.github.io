/* 天枢 Starhelm · sh-opening.js · 学科开场(v1.0-M1c)
 * 约 8 秒:从你所在的那一点出发,七层光壳逐层展开到宇宙,再收回到地球。随时可跳过(点任意处 / Esc)。
 * v1.0-M3d 起每次进入自动播放(王磊 10-23),可跳过;星桥深链 ?domain= / ?task= 进入时不打扰;顶栏「↺ 开场」可重播。
 * 减少动态:静态标题 2 秒淡出。默认无声(声音即规律,默认关)。API:window.SHOPEN.play(force)
 */
(function () {
  'use strict';
  var KEY = 'gn:sh:opening', NAMES = ['家园', '日与月', '行星世界', '太阳系边疆', '群星', '银河', '宇宙'];
  var SCALE = ['约 1 万 km', '约 100 万 km', '约 10 亿 km', '约 1000 亿 km', '约 10 光年', '约 10 万光年', '约 900 亿光年'];
  var root = null, raf = 0, t0 = 0, cv, g, stars = [], done = null;
  function reduced() { return matchMedia('(prefers-reduced-motion: reduce)').matches; }
  function seen() { try { return !!localStorage.getItem(KEY); } catch (e) { return true; } }
  function mark() { try { localStorage.setItem(KEY, String(Date.now())); } catch (e) { } }
  function build() {
    root = document.createElement('div'); root.className = 'sho'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-label', '天枢 Starhelm 开场');
    root.innerHTML = '<canvas class="sho-cv"></canvas><div class="sho-tx"><small>创世计划 · 第七个世界 · 天文</small><h1>天枢 <span>Starhelm</span></h1><p class="sho-q">此刻,你在宇宙的哪里?</p></div>' +
      '<div class="sho-sc"></div><button class="sho-skip" type="button">跳过 ›</button>';
    document.body.appendChild(root);
    cv = root.querySelector('.sho-cv'); g = cv.getContext('2d');
    root.addEventListener('click', end);
    addEventListener('keydown', function (e) { if (root && !root.hidden && e.key === 'Escape') end(); });
    for (var i = 0; i < 260; i++) stars.push([Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random()]);
  }
  function size() { var d = Math.min(2, devicePixelRatio || 1); cv.width = innerWidth * d; cv.height = innerHeight * d; cv._d = d; }
  function ease(x) { return x < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x); }
  function frame(t) {
    raf = requestAnimationFrame(frame);
    var s = (t - t0) / 1000, W = cv.width, H = cv.height, d = cv._d, cx = W / 2, cy = H / 2, M = Math.min(W, H);
    g.fillStyle = '#02040a'; g.fillRect(0, 0, W, H);
    // 0–5s 展开(每层 0.6s),5–7s 收回,7–8s 淡出
    var out = ease(s / 4.6), back = ease((s - 5.2) / 1.6), k = out * (1 - back);
    // 星空:随展开缓缓后退
    for (var i = 0; i < stars.length; i++) {
      var st = stars[i], z = 1 + k * 1.6 * st[2];
      g.fillStyle = 'rgba(200,220,255,' + (0.25 + 0.5 * st[2]) + ')';
      g.fillRect(cx + st[0] * W * 0.55 / z, cy + st[1] * H * 0.55 / z, d * (0.6 + st[2]), d * (0.6 + st[2]));
    }
    var shown = Math.min(7, Math.floor(s / 0.62) + 1), lab = root.querySelector('.sho-sc');
    for (var n = 0; n < 7; n++) {
      var a = ease((s - n * 0.62) / 0.8) * (1 - back); if (a <= 0) continue;
      var r = M * (0.06 + n * 0.062) * (0.4 + 0.6 * out) * (1 - 0.85 * back);
      g.strokeStyle = n === shown - 1 && back === 0 ? 'rgba(240,201,122,' + a + ')' : 'rgba(127,214,255,' + 0.5 * a + ')';
      g.lineWidth = d * (n === shown - 1 ? 1.6 : 0.9); g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.stroke();
    }
    var cur = Math.max(0, shown - 1);
    var txt = back > 0 ? '……再回到你脚下这颗蓝色星球' : '星域 ' + ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'][cur] + ' · ' + NAMES[cur] + ' · ' + SCALE[cur];
    if (lab.textContent !== txt) lab.textContent = txt;
    // 中心的地球
    var er = d * (4 + 26 * back), gr = g.createRadialGradient(cx - er * 0.3, cy - er * 0.3, er * 0.1, cx, cy, er);
    gr.addColorStop(0, '#9fd0ff'); gr.addColorStop(1, '#1d4f9a'); g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, er, 0, Math.PI * 2); g.fill();
    root.style.opacity = s > 7.2 ? Math.max(0, 1 - (s - 7.2) / 0.8) : 1;
    if (s > 8) end();
  }
  function end(e) {
    if (e && e.target && e.target.closest && e.target.closest('a')) return;
    if (!root || root.hidden) return;
    cancelAnimationFrame(raf); root.hidden = true; root.style.opacity = ''; root.classList.remove('sho--static'); document.body.classList.remove('sho-on'); mark();
    if (done) { var f = done; done = null; f(); }
  }
  function play(force, cb) {
    if (!force && seen()) return false;
    if (!root) build();
    done = cb || null; root.hidden = false; document.body.classList.add('sho-on'); size();
    if (reduced()) { root.classList.add('sho--static'); g.fillStyle = '#02040a'; g.fillRect(0, 0, cv.width, cv.height); root.querySelector('.sho-sc').textContent = '七个星域 · 从家园到宇宙'; setTimeout(end, 2000); return true; }
    t0 = performance.now(); cancelAnimationFrame(raf); raf = requestAnimationFrame(frame);
    return true;
  }
  addEventListener('resize', function () { if (root && !root.hidden) size(); });
  window.SHOPEN = { play: play, seen: seen };
  // 第一次进入自动播放(门户接力 / 深链 / 无 HUD 时不播)
  (function wait(k) {
    if (window.SHHUD && window.SHDOM && SHDOM.ready) {
      var portal = false; try { portal = !!sessionStorage.getItem('gn:portal:arrive'); } catch (e) { }
      if (!/[?&](domain|task)=/.test(location.search)) play(true);   // v1.0-M3d 王磊:每次进入默认播放(可跳过;星桥深链除外)
      return;
    }
    if (k > 600) return; setTimeout(function () { wait(k + 1); }, 100);
  })(0);
})();
