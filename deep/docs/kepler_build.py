# 深空 2.5「模型炼炉 · 开普勒」:生成 deep/data/jpl.planets.kepler.json(八大行星 a、T、σT、μ),并复算胶囊真值。
# 运行:在仓库根目录 python3 deep/docs/kepler_build.py(只用标准库,无网络请求)
# 一手来源(2026-11-09 取):
#   JPL SSD「Approximate Positions of the Planets」Table 1(1800–2050 AD,Standish & Williams 1992):
#     a0(au)与平黄经变率 L̇(deg/儒略世纪);恒星周期 T = 360°/(L̇/100 年) = 36000/L̇(儒略年)
#     https://ssd.jpl.nasa.gov/planets/approx_pos.html
#   NASA NSSDCA Planetary Fact Sheet(2025-03-18 版):行星质量(10^24 kg);Sun Fact Sheet:太阳质量 1,988,400 ×10^24 kg
#     https://nssdc.gsfc.nasa.gov/planetary/factsheet/
#   JPL Small-Body Database API(full-prec=1):1 Ceres(orbit 48,历元 JD 2461200.5)a、per;134340 Pluto(历元 JD 2457588.5)a、per
#     https://ssd-api.jpl.nasa.gov/sbdb.api?sstr=Ceres&full-prec=1
import json
OUT = 'deep/'
REL = 2e-4   # 教学相对误差 σT/T,理由见 meta.note
MSUN = 1988400.0  # 10^24 kg
P = [  # 名称, a0 (au), L̇ (deg/Cy), 质量 (10^24 kg)
    ("水星", 0.38709927, 149472.67411175, 0.330),
    ("金星", 0.72333566, 58517.81538729, 4.87),
    ("地球(地月质心)", 1.00000261, 35999.37244981, 5.97 + 0.073),
    ("火星", 1.52371034, 19140.30268499, 0.642),
    ("木星", 5.20288700, 3034.74612775, 1898),
    ("土星", 9.53667594, 1222.49362201, 568),
    ("天王星", 19.18916464, 428.48202785, 86.8),
    ("海王星", 30.06992276, 218.45945325, 102),
]
rows = []
for n, a, ld, m in P:
    T = 36000.0 / ld
    rows.append([n, a, round(T, 7), float('%.2g' % (REL * T)), float('%.4g' % (m / MSUN))])
assert abs(rows[2][2] - 1.0000174) < 1e-6          # 地球 ≈ 1 年
assert abs(rows[4][2] - 11.8626068) < 1e-6         # 木星
assert abs(rows[7][2] - 164.7903053) < 1e-6        # 海王星
meta = {
    "id": "jpl.planets.kepler",
    "title": "八大行星 半长轴 a 与恒星公转周期 T(JPL 近似轨道根数)",
    "source": "JPL SSD「Approximate Positions of the Planets」Table 1(1800–2050 AD;Standish & Williams 1992);行星质量:NASA NSSDCA Planetary Fact Sheet 2025-03-18 版",
    "url": "https://ssd.jpl.nasa.gov/planets/approx_pos.html",
    "license": "NASA/JPL 公开数据(美国政府作品),署名 NASA/JPL SSD 与 NSSDCA;仅数值摘录,errT 与 mu 为本站计算",
    "retrieved": "2026-11-09",
    "unit": "a: au;T、errT: 儒略年;mu: 行星质量/太阳质量",
    "ai_generated": False,
    "note": "T = 36000/L̇(L̇ 为平黄经变率,deg/儒略世纪);地球一行为地月质心。errT 不是测量误差(L̇ 的统计精度约 10⁻⁵):这些根数是 1800–2050 年的最佳拟合值而非二体轨道,行星互相摄动使 T/a^1.5 偏离二体关系可达 6×10⁻⁴(海王星),本站取教学相对误差 σT/T = 2×10⁻⁴。mu = 质量/1.9884×10³⁰ kg(地月合计 6.043×10²⁴ kg)。由 docs/kepler_build.py 生成。",
}
json.dump({"meta": meta, "columns": ["name", "a", "T", "errT", "mu"], "rows": rows},
          open(OUT + 'data/jpl.planets.kepler.json', 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
# 胶囊真值(JPL SBDB 密切根数;per 为天)
for nm, a, per in [("谷神星", 2.765552595034094, 1679.853119758983), ("冥王星", 39.58862938517124, 90981.71647718345)]:
    T = per / 365.25
    print(nm, 'a=%.6f' % a, 'T=%.6f 年' % T, 'σ(教学)=%.2g' % (REL * T), 'a^1.5=%.6f' % a ** 1.5)
for r in rows: print(r)
