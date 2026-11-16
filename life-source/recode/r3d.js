// 生命源码 2.0 · 改码·玻璃细胞 —— 3D 场景
// 细胞体:three.js 官方 MarchingCubes(元球,融合/分裂);细胞膜与细胞核:glass.js 透射玻璃(低档回退 MeshPhysicalMaterial);
// 荧光蛋白:RCSB PDB 1EMA 的 Cα 骨架(gfp-ca.js,离线精简);发光团 = 第 66 位。纯本地,零外部请求。
import THREE, { canGL } from '../ls-three.js';
import { GFP } from './gfp-ca.js';
import { makeGlass, makeGlassLow } from './glass.js';

export const EMIT = { // 发射峰(示意取色):GFP ~509 nm 绿;Y66H(BFP)~448 nm 蓝;Y66W(CFP)~476 nm 青
  Y: '#46ff8a', H: '#5b7cff', W: '#38d9ff', '*': null, other: null,
};
const BASE_COLOR = { A: '#4ade80', T: '#f5b041', G: '#60a5fa', C: '#f87171' };
const MCS = 2.2, SPLIT = .21; // 元球网格的世界缩放;分裂时每个细胞中心的归一化偏移
const ease = u => u < .5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
const lerp = (a, b, u) => a + (b - a) * u;

function glowTex() {
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.18, 'rgba(255,255,255,.55)'); r.addColorStop(.5, 'rgba(255,255,255,.12)'); r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r; g.fillRect(0, 0, 128, 128); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
export function pickTier() {
  const q = new URLSearchParams(location.search).get('q');
  if (q === 'high' || q === 'mid' || q === 'low') return q;
  if ((navigator.deviceMemory || 8) <= 2) return 'low';
  if (matchMedia('(pointer:coarse)').matches || Math.min(innerWidth, innerHeight) < 500) return 'mid';
  return 'high';
}

