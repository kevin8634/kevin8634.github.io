# 深空层 /deep/ 与 /core/deep/ 素材台账(1.0 台账规范格式)

> 法律与版权声明:[legal.html](legal.html)(免费、非商业、教育用途;逐项署名,数据保留原许可;接权利人通知即下架)。

| # | 素材 | 位置 | 来源 | 许可 | AI 生成/标注 |
|---|---|---|---|---|---|
| 1 | three.js r169 | deep/vendor/three.module.min.js | npm three@0.169.0 | MIT | 否 |
| 2 | three.js r169 examples/jsm(EffectComposer/RenderPass/UnrealBloomPass/OutputPass/ShaderPass/MaskPass/Pass + Copy/LuminosityHighPass/Output 着色器) | deep/vendor/jsm/ | npm three@0.169.0 | MIT(LICENSE-three.txt) | 否 |
| 3 | KaTeX 0.16.11(js/css/woff2 字体) | core/deep/katex/ | npm katex@0.16.11 | MIT(LICENSE.txt) | 否 |
| 4 | 《群星闪耀》 | deep/deep-a.m4a | 创世计划原创,代码合成 | 自有 | AI 协助编写合成代码 |
| 5 | 《宇宙闪烁》 | deep/deep-b.m4a | 创世计划原创,代码合成 | 自有 | AI 协助编写合成代码 |
| 6 | 星尘/星团/公式星座/光晕贴图 | deep/index.html 运行时生成 | 自有代码 | 自有 | AI 协助编写代码;画面为艺术示意 |
| 7 | 星辰层占位公式(欧拉恒等式等七条) | deep/index.html | 公有领域通用公式 | — | 否 |
| 8 | 课本卡 | deep/cards/*.json | 各世界提交,卡内 sources 字段列出处 | 见各卡 | 见各卡 ai_generated 字段 |
| 9 | three.js r186(esbuild 打包压缩 ESM,含 three.core) | deep/vendor/r186/three.module.min.js | npm three@0.186.1 | MIT(LICENSE-three.txt) | 否 |
| 10 | three.js r186 examples/jsm 后期分片(EffectComposer/RenderPass/UnrealBloomPass/OutputPass 及依赖着色器) | deep/vendor/r186/post.min.js | npm three@0.186.1 | MIT | 否 |
| 11 | three.js r186 WebGPU 构建(仅基准页 deep/bench/ 使用) | deep/vendor/r186/three.webgpu.min.js | npm three@0.186.1 | MIT | 否 |
| 12 | 莫纳罗亚 CO₂ 年均浓度 1959–2025(DataChart 自测数据) | deep/data/noaa.co2.mlo.annual.json | NOAA GML co2_annmean_mlo.txt,取于 2026-10-26 | 美国联邦政府数据(公有领域),按 NOAA GML 要求署名 | 否 |
默认加载 r186;`?three=169` 回滚到 #1、#2(保留到 2.0 发布)。
门户《深空之下》music-deep-below.m4a 登记在门户台账。

## V1 开场真实影像(2026-10-29 登记;机器可读版 deep/assets/v1/ledger.json,Ledger 字段)
| # | 素材 | 位置 | 来源 | 许可 | AI 生成/标注 |
|---|---|---|---|---|---|
| 13 | 银河全景(GigaGalaxy Zoom,裁银道带 ±36°) | deep/assets/v1/sky-milkyway.webp | [ESO/S. Brunier](https://www.eso.org/public/images/eso0932a/),取于 2026-10-29 | CC BY 4.0(署名,原文不改) | 否;仅缩放/裁切/黑场/羽化 |
| 14 | 涡状星系 M51 及伴星系 | deep/assets/v1/gx-m51.webp | [NASA, ESA, S. Beckwith (STScI), and The Hubble Heritage Team (STScI/AURA)](https://esahubble.org/images/heic0506a/),取于 2026-10-29 | CC BY 4.0(署名,原文不改) | 否;仅缩放/裁切/黑场/羽化 |
| 15 | 风车星系 M101 | deep/assets/v1/gx-m101.webp | [European Space Agency & NASA(致谢见原页:K.D. Kuntz 等;图像处理 Davide De Martin)](https://esahubble.org/images/heic0602a/),取于 2026-10-29 | CC BY 4.0(署名,原文不改) | 否;仅缩放/裁切/黑场/羽化 |
| 16 | 草帽星系 M104 | deep/assets/v1/gx-sombrero.webp | [NASA/ESA and The Hubble Heritage Team (STScI/AURA)](https://esahubble.org/images/opo0328a/),取于 2026-10-29 | CC BY 4.0(署名,原文不改) | 否;仅缩放/裁切/黑场/羽化 |
| 17 | Close encounter(小星系) | deep/assets/v1/gx-small.webp | [ESA/Hubble & NASA](https://esahubble.org/images/potw1719a/),取于 2026-10-29 | CC BY 4.0(署名,原文不改) | 否;仅缩放/裁切/黑场/羽化 |
| 18 | VISTA 螺旋星云 NGC 7293 | deep/assets/v1/nb-helix.webp | [ESO/VISTA/J. Emerson. Acknowledgment: Cambridge Astronomical Survey Unit](https://www.eso.org/public/images/eso1205a/),取于 2026-10-29 | CC BY 4.0(署名,原文不改) | 否;仅缩放/裁切/黑场/羽化 |
| 19 | 船底座“宇宙悬崖”(NIRCam) | deep/assets/v1/nb-carina.webp | [NASA, ESA, CSA, and STScI](https://esawebb.org/images/weic2205a/),取于 2026-10-29 | CC BY 4.0(署名,原文不改) | 否;仅缩放/裁切/黑场/羽化 |
| 20 | 蜘蛛星云(NIRCam) | deep/assets/v1/nb-tarantula.webp | [NASA, ESA, CSA, and STScI](https://esawebb.org/images/weic2212a/),取于 2026-10-29 | CC BY 4.0(署名,原文不改) | 否;仅缩放/裁切/黑场/羽化 |
| 21 | 创生之柱(Webb,裁切版) | deep/assets/v1/nb-pillars.webp | [NASA, ESA, CSA, STScI; J. DePasquale, A. Koekemoer, A. Pagan (STScI)](https://esawebb.org/images/weic2216a/),取于 2026-10-29 | CC BY 4.0(署名,原文不改) | 否;仅缩放/裁切/黑场/羽化 |
| 22 | 海面/光柱/黑洞/七色世界星/星点着色器 | deep/opening.js 运行时生成 | 自有代码 | 自有 | AI 协助编写代码;画面为艺术示意 |
| 23 | 核素基态数据快照(3355 核素:Z、N、每核子结合能、半衰期) | deep/data/nuclides.json | [IAEA Nuclear Data Section · Live Chart of Nuclides API](https://nds.iaea.org/relnsd/v1/data?fields=ground_states&nuclides=all)(底层 AME2020 / ENSDF),取于 2026-10-30 | IAEA NDS 数据免费公开使用,须注明出处(页面图例已署名) | 否;仅精简字段、换算单位 |
| 24 | 实验舱(V3)/核素岛(V4)场景:舱体、投影光锥、全息曲线、核素地形、不稳定之海、稳定岛、r 过程金雨 | deep/lab.js、deep/island.js 运行时生成 | 自有代码 | 自有 | AI 协助编写代码;稳定岛与金雨为理论示意,页面已标注 |

许可依据:ESO https://www.eso.org/public/copyright/ ;ESA/Hubble https://esahubble.org/copyright/ ;ESA/Webb https://esawebb.org/copyright/ (均为 CC BY 4.0,须清晰署名)。页面左下角 #note 常驻署名并指向本台账。
未用 KTX2:沙箱无 toktx/basisu 且需额外 vendor basis 转码 wasm;改用 webp(q82–88),9 张合计约 1.6 MB,长边 ≤4096。

| deep/music/l0–l4.m4a | 原创合成(numpy 程序生成,无采样;2026-10-30 门户 2.0.1) | 创世计划 Genesis | 自有 |
| deep/data/nasa.planets.kepler.json | NASA NSSDCA Planetary Fact Sheet(2025-03-18 版,https://nssdc.gsfc.nasa.gov/planetary/factsheet/;2026-10-30 取数,换算 AU/年并取对数) | NASA | 公有领域(美国联邦政府),署名 NSSDCA |
| deep/data/jhu.covid.italy.2020mar.json | JHU CSSE COVID-19 Data Repository(https://github.com/CSSEGISandData/COVID-19,time_series_covid19_confirmed_global.csv 意大利 2020-02-24 至 03-25;2026-10-30 取数,取对数,model 列为拟合值非观测) | Johns Hopkins University CSSE | CC BY 4.0(署名) |
| deep/data/nasa.nssdc.jovian.sats.json | NASA NSSDCA Jovian Satellite Fact Sheet(2023-12-06 版,https://nssdc.gsfc.nasa.gov/planetary/factsheet/joviansatfact.html;8 颗规则卫星半长轴/周期,M_est 为脚本反推值,M_ref 取 Jupiter Fact Sheet 1898.13×10²⁴ kg) | NASA | 公有领域(美国联邦政府),署名 NSSDCA |
| deep/data/nist.h1.balmer.json | NIST Atomic Spectra Database(https://physics.nist.gov/PhysRefData/ASD/lines_form.html;H I 巴耳末系 n=3–10 观测真空波长,2026-10-30 取数;model 列为拟合值非观测) | NIST | NIST 标准参考数据,摘录数值并署名 |
| deep/data/mendel1866.f2.json | Mendel 1866《Versuche über Pflanzen-Hybriden》第 5 节 F2 计数(英译 Druery & Bateson 1901,MendelWeb 存档 https://web.archive.org/web/2024/http://www.mendelweb.org/Mendel.html;model 列为理论值 3) | Gregor Mendel | 公有领域 |
| deep/data/uci.optdigits.fgsm38.json | UCI ML Repository · Optical Recognition of Handwritten Digits(Alpaydin & Kaynak 1998,doi:10.24432/C50P49,https://archive.ics.uci.edu/dataset/80/optical+recognition+of+handwritten+digits);本站脚本训练逻辑回归并做 FGSM 攻击的实测结果(衍生数据) | UCI / 原作者;衍生实测 创世计划 | CC BY 4.0 衍生(署名,已标注为实测衍生) |
| deep/data/bls.cpiu.annual.json | U.S. BLS Historical CPI-U(December 2024 补充表,https://www.bls.gov/cpi/tables/supplemental-files/historical-cpi-u-202412.pdf;1913–2024 年均指数,取对数,model 列为拟合值非观测) | U.S. Bureau of Labor Statistics | 公有领域(美国联邦政府),署名 BLS |
| deep/cards/ma/nv/ef/ls/ps/lt.l2.json | 星系层建模卡 1.2 第 2–7 张(总指挥 2026-10-30 编写,AI 协助;按王磊 10-30 18:27 确认的选题与许可口径) | 创世计划 | 自有;卡内 sources 列出处 |
| deep/legal.html | 深空层法律与版权声明(王磊 10-30 18:27 确认第 9 条) | 创世计划 | 自有 |

## 深空 1.4 星穹研究者卡数据(2026-10-30,总指挥)
| 台账 id | 内容 | 来源 | 许可 / 署名 |
|---|---|---|---|
| math.primes.pi_li | π(x)、li(x) 误差 10²–10⁸ | 本站脚本计算(筛法 + Ramanujan 级数);RH 上界据 Schoenfeld 1976 | 本站计算,CC BY 4.0 |
| sparc.ngc3198.rotmod | NGC 3198 旋转曲线 | SPARC,Lelli, McGaugh & Schombert 2016, AJ 152:157 | 公开科研数据,按要求引用原论文 |
| iaea.superheavy.halflife | Z≥104 半衰期 | IAEA NDS Live Chart(nuclides.json 子集) | IAEA 公开核数据,署名 |
| ls.origin.timeline | 生命起源年代 5 条 | Moody 2024、Wilde 2001、Djokic 2017 | 论文事实摘录,署名 |
| scp.union21.binned | 580 颗 Ia 超新星分 20 组 | Supernova Cosmology Project Union2.1,Suzuki et al. 2012 | 公开科研数据,按要求引用 |
| bls.cpiu.inflation | 美国年通胀率 1914–2024 | 由 BLS Historical CPI-U 计算 | 公有领域,署名 BLS |
| ai.model.params | 8 个代表性模型参数量 | 各模型原论文/技术报告 | 论文公开数值摘录,署名 |
拟合/模型列均在 meta.note 标注「非观测」。七张卡文字由 AI 撰写,审稿状态「AI 审 + 脚本复算」,待指定领域审稿人。

## 深空 1.5 航线「铁从哪里来」(2026-10-30,总指挥)
| 台账 id | 内容 | 来源 | 许可 / 署名 |
|---|---|---|---|
| iaea.binding.curve | 每 A 最大 B/A 曲线 + 液滴模型列(计算值,非观测) | IAEA NDS Live Chart(nuclides.json 导出) | IAEA 公开核数据,署名 |
| deep/routes/iron.json | 四站航线卡(宙律→元素工坊→天枢→生命源码);常数引自 NNDC/ENSDF、Nadyozhin 1994、Arnett 1989、NIH ODS | 创世计划(AI 协助) | 自有;卡内 sources 列出处 |

## 深空 1.6 航线「潮汐锁定」(2026-10-30)
- routes/tide.json:文字 AI 撰写,数值由 tide_build.py 复算;引用 NASA Fact Sheet(公有领域)、Gladman 1996、Dickey 1994、Wells 1963、Stephenson 2016 的公开数值(事实数据,注明出处);无图片、无新数据集。

## 深空 1.7 航线「一场疫情的数学」(2026-10-31)
- routes/epi.json:文字 AI 撰写,数值由 docs/epi_build.py 复算;第 1 站图表复用 data/jhu.covid.italy.2020mar.json(JHU CSSE,CC BY 4.0,见上);引用 Roizman《Medical Microbiology》第 42 章(NCBI Bookshelf)、Fine 等 2011(Clin Infect Dis)、Holmdahl & Buckee 2020(NEJM)的公开概念与公式(注明出处);无图片、无新数据集。各站标注「不构成医疗或公共卫生建议」。

## 深空 1.8 航线「一次提问的能量」(2026-10-31)
- routes/ask.json:文字 AI 撰写,数值由 docs/ask_build.py 复算;引用 Hoffmann 等 2022、Kaplan 等 2020(arXiv)、NVIDIA H100 官方规格、Landauer 1961、NIST CODATA、Goodenough & Park 2013 的公开数值与公式(事实数据,注明出处,不用 logo、不暗示背书);无图片、无新数据集。各站标注能耗为量级估算。

## 深空 1.9 航线「卫星钟为什么要调慢」(2026-10-31)
- routes/gps.json:文字 AI 撰写,数值由 docs/gps_build.py 复算;引用 GPS.gov(美国政府公开信息)、NASA Earth Fact Sheet、Ashby 2003(Living Reviews in Relativity)的公开数值与公式(注明出处,不用 logo、不暗示背书);无图片、无新数据集。

## 深空 2.1「2026 诺奖前沿」三张卡(2026-11-09,总指挥)
| 台账 id / 文件 | 内容 | 来源 | 许可 / 署名 |
|---|---|---|---|
| sim.icecube.hits | 一条 μ 子径迹在 4 根串上的光到达时间(66 个命中) | 本站程序模拟(docs/nobel26_build.py,种子 20261006);几何取 IceCube 公开设计值(串距 125 m、DOM 间距 17 m,IceCube Collaboration 2017 JINST 12 P03012) | 本站原创,CC BY 4.0;**模拟数据,非 IceCube 观测**,未引入任何 IceCube 数据文件 |
| sim.chr2.hill | ChR2 归一化峰值光电流 vs 光强 10 点 | 本站程序模拟(种子 20261005);参数取 Lin 2011 Exp Physiol 96:19 表 1 的公开典型值 EC50≈1.10 mW/mm²(事实数值,注明出处) | 本站原创,CC BY 4.0;**模拟数据,非实验测量** |
| model.soai.amplify | 二级自催化教学模型 ee 放大曲线 | 本站计算(解析不变量 ee/(1−ee²)∝产物总量,RK4 核对) | 本站原创,CC BY 4.0;模型计算值,非观测 |
| deep/cards/nv.l2.icecube.json、ls.l2.optogenetics.json、ef.l4.chirality.json | 三张「前沿 · 2026 诺奖」卡 | 文字 AI 撰写,数值由 docs/nobel26_build.py 复算;诺奖得主与获奖理由核实自 NobelPrize.org 2026 物理/生理学或医学/化学奖 summary 与 popular information 页(2026-11-09 取) | 自有;卡内 sources 逐条列出处;只引用事实与公式,不转载 NobelPrize.org 文字与插图,不用任何机构 logo,不暗示背书 |

## 深空 2.2 航线「你身上的碘从哪来」(2026-11-09,总指挥)
| 台账 id / 文件 | 内容 | 来源 | 许可 / 署名 |
|---|---|---|---|
| iaea.a127.isobar | A=127 同量异位素(Z=45–60)基态半衰期 log₁₀ 秒与 B/A | IAEA NDS Live Chart of Nuclides(AME2020/ENSDF),由本站 data/nuclides.json 快照经 docs/iod_build.py 导出 | IAEA 公开核数据,署名 IAEA NDS |
| deep/routes/iod.json | 四站航线卡(宙律→元素工坊→天枢→生命源码) | 文字 AI 撰写,数值由 docs/iod_build.py 复算;引用 IAEA、Ellis 等 2024(PLB)、Metzger 2019(Living Rev. Relativ.)、Côté 等 2021(Science)、LIGO & Virgo 2017(PRL)、Thielemann & Cowan 2026(arXiv)、Reifarth 等 2014(J. Phys. G)、NIH ODS Iodine Fact Sheet(美国政府公开信息)、PubChem CID 5819 的公开数值与公式 | 自有;卡内 sources 逐条列出处;只引用事实数值,不转载原文与插图,不用 logo、不暗示背书;无图片 |
- 同批:data/sim.icecube.hits.json 到达时间改以 μs 存储(原 ns 值 ÷1000,与图表纵轴单位一致;仍为本站模拟数据,非观测)。

## 深空 2.3「前沿 · 旅行者 1 号一光日」卡(2026-11-09,总指挥)
| 台账 id / 文件 | 内容 | 来源 | 许可 / 署名 |
|---|---|---|---|
| jpl.horizons.voyager1 | 旅行者 1 号地心几何距离(AU)与距离变化率(km/s),2026-01-01 至 2027-12-22 每 10 天,72 行;lin、fit 两列为本站计算 | NASA/JPL Horizons 星历(目标 -31,中心 500@399,VECTORS 表 4,VEC_CORR=NONE,2026-11-09 取),经 docs/voyager_build.py 生成 | Horizons 数据为 NASA/JPL 公开数据(美国政府作品),署名 NASA/JPL Horizons;lin、fit 为本站计算,CC BY 4.0,**近似,非观测** |
| deep/cards/sh.l2.voyager.json | 天枢星系层「前沿 · 一光日」卡 | 文字 AI 撰写,数值由 docs/voyager_build.py 复算;时刻与距离核实自 NASA Science「Where Are Voyager 1 and 2 Now?」与 JPL 新闻 2026-10-29;c 取 SI 定义(BIPM),AU 取 IAU 2012 B2 | 自有;卡内 sources 逐条列出处;只引用事实数值,不转载 NASA 文字与图片,不用 NASA/JPL logo,不暗示背书;无图片 |

## 深空 2.4「模型炼炉 · 暗物质」(2026-11-09,总指挥)
| 台账 id / 文件 | 内容 | 来源 | 许可 / 署名 |
|---|---|---|---|
| sparc.ngc3198.components | NGC 3198 自转曲线与质量分量 43 点(R、Vobs、errV、Vgas、Vdisk、Vbul;D=13.8 Mpc) | SPARC,Lelli, McGaugh & Schombert 2016, AJ 152:157,Rotmod_LTG.zip / NGC3198_rotmod.dat 前 6 列原样摘录(https://astroweb.case.edu/SPARC/,2026-11-09 取);与 1.4 台账 sparc.ngc3198.rotmod 同源(核对:R、Vobs、errV 逐点一致) | 公开科研数据,按 SPARC 要求引用原论文 Lelli, McGaugh & Schombert 2016, AJ 152, 157;仅数值摘录 |
| deep/forge/engine.js、forge.js、dm.json、index.json | 模型炼炉引擎、界面与暗物质炉配置(伪等温晕公式引 Begeman, Broeils & Sanders 1991, MNRAS 249, 523;de Blok et al. 2008, AJ 136, 2648) | 创世计划(AI 协助);数值由 docs/forge_dm_check.mjs 复算 | 自有,CC BY 4.0;模型曲线、拟合值为本站计算,**非观测** |

## 深空 2.5「模型炼炉 · 开普勒」(2026-11-09,总指挥)
| 台账 id / 文件 | 内容 | 来源 | 许可 / 署名 |
|---|---|---|---|
| jpl.planets.kepler | 八大行星半长轴 a(au)、恒星周期 T = 36000/L̇(儒略年)、教学误差 errT、质量比 mu,8 行 | NASA/JPL SSD「Approximate Positions of the Planets」Table 1(1800–2050 AD;Standish & Williams 1992),https://ssd.jpl.nasa.gov/planets/approx_pos.html(2026-11-09 取,只摘 a0 与 L̇);行星质量取 NASA NSSDCA Planetary Fact Sheet(2025-03-18 版)、太阳质量 1,988,400×10²⁴ kg 取 NSSDCA Sun Fact Sheet(https://nssdc.gsfc.nasa.gov/planetary/factsheet/);经 docs/kepler_build.py 生成 | NASA/JPL 公开数据(美国政府作品),署名 NASA/JPL SSD 与 NSSDCA;仅数值摘录;errT(教学相对误差 2×10⁻⁴)与 mu 为本站计算,**errT 不是测量误差** |
| kepler.json 胶囊真值 | 1 Ceres a = 2.765552595 au、恒星周期 1679.853120 天(轨道解 48,历元 JD 2461200.5);134340 Pluto a = 39.58862939 au、恒星周期 90981.716 天(历元 JD 2457588.5) | NASA/JPL Small-Body Database API(https://ssd-api.jpl.nasa.gov/sbdb.api,full-prec=1,2026-11-09 取) | NASA/JPL 公开数据,署名 NASA/JPL SBDB;仅数值摘录 |
| deep/forge/kepler.json、engine.js(深空 2.5 增补 pow/lin 核、factor 修正因子、点名、过关参数区间)、forge.js(炉选择、对数轴、标签避让) | 开普勒炉配置与炼炉引擎/界面增补 | 创世计划(AI 协助);数值由 docs/forge_kepler_check.mjs 复算 | 自有,CC BY 4.0;模型曲线、拟合值为本站计算,**非观测**;不使用 NASA/JPL logo,不暗示背书 |
- 旧台账 deep/data/nasa.planets.kepler.json(NSSDCA,已取对数、无误差列、周期仅 3–4 位有效数字,海王星 59,800 天与 a^1.5 相差约 1.3%)继续供 1.2 星系层建模卡使用,**炼炉不用它**。

## 深空 2.5.1「前沿 · 最冷 9.7 pK」卡与冷原子实验柜(2026-11-09,总指挥)
| 台账 id / 文件 | 内容 | 来源 | 许可 / 署名 |
|---|---|---|---|
| frontier.cold.ladder | 百年温度阶梯 9 级(2.5.1 修订):室温 300 K(约定值)、液氦 4.2 K(1908)、宇宙微波背景 2.72548 K、首个 BEC 约 170 nK(1995)、首次低于 1 nK 450 pK(2003,MIT)、对照 NASA 冷原子实验室 z 方向膨胀能 52 pK(2022,单方向,非三维温度)、对照斯坦福二维 50 pK(2015)、不来梅落塔 38 pK(2021)、中国空间站 9.7 pK(2026);每行 source、url 列出处,kind=cmp 标口径不同 | NIST TRC《Cryogenics》(Radebaugh);NobelPrize.org(1913 昂内斯 Facts、2001 物理奖 popular information);Fixsen 2009 ApJ 707, 916(arXiv:0911.1955);Leanhardt et al. 2003 Science 301, 1513;Gaaloul et al. 2022 Nat. Commun. 13, 7889(CC BY 4.0);Kovachy et al. 2015 PRL 114, 143004(arXiv:1407.6995);Deppner et al. 2021 PRL 127, 100401;Xiong et al. 2026 Science doi:10.1126/science.aea5324(均 2026-11-09 取);经 docs/cold_build.py 生成 | 事实数值摘录(各行注明出处),整理与 lgT 列为本站作品,CC BY 4.0;不转载原文与图片 |
| deep/cards/nv.l2.cold.json | 宙律星系层「前沿 · 最冷 9.7 pK」卡 | 文字 AI 撰写,数值由 docs/cold_build.py 复算(CODATA 2018 常数,⁸⁷Rb 质量 86.909180527 u);事实核实自 Science 论文摘要与论文页(收稿/接收/First Release 日期、Zenodo 数据 doi:10.5281/zenodo.18217600 CC BY 4.0)、Front. Phys. 10, 971059 (2022)、北京大学新闻网 2026-11-06、中国科学院转载光明日报 2026-11-07、Science 新闻 2026-11-05、新华社英文 2026-11-06、PRL 127, 100401 全文;2.5.1 修订补:新华社 2026-11-06 胡喆(李唐原话)、中新网 2026-11-06(陈徐宗原话)、科技日报 2026-11-09 陆成宽(中国科学院官网转载,500 微米比喻) | 自有,CC BY 4.0;卡内 sources 逐条列出处;只引用事实数值与简短原话(注明说话人与媒体);**不使用北大/中科院/央媒的视频、图片与机构 logo**,不暗示背书 |
| deep/front/cold.js | 冷原子实验柜(温度阶梯总图、重力开关、光强滑杆、两级光阱、物质波与「一朵波」、声音) | 创世计划原创代码(AI 协助),Canvas 2D 程序绘制 | 自有,CC BY 4.0;画面、原子个数与运动、起点 1 μK、地面「托不住」阈值(约 0.2 W,02 宙律审校粗估)均为**教学示意,非观测**;声音由 Web Audio 实时合成,默认静音 |

## 深空 2.6「模型炼炉 · 疫情」(2026-11-12,总指挥)
| 台账 id / 文件 | 内容 | 来源 | 许可 / 署名 |
|---|---|---|---|
| dpc.covid.italy.wave1 | 意大利全国每日累计确诊 cases、现有阳性 active、累计移出 removed(治愈出院+死亡)、累计死亡 deaths、当日新增 new,2020-02-24 至 2020-06-30 共 128 行;errC 为本站设定的 5% 教学误差 | 意大利民防部 Dipartimento della Protezione Civile,GitHub pcm-dpc/COVID-19 `dati-andamento-nazionale/dpc-covid19-ita-andamento-nazionale.csv`,固定提交 fc82987b9ebda01fe8e5b59d5667e3e00721edb9(2026-11-12 取),经 docs/epi_forge_build.py 生成;数值未改动,只做列选取与 removed 加法;2020-06-19 的 −148 为 DPC 数据更正,原样保留 | CC BY 4.0,署名 Presidenza del Consiglio dei Ministri – Dipartimento della Protezione Civile;errC 与 removed 为本站计算,**errC 不是测量误差** |
| deep/forge/epi.json、engine.js(深空 2.6 增补 expo/logis/sir 核、mod 修饰积木、派生量 R₀ 与误差传播、截断拟合 sliceData)、forge.js(万/亿读数、派生量栏、「用前 N 天数据封存」胶囊与封存模型青虚线) | 疫情炉配置与炼炉引擎/界面增补;SIR 模型引 Kermack & McKendrick 1927, Proc. R. Soc. A 115, 700 | 创世计划(AI 协助);数值由 docs/forge_epi_check.mjs 复算,并经 epi_forge_build.py --scipy 独立复算 | 自有,CC BY 4.0;模型曲线、拟合值、R₀ 为本站计算,**非观测**;仅为科学科普计算,不构成医疗或公共卫生建议;不使用意大利政府/民防部标志,不暗示背书 |
- 1.7 航线「一场疫情的数学」的 jhu.covid.italy.2020mar(JHU CSSE 快照,31 天)未改动;与 DPC 对照只有 2020-02-26、02-27 两天不同(JHU 453、655;DPC 400、650),炼炉以一手来源 DPC 为准。

## 深空 2.7「模型炼炉 · CO₂」(2026-11-12,总指挥)
| 台账 id / 文件 | 内容 | 来源 | 许可 / 署名 |
|---|---|---|---|
| noaa.co2.mlo.monthly | 莫纳罗亚 CO₂ 月均浓度(Keeling 曲线)1958-03 至 2026-09 共 823 行:t 月中小数年份、ym、co2 月均、deseason 去季节值、ndays、unc(均为 NOAA 原值);err 为本站设定的 0.8 ppm 教学误差 | NOAA Global Monitoring Laboratory `https://gml.noaa.gov/webdata/ccgg/trends/co2/co2_mm_mlo.txt`(File Creation 2026-10-09 13:08:07,2026-11-12 取,sha256 0ce4e774…1cad);1958-03 至 1974-04 为 Scripps Institution of Oceanography(C. D. Keeling)观测;经 docs/co2_forge_build.py 生成,数值未改动,只选列;与已入库年均文件 noaa.co2.mlo.annual 对照 67 年,差 ≤ 0.01 ppm | 美国联邦政府数据(公有领域);按 NOAA GML 要求署名:Dr. Xin Lan, NOAA/GML(gml.noaa.gov/ccgg/trends/)与 Dr. Ralph Keeling, Scripps Institution of Oceanography(scrippsco2.ucsd.edu);引 Lan, X., Tans, P. and K.W. Thoning, *Trends in globally-averaged CO2 determined from NOAA Global Monitoring Laboratory measurements*;Keeling, C. D. et al. 1976, Tellus 28, 538;**err 不是测量误差**;不使用 NOAA 标志,不暗示背书 |
| deep/forge/co2.json、engine.js(深空 2.7 增补 co2lin/co2quad/co2exp/harm1/harm2 核、派生量 co2g 增长率与 co2amp 季节峰谷差、needAny)、forge.js(真实到期胶囊:总指挥封存值、「待 NOAA 发布后开封」状态;data.star 星点缩放;comps:false 不画分量) | CO₂ 炉配置与引擎/界面增补;「总指挥封存」2027-05 预测 433.97 ± 0.81 ppm 为本站计算 | 创世计划(AI 协助);数值由 docs/forge_co2_check.mjs 复算,并经 co2_forge_build.py --scipy 独立复算 | 自有,CC BY 4.0;模型曲线、拟合值、增长率、预测为本站计算,**非观测、非 NOAA 预测** |

## 深空 2.9「电影感画质」(2026-11-14,总指挥)
| 台账 id / 文件 | 内容 | 来源 | 许可 / 署名 |
|---|---|---|---|
| deep/fx.js | 三档画质(显卡判断 + G 键 + 本机记忆)、HDR 后期链(5 级 Bloom,首级 Karis 平均)、ACES/AgX 混合色调映射、分离色调、抖动、按深度层关键帧、亚像素星点淡化、动态分辨率、子场景 PMREM 环境光 / 高度雾 / 逆光三件套、核素岛上帝光 | 总指挥自写;流程参考王磊提供的画质专长包(只学思路,未复制代码) | 本站作品,与站点代码同许可 |
| ACES 拟合系数 | RRT+ODT 有理拟合与输入/输出矩阵(与 three.js ACESFilmicToneMapping 同口径) | Stephen Hill,BakingLab(MIT);three.js(MIT) | MIT,致谢 Stephen Hill 与 three.js 作者 |
| AgX 多项式近似 | AgX 基矩阵与 6 次多项式拟合 | Benjamin Wrensch 公开博文《Minimal AgX implementation》(2023);three.js AgXToneMapping(MIT) | 公开公式,致谢 Benjamin Wrensch、Troy Sobotka(AgX 原作)与 three.js 作者 |
不新增任何图片、模型或外部请求;环境光取自已登记的 #13 银河全景。

