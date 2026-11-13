# -*- coding: utf-8 -*-
"""深空 1.11 星河补齐 + 第 7 条航线「那块骨头有多老」(c14)
生成 deep/cards/<w>.he.<topic>.json ×7 与 deep/routes/c14.json,并用脚本复算断言卡内数值。
运行:python3 deep/docs/he2_c14_build.py(在仓库根目录)
"""
import json, math, os

ROOT = os.path.join(os.path.dirname(__file__), "..")
OUT_C = os.path.join(ROOT, "cards")
OUT_R = os.path.join(ROOT, "routes")
G0 = 9.80665
REV = "2026-11-14"

def close(a, b, rel=5e-3):
    assert abs(a - b) <= rel * abs(b), (a, b)

# ---------------- 复算 ----------------
def irr_month(f, n):
    A = 1 / n + f; lo, hi = 0.0, 0.5
    for _ in range(200):
        i = (lo + hi) / 2
        pv = sum(A / (1 + i) ** k for k in range(1, n + 1))
        lo, hi = (i, hi) if pv > 1 else (lo, i)
    return i

i12 = irr_month(0.006, 12)
close(12 * i12, 0.13034); close((1 + i12) ** 12 - 1, 0.13842)
close(24 * 12 * 0.006 / 13, 0.13292)
# 单利近似 vs IRR 名义年化:f 0.3–1%,n 3–24 时差值 ≤0.6 个百分点
mx = 0
for f in [x / 1000 for x in range(3, 11)]:
    for n in range(3, 25):
        mx = max(mx, 24 * n * f / (n + 1) - 12 * irr_month(f, n))
assert 0.014 < mx < 0.015, mx  # 最大差 1.47 个百分点(f=1%、n=24)

v50 = 50 / 3.6
F06 = 70 * v50 ** 2 / (2 * 0.6); F005 = 70 * v50 ** 2 / (2 * 0.05)
close(F06, 11252.6); close(F005, 135031); close(F06 / G0, 1147.4); close(v50 ** 2 / (2 * 0.6) / G0, 16.39)
close((60 / 50) ** 2, 1.44)

ppm = 10 * 1.0 * 0.05 * 1000 / 5 / 2.90  # 10 mL×1 g/mL×5% → mg Cl2;5 m³;NIOSH 1 ppm=2.90 mg/m³
close(ppm, 34.48)

assert 2 ** (120 / 20) == 64 and 2 ** (360 / 20) == 262144

close(26 ** 8, 2.088e11); close(26 ** 15 / 1e11 / 31557600, 531.5)
assert 95 ** 8 > 26 ** 10 and 26 ** 12 > 95 ** 8

p = 0.01
close(1 - (1 - p) ** 100, 0.63397); close(math.log(0.1) / math.log(1 - p), 229.1); close((1 - (1 - p) ** 90) / p, 59.53)

th = 3474.8 / 384400
close(math.degrees(th) * 60, 31.08); close(24 / th, 2655); close(600 * th / 24, 0.226); close(24 * th / 24 * 3000, 27.1)

T = 5700; TL = 5568
tau = T / math.log(2); close(tau, 8223.4)
lam = math.log(2) / (T * 365.25 * 86400)
Nc = 6.02214076e23 / 12.011 * 1.2e-12
close(Nc, 6.017e10); close(lam * Nc, 0.2318); close(lam * Nc * 60, 13.91)
close(-tau * math.log(0.01), 37870); close(tau / math.sqrt(10000), 82.2)
close(1 - 2 ** (-1 / T), 1.2160e-4)

AI = "标题、钩子、步骤文字、坑、检查题由 AI 撰写;数值由脚本复算(he2_c14_build.py);无图片"
LAYER = "星河·成人"

cards = []

# ---------------- 01 星图 ma ----------------
cards.append({
 "id": "ma.he.installment", "world": "ma", "layer_name": LAYER, "link_task": "ma.epidemic", "tab": "分期的真实年化",
 "uses": "星辰层等比数列与指数增长;平均数",
 "title": "分期每期手续费 0.6%,年化真的只有 7.2% 吗?",
 "hook": "12 期分期,每期手续费 0.6%,乘 12 是 7.2%。可你借的钱每个月都在变少,手续费却按全额收。",
 "formula": "r_{单利}\\approx\\frac{24nf}{n+1}",
 "steps": [
  {"text": "借 P 元分 n 期,每期还本金 P/n,另付手续费 f·P。手续费始终按最初的全额计算。", "tex": "A=\\frac{P}{n}+fP"},
  {"text": "「月费率×12」只看手续费占全额的比例:f=0.6% 时是 7.2%。", "tex": "12f=7.2\\%"},
  {"text": "可你真正占用的本金越来越少:第 1 个月占用 P,最后一个月只占 P/n,平均约 P(n+1)/(2n)。", "tex": "\\bar P=\\frac{n+1}{2n}P"},
  {"text": "总手续费 nfP 除以「平均占用本金 × 年数 n/12」,就是按单利折算的年化。", "tex": "r_{单利}=\\frac{nfP}{\\bar P\\cdot n/12}=\\frac{24nf}{n+1}"},
  {"text": "代入 f=0.6%、n=12:约 13.3%,接近标称的两倍。", "tex": "\\frac{24\\times12\\times0.6\\%}{13}\\approx13.3\\%"},
  {"text": "人民银行要求按内部收益率法(IRR)或注明单利来明示年化。按 IRR 复算:名义年化约 13.0%,按月复利折算约 13.8%。", "tex": "\\sum_{k=1}^{n}\\frac{A}{(1+i)^k}=P"}
 ],
 "check": {"q": "同样每期 0.6%,分期期数从 12 期改成 24 期,真实年化会怎样?", "options": ["变成一半", "基本不变,略升", "翻倍"], "answer": 1,
           "why": "24nf/(n+1) 随 n 增大只缓慢趋向 24f:12 期约 13.3%,24 期约 13.8%。期数长了,总手续费却多了一倍。"},
 "lab": {
  "title": "标称费率 vs 真实年化",
  "note": "由总指挥添加,AI 协助编写。实验台用单利近似 24nf/(n+1);脚本复算:f 0.3%–1%、n 3–24 期范围内比 IRR 名义年化高 0.01–1.5 个百分点(费率越高、期数越长差得越多)。备选利率是你自己填的对照值。",
  "params": [
   {"k": "f", "label": "每期手续费", "min": 0.3, "max": 1.0, "step": 0.05, "value": 0.6, "unit": "%"},
   {"k": "n", "label": "分期期数", "min": 3, "max": 24, "step": 1, "value": 12, "unit": "期"},
   {"k": "b", "label": "你的备选年化(对照)", "min": 2, "max": 24, "step": 0.5, "value": 6, "unit": "%"}
  ],
  "fn": {"x": "x", "from": 3, "to": 24, "step": 1,
         "ys": [{"label": "单利年化(%)", "expr": "24*x*f/(x+1)"}, {"label": "标称 月费率×12(%)", "expr": "12*f"}],
         "mark": [{"x": "n", "label": "你的期数"}]},
  "readout": [
   {"label": "标称", "expr": "12*f", "unit": "%"},
   {"label": "单利年化", "expr": "24*n*f/(n+1)", "unit": "%"},
   {"label": "每借 1 万总手续费", "expr": "n*f*100", "unit": "元"}
  ],
  "verdict": [
   {"when": "24*n*f/(n+1)-b", "text": "分期年化约 {{24*n*f/(n+1)}}%,高于你的备选 {{b}}%。只看「每期 {{f}}%」会低估将近一半。"},
   {"when": "1", "text": "分期年化约 {{24*n*f/(n+1)}}%,不高于你的备选 {{b}}%。比较时用年化,别用每期费率。"}
  ]
 },
 "pitfalls": [
  "「免息」不等于免费:只要有手续费,就要折成年化再比较。",
  "单利近似和 IRR 有差别;合同上应载明年化利率,以合同为准。",
  "提前还款时,已付手续费通常不退,真实年化会更高。"
 ],
 "disclaimer": "只作数学演示,不构成财务建议。",
 "textbook": "人教A版(2019)高中数学选择性必修第二册 第四章 数列(等差、等比数列求和);必修第一册 第四章 指数函数",
 "sources": [
  {"name": "中国人民银行公告〔2021〕第3号(所有贷款产品均应明示年化利率;附件:IRR 计算示例)", "url": "https://www.gov.cn/zhengce/zhengceku/2021-03/31/content_5597156.htm"}
 ],
 "review": "AI 撰写 + 脚本复算(he2_c14_build.py,待 01 星图审校、王磊抽检):f=0.6%、n=12:单利 13.29%,IRR 月 1.0862%、名义 13.03%、复利 13.84%;n=3/6/24 单利 10.80/12.34/13.82%,IRR 名义 10.77/12.24/13.27%",
 "ai_generated": AI
})

