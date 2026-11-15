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
