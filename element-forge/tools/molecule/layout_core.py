# v2.3:为核心库(b=True)生成 2D 显式氢布局 m=[atoms[[e,x,y]], bonds[[a,b,o]]],供反应台「去搭建台看结构」只读跳转
import json, os, subprocess, sys
from rdkit import Chem
from rdkit.Chem import AllChem
P = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'data', 'ef.molecule.json')
d = json.load(open(P, encoding='utf-8'))
for c in d['core']:
    c.pop('m', None)
    if not c['b']: continue
    m = Chem.AddHs(Chem.MolFromSmiles(c['smi'])); AllChem.Compute2DCoords(m)
    cf = m.GetConformer(); xs = [cf.GetAtomPosition(i) for i in range(m.GetNumAtoms())]
    cx = sum(p.x for p in xs) / len(xs); cy = sum(p.y for p in xs) / len(xs)
    at = [[a.GetSymbol(), round((xs[i].x - cx) * 46), round(-(xs[i].y - cy) * 46)] for i, a in enumerate(m.GetAtoms())]
    bd = [[b.GetBeginAtomIdx(), b.GetEndAtomIdx(), int(b.GetBondTypeAsDouble())] for b in m.GetBonds()]
    c['m'] = [at, bd]
T = [dict(k=c['k'], atoms=[dict(e=a[0], x=a[1], y=a[2]) for a in c['m'][0]], bonds=[dict(a=b[0], b=b[1], o=b[2]) for b in c['m'][1]]) for c in d['core'] if c.get('m')]
r = subprocess.run(['node', '-e', "const M=require(process.argv[1]);const T=JSON.parse(require('fs').readFileSync(0));let b=T.filter(t=>M.key(t)!==t.k).map(t=>t.k);console.log(JSON.stringify(b))", os.path.join(os.path.dirname(P), '..', 'ef-molcore.js')], input=json.dumps(T), capture_output=True, text=True)
bad = json.loads(r.stdout or '["node-fail"]')
json.dump(d, open(P, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print('layout', len(T), 'key mismatch', bad); sys.exit(1 if bad else 0)
