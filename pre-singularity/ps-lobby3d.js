/* 奇点前夜 · 萤的两种形态(v0.7 原型)
   形态 A 神经核:体积粒子神经云 + 脉动核心 + 六边网壳 + 6 条全息环 + 30 颗知识神经元
   形态 B 奇点:黑色视界 + 吸积盘粒子 + 360° 电路冠冕(脉冲外流)
   两形态共用同一批粒子,uMorph 0→1 变形(先向内坍缩再甩成吸积盘)。 */
import * as THREE from 'three';

const CY = new THREE.Color(0x4fe3ff), WH = new THREE.Color(0xe8fbff), GOLD = new THREE.Color(0xffc75a);

function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
const R = rng(20261021);
const gauss = () => { let u = 0, v = 0; while (!u) u = R(); while (!v) v = R(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(6.2832 * v); };
const randDir = () => { const z = R() * 2 - 1, a = R() * 6.2832, s = Math.sqrt(1 - z * z); return new THREE.Vector3(s * Math.cos(a), z, s * Math.sin(a)); };

function discTex(soft = 1) {
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25 * soft, 'rgba(255,255,255,.75)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64); const t = new THREE.CanvasTexture(c); return t;
}
function ringTex(inner = 0.42, width = 0.05) {
  const c = document.createElement('canvas'); c.width = c.height = 512; const g = c.getContext('2d');
  const gr = g.createRadialGradient(256, 256, 0, 256, 256, 256);
  gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(Math.max(0, inner - width * 2), 'rgba(255,255,255,0)');
  gr.addColorStop(inner, 'rgba(255,255,255,1)'); gr.addColorStop(Math.min(1, inner + width * 3), 'rgba(255,255,255,.08)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 512, 512); return new THREE.CanvasTexture(c);
}
const add = { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending };

/* ---------- 背景:星云 + 星野(图四配色:炭黑 + 灰紫褐星云 + 冷蓝) ---------- */
function makeBackground(T) {
  const g = new THREE.Group();
  const neb = new THREE.Mesh(new THREE.SphereGeometry(80, 48, 32), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    uniforms: { uTime: { value: 0 } },
    vertexShader: `varying vec3 vP; void main(){ vP=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `varying vec3 vP; uniform float uTime;
      float h(vec3 p){ return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453); }
      float n(vec3 p){ vec3 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
        return mix(mix(mix(h(i),h(i+vec3(1,0,0)),f.x),mix(h(i+vec3(0,1,0)),h(i+vec3(1,1,0)),f.x),f.y),
                   mix(mix(h(i+vec3(0,0,1)),h(i+vec3(1,0,1)),f.x),mix(h(i+vec3(0,1,1)),h(i+vec3(1,1,1)),f.x),f.y),f.z); }
      float fbm(vec3 p){ float s=0., a=.5; for(int i=0;i<5;i++){ s+=a*n(p); p*=2.03; a*=.5; } return s; }
      void main(){
        vec3 p=vP*2.2+vec3(0.,0.,uTime*0.004);
        float f=fbm(p), f2=fbm(p*1.7+3.1);
        vec3 col=vec3(0.018,0.02,0.032);
        col+=vec3(0.075,0.05,0.06)*smoothstep(.42,.85,f)*(.55+.45*vP.y);     // 灰紫褐星云
        col+=vec3(0.03,0.04,0.075)*smoothstep(.45,.9,f2)*(.6-.4*vP.x);       // 冷蓝
        float c=max(0.,dot(vP,vec3(0.,0.,1.)));
        col+=vec3(0.01,0.04,0.06)*pow(c,6.);                                // 中心微青
        gl_FragColor=vec4(col,1.);
      }`
  }));
  g.add(neb);
  const n = T.stars, pos = new Float32Array(n * 3), sz = new Float32Array(n);
  for (let i = 0; i < n; i++) { const d = randDir().multiplyScalar(40 + R() * 20); pos.set([d.x, d.y, d.z], i * 3); sz[i] = Math.pow(R(), 4); }
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); sg.setAttribute('aS', new THREE.BufferAttribute(sz, 1));
  const stars = new THREE.Points(sg, new THREE.ShaderMaterial({
    ...add, uniforms: { uTime: { value: 0 }, uPR: { value: 1 } },
    vertexShader: `attribute float aS; uniform float uTime,uPR; varying float vA;
      void main(){ vec4 mv=modelViewMatrix*vec4(position,1.); gl_Position=projectionMatrix*mv;
        gl_PointSize=(1.+aS*3.5)*uPR; vA=(.25+.75*aS)*(.7+.3*sin(uTime*1.5+position.x*7.)); }`,
    fragmentShader: `varying float vA; void main(){ float d=length(gl_PointCoord-.5); gl_FragColor=vec4(vec3(.85,.9,1.),vA*smoothstep(.5,0.,d)); }`
  }));
  g.add(stars);
  return { group: g, update(t, pr) { neb.material.uniforms.uTime.value = t; stars.material.uniforms.uTime.value = t; stars.material.uniforms.uPR.value = pr; } };
}

/* ---------- 共用粒子:神经云 ⇄ 吸积盘 ---------- */
function makeParticles(T) {
  const n = T.particles;
  const aS = new Float32Array(n * 3), aD = new Float32Array(n * 3), aR = new Float32Array(n * 4);
  const tmp = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    // 神经云:52% 外壳 / 33% 体积 / 15% 核心
    const k = R(); let r;
    if (k < 0.52) r = 0.9 + 0.1 * Math.pow(R(), 0.6);
    else if (k < 0.85) r = Math.cbrt(R()) * 0.88;
    else r = Math.pow(R(), 2.2) * 0.26;
    tmp.copy(randDir()).multiplyScalar(r);
    // 外壳上做丝状聚团(神经纤维感)
    if (k < 0.52) { const w = Math.sin(tmp.x * 9) * Math.sin(tmp.y * 9 + 1) * Math.sin(tmp.z * 9 + 2); tmp.multiplyScalar(1 + 0.035 * w); }
    aS.set([tmp.x, tmp.y, tmp.z], i * 3);
    // 吸积盘:三条旋臂 + 弥散,内缘 1.2,外缘约 3.6
    const dr = 1.18 + Math.pow(R(), 1.7) * 2.5;
    let ang = R() * 6.2832;
    if (R() < 0.62) { const arm = Math.floor(R() * 3); ang = arm * 2.0944 + Math.log(dr) * 2.6 + gauss() * 0.28; }
    const y = gauss() * 0.022 * dr;
    aD.set([Math.cos(ang) * dr, y, Math.sin(ang) * dr], i * 3);
    aR.set([R(), Math.pow(R(), 2.6), R() * 6.2832, k], i * 4);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(aS, 3));
  g.setAttribute('aSphere', new THREE.BufferAttribute(aS, 3));
  g.setAttribute('aDisk', new THREE.BufferAttribute(aD, 3));
  g.setAttribute('aRand', new THREE.BufferAttribute(aR, 4));
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 6);
  const tilt = new THREE.Matrix3().setFromMatrix4(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(0.36, 0, -0.32)));
  const mat = new THREE.ShaderMaterial({
    ...add,
    uniforms: { uTime: { value: 0 }, uMorph: { value: 0 }, uExpand: { value: 1 }, uSize: { value: 15 }, uPR: { value: 1 }, uTilt: { value: tilt }, uBeat: { value: 0 }, uGain: { value: T.particles > 60000 ? 0.10 : 0.17 } },
    vertexShader: `
      attribute vec3 aSphere, aDisk; attribute vec4 aRand;
      uniform float uTime,uMorph,uExpand,uSize,uPR,uBeat,uGain; uniform mat3 uTilt;
      varying vec3 vC; varying float vA;
      vec3 rotY(vec3 p,float a){ float c=cos(a),s=sin(a); return vec3(c*p.x+s*p.z,p.y,-s*p.x+c*p.z); }
      void main(){
        float r=length(aSphere);
        vec3 sp=rotY(aSphere, uTime*(0.05+0.22*(1.-r)) + aRand.z*step(r,0.3));
        sp+=0.012*vec3(sin(uTime*1.3+aRand.x*40.),cos(uTime*1.1+aRand.x*31.),sin(uTime*.9+aRand.x*23.));
        sp*=1.+0.03*uBeat*smoothstep(0.5,1.,r);
        float e=clamp(uExpand*1.5-aRand.x*0.5,0.,1.); e=e*e*(3.-2.*e);
        sp*=e;
        float dr=length(aDisk.xz);
        vec3 dp=uTilt*rotY(aDisk, uTime*0.85*pow(dr,-1.5));
        float m=uMorph*uMorph*(3.-2.*uMorph);
        vec3 p=mix(sp,dp,m)*(1.-0.78*sin(3.14159*m));
        vec4 mv=modelViewMatrix*vec4(p,1.);
        gl_Position=projectionMatrix*mv;
        float tw=.55+.45*sin(uTime*(1.5+aRand.x*2.)+aRand.x*60.);
        gl_PointSize=uSize*uPR*(.45+aRand.y*1.8)/(-mv.z);
        vec3 deep=vec3(.06,.42,.72), cy=vec3(.30,.89,1.), wh=vec3(.90,.98,1.);
        vec3 sc=mix(deep,cy,smoothstep(.25,.95,r));
        sc=mix(sc,wh,max(step(.97,aRand.y)*.8,1.-smoothstep(.0,.18,r)));
        vec3 dc=mix(wh,cy,smoothstep(1.2,2.0,dr)); dc=mix(dc,deep,smoothstep(2.3,3.6,dr));
        vC=mix(sc,dc,m);
        float shell=mix(.55,1.,smoothstep(.85,1.,r));
        vA=uGain*tw*(.30+.70*aRand.y)*max(e*shell,m)*mix(1.,(1.3-dr*0.24)*5.0,m);
      }`,
    fragmentShader: `varying vec3 vC; varying float vA;
      void main(){ float d=length(gl_PointCoord-.5); float a=smoothstep(.5,.0,d); gl_FragColor=vec4(vC,vA*a*a); }`
  });
  const pts = new THREE.Points(g, mat);
  return { obj: pts, u: mat.uniforms };
}

/* ---------- 神经丛连线(外壳上的三角网,图三的网状质感) ---------- */
function makePlexus(T) {
  const n = T.plexus, P = [];
  for (let i = 0; i < n; i++) P.push(randDir().multiplyScalar(0.965 + R() * 0.03));
  const seg = [];
  for (let i = 0; i < n; i++) { let c = 0; for (let j = i + 1; j < n && c < 3; j++) { if (P[i].distanceTo(P[j]) < 0.16) { seg.push(P[i].x, P[i].y, P[i].z, P[j].x, P[j].y, P[j].z); c++; } } }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(seg, 3));
  const lines = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ ...add, color: CY, opacity: 0.085 }));
  const vg = new THREE.BufferGeometry(); vg.setFromPoints(P);
  const nodes = new THREE.Points(vg, new THREE.PointsMaterial({ ...add, color: WH, size: 0.022, map: discTex(), opacity: 0.8 }));
  const grp = new THREE.Group(); grp.add(lines, nodes);
  return { group: grp, mats: [lines.material, nodes.material], base: [0.085, 0.6] };
}

/* ---------- 六边形网壳(测地线对偶) ---------- */
function makeHexShell(radius = 1.12, detail = 4) {
  const ico = new THREE.IcosahedronGeometry(1, detail); const p = ico.attributes.position;
  const key = v => `${v.x.toFixed(4)},${v.y.toFixed(4)},${v.z.toFixed(4)}`;
  const edges = new Map(), cents = [];
  for (let f = 0; f < p.count / 3; f++) {
    const a = new THREE.Vector3().fromBufferAttribute(p, f * 3), b = new THREE.Vector3().fromBufferAttribute(p, f * 3 + 1), c = new THREE.Vector3().fromBufferAttribute(p, f * 3 + 2);
    cents.push(a.clone().add(b).add(c).normalize().multiplyScalar(radius));
    [[a, b], [b, c], [c, a]].forEach(([u, v]) => { const k = [key(u), key(v)].sort().join('|'); (edges.get(k) || edges.set(k, []).get(k)).push(f); });
  }
  const seg = [];
  edges.forEach(fs => { if (fs.length === 2) { const A = cents[fs[0]], B = cents[fs[1]]; seg.push(A.x, A.y, A.z, B.x, B.y, B.z); } });
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(seg, 3));
  const m = new THREE.LineBasicMaterial({ ...add, color: CY, opacity: 0.075 });
  return { obj: new THREE.LineSegments(g, m), mat: m, base: 0.075 };
}

/* ---------- 全息环:分段弧 + 刻度 + 点线轨道 + 三角标 ---------- */
function makeRing(o) {
  const grp = new THREE.Group(), mats = [], base = [];
  const arcPts = (r, a0, a1) => { const pts = [], n = Math.max(8, Math.ceil((a1 - a0) * 60)); for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; pts.push(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r)); } return pts; };
  (o.arcs || []).forEach(([a0, a1, w]) => {
    for (let k = 0; k < (w || 1); k++) {
      const g = new THREE.BufferGeometry().setFromPoints(arcPts(o.r + k * 0.012, a0, a1));
      const m = new THREE.LineBasicMaterial({ ...add, color: k ? WH : CY, opacity: o.op || 0.7 }); mats.push(m); base.push(m.opacity);
      grp.add(new THREE.Line(g, m));
    }
  });
  if (o.ticks) {
    const [a0, a1, cnt, len] = o.ticks, seg = [];
    for (let i = 0; i <= cnt; i++) { const a = a0 + (a1 - a0) * i / cnt, l = (i % 5 ? len : len * 2.2); seg.push(Math.cos(a) * o.r, 0, Math.sin(a) * o.r, Math.cos(a) * (o.r + l), 0, Math.sin(a) * (o.r + l)); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(seg, 3));
    const m = new THREE.LineBasicMaterial({ ...add, color: CY, opacity: 0.5 }); mats.push(m); base.push(0.5); grp.add(new THREE.LineSegments(g, m));
  }
  if (o.dots) {
    const pts = []; for (let i = 0; i < o.dots; i++) { const a = i / o.dots * 6.2832; pts.push(new THREE.Vector3(Math.cos(a) * (o.r + 0.06), 0, Math.sin(a) * (o.r + 0.06))); }
    const m = new THREE.PointsMaterial({ ...add, color: CY, size: 0.018, map: discTex(), opacity: 0.75 }); mats.push(m); base.push(0.75);
    grp.add(new THREE.Points(new THREE.BufferGeometry().setFromPoints(pts), m));
  }
  (o.tris || []).forEach(a => {
    const c = new THREE.Vector3(Math.cos(a) * (o.r + 0.09), 0, Math.sin(a) * (o.r + 0.09)), t = new THREE.Vector3(-Math.sin(a), 0, Math.cos(a)).multiplyScalar(0.035), nrm = c.clone().normalize().multiplyScalar(0.05);
    const g = new THREE.BufferGeometry().setFromPoints([c.clone().add(t), c.clone().sub(t), c.clone().add(nrm), c.clone().add(t)]);
    const m = new THREE.LineBasicMaterial({ ...add, color: WH, opacity: 0.9 }); mats.push(m); base.push(0.9); grp.add(new THREE.Line(g, m));
  });
  const holder = new THREE.Group(); holder.rotation.set(o.tx, 0, o.tz); holder.add(grp);
  return { group: holder, spin: grp, speed: o.speed, mats, base };
}
function makeRings() {
  const P = Math.PI;
  const cfg = [
    { r: 1.32, tx: 1.05, tz: 0.30, speed: 0.22, arcs: [[0, 2.2, 2], [2.5, 3.9], [4.3, 5.9]], ticks: [0.2, 1.9, 40, 0.03], tris: [2.35, 4.1] },
    { r: 1.48, tx: -1.05, tz: -0.42, speed: -0.15, arcs: [[0.4, 3.0], [3.4, 6.0, 2]], dots: 160 },
    { r: 1.62, tx: 0.42, tz: 0.95, speed: 0.11, arcs: [[1.0, 2.6, 2], [3.0, 3.4], [4.0, 5.6]], ticks: [3.9, 5.7, 60, 0.025], tris: [0.6, 2.8] },
    { r: 1.78, tx: 1.12, tz: -0.18, speed: -0.08, dots: 220, arcs: [[5.0, 6.1]] },
    { r: 1.95, tx: -0.62, tz: 0.55, speed: 0.06, arcs: [[0.2, 1.4, 2], [2.0, 2.3], [3.3, 4.8]], ticks: [0.2, 1.4, 36, 0.035], tris: [1.7, 5.2] },
    { r: 2.15, tx: 0.95, tz: -0.75, speed: -0.045, arcs: [[2.2, 4.4]], dots: 300, op: 0.45 },
  ];
  return cfg.map(makeRing);
}

/* ---------- 30 颗知识神经元(按 PS.THEMES 8 层生成;状态 lit 金 / open 青脉动 / lock 暗青 / future 灰) ---------- */
const ST_CODE = { lit: 0, open: 1, lock: 2, future: 3 };
function makeNeurons(layers) {
  const P = [];
  const n = layers.reduce((a, b) => a + b, 0);
  layers.forEach((cnt, L) => {
    const y = 0.62 - L * (1.24 / Math.max(1, layers.length - 1));
    for (let i = 0; i < cnt; i++) {
      const a = (i / cnt) * 6.2832 + L * 0.9, rr = Math.sqrt(Math.max(0.02, 0.62 * 0.62 - y * y * 0.6)) * (0.75 + 0.25 * R());
      P.push(new THREE.Vector3(Math.cos(a) * rr, y + (R() - 0.5) * 0.08, Math.sin(a) * rr));
    }
  });
  const DK = []; P.forEach((p, i) => { const a = i / P.length * 6.2832, r = 1.55 + (i % 3) * 0.32; DK.push(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r)); });
  const g = new THREE.BufferGeometry().setFromPoints(P);
  g.setAttribute('aDisk', new THREE.Float32BufferAttribute(DK.flatMap(v => [v.x, v.y, v.z]), 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(n * 3), 3));
  g.setAttribute('aS', new THREE.Float32BufferAttribute(new Float32Array(n), 1));
  g.setAttribute('aK', new THREE.Float32BufferAttribute(new Float32Array(n), 1));
  const mat = new THREE.ShaderMaterial({ ...add, vertexColors: true,
    uniforms: { uTime: { value: 0 }, uPR: { value: 1 }, uOp: { value: 1 }, uMorph: { value: 0 }, uTilt: { value: new THREE.Matrix3() }, uSpin: { value: 0 } },
    vertexShader: `attribute float aS, aK; attribute vec3 aDisk; uniform float uTime,uPR,uMorph,uSpin; uniform mat3 uTilt; varying vec3 vC; varying float vA;
      vec3 rotY(vec3 p,float a){ float c=cos(a),s=sin(a); return vec3(c*p.x+s*p.z,p.y,-s*p.x+c*p.z); }
      void main(){ float m=uMorph*uMorph*(3.-2.*uMorph); float dr=length(aDisk.xz);
        vec3 dp=uTilt*rotY(aDisk,uTime*0.85*pow(dr,-1.5)); vec3 sp=rotY(position,uSpin);
        vec3 p=mix(sp,dp,m)*(1.-0.6*sin(3.14159*m)); vec4 mv=viewMatrix*vec4(p,1.);
        gl_Position=projectionMatrix*mv;
        float pulse = aK<0.5 ? .85+.15*sin(uTime*2.4+position.x*9.) : (aK<1.5 ? .7+.45*(.5+.5*sin(uTime*3.2+position.y*11.)) : 1.);
        gl_PointSize=uPR*(150.*aS)*pulse/(-mv.z); vC=color; vA=aS; }`,
    fragmentShader: `uniform float uOp; varying vec3 vC; varying float vA;
      void main(){ float d=length(gl_PointCoord-.5); float core=smoothstep(.12,.0,d), halo=smoothstep(.5,.0,d);
        gl_FragColor=vec4(mix(vC,vec3(1.,.97,.9),core*.6)*(1.+vA),(core*1.4+halo*halo*.8)*uOp*vA); }` });
  const pts = new THREE.Points(g, mat); pts.frustumCulled = false;
  // 突触:每颗连最近的 3 颗
  const pairs = [];
  P.forEach((p, i) => { P.map((q, j) => [j, p.distanceTo(q)]).filter(x => x[0] !== i).sort((a, b) => a[1] - b[1]).slice(0, 3).forEach(([j]) => { if (j > i && !pairs.some(e => e[0] === i && e[1] === j)) pairs.push([i, j]); }); });
  const seg = []; pairs.forEach(([i, j]) => seg.push(P[i].x, P[i].y, P[i].z, P[j].x, P[j].y, P[j].z));
  const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(seg, 3)); lg.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(pairs.length * 6), 3));
  const lm = new THREE.LineBasicMaterial({ ...add, vertexColors: true, opacity: 0.7 });
  const lines = new THREE.LineSegments(lg, lm);
  const grp = new THREE.Group(); grp.add(lines, pts);
  const DIM = new THREE.Color(0x2a7fa0), FUT = new THREE.Color(0x56708a);
  function setStates(states) {
    const col = g.attributes.color, sz = g.attributes.aS, kk = g.attributes.aK;
    for (let i = 0; i < n; i++) {
      const st = states[i] || 'future', k = ST_CODE[st] ?? 3;
      const c = k === 0 ? GOLD : k === 1 ? CY : k === 2 ? DIM : FUT;
      col.setXYZ(i, c.r, c.g, c.b); sz.setX(i, [1.5, 1.2, 0.75, 0.5][k]); kk.setX(i, k);
    }
    col.needsUpdate = sz.needsUpdate = kk.needsUpdate = true;
    const lc = lg.attributes.color;
    pairs.forEach(([i, j], e) => {
      const a = states[i], b = states[j];
      const c = (a === 'lit' && b === 'lit') ? GOLD : (a === 'lit' || b === 'lit' || a === 'open' || b === 'open') ? CY : DIM;
      const f = (a === 'lit' && b === 'lit') ? 1 : (c === CY ? 0.6 : 0.25);
      lc.setXYZ(e * 2, c.r * f, c.g * f, c.b * f); lc.setXYZ(e * 2 + 1, c.r * f, c.g * f, c.b * f);
    });
    lc.needsUpdate = true;
  }
  // CPU 端复算位置(与着色器一致),供拾取与标签
  const tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3();
  const rotY = (v, a, out) => { const c = Math.cos(a), s = Math.sin(a); return out.set(c * v.x + s * v.z, v.y, -s * v.x + c * v.z); };
  function worldPos(i, t, morph, tilt, out) {
    const m = morph * morph * (3 - 2 * morph);
    rotY(P[i], t * 0.1, tmp);
    const dr = Math.hypot(DK[i].x, DK[i].z);
    rotY(DK[i], t * 0.85 * Math.pow(dr, -1.5), tmp2).applyMatrix3(tilt);
    return out.copy(tmp).lerp(tmp2, m).multiplyScalar(1 - 0.6 * Math.sin(Math.PI * m));
  }
  return { group: grp, u: mat.uniforms, lineMat: lm, lines, setStates, worldPos, count: n };
}

/* ---------- 核心:辉光 + 同心细环(面向相机) ---------- */
function makeCore() {
  const grp = new THREE.Group();
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ ...add, map: discTex(0.6), color: new THREE.Color(0.55, 0.95, 1.0), opacity: 0.95 }));
  glow.scale.setScalar(0.6); grp.add(glow);
  const glow2 = new THREE.Sprite(new THREE.SpriteMaterial({ ...add, map: discTex(1.6), color: CY, opacity: 0.35 }));
  glow2.scale.setScalar(2.2); grp.add(glow2);
  const bill = new THREE.Group(); grp.add(bill);
  const mats = [];
  [[0.17, 0.9], [0.24, 0.55], [0.32, 0.3]].forEach(([r, op], k) => {
    const pts = []; const gap = k === 1 ? 0.6 : 0; for (let i = 0; i <= 96; i++) { const a = gap + (6.2832 - gap * 2) * i / 96; pts.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, 0)); }
    const m = new THREE.LineBasicMaterial({ ...add, color: k ? CY : WH, opacity: op }); mats.push([m, op]); bill.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), m));
  });
  return { group: grp, bill, glow, glow2, mats };
}

/* ---------- 奇点:黑色视界 + 光子环 ---------- */
function makeHole() {
  const grp = new THREE.Group();
  const mat = new THREE.ShaderMaterial({
    uniforms: { uOp: { value: 0 }, uTime: { value: 0 } },
    vertexShader: `varying vec3 vN, vV, vP; void main(){ vN=normalize(normalMatrix*normal); vec4 mv=modelViewMatrix*vec4(position,1.); vV=normalize(-mv.xyz); vP=position; gl_Position=projectionMatrix*mv; }`,
    fragmentShader: `uniform float uOp,uTime; varying vec3 vN,vV,vP;
      void main(){ float f=1.-max(dot(vN,vV),0.); float rim=pow(f,3.5);
        // 表面极暗的电路纹
        vec2 uv=vec2(atan(vP.z,vP.x)*3.,vP.y*6.); vec2 g=abs(fract(uv*4.)-.5);
        float line=smoothstep(.47,.5,max(g.x,g.y))*step(.6,fract(sin(dot(floor(uv*4.),vec2(12.9,78.2)))*43758.5));
        vec3 c=vec3(.25,.85,1.)*pow(f,7.)*1.2 + vec3(.15,.6,.8)*line*.05*(1.-f);
        gl_FragColor=vec4(c*uOp,1.); }`,
  });
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.86, 64, 48), mat); grp.add(ball);
  const ring = new THREE.Sprite(new THREE.SpriteMaterial({ ...add, map: ringTex(0.44, 0.02), color: new THREE.Color(0.75, 0.97, 1.0), opacity: 0 }));
  ring.scale.setScalar(2.05); grp.add(ring);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ ...add, map: ringTex(0.46, 0.12), color: CY, opacity: 0 }));
  halo.scale.setScalar(2.9); grp.add(halo);
  return { group: grp, ball, mat, ring, halo };
}

/* ---------- v0.8 外围探针节点:随机闪现、跳动,沿连线与核心交换信号(监测 / 学习) ---------- */
function makeProbes(N = 10) {
  const pos = new Float32Array(N * 3), size = new Float32Array(N), col = new Float32Array(N * 3);
  const lp = new Float32Array(N * 6), lc = new Float32Array(N * 6), pp = new Float32Array(N * 3), ps = new Float32Array(N);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aS', new THREE.BufferAttribute(size, 1)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const mat = new THREE.ShaderMaterial({ ...add, vertexColors: true, uniforms: { uPR: { value: 1 }, uOp: { value: 0 } },
    vertexShader: `attribute float aS; uniform float uPR; varying vec3 vC; varying float vA; void main(){ vec4 mv=modelViewMatrix*vec4(position,1.); gl_Position=projectionMatrix*mv; gl_PointSize=uPR*110.*aS/(-mv.z); vC=color; vA=min(1.,aS); }`,
    fragmentShader: `uniform float uOp; varying vec3 vC; varying float vA; void main(){ float d=length(gl_PointCoord-.5); float core=smoothstep(.14,.0,d), halo=smoothstep(.5,.0,d); float ring=smoothstep(.06,.0,abs(d-.33));
      gl_FragColor=vec4(mix(vC,vec3(1.),core*.7)*1.6,(core*1.3+halo*halo*.5+ring*.6)*uOp*vA); }` });
  const pts = new THREE.Points(g, mat); pts.frustumCulled = false;
  const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.BufferAttribute(lp, 3)); lg.setAttribute('color', new THREE.BufferAttribute(lc, 3));
  const lm = new THREE.LineBasicMaterial({ ...add, vertexColors: true, opacity: 0 }); const lines = new THREE.LineSegments(lg, lm); lines.frustumCulled = false;
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pp, 3)); pg.setAttribute('aS', new THREE.BufferAttribute(ps, 1)); pg.setAttribute('color', new THREE.BufferAttribute(new Float32Array(N * 3).fill(1), 3));
  const pulses = new THREE.Points(pg, mat.clone()); pulses.frustumCulled = false;
  const grp = new THREE.Group(); grp.add(lines, pts, pulses);
  const P = [];
  const spawn = (p, t) => { const th = R() * 6.2832, y = (R() - 0.5) * 1.1, r = 1.25 + R() * 0.95; const h = Math.sqrt(Math.max(0, 1 - y * y * 0.4));
    p.d = new THREE.Vector3(Math.cos(th) * h, y * 0.6, Math.sin(th) * h).normalize(); p.r = r; p.t0 = t + R() * 0.6; p.life = 1.4 + R() * 2.6; p.in = R() < 0.6; p.gold = R() < 0.25; p.jit = R() * 10; };
  for (let i = 0; i < N; i++) { const p = {}; spawn(p, -R() * 3); P.push(p); }
  const CYc = new THREE.Color(0x8ff0ff), GDc = new THREE.Color(0xffd27a);
  function update(t, op, pr) {
    mat.uniforms.uOp.value = op; mat.uniforms.uPR.value = pr; pulses.material.uniforms.uOp.value = op; pulses.material.uniforms.uPR.value = pr; lm.opacity = 0.55 * op;
    P.forEach((p, i) => {
      let a = (t - p.t0) / p.life; if (a > 1) { spawn(p, t); a = 0; }
      const vis = a < 0 ? 0 : Math.min(1, a * 8) * Math.min(1, (1 - a) * 6);
      const blink = 0.65 + 0.35 * Math.sin(t * 9 + p.jit) * Math.sin(t * 3.3 + p.jit * 2);
      const flash = a >= 0 && a < 0.12 ? (1 - a / 0.12) * 1.4 : 0;
      const jump = 0.03 * Math.sin(t * 13 + p.jit); // 小幅跳动
      const q = p.d.clone().multiplyScalar(p.r + jump);
      pos.set([q.x, q.y, q.z], i * 3); size[i] = (0.55 * blink + flash) * vis;
      const c = p.gold ? GDc : CYc; col.set([c.r, c.g, c.b], i * 3);
      const s0 = p.d.clone().multiplyScalar(0.78);
      lp.set([q.x, q.y, q.z, s0.x, s0.y, s0.z], i * 6);
      const f = 0.6 * vis; lc.set([c.r * f, c.g * f, c.b * f, c.r * f * 0.2, c.g * f * 0.2, c.b * f * 0.2], i * 6);
      const u = ((t * 1.3 + p.jit) % 1), uu = p.in ? u : 1 - u; const m = q.clone().lerp(s0, uu);
      pp.set([m.x, m.y, m.z], i * 3); ps[i] = 0.35 * vis;
    });
    g.attributes.position.needsUpdate = g.attributes.aS.needsUpdate = g.attributes.color.needsUpdate = true;
    lg.attributes.position.needsUpdate = lg.attributes.color.needsUpdate = true; pg.attributes.position.needsUpdate = pg.attributes.aS.needsUpdate = true;
  }
  return { group: grp, update };
}

/* ---------- 电路冠冕:曼哈顿走线向外,过孔白点,光脉冲外流 ---------- */
function makeCrown() {
  const seg = [], len = [], seed = [], vias = [];
  const N = 78;
  for (let i = 0; i < N; i++) {
    const th = (i / N) * 6.2832 + (R() - 0.5) * 0.03;
    let x = Math.cos(th) * (1.28 + R() * 0.12), y = Math.sin(th) * (1.28 + R() * 0.12);
    const dx = Math.sign(Math.cos(th)) || 1, dy = Math.sign(Math.sin(th)) || 1;
    const horiz = Math.abs(Math.cos(th)) > Math.abs(Math.sin(th));
    let L = 0, s = R(); const steps = 2 + Math.floor(R() * 6), maxR = 2.0 + Math.pow(R(),0.7) * 2.8;
    for (let k = 0; k < steps; k++) {
      const along = (k % 2 === 0) === horiz; // 交替水平/垂直
      const l = (along ? 0.22 + R() * 0.55 : 0.08 + R() * 0.28) * (k % 2 === 0 ? 1 : 1);
      let nx = x, ny = y;
      if ((k % 2 === 0) === horiz) nx += dx * l; else ny += dy * l;
      seg.push(x, y, 0, nx, ny, 0); len.push(L, L + l); seed.push(s, s); L += l;
      if (R() < 0.18) vias.push(nx, ny, 0, 0.6);
      x = nx; y = ny; if (Math.hypot(x, y) > maxR) break;
    }
    vias.push(x, y, 0, 1);
    if (R() < 0.35) { // 分支
      const bx = x - dx * 0.1, l = 0.2 + R() * 0.3; seg.push(bx, y, 0, bx, y + dy * l, 0); len.push(L * 0.8, L * 0.8 + l); seed.push(s, s); vias.push(bx, y + dy * l, 0, 0.8);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(seg, 3)); g.setAttribute('aL', new THREE.Float32BufferAttribute(len, 1)); g.setAttribute('aSeed', new THREE.Float32BufferAttribute(seed, 1));
  const mat = new THREE.ShaderMaterial({ ...add, uniforms: { uTime: { value: 0 }, uOp: { value: 0 } },
    vertexShader: `attribute float aL, aSeed; varying float vL, vS, vR; void main(){ vL=aL; vS=aSeed; vR=length(position.xy); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `uniform float uTime,uOp; varying float vL,vS,vR;
      void main(){ float ph=fract(vL*0.55 - uTime*0.32 + vS*7.); float pulse=smoothstep(.10,0.,abs(ph-.5)-0.0)*1.0;
        float fade=1.-smoothstep(2.2,4.8,vR);
        vec3 c=mix(vec3(.22,.82,1.),vec3(.95,1.,1.),pulse*.7);
        gl_FragColor=vec4(c,(0.14+pulse*0.6)*fade*uOp); }` });
  const lines = new THREE.LineSegments(g, mat);
  const vp = [], vs = []; for (let i = 0; i < vias.length; i += 4) { vp.push(vias[i], vias[i + 1], 0); vs.push(vias[i + 3]); }
  const vg = new THREE.BufferGeometry(); vg.setAttribute('position', new THREE.Float32BufferAttribute(vp, 3)); vg.setAttribute('aS', new THREE.Float32BufferAttribute(vs, 1));
  const vmat = new THREE.ShaderMaterial({ ...add, uniforms: { uOp: { value: 0 }, uPR: { value: 1 }, uTime: { value: 0 } },
    vertexShader: `attribute float aS; uniform float uPR,uTime; varying float vA; void main(){ vec4 mv=modelViewMatrix*vec4(position,1.); gl_Position=projectionMatrix*mv; gl_PointSize=uPR*aS*24./(-mv.z); vA=aS*(.75+.25*sin(uTime*2.+position.x*5.)); }`,
    fragmentShader: `uniform float uOp; varying float vA; void main(){ float d=length(gl_PointCoord-.5); gl_FragColor=vec4(vec3(.92,1.,1.),smoothstep(.5,.15,d)*vA*uOp); }` });
  const dots = new THREE.Points(vg, vmat);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ ...add, map: discTex(1.8), color: new THREE.Color(0.3, 0.85, 1.0), opacity: 0 }));
  glow.scale.setScalar(6.5);
  const grp = new THREE.Group(); const spin = new THREE.Group(); spin.add(lines, dots); grp.add(glow, spin);
  return { group: grp, spin, mat, vmat, glow };
}

