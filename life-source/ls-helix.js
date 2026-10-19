// 生命源码 · 双螺旋组件(WebGL / Three.js)
// 科学约定:B 型 DNA,右手螺旋;直径约 2 nm,每圈约 10.5 bp,每对上升约 0.34 nm(螺距约 3.4 nm);
// 两条骨架相位差约 150°,形成大沟与小沟;配色为伪彩(分子本身没有颜色)。
// 场景单位 = 纳米。
import * as THREE from './vendor/three.module.min.js';
import { BASE_COLOR, COMP, isPair, sound, reducedMotion } from './ls.js';

export const BDNA = { radius: 1.0, rise: 0.34, bpPerTurn: 10.5, strandOffsetDeg: 150 };
const TWIST = (2 * Math.PI) / BDNA.bpPerTurn;
const OFFSET = THREE.MathUtils.degToRad(BDNA.strandOffsetDeg);
const UP = new THREE.Vector3(0, 1, 0);

// 右手螺旋:沿 +y 上升时按右手定则绕 +y 旋转(z→x 方向)。(r cosθ, y, -r sinθ)
export function helixPoint(i, phase = 0, n = 0) {
  const t = i * TWIST + phase, y = (i - (n - 1) / 2) * BDNA.rise;
  return new THREE.Vector3(BDNA.radius * Math.cos(t), y, -BDNA.radius * Math.sin(t));
}

function rod(a, b, radius, mat) {
  const d = new THREE.Vector3().subVectors(b, a), len = d.length();
  const m = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, len, 10, 1), mat);
  m.position.copy(a).addScaledVector(d, .5);
  m.quaternion.setFromUnitVectors(UP, d.normalize());
  return m;
}

