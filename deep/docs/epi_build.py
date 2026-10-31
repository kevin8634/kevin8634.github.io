# 深空 1.7 第三条航线「一场疫情的数学」:生成 deep/routes/epi.json,并复算文中数字
import json, math
d = json.load(open('deep/data/jhu.covid.italy.2020mar.json'))['rows']
r = (d[14][3] - d[0][3]) / 14 * math.log(10)          # 拟合列前 14 天斜率 → 每日增长率
Td = math.log(2) / r; R0it = 1 + r * 7                 # SIR 早期近似 R0≈1+rD,D=7 天
assert abs(r - 0.262) < 0.002 and abs(Td - 2.64) < 0.02
h3 = 1 - 1 / 3; assert abs(h3 - 0.667) < 0.001
f = math.exp(0.3 / 7 * 30); assert abs(f - 3.62) < 0.02     # ΔR0=0.3、D=7、30 天 → 3.62 倍
AI = "文字由 AI 撰写;数值由脚本复算(epi_build.py);无图片"
RV = "AI 审 + 脚本复算(待有领域审稿人再复核)"
DIS = "仅为科学科普计算,不构成医疗或公共卫生建议;真实疫情请以卫生部门发布为准。"
NOTE = "由总指挥添加,AI 协助编写。"
S = []
S.append({"world": "ma", "id": "rt.epi.1", "title": "第 1 站 · 星图:一个人传几个,决定了曲线有多陡",
 "formula": "I(t)\\approx I_0\\,e^{rt},\\;r=\\frac{R_0-1}{D}",
 "hook": "2020 年 3 月初,意大利的确诊数大约每 %.1f 天翻一倍。翻倍为什么这么快?" % Td,
 "steps": [
  {"text": "每个感染者在患病的 D 天里平均传给 R₀ 个人。新增感染减去康复,早期病例按指数增长,增长率 r=(R₀−1)/D。", "tex": "\\frac{dI}{dt}=\\frac{R_0}{D}I-\\frac{1}{D}I=rI"},
  {"text": "指数增长画在对数坐标上是一条直线,斜率就是 r。意大利前 14 天拟合出 r≈%.3f/天,翻倍时间 ln2/r≈%.1f 天。" % (r, Td), "tex": "T_2=\\frac{\\ln 2}{r}\\approx%.1f\\,\\text{天}" % Td},
  {"text": "若取患病期 D≈7 天,反推 R₀≈1+rD≈%.1f。R₀ 一旦小于 1,r 变负,曲线就开始下降。" % R0it, "tex": "R_0\\approx1+rD\\approx%.1f" % R0it}],
 "chart": {"data": "jhu.covid.italy.2020mar.json", "x": "day", "ys": [{"col": "log10_cases", "label": "实测 log₁₀N"}, {"col": "model", "label": "指数拟合(前 14 天)"}], "type": "scatter", "xlabel": "距 2020-02-24 天数", "ylabel": "log₁₀ 累计确诊"},
 "lab": {"title": "调 R₀,看翻倍有多快", "note": NOTE + "早期指数近似,未计入易感者减少;纵轴是从 1 例开始的 log₁₀ 病例数。",
  "params": [{"k": "R", "label": "基本再生数 R₀", "min": 0.5, "max": 6, "step": 0.1, "value": 2.8, "unit": ""}, {"k": "D", "label": "患病期 D", "min": 3, "max": 14, "step": 1, "value": 7, "unit": "天"}],
  "fn": {"x": "x", "from": 0, "to": 60, "ys": [{"label": "log₁₀ 病例数", "expr": "(R-1)/D*x/log(10)"}]},
  "readout": [{"label": "每日增长率 r", "expr": "(R-1)/D", "unit": "/天"}, {"label": "翻倍时间", "expr": "D*log(2)/max(R-1,0.0001)", "unit": "天"}, {"label": "30 天后病例", "expr": "exp((R-1)/D*30)", "unit": "例(从 1 例起)"}],
  "verdict": [{"when": "R-1", "text": "R₀>1:病例呈指数增长。"}, {"when": "1", "text": "R₀≤1:传播链在缩短,疫情消退。"}]},
 "check": {"q": "R₀ 从 3 降到 0.9,早期曲线会怎样?", "options": ["增长变慢但仍增长", "从增长变为下降", "不变"], "answer": 1, "why": "r=(R₀−1)/D,R₀<1 时 r 为负,病例数指数下降。"},
 "uses": "指数函数、对数、微分方程", "textbook": "大学《数学建模》传染病模型", "disclaimer": DIS,
 "sources": [{"name": "JHU CSSE COVID-19 Data Repository(CC BY 4.0)", "url": "https://github.com/CSSEGISandData/COVID-19"}], "review": RV, "ai_generated": AI})
