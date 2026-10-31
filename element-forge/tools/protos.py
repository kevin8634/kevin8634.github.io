import json, math, os
OUT='labs'; os.makedirs(OUT,exist_ok=True)
COMMON=dict(schema='gn-lab/1',world='ef',color='#FF9A3C',updated='2026-11-01',
  ai_generated='问题、猜测题、结论文字由 AI 撰写(元素工坊 2.0 窗口);数值由脚本 build/protos.py 复算;实测数据见数据台账')
IAEA={'name':'IAEA Live Chart of Nuclides(AME2020/NUBASE2020/ENSDF)','url':'https://www-nds.iaea.org/relnsd/vcharthtml/VChartHTML.html'}
# 1 锡同位素链
def chain(N,aa=23.7,ap=11.18,ac=0.711):
    A=50+N; P=ap*(1+(-1)**N)/2/A**0.5
    B=15.75*A-17.8*A**(2/3)-ac*50*49/A**(1/3)-aa*(A-100)**2/A+P; return B/A
p1=dict(COMMON,id='ef.lab.island_chain',title='锡的同位素链 · 中子多少才稳?',
 question='同一种元素,中子太少或太多会怎样?为什么锡(Sn)的稳定同位素特别多?',
 evidence='confirmed',safety='green',bridges=['ef.stars'],unit='MeV',
 params=[{'k':'aa','label':'不对称项 aA(中子质子不平衡的代价)','min':10,'max':35,'step':0.1,'value':23.7,'unit':'MeV'},
         {'k':'ap','label':'配对项 aP(成对更稳)','min':0,'max':20,'step':0.1,'value':11.18,'unit':'MeV'},
         {'k':'ac','label':'库仑项 aC(质子互相排斥)','min':0.4,'max':1.0,'step':0.01,'value':0.711,'unit':'MeV'}],
 model={'type':'fn','x':{'k':'N','from':'data'},'defs':[{'k':'A','expr':'50+N'},{'k':'P','expr':'ap*(1+(-1)^N)/2/A^(1/2)'},
   {'k':'B','expr':'15.75*A-17.8*A^(2/3)-ac*50*49/A^(1/3)-aa*(A-100)^2/A+P'}],'ys':[{'label':'液滴模型','expr':'B/A'}]},
 data={'src':'../../data/ef.island.sn.json','x':'N','ys':[{'col':'ba','label':'实测(锡 Z=50)','color':'#e9eefb'}]},
 chart={'xlabel':'中子数 N','ylabel':'每核子结合能 B/A (MeV)','marks':[{'x':62,'label':'Sn-112'},{'x':74,'label':'Sn-124'}]},
 readout='max',ab={'vary':'ap'},
 predict={'q':'锡(Sn,50 个质子)一共有几种稳定同位素?','options':['只有 1 种','3 种左右','10 种,所有元素里最多'],'answer':2,
  'why':'锡有 10 种稳定同位素(Sn-112 到 Sn-124),是所有元素里最多的。曲线顶部那段平缓的「山脊」上都是稳定核素;50 是质子的「幻数」,让锡格外能容纳不同数目的中子。'},
 conclusions=[{'text':'中子太少或太多,每核子结合能都会下降,稳定的同位素挤在中间一小段。','evidence':'confirmed'},
  {'text':'不对称项把曲线弯成「山脊」:中子和质子越不平衡,代价越大。把它调小,山脊变宽。','evidence':'confirmed'},
  {'text':'配对项让偶数个中子更稳,曲线出现锯齿;锡的 10 种稳定同位素里 7 种是偶数中子。','evidence':'confirmed'},
  {'text':'50 是幻数,锡的稳定同位素数量居首,与壳层效应有关。','evidence':'confirmed'}],
 checks=[{'label':'Sn-120 液滴模型','x':70,'expect':round(chain(70),4),'tol':0.005},{'label':'Sn-100 液滴模型','x':50,'expect':round(chain(50),4),'tol':0.005},{'label':'Sn-133 液滴模型','x':83,'expect':round(chain(83),4),'tol':0.005}],
 sources=[IAEA,{'name':'OpenStax《University Physics Vol.3》10.3 Nuclear Binding Energy','url':'https://openstax.org/books/university-physics-volume-3/pages/10-3-nuclear-binding-energy'}])
