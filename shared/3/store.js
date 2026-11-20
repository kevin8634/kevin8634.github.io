/* 创世计划 3.0 · 状态仓库 /shared/3/store.js v0.2(G5)
 * createStore(initial,{urlParam,normalize,syncUrl,encode,decode,limit})
 *  get() / set(next|fn) / subscribe(f) / beginGesture() / endGesture() / undo() / redo() / canUndo / canRedo
 *  - 内部用 undo.js:一次拖动(beginGesture…endGesture)合并成一步撤销
 *  - URL 同步:replaceState 写 ?<urlParam>=<encode(state)>,手势中不写,结束时写一次;默认 encode=JSON+encodeURIComponent
 *  - normalize 每次 set 都过一遍(钳制范围) */
import { createUndo } from './undo.js';

export function createStore(initial, { urlParam = null, normalize = (x) => x, syncUrl = !!urlParam, encode = (s) => JSON.stringify(s), decode = (s) => JSON.parse(s), limit = 100 } = {}) {
  let start = normalize(initial);
  if (syncUrl && urlParam && typeof location !== 'undefined') {
    try { const v = new URLSearchParams(location.search).get(urlParam); if (v) start = normalize(decode(v)); } catch (e) {}
  }
  const subs = new Set();
  let gesture = false;
  const writeUrl = (s) => {
    if (!syncUrl || !urlParam || gesture || typeof history === 'undefined') return;
    try { const u = new URL(location.href); u.searchParams.set(urlParam, encode(s)); history.replaceState(history.state, '', u); } catch (e) {}
  };
  const u = createUndo(start, { limit, onChange: (s) => { subs.forEach((f) => { try { f(s); } catch (e) {} }); writeUrl(s); } });
  return {
    get: () => u.state,
    set(next) { const n = normalize(typeof next === 'function' ? next(u.state) : next); u.push(n); },
    subscribe(f) { subs.add(f); return () => subs.delete(f); },
    beginGesture() { gesture = true; u.begin(); },
    endGesture() { u.end(); gesture = false; writeUrl(u.state); },
    undo: () => u.undo(), redo: () => u.redo(),
    get canUndo() { return u.canUndo; }, get canRedo() { return u.canRedo; },
    reset: (s) => u.reset(normalize(s)),
    bindKeys: (t) => u.bindKeys(t),
  };
}
