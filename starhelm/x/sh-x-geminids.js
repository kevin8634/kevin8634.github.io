/* 天枢 Starhelm 2.0 · 本月天象「双子座流星雨」3D 版(v1.0-M4q,2026-12;套用 M4n 狮子座 3D 模板,同一套「地面看/太空看」)
 * A 地面看:所选地点(「我的位置」优先,否则北京)的真实地平天空 —— NASA SVS 星空球(SHFX3D)经 astronomy-engine Rotation_EQJ_HOR
 *   转到当地地平坐标;双子座连线(d3-celestial,BSD-3)、北河二、辐射点 α=112° δ=+33°(IMO 2026)、月亮、太阳高度决定的天光;
 *   流星为面向镜头的光带,沿大圆从辐射点向外飞;35 km/s 中慢速 → 光带划过时间比狮子座长、颜色更多、几乎无余迹;
 *   出现频率 = 1.0 面板粗估的每小时颗数 × 加速倍数(画面注明)。
 * B 太空看:日心黄道 J2000,1 AU = 100 单位;小行星 3200 法厄同轨道根数 JPL SBDB 1034(历元 JD 2461200.5):a 1.27146 AU,
 *   e 0.889672,q 0.140278 AU,i 22.3105°,Ω 265.0988°,ω 322.3002°,tp JD 2461285.6164,P 523.667 d;地球位置 astronomy-engine;
 *   碎屑带为示意粒子(偏移轨道的细丝);对照:淡显 55P/Tempel-Tuttle 轨道(狮子座母彗星,JPL SBDB J985/69)。
 *   极大太阳黄经 262.2°(IMO)。地球与太阳尺寸放大。时间统一北京时间。数据与常数取自 SH.geminidsLab(sh-geminids.js)。
 * 无 THREE / 无 WebGL / 星空模块缺失 → 退回 1.0 平面面板。声音默认关。粒子:桌面 ≤ 2 万,手机 ≤ 6 千;减少动态时不自动播放。 */
