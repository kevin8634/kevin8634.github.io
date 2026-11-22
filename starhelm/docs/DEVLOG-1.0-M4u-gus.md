# 天枢 Starhelm · DEVLOG v1.0-M4u · GUS 接收端(2026-11-22)

**做了什么**:宙律 3.0「星桥」跳到 `/starhelm/?gus=…` 后,天枢弹出「来自宙律的恒星系」浮层(`sh-gus.js`,纯自研,原生 JS + 2D canvas,零依赖、零外部请求)。

## 链接格式(读方兼容三种,以 /shared/3/gus.js v0.1 与 nomoverse/3/core/gus0.js 为准)
| 形式 | 谁写 | 说明 |
|---|---|---|
| `?gus=<base64url>` | shared `gus.encode`(浏览器有 CompressionStream 时的默认) | deflate-raw 压缩的 UTF-8 JSON;本端用 DecompressionStream 流式解压,>256 KB 中止 |
| `?gus=j.<base64url>` | gus0 `encodeJ` / shared 回退 | 无压缩 JSON |
| `?gus=@last` | 宙律 α5 星桥在链接超 1800 字符时 | 读同源 localStorage `gn:gus:last` |
| 无参数 | — | 仅当 referrer 是同源 `/nomoverse/` 且本机有 `gn:gus:last` 时兜底打开 |

浏览器不支持 deflate-raw 解压时,自动改读 `gn:gus:last` 并在浮层注明。

## 校验(越界即拒收,不报错,只给中文提示)
- `gus` 必须 `0.x`,`kind` 必须 `universe`。
- 恒星:质量 1e28–1e33 kg、光度 1e18–1e33 W、半径 1e3–1e12 m、表面温度 500–100000 K;rgb 三个 0–1 数,否则用默认色。
- 行星 ≤ 12 颗(宙律当前最多 8);每颗 a 1e9–1e15 m、周期 1e3–1e14 s、半径 1e5–1e9 m、e 0–0.99;kind 不认识按岩质;id 只收 `[A-Za-z0-9_-]{1,12}`。
- 名称去控制字符/尖括号/双向覆盖字符,≤ 40 字;全部用户字符串只走 textContent,文件里没有 innerHTML。
- sources 只收 `https://kevin8634.github.io/…`,改写成同源路径。

## 界面
- 左:恒星按 rgb 着色、按 √(R/R☉) 相对大小;行星椭圆轨道(半长轴对数缩放、e、phase0 起始相位,恒星在焦点,开普勒方程求位置),最内侧行星约 7 秒一圈,其余按周期比例;宜居行星绿色高亮加环。
- 右:名称、id/seed、宇宙结局与失败原因、温度/光度/质量/半径/行星数/宜居数、行星清单、「简化模型」标注与出处链接;按钮「← 回宙律」(带回同一条 gus,宙律可复原配方;坏链接时回 /nomoverse/3/)与「关闭,进入天枢」(同时把 gus 从地址栏去掉,刷新不再弹)。
- 语言:天枢本体只有中文;浮层默认中文,全站 `gn:lang`/`GN_LANG` 显式为 en 时用英文;右上角 EN/中 只切本浮层,不写全站设置。
- 减少动态:静态一帧不公转;窄屏 375×667 上下排、横屏 568×320 左右排,按钮行吸底。Esc 关闭,Tab 不跑出浮层。
- 开场:`sh-opening.js` 深链判断加入 `gus`(以及 `SHGUS.active`),星桥落地不播开场。
- SW:`sh-gus.js` 加入预缓存,版本 `sh-v1.0.0-m4u`。

## 自测(playwright 1.48 + chromium,本地静态服务器)
链接由 `NV3_UNIVERSE.run` + `NV3_GUS.toGUS` 生成,按 shared encode 规则 deflate-raw 编码:默认宇宙、随机宇宙(5 行星)、kG×3 失败宇宙、j. 无压缩、@last,以及 4 条坏链接(截断 JSON、非法字符、截断压缩流、13 颗行星)和 1 条注入名称。五档 1440×900 / 1000×760 / 375×667 / 568×320 / 减少动态:0 页面错误、0 本站 404、sh-gus 不产生外部请求;不带 gus 时开场照播。
