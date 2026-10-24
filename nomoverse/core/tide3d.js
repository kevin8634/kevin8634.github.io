/* 宙律 Nomoverse · 潮汐任务 3D 舞台(v0.6-α1 · 方案 A+B「太空地月 × 海岸实景」)
   只负责「画」,物理由关卡逻辑(NV.Phys 潮汐部分)计算;关卡每帧把画面参数写进 st.tide3:
     space:{ x, y, w, h, cx, cy, R }   太空视角矩形(安全区像素)与地球中心、半径(像素);null = 不画
     coast:{ x, y, w, h }              海岸视角矩形;null = 不画
     spin   地球自转角(rad)          town  小镇经度(rad,相对贴图)
     moonAng 月亮方位(rad,0 = 右)   moonD 屏幕上的地月距离(地球半径,已压缩) moonS 月亮显示大小倍数
     sunAng 太阳方向(rad,π = 左)    Am, As 月亮 / 太阳潮汐鼓包(地球半径,已放大)  lag 鼓包超前角(rad)
     brk    0–1 月亮被潮汐撕碎程度(洛希极限)
     level  海岸水位(-1…1.6,已归一)  moonAlt / moonAz 海岸天空中月亮高度 / 方位(度)  phase 月相角(0 新月,π 满月)
   太空:地球(Solar System Scope 8K→4K/2K,CC BY 4.0)+ 云层 + 半透明海水壳(按 P₂ 引潮势位移)+ 月球 + NASA 星空。
   海岸:Poly Haven 沙滩 / 岩石(CC0)+ 黄昏天空(CC0)+ 程序海面(菲涅耳反射、月光碎影、岸边白沫)+ 潮位标尺 + 灯塔。 */
"use strict";
import { tierInfo, createRenderer, canvasTex, glowTex } from "./nvscene.js";

var FOV = 26;
var ASSET = new URL("../assets/", import.meta.url).href;

var NOISE = [
  "float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }",
  "float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);",
  "  return mix(mix(h21(i), h21(i + vec2(1,0)), f.x), mix(h21(i + vec2(0,1)), h21(i + vec2(1,1)), f.x), f.y); }",
  "float fbm(vec2 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { s += a * vn(p); p = p * 2.03 + 17.1; a *= 0.5; } return s; }"
].join("\n");

