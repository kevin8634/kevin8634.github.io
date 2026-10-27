/* 天枢 Starhelm 2.0 · 穿梭 C2.1 —— 日球层穿越增强(SHXH)
 * 1) 终端激波太阳风粒子流(fg 层,船体周围 ±160 单位 ≈ 日心距离 ±6 AU 的示意尺度):
 *    每颗粒子按「飞船日心距离 + 自身径向偏移」判断位于激波哪一侧 → 激波内侧 400 km/s 径向成束、冷、稀;
 *    外侧(日鞘)速度 130→30 km/s、方向转向日球层尾部并湍动、被加热(更亮更暖)、密度 ×2.5;日球层顶外为 26 km/s 星际风(淡)。
 *    线段长度 = 速度,粒子数量 = 密度,亮度/色温 = 温度。依据:V2 PLS(Richardson 2008)、V1 LECP(Decker 2005;Krimigis 2011)。
 * 2) 日球层顶「等离子体波之声」:穿越 121.6 AU 时交给 SHXS.pws.cue()(x/audio/v1-pws-interstellar.mp3,NASA PIA17045);≥100 AU 预加载。
 * 3) 日球层外形示意(bg 层,单位 AU,真实比例):终端激波面 + 日球层顶 + 日鞘,两种模型可切换:
 *    彗星状长尾 —— Parker 1961 半无限体外形 r=R0·√(2/(1+cosθ))(θ 自鼻端起算),尾部 700 AU 外淡出;
 *    气泡/羊角状 —— 参照 Opher & Drake 2015(两瓣间尾部 ~250 AU)、Opher 等 2020「小而圆」;
 *    两模型都用 V1(94/121.6 AU)与 V2(84/119 AU)穿越点标定尺度和南北不对称(2 个参数 2 个方程,精确过点)。
 *    鼻端 = 星际中性气体来向 黄经 255.59° 黄纬 5.14°(IBEX 12 年拟合,Galli 等 2022 Space Sci Rev 综述);IBEX 丝带 中心 (219.2°, 39.9°) 半径 74.5°(Funsten 2013)。
 *    离日 >150 AU 时在主视野显示;打开「日球层 · 太阳的气泡」讲解卡时,卡内小窗从外部俯瞰(独立小渲染器,仅卡片打开时运行)。
 * 性能三档(?q=low|mid|high 可强制):粒子 2400/1400/700,外形网格 96/64/40;「减少动态」粒子静止并降到 260 颗;手机像素比 ≤1.5。
 */
