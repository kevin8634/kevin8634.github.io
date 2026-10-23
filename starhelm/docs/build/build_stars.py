# 天枢 Starhelm · 星域 V 恒星场数据构建(v1.0-M4)
# 输入:HYG 恒星库 v4.1 hygdata_v41.csv(CC BY-SA 4.0,David Nash / astronexus,github.com/astronexus/HYG-Database)
#       NASA 系外行星档案 pscomppars(sy_dist<30.66 pc)CSV(exoplanetarchive.ipac.caltech.edu TAP)
# 输出:sh-stars-data.js(派生数据,同样以 CC BY-SA 4.0 发布)
# 筛选:距太阳 ≤100 光年的全部恒星 + 100–3000 光年中视星等 ≤3.5 的亮星(让从太阳看出去的星座完整)
# 编码:每颗星 5 个 int16(小端)→ base64:x,y,z(0.1 光年,赤道坐标 J2000:x→春分点,z→北天极)、绝对星等×100、B−V 色指数×1000(缺省 32767)
# 用法:python3 build_stars.py hygdata_v41.csv exo30.csv ../../sh-stars-data.js
import csv, sys, math, struct, base64, json

PC = 3.26156
hyg, exo, out = sys.argv[1], sys.argv[2], sys.argv[3]
rows = list(csv.DictReader(open(hyg, encoding='utf-8')))

KEYS = {  # 本世界标注的恒星:键 → HYG proper 名
    'sol': 'Sol', 'proxima': 'Proxima Centauri', 'rigil': 'Rigil Kentaurus', 'toliman': 'Toliman', 'barnard': "Barnard's Star",
    'wolf359': 'Wolf 359', 'lalande': 'Lalande 21185', 'sirius': 'Sirius', 'epseri': 'Ran', 'procyon': 'Procyon', 'altair': 'Altair',
    'vega': 'Vega', 'fomalhaut': 'Fomalhaut', 'arcturus': 'Arcturus', 'pollux': 'Pollux', 'capella': 'Capella', 'castor': 'Castor',
    'aldebaran': 'Aldebaran', 'regulus': 'Regulus', 'polaris': 'Polaris', 'dubhe': 'Dubhe', 'merak': 'Merak', 'phecda': 'Phecda',
    'megrez': 'Megrez', 'alioth': 'Alioth', 'mizar': 'Mizar', 'alkaid': 'Alkaid', 'alcor': 'Alcor', 'betelgeuse': 'Betelgeuse',
    'rigel': 'Rigel', 'deneb': 'Deneb', 'antares': 'Antares', 'spica': 'Spica', 'canopus': 'Canopus', 'denebola': 'Denebola',
    'ross128': 'Ross 128', 'peg51': 'Helvetios', 'cnc55': 'Copernicus', 'wolf1061': 'Wolf 1061',
}
GL = {'taucet': 'Gl 71', 'gj581': 'Gl 581', 'lhs1140': 'GJ 3053', 'hd189733': 'GJ 4130'}
DIPPER = ['dubhe', 'merak', 'phecda', 'megrez', 'alioth', 'mizar', 'alkaid']

def f(x, d=None):
    try: return float(x)
    except: return d

sel = []
for r in rows:
    d = f(r['dist'], 0)
    if d is None or d >= 100000: continue
    ly = d * PC
    mag = f(r['mag'], 99)
    if r['proper'] == 'Sol' or (0 < ly <= 100) or (100 < ly <= 3000 and mag <= 3.5):
        sel.append(r)
# HYG 未收录的两颗系外行星宿主星(依据 NASA 系外行星档案的位置与距离;V 星等:TRAPPIST-1 18.8、Teegarden 15.1)
def synth(name, ra, dec, pc, vmag, ci):
    a, b = math.radians(ra), math.radians(dec)
    return {'id': 'x-' + name, 'proper': name, 'gl': '', 'x': pc * math.cos(b) * math.cos(a), 'y': pc * math.cos(b) * math.sin(a), 'z': pc * math.sin(b),
            'absmag': vmag - 5 * math.log10(pc) + 5, 'ci': ci, 'dist': pc, 'mag': vmag, 'vx': 0, 'vy': 0, 'vz': 0}
