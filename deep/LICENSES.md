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
