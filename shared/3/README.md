# /shared/3/ · 创世计划 3.0 共享内核 v0.1(2026-11-20,总指挥维护)

各世界 3.0 只引用、不复制、不覆盖。需要新功能或改接口,notify 总指挥。纯静态 ES 模块,无依赖、无 CDN、零外部请求。

| 文件 | 内容 | 主要接口 |
|---|---|---|
| tokens.css | 七色光桥、常数色(G 紫 / c 青 / α 金 / ε 橙 / Q 粉 / Λ 蓝白 / Ω₀ 银灰)、成功与失败语义色(失败用红外伪彩,不用刺眼红)、玻璃面板、亮度上限、动效时长与缓动、间距字号、触控 44px;`.gn3-glass` 基础面板,low 档自动换实底 | CSS 变量 `--gn3-*` |
| tier.js | 画质三档(与门户同一规则、同一 localStorage 键 gn:p3q,全站共用);软件渲染强制 low;FpsGuard <24fps 自动降档 | `pickTier()` `apply(tier)` `save()` `new FpsGuard(tier, onDrop)` |
| prng.js | 带种子随机(mulberry32 / sfc32)、RK4、速度 Verlet | `mulberry32(seed)` `sfc32(seed)` `rk4(f,t,y,h)` `verletStep(pos,vel,acc,h,accel)` |
| gus.js | GUS v0.1 星球互通:deflate-raw+base64url(无压缩流时 `j.` 前缀)、版本协商、范围校验与清洗、gn:gus:last / gn:gus:lib(20 个)、URL 读写 | `encode` `decode` `validate` `saveLast` `loadLast` `loadLib` `fromLocation` `toUrl` |
| undo.js | 快照撤销栈,上限 100,拖动合并一步,Ctrl/Cmd+Z、Shift+Z / Ctrl+Y | `createUndo(state,{onChange})` → `push/begin/end/undo/redo/bindKeys` |
| i18n.js | 语言(GN_LANG > gn:lang > 浏览器)、字典与两层文本、科学计数 3.34×10⁻¹¹、倍数 ×0.5、读屏文案 | `lang()` `makeT(dict)` `sci()` `mult()` `aria()` |
| selftest.js | `?selftest=1` 钩子约定:`window.__gn3[world]`(宙律另挂 `window.__nv3`)、错误收集 `window.__gn3err` | `register(world, api)` |
| shared3.test.mjs | 纯函数单测(node) | `node shared/3/shared3.test.mjs` |

## 引用方式
```html
<link rel="stylesheet" href="/shared/3/tokens.css">
<script type="module">
  import { pickTier, apply } from '/shared/3/tier.js';
  import * as gus from '/shared/3/gus.js';
</script>
```
SW:各世界自己的 SW 若要离线,把用到的 /shared/3/ 文件加进自己的预缓存清单(根 sw.js 不改)。

## 路线
- v0.1(本版):地基(tokens、画质、确定性、GUS、撤销、中英、自测钩子)。
- v0.2(下一步):原生玻璃组件——弹性滑块/玻璃旋钮(参考 React Bits Elastic Slider)、Count Up、Stepper、Compare 对比滑块(Aceternity)、Glass Surface/Spotlight 卡、Tilted Card、Multi Step Loader、迷你折线/雷达;音效开关。只用四站免费部分,原生改写,LICENSES 逐条署名。
- 通用自测脚本(四视口 + 减少动态 + 三档 + 软件渲染 + 离线二次,出 A–G 报告)。
