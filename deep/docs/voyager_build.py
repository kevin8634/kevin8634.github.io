# 深空 2.3「前沿 · 旅行者 1 号一光日」:生成 deep/cards/sh.l2.voyager.json 与 deep/data/jpl.horizons.voyager1.json,
# 并复算卡内所有数字。运行:在仓库根目录 python3 deep/docs/voyager_build.py(只用标准库,无网络请求)
# 一手来源(2026-11-09 取):
#   NASA Science「Where Are Voyager 1 and 2 Now?」:2026-11-18 02:16:07 PST 距地球 16.094 亿英里(259.02 亿 km)= 一光日
#   JPL 新闻 2026-10-29「NASA's Voyager 1 Conserves Power, Resolves Brief Communications Pause」:61,155 km/h;往返 48 小时
#   JPL Horizons(Voyager 1 = -31,中心 500@399 地心,EPHEM_TYPE=VECTORS、VEC_TABLE=4、VEC_CORR=NONE,步长 10 天,2026-01-01 至 2027-12-31 TDB)
#   JPL Horizons(观测者 500@10 日心,2026-11-18 10:16 UT):r=172.3795658 AU,rdot=16.8815923 km/s
import json, math
OUT = 'deep/'
TODAY = '2026-11-09'
TAG = '前沿 · 一光日'
NOTE = '由总指挥添加,AI 协助编写。'
def dump(path, obj):
    json.dump(obj, open(OUT + path, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))

C = 299792.458                    # km/s,SI 定义值
AU = 149597870.7                  # km,IAU 2012 B2
LD = C * 86400                    # 一光日 km
assert round(LD) == 25902068371
LD_AU = LD / AU
assert abs(LD_AU - 173.1446) < 1e-3
# NASA:2026-11-18 02:16:07 PST = 10:16:07 UTC = 18:16:07 北京时间
NASA_KM = 25.902e9
assert abs(NASA_KM - LD) / LD < 1e-4
V_JPL = 61155 / 3600              # km/s(JPL 新闻 61,155 km/h)
assert abs(V_JPL - 16.99) < 0.01
V_HELIO = 16.8815923              # Horizons 日心径向速度
R_HELIO = 172.3795658             # AU
YR = 365.25 * 86400
D_PER_YR_KM = V_JPL * YR
D_PER_YR_AU = D_PER_YR_KM / AU
LT_PER_DAY_S = V_JPL * 86400 / C  # 光行时每天增加的秒数
LT_PER_YR_H = D_PER_YR_KM / C / 3600
assert abs(LT_PER_DAY_S - 4.896) < 0.01 and abs(LT_PER_YR_H - 0.4968) < 0.001

