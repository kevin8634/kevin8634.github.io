/* 天枢 Starhelm 2.0 · C2.12c 天枢航道(SHXGJ)
 * 依据《天枢 银河与宇宙世界层总体设计 v1.0》第 05 节(三种航行、航道网络与信标站、跃迁规则)与图 B;王磊 10-30 13:53:默认自由探索,信标只做收集,不锁内容。
 * - 信标站:每个世界一座(锚点附近);航道 = 信标站之间的连线,沿旋臂走向排布(按图 B 拓扑)。任意两世界可跃迁:沿航道最短路径经过中间信标站。
 * - 跃迁四步:锁定(世界卡「曲率跃迁到此」)→ 转向 → 跃迁(前方压缩为蓝、后方拉伸为红的隧道,4–8 秒)→ 抵达(进入该世界 L1 视角并弹出世界卡,点亮信标)。
 * - 真实耗时永远可见:沿航道航程、「光走这段要 X 年」「旅行者 1 号要 X 年」;曲率跃迁 = 阿尔库别雷驱动,「猜想」档,时间已压缩。
 * - 隧道里 Armilla 读一句目的地问题,抵达前 2 秒显示目的地 TSG 地址。减少动态 / 无 WebGL:改淡入淡出。Esc 直接抵达。
 * - 点亮状态存 localStorage gn:sh:x-gal({lit:[世界], at:当前信标站})。虫洞门(VI ↔ VII)属 C2.13a。
 * - 隧道是 2D 画布特效叠加(驾驶舱 fx 同类),不是天体渲染;隧道全遮挡期间跳过银河粒子绘制(skip3d 钩子)。
 * - C2.12c 定稿(王磊 10-30 22:27 确认效果图):蓝前红后多彩星光拉丝隧道 + 加速/减速包络;转向期三格耗时读数;跃迁期站点进度条。
 * - 航程 = 出发世界锚点 → 经各信标站 → 目的世界锚点 的实际折线长度(恒 ≥ 直线距离),卡片同时列直线距离。
 */
