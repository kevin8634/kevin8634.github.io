# 宙律 Nomoverse 3.0 · 变更记录

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
