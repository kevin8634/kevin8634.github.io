# 深空 2.2 第六条航线「你身上的碘从哪来」:生成 deep/routes/iod.json 与 deep/data/iaea.a127.isobar.json,并复算文中数字
# 运行:在仓库根目录 python3 deep/docs/iod_build.py(只用标准库)
import json, math
NUC = json.load(open('deep/data/nuclides.json'))
SYM = NUC['sym']
D = {(z, n): (ba, lg) for z, n, ba, lg in NUC['d']}
def ba(z, a): return D[(z, a - z)][0]
def lg(z, a): return D[(z, a - z)][1]
AI = "文字由 AI 撰写;数值由脚本复算(iod_build.py);无图片"
RV = "AI 审 + 脚本复算(待有领域审稿人再复核)"
NOTE = "由总指挥添加,AI 协助编写。"
SUP = str.maketrans('-0123456789', '⁻⁰¹²³⁴⁵⁶⁷⁸⁹')
def sci(x, d=1):
    e = int(math.floor(math.log10(abs(x)))); m = round(x / 10 ** e, d)
    if abs(m) >= 10: m /= 10; e += 1
    return ('%.*f×10' % (d, m)) + str(e).translate(SUP)

# ---------- 站 1 数字:结合能与库仑势垒
BA_FE, BA_NI, BA_I = ba(26, 56), ba(28, 62), ba(53, 127)
assert (BA_FE, BA_NI, BA_I) == (8.7904, 8.7946, 8.4455)
B_FE, B_I = 56 * BA_FE, 127 * BA_I
Q71 = B_I - B_FE                     # Fe-56 + 71n -> 127 核子(先不管 β 衰变)的总结合能增量
per_n = Q71 / 71
assert 8.0 < per_n < 8.3, per_n
def ec(z1, a1, z2, a2): return 1.44 * z1 * z2 / (1.2 * (a1 ** (1 / 3) + a2 ** (1 / 3)))
EC_A_FE = ec(2, 4, 26, 56); EC_P_FE = ec(1, 1, 26, 56)
KT3 = 8.617333e-5 * 3e9 / 1e6       # MeV
assert abs(KT3 - 0.2585) < 0.001
# ---------- 站 2 数字:A=127 同量异位素链
chain = sorted([(z, lg(z, 127)) for z in range(40, 70) if (z, 127 - z) in D], key=lambda x: x[0])
stable127 = [z for z, l in chain if l == 99]
assert stable127 == [53], stable127       # A=127 唯一稳定核素是碘-127
rows = [[z, SYM[str(z)], None if l == 99 else l, ba(z, 127)] for z, l in chain if 45 <= z <= 60]
json.dump({"meta": {"id": "iaea.a127.isobar", "title": "A=127 同量异位素的半衰期(Z=45–60)", "source": "IAEA Nuclear Data Services Live Chart of Nuclides(AME2020/ENSDF),由 deep/data/nuclides.json 导出", "url": "https://www-nds.iaea.org/relnsd/vcharthtml/VChartHTML.html", "license": "IAEA 公开核数据,按 IAEA NDS 署名", "retrieved": "2026-10-30", "unit": "log₁₀ 秒", "ai_generated": False, "note": "lg_t 为基态半衰期的常用对数(秒);碘-127(Z=53)稳定,lg_t 留空;ba 为每核子结合能 MeV"}, "columns": ["Z", "sym", "lg_t", "ba"], "rows": rows}, open('deep/data/iaea.a127.isobar.json', 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
SV = 1e-17                          # ⟨σv⟩ ~1e-17 cm³/s(Thielemann & Cowan 2026)
tau = lambda nn: 1 / (nn * SV)
assert abs(tau(1e20) - 1e-3) < 1e-9 and abs(tau(1e24) - 1e-7) < 1e-12
T_RH, T_IN, T_SN = 10 ** lg(45, 127), 10 ** lg(49, 127), 10 ** lg(50, 127)
T_I129 = 10 ** lg(53, 129) / 3.15576e7 / 1e6   # 百万年
assert abs(T_I129 - 15.6) < 0.4, T_I129
T_I131 = 10 ** lg(53, 131) / 86400
assert abs(T_I131 - 8.0) < 0.2, T_I131
# ---------- 站 3 数字:千新星(Metzger 2019 式 7、24)
def tpk(M, v, k): return 1.6 * (M / 0.01) ** 0.5 * (v / 0.1) ** -0.5 * k ** 0.5      # 天
def lpk(M, v, k, eps=0.5): return 1e41 * (eps / 0.5) * (M / 0.01) ** 0.35 * (v / 0.1) ** 0.65 * k ** -0.65  # erg/s
T_RED, T_BLUE = tpk(0.04, 0.1, 10), tpk(0.02, 0.2, 0.5)
L_RED = lpk(0.04, 0.1, 10)
MSUN_E = 332946.0                    # 太阳质量/地球质量
EJ_EARTH = 0.05 * MSUN_E
# ---------- 站 4 数字:甲状腺里的碘
NA = 6.02214076e23; MI = 126.904; MT4 = 776.87
fI_T4 = 4 * MI / MT4
assert abs(fI_T4 - 0.6534) < 0.001
atoms = lambda mg: mg * 1e-3 / MI * NA
A15, A20 = atoms(15), atoms(20)

S = []
S.append({"world": "nv", "id": "rt.iod.1", "title": "第 1 站 · 宙律:恒星为什么炼不出碘?",
 "formula": "E_C\\approx\\frac{1.44\\,Z_1Z_2}{1.2\\,(A_1^{1/3}+A_2^{1/3})}\\;\\text{MeV}",
 "hook": "恒星把氢一路聚变到铁就熄火了。可你甲状腺里的碘是 53 号元素,比铁重一倍多。它不可能是「烧」出来的,那是怎么来的?",
 "steps": [
  {"text": "结合能曲线在铁镍附近到顶(IAEA:Ni-62 每核子 %.4f MeV,Fe-56 %.4f MeV),碘-127 只有 %.4f MeV。把铁族核再「聚」重,每个核子反而绑得更松,聚变不再放能。" % (BA_NI, BA_FE, BA_I), "tex": "\\tfrac{B}{A}(\\text{I-127})=%.4f<\\tfrac{B}{A}(\\text{Fe-56})=%.4f\\;\\text{MeV}" % (BA_I, BA_FE)},
  {"text": "第二道墙是电:带电粒子要靠近原子核,得翻过库仑势垒。α 粒子撞铁核,势垒约 %.1f MeV;质子约 %.1f MeV。而即使在 30 亿度,热运动的典型能量 kT 也只有约 %.2f MeV,势垒是它的几十倍,而且核电荷越大墙越高。" % (EC_A_FE, EC_P_FE, KT3), "tex": "kT=8.617\\times10^{-5}\\,\\tfrac{\\text{eV}}{\\text{K}}\\times T\\approx%.2f\\,\\text{MeV}\\;(T=3\\times10^9\\,\\text{K})" % KT3},
  {"text": "出路是中子:中子不带电,没有库仑势垒。从铁-56 出发吞下 71 个中子凑到 127 个核子,总结合能增加约 %.0f MeV,平均每吞一个中子放出约 %.1f MeV——每核子的 B/A 虽然下降,一颗一颗加中子却仍然放能。" % (Q71, per_n), "tex": "B(\\text{I-127})-B(\\text{Fe-56})\\approx%.0f\\,\\text{MeV}\\approx71\\times%.1f\\,\\text{MeV}" % (Q71, per_n)}],
 "chart": {"data": "iaea.binding.curve.json", "x": "A", "ys": [{"col": "ba", "label": "实测 B/A"}, {"col": "semf", "label": "液滴模型"}], "type": "scatter", "xlabel": "质量数 A", "ylabel": "B/A (MeV)", "marks": [{"x": 56, "label": "铁-56"}, {"x": 127, "label": "碘-127"}]},
 "lab": {"title": "库仑势垒有多高", "note": NOTE + "α 粒子射向电荷为 Z 的原子核;靶核质量数取 A≈2.3Z 的近似。纵轴为势垒(MeV)。",
  "params": [{"k": "Z", "label": "靶核电荷 Z", "min": 2, "max": 60, "step": 1, "value": 26, "unit": ""}, {"k": "T", "label": "温度 T", "min": 0.1, "max": 10, "step": 0.1, "value": 3, "unit": "×10⁹ K"}],
  "fn": {"x": "x", "from": 2, "to": 60, "y0": 0, "ys": [{"label": "α 粒子的库仑势垒", "expr": "1.44*2*x/(1.2*(4^(1/3)+(2.3*x)^(1/3)))"}, {"label": "质子的库仑势垒", "expr": "1.44*x/(1.2*(1+(2.3*x)^(1/3)))"}, {"label": "中子:没有势垒", "expr": "0*x"}], "mark": [{"x": "Z", "label": "靶核"}]},
  "readout": [{"label": "α 势垒", "expr": "1.44*2*Z/(1.2*(4^(1/3)+(2.3*Z)^(1/3)))", "unit": "MeV"}, {"label": "kT", "expr": "8.617333e-5*T*1e3", "unit": "MeV"}, {"label": "势垒 / kT", "expr": "1.44*2*Z/(1.2*(4^(1/3)+(2.3*Z)^(1/3)))/(8.617333e-5*T*1e3)", "unit": "倍"}],
  "verdict": [{"when": "1.44*2*Z/(1.2*(4^(1/3)+(2.3*Z)^(1/3)))/(8.617333e-5*T*1e3)-20", "text": "势垒是热能的 {{1.44*2*Z/(1.2*(4^(1/3)+(2.3*Z)^(1/3)))/(8.617333e-5*T*1e3)}} 倍:带电粒子只能靠量子隧穿偶尔钻进去。中子不带电,直接走进去。"}, {"when": "1", "text": "核很轻、温度很高时,带电粒子还能聚变——这正是恒星从氢烧到铁的那段路。"}]},
 "check": {"q": "为什么造比铁重的元素要靠中子,而不是继续聚变?", "options": ["中子比质子重", "中子不带电没有库仑势垒,而且每吞一个中子仍放能", "恒星里没有质子了"], "answer": 1, "why": "铁之后聚变不放能,带电粒子又被越来越高的库仑势垒挡住;中子没有势垒,一个个加进去还放出约 8 MeV。"},
 "uses": "结合能、库仑定律、核半径 R≈1.2A^(1/3) fm、热能 kT", "textbook": "大学《原子核物理》《恒星结构与演化》",
 "sources": [{"name": "IAEA Live Chart of Nuclides(AME2020,本站快照 nuclides.json)", "url": "https://www-nds.iaea.org/relnsd/vcharthtml/VChartHTML.html"}, {"name": "Reifarth, Lederer & Käppeler (2014) Neutron reactions in astrophysics, J. Phys. G 41:053101(铁以后的元素主要靠中子俘获)", "url": "https://doi.org/10.1088/0954-3899/41/5/053101"}], "review": RV, "ai_generated": AI})
S.append({"world": "ef", "id": "rt.iod.2", "title": "第 2 站 · 元素工坊:吞中子要多快,才能造出碘?",
 "formula": "\\tau_n=\\frac{1}{n_n\\langle\\sigma v\\rangle}",
 "hook": "原子核吞下中子会变得「太胖」,于是 β 衰变把一个中子变成质子。吞得快还是衰变得快,决定了它走哪条路。",
 "steps": [
  {"text": "吞一个中子的平均等待时间 τ_n 取决于中子密度 n_n。典型 ⟨σv⟩ 约 10⁻¹⁷ cm³/s:n_n=10²⁰、10²²、10²⁴ cm⁻³ 时,τ_n 分别约 10⁻³、10⁻⁵、10⁻⁷ 秒。", "tex": "n_n=10^{20}\\,\\text{cm}^{-3}\\Rightarrow\\tau_n\\approx10^{-3}\\,\\text{s}"},
  {"text": "s 过程(慢)发生在红巨星里,中子密度约 10⁸ cm⁻³ 量级,τ_n 长达数年,原子核总是先 β 衰变,沿稳定线慢慢爬。r 过程(快)中子多到原子核来不及衰变就一口气吞十几、几十个中子,冲到极富中子的一侧。", "tex": "\\tau_n\\ll\\tau_\\beta\\;\\Rightarrow\\;r\\text{ 过程}"},
  {"text": "中子雨停下后,富中子核沿同一个质量数 A 一路 β 衰变。IAEA 数据里 A=127 这一列:铑-127 半衰期约 %s 秒,铟-127 约 %.1f 秒,锡-127 约 %.1f 小时……唯一稳定的是碘-127。所以 A=127 的核最终都变成碘。" % ("%.2f" % T_RH, T_IN, T_SN / 3600), "tex": "{}^{127}\\text{Rh}\\xrightarrow{\\beta^-}\\cdots\\xrightarrow{\\beta^-}{}^{127}\\text{Te}\\xrightarrow{\\beta^-}{}^{127}\\text{I}"},
  {"text": "账本:按 Ellis、Fields 和 Surman 2024 年的计算,地壳中的碘-127 约 96%% 来自 r 过程。它的放射性兄弟碘-129(IAEA 半衰期约 %.1f 百万年)是 r 过程专属的「时钟」,被陨石记录了下来。" % T_I129, "tex": "f_r(^{127}\\text{I})\\approx96\\%"}],
 "chart": {"data": "iaea.a127.isobar.json", "x": "Z", "ys": [{"col": "lg_t", "label": "log₁₀ 半衰期(秒)"}], "type": "scatter", "xlabel": "质子数 Z(A=127)", "ylabel": "log₁₀ 半衰期(秒)", "marks": [{"x": 53, "label": "碘-127 稳定"}]},
 "lab": {"title": "中子雨有多密", "note": NOTE + "横轴为中子密度的对数;纵轴为 log₁₀ 时间(秒)。蓝线是吞一个中子要等多久,其余水平线是 A=127 链上几种核的 β 半衰期(IAEA)。",
  "params": [{"k": "n", "label": "中子密度 log₁₀ n_n", "min": 6, "max": 28, "step": 0.5, "value": 8, "unit": "cm⁻³"}],
  "fn": {"x": "x", "from": 6, "to": 28, "ys": [{"label": "铑-127 β 半衰期", "expr": "%.2f+0*x" % lg(45, 127)}, {"label": "吞一个中子的时间 τ_n", "expr": "17-x"}, {"label": "铟-127 β 半衰期", "expr": "%.2f+0*x" % lg(49, 127)}, {"label": "锡-127 β 半衰期", "expr": "%.2f+0*x" % lg(50, 127)}], "mark": [{"x": "n", "label": "此密度"}]},
  "readout": [{"label": "τ_n", "expr": "10^(17-n)", "unit": "秒"}, {"label": "从铁-56 吞够 71 个中子约需", "expr": "71*10^(17-n)", "unit": "秒(不计途中衰变)"}],
  "verdict": [{"when": "%.2f-(17-n)" % lg(45, 127), "text": "吞中子比最富中子的铑-127 衰变还快:原子核一路远离稳定线——这是 r 过程,碘就是这样来的。"}, {"when": "(17-n)-%.2f" % lg(50, 127), "text": "中子来得太慢,原子核每吞一个就先 β 衰变:这是 s 过程那样沿稳定线慢慢爬。"}, {"when": "1", "text": "中间地带:有的核等得到中子,有的先衰变,路线会分叉。"}]},
 "check": {"q": "为什么质量数 127 的富中子核,最后几乎都变成了碘?", "options": ["碘最轻", "A=127 只有碘-127 是稳定的,β 衰变链会停在那里", "碘不会衰变是因为它不带电"], "answer": 1, "why": "β 衰变不改变质量数,只把中子换成质子,沿 A=127 一直走到唯一稳定的碘-127 才停下。"},
 "uses": "反应速率、半衰期、对数尺度、β 衰变", "textbook": "大学《核天体物理》中子俘获过程",
 "sources": [{"name": "Thielemann & Cowan (2026) The r-process: history, required conditions, astrophysical sites, and observations, arXiv:2601.17246(⟨σv⟩≈10⁻¹⁷ cm³/s 与 τ_n 估算)", "url": "https://arxiv.org/abs/2601.17246"}, {"name": "Reifarth, Lederer & Käppeler (2014) J. Phys. G 41:053101(s 过程中子密度约几×10⁸ cm⁻³)", "url": "https://doi.org/10.1088/0954-3899/41/5/053101"}, {"name": "IAEA Live Chart of Nuclides(A=127 同量异位素半衰期)", "url": "https://www-nds.iaea.org/relnsd/vcharthtml/VChartHTML.html"}, {"name": "Ellis, Fields & Surman (2024) Do we owe our existence to gravitational waves?, Phys. Lett. B 858:139028(碘-127 约 96% 来自 r 过程)", "url": "https://doi.org/10.1016/j.physletb.2024.139028"}], "review": RV, "ai_generated": AI})
S.append({"world": "sh", "id": "rt.iod.3", "title": "第 3 站 · 天枢:两颗中子星相撞的那一夜",
 "formula": "t_{\\rm pk}=\\Big(\\frac{3M\\kappa}{4\\pi\\beta vc}\\Big)^{1/2}",
 "hook": "r 过程需要的中子雨,宇宙里哪里有?2017 年 8 月 17 日,引力波探测器听到了答案。",
 "steps": [
  {"text": "GW170817:LIGO 与 Virgo 记录到两颗中子星旋近并合的引力波,系统总质量约 2.74 倍太阳质量,距离约 40 百万秒差距;1.7 秒后费米卫星看到一个伽马射线暴,随后全波段望远镜找到了同一位置的新光源。", "tex": "d_L=40^{+8}_{-14}\\,\\text{Mpc}"},
  {"text": "这个新光源叫千新星:并合抛出的富中子物质在几秒内完成 r 过程,新生的放射性重核衰变加热抛射物,让它发光。r 过程加热率大约按时间的 −1.3 次方衰减。", "tex": "\\dot e_r\\approx2\\times10^{10}\\,\\epsilon\\Big(\\frac{t}{1\\,\\text{天}}\\Big)^{-1.3}\\,\\text{erg\\,s}^{-1}\\text{g}^{-1}"},
  {"text": "光要等抛射物稀薄到能透出来才达到峰值(扩散时间 = 膨胀时间)。镧系元素让物质极不透明:取 M=0.04 倍太阳质量、v=0.1c、κ=10 cm²/g,峰值推迟到约 %.0f 天、偏红;不含镧系的快速成分(取 M=0.02、v=0.2c、κ=0.5)约 %.1f 天就到峰、偏蓝。GW170817 的观测推断抛射了约 0.03–0.06 倍太阳质量的 r 过程物质,0.05 倍太阳质量约等于 %s 个地球。" % (T_RED, T_BLUE, sci(EJ_EARTH, 1)), "tex": "L_{\\rm pk}\\approx M\\,\\dot e_r(t_{\\rm pk})"},
  {"text": "太阳系的碘从哪次事件来?Côté 等 2021 年比较陨石中碘-129 与锔-247(两者半衰期都约 1560 万年)的比值,认为最可能的「最后一次」来源是中子星并合。引力波让双中子星失去能量、越转越近直到相撞——你身上的碘,很可能要感谢引力波。", "tex": "^{129}\\text{I}/^{247}\\text{Cm}\\;\\Rightarrow\\;\\text{中子星并合}"}],
 "lab": {"title": "千新星什么时候最亮", "note": NOTE + "Metzger 2019 的量级公式(β≈3,ε=0.5);横轴为不透明度 κ(cm²/g),纵轴为峰值时间(天)。",
  "params": [{"k": "M", "label": "抛射质量 M", "min": 0.005, "max": 0.1, "step": 0.005, "value": 0.05, "unit": "M☉"}, {"k": "v", "label": "抛射速度 v", "min": 0.05, "max": 0.3, "step": 0.01, "value": 0.1, "unit": "c"}, {"k": "k", "label": "不透明度 κ", "min": 0.5, "max": 30, "step": 0.5, "value": 10, "unit": "cm²/g"}],
  "fn": {"x": "x", "from": 0.5, "to": 30, "y0": 0, "ys": [{"label": "峰值时间(天)", "expr": "1.6*(M/0.01)^0.5*(v/0.1)^(-0.5)*x^0.5"}], "mark": [{"x": "k", "label": "此不透明度"}]},
  "readout": [{"label": "峰值时间", "expr": "1.6*(M/0.01)^0.5*(v/0.1)^(-0.5)*k^0.5", "unit": "天"}, {"label": "峰值光度", "expr": "1e41*(M/0.01)^0.35*(v/0.1)^0.65*k^(-0.65)", "unit": "erg/s"}, {"label": "抛射物约合", "expr": "M*332946", "unit": "个地球质量"}],
  "verdict": [{"when": "k-5", "text": "富含镧系元素:光被困住,一周左右才到峰,颜色偏红外——GW170817 后期看到的正是这种「红色千新星」。"}, {"when": "1", "text": "几乎不含镧系元素:光很快透出,一两天就到峰,颜色偏蓝。"}]},
 "check": {"q": "GW170817 为什么对「碘从哪来」这么重要?", "options": ["它离地球最近,把碘吹到了地球", "它第一次让人同时看到中子星并合和 r 过程元素发光的千新星", "它证明了碘来自太阳"], "answer": 1, "why": "引力波定位了并合,随后的千新星显示出新生重元素的放射性加热,直接证明中子星并合是 r 过程的场所之一。"},
 "uses": "扩散时间、量纲分析、幂律", "textbook": "研究生《高能天体物理》千新星",
 "sources": [{"name": "LIGO & Virgo (2017) GW170817: Observation of gravitational waves from a binary neutron star inspiral, PRL 119:161101", "url": "https://doi.org/10.1103/PhysRevLett.119.161101"}, {"name": "Metzger (2019) Kilonovae, Living Reviews in Relativity 23:1(式 7 峰值时间、式 23–24 加热率与峰值光度、GW170817 抛射 0.03–0.06 M☉)", "url": "https://doi.org/10.1007/s41114-019-0024-0"}, {"name": "Côté 等 (2021) ¹²⁹I and ²⁴⁷Cm in meteorites constrain the last astrophysical source of solar r-process elements, Science 371:945", "url": "https://doi.org/10.1126/science.aba1111"}, {"name": "Ellis, Fields & Surman (2024) Phys. Lett. B 858:139028", "url": "https://doi.org/10.1016/j.physletb.2024.139028"}], "review": RV, "ai_generated": AI})
S.append({"world": "ls", "id": "rt.iod.4", "title": "第 4 站 · 生命源码:你甲状腺里的星尘",
 "formula": "\\text{T}_4=\\mathrm{C_{15}H_{11}I_4NO_4}",
 "hook": "碘是甲状腺激素的核心成分,调节生长发育、体温和代谢。你体内的每一个碘原子,都比太阳还老。",
 "steps": [
  {"text": "甲状腺把血液里的碘离子收集起来,做成甲状腺素 T4(含 4 个碘)和三碘甲状腺原氨酸 T3(含 3 个碘)。T4 分子量 776.87,其中碘占 %.1f%%。" % (fI_T4 * 100), "tex": "\\frac{4\\times126.904}{776.87}\\approx%.3f" % fI_T4},
  {"text": "碘充足的健康成人体内约有 15–20 毫克碘,其中 70%%–80%% 在甲状腺。15 毫克碘约 %s 个原子,20 毫克约 %s 个。" % (sci(A15, 1), sci(A20, 1)), "tex": "N=\\frac{m}{126.904\\,\\text{g/mol}}\\times N_A"},
  {"text": "成人推荐每天摄入 150 微克碘,超过 90%% 的膳食碘最终经尿排出。碘的放射性同位素碘-131(IAEA 半衰期约 %.1f 天)会被甲状腺同样收集,所以医学上用它做甲状腺治疗,核事故时也要防它。" % T_I131, "tex": "T_{1/2}(^{131}\\text{I})\\approx%.1f\\,\\text{天}" % T_I131},
  {"text": "航线终点:这些碘原子在太阳系形成前就已造好——很可能在两颗中子星相撞后的几秒钟里,由一场中子雨把铁族种子核撑成富中子核,再一路 β 衰变停在碘-127。", "tex": "\\text{中子星并合}\\to r\\text{ 过程}\\to{}^{127}\\text{I}\\to\\text{T}_4"}],
 "lab": {"title": "数一数你身上的碘", "note": NOTE + "全身碘量与甲状腺占比为可调假设(健康成人约 15–20 毫克,70%–80% 在甲状腺)。不构成医疗或营养建议。",
  "params": [{"k": "m", "label": "全身碘量", "min": 10, "max": 25, "step": 0.5, "value": 17.5, "unit": "毫克"}, {"k": "f", "label": "在甲状腺中的比例", "min": 0.6, "max": 0.9, "step": 0.01, "value": 0.75, "unit": ""}],
  "fn": {"x": "x", "from": 5, "to": 30, "ys": [{"label": "log₁₀ 碘原子数", "expr": "log(x*1e-3/126.904*6.02214076e23)/log(10)"}], "mark": [{"x": "m", "label": "你"}]},
  "readout": [{"label": "全身碘原子", "expr": "m*1e-3/126.904*6.02214076e23", "unit": "个"}, {"label": "甲状腺里的碘原子", "expr": "m*f*1e-3/126.904*6.02214076e23", "unit": "个"}, {"label": "若全做成 T4", "expr": "m*f*1e-3/126.904*6.02214076e23/4", "unit": "个分子"}]},
 "check": {"q": "一个甲状腺素 T4 分子里有几个碘原子?", "options": ["1 个", "3 个", "4 个"], "answer": 2, "why": "T4 的「4」就是 4 个碘;T3 有 3 个。"},
 "disclaimer": "仅为科学科普计算,不构成医疗或营养建议。",
 "uses": "摩尔与阿伏伽德罗常数、质量分数、半衰期", "textbook": "大学《生物化学》《生理学》甲状腺激素",
 "sources": [{"name": "NIH ODS Iodine Fact Sheet for Health Professionals(成人 15–20 mg、70%–80% 在甲状腺、RDA 150 μg、>90% 经尿排出、碘-131 治疗)", "url": "https://ods.od.nih.gov/factsheets/Iodine-HealthProfessional/"}, {"name": "PubChem CID 5819 Thyroxine(C15H11I4NO4,776.87 g/mol)", "url": "https://pubchem.ncbi.nlm.nih.gov/compound/5819"}, {"name": "IAEA Live Chart of Nuclides(碘-131 半衰期)", "url": "https://www-nds.iaea.org/relnsd/vcharthtml/VChartHTML.html"}], "review": RV, "ai_generated": AI})
J = {"id": "iod", "title": "你身上的碘从哪来", "badge": "千新星之子", "color": "#ff9fd6", "tagline": "你甲状腺里的碘,很可能来自两颗中子星的相撞。", "stops": S}
json.dump(J, open('deep/routes/iod.json', 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print('ok BA Fe=%.4f Ni=%.4f I=%.4f Q71=%.1f per_n=%.2f ECa=%.2f ECp=%.2f kT=%.3f' % (BA_FE, BA_NI, BA_I, Q71, per_n, EC_A_FE, EC_P_FE, KT3))
print('chain', [(SYM[str(z)], l) for z, l in chain if 45 <= z <= 60])
print('T_Rh=%.3fs T_In=%.2fs T_Sn=%.0fs(%.2fh) I129=%.2fMyr I131=%.2fd' % (T_RH, T_IN, T_SN, T_SN / 3600, T_I129, T_I131))
print('tpk red=%.1f blue=%.2f Lred=%.2e ejecta=%.0f Earth' % (T_RED, T_BLUE, L_RED, EJ_EARTH))
print('T4 fI=%.4f atoms15=%.3e atoms20=%.3e' % (fI_T4, A15, A20))