sel.append(synth('TRAPPIST-1', 346.6263919, -5.0434618, 12.42988881, 18.8, 2.0))
sel.append(synth("Teegarden's Star", 43.2691449, 16.8649024, 3.83078, 15.1, 2.0))
KEYS['trappist1'] = 'TRAPPIST-1'; KEYS['teegarden'] = "Teegarden's Star"

buf = bytearray(); keyidx = {}; vel = {}
for i, r in enumerate(sel):
    x, y, z = (f(r['x'], 0) * PC, f(r['y'], 0) * PC, f(r['z'], 0) * PC)
    am = f(r['absmag'], 15.0); ci = f(r['ci'], None)
    q = lambda v: max(-32767, min(32766, int(round(v))))
    buf += struct.pack('<5h', q(x * 10), q(y * 10), q(z * 10), q(am * 100), 32767 if ci is None else q(ci * 1000))
    for k, p in KEYS.items():
        if r['proper'] == p and k not in keyidx: keyidx[k] = i
    for k, g in GL.items():
        if r.get('gl') == g and k not in keyidx: keyidx[k] = i
    if r['proper'] == 'Sol': keyidx['sol'] = i
for k in DIPPER:
    r = sel[keyidx[k]]; vel[k] = [round(f(r['vx'], 0) * PC, 8), round(f(r['vy'], 0) * PC, 8), round(f(r['vz'], 0) * PC, 8)]  # 光年/年

# 系外行星宿主:按坐标匹配到星表(60″ 内、距离相差 <20%)
hosts = {}
for r in csv.DictReader(open(exo, encoding='utf-8')):
    hosts.setdefault(r['hostname'], r)
pos = [(math.atan2(f(s['y'], 0), f(s['x'], 0)), f(s['dist'], 0), s) for s in sel]
exo_ix = {}
cnt = {}
for r in csv.DictReader(open(exo, encoding='utf-8')):
    cnt[r['hostname']] = cnt.get(r['hostname'], 0) + 1
for h, r in hosts.items():
    ra, dec, pc = math.radians(float(r['ra'])), math.radians(float(r['dec'])), float(r['sy_dist'])
    v = (math.cos(dec) * math.cos(ra), math.cos(dec) * math.sin(ra), math.sin(dec))
    best = None
    for i, s in enumerate(sel):
        d = f(s['dist'], 0)
        if d <= 0 or abs(d - pc) / pc > 0.2: continue
        sx, sy, sz = f(s['x'], 0) / d, f(s['y'], 0) / d, f(s['z'], 0) / d
        c = sx * v[0] + sy * v[1] + sz * v[2]
        if c > math.cos(math.radians(60 / 3600)) and (best is None or c > best[0]): best = (c, i)
    if best: exo_ix[best[1]] = exo_ix.get(best[1], 0) + cnt[h]
missing = len(hosts) - len(exo_ix)

with open(out, 'w', encoding='utf-8') as o:
    o.write('/* 天枢 Starhelm · 星域 V 恒星场(v1.0-M4)· 派生自 HYG 恒星库 v4.1(David Nash / astronexus,CC BY-SA 4.0);本文件同样以 CC BY-SA 4.0 发布。\n'
            ' * 系外行星宿主标记:NASA Exoplanet Archive pscomppars(2026-10-23 查询)。TRAPPIST-1、Teegarden 星 HYG 未收录,按 NASA 系外行星档案位置补入。\n'
            ' * d:base64,每星 5×int16:x,y,z(0.1 光年,J2000 赤道坐标,x→春分点 z→北天极)、绝对星等×100、B−V×1000(32767=缺)。k:标注星序号;v:北斗七星空间速度(光年/年);e:系外行星宿主 [序号, 行星数] */\n')
    o.write('window.SH_STARS=' + json.dumps({'n': len(sel), 'd': base64.b64encode(bytes(buf)).decode(), 'k': keyidx, 'v': vel,
            'e': sorted([[i, c] for i, c in exo_ix.items()]), 'exoTotal': 6451, 'exoNear': 541, 'exoNearSys': 327, 'asOf': '2026-10-23'}, ensure_ascii=False, separators=(',', ':')) + ';\n')
print('stars', len(sel), 'bytes', len(buf), 'keys', len(keyidx), sorted(set(list(KEYS) + list(GL)) - set(keyidx)), 'exo matched', len(exo_ix), 'missing', missing)
