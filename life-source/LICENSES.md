# 生命源码 Life Source · 素材与 AI 标注台账(1.0 规范版)

> 依据:总指挥《1.0 素材台账规范》(2026-10-24)。线上 /life-source/LICENSES.md 与 OneDrive「04_生命源码 Life Source/开发文档/LICENSES.md」各一份。更新于 2026-10-24(v0.9.3.1)。
> 页面统一 AI 标注:每页页脚(首页 + 5 个任务页,ls.js `chrome()` 生成)以「部分插图由 AI 生成」开头;手机窄屏页脚省略号截断时该句仍可见。

## 一、图片与贴图
| 素材 | 用在哪(任务/页面) | 来源与链接 | 许可 | 署名要求 | 是否 AI 生成 | 页面标注位置 |
|---|---|---|---|---|---|---|
| img/atlas-tree.webp 全息生命之树 | 首页图谱中心 | 本项目原创;Hark 图像生成工具,2026-10-21,原创提示词;原图 mockups/v07/atlas_tree.png | 自制(商用前复核工具条款) | 无 | 是 | 首页页脚「部分插图由 AI 生成」 |
| img/g-cas.webp 卡丝 Cas 头像 | 首页向导、dna | Hark 图像生成工具,2026-10-19,由定稿设定图 mockups/01_guides_raw.png 裁切 | 自制(同上) | 无 | 是 | 首页/dna 页脚 |
| img/g-epi.webp 艾比 Epi 头像 | 首页向导、parents | 同上 | 自制(同上) | 无 | 是 | 首页/parents 页脚 |
| img/g-adna.webp 阿古 aDNA 头像 | 首页向导、zebra | 同上 | 自制(同上) | 无 | 是 | 首页/zebra 页脚 |
| img/g-phage.webp 菲吉 Phage 头像 | 首页向导、virus | 同上 | 自制(同上) | 无 | 是 | 首页/virus 页脚 |
| img/g-edna.webp 伊蒂 eDNA 头像 | 首页向导、wolf | 同上 | 自制(同上) | 无 | 是 | 首页/wolf 页脚 |
| img/intro1–3.webp 写实开场三幕 | **现未引用**(v0.9.3 开场换回 v0.4 粒子版);仅 SW 预缓存,留作回退 | Hark 图像生成工具,2026-10-21 | 自制(同上) | 无 | 是 | 不显示;如恢复使用沿用页脚标注 |
| 全息实验台框体、dna 标本台、virus 教室沙盘、图谱星点与星桥、指纹/细胞切片/染色质/核小体/碱基对、开场粒子与双螺旋、红细胞示意 SVG、图标 | v0.9 全息实验台全部任务页、首页、开场 | 程序实时绘制(Canvas 2D / WebGL / 内联 SVG),本项目代码 | 自制 | 无 | 否 | — |

## 二、3D 模型
| 素材 | 用在哪 | 来源与链接 | 许可 | 署名要求 | 是否 AI 生成 | 页面标注位置 |
|---|---|---|---|---|---|---|
| 双螺旋、一镜到底、全息标本几何体 | 首页一镜到底、dna/virus 标本台 | 代码程序生成(Three.js 几何体),无外部模型文件 | 自制 | 无 | 否 | — |

## 三、音效与音乐
| 素材 | 用在哪 | 来源与链接 | 许可 | 署名要求 | 是否 AI 生成 | 页面标注位置 |
|---|---|---|---|---|---|---|
| audio/bgm.m4a 背景音乐「生命源码」 | 全站(默认关) | 纯程序合成,源码 _dev/audio/synth.py(工程 zip);旋律种子 = 人类 HBB 基因公开参考序列片段 | 自制 | 无 | 否 | — |
| audio/intro.m4a 开场配乐 | 首页开场门屏 | 纯程序合成,源码 _dev/audio/intro_synth.py(工程 zip) | 自制 | 无 | 否 | — |
| 交互音效(点亮、通关、提示等) | 全站(默认关) | Web Audio 实时合成,本项目代码 | 自制 | 无 | 否 | — |

## 四、语音 / 配音
| 素材 | 用在哪 | 来源与链接 | 许可 | 署名要求 | 是否 AI 生成 | 页面标注位置 |
|---|---|---|---|---|---|---|
| 无 | — | 本世界不含语音或 TTS | — | — | — | — |

## 五、字体
| 素材 | 用在哪 | 来源与链接 | 许可 | 署名要求 | 是否 AI 生成 | 页面标注位置 |
|---|---|---|---|---|---|---|
| 系统字体栈 PingFang SC / Noto Sans SC / Microsoft YaHei / system-ui;等宽 ui-monospace | 全站 | 调用访问者设备自带字体,不打包、不下载 | 不分发,无需许可 | 无 | 否 | — |

