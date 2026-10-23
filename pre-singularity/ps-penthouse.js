/* 奇点前夜 Pre-Singularity · v0.9 R2「全息屏墙」顶层套房场景 ps-penthouse.js
   - 视角:都市最高楼顶层;环形落地窗外是 3D 城市夜景(程序化窗灯、车流、楼顶航标灯),远处偶有客机飞过。
   - 天命之瞳外加一组光环(独立 group,不改 ps-lobby3d.js 的任何光效)。
   - 性能:high 全量;mid 楼群减半、无车流;low 不加载本模块(回落 2D)。减少动态:无客机、城市静止。
   Three.js r169 本地自带(vendor/,MIT)。 */
import * as THREE from 'three';

function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

const ROOM_R = 16, FLOOR_Y = -2.4, CEIL_Y = 5.6;   // 套房:环形落地窗半径、地板、天花
const GROUND_Y = -110;                               // 城市地面(我们在最高楼顶层)
const HORIZON = new THREE.Color(0x0e2a3c);          // 雾 / 地平线色(黎明前青蓝)

/* ---------- 天空球:黎明前渐变 + 一抹橙色地平线 + 稀疏星点 ---------- */
function makeSky() {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { uFade: { value: 0 }, uTime: { value: 0 }, uDawn: { value: 0 } },
    vertexShader: `varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `uniform float uFade,uTime,uDawn; varying vec3 vD;
      float h(vec3 p){ return fract(sin(dot(p,vec3(12.9898,78.233,37.719)))*43758.5453); }
      void main(){
        float y = vD.y;
        vec3 zen = vec3(0.008,0.020,0.042), mid = vec3(0.022,0.066,0.105), hor = vec3(0.045,0.130,0.185);
        // v0.9.3 黎明天色:uDawn = 已过关/29;深夜 → 泛蓝 → 蓝调 → 橙红一线(太阳留给终章)
        float d1 = smoothstep(0.0,0.6,uDawn), d2 = smoothstep(0.55,1.0,uDawn);
        zen = mix(zen, vec3(0.012,0.030,0.060), d1); zen = mix(zen, vec3(0.030,0.060,0.105), d2);
        mid = mix(mid, vec3(0.032,0.088,0.135), d1); mid = mix(mid, vec3(0.085,0.105,0.150), d2);
        hor = mix(hor, vec3(0.060,0.150,0.205), d1); hor = mix(hor, vec3(0.260,0.150,0.100), d2);
        vec3 c = mix(hor, mid, smoothstep(0.0, 0.18, y)); c = mix(c, zen, smoothstep(0.15, 0.7, y));
        // 黎明:固定方位的一抹暖橙(朝 -Z 偏右)
        float az = dot(normalize(vD.xz+1e-4), normalize(vec2(0.55,-1.0)));
        float dawn = pow(max(0.,az),6.) * exp(-abs(y-0.01)*28.);
        float gk = 0.55 + 0.7*d2;
        c += vec3(0.55,0.24,0.08) * dawn * gk + vec3(0.20,0.10,0.05)*pow(max(0.,az),3.)*exp(-abs(y)*(9.-4.*d2))*(0.35+0.5*d2);
        c += vec3(0.95,0.55,0.25) * pow(max(0.,az),14.) * exp(-abs(y-0.02)*60.) * 0.5 * smoothstep(0.85,1.0,uDawn);
        // 地平线下:远处城市光雾
        if(y < 0.0) c = mix(hor*1.05, mix(vec3(0.03,0.05,0.07), vec3(0.05,0.055,0.065), d2), smoothstep(0.0,-0.25,y));
        // 星点
        vec3 q = floor(vD*420.); float s = h(q); float tw = 0.6+0.4*sin(uTime*1.7+s*40.);
        c += vec3(0.6,0.8,1.0) * step(0.9975, s) * smoothstep(0.08,0.5,y) * tw * 0.5 * (1.-smoothstep(0.35,0.75,uDawn));
        gl_FragColor = vec4(c*uFade, 1.);
      }`
  });
  const m = new THREE.Mesh(new THREE.SphereGeometry(2200, 48, 24), mat);
  m.renderOrder = -10; m.frustumCulled = false;
  return { obj: m, mat };
}

/* ---------- 楼群:InstancedMesh + 着色器程序化窗灯 ---------- */
function makeCity(count, seed = 7) {
  const r = rng(seed);
  const geo = new THREE.BoxGeometry(1, 1, 1); geo.translate(0, 0.5, 0);
  const mat = new THREE.ShaderMaterial({
    uniforms: { uFade: { value: 0 }, uTime: { value: 0 }, uFog: { value: HORIZON.clone() }, uDawn: { value: 0 } },
    vertexShader: `attribute float aSeed; varying vec3 vW; varying vec3 vN; varying float vS; varying vec3 vL;
      void main(){ vec4 w = modelMatrix * instanceMatrix * vec4(position,1.); vW = w.xyz; vS = aSeed;
        vN = normalize(mat3(modelMatrix*instanceMatrix)*normal); vL = position;
        gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `uniform float uFade,uTime,uDawn; uniform vec3 uFog; varying vec3 vW; varying vec3 vN; varying float vS; varying vec3 vL;
      float h(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
      void main(){
        vec3 c = mix(vec3(0.010,0.016,0.026), vec3(0.024,0.030,0.040), smoothstep(0.4,1.,uDawn));
        if(abs(vN.y) < 0.5){
          float u = abs(vN.x) > 0.5 ? vW.z : vW.x;
          vec2 cell = vec2(floor(u/2.6), floor((vW.y+110.)/3.3));
          vec2 f = vec2(fract(u/2.6), fract((vW.y+110.)/3.3));
          float win = step(0.18,f.x)*step(f.x,0.82)*step(0.25,f.y)*step(f.y,0.78);
          float k = h(cell + vS*91.7);
          float slow = floor(uTime/7. + k*13.);                      // 窗灯缓慢随机明灭
          float on = step(mix(0.58,0.88,smoothstep(0.,1.,uDawn)), h(cell*1.7 + vS*13. + slow*0.37));   // 窗灯 ~42% → ~12%
          vec3 lc = mix(vec3(1.0,0.72,0.38), vec3(0.62,0.86,1.0), step(0.72,k));  // 暖黄为主,少量冷白
          lc = mix(lc, vec3(1.0,0.92,0.78), step(0.93,k));
          c += lc * win * on * (0.28 + 0.22*k);
        } else { c = mix(vec3(0.016,0.022,0.032), vec3(0.040,0.042,0.050), smoothstep(0.5,1.,uDawn)); }
        float d = length(vW.xz);
        float fog = 1. - exp(-pow(d/1500., 1.6));
        c = mix(c, uFog*0.9, clamp(fog,0.,0.92));
        gl_FragColor = vec4(c*uFade, 1.);
      }`
  });
  const mesh = new THREE.InstancedMesh(geo, mat, count);
  const seeds = new Float32Array(count), M = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3();
  const tall = [];
  for (let i = 0; i < count; i++) {
    // 环带分布:近处稀、中远处密;留出一条河(-Z 偏右,对着黎明)
    let a, d;
    for (;;) {
      a = r() * Math.PI * 2; d = 330 + Math.pow(r(), 0.75) * 1400;
      const rx = Math.sin(a) * d, rz = Math.cos(a) * d;
      const riv = Math.abs(rx * 0.88 + rz * 0.48 - 120 * Math.sin(d / 260));
      if (riv > 46) break;
    }
    const x = Math.sin(a) * d, z = Math.cos(a) * d;
    const core = Math.exp(-Math.pow((d - 560) / 360, 2));         // CBD 环更高
    const hgt = Math.min(72, 8 + Math.pow(r(), 2.2) * 40 + core * r() * 30);   // 楼顶都远低于我们(y≈-38 以下)
    const w = 7 + r() * 13, dep = 7 + r() * 13;
    p.set(x, GROUND_Y, z); q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.round(a / (Math.PI / 2)) * Math.PI / 2 + (r() - 0.5) * 0.1);
    s.set(w, hgt, dep); M.compose(p, q, s); mesh.setMatrixAt(i, M); seeds[i] = r();
    if (hgt > 54) tall.push(new THREE.Vector3(x, GROUND_Y + hgt + 1.2, z));
  }
  mesh.geometry.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seeds, 1));
  mesh.frustumCulled = false;
  return { obj: mesh, mat, tall };
}

