# 深空 2.6「模型炼炉 · 疫情」:生成 deep/data/dpc.covid.italy.wave1.json(意大利第一波累计确诊,2020-02-24 至 2020-06-30,128 天)
# 运行:在仓库根目录 python3 deep/docs/epi_forge_build.py [本地 CSV 路径]
#   不给路径时从固定提交下载(只在生成数据时联网一次;网页运行时零外部请求,读的是生成好的本地 JSON)。
# 一手来源:意大利民防部 Dipartimento della Protezione Civile(DPC),GitHub pcm-dpc/COVID-19,
#   dati-andamento-nazionale/dpc-covid19-ita-andamento-nazionale.csv,许可 CC BY 4.0
#   固定提交 fc82987b9ebda01fe8e5b59d5667e3e00721edb9(2026-11-12 取;与 master 前 128 行逐字节一致)
# 可选:python3 deep/docs/epi_forge_build.py --scipy 用 scipy least_squares + solve_ivp 独立复算各模型(需 numpy/scipy)
import csv, io, json, sys, urllib.request

PIN = 'fc82987b9ebda01fe8e5b59d5667e3e00721edb9'
URL = 'https://raw.githubusercontent.com/pcm-dpc/COVID-19/%s/dati-andamento-nazionale/dpc-covid19-ita-andamento-nazionale.csv' % PIN
REL = 0.05   # 教学相对误差 σC/C = 5%,理由见 meta.note
D0, D1 = '2020-02-24', '2020-06-30'

args = [a for a in sys.argv[1:] if not a.startswith('--')]
txt = open(args[0], encoding='utf-8').read() if args else urllib.request.urlopen(URL, timeout=60).read().decode('utf-8')
R = [r for r in csv.DictReader(io.StringIO(txt)) if D0 <= r['data'][:10] <= D1]
assert len(R) == 128 and R[0]['data'][:10] == D0 and R[-1]['data'][:10] == D1
rows = []
for i, r in enumerate(R):
    c = int(r['totale_casi'])
    rows.append([i, r['data'][:10], c, round(REL * c), int(r['totale_positivi']), int(r['dimessi_guariti']) + int(r['deceduti']), int(r['deceduti']), int(r['nuovi_positivi'])])
