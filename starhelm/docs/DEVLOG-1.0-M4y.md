# 天枢 Starhelm · DEVLOG 1.0-M4y(2026-11-25)

基线 d9b216c(1.0-M4x,sw sh-v1.0.0-m4x)。王磊放行的小修。

## 问题
375×667 竖屏:地球重要播报面板(竖屏默认展开)下半与 3D 标签「ISS 国际空间站」「天宫空间站 CSS」叠字——标签层 `.le-labels` z-index 39 高于面板 22。

## 修法(只在窄竖屏生效)
- `sh-cast.js`:新增 `dodge()`(requestAnimationFrame 循环)。仅当 `matchMedia('(orientation:portrait) and (max-width:600px)')` 命中、面板展开且可见(不透明度 ≥0.5、未被卡片/抽屉压暗)时,
  逐帧检查 `#labels` 下已显示的标签,矩形与面板相交即加 `.sh-cast-dodge`;移出面板、收起面板、离开窄竖屏或面板被隐藏时立刻去掉该类。
- `sh-hud.css`:`.le-labels .sh-cast-dodge{opacity:0!important;visibility:hidden}`。
- 其他尺寸(1440×900、1000×760、568×320 横屏、减少动态)条件不命中,不加类,行为与 M4x 相同。
- 未引入新组件;sw → `sh-v1.0.0-m4y`。

## 自测
1440×900 / 1000×760 / 375×667 / 568×320 / 1440×900 减少动态 × live=0、live=1(外部请求一律 abort):0 页面错误、0 本站 404;
live=0 外部请求 0;live=1 首屏只请求 celestrak.org、earthquake.usgs.gov(其余 GDACS/SWPC/GIBS/SDO 只在点对应面板后懒加载,同 M4v)。
375×667 展开时面板内可见标签 0(ISS/天宫被隐去),收起后标签恢复;其他尺寸 `.sh-cast-dodge` 计数 0;?gus= 浮层 375 回归正常。

## 遗留
1000×760、1440×900 展开播报时「天宫空间站 CSS」/「ISS」标签偶尔也会叠在面板上(M4x 起即如此,本次按「其他尺寸行为不变」未动)。如要一并处理,只需放宽 dodge 的 matchMedia 条件。