S.append({"world": "ls", "id": "rt.epi.2", "title": "第 2 站 · 生命源码:一个细胞里,病毒怎样变成成千上万",
 "formula": "N_n=(b\\,p)^n",
 "hook": "人与人之间的 R₀ 背后,是细胞与细胞之间的又一次指数增长。",
 "steps": [
  {"text": "病毒自己不会复制。它进入细胞,借细胞的核糖体和原料造出新病毒,一个被感染的细胞会释放出 b 个病毒颗粒(爆发量)。", "tex": "1\\;\\text{细胞}\\to b\\;\\text{病毒}"},
  {"text": "释放出的病毒大多被免疫系统清除或找不到细胞,只有比例 p 能感染新细胞。每一代被感染的细胞数乘以 b·p,这就是细胞层面的「再生数」。", "tex": "R_{\\rm cell}=b\\,p"},
  {"text": "R_cell>1 时感染在体内扩散;抗病毒药和抗体做的事,就是把 p 压低,让 R_cell 跌到 1 以下。", "tex": "N_n=(b\\,p)^n"}],
 "lab": {"title": "爆发量与命中率", "note": NOTE + "b、p 为示意范围,不同病毒差异很大;纵轴是第 n 代被感染细胞数的 log₁₀。",
  "params": [{"k": "b", "label": "每个细胞释放病毒 b", "min": 10, "max": 1000, "step": 10, "value": 100, "unit": "个"}, {"k": "p", "label": "成功感染比例 p", "min": 0.001, "max": 0.1, "step": 0.001, "value": 0.03, "unit": ""}],
  "fn": {"x": "x", "from": 0, "to": 10, "ys": [{"label": "log₁₀ 感染细胞数", "expr": "x*log(b*p)/log(10)"}]},
  "readout": [{"label": "细胞再生数 b·p", "expr": "b*p", "unit": ""}, {"label": "6 代后感染细胞", "expr": "(b*p)^6", "unit": "个"}],
  "verdict": [{"when": "b*p-1", "text": "b·p>1:感染在体内扩散。"}, {"when": "1", "text": "b·p≤1:感染被压住,逐代减少。"}]},
 "check": {"q": "抗病毒药主要通过什么让感染停下来?", "options": ["让每个细胞释放更多病毒", "降低病毒成功感染新细胞的比例,使 b·p<1", "让病毒变大"], "answer": 1, "why": "只要每一代的倍数小于 1,感染细胞数就逐代减少。"},
 "uses": "等比数列、指数", "textbook": "大学《微生物学》病毒复制周期", "disclaimer": DIS,
 "sources": [{"name": "Roizman B. Multiplication, in Baron S (ed.) Medical Microbiology 4th ed., NCBI Bookshelf", "url": "https://www.ncbi.nlm.nih.gov/books/NBK8181/"}], "review": RV, "ai_generated": AI})
S.append({"world": "lt", "id": "rt.epi.3", "title": "第 3 站 · 觉弈:多少人免疫,链条才会断?",
 "formula": "h=1-\\frac{1}{R_0}",
 "hook": "你打不打疫苗,改变的不只是你自己的风险。这是一场所有人一起下的棋。",
 "steps": [
  {"text": "若人群中比例 v 已免疫,一个感染者只能传给 R₀(1−v) 个人。这叫有效再生数 R_eff。", "tex": "R_{\\rm eff}=R_0(1-v)"},
  {"text": "让 R_eff<1,需要 v>1−1/R₀,这就是群体免疫阈值。R₀=3 时约 %.0f%%,R₀ 越大门槛越高。" % (h3 * 100), "tex": "v>h=1-\\frac{1}{R_0}"},
  {"text": "从博弈看:别人都免疫时,自己不免疫也安全,于是人人都想「搭便车」;可搭车的人多了,R_eff 回到 1 以上,所有人一起输。", "tex": "\\text{个人最优}\\neq\\text{集体最优}"}],
 "lab": {"title": "把免疫比例推过门槛", "note": NOTE + "假设人群均匀混合、免疫完全有效;真实情况更复杂。",
  "params": [{"k": "R", "label": "基本再生数 R₀", "min": 1.1, "max": 8, "step": 0.1, "value": 3, "unit": ""}, {"k": "v", "label": "已免疫比例 v", "min": 0, "max": 0.99, "step": 0.01, "value": 0.5, "unit": ""}],
  "fn": {"x": "x", "from": 1.1, "to": 8, "ys": [{"label": "群体免疫阈值 1−1/R₀", "expr": "1-1/x"}, {"label": "当前免疫比例 v", "expr": "v+0*x"}], "mark": [{"x": "R", "label": "此病"}]},
  "readout": [{"label": "群体免疫阈值", "expr": "(1-1/R)*100", "unit": "%"}, {"label": "有效再生数 R_eff", "expr": "R*(1-v)", "unit": ""}],
  "verdict": [{"when": "R*(1-v)-1", "text": "R_eff>1:仍会扩散,还差 {{(1-1/R-v)*100}}% 的人。"}, {"when": "1", "text": "R_eff<1:传播链断开,未免疫的人也被保护。"}]},
 "check": {"q": "R₀=4 的疾病,群体免疫阈值约是多少?", "options": ["25%", "50%", "75%"], "answer": 2, "why": "h=1−1/4=0.75。"},
 "uses": "不等式、博弈论(公共品与搭便车)", "textbook": "大学《博弈论》公共品博弈;《流行病学》", "disclaimer": DIS,
 "sources": [{"name": "Fine, Eames & Heymann (2011) “Herd Immunity”: A Rough Guide, Clin Infect Dis", "url": "https://doi.org/10.1093/cid/cir007"}], "review": RV, "ai_generated": AI})