# ---------------- 02 宙律 nv ----------------
cards.append({
 "id": "nv.he.seatbelt", "world": "nv", "layer_name": LAYER, "link_task": "nv.hoop", "tab": "撞车时的力",
 "uses": "星辰层匀变速运动 v²=2ad;牛顿第二定律",
 "title": "50 km/h 撞车,用手撑得住吗?",
 "hook": "不系安全带的人常说:真撞了我用手撑住。算一算,撑住要多大的力。",
 "formula": "\\bar F=\\frac{mv^2}{2d}",
 "steps": [
  {"text": "撞车时人要在一段距离 d 内从车速 v 停下。把减速看成匀减速。", "tex": "v^2=2\\bar a d"},
  {"text": "平均力 = 质量 × 平均减速度。", "tex": "\\bar F=m\\bar a=\\frac{mv^2}{2d}"},
  {"text": "50 km/h ≈ 13.9 m/s,体重 70 kg。系好安全带、车头吸能,人约在 0.6 m 内停下(示例值):平均力约 11 kN。", "tex": "\\bar F\\approx1.1\\times10^4\\,\\text{N}"},
  {"text": "这相当于托住约 1.1 吨的重物,平均减速度约 16 g。安全带把力分散到骨盆和胸廓。", "tex": "\\bar F/g\\approx1150\\,\\text{kg}"},
  {"text": "不系安全带,人会继续前冲,撞上方向盘或挡风玻璃时只剩约 5 cm 缓冲(示例值):平均力约 135 kN,是前者的 12 倍。", "tex": "\\frac{0.6}{0.05}=12"},
  {"text": "力与 v² 成正比:车速从 50 提到 60 km/h,力变为 1.44 倍。", "tex": "(60/50)^2=1.44"}
 ],
 "check": {"q": "车速不变,缓冲距离从 0.6 m 缩到 0.3 m,平均力会怎样?", "options": ["不变", "变成 2 倍", "变成 4 倍"], "answer": 1,
           "why": "F=mv²/(2d),d 减半,F 加倍。安全带、气囊、吸能车身都是在加长 d。"},
 "lab": {
  "title": "车速、缓冲距离与平均力",
  "note": "由总指挥添加,AI 协助编写。只算平均力;真实碰撞的峰值力更高,且与车型、坐姿有关。缓冲距离为示例值。",
  "params": [
   {"k": "v", "label": "车速", "min": 10, "max": 120, "step": 5, "value": 50, "unit": "km/h"},
   {"k": "m", "label": "体重", "min": 30, "max": 120, "step": 5, "value": 70, "unit": "kg"},
   {"k": "d", "label": "缓冲距离", "min": 0.02, "max": 1.0, "step": 0.01, "value": 0.6, "unit": "m"}
  ],
  "fn": {"x": "x", "from": 10, "to": 120,
         "ys": [{"label": "此缓冲距离(kN)", "expr": "m*(x/3.6)^2/(2*d)/1000"}],
         "mark": [{"x": "v", "label": "此车速"}]},
  "readout": [
   {"label": "平均力", "expr": "m*(v/3.6)^2/(2*d)/1000", "unit": "kN"},
   {"label": "相当于托住", "expr": "m*(v/3.6)^2/(2*d)/9.80665", "unit": "kg"},
   {"label": "平均减速度", "expr": "(v/3.6)^2/(2*d)/9.80665", "unit": "g"}
  ],
  "verdict": [
   {"when": "0.1-d", "text": "缓冲只有 {{d*100}} cm,平均力约 {{m*(v/3.6)^2/(2*d)/1000}} kN,相当于托住 {{m*(v/3.6)^2/(2*d)/9.80665}} kg。这是撞上硬物的情形。"},
   {"when": "1", "text": "缓冲 {{d*100}} cm,平均力仍约 {{m*(v/3.6)^2/(2*d)/1000}} kN,相当于托住 {{m*(v/3.6)^2/(2*d)/9.80665}} kg。手臂不是用来接这个力的。"}
  ]
 },
 "pitfalls": [
  "「车速慢一点没关系」:力按 v² 增长,30% 的提速带来约 69% 的力。",
  "后排也要系:没系的后排乘客会在碰撞中冲向前排。",
  "平均力只是下限,碰撞中的峰值往往高得多。"
 ],
 "disclaimer": "简化物理模型,只作科学演示;请遵守交通法规,前后排都系好安全带。",
 "textbook": "人教版(2019)高中物理必修第一册 第二章 匀变速直线运动的研究、第四章 运动和力的关系;选择性必修第一册 第一章 动量守恒定律",
 "sources": [
  {"name": "WHO 道路交通伤害事实清单(2026-07-20):系安全带可将车内乘员死亡风险降低最多 50%;平均车速每升 1%,致命事故风险升 4%", "url": "https://www.who.int/news-room/fact-sheets/detail/road-traffic-injuries"}
 ],
 "review": "AI 撰写 + 脚本复算(he2_c14_build.py,待 02 宙律审校、王磊抽检;安全类卡):70 kg、50 km/h:d=0.6 m 平均力 11.25 kN(1147 kg,16.4 g);d=0.05 m 135.0 kN;60/50 km/h 力比 1.44",
 "ai_generated": AI
})

