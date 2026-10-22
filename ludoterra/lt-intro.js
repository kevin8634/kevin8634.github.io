/* 觉弈 v0.21 · 进入星球动画 方案 A「跃迁坠落」细化版(Three.js + WebGL)
   流程:星光跃迁 → 金环星球(八域色带 + 云层 + 大气辉光)迎面靠近 → 镜头穿云 → 鎏金闪光落到星盘。
   开场和弦:一个基音的八个泛音逐个进入(对应八域),浏览器允许出声且未主动关音乐时才响。
   首访约 5.5 秒,老玩家约 1.6 秒;可跳过;减少动态时只淡入;不支持 WebGL 时直接淡入。 */
const KEY = 'gn:lt:warp_seen';
const NOISE = `
float h3(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float n3(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);
  return mix(mix(mix(h3(i),h3(i+vec3(1,0,0)),f.x),mix(h3(i+vec3(0,1,0)),h3(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(h3(i+vec3(0,0,1)),h3(i+vec3(1,0,1)),f.x),mix(h3(i+vec3(0,1,1)),h3(i+vec3(1,1,1)),f.x),f.y),f.z);}
float fbm(vec3 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*n3(p);p=p*2.03+1.7;a*=.5;}return v;}`;
const VS = 'varying vec3 vN,vV,vP;void main(){vP=position;vec4 m=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-m.xyz);gl_Position=projectionMatrix*m;}';

function chord(T) {
  try {
    if (localStorage.getItem('gn:lt:sound') !== 'true') return null;   // 声音默认关:关时无声
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
    const ac = new AC(); if (ac.state !== 'running') { ac.close(); return null; }
    const now = ac.currentTime, M = ac.createGain(), lp = ac.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 2400; M.connect(lp); lp.connect(ac.destination);
    M.gain.setValueAtTime(0, now); M.gain.linearRampToValueAtTime(.16, now + .4);
    for (let n = 1; n <= 8; n++) {   // 一个音的八个泛音 = 八域
      const o = ac.createOscillator(), g = ac.createGain(), at = now + T * .75 * (n - 1) / 8;
      o.type = 'sine'; o.frequency.value = 110 * n; o.detune.value = (Math.random() - .5) * 6;
      g.gain.setValueAtTime(0, now); g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(.5 / n, at + .35);
      o.connect(g); g.connect(M); o.start(now); o.stop(now + T + 3.2);
    }
    return { end() { const t = ac.currentTime; M.gain.cancelScheduledValues(t); M.gain.setValueAtTime(M.gain.value, t); M.gain.linearRampToValueAtTime(0, t + 2.6); setTimeout(() => ac.close(), 3000); } };
  } catch (_) { return null; }
}

