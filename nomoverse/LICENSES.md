# 宙律 Nomoverse · 许可与素材台账

更新:2026-10-25(按《1.0 素材与 AI 标注台账规范》;总审小修:BYOK 例外、页脚 CC BY 许可链接)

## 总表(1.0 规范)

| 素材 | 用在哪(任务/页面) | 来源与链接 | 许可 | 署名要求 | 是否 AI 生成 | 页面标注位置 |
|---|---|---|---|---|---|---|
| Three.js r169 `vendor/three.module.min.js` | hoop/sound/orbit/stars/tide 3D 舞台、首页 3D 星图(按需加载) | npm `three@0.169.0` https://threejs.org | MIT | 保留许可全文(`vendor/three.LICENSE`,文件头 @license) | 否 | 文件头 + 本台账 |
| `assets/hoop/asphalt_*` | hoop 地球 / 2g 球场地面 | Poly Haven「Asphalt 02」https://polyhaven.com/a/asphalt_02 | CC0 1.0 | 无 | 否 | 任务页脚「图像来源」+ 本台账 |
| `assets/hoop/moon_*` | hoop 月面 | Poly Haven「Moon Dusted 01」https://polyhaven.com/a/moon_dusted_01 | CC0 1.0 | 无 | 否 | 同上 |
| `assets/hoop/mars_*` | hoop 火星地面 | Poly Haven「Red Laterite Soil Stones」https://polyhaven.com/a/red_laterite_soil_stones | CC0 1.0 | 无 | 否 | 同上 |
| `assets/hoop/deck_*` | hoop 木星悬浮平台 | Poly Haven「Hexagonal Concrete Paving」https://polyhaven.com/a/hexagonal_concrete_paving | CC0 1.0 | 无 | 否 | 同上 |
| `assets/hoop/pad_*` | hoop 荒谬宇宙平台 | Poly Haven「Rubber Tiles」https://polyhaven.com/a/rubber_tiles | CC0 1.0 | 无 | 否 | 同上 |
| `assets/hoop/sky_day_*` | hoop 地球白天天空 | Poly Haven「Kloofendal 48d Partly Cloudy (Pure Sky)」https://polyhaven.com/a/kloofendal_48d_partly_cloudy_puresky | CC0 1.0 | 无 | 否 | 同上 |
| `assets/hoop/sky_dusk_*` | hoop 2g 黄昏天空;tide 海岸天空(复用) | Poly Haven「Qwantani Dusk 2 (Pure Sky)」https://polyhaven.com/a/qwantani_dusk_2_puresky | CC0 1.0 | 无 | 否 | hoop、tide 页脚 + 本台账 |
| `assets/hoop/sky_space_*` | hoop 太空星空;stars、tide 星空(复用) | NASA/Goddard SVS「Deep Star Maps 2020」https://svs.gsfc.nasa.gov/4851(含 Gaia DR2、Hipparcos-2、Tycho-2 数据) | NASA 素材(教育用途) | 署名 NASA/Goddard SVS;不暗示 NASA 认可 | 否 | hoop、stars、tide 页脚 + 本台账 |
| `assets/hoop/planet_earth_*` | hoop 月面天空中的地球 | NASA Goddard Blue Marble「Whole world – land and oceans」via Wikimedia Commons | 公有领域(NASA) | 建议署名 NASA | 否 | hoop 页脚 + 本台账 |
| `assets/hoop/planet_jupiter_*` | hoop 木星 | NASA/JPL/SSI PIA07782 Cassini「Jupiter Cylindrical Map」https://photojournal.jpl.nasa.gov/catalog/PIA07782 | 公有领域(NASA) | 建议署名 NASA/JPL/SSI | 否 | 同上 |
| `assets/stars/sun_4k.jpg`、`sun_2k.jpg` | stars 太阳 3D 剖面表面 | Solar System Scope「8k sun」via Wikimedia Commons https://commons.wikimedia.org/wiki/File:Solarsystemscope_texture_8k_sun.jpg | CC BY 4.0 | 必须署名「Solar System Scope」+ 许可链接 + 注明已缩放 | 否 | stars 页脚「图像来源」(含 CC BY 4.0 许可链接)+ 本台账 |
| `assets/tide/earth_4k.jpg`、`earth_2k.jpg` | tide 太空视角地球 | Solar System Scope「8k earth daymap」via Wikimedia Commons https://commons.wikimedia.org/wiki/File:Solarsystemscope_texture_8k_earth_daymap.jpg | CC BY 4.0 | 必须署名「Solar System Scope」+ 许可链接 + 注明已缩放 | 否 | tide 页脚「图像来源」(含 CC BY 4.0 许可链接、修改说明)+ 本台账 |
| `assets/tide/clouds_4k.jpg`、`clouds_2k.jpg` | tide 地球云层 | Solar System Scope「8k earth clouds」via Wikimedia Commons https://commons.wikimedia.org/wiki/File:Solarsystemscope_texture_8k_earth_clouds.jpg | CC BY 4.0 | 必须署名「Solar System Scope」+ 许可链接 + 注明已缩放、转灰度 | 否 | 同上 |
| `assets/tide/moon_4k.jpg`、`moon_2k.jpg` | tide 太空月球、海岸天空中的月亮 | Solar System Scope「8k moon」via Wikimedia Commons https://commons.wikimedia.org/wiki/File:Solarsystemscope_texture_8k_moon.jpg | CC BY 4.0 | 同上 | 否 | 同上 |
| `assets/tide/sand_d*`、`sand_n*` | tide 海岸沙滩 | Poly Haven「Coast Sand Rocks 02」https://polyhaven.com/a/coast_sand_rocks_02 | CC0 1.0 | 无 | 否 | 同上 |
| `assets/tide/rock_d*`、`rock_n*` | tide 海岸礁石 | Poly Haven「Rock Face」https://polyhaven.com/a/rock_face | CC0 1.0 | 无 | 否 | 同上 |
| 程序生成画面:`core/orbit3d.js`、`sound3d.js`、`stars3d.js`(剖面/日冕/日珥)、`tide3d.js`(海水壳/海面/灯塔/标尺/碎片环)、`starmap3d.js`、`intro.js`、`nvscene.js`、向导徽标 | 全部任务页与首页 | 本项目原创代码 | 自制 | 无 | 否 | 本台账 |
| 3D 模型 | — | 本世界不使用任何外部 3D 模型文件;所有几何体由 Three.js 代码生成 | 自制 | 无 | 否 | 本台账 |
| 背景音乐与音效 `audio/*.m4a` | 首页与任务页(声音默认关) | `audio/synth.py` 纯程序合成;实时音效由 Web Audio 振荡器生成 | 自制 | 无 | 否 | 本台账 |
| 语音 / 配音 | — | 本世界无语音、无配音 | — | — | — | — |
| 字体 | 全站 | 只用系统字体栈,不下载、不内置网络字体 | — | 无 | 否 | 本台账 |
| 物理常数 | NV.Phys 与各关读数 | CODATA(g、G)、IERS/WGS-84(GM⊕)、JPL DE440(GM☾)、IAU 2012(AU)、IAU 2015(L☉、R☉) | 公开数据 | 文字出处 | 否 | 知识卡出处 + 本台账 |
| 数据与资料出处 | 知识卡 | NASA 行星/太阳/月球 Fact Sheet、ISS 轨道数据;NOAA《Tides and Water Levels》;激光测月 Williams & Boggs 2016(3.83 cm/年);Wells 1963《Nature》珊瑚生长纹;OpenStax《University Physics Vol. 1》《Astronomy 2e》 | 仅文字引用,未复制内容 | 文字出处 | 否 | 各关知识卡「出处」行 |
| AI 讲解文字(可选第 3 层,默认关闭) | 任务页「AI 讲解」框 | 用户自带钥匙调用其自选的 OpenAI 兼容模型(本站不内置、不调用任何默认 AI 服务) | — | — | 是(用户开启时实时生成文字) | AI 讲解框内「AI 生成内容可能有误,以知识卡与实验为准」 |