# ---------------- 03 元素工坊 ef ----------------
cards.append({
 "id": "ef.he.bleachmix", "world": "ef", "layer_name": LAYER, "link_task": "ef.battery", "tab": "84 不能混洁厕灵",
 "uses": "星辰层氧化还原反应;物质的量与气体浓度",
 "title": "84 消毒液和洁厕灵一起倒,浴室里会有多少氯气?",
 "hook": "一个想「双倍干净」,把两瓶一起倒进马桶。门关着,浴室只有几立方米。",
 "formula": "\\text{NaClO}+2\\text{HCl}\\rightarrow\\text{NaCl}+\\text{Cl}_2\\uparrow+\\text{H}_2\\text{O}",
 "steps": [
  {"text": "84 消毒液的有效成分是次氯酸钠 NaClO;很多洁厕灵含盐酸 HCl。两者相遇,ClO⁻ 与 Cl⁻ 发生归中反应,放出氯气。", "tex": "\\text{ClO}^-+\\text{Cl}^-+2\\text{H}^+\\rightarrow\\text{Cl}_2+\\text{H}_2\\text{O}"},
  {"text": "标签上的「有效氯含量」就是按氯气质量折算的:每 1 g 溶液最多放出 w 克 Cl₂。", "tex": "m_{\\text{Cl}_2}\\le V\\rho w"},
  {"text": "示例:倒了 10 mL、有效氯 5%(以你家瓶子标签为准),密度按 1 g/mL,最多约 500 mg 氯气。", "tex": "10\\times1\\times5\\%=0.5\\,\\text{g}"},
  {"text": "关门的浴室约 5 m³,全部扩散后约 100 mg/m³。", "tex": "500/5=100\\,\\text{mg/m}^3"},
  {"text": "按 NIOSH 的换算 1 ppm = 2.90 mg/m³,约 34 ppm。", "tex": "100/2.90\\approx34\\,\\text{ppm}"},
  {"text": "NIOSH:氯气 15 分钟上限 0.5 ppm,「立即威胁生命健康」浓度 10 ppm。就算只放出一成,也已超过 15 分钟上限。", "tex": "34\\,\\text{ppm}>10\\,\\text{ppm}"}
 ],
 "check": {"q": "误把两种清洁剂混在一起,闻到刺激味,第一步该做什么?", "options": ["再加水稀释", "立刻离开并开窗通风", "用另一种清洁剂中和"], "answer": 1,
           "why": "先让人离开、让空气流动。加水或再加别的清洁剂可能放出更多气体。出现咳嗽、胸闷等症状要就医。"},
 "lab": {
  "title": "倒多少,房间多大,氯气多浓",
  "note": "由总指挥添加,AI 协助编写。上限估算:按有效氯全部变成氯气、均匀分布在房间里;真实释放比例与混合方式、通风有关。不要动手验证。",
  "params": [
   {"k": "V", "label": "倒入的 84 消毒液", "min": 1, "max": 100, "step": 1, "value": 10, "unit": "mL"},
   {"k": "w", "label": "有效氯含量(看标签)", "min": 1, "max": 7, "step": 0.5, "value": 5, "unit": "%"},
   {"k": "R", "label": "房间体积", "min": 2, "max": 30, "step": 1, "value": 5, "unit": "m³"},
   {"k": "q", "label": "释放比例", "min": 1, "max": 100, "step": 1, "value": 100, "unit": "%"}
  ],
  "fn": {"x": "x", "from": 1, "to": 100,
         "ys": [{"label": "氯气浓度(ppm)", "expr": "x*w/100*1000*q/100/R/2.90"}, {"label": "IDLH 10 ppm", "expr": "10+0*x"}],
         "mark": [{"x": "V", "label": "倒入量"}]},
  "readout": [
   {"label": "氯气", "expr": "V*w/100*1000*q/100", "unit": "mg"},
   {"label": "浓度", "expr": "V*w/100*1000*q/100/R/2.90", "unit": "ppm"},
   {"label": "是 15 分钟上限的", "expr": "V*w/100*1000*q/100/R/2.90/0.5", "unit": "倍"}
  ],
  "verdict": [
   {"when": "V*w/100*1000*q/100/R/2.90-10", "text": "约 {{V*w/100*1000*q/100/R/2.90}} ppm,超过 NIOSH 的 IDLH 10 ppm(立即威胁生命健康)。"},
   {"when": "V*w/100*1000*q/100/R/2.90-0.5", "text": "约 {{V*w/100*1000*q/100/R/2.90}} ppm,超过 NIOSH 15 分钟上限 0.5 ppm,会刺激眼睛和呼吸道。"},
   {"when": "1", "text": "约 {{V*w/100*1000*q/100/R/2.90}} ppm,低于 0.5 ppm。可这是把释放比例或用量调得很低的结果,真实情况别赌。"}
  ]
 },
 "pitfalls": [
  "「味道散了就没事」:氯气比空气重(相对密度 2.47),会在低处积聚。",
  "不只是洁厕灵:84 与其他酸性清洁剂混用同样危险。",
  "上限估算假设全部放出;即使只放出一小部分,在小房间里也会超标。"
 ],
 "disclaimer": "只作科学演示,不要动手验证。若误混,立即离开、开窗通风;出现咳嗽、胸闷、呼吸困难等症状请就医。",
 "textbook": "人教版(2019)高中化学必修第一册 第一章 第三节 氧化还原反应;第二章 第二节 氯及其化合物、第三节 物质的量",
 "sources": [
  {"name": "NIOSH Pocket Guide to Chemical Hazards: Chlorine(1 ppm = 2.90 mg/m³;IDLH 10 ppm;REL 上限 0.5 ppm/15 分钟;相对气体密度 2.47)", "url": "https://www.cdc.gov/niosh/npg/npgd0115.html"}
 ],
 "review": "AI 撰写 + 脚本复算(he2_c14_build.py,待 03 元素工坊审校、王磊抽检;安全类卡):10 mL × 1 g/mL × 5% = 500 mg Cl₂;5 m³ → 100 mg/m³ = 34.5 ppm",
 "ai_generated": AI
})