# 一致性:与 1.7 航线的 JHU 快照(前 31 天)对照。JHU 意大利行取自 DPC,只有 02-26、02-27 两天不同(JHU 453/655,DPC 400/650),其余 29 天逐日相同
J = json.load(open('deep/data/jhu.covid.italy.2020mar.json'))['rows']
diff = [(rows[i][1], J[i][1], rows[i][2]) for i in range(31) if J[i][1] != rows[i][2]]
assert diff == [('2020-02-26', 453, 400), ('2020-02-27', 655, 650)], diff
assert rows[0][2] == 229 and rows[36][2] == 105792 and rows[97][2] == 233019 and rows[-1][2] == 240578
dips = [(rows[i][1], rows[i - 1][2], rows[i][2]) for i in range(1, 128) if rows[i][2] < rows[i - 1][2]]
assert dips == [('2020-06-19', 238159, 238011)], dips   # 唯一一次回落:DPC 数据更正 dc-IT-0057/0059,原样保留
meta = {
    "id": "dpc.covid.italy.wave1",
    "title": "意大利新冠第一波累计确诊(2020-02-24 至 2020-06-30,每日 1 行)",
    "source": "Dipartimento della Protezione Civile(意大利民防部)· COVID-19 Italia · dpc-covid19-ita-andamento-nazionale.csv",
    "url": "https://github.com/pcm-dpc/COVID-19",
    "pinned": URL,
    "license": "CC BY 4.0(署名:Presidenza del Consiglio dei Ministri – Dipartimento della Protezione Civile)",
    "retrieved": "2026-11-12",
    "ai_generated": False,
    "fields": {
        "day": "距 2020-02-24 的天数(0–127)",
        "date": "报告日期(DPC 每日 17:00/18:00 CET/CEST 汇总)",
        "cases": "totale_casi 累计确诊(人)",
        "errC": "本站设定的教学误差 = 5% × cases(取整),不是测量误差",
        "active": "totale_positivi 现有阳性(人)",
        "removed": "dimessi_guariti + deceduti 累计移出(治愈出院 + 死亡)",
        "deaths": "deceduti 累计死亡",
        "new": "nuovi_positivi 当日新增确诊"
    },
    "note": "原始数值未改动,只做列选取与加法(removed);2020-06-19 累计确诊比前一天少 148,为 DPC 数据更正(dc-IT-0057、dc-IT-0059),原样保留。前 31 天与 1.7 航线 jhu.covid.italy.2020mar.json 对照:除 2020-02-26、02-27 两天(JHU 453、655;DPC 400、650)外逐日相同,本炉以一手来源 DPC 为准。确诊受检测量、报告延迟与周末效应影响,累计确诊不等于真实感染;5% 教学误差用来粗略代表这些报告噪声,炼炉的 χ²、BIC、过关线都依赖这一设定。本地快照,运行时零外部请求。"
}
out = {"meta": meta, "columns": ["day", "date", "cases", "errC", "active", "removed", "deaths", "new"], "rows": rows}
json.dump(out, open('deep/data/dpc.covid.italy.wave1.json', 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print('ok 128 行;03-31 =', rows[36][2], ';05-31 =', rows[97][2], ';06-30 =', rows[-1][2])

if '--scipy' in sys.argv:   # 独立复算(不用 engine.js)
    import numpy as np
    from scipy.optimize import least_squares
    from scipy.integrate import solve_ivp
    t = np.array([r[0] for r in rows], float); C = np.array([r[2] for r in rows], float); s = np.array([r[3] for r in rows], float)
    def sir(p, tt, lock):
        b, g, N, I0, q, tL = p
        def f(x, y):
            bb = b * (1 - q / (1 + np.exp(-(x - tL)))) if lock else b
            return [-bb * y[0] * y[1] / N, bb * y[0] * y[1] / N - g * y[1]]
        so = solve_ivp(f, [0, tt[-1]], [N - I0, I0], t_eval=tt, rtol=1e-10, atol=1e-8, max_step=0.25)
        return N - so.y[0]
    def run(name, fn, p0, lo, hi, cut=128):
        m = t < cut
        r = least_squares(lambda p: (C[m] - fn(p, t[m])) / s[m], p0, bounds=(lo, hi), x_scale='jac', xtol=1e-12, ftol=1e-12)
        chi = 2 * r.cost; k = len(p0); n = int(m.sum())
        cov = np.linalg.inv(r.jac.T @ r.jac) * max(1, chi / (n - k))
        print('%-10s k=%d χ²=%.2f χ²ν=%.3f BIC=%.2f p=%s σ=%s' % (name, k, chi, chi / (n - k), chi + k * np.log(n), np.round(r.x, 5), np.round(np.sqrt(np.diag(cov)), 5)))
        return r.x, cov
    g7 = 1 / 7
    run('指数', lambda p, tt: p[0] * np.exp(p[1] * tt), [229, .25], [10, .01], [5000, .6])
    run('逻辑斯谛', lambda p, tt: p[0] * 1e4 / (1 + (p[0] * 1e4 / p[2] - 1) * np.exp(-p[1] * tt)), [10, .25, 229], [1, .01, 10], [1000, .6, 5000])
    x, cv = run('SIR', lambda p, tt: sir([p[0], g7, p[1] * 1e4, p[2], 0, 0], tt, False), [.4, 50, 200], [.02, 1, 10], [3, 1e4, 3000])
    print('  R0 = %.4f ± %.4f' % (x[0] / g7, np.sqrt(cv[0, 0]) / g7))
    x, cv = run('SIR+封城', lambda p, tt: sir([p[0], g7, p[1] * 1e4, p[2], p[3], p[4]], tt, True), [.4, 50, 200, .5, 14], [.02, 1, 10, 0, 0], [3, 1e4, 3000, .95, 60])
    print('  R0 = %.4f ± %.4f;干预后 R = %.4f' % (x[0] / g7, np.sqrt(cv[0, 0]) / g7, x[0] * (1 - x[3]) / g7))
