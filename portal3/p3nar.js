/* 创世计划 门户 3.0 · 下滚叙事「镜头穿行」（11-16 · 第四步，改写第三步）
 * 往下滚：第一性原理之树的镜头沿树爬升，七个世界的全宽大玻璃卡依次从远处迎面飘来、停留、再从镜头旁掠过（深度视差 + 轻微倾斜 + 世界色光边），
 * 同时联动 p3fp.spot 高亮当前层与树干上的水晶航标；尾段第八颗星长成半透明粒子晶体，在超大「从玩到造」标题后旋转，配三张编号大卡（规则 / 实验 / 世界），最后落到大按钮，再往下滑进入门户。
 * 思路致谢：MotionSites「Anchor AI」公开描述（镜头穿行 + 玻璃卡 + 尾段旋转粒子结构）、Aceternity「Sticky Scroll Reveal」、ThreeUI「Workshop Codex」航标（均只借思路，代码自写，零依赖、零外部请求）。
 * 驱动：IntersectionObserver 定当前段；scroll → rAF 算连续进度驱动镜头与卡片 3D 变换（#p3ss 自带 perspective）。
 * 减少动态：无镜头动画、卡片静态平铺；low 档：镜头跳切、卡片只淡入不做 3D。 */

const ZH = {
  root: ['00 · 第一性原理', '从最小的真出发', '不背结论，只问为什么。把一个问题拆到不能再拆，剩下的就是第一性原理——整棵树都从这里长出来。'],
  L: {
    '01': ['数学是根', '数与形，是一切规律共同的语言。', '用问题点亮知识星。'],
    '02': ['数学长出物理', '定律从数学里生长出来，宇宙按它们运转。', '改写物理常数，看宇宙怎么变。'],
    '03': ['物理生出化学', '粒子结合成元素，元素组成万物。', '用元素锻造物质，配方即反应。'],
    '04': ['化学写下生命', '分子学会复制自己，生命开始书写源码。', '读、改、调试生命的「源码」。'],
    '06': ['生命醒来，成为心智', '大脑开始观察自己怎样思考。', '看见自己的思维，做出更清醒的选择。'],
    '05': ['心智造出智能', '人第一次教会机器学习。', '亲手训练、测试、约束 AI。'],
    '07': ['智能望向星空', '树冠伸进宇宙，回答最古老的问题：我们在哪里。', '用真实实时数据看见此刻的天空。'],
  },
  star: ['08 · 第八颗星', '第八颗星，由你来造', '七个世界一层层玩懂之后，轮到你：改一条规则，搭一个实验，长出一个世界。'],
  fin: ['从玩到造 · FROM PLAY TO BUILD', '玩懂一个世界，', '再亲手造一个。', '从根部的数学开始，一层层往上玩；准备好了，第八颗星就交给你。'],
  play: '开始玩', build: '造', soon: '即将开放', enter: '进入', portal: '进入门户 ↓', more: '继续下滑，进入门户', step: '层',
};
const EN = {
  root: ['00 · First principles', 'Start from the smallest truth', 'Don\u2019t memorise answers \u2014 keep asking why. Break a question down until it can\u2019t be broken any further: what\u2019s left is a first principle, and the whole tree grows from there.'],
  L: {
    '01': ['Math is the root', 'Number and shape are the shared language of every law.', 'Light up stars of knowledge by asking questions.'],
    '02': ['Math grows into physics', 'Laws grow out of mathematics, and the universe runs on them.', 'Rewrite the constants of physics and watch the universe change.'],
    '03': ['Physics gives rise to chemistry', 'Particles bond into elements, and elements make up everything.', 'Forge matter from elements \u2014 every recipe is a reaction.'],
    '04': ['Chemistry writes life', 'Molecules learn to copy themselves, and life starts writing its source code.', 'Read, edit and debug the source code of life.'],
    '06': ['Life wakes up as mind', 'The brain begins to watch how it thinks.', 'See your own thinking and make clearer choices.'],
    '05': ['Mind builds intelligence', 'For the first time, we teach machines to learn.', 'Train, test and constrain an AI with your own hands.'],
    '07': ['Intelligence looks to the stars', 'The crown reaches into space to answer the oldest question: where are we?', 'See tonight\u2019s sky with real, live data.'],
  },
  star: ['08 · The eighth star', 'The eighth star is yours to build', 'Once you\u2019ve mastered the seven worlds, layer by layer, it\u2019s your turn: rewrite a rule, set up an experiment, grow a world.'],
  fin: ['From play to build', 'Master a world,', 'then build one.', 'Start with math at the root and play your way up. When you\u2019re ready, the eighth star is yours.'],
  play: 'Start playing', build: 'Build', soon: 'soon', enter: 'Enter', portal: 'Enter portal \u2193', more: 'Keep scrolling to enter the portal', step: 'layer',
};
const FBL = [['01', '数学', 'Math', '星图', 'Math Atlas', '#7cc8ff', 'math-atlas/'], ['02', '物理', 'Physics', '宙律', 'Nomoverse', '#a78bfa', 'nomoverse/'], ['03', '化学', 'Chemistry', '元素工坊', 'Element Forge', '#ff9a3c', 'element-forge/'],
  ['04', '生命', 'Life', '生命源码', 'Life Source', '#34d399', 'life-source/'], ['06', '认知', 'Mind', '觉弈', 'Ludoterra', '#f5c26b', 'ludoterra/'], ['05', '智能', 'Intelligence', '奇点前夜', 'Pre-Singularity', '#22d3ee', 'pre-singularity/'], ['07', '天文', 'Cosmos', '天枢', 'Starhelm', '#dfe6f3', 'starhelm/x/']];

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const sm = x => x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x);
const cl = (x, a, b) => Math.max(a, Math.min(b, x));

