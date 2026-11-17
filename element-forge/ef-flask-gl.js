/* 元素工坊 Element Forge · 2.0 标志性体验「玻璃烧瓶 · 熔金炉」ef-flask-gl.js v1(§5.16 方案 A 最小可交版)
   锻炉星盘中央:一只写实圆底烧瓶罩住「尺度镜」浮物,悬在熔金炉火上;瓶后悬一块文字牌(当前尺度名 + 尺寸),
   透过瓶身被真折射弯折、按 R/G/B 分色;只有炉火进入选择性辉光。
   · 真透射:思路改写自 pmndrs/drei MeshTransmissionMaterial(MIT),代码复用自本站 04 life-source/recode/glass.js
     (先把「玻璃后面的场景」渲到降分辨率缓冲,再在玻璃表面按折射出射点投影取样;三折射率分通道 = 色散;噪声抖动 = 模糊)。
     参数基线参考 three.js 官方示例 webgl_materials_physical_transmission(MIT):ior 1.5、厚度、比尔衰减。
   · 选择性辉光:思路参考 three.js 官方示例 webgl_postprocessing_unreal_bloom_selective(MIT)——只把「发光层」单独渲染、
     模糊后叠加回画面;此处自写为 1/4 分辨率两级可分离高斯 + 加色合成,不引入 EffectComposer。
   · 档位:high = 缓冲 0.5× + 6 样本色散 + 辉光;mid = 缓冲 0.35× + 2 样本无色散 + 辉光;low 不加载(锻炉星盘本身不加载)。
     减少动态:炉火静止、浮动停止,仍显示真折射静帧。?flask=0 关闭本模块。WebGL1(?three=169)缓冲改用 8 位。
   与锻炉星盘共用渲染器与场景;页面隐藏 / 开场动画 / 切到其他场景时不做额外渲染。零外部请求。 */
const EF = window.EF;

