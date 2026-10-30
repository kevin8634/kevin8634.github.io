/* 天枢 Starhelm 2.0 · C2.7c 驾驶舱程序化星云 / 星系(SHXNB)—— 模拟渲染,非照片
 * 王磊 10-29 11:57:抵达深空目标后不自动弹影像,改为二选一「真实照片 / 舷窗观测(模拟渲染)」;驾驶舱里目标方位要有程序化星云。
 * - 锁定深空航点(BY.tmpdso)后,在目标真实方向画一团程序化星云 / 星系,半张角 = 半径 ÷ 当前距离(越飞越近越大;抵达约 3 倍半径处约 18°)。
 * - 画在只随相机旋转的天空层(cam0),不用天文尺度坐标,避开远距离 float32 精度问题;挂 SHXC.layers.bg(星空之后、主场景之前)。
 * - 星云:billboard 层叠 + fBm 域扭曲噪声 shader(发光层加法混合 + 普通混合的暗尘层)+ 嵌入星点粒子;
 *   M57 环状、M1 纤维状;星系(M31 / M51 / M104)= 旋臂粒子盘 + 弥散盘 + 核球,按真实倾角 / 位置角倾斜,M104 加尘埃带。
 * - 配色:各目标 ESA/Hubble 影像小图离线取三档亮度色(work/ 取样脚本),只取颜色;shader 里提饱和度。
 * - 性能三档:高(桌面 ≥8 线程)5 层 / 6000 粒子 / 5 阶噪声 · 中 3 / 2600 / 4 · 低(手机、内存 <4 GB)2 / 900 / 3。减少动态:静止不漂移。
 * C2.12a5(10-30 王磊渲染标准:星云/星系主体必须真 3D 粒子体积,禁平面贴图/切片/billboard):星云、环状星云、超新星遗迹、星系
 *   的主体全部改为 3D 柔光粒子体积(JS 端 fBm 噪声决定粒子分布与颜色,发光粒子加法混合 + 暗尘粒子乘法吸收);星系 = 盘面粒子(旋臂调制)
 *   + 核球/棒椭球粒子 + 喷流粒子 + 尘埃带吸收粒子。旧 billboard 噪声层只剩星系团成员(待 C2.13)。近处光线步进体积(C2.6e)保留。
 * - 星云下方标「模拟渲染 · 非照片」+「真实照片」按钮。只用 ShaderMaterial / Points / PlaneGeometry,r186 与 ?three=169 通用。
 */
