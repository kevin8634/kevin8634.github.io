# 宙律 Nomoverse 3.0 · 变更记录

## v3.0-α7.1(α7 补测修复,2026-11-24,未上线)
- 修:α7 收尾时追加在文件末尾的 `.nv-toasts { bottom: 140px }` 覆盖了竖屏/矮横屏媒体查询里的 `bottom: auto`,手机竖屏 toast 区被同时钉住上下边、grid 行被拉伸成整屏高,盖住画质面板「跟随系统」等按钮(375×667 自测点击超时)。改为在基础规则里设 bottom 140px 并加 align-content: start,删掉末尾覆盖。
- 复核:568×320 结果栏「结局」等标签不竖排、「教学简化」注释在底栏之上(1440/1000)均通过;sw.js 版本 nv-v2.0-a2_v3.0-a7.1_s3-0.3。

## v3.0-α7(3-6 画质与可达性,含 S2 另一半,2026-11-22,未上线)
- 画质面板:顶栏 #q 按钮(显示当前档)打开「画质与动效」面板,Rubber Segment 选 低 / 中 / 高;软件渲染强制低档保持(选中档或高档会弹提示并播报)。三档预算(core/access.mjs QBUDGET):粒子 4096 / 16384 / 65536,像素比 1 / ≤1.5 / ≤2(手机封顶 1.5),后期 无 / HDR 目标 + 2×MSAA + 亮度钳制 + 暗角 / 再加 1/4 分辨率柔光 + 4×MSAA;低档玻璃 Phong、星云 5 团。
- GPGPU 星空(core/galaxy.mjs,three r186 本地,自研;效果参考 React Bits Galaxy):粒子状态存浮点数据纹理(64/128/256 边长),全屏着色器 ping-pong 更新位置(差速旋转 + 起伏,半径锁定不漂移),点精灵按 uv 读纹理;闪烁 ≤0.5 Hz、指针排斥;低档或无浮点渲染目标退普通点云。
- 亮度上限与防闪:后期在 AgX 前把线性亮度钳到 2.4;恒星光晕 ≤0.85(同 tokens glow-max);恒星亮度跳变过 FlashGate(任意 1 秒 ≤3 次)+ 指数淡入,拖滑块穿过点燃阈值不再频闪;大爆炸加一次半正弦光晕脉冲(峰值钳制、间隔 ≥1 s,减少动态不脉冲)。
- 减少动态:面板里 跟随系统 / 减少 / 完整(localStorage nv3.motion);生效时 html.nv-rm 全站动画与过渡静态化(提示与气泡只保留淡入),/shared/3/ 组件通过 reduced-motion 媒体查询同步遵守;3D 只出静帧、GPGPU 不步进。
- 触控 ≥44px:分段、锁定开关、题卡翻页/试试、换种子、命名框、时间线节点等全部 ≥44;自测枚举全部可点元素四档 0 个小于 44。
- Warm Tooltip:图标按钮(? 撤销 重做 画质 语言 换种子 大爆炸 返回 锁定)悬停 / 键盘聚焦 / 触屏长按显示暖色说明,Esc 关闭,aria-describedby 关联;长按不触发点击。
- Swipe Toast:原生 toast(降级、软件渲染、画质切换、动效切换、首次 Tab 键盘提示),可横向滑动关闭、×按钮 44px、悬停/聚焦暂停自动消失,减少动态下无位移动画。
- 读屏:新增 aria-live 播报区——大爆炸后播报关卡结果(通过几关、卡在哪关)、配方变化 1.2 s 后播报结局、降级提示;结果栏去掉整块 aria-live(原来每次拖动整栏重念);时间线节点改回按钮语义并写明「第 n 关 …:通过/失败」;舞台、侧栏、底栏、画质面板补 aria-label / role。
- 英文全量:新增 3-6 文案全部中英;页面标题、侧栏/舞台/面板 aria、引导按钮随语言切换;切 EN 后全页(含隐藏节点与 aria)除「中」语言切换钮外无中文。
- 横竖屏:375×667、568×320、1000×760、1440×900 与旋转(667×375↔375×667)自测无溢出;568×320 结果栏中文标签不再竖排。
- 内存:切档 dispose 旧星空(数据纹理、渲染目标、几何、材质)、后期渲染目标与材质、玻璃;同档 GPU 资源计数恒定;切档 10 次 JS 堆 3.9→4.6 MB。
- 新增 core/access.mjs(纯函数)、core/access-ui.mjs(3 组件)、core/galaxy.mjs、tests/access.test.mjs;sw.js 版本 nv-v2.0-a2_v3.0-a7_s3-0.3,预缓存加三文件;LICENSES 逐条署名。

