# 门户 3.0（portal3/）第三方与致谢

## 代码依赖
- **three.js r186**（MIT，© 2010-2025 three.js authors）——复用仓库内 `ludoterra/vendor/r186/three.module.min.js`，许可全文见 `ludoterra/vendor/r186/LICENSE-three.txt`。

## 思路致谢（代码为本项目自写，未复制源码）
- **Stonehenge Solstice**（MeltTheManual，MIT，https://github.com/MeltTheManual/stonehenge-solstice）——fps 调速器思路：预热后按秒统计帧率，先降像素、后降画质，稳定后缓慢回升。
- **AgX 色调映射多项式拟合**（Blender AgX / Google Filament，Apache-2.0；three.js MIT 实现中同一组常数）——`p3hero.js` 合成通道里的 AgX 曲线。
- **Bloom 13-tap 降采样 + 3×3 tent 升采样**——Jorge Jimenez《Next Generation Post Processing in Call of Duty: Advanced Warfare》（SIGGRAPH 2014 公开讲座）中的公开技术。
- 画质分档（像素预算开方算像素比、按 GPU 名猜档）、HDR 半浮点渲染目标、分离色调/暗角/颗粒的合成顺序：参考项目内部《画质专长包 v4》笔记，只学思路。

## 素材
- `hero-c2.webp` / `hero-c2-768.webp`：创世计划 3.0 概念图 c2（项目自有，AI 生成），作为 WebGL 不可用/减少动态时的后备底图。

## p3intro.js（开场动画，11-15）
- 同样复用本地 three.js r186（MIT）；低档不加载 three，纯 2D canvas。
- 合成通道 ACES（Stephen Hill 拟合）与 AgX 多项式为业界公开常数（three.js MIT 实现中同一组数值）；bloom 为 Karis 加权降采样 + tent 升采样的公开技术；分档与像素预算思路同上，来自《画质专长包 v4》笔记。
- 字体只用系统字体（等宽 / Arial Black 等），不打包任何字体文件；画面全部程序化生成，无外部模型或图片。

## p3hero.js 阶段 2a（首页造物晶柱 + 七色光桥汇星，11-15）
- 仍只用本地 three.js r186（MIT）：`MeshPhysicalMaterial`（transmission / ior / dispersion / iridescence / thickness）、`PMREMGenerator`、`TubeGeometry`、`CatmullRomCurve3` 等官方 API。
- 晶柱切面、光桥螺旋、菲涅尔假玻璃（程序环境反射 + 伪折射 + 薄膜虹彩近似 + 重心坐标描边）、镜面水台（整组 y 翻转再画一遍 + 半透明暗水渐隐）、星云/行星背景：全部本项目自写，程序生成，无外部模型或贴图。
- 画质规范参考项目内部《画质专长包 v4》笔记（只学思路，未复制其 snippets 代码）：克制后期（bloom 低混合量、暗角作为色调映射前的曝光乘子、颗粒约 0.012）、细线像素下限（光带宽度夹到约 1.3px 以上，亮度按真宽/夹宽缩）、首帧优先（进循环前 `renderer.compile`）、HDR 半浮点 + AgX/ACES 混合。专长包中涉及的第三方作品的致谢以其 `THIRD_PARTY_NOTICES.md` 为准；本文件引用的公开技术：
  - Bloom 13-tap 降采样 + tent 升采样（Jorge Jimenez, SIGGRAPH 2014）；
  - AgX 多项式拟合（Blender AgX / Google Filament，Apache-2.0；three.js MIT 实现中的同一组常数）；
  - 无状态粒子（位置 = f(编号, 时间)）与 fps 调速器思路（Stonehenge Solstice，MIT）。

## 阶段 2b（首页玻璃面板 + 底部 HUD，11-15）
- `hero-c3.webp`（1600×1000）/ `hero-c3-768.webp`（768×1366，竖屏）：本项目 `p3hero.js` 中档画面在 t=6s 的截帧（无界面层），作为低档 / 无 WebGL2 / 减少动态时的首页底图；取代 `hero-c2*.webp`（旧文件仍留在目录里，未再引用）。
- 「玩」面板缩略图复用根目录 `world-01..07.webp`（项目自有）；「造」三道门为内联 SVG 线稿，本项目自绘。玻璃面板全部是 CSS（backdrop-filter / 渐变描边），无外部字体或图标库。

