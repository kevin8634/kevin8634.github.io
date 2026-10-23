/* 觉弈 v0.25 · 开场 C「心莲破茧」(Three.js + WebGL)
   流程:金线勾出人头侧影 → 心中一枚光茧,八瓣莲花在茧外绽放 → 茧裂开,金蝶破茧飞出 → 八条光带(八域)向外展开 → 镜头推进,鎏金闪光落到心莲星盘。
   寓意:认知觉醒 = 在自己的心智里破茧;八条光带对应八个认知域。
   开场和弦:一个基音的八个泛音逐个进入(声音默认关)。首访约 6.5 秒,老玩家约 2 秒;可跳过;减少动态时只淡入;不支持 WebGL 时直接淡入。 */
const KEY = 'gn:lt:warp_seen';
const COLS = [0xf5c26b, 0xff9d6b, 0x8fd3ff, 0xf0a860, 0x9fe0b8, 0xff8fb0, 0xe9d39a, 0xb9a8ff];   // 八域光带
const HEAD = [[-2.2, -6.6], [-2.6, -4.3], [-3.7, -2.7], [-4.5, -.5], [-4.4, 1.9], [-3.5, 3.9], [-1.6, 5.1], [.6, 5.3], [2.4, 4.5], [3.4, 2.9], [3.65, 1.4],
  [3.5, .55], [3.3, .15], [4.15, -1.25], [3.5, -1.7], [3.72, -2.3], [3.4, -2.6], [3.6, -3.0], [3.1, -3.6], [2.8, -4.25], [1.6, -4.45], [1.2, -5.0], [1.35, -6.6]];

