# 星璃 B3:以 VRoid AvatarSample_G(CC0)为底,重绘发色/瞳色/服装为「银青双马尾 + 银白潮牌科技夹克 + 鎏金流光」
import json,struct,io,colorsys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
src='/workspace/work/m15/avatarsample_g/AvatarSample_G.vrm'
b=open(src,'rb').read(); l=struct.unpack('<I',b[12:16])[0]; j=json.loads(b[20:20+l]); bin0=20+l+8
binlen=struct.unpack('<I',b[20+l:24+l])[0]; BIN=b[bin0:bin0+binlen]
def img(k): bv=j['bufferViews'][j['images'][k]['bufferView']]; o=bv.get('byteOffset',0); return Image.open(io.BytesIO(BIN[o:o+bv['byteLength']])).convert('RGBA')
def A(im): return np.asarray(im).astype(np.float32)/255
def I(a): return Image.fromarray((np.clip(a,0,1)*255).astype(np.uint8),'RGBA')
def hx(h): return np.array([int(h[i:i+2],16)/255 for i in (0,2,4)],np.float32)
def lum(a): return a[...,0]*.3+a[...,1]*.59+a[...,2]*.11
def gmap(L,c0,c1,g=1.0):
    t=np.clip(L,0,1)[...,None]**g; return c0*(1-t)+c1*t
out={}
# --- 头发:银白→青,发梢粉色改冰青
for k in (19,22,25):
    a=A(img(k)); L=lum(a); pink=np.clip((a[...,0]-a[...,1])*2.2,0,1)[...,None]
    L2=np.clip((L-0.45)/0.55,0,1)
    c=gmap(L2,hx('9fc4d2'),hx('f4fbfd'),0.7); c=c*(1-pink)+gmap(L2,hx('5cc6df'),hx('bff0f8'))*pink
    a[...,:3]=c; out[k]=I(a)
