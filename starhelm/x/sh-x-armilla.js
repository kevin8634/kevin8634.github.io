/* 天枢 Starhelm · 2.0 · sh-x-armilla.js(SHXARM)
 * Armilla 舰载智能形象:按项目 09_armilla「ARMILLA · 浑天」v2.2.1 的浑天仪造型移植(同系列原创,
 * 环参数 / 环面流光着色器 / 星云粒子 / 核心光晕 / 状态参数均与 09 一致),缩小后挂在天枢号驾驶舱底部正中。
 * 独立的小 WebGLRenderer(透明背景),不进主场景;无 WebGL 时退回 SVG。
 * 状态:IDLE 静候 / LISTENING 聆听 / THINKING 思考 / SPEAKING 说话 / NIGHT 夜息 / ALERT(警告,核心转朱红) */
(function () {
  'use strict';
  var T = window.THREE;  // 在 ok()/mount() 时再取一次(three 可能晚于本脚本加载)
  var COL = { gold: '#e8c27a', goldHi: '#ffd98e', silver: '#cfd6e6', vermilion: '#e5483a' };
  var ST = {
    IDLE: { ringSpeed: 1, align: 0, flow: 1, contract: 0, breath: 0, gain: 1, core: 1, spin: 1 },
    LISTENING: { ringSpeed: .45, align: .82, flow: .55, contract: .22, breath: 0, gain: 1.05, core: 1.35, spin: .6 },
    THINKING: { ringSpeed: 4.2, align: 0, flow: 3.2, contract: .08, breath: 0, gain: 1.08, core: 1.45, spin: 2.6 },
    SPEAKING: { ringSpeed: 1.3, align: .35, flow: 1.4, contract: -.04, breath: 1, gain: 1.08, core: 1.5, spin: 1.3 },
    NIGHT: { ringSpeed: .18, align: 0, flow: .25, contract: .1, breath: 0, gain: .55, core: .55, spin: .25 },
    ALERT: { ringSpeed: 2.2, align: .5, flow: 2, contract: .15, breath: .6, gain: 1.1, core: 1.6, spin: 2 }
  };
  // 09 的七道环:半径、环带宽、管径、颜色、初始倾角、自转轴、转速、刻度数
  var RINGS = [
    { r: 2.95, bw: .2, tube: .016, color: 'gold', tilt: [0, 0, 0], axis: [0, 0, 1], speed: .012, ticks: 360, kind: 'dial' },
    { r: 2.5, bw: .1, tube: .017, color: 'silver', tilt: [0, Math.PI / 2, 0], axis: [0, 1, 0], speed: .1, ticks: 144 },
    { r: 2.32, bw: .12, tube: .014, color: 'gold', tilt: [Math.PI / 2 - .2, 0, .1], axis: [0, 1, 0], speed: -.06, ticks: 144 },
    { r: 2.12, bw: .09, tube: .013, color: 'goldHi', tilt: [Math.PI / 2 - .41, .3, 0], axis: [.2, 1, .1], speed: .14, ticks: 120 },
    { r: 1.94, bw: .08, tube: .012, color: 'silver', tilt: [1.1, -.6, .4], axis: [1, .3, 0], speed: -.18, ticks: 96, bead: true },
    { r: 1.68, bw: .06, tube: .011, color: 'gold', tilt: [.3, 1.2, 0], axis: [.3, 1, .6], speed: .3, ticks: 72 },
    { r: 1.42, bw: 0, tube: .009, color: 'silver', tilt: [1.4, .2, .9], axis: [1, .2, .5], speed: -.42, ticks: 0 }
  ];
  var TERMS = [[2, 4], [2, 19], [3, 5], [3, 20], [4, 4], [4, 20], [5, 5], [5, 21], [6, 5], [6, 21], [7, 7], [7, 22], [8, 7], [8, 23], [9, 7], [9, 23], [10, 8], [10, 23], [11, 7], [11, 22], [12, 7], [12, 21], [1, 5], [1, 20]];
  function termIndex(d) { var v = (d.getMonth() + 1) * 100 + d.getDate(), t = -1, b = -1; TERMS.forEach(function (x, i) { var s = x[0] * 100 + x[1]; if (s <= v && s > b) { t = i; b = s; } }); return t < 0 ? 21 : t; }

  var VS = 'varying vec2 vUv; varying vec3 vN; varying vec3 vV;\nvoid main(){ vUv = uv; vec4 mv = modelViewMatrix * vec4(position,1.0); vV = -mv.xyz; vN = normalMatrix * normal; gl_Position = projectionMatrix * mv; }';
  var FS = 'uniform vec3 uColor; uniform float uDraw, uTime, uIntensity, uGlint, uPhase, uPulse;\nvarying vec2 vUv; varying vec3 vN; varying vec3 vV;\nvoid main(){\n if (vUv.x > uDraw) discard;\n vec3 n = normalize(vN); vec3 v = normalize(vV); float ndv = abs(dot(n, v));\n vec3 L = normalize(vec3(-0.35, 0.85, 0.55)); vec3 h = normalize(L + v);\n float spec = pow(max(dot(n, h), 0.0), 42.0); float rim = pow(1.0 - ndv, 2.2);\n float g = fract(vUv.x - uTime * uGlint + uPhase); float glint = exp(-pow((g - 0.5) * 22.0, 2.0));\n float head = uDraw < 0.999 ? exp(-pow((vUv.x - uDraw) * 70.0, 2.0)) * 5.0 : 0.0;\n vec3 col = uColor * (0.22 + 0.55 * ndv) + uColor * rim * 0.7 + vec3(1.0, 0.93, 0.8) * spec * 2.4;\n col = col * uIntensity + uColor * glint * 2.2 + vec3(1.0, 0.88, 0.62) * head;\n col *= 1.0 + uPulse; gl_FragColor = vec4(col, 1.0);\n}';
  var GVS = 'attribute vec4 aData; attribute vec3 aColor; attribute float aSize;\nuniform float uTime, uFlowT, uExplode, uContract, uBreath, uLevel, uSize, uPR, uDrift;\nvarying vec3 vColor; varying float vTw;\nvec3 flow(vec3 p, float s){ float t = uTime * 0.18; return vec3(sin(p.y*2.7+t+s)-cos(p.z*3.1-t*1.3), sin(p.z*2.3-t*0.9+s*1.7)-cos(p.x*2.9+t), sin(p.x*2.5+t*1.1)-cos(p.y*3.3-t*0.7+s)); }\nvoid main(){\n float r = aData.x; float s = aData.w; float ang = aData.y + uFlowT * 0.8 / (r + 0.5); float e = uExplode;\n float burst = e < 1.0 ? (1.0 - pow(1.0 - e, 3.0)) * (1.0 + 0.35 * sin(e * 3.14159)) : 1.0;\n float rr = r * burst * (1.0 - uContract * (0.4 + 0.6 * r / 2.3)) * (1.0 + uBreath * uLevel * 0.07 * sin(r * 6.0 - uTime * 5.0));\n vec3 p = vec3(cos(ang) * rr, aData.z * burst, sin(ang) * rr); p += flow(p, s) * 0.035 * uDrift * (0.4 + r);\n vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mv;\n float tw = 0.65 + 0.35 * sin(uTime * (1.2 + fract(s * 7.31) * 3.0) + s * 40.0); vTw = tw;\n vColor = aColor * (e < 1.0 ? 1.0 + (1.0 - e) * 2.5 : 1.0);\n gl_PointSize = max(1.0, aSize * uSize * uPR * (19.0 / -mv.z) * (0.75 + 0.25 * tw));\n}';
  var GFS = 'varying vec3 vColor; varying float vTw; uniform float uOpacity;\nvoid main(){ vec2 c = gl_PointCoord - 0.5; float d = length(c); float a = smoothstep(0.5, 0.0, d); a = a * a; gl_FragColor = vec4(vColor * a * vTw * uOpacity, 1.0); }';

  var glowTex = null;
  function glow() {
    if (glowTex) return glowTex;
    var c = document.createElement('canvas'); c.width = c.height = 128; var g = c.getContext('2d'), r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.12, 'rgba(255,255,255,0.75)'); r.addColorStop(.35, 'rgba(255,255,255,0.18)'); r.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = r; g.fillRect(0, 0, 128, 128); glowTex = new T.CanvasTexture(c); if (T.SRGBColorSpace) glowTex.colorSpace = T.SRGBColorSpace; return glowTex;
  }
  function col(k, m) { return new T.Color(COL[k] || k).multiplyScalar(m == null ? 1 : m); }
  function gauss() { var u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
  function ringMat(c, inten, phase) {
    var m = new T.ShaderMaterial({ uniforms: { uColor: { value: c.clone() }, uDraw: { value: 0 }, uTime: { value: 0 }, uIntensity: { value: inten }, uGlint: { value: .05 + Math.random() * .05 }, uPhase: { value: phase }, uPulse: { value: 0 } }, vertexShader: VS, fragmentShader: FS });
    m.userData.base = inten; return m;
  }
  function sprite(c, s) { var sp = new T.Sprite(new T.SpriteMaterial({ map: glow(), color: c, blending: T.AdditiveBlending, depthWrite: false, transparent: true })); sp.scale.setScalar(s); return sp; }

  function Armilla(host, opt) {
    opt = opt || {};
    var me = this; this.host = host; this.state = 'IDLE'; this.p = Object.assign({}, ST.IDLE); this.level = 0; this.draw = 0; this.coreA = 0; this.explode = 0; this.t = 0;
    var mobile = opt.small;
    var R = this.renderer = new T.WebGLRenderer({ alpha: true, antialias: true, premultipliedAlpha: false, powerPreference: 'low-power' });
    R.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); R.setClearColor(0, 0);
    host.appendChild(R.domElement); R.domElement.className = 'xa-gl';
    var S = this.scene = new T.Scene(), cam = this.cam = new T.PerspectiveCamera(30, 1, .1, 100);
    cam.position.set(0, 1.2, 13.2); cam.lookAt(0, 0, 0);
    var G = this.group = new T.Group(); S.add(G);
    // 星云粒子(09 为 6 万颗,这里按尺寸缩到 4500–9000)
    var N = opt.count || (mobile ? 4500 : 9000), aD = new Float32Array(N * 4), aC = new Float32Array(N * 3), aS = new Float32Array(N), cc = new T.Color();
    var gH = col('goldHi'), sv = col('silver'), vi = new T.Color('#8f8cff'), ve = col('vermilion'), wh = new T.Color('#fff4dd');
    for (var i = 0; i < N; i++) {
      var d = Math.random(), r, a, y;
      if (d < .05) { r = Math.abs(gauss()) * .16; a = Math.random() * 6.283; y = gauss() * .07; }
      else if (d < .88) { r = .08 + Math.pow(Math.random(), 1.35) * 1.42; a = (i % 3) / 3 * 6.283 + r * 2.9 + gauss() * (.16 + .1 / (r + .2)); y = gauss() * .045 * (1.15 - r / 1.6); }
      else { r = .3 + Math.random() * 1.35; a = Math.random() * 6.283; y = gauss() * .32; }
      r *= 1.55; y *= 1.3; aD.set([r, a, y, Math.random() * 10], i * 4);
      var f = Math.min(1, r / 2); cc.copy(wh).lerp(gH, Math.min(1, f * 2.2)).lerp(sv, Math.max(0, f - .35) * 1.2);
      if (Math.random() < .18) cc.lerp(vi, .45 * f); if (Math.random() < .012) cc.copy(ve);
      var k = d < .05 ? .8 : .6 + Math.random() * .7; cc.multiplyScalar(k * (.42 - f * .1) * (.22 + .78 * Math.min(1, r / 1.1)) * .85);
      aC.set([cc.r, cc.g, cc.b], i * 3); aS[i] = (d < .05 ? 1.4 + Math.random() : Math.random() < .04 ? 3.2 : .9 + Math.random() * 1.1) * 1.0;
    }
    var gg = new T.BufferGeometry(); gg.setAttribute('position', new T.BufferAttribute(new Float32Array(N * 3), 3)); gg.setAttribute('aData', new T.BufferAttribute(aD, 4)); gg.setAttribute('aColor', new T.BufferAttribute(aC, 3)); gg.setAttribute('aSize', new T.BufferAttribute(aS, 1));
    gg.boundingSphere = new T.Sphere(new T.Vector3(), 4);
    this.gm = new T.ShaderMaterial({ uniforms: { uTime: { value: 0 }, uFlowT: { value: 0 }, uExplode: { value: 0 }, uContract: { value: 0 }, uBreath: { value: 0 }, uLevel: { value: 0 }, uSize: { value: 1 }, uPR: { value: Math.min(devicePixelRatio || 1, 2) }, uDrift: { value: 1 }, uOpacity: { value: 1 } }, vertexShader: GVS, fragmentShader: GFS, transparent: true, depthWrite: false, blending: T.AdditiveBlending });
    var gal = new T.Group(); gal.rotation.set(.42, 0, .16); gal.add(new T.Points(gg, this.gm)); G.add(gal); this.gal = gal;
    // 七道环
    this.rings = [];
    RINGS.forEach(function (q, V) {
      var g = new T.Group(), c = col(q.color), mats = [], silver = q.color === 'silver';
      var m1 = new T.Mesh(new T.TorusGeometry(q.r, q.tube * (opt.small ? 2.6 : 2.0), 8, 240), ringMat(c, silver ? .6 : 1.1, V * .13)); g.add(m1); mats.push(m1.material);
      if (q.bw > 0) {
        var m2 = new T.Mesh(new T.TorusGeometry(q.r - q.bw, q.tube * (opt.small ? 1.4 : 1.1), 6, 240), ringMat(c, silver ? .55 : .8, V * .29 + .5)); g.add(m2); mats.push(m2.material);
        var band = new T.Mesh(new T.RingGeometry(q.r - q.bw, q.r, 160, 1), new T.MeshBasicMaterial({ color: col(q.color, .5), transparent: true, opacity: .07, side: T.DoubleSide, depthWrite: false, blending: T.AdditiveBlending })); g.add(band); g.userData.band = band;
      }
      if (q.ticks) {
        var tn = mobile ? Math.round(q.ticks / 2) : q.ticks, im = new T.InstancedMesh(new T.BoxGeometry(1, 1, 1), new T.MeshBasicMaterial({ color: col(q.color, q.kind === 'dial' ? 1.25 : 1.05), transparent: true, opacity: 0, depthWrite: false }), tn);
        var M4 = new T.Matrix4(), Q4 = new T.Quaternion(), P3 = new T.Vector3(), S3 = new T.Vector3(), Z = new T.Vector3(0, 0, 1), step = q.ticks / tn;
        for (var f2 = 0; f2 < tn; f2++) {
          var fi = Math.round(f2 * step), k2 = fi / q.ticks * Math.PI * 2, big = q.kind === 'dial' ? fi % 15 === 0 : fi % 12 === 0, mid = q.kind === 'dial' ? fi % 5 === 0 : fi % 6 === 0;
          var U = q.bw * (big ? .95 : mid ? .55 : .32), RR = q.r - q.bw * .02 - U / 2;
          P3.set(Math.cos(k2) * RR, Math.sin(k2) * RR, 0); Q4.setFromAxisAngle(Z, k2 - Math.PI / 2); S3.set(big ? .016 : .009, U, .006); M4.compose(P3, Q4, S3); im.setMatrixAt(f2, M4);
        }
        g.add(im); g.userData.ticks = im;
      }
      if (q.bead) { var bd = new T.Mesh(new T.SphereGeometry(.05, 14, 10), new T.MeshBasicMaterial({ color: col('vermilion', 3) })); bd.position.set(q.r - q.bw / 2, 0, 0); g.add(bd); bd.add(sprite(col('vermilion', 1.6), .45)); }
      var tq = new T.Quaternion().setFromEuler(new T.Euler(q.tilt[0], q.tilt[1], q.tilt[2]));
      g.quaternion.copy(tq); G.add(g);
      me.rings.push({ d: q, g: g, mats: mats, tiltQ: tq, axis: new T.Vector3(q.axis[0], q.axis[1], q.axis[2]).normalize(), angle: Math.random() * 6.28, alignOffset: new T.Quaternion().setFromEuler(new T.Euler((V - 3) * .035, (V % 2 ? 1 : -1) * .03 * V, 0)) });
    });
    // 天轴与两端
    this.axisM = new T.Mesh(new T.CylinderGeometry(.008, .008, 6.8, 6), new T.MeshBasicMaterial({ color: col('silver', .9), transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending })); this.axisM.rotation.z = .12; G.add(this.axisM);
    this.caps = [-1, 1].map(function (s) { var c = new T.Mesh(new T.SphereGeometry(.045, 12, 8), new T.MeshBasicMaterial({ color: col('goldHi', 2.2), transparent: true, opacity: 0 })); c.position.set(-Math.sin(.12) * 3.4 * s, Math.cos(.12) * 3.4 * s, 0); G.add(c); return c; });
    // 二十四节气刻度(当前节气为朱红)
    var dial = this.rings[0], ti = termIndex(new Date()), oct = new T.OctahedronGeometry(.045, 0); this.marks = [];
    for (var j = 0; j < 24; j++) { var an = Math.PI / 2 - j / 24 * Math.PI * 2, cur = j === ti, mk = new T.Mesh(oct, new T.MeshBasicMaterial({ color: col(cur ? 'vermilion' : 'gold', cur ? 3.5 : 1.6), transparent: true, opacity: 0 })); mk.position.set(Math.cos(an) * (2.95 - .1), Math.sin(an) * (2.95 - .1), 0); mk.scale.setScalar(cur ? 1.9 : 1); dial.g.add(mk); this.marks.push(mk); }
    // 核心
    var core = new T.Group();
    this.coreBall = new T.Mesh(new T.IcosahedronGeometry(.085, 3), new T.MeshBasicMaterial({ color: col('goldHi', 4) })); core.add(this.coreBall);
    this.g1 = sprite(col('gold', 1.6), 1.6); core.add(this.g1); this.g2 = sprite(col('goldHi', .9), 2.4); core.add(this.g2);
    this.streak = sprite(col('goldHi', .85), 1); this.streak.scale.set(5.5, .06, 1); core.add(this.streak);
    this.halo = sprite(col('gold', .5), 7.5); this.halo.material.opacity = .32; core.add(this.halo);   // 代替 09 的辉光后期
    this.wire = new T.LineSegments(new T.WireframeGeometry(new T.IcosahedronGeometry(.22, 1)), new T.LineBasicMaterial({ color: col('goldHi', 1.6), transparent: true, opacity: .6, blending: T.AdditiveBlending })); core.add(this.wire);
    G.add(core); this.core = core;
    this._q = new T.Quaternion(); this._qa = new T.Quaternion(); this._qs = new T.Quaternion(); this._face = new T.Quaternion(); this._v = new T.Vector3(); this._z = new T.Vector3(0, 0, 1);
    this.t0 = performance.now(); this.resize(); this.last = performance.now(); this.running = false;
  }
  Armilla.prototype.resize = function () { var w = this.host.clientWidth || 120, h = this.host.clientHeight || w; this.renderer.setSize(w, h, false); this.cam.aspect = w / h; this.cam.updateProjectionMatrix(); };
  Armilla.prototype.set = function (s) { if (ST[s]) this.state = s; };
  Armilla.prototype.reveal = function () { this.t0 = performance.now(); };
  Armilla.prototype.step = function (dt) {
    var tgt = ST[this.state], p = this.p, k = 1 - Math.exp(-dt * 2.4); for (var x in tgt) p[x] += (tgt[x] - p[x]) * k;
    this.t += dt; var t = this.t;
    var w = (performance.now() - (this.t0 || 0)) / 1000; this.draw = Math.min(1, w / 2.6); this.explode = Math.min(1, w / 2.2); this.coreA = Math.min(1, w / 1.2);
    // 说话电平:有音频分析时由外部写 level,否则用起伏模拟
    var lvl = this.state === 'SPEAKING' ? (this.ext != null ? this.ext : .45 + .35 * Math.sin(t * 9.3) * Math.sin(t * 3.1 + 1)) : 0; this.level += (lvl - this.level) * Math.min(1, dt * 10);
    var gm = this.gm.uniforms; gm.uTime.value = t; gm.uFlowT.value += dt * p.flow; gm.uExplode.value = this.explode; gm.uContract.value = p.contract; gm.uBreath.value = p.breath; gm.uLevel.value = this.level;
    this.gal.rotation.y += dt * .05 * p.flow;
    var me = this;
    this._v.copy(this.cam.position).normalize(); this._face.setFromUnitVectors(this._z, this._v);
    this.rings.forEach(function (h, l) {
      h.angle += dt * h.d.speed * p.ringSpeed; var c = Math.max(0, Math.min(1, me.draw * 1.6 - l * .09));
      me._qs.setFromAxisAngle(h.axis, h.angle); me._q.multiplyQuaternions(me._qs, h.tiltQ);
      if (h.d.kind === 'dial') { me._qs.setFromAxisAngle(me._z, h.angle); me._qa.multiplyQuaternions(me._face, me._qs); h.g.quaternion.slerpQuaternions(me._q, me._qa, .9); }
      else { me._qa.multiplyQuaternions(me._face, h.alignOffset); me._qs.setFromAxisAngle(me._z, h.angle * .5); me._qa.multiply(me._qs); h.g.quaternion.slerpQuaternions(me._q, me._qa, p.align); }
      h.mats.forEach(function (m) { var u = m.uniforms; u.uDraw.value = c; u.uTime.value = t * (.6 + p.ringSpeed * .4); u.uPulse.value = p.breath * me.level * .55 + (p.core - 1) * .12; u.uIntensity.value = m.userData.base * (.55 + .45 * p.gain); });
      if (h.g.userData.ticks) h.g.userData.ticks.material.opacity = smooth(c, .6, 1) * .9;
      if (h.g.userData.band) h.g.userData.band.material.opacity = .07 * c;
    });
    var s = smooth(this.draw, .55, 1);
    this.marks.forEach(function (m, i) { m.material.opacity = Math.max(0, Math.min(1, s * 1.8 - i / 24 * .8)); });
    this.axisM.material.opacity = .35 * s; this.caps.forEach(function (c) { c.material.opacity = s; });
    var o = this.coreA, a = 1 + .06 * Math.sin(t * 1.6) + this.level * p.breath * .35, r = o * a * (.75 + .25 * p.core);
    this.coreBall.scale.setScalar(Math.max(1e-4, r)); this.g1.scale.setScalar(1.6 * r * (.8 + .2 * p.core)); this.g2.scale.setScalar(2.4 * r); this.g2.material.opacity = .22 * o * Math.min(1.4, p.core) * 2;
    this.streak.scale.set(5.5 * o * (.7 + .3 * p.core), .06 * o, 1); this.streak.material.opacity = .7 * o;
    this.halo.material.opacity = (.22 + .12 * p.core) * o;
    var alert = this.state === 'ALERT'; this.g1.material.color.copy(col(alert ? 'vermilion' : 'gold', 1.6));
    this.wire.rotation.y += dt * .4 * p.spin; this.wire.rotation.x += dt * .17 * p.spin; this.wire.material.opacity = .55 * this.draw;
    this.renderer.render(this.scene, this.cam);
  };
  function smooth(x, a, b) { var t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
  Armilla.prototype.start = function () {
    if (this.running) return; this.running = true; var me = this; this.last = performance.now();
    (function loop() { if (!me.running) return; var n = performance.now(), dt = Math.min(.1, (n - me.last) / 1000); me.last = n; if (!document.hidden) me.step(me.reduced ? dt * .35 : dt); me.raf = requestAnimationFrame(loop); })();
  };
  Armilla.prototype.stop = function () { this.running = false; cancelAnimationFrame(this.raf); };
  Armilla.prototype.dispose = function () { this.stop(); this.renderer.dispose(); if (this.renderer.domElement.parentNode) this.renderer.domElement.remove(); };

  window.SHXARM = {
    ok: function () { T = window.THREE; try { if (!T || !T.WebGLRenderer) return false; var c = document.createElement('canvas'), g = c.getContext('webgl2') || c.getContext('webgl'); if (g) { var x = g.getExtension('WEBGL_lose_context'); if (x) x.loseContext(); } return !!g; } catch (e) { return false; } },   // C2.2a:探测完立即释放
    mount: function (host, opt) { T = window.THREE; var a = new Armilla(host, opt); a.reduced = matchMedia('(prefers-reduced-motion: reduce)').matches; a.start(); return a; }
  };
})();
