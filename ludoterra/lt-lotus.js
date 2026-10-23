/* 觉弈 Ludoterra · 心莲星盘(v0.26,Three.js r169 本地 vendor/)
 * A1 粒子金莲:每片花瓣里有一股金色粒子从根部流向瓣尖,通关越多流得越亮。
 * A3 神经星流:玻璃盘上一张神经网,光脉冲从中心大脑流向各域、再在相邻域之间传递;两端都点亮的通路才亮起。
 * 八瓣金莲 = 八个认知域,中心金色大脑 = 意义。
 * A4 通关绽放:未通关的域花瓣合拢成花苞、暗淡;通关后展开、鎏金点亮;意义点亮后大脑上方升起光冠。
 * A2 点瓣展开:点一片花瓣,它在 3D 中抬起,其余七瓣暗下去,该域的关卡化作小星球浮起,再点星球进入关卡。
 * 投影与首页 P3() 一致(相机距离 3.2R、俯角正弦 = TILT),2D 层的标签可以叠在上面。 */
const TAU = Math.PI * 2;
const R0 = 0.16, LEN = 0.7; /* 花瓣根部半径与长度(×R) */
const FOLD_CLOSED = 1.28, FOLD_OPEN = 0.07;

function petalW(u) { return 0.2 * Math.pow(Math.sin(Math.PI * Math.pow(u, 0.72)), 0.75) * (1 - 0.1 * u); }

function brainTexture(THREE) {
  const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
  const g = x.createRadialGradient(128, 128, 4, 128, 128, 124); g.addColorStop(0, 'rgba(255,214,140,.55)'); g.addColorStop(.45, 'rgba(245,180,90,.16)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = g; x.fillRect(0, 0, 256, 256);
  x.lineCap = 'round'; x.lineJoin = 'round';
  const path = () => { x.beginPath(); x.moveTo(70, 150); x.bezierCurveTo(48, 120, 62, 74, 104, 66); x.bezierCurveTo(124, 46, 168, 50, 182, 74);
    x.bezierCurveTo(212, 82, 214, 122, 198, 140); x.bezierCurveTo(196, 162, 170, 172, 150, 164); x.bezierCurveTo(134, 178, 104, 176, 94, 162); x.bezierCurveTo(80, 166, 72, 160, 70, 150); };
  path(); x.fillStyle = 'rgba(255,200,110,.22)'; x.fill();
  x.shadowColor = 'rgba(255,210,130,.9)'; x.shadowBlur = 10; x.strokeStyle = '#ffe2a6'; x.lineWidth = 4; path(); x.stroke();
  x.lineWidth = 2.6; x.strokeStyle = 'rgba(255,226,166,.9)';
  [[[96, 84], [112, 98], [100, 116], [118, 128]], [[130, 70], [138, 92], [158, 96], [150, 120]], [[170, 86], [186, 102], [176, 122], [188, 134]],
   [[86, 132], [104, 140], [124, 150], [146, 146]], [[150, 140], [166, 150], [182, 146]], [[118, 104], [132, 116], [148, 112]]].forEach(p => {
    x.beginPath(); x.moveTo(p[0][0], p[0][1]); for (let i = 1; i < p.length; i++) { const [a, b] = p[i - 1], [cc, d] = p[i]; x.quadraticCurveTo(a + (cc - a) * .5 + 6, b + (d - b) * .5 - 6, cc, d); } x.stroke(); });
  x.beginPath(); x.moveTo(150, 164); x.bezierCurveTo(152, 180, 146, 194, 140, 202); x.stroke();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function glowTexture(THREE, inner = 'rgba(255,236,190,1)', mid = 'rgba(245,194,107,.35)') {
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
  const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, inner); g.addColorStop(.25, mid); g.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c);
}
function glassTexture(THREE) {
  const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
  const g = x.createRadialGradient(128, 128, 6, 128, 128, 128); g.addColorStop(0, 'rgba(70,160,180,.22)'); g.addColorStop(.5, 'rgba(36,64,128,.10)'); g.addColorStop(.9, 'rgba(70,90,170,.07)'); g.addColorStop(1, 'rgba(120,110,80,.06)');
  x.fillStyle = g; x.fillRect(0, 0, 256, 256); return new THREE.CanvasTexture(c);
}
function flowTexture(THREE) { /* 外圈鎏金流光:一段亮光沿圆周 */
  const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
  if (x.createConicGradient) { const g = x.createConicGradient(0, 128, 128);
    g.addColorStop(0, 'rgba(255,246,220,1)'); g.addColorStop(.05, 'rgba(245,194,107,.85)'); g.addColorStop(.3, 'rgba(170,120,55,.55)'); g.addColorStop(.5, 'rgba(240,196,118,.8)');
    g.addColorStop(.55, 'rgba(255,240,205,.95)'); g.addColorStop(.62, 'rgba(200,150,80,.6)'); g.addColorStop(.95, 'rgba(245,194,107,.85)'); g.addColorStop(1, 'rgba(255,246,220,1)'); x.fillStyle = g; }
  else x.fillStyle = 'rgba(226,178,98,.8)';
  x.fillRect(0, 0, 256, 256); return new THREE.CanvasTexture(c);
}

