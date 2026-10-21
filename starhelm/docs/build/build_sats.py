# 生成 sh-sats-data.js:CelesTrak 活跃卫星 GP(active.csv)+ SATCAT(在轨失效卫星/火箭残骸/碎片)
# 用法: python3 build_sats.py active.csv satcat.csv out.js  (T0 = 2026-10-22T00:00Z)
import csv,sys,math,struct,base64,random,json,collections,datetime as dt
act,sat,out=sys.argv[1:4]
MU=398600.4418; RE=6378.137; J2=1.08262668e-3
T0=dt.datetime(2026,10,22,tzinfo=dt.timezone.utc)
random.seed(7)
rows=[]; ids=set()
def pack(a,e,i,O,w,M,kind,sl,yr):
    if a>65000 or a<RE: return
    rows.append(struct.pack('<6HBB',int(a),min(65535,int(e*65535)),int(i/180*65535)%65536,int(n360(O)/360*65535),int(n360(w)/360*65535),int(n360(M)/360*65535),kind|(sl<<2),max(0,min(255,yr-1957))))
def n360(x): return x%360
for r in csv.DictReader(open(act)):
    n=float(r['MEAN_MOTION'])*2*math.pi/86400; a=(MU/n**2)**(1/3); e=float(r['ECCENTRICITY']); i=float(r['INCLINATION'])
    ep=dt.datetime.fromisoformat(r['EPOCH']).replace(tzinfo=dt.timezone.utc); d=(T0-ep).total_seconds()
    p=a*(1-e*e); k=1.5*n*J2*(RE/p)**2
    O=float(r['RA_OF_ASC_NODE'])+math.degrees(-k*math.cos(math.radians(i))*d)
    w=float(r['ARG_OF_PERICENTER'])+math.degrees(k*(2-2.5*math.sin(math.radians(i))**2)*d)
    M=float(r['MEAN_ANOMALY'])+math.degrees(n*d)
    yr=int(r['OBJECT_ID'][:4]) if r['OBJECT_ID'][:4].isdigit() else 2026
    pack(a,e,i,O,w,M,0,1 if 'STARLINK' in r['OBJECT_NAME'] else 0,yr); ids.add(r['NORAD_CAT_ID'])
na=len(rows)
cnt=collections.Counter(); years=collections.Counter()
for r in csv.DictReader(open(sat)):
    if r['OBJECT_TYPE']=='PAY' and r['LAUNCH_DATE'][:4].isdigit(): years[int(r['LAUNCH_DATE'][:4])]+=1
    if r['DECAY_DATE'] or r['ORBIT_CENTER']!='EA': continue
    t=r['OBJECT_TYPE']; kind=None
    if t=='PAY': kind=0 if r['NORAD_CAT_ID'] in ids else 1
    elif t=='R/B': kind=2
    elif t in('DEB','UNK'): kind=3
    cnt[kind]+=1
    if kind==0 or not r['APOGEE'] or not r['PERIGEE']: continue
    ap=float(r['APOGEE'])+RE; pe=float(r['PERIGEE'])+RE; a=(ap+pe)/2; e=(ap-pe)/(ap+pe)
    yr=int(r['LAUNCH_DATE'][:4]) if r['LAUNCH_DATE'][:4].isdigit() else 2000
    pack(a,e,float(r['INCLINATION'] or 0),random.uniform(0,360),random.uniform(0,360),random.uniform(0,360),kind,0,yr)
b=base64.b64encode(b''.join(rows)).decode()
meta={'t0':'2026-10-22T00:00:00Z','active':na,'n':len(rows),'inorbit':{'active':na,'dead':cnt[1],'rb':cnt[2],'deb':cnt[3]},'years':{str(k):v for k,v in sorted(years.items()) if k>=1957},'src':'CelesTrak GP active + SATCAT,2026-10-22 下载'}
open(out,'w').write('/* 天枢 Starhelm · 卫星轨道快照(自动生成,勿手改)来源 CelesTrak(celestrak.org)GP 活跃卫星 + SATCAT;每条 14 字节:a(km),e,i,Ω,ω,M(T0 时刻),kind|starlink<<2,发射年-1957 */\nwindow.SH_SATS='+json.dumps(meta,ensure_ascii=False)+';\nwindow.SH_SATS.b64="'+b+'";\n')
print(meta['inorbit'],len(rows),len(b))
