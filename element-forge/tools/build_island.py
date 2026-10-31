# 元素工坊 2.0 · 超重元素岛数据构建与复算(只用 IAEA NDS 快照 nuclides.json)
import json, math, hashlib, statistics as st, os, sys
SRC=sys.argv[1]; OUT=sys.argv[2]; os.makedirs(OUT,exist_ok=True)
raw=open(SRC,'rb').read(); sha=hashlib.sha256(raw).hexdigest(); J=json.loads(raw)
rows=J['d']; SYM=J['sym']
META=dict(source="IAEA Nuclear Data Services Live Chart of Nuclides(AME2020/NUBASE2020/ENSDF),由创世计划深空层快照 deep/data/nuclides.json(取于 2026-10-30)导出",
  url="https://www-nds.iaea.org/relnsd/vcharthtml/VChartHTML.html", license="IAEA 公开核数据,按 IAEA NDS 署名", retrieved="2026-10-30", ai_generated=False)
av,as_,ac,aa,ap=15.75,17.8,0.711,23.7,11.18
def semf(Z,N):
    A=Z+N; d=ap/math.sqrt(A)*((Z%2==0 and N%2==0)-(Z%2==1 and N%2==1))
    return av*A-as_*A**(2/3)-ac*Z*(Z-1)/A**(1/3)-aa*(A-2*Z)**2/A+d
def w(name,meta,cols,rs):
    o=dict(meta=dict(META,**meta),columns=cols,rows=rs); open(f'{OUT}/{name}.json','w').write(json.dumps(o,ensure_ascii=False,separators=(',',':')))
# 1 锡同位素链
sn=sorted([r for r in rows if r[0]==50],key=lambda r:r[1])
w('ef.island.sn',dict(id='ef.island.sn',title='锡(Z=50)同位素链:每核子结合能',unit='MeV',note='Z=50 全部已知同位素;stable=1 为稳定核素'),['N','ba','stable'],[[r[1],r[2],1 if r[3]==99 else 0] for r in sn])
print('Sn isotopes',len(sn),'stable',sum(r[3]==99 for r in sn))
# 2 幻数残差:五项液滴模型对 A>=16 全部已知核素最小二乘拟合,残差按 N 平均
import numpy as np
R=[r for r in rows if r[0]+r[1]>=16 and r[2]>0]
X=np.array([[Z+N,-(Z+N)**(2/3),-Z*(Z-1)/(Z+N)**(1/3),-(N-Z)**2/(Z+N),((Z%2==0 and N%2==0)-(Z%2==1 and N%2==1))/math.sqrt(Z+N)] for Z,N,b,l in R]); Y=np.array([b*(Z+N) for Z,N,b,l in R])
cf,*_=np.linalg.lstsq(X,Y,rcond=None); res=Y-X@cf
byN={}
for (Z,N,b,l),q in zip(R,res): byN.setdefault(N,[]).append(q)
mg=[[N,round(float(np.mean(v)),3)] for N,v in sorted(byN.items()) if len(v)>=3]
cft=', '.join(f'{k} {v:.3f}' for k,v in zip(['aV','aS','aC','aA','aP'],cf))
w('ef.island.shell',dict(id='ef.island.shell',title='实测结合能 − 液滴模型(按中子数 N 平均)',unit='MeV',note=f'res=同一 N 的已知核素(A≥16,{len(R)} 个)实测总结合能减五项液滴模型最小二乘拟合值({cft} MeV;rms {float(np.sqrt((res**2).mean())):.2f} MeV)后的平均;为计算值,非直接观测'),['N','res'],mg)
print('fit',cft)
# 3 超重:每个 Z 最长已知半衰期
sh={}
for Z,N,ba,lt in rows:
    if Z>=100 and lt not in (99,-99): 
        if Z not in sh or lt>sh[Z][1]: sh[Z]=(N,lt)
e=[[Z,sh[Z][1],sh[Z][0]] for Z in sorted(sh)]+[[Z,'未合成',''] for Z in range(119,127)]
w('ef.island.edge',dict(id='ef.island.edge',title='Z≥100 每种元素已知最长寿同位素的半衰期',unit='log10(秒)',note='best=该元素已知半衰期最长的同位素 log10(T½/秒);bestN 为其中子数;119–126 号尚未合成,记为「未合成」;超重区不少同位素只观测到几个原子,半衰期不确定度大'),['Z','best','bestN'],e)
for r in e: print(SYM.get(str(r[0]),'?'),r)
# 4 3D 地形:紧凑数组 [Z,N,B/A,log10T]
w('ef.island.chart',dict(id='ef.island.chart',title='核素图(3D 地形用)',unit='MeV / log10(秒)',note='字段 Z,N,B/A,log10 半衰期秒(99 稳定,-99 未知)'),['Z','N','ba','lt'],rows)
open(f'{OUT}/SHA256.txt','w').write(f'deep/data/nuclides.json sha256 {sha}\n')
print('sha',sha)
