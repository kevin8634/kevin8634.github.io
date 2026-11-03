#!/usr/bin/env python3
"""元素工坊 v2.3 自由实验模式 · 查找表生成 + 自检
只用 data/ef.react.json 已收录的 60 条反应 + 对照 x01;不新增任何反应。
输出 data/ef.react.free.json:试剂架 bottles、条件 conds、查找表 keys。
自检:每条收录条目至少一个键可达;键不重复;键里的瓶子都在架上;架上每个瓶子至少出现在一个键里。
"""
import json, os, sys
H = os.path.dirname(os.path.abspath(__file__)); D = os.path.join(H, '..', 'data')
R = json.load(open(os.path.join(D, 'ef.react.json'), encoding='utf-8'))
ROWS = {r['id']: r for r in R['rows']}; ROWS.update({x['id']: x for x in R['contrast']})

# 试剂架:id(化学式键) 名称 显示式 分类 形态 颜色 安全(该物质本身)
# 形态 liquid 溶液/液体 · solid 固体块 · powder 粉末 · metal 金属 · gas 气体(集气瓶)
B = [
 # 单质
 ('C','木炭','C','单质','solid','#1d1d20','y'), ('S','硫粉','S','单质','powder','#e6cf3a','y'), ('P','红磷','P','单质','powder','#a8382a','y'),
 ('Fe','铁(铁丝/铁钉/铁粉)','Fe','单质','metal','#70757c','g'), ('Mg','镁条','Mg','单质','metal','#c7cacf','y'), ('Zn','锌粒','Zn','单质','metal','#a9b0b8','y'),
 ('Cu','铜片','Cu','单质','metal','#b8673a','g'), ('Al','铝片','Al','单质','metal','#cfd3d8','g'), ('Na','金属钠','Na','单质','metal','#d8dbe0','r'),
 ('H2','氢气','H₂','单质','gas','#e8f1f7','y'), ('O2','氧气','O₂','单质','gas','#e8f1f7','y'), ('Cl2','氯气','Cl₂','单质','gas','#c9d94a','r'), ('N2','氮气','N₂','单质','gas','#e8f1f7','y'),
 # 氧化物
 ('H2O','水','H₂O','氧化物','liquid','#cfe6f2','g'), ('H2O2','过氧化氢溶液','H₂O₂','氧化物','liquid','#d9ecf4','y'), ('CO2','二氧化碳','CO₂','氧化物','gas','#e8f1f7','y'),
 ('CO','一氧化碳','CO','氧化物','gas','#e8f1f7','r'), ('CaO','生石灰','CaO','氧化物','solid','#ece8de','y'), ('CuO','氧化铜','CuO','氧化物','powder','#1c1a19','y'),
 ('Fe2O3','氧化铁(铁锈)','Fe₂O₃','氧化物','powder','#8a3a1c','g'), ('MnO2','二氧化锰','MnO₂','氧化物','powder','#2a2622','y'), ('Al2O3','氧化铝','Al₂O₃','氧化物','powder','#f2f1ec','y'),
 ('Na2O2','过氧化钠','Na₂O₂','氧化物','powder','#efe08a','r'),
 # 酸
 ('HCl','稀盐酸','HCl','酸','liquid','#d6eaf2','y'), ('HCl(浓)','浓盐酸','HCl(浓)','酸','liquid','#e2eef2','r'), ('H2SO4(稀)','稀硫酸','H₂SO₄(稀)','酸','liquid','#d6eaf2','y'),
 ('H2SO4(浓)','浓硫酸','H₂SO₄(浓)','酸','liquid','#e9ecea','r'), ('HNO3(稀)','稀硝酸','HNO₃(稀)','酸','liquid','#e4ecef','r'), ('HNO3(浓)','浓硝酸','HNO₃(浓)','酸','liquid','#f1e6aa','r'),
 ('CH3COOH','乙酸(白醋)','CH₃COOH','酸','liquid','#ead9b4','y'),
 # 碱
 ('NaOH','氢氧化钠溶液','NaOH','碱','liquid','#d6eaf2','y'), ('NaOH(s)','氢氧化钠固体','NaOH(固)','碱','solid','#f3f3ef','y'), ('Ca(OH)2','氢氧化钙(熟石灰/石灰水)','Ca(OH)₂','碱','liquid','#dcecf2','y'),
 ('Fe(OH)2','氢氧化亚铁(现制,不能保存)','Fe(OH)₂','碱','powder','#dfe8d2','y'), ('Fe(OH)3','氢氧化铁','Fe(OH)₃','碱','powder','#9a4a1c','y'), ('Al(OH)3','氢氧化铝','Al(OH)₃','碱','powder','#f2f2ee','y'),
 ('Ba(OH)2.8H2O','氢氧化钡晶体','Ba(OH)₂·8H₂O','碱','solid','#f4f4f0','y'), ('NH3','氨气(溶于水显碱性)','NH₃','碱','gas','#e8f1f7','y'),
 # 盐
 ('CaCO3','大理石','CaCO₃','盐','solid','#d9d6cf','g'), ('NaHCO3','小苏打','NaHCO₃','盐','powder','#f6f6f2','g'), ('Na2CO3','碳酸钠溶液','Na₂CO₃','盐','liquid','#d8eaf2','y'),
 ('CuSO4','硫酸铜溶液','CuSO₄','盐','liquid','#2f8fd8','y'), ('AgNO3','硝酸银溶液','AgNO₃','盐','liquid','#d8e8ef','y'), ('NaCl','食盐水','NaCl','盐','liquid','#d8eaf2','g'),
 ('BaCl2','氯化钡溶液','BaCl₂','盐','liquid','#d8e8ef','y'), ('Na2SO4','硫酸钠溶液','Na₂SO₄','盐','liquid','#d8eaf2','y'), ('FeCl3','氯化铁溶液','FeCl₃','盐','liquid','#c9862a','y'),
 ('KSCN','硫氰化钾溶液','KSCN','盐','liquid','#dbe9ef','y'), ('NH4Cl','氯化铵','NH₄Cl','盐','powder','#f4f4f0','y'), ('KMnO4','高锰酸钾','KMnO₄','盐','solid','#5a1f6e','y'),
 ('Na2S2O3','硫代硫酸钠溶液','Na₂S₂O₃','盐','liquid','#d8eaf2','y'),
 # 有机物
 ('CH4','甲烷','CH₄','有机物','gas','#e8f1f7','y'), ('CH3CH2OH','乙醇','C₂H₅OH','有机物','liquid','#e0eef2','y'), ('C12H22O11','蔗糖','C₁₂H₂₂O₁₁','有机物','powder','#f7f5ee','g'),
]
CONDS = [('heat','加热'),('fire','点燃'),('elec','通电'),('cat','催化剂')]   # 全部关闭 = 常温