(function () {
  'use strict';
  var AU = 149597870.7, EPS = 23.4392911 * Math.PI / 180, TS = 94, HP = 121.6;
  var T, X, inited = false, tier, model = 'comet', ribbonOn = true, prevR = 0, preloaded = false, fired = {};
  try { model = localStorage.getItem('gn:sh:x-helio-model') === 'croissant' ? 'croissant' : 'comet'; ribbonOn = localStorage.getItem('gn:sh:x-helio-ribbon') !== '0'; } catch (e) { }
  var MN = { comet: '彗星状长尾', croissant: '气泡 / 羊角状' };
  function reduced() { return matchMedia('(prefers-reduced-motion: reduce)').matches; }
  function sstep(a, b, x) { var t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
  function lerp(a, b, t) { return a + (b - a) * Math.max(0, Math.min(1, t)); }
  function getTier() {
    var q = (location.search.match(/[?&]q=(low|mid|high)\b/) || [])[1]; if (q) return q;
    var mob = Math.min(screen.width, screen.height) < 700 || matchMedia('(pointer:coarse)').matches;
    if (mob) return 'low';
    if ((navigator.deviceMemory && navigator.deviceMemory < 4) || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4)) return 'mid';
    return 'high';
  }
  // 方向:黄道(λ,β)/ 赤道(RA,Dec)→ three(与驾驶舱 eq2three 相同:x=黄道 x,y=黄北,z=−黄道 y)
  function ecl3(l, b) { l *= Math.PI / 180; b *= Math.PI / 180; var x = Math.cos(b) * Math.cos(l), y = Math.cos(b) * Math.sin(l), z = Math.sin(b); return [x, z, -y]; }
  function eq3(ra, de) { ra *= Math.PI / 180; de *= Math.PI / 180; var x = Math.cos(de) * Math.cos(ra), y = Math.cos(de) * Math.sin(ra), z = Math.sin(de); var ye = y * Math.cos(EPS) + z * Math.sin(EPS), ze = -y * Math.sin(EPS) + z * Math.cos(EPS); return [x, ze, -ye]; }
  function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
  function nrm(a) { var l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }
  var NOSE = ecl3(255.59, 5.14), UP0 = [0, 1, 0];
  var U = nrm([UP0[0] - NOSE[0] * dot(UP0, NOSE), UP0[1] - NOSE[1] * dot(UP0, NOSE), UP0[2] - NOSE[2] * dot(UP0, NOSE)]), V = cross(NOSE, U);
  var V1D = eq3(258.3, 12.0), V2D = eq3(299.0, -56.8);   // 旅行者 1/2 号方向(V2 为 2018–19 年约值)
  function angs(d) { var c = Math.max(-1, Math.min(1, dot(d, NOSE))), th = Math.acos(c), px = dot(d, U), py = dot(d, V); return [th, Math.atan2(py, px)]; }
  var A1 = angs(V1D), A2 = angs(V2D);

  /* ---------- 外形模型:r(θ,φ) = a · f(θ,φ) · (1 + ε·sinθ·cosφ),a、ε 由 V1/V2 穿越点解出 ---------- */
  var SH = {
    comet: { ts: function (th) { var h = (1 - Math.cos(th)) / 2; return 1 + 0.9 * Math.pow(h, 1.2); }, hp: function (th) { return Math.sqrt(2 / (1 + Math.cos(th))); }, tail: 700 },
    croissant: { ts: function (th) { var h = (1 - Math.cos(th)) / 2; return 1 + 0.5 * h; }, hp: function (th, ph) { var h = (1 - Math.cos(th)) / 2; return (1 + 0.85 * h) * (1 + 0.75 * h * h * h * Math.cos(ph) * Math.cos(ph)); }, tail: 0 }
  };
  function calib(f, r1, r2) {   // r_i = a f_i (1+ε s_i);s_i = sinθ_i cosφ_i
    var f1 = f(A1[0], A1[1]), f2 = f(A2[0], A2[1]), s1 = Math.sin(A1[0]) * Math.cos(A1[1]), s2 = Math.sin(A2[0]) * Math.cos(A2[1]);
    var q = (r1 / f1) / (r2 / f2), eps = (q - 1) / (s1 - q * s2), a = r1 / f1 / (1 + eps * s1); return { a: a, e: eps };
  }
  function surfR(m, which, th, ph) { var M = SH[m], c = M[which + 'C'], f = M[which](th, ph); return c.a * f * (1 + c.e * Math.sin(th) * Math.cos(ph)); }
  ['comet', 'croissant'].forEach(function (m) { SH[m].tsC = calib(SH[m].ts, TS, 84); SH[m].hpC = calib(SH[m].hp, HP, 119); });
  function dirOf(th, ph) { var s = Math.sin(th), c = Math.cos(th), cp = Math.cos(ph), sp = Math.sin(ph); return [c * NOSE[0] + s * (cp * U[0] + sp * V[0]), c * NOSE[1] + s * (cp * U[1] + sp * V[1]), c * NOSE[2] + s * (cp * U[2] + sp * V[2])]; }

  /* ---------- 着色器 ---------- */
  var LVS = 'attribute vec4 cl;varying vec4 vC;void main(){vC=cl;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}';
  var LFS = 'uniform float uF;varying vec4 vC;void main(){gl_FragColor=vec4(vC.rgb,vC.a*uF);}';
  var PVS = 'attribute vec4 cl;attribute float sz;varying vec4 vC;uniform float uP;void main(){vC=cl;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_PointSize=sz*uP;}';
  var PFS = 'uniform float uF;varying vec4 vC;void main(){vec2 d=gl_PointCoord-.5;float a=smoothstep(.5,.0,length(d));if(a<.02)discard;gl_FragColor=vec4(vC.rgb,vC.a*a*uF);}';
  var SVS = 'attribute float va;varying vec3 vN;varying vec3 vV;varying float vA;void main(){vA=va;vN=normalize(normalMatrix*normal);vec4 mv=modelViewMatrix*vec4(position,1.);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}';
  var SFS = 'uniform vec3 col;uniform float a0,aR,uF;varying vec3 vN;varying vec3 vV;varying float vA;void main(){float f=1.-abs(dot(normalize(vN),normalize(vV)));gl_FragColor=vec4(col,(a0+aR*f*f*f)*uF*vA);}';
  var GVS = 'attribute float va;varying float vA;void main(){vA=va;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}';
  var GFS = 'uniform vec3 col;uniform float uF,uA;varying float vA;void main(){gl_FragColor=vec4(col,uA*vA*uF);}';
  var dpr = 1;

  /* =================== 1. 太阳风粒子流 =================== */
  var FL = null, L = 160, KAU = 6 / L, CV = 0.275, TAU = 0.2;
  function buildFlow() {
    var N = reduced() ? 260 : { high: 2400, mid: 1400, low: 700 }[tier];
    var P = new Float32Array(N * 3), J = new Float32Array(N * 3), A = new Float32Array(N * 3), Bv = new Float32Array(N * 3), W = new Float32Array(N * 2), Uu = new Float32Array(N);
    function rv() { var u = Math.random() * 2 - 1, t = Math.random() * 6.2832, s = Math.sqrt(1 - u * u); return [s * Math.cos(t), s * Math.sin(t), u]; }
    for (var i = 0; i < N; i++) {
      P[i * 3] = (Math.random() * 2 - 1) * L; P[i * 3 + 1] = (Math.random() * 2 - 1) * L; P[i * 3 + 2] = (Math.random() * 2 - 1) * L;
      var j = rv(), a = rv(), b = nrm(cross(a, rv())); a = nrm(cross(b, a));
      J.set(j, i * 3); A.set(a, i * 3); Bv.set(b, i * 3); W[i * 2] = 0.4 + Math.random() * 1.4; W[i * 2 + 1] = Math.random() * 6.2832; Uu[i] = Math.random();
    }
    var lg = new T.BufferGeometry(); lg.setAttribute('position', new T.BufferAttribute(new Float32Array(N * 6), 3)); lg.setAttribute('cl', new T.BufferAttribute(new Float32Array(N * 8), 4));
    var lm = new T.ShaderMaterial({ vertexShader: LVS, fragmentShader: LFS, uniforms: { uF: { value: 0 } }, transparent: true, depthWrite: false, depthTest: false, blending: T.AdditiveBlending });
    var lines = new T.LineSegments(lg, lm); lines.frustumCulled = false;
    var pg = new T.BufferGeometry(); pg.setAttribute('position', new T.BufferAttribute(new Float32Array(N * 3), 3)); pg.setAttribute('cl', new T.BufferAttribute(new Float32Array(N * 4), 4)); pg.setAttribute('sz', new T.BufferAttribute(new Float32Array(N), 1));
    var pm = new T.ShaderMaterial({ vertexShader: PVS, fragmentShader: PFS, uniforms: { uF: { value: 0 }, uP: { value: dpr } }, transparent: true, depthWrite: false, depthTest: false, blending: T.AdditiveBlending });
    var pts = new T.Points(pg, pm); pts.frustumCulled = false;
    var sc = new T.Scene(); sc.add(lines); sc.add(pts);
    // 激波面 / 日球层顶面(示意网格平面,随飞船日心距离在 ±6 AU 范围内移动)
    function plane(col) {
      var g = new T.PlaneGeometry(2 * L, 2 * L, 1, 1);
      var m = new T.ShaderMaterial({ uniforms: { col: { value: new T.Color(col[0], col[1], col[2]) }, uF: { value: 0 } }, transparent: true, depthWrite: false, depthTest: false, side: T.DoubleSide, blending: T.AdditiveBlending,
        vertexShader: 'varying vec2 vU;void main(){vU=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
        fragmentShader: 'uniform vec3 col;uniform float uF;varying vec2 vU;void main(){vec2 g=abs(fract(vU*16.)-.5);float l=smoothstep(.47,.5,max(g.x,g.y));float e=smoothstep(.0,.25,min(min(vU.x,1.-vU.x),min(vU.y,1.-vU.y)));gl_FragColor=vec4(col,(l*.26+.035)*e*uF);}' });
      var me = new T.Mesh(g, m); me.frustumCulled = false; me.visible = false; sc.add(me); return me;
    }
    FL = { N: N, P: P, J: J, A: A, B: Bv, W: W, U: Uu, lines: lines, pts: pts, sc: sc, t: 0, f: 0, lastR: -1, tsP: plane([1, .62, .3]), hpP: plane([.45, .78, 1]) };
  }
  // 日心距离 → 区域与参数(依据见文件头;日鞘速度从 130 km/s 线性降到日球层顶前约 30 km/s)
  function zoneAt(ri) {
    if (ri < TS) return 0; if (ri < HP) return 1; return 2;
  }
  function updFlow(S, r, dt, rh, tail) {
    var F = FL, N = F.N, P = F.P, pa = F.lines.geometry.attributes.position.array, ca = F.lines.geometry.attributes.cl.array, qa = F.pts.geometry.attributes.position.array, qc = F.pts.geometry.attributes.cl.array, qs = F.pts.geometry.attributes.sz.array;
    var still = reduced(); if (still) { if (Math.abs(r - F.lastR) < 0.05) return; F.lastR = r; dt = 0; }
    F.t += dt; var t = F.t, fade = F.f;
    for (var i = 0; i < N; i++) {
      var o = i * 3, px = P[o], py = P[o + 1], pz = P[o + 2];
      var ri = r + (px * rh[0] + py * rh[1] + pz * rh[2]) * KAU, z = zoneAt(ri), sp, dx, dy, dz, cr, cg, cb, al, dens, psz;
      if (z === 0) {   // 超音速太阳风:径向成束(±2°),冷
        sp = 400; dx = rh[0] + F.J[o] * .035; dy = rh[1] + F.J[o + 1] * .035; dz = rh[2] + F.J[o + 2] * .035;
        cr = .62; cg = .78; cb = 1; al = .5; dens = .36; psz = 1.3;
      } else if (z === 1) {   // 日鞘:减速、转向尾部、湍动、加热
        var u = (ri - TS) / (HP - TS), ph = t * F.W[i * 2] * (1.6 - u) + F.W[i * 2 + 1], c = Math.cos(ph), s = Math.sin(ph), k = 1 - u;
        var wx = F.A[o] * c + F.B[o] * s, wy = F.A[o + 1] * c + F.B[o + 1] * s, wz = F.A[o + 2] * c + F.B[o + 2] * s;
        var rr = .6 - .45 * u, tt = .25 + .45 * u, ww = .8;
        sp = lerp(130, 30, u); dx = rh[0] * rr + tail[0] * tt + wx * ww; dy = rh[1] * rr + tail[1] * tt + wy * ww; dz = rh[2] * rr + tail[2] * tt + wz * ww;
        var heat = .6 + .4 * k * Math.exp(-(ri - TS) * 0.25);   // 紧贴激波后最热最亮(日鞘整体约 10 万 K)
        cr = 1; cg = .7 + .2 * heat; cb = .42 + .35 * heat; al = .6 + .4 * heat; dens = .9; psz = 2.2 + 1.8 * heat;
      } else {   // 本地星际介质:星际风 26 km/s 自鼻端吹来
        sp = 26; dx = -NOSE[0] + F.J[o] * .1; dy = -NOSE[1] + F.J[o + 1] * .1; dz = -NOSE[2] + F.J[o + 2] * .1;
        cr = .72; cg = .66; cb = 1; al = .45; dens = .22; psz = 1.6;
      }
      var dl = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1, v = sp * CV / dl; dx *= v; dy *= v; dz *= v;
      if (!still) {
        px += dx * dt; py += dy * dt; pz += dz * dt;
        if (px > L) px -= 2 * L; else if (px < -L) px += 2 * L; if (py > L) py -= 2 * L; else if (py < -L) py += 2 * L; if (pz > L) pz -= 2 * L; else if (pz < -L) pz += 2 * L;
        P[o] = px; P[o + 1] = py; P[o + 2] = pz;
      }
      var vis = F.U[i] < dens ? 1 : 0, l6 = i * 6, l8 = i * 8;
      pa[l6] = px; pa[l6 + 1] = py; pa[l6 + 2] = pz; pa[l6 + 3] = px - dx * TAU; pa[l6 + 4] = py - dy * TAU; pa[l6 + 5] = pz - dz * TAU;
      ca[l8] = cr; ca[l8 + 1] = cg; ca[l8 + 2] = cb; ca[l8 + 3] = al * vis; ca[l8 + 4] = cr; ca[l8 + 5] = cg; ca[l8 + 6] = cb; ca[l8 + 7] = 0;
      qa[o] = px; qa[o + 1] = py; qa[o + 2] = pz; qc[i * 4] = cr; qc[i * 4 + 1] = cg; qc[i * 4 + 2] = cb; qc[i * 4 + 3] = al * vis * .9; qs[i] = psz;
    }
    F.lines.geometry.attributes.position.needsUpdate = F.lines.geometry.attributes.cl.needsUpdate = true;
    F.pts.geometry.attributes.position.needsUpdate = F.pts.geometry.attributes.cl.needsUpdate = F.pts.geometry.attributes.sz.needsUpdate = true;
    // 边界面
    [[F.tsP, TS], [F.hpP, HP]].forEach(function (q) {
      var off = (q[1] - r) / KAU, on = Math.abs(off) < L * .98;
      q[0].visible = on && fade > .01; if (!on) return;
      q[0].position.set(rh[0] * off, rh[1] * off, rh[2] * off); q[0].quaternion.setFromUnitVectors(new T.Vector3(0, 0, 1), new T.Vector3(rh[0], rh[1], rh[2]));
      q[0].material.uniforms.uF.value = fade * (1 - Math.abs(off) / L) * .9;
    });
  }

  /* =================== 3. 日球层外形 =================== */
  var HS = null;
  function surfGeo(m, which, nT, nP) {
    var M = SH[m], thMax = Math.PI * (M.tail && which === 'hp' ? 0.985 : 1), rows = nT + 1, cols = nP + 1;
    if (M.tail && which === 'hp') { var lo = 1.6, hi = Math.PI - 1e-3; for (var it = 0; it < 40; it++) { var md = (lo + hi) / 2, rr = surfR(m, which, md, Math.PI / 2); if (-rr * Math.cos(md) > M.tail + 200) hi = md; else lo = md; } thMax = lo; }
    var pos = new Float32Array(rows * cols * 3), va = new Float32Array(rows * cols), idx = [];
    for (var i = 0; i < rows; i++) {
      var th = thMax * Math.pow(i / nT, M.tail && which === 'hp' ? 0.75 : 1);
      for (var j = 0; j < cols; j++) {
        var ph = j / nP * Math.PI * 2, r = surfR(m, which, th, ph), d = dirOf(th, ph), k = (i * cols + j);
        pos[k * 3] = d[0] * r; pos[k * 3 + 1] = d[1] * r; pos[k * 3 + 2] = d[2] * r;
        var x = -r * Math.cos(th); va[k] = M.tail && which === 'hp' ? 1 - sstep(M.tail * .45, M.tail + 150, x) : 1;
      }
    }
    for (i = 0; i < nT; i++) for (j = 0; j < nP; j++) { var a = i * cols + j, b = a + cols; idx.push(a, b, a + 1, b, b + 1, a + 1); }
    var g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.setAttribute('va', new T.BufferAttribute(va, 1)); g.setIndex(idx); g.computeVertexNormals();
    // 经纬网线(经线每 30°,纬线约每 15°)
    var lp = [], la = [];
    function push(k1, k2) { lp.push(pos[k1 * 3], pos[k1 * 3 + 1], pos[k1 * 3 + 2], pos[k2 * 3], pos[k2 * 3 + 1], pos[k2 * 3 + 2]); la.push(va[k1], va[k2]); }
    var stepJ = Math.max(1, Math.round(nP / 12)), stepI = Math.max(1, Math.round(nT / 10));
    for (j = 0; j < nP; j += stepJ) for (i = 0; i < nT; i++) push(i * cols + j, (i + 1) * cols + j);
    for (i = stepI; i <= nT; i += stepI) for (j = 0; j < nP; j++) push(i * cols + j, i * cols + j + 1);
    var lg = new T.BufferGeometry(); lg.setAttribute('position', new T.BufferAttribute(new Float32Array(lp), 3)); lg.setAttribute('va', new T.BufferAttribute(new Float32Array(la), 1));
    return { g: g, lg: lg };
  }
  function buildShape() {
    var grp = new T.Group(), n = { high: [64, 96], mid: [44, 64], low: [28, 40] }[tier];
    function surf(which, col, a0, aR, lA) {
      var G = surfGeo(model, which, n[0], n[1]);
      var m = new T.Mesh(G.g, new T.ShaderMaterial({ vertexShader: SVS, fragmentShader: SFS, uniforms: { col: { value: new T.Color(col[0], col[1], col[2]) }, a0: { value: a0 }, aR: { value: aR }, uF: { value: 1 } }, transparent: true, depthWrite: false, depthTest: false, side: T.DoubleSide }));
      var l = new T.LineSegments(G.lg, new T.ShaderMaterial({ vertexShader: GVS, fragmentShader: GFS, uniforms: { col: { value: new T.Color(col[0], col[1], col[2]) }, uA: { value: lA }, uF: { value: 1 } }, transparent: true, depthWrite: false, depthTest: false }));
      m.frustumCulled = l.frustumCulled = false; grp.add(m); grp.add(l); return [m, l];
    }
    var hp = surf('hp', [.42, .74, 1], .03, .3, .34), ts = surf('ts', [1, .62, .3], .025, .24, .36);
    // 太阳、旅行者穿越点、星际风箭头
    function ptsObj(arr, col, size) {
      var g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(new Float32Array(arr), 3));
      var c = new Float32Array(arr.length / 3 * 4), s = new Float32Array(arr.length / 3); for (var i = 0; i < s.length; i++) { c[i * 4] = col[0]; c[i * 4 + 1] = col[1]; c[i * 4 + 2] = col[2]; c[i * 4 + 3] = col[3]; s[i] = size; }
      g.setAttribute('cl', new T.BufferAttribute(c, 4)); g.setAttribute('sz', new T.BufferAttribute(s, 1));
      var p = new T.Points(g, new T.ShaderMaterial({ vertexShader: PVS, fragmentShader: PFS, uniforms: { uF: { value: 1 }, uP: { value: dpr } }, transparent: true, depthWrite: false, depthTest: false, blending: T.AdditiveBlending })); p.frustumCulled = false; grp.add(p); return p;
    }
    var sun = ptsObj([0, 0, 0], [1, .85, .5, 1], 9);
    var mk = ptsObj([].concat(V1D.map(function (v) { return v * TS; }), V1D.map(function (v) { return v * HP; }), V2D.map(function (v) { return v * 84; }), V2D.map(function (v) { return v * 119; })), [1, 1, 1, 1], 6);
    var trk = []; [[V1D, 165], [V2D, 135]].forEach(function (q) { trk.push(0, 0, 0, q[0][0] * q[1], q[0][1] * q[1], q[0][2] * q[1]); });
    var tg = new T.BufferGeometry(); tg.setAttribute('position', new T.BufferAttribute(new Float32Array(trk), 3)); tg.setAttribute('va', new T.BufferAttribute(new Float32Array([.15, .9, .15, .9]), 1));
    var tl = new T.LineSegments(tg, new T.ShaderMaterial({ vertexShader: GVS, fragmentShader: GFS, uniforms: { col: { value: new T.Color(.85, .9, 1) }, uA: { value: .5 }, uF: { value: 1 } }, transparent: true, depthWrite: false, depthTest: false })); tl.frustumCulled = false; grp.add(tl);
    var aw = [], A0 = 470, A1 = 230; for (var k = 0; k < 5; k++) { var off = (k - 2) * 40, b = [U[0] * off, U[1] * off, U[2] * off]; aw.push(NOSE[0] * A0 + b[0], NOSE[1] * A0 + b[1], NOSE[2] * A0 + b[2], NOSE[0] * A1 + b[0], NOSE[1] * A1 + b[1], NOSE[2] * A1 + b[2]);
      [U, V].forEach(function (e) { [-1, 1].forEach(function (sg) { aw.push(NOSE[0] * A1 + b[0], NOSE[1] * A1 + b[1], NOSE[2] * A1 + b[2], NOSE[0] * (A1 + 22) + b[0] + e[0] * 9 * sg, NOSE[1] * (A1 + 22) + b[1] + e[1] * 9 * sg, NOSE[2] * (A1 + 22) + b[2] + e[2] * 9 * sg); }); }); }
    var ag = new T.BufferGeometry(); ag.setAttribute('position', new T.BufferAttribute(new Float32Array(aw), 3)); var av = new Float32Array(aw.length / 3); for (k = 0; k < av.length; k++) av[k] = 1; ag.setAttribute('va', new T.BufferAttribute(av, 1));
    var al = new T.LineSegments(ag, new T.ShaderMaterial({ vertexShader: GVS, fragmentShader: GFS, uniforms: { col: { value: new T.Color(.75, .7, 1) }, uA: { value: .55 }, uF: { value: 1 } }, transparent: true, depthWrite: false, depthTest: false })); al.frustumCulled = false; grp.add(al);
    // IBEX 丝带:天球上的圆(中心 λ219.2° β39.9°,半径 74.5°,宽约 20°);放在 175 AU 处仅为示意距离
    var rc = ecl3(219.2, 39.9), e1 = nrm(cross(rc, Math.abs(rc[1]) < .9 ? [0, 1, 0] : [1, 0, 0])), e2 = cross(rc, e1), rb = [];
    [-7, 0, 7].forEach(function (dw) { var hA = (74.5 + dw) * Math.PI / 180; for (var q = 0; q < 220; q++) { var ph = q / 220 * Math.PI * 2, d = [Math.cos(hA) * rc[0] + Math.sin(hA) * (Math.cos(ph) * e1[0] + Math.sin(ph) * e2[0]), Math.cos(hA) * rc[1] + Math.sin(hA) * (Math.cos(ph) * e1[1] + Math.sin(ph) * e2[1]), Math.cos(hA) * rc[2] + Math.sin(hA) * (Math.cos(ph) * e1[2] + Math.sin(ph) * e2[2])]; rb.push(d[0] * 175, d[1] * 175, d[2] * 175); } });
    var rib = ptsObj(rb, [.75, 1, .55, .55], 3.2); rib.visible = ribbonOn;
    var ship = ptsObj([0, 0, 0], [.5, 1, .9, 1], 8);
    HS = { grp: grp, hp: hp, ts: ts, rib: rib, ship: ship, sun: sun, model: model, sc: new T.Scene(), cam: new T.PerspectiveCamera(60, 1, .3, 2e5), labels: null };
    HS.sc.add(grp);
  }
  function rebuildShape() { if (!HS) return; var old = HS; old.grp.traverse(function (o) { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); }); buildShape(); }
  // 标签(主视野 / 小窗共用)
  var LBL = [
    { k: 'ts', t: function () { return '终端激波 · V1 94 AU / V2 84 AU'; }, p: function () { var r = surfR(model, 'ts', .6, Math.PI * .75); return dirOf(.6, Math.PI * .75).map(function (v) { return v * r; }); }, c: '#ffb070' },
    { k: 'hp', t: function () { return '日球层顶 · V1 121.6 AU / V2 119 AU'; }, p: function () { var th = 1.35, r = surfR(model, 'hp', th, -Math.PI * .5); return dirOf(th, -Math.PI * .5).map(function (v) { return v * r; }); }, c: '#7fc4ff' },
    { k: 'hs', t: function () { return '日鞘(两层之间)'; }, p: function () { var th = 1.0, r = (surfR(model, 'ts', th, Math.PI * .5) + surfR(model, 'hp', th, Math.PI * .5)) / 2; return dirOf(th, Math.PI * .5).map(function (v) { return v * r; }); }, c: '#ffd9a0' },
    { k: 'v1', t: function () { return 'V1 旅行者 1 号'; }, p: function () { return V1D.map(function (v) { return v * 165; }); }, c: '#e8f0ff' },
    { k: 'v2', t: function () { return 'V2 旅行者 2 号'; }, p: function () { return V2D.map(function (v) { return v * 135; }); }, c: '#e8f0ff' },
    { k: 'wd', t: function () { return '星际风 26 km/s →(鼻端)'; }, p: function () { return NOSE.map(function (v) { return v * 480; }); }, c: '#c8c0ff' },
    { k: 'rb', t: function () { return 'IBEX 丝带(示意距离)'; }, p: function () { var rc = ecl3(219.2, 39.9), e1 = nrm(cross(rc, [0, 1, 0])), h = 74.5 * Math.PI / 180; return [0, 1, 2].map(function (i) { return (Math.cos(h) * rc[i] + Math.sin(h) * e1[i]) * 175; }); }, c: '#c8ff9c', on: function () { return ribbonOn; } },
    { k: 'sh', t: function () { return '天枢号'; }, p: function () { return HS.shipP; }, c: '#80ffe6' }
  ];
  function placeLabels(box, cam, W, H, fade, skip) {
    if (!box._lb) { box._lb = {}; LBL.forEach(function (l) { var d = document.createElement('div'); d.className = 'xh-lb'; d.style.color = l.c; box.appendChild(d); box._lb[l.k] = d; }); }
    var v = new T.Vector3();
    LBL.forEach(function (l) {
      var d = box._lb[l.k], p = l.p(), on = fade > .05 && p && (!l.on || l.on()) && !(skip && skip[l.k]);
      if (on) { v.set(p[0], p[1], p[2]).project(cam); on = v.z > -1 && v.z < 1 && Math.abs(v.x) < 1.05 && Math.abs(v.y) < 1.05; }
      d.style.display = on ? 'block' : 'none'; if (!on) return;
      var t = l.t(); if (d._t !== t) { d._t = t; d.textContent = t; d._w = 0; } if (!d._w) d._w = d.offsetWidth || t.length * 11;
      var x = (v.x * .5 + .5) * W + 6, y = (-v.y * .5 + .5) * H - 8; if (x + d._w > W - 4) x = Math.max(2, x - d._w - 12);   // 不出右边界
      d.style.opacity = Math.min(1, fade).toFixed(2); d.style.transform = 'translate(' + x.toFixed(0) + 'px,' + y.toFixed(0) + 'px)';
    });
  }
  function shapeFade(f) { HS.grp.traverse(function (o) { if (o.material && o.material.uniforms && o.material.uniforms.uF) o.material.uniforms.uF.value = f; }); }

  /* ---------- 讲解卡小窗(独立小渲染器,卡片打开时才运行)---------- */
  var INS = null;
  function insetHtml() {
    return '<div class="xh-ctl"><span>外形模型</span><button type="button" class="xh-chip' + (model === 'comet' ? ' on' : '') + '" data-m="comet">彗星状长尾</button><button type="button" class="xh-chip' + (model === 'croissant' ? ' on' : '') + '" data-m="croissant">气泡 / 羊角状</button><button type="button" class="xh-chip' + (ribbonOn ? ' on' : '') + '" data-r="1">IBEX 丝带</button></div>' +
      '<div class="xh-in"><canvas class="xh-cv"></canvas><div class="xh-lbs"></div><div class="xh-tag">示意 · 形状仍有争议(推测)</div></div>' +
      '<div class="xh-nt">按真实 AU 比例;两种模型都用旅行者 1/2 号穿越终端激波与日球层顶的实测距离标定(白点)。彗星状:Parker 1961 半无限体外形,长尾 700 AU 外淡出;气泡/羊角状:参照 Opher & Drake 2015、Opher 等 2020,两瓣间尾部约 250 AU。颜色与透明度仅为示意。</div>';
  }
  function insetOn(box) {
    css(); var cv = box.querySelector('.xh-cv'); if (!cv || !T) return;
    box.querySelectorAll('.xh-chip').forEach(function (b) { b.onclick = function () { if (b.dataset.m) setModel(b.dataset.m); else setRibbon(!ribbonOn); box.querySelectorAll('.xh-chip').forEach(function (x) { x.classList.toggle('on', x.dataset.m ? x.dataset.m === model : ribbonOn); }); }; });
    if (!HS) { tier = tier || getTier(); buildShape(); }
    if (!INS) {
      try { var r = new T.WebGLRenderer({ canvas: cv, antialias: true, alpha: true }); r.setPixelRatio(Math.min(1.5, window.devicePixelRatio || 1)); r.setClearColor(0x000000, 0); INS = { r: r, cv: cv, cam: new T.PerspectiveCamera(32, 2, 5, 1e5), t0: performance.now() }; }
      catch (e) { console.warn('[SHXH inset]', e); return; }
    } else {   // 卡片重绘后换上新 canvas:沿用同一 GL 上下文所在的旧 canvas 节点
      var old = INS.cv; if (old !== cv) { cv.parentNode.replaceChild(old, cv); }
    }
    INS.box = box.querySelector('.xh-in'); INS.lbs = box.querySelector('.xh-lbs'); INS.lbs._lb = null;
  }
  function insetFrame(S) {
    if (!INS || !INS.box || !INS.box.isConnected) return;
    var w = INS.box.clientWidth, h = INS.box.clientHeight; if (!w || !h) return;
    if (INS.w !== w || INS.h !== h) { INS.w = w; INS.h = h; INS.r.setSize(w, h, false); INS.cv.style.width = w + 'px'; INS.cv.style.height = h + 'px'; }
    var tt = reduced() ? 0 : (performance.now() - INS.t0) / 1000 * .12, cx = model === 'comet' ? -190 : -70, dist = model === 'comet' ? 860 : 700;
    var sd = [Math.cos(tt) * V[0] + Math.sin(tt) * U[0] * .35, Math.cos(tt) * V[1] + Math.sin(tt) * U[1] * .35, Math.cos(tt) * V[2] + Math.sin(tt) * U[2] * .35]; sd = nrm([sd[0] + U[0] * .45, sd[1] + U[1] * .45, sd[2] + U[2] * .45]);
    var c = INS.cam, ctr = new T.Vector3(NOSE[0] * cx, NOSE[1] * cx, NOSE[2] * cx);
    c.aspect = w / h; c.position.set(ctr.x + sd[0] * dist, ctr.y + sd[1] * dist, ctr.z + sd[2] * dist); c.up.set(U[0], U[1], U[2]); c.lookAt(ctr); c.updateProjectionMatrix(); c.updateMatrixWorld();
    shapeFade(1); HS.rib.visible = ribbonOn; INS.r.render(HS.sc, c);
    placeLabels(INS.lbs, c, w, h, 1, { rb: true, hs: true });   // 小窗只标主要几项,免得拥挤
  }

  /* ---------- 卡片、样式 ---------- */
  function css() {
    if (document.getElementById('xh-css')) return; var s = document.createElement('style'); s.id = 'xh-css';
    s.textContent = '.xh-lb{position:absolute;left:0;top:0;font:11px/1.3 system-ui,"PingFang SC","Microsoft YaHei",sans-serif;white-space:nowrap;pointer-events:none;text-shadow:0 0 4px #000,0 0 8px #000;letter-spacing:.04em}' +
      '#xh-ov{position:absolute;inset:0;pointer-events:none;z-index:3;overflow:hidden}' +
      '#xh-cap{position:absolute;left:50%;top:198px;transform:translateX(-50%);max-width:min(560px,92vw);padding:5px 12px;border-radius:9px;border:1px solid rgba(255,190,120,.28);background:rgba(8,14,28,.42);color:#e9eef8;font:11.5px/1.5 system-ui,"PingFang SC","Microsoft YaHei",sans-serif;text-align:center;pointer-events:none;z-index:4;opacity:0;transition:opacity .6s}' +
      '#xh-cap b{color:#ffcf8a;font-weight:600}#xh-cap i{font-style:normal;opacity:.65;font-size:10.5px}#xh-cap .tg{display:inline-block;margin-left:6px;padding:0 6px;border:1px solid currentColor;border-radius:8px;font-size:10px;color:#f0c97a}' +
      '.xh-ctl{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin:4px 0 6px;font-size:12px}.xh-ctl span{opacity:.75;margin-right:2px}' +
      '.xh-chip{font:inherit;font-size:11.5px;color:#cfe3f7;background:rgba(40,90,150,.18);border:1px solid rgba(127,190,255,.35);border-radius:10px;padding:2px 9px;cursor:pointer}.xh-chip.on{color:#10203a;background:#9fd6ff;border-color:#9fd6ff}' +
      '.xh-in{position:relative;height:190px;border-radius:10px;overflow:hidden;background:radial-gradient(ellipse at 50% 50%,rgba(20,30,60,.55),rgba(2,4,12,.8));border:1px solid rgba(127,190,255,.2)}.xh-in canvas{position:absolute;left:0;top:0}.xh-lbs{position:absolute;inset:0;pointer-events:none}' +
      '.xh-tag{position:absolute;right:6px;bottom:4px;font-size:10px;color:#f0c97a;opacity:.85}.xh-nt{margin-top:6px;font-size:10.5px;line-height:1.5;opacity:.62}' +
      '@media (max-width:640px){.xh-in{height:150px}#xh-cap{top:214px;font-size:10.5px}.xh-lb{font-size:10px}}';
    document.head.appendChild(s);
  }
  function addEx() {
    var E = window.SHXE && SHXE.ex; if (!E) return false;
    E.swflow = { t: '太阳风粒子流 · 终端激波前后', k: '已证实', k2: '画面 模拟', b: [
      '激波内侧:太阳风以约 400 km/s 沿径向成束向外吹(接近激波时因拾起离子减到约 300 km/s),温度低、方向整齐——超音速。',
      '穿过终端激波:旅行者 2 号等离子体仪实测速度降到约 130 km/s,密度被压缩约 2 倍,温度升到约 10 万 K,流向转往日球层尾部并变得紊乱。',
      '画面怎么读:线段长短 = 速度,粒子多少 = 密度,亮度与暖色 = 温度。每颗粒子按「飞船日心距离 + 自身前后位置」判断在激波哪一侧(画面前后约 ±6 AU 的示意尺度),所以接近 94 AU 时能看到激波面从前方扫过。',
      '旅行者 1 号的等离子体仪 1980 年已损坏,它在日鞘中的流速由带电粒子仪反推:靠近日球层顶时径向速度几乎为零。'],
      s: '依据:Richardson 等 2008 Nature 454:63(V2 等离子体仪);Decker 等 2005 Science 309:2020;Krimigis 等 2011 Nature 474:359。画面为按实测剖面的模拟示意' };
    E.pws = { t: '等离子体波之声 · 旅行者 1 号 PWS', k: '已证实', b: [
      '这不是空气中的声音:等离子体波仪的天线测到星际等离子体里电子的集体振荡(电子等离子体振荡),频率恰好落在人耳范围,放大后就能直接播放。',
      '频率直接给出电子密度:f ≈ 8.98 kHz × √n(n 以 /cm³ 计)。2012 年 10–11 月约 2.2 kHz → 0.06 /cm³;2013 年 4–5 月约 2.6 kHz → 0.08 /cm³,比日鞘高约 40 倍——证明已身处星际空间。',
      '音调缓缓升高 = 密度持续上升;两次「演奏」都由太阳爆发(日冕物质抛射)的激波激起。',
      '本舰播放的是 NASA 公开的实测录音(PIA17045 中 12 秒一段,只调整整体音量并加淡入淡出)。'],
      s: '依据:Gurnett 等 2013 Science 341:1489;录音 NASA/JPL-Caltech/University of Iowa(PIA17045)',
      x: function () { return '<button type="button" class="xh-chip" onclick="window.SHXS&&SHXS.pws&&SHXS.pws.play(true)">▶ 播放实测录音(12 秒)</button>'; }, on: function () { css(); } };
    if (E.heliopause && !E.heliopause._h) { E.heliopause._h = 1; E.heliopause.x = function () { return '<button type="button" class="xh-chip" onclick="window.SHXS&&SHXS.pws&&SHXS.pws.play(true)">▶ 听:旅行者 1 号等离子体波(实测)</button> <button type="button" class="xh-chip" onclick="window.SHXE&&SHXE.show(\'pws\',1)">这是什么声音?</button>'; }; E.heliopause.on = function () { css(); }; }
    if (E.heliosphere && !E.heliosphere._h) {
      E.heliosphere._h = 1; E.heliosphere.x = insetHtml; E.heliosphere.on = insetOn;
      E.heliosphere.b = E.heliosphere.b.slice(0, 3).concat(['整体形状仍有争论:传统 MHD 模型给出彗星状长尾;卡西尼 INCA 与 Opher 等的模型认为它更小更圆,尾部分成两瓣(「羊角面包」)。下面小窗可切换两种模型,白点为旅行者号实测穿越点。', 'IBEX 卫星 2009 年发现一条高能中性原子「丝带」,圆心指向本地星际磁场方向,可在小窗中开关。']);
      E.heliosphere.s = '依据:旅行者 1/2 号、IBEX(Funsten 2013)、卡西尼 INCA(Dialynas 2017)、Opher 等 2015/2020;外形为模型示意';
    }
    return !!(E.heliosphere && E.heliosphere._h);
  }

  /* ---------- 状态文字(主视野顶部)---------- */
  var cap = null, ov = null;
  function overlay(root) {
    css();
    if (!ov || !ov.isConnected) { ov = document.createElement('div'); ov.id = 'xh-ov'; var cv = root.querySelector('canvas.gl'); if (cv && cv.nextSibling) root.insertBefore(ov, cv.nextSibling); else root.appendChild(ov); }   // 紧跟画布,HUD 面板在其上
    if (!cap || !cap.isConnected) { cap = document.createElement('div'); cap.id = 'xh-cap'; root.appendChild(cap); }
  }
  function capText(r) {
    var z = zoneAt(r), s;
    if (z === 0) s = '<b>超音速太阳风</b> · 约 400 km/s 径向成束 · 终端激波在前方 ' + (TS - r).toFixed(1) + ' AU';
    else if (z === 1) { var u = (r - TS) / (HP - TS); s = '<b>日鞘</b> · 已减速到约 ' + Math.round(lerp(130, 30, u)) + ' km/s,转向尾部、湍动加热、密度 ×2 · 日球层顶在前方 ' + (HP - r).toFixed(1) + ' AU'; }
    else s = '<b>本地星际介质</b> · 太阳风粒子几乎消失,星际风约 26 km/s 自鼻端吹来';
    return '太阳风粒子流' + '<span class="tg">模拟示意</span><br>' + s + '<br><i>线长 = 速度 · 数量 = 密度 · 亮度/暖色 = 温度 · 依据旅行者 1/2 号实测剖面</i>';
  }

  /* ---------- 每帧 ---------- */
  var shapeF = 0, capH = 0;
  function init() {
    T = window.THREE; X = window.SHXC; if (!T || !X || !X._ || !X.layers) return false;
    tier = getTier(); dpr = Math.min(window.devicePixelRatio || 1, tier === 'low' ? 1.5 : 2);
    buildFlow(); buildShape();
    X.layers.fg.push(function (li) {
      if (!FL || FL.f < .005) return;
      FL.lines.material.uniforms.uF.value = FL.f; FL.pts.material.uniforms.uF.value = FL.f;
      FL.sc.quaternion.set(0, 0, 0, 1); li.rd.render(FL.sc, li.cam0);
    });
    X.layers.bg.push(function (li) {
      if (!HS || shapeF < .005) return;
      var S = X._.S, c = HS.cam; c.aspect = li.W / li.H; c.fov = li.cam0.fov; c.position.set(S.pos[0] / AU, S.pos[1] / AU, S.pos[2] / AU); c.quaternion.copy(S.q); c.updateProjectionMatrix(); c.updateMatrixWorld();
      shapeFade(shapeF * .9); HS.rib.visible = ribbonOn; HS.ship.visible = false; li.rd.render(HS.sc, c); HS.ship.visible = true;
    });
    inited = true; return true;
  }
  function hook(ev, a) {
    if (ev === 'close') { prevR = 0; if (cap) cap.style.opacity = 0; return; }
    if (ev !== 'frame') return;
    if (!inited && !init()) return;
    if (!addEx.done) addEx.done = addEx();
    var S = X._.S, r = Math.hypot(S.pos[0], S.pos[1], S.pos[2]) / AU, root = X._.root && X._.root();
    var rh = r > 1e-6 ? [S.pos[0] / (r * AU), S.pos[1] / (r * AU), S.pos[2] / (r * AU)] : [1, 0, 0];
    var tl = nrm([-NOSE[0] - rh[0] * dot(rh, [-NOSE[0], -NOSE[1], -NOSE[2]]), -NOSE[1] - rh[1] * dot(rh, [-NOSE[0], -NOSE[1], -NOSE[2]]), -NOSE[2] - rh[2] * dot(rh, [-NOSE[0], -NOSE[1], -NOSE[2]])]);
    // 1 粒子流:70→80 AU 淡入,日球层顶外 128→140 AU 淡出
    FL.f = sstep(68, 78, r) * (1 - sstep(128, 140, r));
    if (FL.f > .005) updFlow(S, r, Math.min(.05, a.dt || .016), rh, tl);
    // 状态字幕
    if (root) {
      overlay(root);
      var showCap = FL.f > .3 && !(window.SHXE && SHXE.cur && SHXE.cur());
      if (performance.now() - capH > 300) { capH = performance.now(); cap.innerHTML = capText(r); }
      cap.style.opacity = showCap ? .92 : 0;
    }
    // 2 等离子体波之声:≥100 AU 预加载,外向穿越 121.6 AU 时播放
    var P = window.SHXS && SHXS.pws;
    if (P && !preloaded && r > 100) { preloaded = true; P.load(); }
    if (P && prevR && prevR < HP && r >= HP) P.cue();
    if (prevR && prevR < 88 && r >= 88 && window.SHXE && !fired.sw) { fired.sw = 1; X._.toast('前方终端激波 · 留意太阳风粒子流的变化'); SHXE.show('swflow'); }
    prevR = r;
    // 3 外形:主视野 140→160 AU 淡入;讲解卡打开时小窗
    shapeF = sstep(140, 160, r);
    if (HS && root && ov) placeLabels(ov, HS.cam, root.clientWidth, root.clientHeight, shapeF, { sh: 1, rb: !ribbonOn });
    HS.shipP = [S.pos[0] / AU, S.pos[1] / AU, S.pos[2] / AU]; HS.ship.geometry.attributes.position.array.set(HS.shipP); HS.ship.geometry.attributes.position.needsUpdate = true;
    if (window.SHXE && SHXE.cur && SHXE.cur() === 'heliosphere') insetFrame(S);
  }
  function setModel(m) { if (!SH[m] || m === model) return model; model = m; try { localStorage.setItem('gn:sh:x-helio-model', m); } catch (e) { } if (HS) rebuildShape(); if (X && X._) X._.toast('日球层外形示意 · ' + MN[m] + '(形状仍有争议)'); return model; }
  function setRibbon(on) { ribbonOn = !!on; try { localStorage.setItem('gn:sh:x-helio-ribbon', on ? '1' : '0'); } catch (e) { } return ribbonOn; }
  (function wait(n) { if (window.SHXC && SHXC.on) { SHXC.on(hook); return; } if (n < 100) setTimeout(function () { wait(n + 1); }, 100); })(0);
  window.SHXH = {
    model: function (m) { return setModel(m || (model === 'comet' ? 'croissant' : 'comet')); }, modelName: function () { return MN[model]; }, ribbon: function (on) { return setRibbon(on == null ? !ribbonOn : on); },
    state: function () { return { inited: inited, tier: tier, model: model, ribbon: ribbonOn, flowN: FL ? FL.N : 0, flowF: FL ? FL.f : 0, flowSum: FL ? +Array.prototype.slice.call(FL.P, 0, 60).reduce(function (x, y) { return x + y; }, 0).toFixed(3) : 0, shapeF: shapeF, inset: !!(INS && INS.box && INS.box.isConnected), calib: { comet: [SH.comet.tsC, SH.comet.hpC], croissant: [SH.croissant.tsC, SH.croissant.hpC] } }; },
    // 调试:把飞船放到旅行者 1 号方向 au 处;view='side' 侧视太阳风(看清线段长度),'sun' 回望太阳
    place: function (au, view) {
      if (!X || !X._ || !T) return false; var S = X._.S, d = V1D; S.pos = [d[0] * au * AU, d[1] * au * AU, d[2] * au * AU]; S.base = 0; S.mult = 1; S.auto = false;
      var look = view === 'sun' ? [-d[0], -d[1], -d[2]] : view === 'out' ? d : nrm(cross(d, [0, 1, 0]));
      S.q.setFromRotationMatrix(new T.Matrix4().lookAt(new T.Vector3(), new T.Vector3(look[0], look[1], look[2]), new T.Vector3(0, 1, 0))); return true;
    }
  };
})();
