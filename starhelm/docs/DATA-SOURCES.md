# 天枢 Starhelm · 数据与素材许可台账

> 创世计划 Genesis 07 · 天文 · 维护规则:新增数据源/素材先核对许可再接入;CC BY-NC 类商用前必须替换;云盘「07_天枢 Starhelm/开发文档」同步。最后更新 2026-10-21(M2c/M2d)。

| 数据/素材 | 来源 | 许可/条款 | 用法 | 备注 |
|---|---|---|---|---|
| 地震 | USGS Earthquake Hazards Program,`summary/2.5_week.geojson` | 美国政府公共领域 | 浏览器直连;`quakes-fallback.js` 离线兜底 | 页脚致谢 |
| 星链轨道 | CelesTrak GP,`GROUP=starlink&FORMAT=CSV`(OMM) | 免费;使用政策:约 2 小时更新一次,Starlink 组每次更新只许下载一次,超限返回 403 / 封 IP | `LE.netcache` 本机缓存 2 小时,失败 2 小时内不重试;`starlink-lite` 内置快照兜底 | 2026-07-11 起新目标为 6 位编号,只有 OMM 格式可用 |
| ISS 轨道 | CelesTrak GP,`CATNR=25544&FORMAT=TLE` | 同上 | 同上,内嵌 TLE 兜底 | ISS 仍为 5 位编号 |
| 在线地名搜索 | Open-Meteo Geocoding API | 免费接口仅限非商业用途,数据 CC BY 4.0,每日 1 万次 | 仅在离线城市库查不到时兜底,只发送用户输入的地名 | 商业化(课程包)前订阅或替换 |
| 城市库 | GeoNames | CC BY 4.0 | 离线内嵌 `cities-lite` | 页脚署名 |
| 行星轨道 | JPL「Approximate Positions of the Planets」 | NASA/JPL 公开资料 | `planets-data.js` | |
| 地球贴图 | NASA | NASA 公开资料(不得暗示 NASA 背书) | data URI 内嵌 | 待逐张补出处 |
| 行星/星空贴图 | Solar System Scope | CC BY 4.0 | data URI 内嵌 | 页脚署名 |
| ISS 3D 模型 | NASA 3D Resources「International Space Station (ISS) (B)」 | NASA 公开资料 | 内嵌,已简化 | |
| 航线 | 自建 39 个机场坐标 | 自有 | `le-flights.js` | **示意航线,非实时航班**,对外称「航线示意」 |
| three.js 0.169.0 / OrbitControls / GLTFLoader | three.js | MIT | 本地打包 `vendor/three-r169/`(附 LICENSE),含 r147 兼容层 | v0.9.0 主力 |
| three.js 0.147 / OrbitControls / GLTFLoader | three.js | MIT | 本地副本(根目录 three.min.p*.js) | v0.9.0 起仅作 WebGL1/无 WebGL 降级 |
| astronomy-engine 2.1.19 | Don Cross / cosinekitty/astronomy | MIT | 本地副本 `vendor/astronomy-engine/astro.p1–p3.js`(附 LICENSE);本机计算月相、日月距离、日月食 | v1.0-M1a 起 |
| satellite.js 6.0.2 | shashwatak/satellite-js | MIT | 本地副本(含 OMM `json2satrec`) | 2026-10-17 由 5.0 升级 |
| 字体 Orbitron / Rajdhani | Google Fonts | SIL OFL 1.1 | base64 内嵌 | |
| 天宫空间站、哈勃望远镜轨道 | CelesTrak GP,`CATNR=48274` / `CATNR=20580`,`FORMAT=CSV` | 同上 | `LE.netcache` 本机缓存 2 小时;`sh-orbits-data.js` 内置快照(历元 2026-10-17)兜底 | M1 新增 |
| 导航卫星(GPS/北斗/伽利略/格洛纳斯)、静止轨道气象卫星 | CelesTrak GP,`GROUP=gps-ops/beidou/galileo/glo-ops/weather`(OMM,weather 只取静止轨道) | 同上 | **仅内置快照**(2026-10-17 下载一次),页面不实时请求 | M1 新增;已剔除军方气象卫星;快照约每季度手动更新 |
| 太阳/月球位置、月相 | 低精度解析公式(太阳:天文年历简式;月球:Meeus 简化项) | 公式,自有实现 | `sh-astro.js` 本机计算,精度约 0.5° | M1 新增 |
| 卫星过境预报 | satellite.js SGP4 + 自有可见性判定(仰角 >10°、卫星被照亮、观测地太阳 < −6°) | 自有实现 | 本机计算,不上传位置 | M1 新增 |
| 尺度与光行时常数 | 公开天文常数(地球直径、地月距离、天文单位、比邻星 4.24 光年、银河系约 10 万光年) | 事实数据 | 任务 #1 内置 | M1 新增 |
| 向导徽记(北斗七星) | 程序绘制 | 自有 | `sh-core.js` canvas | M1 新增 |
| 声音 | `audio/synth.py` 纯程序合成(numpy+scipy,无采样/音色库/AI 音乐)+ 少量 Web Audio 实时合成(随速度变化的嗡鸣) | 自有原创 | `audio/*.m4a`、`le-audio.js` | 按系列《声音设计指南 v1.0》;默认关,偏好键 gn:sh:_pref |
| 星璃 3D 形象 | VRoid 官方「β Ver AvatarSample_3」(pixiv Inc.),取自 OpenGameArt「VRoid Studio CC0 models」AvatarSample_F 镜像(原名ヴィータ) | **CC0**(pixiv 声明放弃著作权;见 vroid.pixiv.help 文章 360014900113) | `xingli.vrm`:身体贴图改为高领驾驶服(去掉露肩)、贴图降为 1K/512、重新打包,约 6.4 MB;进入航行时才加载 | M1.5 新增;界面署名「VRoid β AvatarSample_3(CC0)」 |
| ~~three-vrm 0.6.11~~ | pixiv/three-vrm | MIT | v0.9.1 已从仓库删除(M1.6a 起停用) | |
| 韦布望远镜影像:第一张深场(SMACS 0723)、船底座「宇宙悬崖」、创生之柱 | ESA/Webb weic2209a / weic2205a / weic2216a | **CC BY 4.0**,署名 NASA, ESA, CSA, STScI | `sv-deepfield.jpg`、`sv-cliffs.jpg`、`sv-pillars.jpg`(缩至 ≤2048 px),用于未测绘星域 V、VII 的景象 | M1.5 新增;界面署名,并注明不代表任何机构背书 |
| 引擎参数与距离 | 公开资料取整:旅行者 1 号约 17 km/s、阿波罗约 3 天到月球、突破摄星光帆设想 20% 光速、比邻星 4.24 光年、银心约 2.6 万光年、仙女座约 250 万光年、可观测宇宙半径约 465 亿光年 | 事实数据 | `sh-voyage-data.js` | M1.5 新增;相对论航行用恒定加速度公式本机计算 |
| 驾驶舱、飞船、银河、宇宙网、多重宇宙气泡 | 程序生成 | 自有 | `sh-voyage.js`、`sh-voyage-fx.js` | M1.5 新增;银河与宇宙网为示意,猜想外圈为抽象表达 |

