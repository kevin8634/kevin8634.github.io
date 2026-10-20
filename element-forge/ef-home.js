/* 元素工坊 Element Forge · 首页 3D v0.2
   熔炉开场动画 + 尺度镜七档 3D 舞台 + 元素起源周期表 3D 台面。状态由页面内 EF.stage 管理;无 WebGL 时不会加载到这里。 */
import { THREE, makeGL, P, glowSprite, NOISE, VS_SURF, starMaterial, fresnelMaterial, tier } from './ef-gl.js?v=2';
const EF = window.EF, ST = EF.stage;
if (ST.mode !== '2d') EF.glReady = 'loading';   /* 模块已到达:取消平面版兜底计时 */
const rnd = (s => () => (s = (s * 16807) % 2147483647) / 2147483647)(20261020);
const ease = x => x < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x);
const lerp = (a, b, t) => a + (b - a) * t;

try { bootStage(); } catch (e) { console.warn('[ef] 3D 舞台启动失败,回落平面版', e); EF.glReady = false; ST.mode = ''; document.getElementById('stageHost').innerHTML = ''; EF.start2D(); }
try { bootTable(); } catch (e) { console.warn('[ef] 3D 周期表启动失败,保留平面表', e); document.body.classList.remove('gl3d'); }

/* ======================================================================
   尺度镜舞台
   ====================================================================== */