S.append({"world": "ps", "id": "rt.epi.4", "title": "第 4 站 · 奇点前夜:模型为什么总在给区间?",
 "formula": "\\frac{N'}{N}=e^{\\frac{\\Delta R_0}{D}T}",
 "hook": "疫情初期,不同模型的预测能差好几倍。不是谁算错了,是指数在放大误差。",
 "steps": [
  {"text": "早期很难测准 R₀。若估计值偏了 ΔR₀,增长率就偏了 ΔR₀/D,误差随时间被指数放大。", "tex": "\\Delta r=\\frac{\\Delta R_0}{D}"},
  {"text": "R₀ 只差 0.3、患病期 7 天,30 天后的预测就会差 %.1f 倍。所以负责任的模型给的是区间和情景,而不是一个数。" % f, "tex": "e^{0.3/7\\times30}\\approx%.2f" % f},
  {"text": "AI 模型也逃不开:训练数据只覆盖过去,行为与政策一变,参数就变。预测越远,越要配合持续的新数据去修正。", "tex": "\\text{预测}=\\text{模型}+\\text{假设}+\\text{不确定性}"}],
 "lab": {"title": "误差会长多大", "note": NOTE + "只看 R₀ 误差在指数增长期的放大,D 取 7 天。",
  "params": [{"k": "e", "label": "R₀ 估计误差 ΔR₀", "min": 0, "max": 1, "step": 0.05, "value": 0.3, "unit": ""}, {"k": "T", "label": "预测多远", "min": 5, "max": 90, "step": 5, "value": 30, "unit": "天"}],
  "fn": {"x": "x", "from": 0, "to": 90, "ys": [{"label": "预测偏差倍数", "expr": "exp(e/7*x)"}], "mark": [{"x": "T", "label": "预测点"}]},
  "readout": [{"label": "偏差倍数", "expr": "exp(e/7*T)", "unit": "倍"}],
  "verdict": [{"when": "exp(e/7*T)-2", "text": "偏差超过 2 倍:这么远的预测只能给区间和情景。"}, {"when": "1", "text": "偏差在 2 倍以内:短期预测还算可用。"}]},
 "check": {"q": "为什么疫情模型常给出很宽的预测区间?", "options": ["建模的人不认真", "参数的小误差在指数增长中被迅速放大", "电脑算力不够"], "answer": 1, "why": "N∝e^{rt},r 的小偏差随 t 指数放大。"},
 "uses": "指数、误差传播、模型不确定性", "textbook": "大学《数学建模》敏感性分析", "disclaimer": DIS,
 "sources": [{"name": "Holmdahl & Buckee (2020) Wrong but Useful — What Covid-19 Epidemiologic Models Can and Cannot Tell Us, NEJM", "url": "https://doi.org/10.1056/NEJMp2016822"}], "review": RV, "ai_generated": AI})
J = {"id": "epi", "title": "一场疫情的数学", "badge": "断链者", "color": "#ff9a8f", "tagline": "一个人传几个,决定了所有人的冬天。", "stops": S}
json.dump(J, open('deep/routes/epi.json', 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print('ok r=%.4f Td=%.2f R0=%.2f h3=%.3f f=%.2f' % (r, Td, R0it, h3, f))