export async function playIntro(force = false) {
  let el = document.getElementById('intro');
  if (!el && force) { el = document.createElement('div'); el.id = 'intro'; el.setAttribute('aria-hidden', 'true'); el.innerHTML = '<button class="skip lt-btn" type="button">跳过 ›</button>'; document.body.appendChild(el); }
  if (!el) return;
  const done = () => { el.classList.add('out'); setTimeout(() => el.remove(), 700); };
  let seen = false; try { seen = !force && localStorage.getItem(KEY) === '1'; } catch (_) {}
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return done();
  let THREE; try { THREE = await import('./vendor/three.module.min.js'); } catch (_) { return done(); }
  const cv = document.createElement('canvas'); el.prepend(cv);
  let R; try { R = new THREE.WebGLRenderer({ canvas: cv, antialias: true }); } catch (_) { return done(); }
  const mob = innerWidth < 700, DPR = Math.min(devicePixelRatio || 1, 1.5);
  R.setPixelRatio(DPR); R.setSize(innerWidth, innerHeight); R.setClearColor(0x02030a, 1);
  const S = new THREE.Scene(), C = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, .1, 2000);

  /* 1 星光跃迁:线段从远处冲向镜头,速度越快拖尾越长 */
  const N = mob ? 700 : 1400, pos = new Float32Array(N * 6), col = new Float32Array(N * 6), st = [];
  for (let i = 0; i < N; i++) { const a = Math.random() * Math.PI * 2, r = 4 + Math.random() * 60;
    st.push({ x: Math.cos(a) * r, y: Math.sin(a) * r, z: -Math.random() * 900 });
    const w = Math.random() < .3 ? [1, .85, .55] : [.75, .85, 1]; for (let k = 0; k < 2; k++) col.set(w.map(v => v * (k ? .15 : 1)), i * 6 + k * 3); }
  const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); lg.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const lineM = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending });
  S.add(new THREE.LineSegments(lg, lineM));

  /* 2 星球:八域纬向色带(噪声扭曲)+ 金色经纬细线 + 城市般的金色光点;另加云层与大气辉光 */
  const U = { t: { value: 0 }, f: { value: 0 } };
  const pm = new THREE.ShaderMaterial({ uniforms: U, vertexShader: VS, fragmentShader: `uniform float t,f;varying vec3 vN,vV,vP;${NOISE}
    vec3 band(float k){k=fract(k)*8.;
      vec3 c[8];c[0]=vec3(.10,.13,.30);c[1]=vec3(.20,.14,.07);c[2]=vec3(.06,.16,.22);c[3]=vec3(.24,.16,.08);
      c[4]=vec3(.08,.10,.24);c[5]=vec3(.22,.19,.11);c[6]=vec3(.05,.12,.18);c[7]=vec3(.28,.23,.15);
      int i=int(floor(k));vec3 a=c[0],b=c[1];for(int j=0;j<8;j++){if(j==i){a=c[j];b=c[j==7?0:j+1];}}return mix(a,b,smoothstep(.75,1.,fract(k)));}
    void main(){vec3 p=normalize(vP);float w=fbm(p*3.+vec3(t*.02,0,0));
      vec3 base=band(p.y*.5+.5+(w-.5)*.22);float d=fbm(p*9.);base*=(.6+.45*d)*.75;
      vec3 L=normalize(vec3(-.5,.55,.65));float lam=max(dot(vN,L),0.);float night=1.-smoothstep(-.1,.15,dot(vN,L));
      float city=step(.83,fbm(p*28.))*night;float fr=pow(1.-max(dot(vN,vV),0.),3.);
      float lat=smoothstep(0.,.035,abs(fract((p.y*.5+.5)*8.)-.5)-.465);
      vec3 c=base*(.18+.95*lam)+vec3(1.,.78,.4)*(fr*1.1+lat*.55+city*.9)+vec3(1.,.85,.55)*pow(max(dot(reflect(-L,vN),vV),0.),24.)*.35;
      gl_FragColor=vec4(mix(c,vec3(1.,.9,.68),f),1.);}` });
  const P = new THREE.Group(); P.position.z = -420; S.add(P);
  const ball = new THREE.Mesh(new THREE.SphereGeometry(10, mob ? 48 : 72, mob ? 36 : 54), pm); P.add(ball);
  const cm = new THREE.ShaderMaterial({ uniforms: U, vertexShader: VS, transparent: true, depthWrite: false, fragmentShader: `uniform float t,f;varying vec3 vN,vV,vP;${NOISE}
    void main(){vec3 p=normalize(vP);float c=smoothstep(.58,.82,fbm(p*4.+vec3(0,t*.03,t*.05)));
      float lam=.3+.7*max(dot(vN,normalize(vec3(-.5,.55,.65))),0.);gl_FragColor=vec4(vec3(1.,.95,.85)*lam,c*.32*(1.-f));}` });
  const cloud = new THREE.Mesh(new THREE.SphereGeometry(10.25, mob ? 48 : 72, mob ? 36 : 54), cm); P.add(cloud);
  const am = new THREE.ShaderMaterial({ uniforms: U, vertexShader: VS, transparent: true, depthWrite: false, side: THREE.BackSide, blending: THREE.AdditiveBlending,
    fragmentShader: 'uniform float f;varying vec3 vN,vV;void main(){float k=pow(clamp(-dot(vN,vV),0.,1.),2.4);gl_FragColor=vec4(vec3(1.,.78,.42)*k*1.8,1.);}' });
  P.add(new THREE.Mesh(new THREE.SphereGeometry(11.0, 48, 36), am));
  const ring = new THREE.Mesh(new THREE.TorusGeometry(15, .1, 8, 180), new THREE.MeshBasicMaterial({ color: 0xf5c26b, transparent: true, opacity: .8 }));
  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(16.4, .04, 6, 180), new THREE.MeshBasicMaterial({ color: 0xffe2a8, transparent: true, opacity: .45 }));
  ring.rotation.x = ring2.rotation.x = 1.25; ring2.rotation.y = .06; P.add(ring, ring2);

  /* 3 穿云:柔软云团从镜头两侧掠过 */
  const sc = document.createElement('canvas'); sc.width = sc.height = 64; const sx = sc.getContext('2d');
  const gr = sx.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.5, 'rgba(255,255,255,.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  sx.fillStyle = gr; sx.fillRect(0, 0, 64, 64);
  const CN = mob ? 40 : 80, cp = new Float32Array(CN * 3), cs = [];
  for (let i = 0; i < CN; i++) { const a = Math.random() * Math.PI * 2, r = 7 + Math.random() * 16; cs.push({ x: Math.cos(a) * r, y: Math.sin(a) * r * .7 - 1, z: -Math.random() * 60 }); }
  const cg = new THREE.BufferGeometry(); cg.setAttribute('position', new THREE.BufferAttribute(cp, 3));
  const puffM = new THREE.PointsMaterial({ size: mob ? 5 : 6, map: new THREE.CanvasTexture(sc), color: 0xffe0a8, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
  const puffs = new THREE.Points(cg, puffM); S.add(puffs);

  try { R.compile(S, C); } catch (_) {}   // 先编译着色器,避免首帧卡顿吃掉动画时间
  const T = seen ? 1.6 : 5.5; let t0 = performance.now(), wall = t0, last = t0, stop = false, fc = 0, acc = 0;
  const snd = seen ? null : chord(T);
  const skip = () => { if (stop) return; stop = true; try { localStorage.setItem(KEY, '1'); } catch (_) {} if (snd) snd.end(); removeEventListener('keydown', onKey); done();
    try { R.dispose(); R.forceContextLoss(); } catch (_) {} dispatchEvent(new Event('lt:intro-done')); };
  el.querySelector('.skip').onclick = skip; el.addEventListener('pointerdown', skip); const onKey = e => { if (!e.repeat) skip(); }; addEventListener('keydown', onKey);
  addEventListener('resize', () => { if (stop) return; R.setSize(innerWidth, innerHeight); C.aspect = innerWidth / innerHeight; C.updateProjectionMatrix(); });
  const ease = x => x * x * (3 - 2 * x), cl = x => Math.min(1, Math.max(0, x));
  (function frame(now) { if (stop) return; requestAnimationFrame(frame);
    const gap = now - last; if (gap > 100) t0 += gap - 16;   // 卡顿不跳帧:顺延时间轴
    if (now - wall > T * 3000) return skip();   // 太慢的设备最多等 3 倍时长
    const dt = Math.min(.05, Math.max(0, gap) / 1000); last = now; let u = Math.max(0, now - t0) / 1000 / T;
    if (typeof window.__ltIntroU === 'number') { u = window.__ltIntroU; wall = now; }   // 自测截图用:定格在某一时刻
    if (u >= 1) return skip();
    const sp = 80 + 900 * ease(cl(u / .45)) * (1 - .8 * ease(cl((u - .5) / .25)));  // 先加速跃迁,接近星球时减速
    for (let i = 0; i < N; i++) { const s = st[i]; s.z += sp * dt * (seen ? 2.2 : 1); if (s.z > 5) s.z -= 900;
      const L = Math.min(sp * .06, 60); pos.set([s.x, s.y, s.z, s.x, s.y, s.z - L], i * 6); }
    lg.attributes.position.needsUpdate = true; lineM.opacity = 1 - ease(cl((u - .62) / .2));
    const k = ease(cl((u - .2) / .6)), k2 = ease(cl((u - .74) / .2));   // 靠近星球,再俯冲入云
    P.position.z = -420 + 392 * k + 13 * k2; P.position.y = -2 * (1 - k) - 6 * k2; P.rotation.y = now / 3200; cloud.rotation.y = now / 9000;
    ring.rotation.z = now / 1800; ring2.rotation.z = -now / 2600; ring.material.opacity = .8 * (1 - k2); ring2.material.opacity = .45 * (1 - k2);
    const cu = cl((u - .7) / .22); puffM.opacity = Math.sin(Math.PI * cu) * .4;
    for (let i = 0; i < CN; i++) { const s = cs[i]; if (cu > 0) s.z += dt * (seen ? 140 : 75); if (s.z > 2) s.z -= 60; cp.set([s.x, s.y, s.z], i * 3); }
    cg.attributes.position.needsUpdate = true;
    U.t.value = now / 1000; U.f.value = ease(cl((u - .86) / .14));
    C.position.y = -1.5 * ease(cl((u - .7) / .3)); C.lookAt(0, -2 - 3 * k2, -100);
    if (++fc < 25) acc += dt; else if (fc === 25 && acc / 24 > .045) R.setPixelRatio(Math.max(.6, DPR * .6));   // 低端机:降分辨率
    R.render(S, C); })(t0);
}
