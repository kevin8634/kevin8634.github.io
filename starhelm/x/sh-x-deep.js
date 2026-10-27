/* 天枢 Starhelm 2.0 · 穿梭 C1.8 —— 跨星域航图第 3 步:出太阳系(SHXD)
 * - 真实 3D 星空:sh-stars-data.js(HYG v4.1,CC BY-SA 4.0,4,268 颗)按飞船位置实时算方向与视星等;
 *   在太阳系里与原星空贴图一致,飞得越远近星(<100 光年)视差越明显。离日 60–300 AU 逐渐接管,星空贴图压暗成银河背景。
 * - 星座连线:x/sh-x-constel-data.js(d3-celestial,BSD-3),顶点挂在 HYG 星上一起视差移位;穿越日球层顶后淡入,K 键开/关。
 * - 航段事件:终端激波 ~94 AU、日球层顶 ~121.6 AU(旅行者 1 号 2012 实测)、奥尔特云内缘 ~2,000 AU(推测):光环 + 现象解读屏。
 */
(function () {
  'use strict';
  var AU = 149597870.7, LY = 9.4607304725808e12, EPS = 23.4392911 * Math.PI / 180, PC = 3.26156;
  var T, X, inited = false, ST = null, pts, lines, segs = [], lastP = null, lastT = 0, f = 0, linesOn = true, prevR = 0, fired = {}, skyCol = null;

  // 现象解读补充条目
  function addEx() {
    if (!window.SHXE || SHXE.ex.oort) return;
    SHXE.ex.termshock = { t: '终端激波', k: '已证实', b: ['太阳风在这里从超音速骤降到亚音速,像水流冲进池塘时的「水跃」。', '旅行者 1 号 2004 年在约 94 AU 处穿过。'], s: '依据:旅行者 1/2 号等离子体与磁场测量' };
    SHXE.ex.oort = { t: '奥尔特云', k: '推测', b: ['包围太阳系的巨大冰质天体「壳层」,内缘约 2,000 AU,外缘可达约 10 万 AU。', '天体之间相隔极远,飞船穿过时几乎什么也看不见。', '长周期彗星的轨道都指向这里,这是它存在的主要证据。'], s: '依据:Oort 1950 年由彗星轨道推断,尚无直接观测' };
    SHXE.ex.parallax = { t: '恒星视差', k: '已证实', b: ['离开太阳后,近处的恒星(几光年到几十光年)位置会相对远处的星移动,星座开始变形。', '远在几百光年外的星几乎不动。'], s: '依据:盖亚卫星视差测量;星表 HYG v4.1' };
  }

  function eq3(x, y, z, o, k) {   // 赤道 J2000 → three(与驾驶舱 eq2three 相同:y=黄北)
    var yy = y * Math.cos(EPS) + z * Math.sin(EPS), zz = -y * Math.sin(EPS) + z * Math.cos(EPS);
    o[k] = x; o[k + 1] = zz; o[k + 2] = -yy;
  }
  function decode() {
    var R = window.SH_STARS; if (!R) return null;
    var bin = atob(R.d), n = R.n, dv = new DataView(new ArrayBuffer(bin.length)), i;
    for (i = 0; i < bin.length; i++) dv.setUint8(i, bin.charCodeAt(i));
    var P = new Float32Array(n * 3), M = new Float32Array(n), C = new Float32Array(n * 3);
    for (var k = 0; k < n; k++) {
      var o = k * 10; eq3(dv.getInt16(o, true) / 10, dv.getInt16(o + 2, true) / 10, dv.getInt16(o + 4, true) / 10, P, k * 3);
      M[k] = dv.getInt16(o + 6, true) / 100; var c = dv.getInt16(o + 8, true), bv = c === 32767 ? 0.6 : c / 1000;
      var rgb = bvRGB(bv); C[k * 3] = rgb[0]; C[k * 3 + 1] = rgb[1]; C[k * 3 + 2] = rgb[2];
    }
    return { n: n, P: P, M: M, C: C };
  }
  function bvRGB(bv) {
    bv = Math.max(-0.4, Math.min(2, bv)); var t = 4600 * (1 / (0.92 * bv + 1.7) + 1 / (0.92 * bv + 0.62)), x = t / 100, r, g, b;
    if (x <= 66) { r = 255; g = 99.47 * Math.log(x) - 161.12; b = x <= 19 ? 0 : 138.52 * Math.log(x - 10) - 305.04; } else { r = 329.7 * Math.pow(x - 60, -0.1332); g = 288.12 * Math.pow(x - 60, -0.0755); b = 255; }
    function c(v) { return Math.max(0, Math.min(255, v)) / 255; } return [c(r), c(g), c(b)];
  }

  var VS = 'attribute float sz;attribute vec4 cl;varying vec4 vC;uniform float uF;void main(){vC=cl;vC.a*=uF;vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;gl_PointSize=sz;}';
  var FS = 'varying vec4 vC;void main(){vec2 d=gl_PointCoord-.5;float r=length(d)*2.;float a=smoothstep(1.,0.,r);a=a*a;if(a<.01)discard;gl_FragColor=vec4(vC.rgb,vC.a*a);}';

  function init() {
    T = window.THREE; X = window.SHXC; var sky = X && X._ && X._.sky && X._.sky(); if (!T || !sky) return false;
    ST = decode(); if (!ST) return false; addEx();
    var n = ST.n, g = new T.BufferGeometry();
    g.setAttribute('position', new T.BufferAttribute(new Float32Array(n * 3), 3));
    g.setAttribute('sz', new T.BufferAttribute(new Float32Array(n), 1));
    g.setAttribute('cl', new T.BufferAttribute(new Float32Array(n * 4), 4));
    pts = new T.Points(g, new T.ShaderMaterial({ vertexShader: VS, fragmentShader: FS, uniforms: { uF: { value: 0 } }, transparent: true, depthWrite: false, depthTest: false, blending: T.AdditiveBlending }));
    pts.frustumCulled = false; pts.renderOrder = -5; pts.visible = false; sky.add(pts);
    // 星座连线
    var CL = window.SHX_CONSTEL || [];
    CL.forEach(function (c) { c[1].forEach(function (ln) { for (var i = 0; i + 1 < ln.length; i++) segs.push(ln[i], ln[i + 1]); }); });
    segs = segs.map(function (v) {
      if (typeof v === 'number') return v;
      var ra = v[0] * Math.PI / 180, de = v[1] * Math.PI / 180, o = [0, 0, 0]; eq3(Math.cos(de) * Math.cos(ra), Math.cos(de) * Math.sin(ra), Math.sin(de), o, 0); return o;   // 无穷远方向
    });
    var lg = new T.BufferGeometry(); lg.setAttribute('position', new T.BufferAttribute(new Float32Array(segs.length * 3), 3));
    lines = new T.LineSegments(lg, new T.LineBasicMaterial({ color: 0x6fb6ff, transparent: true, opacity: 0, depthWrite: false, depthTest: false }));
    lines.frustumCulled = false; lines.renderOrder = -4; lines.visible = false; sky.add(lines);
    var sg = X._.skyG && X._.skyG(); if (sg) sg.traverse(function (o) { if (o.isMesh && o.material && o.material.color) skyCol = { m: o.material, c: o.material.color.clone() }; });
    addEventListener('keydown', function (e) { if ((e.key === 'k' || e.key === 'K') && X.isOpen() && !/INPUT|TEXTAREA/.test((e.target && e.target.tagName) || '')) { linesOn = !linesOn; X._.toast('星座连线 · ' + (linesOn ? '开' : '关') + '(K)'); } });
    inited = true; return true;
  }

  function sstep(a, b, x) { var t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
  var dpr = Math.min(2, window.devicePixelRatio || 1);
  function update(S) {
    var sx = S.pos[0] / LY, sy = S.pos[1] / LY, sz = S.pos[2] / LY;   // 太阳在原点(日心坐标)
    var P = ST.P, M = ST.M, C = ST.C, n = ST.n, pa = pts.geometry.attributes.position.array, za = pts.geometry.attributes.sz.array, ca = pts.geometry.attributes.cl.array;
    for (var k = 0; k < n; k++) {
      var dx = P[k * 3] - sx, dy = P[k * 3 + 1] - sy, dz = P[k * 3 + 2] - sz, d = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1e-6;
      var m = M[k] + 5 * Math.log10(Math.max(1e-6, d / PC)) - 5;
      pa[k * 3] = dx / d * 900; pa[k * 3 + 1] = dy / d * 900; pa[k * 3 + 2] = dz / d * 900;
      var vis = m < 6.8 && d > 0.02 ? 1 : 0, b = Math.max(0, Math.min(1, (6.8 - m) / 6));
      za[k] = vis ? (1.4 + Math.min(8, Math.pow(Math.max(0, 6.8 - m), 1.25) * 0.9)) * dpr : 0;
      ca[k * 4] = C[k * 3]; ca[k * 4 + 1] = C[k * 3 + 1]; ca[k * 4 + 2] = C[k * 3 + 2]; ca[k * 4 + 3] = vis ? 0.35 + 0.65 * b : 0;
    }
    pts.geometry.attributes.position.needsUpdate = pts.geometry.attributes.sz.needsUpdate = pts.geometry.attributes.cl.needsUpdate = true;
    var la = lines.geometry.attributes.position.array;
    for (var i = 0; i < segs.length; i++) {
      var v = segs[i], x, y, z;
      if (typeof v === 'number') { x = P[v * 3] - sx; y = P[v * 3 + 1] - sy; z = P[v * 3 + 2] - sz; } else { x = v[0]; y = v[1]; z = v[2]; }
      var l = Math.sqrt(x * x + y * y + z * z) || 1; la[i * 3] = x / l * 890; la[i * 3 + 1] = y / l * 890; la[i * 3 + 2] = z / l * 890;
    }
    lines.geometry.attributes.position.needsUpdate = true;
  }

  function ring(txt, col) {
    var root = X._.root && X._.root(); if (!root) return;
    if (!document.getElementById('xd-css')) {
      var s = document.createElement('style'); s.id = 'xd-css';
      s.textContent = '.xd-ring{position:absolute;left:50%;top:46%;width:60vmin;height:60vmin;margin:-30vmin 0 0 -30vmin;border-radius:50%;pointer-events:none;z-index:4;border:2px solid var(--c);box-shadow:0 0 60px var(--c),inset 0 0 80px var(--c);opacity:0;animation:xdR 3.2s ease-out forwards}' +
        '.xd-cap{position:absolute;left:50%;top:22%;transform:translateX(-50%);pointer-events:none;z-index:4;font-size:15px;letter-spacing:.3em;color:#dff2ff;text-shadow:0 0 12px var(--c);opacity:0;animation:xdC 4.5s ease-out forwards;white-space:nowrap}' +
        '@keyframes xdR{0%{transform:scale(.25);opacity:0}15%{opacity:.85}100%{transform:scale(2.4);opacity:0}}@keyframes xdC{0%,100%{opacity:0}15%,70%{opacity:1}}' +
        '@media (prefers-reduced-motion:reduce){.xd-ring{animation:none;display:none}.xd-cap{animation:xdC 4.5s linear forwards}}';
      document.head.appendChild(s);
    }
    var r = document.createElement('div'); r.className = 'xd-ring'; r.style.setProperty('--c', col);
    var c = document.createElement('div'); c.className = 'xd-cap'; c.style.setProperty('--c', col); c.textContent = txt;
    root.appendChild(r); root.appendChild(c); setTimeout(function () { r.remove(); c.remove(); }, 4800);
  }
  var EV = [
    { au: 94, id: 'termshock', out: '终端激波 · 太阳风减速', inn: '返回终端激波以内', col: 'rgba(255,190,120,.7)' },
    { au: 121.6, id: 'heliopause', out: '穿越日球层顶 · 进入星际空间', inn: '返回日球层', col: 'rgba(120,200,255,.8)' },
    { au: 2000, id: 'oort', out: '抵达奥尔特云内缘(推测)', inn: '离开奥尔特云内缘', col: 'rgba(190,210,240,.7)' }
  ];
  function events(r) {
    EV.forEach(function (e) {
      if (prevR && prevR < e.au && r >= e.au) { ring(e.out, e.col); X._.toast(e.out); if (window.SHXE && !fired[e.id]) { fired[e.id] = 1; setTimeout(function () { SHXE.show(e.id); }, 1200); } }
      else if (prevR && prevR >= e.au && r < e.au) X._.toast(e.inn);
    });
    if (prevR && prevR < 400 && r >= 400 && window.SHXE && !fired.parallax) { fired.parallax = 1; setTimeout(function () { SHXE.show('parallax'); }, 600); }
    prevR = r;
  }

  function hook(ev, a) {
    if (ev === 'close') { prevR = 0; return; }
    if (ev !== 'frame') return;
    if (!inited && !init()) return;
    var S = X._.S, r = Math.hypot(S.pos[0], S.pos[1], S.pos[2]) / AU;
    f = sstep(60, 300, r);
    pts.visible = f > 0.001; pts.material.uniforms.uF.value = f;
    var lf = linesOn ? sstep(121.6, 500, r) : 0; lines.visible = lf > 0.001; lines.material.opacity = 0.3 * lf;
    if (skyCol) skyCol.m.color.copy(skyCol.c).multiplyScalar(1 - 0.72 * f);
    var now = performance.now();
    if (pts.visible && (!lastP || now - lastT > 200)) {
      var mv = lastP ? Math.hypot(S.pos[0] - lastP[0], S.pos[1] - lastP[1], S.pos[2] - lastP[2]) : Infinity;
      if (mv > 0.5 * AU || !lastP) { update(S); lastP = S.pos.slice(); }
      lastT = now;
    }
    events(r);
  }
  (function wait(n) { if (window.SHXC && SHXC.on) { SHXC.on(hook); return; } if (n < 100) setTimeout(function () { wait(n + 1); }, 100); })(0);
  window.SHXD = { lines: function (on) { if (on != null) linesOn = !!on; return linesOn; }, state: function () { return { inited: inited, f: f, lines: linesOn, stars: ST ? ST.n : 0, segs: segs.length }; } };
})();
