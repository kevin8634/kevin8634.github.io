# 深空 2.5.1「前沿 · 最冷 9.7 pK」:生成 deep/data/frontier.cold.ladder.json 与 deep/cards/nv.l2.cold.json,
# 并复算卡内与冷原子实验柜(deep/front/cold.js)用到的所有数字。
# 运行:在仓库根目录 python3 deep/docs/cold_build.py(只用标准库,无网络请求)
# 一手来源(2026-11-09 用 web_fetch 逐条复核):
#   Xiong et al., Science 2026-11-05, doi:10.1126/science.aea5324 摘要:光偶极阱 BEC,2.0×10⁴ 个原子,等效温度 9.7 pK,自由扩散 7.0 s;
#     前纪录 38 pK、扩散 2 s,「atom-chip-based magnetic traps in microgravity」
#   北京大学新闻网 2026-11-06(https://news.pku.edu.cn/info/2881/3325821.htm):两级交叉光束冷却;2022-10 随梦天舱入轨;通讯作者周小计、陈卫标、陈徐宗
#   中国科学院转载光明日报 2026-11-07(https://www.cas.cn/cm/202611/t20261109_5123775.shtml):全光阱 → 降光强蒸发冷却 → 非绝热扩散深度冷却;
#     较室温低 14 个数量级;观测 7 秒;2011 年论证,历时 15 年;空间应用工程与技术中心牵头,北大 + 上海光机所完成
#   Science 新闻 2026-11-05(Adrian Cho):约 200 万个原子装入 54 μm 内阱,光功率 5 W 降到 0.2 mW 蒸发;再扩散进 124 μm 外阱
#   新华社英文 2026-11-06:地面约 0.05 s、国际空间站约 1 s、中国空间站 7 s;前纪录 38 pK 为德国团队 2021 年
#   Deppner et al., PRL 127, 100401 (2021)(DLR elib 全文 PDF):38 pK 在**德国不来梅落塔**(自由落体 4.74 s)中用原子芯片磁阱 + 物质波透镜取得,
#     约 10.1 万个原子,成像到释放后 2 s ——是地面上的微重力落塔,不是太空
#   Leanhardt et al., Science 301, 1513 (2003) 摘要:450±80 pK,2500 个原子(地面,重力+磁阱)
#   NobelPrize.org 2001 物理奖 popular information:JILA 1995 年铷-87 约 170 nK 开始凝聚,纯凝聚体约 20 nK
#   Fixsen 2009, ApJ 707, 916(arXiv:0911.1955)摘要:CMB 2.72548 ± 0.00057 K
#   NIST TRC《Cryogenics》(Radebaugh):氦正常沸点 4.2 K;0 °C = 273.15 K;NobelPrize.org 昂内斯 Facts:1908 年液化氦
# 2.5.1 修订(2026-11-09 晚,王磊要求补回官方出处 + 02 宙律物理审校 C1–C11;均 web_fetch 原文核对):
#   科技日报 陆成宽 2026-11-09《中国空间站造出的已知最冷物质有什么用》(中国科学院官网转载 https://www.cas.cn/cm/202611/t20261109_5123774.shtml):
#     「7 秒,只挪了约 500 微米,比一根头发丝的直径多不了多少」——记者的比喻,卡上标「科技日报比喻」
#   新华社 2026-11-06 胡喆《迈向绝对零度 中国空间站制备出已知最冷物质》(http://www.news.cn/liangzi/20261106/17556477496541adbef198df07e27e5f/c.html):
#     上海光机所研究员李唐原话「我们需要把二十几束激光精确地汇聚到一个几十微米的原子云上,误差不能超过 5 微米,约十分之一头发丝的粗细」;「比室温低 14 个数量级」
#   中新网 2026-11-06 孙自法(https://www.chinanews.com.cn/gn/2026/11-06/10727573.shtml):陈徐宗「原子的自由扩散速度很慢,达到几十微米/秒……
#     观察时间比地面长两个数量级以上」;「较室温降低了 14 个数量级」
#   Gaaloul et al., Nat. Commun. 13, 7889 (2022)(https://www.nature.com/articles/s41467-022-35274-6,CC BY 4.0):NASA 冷原子实验室(ISS),
#     δ-kick 物质波透镜后 z 方向膨胀能 52 ± 10 pK(单方向);三维总动能约 100 pK ——单方向膨胀能,非三维温度
#   Kovachy et al., PRL 114, 143004 (2015)(arXiv:1407.6995 摘要):斯坦福地面 10 米原子喷泉,铷-87 二维等效温度 < 50(+50/−30) pK
#   Science 论文页:2025-07-12 收稿,2026-10-22 接收,2026-11-05 First Release;原始数据 Zenodo doi:10.5281/zenodo.18217600(CC BY 4.0)
#   前期同行评审:Li et al., Front. Phys. 10, 971059 (2022) 地面深冷方案验证(地面 5 nK,预言在轨 < 100 pK)
import json, math
OUT = 'deep/'
TODAY = '2026-11-09'
TAG = '前沿 · 最冷 9.7 pK'
NOTE = '由总指挥添加,AI 协助编写。'
def dump(path, obj):
    json.dump(obj, open(OUT + path, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))

