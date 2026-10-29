/* 天枢 T3 · 完整登舰动画「一镜到底」(王磊 2026-10-29 17:27 选方案 B)
 * 云层升空 → 出大气见天枢号 → 飞进机库光带隧道 → 驾驶舱从中心向外亮起。
 * 纯 2D canvas 程序化绘制,不另下载资源;镜头进度跟登舰真实载入(SHXLD)走,
 * 但最快约 6.5 s 播完;载入停住时镜头停在当前段落继续缓慢运动。
 * SHXBD.start(ov, getP) / SHXBD.end(ov, cb):cb 在镜头到达终点时调用,随后从中心开孔露出真实驾驶舱。 */
(function () {
  'use strict';
  var A = null;
  function rm() { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } }
  function ease(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }
  function seg(q, a, b) { return Math.max(0, Math.min(1, (q - a) / (b - a))); }
  function rnd(s) { return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }

  function sprite() {   // 一朵柔和云团的离屏贴图
    var c = document.createElement('canvas'); c.width = c.height = 128; var g = c.getContext('2d');
    var r = g.createRadialGradient(64, 64, 4, 64, 64, 62);
    r.addColorStop(0, 'rgba(255,248,240,.95)'); r.addColorStop(.5, 'rgba(242,236,232,.5)'); r.addColorStop(1, 'rgba(225,230,240,0)');
    g.fillStyle = r; g.fillRect(0, 0, 128, 128); return c;
  }

  function start(ov, getP) {
    stop();
    var cv = document.createElement('canvas'); cv.className = 'bd-cv'; cv.setAttribute('aria-hidden', 'true');
    ov.insertBefore(cv, ov.firstChild); ov.classList.add('bd3'); if (ov.parentNode) ov.parentNode.classList.add('xa-boarding');
    var g = cv.getContext('2d'), R = rnd(20261029), W = 0, H = 0, D = 1, m = 1;
    var clouds = [], stars = [], i;
    for (i = 0; i < 46; i++) clouds.push({ x: R() * 1.6 - .3, y: R() * 1.5, z: .35 + R() * .9, r: .12 + R() * .22, a: .5 + R() * .5 });
    for (i = 0; i < 260; i++) stars.push({ x: R(), y: R(), m: R() });
    A = { ov: ov, cv: cv, g: g, getP: getP, q: 0, t0: performance.now(), last: performance.now(), raf: 0, end: null, endT: 0, rev: 0, ph: 0, spr: sprite(), clouds: clouds, stars: stars, rm: rm() };
    function size() { D = Math.min(devicePixelRatio || 1, innerWidth < 700 ? 1.25 : 1.5); W = cv.clientWidth || innerWidth; H = cv.clientHeight || innerHeight; cv.width = Math.round(W * D); cv.height = Math.round(H * D); }
    size(); A.size = size; addEventListener('resize', size);
    function tick(now) {
      if (!A || A.cv !== cv) return;
      var dw = Math.min(.5, (now - A.last) / 1000), dt = Math.min(.1, dw); A.last = now;   // 镜头推进按真实时间(慢机也不拖延开舱),画面动效按帧
      var p = 0; try { var v = getP() || {}; p = Math.min(1, (v.g || 0) * .7 + (v.a || 0) * .3); } catch (e) { }
      if (A.end) p = 1;
      if (A.frozen) { draw(now / 1000, dt); A.raf = requestAnimationFrame(tick); return; }
      var vmax = A.end ? 1 / 2.2 : 1 / 6.5;              // 最快 6.5 s;收尾(载入已完成/点了继续)时加速
      var tgt = Math.min(p, 1);
      if (!A.end && tgt < 1) tgt = Math.min(tgt, .985);   // 未完成前不走到终点
      A.q += Math.max(0, Math.min(vmax * dw, (tgt - A.q) * Math.min(1, dw * 2.4) + .002 * dw));
      if (A.q > tgt && !A.end) A.q = Math.max(A.q - dw * .02, tgt);
      A.q = Math.min(1, A.q);
      draw(now / 1000, dt);
      if (A.end && A.q >= .999 && !A.endT) { A.endT = now; var cb = A.end; A.end = function () { }; A.end.done = true; try { cb(); } catch (e) { } }
      if (A.endT) { A.rev = Math.min(1, (now - A.endT) / 1300); if (A.rev >= 1) { stop(); return; } }
      A.raf = requestAnimationFrame(tick);
    }
    function draw(t, dt) {
      var q = A.q; m = Math.min(W, H);
      g.setTransform(D, 0, 0, D, 0, 0); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
      g.fillStyle = '#02040a'; g.fillRect(0, 0, W, H);
      if (A.rm) { still(q); return; }
      var s1 = ease(seg(q, 0, .3)), s2 = seg(q, .26, .64), s3 = seg(q, .6, .94), s4 = seg(q, .9, 1);
      if (q < .34) sky(t, s1, seg(q, 0, .3));
      if (q > .24 && q < .66) space(t, s2, q < .3 ? seg(q, .24, .3) : q > .6 ? 1 - seg(q, .6, .66) : 1);
      if (q > .58) tunnel(t, dt, s3, seg(q, .58, .64), s4);
      if (A.endT) reveal();
    }
    function still(q) {   // 减少动态:静态渐变 + 机库光
      var r = g.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * .7);
      r.addColorStop(0, 'rgba(127,214,255,' + (.15 + q * .35) + ')'); r.addColorStop(1, 'rgba(2,4,10,1)');
      g.fillStyle = r; g.fillRect(0, 0, W, H); if (A.endT) reveal();
    }
    function sky(t, s, raw) {   // 段 1:穿云升空,天空由晨蓝渐黑,地平线弯曲加大
      var top = mix([43, 79, 122], [3, 6, 14], s), mid = mix([120, 150, 190], [6, 10, 22], s), hz = mix([243, 163, 92], [70, 120, 200], s);
      var hy = H * (.62 + .2 * s);
      var gr = g.createLinearGradient(0, 0, 0, hy); gr.addColorStop(0, rgb(top)); gr.addColorStop(.7, rgb(mid)); gr.addColorStop(1, rgb(hz));
      g.fillStyle = gr; g.fillRect(0, 0, W, hy + 2);
      starsDraw(s * .9, 0);
      // 地球弧
      var ER = W * (6 - 4.6 * s) + H, cx = W * .5, cy = hy + ER - H * .02 * s;
      g.beginPath(); g.arc(cx, cy, ER, 0, Math.PI * 2); var eg = g.createLinearGradient(0, hy, 0, H);
      eg.addColorStop(0, rgb(mix([150, 165, 190], [30, 70, 120], s))); eg.addColorStop(1, rgb(mix([60, 74, 98], [6, 18, 40], s))); g.fillStyle = eg; g.fill();
      g.save(); g.beginPath(); g.arc(cx, cy, ER + 2, 0, Math.PI * 2); g.lineWidth = 6 + 10 * s; g.strokeStyle = 'rgba(127,200,255,' + (.25 + .4 * s) + ')'; g.shadowColor = '#7fd6ff'; g.shadowBlur = 24; g.stroke(); g.restore();
      // 日出
      var sx = W * .3, sy = hy - H * .01, sr = g.createRadialGradient(sx, sy, 0, sx, sy, m * (.55 - .2 * s));
      sr.addColorStop(0, 'rgba(255,236,200,' + (.95 - .3 * s) + ')'); sr.addColorStop(.2, 'rgba(255,190,120,' + (.5 - .2 * s) + ')'); sr.addColorStop(1, 'rgba(255,160,80,0)');
      g.fillStyle = sr; g.fillRect(0, 0, W, H);
      // 云:相机高度 cam,近的云移动快,越升越少
      var cam = raw * 1.5 + t * .004, ca = 1 - seg(raw, .55, 1);
      if (ca > 0) A.clouds.forEach(function (c) {
        var dy = (c.y - cam), y = H * .5 - dy * H * 1.1 / c.z, x = W * (.5 + (c.x - .5) / c.z) + Math.sin(t * .1 + c.x * 9) * 6;
        var r = c.r * m / c.z * (1.4 + raw * .3); if (y < -r || y > H + r || x < -r || x > W + r) return;
        g.globalAlpha = c.a * ca * .55 * Math.min(1, .3 + c.z * .5); g.drawImage(A.spr, x - r, y - r * .6, r * 2, r * 1.2);
      });
      g.globalAlpha = 1;
      // 机头(第一人称)
      var nose = g.createLinearGradient(0, H * .82, 0, H); nose.addColorStop(0, 'rgba(60,70,88,.0)'); nose.addColorStop(.4, 'rgba(40,48,62,.85)'); nose.addColorStop(1, 'rgba(14,18,26,1)');
      g.fillStyle = nose; g.beginPath(); g.moveTo(W * .3, H); g.quadraticCurveTo(W * .5, H * .8, W * .7, H); g.fill();
      g.strokeStyle = 'rgba(127,214,255,.35)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(W * .36, H); g.quadraticCurveTo(W * .5, H * .84, W * .64, H); g.stroke();
    }
    function space(t, s, a) {   // 段 2:出大气,天枢号由远及近,机库口填满画面
      g.globalAlpha = a; g.fillStyle = '#02040a'; g.fillRect(0, 0, W, H); starsDraw(1, s * .05);
      // 地球边缘留在下方
      var ER = W * 1.4 + H, cx = W * .5, cy = H * (1.02 + .25 * s) + ER;
      g.beginPath(); g.arc(cx, cy - H * .2, ER, 0, Math.PI * 2); var eg = g.createLinearGradient(0, H * .8, 0, H); eg.addColorStop(0, '#1e4a80'); eg.addColorStop(1, '#06121f'); g.fillStyle = eg; g.fill();
      g.save(); g.beginPath(); g.arc(cx, cy - H * .2, ER + 3, 0, Math.PI * 2); g.lineWidth = 14; g.strokeStyle = 'rgba(127,200,255,.55)'; g.shadowColor = '#7fd6ff'; g.shadowBlur = 30; g.stroke(); g.restore();
      // 飞船:指数推近
      var e = ease(s), endScale = 1.25 * W / (.56 * m), sc = m * .06 * Math.exp(Math.log(endScale / .06) * e) ;
      var bx = W * .5 + Math.sin(t * .4) * 4 * (1 - e), by = H * (.42 + .06 * (1 - e)) + Math.cos(t * .33) * 3 * (1 - e);
      g.save(); g.translate(bx, by); g.rotate(Math.sin(t * .25) * .02 * (1 - e)); g.scale(sc, sc); ship(t); g.restore();
      g.globalAlpha = 1;
    }
    function ship(t) {   // 正面视角:扁六边形船体 + 两侧引擎舱 + 中央机库口(局部坐标,宽 2)
      g.lineJoin = 'round';
      // 引擎舱
      [-1, 1].forEach(function (k) {
        g.fillStyle = '#2a313d'; rr(k * .86 - .14, -.12, .28, .26, .06); g.fill();
        g.fillStyle = 'rgba(127,214,255,.85)'; g.beginPath(); g.arc(k * .86, .01, .07, 0, 7); g.fill();
        g.strokeStyle = 'rgba(200,215,235,.5)'; g.lineWidth = .006; rr(k * .86 - .14, -.12, .28, .26, .06); g.stroke();
      });
      // 船体
      g.beginPath(); [[-1, .04], [-.74, -.2], [-.3, -.32], [.3, -.32], [.74, -.2], [1, .04], [.62, .24], [-.62, .24]].forEach(function (p, i) { i ? g.lineTo(p[0] * .8, p[1]) : g.moveTo(p[0] * .8, p[1]); }); g.closePath();
      var hg = g.createLinearGradient(0, -.32, 0, .24); hg.addColorStop(0, '#eef2f7'); hg.addColorStop(.45, '#b9c2cf'); hg.addColorStop(.55, '#4a5462'); hg.addColorStop(1, '#1d232c');
      g.fillStyle = hg; g.fill(); g.strokeStyle = 'rgba(30,40,55,.7)'; g.lineWidth = .006; g.stroke();
      // 面板线
      g.strokeStyle = 'rgba(40,52,70,.45)'; g.lineWidth = .004;
      [-.55, -.4, .4, .55].forEach(function (x) { g.beginPath(); g.moveTo(x, -.28); g.lineTo(x * 1.05, .2); g.stroke(); });
      g.beginPath(); g.moveTo(-.7, -.05); g.lineTo(.7, -.05); g.stroke();
      // 航行灯
      var bl = (Math.sin(t * 4) > .6) ? 1 : .25;
      g.fillStyle = 'rgba(240,201,122,' + bl + ')'; g.beginPath(); g.arc(-.74, .1, .012, 0, 7); g.arc(.74, .1, .012, 0, 7); g.fill();
      g.fillStyle = 'rgba(127,214,255,.9)'; for (var i = -3; i <= 3; i++) { g.beginPath(); g.arc(i * .06, -.27, .006, 0, 7); g.fill(); }
      // 机库口:由外向内的框,青色内光
      g.save(); rr(-.28, -.16, .56, .3, .05); g.clip();
      var ig = g.createRadialGradient(0, 0, .01, 0, 0, .34); ig.addColorStop(0, '#d9fbff'); ig.addColorStop(.25, '#58d3ff'); ig.addColorStop(.7, '#0f3550'); ig.addColorStop(1, '#061420');
      g.fillStyle = ig; g.fillRect(-.3, -.2, .6, .4);
      for (var k = 1; k < 7; k++) { var f = 1 - k / 7.5; g.strokeStyle = 'rgba(160,235,255,' + (.15 + .5 * (1 - f)) + ')'; g.lineWidth = .004; rr(-.28 * f, -.16 * f, .56 * f, .3 * f, .05 * f); g.stroke(); g.fillStyle = 'rgba(240,201,122,.8)'; g.fillRect(-.28 * f + .01 * f, .1 * f, .02 * f, .006); g.fillRect(.26 * f - .02 * f, .1 * f, .02 * f, .006); }
      g.restore();
      g.strokeStyle = 'rgba(127,214,255,.95)'; g.lineWidth = .008; g.shadowColor = '#7fd6ff'; g.shadowBlur = 12; rr(-.28, -.16, .56, .3, .05); g.stroke(); g.shadowBlur = 0;
    }
    function tunnel(t, dt, s, a, s4) {   // 段 3:机库隧道,框体向镜头掠过,两侧青/琥珀光带拉丝
      g.globalAlpha = a;
      var bg = g.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * .75); bg.addColorStop(0, '#0d2a3d'); bg.addColorStop(1, '#03070d');
      g.fillStyle = bg; g.fillRect(0, 0, W, H);
      var sp = .6 + 2.4 * ease(s); A.ph = (A.ph + dt * sp) % 1;
      var cx = W / 2, cy = H / 2, N = 16, bw = W * .62, bh = H * .5;
      for (var i = N - 1; i >= 0; i--) {
        var z = ((i + 1 - A.ph) / N); if (z <= .02) continue; var k = .08 / z, w = bw * k, h = bh * k;
        var al = Math.min(1, (1 - z) * 1.4) * Math.min(1, k * 2);
        g.strokeStyle = 'rgba(127,214,255,' + (al * .8) + ')'; g.lineWidth = Math.max(.6, 2.4 * k);
        oct(cx, cy, w, h); g.stroke();
        g.fillStyle = 'rgba(240,201,122,' + al + ')'; var lw = Math.max(1, 6 * k), lh = Math.max(1, 2 * k);
        g.fillRect(cx - w * .46, cy + h * .44, lw * 3, lh); g.fillRect(cx + w * .46 - lw * 3, cy + h * .44, lw * 3, lh);
        g.fillRect(cx - w * .5 - lh, cy - h * .1, lh, lw * 2); g.fillRect(cx + w * .5, cy - h * .1, lh, lw * 2);
      }
      // 光带拉丝:从消失点向外的线段
      g.lineCap = 'round';
      for (var j = 0; j < 22; j++) {
        var an = j / 22 * Math.PI * 2 + .13, u = (A.ph * (1 + (j % 3) * .3) + j * .37) % 1, r0 = Math.pow(u, 2.2) * Math.max(W, H) * .9, r1 = r0 + (40 + 260 * u) * (.4 + ease(s));
        var cos = Math.cos(an), sin = Math.sin(an) * .62;
        g.strokeStyle = j % 4 === 0 ? 'rgba(240,201,122,' + (u * .8) + ')' : 'rgba(127,214,255,' + (u * .7) + ')'; g.lineWidth = 1 + u * 3;
        g.beginPath(); g.moveTo(cx + cos * r0, cy + sin * r0); g.lineTo(cx + cos * r1, cy + sin * r1); g.stroke();
      }
      // 尽头的驾驶舱门光,越来越大
      var gl = ease(seg(s, .55, 1)), gr = g.createRadialGradient(cx, cy, 0, cx, cy, m * (.08 + 1.1 * gl + .6 * s4));
      gr.addColorStop(0, 'rgba(235,252,255,' + (.6 + .4 * gl) + ')'); gr.addColorStop(.3, 'rgba(127,214,255,' + (.25 + .5 * gl) + ')'); gr.addColorStop(1, 'rgba(127,214,255,0)');
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
      if (s4 > 0) { g.fillStyle = 'rgba(225,246,255,' + (.75 * ease(s4)) + ')'; g.fillRect(0, 0, W, H); }
      g.globalAlpha = 1;
    }
    function reveal() {   // 终点:从中心向外开孔,露出真实驾驶舱(驾驶舱「亮起」)
      var e = ease(A.rev), r = Math.hypot(W, H) * .6 * e;
      g.globalCompositeOperation = 'destination-out';
      var gr = g.createRadialGradient(W / 2, H / 2, Math.max(0, r * .7), W / 2, H / 2, Math.max(1, r * 1.05 + 1));
      gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
      if (r * .7 > 0) { g.beginPath(); g.arc(W / 2, H / 2, r * .7, 0, 7); g.fillStyle = '#000'; g.fill(); }
      g.globalCompositeOperation = 'source-over';
      g.globalAlpha = .5 * (1 - e); g.strokeStyle = '#7fd6ff'; g.lineWidth = 2; g.beginPath(); g.arc(W / 2, H / 2, r * .9, 0, 7); g.stroke(); g.globalAlpha = 1;
    }
    function starsDraw(a, drift) { if (a <= 0) return; var ga = g.globalAlpha; g.fillStyle = '#fff'; A.stars.forEach(function (s) { g.globalAlpha = a * (.25 + .75 * s.m) * ga; var x = ((s.x + drift * s.m) % 1) * W, y = s.y * H * .9; g.fillRect(x, y, s.m > .9 ? 1.6 : 1, s.m > .9 ? 1.6 : 1); }); g.globalAlpha = ga; }
    function rr(x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
    function oct(cx, cy, w, h) { var a = w * .5, b = h * .5, c = Math.min(a, b) * .35; g.beginPath(); g.moveTo(cx - a + c, cy - b); g.lineTo(cx + a - c, cy - b); g.lineTo(cx + a, cy - b + c); g.lineTo(cx + a, cy + b - c); g.lineTo(cx + a - c, cy + b); g.lineTo(cx - a + c, cy + b); g.lineTo(cx - a, cy + b - c); g.lineTo(cx - a, cy - b + c); g.closePath(); }
    function mix(a, b, s) { return [a[0] + (b[0] - a[0]) * s, a[1] + (b[1] - a[1]) * s, a[2] + (b[2] - a[2]) * s]; }
    function rgb(c) { return 'rgb(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ')'; }
    A.raf = requestAnimationFrame(tick);
  }
  function end(ov, cb) {   // 载入完成(或点了继续):让镜头加速走完,到终点后执行 cb 并开孔
    if (!A || A.ov !== ov) { cb(); return; }
    if (A.end) return; A.end = cb;
  }
  function stop() { if (!A) return; if (A.ov && A.ov.parentNode) A.ov.parentNode.classList.remove('xa-boarding'); var r0 = document.getElementById('shxc'); if (r0) r0.classList.remove('xa-boarding'); cancelAnimationFrame(A.raf); removeEventListener('resize', A.size); if (A.cv && A.cv.parentNode) A.cv.remove(); A = null; }
  window.SHXBD = { start: start, end: end, stop: stop, on: function (ov) { return !!(A && A.ov === ov); }, q: function () { return A ? A.q : -1; }, seek: function (v) { if (A) { A.q = v; A.frozen = v != null; } } };   // seek 仅供截图测试
})();