# Horizons 地心几何距离表(VECTORS,VEC_CORR=NONE,无光行时修正):(日期 0h TDB, RG km, RR km/s)
H = """2026-01-01 25430712228 7.0300285
2026-01-11 25435131948 3.2542258
2026-01-21 25436448861 -0.1254185
2026-01-31 25435077816 -2.9465671
2026-02-10 25431529488 -5.1653748
2026-02-20 25426345159 -6.7132293
2026-03-02 25420149023 -7.5060364
2026-03-12 25413578166 -7.5856726
2026-03-22 25407254384 -6.9251819
2026-04-01 25401821695 -5.5413055
2026-04-11 25397856574 -3.5356254
2026-04-21 25395887481 -0.9240258
2026-05-01 25396403790 2.1877168
2026-05-11 25399777047 5.6810608
2026-05-21 25406317846 9.5055834
2026-05-31 25416250027 13.5014632
2026-06-10 25429668756 17.5686725
2026-06-20 25446609640 21.6308011
2026-06-30 25466994122 25.5186728
2026-07-10 25490637595 29.1685312
2026-07-20 25517303334 32.4862321
2026-07-30 25546637534 35.3365326
2026-08-09 25578224190 37.6953721
2026-08-19 25611605112 39.4651365
2026-08-29 25646230177 40.5782873
2026-09-08 25681540630 41.0474737
2026-09-18 25716950908 40.7974043
2026-09-28 25751836733 39.8469428
2026-10-08 25785619745 38.2414838
2026-10-18 25817721136 35.9608843
2026-10-28 25847596268 33.1102628
2026-11-07 25874793254 29.7621397
2026-11-17 25898897142 25.9743537
2026-11-27 25919599672 21.9149619
2026-12-07 25936711754 17.6705300
2026-12-17 25950117781 13.3697348
2026-12-27 25959852960 9.1953608
2027-01-06 25966063491 5.2246255
2027-01-16 25968985541 1.6149970
2027-01-26 25968999663 -1.4975102
2027-02-05 25966551020 -4.0702019
2027-02-15 25962160176 -5.9731864
2027-02-25 25956435538 -7.1647581
2027-03-07 25949982629 -7.6473694
2027-03-17 25943444359 -7.3593611
2027-03-27 25937469020 -6.3627229
2027-04-06 25932642921 -4.6951403
2027-04-16 25929545901 -2.3748422
2027-04-26 25928685989 0.4628017
2027-05-06 25930479706 3.7637951
2027-05-16 25935300005 7.4406770
2027-05-26 25943397785 11.3351303
2027-06-05 25954934331 15.3905198
2027-06-15 25970000598 19.4722916
2027-06-25 25988550490 23.4461596
2027-07-05 26010470024 27.2575202
2027-07-15 26035559002 30.7540297
2027-07-25 26063499234 33.8549808
2027-08-04 26093933306 36.5086654
2027-08-14 26126415795 38.5811286
2027-08-24 26160429963 40.0557649
2027-09-03 26195448709 40.8883328
2027-09-13 26230875588 41.0022478
2027-09-23 26266107586 40.4428923
2027-10-03 26300560041 39.1859860
2027-10-13 26333622561 37.2433384
2027-10-23 26364748518 34.7127676
2027-11-02 26393438765 31.6072113
2027-11-12 26419231720 28.0350565
2027-11-22 26441788335 24.1270949
2027-12-02 26460841390 19.9437483
2027-12-12 26476224060 15.6632717
2027-12-22 26487918177 11.4150995"""
import datetime as dt
T0 = dt.datetime(2026, 11, 18, 10, 16, 7)   # UTC
Y0 = 2026 + (T0 - dt.datetime(2026, 1, 1)).total_seconds() / YR   # 小数年(以 365.25 天为一年,自 2026-01-01 0h UT 起算)
assert abs(Y0 - 2026.8805) < 1e-3
rows = []
for ln in H.split('\n'):
    d, rg, rr = ln.split(); t = dt.datetime.strptime(d, '%Y-%m-%d')
    day = (t - T0).total_seconds() / 86400 + 69.184 / 86400    # 0h TDB ≈ 23:58:51 UTC 前一日,差 69 秒
    rows.append([round(day, 4), d, float(rg) / AU, float(rr)])
# Horizons 自身插值:跨越一光日的时刻(相邻两点间三次 Hermite,用 deldot 作导数)
def herm(i, s):
    (x0, _, y0, v0), (x1, _, y1, v1) = rows[i], rows[i + 1]
    h = x1 - x0; k = 86400 / AU                   # km/s → AU/天
    m0, m1 = v0 * k * h, v1 * k * h
    return (2*s**3-3*s**2+1)*y0 + (s**3-2*s**2+s)*m0 + (-2*s**3+3*s**2)*y1 + (s**3-s**2)*m1
i = next(j for j in range(len(rows) - 1) if rows[j][2] < LD_AU <= rows[j + 1][2])
lo, hi = 0.0, 1.0
for _ in range(60):
    mid = (lo + hi) / 2
    (lo, hi) = (mid, hi) if herm(i, mid) < LD_AU else (lo, mid)
