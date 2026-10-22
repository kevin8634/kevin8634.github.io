/* 天枢 Starhelm · sh-domain.js · 七星域调度 + 1.0 HUD 接入(v1.0-M1a)
 * 等 sh-main.js 的 SH_READY 后挂上 SHHUD;按镜头距离判断所在星域,更新面包屑与尺度。
 * 星域注册表 SHDOM.list;深链 ?domain=1|2(其余星域未开放时回到 I 并提示)。
 * 任何一步失败都不影响旧界面:SHHUD 挂不上时旧 HUD 原样保留。
 */
(function () {
  'use strict';
  var EARTH_KM = 6371, AU = 149597870.7;
  var D = window.SHDOM = { cur: 1, focus: null, list: null, ready: false };

  function soundOn() { var b = document.getElementById('btn-music'); return !!b && b.getAttribute('aria-pressed') === 'true'; }
  function toggleSound(on) {
    ['btn-music', 'btn-sfx'].forEach(function (id) { var b = document.getElementById(id); if (b && (b.getAttribute('aria-pressed') === 'true') !== on) b.click(); });
  }
  function gfxLabel() { var G = window.SHGFX; if (!G) return ''; return { auto: '自动', high: '高', mid: '中', r147: '兼容' }[G.choice] || ''; }

  function mount() {
    if (!window.SHHUD || D.ready) return;
    var H = SHHUD.mount({ genesis: '../', noOpening: true, gfxLabel: gfxLabel() });
    D.list = SHHUD.DOMAINS; D.ready = true;
    H.on('atlas', function () { if (window.SH && SH.openMap) SH.openMap(); });
    H.on('gfx', function () { var b = document.getElementById('btn-gfx'); if (b) b.click(); });
    H.on('sound', function (on) { toggleSound(on); });
    H.on('domain', function (e) {
      if (e.locked) { toast('星域 ' + ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII'][e.n] + ' 还在建造中,即将开放'); return; }
      D.go(e.n);
    });
    H.on('soon', function (t) {
      SHHUD.guide(t.id === 'aurora' ? 'xihe' : 'wangshu', t.q, []);
      toast('这个任务还在建造中,很快开放。先去看看此刻的月亮吧。');
      if (t.id === 'tidelock' && window.SHFOCUS) SHFOCUS.showMoon();
    });
    SHHUD.setSound(soundOn());
    // 随旧声音按钮同步
    ['btn-music'].forEach(function (id) { var b = document.getElementById(id); if (b && window.MutationObserver) new MutationObserver(function () { SHHUD.setSound(soundOn()); }).observe(b, { attributes: true, attributeFilter: ['aria-pressed'] }); });
    if (window.LE && LE.bus) LE.bus.on('mode:changed', function () { tick(true); });
    if (LE.scene && LE.scene.addUpdater) { var n = 0; LE.scene.addUpdater(function () { if (++n % 15 === 0) tick(false); }); }
    // 旧按钮行可能换成两行:量出它的底边,让右侧面板/卡片排在它下面(v1.0-M1b)
    function syncActs() { var a = document.querySelector('.le-actions'); if (!a) return; var r = a.getBoundingClientRect(); if (r.height) document.documentElement.style.setProperty('--shh-acts', Math.round(r.bottom) + 'px'); var lb = document.querySelector('.le-bottom'); if (lb && innerWidth > 640) { var q = lb.getBoundingClientRect(); if (q.height) document.documentElement.style.setProperty('--shh-lb', Math.round(innerHeight - q.top) + 'px'); } }
    syncActs(); addEventListener('resize', syncActs); setTimeout(syncActs, 1500);
    if (window.ResizeObserver) { var ro = new ResizeObserver(syncActs); ['.le-actions', '.le-bottom'].forEach(function (q) { var e = document.querySelector(q); if (e) ro.observe(e); }); }
    deepLink();
    tick(true);
  }
  function toast(m) { if (window.LE && LE.ui && LE.ui.toast) LE.ui.toast(m); }

  /* ---------- 镜头 → 星域 / 尺度 ---------- */
  var lastKey = '';
  function tick(force) {
    var S = LE.scene; if (!S) return;
    var key, km;
    if (S.mode === 'solar') {
      var c = S.solarCam.position.distanceTo(S.solarCtl.target), r = Math.pow(c / 14, 2);
      km = r * AU; key = '3|太阳系 · 预览';
    } else if (D.focus === 'moon' && window.SHFOCUS) {
      km = SHFOCUS.moonKm(); key = '2|月球';
    } else {
      km = S.earthCam.position.length() * EARTH_KM; key = '1|地球';
    }
    SHHUD.setScale(km);
    if (force || key !== lastKey) { lastKey = key; var p = key.split('|'); D.cur = +p[0]; SHHUD.setCrumb(+p[0], p[1]); }
  }
  D.tick = tick;
  D.setFocus = function (f) { D.focus = f; tick(true); };

  /* ---------- 星域跳转(M1:I 家园 / II 日与月) ---------- */
  D.go = function (n) {
    var S = LE.scene;
    if (n === 1) {
      if (S.mode !== 'earth' && LE.ui.setMode) LE.ui.setMode('earth');
      if (window.SHFOCUS) SHFOCUS.back(); else if (S.flyTo) S.flyTo({ target: new THREE.Vector3(), position: S.earthCam.position.clone().normalize().multiplyScalar(S.fitDistance()) });
      SHHUD.guide('tianshu', '你就在这颗蓝色星球上。拖动它,找找你此刻在哪儿?', []);
    } else if (n === 2) {
      if (S.mode !== 'earth' && LE.ui.setMode) LE.ui.setMode('earth');
      if (window.SHFOCUS) SHFOCUS.showMoon(true);
    }
  };
  function deepLink() {
    var m = /[?&]domain=(\d)/.exec(location.search); if (!m) return;
    var n = +m[1];
    if (n === 2) setTimeout(function () { D.go(2); }, 900);
    else if (n > 2) toast('星域 ' + ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII'][n] + ' 还在建造中,先从家园出发');
  }

  (function wait(k) {
    if (window.SH_READY && window.SHHUD) { try { mount(); } catch (e) { console.error('[SHDOM] HUD 接入失败,保留旧界面', e); try { SHHUD.unmount(); } catch (x) { } } return; }
    if (k > 900) return; setTimeout(function () { wait(k + 1); }, 100);
  })(0);
})();