/* o: { host, en, rm, tier():string, tree():p3fp|null, onEnter(), onLeave(), openPanel(k), enterPortal(), doors:[{t,d,no,c,svg}], soon } */
export function mount(o) {
  const h = o.host, T = o.en ? EN : ZH, W = {};
  (window.GN_WORLDS || []).forEach(w => { W[w.id] = w; });
  const LV = FBL.map(f => { const w = W[f[0]]; return { id: f[0], f: o.en ? f[2] : f[1], name: w ? (o.en ? (w.en || w.name) : w.name) : (o.en ? f[4] : f[3]), color: (w && w.color) || f[5], href: (w && w.href) || f[6] }; });

  /* —— DOM —— */
  const ss = document.createElement('div'); ss.id = 'p3ss'; ss.setAttribute('data-p3pass', ''); ss.setAttribute('tabindex', '-1');
  ss.setAttribute('aria-label', o.en ? 'The story of the tree' : '第一性原理之树 · 叙事');
  let html = '<div class="ss0" data-p3pass aria-hidden="true"></div>';
  const card = (cls, c, no, eb, title, p, extra) => '<section class="sst ' + cls + '" data-p3pass style="--c:' + c + '"><article class="cd"><div class="ch"><span class="no">' + no + '</span><p class="eb">' + eb + '</p></div><div class="cb"><h2>' + title + '</h2></div><div class="cr"><p>' + p + '</p>' + (extra || '') + '</div></article></section>';
  html += card('s-root', '#e9c779', '00', esc(T.root[0].replace(/^00 · /, '')), esc(T.root[1]), esc(T.root[2]));
  LV.forEach((l, i) => {
    const t = T.L[l.id];
    html += card('s-lv', l.color, '0' + (i + 1), esc(l.f) + ' · ' + esc(l.name) + ' <i>/ 07</i>', esc(t[0]), esc(t[1]) + (o.en ? ' ' : '') + esc(t[2]),
      '<a class="go" href="' + esc(l.href) + '">' + esc(T.enter + (o.en ? ' ' : '') + l.name) + ' <span aria-hidden="true">→</span></a>');
  });
  html += card('s-star', '#fff1c9', '08', esc(T.star[0].replace(/^08 · /, '')), esc(T.star[1]), esc(T.star[2]));
  const D = o.doors || [];
  html += '<section class="ssf" data-p3pass><div class="fh" data-p3pass><p class="eb">' + esc(T.fin[0]) + '</p><h2>' + (o.en ? 'From play<br>to <em>build</em>' : '从玩到<em>造</em>') + '</h2><p class="sb">' + esc(T.fin[3]) + '</p></div>' +
    '<div class="f3">' + D.map(d => '<article class="fc" style="--c:' + esc(d.c) + '"><span class="no">' + esc(d.no) + '</span><svg viewBox="0 0 80 96" aria-hidden="true">' + d.svg + '</svg><h3>' + esc(d.t) + '</h3><p>' + esc(d.d) + '</p><small>' + esc(o.soon || T.soon) + '</small></article>').join('') + '</div>' +
    '<div class="ct"><button type="button" class="pri" data-k="0">' + esc(T.play) + ' <span aria-hidden="true">›</span></button><button type="button" class="sec" data-k="1"><span class="shy">' + esc(T.build) + '</span> <small>' + esc(T.soon) + '</small></button></div></section>';
  html += '<div class="sse" data-p3pass><button type="button" class="dn">' + esc(T.portal) + '</button><small>' + esc(T.more) + '</small></div>';
  ss.innerHTML = html;
  const cv = h.querySelector('#p3cv'); h.insertBefore(ss, cv ? cv.nextSibling : h.firstChild);
  const rl = document.createElement('div'); rl.className = 'p3rl'; rl.setAttribute('aria-hidden', 'true');
  rl.innerHTML = '<span></span>' + '<i></i>'.repeat(9); h.appendChild(rl);
  const steps = Array.prototype.slice.call(ss.querySelectorAll('.sst')), cards = steps.map(s => s.querySelector('.cd')), fin = ss.querySelector('.ssf'), tail = ss.querySelector('.sse'), ticks = rl.querySelectorAll('i');
  if (o.rm) ss.classList.add('rm');
  const SF = [-1, 0, 1, 2, 3, 4, 5, 6, 7];   // 每段对应的树位置：根 -1，七层 0..6，第八颗星 7
  if (window.P3FX) { const b = fin.querySelectorAll('.ct button'); P3FX.buttons([{ el: b[0], c: '#ffe29a', k: .2 }, { el: b[1], c: '#ff9ad5', k: .16 }]); }

  /* —— 当前段 —— */
  let act = -2, on = false, dead = false, leaving = false;
  function setAct(i) {
    if (i === act) return; act = i; if (o.tier() === 'low') onScroll();
    steps.forEach((s, k) => s.classList.toggle('on', k === i)); fin.classList.toggle('on', i === 9); rl.classList.toggle('fin', i === 9);
    for (let k = 0; k < 9; k++) ticks[k].className = k === i ? 'on' : (k < i ? 'pa' : '');
    rl.firstChild.textContent = i >= 0 && i < 9 ? '0' + i + ' / 08' : '';
    const m = o.tree(); if (!m) return;
    if (i >= 1 && i <= 7) m.spot(i - 1); else if (on) m.spot(-1);
    if (i >= 1 && i <= 7) rl.style.setProperty('--c', LV[i - 1].color); else rl.style.removeProperty('--c');
  }
  let io = null;
  if ('IntersectionObserver' in window) {
    const vis = new Map();
    io = new IntersectionObserver(es => {
      es.forEach(e => vis.set(e.target, e.isIntersecting));
      let i = -1; steps.forEach((s, k) => { if (vis.get(s)) i = k; }); if (vis.get(fin)) i = 9;
      if (i >= 0) setAct(i); else if (on && act !== -1 && !vis.size) setAct(-1);
    }, { root: ss, rootMargin: '-46% 0px -46% 0px', threshold: 0 });
    steps.concat([fin]).forEach(s => io.observe(s));
  }

  /* —— 连续进度：scroll → rAF —— */
  let raf = 0, rmOn = false, mode = '';
  function onScroll() { if (!raf && !dead) raf = requestAnimationFrame(tick); }
  function narShift() { const w = innerWidth, hh = innerHeight; if (hh <= 420) return [w / hh > 1.5 ? .24 : 0, 0]; if (w > 800) return [0, -.2]; return [0, -.25]; }
  function setMode() {
    const m = o.rm ? 'flat' : o.tier() === 'low' ? 'fade' : '3d';
    if (m === mode) return; mode = m; ss.classList.toggle('m3d', m === '3d'); ss.classList.toggle('mfade', m === 'fade');
    if (m !== '3d') cards.forEach(c => { c.style.transform = ''; c.style.opacity = ''; c.style.visibility = ''; });
  }
  /* 卡片穿行：d = 段中心相对视口中心（单位：屏高）；d>0 还在远处迎面而来，d<0 正从镜头旁掠过 */
  function fly(vh, st) {
    const vc = st + vh / 2, wide = innerWidth > 800;
    steps.forEach((s, k) => {
      const c = cards[k], d = (s.offsetTop + s.offsetHeight / 2 - vc) / vh, side = k % 2 ? 1 : -1;
      if (d > 1.25 || d < -.9) { if (c.style.visibility !== 'hidden') c.style.visibility = 'hidden'; return; }
      let z, y, rx, ry, op;
      if (d >= 0) { const e = sm(d / 1.1); z = -1500 * e; y = -d * vh * .55; rx = 9 * e; ry = side * 5 * e; op = 1 - sm((d - .08) / .9); }
      else { const e = -d; z = 1100 * e * e + 380 * e; y = -d * vh * .18; rx = -4 * e; ry = -side * 14 * e; op = 1 - sm((e - .06) / .6); }
      c.style.visibility = op < .01 ? 'hidden' : '';
      c.style.opacity = op.toFixed(3);
      c.style.transform = 'translate3d(' + (wide ? side * d * 40 : 0).toFixed(1) + 'px,' + y.toFixed(1) + 'px,' + z.toFixed(1) + 'px) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg)';
    });
  }
  function tick() {
    raf = 0; if (dead) return; setMode();
    const vh = ss.clientHeight || 1, st = ss.scrollTop, vc = st + vh / 2, max = ss.scrollHeight - vh;
    const p0 = st / vh;
    const was = on; on = p0 > .14;
    if (on !== was) { document.documentElement.classList.toggle('p3nv', on); if (on) o.onEnter(); else { setAct(-1); o.onLeave(); } }
    if (!io) { let i = -1; steps.forEach((s, k) => { if (s.offsetTop <= vc) i = k; }); if (fin.offsetTop <= vc) i = 9; setAct(on ? i : -1); }
    if (mode === '3d') fly(vh, st);
    const fk = cl((st + vh - fin.offsetTop) / vh, 0, 1);   // 末段：晶体长成
    const m = o.tree();
    if (m && m.climb && o.rm) {   // 减少动态：无镜头动画；进入叙事时静态切到第八颗星（晶体）取景
      if (on !== rmOn) { rmOn = on; const sh = narShift(); m.climb(on ? 8 : -1, on ? 1 : 0, sh[0], sh[1], true); if (m.finale) m.finale(on ? 1 : 0); }
    } else if (m && m.climb) {
      const A = [[vh / 2, -1, 0]];
      steps.forEach((s, k) => A.push([s.offsetTop + s.offsetHeight / 2, SF[k], 1]));
      A.push([fin.offsetTop + vh / 2, 8, 1]);
      let f = -1, k = 0;
      if (o.tier() === 'low') { if (act >= 0 && act <= 8 && on) { f = SF[act]; k = 1; } else if (act === 9) { f = 8; k = 1; } }
      else if (vc >= A[A.length - 1][0]) { f = 8; k = 1; }
      else for (let j = 0; j < A.length - 1; j++) if (vc < A[j + 1][0]) { const t = sm((vc - A[j][0]) / Math.max(1, A[j + 1][0] - A[j][0])); f = A[j][1] + (A[j + 1][1] - A[j][1]) * t; k = A[j][2] + (A[j + 1][2] - A[j][2]) * t; break; }
      const sh = narShift(); m.climb(f, k, sh[0], sh[1], o.tier() === 'low');
      if (m.finale) m.finale(o.tier() === 'low' ? (act === 9 ? 1 : 0) : fk);
    }
    /* 末尾：往下滑过「进入门户」→ 首屏渐隐并进入门户 */
    const tp = tail.offsetHeight ? Math.max(0, Math.min(1, (st + vh - tail.offsetTop) / tail.offsetHeight)) : 0;
    h.style.setProperty('--p3o', String(1 - .55 * sm((tp - .45) / .55)));   // 尾段后半才渐隐，避免大按钮背后透出门户
    if (!leaving && max > 0 && st >= max - 2 && tp > .97) { leaving = true; setTimeout(() => { if (!dead && ss.scrollTop >= ss.scrollHeight - ss.clientHeight - 4) o.enterPortal(); else leaving = false; }, o.rm ? 0 : 260); }
  }
  ss.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);

  /* —— 首屏其他元素上的滚轮/按键也推动叙事 —— */
  function onWheel(e) {
    if (dead || e.ctrlKey || ss.contains(e.target)) return;
    const t = e.target; if (t.closest && t.closest('.p3pn, .qm, #p3mvDlg, .wm-st')) return;
    e.preventDefault(); ss.scrollTop += e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? ss.clientHeight : 1);
  }
  h.addEventListener('wheel', onWheel, { passive: false });
  function onKey(e) {
    if (dead || h.style.display === 'none' || e.altKey || e.ctrlKey || e.metaKey) return;
    if (document.documentElement.classList.contains('p3dr')) return;
    const a = document.activeElement; if (a && a !== document.body && a !== ss && a !== document.documentElement) return;
    if (document.querySelector('#p3mvDlg.on')) return;
    const vh = ss.clientHeight, beh = o.rm ? 'auto' : 'smooth';
    let d = 0; if (e.key === 'PageDown' || (e.key === ' ' && !e.shiftKey)) d = vh * .85; else if (e.key === 'PageUp' || (e.key === ' ' && e.shiftKey)) d = -vh * .85; else if (e.key === 'ArrowDown') d = 60; else if (e.key === 'ArrowUp') d = -60;
    else if (e.key === 'Home') { e.preventDefault(); ss.scrollTo({ top: 0, behavior: beh }); return; } else if (e.key === 'End') { e.preventDefault(); ss.scrollTo({ top: fin.offsetTop, behavior: beh }); return; }
    if (!d) return; e.preventDefault(); ss.scrollBy({ top: d, behavior: beh });
  }
  document.addEventListener('keydown', onKey);

  /* —— 末屏按钮：回到首屏再整屏展开「玩 / 造」；底部按钮直接进入门户 —— */
  function toTop(cb) {
    const smooth = !o.rm && o.tier() !== 'low';
    ss.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'auto' });
    const t0 = performance.now();
    (function w() { if (dead) return; if (ss.scrollTop < 4 || performance.now() - t0 > 1600) { if (ss.scrollTop >= 4) ss.scrollTop = 0; onScroll(); setTimeout(cb, 30); } else requestAnimationFrame(w); })();
  }
  fin.addEventListener('click', e => { const b = e.target.closest && e.target.closest('button[data-k]'); if (!b) return; const k = +b.getAttribute('data-k'); toTop(() => o.openPanel(k)); });
  tail.querySelector('.dn').addEventListener('click', () => o.enterPortal());

  onScroll();
  return {
    el: ss,
    top: () => ss.scrollTop,
    sync() { const a = act; act = -2; rmOn = false; setAct(a); onScroll(); },
    dispose() { dead = true; cancelAnimationFrame(raf); if (io) io.disconnect(); ss.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll);
      h.removeEventListener('wheel', onWheel); document.removeEventListener('keydown', onKey); document.documentElement.classList.remove('p3nv'); },
  };
}
