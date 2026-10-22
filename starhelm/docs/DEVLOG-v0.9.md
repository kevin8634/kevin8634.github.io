# 天枢 Starhelm · 开发日志 v0.9「收尾版」

## v0.9.0 · 2026-10-22 · Three.js r147 → r169 + 共享场景模块 + 性能档位

**做了什么**
- 新包 `vendor/three-r169/three.p1–13.js`(three@0.169.0 + OrbitControls + GLTFLoader,esbuild 打成经典脚本 `window.THREE`,MIT LICENSE 随附)。不走 CDN。
- 包内 r147 兼容层,旧场景代码不改即保持原观感:
  - `ColorManagement.enabled = false`(r147 等价);渲染器默认输出线性,`outputEncoding`/`texture.encoding`/`sRGBEncoding` 映射到 colorSpace(r152 变更)。
  - `encodings_fragment` 片段名映射到 `colorspace_fragment`(r154 改名)。
  - 光源强度 ×π、点光/聚光默认 decay=1,还原 r147 非物理光照(r155 变更)。
  - `capabilities.isWebGL2` 补回;`setPixelRatio` 统一按档位封顶。
- 新模块 `sh-scene.js`(Three.js 之前同步加载):检测 WebGL2 → 加载 r169;只有 WebGL1 → 加载旧 r147;无 WebGL → 仍加载 r147 数学类,各模块走原有 2D/静态版,功能不减。
- 性能档位:high(像素比 桌面≤2/手机≤1.5)、mid(像素比≤1.25,`SHGFX.particles()` 装饰粒子减半)。自动判定:手机、软件渲染、≤4 核或≤4GB 内存 → mid。
- 顶栏声音按钮组新增「◇ 画质」按钮:自动 → 高 → 中 → 兼容(r147),存 `gn:sh:gfx`,刷新生效。
- SW `sh-v0.9.0`:预缓存 r169 包与 sh-scene.js;r147 旧包与 three-vrm 移出预缓存(降级时运行时缓存)。

**自测(playwright + SwiftShader)**
- r147 与 r169 同场景 A/B 截图逐一对比(1440×900):地球首页(含地球之眼)、太阳系、where、orbit、seasons、sats、quakes、eclipse、tide、sun、moon、星档馆、弦穹号飞船/航图。平均像素差 0–4(动画时刻差异),亮度一致,无 page error。
- 1024×768:auto / high 两档全场景无 page error。
- 无 WebGL + 减少动态:首页、where、moon、sats、seasons 走 2D 版,无报错。

**未做(按计划放后续)**
- 守星人改名、删 three-vrm.min.js/xingli.vrm、许可台账与 AI 标注 → v0.9.1。
- 桌面/平板性能抽查报告 → v0.9.2。
- 各场景逐步改用 `SHGFX.particles()` 减装饰粒子,随 v0.9.2 抽查按需接入。

## v0.9.1 · 2026-10-22 · 守星人改名 + 清理 + 合规标注

- 向导改名「守星人」(王磊 14:40 确认):I 北辰、II 羲和与望舒、III 岁星、IV 星槎、V 织女、VI 银汉、VII 太一。改动:sh-data.js 向导表(名字、英文、开场白)、sh-voyage-data.js 星域表、7 个实验室标题、航行横幅「守星人 ×××」。向导 id 沿用旧值作内部键,进度 gn:sh:* 不受影响。向导徽记仍为世界图腾北斗七星,按星域序号点亮。
- 删除停用文件 three-vrm.min.js、xingli.vrm(M1.6a 起已不加载)。
- 许可台账:补 ship25 / hub25(AI 辅助概念图)两行,three-vrm / xingli.vrm 标为已删除。
- AI 标注:航行页署名改为「驾驶舱、飞船与星璃形象:天枢原创设计图(AI 辅助生成)」。
- SW sh-v0.9.1。
