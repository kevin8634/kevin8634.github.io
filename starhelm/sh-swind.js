/* 天枢 Starhelm · sh-swind.js(v1.0-M3e)—— 地球模式「太阳风」图层 + 底部图层按钮分组
 * 太阳风:从太阳方向吹来的带电粒子流(GPU 粒子),在地球前方被磁场挡出弓形激波、绕过磁层顶,背面拉出长长的磁尾;少量粒子沿磁力线钻进南北极,点亮极光环。
 *   强度用 NOAA SWPC 实时太阳风速度与磁场 Bz(DSCOVR/ACE 在日地 L1 点实测);风速 >600 km/s 或 Kp≥5 显示为「太阳风暴」(更快、更密、偏橙红,激波被压近)。
 *   卡片可「看一场太阳风暴(模拟)」:约 1000 km/s 的日冕物质抛射冲击地球。尺寸为示意压缩(真实弓形激波约在 13 个地球半径外)。
 * 图层分组:底部图层按钮按「太空设施 / 地球观测 / 太阳与空间天气」三个模块收拢,一次展开一个模块。 */
(function () {
  'use strict';
  var URL_V = 'https://services.swpc.noaa.gov/products/summary/solar-wind-speed.json';
  var URL_B = 'https://services.swpc.noaa.gov/products/summary/solar-wind-mag-field.json';
  var W = { on: false, v: null, bz: null, bt: null, time: null, demo: 0, k: 0.35 };
  function $(id) { return document.getElementById(id); }

  /* ---------------- 3D ---------------- */
  function build() {
    var T = THREE, S = LE.scene, G = new T.Group(); G.visible = false; S.earthScene.add(G); W.group = G;
    var small = innerWidth < 760, Rf = 9;
    var U0 = { uT: { value: 0 }, uS: { value: new T.Vector3(1, 0, 0) }, uA: { value: new T.Vector3(0, 1, 0) }, uB: { value: new T.Vector3(0, 0, 1) },
      uR0: { value: 2.3 }, uRf: { value: Rf }, uSp: { value: 1 }, uK: { value: W.k }, uHot: { value: 0 }, uPx: { value: Math.min(2, devicePixelRatio || 1) } };
    W.U = U0;
    function seeds(n, f) { var g = new T.BufferGeometry(), a = new Float32Array(n * 4); for (var i = 0; i < n; i++) f(a, i * 4); g.setAttribute('seed', new T.BufferAttribute(a, 4)); g.setAttribute('position', new T.BufferAttribute(new Float32Array(n * 3), 3)); g.boundingSphere = new T.Sphere(new T.Vector3(), Rf * 3); return g; }
    // 激波面:r(θ) = 2·r0 / (1 + cosθ),θ 为与太阳方向夹角(抛物面)
    var head = 'uniform float uT,uR0,uRf,uSp,uK,uHot,uPx;uniform vec3 uS,uA,uB;attribute vec4 seed;varying float vA;varying float vH;' +
      'float rs(float c){return 2.*uR0/max(1.+c,.12);}';
    var windM = new T.ShaderMaterial({ uniforms: U0, transparent: true, depthWrite: false, blending: T.AdditiveBlending,
      vertexShader: head + 'void main(){float L=2.*uRf;float x=uRf-mod(uT*seed.w*uSp+seed.z*L,L);vec3 p=uS*x+uA*seed.x*uRf*.75+uB*seed.y*uRf*.75;' +
        'float l=length(p);float c=dot(p,uS)/max(l,1e-3);float r=rs(c);float push=smoothstep(r*1.35,r,l);' +
        'p=normalize(p)*mix(l,max(l,r),push);' +
        'vA=smoothstep(uRf,uRf*.6,abs(x))*(.35+.9*push)*uK;vH=push;vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=uPx*(1.6+push*2.4)*(6./-mv.z+.6);}',
      fragmentShader: 'uniform float uHot;varying float vA;varying float vH;void main(){vec2 d=gl_PointCoord-.5;float a=smoothstep(.5,0.,length(d));' +
        'vec3 c=mix(vec3(1.,.86,.55),vec3(1.,.45,.18),uHot);c=mix(c,vec3(.6,.85,1.),vH*.55);gl_FragColor=vec4(c*a*vA,1.);}' });
    var nW = small ? 3500 : 9000;
    G.add(new T.Points(seeds(nW, function (a, k) { var ang = Math.random() * 6.283, r = Math.sqrt(Math.random()); a[k] = Math.cos(ang) * r; a[k + 1] = Math.sin(ang) * r; a[k + 2] = Math.random(); a[k + 3] = 2.2 + Math.random() * 1.6; }), windM));
    // 磁层:沿磁层顶滑向背面、汇成磁尾的粒子
    var tailM = new T.ShaderMaterial({ uniforms: U0, transparent: true, depthWrite: false, blending: T.AdditiveBlending,
      vertexShader: head + 'void main(){float f=mod(seed.x+uT*seed.w*uSp,1.);float th=f*2.75;float ph=seed.y*6.2832;float c=cos(th);' +
        'float r=rs(c)*.78*(1.-.25*smoothstep(1.6,2.7,th));vec3 d=uS*c+(uA*cos(ph)+uB*sin(ph))*sin(th);vec3 p=d*r;if(th>1.9)p-=uS*(th-1.9)*5.;' +
        'vA=sin(f*3.1416)*.8*uK;vH=1.;vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=uPx*1.6*(6./-mv.z+.6);}',
      fragmentShader: 'varying float vA;void main(){vec2 d=gl_PointCoord-.5;float a=smoothstep(.5,0.,length(d));gl_FragColor=vec4(vec3(.45,.75,1.)*a*vA,1.);}' });
    G.add(new T.Points(seeds(small ? 1800 : 5000, function (a, k) { a[k] = Math.random(); a[k + 1] = Math.random(); a[k + 2] = 0; a[k + 3] = 0.05 + Math.random() * 0.05; }), tailM));
    // 极尖区:沿磁力线钻进两极,点亮极光环
    var cuspM = new T.ShaderMaterial({ uniforms: U0, transparent: true, depthWrite: false, blending: T.AdditiveBlending,
      vertexShader: head + 'void main(){float f=mod(seed.x+uT*seed.w*uSp,1.);float pole=seed.z>.5?1.:-1.;float ph=seed.y*6.2832;' +
        'vec3 P=vec3(0.,pole,0.);vec3 st=normalize(uS*1.6+P*1.2)*2.6;float lat=radians(70.);vec3 ring=(P*sin(lat)+(cos(ph)*normalize(cross(P,vec3(.3,0.,1.)))+sin(ph)*normalize(cross(P,normalize(cross(P,vec3(.3,0.,1.))))))*cos(lat))*1.012;' +
        'vec3 mid=normalize(st+ring)*2.2;vec3 p=mix(mix(st,mid,f),mix(mid,ring,f),f);vA=(f<.9?.5:1.4)*uK*(.6+uHot);vH=f;' +
        'vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=uPx*(f>.9?3.:1.5)*(6./-mv.z+.6);}',
      fragmentShader: 'varying float vA;varying float vH;void main(){vec2 d=gl_PointCoord-.5;float a=smoothstep(.5,0.,length(d));vec3 c=mix(vec3(.6,.85,1.),vec3(.35,1.,.55),smoothstep(.75,1.,vH));gl_FragColor=vec4(c*a*vA,1.);}' });
    G.add(new T.Points(seeds(small ? 900 : 2400, function (a, k) { a[k] = Math.random(); a[k + 1] = Math.random(); a[k + 2] = Math.random(); a[k + 3] = 0.25 + Math.random() * 0.2; }), cuspM));
    // 弓形激波发光面
    var shockM = new T.ShaderMaterial({ uniforms: U0, transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide,
      vertexShader: 'varying vec3 vN;varying vec3 vW;void main(){vN=normalize(mat3(modelMatrix)*normal);vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}',
      fragmentShader: 'uniform float uK,uHot,uT;varying vec3 vN;varying vec3 vW;void main(){vec3 v=normalize(cameraPosition-vW);float f=pow(1.-abs(dot(normalize(vN),v)),2.5);' +
        'float band=.7+.3*sin(length(vW)*4.-uT*2.);float fade=smoothstep(4.5,1.5,length(vW));gl_FragColor=vec4(mix(vec3(.4,.75,1.),vec3(1.,.55,.25),uHot)*f*band*.45*uK*fade,1.);}' });
    var pts = []; for (var i = 0; i <= 40; i++) { var th = i / 40 * 1.7, r = 2 / (1 + Math.cos(th)); pts.push(new T.Vector2(Math.sin(th) * r, Math.cos(th) * r)); }
    var shock = new T.Mesh(new T.LatheGeometry(pts, 64), shockM); G.add(shock); W.shock = shock;
    var last = performance.now(), tAcc = 0, up = new T.Vector3(0, 1, 0);
    S.addUpdater(function (dt0, now, mode) {
      var on = mode === 'earth' && W.on; G.visible = on; if (!on) return;
      var t2 = performance.now(), dt = Math.min(0.05, (t2 - last) / 1000); last = t2;
      var sun = (LE.earth && LE.earth.sun) || new T.Vector3(1, 0, 0), s = sun.clone().normalize();
      var a = up.clone().cross(s); if (a.lengthSq() < 1e-4) a.set(1, 0, 0); a.normalize(); var b = s.clone().cross(a).normalize();
      U0.uS.value.copy(s); U0.uA.value.copy(a); U0.uB.value.copy(b);
      var demo = W.demo > 0 ? (W.demo -= dt, Math.min(1, W.demo / 3)) : 0;
      var v = demo > 0 ? 1000 : (W.v || 420), kp = (window.SH && SH.eye && SH.eye.kp) || 2;
      var hot = Math.max(demo, Math.min(1, Math.max((v - 450) / 300, (kp - 4) / 3)));
      U0.uHot.value += (hot - U0.uHot.value) * Math.min(1, dt * 2);
      U0.uSp.value += (v / 420 - U0.uSp.value) * Math.min(1, dt * 2);
      var r0 = 2.6 - 0.9 * U0.uHot.value; U0.uR0.value += (r0 - U0.uR0.value) * Math.min(1, dt * 2);   // 风暴时激波被压近
      U0.uK.value = 0.85 + 0.5 * U0.uHot.value;
      tAcc += dt; U0.uT.value = tAcc;
      shock.scale.setScalar(U0.uR0.value * 1.08); shock.quaternion.setFromUnitVectors(up, s);
    });
  }

  /* ---------------- 数据与卡片 ---------------- */
  function num(x) { return x == null || isNaN(+x) ? null : +x; }
  function fetchData() {
    if (!LE.netcache) return;
    LE.netcache.text(URL_V, 5 * 60 * 1000, 8000, function (t) { return /proton_speed/.test(t); }).then(function (r) { try { var j = JSON.parse(r.text)[0] || JSON.parse(r.text); W.v = num(j.proton_speed); W.time = j.time_tag; } catch (e) { } }).catch(function () { });
    LE.netcache.text(URL_B, 5 * 60 * 1000, 8000, function (t) { return /bz_gsm/.test(t); }).then(function (r) { try { var j = JSON.parse(r.text)[0] || JSON.parse(r.text); W.bz = num(j.bz_gsm); W.bt = num(j.bt); } catch (e) { } }).catch(function () { });
  }
  function level() {
    var v = W.v, kp = window.SH && SH.eye && SH.eye.kp;
    if ((v && v > 700) || (kp != null && kp >= 7)) return '强太阳风暴';
    if ((v && v > 600) || (kp != null && kp >= 5)) return '太阳风暴';
    if (v && v > 500) return '偏快';
    return v ? '平静' : '数据连接中';
  }
  function card() {
    var kp = window.SH && SH.eye && SH.eye.kp, v = W.v;
    var mins = v ? Math.round(1.5e6 / v / 60) : null;
    LE.ui.showCard({ kind: 'swind', color: '#ffb46a', kicker: '太阳风 · NOAA SWPC 实测(日地 L1 点)', title: '太阳风 · ' + level(),
      rows: [['风速', v ? Math.round(v) + ' km/s' + (mins ? ' · 从 L1 吹到地球约 ' + mins + ' 分钟' : '') : '连接中'],
        ['磁场 Bz', W.bz != null ? W.bz + ' nT' + (W.bz < -5 ? '(向南,容易引发极光)' : W.bz < 0 ? '(略向南)' : '(向北,较平静)') : '—', 1],
        ['地磁 Kp', kp != null ? kp.toFixed(0) + (kp >= 5 ? ' · 地磁暴' : '') : '—', 1],
        ['看什么', '橙色粒子流从太阳方向吹来;地球磁场在前方挡出蓝色「弓形激波」,背后拖出长长的磁尾;少数粒子钻进两极,就是极光。'],
        ['说明', '尺寸为示意压缩:真实弓形激波约在 13 个地球半径外,磁尾长达数百个地球半径。']],
      actions: [{ label: '☄ 看一场太阳风暴(模拟)', fn: function () { W.demo = 14; if (LE.ui.toast) LE.ui.toast('模拟:约 1000 km/s 的日冕物质抛射冲击地球'); if (LE.audio) LE.audio.play('boom'); } }] });
  }
  function toggle(b) {
    W.on = !W.on; b.setAttribute('aria-pressed', W.on ? 'true' : 'false');
    if (W.on) { fetchData(); setTimeout(card, 2000); if (LE.scene.flyTo && LE.earth) { var s = LE.earth.sun.clone().normalize(), side = new THREE.Vector3(0, 1, 0).cross(s).normalize(); LE.scene.flyTo({ target: new THREE.Vector3(), position: side.multiplyScalar(12).add(new THREE.Vector3(0, 4, 0)), ms: 1800 }); } }
  }

  /* ---------------- 底部图层分组 ---------------- */
  var GROUPS = [
    { id: 'space', zh: '太空设施', en: 'ORBIT', keys: ['iss', 'orbiters', 'starlink', 'trails', 'shells'] },
    { id: 'earth', zh: '地球观测', en: 'EARTH', keys: ['quakes', 'storms', 'clouds', 'lights', 'flights'] },
    { id: 'sun', zh: '太阳与空间天气', en: 'SPACE WX', keys: ['swind', 'aurora', 'sunmoon', 'terminator'] }];
  var MK = 'gn:sh:chipgroup';
  function keyOf(b) { return b.dataset.layer || b.dataset.eye || b.dataset.sw || ''; }
  function group() {
    var bar = $('chips'); if (!bar || bar.dataset.grouped) return; bar.dataset.grouped = '1';
    var chips = [].slice.call(bar.querySelectorAll('.le-chip:not(.sh-nogroup)')), cur = 'sun';   // .sh-nogroup(实时数据开关)常驻,不进分组
    try { cur = localStorage.getItem(MK) || 'space'; } catch (e) { }
    var mods = {};
    GROUPS.forEach(function (g) {
      var m = document.createElement('div'); m.className = 'sh-mod'; m.dataset.g = g.id;
      m.innerHTML = '<button type="button" class="sh-mod__h"><b>' + g.zh + '</b><small>' + g.en + '</small><i></i></button><div class="sh-mod__in"></div>';
      bar.appendChild(m); mods[g.id] = m;
      m.querySelector('.sh-mod__h').onclick = function () { open(g.id); if (LE.audio) LE.audio.play('click'); };
    });
    function place(b) { var k = keyOf(b), g = GROUPS.filter(function (x) { return x.keys.indexOf(k) >= 0; })[0] || GROUPS[1]; mods[g.id].querySelector('.sh-mod__in').appendChild(b); }
    GROUPS.forEach(function (g) { g.keys.forEach(function (k) { chips.forEach(function (b) { if (keyOf(b) === k) place(b); }); }); });
    chips.forEach(function (b) { if (!b.parentNode.classList.contains('sh-mod__in')) place(b); });
    function count() { GROUPS.forEach(function (g) { var m = mods[g.id], all = m.querySelectorAll('.le-chip'), on = m.querySelectorAll('.le-chip[aria-pressed="true"]'); var tx = on.length + '/' + all.length, ic = m.querySelector('i'); if (ic.textContent !== tx) ic.textContent = tx; }); }
    function open(id) { cur = id; GROUPS.forEach(function (g) { mods[g.id].classList.toggle('is-open', g.id === id); }); try { localStorage.setItem(MK, id); } catch (e) { } count(); }
    new MutationObserver(function (ms) { ms.forEach(function (m) { [].forEach.call(m.addedNodes, function (n) { if (n.classList && n.classList.contains('le-chip') && !n.classList.contains('sh-nogroup') && n.parentNode === bar) place(n); }); }); count(); }).observe(bar, { childList: true, subtree: true, attributes: true, attributeFilter: ['aria-pressed'] });
    open(cur);
  }
  function addChip() {
    var bar = $('chips'); if (!bar) return;
    var b = document.createElement('button'); b.className = 'le-chip'; b.type = 'button'; b.dataset.sw = 'swind';
    b.setAttribute('aria-pressed', 'false'); b.style.setProperty('--c', '#ffb46a'); b.innerHTML = '太阳风<small>SOLAR WIND</small>';
    b.onclick = function () { toggle(b); }; bar.appendChild(b); W.chip = b;
  }
  window.SHWIND = { W: W, card: card };
  (function wait(k) {
    var ready = window.SH_READY && window.LE && LE.scene && LE.scene.earthScene && $('chips');
    if (ready && ($('chips').querySelector('[data-eye="aurora"]') && $('chips').querySelector('[data-layer="shells"]') || k > 200)) {
      try { build(); addChip(); group(); fetchData(); setInterval(function () { if (W.on) fetchData(); }, 5 * 60 * 1000); } catch (e) { console.error('[SHWIND]', e); }
      return;
    }
    if (k > 900) return; setTimeout(function () { wait(k + 1); }, 150);
  })(0);
})();
