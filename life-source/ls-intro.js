// 生命源码 · 开场「编译生命」(WebGL / Three.js 粒子)
// v0.7.1 学科开场(约 7 秒,HANDOFF §5.3.1):写实画面三幕(细胞分裂 → DNA 解旋、碱基点亮 → 生命之树破土)+ WebGL 粒子与镜头推拉,标题浮现后 HUD 滑入。
// 写实画面为本项目 AI 生成原创底图(见 LICENSES.md),低画质档只保留画面、不渲染粒子。
// 约 4200 个粒子,每个粒子带三组目标位置,在顶点着色器里插值;可拖动、可点击激起涟漪。
import { sound, reducedMotion, store } from './ls.js';
import { tier, pixelRatio, particleScale } from './ls-scene.js';

const CON_COLORS = ['#34d399', '#5eead4', '#e2be78', '#7dd3fc', '#67e8f9', '#f9a8d4', '#fbbf24', '#c4b5fd'];
const BASE_COL = { A: '#4ade80', T: '#f5b041', G: '#60a5fa', C: '#f87171' };
const HBB = 'ATGGTGCACCTGACTCCTGAGGAGAAGTCTGCCGTTACTGCCCTGTGGGGCAAGGTGAACGTG';
const CAPTIONS = [
  [0.2, '一个细胞,一分为二'],
  [2.3, 'DNA 双螺旋解开 · 碱基逐个点亮(示意)'],
  [4.5, '复制、出错、筛选……长成一棵生命之树'],
  [6.0, '几乎所有生物,都在用同一套遗传密码'],
];
const HOLD = 7.0;                // 写实画面 + 粒子,约 7 秒后停在生命之树,等待进入
const css = `
#lsi{position:fixed;inset:0;z-index:50;background:radial-gradient(ellipse at 50% 60%,#0b1f1a 0%,#060a12 60%,#03060b 100%);transition:opacity 1.1s;overflow:hidden;touch-action:none}
#lsi canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
#lsi .pl{position:absolute;inset:-4%;width:108%;height:108%;object-fit:cover;opacity:0;will-change:transform,opacity;pointer-events:none;user-select:none}
#lsi .vig{position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse at 50% 50%,transparent 45%,rgba(3,6,11,.75) 100%)}
#lsi .cap{position:absolute;left:0;right:0;top:12%;text-align:center;color:#9fd8c4;font-size:clamp(13px,2.2vw,16px);letter-spacing:1px;opacity:0;transition:opacity .8s;padding:0 16px;text-shadow:0 1px 6px #000}
#lsi .cap code{display:block;font:12px/1.6 ui-monospace,Menlo,Consolas,monospace;color:#34d39988;letter-spacing:2px;margin-bottom:6px;white-space:nowrap;overflow:hidden}
#lsi .ttl{position:absolute;left:0;right:0;bottom:15%;text-align:center;pointer-events:none}
#lsi h1{margin:0;font-size:clamp(38px,9vw,72px);letter-spacing:.18em;color:#eefcf6;font-weight:800;text-shadow:0 0 24px #34d39966,0 0 2px #fff}
#lsi h1 span{display:inline-block;min-width:1em}
#lsi .en{color:#e2be78;letter-spacing:.5em;font-size:13px;margin-top:6px;opacity:0;transition:opacity 1s}
#lsi .sub{color:#b9c7c1;margin-top:10px;font-size:15px;opacity:0;transition:opacity 1s .3s}
#lsi .go{position:absolute;left:0;right:0;bottom:5%;display:flex;gap:12px;justify-content:center;flex-wrap:wrap;opacity:0;transform:translateY(12px);transition:all .8s;pointer-events:none;padding:0 12px}
#lsi .go.on{opacity:1;transform:none;pointer-events:auto}
#lsi .go button,#lsi .gate button{font:inherit;font-size:15px;border-radius:999px;padding:11px 22px;cursor:pointer;border:1px solid #34d39999;background:rgba(6,20,16,.6);color:#eefcf6;backdrop-filter:blur(6px)}
#lsi .go button.p,#lsi .gate button.p{background:linear-gradient(135deg,#10b981,#34d399);color:#03130d;border:0;font-weight:700;box-shadow:0 0 24px #34d39977}
#lsi .go button:hover{transform:translateY(-1px)}
#lsi .badge{position:absolute;right:16px;top:14px;color:#e2be78;font-size:13px;letter-spacing:1px}
#lsi .badge b{display:inline-block;background:#34d399;color:#04120c;border-radius:6px;padding:1px 8px;margin-left:6px}
#lsi .skip{position:absolute;left:16px;top:12px;background:none;border:0;color:#94a3a8;font:inherit;font-size:13px;cursor:pointer;padding:6px}
@media (max-width:640px){#lsi .ttl{bottom:21%}#lsi .go{bottom:3.5%}#lsi .go button{width:min(320px,90vw)}}
#lsi .gate{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;text-align:center;transition:opacity .9s;padding:0 16px}
#lsi .gate .ear{font-size:46px;filter:drop-shadow(0 0 18px #34d399);animation:lsiP 2.4s ease-in-out infinite}
@keyframes lsiP{50%{transform:scale(1.12);filter:drop-shadow(0 0 30px #34d399)}}
#lsi .gate h2{margin:0;font-size:clamp(26px,6vw,40px);letter-spacing:.25em;color:#eefcf6;text-shadow:0 0 20px #34d39988}
#lsi .gate p{margin:0;color:#9fb8ae;font-size:14px}
#lsi .gate .row{display:flex;gap:12px;flex-wrap:wrap;justify-content:center;margin-top:8px}
#lsi .ttl{transition:top 1.2s cubic-bezier(.2,.8,.2,1),bottom 1.2s,transform 1.2s}
#lsi .ttl.up{bottom:auto;top:7%}
#lsi .ttl.up .sub{display:none}
#lsi .ttl.up h1{font-size:clamp(30px,6.5vw,52px)}
#lsi .lens{position:absolute;left:50%;bottom:calc(5% + 80px);width:clamp(150px,22vh,200px);aspect-ratio:1;transform:translateX(-50%) scale(.6);opacity:0;transition:all 1s cubic-bezier(.2,.8,.2,1);cursor:pointer;pointer-events:none}
#lsi .lens.on{opacity:1;transform:translateX(-50%) scale(1);pointer-events:auto}
#lsi .lens .lz{position:absolute;inset:9%;border-radius:50%;overflow:hidden;background:#020806;box-shadow:inset 0 0 30px #000,0 0 40px #34d39955}
#lsi .lens .lz canvas{width:100%!important;height:100%!important}
#lsi .lens svg{position:absolute;inset:0;width:100%;height:100%;animation:lsiR 18s linear infinite;pointer-events:none}
#lsi .lens .glass{position:absolute;inset:9%;border-radius:50%;background:radial-gradient(circle at 30% 25%,#ffffff33,transparent 35%);pointer-events:none}
@keyframes lsiR{to{transform:rotate(360deg)}}
#lsi .lens .lab{position:absolute;left:50%;top:100%;transform:translateX(-50%);white-space:nowrap;text-align:center;margin-top:4px;font-size:12px;color:#9fd8c4;text-shadow:0 1px 4px #000}
#lsi .lens .lab b{color:#e2be78;font-weight:600}
#lsi .lens .side{position:absolute;top:50%;transform:translateY(-50%);font:11px ui-monospace,Menlo,monospace;color:#34d399aa;white-space:nowrap}
#lsi .lens .side.l{right:104%;text-align:right}#lsi .lens .side.r{left:104%}
#lsi .lens:hover .lz{box-shadow:inset 0 0 30px #000,0 0 60px #34d399aa}
@media (max-width:640px){#lsi .lens{bottom:calc(3.5% + 70px);width:clamp(120px,19vh,160px)}#lsi .lens .side{display:none}#lsi .ttl.up{top:8%}}
#lsi .hint{position:absolute;left:0;right:0;bottom:1.6%;text-align:center;color:#94a3a855;font-size:11px}
`;

