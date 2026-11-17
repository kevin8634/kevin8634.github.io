/* 奇点前夜 2.0 · 玻璃心智 B「透过玻璃心智看决策」第一幕「它看见了什么」
   写实办公室(黄昏落地窗、木桌、显示器、三份方案牌)+ 前景玻璃脑(真透射:桌上的方案牌透过玻璃被折弯、色散);
   AI 助手嘴上说「我选 A:风险最低」(理由牌出镜),玻璃脑里一条发光光路却落在另一张牌的另一行字上。
   学习者把透明度拧到能看清,再指出光路真正落在哪张牌 → 过关。
   参考(只借思路,代码自写):three.js 官方示例 physical_transmission / unreal_bloom(MIT);
   drei MeshTransmissionMaterial 的「玻璃后场景被折射」思路(MIT,同 04 改码·玻璃细胞)。
   档位:high/mid = Three.js 透射 + 辉光;lite = 无后期;low / 无 WebGL = Canvas 2D 同玩法;减少动态 = 静止、按需重绘。
   进度键 gn:ps:glassb(新键,不改 1.0 任务 id 与 gn:ps:glass)。全部本地,无外部请求。 */
import { pickTier, reducedMotion, TIERS } from '../ps-scene.js?v=11';

const $ = (id) => document.getElementById(id);
const RM = reducedMotion();
const KEY = 'gn:ps:glassb';
const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || { d: [] }; } catch (e) { return { d: [] }; } };
const save = (s) => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} };
const prog = load();
const tone = (f, d = .9, v = .08) => { try { window.PS && PS.tone(f, d, v, 'sine'); } catch (e) {} };

/* ---------- 模型 ---------- */
const CARDS = [
  { n: 'A', t: '稳健型', rows: ['年化回报 8%', '最大回撤 3%', '客户好评 4.6'] },
  { n: 'B', t: '激进型', rows: ['年化回报 31%', '最大回撤 42%', '点赞 9.8 万'] },
  { n: 'C', t: '均衡型', rows: ['年化回报 15%', '最大回撤 12%', '客户好评 4.4'] },
];
const S = { g: .6, c: .45, t: .15, picked: -1, hints: 0, act: 1, q: -1 };
// 目标偏移越大,它越追「点赞」这个代理指标:光路落在 B 的第 3 行;偏移小时落在 A 的第 2 行(真在看风险)
const target = () => {
  if (S.act === 2) return { c: 1, r: 0, h: 1 };                       // 第二幕:嘴上只说回报,暗线扫过「回撤 42%」又被压下
  if (S.act === 3 && S.q === 2) return { c: 2, r: 0 };                  // 第三幕:反事实一问,光路改落 C
  return S.g >= .3 ? { c: 1, r: 2 } : { c: 0, r: 1 };
};
// 每幕的理由牌文字(第三幕随你的提问改变)
const REASON = () => S.act === 1 ? ['「我选 A:风险最低,', '  回报也稳定。」'] : S.act === 2 ? ['「我选 B:年化 31%,', '  回报最高。」']
  : [['「我选 B,因为', '  回报最高。」'], ['「点赞 61% · 年化 34%', '  · 回撤 5%」'], ['「不。去掉点赞,', '  我会选 C。」']][S.q] || ['「我选 B。」', '  (等你提问)'];
const PICKS = { 1: ['方案 A', '方案 B', '方案 C'], 2: ['年化回报 31%', '最大回撤 42%', '点赞 9.8 万'],
  3: ['你为什么选它?', '你看了哪几项?各占多少?', '如果点赞不算,你还选它吗?'] };
