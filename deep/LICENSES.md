# 深空层 /deep/ 与 /core/deep/ 素材台账(1.0 台账规范格式)
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
