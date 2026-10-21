# 生命源码 Life Source · 第三方素材与许可台账

| 素材 | 版本 | 许可 | 用途 | 位置 | 来源 |
|---|---|---|---|---|---|
| three.js | r169 | MIT(见 vendor/LICENSE-three.txt) | WebGL 渲染(双螺旋、一镜到底) | vendor/three.module.min.js | https://github.com/mrdoob/three.js |

- 除下文「AI 生成原创图像」一节所列图片外,其余图形(指纹、细胞切片、荧光染色质、核小体、双螺旋、碱基对原子模型、开场粒子、图谱星点与连线)均为程序实时生成;无第三方图片、字体、音频。
- 声音全部由 Web Audio 程序合成,默认关闭。
- 本世界不发起任何外部网络请求,不使用 CDN、统计、埋点或账号。
- 科学数据出处:人类 β-珠蛋白(HBB)编码区序列;孟德尔 1866 年豌豆数据(圆粒 5474 / 皱粒 1850);ABCC11 与耳垢类型(Yoshiura et al., 2006);卷舌同卵双胞胎研究(Matlock, 1952);耳垂相关位点(Shaffer et al., 2017)。马蝇条纹外套实验(Caro et al., 2019, PLOS ONE);斑驴古 DNA(Higuchi et al., 1984, Nature);黄石狼放归(美国国家公园管理局,1995–1997 年 41 只)与营养级联争论(Ripple & Beschta;Hobbs、Middleton 等);鼻病毒型别与普通感冒病原。2026-10-19 已完成 AI 科学复核(docs/科学复核_v0.1.md),示意序列与模拟参数均已在页面标注「示意」。


## 原创音频
- 背景音乐「生命源码」(audio/bgm.m4a)、开场配乐(audio/intro.m4a,源码 _dev/audio/intro_synth.py)与全部音效:纯程序合成原创,无采样、无第三方素材;源码 _dev/audio/synth.py(不上线,工程 zip 内),旋律种子为人类 HBB 基因公开参考序列片段(事实数据,无版权)。

## AI 生成原创图像(v0.7.1 起)
| 文件 | 内容 | 用途 | 生成 | 备注 |
|---|---|---|---|---|
| img/intro1.webp | 细胞分裂(示意) | 开场第 1 幕 | 2026-10-21,Hark 图像生成工具,本项目原创提示词 | 无文字、无第三方商标;艺术化示意,非显微照片 |
| img/intro2.webp | DNA 双螺旋解旋(示意) | 开场第 2 幕 | 同上 | 艺术化示意,碱基颜色不代表真实配对 |
| img/intro3.webp | DNA 长成生命之树 | 开场第 3 幕 | 同上 | 系列图腾 |
| img/atlas-tree.webp | 全息生命之树 | 图谱中心 | 同上 | 原图 mockups/v07/atlas_tree.png |
| img/g-cas/epi/adna/phage/edna.webp | 源码五灵头像 | 向导气泡 | 2026-10-19 Hark 图像生成工具,本项目原创提示词;由已定稿设定图裁切 | 无文字、无第三方商标;原图 mockups/01_guides_raw.png |
- 商用前复核所用生成工具的服务条款;如条款有变,替换为程序绘制版本(代码中已保留回退)。
