/* 天枢 C2.5 · T6 第一批:深空抵达(星云 / 星系真实影像分层视差)
 * 影像离线去星后按亮度切为 6 层(work/mk_dsolayers.py),越亮的层越靠前;星点单独一层。
 * 2D canvas 绘制,不依赖 WebGL;拖动 / 鼠标移动产生视差,缓慢推进。纵深分层为示意,非真实三维结构。 */
(function () {
  'use strict';
  var DV = {
    M42: { zh: '猎户座大星云', en: 'Orion Nebula · M42', n: 6, dist: '约 1,344 光年', size: '约 24 光年', band: '可见光 + Hα(哈勃 ACS)', type: '发射星云 · 恒星形成区',
      facts: [['距离', '约 1,344 光年'], ['直径', '约 24 光年'], ['核心', '猎户四边形星团(Trapezium)'], ['年龄', '核心恒星约 30 万年'], ['观测波段', '可见光 + Hα(哈勃 ACS)']],
      blurb: '离地球最近的大型恒星形成区。中心四颗年轻大质量恒星的紫外辐射把周围氢气电离发光,暗带是尚未被吹散的尘埃。',
      cr: 'NASA, ESA, M. Robberto(STScI/ESA)及哈勃猎户座宝库项目组 · ESA/Hubble CC BY 4.0' },
    M1: { zh: '蟹状星云', en: 'Crab Nebula · M1', n: 6, dist: '约 6,500 光年', type: '超新星遗迹 · 脉冲星风云',
      facts: [['距离', '约 6,500 光年'], ['直径', '约 11 光年'], ['来历', '1054 年超新星(《宋会要》记载「天关客星」)'], ['核心', '蟹状星云脉冲星,每秒自转约 30 圈'], ['观测波段', '可见光多滤镜合成(哈勃 WFPC2)']],
      blurb: '宋代天文学家记录的「客星」爆发后留下的残骸,至今仍以约 1,500 km/s 向外膨胀;中心脉冲星的高能粒子让内部发出蓝白色同步辐射。',
      cr: 'NASA, ESA, J. Hester, A. Loll(亚利桑那州立大学) · ESA/Hubble CC BY 4.0' },
    M16: { zh: '鹰状星云 · 创生之柱', en: 'Eagle Nebula · Pillars of Creation · M16', n: 6, dist: '约 6,500 光年', type: '发射星云 · 恒星形成区',
      facts: [['距离', '约 6,500 光年'], ['最高柱长', '约 4 光年'], ['成因', '附近大质量恒星的紫外辐射侵蚀分子云'], ['柱顶', '正在形成新恒星的致密气团'], ['观测波段', '可见光 + Hα(哈勃 WFC3,2014)']],
      blurb: '气柱由冷的氢气和尘埃组成,顶端被附近年轻恒星照亮并被一点点吹散。这里分层时按「越暗越近」处理,让气柱浮在前景。',
      cr: 'NASA, ESA 及哈勃传承团队(STScI/AURA) · ESA/Hubble CC BY 4.0' },
    M51: { zh: '涡状星系', en: 'Whirlpool Galaxy · M51', n: 6, dist: '约 2,300 万光年', type: '旋涡星系 · 与伴星系 NGC 5195 互动',
      facts: [['距离', '约 2,300 万光年'], ['直径', '约 7.6 万光年'], ['伴星系', 'NGC 5195(右上黄色)'], ['旋臂', '粉红色为电离氢恒星形成区'], ['观测波段', '可见光 + Hα(哈勃 ACS,2005)']],
      blurb: '最早被看出旋涡结构的星系(罗斯伯爵 1845 年手绘)。伴星系的引力扰动让旋臂格外清晰,也触发了大量新恒星诞生。',
      cr: 'NASA, ESA, S. Beckwith(STScI)及哈勃传承团队(STScI/AURA) · ESA/Hubble CC BY 4.0' }
  };
  var X, ov = null, cv, ctx, imgs = [], star = null, raf = 0, t0 = 0, mx = 0, my = 0, tx = 0, ty = 0, cur = null;
  function el(t, c, h) { var e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; }
  function css() {
    if (document.getElementById('xv-css')) return; var s = el('style'); s.id = 'xv-css';
    s.textContent = '#xv{position:absolute;inset:0;z-index:40;background:#000;overflow:hidden;opacity:0;transition:opacity 1.2s;pointer-events:auto;cursor:grab}#xv.in{opacity:1}#xv canvas{position:absolute;inset:0;width:100%;height:100%}' +
      '#xv .wp{position:absolute;inset:0;pointer-events:none;background:radial-gradient(circle at 50% 50%,rgba(255,255,255,.9),rgba(140,200,255,.35) 20%,transparent 60%);opacity:0;animation:xvW 1.6s ease-out}@keyframes xvW{0%{opacity:0;transform:scale(.2)}35%{opacity:1}100%{opacity:0;transform:scale(3)}}' +
      '#xv .pn{position:absolute;right:max(18px,3vw);top:50%;transform:translateY(-50%);width:min(300px,26vw);padding:14px 16px;color:#d6e2f4;font:12px/1.5 "Noto Sans SC",system-ui,sans-serif;background:linear-gradient(180deg,rgba(14,26,46,.55),rgba(6,12,24,.62));-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);border:1px solid rgba(127,214,255,.25);border-radius:10px;cursor:default}' +
      '#xv .pn h5{margin:0;font-size:10px;letter-spacing:.24em;color:#7fd6ff;font-weight:500}#xv .pn h4{margin:3px 0 8px;font-size:19px;color:#f3f7ff}#xv .pn h4 small{display:block;font-size:11px;color:#8fa3c2;font-weight:400;letter-spacing:.08em}' +
      '#xv .kv{display:flex;justify-content:space-between;gap:10px;padding:3px 0;border-bottom:1px dashed rgba(127,214,255,.1)}#xv .kv span{color:#8fa3c2;white-space:nowrap}#xv .kv b{font-weight:500;color:#e8f0fb;text-align:right}' +
      '#xv .bl{margin-top:8px;color:#b9c6dc}#xv .nt{margin-top:8px;font-size:10.5px;color:#8fa3c2}#xv .nt em{font-style:normal;color:#0a0d14;background:#f0c97a;border-radius:3px;padding:0 5px;margin-right:6px;font-size:10px}' +
      '#xv .bt{position:absolute;left:50%;bottom:28px;transform:translateX(-50%);display:flex;gap:8px}#xv .bt button{padding:8px 16px;border-radius:8px;border:1px solid rgba(127,214,255,.35);background:rgba(8,16,30,.6);color:#dfe9f8;font:inherit;font-size:12.5px;cursor:pointer}#xv .bt button:hover{border-color:#f0c97a;color:#ffd98a}' +
      '#xv .hd{position:absolute;left:50%;top:20px;transform:translateX(-50%);font:12px "Noto Sans SC",system-ui;letter-spacing:.3em;color:#9fdcff;text-shadow:0 0 8px rgba(127,214,255,.8)}' +
      '@media (max-width:900px),(max-height:560px){#xv .pn{top:auto;transform:none;bottom:80px;left:10px;right:10px;width:auto;max-height:36vh;overflow:auto;padding:10px 12px}#xv .pn .bl{display:none}#xv .bt{bottom:16px}}';
    document.head.appendChild(s);
  }
  function kv(k, v) { return '<div class="kv"><span>' + k + '</span><b>' + v + '</b></div>'; }
  function size() { if (!cv) return; var d = Math.min(2, devicePixelRatio || 1); cv.width = ov.clientWidth * d; cv.height = ov.clientHeight * d; }
  function draw(now) {
    if (!ov) return; raf = requestAnimationFrame(draw);
    var W = cv.width, H = cv.height, t = (now - t0) / 1000, ease = 1 - Math.exp(-t / 9);
    tx += (mx - tx) * .05; ty += (my - ty) * .05;
    ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    var n = imgs.length; if (!n || !imgs[0].complete) return;
    var base = Math.max(W, H) / imgs[0].naturalWidth * 1.08;
    function layer(im, depth, alpha) {
      if (!im.complete || !im.naturalWidth) return;
      var sc = base * (0.9 + ease * (0.2 + depth * 0.22) + Math.sin(t * .05) * .01), w = im.naturalWidth * sc, h = im.naturalHeight * sc;
      var px = -tx * depth * W * .035, py = -ty * depth * H * .035;
      ctx.globalAlpha = alpha; ctx.drawImage(im, (W - w) / 2 + px, (H - h) / 2 + py, w, h);
    }
    for (var i = 0; i < n; i++) layer(imgs[i], i / (n - 1), i === 0 ? 1 : .92);
    if (star) layer(star, .35, 1);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  }
  function open(key) {
    var d = DV[key], root = X && X._.root(); if (!d || !root) return; css(); close(true); cur = key;
    var S = X._.S; S.auto = false; S.base = 0; S.mult = 1;
    ov = el('div'); ov.id = 'xv';
    ov.innerHTML = '<canvas></canvas><div class="wp"></div><div class="hd">深空抵达 · ' + d.zh + '</div>' +
      '<div class="pn"><h5>抵达报告 · ' + d.type + '</h5><h4>' + d.zh + '<small>' + d.en + '</small></h4>' + d.facts.map(function (r) { return kv(r[0], r[1]); }).join('') +
      '<div class="bl">' + d.blurb + '</div><div class="nt"><em>影像</em>' + d.cr + '。去星后按亮度分 ' + d.n + ' 层形成视差,纵深为示意。</div></div>' +
      '<div class="bt"><button type="button" data-a="back">返回天枢号</button></div>';
    root.appendChild(ov); cv = ov.querySelector('canvas'); ctx = cv.getContext('2d'); size();
    imgs = []; for (var i = 0; i < d.n; i++) { var im = new Image(); im.decoding = 'async'; im.src = 'x/dsoimg/' + key.toLowerCase() + '-' + i + '.webp'; imgs.push(im); }
    star = new Image(); star.src = 'x/dsoimg/' + key.toLowerCase() + '-s.webp';
    ov.querySelector('[data-a=back]').onclick = function () { close(); };
    ov.addEventListener('pointermove', function (e) { var r = ov.getBoundingClientRect(); mx = (e.clientX - r.left) / r.width * 2 - 1; my = (e.clientY - r.top) / r.height * 2 - 1; });
    ov.addEventListener('pointerleave', function () { mx = my = 0; });
    addEventListener('resize', size);
    t0 = performance.now(); requestAnimationFrame(function () { if (ov) ov.classList.add('in'); }); raf = requestAnimationFrame(draw);
    if (X._.toast) X._.toast('曲率跃迁 · 抵达 ' + d.zh + '(' + d.dist + ')');
  }
  function close(quick) {
    cancelAnimationFrame(raf); removeEventListener('resize', size); if (!ov) return; var o = ov; ov = null; cur = null;
    if (quick) o.remove(); else { o.classList.remove('in'); setTimeout(function () { o.remove(); }, 1200); }
  }
  addEventListener('keydown', function (e) { if (ov && e.key === 'Escape') { e.stopImmediatePropagation(); e.preventDefault(); close(); } }, true);
  function hook(ev) { if (ev === 'close') close(true); }
  (function wait(n) { if (window.SHXC && SHXC.on) { X = SHXC; SHXC.on(hook); return; } if (n < 100) setTimeout(function () { wait(n + 1); }, 100); })(0);
  window.SHXV = { has: function (k) { return !!DV[k]; }, open: open, close: close, list: function () { return Object.keys(DV); }, isOpen: function () { return !!ov; } };
})();
