/* 天枢 C2.14b · 天体类别知识库(SHXKB)
 * 王磊 11-02:天体信息窗加入基本概念(如何形成、形态是什么样),再加「详情」按钮,弹出全屏页面细致学习这类天体的人类已知信息(已证实 / 推测 / 猜想分级,注明出处)。
 * cls(b) 由航点 id / type / 深空 k 判定类别;brief(key) 给信息窗两行;html(key) 给信息窗片段;open(key, name) 打开全屏详情页。
 * 分级:✔ 已证实(多种独立观测一致)· ◐ 推测(主流模型,证据较强但未直接证实)· ? 猜想(假说,证据不足或有争议)。
 * 文字为 AI 依公开文献整理(见各页「出处」),按 HANDOFF 规则标注「AI 整理」,待人工审稿。 */
(function () {
  'use strict';
  var K = {
    star: { zh: '恒星', f: '巨大分子云的致密核在引力下坍缩,中心升温到约一千万开尔文后点燃氢聚变,向外的辐射压与向内的引力平衡,恒星就"诞生"了。', s: '自身发光的高温等离子体球,按表面温度从冷到热分 M K G F B A O 型,颜色从橙红到蓝白;质量约 0.08–150 个太阳。',
      sec: [
        ['是什么', [['✔', '恒星是靠核心核聚变释放能量、由自身引力束缚的等离子体球。太阳是离我们最近的恒星。'], ['✔', '质量下限约 0.075–0.08 太阳质量(低于此无法持续氢聚变,成为褐矮星);观测到的上限约 150–200 太阳质量(R136a1 等)。']]],
        ['如何形成', [['✔', '分子云(主要是氢分子与尘埃,温度约 10–20 K)中的致密核在引力下坍缩,角动量使物质形成吸积盘,中心形成原恒星;红外与射电望远镜已直接看到原恒星、吸积盘与喷流(如 HL Tau、赫比格-哈罗天体)。'], ['✔', '核心温度达到约 1000 万 K 时开始稳定的氢聚变,进入主序阶段。'], ['◐', '恒星常成群诞生于星团中;质量分布(初始质量函数)近似 Salpeter 1955 给出的幂律,但其成因仍在研究。']]],
        ['形态与分类', [['✔', '光谱型 O B A F G K M(哈佛分类,Cannon & Pickering);太阳为 G2V。光度级 I–V 区分超巨星到主序星(MK 系统,Morgan & Keenan)。'], ['✔', '赫罗图(Hertzsprung 1911、Russell 1913)把温度与光度画在一起,主序带、红巨星支、白矮星序列清晰可分。'], ['✔', '约一半类太阳恒星有伴星,大质量恒星多为双星或多星系统。']]],
        ['内部结构', [['✔', '核心产能 → 辐射区 → 对流区(太阳)向外输运能量;日震学已测出太阳内部声速剖面与对流区底部(约 0.71 太阳半径)。'], ['✔', '太阳核心的 pp 链与 CNO 循环中微子均已被直接探测(Borexino 2014、2020)。']]],
        ['演化与归宿', [['✔', '质量决定命运:低质量恒星 → 红巨星 → 抛出行星状星云 → 白矮星;约 8 太阳质量以上 → 红超巨星 → 核心坍缩超新星 → 中子星或黑洞。'], ['◐', '质量小于约 0.25 太阳质量的红矮星寿命可达万亿年,超过宇宙现龄,所以还没有一颗走完一生(依恒星演化模型推算)。'], ['?', '最早一代恒星(第三星族,几乎不含重元素)尚未被确认观测到,JWST 正在寻找。']]],
        ['人类认识史', [['✔', '1838 年贝塞尔测出天鹅座 61 的视差,第一次量出恒星距离。'], ['✔', '1920–30 年代 Eddington、Bethe(1939)阐明恒星靠核聚变发光;1957 年 B²FH 论文给出元素在恒星中合成的框架。'], ['✔', 'Gaia 卫星已测量约 18 亿颗恒星的位置与亮度(DR3,2022)。']]],
        ['未解与前沿', [['?', '大质量恒星如何突破辐射压继续吸积长大,细节仍有争议。'], ['◐', '恒星磁活动周期(太阳 11 年周期)的发电机机制已有主流模型,但无法精确预报周期强度。']]]
      ],
      refs: ['Kippenhahn, Weigert & Weiss《Stellar Structure and Evolution》第 2 版,Springer 2012', 'Burbidge, Burbidge, Fowler & Hoyle 1957, Rev. Mod. Phys. 29, 547(B²FH)', 'Borexino Collaboration 2014 Nature 512, 383;2020 Nature 587, 577', 'Gaia Collaboration, Vallenari 等 2023 A&A 674, A1(DR3)', 'Salpeter 1955 ApJ 121, 161'] },
    sun: { alias: 'star', zh: '恒星 · 太阳', f: '约 46 亿年前由一团分子云坍缩而成,剩余的盘状物质形成了行星。', s: 'G2V 型黄矮星,表面约 5,500 °C,外层是会喷发的日冕;它占太阳系总质量约 99.86%。' },
    red: { alias: 'star', zh: '恒星 · 红矮星', f: '与其他恒星一样由分子云坍缩形成,只是分到的质量小(约 0.08–0.6 太阳质量)。', s: 'M 型,表面约 2,300–3,800 K,呈橙红色;银河系里最多的恒星,但暗到肉眼一颗也看不见。' },
    rocky: { zh: '岩质行星', f: '原行星盘里尘埃粘合成星子,星子碰撞并合成行星胚胎,再经大碰撞长成类地行星;靠近恒星处太热,冰难以凝结,所以只剩岩石与金属。', s: '有固体表面的岩石-金属球:铁镍核、硅酸盐幔与地壳;可有大气(金星浓厚、火星稀薄)。',
      sec: [
        ['是什么', [['✔', 'IAU 2006 年 B5 号决议:行星须绕太阳运行、足够大到接近圆球(流体静力平衡)、清空了轨道附近区域。水星、金星、地球、火星是岩质(类地)行星。']]],
        ['如何形成', [['◐', '核心吸积模型:微米尘埃 → 厘米卵石 → 千米星子 → 月球到火星大小的胚胎 → 大碰撞并合,历时约千万到一亿年(太阳系陨石的同位素年代学给出时间尺度)。'], ['◐', '月球很可能来自一次与火星大小天体的大碰撞(阿波罗样品的同位素与动力学证据支持,仍有细节争议)。'], ['✔', 'ALMA 已拍到年轻恒星周围带环缝的原行星盘(HL Tau 2014)。']]],
        ['形态与结构', [['✔', '分层:铁镍核 / 硅酸盐幔 / 地壳。地震波揭示地球有液态外核与固态内核(Lehmann 1936)。'], ['✔', '洞察号测得火星核心半径约 1,830 km(Stähler 等 2021)。'], ['✔', '大气差别巨大:金星约 92 个大气压的二氧化碳温室,火星约 0.006 个大气压。']]],
        ['演化与归宿', [['✔', '小行星体冷得快:火星内部发电机约 40 亿年前停止,失去全球磁场后大气被太阳风剥离(MAVEN)。'], ['◐', '约 10 亿年后太阳变亮,地球海洋可能开始失控蒸发;约 50 亿年后太阳成为红巨星,水星、金星将被吞没,地球是否被吞没仍不确定。']]],
        ['未解与前沿', [['?', '地球的水从哪里来:碳质小行星、彗星还是原始星云,比例仍有争议。'], ['?', '火星是否曾有生命,毅力号正在采样等待返回地球分析。']]]
      ],
      refs: ['IAU 2006 General Assembly Resolution B5', 'Stähler 等 2021 Science 373, 443', 'ALMA Partnership 2015 ApJL 808, L3(HL Tau)', 'Jakosky 等 2018 Icarus 315, 146(MAVEN 大气逃逸)', 'Canup & Asphaug 2001 Nature 412, 708(大碰撞成月)'] },
    gas: { zh: '气态巨行星', f: '在冰线以外,固体核心先长到约 10 个地球质量,再迅速吸积周围大量氢氦气体(核心吸积);另一说是盘的引力不稳定直接坍缩成行星。', s: '没有固体表面的氢氦巨球,外观是平行于赤道的云带与风暴(如木星大红斑),多有环和大量卫星。',
      sec: [
        ['是什么', [['✔', '木星和土星以氢、氦为主,质量分别约为地球的 318 倍和 95 倍。']]],
        ['如何形成', [['◐', '核心吸积(Pollack 等 1996)为主流;朱诺号测得木星核心"稀释"、边界模糊(Wahl 等 2017),说明形成过程比简单模型复杂。'], ['?', '盘不稳定直接坍缩可能解释远距离的系外巨行星,但是否适用于木星仍有争议。'], ['◐', '"大迁移"假说:木星早期曾向内迁移再折返,塑造了小行星带与火星的小质量。']]],
        ['形态与结构', [['✔', '云带由强烈的东西向急流组成;大红斑是一个已持续至少约 190 年的反气旋风暴。'], ['◐', '深处高压使氢变成导电的金属氢,产生极强磁场(实验与模型支持,未直接取样)。'], ['✔', '土星环主要是水冰颗粒,厚度多处只有约 10 米量级(卡西尼号)。']]],
        ['人类认识史', [['✔', '1610 年伽利略发现木星四颗大卫星;先驱者、旅行者、伽利略号、卡西尼号、朱诺号先后近距离探测。']]],
        ['未解与前沿', [['?', '土星环的年龄:卡西尼数据倾向年轻(约 1–4 亿年),也有研究认为可能与土星同龄。']]]
      ],
      refs: ['Pollack 等 1996 Icarus 124, 62', 'Wahl 等 2017 GRL 44, 4649(朱诺号重力场)', 'Iess 等 2019 Science 364, eaat2965(土星环质量)', 'Walsh 等 2011 Nature 475, 206(大迁移)'] },
    ice: { zh: '冰巨行星', f: '在更远、物质更稀疏的盘外区形成,核心长得慢,只吸积到少量氢氦就因盘气体消散而停止。', s: '蓝绿色的冰巨星:大气中的甲烷吸收红光;内部以"冰"(水、氨、甲烷的高压流体)为主。',
      sec: [
        ['是什么', [['✔', '天王星和海王星质量约为地球的 14.5 倍和 17 倍,氢氦只占约 10–20%。']]],
        ['如何形成', [['◐', '按尼斯模型,它们可能在离太阳更近处形成后向外迁移。'], ['?', '天王星自转轴倾斜约 98°,常用早期大碰撞解释,但未被证实。']]],
        ['形态与结构', [['✔', '海王星有太阳系最快的风,超过 2,000 km/h(旅行者 2 号 1989)。'], ['◐', '深处可能有离子化的"超离子水";磁场偏离中心且严重倾斜,说明发电机位于较浅层。'], ['?', '内部可能有"钻石雨"(高压实验支持碳氢化合物析出金刚石)。']]],
        ['人类认识史', [['✔', '1781 年赫歇尔发现天王星;1846 年按勒维耶的计算找到海王星——第一颗靠数学预言发现的行星。'], ['✔', '迄今只有旅行者 2 号近距离飞掠过它们。']]]
      ],
      refs: ['Smith 等 1989 Science 246, 1422(旅行者 2 号海王星)', 'Tsiganis 等 2005 Nature 435, 459(尼斯模型)', 'Kraus 等 2017 Nature Astronomy 1, 606(钻石雨实验)'] },
    moon: { zh: '卫星', f: '三种主要来源:在行星周围的盘里与行星一起形成(伽利略卫星)、大碰撞抛出的碎片重新聚合(月球)、路过时被引力捕获(海卫一)。', s: '绕行星运行的天然天体,从几千米的碎石到比水星还大的冰-岩世界都有;大卫星多被潮汐锁定,永远一面朝向行星。',
      sec: [
        ['是什么', [['✔', '太阳系已知卫星超过 400 颗(至 2025 年,土星最多)。月球是相对母星最大的卫星之一。']]],
        ['如何形成', [['◐', '月球:大碰撞假说(忒伊亚撞地球)为主流,能解释月球缺铁与地月同位素高度相似。'], ['✔', '海卫一逆行公转,几乎肯定是被捕获的柯伊伯带天体。']]],
        ['形态与结构', [['✔', '潮汐锁定:月球自转周期等于公转周期。'], ['✔', '木卫一是太阳系火山最活跃的天体,热量来自木星潮汐加热。'], ['✔', '木卫二、土卫二表冰下有液态海洋(磁场、羽流等证据;卡西尼号穿过土卫二羽流)。']]],
        ['未解与前沿', [['?', '冰下海洋能否孕育生命:欧罗巴快船(2024 年发射)与 JUICE 正在前往木星系统。']]]
      ],
      refs: ['Canup & Asphaug 2001 Nature 412, 708', 'Agnor & Hamilton 2006 Nature 441, 192(海卫一捕获)', 'Waite 等 2017 Science 356, 155(土卫二羽流)'] },
    dwarf: { zh: '矮行星', f: '与行星同样由星子聚合而成,但所在区域(柯伊伯带、小行星带)物质稀疏,长不大,也清不空自己的轨道。', s: '足够大到接近圆球,却未清空轨道的小世界;冥王星表面有氮冰平原、冰山和可能的地下海洋。',
      sec: [
        ['是什么', [['✔', 'IAU 2006 年设立的类别:冥王星、阋神星、妊神星、鸟神星、谷神星为公认的五颗。']]],
        ['形态与结构', [['✔', '新视野号 2015 年发现冥王星"心形"斯普特尼克平原是年轻的氮冰冰川,仍在对流。'], ['◐', '冥王星冰壳下可能存在液态海洋(地质与重力异常推断)。']]],
        ['人类认识史', [['✔', '1930 年汤博发现冥王星;2005 年发现阋神星促成了 2006 年的定义讨论。']]],
        ['未解与前沿', [['?', '外太阳系可能存在尚未发现的"第九行星",证据来自极远天体的轨道聚集,仍有争议。']]]
      ],
      refs: ['IAU 2006 Resolution B5/B6', 'Stern 等 2015 Science 350, aad1815(新视野号)', 'Batygin & Brown 2016 AJ 151, 22(第九行星假说)'] },
    comet: { zh: '彗星', f: '太阳系形成时留在外围的冰-尘小天体,长期待在柯伊伯带或奥尔特云;被扰动后掉入内太阳系,冰升华就长出彗发和彗尾。', s: '几千米的"脏雪球"彗核;靠近太阳时有发亮的彗发、指向背离太阳方向的离子尾和弯曲的尘埃尾。',
      sec: [
        ['如何形成', [['✔', '彗核保留了 46 亿年前的原始物质;罗塞塔号在 67P 上测到甘氨酸等有机分子。']]],
        ['形态与结构', [['✔', '离子尾被太阳风吹成直线、指向背日方向;尘埃尾受光压与轨道运动影响呈弯曲。'], ['✔', '67P 彗核呈双瓣"橡皮鸭"形,密度约 0.5 g/cm³,极为疏松。']]],
        ['人类认识史', [['✔', '1705 年哈雷预言彗星回归,1758 年应验;1986 年乔托号首次近距离拍到哈雷彗核。']]],
        ['未解与前沿', [['◐', '短周期彗星多来自柯伊伯带,长周期彗星来自奥尔特云(轨道统计支持;奥尔特云本身未直接观测到)。']]]
      ],
      refs: ['Altwegg 等 2016 Science Advances 2, e1600285(67P 甘氨酸)', 'Sierks 等 2015 Science 347, aaa1044', 'Oort 1950 BAN 11, 91'] },
    craft: { zh: '探测器', f: '人类制造的无人航天器,借助火箭与行星引力弹弓离开地球;远距离探测器多用放射性同位素电池供电。', s: '装有相机、光谱仪、磁强计等仪器的机器;旅行者号带着记录地球声音与图像的金唱片。',
      sec: [
        ['人类认识史', [['✔', '旅行者 1 号 2012 年穿过日球层顶,成为第一个进入星际空间的人造物体;旅行者 2 号 2018 年跟进。'], ['✔', '引力弹弓利用行星公转速度给探测器加速,20 世纪 60 年代由 Minovitch 等提出,旅行者号借助 1970s 末的行星罕见排列"巡游"外行星。']]],
        ['现状', [['✔', '同位素电池功率逐年下降,旅行者号预计 2030 年前后无法维持任何仪器工作。']]]
      ],
      refs: ['Stone 等 2013 Science 341, 150(旅行者 1 号进入星际空间)', 'NASA JPL Voyager 任务页 voyager.jpl.nasa.gov'] },
    oort: { zh: '奥尔特云(推测区域)', f: '早期巨行星把大量冰质星子抛向远方,又被路过恒星与银河潮汐把轨道"抬高"成球壳。', s: '包裹太阳系、远达约 10 万 AU 的稀疏球状冰天体群;至今没有被直接看到。',
      sec: [
        ['是什么', [['◐', '1950 年奥尔特从长周期彗星的轨道分布推断其存在;内缘约 2,000–5,000 AU,外缘可能达 10 万 AU。'], ['?', '总质量估计从几个到几十个地球质量,差异很大。']]],
        ['未解与前沿', [['?', '太阳可能从诞生星团里的邻星"偷"来部分奥尔特云天体(Levison 等 2010 模拟)。']]]
      ],
      refs: ['Oort 1950 BAN 11, 91', 'Levison 等 2010 Science 329, 187'] },
    sfneb: { zh: '发射星云 · 恒星形成区', f: '新生的大质量 O、B 型星发出强烈紫外线,把周围的氢电离;电子与质子重新结合时发光。', s: '发红光(氢 Hα 656 nm)的电离氢云,常与暗尘埃柱、年轻星团混在一起,如猎户座大星云、鹰状星云"创生之柱"。',
      sec: [
        ['是什么', [['✔', '电离氢区(HII 区),温度约 1 万 K;其中常有原恒星、原行星盘(猎户座 proplyd,哈勃 1990s)。']]],
        ['如何形成', [['✔', '大质量恒星的辐射与星风把分子云"挖空",形成泡与柱;侵蚀前沿可能触发新一代恒星形成(◐)。']]],
        ['形态与结构', [['✔', '可见光的红色来自 Hα,绿色来自氧 [OIII];红外(JWST)能穿透尘埃看到里面的年轻恒星。']]],
        ['演化与归宿', [['◐', '几百万到一千万年后,大质量星以超新星结束,云被吹散,只留下星团。']]]
      ],
      refs: ['Osterbrock & Ferland《Astrophysics of Gaseous Nebulae and AGN》2006', 'O\'Dell & Wen 1994 ApJ 436, 194(猎户座原行星盘)'] },
    pn: { zh: '行星状星云', f: '中低质量恒星临终时抛出外层,裸露的高温核心(未来的白矮星)用紫外线照亮这层气体;名字源于早期望远镜里像行星圆面,与行星无关。', s: '环、壳或双极沙漏状的发光气体,中心有一颗极热的小星;寿命只有约一两万年。',
      sec: [
        ['如何形成', [['✔', '红巨星/渐近巨星支阶段大量失质,随后热核心的快速星风与紫外线塑形、电离。'], ['◐', '许多复杂的双极形状可能需要伴星或磁场参与塑形。']]],
        ['演化与归宿', [['✔', '气体扩散回星际空间,带去碳、氮等恒星内部合成的元素;中心星冷却成白矮星。'], ['✔', '约 50 亿年后太阳也会经历这个阶段。']]]
      ],
      refs: ['Kwok《The Origin and Evolution of Planetary Nebulae》CUP 2000', 'De Marco 2009 PASP 121, 316(双星塑形)'] },
    snr: { zh: '超新星遗迹', f: '大质量恒星核心坍缩爆炸(或白矮星热核爆炸)抛出的物质以每秒数千千米冲进星际介质,形成激波壳。', s: '膨胀的纤维网或壳层,常发射射电、X 射线;中心可能留有一颗高速自转的脉冲星,如蟹状星云。',
      sec: [
        ['如何形成', [['✔', '1054 年中国、日本、阿拉伯天文学家记录的"客星"就是蟹状星云的超新星(《宋会要》等)。'], ['✔', 'SN 1987A 测到了中微子暴(神冈、IMB),直接证实核心坍缩模型。']]],
        ['形态与结构', [['✔', '蟹状星云内部是脉冲星风云:中心脉冲星把能量注入相对论电子,产生同步辐射。']]],
        ['演化与归宿', [['✔', '激波加速宇宙线、把铁等重元素撒入银河,下一代恒星和行星由此获得原料。']]]
      ],
      refs: ['Hester 2008 ARA&A 46, 127(蟹状星云)', 'Hirata 等 1987 PRL 58, 1490;Bionta 等 1987 PRL 58, 1494(SN 1987A 中微子)', '《宋会要辑稿·瑞异》至和元年客星记录'] },
    ns: { zh: '中子星 · 脉冲星 · 磁星', f: '8–25 倍太阳质量左右的恒星超新星爆发时,铁核坍缩到原子核密度,质子和电子被压成中子,剩下一个城市大小的残骸。', s: '直径约 20–25 km、质量 1.2–2 个太阳的超致密球;脉冲星的磁极辐射束像灯塔一样扫过地球,磁星磁场可达 10^11 特斯拉。',
      sec: [
        ['是什么', [['✔', '1967 年乔斯林·贝尔发现第一颗脉冲星 PSR B1919+21;已知脉冲星超过 3,000 颗(ATNF 星表)。'], ['✔', '最大质量已测到约 2 个太阳(PSR J0740+6620,Cromartie 等 2020)。']]],
        ['形态与结构', [['✔', 'NICER 测得 PSR J0030+0451 半径约 12–13 km,热斑分布并非简单双极(Riley 等、Miller 等 2019)。'], ['◐', '外壳为原子核晶格,内部可能是中子超流体;核心是否有夸克物质仍是猜想(?)。']]],
        ['自转与辐射', [['✔', '蟹状脉冲星每秒约 30 圈,毫秒脉冲星每秒可达数百圈(被伴星吸积"加速"而成)。'], ['✔', '2017 年 GW170817 双中子星并合同时测到引力波与电磁对应体,证实并合能合成金、铂等重元素。'], ['◐', '磁星的巨耀发可能与快速射电暴有关(SGR 1935+2154,2020 年观测到关联)。']]],
        ['观看提示', [['✔', '屏幕每秒只能刷新约 60 次:真实转速超过每秒约 30 圈时,画面会频闪或看似倒转(采样混叠),这不是设备故障,所以舷窗默认慢放。']]]
      ],
      refs: ['Hewish, Bell 等 1968 Nature 217, 709', 'Riley 等 2019 ApJL 887, L21;Miller 等 2019 ApJL 887, L24', 'Cromartie 等 2020 Nature Astronomy 4, 72', 'Abbott 等 2017 PRL 119, 161101(GW170817)', 'Manchester 等 2005 AJ 129, 1993(ATNF 星表)'] },
    bh: { zh: '黑洞', f: '恒星级黑洞来自大质量恒星核心坍缩;超大质量黑洞(百万到百亿太阳质量)如何在宇宙早期长这么大仍是谜,可能由种子黑洞吸积与并合而来。', s: '引力强到光也逃不出的时空区域,边界是事件视界;周围吸积盘发光,事件视界望远镜拍到了它们的"影子"。',
      sec: [
        ['是什么', [['✔', '广义相对论预言(Schwarzschild 1916 解);史瓦西半径 = 2GM/c²,太阳质量对应约 3 km。']]],
        ['证据', [['✔', '天鹅座 X-1(1970s)等 X 射线双星;2015 年 LIGO 首次直接探测双黑洞并合引力波 GW150914。'], ['✔', '银心恒星 S2 的轨道测得人马座 A* 约 400 万太阳质量(Genzel、Ghez,2020 诺贝尔物理学奖)。'], ['✔', 'EHT 2019 年发布 M87* 影像,2022 年发布人马座 A* 影像。']]],
        ['如何形成', [['✔', '恒星级:大质量恒星核心坍缩,或中子星并合。'], ['?', '超大质量黑洞的种子:第一代恒星残骸、气体直接坍缩,还是原初黑洞,尚无定论;JWST 发现的早期活跃黑洞使问题更尖锐。']]],
        ['未解与前沿', [['?', '信息悖论:落入黑洞的信息是否随霍金辐射返回,仍是理论物理核心难题。'], ['◐', '霍金辐射在理论上被广泛接受,但对天体级黑洞极弱,从未被观测到。']]]
      ],
      refs: ['Abbott 等 2016 PRL 116, 061102(GW150914)', 'EHT Collaboration 2019 ApJL 875, L1;2022 ApJL 930, L12', 'GRAVITY Collaboration 2020 A&A 636, L5', 'Hawking 1974 Nature 248, 30'] },
    galaxy: { zh: '星系', f: '宇宙早期密度微小起伏在暗物质引力下聚成暗晕,气体落入其中冷却、形成恒星;小星系不断并合,长成大星系。', s: '数百万到上万亿颗恒星加气体、尘埃和暗物质的集合:旋涡星系有盘与旋臂,椭圆星系是光滑的蛋形,不规则星系没有固定形状。',
      sec: [
        ['是什么', [['✔', '1924–25 年哈勃测出仙女座星系中造父变星的距离,证明它在银河系之外——星系是独立的"宇宙岛"。'], ['✔', '可观测宇宙中估计有约两千亿到两万亿个星系(取决于把多暗的矮星系计入)。']]],
        ['形态与分类', [['✔', '哈勃序列:椭圆 E0–E7、透镜 S0、旋涡 Sa–Sc、棒旋 SBa–SBc、不规则 Irr(Hubble 1926)。'], ['✔', '几乎每个大星系中心都有超大质量黑洞,质量与核球速度弥散相关(M–σ 关系)。']]],
        ['暗物质', [['✔', '旋涡星系外侧的旋转速度不随距离下降(Rubin & Ford 1970 等),说明存在看不见的质量。'], ['◐', '暗物质是一种尚未发现的粒子(主流);?修正引力(MOND 等)为少数派替代方案。'], ['✔', '也有几乎不含暗物质的星系,如 NGC 1052-DF2(van Dokkum 等 2018),其距离仍有争议。']]],
        ['演化与归宿', [['✔', '星系互动与并合常见:涡状星系 M51 正与伴星系 NGC 5195 相互作用。'], ['◐', '约 40–50 亿年后银河系与仙女座星系很可能并合(哈勃与 Gaia 测量;最新估计并合概率约一半,Sawala 等 2025)。']]]
      ],
      refs: ['Hubble 1926 ApJ 64, 321', 'Rubin & Ford 1970 ApJ 159, 379', 'van Dokkum 等 2018 Nature 555, 629', 'Sawala 等 2025 Nature Astronomy(银河-仙女并合概率)', 'Conselice 等 2016 ApJ 830, 83(星系数目)'] },
    dwarfgal: { alias: 'galaxy', zh: '星系 · 矮星系', f: '最早形成的小暗物质晕里的星系,许多被大星系的引力俘获成卫星星系。', s: '只有数百万到数十亿颗恒星,形状多不规则;大小麦哲伦云是银河系最亮的卫星星系。' },
    cluster: { zh: '星系团', f: '暗物质与星系在引力作用下沿宇宙网的节点不断汇聚,是宇宙中最大的引力束缚结构。', s: '数百到数千个星系浸在上千万度的热气体里(发 X 射线),总质量约 10^14–10^15 个太阳,其中大部分是暗物质。',
      sec: [
        ['证据', [['✔', '1933 年兹威基发现后发座星系团的星系速度太快,首次提出"暗物质"。'], ['✔', '引力透镜:星系团把背后星系的光弯成弧(如 JWST 的 SMACS 0723 深场);子弹星系团显示质量中心与热气体分离,是暗物质的有力证据(Clowe 等 2006)。']]],
        ['结构', [['✔', '热气体质量约是星系恒星质量的数倍,钱德拉等 X 射线望远镜可直接成像。']]],
        ['宇宙网', [['✔', '星系团位于纤维状宇宙网的交点,星系巡天(SDSS 等)已绘出这张网。']]]
      ],
      refs: ['Zwicky 1933 Helv. Phys. Acta 6, 110', 'Clowe 等 2006 ApJL 648, L109', 'Pontoppidan 等 2022 ApJL 936, L14(JWST ERO)'] },
    region: { zh: '星际空间与区域', f: '恒星之间并不空,有稀薄的气体、尘埃、宇宙线和磁场。', s: '平均每立方厘米约一个原子;太阳风吹出的泡称为日球层,其外就是星际空间。', sec: [['是什么', [['✔', '旅行者 1、2 号分别于 2012、2018 年穿过日球层顶,测到了星际等离子体密度的跃升。']]]], refs: ['Gurnett 等 2013 Science 341, 1489'] }
  };
  function base(k) { var o = K[k]; return o && o.alias ? K[o.alias] : o; }
  function cls(b) {
    if (!b) return null; var id = b.id || '', t = (b.type || '') + ' ' + (b.k || '') + ' ' + (b.exo || '');
    if (id === 'sun') return 'sun';
    if (/^(mercury|venus|earth|mars)$/.test(id)) return 'rocky';
    if (/^(jupiter|saturn)$/.test(id)) return 'gas';
    if (/^(uranus|neptune)$/.test(id)) return 'ice';
    if (id === 'oort') return 'oort';
    if (b.craft || /探测器/.test(t)) return 'craft';
    if (b.comet || /彗星/.test(t)) return 'comet';
    if (/黑洞|\bbh\b/.test(t)) return 'bh';
    if (/中子星|脉冲星|磁星|\b(psr|mag|ns)\b/.test(t)) return 'ns';
    if (/行星状星云/.test(t)) return 'pn';
    if (/超新星遗迹/.test(t)) return 'snr';
    if (/发射星云|恒星形成|反射|暗星云|星云/.test(t)) return 'sfneb';
    if (/星系团/.test(t)) return 'cluster';
    if (/矮星系|矮不规则|卫星星系/.test(t)) return 'dwarfgal';
    if (/星系/.test(t)) return 'galaxy';
    if (/矮行星/.test(t)) return 'dwarf';
    if (/卫星/.test(t)) return 'moon';
    if (/红矮星/.test(t)) return 'red';
    if (b.star || /恒星|星$/.test(t)) return 'star';
    if (/区域|星际/.test(t)) return 'region';
    return null;
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function css() {
    if (document.getElementById('xkb-css')) return; var s = document.createElement('style'); s.id = 'xkb-css';
    s.textContent = '.xkb-b{margin:6px 0 2px;padding:6px 8px;border-radius:8px;background:rgba(127,214,255,.06);border:1px solid rgba(127,214,255,.18);font-size:12.5px;line-height:1.55;color:#cfdcef;text-align:left}' +
      '.xkb-b p{margin:2px 0}.xkb-b p b{color:#7fd6ff;font-weight:500;margin-right:4px}.xkb-b button{margin-top:4px;font:inherit;font-size:12px;cursor:pointer;border-radius:8px;padding:2px 10px;border:1px solid rgba(240,201,122,.6);background:rgba(240,201,122,.14);color:#ffe2a0;pointer-events:auto}' +
      '#xkb{position:fixed;inset:0;z-index:2147483000;background:rgba(4,7,14,.94);backdrop-filter:blur(6px);overflow:auto;color:#dfe8f6;font:15px/1.75 "Noto Sans SC",system-ui,sans-serif;opacity:0;transition:opacity .35s}#xkb.in{opacity:1}' +
      '#xkb .w{max-width:860px;margin:0 auto;padding:28px 22px 60px}#xkb .x{position:fixed;top:14px;right:16px;font-size:22px;width:40px;height:40px;border-radius:50%;cursor:pointer;border:1px solid rgba(240,201,122,.5);background:rgba(10,14,24,.8);color:#ffe2a0}' +
      '#xkb h2{margin:0;font-size:26px;color:#f0c97a;font-weight:600}#xkb h2 small{font-size:14px;color:#8fa3c2;margin-left:10px;font-weight:400}#xkb .lg{margin:10px 0 18px;font-size:13px;color:#a9bad3}#xkb .lg span{margin-right:14px}' +
      '#xkb h3{margin:22px 0 8px;font-size:17px;color:#7fd6ff;border-bottom:1px solid rgba(127,214,255,.18);padding-bottom:4px}#xkb ul{margin:0;padding:0;list-style:none}#xkb li{margin:6px 0;padding-left:28px;position:relative}' +
      '#xkb li i{position:absolute;left:0;top:1px;font-style:normal;width:22px;text-align:center;border-radius:5px;font-size:12px}#xkb .c1{background:rgba(127,227,196,.18);color:#7fe3c4}#xkb .c2{background:rgba(255,210,122,.18);color:#ffd27a}#xkb .c3{background:rgba(201,166,255,.18);color:#c9a6ff}' +
      '#xkb .intro{background:rgba(127,214,255,.06);border-radius:10px;padding:10px 14px}#xkb .intro p{margin:4px 0}#xkb .intro b{color:#7fd6ff;margin-right:6px}#xkb .rf li{padding-left:0;font-size:13px;color:#a9bad3}#xkb .ai{margin-top:22px;font-size:12.5px;color:#8fa3c2}' +
      '@media (max-width:760px){#xkb{font-size:14px}#xkb .w{padding:20px 14px 50px}#xkb h2{font-size:21px}.xkb-b{font-size:12px}}';
    document.head.appendChild(s);
  }
  function brief(k) { var o = K[k]; return o ? { zh: o.zh, f: o.f, s: o.s } : null; }
  function html(k) { var o = K[k]; if (!o) return ''; css(); return '<div class="xkb-b"><p><b>如何形成</b>' + esc(o.f) + '</p><p><b>形态</b>' + esc(o.s) + '</p>' + (base(k) && base(k).sec ? '<button type="button" data-xkb="' + k + '">详情 · ' + esc(base(k).zh) + '</button>' : '') + '</div>'; }
  var TAG = { '✔': ['c1', '已证实'], '◐': ['c2', '推测'], '?': ['c3', '猜想'] }, pg = null;
  function open(k, name) {
    var o = K[k], b = base(k); if (!o || !b || !b.sec) return false; css(); close(true);
    pg = document.createElement('div'); pg.id = 'xkb'; pg.setAttribute('role', 'dialog'); pg.setAttribute('aria-label', b.zh + ' 详情');
    pg.innerHTML = '<button class="x" type="button" aria-label="关闭">×</button><div class="w"><h2>' + esc(b.zh) + (name ? '<small>从「' + esc(name) + '」打开</small>' : '') + '</h2>' +
      '<div class="lg"><span><i class="c1" style="font-style:normal;padding:0 5px;border-radius:4px">✔</i> 已证实</span><span><i class="c2" style="font-style:normal;padding:0 5px;border-radius:4px">◐</i> 推测(主流模型)</span><span><i class="c3" style="font-style:normal;padding:0 5px;border-radius:4px">?</i> 猜想 / 有争议</span></div>' +
      '<div class="intro"><p><b>如何形成</b>' + esc(o.f) + '</p><p><b>形态</b>' + esc(o.s) + '</p></div>' +
      b.sec.map(function (s) { return '<h3>' + esc(s[0]) + '</h3><ul>' + s[1].map(function (r) { var t = TAG[r[0]] || TAG['◐']; return '<li><i class="' + t[0] + '" title="' + t[1] + '">' + r[0] + '</i>' + esc(r[1]) + '</li>'; }).join('') + '</ul>'; }).join('') +
      '<h3>出处</h3><ul class="rf">' + (b.refs || []).map(function (r) { return '<li>' + esc(r) + '</li>'; }).join('') + '</ul>' +
      '<div class="ai">本页文字由 AI 依上列公开文献整理,数值以原文献为准;待人工审稿。按 Esc 或右上角 × 关闭。</div></div>';
    document.body.appendChild(pg); requestAnimationFrame(function () { if (pg) pg.classList.add('in'); });
    pg.querySelector('.x').onclick = function () { close(); }; pg.querySelector('.x').focus();
    return true;
  }
  function close(q) { if (!pg) return; var p = pg; pg = null; if (q) p.remove(); else { p.classList.remove('in'); setTimeout(function () { p.remove(); }, 350); } }
  document.addEventListener('click', function (e) { var bt = e.target.closest && e.target.closest('[data-xkb]'); if (!bt) return; e.stopPropagation(); var h = bt.closest('[aria-label]'); open(bt.dataset.xkb, bt.dataset.nm || ''); }, true);
  window.addEventListener('keydown', function (e) { if (pg && e.key === 'Escape') { e.stopImmediatePropagation(); e.preventDefault(); close(); } }, true);
  window.SHXKB = { cls: cls, brief: brief, html: html, open: open, close: close, isOpen: function () { return !!pg; }, keys: function () { return Object.keys(K); } };
})();