/* ---------- 楼顶红色航标灯(闪烁) ---------- */
function makeBeacons(list) {
  const n = Math.min(list.length, 140), pos = new Float32Array(n * 3), ph = new Float32Array(n);
  for (let i = 0; i < n; i++) { pos.set([list[i].x, list[i].y, list[i].z], i * 3); ph[i] = Math.random() * 6.28; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aPh', new THREE.BufferAttribute(ph, 1));
  const mat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uFade: { value: 0 }, uTime: { value: 0 }, uPR: { value: 1 } },
    vertexShader: `attribute float aPh; uniform float uTime,uPR; varying float vA;
      void main(){ vec4 mv = modelViewMatrix*vec4(position,1.); vA = pow(max(0.,sin(uTime*1.6+aPh)),6.);
        gl_PointSize = (3.0+4.0*vA)*uPR; gl_Position = projectionMatrix*mv; }`,
    fragmentShader: `uniform float uFade; varying float vA; void main(){ float d=length(gl_PointCoord-.5); float a=smoothstep(.5,0.,d);
      gl_FragColor = vec4(vec3(1.0,0.16,0.10)*(0.25+1.1*vA), a*uFade); }` });
  const pts = new THREE.Points(g, mat); pts.frustumCulled = false;
  return { obj: pts, mat };
}