## v3.0-α6(3-5 造物与 GUS,2026-11-22,未上线)
- 第三层「造物」:分段切换改为 基础 / 进阶 / 造物(?mode=make;带 ?gus= 或 &n= 的链接直接进造物)。
- 宇宙命名:输入框 + Decrypted Text 乱码揭字;空名按种子给确定的默认名(中英各一,如「静远宇宙 07」);名字去尖括号与控制字符、≤40 字。
- 作品卡(Profile Card 思路):随指针倾斜 + 全息光斑,低档与减少动态退成静态卡;Count Up 数值(年龄、行星、宜居、恒星温度);卡里 T7 恒星系由 Worker 速度 Verlet N 体实时积分(新 op "orbit" / nbody.trace,步长取最内行星周期 1/200,能量漂移实测 ~2e-6),canvas 播放,半径开方压缩(标注教学简化);减少动态时画整条轨迹不动。
- 带去天枢(Star Border):编码 GUS 跳 /starhelm/?gus=,超长走 @last;同时存 gn:gus:last;名字随 GUS 带过去。
- 复制分享链接(Glare Hover):?gus= 编码 ≤1800 用它,超长退 ?r= 紧凑配方 + &n= 名字;剪贴板不可用时退 execCommand,再不行把链接显示出来手动复制。
- 导出 JSON(nomoverse-<id>.gus.json,格式同 α5 不变)/ 导入 JSON(Aceternity File Upload 思路:点选或拖入;64 KB 上限;坏 JSON、非 GUS、别的 kind、缺常数各有提示;兼容 BOM 与 {data:gus})。
- 新增 core/create.mjs(纯函数)、core/create-ui.mjs(6 个组件)、tests/create.test.mjs(173);sw.js 版本 nv-v2.0-a2_v3.0-a6_s3-0.3,预缓存加两文件;LICENSES 逐条署名。行星上限 8 不变。

## v3.0-α5(3-4 探索层,2026-11-21,未上线)
- 基础 / 进阶切换(橡皮分段,localStorage nv3.mode;链接带进阶常数时自动进进阶;?mode=adv|basic)。
- 进阶加 4 个常数:ε、Ω₀ 用 /shared/3/ui.js 弹性滑块(带后果迷你图与真实值金色刻度、吸附);Q、Λ 用彗星旋钮(Q 对数 1e-7–1e-3,Λ 对称对数 −10–1000,金色真实值刻度 + Λ=0 虚线刻度,吸附到 1 与 0)。
- 液位表显示有效物质密度 Ωm(= Ω₀×G),临界密度 1 虚线;过 1 变紫(会回缩一侧),越线溅起。
- 种子翻牌 + 换种子;7 个常数与种子各一只锁定开关(localStorage nv3.locks);「随机宇宙」只动没锁的(真实位置附近 ±15% 刻度,约三成走通)。
- 题卡 10 张(叠牌可拖走、点击翻面、背面「试试」载入:真实宇宙 + 卡片改动,锁定的不改并提示);每张答案由单测核对能达成题目。
- 星桥:把当前恒星系编码成 GUS,跳天枢 /starhelm/?gus=(同时存 gn:gus:last);太阳系视图交给天枢,不参考 ThreeUI Orrery。
- 修 3-3 文案:ε 建议区间改为 0.0065–0.0075(原 0.006–0.008 两端不安全),ε 显示 4 位小数。
- 新增 core/explore.mjs(纯函数)、core/explore-ui.mjs(6 个组件)、tests/explore.test.mjs;sw.js 版本 nv-v2.0-a2_v3.0-a5_s3-0.3,预缓存加两文件;LICENSES 逐条署名。

## v3.0-α4(3-3 新手层,2026-11-21,未上线)
- 引导三步(首访自动,? 按钮重放,?guide=0 关闭,localStorage nv3.guide):拧 G 至少 2 倍 → 按大爆炸 → 卡片自动展开看卡在哪关;金色描边指目标,减少动态不闪;可跳过。
- 失败卡两层:第一层「卡在第 n 关」+ 一句话;第二层因果 + 当前数字 + 往哪拧;警告也出卡(第 n 关有点勉强);走通时卡片变「和真实宇宙比一比」。
- 真实宇宙对比:ui.compare 拖竖条,左真实值右你的宇宙(年龄、恒星表面温度、最重稳定元素、行星数、液态水),卡底署名出处与许可(SOURCES.md 新表)。
- ×1 吸附:G/c/α 在 ±4% 内吸到 ×1,滑轨上金色 ×1 刻度;键盘一步可离开吸附区。
- 点时间线某关出一句讲解(7 关中英)。
- 新增 core/teach.mjs(纯函数)与 tests/teach.test.mjs(74 项);sw.js 版本 nv-v2.0-a2_v3.0-a4_s3-0.3,预缓存加 teach.mjs。

