# 天枢 v1.0-M4f · 实时数据单项开关(2026-10-27,总指挥令 10-27 20:1x · A;王磊 20:22 确认方案)
- le-core.js:LE.live 加 items / itemOf / itemOn / setItem / count;单项键 gn:sh:live.iss / .quakes / .starlink / .geo(默认开)。请求归属:USGS→地震;Open-Meteo→城市搜索;CelesTrak GROUP=starlink→星链;其余 CelesTrak(ISS、天宫、哈勃单星)→空间站。fetch 与 netcache 拦截沿用 blocked(url)。
- index.html #sheet-live:总开关 + 4 个单项开关(开时写数据源与有效时间,关时写所用快照);有改动才出「应用并重新载入」。
- le-ui.js:面板逻辑重写;底栏芯片显示「实时数据 / 实时 n/4 / 实时已关」;地震、星链状态标签按单项判断。
- le-style.css:.sh-live-* / .sh-tg 开关样式。
- sw.js:缓存 sh-v1.0.0-m4f;导航请求跳过 /starhelm/x/(2.0 子页不再覆盖 1.0 首页缓存,状态卡待定项)。
- 与方案差异:单项切换改为「应用并重新载入」一次生效(各图层模块初始化即取数,热切换需改模块,超出 1.0 小改范围)。
- 自测(Playwright,外网拦截):1440×900 默认 / 1920×1080 默认 / 1920×1080 关地震+星链 / 390×844 关星链 / 总开关关 / 禁用 WebGL:0 页面错误、0 本站 404;关掉的项无对应请求,NOAA/GDACS/GIBS 不受控(符合说明)。
- 台账 LICENSES.md 实时条目补单项开关。
- 2026-10-27 20:4x 总指挥复核台账签字通过;与方案差异「应用并重载、非热切换」已接受。纪律:方案报王磊确认前不上线。
