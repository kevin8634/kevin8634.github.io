/* 元素工坊 Element Forge · 分子搭建台 3D 球棍视图 ef-molecule3d.js v2.2
   由 molecule/index.html 在中/高档按需 import;低档不加载(2D 球棍 / 结构式 / 电子式功能不减)。
   3D 坐标:由 2D 草图出发做简单力导向(键长弹簧 + 1-3 距离弹簧近似键角 + 非键排斥),只为直观,不代表精确构象【示意】。
   材质:CPK 色 PBR 球 + 黄铜键,studioEnv 环境反射;拖拽旋转、闲置自转(减少动态时不自转)。 */
import { THREE } from './ef-gl.js?v=2';
import { studioEnv, M as PBR } from './ef-pbr.js?v=1';
const EF = window.EF;
const COL = { H: '#f2f2ee', C: '#4a4d52', N: '#3b6fe0', O: '#e0322b', S: '#e8c832', F: '#8fe07a', Cl: '#3fbf4a', Br: '#a8402a' };
const RAD = { H: 0.25, C: 0.38, N: 0.36, O: 0.35, S: 0.45, F: 0.3, Cl: 0.43, Br: 0.47 };
const LEN = { H: 0.75, C: 1.0, N: 0.98, O: 0.96, S: 1.25, F: 0.95, Cl: 1.2, Br: 1.3 };

