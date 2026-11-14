/* 觉弈 Ludoterra · Three.js 版本选择(v0.36)
 * 默认 r186(vendor/r186/ 本地,MIT);?three=169 回滚 r169(vendor/ 旧文件保留),本会话内沿用(sessionStorage gn:lt:three);?three=186 恢复。 */
export function threeVer() {
  let v = '186';
  try {
    const m = /[?&]three=(169|186)\b/.exec(location.search);
    if (m) { sessionStorage.setItem('gn:lt:three', m[1]); v = m[1]; }
    else if (sessionStorage.getItem('gn:lt:three') === '169') v = '169';
  } catch (_) { if (/[?&]three=169\b/.test(location.search)) v = '169'; }
  return v;
}
export function loadThree() {
  return threeVer() === '169' ? import('./vendor/three.module.min.js') : import('./vendor/r186/three.module.min.js');
}