(function () {
  'use strict';
  var SH = window.SH = window.SH || {};
  var LAB = SH.geminidsLab; if (!LAB || !LAB.calc) return;
  var open2D = LAB.open, K = LAB.K, DEG = Math.PI / 180, TAU = Math.PI * 2, EPS = 23.4392911 * DEG;
  var MOB = Math.min(screen.width, screen.height) < 700 || matchMedia('(pointer:coarse)').matches;
  var SPEED = 300;   // 流星出现频率加速倍数(画面注明)
  var C = { n: 1, sq: 0, mode: 'A', tA: 0.5, tB: 0, play: false, yaw: 0, pitch: 0.6, fov: MOB ? 92 : 80, bYaw: 0.9, bPitch: 0.55, bDist: 90 };
  try { var sv = JSON.parse(localStorage.getItem('gn:sh:x-geminids') || '{}'); if (sv.mode === 'B') C.mode = 'B'; if (sv.sq >= 0 && sv.sq < 3) C.sq = sv.sq; } catch (e) { }
  function save() { try { localStorage.setItem('gn:sh:x-geminids', JSON.stringify({ mode: C.mode, sq: C.sq })); } catch (e) { } }
  var T, R, U = {}, N = null, RAF = 0, last = 0, built = false;
  function reduced() { return matchMedia('(prefers-reduced-motion: reduce)').matches; }
  function p2(n) { return ('0' + n).slice(-2); }
  function bj(ms) { var d = new Date(ms + 8 * 3600e3); return { mo: d.getUTCMonth() + 1, d: d.getUTCDate(), h: d.getUTCHours(), m: d.getUTCMinutes() }; }
  function hm(ms) { var b = bj(ms); return p2(b.h) + ':' + p2(b.m); }
  function mdhm(ms) { var b = bj(ms); return b.mo + '月' + b.d + '日 ' + p2(b.h) + ':' + p2(b.m); }
  function h(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function A() { return window.Astronomy; }
  function v3(a) { return new T.Vector3(a[0], a[1], a[2]); }
  function eqLocal(raDeg, deDeg) { var r = raDeg * DEG, d = deDeg * DEG; return [Math.cos(d) * Math.cos(r), Math.sin(d), -Math.cos(d) * Math.sin(r)]; }   // 赤道 → three(x 春分点,y 北天极)

  /* ---------- 公用:文字精灵、软点贴图 ---------- */
  function label(txt, col, px) {
    px = px || 30; var c = document.createElement('canvas'), g = c.getContext('2d'); g.font = '600 ' + px + 'px "Noto Sans SC","PingFang SC","Microsoft YaHei",sans-serif';
    var w = Math.ceil(g.measureText(txt).width) + 16; c.width = w; c.height = px + 16; g = c.getContext('2d'); g.font = '600 ' + px + 'px "Noto Sans SC","PingFang SC","Microsoft YaHei",sans-serif';
    g.shadowColor = 'rgba(0,0,0,.9)'; g.shadowBlur = 6; g.fillStyle = col || '#dfe6f3'; g.textBaseline = 'middle'; g.fillText(txt, 8, c.height / 2);
    var tx = new T.CanvasTexture(c); if (T.SRGBColorSpace) tx.colorSpace = T.SRGBColorSpace;
    var s = new T.Sprite(new T.SpriteMaterial({ map: tx, transparent: true, depthWrite: false, depthTest: false, toneMapped: false }));
    s.userData.ar = c.width / c.height; s.renderOrder = 20; return s;
  }
  function sizeLabel(s, hgt) { s.scale.set(hgt * s.userData.ar, hgt, 1); }
  var DOT = null;
  function dotTex() {
    if (DOT) return DOT; var c = document.createElement('canvas'); c.width = c.height = 64; var g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.25, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    DOT = new T.CanvasTexture(c); return DOT;
  }
  function glowSprite(col, op) { var s = new T.Sprite(new T.SpriteMaterial({ map: dotTex(), color: col, transparent: true, opacity: op == null ? 1 : op, blending: T.AdditiveBlending, depthWrite: false, toneMapped: false })); return s; }

  // 与 sh-x-deep.js C2.0 同一修正:SVS 星图以 0h 为图像中心,skyMesh 的 UV 把 0h 放在接缝 → 绕赤道极轴(网格本地 y)转 180°
  function raFix(g) { g.children.forEach(function (m) { if (m.isMesh) m.rotation.y += Math.PI; }); }
  /* ---------- 星表(双子座连线顶点) ---------- */
  var STARV = null;
  function starDir(i) {
    if (!STARV) {
      var S = window.SH_STARS; if (!S || !S.d) return null;
      var bin = atob(S.d), buf = new ArrayBuffer(bin.length), u8 = new Uint8Array(buf); for (var k = 0; k < bin.length; k++) u8[k] = bin.charCodeAt(k);
      STARV = new Int16Array(buf);
    }
    var x = STARV[i * 5], y = STARV[i * 5 + 1], z = STARV[i * 5 + 2], l = Math.hypot(x, y, z) || 1;
    return [x / l, z / l, -y / l];   // J2000 赤道 → three 局部
  }
  function leoLines(r) {
    var L = (window.SHX_CONSTEL || []).filter(function (c) { return c[0] === 'Gem'; })[0]; if (!L) return null;
    var pos = [];
    L[1].forEach(function (poly) {
      var pts = poly.map(function (v) { return typeof v === 'number' ? starDir(v) : eqLocal(v[0], v[1]); });
      for (var i = 0; i + 1 < pts.length; i++) { if (!pts[i] || !pts[i + 1]) continue; pos.push(pts[i][0] * r, pts[i][1] * r, pts[i][2] * r, pts[i + 1][0] * r, pts[i + 1][1] * r, pts[i + 1][2] * r); }
    });
    var g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    return new T.LineSegments(g, new T.LineBasicMaterial({ color: 0x7fe3ff, transparent: true, opacity: .55, depthWrite: false, toneMapped: false }));
  }

  /* ================= A 地面看 ================= */
  var SA = {};
  function buildA() {
    var sc = SA.scene = new T.Scene(), RS = 900;
    SA.cam = new T.PerspectiveCamera(C.fov, 1, 0.1, 5000);
    SA.sky = new T.Group(); SA.sky.matrixAutoUpdate = false; sc.add(SA.sky);
    var eqG = new T.Group(); eqG.rotation.x = EPS; SA.sky.add(eqG);          // skyMesh 自带 -EPS → 合成后为赤道局部系
    SA.stars = window.SHFX3D.skyMesh(R, RS); raFix(SA.stars); eqG.add(SA.stars);
    SA.starMat = null; SA.stars.traverse(function (o) { if (o.isMesh) SA.starMat = o.material; });
    SA.leo = leoLines(RS * 0.98); if (SA.leo) SA.sky.add(SA.leo);
    var rd = eqLocal(K.RA, K.DEC); SA.rad = v3(rd);
    var ring = new T.Mesh(new T.RingGeometry(9, 11, 48), new T.MeshBasicMaterial({ color: 0xffc46b, transparent: true, opacity: .9, side: T.DoubleSide, depthWrite: false, toneMapped: false }));
    ring.position.copy(SA.rad).multiplyScalar(RS * 0.97); ring.lookAt(0, 0, 0); SA.sky.add(ring); SA.ring = ring;
    var rg = glowSprite(0xffc46b, .55); rg.scale.set(60, 60, 1); rg.position.copy(ring.position); SA.sky.add(rg);
    SA.radL = label('辐射点', '#ffd27a', 28); SA.radL.position.copy(SA.rad).multiplyScalar(RS * 0.95); SA.sky.add(SA.radL);
    SA.leoL = label('双子座 Gemini', '#a9eeff', 30); SA.leoL.position.copy(v3(eqLocal(101, 21))).multiplyScalar(RS * 0.95); SA.sky.add(SA.leoL);
    SA.casL = label('北河二', '#d8f4ff', 24); SA.casL.position.copy(v3(eqLocal(117.2, 29.6))).multiplyScalar(RS * 0.95); SA.sky.add(SA.casL);
    // 天光:按太阳高度与方位给地平附近加亮;光污染按天空条件
    SA.glowU = { sunDir: { value: new T.Vector3(0, -1, 0) }, sunAlt: { value: -30 }, lp: { value: 0 } };
    SA.glow = new T.Mesh(new T.SphereGeometry(RS * 0.9, 64, 32), new T.ShaderMaterial({
      uniforms: SA.glowU, side: T.BackSide, transparent: true, depthWrite: false, blending: T.AdditiveBlending, toneMapped: false,
      vertexShader: 'varying vec3 vD;void main(){vD=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader: 'uniform vec3 sunDir;uniform float sunAlt,lp;varying vec3 vD;void main(){float e=max(vD.y,0.);' +
        'float tw=clamp((sunAlt+18.)/18.,0.,1.);float day=clamp((sunAlt+4.)/8.,0.,1.);float near=pow(max(dot(normalize(vec3(vD.x,0.,vD.z)),normalize(vec3(sunDir.x,0.,sunDir.z))),0.),3.);' +
        'vec3 c=vec3(.10,.22,.48)*tw*tw*(.35+.65*near)*exp(-e*3.)+vec3(.42,.60,.95)*day*(.6+.4*(1.-e))+vec3(.9,.5,.25)*tw*near*exp(-e*9.)*.5;' +
        'c+=vec3(.55,.36,.2)*lp*exp(-e*6.)+vec3(.05,.05,.07)*lp*.6;gl_FragColor=vec4(c,1.);}'
    })); sc.add(SA.glow);
    // 地面:远山剪影(程序噪声)+ 地面
    var seg = 256, pos = [], idx = [], RG = 600;
    for (var i = 0; i <= seg; i++) {
      var a = i / seg * TAU, hh = 6 + 9 * Math.sin(a * 3 + 1.3) * Math.sin(a * 7 + .4) + 5 * Math.sin(a * 17 + 2.1) + 2.2 * Math.sin(a * 41);
      hh = Math.max(2, hh + 8); var x = Math.sin(a) * RG, z = -Math.cos(a) * RG;
      pos.push(x, -40, z, x, hh, z);
      if (i < seg) { var b = i * 2; idx.push(b, b + 2, b + 1, b + 1, b + 2, b + 3); }
    }
    var hg = new T.BufferGeometry(); hg.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); hg.setIndex(idx);
    SA.hillMat = new T.MeshBasicMaterial({ color: 0x05080d, side: T.DoubleSide, toneMapped: false }); sc.add(new T.Mesh(hg, SA.hillMat));
    var gd = new T.Mesh(new T.CircleGeometry(RG + 5, 64), SA.hillMat); gd.rotation.x = -Math.PI / 2; gd.position.y = -2; sc.add(gd);
    // 远处小镇灯光
    for (var j = 0; j < 40; j++) { var aa = (0.7 + Math.random() * 0.5) * Math.PI, l = glowSprite(0xffb070, .5); l.scale.set(4, 4, 1); l.position.set(Math.sin(aa) * 560, 3 + Math.random() * 3, -Math.cos(aa) * 560); sc.add(l); }
    ['北', '东', '南', '西'].forEach(function (t, i) { var s = label(t, '#9fb3cf', 34); var a = i * Math.PI / 2; s.position.set(Math.sin(a) * 500, 40, -Math.cos(a) * 500); sizeLabel(s, 26); sc.add(s); });
    // 月亮
    SA.moon = glowSprite(0xfff4dc, 1); SA.moon.scale.set(26, 26, 1); sc.add(SA.moon);
    SA.moonHalo = glowSprite(0xbfd2ff, .35); SA.moonHalo.scale.set(140, 140, 1); sc.add(SA.moonHalo);
    // 流星光带池
    var NM = MOB ? 60 : 140; SA.NM = NM; SA.met = [];
    var mg = new T.BufferGeometry(), mp = new Float32Array(NM * 4 * 3), mc = new Float32Array(NM * 4 * 3), mi = [];
    for (var m = 0; m < NM; m++) { var o = m * 4; mi.push(o, o + 1, o + 2, o + 2, o + 1, o + 3); SA.met.push({ on: false }); }
    mg.setAttribute('position', new T.BufferAttribute(mp, 3)); mg.setAttribute('color', new T.BufferAttribute(mc, 3)); mg.setIndex(mi);
    SA.mGeo = mg; SA.mMesh = new T.Mesh(mg, new T.MeshBasicMaterial({ vertexColors: true, transparent: true, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, toneMapped: false }));
    SA.mMesh.frustumCulled = false; SA.mMesh.renderOrder = 15; sc.add(SA.mMesh);
    SA.acc = 0;
  }
  function hor2world(v) { return [-v.y, v.z, -v.x]; }   // astronomy HOR(x 北, y 西, z 天顶) → three(x 东, y 上, z 南)
  function setSkyTime(ms) {
    var a = A(), t = a.MakeTime(new Date(ms)), ob = new a.Observer(N.loc.lat, N.loc.lng, 50), rot = a.Rotation_EQJ_HOR(t, ob);
    function f(x, y, z) { return hor2world(a.RotateVector(rot, new a.Vector(x, y, z, t))); }
    var cx = f(1, 0, 0), cy = f(0, 0, 1), cz = f(0, -1, 0);   // 局部 (1,0,0)=EQJ x;(0,1,0)=EQJ z;(0,0,1)=−EQJ y
    SA.sky.matrix.set(cx[0], cy[0], cz[0], 0, cx[1], cy[1], cz[1], 0, cx[2], cy[2], cz[2], 0, 0, 0, 0, 1); SA.sky.matrixWorldNeedsUpdate = true;
    SA.radW = SA.rad.clone().applyMatrix4(SA.sky.matrix).normalize();
    var se = a.Equator(a.Body.Sun, t, ob, true, true), sh = a.Horizon(t, ob, se.ra, se.dec, 'normal');
    var me = a.Equator(a.Body.Moon, t, ob, true, true), mh = a.Horizon(t, ob, me.ra, me.dec, 'normal'), ill = a.Illumination(a.Body.Moon, t).phase_fraction;
    function hv(alt, az) { return new T.Vector3(Math.cos(alt * DEG) * Math.sin(az * DEG), Math.sin(alt * DEG), -Math.cos(alt * DEG) * Math.cos(az * DEG)); }
    SA.glowU.sunDir.value.copy(hv(sh.altitude, sh.azimuth)); SA.glowU.sunAlt.value = sh.altitude; SA.glowU.lp.value = [0.08, 0.35, 0.9][C.sq];
    var dark = Math.max(0, Math.min(1, (-sh.altitude - 6) / 12)), moonUp = mh.altitude > 0 ? ill : 0;
    var k = dark * (1 - 0.45 * moonUp) * [1, 0.8, 0.5][C.sq];
    if (SA.starMat) SA.starMat.color.setRGB(0.78 * k + 0.02, 0.8 * k + 0.02, 0.86 * k + 0.02);
    if (SA.leo) SA.leo.material.opacity = 0.25 + 0.4 * dark;
    var mp = hv(mh.altitude, mh.azimuth).multiplyScalar(700); SA.moon.position.copy(mp); SA.moonHalo.position.copy(mp);
    SA.moon.visible = SA.moonHalo.visible = mh.altitude > -1; SA.moonHalo.material.opacity = 0.12 + 0.35 * ill; SA.moon.material.opacity = 0.35 + 0.65 * ill;
    var hc = 0.02 + 0.18 * (1 - dark); SA.hillMat.color.setRGB(hc * 0.25, hc * 0.32, hc * 0.45);
    SA.now = { ms: ms, sun: sh.altitude, moon: mh.altitude, ill: ill, ralt: Math.asin(Math.max(-1, Math.min(1, SA.radW.y))) / DEG };
    SA.rate = rateAt(ms);
  }
  function rateAt(ms) {   // 与 1.0 面板同一粗估:ZHR × sin(辐射点高度) × r^(极限星等−6.5)
    var S = N.S, i = Math.max(0, Math.min(S.length - 1, Math.round((ms - N.t0) / (N.t1 - N.t0) * (S.length - 1)))); return S[i].rate;
  }
  function spawn(fire) {
    var m = null; for (var i = 0; i < SA.NM; i++) if (!SA.met[i].on) { m = SA.met[i]; break; } if (!m) return;
    var rad = SA.radW, up = Math.abs(rad.y) > .9 ? new T.Vector3(1, 0, 0) : new T.Vector3(0, 1, 0);
    var e1 = new T.Vector3().crossVectors(rad, up).normalize(), e2 = new T.Vector3().crossVectors(rad, e1).normalize();
    for (var tries = 0; tries < 8; tries++) {
      var rho = (12 + Math.random() * 70) * DEG, ph = Math.random() * TAU;
      var axis = e1.clone().multiplyScalar(Math.cos(ph)).addScaledVector(e2, Math.sin(ph));      // 位置角方向
      var p0 = rad.clone().multiplyScalar(Math.cos(rho)).addScaledVector(axis, Math.sin(rho));
      if (p0.y > Math.sin(8 * DEG)) break; p0 = null;
    }
    if (!p0) return;
    var len = (fire ? 18 : 5) + Math.random() * (fire ? 16 : 14) * Math.sin(rho);
    m.on = true; m.rho = rho; m.ax = axis; m.len = len * DEG; m.dur = (fire ? 2.2 : 0.9) + Math.random() * 0.8; m.age = 0; m.fire = !!fire;   // 35 km/s:约为狮子座两倍的划过时间
    var CC = [[1, 0.98, 0.9], [1, 0.85, 0.55], [0.8, 0.92, 1], [0.75, 1, 0.8], [1, 0.95, 0.7]];
    m.w = fire ? 6.5 : 2.6 + Math.random() * 1.8; m.col = CC[Math.floor(Math.random() * CC.length)]; m.train = 0;   // 亮、颜色多,几乎不留余迹
  }
  function gc(m, d) { var r = m.rho + d; return SA.radW.clone().multiplyScalar(Math.cos(r)).addScaledVector(m.ax, Math.sin(r)); }
  function updMeteors(dt) {
    var r = SA.rate || 0, dark = SA.now && SA.now.sun < -12;
    if (dark && r > 0 && SA.radW.y > -0.05) {
      SA.acc += dt * r / 3600 * SPEED;
      while (SA.acc > 1) { SA.acc -= 1; spawn(Math.random() < 0.08); }
    } else SA.acc = 0;
    var P = SA.mGeo.attributes.position.array, Cc = SA.mGeo.attributes.color.array, cam = SA.cam.position, RM = 820;
    for (var i = 0; i < SA.NM; i++) {
      var m = SA.met[i], o = i * 12;
      if (!m.on) { for (var k = 0; k < 12; k++) { P[o + k] = 0; Cc[o + k] = 0; } continue; }
      m.age += dt; var u = m.age / m.dur, tr = m.train && u > 1 ? Math.max(0, 1 - (u - 1) * m.dur / m.train) : 0;
      if (u > 1 && tr <= 0) { m.on = false; i--; continue; }
      var hu = Math.min(u, 1), head = gc(m, m.len * hu), tail = gc(m, m.len * Math.max(0, hu - 0.55));
      var a = head.clone().multiplyScalar(RM), b = tail.clone().multiplyScalar(RM), dir = a.clone().sub(b), side = new T.Vector3().crossVectors(dir, a.clone().sub(cam)).normalize().multiplyScalar(m.w);
      var I = u <= 1 ? Math.sin(Math.PI * Math.min(1, u * 1.15)) : 0.35 * tr, It = u <= 1 ? 0 : 0.25 * tr;
      var q = [a.x + side.x, a.y + side.y, a.z + side.z, a.x - side.x, a.y - side.y, a.z - side.z, b.x + side.x * .3, b.y + side.y * .3, b.z + side.z * .3, b.x - side.x * .3, b.y - side.y * .3, b.z - side.z * .3];
      for (k = 0; k < 12; k++) P[o + k] = q[k];
      for (k = 0; k < 2; k++) { Cc[o + k * 3] = m.col[0] * I; Cc[o + k * 3 + 1] = m.col[1] * I; Cc[o + k * 3 + 2] = m.col[2] * I; }
      for (k = 2; k < 4; k++) { Cc[o + k * 3] = It * .6; Cc[o + k * 3 + 1] = It; Cc[o + k * 3 + 2] = It * .8; }
    }
    SA.mGeo.attributes.position.needsUpdate = true; SA.mGeo.attributes.color.needsUpdate = true;
  }
  function aimA() {
    var r = SA.radW, alt = Math.asin(Math.max(-1, Math.min(1, r.y)));
    C.yaw = Math.atan2(r.x, -r.z); C.pitch = Math.max(12 * DEG, Math.min(48 * DEG, alt * 0.62));   // 双子座辐射点常很高:抬头更多,仍留一线地平 C.fov = MOB ? 92 : 80;   // 让地平线与辐射点同在画面里
  }
  function camA() {
    var c = SA.cam; c.fov = C.fov; c.position.set(0, 1.6, 0);
    var d = new T.Vector3(Math.cos(C.pitch) * Math.sin(C.yaw), Math.sin(C.pitch), -Math.cos(C.pitch) * Math.cos(C.yaw));
    c.lookAt(d.add(c.position)); c.updateProjectionMatrix();
    var hgt = 18 * C.fov / 60; sizeLabel(SA.radL, hgt); sizeLabel(SA.leoL, hgt * 1.05); sizeLabel(SA.casL, hgt * 0.8);
    SA.radL.position.copy(SA.rad).multiplyScalar(855).add(new T.Vector3(0, -32, 0).applyMatrix4(new T.Matrix4().copy(SA.sky.matrix).invert()));
  }

  /* ================= B 太空看 ================= */
  var SB = {}, EL = { e: 0.8896722828590742, q: 0.140277789008092, i: 22.31052712044692, O: 265.0988062126765, w: 322.3001681121405, tp: 2461285.616437578962, P: 523.6665662331453 };
  var EL55 = { e: 0.905552720972412, q: 0.976427915467506, i: 162.486575379434, O: 235.270989149082, w: 172.5002736828059 };
  var AU = 100;
  function ecl2three(x, y, z) { return new T.Vector3(x * AU, z * AU, -y * AU); }
  function orbPos(nu, el) {
    el = el || EL; var p = el.q * (1 + el.e), r = p / (1 + el.e * Math.cos(nu)), u = el.w * DEG + nu, O = el.O * DEG, i = el.i * DEG;
    return [r * (Math.cos(O) * Math.cos(u) - Math.sin(O) * Math.sin(u) * Math.cos(i)), r * (Math.sin(O) * Math.cos(u) + Math.cos(O) * Math.sin(u) * Math.cos(i)), r * Math.sin(u) * Math.sin(i)];
  }
  function cometNu(ms) {
    var jd = ms / 864e5 + 2440587.5, M = ((jd - EL.tp) / EL.P * TAU) % TAU; if (M < 0) M += TAU; if (M > Math.PI) M -= TAU;
    var E = M, e = EL.e; for (var k = 0; k < 60; k++) E = E - (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
    return 2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2));
  }
  function earthEcl(ms) {
    var a = A(), t = a.MakeTime(new Date(ms)), v = a.HelioVector(a.Body.Earth, t), r = a.RotateVector(a.Rotation_EQJ_ECL(), v); return [r.x, r.y, r.z];
  }
  function line(pts, col, op) { var g = new T.BufferGeometry().setFromPoints(pts); return new T.Line(g, new T.LineBasicMaterial({ color: col, transparent: true, opacity: op, depthWrite: false, toneMapped: false })); }
  function buildB() {
    var sc = SB.scene = new T.Scene(); SB.cam = new T.PerspectiveCamera(50, 1, 0.1, 50000);
    var sky = window.SHFX3D.skyMesh(R, 20000, 0x50525a); raFix(sky); sc.add(sky);
    if (window.SHFX3D.sun) { try { SB.sun = window.SHFX3D.sun({ radius: 4 }); sc.add(SB.sun.group); } catch (e) { SB.sun = null; } }
    if (!SB.sun) { var s = glowSprite(0xffe2a0, 1); s.scale.set(16, 16, 1); sc.add(s); }
    var sg = glowSprite(0xffd28a, .5); sg.scale.set(60, 60, 1); sc.add(sg);
    sc.add(new T.AmbientLight(0xffffff, 0.08)); var pl = new T.PointLight(0xffffff, 3, 0, 0); sc.add(pl);
    // 行星轨道:地球(真实)+ 金星、火星(示意圆)
    var ep = []; for (var d = 0; d <= 366; d += 2) { var e = earthEcl(Date.UTC(2026, 0, 1) + d * 864e5); ep.push(ecl2three(e[0], e[1], e[2])); }
    sc.add(line(ep, 0x7fe3ff, .7));
    [[0.723, 0xffc98a], [1.524, 0xff8a6a]].forEach(function (p) { var q = []; for (var k = 0; k <= 128; k++) { var a = k / 128 * TAU; q.push(new T.Vector3(Math.cos(a) * p[0] * AU, 0, -Math.sin(a) * p[0] * AU)); } sc.add(line(q, p[1], .25)); });
    // 法厄同轨道(完整椭圆)+ 对照:55P 轨道(淡紫,只画内太阳系一段)
    var op = []; for (var k = -180; k <= 180; k += 0.5) { var o = orbPos(k * DEG); op.push(ecl2three(o[0], o[1], o[2])); }
    sc.add(line(op, 0xffd27a, .55));
    var o5 = []; for (var k5 = -150; k5 <= 150; k5 += 0.5) { var q5 = orbPos(k5 * DEG, EL55); o5.push(ecl2three(q5[0], q5[1], q5[2])); }
    sc.add(line(o5, 0xc9b0ff, .28));
    // 尘埃带:5 股细丝(轨道根数小偏移,示意)+ 弥散
    var NP = MOB ? 5600 : 18000, pos = new Float32Array(NP * 3), col = new Float32Array(NP * 3);
    var FIL = [[0, 0, 0, 1], [0.25, -0.15, 0.004, .8], [-0.3, 0.2, -0.006, .7], [0.5, 0.1, 0.009, .55], [-0.55, -0.3, -0.011, .5]];
    for (var n = 0; n < NP; n++) {
      var f = FIL[n % FIL.length], el = { e: EL.e, q: EL.q + f[2] + (Math.random() - .5) * 0.006, i: EL.i + (Math.random() - .5) * 0.25, O: EL.O + f[0] + (Math.random() - .5) * 0.25, w: EL.w + f[1] + (Math.random() - .5) * 0.3 };
      var nu = Math.random() < 0.45 ? (Math.random() < .5 ? 1 : -1) * (120 + Math.random() * 55) * DEG : (Math.random() - .5) * 358 * DEG;   // 地球相遇处在真近点角约 ±145°,加密示意
      var pp = orbPos(nu, el), sp = 0.012 * Math.sqrt(Math.abs(nu) / Math.PI + .2);
      var v = ecl2three(pp[0] + (Math.random() - .5) * sp, pp[1] + (Math.random() - .5) * sp, pp[2] + (Math.random() - .5) * sp);
      pos[n * 3] = v.x; pos[n * 3 + 1] = v.y; pos[n * 3 + 2] = v.z;
      var w = f[3] * (0.5 + Math.random() * .5), gold = Math.random() < .55;
      col[n * 3] = (gold ? 1 : .62) * w; col[n * 3 + 1] = (gold ? .86 : .82) * w; col[n * 3 + 2] = (gold ? .6 : 1) * w;
    }
    var dg = new T.BufferGeometry(); dg.setAttribute('position', new T.BufferAttribute(pos, 3)); dg.setAttribute('color', new T.BufferAttribute(col, 3));
    SB.dust = new T.Points(dg, new T.PointsMaterial({ size: MOB ? 1.1 : 0.8, map: dotTex(), vertexColors: true, transparent: true, opacity: .8, blending: T.AdditiveBlending, depthWrite: false, sizeAttenuation: true, toneMapped: false }));
    sc.add(SB.dust);
    // 地球(放大)+ 穿越辉光
    SB.earth = new T.Mesh(new T.SphereGeometry(1.6, 48, 24), new T.MeshStandardMaterial({ color: 0x3a74c8, emissive: 0x0a1424, roughness: .8, metalness: 0 })); sc.add(SB.earth);
    SB.eGlow = glowSprite(0x9fd8ff, .5); SB.eGlow.scale.set(12, 12, 1); sc.add(SB.eGlow);
    SB.hit = glowSprite(0xd9f7c8, 0); SB.hit.scale.set(26, 26, 1); sc.add(SB.hit);
    SB.comet = glowSprite(0xffe6b0, 1); SB.comet.scale.set(8, 8, 1); sc.add(SB.comet);
    SB.lSun = label('太阳', '#ffd27a'); sizeLabel(SB.lSun, 5); SB.lSun.position.set(0, 9, 0); sc.add(SB.lSun);
    SB.lEarth = label('地球', '#a9eeff'); sc.add(SB.lEarth);
    SB.lComet = label('3200 法厄同(小行星)', '#ffe6b0'); sc.add(SB.lComet);
    var l5p = orbPos(-60 * DEG, EL55); SB.l55 = label('对照:55P 彗星轨道(狮子座)', '#c9b0ff'); sizeLabel(SB.l55, 3); SB.l55.position.copy(ecl2three(l5p[0], l5p[1], l5p[2])).add(new T.Vector3(0, 5, 0)); sc.add(SB.l55);
    var nd = earthEcl(K.PEAK); SB.node = ecl2three(nd[0], nd[1], nd[2]);
    SB.lDust = label('法厄同碎屑带(示意)', '#ffd9a0'); sizeLabel(SB.lDust, 3.2); SB.lDust.position.copy(SB.node).add(new T.Vector3(0, -11, 0)); sc.add(SB.lDust);
  }
  function setB(ms) {
    var e = earthEcl(ms), ep = ecl2three(e[0], e[1], e[2]); SB.earth.position.copy(ep); SB.eGlow.position.copy(ep); SB.hit.position.copy(ep);
    var lam = ((Math.atan2(e[1], e[0]) / DEG) + 180 + 360) % 360;   // 太阳黄经
    var z = LAB.zhrAt(ms); SB.hit.material.opacity = Math.min(.9, Math.max(0, (z - 2) / (K.ZHR - 2))) * .9;
    sizeLabel(SB.lEarth, 2.6); SB.lEarth.position.copy(ep).add(new T.Vector3(0, 4, 0));
    var nu = cometNu(ms), cp = orbPos(nu), cv = ecl2three(cp[0], cp[1], cp[2]); SB.comet.position.copy(cv);
    var rr = Math.hypot(cp[0], cp[1], cp[2]); SB.cr = rr; sizeLabel(SB.lComet, Math.max(6, rr * 2.5)); SB.lComet.position.copy(cv).add(new T.Vector3(0, Math.max(8, rr * 3.5), 0));
    SB.lam = lam; SB.ms = ms; SB.ep = ep;
  }
  function camB() {
    var c = SB.cam, tg = SB.ep || new T.Vector3();
    var d = new T.Vector3(Math.cos(C.bPitch) * Math.sin(C.bYaw), Math.sin(C.bPitch), Math.cos(C.bPitch) * Math.cos(C.bYaw)).multiplyScalar(C.bDist);
    c.position.copy(tg).add(d); c.lookAt(tg); c.updateProjectionMatrix();
  }

  /* ================= 界面 ================= */
  function css() {
    if (document.getElementById('xgm-css')) return;
    var s = h('style'); s.id = 'xgm-css'; s.textContent = [
      '#xgm{position:fixed;inset:0;z-index:200;background:#02040a;color:#dfe6f3;font-family:"Rajdhani","Noto Sans SC","PingFang SC","Microsoft YaHei",sans-serif;user-select:none}',
      '#xgm[hidden]{display:none}#xgm canvas{position:absolute;inset:0;width:100%;height:100%;touch-action:none;cursor:grab}',
      '#xgm .g{background:rgba(8,16,30,.62);border:1px solid rgba(127,227,255,.28);border-radius:12px;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}',
      '#xgm .top{position:absolute;left:14px;right:14px;top:12px;display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:8px 10px}',
      '#xgm .ttl{font-size:18px;font-weight:700;margin-right:6px;white-space:nowrap}#xgm .ttl small{color:#ffd27a;font-weight:600;margin-left:6px;font-size:13px}',
      '#xgm button{font:inherit;font-size:14px;color:#dfe6f3;background:rgba(127,227,255,.07);border:1px solid rgba(127,227,255,.3);border-radius:9px;padding:6px 11px;cursor:pointer;white-space:nowrap}',
      '#xgm button.on{background:rgba(127,227,255,.26);border-color:#7fe3ff;color:#fff}#xgm button:focus-visible{outline:2px solid #ffd27a}',
      '#xgm .sp{flex:1}#xgm .grp{display:flex;gap:4px}',
      '#xgm .info{position:absolute;right:14px;top:74px;width:290px;padding:12px 14px;font-size:14px;line-height:1.55}',
      '#xgm .info h3{margin:0 0 6px;font-size:16px;color:#ffd27a}#xgm .info b{color:#fff}#xgm .info .mut{color:#8fa3bf;font-size:12px}',
      '#xgm .bot{position:absolute;left:14px;right:14px;bottom:12px;padding:10px 12px;display:flex;gap:10px;align-items:center;flex-wrap:wrap}',
      '#xgm .now{min-width:150px;font-size:20px;font-weight:700}#xgm .now small{display:block;font-size:12px;color:#8fa3bf;font-weight:500}',
      '#xgm .rng{flex:1;min-width:220px;position:relative;height:30px}#xgm .rng input{position:absolute;inset:0;width:100%;margin:0;opacity:0;cursor:pointer}',
      '#xgm .bar{position:absolute;left:0;right:0;top:12px;height:6px;border-radius:3px;background:rgba(127,227,255,.15)}#xgm .win{position:absolute;top:10px;height:10px;border-radius:5px;background:rgba(255,210,122,.45)}',
      '#xgm .knob{position:absolute;top:6px;width:18px;height:18px;margin-left:-9px;border-radius:50%;background:#ffd27a;box-shadow:0 0 10px #ffd27a}',
      '#xgm .tk{position:absolute;top:22px;font-size:11px;color:#8fa3bf;transform:translateX(-50%)}#xgm .rd{font-size:13px;color:#b9c7da;min-width:210px}',
      '#xgm .note{position:absolute;left:16px;bottom:84px;font-size:12px;color:#8fa3bf;text-shadow:0 1px 3px #000}',
      'body.xgm-on #shx-badge{display:none}@media (max-height:520px){#xgm .info{display:none}#xgm .note{top:auto;bottom:80px}}',
      '@media (max-width:760px){#xgm .top{left:8px;right:8px;top:8px;padding:6px 8px;gap:5px}#xgm .bot{left:8px;right:8px;bottom:8px;padding:8px}#xgm .info{left:8px;right:8px;width:auto;top:auto;bottom:178px;max-height:104px;overflow:auto;font-size:12.5px;padding:8px 10px}#xgm .info h3{font-size:14px}#xgm .info .mut{display:none}#xgm .rd{min-width:0;width:100%}#xgm .ttl{font-size:15px}#xgm button{font-size:13px;padding:5px 8px}#xgm .note{bottom:auto;top:188px;left:10px}}'
    ].join('\n'); document.head.appendChild(s);
  }
  function build() {
    T = window.THREE; css();
    var root = U.root = h('div'); root.id = 'xgm'; root.hidden = true; root.setAttribute('role', 'dialog'); root.setAttribute('aria-label', '本月天象 · 双子座流星雨 3D');
    try {
      R = new T.WebGLRenderer({ antialias: !MOB, alpha: false, powerPreference: 'high-performance' });
    } catch (e) { R = null; }
    if (!R) return false;
    R.setPixelRatio(Math.min(MOB ? 1.5 : 2, devicePixelRatio || 1)); if (T.SRGBColorSpace) R.outputColorSpace = T.SRGBColorSpace;
    root.appendChild(R.domElement);
    var top = h('div', 'top g');
    top.innerHTML = '<div class="ttl">☄ 双子座流星雨<small>本月天象 · 2.0</small></div>' +
      '<div class="grp" data-k="mode"><button data-v="A">地面看</button><button data-v="B">太空看</button></div>' +
      '<div class="grp" data-k="n"></div><div class="grp" data-k="sq"></div><div class="sp"></div>' +
      '<button data-k="hear" title="双子座 35 km/s 与狮子座 71 km/s,速度映射音高">♪ 听速度</button><button data-k="lab" title="1.0 数据卡与 3 关小游戏">数据与闯关</button><button data-k="x" aria-label="关闭">✕</button>';
    root.appendChild(top); U.top = top;
    K.NIGHTS.forEach(function (n, i) { var b = h('button', '', n[1]); b.dataset.v = i; top.querySelector('[data-k=n]').appendChild(b); });
    K.SKYQ.forEach(function (n, i) { var b = h('button', '', n[1]); b.dataset.v = i; top.querySelector('[data-k=sq]').appendChild(b); });
    top.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return; var g = b.parentNode.dataset.k, k = b.dataset.k;
      if (k === 'x') return close(); if (k === 'hear') { if (LAB.hear) LAB.hear(); return; } if (k === 'lab') { close(); open2D(); return; }
      if (g === 'mode') { C.mode = b.dataset.v; save(); sync(); }
      if (g === 'n') { C.n = +b.dataset.v; recalc(true); }
      if (g === 'sq') { C.sq = +b.dataset.v; save(); recalc(false); }
    });
    U.info = h('div', 'info g'); root.appendChild(U.info);
    U.note = h('div', 'note'); root.appendChild(U.note);
    var bot = h('div', 'bot g');
    bot.innerHTML = '<button data-k="play" aria-label="播放">▶</button><div class="now"></div><div class="rng"><div class="bar"></div><div class="win"></div><div class="knob"></div><input type="range" min="0" max="1" step="0.001" aria-label="时间"></div><div class="rd"></div>';
    root.appendChild(bot); U.bot = bot; U.now = bot.querySelector('.now'); U.rd = bot.querySelector('.rd'); U.rng = bot.querySelector('input'); U.knob = bot.querySelector('.knob'); U.win = bot.querySelector('.win'); U.rngBox = bot.querySelector('.rng');
    bot.querySelector('[data-k=play]').onclick = function () { C.play = !C.play; this.textContent = C.play ? '❚❚' : '▶'; };
    U.rng.addEventListener('input', function () { if (C.mode === 'A') C.tA = +this.value; else C.tB = +this.value; applyT(); });
    document.body.appendChild(root);
    // 拖动看天 / 滚轮缩放
    var cv = R.domElement, drag = null;
    cv.addEventListener('pointerdown', function (e) { drag = { x: e.clientX, y: e.clientY }; cv.setPointerCapture(e.pointerId); cv.style.cursor = 'grabbing'; });
    cv.addEventListener('pointermove', function (e) {
      if (!drag) return; var dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag = { x: e.clientX, y: e.clientY };
      if (C.mode === 'A') { var k = C.fov / cv.clientHeight * DEG; C.yaw -= dx * k; C.pitch = Math.max(-5 * DEG, Math.min(89 * DEG, C.pitch + dy * k)); }
      else { C.bYaw -= dx * 0.006; C.bPitch = Math.max(-1.45, Math.min(1.45, C.bPitch + dy * 0.006)); }
    });
    cv.addEventListener('pointerup', function () { drag = null; cv.style.cursor = 'grab'; });
    cv.addEventListener('wheel', function (e) { e.preventDefault(); if (C.mode === 'A') C.fov = Math.max(25, Math.min(100, C.fov * (e.deltaY > 0 ? 1.08 : 0.92))); else C.bDist = Math.max(12, Math.min(3000, C.bDist * (e.deltaY > 0 ? 1.12 : 0.89))); }, { passive: false });
    buildA(); buildB(); built = true; return true;
  }
  function chips() {
    U.top.querySelectorAll('[data-k=mode] button').forEach(function (b) { b.classList.toggle('on', b.dataset.v === C.mode); });
    U.top.querySelectorAll('[data-k=n] button').forEach(function (b) { b.classList.toggle('on', +b.dataset.v === C.n); b.style.display = C.mode === 'A' ? '' : 'none'; });
    U.top.querySelectorAll('[data-k=sq] button').forEach(function (b) { b.classList.toggle('on', +b.dataset.v === C.sq); b.style.display = C.mode === 'A' ? '' : 'none'; });
  }
  function recalc(reAim) {
    N = LAB.calc(C.n, C.sq);
    if (reAim) { C.tA = N.w0 ? ((N.w0 + N.w1) / 2 - N.t0) / (N.t1 - N.t0) : N.best && N.best.rate > 0 ? (N.best.ms - N.t0) / (N.t1 - N.t0) : 0.5; }   // 默认停在最佳时段中间
    sync(reAim);
  }
  function B0() { return K.ACT0; } function B1() { return K.ACT1; }
  function sync(reAim) {
    chips();
    var ticks = U.rngBox.querySelectorAll('.tk'); ticks.forEach(function (t) { t.remove(); });
    if (C.mode === 'A') {
      U.win.style.display = N.w0 ? '' : 'none';
      if (N.w0) { U.win.style.left = ((N.w0 - N.t0) / (N.t1 - N.t0) * 100) + '%'; U.win.style.width = Math.max(1, (N.w1 - N.w0) / (N.t1 - N.t0) * 100) + '%'; }
      for (var i = 0; i <= 4; i++) { var ms = N.t0 + (N.t1 - N.t0) * i / 4, t = h('div', 'tk', hm(ms)); t.style.left = (i * 25) + '%'; U.rngBox.appendChild(t); }
      U.info.innerHTML = '<h3>' + N.loc.name + ' · ' + K.NIGHTS[C.n][1] + '</h3>' +
        '极大 <b>北京时间 ' + mdhm(K.PEAK) + '</b>(IMO 2026)<br>ZHR ≈ <b>' + K.ZHR + '</b> · 速度 35 km/s(狮子座 71)<br>' +
        (N.w0 ? '最佳时段 <b>' + hm(N.w0) + '–' + hm(N.w1) + '</b><br>' : '当夜辐射点未在暗夜升起<br>') +
        (N.mset ? '月落 ' + hm(N.mset) + ' · ' : '') + (N.rr ? '辐射点升起 ' + hm(N.rr) : '') +
        '<div class="mut">拖动画面四处看,滚轮缩放。流星多少按 ZHR × 辐射点高度 × 天空条件粗估,时间为北京时间。</div>';
      U.note.textContent = '流星出现频率已加速 ' + SPEED + ' 倍 · 星空与月亮按所选地点实时计算';
      if (reAim !== false) { setSkyTime(N.t0 + (N.t1 - N.t0) * C.tA); aimA(); }
    } else {
      U.win.style.display = '';
      var p0 = (K.PEAK - 2 * 864e5 - B0()) / (B1() - B0()), p1 = (K.PEAK + 2 * 864e5 - B0()) / (B1() - B0());
      U.win.style.left = (p0 * 100) + '%'; U.win.style.width = ((p1 - p0) * 100) + '%';
      [Date.UTC(2026, 11, 3, 16), Date.UTC(2026, 11, 7, 16), Date.UTC(2026, 11, 11, 16), Date.UTC(2026, 11, 15, 16), Date.UTC(2026, 11, 19, 16)].forEach(function (ms) {
        var t = h('div', 'tk', bj(ms).mo + '/' + bj(ms).d); t.style.left = ((ms - B0()) / (B1() - B0()) * 100) + '%'; U.rngBox.appendChild(t);
      });
      if (!C.tB) C.tB = (Math.min(Math.max(Date.now(), B0()), B1() - 1) - B0()) / (B1() - B0());
      U.info.innerHTML = '<h3>为什么小行星也能下流星雨?</h3>金线是小行星 3200 法厄同的轨道:近日点只有 0.14 AU,比水星还近,岩石反复被烤裂掉渣,碎屑沿轨道铺成一条带。每年 12 月中旬地球穿过它,碎屑以 35 km/s 撞进大气。<br>' +
        '极大:太阳黄经 <b>262.2°</b> ≈ 北京时间 <b>' + mdhm(K.PEAK) + '</b><br>淡紫线是狮子座的母彗星 55P:彗星靠冰升华喷出尘埃,与地球迎头相撞,速度 71 km/s。' +
        '<div class="mut">轨道根数 JPL SBDB;碎屑细丝位置为示意;地球、太阳尺寸放大。拖动旋转,滚轮远近。</div>';
      U.note.textContent = '大小与距离为示意 · 时间为北京时间';
    }
    applyT();
  }
  function applyT() {
    var t = C.mode === 'A' ? C.tA : C.tB; U.rng.value = t; U.knob.style.left = (t * 100) + '%';
    if (C.mode === 'A') {
      var ms = N.t0 + (N.t1 - N.t0) * t; setSkyTime(ms); var n = SA.now;
      U.now.innerHTML = hm(ms) + '<small>' + mdhm(ms).split(' ')[0] + ' · 北京时间</small>';
      var lim = n.sun > -12 ? '天还亮,看不到' : n.ralt <= 0 ? '辐射点在地平线下' : '约每小时 <b>' + Math.round(SA.rate) + '</b> 颗(粗估)';
      U.rd.innerHTML = '辐射点高度 ' + Math.round(n.ralt) + '° · ' + (n.moon > 0 ? '月亮在天上(' + Math.round(n.ill * 100) + '% 亮)' : '月亮已落') + '<br>' + lim;
    } else {
      var ms2 = B0() + (B1() - B0()) * t; setB(ms2);
      U.now.innerHTML = mdhm(ms2).split(' ')[0] + '<small>' + hm(ms2) + ' · 北京时间</small>';
      var dd = (ms2 - K.PEAK) / 864e5;
      U.rd.innerHTML = '太阳黄经 ' + SB.lam.toFixed(2) + '° · ' + (Math.abs(dd) < 0.5 ? '<b>正在穿过尘埃带中心</b>' : dd < 0 ? '距穿越中心 ' + (-dd).toFixed(1) + ' 天' : '已穿过 ' + dd.toFixed(1) + ' 天') + '<br>法厄同此刻距太阳 ' + SB.cr.toFixed(2) + ' AU';
    }
  }
  function resize() {
    if (!R || U.root.hidden) return; var w = innerWidth, hh = innerHeight; R.setSize(w, hh, false);
    SA.cam.aspect = SB.cam.aspect = w / hh;
  }
  function frame(now) {
    RAF = requestAnimationFrame(frame); var dt = Math.min(0.05, (now - (last || now)) / 1000); last = now;
    if (C.play) {
      if (C.mode === 'A') { C.tA += dt / 60; if (C.tA > 1) C.tA = 0; } else { C.tB += dt / 40; if (C.tB > 1) C.tB = 0; }
      applyT();
    }
    if (C.mode === 'A') { updMeteors(dt); camA(); R.render(SA.scene, SA.cam); }
    else { if (SB.sun && SB.sun.update) SB.sun.update(dt, SB.cam); camB(); R.render(SB.scene, SB.cam); }
  }
  function open() {
    if (!A() || !window.THREE || !window.SHFX3D) return open2D();
    if (!built) { var ok = false; try { ok = build(); } catch (e) { console.warn('[x-geminids]', e); ok = false; } if (!ok) { LAB.open = open2D; return open2D(); } }
    U.root.hidden = false; document.body.classList.add('xgm-on');
    var now = Date.now(); C.n = now < Date.UTC(2026, 11, 14, 22) ? 1 : 2;
    resize(); recalc(true); C.play = false; U.bot.querySelector('[data-k=play]').textContent = '▶';
    last = 0; if (!RAF) RAF = requestAnimationFrame(frame);
    if (window.LE && LE.audio && LE.audio.play) LE.audio.play('open');
  }
  function close() {
    if (!U.root) return; U.root.hidden = true; document.body.classList.remove('xgm-on'); if (RAF) cancelAnimationFrame(RAF); RAF = 0;
    if (window.LE && LE.audio && LE.audio.play) LE.audio.play('close');
  }
  addEventListener('resize', resize);
  addEventListener('keydown', function (e) { if (e.key === 'Escape' && U.root && !U.root.hidden) { e.stopPropagation(); close(); } }, true);
  LAB.open3D = open; LAB.open = open; LAB.close3D = close;
  // 深链 ?task=geminids 可能在本文件载入前已打开 1.0 平面面板 → 换成 3D
  if (/[?&]task=geminids\b/.test(location.search)) (function chk(n) {
    var d2 = document.querySelector('.ml--gm:not([hidden])');
    if (d2) { LAB.close(); open(); return; }
    if (U.root && !U.root.hidden) return; if (n < 100) setTimeout(function () { chk(n + 1); }, 150);
  })(0);
})();