x_cross = rows[i][0] + lo * (rows[i + 1][0] - rows[i][0])
assert abs(x_cross) < 0.002, x_cross           # 几何距离:Horizons 与 NASA 公布时刻相差 < 3 分钟
DDOT_T0 = rows[i][3] + lo * (rows[i + 1][3] - rows[i][3])   # 此刻地心距离变化率(线性插值)
assert 25 < DDOT_T0 < 27, DDOT_T0
# 「天真」线性外推:从 11 月 7 日(Horizons)按 17 km/s 推,会把一光日推迟多少天
j7 = [r[1] for r in rows].index('2026-11-07')
gap_km = (LD_AU - rows[j7][2]) * AU
naive_days = gap_km / V_JPL / 86400
true_days = -rows[j7][0]
assert 18 < naive_days < 19.2 and 11 < true_days < 11.5, (naive_days, true_days)
# 一年范围内地心距离变化率的极值
dmin, dmax = min(r[3] for r in rows), max(r[3] for r in rows)
# 拟合:delta(t) = a + b t + c cos(2πt/P) + d sin(2πt/P),t 为年(相对 Y0),P = 1 恒星年
P = 365.256363 / 365.25
def solve(A, y):
    n = len(A[0]); M = [[sum(A[k][r] * A[k][c] for k in range(len(A))) for c in range(n)] + [sum(A[k][r] * y[k] for k in range(len(A)))] for r in range(n)]
    for col in range(n):
        p = max(range(col, n), key=lambda r: abs(M[r][col])); M[col], M[p] = M[p], M[col]
        for r in range(n):
            if r != col:
                f_ = M[r][col] / M[col][col]; M[r] = [a - f_ * b for a, b in zip(M[r], M[col])]
    return [M[r][n] / M[r][r] for r in range(n)]
ty = [r[0] / 365.25 for r in rows]
A = [[1, t, math.cos(2 * math.pi * t / P), math.sin(2 * math.pi * t / P)] for t in ty]
fa, fb, fc, fd = solve(A, [r[2] for r in rows])
fit = lambda t: fa + fb * t + fc * math.cos(2 * math.pi * t / P) + fd * math.sin(2 * math.pi * t / P)
res = max(abs(fit(t) - r[2]) for t, r in zip(ty, rows))
amp = math.hypot(fc, fd)
assert res < 0.03 and 0.75 < amp < 0.9 and 3.4 < fb < 3.7, (res, amp, fb)
lin = lambda t: LD_AU + D_PER_YR_AU * t
data_rows = [[r[0], r[1], round(r[2], 4), round(r[3], 3), round(lin(r[0] / 365.25), 4), round(fit(r[0] / 365.25), 4)] for r in rows]
dump('data/jpl.horizons.voyager1.json', {"meta": {"id": "jpl.horizons.voyager1", "title": "旅行者 1 号到地心的距离与距离变化率(2026–2027,每 10 天)",
    "source": "NASA/JPL Horizons 星历(目标 -31 Voyager 1,观测者 500@399 地心,VECTORS 表 4、无光行时修正的几何距离 RG 与变化率 RR,2026-11-09 取);lin、fit 两列由本站脚本 deep/docs/voyager_build.py 计算",
    "url": "https://ssd.jpl.nasa.gov/horizons/", "license": "NASA/JPL 公开数据(美国政府作品),署名 NASA/JPL Horizons;lin、fit 列为本站计算,CC BY 4.0",
    "retrieved": TODAY, "unit": "AU;km/s", "ai_generated": False,
    "note": "day=距 2026-11-18 10:16:07 UTC(北京时间 18:16:07)的天数;delta 为几何距离(AU,未做光行时修正,与 NASA 公布口径一致),day 已按 TDB−UTC≈69 s 换算,deldot 为地心距离变化率;lin=按 16.99 km/s 的线性外推(近似,非观测);fit=线性+一年周期的最小二乘拟合(近似,非观测)。"},
    "columns": ["day", "date", "delta", "deldot", "lin", "fit"], "rows": data_rows})