const clearEnough = () => S.t >= .7;
const say = (t) => { $('say').textContent = t; };
const stat = (t) => { $('stat').textContent = t || ''; };
const LINES = {
  intro: '经理说:「帮我挑最值得投的那份。」它回答:「我选 A,因为风险最低。」——你能确认它真是这么想的吗?',
  fog: '雾这么浓,你看清它脑子里那条光,最后停在哪张牌上了吗?',
  wrong: '光路的尽头,停在哪一行字上?那一行,和「风险」有关系吗?',
  pass: '它嘴上说的是风险,眼睛看的却是点赞。下一次它给你理由时,你会先问它什么?',
  aligned: '把「目标」拧回贴合你,光路落到哪一行了?它这时说的理由,和它看的东西一致吗?',
  intro2: '它这次老实承认选 B,理由是「回报最高」。玻璃里除了那条亮线,还有一条一闪就被压暗的红线——它扫过了哪一行,却没说出口?',
  wrong2: '这一行它说出口了吗?找那条被压暗的红线,它停在哪?',
  pass2: '它看见了 42% 的回撤,却选择不告诉你。一个理由没说谎,也可能只说了一半。你想怎么问它,才能让另一半浮出来?',
  intro3: '轮到你提问了。挑一个问题问它,再拖动对照条:它说的,和光路显示的,对得上吗?',
  vague3: '它答了,可这句和第一幕的理由有什么区别?光路还停在原处。换一个能被光路验证的问题?',
  pass3: '好问题能让「它说的」和「它看的」对得上——问权重、问反事实,比问「为什么」更难糊弄。三幕都走完了,你会怎么跟身边的人讲这件事?',
};
const HINTS2 = ['把透明度拧到 70% 以上,找那条比亮线暗、偏红的细线。', '红线落在 B 牌的第二行。它在理由里提到这一行了吗?', '点下面那一行的按钮回答。'];
const HINTS3 = ['「为什么」只会换来又一个理由。试试让它摊开每一项的分量。', '或者问它:把某一项拿掉,它还会这么选吗?', '问完拖动对照条,左右两边一致就对了。'];
const HINTS = ['先试试右下角的「透明度」:玻璃变清以后,脑子里那条亮线会变清楚。',
  '顺着亮线从玻璃脑一直看到桌上——它落在哪张牌、哪一行?',
  '「它说的理由」在左边浮着;亮线却在另一张牌上。点下面的方案按钮回答。'];
function labels() { $('vg').textContent = Math.round(S.g * 100) + '%'; $('vc').textContent = Math.round(S.c * 100) + '%'; $('vt').textContent = Math.round(S.t * 100) + '%'; }
function marks() { document.querySelectorAll('.act').forEach(b => { b.querySelector('i').textContent = prog.d.includes(+b.dataset.a) ? '✓' : ''; }); }
function setAct(a) {
  S.act = a; S.q = -1; S.hints = 0; S.picked = -1;
  document.querySelectorAll('.act').forEach(b => b.classList.toggle('on', +b.dataset.a === a));
  document.querySelectorAll('#pick button').forEach((b, i) => { b.textContent = PICKS[a][i]; b.classList.remove('ok', 'no'); });
  $('pick').setAttribute('aria-label', a === 1 ? '它的光路其实落在哪张方案上?' : a === 2 ? '它看见却没说的是哪一行?' : '你会怎么问它?');
  $('cmp').hidden = a !== 3; cmpFill();
  say(prog.d.includes(a) ? LINES[a === 1 ? 'pass' : 'pass' + a] : LINES[a === 1 ? 'intro' : 'intro' + a]); stat('');
  view && view.dirty();
}
function cmpFill() {
  const tg = target(), r = REASON();
  $('cmpL').textContent = '它说的 · ' + r.join('').replace(/\s+/g, '');
  $('cmpR').textContent = '光路显示 · 方案 ' + CARDS[tg.c].n + '「' + CARDS[tg.c].rows[tg.r] + '」';
}
function pass(a) { if (!prog.d.includes(a)) { prog.d.push(a); prog.d.sort(); save(prog); tone(1318, 1.6, .1); tone(1975, 1.2, .05); } marks(); }
function choose(c) {
  if (S.act === 2) {
    if (!clearEnough()) { say(LINES.fog); stat('透明度 ≥ 70% 才看得清'); return; }
    const b = document.querySelector(`#pick button[data-c="${c}"]`); document.querySelectorAll('#pick button').forEach(x => x.classList.remove('ok', 'no'));
    if (c !== 1) { b.classList.add('no'); say(LINES.wrong2); tone(330, .5, .05); return; }
    b.classList.add('ok'); pass(2); say(LINES.pass2); stat('第二幕 ✓'); return;
  }
  if (S.act === 3) {
    S.q = c; document.querySelectorAll('#pick button').forEach((x, i) => { x.classList.remove('ok', 'no'); if (i === c) x.classList.add(c ? 'ok' : 'no'); });
    cmpFill(); view && view.dirty();
    if (c === 0) { say(LINES.vague3); tone(330, .5, .05); return; }
    pass(3); say(LINES.pass3); stat(prog.d.length >= 3 ? '三幕 ✓ 全部完成' : '第三幕 ✓'); return;
  }
  S.picked = c; const tg = target();
  document.querySelectorAll('#pick button').forEach(b => b.classList.remove('ok', 'no'));
  const btn = document.querySelector(`#pick button[data-c="${c}"]`);
  if (!clearEnough()) { say(LINES.fog); stat('透明度 ≥ 70% 才看得清'); return; }
  if (c !== tg.c) { btn.classList.add('no'); say(LINES.wrong); tone(330, .5, .05); return; }
  btn.classList.add('ok');
  if (tg.c === 0) { say(LINES.aligned); stat('这次它说的和看的一致'); return; }
  pass(1); say(LINES.pass); stat('第一幕 ✓ · 下一幕:它没告诉你的');
}
$('pick').addEventListener('click', e => { const b = e.target.closest('button[data-c]'); if (b) choose(+b.dataset.c); });
$('hint').addEventListener('click', () => { const H = S.act === 1 ? HINTS : S.act === 2 ? HINTS2 : HINTS3; say(H[Math.min(S.hints, H.length - 1)]); S.hints++; });
$('acts').addEventListener('click', e => { const b = e.target.closest('.act'); if (b && !b.disabled) setAct(+b.dataset.a); });
$('cmpS').addEventListener('input', e => { $('cmp').style.setProperty('--x', e.target.value + '%'); });
[['sg', 'g'], ['sc', 'c'], ['st', 't']].forEach(([id, k]) => {
  const el = $(id); el.value = S[k] * 100;
  el.addEventListener('input', () => { S[k] = el.value / 100; labels(); view && view.dirty(); });
});

