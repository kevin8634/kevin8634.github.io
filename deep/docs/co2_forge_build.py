# 深空 2.7「模型炼炉 · CO₂」:生成 deep/data/noaa.co2.mlo.monthly.json(莫纳罗亚 CO₂ 月均浓度,Keeling 曲线,1958-03 至 2026-09,823 个月)
# 运行:在仓库根目录 python3 deep/docs/co2_forge_build.py [本地 co2_mm_mlo.txt 路径] [--scipy]
#   不给路径时从 NOAA GML 下载一次(只在生成数据时联网;网页运行时零外部请求,读的是生成好的本地 JSON)。
# 一手来源:NOAA Global Monitoring Laboratory(GML),https://gml.noaa.gov/webdata/ccgg/trends/co2/co2_mm_mlo.txt
#   文件头 File Creation: Fri Oct 9 13:08:07 2026;Last-Modified: Fri, 09 Oct 2026 19:23:07 GMT;2026-11-12 取,最新月份 2026-09。
#   1958-03 至 1974-04 为 Scripps 海洋研究所 C. David Keeling 的观测(文件内注明);NOAA 数据为美国联邦政府作品(公有领域),按 GML 要求署名。
# 开封时(2027 年 6 月以后):用新的 co2_mm_mlo.txt 重跑本脚本,把 EXPECT_LAST 改成新的最新月份即可(见 F7 文档「开封流程」)。
import hashlib, json, sys, urllib.request

URL = 'https://gml.noaa.gov/webdata/ccgg/trends/co2/co2_mm_mlo.txt'
SIG = 0.8          # 教学误差 σ = 0.8 ppm(统一),理由见 meta.note
EXPECT_LAST = '2026-09'
args = [a for a in sys.argv[1:] if not a.startswith('--')]
raw = open(args[0], 'rb').read() if args else urllib.request.urlopen(URL, timeout=60).read()
txt = raw.decode('utf-8')
created = [l for l in txt.splitlines() if 'File Creation' in l][0].split(':', 1)[1].strip()
rows = []
for l in txt.splitlines():
    if l.startswith('#') or not l.strip(): continue
    y, m, dec, avg, des, nd, sd, unc = l.split()
    rows.append([float(dec), '%s-%02d' % (y, int(m)), float(avg), SIG, float(des), int(nd), float(unc)])
# 一致性断言
assert rows[0][1] == '1958-03' and rows[-1][1] == EXPECT_LAST, (rows[0][1], rows[-1][1])
for a, b in zip(rows, rows[1:]):
    ya, ma = map(int, a[1].split('-')); yb, mb = map(int, b[1].split('-'))
    assert (yb * 12 + mb) - (ya * 12 + ma) == 1, ('缺月', a[1], b[1])   # 逐月连续,无缺行
    assert 0.07 < b[0] - a[0] < 0.1
assert all(300 < r[2] < 450 for r in rows)
# 与 2.0 起已入库的年均文件(noaa.co2.mlo.annual.json,co2_annmean_mlo.txt)对照:年均 = 12 个月月均的算术平均,差 ≤ 0.01 ppm
ann = {r[0]: r[1] for r in json.load(open('deep/data/noaa.co2.mlo.annual.json', encoding='utf-8'))['rows']}
chk = 0
for yr, v in ann.items():
    ms = [r[2] for r in rows if r[1].startswith('%d-' % yr)]
    if len(ms) == 12: assert abs(sum(ms) / 12 - v) <= 0.011, (yr, sum(ms) / 12, v); chk += 1