## 六、第三方库
| 素材 | 用在哪 | 来源与链接 | 许可 | 署名要求 | 是否 AI 生成 | 页面标注位置 |
|---|---|---|---|---|---|---|
| three.js r169(vendor/three.module.min.js) | WebGL 开场、一镜到底、全息标本台 | https://github.com/mrdoob/three.js | MIT | 保留版权声明:vendor/LICENSE-three.txt | 否 | — |
| three.js r186(vendor/r186/three.module.min.js) | 2.0 起全站默认 | https://github.com/mrdoob/three.js | MIT | vendor/r186/LICENSE-three.txt | 否 | — |
| three.js r186 MarchingCubes addon(vendor/r186/addons/MarchingCubes.js) | recode 改码·玻璃细胞:细胞体元球融合/分裂 | 官方示例 https://threejs.org/examples/webgl_marchingcubes.html ;源码 examples/jsm/objects/MarchingCubes.js | MIT | 文件头保留出处;仅改 import 一行 | 否 | — |
| pmndrs/drei MeshTransmissionMaterial(思路与着色器改写) | recode/glass.js:细胞膜、细胞核玻璃透射(缓冲折射取样、RGB 色散、噪声模糊) | https://drei.docs.pmnd.rs/shaders/mesh-transmission-material ;https://github.com/pmndrs/drei src/core/MeshTransmissionMaterial.tsx | MIT(© Poimandres) | 文件头注明出处;未打包 drei/React | 否 | — |
| React Bits「Iridescence」(着色器改写) | recode/glass.js:细胞膜表面虹彩 | https://reactbits.dev ;https://github.com/DavidHDev/react-bits | MIT + Commons Clause(非商用,本站免费科普) | 文件头注明出处;未打包 React | 否 | — |

## 七、数据来源(事实数据,只作科普示意引用)
| 素材 | 用在哪 | 来源与链接 | 许可 | 署名要求 | 是否 AI 生成 | 页面标注位置 |
|---|---|---|---|---|---|---|
| 人类 β-珠蛋白(HBB)编码区序列 | dna;BGM 旋律种子 | NCBI 公开参考序列 https://www.ncbi.nlm.nih.gov/gene/3043 | 事实数据,无版权 | 无 | 否 | 页面标「示意」 |
| 孟德尔豌豆数据(圆粒 5474 / 皱粒 1850) | parents | Mendel, 1866 | 公有领域 | 注明出处 | 否 | — |
| ABCC11 与耳垢类型 | parents | Yoshiura et al., 2006, Nature Genetics | 事实引用 | 注明出处 | 否 | — |
| 卷舌同卵双胞胎研究;耳垂相关位点 | parents 辟谣关 | Matlock, 1952;Shaffer et al., 2017 | 事实引用 | 注明出处 | 否 | — |
| 马蝇与条纹外套实验 | zebra | Caro et al., 2019, PLOS ONE | 事实引用 | 注明出处 | 否 | — |
| 斑驴古 DNA | zebra | Higuchi et al., 1984, Nature | 事实引用 | 注明出处 | 否 | — |
| 黄石狼放归(1995–1997 年 41 只)与营养级联争论 | wolf | 美国国家公园管理局公开资料;Ripple & Beschta;Hobbs、Middleton 等 | 事实引用,未引入机构图片/标志 | 注明出处 | 否 | — |
| 鼻病毒型别、R₀ 示意参数 | virus | 公开文献综述 | 事实引用 | 注明出处 | 否 | 页面标「示意参数」 |
| 绿色荧光蛋白晶体结构 PDB 1EMA(Cα 骨架精简,recode/gfp-ca.js) | recode 改码·玻璃细胞 | RCSB PDB https://www.rcsb.org/structure/1EMA ;Ormö M, Cubitt AB, Kallio K, Gross LA, Tsien RY, Remington SJ. Crystal structure of the Aequorea victoria green fluorescent protein. Science 1996;273:1392–1395 | PDB 数据 CC0 公有领域;论文事实引用 | 注明 PDB ID 与论文 | 否 | 页面面板「结构:RCSB PDB 1EMA」 |
| GFP 野生型第 64–68 位密码子(TTC TCT TAT GGT GTT) | recode | Prasher DC 等, Gene 1992;111:229–233(gfp cDNA) | 事实数据 | 注明出处 | 否 | — |
| Y66H 蓝色荧光(发射约 448 nm)、GFP 发射约 509 nm | recode | Heim R, Prasher DC, Tsien RY. PNAS 1994;91:12501–12504;Tsien RY. Annu Rev Biochem 1998;67:509–544 | 事实引用 | 注明出处 | 否 | 页面「颜色为发射峰示意」 |

## 自查(2026-11-17 · v0.13 recode)
- 新增 recode/(index.html、r3d.js、glass.js、gfp-ca.js)与 vendor/r186/addons/MarchingCubes.js:全部程序生成,无图片/模型/音频/字体文件;运行时零外部请求(1EMA 已离线精简为本地数据)。
- 1EMA 为 S65T 变体晶体结构,主链折叠与野生型一致;页面只用 Cα 骨架示意,序列与突变讲解按野生型。

## 自查(2026-10-24)
- 页面引用的图片 8 张(atlas-tree + 五灵头像 5 + 未引用 intro 3 张在目录)、音频 2 个、库 1 个,全部在册;无第三方图片、模型、音频、字体文件。
- 零外部请求:代码中唯一 URL 为 SVG 命名空间 http://www.w3.org/2000/svg(非网络请求);无 CDN、统计、埋点、账号。
- AI 标注:6 页(首页 + dna/parents/zebra/virus/wolf)页脚「部分插图由 AI 生成」。
- 科学内容 2026-10-19/20 已完成 AI 科学复核(科学复核_v0.1 / v0.2_M2),仍建议生物老师复核。
- 商用前复核 AI 图像生成工具的服务条款;如有变化,替换为程序绘制版本(代码已保留程序回退)。
