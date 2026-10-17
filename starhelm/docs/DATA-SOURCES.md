# 天枢 Starhelm · 数据与素材许可台账

> 创世计划 Genesis 07 · 天文 · 维护规则:新增数据源/素材先核对许可再接入;CC BY-NC 类商用前必须替换;云盘「07_天枢 Starhelm/开发文档」同步。最后更新 2026-10-18(M1)。

| 数据/素材 | 来源 | 许可/条款 | 用法 | 备注 |
|---|---|---|---|---|
| 地震 | USGS Earthquake Hazards Program,`summary/2.5_week.geojson` | 美国政府公共领域 | 浏览器直连;`quakes-fallback.js` 离线兜底 | 页脚致谢 |
| 星链轨道 | CelesTrak GP,`GROUP=starlink&FORMAT=CSV`(OMM) | 免费;使用政策:约 2 小时更新一次,Starlink 组每次更新只许下载一次,超限返回 403 / 封 IP | `LE.netcache` 本机缓存 2 小时,失败 2 小时内不重试;`starlink-lite` 内置快照兜底 | 2026-07-11 起新目标为 6 位编号,只有 OMM 格式可用 |
| ISS 轨道 | CelesTrak GP,`CATNR=25544&FORMAT=TLE` | 同上 | 同上,内嵌 TLE 兜底 | ISS 仍为 5 位编号 |
| 在线地名搜索 | Open-Meteo Geocoding API | 免费接口仅限非商业用途,数据 CC BY 4.0,每日 1 万次 | 仅在离线城市库查不到时兜底,只发送用户输入的地名 | 商业化(课程包)前订阅或替换 |
| 城市库 | GeoNames | CC BY 4.0 | 离线内嵌 `cities-lite` | 页脚署名 |
| 行星轨道 | JPL「Approximate Positions of the Planets」 | NASA/JPL 公开资料 | `planets-data.js` | |
| 地球贴图 | NASA | NASA 公开资料(不得暗示 NASA 背书) | data URI 内嵌 | 待逐张补出处 |
| 行星/星空贴图 | Solar System Scope | CC BY 4.0 | data URI 内嵌 | 页脚署名 |
| ISS 3D 模型 | NASA 3D Resources「International Space Station (ISS) (B)」 | NASA 公开资料 | 内嵌,已简化 | |
| 航线 | 自建 39 个机场坐标 | 自有 | `le-flights.js` | **示意航线,非实时航班**,对外称「航线示意」 |
| three.js 0.147 / OrbitControls / GLTFLoader | three.js | MIT | 本地副本 | |
| satellite.js 6.0.2 | shashwatak/satellite-js | MIT | 本地副本(含 OMM `json2satrec`) | 2026-10-17 由 5.0 升级 |
| 字体 Orbitron / Rajdhani | Google Fonts | SIL OFL 1.1 | base64 内嵌 | |
| 天宫空间站、哈勃望远镜轨道 | CelesTrak GP,`CATNR=48274` / `CATNR=20580`,`FORMAT=CSV` | 同上 | `LE.netcache` 本机缓存 2 小时;`sh-orbits-data.js` 内置快照(历元 2026-10-17)兜底 | M1 新增 |
| 导航卫星(GPS/北斗/伽利略/格洛纳斯)、静止轨道气象卫星 | CelesTrak GP,`GROUP=gps-ops/beidou/galileo/glo-ops/weather`(OMM,weather 只取静止轨道) | 同上 | **仅内置快照**(2026-10-17 下载一次),页面不实时请求 | M1 新增;已剔除军方气象卫星;快照约每季度手动更新 |
| 太阳/月球位置、月相 | 低精度解析公式(太阳:天文年历简式;月球:Meeus 简化项) | 公式,自有实现 | `sh-astro.js` 本机计算,精度约 0.5° | M1 新增 |
| 卫星过境预报 | satellite.js SGP4 + 自有可见性判定(仰角 >10°、卫星被照亮、观测地太阳 < −6°) | 自有实现 | 本机计算,不上传位置 | M1 新增 |
| 尺度与光行时常数 | 公开天文常数(地球直径、地月距离、天文单位、比邻星 4.24 光年、银河系约 10 万光年) | 事实数据 | 任务 #1 内置 | M1 新增 |
| 向导徽记(北斗七星) | 程序绘制 | 自有 | `sh-core.js` canvas | M1 新增 |
| 声音 | Web Audio 实时合成 | 自有 | `le-audio.js` | 背景音乐默认关 |

**已移除**:IP 定位 GeoJS、ipapi.co(2026-10-17,M0.5)——违反「定位默认关、只在本机计算」。

**隐私**:不自动定位;「用我的位置」由用户点击触发,坐标只在本机计算,不上传;手选城市只存本机 `gn:sh:settings`;任务进度只存本机 `gn:sh:where`、`gn:sh:orbit`,探索记录 `gn:sh:explore`。实时卫星、航线数据只做科普展示,不提供追踪特定个人或敏感目标的功能。
