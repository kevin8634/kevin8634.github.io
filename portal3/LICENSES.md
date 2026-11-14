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
