/* 天枢 Starhelm · sh-satmodels.js(v1.0-M2h)—— 导航 / 静止气象卫星群:光点换辉光星点 + 选中卫星的近景 3D 模型
 * 卫星群(轨道分层图层)原为纯色方点 → 改成发光圆点(加色混合,荧光感);
 * 点一颗卫星 → 详情卡多一个「◎ 飞过去看看」,镜头跟随飞近;靠近时出现该型卫星的程序化 3D 模型(按公开构型图简化,比例夸张以便看清):
 *   GPS / 北斗 / 伽利略:方形舱体 + 一对长太阳翼 + 对地导航天线阵;格洛纳斯:圆柱舱体 + 太阳翼;静止气象卫星:单侧大太阳翼 + 对地成像仪 + 太阳帆。
 * 位置由 sh-sky 的 SGP4 实时计算(CelesTrak 快照),每帧外推;辉光光晕 + 红绿航行灯。 */
(function () {
  'use strict';
  function boot() {
    var SKY = window.SH && SH.sky, LE = window.LE;
    if (!SKY || !SKY.setShells || !SKY.geo || !LE || !LE.models || !LE.scene || !LE.scene.addUpdater || !window.satellite) return false;
    var T = THREE, S = LE.scene, M = LE.models, E = M.envMap();
    var mat = {
      white: new T.MeshStandardMaterial({ color: 0xe8ebef, metalness: 0.25, roughness: 0.5, envMap: E, envMapIntensity: 0.8 }),
      silver: new T.MeshStandardMaterial({ color: 0xe4e8ee, metalness: 0.7, roughness: 0.3, envMap: E, envMapIntensity: 1.5, emissive: 0x20242c }),
      foil: new T.MeshStandardMaterial({ color: 0xd2a64c, metalness: 1, roughness: 0.3, envMap: E, emissive: 0x2a1c05 }),
      dark: new T.MeshStandardMaterial({ color: 0x1a1d24, metalness: 0.6, roughness: 0.35, envMap: E }),
      cell: new T.MeshStandardMaterial({ map: M.cellTexture(4, 14, ['#163f86', '#0b1d45']), metalness: 0.6, roughness: 0.25, envMap: E, envMapIntensity: 1.4, emissive: 0x0a2a5a, emissiveIntensity: 0.7, side: T.DoubleSide })
    };
    function box(w, h, d, m) { return new T.Mesh(new T.BoxGeometry(w, h, d), m); }
    function cyl(r, l, m) { return new T.Mesh(new T.CylinderGeometry(r, r, l, 24), m); }
    function at(o, x, y, z) { o.position.set(x, y, z); return o; }
    function glowTex(rgb, hard) {
      var c = document.createElement('canvas'); c.width = c.height = 64; var x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
      g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(hard ? 0.07 : 0.12, 'rgba(' + rgb + ',.95)'); g.addColorStop(hard ? 0.3 : 0.35, 'rgba(' + rgb + ',.28)'); g.addColorStop(1, 'rgba(' + rgb + ',0)');
      x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new T.CanvasTexture(c);
    }
    function sprite(rgb, s, op) { var sp = new T.Sprite(new T.SpriteMaterial({ map: glowTex(rgb), blending: T.AdditiveBlending, transparent: true, depthWrite: false, opacity: op })); sp.scale.set(s, s, 1); return sp; }

    // 本地坐标:+Y 指向地心(对地面),+Z 沿飞行方向,太阳翼沿 ±X
    function navSat(round) {
      var g = new T.Group();
      g.add(round ? cyl(0.7, 2.4, mat.white) : box(1.6, 1.8, 1.6, mat.foil));
      if (round) { var c = cyl(0.72, 0.3, mat.foil); g.add(c); }
      var ant = new T.Group(); for (var i = 0; i < 12; i++) { var a = i / 12 * Math.PI * 2, r = i % 2 ? 0.55 : 0.3; ant.add(at(cyl(0.07, 0.5, mat.silver), Math.cos(a) * r, 0, Math.sin(a) * r)); }
      at(ant, 0, 1.15, 0); g.add(ant); g.add(at(box(1.3, 0.08, 1.3, mat.white), 0, 0.92, 0));
      [-1, 1].forEach(function (s) {
        g.add(at(box(1.0, 0.07, 0.07, mat.silver), s * 1.3, 0, 0));
        [0, 1].forEach(function (k) { g.add(at(box(2.1, 0.04, 1.5, mat.cell), s * (2.0 + k * 2.2), 0, 0)); });
      });
      return g;
    }
    function geoSat() {
      var g = new T.Group();
      g.add(box(1.8, 2.2, 1.8, mat.foil));
      g.add(at(box(0.9, 0.7, 0.9, mat.white), 0, 1.4, 0));                          // 对地成像仪
      g.add(at(cyl(0.32, 0.25, mat.dark), 0, 1.85, 0));
      g.add(at(box(1.2, 0.07, 0.07, mat.silver), -1.5, 0, 0));
      [0, 1, 2].forEach(function (k) { g.add(at(box(2.0, 0.04, 2.0, mat.cell), -3.1 - k * 2.1, 0, 0)); });   // 单侧大太阳翼
      var boom = cyl(0.04, 3.2, mat.silver); boom.rotation.z = Math.PI / 2; g.add(at(boom, 2.5, 0, 0));
      var sail = new T.Mesh(new T.ConeGeometry(0.9, 1.6, 16, 1, true), mat.foil); sail.rotation.z = -Math.PI / 2; g.add(at(sail, 4.4, 0, 0));   // 太阳帆(平衡光压)
      var dish = new T.Mesh(new T.SphereGeometry(0.5, 16, 8, 0, Math.PI * 2, 0, 0.9), mat.white); g.add(at(dish, 0.6, 1.2, 0.7));
      return g;
    }
    var RGB = { gps: '127,212,255', beidou: '255,210,127', galileo: '157,255,176', glonass: '255,157,176', geo: '214,179,255' };
    var heroes = {}, hero = null, heroKind = null, sel = null;
    function getHero(g) {
      if (!heroes[g]) {
        var h = g === 'geo' ? geoSat() : navSat(g === 'glonass');
        h.add(sprite(RGB[g], 14, 0.4)); var lr = sprite('255,60,60', 1.1, 0.9), lg = sprite('80,255,140', 1.1, 0.9);
        h.add(at(lr, -6.5, 0, 0)); h.add(at(lg, g === 'geo' ? 5 : 6.5, 0, 0)); h.userData.nav = [lr, lg];
        h.scale.setScalar(0.003); h.visible = false; S.earthScene.add(h); heroes[g] = h;
      }
      return heroes[g];
    }

    // 1) 卫星群光点 → 辉光星点
    function glowPoints() {
      var P = SKY.shells && SKY.shells.points; if (!P || P.userData.glow) return;
      P.material.map = glowTex('255,255,255', true); P.material.blending = T.AdditiveBlending; P.material.size = 16; P.material.alphaTest = 0.01; P.material.needsUpdate = true;
      P.userData.glow = true;
    }
    var origSet = SKY.setShells;
    SKY.setShells = function (on) { origSet(on); glowPoints(); if (!on) select(null); };

    // 2) 选中 → 卡片加「飞过去看看」
    var origCard = SKY.cardShell;
    SKY.cardShell = function (s) {
      origCard(s); select(s);
      var act = document.getElementById('card-actions');
      if (act && !act.querySelector('.sh-satfly')) {
        var b = document.createElement('button'); b.type = 'button'; b.className = 'le-btn sh-satfly'; b.textContent = '◎ 飞过去看看';
        b.addEventListener('click', function () { fly(s); }); act.appendChild(b);
      }
    };
    function select(s) {
      sel = s; if (hero) hero.visible = false; hero = s ? getHero(s.g) : null; heroKind = s && s.g;
      if (s) { s._p = new T.Vector3(); s._p2 = new T.Vector3(); s._v = new T.Vector3(); s._t = 0; }
    }
    function live(now) {
      if (!sel) return null;
      if (now - sel._t > 500) {
        var d = new Date(now); if (SKY.geo(sel.rec, d, sel._p) && SKY.geo(sel.rec, new Date(now + 1000), sel._p2)) { sel._v.subVectors(sel._p2, sel._p); sel._t = now; }
      }
      return sel._t ? sel._p2.copy(sel._p).addScaledVector(sel._v, (now - sel._t) / 1000) : null;
    }
    var FP = new T.Vector3();
    function fly(s) {
      if (sel !== s) select(s);
      var fr = { up: new T.Vector3(), fwd: new T.Vector3() };
      function get() { var p = live(Date.now()); return p ? FP.copy(p) : FP; }
      S.cinematic({ get: get, frame: function () { fr.up.copy(get()).normalize(); fr.fwd.copy(sel._v).normalize(); return fr; }, offset: { back: 0.11, up: 0.04, side: 0.05 }, ms: 4200 });
    }

    // 3) 每帧:模型就位、对地定向、航行灯闪烁
    var X = new T.Vector3(), Y = new T.Vector3(), Z = new T.Vector3(), m4 = new T.Matrix4();
    S.addUpdater(function (dt, now, mode) {
      if (!hero) return;
      var on = mode === 'earth' && SKY.shells && SKY.shells.on, p = on && live(now);
      if (!p) { hero.visible = false; return; }
      var camD = S.earthCam.position.distanceTo(p);
      hero.visible = camD < 0.8; if (!hero.visible) return;
      hero.position.copy(p);
      Y.copy(p).normalize().negate(); Z.copy(sel._v).normalize(); X.crossVectors(Y, Z).normalize(); Z.crossVectors(X, Y).normalize();
      hero.quaternion.setFromRotationMatrix(m4.makeBasis(X, Y, Z));
      var n = hero.userData.nav; n[0].material.opacity = (now % 1500) < 110 ? 1 : 0.12; n[1].material.opacity = ((now + 750) % 1500) < 110 ? 1 : 0.12;
    });
    window.SHSATS3D = { select: select, fly: fly, heroes: heroes };
    return true;
  }
  (function wait(n) { if (boot()) return; if (n < 400) setTimeout(function () { wait(n + 1); }, 150); })(0);
})();
