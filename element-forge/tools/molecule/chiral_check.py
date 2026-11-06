"""v2.4 手性碳判定对拍:ef-molcore.js chiral() vs RDKit FindMolChiralCenters(includeUnassigned=True,默认旧版 CIP 口径)。
样本:离线核心库 79 条(data/ef.molecule.json core[].smi)+ 手写 40 条 + 随机生成 3000 条(C/N/O/Cl/Br/F,含环)。
用法:python3 tools/molecule/chiral_check.py(需 rdkit、node)"""
import json, random, subprocess, os, sys
LEG = '--new' not in sys.argv  # 默认用 RDKit 旧版(按 CIP 序判断四基团是否两两不同,最接近教材定义);--new 用新版(含环顺反/赝手性立体中心)
from rdkit import Chem
from rdkit import RDLogger; RDLogger.DisableLog('rdApp.*')
HERE = os.path.dirname(os.path.abspath(__file__)); EF = os.path.abspath(os.path.join(HERE, '..', '..'))
core = json.load(open(os.path.join(EF, 'data', 'ef.molecule.json')))['core']
hand = ['CC(O)C(=O)O', 'CC(N)C(=O)O', 'CC1=CCC(CC1=O)C(C)=C', 'OCC(O)C=O', 'CCC(C)O', 'CC(O)CC', 'CC(Cl)Br', 'FC(Cl)(Br)C', 'OC1CCCCC1C', 'CC1CCCCC1', 'CC1CCC(C)CC1', 'CC(C)C', 'CC(O)C', 'OCC(O)CO', 'NCC(O)=O', 'CCC(C)CC', 'CCC(C)CCC', 'CCC(C)C(C)CC', 'OC(CO)C(O)C(O)C(O)C=O', 'C1CC1C', 'CC1CC1C', 'ClC1CCCC1Cl', 'CC(C)(O)CC', 'CCOC(C)Cl', 'C[C@H](O)CC', 'NC(CS)C(O)=O', 'CC(C)CC(N)C(O)=O', 'CCC(C)C(N)C(O)=O', 'OC(=O)CC(O)(CC(O)=O)C(O)=O', 'CC(O)C(O)C', 'OC(C(O)C(O)=O)C(O)=O', 'BrC(Cl)F', 'CC(F)(Cl)Br', 'CCCC(C)(C)O', 'OC1CC(O)CC(O)C1', 'C1CCC2CCCCC2C1', 'CC(N)CC', 'CN(C)C', 'CC(=O)C(C)O', 'CC=C(C)C']
random.seed(24)
def rnd():
    n = random.randint(3, 9); els = []; bonds = []
    for i in range(n):
        els.append(random.choice('CCCCCNOO' + ('Cl' if False else '')))
    for i in range(1, n): bonds.append((random.randrange(i), i))
    if random.random() < .35 and n > 4:
        a, b = random.sample(range(n), 2)
        if a != b and (a, b) not in bonds and (b, a) not in bonds: bonds.append((a, b))
    m = Chem.RWMol()
    for e in els: m.AddAtom(Chem.Atom(e))
    for a, b in bonds: m.AddBond(a, b, Chem.BondType.SINGLE)
    for i in range(n):  # 随机卤素取代
        if random.random() < .12 and els[i] == 'C':
            j = m.AddAtom(Chem.Atom(random.choice(['Cl', 'Br', 'F']))); m.AddBond(i, j, Chem.BondType.SINGLE)
    try:
        mm = m.GetMol(); Chem.SanitizeMol(mm); return Chem.MolToSmiles(mm)
    except Exception: return None
rs = set()
while len(rs) < 3000:
    s = rnd()
    if s: rs.add(s)
smis = [c['smi'] for c in core if c.get('smi')] + hand + sorted(rs)
cases = []; ref = []
for s in smis:
    m = Chem.MolFromSmiles(s)
    if m is None: continue
    m = Chem.AddHs(m); Chem.RemoveStereochemistry(m)
    atoms = [a.GetSymbol() for a in m.GetAtoms()]
    bonds = [[b.GetBeginAtomIdx(), b.GetEndAtomIdx(), {1.0: 1, 2.0: 2, 3.0: 3}.get(b.GetBondTypeAsDouble(), 0)] for b in m.GetBonds()]
    if any(b[2] == 0 for b in bonds): continue
    cc = Chem.FindMolChiralCenters(m, includeUnassigned=True, useLegacyImplementation=LEG)
    r = sorted(i for i, _ in cc if atoms[i] == 'C')
    cases.append({'s': s, 'atoms': atoms, 'bonds': bonds}); ref.append(r)
js = "const M=require(%r);const C=JSON.parse(require('fs').readFileSync(0,'utf8'));console.log(JSON.stringify(C.map(c=>M.chiral({atoms:c.atoms.map(e=>({e})),bonds:c.bonds.map(b=>({a:b[0],b:b[1],o:b[2]}))}))));" % os.path.join(EF, 'ef-molcore.js')
out = json.loads(subprocess.run(['node', '-e', js], input=json.dumps(cases), capture_output=True, text=True).stdout)
bad = [(c['s'], r, o) for c, r, o in zip(cases, ref, out) if sorted(o) != r]
nch = sum(1 for r in ref if r)
print('样本 %d(含手性 %d),不一致 %d' % (len(cases), nch, len(bad)))
for b in bad[:30]: print('  ', b)
if not LEG: print('  注:新版把环上顺反立体中心、赝手性中心也算作立体中心;教材「连 4 个不同基团」口径不算手性碳,差异属口径不同。')
sys.exit(1 if (bad and LEG) else 0)