**已移除**:IP 定位 GeoJS、ipapi.co(2026-10-17,M0.5)——违反「定位默认关、只在本机计算」。

**隐私**:不自动定位;「用我的位置」由用户点击触发,坐标只在本机计算,不上传;手选城市只存本机 `gn:sh:settings`;任务进度只存本机 `gn:sh:where`、`gn:sh:orbit`,探索记录 `gn:sh:explore`,航行记录 `gn:sh:voyage`(到过的星域、试过的引擎)。实时卫星、航线数据只做科普展示,不提供追踪特定个人或敏感目标的功能。

## M1.7b 驾驶舱/星璃 2.5D(2026-10-20)
| 资源 | 来源 | 许可 | 用法 |
|---|---|---|---|
| ck25.webp / ck25d.jpg | 本项目驾驶舱概念图 cockpit_B_luxury(本项目自制,AI 辅助) | 本项目自有 | 驾驶舱贴图 + 深度图 |
| xl25.webp / xl25b.webp | 本项目星璃概念图 xingli_B3_street_portrait(本项目自制,AI 辅助) | 本项目自有 | 星璃全息像 + 眨眼贴片;v0.9.1 起航行页署名注明「AI 辅助生成」 |
| MiDaS v2.1 small | isl-org/MiDaS | MIT | 离线生成深度图,不随网页分发 |
| isnet-anime | SkyTNT anime-segmentation / rembg 发布 | Apache-2.0 | 离线抠像,不随网页分发 |
| ~~xingli.vrm~~ | VRoid AvatarSample_G | CC0 | v0.9.1 已从仓库删除(M1.6a 起停用) |
| ship25.webp / ship25a.jpg | 本项目飞船概念图 chordion_B_manifold(本项目自制,AI 辅助) | 本项目自有 | 舷窗观景/出舱外观;页面署名「AI 辅助生成」 |
| hub25.webp | 本项目指令台概念图 hub_console_concept(本项目自制,AI 辅助) | 本项目自有 | 指令台近景;页面署名「AI 辅助生成」 |