export function mountMol3D(host) {
  const renderer = new THREE.WebGLRenderer({ antialias: EF.glTier === 'high', alpha: true });
  renderer.setPixelRatio(EF.dpr()); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const cvs = renderer.domElement; cvs.className = 'mb-gl'; cvs.setAttribute('aria-hidden', 'true'); host.appendChild(cvs);
  const scene = new THREE.Scene(); try { scene.environment = studioEnv(renderer); } catch (e) {}
  const cam = new THREE.PerspectiveCamera(35, 1, 0.1, 100); cam.position.set(0, 0.6, 9);
  scene.add(new THREE.HemisphereLight(0xfff0dc, 0x1a1410, 1.1));
  const key = new THREE.DirectionalLight(0xffe2b0, 2.2); key.position.set(-3, 5, 4); scene.add(key);
  const rim = new THREE.PointLight(0xff9a3c, 8, 20); rim.position.set(3, -1, -3); scene.add(rim);
  const root = new THREE.Group(); scene.add(root);
  const mats = {}; const mat = e => mats[e] || (mats[e] = new THREE.MeshPhysicalMaterial({ color: COL[e], roughness: 0.28, metalness: 0.02, clearcoat: 0.9, clearcoatRoughness: 0.15 }));
  const bondMat = PBR.brass ? PBR.brass({ roughness: 0.28 }) : new THREE.MeshStandardMaterial({ color: '#b08a4a', metalness: 1, roughness: 0.3 });
  const sph = new THREE.SphereGeometry(1, 32, 24), cyl = new THREE.CylinderGeometry(0.07, 0.07, 1, 16);
  let rx = 0.35, ry = 0, drag = null, idle = 0, raf = 0, W = 0, H = 0, alive = true;

  function layout(mol) {
    const n = mol.atoms.length; if (!n) return [];
    const cx = mol.atoms.reduce((s, a) => s + a.x, 0) / n, cy = mol.atoms.reduce((s, a) => s + a.y, 0) / n;
    const p = mol.atoms.map((a, i) => new THREE.Vector3((a.x - cx) / 62, -(a.y - cy) / 62, Math.sin(i * 2.399) * 0.4));
    const nb = mol.atoms.map(() => []); mol.bonds.forEach(b => { nb[b.a].push(b.b); nb[b.b].push(b.a); });
    const bl = (i, j, o) => (LEN[mol.atoms[i].e] + LEN[mol.atoms[j].e]) / 2 * (o === 2 ? 0.87 : o === 3 ? 0.78 : 1);
    const d = new THREE.Vector3();
    for (let it = 0; it < 300; it++) {
      const f = p.map(() => new THREE.Vector3());
      mol.bonds.forEach(b => { d.subVectors(p[b.b], p[b.a]); const L = d.length() || 1e-3, k = (L - bl(b.a, b.b, b.o)) * 0.5; d.multiplyScalar(k / L); f[b.a].add(d); f[b.b].sub(d); });
      /* 1-3 弹簧:按中心原子成键域数取理想键角(4 → 109.5°,3 → 120°,2 → 180° 或含孤对时更小,示意) */
      nb.forEach((ns, c) => {
        const e = mol.atoms[c].e, dom = ns.length + ({ N: 1, O: 2, S: 2 }[e] || 0) - mol.bonds.filter(b => (b.a === c || b.b === c) && b.o > 1).reduce((s, b) => s + b.o - 1, 0);
        const ang = dom >= 4 ? 1.911 : dom === 3 ? 2.094 : Math.PI;
        for (let a = 0; a < ns.length; a++) for (let b = a + 1; b < ns.length; b++) {
          const i = ns[a], j = ns[b], li = p[i].distanceTo(p[c]), lj = p[j].distanceTo(p[c]), tgt = Math.sqrt(li * li + lj * lj - 2 * li * lj * Math.cos(ang));
          d.subVectors(p[j], p[i]); const L = d.length() || 1e-3; d.multiplyScalar((L - tgt) * 0.25 / L); f[i].add(d); f[j].sub(d);
        }
      });
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) { d.subVectors(p[j], p[i]); const L = d.length() || 1e-3; if (L < 2.2) { d.multiplyScalar(-0.02 / (L * L * L)); f[i].add(d); f[j].sub(d); } }
      p.forEach((v, i) => v.add(f[i].clampLength(0, 0.2)));
    }
    const c = p.reduce((s, v) => s.add(v), new THREE.Vector3()).multiplyScalar(1 / n); p.forEach(v => v.sub(c));
    return p;
  }
  function set(mol) {
    root.clear(); const p = layout(mol);
    mol.atoms.forEach((a, i) => { const m = new THREE.Mesh(sph, mat(a.e)); m.scale.setScalar(RAD[a.e]); m.position.copy(p[i]); root.add(m); });
    const up = new THREE.Vector3(0, 1, 0), d = new THREE.Vector3(), nrm = new THREE.Vector3();
    mol.bonds.forEach(b => {
      const A = p[b.a], B = p[b.b]; d.subVectors(B, A); const L = d.length(); if (!L) return;
      nrm.crossVectors(d, Math.abs(d.y / L) > 0.9 ? new THREE.Vector3(1, 0, 0) : up).normalize();
      for (let k = 0; k < b.o; k++) {
        const off = (k - (b.o - 1) / 2) * 0.17, m = new THREE.Mesh(cyl, bondMat);
        m.scale.set(1, L, 1); m.position.copy(A).addScaledVector(d, 0.5).addScaledVector(nrm, off);
        m.quaternion.setFromUnitVectors(up, d.clone().normalize()); root.add(m);
      }
    });
    const r = p.reduce((s, v) => Math.max(s, v.length()), 1); cam.position.set(0, 0.4, Math.max(6, r * 3.4)); cam.lookAt(0, 0, 0);
    draw();
  }
  function rs() { const b = host.getBoundingClientRect(); W = b.width; H = b.height; renderer.setSize(W, H, false); cam.aspect = W / Math.max(1, H); cam.updateProjectionMatrix(); draw(); }
  function draw() { root.rotation.set(rx, ry, 0); renderer.render(scene, cam); }
  function loop(t) { if (!alive) return; if (!cvs.isConnected) { alive = false; renderer.dispose(); return; } raf = requestAnimationFrame(loop); if (document.hidden || cvs.style.display === 'none') return; if (!drag && !EF.reduced && t - idle > 1500) ry += 0.006; draw(); }
  cvs.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY, rx, ry }; cvs.setPointerCapture(e.pointerId); });
  cvs.addEventListener('pointermove', e => { if (!drag) return; ry = drag.ry + (e.clientX - drag.x) * 0.01; rx = Math.max(-1.4, Math.min(1.4, drag.rx + (e.clientY - drag.y) * 0.01)); });
  cvs.addEventListener('pointerup', e => { drag = null; idle = performance.now(); });
  const ro = window.ResizeObserver ? new ResizeObserver(rs) : null; ro ? ro.observe(host) : addEventListener('resize', rs); rs();
  raf = requestAnimationFrame(loop);
  return { set, show(on) { cvs.style.display = on ? 'block' : 'none'; if (on) rs(); }, stop() { alive = false; cancelAnimationFrame(raf); ro && ro.disconnect(); renderer.dispose(); cvs.remove(); } };
}
