import re
import csv,json,sys
from rdkit import Chem, RDLogger
RDLogger.DisableLog('rdApp.*')
from core import CORE,BP,PAIRS
VAL={'H':1,'C':4,'N':3,'O':2,'S':2,'F':1,'Cl':1,'Br':1}
def fnv(s):
    h=0x811c9dc5
    for b in s.encode():
        h^=b; h=(h*0x01000193)&0xffffffff
    return h
def key(m):
    m=Chem.RemoveHs(m)
    lab=[]
    for a in m.GetAtoms():
        if a.GetFormalCharge()!=0 or a.GetNumRadicalElectrons() or a.GetIsotope(): return None
        e=a.GetSymbol()
        if e not in VAL: return None
        h=a.GetTotalNumHs()
        if a.GetDegree()+0>0: pass
        bo=sum(int(round(b.GetBondTypeAsDouble())) if not b.GetIsAromatic() else 0 for b in a.GetBonds())
        # 芳香键:用总化合价反推
        if VAL[e]!=a.GetTotalValence(): return None
        lab.append('%s%d,%d'%(e,h,a.GetDegree()))
    n=len(lab)
    nb=[[x.GetIdx() for x in a.GetNeighbors()] for a in m.GetAtoms()]
    dist=Chem.GetDistanceMatrix(m)
    sym=[a.GetSymbol() for a in m.GetAtoms()]
    cur=[fnv(lab[i]+'/'+','.join(sorted('%d%s'%(int(dist[i][j]),sym[j]) for j in range(n) if j!=i))) for i in range(n)]
    for _ in range(n):
        cur=[fnv('%d|'%cur[i]+'.'.join(map(str,sorted(cur[j] for j in nb[i])))) for i in range(n)]
    return '%08x'%fnv(formula(m)+'#'+'.'.join(map(str,sorted(cur))))
from rdkit.Chem.rdMolDescriptors import CalcMolFormula as formula
BLOCKNAME=['amphetamine','cathinone','hydroxybutanoic','butyrolactone','phenylacetone','phenyl-2-propanone','ephedrine','safrole','piperonal','cyanogen','mustard','sarin','lewisite','phenethylamine','methylenedioxy','nitroglycer','hexogen','lysergic']
BLOCKSMA=[Chem.MolFromSmarts(s) for s in ['ClCCSCCCl','ClCCNCCCl','ClCCSCC','OO','c1ccccc1CC(C)N','c1ccccc1CC(=O)C','ClC#N','BrC#N']]
BLOCKNAME+=['safrol','anthranil','phenylacet','ethchlorvynol','ethinamate','propylhexedrine','thiodiglycol','pinacolyl','diisopropylamino','hexamethylenetetramine','pentaerythritol','hydrazin','phosgene','fluoroacet','nitrite','cyanohydrin','benzodioxol']
BLOCKSMA+=[Chem.MolFromSmarts(s) for s in ['FCC(=O)','ClC(=O)Cl','ClC(=O)OC(Cl)(Cl)Cl','[NX3][NX3]','[O][N]=O','c1cc2OCOc2cc1','ClCC[NX3]','[OH]CC[NX3](CCO)','N#CC(C)(C)O']]
BLOCKCID={int(x) for x in open('blocklist_cids.txt') if x.strip().isdigit()}
def blocked(m,name):
    nl=name.lower()
    if any(b in nl for b in BLOCKNAME): return True
    return any(m.HasSubstructMatch(p) for p in BLOCKSMA)
out={};core=[]
for zh,smi,use,s,why in CORE:
    m=Chem.MolFromSmiles(smi); k=key(m)
    core.append(dict(k=k,zh=zh,f=formula(m),u=use,s=s,w=why,bp=BP.get(smi),b=k is not None,smi=Chem.MolToSmiles(m)))
    if k: out[k]=None
seen=set(out); auto=[]
for r in csv.DictReader(open('raw.csv')):
    try:
        if not r['CID'].isdigit() or not r['HeavyAtomCount'] or int(r['HeavyAtomCount'])>12 or r['Charge']!='0': continue
        smi=r['ConnectivitySMILES']
        if '.' in smi: continue
        m=Chem.MolFromSmiles(smi)
        if m is None or m.GetNumHeavyAtoms()<1: continue
        k=key(m)
        if not k or k in seen or int(r['CID']) in BLOCKCID or blocked(m,r['Title']+' '+r['IUPACName']): continue
        if re.match(r'(CID |GlyTouCan|Npc|SCHEMBL|NSC|DTXSID|CHEMBL)',r['Title']) or 'mg/ml' in r['Title'].lower() or r['Title'].count('(')!=r['Title'].count(')'): continue
        if not re.search('[A-Za-z]{3}',r['Title']) or re.fullmatch(r'[A-Z0-9\-]+',r['Title']): continue
        seen.add(k); auto.append([k,r['Title'][:60],formula(m),int(r['CID'])])
        if len(auto)>=3000: break
    except Exception as e: pass
json.dump(dict(v=1,src='NCBI PubChem (public domain); core zh names/uses hand-written',core=core,pairs=[[key(Chem.MolFromSmiles(a)),key(Chem.MolFromSmiles(b))] for a,b in PAIRS],db=auto),open('ef.molecule.json','w'),ensure_ascii=False,separators=(',',':'))
print(len(core),sum(c['b'] for c in core),len(auto),auto[-1][3])
