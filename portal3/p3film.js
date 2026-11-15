/* 创世计划 门户 3.0 · 首页第一章「七道光桥，汇向一颗新的星」（11-15 晚，替换 p3hero.js 程序晶柱）
 * 底片：宣传片 34.6–39.7s 去字幕循环（portal3/ch1-1600.mp4 / ch1-960.mp4），<video> 在页面里播放；
 * 本模块在其上叠一层 WebGL2（无 Three.js）：视频纹理 + 推镜入场 + 鼠标视差 + 亮部辉光 + 横向光斑 + 色散 + 暗角 + 颗粒，
 * 以及鼠标/手指拖出的七色光管拖尾（Active Theory 式）和景深光点粒子。
 * 画质：high 全开（DPR≤1.5）；medium 去色散与横向光斑、粒子减半（DPR 1）；low 不启动（只播 <video>）。
 * 尊重减少动态（由页面内联脚本拦截，不调用本模块）、页面隐藏暂停、卡顿自动降档。零外部请求。 */
import { pickTier, lower, SLOW } from './p3tier.js';

let S = null;
const NOFPS = /[?&]p3nofps=1\b/.test(location.search);   // 调试：关闭卡顿自动降档（软件渲染截图用）

const VS_Q = `#version 300 es
in vec2 p; out vec2 vU; void main(){ vU=p*.5+.5; gl_Position=vec4(p,0.,1.); }`;

const FS_FILM = `#version 300 es
precision highp float;
in vec2 vU; out vec4 o;
uniform sampler2D uV; uniform vec2 uRes, uVid, uM; uniform float uT, uIn, uCA, uStreak, uOk;
vec3 tap(vec2 uv){ return texture(uV, clamp(uv, vec2(.001), vec2(.999))).rgb; }
float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)))*43758.5453); }
void main(){
  // cover 适配：保持晶柱在画面中线（视频水平居中，竖直略偏上）
  float ra = uRes.x/uRes.y, va = uVid.x/uVid.y;
  vec2 s = ra > va ? vec2(1., va/ra) : vec2(ra/va, 1.);
  float zin = mix(1.18, 1., uIn);                                  // 入场推镜
  float br = 1. + .012*sin(uT*.21);                               // 呼吸
  vec2 c = vec2(.5, ra > va ? .5 : .56);
  vec2 uv = (vU - .5) * s / (1.06*zin*br) + c + uM*vec2(-.018, .012);
  vec2 d = uv - c; float r = length(d);
  vec3 col;
  if (uCA > 0.) { vec2 k = d*uCA*(1.+1.5*(1.-uIn)); col = vec3(tap(uv+k).r, tap(uv).g, tap(uv-k).b); }
  else col = tap(uv);
  // 入场径向模糊
  if (uIn < 1.) { vec3 a = col; for (int i=1;i<8;i++){ a += tap(c + d*(1. - float(i)*.018*(1.-uIn))); } col = mix(a/8., col, uIn*uIn); }
  // 亮部辉光（12 点环形取样，只取高光）
  vec3 g = vec3(0.); float px = 1./uRes.y;
  for (int i=0;i<12;i++){ float a = float(i)*.5236; vec2 o2 = vec2(cos(a), sin(a))*px*(i<6?9.:22.)/s; vec3 t = tap(uv+o2); g += max(t - .62, 0.); }
  col += g*.1;
  // 横向光斑（高档）：对高光沿 x 方向拉长
  if (uStreak > 0.) { vec3 st = vec3(0.); for (int i=-6;i<=6;i++){ vec3 t = tap(uv + vec2(float(i)*px*16./s.x, 0.)); st += max(t-.78,0.)*(1.-abs(float(i))/7.); } col += st*vec3(.55,.7,1.)*uStreak*.09; }
  // 调色：提一点对比与饱和，入场时从亮白闪入
  col = mix(vec3(dot(col, vec3(.299,.587,.114))), col, 1.08);
  col = pow(col, vec3(1.04));
  col += vec3(.75,.8,1.)*pow(1.-uIn, 3.)*.55;
  float vg = smoothstep(1.05, .32, length((vU-.5)*vec2(ra,1.)/max(ra,1.)*1.6));
  col *= mix(.5, 1., vg);
  col += (h(vU*uRes + fract(uT)*91.) - .5)*.035;
  o = vec4(col*uOk, 1.);
}`;