# ---------------------------------------------------------------- 物理常数(CODATA 2018 / SI 定义)
H = 6.62607015e-34          # J·s,SI 定义值
KB = 1.380649e-23           # J/K,SI 定义值
U = 1.66053906660e-27       # kg,原子质量单位(CODATA 2018)
M = 86.909180527 * U        # kg,⁸⁷Rb 原子质量(AME2020 原子质量 86.909180527 u)
G = 9.80665                 # m/s²,标准重力加速度
T_REC = 9.7e-12             # K
T_OLD = 38e-12
T_ROOM = 300.0

lam = lambda T: H / math.sqrt(2 * math.pi * M * KB * T)       # 热德布罗意波长 m
sv = lambda T: math.sqrt(KB * T / M)                          # 一维均方根速度 m/s
assert abs(lam(T_REC) * 1e6 - 60.1) < 0.3, lam(T_REC)
assert abs(sv(T_REC) * 1e6 - 30.5) < 0.3, sv(T_REC)
assert abs(lam(T_ROOM) * 1e9 - 0.0108) < 0.0005, lam(T_ROOM)
RATIO = T_ROOM / T_REC
assert 3.0e13 < RATIO < 3.2e13            # 约 3.1×10¹³ 倍,lg = 13.49;报道称「低 14 个数量级」(四舍五入口径)
FACTOR_OLD = T_OLD / T_REC
assert 3.8 < FACTOR_OLD < 4.0              # Science 新闻「lowered ... by a factor of four」
DROP_005 = 0.5 * G * 0.05 ** 2            # 地面 0.05 s 下落 m
assert abs(DROP_005 * 1000 - 12.3) < 0.1
DROP_7 = 0.5 * G * 7.0 ** 2               # 地面要自由下落 7 s 需要的高度 m
assert abs(DROP_7 - 240.3) < 0.2
DROP_474 = 0.5 * G * 4.74 ** 2            # 不来梅落塔 4.74 s 对应落差(本站估算,未计弹射与减速段)
SPREAD_7 = sv(T_REC) * 7.0                # 7 s 自由扩散,云半径(1σ)增加约多少 m(本站估算,忽略初始尺寸与相互作用)
assert abs(SPREAD_7 * 1e6 - 213) < 3
LAM_RATIO = lam(T_REC) / lam(T_ROOM)
P0, P1 = 5.0, 0.2e-3                      # W,蒸发:5 W → 0.2 mW(Science 新闻)
assert abs(P0 / P1 - 25000) < 1

