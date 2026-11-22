# 天枢 v1.0-M4v · 实时数据外部请求收口(2026-11-22)

分支 sh-gus(接 5c48f96 M4u GUS 接收端之后),只改 /starhelm/;未推送。

## 背景
- 现状:即使 `gn:sh:live=0`(首页底栏「实时数据」总开关关),页面加载约 20 秒内仍发 9 个外部请求:
  GDACS TC 列表、GDACS EVENTS4APP(播报)、SWPC OVATION、SWPC Kp、SWPC 太阳风速度、SWPC 太阳风磁场、GIBS VIIRS ×3(实拍云图逐日重试)。
  原因:总开关(le-core.js `LE.live`)只管 CelesTrak / USGS / Open-Meteo;地球之眼、太阳风、播报在加载时就请求。
- 王磊定:这些实时数据保留,登记为允许的外部请求例外;但①总开关关时一个都不发;②懒加载,只在用户打开对应面板时拉取,加缓存,失败不报错。

## 总开关语义(grep 结果)
- 定义:le-core.js `LE.live`,键 `gn:sh:live`(默认开)+ 单项 `.iss/.quakes/.starlink/.geo`;`fetch` 包装与 `LE.netcache` 按 `LE.live.blocked(url)` 拦截。
- 界面:index.html 底栏 `#chip-live` → 面板 `#sheet-live`(le-ui.js 158 行起),应用后重新载入。
- 本单:`LIVE_HOSTS` 增 gdacs.org / swpc.noaa.gov / gibs.earthdata.nasa.gov / sdo.gsfc.nasa.gov。四家没有单项开关(`itemOf` 返回 null),只受总开关管;单项开关语义不变。图片与纹理(GIBS、SDO)不经 fetch,各模块请求前调用 `LE.live.blocked`。

## 改动
- le-core.js:LIVE_HOSTS 扩展;新增 `LE.netcache.peek(url)`(只读 Cache API,不发请求)。
- sh-cast.js(地球重要播报):加载时只 `peek` 本机缓存;点底部「载入灾害预警 / 更新 / 重试」或展开收起的面板才请求 GDACS(10 分钟缓存),之后面板展开时每 10 分钟刷新;总开关关:底部标「实时数据已关闭 · 不载入全球灾害预警(GDACS),只播本机计算的天象」。新增底部状态行 `.sh-cast__gd`(sh-hud.css 末尾 1 条样式)。
- sh-eye.js(地球之眼):「台风」「极光」图层改为默认关、第一次打开才载入(GDACS / SWPC 改走 `LE.netcache` 10 分钟缓存;台风 `SH.eye.ensureStorms(cb)` 同页只载一次,GIBS 台风帧随之载入);极光只在图层开着时每 30 分钟刷新;实拍云图(GIBS VIIRS)第一次点「云层」才载入,失败退回示意;总开关关:两个按钮标「实时已关」,台风点开提示、极光卡片标「实时数据已关闭」,`loadImg` 不取图。
- sh-swind.js(太阳风):删去加载即请求;打开图层才请求;总开关关时按约 420 km/s 示意并在卡片标注。
- sh-sun.js(太阳活动观测台):本来就是打开才请求;改走 `LE.netcache`(与太阳风共用 solar-wind-speed 缓存);总开关关:SDO 图与 NOAA 曲线都不请求,显示「实时数据已关闭」;取图失败的地址在同一 15 分钟缓存键内不重试。
- x/sh-x-weather.js(2.0 气象「气旋」):原先等 1.0 地球之眼自己载入,改为打开「气旋」时调用 `SH.eye.ensureStorms`(1 处)。
- index.html(/starhelm/):实时数据面板末行说明改为新语义。
- LICENSES.md:开头说明更新 + 新增专节「外部请求例外登记」(域名 / 用途 / 模块 / 触发时机 / 缓存 / 关闭时)。
- sw.js:`sh-v1.0.0-m4u` → `sh-v1.0.0-m4v`(改动的 le-core / sh-cast / sh-eye / sh-sun / sh-swind / sh-hud.css / index.html 均在预缓存清单)。

## 自测(playwright + chromium 1255 SwiftShader,本地静态服务,外部请求一律拦截;脚本与截图 /workspace/work/h/sh-live/)
- ① 首屏不点面板:五档 × live=0 外部请求 0;live=1 时四家例外域名 0(仍有 CelesTrak / USGS,属总开关原有管辖、加载即请求,语义未改)。
- ② live=0 打开播报 / 台风 / 极光 / 太阳风 / 云层 / 太阳观测台:五档外部请求 0、页面错误 0、降级文案正常。
- ③ live=1:每个请求只在对应动作之后出现;d1440 模拟数据(台风 1 个、Kp 5、C2.0 级)显示正常;其余四档 abort → 显示「暂不可用」、0 页面错误;关开重开不重复请求;d1440 重新载入后播报读本机缓存、例外域名请求 0。
- ④ ?gus= 浮层:d1440 / p375 / 减少动态正常,不出开场,进入天枢后也不补开场;无 ?gus= 时开场照常;外部请求 0。
- 0 本站 404。/x/ 子页 live=0 外部请求 0、0 错误。
