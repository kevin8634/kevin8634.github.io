/* 天枢 Starhelm · sh-domain4.js · 星域 IV「太阳系边疆」(v1.0-M3a)
 * 并入「太阳系」3D 场景,把镜头拉到太阳系最外层:
 *  - 五个深空探测器(旅行者 1/2 号、新视野号、先驱者 10/11 号)按 JPL Horizons 快照的真实位置与飞行轨迹(随统一时间轴移动);
 *  - 日球层:太阳风吹出的「泡泡」(外壳 = 日球层顶,内壳 = 终端激波),大小按旅行者号实测穿越距离,形状为示意(迎风面压扁、背风面拉长);
 *  - 星际风粒子从迎风方向吹来、绕过日球层;柯伊伯带与矮行星沿用太阳系场景。
 * 距离:画面沿用太阳系场景的平方根压缩(14·√AU);卡片数值为真实值。守星人:星槎。深链 ?domain=4,任务 sh.voyager。
 */
(function () {
  'use strict';
  var AU = 149597870.7, C_KMS = 299792.458, DEG = Math.PI / 180;
  var PROBES = {
    voyager1: { id: '-31', zh: '旅行者 1 号', en: 'Voyager 1', c: 0xffd27a, launch: '1977-09-05', hp: '2012 年 8 月穿过日球层顶(121.6 AU)', st: '仍在和地球通信(为省电陆续关闭仪器)', dir: '蛇夫座方向' },
    voyager2: { id: '-32', zh: '旅行者 2 号', en: 'Voyager 2', c: 0xffb46a, launch: '1977-08-20', hp: '2018 年 11 月穿过日球层顶(119 AU)', st: '仍在和地球通信(为省电陆续关闭仪器)', dir: '孔雀座方向' },
    newhorizons: { id: '-98', zh: '新视野号', en: 'New Horizons', c: 0x9dffb0, launch: '2006-01-19', hp: '2015 年飞掠冥王星,2019 年飞掠「天涯海角」阿罗科斯', st: '仍在工作,飞越柯伊伯带', dir: '人马座方向' },
    pioneer10: { id: '-23', zh: '先驱者 10 号', en: 'Pioneer 10', c: 0xb0c4ff, launch: '1972-03-03', hp: '第一个飞越木星的探测器', st: '2003 年收到最后一次信号', dir: '金牛座方向' },
    pioneer11: { id: '-24', zh: '先驱者 11 号', en: 'Pioneer 11', c: 0xc9b0ff, launch: '1973-04-06', hp: '第一个飞越土星的探测器', st: '1995 年收到最后一次信号', dir: '盾牌座方向' }
  };
  var D4 = { ready: false, focus: null };
  function toast(m) { if (window.LE && LE.ui && LE.ui.toast) LE.ui.toast(m); }
  function jd(ms) { return ms / 864e5 + 2440587.5; }

  // 插值 / 外推:快照每 90 天一点
  function helio(key, ms) {
    var A = window.SH_PROBES && SH_PROBES[PROBES[key].id]; if (!A) return null;
    var t = jd(ms), n = A.length, i = 0;
    if (t <= A[0][0]) return null;                               // 还没发射
    if (t >= A[n - 1][0]) i = n - 2; else { while (i < n - 2 && A[i + 1][0] < t) i++; }
    var a = A[i], b = A[i + 1], f = (t - a[0]) / (b[0] - a[0]);
    return { x: a[1] + (b[1] - a[1]) * f, y: a[2] + (b[2] - a[2]) * f, z: a[3] + (b[3] - a[3]) * f, v: Math.hypot(b[1] - a[1], b[2] - a[2], b[3] - a[3]) / (b[0] - a[0]) * AU / 86400 };
  }
  function earthEcl(ms) {
    try { var A = window.Astronomy, t = A.MakeTime(new Date(ms)), v = A.HelioVector(A.Body.Earth, t), e = A.RotateVector(A.Rotation_EQJ_ECL(), v); return { x: e.x, y: e.y, z: e.z }; } catch (x) { return { x: 0, y: 0, z: 0 }; }
  }
  function info(key, ms) {
    var h = helio(key, ms); if (!h) return null;
    var e = earthEcl(ms), r = Math.hypot(h.x, h.y, h.z), de = Math.hypot(h.x - e.x, h.y - e.y, h.z - e.z);
    return { au: r, sunKm: r * AU, earthKm: de * AU, lightH: de * AU / C_KMS / 3600, v: h.v, years: (ms - Date.parse(PROBES[key].launch)) / 3.15576e10 };
  }
  D4.info = info; D4.PROBES = PROBES;

  function yi(km) { return (km / 1e8).toFixed(km < 1e10 ? 1 : 0) + ' 亿 km'; }
  function patchCard() {
    var orig = SHNOW.card;
    SHNOW.card = function (el, body, d) {
      var p = PROBES[body]; if (!p) return orig(el, body, d);
      d = d || (window.SHTIME ? SHTIME.now() : new Date());
      var I = info(body, d.getTime()) || { au: 0, sunKm: 0, earthKm: 0, lightH: 0, v: 0, years: 0 };
      var o = { id: body, name: p.zh, en: p.en, distKm: I.earthKm, sunAU: I.au, source: 'NASA/JPL Horizons 轨道快照 · 本机插值' };
      var rows = [['离太阳', I.au.toFixed(1) + ' AU(' + yi(I.sunKm) + ')'], ['速度', I.v.toFixed(1) + ' km/s(相对太阳)'], ['已飞行', I.years.toFixed(1) + ' 年(' + p.launch.slice(0, 4) + ' 年发射)'], ['正飞向', p.dir], ['里程碑', p.hp], ['状态', p.st]];
      var h = '<div class="shnow-h"><b>' + o.name + '</b><small>' + o.en + '</small></div>';
      rows.forEach(function (r) { h += '<div class="shnow-r"><span>' + r[0] + '</span><span>' + r[1] + '</span></div>'; });
      h += '<div class="shnow-s">' + o.source + ' · AU = 日地平均距离</div>';
      el.innerHTML = h; return o;
    };
  }

  /* ---------------- 3D:日球层 + 星际风 + 探测器 ---------------- */
  var NOSE = (function () { var l = 255.4 * DEG, b = 5.2 * DEG; return { x: Math.cos(b) * Math.cos(l), y: Math.cos(b) * Math.sin(l), z: Math.sin(b) }; })();
  function shellGeo(T, SO, auNose, tail) {
    var g = new T.SphereGeometry(1, 96, 64), p = g.attributes.position, v = new T.Vector3(), n = SO.toScene(NOSE).normalize();
    for (var i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i).normalize();
      var c = v.dot(n), au = auNose * (1 + tail * Math.pow((1 - c) / 2, 1.6));
      v.multiplyScalar(14 * Math.sqrt(au)); p.setXYZ(i, v.x, v.y, v.z);
    }
    g.computeVertexNormals(); return g;
  }
  function shellMat(T, col, k) {
    return new T.ShaderMaterial({
      uniforms: { uC: { value: new T.Color(col) }, uT: { value: 0 }, uK: { value: k } }, transparent: true, depthWrite: false, side: T.DoubleSide, blending: T.AdditiveBlending,
      vertexShader: 'varying vec3 vN;varying vec3 vW;varying vec3 vP;void main(){vP=position;vN=normalize(mat3(modelMatrix)*normal);vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}',
      fragmentShader: 'uniform vec3 uC;uniform float uT,uK;varying vec3 vN;varying vec3 vW;varying vec3 vP;' +
        'float h(vec3 p){return fract(sin(dot(p,vec3(12.9898,78.233,37.719)))*43758.5453);}' +
        'void main(){vec3 v=normalize(cameraPosition-vW);float f=pow(1.-abs(dot(normalize(vN),v)),2.2);' +
        'float band=.55+.45*sin(length(vP)*.08-uT*.6+vP.y*.05)*sin(vP.x*.03+uT*.25);float spark=step(.997,h(floor(vP*.9)+floor(uT*2.)));' +
        'gl_FragColor=vec4(uC*(f*1.3*band+spark*.6)*uK,1.);}'
    });
  }
  function glowTex(T, rgb) {
    var c = document.createElement('canvas'); c.width = c.height = 64; var x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.15, 'rgba(' + rgb + ',.9)'); g.addColorStop(0.45, 'rgba(' + rgb + ',.22)'); g.addColorStop(1, 'rgba(' + rgb + ',0)');
    x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new T.CanvasTexture(c);
  }
  function rgbOf(c) { return [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(','); }

  function build() {
    var T = THREE, S = LE.scene, SO = LE.solar, sc = S.solarScene, G = new T.Group(); G.visible = false; sc.add(G); D4.group = G;
    // 日球层顶(外)与终端激波(内)
    var hp = new T.Mesh(shellGeo(T, SO, 121, 1.4), shellMat(T, 0x58c8ff, 0.55)); G.add(hp);
    var ts = new T.Mesh(shellGeo(T, SO, 90, 0.9), shellMat(T, 0xb48cff, 0.32)); G.add(ts);
    D4.shells = [hp, ts];
    // 星际风粒子:从迎风方向吹来,遇到日球层顶沿表面绕过
    var N = innerWidth < 760 ? 1400 : 3200, pos = new Float32Array(N * 3), nose = SO.toScene(NOSE).normalize(), up = new T.Vector3(0, 1, 0).cross(nose).normalize(), side = nose.clone().cross(up).normalize();
    var R0 = 14 * Math.sqrt(121), Rf = R0 * 2.6, P = [];
    function spawn(i, anywhere) { var a = Math.random() * 6.283, r = Math.sqrt(Math.random()) * Rf, s = anywhere ? (Math.random() * 2 - 1) * Rf : Rf; P[i] = { u: Math.cos(a) * r, w: Math.sin(a) * r, s: s, sp: 6 + Math.random() * 6 }; }
    for (var i = 0; i < N; i++) spawn(i, true);
    var pg = new T.BufferGeometry(); pg.setAttribute('position', new T.BufferAttribute(pos, 3).setUsage(T.DynamicDrawUsage));
    var pts = new T.Points(pg, new T.PointsMaterial({ size: 2.2, sizeAttenuation: false, map: glowTex(T, '150,210,255'), color: 0x9fd8ff, transparent: true, opacity: 0.55, depthWrite: false, blending: T.AdditiveBlending }));
    pts.frustumCulled = false; G.add(pts);
    var tmp = new T.Vector3();
    D4.wind = function (dt) {
      for (var i = 0; i < N; i++) {
        var q = P[i]; q.s -= q.sp * dt * 3;
        if (q.s < -Rf) spawn(i, false);
        tmp.copy(nose).multiplyScalar(q.s).addScaledVector(up, q.u).addScaledVector(side, q.w);
        var L = tmp.length(), rr = R0 * (1 + 1.4 * Math.pow((1 - tmp.dot(nose) / (L || 1)) / 2, 1.6)) * 1.04;
        if (L < rr) tmp.multiplyScalar(rr / (L || 1));
        pos[i * 3] = tmp.x; pos[i * 3 + 1] = tmp.y; pos[i * 3 + 2] = tmp.z;
      }
      pg.attributes.position.needsUpdate = true;
    };
    // 探测器:轨迹 + 辉光标记 + 标签
    var box = SO.labels || document.getElementById('solar-labels');
    D4.probes = {};
    Object.keys(PROBES).forEach(function (k) {
      var p = PROBES[k], A = window.SH_PROBES[p.id], col = new T.Color(p.c);
      var line = new T.Line(new T.BufferGeometry(), new T.LineBasicMaterial({ color: col, transparent: true, opacity: 0.55, depthWrite: false, blending: T.AdditiveBlending }));
      line.frustumCulled = false; G.add(line);
      var mk = new T.Sprite(new T.SpriteMaterial({ map: glowTex(T, rgbOf(p.c)), transparent: true, depthWrite: false, blending: T.AdditiveBlending })); mk.scale.setScalar(3); G.add(mk);
      var el = document.createElement('button'); el.type = 'button'; el.className = 'le-plabel is-major sh-probelabel'; el.textContent = p.zh; el.style.visibility = 'hidden';
      el.addEventListener('click', function () { open(k); }); box.appendChild(el);
      D4.probes[k] = { line: line, mk: mk, el: el, A: A, p: new T.Vector3(), lastJ: 0 };
    });
    // 每帧
    var wp = new T.Vector3(), lastT = performance.now();
    S.addUpdater(function () {
      var now = performance.now(), dt = Math.min(0.1, (now - lastT) / 1000); lastT = now;
      var on = S.mode === 'solar' && D4.visible();
      G.visible = on;
      Object.keys(D4.probes).forEach(function (k) { var q = D4.probes[k]; if (!on) q.el.style.visibility = 'hidden'; });
      if (!on) return;
      var ms = SO.simTime || Date.now(), J = jd(ms);
      D4.shells.forEach(function (s) { s.material.uniforms.uT.value = now / 1000; });
      if (!matchMedia('(prefers-reduced-motion: reduce)').matches) D4.wind(dt);
      var camD = S.solarCam.position.length(), mkS = Math.max(1.2, camD * 0.012);
      Object.keys(D4.probes).forEach(function (k) {
        var q = D4.probes[k], h = helio(k, ms);
        if (!h) { q.mk.visible = q.line.visible = false; q.el.style.visibility = 'hidden'; return; }
        q.mk.visible = q.line.visible = true;
        SO.toScene(h, q.p); q.mk.position.copy(q.p); q.mk.scale.setScalar(mkS * (1 + 0.15 * Math.sin(now / 300 + q.p.x)));
        if (Math.abs(J - q.lastJ) > 20) {    // 轨迹:从发射到此刻
          var pts = []; for (var i = 0; i < q.A.length && q.A[i][0] <= J; i++) pts.push(SO.toScene({ x: q.A[i][1], y: q.A[i][2], z: q.A[i][3] }));
          pts.push(q.p.clone()); q.line.geometry.dispose(); q.line.geometry = new T.BufferGeometry().setFromPoints(pts); q.lastJ = J;
        }
        wp.copy(q.p).project(S.solarCam);
        var show = wp.z < 1 && Math.abs(wp.x) < 1.05 && Math.abs(wp.y) < 1.05;
        q.el.style.visibility = show ? 'visible' : 'hidden';
        if (show) q.el.style.transform = 'translate(' + Math.round((wp.x + 1) / 2 * innerWidth + 10) + 'px,' + Math.round((1 - wp.y) / 2 * innerHeight - 10) + 'px)';
      });
    });
    // 点选
    var tv = new T.Vector3();
    S.addPicker({ mode: 'solar', priority: 2, fn: function (ray) {
      if (!G.visible) return null;
      var best = null, o = ray.ray.origin, d = ray.ray.direction;
      Object.keys(D4.probes).forEach(function (k) {
        var q = D4.probes[k]; if (!q.mk.visible) return;
        tv.copy(q.p).sub(o); var dist = tv.length(), ang = Math.acos(Math.max(-1, Math.min(1, tv.dot(d) / dist))), tol = 0.03;
        if (ang < tol && (!best || ang < best.a)) best = { k: k, a: ang };
      });
      return best && { score: 3 - best.a / 0.03, run: function () { open(best.k); } };
    } });
  }
  // 太阳系模式下:镜头拉远到边疆、或聚焦探测器时显示
  D4.visible = function () { var S = LE.scene; return D4.focus || S.solarCam.position.distanceTo(S.solarCtl.target) > 95 || D4.forced; };
  D4.crumb = function () {
    var S = LE.scene; if (S.mode !== 'solar') return null;
    if (D4.focus) return '4|' + PROBES[D4.focus].zh;
    if (S.solarCam.position.distanceTo(S.solarCtl.target) > 95) return '4|太阳系边疆';
    return null;
  };

  function open(k) {
    var p = PROBES[k]; D4.focus = k;
    if (LE.ui.closeCard) LE.ui.closeCard();
    SHHUD.showNow(k, null, ['飞近 ' + p.zh, '旅行者号此刻飞到哪了?']);
    SHHUD.guide('xingcha', k === 'voyager1' ? '它 1977 年出发,是离我们最远的人造物体。给它发条消息,要等多久才能收到回音?' : p.zh + ' 飞了 ' + Math.floor(info(k, Date.now()).years) + ' 年。它现在在哪儿?点开看看。', []);
    if (window.SHDOM && SHDOM.setFocus) SHDOM.setFocus(null);
    if (LE.audio && LE.audio.play) LE.audio.play('lock');
  }
  D4.open = open;
  function flyProbe(k) {
    var S = LE.scene, SO = LE.solar, q = D4.probes[k]; if (!q) return;
    SO.follow = null; var dir = q.p.clone().normalize();
    S.flyTo({ target: q.p.clone(), position: q.p.clone().add(dir.multiplyScalar(14)).add(new THREE.Vector3(0, 6, 0)), ms: 2200, arc: false });
    S.solarCtl.minDistance = 2;
  }
  D4.go = function () {
    var S = LE.scene, SO = LE.solar;
    if (S.mode !== 'solar' && LE.ui.setMode) LE.ui.setMode('solar');
    D4.focus = null;
    setTimeout(function () {
      SO.follow = null;
      var n = SO.toScene(NOSE).normalize(), side = new THREE.Vector3(0, 1, 0).cross(n).normalize();
      S.flyTo({ target: new THREE.Vector3(), position: side.multiplyScalar(470).add(new THREE.Vector3(0, 260, 0)).add(n.multiplyScalar(-140)), ms: 2600, arc: false });
    }, 60);
    SHHUD.guide('xingcha', '这里是太阳系的边疆。那层发光的「泡泡」是太阳风吹出来的日球层。五个探测器正在往外飞,哪一个已经冲出了泡泡?', []);
  };

  /* ---------------- 任务 sh.voyager「旅行者号此刻飞到哪了?」(停靠式面板,3D 场景就是画面) ---------------- */
  var KEY = 'gn:sh:voyager';
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  var ST = load(); ST.stars = ST.stars || [0, 0, 0];
  function save() { try { localStorage.setItem(KEY, JSON.stringify(ST)); } catch (e) { } }
  function h(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function snd(n) { if (window.LE && LE.audio) LE.audio.play(n); }
  var U = {}, L = { q: 0, hints: 0 }, QS = [];
  function qset() {
    var I = info('voyager1', Date.now()), yiKm = Math.round(I.sunKm / 1e8), lh = I.lightH;
    return [
      { q: '旅行者 1 号 1977 年出发,今天离太阳有多远?(在 3D 场景里点开它的此刻卡找答案)', ch: ['约 ' + yiKm + ' 亿 km(' + I.au.toFixed(0) + ' 个日地距离)', '约 59 亿 km(冥王星那么远)', '约 1 光年'], ok: 0,
        hint: ['先点「飞到旅行者 1 号」,再点它的光点,看此刻卡。', '此刻卡的「离太阳」一行就是答案。', '答案是约 ' + yiKm + ' 亿 km。'],
        good: '对!约 ' + yiKm + ' 亿 km,是冥王星的 4 倍多。它每秒还在往外飞 ' + I.v.toFixed(1) + ' km,一年又多出约 5 亿 km。' },
      { q: '地面给旅行者 1 号发一条指令,信号以光速飞过去,要多久才能到?', ch: ['约 ' + Math.round(lh) + ' 小时', '约 ' + Math.round(lh) + ' 分钟', '约 ' + Math.round(lh) + ' 天'], ok: 0,
        hint: ['光一秒走 30 万 km,一小时走约 10.8 亿 km。', '用 ' + Math.round(I.earthKm / 1e8) + ' 亿 km 除以 10.8 亿 km。', '大约要 ' + Math.round(lh) + ' 小时,一来一回差不多两天。'],
        good: '对!单程约 ' + lh.toFixed(1) + ' 小时(本机按此刻距离计算)。工程师今天发出的指令,要到明天才知道它听没听到。' },
      { q: '旅行者 1 号已经离开太阳系了吗?(看看那层发光的泡泡)', ch: ['冲出了太阳风吹出的「泡泡」日球层,但仍在太阳引力范围里', '还没飞出冥王星的轨道', '早已飞到别的恒星旁边'], ok: 0,
        hint: ['2012 年,它测到周围的粒子从太阳风变成了星际物质。', '「太阳系」的边界有两种说法:太阳风的边界,和太阳引力的边界。', '它出了第一道边界;要到达奥尔特云内缘还要约 300 年。'],
        good: '对!它在 2012 年冲出日球层,成为第一个进入星际空间的人造物体。但按太阳引力算,它还在太阳系里:再飞约 300 年到达奥尔特云内缘,穿过它还要约 3 万年。' }];
  }
  function build2() {
    var r = U.root = h('section', 'ml ml--vg ml--dock');
    r.innerHTML = '<header class="ml-hd"><div><small>星域 IV · 星槎 · 太阳系边疆</small><b>旅行者号此刻飞到哪了?</b></div><span class="ml-st"></span><button class="ml-x" type="button" aria-label="关闭">✕</button></header>' +
      '<div class="ml-ctl"><button class="ml-fly" type="button">◎ 飞到旅行者 1 号</button><button class="ml-all" type="button">⤢ 看整个边疆</button></div>' +
      '<div class="ml-guide"><div class="ml-q"></div><div class="ml-ch"></div><div class="ml-gb"><button class="ml-hint" type="button">给我一点提示</button><span class="ml-hs"></span></div></div>' +
      '<div class="ml-note">画面距离按平方根压缩,日球层形状为示意;位置来自 NASA/JPL Horizons。</div>';
    document.body.appendChild(r);
    ['st', 'x', 'fly', 'all', 'q', 'ch', 'hint', 'hs'].forEach(function (k) { U[k] = r.querySelector('.ml-' + k); });
    U.x.onclick = close2; U.hint.onclick = hint;
    U.fly.onclick = function () { flyProbe('voyager1'); D4.focus = 'voyager1'; snd('click'); };
    U.all.onclick = function () { D4.go(); snd('click'); };
  }
  function stars() { U.st.textContent = '★ ' + ST.stars.reduce(function (s, x) { return s + x; }, 0) + ' / 9'; }
  function showQ() {
    stars(); L.hints = 0; U.hs.textContent = ''; U.ch.innerHTML = ''; U.hint.hidden = false;
    if (L.q >= QS.length) { U.q.innerHTML = '<b>三关完成!</b>旅行者号带着一张镀金唱片,录着地球的声音和 55 种语言的问候。它会比地球上的一切都更长久。'; U.hint.hidden = true; return; }
    var Q = QS[L.q]; U.q.innerHTML = '<small>第 ' + (L.q + 1) + ' / 3 关</small>' + Q.q;
    Q.ch.map(function (t, i) { return i; }).sort(function () { return Math.random() - 0.5; }).forEach(function (i) {
      var b = h('button', 'ml-c', Q.ch[i]); b.type = 'button'; b.onclick = function () { answer(i === Q.ok, b); }; U.ch.appendChild(b);
    });
  }
  function answer(ok, b) {
    var Q = QS[L.q];
    if (!ok) { b.classList.add('no'); snd('blip'); U.hs.textContent = '再想想,也可以看一条提示。'; return; }
    var got = Math.max(1, 3 - L.hints); ST.stars[L.q] = Math.max(ST.stars[L.q] || 0, got); save(); snd('arrive');
    if (window.SH && SH.progress && SH.progress.explore) try { SH.progress.explore('voyager'); } catch (e) { }
    U.ch.innerHTML = ''; U.hint.hidden = true;
    U.q.innerHTML = '<small>第 ' + (L.q + 1) + ' 关 · 获得 ' + '★'.repeat(got) + '</small>' + Q.good;
    var n = h('button', 'ml-c ml-c--go', L.q < 2 ? '下一关' : '完成'); n.type = 'button'; n.onclick = function () { L.q++; showQ(); }; U.ch.appendChild(n); stars();
    if (window.SHHUD && SHHUD.refreshTasks) SHHUD.refreshTasks();
  }
  function hint() { var Q = QS[L.q]; if (!Q || L.hints >= 3) return; snd('click'); U.hs.textContent = ['方向', '线索', '半步示范'][L.hints] + ':' + Q.hint[L.hints]; L.hints++; if (L.hints >= 3) U.hint.hidden = true; }
  function open2() {
    if (!U.root) build2();
    if (window.SHHUD && SHHUD.hideNow) SHHUD.hideNow(); D4.go(); U.root.hidden = false; QS = qset(); L.q = ST.stars.indexOf(0); if (L.q < 0) L.q = 3; showQ(); snd('open');
  }
  function close2() { if (U.root) U.root.hidden = true; snd('close'); }
  window.SH = window.SH || {}; SH.voyagerLab = { open: open2, close: close2 };

  function init() {
    patchCard(); build();
    SHHUD.on('fly', function (b) { if (PROBES[b]) flyProbe(b); });
    SHHUD.on('zoomout', function (b) { if (PROBES[b]) { SHHUD.hideNow(); open2(); } });
    SHHUD.on('nowclose', function (b) { if (PROBES[b]) D4.focus = null; });
    LE.bus.on('select', function (e) { if (e && e.kind === 'planet') D4.focus = null; });
    D4.ready = true;
  }
  window.SHD4 = D4;
  (function wait(k) {
    if (window.SHDOM && SHDOM.ready !== false && window.SHHUD && SHHUD.on && window.SHNOW && SHNOW.ok && window.SH_PROBES && window.LE && LE.solar && LE.scene && LE.scene.solarScene && LE.solar.labels !== undefined) {
      try { init(); } catch (e) { console.error('[SHD4]', e); } return;
    }
    if (k > 900) return; setTimeout(function () { wait(k + 1); }, 150);
  })(0);
})();
