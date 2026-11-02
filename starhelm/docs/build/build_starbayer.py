# 天枢 2.0 · C2.14d 恒星拜耳名 / 中文名表(星座成员星用)
# 输入:HYG 恒星库 v4.1 hygdata_v41.csv(CC BY-SA 4.0,David Nash / astronexus)——proper / bayer / flam / con 字段;
#       x/sh-x-constart-data.js(星座中文名)。
# 中文传统星名:按中国古代星官名的通行对照(参考 中国天文学会 / 台北市立天文科学教育馆 中西星名对照,
#       及 Wikipedia「中国星官」条目),只收常见亮星;无把握的不写,改用「星座名 + 希腊字母」。
# 选星规则与 build_stars.py 完全一致,保证序号对应 sh-stars-data.js。
# 输出:x/sh-x-starbayer-data.js(派生数据,CC BY-SA 4.0)
# 用法:python3 build_starbayer.py hygdata_v41.csv ../../x/sh-x-constart-data.js ../../x/sh-x-starbayer-data.js
import csv, sys, json

PC = 3.26156
hyg, cst, out = sys.argv[1], sys.argv[2], sys.argv[3]

def f(x, d=None):
    try: return float(x)
    except: return d

sel = []
for r in csv.DictReader(open(hyg, encoding='utf-8')):
    d = f(r['dist'], 0)
    if d is None or d >= 100000: continue
    ly = d * PC; mag = f(r['mag'], 99)
    if r['proper'] == 'Sol' or (0 < ly <= 100) or (100 < ly <= 3000 and mag <= 3.5): sel.append(r)

GR = dict(Alp='α', Bet='β', Gam='γ', Del='δ', Eps='ε', Zet='ζ', Eta='η', The='θ', Iot='ι', Kap='κ', Lam='λ', Mu='μ', Nu='ν', Xi='ξ',
          Omi='ο', Pi='π', Rho='ρ', Sig='σ', Tau='τ', Ups='υ', Phi='φ', Chi='χ', Psi='ψ', Ome='ω')
SUP = {'1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵'}

