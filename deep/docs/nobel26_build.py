# 深空 2.1「2026 诺奖前沿」三张卡:生成 deep/cards/{nv.l2.icecube,ls.l2.optogenetics,ef.l4.chirality}.json
# 与 deep/data/{sim.icecube.hits,sim.chr2.hill,model.soai.amplify}.json,并复算卡内所有数字。
# 运行:在仓库根目录 python3 deep/docs/nobel26_build.py(只用标准库,随机种子固定,可复现)
import json, math, random
OUT = 'deep/'
TODAY = '2026-11-09'
TAG = '前沿 · 2026 诺奖'
NOTE = '由总指挥添加,AI 协助编写。'
RV = 'AI 审 + 脚本复算(nobel26_build.py;待有领域审稿人再复核)'
def dump(path, obj):
    json.dump(obj, open(OUT + path, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
def f(x, n=4): return float('%.*g' % (n, x))
SUP = str.maketrans('-0123456789', '⁻⁰¹²³⁴⁵⁶⁷⁸⁹')
def sci(x, d=1):
    e = int(math.floor(math.log10(abs(x)))); m = round(x / 10 ** e, d)
    if abs(m) >= 10: m /= 10; e += 1
    return ('%.*f×10' % (d, m)) + str(e).translate(SUP)

# ---------------------------------------------------------------- 1. 冰立方(宙律 nv,星系层)
random.seed(20261006)
n_ice = 1.32                      # 冰的折射率(近似,相/群速度统一取此值)
c = 0.299792458                   # 光速 m/ns
thc = math.acos(1 / n_ice)        # 切伦科夫角
assert abs(math.degrees(thc) - 40.75) < 0.1
alpha_true = 30.0                 # 径迹方向:与竖直向上夹 30°(从下往上 = 穿过地球而来)
ux, uz = math.sin(math.radians(alpha_true)), math.cos(math.radians(alpha_true))
p0 = (190.0, 0.0)                 # 径迹经过的一点(m)
strings = [0.0, 125.0, 250.0, 375.0]   # 4 根串,间距 125 m
zs = [-501.5 + 17 * k for k in range(60)]  # 每串 60 个 DOM,竖直间距 17 m(相对探测器中心)
RHO_MAX = 70.0
hits = []                          # (string_index, x, z, t_ns)
for si, x in enumerate(strings):
    for z in zs:
        dx, dz = x - p0[0], z - p0[1]
        l = dx * ux + dz * uz
        rho = abs(dx * uz - dz * ux)
        if rho > RHO_MAX: continue
        t = (l - rho / math.tan(thc)) / c + rho * n_ice / (c * math.sin(thc)) + random.gauss(0, 3.0)
        hits.append((si, x, z, t))
t0 = min(h[3] for h in hits)
hits = [(si, x, z, round(t - t0, 1)) for si, x, z, t in hits]
N = len(hits)
assert 25 <= N <= 90, N
# LineFit:r_i = r0 + v t_i 的最小二乘解 v = cov(r,t)/var(t)
mt = sum(h[3] for h in hits) / N; mx = sum(h[1] for h in hits) / N; mz = sum(h[2] for h in hits) / N
vt = sum((h[3] - mt) ** 2 for h in hits) / N
vx = sum((h[1] - mx) * (h[3] - mt) for h in hits) / N / vt
vz = sum((h[2] - mz) * (h[3] - mt) for h in hits) / N / vt
alpha_fit = math.degrees(math.atan2(vx, vz)); vfit = math.hypot(vx, vz)
assert abs(alpha_fit - alpha_true) < 6, alpha_fit
# 实验台:平面波模型 t = t0 + (x sinα + z cosα)/c 的残差 RMS(α);用协方差把 N 个点压成 6 个数
Vt = vt; Vx = sum((h[1] - mx) ** 2 for h in hits) / N; Vz = sum((h[2] - mz) ** 2 for h in hits) / N
Ctx = sum((h[1] - mx) * (h[3] - mt) for h in hits) / N; Ctz = sum((h[2] - mz) * (h[3] - mt) for h in hits) / N
Cxz = sum((h[1] - mx) * (h[2] - mz) for h in hits) / N
def rms(a):
    A, B = math.sin(math.radians(a)), math.cos(math.radians(a))
    return math.sqrt(max(0, Vt + (A * A * Vx + B * B * Vz + 2 * A * B * Cxz) / c ** 2 - 2 * (A * Ctx + B * Ctz) / c))
best = min(range(0, 1801), key=lambda k: rms(k / 10)) / 10
assert abs(best - alpha_true) < 6, best
def rms_expr(var):
    A, B = 'sin(%s*pi/180)' % var, 'cos(%s*pi/180)' % var
    return 'sqrt(max(0,%.6g+(%s^2*%.6g+%s^2*%.6g+2*%s*%s*%.6g)/%.10g-2*(%s*%.6g+%s*%.6g)/%.10g))' % (
        Vt, A, Vx, B, Vz, A, B, Cxz, c * c, A, Ctx, B, Ctz, c)
rows = []
for z in sorted(set(h[2] for h in hits)):
    r = [round(z, 1)] + [None] * 4
    for si, x, zz, t in hits:
        if zz == z: r[1 + si] = round(t / 1000, 4)
    rows.append(r)
dump('data/sim.icecube.hits.json', {"meta": {"id": "sim.icecube.hits", "title": "模拟:一条 μ 子径迹在 4 根冰立方式串上的光到达时间", "source": "创世计划程序生成的模拟数据(deep/docs/nobel26_build.py,随机种子 20261006);几何参数取 IceCube 公开设计值(串距 125 m、DOM 间距 17 m)", "url": "https://icecube.wisc.edu/science/icecube/", "license": "本站原创,CC BY 4.0", "retrieved": TODAY, "unit": "μs", "ai_generated": False, "note": "模拟数据,非 IceCube 观测;时间单位微秒;径迹真方向 30°,冰折射率取 1.32,计时抖动 σ=3 ns,不含冰中散射;只记离径迹 70 m 以内的 DOM"}, "columns": ["z", "s1", "s2", "s3", "s4"], "rows": rows})
ice = {"id": "nv.l2.icecube", "world": "nv", "link_task": "nv.icecube", "tag": TAG, "tab": "冰立方:听光定方向",
 "title": "冰立方:从光到达的先后,反推中微子从哪来",
 "formula": "\\vec r_i\\approx\\vec r_0+\\vec v\\,t_i\\;\\Rightarrow\\;\\vec v=\\frac{\\overline{\\vec r\\,t}-\\bar{\\vec r}\\,\\bar t}{\\overline{t^2}-\\bar t^{\\,2}}",
 "hook": "2026 年诺贝尔物理学奖授予 Francis Halzen,表彰他对冰立方中微子天文台(IceCube)的决定性贡献和发现天体物理来源的高能中微子。冰里 5160 个光传感器只记下「几点几分看到一闪」,怎样从这些时间里算出中微子来的方向?",
 "steps": [
  {"text": "中微子偶尔撞上冰里的原子核,生成一个 μ 子,方向几乎与中微子相同。μ 子比冰中的光(c/n)还快,沿途发出切伦科夫光,光锥半角满足 cos θc = 1/n。冰的折射率取约 1.32,θc ≈ %.1f°。" % math.degrees(thc), "tex": "\\cos\\theta_c=\\frac1n\\;\\Rightarrow\\;\\theta_c\\approx%.1f^\\circ" % math.degrees(thc)},
  {"text": "探测器:IceCube 在南极冰下 1450–2450 米布了 86 根串、5160 个光学模块(DOM);主阵列串距约 125 米,同一根串上 DOM 间距 17 米。本卡用程序模拟其中 4 根串的一个竖直切面(模拟数据,不是 IceCube 观测)。", "tex": "86\\times60=5160\\;\\text{DOM}"},
  {"text": "模拟一条从下往上、与竖直方向成 30° 的径迹。离径迹垂直距离 ρ 的 DOM,先等 μ 子走到对应位置,再等光斜着传过来,所以到达时间带有锥形几何的延迟;再加 3 纳秒计时抖动。离径迹 70 米内的 %d 个 DOM 记到了光。" % N, "tex": "t_i=t_0+\\frac{l_i-\\rho_i/\\tan\\theta_c}{c}+\\frac{n\\,\\rho_i}{c\\sin\\theta_c}"},
  {"text": "最简单的重建叫 LineFit(IceCube 在线重建的第一步):假装光是一张以速度 v 扫过探测器的平面,对所有命中做最小二乘,方向就是 v 的方向。脚本算得方向 %.1f°(真值 30°),|v| ≈ %.3f 米/纳秒(光速 0.300)。" % (alpha_fit, vfit), "tex": "\\alpha_{\\rm fit}=\\arctan\\frac{v_x}{v_z}\\approx%.1f^\\circ" % alpha_fit},
  {"text": "误差从哪来:LineFit 忽略了切伦科夫锥——离径迹远的 DOM 系统性地晚到,真实冰里光还会散射。IceCube 后续用考虑光在冰中传播的似然拟合把方向修得更准。方向一旦朝下(从地球另一边穿过来),就几乎只可能是中微子:大气 μ 子穿不过整个地球。", "tex": "\\alpha\\in(0^\\circ,90^\\circ)\\Rightarrow\\text{穿过地球而来}"},
  {"text": "意义:2013 年 IceCube 报告了天体物理中微子的首批证据,几年后数据足以确认;目前有 79 个中微子看起来来自活动星系 NGC 1068 方向,但证据还不足以确认它就是源。中微子不带电,不被磁场弯折,沿直线回溯就能找宇宙中的粒子加速器。", "tex": "\\nu\\;\\text{不带电}\\Rightarrow\\text{直线回溯}"}],
 "check": {"q": "为什么 IceCube 特别看重「从下往上」穿过探测器的径迹?", "options": ["从下往上的光更亮", "能从下面穿过整个地球的几乎只有中微子,大气 μ 子被地球挡住了", "南极冰层下面更透明"], "answer": 1, "why": "大气 μ 子只能从上方进来;从地球另一边穿过来的只能是中微子产生的 μ 子,这是剔除背景的关键。"},
 "chart": {"data": "sim.icecube.hits.json", "x": "z", "ys": [{"col": "s1", "label": "第 1 串"}, {"col": "s2", "label": "第 2 串"}, {"col": "s3", "label": "第 3 串"}, {"col": "s4", "label": "第 4 串"}], "type": "scatter", "xlabel": "DOM 高度 z(米,相对探测器中心)", "ylabel": "到达时间 μs(模拟)"},
 "uses": "切伦科夫辐射、几何光学、最小二乘、协方差",
 "textbook": "大学《粒子物理导论》探测器与径迹重建;《数理统计》最小二乘",
 "sources": [
  {"name": "NobelPrize.org · The Nobel Prize in Physics 2026(Francis Halzen,获奖理由)", "url": "https://www.nobelprize.org/prizes/physics/2026/summary/"},
  {"name": "NobelPrize.org · Popular information 2026 物理奖(5160 传感器/86 串、1450–2450 m、2013 年证据、NGC 1068 79 个中微子)", "url": "https://www.nobelprize.org/prizes/physics/2026/popular-information/"},
  {"name": "IceCube Collaboration (2017) The IceCube Neutrino Observatory: instrumentation and online systems, JINST 12 P03012(串距 125 m、DOM 间距 17 m)", "url": "https://doi.org/10.1088/1748-0221/12/03/P03012"},
  {"name": "IceCube Collaboration (2014) Improvement in fast particle track reconstruction with robust statistics, NIM A 736:143(LineFit)", "url": "https://arxiv.org/abs/1308.5501"},
  {"name": "IceCube Collaboration (2013) Evidence for High-Energy Extraterrestrial Neutrinos at the IceCube Detector, Science 342:1242856", "url": "https://doi.org/10.1126/science.1242856"}],
 "review": RV + ";N=%d 命中,LineFit α=%.2f°,|v|=%.4f m/ns,RMS 扫描最小 α=%.1f°,θc=%.2f°" % (N, alpha_fit, vfit, best, math.degrees(thc)),
 "ai_generated": "标题、钩子、推导文字、检查题由 AI 撰写;命中数据由程序模拟(非观测);无图片",
 "lab": {"title": "转动径迹方向,找残差最小处", "note": NOTE + "用平面波模型 t=t₀+(x sinα+z cosα)/c 去对模拟命中(t₀ 自动取最优)。曲线是残差 RMS 随方向 α 的变化,竖线是你选的方向。",
  "params": [{"k": "a", "label": "径迹方向 α(与竖直向上的夹角)", "min": 0, "max": 180, "step": 0.5, "value": 90, "unit": "°"}],
  "fn": {"x": "x", "from": 0, "to": 180, "y0": 0, "ys": [{"label": "残差 RMS(纳秒)", "expr": rms_expr('x')}], "mark": [{"x": "a", "label": "你的方向"}]},
  "readout": [{"label": "此方向残差 RMS", "expr": rms_expr('a'), "unit": "纳秒"}, {"label": "与 LineFit 解相差", "expr": "abs(a-%.2f)" % alpha_fit, "unit": "°"}],
  "verdict": [{"when": "6-abs(a-%.2f)" % alpha_fit, "text": "残差接近最低点:方向找到了。α<90° 说明它从下往上穿过探测器——来自地球另一边。"}, {"when": "1", "text": "残差还很大:光到达的先后对不上这个方向,再转转看。"}]}}
dump('cards/nv.l2.icecube.json', ice)
print('icecube N=%d fit=%.2f v=%.4f best=%.1f rms(true)=%.2f rms(90)=%.2f' % (N, alpha_fit, vfit, best, rms(30), rms(90)))

# ---------------------------------------------------------------- 2. 光遗传学(生命源码 ls,星系层)
random.seed(20261005)
EC50, NH = 1.10, 1.0              # Lin 2011 Exp Physiol 表 1:ChR2 峰值电流 EC50≈1.10 mW/mm²;Hill 系数取 1(两态模型)
Ls = [round(10 ** (-1.3 + 0.28 * k), 3) for k in range(10)]   # 0.05–16 mW/mm²
pts = []
for L in Ls:
    y = L ** NH / (L ** NH + EC50 ** NH)
    pts.append((L, round(min(0.995, y * (1 + random.gauss(0, 0.04))), 3)))
# Hill 图线性化拟合:log(y/(1-y)) = n log L - n log EC50
X = [math.log10(L) for L, y in pts]; Y = [math.log10(y / (1 - y)) for L, y in pts]
mX, mY = sum(X) / len(X), sum(Y) / len(Y)
nf = sum((a - mX) * (b - mY) for a, b in zip(X, Y)) / sum((a - mX) ** 2 for a in X)
ecf = 10 ** (mX - mY / nf)
assert abs(nf - 1) < 0.15 and abs(ecf - EC50) < 0.2, (nf, ecf)
def hill(L, e, n): return L ** n / (L ** n + e ** n)
rmsf = math.sqrt(sum((y - hill(L, ecf, nf)) ** 2 for L, y in pts) / len(pts))
tau_off = 13.5e-3; koff = 1 / tau_off
Eph = 6.62607015e-34 * 299792458 / 470e-9
flux = EC50 * 1e-3 / 1e-6 / Eph   # 光子/(s·m²)
sigma = koff / flux * 1e4         # cm²
rows = [[round(math.log10(L), 3), L, y, round(hill(L, ecf, nf), 3)] for L, y in pts]
dump('data/sim.chr2.hill.json', {"meta": {"id": "sim.chr2.hill", "title": "模拟:ChR2 峰值光电流随蓝光强度的变化(归一化)", "source": "创世计划程序生成的模拟数据(deep/docs/nobel26_build.py,种子 20261005);参数取 Lin 2011《A user's guide to channelrhodopsin variants》表 1 的 ChR2 典型值 EC50≈1.10 mW/mm²", "url": "https://doi.org/10.1113/expphysiol.2009.051961", "license": "本站原创,CC BY 4.0", "retrieved": TODAY, "unit": "I/Imax", "ai_generated": False, "note": "模拟数据,非实验测量:按 Hill 方程(EC50=1.10,n=1)生成并加 4% 相对噪声;fit 列为脚本 Hill 图拟合值"}, "columns": ["lgL", "L", "resp", "fit"], "rows": rows})
ef_expr = lambda v: '10^(n*%s)/(10^(n*%s)+E^n)' % (v, v)
rms_terms = '+'.join('(%s-10^(n*%.4f)/(10^(n*%.4f)+E^n))^2' % (y, math.log10(L), math.log10(L)) for L, y in pts)
opto = {"id": "ls.l2.optogenetics", "world": "ls", "link_task": "ls.optogenetics", "tag": TAG, "tab": "光遗传学:一束光开多少门",
 "title": "光遗传学:多亮的蓝光,能打开一半的通道视紫红质?",
 "formula": "\\frac{I}{I_{\\max}}=\\frac{L^{\\,n}}{L^{\\,n}+\\mathrm{EC}_{50}^{\\,n}}",
 "hook": "2026 年诺贝尔生理学或医学奖授予 Karl Deisseroth、Peter Hegemann 和 Georg Nagel,表彰他们关于光门控离子通道和光遗传学的发现。把藻类的通道视紫红质-2(ChR2)装进神经元,蓝光一照就放电。可光要多亮?",
 "steps": [
  {"text": "Hegemann 与 Nagel 在单细胞藻衣藻里找到通道视紫红质:它自己吸收光,自己就是离子通道。2003 年他们证明 ChR2 被蓝光照到后 0.2 毫秒内开门,阳离子涌入产生电信号;2005 年 Deisseroth 组把它装进大鼠神经元,用蓝光触发了神经信号。", "tex": "h\\nu+\\text{ChR2(关)}\\to\\text{ChR2(开)}"},
  {"text": "最简两态模型:关着的通道以速率 σΦ 被光打开(Φ 是光子通量,∝ 光强 L),开着的以速率 k_off 自己关上。稳态开放概率是一条双曲线,也就是 Hill 系数 n=1 的 Hill 方程。", "tex": "P_{\\rm open}=\\frac{\\sigma\\Phi}{\\sigma\\Phi+k_{\\rm off}}=\\frac{L}{L+\\mathrm{EC}_{50}}"},
  {"text": "文献典型值:Lin 2011 汇总的 ChR2 峰值电流半饱和光强 EC50≈1.10 mW/mm²(470 nm),稳态电流只有峰值的约 22%(脱敏),关门时间常数约 13.5 毫秒。本卡按这些参数用程序生成 10 个模拟测量点(加 4% 噪声,不是实验数据)。", "tex": "\\mathrm{EC}_{50}\\approx1.10\\;\\text{mW/mm}^2"},
  {"text": "拟合:把 Hill 方程取对数变成直线 log(y/(1−y)) = n·log L − n·log EC50,做最小二乘。脚本从模拟点拟出 n≈%.2f、EC50≈%.2f mW/mm²,残差 RMS %.3f。" % (nf, ecf, rmsf), "tex": "\\log\\frac{y}{1-y}=n\\log L-n\\log\\mathrm{EC}_{50}"},
  {"text": "读懂饱和:光强到 EC50 时开一半;再加 10 倍光,也只开到约 91%;要开到 90%,光强需 9 倍 EC50。光更亮不等于更好——组织会发热,所以实验总在「够用」和「不过量」之间找平衡。", "tex": "P(9\\,\\mathrm{EC}_{50})=0.9"},
  {"text": "量级检验:EC50 处 σΦ = k_off ≈ %.0f /s。1.10 mW/mm² 的 470 nm 光约 %s 个光子/(s·mm²),反推每个通道的有效「光敏截面」σ≈%s cm²。这个数只是模型给的量级估计,可以拿去和光谱测量比较。" % (koff, sci(flux * 1e-6), sci(sigma)), "tex": "\\sigma\\approx\\frac{k_{\\rm off}}{\\Phi_{50}}"}],
 "check": {"q": "按 n=1 的 Hill 方程,光强从 EC50 提高到 10 倍 EC50,电流大约变成最大值的多少?", "options": ["10 倍,即 500%", "约 91%", "仍然 50%"], "answer": 1, "why": "10/(10+1)≈0.91:通道快开满了,再亮也只能逼近饱和。"},
 "chart": {"data": "sim.chr2.hill.json", "x": "lgL", "ys": [{"col": "resp", "label": "模拟测量 I/Imax"}, {"col": "fit", "label": "Hill 拟合"}], "type": "scatter", "xlabel": "log₁₀ 光强(mW/mm²)", "ylabel": "归一化光电流 I/Imax"},
 "uses": "化学动力学两态模型、Hill 方程、对数线性化、最小二乘",
 "textbook": "大学《生物物理学》离子通道动力学;《神经生物学》光遗传学方法",
 "disclaimer": "科普建模,参数为文献典型值,模拟数据非实验测量;不构成医疗建议。",
 "sources": [
  {"name": "NobelPrize.org · The Nobel Prize in Physiology or Medicine 2026(Deisseroth、Hegemann、Nagel,获奖理由)", "url": "https://www.nobelprize.org/prizes/medicine/2026/summary/"},
  {"name": "NobelPrize.org · Popular information 2026 生理学或医学奖(0.2 毫秒开门、2003/2005/2007 里程碑)", "url": "https://www.nobelprize.org/prizes/medicine/2026/popular-information/"},
  {"name": "Lin JY (2011) A user's guide to channelrhodopsin variants, Exp Physiol 96:19–25,表 1(ChR2 EC50≈1.10 mW/mm²、稳态/峰值≈0.22、关门≈13.5 ms)", "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC2995811/"},
  {"name": "Nagel G 等 (2003) Channelrhodopsin-2, a directly light-gated cation-selective membrane channel, PNAS 100:13940", "url": "https://doi.org/10.1073/pnas.1936192100"},
  {"name": "Boyden ES 等 (2005) Millisecond-timescale, genetically targeted optical control of neural activity, Nat Neurosci 8:1263", "url": "https://doi.org/10.1038/nn1525"}],
 "review": RV + ";Hill 图拟合 n=%.3f、EC50=%.3f mW/mm²、RMS=%.4f;k_off=%.1f/s;Φ50=%.3e 光子/(s·m²);σ=%.2e cm²" % (nf, ecf, rmsf, koff, flux, sigma),
 "ai_generated": "标题、钩子、推导文字、检查题由 AI 撰写;测量点由程序模拟(非实验);无图片",
 "lab": {"title": "拖动 EC50 与 n,贴合模拟测量", "note": NOTE + "横轴是 log₁₀ 光强;金色是你的 Hill 曲线,蓝色是文献典型值(EC50=1.10,n=1)。",
  "params": [{"k": "E", "label": "半饱和光强 EC50", "min": 0.1, "max": 10, "step": 0.01, "value": 3, "unit": "mW/mm²"}, {"k": "n", "label": "Hill 系数 n", "min": 0.3, "max": 3, "step": 0.05, "value": 2}],
  "fn": {"x": "x", "from": -2, "to": 1.6, "y0": 0, "ys": [{"label": "你的 Hill 曲线", "expr": ef_expr('x')}, {"label": "文献典型值", "expr": "10^x/(10^x+1.1)"}], "mark": [{"x": "log(E)/log(10)", "label": "EC50"}]},
  "readout": [{"label": "与模拟点的残差 RMS", "expr": "sqrt((%s)/10)" % rms_terms, "unit": ""}, {"label": "开到 90% 需要光强", "expr": "E*9^(1/n)", "unit": "mW/mm²"}],
  "verdict": [{"when": "0.05-sqrt((%s)/10)" % rms_terms, "text": "曲线贴住了测量点:你拟合出的 EC50 和 n 就是这批通道的「光敏指纹」。"}, {"when": "1", "text": "还没贴上:EC50 管曲线左右位置,n 管陡峭程度。"}]}}
dump('cards/ls.l2.optogenetics.json', opto)
print('opto n=%.3f ec50=%.3f rms=%.4f koff=%.1f flux_mm2=%.3e sigma=%.2e' % (nf, ecf, rmsf, koff, flux * 1e-6, sigma))

# ---------------------------------------------------------------- 3. 手性(元素工坊 ef,星穹层)
# 二级自催化教学模型:dR/dt=kAR², dS/dt=kAS²。令 P=R+S,x=ee:dx/dP = x(1−x²)/(P(1+x²))
# ⇒ x/(1−x²) = C·P(不变量):产物总量翻 m 倍,ee/(1−ee²) 也翻 m 倍。
def amp(x0, m):
    y = m * x0 / (1 - x0 * x0)
    return (-1 + math.sqrt(1 + 4 * y * y)) / (2 * y)
# RK4 数值核对不变量:原方程换成时间变量 ds=(R²+S²)k dt,避免刚性(A 按 e^{-s} 衰减)
def rk(x0, m, steps=8000, smax=40.0):
    R, S, A = (1 + x0) / 2, (1 - x0) / 2, m - 1.0
    h = smax / steps
    def F(R, S, A):
        q = R * R + S * S
        return (A * R * R / q, A * S * S / q, -A)
    for _ in range(steps):
        k1 = F(R, S, A); k2 = F(*[v + h / 2 * k for v, k in zip((R, S, A), k1)]); k3 = F(*[v + h / 2 * k for v, k in zip((R, S, A), k2)]); k4 = F(*[v + h * k for v, k in zip((R, S, A), k3)])
        R, S, A = [v + h / 6 * (a + 2 * b + 2 * cc + d) for v, a, b, cc, d in zip((R, S, A), k1, k2, k3, k4)]
    return (R - S) / (R + S), R + S
xr, Pr = rk(0.02, 100)
assert abs(xr - amp(0.02, Pr)) < 1e-3, (xr, amp(0.02, Pr))
m87 = (0.87 / (1 - 0.87 ** 2)) / (0.02 / (1 - 0.02 ** 2))
m99_from_2 = (0.99 / (1 - 0.99 ** 2)) / (0.02 / (1 - 0.02 ** 2))
m995_tiny = (0.995 / (1 - 0.995 ** 2)) / 1e-5
rows = []
for k in range(0, 33):
    lg = k * 0.25
    rows.append([lg, round(100 * amp(0.02, 10 ** lg), 3), round(100 * amp(0.001, 10 ** lg), 3), round(100 * amp(1e-5, 10 ** lg), 4)])
dump('data/model.soai.amplify.json', {"meta": {"id": "model.soai.amplify", "title": "二级自催化教学模型:ee 随产物倍增的放大", "source": "创世计划计算(deep/docs/nobel26_build.py):dR/dt=kAR²、dS/dt=kAS² 的解析不变量 ee/(1−ee²)∝产物总量", "license": "本站原创,CC BY 4.0", "retrieved": TODAY, "unit": "% ee", "ai_generated": False, "note": "模型计算值,非实验观测;Soai 反应的真实机理更复杂(含二聚体等),此处仅为最简教学模型"}, "columns": ["lgm", "ee_2", "ee_01", "ee_0001"], "rows": rows})
X0 = '(10^g/100)'
Y = '(10^x*%s/(1-%s^2))' % (X0, X0)
EE = '100*(sqrt(1+4*%s^2)-1)/(2*%s)' % (Y, Y)
chi = {"id": "ef.l4.chirality", "world": "ef", "link_task": "ef.molecule", "tag": TAG, "tab": "手性:生命为什么偏左",
 "title": "手性:生命为什么只用左旋氨基酸?",
 "formula": "\\frac{ee}{1-ee^2}\\propto P",
 "hook": "2026 年诺贝尔化学奖授予 Henri B. Kagan 和 Kenso Soai,表彰他们发现不对称有机合成中的非线性效应与自催化。你身体里的氨基酸几乎全是左旋的,糖是右旋的。一个几乎对称的世界,怎么会长出只用一只手的生命?",
 "steps": [
  {"text": "前人走到哪:巴斯德用镊子把酒石酸的两种镜像晶体分开,发现它们让偏振光往相反方向转;后来又发现细菌只吃其中一种。化学家在试管里做手性分子,总是得到左右各半。1953 年 Frank 给出数学模型:要从对称走向单一手性,需要手性催化、一手增强另一手被抑制、以及产物给自己当催化剂(自催化)。", "tex": "\\text{Frank 1953:}\\;\\text{不对称}+\\text{抑制}+\\text{自催化}"},
  {"text": "Kagan 1986 发现非线性效应:催化剂里混入一部分镜像体,产物的对映体过量(ee)可以比催化剂的 ee 还高——因为「左右配对」的催化剂几乎不干活。Soai 1995 年做出第一个不对称自催化:以 2% ee 起步,得到 87% ee;2003 年又演示从没有手性偏向的起点随机得到一种手性,最终可占产物的 99.99%。", "tex": "ee=\\frac{[R]-[S]}{[R]+[S]}"},
  {"text": "你能先算什么:最简二级自催化模型,每种镜像体只催化生成自己,速率 ∝ 它自身浓度的平方。令 P 为产物总量、x 为 ee,可解出一个不变量:x/(1−x²) 与 P 成正比——产物翻多少倍,这个量就翻多少倍。", "tex": "\\frac{dR}{dt}=kAR^2,\\;\\frac{dS}{dt}=kAS^2\\;\\Rightarrow\\;\\frac{x}{1-x^2}=C\\,P"},
  {"text": "代数字:从 2%% ee 到 87%% ee,产物只需倍增约 %.0f 倍;到 99%% 约 %.0f 倍;哪怕起点只有十万分之一(0.001%%)的偏差,倍增约 %s 倍也能到 99.5%%。分几轮做,每轮放大几百倍,几轮就够。" % (m87, m99_from_2, sci(m995_tiny)), "tex": "m=\\frac{x_1/(1-x_1^2)}{x_0/(1-x_0^2)}"},
  {"text": "卡在哪:Soai 反应是人工体系,和生命化学不同;目前还没人在前生命条件下,让氨基酸或糖用同样的方式自己放大。最初那一点偏差从哪来,是偶然还是有方向,至今没有定论——这就是星穹层的开放问题。", "tex": "x_0=\\;?"}],
 "chart": {"data": "model.soai.amplify.json", "x": "lgm", "ys": [{"col": "ee_2", "label": "起点 2% ee"}, {"col": "ee_01", "label": "起点 0.1% ee"}, {"col": "ee_0001", "label": "起点 0.001% ee"}], "type": "line", "xlabel": "log₁₀ 产物倍增 m", "ylabel": "产物 ee(%)"},
 "lab": {"title": "给一个微小的偏差,看它被放大", "note": NOTE + "二级自催化教学模型;横轴为 log₁₀(产物倍增倍数),纵轴为 ee(%)。g 是起点 ee 的对数:g=0 即 1%,g=−5 即 0.00001%。",
  "params": [{"k": "g", "label": "起点 ee 的 log₁₀(%)", "min": -6, "max": 1, "step": 0.1, "value": 0.3, "unit": ""}],
  "fn": {"x": "x", "from": 0, "to": 10, "y0": 0, "ys": [{"label": "产物 ee(%)", "expr": EE}], "mark": [{"x": "log((0.99/(1-0.99^2))*(1-%s^2)/%s)/log(10)" % (X0, X0), "label": "到 99%"}]},
  "readout": [{"label": "起点 ee", "expr": "10^g", "unit": "%"}, {"label": "放大到 99% 需倍增", "expr": "(0.99/(1-0.99^2))*(1-%s^2)/%s" % (X0, X0), "unit": "倍"}, {"label": "折合每轮 ×100 的轮数", "expr": "log((0.99/(1-0.99^2))*(1-%s^2)/%s)/log(100)" % (X0, X0), "unit": "轮"}],
  "verdict": [{"when": "-g-3", "text": "起点不到十万分之一(0.001%),也只需多几轮放大:自催化不在乎起点多小,只在乎有没有。"}, {"when": "1", "text": "偏差越大,越快放大到接近 100%。"}]},
 "hypos": [
  {"t": "偶然 + 放大", "claim": "早期地球上某处随机出现了一点点偏差,被类似 Frank/Soai 的自催化放大成单一手性;左旋只是「掷硬币」的结果。", "for": "Soai 反应证明了:从几乎对称的起点,随机得到一种手性并放大到接近纯净,在化学上是可能的。", "against": "还没找到能在前生命条件下让氨基酸或糖自我放大的反应。"},
  {"t": "偏差来自太空", "claim": "陨石带来的有机物里本来就有左旋过量,地球生命继承并放大了它。", "for": "在一些碳质陨石里测到了氨基酸异缬氨酸的左旋过量(Glavin & Dworkin 2009)。", "against": "陨石里的偏差本身如何产生仍有争议,而且它同样需要后续放大。"},
  {"t": "物理定律本身偏向一边", "claim": "弱相互作用不守恒宇称,或电子自旋与手性分子的耦合,使一种镜像体在原则上略占优。", "for": "宇称不守恒是实验确立的事实;自旋选择性效应在实验室里已被观察到。", "against": "这些效应给出的偏差极其微小,能否决定生命的选择没有共识。"}],
 "uses": "化学动力学、微分方程分离变量、不变量、对数坐标",
 "textbook": "研究生《物理有机化学》不对称催化;《生命起源》同手性问题",
 "sources": [
  {"name": "NobelPrize.org · The Nobel Prize in Chemistry 2026(Henri B. Kagan、Kenso Soai,获奖理由)", "url": "https://www.nobelprize.org/prizes/chemistry/2026/summary/"},
  {"name": "NobelPrize.org · Popular information 2026 化学奖(巴斯德、Frank 1953、Kagan 1986、Soai 1995 2%→87%、2003 年 99.99%)", "url": "https://www.nobelprize.org/prizes/chemistry/2026/popular-information/"},
  {"name": "Frank FC (1953) On spontaneous asymmetric synthesis, Biochim Biophys Acta 11:459", "url": "https://doi.org/10.1016/0006-3002(53)90082-1"},
  {"name": "Puchot C, Samuel O, Duñach E, Zhao S, Agami C, Kagan HB (1986) Nonlinear effects in asymmetric synthesis, JACS 108:2353", "url": "https://doi.org/10.1021/ja00269a036"},
  {"name": "Soai K, Shibata T, Morioka H, Choji K (1995) Asymmetric autocatalysis and amplification of enantiomeric excess of a chiral molecule, Nature 378:767", "url": "https://doi.org/10.1038/378767a0"},
  {"name": "Glavin DP, Dworkin JP (2009) Enrichment of the amino acid L-isovaline by aqueous alteration on CI and CM meteorite parent bodies, PNAS 106:5487", "url": "https://doi.org/10.1073/pnas.0811618106"}],
 "review": RV + ";不变量经 RK4 数值核对(x0=2%%,P=%.2f 时解析 %.5f vs 数值 %.5f);m(2→87%%)=%.1f,m(2→99%%)=%.1f,m(0.001%%→99.5%%)=%.4g" % (Pr, amp(0.02, Pr), xr, m87, m99_from_2, m995_tiny),
 "ai_generated": "标题、钩子、步骤文字、假设陈述由 AI 撰写;数值由脚本计算;无图片",
 "layer_name": "星穹 · 研究者",
 "sandbox": "没有标准答案:选一个你押的假设,生成假设卡带走。不排名,不打分。"}
dump('cards/ef.l4.chirality.json', chi)
print('soai m87=%.1f m99=%.1f mtiny=%.3e rk=%.5f/%.5f' % (m87, m99_from_2, m995_tiny, xr, amp(0.02, Pr)))

idx = json.load(open(OUT + 'cards/index.json'))
for fn in ['nv.l2.icecube.json', 'ls.l2.optogenetics.json', 'ef.l4.chirality.json']:
    if fn not in idx: idx.append(fn)
json.dump(idx, open(OUT + 'cards/index.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('index', len(idx))
