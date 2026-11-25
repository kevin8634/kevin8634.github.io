/* 创世计划 门户 3.0 · 「玩」世界球 2（11-25，王磊批「玩的球也要升级」）
 * 七个世界 + 深空之下 2.0 各是一颗真球体小星球：表面用仓库内现有 world-0N.webp / orb-gn-2.0.webp 做正射贴图（随拖动整体滚动，高档另有缓慢自转），
 * 朝光面亮、背面暗，菲涅尔大气辉光取世界主色；八颗星按正四棱反棱柱排成上下两条轨道环，之字形淡连线把八个世界串成一张星图。
 * 交互思路致谢 React Bits「Dome Gallery」（拖拽惯性手感）与 ThreeUI 行星大气辉光；均只借思路，本文件为本项目自写的原生 WebGL2，
 * 未复制其源码，不依赖 three（页面不多出任何 THREE 实例），零外部请求，不新增贴图。
 * 分档：high = 全效果（自转、连线流光、辉光呼吸，DPR≤2）；medium = 去连线动画与自转、轨道环分段减半、贴图 256、DPR≤1.5，静止即停帧。
 * low / 减少动态 / 无 WebGL2 由调用方改用 grid()（与 11-16 版相同的玻璃星球卡网格）。手机 DPR≤1.5。
 * 自己开一个 WebGL2 上下文（首屏的 three 渲染器是另一套管线，不混用）；面板收起、离屏或标签页隐藏时停帧。 */

const R = 1.55, CAMZ = 6.2, FOV = 37 * Math.PI / 180, SIZE = .4, ACT = 1.7, Q = 1.75, CROP = .86;