# 查找键:条目 → [(瓶子集合, 条件集合), ...](可多键:等价的教学表述)
K = {
 'j01':[('C O2','fire')],'j02':[('S O2','fire')],'j03':[('P O2','fire')],'j04':[('Fe O2','fire')],'j05':[('Mg O2','fire')],'j06':[('H2 O2','fire')],'j07':[('CH4 O2','fire')],
 'j08':[('H2O2','cat'),('H2O2 MnO2',''),('H2O2 MnO2','cat')],'j09':[('KMnO4','heat')],'j10':[('H2O','elec')],
 'j11':[('CaCO3 HCl','')],'j12':[('NaHCO3 CH3COOH','')],'j13':[('CO2 Ca(OH)2','')],'j14':[('Zn H2SO4(稀)','')],'j15':[('Fe CuSO4','')],'j16':[('Cu AgNO3','')],
 'j17':[('Fe HCl','')],'j18':[('Fe2O3 HCl','')],'j19':[('NaOH HCl','')],'j20':[('CuSO4 NaOH','')],'j21':[('Na2CO3 Ca(OH)2','')],'j22':[('CaO H2O','')],'j23':[('CuO H2SO4(稀)','')],
 'j24':[('Fe2O3 CO','heat')],'j25':[('C CuO','heat')],'j26':[('CaCO3 CH3COOH','')],'j27':[('Fe O2 H2O','')],'j28':[('AgNO3 NaCl','')],'j29':[('BaCl2 Na2SO4','')],'j30':[('NH4Cl Ca(OH)2','')],
 's01':[('Na H2O','')],'s02':[('Na O2','heat')],'s03':[('Na2O2 H2O','')],'s04':[('NaHCO3','heat')],'s05':[('Na2CO3 HCl','')],'s06':[('NaHCO3 HCl','')],'s07':[('Cl2 H2O','')],
 's08':[('MnO2 HCl(浓)','heat')],'s09':[('Fe Cl2','fire')],'s10':[('FeCl3 Cu','')],'s11':[('FeCl3 Fe','')],'s12':[('FeCl3 KSCN','')],'s13':[('FeCl3 NaOH','')],
 's14':[('Fe(OH)2 O2 H2O',''),('Fe(OH)2 O2','')],'s15':[('Fe(OH)3','heat')],'s16':[('Al NaOH',''),('Al NaOH H2O','')],'s17':[('Al2O3 HCl','')],'s18':[('Al(OH)3 NaOH','')],'s19':[('Mg HCl','')],
 's20':[('Ba(OH)2.8H2O NH4Cl','')],'s21':[('Zn Cu H2SO4(稀)','')],'s22':[('Na2S2O3 H2SO4(稀)','')],'s23':[('N2 H2','heat cat')],'s24':[('Cu HNO3(浓)','')],'s25':[('Cu HNO3(稀)','')],
 's26':[('Cu H2SO4(浓)','heat')],'s27':[('C12H22O11 H2SO4(浓)','')],'s28':[('NH3 HCl(浓)','')],'s29':[('CH3CH2OH O2','heat cat'),('CH3CH2OH O2 Cu','heat'),('CH3CH2OH O2 Cu','cat heat')],
 's30':[('CH3COOH CH3CH2OH H2SO4(浓)','heat')],
 'x01':[('NaOH(s) H2O','')],
}
CTXT = {'':'常温','heat':'加热','fire':'点燃','elec':'通电','cat':'催化剂','cat heat':'加热 + 催化剂'}

