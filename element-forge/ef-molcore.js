/* 元素工坊 Element Forge · 分子搭建台核心 ef-molcore.js v2.4(v2.4 加 chiral():手性碳判定)
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
  /* v2.4 手性碳(立体中心)判定:碳原子连 4 个原子且全是单键,并且 4 个"基团"两两不同。
     做法:以该碳为标记点,在全图(含 H)上做邻居精炼(元素 + 键级),4 个邻居的最终标签两两不同 → 手性碳。
     与 RDKit FindMolChiralCenters(includeUnassigned) 对拍见 tools/molecule/chiral_check.py。
     只判"构造上的"手性中心;不处理赝手性、内消旋整体判断、轴手性等(本台示意口径)。 */
  function nbrs(mol) {
    var nb = mol.atoms.map(function () { return []; });
    mol.bonds.forEach(function (b) { nb[b.a].push([b.b, b.o]); nb[b.b].push([b.a, b.o]); });
    return nb;
  }
  function isChiral(mol, c, nb) {
    nb = nb || nbrs(mol);
    var A = mol.atoms[c]; if (!A || A.e !== 'C' || nb[c].length !== 4) return false;
    if (nb[c].some(function (x) { return x[1] !== 1; })) return false;
    var n = mol.atoms.length, cur = mol.atoms.map(function (a, i) { return fnv(a.e + (i === c ? '*' : '')); });
    for (var r = 0; r < n; r++) {
      var nx = cur.map(function (v, i) { return fnv(v + '|' + nb[i].map(function (x) { return cur[x[0]] + ':' + x[1]; }).sort().join('.')); });
      cur = nx;
    }
    var L = nb[c].map(function (x) { return cur[x[0]]; });
    for (var i = 0; i < 4; i++) for (var j = i + 1; j < 4; j++) if (L[i] === L[j]) return false;
    return true;
  }
  function chiral(mol) { var nb = nbrs(mol), out = []; for (var i = 0; i < mol.atoms.length; i++) if (isChiral(mol, i, nb)) out.push(i); return out; }
  /* 某个手性碳的 4 个基团"等级标签"(用于镜子视图给基团编号;同一分子内可比较) */
  function groups(mol, c) {
    var nb = nbrs(mol), n = mol.atoms.length, cur = mol.atoms.map(function (a, i) { return fnv(a.e + (i === c ? '*' : '')); });
    for (var r = 0; r < n; r++) cur = cur.map(function (v, i) { return fnv(v + '|' + nb[i].map(function (x) { return cur[x[0]] + ':' + x[1]; }).sort().join('.')); });
    return nb[c].map(function (x) { return { i: x[0], lab: cur[x[0]] }; });
  }
  G.EFM = { VAL: VAL, fnv: fnv, used: used, free: free, formula: formula, status: status, key: key, components: components, chiral: chiral, isChiral: isChiral, groups: groups };
  if (typeof module !== 'undefined') module.exports = G.EFM;
})(typeof window !== 'undefined' ? window : globalThis);
