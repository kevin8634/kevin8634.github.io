# 天枢 Starhelm · 素材与 AI 标注台账(LICENSES)

> 创世计划 Genesis 07 · 天文。按《1.0 素材台账规范》(总指挥 2026-10-24)编制,版本 v1.0-M4d,2026-10-25(按总审 2026-10-25 第二节 07 补齐)。
> 线上 `/starhelm/LICENSES.md` 与云盘「07_天枢 Starhelm/开发文档/LICENSES.md」同内容。详细下载记录、构建脚本与修改说明见 `docs/DATA-SOURCES.md`。
> 统一声明:不使用任何机构 logo;界面注明「不代表任何机构背书」。CC BY / CC BY-SA 素材的修改(缩放、裁切、格式转换、着色、补极区)均在本台账与 DATA-SOURCES.md 记录。
> 页面静态资源全部自托管(无 CDN、无外链字体/脚本/图片);下表「实时」项为功能所需的公开数据接口,不上传用户信息。**首页地球视图的空间站、地震、星链图层默认开启,加载即请求 CelesTrak / USGS**(2 小时本机缓存);其余实时项只在对应功能打开时请求。

## 一、图片与贴图

| 素材 | 用在哪(任务/页面) | 来源与链接 | 许可 | 署名要求 | 是否 AI 生成 | 页面标注位置 |
|---|---|---|---|---|---|---|
| 地球日面/夜灯/云层/高光贴图(tex-earth.p*.js、hd/earth-*-4k.jpg) | 星域 I 地球、全部地球类任务 | NASA Blue Marble / Black Marble(经 Solar System Scope 纹理) https://www.solarsystemscope.com/textures/ | NASA 公有领域 / CC BY 4.0 | Solar System Scope;不暗示 NASA 背书 | 否 | 页脚「纹理 NASA、Solar System Scope」 |
| 行星/太阳/月球/土星环贴图(tex-planets.p*.js、hd/*-4k.jpg、hd/saturn-ring.png、hd/moon-4k.jpg) | 星域 II–IV 行星、月球、太阳 | Solar System Scope https://www.solarsystemscope.com/textures/(经 Wikimedia Commons) | CC BY 4.0 | Solar System Scope | 否 | 页脚 |
| 妊神星/鸟神星/阋神星贴图(tex-planets 内) | 星域 IV 矮行星 | Solar System Scope(无探测器实拍,艺术化纹理) | CC BY 4.0 | Solar System Scope | 否(非 AI,属想象图) | 此刻卡「外观:想象图」 |
| 冥王星 hd/pluto-2k.jpg | 星域 IV 冥王星 | NASA/JHUAPL/SwRI New Horizons Global Color Map | NASA 公开素材 | NASA/JHUAPL/SwRI | 否 | 页脚/此刻卡 |
| 谷神星 hd/ceres-1k.jpg | 星域 IV 谷神星 | NASA/JPL-Caltech/UCLA/MPS/DLR/IDA Dawn 镶嵌(USGS) | 公有领域 | NASA/JPL-Caltech/UCLA/MPS/DLR/IDA | 否 | 页脚 |
| 木卫一 hd/moons/io | 星域 III 木星卫星 | NASA/JPL/USGS PIA00319 | 公有领域 | NASA/JPL/USGS | 否 | 页脚「卫星贴图」 |
| 木卫二 hd/moons/europa | 同上 | NASA/JPL Voyager 镶嵌(Commons) | 公有领域(已着色) | NASA/JPL | 否 | 页脚 |
| 木卫三 hd/moons/ganymede | 同上 | NASA 原始影像 / Björn Jónsson 制图,File:Map of Ganymede by Björn Jónsson.jpg(Commons);作者页 https://bjj.mmedia.is/acknow.html | Commons {{Attribution}}:作者声明公开可用、无需特别许可,注明出处即可(未限非商业) | NASA / Björn Jónsson | 否 | 页脚「木卫三 NASA/Björn Jónsson」 |
| 木卫四 hd/moons/callisto | 同上 | USGS 赤道镶嵌(Commons) | 公有领域(已着色、补极区) | USGS | 否 | 页脚 |
| 土卫六 hd/moons/titan | 星域 III 土星卫星 | NASA/JPL-Caltech/Univ. Arizona PIA22770 | 公有领域(已着色) | NASA/JPL-Caltech/Univ. Arizona | 否 | 页脚 |
| 背景星空 sky-4k.jpg / sky-8k.jpg、tex-sky.p*.js | 全部 3D 场景背景 | NASA SVS Deep Star Maps 2020 https://svs.gsfc.nasa.gov/4851(Gaia/Hipparcos/Tycho-2) | NASA 媒体,教育免费使用 | NASA/Goddard SVS | 否 | 页脚 |
| 太阳 sun-vis / sun-171 / sun-304(arc/) | 星档馆、太阳观测台 | NASA SDO https://sdo.gsfc.nasa.gov/ | NASA 图像,署名使用 | NASA/SDO 及 HMI/AIA 科学团队 | 否 | 展品逐件署名 |
| 蓝色弹珠 arc/earth | 星档馆 | NASA AS17-148-22727 | 公有领域 | NASA | 否 | 展品署名 |
| 暗淡蓝点 arc/pbd | 星档馆 | NASA/JPL PIA23645 | 公有领域 | NASA/JPL-Caltech | 否 | 展品署名 |
| 木星 arc/jupiter | 星档馆 | ESA/Hubble heic2017a | CC BY 4.0 | NASA, ESA, A. Simon, M. H. Wong, OPAL | 否 | 展品署名 |
| 创生之柱 可见/近红外/中红外(arc/pillars-*、sv-pillars.jpg) | 星档馆、航行页星域 V | ESA/Hubble heic1501a;ESA/Webb weic2216a、weic2218a | CC BY 4.0 | NASA, ESA, CSA, STScI 等 | 否 | 展品署名、航行页角注 |
| 蟹状星云 可见/红外/X 射线(arc/crab-*) | 星档馆 | ESA/Hubble heic0515a;ESA/Webb weic2326a;Chandra NASA/CXC/SAO | CC BY 4.0 / NASA 署名使用 | 见展品 | 否 | 展品署名 |
| 宇宙悬崖 arc/cliffs、sv-cliffs.jpg | 星档馆、航行页 | ESA/Webb weic2205a | CC BY 4.0 | NASA, ESA, CSA, STScI | 否 | 展品署名、航行页角注 |
| 韦布第一深场 arc/deep、sv-deepfield.jpg | 星档馆、航行页星域 VII | ESA/Webb weic2209a | CC BY 4.0 | NASA, ESA, CSA, STScI | 否 | 展品署名、航行页角注 |
| M87* 黑洞 arc/m87 | 星档馆 | ESO eso1907a | CC BY 4.0 | EHT Collaboration | 否 | 展品署名 |
| 满月 arc/moon | 天枢天文台 | Gregory H. Revera(Commons) | CC BY-SA 3.0 | Gregory H. Revera | 否 | 目镜卡署名 |
| 地出 arc/earthrise | 天文台 | NASA / Bill Anders | 公有领域 | NASA | 否 | 目镜卡署名 |
| 水星/金星/土星/木卫一/木卫二/冥王星(arc/) | 天文台 | NASA/JHUAPL/Carnegie;NASA(R. Nunes 处理);NASA/JPL/SSI;NASA/JPL/U. Arizona;NASA/JPL/DLR;NASA/JHUAPL/SwRI | 公有领域 | 见目镜卡 | 否 | 目镜卡署名 |
| 天王星 arc/uranus | 天文台 | NASA/JPL,色彩校准 Ardenau4 | CC0 | 可选 | 否 | 目镜卡署名 |
| 海王星 arc/neptune | 天文台 | NASA/JPL/Voyager-ISS,处理 Aster Cowart | 公有领域 | 见目镜卡 | 否 | 目镜卡署名 |
| 火星 arc/mars | 天文台 | ESA & MPS for OSIRIS Team | CC BY-SA 3.0 IGO | ESA & MPS for OSIRIS Team | 否 | 目镜卡署名 |
| 67P 彗星 arc/c67p | 天文台 | ESA/Rosetta/NAVCAM | CC BY-SA 3.0 IGO | ESA/Rosetta/NAVCAM | 否 | 目镜卡署名 |
| N159 恒星摇篮 arc/n159 | 天文台 | ESA/Webb(2026-10-22 发布) | CC BY 4.0 | ESA/Webb, NASA & CSA, E. Sabbi, M. Zamani;致谢 M. H. Özsaraç | 否 | 目镜卡署名 |
| 驾驶舱 ck25.webp / ck25d.jpg(深度图) | 航行页驾驶舱 2.5D | 天枢原创设计图(AI 图像生成工具出图 + 本项目重绘;深度图 MiDaS 离线生成) | 本项目自有 | — | **是**(AI 辅助生成) | 航行页角注「天枢原创设计图(AI 辅助生成)」 |
| 星璃全息像 xl25.webp / xl25b.webp | 航行页向导形象 | 天枢原创设计图(AI 图像生成工具出图;isnet-anime 离线抠像) | 本项目自有 | — | **是**(AI 辅助生成) | 同上 |
| 弦穹号外观 ship25.webp / ship25a.jpg | 航行页舷窗/出舱 | 天枢原创设计图(AI 图像生成工具出图) | 本项目自有 | — | **是**(AI 辅助生成) | 同上 |
| 指令台 hub25.webp | 航行页指令台 | 天枢原创设计图(AI 图像生成工具出图) | 本项目自有 | — | **是**(AI 辅助生成) | 同上 |
| 应用图标 icon-180/192/512.png | 安装图标 | 本项目程序绘制 | 本项目自有 | — | 否 | 不适用 |
| 守星人徽记、星域光壳、银河/宇宙网/日球层/彗尾/恒星特写等 3D 效果 | 全站 | 本项目程序生成(着色器/粒子) | 本项目自有 | — | 否 | 示意项在画面注「示意」 |

## 二、3D 模型

| 素材 | 用在哪 | 来源与链接 | 许可 | 署名要求 | 是否 AI 生成 | 页面标注位置 |
|---|---|---|---|---|---|---|
| ISS 模型(iss-model.p*.js) | sh.orbit、卫星图层 | NASA 3D Resources「International Space Station (ISS) (B)」 https://nasa3d.arc.nasa.gov/ | NASA 公开资料 | NASA | 否 | 页脚 |
| 卫星/轨道器/探测器模型(sh-satmodels.js、sh-orbmodels.js) | 卫星星海、星域 IV 探测器 | 本项目程序建模 | 本项目自有 | — | 否 | 不适用 |
| 哈雷彗核 | 星域 IV | 程序建模,依据 ESA 乔托号 1986 实拍参数 | 本项目自有 | — | 否 | 此刻卡 |

## 三、音效与音乐、语音

| 素材 | 用在哪 | 来源 | 许可 | 署名要求 | 是否 AI 生成 | 页面标注位置 |
|---|---|---|---|---|---|---|
| 界面音效 audio/*.m4a(click/open/arrive/whoosh/sector-1…8 等 25 个) | 全站(默认关) | `audio/synth.py` numpy+scipy 纯程序合成,无采样/音色库 | 本项目原创 | — | 否 | 不适用 |
| 背景音乐 audio/music-starhelm-loop.m4a | 全站(默认关) | 同上,程序合成 | 本项目原创 | — | 否 | 不适用 |
| 实时嗡鸣/音高映射 | 航行、sh.where、sh.orbit | Web Audio 实时合成(le-audio.js) | 本项目原创 | — | 否 | 不适用 |
| 语音/配音 | — | **无**(全站无配音、无 TTS) | — | — | — | — |

## 四、字体

| 素材 | 用在哪 | 来源 | 许可 | 署名要求 | 是否 AI 生成 | 页面标注位置 |
|---|---|---|---|---|---|---|
| Orbitron、Rajdhani(le-fonts.css base64 内嵌) | HUD 英文/数字 | Google Fonts https://fonts.google.com/ | SIL OFL 1.1(Copyright 2018 The Orbitron Project Authors;Copyright (c) 2014 Indian Type Foundry) | 随站分发 OFL 全文与版权行:starhelm/OFL.txt | 否 | 不适用 |
| 中文 | 全站 | 系统字体(不分发) | — | — | 否 | 不适用 |

## 五、第三方库

| 素材 | 用在哪 | 来源 | 许可 | 署名要求 | 是否 AI 生成 | 页面标注位置 |
|---|---|---|---|---|---|---|
| three.js 0.169.0 + OrbitControls + GLTFLoader(vendor/three-r169/) | 全部 3D(WebGL2) | https://github.com/mrdoob/three.js | MIT | 保留 LICENSE(vendor/three-r169/LICENSE) | 否 | 不适用 |
| three.js 0.147(three.min.p*.js、OrbitControls.js、GLTFLoader.p*.js) | WebGL1 降级 | 同上 | MIT | 保留版权声明 | 否 | 不适用 |
| astronomy-engine 2.1.19(vendor/astronomy-engine/) | 月相、日月距离、日月食、今晚星空 | https://github.com/cosinekitty/astronomy | MIT | 保留 LICENSE | 否 | 不适用 |
| satellite.js 6.0.2(satellite.min.js) | SGP4 轨道推算 | https://github.com/shashwatak/satellite-js | MIT(Copyright (C) 2013 Shashwat Kandadai, UCSC Jack Baskin School of Engineering) | 许可全文 vendor/satellite.LICENSE | 否 | 不适用 |
| MiDaS v2.1 small、isnet-anime | 仅离线制作深度图/抠像,不随网页分发 | isl-org/MiDaS;SkyTNT anime-segmentation | MIT / Apache-2.0 | — | 否 | 不适用 |

## 六、数据来源

| 素材 | 用在哪 | 来源与链接 | 许可 | 署名要求 | 是否 AI 生成 | 页面标注位置 |
|---|---|---|---|---|---|---|
| 地震(实时 + 一年快照) | sh.quakes、地震图层 | USGS https://earthquake.usgs.gov/ | 美国政府公有领域 | USGS | 否 | 页脚、实验室 |
| 板块边界 PB2002 | sh.quakes | Bird (2003);Ahlenius/Nordpil 数字化 | ODC-By 1.0 | 须署名 | 否 | 实验室注 |
| 卫星/空间站轨道根数、SATCAT | sh.sats、sh.orbit、图层 | CelesTrak https://celestrak.org/ | 免费公开,注明来源 | CelesTrak | 否 | 页脚 |
| 行星近似轨道 | 星域 III | JPL Approximate Positions of the Planets | NASA/JPL 公开 | JPL | 否 | 页脚 |
| 探测器星历快照(旅行者/新视野/先驱者) | 星域 IV、sh.voyager | NASA/JPL Horizons https://ssd.jpl.nasa.gov/horizons/ | 美国政府公开数据 | NASA/JPL Horizons | 否 | 此刻卡 |
| 哈雷彗星根数 | sh.comet | NASA/JPL Small-Body Database | 公开数据 | JPL | 否 | 此刻卡 |
| 恒星场 sh-stars-data.js | 星域 V、sh.starlight/constel | HYG 恒星库 v4.1(David Nash / astronexus) https://github.com/astronexus/HYG-Database | CC BY-SA 4.0(派生文件同许可) | HYG v4.1(CC BY-SA 4.0) | 否 | 星域 V 角注、此刻卡 |
| 系外行星宿主与统计 | 星域 V、sh.exoearth | NASA Exoplanet Archive https://exoplanetarchive.ipac.caltech.edu/ | 公开数据 | NASA 系外行星档案(致谢语) | 否 | 实验室注 |
| 太阳 X 射线、太阳风、黑子、极光 OVATION、Kp | sh.sun、sh.aurora、太阳风图层(实时) | NOAA SWPC https://www.swpc.noaa.gov/ | 美国政府公有领域 | NOAA SWPC | 否 | 页脚、观测台 |
| 太阳最新实拍(实时 img) | 太阳观测台 | NASA SDO | NASA 署名使用 | NASA/SDO | 否 | 观测台图注 |
| 台风事件(实时) | 地球之眼 | GDACS https://www.gdacs.org/ | 公开数据 | GDACS | 否 | 页脚、卡片 |
| 卫星云图(实时) | 地球之眼 | NASA GIBS(Himawari-9:日本气象厅;GOES:NOAA;VIIRS) | NASA EOSDIS 开放使用 | 须署名 | 否 | 页脚、画面角标 |
| 城市库 cities-lite | 位置选择 | GeoNames https://www.geonames.org/ | CC BY 4.0 | GeoNames | 否 | 页脚 |
| 在线地名兜底(实时) | 位置搜索 | Open-Meteo Geocoding | 免费接口仅限非商业(商业化前须付费或替换,待王磊决定);数据 CC BY 4.0 | Open-Meteo(CC BY 4.0) | 否 | 首页页脚「地名搜索 Open-Meteo(CC BY 4.0)」 |
| 星链 TLE 快照 starlink-lite.p1–p5.js | 星链图层离线兜底 | CelesTrak GP(Starlink) | 免费公开,注明来源 | CelesTrak | 否 | 页脚 |
| 地震兜底快照 quakes-fallback.js | 地震图层离线兜底 | USGS Earthquake Hazards Program | 美国政府公有领域 | USGS | 否 | 页脚 |
| 地震与板块快照 sh-quakes-data.js | sh.quakes | USGS(公有领域)+ PB2002(Bird 2003;Ahlenius/Nordpil 数字化) | 公有领域 / ODC-By 1.0 | USGS;PB2002 署名 | 否 | 页脚、实验室注 |
| 卫星轨道快照 sh-sats-data.js | sh.sats | CelesTrak GP 活跃卫星 + SATCAT | 免费公开,注明来源 | CelesTrak | 否 | 页脚 |
| 探测器坐标快照 sh-probes-data.js | 星域 IV、sh.voyager | NASA/JPL Horizons(2026-10-23 下载) | 美国政府公开数据 | NASA/JPL Horizons | 否 | 此刻卡 |
| 导航/气象卫星轨道快照 sh-orbits-data.js | sh.orbit、轨道模型 | CelesTrak GP OMM(历元约 2026-10-17) | 免费公开,注明来源 | CelesTrak | 否 | 页脚 |
| 行星轨道根数 planets-data.js | 太阳系视图 | JPL「Approximate Positions of the Planets」Table 1 | NASA/JPL 公开 | JPL | 否 | 页脚 |
| 航线示意数据 le-flights.js | 航线图层 | 自建 39 机场坐标与示意航线 | 本项目自有 | — | 否 | 「航线示意,非实时航班」 |
| 月相、日月位置、潮汐、日月食 | 星域 I–II 各任务 | astronomy-engine 本机计算 + 自有公式 | 自有实现 | — | 否 | 不适用 |
| 航线 | 航线图层 | 自建 39 机场坐标 | 本项目自有 | — | 否 | 「航线示意,非实时航班」 |

## 自查(2026-10-24;2026-10-25 按总审补:satellite.LICENSE、OFL.txt、Open-Meteo 页脚署名、木卫三许可、航行页角注补「指令台」、快照文件入表、实时图层默认开启如实写明)
- 页面引用的 `arc/`、`hd/`、`audio/`、根目录图片、贴图分片、模型分片、字体、库均已入表。
- 零外部静态请求:无 CDN、无外链字体与脚本;实时数据接口见上表;首页地球视图默认开启空间站/地震/星链图层,加载即请求 CelesTrak/USGS(是否改为默认关待王磊决定)。
- AI 生成内容:4 组(驾驶舱、星璃、弦穹号、指令台),页面可见标注 2 处(航行页角注、首页页脚)。