function bootStage() {
  if (ST.mode === '2d') return;
  const host = document.getElementById('stageHost');
  const gl = makeGL(host, { fov: 45, onlost: () => location.reload() });
  EF.glReady = true; ST.mode = 'gl';
  const { renderer } = gl, stageScene = gl.scene, cam = gl.camera;
  cam.position.set(0, 0, 6);
  stageScene.add(new THREE.AmbientLight(0x8a7a90, 1.1));
  const key = new THREE.DirectionalLight(0xfff0dd, 2.6); key.position.set(3, 2.5, 4); stageScene.add(key);
  const rim = new THREE.PointLight(0xff9a3c, 30, 30); rim.position.set(-3.5, -1.5, 2.5); stageScene.add(rim);

  /* 背景星空 */
  const stars = (() => {
    const n = P.stars, pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { const u = rnd() * 2 - 1, a = rnd() * 6.283, r = 40 + rnd() * 50, s = Math.sqrt(1 - u * u); pos.set([Math.cos(a) * s * r, u * r, Math.sin(a) * s * r - 20], i * 3); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const m = new THREE.PointsMaterial({ color: 0xfff1dc, size: 0.16, sizeAttenuation: true, transparent: true, opacity: 0.85, depthWrite: false });
    const p = new THREE.Points(g, m); stageScene.add(p); return p;
  })();

  /* 每一档是一个场景:g=组,mats=[材质,基础不透明度],upd=每帧 */
  function SC() { return { g: new THREE.Group(), mats: [], upd: null, spin: 0.12, yaw: 0 }; }
  function reg(sc, m, base = 1) { m.transparent = true; sc.mats.push([m, base]); return m; }
  function setA(sc, a) {
    sc.g.visible = a > 0.004;
    for (const [m, b] of sc.mats) { if (m.uniforms && m.uniforms.uA) m.uniforms.uA.value = a * b; else m.opacity = a * b; }
  }
  const scenes = [];

  /* 0 恒星 */
  (() => {
    const s = SC(), sm = reg(s, starMaterial());
    s.g.add(new THREE.Mesh(new THREE.SphereGeometry(1.35, 96, 64), sm));
    const glow = glowSprite([[0, 'rgba(255,200,120,.9)'], [0.22, 'rgba(255,140,50,.55)'], [0.5, 'rgba(255,80,20,.15)'], [1, 'rgba(255,60,10,0)']], 5.6);
    const cor = glowSprite([[0, 'rgba(255,170,90,.35)'], [0.4, 'rgba(255,110,40,.08)'], [1, 'rgba(0,0,0,0)']], 10);
    reg(s, glow.material, 1); reg(s, cor.material, 0.8); s.g.add(cor, glow);
    s.upd = t => { sm.uniforms.uT.value = t; cor.material.rotation = t * 0.02; };
    s.spin = 0.05; scenes.push(s);
  })();

  /* 1 行星(火星:程序生成地貌 + 极冠 + 稀薄大气) */
  (() => {
    const s = SC();
    const pm = reg(s, new THREE.ShaderMaterial({
      uniforms: { uA: { value: 1 } }, vertexShader: VS_SURF,
      fragmentShader: NOISE + `uniform float uA; varying vec3 vP; varying vec3 vN; varying vec3 vV;
      void main(){ vec3 p=normalize(vP); float n=fbm(p*2.4); float d=fbm(p*9.0+3.1);
        vec3 c=mix(vec3(0.42,0.14,0.06),vec3(0.80,0.40,0.19),smoothstep(0.3,0.7,n));
        c=mix(c,vec3(0.28,0.10,0.05),smoothstep(0.62,0.75,fbm(p*3.3+7.0))*0.7); c*=0.85+0.3*d;
        float cap=smoothstep(0.86,0.93,abs(p.y)+(n-0.5)*0.08); c=mix(c,vec3(0.95,0.93,0.9),cap);
        vec3 L=normalize(vec3(0.7,0.35,0.6)); float dif=max(dot(normalize(vN),L),0.0);
        gl_FragColor=vec4(c*(0.07+1.05*dif),uA); }`
    }));
    s.g.add(new THREE.Mesh(new THREE.SphereGeometry(1.2, 96, 64), pm));
    const atm = reg(s, fresnelMaterial(0xff9a70, 3.2, 0.0, THREE.BackSide), 0.9);
    const a = new THREE.Mesh(new THREE.SphereGeometry(1.28, 64, 48), atm); s.g.add(a);
    const atm2 = reg(s, fresnelMaterial(0xffb08a, 4, 0.0), 0.6); s.g.add(new THREE.Mesh(new THREE.SphereGeometry(1.205, 64, 48), atm2));
    s.g.rotation.z = 0.44; s.spin = 0.08; scenes.push(s);
  })();

  /* 2 烧杯(紫甘蓝汁在不同酸碱度下变色:红→紫→蓝→绿) */
  (() => {
    const s = SC();
    const prof = [[0.001, -1.0], [0.74, -1.0], [0.8, -0.95], [0.8, 0.95], [0.88, 1.04]].map(p => new THREE.Vector2(p[0], p[1]));
    const glass = reg(s, fresnelMaterial(0xdff0ff, 2.2, 0.04, THREE.DoubleSide), 1);
    s.g.add(new THREE.Mesh(new THREE.LatheGeometry(prof, 72), glass));
    const liqM = reg(s, new THREE.MeshStandardMaterial({ color: 0x7b2cbf, roughness: 0.15, metalness: 0, emissive: 0x2a0a40, emissiveIntensity: 0.6 }), 0.82);
    const liq = new THREE.Mesh(new THREE.CylinderGeometry(0.77, 0.74, 1.15, 72), liqM); liq.position.y = -0.42; s.g.add(liq);
    const n = P.bubbles, bp = new Float32Array(n * 3), bs = [];
    for (let i = 0; i < n; i++) { const a = rnd() * 6.283, r = Math.sqrt(rnd()) * 0.66; bs.push({ x: Math.cos(a) * r, z: Math.sin(a) * r, y: -0.98 + rnd() * 1.1, v: 0.15 + rnd() * 0.35 }); }
    const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.BufferAttribute(bp, 3));
    const bm = reg(s, new THREE.PointsMaterial({ color: 0xffffff, size: 0.05, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }), 0.8);
    s.g.add(new THREE.Points(bg, bm));
    const PH = [0xd7263d, 0x9d2bb5, 0x6a3fd8, 0x2f7de1, 0x1fa38a, 0x5cbf3a].map(c => new THREE.Color(c)), tmp = new THREE.Color();
    s.upd = (t, dt) => {
      const u = (t / 3) % PH.length, i = Math.floor(u), f = ease(u - i);
      tmp.copy(PH[i]).lerp(PH[(i + 1) % PH.length], f); liqM.color.copy(tmp); liqM.emissive.copy(tmp).multiplyScalar(0.35);
      bs.forEach((b, k) => { b.y += b.v * dt; if (b.y > 0.14) b.y = -0.98; bp[k * 3] = b.x + Math.sin(t * 3 + k) * 0.01; bp[k * 3 + 1] = b.y; bp[k * 3 + 2] = b.z; });
      bg.attributes.position.needsUpdate = true;
    };
    s.g.rotation.x = 0.28; s.spin = 0.15; scenes.push(s);
  })();

  /* 3 晶体(金刚石结构,真实的四面体配位,2×2×2 个晶胞) */
  (() => {
    const s = SC(), at = [], A = 0.88, basis = [[0, 0, 0], [0, .5, .5], [.5, 0, .5], [.5, .5, 0]];
    for (let i = 0; i <= 2; i++) for (let j = 0; j <= 2; j++) for (let k = 0; k <= 2; k++) for (const b of basis) at.push([i + b[0], j + b[1], k + b[2]]);
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) for (let k = 0; k < 2; k++) for (const b of basis) at.push([i + b[0] + 0.25, j + b[1] + 0.25, k + b[2] + 0.25]);
    const key = p => p.map(v => v.toFixed(3)).join(','), seen = new Set(), atoms = [];
    for (const p of at) if (p.every(v => v <= 2.001) && !seen.has(key(p))) { seen.add(key(p)); atoms.push(new THREE.Vector3(p[0] - 1, p[1] - 1, p[2] - 1).multiplyScalar(A)); }
    const am = reg(s, new THREE.MeshStandardMaterial({ color: 0xffe9c8, roughness: 0.3, metalness: 0.25, emissive: 0x3a2008, emissiveIntensity: 0.8 }));
    const im = new THREE.InstancedMesh(new THREE.SphereGeometry(0.085, 20, 14), am, atoms.length), M4 = new THREE.Matrix4();
    atoms.forEach((p, i) => { M4.makeTranslation(p.x, p.y, p.z); im.setMatrixAt(i, M4); }); s.g.add(im);
    const bonds = [], L = Math.sqrt(3) / 4 * A;
    for (let i = 0; i < atoms.length; i++) for (let j = i + 1; j < atoms.length; j++) if (Math.abs(atoms[i].distanceTo(atoms[j]) - L) < 0.02) bonds.push([atoms[i], atoms[j]]);
    const bm = reg(s, new THREE.MeshStandardMaterial({ color: 0xffb35c, roughness: 0.4, metalness: 0.3, emissive: 0x5a2a08, emissiveIntensity: 0.9 }));
    const cyl = new THREE.CylinderGeometry(0.026, 0.026, 1, 8), bi = new THREE.InstancedMesh(cyl, bm, bonds.length), up = new THREE.Vector3(0, 1, 0), q = new THREE.Quaternion();
    bonds.forEach(([a, b], i) => { const d = new THREE.Vector3().subVectors(b, a), mid = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5); q.setFromUnitVectors(up, d.clone().normalize()); M4.compose(mid, q, new THREE.Vector3(1, d.length(), 1)); bi.setMatrixAt(i, M4); });
    s.g.add(bi); s.g.rotation.set(0.5, 0.6, 0); s.spin = 0.18; scenes.push(s);
  })();

  /* 4 分子(甲烷 CH₄:四面体,键角 109.5°) */
  (() => {
    const s = SC();
    const cm = reg(s, new THREE.MeshStandardMaterial({ color: 0x5b6170, roughness: 0.35, metalness: 0.1 }));
    const hm = reg(s, new THREE.MeshStandardMaterial({ color: 0xf2f4f8, roughness: 0.3 }));
    const km = reg(s, new THREE.MeshStandardMaterial({ color: 0xd9c7a8, roughness: 0.4, emissive: 0x2a1a08 }));
    s.g.add(new THREE.Mesh(new THREE.SphereGeometry(0.46, 40, 28), cm));
    const up = new THREE.Vector3(0, 1, 0), BL = 1.35;
    [[1, 1, 1], [-1, -1, 1], [-1, 1, -1], [1, -1, -1]].forEach(v => {
      const d = new THREE.Vector3(...v).normalize(), h = new THREE.Mesh(new THREE.SphereGeometry(0.28, 32, 22), hm); h.position.copy(d).multiplyScalar(BL); s.g.add(h);
      const b = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, BL, 16), km); b.position.copy(d).multiplyScalar(BL / 2); b.quaternion.setFromUnitVectors(up, d); s.g.add(b);
    });
    s.spin = 0.3; s.g.rotation.x = 0.4; scenes.push(s);
  })();

  /* 5 原子(碳:电子概率云,1s 紧贴原子核,2p 呈哑铃形) */
  (() => {
    const s = SC(), n = P.cloud, pos = new Float32Array(n * 3), ph = new Float32Array(n);
    const gamma = k => { let v = 0; for (let i = 0; i < k; i++) v -= Math.log(1 - rnd()); return v; };
    for (let i = 0; i < n; i++) {
      let p;
      if (i < n * 0.25) { const r = gamma(3) * 0.12, u = rnd() * 2 - 1, a = rnd() * 6.283, q = Math.sqrt(1 - u * u); p = [Math.cos(a) * q * r, u * r, Math.sin(a) * q * r]; }
      else { const ax = i % 3; let d; do { d = [rnd() * 2 - 1, rnd() * 2 - 1, rnd() * 2 - 1]; } while (Math.hypot(...d) > 1 || rnd() > (d[ax] * d[ax]) / (d[0] * d[0] + d[1] * d[1] + d[2] * d[2] + 1e-6)); const l = Math.hypot(...d), r = gamma(5) * 0.24; p = d.map(v => v / l * r); }
      pos.set(p, i * 3); ph[i] = rnd() * 6.283;
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('ph', new THREE.BufferAttribute(ph, 1));
    const m = reg(s, new THREE.ShaderMaterial({
      uniforms: { uT: { value: 0 }, uA: { value: 1 }, uS: { value: EF.dpr() * 6.0 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: `attribute float ph; uniform float uT,uS; varying float vA;
        void main(){ vec4 mv=modelViewMatrix*vec4(position,1.0); vA=0.45+0.55*sin(uT*2.2+ph); gl_PointSize=uS*(6.0/-mv.z); gl_Position=projectionMatrix*mv; }`,
      fragmentShader: `uniform float uA; varying float vA; void main(){ vec2 c=gl_PointCoord-0.5; float d=length(c); if(d>0.5) discard; float a=smoothstep(0.5,0.0,d)*vA*uA*0.8; gl_FragColor=vec4(vec3(1.0,0.82,0.55)*a,a); }`
    }));
    s.g.add(new THREE.Points(g, m));
    const nuc = glowSprite([[0, 'rgba(255,240,200,1)'], [0.3, 'rgba(255,120,60,.6)'], [1, 'rgba(255,80,20,0)']], 0.35); reg(s, nuc.material); s.g.add(nuc);
    s.upd = t => { m.uniforms.uT.value = t; }; s.spin = 0.1; scenes.push(s);
  })();

  /* 6 原子核(铁-56:26 质子 + 30 中子,按紧密堆积排列) */
  (() => {
    const s = SC(), pts = [], d = 0.36;
    for (let i = -4; i <= 4; i++) for (let j = -4; j <= 4; j++) for (let k = -4; k <= 4; k++) if ((i + j + k) % 2 === 0) pts.push(new THREE.Vector3(i, j, k).multiplyScalar(d / Math.SQRT2).add(new THREE.Vector3(0.011, 0.007, 0.003)));
    pts.sort((a, b) => a.length() - b.length()); const nuc = pts.slice(0, 56).map(p => p.sub(new THREE.Vector3(0.011, 0.007, 0.003)));
    const roles = Array(56).fill(0).map((_, i) => i < 26 ? 1 : 0); for (let i = 55; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [roles[i], roles[j]] = [roles[j], roles[i]]; }
    const m = reg(s, new THREE.MeshStandardMaterial({ roughness: 0.35, metalness: 0.15 }));
    const im = new THREE.InstancedMesh(new THREE.SphereGeometry(d * 0.52, 24, 16), m, 56), M4 = new THREE.Matrix4(), cP = new THREE.Color(0xff6a3d), cN = new THREE.Color(0x9aa6b8);
    nuc.forEach((p, i) => { im.setColorAt(i, roles[i] ? cP : cN); }); s.g.add(im);
    const gl2 = glowSprite([[0, 'rgba(255,150,80,.55)'], [0.5, 'rgba(255,90,30,.12)'], [1, 'rgba(0,0,0,0)']], 4.2); reg(s, gl2.material, 0.8); s.g.add(gl2);
    s.upd = t => { nuc.forEach((p, i) => { const j = EF.reduced ? 0 : 0.012; M4.makeTranslation(p.x + Math.sin(t * 7 + i) * j, p.y + Math.sin(t * 6.3 + i * 2.1) * j, p.z + Math.sin(t * 5.7 + i * 3.7) * j); im.setMatrixAt(i, M4); }); im.instanceMatrix.needsUpdate = true; };
    s.spin = 0.16; scenes.push(s);
  })();

  scenes.forEach(s => stageScene.add(s.g));

  /* 拖动旋转当前档 */
  let drag = null, yawV = 0, mx = 0, my = 0;
  const cv = renderer.domElement;
  cv.addEventListener('pointerdown', e => { if (e.pointerType === 'touch') return; drag = { x: e.clientX }; cv.setPointerCapture(e.pointerId); });
  cv.addEventListener('pointermove', e => { const r = cv.getBoundingClientRect(); mx = (e.clientX - r.left) / r.width - 0.5; my = (e.clientY - r.top) / r.height - 0.5; if (drag) { yawV = (e.clientX - drag.x) * 0.01; drag.x = e.clientX; } });
  cv.addEventListener('pointerup', () => { drag = null; });

  let camZ = 6;
  gl.onFrame((t, dt) => {
    if (gl.scene !== stageScene) return;
    ST.val += (ST.target - ST.val) * (EF.reduced ? 1 : 1 - Math.exp(-dt * 4.5)); if (Math.abs(ST.target - ST.val) < 0.001) ST.val = ST.target;
    const i = Math.min(5, Math.floor(ST.val)), f = ST.val - i;
    const cur = ST.val >= 6 ? 6 : i;
    scenes.forEach((s, k) => {
      let a = 0, sc = 1;
      if (ST.val >= 6) { a = k === 6 ? 1 : 0; }
      else if (k === i) { a = 1 - ease(f * 1.25); sc = 1 + f * f * 5; }
      else if (k === i + 1) { a = ease((f - 0.15) * 1.3); sc = 0.18 + 0.82 * ease(f); }
      setA(s, a); s.g.scale.setScalar(sc);
      if (s.g.visible) { if (s.upd) s.upd(t, dt); s.yaw += (EF.reduced ? 0 : s.spin * dt) + (k === Math.round(ST.val) ? yawV : 0); s.g.rotation.y = s.yaw; }
    });
    yawV *= 0.9;
    stars.material.opacity = 0.85 - 0.5 * ease(ST.val - 1); stars.rotation.y = t * 0.004;
    cam.position.x = lerp(cam.position.x, mx * 0.5, 0.05); cam.position.y = lerp(cam.position.y, -my * 0.35, 0.05);
    camZ = lerp(camZ, 6 * Math.pow(Math.max(1, 1.0 / cam.aspect), 0.85), 0.1); cam.position.z = camZ + (gl._pull || 0);
    cam.lookAt(0, 0, 0);
  });

  /* ================= 熔炉开场(约 7 秒) ================= */
  const iScene = new THREE.Scene(), iCam = new THREE.PerspectiveCamera(50, 1, 0.01, 300);
  const resizeI = () => { iCam.aspect = cam.aspect; iCam.updateProjectionMatrix(); }; gl.onresize = resizeI; resizeI();
  iScene.add(stars.clone());
  /* 星尘盘 */
  const N = P.dust, r0 = new Float32Array(N), a0 = new Float32Array(N), y0 = new Float32Array(N), hue = new Float32Array(N), dp = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) { r0[i] = 1.2 + Math.pow(rnd(), 0.7) * 9; a0[i] = rnd() * 6.283 + r0[i] * 0.6; y0[i] = (rnd() - 0.5) * 0.9 * (r0[i] / 6); hue[i] = rnd(); }
  const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.BufferAttribute(dp, 3));
  ['r0', 'a0', 'y0', 'hue'].forEach((k, j) => dg.setAttribute(k, new THREE.BufferAttribute([r0, a0, y0, hue][j], 1)));
  const dm = new THREE.ShaderMaterial({
    uniforms: { uT: { value: 0 }, uA: { value: 1 }, uS: { value: EF.dpr() * 3 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `attribute float r0,a0,y0,hue; uniform float uT,uS; varying vec3 vC;
      void main(){ float k=smoothstep(0.0,2.0,uT); float r=r0*mix(1.0,0.015,k);
        float a=a0+uT*(0.35+1.6/(r+0.6)); vec3 p=vec3(cos(a)*r, y0*(r/r0)*3.0, sin(a)*r);
        vec4 mv=modelViewMatrix*vec4(p,1.0); gl_PointSize=uS*(1.0+k*1.5)*(5.0/-mv.z);
        vC=mix(vec3(0.55,0.65,1.0),vec3(1.0,0.62,0.25),hue)*(0.5+k*1.6); gl_Position=projectionMatrix*mv; }`,
    fragmentShader: `uniform float uA; varying vec3 vC; void main(){ float d=length(gl_PointCoord-0.5); if(d>0.5) discard; float a=smoothstep(0.5,0.0,d)*uA; gl_FragColor=vec4(vC*a,a); }`
  });
  const dust = new THREE.Points(dg, dm); dust.rotation.x = 0.5; iScene.add(dust);
  const iStarM = starMaterial(), iStar = new THREE.Mesh(new THREE.SphereGeometry(1.35, 96, 64), iStarM); iScene.add(iStar);
  const iGlow = glowSprite([[0, 'rgba(255,210,140,1)'], [0.25, 'rgba(255,140,50,.5)'], [1, 'rgba(255,60,10,0)']], 6); iScene.add(iGlow);
  const flash = glowSprite([[0, 'rgba(255,255,240,1)'], [0.2, 'rgba(255,220,150,.8)'], [0.6, 'rgba(255,140,40,.2)'], [1, 'rgba(0,0,0,0)']], 1); iScene.add(flash);
  /* 恒星洋葱层:氢、氦、碳、氧、硅、铁(示意) */
  const SH = [[1.3, 0xffe08a, 1], [1.08, 0xffb347, 2], [0.86, 0xff6a3d, 6], [0.66, 0xff5fa2, 8], [0.48, 0xa37bff, 14], [0.3, 0x9aa6b8, 26]];
  const onion = new THREE.Group(); iScene.add(onion);
  const shells = SH.map(([r, c]) => { const m = fresnelMaterial(c, 1.6, 0.12, THREE.DoubleSide); const me = new THREE.Mesh(new THREE.SphereGeometry(r, 64, 48), m); onion.add(me); return me; });
  const protons = Array(4).fill(0).map(() => { const s = glowSprite([[0, 'rgba(255,250,230,1)'], [0.35, 'rgba(255,120,60,.8)'], [1, 'rgba(255,60,20,0)']], 0.22); iScene.add(s); return s; });
  const TET = [[1, 1, 1], [-1, -1, 1], [-1, 1, -1], [1, -1, -1]].map(v => new THREE.Vector3(...v).normalize());
  const introEl = document.getElementById('intro');
  let it = -1, t0 = -1, tl = 0, cues = {}, lastScale = 1;
  const camI = 2.4;
  function cue(name, fn) { if (!cues[name]) { cues[name] = 1; fn(); } }
  function finish() {
    if (it < 0) return; it = -1; gl.scene = stageScene; gl.camera = cam; gl._pull = 0;
    introEl.classList.add('out'); setTimeout(() => { introEl.hidden = true; introEl.classList.remove('out', 'burn'); }, 800);
    EF.introDone();
  }
  EF.playIntro = force => {
    if (EF.reduced && !force) { EF.introDone(); return; }
    document.body.classList.add('pre'); introEl.hidden = false; introEl.classList.remove('out', 'burn', 'flat');
    try { renderer.compile(iScene, iCam); renderer.compile(stageScene, cam); } catch (e) {}
    cues = {}; it = 0; t0 = -1; lastScale = 1; ST.target = 0; ST.val = 0; gl.scene = iScene; gl.camera = iCam;
  };
  introEl.addEventListener('click', finish); document.getElementById('iSkip').addEventListener('click', e => { e.stopPropagation(); finish(); });
  addEventListener('keydown', e => { if (it >= 0 && (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter')) finish(); });
  const flashK = EF.campus ? 0.35 : 1;
  gl.onFrame((t, dt) => {
    if (it < 0) { if (gl.scene === stageScene && gl._pull > 0.01) gl._pull *= 0.94; return; }
    if (t0 < 0) { t0 = t; tl = t; }
    if (t - tl > 0.2) t0 += (t - tl) - 0.033;   /* 卡顿(如着色器编译)不跳帧;其余按真实时间推进 */
    tl = t; it = t - t0; const T = it;
    dm.uniforms.uT.value = T; dm.uniforms.uA.value = 1 - ease((T - 1.7) / 0.6);
    dust.visible = T < 2.4;
    /* 点燃 */
    const ign = ease((T - 1.6) / 1.1); iStar.scale.setScalar(Math.max(0.001, ign)); iStarM.uniforms.uT.value = T;
    iStarM.uniforms.uA.value = 1 - ease((T - 3.0) / 0.5); iStar.visible = T < 3.6;
    iGlow.scale.setScalar(6 * ign); iGlow.material.opacity = (1 - ease((T - 3.0) / 0.6)) * ign;
    if (T > 1.9) cue('anvil', () => EF.play('anvil'));
    /* 穿越洋葱层:层不断放大,一层层掠过镜头 */
    const sc = T < 2.9 ? 1 : lerp(1, 5.3, ease((T - 2.9) / 1.6));
    onion.visible = T > 2.85 && T < 5.4; onion.scale.setScalar(sc); onion.rotation.y = T * 0.15;
    shells.forEach((m, k) => { const a = ease((T - 2.85) / 0.35) * (1 - ease((T - 4.9) / 0.5)); m.material.uniforms.uA.value = a * (k === 5 ? 1.4 : 0.9); m.visible = SH[k][0] * sc < camI * 1.08; });
    SH.forEach(([r, , z], k) => { if (r * lastScale < camI && r * sc >= camI) EF.tone(z, 0, 0.18); }); lastScale = sc;
    /* 聚变:四个氢核合成一个氦核 */
    const fu = ease((T - 4.2) / 0.7);
    protons.forEach((p, k) => { p.visible = T > 4.0 && T < 5.0; p.position.copy(TET[k]).multiplyScalar(0.7 * (1 - fu)); p.material.opacity = ease((T - 4.0) / 0.3); });
    const fl = Math.max(ease((T - 1.75) / 0.25) * (1 - ease((T - 2.0) / 0.7)), ease((T - 4.85) / 0.15) * (1 - ease((T - 5.0) / 0.9)));
    flash.scale.setScalar(0.5 + fl * 9); flash.material.opacity = fl * flashK;
    if (T > 4.9) cue('fuse', () => { EF.play('fuse'); introEl.classList.add('burn'); });
    /* 镜头 */
    const z = T < 2.9 ? lerp(9, camI + 0.6, ease(T / 2.9)) : lerp(camI + 0.6, camI, ease((T - 2.9) / 0.6));
    iCam.position.set(Math.sin(T * 0.3) * 0.15, 0.6 * (1 - ease(T / 2.6)), z); iCam.lookAt(0, 0, 0);
    /* 拉出 → 舞台 */
    if (T > 6.0) cue('out', () => { EF.play('whoosh'); gl._pull = 5; gl.scene = stageScene; gl.camera = cam; });
    if (T > 6.2) finish();
  });
  if (!EF.get('_intro', 0) && !EF.reduced) EF.playIntro(); else EF.introDone();
}

/* ======================================================================
   元素起源周期表 · 3D 台面
   ====================================================================== */
function bootTable() {
  const host = document.getElementById('pt3d'); host.hidden = false; document.body.classList.add('gl3d');
  const gl = makeGL(host, { fov: 38 }), { scene, camera, renderer } = gl;
  scene.add(new THREE.AmbientLight(0xb0a4c0, 1.4));
  const dl = new THREE.DirectionalLight(0xffffff, 1.8); dl.position.set(-4, 10, 6); scene.add(dl);
  const pl = new THREE.PointLight(0xff9a3c, 40, 30); pl.position.set(0, 4, 4); scene.add(pl);
  const world = new THREE.Group(); scene.add(world);
  const plat = new THREE.Mesh(new THREE.BoxGeometry(19.6, 0.12, 11.6), new THREE.MeshStandardMaterial({ color: 0x0f1628, metalness: 0.7, roughness: 0.22, transparent: true, opacity: 0.88 }));
  plat.position.set(0, -0.17, 0.3); world.add(plat);
  const edge = new THREE.LineSegments(new THREE.EdgesGeometry(plat.geometry), new THREE.LineBasicMaterial({ color: 0xff9a3c, transparent: true, opacity: 0.35 })); edge.position.copy(plat.position); world.add(edge);
  const lit = EF.lit || {}, tiles = [], box = new THREE.BoxGeometry(0.9, 0.22, 0.9);
  const beamM = new THREE.ShaderMaterial({
    uniforms: { uT: { value: 0 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    vertexShader: `varying vec2 vU; void main(){ vU=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `uniform float uT; varying vec2 vU; void main(){ float a=pow(1.0-vU.y,1.6)*(0.55+0.15*sin(uT*3.0+vU.y*12.0)); gl_FragColor=vec4(vec3(1.0,0.72,0.3)*a,a); }`
  });
  const beamG = new THREE.CylinderGeometry(0.2, 0.3, 4.2, 20, 1, true);
  function face(e, O, on) {
    const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
    const col = new THREE.Color(O.c);
    x.fillStyle = on ? O.c : '#' + col.clone().multiplyScalar(0.3).getHexString(); x.fillRect(0, 0, 128, 128);
    x.strokeStyle = on ? '#fff' : O.c; x.globalAlpha = on ? 0.9 : 0.7; x.lineWidth = 5; x.strokeRect(3, 3, 122, 122); x.globalAlpha = 1;
    x.fillStyle = on ? '#1a1206' : '#f4ede1'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.font = '800 54px system-ui,-apple-system,"PingFang SC","Noto Sans SC",sans-serif'; x.fillText(e.sym, 64, 62);
    x.font = '600 20px system-ui,sans-serif'; x.textAlign = 'left'; x.fillText(String(e.z), 10, 18);
    x.font = '500 20px system-ui,"PingFang SC","Noto Sans SC",sans-serif'; x.textAlign = 'center'; x.fillText(e.zh, 64, 108);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
  }
  EF.ELEM.forEach(e => {
    const O = EF.ORIGIN[e.o], p = EF.pos(e.z), on = !!lit[e.z], col = new THREE.Color(O.c);
    const side = new THREE.MeshStandardMaterial({ color: col.clone().multiplyScalar(on ? 0.9 : 0.4), roughness: 0.35, metalness: 0.3, emissive: on ? col.clone().multiplyScalar(0.5) : new THREE.Color(0) });
    const top = new THREE.MeshBasicMaterial({ map: face(e, O, on) });
    const m = new THREE.Mesh(box, [side, side, top, side, side, side]);
    const bx = (p[0] - 9.5) * 1.0, bz = (p[1] - 5.2) * 1.0 - (p[1] >= 9 ? 0.55 : 0);
    m.position.set(bx, 0, bz); m.userData = { e, base: on ? 0.45 : 0, lift: 0 }; world.add(m); tiles.push(m);
    if (on) { const b = new THREE.Mesh(beamG, beamM); b.position.set(bx, 0.45 + 2.2, bz); world.add(b); }
  });
  /* 光柱上升的火星 */
  const litT = tiles.filter(m => m.userData.base > 0), SP = litT.length * 10, spP = new Float32Array(SP * 3), sp = [];
  for (let i = 0; i < SP; i++) { const m = litT[i % litT.length]; sp.push({ x: m.position.x + (rnd() - 0.5) * 0.5, z: m.position.z + (rnd() - 0.5) * 0.5, y: rnd() * 4, v: 0.5 + rnd() }); }
  const spG = new THREE.BufferGeometry(); spG.setAttribute('position', new THREE.BufferAttribute(spP, 3));
  if (SP) world.add(new THREE.Points(spG, new THREE.PointsMaterial({ color: 0xffc46b, size: 0.07, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false })));
  /* 相机:倾斜台面 / 俯视 */
  let flat = false, yaw = 0, yawT = 0;
  const CAM = { tilt: new THREE.Vector3(), top: new THREE.Vector3() };
  const fit = () => { const k = Math.max(1, 1.75 / camera.aspect); CAM.tilt.set(0, 11 * k, 13 * k); CAM.top.set(0, 19 * k, 0.6); };
  fit(); gl.onresize = fit; camera.position.copy(CAM.tilt);
  EF.pt3dFlat = () => { flat = !flat; };
  /* 悬停 / 点击 */
  const ray = new THREE.Raycaster(), mv = new THREE.Vector2(-9, -9), cv = renderer.domElement;
  const tip = document.createElement('div'); tip.className = 'pt3d-tip'; tip.hidden = true; document.body.appendChild(tip);
  let hov = null, sel = 26, down = null;
  cv.addEventListener('pointermove', e => {
    const r = cv.getBoundingClientRect(); mv.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1);
    if (down && e.pointerType !== 'touch') { yawT = Math.max(-0.6, Math.min(0.6, yawT + (e.clientX - down.x) * 0.004)); down.x = e.clientX; down.moved = true; }
    tip.style.left = (e.clientX + 14) + 'px'; tip.style.top = (e.clientY + 14) + 'px';
  });
  cv.addEventListener('pointerleave', () => { mv.set(-9, -9); tip.hidden = true; });
  cv.addEventListener('pointerdown', e => { down = { x: e.clientX, moved: false }; });
  cv.addEventListener('pointerup', () => {
    if (down && !down.moved && hov) { sel = hov.userData.e.z; EF.selectEl(sel); }
    down = null;
  });
  gl.onFrame((t, dt) => {
    beamM.uniforms.uT.value = t;
    yaw = lerp(yaw, yawT + (EF.reduced ? 0 : Math.sin(t * 0.15) * 0.05), 0.08); world.rotation.y = yaw;
    camera.position.lerp(flat ? CAM.top : CAM.tilt, 0.06); camera.lookAt(0, 0, flat ? 0.2 : 0.6);
    ray.setFromCamera(mv, camera); const hit = ray.intersectObjects(tiles, false)[0];
    const h = hit ? hit.object : null;
    if (h !== hov) { hov = h; cv.style.cursor = h ? 'pointer' : 'grab'; if (h) { const e = h.userData.e; tip.textContent = e.z + ' ' + e.zh + ' ' + e.sym + ' · ' + EF.ORIGIN[e.o].n; tip.hidden = false; EF.hover(); } else tip.hidden = true; }
    tiles.forEach(m => { const u = m.userData, tgt = u.base + (m === hov ? 0.3 : 0) + (u.e.z === sel ? 0.18 : 0); u.lift = lerp(u.lift, tgt, 0.15); m.position.y = u.lift; });
    if (SP) { sp.forEach((s, i) => { s.y += s.v * dt; if (s.y > 4.2) s.y = 0.5; spP[i * 3] = s.x; spP[i * 3 + 1] = s.y; spP[i * 3 + 2] = s.z; }); spG.attributes.position.needsUpdate = true; }
  });
  const origSel = EF.selectEl; EF.selectEl = z => { sel = z; origSel(z); };
}