# ---------------- 04 生命源码 ls ----------------
cards.append({
 "id": "ls.he.leftovers", "world": "ls", "layer_name": LAYER, "link_task": "ls.virus", "tab": "剩菜放多久",
 "uses": "星辰层指数增长;细菌分裂繁殖",
 "title": "剩菜在桌上放 2 小时和放 6 小时,细菌差多少倍?",
 "hook": "晚饭剩了半盘,等凉透再放冰箱,还是马上放?凉透要好几个小时。",
 "formula": "N=N_0\\cdot2^{t/t_d}",
 "steps": [
  {"text": "细菌靠分裂繁殖:一个变两个,两个变四个。每隔一个「倍增时间」t_d,数量翻一倍。", "tex": "N=N_0\\cdot2^{t/t_d}"},
  {"text": "美国农业部 USDA:在 4–60 °C 的「危险区」,细菌数量最快约 20 分钟翻一倍。", "tex": "t_d\\approx20\\,\\text{min}"},
  {"text": "按最快速度算,放 2 小时翻了 6 次:64 倍。", "tex": "2^{120/20}=64"},
  {"text": "放 6 小时翻了 18 次:约 26 万倍。时间只多了 2 倍,细菌多了 4000 多倍。", "tex": "2^{18}=262144"},
  {"text": "所以 USDA 的规则是:剩菜离开冷藏不超过 2 小时;气温高于 32 °C 时不超过 1 小时。分装到浅盒里能凉得更快。", "tex": "t\\le2\\,\\text{h}"}
 ],
 "check": {"q": "倍增时间是 20 分钟,放 4 小时比放 2 小时,细菌多几倍?", "options": ["2 倍", "6 倍", "64 倍"], "answer": 2,
           "why": "多出的 2 小时又翻了 6 次:2⁶=64。指数增长里,时间是加法,倍数是乘法。"},
 "lab": {
  "title": "放置时间与细菌倍数",
  "note": "由总指挥添加,AI 协助编写。理想指数增长模型:未计停滞期和营养耗尽;倍增时间因菌种、温度而异,20 分钟是 USDA 给出的最快情形。纵轴为倍数的以 10 为底的对数。",
  "params": [
   {"k": "td", "label": "倍增时间", "min": 20, "max": 120, "step": 5, "value": 20, "unit": "分钟"},
   {"k": "t", "label": "放置时间", "min": 0.5, "max": 12, "step": 0.5, "value": 2, "unit": "小时"}
  ],
  "fn": {"x": "x", "from": 0, "to": 12,
         "ys": [{"label": "log₁₀ 倍数", "expr": "x*60/td*0.30103"}],
         "mark": [{"x": "t", "label": "放置"}, {"x": "2", "label": "2 小时线"}]},
  "readout": [
   {"label": "翻倍次数", "expr": "t*60/td", "unit": "次"},
   {"label": "细菌倍数", "expr": "2^(t*60/td)", "unit": "倍"}
  ],
  "verdict": [
   {"when": "t-2", "text": "放了 {{t}} 小时,超过 USDA 的 2 小时线;按倍增 {{td}} 分钟算,细菌约为原来的 {{2^(t*60/td)}} 倍。"},
   {"when": "1", "text": "{{t}} 小时内,仍在 USDA 的 2 小时线内(气温高于 32 °C 时线是 1 小时)。"}
  ]
 },
 "pitfalls": [
  "「凉透了再放冰箱更好」:慢慢凉的那几个小时正好落在危险区。",
  "闻起来没坏不代表安全:致病菌不一定改变气味。",
  "模型只算倍数;一开始有多少细菌,取决于食物和操作是否干净。"
 ],
 "disclaimer": "只作科学演示,不构成医疗或食品安全指导;以当地食品安全机构的建议为准。",
 "textbook": "人教版(2019)高中生物选择性必修 3 第一章 发酵工程(微生物的培养);人教A版(2019)高中数学必修第一册 第四章 指数函数",
 "sources": [
  {"name": "USDA FSIS「Danger Zone (40 °F – 140 °F)」(细菌最快约 20 分钟翻倍;离开冷藏不超过 2 小时,高于 90 °F 不超过 1 小时)", "url": "https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/food-safety-basics/danger-zone-40f-140f"}
 ],
 "review": "AI 撰写 + 脚本复算(he2_c14_build.py,待 04 生命源码审校、王磊抽检;健康类卡):t_d=20 min:2 h → 2⁶=64 倍,6 h → 2¹⁸=262144 倍",
 "ai_generated": AI
})

