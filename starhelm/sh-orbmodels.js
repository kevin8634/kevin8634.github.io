/* 天枢 Starhelm · 天宫空间站 / 哈勃望远镜 近景 3D 模型(v0.6.1)
 * 程序化建模(依据公开构型图,比例做了夸张以便看清),相机靠近或「飞过去看看」时出现;
 * 姿态:天宫沿飞行方向、对地定向;哈勃镜筒指向固定天区缓慢扫描;辉光光晕 + 航行灯闪烁。 */
(function () {
  'use strict';
  function boot() {
    var SKY = window.SH && SH.sky, LE = window.LE;
    if (!SKY || !SKY.orbiters || !SKY.orbiters.css || !LE || !LE.models || !LE.scene || !LE.scene.addUpdater) return false;
    var T = THREE, M = LE.models, E = M.envMap();
    var mat = {
      white: new T.MeshStandardMaterial({ color: 0xe8ebef, metalness: 0.25, roughness: 0.5, envMap: E, envMapIntensity: 0.8 }),
      silver: new T.MeshStandardMaterial({ color: 0xe4e8ee, metalness: 0.7, roughness: 0.3, envMap: E, envMapIntensity: 1.5, emissive: 0x20242c }),
      foil: new T.MeshStandardMaterial({ color: 0xd2a64c, metalness: 1, roughness: 0.3, envMap: E }),
      dark: new T.MeshStandardMaterial({ color: 0x1a1d24, metalness: 0.6, roughness: 0.35, envMap: E }),
      cell: new T.MeshStandardMaterial({ map: M.cellTexture(4, 14, ['#163f86', '#0b1d45']), metalness: 0.6, roughness: 0.25, envMap: E, envMapIntensity: 1.4, emissive: 0x0a2a5a, emissiveIntensity: 0.6, side: T.DoubleSide }),
      cellGold: new T.MeshStandardMaterial({ map: M.cellTexture(3, 10, ['#3b2d74', '#1c1440']), metalness: 0.6, roughness: 0.3, envMap: E, emissive: 0x1a1240, emissiveIntensity: 0.5, side: T.DoubleSide })
    };
    function cyl(r, l, m, n) { var g = new T.CylinderGeometry(r, r, l, n || 28); g.rotateX(Math.PI / 2); return new T.Mesh(g, m); }
    function at(o, x, y, z) { o.position.set(x, y, z); return o; }
    function glowTex(rgb) {
      var c = document.createElement('canvas'); c.width = c.height = 128; var x = c.getContext('2d'), g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
      g.addColorStop(0, 'rgba(' + rgb + ',1)'); g.addColorStop(0.25, 'rgba(' + rgb + ',.45)'); g.addColorStop(1, 'rgba(' + rgb + ',0)');
      x.fillStyle = g; x.fillRect(0, 0, 128, 128); var t = new T.CanvasTexture(c); return t;
    }
    function glow(rgb, s, op) { var sp = new T.Sprite(new T.SpriteMaterial({ map: glowTex(rgb), blending: T.AdditiveBlending, transparent: true, depthWrite: false, opacity: op })); sp.scale.set(s, s, 1); return sp; }
    function wing(w, l, m) { var g = new T.Group(); var p = new T.Mesh(new T.BoxGeometry(w, 0.03, l), m); p.position.z = 0; g.add(p); g.add(new T.Mesh(new T.BoxGeometry(0.08, 0.08, l + 0.2), mat.silver)); return g; }

    /* 天宫:天和核心舱(沿飞行方向)+ 节点舱两侧问天、梦天实验舱(T 字构型)+ 尾部天舟货运 + 对地神舟 */
    function tiangong() {
      var g = new T.Group(), wings = [];
      g.add(at(cyl(0.42, 3.2, mat.white), 0, 0, -0.6)); g.add(at(cyl(0.58, 2.2, mat.white), 0, 0, -3.2));
      g.add(at(new T.Mesh(new T.SphereGeometry(0.62, 28, 18), mat.white), 0, 0, 1.3));
      g.add(at(cyl(0.6, 0.25, mat.foil), 0, 0, -2.0));
      [-1, 1].forEach(function (s) {
        var m = cyl(0.62, 5.6, mat.white); m.rotation.y = Math.PI / 2; g.add(at(m, s * 3.4, 0, 1.3));
        var band = cyl(0.64, 0.3, mat.foil); band.rotation.y = Math.PI / 2; g.add(at(band, s * 2.2, 0, 1.3));
        var wg = wing(1.6, 13, mat.cell); wg.rotation.x = Math.PI / 2; at(wg, s * 6.1, 0, 1.3); g.add(wg); wings.push(wg);   // 实验舱末端大太阳翼
      });
      [-1, 1].forEach(function (s) { var wg = wing(1.0, 6.2, mat.cellGold); wg.rotation.z = Math.PI / 2; wg.rotation.y = Math.PI / 2; at(wg, s * 3.6, 0, -2.8); g.add(wg); wings.push(wg); });   // 核心舱柔性翼
      g.add(at(cyl(0.5, 2.4, mat.white), 0, 0, -5.4)); g.add(at(cyl(0.52, 0.5, mat.foil), 0, 0, -4.6));          // 天舟
      [-1, 1].forEach(function (s) { var wg = wing(0.9, 3.4, mat.cell); wg.rotation.z = Math.PI / 2; wg.rotation.y = Math.PI / 2; at(wg, s * 2.3, 0, -5.6); g.add(wg); });
      var sz = new T.Group(); sz.add(cyl(0.38, 1.8, mat.white)); sz.add(at(new T.Mesh(new T.SphereGeometry(0.42, 18, 12), mat.white), 0, 0, 1.0));
      sz.rotation.x = Math.PI / 2; at(sz, 0, -1.6, 1.3); g.add(sz);                                                   // 神舟(对地口)
      var arm = cyl(0.06, 4.5, mat.silver); arm.rotation.x = 0.4; g.add(at(arm, 0.5, 0.75, -1.4));                  // 机械臂
      g.userData.wings = wings; return g;
    }
    /* 哈勃:镜筒 + 遮光罩与镜盖 + 两片太阳翼 + 两根高增益天线 */
    function hubble() {
      var g = new T.Group(), wings = [];
      g.add(at(cyl(0.72, 3.2, mat.silver, 36), 0, 0, 0.9)); g.add(at(cyl(0.95, 2.0, mat.silver, 36), 0, 0, -1.6));
      g.add(at(cyl(0.74, 0.12, mat.dark, 36), 0, 0, 2.5));
      var door = new T.Mesh(new T.CylinderGeometry(0.75, 0.75, 0.06, 36), mat.silver); door.rotation.x = -0.5; g.add(at(door, 0, 0.62, 2.85));
      g.add(at(cyl(0.97, 0.18, mat.foil, 36), 0, 0, -0.6));
      [-1, 1].forEach(function (s) {
        var boom = new T.Mesh(new T.BoxGeometry(0.9, 0.08, 0.08), mat.silver); g.add(at(boom, s * 1.35, 0, -0.9));
        var wg = new T.Group(); var p = new T.Mesh(new T.BoxGeometry(1.25, 0.03, 5.6), mat.cellGold); wg.add(p); at(wg, s * 2.45, 0, -0.9); g.add(wg); wings.push(wg);
        var ant = new T.Group(); ant.add(at(new T.Mesh(new T.BoxGeometry(0.05, 1.3, 0.05), mat.silver), 0, 0.65, 0));
        var dish = new T.Mesh(new T.SphereGeometry(0.35, 18, 8, 0, Math.PI * 2, 0, 0.8), mat.white); dish.position.y = 1.35; ant.add(dish);
        ant.rotation.x = s * 0.25; at(ant, 0, s * 0.95, -1.6); if (s < 0) ant.rotation.z = Math.PI; g.add(ant);
      });
      g.userData.wings = wings; return g;
    }
    var CFG = { css: { make: tiangong, size: 0.0026, rgb: '255,140,140' }, hst: { make: hubble, size: 0.0034, rgb: '190,170,255' } };
    var X = new T.Vector3(), Y = new T.Vector3(), Z = new T.Vector3(), m4 = new T.Matrix4(), q = new T.Quaternion(), sunL = new T.Vector3(), P = new T.Vector3();
    Object.keys(CFG).forEach(function (id) {
      var st = SKY.orbiters[id], c = CFG[id]; if (!st) return;
      var hero = c.make(); hero.scale.setScalar(c.size); hero.visible = false; st.group.add(hero);
      var halo = glow(c.rgb, 0.02, 0.5); hero.add(halo); halo.scale.set(16, 16, 1); halo.material.depthTest = true;
      var lr = glow('255,60,60', 1.2, 0.9), lg = glow('80,255,140', 1.2, 0.9); hero.add(at(lr, -6.9, 0, 1.3)); hero.add(at(lg, 6.9, 0, 1.3));
      if (id === 'hst') { lr.position.set(-3.1, 0, -0.9); lg.position.set(3.1, 0, -0.9); }
      st.hero = hero; st.navL = [lr, lg];
    });
    var S = LE.scene;
    S.addUpdater(function (dt, now, mode) {
      Object.keys(CFG).forEach(function (id) {
        var st = SKY.orbiters[id], h = st && st.hero; if (!h) return;
        var on = mode === 'earth' && st.group.visible && st.ok;
        if (!on) { h.visible = false; return; }
        P.copy(st.p).addScaledVector(st.v, (now - st.t) / 1000);
        var camD = S.earthCam.position.distanceTo(P), near = camD < 0.9;
        h.visible = near; st.marker.visible = camD > 0.25;
        if (!near) return;
        h.position.copy(P);
        Z.copy(st.v).normalize(); Y.copy(P).normalize(); X.crossVectors(Y, Z).normalize(); Z.crossVectors(X, Y).normalize();
        h.quaternion.setFromRotationMatrix(m4.makeBasis(X, Y, Z));
        if (id === 'hst') { q.setFromAxisAngle(X, -1.2 + 0.15 * Math.sin(now / 20000)); h.quaternion.premultiply(q); }
        var blink = (now % 1600) < 120; st.navL[0].material.opacity = blink ? 1 : 0.15; st.navL[1].material.opacity = ((now + 800) % 1600) < 120 ? 1 : 0.15;
        h.children.forEach(function (o) { if (o.isSprite && o.scale.x > 10) o.material.opacity = 0.35 + 0.15 * Math.sin(now / 600); });
      });
    });
    return true;
  }
  (function wait(n) { if (boot()) return; if (n < 400) setTimeout(function () { wait(n + 1); }, 150); })(0);
})();