- 自查(1.0):页面里每个外部素材都在本表;静态资源零外部请求。**例外**:用户自行开启「AI 讲解」并填入自己的接口地址与钥匙(BYOK)时,浏览器会直连该接口(故 CSP `connect-src` 放开 `https:` 与本机 localhost);默认关闭,本站不内置、不代发任何 AI 请求。
- 图片素材均本地打包,零外部请求;按画质档位加载 4K/2K/1K 版本(由原图缩放、重新压缩,除注明外未做其他改动)。
- 本世界页面上**没有 AI 生成的画面、人物或语音**;方案阶段的效果图只存放在开发文档中,不上线。
- NASA 图像按 NASA 媒体使用指南作为教育科普用途使用,不暗示 NASA 认可本站。

---

# 附:分版本详细记录

## 第三方代码
| 组件 | 版本 | 许可 | 位置 | 说明 |
|---|---|---|---|---|
| Three.js | r169(npm `three@0.169.0`) | MIT | `vendor/three.module.min.js`;许可全文 `vendor/three.LICENSE` | v0.3 起按 HANDOFF §5.3.1 统一对齐 r169(原 r186 已替换)。来自 npm 官方包 `build/three.module.min.js`(单文件,未改动,文件头保留 `@license`)。sha256 `f7cee3c7533449a1505cc12cb5128b89e3d4fd3d7ea62b05f9f5464a217472ee`。只在支持 WebGL 且画质非「低」时按需加载,不走 CDN。 |