# ---------------------------------------------------------------- 卡片
fmt = lambda x, n=2: ('%.*f' % (n, x))
y0s = '2026.88'                         # 滑杆默认值;与精确 Y0=2026.8800 相差 <1 小时,光行时差 <0.01 秒
dly = fmt(D_PER_YR_KM / 1e8, 3)         # 亿 km / 年
LD_YI = LD / 1e8                        # 亿 km
LIN_E = '(%s+(y-%s)*%s)' % (fmt(LD_YI, 8), y0s, dly)                  # 亿 km
FIT_E = '((%s+%s*(y-%s)+%s*cos(2*pi*(y-%s)/%s)+%s*sin(2*pi*(y-%s)/%s))*%s)' % (
    fmt(fa, 4), fmt(fb, 4), y0s, fmt(fc, 4), y0s, fmt(P, 6), fmt(fd, 4), y0s, fmt(P, 6), fmt(AU / 1e8, 6))
LT_LIN = '(%s/%s)' % (LIN_E, fmt(C * 3600 / 1e8, 9))                   # 小时
LT_FIT = '(%s/%s)' % (FIT_E, fmt(C * 3600 / 1e8, 9))
xs = lambda e: e.replace('(y-', '(x-')
card = {"id": "sh.l2.voyager", "world": "sh", "link_task": "sh.voyager", "tag": TAG, "tab": "旅行者 1 号:一光日",
 "title": "旅行者 1 号:离地球一光日,说一句「你好」要等两天",
 "formula": "c\\times1\\,\\text{天}\\approx2.59\\times10^{10}\\,\\text{km}",
 "hook": "NASA 公布:2026 年 11 月 18 日 02:16:07(美国太平洋时间),也就是北京时间 18:16:07,旅行者 1 号离地球将达到 259.02 亿千米——光要整整走一天。它 1977 年出发,是第一个走这么远的人造物体。这个数是怎么算出来的?",
 "steps": [
  {"text": "一光日是距离,不是时间。光速按定义精确等于 299 792.458 千米/秒,一天 86 400 秒,相乘得 25 902 068 371 千米,约 259.02 亿千米。除以 1 天文单位(日地平均距离 149 597 870.7 千米)约为 %.2f AU。" % LD_AU,
   "tex": "299\\,792.458\\times86\\,400=25\\,902\\,068\\,371\\;\\text{km}"},
  {"text": "旅行者 1 号相对太阳的速度约 61 155 千米/时,即约 %.2f 千米/秒(JPL Horizons 给出此刻日心径向速度 %.2f 千米/秒)。一年走 %.2f 亿千米 ≈ %.2f AU;每天远离约 %.0f 万千米,光多走 %.1f 秒。所以单程光行时大约每年增加 %.0f 分钟。" % (V_JPL, V_HELIO, D_PER_YR_KM / 1e8, D_PER_YR_AU, V_JPL * 86400 / 1e4, LT_PER_DAY_S, LT_PER_YR_H * 60),
   "tex": "\\Delta\\tau=\\frac{v\\,\\Delta t}{c}=\\frac{16.99}{299\\,792.458}\\times86\\,400\\,\\text{s}\\approx4.9\\,\\text{s/天}"},
  {"text": "单程光行时 τ = d / c。到一光日时 τ = 24 小时:地面深空网发出的指令一天后才到,探测器的回音还要再走一天。JPL 项目经理的说法是:发一句「你好」,回家等两天才有回音。",
   "tex": "\\tau_{\\text{往返}}=\\frac{2d}{c}=48\\,\\text{h}"},
  {"text": "注意「离地球」和「离太阳」不一样。那一刻它离太阳约 %.2f AU,离地球约 %.2f AU。地球每年绕太阳一圈,所以 Horizons 星历里它到地球的距离变化率一年内在 %.1f 到 +%.1f 千米/秒之间摆动;11 月中旬地球正往远离它的方向跑,变化率约 %.0f 千米/秒。如果从 11 月 7 日的距离按 17 千米/秒线性外推,要 %.1f 天才到一光日;实际只用了 %.1f 天。" % (R_HELIO, LD_AU, dmin, dmax, DDOT_T0, naive_days, true_days),
   "tex": "d_\\oplus(t)\\approx d_0+v\\,t+A\\cos\\!\\Big(\\frac{2\\pi t}{1\\,\\text{年}}-\\varphi\\Big),\\;A\\approx%.2f\\,\\text{AU}" % amp},
  {"text": "所以「哪一天到一光日」靠的是精确星历,而不是一条直线;但长期看,地球公转的摆动平均掉,线性外推(每年约 3.6 AU、光行时每年 +30 分钟)就够估算了。按这个速度,两光日还要再走约 %.0f 年。下面的图把 Horizons 星历和两种近似放在一起。" % (LD / D_PER_YR_KM),
   "tex": "t_{2\\,\\text{ld}}-t_{1\\,\\text{ld}}\\approx\\frac{c\\times86\\,400\\,\\text{s}}{v}\\approx%.0f\\,\\text{年}" % (LD / D_PER_YR_KM)}
 ],
 "check": {"q": "2026 年 11 月 18 日之后,从地球给旅行者 1 号发一条指令,最快多久能收到它的确认?",
  "options": ["约 24 小时", "约 48 小时", "约 17 秒"], "answer": 1,
  "why": "单程光行时已达 24 小时:指令走一天才到,回音再走一天,往返约 48 小时(还不算探测器处理的时间)。"},
 "chart": {"data": "jpl.horizons.voyager1.json", "x": "day", "ys": [{"col": "delta", "label": "Horizons 星历"}, {"col": "lin", "label": "线性外推"}, {"col": "fit", "label": "含公转拟合"}],
  "type": "scatter", "xlabel": "距 2026-11-18 18:16(北京时间)的天数", "ylabel": "到地球的距离(AU)", "marks": [{"x": 0, "label": "一光日 173.14 AU"}]},
 "lab": {"title": "拖动日期:它离我们多远,信号走多久",
  "note": NOTE + "横轴为年份(小数年,2026.88≈2026 年 11 月 18 日,2027.00=元旦);纵轴为单程光行时(小时)。蓝线按 16.99 km/s 线性外推(近似),另一条叠加地球公转的一年周期(由 Horizons 2026–2027 星历拟合,斜率约 16.88 km/s 即日心径向速度;外推多年仍为近似)。两者斜率不同,十年后会差开几千万千米:这正是线性外推的误差量级。",
  "params": [{"k": "y", "label": "日期(小数年)", "min": 2020, "max": 2040, "step": 0.01, "value": 2026.88, "unit": "年"}],
  "fn": {"x": "x", "from": 2020, "to": 2040,
   "ys": [{"label": "单程光行时 · 线性外推", "expr": xs(LT_LIN)}, {"label": "一光日 = 24 小时", "expr": "24+0*x"}, {"label": "含地球公转(拟合)", "expr": xs(LT_FIT)}],
   "mark": [{"x": "y", "label": "此日期"}]},
  "readout": [
   {"label": "距地球(线性外推)", "expr": LIN_E, "unit": "亿千米"},
   {"label": "约合", "expr": "%s*1e8/%s" % (LIN_E, fmt(AU, 1)), "unit": "AU"},
   {"label": "单程光行时", "expr": LT_LIN, "unit": "小时"},
   {"label": "往返", "expr": "2*" + LT_LIN, "unit": "小时"},
   {"label": "比一光日多出", "expr": "(y-%s)*%s/%s*60" % (y0s, dly, fmt(C * 3600 / 1e8, 9)), "unit": "分钟"},
   {"label": "含地球公转的估计与之相差", "expr": "(%s-%s)" % (FIT_E, LIN_E), "unit": "亿千米"}],
  "verdict": [
   {"when": "%s-24.02" % LT_LIN, "text": "已超过一光日:信号单程要 {{%s}} 小时,往返约 {{2*%s}} 小时。" % (LT_LIN, LT_LIN)},
   {"when": "24.02-%s-0.04" % LT_LIN, "text": "还没到一光日:信号单程 {{%s}} 小时。" % LT_LIN},
   {"when": "1", "text": "就在一光日附近(前后约两周):2026 年 11 月 18 日北京时间 18:16,光从地球到它正好要走 24 小时。"}]},
 "uses": "光速、单位换算、速度×时间、线性外推与误差、周期函数",
 "textbook": "初中物理《光的传播》;高中物理《运动的描述》;高中数学《三角函数》",
 "sources": [
  {"name": "NASA Science · Where Are Voyager 1 and 2 Now?(2026-11-18 02:16:07 PST,16.094 亿英里 / 259.02 亿千米 = 一光日;2026-11-09 取)", "url": "https://science.nasa.gov/mission/voyager/where-are-voyager-1-and-voyager-2-now/"},
  {"name": "NASA Science · Voyager 1: What Is a Light-Day(一光日的定义)", "url": "https://science.nasa.gov/mission/voyager/voyager-1/voyager-1-what-is-a-light-day/"},
  {"name": "NASA JPL 新闻 2026-10-29 · NASA's Voyager 1 Conserves Power, Resolves Brief Communications Pause(61 155 km/h;往返 48 小时;「你好」要等两天)", "url": "https://www.jpl.nasa.gov/news/nasas-voyager-1-conserves-power-resolves-brief-communications-pause"},
  {"name": "NASA/JPL Horizons 星历(Voyager 1,-31;地心距离与变化率 2026–2027;日心 172.38 AU、16.88 km/s)", "url": "https://ssd.jpl.nasa.gov/horizons/"},
  {"name": "BIPM · SI Brochure(光速 c=299 792 458 m/s 为定义值)", "url": "https://www.bipm.org/en/publications/si-brochure"},
  {"name": "IAU 2012 Resolution B2(天文单位 = 149 597 870 700 m)", "url": "https://www.iau.org/static/resolutions/IAU2012_English.pdf"}],
 "review": "AI 审 + 脚本复算(voyager_build.py;待有领域审稿人再复核);一光日 %.0f km = %.4f AU;Horizons 插值跨越时刻与 NASA 公布相差 %.2f 小时;此刻地心距离变化率 %.1f km/s;拟合周期振幅 %.3f AU,残差最大 %.4f AU" % (LD, LD_AU, x_cross * 24, DDOT_T0, amp, res),
 "ai_generated": "标题、钩子、推导文字、检查题由 AI 撰写;距离数据取自 NASA/JPL Horizons,线性外推与拟合列为本站计算(近似);无图片"}
dump('cards/sh.l2.voyager.json', card)
idx = json.load(open(OUT + 'cards/index.json'))
if 'sh.l2.voyager.json' not in idx: idx.append('sh.l2.voyager.json')
json.dump(idx, open(OUT + 'cards/index.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('ok LD=%.0f km %.4f AU Y0=%.4f v=%.3f km/s/yr=%.3e km %.3f AU LT/day=%.2f s LT/yr=%.1f min' % (LD, LD_AU, Y0, V_JPL, D_PER_YR_KM, D_PER_YR_AU, LT_PER_DAY_S, LT_PER_YR_H * 60))
print('cross Horizons %.3f d (%.2f h) ddot=%.2f naive=%.1f d true=%.1f d range %.1f..%.1f' % (x_cross, x_cross * 24, DDOT_T0, naive_days, true_days, dmin, dmax))
print('fit a=%.4f b=%.4f c=%.4f d=%.4f amp=%.3f res=%.4f  2ld in %.1f yr' % (fa, fb, fc, fd, amp, res, LD / D_PER_YR_KM))