## M1.8 地球之眼(2026-10-21)
| 资料 | 来源 | 许可/使用方式 | 署名位置 |
|---|---|---|---|
| 热带气旋事件(进行中) | GDACS(欧盟委员会 JRC × 联合国 OCHA)geteventlist API | 公开数据,前端实时调用,不自托管;卡片链接回 GDACS 报告页 | 页脚「GDACS 台风」、卡片按钮 |
| 极光预报 OVATION、行星 Kp 指数 | NOAA SWPC services.swpc.noaa.gov | 美国政府公有领域,前端实时调用 | 页脚「NOAA SWPC 极光」、卡片按钮 |
| 台风卫星实拍连续帧(10 分钟间隔,近 3 小时) | NASA GIBS WMS(epsg4326/best):Himawari_AHI_Band3_Red_Visible_1km / Band13_Clean_Infrared(Himawari-9,原始数据日本气象厅);GOES-East/West_ABI_Band2_Red_Visible_1km / Band13_Clean_Infrared(NOAA) | NASA EOSDIS 数据开放使用,需署名;CORS *;前端实时调用,不自托管、不缓存 | 页脚「卫星云图 NASA GIBS(Himawari-9:日本气象厅;GOES:NOAA;VIIRS:NASA/NOAA)」、台风卡片「卫星实拍」行、画面角标 |
| 全球真实云图(最近一天) | NASA GIBS VIIRS_NOAA20_CorrectedReflectance_TrueColor(NASA/NOAA) | 同上 | 同上;云层开关「实拍 日期」 |

## M2c 潮汐实验室 / M2d 太阳活动观测台(2026-10-21,v0.5.4)
| 资料 | 来源 | 许可/使用方式 | 署名位置 |
|---|---|---|---|
| 潮汐 | 无外部数据:平衡潮理论自算(月龄来自 SH.astro.moonPhase) | 原创 | 实验室内注明「平衡潮理论 · 示意」 |
| GOES X 射线通量(24 小时)、太阳风速度、月均太阳黑子数 | NOAA SWPC:json/goes/primary/xrays-1-day.json、products/summary/solar-wind-speed.json、json/solar-cycle/observed-solar-cycle-indices.json(黑子数原始来源 SILSO/比利时皇家天文台,经 SWPC 发布) | 美国政府公有领域;CORS *;前端在打开观测台时实时调用,不自托管 | 页脚「NOAA SWPC 极光与太阳活动」、观测台「NOAA SWPC 实时数据」 |
| 太阳最新实拍(HMI 连续谱、AIA 171Å、AIA 304Å) | NASA SDO sdo.gsfc.nasa.gov/assets/img/latest/ | NASA 图像,公开使用需署名「NASA/SDO 及 AIA、HMI 科学团队」;以 <img> 直接显示,不读像素、不自托管 | 页脚「太阳实拍 NASA/SDO」、观测台图下注 |

## M2 星档馆 v0(2026-10-21,v0.6.0)— 自托管于 /starhelm/arc/(≤1024px WebP)
| 展品/文件 | 来源编号 | 许可 | 署名(界面逐件显示) |
|---|---|---|---|
| 太阳 sun-vis / sun-171 / sun-304 | NASA SDO(HMI 连续谱 latest;AIA 171/304 browse 2026-10-15) | NASA 图像,公开使用需署名 | NASA/SDO 及 HMI / AIA 科学团队 |
| 蓝色弹珠 earth | NASA AS17-148-22727(1972-12-07) | 美国政府公有领域 | NASA |
| 暗淡蓝点 pbd | NASA/JPL PIA23645(2020 重处理) | 公有领域 | NASA/JPL-Caltech |
| 木星 jupiter | ESA/Hubble heic2017a | CC BY 4.0 | NASA, ESA, A. Simon (GSFC), M. H. Wong (UC Berkeley), OPAL 团队 |
| 创生之柱 可见光 pillars-vis | ESA/Hubble heic1501a | CC BY 4.0 | NASA, ESA/Hubble, Hubble Heritage Team |
| 创生之柱 近红外 pillars-nir | ESA/Webb weic2216a(同 sv-pillars) | CC BY 4.0 | NASA, ESA, CSA, STScI; J. DePasquale, A. Koekemoer, A. Pagan |
| 创生之柱 中红外 pillars-miri | ESA/Webb weic2218a | CC BY 4.0 | NASA, ESA, CSA, STScI, J. DePasquale, A. Pagan |
| 蟹状星云 可见光 crab-vis | ESA/Hubble heic0515a | CC BY 4.0 | NASA, ESA, J. Hester, A. Loll (ASU) |
| 蟹状星云 红外 crab-ir | ESA/Webb weic2326a | CC BY 4.0 | NASA, ESA, CSA, STScI, T. Temim (Princeton) |
| 蟹状星云 X 射线 crab-xray | Chandra photo/2018/crab(crab_xray.jpg) | NASA 图像,署名使用 | NASA/CXC/SAO |
| 宇宙悬崖 cliffs | ESA/Webb weic2205a(同 sv-cliffs) | CC BY 4.0 | NASA, ESA, CSA, STScI |
| M87* 黑洞 m87 | ESO eso1907a | CC BY 4.0 | EHT Collaboration |
| 韦布第一深场 deep | ESA/Webb weic2209a(同 sv-deepfield) | CC BY 4.0 | NASA, ESA, CSA, STScI |
统一声明:不用机构 logo,界面注明「不代表任何机构背书」。改动:仅缩放/方形裁切与格式转换(CC BY 要求注明修改,已在此台账记录)。