export function mount(THREE, canvas, opts) {
  opts = opts || {};
  var T = tierInfo(), hi = T.tier === "high", W = window;
  var renderer = createRenderer(THREE, { canvas: canvas, alpha: false, clear: 0x05040f, onLost: opts.onLost });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.autoClear = false;
  var ANISO = Math.min(hi ? 16 : 8, renderer.capabilities.getMaxAnisotropy ? renderer.capabilities.getMaxAnisotropy() : 4);
  // 高清贴图:高档 地球 / 月球 / 星空 4K、沙滩岩石 2K;中档 / 手机 2K / 1K(实拍高清,不用低质图)
  var RES = hi ? "4k" : "2k", RES2 = hi ? "2k" : "1k";
  var loader = new THREE.TextureLoader(), disposed = false, texs = [];
  var state = { ok: true, W: 0, H: 0, zone: { x: 0, y: 0, w: 1, h: 1 }, t0: performance.now(), cur: { Am: 0.2, As: 0, lag: 0, level: 0, brk: 0 } };
  function tex(path, srgb, fatal, rep) {
    var t = loader.load(ASSET + path, undefined, undefined, function () {
      if (W.console) console.warn("[nv] 贴图加载失败:", path);
      if (fatal && !disposed && opts.onLost) opts.onLost(new Error("贴图加载失败:" + path));
    });
    t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.anisotropy = ANISO;
    if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, rep); }
    texs.push(t); return t;
  }
  var glow = glowTex(THREE);

  /* =================== 太空视角 =================== */
  var sS = new THREE.Scene();
  var camS = new THREE.PerspectiveCamera(FOV, 1, 0.1, 20000);
  var skyS = new THREE.Mesh(new THREE.SphereGeometry(6000, 64, 32), new THREE.MeshBasicMaterial({ map: tex("hoop/sky_space_" + RES + ".jpg", true), side: THREE.BackSide, depthWrite: false }));
  skyS.material.color.setScalar(0.13); skyS.rotation.set(0.4, 1.2, 0); skyS.renderOrder = -10; sS.add(skyS);
  // 清晰的点状星(窄视场下贴图星会被放大发糊,另铺一层屏幕像素大小的星点)
  (function () { var n = hi ? 4000 : 2200, p = new Float32Array(n * 3), col = new Float32Array(n * 3);
    for (var k = 0; k < n; k++) { var u = Math.random() * 2 - 1, th = Math.random() * Math.PI * 2, r = Math.sqrt(1 - u * u); p[k * 3] = r * Math.cos(th) * 5000; p[k * 3 + 1] = u * 5000; p[k * 3 + 2] = r * Math.sin(th) * 5000;
      var b = 0.35 + Math.pow(Math.random(), 4) * 0.65, tint = Math.random(); col[k * 3] = b * (tint > 0.8 ? 1 : 0.85); col[k * 3 + 1] = b * 0.9; col[k * 3 + 2] = b * (tint < 0.3 ? 1 : 0.9); }
    var g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(p, 3)); g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    var pts = new THREE.Points(g, new THREE.PointsMaterial({ size: hi ? 1.6 : 1.3, sizeAttenuation: false, vertexColors: true, depthWrite: false, transparent: true }));
    pts.renderOrder = -9; skyS.add(pts); })();
  var sys = new THREE.Group(); sS.add(sys);                 // 轨道面 = xz 平面,整体略微前倾让鼓包看得清
  sys.rotation.x = 0.2;
  var sunL = new THREE.DirectionalLight(0xfff4e6, 2.6); sS.add(sunL); sS.add(sunL.target);
  sS.add(new THREE.AmbientLight(0x5a6a9a, 0.55));
  var earth = new THREE.Group(); sys.add(earth);
  var earthMesh = new THREE.Mesh(new THREE.SphereGeometry(1, hi ? 128 : 96, hi ? 64 : 48), new THREE.MeshStandardMaterial({ map: tex("tide/earth_" + RES + ".jpg", true, true), roughness: 0.85, metalness: 0 }));
  earth.add(earthMesh);
  var clouds = new THREE.Mesh(new THREE.SphereGeometry(1.012, hi ? 96 : 64, hi ? 48 : 32), new THREE.MeshStandardMaterial({ color: 0xffffff, alphaMap: tex("tide/clouds_" + RES + ".jpg", false), transparent: true, opacity: 0.85, depthWrite: false, roughness: 1 }));
  earth.add(clouds);
  // 小镇标记(随地球自转)
  var townMk = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: 0xffd36b, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  townMk.scale.setScalar(0.16); earth.add(townMk);
  var townDot = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffe08a })); earth.add(townDot);
  // 海水壳:顶点按 P₂(cosθ) 引潮势位移(月亮 + 太阳),鼓包超前 lag
  var UW = { uM: { value: new THREE.Vector3(1, 0, 0) }, uS: { value: new THREE.Vector3(-1, 0, 0) }, uAm: { value: 0.2 }, uAs: { value: 0 }, uSun: { value: new THREE.Vector3(-1, 0, 0) }, uTime: { value: 0 } };
  var water = new THREE.Mesh(new THREE.SphereGeometry(1, 128, 64), new THREE.ShaderMaterial({
    uniforms: UW, transparent: true, depthWrite: false,
    vertexShader: [
      "uniform vec3 uM, uS; uniform float uAm, uAs; varying vec3 vN; varying vec3 vV; varying vec3 vW;",
      "float P2(float x){ return 0.5 * (3.0 * x * x - 1.0); }",
      "void main(){ vec3 n = normalize(position);",
      "  float r = 1.035 + uAm * P2(dot(n, uM)) + uAs * P2(dot(n, uS));",
      "  vec4 wp = modelMatrix * vec4(n * r, 1.0); vW = wp.xyz; vN = normalize(mat3(modelMatrix) * n); vV = normalize(cameraPosition - wp.xyz);",
      "  gl_Position = projectionMatrix * viewMatrix * wp; }"
    ].join("\n"),
    fragmentShader: [
      "uniform vec3 uSun; uniform float uTime; varying vec3 vN; varying vec3 vV; varying vec3 vW;",
      "void main(){ float f = pow(1.0 - abs(dot(vN, vV)), 2.2); float l = 0.35 + 0.65 * max(0.0, dot(vN, uSun));",
      "  vec3 c = mix(vec3(0.05, 0.45, 0.75), vec3(0.45, 0.95, 1.0), f) * l;",
      "  float a = 0.16 + 0.62 * f; gl_FragColor = vec4(c, a); }"
    ].join("\n")
  }));
  water.renderOrder = 2; sys.add(water);
  // 大气辉光
  var atm = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: 0x5fb4ff, transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending }));
  atm.scale.setScalar(3.1); atm.renderOrder = -1; sys.add(atm);
  // 月球与碎片
  var moonTex = tex("tide/moon_" + RES + ".jpg", true, true);
  var moon = new THREE.Mesh(new THREE.SphereGeometry(1, 96, 48), new THREE.MeshStandardMaterial({ map: moonTex, roughness: 1, metalness: 0 }));
  sys.add(moon);
  var NF = hi ? 900 : 450, frag = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), new THREE.MeshStandardMaterial({ map: moonTex, roughness: 1, color: 0xd8d2c8 }), NF);
  frag.visible = false; sys.add(frag);
  var FR = []; for (var i = 0; i < NF; i++) FR.push({ a: Math.random() - 0.5, r: (Math.random() - 0.5), y: (Math.random() - 0.5), s: 0.25 + Math.pow(Math.random(), 3) * 0.9, rx: Math.random() * 6, ry: Math.random() * 6 });
  var mtx = new THREE.Matrix4(), q = new THREE.Quaternion(), e3 = new THREE.Euler(), v3 = new THREE.Vector3(), s3 = new THREE.Vector3();

  /* =================== 海岸视角 =================== */
  var sC = new THREE.Scene();
  var camC = new THREE.PerspectiveCamera(48, 1, 0.1, 5000);
  camC.position.set(0, 2.1, 13); camC.lookAt(0, 1.0, -40);
  var skyMat = new THREE.MeshBasicMaterial({ map: tex("hoop/sky_dusk_" + RES + ".jpg", true), side: THREE.BackSide, depthWrite: false, fog: false });
  skyMat.color.setRGB(0.36, 0.37, 0.5);
  var skyC = new THREE.Mesh(new THREE.SphereGeometry(2000, 64, 32), skyMat); skyC.rotation.y = 1.2; skyC.renderOrder = -10; sC.add(skyC);
  sC.fog = new THREE.Fog(0x2a2c4a, 120, 900);
  var hemi = new THREE.HemisphereLight(0xa9b8e8, 0x5a4636, 1.7); sC.add(hemi);
  var moonLight = new THREE.DirectionalLight(0xdfe6ff, 1.1); moonLight.position.set(10, 20, -30); sC.add(moonLight);
  var warm = new THREE.DirectionalLight(0xffb27a, 0.55); warm.position.set(-40, 8, -60); sC.add(warm);
  // 沙滩(随水位画湿沙与白沫)
  var sandD = tex("tide/sand_d" + RES2 + ".jpg", true, false, 10), sandN = tex("tide/sand_n" + RES2 + ".jpg", false, false, 10);
  var beachG = new THREE.PlaneGeometry(260, 90, 160, 70); beachG.rotateX(-Math.PI / 2);
  (function () { var p = beachG.attributes.position; for (var k = 0; k < p.count; k++) { var x = p.getX(k), z = p.getZ(k); p.setY(k, beachY(x, z)); } beachG.computeVertexNormals(); })();
  beachG.translate(0, 0, -10);
  var UB = { uLevel: { value: 0 }, uTime: { value: 0 } };
  var beachMat = new THREE.MeshStandardMaterial({ map: sandD, normalMap: sandN, roughness: 0.95, metalness: 0 });
  beachMat.onBeforeCompile = function (sh) {
    sh.uniforms.uLevel = UB.uLevel; sh.uniforms.uTime = UB.uTime;
    sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nvarying vec3 vWp;").replace("#include <worldpos_vertex>", "#include <worldpos_vertex>\nvWp = (modelMatrix * vec4(transformed, 1.0)).xyz;");
    sh.fragmentShader = sh.fragmentShader.replace("#include <common>", "#include <common>\nvarying vec3 vWp; uniform float uLevel, uTime;\n" + NOISE)
      .replace("#include <map_fragment>", [
        "#include <map_fragment>",
        "float dh = vWp.y - uLevel; float sw = 0.05 * sin(uTime * 0.9 + vWp.x * 0.15) + 0.03 * fbm(vWp.xz * 0.3 + uTime * 0.2);",
        "float wet = 1.0 - smoothstep(0.0, 0.45, dh - sw);",
        "diffuseColor.rgb *= mix(1.0, 0.55, wet);",
        "float foam = (1.0 - smoothstep(0.0, 0.07, abs(dh - sw))) * (0.6 + 0.4 * fbm(vWp.xz * 1.5 + uTime));",
        "diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.92, 0.95, 1.0), foam * 0.85);"
      ].join("\n"))
      .replace("#include <roughnessmap_fragment>", "#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor, 0.35, wet);");
  };
  var beach = new THREE.Mesh(beachG, beachMat); sC.add(beach);
  function beachY(x, z) {   // 平缓坡:离镜头越近越高;两侧稍高形成小海湾
    var zz = z - 10, base = 0.075 * (zz + 2), bay = 0.0009 * x * x;
    return Math.min(3.2, base + bay) + 0.08 * Math.sin(x * 0.21) * Math.cos(z * 0.17);
  }
  // 海面
  var USea = { uLevel: { value: 0 }, uTime: { value: 0 }, uMoon: { value: new THREE.Vector3(0.2, 0.3, -1).normalize() }, uSkyT: { value: new THREE.Color(0x6f7fb8) }, uSkyH: { value: new THREE.Color(0xe7a07a) } };
  var sea = new THREE.Mesh(new THREE.PlaneGeometry(4000, 4000, 1, 1).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({
    uniforms: USea, transparent: true, fog: false,
    vertexShader: "uniform float uLevel; varying vec3 vW; void main(){ vec4 wp = modelMatrix * vec4(position.x, uLevel, position.z, 1.0); vW = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }",
    fragmentShader: [
      "uniform float uTime, uLevel; uniform vec3 uMoon; uniform vec3 uSkyT, uSkyH; varying vec3 vW;", NOISE,
      "vec2 grad(vec2 p){ float e = 0.08; return vec2(fbm(p + vec2(e, 0.0)) - fbm(p - vec2(e, 0.0)), fbm(p + vec2(0.0, e)) - fbm(p - vec2(0.0, e))) / (2.0 * e); }",
      "void main(){ vec3 V = normalize(cameraPosition - vW); float dist = length(cameraPosition - vW);",
      "  float sc = 1.0 / (1.0 + dist * 0.01);",
      "  vec2 g = grad(vW.xz * 0.35 + vec2(uTime * 0.25, uTime * 0.15)) * 0.9 + grad(vW.xz * 1.3 - vec2(uTime * 0.4, -uTime * 0.2)) * 0.35;",
      "  vec3 N = normalize(vec3(-g.x * 0.28 * sc, 1.0, -g.y * 0.28 * sc));",
      "  vec3 R = reflect(-V, N); float fr = 0.03 + 0.97 * pow(1.0 - max(0.0, dot(N, V)), 5.0);",
      "  vec3 sky = mix(uSkyH, uSkyT, smoothstep(0.0, 0.35, R.y));",
      "  vec3 deep = vec3(0.02, 0.07, 0.12), shallow = vec3(0.05, 0.22, 0.26);",
      "  float shore = smoothstep(26.0, 4.0, -vW.z + 0.0);",
      "  vec3 c = mix(mix(deep, shallow, shore * 0.7), sky, fr);",
      "  float sp = pow(max(0.0, dot(R, uMoon)), 260.0) * 3.5 + pow(max(0.0, dot(R, uMoon)), 30.0) * 0.25;",
      "  c += vec3(1.0, 0.97, 0.88) * sp;",
      "  float hz = smoothstep(600.0, 1800.0, dist); c = mix(c, uSkyH * 0.9, hz);",
      "  gl_FragColor = vec4(c, mix(0.86, 1.0, smoothstep(2.0, 20.0, dist))); }"
    ].join("\n")
  }));
  sea.renderOrder = 1; sC.add(sea);
  // 岩石
  var rockD = tex("tide/rock_d" + RES2 + ".jpg", true, false, 2), rockN = tex("tide/rock_n" + RES2 + ".jpg", false, false, 2);
  var rockMat = new THREE.MeshStandardMaterial({ map: rockD, normalMap: rockN, roughness: 0.92, color: 0x9a9088 });
  function rock(x, y, z, s, sq, seed) {
    var g = new THREE.IcosahedronGeometry(1, 4), p = g.attributes.position, sd = seed;
    function rnd() { sd = (sd * 16807) % 2147483647; return sd / 2147483647; }
    var ph = [rnd() * 9, rnd() * 9, rnd() * 9];
    for (var k = 0; k < p.count; k++) { v3.fromBufferAttribute(p, k); var n = 1 + 0.22 * Math.sin(v3.x * 2.3 + ph[0]) * Math.cos(v3.y * 1.9 + ph[1]) + 0.12 * Math.sin(v3.z * 4.1 + ph[2]) + 0.05 * Math.sin(v3.x * 9 + v3.z * 7); v3.multiplyScalar(n); p.setXYZ(k, v3.x, v3.y * sq, v3.z); }
    g.computeVertexNormals();
    var m = new THREE.Mesh(g, rockMat); m.position.set(x, y, z); m.scale.setScalar(s); m.rotation.y = rnd() * 6; sC.add(m); return m;
  }
  rock(-9, 0.2, 2, 2.4, 0.7, 11); rock(-12.5, 0.6, -3, 3.4, 0.8, 29); rock(-7, -0.4, -9, 1.6, 0.6, 7);
  rock(10, 0.4, 1, 2.2, 0.65, 41); rock(13, 0.9, -5, 3.0, 0.75, 53); rock(6.5, -0.6, -12, 1.2, 0.6, 61);
  // 远处岬角 + 灯塔
  rock(-30, 1, -95, 13, 0.5, 71); rock(-19, -0.5, -86, 7, 0.45, 83); rock(-44, 2, -112, 18, 0.55, 97);
  var lh = new THREE.Group(); lh.position.set(-29, 6.2, -96); lh.scale.setScalar(0.75); sC.add(lh);
  var bandTex = canvasTex(THREE, 64, 256, function (c, w, h) { for (var k = 0; k < 8; k++) { c.fillStyle = k % 2 ? "#e9e4dc" : "#b8322a"; c.fillRect(0, k * h / 8, w, h / 8); } });
  texs.push(bandTex);
  var tower = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.7, 12, 24), new THREE.MeshStandardMaterial({ map: bandTex, roughness: 0.6 })); tower.position.y = 6; lh.add(tower);
  var cab = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 1.6, 16), new THREE.MeshStandardMaterial({ color: 0x222222, emissive: 0xffd88a, emissiveIntensity: 1.2 })); cab.position.y = 12.8; lh.add(cab);
  var lamp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: 0xffe2a0, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); lamp.scale.setScalar(9); lamp.position.y = 12.8; lh.add(lamp);
  var beam = new THREE.Mesh(new THREE.ConeGeometry(2.5, 45, 24, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff0c0, transparent: true, opacity: 0.025, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
  beam.geometry.translate(0, -22.5, 0); beam.rotation.z = Math.PI / 2; var beamP = new THREE.Group(); beamP.position.y = 12.8; beamP.add(beam); lh.add(beamP);
  // 潮位标尺(-1 m … +3 m,示意刻度)
  var gaugeTex = canvasTex(THREE, 128, 1024, function (c, w, h) {
    c.fillStyle = "#f2efe6"; c.fillRect(0, 0, w, h);
    var u = h / 40;                                   // 每格 0.1 m;0.5 m 一段红白相间
    for (var k = 0; k < 40; k++) { var y = h - (k + 1) * u; c.fillStyle = Math.floor(k / 5) % 2 ? "#c0392b" : "#1b1b1b"; c.fillRect(0, y + 2, k % 2 ? w * 0.42 : w * 0.62, u - 4); }
    c.fillStyle = "#111"; c.font = "bold 64px system-ui, sans-serif"; c.textAlign = "right";
    for (var m = -1; m <= 2; m++) { var yy = h - (m + 1) * h / 4 - 8; c.fillText(String(m), w - 4, yy); }
    c.fillStyle = "#c0392b"; c.fillRect(0, h * 0.75 - 4, w, 8);
  });
  texs.push(gaugeTex);
  var gauge = new THREE.Mesh(new THREE.BoxGeometry(0.34, 4, 0.12), [0, 0, 0, 0, 0, 0].map(function (_, k) { return k === 4 ? new THREE.MeshStandardMaterial({ map: gaugeTex, roughness: 0.7 }) : new THREE.MeshStandardMaterial({ color: 0x8a8a8a, roughness: 0.6 }); }));
  gauge.position.set(2.6, 1.0, 1.5); sC.add(gauge);     // 0 刻度 = 平均海面(y = 0)
  var post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 4, 8), new THREE.MeshStandardMaterial({ color: 0x555555 })); post.position.set(2.6, -1.2, 1.45); sC.add(post);
  // 天上的月亮(按月相着色)
  var UMo = { map: { value: moonTex }, uPh: { value: Math.PI } };
  var skyMoon = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 32), new THREE.ShaderMaterial({
    uniforms: UMo, fog: false,
    vertexShader: "varying vec2 vUv; varying vec3 vNv; void main(){ vUv = uv; vNv = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: "uniform sampler2D map; uniform float uPh; varying vec2 vUv; varying vec3 vNv; void main(){ vec3 Lv = vec3(sin(uPh), 0.0, -cos(uPh)); float d = smoothstep(-0.06, 0.12, dot(vNv, Lv)); vec3 c = texture2D(map, vUv).rgb * 1.55; gl_FragColor = vec4(c * d + vec3(0.03, 0.035, 0.05), 1.0); }"
  }));
  var moonHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: 0xcfd8ff, transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
  sC.add(skyMoon); sC.add(moonHalo);

  /* =================== 视图 =================== */
  function size() {
    var r = canvas.getBoundingClientRect(), w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
    if (w !== state.W || h !== state.H || canvas.width === 300) { state.W = w; state.H = h; renderer.setSize(w, h, false); }
  }
  // 太空相机:z = 0 平面 1 单位 = R 像素,地球中心落在 (cx, cy)
  function aimSpace(S) {
    var Z = state.zone, Wd = state.W, Hd = state.H;
    var d = (Hd / 2) / (S.R * Math.tan(FOV * Math.PI / 360));
    camS.position.set(0, 0, d); camS.lookAt(0, 0, 0); camS.aspect = Wd / Hd; camS.near = Math.max(0.05, d * 0.05); camS.far = d + 12000;
    var px = Z.x + S.cx, py = Z.y + S.cy;
    camS.setViewOffset(Wd, Hd, Wd / 2 - px, Hd / 2 - py, Wd, Hd);
    camS.updateProjectionMatrix(); camS.updateMatrixWorld(); skyS.position.copy(camS.position);
  }
  function dirXZ(a) { return new THREE.Vector3(Math.cos(a), 0, -Math.sin(a)); }
  // 投影轨道面上的点(地球半径为单位)→ 安全区像素,给 2D 箭头用
  function proj(x, y, z) {
    sys.updateMatrixWorld(true);
    v3.set(x, y, z).applyMatrix4(sys.matrixWorld).project(camS);
    return [(v3.x + 1) / 2 * state.W - state.zone.x, (1 - v3.y) / 2 * state.H - state.zone.y];
  }
  function projA(a, r) { return proj(Math.cos(a) * r, 0, -Math.sin(a) * r); }

  function scissor(rc, full) {
    var Z = state.zone, x = Z.x + rc.x, y = state.H - (Z.y + rc.y + rc.h);
    if (full) renderer.setViewport(0, 0, state.W, state.H); else renderer.setViewport(x, y, rc.w, rc.h);
    renderer.setScissor(x, y, rc.w, rc.h); renderer.setScissorTest(true);
  }

  function render(L) {
    if (!state.ok) return;
    size();
    var t = (performance.now() - state.t0) / 1000, st = (L && L.st) || {}, s = st.tide3 || {}, RM = L && L.RM, cur = state.cur, k = RM ? 1 : 0.15;
    ["Am", "As", "lag", "level", "brk", "tilt"].forEach(function (n) { var v = s[n] == null ? (n === "Am" ? 0.2 : n === "tilt" ? 0.2 : 0) : s[n]; if (cur[n] == null) cur[n] = v; cur[n] += (v - cur[n]) * k; });
    renderer.setScissorTest(false); renderer.setViewport(0, 0, state.W, state.H); renderer.clear();
    var tt = RM ? 0 : t;
    if (s.space) {
      var S = s.space;
      aimSpace(S); sys.rotation.x = cur.tilt;
      var mA = s.moonAng || 0, sA = s.sunAng == null ? Math.PI : s.sunAng, D = s.moonD || 3.4;
      earth.rotation.y = (s.spin || 0);
      clouds.rotation.y = tt * 0.004;
      var tl = s.town == null ? 0 : s.town;   // 小镇在赤道上的经度(地球自身坐标)
      townDot.position.set(Math.cos(tl) * 1.0, 0.0, -Math.sin(tl) * 1.0); townMk.position.copy(townDot.position).multiplyScalar(1.04);
      townMk.material.opacity = 0.75 + 0.25 * Math.sin(tt * 3);
      var md = dirXZ(mA + cur.lag), sd = dirXZ(sA);
      UW.uM.value.copy(md); UW.uS.value.copy(sd); UW.uAm.value = cur.Am; UW.uAs.value = cur.As; UW.uTime.value = tt;
      water.visible = s.water !== false;
      sunL.position.copy(sd).multiplyScalar(50).applyMatrix4(sys.matrixWorld); sunL.target.position.set(0, 0, 0);
      UW.uSun.value.copy(sd).applyQuaternion(sys.quaternion);
      var mr = 0.2727 * (s.moonS || 1.6);
      moon.scale.setScalar(mr); moon.position.copy(dirXZ(mA)).multiplyScalar(D); moon.rotation.y = mA + Math.PI;
      var b = cur.brk; moon.visible = b < 0.08;
      frag.visible = b >= 0.02;
      if (frag.visible) {
        for (var i = 0; i < NF; i++) {
          var f = FR[i], spread = Math.pow(b, 1.4);
          var ang = mA + f.a * (0.05 + spread * Math.PI * 2), rr = D * (1 + f.r * (0.04 + 0.16 * spread)), yy = f.y * mr * (1 - spread * 0.8) * 0.8;
          if (spread < 0.05) { ang = mA + f.a * 0.25 * mr / D * 4; rr = D + f.r * mr * 1.6; }
          v3.set(Math.cos(ang) * rr, yy, -Math.sin(ang) * rr);
          e3.set(f.rx + tt * 0.3, f.ry, 0); q.setFromEuler(e3); s3.setScalar(mr * 0.12 * f.s * (1 - 0.55 * spread));
          mtx.compose(v3, q, s3); frag.setMatrixAt(i, mtx);
        }
        frag.instanceMatrix.needsUpdate = true;
      }
      scissor(S, true); renderer.render(sS, camS);
    }
    if (s.coast) {
      var C = s.coast;
      camC.aspect = C.w / Math.max(1, C.h);
      camC.fov = C.w / C.h < 1 ? 62 : 46; camC.updateProjectionMatrix();
      var lev = cur.level * 1.0;                                   // 归一水位 → 米(示意)
      USea.uLevel.value = lev; UB.uLevel.value = lev; USea.uTime.value = tt; UB.uTime.value = tt;
      var alt = (s.moonAlt == null ? 25 : s.moonAlt) * Math.PI / 180, az = (s.moonAz || 0) * Math.PI / 180;
      var mdir = new THREE.Vector3(Math.sin(az) * Math.cos(alt), Math.sin(alt), -Math.cos(az) * Math.cos(alt));
      USea.uMoon.value.copy(mdir);
      skyMoon.position.copy(camC.position).addScaledVector(mdir, 900); skyMoon.scale.setScalar(26); skyMoon.lookAt(camC.position);
      skyMoon.rotateY(Math.PI);    // 让贴图正面朝镜头
      UMo.uPh.value = s.phase == null ? Math.PI : s.phase;
      moonHalo.position.copy(skyMoon.position); var lit = 0.5 - 0.5 * Math.cos(UMo.uPh.value);
      moonHalo.scale.setScalar(150 + 140 * lit); moonHalo.material.opacity = 0.12 + 0.45 * lit;
      skyMoon.visible = moonHalo.visible = alt > -0.08;
      moonLight.position.copy(mdir).multiplyScalar(100); moonLight.intensity = 0.25 + 1.1 * lit * Math.max(0, Math.sin(alt) + 0.2);
      beamP.rotation.y = RM ? 0.6 : tt * 0.9;
      scissor(C); renderer.render(sC, camC);
    }
    renderer.setScissorTest(false);
  }

  function setZone(Z) { state.zone = Z; }
  function show(on) { canvas.style.visibility = on ? "visible" : "hidden"; }
  function view() { size(); return { d3: true }; }
  function dispose() {
    state.ok = false; disposed = true;
    [sS, sC].forEach(function (sc) { sc.traverse(function (o) { if (o.geometry) o.geometry.dispose(); var ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : []; ms.forEach(function (m) { if (m && m.dispose) m.dispose(); }); }); });
    texs.forEach(function (x) { x.dispose(); }); glow.dispose();
    renderer.dispose();
  }
  return { view: view, proj: proj, projA: projA, render: render, setZone: setZone, show: show, dispose: dispose, three: THREE };
}