# 2 幻数
def shell(N,S=4,w=8,m2=40,m3=70,m4=110):
    g=lambda m:math.exp(-((N-m)/w)**2); return S*(g(28)+g(m2)+g(m3)+g(m4))-2
p2=dict(COMMON,id='ef.lab.island_shell',title='幻数 · 结合能的「奖金」藏在哪?',
 question='液滴模型算不准的那部分结合能,有没有规律?',
 evidence='confirmed',safety='green',bridges=['ef.stars'],unit='MeV',
 params=[{'k':'m2','label':'第 2 个尖峰位置','min':30,'max':70,'step':1,'value':40},
   {'k':'m3','label':'第 3 个尖峰位置','min':60,'max':110,'step':1,'value':70},
   {'k':'m4','label':'第 4 个尖峰位置','min':100,'max':150,'step':1,'value':110},
   {'k':'S','label':'尖峰高度 S','min':0,'max':10,'step':0.1,'value':4,'unit':'MeV'},
   {'k':'w','label':'尖峰宽度 w','min':3,'max':20,'step':0.5,'value':8}],
 model={'type':'fn','x':{'k':'N','from':'data'},'ys':[{'label':'你的壳层「奖金」模型','expr':'S*(exp(-((N-28)/w)^2)+exp(-((N-m2)/w)^2)+exp(-((N-m3)/w)^2)+exp(-((N-m4)/w)^2))-2'}]},
 data={'src':'../../data/ef.island.shell.json','x':'N','ys':[{'col':'res','label':'实测 − 液滴模型(计算值)','color':'#e9eefb'}]},
 chart={'xlabel':'中子数 N','ylabel':'多出来的结合能 (MeV)','marks':[{'x':28,'label':'28'}]},
 ab={'vary':'m3'},
 predict={'q':'实测结合能比液滴模型多出来的「奖金」,会在哪里冒尖?','options':['没有规律,到处都是噪声','在中子数 28、50、82、126 附近','每隔 10 个中子冒一次'],'answer':1,
  'why':'白色曲线在 N=28、50、82、126 处冒尖:中子正好填满一个「壳层」时原子核格外稳。这些数叫幻数(质子也有 2、8、20、28、50、82)。把三个尖峰滑块拖到这些位置,你的模型就能贴上实测。'},
 conclusions=[{'text':'幻数 2、8、20、28、50、82、126:质子或中子数等于幻数的原子核格外稳定(如铅-208 是「双幻数」核)。','evidence':'confirmed'},
  {'text':'原子核里的质子和中子像电子一样分层排布(核壳层模型,1963 年诺贝尔物理学奖)。','evidence':'confirmed'},
  {'text':'中子的下一个幻数,多数理论预言是 184。','evidence':'conjecture'},
  {'text':'质子的下一个幻数是 114、120 还是 126,不同理论给出的答案不同。','evidence':'conjecture'}],
 checks=[{'label':'N=82 默认参数','x':82,'expect':round(shell(82),4),'tol':0.005},{'label':'N=50 拟合参数','x':50,'expect':round(shell(50,5,6,50,82,126),4),'tol':0.005,'params':{'S':5,'w':6,'m2':50,'m3':82,'m4':126}}],
 sources=[IAEA,{'name':'NobelPrize.org · 1963 年诺贝尔物理学奖(Goeppert Mayer、Jensen:核壳层结构)','url':'https://www.nobelprize.org/prizes/physics/1963/summary/'}])
# 3 周期表尽头
def edge(Z,b=0.55,h=3,zi=120):
    s=7-b*(Z-100); return s, s+h*math.exp(-((Z-zi)/4)**2)
