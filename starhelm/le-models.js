/* =====================================================================
 * Live Earth 2.2 · le-models.js
 * LE.models：近景“英雄模型”与材质工具
 *  - envMap()      程序生成的环境反射（下方地球蓝光 + 上方深空），给金属件真实反光
 *  - starlink()    星链 V2 Mini 精细模型（约 1:1 比例单位为米）：
 *                  平板本体 + 底部 4 块相控阵天线 + 激光星间链路终端 + 星敏感器 + 霍尔推进器羽流
 *                  + 两翼 6 段式太阳能板（电池片纹理，正面追日）
 *  - iss(cb)       国际空间站：NASA 3D Resources 公开模型（ISS B），从 iss-model.js 内嵌数据解析，
 *                  重新上材质（金色太阳翼 / 银白舱段 / 白色散热板）
 *  坐标约定：模型 +Y = 天顶（背离地心），+Z = 飞行方向，+X = 右侧。
 * ===================================================================== */
(function () {
  'use strict';
  var LE = window.LE;
  var M = (LE.models = {});

  /* ------------------------------ 画布纹理 ------------------------------ */
  function canvasTex(w, h, draw, srgb) {
    var cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    draw(cv.getContext('2d'), w, h);
    var t = new THREE.CanvasTexture(cv);
    if (srgb !== false) t.encoding = THREE.sRGBEncoding;
    t.anisotropy = 8;
    return t;
  }
  /** 太阳能电池片：深蓝单晶硅片 + 银色栅线 + 片间白缝 */
  M.cellTexture = function (cols, rows, base) {
    return canvasTex(512, 256, function (x, w, h) {
      x.fillStyle = '#d9dde4'; x.fillRect(0, 0, w, h);
      var cw = w / cols, ch = h / rows;
      for (var i = 0; i < cols; i++) for (var j = 0; j < rows; j++) {
        var g = x.createLinearGradient(i * cw, j * ch, (i + 1) * cw, (j + 1) * ch);
        g.addColorStop(0, base[0]); g.addColorStop(1, base[1]);
        x.fillStyle = g; x.fillRect(i * cw + 1.5, j * ch + 1.5, cw - 3, ch - 3);
        x.strokeStyle = 'rgba(200,215,235,0.35)'; x.lineWidth = 0.6;
        for (var k = 1; k < 4; k++) { x.beginPath(); x.moveTo(i * cw + 2, j * ch + ch * k / 4); x.lineTo((i + 1) * cw - 2, j * ch + ch * k / 4); x.stroke(); }
      }
    });
  };
  function panelLines(color, line) {
    return canvasTex(256, 256, function (x, w, h) {
      x.fillStyle = color; x.fillRect(0, 0, w, h);
      x.strokeStyle = line; x.lineWidth = 2;
      for (var i = 0; i <= 4; i++) { x.beginPath(); x.moveTo(i * w / 4, 0); x.lineTo(i * w / 4, h); x.stroke(); x.beginPath(); x.moveTo(0, i * h / 4); x.lineTo(w, i * h / 4); x.stroke(); }
      for (var n = 0; n < 160; n++) { x.fillStyle = 'rgba(255,255,255,' + (Math.random() * 0.06) + ')'; x.fillRect(Math.random() * w, Math.random() * h, 6 + Math.random() * 20, 2); }
    });
  }

  /* ------------------------------ 环境反射 ------------------------------ */
  var env = null;
  M.envMap = function () {
    if (env) return env;
    var tex = canvasTex(256, 128, function (x, w, h) {
      var g = x.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#000004'); g.addColorStop(0.45, '#05070d'); g.addColorStop(0.52, '#3d6ea8');
      g.addColorStop(0.7, '#1d3f6e'); g.addColorStop(1, '#0b1c33');
      x.fillStyle = g; x.fillRect(0, 0, w, h);
      x.fillStyle = 'rgba(255,255,255,0.18)';
      for (var i = 0; i < 26; i++) { x.beginPath(); x.ellipse(Math.random() * w, h * (0.58 + Math.random() * 0.35), 6 + Math.random() * 18, 2 + Math.random() * 3, 0, 0, 7); x.fill(); }
    });
    tex.mapping = THREE.EquirectangularReflectionMapping;
    var pm = new THREE.PMREMGenerator(LE.scene.renderer);
    env = pm.fromEquirectangular(tex).texture;
    pm.dispose(); tex.dispose();
    return env;
  };

  /* ------------------------------ 星链 V2 Mini ------------------------------ */
  M.starlink = function () {
    var E = M.envMap(), g = new THREE.Group();
    var bodyMat = new THREE.MeshStandardMaterial({ map: panelLines('#5d6470', 'rgba(20,22,28,0.8)'), metalness: 0.7, roughness: 0.38, envMap: E, envMapIntensity: 1.2 });
    var foilMat = new THREE.MeshStandardMaterial({ color: 0xc9a24a, metalness: 1, roughness: 0.28, envMap: E });
    var whiteMat = new THREE.MeshStandardMaterial({ color: 0xe9ecf0, metalness: 0.1, roughness: 0.55, envMap: E, envMapIntensity: 0.6 });
    var darkMat = new THREE.MeshStandardMaterial({ color: 0x15171c, metalness: 0.5, roughness: 0.3, envMap: E });
    var chromeMat = new THREE.MeshStandardMaterial({ color: 0xdfe4ea, metalness: 1, roughness: 0.15, envMap: E });
    function add(geo, mat, x, y, z, rx, ry, rz) { var m = new THREE.Mesh(geo, mat); m.position.set(x || 0, y || 0, z || 0); m.rotation.set(rx || 0, ry || 0, rz || 0); g.add(m); return m; }

    // 本体：平板式（便于一箭多星堆叠）
    add(new THREE.BoxGeometry(2.7, 0.32, 4.1), bodyMat);
    add(new THREE.BoxGeometry(2.74, 0.04, 4.14), foilMat, 0, 0.17, 0);             // 顶面金色多层隔热膜
    // 底部（朝地）4 块相控阵天线 + 2 块网关抛物面
    for (var i = 0; i < 4; i++) add(new THREE.BoxGeometry(1.05, 0.06, 0.85), whiteMat, (i % 2 ? 0.62 : -0.62), -0.19, (i < 2 ? 1.2 : 0.2));
    [-0.7, 0.7].forEach(function (x) {
      add(new THREE.SphereGeometry(0.42, 24, 12, 0, Math.PI * 2, 0, 0.9), whiteMat, x, -0.2, -1.35, Math.PI, 0, 0);
    });
    // 激光星间链路终端（3 个）
    [[-1.0, 1.6], [1.0, 1.6], [0, -1.7]].forEach(function (p) {
      add(new THREE.CylinderGeometry(0.16, 0.2, 0.22, 20), darkMat, p[0], 0.3, p[1]);
      add(new THREE.SphereGeometry(0.15, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), chromeMat, p[0], 0.41, p[1]);
    });
    // 星敏感器
    [-0.9, 0.9].forEach(function (x) {
      add(new THREE.CylinderGeometry(0.09, 0.09, 0.3, 14), chromeMat, x, 0.25, -1.75, 0.5, 0, 0);
      add(new THREE.CircleGeometry(0.07, 14), darkMat, x, 0.38, -1.66, -1.07, 0, 0);
    });
    // 霍尔推进器（尾部）+ 蓝紫色等离子羽流
    add(new THREE.CylinderGeometry(0.16, 0.22, 0.28, 20), darkMat, 0, 0, -2.18, Math.PI / 2, 0, 0);
    var plume = add(new THREE.ConeGeometry(0.22, 1.6, 24, 1, true), new THREE.MeshBasicMaterial({ color: 0x8f7dff, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }), 0, 0, -3.1, -Math.PI / 2, 0, 0);
    plume.renderOrder = 3;

    // 太阳翼：顶部支架 + 两翼各 6 段电池板（正面电池片，背面白色）
    var cellTex = M.cellTexture(12, 6, ['#14234f', '#0b1533']);
    var cellMat = new THREE.MeshStandardMaterial({ map: cellTex, metalness: 0.35, roughness: 0.22, envMap: E, envMapIntensity: 1.4, side: THREE.FrontSide });
    var backMat = new THREE.MeshStandardMaterial({ color: 0xd8d4c8, metalness: 0.2, roughness: 0.6, side: THREE.FrontSide });
    var wings = [];
    [-1, 1].forEach(function (side) {
      var w = new THREE.Group(); w.position.set(side * 1.45, 0.34, 0.0); g.add(w);
      w.add(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 0.12), chromeMat)).position.set(side * 0.2, 0, 0);
      var boom = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 13.6, 8), chromeMat); boom.rotation.z = Math.PI / 2; boom.position.x = side * 7.1; w.add(boom);
      for (var k = 0; k < 6; k++) {
        var cx = side * (0.75 + k * 2.25 + 1.05);
        var front = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 3.3), cellMat); front.rotation.x = -Math.PI / 2; front.position.set(cx, 0.012, 0); w.add(front);
        var back = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 3.3), backMat); back.rotation.x = Math.PI / 2; back.position.set(cx, -0.012, 0); w.add(back);
      }
      wings.push(w);
    });
    g.userData.wings = wings;      // 每帧绕 X 轴旋转追日
    g.userData.plume = plume;
    return g;
  };

  /* ------------------------------ 国际空间站 ------------------------------ */
  var issPromise = null;
  function loadScript(src) {
    return new Promise(function (res, rej) { var s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
  }
  M.iss = function () {
    if (issPromise) return issPromise;
    issPromise = Promise.all([
      window.LE_ISS_GLB ? Promise.resolve() : loadScript('iss-model.js'),
      THREE.GLTFLoader ? Promise.resolve() : loadScript('GLTFLoader.js')
    ]).then(function () {
      var b64 = window.LE_ISS_GLB, bin = atob(b64), buf = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
      return new Promise(function (res, rej) { new THREE.GLTFLoader().parse(buf.buffer, '', res, rej); });
    }).then(function (gltf) {
      var E = M.envMap(), root = gltf.scene;
      var arrayMat = new THREE.MeshStandardMaterial({ map: M.cellTexture(8, 16, ['#5a3a12', '#2e1d08']), color: 0xffd9a0, metalness: 0.45, roughness: 0.3, envMap: E, side: THREE.DoubleSide });
      var trussMat = new THREE.MeshStandardMaterial({ map: panelLines('#9aa0a8', 'rgba(40,44,52,0.9)'), metalness: 0.8, roughness: 0.35, envMap: E });
      var moduleMat = new THREE.MeshStandardMaterial({ map: panelLines('#e6e8ea', 'rgba(150,155,165,0.7)'), metalness: 0.25, roughness: 0.5, envMap: E, envMapIntensity: 0.7, side: THREE.DoubleSide });
      var hide = [];
      root.traverse(function (o) {
        if (/^(bendedtru|pCylinder)/.test(o.name)) { hide.push(o); return; }
        if (!o.isMesh) return;
        var n = o.material && o.material.name || '';
        o.material = /lambert7/.test(n) ? arrayMat : /lambert3/.test(n) ? trussMat : moduleMat;
      });
      hide.forEach(function (o) { o.visible = false; });
      // 居中、统一朝向：模型 Z（桁架）→ 右侧 X；模型 Y（舱段）→ 飞行方向 Z；模型 X → 天顶 Y
      var box = new THREE.Box3();
      root.updateMatrixWorld(true);
      root.traverse(function (o) { if (o.isMesh && o.visible) box.expandByObject(o); });
      var c = box.getCenter(new THREE.Vector3()), size = box.getSize(new THREE.Vector3());
      root.position.sub(c);
      var holder = new THREE.Group(); holder.add(root);
      var wrap = new THREE.Group(); wrap.add(holder);
      holder.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1), new THREE.Vector3(1, 0, 0)));
      wrap.userData.span = Math.max(size.x, size.y, size.z);   // 模型单位（约 45）
      return wrap;
    });
    return issPromise;
  };
})();