const STAR_VS = `attribute float aSeed;uniform float uT,uSize,uPx;varying float vA;
void main(){vec4 mv=modelViewMatrix*vec4(position,1.);float tw=.45+.55*pow(.5+.5*sin(uT*(1.3+aSeed*2.7)+aSeed*60.),2.);vA=tw;
gl_PointSize=uSize*uPx*(0.6+0.8*fract(aSeed*7.13))*tw/(-mv.z);gl_Position=projectionMatrix*mv;}`;
const STAR_FS = `uniform vec3 uCol;uniform float uOp;varying float vA;
void main(){vec2 p=gl_PointCoord-.5;float d=length(p);float core=smoothstep(.5,.0,d);float cr=smoothstep(.06,.0,abs(p.x))*smoothstep(.5,.0,abs(p.y))+smoothstep(.06,.0,abs(p.y))*smoothstep(.5,.0,abs(p.x));
float a=(pow(core,2.6)+cr*.55)*vA*uOp;if(a<.01)discard;gl_FragColor=vec4(uCol*a,a);}`;
const FLOW_VS = `attribute vec3 aP;uniform float uT,uSize,uPx,uSp;varying float vA;
float pw(float u){return .2*pow(max(sin(3.14159*pow(u,.72)),0.),.75)*(1.-.1*u);}
void main(){float u=fract(aP.x+uT*uSp*(.6+.8*aP.z));float w=pw(u)*aP.y*.92;vec3 p=vec3(u*0.7,.006+.01*sin(u*9.+aP.z*30.),w);
vec4 mv=modelViewMatrix*vec4(p,1.);vA=smoothstep(0.,.12,u)*smoothstep(1.,.8,u)*(.55+.45*sin(uT*3.+aP.z*40.));
gl_PointSize=uSize*uPx*(.5+.9*aP.z)/(-mv.z);gl_Position=projectionMatrix*mv;}`;
const FLOW_FS = `uniform vec3 uCol;uniform float uOp;varying float vA;void main(){float d=length(gl_PointCoord-.5);float a=pow(smoothstep(.5,0.,d),2.)*vA*uOp;if(a<.01)discard;gl_FragColor=vec4(uCol*a,a);}`;
const PLANET_VS = `varying vec3 vN;varying vec3 vV;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}`;
const PLANET_FS = `uniform vec3 uA,uB;uniform float uT,uOp;varying vec3 vN;varying vec3 vV;
void main(){float l=max(dot(vN,normalize(vec3(-.4,.7,.6))),0.);float fr=pow(1.-max(dot(vN,vV),0.),2.5);
float band=.5+.5*sin(vN.y*14.+uT*.6);vec3 c=mix(uA,uB,l*.8+band*.12)+uB*fr*1.2;gl_FragColor=vec4(c*uOp,uOp);}`;