ZH = {  # HYG proper(IAU 名)→ 中文传统星名
    'Sirius': '天狼星', 'Canopus': '老人星', 'Arcturus': '大角星', 'Vega': '织女一', 'Capella': '五车二', 'Rigel': '参宿七',
    'Procyon': '南河三', 'Achernar': '水委一', 'Betelgeuse': '参宿四', 'Hadar': '马腹一', 'Altair': '河鼓二', 'Acrux': '十字架二',
    'Aldebaran': '毕宿五', 'Antares': '心宿二', 'Spica': '角宿一', 'Pollux': '北河三', 'Fomalhaut': '北落师门', 'Deneb': '天津四',
    'Mimosa': '十字架三', 'Regulus': '轩辕十四', 'Adhara': '弧矢七', 'Castor': '北河二', 'Shaula': '尾宿八', 'Gacrux': '十字架一',
    'Bellatrix': '参宿五', 'Elnath': '五车五', 'Miaplacidus': '南船五', 'Alnilam': '参宿二', 'Alnair': '鹤一', 'Alnitak': '参宿一',
    'Alioth': '玉衡', 'Dubhe': '天枢', 'Mirfak': '天船三', 'Wezen': '弧矢一', 'Sargas': '尾宿五', 'Kaus Australis': '箕宿三',
    'Avior': '海石一', 'Alkaid': '摇光', 'Menkalinan': '五车三', 'Atria': '三角形三', 'Alhena': '井宿三', 'Peacock': '孔雀十一',
    'Mirzam': '军市一', 'Alphard': '星宿一', 'Polaris': '勾陈一', 'Hamal': '娄宿三', 'Algieba': '轩辕十二', 'Diphda': '土司空',
    'Mizar': '开阳', 'Nunki': '斗宿四', 'Menkent': '库楼三', 'Mirach': '奎宿九', 'Alpheratz': '壁宿二', 'Rasalhague': '候',
    'Kochab': '北极二', 'Saiph': '参宿六', 'Denebola': '五帝座一', 'Algol': '大陵五', 'Alphecca': '贯索四', 'Mintaka': '参宿三',
    'Sadr': '天津一', 'Eltanin': '天棓四', 'Schedar': '王良四', 'Naos': '弧矢增二十二', 'Almach': '天大将军一', 'Caph': '王良一',
    'Izar': '梗河一', 'Dschubba': '房宿三', 'Merak': '天璇', 'Ankaa': '火鸟六', 'Enif': '危宿三', 'Scheat': '室宿二', 'Sabik': '宋',
    'Phecda': '天玑', 'Aludra': '弧矢二', 'Alderamin': '天钩五', 'Markab': '室宿一', 'Aljanah': '天津九', 'Acrab': '房宿四',
    'Zosma': '西上相', 'Arneb': '厕一', 'Gienah': '轸宿一', 'Zubeneschamali': '氐宿四', 'Zubenelgenubi': '氐宿一',
    'Unukalhai': '天市右垣七', 'Sheratan': '娄宿一', 'Phact': '丈人一', 'Kraz': '轸宿四', 'Ruchbah': '阁道三', 'Muphrid': '右摄提一',
    'Tarazed': '河鼓三', 'Algenib': '壁宿一', 'Vindemiatrix': '太微左垣四', 'Sadalsuud': '虚宿一', 'Sadalmelik': '危宿一',
    'Skat': '羽林军二十六', 'Rasalgethi': '帝座', 'Albireo': '辇道增七', 'Alcor': '辅', 'Megrez': '天权', 'Thuban': '右枢',
    'Cor Caroli': '常陈一', 'Algorab': '轸宿三', 'Alnasl': '箕宿一', 'Kaus Media': '箕宿二', 'Kaus Borealis': '斗宿二',
    'Ascella': '斗宿六', 'Nashira': '垒壁阵三', 'Deneb Algedi': '垒壁阵四', 'Dabih': '牛宿一', 'Menkar': '天囷一', 'Mira': '蒭藁增二',
    'Alcyone': '昴宿六', 'Mesarthim': '娄宿二', 'Acamar': '天园六', 'Cursa': '玉井三', 'Zaurak': '天苑一', 'Ran': '天苑四',
    'Nihal': '厕二', 'Gomeisa': '南河二', 'Asellus Australis': '鬼宿四', 'Asellus Borealis': '鬼宿三', 'Chertan': '西次相',
    'Adhafera': '轩辕十三', 'Porrima': '太微左垣二', 'Lesath': '尾宿九', 'Seginus': '招摇', 'Rastaban': '天棓三', 'Altais': '天厨一',
    'Edasich': '左枢', 'Pherkad': '北极一', 'Errai': '少卫增八', 'Alfirk': '上卫增一', 'Sheliak': '渐台二', 'Sulafat': '渐台三',
    'Rigil Kentaurus': '南门二', 'Imai': '十字架四', 'Tiaki': '鹤二', 'Mebsuta': '井宿五', 'Tejat': '井宿一', 'Propus': '钺',
    'Wasat': '天樽二', 'Talitha': '上台一', 'Yed Prior': '梁', 'Cebalrai': '宗正一', 'Kornephoros': '河中', 'Ain': '毕宿一',
    'Hassaleh': '五车一', 'Suhail': '天记', 'Han': '韩', 'Tarf': '柳宿增十', 'Alshain': '河鼓一',
}

js = open(cst, encoding='utf-8').read()
js = js[js.index('SHX_CONSTART=') + 13:]
CN = {c[0]: c[2] for c in json.JSONDecoder().raw_decode(js)[0]}

def bayer(r):
    b, fl, c = r['bayer'], r['flam'], r['con']
    if not c: return ''
    cz = CN.get(c, c)
    if b:
        p = b.split('-'); g = GR.get(p[0], p[0]) + (SUP.get(p[1], p[1]) if len(p) > 1 else '')
        return cz + g
    if fl: return cz + ' ' + fl
    return ''

D = {}; used = set()
for i, r in enumerate(sel):
    if i == 0: continue
    by = bayer(r); pr = r['proper']
    if not by and not pr: continue
    zh = ZH.get(pr, '')
    if zh: used.add(pr)
    D[i] = [zh, by, pr, r['con'], round(f(r['mag'], 99), 2)]

with open(out, 'w', encoding='utf-8') as o:
    o.write('/* 天枢 2.0 · C2.14d 恒星拜耳名 / 中文名(docs/build/build_starbayer.py 生成,勿手改)\n'
            ' * 拜耳/弗兰斯蒂德编号、IAU 专名、所属星座:HYG v4.1(David Nash / astronexus,CC BY-SA 4.0);本文件为派生数据,以 CC BY-SA 4.0 发布。\n'
            ' * 中文传统星名:中国古代星官通行中西对照(只收常见亮星)。键 = sh-stars-data.js 序号;值 [中文名, 星座+希腊字母, 英文专名, 星座缩写, 视星等]。 */\n')
    o.write('window.SHX_STARBAYER=' + json.dumps(D, ensure_ascii=False, separators=(',', ':')) + ';\n')
print('entries', len(D), 'zh', sum(1 for v in D.values() if v[0]), 'zh unused', sorted(set(ZH) - used))
