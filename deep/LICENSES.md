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
