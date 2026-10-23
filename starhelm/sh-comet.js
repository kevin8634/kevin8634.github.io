/* 天枢 Starhelm · sh-comet.js(v1.0-M3c)—— 星域 IV 新任务 sh.comet「彗星的尾巴为什么总背着太阳?」
 * 3D:哈雷彗星(1P/Halley)按真实轨道根数(JPL SBDB:a 17.834 AU,e 0.96714,i 162.26°,Ω 58.42°,ω 111.33°,1986-02-09 过近日点)在太阳系场景中运行;
 *     彗核 + 彗发辉光;离子尾(蓝,太阳风吹出,笔直背向太阳)与尘埃尾(黄白,光压推出,沿轨道弯曲)两套粒子,亮度和长度随离太阳距离变化(约 4 AU 内才长出尾巴)。
 * 任务面板停靠在右侧,时间滑块在 2061 年近日点前后 ±400 天拖动;3 关,存 gn:sh:comet;?task=comet。尾巴长度为示意放大,方向与轨道为真实。 */
(function () {
  'use strict';
  var DEG = Math.PI / 180, AU = 149597870.7;
  var HALLEY = { kepler: { a: 17.834, e: 0.96714, I: 162.26, Omega: 58.42, omega: 111.33, M0: 0, epochJD: 2446470.5 } };
  var T_PERI = Date.UTC(2061, 6, 28);
  var K = { on: false, t: T_PERI - 120 * 864e5, play: true, last: 0, rd: 0 };
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
  function build() {   // v1.0-M3f 王磊:彗星全部改为真实感 GPU 粒子 + 真实彗核模型
    var T = THREE, S = LE.scene, SO = LE.solar, G = new T.Group(); G.visible = false; S.solarScene.add(G); K.group = G;
    var small = innerWidth < 760, px = Math.min(2, devicePixelRatio || 1);
    // 轨道线
    var pts = []; for (var i = 0; i <= 720; i++) pts.push(SO.toScene(SO.helio(HALLEY, 0, i / 2 * DEG)));
    G.add(new T.Line(new T.BufferGeometry().setFromPoints(pts), new T.LineBasicMaterial({ color: 0x7fd4ff, transparent: true, opacity: 0.28, depthWrite: false })));
    // 彗核:1986 年乔托号拍到的「花生形」黑色冰块(约 15×8×8 km,反照率仅约 4%),按太阳方向打光;体积示意放大
    var ng = new T.SphereGeometry(1, 96, 64), pa = ng.attributes.position, v = new T.Vector3();
    for (i = 0; i < pa.count; i++) {
      v.fromBufferAttribute(pa, i); var x = v.x, waist = 1 - 0.28 * Math.exp(-x * x * 6);
      var n = 1 + 0.07 * Math.sin(v.x * 9 + v.y * 4) * Math.cos(v.z * 7) + 0.04 * Math.sin(v.y * 17 + v.z * 13) + 0.025 * Math.sin(v.x * 31 - v.z * 23);
      pa.setXYZ(i, x * 1.0 * n, v.y * 0.52 * waist * n, v.z * 0.5 * waist * n);
    }
    ng.computeVertexNormals();
    var nucM = new T.ShaderMaterial({ uniforms: { uSun: { value: new T.Vector3(1, 0, 0) }, uAct: { value: 0 } },
      vertexShader: 'varying vec3 vN;varying vec3 vP;void main(){vN=normalize(mat3(modelMatrix)*normal);vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader: 'uniform vec3 uSun;uniform float uAct;varying vec3 vN;varying vec3 vP;float h(vec3 p){return fract(sin(dot(p,vec3(12.9,78.2,37.7)))*43758.5);}' +
        'void main(){float l=max(dot(normalize(vN),uSun),0.);float g=.75+.25*h(floor(vP*40.));float crater=smoothstep(.35,.0,abs(fract(vP.x*6.+vP.y*3.)-.5))*.15;' +
        'vec3 c=vec3(.11,.1,.095)*g*(1.-crater);vec3 col=c*(l*1.6+.03);col+=vec3(.9,.95,1.)*pow(l,8.)*uAct*.25;gl_FragColor=vec4(col,1.);}' });
    var nuc = new T.Mesh(ng, nucM); G.add(nuc); K.nuc = nuc;
    // —— GPU 粒子:彗发 / 喷流 / 离子尾 / 尘埃尾 ——
    var U0 = { uT: { value: 0 }, uC: { value: new T.Vector3() }, uSun: { value: new T.Vector3(1, 0, 0) }, uVel: { value: new T.Vector3(0, 0, 1) },
      uAct: { value: 0 }, uL: { value: 20 }, uPx: { value: px }, uNs: { value: 1 } };
    K.U = U0;
    function seeds(n) { var g = new T.BufferGeometry(), a = new Float32Array(n * 4); for (var i = 0; i < n * 4; i++) a[i] = Math.random(); g.setAttribute('seed', new T.BufferAttribute(a, 4)); g.setAttribute('position', new T.BufferAttribute(new Float32Array(n * 3), 3)); g.boundingSphere = new T.Sphere(new T.Vector3(), 1e5); return g; }
    var head = 'uniform float uT,uAct,uL,uPx,uNs;uniform vec3 uC,uSun,uVel;attribute vec4 seed;varying float vA;varying float vF;' +
      'vec3 basisU(vec3 d){return normalize(cross(d,abs(d.y)<.9?vec3(0.,1.,0.):vec3(1.,0.,0.)));}' +
      'vec3 rnd(vec4 s){float a=s.x*6.2832,z=s.y*2.-1.;float r=sqrt(1.-z*z);return vec3(cos(a)*r,z,sin(a)*r);}' +
      'void outp(vec3 p,float size){vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(uPx*size*(150./-mv.z),1.,16.);}';
    function mat(vs, fs) { return new T.ShaderMaterial({ uniforms: U0, vertexShader: head + vs, fragmentShader: 'varying float vA;varying float vF;' + fs, transparent: true, depthWrite: false, blending: T.AdditiveBlending }); }
    var soft = 'float sd(){vec2 d=gl_PointCoord-.5;return exp(-dot(d,d)*14.);}';
    // 彗发:高斯分布的气体与尘埃云,内层偏青绿(C2 分子荧光),外层偏白
    var coma = new T.Points(seeds(small ? 2500 : 7000), mat(
      'void main(){float f=mod(seed.w+uT*.08,1.);float r=pow(seed.z,2.2)*uL*.16*(.3+f);vec3 p=uC+rnd(seed)*r+uSun*r*.35*f;vA=uAct*(1.-f)*(1.-seed.z*.6)*.55;vF=seed.z;outp(p,.9+1.6*(1.-seed.z));}',
      soft + 'void main(){vec3 c=mix(vec3(.45,1.,.8),vec3(.95,.97,1.),vF);gl_FragColor=vec4(c*sd()*vA*.35,1.);}'));
    // 喷流:向阳面喷出的气尘柱,随彗核自转扫动,再被推向背日方向
    var jets = new T.Points(seeds(small ? 1200 : 3000), mat(
      'void main(){float f=mod(seed.w+uT*.35,1.);float k=floor(seed.x*4.);float ang=k*1.57+uT*.6+seed.y*.25;vec3 u=basisU(uSun),w=cross(uSun,u);' +
        'vec3 d=normalize(-uSun*.9+(u*cos(ang)+w*sin(ang))*.55);vec3 p=uC+d*f*uL*.03+uSun*f*f*uL*.035;vA=uAct*(1.-f)*.8;vF=f;outp(p,1.1);}',
      soft + 'void main(){gl_FragColor=vec4(vec3(1.,.97,.9)*sd()*vA*.5,1.);}'));
    // 离子尾:被太阳风吹成笔直的蓝色细丝(CO⁺ 荧光),带流光与扭结
    var ion = new T.Points(seeds(small ? 3500 : 10000), mat(
      'void main(){float f=mod(seed.w+uT*(.12+.06*seed.z),1.);float ray=floor(seed.x*9.);float ra=ray*.698+sin(uT*.3+ray)*.2;vec3 u=basisU(uSun),w=cross(uSun,u);' +
        'float spread=(.012+.05*f)*uL;vec3 lat=(u*cos(ra)+w*sin(ra))*spread*(.4+seed.y)+u*sin(f*12.+uT*1.5+ray)*.015*uL*f;vec3 p=uC+uSun*f*uL*1.6+lat;' +
        'vA=uAct*smoothstep(0.,.04,f)*(1.-f)*.85;vF=f;outp(p,1.+1.4*(1.-f));}',
      soft + 'void main(){vec3 c=mix(vec3(.55,.8,1.),vec3(.25,.5,1.),vF);gl_FragColor=vec4(c*sd()*vA*.3,1.);}'));
    // 尘埃尾:被光压慢慢推开、落在轨道后方的宽阔弧形尘幕,偏黄白,带同步条纹
    var dust = new T.Points(seeds(small ? 4000 : 12000), mat(
      'void main(){float f=mod(seed.w+uT*.05,1.);float beta=.25+seed.x*.75;float s=f*uL*1.05*beta;vec3 u=basisU(uSun);' +
        'float stria=floor(seed.y*7.)/7.;vec3 p=uC+uSun*s-uVel*f*f*uL*.9*(1.1-beta)+cross(uSun,uVel)*(seed.z-.5)*f*uL*.12+u*(seed.y-.5)*f*uL*.05;' +
        'vA=uAct*smoothstep(0.,.03,f)*(1.-f)*(.55+.45*step(.5,fract(stria*7.+seed.x*.3)))*.7;vF=f;outp(p,1.2+1.6*(1.-f));}',
      soft + 'void main(){vec3 c=mix(vec3(1.,.95,.82),vec3(1.,.82,.6),vF);gl_FragColor=vec4(c*sd()*vA*.22,1.);}'));
    [coma, jets, ion, dust].forEach(function (o) { o.frustumCulled = false; G.add(o); });
    var lbl = document.createElement('button'); lbl.type = 'button'; lbl.className = 'le-plabel is-major sh-cometlabel'; lbl.textContent = '哈雷彗星'; lbl.style.visibility = 'hidden';
    (SO.labels || document.body).appendChild(lbl); lbl.onclick = function () { fly(); };
    var C = new T.Vector3(), C2 = new T.Vector3(), wp = new T.Vector3(), t0 = performance.now();
    K.pos = C;
    S.addUpdater(function () {
      var on = S.mode === 'solar' && (K.on || K.cine || K.follow || (window.SHD4 && SHD4.ready && SHD4.visible()));   // 特写/跟随时镜头会推近到 95 以内,不能因星域 IV 视图隐藏而冻结
      G.visible = on; if (!on) { lbl.style.visibility = 'hidden'; return; }
      var nowp = performance.now(), dtp = K.last ? Math.min(0.1, (nowp - K.last) / 1000) : 0; K.last = nowp;
      if (K.play && !K.drag) {   // 回归动画:每秒约 6 天,在近日点前后 400 天之间循环
        K.t += dtp * 6 * 864e5; if (K.t > T_PERI + 400 * 864e5) K.t = T_PERI - 400 * 864e5;
        if (K.on && U.rng && (K.rd += dtp) > 0.2) { K.rd = 0; U.rng.value = Math.round((K.t - T_PERI) / 864e5); read(); }
      }
      var h = helioAt(K.t), r = Math.hypot(h.x, h.y, h.z); K.r = r;
      var px0 = C.x, py0 = C.y, pz0 = C.z;
      SO.toScene(h, C); SO.toScene(helioAt(K.t + 864e5), C2);
      if ((SO.follow || (S.fly && !K.cine)) && (K.follow || K.cine)) { K.follow = false; K.cine = null; }
      if (K.cine) {   // 一镜到底:距离按对数平滑推近,方向球面插值,目标锁定彗核
        var q = Math.min(1, (nowp - K.cine.t0) / K.cine.ms), e = q < .5 ? 4 * q * q * q : 1 - Math.pow(-2 * q + 2, 3) / 2;
        var dd = Math.exp(Math.log(K.cine.d0) + (Math.log(K.cine.d1) - Math.log(K.cine.d0)) * e);
        var dir = K.cine.u0.clone().lerp(K.cine.u1, e).normalize();
        S.fly = null; S.solarCam.position.copy(C).addScaledVector(dir, dd); S.solarCtl.target.copy(K.cine.c0).lerp(C, Math.min(1, e * 1.6));
        if (q >= 1) { K.cine = null; K.follow = true; S.solarCtl.target.copy(C); }
        K.had = true;
      } else if (K.follow && K.had) { var dx = C.x - px0, dy = C.y - py0, dz = C.z - pz0; S.solarCam.position.x += dx; S.solarCam.position.y += dy; S.solarCam.position.z += dz; S.solarCtl.target.x += dx; S.solarCtl.target.y += dy; S.solarCtl.target.z += dz; }
      K.had = true;
      var act = r > 4.5 ? 0 : Math.min(1, Math.pow(1.2 / Math.max(r, 0.5), 1.6)); K.act = act;
      U0.uC.value.copy(C); U0.uSun.value.copy(C).normalize(); U0.uVel.value.subVectors(C2, C).normalize();
      U0.uAct.value = act; U0.uL.value = 6 + act * 22; U0.uT.value = (performance.now() - t0) / 1000;
      var cam = S.solarCam.position.distanceTo(C);
      nuc.position.copy(C); nuc.scale.setScalar(Math.max(0.12, cam * 0.006)); nuc.rotation.y += 0.004; nuc.rotation.z = 0.4;
      nucM.uniforms.uSun.value.copy(C).normalize().negate(); nucM.uniforms.uAct.value = act;
      wp.copy(C).project(S.solarCam);
      var show = wp.z < 1 && Math.abs(wp.x) < 1.05 && Math.abs(wp.y) < 1.05;
      lbl.style.visibility = show ? 'visible' : 'hidden';
      if (show) lbl.style.transform = 'translate(' + Math.round((wp.x + 1) / 2 * innerWidth + 10) + 'px,' + Math.round((1 - wp.y) / 2 * innerHeight - 10) + 'px)';
    });
  }
  function fly() {   // 一镜到底:从当前视角一路推近到彗核特写(侧后方,能同时看到喷流、彗发和两条尾巴)
    var S = LE.scene, SO = LE.solar, T = THREE; SO.follow = null; S.fly = null; K.follow = false;
    if (!K.pos || !K.pos.lengthSq()) return;
    var sun = K.pos.clone().normalize(), side = new T.Vector3(0, 1, 0).cross(sun).normalize();
    var u1 = side.clone().multiplyScalar(0.8).addScaledVector(sun, -0.45).add(new T.Vector3(0, 0.38, 0)).normalize();
    var off = S.solarCam.position.clone().sub(K.pos), d0 = Math.max(4, off.length());
    K.cine = { t0: performance.now(), ms: 4200, d0: d0, d1: 3.2, u0: off.normalize(), u1: u1, c0: S.solarCtl.target.clone() };
    K.play = true; K.had = true; S.solarCtl.minDistance = 0.6; snd('arrive');
    if (U.pp) U.pp.textContent = '❚❚ 暂停';
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
      '<div class="ml-ctl"><button class="ml-fly" type="button">◎ 彗核特写(一镜到底)</button><button class="ml-pp" type="button">❚❚ 暂停</button></div>' +
      '<div class="cm-time"><input class="ml-rng" type="range" min="-400" max="400" step="1"><div class="cm-read"><span class="ml-day"></span><span class="ml-r"></span></div></div>' +
      '<div class="ml-guide"><div class="ml-q"></div><div class="ml-ch"></div><div class="ml-gb"><button class="ml-hint" type="button">给我一点提示</button><span class="ml-hs"></span></div></div>' +
      '<div class="ml-note">轨道根数:NASA/JPL SBDB;彗核形状依据 1986 年 ESA 乔托号实拍(约 15×8 km,体积示意放大);尾巴长度为示意,方向真实。下次回归:2061 年 7 月。</div>';
    document.body.appendChild(r);
    ['st', 'x', 'fly', 'pp', 'rng', 'day', 'r', 'q', 'ch', 'hint', 'hs'].forEach(function (k) { U[k] = r.querySelector('.ml-' + k); });
    U.x.onclick = close; U.hint.onclick = hint; U.fly.onclick = function () { fly(); snd('click'); };
    U.pp.onclick = function () { K.play = !K.play; U.pp.textContent = K.play ? '❚❚ 暂停' : '▶ 播放'; snd('click'); };
    U.rng.onpointerdown = function () { K.drag = true; }; U.rng.onpointerup = U.rng.onpointercancel = function () { K.drag = false; };
    U.rng.oninput = function () { K.play = false; U.pp.textContent = '▶ 播放'; K.t = T_PERI + (+U.rng.value) * 864e5; read(); if (!K.follow && !K.cine) { clearTimeout(K.rf); K.rf = setTimeout(fly, 120); } };
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