## v3.0-α3(3-2 内核 + Worker + 渲染层,2026-11-20,未上线)
- `core/worker.js`:经典 Worker 包装 universe + scene + nbody;op run/sky/sweep/nbody;结果与直接调用逐位一致。`core/wclient.mjs`:Promise 客户端,最新请求优先,Worker 不可用自动回退主线程。
- `core/render3.mjs`:three r186 本地 vendor,只读 scene.describe();玻璃球薄壳(high/medium 清漆+虹彩,low Phong)+ 三层台座 + 恒星/行星/轨道蓝图线/宜居带环/球内星云/外圈种子星空;11 种失败按 failVisual.mode 换配色与特效(黑洞吸积环、霜雾、回缩脉动等);AgX 调色;像素比按档、手机 ≤1.5;隐藏暂停;减少动态只出静帧;无 WebGL 时 Canvas 2D 版。未用 transmission(透射通道会吞掉球内半透明物体)。
- 界面(/shared/3/ui.js):expandableCard 题问、3 个对数 slider(G/c/α)+ 后果迷你图(沿旋钮 24 点「通过关数」,Worker sweep)、countUp、timeline 7 关 + 大爆炸逐关揭示、失败卡;撤销/重做、画质切换(软件渲染强制 low)、中英切换。四档布局:桌面三栏、1000 宽收窄、竖屏下半屏抽屉、横屏矮屏压缩。
- `nomoverse/sw.js`:版本 `nv-v2.0-a2_v3.0-a3_s3-0.3`;预缓存 /nomoverse/3/ 12 个文件 + /shared/3/ 10 个文件;fetch 守卫单独放行 /shared/3/(缓存优先+后台更新)。2.0 逻辑未改。
- 新增 `tests/worker.test.js` 35 项。

## v3.0-α2(接 /shared/3/ v0.2,2026-11-20,未上线)
- rebase 到 shared v0.2(f41f5e4)。adapt.mjs 去掉已由 shared 覆盖的垫片:negotiate、tier current/set/onChange/budget/watchFPS、createStore(store.js)、i18n two/apply 改为直接用 shared;只留宇宙↔GUS、`?r=` 紧凑配方参数(作为 shared store 的 encode/decode)、自测钩子。
- 新增 `core/scene.js` 场景数据接口(3-2 渲染层的唯一输入):describe(res, budget) → 恒星/行星/宜居带/星空/失败视觉;orbitPos 开普勒求解;skyField 种子星空粒子;11 个失败码各有视觉模式。`tests/scene.test.js` 20/20;自测钩子加 `scene(preset)`。
- 测试:G1 翻转为「Λ=0/负值往返保留」,新增 crunch_s=null、大挤压 crunch_s 数值、derived heliumY/habitable/warnings/starLife_s 往返;接口测试 45/45。

## v3.0-α1(3-1 接口部分,2026-11-20,未上线)
- 入口骨架 `/nomoverse/3/`(noindex,不改 2.0 任何页面与 SW):引用 /shared/3/ tokens.css、tier、gus、undo、i18n、selftest、prng(只引用不复制),显示 7 关结果一行,`?selftest=1` 挂 `window.__nv3`。
- `core/adapt.mjs` 薄适配层:negotiate、encodeUniverse/decodeToRecipe(编码统一走 /shared/3/gus.js deflate-raw)、tier.detect/current/set/onChange/budget/guard、createStore(撤销 + 手势合并 + `?r=` 配方参数)、i18n t/two/apply、registerSelftest。
- `core/gus0.js` 数值层保留,新增 `starLifeSun_s` 对齐 shared 白名单。
- 删 `vendor/three.r169.module.min.js`(未被引用);LICENSES 修 three 来源为 r186,加 3.0 段与教育理念署名;SOURCES 标注待物理复核项。
- 新增 `tests/interop.test.mjs` 41 项(shared 编码 ≤1800,实测最长 1270 字符;mulberry32 逐位一致)。

## v3.0-α0(3-1 模型层,2026-11-20,未上线)
- 新建 `/nomoverse/3/`,只含纯函数与单测,无页面、无界面,不改 2.0 任何文件(2.0 cosmos 已冻结)。
- `core/universe.js`:宇宙配方台模型。配方 = G、c、α 倍数 + α 联动开关 + ε、Q、Λ、Ω₀ + 种子;按 T1–T7 判定 ok/warn/fail,11 个失败/警告码(含方案的 9 种失败可视化),确定性生成恒星系。
- `core/nbody.js`:速度 Verlet N 体(AU/年/M☉,G = 4π²·kG),可直接放进 Web Worker。
- `core/gus0.js`:GUS v0 宇宙侧数据层(toGUS / toRecipe / validate / j. 编解码)。URL 压缩、同源存储与版本协商留给 /shared/3/gus.js。
- `tests/universe.test.js`:111 项数值单测(验收关卡 C)。2.0 `tests/physics.test.js` 仍 172/172。
