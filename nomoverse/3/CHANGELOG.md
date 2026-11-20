# 宙律 Nomoverse 3.0 · 变更记录

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