# ---------------- 05 奇点前夜 ps ----------------
cards.append({
 "id": "ps.he.password", "world": "ps", "layer_name": LAYER, "link_task": "ps.cat", "tab": "密码多长才够",
 "uses": "星辰层乘法原理与指数;对数",
 "title": "密码加长 2 位,还是加上符号,哪个更难猜?",
 "hook": "网站要求「必须包含大小写、数字和符号」。可真正让电脑猜不动的,是另一件事。",
 "formula": "N=A^{L},\\quad t\\approx\\frac{N}{2R}",
 "steps": [
  {"text": "随机密码有 L 位,每位从 A 个字符里选:所有组合 N = A^L。", "tex": "N=A^L"},
  {"text": "电脑每秒能试 R 次;平均试到一半就会命中。", "tex": "t\\approx\\frac{N}{2R}"},
  {"text": "NIST 举例:8 位纯小写约 2000 亿种组合,一台现代笔记本每秒可试约 1000 亿次,几秒钟就能试完。", "tex": "26^8\\approx2.1\\times10^{11}"},
  {"text": "15 位纯小写:约 1.7×10²¹ 种,同样速度要试 500 多年才能试完。", "tex": "26^{15}\\approx1.7\\times10^{21}"},
  {"text": "比较:8 位全键盘字符 95⁸≈6.6×10¹⁵,还比不过 12 位纯小写 26¹²≈9.5×10¹⁶。位数在指数上,字符集在底数上。", "tex": "L\\log A"},
  {"text": "所以 NIST SP 800-63B-4 要求:单独使用的密码至少 15 位,且不得强制要求混合字符类型;配合第二重验证时至少 8 位。", "tex": "L\\ge15"}
 ],
 "check": {"q": "哪个随机密码更难猜?", "options": ["8 位,大小写+数字+符号(95 种字符)", "12 位,全小写(26 种字符)", "一样难"], "answer": 1,
           "why": "95⁸≈6.6×10¹⁵ < 26¹²≈9.5×10¹⁶。多 4 位小写比换成全键盘更管用。"},
 "lab": {
  "title": "长度、字符集与破解时间",
  "note": "由总指挥添加,AI 协助编写。只适用于随机生成的密码;单词、生日、泄露过的密码会被优先猜中。每秒猜测次数为示例(NIST 举例约 10¹¹),实际取决于网站如何存储密码。纵轴为平均破解年数的以 10 为底的对数。",
  "params": [
   {"k": "L", "label": "密码位数", "min": 4, "max": 24, "step": 1, "value": 8, "unit": "位"},
   {"k": "A", "label": "字符种类(10 数字 / 26 小写 / 62 字母数字 / 95 全键盘)", "min": 10, "max": 95, "step": 1, "value": 26, "unit": "种"},
   {"k": "r", "label": "每秒猜测 10 的几次方", "min": 6, "max": 14, "step": 1, "value": 11, "unit": ""}
  ],
  "fn": {"x": "x", "from": 4, "to": 24, "step": 1,
         "ys": [{"label": "此字符集 log₁₀ 年", "expr": "(x*log(A)-log(2)-r*log(10)-log(31557600))/log(10)"},
                {"label": "纯小写 log₁₀ 年", "expr": "(x*log(26)-log(2)-r*log(10)-log(31557600))/log(10)"}],
         "mark": [{"x": "L", "label": "你的位数"}]},
  "readout": [
   {"label": "组合数", "expr": "A^L", "unit": "种"},
   {"label": "熵", "expr": "L*log(A)/log(2)", "unit": "比特"},
   {"label": "平均破解", "expr": "A^L/2/10^r", "unit": "秒"},
   {"label": "约合", "expr": "A^L/2/10^r/31557600", "unit": "年"}
  ],
  "verdict": [
   {"when": "L-14.5", "text": "{{L}} 位,达到 NIST 对单独使用密码的 15 位下限;按示例速度平均约 {{A^L/2/10^r/31557600}} 年。"},
   {"when": "1", "text": "{{L}} 位,不到 15 位;按示例速度平均约 {{A^L/2/10^r/31557600}} 年。试试多加几位,和换字符集比一比。"}
  ]
 },
 "pitfalls": [
  "「P@ssw0rd」看着复杂,其实在常用密码清单里,第一批就会被猜中。",
  "同一个密码多处使用:一处泄露,处处失守。",
  "能开第二重验证(短信、验证器、通行密钥)就开。"
 ],
 "disclaimer": "只作数学演示;账户安全请以各平台和权威机构的指引为准。",
 "textbook": "人教A版(2019)高中数学选择性必修第三册 第六章 计数原理;必修第一册 第四章 指数函数与对数函数",
 "sources": [
  {"name": "NIST SP 800-63B-4(2025)§3.1.1.2 Password Verifiers(单因素至少 15 位;多因素至少 8 位;不得强制组成规则)", "url": "https://pages.nist.gov/800-63-4/sp800-63b.html"},
  {"name": "NIST「How Do I Create a Good Password?」(8 位小写约 2000 亿种;笔记本每秒约 1000 亿次;15 位需 500 多年)", "url": "https://www.nist.gov/cybersecurity-and-privacy/how-do-i-create-good-password"}
 ],
 "review": "AI 撰写 + 脚本复算(he2_c14_build.py,待 05 奇点前夜审校):26⁸=2.088×10¹¹;26¹⁵/10¹¹ 秒 = 531.5 年(试完全部);95⁸=6.63×10¹⁵ < 26¹²=9.54×10¹⁶",
 "ai_generated": AI
})

# ---------------- 06 觉弈 lt ----------------
cards.append({
 "id": "lt.he.gacha", "world": "lt", "layer_name": LAYER, "link_task": "lt.survivor", "tab": "1% 抽 100 次",
 "uses": "星辰层独立事件与对立事件;对数",
 "title": "抽中概率 1%,抽 100 次一定能中吗?",
 "hook": "页面公示:稀有道具概率 1%。抽 100 次,心里觉得「该来了」。",
 "formula": "P(\\ge1)=1-(1-p)^n",
 "steps": [
  {"text": "每次抽取相互独立(没有保底时),一次抽不中的概率是 1−p。", "tex": "P(\\text{一次不中})=1-p"},
  {"text": "n 次全不中:(1−p)^n。至少中一次用对立事件。", "tex": "P(\\ge1)=1-(1-p)^n"},
  {"text": "p=1%、n=100:约 63.4%。有三分之一多的人抽 100 次一个也没有。", "tex": "1-0.99^{100}\\approx63.4\\%"},
  {"text": "想有九成把握,要抽多少次?解对数不等式:约 230 次。", "tex": "n\\ge\\frac{\\ln0.1}{\\ln0.99}\\approx229.1"},
  {"text": "平均要抽 1/p=100 次才中第一次;但「平均」掩盖了运气差的那一大截。", "tex": "E=\\frac1p=100"},
  {"text": "若有 k 次保底,平均次数变为 (1−(1−p)^k)/p:1%、90 次保底时约 59.5 次。", "tex": "\\frac{1-0.99^{90}}{0.01}\\approx59.5"}
 ],
 "check": {"q": "已经连抽 99 次没中(无保底),第 100 次中的概率是?", "options": ["很高,该来了", "仍然是 1%", "约 63%"], "answer": 1,
           "why": "每次独立,过去的结果不改变下一次。63% 是「100 次里至少中一次」,在开抽之前算的。"},
 "lab": {
  "title": "抽多少次,有几成把握",
  "note": "由总指挥添加,AI 协助编写。假设每次独立、概率固定且没有保底;有保底或概率递增的规则以官方公示为准。每次花费为示例值。",
  "params": [
   {"k": "p", "label": "公示概率", "min": 0.1, "max": 10, "step": 0.1, "value": 1, "unit": "%"},
   {"k": "n", "label": "打算抽", "min": 1, "max": 500, "step": 1, "value": 100, "unit": "次"},
   {"k": "c", "label": "每次花费(示例)", "min": 1, "max": 30, "step": 1, "value": 10, "unit": "元"}
  ],
  "fn": {"x": "x", "from": 1, "to": 500,
         "ys": [{"label": "至少中一次(%)", "expr": "100*(1-(1-p/100)^x)"}, {"label": "九成线", "expr": "90+0*x"}],
         "mark": [{"x": "n", "label": "你的次数"}, {"x": "log(0.1)/log(1-p/100)", "label": "九成"}]},
  "readout": [
   {"label": "至少中一次", "expr": "100*(1-(1-p/100)^n)", "unit": "%"},
   {"label": "全落空", "expr": "100*(1-p/100)^n", "unit": "%"},
   {"label": "九成把握需", "expr": "log(0.1)/log(1-p/100)", "unit": "次"},
   {"label": "九成把握花费", "expr": "c*log(0.1)/log(1-p/100)", "unit": "元"}
  ],
  "verdict": [
   {"when": "100*(1-(1-p/100)^n)-90", "text": "{{n}} 次至少中一次的概率约 {{100*(1-(1-p/100)^n)}}%,已过九成;仍有 {{100*(1-p/100)^n}}% 的人一无所获。"},
   {"when": "1", "text": "{{n}} 次只有约 {{100*(1-(1-p/100)^n)}}% 的把握;要九成把握需约 {{log(0.1)/log(1-p/100)}} 次,按示例约 {{c*log(0.1)/log(1-p/100)}} 元。"}
  ]
 },
 "pitfalls": [
  "「抽了这么多,下一发该出了」:无保底时每次独立,这是赌徒谬误。",
  "期望 100 次不等于 100 次内一定中:约 37% 的人会落空。",
  "先看公示规则:概率、保底次数、是否递增,都会改变结果。"
 ],
 "disclaimer": "只作概率演示,不鼓励消费;请理性安排开支。",
 "textbook": "人教A版(2019)高中数学必修第二册 第十章 概率(事件的相互独立性);选择性必修第三册 第七章 7.4 二项分布",
 "sources": [
  {"name": "文化部关于规范网络游戏运营加强事中事后监管工作的通知(文市发〔2016〕32号,要求公示随机抽取概率)", "url": "https://zwgk.mct.gov.cn/zfxxgkml/scgl/202012/t20201206_918193.html"}
 ],
 "review": "AI 撰写 + 脚本复算(he2_c14_build.py,待 06 觉弈审校、王磊抽检;消费类卡):p=1%:100 次 63.40%;九成需 229.1 次;90 次保底平均 59.53 次",
 "ai_generated": AI
})