export async function makeLotus(opt = {}) {
  let THREE; try { THREE = await import('./vendor/three.module.min.js'); } catch (_) { return null; }
  let renderer; try { renderer = new THREE.WebGLRenderer({ alpha: true, premultipliedAlpha: true, preserveDrawingBuffer: true, antialias: true, powerPreference: 'high-performance' }); } catch (_) { return null; }
  if (!renderer.getContext()) return null;
  renderer.setClearColor(0x000000, 0);
  const cvs = renderer.domElement; let ok = true;
  cvs.addEventListener('webglcontextlost', e => { e.preventDefault(); ok = false; });
  cvs.addEventListener('webglcontextrestored', () => { ok = true; });
  const small = Math.min(innerWidth, innerHeight) < 640;

  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(30, 1, 0.05, 50);
  const disc = new THREE.Group(); scene.add(disc); /* 绕竖轴旋转 = theta */
  const GOLD = new THREE.Color(1, 0.78, 0.42), DIM = new THREE.Color(0.42, 0.40, 0.46), IVORY = new THREE.Color(1, 0.95, 0.84);
  const ADD = { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending };

  /* 半透明玻璃盘 + 外圈细金带 + 刻度 + 流光 */
  const glass = new THREE.Mesh(new THREE.CircleGeometry(1.035, 96), new THREE.MeshBasicMaterial({ map: glassTexture(THREE), transparent: true, depthWrite: false }));
  glass.rotation.x = -Math.PI / 2; disc.add(glass);
  const flow = new THREE.Mesh(new THREE.RingGeometry(1.006, 1.024, 160, 1), new THREE.MeshBasicMaterial({ map: flowTexture(THREE), transparent: true, opacity: .55, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
  flow.rotation.x = -Math.PI / 2; flow.position.y = 0.001; disc.add(flow);
  const circle = (r, n = 160) => { const p = []; for (let i = 0; i <= n; i++) { const a = i / n * TAU; p.push(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r)); } return new THREE.BufferGeometry().setFromPoints(p); };
  const lineMat = (op, col = GOLD) => new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: op, depthWrite: false, blending: THREE.AdditiveBlending });
  [[0.985, .55], [1.04, .8], [1.075, .35], [R0 + 0.005, .5], [0.62, .12]].forEach(([r, op]) => { const l = new THREE.Line(circle(r), lineMat(op)); l.position.y = 0.002; disc.add(l); });
  { const p = []; for (let i = 0; i < 120; i++) { const a = i / 120 * TAU, big = i % 10 === 0, r1 = 1.04, r2 = big ? 1.075 : 1.055; p.push(new THREE.Vector3(Math.cos(a) * r1, 0, Math.sin(a) * r1), new THREE.Vector3(Math.cos(a) * r2, 0, Math.sin(a) * r2)); }
    const ticks = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(p), lineMat(.55)); ticks.position.y = 0.002; disc.add(ticks); }

  /* 花瓣 */
  const petalShape = () => { const s = new THREE.Shape(); const N = 40; s.moveTo(0, 0);
    for (let i = 1; i <= N; i++) { const u = i / N; s.lineTo(u * LEN, petalW(u)); } for (let i = N - 1; i >= 0; i--) { const u = i / N; s.lineTo(u * LEN, -petalW(u)); } return s; };
  const outlinePts = (sc = 1, N = 60) => { const p = []; for (let i = 0; i <= N; i++) { const u = i / N; p.push(new THREE.Vector3(u * LEN * sc, 0, -petalW(u) * sc)); }
    for (let i = N; i >= 0; i--) { const u = i / N; p.push(new THREE.Vector3(u * LEN * sc, 0, petalW(u) * sc)); } return p; };
  const fillGeo = new THREE.ShapeGeometry(petalShape(), 40); fillGeo.rotateX(Math.PI / 2); /* shape y → z */
  const outGeo = new THREE.BufferGeometry().setFromPoints(outlinePts());
  const inGeo = new THREE.BufferGeometry().setFromPoints(outlinePts(0.62).map(v => v.add(new THREE.Vector3(LEN * 0.1, 0, 0))));
  const veinGeo = (() => { const p = []; p.push(new THREE.Vector3(0.02, 0, 0), new THREE.Vector3(LEN * 0.94, 0, 0));
    [0.3, 0.5, 0.7].forEach(u => { [-1, 1].forEach(sg => { p.push(new THREE.Vector3(u * LEN * 0.8, 0, 0), new THREE.Vector3(u * LEN * 1.05, 0, sg * petalW(u) * 0.7)); }); }); return new THREE.BufferGeometry().setFromPoints(p); })();
  const starMat = (op) => new THREE.ShaderMaterial({ vertexShader: STAR_VS, fragmentShader: STAR_FS, ...ADD,
    uniforms: { uT: { value: 0 }, uSize: { value: 0.05 }, uPx: { value: 600 }, uCol: { value: new THREE.Color(1, 0.9, 0.66) }, uOp: { value: op } } });
  const petals = [];
  const N8 = 8;
  for (let i = 0; i < N8; i++) {
    const pivot = new THREE.Group(); const hinge = new THREE.Group(); hinge.position.x = R0; pivot.add(hinge); disc.add(pivot);
    const fill = new THREE.Mesh(fillGeo, new THREE.MeshBasicMaterial({ color: GOLD.clone(), opacity: .12, side: THREE.DoubleSide, ...ADD }));
    fill.userData.dom = i; hinge.add(fill);
    const out = new THREE.Line(outGeo, lineMat(.9, GOLD.clone())); hinge.add(out);
    const inn = new THREE.Line(inGeo, lineMat(.35, GOLD.clone())); hinge.add(inn);
    const vein = new THREE.LineSegments(veinGeo, lineMat(.3, GOLD.clone())); hinge.add(vein);
    const sp = [], seeds = []; const ns = 9; for (let k = 0; k < ns; k++) { const u = 0.18 + 0.72 * ((k * 0.618 + i * 0.13) % 1); const w = petalW(u) * 0.7 * (((k * 0.37 + i * .21) % 1) * 2 - 1);
      sp.push(u * LEN, 0.004, w); seeds.push(((k + 1) * (i + 3) * 0.6180339) % 1); }
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3)); sg.setAttribute('aSeed', new THREE.Float32BufferAttribute(seeds, 1));
    const stars = new THREE.Points(sg, starMat(1)); hinge.add(stars);
    const FN = small ? 70 : 140, fa = new Float32Array(FN * 3); for (let k = 0; k < FN; k++) fa.set([Math.random(), Math.random() * 2 - 1, Math.random()], k * 3);
    const fg = new THREE.BufferGeometry(); fg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(FN * 3), 3)); fg.setAttribute('aP', new THREE.BufferAttribute(fa, 3));
    const flowP = new THREE.Points(fg, new THREE.ShaderMaterial({ vertexShader: FLOW_VS, fragmentShader: FLOW_FS, ...ADD,
      uniforms: { uT: { value: 0 }, uSize: { value: 0.03 }, uPx: { value: 600 }, uSp: { value: 0.12 }, uCol: { value: new THREE.Color(1, .82, .48) }, uOp: { value: 0 } } }));
    flowP.frustumCulled = false; hinge.add(flowP);
    petals.push({ pivot, hinge, fill, out, inn, vein, stars, flowP, k: -1, foc: 0, hov: 0 });
  }
  /* 第二层装饰小花瓣(错开 22.5°),随整体进度舒展 */
  const back = [];
  for (let i = 0; i < N8; i++) { const pivot = new THREE.Group(); const hinge = new THREE.Group(); hinge.position.x = R0 * 0.9; hinge.scale.setScalar(0.6); pivot.add(hinge); disc.add(pivot);
    const l = new THREE.Line(outGeo, lineMat(.22)); hinge.add(l); back.push({ pivot, hinge, l }); }

  /* 中心:光晕 + 金色大脑 + 光冠 */
  const glowT = glowTexture(THREE);
  const core = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowT, color: 0xffd9a0, ...ADD, opacity: .55 })); core.scale.setScalar(0.55); core.position.y = 0.06; scene.add(core);
  const brain = new THREE.Sprite(new THREE.SpriteMaterial({ map: brainTexture(THREE), transparent: true, depthWrite: false, depthTest: false })); brain.scale.setScalar(0.4); brain.position.y = 0.14; brain.renderOrder = 5; scene.add(brain);
  const hub = new THREE.Mesh(new THREE.CircleGeometry(R0 * 1.05, 40), new THREE.MeshBasicMaterial({ visible: false })); hub.rotation.x = -Math.PI / 2; hub.position.y = 0.01; hub.userData.lotus = true; scene.add(hub);
  const crown = new THREE.Group(); scene.add(crown);
  const halo = new THREE.Line(circle(0.16, 80), lineMat(0)); halo.position.y = 0.36; crown.add(halo);
  const halo2 = new THREE.Line(circle(0.11, 80), lineMat(0)); halo2.position.y = 0.42; crown.add(halo2);
  const beam = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowT, color: 0xfff0c8, ...ADD, opacity: 0 })); beam.scale.set(0.12, 0.9, 1); beam.position.y = 0.4; crown.add(beam);
  const crownPts = (() => { const p = [], s = []; for (let i = 0; i < 9; i++) { const a = i / 9 * TAU; p.push(Math.cos(a) * 0.16, 0.36 + (i % 2 ? 0.07 : 0.03), Math.sin(a) * 0.16); s.push(i / 9); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setAttribute('aSeed', new THREE.Float32BufferAttribute(s, 1)); const m = starMat(0); m.uniforms.uSize.value = 0.09; return new THREE.Points(g, m); })();
  crown.add(crownPts);

  /* 环境金尘:绕盘缓慢盘旋 */
  const DN = small ? 260 : 700; const dust = (() => { const p = new Float32Array(DN * 3), s = new Float32Array(DN);
    for (let i = 0; i < DN; i++) { const r = 0.15 + Math.pow(Math.random(), 0.7) * 1.15, a = Math.random() * TAU; p[i * 3] = Math.cos(a) * r; p[i * 3 + 1] = Math.random() * 0.45 - 0.05; p[i * 3 + 2] = Math.sin(a) * r; s[i] = Math.random(); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3)); g.setAttribute('aSeed', new THREE.BufferAttribute(s, 1));
    const m = starMat(.5); m.uniforms.uSize.value = 0.022; return new THREE.Points(g, m); })();
  disc.add(dust);

  /* A3 神经星流:中心 → 各域(8 条)+ 相邻域之间(8 条),光脉冲沿通路流动 */
  const NODE = i => { const a = i / N8 * TAU; return new THREE.Vector3(Math.cos(a) * 0.93, 0.003, Math.sin(a) * 0.93); };
  const nerves = [];
  for (let i = 0; i < N8; i++) {
    const A = NODE(i), B = NODE((i + 1) % N8), mid = A.clone().multiplyScalar(0.5); const side = new THREE.Vector3(-A.z, 0, A.x).multiplyScalar(0.18 * (i % 2 ? 1 : -1));
    const c1 = new THREE.QuadraticBezierCurve3(new THREE.Vector3(0, 0.003, 0).add(A.clone().multiplyScalar(R0 * 1.2 / 0.93)), mid.add(side), A);
    const c2 = new THREE.QuadraticBezierCurve3(A, A.clone().add(B).multiplyScalar(0.5 * 1.12), B);
    [[c1, i, i], [c2, i, (i + 1) % N8]].forEach(([c, a, b]) => { const pts = c.getPoints(48); const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lineMat(0)); disc.add(l);
      nerves.push({ c, l, a, b, ph: Math.random() }); });
  }
  const PN = nerves.length * 3, pulseP = new Float32Array(PN * 3), pulseS = new Float32Array(PN);
  for (let i = 0; i < PN; i++) pulseS[i] = i / PN;
  const pulseG = new THREE.BufferGeometry(); pulseG.setAttribute('position', new THREE.BufferAttribute(pulseP, 3)); pulseG.setAttribute('aSeed', new THREE.BufferAttribute(pulseS, 1));
  const pulseM = starMat(1); pulseM.uniforms.uSize.value = 0.075; const pulses = new THREE.Points(pulseG, pulseM); pulses.frustumCulled = false; disc.add(pulses);
  const nodeG = new THREE.BufferGeometry(); { const np = [], ns = []; for (let i = 0; i < N8; i++) { const v = NODE(i); np.push(v.x, v.y, v.z); ns.push(i / 8); }
    nodeG.setAttribute('position', new THREE.Float32BufferAttribute(np, 3)); nodeG.setAttribute('aSeed', new THREE.Float32BufferAttribute(ns, 1)); }
  const nodeM = starMat(.6); nodeM.uniforms.uSize.value = 0.06; disc.add(new THREE.Points(nodeG, nodeM));

  /* A2 关卡星球 */
  const planetGeo = new THREE.SphereGeometry(1, 28, 20);
  const pGroup = new THREE.Group(); disc.add(pGroup); let planets = []; let pDom = -1;
  function buildPlanets(i, list) {
    planets.forEach(p => { p.m.material.dispose(); p.ring.material.dispose(); p.h.material.dispose(); }); pGroup.clear(); planets = []; pDom = i; if (i < 0) return;
    list.forEach((t, j) => {
      const n = list.length; const u = n === 1 ? 0.8 : 0.62 + 0.36 * j / (n - 1);
      const col = t.done ? [new THREE.Color(.55, .36, .12), new THREE.Color(1, .82, .48)] : t.live ? [new THREE.Color(.30, .34, .48), IVORY] : [new THREE.Color(.10, .11, .16), new THREE.Color(.42, .44, .52)];
      const m = new THREE.Mesh(planetGeo, new THREE.ShaderMaterial({ vertexShader: PLANET_VS, fragmentShader: PLANET_FS, transparent: true, depthWrite: false,
        uniforms: { uA: { value: col[0] }, uB: { value: col[1] }, uT: { value: 0 }, uOp: { value: 0 } } }));
      const sz = t.live ? 0.052 : 0.036; m.scale.setScalar(sz); m.userData.task = t.id;
      const ring = new THREE.Line(circle(1, 64), lineMat(0, t.done ? GOLD : IVORY)); ring.scale.setScalar(sz * 1.9); ring.rotation.x = 0.5; ring.rotation.z = 0.3;
      const h = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowT, color: t.done ? 0xffd27a : 0xdfe6ff, ...ADD, opacity: 0 })); h.scale.setScalar(sz * 6);
      const g = new THREE.Group(); g.add(h); g.add(m); g.add(ring); pGroup.add(g);
      planets.push({ g, m, ring, h, t, u, j, side: j % 2 ? 1 : -1 });
    });
  }

  const ray = new THREE.Raycaster(); const v2 = new THREE.Vector2(); const tmp = new THREE.Vector3();
  let W = 1, H = 1, dpr = 1, CX = 0, CY = 0, R = 200, fpx = 600;
  const smooth = (a, b, k) => a + (b - a) * k;
  const api = {
    c: cvs, get ok() { return ok; },
    size(w, h, d) { const dd = Math.min(opt.maxDpr || 1.5, d); if (W !== w || H !== h || dpr !== dd) { renderer.setPixelRatio(dd); renderer.setSize(w, h, false); W = w; H = h; dpr = dd; } },
    /* o: { CX, CY, R, ES, EC, theta, t, lit[8], meaning, hover, focus, planets:[{id,done,live}] , rm } */
    render(o) {
      CX = o.CX; CY = o.CY; R = o.R; const D = 3.2;
      const fullW = 2 * Math.max(CX, W - CX), fullH = 2 * Math.max(CY, H - CY);
      cam.aspect = fullW / fullH; cam.fov = 2 * Math.atan(fullH / 2 / (D * R)) * 180 / Math.PI;
      cam.setViewOffset(fullW, fullH, fullW / 2 - CX, fullH / 2 - CY, W, H);
      cam.position.set(0, D * o.ES, D * o.EC); cam.up.set(0, 1, 0); cam.lookAt(0, 0, 0); cam.updateProjectionMatrix();
      fpx = D * R * dpr; const t = o.t;
      disc.rotation.y = -o.theta;
      flow.rotation.z = o.rm ? 0 : -t * 0.35;
      const fi = o.focus == null ? -1 : o.focus;
      let allK = 0;
      petals.forEach((p, i) => {
        const a = i / N8 * TAU; p.pivot.rotation.y = -a;
        const k = Math.max(0, Math.min(1, o.lit[i] || 0)); allK += k;
        p.k = p.k < 0 ? k : smooth(p.k, k, o.rm ? 1 : 0.08);
        p.foc = smooth(p.foc, fi === i ? 1 : 0, o.rm ? 1 : 0.1); p.hov = smooth(p.hov, o.hover === i ? 1 : 0, 0.2);
        const dimF = fi >= 0 && fi !== i ? 1 : 0; p.dim = smooth(p.dim || 0, dimF, o.rm ? 1 : 0.1);
        const breathe = o.rm ? 0 : Math.sin(t * 0.9 + i) * 0.03 * (1 - p.k);
        const ko = p.k + (Math.max(p.k, 0.9) - p.k) * p.foc; /* 选中的花苞也展开,方便看关卡 */
        p.hinge.rotation.z = FOLD_CLOSED + (FOLD_OPEN - FOLD_CLOSED) * ko + breathe * (1 - p.foc) + p.foc * 0.22 + p.hov * 0.05;
        p.pivot.position.y = p.foc * 0.09 + p.hov * 0.012; p.hinge.scale.setScalar(0.82 + 0.18 * p.k + p.foc * 0.12);
        const vis = 1 - 0.7 * p.dim;
        const c = DIM.clone().lerp(GOLD, p.k);
        p.fill.material.color.copy(c); p.fill.material.opacity = (0.05 + 0.13 * p.k + 0.1 * p.hov + 0.08 * p.foc) * vis;
        p.out.material.color.copy(c.clone().lerp(IVORY, 0.25 * p.k)); p.out.material.opacity = (0.45 + 0.5 * p.k + 0.3 * p.hov) * vis;
        p.inn.material.color.copy(c); p.inn.material.opacity = (0.12 + 0.3 * p.k) * vis;
        p.vein.material.color.copy(c); p.vein.material.opacity = (0.1 + 0.25 * p.k) * vis;
        const fu = p.flowP.material.uniforms; fu.uT.value = o.rm ? 2 : t; fu.uPx.value = fpx; fu.uOp.value = (0.12 + 0.88 * p.k) * vis * (1 + 0.4 * p.hov);
        fu.uSp.value = 0.06 + 0.12 * p.k; fu.uCol.value.copy(DIM.clone().lerp(new THREE.Color(1, .82, .48), p.k));
        const su = p.stars.material.uniforms; su.uT.value = o.rm ? 1 : t; su.uPx.value = fpx; su.uOp.value = (0.15 + 0.85 * p.k) * vis; su.uCol.value.copy(DIM.clone().lerp(new THREE.Color(1, .9, .66), p.k));
      });
      const prog = allK / N8;
      { const lk = i => Math.max(0, Math.min(1, petals[i].k)); let pi = 0;
        nerves.forEach(n => { const on = n.a === n.b ? lk(n.a) : Math.min(lk(n.a), lk(n.b)); const fd = fi >= 0 && n.a !== fi && n.b !== fi ? 0.3 : 1;
          n.l.material.opacity = (0.1 + 0.55 * on) * fd;
          for (let q = 0; q < 3; q++) { const u = o.rm ? (q + 1) / 4 : (n.ph + q / 3 + t * (0.08 + 0.1 * on)) % 1; const v = n.c.getPoint(u); pulseP.set([v.x, v.y + 0.002, v.z], pi * 3);
            pi++; } n.on = on * fd; });
        pulseG.attributes.position.needsUpdate = true; pulseM.uniforms.uT.value = t; pulseM.uniforms.uPx.value = fpx; pulseM.uniforms.uOp.value = 0.25 + 0.75 * prog;
        nodeM.uniforms.uT.value = t; nodeM.uniforms.uPx.value = fpx; nodeM.uniforms.uOp.value = 0.3 + 0.6 * prog; }
      back.forEach((b, i) => { b.pivot.rotation.y = -(i + 0.5) / N8 * TAU; b.hinge.rotation.z = 1.0 - 0.75 * prog; b.l.material.opacity = 0.1 + 0.25 * prog; });
      const m = Math.max(0, Math.min(1, o.meaning || 0));
      core.material.opacity = 0.18 + 0.2 * prog + 0.3 * m; core.scale.setScalar(0.4 + 0.15 * prog + (o.rm ? 0 : 0.03 * Math.sin(t * 1.6)));
      brain.position.y = 0.14 + (o.rm ? 0 : 0.008 * Math.sin(t * 1.2)); brain.material.opacity = 0.55 + 0.45 * Math.max(prog, m);
      halo.material.opacity = 0.75 * m; halo2.material.opacity = 0.5 * m; beam.material.opacity = 0.45 * m * (o.rm ? 1 : 0.8 + 0.2 * Math.sin(t * 2));
      crown.rotation.y = o.rm ? 0 : t * 0.3; crown.position.y = 0.04 * (1 - m);
      crownPts.material.uniforms.uOp.value = m; crownPts.material.uniforms.uT.value = t; crownPts.material.uniforms.uPx.value = fpx;
      dust.rotation.y = o.rm ? 0 : t * 0.02; dust.material.uniforms.uT.value = t; dust.material.uniforms.uPx.value = fpx; dust.material.uniforms.uOp.value = 0.25 + 0.35 * prog;
      /* 星球 */
      const want = fi >= 0 ? fi : -1; const key = want + ':' + (o.planets || []).map(p => p.id + (p.done ? 1 : 0)).join(',');
      if (key !== api._pk) { api._pk = key; if (want >= 0) buildPlanets(want, o.planets || []); else if (pDom >= 0) { /* 淡出后清掉 */ } }
      const labels = [], plab = [];
      if (pDom >= 0) {
        const p = petals[pDom]; const f = p.foc; if (want < 0 && f < 0.02) { buildPlanets(-1, []); api._pk = ''; }
        planets.forEach(pl => {
          const a = pDom / N8 * TAU; const r = R0 + LEN * pl.u * (0.82 + 0.3 * f);
          const lift = 0.1 + 0.2 * f + pl.u * 0.1 * f + (o.rm ? 0 : 0.012 * Math.sin(t * 1.4 + pl.j * 2));
          const off = (n => n < 2 ? 0 : (pl.j / (n - 1) - 0.5) * 0.42)(planets.length) * f; const ca = Math.cos(a), sa = Math.sin(a);
          pl.g.position.set(ca * r - sa * off, lift, sa * r + ca * off);
          const sel = o.hoverTask === pl.t.id ? 1 : 0; pl.hs = smooth(pl.hs || 0, sel, 0.2);
          pl.m.material.uniforms.uOp.value = f; pl.m.material.uniforms.uT.value = t; pl.ring.material.opacity = 0.7 * f; pl.ring.rotation.y = o.rm ? 0 : t * 0.5;
          pl.h.material.opacity = f * (0.35 + 0.65 * pl.hs) * (pl.t.live ? 1 : 0.3);
          pl.g.scale.setScalar(0.5 + 0.5 * f + 0.25 * pl.hs);
          pl.g.getWorldPosition(tmp); tmp.project(cam); plab.push({ id: pl.t.id, x: (tmp.x + 1) / 2 * W, y: (1 - tmp.y) / 2 * H, f, r: (pl.t.live ? 0.052 : 0.036) * (0.5 + 0.5 * f) });
        });
      }
      /* 标签锚点:花瓣尖外侧 */
      petals.forEach((p, i) => { tmp.set(LEN * 1.16, 0.02, 0); p.hinge.localToWorld(tmp); tmp.project(cam); labels.push({ i, x: (tmp.x + 1) / 2 * W, y: (1 - tmp.y) / 2 * H, k: p.k, foc: p.foc, dim: p.dim || 0 }); });
      tmp.set(0, 0.36, 0).project(cam); const crownXY = { x: (tmp.x + 1) / 2 * W, y: (1 - tmp.y) / 2 * H };
      renderer.render(scene, cam);
      return { labels, planets: plab, crown: crownXY };
    },
    pick(x, y) {
      v2.set(x / W * 2 - 1, -(y / H) * 2 + 1); ray.setFromCamera(v2, cam);
      if (planets.length) { const hp = ray.intersectObjects(planets.map(p => p.m), false); if (hp.length && hp[0].object.material.uniforms.uOp.value > 0.5) return { task: hp[0].object.userData.task }; }
      const hh = ray.intersectObject(hub, false); if (hh.length) return { lotus: true };
      const hs = ray.intersectObjects(petals.map(p => p.fill), false); if (hs.length) return { dom: hs[0].object.userData.dom };
      return null;
    }
  };
  return api;
}