除此之外,**本站没有其他第三方代码**:`core/nv.js`、`core/nv.css`、各任务页与首页的脚本和样式都是本项目原创。

## 声音
- `audio/*.m4a` 全部由 `audio/synth.py` 纯程序**原创合成**(无采样、无第三方音色库、无版权素材)。
- 「声音即规律」的实时音效(多普勒、拍频、低频脉冲等)在浏览器里由 Web Audio 振荡器现场生成。

## 物理常数与数据
- 标准重力加速度 g = 9.80665 m/s² 等常数按 **CODATA** 约定值;地心引力常数 GM = 3.986004418×10¹⁴ m³/s² 取自 IERS / WGS-84 约定值;声速、行星表面重力等为公开的教科书数据。
- 公式与数值只用于简化模型的科普探究,不代表工程精度。

## 图像素材(v0.3-α4 起,投篮任务 3D 舞台 `assets/hoop/`)
全部本地打包,零外部请求;按画质档位加载 2K/4K 或 1K/2K 版本(由原图缩放、重新压缩,未做其他改动)。

| 文件 | 来源 | 许可 | 用途 |
|---|---|---|---|
| `asphalt_*` | Poly Haven「Asphalt 02」 https://polyhaven.com/a/asphalt_02 | CC0 1.0 | 地球 / 2g 球场地面(颜色 + 法线) |
| `moon_*` | Poly Haven「Moon Dusted 01」 https://polyhaven.com/a/moon_dusted_01 | CC0 1.0 | 月面地面 |
| `mars_*` | Poly Haven「Red Laterite Soil Stones」 https://polyhaven.com/a/red_laterite_soil_stones | CC0 1.0 | 火星地面 |
| `deck_*` | Poly Haven「Hexagonal Concrete Paving」 https://polyhaven.com/a/hexagonal_concrete_paving | CC0 1.0 | 木星悬浮平台 |
| `pad_*` | Poly Haven「Rubber Tiles」 https://polyhaven.com/a/rubber_tiles | CC0 1.0 | 荒谬宇宙悬浮平台 |
| `sky_day_*` | Poly Haven「Kloofendal 48d Partly Cloudy (Pure Sky)」 | CC0 1.0 | 地球白天天空 |
| `sky_dusk_*` | Poly Haven「Qwantani Dusk 2 (Pure Sky)」 | CC0 1.0 | 2g 关黄昏天空 |
| `sky_space_*` | NASA/Goddard SVS「Deep Star Maps 2020」(starmap_2020_4k,Ernie Wright 等;含 Gaia DR2、Hipparcos-2、Tycho-2 数据) https://svs.gsfc.nasa.gov/4851 | NASA 素材,按要求署名 | 月球 / 木星 / 荒谬宇宙星空(由 EXR 色调映射为 JPG) |
| `planet_earth_*` | NASA Goddard「Whole world – land and oceans」(Blue Marble) via Wikimedia Commons | 公有领域(NASA) | 月面天空中的地球 |
| `planet_jupiter_*` | NASA/JPL/Space Science Institute「Jupiter Cylindrical Map」PIA07782(Cassini,2000-12) | 公有领域(NASA) | 木星 |

- NASA 图像按 NASA 媒体使用指南作为教育科普用途使用,不暗示 NASA 认可本站。火星天空、篮球皮纹、球场线、篮架与人物均为程序绘制(原创)。

