/* 天枢 Starhelm · v1.0-M3h 特写信息窗口补全(王磊 10-23 21:10:有特写镜头的天体都要有特写后的信息窗口)
 * 太阳、月球、5 颗矮行星原来弹旧版卡片,哈雷彗星没有卡片 → 统一改为 1.0 此刻卡(SHHUD.showNow)。
 * 哈雷彗星卡跟随回归动画的时刻实时刷新;卡上「彗核特写」= 一镜到底,「相关任务」打开彗星任务。 */
(function () {
  var AU = 149597870.7, C = 299792.458;
  var EXTRA = {   // 矮行星补充(其余取 planets-data 的 facts)
    pluto: { where: '柯伊伯带', fun: '新视野号 2015 年飞掠时拍到一颗「心」:斯普特尼克平原,一片巨大的氮冰平原。' },
    ceres: { where: '小行星带', fun: '黎明号在它的奥卡托陨击坑里看到明亮的盐斑,地下可能还藏着咸水。' },
    haumea: { where: '柯伊伯带', fun: '约 3.9 小时转一圈,是太阳系转得最快的大天体之一,还带着一圈细环。' },
    makemake: { where: '柯伊伯带', fun: '2005 年复活节前后被发现,名字来自复活节岛神话里的创世神。' },
    eris: { where: '离散盘', fun: '它和冥王星差不多大,2005 年它的发现让天文学家重新定义了「行星」。' }
  };
  var SUNX = [['类型', 'G2V 黄矮星,约 46 亿岁'], ['表面温度', '约 5500 °C(日冕上百万 °C)'], ['一句话', '太阳系 99.86% 的质量都在它身上。']];
  var MOONX = [['一句话', '它被潮汐锁定,所以总是同一面朝向地球。']];
  function esc(s) { return String(s).replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }); }
  function km(n) { return n >= 1e8 ? (n / 1e8).toFixed(n < 1e10 ? 2 : 1) + ' 亿 km' : Math.round(n).toLocaleString('en-US') + ' km'; }
  function len(a) { return Math.hypot(a.x, a.y, a.z); }
  function sub(a, b) { return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z }; }
  function ymd(ms) { var d = new Date(ms); return d.getUTCFullYear() + '-' + ('0' + (d.getUTCMonth() + 1)).slice(-2) + '-' + ('0' + d.getUTCDate()).slice(-2); }
  function out(el, o, rows) {
    var h = '<div class="shnow-h"><b>' + o.name + '</b><small>' + o.en + '</small></div>';
    rows.forEach(function (r) { h += '<div class="shnow-r"><span>' + r[0] + '</span><span>' + esc(r[1]) + '</span></div>'; });
    el.innerHTML = h + '<div class="shnow-s">' + o.source + '</div>'; return o;
  }
  function earthAt(ms) { return LE.solar.helio(LE.solar.byId.earth, ms); }
  function dwarf(el, b, d) {
    var ms = d.getTime(), h = LE.solar.helio(b, ms), r = len(h), e = len(sub(h, earthAt(ms))) * AU, f = b.facts || {}, x = EXTRA[b.id] || {};
    var o = { id: b.id, name: b.zh, en: b.en, distKm: e, sunAU: r, lightSec: e / C, source: '轨道根数本机计算 · 外观:' + (f.外观 || '') };
    var rows = [['离太阳', r.toFixed(2) + ' AU(' + km(r * AU) + ')'], ['类型', '矮行星 · ' + (x.where || f.位置 || '')], ['半径', Math.round(b.radiusKm).toLocaleString('en-US') + ' km']];
    if (f.自转) rows.push(['一天(自转)', f.自转]); if (f.公转) rows.push(['一年(绕太阳)', f.公转]);
    if (f.卫星) rows.push(['卫星', f.卫星 + ' 颗']); if (f.温度) rows.push(['表面温度', f.温度]);
    rows.push(['一句话', x.fun || b.blurb || '']);
    return out(el, o, rows);
  }
  function comet(el) {
    var L = SH.cometLab, K = L._K, P = L.T_PERI, t = K.t, h = L.helioAt(t), r = len(h), e = len(sub(h, earthAt(t))) * AU;
    var now = Date.now(), hn = L.helioAt(now), rn = len(hn), dd = Math.round((t - P) / 864e5);
    var act = K.act || 0, tail = act <= 0.02 ? '没有尾巴:冰还冻着' : act > 0.7 ? '最长最亮,离子尾和尘埃尾都出来了' : act > 0.3 ? '尾巴正在变长' : '刚开始长出彗发';
    var o = { id: 'halley', name: '哈雷彗星', en: "1P/Halley", distKm: e, sunAU: r, lightSec: e / C, badge: '模拟 2061 回归', source: '画面是 2061 年回归的模拟(每秒约 6 天) · JPL 轨道根数本机计算 · 彗核形状参考 1986 年乔托号' };
    return out(el, o, [
      ['画面时刻', ymd(t) + '(' + (dd === 0 ? '正在近日点' : dd < 0 ? '近日点前 ' + (-dd) + ' 天' : '近日点后 ' + dd + ' 天') + ')'],
      ['离太阳', r.toFixed(2) + ' AU(' + km(r * AU) + ')'],
      ['尾巴', tail],
      ['真实的它此刻', '离太阳约 ' + rn.toFixed(1) + ' AU,正在往回飞'],
      ['下一次回来', '2061-07-28 过近日点'],
      ['上次回来', '1986-02-09 过近日点'],
      ['近距离看过', '1986 年乔托号飞到彗核旁 596 km'],
      ['回归周期', '约 76 年'],
      ['彗核大小', '约 15 × 8 km 的「花生」'],
      ['彗核颜色', '黑得像煤,只反射约 4% 的光']
    ]);
  }
  function init() {
    var orig = SHNOW.card;
    SHNOW.card = function (el, body, d) {
      d = d || (window.SHTIME ? SHTIME.now() : new Date());
      try {
        if (body === 'halley') return comet(el);
        var b = LE.solar.byId[body]; if (b && b.type === '矮行星') return dwarf(el, b, d);
      } catch (e) { console.error('[SHCARDS]', e); }
      var o = orig(el, body, d);
      if (body === 'sun' || body === 'moon') el.insertAdjacentHTML('beforeend', (body === 'sun' ? SUNX : MOONX).map(function (r) { return '<div class="shnow-r"><span>' + r[0] + '</span><span>' + r[1] + '</span></div>'; }).join(''));
      return o;
    };
    var MINE = ['sun', 'moon', 'pluto', 'ceres', 'haumea', 'makemake', 'eris'];
    var TASK = { sun: ['太阳活动观测台', 'sunLab'], moon: ['月相实验室', 'moonLab'] };
    LE.bus.on('select', function (e) {
      if (!e || e.kind !== 'planet' || !e.item || MINE.indexOf(e.item.id) < 0) return;
      var id = e.item.id;
      setTimeout(function () { if (LE.ui.closeCard) LE.ui.closeCard(); }, 0);
      SHHUD.showNow(id, null, ['飞近 ' + e.item.zh, TASK[id] && window.SH && SH[TASK[id][1]] ? TASK[id][0] : '']);
      if (window.SHDOM && SHDOM.setFocus) SHDOM.setFocus(null);
    });
    SHHUD.on('fly', function (b) { if (MINE.indexOf(b) >= 0) LE.solar.select(b); else if (b === 'halley') SH.cometLab.fly(); });
    SHHUD.on('zoomout', function (b) {
      if (b === 'halley') { SHHUD.hideNow(); SH.cometLab.open(); return; }
      var t = TASK[b]; if (t && SH[t[1]]) { SHHUD.hideNow(); SH[t[1]].open(); }
    });
    SH.cometLab.onFly = function () { if (!SH.cometLab._K.on) SHHUD.showNow('halley', null, ['◎ 彗核特写', '彗星的尾巴为什么总背着太阳?']); };
  }
  (function wait(k) {
    if (window.SHNOW && SHNOW.ok && window.LE && LE.solar && LE.solar.byId && LE.solar.byId.pluto && window.SHHUD && SHHUD.on && window.SH && SH.cometLab && SH.cometLab.helioAt) { try { init(); } catch (e) { console.error('[SHCARDS]', e); } return; }
    if (k > 3000) return; setTimeout(function () { wait(k + 1); }, 200);
  })(0);
})();
