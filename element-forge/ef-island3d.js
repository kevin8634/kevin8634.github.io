/* 元素工坊 Element Forge · 超重元素岛 3D 核素地形 ef-island3d.js v2.0
   数据:data/ef.island.chart.json(IAEA Live Chart of Nuclides 快照,3355 个已知核素)。
   每个核素一根柱:横轴中子数 N,纵深质子数 Z,高度 = 寿命(稳定核最高,短命核沉入「不稳定之海」)。
   稳定岛(Z≈114–126、N≈184)为理论预言,只画成虚光,页面另有文字标注。
   独立渲染器(不走 makeGL),离开页面或换关即释放;页面隐藏暂停;减少动态时静止。 */
import { THREE } from './ef-gl.js?v=2';
const EF = window.EF;
const NX = 92, ZX = 60, S = 0.1;
const px = n => (n - NX) * S, pz = z => -(z - ZX) * S;
const hOf = lt => lt === 99 ? 1.7 : lt === -99 ? 0.04 : Math.max(0.06, Math.min(1.45, 0.42 + lt * 0.06));
function colOf(lt, c) {
  if (lt === 99) return c.setRGB(1.0, 0.93, 0.74);
  if (lt === -99) return c.setRGB(0.12, 0.16, 0.26);
  const t = Math.max(0, Math.min(1, (lt + 8) / 22));            /* 短命 → 深蓝紫;长寿 → 熔金橙 */
  return c.setRGB(0.16 + t * 0.84, 0.18 + t * 0.42, 0.42 - t * 0.18);
}