# ---------------------------------------------------------------- 百年温度阶梯
NIST = 'https://trc.nist.gov/cryogenics/aboutCryogenicsII.pdf'
ROWS = [
 [1, None, T_ROOM, '室温', '日常房间,约 27 °C(约定值,0 °C = 273.15 K)', 'ref', 'NIST TRC《Cryogenics》(0 °C = 273.15 K;300 K 为本站取的室温约定值)', NIST],
 [2, 1908, 4.2, '液氦', '昂内斯在莱顿第一次把氦变成液体;氦在 1 个大气压下约 4.2 K 沸腾', 'record', 'NIST TRC《Cryogenics》表 1(氦正常沸点 4.2 K);NobelPrize.org 昂内斯 Facts(1908 年液化氦)', NIST],
 [3, None, 2.72548, '宇宙微波背景', '宇宙深空的「底温」:大爆炸余晖', 'ref', 'Fixsen 2009, ApJ 707, 916(2.72548 ± 0.00057 K)', 'https://arxiv.org/abs/0911.1955'],
 [4, 1995, 170e-9, '第一团玻色—爱因斯坦凝聚', 'JILA 用铷-87 在约 170 nK 开始凝聚(纯凝聚体约 20 nK):纳开量级', 'record', 'NobelPrize.org 2001 年物理学奖 popular information', 'https://www.nobelprize.org/prizes/physics/2001/popular-information/'],
 [5, 2003, 450e-12, '首次低于 1 纳开(MIT)', 'MIT 地面实验室:重力与磁场一起托住原子,放松后蒸发到约 2500 个原子,首次低于 1 nK。它不是地面最低:2015 年斯坦福在地面做到二维 < 50 pK,2021 年 38 pK 也在地面落塔里测得', 'record', 'Leanhardt et al., Science 301, 1513 (2003) 摘要(450 ± 80 pK)', 'https://www.science.org/doi/10.1126/science.1088827'],
 [6, 2022, 52e-12, 'NASA 冷原子实验室(单方向)', '国际空间站 NASA 冷原子实验室:原子芯片 + δ-kick 物质波透镜,z 方向膨胀能 52 ± 10 pK。单方向膨胀能,非三维温度(三维总动能约 100 pK)', 'cmp', 'Gaaloul et al., Nat. Commun. 13, 7889 (2022)(开放获取,CC BY 4.0)', 'https://www.nature.com/articles/s41467-022-35274-6'],
 [7, 2015, 50e-12, '斯坦福原子喷泉(二维)', '斯坦福地面 10 米原子喷泉:物质波透镜 + 长飞行,铷-87 二维等效温度 < 50(+50/−30) pK。二维口径,与三维的 38 pK、9.7 pK 不直接比', 'cmp', 'Kovachy et al., PRL 114, 143004 (2015)(arXiv:1407.6995 摘要)', 'https://arxiv.org/abs/1407.6995'],
 [8, 2021, T_OLD, '不来梅落塔', '德国不来梅落塔里自由下落 4.74 s(地面上的微重力落塔):原子芯片磁阱 + 物质波透镜,约 10 万个原子,观察 2 s;三维内部动能 3/2·k_B·38 pK', 'record', 'Deppner et al., PRL 127, 100401 (2021)(DLR 电子图书馆全文)', 'https://elib.dlr.de/144987/1/PhysRevLett.127.100401.pdf'],
 [9, 2026, T_REC, '中国空间站', '梦天舱超冷原子物理实验柜:全光阱,2.0 × 10⁴ 个原子,自由扩散 7.0 s', 'record', 'Xiong et al., Science(2026-11-05 First Release,doi:10.1126/science.aea5324)摘要;原始数据 Zenodo doi:10.5281/zenodo.18217600;北京大学新闻网 2026-11-06', 'https://www.science.org/doi/10.1126/science.aea5324'],
]
for r in ROWS: assert r[2] > 0
SHORT = {1: '室温', 2: '液氦', 3: '宇宙背景', 4: '首个凝聚', 5: '首破 1 nK', 6: 'NASA 单向', 7: '斯坦福二维', 8: '落塔', 9: '空间站'}
rows = [[i, y, T, round(math.log10(T), 4), lab_, SHORT[i], where, kind, src, url] for i, y, T, lab_, where, kind, src, url in ROWS]
assert [r[2] for r in rows] == sorted([r[2] for r in rows], reverse=True)   # 阶梯自上而下单调降温
dump('data/frontier.cold.ladder.json', {"meta": {"id": "frontier.cold.ladder", "title": "百年温度阶梯:从室温到 9.7 皮开",
    "source": "各级数值摘自所列一手来源(每行 source、url 列);lgT 列由本站脚本 deep/docs/cold_build.py 计算",
    "url": "https://www.science.org/doi/10.1126/science.aea5324",
    "license": "事实数值摘录(各行注明出处);整理与 lgT 列为本站作品,CC BY 4.0", "retrieved": TODAY, "unit": "K", "ai_generated": False,
    "note": "i=阶梯序号(1 室温 → 9 空间站);year=取得年份(室温与宇宙微波背景为参照,无年份);T_K=温度(开尔文);lgT=log10(T/K);label/short=名称/短名;where=说明;kind=ref 参照 / record 人造低温里程碑(三维)/ cmp 对照(单方向膨胀能或二维等效温度,口径与三维不同,不直接比高低)。38 pK 与 9.7 pK 为原子云的三维「等效温度」(由释放后膨胀速度换算的内部动能),不是与外界达到热平衡的温度;52 pK 为 NASA 冷原子实验室 z 方向膨胀能(单方向,非三维温度),50 pK 为斯坦福二维等效温度。"},
    "columns": ["i", "year", "T_K", "lgT", "label", "short", "where", "kind", "source", "url"], "rows": rows})

