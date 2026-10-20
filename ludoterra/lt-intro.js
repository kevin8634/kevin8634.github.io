/* 觉弈 v0.20 · 进入星球动画 方案 A「跃迁坠落」(Three.js + WebGL)
   首访约 4 秒,老玩家约 1.5 秒;可跳过;减少动态时只淡入;不支持 WebGL 时直接淡入。 */
const KEY = 'gn:lt:warp_seen';
export async function playIntro() {
  const el = document.getElementById('intro'); if (!el) return;
  const done = () => { el.classList.add('out'); setTimeout(() => el.remove(), 700); };
  let seen = false; try { seen = localStorage.getItem(KEY) === '1'; } catch (_) {}
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return done();
  let THREE; try { THREE = await import('./vendor/three.module.min.js'); } catch (_) { return done(); }
  const cv = document.createElement('canvas'); el.prepend(cv);
  let R; try { R = new THREE.WebGLRenderer({ canvas: cv, antialias: true }); } catch (_) { return done(); }
  const mob = innerWidth < 700, DPR = Math.min(devicePixelRatio || 1, mob ? 1.5 : 1.5);
  R.setPixelRatio(DPR); R.setSize(innerWidth, innerHeight); R.setClearColor(0x02030a, 1);
  const S = new THREE.Scene(), C = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, .1, 2000);
  /* 星光跃迁:线段从远处冲向镜头,速度越快拖尾越长 */
  const N = mob ? 700 : 1400, pos = new Float32Array(N * 6), col = new Float32Array(N * 6), st = [];
  for (let i = 0; i < N; i++) { const a = Math.random() * Math.PI * 2, r = 4 + Math.random() * 60;
    st.push({ x: Math.cos(a) * r, y: Math.sin(a) * r, z: -Math.random() * 900 });
    const w = Math.random() < .3 ? [1, .85, .55] : [.75, .85, 1]; for (let k = 0; k < 2; k++) col.set(w.map(v => v * (k ? .15 : 1)), i * 6 + k * 3); }
  const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); lg.setAttribute('color', new THREE.BufferAttribute(col, 3));
  S.add(new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending })));
  /* 星球:深蓝球体 + 金色菲涅尔边缘 + 流动经纬金线 */
  const pm = new THREE.ShaderMaterial({ uniforms: { t: { value: 0 }, f: { value: 0 } }, transparent: true,
    vertexShader: 'varying vec3 vN,vV;varying vec2 vU;void main(){vU=uv;vec4 m=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-m.xyz);gl_Position=projectionMatrix*m;}',
    fragmentShader: `uniform float t,f;varying vec3 vN,vV;varying vec2 vU;
      void main(){float fr=pow(1.-max(dot(vN,vV),0.),2.5);float lam=.25+.75*max(dot(vN,normalize(vec3(-.5,.6,.6))),0.);
      float lat=smoothstep(.04,.0,abs(fract(vU.y*9.)-.5)-.46);float lon=smoothstep(.03,.0,abs(fract(vU.x*16.+t*.05)-.5)-.47);
      float fl=pow(.5+.5*sin(vU.x*40.-t*3.+vU.y*20.),8.);
      vec3 c=vec3(.03,.06,.16)*lam+vec3(1.,.78,.4)*(fr*1.4+(lat+lon)*.35*(.4+fl))+vec3(1.,.9,.6)*fl*.15;
      gl_FragColor=vec4(mix(c,vec3(1.,.93,.75),f),1.);}` });
  const P = new THREE.Mesh(new THREE.SphereGeometry(10, 64, 48), pm); P.position.z = -420; S.add(P);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(15, .12, 8, 160), new THREE.MeshBasicMaterial({ color: 0xf5c26b, transparent: true, opacity: .8 }));
  ring.rotation.x = 1.25; P.add(ring);
  const T = seen ? 1.5 : 4.0; let t0 = performance.now(), last = t0, stop = false;
  const skip = () => { if (stop) return; stop = true; try { localStorage.setItem(KEY, '1'); } catch (_) {} done(); R.dispose(); };
  el.querySelector('.skip').onclick = skip; el.addEventListener('pointerdown', skip); addEventListener('keydown', skip, { once: true });
  addEventListener('resize', () => { R.setSize(innerWidth, innerHeight); C.aspect = innerWidth / innerHeight; C.updateProjectionMatrix(); });
  const ease = x => x * x * (3 - 2 * x), cl = x => Math.min(1, Math.max(0, x));
  (function frame(now) { if (stop) return; const dt = Math.min(.05, (now - last) / 1000); last = now; const u = (now - t0) / 1000 / T;
    if (u >= 1) return skip();
    const sp = 80 + 900 * ease(cl(u / .5)) * (1 - .7 * ease(cl((u - .6) / .3)));  // 先加速跃迁,接近星球时减速
    for (let i = 0; i < N; i++) { const s = st[i]; s.z += sp * dt * (seen ? 2.2 : 1); if (s.z > 5) s.z -= 900;
      const L = Math.min(sp * .06, 60); pos.set([s.x, s.y, s.z, s.x, s.y, s.z - L], i * 6); }
    lg.attributes.position.needsUpdate = true;
    const k = ease(cl((u - .25) / .7)); P.position.z = -420 + 408 * k; P.position.y = -2 * (1 - k); P.rotation.y = now / 3000; ring.rotation.z = now / 1800;
    pm.uniforms.t.value = now / 1000; pm.uniforms.f.value = ease(cl((u - .82) / .18));
    C.position.y = -1.5 * ease(cl((u - .7) / .3)); C.lookAt(0, -2, -100);
    R.render(S, C); requestAnimationFrame(frame); })(t0);
}
