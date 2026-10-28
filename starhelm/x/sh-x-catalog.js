/* 天枢 C2.4 · 目标目录:导航目标栏分页(太阳系 / 恒星 / 星座 / 深空 / 探测器)+ 搜索
 * 太阳系与探测器沿用驾驶舱航点(单击选中、双击飞往);恒星、星座、深空天体单击后机头转向并弹资料卡。 */
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
      '#xg-box .it .ds{white-space:nowrap}#xg-box .em{color:#8fa3c2;font-size:11px;padding:6px 8px}';
    document.head.appendChild(st);
  }
  function cat(b) { return b.craft || (b.ghost && b.type === '探测器') ? 'craft' : b.star ? 'star' : 'sol'; }
  function build() {
    root = X._.root(); lst = root && root.querySelector('#xc-lst'); if (!lst || lst.querySelector('#xg-bar')) return; css();
    var cap = lst.querySelector('.cap');
    bar = el('div'); bar.id = 'xg-bar'; bar.innerHTML = TABS.map(function (t) { return '<button type="button" data-t="' + t[0] + '">' + t[1] + '</button>'; }).join('');
    inp = el('input'); inp.id = 'xg-q'; inp.type = 'search'; inp.placeholder = '搜索:中文 / 拉丁名 / M31 / NGC 7000'; inp.setAttribute('autocomplete', 'off');
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
      if (D) D.forEach(function (d, i) { var o = d.o; if (!q && !o[1] && o[0].charAt(0) !== 'M') return; if (!hit(q, [o[0], o[1], o[2], o[11]])) return; rows.push(['dso', i, o[1] && o[1].indexOf(o[0]) !== 0 ? o[0] + ' ' + o[1] : (o[1] || o[0]), ty[o[3]] || '', '#9fc3ff']); });
    }
    rows.slice(0, lim).forEach(function (r) {
      var it = el('div', 'it', '<span class="dot" style="background:' + r[4] + '"></span><span class="nm">' + r[2] + '</span><span class="ds">' + r[3] + '</span>');
      it.addEventListener('click', function () { box.querySelectorAll('.it.on').forEach(function (e) { e.classList.remove('on'); }); it.classList.add('on'); go(r[0], r[1]); if (innerWidth <= 900) root.classList.remove('xg-cat'); });
      box.appendChild(it);
    });
    if (!rows.length && (tab !== 'sol' && tab !== 'craft' || q) && !B.some(function (b) { return b.li && b.li.style.display !== 'none'; })) box.appendChild(el('div', 'em', '没有匹配的目标'));
  }
  function norm(v) { var l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; }
  function go(kind, id) {
    var v = null;
    if (kind === 'star') { v = SHXK.starDir(id); SHXK.show(id); }
    else if (kind === 'dso') { var D = SHXK.dsoList(); if (!D) return; v = D[id].v; SHXK.dso(id); }
    else if (kind === 'con') {
      var c = (window.SHX_CONSTART || []).filter(function (c) { return c[0] === id; })[0]; if (!c) return; var s = [0, 0, 0];
      c[7].forEach(function (a) { var n = norm(SHXK.eq2p(a[2], a[3], a[4])); s[0] += n[0]; s[1] += n[1]; s[2] += n[2]; });
      v = s; if (window.SHXD && SHXD.mode() !== 1) SHXD.mode(1); if (X._.toast) X._.toast(c[2] + ' · ' + c[1] + '(星座连线与插画已打开)'); if (window.SHXK) SHXK.hide();
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