/* ---------- 路网车流(流动光点:白色车头、红色尾灯) ---------- */
function makeTraffic(count, seed = 11) {
  const r = rng(seed);
  const a0 = new Float32Array(count * 3), dir = new Float32Array(count * 3), info = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const lane = Math.round((r() * 2 - 1) * 24) * 62 + (r() < 0.5 ? -1.6 : 1.6);
    const along = r() < 0.5;
    const L = 3000;
    a0.set(along ? [-L / 2, GROUND_Y + 0.6, lane] : [lane, GROUND_Y + 0.6, -L / 2], i * 3);
    const sgn = r() < 0.5 ? 1 : -1;
    dir.set(along ? [sgn, 0, 0] : [0, 0, sgn], i * 3);
    info.set([r() * L, 8 + r() * 10, r() < 0.5 ? 0 : 1], i * 3);   // offset, speed, 0=车头白 1=尾灯红
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(a0, 3));
  g.setAttribute('aDir', new THREE.BufferAttribute(dir, 3));
  g.setAttribute('aInfo', new THREE.BufferAttribute(info, 3));
  const mat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uFade: { value: 0 }, uTime: { value: 0 }, uPR: { value: 1 } },
    vertexShader: `attribute vec3 aDir; attribute vec3 aInfo; uniform float uTime,uPR; varying float vK; varying float vF;
      void main(){ float L=3000.; float s = mod(aInfo.x + uTime*aInfo.y, L);
        vec3 p = position + aDir*s; if(aDir.x+aDir.z < 0.) p = position + aDir*(s-L);
        float d = length(p.xz); vF = smoothstep(320.,420.,d) * (1.-smoothstep(1300.,1600.,d));
        vK = aInfo.z; vec4 mv = modelViewMatrix*vec4(p,1.);
        gl_PointSize = clamp(260./-mv.z, 1., 3.) * uPR; gl_Position = projectionMatrix*mv; }`,
    fragmentShader: `uniform float uFade; varying float vK; varying float vF;
      void main(){ float d=length(gl_PointCoord-.5); float a=smoothstep(.5,.1,d);
        vec3 c = mix(vec3(1.0,0.90,0.70)*0.55, vec3(1.0,0.18,0.08)*0.5, vK);
        gl_FragColor = vec4(c, a*vF*uFade); }` });
  const pts = new THREE.Points(g, mat); pts.frustumCulled = false;
  return { obj: pts, mat };
}

