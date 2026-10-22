# 天枢 Starhelm · v1.0-M2e(2026-10-23)

本窗口接手(王磊 10-23 00:25:「你负责接手最新的开发进度然后继续执行」)。

## 改动
- sh-link.js:星桥深链 `?task=` 补 tidelock / aurora / marsday / tonight / jupiter / retro(直接打开对应实验室)。
- 手机横屏(高 ≤500)避让:右上按钮行收成一行小按钮(去英文副标题,可横向滑动);底部数据署名缩成一行,点按展开;太阳系模式控制台上方留白。sh-hud.css + sh-domain.js。
- 无 WebGL:原来开机日志计时器会覆盖错误提示,画面一直停在「RENDER CORE ONLINE」;现在停止日志并提示「没有开启 WebGL…换用新版 Chrome/Edge/Safari 或开启硬件加速」。le-main.js。

## 自测(playwright + SwiftShader,外网全部拦截)
- ?domain=3:844×390 移动 UA、390×844 竖屏、1280×720 无 WebGL;6 个 ?task= 深链 1280×720 均打开对应实验室;零 page error。

## 未做
- Three.js r169 统一 + 真机验收:王磊 10-23 定「无限搁置」。