(function () {
  'use strict';
  var GX = window.SHXGX, GW = window.SHXGW, TS = window.SHXTSG; if (!GX || !GX._ || !GW || !TS) return;
  var X = GX._, KEY = 'gn:sh:x-gal', VOY = 9.4607e12 / 17 / 3.15576e7;   // 旅行者 1 号约 17 km/s:每光年约 17,635 年
  var EDGES = [['VI-1', 'VI-2'], ['VI-1', 'VI-3'], ['VI-1', 'VI-4'], ['VI-1', 'VI-9'], ['VI-2', 'VI-8'], ['VI-4', 'VI-8'], ['VI-3', 'VI-5'], ['VI-3', 'VI-6'], ['VI-5', 'VI-7'], ['VI-6', 'VI-7'], ['VI-7', 'VI-10'], ['VI-9', 'GATE']];
  var OFF = { 'VI-1': [-1600, 900, 0], 'VI-7': [700, -700, 0] };   // 信标站避开太阳 / 人马座 A* 标记
  var BS = {}; GW.list.forEach(function (w) { var o = OFF[w.id] || [0, 0, 0]; BS[w.id] = [w.anc[0] + o[0], w.anc[1] + o[1], w.anc[2] + o[2]]; });
  var ADJ = {}; EDGES.forEach(function (e) { (ADJ[e[0]] = ADJ[e[0]] || []).push(e[1]); (ADJ[e[1]] = ADJ[e[1]] || []).push(e[0]); });
  function dist(a, b) { var p = BS[a], q = BS[b]; return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]); }
  function path(a, b) {   // Dijkstra(按光年)
    var D = {}, P = {}, Q = Object.keys(BS); Q.forEach(function (k) { D[k] = Infinity; }); D[a] = 0;
    while (Q.length) { Q.sort(function (x, y) { return D[x] - D[y]; }); var u = Q.shift(); if (u === b || D[u] === Infinity) break; (ADJ[u] || []).forEach(function (v) { var nd = D[u] + dist(u, v); if (nd < D[v]) { D[v] = nd; P[v] = u; } }); }
    if (D[b] === Infinity) return null; var r = [b]; while (r[0] !== a) r.unshift(P[r[0]]); return { ids: r, ly: D[b] };
  }
  function d3(p, q) { return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]); }
  function route(a, b) {   // 实际航程:锚点 → 信标站 … 信标站 → 锚点(三角不等式保证 ≥ 直线)
    var p = path(a, b); if (!p) return null; var A = GW.get(a).anc, B = GW.get(b).anc;
    p.ly = d3(A, BS[a]) + p.ly + d3(BS[b], B); p.st = d3(A, B); p.via = Math.max(0, p.ids.length - 2); return p;
  }
  var ST = { lit: ['VI-1'], at: 'VI-1' };
  try { var s0 = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s0 && s0.lit) { ST.lit = s0.lit.filter(function (k) { return BS[k]; }); ST.at = BS[s0.at] ? s0.at : 'VI-1'; if (ST.lit.indexOf('VI-1') < 0) ST.lit.unshift('VI-1'); } } catch (e) { }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(ST)); } catch (e) { } }
  function nf(x) { return Math.round(x).toLocaleString('zh-CN'); }
  function yrs(y) { return y >= 1e8 ? (y / 1e8).toFixed(y >= 1e9 ? 0 : 1) + ' 亿年' : y >= 1e4 ? (y / 1e4).toFixed(y >= 1e5 ? 0 : 1) + ' 万年' : nf(y) + ' 年'; }
  function sc(id) { return TS.toScene(BS[id]); }

  /* ---------- 样式 / DOM ---------- */
  var css = document.createElement('style');
  css.textContent = '#xgx .bk{position:absolute;left:0;top:0;width:11px;height:11px;margin:-6px 0 0 -6px;border-radius:50%;border:1.5px solid #7fd6ff;background:rgba(10,20,40,.6);pointer-events:auto;cursor:pointer;box-shadow:0 0 6px rgba(127,214,255,.6)}#xgx .bk.lit{border-color:#f0c97a;background:#f0c97a;box-shadow:0 0 10px #f0c97a}#xgx .bk.at::after{content:"";position:absolute;inset:-6px;border-radius:50%;border:1px solid #ffe2a0;animation:xbk 2s infinite}@keyframes xbk{0%{transform:scale(.6);opacity:1}100%{transform:scale(1.6);opacity:0}}' +
    '#xgx .bcn{position:absolute;left:18px;top:188px;font-size:11px;color:#a8b8d0;pointer-events:none;text-shadow:0 0 6px #000}#xgx .bcn b{color:#f0c97a}#xgx .lv{top:214px!important}' +
    '#xgx .jw{position:absolute;inset:0;pointer-events:none;opacity:0;transition:opacity .5s}#xgx .jw.on{opacity:1}#xgx .jw canvas{position:absolute;inset:0;width:100%;height:100%}' +
    '#xgx .jp{position:absolute;inset:0;color:#eef3ff}#xgx .jp .pn{position:absolute;left:50%;top:13%;transform:translateX(-50%);width:min(600px,92vw);text-align:center;padding:14px 18px 14px;border-radius:14px;background:rgba(6,10,24,.66);border:1px solid rgba(127,214,255,.22);box-shadow:0 0 30px rgba(0,0,0,.5);-webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px)}#xgx .jp .st{display:flex;justify-content:center;gap:10px;font-size:11.5px;letter-spacing:.1em;color:#7d8aa3}#xgx .jp .st span.on{color:#7fd6ff}#xgx .jp .st span.dn{color:#f0c97a}' +
    '#xgx .jp h4{margin:8px 0 4px;font-size:20px;font-weight:600;letter-spacing:.06em}#xgx .jp .rt{font-size:12px;color:#b8c6dc}#xgx .jp .rd{margin-top:8px;font-size:13px;line-height:1.7;color:#dfe9f7}#xgx .jp .rd b{color:#f0c97a}#xgx .jp .nt{font-size:10.5px;color:#ff9fb2;margin-top:4px}' +
    '#xgx .jp .aq{margin-top:12px;font-size:15px;color:#e8e0ff;opacity:0;transition:opacity .6s}#xgx .jp .aq.on{opacity:1}#xgx .jp .aq small{display:block;font-size:10.5px;letter-spacing:.3em;color:#b8a8ff}#xgx .jp .ad{margin-top:8px;font:600 15px ui-monospace,Consolas,monospace;color:#7fd6ff;opacity:0;transition:opacity .4s}#xgx .jp .ad.on{opacity:1}' +
    '#xgx .jt,#xgx .jb{position:absolute;left:50%;bottom:72px;transform:translateX(-50%);width:min(720px,94vw);padding:12px 18px;border-radius:14px;background:rgba(6,10,24,.74);border:1px solid rgba(240,201,122,.35);transition:opacity .5s}#xgx .jt .h{font-size:11.5px;color:#a8b8d0;letter-spacing:.06em}#xgx .jt .c3{display:flex;gap:0;margin-top:6px}#xgx .jt .c3 div{flex:1;padding:0 12px;border-left:1px solid rgba(255,255,255,.12)}#xgx .jt .c3 div:first-child{border-left:0;padding-left:0}#xgx .jt small{display:block;font-size:11px;color:#b8c6dc}#xgx .jt b{display:block;font-size:30px;font-weight:500;line-height:1.25;color:#7fd6ff}#xgx .jt .c3 div:nth-child(2) b{color:#f0c97a}#xgx .jt .c3 div:nth-child(3) b{color:#ff9fd0}#xgx .jt s{text-decoration:none;font-size:10.5px;color:#7d8aa3}#xgx .jt .f{margin-top:6px;text-align:right;font-size:10.5px;color:#ff9fb2}' +
    '#xgx .jb{opacity:0;border-color:rgba(127,214,255,.35)}#xgx .jw.wp .jb,#xgx .jw.fast .jb{opacity:1}#xgx .jw.wp .jt{opacity:0}#xgx .jw.fast .jt{opacity:1;bottom:200px}#xgx .jb .t{display:flex;justify-content:space-between;font-size:12.5px;color:#cfe3ff}#xgx .jb .pc{color:#7fd6ff}#xgx .jb .tr{position:relative;height:30px;margin:10px 8px 0}#xgx .jb .tr::before{content:"";position:absolute;left:0;right:0;top:6px;height:3px;border-radius:2px;background:rgba(255,255,255,.14)}#xgx .jb .fl{position:absolute;left:0;top:6px;height:3px;border-radius:2px;background:linear-gradient(90deg,#f0c97a,#7fd6ff);box-shadow:0 0 8px #7fd6ff}#xgx .jb i{position:absolute;top:2px;width:10px;height:10px;margin-left:-5px;border-radius:50%;border:1.5px solid #7fd6ff;background:#0a1428}#xgx .jb i.ps{background:#f0c97a;border-color:#f0c97a;box-shadow:0 0 8px #f0c97a}#xgx .jb em{position:absolute;top:16px;transform:translateX(-50%);white-space:nowrap;font-style:normal;font-size:10.5px;color:#a8b8d0}#xgx .jb .nx{text-align:center;font-size:12px;color:#dfe9f7;margin-top:2px}' +
    '#xgx .jw.wp~.lay,#xgx.jump .hd,#xgx.jump .sc{opacity:0;transition:opacity .4s}' +
    '#xgx.jump .bar,#xgx.jump .lg,#xgx.jump .lv,#xgx.jump .lay,#xgx.jump .cd,#xgx.jump .tsg,#xgx.jump .bcn{opacity:0;pointer-events:none}#xgx .cd .jr{margin-top:8px;padding:6px 9px;border-radius:9px;border:1px dashed rgba(240,201,122,.5);font-size:11.5px;color:#d8c9a0}#xgx .cd .row .jg{border-color:#7fd6ff;color:#7fd6ff}' +
    '@media (max-width:760px){#xgx .bcn{top:186px;left:12px;font-size:10.5px}#xgx .lg{top:208px!important}#xgx .jp .pn{top:7%;padding:10px 12px}#xgx .jp h4{font-size:16px}#xgx .jp .rd{font-size:12px}#xgx .jt,#xgx .jb{bottom:60px;padding:10px 12px}#xgx .jt b{font-size:19px}#xgx .jt .c3 div{padding:0 6px}#xgx .jt small{font-size:10px}#xgx .jw.fast .jt{bottom:178px}}';
  document.head.appendChild(css);
  var BK = [], bcn = null, jw = null, jc = null, jp = null, LN = null, built = false;
  function dom() {
    var ov = X.ov(), lay = X.lay(); if (!ov || built) return; built = true;
    GW.list.forEach(function (w) { var e = document.createElement('div'); e.className = 'bk'; e.title = '信标站 · ' + w.id + ' ' + w.name; e.onclick = function (ev) { ev.stopPropagation(); X.showWorld(w); }; lay.appendChild(e); BK.push({ el: e, id: w.id, p: sc(w.id) }); });
    bcn = document.createElement('div'); bcn.className = 'bcn'; ov.appendChild(bcn);
    jw = document.createElement('div'); jw.className = 'jw'; jw.innerHTML = '<canvas></canvas><div class="jp"></div>'; ov.insertBefore(jw, ov.querySelector('.lay')); jc = jw.querySelector('canvas'); jp = jw.querySelector('.jp');
    paint();
  }
  function paint() {
    if (!bcn) return; BK.forEach(function (b) { b.el.classList.toggle('lit', ST.lit.indexOf(b.id) >= 0); b.el.classList.toggle('at', ST.at === b.id); });
    var w = GW.get(ST.at); bcn.innerHTML = '信标收集 <b>' + ST.lit.length + ' / ' + GW.count + '</b> · 当前信标站 ' + w.id + ' ' + w.im + ' · 自由探索';
  }

  /* ---------- 航道线 ---------- */
  X.hook('build', function (T, scn) {
    var lp = []; EDGES.forEach(function (e) { var a = sc(e[0]), b = sc(e[1]); lp.push(a[0], a[1], a[2], b[0], b[1], b[2]); });
    var g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(new Float32Array(lp), 3));
    LN = new T.LineSegments(g, new T.LineDashedMaterial({ color: 0xf0c97a, dashSize: 900, gapSize: 600, transparent: true, opacity: .6, depthTest: false, depthWrite: false }));
    LN.computeLineDistances(); LN.frustumCulled = false; LN.renderOrder = 4; scn.add(LN);
  });
  X.hook('frame', function (now, vis) { if (LN) LN.visible = vis && X.layers.jr && !J; });
  X.hook('labels', function (proj, W, H, far) {
    dom();
    BK.forEach(function (b) {
      var q = X.layers.jr && !J ? proj(b.p) : null;
      if (!q || (b.id === 'GATE' && far < 150000) || far > 400000 || q[0] < 0 || q[0] > W || q[1] < 120 || q[1] > H - 70) { b.el.style.display = 'none'; return; }
      b.el.style.display = ''; b.el.style.transform = 'translate(' + q[0] + 'px,' + q[1] + 'px)';
    });
  });
  X.hook('flat', function (g, s, W, H) {
    if (!X.layers.jr) return; g.save(); g.setLineDash([6, 5]); g.strokeStyle = 'rgba(240,201,122,.75)'; g.lineWidth = 1.4;
    EDGES.forEach(function (e) { if (e[1] === 'GATE') return; var a = BS[e[0]], b = BS[e[1]]; g.beginPath(); g.moveTo(W / 2 + a[0] * s, H / 2 + a[1] * s); g.lineTo(W / 2 + b[0] * s, H / 2 + b[1] * s); g.stroke(); });
    g.restore();
  });
  X.hook('close', function () { if (J) finish(true); BK.forEach(function (b) { b.el.remove(); }); BK = []; built = false; if (bcn) bcn.remove(); if (jw) jw.remove(); bcn = jw = jc = jp = null; LN = null; });
  // 世界卡:航段预览 + 「曲率跃迁到此」
  X.hook('card', function (card, w) {
    var row = card.querySelector('.row'), nt = card.querySelectorAll('.nt'), info = document.createElement('div'); info.className = 'jr';
    nt.forEach(function (n) { if (/C2\.12c/.test(n.textContent)) n.textContent = n.textContent.replace('信标站与曲率跃迁航道:C2.12c 开放', '信标站 · 曲率跃迁已开放'); });
    if (w.id === ST.at) { info.innerHTML = '◉ 你在这个信标站' + (ST.lit.indexOf(w.id) >= 0 ? ' · 信标已点亮' : ''); card.insertBefore(info, row); return; }
    var p = route(ST.at, w.id); if (!p) return;
    info.innerHTML = '┅ 天枢航道:' + p.ids.join(' → ') + '<br>航程(经信标站)约 ' + X.fly(p.ly) + ' · 直线 ' + X.fly(p.st) + '<br>光要 ' + yrs(p.ly) + ' · 旅行者 1 号要 ' + yrs(p.ly * VOY) + (w.id === 'GATE' ? '<br>到门槛信标站;穿虫洞门去星域 VII 在 C2.13a 开放' : '');
    card.insertBefore(info, row);
    var b = document.createElement('button'); b.type = 'button'; b.className = 'jg'; b.textContent = '曲率跃迁到此'; b.onclick = function () { jump(w.id); }; row.insertBefore(b, row.firstChild);
  });

  /* ---------- 跃迁序列 ---------- */
  var J = null, PAL = ['#7fd6ff', '#b48cff', '#ff9fd0', '#f0c97a'];
  function jump(id, o) {   // o.dur:测试用,指定跃迁时长(ms)
    if (J || !GW.get(id) || id === ST.at || !GX.isOpen()) return false; var p = route(ST.at, id); if (!p) return false;
    dom(); var ov = X.ov(), C = X.C, w = GW.get(id), fast = X.rm() || X.mode() !== '3d', w0 = GW.get(ST.at);
    var pts = p.ids.map(sc), seg = [0]; for (var i = 1; i < pts.length; i++) seg.push(seg[i - 1] + d3(pts[i], pts[i - 1]));
    J = { id: id, w: w, p: p, pts: pts, seg: seg, t0: performance.now(), lt: 0, turn: fast ? 0 : 1600, dur: (o && o.dur) || (fast ? 2600 : 5000 + 3000 * Math.min(1, p.ly / 60000)), fast: fast, c0: { tx: C.tx, ty: C.ty, tz: C.tz, d: C.d, pit: C.pit, yaw: C.yaw }, stars: null, aq: false, ad: false, ph: '' };
    X.closeCard(); ov.classList.add('jump'); jw.classList.add('on'); size();
    var tk = p.ids.map(function (k, i) { return '<i style="left:' + (100 * seg[i] / seg[seg.length - 1]).toFixed(2) + '%" data-i="' + i + '"></i><em style="left:' + (100 * seg[i] / seg[seg.length - 1]).toFixed(2) + '%">' + k + '</em>'; }).join('');
    jp.innerHTML = '<div class="pn"><div class="st"><span class="dn">锁定</span>›<span class="on">转向</span>›<span>跃迁</span>›<span>抵达</span></div><h4>曲率跃迁 · ' + w0.id + ' → ' + w.id + ' ' + w.im + '</h4><div class="rt">航道 ' + p.ids.join(' → ') + '</div>' +
      '<div class="rd">航程约 <b>' + X.fly(p.ly) + '</b> · 光走这段要 <b>' + yrs(p.ly) + '</b> · 旅行者 1 号要 <b>' + yrs(p.ly * VOY) + '</b></div><div class="nt">时间已压缩 · 曲率跃迁 = 阿尔库别雷驱动,「猜想」档(从未实现)</div>' +
      '<div class="aq"><small>ARMILLA</small>' + w.q + '</div><div class="ad">目的地 ' + w.a.addr + '</div></div>' +
      '<div class="jt"><div class="h">耗时读数 · ' + w0.id + ' ' + w0.im + ' → ' + w.id + ' ' + w.im + '</div><div class="c3"><div><small>航程(经 ' + p.via + ' 座中途信标站)</small><b>' + X.fly(p.ly) + '</b><s>直线 ' + X.fly(p.st) + '</s></div><div><small>光走这段要</small><b>' + yrs(p.ly) + '</b><s>光速 30 万 km/s</s></div><div><small>旅行者 1 号要</small><b>' + yrs(p.ly * VOY) + '</b><s>约 17 km/s</s></div></div><div class="f">时间已压缩 · 曲率跃迁 =「猜想」档</div></div>' +
      '<div class="jb"><div class="t"><span class="pc">跃迁进度 0%</span><span class="eta"></span></div><div class="tr"><div class="fl"></div>' + tk + '</div><div class="nx"></div></div>';
    if (fast) jw.classList.add('fast'); else jw.classList.remove('fast');
    return true;
  }
  if (window.SHXESC) SHXESC.reg('galjump', 120, function () { return !!J; }, function () { finish(); });   // Esc:只结束跃迁、直接抵达(高于银河全景 110,不关全景)
  function size() { if (!jc) return; var D = X.small() ? .8 : 1; jc.width = Math.round(jc.clientWidth * D); jc.height = Math.round(jc.clientHeight * D); }
  function stepTo(id) { if (!jp || J.ph === id) return; J.ph = id; var s = jp.querySelectorAll('.st span'), k = ['锁定', '转向', '跃迁', '抵达'].indexOf(id); s.forEach(function (e, i) { e.className = i < k ? 'dn' : i === k ? 'on' : ''; }); }
  function along(u) {   // 0..1 → 场景点
    var L = J.seg[J.seg.length - 1] * u, i = 1; while (i < J.seg.length - 1 && J.seg[i] < L) i++;
    var a = J.pts[i - 1], b = J.pts[i], k = (L - J.seg[i - 1]) / Math.max(1, J.seg[i] - J.seg[i - 1]); return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
  }
  function ease(k) { return k * k * (3 - 2 * k); }
  function sm(k) { return k * k * k * (k * (k * 6 - 15) + 10); }               // 位置包络(加速 → 巡航 → 减速)
  function cov(u) { var a = Math.min(1, u / .12), b = Math.min(1, (1 - u) / .14); return ease(Math.max(0, Math.min(a, b))); }   // 隧道遮挡度
  X.hook('skip3d', function () { return !!(J && !J.fast && J.cv >= .985); });   // 隧道全遮挡:不画银河
  X.hook('step', function (now) {
    if (!J) return false; var C = X.C, t = now - J.t0;
    if (t < J.turn) {   // 转向:镜头拉到出发信标站,朝向航道
      var k = ease(t / J.turn), o = J.pts[0], n = J.pts[1], yw = Math.atan2(o[2] - n[2], o[0] - n[0]);
      C.tx = J.c0.tx + (o[0] - J.c0.tx) * k; C.ty = J.c0.ty + (o[1] - J.c0.ty) * k; C.tz = J.c0.tz + (o[2] - J.c0.tz) * k;
      C.d = J.c0.d * Math.pow(Math.max(16000, Math.min(J.c0.d, 60000)) / J.c0.d, k); C.pit = J.c0.pit + (.55 - J.c0.pit) * k; C.yaw = J.c0.yaw + ((((yw - J.c0.yaw) % 6.2832) + 9.4248) % 6.2832 - 3.1416) * k;
      J.cv = 0; stepTo('转向'); return true;
    }
    if (!J.d1) J.d1 = C.d;
    var u = Math.min(1, (t - J.turn) / J.dur), e = sm(u), q = along(e); stepTo(u < 1 ? '跃迁' : '抵达');
    J.cv = J.fast ? 0 : cov(u);
    C.tx = q[0]; C.ty = q[1]; C.tz = q[2]; C.d = J.d1 + (15000 - J.d1) * e; C.pit = .55;   // 不贴近盘面:近处弥散光大粒子过度绘制
    var nx = along(Math.min(1, e + .02)); if (!J.fast && Math.hypot(nx[0] - q[0], nx[2] - q[2]) > 1) C.yaw = Math.atan2(q[2] - nx[2], q[0] - nx[0]) * .15 + C.yaw * .85;
    if (!J.aq && u > .18) { J.aq = true; var a = jp.querySelector('.aq'); if (a) a.classList.add('on'); }
    if (!J.ad && (J.dur * (1 - u) < 2000 || J.fast)) { J.ad = true; var d = jp.querySelector('.ad'); if (d) d.classList.add('on'); }
    J.u = u; var wp = u > .18; if (wp !== !!J.wp) { J.wp = wp; jw.classList.toggle('wp', wp); }   // 前 18%:三格耗时读数;之后:进度条
    bar(u, e); tunnel(now, u, e);
    if (u >= 1) finish();
    return true;
  });
  function bar(u, e) {
    var b = jp && jp.querySelector('.jb'); if (!b) return; var T = J.seg[J.seg.length - 1], L = T * e, ids = J.p.ids, last = 0;
    b.querySelector('.fl').style.width = (100 * e).toFixed(1) + '%'; b.querySelector('.pc').textContent = '跃迁进度 ' + Math.round(100 * e) + '%';
    b.querySelector('.eta').textContent = '约 ' + Math.max(0, J.dur * (1 - u) / 1000).toFixed(1) + ' 秒后抵达 · Esc 直接抵达';
    b.querySelectorAll('i').forEach(function (el) { var i = +el.dataset.i, ps = J.seg[i] <= L + 1; el.classList.toggle('ps', ps); if (ps) last = i; });
    var nx = ids[Math.min(ids.length - 1, last + 1)], s = last === 0 ? '离开 ' + ids[0] + ' 信标站' : '已过 ' + ids.slice(1, last + 1).join('、');
    s += last < ids.length - 1 ? ' · 下一站 ' + nx + ' ' + GW.get(nx).im : ' · 抵达 ' + nx + ' ' + GW.get(nx).im;
    var n = b.querySelector('.nx'); if (n.textContent !== s) n.textContent = s;
  }
  function col(r) {   // 半径 0..1 → 色桶:中心蓝白 → 青/紫/粉/琥珀流光 → 外缘红橙
    return r < .12 ? 0 : r < .24 ? 1 : r < .62 ? 2 + ((Math.random() * 4) | 0) : r < .8 ? 6 : 7;
  }
  var CB = ['rgba(225,240,255,', 'rgba(130,185,255,', 'rgba(127,214,255,', 'rgba(180,140,255,', 'rgba(255,159,208,', 'rgba(240,201,122,', 'rgba(255,120,90,', 'rgba(255,60,50,'];
  var CW = [.8, 1, 1.3, 1.3, 1.3, 1.3, 1.8, 2.2];
  function tunnel(now, u, e) {   // 前方蓝移压缩、后方红移拉伸的多彩星光拉丝
    if (!jc) return; var g = jc.getContext('2d'), Wd = jc.width, Hd = jc.height, cx = Wd / 2, cy = Hd * .5, R = Math.hypot(cx, cy);
    var dt = Math.min(.05, J.lt ? (now - J.lt) / 1000 : .016); J.lt = now;
    g.clearRect(0, 0, Wd, Hd);
    if (J.fast) { g.fillStyle = 'rgba(4,8,20,' + (Math.sin(Math.PI * u) * .92).toFixed(3) + ')'; g.fillRect(0, 0, Wd, Hd); return; }
    var I = J.cv, v = 30 * u * u * (1 - u) * (1 - u) / 1.875, sp = .08 + .92 * v;   // v:速度包络 0→1→0
    var N = X.small() ? 800 : 2400;
    if (!J.stars) { J.stars = []; for (var i = 0; i < N; i++) J.stars.push({ a: Math.random() * 6.2832, z: .06 / (.06 + .94 * Math.random()), c: Math.random(), w: .4 + Math.random() * .6, k: -1 }); }
    // 底色:中心亮蓝白,外缘红
    var gr = g.createRadialGradient(cx, cy, 0, cx, cy, R);
    gr.addColorStop(0, 'rgba(40,70,150,' + I + ')'); gr.addColorStop(.3, 'rgba(8,10,30,' + I + ')'); gr.addColorStop(.7, 'rgba(18,6,26,' + I + ')'); gr.addColorStop(1, 'rgba(80,10,16,' + I + ')');
    g.fillStyle = gr; g.fillRect(0, 0, Wd, Hd); g.globalCompositeOperation = 'lighter';
    var F = R * .06, tr = .02 + .55 * sp, P = [], k;
    for (k = 0; k < 8; k++) P.push([]);
    J.stars.forEach(function (s) {
      s.z -= dt * (.15 + 1.6 * sp) * s.w;
      var r1 = F / s.z;
      if (r1 > R * 1.05 || s.z <= .02) { s.z = Math.random() < .55 ? .7 + Math.random() * .3 : .06 / (.1 + .9 * Math.random()); s.a = Math.random() * 6.2832; s.k = -1; r1 = F / s.z; }   // 55% 从前方中心涌出(压缩),其余铺满视野
      var rn0 = r1 / R, r2 = r1 * (1 - Math.min(.86, tr * 1.35 * (.3 + rn0)));   // 拖尾指向中心:越靠外缘拉得越长(后方拉伸)
      var rn = rn0; if (s.k < 0 || Math.random() < .004) s.k = col(rn); else if (rn > .8 && s.k < 6) s.k = 6 + (rn > .9 ? 1 : 0); else if (rn > .24 && s.k < 2) s.k = 2 + ((s.c * 4) | 0);
      var ca = Math.cos(s.a), sa = Math.sin(s.a); P[s.k].push(cx + ca * r2, cy + sa * r2, cx + ca * r1, cy + sa * r1);
    });
    var D = Wd / jc.clientWidth;
    for (k = 0; k < 8; k++) {
      var L = P[k]; if (!L.length) continue; g.strokeStyle = CB[k] + ((k < 2 ? .75 : .55) * I * (.5 + .5 * sp)).toFixed(3) + ')'; g.lineWidth = CW[k] * D * (1 + .6 * sp);
      g.beginPath(); for (var j = 0; j < L.length; j += 4) { g.moveTo(L[j], L[j + 1]); g.lineTo(L[j + 2], L[j + 3]); } g.stroke();
    }
    // 中心光核 + 蓝白光环(前方压缩)
    var cr = R * (.16 + .1 * sp), cg = g.createRadialGradient(cx, cy, 0, cx, cy, cr * 2.2);
    cg.addColorStop(0, 'rgba(255,255,255,' + (.95 * I) + ')'); cg.addColorStop(.12, 'rgba(190,225,255,' + (.75 * I) + ')'); cg.addColorStop(.4, 'rgba(90,150,255,' + (.28 * I) + ')'); cg.addColorStop(.55, 'rgba(127,214,255,' + (.18 * I * sp) + ')'); cg.addColorStop(.62, 'rgba(180,140,255,' + (.08 * I) + ')'); cg.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = cg; g.beginPath(); g.arc(cx, cy, cr * 2.2, 0, 6.2832); g.fill();
    // 外缘红移暗角(后方拉伸)
    var vg = g.createRadialGradient(cx, cy, R * .55, cx, cy, R); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(255,50,40,' + (.22 * I * (.4 + .6 * sp)) + ')');
    g.fillStyle = vg; g.fillRect(0, 0, Wd, Hd);
    g.globalCompositeOperation = 'source-over';
  }
  function finish(silent) {
    if (!J) return; var j = J, ov = X.ov(); J = null;
    if (jw) jw.classList.remove('on', 'wp', 'fast'); if (ov) ov.classList.remove('jump'); if (jc) jc.getContext('2d').clearRect(0, 0, jc.width, jc.height);
    ST.at = j.id; if (ST.lit.indexOf(j.id) < 0) ST.lit.push(j.id); save(); paint();
    if (silent) return;
    var C = X.C, e = j.pts[j.pts.length - 1]; C.tx = e[0]; C.ty = e[1]; C.tz = e[2];
    X.enterWorld(j.w); X.showWorld(j.w);
  }
  addEventListener('resize', function () { if (J) size(); });
  window.SHXGJ = { busy: function () { return !!J; }, prog: function () { return J ? J.u || 0 : -1; }, phase: function () { return J ? J.ph : ''; }, cover: function () { return J ? J.cv || 0 : 0; }, jump: jump, at: function () { return ST.at; }, lit: function () { return ST.lit.slice(); }, path: path, route: route, edges: EDGES, skip: function () { finish(); }, reset: function () { ST = { lit: ['VI-1'], at: 'VI-1' }; save(); paint(); } };
})();
