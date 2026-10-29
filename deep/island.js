/* 深空层 V4 · 核素岛(对照 门户2.0概念/深空概念图03_核素岛_电影写实)
 * 真实数据:IAEA Live Chart of Nuclides 基态表快照(data/nuclides.json,3355 个核素,Z×N、B/A、半衰期)。
 * 地形:每个核素一根柱,横轴 N、纵深 Z,高度 = 每核子结合能 B/A × 寿命系数(短命核素沉入「不稳定之海」);
 * 稳定核素=金白亮点;幻数网格线;Z≈114–120、N≈184 的「稳定岛」为理论预言(示意);
 * 双中子星并合 r 过程:金色重元素雨落到富中子一侧(示意,桥接天枢 T7)。只在 /deep/ 使用,懒加载。 */
export async function createIsland(THREE, { mob = false, tex } = {}) {
  const J = await (await fetch("data/nuclides.json")).json();
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x02040a, .0065);
  const cam = new THREE.PerspectiveCamera(mob ? 64 : 46, 1, .1, 2000);
  const U = { uT: { value: 0 } };
  const S = .55, NX = 92, ZX = 60; // 原点居中:N≈92、Z≈60
  const px = (n) => (n - NX) * S, pz = (z) => -(z - ZX) * S * 1.25;
  // 天空
  const ld = new THREE.TextureLoader();
  const skyT = ld.load("assets/v1/sky-milkyway.webp"); skyT.colorSpace = THREE.SRGBColorSpace;
  const sky = new THREE.Mesh(new THREE.SphereGeometry(900, 48, 24), new THREE.MeshBasicMaterial({ map: skyT, side: THREE.BackSide, color: 0x8c96ad, fog: false }));
  sky.rotation.set(.1, 1.1, -.15); scene.add(sky);
  // 不稳定之海
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(420, 420, 1, 1), new THREE.ShaderMaterial({ uniforms: U, transparent: true, depthWrite: false,
    vertexShader: `varying vec3 vW;void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`,
    fragmentShader: `uniform float uT;varying vec3 vW;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
float fb(vec2 p){float s=0.,a=.5;for(int i=0;i<5;i++){s+=a*n(p);p=p*2.03+vec2(uT*.05,-uT*.03);a*=.5;}return s;}
void main(){vec2 p=vW.xz*.06;float w=fb(p+fb(p*1.7+uT*.04)*1.6);float rg=1.-abs(w*2.-1.);float foam=pow(rg,14.)*.55+pow(1.-abs(fb(p*2.6-uT*.03)*2.-1.),22.)*.35;
 vec3 c=mix(vec3(.006,.012,.024),vec3(.04,.065,.10),w)+vec3(.6,.72,.85)*foam*.45;float d=length(vW.xz);
 gl_FragColor=vec4(c,(.92-smoothstep(120.,200.,d)*.9));}` }));
  sea.rotation.x = -Math.PI / 2; sea.position.y = 1.6; scene.add(sea);
  // 地形:实例化柱
  const d = J.d, n = d.length;
  const geo = new THREE.BoxGeometry(S * .92, 1, S * 1.25 * .92); geo.translate(0, .5, 0);
  const mat = new THREE.MeshStandardMaterial({ metalness: .35, roughness: .45, emissive: 0xffffff, emissiveIntensity: .0 });
  mat.onBeforeCompile = (sh) => { sh.fragmentShader = sh.fragmentShader.replace("#include <emissivemap_fragment>", "#include <emissivemap_fragment>\n totalEmissiveRadiance = vColor.rgb*.42;"); };
  const inst = new THREE.InstancedMesh(geo, mat, n);
  const m4 = new THREE.Matrix4(), col = new THREE.Color(), tops = [], topC = [];
  const life = (lg) => lg >= 99 ? 1 : lg <= -99 ? .3 : Math.min(1, Math.max(.3, .3 + (lg + 8) / 30 * .7));
  const H = (ba, lg) => Math.max(.15, ba * 1.05 * life(lg));
  for (let i = 0; i < n; i++) { const [z, nn, ba, lg] = d[i]; const h = H(ba, lg);
    m4.makeScale(1, h, 1); m4.setPosition(px(nn), 0, pz(z)); inst.setMatrixAt(i, m4);
    if (lg >= 99) col.setRGB(1, .82, .5); else if (lg <= -99) col.setRGB(.12, .16, .22); else { const k = Math.min(1, Math.max(0, (lg + 6) / 22)); col.setRGB(.15 + .7 * k * k, .35 + .4 * k, .75 - .35 * k); }
    inst.setColorAt(i, col);
    if (lg >= 99 || lg > 7) { tops.push(px(nn), h + .12, pz(z)); topC.push(lg >= 99 ? 1 : .8, lg >= 99 ? .9 : .6, lg >= 99 ? .65 : .35); } }
  scene.add(inst);
  const tg = new THREE.BufferGeometry(); tg.setAttribute("position", new THREE.Float32BufferAttribute(tops, 3)); tg.setAttribute("color", new THREE.Float32BufferAttribute(topC, 3));
  scene.add(new THREE.Points(tg, new THREE.PointsMaterial({ size: mob ? 1.1 : .9, map: tex, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })));
  // 幻数线
  const MAG = [8, 20, 28, 50, 82, 126], lm = new THREE.LineBasicMaterial({ color: 0x9ff0ff, transparent: true, opacity: .22 }), lv = [];
  MAG.forEach((m) => { lv.push(px(m), 1.7, pz(0), px(m), 1.7, pz(124)); if (m <= 82) lv.push(px(0), 1.7, pz(m), px(190), 1.7, pz(m)); });
  const lg2 = new THREE.BufferGeometry(); lg2.setAttribute("position", new THREE.Float32BufferAttribute(lv, 3)); scene.add(new THREE.LineSegments(lg2, lm));
  // 稳定岛(理论预言,示意):Z≈114–120,N≈184
  const isl = new THREE.Group(); isl.position.set(px(184), 1.6, pz(116)); scene.add(isl);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(4.2, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x3a2410, emissive: 0xff8a3c, emissiveIntensity: .35, roughness: .6 }));
  dome.scale.y = .45; isl.add(dome);
  { const p = []; for (let i = 0; i < 520; i++) { const a = Math.random() * 6.283, r = Math.sqrt(Math.random()) * 4; p.push(Math.cos(a) * r, Math.sqrt(Math.max(0, 1 - (r / 4.2) ** 2)) * 1.9 + .1, Math.sin(a) * r); }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(p, 3)); isl.add(new THREE.Points(g, new THREE.PointsMaterial({ size: .5, map: tex, color: 0xffb070, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }))); }
  // 双中子星并合 + r 过程金雨
  const bns = new THREE.Group(); bns.position.set(px(150), 46, pz(40)); scene.add(bns);
  const ns = [0, 1].map(() => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: 0xf2f6ff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); s.scale.setScalar(7); bns.add(s); return s; });
  const swirl = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.ShaderMaterial({ uniforms: U, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
    vertexShader: `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: `uniform float uT;varying vec2 vUv;void main(){vec2 q=vUv*2.-1.;float r=length(q),a=atan(q.y,q.x);float s=pow(.5+.5*sin(a*2.-log(r+.02)*6.+uT*2.),5.);
 gl_FragColor=vec4(vec3(.7,.8,1.)*s*smoothstep(1.,.15,r)*smoothstep(.0,.2,r)*.55,1.);}` }));
  bns.add(swirl);
  const rN = mob ? 1400 : 3200, rp = new Float32Array(rN * 3), rs = new Float32Array(rN);
  const rich = {}; d.forEach(([z, nn]) => { if (z >= 26 && z <= 92 && (!rich[z] || nn > rich[z])) rich[z] = nn; });
  const RZ = Object.keys(rich).map(Number);
  for (let i = 0; i < rN; i++) { const z = RZ[(Math.random() * RZ.length) | 0], nn = rich[z] - Math.random() * 14; rp[i * 3] = px(nn); rp[i * 3 + 1] = Math.random(); rp[i * 3 + 2] = pz(z); rs[i] = .3 + Math.random() * .7; }
  const rg = new THREE.BufferGeometry(); rg.setAttribute("position", new THREE.BufferAttribute(rp, 3)); rg.setAttribute("sp", new THREE.BufferAttribute(rs, 1));
  const rain = new THREE.Points(rg, new THREE.ShaderMaterial({ uniforms: { ...U, uSrc: { value: bns.position.clone() }, uMap: { value: tex }, uPx: { value: mob ? 16 : 22 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `uniform float uT,uPx;uniform vec3 uSrc;attribute float sp;varying float vA;void main(){float k=fract(position.y+uT*.09*sp);vec3 g=vec3(position.x,2.,position.z);
 vec3 p=mix(uSrc,g,k);p.y+=sin(k*3.1416)*18.;vA=smoothstep(0.,.08,k)*(1.-smoothstep(.9,1.,k));vec4 mv=modelViewMatrix*vec4(p,1.);gl_PointSize=uPx*(.4+.6*sp)/-mv.z*10.;gl_Position=projectionMatrix*mv;}`,
    fragmentShader: `uniform sampler2D uMap;varying float vA;void main(){vec4 t=texture2D(uMap,gl_PointCoord);gl_FragColor=vec4(vec3(1.,.78,.38)*t.a*vA,1.);}` }));
  rain.frustumCulled = false; scene.add(rain);
  // 光
  scene.add(new THREE.AmbientLight(0x4a5a74, .9));
  const sun = new THREE.DirectionalLight(0xffe2c0, 1.4); sun.position.set(30, 60, 20); scene.add(sun);
  const rim = new THREE.DirectionalLight(0x6f8cff, .8); rim.position.set(-40, 20, -60); scene.add(rim);
  // 相机:拖拽环绕、滚轮缩放
  const orb = { yaw: -.55, pitch: .62, dist: mob ? 150 : 118, ty: 0 }, tgt = new THREE.Vector3(px(70), 4, pz(45));
  function placeCam(t) { const yw = orb.yaw + Math.sin(t * .05) * .04; cam.position.set(tgt.x + Math.sin(yw) * Math.cos(orb.pitch) * orb.dist, tgt.y + Math.sin(orb.pitch) * orb.dist, tgt.z + Math.cos(yw) * Math.cos(orb.pitch) * orb.dist); cam.lookAt(tgt); }
  // 拾取
  const ray = new THREE.Raycaster(), v2 = new THREE.Vector2();
  function pick(x, y, w, h) { v2.set(x / w * 2 - 1, -y / h * 2 + 1); ray.setFromCamera(v2, cam); const hit = ray.intersectObject(inst, false)[0]; if (!hit) return null; const [z, nn, ba, lg] = d[hit.instanceId]; return { z, n: nn, a: z + nn, ba, lg, sym: J.sym[z] || "?" }; }
  const anchors = { fe: new THREE.Vector3(px(30), H(8.79, 99) + 2, pz(26)), isl: isl.position.clone().add(new THREE.Vector3(0, 6, 0)), r: bns.position.clone().add(new THREE.Vector3(0, 8, 0)), pb: new THREE.Vector3(px(126), H(7.87, 99) + 2, pz(82)) };
  function resize(w, h) { cam.aspect = w / h; cam.fov = w / h < .8 ? 66 : 46; cam.updateProjectionMatrix(); }
  function update(t) { U.uT.value = t; ns[0].position.set(Math.cos(t * 1.7) * 3, 0, Math.sin(t * 1.7) * 3); ns[1].position.copy(ns[0].position).multiplyScalar(-1); swirl.lookAt(cam.position); swirl.rotation.z = t * .3; placeCam(t); }
  return { scene, cam, update, resize, pick, orb, anchors, count: n, src: J.src };
}