assert chk >= 60, chk
N = len(rows)
meta = {
    'id': 'noaa.co2.mlo.monthly', 'title': '莫纳罗亚 CO₂ 月均浓度(Keeling 曲线)',
    'source': 'NOAA Global Monitoring Laboratory, Mauna Loa Observatory; 1958-03…1974-04 为 Scripps Institution of Oceanography(C. D. Keeling)观测',
    'url': URL, 'file_creation': created, 'retrieved': '2026-11-12', 'sha256': hashlib.sha256(raw).hexdigest(),
    'first': rows[0][1], 'last': rows[-1][1], 'n': N, 'unit': 'ppm(干空气摩尔分数,WMO X2019 标度)',
    'license': '美国联邦政府数据(公有领域);按 NOAA GML 要求署名:Lan, X., Tans, P. and K.W. Thoning: Trends in globally-averaged CO2 determined from NOAA Global Monitoring Laboratory measurements;Keeling, C. D. et al.(Scripps CO2 Program)',
    'citation': 'Dr. Xin Lan, NOAA/GML (gml.noaa.gov/ccgg/trends/) and Dr. Ralph Keeling, Scripps Institution of Oceanography (scrippsco2.ucsd.edu/)',
    'ai_generated': False,
    'fields': {'t': 'NOAA 给出的月中小数年份(decimal date)', 'ym': '年-月', 'co2': '月均浓度 monthly average(ppm),原样', 'err': '本站教学误差 0.8 ppm(统一,不是测量误差)', 'deseason': 'NOAA 去季节值(ppm),原样,炉暂不用', 'ndays': '当月有效观测日数;−1 = 无信息(Scripps 时期)', 'unc': 'NOAA 月均值不确定度(ppm);−0.99 = 无信息'},
    'note': '数值原样,只选列;NOAA 已把缺测月份插补(文件注明),1958–1974 Scripps 时期 ndays/unc 为 −1/−0.99。2022-12 至 2023-07-04 因莫纳罗亚火山喷发改在约 21 英里外的 Maunakea 观测(文件注明)。最近几个月为初步值,NOAA 可能小幅修订。教学误差 0.8 ppm:NOAA 月均值本身的不确定度通常只有 0.1–0.3 ppm,但平滑的趋势 + 季节模型抓不住厄尔尼诺等年际起伏(量级 0.5–1 ppm);取统一 0.8 ppm 让 χ²、BIC 与过关线有意义。这个取值参考了最优模型的残差,是事后设定,所以 χ²_ν≈1 不能当作模型「正确」的证据。'
}
json.dump({'meta': meta, 'columns': ['t', 'ym', 'co2', 'err', 'deseason', 'ndays', 'unc'], 'rows': rows}, open('deep/data/noaa.co2.mlo.monthly.json', 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print('写出 deep/data/noaa.co2.mlo.monthly.json:', N, '行', rows[0][1], '…', rows[-1][1], '年均对照', chk, '年 ✓')

if '--scipy' in sys.argv:   # 独立复算(不用引擎代码):各积木组合的 χ²/BIC 与派生量
    import numpy as np
    from scipy.optimize import least_squares
    t = np.array([r[0] for r in rows]); y = np.array([r[2] for r in rows]); x = t - 2000
    def m(p, parts):
        out, i = 0, 0
        for k in parts:
            if k == 'lin': out = out + p[i] + p[i + 1] * x; i += 2
            if k == 'quad': out = out + p[i] * x * x; i += 1
            if k == 'exp': out = out + 280 + p[i] * np.exp(x / p[i + 1]); i += 2
            if k == 'ann': out = out + p[i] * np.cos(2 * np.pi * (t - (p[i + 1] - 0.5) / 12)); i += 2
            if k == 'semi': out = out + p[i] * np.cos(4 * np.pi * (t - (p[i + 1] - 0.5) / 12)); i += 2
        return out
    p0 = {'lin': [370, 1.5], 'quad': [0.01], 'exp': [90, 50], 'ann': [3, 5], 'semi': [0.8, 5]}
    for parts in [['lin'], ['lin', 'quad'], ['exp'], ['lin', 'ann'], ['lin', 'quad', 'ann'], ['lin', 'quad', 'ann', 'semi'], ['exp', 'ann'], ['exp', 'ann', 'semi']]:
        r = least_squares(lambda p: (y - m(p, parts)) / SIG, sum([p0[k] for k in parts], []))
        c2 = float((r.fun ** 2).sum()); k = len(r.x)
        print('%-24s k=%d χ²=%.1f χ²ν=%.3f BIC=%.1f' % ('+'.join(parts), k, c2, c2 / (N - k), c2 + k * np.log(N)), np.round(r.x, 4))
