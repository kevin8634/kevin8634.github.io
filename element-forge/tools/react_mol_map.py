# v2.3/v2.5(含选必3 有机结构简式):反应台物种化学式 → 分子搭建台核心库(有 2D 布局的)映射,写 data/ef.react.mol.json
import json, os, re
H = os.path.dirname(os.path.abspath(__file__)); DD = os.path.join(H, '..', 'data')
src = open(os.path.join(H, 'react_check.py'), encoding='utf-8').read()
exec('import re\nfrom collections import Counter\ndef parse' + src.split('def parse')[1].split('def side')[0])
rows = json.load(open(os.path.join(DD, 'ef.react.json'), encoding='utf-8'))['rows'] + json.load(open(os.path.join(DD, 'ef.react.more.json'), encoding='utf-8'))['rows']
core = json.load(open(os.path.join(DD, 'ef.molecule.json'), encoding='utf-8'))['core']
def f2(c):
    if 'C' in c: o = ['C'] + (['H'] if 'H' in c else [])
    else: o = ['H'] if 'H' in c else []
    return ''.join(k + (str(c[k]) if c[k] > 1 else '') for k in o + sorted(k for k in c if k not in o))
by = {}
for c in core:
    if c.get('m'): by.setdefault(c['f'], []).append([c['k'], c['zh']])
PICK = {'C2H5OH': '乙醇', 'CH3CH2OH': '乙醇', 'C2H5ONa': None, 'CH3CH(OH)CH3': '异丙醇', 'CH2=CHCH3': '丙烯', 'C6H12': '环己烷', 'CH2OH(CHOH)4CHO': '葡萄糖'}
out = {}
for r in rows:
    for x in r['l'] + r['r']:
        f = x[1]
        if '^' in f or '.' in f or f in out or ']n' in f or ')n' in f: continue
        try: t, _ = parse(f)
        except Exception: continue
        c = by.get(f2(dict(t)))
        if not c: continue
        if f in PICK: c = [y for y in c if y[1] == PICK[f]]
        if c: out[f] = c
json.dump(out, open(os.path.join(DD, 'ef.react.mol.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print(len(out), sorted(out))