/* ---------- 客机:远处横穿,红(左)/绿(右)航行灯 + 白色频闪 ---------- */
function makePlane() {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(4 * 3), 3));
  g.setAttribute('aCol', new THREE.BufferAttribute(new Float32Array([1, .12, .08, .1, 1, .35, 1, 1, 1, .9, .95, 1]), 3));
  g.setAttribute('aK', new THREE.BufferAttribute(new Float32Array([0, 0, 1, 2]), 1));
  const mat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uOp: { value: 0 }, uTime: { value: 0 }, uPR: { value: 1 } },
    vertexShader: `attribute vec3 aCol; attribute float aK; uniform float uTime,uPR; varying vec3 vC; varying float vA;
      void main(){ vec4 mv = modelViewMatrix*vec4(position,1.); vC = aCol;
        float strobe = step(0.92, fract(uTime*0.9)) + step(0.92, fract(uTime*0.9+0.12));
        vA = aK < 0.5 ? 0.85 : (aK < 1.5 ? (0.08+1.6*strobe) : 0.10);   // 航行灯常亮;频闪;机身微光
        gl_PointSize = (aK > 1.5 ? 2.2 : 3.4) * uPR; gl_Position = projectionMatrix*mv; }`,
    fragmentShader: `uniform float uOp; varying vec3 vC; varying float vA;
      void main(){ float d=length(gl_PointCoord-.5); float a=smoothstep(.5,0.,d); gl_FragColor = vec4(vC*vA, a*uOp); }` });
  const pts = new THREE.Points(g, mat); pts.frustumCulled = false;
  const st = { on: false, t: 0, dur: 40, wait: 6 + Math.random() * 10, a: new THREE.Vector3(), b: new THREE.Vector3() };
  const P = g.attributes.position, tmp = new THREE.Vector3(), side = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  function spawn() {
    const ang = Math.random() * Math.PI * 2, d = 650 + Math.random() * 500, y = 28 + Math.random() * 46;
    const c = new THREE.Vector3(Math.sin(ang) * d, y, Math.cos(ang) * d);
    const t = new THREE.Vector3(Math.cos(ang), (Math.random() - 0.5) * 0.04, -Math.sin(ang)).multiplyScalar(Math.random() < .5 ? 1 : -1);
    const half = 520 + Math.random() * 220;
    st.a.copy(c).addScaledVector(t, -half); st.b.copy(c).addScaledVector(t, half);
    st.dur = 34 + Math.random() * 22; st.t = 0; st.on = true;
  }
  function update(dt, time, allow, fade) {
    mat.uniforms.uTime.value = time;
    if (!st.on) { mat.uniforms.uOp.value = 0; if (!allow) return; st.wait -= dt; if (st.wait <= 0) spawn(); return; }
    st.t += dt; const k = st.t / st.dur;
    if (k >= 1) { st.on = false; st.wait = 25 + Math.random() * 35; return; }
    tmp.lerpVectors(st.a, st.b, k);
    const fwd = side.subVectors(st.b, st.a).normalize(); const wing = new THREE.Vector3().crossVectors(fwd, up).normalize().multiplyScalar(1.6);
    P.setXYZ(0, tmp.x - wing.x, tmp.y, tmp.z - wing.z);  // 左翼红
    P.setXYZ(1, tmp.x + wing.x, tmp.y, tmp.z + wing.z);  // 右翼绿
    P.setXYZ(2, tmp.x, tmp.y - 0.4, tmp.z);              // 机腹频闪
    P.setXYZ(3, tmp.x - fwd.x * 1.2, tmp.y, tmp.z - fwd.z * 1.2);
    P.needsUpdate = true;
    mat.uniforms.uOp.value = fade * sm(0, 0.06, k) * (1 - sm(0.94, 1, k));
  }
  return { obj: pts, mat, update, state: st };
}

