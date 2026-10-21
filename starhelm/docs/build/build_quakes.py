# 生成 sh-quakes-data.js:USGS 近一年 M5+ 地震快照 + PB2002 板块边界(Bird 2003;fraxen/tectonicplates,ODC-By)
# 用法: python3 build_quakes.py q.csv PB2002_boundaries.json out.js   (T0 = 2026-10-22T00:00Z)
import csv,sys,json,datetime as dt
qf,pf,out=sys.argv[1:4]
T0=dt.datetime(2026,10,22,tzinfo=dt.timezone.utc)
ev=[]
for r in csv.DictReader(open(qf)):
    if r['type']!='earthquake': continue
    t=dt.datetime.fromisoformat(r['time'].replace('Z','+00:00'))
    ev.append([round(float(r['latitude']),2),round(float(r['longitude']),2),round(float(r['depth'])),round(float(r['mag']),1),round((T0-t).total_seconds()/86400,1),r['place']])
big=sorted(ev,key=lambda e:-e[3])[:12]
names={str(i):e[5] for i,e in enumerate(ev) if e in big}
evs=[e[:5] for e in ev]
pl=[]
for f in json.load(open(pf))['features']:
    c=f['geometry']['coordinates']; seg=[]
    last=None
    for lon,lat in c:
        p=[round(lat,1),round(lon,1)]
        if p!=last: seg+=p; last=p
    if len(seg)>=4: pl.append(seg)
meta={'t0':'2026-10-22T00:00:00Z','n':len(evs),'src':'USGS ANSS ComCat(M5+,2025-10-22 至 2026-10-22)','big':names}
open(out,'w').write('/* 天枢 Starhelm · 地震与板块快照(自动生成,勿手改)。地震:USGS Earthquake Hazards Program(公有领域);板块边界:PB2002,Bird (2003) G3 4(3):1027,数字化 Hugo Ahlenius / Nordpil(fraxen/tectonicplates,ODC-By 1.0)。ev=[纬度,经度,深度km,震级,距T0天数] */\nwindow.SH_QK='+json.dumps(meta,ensure_ascii=False)+';\nwindow.SH_QK.ev='+json.dumps(evs,separators=(',',':'))+';\nwindow.SH_QK.pb='+json.dumps(pl,separators=(',',':'))+';\n')
print(len(evs),len(pl),max(e[2] for e in evs))