p3=dict(COMMON,id='ef.lab.island_edge',title='周期表的尽头 · 稳定岛在哪?',
 question='元素越重越短命,周期表会在哪里结束?传说中的「稳定岛」真的存在吗?',
 evidence='conjecture',safety='red',safetyNote='超重原子核只能在重离子加速器里一个一个地造出来,且有强放射性;这里全部是数据与模型的虚拟实验。',
 bridges=['ef.stars'],unit='log10(秒)',
 params=[{'k':'b','label':'每多 1 个质子,寿命掉几个数量级','min':0.2,'max':0.9,'step':0.01,'value':0.55},
   {'k':'h','label':'稳定岛高度(多活几个数量级)','min':0,'max':10,'step':0.1,'value':3},
   {'k':'zi','label':'稳定岛中心(质子数)','min':110,'max':126,'step':1,'value':120}],
 model={'type':'fn','x':{'k':'Z','from':'data'},'defs':[{'k':'s','expr':'7-b*(Z-100)'}],
   'ys':[{'label':'平滑外推(没有岛)','expr':'s'},{'label':'加上稳定岛(猜想)','expr':'s+h*exp(-((Z-zi)/4)^2)','color':'#ffd27a'}]},
 data={'src':'../../data/ef.island.edge.json','x':'Z','ys':[{'col':'best','label':'已知最长寿同位素(实测)','color':'#e9eefb'}]},
 chart={'xlabel':'质子数 Z','ylabel':'log10(半衰期/秒)','marks':[{'x':114,'label':'Fl 114'},{'x':118,'label':'Og 118'},{'x':120,'label':'120?'},{'x':126,'label':'126?'}]},
 ab={'vary':'h'},
 predict={'q':'按现在的趋势外推,120 号元素最长寿的同位素大约能活多久?','options':['像铀一样几十亿年','不到 1 毫秒','正好一天左右'],'answer':1,
  'why':'118 号 Og 最长寿的同位素只活约 0.6 毫秒(IAEA 收录值约 10^−3.2 秒)。沿这条线外推,120 号大约在万分之一秒量级。稳定岛如果存在,中子数接近 184 的核可能活得长得多——但它们中子太多,现有的束流和靶都造不出来。'},
 conclusions=[{'text':'目前命名的最重元素是 118 号 Og(2016 年由 IUPAC 命名),第 7 周期已经填满。','evidence':'confirmed'},
  {'text':'越往周期表尽头,已知最长寿同位素的寿命大体越短,但 110–112 号附近有一段「变平」。','evidence':'confirmed'},
  {'text':'截至 2026 年 9 月,119、120 号仍在寻找中,尚无公认的合成报告;2024 年用钛-50 束流造出 116 号,为合成 120 号铺路。','evidence':'confirmed'},
  {'text':'理论计算认为 Og 受相对论效应影响,化学性质可能不像典型的稀有气体。','evidence':'inferred'},
  {'text':'稳定岛(质子约 114–126、中子约 184)是理论预言,能活多久、在哪里,都还没有被实验证实。','evidence':'conjecture'}],
 checks=[{'label':'Z=118 平滑外推','x':118,'expect':round(edge(118)[0],4),'tol':0.005},{'label':'Z=120 加岛','x':120,'expect':round(edge(120)[1],4),'tol':0.005,'y':1}],
 sources=[IAEA,{'name':'IUPAC · 113、115、117、118 号元素命名(2016)','url':'https://iupac.org/iupac-announces-the-names-of-the-elements-113-115-117-and-118/'},
  {'name':'Berkeley Lab · 用钛-50 造出 116 号(2024)','url':'https://newscenter.lbl.gov/2024/07/23/a-new-way-to-make-element-116-opens-the-door-to-heavier-atoms/'},
  {'name':'Annual Review of Nuclear and Particle Science · The Quest for Superheavy Nuclei(2026)','url':'https://www.annualreviews.org/content/journals/10.1146/annurev-nucl-100324-103404'}])
for p in (p1,p2,p3): json.dump(p,open(f"{OUT}/{p['id']}.json",'w'),ensure_ascii=False,indent=1)
print([c['expect'] for p in (p1,p2,p3) for c in p['checks']])
