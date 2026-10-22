/* 天枢 Starhelm · sh-comet.js(v1.0-M3c)—— 星域 IV 新任务 sh.comet「彗星的尾巴为什么总背着太阳?」
 * 3D:哈雷彗星(1P/Halley)按真实轨道根数(JPL SBDB:a 17.834 AU,e 0.96714,i 162.26°,Ω 58.42°,ω 111.33°,1986-02-09 过近日点)在太阳系场景中运行;
 *     彗核 + 彗发辉光;离子尾(蓝,太阳风吹出,笔直背向太阳)与尘埃尾(黄白,光压推出,沿轨道弯曲)两套粒子,亮度和长度随离太阳距离变化(约 4 AU 内才长出尾巴)。
 * 任务面板停靠在右侧,时间滑块在 2061 年近日点前后 ±400 天拖动;3 关,存 gn:sh:comet;?task=comet。尾巴长度为示意放大,方向与轨道为真实。 */
(function () {
  'use strict';
  var DEG = Math.PI / 180, AU = 149597870.7;
  var HALLEY = { kepler: { a: 17.834, e: 0.96714, I: 162.26, Omega: 58.42, omega: 111.33, M0: 0, epochJD: 2446470.5 } };
  var T_PERI = Date.UTC(2061, 6, 28);
  var K = { on: false, t: T_PERI - 120 * 864e5 };
  function jd(ms) { return ms / 864e5 + 2440587.5; }
  function glowTex(rgb) {
    var c = document.createElement('canvas'); c.width = c.height = 64; var x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.2, 'rgba(' + rgb + ',.8)'); g.addColorStop(0.55, 'rgba(' + rgb + ',.18)'); g.addColorStop(1, 'rgba(' + rgb + ',0)');
    x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c);
  }
  function helioAt(ms) {
    var SO = LE.solar, n = 0.9856076686 / Math.pow(HALLEY.kepler.a, 1.5), M = ((n * (jd(ms) - HALLEY.kepler.epochJD)) % 360) * DEG;
    return SO.helio(HALLEY, ms, M);
  }
  function build() {
    var T = THREE, S = LE.scene, SO = LE.solar, G = new T.Group(); G.visible = false; S.solarScene.add(G); K.group = G;
    // 轨道线
    var pts = []; for (var i = 0; i <= 720; i++) pts.push(SO.toScene(SO.helio(HALLEY, 0, i / 2 * DEG)));
    G.add(new T.Line(new T.BufferGeometry().setFromPoints(pts), new T.LineBasicMaterial({ color: 0x7fd4ff, transparent: true, opacity: 0.35, depthWrite: false })));
    var core = new T.Sprite(new T.SpriteMaterial({ map: glowTex('210,240,255'), blending: T.AdditiveBlending, transparent: true, depthWrite: false })); G.add(core);
    var coma = new T.Sprite(new T.SpriteMaterial({ map: glowTex('120,220,200'), blending: T.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0.7 })); G.add(coma);
    function tail(n, rgb, size) {
      var g = new T.BufferGeometry(), p = new Float32Array(n * 3), a = new Float32Array(n);
      g.setAttribute('position', new T.BufferAttribute(p, 3).setUsage(T.DynamicDrawUsage));
      var m = new T.PointsMaterial({ size: size, map: glowTex(rgb), transparent: true, opacity: 0.8, depthWrite: false, blending: T.AdditiveBlending, sizeAttenuation: true });
      var pt = new T.Points(g, m); pt.frustumCulled = false; G.add(pt);
      var P = []; for (var i = 0; i < n; i++) P.push({ age: Math.random(), life: 0.6 + Math.random() * 0.8, o: new T.Vector3(), v: new T.Vector3() });
      return { pt: pt, pos: p, P: P, n: n };
    }
    var ion = tail(innerWidth < 760 ? 900 : 2200, '110,180,255', 0.35), dust = tail(innerWidth < 760 ? 900 : 2200, '255,225,160', 0.45);
    var lbl = document.createElement('button'); lbl.type = 'button'; lbl.className = 'le-plabel is-major sh-cometlabel'; lbl.textContent = '哈雷彗星'; lbl.style.visibility = 'hidden';
    (SO.labels || document.body).appendChild(lbl); lbl.onclick = function () { fly(); };
    var C = new T.Vector3(), C2 = new T.Vector3(), sunDir = new T.Vector3(), vel = new T.Vector3(), wp = new T.Vector3(), last = performance.now();
    K.pos = C;
    S.addUpdater(function () {
      var now = performance.now(), dt = Math.min(0.05, (now - last) / 1000); last = now;
      var on = S.mode === 'solar' && (K.on || (window.SHD4 && SHD4.ready && SHD4.visible()));
      G.visible = on; if (!on) { lbl.style.visibility = 'hidden'; return; }
      var h = helioAt(K.t), r = Math.hypot(h.x, h.y, h.z); K.r = r;
      var px = C.x, py = C.y, pz = C.z;
      SO.toScene(h, C); SO.toScene(helioAt(K.t + 864e5), C2);
      if (K.on && K.follow && K.had) { var dx = C.x - px, dy = C.y - py, dz = C.z - pz; S.solarCam.position.x += dx; S.solarCam.position.y += dy; S.solarCam.position.z += dz; S.solarCtl.target.x += dx; S.solarCtl.target.y += dy; S.solarCtl.target.z += dz; }
      K.had = true; vel.subVectors(C2, C).normalize();
      sunDir.copy(C).normalize();                         // 背向太阳
      var act = r > 4.5 ? 0 : Math.min(1, Math.pow(1.2 / Math.max(r, 0.5), 1.6)); K.act = act;
      core.position.copy(C); core.scale.setScalar(0.5 + act * 0.6); coma.position.copy(C); coma.scale.setScalar(0.6 + act * 3.2); coma.material.opacity = 0.2 + act * 0.6;
      var Lion = act * 26, Ldust = act * 15, cam = S.solarCam.position.distanceTo(C);
      ion.pt.material.size = dust.pt.material.size = Math.max(0.3, cam * 0.012);
      [ion, dust].forEach(function (tl, j) {
        for (var i = 0; i < tl.n; i++) {
          var q = tl.P[i]; q.age += dt / q.life * (K.on ? 0.9 : 0.6);
          if (q.age >= 1) { q.age = 0; q.o.copy(C); q.v.set((Math.random() - .5), (Math.random() - .5), (Math.random() - .5)).multiplyScalar(j ? 0.18 : 0.06); }
          var s = q.age;
          if (j === 0) wp.copy(q.o).addScaledVector(sunDir, s * Lion).addScaledVector(q.v, s * 6);                               // 离子尾:直
          else wp.copy(q.o).addScaledVector(sunDir, s * Ldust).addScaledVector(vel, -s * s * Ldust * 0.55).addScaledVector(q.v, s * 10);   // 尘埃尾:弯,落在轨道后方
          if (act === 0) wp.copy(C);
          tl.pos[i * 3] = wp.x; tl.pos[i * 3 + 1] = wp.y; tl.pos[i * 3 + 2] = wp.z;
        }
        tl.pt.geometry.attributes.position.needsUpdate = true; tl.pt.material.opacity = 0.15 + act * 0.75;
      });
      wp.copy(C).project(S.solarCam);
      var show = wp.z < 1 && Math.abs(wp.x) < 1.05 && Math.abs(wp.y) < 1.05;
      lbl.style.visibility = show ? 'visible' : 'hidden';
      if (show) lbl.style.transform = 'translate(' + Math.round((wp.x + 1) / 2 * innerWidth + 10) + 'px,' + Math.round((1 - wp.y) / 2 * innerHeight - 10) + 'px)';
    });
  }
  function fly() {
    var S = LE.scene, SO = LE.solar; SO.follow = null;
    var side = new THREE.Vector3(0, 1, 0).cross(K.pos).normalize();
    K.follow = false; S.flyTo({ target: K.pos.clone(), position: K.pos.clone().add(side.multiplyScalar(30)).add(new THREE.Vector3(0, 16, 0)), ms: 2000, arc: false });
    setTimeout(function () { K.follow = true; }, 2100);
    S.solarCtl.minDistance = 1;
  }

  /* ---------------- 任务面板 ---------------- */
  var KEY = 'gn:sh:comet';
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  var ST = load(); ST.stars = ST.stars || [0, 0, 0];
  function save() { try { localStorage.setItem(KEY, JSON.stringify(ST)); } catch (e) { } }
  function h(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function snd(n) { if (window.LE && LE.audio) LE.audio.play(n); }
  var U = {}, L = { q: 0, hints: 0 };
  var QS = [
    { q: '拖动时间,看哈雷彗星飞近太阳又飞走。它的尾巴指向哪里?', ch: ['总是背对着太阳', '总是拖在身后(和飞行方向相反)', '总是指向地球'], ok: 0,
      hint: ['注意它飞离太阳的那一段:尾巴是在身后,还是在前面?', '把太阳想成一盏亮灯,尾巴像影子一样。', '尾巴是被太阳「吹」出来的。'],
      good: '对!离开太阳时,彗星甚至是「尾巴在前、头在后」地飞。尾巴不是拖出来的,而是被太阳吹出来的。' },
    { kind: 'now', q: '把时间拖到尾巴<b>最长最亮</b>的时候,然后按「就是现在」。', hint: ['尾巴的长短和离太阳的距离有关。', '看面板里的「离太阳」读数。', '离太阳不到 0.8 AU 的那几十天。'],
      good: '对!离太阳越近,冰被晒得越猛,喷出的气体和尘埃越多。哈雷彗星离太阳最近时只有约 0.59 AU,比地球还近。' },
    { q: '仔细看:哈雷彗星有两条尾巴,一条蓝色笔直,一条黄白色弯弯的。蓝色那条是什么吹出来的?', ch: ['太阳风(太阳吹出的带电粒子)', '彗星自己的火箭喷气', '地球的引力'], ok: 0,
      hint: ['蓝色尾巴由带电的气体组成。', '星域 II 的「极光」任务里,也是这股从太阳吹来的粒子流。', '太阳风每秒约 400 km,所以离子尾又直又笔挺。'],
      good: '对!蓝色离子尾被太阳风吹得笔直;黄白色尘埃尾是阳光的「光压」轻轻推开的尘埃,跑得慢,落在轨道后方弯成弧形。地球穿过这些尘埃时,就有了流星雨:每年 5 月和 10 月的两场流星雨就来自哈雷彗星。' }];
  function build2() {
    var r = U.root = h('section', 'ml ml--cm ml--dock');
    r.innerHTML = '<header class="ml-hd"><div><small>星域 IV · 星槎 · 太阳系边疆</small><b>彗星的尾巴为什么总背着太阳?</b></div><span class="ml-st"></span><button class="ml-x" type="button" aria-label="关闭">✕</button></header>' +
      '<div class="ml-ctl"><button class="ml-fly" type="button">◎ 飞到哈雷彗星</button></div>' +
      '<div class="cm-time"><input class="ml-rng" type="range" min="-400" max="400" step="1"><div class="cm-read"><span class="ml-day"></span><span class="ml-r"></span></div></div>' +
      '<div class="ml-guide"><div class="ml-q"></div><div class="ml-ch"></div><div class="ml-gb"><button class="ml-hint" type="button">给我一点提示</button><span class="ml-hs"></span></div></div>' +
      '<div class="ml-note">轨道根数:NASA/JPL SBDB;尾巴长度为示意放大,方向真实。下次回归:2061 年 7 月。</div>';
    document.body.appendChild(r);
    ['st', 'x', 'fly', 'rng', 'day', 'r', 'q', 'ch', 'hint', 'hs'].forEach(function (k) { U[k] = r.querySelector('.ml-' + k); });
    U.x.onclick = close; U.hint.onclick = hint; U.fly.onclick = function () { fly(); snd('click'); };
    U.rng.oninput = function () { K.t = T_PERI + (+U.rng.value) * 864e5; read(); };
  }
  function read() {
    var d = new Date(K.t + 8 * 3600e3), dd = Math.round((K.t - T_PERI) / 864e5);
    U.day.textContent = d.getUTCFullYear() + '年' + (d.getUTCMonth() + 1) + '月' + d.getUTCDate() + '日(' + (dd === 0 ? '近日点' : dd < 0 ? '近日点前 ' + (-dd) + ' 天' : '近日点后 ' + dd + ' 天') + ')';
    var r = Math.hypot.apply(null, (function (h) { return [h.x, h.y, h.z]; })(helioAt(K.t)));
    U.r.textContent = '离太阳 ' + r.toFixed(2) + ' AU · ' + (r > 4.5 ? '冻成冰块,没有尾巴' : r < 0.8 ? '尾巴最长' : (dd < 0 ? '正在长出尾巴' : '尾巴渐渐变短'));
  }
  function stars() { U.st.textContent = '★ ' + ST.stars.reduce(function (s, x) { return s + x; }, 0) + ' / 9'; }
  function showQ() {
    stars(); L.hints = 0; U.hs.textContent = ''; U.ch.innerHTML = ''; U.hint.hidden = false;
    if (L.q >= QS.length) { U.q.innerHTML = '<b>三关完成!</b>2061 年 7 月,哈雷彗星会再次回到地球附近。到时候你多大了?'; U.hint.hidden = true; return; }
    var Q = QS[L.q]; U.q.innerHTML = '<small>第 ' + (L.q + 1) + ' / 3 关</small>' + Q.q;
    if (Q.kind === 'now') { var b = h('button', 'ml-c ml-c--go', '就是现在'); b.type = 'button'; b.onclick = function () { answer((K.r || 9) < 0.8, b); }; U.ch.appendChild(b); return; }
    Q.ch.map(function (t, i) { return i; }).sort(function () { return Math.random() - 0.5; }).forEach(function (i) {
      var b = h('button', 'ml-c', Q.ch[i]); b.type = 'button'; b.onclick = function () { answer(i === Q.ok, b); }; U.ch.appendChild(b);
    });
  }
  function answer(ok, b) {
    var Q = QS[L.q];
    if (!ok) { b.classList.add('no'); snd('blip'); U.hs.textContent = '再想想,也可以看一条提示。'; return; }
    var got = Math.max(1, 3 - L.hints); ST.stars[L.q] = Math.max(ST.stars[L.q] || 0, got); save(); snd('arrive');
    U.ch.innerHTML = ''; U.hint.hidden = true;
    U.q.innerHTML = '<small>第 ' + (L.q + 1) + ' 关 · 获得 ' + '★'.repeat(got) + '</small>' + Q.good;
    var n = h('button', 'ml-c ml-c--go', L.q < 2 ? '下一关' : '完成'); n.type = 'button'; n.onclick = function () { L.q++; showQ(); }; U.ch.appendChild(n); stars();
    if (window.SHHUD && SHHUD.refreshTasks) SHHUD.refreshTasks();
  }
  function hint() { var Q = QS[L.q]; if (!Q || L.hints >= 3) return; snd('click'); U.hs.textContent = ['方向', '线索', '半步示范'][L.hints] + ':' + Q.hint[L.hints]; L.hints++; if (L.hints >= 3) U.hint.hidden = true; }
  function open(n) {
    if (!K.group) { if ((n || 0) < 40) setTimeout(function () { open((n || 0) + 1); }, 250); return; }
    if (!U.root) build2();
    if (window.SHHUD && SHHUD.hideNow) SHHUD.hideNow();
    if (LE.scene.mode !== 'solar' && LE.ui.setMode) LE.ui.setMode('solar');
    K.on = true; K.had = false; U.root.hidden = false; K.t = T_PERI - 120 * 864e5; U.rng.value = -120; read();
    L.q = ST.stars.indexOf(0); if (L.q < 0) L.q = 3; showQ(); setTimeout(fly, 900); snd('open');
  }
  function close() { if (U.root) U.root.hidden = true; K.on = false; snd('close'); }
  window.SH = window.SH || {}; SH.cometLab = { open: open, close: close, _K: K };
  (function wait(k) {
    if (window.LE && LE.solar && LE.solar.helio && LE.scene && LE.scene.solarScene && LE.solar.labels !== undefined && window.SH_READY) { try { build(); } catch (e) { console.error('[SHCOMET]', e); } return; }
    if (k > 900) return; setTimeout(function () { wait(k + 1); }, 150);
  })(0);
})();
