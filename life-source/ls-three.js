// 生命源码 · Three.js 版本入口(2.0 S0)
// 默认 r186(vendor/r186/,本地);?three=169 回滚到 r169(vendor/three.module.min.js),本次会话内各页面沿用;?three=186 恢复。
const q = new URLSearchParams(location.search).get('three');
let v = q;
try { if (q === '169' || q === '186') sessionStorage.setItem('gn:ls:three', q); else v = sessionStorage.getItem('gn:ls:three'); } catch {}
export const THREE_REV = v === '169' ? '169' : '186';
const THREE = await import(THREE_REV === '169' ? './vendor/three.module.min.js' : './vendor/r186/three.module.min.js');
export default THREE;
/** 先探测 WebGL,避免在不支持的设备上让 three 打印建上下文失败的报错(调用方照常走平面回退) */
let gl = null;
export function canGL() { if (gl !== null) return gl; try { const c = document.createElement('canvas'); gl = !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { gl = false; } return gl; }
