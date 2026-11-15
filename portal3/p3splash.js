/* 创世计划 门户 3.0 · 首屏鼠标流体拖尾（11-16）
 * 思路致谢 reactbits「Splash Cursor」（MIT + Commons Clause）；算法为公开的稳定流体（Jos Stam, "Stable Fluids", SIGGRAPH 1999）：
 * 半拉格朗日平流 → 涡度增强 → 散度 → Jacobi 压力 → 减梯度。本文件为本项目自写的精简 WebGL2 实现，未复制源码。
 * 只做淡、透明的拖尾：画布叠在首屏树之上、文字之下（z-index 2，pointer-events:none，mix-blend-mode:screen）。
 * 开关由 index.html 决定（桌面 pointer:fine 且宽≥1000、画质 high、非减少动态、页面可见）；sync(false) 立即释放 WebGL 上下文。
 * 鼠标 2.5 秒不动即停循环（拖尾早已散尽），不空耗 GPU。 */
const SIM = 128, DYE = 512, ITER = 14, CURL = 2.2, VDIS = 2.2, DDIS = 3.4, RAD = .0009, FORCE = 4200, GAIN = .14, DMAX = .018;
let S = null;

const VS = `#version 300 es
in vec2 a; out vec2 vU, vL, vR, vT, vB; uniform vec2 tx;
void main(){ vU = a*.5+.5; vL = vU - vec2(tx.x,0.); vR = vU + vec2(tx.x,0.); vT = vU + vec2(0.,tx.y); vB = vU - vec2(0.,tx.y); gl_Position = vec4(a,0.,1.); }`;
const H = `#version 300 es
precision highp float; precision highp sampler2D; in vec2 vU, vL, vR, vT, vB; out vec4 o;
`;
const FS = {
  splat: H + `uniform sampler2D T; uniform float ar, r; uniform vec2 p; uniform vec3 c;
    void main(){ vec2 d = vU - p; d.x *= ar; o = vec4(texture(T, vU).xyz + exp(-dot(d,d)/r)*c, 1.); }`,
  adv: H + `uniform sampler2D V, X; uniform vec2 stx; uniform float dt, dis;
    void main(){ vec2 c = vU - dt*texture(V, vU).xy*stx; o = texture(X, c) / (1. + dis*dt); }`,
  div: H + `uniform sampler2D V;
    void main(){ float L = texture(V,vL).x, R = texture(V,vR).x, T = texture(V,vT).y, B = texture(V,vB).y; vec2 C = texture(V,vU).xy;
      if (vL.x < 0.) L = -C.x; if (vR.x > 1.) R = -C.x; if (vT.y > 1.) T = -C.y; if (vB.y < 0.) B = -C.y; o = vec4(.5*(R-L+T-B),0.,0.,1.); }`,
  curl: H + `uniform sampler2D V;
    void main(){ o = vec4(.5*(texture(V,vR).y - texture(V,vL).y - texture(V,vT).x + texture(V,vB).x),0.,0.,1.); }`,
  vort: H + `uniform sampler2D V, C; uniform float k, dt;
    void main(){ float L = texture(C,vL).x, R = texture(C,vR).x, T = texture(C,vT).x, B = texture(C,vB).x, M = texture(C,vU).x;
      vec2 f = .5*vec2(abs(T)-abs(B), abs(R)-abs(L)); f /= length(f) + 1e-4; f *= k*M; f.y *= -1.;
      vec2 v = texture(V,vU).xy + f*dt; o = vec4(clamp(v,-1000.,1000.),0.,1.); }`,
  pres: H + `uniform sampler2D P, D;
    void main(){ o = vec4((texture(P,vL).x + texture(P,vR).x + texture(P,vB).x + texture(P,vT).x - texture(D,vU).x)*.25,0.,0.,1.); }`,
  grad: H + `uniform sampler2D P, V;
    void main(){ vec2 v = texture(V,vU).xy - vec2(texture(P,vR).x - texture(P,vL).x, texture(P,vT).x - texture(P,vB).x); o = vec4(v,0.,1.); }`,
  fade: H + `uniform sampler2D T; uniform float k; void main(){ o = k*texture(T,vU); }`,
  show: H + `uniform sampler2D T;
    void main(){ vec3 c = texture(T,vU).rgb; c = c / (1. + c); float m = max(c.r,max(c.g,c.b)); c = mix(vec3(m), c, 1.35); c = max(c, 0.); float a = clamp(m, 0., .85); o = vec4(min(c, vec3(a)), a); }`,
};
/* 品牌色：冷蓝 / 紫 / 青 / 金，缓慢轮换 */
const PAL = [[.49, .78, 1], [.65, .55, .98], [.37, .92, .83], [.95, .78, .45], [1, .6, .84]];

