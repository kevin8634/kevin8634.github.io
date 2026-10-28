/* 天枢 Starhelm 2.0 · 穿梭 C2.2 —— 卫星与彗星(SHXB)
 * 王磊 10-28 批准范围:木卫一至四、土卫六、土卫二;彗星 1P/哈雷、67P/丘留莫夫-格拉西缅科、C/1995 O1 海尔-波普。
 * 数据:
 *  - 伽利略卫星位置:astronomy-engine JupiterMoons(L1.2 理论,MIT);无该库时退回下面的平均根数。
 *  - 土卫六、土卫二:JPL Horizons 密切根数(土星为中心,ICRF 赤道面,历元 2026-11-01 0h TDB),按平均恒星周期推进(与 Horizons 核对误差 <1°/年量级)。
 *  - 其余卫星平均根数(备用):JPL SSD Planetary Satellite Mean Elements(https://ssd.jpl.nasa.gov/sats/elem/),历元 2000-01-01.5 TDB,
 *    参考面为各自的拉普拉斯平面(极 RA/Dec 同表);平均运动 + 近点/交点进动线性外推。GM、半径取 JPL 卫星物理参数。
 *  - 彗星根数:JPL SBDB API(full-prec=1,2026-10-28 拉取),日心黄道 J2000;二体开普勒外推,忽略行星摄动 → 当前位置为近似。
 *  - 卫星纹理全部程序生成(示意),资料卡标「模拟 · 程序化纹理」;彗尾形态为示意(方向物理正确:离子尾背日、尘埃尾背日并向轨道后方弯曲)。
 * 接口:SHXB.list(插入驾驶舱 B 表)· pos(b, date, parentKm) → three 坐标 km · orbit(b) → 日心轨道点 · tex(b) → canvas
 *       nucleus(T, b) 彗核几何 · cometFx(T, b, g) 彗发/彗尾 · update(b, sunWp, dt, still) 每帧
 */
