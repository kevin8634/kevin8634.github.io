/* 觉弈 Ludoterra 2.0 · 心之透镜 Mind Lens(第一幕「看见透镜」)
 * 琥珀玻璃人脑 + 黄昏街道,三枚偏差旋钮(损失放大 / 近大远小 / 只见同色)。
 * 全部程序生成,无外部素材、无外部请求;Three.js 走 ../lt-three.js(默认 r186,?three=169 回滚)。
 * 画质三档:high = 透射+色散+虹彩玻璃;mid = 透射、无色散、像素比降;low = 半透明玻璃、无透射。无 WebGL → 纯 DOM 版,功能不减。
 * 第二幕「换一双眼睛」:借一个示意人物的透镜,分屏对照同一条街(横屏左右、竖屏上下);看过两双眼睛即写 a2。
 * ?q=high|mid|low 强制档位(存本机 gn:lt:lensq);减少动态 → 静止画面,只在旋钮变化时重绘。
 * 画面思路参考总指挥画质专长包(程序天空即光源、PMREM 环境、高度雾感、ACES、暗角颗粒),代码自写。 */
import { store, sound, reducedMotion, TASKS } from '../lt.js';
import { DOMAINS } from '../lt-data.js';

const $ = id => document.getElementById(id);
const STILL = reducedMotion || /[?&]capture\b/.test(location.search);   // ?capture:自测用,静止画面只在变化时重绘
const S = { loss: 2.25, time: 50, echo: 70, found: new Set(), done: false, act: 1, seen: new Set() };
const kDay = (L = S) => L.time / 100 * 0.01;                 // 双曲折扣率(每天)
const farFelt = (L = S) => 150 / (1 + kDay(L) * 365);        // 一年后 150 元的「感觉值」
const share = (L = S) => 1 / (2 - L.echo / 100);             // 同色信息在看到的信息里占比
const isTrue = () => S.loss <= 1.1 && S.time <= 3 && S.echo <= 10;
const bias = (L = S) => ((L.loss - 1) / 2 + L.time / 100 + L.echo / 100) / 3;
let G = null, B = null;                                      // B = 借来的透镜(第二幕),null 为单屏
/* 第二幕的示意透镜:数值是为说明机制而设的示意,不代表任何具体的人,也不是测量 */
const LENSES = [
  { id: 'kid', name: '八岁的孩子', loss: 1.6, time: 88, echo: 30, note: '孩子对未来的折扣通常更强——不是缺点,是管「等一等」的前额叶还在长。' },
  { id: 'burnt', name: '刚亏过一笔钱的人', loss: 2.9, time: 40, echo: 50, note: '刚经历过损失,对「失去」会格外敏感一阵,这很正常。' },
  { id: 'group', name: '只看一个群的人', loss: 2.0, time: 50, echo: 93, note: '不是 TA 不聪明,是 TA 的新闻屏上本来就几乎只有一种颜色。' },
  { id: 'saver', name: '在存首付的人', loss: 2.0, time: 10, echo: 55, note: '心里有一个清楚的远方目标,一年后的 150 就显得近多了。' }
];                                            // 3D 句柄(无 WebGL 时为 null)

const LINES = {
  start: '你正透过一颗玻璃大脑看这条街。街上有三样东西被它悄悄扭曲了——是哪三样?点街上的它们,或点下面的名字。',
  loss: '左边两张价签都是 100 元,一张是得到,一张是失去。为什么「失去」那张看起来大那么多?',
  time: '今天的 100 元就在眼前,一年后的 150 元在街的尽头。它真的只值那么一点吗?',
  echo: '新闻屏上本来有金、青两种颜色的观点各 3 条。你现在看到的,还是 3 比 3 吗?',
  all: '三处都找到了。现在试试:能不能把三枚旋钮拧到街道恢复真实比例的位置?',
  near: '快了。哪一枚旋钮还在偷偷扭曲画面?'
};
function say(t) { $('say').textContent = t; }

function paint() {
  $('v-loss').textContent = '×' + S.loss.toFixed(2);
  $('t-loss').innerHTML = `失去 ¥100 的难受 ≈ 得到 <em>¥${Math.round(S.loss * 100)}</em> 的开心。研究中的典型估计约 ×2.25(Tversky & Kahneman, 1992)。`;
  const f = farFelt(), pick = f < 100 ? '今天的 100' : '一年后的 150';
  $('v-time').textContent = S.time === 0 ? '不打折' : `每天 ${(kDay() * 100).toFixed(2)}%`;
  $('t-time').innerHTML = `一年后的 ¥150,感觉只值 <em>¥${Math.round(f)}</em>——所以你会选<em>${pick}</em>。(双曲折扣:感觉值 = 150 ÷ (1 + k × 天数))`;
  $('v-echo').textContent = S.echo + '% 被滤掉';
  $('t-echo').innerHTML = `同色观点占你看到信息的 <em>${Math.round(share() * 100)}%</em>(真实是 50%)。滤掉的那些并没有消失,只是你看不见。`;
  $('s2a').textContent = '+100 · −' + Math.round(S.loss * 100); $('s2a').style.transform = `scale(${(0.8 + S.loss * 0.15).toFixed(2)})`;
  $('s2b').textContent = `一年后 150 → ${Math.round(f)}`;
  $('s2c').textContent = '●●●' + '○○○'.slice(0, Math.max(0, Math.round(3 * (1 - S.echo / 100))));
  if (G) G.update(S);
}

