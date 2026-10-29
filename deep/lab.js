/* 深空层 V3 · 坠入实验舱(对照 门户2.0概念/深空概念图02_实验舱_电影写实)
 * 场景:环形舱(立柱+上下环带+舷窗外真实银河影像)、全息投影台(彩色光锥+台面光环)、中央全息舞台:
 *       当前卡片实验台的计算结果画成发光 3D 曲线(A 对照为暗影曲线),外绕粒子环。
 * 只在 /deep/ 使用;懒加载,打开时才建场景。 */
export function createLab(THREE, { mob = false, tex } = {}) {
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(mob ? 62 : 48, 1, .1, 1200);
  cam.position.set(0, 1.2, mob ? 26 : 21);
  const U = { uT: { value: 0 } };
  const ld = new THREE.TextureLoader();
  // 舷窗外:真实银河全景(ESO,与开场同一素材)
  const skyT = ld.load("assets/v1/sky-milkyway.webp"); skyT.colorSpace = THREE.SRGBColorSpace;
  const sky = new THREE.Mesh(new THREE.SphereGeometry(500, 48, 24), new THREE.MeshBasicMaterial({ map: skyT, side: THREE.BackSide, color: 0x9aa4b8 }));
  sky.rotation.set(.35, 2.2, .2); scene.add(sky);
  // 舱体
  const hull = new THREE.MeshStandardMaterial({ color: 0x0b1015, metalness: .85, roughness: .38 });
  const hull2 = new THREE.MeshStandardMaterial({ color: 0x141b22, metalness: .7, roughness: .5 });
  const R = 30, A0 = -2.35, A1 = 2.35;
  const band = (y0, y1, mat) => { const g = new THREE.CylinderGeometry(R, R, y1 - y0, 96, 1, true); const m = new THREE.Mesh(g, mat); m.material.side = THREE.BackSide; m.position.y = (y0 + y1) / 2; scene.add(m); return m; };
  band(-7, -3.2, hull); band(9.5, 16, hull);
  const glowLine = (y, op) => { const m = new THREE.Mesh(new THREE.TorusGeometry(R - .3, .05, 6, 240), new THREE.MeshBasicMaterial({ color: 0x7fe3ff, transparent: true, opacity: op })); m.rotation.x = Math.PI / 2; m.position.y = y; scene.add(m); };
  glowLine(-3.25, .55); glowLine(9.45, .3);
  for (let i = 0; i < 10; i++) { const a = (i + .5) * Math.PI * 2 / 10; const p = new THREE.Mesh(new THREE.BoxGeometry(2.6, 13, 1.6), hull2); p.position.set(Math.sin(a) * (R - .5), 3.2, -Math.cos(a) * (R - .5)); p.rotation.y = -a; scene.add(p);
    const e = new THREE.Mesh(new THREE.BoxGeometry(.08, 11, .08), new THREE.MeshBasicMaterial({ color: 0x7fe3ff, transparent: true, opacity: .35 })); e.position.copy(p.position).multiplyScalar(.985); e.position.y = 3.2; e.rotation.y = -a; scene.add(e); }
  // 地板(暗金属,微反光)+ 同心光环
  const floor = new THREE.Mesh(new THREE.CircleGeometry(R, 96), new THREE.MeshStandardMaterial({ color: 0x06090c, metalness: .9, roughness: .22 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -6.2; scene.add(floor);
  [[9.5, .5], [13.5, .25], [19, .12]].forEach(([r, o]) => { const m = new THREE.Mesh(new THREE.RingGeometry(r, r + .06, 128), new THREE.MeshBasicMaterial({ color: 0x9ff0ff, transparent: true, opacity: o, side: THREE.DoubleSide })); m.rotation.x = -Math.PI / 2; m.position.y = -6.18; scene.add(m); });
  // 天花环
  const ceil = new THREE.Mesh(new THREE.TorusGeometry(7, .9, 16, 96), hull2); ceil.rotation.x = Math.PI / 2; ceil.position.y = 15; scene.add(ceil);
  const ceilG = new THREE.Mesh(new THREE.TorusGeometry(5.6, .06, 6, 96), new THREE.MeshBasicMaterial({ color: 0x9ff0ff, transparent: true, opacity: .45 })); ceilG.rotation.x = Math.PI / 2; ceilG.position.y = 14.4; scene.add(ceilG);
  // 灯光
  scene.add(new THREE.AmbientLight(0x2a3846, .7));
  const pl = new THREE.PointLight(0x9fe8ff, 60, 40, 1.6); pl.position.set(0, -3, 0); scene.add(pl);
  const pl2 = new THREE.PointLight(0xffc28a, 30, 50, 1.6); pl2.position.set(0, 4, 2); scene.add(pl2);
  const rim = new THREE.DirectionalLight(0x6f8cff, .6); rim.position.set(-10, 12, -8); scene.add(rim);
  // 投影台
  const ped = new THREE.Mesh(new THREE.CylinderGeometry(5.2, 6, 1.1, 64), hull2); ped.position.y = -5.65; scene.add(ped);
  const ped2 = new THREE.Mesh(new THREE.CylinderGeometry(4.3, 4.6, .5, 64), hull); ped2.position.y = -4.85; scene.add(ped2);
  const vtx = `varying vec2 vUv;varying vec3 vP;void main(){vUv=uv;vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
  const rainbow = `vec3 rb(float h){return clamp(abs(mod(h*6.+vec3(0.,4.,2.),6.)-3.)-1.,0.,1.);}`;
  const disc = new THREE.Mesh(new THREE.CircleGeometry(4.2, 96), new THREE.ShaderMaterial({ uniforms: U, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: vtx, fragmentShader: `uniform float uT;varying vec2 vUv;${rainbow}void main(){vec2 q=vUv*2.-1.;float r=length(q),a=atan(q.y,q.x);
 float rings=pow(.5+.5*sin(r*46.-uT*2.),18.)*.7+pow(.5+.5*sin(r*13.+uT*.7),30.)*.6;float sp=.5+.5*sin(a*24.+uT*1.3);
 vec3 c=mix(vec3(.55,.95,1.),rb(a/6.283+uT*.03),.55)*(rings*(.6+.4*sp))+vec3(.4,.9,1.)*exp(-pow((r-.98)/.02,2.));
 gl_FragColor=vec4(c*smoothstep(1.,.9,r),1.);}` }));
  disc.rotation.x = -Math.PI / 2; disc.position.y = -4.58; scene.add(disc);
  const cone = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 3.9, 7.2, 96, 1, true), new THREE.ShaderMaterial({ uniforms: U, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    vertexShader: vtx, fragmentShader: `uniform float uT;varying vec2 vUv;${rainbow}void main(){float y=vUv.y;float st=pow(.5+.5*sin(vUv.x*6.283*18.+sin(vUv.x*40.)*.6),3.);
 float fl=.65+.35*sin(y*9.-uT*3.+vUv.x*30.);vec3 c=rb(vUv.x*2.+uT*.02)*.65+.35;
 gl_FragColor=vec4(c*st*fl*pow(1.-y,1.6)*.42,1.);}` }));
  cone.position.y = -1.0; scene.add(cone);
  // 全息舞台:曲线 + 粒子环 + 中心光核
  const holo = new THREE.Group(); holo.position.y = 3.4; scene.add(holo);
  const coreS = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: 0xffc68a, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); coreS.scale.setScalar(2.2); holo.add(coreS);
  const ringPts = (n, rad, tilt, col) => { const p = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const a = Math.random() * 6.283, rr = rad * (1 + (Math.random() - .5) * .18); p[i * 3] = Math.cos(a) * rr; p[i * 3 + 1] = (Math.random() - .5) * .35; p[i * 3 + 2] = Math.sin(a) * rr; }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(p, 3)); const m = new THREE.Points(g, new THREE.PointsMaterial({ size: .09, map: tex, color: col, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); m.rotation.set(tilt, 0, tilt * .4); holo.add(m); return m; };
  const rings = [ringPts(mob ? 900 : 2200, 7.2, .32, 0xbfe9ff), ringPts(mob ? 500 : 1200, 5.6, 1.25, 0xe6d2ff)];
  const curveG = new THREE.Group(); holo.add(curveG);
  const COL = [0xe8c27a, 0x7fb2ff, 0xff9a9a, 0x7fe3a8];
  const tubeMat = (c, o) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o, blending: THREE.AdditiveBlending, depthWrite: false });
  let lastA = null, lastB = null;
  let BB = null, EQ = false;
  function bounds(list) { let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity; list.forEach((S) => S.pts.forEach(([x, y]) => { if (isFinite(x) && isFinite(y)) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); } })); return isFinite(x0) ? [x0, x1, y0, y1] : null; }
  function build(series, ghost) {
    if (!BB) return [];
    let [x0, x1, y0, y1] = BB; if (x1 === x0) x1 = x0 + 1; if (y1 === y0) y1 = y0 + 1;
    let W = mob ? 8 : 11, H = mob ? 6 : 6.4; const out = [];
    if (EQ) { const sc = Math.min(W / (x1 - x0), H / (y1 - y0)); W = (x1 - x0) * sc; H = (y1 - y0) * sc; }
    series.forEach((S, k) => {
      const v = S.pts.filter(([x, y]) => isFinite(x) && isFinite(y)).map(([x, y]) => new THREE.Vector3((x - x0) / (x1 - x0) * W - W / 2, (y - y0) / (y1 - y0) * H - H / 2, 0));
      if (v.length < 2) return; const step = Math.max(1, Math.floor(v.length / 160)); const vv = v.filter((_, i) => i % step === 0); if (vv[vv.length - 1] !== v[v.length - 1]) vv.push(v[v.length - 1]);
      const path = new THREE.CatmullRomCurve3(vv); const segs = Math.min(400, vv.length * 3);
      const c = COL[k % 4];
      const m1 = new THREE.Mesh(new THREE.TubeGeometry(path, segs, ghost ? .03 : .045, 6, false), tubeMat(ghost ? 0x8fa0c4 : c, ghost ? .35 : 1));
      out.push(m1);
      if (!ghost) out.push(new THREE.Mesh(new THREE.TubeGeometry(path, segs, .16, 6, false), tubeMat(c, .16)));
    });
    // 坐标框(全息细线)
    if (!ghost) { const f = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(W + .6, H + .6)), new THREE.LineBasicMaterial({ color: 0x9ff0ff, transparent: true, opacity: .25 })); out.push(f); }
    return out;
  }
  function setSeries(series, aSeries, eq) {
    EQ = !!eq; BB = bounds([...(series || []), ...(aSeries || [])]);
    while (curveG.children.length) { const o = curveG.children.pop(); o.geometry.dispose(); o.material.dispose(); }
    lastB = series; lastA = aSeries || null;
    if (aSeries) build(aSeries, true).forEach((m) => { m.position.z = -.25; curveG.add(m); });
    build(series || [], false).forEach((m) => curveG.add(m));
    coreS.visible = !(series && series.length);
  }
  function resize(w, h) { cam.aspect = w / h; cam.fov = w / h < .8 ? 66 : 48; cam.position.z = w / h < .8 ? 27 : 21; cam.updateProjectionMatrix(); }
  function update(t, tint) {
    U.uT.value = t; rings[0].rotation.y = t * .05; rings[1].rotation.y = -t * .07;
    curveG.rotation.y = Math.sin(t * .25) * .32; curveG.position.y = Math.sin(t * .8) * .08;
    cam.position.x = Math.sin(t * .11) * .8; cam.lookAt(0, 1.6, 0);
    if (tint) { coreS.material.color.set(tint); }
  }
  return { scene, cam, setSeries, resize, update, get A() { return lastA; }, get B() { return lastB; } };
}
