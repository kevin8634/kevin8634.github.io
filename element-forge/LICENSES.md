# 元素工坊 Element Forge · 素材与 AI 标注台账

> 创世计划 Genesis 第 03 世界(化学)。按《1.0 素材与 AI 标注台账规范》(总指挥 2026-10-24)。最后更新:2026-11-01(v2.0,11 任务 44 关;新增超重元素岛 island)。
> 零外部请求:页面运行时不加载任何外部资源(无 CDN、无外部字体、无外部图片/贴图、无统计脚本);下表「来源与链接」里的网址只作出处或页面上的文字引用链接。

## 一、图片、贴图、3D 模型

| 素材 | 用在哪(任务/页面) | 来源与链接 | 许可 | 署名要求 | 是否 AI 生成 | 页面标注位置 |
|---|---|---|---|---|---|---|
| 火星基地概念图 img/mars-base.webp | 首页「星球篇」区 figure.mars | 本项目用 AI 图像模型生成的无字底图(Hark 平台图像生成工具) | 自制(AI 生成物) | 无 | 是 | 首页图注「概念图,非实景」 |
| 火星基地概念图动效(管线光流、水柱气泡、风扇、储罐/温室灯呼吸、滴水、浮尘) | 首页 #mbase,v0.10 | 本项目原创 SVG/CSS,叠在原图上,未改原图 | 自制 | 无 | 否 | 首页图注「画面动效为示意」;低档与减少动态时静止 |
| 开场动画、恒星/火星/烧杯/晶体/岩石/电池/烟花等 3D 画面 | 首页与 10 个任务页 | 本项目 Three.js 着色器与程序几何生成(ef-mission3d.js、ef-*3d.js) | 自制 | 无 | 否 | 无需标注(无外部贴图) |
| 土卫六橙雾舞台、四瓶物态台、惠更斯号式探测器(通用造型) | titan | 本项目程序生成(ef-titan3d.js、ef-mission3d.js) | 自制 | 无 | 否 | 探测器为通用造型、无机构标识;页面注「示意,未按比例」处已标 |
| 三棱镜分光、程序恒星表面、带大气光环的行星、六边形镜面望远镜(通用造型)、球棍分子 | spectra | 本项目程序生成(ef-spectra3d.js、ef-mission3d.js) | 自制 | 无 | 否 | 望远镜无机构标识;页面注「示意,未按比例」 |
| 向导角色(奥加、小点等)3D 形象 | 全站 | 本项目程序生成(ef-guide3d.js) | 自制 | 无 | 否 | 无需标注 |
| 分子/晶体/原子模型(金刚石、石墨、食盐、甲烷、水、二氧化碳、花青素骨架、铁-56 等) | 首页、carbon、crystal、cabbage、titan、spectra 等 | 化学标准几何数据,程序生成 | 自制(公共事实) | 无 | 否 | 简化处页面标「示意」 |
| 效果图 ef_*_A/B/C.png(各版方案用) | 未上线;仅存云盘 工程文件/效果图/ | AI 无字底图(Hark 平台图像生成工具)+ PIL/Noto Sans SC 叠中文 | 自制(AI 生成物) | 无 | 是 | 不在线上页面使用;图内带「效果图」字样 |

## 二、音效、音乐、语音

| 素材 | 用在哪(任务/页面) | 来源与链接 | 许可 | 署名要求 | 是否 AI 生成 | 页面标注位置 |
|---|---|---|---|---|---|---|
| 9 个音效 audio/absorb、anvil、boom、fuse、select、slide、tick、unlock、whoosh.m4a | 全站 | 本项目原创,audio/synth.py 纯程序合成(numpy/scipy,固定种子) | 自制 | 无 | 否(程序合成,无采样、无音色库、无 AI 音频) | 无需标注 |
| 背景音乐「熔炉星火」audio/music-forge-loop.m4a | 全站 | 同上,audio/synth.py 程序合成 | 自制 | 无 | 否 | 无需标注 |
| 语音/配音 | — | 本世界未使用任何语音或配音 | — | — | — | — |

## 三、字体与第三方库

| 素材 | 用在哪(任务/页面) | 来源与链接 | 许可 | 署名要求 | 是否 AI 生成 | 页面标注位置 |
|---|---|---|---|---|---|---|
| 字体 | 全站 | 只调用设备系统字体(-apple-system、PingFang SC、Noto Sans SC、Microsoft YaHei、system-ui),不打包、不外链任何字体文件 | 各系统自带 | 无 | 否 | 无需标注 |
| 元素中文名拼合显示(钅+声旁) | ef.js EF.zhDraw / ef.css .zc | 本项目原创,用于缺字形设备的显示兜底 | 自制 | 无 | 否 | 无需标注 |
| Three.js r186 | vendor/three.module.min.js(经 ef-gl.js,全站 3D;v2.0 起,与 /deep/vendor/r186 同一构建) | https://threejs.org | MIT | 保留版权声明:vendor/three.LICENSE.txt 随附 | 否 | 无需页面标注 |
| Three.js r169(回落) | vendor/three.r169.module.min.js(仅 WebGL1 设备或 ?three=169 时经导入映射加载,保留到 2.0 发布) | https://threejs.org | MIT | 同上 | 否 | 无需页面标注 |
| 创世实验室 Lab Kit(/core/deep 0.4:lab.js、core.js、lab.css、deep.css) | island 第 2–4 关实验台 | 创世计划总指挥维护,同站 /core/deep/ | 自有 | 无 | AI 协助编写 | 无需标注 |
| 全部代码(ef.js、ef.css、ef-hud.css、ef-*.js、各任务页) | 全站 | 本项目原创 | 随创世计划仓库 | 无 | 否 | — |

