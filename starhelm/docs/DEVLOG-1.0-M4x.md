# 天枢 Starhelm 1.0-M4x 开发日志(2026-11-22)

承接 M4w 的两处遗留,只改 /starhelm/(sh-hud.css、sw.js、本文件)。

## 1. 矮横屏展开「地球重要播报」不再盖住顶部按钮
- 现象(M4w):568×320 等 `max-height:500px` 横屏下,展开的播报面板(right:8px,宽 300px,z-index 39)左缘到 x≈260,
  盖住按钮区 `.le-top`(左贴 8px、最宽 62vw,x 8–360)里「航行」右半、「天文台」「我的位置」「航线查询」,elementFromPoint 命中面板。
- 修法:`@media (max-height:500px) and (orientation:landscape)` 下,展开态面板宽度改为
  `min(350px, calc(38vw − 2×--shh-pad − 8px))`,即只占按钮区右侧剩余宽度(568 宽时约 192px,x 368–560),与按钮区留 8px 缝;
  标题条/各段左右内边距收到 8px。高度、吸顶标题、整块滚动沿用 M4w;收起态、≥501 高的尺寸、竖屏都不变。
- 自测:568×320 展开后 8 个顶部按钮左/中/右三点 elementFromPoint 全部命中按钮自身;面板仍可滚到底(截图 l568_off_cast_scrolled)。

## 2. 减少动态下播报红点常亮
- 新增 `@media (prefers-reduced-motion:reduce){.sh-cast__live{animation:none;opacity:1}}`。
- 自测:减少动态 + live=1 → animation none、opacity 1、红色;非减少动态 live=1 仍 shcast 闪;live=0 仍灰点不闪(M4w 规则)。

## sw
- `sh-v1.0.0-m4w` → `sh-v1.0.0-m4x`(文件清单不变)。

## 自测汇总(playwright 1.56 / chromium 1255,脚本 /workspace/work/h/sh-m4x/t_m4x.py)
- 五档 1440×900、1000×760、375×667、568×320、减少动态(1440×900):0 页面错误、0 本站 404;live=0 时 0 外部请求。
- live=1(外部全部 abort)时首屏只有既有 celestrak/USGS,四个例外源只在打开对应面板时请求,与 M4v/M4w 一致。
- ?gus= 浮层回归 5 档(含 1000×760):浮层出现、跳过开场、「关闭,进入天枢」后关闭,0 错误 0 外部请求。
- 已知未改:375×667 竖屏下 3D 标签「ISS 国际空间站」可与展开的播报面板下部叠在一起(M4w 起即如此,不在本次范围)。
