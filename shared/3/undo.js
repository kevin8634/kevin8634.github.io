/* 创世计划 3.0 · 撤销栈 /shared/3/undo.js v0.1
 * 基于 state 快照(state 应 <2KB,可 JSON 化)。上限 100 步。
 * 连续拖动:begin() … end() 之间的多次 push 合并为一步。
 * bindKeys():Ctrl/Cmd+Z 撤销,Shift+Ctrl/Cmd+Z 或 Ctrl+Y 重做(输入框内不拦截)。 */
export function createUndo(initial, { limit = 100, onChange } = {}) {
  const clone = (s) => JSON.parse(JSON.stringify(s));
  let past = [], future = [], cur = clone(initial), grouping = false, groupBase = null;
  const emit = () => onChange && onChange(clone(cur), api);
  const api = {
    get state() { return clone(cur); },
    get canUndo() { return past.length > 0 || (grouping && groupBase !== null); },
    get canRedo() { return future.length > 0; },
    push(next) {
      const n = clone(next);
      if (JSON.stringify(n) === JSON.stringify(cur)) return;
      if (grouping) { if (groupBase === null) groupBase = clone(cur); }
      else { past.push(clone(cur)); if (past.length > limit) past.shift(); }
      cur = n; future = []; emit();
    },
    begin() { grouping = true; groupBase = null; },
    end() {
      if (grouping && groupBase !== null) { past.push(groupBase); if (past.length > limit) past.shift(); }
      grouping = false; groupBase = null;
    },
    undo() { api.end(); if (!past.length) return false; future.push(clone(cur)); cur = past.pop(); emit(); return true; },
    redo() { api.end(); if (!future.length) return false; past.push(clone(cur)); cur = future.pop(); emit(); return true; },
    reset(s) { past = []; future = []; cur = clone(s); grouping = false; groupBase = null; emit(); },
    bindKeys(target = (typeof window !== 'undefined' ? window : null)) {
      if (!target) return () => {};
      const h = (e) => {
        const t = e.target, tag = t && t.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || (t && t.isContentEditable)) return;
        const mod = e.ctrlKey || e.metaKey, k = (e.key || '').toLowerCase();
        if (!mod) return;
        if (k === 'z' && !e.shiftKey) { if (api.undo()) e.preventDefault(); }
        else if ((k === 'z' && e.shiftKey) || k === 'y') { if (api.redo()) e.preventDefault(); }
      };
      target.addEventListener('keydown', h);
      return () => target.removeEventListener('keydown', h);
    },
  };
  return api;
}
