# DEVLOG · 天枢 Starhelm v1.0-M4l · 2026-11-05 CST

- 类型:新展品(王磊 11-05 23:18 指示,经总指挥转;方案 OneDrive 07/开发文档/天枢_猫头星云三波段_方案_v0.1.md)
- 天枢天文台(sh-obs.js)「恒星与星云」新增 **猫头星云 HH 903 · 三波段**:哈勃 WFC3 可见光 / 韦布 NIRCam 近红外 / 韦布 MIRI 中红外,用 ESA/Webb 对齐到同一视场的 weic2622b/e/f(arc/cathead-*.webp,1200×1767)。赤经 10h 46m、赤纬 −60.1°(esawebb weic2622b)。
- 对照展品三种看法(仅 cmp 目标显示模式条):
  - 单张:原多波段切换。
  - 滑块对照:左可见光固定,右侧近红外/中红外任选;拖动分割线(鼠标/触屏,←→ 键),进入时自动扫到中间。
  - 三层叠片:三片全息影像按波长由短到长纵深排开,光束与粒子穿过三片,点片切换信息卡;减少动态时无粒子。
- 信息卡加「为什么红外能穿透尘埃?」:对数波长条(尘粒约 0.1 µm、三个波段范围),标「示意图」;影像全部实拍。逐波段显示拍摄设备与波长;对照/叠片时页脚同时署名哈勃与韦布。
- 深链 ?obs=cathead(?obs=<id> 直达任意目标,?obs=1 照旧)。
- 台账:LICENSES.md、docs/DATA-SOURCES.md(CC BY 4.0,署名 NASA, ESA,(CSA,) STScI;Image Processing: J. DePasquale (STScI))。
- sw.js sh-v1.0.0-m4k → sh-v1.0.0-m4l。
- 自测 work/test/t20.py:1600×900、844×390(手机横屏)、1440 无 WebGL;三模式切换、拖动(sx 0.30)、切到中红外、换回蟹状星云后模式条隐藏,0 page error、0 本站 404。短屏(高 ≤520)模式条移到左下、隐藏赤经赤纬行。
- 只改 starhelm/sh-obs.js、sw.js、LICENSES.md、docs/DATA-SOURCES.md、本文件、arc/cathead-*.webp。