function find(k) {
  if (S.found.has(k)) return; S.found.add(k); sound.bell(S.found.size + 1, 0.1, 1.4);
  document.querySelector(`#find [data-k="${k}"]`).classList.add('got'); $('k-' + k).classList.add('on');
  say(S.found.size === 3 ? LINES.all : LINES[k]); if (G) G.reveal(k);
}

function check() {
  if (S.found.size < 3 || S.done) return;
  if (isTrue()) {
    S.done = true; store.set('lens', Object.assign({}, store.get('lens', {}) || {}, { a1: true, t: Date.now() }));
    [0, 2, 4, 7].forEach((s, i) => setTimeout(() => sound.bell(s, 0.09, 2.2), i * 140));
    const d = $('done'); d.classList.add('on');
    d.innerHTML = '<b style="color:var(--gold)">这就是没有透镜时的街。</b><br>价签一样大,一年后的 150 比今天的 100 多,新闻屏金青各半。可在真实生活里,透镜一直都在,而且每个人戴的不一样。<br><button class="lt-btn" type="button" id="go2" style="margin-top:8px">进入第二幕「换一双眼睛」→</button>';
    $('go2').onclick = () => setAct(2); lockTabs();
    say('你把街道拧回了真实比例。想一想:刚才最难拧回去的是哪一枚?它在你生活里出现在哪儿?');
    if (G) G.resolve();
  } else if (bias() < 0.12) say(LINES.near);
}

function lossFelt(L) { return Math.round(L.loss * 100); }
function paint2() {
  if (!B) { $('cmp').innerHTML = ''; return; }
  const row = (k, a, b) => `<tr><th>${k}</th><td>${a}</td><td>${b}</td></tr>`;
  $('cmp').innerHTML = `<tr><th></th><td>你</td><td>${B.name}</td></tr>` +
    row('失去 ¥100 像失去', '¥' + lossFelt(S), '¥' + lossFelt(B)) +
    row('一年后 ¥150 感觉值', '¥' + Math.round(farFelt(S)), '¥' + Math.round(farFelt(B))) +
    row('同色观点占比', Math.round(share(S) * 100) + '%', Math.round(share(B) * 100) + '%');
}
function borrow(id) {
  const L = LENSES.find(x => x.id === id); if (!L) return; B = L; S.seen.add(id);
  document.querySelectorAll('#lenses [data-l]').forEach(b => b.classList.toggle('got', b.dataset.l === id));
  sound.bell(3 + LENSES.indexOf(L), 0.08, 1.2); paint2(); if (G) G.borrow(L);
  const big = [['loss', (L.loss - 1) / 2], ['time', L.time / 100], ['echo', L.echo / 100]].sort((a, b) => b[1] - a[1])[0][0];
  const where = { loss: '「失去」那张价签', time: '街尽头的广告牌', echo: '新闻屏' }[big];
  say(`借来了「${L.name}」的透镜。${L.note} 对照看看:在 TA 眼里,变化最大的是${where}。`);
  if (S.seen.size >= 2 && !$('done2').classList.contains('on')) {
    store.set('lens', Object.assign({}, store.get('lens', {}) || {}, { a2: true, t2: Date.now() }));
    const d = $('done2'); d.classList.add('on');
    d.innerHTML = '<b style="color:var(--gold)">你已经借过两双眼睛了。</b><br>同一条街、同样的价签,每个人看到的大小都不一样——大多数争吵,其实是两副透镜在对话。下次和人意见不合时,可以先问一句:「我们是不是戴着不同的透镜?」<br>' +
      '<a class="lt-btn" style="margin-top:8px" href="/pre-singularity/truth/">星桥 → 奇点前夜 · 这段话是 AI 写的吗</a><br><span style="color:var(--mute)">第三幕「破茧」:把旋钮拧成你愿意的样子——下一版开放。</span>';
  }
}
function setAct(n) {
  if (n === 2 && !unlocked2()) return;
  S.act = n; document.documentElement.dataset.act = n;
  document.querySelectorAll('#acts [data-a]').forEach(b => { b.classList.toggle('on', +b.dataset.a === n); b.setAttribute('aria-pressed', +b.dataset.a === n); });
  if (n === 2) { ['loss', 'time', 'echo'].forEach(k => { S.found.add(k); $('k-' + k).classList.add('on'); });
    say('同一条街,换一双眼睛。挑一个人,借 TA 的透镜看一看——' + (innerHeight > innerWidth ? '上面' : '左边') + '是你的,' + (innerHeight > innerWidth ? '下面' : '右边') + '是 TA 的。你的三枚旋钮仍然可以拧。');
    if (!B) borrow(LENSES[0].id); }
  else { B = null; paint2(); if (G) G.borrow(null); say(S.done ? '你把街道拧回了真实比例。想一想:刚才最难拧回去的是哪一枚?它在你生活里出现在哪儿?' : S.found.size === 3 ? LINES.all : LINES.start); }
}
function unlocked2() { return S.done || !!(store.get('lens', {}) || {}).a1; }
function lockTabs() { const b = document.querySelector('#acts [data-a="2"]'); const u = unlocked2(); b.disabled = !u; b.title = u ? '' : '先完成第一幕'; }