export async function install(gl, scene, cam, ctx) {
  if (/[?&]flask=0/.test(location.search)) return null;
  const { THREE } = gl, { renderer } = gl, hi = EF.glTier === 'high';
  const { root, D, float } = ctx;
  const C = float.position.clone();           /* 烧瓶球心 = 尺度镜浮物中心 */
  const R = 0.46, NECK = 0.115;

  /* ---------- 真透射玻璃(改写自 04 glass.js) ---------- */
  const SAMPLES = hi ? 6 : 2;
  const glass = new THREE.ShaderMaterial({
    defines: { SAMPLES },
    uniforms: {
      uBuffer: { value: null }, uIor: { value: 1.5 }, uThick: { value: 0.32 }, uChroma: { value: hi ? 0.05 : 0.0 }, uBlur: { value: hi ? 0.035 : 0.0 },
      uTint: { value: new THREE.Color('#fbf6ee') }, uAtten: { value: new THREE.Color('#ffd9a8') }, uRim: { value: new THREE.Color('#ffd19a') }, uKey: { value: new THREE.Vector3(0.4, 0.9, 0.6).normalize() },
    },
    vertexShader: /* glsl */`
      varying vec3 vW; varying vec3 vN;
      void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: /* glsl */`
      uniform mat4 projectionMatrix;
      uniform sampler2D uBuffer; uniform float uIor, uThick, uChroma, uBlur; uniform vec3 uTint, uAtten, uRim, uKey;
      varying vec3 vW; varying vec3 vN;
      float hash(vec2 p){ p = fract(p*vec2(123.34,456.21)); p += dot(p,p+45.32); return fract(p.x*p.y); }
      vec2 proj(vec3 p){ vec4 c = projectionMatrix * viewMatrix * vec4(p,1.0); return clamp(c.xy/c.w*.5+.5, 0.001, 0.999); }
      void main(){
        vec3 n = normalize(vN); vec3 v = normalize(cameraPosition - vW);
        if (!gl_FrontFacing) n = -n;
        float nv = clamp(dot(n,v),0.0,1.0);
        float F = .04 + .96*pow(1.0-nv,5.0);
        vec3 tr = vec3(0.0);
        for (int i = 0; i < SAMPLES; i++){
          float fi = float(i);
          vec2 j = (vec2(hash(gl_FragCoord.xy+fi), hash(gl_FragCoord.yx*1.3+fi*7.1))-.5) * uBlur;
          vec3 nn = normalize(n + vec3(j,0.0));
          vec3 rr = refract(-v, nn, 1.0/(uIor*(1.0-uChroma)));
          vec3 rg = refract(-v, nn, 1.0/uIor);
          vec3 rb = refract(-v, nn, 1.0/(uIor*(1.0+uChroma)));
          tr.r += texture2D(uBuffer, proj(vW + rr*uThick)).r;
          tr.g += texture2D(uBuffer, proj(vW + rg*uThick)).g;
          tr.b += texture2D(uBuffer, proj(vW + rb*uThick)).b;
        }
        tr /= float(SAMPLES);
        float path = uThick / max(nv,.2);
        tr *= mix(vec3(1.0), uAtten, clamp(path*.35,0.0,1.0)) * uTint;
        vec3 h = normalize(uKey + v); float spec = pow(max(dot(n,h),0.0), 220.0) * 2.4;
        vec3 col = tr*(1.0-F*.6) + uRim*F*.55 + vec3(spec);
        gl_FragColor = vec4(col,1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });

  /* ---------- 圆底烧瓶(车削体:球泡 + 瓶颈 + 翻边) ---------- */
  const prof = [];
  const aTop = Math.acos(NECK / R);
  for (let i = 0; i <= 40; i++) { const a = -Math.PI / 2 + (Math.PI / 2 + aTop) * i / 40; prof.push(new THREE.Vector2(Math.max(0.001, Math.cos(a) * R), Math.sin(a) * R)); }
  const yN = Math.sin(aTop) * R;
  prof.push(new THREE.Vector2(NECK, yN + 0.12), new THREE.Vector2(NECK, yN + 0.5), new THREE.Vector2(NECK + 0.03, yN + 0.53), new THREE.Vector2(NECK + 0.03, yN + 0.56), new THREE.Vector2(NECK - 0.012, yN + 0.56));
  const flask = new THREE.Mesh(new THREE.LatheGeometry(prof, hi ? 96 : 64), glass);
  flask.position.copy(C); flask.renderOrder = 1; root.add(flask);

  /* 瓶底熔金液(在缓冲里,只透过玻璃看见) */
  const liq = [];
  for (let i = 0; i <= 14; i++) { const a = -Math.PI / 2 + 0.62 * i / 14; liq.push(new THREE.Vector2(Math.max(0.001, Math.cos(a) * R * 0.93), Math.sin(a) * R * 0.93)); }
  liq.push(new THREE.Vector2(0.001, liq[liq.length - 1].y));
  const liqM = new THREE.MeshStandardMaterial({ color: '#ff9a3c', emissive: '#ff7a1a', emissiveIntensity: 0.9, roughness: 0.25, metalness: 0.1 });
  const liquid = new THREE.Mesh(new THREE.LatheGeometry(liq, 64), liqM); liquid.position.copy(C); root.add(liquid);

  /* ---------- 文字牌(瓶后,出镜被折射) ---------- */
  const pc = document.createElement('canvas'); pc.width = 1024; pc.height = 320;
  const ptx = new THREE.CanvasTexture(pc); ptx.colorSpace = THREE.SRGBColorSpace; ptx.anisotropy = 4;
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.53), new THREE.MeshBasicMaterial({ map: ptx, transparent: true, depthWrite: false, toneMapped: false }));
  plate.position.set(C.x, C.y + 0.02, C.z - 0.95); root.add(plate);
  let lastTxt = '';
  function drawPlate() {
    const a = (document.getElementById('scName') || {}).textContent || '', b = (document.getElementById('scSize') || {}).textContent || '';
    const t = a + '|' + b; if (t === lastTxt) return; lastTxt = t;
    const x = pc.getContext('2d'); x.clearRect(0, 0, 1024, 320);
    const g = x.createLinearGradient(0, 0, 1024, 0); g.addColorStop(0, 'rgba(255,154,60,0)'); g.addColorStop(0.5, 'rgba(255,154,60,.55)'); g.addColorStop(1, 'rgba(255,154,60,0)');
    x.fillStyle = g; x.fillRect(80, 252, 864, 3); x.fillRect(80, 64, 864, 2);
    x.textAlign = 'center'; x.fillStyle = '#ffd7a8'; x.font = '600 128px "Noto Sans SC","PingFang SC","Microsoft YaHei",sans-serif'; x.fillText(a, 512, 196);
    x.fillStyle = 'rgba(255,230,200,.8)'; x.font = '400 38px "Noto Sans SC","PingFang SC","Microsoft YaHei",sans-serif'; x.fillText(b.slice(0, 30), 512, 300);
    ptx.needsUpdate = true;
  }
  drawPlate();

  /* ---------- 熔金炉火(唯一进入辉光层的东西) ---------- */
  const yB = C.y - R;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.018, 12, 64), new THREE.MeshStandardMaterial({ color: '#b98a4a', metalness: 1, roughness: 0.3 }));
  ring.rotation.x = Math.PI / 2; ring.position.set(C.x, yB + 0.05, C.z); root.add(ring);
  const fireM = new THREE.ShaderMaterial({
    uniforms: { uT: { value: 0 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false,
    vertexShader: `varying vec2 vU; void main(){ vU = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `uniform float uT; varying vec2 vU;
      float h(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
      float n2(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y); }
      void main(){
        float y = vU.y, x = abs(vU.x-.5)*2.0;
        float w = (1.0-y)*(0.85+0.15*n2(vec2(vU.x*6.0, y*4.0-uT*3.0)));
        float a = smoothstep(w, w-0.35, x) * smoothstep(1.0, 0.55, y) * smoothstep(0.0, 0.08, y);
        vec3 c = mix(vec3(1.0,0.42,0.08), vec3(1.0,0.86,0.55), smoothstep(0.6,0.0,x)*(1.0-y));
        gl_FragColor = vec4(c*a*1.6, a);
      }`,
  });
  const fireG = new THREE.PlaneGeometry(0.34, 0.42);
  const fires = [0, Math.PI / 2].map(r => { const m = new THREE.Mesh(fireG, fireM); m.rotation.y = r; m.position.set(C.x, yB - 0.12, C.z); root.add(m); return m; });
  const lamp = new THREE.PointLight(0xff8a2a, 2.2, 2.4, 2); lamp.position.set(C.x, yB - 0.02, C.z); root.add(lamp);

  /* ---------- 渲染缓冲 ---------- */
  const typ = EF.gl2 !== false && EF.three !== '169' ? THREE.HalfFloatType : THREE.UnsignedByteType;
  const mk = () => new THREE.WebGLRenderTarget(4, 4, { type: typ, depthBuffer: true });
  const rtBuf = mk(), rtG = mk(), rtA = mk(), rtB = mk();
  rtG.depthBuffer = true; rtA.depthBuffer = false; rtB.depthBuffer = false;
  glass.uniforms.uBuffer.value = rtBuf.texture;
  const vs2 = `varying vec2 vU; void main(){ vU = uv; gl_Position = vec4(position.xy,0.0,1.0); }`;
  const blurM = new THREE.ShaderMaterial({ uniforms: { uTex: { value: null }, uDir: { value: new THREE.Vector2() } }, vertexShader: vs2, depthTest: false, depthWrite: false,
    fragmentShader: `uniform sampler2D uTex; uniform vec2 uDir; varying vec2 vU;
      void main(){ vec3 c = texture2D(uTex,vU).rgb*0.227;
        c += (texture2D(uTex,vU+uDir*1.385).rgb + texture2D(uTex,vU-uDir*1.385).rgb)*0.316;
        c += (texture2D(uTex,vU+uDir*3.231).rgb + texture2D(uTex,vU-uDir*3.231).rgb)*0.070;
        gl_FragColor = vec4(c,1.0); }` });
  const addM = new THREE.ShaderMaterial({ uniforms: { uTex: { value: rtB.texture }, uK: { value: hi ? 1.25 : 1.0 } }, vertexShader: vs2, transparent: true, blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false, toneMapped: false,
    fragmentShader: `uniform sampler2D uTex; uniform float uK; varying vec2 vU; void main(){ vec3 c = texture2D(uTex,vU).rgb*uK; gl_FragColor = vec4(c,1.0); }` });
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), blurM); quad.frustumCulled = false;
  const qScene = new THREE.Scene(); qScene.add(quad); const qCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  /* 辉光层:炉火的替身(同几何同材质),每帧抄世界矩阵 */
  const gScene = new THREE.Scene(); gScene.background = new THREE.Color(0);
  const ghosts = fires.map(f => { const m = new THREE.Mesh(fireG, fireM); m.matrixAutoUpdate = false; gScene.add(m); return m; });
  /* 遮挡:辉光层里放一只纯黑烧瓶,让瓶身挡住的炉火不过曝 */
  const occ = new THREE.Mesh(flask.geometry, new THREE.MeshBasicMaterial({ color: 0 })); occ.matrixAutoUpdate = false; gScene.add(occ);

  const sz = new THREE.Vector2();
  let W = 0, H = 0;
  function sizeRT() {
    renderer.getDrawingBufferSize(sz); if (sz.x === W && sz.y === H) return; W = sz.x; H = sz.y;
    const k = hi ? 0.5 : 0.35; rtBuf.setSize(Math.max(2, W * k | 0), Math.max(2, H * k | 0));
    const q = Math.max(2, W / 4 | 0), r = Math.max(2, H / 4 | 0); rtG.setSize(q, r); rtA.setSize(q, r); rtB.setSize(q, r);
  }
  const active = () => gl.scene === scene && !document.body.classList.contains('pre') && !document.hidden;
  const rm = () => EF.reduced;

  let tTxt = 0;
  gl.onFrame((t, dt) => {
    if (!active()) return;
    sizeRT();
    if (t - tTxt > 0.4) { tTxt = t; drawPlate(); }
    fireM.uniforms.uT.value = rm() ? 0.6 : t;
    const s = rm() ? 1 : 1 + Math.sin(t * 13) * 0.04 + Math.sin(t * 7.3) * 0.03; fires.forEach(f => f.scale.set(s, s, 1)); lamp.intensity = rm() ? 2.2 : 2.0 + Math.sin(t * 11) * 0.3;
    flask.position.y = liquid.position.y = float.position.y;   /* 跟着浮物一起轻浮 */
    plate.quaternion.copy(cam.quaternion);
    /* 缓冲:藏起烧瓶,把「玻璃后面」渲一遍 */
    flask.visible = false;
    const prev = renderer.getRenderTarget();
    renderer.setRenderTarget(rtBuf); renderer.render(scene, cam);
    renderer.setRenderTarget(prev); flask.visible = true;
  });

  const cc = new THREE.Color();
  gl.post.unshift(() => {        /* 放在星盘叠加层之前:辉光只叠在 3D 场景上 */
    if (!active()) return;
    root.updateMatrixWorld();
    fires.forEach((f, i) => ghosts[i].matrixWorld.copy(f.matrixWorld)); occ.matrixWorld.copy(flask.matrixWorld);
    const prev = renderer.getRenderTarget(), ac = renderer.autoClear, tm = renderer.toneMapping;
    renderer.getClearColor(cc); const ca = renderer.getClearAlpha();
    renderer.setClearColor(0, 1); renderer.autoClear = true; renderer.toneMapping = THREE.NoToneMapping;
    renderer.setRenderTarget(rtG); renderer.render(gScene, cam);
    quad.material = blurM;
    const pass = (src, dst, dx, dy) => { blurM.uniforms.uTex.value = src.texture; blurM.uniforms.uDir.value.set(dx / src.width, dy / src.height); renderer.setRenderTarget(dst); renderer.render(qScene, qCam); };
    pass(rtG, rtA, 1, 0); pass(rtA, rtB, 0, 1); pass(rtB, rtA, 2.2, 0); pass(rtA, rtB, 0, 2.2);
    renderer.setRenderTarget(prev); renderer.autoClear = false;
    quad.material = addM; renderer.render(qScene, qCam);
    renderer.autoClear = ac; renderer.toneMapping = tm; renderer.setClearColor(cc, ca);
  });

  EF.flask = { flask, plate, fires, version: 1 };
  return EF.flask;
}
