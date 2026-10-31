/* 天枢 Starhelm 2.0 · C2.13b 星系世界模板 · 首个 G 星系:仙女座 M31(SHXGW)
 * 依据《天枢 银河与宇宙世界层总体设计 v1.0》6.4 节「星系世界模板」;首批 M31 → LMC → M87 → M51(王磊 10-30 13:53 确认)。
 * - 从本星系群 L0(sh-x-lg.js)仙女座卡片「进入星系世界」进入;独立全屏视图,自带 three 渲染器(r186 与 ?three=169 通用)。
 * - 星系本体全部是 3D 粒子(王磊 10-30 渲染标准:禁平面贴图 / billboard):局部坐标盘面在 xz 平面,单位千光年。
 *   M31:金色核球 + 双核(P1 / P2,哈勃 1993 发现;P2 旁有约 1.4 亿太阳质量黑洞)+ 内环(约 1.5 kpc,疑与 M32 穿盘有关)
 *   + 10 kpc 尘埃环(约 3.3 万光年,斯皮策红外最醒目)+ 紧绕旋臂碎段 + NGC 206 蓝色星云 + 恒星晕 + M32 / M110 + 巨型南方星流。
 * - 区域世界(双名):G-M31-1 双核之心 · G-M31-2 火环 · G-M31-3 NGC 206 · G-M31-4 伴星与星流;每个有核心问题与讲解。
 * - 回望银河:按真实方向(由 SHXLG.geo 给出的 M31 位置与盘面朝向换算)在 254 万光年外画出银河系,并标「你看到的是 254 万年前的银河」。
 * - 无 WebGL 时不进入(按钮提示);减少动态时相机直接切换。Esc / × 回本星系群。深链 ?view=gw。
 * - 数字为约数:距离 254 万光年(NASA)、倾角 77°、10 kpc 环、NGC 206 约 4,000 光年宽、M32 投影距中心约 2.4 万光年、巨型星流长约 40 万光年。
 */
