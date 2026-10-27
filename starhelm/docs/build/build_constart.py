"""天枢 Starhelm 2.0 · C2.0 星座插画数据构建
输入(均不随页面分发,构建时下载):
  - Stellarium skycultures/modern(旧名 western)index.json + illustrations/*.png
    https://github.com/Stellarium/stellarium/tree/210b7ccbaa174b673a48fa9ff57ebd37239c1cb4/skycultures/modern
    插画:Johan Meuris,Free Art License 1.3;index.json 文本与数据 CC BY-SA 4.0(Stellarium's team)
  - HYG 恒星库 v4.1 hygdata_v41.csv(David Nash / astronexus,CC BY-SA 4.0)
输出:
  - x/constart/<name>.webp   灰度 WebP,保持原尺寸(≤512)
  - x/constart/s/<name>.webp 手机版,≤256(仅原图 512 的有)
  - x/sh-x-constart-data.js  每个星座:[缩写, 拉丁名, 中文名, 文件名|null, 宽, 高, 是否有手机版, 锚点×3, 标签重心系数]
    锚点 = [像素x, 像素y, X, Y, Z](J2000 赤道直角坐标,单位光年,来自 HYG;HIP 号写在注释表 hip)
用法:python3 docs/build/build_constart.py <stellarium modern 目录(含 index.json 与 illustrations/)> <hygdata_v41.csv>  (在 starhelm/ 下运行)
"""
import json, csv, sys, os, math
from PIL import Image

ZH = {'And':'仙女座','Ant':'唧筒座','Aps':'天燕座','Aqr':'宝瓶座','Aql':'天鹰座','Ara':'天坛座','Ari':'白羊座','Aur':'御夫座','Boo':'牧夫座','Cae':'雕具座',
'Cam':'鹿豹座','Cnc':'巨蟹座','CVn':'猎犬座','CMa':'大犬座','CMi':'小犬座','Cap':'摩羯座','Car':'船底座','Cas':'仙后座','Cen':'半人马座','Cep':'仙王座',
'Cet':'鲸鱼座','Cha':'蝘蜓座','Cir':'圆规座','Col':'天鸽座','Com':'后发座','CrA':'南冕座','CrB':'北冕座','Crv':'乌鸦座','Crt':'巨爵座','Cru':'南十字座',
'Cyg':'天鹅座','Del':'海豚座','Dor':'剑鱼座','Dra':'天龙座','Equ':'小马座','Eri':'波江座','For':'天炉座','Gem':'双子座','Gru':'天鹤座','Her':'武仙座',
'Hor':'时钟座','Hya':'长蛇座','Hyi':'水蛇座','Ind':'印第安座','Lac':'蝎虎座','Leo':'狮子座','LMi':'小狮座','Lep':'天兔座','Lib':'天秤座','Lup':'豺狼座',
'Lyn':'天猫座','Lyr':'天琴座','Men':'山案座','Mic':'显微镜座','Mon':'麒麟座','Mus':'苍蝇座','Nor':'矩尺座','Oct':'南极座','Oph':'蛇夫座','Ori':'猎户座',
'Pav':'孔雀座','Peg':'飞马座','Per':'英仙座','Phe':'凤凰座','Pic':'绘架座','Psc':'双鱼座','PsA':'南鱼座','Pup':'船尾座','Pyx':'罗盘座','Ret':'网罟座',
'Sge':'天箭座','Sgr':'人马座','Sco':'天蝎座','Scl':'玉夫座','Sct':'盾牌座','Ser':'巨蛇座','Sex':'六分仪座','Tau':'金牛座','Tel':'望远镜座','Tri':'三角座',
'TrA':'南三角座','Tuc':'杜鹃座','UMa':'大熊座','UMi':'小熊座','Vel':'船帆座','Vir':'室女座','Vol':'飞鱼座','Vul':'狐狸座'}
PC = 3.26156
src, hygp = sys.argv[1], sys.argv[2]
idx = json.load(open(os.path.join(src, 'index.json'), encoding='utf-8'))
need = set()
for c in idx['constellations']:
    for ln in c['lines']:
        need.update(h for h in ln if isinstance(h, int))
    if 'image' in c: need.update(a['hip'] for a in c['image']['anchors'])
H = {}
for r in csv.DictReader(open(hygp, encoding='utf-8')):
    if r['hip'] and int(r['hip']) in need and int(r['hip']) not in H:
        H[int(r['hip'])] = r

def xyz(hip):
    r = H[hip]; d = float(r['dist'])
    if d >= 100000 or d <= 0:   # 无可靠视差:按 1 万光年放远处
        ra, de = math.radians(float(r['ra']) * 15), math.radians(float(r['dec']))
        return [round(1e4 * math.cos(de) * math.cos(ra), 2), round(1e4 * math.cos(de) * math.sin(ra), 2), round(1e4 * math.sin(de), 2)]
    return [round(float(r['x']) * PC, 3), round(float(r['y']) * PC, 3), round(float(r['z']) * PC, 3)]
def unit(v):
    l = math.sqrt(sum(a * a for a in v)); return [a / l for a in v]
