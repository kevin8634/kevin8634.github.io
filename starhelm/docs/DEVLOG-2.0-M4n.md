# 天枢 Starhelm 2.0 · M4n 狮子座流星雨 3D 版(2026-11-07 北京时间)

王磊 2026-11-06 23:15「按你建议 A+B」。

- 新文件 x/sh-x-leonids.js;x/index.html 增载 sh-leonids.js 与 x/sh-x-leonids.js;2.0 页里 SH.leonidsLab.open 换成 3D 版(深链 ?task=leonids、地球播报置顶条目都进 3D)。
- A 地面看(默认):SVS 星空球经 astronomy-engine Rotation_EQJ_HOR 转到所选地点地平坐标(沿用 sh-x-deep C2.0 的 0h 接缝 180° 修正);狮子座连线(d3-celestial + HYG);辐射点环;月亮与太阳高度决定天光;三档天空条件光污染;远山剪影;流星为光带,沿大圆背离辐射点,6% 火流星带余迹;频率 = 1.0 粗估每小时颗数 × 300 加速(画面注明)。默认停在最佳时段中间。
- B 太空看:日心黄道,1 AU = 100;55P 轨道 JPL SBDB J985/69;地球位置 astronomy-engine;尘埃带 5 股示意细丝,桌面 1.8 万 / 手机 5600 粒;交点太阳黄经 235.27°;穿越前后地球辉光按 zhrAt。
- 「数据与闯关」打开 1.0 平面面板(3 关小游戏);无 THREE / SHFX3D / WebGL 时自动退回 1.0 面板。
- sh-leonids.js 暴露 calc/K/zhrAt/where(只读接口);sw.js 升 sh-v1.0.0-m4n 让缓存刷新。
- 自测(swiftshader):1600×900、390×844、844×390 —— A/B/数据与闯关 全通,0 page error、0 本站 404;无 WebGL 时 2.0 页本身未就绪(既有状况,基线同样),本模块已载入不报错。
