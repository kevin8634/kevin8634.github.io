/* 元素工坊 Element Forge · 写实材质库 ef-pbr.js v2.2
   全部程序生成(无外部贴图/模型):工作室环境光(PMREM)、旧黄铜、拉丝钢、白陶瓷、玻璃、黑石、铜/铝、霜。
   颜色与 data/ef.colors.json 同值(tools/colors_check.py 校验两处一致)。 */
import * as THREE from './vendor/three.module.min.js';

export const COL = {
  guides: { oga: '#ffb35c', bucky: '#ffd27a', dot: '#ff7ad9', lili: '#7ad7ff', mof: '#c9a6ff', click: '#9fe870', cryo: '#bfe9ff' },
  decor: { stone: '#14161a', brass: '#b08a4a', brassOld: '#8a6a36', steel: '#9aa1aa', ceramic: '#e9e6df', copper: '#b8673a', aluminum: '#c9ccd1', frost: '#eef6fb' }
};

/* 程序画布纹理 */
function canvasTex(w, h, draw, srgb = false) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t;
}
const rnd = (s => () => (s = (s * 16807) % 2147483647) / 2147483647)(2207);

let _rough = {};
/* 拉丝:横向细纹的粗糙度图 */
function brushedRough() {
  return _rough.brush || (_rough.brush = canvasTex(256, 256, (x, w, h) => {
    x.fillStyle = '#808080'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) { const y = rnd() * h, g = 100 + rnd() * 70 | 0; x.strokeStyle = `rgba(${g},${g},${g},${0.25 + rnd() * 0.4})`; x.lineWidth = 0.6 + rnd(); x.beginPath(); x.moveTo(0, y); x.lineTo(w, y + (rnd() - 0.5) * 2); x.stroke(); }
  }));
}
/* 旧黄铜:斑驳氧化 + 擦亮高点 */
function patinaRough() {
  return _rough.patina || (_rough.patina = canvasTex(256, 256, (x, w, h) => {
    x.fillStyle = '#6a6a6a'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 260; i++) { const r = 4 + rnd() * 26, g = 70 + rnd() * 110 | 0, px = rnd() * w, py = rnd() * h; const gr = x.createRadialGradient(px, py, 0, px, py, r); gr.addColorStop(0, `rgba(${g},${g},${g},.55)`); gr.addColorStop(1, `rgba(${g},${g},${g},0)`); x.fillStyle = gr; x.fillRect(px - r, py - r, r * 2, r * 2); }
  }));
}
/* 黑石:细密石纹(颜色贴图) */
export function stoneTex() {
  return _rough.stone || (_rough.stone = canvasTex(512, 512, (x, w, h) => {
    x.fillStyle = COL.decor.stone; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 5000; i++) { const g = 18 + rnd() * 26 | 0; x.fillStyle = `rgba(${g},${g + 2},${g + 5},.5)`; x.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 2, 1 + rnd() * 2); }
    for (let k = 0; k < 9; k++) { x.strokeStyle = `rgba(150,150,160,${0.05 + rnd() * 0.08})`; x.lineWidth = 0.5 + rnd(); x.beginPath(); let px = rnd() * w, py = rnd() * h; x.moveTo(px, py); for (let j = 0; j < 14; j++) { px += (rnd() - 0.3) * 60; py += (rnd() - 0.5) * 40; x.lineTo(px, py); } x.stroke(); }
  }, true));
}
/* 霜:白色噪点颗粒(凹凸) */
function frostBump() {
  return _rough.frost || (_rough.frost = canvasTex(256, 256, (x, w, h) => {
    x.fillStyle = '#777'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 4000; i++) { const g = 120 + rnd() * 135 | 0; x.fillStyle = `rgb(${g},${g},${g})`; const s = rnd() * 2.4; x.fillRect(rnd() * w, rnd() * h, s, s); }
  }));
}