const qmul = (a, b) => [a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1], a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0], a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3], a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2]];
const qaa = (ax, an) => { const l = Math.hypot(ax[0], ax[1], ax[2]) || 1, s = Math.sin(an / 2) / l; return [ax[0] * s, ax[1] * s, ax[2] * s, Math.cos(an / 2)]; };
const qnorm = q => { const l = Math.hypot(q[0], q[1], q[2], q[3]) || 1; return [q[0] / l, q[1] / l, q[2] / l, q[3] / l]; };
const qconj = q => [-q[0], -q[1], -q[2], q[3]];
function qrot(q, v) {
  const [x, y, z, w] = q, cx = y * v[2] - z * v[1] + w * v[0], cy = z * v[0] - x * v[2] + w * v[1], cz = x * v[1] - y * v[0] + w * v[2];
  return [v[0] + 2 * (y * cz - z * cy), v[1] + 2 * (z * cx - x * cz), v[2] + 2 * (x * cy - y * cx)];
}
const nrm = v => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
/* 行为 rt/up/n 的旋转矩阵（把 rt→x、up→y、n→z）转四元数 */
function qFromRows(a, b, c) {
  const m00 = a[0], m01 = a[1], m02 = a[2], m10 = b[0], m11 = b[1], m12 = b[2], m20 = c[0], m21 = c[1], m22 = c[2], t = m00 + m11 + m22;
  let x, y, z, w;
  if (t > 0) { const s = Math.sqrt(t + 1) * 2; w = s / 4; x = (m21 - m12) / s; y = (m02 - m20) / s; z = (m10 - m01) / s; }
  else if (m00 > m11 && m00 > m22) { const s = Math.sqrt(1 + m00 - m11 - m22) * 2; w = (m21 - m12) / s; x = s / 4; y = (m01 + m10) / s; z = (m02 + m20) / s; }
  else if (m11 > m22) { const s = Math.sqrt(1 + m11 - m00 - m22) * 2; w = (m02 - m20) / s; x = (m01 + m10) / s; y = s / 4; z = (m12 + m21) / s; }
  else { const s = Math.sqrt(1 + m22 - m00 - m11) * 2; w = (m10 - m01) / s; x = (m02 + m20) / s; y = (m12 + m21) / s; z = s / 4; }
  return qnorm([x, y, z, w]);
}
const hex = c => { const m = /^#?([0-9a-f]{6})$/i.exec(c || ''); const n = m ? parseInt(m[1], 16) : 0xb9a8ff; return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* 布局：正四棱反棱柱（8 点在球面上最均匀的排法之一）= 上下两条小圆轨道各 4 颗，错开 45°；整体倾斜，轨道环在画面里是斜椭圆。
 * 第 k 项交替落在上、下环，相邻两项就是之字形连线的两端，左右键沿星图走。 */
const ZL = .511, TILT = qnorm(qmul(qaa([0, 0, 1], -.3), qaa([1, 0, 0], .32)));
function layout(M) {
  const out = [], rho = Math.sqrt(1 - ZL * ZL);
  for (let k = 0; k < M; k++) {
    const up = k % 2 === 0, a = k * Math.PI / 4;   // 上环 0/90/180/270°，下环 45/135/…
    out.push(qrot(TILT, [rho * Math.sin(a), up ? ZL : -ZL, rho * Math.cos(a)]));
  }
  return out;
}
function frameOf(p) {   // 星球自身坐标系：外法线 p 为 z，上方尽量朝布局空间的 y
  let up = [-p[0] * p[1], 1 - p[1] * p[1], -p[2] * p[1]]; const ul = Math.hypot(...up);
  up = ul < 1e-3 ? [0, 0, -1] : up.map(v => v / ul);
  return [cross(up, p), up, p];
}

const PVS = `#version 300 es
in vec2 aP; in vec3 iP; in float iL; in float iA;
uniform mat4 uPr; uniform vec4 uQ; uniform float uMove;
out vec2 vC; flat out int vL; out float vF; out float vA; out vec3 vRt; out vec3 vUp; out vec3 vN;
vec3 qr(vec4 q, vec3 v){ return v + 2.0*cross(q.xyz, cross(q.xyz, v) + q.w*v); }
void main(){
  vec3 p = iP;
  vec3 up = vec3(0.,1.,0.) - p*p.y; float ul = length(up); up = ul < 1e-3 ? vec3(0.,0.,-1.) : up/ul;
  vec3 rt = cross(up, p);
  vec3 n = qr(uQ, p);
  float s = ${SIZE.toFixed(3)} * mix(1., ${ACT.toFixed(3)}, iA) * (1. - .08*uMove);
  vec3 c = n*${R.toFixed(2)}; c.z -= ${CAMZ.toFixed(2)};
  vec2 o = aP * ${Q.toFixed(2)};
  gl_Position = uPr * vec4(c + vec3(o*s, 0.), 1.);
  vC = o; vL = int(iL + .5); vF = n.z; vA = iA;
  // 贴图坐标系：随穹顶刚性滚动，但向镜头偏转 55%，侧面的星也露出插画正面（居中时偏转为 0，星球正立）
  vec3 r0 = qr(uQ, rt), u0 = qr(uQ, up), ax = vec3(n.y, -n.x, 0.); float sl = length(ax);
  if (sl > 1e-4) { ax /= sl; float an = acos(clamp(n.z, -1., 1.)) * .55, cs = cos(an), sn = sin(an);
    r0 = r0*cs + cross(ax, r0)*sn + ax*dot(ax, r0)*(1.-cs); u0 = u0*cs + cross(ax, u0)*sn + ax*dot(ax, u0)*(1.-cs); }
  vRt = r0; vUp = u0; vN = cross(r0, u0);
}`;
const PFS = `#version 300 es
precision highp float;
uniform mediump sampler2DArray uT; uniform vec3 uC[8]; uniform float uTime, uSpin, uHi;
in vec2 vC; flat in int vL; in float vF; in float vA; in vec3 vRt; in vec3 vUp; in vec3 vN;
out vec4 o;
void main(){
  float r = length(vC), aa = fwidth(r) * 1.3;
  vec3 col = uC[vL];
  vec3 L = normalize(vec3(-.58, .52, .63));
  float vis = mix(.38, 1., smoothstep(-.55, .45, vF));          // 穹顶背面的星更暗
  float dimO = mix(.66, 1., vA);                                // 其余略暗，正中最亮
  vec3 c = vec3(0.); float a = 0.;
  if (r < 1. + aa) {
    float rr = min(r, 1.);
    vec3 n = vec3(vC / max(r, 1.) , sqrt(max(0., 1. - rr*rr)));
    // 星球自身坐标（随穹顶整体滚动）+ 高档缓慢自转（绕自身 y 轴）
    vec3 l = vec3(dot(n, vRt), dot(n, vUp), dot(n, vN));
    float sa = uSpin * (.55 + .1*float(vL)), cs = cos(sa), sn = sin(sa);
    l = vec3(cs*l.x + sn*l.z, l.y, -sn*l.x + cs*l.z);
    vec2 uv = l.xy * ${CROP.toFixed(2)} * .5 + .5; uv.y = 1. - uv.y;
    vec3 tex = texture(uT, vec3(uv, float(vL))).rgb;
    tex = mix(tex, tex * (.75 + .5*col), .18);
    float nl = dot(n, L);
    float diff = smoothstep(-.28, .75, nl);                     // 柔和明暗交界
    float lit = .07 + .98 * diff;
    vec3 h = normalize(L + vec3(0., 0., 1.));
    float spec = pow(max(dot(n, h), 0.), 38.) * .32 * diff;
    float fr = pow(1. - n.z, 2.6);                              // 菲涅尔边缘：世界主色大气
    vec3 atm = col * fr * (.55 + .9*vA) * (.35 + .75*smoothstep(-.5, .6, nl));
    vec3 night = col * .05 * (1. - diff);                       // 背光面一点世界色，不是死黑
    c = (tex * lit + spec + night) * dimO + atm;
    a = 1. - smoothstep(1. - aa, 1. + aa, r);
    c *= a;
  }
  // 外圈大气辉光：朝光一侧更亮，正中那颗更宽更亮（高档轻呼吸）
  float br = 1. + uHi * .12 * sin(uTime * 1.6) * vA;
  float d = max(r - 1., 0.);
  float side = .55 + .45 * dot(normalize(vC + 1e-4), normalize(vec2(-.58, .52)));
  float g = exp(-d * mix(9., 3.8, vA)) * (.2 + .95*vA) * side * br * (1. - smoothstep(${(Q - .3).toFixed(2)}, ${Q.toFixed(2)}, r));
  g *= step(1., r);
  float ring = exp(-pow((r - 1.012) / .02, 2.)) * (.25 + .6*vA) * side;
  vec3 gc = col * (g + ring);
  c += gc * (1. - a);
  a = clamp(a + (g + ring) * .55 * (1. - a), 0., 1.);
  o = vec4(c * vis, a * vis);
}`;

/* 轨道环与连线：每段一条屏幕空间等宽细带（WebGL 线宽固定 1 物理像素，高 DPR 下太细，所以自己展开） */
const LVS = `#version 300 es
in vec2 aB; in vec3 iA3; in vec3 iB3; in vec3 iT;
uniform mat4 uPr; uniform vec4 uQ; uniform vec2 uRes; uniform float uW;
out float vS; out float vT; out float vZ; flat out float vK;
vec3 qr(vec4 q, vec3 v){ return v + 2.0*cross(q.xyz, cross(q.xyz, v) + q.w*v); }
void main(){
  vec3 a = qr(uQ, iA3)*${R.toFixed(2)}, b = qr(uQ, iB3)*${R.toFixed(2)};
  float z = mix(a.z, b.z, aB.x) / ${R.toFixed(2)};
  a.z -= ${CAMZ.toFixed(2)}; b.z -= ${CAMZ.toFixed(2)};
  vec4 ca = uPr * vec4(a, 1.), cb = uPr * vec4(b, 1.);
  vec2 sa = ca.xy / ca.w * uRes, sb = cb.xy / cb.w * uRes;
  vec2 dir = normalize(sb - sa + 1e-5), nrm = vec2(-dir.y, dir.x);
  vec4 c = mix(ca, cb, aB.x);
  c.xy += nrm * aB.y * uW / uRes * c.w;
  gl_Position = c;
  vS = aB.y; vT = mix(iT.x, iT.y, aB.x); vZ = z; vK = iT.z;
}`;
const LFS = `#version 300 es
precision highp float;
uniform float uTime, uHi, uMove; uniform vec3 uLc;
in float vS; in float vT; in float vZ; flat in float vK;
out vec4 o;
void main(){
  float e = 1. - smoothstep(.35, 1., abs(vS));
  float dep = mix(.16, 1., smoothstep(-.6, .7, vZ));           // 背面淡、正面稍亮
  float base = vK < .5 ? .22 : (vK < 1.5 ? .2 : .09);         // 0 轨道环 1 连线 2 赤道环
  float pulse = 0.;
  if (vK > .5 && vK < 1.5) { float x = fract(vT - uTime * .12); pulse = uHi * (exp(-x*x*900.) + exp(-(1.-x)*(1.-x)*900.)) * .75; }   // 高档：一粒流光沿星图走一圈
  float al = (base * (1. + .4*uMove) + pulse) * e * dep;
  vec3 c = mix(uLc, vec3(1.), pulse * .6);
  o = vec4(c * al, al);
}`;

function sh(gl, t, s) { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(x)); return x; }
function prog(gl, vs, fs) { const p = gl.createProgram(); gl.attachShader(p, sh(gl, gl.VERTEX_SHADER, vs)); gl.attachShader(p, sh(gl, gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p)); return p; }

