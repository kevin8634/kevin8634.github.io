# 天枢 · 巡天 X0a 开发日志(2026-10-26)

依据:总指挥派工 07_派工_巡天X0a_2026-10-26.md(王磊 19:41 过门 A、放行阶段 1)。

## 防撞车
- 19:4x 核对:GitHub main 上没有 /starhelm/x/;云盘 07 状态卡(16:29)和开发文档里也没有另一账号 X0a 的进度。本窗口开工,并在状态卡上登记「X0a 由本窗口完成」。

## 做了什么
- 新子页 /starhelm/x/index.html:由 docs/build/build_x_index.py 根据 1.0 的 index.html 生成。用 `<base href="../">` 共用 1.0 的全部脚本、贴图、vendor 和 gn:sh:* 进度;加 noindex,nofollow;没有挂任何入口。**1.0 线上文件一个都没改。**
- three r169 → r186:x/vendor/three-r186/three.p1–14.js(three@0.186.1 + OrbitControls + GLTFLoader,esbuild IIFE → window.THREE,沿用同一 r147 兼容层;入口 docs/build/three-r186-entry.js)。1.0 是经典脚本加全局 THREE,所以没有直接用 /deep/vendor/r186 的 ESM 包;版本相同(0.186.1)。
- 回滚与降级:?three=169 回到 1.0 的 r169;WebGL1 → r147、无 WebGL → 2D,都和 1.0 一样。
- Service Worker:子页不注册 SW。1.0 的 SW(作用域 /starhelm/)会把导航到的页面写进缓存 ./index.html,子页加载约 4 秒后会把这份缓存恢复成 1.0 首页。建议下一个 1.0 版本里给 sw.js 的导航缓存加路径判断(/x/ 不写入),到时再回报。
- WebGPU 没有用(按总指挥 T1 结论)。core/deep 0.3 这一步没有接入,留到 X1(数据快照和台账)。
- 底部角标:「巡天 X0a · 开发预览 · three r186」。

## 自测(SwiftShader;为避免实时请求,gn:sh:live=0)
- 1440×900、1000×760、568×320、375×667、减少动态,以及 ?domain=2/3/4/5:THREE.__r=186,pageerror 0,站内 404 0。
- 控制台只有外部 CORS 报错(GIBS、GDACS、NOAA SWPC,本地 127.0.0.1 来源才会出现)。1.0 r169 的对照页报错完全一样,不是 r186 引起的。另外 NOAA 和 GDACS 本来就不受实时开关控制,与 M4e 说明一致。
- 和 r169 并排截图对比:地球、星域 III、IV、V 的观感一致,没有发现颜色空间或光照强度的回归。

## 下一步
X1 → X3 → X2 → M5(按方案);X0b 四级视图、面包屑和旋转光环按钮在 /x/ 上做。