# ---------------------------------------------------------------- 卡片
A_LAM = H / math.sqrt(2 * math.pi * M * KB) * 1e6       # μm·K^0.5
B_SV = math.sqrt(KB / M) * 1e6                          # μm/s·K^-0.5
f6 = lambda x: '%.6g' % x
LAM_E = '%s*10^(-L/2)' % f6(A_LAM)                      # μm
SV_E = '%s*10^(L/2)' % f6(B_SV)                         # μm/s
UP_7 = 0.5 * G * 3.5 ** 2                 # 先上抛再落回、共 7 s 的高度 m(审校 C7)
assert abs(UP_7 - 60.1) < 0.2
P_SPILL = 0.2                             # W,地面托不住的阈值:02 宙律审校粗估(54 μm 束腰,假设 1064 nm),约 5 W 的 4%;示意
S_SPILL = math.log(P_SPILL / P0) / math.log(P1 / P0)   # 实验柜对数光强滑杆上的位置
SRC = {
 'xinhua': 'http://www.news.cn/liangzi/20261106/17556477496541adbef198df07e27e5f/c.html',
 'kjrb': 'https://www.cas.cn/cm/202611/t20261109_5123774.shtml',
 'cns': 'https://www.chinanews.com.cn/gn/2026/11-06/10727573.shtml'}