/* 表面贴图：取插画中心的星球圆盘（裁掉四角背景与外圈装饰），无图时用世界色程序渐变 */
function drawTex(cv, it, img) {
  const x = cv.getContext('2d'), S = cv.width, c = it.color;
  const g = x.createRadialGradient(S * .4, S * .38, 0, S / 2, S / 2, S * .6);
  g.addColorStop(0, c); g.addColorStop(.5, '#1d1640'); g.addColorStop(1, '#06050f');
  x.fillStyle = g; x.fillRect(0, 0, S, S);
  if (img) { const k = (it.zoom || 1.16) * 1.02, w = S * k; x.drawImage(img, (S - w) / 2, (S - w) / 2, w, w); }
}

export function webgl2ok() { try { return !!document.createElement('canvas').getContext('webgl2'); } catch (e) { return false; } }

/* items: [{name, sub, desc, href, color, img}]；txt: {enter, hint, list}；opt: {tier: 'high'|'medium'} */
export function sphere(host, items, txt, opt) {
  const HI = (opt && opt.tier) === 'high', M = Math.min(8, items.length), P = layout(M), FR = P.map(frameOf);
  const TQ = FR.map(f => qFromRows(f[0], f[1], f[2]));   // 每颗星居中时穹顶的姿态（星球正立）
  host.innerHTML = '';
  host.classList.add('wm', 'wb');
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
  const fail = () => { host.classList.remove('wm', 'wb'); host.innerHTML = ''; return null; };

  const gl = cv.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: true });
  if (!gl) return fail();
  let pp, lp;
  try { pp = prog(gl, PVS, PFS); lp = prog(gl, LVS, LFS); } catch (e) { return fail(); }

  /* —— 星球 —— */
  gl.useProgram(pp);
  const U = (p, n) => gl.getUniformLocation(p, n);
  const pu = { pr: U(pp, 'uPr'), q: U(pp, 'uQ'), mv: U(pp, 'uMove'), tm: U(pp, 'uTime'), sp: U(pp, 'uSpin'), hi: U(pp, 'uHi') };
  const pvao = gl.createVertexArray(); gl.bindVertexArray(pvao);
  const qb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, qb); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  let l = gl.getAttribLocation(pp, 'aP'); gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, 2, gl.FLOAT, false, 0, 0);
  const ib = gl.createBuffer(), idata = new Float32Array(M * 5); gl.bindBuffer(gl.ARRAY_BUFFER, ib); gl.bufferData(gl.ARRAY_BUFFER, idata.byteLength, gl.DYNAMIC_DRAW);
  [['iP', 3, 0], ['iL', 1, 12], ['iA', 1, 16]].forEach(([n, s, off]) => { const k = gl.getAttribLocation(pp, n); gl.enableVertexAttribArray(k); gl.vertexAttribPointer(k, s, gl.FLOAT, false, 20, off); gl.vertexAttribDivisor(k, 1); });
  gl.uniform3fv(U(pp, 'uC'), new Float32Array([].concat(...items.slice(0, M).map(it => hex(it.color)), ...Array(8 - M).fill([0, 0, 0]))));
  gl.uniform1i(U(pp, 'uT'), 0); gl.uniform1f(pu.hi, HI ? 1 : 0);
  const TEX = HI ? 512 : 256;
  const tex = gl.createTexture(); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D_ARRAY, tex);
  gl.texStorage3D(gl.TEXTURE_2D_ARRAY, Math.log2(TEX) + 1, gl.RGBA8, TEX, TEX, 8);
  gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const card = document.createElement('canvas'); card.width = card.height = TEX;
  let dead = false, loaded = 0;
  function upload(i, img) { if (dead) return; drawTex(card, items[i], img); gl.bindTexture(gl.TEXTURE_2D_ARRAY, tex); gl.texSubImage3D(gl.TEXTURE_2D_ARRAY, 0, 0, 0, i, TEX, TEX, 1, gl.RGBA, gl.UNSIGNED_BYTE, card); gl.generateMipmap(gl.TEXTURE_2D_ARRAY); if (img) loaded++; kick(); }

  /* —— 轨道环（上下两条 + 淡赤道）与之字形连线 —— */
  const segs = [], RS = HI ? 120 : 60;
  const rho = Math.sqrt(1 - ZL * ZL);
  [[ZL, 0], [-ZL, 0], [0, 2]].forEach(([y, kind]) => {
    const r = y ? rho : 1;
    for (let s = 0; s < RS; s++) {
      const a0 = s / RS * Math.PI * 2, a1 = (s + 1) / RS * Math.PI * 2;
      segs.push([qrot(TILT, [r * Math.sin(a0), y, r * Math.cos(a0)]), qrot(TILT, [r * Math.sin(a1), y, r * Math.cos(a1)]), s / RS, (s + 1) / RS, kind]);
    }
  });
  const LS = HI ? 16 : 8;
  for (let k = 0; k < M; k++) {   // 之字形：k → k+1（闭环），沿球面大圆弧，略抬离球面
    const a = P[k], b = P[(k + 1) % M], om = Math.acos(Math.max(-1, Math.min(1, dot(a, b))));
    const at = t => { const s = Math.sin(om), u = Math.sin((1 - t) * om) / s, v = Math.sin(t * om) / s, lift = 1 + .06 * Math.sin(Math.PI * t); return [(a[0] * u + b[0] * v) * lift, (a[1] * u + b[1] * v) * lift, (a[2] * u + b[2] * v) * lift]; };
    for (let s = 0; s < LS; s++) segs.push([at(s / LS), at((s + 1) / LS), (k + s / LS) / M, (k + (s + 1) / LS) / M, 1]);
  }
  gl.useProgram(lp);
  const lu = { pr: U(lp, 'uPr'), q: U(lp, 'uQ'), res: U(lp, 'uRes'), w: U(lp, 'uW'), tm: U(lp, 'uTime'), hi: U(lp, 'uHi'), mv: U(lp, 'uMove') };
  gl.uniform1f(lu.hi, HI ? 1 : 0); gl.uniform3fv(U(lp, 'uLc'), new Float32Array([.72, .7, 1]));
  const lvao = gl.createVertexArray(); gl.bindVertexArray(lvao);
  const lbq = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, lbq); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, -1, 1, -1, 0, 1, 1, 1]), gl.STATIC_DRAW);
  l = gl.getAttribLocation(lp, 'aB'); gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, 2, gl.FLOAT, false, 0, 0);
  const ld = new Float32Array(segs.length * 9); segs.forEach((s, i) => ld.set([...s[0], ...s[1], s[2], s[3], s[4]], i * 9));
  const lbuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, lbuf); gl.bufferData(gl.ARRAY_BUFFER, ld, gl.STATIC_DRAW);
  [['iA3', 3, 0], ['iB3', 3, 12], ['iT', 3, 24]].forEach(([n, s, off]) => { const k = gl.getAttribLocation(lp, n); gl.enableVertexAttribArray(k); gl.vertexAttribPointer(k, s, gl.FLOAT, false, 36, off); gl.vertexAttribDivisor(k, 1); });
  gl.bindVertexArray(null);
  gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); gl.disable(gl.DEPTH_TEST);

  /* —— 状态：开场从斜后方转进来，弹簧吸附到第一项 —— */
  let q = qnorm(qmul(qaa([.3, 1, .1], -1.2), TQ[0]));
  let vel = [0, 0, 0], drag = null, target = 0, settled = false, move = 1, raf = 0, last = 0, W = 1, H = 1, DPR = 1, shown = -1, t0 = performance.now(), spin = 0, onScreen = true;
  const actS = new Float32Array(M);
  const panel = host.closest('.p3pn');
  const MOB = Math.min(screen.width || innerWidth, screen.height || innerHeight) < 600 || (window.matchMedia && matchMedia('(pointer: coarse)').matches);
  function proj() {
    const a = W / H, fy = a < 1 ? 2 * Math.atan(Math.tan(FOV / 2) / a) : FOV, f = 1 / Math.tan(fy / 2), n = .1, fa = 50;
    return new Float32Array([f / a, 0, 0, 0, 0, f, 0, 0, 0, 0, (fa + n) / (n - fa), -1, 0, 0, 2 * fa * n / (n - fa), 0]);
  }
  function size() {
    DPR = Math.min(devicePixelRatio || 1, MOB || !HI ? 1.5 : 2);
    W = Math.max(1, stage.clientWidth); H = Math.max(1, stage.clientHeight);   // 布局尺寸（面板展开时有 scale 过渡，不用 getBoundingClientRect）
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR); gl.viewport(0, 0, cv.width, cv.height);
    const pm = proj();
    gl.useProgram(pp); gl.uniformMatrix4fv(pu.pr, false, pm);
    gl.useProgram(lp); gl.uniformMatrix4fv(lu.pr, false, pm); gl.uniform2f(lu.res, cv.width / 2, cv.height / 2); gl.uniform1f(lu.w, Math.max(.6, .75 * DPR));
    kick();
  }
  function label(k) {
    if (k === shown) return; shown = k; const it = items[k];
    lb.style.setProperty('--c', it.color); lI.textContent = it.sub; lB.textContent = it.name; lP.textContent = it.desc; lA.href = it.href;
    lA.setAttribute('aria-label', txt.enter + ' ' + it.name);
  }
  function front(i) { return qrot(q, P[i])[2]; }
  function best() { let b = 0, bz = -2; for (let i = 0; i < M; i++) { const z = front(i); if (z > bz) { bz = z; b = i; } } return b; }
  function errVec() {   // 当前姿态到目标姿态的轴角向量（视空间）
    let d = qmul(TQ[target], qconj(q)); if (d[3] < 0) d = d.map(v => -v);
    const s = Math.hypot(d[0], d[1], d[2]); if (s < 1e-9) return [0, 0, 0];
    const an = 2 * Math.atan2(s, d[3]); return [d[0] / s * an, d[1] / s * an, d[2] / s * an];
  }
  const live = () => !dead && !document.hidden && onScreen && (!panel || panel.classList.contains('open'));
  let free = false;
  function frame(now) {
    raf = 0; if (dead) return;
    const dt = Math.min(.05, (now - (last || now)) / 1000 || .016); last = now;
    let sp = Math.hypot(...vel), e = [0, 0, 0], el = 0;
    if (!drag) {
      if (free && sp > 1.6) {   // 惯性滑行：指数减速
        q = qnorm(qmul(qaa(vel, sp * dt), q)); const k = Math.exp(-dt * 2.4); vel = vel.map(v => v * k);
      } else {
        if (free) { free = false; target = best(); }
        // 弹簧吸附（略欠阻尼，带一点回弹）：分步积分保证稳定
        const n = 3, h = dt / n;
        for (let j = 0; j < n; j++) {
          e = errVec(); vel = vel.map((v, i) => v + (e[i] * 70 - v * 13) * h);
          const s2 = Math.hypot(...vel); if (s2 > 1e-7) q = qnorm(qmul(qaa(vel, s2 * h), q));
        }
        e = errVec(); el = Math.hypot(...e); sp = Math.hypot(...vel);
        if (el < 2e-4 && sp < 2e-3) { q = TQ[target].slice(); vel = [0, 0, 0]; sp = 0; el = 0; }
      }
    }
    if (free || drag) el = 1;
    const tm = drag || free || sp > .06 || el > .012 ? 1 : 0; move += (tm - move) * Math.min(1, dt * 8);
    settled = !drag && !free && el === 0 && sp === 0;
    const aim = drag || free ? best() : target;
    for (let i = 0; i < M; i++) actS[i] += ((i === aim ? 1 - .75 * move : 0) - actS[i]) * Math.min(1, dt * 7);
    lb.classList.toggle('on', move < .5 && !drag && !free); if (move < .5 && !drag && !free) label(target);
    host.classList.toggle('mv', move > .5);
    if (HI) spin += dt * .16;
    const ord = []; for (let i = 0; i < M; i++) ord.push([i, front(i)]); ord.sort((a, b) => a[1] - b[1]);
    ord.forEach(([i], j) => idata.set([P[i][0], P[i][1], P[i][2], i, actS[i]], j * 5));
    const tsec = (now - t0) / 1000;
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(lp); gl.uniform4fv(lu.q, q); gl.uniform1f(lu.tm, tsec); gl.uniform1f(lu.mv, move);
    gl.bindVertexArray(lvao); gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, segs.length);
    gl.useProgram(pp); gl.bindVertexArray(pvao); gl.bindBuffer(gl.ARRAY_BUFFER, ib); gl.bufferSubData(gl.ARRAY_BUFFER, 0, idata);
    gl.uniform4fv(pu.q, q); gl.uniform1f(pu.mv, move); gl.uniform1f(pu.tm, tsec); gl.uniform1f(pu.sp, spin);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, M);
    let actDone = true; for (let i = 0; i < M; i++) if (Math.abs(actS[i] - (i === target ? 1 : 0)) > .004) actDone = false;
    const idle = !HI && settled && move < .01 && actDone;
    if (!idle && live()) raf = requestAnimationFrame(frame); else last = 0;
  }
  function kick() { if (!raf && live()) raf = requestAnimationFrame(frame); }

  items.slice(0, M).forEach((it, i) => { upload(i, null); if (!it.img) return; const im = new Image(); im.decoding = 'async'; im.onload = () => upload(i, im); im.src = it.img; });

  /* 交互：拖动 = 视空间旋转（拖右 → 绕 +Y），松手保留角速度惯性滑行，减速后弹簧吸附到最近一颗 */
  function pick(cx, cy) {
    const r = cv.getBoundingClientRect(), pr = proj(); let b = -1, bz = -.2;
    for (let i = 0; i < M; i++) {
      const v = qrot(q, P[i]); if (v[2] < bz) continue; const p = [v[0] * R, v[1] * R, v[2] * R - CAMZ];
      const w = -p[2], sx = (p[0] * pr[0] / w * .5 + .5) * r.width, sy = (.5 - p[1] * pr[5] / w * .5) * r.height;
      const rad = SIZE * (1 + (ACT - 1) * actS[i]) * pr[5] / w * .5 * r.height;
      if (Math.hypot(cx - r.left - sx, cy - r.top - sy) < rad * 1.15) { b = i; bz = v[2]; }
    }
    return b;
  }
  function down(e) { if (e.button > 0) return; drag = { x: e.clientX, y: e.clientY, t: performance.now(), m: 0, lt: performance.now() }; vel = [0, 0, 0]; free = false; settled = false; try { stage.setPointerCapture(e.pointerId); } catch (x) {} kick(); }
  function mv(e) {
    if (!drag) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y, now = performance.now(), dt = Math.max(.008, (now - drag.lt) / 1000);
    drag.x = e.clientX; drag.y = e.clientY; drag.lt = now; drag.m += Math.hypot(dx, dy);
    const l = Math.hypot(dx, dy); if (!l) return; const an = l / (Math.min(W, H) * .5) * 1.1, ax = [dy, dx, 0];
    q = qnorm(qmul(qaa(ax, an), q)); const nv = [dy / l * an / dt, dx / l * an / dt, 0];
    vel = vel.map((v, i) => v * .35 + nv[i] * .65); e.preventDefault(); kick();
  }
  function up(e) {
    if (!drag) return; const d = drag; drag = null;
    if (performance.now() - d.lt > 90) vel = [0, 0, 0];
    const sp = Math.hypot(...vel); if (sp > 7) vel = vel.map(v => v / sp * 7);
    if (d.m < 7 && performance.now() - d.t < 500 && e.type === 'pointerup') {
      const i = pick(e.clientX, e.clientY);
      if (i >= 0) { if (i === target && settledish()) { location.href = items[i].href; return; } target = i; vel = [0, 0, 0]; free = false; settled = false; kick(); return; }
    }
    free = true; settled = false; kick();
  }
  const settledish = () => move < .5 && !free;
  function step(dir) { target = ((settledish() || !free ? target : best()) + dir + M) % M; free = false; settled = false; vel = vel.map(v => v * .3); kick(); }
  function key(e) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { step(1); e.preventDefault(); }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { step(-1); e.preventDefault(); }
    else if (e.key === 'Enter') { location.href = items[target].href; }
  }
  const onVis = () => { if (!document.hidden) { last = 0; kick(); } };
  stage.addEventListener('pointerdown', down); stage.addEventListener('pointermove', mv); stage.addEventListener('pointerup', up); stage.addEventListener('pointercancel', up);
  stage.addEventListener('keydown', key); document.addEventListener('visibilitychange', onVis);
  const ro = new ResizeObserver(size); ro.observe(stage);
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => { onScreen = es[es.length - 1].isIntersecting; if (onScreen) { last = 0; kick(); } }) : null;
  if (io) io.observe(stage);
  size();
  window.__p3wm = { get act() { return settledish() ? target : -1; }, get target() { return target; }, get moving() { return move; }, get settled() { return settled; }, get running() { return !!raf; }, get loaded() { return loaded; }, get speed() { return Math.hypot(...vel); }, tier: HI ? 'high' : 'medium', kind: 'ball' };
  return {
    kick() { last = 0; size(); },
    dispose() {
      dead = true; cancelAnimationFrame(raf); ro.disconnect(); if (io) io.disconnect(); document.removeEventListener('visibilitychange', onVis);
      try { gl.getExtension('WEBGL_lose_context')?.loseContext(); } catch (e) {}
      host.classList.remove('wm', 'wb', 'mv'); host.innerHTML = '';
    }
  };
}

/* 回退（低档 / 减少动态 / 无 WebGL2）：与 11-16 版相同的玻璃星球卡网格 */
export function grid(host, items, txt) {
  host.classList.remove('wm', 'wb', 'mv'); host.classList.add('wgd');
  host.innerHTML = items.map(it => `<a class="wgc" href="${esc(it.href)}" style="--c:${esc(it.color)}"><span class="o">${it.img ? `<img src="${esc(it.img)}" alt="" width="96" height="96" loading="lazy" decoding="async">` : `<span class="m">${esc(it.mono || '')}</span>`}</span><b>${esc(it.name)}</b><i>${esc(it.field)}</i></a>`).join('');
  return { kick() {}, dispose() { host.classList.remove('wgd'); host.innerHTML = ''; } };
}