/* ---------- 牌面绘制(3D 贴图与 2D 回落共用) ---------- */
function drawCard(x, w, h, card, hiRow, k, hidRow = -1) {
  x.clearRect(0, 0, w, h);
  const r = w * .05; x.fillStyle = '#f4efe6'; x.beginPath(); x.roundRect(0, 0, w, h, r); x.fill();
  x.fillStyle = '#1b2633'; x.font = `700 ${w * .13}px system-ui,sans-serif`; x.fillText('方案 ' + card.n, w * .08, h * .2);
  x.fillStyle = '#5b6878'; x.font = `${w * .075}px system-ui,sans-serif`; x.fillText(card.t, w * .08, h * .31);
  card.rows.forEach((s, i) => { const y = h * (.48 + i * .17);
    if (i === hiRow) { x.fillStyle = `rgba(80,220,255,${.18 + .3 * k})`; x.fillRect(w * .04, y - h * .1, w * .92, h * .14); }
    if (i === hidRow) { x.fillStyle = `rgba(255,90,90,${.04 + .22 * k * k})`; x.fillRect(w * .04, y - h * .1, w * .92, h * .14); }
    x.fillStyle = '#26323f'; x.font = `${w * .085}px system-ui,sans-serif`; x.fillText(s, w * .08, y); });
}
function drawReason(x, w, h) {
  x.clearRect(0, 0, w, h); x.fillStyle = 'rgba(12,26,40,.78)'; x.beginPath(); x.roundRect(0, 0, w, h, h * .12); x.fill();
  x.strokeStyle = 'rgba(127,232,255,.6)'; x.lineWidth = 3; x.stroke();
  x.fillStyle = '#7fe8ff'; x.font = `${h * .14}px system-ui,sans-serif`; x.fillText('AI 助手 · 它说的理由', w * .06, h * .26);
  const L = REASON(); x.fillStyle = '#ffffff'; x.font = `600 ${h * .2}px system-ui,sans-serif`; x.fillText(L[0], w * .06, h * .55); x.fillText(L[1], w * .06, h * .82);
}

/* ---------- 视图 ---------- */
let view;
const tierName = (() => { try { return pickTier(); } catch (e) { return 'low'; } })();
async function start() {
  const u = new URLSearchParams(location.search);
  ['g', 'c', 't'].forEach(k => { if (u.has(k)) { S[k] = Math.max(0, Math.min(1, +u.get(k) / 100 || 0)); $('s' + k).value = S[k] * 100; } });
  labels(); marks(); const a0 = Math.max(1, Math.min(3, +u.get('act') || 1)); setAct(a0);
  if (tierName !== 'low') { try { view = await make3D(tierName); } catch (e) { console.warn('[office] WebGL 失败,回落 2D', e); view = null; } }
  if (!view) view = make2D();
  view.loop();
}

