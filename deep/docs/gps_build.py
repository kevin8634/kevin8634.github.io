# 深空 1.9 第五条航线「卫星钟为什么要调慢」:生成 deep/routes/gps.json,并复算文中数字
import json, math
GM = 3.986004418e14; c = 299792458.0; RE = 6.378137e6; a = 2.6560e7; day = 86400
T = 2 * math.pi * math.sqrt(a**3 / GM) / 3600; assert abs(T - 11.97) < 0.01
v = math.sqrt(GM / a); assert abs(v - 3874) < 2
sr = v**2 / (2 * c**2) * day * 1e6; assert abs(sr - 7.2) < 0.1
gr = GM / c**2 * (1 / RE - 1 / a) * day * 1e6; assert abs(gr - 45.7) < 0.1
net = gr - sr; km = net * 1e-6 * c / 1000; assert abs(net - 38.5) < 0.2 and abs(km - 11.5) < 0.2
AI = "文字由 AI 撰写;数值由脚本复算(gps_build.py);无图片"
RV = "AI 审 + 脚本复算(待有领域审稿人再复核)"
NOTE = "由总指挥添加,AI 协助编写。"
S = []
S.append({"world": "ma", "id": "rt.gps.1", "title": "第 1 站 · 星图:手机怎样知道你在哪?",
 "formula": "\\sqrt{(x-x_i)^2+(y-y_i)^2+(z-z_i)^2}=c\\,(t-t_i)",
 "hook": "手机不向卫星发任何信号,却能算出自己的位置。它只做了一件事:听时间。",
 "steps": [
  {"text": "每颗卫星不停广播「我在哪、现在几点」。信号以光速 c 传来,收到的时间差乘以 c,就是你到这颗卫星的距离。", "tex": "d_i=c\\,(t-t_i)"},
  {"text": "知道到一颗卫星的距离,你就在一个球面上;三个球面交于一点。手机的钟不准,多一个未知数 t,所以至少要 4 颗卫星解 4 个方程。", "tex": "(x,y,z,t)\\;\\Leftarrow\\;4\\;\\text{个方程}"},
  {"text": "光速每微秒走约 300 米。钟差 1 微秒,定位就差约 300 米,所以卫星钟必须极准。", "tex": "c\\times1\\,\\mu\\text{s}\\approx300\\,\\text{m}"}],
 "lab": {"title": "钟差变成距离差", "note": NOTE + "只看钟差对测距的影响;纵轴为测距误差(米)。",
  "params": [{"k": "e", "label": "钟差", "min": 0.001, "max": 10, "step": 0.001, "value": 1, "unit": "微秒"}],
  "fn": {"x": "x", "from": 0, "to": 10, "ys": [{"label": "测距误差(m)", "expr": "299.792458*x"}], "mark": [{"x": "e", "label": "此钟差"}]},
  "readout": [{"label": "测距误差", "expr": "299.792458*e", "unit": "米"}],
  "verdict": [{"when": "299.792458*e-10", "text": "误差超过 10 米,导航会把你放到隔壁街。"}, {"when": "1", "text": "误差在 10 米内,够日常导航。"}]},
 "check": {"q": "为什么至少要 4 颗卫星才能定位?", "options": ["卫星太小", "除了 x、y、z,手机钟的误差也是一个未知数", "3 颗会互相干扰"], "answer": 1, "why": "4 个未知数(x,y,z,t)需要 4 个方程。"},
 "uses": "三维距离公式、方程组", "textbook": "大学《线性代数》与《测量学》卫星定位",
 "sources": [{"name": "GPS.gov · GPS: The Global Positioning System", "url": "https://www.gps.gov/systems/gps/"}], "review": RV, "ai_generated": AI})
S.append({"world": "sh", "id": "rt.gps.2", "title": "第 2 站 · 天枢:GPS 卫星飞在哪条轨道上?",
 "formula": "T=2\\pi\\sqrt{\\frac{a^3}{GM}}",
 "hook": "GPS 卫星每天绕地球恰好两圈。这个高度是怎么挑出来的?",
 "steps": [
  {"text": "开普勒第三定律:轨道周期由半长轴 a 决定。GPS 卫星轨道半径约 26 560 千米(离地约 20 200 千米)。", "tex": "T=2\\pi\\sqrt{a^3/GM}"},
  {"text": "代入地球 GM,周期约 %.2f 小时,即半个恒星日:每天两圈,地面轨迹每天重复。" % T, "tex": "T\\approx%.2f\\,\\text{h}" % T},
  {"text": "圆轨道速度 v=√(GM/a)≈%.2f 千米/秒。高度和速度,正是下一站相对论效应的两个来源。" % (v / 1000), "tex": "v=\\sqrt{GM/a}\\approx%.0f\\,\\text{m/s}" % v}],
 "lab": {"title": "换一个轨道高度", "note": NOTE + "圆轨道近似;a 为轨道半径(地心起算)。",
  "params": [{"k": "a", "label": "轨道半径 a", "min": 6.7, "max": 50, "step": 0.1, "value": 26.56, "unit": "千千米"}],
  "fn": {"x": "x", "from": 6.7, "to": 50, "ys": [{"label": "周期(小时)", "expr": "2*3.14159265*sqrt((x*1e6)^3/3.986004418e14)/3600"}], "mark": [{"x": "a", "label": "此轨道"}]},
  "readout": [{"label": "周期", "expr": "2*3.14159265*sqrt((a*1e6)^3/3.986004418e14)/3600", "unit": "小时"}, {"label": "轨道速度", "expr": "sqrt(3.986004418e14/(a*1e6))/1000", "unit": "km/s"}, {"label": "离地高度", "expr": "a*1000-6378", "unit": "km"}]},
 "check": {"q": "轨道越高,周期会?", "options": ["越短", "越长", "不变"], "answer": 1, "why": "T∝a^(3/2)。"},
 "uses": "开普勒第三定律、万有引力", "textbook": "大学《普通物理·力学》天体运动",
 "sources": [{"name": "GPS.gov · Space Segment(轨道高度与周期)", "url": "https://www.gps.gov/systems/gps/space/"}, {"name": "NASA Earth Fact Sheet(GM、半径)", "url": "https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html"}], "review": RV, "ai_generated": AI})
