# 天枢 2.0 · DEVLOG C16 · 2026-10-29 16:4x

## C2.7b 登舰真实载入进度 · 5de1fb6
王磊 10-29 11:43:「进场登录的画面 2 个载入进度要真实,不要进去以后还是模型没加载好、声音没加载好」。

- 新 `x/sh-x-preload.js`:全局 **SHXLD**(原定名 SHXP 与侧舷窗 `sh-x-port.js` 的 `window.SHXP` 冲突,改名)。每项资源一条记录(grp vis/snd、gate、字节进度、状态 wait/load/dl/ok/tap/fail),fetch 流式按 content-length 计字节,失败自动重试一次;下载完未就绪最多算 97%。
- `sh-x-cockpit.js`:
  - 地球昼/夜/云三张贴图走 `SHXLD.img()`(fetch→blob→<img>,onload 才 ok);手机为内置 data: 贴图,立即就绪。
  - 星空:**不再另起下载**。1.0 首页启动时 `SHFX3D.upgradeSkies` 已在下 8K/4K 星空,cockpit 仍用 `SHFX3D.skyMesh`(共用同一贴图缓存),登记 `sky` 项,贴图 `ready` 才 ok。初版"先 pull 再建球"在无缓存头的服务器上会重复下 6 MB,已弃。
- `sh-x-ship.js` board():两条进度改为「模型 · 贴图」「声音 · 语音与舱内音乐」,读 `SHXLD.prog()`;声音 = 当前待命曲 + 语音清单 + a01/a02/a03/a06,下载后 `<audio>` canplaythrough 才 ok,8 s 未就绪(手机未授权预载)记「待点击启用」;AudioContext 进入后 1.2 s 仍未 running 也记「待点击启用」。
  - 全部就绪 → 「系统就绪」,最短 3.2 s 开门;有待点击项 → 按钮「进入驾驶舱 · 启用声音」(点击里 resume 音频);有失败项 → 「部分资源未载入 · 继续 ›」;45 s 上限自动开门并 toast。
  - 已删除「跳过」与 12 s 强制放行。`SHXLD.last` 记录开门原因与耗时(诊断用)。
- 样式:`sh-x-style.css` 末尾 `.bd-d`(当前载入项)、`.bd-go`。

### 测试(Playwright + SwiftShader,work/t27b.py)
- 390×844 手机,限速 1.5 Mbps:43 s 自然到「系统就绪」开门,10 项全 ok;星空只请求 1 次 sky-4k。
- 1024×700 桌面,限速 10 Mbps:10 项全 ok,只请求 1 次 sky-8k。
- 1440×900:SwiftShader 纯 CPU 渲染把主线程占满,连计时器都延迟(45 s 上限 60 s 才触发),环境性能问题,不代表真机;各项最终就绪。
- 无新增 JS 报错(控制台 ERR_FAILED 为测试脚本拦截外网请求)。

### 待办
- 真机复核:iOS Safari 未授权预载时是否走「进入驾驶舱 · 启用声音」。
- 下一步 C2.7c(深空抵达二选一 + 程序化星系/星云 + 船底座距离标签 + 远离后星座连线)。