function init(host) {
  const cv = document.createElement('canvas'); cv.className = 'p3sp'; cv.setAttribute('aria-hidden', 'true');
  const gl = cv.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, preserveDrawingBuffer: false });
  if (!gl || !gl.getExtension('EXT_color_buffer_float')) { try { gl && gl.getExtension('WEBGL_lose_context')?.loseContext(); } catch (e) {} return null; }
  const before = host.querySelector('.p3nl') || host.querySelector('.p3bd'); host.insertBefore(cv, before);
  const mk = (t, s) => { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(x)); return x; };
  const vs = mk(gl.VERTEX_SHADER, VS), P = {};
  for (const k in FS) {
    const p = gl.createProgram(); gl.attachShader(p, vs); gl.attachShader(p, mk(gl.FRAGMENT_SHADER, FS[k])); gl.bindAttribLocation(p, 0, 'a'); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const u = {}, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); for (let i = 0; i < n; i++) { const nm = gl.getActiveUniform(p, i).name; u[nm] = gl.getUniformLocation(p, nm); }
    P[k] = { p, u };
  }
  const vb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vb); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  function fbo(w, h, ifmt, fmt) {
    const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, ifmt, w, h, 0, fmt, gl.HALF_FLOAT, null);
    const f = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, f); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
    gl.viewport(0, 0, w, h); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    return { t, f, w, h };
  }
  const dbl = (w, h, i, f) => { let a = fbo(w, h, i, f), b = fbo(w, h, i, f); return { get r() { return a; }, get w() { return b; }, swap() { const x = a; a = b; b = x; } }; };
  let vel, dye, div, crl, prs, sw = 1, shh = 1, dw = 1, dh = 1;
  function alloc() {
    const W = innerWidth, Hh = innerHeight, ar = W / Hh;
    cv.width = Math.round(W * Math.min(devicePixelRatio || 1, 1)); cv.height = Math.round(Hh * Math.min(devicePixelRatio || 1, 1));
    const rs = r => ar > 1 ? [Math.round(r * ar), r] : [r, Math.round(r / ar)];
    [sw, shh] = rs(SIM); [dw, dh] = rs(DYE);
    vel = dbl(sw, shh, gl.RG16F, gl.RG); dye = dbl(dw, dh, gl.RGBA16F, gl.RGBA); prs = dbl(sw, shh, gl.R16F, gl.RED);
    div = fbo(sw, shh, gl.R16F, gl.RED); crl = fbo(sw, shh, gl.R16F, gl.RED);
  }
  alloc();
  function run(k, target, set) {
    const pr = P[k]; gl.useProgram(pr.p); const u = pr.u; let unit = 0;
    for (const n in set) { const v = set[n]; if (!u[n]) continue;
      if (v && v.t) { gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, v.t); gl.uniform1i(u[n], unit++); }
      else if (Array.isArray(v)) (v.length === 2 ? gl.uniform2fv : gl.uniform3fv).call(gl, u[n], v); else gl.uniform1f(u[n], v); }
    if (target) { gl.bindFramebuffer(gl.FRAMEBUFFER, target.f); gl.viewport(0, 0, target.w, target.h); }
    else { gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, cv.width, cv.height); }
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  const ptr = { x: 0, y: 0, dx: 0, dy: 0, moved: false, has: false };
  let raf = 0, last = 0, lastMove = 0, hue = 0, dead = false;
  function splat(x, y, dx, dy, c) {
    const ar = cv.width / cv.height, stx = [1 / sw, 1 / shh];
    run('splat', vel.w, { tx: stx, T: vel.r, ar, p: [x, y], c: [dx, dy, 0], r: RAD * (ar > 1 ? ar : 1) }); vel.swap();
    run('splat', dye.w, { tx: [1 / dw, 1 / dh], T: dye.r, ar, p: [x, y], c, r: RAD * (ar > 1 ? ar : 1) }); dye.swap();
  }
  function step(dt) {
    const stx = [1 / sw, 1 / shh];
    gl.disable(gl.BLEND);
    run('curl', crl, { tx: stx, V: vel.r });
    run('vort', vel.w, { tx: stx, V: vel.r, C: crl, k: CURL, dt }); vel.swap();
    run('div', div, { tx: stx, V: vel.r });
    run('fade', prs.w, { tx: stx, T: prs.r, k: .8 }); prs.swap();
    for (let i = 0; i < ITER; i++) { run('pres', prs.w, { tx: stx, P: prs.r, D: div }); prs.swap(); }
    run('grad', vel.w, { tx: stx, P: prs.r, V: vel.r }); vel.swap();
    run('adv', vel.w, { tx: stx, V: vel.r, X: vel.r, stx, dt, dis: VDIS }); vel.swap();
    run('adv', dye.w, { tx: [1 / dw, 1 / dh], V: vel.r, X: dye.r, stx, dt, dis: DDIS }); dye.swap();
  }
  function frame(now) {
    raf = 0; if (dead) return;
    const dt = Math.min(.033, (now - (last || now)) / 1000 || .016); last = now;
    if (ptr.moved) {
      ptr.moved = false; hue = (hue + dt * .25) % PAL.length;
      const dl = Math.hypot(ptr.dx, ptr.dy); if (dl > DMAX) { ptr.dx *= DMAX / dl; ptr.dy *= DMAX / dl; }
      const i = Math.floor(hue), f = hue - i, a = PAL[i], b = PAL[(i + 1) % PAL.length], g = GAIN;
      splat(ptr.x, ptr.y, ptr.dx * FORCE, ptr.dy * FORCE, [(a[0] + (b[0] - a[0]) * f) * g, (a[1] + (b[1] - a[1]) * f) * g, (a[2] + (b[2] - a[2]) * f) * g]);
    }
    step(dt);
    gl.clearColor(0, 0, 0, 0); gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, cv.width, cv.height); gl.clear(gl.COLOR_BUFFER_BIT);
    run('show', null, { tx: [1 / dw, 1 / dh], T: dye.r });
    if (now - lastMove < 2500 && !document.hidden) raf = requestAnimationFrame(frame); else { last = 0; gl.clear(gl.COLOR_BUFFER_BIT); }
  }
  function onMove(e) {
    if (e.pointerType && e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
    const x = e.clientX / innerWidth, y = 1 - e.clientY / innerHeight;
    if (ptr.has) { ptr.dx = (x - ptr.x) * (innerWidth / innerHeight > 1 ? innerWidth / innerHeight : 1); ptr.dy = y - ptr.y; ptr.moved = Math.abs(ptr.dx) + Math.abs(ptr.dy) > 0; }
    ptr.x = x; ptr.y = y; ptr.has = true; lastMove = performance.now();
    if (!raf && !dead) raf = requestAnimationFrame(frame);
  }
  let rt = 0; const onResize = () => { clearTimeout(rt); rt = setTimeout(() => { if (!dead) alloc(); }, 200); };
  window.addEventListener('pointermove', onMove, { passive: true }); window.addEventListener('resize', onResize);
  return {
    stop() {
      dead = true; cancelAnimationFrame(raf); clearTimeout(rt);
      window.removeEventListener('pointermove', onMove); window.removeEventListener('resize', onResize);
      try { gl.getExtension('WEBGL_lose_context')?.loseContext(); } catch (e) {}
      cv.remove();
    }
  };
}

/* want=true 时创建（已建则保持），false 时立即释放 */
export function sync(host, want) {
  if (want && !S) { try { S = init(host); } catch (e) { S = null; const c = host.querySelector('.p3sp'); if (c) c.remove(); } }
  else if (!want && S) { S.stop(); S = null; }
  window.__p3sp = !!S;
  return !!S;
}