function bindUI() {
  document.querySelectorAll('#find [data-k]').forEach(b => b.onclick = () => find(b.dataset.k));
  const on = (id, key, num) => { const r = $(id); r.value = S[key]; r.oninput = () => { S[key] = num(r.value); paint(); paint2(); tone(); check(); }; };
  document.querySelectorAll('#acts [data-a]').forEach(b => b.onclick = () => setAct(+b.dataset.a));
  document.querySelectorAll('#lenses [data-l]').forEach(b => b.onclick = () => borrow(b.dataset.l));
  on('r-loss', 'loss', parseFloat); on('r-time', 'time', v => parseInt(v, 10)); on('r-echo', 'echo', v => parseInt(v, 10));
  $('bReset').onclick = () => { Object.assign(S, { loss: 2.25, time: 50, echo: 70, done: false }); ['loss', 'time', 'echo'].forEach(k => $('r-' + k).value = S[k]);
    $('done').classList.remove('on'); paint(); paint2(); if (G) G.unresolve(); if (S.act === 1) say(S.found.size === 3 ? LINES.all : LINES.start); };
}
/* 声音即规律:玻璃钟两音,偏差越大拍频越快(失谐),默认关 */
let lastTone = 0;
function tone() {
  if (!sound.on()) return; const now = performance.now(); if (now - lastTone < 120) return; lastTone = now;
  const c = sound.ctx(); if (!c) return; const t = c.currentTime, f = 392, b = bias();
  [f, f * (1 + 0.035 * b)].forEach(fr => { const o = c.createOscillator(), g = c.createGain(); o.type = 'sine'; o.frequency.value = fr;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.05, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9); o.connect(g).connect(c.destination); o.start(t); o.stop(t + 1); });
}

function grain() {
  const c = $('grain'), n = 128; c.width = c.height = n; const x = c.getContext('2d'); const im = x.createImageData(n, n);
  let s = 7; for (let i = 0; i < n * n; i++) { s = (s * 16807) % 2147483647; const v = s % 255; im.data.set([v, v, v, 255], i * 4); }
  x.putImageData(im, 0, 0); c.style.imageRendering = 'pixelated';
}

function pickTier() {
  try { const m = /[?&]q=(high|mid|low)\b/.exec(location.search); if (m) { localStorage.setItem('gn:lt:lensq', m[1]); return m[1]; }
    const s = localStorage.getItem('gn:lt:lensq'); if (s === 'high' || s === 'mid' || s === 'low') return s; } catch (_) {}
  let r = ''; try { const gl = document.createElement('canvas').getContext('webgl2') || document.createElement('canvas').getContext('webgl');
    if (!gl) return 'none'; const e = gl.getExtension('WEBGL_debug_renderer_info'); r = e ? gl.getParameter(e.UNMASKED_RENDERER_WEBGL) : ''; } catch (_) { return 'none'; }
  if (/swiftshader|llvmpipe|software|mali-[34]|adreno \(tm\) [3-5]|powervr/i.test(r)) return 'low';
  if (/mobile|android|iphone|ipad/i.test(navigator.userAgent) || innerWidth < 760 || /intel|uhd|iris/i.test(r)) return 'mid';
  return 'high';
}

export async function boot() {
  bindUI(); grain(); paint(); document.documentElement.dataset.act = 1;
  const tier = pickTier();
  if (tier !== 'none') { try { G = await make3D(tier); } catch (e) { G = null; } }
  if (G) paint(); else document.documentElement.classList.add('nogl');
  lockTabs(); if (/[?&]act=2\b/.test(location.search)) setAct(2);
  window.__lens = { S, tier: G ? tier : 'none', three: G && G.rev, find, act: setAct, borrow, shot: () => G && G.shot(), set(k, v) { S[k] = v; $('r-' + k).value = v; paint(); paint2(); check(); } };
}