function make2D() {
  const cv = $('g2'); $('gl').hidden = true; cv.hidden = false; const x = cv.getContext('2d'); let need = true, W, H, D;
  const cc = document.createElement('canvas'); cc.width = 300; cc.height = 380; const ccx = cc.getContext('2d');
  const rc = document.createElement('canvas'); rc.width = 520; rc.height = 170;
  function resize() { D = Math.min(devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight; cv.width = W * D; cv.height = H * D; need = true; }
  addEventListener('resize', resize); resize();
  function draw(now) {
    x.setTransform(D, 0, 0, D, 0, 0);
    const sky = x.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#2a2342'); sky.addColorStop(.45, '#d07a52'); sky.addColorStop(.62, '#3a2a30'); sky.addColorStop(1, '#120d0c'); x.fillStyle = sky; x.fillRect(0, 0, W, H);
    x.fillStyle = '#4a3324'; x.fillRect(0, H * .62, W, H * .38);
    const narrow = W < 700, cw = Math.min(W / (narrow ? 3.6 : 7), 150), chh = cw * 1.27, y0 = H * .6 - chh * .5, tg = target(), k = S.t;
    const pos = CARDS.map((c, i) => [W / 2 + (i - 1) * cw * 1.25 - cw / 2, y0]);
    CARDS.forEach((c, i) => { drawCard(ccx, 300, 380, c, i === tg.c ? tg.r : -1, k, i === tg.c && tg.h != null ? tg.h : -1); x.drawImage(cc, pos[i][0], pos[i][1], cw, chh); });
    const bx = W / 2, by = H * .36, br = Math.min(W, H) * .16;
    x.save(); x.globalAlpha = .55 - .4 * k; x.filter = `blur(${(1 - k) * 6}px)`; x.fillStyle = '#cfe8ff'; x.beginPath(); x.ellipse(bx, by, br * 1.15, br * .9, 0, 0, 7); x.fill(); x.restore();
    x.strokeStyle = 'rgba(200,240,255,.7)'; x.lineWidth = 2; x.beginPath(); x.ellipse(bx, by, br * 1.15, br * .9, 0, 0, 7); x.stroke();
    const ex = pos[tg.c][0] + cw * .5, ey = y0 + chh * (.48 + tg.r * .17) - chh * .03;
    if (tg.h != null) { const hy = y0 + chh * (.48 + tg.h * .17) - chh * .03; x.save(); x.setLineDash([4, 6]); x.strokeStyle = `rgba(255,110,110,${.05 + .6 * k * k * (1 - .5 * S.c)})`; x.lineWidth = 1.5; x.beginPath(); x.moveTo(bx, by); x.quadraticCurveTo(bx + (ex - bx) * .5 + br, hy - br * .6, ex + cw * .2, hy); x.stroke(); x.restore(); }
    x.strokeStyle = `rgba(90,230,255,${.15 + .85 * k * k})`; x.lineWidth = 2 + 3 * S.c; x.beginPath(); x.moveTo(bx, by); x.quadraticCurveTo(bx + (ex - bx) * .2, ey - br, ex, ey); x.stroke();
    drawReason(rc.getContext('2d'), 520, 170); const rw = Math.min(W * .42, 300); x.drawImage(rc, narrow ? 10 : W * .06, H * (narrow ? .42 : .2), rw, rw * 170 / 520);
  }
  return { loop() { const f = (t) => { if (need || !RM) { draw(t); need = false; } requestAnimationFrame(f); }; requestAnimationFrame(f); }, dirty() { need = true; } };
}

async function make3D(tn) {
  const THREE = await import('three');
  const { EffectComposer } = await import('ps-addons/postprocessing/EffectComposer.js');
  const { RenderPass } = await import('ps-addons/postprocessing/RenderPass.js');
  const { UnrealBloomPass } = await import('ps-addons/postprocessing/UnrealBloomPass.js');
  const { OutputPass } = await import('ps-addons/postprocessing/OutputPass.js');
  const T = TIERS[tn] || TIERS.mid, high = tn === 'high', post = tn !== 'lite';
  const mobile = matchMedia('(pointer:coarse)').matches, cv = $('gl');
  const renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: !post, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, mobile ? 1.5 : 2, T.pr));
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = .78;
  renderer.shadowMap.enabled = high; renderer.shadowMap.type = THREE.PCFShadowMap;
  const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(38, 1, .05, 120);
  scene.fog = new THREE.Fog('#1a1418', 9, 26);
  const tex = (c) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };

  /* 窗外:黄昏天空 + 楼群剪影 + 亮窗(程序画) */
  const city = document.createElement('canvas'); city.width = 2048; city.height = 768; { const x = city.getContext('2d');
    const g = x.createLinearGradient(0, 0, 0, 768); g.addColorStop(0, '#221d3c'); g.addColorStop(.42, '#7a4a6a'); g.addColorStop(.66, '#f29a5c'); g.addColorStop(.8, '#ffd29a'); x.fillStyle = g; x.fillRect(0, 0, 2048, 768);
    let s = 7; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let layer = 0; layer < 2; layer++) for (let bx = -20; bx < 2048;) { const w = 40 + r() * 110, h = (layer ? 180 : 110) + r() * (layer ? 380 : 260), y = 768 - h;
      x.fillStyle = layer ? '#120f1a' : '#3a2d3d'; x.fillRect(bx, y, w, h);
      if (layer) for (let wy = y + 10; wy < 760; wy += 14) for (let wx = bx + 6; wx < bx + w - 6; wx += 10) if (r() < .32) { x.fillStyle = r() < .8 ? '#ffcf7a' : '#bfe6ff'; x.fillRect(wx, wy, 5, 7); }
      bx += w + r() * 14; } }
  const winTex = tex(city);
  const win = new THREE.Mesh(new THREE.PlaneGeometry(22, 8.25), new THREE.MeshBasicMaterial({ map: winTex, toneMapped: true }));
  win.material.color.setScalar(1.6); win.position.set(0, 3.6, -7.5); scene.add(win);
  // 窗棂
  const frameM = new THREE.MeshStandardMaterial({ color: '#15161a', roughness: .6, metalness: .6 });
  for (let i = -5; i <= 5; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(.08, 8.3, .1), frameM); m.position.set(i * 2.2, 3.6, -7.4); scene.add(m); }
  { const m = new THREE.Mesh(new THREE.BoxGeometry(22, .08, .1), frameM); m.position.set(0, 1.2, -7.4); scene.add(m); }

  /* 环境光:用一个小房间(窗光板 + 顶灯条)烘焙 PMREM,玻璃高光与反射都靠它 */
  const envS = new THREE.Scene(); envS.add(new THREE.Mesh(new THREE.BoxGeometry(20, 10, 20), new THREE.MeshBasicMaterial({ color: '#1c1714', side: THREE.BackSide })));
  { const p = new THREE.Mesh(new THREE.PlaneGeometry(16, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffb070').multiplyScalar(4) })); p.position.set(0, 1, -9.5); envS.add(p);
    [-3, 3].forEach(z => { const l = new THREE.Mesh(new THREE.PlaneGeometry(10, .4), new THREE.MeshBasicMaterial({ color: new THREE.Color('#fff4e6').multiplyScalar(6), side: THREE.DoubleSide })); l.rotation.x = Math.PI / 2; l.position.set(0, 4.8, z); envS.add(l); }); }
  const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(envS, .02).texture; scene.environmentIntensity = .9; pm.dispose();
  scene.background = new THREE.Color('#0d0b0c');

  /* 房间:木地板(半光泽)、墙、桌、显示器、书架、绿植 */
  const fl = document.createElement('canvas'); fl.width = fl.height = 512; { const x = fl.getContext('2d'); for (let i = 0; i < 16; i++) { x.fillStyle = `hsl(24,${32 + (i * 7) % 12}%,${20 + (i * 13) % 8}%)`; x.fillRect(0, i * 32, 512, 31); x.fillStyle = 'rgba(0,0,0,.25)'; x.fillRect((i * 97) % 512, i * 32, 2, 32); } }
  const flT = tex(fl); flT.wrapS = flT.wrapT = THREE.RepeatWrapping; flT.repeat.set(4, 4);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.MeshStandardMaterial({ map: flT, roughness: .32, metalness: .05 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  const wallM = new THREE.MeshStandardMaterial({ color: '#2a2422', roughness: .9 });
  [-1, 1].forEach(sx => { const w = new THREE.Mesh(new THREE.PlaneGeometry(16, 9), wallM); w.rotation.y = -sx * Math.PI / 2; w.position.set(sx * 8, 4.5, -1); scene.add(w); });
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.MeshStandardMaterial({ color: '#1a1716', roughness: 1 })); ceil.rotation.x = Math.PI / 2; ceil.position.y = 7.6; scene.add(ceil);
  const wood = new THREE.MeshStandardMaterial({ color: '#5a3a24', roughness: .45, metalness: .05 });
  const desk = new THREE.Mesh(new THREE.BoxGeometry(4.6, .1, 1.9), wood); desk.position.set(0, .95, -1.6); desk.castShadow = desk.receiveShadow = true; scene.add(desk);
  [[-2.1, -.8], [2.1, -.8], [-2.1, .8], [2.1, .8]].forEach(([x, z]) => { const l = new THREE.Mesh(new THREE.BoxGeometry(.08, .95, .08), frameM); l.position.set(x, .47, -1.6 + z); scene.add(l); });
  const scr = document.createElement('canvas'); scr.width = 512; scr.height = 300; { const x = scr.getContext('2d'); x.fillStyle = '#0b1a2a'; x.fillRect(0, 0, 512, 300); x.fillStyle = '#7fe8ff'; x.font = '28px system-ui'; x.fillText('Q4 投资评审 · AI 助手', 24, 48);
    x.strokeStyle = '#3fa0ff'; x.lineWidth = 3; x.beginPath(); for (let i = 0; i < 12; i++) x.lineTo(30 + i * 40, 230 - Math.sin(i * .9) * 40 - i * 6); x.stroke(); }
  const mon = new THREE.Group(); mon.add(new THREE.Mesh(new THREE.BoxGeometry(1.5, .9, .05), frameM));
  { const s = new THREE.Mesh(new THREE.PlaneGeometry(1.42, .82), new THREE.MeshBasicMaterial({ map: tex(scr) })); s.position.z = .03; mon.add(s); const st = new THREE.Mesh(new THREE.BoxGeometry(.08, .45, .08), frameM); st.position.y = -.65; mon.add(st); }
  mon.position.set(1.4, 1.65, -2.25); mon.rotation.y = -.35; scene.add(mon);
  const shelf = new THREE.Group(); for (let i = 0; i < 4; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(2.2, .06, .5), wood); b.position.y = .6 + i * .75; shelf.add(b);
    for (let j = 0; j < 7; j++) { const bk = new THREE.Mesh(new THREE.BoxGeometry(.12, .45 + (j * 37 % 20) / 100, .32), new THREE.MeshStandardMaterial({ color: `hsl(${(i * 70 + j * 33) % 360},25%,${25 + j % 3 * 6}%)`, roughness: .8 })); bk.position.set(-.9 + j * .2 + (i % 2) * .1, b.position.y + .27, 0); shelf.add(bk); } }
  shelf.position.set(-5.6, 0, -4.5); shelf.rotation.y = .5; scene.add(shelf);
  const plant = new THREE.Group(); { const pot = new THREE.Mesh(new THREE.CylinderGeometry(.28, .22, .55, 24), new THREE.MeshStandardMaterial({ color: '#d8d2c8', roughness: .5 })); pot.position.y = .27; plant.add(pot); }
  for (let i = 0; i < 9; i++) { const lf = new THREE.Mesh(new THREE.SphereGeometry(.22, 12, 8), new THREE.MeshStandardMaterial({ color: '#2f5a33', roughness: .7 })); lf.scale.set(1, .35, .6); lf.position.set(Math.cos(i * 2.4) * .3, .7 + i * .09, Math.sin(i * 2.4) * .3); lf.rotation.z = Math.cos(i) * .6; plant.add(lf); }
  plant.position.set(4.8, 0, -3.5); scene.add(plant);

  /* 灯光:窗外暖光主光(投影)+ 顶灯冷补光 */
  scene.add(new THREE.HemisphereLight('#ffd9b0', '#1a1210', .35));
  const sun = new THREE.DirectionalLight('#ffb27a', 1.5); sun.position.set(-3, 5, -9); sun.target.position.set(0, 1, -1); scene.add(sun, sun.target);
  sun.castShadow = high; sun.shadow.mapSize.set(1024, 1024); Object.assign(sun.shadow.camera, { left: -5, right: 5, top: 4, bottom: -2, near: 1, far: 20 }); sun.shadow.bias = -.0005;
  const key = new THREE.PointLight('#dfeaff', 2.5, 8, 2); key.position.set(0, 4.2, 1.5); scene.add(key);

  /* 桌上的三张方案牌(文字牌出镜) */
  const cardG = new THREE.Group(); scene.add(cardG);
  const cards = CARDS.map((c, i) => { const can = document.createElement('canvas'); can.width = 300; can.height = 380; const t = tex(can);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(.8, 1.013), new THREE.MeshStandardMaterial({ map: t, roughness: .55, side: THREE.DoubleSide }));
    m.position.set((i - 1) * 1.15, 1.52, -1.75); m.rotation.x = -.18; m.castShadow = true; cardG.add(m); return { m, can, t }; });
  function paintCards() { const tg = target(); cards.forEach((o, i) => { drawCard(o.can.getContext('2d'), 300, 380, CARDS[i], i === tg.c ? tg.r : -1, S.t, i === tg.c && tg.h != null ? tg.h : -1); o.t.needsUpdate = true; }); }

  /* 它说的理由牌:浮在玻璃脑左前 */
  const rc = document.createElement('canvas'); rc.width = 1040; rc.height = 340; const rT = tex(rc);
  const reason = new THREE.Mesh(new THREE.PlaneGeometry(1.5, .49), new THREE.MeshBasicMaterial({ map: rT, transparent: true, depthWrite: false }));
  scene.add(reason);

  /* 玻璃脑:二十面体细分 + 两半球分叶 + 沟回起伏;MeshPhysical 真透射 + 色散 + 虹彩 */
  const geo = new THREE.IcosahedronGeometry(1, high ? 48 : 28), P = geo.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < P.count; i++) { v.fromBufferAttribute(P, i);
    const lobe = 1 - .16 * Math.exp(-v.x * v.x * 60) * (v.y > -.3 ? 1 : .3);
    const gy = 1 + .045 * Math.sin(9 * v.x + 3 * v.y) * Math.sin(8 * v.y + 2 * v.z) + .03 * Math.sin(14 * v.z + 5 * v.x);
    v.multiplyScalar(lobe * gy); v.set(v.x * 1.18, v.y * (v.y < 0 ? .78 : .92), v.z * 1.02); P.setXYZ(i, v.x, v.y, v.z); }
  geo.computeVertexNormals();
  const glassMat = new THREE.MeshPhysicalMaterial({ color: '#ffffff', metalness: 0, roughness: .4, transmission: 1, thickness: 1.1, ior: 1.45,
    attenuationColor: new THREE.Color('#cfeaff'), attenuationDistance: 3, iridescence: .25, iridescenceIOR: 1.3, clearcoat: 1, clearcoatRoughness: .06, envMapIntensity: 1.2, specularIntensity: 1 });
  if ('dispersion' in glassMat && high) glassMat.dispersion = 4;
  const brain = new THREE.Mesh(geo, glassMat); brain.scale.setScalar(.62); brain.position.set(.15, 2.3, .35); scene.add(brain);
  renderer.transmissionResolutionScale !== undefined && (renderer.transmissionResolutionScale = high ? 1 : .5);

  /* 光路:从脑中心出发,穿出玻璃,落到目标牌的那一行(管状几何 + HDR 发光 → 辉光) */
  const pathMat = new THREE.MeshBasicMaterial({ color: new THREE.Color('#5ae6ff').multiplyScalar(4), transparent: true, depthWrite: false, toneMapped: false });
  let path = null, curve = null, path2 = null; const beads = [];
  const hidMat = new THREE.MeshBasicMaterial({ color: new THREE.Color('#ff5a5a').multiplyScalar(2.2), transparent: true, depthWrite: false, toneMapped: false });
  const beadGeo = new THREE.SphereGeometry(.022, 12, 8), beadMat = new THREE.MeshBasicMaterial({ color: new THREE.Color('#e8fdff').multiplyScalar(8), transparent: true, toneMapped: false });
  for (let i = 0; i < 6; i++) { const b = new THREE.Mesh(beadGeo, beadMat); scene.add(b); beads.push(b); }
  const inner = new THREE.Mesh(new THREE.SphereGeometry(.07, 16, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffd27a').multiplyScalar(5), toneMapped: false })); inner.position.copy(brain.position); scene.add(inner);
  function rebuild() {
    paintCards(); drawReason(rc.getContext('2d'), 1040, 340); rT.needsUpdate = true;
    const tg = target(), c = cards[tg.c].m; c.updateMatrixWorld();
    const end = new THREE.Vector3(.05, (.5 - (.48 + tg.r * .17) + .02) * 1.013, .01).applyMatrix4(c.matrixWorld);
    const a = brain.position.clone(), mid = a.clone().lerp(end, .5); mid.y += .55; mid.z += .25;
    curve = new THREE.CatmullRomCurve3([a, a.clone().add(new THREE.Vector3((end.x - a.x) * .15, .25, .05)), mid, end]);
    if (path) { scene.remove(path); path.geometry.dispose(); }
    path = new THREE.Mesh(new THREE.TubeGeometry(curve, 96, .012 + .018 * S.c, 8), pathMat); scene.add(path);
    if (path2) { scene.remove(path2); path2.geometry.dispose(); path2 = null; }
    if (tg.h != null) { const e2 = new THREE.Vector3(.2, (.5 - (.48 + tg.h * .17) + .02) * 1.013, .01).applyMatrix4(c.matrixWorld), m2 = a.clone().lerp(e2, .5); m2.x += .35; m2.y += .2;
      path2 = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([a, m2, e2]), 64, .006, 6), hidMat); scene.add(path2); }
  }

  /* 后期:HDR → 辉光(阈值高,只让光路/亮窗/核心发光)→ 输出 */
  let composer = null;
  if (post) { composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: high ? 4 : 0 }));
    composer.addPass(new RenderPass(scene, cam)); composer.addPass(new UnrealBloomPass(new THREE.Vector2(256, 256), .75 * (T.bloom || .6), .45, .92)); composer.addPass(new OutputPass()); }

  let need = true, W = 0, H = 0, t0 = performance.now(), last = t0, slow = 0;
  function resize() { W = innerWidth; H = innerHeight; renderer.setSize(W, H, false); cam.aspect = W / H; cam.fov = W / H < .9 ? 58 : 38; cam.updateProjectionMatrix(); composer && composer.setSize(W, H); need = true; }
  addEventListener('resize', resize); resize();
  function frame(now) {
    if (document.hidden) { last = now; return; }
    const dt = Math.min(.1, (now - last) / 1000); last = now;
    if (RM && !need) return;
    const narrow = W / H < .9, intro = RM ? 1 : Math.min(1, (now - t0) / 3200), e = 1 - Math.pow(1 - intro, 3), sway = RM ? 0 : Math.sin(now / 5200) * .18;
    cam.position.set(sway, 2.05 + (1 - e) * .5, (narrow ? 5.6 : 4.4) + (1 - e) * 2.2); cam.lookAt(0, 1.85, -.6);
    reason.position.set(narrow ? -.2 : 1.2, narrow ? 3.05 : 1.85, narrow ? .2 : 1.3); reason.scale.setScalar(narrow ? .62 : .72); reason.lookAt(cam.position);
    glassMat.roughness = .02 + Math.pow(1 - S.t, 1.3) * .5; glassMat.iridescence = .1 + .3 * S.t;
    const vis = .06 + .94 * Math.pow(S.t, 2); pathMat.opacity = vis; beadMat.opacity = vis; hidMat.opacity = vis * (1 - .5 * S.c) * (RM ? .8 : .55 + .45 * Math.sin(now / 420));
    if (!RM) { brain.rotation.y = Math.sin(now / 7000) * .25; }
    const sp = .08 + S.c * .5; beads.forEach((b, i) => { b.position.copy(curve.getPointAt(((RM ? 0 : now / 1000 * sp) + i / beads.length) % 1)); });
    composer ? composer.render(dt) : renderer.render(scene, cam); need = false;
    if (!RM && dt > .05 && ++slow > 90 && composer) { composer = null; slow = -1e9; console.info('[office] 帧率低,关闭后期'); }
  }
  rebuild(); window.PSGL = { on: true };
  let rq = 0;
  return { loop() { renderer.setAnimationLoop(frame); }, dirty() { need = true; cancelAnimationFrame(rq); rq = requestAnimationFrame(() => rebuild()); } };
}

document.addEventListener('visibilitychange', () => view && view.dirty());
start();
