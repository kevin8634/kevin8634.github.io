/* 天枢 T3 · 完整登舰动画「一镜到底」(王磊 2026-10-29 17:27 选方案 B)
 * 云层升空 → 出大气见天枢号 → 飞进机库光带隧道 → 驾驶舱从中心向外亮起。
 * C2.10a 写实化(王磊 10-30 08:57「起飞做好电影质感的云彩进入宇宙,进入星舰内部按 v2」):
 *   写实底图 x/board/*.webp(桌面 1600、手机 800,AI 概念图,本站自制)+ 2.5D 推镜;云团精灵穿脸而过;
 *   灯带 = 从底图提取的发光层(*-glow.webp),叠加呼吸 + 流光(飞船向舰首、机库向深处),颜色取自底图本身。
 *   图片未就绪的段落退回下面的程序化绘制。减少动态:按进度切静帧,不推镜。
 * 镜头进度跟登舰真实载入(SHXLD)走,
 * 但最快约 6.5 s 播完;载入停住时镜头停在当前段落继续缓慢运动。
 * SHXBD.start(ov, getP) / SHXBD.end(ov, cb):cb 在镜头到达终点时调用,随后从中心开孔露出真实驾驶舱。 */
(function () {
  'use strict';
  var A = null;
  function rm() { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } }
  function ease(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }
  function seg(q, a, b) { return Math.max(0, Math.min(1, (q - a) / (b - a))); }
  function rnd(s) { return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }

  // ---- C2.10a 写实素材 ----
  var MOB = (innerWidth || 1200) < 700 || /Mobi|Android|iPhone/.test(navigator.userAgent || '');
  var IMG = {}, BASE = 'x/board/';
  var PUFF = [[312, 23, 206, 138], [31, 24, 243, 143], [742, 25, 253, 139], [511, 39, 245, 213], [248, 162, 101, 64], [326, 193, 241, 150], [778, 194, 205, 139], [32, 202, 247, 142], [548, 294, 248, 123], [276, 338, 96, 64], [30, 369, 244, 161], [740, 374, 248, 156], [309, 381, 268, 150], [609, 451, 102, 73]];
  function load(k, f) { if (IMG[k]) return; var im = new Image(); im.decoding = 'async'; im.onload = function () { im.ok = 1; }; im.src = BASE + f; IMG[k] = im; }
  function pre() { var m = MOB ? '-m' : ''; load('climb', 'climb' + m + '.webp'); load('puffs', 'puffs.webp'); load('edge', 'edge' + m + '.webp'); load('ship', 'ship' + m + '.webp'); load('shipG', 'ship-glow.webp'); load('hangar', 'hangar' + m + '.webp'); load('hangarG', 'hangar-glow.webp'); }
  function ok(k) { var im = IMG[k]; return !!(im && im.ok && im.naturalWidth); }
  try { pre(); } catch (e) { }

  // C2.14a 登舰视频(王磊 10-31 15:58 确认;08 视频宣发《深空之下》,AI 生成画面,画面右上角标识保留):
  // 横屏 16:9 9.125 s(720p / 大屏 1080p,带 BGM);竖屏手机用 720×1280 版。视频播完停在舱内末帧,载入完成后开孔进驾驶舱;
  // 视频 5 s 内起不来或出错 → 退回下面的程序动画;减少动态仍用静帧。
  function vidSrc() {
    try { if (!document.createElement('video').canPlayType('video/mp4; codecs="avc1.640028"')) return null; } catch (e) { return null; }
    var w = innerWidth || 1200, h = innerHeight || 800, dpr = devicePixelRatio || 1;
    if (h > w * 1.15) return BASE + 'v/board-v.mp4';
    return BASE + (w * dpr >= 1700 ? 'v/board-1080.mp4' : 'v/board-720.mp4');
  }
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
    var vs = A.rm ? null : vidSrc();
    if (vs) { var vd = document.createElement('video'); A.vid = vd; A.vT0 = performance.now(); vd.setAttribute('playsinline', ''); vd.playsInline = true; vd.preload = 'auto'; vd.src = vs;
      vd.addEventListener('playing', function () { if (A && A.vid === vd) A.vOK = 1; });
      vd.addEventListener('ended', function () { if (A && A.vid === vd) A.vEnd = 1; });
      vd.addEventListener('error', function () { if (A && A.vid === vd && !A.vOK) A.vid = null; });
      var pr = vd.play(); if (pr && pr.catch) pr.catch(function () { if (!A || A.vid !== vd) return; vd.muted = true; var p2 = vd.play(); if (p2 && p2.catch) p2.catch(function () { if (A && A.vid === vd) A.vid = null; }); }); }
    function size() { D = Math.min(devicePixelRatio || 1, innerWidth < 700 ? 1.25 : 1.5); W = cv.clientWidth || innerWidth; H = cv.clientHeight || innerHeight; cv.width = Math.round(W * D); cv.height = Math.round(H * D); }
    size(); A.size = size; addEventListener('resize', size);
    function tick(now) {
      if (!A || A.cv !== cv) return;
      var dw = Math.min(.5, (now - A.last) / 1000), dt = Math.min(.1, dw); A.last = now;   // 镜头推进按真实时间(慢机也不拖延开舱),画面动效按帧
      var p = 0; try { var v = getP() || {}; p = Math.min(1, (v.g || 0) * .7 + (v.a || 0) * .3); } catch (e) { }
      if (A.end) p = 1;
      if (A.frozen) { draw(now / 1000, dt); A.raf = requestAnimationFrame(tick); return; }
      if (A.vid && !A.vOK && now - A.vT0 > 5000) { try { A.vid.pause(); } catch (e) { } A.vid = null; }   // 视频起不来 → 程序动画
      if (A.vid) {   // 视频模式:进度跟视频时间走;播完停在舱内末帧,等载入完成
        var vd = A.vid, du = vd.duration || 9.125; if (A.vOK) A.q = Math.min(.999, (vd.currentTime || 0) / du);
        var fin = A.vEnd || (A.vOK && vd.currentTime >= du - .06);
        draw(now / 1000, dt);
        if (A.end && fin && !A.endT) { A.q = 1; A.endT = now; var cbv = A.end; A.end = function () { }; A.end.done = true; try { cbv(); } catch (e) { } }
        if (A.endT) { A.rev = Math.min(1, (now - A.endT) / 1300); if (A.rev >= 1) { stop(); return; } }
        A.raf = requestAnimationFrame(tick); return;
      }
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
      if (A.vid) { var vd = A.vid; if (A.vOK && vd.videoWidth) { var k = Math.max(W / vd.videoWidth, H / vd.videoHeight), vw = vd.videoWidth * k, vh = vd.videoHeight * k; g.drawImage(vd, (W - vw) / 2, (H - vh) / 2, vw, vh); } if (A.endT) reveal(); return; }
      var s1 = ease(seg(q, 0, .3)), s2 = seg(q, .26, .64), s3 = seg(q, .6, .94), s4 = seg(q, .9, 1);
      if (q < .34) { if (ok('climb') && ok('edge')) climbR(t, dt, q); else sky(t, s1, seg(q, 0, .3)); }
      if (q > .24 && q < .66) { if (ok('ship')) shipR(t, q); else space(t, s2, q < .3 ? seg(q, .24, .3) : q > .6 ? 1 - seg(q, .6, .66) : 1); }
      if (q > .55) { if (ok('hangar')) hangarR(t, dt, q, s4); else tunnel(t, dt, s3, seg(q, .58, .64), s4); }
      vign();
      if (A.endT) reveal();
    }
    // ---------- C2.10a 写实段落 ----------
    function cover(im, sc, fx, fy, k) {   // 铺满画面;sc≥1 放大,焦点 (fx,fy) 按 k 拉向画面中心;返回绘制矩形
      var iw = im.naturalWidth, ih = im.naturalHeight, b = Math.max(W / iw, H / ih) * sc, w = iw * b, h = ih * b;
      var x0 = (W - w) / 2, y0 = (H - h) / 2, px = x0 + fx * w, py = y0 + fy * h;
      var x = x0 + (W / 2 - px) * k, y = y0 + (H / 2 - py) * k;
      x = Math.min(0, Math.max(W - w, x)); y = Math.min(0, Math.max(H - h, y));
      return [x, y, w, h];
    }
    function img(im, r, a) { if (a <= 0) return; g.globalAlpha = a; g.drawImage(im, r[0], r[1], r[2], r[3]); g.globalAlpha = 1; }
    function climbR(t, dt, q) {   // 段 1:穿越积云(金色侧光、体积云墙)→ 冲出云顶白场 → 平流层地球弧
      var c = seg(q, 0, .24), e = ease(c);
      var r = cover(IMG.climb, 1.04 + .5 * e + .015 * Math.sin(t * .7), .5, .42, e);
      g.save(); g.translate(W / 2, H / 2); g.rotate(.025 * Math.sin(t * .35) - .02 * e); g.translate(-W / 2, -H / 2);
      img(IMG.climb, r, 1 - seg(q, .2, .27)); g.restore();
      puffs(t, dt, q);
      // 冲出云顶:暖白闪,底下换成平流层
      var eo = seg(q, .17, .36);
      if (eo > 0) {
        var ee = ease(eo), r2 = cover(IMG.edge, 1.35 - .33 * ee, .42, .62 - .14 * ee, .6);
        img(IMG.edge, r2, Math.min(1, eo * 3));
        flare(t, r2, ee);
      }
      var wo = Math.exp(-Math.pow((q - .205) / .028, 2));
      if (wo > .01) { g.fillStyle = 'rgba(255,244,226,' + (wo * .92).toFixed(3) + ')'; g.fillRect(0, 0, W, H); }
    }
    function puffs(t, dt, q) {   // 云团精灵:从远处迎面而来、放大、掠过镜头;越往上越稀
      if (!ok('puffs')) return;
      var P = A.pf || (A.pf = []), dens = 1 - seg(q, .12, .21), sp = .55 + 1.6 * seg(q, 0, .2);
      while (P.length < 9 * dens + 1 && q < .21) P.push({ z: 1.15 + R() * .5, x: (R() - .5) * 1.6, y: (R() - .5) * 1.0 - .05, i: (R() * PUFF.length) | 0, f: R() < .5, s: .6 + R() * .7 });
      g.save(); g.globalCompositeOperation = 'source-over';
      P.sort(function (a, b) { return b.z - a.z; });
      for (var i = P.length - 1; i >= 0; i--) {
        var p = P[i]; p.z -= dt * sp * .32; if (p.z <= .06) { P.splice(i, 1); continue; }
        var k = 1 / p.z, sx = W / 2 + p.x * m * .45 * k, sy = H / 2 + p.y * m * .45 * k, rc = PUFF[p.i], sz = m * .5 * p.s * k, h = sz * rc[3] / rc[2];
        var a = Math.max(0, Math.min(1, (1.6 - p.z) * 1.2)) * Math.min(1, (p.z - .06) * 3) * .78;
        if (sx + sz < 0 || sx - sz > W || sy + h < 0 || sy - h > H) continue;
        g.globalAlpha = Math.max(0, a); g.save(); g.translate(sx, sy); if (p.f) g.scale(-1, 1);
        g.drawImage(IMG.puffs, rc[0], rc[1], rc[2], rc[3], -sz / 2, -h / 2, sz, h); g.restore();
      }
      g.restore(); g.globalAlpha = 1;
    }
    function flare(t, r, e) {   // 平流层日芒(位置随底图走)
      var sx = r[0] + r[2] * .165, sy = r[1] + r[3] * .53, rr0 = m * (.5 + .08 * Math.sin(t * 1.3));
      var gr = g.createRadialGradient(sx, sy, 0, sx, sy, rr0); gr.addColorStop(0, 'rgba(255,240,215,.35)'); gr.addColorStop(1, 'rgba(255,200,140,0)');
      g.globalCompositeOperation = 'lighter'; g.fillStyle = gr; g.fillRect(0, 0, W, H); g.globalCompositeOperation = 'source-over';
    }
    function shipR(t, q) {   // 段 2:天枢号悬停于地球上空,镜头推进舰首机库口,灯带呼吸 + 流光向舰首
      var a = seg(q, .28, .34) * (1 - seg(q, .56, .63)); if (a <= 0) return;
      var s = seg(q, .32, .64), e = s * s * (3 - 2 * s), sc = Math.exp(Math.log(4.6) * Math.pow(e, 1.6));
      var bob = (1 - e) * 4;
      var r = cover(IMG.ship, sc, .315, .575, W < H ? 1 : Math.min(1, e * 1.4));
      r[0] += Math.sin(t * .4) * bob; r[1] += Math.cos(t * .33) * bob;
      g.fillStyle = '#02040a'; g.globalAlpha = a; g.fillRect(0, 0, W, H); img(IMG.ship, r, a);
      if (ok('shipG')) glow(IMG.shipG, r, a, t, 'x');
    }
    function hangarR(t, dt, q, s4) {   // 段 3:飞进机库 —— 驾驶舱框掠出画面,霓虹拱门流光往深处跑
      var a = seg(q, .55, .62); var s = seg(q, .58, .95), e = ease(s);
      var r = cover(IMG.hangar, 1.06 + 1.5 * Math.pow(e, 1.3) + .01 * Math.sin(t * 1.7), .5, .484, 1);
      r[0] += Math.sin(t * 2.1) * 1.2 * (1 - e); r[1] += Math.cos(t * 1.7) * 1.2 * (1 - e);
      g.globalAlpha = a; g.fillStyle = '#03060b'; g.fillRect(0, 0, W, H); img(IMG.hangar, r, a);
      if (ok('hangarG')) glow(IMG.hangarG, r, a, t, 'r');
      dust(t, dt, a, e, r);
      var cx = r[0] + r[2] * .5, cy = r[1] + r[3] * .484;
      var gl = ease(seg(s, .55, 1)), gr = g.createRadialGradient(cx, cy, 0, cx, cy, m * (.06 + 1.1 * gl + .6 * s4));
      gr.addColorStop(0, 'rgba(255,240,215,' + (.35 + .6 * gl) * a + ')'); gr.addColorStop(.3, 'rgba(240,201,122,' + (.12 + .4 * gl) * a + ')'); gr.addColorStop(1, 'rgba(240,201,122,0)');
      g.globalCompositeOperation = 'lighter'; g.fillStyle = gr; g.fillRect(0, 0, W, H); g.globalCompositeOperation = 'source-over';
      if (s4 > 0) { g.fillStyle = 'rgba(232,246,255,' + (.8 * ease(s4)) + ')'; g.fillRect(0, 0, W, H); }
    }
    function glow(gi, r, a, t, mode) {   // 灯带:底图提取的发光层 → 呼吸(与操作台同节奏 ~4.2 s)+ 流光带
      var oc = A.oc || (A.oc = document.createElement('canvas')), w = gi.naturalWidth, h = gi.naturalHeight;
      if (oc.width !== w) { oc.width = w; oc.height = h; }
      var o = oc.getContext('2d'), br = .5 + .5 * Math.sin(t * Math.PI * 2 / 4.2), ph = (t * .45) % 1, gr, i, v;
      o.globalCompositeOperation = 'source-over'; o.clearRect(0, 0, w, h); o.drawImage(gi, 0, 0);
      o.globalCompositeOperation = 'destination-in';
      if (mode === 'r') { var cx = w * .5, cy = h * .484; gr = o.createRadialGradient(cx, cy, 0, cx, cy, w * .62); }
      else gr = o.createLinearGradient(w * .26, 0, w * .82, 0);
      for (i = 0; i <= 24; i++) { var u = i / 24; v = Math.pow(.5 + .5 * Math.cos(Math.PI * 2 * (u * 3 + (mode === 'r' ? ph : ph))), 4); gr.addColorStop(u, 'rgba(255,255,255,' + (.15 + .85 * v).toFixed(3) + ')'); }
      o.fillStyle = gr; o.fillRect(0, 0, w, h);
      g.globalCompositeOperation = 'lighter';
      g.globalAlpha = a * (.18 + .3 * br); g.drawImage(gi, r[0], r[1], r[2], r[3]);
      g.globalAlpha = a * (.55 + .35 * br); g.drawImage(oc, r[0], r[1], r[2], r[3]);
      g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    }
    function dust(t, dt, a, e, r) {   // 机库尘埃 + 速度感:从消失点向外的细线
      var D2 = A.du || (A.du = []), cx = r[0] + r[2] * .5, cy = r[1] + r[3] * .484, sp = .25 + 1.6 * e;
      while (D2.length < 70) D2.push({ an: R() * Math.PI * 2, u: R(), c: R() < .25 });
      g.lineCap = 'round';
      D2.forEach(function (d) {
        d.u += dt * sp * (.3 + d.u); if (d.u > 1) { d.u = .02; d.an = R() * Math.PI * 2; }
        var r0 = Math.pow(d.u, 2) * Math.max(W, H) * .8, r1 = r0 * (1 + .04 + .25 * e), co = Math.cos(d.an), si = Math.sin(d.an) * .6;
        g.strokeStyle = d.c ? 'rgba(240,201,122,' + (d.u * .55 * a) + ')' : 'rgba(210,230,255,' + (d.u * .4 * a) + ')'; g.lineWidth = .6 + d.u * 1.6;
        g.beginPath(); g.moveTo(cx + co * r0, cy + si * r0); g.lineTo(cx + co * r1, cy + si * r1); g.stroke();
      });
    }
    function vign() {   // 电影暗角
      var v = A.vg; if (!v || v.w !== W || v.h !== H) { v = A.vg = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .35, W / 2, H / 2, Math.hypot(W, H) * .58); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.55)'); v.w = W; v.h = H; }
      g.fillStyle = v; g.fillRect(0, 0, W, H);
    }
    function still(q) {   // 减少动态:按进度切静帧(不推镜、无流光)
      if (ok('climb') && ok('ship') && ok('hangar')) {
        var a1 = 1 - seg(q, .28, .36), a3 = seg(q, .6, .68);
        img(IMG.ship, cover(IMG.ship, 1, .5, .5, 0), 1);
        img(IMG.climb, cover(IMG.climb, 1, .5, .5, 0), a1);
        img(IMG.hangar, cover(IMG.hangar, 1, .5, .5, 0), a3);
        vign(); if (A.endT) reveal(); return;
      }
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
  function stop() { if (!A) return; if (A.ov && A.ov.parentNode) A.ov.parentNode.classList.remove('xa-boarding'); var r0 = document.getElementById('shxc'); if (r0) r0.classList.remove('xa-boarding'); if (A.vid) { try { A.vid.pause(); A.vid.removeAttribute('src'); A.vid.load(); } catch (e) { } } cancelAnimationFrame(A.raf); removeEventListener('resize', A.size); if (A.cv && A.cv.parentNode) A.cv.remove(); A = null; }
  window.SHXBD = { start: start, end: end, stop: stop, on: function (ov) { return !!(A && A.ov === ov); }, q: function () { return A ? A.q : -1; }, vid: function () { return A ? { on: !!A.vid, ok: !!A.vOK, t: A.vid ? A.vid.currentTime : -1, muted: A.vid ? A.vid.muted : null, src: A.vid ? A.vid.currentSrc : '' } : null; }, seek: function (v) { if (A) { A.q = v; A.frozen = v != null; } } };   // seek 仅供截图测试
})();