(function () {
  'use strict';
  var P = {
    M42: { k: 'neb', c: ['#5c3e38', '#b0606a', '#ffb3c4'], dust: .55, sat: 1.7, st: '#cfe2ff' },
    M1: { k: 'snr', c: ['#706f4e', '#d07a50', '#b8d8ff'], dust: 0, sat: 1.6, st: '#cfe2ff' },
    M16: { k: 'neb', c: ['#565c61', '#7f9a88', '#e8c79a'], dust: .8, sat: 1.5, st: '#dfe8ff' },
    M51: { k: 'gal', c: ['#444445', '#8a7cc0', '#ffdcb8'], inc: 20, arms: 2, wind: 3.2, sat: 1.4 },
    'NGC 3372': { k: 'neb', c: ['#937b60', '#c98b5a', '#9fd0ff'], dust: .7, sat: 1.6, st: '#e6efff' },
    M31: { k: 'gal', c: ['#635356', '#9a8ab8', '#ffe2b0'], inc: 77, arms: 2, wind: 2.4, sat: 1.3, pa: 38 },
    M8: { k: 'neb', c: ['#7a655d', '#d07088', '#ffd0dc'], dust: .6, sat: 1.7, st: '#dfe8ff' },
    M20: { k: 'neb', c: ['#684a46', '#d06070', '#8fb0ff'], dust: .85, sat: 1.6, st: '#dfe8ff' },
    M57: { k: 'ring', c: ['#7a3a2a', '#e08060', '#a8e0d8'], dust: 0, sat: 1.5, st: '#ffffff' },
    M104: { k: 'gal', c: ['#534f49', '#a8a0a8', '#fff0d8'], inc: 84, arms: 0, wind: 0, sat: 1.1, lane: 1, bulge: 1.8 }
  };   // C2.9a 起星域 VII 目标由 sh-x-cosmos.js 经 SHXNB.add 注册(bar 棒状核球 [长,宽] · jet 喷流位置角 · ell 椭圆星系无盘面)
  var R = 600;
  var T, X, scn = null, grp = null, cur = null, mats = [], tier = 1, tag = null, obs = false, t0 = 0, added = false, warned = false, vis = 0, ang = 0;

  function rm() { return matchMedia('(prefers-reduced-motion: reduce)').matches; }
  function small() { return Math.min(screen.width, screen.height) < 700 || innerWidth <= 760 || (navigator.deviceMemory && navigator.deviceMemory < 4); }
  function pickTier() { if (small()) return 0; return (navigator.hardwareConcurrency || 4) >= 8 ? 2 : 1; }
  function col(h, sat) { var c = new T.Color(h), m = (c.r + c.g + c.b) / 3; c.r = Math.max(0, m + (c.r - m) * sat); c.g = Math.max(0, m + (c.g - m) * sat); c.b = Math.max(0, m + (c.b - m) * sat); return c; }
  function rnd(s) { s = s % 2147483647; if (s <= 0) s += 2147483646; return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }

  var NOISE = [
    'float h3(vec3 p){p=fract(p*0.3183099+.1);p*=17.0;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}',
    'float n3(vec3 x){vec3 i=floor(x);vec3 f=fract(x);f=f*f*(3.0-2.0*f);',
    ' return mix(mix(mix(h3(i),h3(i+vec3(1,0,0)),f.x),mix(h3(i+vec3(0,1,0)),h3(i+vec3(1,1,0)),f.x),f.y),mix(mix(h3(i+vec3(0,0,1)),h3(i+vec3(1,0,1)),f.x),mix(h3(i+vec3(0,1,1)),h3(i+vec3(1,1,1)),f.x),f.y),f.z);}',
    'uniform float uOct;',
    'float fbm(vec3 p){float a=.5,s=0.0;for(int i=0;i<6;i++){if(float(i)>=uOct)break;s+=a*n3(p);p=p*2.03+vec3(1.7,9.2,4.1);a*=.5;}return s;}'
  ].join('\n');
  var VS = 'varying vec2 vU;void main(){vU=uv*2.0-1.0;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}';
  // uK:0 星云 1 环状 2 超新星遗迹纤维 3 星系弥散盘 4 核球 5 尘埃带(普通混合)
  var FS = [
    'precision highp float;varying vec2 vU;uniform float uT,uS,uA,uK,uD;uniform vec3 c0,c1,c2;', NOISE,
    'void main(){vec2 p=vU;float r=length(p);if(r>1.0)discard;',
    ' float n=fbm(vec3(p*2.1+uS,uT*.03+uS));float w=fbm(vec3(p*3.6+n*1.6,uS*1.7+uT*.02));float e,d;vec3 c;',
    ' if(uK<.5){e=smoothstep(1.0,.12,r+(n-.5)*.75);d=e*pow(w,1.7)*1.9;}',
    ' else if(uK<1.5){float rr=r+(n-.5)*.12;e=exp(-pow((rr-.56)/.15,2.0))+.18*smoothstep(.6,.0,r);d=e*(.55+.9*w);}',
    ' else if(uK<2.5){e=smoothstep(1.0,.2,r+(n-.5)*.5);float f=1.0-abs(w*2.0-1.0);d=e*(pow(f,5.0)*1.6+.18*w);}',
    ' else if(uK<3.5){e=exp(-r*3.2);d=e*(.5+.8*w)*1.2;}',
    ' else if(uK<4.5){e=exp(-r*r*9.0);d=e*1.4+exp(-r*26.0);gl_FragColor=vec4(mix(c1,c2,e)*d*uA,1.0);return;}',
    ' else if(uK<5.5){float lane=exp(-pow(p.y/.07,2.0))*smoothstep(1.0,.5,abs(p.x));float k=lane*(.75+.25*n);gl_FragColor=vec4(c0*.25,k*uA*.85);return;}',
    ' else{float aa=atan(p.y,p.x);float e2=exp(-pow((r-.85)/.035,2.0))*smoothstep(uD,0.0,abs(aa))*(.55+.8*w);gl_FragColor=vec4(mix(c1,c2,smoothstep(.3,.8,w))*e2*uA,1.0);return;}',   // C2.9b 引力透镜弧(uD = 半弧长,弧度)
    ' c=mix(c0,c1,smoothstep(.25,.6,w));c=mix(c,c2,smoothstep(.55,.95,w*e+.15*e));',
    ' gl_FragColor=vec4(c*d*uA,1.0);}'
  ].join('\n');
  var FSD = [
    'precision highp float;varying vec2 vU;uniform float uT,uS,uA,uD;uniform vec3 c0;', NOISE,
    'void main(){vec2 p=vU;float r=length(p);if(r>1.0)discard;float n=fbm(vec3(p*2.6+uS*3.1,uS+uT*.02));float m=fbm(vec3(p*5.0+n*2.0,uS*.7));',
    ' float a=smoothstep(.52,.7,n*.6+m*.55)*smoothstep(1.0,.35,r)*uD;gl_FragColor=vec4(c0*.18,a*uA);}'
  ].join('\n');
  var PVS = 'attribute float aS;attribute vec3 aC;varying vec3 vC;uniform float uSz;void main(){vC=aC;vec4 mv=modelViewMatrix*vec4(position,1.0);gl_PointSize=max(1.0,aS*uSz);gl_Position=projectionMatrix*mv;}';
  var PFS = 'precision highp float;varying vec3 vC;uniform float uA;void main(){vec2 q=gl_PointCoord*2.0-1.0;float r=dot(q,q);if(r>1.0)discard;gl_FragColor=vec4(vC*exp(-r*3.0)*uA,1.0);}';

  function cloud(k, s, c, sat, oct, mode) {   // mode:'dust' 暗尘遮挡层 · 'lane' 星系尘埃带(都用普通混合)
    var m = new T.ShaderMaterial({ vertexShader: VS, fragmentShader: mode === 'dust' ? FSD : FS, transparent: true, depthWrite: false, depthTest: false, blending: mode ? T.NormalBlending : T.AdditiveBlending,
      uniforms: { uT: { value: 0 }, uS: { value: s }, uA: { value: 1 }, uK: { value: k }, uD: { value: 1 }, uOct: { value: oct }, c0: { value: col(c[0], sat) }, c1: { value: col(c[1], sat) }, c2: { value: col(c[2], sat) } } });
    m.userData.a = 1; mats.push(m); var me = new T.Mesh(new T.PlaneGeometry(2, 2), m); me.frustumCulled = false; return me;
  }
  function points(n, gen, base) {
    var g = new T.BufferGeometry(), pos = new Float32Array(n * 3), cs = new Float32Array(n * 3), ss = new Float32Array(n), o = { p: [0, 0, 0], c: [1, 1, 1], s: 1 };
    for (var i = 0; i < n; i++) { gen(i, o); pos.set(o.p, i * 3); cs.set(o.c, i * 3); ss[i] = o.s; }
    g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.setAttribute('aC', new T.BufferAttribute(cs, 3)); g.setAttribute('aS', new T.BufferAttribute(ss, 1));
    var m = new T.ShaderMaterial({ vertexShader: PVS, fragmentShader: PFS, transparent: true, depthWrite: false, depthTest: false, blending: T.AdditiveBlending, uniforms: { uSz: { value: 1 }, uA: { value: 1 } } });
    m.userData.a = base || 1; m.userData.pt = 1; mats.push(m); var p = new T.Points(g, m); p.frustumCulled = false; return p;
  }

  /* ---------- C2.12a5 真 3D 粒子体积 ---------- */
  function jh(x, y, z) { var p = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return p - Math.floor(p); }
  function jn(x, y, z) {
    var ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z), fx = x - ix, fy = y - iy, fz = z - iz;
    fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy); fz = fz * fz * (3 - 2 * fz);
    function l(a, b, t) { return a + (b - a) * t; }
    return l(l(l(jh(ix, iy, iz), jh(ix + 1, iy, iz), fx), l(jh(ix, iy + 1, iz), jh(ix + 1, iy + 1, iz), fx), fy),
      l(l(jh(ix, iy, iz + 1), jh(ix + 1, iy, iz + 1), fx), l(jh(ix, iy + 1, iz + 1), jh(ix + 1, iy + 1, iz + 1), fx), fy), fz);
  }
  function jf(x, y, z, o) { var a = .5, t = 0; for (var i = 0; i < o; i++) { t += a * jn(x, y, z); x = x * 2.03 + 1.7; y = y * 2.03 + 9.2; z = z * 2.03 + 4.1; a *= .5; } return t; }
  function jss(a, b, x) { var t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
  var QVS = 'attribute float aS;attribute vec3 aC;varying vec3 vC;varying float vK;uniform float uPx,uMax;void main(){vC=aC;vec4 mv=modelViewMatrix*vec4(position,1.0);float s=aS*uPx;float ps=clamp(s,1.5,uMax);vK=clamp(s*s/(ps*ps),.2,4.0);gl_PointSize=ps;gl_Position=projectionMatrix*mv;}';
  var QFS = 'precision mediump float;varying vec3 vC;varying float vK;uniform float uA;void main(){vec2 q=gl_PointCoord*2.0-1.0;float r=dot(q,q);if(r>1.0)discard;gl_FragColor=vec4(vC*exp(-r*3.5)*uA*vK,1.0);}';
  var QFD = 'precision mediump float;varying vec3 vC;varying float vK;uniform float uA;void main(){vec2 q=gl_PointCoord*2.0-1.0;float r=dot(q,q);if(r>1.0)discard;float a=clamp((1.0-r)*(1.0-r)*uA*min(vK,1.5),0.0,.92);gl_FragColor=vec4(mix(vec3(1.0),vC,a),1.0);}';
  // gen(o) 填 o.p / o.c / o.s;返回 false 表示拒绝采样。dust=true → 乘法吸收(o.c 为吸收后的透射色)
  function vol(n, gen, base, dust) {
    var g = new T.BufferGeometry(), pos = new Float32Array(n * 3), cs = new Float32Array(n * 3), ss = new Float32Array(n), o = { p: [0, 0, 0], c: [1, 1, 1], s: .1 }, k = 0, tries = 0;
    while (k < n && tries < n * 40) { tries++; if (gen(o) === false) continue; pos.set(o.p, k * 3); cs.set(o.c, k * 3); ss[k] = o.s; k++; }
    g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.setAttribute('aC', new T.BufferAttribute(cs, 3)); g.setAttribute('aS', new T.BufferAttribute(ss, 1)); g.setDrawRange(0, k);
    var m = new T.ShaderMaterial({ vertexShader: QVS, fragmentShader: dust ? QFD : QFS, transparent: true, depthWrite: false, depthTest: false,
      blending: dust ? T.CustomBlending : T.AdditiveBlending, uniforms: { uPx: { value: 100 }, uMax: { value: 160 }, uA: { value: 1 } } });
    if (dust) { m.blendEquation = T.AddEquation; m.blendSrc = T.ZeroFactor; m.blendDst = T.SrcColorFactor; }
    m.userData.a = base || 1; m.userData.vol = 1; mats.push(m); var p = new T.Points(g, m); p.frustumCulled = false; p.renderOrder = dust ? 2 : 1; return p;
  }
  function inBall(R0, o, zs) { var x, y, z; do { x = R0() * 2 - 1; y = R0() * 2 - 1; z = R0() * 2 - 1; } while (x * x + y * y + z * z > 1); o.p[0] = x; o.p[1] = y; o.p[2] = z * (zs || 1); return Math.sqrt(x * x + y * y + z * z); }
  function mixc(o, A, B, C, w, e, br) {
    var t1 = jss(.25, .6, w), t2 = jss(.55, .95, w * e + .15 * e), r = A.r + (B.r - A.r) * t1, g = A.g + (B.g - A.g) * t1, b = A.b + (B.b - A.b) * t1;
    o.c[0] = (r + (C.r - r) * t2) * br; o.c[1] = (g + (C.g - g) * t2) * br; o.c[2] = (b + (C.b - b) * t2) * br;
  }
  function nebVol(body, d, kk, R0, tier, sd) {   // 发射星云 / 环状 / 超新星遗迹:3D 发光粒子 + 暗尘吸收粒子
    var sat = d.sat || 1.5, A = col(d.c[0], sat), B = col(d.c[1], sat), C = col(d.c[2], sat), oc = [3, 4, 4][tier];
    var NE = [1600, 5000, 11000][tier], kB = Math.sqrt(5000 / NE);
    body.add(vol(NE, function (o) {
      var r = inBall(R0, o, kk === 1 ? .75 : .8);
      if (kk === 1) { var ra = Math.sqrt(o.p[0] * o.p[0] + o.p[1] * o.p[1]); if (Math.abs(o.p[2]) > .32 * (1 - Math.abs(ra - .58) * 1.5)) return false; r = ra; }   // 环状星云 = 粗环面(近乎正对视线)
      var x = o.p[0], y = o.p[1], z = o.p[2], n = jf(x * 1.7 + sd, y * 1.7 + sd, z * 1.7 + sd, oc), w = jf(x * 3.3 + n * 2.2 + sd * 1.3, y * 3.3 + n * 2.2, z * 3.3 + n * 2.2, oc), e, dd;
      if (kk === 0) { e = jss(1, .15, r + (n - .5) * .6); var gg = jss(.38, .85, w); dd = e * (gg * gg * 1.4 + .1); }
      else if (kk === 1) { var rr = r + (n - .5) * .1; e = Math.exp(-Math.pow((rr - .58) / .13, 2)); dd = e * (.3 + Math.pow(w, 1.2) * 1.2) + .04 * jss(.45, 0, r); }
      else { e = Math.exp(-Math.pow((r - .7 + (n - .5) * .3) / .25, 2)) + .3 * jss(.9, 0, r); var f = 1 - Math.abs(w * 2 - 1); dd = e * (Math.pow(f, 6) * 1.6 + .08 * w); }
      if (R0() > dd) return false;
      if (kk === 1) { var tr = jss(.45, .72, r); o.c[0] = (C.r + (A.r * 1.6 - C.r) * tr) * .9; o.c[1] = (C.g + (A.g * 1.6 - C.g) * tr) * .9; o.c[2] = (C.b + (A.b * 1.6 - C.b) * tr) * .9; }
      else mixc(o, A, B, C, w, e, 1);
      var br = (.6 + .5 * R0()) * kB * (kk === 2 ? .5 : kk === 1 ? .16 : .2); o.c[0] *= br; o.c[1] *= br; o.c[2] *= br;
      o.s = (kk === 2 ? .035 : kk === 1 ? .03 : .06) + R0() * (kk === 2 ? .06 : kk === 1 ? .05 : .12);
    }, kk === 1 ? .8 : .9));
    if (kk === 2) {   // 蟹状星云中心同步辐射蓝光(3D 椭球)
      body.add(vol(Math.round(NE * .18), function (o) { var r = inBall(R0, o, .8); o.p[0] *= .55; o.p[1] *= .45; o.p[2] *= .45; if (R0() > Math.exp(-r * r * 3)) return false; var br = .04 * kB; o.c[0] = .55 * br; o.c[1] = .7 * br; o.c[2] = 1.1 * br; o.s = .08 + R0() * .12; }, .9));
    }
    if (d.dust) {
      var ND = Math.round([500, 1600, 3600][tier] * d.dust), tint = [.30, .22, .17];
      body.add(vol(ND, function (o) {
        var r = inBall(R0, o, .7), x = o.p[0], y = o.p[1], z = o.p[2], n = jf(x * 1.7 + sd, y * 1.7 + sd, z * 1.7 + sd, oc), e = jss(1, .15, r + (n - .5) * .6), m2 = jf(x * 2.4 + n * 1.5 + sd * 2.1, y * 2.4 + n * 1.5, z * 2.4 + n * 1.5, oc);
        if (R0() > jss(.48, .66, m2) * e * 1.3) return false; o.c[0] = tint[0]; o.c[1] = tint[1]; o.c[2] = tint[2]; o.s = .05 + R0() * .1;
      }, .55 * Math.min(1.2, d.dust + .3), true));
    }
  }
  function galVol(body, tilt, d, R0, tier, sd) {   // 星系:盘面粒子 + 核球 / 棒椭球 + 喷流 + 尘埃带
    var sat = d.sat || 1.4, A = col(d.c[0], sat), B = col(d.c[1], sat * 1.2), C = col(d.c[2], sat), arms = d.arms || 0, wind = d.wind || 0, el = d.ell || 1, oc = [3, 3, 4][tier];
    if (!(arms === 0 && d.ell && !d.bar)) {   // 有盘面的星系
      var ND = [1400, 4200, 9000][tier], kB = Math.sqrt(4200 / ND);
      tilt.add(vol(ND, function (o) {
        var rr = Math.min(1, -Math.log(1 - R0() * .98) * .28 + .03), a = R0() * 6.2832, am = 1;
        if (arms) { var ph = Math.log(Math.max(rr, .05)) * wind * 1.1; am = .25 + .75 * Math.pow(Math.max(0, Math.cos(arms * (a - ph))), 2.5); }
        var nz = jf(Math.cos(a) * rr * 4 + sd, Math.sin(a) * rr * 4, sd, oc); if (R0() > am * (.4 + nz)) return false;
        o.p[0] = Math.cos(a) * rr; o.p[1] = Math.sin(a) * rr * el; o.p[2] = (R0() - .5) * (.05 + .04 * (1 - rr));
        var t = Math.min(1, rr * 1.5), br = (.5 + .5 * R0()) * kB * .17 * (.2 + .8 * jss(0, .4, rr)) * (1 - .45 * Math.sin((d.inc || 0) * Math.PI / 180)) * (am > .6 ? 1.25 : .8);
        o.c[0] = (C.r + (B.r - C.r) * t) * br; o.c[1] = (C.g + (B.g - C.g) * t) * br; o.c[2] = (C.b + (B.b - C.b) * t) * br; o.s = .05 + R0() * .08;
      }, 1));
    }
    var bs = .2 * (d.bulge || 1), NB2 = [600, 1800, 3600][tier], kb = Math.sqrt(1800 / NB2);
    body.add(vol(NB2, function (o) {   // 核球(3D 高斯椭球,暖色)
      var x = gsn(R0), y = gsn(R0), z = gsn(R0); o.p[0] = x * bs * .5; o.p[1] = y * bs * .5 * (d.ell ? el : .85); o.p[2] = z * bs * .5;
      var rr = Math.sqrt(x * x + y * y + z * z), br = kb * .09 * (.6 + .4 * R0()) * Math.exp(-rr * .3); o.c[0] = (C.r * .9 + .1) * br; o.c[1] = C.g * .85 * br; o.c[2] = C.b * .65 * br; o.s = .04 + R0() * .07 * (d.bulge || 1);
    }, 1));
    if (d.bar) tilt.add(vol(Math.round(NB2 * .6), function (o) { o.p[0] = gsn(R0) * d.bar[0] * .45; o.p[1] = gsn(R0) * d.bar[1] * .45; o.p[2] = gsn(R0) * .02; var br = kb * .085 * (.6 + .4 * R0()); o.c[0] = C.r * br; o.c[1] = C.g * .9 * br; o.c[2] = C.b * .75 * br; o.s = .04 + R0() * .05; }, 1));
    if (d.jet != null) { var jg = new T.Group(); jg.rotation.z = d.jet * Math.PI / 180; body.add(jg); jg.add(vol([150, 400, 800][tier], function (o) { var t = Math.pow(R0(), .8); o.p[0] = gsn(R0) * .008 * (1 + t * 2); o.p[1] = .03 + t * .8; o.p[2] = gsn(R0) * .008; var br = .22 * (1 - .6 * t) * (jn(t * 30, 0, sd) > .45 ? 1.4 : .6); o.c[0] = .5 * br; o.c[1] = .7 * br; o.c[2] = 1.1 * br; o.s = .015 + R0() * .02; }, .9)); }   // M87 喷流:节点状粒子线
    if (d.lane) tilt.add(vol([500, 1500, 3200][tier], function (o) {   // 尘埃带:盘面薄环吸收粒子(侧视即暗带)
      var rr = .3 + R0() * .68, a = R0() * 6.2832; o.p[0] = Math.cos(a) * rr; o.p[1] = Math.sin(a) * rr; o.p[2] = gsn(R0) * .012; if (R0() > .5 + jn(Math.cos(a) * 6, Math.sin(a) * 6, sd)) return false;
      o.c[0] = .32; o.c[1] = .24; o.c[2] = .18; o.s = .03 + R0() * .05;
    }, .5, true));
  }
  function gsn(R) { var u = R() || 1e-9, v = R(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(6.2832 * v); }

  function build(key) {
    clear(); var d = P[key]; if (!d) return; tier = pickTier(); cur = key;
    var oct = [3, 4, 5][tier], NL = [2, 3, 5][tier], NP = [900, 2600, 6000][tier], R0 = rnd(key.length * 7919 + key.charCodeAt(1) * 104729);
    grp = new T.Group(); var body = new T.Group(); grp.add(body);
    var c = d.c, sat = d.sat || 1.5;
    if (d.k === 'clu') {   // C2.9b 星系团 / 深场:成员星系精灵(椭圆 = 核球 shader,旋涡 = 盘 + 核球)+ 背景星系点 + 透镜弧
      var mem = d.mem || [], nm = tier === 0 ? Math.min(mem.length, 70) : mem.length;
      for (var j = 0; j < nm; j++) {
        var g = mem[j], gr = new T.Group(); gr.position.set(g[0], g[1], 0); gr.rotation.z = (g[4] || 0) * Math.PI / 180; body.add(gr);
        var gc = d.pal[g[5] || 0], gs = g[2];
        if (g[6]) { var sd = cloud(3, R0() * 40, gc, sat, Math.min(oct, 3)); sd.scale.set(gs, gs * g[3], 1); sd.material.userData.a = 1.1; gr.add(sd); var sb = cloud(4, 0, gc, sat, 2); sb.scale.set(gs * .35, gs * .35 * Math.max(g[3], .5), 1); gr.add(sb); }
        else { var se = cloud(4, 0, gc, sat, 2); se.scale.set(gs, gs * g[3], 1); se.material.userData.a = g[7] || 1; gr.add(se); }
      }
      (d.arcs || []).forEach(function (a) { var am = cloud(6, R0() * 20, d.arcC || ['#000000', '#ff9a70', '#ffe0c0'], sat, Math.min(oct, 3)); am.material.uniforms.uD.value = a[2]; am.scale.setScalar(a[0] / .85); am.rotation.z = a[1] * Math.PI / 180; body.add(am); });
      var bgc = d.bgC || [[1, .7, .45], [.6, .75, 1], [1, .45, .35]];
      body.add(points(Math.round((d.nbg || 800) * [.4, .7, 1][tier]), function (i, o) {
        var a = R0() * 6.2832, rr = Math.sqrt(R0()) * 1.0; o.p[0] = Math.cos(a) * rr; o.p[1] = Math.sin(a) * rr; o.p[2] = 0;
        var cc = bgc[i % bgc.length], br = .25 + R0() * .7; o.c[0] = cc[0] * br; o.c[1] = cc[1] * br; o.c[2] = cc[2] * br; o.s = 1 + R0() * 1.8;
      }, .9));
    } else if (d.k === 'gal') {
      var disk = new T.Group(); disk.rotation.z = (d.pa || 0) * Math.PI / 180; var tilt = new T.Group(); tilt.rotation.x = -(d.inc || 0) * Math.PI / 180; disk.add(tilt); body.add(disk);
      var cA = col(c[2], sat), cB = col(c[1], sat * 1.2), arms = d.arms || 0, wind = d.wind || 0;
      tilt.add(points(NP, function (i, o) {
        var t = Math.pow(R0(), .75), a;
        if (arms && R0() < .78) a = (i % arms) * 2 * Math.PI / arms + t * wind * Math.PI + (R0() - .5) * .55 * (1.2 - t); else a = R0() * 6.2832;
        var rr = .08 + t * .9; o.p[0] = Math.cos(a) * rr; o.p[1] = Math.sin(a) * rr * (d.ell || 1); o.p[2] = (R0() - .5) * .04 * (1 - t);
        var m = Math.min(1, t * 1.4), br = .35 + .65 * R0();
        o.c[0] = (cA.r + (cB.r - cA.r) * m) * br; o.c[1] = (cA.g + (cB.g - cA.g) * m) * br; o.c[2] = (cA.b + (cB.b - cA.b) * m) * br; o.s = 1 + R0() * 2.2;
      }, .9));
      galVol(body, tilt, d, R0, tier, key.length * 3.7);
    } else {
      var kk = d.k === 'ring' ? 1 : d.k === 'snr' ? 2 : 0;
      nebVol(body, d, kk, R0, tier, key.length * 3.7);
      var sc = col(d.st || '#dfe8ff', 1);
      body.add(points(Math.round(NP * (kk === 1 ? .15 : .35)), function (i, o) {
        var a = R0() * 6.2832, rr = Math.pow(R0(), .6) * .95; o.p[0] = Math.cos(a) * rr; o.p[1] = Math.sin(a) * rr; o.p[2] = (R0() - .5) * .2;
        var br = R0() < .04 ? 2.2 : .4 + R0() * .8; o.c[0] = sc.r * br; o.c[1] = sc.g * br; o.c[2] = sc.b * br; o.s = br > 2 ? 3.2 : 1 + R0() * 1.4;
      }, .8));
      if (kk === 1) body.add(vol(40, function (o) { o.p[0] = gsn(R0) * .01; o.p[1] = gsn(R0) * .01; o.p[2] = gsn(R0) * .01; o.c[0] = .5; o.c[1] = .55; o.c[2] = .6; o.s = .02 + R0() * .02; }, 1));   // M57 中心白矮星(粒子)
    }
    scn.add(grp); t0 = performance.now();
  }
  function clear() {
    if (grp) { scn.remove(grp); grp.traverse(function (o) { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); }); }
    grp = null; mats = []; cur = null;
  }
  function css() {
    if (document.getElementById('xnb-css')) return; var s = document.createElement('style'); s.id = 'xnb-css';
    s.textContent = '#xnb-tag{position:absolute;left:0;top:0;z-index:5;pointer-events:auto;display:none;align-items:center;gap:6px;padding:3px 4px 3px 9px;border-radius:12px;font:11px/1.3 "Noto Sans SC",system-ui,sans-serif;color:#e8eef9;background:rgba(8,12,22,.66);border:1px solid rgba(255,159,178,.45);white-space:nowrap}' +
      '#xnb-tag b{color:#ff9fb2;font-weight:500}#xnb-tag i{font-style:normal;color:#a9bad3}#xnb-tag button{font:inherit;cursor:pointer;border-radius:9px;padding:2px 9px;border:1px solid rgba(240,201,122,.6);background:rgba(240,201,122,.14);color:#ffe2a0}' +
      '@media (max-width:640px){#xnb-tag{font-size:10.5px}#xnb-tag i{display:none}}';
    document.head.appendChild(s);
  }
  function mkTag(root) {
    if (tag && tag.parentNode === root) return tag; css(); if (tag) tag.remove();
    tag = document.createElement('div'); tag.id = 'xnb-tag'; tag.innerHTML = '<span><b>模拟渲染 · 非照片</b> <i></i></span><button type="button">真实照片</button>';
    tag.querySelector('button').onclick = function (e) {
      e.stopPropagation(); if (!cur || !window.SHXDV) return;
      var b = X._.BY.tmpdso, near = b && b.wp && dist(b) < (b.R || 0) * 12, la = near && SHXDV.lastArr && SHXDV.lastArr(cur);
      SHXDV.open(cur, la ? { arrived: la } : {});
    };
    root.appendChild(tag); return tag;
  }
  function dist(b) { var S = X._.S; return Math.hypot(b.wp[0] - S.pos[0], b.wp[1] - S.pos[1], b.wp[2] - S.pos[2]); }
  function sstep(a, b, x) { var t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); }


  /* C2.6e 近处程序化体积:张角大到 billboard 失真时(进入/贴近星云),全屏光线步进一个以目标为心的球体,
     发射 + 吸收(暗尘遮挡背景星),颜色沿用 P[key];仅星云类(neb/snr/ring),星系不做。仍是模拟渲染。 */
  var VVS = 'varying vec2 vN;void main(){vN=position.xy;gl_Position=vec4(position.xy,0.0,1.0);}';
  var VFS = [
    'precision highp float;varying vec2 vN;uniform mat4 uIP,uMW;uniform vec3 uC,c0,c1,c2,cS;uniform float uT,uS,uA,uK,uD,uN;', NOISE,
    'float dens(vec3 q,out float w,out float du){float r=length(q);vec3 s=q*1.7+uS;float n=fbm(s+vec3(0.,0.,uT*.02));w=fbm(q*3.3+n*2.2+uS*1.3);',
    ' float e;if(uK<.5){e=smoothstep(1.0,.15,r+(n-.5)*.6);du=uD>0.0?uD*1.6*smoothstep(.48,.66,fbm(q*2.4+n*1.5+uS*2.1))*e:0.0;float g=smoothstep(.38,.85,w);return e*g*g*3.2;}',
    ' if(uK<1.5){float rr=r+(n-.5)*.1;e=exp(-pow((rr-.56)/.1,2.0));du=0.0;return e*pow(w,1.5)*1.6+.08*smoothstep(.55,0.,r)*w;}',
    ' e=exp(-pow((r-.7+(n-.5)*.3)/.25,2.0))+.3*smoothstep(.9,0.,r);float f=1.0-abs(w*2.0-1.0);du=0.0;return e*(pow(f,6.0)*1.1+.05*w);}',
    'void main(){vec4 v=uIP*vec4(vN,1.0,1.0);vec3 rd=normalize(mat3(uMW)*normalize(v.xyz/v.w));',
    ' float b=dot(rd,uC),c=dot(uC,uC)-1.0,h=b*b-c;if(h<0.0)discard;h=sqrt(h);float t0=max(b-h,0.0),t1=b+h;if(t1<=0.0)discard;',
    ' float dt=(t1-t0)/uN,j=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453);vec3 acc=vec3(0.);float tr=1.0;',
    ' for(int i=0;i<64;i++){if(float(i)>=uN||tr<.03)break;float t=t0+(float(i)+j)*dt;vec3 q=t*rd-uC;float w,du;float d=dens(q,w,du);',
    '  vec3 col=mix(c0,c1,smoothstep(.25,.6,w));col=mix(col,c2,smoothstep(.55,.95,w*d*.6+.1));',
    '  acc+=tr*col*d*dt*1.3;tr*=exp(-du*dt*6.0);}',
    ' acc=1.0-exp(-acc*1.15);gl_FragColor=vec4(acc*uA,(1.0-tr)*uA);}'
  ].join('\n');
  var vsc = null, vm = null, vq = 0, vRT = null, bsc = null, bm2 = null, vcc = null;   // 体积画在半分辨率离屏缓冲,再叠回屏幕(省约 3/4 像素)
  function volMat(key) {
    var d = P[key], kk = d.k === 'ring' ? 1 : d.k === 'snr' ? 2 : 0, sat = d.sat || 1.5;
    if (!vsc) { vsc = new T.Scene(); var g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3)); var me = new T.Mesh(g); me.frustumCulled = false; vsc.add(me); }
    if (vm) vm.dispose();
    vm = new T.ShaderMaterial({ vertexShader: VVS, fragmentShader: VFS, transparent: true, depthWrite: false, depthTest: false,
      blending: T.CustomBlending, blendSrc: T.OneFactor, blendDst: T.OneMinusSrcAlphaFactor,
      uniforms: { uIP: { value: new T.Matrix4() }, uMW: { value: new T.Matrix4() }, uC: { value: new T.Vector3() }, uT: { value: 0 }, uS: { value: key.length * 3.7 }, uA: { value: 0 }, uK: { value: kk }, uD: { value: d.dust || 0 },
        uN: { value: [12, 20, 32][tier] }, uOct: { value: [3, 4, 5][tier] }, c0: { value: col(d.c[0], sat) }, c1: { value: col(d.c[1], sat) }, c2: { value: col(d.c[2], sat) }, cS: { value: col(d.st || '#dfe8ff', 1) } } });
    vsc.children[0].material = vm; vq = key;
  }
  function volume(LI, b, dx, dy, dz, tn, tt) {
    var d = P[b.key]; if (!d || d.k === 'gal' || d.k === 'clu') return 0;
    var a = sstep(0.5, 0.95, tn); if (a <= 0.004) return 0;
    if (vq !== b.key || !vm) volMat(b.key);
    var u = vm.uniforms, Rb = b.R || 1, c = LI.cam0; c.updateMatrixWorld();
    u.uIP.value.copy(c.projectionMatrixInverse || new T.Matrix4().copy(c.projectionMatrix).invert()); u.uMW.value.copy(c.matrixWorld);
    u.uC.value.set(dx / Rb, dy / Rb, dz / Rb); u.uT.value = tt; u.uA.value = a;
    var rd = LI.rd, sz = rd.getDrawingBufferSize ? rd.getDrawingBufferSize(new T.Vector2()) : { x: innerWidth, y: innerHeight }, w = Math.max(64, sz.x >> 1), h = Math.max(64, sz.y >> 1);
    if (!vRT) {
      vRT = new T.WebGLRenderTarget(w, h, { depthBuffer: false }); vcc = new T.Color();
      bsc = new T.Scene(); var g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
      bm2 = new T.ShaderMaterial({ vertexShader: 'varying vec2 vU;void main(){vU=position.xy*.5+.5;gl_Position=vec4(position.xy,0.0,1.0);}', fragmentShader: 'precision highp float;varying vec2 vU;uniform sampler2D tV;void main(){gl_FragColor=texture2D(tV,vU);}',
        transparent: true, depthWrite: false, depthTest: false, blending: T.CustomBlending, blendSrc: T.OneFactor, blendDst: T.OneMinusSrcAlphaFactor, uniforms: { tV: { value: vRT.texture } } });
      var bq = new T.Mesh(g, bm2); bq.frustumCulled = false; bsc.add(bq);
    } else if (vRT.width !== w || vRT.height !== h) vRT.setSize(w, h);
    var prev = rd.getRenderTarget(), ca = rd.getClearAlpha(); rd.getClearColor(vcc);
    rd.setRenderTarget(vRT); rd.setClearColor(0x000000, 0); rd.clear(true, false, false); rd.render(vsc, c);
    rd.setRenderTarget(prev); rd.setClearColor(vcc, ca); rd.render(bsc, c); return a;
  }

  var tv = null, tq = null, va = 0;
  function layer(LI) {
    var BY = X._.BY, b = BY && BY.tmpdso, root = X._.root && X._.root();
    var ok = b && !b.off && b.key && P[b.key] && b.wp, want = ok && (X._.S.target === 'tmpdso' || obs);
    if (!want) { if (grp) grp.visible = false; if (tag) tag.style.display = 'none'; vis = 0; va = 0; return; }
    if (cur !== b.key) build(b.key);
    if (!grp) return;
    var S = X._.S, dx = b.wp[0] - S.pos[0], dy = b.wp[1] - S.pos[1], dz = b.wp[2] - S.pos[2], dd = Math.hypot(dx, dy, dz);
    if (!(dd > 0)) { grp.visible = false; return; }
    var tn = (b.R || 1) / dd, ta = Math.max(Math.min(tn, 1.6), 0.0022); ang = Math.atan(tn);   // 半张角正切;远处至少约 0.25°
    grp.visible = true; grp.position.set(dx / dd * R, dy / dd * R, dz / dd * R); grp.lookAt(0, 0, 0); grp.scale.setScalar(R * ta);
    var a = (0.35 + 0.65 * sstep(0.004, 0.06, tn)) * (1 - sstep(0.6, 1.0, tn));   // 远时偏暗;贴近/进入星云时淡出,交给近处体积(C2.6e)
    var tt = rm() ? 0 : (performance.now() - t0) / 1000, pr = LI.rd.getPixelRatio ? LI.rd.getPixelRatio() : 1, H = LI.H || innerHeight;
    var px = ta / Math.tan(Math.PI / 6) * H / 2;   // 星云半径的屏幕像素(cam0 竖直视场 60°)
    for (var i = 0; i < mats.length; i++) { var m = mats[i], u = m.uniforms; u.uA.value = a * m.userData.a; if (u.uT) u.uT.value = tt; if (m.userData.pt) u.uSz.value = pr * Math.max(.6, Math.min(2.2, px / 160)); if (m.userData.vol) { u.uPx.value = px * pr; u.uMax.value = 180 * pr; } }
    vis = a;
    if (a > .003) LI.rd.render(scn, LI.cam0);
    va = volume(LI, b, dx, dy, dz, tn, tt);
    if (!root) return; var tg = mkTag(root);
    if (va > .3) { var W0 = root.clientWidth || innerWidth, H0 = root.clientHeight || innerHeight; tg.style.display = 'flex'; tg.style.transform = 'translate(' + (W0 / 2).toFixed(0) + 'px,' + Math.min(170, H0 * .22).toFixed(0) + 'px) translate(-50%,0)'; var n0 = tg.querySelector('i'), z0 = (b.zh || '') + (dd < (b.R || 1) ? ' 内部' : ' 近处'); if (n0.textContent !== z0) n0.textContent = z0; return; }
    if (px < 26 || a < .2) { tg.style.display = 'none'; return; }
    if (!tv) { tv = new T.Vector3(); tq = new T.Quaternion(); }
    tq.copy(S.q).invert(); tv.set(dx / dd, dy / dd, dz / dd).applyQuaternion(tq);
    var W = root.clientWidth || innerWidth, Hh = root.clientHeight || innerHeight;
    if (tv.z > -0.05) { tg.style.display = 'none'; return; }
    var fy = 1 / Math.tan(Math.PI / 6), fx = fy * Hh / W, x = (tv.x / -tv.z * fx + 1) * W / 2, y = (1 - tv.y / -tv.z * fy) * Hh / 2 + Math.min(px, Hh * .3) + 8;
    if (x < 0 || x > W) { tg.style.display = 'none'; return; }
    x = Math.max(110, Math.min(W - 110, x)); y = Math.max(150, Math.min(Hh - 250, y));   // 星云很大时标签夹在视野内(避开顶部航向条与底部控制台)
    tg.style.display = 'flex'; tg.style.transform = 'translate(' + x.toFixed(0) + 'px,' + y.toFixed(0) + 'px) translate(-50%,0)';
    var nm = tg.querySelector('i'), zh = b.zh || ''; if (nm.textContent !== zh) nm.textContent = zh;
  }
  function observe(key) {
    if (!X || !X.isOpen || !X.isOpen()) return false; var b = X._.BY.tmpdso;
    if (!b || b.off || b.key !== key) { if (!window.SHXDV || !SHXDV.lock(key, '抵达')) return false; }
    obs = true; var S = X._.S; S.auto = false; S.base = 0; S.mult = 1; S.align = true;
    if (window.SHXAN) SHXAN.hide();
    X._.toast('舷窗观测 · 模拟渲染(程序生成,非照片)· 拖动环视,星云下方可看「真实照片」');
    return true;
  }
  function init() {
    T = window.THREE; X = window.SHXC; if (!T || !X || !X.layers || added) return; added = true;
    scn = new T.Scene(); X.layers.bg.push(function (LI) { try { layer(LI); } catch (e) { if (!warned) { warned = true; console.warn('[SHXNB]', e); } } });
  }
  function hook(ev) {
    if (ev === 'open' || ev === 'renderer' || ev === 'frame') { if (!added) init(); }
    if (ev === 'close') { obs = false; if (tag) tag.style.display = 'none'; }
  }
  (function wait(n) { if (window.SHXC && SHXC.on) { SHXC.on(hook); return; } if (n < 150) setTimeout(function () { wait(n + 1); }, 100); })(0);
  window.SHXNB = { has: function (k) { return !!P[k]; }, add: function (k, d) { P[k] = d; }, observe: observe, endObs: function () { obs = false; },
    state: function () { return { cur: cur, vis: +vis.toFixed(3), angDeg: +(ang * 180 / Math.PI).toFixed(2), tier: tier, obs: obs, n: mats.length, va: +va.toFixed(3), tag: !!(tag && tag.style.display === 'flex') }; } };
})();