const VS_RIB = `#version 300 es
in vec3 a; in vec4 b; out vec4 vC; out float vE;
uniform vec2 uRes;
void main(){ vC=b; vE=a.z; vec2 q=a.xy/uRes*2.-1.; gl_Position=vec4(q.x,-q.y,0.,1.); }`;
const FS_RIB = `#version 300 es
precision mediump float; in vec4 vC; in float vE; out vec4 o;
void main(){ float e = 1.-abs(vE); float core = pow(e, 6.); float glow = pow(e, 1.6); o = vec4(vC.rgb*(glow*.55+core*1.4)+core*.35, 1.)*vC.a; }`;

const VS_PT = `#version 300 es
in vec4 a; out vec3 vC; out float vA;
uniform vec2 uRes, uM; uniform float uT, uPx;
vec3 pal(float k){ return .55+.45*cos(6.2831*(k+vec3(0.,.33,.67))); }
void main(){
  float id = a.w; float sp = .015 + a.z*.03;
  vec3 p = vec3(a.x, fract(a.y + uT*sp), a.z);
  p.x += sin(uT*.3 + id*7.)*.02 + uM.x*(.02 + a.z*.05);
  p.y += uM.y*(.015 + a.z*.04);
  vec2 q = vec2(p.x*2.-1., p.y*2.-1.);
  gl_Position = vec4(q, 0., 1.);
  float fade = smoothstep(0., .15, p.y)*smoothstep(1., .8, p.y);
  float tw = .6 + .4*sin(uT*(1.5+a.z*3.) + id*13.);
  gl_PointSize = uPx*(1.5 + pow(a.z, 3.)*16.);
  vC = mix(vec3(.85,.85,1.), pal(fract(id*.137)), .65);
  vA = fade*tw*mix(.9, .22, a.z);
}`;
const FS_PT = `#version 300 es
precision mediump float; in vec3 vC; in float vA; out vec4 o;
void main(){ float d = length(gl_PointCoord-.5)*2.; float a = smoothstep(1., .2, d)*vA; o = vec4(vC*a, a); }`;

const RAIN = [[1, .2, .25], [1, .55, .15], [1, .88, .25], [.25, 1, .45], [.2, .75, 1], [.3, .4, 1], [.72, .35, 1]];

function prog(gl, vs, fs) {
  const p = gl.createProgram();
  for (const [t, s] of [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]]) {
    const sh = gl.createShader(t); gl.shaderSource(sh, s); gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh));
    gl.attachShader(p, sh);
  }
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
  const u = {}; const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < n; i++) { const nm = gl.getActiveUniform(p, i).name; u[nm] = gl.getUniformLocation(p, nm); }
  return { p, u };
}

