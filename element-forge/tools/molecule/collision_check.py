import csv
from rdkit import Chem,RDLogger;RDLogger.DisableLog('rdApp.*')
import importlib,sys
sys.argv=['x']
src=open('build.py').read().split('out={};core=[]')[0]; exec(src)
seen={};c=0;n=0
for r in csv.DictReader(open('raw.csv')):
    if not r['CID'].isdigit() or not r['HeavyAtomCount'] or int(r['HeavyAtomCount'])>12 or r['Charge']!='0' or '.' in r['ConnectivitySMILES']: continue
    m=Chem.MolFromSmiles(r['ConnectivitySMILES'])
    if m is None: continue
    k=key(m)
    if not k: continue
    s=Chem.MolToSmiles(m); n+=1
    if k in seen and seen[k]!=s: c+=1; 
    if c and c<6 and k in seen and seen[k]!=s: print(seen[k],s)
    seen.setdefault(k,s)
print('pool',n,'collisions',c)