## v0.6.3 卫星星海(sh.sats)
| 资料 | 来源 | 许可/条款 | 用法 | 署名 |
|---|---|---|---|---|
| 活跃卫星轨道根数(GP,16,758 颗) | CelesTrak `gp.php?GROUP=active&FORMAT=csv`(2026-10-22 下载) | 公开免费数据,注明来源使用(与现有星链/ISS 快照同一做法) | 打包为 sh-sats-data.js 快照(build_sats.py),本地按开普勒+J2 推算位置 | 「数据:CelesTrak」 |
| 在轨编目统计与每年发射数量(SATCAT) | CelesTrak `pub/satcat.csv`(2026-10-22 下载) | 同上 | 失效卫星/火箭残骸/碎片的高度、倾角;每年发射卫星数柱状图;不按国家分类 | 「数据:CelesTrak」 |

## v0.6.4 地震实验室(sh.quakes)
| 资料 | 来源 | 许可/条款 | 用法 | 署名 |
|---|---|---|---|---|
| 近一年 M5+ 地震(1,983 次) | USGS ANSS ComCat FDSN `fdsnws/event/1/query?format=csv&minmagnitude=5`(2026-10-22 下载) | 美国政府作品,公有领域 | 打包为 sh-quakes-data.js 快照(build_quakes.py) | 「数据:USGS 地震灾害计划」 |
| 近 7 天 M4.5+ 实时 | USGS `summary/4.5_week.geojson`(CORS *) | 同上 | 浏览器实时取,7 秒超时用快照近 7 天 | 同上 |
| 板块边界 PB2002 | Bird (2003) G3 4(3):1027;Hugo Ahlenius / Nordpil 数字化(github fraxen/tectonicplates) | ODC-By 1.0(须署名) | 精简到 0.1° 后打包进 sh-quakes-data.js | 页面写「板块边界 PB2002(Bird, 2003),Ahlenius/Nordpil 数字化,ODC-By」 |

## sky-8k.jpg / sky-4k.jpg(v1.0-M2c)
- 来源:NASA Scientific Visualization Studio「Deep Star Maps 2020」(svs.gsfc.nasa.gov/4851),starmap_2020_8k.exr 色调映射后转 JPEG。
- 数据基于 ESA Gaia、Hipparcos、Tycho-2 星表。许可:NASA 媒体,可免费用于教育;致谢 NASA/Goddard Space Flight Center Scientific Visualization Studio。

## hd/*.jpg、hd/saturn-ring.png(v1.0-M2d)
- 来源:Solar System Scope 纹理(solarsystemscope.com/textures,经 Wikimedia Commons 获取),基于 NASA 影像与高程数据。许可 CC BY 4.0。改动:缩放到 4096×2048(环 2048×64)。

## hd/moons/*.jpg(v1.0-M2f,卫星表面贴图;均经 Wikimedia Commons 获取,缩放为 2048×1024 / 1024×512)
- 木卫一 io:NASA/JPL/USGS PIA00319(Galileo/Voyager 镶嵌),公有领域。改动:上下极区以边缘色补齐成 2:1。
- 木卫二 europa:NASA/JPL Voyager 镶嵌(File:Jupiter II-Europa map NASA JPL Voyager.jpg),公有领域。改动:灰度图按欧罗巴真实色调(冰白 + 红褐线纹)着色。
- 木卫三 ganymede:NASA 原始影像 / Björn Jónsson 制图(File:Map of Ganymede by Björn Jónsson.jpg),Commons 标注「Attribution」:须署名 NASA / Björn Jónsson。
- 木卫四 callisto:USGS 赤道区镶嵌(File:Callisto equatorial.jpg),公有领域。改动:着色 + 极区补齐。
- 土卫六 titan:NASA/JPL-Caltech/Univ. Arizona PIA22770(Cassini VIMS 红外透雾地表镶嵌),公有领域。改动:按土卫六大气的橙色着色;画面中位置为示意(周期真实)。
- 卫星数值(半径、轨道半长轴、周期):NASA Solar System Exploration 公开数据。