export async function playIntro({ onDone, onDive, replay = false } = {}) {
  const st = document.createElement('style'); st.textContent = css; document.head.append(st);
  const box = document.createElement('div'); box.id = 'lsi';
  box.innerHTML = `<img class="pl" alt="" src="${new URL('./img/intro1.webp', import.meta.url)}"><img class="pl" alt="" src="${new URL('./img/intro2.webp', import.meta.url)}"><img class="pl" alt="" src="${new URL('./img/intro3.webp', import.meta.url)}"><div class="vig"></div><canvas></canvas><div class="badge">创世计划 · 04/07<b>生物</b></div><button class="skip">跳过 ›</button>
    <div class="cap"><code></code><span></span></div>
    <div class="ttl"><h1>${'生命源码'.split('').map(() => '<span></span>').join('')}</h1><div class="en">LIFE SOURCE</div><div class="sub">读懂生命写好的代码</div></div>
    <div class="lens"><div class="lz"></div><div class="glass"></div><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="none" stroke="#34d39966" stroke-width=".6"/><circle cx="50" cy="50" r="45.5" fill="none" stroke="#34d399" stroke-width="1.4" stroke-dasharray=".6 2.2"/><circle cx="50" cy="50" r="45.5" fill="none" stroke="#e2be78" stroke-width="2.2" stroke-dasharray="14 57.5"/></svg><div class="side l">放大 ×<span class="mag">1</span></div><div class="side r">比例尺 <span class="bar">1 mm</span></div><div class="lab"><b>一镜到底</b> · <span class="obj">指尖皮肤 · 指纹</span></div></div><div class="go"></div><div class="gate"><div class="ear">🎧</div><h2>生命源码</h2><p>建议戴上耳机,听听生命的声音</p><div class="row"></div></div><div class="hint">点一下跳到结尾 · Esc 直接进入</div>`;
  document.body.append(box);
  const seen = store.get('intro', false); let speed = 1, gated = true, cue = null, musicOn = false;
  fetch(new URL('./audio/intro.m4a', import.meta.url)).catch(() => {}); // 预取开场曲
  const $ = s => box.querySelector(s);
  let done = false, warpAt = 0;
  let renderer = null, clock = 0;
  const lens = $('.lens'); let zm = null;
  const finish = () => { if (done) return; done = true; removeEventListener('keydown', onKey); store.set('intro', true); box.style.opacity = 0; if (cue) cue.fade(1.2); if (sound.on) sound.startMusic(); setTimeout(() => { box.remove(); st.remove(); renderer && renderer.dispose(); zm && zm.dispose(); zm = null; }, 1100); onDone && onDone(); };
  $('.skip').onclick = () => (sound.whoosh(.8, false), finish());
  const onKey = e => { if (e.key === 'Escape' && !done) { removeEventListener('keydown', onKey); finish(); } };
  addEventListener('keydown', onKey);

  /* ---- 按钮:声音默认关,只有学习者自己点了才开 ---- */
  const go = $('.go');
  const enter = withSound => {
    if (withSound && !sound.on) { sound.on = true; dispatchEvent(new Event('ls-sound')); }
    sound.sparkle(6); sound.whoosh(1.4);
    warpAt = clock; go.classList.remove('on'); lens.classList.remove('on'); $('.ttl').style.opacity = 0; $('.cap').style.opacity = 0;
    setTimeout(finish, reducedMotion() ? 200 : 1300);
  };
  const b1 = document.createElement('button'); b1.className = 'p'; b1.textContent = '进入生命图谱 ›'; b1.onclick = () => enter(false);
  go.append(b1);
  /* ---- 门屏:声音默认关,由学习者自己选 ---- */
  const gate = $('.gate'), row = $('.gate .row');
  const begin = async withSound => {
    if (!gated) return; row.querySelectorAll('button').forEach(b => b.disabled = true);
    if (withSound) { sound.enableQuiet(); cue = await sound.cue('./audio/intro.m4a', .95, clock); }
    gated = false; gate.style.opacity = 0; gate.style.pointerEvents = 'none'; setTimeout(() => gate.remove(), 900);
  };
  const g1 = document.createElement('button'); g1.className = 'p'; g1.textContent = '🎧 带着声音进入'; g1.onclick = () => begin(true);
  const g2 = document.createElement('button'); g2.textContent = '静音进入'; g2.onclick = () => begin(false);
  row.append(g1, g2);
  if (replay) { gate.style.display = 'none'; begin(false); }
  /* ---- 镜头模块:循环播放一镜到底,点击展开全屏 ---- */
  
  const MAG = ['1', '50', '500', '10⁵', '10⁶', '5×10⁶'];
  lens.onclick = () => { if (done) return; sound.whoosh(1, true); onDive && setTimeout(onDive, 600); enter(false); };
  const showLens = async () => {
    lens.classList.add('on');
    try {
      const { createZoom } = await import('./ls-zoom.js');
      zm = createZoom(lens.querySelector('.lz'), { onLevel(i, L) { lens.querySelector('.obj').textContent = L.obj.split(/[::]/)[0]; lens.querySelector('.bar').textContent = L.bar; lens.querySelector('.mag').textContent = MAG[i] || ''; } });
      (async function loop() { while (zm && box.isConnected) { await zm.dive({ from: 0, per: 1.8, dwell: 700 }); await new Promise(r => setTimeout(r, 1200)); } })();
    } catch {}
  };

  /* ---- 标题「解码」:随机碱基字母逐个落定成汉字 ---- */
  const spans = [...box.querySelectorAll('h1 span')], word = '生命源码';
  let decodeStart = 0;
  const decode = c => {
    if (!decodeStart) decodeStart = c;
    const k = (c - decodeStart) * 3.2;
    spans.forEach((s, i) => { s.textContent = k > i + 1 ? word[i] : k > i - 1.5 ? 'ATGC'[Math.floor(Math.random() * 4)] : ''; s.style.color = k > i + 1 ? '' : '#34d399'; });
    if (k > 5) { $('.en').style.opacity = 1; $('.sub').style.opacity = 1; }
  };

  /* ---- 写实画面三幕:镜头推拉 + 交叉淡化 ---- */
  const plates = [...box.querySelectorAll('.pl')];
  const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  let px = 0, py = 0, burstAt = -9;
  const plate = (t, warp) => {
    const o1 = sm(0, .5, t) * (1 - sm(2.1, 2.7, t)), o2 = sm(2.1, 2.7, t) * (1 - sm(4.4, 5.1, t)), o3 = sm(4.4, 5.2, t) * (1 - warp);
    const pr = `translate(${px * -14}px,${py * -10}px)`;
    // 细胞:缓慢推近,分裂瞬间轻微横向拉伸
    plates[0].style.opacity = o1; plates[0].style.transform = `${pr} scale(${1 + t * .06}) scaleX(${1 + sm(.6, 1.8, t) * .035})`;
    // 双螺旋:从右向左掠过,一路推近
    plates[1].style.opacity = o2; plates[1].style.transform = `${pr} translateX(${6 - sm(2.1, 4.9, t) * 10}%) scale(${1.12 + sm(2.1, 4.9, t) * .16})`;
    // 生命之树:从下方升起、拉远;进入时冲进树冠
    const k3 = sm(4.4, 6.6, t);
    plates[2].style.opacity = o3; plates[2].style.transform = `${pr} translateY(${(1 - k3) * 9}%) scale(${1.22 - k3 * .17 + warp * warp * .9})`;
    plates[2].style.filter = `brightness(${.55 + k3 * .5 + .25 * Math.max(0, 1 - (t - 6.2) * 1.5) * (t > 6.2 ? 1 : 0)})`;
  };

  /* ---- WebGL 粒子:细胞质微粒 → 碱基光点 → 树冠萤光(低档不渲染) ---- */
  const cv = $('canvas');
  let THREE = null, scene, cam, pts, U;
  if (tier() !== 'low') {
    try {
      THREE = await import('./vendor/three.module.min.js');
      renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: false, alpha: true, powerPreference: 'high-performance' });
    } catch { renderer = null; }
  }
  if (renderer) {
    renderer.setPixelRatio(pixelRatio()); const PS = particleScale();
    scene = new THREE.Scene(); cam = new THREE.PerspectiveCamera(60, 1, .1, 200); cam.position.z = 10;
    let seed = 11; const rnd = () => (seed = seed * 16807 % 2147483647) / 2147483647;
    const N = Math.round(1800 * PS), P = [], C = [], S = [];
    const pal = ['#6ee7b7', '#34d399', '#5eead4', '#e2be78', '#fde68a', '#4ade80', '#60a5fa', '#f87171'];
    for (let i = 0; i < N; i++) { P.push((rnd() - .5) * 26, (rnd() - .5) * 16, -rnd() * 40); const c = new THREE.Color(pal[rnd() < .7 ? Math.floor(rnd() * 3) : 3 + Math.floor(rnd() * 5)]); C.push(c.r, c.g, c.b); S.push(rnd()); }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); geo.setAttribute('col', new THREE.Float32BufferAttribute(C, 3)); geo.setAttribute('sd', new THREE.Float32BufferAttribute(S, 1));
    U = { uT: { value: 0 }, uZ: { value: 0 }, uPR: { value: renderer.getPixelRatio() }, uB: { value: 0 }, uA: { value: 1 } };
    pts = new THREE.Points(geo, new THREE.ShaderMaterial({
      uniforms: U, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: `attribute vec3 col; attribute float sd; uniform float uT; uniform float uZ; uniform float uPR; uniform float uB; uniform float uA; varying vec3 vC; varying float vA;
        void main(){
          vec3 p = position; p.z = mod(p.z + uZ * (.6 + sd * .8) + 40., 40.) - 40.;
          p.x += sin(uT * .7 + sd * 30.) * .4; p.y += cos(uT * .5 + sd * 20.) * .3 + uB * (sd - .5) * 2.;
          vec4 mv = modelViewMatrix * vec4(p, 1.);
          gl_PointSize = (1.2 + sd * 2.6) * uPR * (1. + uB * 1.5) * (14. / -mv.z);
          gl_Position = projectionMatrix * mv;
          vC = col * (1. + uB); vA = smoothstep(-40., -28., p.z) * smoothstep(9.5, 6., -mv.z * -1. + 10.) * (.35 + .65 * sd) * uA;
        }`,
      fragmentShader: `varying vec3 vC; varying float vA; void main(){ float d = length(gl_PointCoord - .5); float a = smoothstep(.5, 0., d); gl_FragColor = vec4(vC * a * a * 1.6, a * vA); }`,
    }));
    scene.add(pts);
    const resize = () => { renderer.setSize(innerWidth, innerHeight, false); cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix(); };
    addEventListener('resize', resize); resize();
  } else cv.remove();

  /* ---- 交互:运行中点一下跳到结尾;结尾处点一下激起光点 ---- */
  let downAt = null;
  box.addEventListener('pointerdown', e => { if (!e.target.closest('button,.lens')) downAt = [e.clientX, e.clientY]; });
  addEventListener('pointermove', e => { px = e.clientX / innerWidth - .5; py = e.clientY / innerHeight - .5; });
  addEventListener('pointerup', e => {
    if (!downAt || done) return; const m = Math.abs(e.clientX - downAt[0]) + Math.abs(e.clientY - downAt[1]); downAt = null; if (m > 8) return;
    if (!gated && !shown && !warpAt) { runFrom = HOLD; runAt = performance.now(); return; }
    if (shown) { burstAt = clock; sound.tone(587.33 * (1 + Math.random() * .5), .6, { gain: .08 }); }
  });

  /* ---- 时间线 ---- */
  const capCode = $('.cap code'), capTxt = $('.cap span'); let capIdx = -1;
  let last = performance.now(), shown = false, holdAt = 0, runAt = 0, runFrom = 0, zz = 0;
  function frame(now) {
    if (!box.isConnected) return;
    if (document.hidden) { last = now; requestAnimationFrame(frame); return; }
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    if (warpAt) clock += dt; else if (gated) clock = 0; else { if (!runAt) { runAt = now; runFrom = clock; } clock = Math.min(HOLD, runFrom + (now - runAt) / 1000 * speed); }
    if (!gated && sound.on && !musicOn && (now - holdAt > 2500 && holdAt)) { musicOn = true; sound.startMusic(); }
    const t = warpAt ? HOLD : clock, warp = warpAt ? Math.min(1, (clock - warpAt) / 1.2) : 0;
    plate(gated ? .25 : t, warp);
    if (renderer) {
      const b = Math.max(Math.exp(-((t - 2.4) ** 2) * 8), Math.exp(-((t - 4.7) ** 2) * 8), warpAt ? 0 : Math.max(0, 1 - (clock - burstAt) * 1.5) * (burstAt > 0 ? 1 : 0));
      zz += dt * (2 + b * 18 + warp * 40); U.uT.value = now / 1000; U.uZ.value = zz; U.uB.value = b; U.uA.value = (gated ? .4 : 1) * (1 - warp * .6);
      cam.position.x = px * .8; cam.position.y = -py * .5; cam.lookAt(0, 0, -10);
      renderer.render(scene, cam);
    }
    // 字幕
    let ci = -1; CAPTIONS.forEach(([s0], i) => { if (t >= s0) ci = i; });
    if (!gated && ci !== capIdx && !warpAt && !shown) {
      capIdx = ci; const cap = $('.cap'); cap.style.opacity = 0;
      setTimeout(() => { if (ci >= 0) { capTxt.textContent = CAPTIONS[ci][1]; cap.style.opacity = 1; } }, 300);
    }
    if (!warpAt && !gated) capCode.textContent = '> ' + HBB.slice(0, Math.floor(clock * 9) % HBB.length + 6);
    if (t >= 5.6 && !warpAt) decode(now / 1000);
    if (t >= HOLD && !shown) { shown = true; holdAt = now; go.classList.add('on'); $('.ttl').classList.add('up'); $('.cap').style.opacity = 0; setTimeout(showLens, 500); }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  return { finish };
}