card = {"id": "nv.l2.cold", "world": "nv", "link_task": "nv.cold", "tag": TAG, "tab": "最冷 9.7 pK", "front": "cold",
 "title": "最冷 9.7 皮开:为什么要到太空里,原子才能更冷?",
 "formula": "\\tfrac12 m\\sigma_v^2=\\tfrac12 k_BT_{\\text{eff}},\\quad \\lambda_{dB}=\\frac{h}{\\sqrt{2\\pi m k_BT}}",
 "hook": "2026 年 11 月,《科学》发表:中国空间站梦天舱的超冷原子物理实验柜,把约 2 万个铷-87 原子冷到等效 9.7 皮开(9.7×10⁻¹² K)——比室温低 14 个数量级,还能放开它们自由扩散 7 秒。上一个纪录 38 皮开是 2021 年在德国不来梅落塔里做的。(科技日报比喻:这团原子 7 秒只挪了约 500 微米,比一根头发丝的直径多不了多少。)一束光就能让原子几乎停下来——温度怎么低到这一步,又为什么非得离开地面?",
 "steps": [
  {"text": "温度就是原子乱跑的快慢。每个方向上,½·m·σᵥ² = ½·k_B·T(σᵥ 是这个方向速度的均方根)。铷-87 一个原子约 1.443×10⁻²⁵ kg;在 9.7 pK,σᵥ ≈ %.0f 微米/秒——一秒只挪约一根细头发丝的一半(头发直径约 50–100 微米)。团队的陈徐宗教授说原子的自由扩散速度「达到几十微米/秒」(中新网),和这个估算一致。室温 300 K 下是约 %.0f 米/秒。" % (sv(T_REC) * 1e6, sv(T_ROOM)),
   "tex": "\\sigma_v=\\sqrt{\\frac{k_BT}{m}}=\\sqrt{\\frac{1.38\\times10^{-23}\\times9.7\\times10^{-12}}{1.443\\times10^{-25}}}\\approx3.0\\times10^{-5}\\,\\text{m/s}"},
  {"text": "比室温冷多少?中国科学院、新华社、中新网的官方说法是「比室温低 14 个数量级」。本站实算:300 K ÷ 9.7 pK ≈ %.1f×10¹³ 倍,lg ≈ %.1f,介于 13 和 14 个数量级之间,报道取整写作 14。它只有宇宙微波背景(2.725 K)的约 %.0f 亿分之一;比 2021 年的 38 pK 再低约 %.1f 倍。" % (RATIO / 1e13, math.log10(RATIO), 2.72548 / T_REC / 1e8, FACTOR_OLD),
   "tex": "\\frac{300\\,\\text{K}}{9.7\\times10^{-12}\\,\\text{K}}\\approx%.1f\\times10^{13},\\quad \\lg\\approx%.1f" % (RATIO / 1e13, math.log10(RATIO))},
  {"text": "怎么测这么低的温度?关掉光阱,让原子云自由飞散,隔一段时间拍一张影子照片,看云团长大得多快:膨胀越慢,温度越低。所以 9.7 pK 是由「单方向」均方根膨胀速度 σᵥ 换算的等效温度 T_eff。云团大小按 σ(t) = √(σ₀² + σᵥ²t²) 变化;初始半径 σ₀ 很小时,7 秒后均方根半径约 σᵥ·t ≈ %.2f 毫米、整团直径约 %.1f 毫米——和科技日报比喻「7 秒只挪约 500 微米、比头发丝直径多不了多少」是同一个量级(一个说半径,一个说直径)。要测得准,就得让云团长时间自由飞——在地面上它会掉下去。" % (SPREAD_7 * 1e3, 2 * SPREAD_7 * 1e3),
   "tex": "T_{\\text{eff}}=\\frac{m\\,\\sigma_v^2}{k_B},\\qquad \\sigma(t)=\\sqrt{\\sigma_0^2+\\sigma_v^2t^2}\\;\\xrightarrow{\\sigma_0\\ll\\sigma_vt}\\;\\sigma_vt\\approx%.2f\\,\\text{mm}" % (SPREAD_7 * 1e3)},
  {"text": "为什么要太空?地面上原子 0.05 秒就下落约 %.0f 毫米,冲出视野;想让它从静止开始自由下落 7 秒,需要约 %.0f 米高的真空管(先往上抛再落回,高度可减到约 %.0f 米)。不来梅落塔提供 4.74 秒微重力,38 pK 就是在那里测的。陈徐宗教授说,空间站里的观察时间「比地面长两个数量级以上」。更要紧的是两件事:在地面,重力把光阱「压歪」,光一弱原子就从低处漏光,蒸发冷却到不了底;而强光阱又让原子挤得紧,放开时相互作用能会转成膨胀动能,等效温度降不下来。空间站里没有「往下拉」,极弱的光就能拢住原子:先把光从约 5 W 降到 0.2 mW 让跑得快的原子蒸发掉,再让原子扩散进更宽的第二束交叉光里(非绝热扩散),相互作用能也降下来。这要求极高的光学精度——上海光机所研究员李唐说:「我们需要把二十几束激光精确地汇聚到一个几十微米的原子云上,误差不能超过 5 微米,约十分之一头发丝的粗细。」(新华社)" % (DROP_005 * 1000, DROP_7, UP_7),
   "tex": "h=\\tfrac12gt^2:\\;t=0.05\\,\\text{s}\\Rightarrow%.1f\\,\\text{mm};\\;t=7\\,\\text{s}\\Rightarrow%.0f\\,\\text{m}" % (DROP_005 * 1000, DROP_7)},
  {"text": "越冷,原子越像波。热德布罗意波长 λ = h/√(2πmk_BT):室温约 %.3f 纳米,比原子还小;按 9.7 pK 换算约 %.0f 微米,长了约 %.0f 万倍。波长长到和原子间距相当时,一个个原子的波叠成同一朵波——玻色—爱因斯坦凝聚。这一步在纳开量级就已发生(1995 年约 170 nK):9.7 pK 时这团原子早已是凝聚体,深冷是让它放开后膨胀得更慢。对凝聚体,这里的 λ 由等效温度换算,只用来比较尺度。下面的实验台拖动温度看它怎么变;侧栏「冷原子实验柜」可以亲手切换重力、调弱光。" % (lam(T_ROOM) * 1e9, lam(T_REC) * 1e6, LAM_RATIO / 1e4),
   "tex": "\\lambda_{dB}(9.7\\,\\text{pK})\\approx%.0f\\,\\mu\\text{m}" % (lam(T_REC) * 1e6)}
 ],
 "check": {"q": "在地面上,要让一团原子从静止开始自由下落整整 7 秒(像空间站里那样一直看着它),需要多高的真空管?",
  "options": ["约 2.4 米", "约 240 米", "约 24 千米"], "answer": 1,
  "why": "h = ½gt² = ½ × 9.8 × 7² ≈ 240 米。这正是要把冷原子实验搬到太空的原因之一:地面上 0.05 秒就看不见了。(若先把原子往上抛再落回,同样 7 秒约需 60 米,仍是一座高塔。)"},
 "chart": {"data": "frontier.cold.ladder.json", "x": "i", "ys": [{"col": "lgT", "label": "lg(温度 / K)"}], "type": "scatter",
  "xlabel": "阶梯:1 室温 · 2 液氦 1908 · 3 宇宙微波背景 · 4 首个凝聚 1995 · 5 首次低于 1 nK 2003(MIT)· 6 NASA 冷原子实验室 52 pK 2022(单方向,非三维)· 7 斯坦福 50 pK 2015(二维)· 8 落塔 38 pK 2021 · 9 空间站 9.7 pK 2026", "ylabel": "lg(T / K)"},
 "lab": {"title": "拖动温度:原子跑多快、像多长的波",
  "note": NOTE + "横轴 lg(T/K),从约 6 pK(−11.2)到室温(约 2.5),9.7 pK 在 −11.01;曲线是铷-87 的热德布罗意波长(微米,取对数)。读数用 CODATA 常数计算;「7 秒后云团均方根半径」按 σ(t)=√(σ₀²+σᵥ²t²) 取初始半径 σ₀→0,忽略相互作用,只是量级估算。",
  "params": [{"k": "L", "label": "lg(温度 / K)", "min": -11.2, "max": 2.5, "step": 0.01, "value": round(math.log10(T_REC), 2), "unit": ""}],
  "fn": {"x": "x", "from": -11.2, "to": 2.5,
   "ys": [{"label": "lg 波长(微米)", "expr": "log(%s)/log(10)" % LAM_E.replace('L', 'x')}],
   "mark": [{"x": "L", "label": "此温度"}, {"x": str(round(math.log10(T_OLD), 3)), "label": "38 pK"}]},
  "readout": [
   {"label": "温度", "expr": "10^L", "unit": "K"},
   {"label": "一维均方根速度", "expr": SV_E, "unit": "微米/秒"},
   {"label": "热德布罗意波长", "expr": LAM_E, "unit": "微米"},
   {"label": "7 秒后云团均方根半径(初始很小时)约", "expr": "7*" + SV_E, "unit": "微米"}],
  "verdict": [
   {"when": "L", "text": "1 K 以上:原子每秒跑几十到几百米,波长不到 1 纳米,完全看不出波动性。"},
   {"when": "L+9", "text": "低温到纳开以上:地面实验室做得到,原子每秒还跑 {{%s}} 微米,波长 {{%s}} 微米。" % (SV_E, LAM_E)},
   {"when": "1", "text": "低于 1 纳开:原子每秒只挪 {{%s}} 微米,波长约 {{%s}} 微米——要靠微重力才能这样慢慢看它飞 7 秒。" % (SV_E, LAM_E)}]},
 "uses": "温度的微观意义(能量均分)、自由落体 h=½gt²、对数与数量级、德布罗意波长",
 "textbook": "初中物理《温度》;高中物理《分子动理论》《自由落体运动》、选择性必修三《波粒二象性》",
 "sources": [
  {"name": "Xiong et al., Quantum gases below 10 picokelvin in space, Science, doi:10.1126/science.aea5324(2025-07-12 收稿,2026-10-22 接收,2026-11-05 First Release,北京时间 11-06 凌晨上线)摘要:2.0×10⁴ 个原子、9.7 pK、7.0 s;前纪录 38 pK / 2 s", "url": "https://www.science.org/doi/10.1126/science.aea5324"},
  {"name": "论文原始数据(图 2、图 3):Zenodo doi:10.5281/zenodo.18217600(CC BY 4.0)", "url": "https://doi.org/10.5281/zenodo.18217600"},
  {"name": "前期同行评审:Li et al., Front. Phys. 10, 971059 (2022) 中国空间站深冷方案与地面实验验证", "url": "https://www.frontiersin.org/journals/physics/articles/10.3389/fphy.2022.971059/full"},
  {"name": "新华社 2026-11-06 胡喆《迈向绝对零度 中国空间站制备出已知最冷物质》(比室温低 14 个数量级;李唐:二十几束激光汇聚到几十微米的原子云上,误差不超过 5 微米)", "url": SRC['xinhua']},
  {"name": "科技日报 2026-11-09 陆成宽《中国空间站造出的已知最冷物质有什么用》,中国科学院官网转载(比喻:7 秒只挪约 500 微米)", "url": SRC['kjrb']},
  {"name": "中新网 2026-11-06《专家解读:中国空间站「超级冰箱」何以创造低温新纪录?》(陈徐宗:自由扩散速度几十微米/秒,观察时间比地面长两个数量级以上)", "url": SRC['cns']},
  {"name": "北京大学新闻网 2026-11-06 · 电子学院周小计、陈徐宗团队在中国空间站获得低于10皮开尔文的超冷量子气体", "url": "https://news.pku.edu.cn/info/2881/3325821.htm"},
  {"name": "中国科学院 · 转载光明日报 2026-11-07《已知最冷人造物质制备成功》(全光阱 → 蒸发冷却 → 非绝热扩散;较室温低 14 个数量级;2011 年论证,历时 15 年)", "url": "https://www.cas.cn/cm/202611/t20261109_5123775.shtml"},
  {"name": "Science 新闻 2026-11-05 · China space experiment creates coldest temperature ever(5 W → 0.2 mW;54 μm 与 124 μm 两级光阱)", "url": "https://www.science.org/content/article/china-space-experiment-creates-coldest-temperature-ever"},
  {"name": "新华社英文 2026-11-06 · China sets world record for coldest temperature aboard space station(地面约 0.05 s、空间站 7 s)", "url": "https://english.news.cn/20261106/176b36efd1d645cd9c6cd4a227904fd5/c.html"},
  {"name": "Deppner et al., PRL 127, 100401 (2021):38 pK 在德国不来梅落塔(自由下落 4.74 s)中取得", "url": "https://elib.dlr.de/144987/1/PhysRevLett.127.100401.pdf"},
  {"name": "Kovachy et al., PRL 114, 143004 (2015):斯坦福地面原子喷泉,二维等效温度 < 50 pK", "url": "https://arxiv.org/abs/1407.6995"},
  {"name": "Gaaloul et al., Nat. Commun. 13, 7889 (2022):NASA 冷原子实验室 z 方向膨胀能 52 ± 10 pK(单方向,非三维温度;三维总动能约 100 pK)", "url": "https://www.nature.com/articles/s41467-022-35274-6"}],
 "review": "AI 审 + 脚本复算(cold_build.py)+ 02 宙律物理审校(2026-11-09,C1–C11 已改);σv(9.7 pK)=%.1f μm/s;λdB=%.1f μm;300 K/9.7 pK=%.2e;38/9.7=%.2f;0.05 s 下落 %.1f mm;7 s 下落 %.1f m(上抛 %.0f m);7 s 均方根半径约 %.0f μm(量级估算)" % (sv(T_REC) * 1e6, lam(T_REC) * 1e6, RATIO, FACTOR_OLD, DROP_005 * 1000, DROP_7, UP_7, SPREAD_7 * 1e6),
 "ai_generated": "标题、钩子、推导文字、检查题由 AI 撰写;引语与比喻逐条注明出处(新华社、中新网、科技日报);温度阶梯数值摘自所列一手来源;无图片,冷原子实验柜画面为程序绘制的教学示意"}
dump('cards/nv.l2.cold.json', card)
idx = json.load(open(OUT + 'cards/index.json'))
if 'nv.l2.cold.json' not in idx: idx.append('nv.l2.cold.json')
json.dump(idx, open(OUT + 'cards/index.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('ok sv=%.2f um/s lam=%.2f um lam300=%.4f nm ratio=%.3e (lg %.2f) old/new=%.2f drop0.05=%.2f mm drop7=%.1f m drop4.74=%.1f m spread7=%.0f um' % (
    sv(T_REC) * 1e6, lam(T_REC) * 1e6, lam(T_ROOM) * 1e9, RATIO, math.log10(RATIO), FACTOR_OLD, DROP_005 * 1000, DROP_7, DROP_474, SPREAD_7 * 1e6))
print('A_LAM=%s B_SV=%s up7=%.1f m S_SPILL=%.4f (P=%.2f W)' % (f6(A_LAM), f6(B_SV), UP_7, S_SPILL, P_SPILL))