(function () {
  'use strict';
  var AU = 149597870.7, D2R = Math.PI / 180, EPS = 23.4392911 * D2R, J2K = 2451545.0, YR = 365.25;
  function jd(d) { return d.getTime() / 864e5 + 2440587.5; }
  function kep(M, e) {
    M = M % (2 * Math.PI); if (M > Math.PI) M -= 2 * Math.PI; if (M < -Math.PI) M += 2 * Math.PI;
    var E = e < 0.8 ? M : (M >= 0 ? Math.PI : -Math.PI) * 0.85;
    for (var k = 0; k < 60; k++) { var f = E - e * Math.sin(E) - M, d = f / (1 - e * Math.cos(E)); E -= d; if (Math.abs(d) < 1e-13) break; }
    return E;
  }
  function rot(a, e, i, O, w, E) {   // 近焦点 → 参考系(角度为弧度)
    var x = a * (Math.cos(E) - e), y = a * Math.sqrt(1 - e * e) * Math.sin(E);
    var cO = Math.cos(O), sO = Math.sin(O), ci = Math.cos(i), si = Math.sin(i), cw = Math.cos(w), sw = Math.sin(w);
    return [(cO * cw - sO * sw * ci) * x + (-cO * sw - sO * cw * ci) * y, (sO * cw + cO * sw * ci) * x + (-sO * sw + cO * cw * ci) * y, (sw * si) * x + (cw * si) * y];
  }
  function ecl2three(v, k) { return [v[0] * k, v[2] * k, -v[1] * k]; }
  function eq2three(v) { var y = v[1] * Math.cos(EPS) + v[2] * Math.sin(EPS), z = -v[1] * Math.sin(EPS) + v[2] * Math.cos(EPS); return [v[0], z, -y]; }
  function lapBasis(ra, dec) {   // 拉普拉斯平面:Z=极,X=该平面与 ICRF 赤道的升交点方向
    ra *= D2R; dec *= D2R;
    var Z = [Math.cos(dec) * Math.cos(ra), Math.cos(dec) * Math.sin(ra), Math.sin(dec)], X = [-Math.sin(ra), Math.cos(ra), 0];
    return [X, [Z[1] * X[2] - Z[2] * X[1], Z[2] * X[0] - Z[0] * X[2], Z[0] * X[1] - Z[1] * X[0]], Z];
  }

  // 卫星:a km, e, w°, M°, i°, O°, P d, Pw 近点进动 yr, Pn 交点进动 yr, 拉普拉斯极 RA/Dec(JPL SSD 平均根数表)
  function moon(id, zh, en, parent, R, GM, el, col, extra) {
    var o = { id: id, zh: zh, en: en, type: '卫星', parent: parent, R: R, GM: GM, col: col, proc: id, el: el, temp: extra.temp || '—', per: null, info: extra.info, ex: id, atm: extra.atm };
    el.B = el.eq ? [[1, 0, 0], [0, 1, 0], [0, 0, 1]] : lapBasis(el.ra, el.dec); return o;
  }
  var L = [
    moon('io', '木卫一', 'Io', 'jupiter', 1821.6, 5959.9, { a: 421800, e: 0.004, w: 49.1, M: 330.9, i: 0.0, O: 0.0, P: 1.762732, Pw: 1.333, Pn: 0, ra: 268.1, dec: 64.5 }, '#e3c75a',
      { info: [['母星', '木星'], ['半径', '1,821.6 km'], ['轨道半长轴', '421,800 km'], ['公转周期', '1.77 天(潮汐锁定)'], ['特征', '太阳系火山最活跃的天体'], ['纹理', '模拟 · 程序化纹理']] }),
    moon('europa', '木卫二', 'Europa', 'jupiter', 1560.8, 3202.7, { a: 671100, e: 0.009, w: 45.0, M: 345.4, i: 0.5, O: 184.0, P: 3.525463, Pw: 1.394, Pn: 30.202, ra: 268.1, dec: 64.5 }, '#e6dcc6',
      { info: [['母星', '木星'], ['半径', '1,560.8 km'], ['轨道半长轴', '671,100 km'], ['公转周期', '3.55 天(潮汐锁定)'], ['特征', '冰壳下有全球液态海洋'], ['纹理', '模拟 · 程序化纹理']] }),
    moon('ganymede', '木卫三', 'Ganymede', 'jupiter', 2631.2, 9887.8, { a: 1070400, e: 0.001, w: 198.3, M: 324.8, i: 0.2, O: 58.5, P: 7.155588, Pw: 68.301, Pn: 137.812, ra: 268.2, dec: 64.6 }, '#a59b8d',
      { info: [['母星', '木星'], ['半径', '2,631.2 km(太阳系最大卫星)'], ['轨道半长轴', '1,070,400 km'], ['公转周期', '7.15 天(潮汐锁定)'], ['特征', '唯一自带磁场的卫星'], ['纹理', '模拟 · 程序化纹理']] }),
    moon('callisto', '木卫四', 'Callisto', 'jupiter', 2410.3, 7179.3, { a: 1882700, e: 0.007, w: 43.8, M: 87.4, i: 0.3, O: 309.1, P: 16.69044, Pw: 277.921, Pn: 577.264, ra: 268.7, dec: 64.8 }, '#5e5348',
      { info: [['母星', '木星'], ['半径', '2,410.3 km'], ['轨道半长轴', '1,882,700 km'], ['公转周期', '16.69 天(潮汐锁定)'], ['特征', '太阳系陨坑最密集的表面之一'], ['纹理', '模拟 · 程序化纹理']] }),
    moon('enceladus', '土卫二', 'Enceladus', 'saturn', 252.1, 7.211, { a: 238414.1, e: 0.004011, w: 262.460956, M: 103.420864, i: 6.454879, O: 130.559511, P: 1.370218, ep: 2461345.5, eq: 1 }, '#f2f5f8',
      { info: [['母星', '土星'], ['半径', '252.1 km'], ['轨道半长轴', '238,400 km'], ['公转周期', '1.37 天(潮汐锁定)'], ['特征', '南极「虎纹」裂缝喷出水汽羽流'], ['纹理', '模拟 · 程序化纹理']] }),
    moon('titan', '土卫六', 'Titan', 'saturn', 2574.7, 8978.1, { a: 1221965.6, e: 0.0288115, w: 221.493281, M: 15.168466, i: 6.341413, O: 127.124556, P: 15.945421, ep: 2461345.5, eq: 1 }, '#d6a04c',
      { atm: [1, .62, .22], info: [['母星', '土星'], ['半径', '2,574.7 km'], ['轨道半长轴', '1,221,900 km'], ['公转周期', '15.95 天(潮汐锁定)'], ['特征', '浓厚氮气大气,地表有甲烷湖海'], ['纹理', '模拟 · 程序化纹理']] })
  ];
  // 彗星:JPL SBDB(e, q AU, i°, Ω°, ω°, tp JD, P d);Lmax 彗尾长度上限 km
  function comet(id, zh, en, R, el, Lmax, col, info, per) {
    el.a = el.q / (1 - el.e);
    return { id: id, zh: zh, en: en, type: '彗星', R: R, GM: 6.674e-20 * R * R * R * 4.19 * 5e11, col: col, comet: true, proc: id, el: el, Lmax: Lmax, temp: '—', per: per, info: info, ex: id };
  }
  L.push(
    comet('c67p', '67P 彗星', '67P/Churyumov–Gerasimenko', 2.0, { e: .6409081308996354, q: 1.243265640702404, i: 7.040294937543767, O: 50.13557377155012, w: 12.79824970228189, tp: 2457247.588657812098, P: 2353.076067903661, lobe: 1 }, 1e6, '#b9c7d6',
      [['类型', '木星族短周期彗星'], ['周期', '约 6.44 年'], ['近日点', '1.24 AU'], ['彗核', '双瓣,约 4.1 × 3.3 km'], ['探测', '罗塞塔号 2014–2016 环绕、菲莱着陆'], ['轨道', 'JPL SBDB 根数 · 二体外推(近似)']], 12.4),
    comet('halley', '哈雷彗星', '1P/Halley', 5.5, { e: .9679359956953211, q: .5748638313743413, i: 162.1905300439129, O: 59.09894720612437, w: 112.2414314637764, tp: 2446469.973616146677, P: 27728.04608790421 }, 3e7, '#cfe0ff',
      [['类型', '短周期彗星(逆行轨道)'], ['周期', '约 76 年'], ['近日点', '0.575 AU(上次 1986 年 2 月 9 日)'], ['远日点', '约 35 AU'], ['下次回归', '2061 年 7 月'], ['轨道', 'JPL SBDB 根数(历元 1968)· 二体外推,忽略行星摄动(近似)']], 52.8),
    comet('halebopp', '海尔-波普彗星', 'C/1995 O1 (Hale–Bopp)', 30, { e: .9949810027633206, q: .890537663547794, i: 89.28759424740302, O: 282.7334213961641, w: 130.4146670659176, tp: 2450537.134907143944, P: 863279.5034870314 }, 1e8, '#e8e0c8',
      [['类型', '长周期彗星'], ['周期', '约 2,400 年'], ['近日点', '0.89 AU(1997 年 4 月 1 日)'], ['彗核', '直径约 60 km(大彗核)'], ['1997 年', '肉眼可见约 18 个月,20 世纪最壮观的彗星之一'], ['轨道', 'JPL SBDB 根数 · 二体外推(近似)']], 11.3)
  );

  var JMc = { t: NaN, v: null };
  function pos(b, d, par) {   // → three 坐标(km);卫星为母星位置 + 相对位置
    var el = b.el, t = jd(d);
    if (b.comet) {
      var M = 2 * Math.PI * (t - el.tp) / el.P, E = kep(M, el.e);
      return ecl2three(rot(el.a, el.e, el.i * D2R, el.O * D2R, el.w * D2R, E), AU);
    }
    if (b.parent === 'jupiter' && window.Astronomy && Astronomy.JupiterMoons) {   // 伽利略卫星:astronomy-engine 内置 L1.2 理论(更精确)
      var ms = d.getTime(); if (JMc.t !== ms) { JMc.t = ms; JMc.v = Astronomy.JupiterMoons(d); }
      var sv = JMc.v[b.id], rj = eq2three([sv.x * AU, sv.y * AU, sv.z * AU]); par = par || [0, 0, 0];
      return [par[0] + rj[0], par[1] + rj[1], par[2] + rj[2]];
    }
    // 其余卫星:平均经度按 P 推进,近点按 Pw 前进、交点按 Pn 后退(M = λ − ϖ)
    var dt = t - (el.ep || J2K), Mm = (el.M + 360 * dt / el.P - (el.Pw ? 360 * dt / (el.Pw * YR) : 0)) * D2R, Om = el.O - (el.Pn ? 360 * dt / (el.Pn * YR) : 0), vp = el.O + el.w + (el.Pw ? 360 * dt / (el.Pw * YR) : 0);
    var p = rot(el.a, el.e, el.i * D2R, Om * D2R, (vp - Om) * D2R, kep(Mm, el.e)), Bs = el.B;
    var q = [p[0] * Bs[0][0] + p[1] * Bs[1][0] + p[2] * Bs[2][0], p[0] * Bs[0][1] + p[1] * Bs[1][1] + p[2] * Bs[2][1], p[0] * Bs[0][2] + p[1] * Bs[1][2] + p[2] * Bs[2][2]];
    var r = eq2three(q); par = par || [0, 0, 0];
    return [par[0] + r[0], par[1] + r[1], par[2] + r[2]];
  }
  function orbit(b, N) {   // 彗星轨道:偏近点角按 s³ 采样,近日点附近更密
    N = N || 720; var el = b.el, a = new Float32Array(N * 3);
    for (var k = 0; k < N; k++) { var s = 2 * k / N - 1, E = Math.PI * s * s * s, v = ecl2three(rot(el.a, el.e, el.i * D2R, el.O * D2R, el.w * D2R, E), AU); a[k * 3] = v[0]; a[k * 3 + 1] = v[1]; a[k * 3 + 2] = v[2]; }
    return a;
  }
  function nextPeri(b, d) { var el = b.el, t = jd(d), n = Math.ceil((t - el.tp) / el.P), j = el.tp + n * el.P; return new Date((j - 2440587.5) * 864e5); }

  /* ---------- 程序化纹理(示意) ---------- */
  function rng(s) { return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function blot(g, W, x, y, r, c0, c1) { [-W, 0, W].forEach(function (o) { var gr = g.createRadialGradient(x + o, y, 0, x + o, y, r); gr.addColorStop(0, c0); gr.addColorStop(1, c1); g.fillStyle = gr; g.beginPath(); g.arc(x + o, y, r, 0, 7); g.fill(); }); }
  function tex(b) {
    var W = 1024, H = 512, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    var g = cv.getContext('2d'), R = rng(b.id.length * 7919 + b.id.charCodeAt(0) * 131), i, x, y;
    function base(c) { g.fillStyle = c; g.fillRect(0, 0, W, H); }
    function lines(n, col, wd, amp) { g.strokeStyle = col; g.lineCap = 'round'; for (i = 0; i < n; i++) { g.lineWidth = wd * (.4 + R()); g.beginPath(); var x0 = R() * W, y0 = H * (.12 + R() * .76), ang = R() * Math.PI, len = 120 + R() * 420, ph = R() * 6; for (var k = 0; k <= 30; k++) { var u = k / 30, px = x0 + Math.cos(ang) * len * u, py = y0 + Math.sin(ang) * len * u * .5 + Math.sin(u * 6 + ph) * amp; k ? g.lineTo(px, py) : g.moveTo(px, py); } g.stroke(); } }
    function craters(n, rmax, light, dark) { for (i = 0; i < n; i++) { x = R() * W; y = H * (.06 + R() * .88); var r = 1 + Math.pow(R(), 3) * rmax; blot(g, W, x, y, r * 2.2, light, 'rgba(0,0,0,0)'); g.fillStyle = dark; g.beginPath(); g.arc(x, y, r * .55, 0, 7); g.fill(); } }
    if (b.id === 'io') {
      base('#d8bf55');
      for (i = 0; i < 140; i++) blot(g, W, R() * W, R() * H, 10 + R() * 70, ['rgba(240,225,150,.55)', 'rgba(200,120,50,.45)', 'rgba(250,250,230,.45)', 'rgba(150,120,60,.4)'][i % 4], 'rgba(0,0,0,0)');
      g.fillStyle = 'rgba(120,80,40,.35)'; g.fillRect(0, 0, W, H * .1); g.fillRect(0, H * .9, W, H * .1);
      for (i = 0; i < 70; i++) { x = R() * W; y = H * (.15 + R() * .7); blot(g, W, x, y, 8 + R() * 22, 'rgba(200,70,30,.6)', 'rgba(0,0,0,0)'); g.fillStyle = 'rgba(25,15,10,.9)'; g.beginPath(); g.arc(x, y, 1.5 + R() * 4, 0, 7); g.fill(); }
    } else if (b.id === 'europa') {
      base('#e3d8c2');
      for (i = 0; i < 60; i++) blot(g, W, R() * W, R() * H, 20 + R() * 80, 'rgba(190,160,120,.25)', 'rgba(0,0,0,0)');
      lines(160, 'rgba(140,85,50,.55)', 2.2, 18); lines(80, 'rgba(110,60,35,.4)', 4, 40);
    } else if (b.id === 'ganymede') {
      base('#a89e90');
      for (i = 0; i < 40; i++) blot(g, W, R() * W, H * (.15 + R() * .7), 40 + R() * 120, 'rgba(70,62,54,.75)', 'rgba(70,62,54,0)');
      lines(220, 'rgba(210,205,195,.25)', 1.2, 6); craters(160, 6, 'rgba(240,240,235,.5)', 'rgba(240,240,235,.8)');
      g.fillStyle = 'rgba(235,235,230,.35)'; g.fillRect(0, 0, W, H * .08); g.fillRect(0, H * .92, W, H * .08);
    } else if (b.id === 'callisto') {
      base('#4d4339'); for (i = 0; i < 80; i++) blot(g, W, R() * W, R() * H, 20 + R() * 60, 'rgba(90,80,68,.35)', 'rgba(0,0,0,0)');
      craters(900, 4, 'rgba(220,215,200,.35)', 'rgba(230,225,210,.75)');
      x = W * .62; y = H * .48; for (i = 6; i > 0; i--) { g.strokeStyle = 'rgba(200,190,170,' + (.12 + .05 * i) + ')'; g.lineWidth = 3; g.beginPath(); g.arc(x, y, i * 26, 0, 7); g.stroke(); }   // 瓦尔哈拉多环盆地(示意)
    } else if (b.id === 'enceladus') {
      base('#eef2f6'); for (i = 0; i < 90; i++) blot(g, W, R() * W, R() * H * .8, 10 + R() * 50, 'rgba(190,200,212,.3)', 'rgba(0,0,0,0)');
      craters(140, 3, 'rgba(255,255,255,.2)', 'rgba(170,180,195,.5)');
      g.strokeStyle = 'rgba(70,140,190,.75)'; g.lineWidth = 3;   // 南极虎纹(四条平行裂缝)
      for (i = 0; i < 4; i++) { g.beginPath(); for (x = 0; x <= W; x += 16) { y = H * (.86 + i * .028) + Math.sin(x / W * 12 + i) * 5; x ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); }
    } else if (b.id === 'titan') {
      var gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#b98a3e'); gr.addColorStop(.2, '#d29d4b'); gr.addColorStop(.5, '#d9a654'); gr.addColorStop(.8, '#cf984a'); gr.addColorStop(1, '#a8803e');
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
      for (i = 0; i < 50; i++) blot(g, W, R() * W, H * (.3 + R() * .4), 30 + R() * 90, 'rgba(150,100,45,.18)', 'rgba(0,0,0,0)');
    } else if (b.comet) {   // C2.2e 彗核:按球面方向烘焙 3D 噪声(无极点拉伸/接缝);深灰偏暖,尘埃平原较亮、崖面较暗,少量裸露冰斑。
      // 实际反照率仅 4–6%(罗塞塔实测),这里按 OSIRIS 公开图像的拉伸曝光呈现,否则肉眼几乎全黑
      var cw = 512, ch = 256, ci = g.createImageData(cw, ch), cd = ci.data, sd = 0; for (i = 0; i < b.id.length; i++) sd += b.id.charCodeAt(i) * (i + 1);
      for (y = 0; y < ch; y++) { var th = (y + .5) / ch * Math.PI, st = Math.sin(th), ct = Math.cos(th);
        for (x = 0; x < cw; x++) { var ph = (x + .5) / cw * 2 * Math.PI, dx = -Math.cos(ph) * st, dz = Math.sin(ph) * st;
          var a = fbm(dx * 2.2, ct * 2.2, dz * 2.2, sd + 40, 4), f = fbm(dx * 12, ct * 12, dz * 12, sd + 50, 3), ice = fbm(dx * 7, ct * 7, dz * 7, sd + 60, 2);
          var v = 140 + a * 55 + f * 28, k = (y * cw + x) * 4; if (ice > .5) v = Math.min(205, v + (ice - .5) * 420);
          cd[k] = v * 1.03; cd[k + 1] = v; cd[k + 2] = v * .94; cd[k + 3] = 255; } }
      g.putImageData(ci, 0, 0); g.drawImage(cv, 0, 0, cw, ch, 0, 0, W, H);
    } else base(b.col);
    var im = g.getImageData(0, 0, W, H), dd = im.data;   // 细颗粒噪声
    for (i = 0; i < dd.length; i += 4) { var n = (R() - .5) * 14; dd[i] += n; dd[i + 1] += n; dd[i + 2] += n; }
    g.putImageData(im, 0, 0); return cv;
  }

  /* ---------- 彗核 / 彗发 / 彗尾 ---------- */
  /* C2.2e:彗核改为高分辨率「带索引」球面 + 3D 噪声位移(平滑法线,不再是低多边形折面)。
     形态参照罗塞塔号 67P 实拍:不规则外形、陡崖与台地、浅坑、巨砾;各彗星按 id 取不同种子。海尔-波普/哈雷无近距影像,为按观测参数的程序化模拟 */
  function h3(x, y, z, s) { var n = Math.sin(x * 127.1 + y * 311.7 + z * 74.7 + s * 19.19) * 43758.5453; return n - Math.floor(n); }
  function vn(x, y, z, s) {
    var xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), xf = x - xi, yf = y - yi, zf = z - zi;
    var u = xf * xf * (3 - 2 * xf), w = yf * yf * (3 - 2 * yf), t = zf * zf * (3 - 2 * zf);
    function L(a, b, f) { return a + (b - a) * f; }
    return L(L(L(h3(xi, yi, zi, s), h3(xi + 1, yi, zi, s), u), L(h3(xi, yi + 1, zi, s), h3(xi + 1, yi + 1, zi, s), u), w),
             L(L(h3(xi, yi, zi + 1, s), h3(xi + 1, yi, zi + 1, s), u), L(h3(xi, yi + 1, zi + 1, s), h3(xi + 1, yi + 1, zi + 1, s), u), w), t) * 2 - 1;
  }
  function fbm(x, y, z, s, o) { var a = 0, m = .5, f = 1; for (var i = 0; i < o; i++) { a += m * vn(x * f, y * f, z * f, s + i * 7); f *= 2.03; m *= .5; } return a; }
  function nucleus(T, b) {
    var mob = Math.min(screen.width, screen.height) < 700, geo = new T.SphereGeometry(1, mob ? 120 : 200, mob ? 80 : 130), p = geo.attributes.position, v = new T.Vector3(), lobe = b.el.lobe;
    var ex = b.id === 'halley' ? 1.45 : lobe ? 1 : 1.12;   // 哈雷彗核为花生形约 15×8 km(乔托号 1986 实拍);海尔-波普未近距观测,取轻度拉长
    var sd = 0; for (var c = 0; c < b.id.length; c++) sd += b.id.charCodeAt(c) * (c + 1); var R = rng(sd * 977 + 13), cr = [];
    for (var c2 = 0; c2 < 34; c2++) { var cz = R() * 2 - 1, ca = R() * 6.283, cs = Math.sqrt(1 - cz * cz); cr.push([cs * Math.cos(ca), cs * Math.sin(ca), cz, .05 + Math.pow(R(), 2) * .22, .25 + R() * .5]); }
    for (var k = 0; k < p.count; k++) {
      v.fromBufferAttribute(p, k).normalize();
      var n = 1 + .28 * fbm(v.x * 1.3, v.y * 1.3, v.z * 1.3, sd, 3);                        // 大尺度不规则外形
      var rdg = 1 - Math.abs(fbm(v.x * 3.2 + 5, v.y * 3.2, v.z * 3.2, sd + 3, 3)); n += .07 * rdg * rdg;   // 陡崖/台地(脊状噪声)
      n += .025 * fbm(v.x * 9, v.y * 9, v.z * 9, sd + 9, 3) + .008 * fbm(v.x * 30, v.y * 30, v.z * 30, sd + 21, 2);   // 粗糙表面与巨砾
      for (var j = 0; j < cr.length; j++) { var q = cr[j], dd = 1 - (v.x * q[0] + v.y * q[1] + v.z * q[2]); if (dd < q[3] * q[3] * 1.6) { var r2 = dd / (q[3] * q[3] * .5); n += r2 < 1 ? -q[4] * q[3] * .35 * (1 - r2) : q[4] * q[3] * .08 * Math.max(0, 1 - (r2 - 1) / 2.2); } }   // 浅坑(彗核坑多为塌陷坑,较浅)
      if (lobe) { var ax = Math.abs(v.x); n *= (v.x > 0 ? 1 : .8) * (.5 + .5 * Math.pow(ax, .45)) + .08; }   // 双瓣(67P)
      v.multiplyScalar(b.R * n); v.x *= ex; v.y /= Math.sqrt(ex); v.z /= Math.sqrt(ex); p.setXYZ(k, v.x, v.y, v.z);
    }
    geo.computeVertexNormals();
    var nm = geo.attributes.normal, ws = geo.parameters.widthSegments, hs = geo.parameters.heightSegments, W1 = ws + 1, t3 = new T.Vector3(), t4 = new T.Vector3();
    for (var r = 0; r <= hs; r++) { var i0 = r * W1, i1 = r * W1 + ws; t3.fromBufferAttribute(nm, i0).add(t4.fromBufferAttribute(nm, i1)).normalize(); nm.setXYZ(i0, t3.x, t3.y, t3.z); nm.setXYZ(i1, t3.x, t3.y, t3.z); }   // 接缝法线取平均
    [0, hs].forEach(function (r) { t3.set(0, 0, 0); for (var c = 0; c <= ws; c++) t3.add(t4.fromBufferAttribute(nm, r * W1 + c)); t3.normalize(); for (c = 0; c <= ws; c++) nm.setXYZ(r * W1 + c, t3.x, t3.y, t3.z); });   // 两极
    nm.needsUpdate = true; return geo;
  }
  function tier() { var mob = Math.min(screen.width, screen.height) < 700 || (navigator.deviceMemory && navigator.deviceMemory < 4); return mob ? 600 : (navigator.hardwareConcurrency || 4) >= 8 ? 2400 : 1400; }
  function glow(T) {
    var c = document.createElement('canvas'); c.width = c.height = 128; var x = c.getContext('2d'), gr = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.15, 'rgba(220,240,255,.7)'); gr.addColorStop(.45, 'rgba(150,200,255,.18)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = gr; x.fillRect(0, 0, 128, 128); return new T.CanvasTexture(c);
  }
  var GT = null;
  function cometFx(T, b, g) {
    GT = GT || glow(T);
    var dpr = Math.min(1.5, window.devicePixelRatio || 1), N = tier(), R = rng(b.id.charCodeAt(0) * 977);
    function tail(col, sz) {
      var geo = new T.BufferGeometry(), P = new Float32Array(N * 3), C = new Float32Array(N * 3), S = new Float32Array(N * 4);
      for (var k = 0; k < N; k++) { var a = R() * 6.2832, r = Math.sqrt(R()); S[k * 4] = R(); S[k * 4 + 1] = Math.cos(a) * r; S[k * 4 + 2] = Math.sin(a) * r; S[k * 4 + 3] = .6 + R() * .4; }
      geo.setAttribute('position', new T.BufferAttribute(P, 3)); geo.setAttribute('color', new T.BufferAttribute(C, 3));
      var m = new T.Points(geo, new T.PointsMaterial({ map: GT, size: sz * dpr, sizeAttenuation: false, vertexColors: true, transparent: true, depthWrite: false, blending: T.AdditiveBlending }));
      m.frustumCulled = false; g.add(m); return { m: m, P: P, C: C, S: S, col: col };
    }
    var coma = new T.Sprite(new T.SpriteMaterial({ map: GT, color: 0xcfe6ff, blending: T.AdditiveBlending, transparent: true, depthWrite: false, opacity: .55 }));
    g.add(coma);
    var pg = new T.BufferGeometry(); pg.setAttribute('position', new T.BufferAttribute(new Float32Array(3), 3));
    var pt = new T.Points(pg, new T.PointsMaterial({ map: GT, color: 0xdcecff, size: 9 * dpr, sizeAttenuation: false, transparent: true, depthWrite: false, blending: T.AdditiveBlending }));
    pt.frustumCulled = false; g.add(pt);
    b.cf = { ion: tail([.5, .75, 1], 3.6), dust: tail([1, .86, .56], 4.2), coma: coma, pt: pt, t: 0, N: N };
  }
  function activity(rau) { return Math.max(0, Math.min(1, (4 - rau) / 3.4)); }
  function update(b, sun, dt, still) {
    var f = b.cf; if (!f || !b.wp) return;
    var ux = b.wp[0] - sun[0], uy = b.wp[1] - sun[1], uz = b.wp[2] - sun[2], rs = Math.hypot(ux, uy, uz), act = activity(rs / AU);
    b.rau = rs / AU; b.act = act;
    f.coma.visible = f.ion.m.visible = f.dust.m.visible = act > 0.01; f.pt.material.opacity = .35 + .65 * act;
    if (act <= 0.01) return;
    ux /= rs; uy /= rs; uz /= rs;
    var vx = b.v[0], vy = b.v[1], vz = b.v[2], vu = vx * ux + vy * uy + vz * uz; vx -= vu * ux; vy -= vu * uy; vz -= vu * uz;   // 速度垂直于背日方向的分量
    var vl = Math.hypot(vx, vy, vz) || 1; vx /= vl; vy /= vl; vz /= vl;
    var wx = uy * vz - uz * vy, wy = uz * vx - ux * vz, wz = ux * vy - uy * vx;   // 第三轴
    var Lr = b.Lmax * Math.pow(act, 1.3), comaR = Math.min(Lr * .01, 5e4) + b.R * 40;
    f.coma.scale.setScalar(comaR * 2);
    if (!still) f.t += dt;
    [[f.ion, Lr, .012, 0, .11], [f.dust, Lr * .6, .07, .45, .035]].forEach(function (c) {
      var T0 = c[0], L = c[1], spr = c[2], bend = c[3], spd = c[4], P = T0.P, C = T0.C, S = T0.S, col = T0.col;
      for (var k = 0; k < f.N; k++) {
        var t = (S[k * 4] + f.t * spd * (.6 + S[k * 4 + 3])) % 1, tt = Math.pow(t, 1.6), a = tt * L, sp = (spr * a + comaR * .3) * (1 - .3 * t), bb = -bend * L * tt * tt;
        var o1 = S[k * 4 + 1] * sp, o2 = S[k * 4 + 2] * sp;
        P[k * 3] = ux * a + vx * (bb + o1) + wx * o2; P[k * 3 + 1] = uy * a + vy * (bb + o1) + wy * o2; P[k * 3 + 2] = uz * a + vz * (bb + o1) + wz * o2;
        var br = Math.min(1, Math.pow(1 - t, 1.2) * act * S[k * 4 + 3] * 1.5);
        C[k * 3] = col[0] * br; C[k * 3 + 1] = col[1] * br; C[k * 3 + 2] = col[2] * br;
      }
      T0.m.geometry.attributes.position.needsUpdate = true; T0.m.geometry.attributes.color.needsUpdate = true;
    });
  }

  var IMG = { io: 'x/tex/moon-io.jpg', europa: 'x/tex/moon-europa.jpg', ganymede: 'x/tex/moon-ganymede.jpg', callisto: 'x/tex/moon-callisto.jpg', enceladus: 'x/tex/moon-enceladus.jpg' };
  window.SHXB = { img: IMG, list: L, pos: pos, orbit: orbit, tex: tex, nucleus: nucleus, cometFx: cometFx, update: update, nextPeri: nextPeri, activity: activity, jd: jd };
})();
/* 抵达卫星/彗星后,在引擎现象解读屏收起之后补一张天体讲解卡 */
(function () {
  function hook(ev, a) {
    if (ev !== 'arrive' || !a || !a.ex || !window.SHXE || !SHXE.ex[a.ex]) return;
    var n = 0; (function go() { if (!window.SHXC || !SHXC.isOpen() || SHXC.state().target !== a.id) return; if (SHXE.cur() && n++ < 40) { setTimeout(go, 1000); return; } SHXE.show(a.ex); })();
  }
  (function wait(n) { if (window.SHXC && SHXC.on) { SHXC.on(function (ev, a) { if (ev === 'arrive') setTimeout(function () { hook(ev, a); }, 2600); }); return; } if (n < 100) setTimeout(function () { wait(n + 1); }, 100); })(0);
})();