/* 工作室环境:暗室 + 顶部柔光箱 + 侧面暖/冷条灯 → PMREM。每个渲染器各一份。 */
const envCache = new WeakMap();
export function studioEnv(renderer) {
  if (envCache.has(renderer)) return envCache.get(renderer);
  const s = new THREE.Scene();
  const room = new THREE.Mesh(new THREE.SphereGeometry(10, 32, 16), new THREE.MeshBasicMaterial({ color: 0x1c1e24, side: THREE.BackSide })); s.add(room);
  const panel = (w, h, col, int, pos, rot) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(int), side: THREE.DoubleSide })); m.position.set(...pos); m.lookAt(0, 0, 0); if (rot) m.rotation.z = rot; s.add(m); };
  panel(9, 4, 0xfff3e2, 4.5, [0, 8, 2]);          /* 顶部柔光箱 */
  panel(2, 8, 0xffb06a, 3.0, [-8, 1, 3]);         /* 左暖条 */
  panel(2, 8, 0x9ccaff, 2.2, [8, 0.5, -2]);       /* 右冷条 */
  panel(10, 3, 0xffffff, 1.2, [0, -1, 8]);
  panel(14, 3, 0x6a5a48, 1.0, [0, -6, 0]);       /* 台面反光 */       /* 正面补光 */
  const pm = new THREE.PMREMGenerator(renderer); const rt = pm.fromScene(s, 0.02); pm.dispose();
  envCache.set(renderer, rt.texture); return rt.texture;
}

/* 材质工厂(每次新建,调用方可自行改色/透明) */
export const M = {
  brass: (o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: COL.decor.brass, metalness: 1, roughness: 0.34, roughnessMap: patinaRough() }, o)),
  brassOld: (o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: COL.decor.brassOld, metalness: 1, roughness: 0.5, roughnessMap: patinaRough() }, o)),
  steel: (o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: COL.decor.steel, metalness: 1, roughness: 0.32, roughnessMap: brushedRough() }, o)),
  darkSteel: (o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: '#4a4f57', metalness: 1, roughness: 0.42, roughnessMap: brushedRough() }, o)),
  aluminum: (o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: COL.decor.aluminum, metalness: 1, roughness: 0.26, roughnessMap: brushedRough() }, o)),
  copper: (o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: COL.decor.copper, metalness: 1, roughness: 0.3 }, o)),
  carbon: (o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: '#1c1d21', metalness: 0.35, roughness: 0.45 }, o)),
  ceramic: (o = {}) => new THREE.MeshPhysicalMaterial(Object.assign({ color: COL.decor.ceramic, metalness: 0, roughness: 0.42, clearcoat: 0.6, clearcoatRoughness: 0.25 }, o)),
  frost: (o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: COL.decor.frost, metalness: 0, roughness: 0.85, bumpMap: frostBump(), bumpScale: 0.6 }, o)),
  /* 玻璃:高/中档统一用 透明 + 清漆 + 环境反射(不依赖 transmission,离屏小渲染器也稳) */
  glass: (o = {}) => new THREE.MeshPhysicalMaterial(Object.assign({ color: '#d8e6f0', metalness: 0, roughness: 0.04, transparent: true, opacity: 0.28, clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 1.6, depthWrite: false }, o)),
  /* 镜头:深色镀膜玻璃 + 强清漆高光 */
  lens: (o = {}) => new THREE.MeshPhysicalMaterial(Object.assign({ color: '#07090c', metalness: 0.2, roughness: 0.06, clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 2.2 }, o)),
  /* 发光体(元素色光) */
  glow: (col, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: col, emissive: col, emissiveIntensity: 1.6, roughness: 0.3, metalness: 0 }, o)),
  stone: (o = {}) => new THREE.MeshStandardMaterial(Object.assign({ map: stoneTex(), metalness: 0, roughness: 0.38 }, o))
};

/* 地面元素色光斑(底部投光) */
export function floorGlow(col, size = 2.4) {
  const t = canvasTex(128, 128, (x, w, h) => { const g = x.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); g.addColorStop(0, 'rgba(255,255,255,.9)'); g.addColorStop(0.4, 'rgba(255,255,255,.35)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size * 0.55), new THREE.MeshBasicMaterial({ map: t, color: col, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; return m;
}