(function () {
  'use strict';
  var D2R = Math.PI / 180, DIST = 2537;
  var T, rd, scn, cam, cv, ov, lay, card, raf = 0, open_ = false, mats = [], LBL = [], last = 0, idle = 0, TW = null, MWP = null, FOV = 55, fovT = 55;
  var C = { tx: 0, ty: 0, tz: 0, d: 260, pit: .5, yaw: -.8 };
  function rm() { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } }
  function small() { return Math.min(screen.width, screen.height) < 700 || innerWidth <= 760; }
  function rnd(s) { return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
  function gs(R) { var u = R() || 1e-9, v = R(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(6.2831853 * v); }

  /* ---------- 结构(千光年) ---------- */
  var RG = 76, NGC206 = [-38, 0, -14], M32 = [6, 3.5, -16], M110 = [-24, -8, 30];
  var RW = [
    { id: 'G-M31-1', im: '双核之心', zh: '核球与双核', t: [.0008, 0, 0], d: .03, pit: .6, yaw: -.6, q: '一个星系为什么有两个核?', q2: '仙女座的超大质量黑洞有多重?',
      land: '哈勃在 1993 年发现仙女座中心有两个亮核:较亮的 P1 是绕黑洞偏心运动的老年恒星盘的远心点堆积,P2 里藏着约 1.4 亿倍太阳质量的黑洞和一团蓝色年轻星团。两核相距约 5 光年。', tag: ['已证实', '偏心盘模型为主流解释(推测)'] },
    { id: 'G-M31-2', im: '火环', zh: '10 kpc 尘埃环', t: [0, 0, 0], d: 110, pit: 1.05, yaw: -.4, q: '仙女座为什么更像一个环?', q2: '环是怎么来的?',
      land: '红外里仙女座最醒目的是距中心约 3.3 万光年的尘埃环,恒星形成大多在这里。它和中心附近一个偏心小环,可能是约 2–4 亿年前 M32 穿过盘面激起的涟漪。', tag: ['环结构已证实', 'M32 撞击成因(推测)'] },
    { id: 'G-M31-3', im: '蓝色星云', zh: 'NGC 206', t: NGC206, d: 14, pit: .7, yaw: .4, q: '恒星在哪里成群诞生?', q2: '为什么这片星云是蓝的?',
      land: 'NGC 206 是仙女座最亮的星协,宽约 4,000 光年,挤满上千万年内诞生的炽热蓝色恒星,在旋臂尘埃缝隙里透出光来。', tag: ['已证实'] },
    { id: 'G-M31-4', im: '伴星与星流', zh: 'M32 · M110 · 巨型南方星流', t: [-20, -40, -80], d: 420, pit: .35, yaw: -1.3, q: '大星系怎样吃掉小星系?', q2: 'M32 是被剥光的旋涡星系吗?',
      land: '致密椭圆 M32 紧贴盘面南侧,矮椭圆 M110 在西北。盘南方拖出一条长约 40 万光年的巨型恒星流,是约 20 亿年前一个较大伴星系被撕碎的残迹;有研究认为 M32 就是那个星系剩下的核心。', tag: ['星流已证实', 'M32 为残核(猜想)'] }
  ];

  function gen(sf) {
    var R = rnd(31337), P = [], Cc = [], S = [], DP = [], DS = [], k, i;
    function put(x, y, z, r, g, b, s) { P.push(x, y, z); Cc.push(r, g, b); S.push(s); }
    function dust(x, y, z, s) { DP.push(x, y, z); DS.push(s); }
    var N = Math.round(260000 * sf), tp = Math.tan(7 * D2R);
    // 核球:金色 3D 椭球
    for (k = 0; k < N * .16; k++) { var rb = Math.abs(gs(R)) * RG * .055, th = R() * 6.283, ph = Math.acos(2 * R() - 1); put(rb * Math.sin(ph) * Math.cos(th), rb * Math.cos(ph) * .7, rb * Math.sin(ph) * Math.sin(th), .95, .78 + R() * .08, .5 + R() * .1, .03 + rb * .012 + R() * .03); }
    // 双核:P1(偏心盘远心点,老年红黄)、P2(中心 + 蓝色年轻星团)
    for (k = 0; k < N * .012; k++) { put(.0016 + gs(R) * .0011, gs(R) * .0006, gs(R) * .0009, 1, .8, .55, .0012 + R() * .001); }
    for (k = 0; k < N * .008; k++) { put(gs(R) * .0008, gs(R) * .0005, gs(R) * .0008, .7, .8, 1, .001 + R() * .0008); }
    for (k = 0; k < N * .02; k++) { var rn = Math.abs(gs(R)) * .02; var tn = R() * 6.283; put(rn * Math.cos(tn) + .0006, gs(R) * .004, rn * Math.sin(tn) * .8, .9, .75, .55, .003 + R() * .003); }
    // 内环(偏心,约 1.5 kpc ≈ 5 千光年)
    for (k = 0; k < N * .025; k++) { var ti = R() * 6.283, ri = 4.9 * (1 + gs(R) * .12) + .8 * Math.sin(ti * 2 + 1); put(ri * Math.cos(ti) + .8, gs(R) * .08, ri * Math.sin(ti) * .78 - .4, .75, .6, .55, .04 + R() * .04); if (R() < .5) dust(ri * .99 * Math.cos(ti) + .8, gs(R) * .05, ri * .99 * Math.sin(ti) * .78 - .4, .3); }
    // 10 kpc 尘埃环(约 33 千光年):蓝白年轻星 + 粉色电离氢区 + 吸收尘
    for (k = 0; k < N * .2; k++) { var t2 = R() * 6.283, r2 = 33 * (1 + gs(R) * .08) + 2.5 * Math.sin(t2 * 3) + 1.5 * Math.sin(t2 * 7 + 2), cl = R() < .07; var x = r2 * Math.cos(t2), z = r2 * Math.sin(t2);
      put(x, gs(R) * .35, z, cl ? 1 : .6 + R() * .1, cl ? .42 : .72 + R() * .06, cl ? .7 : 1, cl ? .25 : .14 + R() * .14); if (R() < .6) dust(x * .985 + gs(R) * .4, gs(R) * .25, z * .985 + gs(R) * .4, .6 + R() * .7); }
    // 紧绕旋臂碎段 + 老年盘
    var rest = N * .42;
    for (k = 0; k < rest; k++) {
      var r = Math.min(RG, -Math.log(1 - R() * .985) * RG * .24 + 3), arm = R() < .55, t;
      t = arm ? Math.log(r / 4) / tp + Math.floor(R() * 2) * Math.PI + gs(R) * .17 : R() * 6.283;
      var fr = r / RG, xx = r * Math.cos(t), zz = r * Math.sin(t), yy = gs(R) * (.3 + .9 * fr), young = arm && R() < .45 && r > 14;
      put(xx, yy, zz, young ? .62 : .9 - fr * .2, young ? .74 : .82 - fr * .1, young ? 1 : .65 + fr * .25, young ? .12 + R() * .1 : .09 + R() * .09);
      if (arm && r > 10 && R() < .3) dust(r * Math.cos(t - .04), gs(R) * .25, r * Math.sin(t - .04), .5 + R() * .6);
    }
    // NGC 206:蓝色星协(约 4 千光年宽)
    for (k = 0; k < N * .03; k++) { put(NGC206[0] + gs(R) * 1.2, NGC206[1] + gs(R) * .3, NGC206[2] + gs(R) * .9, .55 + R() * .1, .7 + R() * .1, 1, .05 + R() * .07); }
    for (k = 0; k < N * .006; k++) { put(NGC206[0] + gs(R) * 1.5, NGC206[1] + gs(R) * .3, NGC206[2] + gs(R) * 1.2, 1, .4, .7, .07); }
    // 弥散盘光(大而淡,给体积感)
    for (k = 0; k < N * .05; k++) { var rd2 = Math.min(RG, -Math.log(1 - R() * .97) * RG * .22), td = R() * 6.283, f2 = rd2 / RG; put(rd2 * Math.cos(td), gs(R) * (.6 + 2.2 * (1 - f2)), rd2 * Math.sin(td), .14 - f2 * .05, .12 - f2 * .03, .1 + f2 * .03, 2.4 - f2 * 1.2); }
    // 恒星晕(半径约 15 万光年以上的稀薄球)
    for (k = 0; k < N * .03; k++) { var rh = Math.abs(gs(R)) * 55, th2 = R() * 6.283, ph2 = Math.acos(2 * R() - 1); put(rh * Math.sin(ph2) * Math.cos(th2), rh * Math.cos(ph2) * .7, rh * Math.sin(ph2) * Math.sin(th2), .5, .45, .4, .2 + R() * .3); }
    // M32(致密椭圆)与 M110(矮椭圆)
    function ell(c, Rr, n, q) { for (var j = 0; j < n; j++) { var su = Math.sqrt(R() * .97), rr = Rr * .25 * su / (1 - su), a = R() * 6.283, b = Math.acos(2 * R() - 1); put(c[0] + rr * Math.sin(b) * Math.cos(a), c[1] + rr * Math.cos(b) * q, c[2] + rr * Math.sin(b) * Math.sin(a), 1, .84, .62, .05 + R() * .08); } }
    ell(M32, 2.2, N * .025, .8); ell(M110, 6, N * .03, .55);
    // 巨型南方星流:从盘南缘向前下方拖出约 40 万光年的弧
    for (k = 0; k < N * .04; k++) { var s = Math.pow(R(), .8), w = 3 + s * 14; put(-6 - s * 60 + gs(R) * w, -10 - s * 120 + gs(R) * w * .6, -20 - s * 260 + gs(R) * w, .75, .65, .55, .5 + R() * .7); }
    return { P: new Float32Array(P), C: new Float32Array(Cc), S: new Float32Array(S), DP: new Float32Array(DP), DS: new Float32Array(DS) };
  }
  function genMW(sf) {   // 回望用的远方银河:棒旋 4 臂(小粒子数)
    var R = rnd(4242), P = [], Cc = [], S = [], N = Math.round(40000 * sf), tp = Math.tan(13 * D2R);
    for (var k = 0; k < N; k++) {
      var m = R(), x, y, z, c;
      if (m < .15) { var rb = Math.abs(gs(R)) * 4; x = gs(R) * 3.5; z = gs(R) * 1.2; y = gs(R) * 1; c = [1, .82, .55]; }
      else { var r = Math.min(50, -Math.log(1 - R() * .98) * 12 + 2), t = Math.log(r / 4) / tp + Math.floor(R() * 4) * 1.5708 + gs(R) * .2; x = r * Math.cos(t); z = r * Math.sin(t); y = gs(R) * .4; c = R() < .5 ? [.65, .75, 1] : [.95, .88, .75]; }
      P.push(x, y, z); Cc.push(c[0], c[1], c[2]); S.push(.6 + R() * .6);
    }
    return { P: new Float32Array(P), C: new Float32Array(Cc), S: new Float32Array(S) };
  }

  var VS = 'attribute float aS;attribute vec3 aC;varying vec3 vC;varying float vA;uniform float uK,uB,uM;void main(){vec4 mv=modelViewMatrix*vec4(position,1.0);float s=aS*uK/max(-mv.z,1e-4);vA=clamp(s*.7,0.35,1.0)*uB*clamp(uM/max(s,1.0)*1.5,.25,1.0);gl_PointSize=clamp(s,1.0,uM);vC=aC;gl_Position=projectionMatrix*mv;}';
  var FS = 'precision mediump float;varying vec3 vC;varying float vA;void main(){vec2 d=gl_PointCoord-.5;float r=dot(d,d)*4.0;if(r>1.0)discard;gl_FragColor=vec4(vC*exp(-r*3.0)*vA,1.0);}';
  var FSD = 'precision mediump float;varying vec3 vC;varying float vA;void main(){vec2 d=gl_PointCoord-.5;float r=dot(d,d)*4.0;if(r>1.0)discard;gl_FragColor=vec4(.035,.022,.016,(1.0-r)*(1.0-r)*.5*vA);}';
  function pts(Pp, Cp, Sp, dust, uB, uM) {
    var g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(Pp, 3)); g.setAttribute('aC', new T.BufferAttribute(Cp || new Float32Array(Pp.length), 3)); g.setAttribute('aS', new T.BufferAttribute(Sp, 1));
    var m = new T.ShaderMaterial({ vertexShader: VS, fragmentShader: dust ? FSD : FS, transparent: true, depthWrite: false, depthTest: false, blending: dust ? T.NormalBlending : T.AdditiveBlending, uniforms: { uK: { value: 600 }, uB: { value: uB }, uM: { value: uM } } });
    var o = new T.Points(g, m); o.frustumCulled = false; mats.push(m); if (dust) o.renderOrder = 2; return o;
  }
  function mwDir() {   // 从 M31 看银河的方向(M31 局部坐标)
    try {
      var G = window.SHXLG && SHXLG.geo && SHXLG.geo('M31'); if (!G) return null;
      var q = new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), new T.Vector3(G.n[0], G.n[1], G.n[2])).multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 1, 0), G.spin || 0));
      var v = new T.Vector3(-G.p[0], -G.p[1], -G.p[2]).normalize().applyQuaternion(q.invert()); return [v.x, v.y, v.z];
    } catch (e) { return null; }
  }
  function build() {
    T = window.THREE; if (!T || !T.WebGLRenderer) return false;
    try { rd = new T.WebGLRenderer({ canvas: cv, antialias: false, alpha: false, powerPreference: 'high-performance' }); } catch (e) { rd = null; return false; }
    rd.setPixelRatio(Math.min(devicePixelRatio || 1, small() ? 1.25 : 1.5)); rd.setClearColor(0x010208, 1);
    scn = new T.Scene(); cam = new T.PerspectiveCamera(FOV, 1, .001, 1e4); mats = [];
    var sf = small() ? .25 : 1, b = gen(sf);
    scn.add(pts(b.P, b.C, b.S, false, .5, 26)); scn.add(pts(b.DP, null, b.DS, true, 1, 60));
    var d = mwDir() || [.3, -.2, .93]; MWP = [d[0] * DIST, d[1] * DIST, d[2] * DIST];
    var mw = genMW(sf), mo = pts(mw.P, mw.C, mw.S, false, .9, 6); mo.position.set(MWP[0], MWP[1], MWP[2]); mo.rotation.set(.9, .3, .4); scn.add(mo);
    var bp = [], bc = [], bs = [], R2 = rnd(77);
    for (var k = 0; k < (small() ? 1500 : 5000); k++) { var th = R2() * 6.283, ph = Math.acos(2 * R2() - 1), rr = 5000 + R2() * 3000; bp.push(rr * Math.sin(ph) * Math.cos(th), rr * Math.cos(ph), rr * Math.sin(ph) * Math.sin(th)); var w = R2(); bc.push(.8 + w * .2, .78, .75 + (1 - w) * .25); bs.push(4 + R2() * 8); }
    scn.add(pts(new Float32Array(bp), new Float32Array(bc), new Float32Array(bs), false, .3, 2.5));
    return true;
  }

  /* ---------- DOM ---------- */
  function css() {
    if (document.getElementById('xgw-css')) return; var s = document.createElement('style'); s.id = 'xgw-css';
    s.textContent = '#xgw{position:fixed;inset:0;z-index:2102;background:#010208;color:#dfe9f7;font:13px/1.5 "Noto Sans SC",system-ui,"PingFang SC","Microsoft YaHei",sans-serif;opacity:0;transition:opacity .6s;touch-action:none;user-select:none;-webkit-user-select:none}#xgw.on{opacity:1}#xgw:not(.on){pointer-events:none}body.xgw-on #shx-badge{display:none!important}' +
      '#xgw canvas{position:absolute;inset:0;width:100%;height:100%;display:block;cursor:grab}#xgw .hd{position:absolute;left:18px;top:14px;right:70px;pointer-events:none}#xgw .hd .k{font-size:11px;letter-spacing:.18em;color:#7fd6ff}#xgw .hd h2{margin:2px 0;font-size:22px;font-weight:600}#xgw .hd h2 small{font-size:12px;color:#9fb3cf;margin-left:8px;letter-spacing:.14em;font-weight:400}#xgw .hd p{margin:0;color:#b8c6dc;font-size:12px}' +
      '#xgw .rd{display:inline-block;margin-top:6px;padding:3px 10px;border:1px solid rgba(127,214,255,.35);border-radius:10px;background:rgba(4,10,24,.6);color:#bfe6ff;font-size:12px}#xgw .x{position:absolute;right:16px;top:12px;width:36px;height:36px;border-radius:50%;border:1px solid rgba(255,255,255,.25);background:rgba(10,16,32,.6);color:#fff;font-size:18px;cursor:pointer;z-index:5}' +
      '#xgw .bar{position:absolute;left:50%;bottom:14px;transform:translateX(-50%);display:flex;gap:6px;flex-wrap:wrap;justify-content:center;max-width:94vw;z-index:4}#xgw .bar button{padding:6px 12px;border-radius:14px;border:1px solid rgba(255,255,255,.22);background:rgba(8,14,30,.72);color:#dfe9f7;font:inherit;font-size:12px;cursor:pointer}#xgw .bar button.on{border-color:#f0c97a;color:#f0c97a}#xgw .bar button.bk{border-color:rgba(184,168,255,.6);color:#d8ccff}' +
      '#xgw .lay{position:absolute;inset:0;pointer-events:none;z-index:3}#xgw .m{position:absolute;left:0;top:0;white-space:nowrap;font-size:12px;pointer-events:auto;cursor:pointer;text-shadow:0 0 4px #000,0 0 8px #000}#xgw .m:before{content:"";display:inline-block;width:6px;height:6px;border-radius:50%;background:currentColor;margin-right:5px;vertical-align:1px;box-shadow:0 0 6px currentColor}#xgw .m small{color:#9fb3cf;margin-left:4px}' +
      '#xgw .cd{position:absolute;left:16px;top:120px;width:310px;max-width:calc(100vw - 32px);max-height:calc(100vh - 200px);overflow:auto;padding:14px 16px;border-radius:14px;border:1px solid rgba(127,214,255,.3);background:rgba(6,12,28,.88);backdrop-filter:blur(6px);z-index:5}#xgw .cd h3{margin:0 0 2px;font-size:17px}#xgw .cd .ty{color:#9fb3cf;font-size:12px}#xgw .cd .q{margin:8px 0;padding:6px 10px;border-radius:10px;background:rgba(240,201,122,.1);color:#f6dfa9}' +
      '#xgw .cd .c{position:absolute;right:8px;top:6px;border:0;background:none;color:#fff;font-size:18px;cursor:pointer}#xgw .cd .tg{display:inline-block;margin:2px 4px 0 0;padding:1px 8px;border-radius:8px;font-size:11px;border:1px solid rgba(127,214,255,.4);color:#bfe6ff}#xgw .cd .nt{color:#8ea0bb;font-size:11px;margin-top:6px}' +
      '@media (max-width:760px){#xgw .cd{top:auto;bottom:110px;left:8px;right:8px;width:auto;max-height:42vh}#xgw .hd h2{font-size:18px}}';
    document.head.appendChild(s);
  }
  function dom() {
    css(); ov = document.createElement('div'); ov.id = 'xgw'; ov.style.display = 'none'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-label', '星系世界 仙女座 M31');
    ov.innerHTML = '<canvas></canvas><div class="lay"></div><div class="hd"><div class="k">星域 VII · 星系世界 · VII·G-M31</div><h2>仙女座星系<small>ANDROMEDA · M31</small></h2><p>距太阳约 254 万光年 · 直径约 15 万光年以上 · 倾角 77° · 模拟渲染(3D 粒子,结构按观测)</p><div class="rd"></div></div>' +
      '<button class="x" type="button" aria-label="返回本星系群">×</button><div class="bar"><button type="button" data-p="all" class="on">全貌</button>' +
      RW.map(function (w, i) { return '<button type="button" data-w="' + i + '">' + w.im + '</button>'; }).join('') + '<button type="button" data-a="mw">回望银河</button><button type="button" data-a="back" class="bk">↩ 回本星系群</button></div>';
    document.body.appendChild(ov); cv = ov.querySelector('canvas'); lay = ov.querySelector('.lay');
    ov.querySelector('.x').onclick = back;
    ov.querySelectorAll('.bar button').forEach(function (b) { b.onclick = function () { mark(b); if (b.dataset.p) { closeCard(); go(0, 0, 0, 190, .5, -.8); } else if (b.dataset.w) region(+b.dataset.w); else if (b.dataset.a === 'mw') look(); else back(); }; });
    LBL = []; [['双核 P1 / P2', [0, 0, 0], '#f0c97a', 0, 3], ['10 kpc 尘埃环', [0, 0, 33], '#7fd6ff', 1, 400], ['NGC 206', NGC206, '#9fc8ff', 2, 150], ['M32', M32, '#f0c97a', 3, 500], ['M110', M110, '#f0c97a', 3, 900], ['巨型南方星流', [-40, -90, -190], '#cdb8ff', 3, 2000], ['银河系 · 254 万年前的光', null, '#f0c97a', -1, 1e5]].forEach(function (a) {
      var e = document.createElement('div'); e.className = 'm'; e.style.color = a[2]; e.textContent = a[0]; e.onclick = function (ev) { ev.stopPropagation(); if (a[3] >= 0) region(a[3]); else look(); }; lay.appendChild(e); LBL.push({ el: e, p: a[1], max: a[4], mw: a[3] < 0 });
    });
    input();
  }
  function mark(b) { ov.querySelectorAll('.bar button').forEach(function (x) { x.classList.toggle('on', x === b); }); }
  function closeCard() { if (card) { card.remove(); card = null; } }
  function go(x, y, z, d, pit, yaw, fov) { fovT = fov || 55; if (rm()) { C.tx = x; C.ty = y; C.tz = z; C.d = d; C.pit = pit; C.yaw = yaw; TW = null; return; } TW = { a: [C.tx, C.ty, C.tz, C.d, C.pit, C.yaw], b: [x, y, z, d, pit, yaw], t0: performance.now(), ms: 2000 }; idle = performance.now() + 6000; }
  function region(i) {
    var w = RW[i]; if (!w) return; closeCard(); var b = ov.querySelector('.bar button[data-w="' + i + '"]'); if (b) mark(b);
    go(w.t[0], w.t[1], w.t[2], w.d, w.pit, w.yaw);
    card = document.createElement('div'); card.className = 'cd'; card.setAttribute('role', 'dialog'); card.setAttribute('aria-label', '区域世界 ' + w.id);
    card.innerHTML = '<button class="c" type="button" aria-label="关闭">×</button><h3>' + w.id + ' · ' + w.im + '<small style="font-size:12px;color:#9fb3cf;margin-left:6px">' + w.zh + '</small></h3><div class="ty">仙女座星系 · 区域世界</div>' +
      '<div class="q">❓ ' + w.q + '<br><small style="color:#b8c6dc">' + w.q2 + '</small></div><p>' + w.land + '</p>' + w.tag.map(function (t) { return '<span class="tg">' + t + '</span>'; }).join('') +
      '<div class="nt">模拟渲染(3D 粒子),非照片;数据为约数,来源 NASA / ESA / 哈勃 / 斯皮策。</div>';
    ov.appendChild(card); card.querySelector('.c').onclick = closeCard;
  }
  function look() {   // 回望银河:相机放在 M31 盘面上方,望向 254 万光年外的银河(窄视场)
    if (!MWP) return; closeCard(); var b = ov.querySelector('.bar button[data-a="mw"]'); if (b) mark(b);
    var cp = [0, 40, 0], v = [cp[0] - MWP[0], cp[1] - MWP[1], cp[2] - MWP[2]], d = Math.hypot(v[0], v[1], v[2]);
    go(MWP[0], MWP[1], MWP[2], d, Math.asin(v[1] / d), Math.atan2(v[0], v[2]), 4);
    card = document.createElement('div'); card.className = 'cd'; card.innerHTML = '<button class="c" type="button" aria-label="关闭">×</button><h3>回望银河</h3><div class="ty">从仙女座看向家园</div><p>那一小团旋涡就是银河系,太阳系在它的一条旋臂里。你看到的是 <b>约 254 万年前</b> 发出的光 —— 那时地球上人属刚刚出现。</p><span class="tg">方向按真实位置换算</span><span class="tg">窄视场放大约 14 倍</span><div class="nt">银河外形为模拟渲染。</div>';
    ov.appendChild(card); card.querySelector('.c').onclick = closeCard;
  }
  function input() {
    var P = {};
    cv.addEventListener('pointerdown', function (e) { cv.setPointerCapture(e.pointerId); P[e.pointerId] = [e.clientX, e.clientY]; TW = null; idle = performance.now() + 6000; });
    cv.addEventListener('pointermove', function (e) {
      var p = P[e.pointerId]; if (!p) return; var ks = Object.keys(P);
      if (ks.length === 1) { var k = fovT / 55; C.yaw -= (e.clientX - p[0]) * .005 * k; C.pit = Math.max(-1.5, Math.min(1.5, C.pit + (e.clientY - p[1]) * .005 * k)); }
      else if (ks.length === 2) { var o = P[ks[0] == e.pointerId ? ks[1] : ks[0]], d0 = Math.hypot(p[0] - o[0], p[1] - o[1]), d1 = Math.hypot(e.clientX - o[0], e.clientY - o[1]); if (d0 > 0 && d1 > 0) zoom(d0 / d1); }
      P[e.pointerId] = [e.clientX, e.clientY];
    });
    function up(e) { delete P[e.pointerId]; } cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    cv.addEventListener('wheel', function (e) { e.preventDefault(); zoom(Math.exp(e.deltaY * .0012)); idle = performance.now() + 6000; }, { passive: false });
  }
  function zoom(f) { C.d = Math.max(.02, Math.min(4000, C.d * f)); }
  function camPos() { var cp = Math.cos(C.pit); return [C.tx + C.d * cp * Math.sin(C.yaw), C.ty + C.d * Math.sin(C.pit), C.tz + C.d * cp * Math.cos(C.yaw)]; }
  function size() { if (!rd) return; rd.setSize(innerWidth, innerHeight, false); cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix(); }
  function ly(k) { return k >= 10 ? (k / 10).toFixed(k >= 1000 ? 0 : 1) + ' 万光年' : Math.round(k * 1000).toLocaleString('zh-CN') + ' 光年'; }
  function frame(now) {
    raf = requestAnimationFrame(frame); if (!open_) return; var dt = Math.min(.1, (now - last) / 1000); last = now;
    if (TW) { var k = Math.min(1, (now - TW.t0) / TW.ms), e = k * k * (3 - 2 * k), L = function (a, b) { return Math.exp(Math.log(a) + (Math.log(b) - Math.log(a)) * e); }; C.tx = TW.a[0] + (TW.b[0] - TW.a[0]) * e; C.ty = TW.a[1] + (TW.b[1] - TW.a[1]) * e; C.tz = TW.a[2] + (TW.b[2] - TW.a[2]) * e; C.d = L(TW.a[3], TW.b[3]); C.pit = TW.a[4] + (TW.b[4] - TW.a[4]) * e; var dy = TW.b[5] - TW.a[5]; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); C.yaw = TW.a[5] + dy * e; if (k >= 1) TW = null; }
    else if (!rm() && now > idle && fovT > 10) C.yaw += dt * .02;
    FOV += (fovT - FOV) * Math.min(1, dt * 3); if (Math.abs(FOV - fovT) < .01) FOV = fovT;
    var p = camPos(); cam.fov = FOV; cam.position.set(p[0], p[1], p[2]); cam.near = Math.max(.0005, Math.min(C.d * .002, 5)); cam.far = Math.max(1e4, C.d * 3); cam.updateProjectionMatrix(); cam.lookAt(C.tx, C.ty, C.tz);
    var kk = innerHeight / (2 * Math.tan(FOV * D2R / 2)) * Math.min(devicePixelRatio || 1, small() ? 1.25 : 1.5); mats.forEach(function (m) { m.uniforms.uK.value = kk; });
    rd.render(scn, cam);
    LBL.forEach(function (Lb) {
      var q = Lb.mw ? MWP : Lb.p; if (!q) { Lb.el.style.display = 'none'; return; } var dd = Math.hypot(q[0] - p[0], q[1] - p[1], q[2] - p[2]);
      var v = new T.Vector3(q[0], q[1], q[2]).project(cam); if ((!Lb.mw && dd > Lb.max) || v.z > 1 || v.z < -1) { Lb.el.style.display = 'none'; return; }
      var x = (v.x + 1) / 2 * innerWidth, y = (1 - v.y) / 2 * innerHeight; if (y < 96 || y > innerHeight - 60 || x < 0 || x > innerWidth) { Lb.el.style.display = 'none'; return; }
      Lb.el.style.display = ''; Lb.el.style.transform = 'translate(' + Math.round(x) + 'px,' + Math.round(y) + 'px)';
    });
    var r = ov.querySelector('.rd'), dc = Math.hypot(p[0], p[1], p[2]);
    r.textContent = '视点距 M31 中心 ' + ly(dc) + ' · 视野约 ' + ly(C.d * 1.04 * Math.tan(FOV * D2R / 2) / Math.tan(27.5 * D2R)) + (fovT < 10 ? ' · 窄视场' : '');
  }
  function open(o) {
    o = o || {}; if (open_) return true; if (!window.THREE) return false; if (!ov) dom();
    if (!rd && !build()) return false;
    open_ = true; ov.style.display = ''; document.body.classList.add('xgw-on'); size(); closeCard();
    C.tx = 0; C.ty = 0; C.tz = 0; C.d = o.fast || rm() ? 190 : 1600; C.pit = .5; C.yaw = -.8; FOV = fovT = 55; mark(ov.querySelector('.bar button[data-p]'));
    if (!o.fast) go(0, 0, 0, 190, .5, -.8);
    last = performance.now(); idle = last + 5000; requestAnimationFrame(function () { ov.classList.add('on'); });
    addEventListener('resize', size); raf = requestAnimationFrame(frame);
    try { var u = new URL(location.href); u.searchParams.set('view', 'gw'); history.replaceState(null, '', u.pathname + u.search + u.hash); } catch (e) { }
    return true;
  }
  function close() {
    if (!open_) return; open_ = false; document.body.classList.remove('xgw-on'); cancelAnimationFrame(raf); removeEventListener('resize', size); closeCard();
    ov.classList.remove('on'); var o = ov; setTimeout(function () { if (!open_) o.style.display = 'none'; }, 600);
    if (rd) { try { rd.dispose(); if (rd.forceContextLoss) rd.forceContextLoss(); } catch (e) { } rd = null; mats = []; scn = null; var nc = cv.cloneNode(false); cv.parentNode.replaceChild(nc, cv); cv = nc; input(); }
    try { var u = new URL(location.href); if (u.searchParams.get('view') === 'gw') { u.searchParams.delete('view'); history.replaceState(null, '', u.pathname + u.search + u.hash); } } catch (e) { }
  }
  function back() {   // 回本星系群仙女座视角
    var lg = window.SHXLG; if (lg && !lg.isOpen()) lg.open(); close(); if (lg) setTimeout(function () { lg.preset('M31'); }, 80);
  }
  function enter() {   // 从本星系群进入:先开本视图再关 L0
    if (!open()) return false; var lg = window.SHXLG; if (lg && lg.isOpen()) setTimeout(function () { try { lg.close(true); } catch (e) { } }, rm() ? 200 : 650); return true;
  }
  (function w(n) { if (window.SHXESC) { SHXESC.reg('gw', 114, function () { return open_; }, function () { if (card) closeCard(); else back(); }); return; } if (n < 100) setTimeout(function () { w(n + 1); }, 100); })(0);
  try { if (/[?&]view=gw\b/.test(location.search)) (function w2(n) { if (window.THREE && window.SHXLG && document.body) { setTimeout(function () { open({ fast: 1 }); }, 600); return; } if (n < 200) setTimeout(function () { w2(n + 1); }, 100); })(0); } catch (e) { }
  window.SHXGW = { open: open, enter: enter, close: close, back: back, isOpen: function () { return open_; }, region: function (i) { if (open_) region(i); return card ? card.textContent : ''; }, look: function () { if (open_) look(); }, all: function () { if (open_) { closeCard(); go(0, 0, 0, 190, .5, -.8); } }, mw: function () { return MWP; }, worlds: function () { return RW.map(function (w) { return w.id + ' ' + w.im; }); } };
})();
