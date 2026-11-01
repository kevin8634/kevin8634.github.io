"""元素工坊 分子库构建校验:python3 molecule_check.py(在本目录运行,读 ../../data/ef.molecule.json)
检查:剔除清单 CID 不得复现;键唯一(无碰撞);核心条目字段齐全且危险条目有风险说明;自动条目无用途字段;来源声明存在。"""
import json,sys
d=json.load(open('../../data/ef.molecule.json'));bad=[]
B={int(x) for x in open('blocklist_cids.txt') if x.strip().isdigit()}
bad+=['blocklist CID %d 复现'%r[3] for r in d['db'] if r[3] in B]
ks=[c['k'] for c in d['core'] if c['k']]+[r[0] for r in d['db']]
if len(ks)!=len(set(ks)): bad.append('规范哈希碰撞 %d'%(len(ks)-len(set(ks))))
for c in d['core']:
    if not (c['zh'] and c['f'] and c['u'] and c['s'] in 'gyr'): bad.append('核心字段缺失 '+c['zh'])
    if c['s'] in 'yr' and not c['w']: bad.append('危险条目缺风险说明 '+c['zh'])
bad+=['自动条目字段异常 %s'%r for r in d['db'] if len(r)!=4]
if 'PubChem' not in d.get('src',''): bad.append('缺来源声明')
print('OK core=%d db=%d'%(len(d['core']),len(d['db'])) if not bad else '\n'.join(bad)); sys.exit(1 if bad else 0)
