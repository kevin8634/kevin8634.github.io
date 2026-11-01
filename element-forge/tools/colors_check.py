"""v2.2 颜色表一致性:data/ef.colors.json 与 ef-pbr.js COL、ef.js EF.GUIDES 同值。"""
import json,re,sys,os
d=os.path.dirname(os.path.abspath(__file__))+'/..'
j=json.load(open(d+'/data/ef.colors.json',encoding='utf-8'))
pbr=open(d+'/ef-pbr.js',encoding='utf-8').read(); efjs=open(d+'/ef.js',encoding='utf-8').read()
bad=0
for k,v in j['guides'].items():
    if f"{k}: '{v}'" not in pbr: print('pbr guides 不一致',k,v); bad+=1
    m=re.search(k+r": \{[^}]*c: '(#[0-9a-f]+)'",efjs)
    if not m or m.group(1)!=v: print('ef.js GUIDES 不一致',k,v,m and m.group(1)); bad+=1
for k,v in j['decor'].items():
    if f"{k}: '{v}'" not in pbr: print('pbr decor 不一致',k,v); bad+=1
print('OK' if not bad else f'{bad} 处不一致'); sys.exit(1 if bad else 0)
