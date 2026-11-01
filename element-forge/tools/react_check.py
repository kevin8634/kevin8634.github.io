# 元素工坊 v2.1/v2.3(含 ef.react.more.json) · 反应台数据校验:原子守恒、电荷守恒(离子方程式)、字段完整、安全红线(🔴 无步骤/用量字样)
import json, os, re, sys
from collections import Counter
H = os.path.dirname(os.path.abspath(__file__))
D = json.load(open(os.path.join(H, '..', 'data', 'ef.react.json'), encoding='utf-8'))
_M = os.path.join(H, '..', 'data', 'ef.react.more.json')
MORE = json.load(open(_M, encoding='utf-8'))['rows'] if os.path.exists(_M) else []
BASE = len(D['rows']); D['rows'] = D['rows'] + MORE
def parse(f):
    f = re.sub(r'\((浓|稀)\)', '', f)
    m = re.match(r'^(.*?)(?:\^(\d*)([+-]))?$', f); body, n, s = m.group(1), m.group(2), m.group(3)
    q = (int(n) if n else 1) * (1 if s == '+' else -1) if s else 0
    tot = Counter()
    for part in body.split('.'):
        k = 1; mm = re.match(r'^(\d+)(.*)$', part)
        if mm: k, part = int(mm.group(1)), mm.group(2)
        c = group(part.replace('[', '(').replace(']', ')'))
        for e, v in c.items(): tot[e] += v * k
    return tot, q
def group(s):
    st = [Counter()]; i = 0
    while i < len(s):
        ch = s[i]
        if ch == '(':
            st.append(Counter()); i += 1
        elif ch == ')':
            i += 1; m = re.match(r'\d+', s[i:]); k = int(m.group()) if m else 1; i += len(m.group()) if m else 0
            top = st.pop()
            for e, v in top.items(): st[-1][e] += v * k
        else:
            m = re.match(r'([A-Z][a-z]?)(\d*)', s[i:])
            if not m: raise ValueError('bad formula ' + s)
            st[-1][m.group(1)] += int(m.group(2) or 1); i += len(m.group())
    return st[0]
def side(sp):
    a, q = Counter(), 0
    for x in sp:
        c, f = x[0], x[1]; t, z = parse(f)
        for e, v in t.items(): a[e] += v * c
        q += z * c
    return a, q
bad = []
NEED = ['id', 'lv', 'name', 'l', 'r', 'cond', 'obs', 'see', 'safe', 'why', 'ch', 'ev', 'viz']
BAN = re.compile(r'(\d+\s*(mL|毫升|g\b|克|mol|%|滴|勺))|步骤|用量|配比|购买|网购|淘宝|自制')
for r in D['rows']:
    for k in NEED:
        if k not in r or r[k] in (None, ''):
            if k not in ('cond',): bad.append((r['id'], '缺字段 ' + k))
    a, qa = side(r['l']); b, qb = side(r['r'])
    if a != b: bad.append((r['id'], '原子不守恒', dict(a), dict(b)))
    if r.get('ion'):
        a, qa = side(r['ion'][0]); b, qb = side(r['ion'][1])
        if a != b: bad.append((r['id'], '离子式原子不守恒', dict(a), dict(b)))
        if qa != qb: bad.append((r['id'], '离子式电荷不守恒', qa, qb))
    if r['safe'] not in 'gyr': bad.append((r['id'], '安全等级非法'))
    txt = ' '.join(str(r.get(k, '')) for k in ('see', 'why', 'cond', 'note', 'name'))
    if BAN.search(txt): bad.append((r['id'], '含用量/步骤/渠道字样', BAN.search(txt).group()))
    if r['safe'] == 'r' and '只限专业实验室' not in r['why']: bad.append((r['id'], '🔴 缺「只限专业实验室」'))
    for x in r['r']:
        if x[3:] and x[3] == 'up' and any(y[2:3] == ['g'] for y in r['l'] if len(y) > 2): bad.append((r['id'], '反应物有气体却标↑'))
_all = [r['id'] for r in D['rows']]
if len(_all) != len(set(_all)): bad.append(('id 重复', [x for x in _all if _all.count(x) > 1]))
ids = {r['id'] for r in D['rows']} | {x['id'] for x in D['contrast']}
for m in D['mix']:
    if m[2] and m[2] not in ids: bad.append(('mix', m))
    for b in m[:2]:
        if b not in D['bottles']: bad.append(('mix 瓶名', b))
n = len(D['rows'])
print('条目', n, '初中', sum(r['lv'] == 'j' for r in D['rows']), '高中', sum(r['lv'] == 's' for r in D['rows']), '选必', sum(r['lv'] == 'e' for r in D['rows']), '安全', Counter(r['safe'] for r in D['rows']))
print('问题', len(bad)); [print(' ', *b) for b in bad]
sys.exit(1 if bad or BASE != 60 or n not in (60, 120, 140, 160, 200) else 0)