def main():
    bad = []; ids = {b[0] for b in B}; seen = {}; used = set()
    if len(ids) != len(B): bad.append('瓶子 id 重复')
    for rid in list(ROWS):
        if rid not in K and rid in ('x02', 'x03'): continue   # x02 硝酸铵属国家严格管控的化学品、x03 非混合实验:不上架
        if rid not in K: bad.append('条目不可达 ' + rid)
    keys = []
    for rid, lst in K.items():
        if rid not in ROWS: bad.append('未收录条目 ' + rid); continue
        for bs, cs in lst:
            bl = sorted(bs.split()); cl = sorted(cs.split())
            for x in bl:
                if x not in ids: bad.append(rid + ' 瓶子不在架上 ' + x)
                used.add(x)
            k = '+'.join(bl) + '|' + '+'.join(cl)
            if k in seen: bad.append('键重复 ' + k + ' ' + seen[k] + '/' + rid)
            seen[k] = rid; keys.append({'k': k, 'id': rid})
    for b in B:
        if b[0] not in used: bad.append('瓶子未用到 ' + b[0])
    out = {'meta': {'id': 'ef.react.free', 'title': '元素工坊 v2.3 自由实验模式 · 查找表', 'source': 'data/ef.react.json(只用已收录条目)',
                    'rule': '所选瓶子集合与条件集合同时完全相等才算命中;未命中一律「暂无可靠记录」,不推断、不生成', 'license': 'CC BY 4.0(创世计划自写内容)',
                    'safety': R['meta']['safety']},
           'bottles': [dict(id=b[0], n=b[1], f=b[2], cat=b[3], form=b[4], c=b[5], safe=b[6]) for b in B],
           'conds': [dict(id=a, n=n) for a, n in CONDS], 'ctext': CTXT, 'keys': keys}
    json.dump(out, open(os.path.join(D, 'ef.react.free.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    print('瓶子', len(B), '键', len(keys), '条目', len(K), '问题', len(bad)); [print(' -', x) for x in bad]
    return 1 if bad else 0
sys.exit(main())
