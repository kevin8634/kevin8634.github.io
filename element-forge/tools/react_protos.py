# 元素工坊 v2.1 · 反应台 Lab Kit 协议生成(gn-lab/1);数值由本脚本复算写入 checks
import json, math, os
H=os.path.dirname(os.path.abspath(__file__)); OUT=os.path.join(H,'..','react','labs')
C=dict(schema='gn-lab/1',world='ef',color='#FF9A3C',updated='2026-11-01',
  ai_generated='问题、猜测题、结论文字由 AI 撰写(元素工坊 v2.1 窗口);数值由脚本 tools/react_protos.py 复算')
# L1 速率:V(t)=Vm(1-e^{-kt}),k=k0·c·s·exp(-Ea/R(1/T-1/293.15)),Ea 为示意值
EA=50000; R=8.314
def V(t,T=20,c=1,s=1): k=0.01*c*s*math.exp(-EA/R*(1/(T+273.15)-1/293.15)); return 100*(1-math.exp(-k*t))
rate=dict(C,id='ef.lab.react_rate',title='快一点,慢一点 · 大理石与稀盐酸',question='温度、浓度、颗粒大小,哪个能让二氧化碳冒得更快?快多少?',
 evidence='inferred',safety='yellow',safetyNote='盐酸有腐蚀性;真实实验只在学校实验室由老师指导。这里是虚拟模型,曲线为示意。',unit='mL',
 params=[{'k':'T','label':'温度 T','min':10,'max':80,'step':1,'value':20,'unit':'°C'},
         {'k':'c','label':'盐酸浓度(相对值)','min':0.5,'max':3,'step':0.1,'value':1,'unit':'倍'},
         {'k':'s','label':'颗粒大小(1 = 块状,5 = 粉末)','min':1,'max':5,'step':0.5,'value':1,'unit':''}],
 model={'type':'fn','x':{'k':'t','from':0,'to':180,'step':3},'defs':[{'k':'k','expr':'0.01*c*s*exp(-%d/8.314*(1/(T+273.15)-1/293.15))'%EA}],
   'ys':[{'label':'收集到的 CO₂ 体积','expr':'100*(1-exp(-k*t))'}]},
 chart={'xlabel':'时间 t (秒)','ylabel':'气体体积 (mL,示意)','marks':[{'x':60,'label':'1 分钟'}]},ab={'vary':'T'},
 predict={'q':'只把温度从 20 °C 提到 60 °C,反应大约会快几倍?','options':['快一点点,1.5 倍左右','大约 10 倍','100 倍以上'],'answer':1,
  'why':'经验上温度每升高 10 °C,很多反应速率变成原来的 2–4 倍。本模型取活化能约 50 kJ/mol(示意值),60 °C 时约快 12 倍。'},
 conclusions=[{'text':'升高温度、增大浓度、把块状换成粉末(增大接触面积),都能加快反应。','evidence':'confirmed'},
  {'text':'温度的影响最「陡」:速率随温度大致按指数增长(阿伦尼乌斯公式)。','evidence':'confirmed'},
  {'text':'碰撞理论:粒子要碰得够多、够狠(超过活化能)才反应。本台的活化能与速率常数是示意值,只看趋势和数量级。','evidence':'inferred'}],
 checks=[{'label':'20 °C,60 秒','x':60,'expect':round(V(60),3),'tol':0.01},{'label':'60 °C,60 秒','x':60,'expect':round(V(60,T=60),3),'tol':0.01,'params':{'T':60}},
   {'label':'粉末 5 倍,30 秒','x':30,'expect':round(V(30,s=5),3),'tol':0.01,'params':{'s':5}}],
 sources=[{'name':'人教版高中《化学》必修第二册 第六章 第二节 化学反应的速率与限度'},{'name':'OpenStax《Chemistry 2e》12.5 Collision Theory','url':'https://openstax.org/books/chemistry-2e/pages/12-5-collision-theory'}])
# L3 平衡:2NO2 ⇌ N2O4,ΔH°=-57.2 kJ/mol,ΔS°=-175.8 J/(mol·K)
DH=57200; DS=175.8
def y(T,P=1):
  K=math.exp(DH/(R*T)-DS/R); a=K*P; return (math.sqrt(1+4*a)-1)/(2*a)
eq=dict(C,id='ef.lab.react_eq',title='平衡往哪边走 · 2NO₂ ⇌ N₂O₄',question='把装着红棕色 NO₂ 的密封管加热或加压,颜色会怎样变?为什么?',
 evidence='confirmed',safety='red',safetyNote='二氧化氮有毒。只限专业实验室;这里只做虚拟演示,不提供任何制取或操作方法。',unit='',
 params=[{'k':'P','label':'总压 P','min':0.2,'max':5,'step':0.1,'value':1,'unit':'bar'}],
 model={'type':'fn','x':{'k':'T','from':260,'to':420,'step':2},'defs':[{'k':'K','expr':'exp(%d/(8.314*T)-%s/8.314)'%(DH,DS)},{'k':'a','expr':'K*P'},{'k':'y','expr':'(sqrt(1+4*a)-1)/(2*a)'}],
   'ys':[{'label':'NO₂ 所占比例','expr':'y'},{'label':'红棕色深浅(∝ NO₂ 浓度,相对值)','expr':'y*P*298/T','color':'#ff7a3c'}]},
 chart={'xlabel':'温度 T (K)','ylabel':'比例 / 相对深浅','marks':[{'x':273,'label':'冰水'},{'x':353,'label':'热水'}]},ab={'vary':'P'},
 predict={'q':'把这管气体从冰水移到热水里,颜色会?','options':['变深','变浅','不变'],'answer':0,
  'why':'2NO₂ → N₂O₄ 放热。加热时平衡向吸热方向(生成 NO₂)移动,红棕色变深;放进冰水则变浅。'},
 conclusions=[{'text':'升高温度,平衡向吸热反应方向移动:NO₂ 变多,颜色变深。','evidence':'confirmed'},
  {'text':'增大压强,平衡向气体分子数减少的方向(生成 N₂O₄)移动;但因为浓度整体变大,颜色仍比加压前深(先明显变深,再稍稍变浅)。','evidence':'confirmed'},
  {'text':'勒夏特列原理:平衡总朝着「减弱这种改变」的方向移动,但不能完全抵消。','evidence':'confirmed'},
  {'text':'本台的数值用标准焓变与熵变近似计算(ΔH°≈−57.2 kJ/mol),只作定性对照。','evidence':'inferred'}],
 checks=[{'label':'298 K,1 bar','x':298,'expect':round(y(298),4),'tol':0.01},{'label':'350 K,1 bar','x':350,'expect':round(y(350),4),'tol':0.01},{'label':'298 K,4 bar','x':298,'expect':round(y(298,4),4),'tol':0.01,'params':{'P':4}}],
 sources=[{'name':'人教版高中《化学》选择性必修1 第二章 化学平衡(定性介绍)'},{'name':'NIST Chemistry WebBook:NO₂、N₂O₄ 标准生成焓与熵','url':'https://webbook.nist.gov/chemistry/'}])
for p in (rate,eq): json.dump(p,open(os.path.join(OUT,p['id']+'.json'),'w',encoding='utf-8'),ensure_ascii=False,indent=1)
print('rate 20/60C ratio',(0.01*math.exp(-EA/R*(1/333.15-1/293.15)))/0.01, 'y298',y(298),'y350',y(350),'color 1bar vs 4bar',y(298),y(298,4)*4)
