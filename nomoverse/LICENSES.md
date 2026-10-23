# 宙律 Nomoverse · 许可与素材台账

更新:2026-10-23(v0.3-α4)

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

## 引用与链接
- **NASA**:知识卡里以文字形式引用其官方公开资料(如行星数据表、ISS 轨道数据);v0.3-α4 起投篮 3D 舞台使用上表所列 NASA 公有领域 / 署名图像。
- OpenStax《University Physics Volume 1》:知识卡中仅做文字出处标注,未复制其内容。

## 字体与图形
- 只用**系统字体**(系统无衬线字体栈与系统等宽字体栈),不下载、不内置任何网络字体。
- 向导徽标、图腾、星图由 Canvas / WebGL 程序绘制;投篮 3D 舞台使用上表「图像素材」所列贴图,均本地打包。
