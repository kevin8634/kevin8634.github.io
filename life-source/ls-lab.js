// 生命源码 · v0.9 全息实验台(共用骨架的 3D 层与拖拽工具)
// 中央底座:全息圆台 + 旋转刻度环 + 上升光点(Three.js r169,本地 vendor)。
// 低画质 / 无 WebGL:只留 CSS 光晕,功能不变;减少动态效果:只画一帧;页面隐藏时暂停。
import { tier, pixelRatio, particleScale, reducedMotion, visible } from './ls-scene.js';

export async function mountBench(host, color = '#34d399') {
  const cv = document.createElement('canvas'); cv.className = 'lab-bench'; cv.setAttribute('aria-hidden', 'true');
  host.prepend(cv);
  if (tier() === 'low') { cv.remove(); host.classList.add('lab-flat'); return { dispose() {} }; }
  let THREE;
  try { THREE = await import('./vendor/three.module.min.js'); } catch { cv.remove(); host.classList.add('lab-flat'); return { dispose() {} }; }
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas: cv, alpha: true, antialias: tier() === 'high', powerPreference: 'low-power' }); }
  catch { cv.remove(); host.classList.add('lab-flat'); return { dispose() {} }; }
  renderer.setPixelRatio(pixelRatio());
  const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(32, 1, .1, 100);
  cam.position.set(0, 3.3, 7.2); cam.lookAt(0, .2, 0);
  const C = new THREE.Color(color), G = new THREE.Color('#e2be78');
  const add = (geo, col, op) => { const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: op, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending })); m.rotation.x = -Math.PI / 2; scene.add(m); return m; };
  // 底座:实心微光盘 + 三道环 + 刻度环
  add(new THREE.CircleGeometry(2.6, 96), C, .07);
  const r1 = add(new THREE.RingGeometry(2.55, 2.62, 128), C, .85);
  const r2 = add(new THREE.RingGeometry(2.05, 2.08, 128), C, .45);
  const r3 = add(new THREE.RingGeometry(2.85, 2.87, 128, 1, 0, Math.PI * 1.35), G, .55);
  const ticks = new THREE.Group(); scene.add(ticks);
  const tg = new THREE.PlaneGeometry(.03, .16), tm = new THREE.MeshBasicMaterial({ color: C, transparent: true, opacity: .55, depthWrite: false, blending: THREE.AdditiveBlending });
  for (let i = 0; i < 72; i++) { const t = new THREE.Mesh(tg, tm); const a = i / 72 * Math.PI * 2; t.position.set(Math.cos(a) * 2.32, 0, Math.sin(a) * 2.32); t.rotation.x = -Math.PI / 2; t.rotation.z = -a; if (i % 6 === 0) t.scale.y = 2; ticks.add(t); }
  // 上升光点
  const N = Math.round(260 * particleScale()), pos = new Float32Array(N * 3), spd = new Float32Array(N);
  for (let i = 0; i < N; i++) { const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * 2.5; pos.set([Math.cos(a) * r, Math.random() * 3, Math.sin(a) * r], i * 3); spd[i] = .15 + Math.random() * .35; }
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(pg, new THREE.PointsMaterial({ color: C, size: .045, transparent: true, opacity: .75, depthWrite: false, blending: THREE.AdditiveBlending }));
  scene.add(pts);
  // 光柱
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.6, 2.6, 64, 1, true), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
    uniforms: { c: { value: C } },
    vertexShader: 'varying float h;void main(){h=position.y/2.6+.5;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: 'uniform vec3 c;varying float h;void main(){gl_FragColor=vec4(c,(1.-h)*(1.-h)*.12);}',
  }));
  beam.position.y = 1.3; scene.add(beam);

  const size = () => { const w = cv.clientWidth, h = cv.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); };
  const ro = new ResizeObserver(size); ro.observe(cv); size();
  let raf = 0, last = performance.now(), dead = false;
  const frame = now => {
    if (dead) return;
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    if (visible()) {
      r3.rotation.z += dt * .25; ticks.rotation.y -= dt * .06; r2.rotation.z -= dt * .1;
      const p = pg.attributes.position.array;
      for (let i = 0; i < N; i++) { p[i * 3 + 1] += spd[i] * dt; if (p[i * 3 + 1] > 3) p[i * 3 + 1] = 0; }
      pg.attributes.position.needsUpdate = true;
      r1.material.opacity = .7 + Math.sin(now / 900) * .15;
      renderer.render(scene, cam);
    }
    raf = requestAnimationFrame(frame);
  };
  if (reducedMotion()) { size(); renderer.render(scene, cam); } else raf = requestAnimationFrame(frame);
  const onTier = () => location.reload();
  addEventListener('ls-tier', onTier);
  return { dispose() { dead = true; cancelAnimationFrame(raf); ro.disconnect(); removeEventListener('ls-tier', onTier); renderer.dispose(); cv.remove(); } };
}

/** 工具拖拽:按住工具拖到目标上松手 = 使用;只点一下照常触发 click。
 *  target 可以是元素或返回元素的函数。返回 dispose。 */
export function dragTool(btn, target, onDrop) {
  btn.classList.add('lab-drag');
  let sx = 0, sy = 0, ghost = null, moved = false, id = null;
  const tgt = () => (typeof target === 'function' ? target() : target);
  const over = (x, y) => { const t = tgt(); if (!t) return false; const r = t.getBoundingClientRect(); return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom; };
  const down = e => { if (e.button > 0) return; id = e.pointerId; sx = e.clientX; sy = e.clientY; moved = false; try { btn.setPointerCapture(id); } catch {} };
  const move = e => {
    if (e.pointerId !== id) return;
    if (!moved && Math.hypot(e.clientX - sx, e.clientY - sy) > 8) {
      moved = true;
      ghost = btn.cloneNode(true); ghost.className = btn.className + ' lab-ghost'; ghost.removeAttribute('id');
      document.body.append(ghost); btn.classList.add('lab-lift');
    }
    if (moved) {
      e.preventDefault();
      ghost.style.transform = `translate(${e.clientX - 26}px,${e.clientY - 26}px)`;
      tgt()?.classList.toggle('lab-hot', over(e.clientX, e.clientY));
    }
  };
  const up = e => {
    if (e.pointerId !== id) return; id = null;
    if (!moved) return;
    const hit = over(e.clientX, e.clientY);
    ghost?.remove(); ghost = null; btn.classList.remove('lab-lift'); tgt()?.classList.remove('lab-hot');
    btn.dataset.dragged = '1'; setTimeout(() => delete btn.dataset.dragged, 0);
    if (hit) onDrop();
  };
  const click = e => { if (btn.dataset.dragged) { e.stopImmediatePropagation(); e.preventDefault(); } };
  btn.addEventListener('pointerdown', down); btn.addEventListener('pointermove', move);
  btn.addEventListener('pointerup', up); btn.addEventListener('pointercancel', up);
  btn.addEventListener('click', click, true);
  btn.style.touchAction = 'none';
  return () => { ghost?.remove(); };
}