/* ======================= 3D ======================= */
async function make3D(tier) {
  const THREE = await (await import('../lt-three.js')).loadThree();
  const cv = $('gl'); let R;
  try { R = new THREE.WebGLRenderer({ canvas: cv, antialias: tier !== 'low', powerPreference: 'high-performance' }); } catch (_) { return null; }
  if (!R.getContext()) return null;
  const MOB = innerWidth < 760;
  const cap = tier === 'high' ? 2 : tier === 'mid' ? (MOB ? 1.25 : 1.5) : 1;
  let scale = 1; const dpr = () => Math.min(devicePixelRatio || 1, cap) * scale;
  R.toneMapping = THREE.ACESFilmicToneMapping; R.toneMappingExposure = 1.05; R.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(45, 1, 0.1, 400);
  const SUN = new THREE.Vector3(0, 0.07, -1).normalize();

  /* 1) 程序天空 = 光源:天顶靛蓝 → 地平线暖金,太阳光晕在街道尽头 */
  const skyMat = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, uniforms: { uSun: { value: SUN } },
    vertexShader: 'varying vec3 vD;void main(){vD=normalize(position);vec4 p=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_Position=p.xyww;}',
    fragmentShader: `varying vec3 vD;uniform vec3 uSun;void main(){float h=clamp(vD.y,-.2,1.);
      vec3 zen=vec3(.05,.06,.17),mid=vec3(.42,.22,.30),hor=vec3(1.25,.62,.30);
      vec3 c=mix(hor,mid,smoothstep(0.,.18,h));c=mix(c,zen,smoothstep(.15,.7,h));
      float mu=max(dot(normalize(vD),uSun),0.);c+=vec3(1.4,.75,.35)*(pow(mu,48.)*2.2+pow(mu,6.)*.35);c+=vec3(2.6,1.9,1.2)*smoothstep(.9993,.9997,mu);
      if(h<0.)c=mix(c,vec3(.10,.07,.08),smoothstep(0.,-.12,h));gl_FragColor=vec4(c,1.);}` });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(300, 48, 24), skyMat); scene.add(sky);
  const pm = new THREE.PMREMGenerator(R); const envScene = new THREE.Scene(); envScene.add(new THREE.Mesh(new THREE.SphereGeometry(300, 32, 16), skyMat));
  scene.environment = pm.fromScene(envScene, 0.02).texture; pm.dispose();
  scene.fog = new THREE.FogExp2(0x3a2630, 0.022);
  scene.add(new THREE.HemisphereLight(0x8a7090, 0x1a1012, 0.25));
  const sun = new THREE.DirectionalLight(0xffb070, 2.2); sun.position.set(0, 4, -40); scene.add(sun);
  const key = new THREE.DirectionalLight(0xbfd0ff, 0.5); key.position.set(-4, 5, 8); scene.add(key);

  /* 2) 街道:湿地面反射天空、两排楼(暖窗自发光)、路灯光点 */
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(60, 200), new THREE.MeshStandardMaterial({ color: 0x15110f, roughness: 0.32, metalness: 0.1 }));
  ground.rotation.x = -Math.PI / 2; ground.position.z = -70; scene.add(ground);
  for (let i = 0; i < 26; i++) { const d = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 1.6), new THREE.MeshBasicMaterial({ color: 0x5a4430 })); d.rotation.x = -Math.PI / 2; d.position.set(0, 0.01, -3 - i * 5); scene.add(d); }
  const wc = document.createElement('canvas'); wc.width = 64; wc.height = 128; const wx = wc.getContext('2d'); wx.fillStyle = '#000'; wx.fillRect(0, 0, 64, 128);
  let sd = 3; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
  for (let y = 4; y < 124; y += 8) for (let x = 4; x < 60; x += 10) if (rnd() < 0.45) { wx.fillStyle = `rgba(255,${170 + rnd() * 60 | 0},${90 + rnd() * 60 | 0},${0.5 + rnd() * 0.5})`; wx.fillRect(x, y, 6, 4); }
  const wt = new THREE.CanvasTexture(wc); wt.colorSpace = THREE.SRGBColorSpace; wt.wrapS = wt.wrapT = THREE.RepeatWrapping; wt.repeat.set(1, 2);
  const nB = tier === 'low' ? 36 : 56;
  const bld = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: 0x2a2430, roughness: 0.8, emissive: 0xffc070, emissiveMap: wt, emissiveIntensity: 1.3 }), nB);
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), Sx = new THREE.Vector3();
  for (let i = 0; i < nB; i++) { const side = i % 2 ? 1 : -1, z = 4 - (i >> 1) * (140 / (nB / 2)) - rnd() * 2, h = 6 + rnd() * 22, w = 3 + rnd() * 3;
    M.compose(V.set(side * (6.5 + w / 2 + rnd() * 2), h / 2, z), Q, Sx.set(w, h, 4 + rnd() * 3)); bld.setMatrixAt(i, M); }
  scene.add(bld);
  const glowTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.25, 'rgba(255,220,160,.55)'); g.addColorStop(1, 'rgba(255,180,90,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
  const glowMat = col => new THREE.SpriteMaterial({ map: glowTex, color: col, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, toneMapped: false });
  for (let i = 0; i < 14; i++) for (const s of [-1, 1]) { const sp = new THREE.Sprite(glowMat(0xffc27a)); sp.position.set(s * 5.4, 4.2, 2 - i * 10); sp.scale.setScalar(1.6); scene.add(sp);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 4.2, 6), new THREE.MeshStandardMaterial({ color: 0x1c1a1e, roughness: 0.5, metalness: 0.6 })); pole.position.set(s * 5.4, 2.1, 2 - i * 10); scene.add(pole); }
  const sunGlow = new THREE.Sprite(glowMat(0xffa860)); sunGlow.position.copy(SUN).multiplyScalar(180); sunGlow.scale.setScalar(70); scene.add(sunGlow);

  /* 3) 街上三样「被扭曲的东西」:价签(得/失)、时钟+远处广告牌、新闻屏;画布贴图,旋钮一动就重画 */
  const signs = {};
  function sign(id, w, h, pos, draw) {
    const mk = () => { const c = document.createElement('canvas'); c.width = 512; c.height = Math.round(512 * h / w); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return { c, x: c.getContext('2d'), t }; };
    const A = mk(), Bt = mk(); const c = A.c, t = A.t;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, transparent: true, toneMapped: false, fog: false }));
    const g = new THREE.Group(); g.add(m); g.position.copy(pos); scene.add(g); m.userData.k = id.split('-')[0];
    const halo = new THREE.Sprite(glowMat(0xffd28a)); halo.scale.set(w * 1.6, h * 1.6, 1); halo.material.opacity = 0; g.add(halo); halo.position.z = -0.05;
    signs[id] = { tex: [A, Bt], m, g, halo, draw, w, h }; return signs[id];
  }
  const rr = (x, X, Y, W, H, r) => { x.beginPath(); x.moveTo(X + r, Y); x.arcTo(X + W, Y, X + W, Y + H, r); x.arcTo(X + W, Y + H, X, Y + H, r); x.arcTo(X, Y + H, X, Y, r); x.arcTo(X, Y, X + W, Y, r); x.closePath(); };
  const panel = (x, c, col, alpha = 0.82) => { x.clearRect(0, 0, c.width, c.height); rr(x, 6, 6, c.width - 12, c.height - 12, 26); x.fillStyle = `rgba(14,12,26,${alpha})`; x.fill(); x.lineWidth = 6; x.strokeStyle = col; x.stroke(); };
  const txt = (x, s, X, Y, size, col, w = 800) => { x.font = `${w} ${size}px "Noto Sans SC","PingFang SC",sans-serif`; x.fillStyle = col; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(s, X, Y); };
  sign('loss-gain', 1.1, 0.8, new THREE.Vector3(-3.3, 1.5, -1.2), (x, c, L) => { panel(x, c, '#f5c26b'); txt(x, '得到', 256, 110, 64, '#ffe2a8'); txt(x, '+¥100', 256, 245, 120, '#ffd27a'); });
  sign('loss-lose', 1.1, 0.8, new THREE.Vector3(-1.95, 1.5, -1.6), (x, c, L) => { panel(x, c, '#ff8a6b'); txt(x, '失去', 256, 110, 64, '#ffc2b0'); txt(x, '−¥100', 256, 245, 120, '#ff9f86'); });
  sign('time-now', 0.9, 0.9, new THREE.Vector3(3.1, 2.15, -1.6), (x, c, L) => { panel(x, c, '#f5c26b');
    x.save(); x.translate(256, 210, 0); x.strokeStyle = '#ffe2a8'; x.lineWidth = 10; x.beginPath(); x.arc(0, 0, 130, 0, 7); x.stroke(); x.lineWidth = 14; x.beginPath(); x.moveTo(0, 0); x.lineTo(0, -95); x.moveTo(0, 0); x.lineTo(70, 30); x.stroke(); x.restore();
    txt(x, '今天 ¥100', 256, 430, 64, '#ffd27a'); });
  sign('time-far', 6.4, 3.2, new THREE.Vector3(3.6, 6.2, -34), (x, c, L) => { panel(x, c, '#7fd7e0', 0.88); txt(x, '一年后 ¥150', 256, 95, 70, '#bff3f7');
    txt(x, `感觉只值 ¥${Math.round(farFelt(L))}`, 256, 185, 50, L.time ? '#ffcf9a' : '#bff3f7', 600); });
  sign('echo-news', 3.4, 1.6, new THREE.Vector3(0, 3.3, -7), (x, c, L) => { panel(x, c, '#f5c26b', 0.9); txt(x, '今日新闻', 256, 34, 30, '#ffe2a8', 600);
    const items = [['同色观点 1', 0], ['异色观点 1', 1], ['同色观点 2', 0], ['异色观点 2', 1], ['同色观点 3', 0], ['异色观点 3', 1]], a = 1 - L.echo / 100;
    items.forEach(([s, o], i) => { const X = 30 + (i % 2) * 232, Y = 66 + (i >> 1) * 56; x.globalAlpha = o ? Math.max(0.04, a) : 1;
      rr(x, X, Y, 220, 46, 12); x.fillStyle = o ? 'rgba(60,170,190,.45)' : 'rgba(245,194,107,.45)'; x.fill(); txt(x, s, X + 110, Y + 24, 26, o ? '#c8f4f8' : '#fff0cc', 600); x.globalAlpha = 1; }); });
  const redraw = (side = 0, L = S) => { for (const s of Object.values(signs)) { const T = s.tex[side]; s.draw(T.x, T.c, L); T.t.needsUpdate = true; } };

  /* 4) 琥珀玻璃人脑:球面位移出脑回脑沟 + 小脑;透射+色散+薄膜虹彩;内部八束光丝 = 八域 */
  const seg = tier === 'high' ? [180, 130] : tier === 'mid' ? [128, 92] : [80, 56];
  const hsh = (x, y, z) => { const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return s - Math.floor(s); };
  const vn = (x, y, z) => { const X = Math.floor(x), Y = Math.floor(y), Z = Math.floor(z), fx = x - X, fy = y - Y, fz = z - Z, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy), w = fz * fz * (3 - 2 * fz);
    const L = (a, b, t) => a + (b - a) * t; const h = (i, j, k) => hsh(X + i, Y + j, Z + k);
    return L(L(L(h(0, 0, 0), h(1, 0, 0), u), L(h(0, 1, 0), h(1, 1, 0), u), v), L(L(h(0, 0, 1), h(1, 0, 1), u), L(h(0, 1, 1), h(1, 1, 1), u), v), w); };
  const gyri = (x, y, z) => { let a = 0, f = 3.2, amp = 1; for (let o = 0; o < 3; o++) { a += amp * (1 - Math.abs(vn(x * f, y * f, z * f) * 2 - 1)); f *= 2.1; amp *= 0.45; } return a; };
  function brainGeo(sx, sy, sz, amp) {
    const g = new THREE.SphereGeometry(1, seg[0], seg[1]); const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { V.fromBufferAttribute(p, i); const d = gyri(V.x + 5, V.y + 5, V.z + 5);
      let r = 1 + amp * (d - 1.1); r -= 0.10 * Math.exp(-Math.pow(V.z / 0.07, 2)) * Math.max(0, V.y + 0.2);   // 正中纵裂
      p.setXYZ(i, V.x * r * sx, V.y * r * sy * (V.y < 0 ? 0.8 : 1), V.z * r * sz); }
    g.computeVertexNormals(); return g;
  }
  const glass = new THREE.MeshPhysicalMaterial({ color: 0xffe6bf, metalness: 0, roughness: 0.07, ior: 1.45, envMapIntensity: 1.25,
    clearcoat: 1, clearcoatRoughness: 0.06, specularIntensity: 1, specularColor: 0xfff0d8 });
  if (tier === 'low') Object.assign(glass, { transparent: true, opacity: 0.38, emissive: new THREE.Color(0x3a2208), depthWrite: false });
  else { Object.assign(glass, { transmission: 1, thickness: 0.9, attenuationColor: new THREE.Color(0xffb347), attenuationDistance: 1.8, iridescence: 0.35, iridescenceIOR: 1.3 });
    if (tier === 'high' && 'dispersion' in glass) glass.dispersion = 0.35; }
  const brain = new THREE.Group(); brain.position.set(1.15, 1.08, 2.3); brain.scale.setScalar(0.72); scene.add(brain);
  const cere = new THREE.Mesh(brainGeo(0.42, 0.28, 0.5, 0.05), glass); cere.position.set(-0.62, -0.4, 0); brain.add(cere);
  const cortex = new THREE.Mesh(brainGeo(1.0, 0.72, 0.8, 0.07), glass); brain.add(cortex);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.08, 0.6, 16), glass); stem.position.set(-0.3, -0.72, 0); stem.rotation.z = -0.35; brain.add(stem);
  brain.rotation.y = 0.28;
  /* 八束光丝:每域一条,已点亮(该域有通关任务)明亮,未点亮是暗线 */
  const lit = d => TASKS.some(t => t.live && t.domains && t.domains.includes(d.id) && (store.get(t.id, {}) || {}).done);
  const fil = []; DOMAINS.forEach((d, i) => { const pts = []; const a0 = i / DOMAINS.length * Math.PI * 2;
    for (let j = 0; j < 6; j++) { const a = a0 + j * 0.9, r = 0.25 + 0.3 * hsh(i, j, 1); pts.push(new THREE.Vector3(Math.cos(a) * r * 1.3, (hsh(i, j, 2) - 0.5) * 0.6, Math.sin(a) * r * 0.9)); }
    const on = lit(d); const m = new THREE.MeshBasicMaterial({ color: new THREE.Color(d.color || '#f5c26b').multiplyScalar(on ? 2.6 : 0.35), transparent: true, opacity: on ? 1 : 0.5, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
    const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 80, on ? 0.014 : 0.008, 6, true), m); brain.add(tube); fil.push({ m, on, i }); });
  const core = new THREE.Sprite(glowMat(0xffc46b)); core.scale.setScalar(1.1); core.material.opacity = 0.55; brain.add(core);
  const pl = new THREE.PointLight(0xffb85a, 3, 6, 2); brain.add(pl);

  /* 5) 相机:轻微呼吸 + 拖动环视(限角) */
  let yaw = 0, pitch = 0, tyaw = 0, tpitch = 0, drag = null;
  cv.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY, yaw: tyaw, pitch: tpitch, moved: false }; });
  addEventListener('pointerup', e => { if (drag && !drag.moved) pick(e); drag = null; });
  addEventListener('pointermove', e => { if (!drag) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y; if (Math.abs(dx) + Math.abs(dy) > 6) drag.moved = true;
    tyaw = Math.max(-0.35, Math.min(0.35, drag.yaw - dx * 0.003)); tpitch = Math.max(-0.12, Math.min(0.15, drag.pitch - dy * 0.002)); kick(); });
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function pick(e) { if (B) return; const r = cv.getBoundingClientRect(); ndc.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1); ray.setFromCamera(ndc, cam);
    const hit = ray.intersectObjects(Object.values(signs).map(s => s.m))[0]; if (hit) find(hit.object.userData.k); }

  /* 旋钮 → 画面:损失放大让「失去」牌变大;折扣让远牌缩小;过滤让异色新闻淡出;玻璃随总偏差变浑、变暖 */
  const st = { loss: 1, near: 1, far: 1, b: 0, resolved: 0 }, stB = { loss: 1, near: 1, far: 1, b: 0, resolved: 0 };
  const calc = (o, L) => { o.loss = Math.pow(L.loss, 0.6); o.far = Math.max(0.18, farFelt(L) / 150); o.near = 1 + (1 - o.far) * 0.35; o.b = bias(L); };
  function update(s) { calc(st, s); redraw(0, s); kick(); }
  function borrow(L) { if (L) { calc(stB, L); redraw(1, L); } size(); }
  function apply(t, st, side) {
    for (const s of Object.values(signs)) s.m.material.map = s.tex[side].t;
    signs['loss-lose'].g.scale.setScalar(st.loss); signs['time-far'].g.scale.setScalar(st.far); signs['time-now'].g.scale.setScalar(st.near);
    const b = st.b * (1 - st.resolved);
    if (tier !== 'low') { glass.ior = 1.3 + 0.55 * b; glass.thickness = 0.35 + 0.9 * b; glass.attenuationDistance = 5.5 - 3 * b; glass.roughness = 0.04 + 0.18 * b * b; glass.iridescence = 0.15 + 0.5 * b; }
    else glass.opacity = 0.28 + 0.25 * b;
    const pulse = STILL ? 1 : 0.85 + 0.15 * Math.sin(t * 1.7);
    fil.forEach(f => { f.m.opacity = (f.on ? 1 : 0.45) * pulse * (0.6 + 0.4 * (1 - b)) + st.resolved * 0.3; });
    core.material.opacity = 0.35 + 0.4 * st.resolved + 0.15 * pulse; pl.intensity = 2 + 3 * st.resolved;
    for (const s of Object.values(signs)) s.halo.material.opacity += ((S.found.has(s.m.userData.k) ? 0 : 0.35 * pulse) - s.halo.material.opacity) * 0.2;
  }
  /* 视口与相机:单屏全画布;分屏时横屏左右(避开左侧面板)、竖屏上下(避开底部面板) */
  let views = [];
  function camFor(aspect, wide) { cam.aspect = aspect; const p = aspect < 1;
    cam.fov = p ? Math.min(80, Math.max(55, 2 * Math.atan(Math.tan(0.46) / aspect) * 57.3)) : 45; cam.updateProjectionMatrix();
    lookY = p ? -0.2 : 1.75; base.set(p ? 0.4 : (wide ? -1.1 : -0.6), p ? 2.1 : 1.7, p ? 10.5 : 6.4); }
  function size() { const w = innerWidth, h = innerHeight; R.setPixelRatio(dpr()); R.setSize(w, h, false);
    const lab = [$('labA'), $('labB')];
    if (!B) { views = [[0, 0, w, h]]; lab.forEach(l => l.hidden = true); }
    else if (h > w || (w <= 1100 && matchMedia('(orientation:portrait)').matches)) { const H = Math.round(h * (w <= 760 || h > w ? 0.54 : 1)), hh = H >> 1;
      views = [[0, h - hh, w, hh], [0, h - H, w, H - hh]]; place(lab[0], 8, 54); place(lab[1], 8, hh + 6); }
    else { const x0 = w >= 1000 ? 410 : 0, W = (w - x0) >> 1; views = [[x0, 0, W, h], [x0 + W, 0, w - x0 - W, h]]; place(lab[0], x0 + 10, 60); place(lab[1], x0 + W + 10, 60); }
    if (B) { lab[0].textContent = '你的透镜'; lab[1].textContent = B.name + ' 的透镜'; }
    kick(); }
  function place(l, x, y) { l.hidden = false; l.style.left = x + 'px'; l.style.top = y + 'px'; }
  const base = new THREE.Vector3(), tgt = new THREE.Vector3(); let lookY = 1.75;
  addEventListener('resize', size);
  let raf = 0, last = performance.now(), T = 0, frames = 0, acc = 0, dirty = true;
  function kick() { dirty = true; if (STILL && !raf) raf = requestAnimationFrame(loop); }
  function frame(dt) {
    T += dt; yaw += (tyaw - yaw) * 0.08; pitch += (tpitch - pitch) * 0.08;
    const br = STILL ? 0 : 1;
    brain.rotation.y = 0.28 + Math.sin(T * 0.15) * 0.12 * br; if (st.resolved < 1 && G && G.resolving) st.resolved = Math.min(1, st.resolved + dt * 0.6);
    const W = innerWidth, split = views.length > 1; R.setScissorTest(false); if (split) { R.setClearColor(0x070814, 1); R.setViewport(0, 0, W, innerHeight); R.clear(); R.setScissorTest(true); }
    views.forEach((v, side) => { camFor(v[2] / v[3], v[2] >= 1100);
      cam.position.set(base.x + Math.sin(T * 0.21) * 0.12 * br, base.y + Math.sin(T * 0.33) * 0.05 * br, base.z);
      tgt.set(base.x * 0.55 + Math.sin(yaw) * 8, lookY + Math.sin(pitch) * 8, base.z - 8); cam.lookAt(tgt);
      R.setViewport(v[0], v[1], v[2], v[3]); if (split) R.setScissor(v[0], v[1], v[2], v[3]);
      apply(T, side ? stB : st, side); R.render(scene, cam); });
  }
  function loop(now) {
    raf = 0; const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (document.hidden) return;
    if (!STILL || dirty || (G && G.resolving && st.resolved < 1)) { frame(dt); dirty = false; }
    if (!STILL) { frames++; acc += dt; if (acc > 1.5) { const fps = frames / acc; frames = 0; acc = 0;
        if (fps < 40 && scale > 0.55) { scale = Math.max(0.55, scale - 0.1); size(); } else if (fps > 57 && scale < 1) { scale = Math.min(1, scale + 0.05); size(); } } }
    if (!STILL || dirty || (G && G.resolving && st.resolved < 1)) raf = requestAnimationFrame(loop);
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden && !raf) { last = performance.now(); raf = requestAnimationFrame(loop); } });
  cv.addEventListener('webglcontextlost', e => { e.preventDefault(); document.documentElement.classList.add('nogl'); });
  redraw(); size(); frame(0.016); raf = requestAnimationFrame(loop);
  if (STILL) $('hint').textContent = '点街上的牌子 · 拖动可环视';
  const api = { rev: THREE.REVISION, resolving: false, update, borrow, reveal() { kick(); },
    resolve() { api.resolving = true; kick(); }, unresolve() { api.resolving = false; st.resolved = 0; kick(); },
    shot() { frame(0.016); return cv.toDataURL('image/png'); } };
  window.__dbg = { renderer: R, scene, camera: cam };
  return api;
}