## v0.4 起新增内容的来源(2026-10-24 核对)
- **声音任务 3D 舞台 `core/sound3d.js`(v0.4-α2「夜间城市街景」)**:天空、楼宇灯窗、路面、路灯光晕、救护车与警灯、听者、声波圈全部由代码程序生成(Canvas 贴图 + Three.js 几何),**未使用任何外部图片、模型或字体**。
- **任务页统一 HUD(v0.4-α1)、帧率读数 `NV.fps`(v0.4-α4)**:原创代码与 CSS,无第三方素材。
- **Service Worker `sw.js`(v0.4-α4)**:原创代码,作用域仅 `/nomoverse/`,只缓存本世界同源文件,不引入第三方资源。
- 本表「图像素材」所列 NASA 与 Poly Haven 贴图仍只用于投篮任务 `assets/hoop/`;截至 v0.4-α4,本世界没有其他第三方图像;v0.5-α1 起另有恒星任务太阳贴图(见下节)。

## v0.5 起新增内容的来源(2026-10-24 核对)
- **恒星任务 `assets/stars/sun_4k.jpg`、`sun_2k.jpg`**:Solar System Scope「Solarsystemscope texture 8k sun.jpg」,经 Wikimedia Commons 获取(https://commons.wikimedia.org/wiki/File:Solarsystemscope_texture_8k_sun.jpg),缩放为 4096×2048 / 2048×1024 的 JPG。作者:Solar System Scope(https://www.solarsystemscope.com/textures/)。许可:**CC BY 4.0**(https://creativecommons.org/licenses/by/4.0/),已缩放,未作其他修改。用于太阳 3D 剖面表面。
- **恒星 3D 舞台 `core/stars3d.js`(v0.5-α1「写实太阳剖面」)**:剖面切口、核心/辐射区/对流区着色器、光子随机游走、聚变闪光、日冕、日珥、星空背景均为原创代码程序生成;仅太阳表面使用上述贴图。
- 恒星任务知识卡仅以文字引用 NASA Sun Fact Sheet、OpenStax《Astronomy 2e》,未复制其内容。

## v0.6 起新增内容的来源(2026-10-24 核对)
- **潮汐任务 `assets/tide/earth_4k.jpg`、`earth_2k.jpg`、`clouds_4k.jpg`、`clouds_2k.jpg`、`moon_4k.jpg`、`moon_2k.jpg`**:Solar System Scope「Solarsystemscope texture 8k earth daymap / earth clouds / moon」,经 Wikimedia Commons 获取(https://commons.wikimedia.org/wiki/File:Solarsystemscope_texture_8k_earth_daymap.jpg 、…_earth_clouds.jpg 、…_moon.jpg),缩放为 4096×2048 / 2048×1024 的 JPG(云层转灰度)。作者:Solar System Scope(https://www.solarsystemscope.com/textures/)。许可:**CC BY 4.0**(https://creativecommons.org/licenses/by/4.0/),已缩放,未作其他修改。
- **潮汐任务 `assets/tide/sand_*`、`rock_*`**:Poly Haven「Coast Sand Rocks 02」「Rock Face」漫反射与法线贴图(1K / 2K),https://polyhaven.com/a/coast_sand_rocks_02 、https://polyhaven.com/a/rock_face 。许可:**CC0 1.0**。
- 海岸天空复用投篮任务的 Poly Haven「Qwantani Dusk 2」(CC0),太空星空复用 NASA SVS Deep Star Maps(见上表)。
- **潮汐 3D 舞台 `core/tide3d.js`(v0.6-α1「太空地月 × 海岸实景」)**:海水壳(引潮势位移)、海面(菲涅耳反射、月光碎影)、湿沙与白沫、岩石造型、灯塔、潮位标尺、月相着色、月球碎片环、点状星空均为原创代码程序生成。

## 引用与链接
- **NASA**:知识卡里以文字形式引用其官方公开资料(如行星数据表、ISS 轨道数据);v0.3-α4 起投篮 3D 舞台使用上表所列 NASA 公有领域 / 署名图像。
- OpenStax《University Physics Volume 1》:知识卡中仅做文字出处标注,未复制其内容。

## 字体与图形
- 只用**系统字体**(系统无衬线字体栈与系统等宽字体栈),不下载、不内置任何网络字体。
- 向导徽标、图腾、星图由 Canvas / WebGL 程序绘制;投篮 3D 舞台使用上表「图像素材」所列贴图,均本地打包。