## 四、数据来源

| 素材 | 用在哪(任务/页面) | 来源与链接 | 许可 | 署名要求 | 是否 AI 生成 | 页面标注位置 |
|---|---|---|---|---|---|---|
| 元素中文名(含 104–118 号新造字) | ef.js 周期表 | 全国科学技术名词审定委员会公布的元素中文名 | 公共事实 | 无 | 否 | — |
| 元素主要宇宙来源分类(简化) | 首页「元素起源」周期表、stars | Jennifer Johnson, SDSS 博客 2017 https://blog.sdss.org/2017/01/09/origin-of-the-elements-in-the-solar-system/ ;Johnson 2019, Science 363:474 | 事实数据,未复制原图 | 页面文字链接引用原文 | 否 | 每元素只标一个主要来源,比例接近者另注 |
| 比结合能数值 | stars 第 3 关 | IAEA AME2020(Wang et al. 2021, Chinese Phys. C 45:030003),取 2 位小数 | 公共事实 | 无 | 否 | — |
| 人体元素组成(按质量) | 首页周期表「人体组成」视图 | Wikipedia「Composition of the human body」https://en.wikipedia.org/wiki/Composition_of_the_human_body | 事实数据,未复制原文 | 页面文字链接 | 否 | 注「成年人平均,个体差异大」 |
| 金刚石/石墨晶格常数、键长、层距 | carbon | 晶体学标准数据 | 公共事实 | 无 | 否 | — |
| 石墨—金刚石平衡线 P(kbar)=19.4+0.025·T(°C) | carbon 第 4 关相图 | Kennedy & Kennedy 1976, JGR 81:2467–2470 | 公共事实 | 无 | 否 | 外推段页面标「示意」 |
| 食盐晶体几何、雪花形态与温湿度定性关系 | crystal | 晶体学标准事实;中谷宇吉郎雪晶图(定性参考,未复制原图) | 公共事实 | 无 | 否 | — |
| 紫甘蓝花青素颜色与 pH 代表值、家用液体大致 pH | cabbage | 化学教材公认范围,取代表值 | 公共事实 | 无 | 否 | 页面标「示意」;分子图注「示意,真实花青素连着糖」 |
| 焰色元素特征谱线、谱带分子(SrCl/SrOH、CaOH/CaCl、BaCl/BaOH、CuCl)、氢原子能级 | fireworks | 原子光谱标准数据(NIST 原子光谱数据库量级)、焰色化学教材 | 公共事实 | 无 | 否 | 谱带位置、能级台阶间距页面标「示意(非等比)」 |
| 水果电池电极相对电位、锂离子电池结构 | battery | 标准电极电势(教材常用值)简化 | 公共事实 | 无 | 否 | 读数页面标「示意」 |
| 岩石样本特征、矿物与冷却速度关系 | rocks | 初中化学/地理教材常用值 | 公共事实 | 无 | 否 | 页面注「数据:初中化学教材常用值」及「示意」 |
| 火星尘土反射率趋势、水铁矿结论 | mars | Valantinas et al. 2025, Nature Communications(火星尘土与水铁矿) | 事实数据,曲线自绘未复制原图 | 无 | 否 | 页面标「示意曲线」「科学家仍在研究」 |
| 甲烷/乙烷/氮熔点沸点、土卫六地表约 −179 °C | titan | 物性标准数据(NIST Chemistry WebBook 量级);NASA/ESA 公开资料 | 公共事实 | 无 | 否 | — |
| 惠更斯号 2005-01-14 降落、冰卵石;蜻蜓号计划 2028 年 7 月发射、2034 年抵达 | titan | ESA 惠更斯号任务公开资料;NASA Dragonfly 任务公开资料 | 公共事实 | 无 | 否 | 文字用「计划」;无机构标识 |
| 钠 D 线约 589 nm、氢 656/486/434 nm、氦约 587.6 nm;1868 年发现氦、1895 年分离 | spectra L0 | NIST 原子光谱数据库;化学史公开资料 | 公共事实 | 无 | 否 | — |
| H₂O、CO₂、CH₄ 红外振动吸收位置 | spectra L1 | 分子光谱标准数据(定性) | 公共事实 | 无 | 否 | 页面标「示意」 |
| WASP-39 b(约 700 光年)透射光谱:CO₂(2022 年 8 月)、H₂O/Na/K 确认与 CO、SO₂(2022 年 11 月) | spectra L2–L3 | JWST Transiting Exoplanet ERS Team, Nature 614 (2023) 系列论文;NASA 公开新闻稿 | 事实数据,曲线自绘未复制原图 | 无 | 否 | 页面标「观测(示意)」「示意,未按比例」 |
| 核素基态数据快照(3355 核素:Z、N、每核子结合能、log10 半衰期) | island 第 1 关 3D 地形与 2D 核素图(data/ef.island.chart.json) | IAEA Nuclear Data Services Live Chart of Nuclides(底层 AME2020/NUBASE2020/ENSDF)https://www-nds.iaea.org/relnsd/vcharthtml/VChartHTML.html ;复制自深空层快照 deep/data/nuclides.json(取于 2026-10-30,sha256 ac242737…87bed),由 tools/build_island.py 导出 | IAEA NDS 数据免费公开使用,须注明出处 | 页面标注「IAEA 数据」,实验台图下自动署名 | 否 | 地形右上角「3355 个已知原子核 · IAEA 数据」 |
| 锡同位素链 B/A(data/ef.island.sn.json) | island 第 2 关 | 同上快照子集(Z=50) | 同上 | 实验台图下自动署名 | 否 | 实验台署名 |
| 实测−液滴模型残差(data/ef.island.shell.json) | island 第 3 关 | 同上快照(A≥16)对五项液滴模型最小二乘拟合后的残差,按 N 平均;计算值,非直接观测 | 同上 | 实验台图下自动署名,meta.note 写明为计算值 | 否 | 实验台署名;曲线名「实测 − 液滴模型(计算值)」 |
| Z≥100 每种元素最长寿同位素半衰期(data/ef.island.edge.json) | island 第 4 关 | 同上快照;119–126 号记「未合成」 | 同上 | 实验台图下自动署名 | 否 | 实验台署名 |
| 液滴模型系数 aV 15.75、aS 17.8、aC 0.711、aA 23.7、aP 11.18 MeV | island 第 2 关、实验台公式 | 教科书常用值(与 /core/deep/labs/ef.lab.iron 一致;OpenStax University Physics Vol.3 §10.3 讲解) | 公共事实 | 无 | 否 | — |
| 幻数、核壳层模型(1963 诺贝尔物理学奖)、稳定岛理论预言(Z≈114–126、N≈184) | island 第 3–4 关结论 | 核物理教材公认结论;NobelPrize.org 1963 物理学奖页 | 公共事实 | 无 | 否 | 稳定岛标「猜想」 |
| Og 2016 年 IUPAC 命名;2024 年 Berkeley Lab 钛-50 束流造 116 号;截至 2026-09 119/120 号未有公认合成 | island 第 4 关结论 | IUPAC 2016 公告;LBNL 新闻 2024-07-23;Annual Review of Nuclear and Particle Science 2026 综述 | 公共事实(只引事实,未复制原文与图片,未用机构 logo) | 无 | 否 | 结论标「已证实」,实验台来源链接 |
| 稳定岛「高度」与位置、平滑外推斜率 | island 第 4 关模型 | 本项目教学示意模型,非理论计算结果 | 自制 | 无 | 否 | 曲线名「加上稳定岛(猜想)」、证据等级「猜想」 |
| 3D 核素地形、不稳定之海、稳定岛虚光、r 过程金雨 | island(ef-island3d.js) | 本项目 Three.js 程序生成,无外部贴图 | 自制 | 无 | 否 | 地形卡片注「示意」「猜想」 |

## 五、自查(2026-10-24)
- 页面引用的本地文件:img/mars-base.webp、audio/*.m4a(10 个)、vendor/three.module.min.js,均已登记;无其他图片、贴图、模型、字体文件。
- 外部网络请求:0(代码中出现的外部网址只有两条 <a> 文字引用链接与 SVG 命名空间)。
- AI 生成内容:线上 1 项(火星基地概念图),页面可见标注 1 处(首页图注「概念图,非实景;画面动效为示意」)。
- 未使用任何机构 logo,不暗示任何机构背书。

## 六、自查(2026-11-01,v2.0)
- 新增本地文件:vendor/three.r169.module.min.js、ef-island3d.js、island/、island/labs/*.json(3 份 gn-lab/1 协议)、data/ef.island.*.json(4 份)、tools/build_island.py、tools/protos.py(复算脚本),均已登记。
- 外部网络请求:0。实验台来源链接为文字引用。
- AI 生成内容:实验台问题、猜测题、结论文字由 AI 撰写(协议 ai_generated 字段写明);数值全部由脚本复算并有模型自动校验(7 项)。
