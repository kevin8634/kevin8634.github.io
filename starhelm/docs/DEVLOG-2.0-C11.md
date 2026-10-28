# DEVLOG 2.0 · C2.2 系列(2026-10-28)

> **10:55 CST 王磊要求暂停交接。** 本轮只完成并上线 C2.2a(T4,86b1c76);T2 及其后各项未开始写代码,无未推送补丁(工作区干净)。T2 的数据已拉取整理在 docs/C2.2-T2-PREP.md。

王磊 10-28 批准 C2.2:先 T4(C2.2a),再 T2(C2.2)。只改 /starhelm/x/ 与 starhelm/docs/;1.0 文件、根门户、根 sw.js、其他世界、/core/deep/ 未动;不用 WebGPU,three r186 与 ?three=169 回滚路径保留。开工前 `git fetch`:origin/main = 4d69339,starhelm/ 无更新提交。

## C2.2a 侧舷窗偶发全黑(排期 T4)

### 复现
新增自测 work/t_t4.py(Playwright + SwiftShader,拦截外网,/starhelm/x/?nosw=1):进驾驶舱 → 地球卫星式巡航进侧舷窗 → 压测(四种引擎特效反复开关、视口 390↔1920↔300×200 及驾驶舱根节点高度 0 时开曲率特效、visibilitychange、主画布与舱体 loseContext/restoreContext、额外新建 18 个上下文),每步截图并统计窗洞区域亮度、读 `isContextLost()`;用 `getContext` 钩子记录页面上每个 WebGL 上下文的创建栈。

- 主画布 `loseContext()` 后的画面与王磊截图一致:窗洞里全黑,只剩玻璃上的全息角标细线(work/out/t4_lose_lost.png)。
- 旧代码(4d69339)下 resize / 0 尺寸 / 特效切换 / visibilitychange 都**不**会黑;只有主画布上下文丢失会黑,而且被浏览器强制回收时不会 restored,一直黑(t4_old_evict_black.png)。
- 用 `--max-active-webgl-contexts=4` 模拟手机的上下文上限:旧代码**第一次点「侧舷窗」就黑**,丢失顺序 stage → probe → 开场 → 驾驶舱主画布(t4_old_limit4_port.png);新代码同条件正常(t4_new_limit4_port.png)。

### 根因:WebGL 上下文预算耗尽,驾驶舱主画布被浏览器强制回收
进侧舷窗那一刻,页面上已经建过 9 个 WebGL 上下文,活着的有 8 个:

| # | 来源 | 情况 |
|---|---|---|
| 1 | 1.0 sh-scene.js probe | 1.0 自己释放 |
| 2 | 1.0 舞台 stage | 1.0,保留 |
| 3 | x/sh-x-open.js glOK() probe | **只探测不释放** |
| 4 | x/sh-x-open.js 开场 renderer(全屏) | **开场结束后一直占着** |
| 5 | 驾驶舱主 renderer | — |
| 6 | x/sh-x-armilla.js ok() probe | **只探测不释放** |
| 7 | Armilla 光环 renderer | 保留 |
| 8 | x/sh-x-port.js canGL() probe | **只探测不释放** |
| 9 | 侧舷窗独立透明 renderer | **进侧舷窗时新建** |

浏览器同时存活的上下文有上限(Chrome 桌面 16,手机/低内存设备更低),超过就强制丢失最旧的那个,而且这种丢失不会自动恢复。驾驶舱主画布建得早,排在前面;进侧舷窗新建的第 9 个(加上讲解卡小窗、1.0 各视图)就把它挤掉了,外面那层舱体画布还在,于是看到「窗里全黑 + 细线」。C1.8d 推断的「贴在行星夜面」不是这个现象的成因(夜面仍有星空与光晕)。

