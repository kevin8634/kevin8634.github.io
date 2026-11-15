/* 创世计划 门户 3.0 · 画质分档（p3intro 与 p3hero 共用，11-15）
 * 规则：?p3q=high|medium|low > localStorage gn:p3q（用户手动选）> 自动。
 * 自动只分两种：软件渲染（swiftshader / llvmpipe / software / basic render）或无 WebGL2 → low；其余所有 GPU（含手机与苹果设备）→ medium。
 * high 不自动选，只能用户手动选。自动降档（卡顿时）不写回 localStorage。 */
export const TIERS = ['high', 'medium', 'low'];
export const KEY = 'gn:p3q';

export function override() {
  try {
    const m = /[?&]p3q=(high|medium|low)\b/.exec(location.search);
    if (m) return m[1];
    const ls = localStorage.getItem(KEY);
    if (ls === 'high' || ls === 'medium' || ls === 'low') return ls;
  } catch (e) {}
  return null;
}

/* gl：可传入已有 WebGL2 上下文；不传则临时建一个再释放 */
export function pickTier(gl) {
  const o = override();
  if (o) return { tier: o, forced: true, gpu: '' };
  let name = '', own = false;
  try {
    if (!gl) { gl = document.createElement('canvas').getContext('webgl2'); own = true; }
    if (!gl) return { tier: 'low', forced: false, gpu: 'no-webgl2' };
    const x = gl.getExtension('WEBGL_debug_renderer_info');
    name = String((x ? gl.getParameter(x.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)) || '');
    if (own) { const lc = gl.getExtension('WEBGL_lose_context'); if (lc) lc.loseContext(); }
  } catch (e) { return { tier: 'low', forced: false, gpu: '' }; }
  return { tier: /swiftshader|llvmpipe|software|basic render/i.test(name) ? 'low' : 'medium', forced: false, gpu: name };
}

export function save(t) { try { localStorage.setItem(KEY, t); } catch (e) {} }
export function lower(t) { return t === 'high' ? 'medium' : 'low'; }
/* 调试：?p3slow=1 让 fps 监测把每帧当作 1/12 秒（模拟卡顿，只影响监测，不影响画面） */
export const SLOW = /[?&]p3slow=1\b/.test(location.search);

/* 自动降档提示：每次页面载入只提示一次 */
export function toast(host, en, corner) {   // corner: 'tr' 右上（首屏）| 'br' 右下（开场）
  if (window.__p3qToasted) return; window.__p3qToasted = 1;
  const d = document.createElement('div'); d.className = 'p3qt'; d.setAttribute('role', 'status');
  const br = corner === 'br';
  d.textContent = en ? 'Quality lowered automatically · adjust ' + (br ? 'bottom-right' : 'top-right') : '已自动降低画质 · 可在' + (br ? '右下角' : '右上角') + '调整';
  (host || document.body).appendChild(d);
  requestAnimationFrame(() => d.classList.add('on'));
  const ms = SLOW ? 10000 : 3000;   // 调试模拟卡顿时多留一会，方便截图
  setTimeout(() => d.classList.remove('on'), ms);
  setTimeout(() => d.remove(), ms + 700);
  return d;
}
