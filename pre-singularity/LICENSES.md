# 奇点前夜 Pre-Singularity · 素材与 AI 标注台账

> v1.0 台账版 · 2026-10-24 · 创世计划 Genesis 第 05 个世界(超级智能 SI)· 按《1.0 素材与 AI 标注台账规范》整理
> 本台账为合规初稿,需律师审阅。线上 `/pre-singularity/LICENSES.md` 与云盘「05_奇点前夜 Pre-Singularity/开发文档/LICENSES.md」内容一致。

| 素材 | 用在哪(任务/页面) | 来源与链接 | 许可 | 署名要求 | 是否 AI 生成 | 页面标注位置 |
|---|---|---|---|---|---|---|
| **一、图片与贴图** | | | | | | |
| fg_sofa.webp(沙发上的人物背影与茶几,前景图) | 大厅顶层套房(index.html,宽屏 >900px 显示) | 本项目用图像生成工具生成后绿幕抠像,非真实人物 | 自制(AI 生成) | 无 | **是**(AI 生成人物) | 大厅右下角常显「画面含 AI 生成内容」(与图片同显同隐,≤900px 两者都不显示);img alt「AI 生成的示意人物」;探索笔记页素材说明;含该画面的截图/宣传图同样标注 |
| 3D 城市、套房、神经核、奇点视界、星点、粒子 | 大厅 3D 场景(ps-scene.js / ps-lobby3d.js / ps-penthouse.js) | 着色器与几何体程序实时生成 | 原创 | 无 | 否 | — |
| 黎明天色、窗灯渐少(v0.9.3) | 大厅窗外天色随已过关数/29 变化(ps-penthouse.js) | 程序实时生成渐变与着色器 | 原创 | 无 | 否 | — |
| 「省」画质档与自动降档(v0.9.2) | 大厅 3D 场景 | 仅调整程序生成参数,无新增素材 | 原创 | 无 | 否 | — |
| 各任务页插图、图表、像素网格(猫、熊猫/噪点、注意力热图等) | cat / panda / attn / scale / robot 等任务页 | Canvas/CSS/SVG 程序绘制,像素数据手工编写 | 原创 | 无 | 否 | — |
| **二、3D 模型** | | | | | | |
| 无外部 3D 模型文件 | — | 全部场景为程序几何体 | — | — | 否 | — |
| **三、音效与音乐** | | | | | | |
| 大厅与各任务音乐、天命之瞳音乐 2.0、奇点音乐 | 全站 | Web Audio 程序实时合成,无采样 | 原创 | 无 | 否 | — |
| 交互音效、人设声效床、PS.playVO 角色声效(v0.9.1 起替代语音文件) | 全站(ps.js) | Web Audio 程序实时合成 | 原创 | 无 | 否 | — |
| **四、语音/配音** | | | | | | |
| 萤与角色台词朗读(默认关闭) | 全站朗读开关 | 用户设备自带语音合成 speechSynthesis,本站不分发任何音频文件 | 由用户操作系统提供 | 无 | 否(系统 TTS,非本站生成音频) | 探索笔记页素材说明「朗读用的是你设备自带的语音,默认关闭」 |
| ~~vo/core0–4.mp3、vo/hz0–4.mp3~~ | (已删除) | 微软 Edge 在线朗读生成 | 无面向开发者的商用授权 | — | 是(TTS) | **v0.9.1(2026-10-23)已从线上移除** |
| **五、字体** | | | | | | |
| 系统字体(font-family 回落链) | 全站 | 用户设备自带 | 由用户操作系统提供 | 无 | 否 | 不随站分发字体文件,无 @font-face |
| **六、第三方库** | | | | | | |
| Three.js r169(three.module.min.js) | 大厅 3D 场景(vendor/) | https://github.com/mrdoob/three.js | MIT | 保留版权与许可声明(vendor/three.LICENSE) | 否 | — |
| Three.js addons:EffectComposer、RenderPass、ShaderPass、MaskPass、OutputPass、UnrealBloomPass、CopyShader、LuminosityHighPassShader、OutputShader | 辉光等后期效果(vendor/addons/) | 同上,随 r169 | MIT | 同上 | 否 | — |
| Transformers.js 4.3.1 | 接入巨人页「离线巨人」(giant/llm-worker.js) | https://github.com/huggingface/transformers.js ;用户点击后才从公共 CDN 加载(jsdelivr 及其镜像),不随站分发 | Apache-2.0 | 保留许可声明 | 否 | — |
| ONNX Runtime Web | Transformers.js 推理后端 | https://github.com/microsoft/onnxruntime ;随 Transformers.js 由 CDN 加载 | MIT | 保留许可声明 | 否 | — |
| **七、模型与外部服务** | | | | | | |
| Qwen2.5-0.5B-Instruct(ONNX 版) | 接入巨人页「离线巨人」 | 用户点击后从魔搭 ModelScope(备用 Hugging Face 镜像)下载到本机;giant/qwen/ 只自带 4 个配置 json | Apache-2.0(阿里云通义千问) | 保留许可声明 | 模型本身是 AI;其回答为用户本机实时生成 | 接入巨人页卡片标明「QWEN2.5-0.5B · 在你的电脑上运行」「一个真实的 5 亿参数语言模型」 |
| 自带大模型钥匙对照(DeepSeek、Kimi/月之暗面、阿里云百炼、火山方舟、硅基流动) | 接入巨人页 | 用户自行持有钥匙,浏览器直连对应服务商接口 | 各服务商条款 | — | 回答为 AI 生成 | 接入巨人页卡片标明「BYOK · 你的浏览器直连厂商」;本站不保存、不转发钥匙 |
| **八、数据来源** | | | | | | |
| 熊猫被认成长臂猿的对抗样本实验(2014) | panda 任务导语 | Goodfellow, Shlens, Szegedy《Explaining and Harnessing Adversarial Examples》,arXiv:1412.6572 | 学术事实引用 | 引用出处 | 否 | 页面内为自制小模型重现,不使用原论文图片 |
| 图灵 1950《计算机器与智能》、模仿游戏 | ask、truth 任务 | Turing, A. M. (1950). Computing Machinery and Intelligence. Mind 59(236) | 公有历史事实 | 引用出处 | 否 | — |
| 真假判断题中的历史常识(牛顿 1687《原理》、「人工智能」一词 1956、菲尔兹奖 2006、爱因斯坦 1905 等) | truth 任务 | 公认史实,本项目编写题面 | 公有历史事实 | 无 | 否 | — |
| 任务内训练数据(猫/熊猫像素、注意力示例句、写作示例语料、扫地机器人奖励设定等) | cat / panda / attn / write / robot / scale 等 | 本项目手工编写,浏览器本地运行 | 原创 | 无 | 否 | — |
| **九、宣传片** | | | | | | |
| 101 秒宣传片 | 宣传 | 逐帧录制本站画面 + 程序合成音效,无音乐、无口播 | 原创 | 无 | 含 fg_sofa 画面时为 AI 生成内容 | 含该画面的片段同样标「画面含 AI 生成内容」 |

## 自查(2026-10-24)

- 页面里每个外部素材都在台账里:线上目录仅 fg_sofa.webp 一个图片文件,无音频、字体、3D 模型文件;vendor/ 全部列出。
- 零外部请求:大厅与 10 个任务页加载时零外部请求(Three.js 随站自带,无 CDN 字体/统计)。**唯一例外**是接入巨人页:用户主动点击「离线巨人」才从 CDN/ModelScope 下载库与模型,或用户填入自己的钥匙后直连服务商。
- AI 标注:3 处(大厅右下角可见角标、图片 alt、探索笔记页说明)。