## 首屏交互层（11-16 · p3menu.js / p3doors.js / p3splash.js / p3fx.js / p3ui.css）
以下组件**只借鉴公开演示的交互思路，代码全部为本项目自写的原生 JS/CSS/WebGL2**，未复制任何源码，不依赖 React、不走 CDN、零外部请求：
- **reactbits**（https://reactbits.dev ，David Haz，MIT + Commons Clause）——Infinite Menu（「玩」世界球：卡片贴球面、拖动惯性、吸附正中）、Splash Cursor（鼠标流体拖尾）、Rotating Text / Blur Text / Shiny Text（标题动效）、Magnet / Click Spark（按钮）。Commons Clause 限制的是出售其源码本身；本项目未分发其代码。
- **Aceternity UI**（https://ui.aceternity.com ）——3D Card Effect（倾斜视差）与 Glowing Effect（沿边框追随指针的流光），用于「造」三道门。
- **uiverse**（https://uiverse.io ，社区作品 MIT）——发光按钮的视觉思路。
- 流体算法：Jos Stam《Stable Fluids》（SIGGRAPH 1999）公开方法（半拉格朗日平流、Jacobi 压力投影、涡度增强）。
- 世界球卡面复用仓库内 `world-01..07.webp`、`orb-gn-2.0.webp`（项目自有）；回退网格同。

## 下滚叙事（11-16 · 第三步 · p3nar.js / p3ui.css / p3fp.js `climb`）
- **Aceternity UI「Sticky Scroll Reveal」**（https://ui.aceternity.com/components/sticky-scroll-reveal ）——只借「左侧文字随滚动逐段点亮、右侧画面随之切换」的交互思路；本项目改写为：左栏逐层文字 + 第一性原理之树的镜头沿树爬升并高亮当前层。代码全部为本项目自写的原生 JS/CSS（IntersectionObserver 定当前段、scroll + requestAnimationFrame 节流驱动镜头），未复制任何源码，不依赖 React / Framer Motion，不走 CDN，零外部请求。
- 排版节奏（编辑式大留白、等宽小眉题 + 大标题 + 短段落）参考 motionsites 一类编辑式站点的公开观感，只学节奏，无素材与代码引用。
- 叙事背景仍是实时渲染的树（three.js r186 本地，MIT），不使用任何图片或视频作背景。

## 首屏放大 + 镜头穿行（11-16 · 第四步 · index.html 首屏 / p3fp.js / p3nar.js / p3ui.css）
- **版式思路参考 MotionSites「Anchor AI Particle Tree Landing Page」**（https://motionsites.org/prompts/anchor-ai ）——仅依据其公开描述（粒子升起成树、树下暗色水面环形波纹、大号显示字体标题 + 两个按钮、下滚镜头穿过场景、玻璃卡片从镜头旁飘过、尾段半透明粒子结构在大标题后旋转配编号卡），**未抓取、未使用其代码或任何资源**。本项目自写：树根水面着色器（环形涟漪 + 镜像相机低分辨率倒影，低档光柱假倒影）、粒子升起成树、全宽玻璃卡 CSS 3D 穿行、第八颗星长成的星形八面体粒子晶体（不是立方体）。
- **思路参考 ThreeUI（仅公开描述）**——「Advanced Glass Material」：水面在 high 档加轻微折射 / 边缘色散与指针扰动涟漪；「Workshop Codex」：七层沿树干各放一枚发光水晶航标，镜头经过 / 当前层时点亮。均为本项目自写着色器与几何，未使用其代码或资源。
- 仍然零外部请求、不使用图片或视频作背景；three.js r186 为本地 vendor（MIT）。

## 教育理念署名（11-20 · 王磊批）
- 创世计划的教育理念参考埃隆·马斯克创办的 Ad Astra 学校（第一性原理、难题拆解）。只署名理念出处：全部课程、题目、交互与代码均为本项目自研；未使用其肖像、Logo 或商标；与 SpaceX 及其关联方无合作、授权或背书关系。

## p3bg.js（首屏背景丰富三层，11-25）
- 纯 DOM + 2D canvas，本项目自写，不用 three、不加 WebGL 上下文、零外部请求。
- 观感参考（只看公开演示的效果，未复制源码）：React Bits「Galaxy」（远景银河带慢转）、Aceternity UI「Stars Background」「Shooting Stars」（三层星点视差、流星）、React Bits「Aurora」（树两侧七色光雾）。
- `p3bg-still.webp`（1600×1000）/ `p3bg-still-p.webp`（800×1400，竖屏）：由 `p3bg.js` 的 `paintStill()` 在本地浏览器 2D canvas 程序化生成的静态底图，低档 / 减少动态 / 无 WebGL 时使用。
