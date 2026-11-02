/* 天枢 C2.4 · 目标目录:导航目标栏分页(太阳系 / 恒星 / 星座 / 深空 / 探测器)+ 搜索
 * 太阳系与探测器沿用驾驶舱航点(单击锁定;C2.7a 起双击不再直接飞往,出发走锚点卡);恒星、星座、深空天体单击后机头转向并弹资料卡。 */
(function () {
  'use strict';
  var X, T, root, lst, bar, box, inp, tab = 'sol', built = false, aim = null;
  var TABS = [['sol', '太阳系'], ['star', '恒星'], ['con', '星座'], ['dso', '深空'], ['craft', '探测器']];
  function el(t, c, h) { var e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; }
  function css() {
    if (document.getElementById('xg-css')) return; var st = el('style'); st.id = 'xg-css';
    st.textContent = '#xg-bar{display:flex;gap:2px;margin:0 4px 6px;flex-wrap:nowrap}#xg-bar button{flex:1;min-width:0;padding:3px 0;border:1px solid rgba(127,214,255,.18);background:rgba(127,214,255,.05);color:#aebfdc;font:inherit;font-size:11px;border-radius:5px;cursor:pointer;white-space:nowrap}#xg-bar button.on{border-color:rgba(240,201,122,.6);color:#f6d999;background:rgba(240,201,122,.1)}' +
      '#xg-q{display:block;width:calc(100% - 8px);box-sizing:border-box;margin:0 4px 6px;padding:4px 8px;border-radius:6px;border:1px solid rgba(127,214,255,.18);background:rgba(4,10,20,.6);color:#dfe7f5;font:inherit;font-size:11.5px;outline:none}#xg-q:focus{border-color:rgba(240,201,122,.5)}' +
      '@media (max-width:900px),(max-height:560px){#shxc.xg-cat .lst{display:block!important;left:10px;right:10px;top:64px;width:auto;max-height:52vh;z-index:6}#xg-cl{display:block}}#xg-cl{display:none;position:absolute;right:8px;top:6px;background:none;border:0;color:#8fa3c2;font-size:18px;cursor:pointer}' +
      '#xg-far{position:absolute;left:50%;top:22%;transform:translateX(-50%);z-index:8;width:min(440px,calc(100vw - 24px));padding:12px 14px;border-radius:12px;background:rgba(8,12,22,.92);border:1px solid rgba(240,201,122,.45);color:#dfe8f6;font:13.5px/1.65 "Noto Sans SC",system-ui,sans-serif}#xg-far b{color:#f0c97a}#xg-far p{margin:6px 0 10px}#xg-far button{font:inherit;font-size:12.5px;cursor:pointer;margin:0 6px 6px 0;padding:3px 10px;border-radius:8px;border:1px solid rgba(240,201,122,.6);background:rgba(240,201,122,.14);color:#ffe2a0}' +
      '#xg-box .it .ds{white-space:nowrap}#xg-box .em{color:#8fa3c2;font-size:11px;padding:6px 8px}';
    document.head.appendChild(st);
  }
  function cat(b) { return b.craft || (b.ghost && b.type === '探测器') ? 'craft' : b.star ? 'star' : 'sol'; }
  function build() {
    root = X._.root(); lst = root && root.querySelector('#xc-lst'); if (!lst || lst.querySelector('#xg-bar')) return; css();
    var cap = lst.querySelector('.cap');
    bar = el('div'); bar.id = 'xg-bar'; bar.innerHTML = TABS.map(function (t) { return '<button type="button" data-t="' + t[0] + '">' + t[1] + '</button>'; }).join('');
    inp = el('input'); inp.id = 'xg-q'; inp.type = 'search'; inp.placeholder = '搜索:中文 / 拉丁名 / M31 / NGC 7000'; inp.setAttribute('autocomplete', 'off'); inp.addEventListener('blur', function () { setTimeout(function () { if (document.activeElement && document.activeElement.tagName === 'INPUT') return; window.scrollTo(0, 0); }, 60); });
    box = el('div'); box.id = 'xg-box';
    cap.after(bar); bar.after(inp); lst.appendChild(box);
    bar.addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) set(b.getAttribute('data-t')); });
    inp.addEventListener('input', render);
    inp.addEventListener('keydown', function (e) { e.stopPropagation(); if (e.key === 'Escape') { inp.value = ''; render(); inp.blur(); } });
    inp.addEventListener('keyup', function (e) { e.stopPropagation(); });
    var cl = el('button', '', '×'); cl.id = 'xg-cl'; cl.type = 'button'; cl.setAttribute('aria-label', '关闭目录'); cl.onclick = function () { root.classList.remove('xg-cat'); }; lst.appendChild(cl);
    var mob = root.querySelector('.mob'); if (mob && !mob.querySelector('[data-k=cat]')) { var mb = el('button', 'btn', '目录'); mb.type = 'button'; mb.setAttribute('data-k', 'cat'); mb.onclick = function (e) { e.stopPropagation(); root.classList.toggle('xg-cat'); }; mob.insertBefore(mb, mob.firstChild.nextSibling); }
    built = true; set('sol');
  }
  function set(t) { tab = t; bar.querySelectorAll('button').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-t') === t); }); render(); }
  function hit(q, a) { if (!q) return true; for (var i = 0; i < a.length; i++) if (a[i] && String(a[i]).toLowerCase().replace(/\s+/g, '').indexOf(q) >= 0) return true; return false; }
  function render() {
    var q = (inp.value || '').trim().toLowerCase().replace(/\s+/g, ''), B = X._.B;
    // 驾驶舱自带条目:按分页 / 搜索显隐
    B.forEach(function (b) { if (!b.li) return; var show = !b.off && (q ? hit(q, [b.zh, b.en, b.id]) : cat(b) === tab); b.li.style.display = show ? '' : 'none'; });
    lst.querySelectorAll('.grp').forEach(function (g) { g.style.display = !q && tab === 'sol' ? '' : 'none'; });
    box.innerHTML = ''; var rows = [], lim = q ? 40 : 400;
    if (tab === 'star' || q) {
      var N = window.SHX_STARNAMES || {}, own = {};
      B.forEach(function (b) { if (b.star) own[b.zh] = 1; });   // 驾驶舱已有航点的恒星不重复列
      Object.keys(N).map(Number).filter(function (k) { return k > 0 && !own[N[k][0]] && hit(q, N[k]); })
        .map(function (k) { return [k, window.SHXK ? SHXK.mag0(k) : 0]; }).sort(function (a, b) { return a[1] - b[1]; })
        .forEach(function (r) { rows.push(['star', r[0], N[r[0]][0], (r[1] < 0 ? '−' + (-r[1]).toFixed(1) : r[1].toFixed(1)) + ' 等', '#fff4d8']); });
    }
    if (tab === 'con' || q) (window.SHX_CONSTART || []).filter(function (c) { return hit(q, [c[0], c[1], c[2]]); }).sort(function (a, b) { return a[2].localeCompare(b[2], 'zh'); })
      .forEach(function (c) { rows.push(['con', c[0], c[2], c[1], '#c9b78f']); });
    if (tab === 'dso' || q) {
      var D = window.SHXK && SHXK.dsoList ? SHXK.dsoList() : null, ty = (window.SH_DSO || {}).ty || {};
      if (window.SHXEO) SHXEO.list().forEach(function (k) { var e = SHXEO.get(k); if (hit(q, [k, e.zh, e.en])) rows.push(['exo', k, e.zh, '✦ 可飞抵 · ' + (e.lab || (e.k === 'bh' ? '黑洞' : e.k === 'psr' ? '脉冲星' : '中子星')), '#ff9fb2']); });   // C2.8a 特殊天体置顶
      if (window.SHXCO && SHXCO.extra) SHXCO.extra().forEach(function (k) { var e = SHXCO.get(k); if (e && hit(q, [k, e.zh, e.en])) rows.push(['exo', k, e.zh, '✦ 可飞抵 · ' + (k === 'SMACS 0723' ? '深场 · 引力透镜' : '星系团'), '#ff9fd0']); });   // C2.9b 星系团 / 深场(不在 OpenNGC 表里)
      var nf = rows.length; if (D) D.forEach(function (d, i) { var o = d.o; if (!q && !o[1] && o[0].charAt(0) !== 'M') return; if (!hit(q, [o[0], o[1], o[2], o[11]])) return; var fly = window.SHXDV && SHXDV.has(o[0]), rw = ['dso', i, o[1] && o[1].indexOf(o[0]) !== 0 ? o[0] + ' ' + o[1] : (o[1] || o[0]), (fly ? '✦ 可飞抵 · ' : '') + (ty[o[3]] || ''), fly ? '#f0c97a' : '#9fc3ff']; if (fly) rows.splice(nf++, 0, rw); else rows.push(rw); });
    }
    rows.slice(0, lim).forEach(function (r) {
      var it = el('div', 'it', '<span class="dot" style="background:' + r[4] + '"></span><span class="nm">' + r[2] + '</span><span class="ds">' + r[3] + '</span>');
      it.addEventListener('click', function () { box.querySelectorAll('.it.on').forEach(function (e) { e.classList.remove('on'); }); it.classList.add('on'); go(r[0], r[1]); if (r[0] === 'con') members(it, r[1]); else if (innerWidth <= 900) root.classList.remove('xg-cat'); });
      box.appendChild(it);
    });
    if (!rows.length && (tab !== 'sol' && tab !== 'craft' || q) && !B.some(function (b) { return b.li && b.li.style.display !== 'none'; })) box.appendChild(el('div', 'em', '没有匹配的目标'));
  }
  // C2.14c 星座主要成员星(连线顶点里已匹配到 HYG 的星),按亮度排序,单击 = 恒星资料卡(可锁定、出发)。BUG-01:星座里的星可直接点选
  function members(it, id) {
    box.querySelectorAll('.it.mb').forEach(function (e) { e.remove(); });
    var L = (window.SHX_CONSTEL || []).filter(function (c) { return c[0] === id; })[0]; if (!L || !window.SHXK) return; var seen = {}, ks = [], N = window.SHX_STARNAMES || {};
    L[1].forEach(function (ln) { ln.forEach(function (p) { if (typeof p === 'number' && !seen[p]) { seen[p] = 1; ks.push(p); } }); });
    // C2.14d 再补上该星座(IAU 边界,HYG con 字段)里星表收录的主要亮星(视星等 ≤ 4.5)
    var BY = window.SHX_STARBAYER || {}; Object.keys(BY).forEach(function (k) { var b = BY[k]; k = +k; if (b[3] === id && b[4] <= 4.5 && !seen[k]) { seen[k] = 1; ks.push(k); } });
    ks.map(function (k) { return [k, SHXK.mag0(k)]; }).sort(function (a, b) { return a[1] - b[1]; }).slice(0, 12).reverse().forEach(function (r) {
      var b = BY[r[0]], nm = N[r[0]] ? N[r[0]][0] + (b && b[1] ? ' <small style="opacity:.6">' + b[1] + '</small>' : '') : b ? (b[0] ? b[0] + ' <small style="opacity:.6">' + b[1] + '</small>' : b[1] || b[2]) : 'HYG #' + r[0], m = r[1] < 0 ? '−' + (-r[1]).toFixed(1) : r[1].toFixed(1);
      var e = el('div', 'it mb', '<span class="dot" style="background:#fff4d8;margin-left:14px"></span><span class="nm">' + nm + '</span><span class="ds">' + m + ' 等</span>');
      e.style.fontSize = '.92em'; e.addEventListener('click', function (ev) { ev.stopPropagation(); box.querySelectorAll('.it.on').forEach(function (x) { x.classList.remove('on'); }); e.classList.add('on'); go('star', r[0]); if (innerWidth <= 900) root.classList.remove('xg-cat'); });
      it.after(e);
    });
  }
  function norm(v) { var l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; }
  function fl(x) { return x < 10 ? x.toFixed(2) + ' 光年' : Math.round(x).toLocaleString('en-US') + ' 光年'; }
  function farCard(c, dly, id) {
    var old = document.getElementById('xg-far'); if (old) old.remove(); var r = X._.root(); if (!r) return;
    var d = el('div', '', '<b>' + c[2] + ' · ' + c[1] + '</b><p>星座是从地球看出去的投影:组成它的星远近不同,只是方向凑在一起。你现在距太阳 ' + fl(dly) + ',从这里看形状已经变了,插画也对不上。</p>' +
      '<div><button type="button" data-a="home">返航 · 回地球视角看</button><button type="button" data-a="here">就在这里看它变形</button><button type="button" data-a="x">关闭</button></div>');
    d.id = 'xg-far'; d.setAttribute('role', 'dialog'); r.appendChild(d);
    d.onclick = function (e) { var b = e.target.closest('button'); if (!b) return; d.remove(); var a = b.dataset.a;
      if (a === 'home' && window.SHXDV && SHXDV.home) { SHXDV.home(); if (X._.toast) X._.toast('返航中 · 抵达后再点「' + c[2] + '」即可看到地球视角的星座'); }
      else if (a === 'here') go('con', id, 1); };
  }
  function go(kind, id, o) {
    var v = null;
    if (kind === 'exo') { if (window.SHXK) SHXK.hide(); if (window.SHXDV) SHXDV.lock(id, '目录'); return; }
    if (kind === 'star') { v = SHXK.starDir(id); X._.cardSrc = '目录'; SHXK.show(id); }
    else if (kind === 'dso') { var D = SHXK.dsoList(); if (!D) return; v = D[id].v; X._.cardSrc = '目录'; SHXK.dso(id); }
    else if (kind === 'con') {
      // C2.14c 王磊 11-02(BUG-05):星座是从地球看出去的投影 → 离开太阳系(> 0.05 光年)时先提示,可返航到地球视角观看;方向一律按飞船所在位置计算
      var c = (window.SHX_CONSTART || []).filter(function (c) { return c[0] === id; })[0]; if (!c) return; var s = [0, 0, 0], sp = X._.S.pos, LY = 9.4607304725808e12, sh = [sp[0] / LY, sp[1] / LY, sp[2] / LY], dly = Math.hypot(sh[0], sh[1], sh[2]);
      if (dly > 0.05 && !o) { farCard(c, dly, id); return; }
      c[7].forEach(function (a) { var p = SHXK.eq2p(a[2], a[3], a[4]), n = norm([p[0] - sh[0], p[1] - sh[1], p[2] - sh[2]]); s[0] += n[0]; s[1] += n[1]; s[2] += n[2]; });
      v = s; if (window.SHXD && SHXD.mode() !== 1) SHXD.mode(1); if (X._.toast) X._.toast(c[2] + ' · ' + c[1] + (dly > 0.05 ? '(此处距太阳 ' + fl(dly) + ',连线按真实三维位置画出,形状已与地球所见不同)' : '(星座连线与插画已打开 · 下方列出主要成员星,可直接锁定)')); if (window.SHXK) SHXK.hide();
    }
    if (!v) return; var S = X._.S; S.auto = false; S.align = false; if (X._.root()) X._.root().classList.remove('xc-ap');
    var d = norm(v), m = new T.Matrix4().lookAt(new T.Vector3(), new T.Vector3(d[0], d[1], d[2]), new T.Vector3(0, 1, 0).applyQuaternion(S.q));
    aim = { q0: S.q.clone(), q1: new T.Quaternion().setFromRotationMatrix(m), t0: performance.now(), dur: 1400 };
  }
  function frame() {
    if (!built) build();
    if (!aim) return; var S = X._.S, k = Math.min(1, (performance.now() - aim.t0) / aim.dur), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    if (S.auto || S.tour) { aim = null; return; }
    S.q.copy(aim.q0).slerp(aim.q1, e); if (k >= 1) aim = null;
  }
  function hook(ev) { if (ev === 'open') { T = window.THREE; build(); } else if (ev === 'frame') frame(); }
  (function wait(n) { if (window.SHXC && SHXC.on) { X = SHXC; SHXC.on(hook); return; } if (n < 100) setTimeout(function () { wait(n + 1); }, 100); })(0);
  window.SHXG = { set: function (t) { if (built) set(t); }, go: go };
})();