# --- 发饰(原绿色发带)→ 鎏金
a=A(img(26)); L=lum(a); a[...,:3]=gmap(L,hx('8a5a22'),hx('ffe2a0')); out[26]=I(a)
# --- 瞳孔:蓝→青
a=A(img(9)); h=a.shape
rgb=a[...,:3].reshape(-1,3); hsv=np.array([colorsys.rgb_to_hsv(*p) for p in rgb[::1]]) if False else None
r,g,bb=a[...,0],a[...,1],a[...,2]; mx=np.max(a[...,:3],-1); mn=np.min(a[...,:3],-1); v=mx; s=np.where(mx>0,(mx-mn)/np.maximum(mx,1e-5),0)
L=lum(a); a[...,:3]=gmap(np.clip(L*1.25,0,1),hx('0b3e4e'),hx('b6f4ff'),0.9)*(s[...,None]>0.12)+a[...,:3]*(s[...,None]<=0.12)
out[9]=I(a)
# --- 服装:夹克(银白)+ 石墨袖口 + 灰色高领针织内搭 + 鎏金饰线
a=A(img(17)); H,W=a.shape[:2]; L=lum(a)
mx=np.max(a[...,:3],-1); mn=np.min(a[...,:3],-1); s=(mx-mn)/np.maximum(mx,1e-5)
hue=np.zeros_like(L); rr,gg,b2=a[...,0],a[...,1],a[...,2]
gold=(rr>gg)&(gg>b2)&(s>0.45)&(mx>0.55)&((rr-gg)<0.45)
yy,xx=np.mgrid[0:H,0:W]
jacket=gmap(np.clip((L-0.55)/0.45,0,1),hx('9ba4ae'),hx('f4f6f8'),1.1)
c=jacket.copy()
sleeve=(xx<545)|(xx>1515)
cuff=sleeve&(yy>860)&(yy<1080)
c[cuff]=gmap(L[cuff],hx('1d2127'),hx('454c56'))
bod=(xx>=545)&(xx<=1515)&(yy<1075)
inner=bod&(xx>905)&(xx<1110)
knit=gmap(L,hx('6f757e'),hx('a7adb5'))*(0.93+0.07*((xx//6+yy//6)%2)[...,None])
c[inner]=knit[inner]
waist=bod&(yy>960)
c[waist]=gmap(L[waist],hx('2a2f36'),hx('50575f'))
skirt=yy>=1075
c[skirt]=gmap(L[skirt],hx('15181d'),hx('3a4049'))
c[gold]=a[...,:3][gold]
a[...,:3]=c
img2=I(a); em=Image.new('RGBA',(W,H),(0,0,0,255)); d=ImageDraw.Draw(img2); de=ImageDraw.Draw(em)
GOLD=(255,196,110,255)
def line(pts,w):
    d.line(pts,fill=GOLD,width=w); de.line(pts,fill=(255,210,140,255),width=w+2)
for x0 in (0,1515):   # 袖子:袖口上缘金线 + 两道纵向流光线
    line([(x0,860),(x0+533,860)],10); line([(x0,1070),(x0+533,1070)],6)
    for fx in (0.3,0.72): x=int(x0+533*fx); line([(x,180),(x,860)],6)
line([(905,520),(905,1075)],10); line([(1110,520),(1110,1075)],10)   # 门襟
line([(545,960),(1515,960)],8)   # 下摆
for x in (690,1360): line([(x,560),(x+40,955)],5)  # 胸前斜向流光
out[17]=img2.convert('RGBA'); emi=em.filter(ImageFilter.GaussianBlur(1.5))
# --- 身体:躯干改为灰色高领针织内搭(从夹克开口处可见)
a=A(img(15)); H2,W2=a.shape[:2]; yy2,xx2=np.mgrid[0:H2,0:W2]; L=lum(a)
tor=(xx2>483)&(xx2<1565)&(yy2<1310)
kn=gmap(np.clip((L-0.6)/0.4,0,1),hx('5f656e'),hx('9aa1aa'))*(0.92+0.08*((xx2//5+yy2//5)%2)[...,None])
a[...,:3][tor]=kn[tor]; out[15]=I(a)
# --- 写回
def enc(im,size=None,fmt='png'):
    if size: im=im.resize(size,Image.LANCZOS)
    o=io.BytesIO()
    if fmt=='jpeg': im.convert('RGB').save(o,'JPEG',quality=88)
    else: im.save(o,'PNG',optimize=True)
    return o.getvalue(),'image/'+fmt
SZ={15:(1024,1024),16:(1024,1024),17:(1024,1024),27:(256,256),11:(1024,1024),12:(512,512),19:(512,512),20:(512,512),4:(512,256),9:(512,256),10:(512,256)}
repl={}
for k in range(len(j['images'])):
    if k in out or k in SZ:
        im=out.get(k) or img(k); fmt='jpeg' if k==27 else 'png'
        repl[j['images'][k]['bufferView']]=enc(im,SZ.get(k),fmt)+(k,)
# 新增自发光贴图
ed,emt=enc(emi.convert('RGB'),(1024,1024),'jpeg')
j['bufferViews'].append({'buffer':0,'byteOffset':0,'byteLength':len(ed)}); evb=len(j['bufferViews'])-1
j['images'].append({'name':'XL_Emission','bufferView':evb,'mimeType':emt}); j['textures'].append({'sampler':0,'source':len(j['images'])-1}); etex=len(j['textures'])-1
nb=bytearray()
for i,bv in enumerate(j['bufferViews']):
    while len(nb)%4: nb.append(0)
    if i==evb: d0=ed
    elif i in repl: d0=repl[i][0]; j['images'][repl[i][2]]['mimeType']=repl[i][1]
    else: o=bv.get('byteOffset',0); d0=BIN[o:o+bv['byteLength']]
    bv['byteOffset']=len(nb); bv['byteLength']=len(d0); nb+=d0
while len(nb)%4: nb.append(0)
j['buffers'][0]['byteLength']=len(nb)
VM=j['extensions']['VRM']['materialProperties']
for m in VM:
    n=m['name']; vp=m['vectorProperties']
    if 'HAIR_03' in n: vp['_Color']=[1,0.86,0.55,1]; vp['_ShadeColor']=[0.8,0.55,0.25,1]
    elif 'HAIR' in n: vp['_Color']=[1,1,1,1]; vp['_ShadeColor']=[0.6,0.78,0.86,1]; vp['_OutlineColor']=[0.2,0.35,0.45,1]
    elif 'Body_00_SKIN' in n: pass
    elif 'Onepice' in n: vp['_ShadeColor']=[0.7,0.75,0.82,1]; vp['_EmissionColor']=[1,0.78,0.42,1]; m['textureProperties']['_EmissionMap']=etex; vp['_OutlineColor']=[0.15,0.17,0.2,1]
    elif 'FaceBrow' in n: vp['_Color']=[0.82,0.9,0.94,1]; vp['_ShadeColor']=[0.6,0.72,0.8,1]
    elif 'Eyelash' in n or 'Eyeline' in n: vp['_Color']=[0.22,0.28,0.38,1]; vp['_ShadeColor']=[0.18,0.22,0.3,1]
meta=j['extensions']['VRM']['meta']; meta['title']='星璃 Xingli (B3)'; meta['author']='天枢 Starhelm(底模 VRoid AvatarSample_G, CC0)'
js=json.dumps(j,separators=(',',':'),ensure_ascii=False).encode()
while len(js)%4: js+=b' '
o=b'glTF'+struct.pack('<II',2,12+8+len(js)+8+len(nb))+struct.pack('<I',len(js))+b'JSON'+js+struct.pack('<I',len(nb))+b'BIN\x00'+bytes(nb)
open('/workspace/projects/29960140-ee73-459a-90ca-9cbe28f09cb4/src/_dev/xl.vrm','wb').write(o); print(len(o)//1024,'KB')
out[17].resize((800,800)).save('/workspace/work/xl/cloth.jpg'.replace('.jpg','.png'))