# ---------------- 07 天枢 sh ----------------
cards.append({
 "id": "sh.he.moonlens", "world": "sh", "layer_name": LAYER, "link_task": "sh.moon", "tab": "拍月亮要多长焦",
 "uses": "星辰层弧度制与小角近似;相似三角形",
 "title": "手机拍月亮,要多长的镜头才能拍满画面?",
 "hook": "眼前的月亮又大又亮,拍出来却只是画面里的一个小白点。",
 "formula": "s=f\\,\\theta,\\quad\\theta=\\frac{D}{d}",
 "steps": [
  {"text": "月亮直径 D≈3475 km,平均距离 d≈384 400 km。小角近似下,它张开的角度 θ=D/d。", "tex": "\\theta=\\frac{3474.8}{384400}\\approx0.00904\\,\\text{rad}"},
  {"text": "换成角分约 31′,大约半度。伸直手臂,小指指甲盖就能挡住它。", "tex": "\\theta\\approx31'\\approx0.52^\\circ"},
  {"text": "镜头把角度变成底片上的长度:像的直径 s = 焦距 f × θ。", "tex": "s=f\\theta"},
  {"text": "常见手机主摄约等效 24 mm(全画幅 36×24 mm 口径):月亮的像只有 0.22 mm,不到画面高度的 1%。3000 像素高的照片里约 27 像素。", "tex": "24\\times0.00904\\approx0.22\\,\\text{mm}"},
  {"text": "等效 600 mm 长焦:像约 5.4 mm,占画面高度约 23%。", "tex": "600\\theta\\approx5.4\\,\\text{mm}"},
  {"text": "要让月亮顶满画面高度,需要约 2650 mm 的等效焦距。", "tex": "f=\\frac{24}{\\theta}\\approx2655\\,\\text{mm}"}
 ],
 "check": {"q": "焦距从 300 mm 换成 600 mm,月亮在照片里的直径会怎样?", "options": ["不变", "变成 2 倍", "变成 4 倍"], "answer": 1,
           "why": "s=fθ,像的直径与焦距成正比;面积才是 4 倍。"},
 "lab": {
  "title": "焦距与月亮的大小",
  "note": "由总指挥添加,AI 协助编写。焦距按全画幅等效计,画面高度 24 mm;数码变焦只是裁切放大,不增加细节。月地距离 35.6–40.7 万千米(NASA)。",
  "params": [
   {"k": "f", "label": "等效焦距", "min": 13, "max": 3000, "step": 1, "value": 24, "unit": "mm"},
   {"k": "d", "label": "月地距离", "min": 356, "max": 407, "step": 1, "value": 384, "unit": "千千米"},
   {"k": "H", "label": "照片高度", "min": 1000, "max": 8000, "step": 100, "value": 3000, "unit": "像素"}
  ],
  "fn": {"x": "x", "from": 13, "to": 3000,
         "ys": [{"label": "月亮占画面高度(%)", "expr": "min(100,x*3474.8/(d*1000)/24*100)"}],
         "mark": [{"x": "f", "label": "你的焦距"}]},
  "readout": [
   {"label": "张角", "expr": "3474.8/(d*1000)*180/pi*60", "unit": "角分"},
   {"label": "像的直径", "expr": "f*3474.8/(d*1000)", "unit": "mm"},
   {"label": "占画面高度", "expr": "f*3474.8/(d*1000)/24*100", "unit": "%"},
   {"label": "约", "expr": "f*3474.8/(d*1000)/24*H", "unit": "像素"}
  ],
  "verdict": [
   {"when": "f*3474.8/(d*1000)/24-1", "text": "月亮比画面还高,只能拍到局部:等效 {{f}} mm 已超过顶满所需的 {{24/(3474.8/(d*1000))}} mm。"},
   {"when": "f*3474.8/(d*1000)/24-0.3", "text": "月亮约占画面高度 {{f*3474.8/(d*1000)/24*100}}%,环形山能拍出来了。"},
   {"when": "1", "text": "月亮只占画面高度约 {{f*3474.8/(d*1000)/24*100}}%,约 {{f*3474.8/(d*1000)/24*H}} 像素。不如把月亮放进风景里,拍它和地面的关系。"}
  ]
 },
 "pitfalls": [
  "数码变焦把像素放大,并不增加细节。",
  "近地点和远地点月亮的视直径相差约 12%,不是两倍。",
  "月亮很亮,自动曝光常把它拍成一团白;试着降低曝光。"
 ],
 "disclaimer": "只作科学演示;拍摄时注意安全,不要用相机直接对准太阳。",
 "textbook": "人教A版(2019)高中数学必修第一册 第五章 5.1.2 弧度制;人教版(2019)高中物理选择性必修第一册 第四章 光",
 "sources": [
  {"name": "NASA NSSDCA Moon Fact Sheet(体积平均半径 1737.4 km;半长轴 0.3844×10⁶ km;距离约 35.7–40.7 万千米)", "url": "https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html"}
 ],
 "review": "AI 撰写 + 脚本复算(he2_c14_build.py,待 07 天枢审校):θ=3474.8/384400=0.009040 rad=31.08′;24 mm → 0.217 mm、27.1 px/3000;600 mm → 22.6%;顶满需 2655 mm;近/远地点 0.009565/0.008569 rad",
 "ai_generated": AI
})

