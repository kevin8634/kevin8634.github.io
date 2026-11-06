/* 元素工坊 Element Forge · 镜像分子 3D 镜子视图 ef-mirror3d.js v2.4.1
   由 molecule/index.html 第 5 关「照镜子」在中/高档按需 import;低档或加载失败时沿用 Canvas 2D(功能不减)。
   只负责画:手性碳 + 四个基团的 PBR 球棍、黄铜键、玻璃镜面与倒影地面;
   转动、打分、对齐(snap)仍由页面里的 Mirror() 计算,这里按它给的坐标渲染,并把每个球的屏幕位置交回去画标签和对位圈。
   坐标系与 2D 版一致:x 向右、y 向上、z 朝向观众。四面体为理想 109.5°,示意。 */
import { THREE } from './ef-gl.js?v=3';
import { studioEnv, M as PBR } from './ef-pbr.js?v=1';
const EF = window.EF;

export function mountMirror3D(box) {
  const renderer = new THREE.WebGLRenderer({ antialias: EF.glTier === 'high', alpha: true });
  renderer.setPixelRatio(EF.dpr()); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  const cvs = renderer.domElement; cvs.className = 'cx-gl'; cvs.setAttribute('aria-hidden', 'true'); box.insertBefore(cvs, box.firstChild);
  const scene = new THREE.Scene(); try { scene.environment = studioEnv(renderer); } catch (e) {}
  const cam = new THREE.PerspectiveCamera(30, 1, 0.1, 100); cam.position.set(0, 0.35, 12); cam.lookAt(0, 0, 0);
  scene.add(new THREE.HemisphereLight(0xdff4ff, 0x10161c, 1.0));
  const key = new THREE.DirectionalLight(0xfff0d8, 2.4); key.position.set(-4, 6, 6); scene.add(key);
  const teal = new THREE.PointLight(0x5ff0dc, 10, 18); teal.position.set(0, 1.5, 1.2); scene.add(teal);
  const warm = new THREE.PointLight(0xff9a3c, 6, 20); warm.position.set(-5, -2, -3); scene.add(warm);

  /* 镜面:半透明玻璃板 + 发光边 */
  const mirror = new THREE.Group(); scene.add(mirror);
  const glass = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1, 1), new THREE.MeshPhysicalMaterial({ color: 0xbfe9ff, roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.22, clearcoat: 1, side: THREE.DoubleSide, depthWrite: false }));
  mirror.add(glass);
  const edgeMat = new THREE.MeshBasicMaterial({ color: 0x9ff3ff, transparent: true, opacity: 0.75 });
  const edgeT = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.025, 1), edgeMat), edgeB = edgeT.clone(); mirror.add(edgeT, edgeB);
  /* 地面倒影:很淡的反光盘 */
  const floor = new THREE.Mesh(new THREE.CircleGeometry(1, 48), new THREE.MeshStandardMaterial({ color: 0x0c1a22, roughness: 0.35, metalness: 0.6, transparent: true, opacity: 0.55 }));
  floor.rotation.x = -Math.PI / 2; scene.add(floor);

  const sph = new THREE.SphereGeometry(1, 40, 28), cyl = new THREE.CylinderGeometry(1, 1, 1, 18);
  const mats = {}; const mat = c => mats[c] || (mats[c] = new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.25, metalness: 0.02, clearcoat: 0.9, clearcoatRoughness: 0.12 }));
  const cMat = mat('#4a4d52');
  const bondMat = PBR.brass ? PBR.brass({ roughness: 0.26 }) : new THREE.MeshStandardMaterial({ color: '#c8a060', metalness: 1, roughness: 0.3 });
  function mol() {
    const g = new THREE.Group(), c = new THREE.Mesh(sph, cMat), balls = [], bonds = [];
    g.add(c);
    for (let j = 0; j < 4; j++) { const b = new THREE.Mesh(sph, cMat), k = new THREE.Mesh(cyl, bondMat); g.add(k, b); balls.push(b); bonds.push(k); }
    scene.add(g); return { g, c, balls, bonds };
  }
  const A = mol(), B = mol();
  const up = new THREE.Vector3(0, 1, 0), v = new THREE.Vector3(), tmp = new THREE.Vector3();
  let W = 1, H = 1, ppu = 1, halfH = 1, alive = true;
  function rs() { const r = box.getBoundingClientRect(); W = Math.max(1, r.width); H = Math.max(1, r.height); renderer.setSize(W, H, false); cam.aspect = W / H; cam.updateProjectionMatrix(); halfH = cam.position.z * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)); ppu = H / (2 * halfH); }
  rs();
  /* 像素 → 世界(z=0 平面) */
  const wx = px => (px - W / 2) / ppu, wy = py => (H / 2 - py) / ppu;
  function place(M, pts, cxPx, s, cols, labels) {
    const cx = wx(cxPx), cy = wy(H * 0.52), S = s / ppu;
    M.g.position.set(cx, cy, 0);
    M.c.scale.setScalar(S * 0.2);
    pts.forEach((p, j) => {
      const b = M.balls[j]; b.material = mat(cols[j]); b.scale.setScalar(S * (labels[j] === 'H' ? 0.15 : 0.21)); b.position.set(p[0] * S, p[1] * S, p[2] * S);
      const k = M.bonds[j]; v.set(p[0], p[1], p[2]).multiplyScalar(S); k.position.copy(v).multiplyScalar(0.5); k.scale.set(S * 0.045, v.length(), S * 0.045);
      k.quaternion.setFromUnitVectors(up, tmp.copy(v).normalize());
    });
  }
  function scr(x, y, z) { tmp.set(x, y, z).project(cam); return [(tmp.x + 1) / 2 * W, (1 - tmp.y) / 2 * H]; }
  /* Mirror() 每次重画时调用:a/b 为左右两组单位向量,cols/labels 为基团颜色和名字。返回每个球的屏幕坐标与半径,供 2D 叠层写字、画对位圈。 */
  function render(o) {
    if (!alive) return null;
    const r = box.getBoundingClientRect(); if (Math.abs(r.width - W) > 0.5 || Math.abs(r.height - H) > 0.5) rs();
    const s = o.s;
    place(A, o.a, W * 0.25, s, o.cols, o.labels); place(B, o.b, W * 0.75, s, o.cols, o.labels);
    const mh = (H * 0.84) / ppu; glass.scale.set(1, mh, s * 1.6 / ppu); edgeT.position.set(0, mh / 2, 0); edgeB.position.set(0, -mh / 2, 0); edgeT.scale.z = edgeB.scale.z = s * 1.6 / ppu;
    mirror.position.set(0, wy(H * 0.5), 0);
    floor.position.set(0, wy(H * 0.52) - s * 1.25 / ppu, 0); floor.scale.setScalar(W * 0.55 / ppu);
    renderer.render(scene, cam);
    const out = side => { const M = side ? B : A, P = side ? o.b : o.a, S = s / ppu, gp = M.g.position;
      return P.map((p, j) => { const c = scr(gp.x + p[0] * S, gp.y + p[1] * S, gp.z + p[2] * S), e = scr(gp.x + p[0] * S + S * (o.labels[j] === 'H' ? 0.15 : 0.21), gp.y + p[1] * S, gp.z + p[2] * S); return { x: c[0], y: c[1], r: Math.abs(e[0] - c[0]), z: p[2] }; }); };
    /* 把任意单位向量(在左边分子坐标系里)投到屏幕:用于在左边画"镜像转过来后落在哪"的对位圈 */
    const onLeft = p => { const S = s / ppu, gp = A.g.position, c = scr(gp.x + p[0] * S, gp.y + p[1] * S, gp.z + p[2] * S), e = scr(gp.x + p[0] * S + S * 0.27, gp.y + p[1] * S, gp.z + p[2] * S); return { x: c[0], y: c[1], r: Math.abs(e[0] - c[0]) }; };
    return { left: out(0), right: out(1), onLeft };
  }
  cvs.addEventListener('webglcontextlost', e => { e.preventDefault(); alive = false; cvs.remove(); box.classList.remove('gl'); });
  box.classList.add('gl');
  return { render, stop() { alive = false; renderer.dispose(); cvs.remove(); box.classList.remove('gl'); }, get alive() { return alive; } };
}
