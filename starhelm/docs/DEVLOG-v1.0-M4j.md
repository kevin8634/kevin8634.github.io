# DEVLOG · 天枢 Starhelm v1.0-M4j · 2026-11-01 21:2x CST

- 类型:体验升级(星桥反向链接)
- sh.sundie「太阳会死吗?」三关完成语末尾加星桥 → 宙律「恒星为什么会发光?」(href ../nomoverse/stars/;/starhelm/x/ 因 <base href="../"> 同样解析到 /nomoverse/stars/)。与宙律 v0.7-α2 c6e2b04 的 nv.stars → sh.sundie 构成双向星桥。
- sw.js 缓存名 sh-v1.0.0-m4i → sh-v1.0.0-m4j(sh-d5-tasks.js 在 1.0 预缓存表中)。
- 自测:/starhelm/ 与 /starhelm/x/ × 1440×900、1024×768、390×844(WebGL/SwiftShader)、1440 无 WebGL、/x/ ?three=169,0 page error;链接可见且指向 /nomoverse/stars/。
- 只改 starhelm/sh-d5-tasks.js、starhelm/sw.js 与本文件。