/* ---------- 套房:落地窗竖梃、地板(核心青光倒影)、天花灯带 ---------- */
function makeRoom() {
  const group = new THREE.Group();
  const dark = new THREE.MeshBasicMaterial({ color: 0x020407, transparent: true, opacity: 1 });
  const N = 28, h = CEIL_Y - FLOOR_Y;
  const mg = new THREE.BoxGeometry(0.16, h, 0.32);
  const mull = new THREE.InstancedMesh(mg, dark, N), M = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(1, 1, 1), p = new THREE.Vector3();
  for (let i = 0; i < N; i++) { const a = i / N * Math.PI * 2; p.set(Math.sin(a) * ROOM_R, FLOOR_Y + h / 2, Math.cos(a) * ROOM_R); q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), a); M.compose(p, q, s); mull.setMatrixAt(i, M); }
  mull.frustumCulled = false; group.add(mull);
  // 窗台与顶梁
  const sill = new THREE.Mesh(new THREE.CylinderGeometry(ROOM_R + 0.2, ROOM_R + 0.2, 0.5, 96, 1, true), dark); sill.position.y = FLOOR_Y + 0.25; group.add(sill);
  const head = new THREE.Mesh(new THREE.CylinderGeometry(ROOM_R + 0.2, ROOM_R + 0.2, 0.7, 96, 1, true), dark); head.position.y = CEIL_Y - 0.35; group.add(head);
  // 地板:深色反光,中心核心青光 + 窗边城市暖光反射
  const floorMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: true,
    uniforms: { uFade: { value: 0 }, uBeat: { value: 0 }, uCore: { value: 1 }, uTime: { value: 0 } },
    vertexShader: `varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `uniform float uFade,uBeat,uCore,uTime; varying vec2 vP;
      void main(){ float r = length(vP);
        vec3 c = vec3(0.008,0.013,0.020);
        c += vec3(0.20,0.75,0.95) * exp(-r*r/5.5) * (0.07+0.04*uBeat) * uCore;     // 核心倒影
        c += vec3(0.30,0.80,1.0) * exp(-pow((r-2.1)*3.,2.)) * 0.015 * uCore;
        float edge = smoothstep(ROOM_R-6.,ROOM_R,r);
        float a = atan(vP.y,vP.x); float streak = 0.5+0.5*sin(a*140.+uTime*0.05);
        c += vec3(0.35,0.28,0.20) * edge * 0.05 * streak + vec3(0.06,0.16,0.22)*edge*0.06;   // 窗外光反射
        gl_FragColor = vec4(c*uFade, 1.); }`.replace(/ROOM_R/g, ROOM_R.toFixed(1)) });
  const floor = new THREE.Mesh(new THREE.CircleGeometry(ROOM_R + 0.2, 96), floorMat);
  floor.rotation.x = -Math.PI / 2; floor.position.y = FLOOR_Y; group.add(floor);
  // 天花 + 灯槽青色细线
  const ceil = new THREE.Mesh(new THREE.CircleGeometry(ROOM_R + 0.2, 96), new THREE.MeshBasicMaterial({ color: 0x03060a, side: THREE.DoubleSide, transparent: true }));
  ceil.rotation.x = Math.PI / 2; ceil.position.y = CEIL_Y; group.add(ceil);
  const cove = new THREE.Mesh(new THREE.TorusGeometry(ROOM_R - 0.6, 0.025, 6, 160), new THREE.MeshBasicMaterial({ color: 0x5fe6ff, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false }));
  cove.rotation.x = Math.PI / 2; cove.position.y = CEIL_Y - 0.75; group.add(cove);
  return { group, floorMat, cove, darkMats: [dark, ceil.material] };
}

/* ---------- 天命之瞳外加光环(独立 group,不改原有光效) ---------- */
function makeHalo() {
  const group = new THREE.Group(); group.rotation.set(0.24, 0, -0.1); group.userData.base = 0.74;   // 外加光环整体尺寸(相对核心)
  const add = (THREEobj) => { group.add(THREEobj); return THREEobj; };
  const blend = { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide };
  const mats = [];
  const ringA = add(new THREE.Mesh(new THREE.RingGeometry(1.94, 1.955, 256), new THREE.MeshBasicMaterial({ color: 0x7fe9ff, opacity: 0.55, ...blend }))); mats.push([ringA.material, 0.55]);
  const ringB = add(new THREE.Mesh(new THREE.RingGeometry(2.16, 2.168, 256), new THREE.MeshBasicMaterial({ color: 0x5fe6ff, opacity: 0.35, ...blend }))); mats.push([ringB.material, 0.35]);
  // 刻度环:240 根,每 10 根一长
  const tk = [], R0 = 2.24;
  for (let i = 0; i < 240; i++) { const a = i / 240 * Math.PI * 2, L = i % 10 === 0 ? 0.09 : (i % 5 === 0 ? 0.05 : 0.025);
    tk.push(Math.cos(a) * R0, Math.sin(a) * R0, 0, Math.cos(a) * (R0 + L), Math.sin(a) * (R0 + L), 0); }
  const tg = new THREE.BufferGeometry(); tg.setAttribute('position', new THREE.Float32BufferAttribute(tk, 3));
  const ticks = add(new THREE.LineSegments(tg, new THREE.LineBasicMaterial({ color: 0x9ff0ff, opacity: 0.45, ...blend }))); mats.push([ticks.material, 0.45]);
  // 扫描弧:亮弧 + 余辉
  const scan = new THREE.Group(); group.add(scan);
  const arc = new THREE.Mesh(new THREE.RingGeometry(2.03, 2.07, 96, 1, 0, Math.PI / 3.2), new THREE.MeshBasicMaterial({ color: 0xbff6ff, opacity: 0.7, ...blend })); scan.add(arc); mats.push([arc.material, 0.7]);
  const tail = new THREE.Mesh(new THREE.RingGeometry(2.03, 2.07, 96, 1, Math.PI / 3.2, Math.PI / 2.2), new THREE.MeshBasicMaterial({ color: 0x5fe6ff, opacity: 0.18, ...blend })); scan.add(tail); mats.push([tail.material, 0.18]);
  // 第二扫描:反向细弧(竖直倾斜的副环)
  const sub = new THREE.Group(); sub.rotation.set(Math.PI / 2 - 0.35, 0.5, 0); group.add(sub);
  const ringC = new THREE.Mesh(new THREE.RingGeometry(2.42, 2.428, 256, 1, 0, Math.PI * 1.55), new THREE.MeshBasicMaterial({ color: 0x5fe6ff, opacity: 0.22, ...blend })); sub.add(ringC); mats.push([ringC.material, 0.22]);
  // 三角标:4 个,沿外环慢行
  const triG = new THREE.BufferGeometry(); triG.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, -0.035, 0.07, 0, 0.035, 0.07, 0], 3));
  const tris = new THREE.Group(); group.add(tris);
  for (let i = 0; i < 4; i++) { const m = new THREE.Mesh(triG, new THREE.MeshBasicMaterial({ color: 0xeaffff, opacity: 0.8, ...blend })); const a = i * Math.PI / 2;
    m.position.set(Math.cos(a) * 2.36, Math.sin(a) * 2.36, 0); m.rotation.z = a - Math.PI / 2; tris.add(m); mats.push([m.material, 0.8]); }
  return { group, mats, scan, sub, tris, ringC };
}

export function buildPenthouse(stage, core, opts = {}) {
  const { scene, camera, tierName } = stage;
  const high = tierName === 'high';
  const reduce = !!opts.reduce;
  camera.far = 3000; camera.updateProjectionMatrix();

  const sky = makeSky(); scene.add(sky.obj);
  const T = stage.tier || {};
  const nCity = T.city || (high ? 4200 : 2100);
  const city = makeCity(nCity); scene.add(city.obj);
  const bea = makeBeacons(city.tall); scene.add(bea.obj);
  const nTraffic = T.traffic ?? (high ? 5200 : 0);
  const traffic = nTraffic ? makeTraffic(nTraffic) : null; if (traffic) scene.add(traffic.obj);
  // v0.9.2 自动降档第 2 步:关车流、城市楼群减到 55%
  stage.onDegrade && stage.onDegrade(lv => { if (lv !== 2) return; if (traffic) traffic.obj.visible = false; city.obj.count = Math.floor(nCity * 0.55); });
  const plane = makePlane(); scene.add(plane.obj);
  const room = makeRoom(); scene.add(room.group);
  const halo = makeHalo(); scene.add(halo.group);
  if (core.bg && core.bg.group) core.bg.group.visible = false;   // 套房开启时隐藏原星云背景(背景,不属天命之瞳光效)

  // v0.9.3 黎明天色
  const FOG0 = HORIZON.clone(), FOG1 = new THREE.Color(0x2c2a33);
  const dw = { cur: 0, from: 0, to: 0, k: 1 };
  function applyDawn(p) {
    sky.mat.uniforms.uDawn.value = p; city.mat.uniforms.uDawn.value = p;
    city.mat.uniforms.uFog.value.copy(FOG0).lerp(FOG1, Math.pow(p, 1.6));
  }
  function setDawn(p, animate) {
    p = Math.max(0, Math.min(1, +p || 0));
    if (!animate || reduce) { dw.cur = dw.to = dw.from = p; dw.k = 1; applyDawn(p); return; }
    dw.from = dw.cur; dw.to = p; dw.k = 0;
  }
  let t = 0;
  function update(dt) {
    if (dw.k < 1) { dw.k = Math.min(1, dw.k + dt / 3); const e = dw.k * dw.k * (3 - 2 * dw.k); dw.cur = dw.from + (dw.to - dw.from) * e; applyDawn(dw.cur); }
    const s = core.state, pr = stage.renderer.getPixelRatio();
    if (!reduce) t += dt;
    const I = s.intro, m = s.morph, ms = m * m * (3 - 2 * m);
    const env = sm(4.4, 6.4, I);                     // 开场末段:城市与套房亮起
    sky.mat.uniforms.uFade.value = env; sky.mat.uniforms.uTime.value = t;
    city.mat.uniforms.uFade.value = env; city.mat.uniforms.uTime.value = t;
    bea.mat.uniforms.uFade.value = env; bea.mat.uniforms.uTime.value = t; bea.mat.uniforms.uPR.value = pr;
    if (traffic) { traffic.mat.uniforms.uFade.value = env; traffic.mat.uniforms.uTime.value = t; traffic.mat.uniforms.uPR.value = pr; }
    plane.mat.uniforms.uPR.value = pr; plane.update(reduce ? 0 : dt, t, !reduce && env > 0.99, env);
    room.floorMat.uniforms.uFade.value = env; room.floorMat.uniforms.uBeat.value = s.beat || 0; room.floorMat.uniforms.uCore.value = 1 - 0.7 * ms; room.floorMat.uniforms.uTime.value = t;
    room.cove.material.opacity = 0.45 * env;
    // 外加光环:天命之瞳形态可见,奇点形态收起
    const hIn = sm(4.6, 6.0, I) * (1 - ms);
    halo.group.visible = hIn > 0.002;
    halo.mats.forEach(([mm, op]) => mm.opacity = op * hIn);
    halo.group.scale.setScalar(halo.group.userData.base * (0.92 + 0.08 * hIn));
    halo.scan.rotation.z = -t * 0.55;
    halo.tris.rotation.z = t * 0.06;
    halo.ringC.rotation.z = -t * 0.12;
    halo.sub.rotation.y = 0.5 + t * 0.05;
  }
  return { update, plane, setDawn, dawn: () => dw.cur };
}
