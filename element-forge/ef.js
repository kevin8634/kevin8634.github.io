/* 元素工坊 Element Forge · 公共层 ef.js v0.3
   创世计划 Genesis 第 03 世界(化学)。本地存储键:gn:ef:<任务>;以 _ 开头的键为偏好(如 gn:ef:_sound)。
   无账号、无服务器、无埋点、无第三方请求。 */
(function () {
'use strict';
var EF = window.EF = {};
var BASE = (document.currentScript && document.currentScript.src) ? document.currentScript.src.replace(/ef\.js(\?.*)?$/, '') : './';
EF.BASE = BASE;
var KEY = function (k) { return 'gn:ef:' + k; };
EF.get = function (k, d) { try { var v = localStorage.getItem(KEY(k)); return v ? JSON.parse(v) : d; } catch (e) { return d; } };
EF.set = function (k, v) { try { localStorage.setItem(KEY(k), JSON.stringify(v)); } catch (e) {} };
/* 离线缓存:只在 /element-forge/ 作用域注册 */
if ('serviceWorker' in navigator && location.protocol === 'https:' && /\/element-forge\//.test(BASE)) addEventListener('load', function () { navigator.serviceWorker.register(BASE + 'sw.js', { scope: BASE }).catch(function () {}); });
EF.campus = /campus=1/.test(location.search) || EF.get('_campus', 0) === 1;
EF.reduced = (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) || EF.get('_motion', 1) === 0;
EF.mobile = (window.matchMedia && matchMedia('(hover: none)').matches) || innerWidth < 760;
/* 画质分级(§5.3.1):high / mid / low;low = 无 WebGL 或低端机,回落 Canvas 2D 版。?q=high|mid|low 可强制 */
EF.glTier = (function () {
  var q = (location.search.match(/[?&]q=(high|mid|low)/) || [])[1] || EF.get('_quality', 'auto');
  var ok = false, soft = false;
  try { var c = document.createElement('canvas'), g = c.getContext('webgl2') || c.getContext('webgl');
    if (g) { ok = true; var d = g.getExtension('WEBGL_debug_renderer_info'); var r = d ? String(g.getParameter(d.UNMASKED_RENDERER_WEBGL)) : ''; soft = /swiftshader|llvmpipe|software/i.test(r); var lc = g.getExtension('WEBGL_lose_context'); if (lc) lc.loseContext(); } } catch (e) {}
  if (!ok) return 'low';
  if (q !== 'auto') return q;
  if (soft) return 'low';
  var mem = navigator.deviceMemory || 8, cpu = navigator.hardwareConcurrency || 8;
  if (mem <= 2 || cpu <= 2) return 'low';
  if (EF.mobile || mem <= 4 || cpu <= 4) return 'mid';
  return 'high';
})();
EF.dpr = function () { var d = window.devicePixelRatio || 1; return Math.min(d, EF.mobile ? 1.5 : (EF.glTier === 'high' ? 2 : 1.5)); };

/* ---------- 元素与来源(主要来源,简化示意;许多元素有多个来源) ---------- */
EF.ORIGIN = {
  bb: { n: '大爆炸', c: '#bfe3ff', d: '宇宙诞生后最初几分钟' },
  cr: { n: '宇宙射线', c: '#8fd6c4', d: '高能粒子把大原子核撞碎' },
  low: { n: '小恒星临终', c: '#ffb35c', d: '像太阳这样的恒星老去时吹出' },
  massive: { n: '大恒星爆发', c: '#ff6a3d', d: '大质量恒星的超新星' },
  wd: { n: '白矮星爆发', c: '#ffd2ec', d: '白矮星吸积后炸开(Ia 型超新星)' },
  nsm: { n: '中子星合并', c: '#a37bff', d: '两颗中子星相撞' },
  decay: { n: '放射性衰变', c: '#7f8c9c', d: '由铀、钍衰变而来,寿命很短' },
  human: { n: '人造', c: '#566070', d: '自然界几乎没有,靠实验室合成' }
};
var RAW = 'H氢bb He氦bb Li锂low Be铍cr B硼cr C碳low N氮low O氧massive F氟low Ne氖massive Na钠massive Mg镁massive Al铝massive Si硅massive P磷massive S硫massive Cl氯massive Ar氩massive K钾massive Ca钙massive Sc钪massive Ti钛massive V钒wd Cr铬wd Mn锰wd Fe铁wd Co钴wd Ni镍wd Cu铜massive Zn锌massive Ga镓massive Ge锗massive As砷massive Se硒massive Br溴massive Kr氪massive Rb铷massive Sr锶low Y钇low Zr锆low Nb铌low Mo钼low Tc锝human Ru钌nsm Rh铑nsm Pd钯nsm Ag银nsm Cd镉low In铟low Sn锡low Sb锑nsm Te碲nsm I碘nsm Xe氙nsm Cs铯nsm Ba钡low La镧low Ce铈low Pr镨low Nd钕low Pm钷human Sm钐nsm Eu铕nsm Gd钆nsm Tb铽nsm Dy镝nsm Ho钬nsm Er铒nsm Tm铥nsm Yb镱nsm Lu镥nsm Hf铪low Ta钽nsm W钨low Re铼nsm Os锇nsm Ir铱nsm Pt铂nsm Au金nsm Hg汞low Tl铊low Pb铅low Bi铋low Po钋decay At砹decay Rn氡decay Fr钫decay Ra镭decay Ac锕decay Th钍nsm Pa镤decay U铀nsm Np镎human Pu钚human Am镅human Cm锔human Bk锫human Cf锎human Es锿human Fm镄human Md钔human No锘human Lr铹human Rf𬬻human Db𬭊human Sg𬭳human Bh𬭛human Hs𬭶human Mt鿏human Ds𫟼human Rg𬬭human Cn鿔human Nh鿭human Fl𫓧human Mc镆human Lv𫟷human Ts鿬human Og鿫human';
EF.ELEM = RAW.split(' ').map(function (s, i) {
  var m = s.match(/^([A-Z][a-z]?)(.+?)(bb|cr|low|massive|wd|nsm|decay|human)$/);
  return { z: i + 1, sym: m[1], zh: m[2], o: m[3] };
});
EF.FACT = {
  1: '宇宙里最多的元素,你身上约每 10 个原子里有 6 个是氢。', 2: '恒星把氢熔合成氦,这就是太阳发光的秘密。',
  6: '钻石、铅笔芯、你的身体,都离不开它。', 8: '你呼吸的氧,由大恒星炼出、再被超新星撒向宇宙。',
  14: '沙子和芯片里的主角。', 26: '成年人体内约 4 克,大多在血红蛋白里帮你运氧。',
  79: '金子多半来自两颗中子星相撞。', 92: '最重的天然元素之一。', 118: '最年轻的元素,只在加速器里存在过一瞬间——向导奥加的名字就来自它。'
};
/* 周期表格位置 */
EF.pos = function (z) {
  if (z === 1) return [1, 1]; if (z === 2) return [18, 1];
  if (z <= 10) return [z <= 4 ? z - 2 : z + 8, 2];
  if (z <= 18) return [z <= 12 ? z - 10 : z, 3];
  if (z <= 36) return [z - 18, 4]; if (z <= 54) return [z - 36, 5];
  if (z >= 57 && z <= 71) return [z - 57 + 3, 9]; if (z >= 89 && z <= 103) return [z - 89 + 3, 10];
  if (z <= 56) return [z - 54, 6]; if (z <= 86) return [z - 86 + 18, 6];
  if (z <= 88) return [z - 86, 7]; return [z - 118 + 18, 7];
};

/* ---------- 向导:工坊七匠 ---------- */
EF.GUIDES = {
  oga: { n: '奥加', en: 'Oga', from: '鿫 Og · 118 号元素', d: '元素家族最年轻的一员,总在问"我从哪来"', c: '#ffb35c' },
  bucky: { n: '巴基', en: 'Bucky', from: '富勒烯 C₆₀', d: '足球形状的碳分子,碳家族的顽皮鬼', c: '#ffd27a' },
  dot: { n: '小点', en: 'Dot', from: '量子点', d: '个头一变,颜色就变', c: '#ff7ad9' },
  lili: { n: '锂锂', en: 'Lili', from: '锂离子电池', d: '坐不住,总在两极之间跑来跑去', c: '#7ad7ff' },
  mof: { n: '莫芙', en: 'Mof', from: '金属有机框架 MOF', d: '会"呼吸"的晶体海绵,能从空气里抓水', c: '#c9a6ff' },
  click: { n: '咔哒', en: 'Click', from: '点击化学', d: '工坊砧台的拼装师傅', c: '#9fe870' },
  cryo: { n: '霜镜', en: 'Cryo', from: '冷冻电镜', d: '能冻住时间、放大到原子的"尺度镜"', c: '#bfe9ff' }
};
EF.MISSIONS = {
  stars: { q: '你身体里的铁是从哪颗星来的?', n: 4, g: 'oga', href: 'stars/', lv: '★★☆', scale: '恒星 · 原子核', unlock: [1, 2, 6, 8, 10, 12, 14, 26] },
  carbon: { q: '为什么钻石和铅笔芯是同一种东西?', n: 4, g: 'bucky', href: 'carbon/', lv: '★☆☆', scale: '晶体 · 原子', unlock: [6] },
  cabbage: { q: '为什么紫甘蓝汁会变色?', g: 'dot', lv: '★☆☆', soon: 1 },
  battery: { q: '怎样造一块会发电的电池?', g: 'lili', lv: '★★☆', soon: 1 },
  fireworks: { q: '为什么烟花有不同的颜色?', g: 'dot', lv: '★★☆', soon: 1 },
  crystal: { q: '晶体为什么那么整齐?', g: 'cryo', lv: '★★☆', soon: 1 },
  rocks: { q: '岩石是怎么"长"出来的?', g: 'mof', lv: '★★☆', soon: 1 }
};
EF.PLANETS = [
  { q: '火星为什么是红的?', g: 'oga' }, { q: '土卫六的湖里装的是什么?', g: 'mof' },
  { q: '隔着几百光年,怎么知道一颗星球的空气?', g: 'dot' }, { q: '陨石里为什么有生命的零件?', g: 'click' },
  { q: '在火星上怎样造出氧气和燃料?', g: 'mof' }
];
EF.prog = function (m) { return EF.get(m, { done: [], stars: {} }); };
EF.litSet = function () {
  var s = {}; Object.keys(EF.MISSIONS).forEach(function (k) {
    var M = EF.MISSIONS[k]; if (!M.unlock) return; var p = EF.prog(k);
    if (p.done.length >= M.n) M.unlock.forEach(function (z) { s[z] = 1; });
    else if (k === 'stars') { var u = [[1, 2], [6, 8, 10, 12, 14], [26], []]; p.done.forEach(function (i) { (u[i] || []).forEach(function (z) { s[z] = 1; }); }); }
    else if (k === 'carbon' && p.done.length) s[6] = 1;
  }); return s;
};

/* ---------- 向导形象(程序绘制) ---------- */
EF.drawGuide = function (cv, id, t, talk) {
  var x = cv.getContext('2d'), W = cv.width, H = cv.height, cx = W / 2, cy = H / 2, R = Math.min(W, H) * 0.3;
  x.clearRect(0, 0, W, H); t = t || 0; talk = talk || 0;
  var g0 = x.createRadialGradient(cx, cy, 0, cx, cy, R * 2.2); var c = EF.GUIDES[id].c;
  g0.addColorStop(0, c + '55'); g0.addColorStop(1, c + '00'); x.fillStyle = g0; x.fillRect(0, 0, W, H);
  var bob = Math.sin(t / 500) * R * 0.06; cy += bob;
  function eyes(dy, col) {
    var blink = (Math.floor(t / 2800) % 7 === 0 && (t % 2800) < 140) ? 0.15 : 1;
    x.fillStyle = col || '#1a1206';
    [-1, 1].forEach(function (s) { x.beginPath(); x.ellipse(cx + s * R * 0.32, cy + (dy || -R * 0.05), R * 0.1, R * 0.13 * blink, 0, 0, 7); x.fill(); });
    x.strokeStyle = col || '#1a1206'; x.lineWidth = Math.max(1.5, R * 0.05); x.beginPath();
    x.arc(cx, cy + R * 0.22, R * (0.14 + talk * 0.06), 0.15 * Math.PI, 0.85 * Math.PI); x.stroke();
  }
  if (id === 'oga') {
    for (var i = 0; i < 3; i++) { x.strokeStyle = 'rgba(255,190,110,.45)'; x.lineWidth = 1.5; x.beginPath(); x.ellipse(cx, cy, R * 1.5, R * 0.5, t / (900 + i * 400) + i * 1.05, 0, 7); x.stroke(); }
    var g = x.createRadialGradient(cx - R * 0.3, cy - R * 0.3, R * 0.1, cx, cy, R);
    g.addColorStop(0, '#fff4d6'); g.addColorStop(0.5, '#ffb35c'); g.addColorStop(1, '#c4521a');
    x.fillStyle = g; x.beginPath(); x.arc(cx, cy, R, 0, 7); x.fill(); eyes();
  } else if (id === 'bucky') {
    var g2 = x.createRadialGradient(cx - R * 0.3, cy - R * 0.3, R * 0.1, cx, cy, R);
    g2.addColorStop(0, '#fffaf0'); g2.addColorStop(1, '#e0b867'); x.fillStyle = g2; x.beginPath(); x.arc(cx, cy, R, 0, 7); x.fill();
    x.save(); x.beginPath(); x.arc(cx, cy, R, 0, 7); x.clip(); x.fillStyle = '#3a2a14';
    var rot = t / 3000;
    for (var k = 0; k < 6; k++) { var a = rot + k * 1.047, px = cx + Math.cos(a) * R * 0.78, py = cy + Math.sin(a) * R * 0.62; poly(px, py, R * 0.2, 5, a); }
    x.restore(); eyes(-R * 0.08, '#2a1a08');
  } else {
    var g3 = x.createRadialGradient(cx - R * 0.3, cy - R * 0.3, R * 0.1, cx, cy, R);
    g3.addColorStop(0, '#ffffff'); g3.addColorStop(1, c); x.fillStyle = g3; x.beginPath(); x.arc(cx, cy, R, 0, 7); x.fill(); eyes();
  }
  function poly(px, py, r, n, a) { x.beginPath(); for (var j = 0; j < n; j++) { var b = a + j * 2 * Math.PI / n; x[j ? 'lineTo' : 'moveTo'](px + Math.cos(b) * r, py + Math.sin(b) * r); } x.closePath(); x.fill(); }
};

/* ---------- 声音:默认关闭,手势后才创建 AudioContext ---------- */
var SND = EF.snd = { on: EF.get('_sound', 0) === 1, ctx: null, buf: {}, last: {}, music: null, mG: null, sG: null };
var NAMES = ['tick', 'select', 'unlock', 'fuse', 'absorb', 'anvil', 'whoosh', 'boom', 'slide'];
function initAudio() {
  if (SND.ctx) return true;
  var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
  try {
    SND.ctx = new AC(); var comp = SND.ctx.createDynamicsCompressor(); comp.connect(SND.ctx.destination);
    SND.sG = SND.ctx.createGain(); SND.sG.gain.value = 0.7; SND.sG.connect(comp);
    SND.mG = SND.ctx.createGain(); SND.mG.gain.value = 0; SND.mG.connect(SND.ctx.destination);
    NAMES.concat(['music-forge-loop']).forEach(function (n) {
      fetch(BASE + 'audio/' + n + '.m4a').then(function (r) { return r.arrayBuffer(); })
        .then(function (a) { return new Promise(function (ok, no) { SND.ctx.decodeAudioData(a, ok, no); }); })
        .then(function (b) { SND.buf[n] = b; if (n === 'music-forge-loop' && SND.on) startMusic(); }).catch(function () {});
    });
  } catch (e) { return false; }
  return true;
}
function startMusic() {
  if (!SND.ctx || !SND.buf['music-forge-loop'] || SND.music) return;
  var s = SND.ctx.createBufferSource(); s.buffer = SND.buf['music-forge-loop']; s.loop = true; s.loopEnd = 64;
  s.connect(SND.mG); s.start(); SND.music = s; fade(0.3, 2);
}
function fade(v, d) { if (!SND.mG) return; var t = SND.ctx.currentTime; SND.mG.gain.cancelScheduledValues(t); SND.mG.gain.setValueAtTime(SND.mG.gain.value, t); SND.mG.gain.linearRampToValueAtTime(v, t + d); }
EF.play = function (n) {
  if (!SND.on || !SND.ctx || !SND.buf[n]) return; var now = performance.now();
  if (SND.last[n] && now - SND.last[n] < 80) return; SND.last[n] = now;
  var s = SND.ctx.createBufferSource(); s.buffer = SND.buf[n]; s.connect(SND.sG); s.start();
};
EF.touch = window.matchMedia && matchMedia('(hover: none)').matches;
EF.hover = function () { if (!EF.touch) EF.play('tick'); };
/* 元素音:按原子序数映射到 A 多利亚音阶(声音即规律:越重越高) */
var DOR = [0, 2, 3, 5, 7, 9, 10];
EF.tone = function (z, when, vol) {
  if (!SND.on || !SND.ctx) return; var c = SND.ctx, t0 = c.currentTime + (when || 0);
  var step = (z - 1) % 21, oct = Math.floor(step / 7), midi = 57 + oct * 12 + DOR[step % 7];
  var f = 440 * Math.pow(2, (midi - 69) / 12), out = c.createGain(); out.connect(SND.sG);
  out.gain.setValueAtTime(0, t0); out.gain.linearRampToValueAtTime((vol || 0.25), t0 + 0.004); out.gain.exponentialRampToValueAtTime(0.0008, t0 + 1.4);
  [1, 2.76, 5.4].forEach(function (r, i) { var o = c.createOscillator(), g = c.createGain(); o.frequency.value = f * r; g.gain.value = [1, 0.4, 0.15][i]; o.connect(g); g.connect(out); o.start(t0); o.stop(t0 + 1.5); });
};
EF.toggleSound = function () {
  SND.on = !SND.on; EF.set('_sound', SND.on ? 1 : 0);
  if (SND.on) { initAudio(); if (SND.ctx.state === 'suspended') SND.ctx.resume(); startMusic(); fade(0.3, 2); setTimeout(function () { EF.play('select'); }, 300); }
  else fade(0, 0.6);
  syncBtn();
};
EF.syncBtn = function () { syncBtn(); };
function syncBtn() { var b = document.getElementById('sndBtn'); if (b) { b.setAttribute('aria-pressed', SND.on ? 'true' : 'false'); b.innerHTML = SND.on ? ICON.on : ICON.off; b.title = SND.on ? '关闭声音' : '开启声音'; } }
var ICON = {
  on: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12"/></svg>',
  off: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M17 9l5 6M22 9l-5 6"/></svg>'
};
function firstGesture() { if (SND.on && !SND.ctx) { initAudio(); } else if (SND.ctx && SND.ctx.state === 'suspended' && SND.on) SND.ctx.resume(); }
addEventListener('pointerdown', firstGesture, { once: true }); addEventListener('keydown', firstGesture, { once: true });
document.addEventListener('visibilitychange', function () {
  if (!SND.ctx) return;
  if (document.hidden) { fade(0, 0.6); setTimeout(function () { if (document.hidden) SND.ctx.suspend(); }, 700); }
  else if (SND.on) { SND.ctx.resume(); fade(0.3, 1.5); }
});

/* ---------- 顶栏、星空、提示 ---------- */
EF.topbar = function (opt) {
  var bar = document.createElement('header'); bar.className = 'ef-top';
  bar.innerHTML = '<a class="ef-back" href="' + (opt.back || '../') + '">' + (opt.backText || '← 创世计划') + '</a>' +
    '<div class="ef-brand"><b>元素工坊</b><span>Element Forge · 化学</span></div>' +
    '<button id="sndBtn" class="ef-icon" aria-pressed="false" aria-label="声音开关"></button>';
  document.body.prepend(bar); document.getElementById('sndBtn').onclick = EF.toggleSound; syncBtn();
};
EF.sky = function () {
  var c = document.createElement('canvas'); c.id = 'ef-sky'; document.body.prepend(c);
  var x = c.getContext('2d'), W, H, S = [], E = [];
  function rs() { W = c.width = innerWidth; H = c.height = innerHeight; S = []; for (var i = 0; i < W * H / 7000; i++) S.push({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.1 + 0.2, p: Math.random() * 6 }); }
  rs(); addEventListener('resize', rs);
  function f(t) {
    x.clearRect(0, 0, W, H);
    S.forEach(function (s) { x.globalAlpha = 0.35 + 0.35 * Math.sin(t / 900 + s.p); x.fillStyle = '#fff'; x.fillRect(s.x, s.y, s.r, s.r); });
    if (!EF.reduced) { if (E.length < 26 && Math.random() < 0.3) E.push({ x: Math.random() * W, y: H + 5, v: 0.3 + Math.random() * 0.6, l: 1 });
      E.forEach(function (e) { e.y -= e.v; e.x += Math.sin(e.y / 40) * 0.3; e.l -= 0.0016; x.globalAlpha = Math.max(0, e.l) * 0.7; x.fillStyle = '#ff9a3c'; x.fillRect(e.x, e.y, 1.6, 1.6); });
      E = E.filter(function (e) { return e.l > 0 && e.y > -5; }); }
    x.globalAlpha = 1; requestAnimationFrame(f);
  }
  requestAnimationFrame(f);
};
EF.toast = function (s) {
  var t = document.getElementById('ef-toast'); if (!t) { t = document.createElement('div'); t.id = 'ef-toast'; document.body.appendChild(t); }
  t.textContent = s; t.classList.add('on'); clearTimeout(t._h); t._h = setTimeout(function () { t.classList.remove('on'); }, 2600);
};
EF.esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

/* ---------- 任务框架:先猜 → 动手 → 揭晓;三星 = 完成 + 首猜即中 + 提示 ≤1 次 ---------- */
EF.mission = function (id, LEVELS, NOTES) {
  var M = EF.MISSIONS[id], G = EF.GUIDES[M.g], P = EF.prog(id), cur = 0, st;
  EF.sky(); EF.topbar({ back: '../', backText: '← 工坊' });
  /* v0.3:B1 沉浸舞台 —— 四角括弧 + 背后 3D 场景(低档不加载) */
  document.body.classList.add('mission', 'mission-' + id); EF.missionId = id; EF.level = 0;
  document.body.insertAdjacentHTML('afterbegin', '<div id="bg3d" aria-hidden="true"></div><i class="cn tl"></i><i class="cn tr"></i><i class="cn bl"></i><i class="cn br"></i>');
  if (EF.glTier !== 'low') { var m3 = document.createElement('script'); m3.type = 'module'; m3.src = BASE + 'ef-mission3d.js?v=3'; document.body.appendChild(m3); }
  var root = document.getElementById('app');
  root.innerHTML = '<div class="m-head"><h1>' + EF.esc(M.q) + '</h1><div class="m-dots" id="dots"></div></div>' +
    '<div class="m-body"><section class="m-stage" id="stage"></section>' +
    '<aside class="m-guide"><div class="g-who"><canvas id="gcv" width="120" height="120"></canvas><div><b>' + G.n + ' ' + G.en + '</b><small>' + G.from + '</small></div></div>' +
    '<div class="g-say" id="say"></div><div class="g-opts" id="opts"></div>' +
    '<div class="g-act"><button class="ef-btn ghost" id="hintBtn">给我一点提示</button></div><div class="g-hint" id="hint"></div></aside></div>' +
    '<div class="m-over" id="over" hidden></div>';
  var gcv = document.getElementById('gcv'), talk = 0;
  (function loop(t) { talk *= 0.92; EF.drawGuide(gcv, M.g, t, talk); requestAnimationFrame(loop); })(0);
  function say(s) { document.getElementById('say').innerHTML = s; talk = 1; }
  function dots() {
    document.getElementById('dots').innerHTML = LEVELS.map(function (L, i) {
      var s = P.stars[i] || 0, ok = P.done.indexOf(i) > -1, open = i === 0 || P.done.indexOf(i - 1) > -1 || ok;
      return '<button class="dot' + (i === cur ? ' cur' : '') + (ok ? ' ok' : '') + '" ' + (open ? '' : 'disabled') + ' data-i="' + i + '" title="第 ' + (i + 1) + ' 关 · ' + EF.esc(L.title) + '">' +
        (i + 1) + '<i>' + (ok ? '★'.repeat(s) + '☆'.repeat(3 - s) : '') + '</i></button>';
    }).join('');
    Array.prototype.forEach.call(document.querySelectorAll('#dots .dot'), function (b) { b.onclick = function () { EF.play('select'); start(+b.dataset.i); }; });
  }
  function start(i) {
    cur = i; EF.level = i; if (EF.onLevel) EF.onLevel(i); var L = LEVELS[i]; st = { guessed: null, hints: 0, done: false };
    dots(); var stage = document.getElementById('stage'); stage.innerHTML = ''; stage.className = 'm-stage locked';
    document.getElementById('hint').innerHTML = ''; document.getElementById('over').hidden = true;
    say('<em>第 ' + (i + 1) + ' 关 · ' + EF.esc(L.title) + '</em><br>' + L.ask.q);
    var o = document.getElementById('opts');
    o.innerHTML = L.ask.opts.map(function (s, k) { return '<button class="ef-btn opt" data-k="' + k + '">' + s + '</button>'; }).join('');
    Array.prototype.forEach.call(o.children, function (b) {
      b.onclick = function () {
        var k = +b.dataset.k; st.guessed = k === L.ask.ok; EF.play(st.guessed ? 'select' : 'tick');
        Array.prototype.forEach.call(o.children, function (x) { x.disabled = true; }); b.classList.add('picked');
        say(st.guessed ? (L.ask.yes || '有道理!我们动手验证一下。') : (L.ask.no || '先别急着定论,做一做就知道了。') + '<br><span class="g-task">' + L.task + '</span>');
        if (st.guessed) document.getElementById('say').innerHTML += '<br><span class="g-task">' + L.task + '</span>';
        stage.className = 'm-stage'; stage.innerHTML = ''; L.setup(stage, api);
      };
    });
    document.getElementById('hintBtn').onclick = function () {
      if (st.hints >= L.hints.length) return; EF.play('tick');
      document.getElementById('hint').innerHTML += '<p>提示 ' + (st.hints + 1) + ':' + L.hints[st.hints] + '</p>'; st.hints++;
    };
    var ph = document.createElement('div'); ph.className = 'm-wait'; ph.innerHTML = '<div>先猜一猜,再动手</div>'; stage.appendChild(ph);
  }
  var api = {
    say: say,
    complete: function () {
      if (st.done) return; st.done = true; var L = LEVELS[cur];
      var s = 1 + (st.guessed ? 1 : 0) + (st.hints <= 1 ? 1 : 0);
      if (P.done.indexOf(cur) < 0) P.done.push(cur); P.stars[cur] = Math.max(P.stars[cur] || 0, s); EF.set(id, P);
      EF.play('unlock'); dots(); if (EF.onComplete) EF.onComplete(cur);
      var last = cur === LEVELS.length - 1, ov = document.getElementById('over');
      ov.innerHTML = '<div class="m-card"><div class="m-stars">' + '★'.repeat(s) + '<span>' + '☆'.repeat(3 - s) + '</span></div>' +
        '<p class="m-explain">' + L.explain + '</p><div class="m-row">' +
        (last ? '<button class="ef-btn" id="notesBtn">知识笔记</button><a class="ef-btn ghost" href="../">回到工坊</a>' :
          '<button class="ef-btn ghost" id="stayBtn">再看看</button><button class="ef-btn" id="nextBtn">下一关 →</button>') + '</div></div>';
      setTimeout(function () { ov.hidden = false; }, 900);
      var n = document.getElementById('nextBtn'); if (n) n.onclick = function () { EF.play('whoosh'); start(cur + 1); };
      var y = document.getElementById('stayBtn'); if (y) y.onclick = function () { ov.hidden = true; };
      var nb = document.getElementById('notesBtn'); if (nb) nb.onclick = function () { notes(); };
    }
  };
  function notes() {
    var ov = document.getElementById('over'), txt = NOTES.title + '\n' + NOTES.items.map(function (s) { return '· ' + s; }).join('\n');
    ov.innerHTML = '<div class="m-card notes"><h2>知识笔记 · ' + EF.esc(M.q) + '</h2><ul>' + NOTES.items.map(function (s) { return '<li>' + s + '</li>'; }).join('') + '</ul>' +
      (NOTES.bridge ? '<p class="m-bridge">星桥:' + NOTES.bridge + '</p>' : '') +
      '<div class="m-row"><button class="ef-btn ghost" id="copyBtn">复制笔记</button><a class="ef-btn" href="../">回到工坊</a></div></div>';
    ov.hidden = false;
    document.getElementById('copyBtn').onclick = function () {
      try { navigator.clipboard.writeText(txt.replace(/<[^>]+>/g, '')).then(function () { EF.toast('已复制'); }); } catch (e) { EF.toast('复制失败,可手动选择文字'); }
    };
  }
  var firstOpen = 0; for (var i = 0; i < LEVELS.length; i++) { if (P.done.indexOf(i) < 0) { firstOpen = i; break; } firstOpen = 0; }
  start(firstOpen);
};

/* ---------- 画布工具 ---------- */
EF.canvas = function (parent, h) {
  var c = document.createElement('canvas'); c.className = 'ef-cv'; parent.appendChild(c);
  var dpr = Math.min(2, window.devicePixelRatio || 1), o = { c: c, x: c.getContext('2d'), W: 0, H: 0 };
  function rs() { var w = c.clientWidth || parent.clientWidth || 600, hh = h || c.clientHeight || 360; c.width = w * dpr; c.height = hh * dpr; c.style.height = hh + 'px'; o.W = w; o.H = hh; o.x.setTransform(dpr, 0, 0, dpr, 0, 0); if (o.onresize) o.onresize(); }
  rs(); addEventListener('resize', rs); o.rs = rs;
  o.pt = function (e) { var r = c.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  return o;
};
EF.ball = function (x, px, py, r, col, label) {
  var g = x.createRadialGradient(px - r * 0.35, py - r * 0.35, r * 0.1, px, py, r);
  g.addColorStop(0, '#fff'); g.addColorStop(0.35, col); g.addColorStop(1, shade(col));
  x.fillStyle = g; x.beginPath(); x.arc(px, py, r, 0, 7); x.fill();
  if (label) { x.fillStyle = '#1b1208'; x.font = '700 ' + Math.max(9, r * 0.8) + 'px system-ui,sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(label, px, py + 0.5); }
};
function shade(h) { var n = parseInt(h.slice(1), 16); var r = (n >> 16) * 0.45, g = ((n >> 8) & 255) * 0.45, b = (n & 255) * 0.45; return 'rgb(' + (r | 0) + ',' + (g | 0) + ',' + (b | 0) + ')'; }
EF.shade = shade;
})();
