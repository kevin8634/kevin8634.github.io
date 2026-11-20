/* 创世计划 3.0 · 自测钩子约定 /shared/3/selftest.js v0.1
 * 页面 URL 带 ?selftest=1 时,各世界用 register(world, api) 暴露钩子到 window.__gn3[world]
 * (宙律另挂 window.__nv3 = 同一对象,兼容方案 §4)。
 * api 约定(按需实现):
 *   ready(): Promise  场景首帧可交互后 resolve
 *   run(preset): Promise<derived>  跑完一段确定性推演并返回结果(数值比对用)
 *   state(): object   当前 state 快照
 *   tier(): 'high'|'medium'|'low'
 *   fps(): number
 * 自测脚本(playwright)只读这些钩子,不依赖页面 DOM 结构。 */
export const ON = typeof location !== 'undefined' && /[?&]selftest=1\b/.test(location.search);
export function register(world, api) {
  if (!ON || typeof window === 'undefined') return false;
  window.__gn3 = window.__gn3 || {};
  window.__gn3[world] = api;
  if (world === 'nv') window.__nv3 = api;
  return true;
}
/* 收集运行期错误,供脚本读取 window.__gn3err */
if (ON && typeof window !== 'undefined' && !window.__gn3err) {
  window.__gn3err = [];
  window.addEventListener('error', (e) => window.__gn3err.push(String(e.message || e)));
  window.addEventListener('unhandledrejection', (e) => window.__gn3err.push('reject: ' + String(e.reason)));
}
