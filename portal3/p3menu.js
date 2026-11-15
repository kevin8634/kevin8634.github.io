/* 创世计划 门户 3.0 · 「玩」世界球（11-16）
 * 思路致谢 reactbits「Infinite Menu」（MIT + Commons Clause）：卡片贴在球面、拖动旋转带惯性、松手吸附到正中一项。
 * 本文件为本项目自写的原生 WebGL2 实现，未复制其源码；不依赖 three、不发外部请求。
 * 卡面 = 仓库内 world-0N.webp / orb-gn-2.0.webp 画到 2D 画布后上传为纹理数组；加载失败时用程序生成的渐变卡面。
 * 低档 / 减少动态 / 无 WebGL2：grid() 输出玻璃卡网格（同一份数据）。 */

const N = 24, R = 2, CAMZ = 6.2, FOV = 40 * Math.PI / 180, SIZE = .62, TEX = 512;

/* 斐波那契球面均匀点 */
function fib(n) {
  const out = [], g = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i + .5) / n * 2, r = Math.sqrt(1 - y * y), t = g * i;
    out.push([Math.cos(t) * r, y, Math.sin(t) * r]);
  }
  return out;
}
/* 四元数 [x,y,z,w] */
const qmul = (a, b) => [a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1], a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0], a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3], a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2]];
const qaa = (ax, an) => { const l = Math.hypot(ax[0], ax[1], ax[2]) || 1, s = Math.sin(an / 2) / l; return [ax[0] * s, ax[1] * s, ax[2] * s, Math.cos(an / 2)]; };
const qnorm = q => { const l = Math.hypot(q[0], q[1], q[2], q[3]) || 1; return [q[0] / l, q[1] / l, q[2] / l, q[3] / l]; };
function qrot(q, v) {
  const [x, y, z, w] = q, cx = y * v[2] - z * v[1] + w * v[0], cy = z * v[0] - x * v[2] + w * v[1], cz = x * v[1] - y * v[0] + w * v[2];
  return [v[0] + 2 * (y * cz - z * cy), v[1] + 2 * (z * cx - x * cz), v[2] + 2 * (x * cy - y * cx)];
}
const hex = c => { const m = /^#?([0-9a-f]{6})$/i.exec(c || ''); const n = m ? parseInt(m[1], 16) : 0xb9a8ff; return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const VS = `#version 300 es
in vec2 aP; in vec3 iP; in float iL; in float iA;
uniform mat4 uPr; uniform vec4 uQ; uniform float uMove;
out vec2 vC; flat out int vL; out float vF; out float vA;
vec3 qr(vec4 q, vec3 v){ return v + 2.0*cross(q.xyz, cross(q.xyz, v) + q.w*v); }
void main(){
  vec3 n = normalize(qr(uQ, iP));
  vec3 up = vec3(0.,1.,0.) - n*n.y; float ul = length(up);
  up = ul < 1e-3 ? vec3(0.,0.,-1.) : up/ul;
  vec3 rt = normalize(cross(up, n));
  float f = n.z;
  float s = ${SIZE.toFixed(3)} * mix(.5, 1.06, smoothstep(-.2, 1., f)) * (1. - .2*uMove) * (1. + .06*iA*(1.-uMove));
  vec2 c = aP * 1.3;
  vec3 p = n*${R.toFixed(1)} + (rt*c.x + up*c.y)*s;
  p.z -= ${CAMZ.toFixed(2)};
  gl_Position = uPr * vec4(p, 1.);
  vC = c; vL = int(iL + .5); vF = f; vA = iA;
}`;
const FS = `#version 300 es
precision highp float;
uniform mediump sampler2DArray uT; uniform vec3 uC[8]; uniform float uMove, uTime;
in vec2 vC; flat in int vL; in float vF; in float vA;
out vec4 o;
void main(){
  float r = length(vC), aa = fwidth(r) * 1.2;
  vec3 col = uC[vL];
  float vis = smoothstep(-.75, .25, vF);
  float lit = mix(.18, 1., smoothstep(-.4, .95, vF));
  // 圆盘：轻微球面鼓起采样
  vec2 uv = vC * (.96 - .06*r*r) * .5 + .5; uv.y = 1. - uv.y;
  vec3 tex = texture(uT, vec3(uv, float(vL))).rgb;
  float rim = smoothstep(.62, 1., r);
  float spec = pow(max(0., 1. - length(vC - vec2(-.38, .42)) * 1.25), 5.) * .28;
  vec3 disc = tex * lit * (1. - .35*rim) + col * rim * (.35 + .65*vA) * lit + spec * lit;
  float inD = 1. - smoothstep(1. - aa, 1. + aa, r);
  // 外圈：细光环 + 柔光晕（正中项更亮）
  float ring = exp(-pow((r - 1.035) / .018, 2.)) * (.35 + .9*vA);
  float halo = exp(-max(r - 1., 0.) * 11.) * (1. - inD) * (.12 + .5*vA) * (1. - .6*uMove) * (1. - smoothstep(1.1, 1.28, r));
  vec3 c = disc * inD + col * (ring + halo) * lit;
  float a = clamp(inD + ring * .8 + halo * .35, 0., 1.) * vis;
  o = vec4(c * vis, a);
}`;

function sh(gl, t, s) { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(x)); return x; }

/* 卡面：圆形星球图 + 世界色光晕 + 暗角；Deep 2.0 用 orb-gn-2.0.webp */
function drawCard(cv, it, img) {
  const x = cv.getContext('2d'), S = cv.width, c = it.color;
  x.globalCompositeOperation = 'source-over';
  const g = x.createRadialGradient(S * .45, S * .4, 0, S / 2, S / 2, S * .72);
  g.addColorStop(0, c); g.addColorStop(.35, '#1a1338'); g.addColorStop(1, '#05040c');
  x.fillStyle = '#05040c'; x.fillRect(0, 0, S, S); x.globalAlpha = .55; x.fillStyle = g; x.fillRect(0, 0, S, S); x.globalAlpha = 1;
  if (img) { const k = it.zoom || 1.16, w = S * k; x.drawImage(img, (S - w) / 2, (S - w) / 2, w, w); }
  else {
    x.fillStyle = '#fff'; x.globalAlpha = .9; x.font = `700 ${S * .2}px ui-monospace, Menlo, monospace`; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText(it.mono || '', S / 2, S / 2); x.globalAlpha = 1;
  }
  const v = x.createRadialGradient(S / 2, S / 2, S * .3, S / 2, S / 2, S * .52);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.55)'); x.fillStyle = v; x.fillRect(0, 0, S, S);
}

export function webgl2ok() { try { return !!document.createElement('canvas').getContext('webgl2'); } catch (e) { return false; } }

/* items: [{name, sub, star, desc, href, color, img, mono}]；txt: {enter, hint, list} */
export function sphere(host, items, txt) {
  const M = items.length, pts = fib(N), inst = pts.map((p, i) => ({ p, k: i % M }));
  host.innerHTML = '';
  host.classList.add('wm');
  const stage = document.createElement('div'); stage.className = 'wm-st'; stage.tabIndex = 0;
  stage.setAttribute('role', 'group'); stage.setAttribute('aria-label', txt.list);
  const cv = document.createElement('canvas'); cv.setAttribute('aria-hidden', 'true'); stage.appendChild(cv);
  const hint = document.createElement('p'); hint.className = 'wm-hn'; hint.setAttribute('aria-hidden', 'true'); hint.textContent = txt.hint;
  const lb = document.createElement('div'); lb.className = 'wm-lb';
  lb.innerHTML = '<i></i><b></b><p></p><a class="wm-go"><span></span><em aria-hidden="true">→</em></a>';
  const sr = document.createElement('ul'); sr.className = 'wm-sr';
  sr.innerHTML = items.map(it => `<li><a href="${esc(it.href)}">${esc(it.name)}</a></li>`).join('');
  host.append(stage, lb, hint, sr);
  const [lI, lB, lP, lA] = lb.children; lA.firstChild.textContent = txt.enter;

  const gl = cv.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: true });
  if (!gl) return null;
  let prog;
  try {
    prog = gl.createProgram(); gl.attachShader(prog, sh(gl, gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl, gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  } catch (e) { return null; }
  gl.useProgram(prog);
  const U = n => gl.getUniformLocation(prog, n), uPr = U('uPr'), uQ = U('uQ'), uMove = U('uMove'), uTime = U('uTime');
  const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
  const qb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, qb); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const aP = gl.getAttribLocation(prog, 'aP'); gl.enableVertexAttribArray(aP); gl.vertexAttribPointer(aP, 2, gl.FLOAT, false, 0, 0);
  const ib = gl.createBuffer(), idata = new Float32Array(N * 5); gl.bindBuffer(gl.ARRAY_BUFFER, ib); gl.bufferData(gl.ARRAY_BUFFER, idata.byteLength, gl.DYNAMIC_DRAW);
  [['iP', 3, 0], ['iL', 1, 12], ['iA', 1, 16]].forEach(([n, s, off]) => { const l = gl.getAttribLocation(prog, n); gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, s, gl.FLOAT, false, 20, off); gl.vertexAttribDivisor(l, 1); });
  gl.uniform3fv(U('uC'), new Float32Array([].concat(...items.map(it => hex(it.color)), ...Array(8 - M).fill([0, 0, 0]))));
  gl.uniform1i(U('uT'), 0);
  const tex = gl.createTexture(); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D_ARRAY, tex);
  gl.texStorage3D(gl.TEXTURE_2D_ARRAY, Math.log2(TEX) + 1, gl.RGBA8, TEX, TEX, 8);
  gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const card = document.createElement('canvas'); card.width = card.height = TEX;
  let dead = false;
  function upload(i, img) { if (dead) return; drawCard(card, items[i], img); gl.bindTexture(gl.TEXTURE_2D_ARRAY, tex); gl.texSubImage3D(gl.TEXTURE_2D_ARRAY, 0, 0, 0, i, TEX, TEX, 1, gl.RGBA, gl.UNSIGNED_BYTE, card); gl.generateMipmap(gl.TEXTURE_2D_ARRAY); kick(); }
  gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); gl.disable(gl.DEPTH_TEST);

  /* 状态：开场带一圈旋转后吸附到第一项（星图） */
  const i0 = inst.reduce((b, s, i) => s.k === 0 && Math.abs(s.p[1]) < Math.abs(inst[b].p[1]) ? i : b, 0);
  let q = [0, 0, 0, 1];
  q = qnorm(qmul(aimAt(i0), q));
  q = qnorm(qmul(qaa([.25, 1, 0], -1.25), q));
  let vel = [0, 0, 0], drag = null, forced = i0, act = -1, move = 1, raf = 0, last = 0, W = 1, H = 1, shown = -1, t0 = performance.now();
  function aimAt(i) { const v = qrot(q, inst[i].p); return rotTo(v, [0, 0, 1], 1); }
  function rotTo(v, t, f) { const ax = [v[1] * t[2] - v[2] * t[1], v[2] * t[0] - v[0] * t[2], v[0] * t[1] - v[1] * t[0]], an = Math.acos(Math.max(-1, Math.min(1, v[0] * t[0] + v[1] * t[1] + v[2] * t[2]))); return Math.hypot(...ax) < 1e-6 ? [0, 0, 0, 1] : qaa(ax, an * f); }
  function best() { let b = 0, bz = -2; inst.forEach((s, i) => { const z = qrot(q, s.p)[2]; if (z > bz) { bz = z; b = i; } }); return b; }
  function proj() {
    const a = W / H, fy = a < 1 ? 2 * Math.atan(Math.tan(FOV / 2) / a) : FOV, f = 1 / Math.tan(fy / 2), n = .1, fa = 50;
    return new Float32Array([f / a, 0, 0, 0, 0, f, 0, 0, 0, 0, (fa + n) / (n - fa), -1, 0, 0, 2 * fa * n / (n - fa), 0]);
  }
  function size() {
    const r = stage.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2);
    W = Math.max(1, r.width); H = Math.max(1, r.height);
    cv.width = Math.round(W * d); cv.height = Math.round(H * d); gl.viewport(0, 0, cv.width, cv.height); gl.uniformMatrix4fv(uPr, false, proj()); kick();
  }
  function label(k) {
    if (k === shown) return; shown = k; const it = items[k];
    lb.style.setProperty('--c', it.color); lI.textContent = it.sub; lB.textContent = it.name; lP.textContent = it.desc; lA.href = it.href;
    lA.setAttribute('aria-label', txt.enter + ' ' + it.name);
  }
  function frame(now) {
    raf = 0; if (dead) return;
    const dt = Math.min(.05, (now - (last || now)) / 1000 || .016); last = now;
    let sp = Math.hypot(...vel);
    if (!drag) {
      if (sp > .35 && forced < 0) { q = qnorm(qmul(qaa(vel, sp * dt), q)); const k = Math.exp(-dt * 2.6); vel = vel.map(v => v * k); }
      else {
        vel = [0, 0, 0]; sp = 0; const i = forced >= 0 ? forced : best(), v = qrot(q, inst[i].p);
        q = qnorm(qmul(rotTo(v, [0, 0, 1], Math.min(1, dt * 7)), q));
        if (v[2] > .99995) { forced = -1; }
        act = i;
      }
    }
    const err = act >= 0 ? 1 - qrot(q, inst[act].p)[2] : 1;
    const tm = drag || sp > .35 || err > .004 ? 1 : 0; move += (tm - move) * Math.min(1, dt * 8);
    const k = act >= 0 ? inst[act].k : -1;
    lb.classList.toggle('on', move < .5 && !drag && k >= 0); if (move < .5 && k >= 0) label(k);
    host.classList.toggle('mv', move > .5);
    // 远到近排序后绘制（无深度缓冲，半透明光晕正确叠加）
    const ord = inst.map((s, i) => ({ i, z: qrot(q, s.p)[2] })).sort((a, b) => a.z - b.z);
    ord.forEach((o, j) => { const s = inst[o.i]; idata.set([s.p[0], s.p[1], s.p[2], s.k, o.i === act && move < .5 ? 1 - move * 2 : 0], j * 5); });
    gl.bindBuffer(gl.ARRAY_BUFFER, ib); gl.bufferSubData(gl.ARRAY_BUFFER, 0, idata);
    gl.uniform4fv(uQ, q); gl.uniform1f(uMove, move); gl.uniform1f(uTime, (now - t0) / 1000);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bindVertexArray(vao); gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, N);
    const idle = !drag && sp === 0 && forced < 0 && err < 1e-5 && move < .01;
    if (!idle && !document.hidden) raf = requestAnimationFrame(frame); else last = 0;
  }
  function kick() { if (!raf && !dead && !document.hidden) raf = requestAnimationFrame(frame); }

  items.forEach((it, i) => { upload(i, null); if (!it.img) return; const im = new Image(); im.decoding = 'async'; im.onload = () => upload(i, im); im.src = it.img; });

  /* 交互：拖动 = 视空间旋转（拖右 → 绕 +Y），松手保留角速度后衰减，再吸附 */
  function pick(cx, cy) {
    const r = cv.getBoundingClientRect(), pr = proj(); let b = -1, bz = .15;
    inst.forEach((s, i) => {
      const v = qrot(q, s.p); if (v[2] < bz) return; const p = [v[0] * R, v[1] * R, v[2] * R - CAMZ];
      const w = -p[2], sx = (p[0] * pr[0] / w * .5 + .5) * r.width, sy = (.5 - p[1] * pr[5] / w * .5) * r.height, rad = SIZE * pr[5] / w * .5 * r.height;
      if (Math.hypot(cx - r.left - sx, cy - r.top - sy) < rad * 1.05) { b = i; bz = v[2]; }
    });
    return b;
  }
  function down(e) { if (e.button > 0) return; drag = { x: e.clientX, y: e.clientY, t: performance.now(), m: 0, lt: performance.now() }; vel = [0, 0, 0]; forced = -1; try { stage.setPointerCapture(e.pointerId); } catch (x) {} kick(); }
  function mv(e) {
    if (!drag) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y, now = performance.now(), dt = Math.max(.008, (now - drag.lt) / 1000);
    drag.x = e.clientX; drag.y = e.clientY; drag.lt = now; drag.m += Math.hypot(dx, dy);
    const l = Math.hypot(dx, dy); if (!l) return; const an = l / (Math.min(W, H) * .5) * 1.15, ax = [dy, dx, 0];
    q = qnorm(qmul(qaa(ax, an), q)); const nv = [dy / l * an / dt, dx / l * an / dt, 0];
    vel = vel.map((v, i) => v * .4 + nv[i] * .6); e.preventDefault(); kick();
  }
  function up(e) {
    if (!drag) return; const d = drag; drag = null;
    if (performance.now() - d.lt > 90) vel = [0, 0, 0];
    const sp = Math.hypot(...vel); if (sp > 7) vel = vel.map(v => v / sp * 7);
    if (d.m < 7 && performance.now() - d.t < 500 && e.type === 'pointerup') {
      const i = pick(e.clientX, e.clientY);
      if (i >= 0) { if (i === act && move < .5) { location.href = items[inst[i].k].href; return; } forced = i; vel = [0, 0, 0]; }
    }
    kick();
  }
  function step(dir) {
    const cur = act >= 0 ? inst[act].k : 0, nk = (cur + dir + M) % M; let b = -1, bz = -2;
    inst.forEach((s, i) => { if (s.k !== nk) return; const z = qrot(q, s.p)[2]; if (z > bz) { bz = z; b = i; } });
    forced = b; vel = [0, 0, 0]; kick();
  }
  function key(e) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { step(1); e.preventDefault(); }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { step(-1); e.preventDefault(); }
    else if (e.key === 'Enter' && act >= 0) { location.href = items[inst[act].k].href; }
  }
  const onVis = () => { if (!document.hidden) { last = 0; kick(); } };
  stage.addEventListener('pointerdown', down); stage.addEventListener('pointermove', mv); stage.addEventListener('pointerup', up); stage.addEventListener('pointercancel', up);
  stage.addEventListener('keydown', key); document.addEventListener('visibilitychange', onVis);
  const ro = new ResizeObserver(size); ro.observe(stage); size();
  window.__p3wm = { get act() { return act >= 0 ? inst[act].k : -1; }, get moving() { return move; } };
  return {
    kick() { last = 0; size(); },
    dispose() {
      dead = true; cancelAnimationFrame(raf); ro.disconnect(); document.removeEventListener('visibilitychange', onVis);
      try { gl.getExtension('WEBGL_lose_context')?.loseContext(); } catch (e) {}
      host.classList.remove('wm', 'mv'); host.innerHTML = '';
    }
  };
}

/* 回退：玻璃星球卡网格（4×2；手机同样 4 列） */
export function grid(host, items, txt) {
  host.classList.remove('wm', 'mv'); host.classList.add('wgd');
  host.innerHTML = items.map(it => `<a class="wgc" href="${esc(it.href)}" style="--c:${esc(it.color)}"><span class="o">${it.img ? `<img src="${esc(it.img)}" alt="" width="96" height="96" loading="lazy" decoding="async">` : `<span class="m">${esc(it.mono || '')}</span>`}</span><b>${esc(it.name)}</b><i>${esc(it.field)}</i></a>`).join('');
  return { kick() {}, dispose() { host.classList.remove('wgd'); host.innerHTML = ''; } };
}