### 修复
- **侧舷窗不再新建上下文**:舱体改由驾驶舱主 renderer 画,挂在新增的 `SHXC.layers.post`(引擎特效上屏之后,所以舱体不会被曲率/虫洞特效扭曲),ACES 色调映射只在这一层临时开启。窗外 DOM 标签按窗洞像素范围 clip-path 裁剪,目标框落在舱壁上时隐藏(原来靠独立画布盖住);侧舷窗模式隐藏底部署名行(原来同样被盖住)。
- **三处 probe 探测完立即 `WEBGL_lose_context.loseContext()`**(开场、Armilla、侧舷窗已改为直接看主 renderer)。
- **开场结束释放 renderer**(dispose + forceContextLoss,重播时 setup() 重建)。
- **日球层讲解卡小窗**:卡片关闭 1.5 s 后释放上下文(卡片淡入那一帧不算关闭),下次打开再建。
- 结果:进侧舷窗时活着的上下文从 8 个降到 3 个(1.0 舞台、驾驶舱、Armilla)。
- **主 renderer 丢失自动恢复**:监听 webglcontextlost(preventDefault,丢失期间不渲染);能 restored 就沿用(three 重新上传资源,特效 RT 重建);2.5 s 内没恢复(强制回收)就换新画布新建 renderer,纹理/几何体由 three 按需重新上传,舱体随 `renderer` 事件重建;回到前台(visibilitychange)时检查上下文与尺寸。
- **尺寸为 0 不渲染**:驾驶舱根节点宽或高 <2 时跳过整帧;画布尺寸与视口不一致时先补 setSize;`SHXFX.begin` 在绘图缓冲 <2 像素时不走离屏 RT。
- **全黑采样自愈**:每 3 s 在同一帧内读 9 个 4×4 小块,连续 3 次全为 0 → 先软复位(释放特效 RT、复位渲染状态、重设尺寸),再黑 → 重建 renderer。本轮所有自测 heal 计数为 0(无误报)。
- 调试:`SHXC.health()` 返回 {lost, nLost, restored, rebuilt, heal, w, h};`SHXC._rebuild()`;`SHXFX.reset()`。
- 性能三档、手机像素比 ≤1.5 不变(舱体随主 renderer 像素比)。

### 自测(本地 http.server 8813,拦截外网)
| 档 | 结果 |
|---|---|
| 1440×900 侧舷窗压测(t_t4 fx/resize/vis/lose/evict/many) | 0 页面错误、0 本站 404;特效/缩放/0 尺寸/前后台后画面正常;loseContext→restore 恢复;强制丢失不恢复时 2.5 s 后重建(rebuilt=1)画面恢复;额外 18 个上下文挤占后同样重建恢复 |
| 1440 / 1920 / 390 / 禁用 WebGL(t_t8 回归) | 0 错误、0 404;390 画布像素比 1.5;讲解卡小窗正常;禁用 WebGL 不开驾驶舱、无错误 |
| 390×844 侧舷窗 lose/restore | 恢复正常(t4_390_restored.png) |
| ?three=169 1920 强制丢失 | THREE r169,重建恢复,0 错误 |
| 减少动态(t_t8 reduced) | 0 错误,粒子静止 |
| t_t1 回归(星座插画) | K 三档、85 张插画 200,0 错误 |

截图(work/out/,已逐张查看):t4_lose_lost(复现画面)、t4_old_evict_black / t4_old_limit4_port(旧代码黑屏)、t4_new_limit4_port、t4_evict_evict_rebuilt、t4_390_port / t4_390_restored、t4_r169_rebuilt、t4_fx_fx、t4_resize_resize、t4_vis_vis。

### 已知
- 1.0 舞台(stage)与 Armilla 光环没有丢失恢复逻辑:极端挤占下它们会先于驾驶舱被回收(本轮减少了上下文数,正常使用不会到这一步)。1.0 不在本次修改范围。

## 暂停时状态(10:55 CST)
| 项 | 状态 | 做到哪一步 |
|---|---|---|
| T4 侧舷窗偶发全黑(C2.2a) | ✅ 已上线 86b1c76 | 四档 + r169 + 减少动态 + t_t1/t_t8 回归通过;线上 sh-x-port.js / sh-x-cockpit.js / index.html / 本文件 curl 200,内容为新版 |
| T2 卫星与彗星(C2.2) | 未开始写代码 | 已拉 JPL SBDB 彗星根数(1P/67P/C/1995 O1/2P,full-prec)与 JPL SSD 卫星平均根数,设计草案写在 docs/C2.2-T2-PREP.md;原始 JSON 在工作区 work/out/sbdbf_*.json(不入库) |
| 恒星信息卡布局(王磊 10:16 追加,C2.2b) | 未开始 | 现状:x/sh-x-pick.js 的 #xk-card 固定 right:14px top:64px,与右上目标面板 .p.tgt(right:16px top:14px)同位重叠;需改为与目标面板同列堆叠/限高滚动,手机底部抽屉,卫星/彗星卡同套布局 |
| 「结束探索」偶发点不动 / 「数据」按钮无反应(10:21 追加,并入 C2.2b) | 未开始 | 初步判断(未验证):「数据」#xc-more 只切换 #shxc.more,而 .more 只在 ≤900 px 宽的媒体查询里显示 .nav,桌面端本来就显示,所以点了没有任何可见变化;「结束探索」需按要求压测 elementFromPoint 找遮挡层 |
| C2.2c 远景标签 LOD + 太阳系一镜到底(10:20 追加) | 未开始 | — |
