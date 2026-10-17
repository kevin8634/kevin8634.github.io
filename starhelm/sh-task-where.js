/* =====================================================================
 * 天枢 Starhelm · 任务 #1「此刻,你在宇宙的哪里?」(M1)
 *  第 1 关 地址的最后一行:你的城市在哪个半球、此刻白天还是黑夜(用真实的昼夜线验证)
 *  第 2 关 宇宙尺度之梯:你 → 城市 → 地球 → 地月 → 日地 → 太阳系 → 比邻星 → 银河,每级猜放大多少倍
 *  第 3 关 用光当尺子:光从月球、太阳、海王星、比邻星到你要多久
 * 声音即规律:每跨一个数量级,音高降低一点。星桥 → 星图 Math Atlas「比例与数量级」
 * ===================================================================== */
(function () {
  'use strict';
  var SH = window.SH, LE = window.LE, U = LE.util, $ = U.$, A = SH.astro, h = SH.h;
  var C_KM = 299792.458;

  function choice(api, opts, onPick) {
    var row = h('div', 'sh-choice');
    opts.forEach(function (o) {
      var b = h('button', '', o.label); b.type = 'button';
      b.addEventListener('click', function () { row.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); }); onPick(o.v, b); });
      row.appendChild(b);
    });
    return row;
  }
  function needCity(api, retry) {
    api.area.innerHTML = '';
    api.area.appendChild(h('p', 'sh-note', '这一关需要先知道你在哪。选一个城市就行(只存在你的设备上,不上传)。'));
    api.area.appendChild(SH.btn('◉ 选城市', function () { LE.ui.openSheet('sheet-loc'); setTimeout(function () { $('loc-q').focus(); }, 200); }));
    var fn = LE.bus.on('location:changed', function () { LE.bus.off('location:changed', fn); setTimeout(retry, 600); });
    api.onLeave(function () { LE.bus.off('location:changed', fn); });
  }

  /* ------------------------------ 第 1 关 ------------------------------ */
  var L1 = { title: '地址的最后一行', guide: 'tianshu',
    ask: '写信时,地址的最后一行通常是国家。可如果要寄给宇宙里的某人,最后几行该写什么?先从地球写起:你的城市在哪个半球?此刻是白天还是黑夜?',
    hints: ['看看你城市纬度后面的字母:N 还是 S?或者看它在赤道的哪一边。', '地球上被照亮的那一侧正对着太阳;城市灯光亮起的地方是夜晚。', '把镜头拉到你的城市,看它落在昼夜线的哪一边;纬度写 N 就在北半球。'],
    mount: function (api) {
      var L = LE.location.current;
      if (!L) return needCity(api, function () { if (SH.running() && SH.running().id === 'where') SH.play('where', 1); });
      if (LE.ui.setLayer) { LE.ui.setLayer('terminator', true); LE.ui.setLayer('lights', false); }
      if (LE.scene.mode !== 'earth') LE.ui.setMode('earth');
      LE.scene.flyToLatLng(L.lat, L.lng, 3.2, 2200);
      var ans = { hemi: null, day: null }, tries = 0;
      api.area.appendChild(h('p', 'sh-note', '你的城市:<b>' + U.esc(L.name) + '</b>(经纬度 ' + Math.abs(L.lat).toFixed(2) + '°' + (L.lat >= 0 ? 'N' : 'S') + ',' + Math.abs(L.lng).toFixed(2) + '°' + (L.lng >= 0 ? 'E' : 'W') + ')'));
      api.area.appendChild(h('p', 'sh-q', '① 它在哪个半球?'));
      api.area.appendChild(choice(api, [{ label: '北半球', v: 'N' }, { label: '南半球', v: 'S' }], function (v) { ans.hemi = v; }));
      api.area.appendChild(h('p', 'sh-q', '② 此刻那里是?'));
      api.area.appendChild(choice(api, [{ label: '☀ 白天', v: true }, { label: '🌙 黑夜', v: false }], function (v) { ans.day = v; }));
      api.foot.appendChild(SH.btn('用地球验证', function () {
        if (ans.hemi == null || ans.day == null) { api.feedback('两个问题都选一下。'); return; }
        tries++;
        var day = LE.earth.isDay(L.lat, L.lng), el = A.sunElevation(L.lat, L.lng, new Date());
        var okH = ans.hemi === (L.lat >= 0 ? 'N' : 'S'), okD = ans.day === day;
        if (okH && okD) {
          api.foot.innerHTML = '';
          api.done(api.starsBy(tries === 1 ? 3 : 2), '对!你在' + (L.lat >= 0 ? '北' : '南') + '半球,此刻太阳' + (el >= 0 ? '在你那里离地平线 ' + el.toFixed(0) + '°' : '在你那里的地平线以下 ' + (-el).toFixed(0) + '°') + '。于是你的宇宙地址多了一行:' + L.name + ' · 地球。');
        } else api.feedback((okH ? '' : '半球再想想。') + (okD ? '' : '昼夜再看看地球上的昼夜线。'), 'warn');
      }, 'sh-go'));
    } };

  /* ------------------------------ 第 2 关 ------------------------------ */
  var LADDER = [
    { a: '你', am: 1.7, b: '你的城市', bm: 3e4, bt: '一座大城市宽约 30 公里' },
    { a: '城市', am: 3e4, b: '地球', bm: 1.2742e7, bt: '地球直径 12,742 公里' },
    { a: '地球', am: 1.2742e7, b: '地月距离', bm: 3.844e8, bt: '月球平均离我们 384,400 公里' },
    { a: '地月距离', am: 3.844e8, b: '日地距离', bm: 1.496e11, bt: '1 个天文单位 ≈ 1.5 亿公里' },
    { a: '日地距离', am: 1.496e11, b: '太阳系', bm: 9.0e12, bt: '海王星轨道直径约 60 个天文单位' },
    { a: '太阳系', am: 9.0e12, b: '最近的恒星', bm: 4.011e16, bt: '比邻星离我们 4.24 光年' },
    { a: '最近的恒星', am: 4.011e16, b: '银河系', bm: 9.46e20, bt: '银河系直径约 10 万光年' }
  ];
  var MULT = [{ label: '×10', v: 1 }, { label: '×100', v: 2 }, { label: '×1,000', v: 3 }, { label: '×1 万', v: 4 }, { label: '×10 万', v: 5 }, { label: '×100 万', v: 6 }];
  function ladderCam(i) {
    var S = LE.scene, L = LE.location.current;
    if (i <= 2) {
      if (S.mode !== 'earth') LE.ui.setMode('earth');
      var d = [1.35, 3.4, 11.5][i];
      if (L) S.flyToLatLng(L.lat, L.lng, d, 2000); else S.flyTo({ position: S.earthCam.position.clone().setLength(d), ms: 2000 });
    } else if (i <= 4) {
      if (S.mode !== 'solar') { SH._returnEarth = true; LE.ui.setMode('solar'); }
      if (i === 4) LE.solar.overview();
    }
  }
  var L2 = { title: '宇宙尺度之梯', guide: 'tianshu',
    ask: '从你出发,一级一级往外走。每一级大约要放大多少倍?不用算准,猜"几个零"就好。',
    hints: ['先想一个你熟悉的东西:走路 1 小时大约 5 公里。城市有几小时那么宽?', '数一数两个数相差几个"零":30 公里到 12,742 公里,差了 2 到 3 个零。', '示范一级:城市约 3 万米,地球直径约 1,274 万米,1,274 万 ÷ 3 万 ≈ 400,在 ×100 和 ×1,000 之间。其他几级照这个办法估。'],
    mount: function (api) {
      var i = 0, tries = 0, cum = 0;
      var ruler = h('div', 'sh-ruler'); api.area.appendChild(ruler);
      var stepEl = h('div', 'sh-step'); api.area.appendChild(stepEl);
      function drawRuler() {
        var max = Math.log10(LADDER[6].bm / 1.7);
        ruler.innerHTML = '<i class="sh-ruler__bar"></i>' + [{ n: '你', m: 1.7 }].concat(LADDER.map(function (s) { return { n: s.b, m: s.bm }; })).map(function (p, k) {
          var x = Math.log10(p.m / 1.7) / max * 100, on = k <= i;
          return '<span class="' + (on ? 'on' : '') + '" style="left:' + x.toFixed(1) + '%"><b></b><em>' + U.esc(p.n) + '</em></span>';
        }).join('') + '<small>数量级刻度:每一格 = 多一个零</small>';
      }
      function show() {
        drawRuler();
        if (i >= LADDER.length) {
          stepEl.innerHTML = '';
          var total = Math.log10(LADDER[6].bm / 1.7);
          api.done(api.starsBy(tries <= 9 ? 3 : tries <= 13 ? 2 : 1), '从你到银河,一共跨过约 ' + total.toFixed(0) + ' 个数量级:银河系大约是你身高的 10^' + total.toFixed(0) + ' 倍。这就是你在宇宙里的地址:你 · 城市 · 地球 · 太阳系 · 猎户臂 · 银河系。');
          return;
        }
        var s = LADDER[i];
        stepEl.innerHTML = '<p class="sh-q">第 ' + (i + 1) + ' / 7 级:从「' + U.esc(s.a) + '」到「' + U.esc(s.b) + '」,大约放大多少倍?</p>';
        stepEl.appendChild(choice(api, MULT, function (v, b) {
          tries++;
          var ans = Math.log10(s.bm / s.am);
          if (Math.abs(v - ans) < 0.8) {
            cum += ans;
            SH.sound.glass(1046.5 * Math.pow(2, -cum / 6));
            api.feedback('✓ ' + s.bt + ',大约 ×' + fmtRatio(s.bm / s.am) + '。', 'ok');
            ladderCam(i); i++; setTimeout(show, 900);
          } else { SH.sound.soft(); api.feedback(v < ans ? '比这还要大。' : '没有那么大。', 'warn'); b.setAttribute('aria-pressed', 'false'); }
        }));
      }
      function fmtRatio(r) { return r >= 1e4 ? U.fmtNum(Math.round(r / 1e3) * 1e3) : U.fmtNum(Math.round(r)); }
      show();
      api.onLeave(function () { if (LE.scene.mode !== 'earth') { SH._returnEarth = false; LE.ui.setMode('earth'); } });
    } };

  /* ------------------------------ 第 3 关 ------------------------------ */
  var L3 = { title: '用光当尺子', guide: 'tianshu',
    ask: '光是宇宙里最快的东西。可就算是光,从这些地方来到你眼睛里,也要走一段时间。猜猜各要多久?',
    hints: ['光每秒约走 30 万公里——一秒钟能绕地球七圈半。', '月球约 38 万公里,太阳约 1.5 亿公里:用距离除以 30 万公里/秒。', '月球只要 1 秒多;太阳比月球远约 400 倍。'],
    mount: function (api) {
      var now = new Date(), moonKm = A.moon(now).km, sunKm = A.sun(now).au * A.AU;
      var nep = null; try { var b = LE.solar.byId && LE.solar.byId.neptune; var d = b && LE.solar.distances(b); if (d && d.lightMin) nep = d.lightMin; } catch (e) {}
      var ITEMS = [{ n: '月球', v: 0, real: (moonKm / C_KM).toFixed(2) + ' 秒' },
                   { n: '太阳', v: 1, real: Math.floor(sunKm / C_KM / 60) + ' 分 ' + Math.round(sunKm / C_KM % 60) + ' 秒' },
                   { n: '海王星', v: 2, real: nep ? (nep / 60).toFixed(1) + ' 小时' : '约 4 小时' },
                   { n: '比邻星', v: 3, real: '约 4.24 年' }];
      var OPTS = [{ label: '约 1 秒', v: 0 }, { label: '约 8 分钟', v: 1 }, { label: '约 4 小时', v: 2 }, { label: '约 4 年', v: 3 }];
      var picks = {}, tries = 0;
      ITEMS.forEach(function (it) {
        var row = h('div', 'sh-lightrow'); row.appendChild(h('b', '', U.esc(it.n)));
        row.appendChild(choice(api, OPTS, function (v) { picks[it.n] = v; }));
        api.area.appendChild(row);
      });
      api.foot.appendChild(SH.btn('揭晓', function () {
        if (Object.keys(picks).length < 4) { api.feedback('四个都选一下。'); return; }
        tries++;
        var wrong = ITEMS.filter(function (it) { return picks[it.n] !== it.v; });
        if (!wrong.length) {
          api.foot.innerHTML = '';
          api.done(api.starsBy(tries === 1 ? 3 : 2), '全对!月球 ' + ITEMS[0].real + ',太阳 ' + ITEMS[1].real + ',海王星 ' + ITEMS[2].real + ',比邻星 ' + ITEMS[3].real + '。你此刻看到的太阳,是几分钟前的太阳。光年不是时间,是距离:光走一年的路。');
        } else api.feedback('有 ' + wrong.length + ' 个还不对:' + wrong.map(function (w) { return w.n; }).join('、') + '。', 'warn');
      }, 'sh-go'));
    } };

  SH.levels.where = [L1, L2, L3];
})();
