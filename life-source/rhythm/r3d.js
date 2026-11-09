// 生命源码 · ls.rhythm 全息标本(Three.js r169,本地 vendor)
// mountSpec(host, kind) → { set(state), dispose() }
// kind:plant 含羞草 / clock 24 小时节律盘+头部光路 / loop 分子反馈环 / earth 日照地球+候鸟
// 低画质、无 WebGL 或加载失败:回落 Canvas 2D 平面标本,数值与交互完全相同;减少动态效果:只在状态变化时画一帧;页面隐藏暂停。
import { tier, pixelRatio, particleScale, reducedMotion, visible } from '../ls-scene.js';

const GOLD = '#e2be78', EM = '#34d399', NIGHT = '#3b6fd8', VIO = '#a78bfa';

export async function mountSpec(host, kind) {
  const box = document.createElement('div'); box.className = 'r3d'; host.append(box);
  if (tier() !== 'low') {
    try { return await mount3d(box, kind); } catch (e) { box.innerHTML = ''; }
  }
  return mountFlat(box, kind);
}

/* ---------------- 3D ---------------- */
async function mount3d(box, kind) {
  const THREE = (await import('../ls-three.js')).default;
  const cv = document.createElement('canvas'); box.append(cv);
  const renderer = new THREE.WebGLRenderer({ canvas: cv, alpha: true, antialias: tier() === 'high', powerPreference: 'low-power' });
  renderer.setPixelRatio(pixelRatio());
  const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(34, 1, .1, 100);
  cam.position.set(0, 1.2, 7.4); cam.lookAt(0, .1, 0);
  const root = new THREE.Group(); scene.add(root);
  const glow = (col, op = 1) => new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: op, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
  const st = {}; let upd = () => {}, spin = 0;

  if (kind === 'plant') {
    // 花盆
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(.62, .45, .6, 40, 1, true), glow(EM, .35)); pot.position.y = -1.3; root.add(pot);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(.62, .025, 8, 60), glow(EM, .9)); rim.rotation.x = Math.PI / 2; rim.position.y = -1; root.add(rim);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(.035, .05, 1.9, 8), glow('#6ee7b7', .9)); stem.position.y = -.05; root.add(stem);
    const leafM = glow('#5eead4', .75), lf = new THREE.PlaneGeometry(.2, .07);
    const leaves = [];
    [[.35, 0], [.0, 2.1], [-.35, 4.2], [.55, 1.05], [.2, 3.15], [-.15, 5.25]].forEach(([y, a], k) => {
      const piv = new THREE.Group(); piv.position.y = y + .1; piv.rotation.y = a; root.add(piv);
      const rach = new THREE.Group(); piv.add(rach);
      const r = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, 1.05, 5), glow('#6ee7b7', .8)); r.rotation.z = Math.PI / 2; r.position.x = .52; rach.add(r);
      const lets = [];
      for (let i = 0; i < 9; i++) for (const s of [1, -1]) {
        const g = new THREE.Group(); g.position.set(.14 + i * .1, 0, 0); rach.add(g);
        const m = new THREE.Mesh(lf, leafM); m.position.z = s * .1; m.rotation.x = -Math.PI / 2; g.add(m); g.userData.s = s; lets.push(g);
      }
      leaves.push({ rach, lets });
    });
    const sun = new THREE.Mesh(new THREE.SphereGeometry(.16, 20, 14), glow(GOLD, .95)); sun.position.set(1.6, 1.3, -1); root.add(sun);
    st.open = 1; st.light = 1;
    upd = () => {
      const o = st.open;
      leaves.forEach(L => { L.rach.rotation.z = -.15 - (1 - o) * .9; L.lets.forEach(g => { g.rotation.x = g.userData.s * (1 - o) * 1.35; }); });
      sun.material.color.set(st.light ? GOLD : NIGHT); sun.material.opacity = st.light ? .95 : .35;
    };
    spin = .12;
  }

  if (kind === 'clock') {
    const R = 2.1;
    const day = new THREE.Mesh(new THREE.TorusGeometry(R, .11, 12, 90, Math.PI), glow(GOLD, .75)); day.rotation.z = 0; root.add(day);
    const night = new THREE.Mesh(new THREE.TorusGeometry(R, .11, 12, 90, Math.PI), glow(NIGHT, .75)); night.rotation.z = Math.PI; root.add(night);
    const tk = new THREE.Group(); root.add(tk);
    for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2, m = new THREE.Mesh(new THREE.BoxGeometry(.03, i % 6 ? .14 : .28, .02), glow('#d1fae5', .7)); m.position.set(Math.sin(a) * (R - .3), Math.cos(a) * (R - .3), 0); m.rotation.z = -a; tk.add(m); }
    const hand = new THREE.Mesh(new THREE.SphereGeometry(.17, 20, 14), glow('#ffffff', 1)); root.add(hand);
    // 头部侧影(程序生成轮廓)
    const P = [[.0, -1.25], [.05, -.75], [-.05, -.45], [.25, -.38], [.42, -.25], [.38, -.12], [.5, -.02], [.48, .1], [.58, .3], [.55, .55], [.38, .95], [.0, 1.15], [-.45, 1.05], [-.8, .7], [-.9, .2], [-.78, -.25], [-.55, -.5], [-.45, -.85], [-.5, -1.25]];
    const sh = new THREE.Shape(); P.forEach(([x, y], i) => (i ? sh.lineTo(x, y) : sh.moveTo(x, y))); sh.closePath();
    const head = new THREE.Mesh(new THREE.ShapeGeometry(sh), glow(EM, .16)); root.add(head);
    const edge = new THREE.Line(new THREE.BufferGeometry().setFromPoints([...P, P[0]].map(([x, y]) => new THREE.Vector3(x, y, .01))), new THREE.LineBasicMaterial({ color: '#6ee7b7', transparent: true, opacity: .8 })); root.add(edge);
    const scn = new THREE.Mesh(new THREE.SphereGeometry(.07, 14, 10), glow('#ffffff', .9)); scn.position.set(.05, .3, .02); root.add(scn);
    const pin = new THREE.Mesh(new THREE.SphereGeometry(.1, 14, 10), glow(VIO, .9)); pin.position.set(-.3, .22, .02); root.add(pin);
    const beamG = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(1.6, .45, .02), new THREE.Vector3(.42, .42, .02), new THREE.Vector3(.05, .3, .02), new THREE.Vector3(-.3, .22, .02)]);
    const beam = new THREE.Line(beamG, new THREE.LineBasicMaterial({ color: '#fff7d6', transparent: true, opacity: .9 })); root.add(beam);
    // 褪黑素粒子
    const N = Math.round(420 * particleScale()), pos = new Float32Array(N * 3), ph = new Float32Array(N);
    for (let i = 0; i < N; i++) { ph[i] = Math.random() * Math.PI * 2; const r = R + (Math.random() - .5) * .6; pos.set([Math.cos(ph[i]) * r, Math.sin(ph[i]) * r, (Math.random() - .5) * .5], i * 3); }
    const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const pts = new THREE.Points(pg, new THREE.PointsMaterial({ color: VIO, size: .05, transparent: true, opacity: .6, depthWrite: false, blending: THREE.AdditiveBlending })); root.add(pts);
    st.hour = 12; st.light = 0; st.mel = 0; st.press = 0;
    upd = (dt = 0) => {
      const a = st.hour / 24 * Math.PI * 2; // 0 点在下方,12 点在上方
      hand.position.set(-Math.sin(a) * R, -Math.cos(a) * R, .05);
      const isDay = st.hour >= 6 && st.hour < 18; hand.material.color.set(isDay ? '#fff3c4' : '#c7d2fe');
      beam.material.opacity = st.light ? .95 : .06; scn.material.opacity = st.light ? 1 : .35;
      pin.scale.setScalar(.7 + st.mel * 1.1); pts.material.opacity = .08 + st.mel * .8;
      head.material.opacity = .12 + st.press * .25;
      const p = pg.attributes.position.array; for (let i = 0; i < N; i++) { ph[i] += dt * .25; const r = Math.hypot(p[i * 3], p[i * 3 + 1]); p[i * 3] = Math.cos(ph[i]) * r; p[i * 3 + 1] = Math.sin(ph[i]) * r; } pg.attributes.position.needsUpdate = true;
    };
    spin = 0; root.rotation.x = -.12;
  }

  if (kind === 'loop') {
    const R = 1.6;
    const nuc = new THREE.Mesh(new THREE.TorusGeometry(R + .55, .02, 8, 120), glow(EM, .5)); root.add(nuc);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(R, .025, 8, 120), glow('#d1fae5', .35)); root.add(ring);
    const cols = ['#34d399', '#5eead4', VIO, '#c084fc'], names = [], balls = [];
    for (let i = 0; i < 4; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(.28, 24, 16), glow(cols[i], .85)); root.add(b); balls.push(b); }
    // 流动光点(沿环)
    const N = Math.round(160 * particleScale()), pos = new Float32Array(N * 3), ph = new Float32Array(N).map(() => Math.random() * Math.PI * 2);
    const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const pts = new THREE.Points(pg, new THREE.PointsMaterial({ color: '#e9d5ff', size: .05, transparent: true, opacity: .8, depthWrite: false, blending: THREE.AdditiveBlending })); root.add(pts);
    st.level = .5; st.speed = 1; st.stop = 0; let ang = 0;
    upd = (dt = 0) => {
      ang += dt * .9 * st.speed * (st.stop ? .05 : 1);
      balls.forEach((b, i) => { const a = ang + i * Math.PI / 2; b.position.set(Math.cos(a) * R, Math.sin(a) * R, 0); });
      balls[2].scale.setScalar(.6 + st.level * .9); balls[3].scale.setScalar(.6 + st.level * .9);
      balls[0].scale.setScalar(1.3 - st.level * .5); balls[1].scale.setScalar(1.3 - st.level * .5);
      const p = pg.attributes.position.array; for (let i = 0; i < N; i++) { ph[i] += dt * 1.6 * st.speed * (st.stop ? .05 : 1); p.set([Math.cos(ph[i]) * (R + Math.sin(ph[i] * 7) * .08), Math.sin(ph[i]) * (R + Math.sin(ph[i] * 7) * .08), 0], i * 3); } pg.attributes.position.needsUpdate = true;
      pts.material.opacity = st.stop ? .2 : .8;
    };
    root.rotation.x = -.5; spin = 0;
  }

  if (kind === 'earth') {
    const R = 1.45, tilt = new THREE.Group(); tilt.rotation.z = -23.44 * Math.PI / 180; root.add(tilt);
    const mat = new THREE.ShaderMaterial({
      transparent: true, uniforms: { sun: { value: new THREE.Vector3(1, 0, 0) }, lat: { value: 40 } },
      vertexShader: 'varying vec3 n;varying vec3 p;void main(){n=normal;p=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader: `uniform vec3 sun;uniform float lat;varying vec3 n;varying vec3 p;
        float h(vec3 q){return fract(sin(dot(floor(q*3.1),vec3(12.9,78.2,37.7)))*43758.5);}
        void main(){vec3 N=normalize(n);float d=dot(N,normalize(sun));float day=smoothstep(-.08,.12,d);
        float la=degrees(asin(clamp(N.y,-1.,1.)));float lo=degrees(atan(N.z,N.x));
        float grid=max(1.-smoothstep(0.,.6,abs(mod(la+7.5,15.)-7.5)),1.-smoothstep(0.,.6,abs(mod(lo+7.5,15.)-7.5)))*.35;
        float land=step(.55,h(N*2.)+h(N*4.3)*.5-.2);
        float band=1.-smoothstep(0.,1.2,abs(la-lat));
        vec3 dc=mix(vec3(.05,.28,.36),vec3(.2,.55,.35),land);vec3 nc=vec3(.02,.05,.12)+land*vec3(.05,.06,.02);
        vec3 c=mix(nc,dc,day)+grid*vec3(.3,.9,.7)+band*vec3(1.,.85,.45);
        float rim=pow(1.-abs(N.z*.0+dot(N,vec3(0,0,1))),2.);
        gl_FragColor=vec4(c+rim*vec3(.1,.5,.4),.96);}`,
    });
    const earth = new THREE.Mesh(new THREE.SphereGeometry(R, 64, 40), mat); tilt.add(earth);
    const axis = new THREE.Mesh(new THREE.CylinderGeometry(.01, .01, R * 2.6, 6), glow('#d1fae5', .5)); tilt.add(axis);
    const atm = new THREE.Mesh(new THREE.SphereGeometry(R * 1.06, 48, 32), glow('#7dd3fc', .08)); tilt.add(atm);
    const sunB = new THREE.Mesh(new THREE.SphereGeometry(.22, 20, 14), glow(GOLD, 1)); root.add(sunB);
    // 候鸟群:一条弧线上的小三角
    const birds = new THREE.Group(); root.add(birds); const bg = new THREE.ConeGeometry(.035, .12, 3);
    const BN = Math.round(36 * particleScale() + 10), bs = [];
    for (let i = 0; i < BN; i++) { const m = new THREE.Mesh(bg, glow('#d1fae5', .9)); m.userData.o = i / BN; birds.add(m); bs.push(m); }
    st.month = 6; st.lat = 40; st.mig = 0; st.dir = 1; let t = 0;
    upd = (dt = 0) => {
      t += dt; const dec = 23.44 * Math.sin(2 * Math.PI * ((st.month - .5) * 30.4 - 80) / 365) * Math.PI / 180;
      // 太阳方向在地球(倾斜系)里的仰角 = 赤纬;再转回世界坐标画太阳
      const s = new THREE.Vector3(Math.cos(dec), Math.sin(dec), .35).normalize(); mat.uniforms.sun.value.copy(s); mat.uniforms.lat.value = st.lat;
      const w = s.clone().applyAxisAngle(new THREE.Vector3(0, 0, 1), tilt.rotation.z).multiplyScalar(2.6); sunB.position.copy(w);
      birds.visible = st.mig > .05;
      bs.forEach(b => { const u = (b.userData.o + t * .06) % 1, a = (st.dir > 0 ? u : 1 - u); const th = -.6 + a * 1.9;
        b.position.set(Math.cos(th) * 2.05, Math.sin(th) * 1.4 + .15, .9 + Math.sin(a * 6.28) * .2); b.rotation.z = th + (st.dir > 0 ? Math.PI : 0); b.material.opacity = .9 * st.mig; });
    };
    root.rotation.x = .1; spin = 0;
  }

  const size = () => { const w = box.clientWidth, h = box.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); cam.aspect = w / h; cam.position.z = w / h < 1 ? 9.2 : 7.4; cam.updateProjectionMatrix(); };
  const ro = new ResizeObserver(() => { size(); if (reducedMotion()) draw(0); }); ro.observe(box); size();
  const draw = dt => { upd(dt); renderer.render(scene, cam); };
  let raf = 0, last = performance.now(), dead = false;
  const frame = now => { if (dead) return; const dt = Math.min(.05, (now - last) / 1000); last = now; if (visible()) { root.rotation.y += dt * spin; draw(dt); } raf = requestAnimationFrame(frame); };
  if (reducedMotion()) draw(0); else raf = requestAnimationFrame(frame);
  return {
    gl: true,
    set(s) { Object.assign(st, s); if (reducedMotion()) draw(0); },
    dispose() { dead = true; cancelAnimationFrame(raf); ro.disconnect(); renderer.dispose(); box.remove(); },
  };
}

/* ---------------- 2D 回落(低画质 / 无 WebGL) ---------------- */
function mountFlat(box, kind) {
  box.classList.add('flat');
  const cv = document.createElement('canvas'); box.append(cv);
  const st = { open: 1, light: 1, hour: 12, mel: 0, press: 0, level: .5, speed: 1, stop: 0, month: 6, lat: 40, mig: 0, dir: 1 };
  const draw = () => {
    const D = Math.min(devicePixelRatio || 1, 2), W = box.clientWidth, H = box.clientHeight; if (!W || !H) return;
    cv.width = W * D; cv.height = H * D; const g = cv.getContext('2d'); g.scale(D, D); g.clearRect(0, 0, W, H);
    const cx = W / 2, cy = H / 2, R = Math.min(W, H) * .38; g.lineCap = 'round';
    if (kind === 'plant') {
      g.strokeStyle = EM; g.lineWidth = 3; g.beginPath(); g.moveTo(cx, cy + R); g.lineTo(cx, cy - R * .5); g.stroke();
      for (let k = 0; k < 4; k++) { const y = cy - R * .4 + k * R * .3, s = k % 2 ? 1 : -1, a = s * (.2 + (1 - st.open) * 1.1);
        for (let i = 1; i <= 7; i++) { const x0 = cx + s * i * R * .1, y0 = y + Math.abs(i) * (1 - st.open) * 5, l = R * .1 * st.open + 3;
          g.strokeStyle = '#5eead4'; g.lineWidth = 2; g.beginPath(); g.moveTo(x0, y0 - l); g.lineTo(x0, y0 + l); g.stroke(); }
        g.beginPath(); g.moveTo(cx, y); g.lineTo(cx + s * R * .75, y + R * .75 * Math.sin(Math.abs(a)) * .6); g.stroke(); }
      g.fillStyle = st.light ? GOLD : NIGHT; g.beginPath(); g.arc(cx + R * 1.1, cy - R * .8, 10, 0, 7); g.fill();
    }
    if (kind === 'clock') {
      g.lineWidth = 9; g.strokeStyle = GOLD; g.beginPath(); g.arc(cx, cy, R, Math.PI, 0); g.stroke(); g.strokeStyle = NIGHT; g.beginPath(); g.arc(cx, cy, R, 0, Math.PI); g.stroke();
      const a = st.hour / 24 * Math.PI * 2; g.fillStyle = '#fff'; g.beginPath(); g.arc(cx - Math.sin(a) * R, cy + Math.cos(a) * R, 7, 0, 7); g.fill();
      g.fillStyle = `rgba(167,139,250,${.15 + st.mel * .75})`; g.beginPath(); g.arc(cx, cy, R * (.25 + st.mel * .3), 0, 7); g.fill();
      if (st.light) { g.strokeStyle = '#fff7d6'; g.lineWidth = 2; g.beginPath(); g.moveTo(cx + R * .8, cy - 6); g.lineTo(cx, cy); g.stroke(); }
    }
    if (kind === 'loop') {
      g.strokeStyle = 'rgba(209,250,229,.4)'; g.lineWidth = 2; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.stroke();
      ['#34d399', '#5eead4', VIO, '#c084fc'].forEach((c, i) => { const a = i * Math.PI / 2, r = i > 1 ? 8 + st.level * 14 : 20 - st.level * 8; g.fillStyle = c; g.beginPath(); g.arc(cx + Math.cos(a) * R, cy + Math.sin(a) * R, r, 0, 7); g.fill(); });
    }
    if (kind === 'earth') {
      const dec = 23.44 * Math.sin(2 * Math.PI * ((st.month - .5) * 30.4 - 80) / 365);
      g.fillStyle = '#0b2530'; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.fill();
      g.save(); g.beginPath(); g.arc(cx, cy, R, 0, 7); g.clip(); g.fillStyle = 'rgba(94,234,212,.35)'; g.translate(cx, cy); g.rotate(-dec * Math.PI / 180); g.fillRect(0, -R, R, R * 2); g.restore();
      const y = cy - Math.sin(st.lat * Math.PI / 180) * R; g.strokeStyle = GOLD; g.lineWidth = 2; g.beginPath(); g.moveTo(cx - Math.cos(st.lat * Math.PI / 180) * R, y); g.lineTo(cx + Math.cos(st.lat * Math.PI / 180) * R, y); g.stroke();
      g.fillStyle = GOLD; g.beginPath(); g.arc(cx + R * 1.35, cy, 9, 0, 7); g.fill();
      if (st.mig > .05) { g.fillStyle = '#d1fae5'; for (let i = 0; i < 9; i++) { const x = cx - R * .9 + i * R * .22, yy = cy - R * 1.05 + Math.abs(i - 4) * 5; g.beginPath(); g.moveTo(x, yy); g.lineTo(x - 6 * st.dir, yy - 3); g.lineTo(x - 6 * st.dir, yy + 3); g.fill(); } }
    }
  };
  const ro = new ResizeObserver(draw); ro.observe(box); draw();
  return { gl: false, set(s) { Object.assign(st, s); draw(); }, dispose() { ro.disconnect(); box.remove(); } };
}
