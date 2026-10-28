/* 天枢 C2.4 · 目标资料统一数据源(SHXI):侧舷窗信息窗与抵达报告共用
 * facts(id) → { zh, en, type, rows:[[k,v]], blurb, nature, src }。只读取已有航点 / 1.0 SOLAR 数据,不另造数值。 */
(function () {
  'use strict';
  var G = 6.674e-20;
  function sig(v, n) { return Number(v).toPrecision(n).replace(/\.?0+(e|$)/, '$1').replace(/e\+?(-?\d+)/, '×10^$1'); }
  function solar(id) { var S = window.SOLAR; if (!S) return null; return id === 'sun' ? S.sun : (S.bodies || []).filter(function (x) { return x.id === id; })[0] || (S.moons || []).filter(function (x) { return x.id === id; })[0] || null; }
  function nature(b, sd) {
    if (b.craft) return ['模型', 'NASA 3D Resources 真实模型(公有领域);位置为 2026 年 10 月方位示意'];
    if (b.comet) return ['模拟', '彗核按探测器 / 地面观测形貌程序化生成;彗尾依物理规律示意'];
    if (b.star && b.id !== 'sun') return ['模拟', '按光谱型、温度、半径程序化渲染,非实拍影像'];
    if (b.id === 'sun') return ['影像 + 模拟', '色球纹理为 SDO 影像风格程序化合成'];
    if (sd && sd.tex) return ['影像', '表面贴图源自 NASA / USGS 等探测器拼接影像'];
    if (b.parent) return ['影像', '表面贴图源自 NASA / JPL / USGS 探测器影像(见授权清单)'];
    return ['模拟', '按已知观测结果程序化呈现'];
  }
  function facts(id) {
    var X = window.SHXC && SHXC._, b = X && X.BY[id]; if (!b) return null;
    var sd = solar(id), rows = [];
    if (b.info) rows = b.info.slice();
    else {
      if (sd && sd.facts) Object.keys(sd.facts).forEach(function (k) { rows.push([k, sd.facts[k]]); });
      if (!rows.some(function (r) { return r[0] === '半径'; })) rows.unshift(['半径', Math.round(b.R).toLocaleString('en-US') + ' km']);
      if (!sd || !sd.facts) { rows.push(['质量', sig(b.GM / G, 3) + ' kg']); rows.push(['表面重力', sig(b.GM / (b.R * b.R) * 1000, 3) + ' m/s²']); if (b.temp != null) rows.push(['温度', b.temp + ' °C']); }
    }
    var n = nature(b, sd);
    return { id: id, zh: b.zh, en: b.en || (sd && sd.en) || '', type: b.type || '', rows: rows, blurb: (sd && sd.blurb) || '', nature: n[0], src: n[1], R: b.R, GM: b.GM };
  }
  window.SHXI = { facts: facts, sig: sig };
})();