/* ---------- 开场用:萤(光点 + 拖尾)与冲击波 ---------- */
function makeFirefly() {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ ...add, map: discTex(0.5), color: new THREE.Color(1.0, 0.88, 0.6), opacity: 0 }));
  s.scale.setScalar(0.12);
  const trailN = 6, tp = new Float32Array(trailN * 3);
  const tg = new THREE.BufferGeometry(); tg.setAttribute('position', new THREE.BufferAttribute(tp, 3));
  const tm = new THREE.PointsMaterial({ ...add, color: new THREE.Color(1, 0.85, 0.55), size: 0.025, map: discTex(), opacity: 0 });
  const trail = new THREE.Points(tg, tm);
  const grp = new THREE.Group(); grp.add(s, trail);
  return { group: grp, s, trail, tp };
}
function makeShock() {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ ...add, map: ringTex(0.47, 0.025), color: new THREE.Color(0.7, 0.96, 1), opacity: 0 }));
  return s;
}

/* ================= 组装 ================= */
export function buildCore(stage, opts = {}) {
  const { scene, camera, tier } = stage;
  const bg = makeBackground(tier); scene.add(bg.group);
  const root = new THREE.Group(); scene.add(root);
  const parts = makeParticles(tier); root.add(parts.obj);
  const plex = makePlexus(tier); root.add(plex.group);
  const hex = makeHexShell(); root.add(hex.obj);
  const rings = makeRings(); rings.forEach(r => root.add(r.group));
  const neu = makeNeurons(opts.layers || [3, 4, 3, 6, 2, 3, 4, 5]); root.add(neu.group); neu.setStates(opts.states || []);
  const core = makeCore(); root.add(core.group);
  const hole = makeHole(); root.add(hole.group); hole.group.visible = false;
  const crown = makeCrown(); root.add(crown.group); crown.group.renderOrder = -1;
  const fly = makeFirefly(); root.add(fly.group);
  const probes = makeProbes(10); root.add(probes.group);
  const shock = makeShock(); root.add(shock);

  const st = { t: 0, intro: opts.skipIntro ? 99 : 0, morph: 0, morphTarget: 0, mx: 0, my: 0, beat: 0 };
  addEventListener('pointermove', e => { st.mx = e.clientX / innerWidth - 0.5; st.my = e.clientY / innerHeight - 0.5; });

  const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const camTmp = new THREE.Vector3();

  function update(dt, freeze) {
    st.t += dt; if (st.intro < 99) st.intro += dt;
    const t = st.t, I = st.intro, pr = stage.renderer.getPixelRatio();
    // 形态变形
    const k = 1 - Math.pow(0.001, dt / 2.4);
    st.morph += (st.morphTarget - st.morph) * (Math.abs(st.morphTarget - st.morph) < 0.002 ? 1 : k);
    const m = st.morph, ms = m * m * (3 - 2 * m);
    // 开场时间线
    const expand = sm(1.5, 4.0, I);
    const ringIn = sm(1.8, 4.6, I);
    const fade = sm(2.2, 4.4, I);
    st.beat = Math.max(Math.pow(Math.max(0, Math.sin(t * 2.2)), 8), st.amp || 0, st.burst || 0); if (st.burst) st.burst = Math.max(0, st.burst - dt * 0.8);

    parts.u.uTime.value = t; parts.u.uMorph.value = m; parts.u.uExpand.value = expand; parts.u.uPR.value = pr; parts.u.uBeat.value = st.beat;
    bg.update(t, pr);

    const coreOp = (1 - ms);
    plex.group.rotation.y = t * 0.058; plex.mats.forEach((mm, i) => mm.opacity = plex.base[i] * fade * coreOp);
    plex.group.scale.setScalar(Math.max(0.001, expand * (1 - 0.7 * Math.sin(Math.PI * ms)) ));
    hex.obj.rotation.y = -t * 0.02; hex.mat.opacity = hex.base * fade * coreOp; hex.obj.scale.setScalar(0.6 + 0.4 * ringIn);
    rings.forEach((r, i) => {
      const spinBoost = (1 - ringIn) * 6 * (i % 2 ? -1 : 1);
      r.spin.rotation.y += dt * (r.speed + spinBoost * 0.3);
      const sc = Math.max(0.001, ringIn * (1 - 0.5 * ms));
      r.group.scale.setScalar(sc);
      r.mats.forEach((mm, j) => mm.opacity = r.base[j] * ringIn * coreOp);
    });
    neu.u.uSpin.value = t * 0.1; neu.u.uTime.value = t; neu.u.uPR.value = pr; neu.u.uMorph.value = m; neu.u.uTilt.value = parts.u.uTilt.value; neu.lines.rotation.y = t * 0.1;
    probes.update(t, sm(4.4, 5.6, I) * Math.pow(coreOp, 3), pr);
    neu.u.uOp.value = sm(3.2, 4.6, I); neu.u.uTilt.value = parts.u.uTilt.value; neu.lineMat.opacity = 0.7 * sm(3.4, 5.0, I) * coreOp;
    // 核心
    core.bill.quaternion.copy(camera.quaternion);
    core.bill.children.forEach((c, i) => c.rotation.z = t * (i % 2 ? -0.6 : 0.4));
    const coreIn = sm(1.4, 3.0, I);
    core.glow.material.opacity = (0.5 + 0.25 * st.beat) * coreIn * (1 - ms * 0.9);
    core.glow.scale.setScalar(0.55 + 0.1 * st.beat);
    core.glow2.material.opacity = 0.16 * coreIn * (1 - ms);
    core.mats.forEach(([mm, op]) => mm.opacity = op * sm(2.5, 4.2, I) * coreOp);
    // 奇点
    const hIn = sm(0.35, 0.95, m);
    hole.group.visible = hIn > 0.001;
    hole.group.scale.setScalar(Math.max(0.001, hIn));
    hole.mat.uniforms.uOp.value = hIn; hole.ring.material.opacity = 1.0 * hIn; hole.halo.material.opacity = 0.18 * hIn;
    // 视界遮罩:投影黑球中心与半径到屏幕
    if (stage.holeMask) {
      const hm = stage.holeMask.uniforms, c = new THREE.Vector3(0, 0, 0).project(camera);
      const dcam = camera.position.length(), rr = 0.86 * hIn;
      const ang = Math.asin(Math.min(0.99, rr / dcam)), half = THREE.MathUtils.degToRad(camera.fov / 2);
      hm.uC.value.set(c.x * 0.5 + 0.5, c.y * 0.5 + 0.5); hm.uR.value = hIn > 0.01 ? Math.tan(ang) / Math.tan(half) * 0.5 : 0; hm.uAsp.value = camera.aspect;
    }
    // 冠冕(始终面向相机,缓慢自转)
    crown.group.quaternion.copy(camera.quaternion);
    crown.spin.rotation.z = t * 0.025;
    const cIn = sm(0.5, 1.0, m);
    crown.group.visible = cIn > 0.001;
    crown.mat.uniforms.uTime.value = t; crown.mat.uniforms.uOp.value = cIn; crown.vmat.uniforms.uOp.value = cIn; crown.vmat.uniforms.uPR.value = pr; crown.vmat.uniforms.uTime.value = t;
    crown.glow.material.opacity = 0.12 * cIn;
    crown.group.scale.setScalar(0.85 + 0.15 * cIn);
    // 萤光点(0–1.8s)
    const flyA = sm(0.1, 0.6, I) * (1 - sm(1.6, 2.2, I));
    fly.s.material.opacity = flyA; fly.trail.material.opacity = flyA * 0.8;
    const fp = (x) => new THREE.Vector3(-0.7 * (1 - sm(0, 1.6, x)) + 0.03 * Math.sin(x * 5), 0.25 * (1 - sm(0, 1.6, x)) + 0.03 * Math.cos(x * 4), 0);
    const p0 = fp(I); fly.s.position.copy(p0); fly.s.scale.setScalar(0.1 + 0.25 * sm(1.2, 1.8, I));
    for (let i = 0; i < 6; i++) { const q = fp(Math.max(0, I - 0.09 * (i + 1))); fly.tp.set([q.x + 0.02 * i, q.y - 0.025 * i, q.z], i * 3); }
    fly.trail.geometry.attributes.position.needsUpdate = true;
    // 冲击波(4.0–5.3s)
    const sw = sm(4.0, 5.3, I); shock.material.opacity = sw > 0 && sw < 1 ? Math.pow(1 - sw, 2) * 0.45 : 0; shock.scale.setScalar(1.0 + sw * 6.5);
    // 相机:开场推近 + 自动环绕 + 鼠标视差
    const fit = camera.userData.fit || 1;
    const dist = (7.4 + (1 - sm(0, 5.5, I)) * 2.2 + ms * 1.4) * fit;
    const az = t * 0.035 + st.mx * 0.35, el = 0.08 + st.my * 0.18 + ms * 0.06;
    camTmp.set(Math.sin(az) * Math.cos(el) * dist, Math.sin(el) * dist, Math.cos(az) * Math.cos(el) * dist);
    camera.position.lerp(camTmp, freeze ? 1 : 0.08); camera.lookAt(0, 0, 0);
  }

  return {
    update,
    state: st,
    setMorph(v) { st.morphTarget = v; },
    skipIntro() { st.intro = 99; },
    replay() { st.intro = 0; },
    jump(intro, morph) { st.intro = intro; st.morph = st.morphTarget = morph; },
    setStates: neu.setStates,
    neuronCount: neu.count,
    project(i, out) { // 返回 CSS 像素坐标 {x,y,z(缩放),back}
      const v = neu.worldPos(i, st.t, st.morph, parts.u.uTilt.value, new THREE.Vector3());
      const d = v.distanceTo(camera.position), c = camera.position.length();
      const back = d > c + 0.05;
      v.project(camera);
      const r = stage.renderer.domElement.getBoundingClientRect();
      out.x = r.left + (v.x * 0.5 + 0.5) * r.width; out.y = r.top + (-v.y * 0.5 + 0.5) * r.height; out.z = Math.max(0.6, Math.min(1.3, 7.4 / d)); out.back = back;
      return out;
    },
  };
}
