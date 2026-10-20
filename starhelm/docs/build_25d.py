import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage as nd
P='/workspace/projects/29960140-ee73-459a-90ca-9cbe28f09cb4/'; B=P+'design/'; O=P+'src/starhelm/'
# ---------- cockpit ----------
im=Image.open(B+'m16/cockpit_B_luxury.png').convert('RGB'); a=np.asarray(im).astype(float)
W,H=im.size; s=W/900; lum=a.mean(2)
m=nd.median_filter(lum,5)<60
lab,n=nd.label(m); w=lab==lab[int(120*s),int(150*s)]
w[:int(62*s)]=False
w=nd.binary_fill_holes(nd.binary_closing(w,iterations=14))
yy,xx=np.mgrid[0:H,0:W]
gal=((xx/s-480)/80)**2+((yy/s-228)/44)**2<1
alpha=np.ones((H,W))
g=np.clip((lum-45)/90,0,1)*np.clip((a[:,:,2]-a[:,:,0]+10)/40,0,1)
alpha[w]=0; alpha[w&gal]=g[w&gal]
al=Image.fromarray((alpha*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.5))
c=im.copy(); c.putalpha(al)
c.save(O+'ck25.webp',quality=88,method=6)
d=Image.open('depth.png').convert('L').filter(ImageFilter.GaussianBlur(6))
d.resize((704,384)).save(O+'ck25d.jpg',quality=85)
v=Image.new('RGBA',c.size,(255,0,255,255)); v.alpha_composite(c); v.convert('RGB').resize((704,384)).save('ckv.jpg')
# ---------- xingli ----------
src=Image.open(B+'xingli/xingli_B3_street_portrait.png').convert('RGB')
ma=np.asarray(Image.open('xl_orig_cut.png'))[:,:,3].astype(float)
soft=np.clip(ma*4,0,255)
solid=soft>35; solid=nd.binary_opening(solid,iterations=2)
lab,n=nd.label(solid); sz=nd.sum(solid,lab,range(1,n+1))
keep=np.zeros_like(solid)
for i,z in enumerate(sz):
  if z>800:
    ys,xs=np.nonzero(lab==i+1)
    if xs.mean()>0.33*src.size[0]: keep|=lab==i+1
keep=nd.binary_fill_holes(nd.binary_closing(keep,iterations=18)); keep=nd.binary_erosion(keep,iterations=2)
near=nd.binary_dilation(keep,iterations=25)
A=np.where(keep,255,np.where(near,soft,0))
A[:, :int(0.33*src.size[0])]=0
A[-3:,:]=A[-4:-3,:]
x0,x1=520,1300
cut=src.copy(); cut.putalpha(Image.fromarray(A.astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.8)))
cut=cut.crop((x0,0,x1,src.size[1]))
cut.save(O+'xl25.webp',quality=90,method=6)
# blink patch: mirror closed eye (img-right) onto open eye
cx,cy=935-x0,222; ox,oy=830-x0,228
pw,ph=96,52
patch=cut.crop((cx-pw//2,cy-ph//2+4,cx+pw//2,cy+ph//2+4)).transpose(Image.FLIP_LEFT_RIGHT).convert('RGB')
yy,xx=np.mgrid[0:ph,0:pw]; r=((xx-pw/2)/(pw/2))**2+((yy-ph/2)/(ph/2))**2
pa=np.clip((1-r)/0.35,0,1)*255; patch.putalpha(Image.fromarray(pa.astype(np.uint8)))
patch.save(O+'xl25b.webp',quality=92); patch.save('patch.png')
print('blink rect uv', (ox-pw/2)/cut.size[0], 1-(oy+ph/2)/cut.size[1], pw/cut.size[0], ph/cut.size[1])
print('eye open at',ox,oy,'size',cut.size)
v=Image.new('RGBA',cut.size,(255,0,255,255)); v.alpha_composite(cut); v.convert('RGB').resize((390,384)).save('xlv.jpg')
src.crop((x0+ox-60,oy-40,x0+ox+60,oy+40)).resize((240,160)).save('eyeo.png'); patch.resize((180,112)).save('eyep.png')
