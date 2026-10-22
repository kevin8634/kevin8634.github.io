/* 天枢 Starhelm · sh-domain3.js · 星域 III「行星世界」(v1.0-M2a)
 * 并入现有「太阳系」模式(le-solar.js):八大行星按此刻真实位置(JPL 近似根数),改由统一时间轴 SHTIME 驱动;
 * 点行星 → 1.0 此刻卡(离地球、光行时、亮度、一天、一年、卫星、下一次冲日/大距,astronomy-engine 本机计算);
 * 此刻卡按钮:飞近 / 相关任务。守星人:岁星。深链 ?domain=3。
 */
(function () {
  'use strict';
  var PLAN = ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'];
  var D3 = { ready: false };
  function toast(m) { if (window.LE && LE.ui && LE.ui.toast) LE.ui.toast(m); }

  function init() {
    var S = LE.scene, SO = LE.solar;
    // 1) 时间:SHTIME 接管太阳系模拟时间(放在太阳系更新之前执行)
    S.updaters.unshift(function (dt, now, mode) {
      if (mode !== 'solar' || !window.SHTIME) return;
      var r = SHTIME.rate();
      SO.speed = r === 1 ? 1 : r;          // 自转展示沿用旧逻辑(实时时加速 600 倍)
      SO.simTime = SHTIME.now().getTime() - dt * 1000 * SO.speed;   // 抵消 le-solar 本帧的自增
    });
    // 2) 点行星 → 1.0 此刻卡(旧卡收起)
    LE.bus.on('select', function (e) {
      if (!e || e.kind !== 'planet' || !e.item) return;
      var id = e.item.id;
      if (PLAN.indexOf(id) < 0) return;
      setTimeout(function () { if (LE.ui.closeCard) LE.ui.closeCard(); }, 0);
      SHHUD.showNow(id, null, ['飞近 ' + (window.SHNOW.PLANETS[id] || {}).zh, taskFor(id) ? taskFor(id)[0] : '']);
      var g = GQ[id]; if (g) SHHUD.guide('suixing', g, []);
      if (window.SHDOM) SHDOM.setFocus(id);
    });
    SHHUD.on('fly', function (b) { if (PLAN.indexOf(b) >= 0) SO.select(b); });
    SHHUD.on('zoomout', function (b) { var t = taskFor(b); if (t && window.SH && SH[t[1]]) { SHHUD.hideNow(); SH[t[1]].open(); } });
    SHHUD.on('nowclose', function (b) { if (PLAN.indexOf(b) >= 0 && window.SHDOM) SHDOM.setFocus(null); });
    D3.ready = true;
  }
  function taskFor(id) {
    if (id === 'mars' || id === 'venus') return ['火星上的一天有多长?', 'marsdayLab'];
    if (id === 'jupiter') return ['木星为什么没变成太阳?', 'jupiterLab'];
    if (id !== 'earth' && id !== 'uranus' && id !== 'neptune') return ['今晚能看到它吗?', 'tonightLab'];
    return null;
  }
  var GQ = {
    mercury: '水星离太阳最近,为什么它却不是最热的行星?',
    venus: '金星上太阳从西边升起。它为什么倒着转?',
    earth: '从这里看,地球只是一颗蓝色小点。你能找到月亮吗?',
    mars: '火星上的一天,比地球长多少?',
    jupiter: '木星那么大,为什么没有变成第二个太阳?',
    saturn: '土星环是一整块吗?',
    uranus: '天王星是「躺着」转的。它的一年里,两极各有多久的白天?',
    neptune: '海王星离太阳那么远,阳光要走多久才到?'
  };
  D3.go = function () {
    var S = LE.scene, SO = LE.solar;
    if (S.mode !== 'solar' && LE.ui.setMode) LE.ui.setMode('solar');
    setTimeout(function () { SO.overview(); }, 50);
    SHHUD.guide('suixing', '八颗行星此刻正排在这些位置上。哪一颗离我们最近?点开看看。', []);
  };
  window.SHD3 = D3;
  (function wait(k) {
    if (window.SHDOM && SHDOM.ready && window.SHNOW && LE.solar && LE.scene && LE.scene.updaters) { try { init(); } catch (e) { console.error('[SHD3]', e); } return; }
    if (k > 900) return; setTimeout(function () { wait(k + 1); }, 100);
  })(0);
})();