# ---------------- 航线 c14 ----------------
RAI = "文字由 AI 撰写;数值由脚本复算(he2_c14_build.py);无图片"
RREV = "AI 审 + 脚本复算(待有领域审稿人再复核)"
route = {
 "id": "c14", "title": "那块骨头有多老", "badge": "测年人", "color": "#c8e07f",
 "tagline": "你呼吸的碳里,藏着一只停不下来的钟。",
 "stops": [
  {"world": "ef", "id": "rt.c14.1", "title": "第 1 站 · 元素工坊:碳 14 从哪来、到哪去?",
   "formula": "N=N_0\\cdot2^{-t/T_{1/2}}",
   "hook": "大气里一直在生产一种「会坏掉」的碳。它坏掉的速度,稳得像一只钟。",
   "steps": [
    {"text": "宇宙射线在高空撞出中子,中子打中氮 14,换出一个质子,变成碳 14。", "tex": "^{14}\\text{N}+n\\rightarrow{}^{14}\\text{C}+p"},
    {"text": "碳 14 会 β⁻ 衰变回氮 14:一个中子变成质子,放出电子和反中微子。", "tex": "^{14}\\text{C}\\rightarrow{}^{14}\\text{N}+e^-+\\bar\\nu_e"},
    {"text": "半衰期 5700±30 年(LNHB/DDEP 推荐值):每过 5700 年,剩下一半。", "tex": "N=N_0\\cdot2^{-t/5700}"}
   ],
   "lab": {"title": "剩下多少碳 14",
    "note": "由总指挥添加,AI 协助编写。半衰期取 5700 年。",
    "params": [{"k": "t", "label": "经过时间", "min": 0, "max": 50000, "step": 100, "value": 5700, "unit": "年"}],
    "fn": {"x": "x", "from": 0, "to": 50000, "ys": [{"label": "剩余(%)", "expr": "100*2^(-x/5700)"}], "mark": [{"x": "t", "label": "此时"}]},
    "readout": [{"label": "剩余", "expr": "100*2^(-t/5700)", "unit": "%"}, {"label": "经过半衰期", "expr": "t/5700", "unit": "个"}]},
   "check": {"q": "过了 11 400 年,碳 14 还剩多少?", "options": ["一半", "四分之一", "零"], "answer": 1, "why": "两个半衰期:1/2 × 1/2 = 1/4。它永远不会在某一刻「剩零」。"},
   "uses": "核反应方程、半衰期、指数函数", "textbook": "人教版(2019)高中物理选择性必修第三册 第五章 原子核",
   "sources": [{"name": "LNHB/DDEP 推荐数据 C-14(T½=5700(30) a;β⁻ 100% 至 N-14;产生方式 N-14(n,p)C-14)", "url": "https://www.lnhb.fr/nuclides/C-14_tables.pdf"}],
   "review": RREV, "ai_generated": RAI},
  {"world": "ls", "id": "rt.c14.2", "title": "第 2 站 · 生命源码:活着时上弦,死后开始计时",
   "formula": "A=\\lambda N",
   "hook": "你每吃一口饭、植物每吸一口二氧化碳,都在给这只钟「上弦」。",
   "steps": [
    {"text": "植物光合作用吸收大气 CO₂,动物吃植物。活着时,体内碳 14 与大气保持大致相同的比例,约 1.2×10⁻¹²。", "tex": "^{14}\\text{C}/^{12}\\text{C}\\approx1.2\\times10^{-12}"},
    {"text": "1 克碳里约有 6.0×10¹⁰ 个碳 14 原子。", "tex": "\\frac{6.022\\times10^{23}}{12.011}\\times1.2\\times10^{-12}\\approx6.0\\times10^{10}"},
    {"text": "衰变常数 λ=ln2/T½,活度 A=λN:每克碳每秒约 0.23 次衰变,每分钟约 14 次。", "tex": "A\\approx0.23\\,\\text{Bq/g}"},
    {"text": "生物死后不再吸收新碳,碳 14 只减不增:钟开始走。", "tex": "A(t)=A_0\\cdot2^{-t/5700}"}
   ],
   "lab": {"title": "一块样品每小时衰变几次",
    "note": "由总指挥添加,AI 协助编写。按活体比例 1.2×10⁻¹² 估算;真实大气比例随年代变化,需要校准。",
    "params": [{"k": "m", "label": "样品含碳", "min": 0.1, "max": 10, "step": 0.1, "value": 1, "unit": "克"},
               {"k": "t", "label": "死后经过", "min": 0, "max": 50000, "step": 100, "value": 5000, "unit": "年"}],
    "fn": {"x": "x", "from": 0, "to": 50000, "ys": [{"label": "每小时衰变次数", "expr": "m*0.23185*3600*2^(-x/5700)"}], "mark": [{"x": "t", "label": "此样品"}]},
    "readout": [{"label": "每小时衰变", "expr": "m*0.23185*3600*2^(-t/5700)", "unit": "次"},
                {"label": "碳 14 原子", "expr": "m*6.0166e10*2^(-t/5700)", "unit": "个"}]},
   "check": {"q": "为什么活着的生物体内碳 14 比例基本不变?", "options": ["活体内碳 14 不衰变", "一边衰变,一边从食物和空气中补充", "身体会制造碳 14"], "answer": 1, "why": "衰变一直在发生,但新陈代谢不断补进新碳,所以保持平衡;死后补充停止。"},
   "uses": "光合作用与碳循环、物质的量", "textbook": "人教版(2019)高中生物选择性必修 2 第三章 生态系统及其稳定性(碳循环)",
   "sources": [{"name": "Wikipedia: Carbon-14(天然丰度约 1.2×10⁻¹²)", "url": "https://en.wikipedia.org/wiki/Carbon-14"},
               {"name": "LNHB/DDEP 推荐数据 C-14(T½=5700(30) a)", "url": "https://www.lnhb.fr/nuclides/C-14_tables.pdf"}],
   "review": RREV, "ai_generated": RAI},
  {"world": "lt", "id": "rt.c14.3", "title": "第 3 站 · 觉弈:谁也说不准下一个是谁",
   "formula": "\\frac{\\Delta N}{N}\\approx\\frac{1}{\\sqrt N}",
   "hook": "钟走得极稳,可单看一个原子,它哪年衰变完全是随机的。",
   "steps": [
    {"text": "一个碳 14 原子在一年内衰变的概率只有约 1.2×10⁻⁴,而且与它「活了多久」无关。", "tex": "p=1-2^{-1/5700}\\approx1.2\\times10^{-4}"},
    {"text": "大量原子一起,衰变数服从泊松分布:数到 N 次,相对误差约 1/√N。", "tex": "\\frac{\\Delta N}{N}\\approx\\frac1{\\sqrt N}"},
    {"text": "年龄 t=τ·ln(A₀/A),τ=T½/ln2≈8223 年,所以计数的相对误差直接变成年龄误差:Δt≈τ/√N。", "tex": "\\Delta t\\approx\\frac{8223}{\\sqrt N}\\,\\text{年}"},
    {"text": "数到 1 万次,年龄误差约 ±82 年;想减半,要数 4 万次。", "tex": "\\frac{8223}{\\sqrt{10^4}}\\approx82"}
   ],
   "lab": {"title": "数多少次,年龄才准",
    "note": "由总指挥添加,AI 协助编写。只计计数的统计误差;实际误差还包括本底、校准曲线等。",
    "params": [{"k": "N", "label": "计到的衰变数", "min": 100, "max": 1000000, "step": 100, "value": 10000, "unit": "次"}],
    "fn": {"x": "x", "from": 100, "to": 100000, "ys": [{"label": "年龄误差 ±年", "expr": "8223.4/sqrt(x)"}], "mark": [{"x": "N", "label": "你的计数"}]},
    "readout": [{"label": "相对误差", "expr": "100/sqrt(N)", "unit": "%"}, {"label": "年龄误差", "expr": "8223.4/sqrt(N)", "unit": "± 年"}],
    "verdict": [{"when": "100-8223.4/sqrt(N)", "text": "误差约 ±{{8223.4/sqrt(N)}} 年,可以区分相差一两百年的样品。"},
                {"when": "1", "text": "误差约 ±{{8223.4/sqrt(N)}} 年,还得多数一些。"}]},
   "check": {"q": "一个碳 14 原子已经存在了 1 万年,它下一年衰变的概率和新生的碳 14 比?", "options": ["更大,它「老」了", "一样大", "更小"], "answer": 1, "why": "放射性衰变没有记忆:每个原子每年衰变的概率都相同。"},
   "uses": "独立事件、泊松分布、误差传播", "textbook": "人教A版(2019)高中数学选择性必修第三册 第七章 随机变量及其分布",
   "sources": [{"name": "Bayliss 等综述:Radiocarbon dating(Nature Reviews Methods Primers 2021,作者稿;半衰期 5700±30 年,可测约 5.5 万年内)", "url": "https://eprints.gla.ac.uk/247193/3/247193.pdf"}],
   "review": RREV, "ai_generated": RAI},
  {"world": "ma", "id": "rt.c14.4", "title": "第 4 站 · 星图:用对数读出年龄",
   "formula": "t=\\frac{T_{1/2}}{\\ln2}\\ln\\frac{A_0}{A}",
   "hook": "测出样品还剩多少碳 14,一个对数就把它变成年数。",
   "steps": [
    {"text": "由 A=A₀·2^(−t/T½) 两边取对数,解出 t。", "tex": "t=\\frac{T_{1/2}}{\\ln2}\\ln\\frac{A_0}{A}"},
    {"text": "剩 50%:5700 年;剩 25%:11 400 年;剩 1%:约 37 900 年。", "tex": "8223\\ln100\\approx37870"},
    {"text": "剩得越少越难测,本方法一般用于约 5.5 万年以内。", "tex": "t\\lesssim5.5\\times10^4\\,\\text{年}"},
    {"text": "习惯上「放射性碳年龄」仍按 Libby 半衰期 5568 年计算,再用校准曲线换算成日历年份。", "tex": "T_{\\text{Libby}}=5568"}
   ],
   "lab": {"title": "剩余比例 → 年龄",
    "note": "由总指挥添加,AI 协助编写。两条线分别用 5700 年与 Libby 5568 年;均未经过校准曲线换算。",
    "params": [{"k": "q", "label": "剩余比例", "min": 0.5, "max": 100, "step": 0.5, "value": 50, "unit": "%"}],
    "fn": {"x": "x", "from": 0.5, "to": 100,
           "ys": [{"label": "T½=5700(年)", "expr": "5700/log(2)*log(100/x)"}, {"label": "Libby 5568(年)", "expr": "5568/log(2)*log(100/x)"}],
           "mark": [{"x": "q", "label": "测得"}]},
    "readout": [{"label": "年龄(5700)", "expr": "5700/log(2)*log(100/q)", "unit": "年"},
                {"label": "放射性碳年龄(Libby)", "expr": "5568/log(2)*log(100/q)", "unit": "年"}]},
   "check": {"q": "一块木头剩 25% 的碳 14,它大约多老?", "options": ["2850 年", "11 400 年", "22 800 年"], "answer": 1, "why": "25% = (1/2)²,两个半衰期,约 11 400 年。"},
   "uses": "对数、指数方程", "textbook": "人教A版(2019)高中数学必修第一册 第四章 4.3 对数、4.4 对数函数",
   "sources": [{"name": "Bayliss 等综述:Radiocarbon dating(Nature Reviews Methods Primers 2021,作者稿;Libby 5568±30 年与 5700±30 年)", "url": "https://eprints.gla.ac.uk/247193/3/247193.pdf"},
               {"name": "PMC9805314:Radiocarbon age is just a number(Libby 半衰期仍用于放射性碳年龄)", "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC9805314/"}],
   "review": RREV, "ai_generated": RAI}
 ]
}

# ---------------- 写出 ----------------
for c in cards:
    fn = f"{c['world']}.he.{c['id'].split('.')[-1]}.json"
    assert c["id"].startswith(c["world"] + ".he.")
    with open(os.path.join(OUT_C, fn), "w", encoding="utf-8") as fh:
        json.dump(c, fh, ensure_ascii=False, indent=2); fh.write("\n")
    print("card", fn)
with open(os.path.join(OUT_R, "c14.json"), "w", encoding="utf-8") as fh:
    json.dump(route, fh, ensure_ascii=False, indent=2); fh.write("\n")
print("route c14.json  ALL ASSERTS OK")