function chord(T) {
  try {
    if (localStorage.getItem('gn:lt:sound') !== 'true') return null;   // 声音默认关:关时无声
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
    const ac = new AC(); if (ac.state !== 'running') { ac.close(); return null; }
    const now = ac.currentTime, M = ac.createGain(), lp = ac.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 2400; M.connect(lp); lp.connect(ac.destination);
    M.gain.setValueAtTime(0, now); M.gain.linearRampToValueAtTime(.16, now + .4);
    for (let n = 1; n <= 8; n++) {   // 一个音的八个泛音 = 八域
      const o = ac.createOscillator(), g = ac.createGain(), at = now + T * (.3 + .45 * (n - 1) / 8);
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
  const cap = document.createElement('div'); cap.className = 'cap'; cap.innerHTML = '认识你自己<small>苏格拉底 · 觉弈 Ludoterra</small>'; el.appendChild(cap);
  const mob = innerWidth < 700, DPR = Math.min(devicePixelRatio || 1, 1.5);
  R.setPixelRatio(DPR); R.setSize(innerWidth, innerHeight); R.setClearColor(0x02030a, 1);
  const S = new THREE.Scene(), C = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, .1, 500);
  const ADD = { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending };
  const fitZ = () => { const a = innerWidth / innerHeight; return a < 1 ? 15 / a + 4 : 19; };   // 竖屏后退,保证人头完整
  let Z0 = fitZ();
  // 柔光贴图
  const gc = document.createElement('canvas'); gc.width = gc.height = 64; const gx = gc.getContext('2d');
  const gr = gx.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.35, 'rgba(255,255,255,.4)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  gx.fillStyle = gr; gx.fillRect(0, 0, 64, 64); const glowT = new THREE.CanvasTexture(gc);

  /* 0 星空 */
  const SN = mob ? 500 : 1000, sp = new Float32Array(SN * 3);
  for (let i = 0; i < SN; i++) sp.set([(Math.random() - .5) * 140, (Math.random() - .5) * 90, -20 - Math.random() * 80], i * 3);
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  const starM = new THREE.PointsMaterial({ size: .35, map: glowT, color: 0xdfe6ff, opacity: .0, ...ADD }); S.add(new THREE.Points(sg, starM));

  /* 1 人头侧影:金线 + 沿线流动的光点 */
  const curve = new THREE.CatmullRomCurve3(HEAD.map(([x, y]) => new THREE.Vector3(x - .2, y + .3, 0)), false, 'catmullrom', .5);
  const HP = curve.getPoints(600), hg = new THREE.BufferGeometry().setFromPoints(HP);
  const headM = new THREE.LineBasicMaterial({ color: 0xf5c26b, ...ADD, opacity: 1 }); const headL = new THREE.Line(hg, headM); S.add(headL);
  const hg2 = new THREE.BufferGeometry().setFromPoints(HP.map(p => p.clone().multiplyScalar(1.015)));
  const headM2 = new THREE.LineBasicMaterial({ color: 0xffe2a8, ...ADD, opacity: .35 }); const headL2 = new THREE.Line(hg2, headM2); S.add(headL2);
  const DN = 90, dp = new Float32Array(DN * 3), dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.BufferAttribute(dp, 3));
  const dotM = new THREE.PointsMaterial({ size: .5, map: glowT, color: 0xffd58a, opacity: 0, ...ADD }); S.add(new THREE.Points(dg, dotM));
  const pen = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowT, color: 0xfff0c8, ...ADD, opacity: 0 })); pen.scale.setScalar(1.6); S.add(pen);

  /* 2 心中莲花:八瓣(八域色)+ 金边,中心光茧 */
  const O = new THREE.Vector3(.1, 1.1, .1), lotus = new THREE.Group(); lotus.position.copy(O); S.add(lotus);
  const ps = new THREE.Shape(); ps.moveTo(0, 0); ps.bezierCurveTo(.55, .5, .45, 1.35, 0, 1.75); ps.bezierCurveTo(-.45, 1.35, -.55, .5, 0, 0);
  const pGeo = new THREE.ShapeGeometry(ps, 16), pEdge = new THREE.BufferGeometry().setFromPoints(ps.getPoints(40).map(p => new THREE.Vector3(p.x, p.y, 0)));
  const petals = [];
  for (let i = 0; i < 8; i++) { const g = new THREE.Group(); g.rotation.z = -i * Math.PI / 4;
    const f = new THREE.Mesh(pGeo, new THREE.MeshBasicMaterial({ color: COLS[i], ...ADD, opacity: 0, side: THREE.DoubleSide }));
    const e = new THREE.Line(pEdge, new THREE.LineBasicMaterial({ color: 0xffe2a8, ...ADD, opacity: 0 })); g.add(f, e); lotus.add(g); petals.push({ g, f, e }); }
  const core = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowT, color: 0xffd9a0, ...ADD, opacity: 0 })); core.scale.setScalar(2.4); lotus.add(core);
  // 光茧:绕成纺锤形的螺旋金丝
  const cocoonPts = []; for (let i = 0; i <= 420; i++) { const s = i / 420, a = s * Math.PI * 22, r = Math.sin(Math.PI * s) * .55;
    cocoonPts.push(new THREE.Vector3(Math.cos(a) * r, (s - .5) * 1.7, Math.sin(a) * r)); }
  const cocoonM = new THREE.LineBasicMaterial({ color: 0xffe2a8, ...ADD, opacity: 0 }); const cocoon = new THREE.Line(new THREE.BufferGeometry().setFromPoints(cocoonPts), cocoonM);
  cocoon.position.z = .3; lotus.add(cocoon);
  // 破茧碎光
  const BN = mob ? 160 : 320, bp = new Float32Array(BN * 3), bv = [];
  for (let i = 0; i < BN; i++) { const a = Math.random() * Math.PI * 2, s = 1.5 + Math.random() * 5; bv.push([Math.cos(a) * s, Math.sin(a) * s + 1, (Math.random() - .5) * 2]); }
  const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.BufferAttribute(bp, 3));
  const burstM = new THREE.PointsMaterial({ size: .28, map: glowT, color: 0xffe2a8, opacity: 0, ...ADD }); const burst = new THREE.Points(bg, burstM); lotus.add(burst);

  /* 3 金蝶 */
  const fly = new THREE.Group(); fly.position.copy(O); S.add(fly);
  const ws = new THREE.Shape(); ws.moveTo(0, 0); ws.bezierCurveTo(.5, .9, 1.6, 1.3, 1.5, .35); ws.bezierCurveTo(1.45, -.1, .7, -.05, .35, -.05);
  ws.bezierCurveTo(1.1, -.3, 1.05, -1.05, .45, -.9); ws.bezierCurveTo(.2, -.8, .05, -.4, 0, 0);
  const wGeo = new THREE.ShapeGeometry(ws, 20), wEdge = new THREE.BufferGeometry().setFromPoints(ws.getPoints(60).map(p => new THREE.Vector3(p.x, p.y, 0)));
  const wingMat = new THREE.MeshBasicMaterial({ color: 0xf5b955, ...ADD, opacity: 0, side: THREE.DoubleSide }), wEdgeMat = new THREE.LineBasicMaterial({ color: 0xfff0c8, ...ADD, opacity: 0 });
  const wings = [1, -1].map(sx => { const g = new THREE.Group(); g.add(new THREE.Mesh(wGeo, wingMat), new THREE.Line(wEdge, wEdgeMat)); g.scale.x = sx; fly.add(g); return g; });
  const body = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowT, color: 0xfff0c8, ...ADD, opacity: 0 })); body.scale.set(.35, 1.3, 1); fly.add(body);
  const TN = 60, tp = new Float32Array(TN * 3), tg = new THREE.BufferGeometry(); tg.setAttribute('position', new THREE.BufferAttribute(tp, 3));
  const trailM = new THREE.PointsMaterial({ size: .3, map: glowT, color: 0xffd58a, opacity: 0, ...ADD }); S.add(new THREE.Points(tg, trailM));
  const trail = Array.from({ length: TN }, () => O.clone());

  /* 4 八条光带:从莲心沿八个花瓣方向弯曲伸向远方 */
  const rays = COLS.map((c, i) => { const a = Math.PI / 2 - i * Math.PI / 4, tw = .35 * (i % 2 ? 1 : -1), pts = [];
    for (let k = 0; k <= 40; k++) { const s = k / 40, r = 1.6 + s * 38, b = a + tw * s * s; pts.push(new THREE.Vector3(O.x + Math.cos(b) * r, O.y + Math.sin(b) * r * .82, -s * 6)); }
    const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 80, .07, 6, false), m = new THREE.MeshBasicMaterial({ color: c, ...ADD, opacity: 0 });
    const mesh = new THREE.Mesh(geo, m); geo.setDrawRange(0, 0); S.add(mesh);
    const tip = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowT, color: c, ...ADD, opacity: 0 })); tip.scale.setScalar(1.4); S.add(tip);
    return { geo, m, tip, pts, n: geo.index.count }; });

  const flash = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshBasicMaterial({ color: 0xfff0d0, transparent: true, opacity: 0, depthTest: false }));
  flash.renderOrder = 9; S.add(flash);

  try { R.compile(S, C); } catch (_) {}
  const T = seen ? 2.0 : 6.5; let t0 = performance.now(), wall = t0, last = t0, stop = false, fc = 0, acc = 0;
  const snd = seen ? null : chord(T);
  const skip = () => { if (stop) return; stop = true; try { localStorage.setItem(KEY, '1'); } catch (_) {} if (snd) snd.end(); removeEventListener('keydown', onKey); done();
    try { R.dispose(); R.forceContextLoss(); } catch (_) {} dispatchEvent(new Event('lt:intro-done')); };
  el.querySelector('.skip').onclick = skip; el.addEventListener('pointerdown', skip); const onKey = e => { if (!e.repeat) skip(); }; addEventListener('keydown', onKey);
  addEventListener('resize', () => { if (stop) return; R.setSize(innerWidth, innerHeight); C.aspect = innerWidth / innerHeight; C.updateProjectionMatrix(); Z0 = fitZ(); });
  const ease = x => x * x * (3 - 2 * x), cl = x => Math.min(1, Math.max(0, x)), win = (u, a, b) => ease(cl((u - a) / (b - a)));
  const tmp = new THREE.Vector3();
  (function frame(now) { if (stop) return; requestAnimationFrame(frame);
    const gap = now - last; if (gap > 100) t0 += gap - 16;   // 卡顿不跳帧:顺延时间轴
    if (now - wall > T * 3000) return skip();
    const dt = Math.min(.05, Math.max(0, gap) / 1000); last = now; let u = Math.max(0, now - t0) / 1000 / T;
    if (typeof window.__ltIntroU === 'number') { u = window.__ltIntroU; wall = now; }   // 自测截图用:定格在某一时刻
    if (u >= 1) return skip();
    const ts = now / 1000;
    starM.opacity = .7 * win(u, 0, .15);
    // ① 勾勒人头(0–0.24),最后淡出(0.7–0.86)
    const d = win(u, .02, .24), hOut = 1 - win(u, .7, .86), nH = Math.max(2, Math.round(HP.length * d));
    hg.setDrawRange(0, nH); hg2.setDrawRange(0, nH); headM.opacity = hOut; headM2.opacity = .35 * hOut;
    const pi = HP[Math.min(HP.length - 1, nH - 1)]; pen.position.copy(pi); pen.material.opacity = d < 1 ? .9 : 0;
    dotM.opacity = .8 * win(u, .2, .3) * hOut;
    for (let i = 0; i < DN; i++) { const p = curve.getPointAt((i / DN + ts * .06) % 1); dp.set([p.x, p.y, p.z], i * 3); } dg.attributes.position.needsUpdate = true;
    // ② 光茧与莲花(0.22–0.48)
    const cIn = win(u, .2, .3), crack = win(u, .44, .52);
    cocoonM.opacity = cIn * (1 - crack) * (.75 + .25 * Math.sin(ts * 7)); cocoon.rotation.y = ts * 1.4; cocoon.scale.setScalar(.8 + .2 * cIn + .25 * crack);
    core.material.opacity = .25 + .6 * cIn * (1 - .5 * crack) + .3 * Math.sin(ts * 3) * cIn; core.scale.setScalar(2.4 + 3 * crack * (1 - win(u, .55, .7)));
    petals.forEach((p, i) => { const k = win(u, .26 + i * .018, .46 + i * .018), out = 1 - win(u, .8, .92);
      p.g.scale.set(.35 + .75 * k, .2 + .9 * k, 1); p.g.rotation.x = (1 - k) * 1.1; p.f.material.opacity = .32 * k * out; p.e.material.opacity = .9 * k * out; });
    lotus.rotation.z = ts * .05; lotus.scale.setScalar(1 + .25 * win(u, .7, .95));
    // ③ 破茧(0.46–0.6):碎光四散;金蝶升起盘旋后化作光
    burstM.opacity = crack * (1 - win(u, .56, .72)); const bs = win(u, .45, .7);
    for (let i = 0; i < BN; i++) bp.set([bv[i][0] * bs, bv[i][1] * bs - bs * bs * .8, bv[i][2] * bs], i * 3); bg.attributes.position.needsUpdate = true;
    const fl = win(u, .47, .78), fOut = 1 - win(u, .8, .9);
    wingMat.opacity = .55 * win(u, .47, .53) * fOut; wEdgeMat.opacity = win(u, .47, .53) * fOut; body.material.opacity = .9 * win(u, .47, .53) * fOut;
    fly.position.set(O.x + Math.sin(fl * 5.2) * 2.4 * fl, O.y + fl * 6.5, 1 + fl * 2); fly.rotation.z = Math.cos(fl * 5.2) * .35 * fl;
    const flap = Math.abs(Math.cos(ts * 13)); wings[0].scale.x = .25 + .75 * flap; wings[1].scale.x = -(.25 + .75 * flap); fly.scale.setScalar(.6 + .5 * win(u, .47, .56));
    trail.pop(); trail.unshift(tmp.copy(fly.position).clone()); trail.forEach((p, i) => tp.set([p.x + (Math.random() - .5) * .1, p.y, p.z], i * 3)); tg.attributes.position.needsUpdate = true;
    trailM.opacity = .6 * win(u, .5, .56) * fOut;
    // ④ 八条光带(0.58–0.9)
    rays.forEach((r, i) => { const k = win(u, .58 + i * .015, .84 + i * .01); r.geo.setDrawRange(0, Math.floor(r.n * k / 3) * 3);
      r.m.opacity = .85 * cl(k * 4); const p = r.pts[Math.min(40, Math.round(k * 40))]; r.tip.position.copy(p); r.tip.material.opacity = k > 0 && k < 1 ? .9 : 0; });
    cap.style.opacity = String(win(u, .3, .4) * (1 - win(u, .78, .88)));
    // 镜头:缓慢推近,最后冲向莲心
    const push = win(u, .62, 1); C.position.set(O.x * push, O.y * push + Math.sin(ts * .5) * .15, Z0 - (Z0 - 3) * push * push); C.lookAt(O.x * push, O.y * push, 0);
    flash.position.set(C.position.x, C.position.y, C.position.z - 1); flash.material.opacity = win(u, .88, 1);
    if (++fc < 25) acc += dt; else if (fc === 25 && acc / 24 > .045) R.setPixelRatio(Math.max(.6, DPR * .6));   // 低端机:降分辨率
    R.render(S, C); })(t0);
}
