/* 天枢 Starhelm · sh-focus.js · 点月球 → 此刻卡 → 飞近(v1.0-M1a)
 * 把 sh-sky.js 的月亮贴图精灵换成真正的 3D 月球:真实方向、真实大小比例(0.273 地球半径)、
 * 被真实太阳方向照亮(月相因此是真的),潮汐锁定的正面始终朝向地球;距离压缩到 4.2 个地球半径(真实约 60)。
 * 点击月球 → SHHUD 此刻卡(引线指向月球);「飞过去」→ 环绕月球;「回到地球」→ 回到家园。
 * 依赖:LE 内核、SH.sky(sh-sky.js)、SHHUD、SHNOW;任一缺失则不接管,旧行为保留。
 */
(function () {
  'use strict';
  var F = window.SHFOCUS = { mesh: null, focused: false };
  var R_MOON = 0.2727, PICK_R = 0.42;
  var VS = 'varying vec2 vUv;varying vec3 vN;void main(){vUv=uv;vN=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*viewMatrix*modelMatrix*vec4(position,1.0);}';
  var FS = 'uniform sampler2D map;uniform vec3 sun;varying vec2 vUv;varying vec3 vN;void main(){vec3 c=texture2D(map,vUv).rgb;float d=dot(normalize(vN),normalize(sun));float l=smoothstep(-0.04,0.12,d)*(0.25+0.95*max(d,0.0));gl_FragColor=vec4(c*(l*1.15)+c*0.018,1.0);}';

  var S, SKY, tgtPrev = null, vTmp;
  function moonP() { return SKY.sm.moonP; }
  F.moonKm = function () { try { return SHNOW.moon(window.SHTIME ? SHTIME.now() : new Date()).distKm; } catch (e) { return 384400; } };
  function screenPt() {
    var p = moonP(), sp = S.toScreen(p), q = p.clone().add(S.earthCam.up.clone().multiplyScalar(R_MOON)), sq = S.toScreen(q);
    if (sp.behind) return null;
    return { x: sp.x, y: sp.y, r: Math.max(18, Math.hypot(sq.x - sp.x, sq.y - sp.y) * 1.25) };
  }

  function build() {
    S = LE.scene; SKY = SH.sky; vTmp = new THREE.Vector3();
    var g = SKY.smGroup; if (!g || !SKY.sm) return false;
    var spr = g.children.filter(function (c) { return c.isSprite; })[1]; // [0] 太阳 · [1] 月亮
    if (spr) spr.visible = false;
    var geo = new THREE.SphereGeometry(R_MOON, 64, 32); geo.rotateY(-Math.PI / 2); // 经度 0(正面)转到 +z,配合 lookAt 朝向地球
    var tex = LE.assets.texture('planet-moon.jpg', true);
    var mat = new THREE.ShaderMaterial({ uniforms: { map: { value: tex }, sun: { value: LE.earth.sun } }, vertexShader: VS, fragmentShader: FS });
    var m = F.mesh = new THREE.Mesh(geo, mat); m.name = 'sh-moon3d'; g.add(m);
    // v1.0-M1b:太阳方向(昼夜线、城市灯光、月相)跟随统一时间轴
    var sunDir0 = LE.earth.sunDir, wasFast = false;
    LE.earth.sunDir = function (d) { return sunDir0(d || (window.SHTIME ? SHTIME.now() : new Date())); };
    S.addUpdater(function (dt, now, mode) {
      var fast = window.SHTIME && !SHTIME.isLive();
      if (fast || wasFast) LE.earth.sun.copy(LE.earth.sunDir());
      wasFast = fast;
      if (mode !== 'earth') return;
      var p = moonP(); m.position.copy(p); m.lookAt(0, 0, 0);
      if (F.focused) {   // 跟着月亮走(它每 5 秒按真实位置更新一次)
        if (tgtPrev && !S.fly) { vTmp.copy(p).sub(tgtPrev); if (vTmp.lengthSq() > 0) { S.earthCam.position.add(vTmp); S.earthCtl.target.add(vTmp); } }
        tgtPrev = (tgtPrev || new THREE.Vector3()).copy(p);
      }
      if (window.SHHUD && SHHUD.nowBody() === 'moon' && (++frame % 3 === 0)) SHHUD.movePt(screenPt());
    });
    // 优先级高于 sh-sky 的点选;命中月球球体即可
    S.addPicker({ mode: 'earth', priority: 6, fn: function (ray) {
      var hit = ray.ray.intersectsSphere(new THREE.Sphere(moonP(), PICK_R * Math.max(1, S.earthCam.position.distanceTo(moonP()) / 6)));
      return hit ? { score: 50, run: function () { F.showMoon(false); } } : null;
    } });
    // sh-sky 的旧月球卡(标签点击等入口)也改走此刻卡
    SKY.cardMoon = function () { F.showMoon(false); };
    SHHUD.on('fly', function (b) { if (b === 'moon') { if (F.focused) F.back(); else F.fly(); } });
    SHHUD.on('zoomout', function (b) { if (b === 'moon' && SH.moonLab) { SHHUD.hideNow(); SH.moonLab.open(); } });
    return true;
  }
  var frame = 0;

  F.showMoon = function (andFly) {
    if (!F.mesh) return;
    try { SH.progress.explore('moon'); } catch (e) { }
    if (LE.ui.closeCard) LE.ui.closeCard();
    if (!andFly && !F.focused) frame3();
    SHHUD.showNow('moon', screenPt());
    SHHUD.setActs(F.focused ? '‹ 回到地球' : '飞过去 ›', '月相实验室');
    SHHUD.guide('wangshu', '你今晚看到的月亮,也是这一面。猜猜看,它的背面为什么总藏着?',
      ['月亮自己转一圈要多久?', '它绕地球一圈又要多久?', '两个时间一样长,会发生什么?']);
    if (window.SHDOM) SHDOM.setFocus('moon');
    if (andFly && !F.focused) F.fly();
  };
  // 月球不在画面中间区域时,转动机位让地球和月亮同框(月亮在右侧)
  function frame3() {
    var sp = screenPt(), W = innerWidth, Hh = innerHeight;
    if (sp && sp.x > W * 0.42 && sp.x < W * 0.86 && sp.y > Hh * 0.15 && sp.y < Hh * 0.75 && !S.occluded(moonP())) return;
    var m = moonP().clone().normalize(), up = new THREE.Vector3(0, 1, 0), perp = new THREE.Vector3().crossVectors(up, m).normalize();
    if (perp.lengthSq() < 1e-6) perp.set(1, 0, 0);
    var dist = Math.max(8.5, S.earthCam.position.length()), wm = innerWidth / innerHeight < 1.5 ? 1.8 : 0.9;
    var pos = m.clone().multiplyScalar(wm).add(perp).normalize().multiplyScalar(dist);
    var fwd = pos.clone().negate().normalize(), right = new THREE.Vector3().crossVectors(fwd, up);
    if (right.dot(m) < 0) pos = m.clone().multiplyScalar(wm).sub(perp).normalize().multiplyScalar(dist);
    S.earthCtl.autoRotate = false;
    S.flyTo({ target: new THREE.Vector3(), position: pos, ms: matchMedia('(prefers-reduced-motion: reduce)').matches ? 300 : 1800 });
  }
  F.fly = function () {
    var p = moonP().clone(), dir = p.clone().normalize();
    // 站在地月之间偏一点,看月球正面;距离按屏幕大小
    var side = new THREE.Vector3().crossVectors(dir, S.earthCam.up).normalize();
    var pos = p.clone().sub(dir.clone().multiplyScalar(0.95)).add(side.multiplyScalar(0.35)).add(S.earthCam.up.clone().multiplyScalar(0.12));
    try { LE.audio.play('whoosh', 2.4); } catch (e) { }
    F.focused = true; tgtPrev = null; S.holdRotate = true; S.earthCtl.autoRotate = false;
    S.earthCtl.minDistance = R_MOON * 1.35; S.earthCtl.maxDistance = 6;
    S.flyTo({ target: p, position: pos, ms: matchMedia('(prefers-reduced-motion: reduce)').matches ? 300 : 2400, arc: false,
      done: function () { tgtPrev = moonP().clone(); } });
    SHHUD.setActs('‹ 回到地球', '月相实验室');
    if (window.SHDOM) SHDOM.setFocus('moon');
  };
  F.back = function () {
    var was = F.focused; F.focused = false; tgtPrev = null; S.holdRotate = false;
    S.earthCtl.minDistance = 1.08; S.earthCtl.maxDistance = 12;
    if (was) {
      try { LE.audio.play('whoosh', 2.2); } catch (e) { }
      var d = S.earthCam.position.clone(); if (d.lengthSq() < 1e-6) d.set(0, 0.6, 9);
      S.flyTo({ target: new THREE.Vector3(), position: d.normalize().multiplyScalar(Math.max(S.fitDistance(), 6.2)), ms: 2200, arc: false });
    }
    if (window.SHHUD) { SHHUD.hideNow(); SHHUD.guide('tianshu', '看见旁边那颗月亮了吗?点它,看看它此刻的样子。', []); }
    if (window.SHDOM) SHDOM.setFocus(null);
  };

  (function wait(k) {
    if (window.SH_READY && window.SHDOM && SHDOM.ready && SH.sky && SH.sky.sm && window.SHNOW && SHNOW.ok) {
      try { if (build()) { SHHUD.on('nowclose', function (b) { if (b === 'moon' && !F.focused && window.SHDOM) SHDOM.setFocus(null); }); } } catch (e) { console.error('[SHFOCUS] 月球接管失败', e); }
      return;
    }
    if (k > 900) return; setTimeout(function () { wait(k + 1); }, 100);
  })(0);
})();