export function createHelix(container, opts = {}) {
  const o = { seq: 'ATGGTGCACCTGACTCCTGAGGAGAAG', comp: null, spin: true, tilt: .32, distance: 9, onPick: null, ...opts };
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.domElement.className = 'ls-gl';
  container.append(renderer.domElement);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x060a12, .045);
  const camera = new THREE.PerspectiveCamera(40, 1, .05, 200);
  camera.position.set(0, 0, o.distance);
  scene.add(new THREE.AmbientLight(0x88ffd0, .55));
  const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(4, 6, 8); scene.add(key);
  const rim = new THREE.PointLight(0x34d399, 30, 30); rim.position.set(-5, -2, -4); scene.add(rim);

  const root = new THREE.Group(); root.rotation.z = o.tilt; scene.add(root);
  const helix = new THREE.Group(); root.add(helix);

  // 背景微粒
  {
    const g = new THREE.BufferGeometry(), N = 600, p = new Float32Array(N * 3);
    for (let i = 0; i < N * 3; i++) p[i] = (Math.random() - .5) * 60;
    g.setAttribute('position', new THREE.BufferAttribute(p, 3));
    scene.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0x6ee7b7, size: .06, transparent: true, opacity: .5 })));
  }

  const backboneMat = new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x065f46, emissiveIntensity: .9, roughness: .35, metalness: .1 });
  const phosMat = new THREE.MeshStandardMaterial({ color: 0xa7f3d0, emissive: 0x34d399, emissiveIntensity: .6, roughness: .3 });
  const hbMat = new THREE.MeshBasicMaterial({ color: 0xfff7d6 });
  const baseMats = {};
  for (const [b, c] of Object.entries(BASE_COLOR)) baseMats[b] = new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: .25, roughness: .45 });

  let rungs = [], seq = '', comp = '', selected = -1;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.25, .035, 8, 48), new THREE.MeshBasicMaterial({ color: 0xe2be78 }));
  ring.rotation.x = Math.PI / 2; ring.visible = false; helix.add(ring);

  function clear() {
    for (const c of [...helix.children]) if (c !== ring) { helix.remove(c); c.traverse(x => x.geometry && x.geometry.dispose()); }
    rungs = [];
  }

  function build() {
    clear();
    const n = seq.length;
    const s1 = [], s2 = [];
    for (let i = 0; i < n; i++) { s1.push(helixPoint(i, 0, n)); s2.push(helixPoint(i, OFFSET, n)); }
    for (const pts of [s1, s2]) {
      if (n > 1) helix.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), n * 8, .1, 10, false), backboneMat));
      const inst = new THREE.InstancedMesh(new THREE.SphereGeometry(.15, 14, 10), phosMat, n);
      const m = new THREE.Matrix4(); pts.forEach((p, i) => inst.setMatrixAt(i, m.makeTranslation(p.x, p.y, p.z)));
      helix.add(inst);
    }
    for (let i = 0; i < n; i++) {
      const a = s1[i], b = s2[i], mid = new THREE.Vector3().addVectors(a, b).multiplyScalar(.5);
      const ok = isPair(seq[i], comp[i]);
      const g = new THREE.Group(); g.userData.index = i;
      const gap = ok ? 0 : .22; // 错配:两半对不上,中间留缝
      const da = new THREE.Vector3().subVectors(mid, a).normalize();
      const r1 = rod(a, mid.clone().addScaledVector(da, -gap), .085, baseMats[seq[i]] || baseMats.A);
      const r2 = rod(b, mid.clone().addScaledVector(da, gap), .085, baseMats[comp[i]] || baseMats.A);
      r1.userData.index = r2.userData.index = i;
      g.add(r1, r2);
      if (ok) { // 氢键:A–T 2 根,G–C 3 根
        const k = (seq[i] === 'G' || seq[i] === 'C') ? 3 : 2;
        const side = new THREE.Vector3().crossVectors(da, UP).normalize();
        for (let j = 0; j < k; j++) {
          const dot = new THREE.Mesh(new THREE.SphereGeometry(.035, 6, 6), hbMat);
          dot.position.copy(mid).addScaledVector(side, (j - (k - 1) / 2) * .09).addScaledVector(UP, .06);
          g.add(dot);
        }
      }
      helix.add(g); rungs.push(g);
    }
    select(-1);
  }

  function setSequence(s, c = null) {
    seq = s.toUpperCase().replace(/[^ACGT]/g, '');
    comp = (c || [...seq].map(b => COMP[b]).join('')).toUpperCase();
    build();
  }

  function select(i) {
    selected = i;
    rungs.forEach((g, j) => g.children.forEach(m => { if (m.material && m.material.emissiveIntensity !== undefined && m.material !== hbMat) m.scale.setScalar(j === i ? 1.5 : 1); }));
    if (i >= 0 && rungs[i]) {
      const n = seq.length, y = (i - (n - 1) / 2) * BDNA.rise;
      ring.position.set(0, y, 0); ring.visible = true;
    } else ring.visible = false;
  }

  // ---- 交互:拖动旋转、点选碱基对 ----
  let spin = o.spin && !reducedMotion(), dragging = false, lastX = 0, lastY = 0, moved = 0, vel = 0;
  const el = renderer.domElement, ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
  el.addEventListener('pointerdown', e => { dragging = true; moved = 0; lastX = e.clientX; lastY = e.clientY; el.setPointerCapture(e.pointerId); });
  el.addEventListener('pointermove', e => {
    if (!dragging) return;
    const dx = e.clientX - lastX, dy = e.clientY - lastY; moved += Math.abs(dx) + Math.abs(dy);
    helix.rotation.y += dx * .01; vel = dx * .01;
    root.rotation.x = THREE.MathUtils.clamp(root.rotation.x + dy * .005, -.8, .8);
    lastX = e.clientX; lastY = e.clientY;
  });
  el.addEventListener('pointerup', e => {
    dragging = false;
    if (moved > 6) return;
    const r = el.getBoundingClientRect();
    ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ptr, camera);
    const hit = ray.intersectObjects(rungs, true).find(h => h.object.userData.index !== undefined);
    if (hit) { const i = hit.object.userData.index; select(i); sound.pair(seq[i], comp[i]); o.onPick && o.onPick(i, seq[i], comp[i]); }
  });

  // ---- 渲染循环(不可见时暂停)----
  let running = true, raf = 0, last = performance.now();
  function frame(t) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(.05, (t - last) / 1000); last = t;
    if (!running) return;
    if (!dragging) { if (spin) helix.rotation.y += dt * .35; helix.rotation.y += vel; vel *= .92; }
    renderer.render(scene, camera);
  }
  raf = requestAnimationFrame(frame);
  const vis = new IntersectionObserver(([en]) => { running = en.isIntersecting; }); vis.observe(el);
  document.addEventListener('visibilitychange', () => { running = !document.hidden; });

  function resize() {
    const w = container.clientWidth || 1, h = container.clientHeight || 1;
    renderer.setSize(w, h, false); camera.aspect = w / h;
    // 让整段螺旋落在视野内(竖屏同样适用)
    const len = Math.max(4, seq.length * BDNA.rise) + 2;
    const tilt = camera.aspect < 1 ? o.tilt * .4 : o.tilt; root.rotation.z = tilt;
    const tf = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const fitH = (len * Math.cos(tilt) / 2 + 1) / tf * 1.05;
    const fitW = (len * Math.sin(tilt) / 2 + 1.6) / (tf * camera.aspect) * 1.05;
    camera.position.z = Math.max(o.distance, fitH, fitW);
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(container);

  // 碱基钢琴:逐对点亮并发声
  async function play({ tempo = 3 } = {}) {
    for (let i = 0; i < seq.length; i++) {
      select(i); sound.pair(seq[i], comp[i]);
      await new Promise(r => setTimeout(r, 1000 / tempo));
    }
    select(-1);
  }

  setSequence(o.seq, o.comp); resize();
  return {
    THREE, scene, camera, renderer, helix, root,
    setSequence, select, play,
    get seq() { return seq; }, get comp() { return comp; },
    setSpin(v) { spin = v && !reducedMotion(); },
    setTilt(v) { root.rotation.z = v; },
    dispose() { cancelAnimationFrame(raf); vis.disconnect(); clear(); renderer.dispose(); el.remove(); },
  };
}
