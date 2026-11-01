import requests,csv,io,time,sys
out=open('raw.csv','w')
hdr=False
for s in range(1,40001,1000):
    ids=','.join(map(str,range(s,s+1000)))
    for t in range(3):
        try:
            r=requests.post('https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/property/Title,MolecularFormula,ConnectivitySMILES,HeavyAtomCount,Charge,IUPACName/CSV',data={'cid':ids},timeout=90)
            if r.ok: break
        except Exception as e: pass
        time.sleep(3)
    lines=r.text.splitlines()
    out.write('\n'.join(lines if not hdr else lines[1:])+'\n'); hdr=True
    print(s,len(lines),flush=True); time.sleep(0.4)
