/* 天枢 C2.5 · T6 深空抵达(星云 / 星系真实影像分层视差)
 * 影像离线去星后按亮度切层(work/mk_dsolayers.py),越亮的层越靠前;星点单独一层。手机读 m 后缀小图。
 * 2D canvas 绘制,不依赖 WebGL;拖动 / 鼠标移动产生视差,缓慢推进。纵深分层为示意,非真实三维结构。
 * C2.6b 银河星域航点:SHXDV.fly(key) —— 目标装进驾驶舱深空航点槽(真实方向 + 真实距离)→ 机头转向 → 曲率引擎加速
 *   → 按光年倒计时(时间已压缩)→ 抵达后接分层影像视图;可「返航 · 太阳系」。减少动态时无特效、短时静态推进。 */
(function () {
  'use strict';
  var LY = 9.4607e12;   // km
  // 资料行第 3 项为认证标签:证 = 已证实(观测测量)· 推 = 推测(模型 / 间接估算,误差较大)· 猜 = 猜想
  var DV = {
    M42: { zh: '猎户座大星云', en: 'Orion Nebula · M42', n: 6, ly: 1344, rly: 12, type: '发射星云 · 恒星形成区',
      facts: [['距离', '约 1,344 光年', '证'], ['直径', '约 24 光年', '证'], ['核心', '猎户四边形星团(Trapezium)', '证'], ['年龄', '核心恒星约 30 万年', '推'], ['观测波段', '可见光 + Hα(哈勃 ACS)']],
      blurb: '离地球最近的大型恒星形成区。中心四颗年轻大质量恒星的紫外辐射把周围氢气电离发光,暗带是尚未被吹散的尘埃。',
      cr: 'NASA, ESA, M. Robberto(STScI/ESA)及哈勃猎户座宝库项目组 · ESA/Hubble CC BY 4.0' },
    M1: { zh: '蟹状星云', en: 'Crab Nebula · M1', n: 6, ly: 6500, rly: 5.5, type: '超新星遗迹 · 脉冲星风云',
      facts: [['距离', '约 6,500 光年(误差约 ±1,600)', '证'], ['直径', '约 11 光年', '证'], ['来历', '1054 年超新星(《宋会要》记载「天关客星」)', '证'], ['核心', '蟹状星云脉冲星,每秒自转约 30 圈', '证'], ['观测波段', '可见光多滤镜合成(哈勃 WFPC2)']],
      blurb: '宋代天文学家记录的「客星」爆发后留下的残骸,至今仍以约 1,500 km/s 向外膨胀;中心脉冲星的高能粒子让内部发出蓝白色同步辐射。',
      cr: 'NASA, ESA, J. Hester, A. Loll(亚利桑那州立大学) · ESA/Hubble CC BY 4.0' },
    M16: { zh: '鹰状星云 · 创生之柱', en: 'Eagle Nebula · Pillars of Creation · M16', n: 6, ly: 7000, rly: 35, type: '发射星云 · 恒星形成区',
      facts: [['距离', '约 7,000 光年', '证'], ['最高柱长', '约 4 光年', '证'], ['成因', '附近大质量恒星的紫外辐射侵蚀分子云', '证'], ['柱顶', '致密气团中可能正在形成新恒星', '推'], ['观测波段', '可见光 + Hα(哈勃 WFC3,2014)']],
      blurb: '气柱由冷的氢气和尘埃组成,顶端被附近年轻恒星照亮并被一点点吹散。这里分层时按「越暗越近」处理,让气柱浮在前景。',
      cr: 'NASA, ESA 及哈勃传承团队(STScI/AURA) · ESA/Hubble CC BY 4.0' },
    M51: { zh: '涡状星系', en: 'Whirlpool Galaxy · M51', n: 6, ly: 23e6, rly: 38000, type: '旋涡星系 · 与伴星系 NGC 5195 互动',
      facts: [['距离', '约 2,300 万光年', '证'], ['直径', '约 7.6 万光年', '证'], ['伴星系', 'NGC 5195(右上黄色)', '证'], ['旋臂', '粉红色为电离氢恒星形成区', '证'], ['观测波段', '可见光 + Hα(哈勃 ACS,2005)']],
      blurb: '最早被看出旋涡结构的星系(罗斯伯爵 1845 年手绘)。伴星系的引力扰动让旋臂格外清晰,也触发了大量新恒星诞生。',
      cr: 'NASA, ESA, S. Beckwith(STScI)及哈勃传承团队(STScI/AURA) · ESA/Hubble CC BY 4.0' },
    // C2.6c 第二批:船底座星云、M31、M8、M20、M57、M104(去星后 3 个前景层 + 底图 + 星点层)
    'NGC 3372': { zh: '船底座星云', en: 'Carina Nebula · NGC 3372', f: 'car', n: 4, ly: 7500, rly: 40, type: '发射星云 · 大质量恒星形成区',
      facts: [['距离', '约 7,500 光年', '证'], ['大小', '约 260 光年(按视大小约 2° 推算)', '推'], ['明星', '船底座 η:大质量双星,1840 年代曾「大爆发」', '证'], ['未来', '船底座 η 可能以超新星结束一生', '推'], ['观测波段', 'Hα(哈勃 ACS,48 帧拼接)+ 地面 S II / O III 着色']],
      blurb: '星云被极端大质量恒星的星风和紫外辐射雕刻成峭壁与尘埃柱;这些恒星正在撕碎孕育它们的母云。红 = 硫,绿 = 氢,蓝 = 氧。',
      cr: 'NASA, ESA, N. Smith(加州大学伯克利分校)及哈勃传承团队(STScI/AURA) · ESA/Hubble CC BY 4.0' },
    M31: { zh: '仙女座星系', en: 'Andromeda Galaxy · M31', f: 'm31', n: 4, ly: 2.5e6, rly: 76000, fit: 'contain', zoom: 1.0, par: .25, type: '旋涡星系(Sb)· 本星系群最大成员',
      facts: [['距离', '约 250 万光年', '证'], ['大小', '可见盘面直径约 15 万光年', '证'], ['本图', '哈勃 600 余张拼接,约 2 亿颗恒星被单独分辨(PHAST)', '证'], ['恒星总数', '约 1 万亿颗', '推'], ['未来', '约 40–50 亿年后可能与银河系并合', '推']],
      blurb: '肉眼可见的最远天体之一,视大小约为满月的 6 倍。左上角模糊的黄色团块是它的伴星系;锯齿状边缘是拼接影像的边界。',
      cr: 'NASA, ESA, B. Williams(华盛顿大学) · ESA/Hubble CC BY 4.0' },
    M8: { zh: '礁湖星云', en: 'Lagoon Nebula · M8', f: 'm8', n: 4, ly: 4000, rly: 27, type: '发射星云 · 恒星形成区',
      facts: [['距离', '约 4,000 光年', '证'], ['大小', '约 55 × 20 光年', '证'], ['本图', '中心区约 4 光年(哈勃 WFC3,2018)', '证'], ['成因', '年轻大质量恒星的辐射与星风吹散、雕刻周围气体', '证'], ['发现', '1654 年霍迪尔纳首次编目', '证']],
      blurb: '哈勃 28 周年影像只拍下了这片湍流恒星形成区的一小块:年轻恒星的强光与星风把气体吹出空腔、雕成丝缕。',
      cr: 'NASA, ESA, STScI · ESA/Hubble CC BY 4.0' },
    M20: { zh: '三叶星云', en: 'Trifid Nebula · M20', f: 'm20', n: 4, ly: 5000, rly: 20, type: '发射 + 反射 + 暗星云 · 恒星形成区',
      facts: [['距离', '约 5,000 光年(各家估计 2,200–9,000 不等)', '推'], ['本图视场', '中心区约 4 光年(哈勃 WFC3,2026)', '证'], ['组成', '发射星云(粉)、反射星云(蓝)、暗星云三合一', '证'], ['变化', '与 1997 年哈勃影像对比,可见结构在人类时间尺度上变化', '证'], ['未来', '数百万年后气体尘埃散尽,只剩恒星', '推']],
      blurb: '颜色反映密度:左上亮蓝处气体稀薄,棕色尘埃带最浓处几乎全黑。这里分层按「越暗越近」处理,让尘埃柱浮在前景。',
      cr: 'NASA, ESA, STScI;图像处理 J. DePasquale(STScI) · ESA/Hubble CC BY 4.0' },
    M57: { zh: '环状星云', en: 'Ring Nebula · M57', f: 'm57', n: 4, ly: 2500, rly: 0.6, par: .6, fit: 'contain', zoom: .82, type: '行星状星云',
      facts: [['距离', '约 2,500 光年', '证'], ['大小', '约 1 光年(按视大小推算)', '推'], ['结构', '扭曲的「甜甜圈」,中间塞着橄榄球状低密度物质', '证'], ['核心', '中心白矮星:类太阳恒星抛掉外层后的残核', '证'], ['太阳的未来', '约 50 亿年后太阳也可能形成类似星云', '推']],
      blurb: '我们恰好沿「甜甜圈」的轴向看过去,所以它像一个环。蓝色主要来自中心高温区的氦,外圈的红色来自氢和氮。',
      cr: 'NASA, ESA, C. Robert O’Dell(范德堡大学) · ESA/Hubble CC BY 4.0' },
    M104: { zh: '草帽星系', en: 'Sombrero Galaxy · M104', f: 'm104', n: 4, ly: 3e7, rly: 25000, par: .45, fit: 'contain', zoom: .92, type: '旋涡星系(Sa)· 室女星系团南缘',
      facts: [['距离', '约 3,000 万光年', '证'], ['直径', '约 5 万光年', '证'], ['视角', '从赤道面以北仅约 6° 看去,近乎侧向', '证'], ['质量', '约 8,000 亿个太阳', '推'], ['观测波段', '可见光(哈勃 ACS 拼接,2003)']],
      blurb: '明亮的白色核球被厚厚的尘埃带环绕,像一顶宽边草帽。视星等约 8 等,小望远镜就能看到。',
      cr: 'NASA/ESA 及哈勃传承团队(STScI/AURA) · ESA/Hubble CC BY 4.0' }
  };
  var WS = [], WT = 2.6;
  var X, ov = null, cv, ctx, imgs = [], star = null, raf = 0, t0 = 0, mx = 0, my = 0, tx = 0, ty = 0, cur = null, OPT = {};
  function el(t, c, h) { var e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; }
  function red() { return matchMedia('(prefers-reduced-motion: reduce)').matches; }
  function small() { return Math.min(screen.width, screen.height) < 700 || innerWidth <= 760 || (navigator.deviceMemory && navigator.deviceMemory < 4); }
  function nf(x, d) { return x.toLocaleString('zh-CN', { maximumFractionDigits: d || 0, minimumFractionDigits: d || 0 }); }
  function fly0(ly) { return ly >= 1e8 ? nf(ly / 1e8, 2) + ' 亿光年' : ly >= 1e4 ? nf(ly / 1e4, ly >= 1e6 ? 0 : 1) + ' 万光年' : ly >= 100 ? nf(ly) + ' 光年' : ly >= 1 ? nf(ly, 1) + ' 光年' : ly >= 0.001 ? nf(ly, 3) + ' 光年' : nf(ly * 63241, 0) + ' AU'; }
  var TAG = { '证': ['已证实', '#7fe0a8'], '推': ['推测', '#f0c97a'], '猜': ['猜想', '#ff9fb2'] };
  function css() {
    if (document.getElementById('xv-css')) return; var s = el('style'); s.id = 'xv-css';
    s.textContent = '#xv{position:absolute;inset:0;z-index:40;background:#000;overflow:hidden;opacity:0;transition:opacity 1.2s;pointer-events:auto;cursor:grab}#xv.in{opacity:1}#xv canvas{position:absolute;inset:0;width:100%;height:100%}' +
      '#xv .wp{position:absolute;inset:0;pointer-events:none;background:radial-gradient(circle at 50% 50%,rgba(255,255,255,.9),rgba(140,200,255,.35) 20%,transparent 60%);opacity:0;animation:xvW 1.4s 2.2s ease-out}@keyframes xvP{to{opacity:1}}@keyframes xvW{0%{opacity:0;transform:scale(.2)}35%{opacity:1}100%{opacity:0;transform:scale(3)}}' +
      '#xv.arr .wp{animation:xvW 1.1s 0s ease-out}#xv.arr .pn{animation-delay:.9s}#xv.rm .wp{display:none}#xv.rm .pn{animation:none;opacity:1}' +
      '#xv .pn{opacity:0;animation:xvP .8s 2.8s forwards;position:absolute;right:max(18px,3vw);top:50%;transform:translateY(-50%);width:min(310px,27vw);max-height:calc(100% - 120px);overflow:auto;padding:14px 16px;color:#d6e2f4;font:12px/1.5 "Noto Sans SC",system-ui,sans-serif;background:linear-gradient(180deg,rgba(14,26,46,.55),rgba(6,12,24,.62));-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);border:1px solid rgba(127,214,255,.25);border-radius:10px;cursor:default}' +
      '#xv .pn h5{margin:0;font-size:10px;letter-spacing:.24em;color:#7fd6ff;font-weight:500}#xv .pn h4{margin:3px 0 8px;font-size:19px;color:#f3f7ff}#xv .pn h4 small{display:block;font-size:11px;color:#8fa3c2;font-weight:400;letter-spacing:.08em}' +
      '#xv .kv{display:flex;justify-content:space-between;align-items:baseline;gap:10px;padding:3px 0;border-bottom:1px dashed rgba(127,214,255,.1)}#xv .kv span{color:#8fa3c2;white-space:nowrap}#xv .kv b{font-weight:500;color:#e8f0fb;text-align:right}#xv .kv i{font-style:normal;font-size:9.5px;border:1px solid;border-radius:3px;padding:0 3px;margin-left:5px;white-space:nowrap;vertical-align:1px}' +
      '#xv .tr{margin:8px 0 2px;padding:6px 8px;border:1px solid rgba(240,201,122,.3);border-radius:6px;background:rgba(240,201,122,.06);color:#f3e2b8;font-size:11.5px}#xv .tr em{font-style:normal;color:#0a0d14;background:#f0c97a;border-radius:3px;padding:0 5px;margin-right:6px;font-size:10px}' +
      '#xv .bl{margin-top:8px;color:#b9c6dc}#xv .nt{margin-top:8px;font-size:10.5px;color:#8fa3c2}#xv .nt em{font-style:normal;color:#0a0d14;background:#f0c97a;border-radius:3px;padding:0 5px;margin-right:6px;font-size:10px}' +
      '#xv .bt{position:absolute;left:50%;bottom:28px;transform:translateX(-50%);display:flex;gap:8px}#xv .bt button{padding:8px 16px;border-radius:8px;border:1px solid rgba(127,214,255,.35);background:rgba(8,16,30,.6);color:#dfe9f8;font:inherit;font-size:12.5px;cursor:pointer;white-space:nowrap}#xv .bt button:hover{border-color:#f0c97a;color:#ffd98a}' +
      '#xv .hd{position:absolute;left:50%;top:20px;transform:translateX(-50%);font:12px "Noto Sans SC",system-ui;letter-spacing:.3em;color:#9fdcff;text-shadow:0 0 8px rgba(127,214,255,.8);white-space:nowrap}' +
      '@media (max-width:900px),(max-height:560px){#xv .pn{top:auto;transform:none;bottom:76px;left:10px;right:10px;width:auto;max-height:36vh;overflow:auto;padding:10px 12px}#xv .pn .bl{display:none}#xv .bt{bottom:16px}#xv .hd{letter-spacing:.12em;font-size:11px}}' +
      /* C2.6b 跃迁倒计时 HUD(驾驶舱内) */
      '#xdv-hud{position:absolute;left:50%;top:186px;transform:translateX(-50%);z-index:31;width:min(460px,calc(100vw - 24px));padding:10px 14px 10px;color:#d6e2f4;font:12px/1.45 "Noto Sans SC",system-ui,sans-serif;background:linear-gradient(180deg,rgba(14,22,40,.72),rgba(6,10,20,.78));border:1px solid rgba(127,214,255,.28);border-radius:10px;box-shadow:0 8px 30px rgba(0,0,0,.5);pointer-events:auto;text-align:center}' +
      '#xdv-hud .h{display:flex;justify-content:space-between;align-items:center;font-size:10.5px;letter-spacing:.2em;color:#7fd6ff}#xdv-hud .h b{color:#f0c97a;font-weight:500;letter-spacing:.1em}' +
      '#xdv-hud .n{margin:2px 0 0;font-size:15px;color:#f3f7ff}#xdv-hud .d{font:600 26px/1.2 "JetBrains Mono",ui-monospace,monospace;color:#ffe2a0;text-shadow:0 0 12px rgba(240,201,122,.45);margin:2px 0}#xdv-hud .d small{font:400 12px "Noto Sans SC",system-ui;color:#c9b88f;margin-left:6px}' +
      '#xdv-hud .bar{height:4px;border-radius:2px;background:rgba(127,214,255,.15);overflow:hidden;margin:4px 0 6px}#xdv-hud .bar i{display:block;height:100%;width:0;background:linear-gradient(90deg,#7fd6ff,#b58cff,#f0c97a)}' +
      '#xdv-hud .s{font-size:11px;color:#a9b8d0}#xdv-hud .tc{display:inline-block;margin-top:5px;font-size:10.5px;color:#0a0d14;background:#f0c97a;border-radius:3px;padding:1px 6px}#xdv-hud .tc+.tc{background:#ff9fb2;margin-left:6px}' +
      '#xdv-hud button{margin-top:6px;padding:4px 12px;border-radius:6px;border:1px solid rgba(127,214,255,.3);background:rgba(8,16,30,.6);color:#c9d6ea;font:inherit;font-size:11px;cursor:pointer}#xdv-hud button:hover{border-color:#f0c97a;color:#ffd98a}' +
      '#shxc>#xv{z-index:45}#shxc>#xdv-hud{z-index:31}' +   /* sh-x-ship.js 的 #shxc>*:not(canvas){z-index:1} 会压平层级,这里用更高优先级恢复 */
      '.xdv-on #xc-toast,.xdv-on .xd-cap,.xdv-on .xd-ring{visibility:hidden}' +   /* 跃迁中由 HUD 统一播报,航段提示让位 */
      '@media (max-width:760px){#xdv-hud{top:262px;padding:6px 10px;width:calc(100vw - 20px)}#xdv-hud .h{font-size:9.5px;letter-spacing:.1em}#xdv-hud .d{font-size:19px}#xdv-hud .n{font-size:12.5px}#xdv-hud .n small{display:none}#xdv-hud .s{font-size:10px;line-height:1.35}#xdv-hud .tc{margin-top:3px;font-size:9.5px}#xdv-hud button{margin-top:4px;padding:3px 10px}.xdv-on #xfx-tag{display:none}}';
    document.head.appendChild(s);
  }
  function kv(k, v, tg) { var t = TAG[tg]; return '<div class="kv"><span>' + k + '</span><b>' + v + (t ? '<i style="color:' + t[1] + ';border-color:' + t[1] + '66">' + t[0] + '</i>' : '') + '</b></div>'; }
  function size() { if (!cv) return; var d = Math.min(small() ? 1.5 : 2, devicePixelRatio || 1); cv.width = ov.clientWidth * d; cv.height = ov.clientHeight * d; }
  function draw(now) {
    if (!ov) return; var rm = OPT.rm; if (!rm) raf = requestAnimationFrame(draw);
    var W = cv.width, H = cv.height, wt = OPT.wt, t = rm ? wt + 60 : (now - t0) / 1000, ease = rm ? 0 : 1 - Math.exp(-Math.max(0, t - wt) / 9);
    if (!rm) { tx += (mx - tx) * .05; ty += (my - ty) * .05; }
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    if (t < wt + .6 && wt > .5) {
      var cx = W / 2, cy = H / 2, R0 = Math.hypot(W, H) / 2, sp = Math.pow(Math.min(1, t / wt), 2.2);
      ctx.lineCap = 'round';
      for (var j = 0; j < WS.length; j++) { var q = WS[j], r = ((q.r + t * q.v * (0.15 + sp * 3)) % 1.2) * R0, len = r * (0.02 + sp * 0.5), al = Math.min(1, r / R0 * 2) * (t > wt ? Math.max(0, 1 - (t - wt) / .6) : 1);
        ctx.strokeStyle = 'hsla(' + q.h + ',90%,' + (70 + sp * 25) + '%,' + al + ')'; ctx.lineWidth = (1 + sp * 2.5) * (W / 1400 + .5);
        ctx.beginPath(); ctx.moveTo(cx + q.c * r, cy + q.s * r); ctx.lineTo(cx + q.c * (r + len), cy + q.s * (r + len)); ctx.stroke(); }
      ctx.globalAlpha = 1;
    }
    var n = imgs.length; if (!n || !imgs[0].complete || !imgs[0].naturalWidth) return;
    var fade = rm ? 1 : Math.max(0, Math.min(1, (t - wt + .5) / 1.3)); if (fade <= 0) return;
    var d = DV[cur], i0 = imgs[0], base = (d && d.fit === 'contain' ? Math.min(W / i0.naturalWidth, H / i0.naturalHeight) * (d.zoom || 1) : Math.max(W / i0.naturalWidth, H / i0.naturalHeight) * 1.08);
    function layer(im, depth, alpha) {
      if (!im.complete || !im.naturalWidth) return;
      var k = i0.naturalWidth / im.naturalWidth, sc = base * k * (rm ? 1 : (0.6 + 0.3 * fade + ease * (0.2 + depth * 0.22) + Math.sin(t * .05) * .01)), w = im.naturalWidth * sc, h = im.naturalHeight * sc;
      var px = -tx * depth * W * .035, py = -ty * depth * H * .035;
      ctx.globalAlpha = alpha * fade; ctx.drawImage(im, (W - w) / 2 + px, (H - h) / 2 + py, w, h);
    }
    var pk = (d && d.par) || 1;   // 星系等致密亮核目标减小层间视差,避免重影
    for (var i = 0; i < n; i++) layer(imgs[i], i / (n - 1) * pk, i === 0 ? 1 : .92);
    if (star) layer(star, .35 * pk, 1);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  }
  /* o: { arrived: {ly, sec} }(由跃迁控制器飞抵时传入) */
  function open(key, o) {
    var d = DV[key], root = X && X._.root(); if (!d || !root) return; css(); close(true); cur = key; o = o || {};
    var S = X._.S; S.auto = false; S.base = 0; S.mult = 1; if (window.SHXE) SHXE.hide();
    var rm = red(), arr = o.arrived; OPT = { rm: rm, wt: rm ? 0 : arr ? 0.3 : WT };
    var f = d.f || key.toLowerCase(), sm = small() ? 'm' : '';
    ov = el('div', (arr ? 'arr' : '') + (rm ? ' rm' : '')); ov.id = 'xv';
    ov.innerHTML = '<canvas></canvas><div class="wp"></div><div class="hd">' + (arr ? '已抵达 → ' + d.zh + ' · 距地球 ' + fly0(d.ly) : '曲率跃迁 → ' + d.zh + ' · ' + fly0(d.ly)) + '</div>' +
      '<div class="pn"><h5>抵达报告 · ' + d.type + '</h5><h4>' + d.zh + '<small>' + d.en + '</small></h4>' + d.facts.map(function (r) { return kv(r[0], r[1], r[2]); }).join('') +
      (arr ? '<div class="tr"><em>时间已压缩</em>本次航程 ' + fly0(arr.ly) + ',演示用时 ' + Math.round(arr.sec) + ' 秒;以光速飞行需约 ' + fly0(arr.ly).replace('光年', '年').replace(' AU', ' AU 光程') + '。<span style="white-space:nowrap">曲率驱动属<b style="color:#ff9fb2;font-weight:500">猜想</b>。</span></div>' : '') +
      '<div class="bl">' + d.blurb + '</div><div class="nt"><em>影像</em>' + d.cr + '。去星后按亮度分 ' + d.n + ' 层形成视差,纵深为示意。</div></div>' +
      '<div class="bt"><button type="button" data-a="back">返回驾驶舱</button>' + (obsOk(key) ? '<button type="button" data-a="obs">舷窗观测 · 模拟渲染</button>' : '') + (arr ? '<button type="button" data-a="home">返航 · 太阳系</button>' : '') + '</div>';
    root.appendChild(ov); cv = ov.querySelector('canvas'); ctx = cv.getContext('2d'); size();
    imgs = []; for (var i = 0; i < d.n; i++) { var im = new Image(); im.decoding = 'async'; im.src = 'x/dsoimg/' + f + '-' + i + sm + '.webp'; if (rm) im.onload = kick; imgs.push(im); }
    star = new Image(); star.src = 'x/dsoimg/' + f + '-s' + sm + '.webp'; if (rm) star.onload = kick;
    ov.querySelector('[data-a=back]').onclick = function () { close(); if (arr) X._.toast('天枢号停泊在 ' + d.zh + ' 附近 · 可在目录选新目标,或按「返航」'); };
    var ob = ov.querySelector('[data-a=obs]'); if (ob) ob.onclick = function () { close(); SHXNB.observe(key); };
    var hb = ov.querySelector('[data-a=home]'); if (hb) hb.onclick = function () { close(); home(); };
    if (!rm) {
      ov.addEventListener('pointermove', function (e) { var r = ov.getBoundingClientRect(); mx = (e.clientX - r.left) / r.width * 2 - 1; my = (e.clientY - r.top) / r.height * 2 - 1; });
      ov.addEventListener('pointerleave', function () { mx = my = 0; });
    }
    mx = my = tx = ty = 0;
    addEventListener('resize', onRs);
    WS = []; for (var k = 0; k < 420; k++) { var an = Math.random() * 6.2832; WS.push({ c: Math.cos(an), s: Math.sin(an), r: Math.random() * 1.2, v: .3 + Math.random() * .7, h: [200, 190, 270, 320, 40][k % 5] }); }
    t0 = performance.now(); requestAnimationFrame(function () { if (ov) ov.classList.add('in'); }); raf = requestAnimationFrame(draw);
    if (!arr && X._.toast) X._.toast('曲率跃迁 · 抵达 ' + d.zh + '(' + fly0(d.ly) + ')');
  }
  function obsOk(key) { var b = X && X._ && X._.BY && X._.BY.tmpdso; return !!(window.SHXNB && SHXNB.has(key) && X.isOpen && X.isOpen() && b && !b.off && b.key === key); }
  function kick() { if (ov && OPT.rm) requestAnimationFrame(draw); }
  function onRs() { size(); kick(); }
  function close(quick) {
    cancelAnimationFrame(raf); removeEventListener('resize', onRs); if (!ov) return; var o = ov; ov = null; cur = null;
    if (quick) o.remove(); else { o.classList.remove('in'); setTimeout(function () { o.remove(); }, 1200); }
  }

  /* ---------------- C2.6b 跃迁控制器 ---------------- */
  var V = null, hud = null;
  function dir(key) {   // 赤经赤纬(J2000)取自 OpenNGC 数据
    var d = DV[key]; if (d.ra != null) return [d.ra, d.dec];
    var L = (window.SH_DSO && SH_DSO.d) || [], id = d.cat || key;
    for (var i = 0; i < L.length; i++) if (L[i][0] === id) { d.ra = L[i][4]; d.dec = L[i][5]; return [d.ra, d.dec]; }
    return null;
  }
  function wsec(ly) { return Math.max(10, Math.min(32, 12 + 4 * Math.log10(Math.max(ly, 1000) / 1000))); }   // 压缩后的演示时长(秒)
  function prof(k) { var a = .16, vm = 1 / (1 - a); return k <= 0 ? 0 : k >= 1 ? 1 : k < a ? vm * k * k / (2 * a) : k < 1 - a ? vm * (k - a / 2) : 1 - vm * (1 - k) * (1 - k) / (2 * a); }   // 梯形速度:加速 / 巡航 / 减速
  function fly(key) {
    var d = DV[key]; if (!d || !X || !X.isOpen || !X.isOpen() || !X._.tempDso) { open(key); return false; }
    var rd = dir(key); if (!rd) { open(key); return false; }
    abort(true); close(true); if (window.SHXK) SHXK.hide();
    var AU = X._.AU, b = X._.tempDso({ zh: d.zh, en: d.en, type: d.type, R: d.rly * LY, fix: [rd[0], rd[1], d.ly * LY / AU], key: key, info: d.facts.map(function (r) { return [r[0], r[1]]; }) });
    if (!b) { open(key); return false; }
    go({ key: key, d: d, tid: 'tmpdso', stop: d.rly * LY * 3, name: d.zh, en: d.en });
    return true;
  }
  // C2.7a:资料卡只「锁定」深空航点(装进航点槽、弹锚点卡),出发由锚点卡「出发」→ fly(key)
  function lock(key, src) {
    var d = DV[key]; if (!d || !X || !X.isOpen || !X.isOpen() || !X._.tempDso) { open(key); return false; }
    var rd = dir(key); if (!rd) { open(key); return false; }
    var AU = X._.AU; return !!X._.tempDso({ zh: d.zh, en: d.en, type: d.type, R: d.rly * LY, fix: [rd[0], rd[1], d.ly * LY / AU], key: key, src: src || '星空点选', info: d.facts.map(function (r) { return [r[0], r[1]]; }) });
  }
  function home() {
    if (!X || !X.isOpen()) return;
    abort(true); X._.setTarget('earth');
    go({ home: true, tid: 'earth', stop: 4e5, name: '地球 · 太阳系', en: 'Earth' });
  }
  function go(o) {
    var S = X._.S, rm = red();
    if (window.SHXS && SHXS.mode) SHXS.mode('boost');
    S.auto = false; S.base = 0; S.mult = 1; S.align = true; S.voy = o.key || 'home';
    if (window.SHXAN) SHXAN.fade(); if (window.SHXNB) SHXNB.endObs();
    V = o; V.rm = rm; V.ph = 'turn'; V.t = 0; V.p0 = S.pos.slice(); V.sec = 0;
    hudShow(); X._.toast((o.home ? '返航:' : '深空航点:') + o.name + ' · 机头转向中');
  }
  function abort(quiet) {
    if (!V) return; var S = X && X._.S, v = V; V = null;
    if (S) { S.voy = null; S.base = 0; S.mult = 1; S.align = false; }
    if (window.SHXS && SHXS.eng) SHXS.eng(null);
    if (hud) { hud.remove(); hud = null; } var rt = X && X._.root && X._.root(); if (rt) rt.classList.remove('xdv-on');
    if (!quiet && X) X._.toast('已中止跃迁 · 停在距' + v.name + ' ' + fly0(v.rem || 0) + ' 处');
  }
  function hudShow() {
    css(); if (hud) hud.remove(); var root = X._.root(); if (!root) return;
    hud = el('div'); hud.id = 'xdv-hud';
    hud.innerHTML = '<div class="h"><span>' + (V.home ? '返航 · 曲率跃迁' : '银河星域 · 曲率跃迁') + '</span><b class="ph">转向</b></div><div class="n">' + V.name + ' <small style="color:#8fa3c2">' + (V.en || '') + '</small></div>' +
      '<div class="d">—</div><div class="bar"><i></i></div><div class="s">—</div><span class="tc">时间已压缩</span><span class="tc">曲率驱动 · 猜想</span><br><button type="button">中止跃迁 · Esc</button>';
    hud.querySelector('button').onclick = function () { abort(); };
    root.appendChild(hud); root.classList.add('xdv-on');
  }
  function want(T, S, to) { return new T.Quaternion().setFromRotationMatrix(new T.Matrix4().lookAt(new T.Vector3(), new T.Vector3(to[0], to[1], to[2]).normalize(), new T.Vector3(0, 1, 0).applyQuaternion(S.q))); }
  function step(f) {
    if (!V) return; var S = X._.S, T = window.THREE, B = X._.BY[V.tid]; if (!B || !B.wp || !T) { abort(true); return; }
    var nw = performance.now(), dt = Math.min(2.5, Math.max(0, (nw - (V.last || nw)) / 1000)); V.last = nw; V.t += dt;   // 用墙钟计时:低帧率设备上演示时长不被拉长
    var xb = document.getElementById('xe-box'); if (window.SHXE && ((xb && xb.classList.contains('on')) || (SHXE.cur && SHXE.cur()))) SHXE.hide();   // 跃迁途中不弹航段讲解卡(show 的 rAF 可能在 hide 之后才加 on,所以按 DOM 状态判断)
    var tp = B.wp, to = [tp[0] - S.pos[0], tp[1] - S.pos[1], tp[2] - S.pos[2]], dist = Math.hypot(to[0], to[1], to[2]);
    var q = hud && hud.querySelector.bind(hud);
    if (V.ph === 'turn') {
      S.align = true; S.base = 0; S.mult = 1;
      if (V.rm) S.q.copy(want(T, S, to));
      var ang = S.q.angleTo(want(T, S, to));
      if (ang < 0.01 || V.t > 4) {
        V.ph = 'warp'; V.t = 0; V.p0 = S.pos.slice(); var dd = Math.max(0, dist - V.stop);
        V.p1 = [S.pos[0] + to[0] / dist * dd, S.pos[1] + to[1] / dist * dd, S.pos[2] + to[2] / dist * dd]; V.len = dd; V.trip0 = S.trip || 0;
        V.dur = V.rm ? 5 : wsec(dd / LY); S.align = false;
        if (!V.rm && window.SHXS && SHXS.eng) SHXS.eng('warp');
        X._.toast('曲率引擎点火 · ' + V.name + ' · ' + fly0(dd / LY));
      }
      if (q) { q('.ph').textContent = '转向'; q('.d').innerHTML = fly0(Math.max(0, dist - V.stop) / LY) + '<small>剩余</small>'; q('.s').textContent = V.home ? '机头对准地球 · 返航距离为真实值' : '机头对准目标 · 方向按 J2000 赤经赤纬,距离为真实值'; }
      return;
    }
    // warp
    var k = Math.min(1, V.t / V.dur), fk = prof(k), fk2 = prof(Math.min(1, k + 0.01));
    S.pos = [V.p0[0] + (V.p1[0] - V.p0[0]) * fk, V.p0[1] + (V.p1[1] - V.p0[1]) * fk, V.p0[2] + (V.p1[2] - V.p0[2]) * fk];
    S.q.slerp(want(T, S, to), Math.min(1, dt * 3));
    if (V.trip0 != null) S.trip = V.trip0 + V.len * fk;   // 本次航程读数按实际跃迁距离
    var v = (fk2 - fk) / (0.01 * V.dur) * V.len;   // 等效速度 km/s
    S.base = v > 0 ? Math.min(v, 30) : 0; S.mult = v > 30 ? v / 30 : 1;
    V.rem = V.len * (1 - fk) / LY; V.sec = V.t;
    if (q) {
      q('.ph').textContent = k < .16 ? '加速' : k < .84 ? '曲率跃迁' : '减速';
      q('.d').innerHTML = fly0(V.rem) + '<small>剩余</small>';
      q('.bar i').style.width = (fk * 100).toFixed(1) + '%';
      q('.s').textContent = '演示剩余 ' + Math.max(0, Math.ceil(V.dur - V.t)) + ' 秒 · 等效约 ' + (v / 299792.458 > 1e4 ? (v / 299792.458).toExponential(1).replace('e+', '×10^') : nf(v / 299792.458, 0)) + ' 倍光速 · 以光速需约 ' + fly0(V.len / LY).replace('光年', '年');
    }
    if (k >= 1) {
      var v0 = V; abort(true);
      if (v0.home) { X._.toast('已返回太阳系 · 地球附近'); return; }
      X._.toast('已抵达 ' + v0.name + ' · ' + fly0(v0.len / LY));
      setTimeout(function () { if (X.isOpen()) arrived(v0.key, { ly: v0.len / LY, sec: v0.dur + 1 }); }, 250);
    }
  }
  // C2.7c(王磊 10-29 11:57):抵达后不自动弹影像 —— 锚点卡位置给二选一「真实照片 / 舷窗观测(模拟渲染)」;减少动态时默认照片
  var ARR = {};
  function arrived(key, arr) {
    ARR[key] = arr;
    if (window.SHXAN && SHXAN.arrive) { var d = DV[key]; SHXAN.arrive({ key: key, zh: d.zh, en: d.en, type: d.type, earth: fly0(d.ly), trip: arr.ly ? fly0(arr.ly) : '', sec: arr.sec, obs: !!(window.SHXNB && SHXNB.has(key)), photo: function () { open(key, { arrived: arr }); }, see: function () { if (window.SHXNB) SHXNB.observe(key); }, home: function () { home(); } }); return; }
    open(key, { arrived: arr });
  }
  function hook(ev, a) {
    if (ev === 'close') { abort(true); close(true); }
    else if (ev === 'frame') { if (V) { try { step(a || {}); } catch (e) { console.warn('[SHXDV fly]', e); abort(true); } } }
    else if (ev === 'arrive' && a && a.dso && a.key && !V && !ov) arrived(a.key, { ly: DV[a.key] ? DV[a.key].ly : 0, sec: 0 });   // 手动 G 自动驾驶飞抵
  }
  (function wait(n) { if (window.SHXC && SHXC.on) { X = SHXC; SHXC.on(hook); return; } if (n < 100) setTimeout(function () { wait(n + 1); }, 100); })(0);
  (function w2(n) { if (window.SHXESC) { SHXESC.reg('dsofly', 90, function () { return !!V; }, function () { abort(); }); return; } if (n < 100) setTimeout(function () { w2(n + 1); }, 100); })(0);
  // C2.6a:原先误用 window.SHXV,会覆盖四级视图 sh-x-views.js 的 SHXV(go/step),导致退出驾驶舱、数字键切视图报错 → 改名 SHXDV
  window.SHXDV = { has: function (k) { return !!DV[k]; }, open: open, close: close, fly: fly, lock: lock, home: home, abort: function () { abort(); }, flying: function () { return V ? { key: V.key, ph: V.ph, rem: V.rem, home: !!V.home } : null; },
    list: function () { return Object.keys(DV); }, lastArr: function (k) { return ARR[k] || null; }, arrived: function (k, a) { if (DV[k]) arrived(k, a || { ly: DV[k].ly, sec: 0 }); }, isOpen: function () { return !!ov; }, info: function (k) { var d = DV[k]; return d ? { zh: d.zh, ly: d.ly, dist: fly0(d.ly) } : null; } };
})();