export async function mountIsland(host, opt = {}) {
  const mode = opt.mode || 'chart', reduced = EF.reduced, mid = EF.glTier !== 'high';
  const J = await (await fetch(EF.BASE + 'data/ef.island.chart.json')).json();
  const rows = J.rows, SYM = opt.sym || {};
  const renderer = new THREE.WebGLRenderer({ antialias: !mid, powerPreference: 'high-performance' });
  renderer.setClearColor(0x03060f, 1);
  renderer.setPixelRatio(EF.dpr()); renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.className = 'isl-gl'; host.appendChild(renderer.domElement);
  const scene = new THREE.Scene(); scene.fog = new THREE.FogExp2(0x03060f, mode === 'edge' ? 0.05 : 0.035);
  const cam = new THREE.PerspectiveCamera(42, 1, 0.05, 200);
  scene.add(new THREE.AmbientLight(0x8090b0, 1.4));
  const key = new THREE.DirectionalLight(0xffe2c0, 2.2); key.position.set(-4, 8, 6); scene.add(key);
  const rim = new THREE.PointLight(0xff9a3c, 18, 30); rim.position.set(6, 3, -4); scene.add(rim);

  /* 不稳定之海:暗色水面 + 缓慢涌动 */
  const seaU = { uT: { value: 0 } };
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(60, 40, 1, 1), new THREE.ShaderMaterial({
    uniforms: seaU, transparent: true, depthWrite: false,
    vertexShader: 'varying vec2 vU; void main(){ vU=position.xy; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: `uniform float uT; varying vec2 vU;
      void main(){ float w=sin(vU.x*1.7+uT*.6)*sin(vU.y*2.1-uT*.45)+sin((vU.x+vU.y)*3.3+uT*.8)*.5;
        float d=length(vU)/26.; vec3 c=mix(vec3(.02,.05,.11),vec3(.05,.10,.20),.5+.25*w);
        gl_FragColor=vec4(c+vec3(.9,.55,.2)*pow(clamp(w*.7,0.,1.),8.)*.05,1.-smoothstep(.7,1.,d)); }` }));
  sea.rotation.x = -Math.PI / 2; sea.position.y = 0.02; sea.renderOrder = -1; scene.add(sea);

  /* 核素柱 */
  const geo = new THREE.BoxGeometry(S * 0.86, 1, S * 0.86); geo.translate(0, 0.5, 0);
  const mat = new THREE.MeshStandardMaterial({ roughness: 0.45, metalness: 0.25, emissive: 0x3a1a04, emissiveIntensity: 0.55 });
  const inst = new THREE.InstancedMesh(geo, mat, rows.length);
  const m4 = new THREE.Matrix4(), c = new THREE.Color(), q = new THREE.Quaternion(), v = new THREE.Vector3(), sc = new THREE.Vector3();
  const H = new Float32Array(rows.length);
  rows.forEach((r, i) => { const h = hOf(r[3]); H[i] = h; v.set(px(r[1]), 0, pz(r[0])); sc.set(1, h, 1); m4.compose(v, q, sc); inst.setMatrixAt(i, m4); inst.setColorAt(i, colOf(r[3], c)); });
  inst.instanceMatrix.needsUpdate = true; inst.instanceColor.needsUpdate = true; scene.add(inst);

  /* 幻数网格线 */
  const lm = new THREE.LineBasicMaterial({ color: 0xff9a3c, transparent: true, opacity: 0.32 });
  const lines = new THREE.Group(); scene.add(lines);
  [8, 20, 28, 50, 82, 126].forEach(n => { const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(px(n), 0.03, pz(0)), new THREE.Vector3(px(n), 0.03, pz(125))]); lines.add(new THREE.Line(g, lm)); });
  [8, 20, 28, 50, 82].forEach(z => { const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(px(0), 0.03, pz(z)), new THREE.Vector3(px(190), 0.03, pz(z))]); lines.add(new THREE.Line(g, lm)); });

  /* 稳定岛(理论预言,虚光) */
  const isl = new THREE.Group(); isl.position.set(px(184), 0.05, pz(117)); scene.add(isl);
  const ig = new THREE.Mesh(new THREE.CircleGeometry(0.7, 48), new THREE.MeshBasicMaterial({ color: 0xff9a3c, transparent: true, opacity: 0.32, depthWrite: false, blending: THREE.AdditiveBlending }));
  ig.rotation.x = -Math.PI / 2; ig.scale.set(1, 1.5, 1); isl.add(ig);
  const gc = document.createElement('canvas'); gc.width = gc.height = 128; const gx = gc.getContext('2d'), gr = gx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,190,110,.9)'); gr.addColorStop(0.35, 'rgba(255,154,60,.35)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); gx.fillStyle = gr; gx.fillRect(0, 0, 128, 128);
  const gt = new THREE.CanvasTexture(gc); gt.colorSpace = THREE.SRGBColorSpace;
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: gt, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); glow.scale.set(3.6, 3.6, 1); glow.position.y = 0.5; isl.add(glow);

  /* r 过程金雨(第 4 关):落向富中子一侧 */
  let rain = null;
  if (mode === 'edge') {
    const n = mid ? 700 : 1500, p = new Float32Array(n * 3), sp = new Float32Array(n);
    for (let i = 0; i < n; i++) { p[i * 3] = px(120 + Math.random() * 75); p[i * 3 + 1] = Math.random() * 6; p[i * 3 + 2] = pz(60 + Math.random() * 60); sp[i] = 0.6 + Math.random(); }
    const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.BufferAttribute(p, 3));
    rain = new THREE.Points(rg, new THREE.PointsMaterial({ color: 0xffc46b, size: 0.08, transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending }));
    rain.userData.sp = sp; scene.add(rain);
  }

  /* 星空 */
  { const n = mid ? 600 : 1200, p = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const a = Math.random() * 6.283, b = Math.acos(Math.random() * 2 - 1) * 0.55, r = 70; p[i * 3] = Math.cos(a) * Math.sin(b) * r; p[i * 3 + 1] = Math.cos(b) * r * 0.6 + 4; p[i * 3 + 2] = Math.sin(a) * Math.sin(b) * r; }
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(p, 3)); scene.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xdfe6ff, size: 0.12, transparent: true, opacity: 0.8, fog: false }))); }

  /* 高亮标记 */
  const mark = new THREE.Mesh(new THREE.RingGeometry(0.09, 0.13, 32), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.95, side: THREE.DoubleSide, depthTest: false }));
  mark.rotation.x = -Math.PI / 2; mark.visible = false; mark.renderOrder = 9; scene.add(mark);

  /* 相机:拖动旋转、滚轮/双指缩放(简易轨道) */
  const tgt = new THREE.Vector3(), ctl = { th: -0.35, ph: 0.92, r: 14 };
  if (mode === 'edge') { tgt.set(px(168), 0.3, pz(104)); ctl.th = -0.55; ctl.ph = 0.82; ctl.r = 9; } else tgt.set(0, 0.3, 0.6);
  const goal = { ...ctl, t: tgt.clone() };
  function place() { cam.position.set(tgt.x + ctl.r * Math.sin(ctl.ph) * Math.sin(ctl.th), tgt.y + ctl.r * Math.cos(ctl.ph), tgt.z + ctl.r * Math.sin(ctl.ph) * Math.cos(ctl.th)); cam.lookAt(tgt); }
  const el = renderer.domElement; el.style.touchAction = 'none';
  const ptrs = new Map(); let drag = 0, pinch = 0, downAt = null;
  el.addEventListener('pointerdown', e => { el.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, [e.clientX, e.clientY]); drag = 0; downAt = [e.clientX, e.clientY]; });
  el.addEventListener('pointermove', e => {
    if (!ptrs.has(e.pointerId)) return; const o = ptrs.get(e.pointerId), dx = e.clientX - o[0], dy = e.clientY - o[1]; ptrs.set(e.pointerId, [e.clientX, e.clientY]);
    if (ptrs.size === 2) { const [a, b] = [...ptrs.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]); if (pinch) goal.r = Math.max(2.5, Math.min(22, goal.r * pinch / d)); pinch = d; drag = 9; return; }
    drag += Math.abs(dx) + Math.abs(dy); goal.th -= dx * 0.006; goal.ph = Math.max(0.25, Math.min(1.35, goal.ph - dy * 0.005));
  });
  const up = e => { ptrs.delete(e.pointerId); pinch = 0; if (e.type === 'pointerup' && drag < 6 && downAt) pick(e); };
  el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
  el.addEventListener('wheel', e => { e.preventDefault(); goal.r = Math.max(2.5, Math.min(22, goal.r * (1 + Math.sign(e.deltaY) * 0.1))); }, { passive: false });
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function pick(e) {
    const b = el.getBoundingClientRect(); ndc.set(((e.clientX - b.left) / b.width) * 2 - 1, -((e.clientY - b.top) / b.height) * 2 + 1);
    ray.setFromCamera(ndc, cam); const h = ray.intersectObject(inst, false)[0];
    if (h && h.instanceId != null) { api.focus(rows[h.instanceId][0], rows[h.instanceId][1], true); }
  }

  const api = {
    rows,
    focus(z, n, fromPick) {
      const i = rows.findIndex(r => r[0] === z && r[1] === n); if (i < 0) return null;
      mark.visible = true; mark.position.set(px(n), H[i] + 0.02, pz(z));
      if (!fromPick || opt.follow) { goal.t = new THREE.Vector3(px(n), 0.3, pz(z)); goal.r = Math.min(goal.r, 7); }
      opt.onPick && opt.onPick(rows[i]); return rows[i];
    },
    dispose() { alive = false; ro && ro.disconnect(); renderer.dispose(); geo.dispose(); mat.dispose(); try { renderer.forceContextLoss(); } catch (e) {} el.remove(); }
  };
  function rs() { const w = host.clientWidth || 1, h = host.clientHeight || 1; renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); }
  const ro = window.ResizeObserver ? new ResizeObserver(rs) : null; ro ? ro.observe(host) : addEventListener('resize', rs); rs();
  let alive = true, last = performance.now();
  if (reduced) { Object.assign(ctl, goal); tgt.copy(goal.t); }
  function frame(now) {
    if (!alive) return; if (!host.isConnected) { api.dispose(); return; }
    requestAnimationFrame(frame);
    if (document.hidden) { last = now; return; }
    const dt = Math.min(0.05, (now - last) / 1000), t = now / 1000; last = now;
    const k = reduced ? 1 : 1 - Math.exp(-dt * 4);
    ctl.th += (goal.th - ctl.th) * k; ctl.ph += (goal.ph - ctl.ph) * k; ctl.r += (goal.r - ctl.r) * k; tgt.lerp(goal.t, k); place();
    if (!reduced) {
      seaU.uT.value = t; glow.material.opacity = 0.75 + Math.sin(t * 1.6) * 0.2; mark.scale.setScalar(1 + Math.sin(t * 5) * 0.15);
      if (rain) { const a = rain.geometry.attributes.position.array, sp = rain.userData.sp; for (let i = 0; i < sp.length; i++) { a[i * 3 + 1] -= dt * sp[i] * 1.6; if (a[i * 3 + 1] < 0.05) a[i * 3 + 1] = 5 + Math.random() * 2; } rain.geometry.attributes.position.needsUpdate = true; }
    }
    renderer.render(scene, cam);
  }
  place(); requestAnimationFrame(frame);
  return api;
}
