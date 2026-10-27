/* 天枢 Starhelm 2.0 · 穿梭 C1.7 —— 跨星域航图第 2 步:尺度阶梯航图 + 快捷目的地(SHXL)
 * 王磊 10-27 18:23 批准(方案:开发文档/07_方案_跨星域航行合理化_2026-10-27.md)。
 * - 七个星域按尺度由小到大排成一条「阶梯」,每个星域 2–4 个快捷目的地;V–VII 的目的地都是「虫洞门」节点。
 * - 太阳系内(I–IV)有驾驶舱星球/航点的目的地可以直接出发(C1.8 起含旅行者 1 号、奥尔特云内缘);其余目的地本步只做规划:显示真实距离和各引擎真实耗时,
 *   跨星域跃迁序列在第 4 步开放(出太阳系星空在第 3 步)。
 * - 距离均为「自地球」的约数,来源:NASA/JPL、ESA、IAU 公开资料(见 x/LICENSES.md 说明,仅为事实数据)。
 * SHXL.D 目的地表 · SHXL.get(id) · SHXL.dom(id) 0–6 · SHXL.render(host, curId, onPick, distOf)
 */
(function () {
  'use strict';
  var AU = 149597870.7, LY = 9.4607304725808e12;
  var DOMS = [
    { n: 'I', zh: '家园', en: 'HOME', scale: '近地轨道', c1: '#5fa8ff', c2: '#123a6b' },
    { n: 'II', zh: '日与月', en: 'SUN · MOON', scale: '38 万 km – 1 AU', c1: '#f0c97a', c2: '#4a3410' },
    { n: 'III', zh: '行星世界', en: 'PLANETS', scale: '0.5 – 10 AU', c1: '#e8a070', c2: '#40220f' },
    { n: 'IV', zh: '太阳系边疆', en: 'FRONTIER', scale: '40 AU – 1 光年', c1: '#9fd0e8', c2: '#13303d' },
    { n: 'V', zh: '群星', en: 'STARS', scale: '4 – 100 光年', c1: '#ffe2a0', c2: '#3d3214' },
    { n: 'VI', zh: '银河', en: 'MILKY WAY', scale: '千 – 万光年', c1: '#b8a8ff', c2: '#251c4a' },
    { n: 'VII', zh: '宇宙', en: 'UNIVERSE', scale: '十万 – 百亿光年', c1: '#ff9fd0', c2: '#3d1430' }
  ];
  // id, 中文名, 星域, 距离(km,自地球,约数), 驾驶舱星球 id(可直接飞), 备注
  var D = [
    ['earth', '地球', 0, 0, 'earth', '我们的家'],
    ['iss', '空间站 ISS', 0, 420, 'earth', '近地轨道约 420 km,飞往地球附近'],
    ['moon', '月球', 1, 384400, 'moon', '平均距离约 38.4 万 km'],
    ['sun', '太阳', 1, AU, 'sun', '1 天文单位'],
    ['mars', '火星', 2, 1.52 * AU - AU, 'mars', '距离随位置变化,出发时按实时星历计算'],
    ['jupiter', '木星', 2, 4.2 * AU, 'jupiter', '距离随位置变化,出发时按实时星历计算'],
    ['saturn', '土星', 2, 8.5 * AU, 'saturn', '距离随位置变化,出发时按实时星历计算'],
    ['pluto', '冥王星', 3, 34 * AU, 'pluto', '距离随位置变化,出发时按实时星历计算'],
    ['voyager1', '旅行者 1 号', 3, 170 * AU, 'voyager1', '2026 年约 170 AU,人类飞得最远的探测器'],
    ['oort', '奥尔特云', 3, 2000 * AU, 'oort', '内缘约 2,000 AU,外缘可达约 10 万 AU(推测)'],
    ['proxima', '比邻星', 4, 4.24 * LY, 'proxima', '离太阳最近的恒星'],
    ['sirius', '天狼星', 4, 8.6 * LY, 'sirius', '夜空中最亮的恒星'],
    ['vega', '织女星', 4, 25 * LY, 'vega', '夏季大三角之一'],
    ['trappist1', 'TRAPPIST-1', 4, 40.7 * LY, 'trappist1', '7 颗岩质行星的红矮星系统'],
    ['orion', '猎户座大星云', 5, 1344 * LY, null, '离我们最近的大型恒星诞生区'],
    ['crab', '蟹状星云', 5, 6500 * LY, null, '1054 年超新星遗迹,中心有脉冲星'],
    ['eagle', '鹰状星云', 5, 7000 * LY, null, '「创生之柱」所在'],
    ['sgra', '银心 人马座 A*', 5, 26700 * LY, null, '银河中心的超大质量黑洞'],
    ['mc', '大小麦哲伦云', 6, 160000 * LY, null, '银河的两个卫星星系(约 16 万 / 20 万光年)'],
    ['andromeda', '仙女座星系', 6, 2.5e6 * LY, null, '离我们最近的大型旋涡星系'],
    ['virgo', '室女座星系团', 6, 5.4e7 * LY, null, '上千个星系组成的星系团'],
    ['hdf', '哈勃深场', 6, 1.3e10 * LY, null, '最远的星系光行距离约 130 亿光年']
  ].map(function (r) { return { id: r[0], zh: r[1], dom: r[2], km: r[3], body: r[4], note: r[5], gate: r[2] >= 4 }; });
  var BY = {}; D.forEach(function (d) { BY[d.id] = d; });
  // 驾驶舱里有、但阶梯未列出的星球(水星、金星、天王星、海王星)归 III 行星世界
  function dom(id) { var d = BY[id]; if (d) return d.dom; return id === 'earth' ? 0 : id === 'moon' || id === 'sun' ? 1 : id === 'pluto' ? 3 : 2; }

  function css() {
    if (document.getElementById('xl-css')) return;
    var s = document.createElement('style'); s.id = 'xl-css';
    s.textContent =
      '.xl-lad{display:flex;align-items:flex-end;gap:4px;margin:8px 0 2px;overflow-x:auto;padding:6px 2px 4px;scrollbar-width:thin}' +
      '.xl-r{flex:1 0 auto;display:flex;flex-direction:column;align-items:center;gap:4px;background:none;border:0;padding:0 2px;cursor:pointer;color:#cfe3f5;font:inherit;min-width:58px}' +
      '.xl-r b{display:block;border-radius:50%;border:1.5px solid var(--c1);background:radial-gradient(circle at 50% 50%,var(--c1) 0,var(--c2) 22%,rgba(6,12,24,.6) 70%);box-shadow:0 0 10px rgba(127,214,255,.18),inset 0 0 12px rgba(127,214,255,.15);opacity:.62;transition:opacity .2s,box-shadow .2s,transform .2s;position:relative}' +
      '.xl-r b::after{content:"";position:absolute;inset:16%;border-radius:50%;border:1px dashed rgba(200,230,255,.25)}' +
      '.xl-r:hover b{opacity:.9}.xl-r.on b{opacity:1;box-shadow:0 0 18px var(--c1),inset 0 0 14px rgba(255,255,255,.18);transform:scale(1.06)}' +
      '.xl-r span em{font-style:normal}.xl-r span{font-size:12px;letter-spacing:.04em;white-space:nowrap}.xl-r span i{font-style:normal;color:#f0c97a;margin-right:3px}.xl-r.on span{color:#f0c97a}' +
      '.xl-r small{font-size:10px;opacity:.55;white-space:nowrap}' +
      '.xl-sc{font-size:11px;color:#7fb6dd;letter-spacing:.06em;margin:6px 0 0}' +
      '.xl-dst{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0 10px}' +
      '.xl-d{display:inline-flex;flex-direction:column;align-items:flex-start;padding:6px 12px;border-radius:16px;border:1px solid rgba(150,180,220,.28);background:rgba(20,30,52,.5);color:#dfe7f5;cursor:pointer;font:inherit;font-size:14px;text-align:left;line-height:1.25}' +
      '.xl-d:hover{border-color:#7fd6ff}.xl-d.on{border-color:#f0c97a;color:#f0c97a}.xl-d small{display:block;font-size:10.5px;opacity:.6}' +
      '.xl-d .t{white-space:nowrap}.xl-d .xl-g{font-size:10px;color:#c49bff;margin-left:5px;border:1px solid currentColor;border-radius:8px;padding:0 5px}' +
      '.xl-d .xl-p{font-size:10px;color:#9ab;margin-left:5px}' +
      '@media (max-width:640px){.xl-lad{gap:2px}.xl-r{min-width:0;flex:1 1 0;padding:0}.xl-r span{font-size:10.5px}.xl-r span em{display:none}.xl-r.on span em{display:inline}.xl-r small{display:none}.xl-d{font-size:13px;padding:5px 10px}}';
    document.head.appendChild(s);
  }
  function fd(km) { var V = window.SH && SH.voyData; return V && V.fmtDist ? V.fmtDist(km) : Math.round(km) + ' km'; }

  // host:容器;curId:当前目标(阶梯 id 或驾驶舱星球 id);onPick(dest) 选中快捷目的地
  function render(host, curId, onPick, distOf) {
    css();
    var sel = dom(curId), mob = innerWidth < 640;
    host.innerHTML = '<div class="xl-lad" role="tablist" aria-label="尺度阶梯 · 七星域"></div><div class="xl-sc"></div><div class="xl-dst" role="group" aria-label="快捷目的地"></div>';
    var lad = host.querySelector('.xl-lad'), sc = host.querySelector('.xl-sc'), dst = host.querySelector('.xl-dst');
    DOMS.forEach(function (d, i) {
      var sz = Math.round((mob ? 16 : 28) + i * (mob ? 4 : 8.5));
      var b = document.createElement('button'); b.type = 'button'; b.className = 'xl-r'; b.dataset.d = i; b.setAttribute('role', 'tab');
      b.style.setProperty('--c1', d.c1); b.style.setProperty('--c2', d.c2);
      b.innerHTML = '<b style="width:' + sz + 'px;height:' + sz + 'px"></b><span><i>' + d.n + '</i><em>' + d.zh + '</em></span><small>' + d.en + '</small>';
      b.onclick = function () { sel = i; paint(); };
      lad.appendChild(b);
    });
    function paint() {
      lad.querySelectorAll('.xl-r').forEach(function (b) { var on = +b.dataset.d === sel; b.classList.toggle('on', on); b.setAttribute('aria-selected', on ? 'true' : 'false'); });
      var d = DOMS[sel]; sc.textContent = '星域 ' + d.n + ' ' + d.zh + ' · 尺度 ' + d.scale + (sel >= 4 ? ' · 快捷目的地都设有虫洞门' : '');
      dst.innerHTML = '';
      D.filter(function (x) { return x.dom === sel; }).forEach(function (x) {
        var b = document.createElement('button'); b.type = 'button'; b.className = 'xl-d'; b.dataset.id = x.id; b.title = x.note;
        b.classList.toggle('on', x.id === curId || (x.body && x.body === curId && !BY[curId]));
        b.innerHTML = '<span class="t">' + x.zh + (x.gate ? '<span class="xl-g">虫洞门</span>' : '') + (x.body ? '' : '<span class="xl-p">规划</span>') + '</span><small>' + (function () { var k = distOf ? distOf(x) : x.km; return k >= 1 ? '约 ' + fd(k) : '就在附近'; })() + '</small>';
        b.onclick = function () { curId = x.id; paint(); if (onPick) onPick(x); };
        dst.appendChild(b);
      });
    }
    paint();
    var on = lad.querySelector('.xl-r.on'); if (on && on.scrollIntoView && lad.scrollWidth > lad.clientWidth) lad.scrollLeft = on.offsetLeft - 20;
    return { set: function (id) { curId = id; sel = dom(id); paint(); } };
  }

  window.SHXL = { D: D, DOMS: DOMS, get: function (id) { return BY[id] || null; }, dom: dom, render: render, LY: LY, AU: AU };
})();
