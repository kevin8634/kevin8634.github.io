/* 天枢 Starhelm · sh-dino.js(v1.0-M3d)—— 星域 IV 新任务 sh.dino「恐龙那天到底发生了什么?」
 * 在地球 3D 场景里重演 6600 万年前的希克苏鲁伯撞击(墨西哥尤卡坦半岛,21.4°N 89.5°W):
 *   小行星(约 10 km)拖着烧蚀火焰冲进大气 → 撞击闪光 → 冲击波环在地表扩散 → 抛射物火雨绕地球飞散 → 尘埃与烟灰罩住整个地球、阳光变暗。
 * 地图用今天的大陆(当年大陆位置略有不同);时间与尺度为示意压缩,数值来自科学文献(NASA、USGS 等公开资料)。
 * 停靠面板 3 关,存 gn:sh:dino;?task=dino。 */
(function () {
  'use strict';
  var LAT = 21.4, LNG = -89.5;
  var D = { on: false, t: -1 };
  function glowTex(rgb) {
    var c = document.createElement('canvas'); c.width = c.height = 64; var x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.2, 'rgba(' + rgb + ',.9)'); g.addColorStop(0.5, 'rgba(' + rgb + ',.25)'); g.addColorStop(1, 'rgba(' + rgb + ',0)');
    x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c);
  }
  function glowMesh(r, g, b) {   // 地球场景里用着色器公告板做辉光(白天背景上也明显)
    var m = new THREE.ShaderMaterial({ uniforms: { uA: { value: 0 }, uC: { value: new THREE.Vector3(r, g, b) } }, transparent: true, depthWrite: false, depthTest: false,
      vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader: 'uniform float uA;uniform vec3 uC;varying vec2 vUv;void main(){float d=length(vUv-.5)*2.;float core=smoothstep(.35,0.,d);float halo=pow(max(0.,1.-d),2.2);gl_FragColor=vec4(mix(uC,vec3(1.,.97,.85),core),(halo*.85+core)*uA);}' });
    var o = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), m); o.renderOrder = 30; return o;
  }
  function build() {
    var T = THREE, S = LE.scene, U = LE.util, G = new T.Group(); G.visible = false; S.earthScene.add(G); D.group = G;
    var P0 = U.ll(LAT, LNG, 1, new T.Vector3()), N = P0.clone().normalize();
    var tang = new T.Vector3(0, 1, 0).cross(N).normalize(), bit = N.clone().cross(tang).normalize();
    D.P0 = P0; D.N = N;
    // 来向:与地面约 45°(研究认为偏北东方向斜撞)
    var dir = N.clone().multiplyScalar(-0.42).addScaledVector(tang, 0.78).addScaledVector(bit, -0.3).normalize(), from = P0.clone().addScaledVector(dir, -0.95);
    D.dir = dir; D.from = from;
    // 小行星:不规则岩石
    var geo = new T.IcosahedronGeometry(0.02, 3), pa = geo.attributes.position, v = new T.Vector3();
    for (var i = 0; i < pa.count; i++) { v.fromBufferAttribute(pa, i); var k = 1 + 0.25 * Math.sin(v.x * 300) * Math.cos(v.y * 260) + 0.12 * Math.sin(v.z * 520); v.multiplyScalar(k); pa.setXYZ(i, v.x, v.y, v.z); }
    geo.computeVertexNormals();
    var rock = new T.Mesh(geo, new T.MeshStandardMaterial({ color: 0x4a4038, roughness: 0.95, metalness: 0.05, emissive: 0x331100, emissiveIntensity: 0 })); G.add(rock); D.rock = rock;
    var heat = glowMesh(1, .45, .1); heat.material.opacity = 0; G.add(heat);
    // 火焰尾迹粒子
    function pts(n, rgb, size) {
      var g = new T.BufferGeometry(), p = new Float32Array(n * 3); g.setAttribute('position', new T.BufferAttribute(p, 3).setUsage(T.DynamicDrawUsage));
      var o = new T.Points(g, new T.PointsMaterial({ size: size, map: glowTex(rgb), transparent: true, depthWrite: false, opacity: 0 })); o.frustumCulled = false; o.renderOrder = 19; G.add(o);
      var Q = []; for (var i = 0; i < n; i++) Q.push({ a: Math.random(), p: new T.Vector3(), v: new T.Vector3() }); return { o: o, p: p, Q: Q, n: n };
    }
    var trailM = []; for (var ti = 0; ti < 26; ti++) { var tm = glowMesh(1, .5 + ti * .012, .15); G.add(tm); trailM.push(tm); }
    var trail = pts(900, '255,140,40', 0.03), ejecta = pts(innerWidth < 760 ? 1200 : 2600, '255,120,40', 0.014);
    // 撞击闪光、冲击波环、尘埃罩
    var flash = glowMesh(1, .8, .5); flash.position.copy(P0.clone().multiplyScalar(1.01)); G.add(flash);
    var ringM = new T.ShaderMaterial({ uniforms: { uA: { value: 0 } }, transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide,
      vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader: 'uniform float uA;varying vec2 vUv;void main(){float r=length(vUv-.5)*2.;float e=smoothstep(.78,.95,r)*(1.-smoothstep(.95,1.,r));gl_FragColor=vec4(vec3(1.,.6,.25)*e*uA*2.,1.);}' });
    var ring = new T.Mesh(new T.PlaneGeometry(1, 1), ringM); ring.position.copy(P0.clone().multiplyScalar(1.004)); ring.lookAt(P0.clone().multiplyScalar(2)); G.add(ring);
    var dust = new T.Mesh(new T.SphereGeometry(1.025, 96, 48), new T.ShaderMaterial({ uniforms: { uA: { value: 0 }, uP: { value: N.clone() }, uT: { value: 0 } }, transparent: true, depthWrite: false,
      vertexShader: 'varying vec3 vP;void main(){vP=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader: 'uniform float uA,uT;uniform vec3 uP;varying vec3 vP;float h(vec3 p){return fract(sin(dot(p,vec3(12.9,78.2,37.7)))*43758.5);}' +
        'void main(){float d=acos(clamp(dot(vP,uP),-1.,1.))/3.1416;float cover=smoothstep(uA*1.15,uA*1.15-.25,d);float n=.75+.25*sin(vP.x*30.+uT)*sin(vP.y*27.-uT*.7);' +
        'gl_FragColor=vec4(mix(vec3(.16,.12,.1),vec3(.35,.18,.08),.3*n),cover*.88*n);}' }));
    G.add(dust); D.dust = dust;
    var last = performance.now(), A = new T.Vector3();
    S.addUpdater(function (dt0, now, mode) {
      var t2 = performance.now(), dt = Math.min(0.05, (t2 - last) / 1000); last = t2;
      G.visible = mode === 'earth' && D.on && D.t >= 0; if (!G.visible) return;
      D.t += dt; var t = D.t, IMP = 4;
      // 1) 接近
      var f = Math.min(1, t / IMP), ease = f * f;
      rock.visible = t < IMP; heat.visible = t < IMP;
      A.copy(from).lerp(P0, ease); rock.position.copy(A); rock.rotation.x += dt * 2; rock.rotation.y += dt * 1.3;
      var inAtm = A.length() < 1.25; rock.material.emissiveIntensity = inAtm ? 1.2 : 0.1; heat.position.copy(A); heat.quaternion.copy(S.earthCam.quaternion); heat.material.uniforms.uA.value = inAtm ? 1 : 0.6; heat.scale.setScalar(inAtm ? 0.34 : 0.2);
      trail.o.material.opacity = t < IMP ? (inAtm ? 0.9 : 0.35) : Math.max(0, 0.9 - (t - IMP) * 0.6);
      for (var i = 0; i < trail.n; i++) {
        var q = trail.Q[i]; q.a += dt * 1.6; if (q.a > 1 && t < IMP) { q.a = 0; q.p.copy(A); q.v.set(Math.random() - .5, Math.random() - .5, Math.random() - .5).multiplyScalar(0.03); }
        var s = Math.min(q.a, 1); v.copy(q.p).addScaledVector(dir, -s * (inAtm ? 0.35 : 0.12)).addScaledVector(q.v, s);
        trail.p[i * 3] = v.x; trail.p[i * 3 + 1] = v.y; trail.p[i * 3 + 2] = v.z;
      }
      trail.o.geometry.attributes.position.needsUpdate = true;
      for (i = 0; i < trailM.length; i++) { var tm2 = trailM[i], k2 = (i + 1) / trailM.length; tm2.position.copy(A).addScaledVector(dir, -k2 * (inAtm ? 0.5 : 0.22)); tm2.quaternion.copy(S.earthCam.quaternion); tm2.scale.setScalar((inAtm ? 0.16 : 0.08) * (1 - k2 * 0.7)); tm2.material.uniforms.uA.value = t < IMP ? (1 - k2) * (inAtm ? 0.9 : 0.5) : 0; }
      // 2) 撞击闪光 + 冲击波
      var e = t - IMP;
      flash.quaternion.copy(S.earthCam.quaternion); flash.material.uniforms.uA.value = e > 0 ? Math.max(0, 1 - e * 0.5) : 0; flash.scale.setScalar(e > 0 ? 0.1 + e * 0.9 : 0.01);
      ringM.uniforms.uA.value = e > 0 ? Math.max(0, 1 - e / 7) : 0; var rs = e > 0 ? 0.05 + e * 0.32 : 0.01; ring.scale.set(rs, rs, 1);
      // 3) 抛射物火雨(沿弹道绕地球飞散、落回)
      ejecta.o.material.opacity = e > 0 ? Math.max(0, Math.min(1, e * 2) - Math.max(0, (e - 8) * 0.3)) : 0;
      for (i = 0; i < ejecta.n; i++) {
        var w = ejecta.Q[i];
        if (e <= 0) { w.a = -Math.random() * 1.5; continue; }
        if (w.a < 0) { w.a += dt; if (w.a >= 0) { w.ang = Math.random() * 6.283; w.sp = 0.25 + Math.random() * 1.6; w.up = 0.02 + Math.random() * 0.25; } else { v.copy(P0); ejecta.p[i * 3] = v.x; ejecta.p[i * 3 + 1] = v.y; ejecta.p[i * 3 + 2] = v.z; continue; } }
        w.a += dt * 0.35; var arc = Math.min(w.a * w.sp, 3.1), hgt = 1 + w.up * Math.sin(Math.min(1, w.a / 1.4) * Math.PI) + 0.004;
        var dirS = tang.clone().multiplyScalar(Math.cos(w.ang)).addScaledVector(bit, Math.sin(w.ang));
        v.copy(N).multiplyScalar(Math.cos(arc)).addScaledVector(dirS, Math.sin(arc)).multiplyScalar(hgt);
        ejecta.p[i * 3] = v.x; ejecta.p[i * 3 + 1] = v.y; ejecta.p[i * 3 + 2] = v.z;
      }
      ejecta.o.geometry.attributes.position.needsUpdate = true;
      // 4) 尘埃罩住地球
      dust.material.uniforms.uA.value = e > 1.5 ? Math.min(1.3, (e - 1.5) / 7) : 0; dust.material.uniforms.uT.value = t;
      if (D.onTime) D.onTime(t);
    });
    var v = new T.Vector3();
  }
  function play() {
    var S = LE.scene;
    if (S.mode !== 'earth' && LE.ui.setMode) LE.ui.setMode('earth');
    var cam = D.P0.clone().normalize().multiplyScalar(2.7).add(new THREE.Vector3(0, 0.6, 0));
    S.flyTo({ target: new THREE.Vector3(), position: cam, ms: 1600 });
    D.t = -1.6; D.on = true; if (LE.audio && LE.audio.play) setTimeout(function () { LE.audio.play('boom'); }, 5600);
  }
  D.play = play;

  /* ---------------- 任务面板 ---------------- */
  var KEY = 'gn:sh:dino';
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  var ST = load(); ST.stars = ST.stars || [0, 0, 0];
  function save() { try { localStorage.setItem(KEY, JSON.stringify(ST)); } catch (e) { } }
  function h(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function snd(n) { if (window.LE && LE.audio) LE.audio.play(n); }
  var U = {}, L = { q: 0, hints: 0 };
  var QS = [
    { q: '先按「重演撞击」。撞上地球的那颗小行星,直径大约有多大?', ch: ['约 10 km,比珠穆朗玛峰还高', '约 100 米,一个足球场那么大', '约 1000 km,像月亮那么大'], ok: 0,
      hint: ['它留下的陨石坑直径约 180 km。', '陨石坑通常是撞击体直径的 10~20 倍。', '180 km ÷ 约 18 ≈ 10 km。'],
      good: '对!约 10 km 宽,以每秒约 20 km 的速度撞来,从穿过大气到撞上地面不到一秒。释放的能量约是人类最大核弹的几十亿倍。' },
    { q: '看地球上的闪光:撞击点在哪里?', ch: ['墨西哥尤卡坦半岛(希克苏鲁伯)', '非洲撒哈拉沙漠', '太平洋正中央'], ok: 0,
      hint: ['把地球转过来,找冲击波环的中心。', '它在北美洲南部,墨西哥湾旁边。', '坑的大部分今天埋在尤卡坦半岛和海底下。'],
      good: '对!陨石坑叫希克苏鲁伯,一半在陆上一半在海里,1990 年代才被确认。撞在浅海富含石膏的岩层上,喷出大量硫,让后果更严重。' },
    { q: '看最后:整个地球被罩住了。恐龙(除了鸟类)主要是怎么灭绝的?', ch: ['尘埃和硫酸雾遮住阳光,植物停止生长,食物链崩溃', '全都被撞击的冲击波直接震死', '小行星带来的病毒'], ok: 0,
      hint: ['离撞击点几千公里外的恐龙,当天也许还活着。', '看那层罩住地球的尘埃:阳光照不进来会怎样?', '植物没法光合作用 → 吃植物的饿死 → 吃肉的也饿死。'],
      good: '对!撞击只直接杀死了附近的生物;真正致命的是之后几年的「撞击冬天」:阳光被挡住,气温骤降,食物链从底层崩塌,约 75% 的物种消失。小型哺乳动物和鸟类的祖先活了下来,今天的鸟就是幸存的恐龙。' }];
  function build2() {
    var r = U.root = h('section', 'ml ml--dn ml--dock');
    r.innerHTML = '<header class="ml-hd"><div><small>星域 IV · 星槎 · 小行星与地球</small><b>恐龙那天到底发生了什么?</b></div><span class="ml-st"></span><button class="ml-x" type="button" aria-label="关闭">✕</button></header>' +
      '<div class="ml-ctl"><button class="ml-play" type="button">☄ 重演撞击</button></div><div class="dn-clock ml-clk">6600 万年前的一天</div>' +
      '<div class="ml-guide"><div class="ml-q"></div><div class="ml-ch"></div><div class="ml-gb"><button class="ml-hint" type="button">给我一点提示</button><span class="ml-hs"></span></div></div>' +
      '<div class="ml-note">时间与尺度为示意压缩;地图用今天的大陆。资料:NASA、USGS 等公开科普资料。</div>';
    document.body.appendChild(r);
    ['st', 'x', 'play', 'clk', 'q', 'ch', 'hint', 'hs'].forEach(function (k) { U[k] = r.querySelector('.ml-' + k); });
    U.x.onclick = close; U.hint.onclick = hint; U.play.onclick = function () { play(); snd('click'); };
    D.onTime = function (t) {
      var e = t - 4, s = t < 0 ? '6600 万年前的一天' : e < 0 ? '撞击前 ' + Math.ceil(-e) + ' 秒(示意)' : e < 2 ? '撞击!' : e < 5 ? '撞击后几分钟:冲击波与火雨' : e < 8 ? '撞击后几小时:抛射物落满全球' : '之后几个月到几年:尘埃与硫酸雾遮天';
      if (U.clk.textContent !== s) U.clk.textContent = s;
    };
  }
  function stars() { U.st.textContent = '★ ' + ST.stars.reduce(function (s, x) { return s + x; }, 0) + ' / 9'; }
  function showQ() {
    stars(); L.hints = 0; U.hs.textContent = ''; U.ch.innerHTML = ''; U.hint.hidden = false;
    if (L.q >= QS.length) { U.q.innerHTML = '<b>三关完成!</b>今天,天文学家在天上巡逻,追踪每一颗可能靠近地球的大型小行星;2022 年 DART 飞船还成功撞偏了一颗小行星。'; U.hint.hidden = true; return; }
    var Q = QS[L.q]; U.q.innerHTML = '<small>第 ' + (L.q + 1) + ' / 3 关</small>' + Q.q;
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
    if (!D.group) { if ((n || 0) < 40) setTimeout(function () { open((n || 0) + 1); }, 250); return; }
    if (!U.root) build2();
    if (window.SHHUD && SHHUD.hideNow) SHHUD.hideNow();
    U.root.hidden = false; L.q = ST.stars.indexOf(0); if (L.q < 0) L.q = 3; showQ(); snd('open');
    setTimeout(play, 400);
  }
  function close() { if (U.root) U.root.hidden = true; D.on = false; snd('close'); }
  window.SH = window.SH || {}; SH.dinoLab = { open: open, close: close, _D: D };
  (function wait(k) {
    if (window.SH_READY && window.LE && LE.scene && LE.scene.earthScene && LE.util && LE.util.ll) { try { build(); } catch (e) { console.error('[SHDINO]', e); } return; }
    if (k > 900) return; setTimeout(function () { wait(k + 1); }, 150);
  })(0);
})();
