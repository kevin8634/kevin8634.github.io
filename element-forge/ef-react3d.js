/* 元素工坊 Element Forge · 反应台 3D 全息反应环 ef-react3d.js v2.1
   视觉方向 A「全息反应环」:圆形全息台 + 两圈熔金橙/青绿光环 + 中央烧杯。
   run(rx):烧杯液面颜色渐变(颜色证据)、气泡上升(气体证据)、沉淀絮状下落(沉淀证据)、热浪光晕(放热红 / 吸热蓝)。
   独立渲染器;页面隐藏暂停;减少动态时只切换最终状态;校园版 + 🔴 条目不播特效(由页面传 quiet)。 */
import { THREE, glowSprite } from './ef-gl.js?v=2';
const EF = window.EF;

export async function mountReact(host, opt = {}) {
  const mid = EF.glTier !== 'high', reduced = EF.reduced;
  const renderer = new THREE.WebGLRenderer({ antialias: !mid, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(EF.dpr()); renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.className = 'rx-gl'; host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(38, 1, 0.05, 100);
  scene.add(new THREE.AmbientLight(0x8a96b8, 1.3));
  const key = new THREE.DirectionalLight(0xfff0dc, 2.0); key.position.set(-3, 6, 4); scene.add(key);
  const rimO = new THREE.PointLight(0xff9a3c, 10, 12); rimO.position.set(2.4, 1.2, -1.5); scene.add(rimO);
  const rimT = new THREE.PointLight(0x3fe0c8, 8, 12); rimT.position.set(-2.4, 1.0, 1.5); scene.add(rimT);

  /* 全息台:发光圆盘 + 刻度环(着色器) */
  const deckU = { uT: { value: 0 } };
  const deck = new THREE.Mesh(new THREE.CircleGeometry(2.6, 96), new THREE.ShaderMaterial({
    uniforms: deckU, transparent: true, depthWrite: false,
    vertexShader: 'varying vec2 vU; void main(){ vU=position.xy; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: `uniform float uT; varying vec2 vU;
      void main(){ float r=length(vU), a=atan(vU.y,vU.x);
        float ring=smoothstep(.02,0.,abs(r-2.45))+smoothstep(.015,0.,abs(r-1.9))*.7+smoothstep(.012,0.,abs(r-1.05))*.5;
        float tick=step(.96,fract(a*24./6.2832))*smoothstep(.12,0.,abs(r-2.2));
        float sweep=pow(max(0.,cos(a-uT*.6)),24.)*smoothstep(2.5,1.2,r)*.35;
        float grid=(step(.97,fract(vU.x*3.))+step(.97,fract(vU.y*3.)))*.05*smoothstep(2.6,.5,r);
        vec3 o=vec3(1.,.6,.24), t=vec3(.25,.88,.78);
        vec3 c=o*(ring+tick*.8)+t*(sweep+grid)+t*.06*smoothstep(2.6,0.,r);
        gl_FragColor=vec4(c,clamp(ring+tick+sweep+grid+.08*smoothstep(2.6,0.,r),0.,1.)); }` }));
  deck.rotation.x = -Math.PI / 2; scene.add(deck);
  /* 两圈立体光环(A 方案标志) */
  const ringO = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.018, 8, 160), new THREE.MeshBasicMaterial({ color: 0xff9a3c, transparent: true, opacity: 0.85 }));
  const ringT = new THREE.Mesh(new THREE.TorusGeometry(1.7, 0.012, 8, 140), new THREE.MeshBasicMaterial({ color: 0x3fe0c8, transparent: true, opacity: 0.7 }));
  ringO.rotation.x = Math.PI / 2 + 0.18; ringO.position.y = 0.9; ringT.rotation.x = Math.PI / 2 - 0.22; ringT.position.y = 1.4; scene.add(ringO, ringT);

  /* 烧杯:玻璃壁 + 液体 + 液面 */
  const BH = 1.5, BR = 0.62, LV = 0.95;
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(BR, BR * 0.96, BH, 64, 1, true), new THREE.MeshStandardMaterial({ color: 0xcfe8ff, transparent: true, opacity: 0.16, roughness: 0.05, metalness: 0.1, side: THREE.DoubleSide, depthWrite: false }));
  glass.position.y = BH / 2 + 0.02; scene.add(glass);
  const lip = new THREE.Mesh(new THREE.TorusGeometry(BR, 0.02, 8, 64), new THREE.MeshStandardMaterial({ color: 0xe8f4ff, transparent: true, opacity: 0.5 }));
  lip.rotation.x = Math.PI / 2; lip.position.y = BH + 0.02; scene.add(lip);
  const liqMat = new THREE.MeshStandardMaterial({ color: 0xcfe3ff, transparent: true, opacity: 0.62, roughness: 0.25, depthWrite: false });
  const liq = new THREE.Mesh(new THREE.CylinderGeometry(BR * 0.95, BR * 0.92, LV, 48), liqMat); liq.position.y = LV / 2 + 0.04; scene.add(liq);
  const top = new THREE.Mesh(new THREE.CircleGeometry(BR * 0.95, 48), new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.25, roughness: 0.1 }));
  top.rotation.x = -Math.PI / 2; top.position.y = LV + 0.045; scene.add(top);
  const glowB = glowSprite([[0, 'rgba(255,154,60,.55)'], [1, 'rgba(255,154,60,0)']], 3.2, 0.35); glowB.position.y = 0.3; scene.add(glowB);

  /* 气泡与沉淀:InstancedMesh */
  const NB = mid ? 70 : 140, NP = mid ? 90 : 180, dummy = new THREE.Object3D();
  const bubMat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.55, roughness: 0.05 });
  const bub = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 10, 8), bubMat, NB); scene.add(bub);
  const pptMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, transparent: true, opacity: 0.9 });
  const ppt = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), pptMat, NP); scene.add(ppt);
  const B = [], Pp = [];
  for (let i = 0; i < NB; i++) B.push({ x: 0, y: -9, z: 0, v: 0, r: 0 });
  for (let i = 0; i < NP; i++) Pp.push({ x: 0, y: -9, z: 0, v: 0, r: 0, s: 0 });
  function hide(m, n) { dummy.position.set(0, -9, 0); dummy.scale.setScalar(0.0001); dummy.updateMatrix(); for (let i = 0; i < n; i++) m.setMatrixAt(i, dummy.matrix); m.instanceMatrix.needsUpdate = true; }
  hide(bub, NB); hide(ppt, NP);
  /* 热浪:烧杯外的光晕 */
  const heat = glowSprite([[0, 'rgba(255,255,255,.9)'], [0.4, 'rgba(255,255,255,.35)'], [1, 'rgba(255,255,255,0)']], 2.8, 0); heat.position.y = 0.75; scene.add(heat);
  /* 全息粒子(上升的光点) */
  const NS = mid ? 120 : 260, sp = new Float32Array(NS * 3);
  for (let i = 0; i < NS; i++) { const a = Math.random() * 6.283, r = 1.8 + Math.random() * 0.7; sp[i * 3] = Math.cos(a) * r; sp[i * 3 + 1] = Math.random() * 2.4; sp[i * 3 + 2] = Math.sin(a) * r; }
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  const sparks = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffc27a, size: 0.035, transparent: true, opacity: 0.7, depthWrite: false, blending: THREE.AdditiveBlending })); scene.add(sparks);

  const S = { c0: new THREE.Color(0xcfe3ff), c1: new THREE.Color(0xcfe3ff), t: 1, gas: 0, ppt: 0, heat: 0, hcol: new THREE.Color(1, 0.4, 0.2), pc: new THREE.Color(1, 1, 1), settle: 0 };
  let yaw = 0.5, pitch = 0.42, drag = null, dist = 5.4;
  function rs() { const w = host.clientWidth || 1, h = host.clientHeight || 1; renderer.setSize(w, h, false); cam.aspect = w / h; dist = w / h < 1 ? 7.4 : 5.4; cam.updateProjectionMatrix(); }
  rs(); const ro = window.ResizeObserver ? new ResizeObserver(rs) : null; ro && ro.observe(host);
  const el = renderer.domElement;
  el.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY, a: yaw, b: pitch }; el.setPointerCapture(e.pointerId); });
  el.addEventListener('pointermove', e => { if (!drag) return; yaw = drag.a - (e.clientX - drag.x) * 0.008; pitch = Math.max(0.12, Math.min(0.95, drag.b + (e.clientY - drag.y) * 0.005)); });
  el.addEventListener('pointerup', () => { drag = null; });

  let alive = true, last = performance.now(), T = 0;
  function frame(now) {
    if (!alive) return; requestAnimationFrame(frame);
    if (document.hidden || !host.isConnected) { last = now; if (!host.isConnected) api.destroy(); return; }
    const dt = Math.min(0.05, (now - last) / 1000); last = now; T += dt;
    if (!drag && !reduced) yaw += dt * 0.08;
    cam.position.set(Math.sin(yaw) * Math.cos(pitch) * dist, 0.7 + Math.sin(pitch) * dist, Math.cos(yaw) * Math.cos(pitch) * dist); cam.lookAt(0, 0.65, 0);
    deckU.uT.value = T; ringO.rotation.z = T * 0.25; ringT.rotation.z = -T * 0.35;
    if (!reduced) { const a = sg.attributes.position.array; for (let i = 0; i < NS; i++) { a[i * 3 + 1] += dt * (0.12 + (i % 5) * 0.04); if (a[i * 3 + 1] > 2.6) a[i * 3 + 1] = 0; } sg.attributes.position.needsUpdate = true; }
    /* 颜色渐变 */
    S.t = Math.min(1, S.t + dt / (reduced ? 0.01 : 2.4)); liqMat.color.copy(S.c0).lerp(S.c1, S.t); top.material.color.copy(liqMat.color).lerp(new THREE.Color(1, 1, 1), 0.4);
    /* 气泡 */
    for (let i = 0; i < NB; i++) { const b = B[i];
      if (b.y < -1 || b.y > LV + 0.05) { if (S.gas > 0 && Math.random() < S.gas * 0.12) { const a = Math.random() * 6.283, r = Math.random() * BR * 0.8; b.x = Math.cos(a) * r; b.z = Math.sin(a) * r; b.y = 0.06; b.v = 0.35 + Math.random() * 0.5; b.r = 0.012 + Math.random() * 0.03; } else { b.y = -9; } }
      else { b.y += b.v * dt; b.x += Math.sin(T * 6 + i) * 0.002; b.r *= 1.002; }
      dummy.position.set(b.x, b.y, b.z); dummy.scale.setScalar(b.y < -1 ? 0.0001 : b.r); dummy.updateMatrix(); bub.setMatrixAt(i, dummy.matrix); }
    bub.instanceMatrix.needsUpdate = true;
    /* 沉淀:从液体中部生成,缓慢下落堆积 */
    for (let i = 0; i < NP; i++) { const p = Pp[i];
      if (p.y < -1) { if (S.ppt > 0 && Math.random() < S.ppt * 0.05) { const a = Math.random() * 6.283, r = Math.random() * BR * 0.85; p.x = Math.cos(a) * r; p.z = Math.sin(a) * r; p.y = 0.3 + Math.random() * 0.6; p.v = 0.05 + Math.random() * 0.12; p.s = 0.012 + Math.random() * 0.022; p.rest = 0.06 + Math.random() * 0.06; } }
      else if (p.y > p.rest) p.y -= p.v * dt;
      dummy.position.set(p.x, p.y, p.z); dummy.rotation.set(i, i * 2, 0); dummy.scale.setScalar(p.y < -1 ? 0.0001 : p.s); dummy.updateMatrix(); ppt.setMatrixAt(i, dummy.matrix); }
    ppt.instanceMatrix.needsUpdate = true;
    /* 热 */
    heat.material.color.copy(S.hcol); heat.material.opacity += ((S.heat ? 0.55 + 0.15 * Math.sin(T * 3) : 0) - heat.material.opacity) * Math.min(1, dt * 3);
    glowB.material.opacity = 0.25 + 0.1 * Math.sin(T * 1.3);
    renderer.render(scene, cam);
  }
  requestAnimationFrame(frame);

  const api = {
    run(r, o = {}) {
      const v = r.viz || {}, ob = r.obs || {}, quiet = !!o.quiet;
      S.c0.set(v.c0 || '#cfe3ff'); S.c1.set(v.c1 || v.c0 || '#cfe3ff'); S.t = 0;
      S.gas = quiet ? 0 : ob.g ? 1 : 0;
      for (const p of Pp) p.y = -9; S.ppt = quiet ? 0 : ob.p ? 1 : 0; if (v.p) pptMat.color.set(v.p);
      S.heat = quiet ? 0 : ob.h ? 1 : 0; S.hcol.set(ob.h === 'endo' ? 0x5fb4ff : 0xff5a2a);
      bubMat.color.set(v.g || '#ffffff'); bubMat.opacity = v.g && v.g !== '#ffffff' ? 0.8 : 0.55;
      if (reduced) { S.t = 1; }
      clearTimeout(api._h); api._h = setTimeout(() => { S.gas *= 0.35; S.ppt = 0; }, 9000);
    },
    reset() { S.c0.set('#cfe3ff'); S.c1.set('#cfe3ff'); S.t = 1; S.gas = S.ppt = S.heat = 0; for (const p of Pp) p.y = -9; },
    destroy() { if (!alive) return; alive = false; ro && ro.disconnect(); renderer.dispose(); renderer.forceContextLoss && renderer.forceContextLoss(); el.remove(); }
  };
  return api;
}