export async function mountCell(host, { reduced = false, onTier } = {}) {
  if (!canGL()) throw new Error('no-webgl');
  const { MarchingCubes } = await import('../vendor/r186/addons/MarchingCubes.js');
  let tier = pickTier();
  const TIER = { high: { pr: 2, mc: 52, buf: .5, smp: 6 }, mid: { pr: 1.5, mc: 38, buf: .34, smp: 4 }, low: { pr: 1, mc: 30, buf: 0, smp: 0 } };

  const renderer = new THREE.WebGLRenderer({ antialias: tier !== 'low', alpha: false, powerPreference: 'high-performance' });
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  host.append(renderer.domElement);
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#03100f');
  scene.fog = new THREE.FogExp2('#03100f', .055);
  const cam = new THREE.PerspectiveCamera(38, 1, .02, 60); cam.position.set(0, .25, 4.1);
  const look = new THREE.Vector3(0, 0, 0);

  // 光:冷色天光 + 主光 + 激发光束方向的紫蓝补光
  scene.add(new THREE.HemisphereLight('#bff7ea', '#071412', .7));
  const key = new THREE.DirectionalLight('#ffffff', 1.4); key.position.set(2, 3, 2); scene.add(key);
  const rimL = new THREE.DirectionalLight('#8b7bff', .8); rimL.position.set(-2, 1, -2); scene.add(rimL);

  // 显微激发光束(体积光示意):自上而下的锥体,纵向渐隐、边缘柔化
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(.55, 1.9, 7, 48, 1, true), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { uC: { value: new THREE.Color('#7c6cff') }, uK: { value: .16 } },
    vertexShader: 'varying float vY; varying vec3 vN; varying vec3 vV; void main(){ vY = position.y; vec4 w = modelViewMatrix*vec4(position,1.); vN = normalize(normalMatrix*normal); vV = normalize(-w.xyz); gl_Position = projectionMatrix*w; }',
    fragmentShader: 'uniform vec3 uC; uniform float uK; varying float vY; varying vec3 vN; varying vec3 vV; void main(){ float e = pow(abs(dot(normalize(vN),normalize(vV))),2.0); float f = smoothstep(-3.5,3.5,vY); gl_FragColor = vec4(uC*uK*e*f,1.0); }',
  }));
  beam.position.set(.1, 2.2, -.3); scene.add(beam);

  // 细胞质微粒
  const NP = tier === 'low' ? 260 : 700, pp = new Float32Array(NP * 3);
  for (let i = 0; i < NP; i++) { const r = 4 * Math.cbrt(Math.random()), t = Math.random() * 6.283, p = Math.acos(2 * Math.random() - 1); pp.set([r * Math.sin(p) * Math.cos(t), r * Math.cos(p) * .7, r * Math.sin(p) * Math.sin(t) - 1], i * 3); }
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pp, 3));
  const dust = new THREE.Points(pg, new THREE.PointsMaterial({ size: .018, color: '#9ff5d8', transparent: true, opacity: .45, depthWrite: false, blending: THREE.AdditiveBlending }));
  scene.add(dust);

  const GT = glowTex();
  const glow = (c, s) => { const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: GT, color: c, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); m.scale.setScalar(s); return m; };

  /* ---------- 细胞体:Marching Cubes 元球 ---------- */
  let glassMem, glassNuc;
  const mkMats = () => {
    if (tier === 'low') { glassMem = makeGlassLow(THREE, { tint: '#d8fff2', opacity: .2 }); glassNuc = makeGlassLow(THREE, { tint: '#bff7e0', opacity: .3 }); }
    else {
      glassMem = makeGlass(THREE, { samples: TIER[tier].smp, ior: 1.16, thickness: .45, chroma: .022, blur: .035, irid: .75, tint: '#effffa', atten: '#b5f5df', rim: '#c4b5fd' });
      glassNuc = makeGlass(THREE, { samples: Math.max(3, TIER[tier].smp - 2), ior: 1.3, thickness: .3, chroma: .02, blur: .06, irid: .35, iridScale: 2.4, tint: '#e6fff5', atten: '#7ee8c4', rim: '#a7f3d0' });
    }
  };
  mkMats();
  let mc = new MarchingCubes(TIER[tier].mc, glassMem, false, false, 60000);
  mc.isolation = 80; mc.scale.setScalar(MCS); mc.renderOrder = 2; scene.add(mc);

  // 细胞核 + 核内双螺旋(第 66 号密码子三个碱基单独着色)
  const nucGeo = new THREE.SphereGeometry(.36, 64, 48);
  const mkNucleus = () => {
    const g = new THREE.Group();
    const shell = new THREE.Mesh(nucGeo, glassNuc); shell.renderOrder = 1; shell.userData.glass = 'nuc'; g.add(shell);
    const hel = new THREE.Group(), N = 90, s1 = [], s2 = [];
    for (let i = 0; i <= N; i++) { const t = i / N, a = t * Math.PI * 6, x = lerp(-.24, .24, t); s1.push(new THREE.Vector3(x, Math.cos(a) * .07, Math.sin(a) * .07)); s2.push(new THREE.Vector3(x, -Math.cos(a) * .07, -Math.sin(a) * .07)); }
    const sm = c => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: .7, roughness: .4 });
    hel.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(s1), 160, .011, 6), sm('#34d399')));
    hel.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(s2), 160, .011, 6), sm('#67e8f9')));
    const rungs = [];
    for (let i = 3; i < N; i += 4) {
      const a = s1[i], b = s2[i], m = new THREE.Mesh(new THREE.CylinderGeometry(.006, .006, a.distanceTo(b), 5), sm('#a7f3d0'));
      m.position.copy(a).add(b).multiplyScalar(.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()); hel.add(m); rungs.push(m);
    }
    const mid = Math.floor(rungs.length / 2), codon = [rungs[mid - 1], rungs[mid], rungs[mid + 1]];
    codon.forEach(r => { r.scale.set(2.2, 1, 2.2); });
    const halo = glow('#fbbf24', .16); halo.position.copy(rungs[mid].position); hel.add(halo);
    hel.rotation.z = .25; g.add(hel);
    g.userData = { hel, codon, halo };
    return g;
  };
  const nucA = mkNucleus(); nucA.position.set(-.3, .06, -.05); scene.add(nucA);
  const nucB = mkNucleus(); nucB.visible = false; scene.add(nucB);

  // 核糖体(磨砂玻璃两亚基)与 mRNA
  const ribo = new THREE.Group();
  const frost = new THREE.MeshPhysicalMaterial({ color: '#e9d5ff', roughness: .55, transmission: 0, transparent: true, opacity: .55, emissive: '#6d28d9', emissiveIntensity: .25 });
  const r1 = new THREE.Mesh(new THREE.SphereGeometry(.06, 24, 16), frost); r1.scale.set(1.2, .8, 1); r1.position.y = .035;
  const r2 = new THREE.Mesh(new THREE.SphereGeometry(.075, 24, 16), frost); r2.scale.set(1.25, .7, 1); r2.position.y = -.03;
  ribo.add(r1, r2); ribo.position.set(.34, -.3, .12); scene.add(ribo);
  const mrnaCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(-.12, -.02, .05), new THREE.Vector3(.02, -.28, .2), new THREE.Vector3(.2, -.12, .15), new THREE.Vector3(.34, -.3, .12)]);
  const mrnaGeo = new THREE.TubeGeometry(mrnaCurve, 120, .008, 6); const mrnaN = mrnaGeo.index.count;
  const mrna = new THREE.Mesh(mrnaGeo, new THREE.MeshStandardMaterial({ color: '#f9a8d4', emissive: '#f472b6', emissiveIntensity: 1.1 }));
  mrnaGeo.setDrawRange(0, 0); scene.add(mrna);

  /* ---------- 荧光蛋白:PDB 1EMA Cα 骨架 ---------- */
  const NRES = GFP.ca.length / 3, S = 1 / 280;
  const realPts = []; for (let i = 0; i < NRES; i++) realPts.push(new THREE.Vector3(GFP.ca[i * 3] * S, GFP.ca[i * 3 + 1] * S, GFP.ca[i * 3 + 2] * S));
  const iChromo = GFP.chromo - GFP.first; // 第 66 位在数组中的下标
  // 截断链(无义突变:只合成到第 65 位)——没有完整 β 桶可依,画成松散的无规卷曲(示意)
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const coil = [new THREE.Vector3(realPts[0].x, realPts[0].y, realPts[0].z)];
  for (let i = 1; i < iChromo; i++) { const d = new THREE.Vector3(rnd() - .5, rnd() - .5, rnd() - .5).normalize().multiplyScalar(38 * S); coil.push(coil[i - 1].clone().add(d).multiplyScalar(.97)); }
  const RS = 6, TS = 6; // 每个残基 6 段,截面 6 边
  const tubeFrom = (pts, n) => {
    const g = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'centripetal'), (pts.length - 1) * TS, .016, RS, false);
    const col = new Float32Array(g.attributes.position.count * 3), cE = new THREE.Color('#7dffc6'), cL = new THREE.Color('#5c8f84');
    for (let i = 0; i < g.attributes.position.count; i++) { const seg = Math.floor(i / (RS + 1)), res = Math.min(n - 1, Math.floor(seg / TS)); const c = GFP.ss[res] === 'E' ? cE : cL; col.set([c.r, c.g, c.b], i * 3); }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3)); return g;
  };
  const protMat = () => new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: .25, metalness: 0, clearcoat: 1, emissive: '#0d3b30', emissiveIntensity: .6, transparent: true, opacity: .95 });
  const mkGFP = () => {
    const g = new THREE.Group();
    const full = new THREE.Mesh(tubeFrom(realPts, NRES), protMat());
    const trunc = new THREE.Mesh(tubeFrom(coil, iChromo), protMat()); trunc.visible = false;
    const core = new THREE.Mesh(new THREE.SphereGeometry(.035, 16, 12), new THREE.MeshBasicMaterial({ color: '#ffffff' }));
    core.position.copy(realPts[iChromo]);
    const halo = glow('#46ff8a', 1.6); halo.position.copy(core.position);
    const light = new THREE.PointLight('#46ff8a', 0, 2, 1.2); light.position.copy(core.position);
    g.add(full, trunc, core, halo, light);
    g.userData = { full, trunc, core, halo, light, idxPerRes: TS * RS * 6 };
    g.scale.setScalar(.95);
    return g;
  };
  const gfpB = mkGFP(), gfpA = mkGFP(); gfpA.visible = false;
  const placeGFP = (g, x, y, z, s) => { g.position.set(x, y, z); g.scale.setScalar(s); };
  placeGFP(gfpB, .36, .24, .08, .28); scene.add(gfpB, gfpA);
  const setGlow = (g, kind, k = 1) => {
    const d = g.userData, c = EMIT[kind];
    d.core.visible = !!c; d.halo.visible = !!c; d.light.intensity = c ? 5 * k : 0;
    if (c) { d.halo.material.color.set(c); d.light.color.set(c); d.core.material.color.set(c).lerp(new THREE.Color('#ffffff'), .55); d.halo.scale.setScalar(1.7 * Math.max(.05, k)); d.halo.material.opacity = k; }
  };
  const setGrow = (g, u, kind) => { // u: 0..1 合成进度
    const d = g.userData, trunc = kind === '*';
    d.full.visible = !trunc; d.trunc.visible = trunc;
    const m = trunc ? d.trunc : d.full, n = trunc ? iChromo : NRES;
    m.geometry.setDrawRange(0, Math.floor(u * (n - 1)) * d.idxPerRes);
  };
  setGrow(gfpB, 1, 'Y'); setGlow(gfpB, 'Y', .9);

  /* ---------- 缓冲(透射用) ---------- */
  let rtA = null, rtB = null;
  const mkRT = () => {
    rtA?.dispose(); rtB?.dispose(); rtA = rtB = null;
    if (tier === 'low') return;
    const w = Math.max(64, Math.floor(host.clientWidth * renderer.getPixelRatio() * TIER[tier].buf)), h = Math.max(64, Math.floor(host.clientHeight * renderer.getPixelRatio() * TIER[tier].buf));
    const o = { type: THREE.HalfFloatType, samples: 0 };
    rtA = new THREE.WebGLRenderTarget(w, h, o); rtB = new THREE.WebGLRenderTarget(w, h, o);
  };

  /* ---------- 状态 ---------- */
  const st = { split: 0, fuse: 1, zoom: 0, t: 0, kindA: 'Y', kindB: 'Y', beam: 0.16 };
  const balls = () => {
    // 融合:两个小球从两侧并入;分裂:一个细胞拉成两个(左原码 / 右改码,并排对照示意)
    // 元素:[x, y, z, 半径](归一化 0–1 网格坐标)
    const sx = lerp(.2, 0, st.fuse) + st.split * SPLIT;
    const r = st.split > 0 ? lerp(.155, .14, st.split) : lerp(.16, .155, st.fuse);
    const b = [[.5 - sx, .5, .5, r], [.5 + sx, .5, .5, r]];
    const w = st.t * .6, R0 = st.split > .5 ? .075 : .14;
    for (let i = 0; i < 4; i++) { const a = w + i * 1.57, cx = st.split > .5 ? (i % 2 ? .5 + sx : .5 - sx) : .5; b.push([cx + Math.cos(a) * R0, .5 + Math.sin(a * 1.3) * .07, .5 + Math.sin(a) * R0 * .8, .065]); }
    return b;
  };
  const updateMC = () => {
    mc.reset();
    for (const [x, y, z, r] of balls()) mc.addBall(x, y, z, r * r * (80 + 12), 12);
    mc.update();
  };
  const layout = () => {
    const s = st.split, off = s * SPLIT * 2 * MCS; // 归一化偏移 → 世界坐标
    nucA.position.set(lerp(-.3, -off - .28, s), .06, -.05);
    nucB.visible = s > .02; nucB.position.set(off - .28, .06, -.05); nucB.scale.setScalar(Math.max(.01, s));
    nucA.scale.setScalar(lerp(1, .82, s));
    ribo.visible = mrna.visible = s < .05;
    gfpA.visible = s > .02;
    if (s > 0) { placeGFP(gfpA, -off + .3, .12, .1, lerp(.28, .26, s)); placeGFP(gfpB, lerp(.36, off + .3, s), lerp(.24, .12, s), .1, lerp(.28, .26, s)); }
    // 镜头:总览 / 推进到蛋白 / 两细胞对照
    const z = st.zoom, P = gfpB.position;
    if (s === 0) gfpB.scale.setScalar(lerp(.28, .4, ease(z)));
    // 推进到蛋白时玻璃逐渐「让路」:色散、模糊、虹彩随镜头推进减弱,避免透过膜看蛋白时过度失真
    for (const m of [glassMem, glassNuc]) if (m.uniforms) { const k = 1 - .85 * ease(z); m.uniforms.uChroma.value = m.userData.c0 * k; m.uniforms.uBlur.value = m.userData.b0 * k; m.uniforms.uIor.value = 1 + (m.userData.i0 - 1) * k; }
    const th = Math.tan(cam.fov * Math.PI / 360), a = cam.aspect;
    const dOver = Math.max(1.2 / th, 1.2 / (th * a)), dSplit = Math.max(1.0 / th, 2.0 / (th * a)), dZoom = Math.max(.48 / th, .48 / (th * a));
    const cPos = new THREE.Vector3(0, .2, dOver).lerp(new THREE.Vector3(P.x + .04, P.y + .05, P.z + dZoom), ease(z)).lerp(new THREE.Vector3(0, .25, dSplit), ease(s));
    const cLook = new THREE.Vector3(0, 0, 0).lerp(P, ease(z)).lerp(new THREE.Vector3(0, .05, 0), ease(s));
    cam.position.copy(cPos); look.copy(cLook); cam.lookAt(look);
  };

  /* ---------- 渲染循环 ---------- */
  let raf = 0, dead = false, last = performance.now(), frames = 0, fpsT = 0, fpsN = 0, watch = !reduced;
  const resize = () => {
    const w = host.clientWidth || 1, h = host.clientHeight || 1;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, TIER[tier].pr)); renderer.setSize(w, h, false);
    cam.aspect = w / h; cam.fov = w / h < .8 ? 52 : 38; cam.updateProjectionMatrix(); mkRT();
  };
  const ro = new ResizeObserver(resize); ro.observe(host); resize();
  const glassObjs = () => [mc, nucA.children[0], nucB.children[0]];
  const draw = () => {
    layout();
    if (tier !== 'low' && rtA) {
      const [m, n1, n2] = glassObjs(); const vis = [n1.visible, n2.visible];
      m.visible = n1.visible = n2.visible = false;
      renderer.setRenderTarget(rtA); renderer.render(scene, cam);
      n1.visible = vis[0]; n2.visible = nucB.visible && vis[1];
      glassNuc.uniforms.uBuffer.value = rtA.texture;
      renderer.setRenderTarget(rtB); renderer.render(scene, cam);
      m.visible = true; glassMem.uniforms.uBuffer.value = rtB.texture;
      renderer.setRenderTarget(null);
    }
    renderer.render(scene, cam);
  };
  const setTier = t => {
    if (t === tier) return; tier = t;
    scene.remove(mc); mc.geometry?.dispose?.();
    [glassMem, glassNuc].forEach(m => m.dispose()); mkMats();
    mc = new MarchingCubes(TIER[tier].mc, glassMem, false, false, 60000); mc.isolation = 80; mc.scale.setScalar(MCS); mc.renderOrder = 2; scene.add(mc);
    [nucA, nucB].forEach(n => (n.children[0].material = glassNuc));
    resize(); updateMC(); onTier?.(tier);
  };
  const loop = now => {
    if (dead) return; raf = requestAnimationFrame(loop);
    if (document.hidden) return;
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    if (!reduced) {
      st.t += dt;
      if (glassMem.uniforms) glassMem.uniforms.uTime.value = st.t;
      if (glassNuc.uniforms) glassNuc.uniforms.uTime.value = st.t;
      nucA.userData.hel.rotation.x += dt * .25; nucB.userData.hel.rotation.x += dt * .25;
      gfpA.rotation.y += dt * .22; gfpB.rotation.y += dt * .22;
      dust.rotation.y += dt * .01;
      updateMC();
    }
    // 自动降档:前 4 秒平均帧率过低就换档(只降不升)
    if (watch) { fpsT += dt; fpsN++; if (fpsT > 4) { const fps = fpsN / fpsT; fpsT = fpsN = 0; if (fps < 26 && tier !== 'low') setTier(tier === 'high' ? 'mid' : 'low'); else watch = false; } }
    draw();
  };
  updateMC(); draw();
  raf = requestAnimationFrame(loop);

  const anim = (dur, f) => new Promise(ok => {
    if (reduced) { f(1); if (reduced) { updateMC(); draw(); } return ok(); }
    const t0 = performance.now(); const step = now => { if (dead) return ok(); const u = Math.min(1, (now - t0) / dur); f(u); u < 1 ? requestAnimationFrame(step) : ok(); }; requestAnimationFrame(step);
  });
  const redraw = () => { if (reduced) { updateMC(); draw(); } };

  return {
    get tier() { return tier; },
    setCodon(codon, nuc = nucA) { nuc.userData.codon.forEach((r, i) => r.material.color.set(BASE_COLOR[codon[i]] || '#a7f3d0') && r.material.emissive.set(BASE_COLOR[codon[i]] || '#a7f3d0')); redraw(); },
    async fuse() { st.fuse = 0; await anim(2600, u => (st.fuse = ease(u))); redraw(); },
    /** 转录 → 翻译 → 折叠 → 发光;onStep(阶段名) */
    async express(kind, onStep = () => {}) {
      setGrow(gfpB, 0, kind); setGlow(gfpB, kind, 0);
      onStep('transcribe'); mrnaGeo.setDrawRange(0, 0);
      await anim(1600, u => mrnaGeo.setDrawRange(0, Math.floor(u * mrnaN / 6) * 6));
      onStep('translate'); await anim(1100, u => (st.zoom = u));
      await anim(kind === '*' ? 2000 : 3800, u => setGrow(gfpB, u, kind));
      onStep('fold');
      if (EMIT[kind]) await anim(1400, u => setGlow(gfpB, kind, u)); else await anim(500, () => {});
      onStep('done'); redraw();
    },
    zoomOut() { return anim(1000, u => (st.zoom = 1 - u)).then(redraw); },
    async compare(kind) {
      setGrow(gfpA, 1, 'Y'); setGlow(gfpA, 'Y', 1); setGrow(gfpB, 1, kind); setGlow(gfpB, kind, 1);
      const codon = nucA.userData.codon.map(r => '#' + r.material.color.getHexString());
      nucB.userData.codon.forEach((r, i) => { r.material.color.set(codon[i]); r.material.emissive.set(codon[i]); });
      nucA.userData.codon.forEach(r => { r.material.color.set(BASE_COLOR.T); r.material.emissive.set(BASE_COLOR.T); });
      nucA.userData.codon[1].material.color.set(BASE_COLOR.A); nucA.userData.codon[1].material.emissive.set(BASE_COLOR.A);
      st.zoom = 0; await anim(2600, u => (st.split = ease(u))); redraw();
    },
    async reset(kind = 'Y') { st.split = 0; st.zoom = 0; st.fuse = 1; setGrow(gfpB, 1, kind); setGlow(gfpB, kind, .9); mrnaGeo.setDrawRange(0, 0); redraw(); },
    dispose() { dead = true; cancelAnimationFrame(raf); ro.disconnect(); rtA?.dispose(); rtB?.dispose(); renderer.dispose(); renderer.domElement.remove(); },
  };
}
