/* 天枢 Starhelm · 巡天 X0b · sh-x-views.js
 * 四级视图:地球 / 近地轨道 / 太阳系 / 星空 + 驾驶舱(C0)入口。
 * 旋转光环按钮(方案 BI)、面包屑、右侧尺度栏、数字键 1–4、- / = 拉远推近一级、深链 ?view=earth|leo|solar|sky|fly。
 * 只调 1.0 的 SHDOM / LE.scene 公开对象;1.0 文件不改。?domain= 与 ?task= 仍由 1.0 处理。
 */
(function () {
  'use strict';
  var V = [
    { id: 'earth', zh: '地球', en: 'EARTH', key: '1', ic: '<circle cx="12" cy="12" r="6.2"/><path d="M6.5 10.5c2.5 1 4-1 6-.2s2.2 2.6 5 2.2M8.5 15.8c1.6-.6 3.1.1 4.2 1.3"/>' },
    { id: 'leo', zh: '近地轨道', en: 'LEO', key: '2', ic: '<circle cx="12" cy="12" r="3.6"/><ellipse cx="12" cy="12" rx="9.4" ry="3.6" transform="rotate(-24 12 12)"/><circle cx="19.6" cy="8.6" r="1.2" class="f"/>' },
    { id: 'solar', zh: '太阳系', en: 'SOLAR', key: '3', ic: '<circle cx="12" cy="12" r="2.4" class="f"/><circle cx="12" cy="12" r="5.6"/><circle cx="12" cy="12" r="9.2"/><circle cx="17.6" cy="12" r="1.1" class="f"/><circle cx="5.5" cy="8.5" r="1.1" class="f"/>' },
    { id: 'sky', zh: '星空', en: 'SKY', key: '4', ic: '<path d="M12 3.5l1.6 4.8 4.9.1-3.9 3 1.4 4.8-4-2.9-4 2.9 1.4-4.8-3.9-3 4.9-.1z"/><circle cx="4.5" cy="19" r=".9" class="f"/><circle cx="19.5" cy="18" r=".9" class="f"/>' }
  ];
  var FLY = { id: 'fly', zh: '驾驶舱', en: 'FLIGHT', key: 'F', ic: '<path d="M12 3l3.2 8.6L12 10l-3.2 1.6z" class="f"/><path d="M4 15.5c2.5-1.8 5.2-2.6 8-2.6s5.5.8 8 2.6M7 19.5c1.6-1 3.2-1.4 5-1.4s3.4.4 5 1.4"/>' };
  var X = window.SHXV = { cur: null, views: V };
  var root, crumb, scale, ind, lab, lastKm = 0;

  function reduced() { return matchMedia('(prefers-reduced-motion: reduce)').matches; }
  function css() {
    var s = document.createElement('style'); s.id = 'shx-views-css';
    s.textContent = [
      '#shx-nav{position:fixed;left:50%;top:calc(var(--shh-acts,90px) + 10px);transform:translateX(-50%);z-index:60;display:flex;flex-direction:column;align-items:center;gap:6px;pointer-events:none;font-family:"Noto Sans SC",system-ui,sans-serif}',
      '#shx-nav .row{display:flex;gap:10px;align-items:center;pointer-events:auto;padding:6px 10px;border-radius:40px;background:rgba(6,10,22,.42);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);border:1px solid rgba(140,180,230,.16)}',
      '.shx-ring{position:relative;width:46px;height:46px;border:0;background:none;padding:0;cursor:pointer;color:#cfd8ea;display:grid;place-items:center}',
      '.shx-ring::before{content:"";position:absolute;inset:0;border-radius:50%;background:conic-gradient(from 0deg,rgba(127,214,255,0) 0deg,rgba(127,214,255,.85) 70deg,rgba(127,214,255,0) 140deg,rgba(240,201,122,0) 200deg,rgba(240,201,122,.7) 260deg,rgba(240,201,122,0) 330deg);-webkit-mask:radial-gradient(circle,transparent 19px,#000 20px,#000 22px,transparent 23px);mask:radial-gradient(circle,transparent 19px,#000 20px,#000 22px,transparent 23px);animation:shxspin 9s linear infinite;opacity:.55;transition:opacity .25s}',
      '.shx-ring::after{content:"";position:absolute;inset:6px;border-radius:50%;border:1px dashed rgba(200,215,240,.22);animation:shxspin 24s linear infinite reverse}',
      '.shx-ring svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:1.3;stroke-linecap:round;stroke-linejoin:round;position:relative;z-index:1}.shx-ring svg .f{fill:currentColor;stroke:none}',
      '.shx-ring .k{position:absolute;right:-1px;bottom:-1px;font:600 9px/1 ui-monospace,monospace;color:rgba(200,215,240,.6);z-index:1}',
      '.shx-ring .t{position:absolute;top:50px;left:50%;transform:translateX(-50%);white-space:nowrap;font-size:11px;letter-spacing:.08em;color:rgba(220,228,245,.0);transition:color .2s;pointer-events:none}',
      '.shx-ring:hover .t,.shx-ring:focus-visible .t{color:rgba(220,228,245,.85)}',
      '.shx-ring:hover::before,.shx-ring:focus-visible::before{opacity:1;animation-duration:3s}',
      '.shx-ring.on{color:#f0c97a}.shx-ring.on::before{opacity:1;animation-duration:4s;background:conic-gradient(from 0deg,rgba(240,201,122,0),rgba(240,201,122,1) 90deg,rgba(240,201,122,0) 180deg,rgba(127,214,255,0) 200deg,rgba(127,214,255,.9) 280deg,rgba(127,214,255,0) 350deg)}',
      '.shx-ring.on .k{color:#f0c97a}',
      '.shx-ring.fly{color:#7fd6ff}.shx-sep{width:1px;height:26px;background:rgba(140,180,230,.25);margin:0 2px}',
      '@keyframes shxspin{to{transform:rotate(360deg)}}',
      '#shx-crumb{pointer-events:auto;font-size:12px;letter-spacing:.06em;color:rgba(200,212,235,.6);display:flex;gap:6px;align-items:center;text-shadow:0 0 6px #000}',
      '#shx-crumb a{color:inherit;text-decoration:none;cursor:pointer;padding:1px 3px;border-radius:4px}#shx-crumb a:hover{color:#fff}#shx-crumb a.on{color:#f0c97a}#shx-crumb i{font-style:normal;opacity:.45}',
      '#shx-scale{position:fixed;right:14px;top:50%;transform:translateY(-50%);z-index:55;width:46px;height:min(46vh,340px);pointer-events:auto;font:10px/1.2 ui-monospace,Menlo,monospace;color:rgba(200,215,240,.7)}',
      '#shx-scale .bar{position:absolute;right:8px;top:0;bottom:0;width:2px;background:linear-gradient(#7fd6ff55,#f0c97a55);border-radius:2px}',
      '#shx-scale .n{position:absolute;right:4px;width:10px;height:10px;margin-top:-5px;border-radius:50%;border:1px solid rgba(200,215,240,.55);background:#0a1020;cursor:pointer}',
      '#shx-scale .n.on{border-color:#f0c97a;background:#f0c97a}',
      '#shx-scale .nl{position:absolute;right:20px;margin-top:-7px;white-space:nowrap;text-align:right;cursor:pointer}',
      '#shx-scale .nl.on{color:#f0c97a}',
      '#shx-scale .ind{position:absolute;right:0;width:18px;height:2px;margin-top:-1px;background:#7fd6ff;box-shadow:0 0 6px #7fd6ff;transition:top .3s}',
      '#shx-scale .lab{position:absolute;right:22px;margin-top:8px;white-space:nowrap;color:#7fd6ff;transition:top .3s}',
      '@media (max-width:640px){#shx-nav{top:50%;left:auto;right:4px;transform:translateY(-50%)}#shx-nav .row{flex-direction:column}#shx-crumb{display:none}.shx-sep{width:22px;height:1px}.shx-ring{width:38px;height:38px}.shx-ring::before{-webkit-mask:radial-gradient(circle,transparent 15px,#000 16px,#000 18px,transparent 19px);mask:radial-gradient(circle,transparent 15px,#000 16px,#000 18px,transparent 19px)}.shx-ring svg{width:18px;height:18px}#shx-nav .row{gap:4px;padding:4px 6px}#shx-crumb{font-size:10.5px}#shx-scale{display:none}.shx-ring .t{display:none}}',
      '@media (max-height:420px){#shx-nav{top:6px}#shx-crumb{display:none}#shx-scale{display:none}.shx-ring .t{display:none}}',
      '@media (prefers-reduced-motion:reduce){.shx-ring::before,.shx-ring::after{animation:none}}',
      'body.shx-flying #shx-nav,body.shx-flying #shx-scale,body.shx-flying #shx-badge{display:none}'
    ].join('\n');
    document.head.appendChild(s);
  }
  function btn(v) {
    var b = document.createElement('button'); b.className = 'shx-ring' + (v.id === 'fly' ? ' fly' : ''); b.type = 'button';
    b.setAttribute('data-v', v.id); b.setAttribute('aria-label', v.zh + '(' + v.key + ')'); b.title = v.zh + ' · ' + v.key;
    b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true">' + v.ic + '</svg><span class="k">' + v.key + '</span><span class="t">' + v.zh + '</span>';
    b.addEventListener('click', function () { X.go(v.id); });
    return b;
  }
  // 尺度栏:对数位置,四级各占一个锚点(km)
  var ANCH = [{ id: 'earth', km: 2e4 }, { id: 'leo', km: 9e4 }, { id: 'solar', km: 3e9 }, { id: 'sky', km: 4e14 }];
  var LMIN = Math.log10(5e3), LMAX = Math.log10(1e16);
  function pos(km) { var l = Math.log10(Math.max(km, 1)); return Math.max(0, Math.min(1, (l - LMIN) / (LMAX - LMIN))); }
  function build() {
    css();
    root = document.createElement('div'); root.id = 'shx-nav';
    var row = document.createElement('div'); row.className = 'row'; row.setAttribute('role', 'toolbar'); row.setAttribute('aria-label', '四级视图');
    V.forEach(function (v) { row.appendChild(btn(v)); });
    // 10-26 23:39 王磊:驾驶舱按钮从圆形视图条取消,改装进顶栏「航行」方框(F 键仍可用)
    crumb = document.createElement('nav'); crumb.id = 'shx-crumb'; crumb.setAttribute('aria-label', '面包屑');
    crumb.innerHTML = V.map(function (v, i) { return (i ? '<i>›</i>' : '') + '<a data-v="' + v.id + '">' + v.zh + '</a>'; }).join('');
    crumb.addEventListener('click', function (e) { var a = e.target.closest('a'); if (a) X.go(a.getAttribute('data-v')); });
    root.appendChild(row); root.appendChild(crumb); document.body.appendChild(root);
    scale = document.createElement('div'); scale.id = 'shx-scale'; scale.setAttribute('aria-hidden', 'true');
    var h = '<div class="bar"></div>';
    ANCH.forEach(function (a, i) { var t = (1 - pos(a.km)) * 100; h += '<div class="n" data-v="' + a.id + '" style="top:' + t + '%"></div><div class="nl" data-v="' + a.id + '" style="top:' + t + '%">' + V[i].zh + '</div>'; });
    h += '<div class="ind"></div><div class="lab"></div>';
    scale.innerHTML = h; document.body.appendChild(scale);
    scale.addEventListener('click', function (e) { var n = e.target.closest('[data-v]'); if (n) X.go(n.getAttribute('data-v')); });
    ind = scale.querySelector('.ind'); lab = scale.querySelector('.lab');
  }
  function fmt(km) {
    if (km < 1e6) return Math.round(km).toLocaleString('zh-CN') + ' km';
    var au = km / 149597870.7; if (au < 2000) return (au < 10 ? au.toFixed(2) : Math.round(au)) + ' AU';
    var ly = km / 9.4607e12; return (ly < 10 ? ly.toFixed(2) : Math.round(ly).toLocaleString('zh-CN')) + ' 光年';
  }

  /* ---------- 当前视图 ---------- */
  function earthR() { var S = window.LE && LE.scene; return S && S.earthCam ? S.earthCam.position.length() : 3; }
  function detect() {
    if (window.SHXC && SHXC.isOpen()) return 'fly';
    var D = window.SHDOM; if (!D) return 'earth';
    var c = D.cur || 1;
    if (c === 1) return earthR() < 4.4 ? 'earth' : 'leo';
    if (c >= 5) return 'sky';
    return 'solar';
  }
  function camKm() {
    var S = window.LE && LE.scene; if (!S) return 2e4;
    if (window.SHD5 && SHD5.isOpen && SHD5.isOpen()) return SHD5.camKm();
    if (window.SHD2 && SHD2.isOpen && SHD2.isOpen()) return SHD2.camKm();
    if (S.mode === 'solar' && S.solarCam) { var c = S.solarCam.position.distanceTo(S.solarCtl.target); return Math.pow(c / 14, 2) * 149597870.7; }
    return earthR() * 6371;
  }
  function paint() {
    var v = detect(); X.cur = v;
    if (root) root.querySelectorAll('.shx-ring').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-v') === v); });
    if (crumb) crumb.querySelectorAll('a').forEach(function (a) { a.classList.toggle('on', a.getAttribute('data-v') === v); });
    if (scale) {
      scale.querySelectorAll('[data-v]').forEach(function (n) { n.classList.toggle('on', n.getAttribute('data-v') === v); });
      var km = camKm(); if (Math.abs(km - lastKm) / (lastKm || 1) > 0.01) { lastKm = km; var t = (1 - pos(km)) * 100 + '%'; ind.style.top = t; lab.style.top = t; lab.textContent = fmt(km); }
    }
  }

  /* ---------- 跳转 ---------- */
  var tw = null;
  function tweenEarth(r) {
    var S = window.LE && LE.scene; if (!S || !S.earthCam) return;
    var c = S.earthCam, t0 = performance.now(), r0 = c.position.length(), dur = reduced() ? 1 : 1400;
    if (tw) cancelAnimationFrame(tw);
    (function step() {
      var k = Math.min(1, (performance.now() - t0) / dur), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      var rr = r0 * Math.pow(r / r0, e); c.position.setLength(rr); if (S.earthCtl && S.earthCtl.update) S.earthCtl.update();
      if (k < 1) tw = requestAnimationFrame(step); else tw = null;
    })();
  }
  X.go = function (id) {
    var D = window.SHDOM;
    if (id === 'fly') { if (window.SHXC) SHXC.open({ target: X.cur === 'leo' || X.cur === 'earth' ? 'earth' : null }); else toast('驾驶舱还在载入'); return; }
    if (window.SHXC && SHXC.isOpen()) SHXC.close(true);
    if (!D || !D.go) return;
    if (window.SHFOCUS && SHFOCUS.focused && SHFOCUS.back) try { SHFOCUS.back(); } catch (e) { }
    if (id === 'earth') { D.go(1, { quiet: true }); tweenEarth(2.8); }
    else if (id === 'leo') { D.go(1, { quiet: true }); tweenEarth(7.5); }
    else if (id === 'solar') D.go(3);
    else if (id === 'sky') D.go(5);
    X.cur = id;
    try { history.replaceState(null, '', setQ('view', id)); } catch (e) { }
    setTimeout(paint, 60); setTimeout(paint, 900);
  };
  X.step = function (dir) {   // dir +1 拉远,-1 推近
    var i = V.map(function (v) { return v.id; }).indexOf(detect()); if (i < 0) i = 0;
    var j = Math.max(0, Math.min(V.length - 1, i + dir)); if (j !== i) X.go(V[j].id);
  };
  function setQ(k, v) { var u = new URL(location.href); u.searchParams.set(k, v); u.searchParams.delete('domain'); return u.pathname + u.search + u.hash; }
  function toast(m) { if (window.LE && LE.ui && LE.ui.toast) LE.ui.toast(m); }

  function keys(e) {
    if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
    var t = e.target; if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    if (window.SHXC && SHXC.isOpen()) return;
    var i = '1234'.indexOf(e.key);
    if (i >= 0) { X.go(V[i].id); e.preventDefault(); return; }
    if (e.key === '-' || e.key === '_') { X.step(1); e.preventDefault(); }
    else if (e.key === '=' || e.key === '+') { X.step(-1); e.preventDefault(); }
    else if (e.key === 'f' || e.key === 'F') { X.go('fly'); e.preventDefault(); }
  }

  function boot() {
    if (!document.body) return setTimeout(boot, 50);
    if (!window.THREE) return;   // 无 WebGL:1.0 的 2D 降级页不挂四级视图
    build(); addEventListener('keydown', keys);
    setInterval(paint, 400); paint();
    var q = new URLSearchParams(location.search).get('view');
    if (q && /^(earth|leo|solar|sky|fly)$/.test(q)) {
      var n = 0; (function wait() {
        var ok = window.SHDOM && SHDOM.ready && (q !== 'fly' || window.SHXC);
        if (ok) { setTimeout(function () { X.go(q); }, 300); if (q === 'earth' || q === 'leo') setTimeout(function () { if (detect() !== q) X.go(q); }, 3500); } else if (n++ < 200) setTimeout(wait, 100);
      })();
    }
  }
  boot();
})();