def solve3(M, b):   # 克拉默法则
    def det(m): return (m[0][0]*(m[1][1]*m[2][2]-m[1][2]*m[2][1]) - m[0][1]*(m[1][0]*m[2][2]-m[1][2]*m[2][0]) + m[0][2]*(m[1][0]*m[2][1]-m[1][1]*m[2][0]))
    D = det(M); out = []
    for k in range(3):
        m = [row[:] for row in M]
        for i in range(3): m[i][k] = b[i]
        out.append(det(m) / D)
    return out
def bary(s, d):
    """方向 d 与过 s1,s2,s3 平面的交点,表示成 s1 + a(s2-s1) + b(s3-s1)。"""
    e1 = [s[1][i] - s[0][i] for i in range(3)]; e2 = [s[2][i] - s[0][i] for i in range(3)]
    M = [[e1[i], e2[i], -d[i]] for i in range(3)]
    a, b, t = solve3(M, [-s[0][i] for i in range(3)]); return a, b

os.makedirs('x/constart/s', exist_ok=True)
out, hips, tot, miss = [], {}, 0, []
for c in idx['constellations']:
    ab = c['id'].split()[-1]; lat = c['common_name'].get('native') or c['common_name']['english']
    line_hips = [h for ln in c['lines'] for h in ln if isinstance(h, int) and h in H]
    img = c.get('image')
    if img:
        anc = [a['hip'] for a in img['anchors']]
        if any(h not in H for h in anc): miss.append(ab); img = None
    if img:
        name = os.path.splitext(os.path.basename(img['file']))[0]
        im = Image.open(os.path.join(src, img['file'])).convert('L')
        W, Hh = img['size']
        if im.size != (W, Hh): print('size mismatch', ab, im.size, img['size'])
        im.save('x/constart/%s.webp' % name, 'WEBP', quality=82, method=6)
        small = im.size[0] > 256
        if small: im.resize((im.size[0] // 2, im.size[1] // 2), Image.LANCZOS).save('x/constart/s/%s.webp' % name, 'WEBP', quality=80, method=6)
        A = [[a['pos'][0], a['pos'][1]] + xyz(a['hip']) for a in img['anchors']]
        fn = name
    else:
        # 无插画:取 3 颗相距最远的连线星作标签锚点
        u = list(dict.fromkeys(line_hips)); best = None
        for i in range(len(u)):
            for j in range(i + 1, len(u)):
                for k in range(j + 1, len(u)):
                    p = [unit(xyz(h)) for h in (u[i], u[j], u[k])]
                    cr = [p[1][1]*p[2][2]-p[1][2]*p[2][1], p[1][2]*p[2][0]-p[1][0]*p[2][2], p[1][0]*p[2][1]-p[1][1]*p[2][0]]
                    e1 = [p[1][x]-p[0][x] for x in range(3)]; e2 = [p[2][x]-p[0][x] for x in range(3)]
                    ar = math.sqrt(sum(v*v for v in [e1[1]*e2[2]-e1[2]*e2[1], e1[2]*e2[0]-e1[0]*e2[2], e1[0]*e2[1]-e1[1]*e2[0]]))
                    if best is None or ar > best[0]: best = (ar, (u[i], u[j], u[k]))
        anc = list(best[1]); A = [[0, 0] + xyz(h) for h in anc]; fn = None; W = Hh = 0; small = False
    hips[ab] = anc
    s = [unit(a[2:]) for a in A]
    cen = unit([sum(unit(xyz(h))[i] for h in line_hips) for i in range(3)])
    la, lb = bary(s, cen)
    out.append([ab, lat, ZH[ab], fn, W, Hh, 1 if small else 0, A, [round(la, 4), round(lb, 4)]])

for f in os.listdir('x/constart'):
    if f.endswith('.webp'): tot += os.path.getsize('x/constart/' + f)
stot = sum(os.path.getsize('x/constart/s/' + f) for f in os.listdir('x/constart/s'))
js = ('/* 天枢 2.0 · C2.0 星座插画对齐数据(docs/build/build_constart.py 生成,勿手改)\n'
      ' * 插画 x/constart/*.webp:Johan Meuris(Stellarium 西方/modern 天空文化),Free Art License 1.3,许可原文 x/vendor/FAL-1.3.txt;已转灰度 WebP。\n'
      ' * 锚点像素坐标与连线星:Stellarium skycultures/modern/index.json(Stellarium\'s team,CC BY-SA 4.0)。\n'
      ' * 锚星位置:HYG v4.1(David Nash / astronexus,CC BY-SA 4.0)。本文件为派生数据,以 CC BY-SA 4.0 发布。\n'
      ' * 每项:[缩写, 拉丁名, 中文名, 文件名|null, 宽, 高, 有手机版, [[px,py,X,Y,Z]×3(J2000 赤道,光年)], [标签 a,b]] */\n'
      'window.SHX_CONSTART=' + json.dumps(out, ensure_ascii=False, separators=(',', ':')) + ';\n'
      'window.SHX_CONSTART_HIP=' + json.dumps(hips, separators=(',', ':')) + ';\n')
open('x/sh-x-constart-data.js', 'w', encoding='utf-8').write(js)
print('constellations', len(out), 'art', sum(1 for o in out if o[3]), 'missing-anchor', miss, 'webp bytes', tot, 'small bytes', stot, 'data bytes', len(js.encode()))