function Film(host, tier0) {
  const vid = host.querySelector('video.p3vid');
  const cv = host.querySelector('#p3cv');
  if (!vid || !cv) return null;
  const gl = cv.getContext('webgl2', { alpha: false, antialias: false, premultipliedAlpha: false, powerPreference: 'high-performance' });
  if (!gl) return null;
  let tier = tier0, raf = 0, paused = false, dead = false, t0 = performance.now(), tPrev = t0, inT = 0, ok = 0;
  let W = 1, H = 1, dpr = 1;
  const film = prog(gl, VS_Q, FS_FILM), rib = prog(gl, VS_RIB, FS_RIB), pts = prog(gl, VS_PT, FS_PT);
  const quad = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, quad); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const vaoQ = gl.createVertexArray(); gl.bindVertexArray(vaoQ); gl.enableVertexAttribArray(0); gl.bindAttribLocation(film.p, 0, 'p'); gl.vertexAttribPointer(gl.getAttribLocation(film.p, 'p'), 2, gl.FLOAT, false, 0, 0);
  const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([6, 4, 16, 255]));
  // 静帧兜底：视频首帧未到时先用海报
  const poster = new Image(); let hasFrame = false, vw = 1600, vh = 716;
  poster.onload = () => { if (!hasFrame && !dead) { gl.bindTexture(gl.TEXTURE_2D, tex); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, poster); vw = poster.naturalWidth; vh = poster.naturalHeight; ok = 1; } };
  poster.src = 'portal3/ch1.webp';

  // 粒子
  let NP = 0; const vaoP = gl.createVertexArray(), bufP = gl.createBuffer();
  function buildPts() {
    NP = tier === 'high' ? 700 : 320;
    const a = new Float32Array(NP * 4);
    for (let i = 0; i < NP; i++) { a[i * 4] = Math.random(); a[i * 4 + 1] = Math.random(); a[i * 4 + 2] = Math.random(); a[i * 4 + 3] = i; }
    gl.bindVertexArray(vaoP); gl.bindBuffer(gl.ARRAY_BUFFER, bufP); gl.bufferData(gl.ARRAY_BUFFER, a, gl.STATIC_DRAW);
    const l = gl.getAttribLocation(pts.p, 'a'); gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, 4, gl.FLOAT, false, 0, 0);
  }
  buildPts();

  // 七色光管拖尾：指针轨迹（CSS 像素），每条带按法线偏移
  const TRAIL = 40, trail = []; let lastMove = 0;
  const vaoR = gl.createVertexArray(), bufR = gl.createBuffer();
  const RV = new Float32Array(RAIN.length * TRAIL * 2 * 7);
  gl.bindVertexArray(vaoR); gl.bindBuffer(gl.ARRAY_BUFFER, bufR); gl.bufferData(gl.ARRAY_BUFFER, RV.byteLength, gl.DYNAMIC_DRAW);
  { const la = gl.getAttribLocation(rib.p, 'a'), lb = gl.getAttribLocation(rib.p, 'b');
    gl.enableVertexAttribArray(la); gl.vertexAttribPointer(la, 3, gl.FLOAT, false, 28, 0);
    gl.enableVertexAttribArray(lb); gl.vertexAttribPointer(lb, 4, gl.FLOAT, false, 28, 12); }

  const M = { x: 0, y: 0, tx: 0, ty: 0 };
  function onMove(e) {
    const r = cv.getBoundingClientRect(); const x = e.clientX - r.left, y = e.clientY - r.top;
    M.tx = (x / r.width) * 2 - 1; M.ty = (y / r.height) * 2 - 1;
    if (e.target && e.target.closest && e.target.closest('.p3pn,.p3hud,.p3cta,.tr,.p3tabs,.p3mv')) return;   // 面板上不拖尾
    trail.unshift({ x, y, t: performance.now() }); if (trail.length > TRAIL) trail.length = TRAIL; lastMove = performance.now();
  }
  host.addEventListener('pointermove', onMove, { passive: true });
  host.addEventListener('pointerdown', onMove, { passive: true });

  function size() {
    dpr = Math.min(window.devicePixelRatio || 1, tier === 'high' ? 1.5 : 1);
    W = cv.clientWidth || innerWidth; H = cv.clientHeight || innerHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
  }
  size(); addEventListener('resize', size);

  function buildRibbons(now) {
    // 先让旧点衰减掉
    while (trail.length && now - trail[trail.length - 1].t > 900) trail.pop();
    const n = trail.length; if (n < 3) return 0;
    let k = 0; const band = 5.5, w = 4.2;
    for (let c = 0; c < RAIN.length; c++) {
      const off = (c - 3) * band;
      for (let i = 0; i < n; i++) {
        const p = trail[i], q = trail[Math.min(i + 1, n - 1)], pr = trail[Math.max(i - 1, 0)];
        let dx = q.x - pr.x, dy = q.y - pr.y; const L = Math.hypot(dx, dy) || 1; dx /= L; dy /= L;
        const nx = -dy, ny = dx, life = 1 - i / (n - 1), age = Math.max(0, 1 - (now - p.t) / 900);
        const a = life * age * (tier === 'high' ? .9 : .7), ww = w * (0.35 + life * .9);
        const cx = (p.x + nx * off * (0.4 + life * .6)) * dpr, cy = (p.y + ny * off * (0.4 + life * .6)) * dpr;
        for (const sg of [-1, 1]) {
          RV[k++] = cx + nx * ww * sg * dpr; RV[k++] = cy + ny * ww * sg * dpr; RV[k++] = sg;
          RV[k++] = RAIN[c][0]; RV[k++] = RAIN[c][1]; RV[k++] = RAIN[c][2]; RV[k++] = a;
        }
      }
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, bufR); gl.bufferSubData(gl.ARRAY_BUFFER, 0, RV, 0, k);
    return n;
  }

  // 卡顿监测：中/高档连续约 3 秒低于 24fps → 降一档
  let fAcc = 0, fN = 0, slowS = 0;
  function frame(now) {
    raf = 0; if (dead || paused) return;
    raf = requestAnimationFrame(frame);
    const dt = Math.min(.1, (now - tPrev) / 1000); tPrev = now;
    const fdt = SLOW ? 1 / 12 : dt; fAcc += fdt; fN++;
    if (fAcc > 1 && !NOFPS) { const fps = fN / fAcc; fAcc = 0; fN = 0; slowS = fps < 24 ? slowS + 1 : 0;
      if (slowS >= 3) { slowS = 0; const nt = lower(tier); dispatchEvent(new CustomEvent('p3q:tier', { detail: { tier: nt, auto: true } })); if (nt === 'low') { api.stop(); return; } setTier(nt); } }
    if (vid.readyState >= 2 && !vid.paused) {
      gl.bindTexture(gl.TEXTURE_2D, tex);
      try { gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, vid); hasFrame = true; ok = 1; vw = vid.videoWidth || vw; vh = vid.videoHeight || vh; } catch (e) {}
    }
    if (ok) inT = Math.min(1, inT + dt / 2.4);
    const ein = 1 - Math.pow(1 - inT, 3);
    M.x += (M.tx - M.x) * Math.min(1, dt * 2.5); M.y += (M.ty - M.y) * Math.min(1, dt * 2.5);
    const t = (now - t0) / 1000;
    gl.viewport(0, 0, cv.width, cv.height);
    gl.disable(gl.BLEND);
    gl.useProgram(film.p); gl.bindVertexArray(vaoQ);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.uniform1i(film.u.uV, 0); gl.uniform2f(film.u.uRes, cv.width, cv.height); gl.uniform2f(film.u.uVid, vw, vh);
    gl.uniform2f(film.u.uM, M.x, M.y); gl.uniform1f(film.u.uT, t); gl.uniform1f(film.u.uIn, ein);
    gl.uniform1f(film.u.uCA, tier === 'high' ? .0045 : 0.); gl.uniform1f(film.u.uStreak, tier === 'high' ? 1 : 0); gl.uniform1f(film.u.uOk, ok ? 1 : 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);
    gl.useProgram(pts.p); gl.bindVertexArray(vaoP);
    gl.uniform2f(pts.u.uRes, cv.width, cv.height); gl.uniform2f(pts.u.uM, -M.x, M.y); gl.uniform1f(pts.u.uT, t); gl.uniform1f(pts.u.uPx, dpr * ein);
    gl.drawArrays(gl.POINTS, 0, NP);
    const n = buildRibbons(now);
    if (n) { gl.useProgram(rib.p); gl.bindVertexArray(vaoR); gl.uniform2f(rib.u.uRes, cv.width, cv.height);
      for (let c = 0; c < RAIN.length; c++) gl.drawArrays(gl.TRIANGLE_STRIP, c * n * 2, n * 2); }
  }

  function setTier(n) {
    if (n === 'low') { api.stop(); return; }
    tier = n; size(); buildPts();
  }
  function vis() { if (document.hidden) { api.pause(); try { vid.pause(); } catch (e) {} } else { api.resume(); playVid(); } }
  document.addEventListener('visibilitychange', vis);
  function playVid() { try { const p = vid.play(); if (p && p.catch) p.catch(() => {}); } catch (e) {} }

  const api = {
    get tier() { return tier; },
    get ready() { return inT >= 1; },
    setTier,
    pause() { paused = true; if (raf) cancelAnimationFrame(raf); raf = 0; },
    resume() { if (dead || !paused) return; paused = false; tPrev = performance.now(); raf = requestAnimationFrame(frame); },
    stop() {
      if (dead) return; dead = true; if (raf) cancelAnimationFrame(raf); raf = 0;
      removeEventListener('resize', size); document.removeEventListener('visibilitychange', vis);
      host.removeEventListener('pointermove', onMove); host.removeEventListener('pointerdown', onMove);
      host.classList.remove('gl'); cv.classList.remove('on');
      const lc = gl.getExtension('WEBGL_lose_context'); if (lc) lc.loseContext();
      S = null;
    },
  };
  host.classList.add('gl'); cv.classList.add('on');
  raf = requestAnimationFrame(frame);
  return api;
}

export function start(host) {
  if (S) return;
  const pk = pickTier();
  if (pk.tier === 'low') return;
  try { S = Film(host, pk.tier); } catch (e) { S = null; }
  if (!S) return;
  window.__p3dbg = { get S() { return S; } };
  dispatchEvent(new CustomEvent('p3q:tier', { detail: { tier: S.tier } }));
}
export function stop() { if (S) S.stop(); }
export function setQuality(n) { if (S) { S.setTier(n); return true; } return false; }
export function tier() { return S ? S.tier : null; }
export function pause() { if (S) S.pause(); }
