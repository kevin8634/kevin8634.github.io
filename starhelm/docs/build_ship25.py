import onnxruntime as ort, numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage as nd
P='/workspace/projects/29960140-ee73-459a-90ca-9cbe28f09cb4/'
im=Image.open(P+'design/ship/chordion_B_manifold.png').convert('RGB'); a=np.asarray(im).astype(float); H,W=a.shape[:2]
s=ort.InferenceSession('/tmp/isnet.onnx'); i=s.get_inputs()[0]
x=np.asarray(im.resize((1024,1024),Image.BICUBIC),np.float32)/255-0.5
m=s.run(None,{i.name:x.transpose(2,0,1)[None].astype(np.float32)})[0][0][0]; m=(m-m.min())/(m.max()-m.min())
m=np.asarray(Image.fromarray((m*255).astype(np.uint8)).resize((W,H),Image.BICUBIC)).astype(float)/255
np.save('ship_m.npy',m)
r,g,b=a[:,:,0],a[:,:,1],a[:,:,2]; lum=a.mean(2)
ring=np.clip(((b-g)+(r-g)*0.6-25)/50,0,1)*np.clip((lum-70)/60,0,1)
np.save('ring.npy',ring)
for nm,arr in [('shipm',m),('ringm',ring)]:
  Image.fromarray((arr*255).astype(np.uint8)).resize((704,384)).save(nm+'.jpg')
import onnxruntime as ort, numpy as np
from PIL import Image, ImageFilter
P='/workspace/projects/29960140-ee73-459a-90ca-9cbe28f09cb4/'; O=P+'src/starhelm/'
im=Image.open(P+'design/ship/chordion_B_manifold.png').convert('RGB'); W,H=im.size
m=np.load('ship_m.npy'); ring=np.load('ring.npy')*np.clip(m*1.5,0,1)
m=np.clip((m-0.06)/0.6,0,1)
s=ort.InferenceSession('/tmp/midas.onnx'); i=s.get_inputs()[0]
x=np.asarray(im.resize((256,256),Image.BICUBIC),np.float32)/255; x=(x-[0.485,0.456,0.406])/[0.229,0.224,0.225]
d=s.run(None,{i.name:x.transpose(2,0,1)[None].astype(np.float32)})[0][0]; d=(d-d.min())/(d.max()-d.min())
d=np.asarray(Image.fromarray((d*255).astype(np.uint8)).resize((W,H),Image.BICUBIC).filter(ImageFilter.GaussianBlur(4))).astype(float)
ys,xs=np.nonzero(m>0.1); x0,x1,y0,y1=max(0,xs.min()-12),min(W,xs.max()+12),max(0,ys.min()-12),min(H,ys.max()+12)
print('crop',x0,y0,x1,y1, 'canopy uv', (190/900*W-x0)/(x1-x0), 1-(250/491*H-y0)/(y1-y0), 'engine uv',(770/900*W-x0)/(x1-x0),1-(215/491*H-y0)/(y1-y0))
c=im.copy(); c.putalpha(Image.fromarray((m*255).astype(np.uint8))); c.crop((x0,y0,x1,y1)).save(O+'ship25.webp',quality=90,method=6)
aux=np.stack([d,ring*255,np.zeros_like(d)],2).astype(np.uint8)
Image.fromarray(aux).crop((x0,y0,x1,y1)).resize(((x1-x0)//2,(y1-y0)//2)).save(O+'ship25a.jpg',quality=88)
# --- 10-21:从 ck25.webp 挖掉概念图里的星系(框 x595-872,y290-426,连通域取 (751,357)),改由 3D 粒子渲染 ---