S.append({"world": "nv", "id": "rt.gps.3", "title": "第 3 站 · 宙律:卫星上的钟为什么跑得快?",
 "formula": "\\frac{\\Delta t}{t}\\approx\\frac{\\Delta\\Phi}{c^2}-\\frac{v^2}{2c^2}",
 "hook": "如果没人修正相对论,你的导航每天会漂出十多公里。",
 "steps": [
  {"text": "狭义相对论:运动的钟变慢。卫星速度约 3.9 千米/秒,每天慢约 %.1f 微秒。" % sr, "tex": "\\frac{v^2}{2c^2}\\times86400\\,\\text{s}\\approx%.1f\\,\\mu\\text{s}" % sr},
  {"text": "广义相对论:引力越弱,钟走得越快。卫星离地心远,每天快约 %.1f 微秒。" % gr, "tex": "\\frac{GM}{c^2}\\Big(\\frac1{R}-\\frac1a\\Big)\\times86400\\,\\text{s}\\approx%.1f\\,\\mu\\text{s}" % gr},
  {"text": "合计每天快约 %.1f 微秒,乘光速约 %.1f 千米。所以卫星钟在发射前就被特意调慢,让它在天上与地面同步。" % (net, km), "tex": "%.1f\\,\\mu\\text{s}\\times c\\approx%.1f\\,\\text{km}" % (net, km)}],
 "lab": {"title": "两种相对论拔河", "note": NOTE + "弱场近似,圆轨道;纵轴为每天钟差(微秒)。正值=卫星钟比地面快。",
  "params": [{"k": "a", "label": "轨道半径 a", "min": 6.7, "max": 50, "step": 0.1, "value": 26.56, "unit": "千千米"}],
  "fn": {"x": "x", "from": 6.7, "to": 50, "ys": [{"label": "广义(变快)", "expr": "3.986004418e14/8.98755179e16*(1/6.378137e6-1/(x*1e6))*86400e6"}, {"label": "狭义(变慢)", "expr": "-3.986004418e14/(x*1e6)/(2*8.98755179e16)*86400e6"}, {"label": "合计", "expr": "3.986004418e14/8.98755179e16*(1/6.378137e6-1/(x*1e6))*86400e6-3.986004418e14/(x*1e6)/(2*8.98755179e16)*86400e6"}], "mark": [{"x": "a", "label": "此轨道"}]},
  "readout": [{"label": "每天钟差", "expr": "3.986004418e14/8.98755179e16*(1/6.378137e6-1/(a*1e6))*86400e6-3.986004418e14/(a*1e6)/(2*8.98755179e16)*86400e6", "unit": "微秒"}, {"label": "不修正的定位漂移", "expr": "abs(3.986004418e14/8.98755179e16*(1/6.378137e6-1/(a*1e6))*86400e6-3.986004418e14/(a*1e6)/(2*8.98755179e16)*86400e6)*0.299792458", "unit": "km/天"}],
  "verdict": [{"when": "3.986004418e14/8.98755179e16*(1/6.378137e6-1/(a*1e6))-3.986004418e14/(a*1e6)/(2*8.98755179e16)", "text": "引力效应占上风:卫星钟比地面快。"}, {"when": "1", "text": "轨道很低时速度效应占上风:卫星钟反而比地面慢。"}]},
 "check": {"q": "GPS 卫星钟相对地面每天大约?", "options": ["慢 38 微秒", "快 38 微秒", "完全一样"], "answer": 1, "why": "广义相对论快约 45.7 μs,狭义相对论慢约 7.2 μs,合计快约 38 μs。"},
 "uses": "狭义与广义相对论(弱场近似)", "textbook": "大学《相对论导论》",
 "sources": [{"name": "Ashby (2003) Relativity in the Global Positioning System, Living Reviews in Relativity", "url": "https://doi.org/10.12942/lrr-2003-1"}], "review": RV, "ai_generated": AI})
J = {"id": "gps", "title": "卫星钟为什么要调慢", "badge": "授时官", "color": "#ffd27f", "tagline": "没有相对论,导航每天会漂出十多公里。", "stops": S}
json.dump(J, open('deep/routes/gps.json', 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print('ok T=%.3f v=%.0f sr=%.2f gr=%.2f net=%.2f km=%.2f' % (T, v, sr, gr, net, km))
