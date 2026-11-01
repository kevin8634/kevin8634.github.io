/* 元素工坊 Element Forge · 分子搭建台核心 ef-molcore.js v2.2
   纯函数:分子图(原子 + 键)、化合价插槽、Hill 分子式、规范哈希(与 tools/molecule_build.py 同算法)。
   规范哈希:重原子图;初始标签 = 元素 + 氢数 + 重原子度 + 到其他原子的(距离,元素)多重集;
   再做 n 轮邻居精炼(FNV-1a 32 位);最终 = FNV(分子式 # 排序后标签)。不依赖 RDKit。 */
(function (G) {
  'use strict';
  var VAL = { H: 1, C: 4, N: 3, O: 2, S: 2, F: 1, Cl: 1, Br: 1 };
  function fnv(s) { var h = 0x811c9dc5; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i) & 255; h = Math.imul(h, 0x01000193) >>> 0; } return h >>> 0; }
  function hex8(h) { var s = h.toString(16); return '00000000'.slice(s.length) + s; }
  /* mol = { atoms:[{e}], bonds:[{a,b,o}] } */
  function used(mol, i) { var u = 0; mol.bonds.forEach(function (b) { if (b.a === i || b.b === i) u += b.o; }); return u; }
  function free(mol, i) { return VAL[mol.atoms[i].e] - used(mol, i); }
  function formula(mol) {
    var c = {}; mol.atoms.forEach(function (a) { c[a.e] = (c[a.e] || 0) + 1; });
    var ks = Object.keys(c).sort(), ord = [];
    if (c.C) { ord.push('C'); if (c.H) ord.push('H'); ks.forEach(function (k) { if (k !== 'C' && k !== 'H') ord.push(k); }); } else { if (c.H) ord.push('H'); ks.forEach(function (k) { if (k !== 'H') ord.push(k); }); }
    return ord.map(function (k) { return k + (c[k] > 1 ? c[k] : ''); }).join('');
  }
  function components(mol) {
    var n = mol.atoms.length, p = []; for (var i = 0; i < n; i++) p.push(i);
    function f(x) { while (p[x] !== x) x = p[x] = p[p[x]]; return x; }
    mol.bonds.forEach(function (b) { p[f(b.a)] = f(b.b); });
    var s = {}; for (i = 0; i < n; i++) s[f(i)] = 1; return Object.keys(s).length;
  }
  /* 状态:empty / open(还有空插槽)/ split(不连通)/ ok(插满且连通) */
  function status(mol) {
    if (!mol.atoms.length) return 'empty';
    for (var i = 0; i < mol.atoms.length; i++) if (free(mol, i) !== 0) return 'open';
    return components(mol) > 1 ? 'split' : 'ok';
  }
  function key(mol) {
    var all = mol.atoms.map(function (a, i) { return i; });
    var heavy = all.filter(function (i) { return mol.atoms[i].e !== 'H'; });
    if (!heavy.length) heavy = all;               /* H₂:只有氢 */
    var idx = {}; heavy.forEach(function (g, k) { idx[g] = k; });
    var n = heavy.length, nb = heavy.map(function () { return []; }), hc = heavy.map(function () { return 0; });
    mol.bonds.forEach(function (b) {
      var A = idx[b.a], B = idx[b.b];
      if (A !== undefined && B !== undefined) { nb[A].push(B); nb[B].push(A); }
      else if (A !== undefined) hc[A]++; else if (B !== undefined) hc[B]++;
    });
    var sym = heavy.map(function (g) { return mol.atoms[g].e; });
    /* BFS 距离 */
    var dist = heavy.map(function (_, s) {
      var d = heavy.map(function () { return -1; }), q = [s]; d[s] = 0;
      while (q.length) { var x = q.shift(); nb[x].forEach(function (y) { if (d[y] < 0) { d[y] = d[x] + 1; q.push(y); } }); }
      return d;
    });
    var cur = heavy.map(function (_, i) {
      var prof = []; for (var j = 0; j < n; j++) if (j !== i) prof.push(dist[i][j] + sym[j]);
      prof.sort();
      return fnv(sym[i] + hc[i] + ',' + nb[i].length + '/' + prof.join(','));
    });
    for (var r = 0; r < n; r++) {
      cur = cur.map(function (c, i) {
        var s = nb[i].map(function (j) { return cur[j]; }).sort(function (a, b) { return a - b; });
        return fnv(c + '|' + s.join('.'));
      });
    }
    var fin = cur.slice().sort(function (a, b) { return a - b; });
    return hex8(fnv(formula(mol) + '#' + fin.join('.')));
  }
  G.EFM = { VAL: VAL, fnv: fnv, used: used, free: free, formula: formula, status: status, key: key, components: components };
  if (typeof module !== 'undefined') module.exports = G.EFM;
})(typeof window !== 'undefined' ? window : globalThis);
