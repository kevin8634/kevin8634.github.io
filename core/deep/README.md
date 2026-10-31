# /core/deep/ 深度组件库 v0.4
D0-2《深度组件库接口》v1.0 的实现。总指挥维护,七世界只引用不改。
- core.js:Depth(本机进度 gn:deep:<taskId>)、DepthBar、Formula(KaTeX 按需)、Card(本机 PNG,分享/下载,不上传)
- deep.css:样式变量
- katex/:KaTeX 0.16.11(MIT,仅 woff2 字体)
- 0.2:ParamPanel(滑杆+安全表达式)、ChainDrag(拖拽/键盘排序)、Expr(白名单 sin cos tan exp log sqrt pow abs min max,无 eval)、Sim + worker-sim.js(RK4)
- 0.3(2026-10-26):
  - Ledger 数据台账接口:validate(meta) / register / get / list / credit(id) 署名行 / toMarkdown() 导出 1.0 台账表。必填 id、title、source、license、retrieved(YYYY-MM-DD);url 须 https;许可含「非商业/NC」自动标 nc。
  - DataSet:load(src) 只读同源本地快照(运行时零外部请求),from({meta,columns,rows});meta 不全直接拒收。
  - DataChart.mount(el,{data,x,ys:[{col,label,color}],type:line|bar|scatter,xlabel,ylabel,height,from,to,marks:[{x,label}]}):canvas 2D、高 DPI、自适应宽度;悬停/键盘(←→ Home End)读数;读屏隐藏表格 + aria-label 摘要;图下自动署名(来自台账)。返回 {update(p),destroy()}。
  - 深空卡可选字段 chart:{data:"<文件>.json"(放 deep/data/),x,ys,type,xlabel,ylabel,from,to,marks}。
  - 自测页 test-datachart.html(noindex,不挂入口)。
- 0.4(2026-10-31):**创世实验室 Lab Kit**(lab.js + lab.css),七世界旗舰实验室统一用它,世界只写 JSON 协议,不改框架。
  - `import { Lab } from "/core/deep/lab.js"`;`await Lab.mount(el, "<同源协议路径或对象>", { color?, onRecord?, onBridge? })` → `{ protocol, values(), redraw(), last(), destroy() }`。
  - 功能:① 先猜再看(未选猜测前结果遮罩,猜完显示对错与解释并自动记入记录本)② 变量滑杆(复用 ParamPanel)③ A/B 对照(B 组只能改一个变量,其余跟随 A,自动报差别最大处)④ 证据等级 + 安全标签徽章 ⑤ 结论逐条带证据等级 ⑥ 实验记录本(键 `gn:<世界码>:lab`,仅本机,最多 60 条,可导出 JSON)⑦ 复现链接 `#lab=<id>&p=k:v,...&b=k:v,...`(无账号,打开即复现)⑧ 图片卡(复用 Card)⑨ 模型自动校验(checks 对参考值,徽章显示「模型校验 n/m」,不通过 console.warn)⑩ 实测数据叠加(复用 DataSet/DataChart,自动署名)。
  - `Lab.validate(p)` 返回问题列表;`Lab.selfCheck(p)` 返回校验结果;`Notebook`、`shareHash` 亦导出。
  - 示例:labs/ef.lab.iron.json(铁从哪里来 · 液滴模型 vs AME2020 结合能);自测页 test-lab.html(noindex,不挂入口,含 ODE 衰变自测)。

## Lab 协议 gn-lab/1
| 字段 | 必填 | 说明 |
|---|---|---|
| schema | ✓ | 固定 `gn-lab/1` |
| id | ✓ | `<世界码>.lab.<名>`,如 `ef.lab.iron` |
| world | ✓ | 两位世界码(ma nm ef ls ps lt sh),与 id 前缀一致 |
| title / question | ✓ | 实验名 / 核心问题 |
| evidence | ✓ | 整体证据等级 `confirmed`已证实 / `inferred`推测 / `conjecture`猜想 |
| safety | ✓ | `green` 可在家安全做 / `yellow` 需成人陪同或实验室 / `red` 危险仅虚拟演示;非 green 可加 `safetyNote` |
| params | ✓ | `[{k,label,min,max,step,value,unit}]`,k 为合法标识符 |
| model | ✓ | `fn`:`{x:{k,from,to,step} 或 {k,from:"data"}, defs:[{k,expr}] 中间量(按序), ys:[{label,expr,color?}]}`;`ode`:`{state:{N:1000}, rhs:{N:"-k*N"}, dt, steps, every, show?, labels?}`(RK4 Worker)。表达式走 Expr 白名单,无 eval |
| data | | `{src(同源相对路径,相对协议文件), x, ys:[{col,label,color?}]}`,须过数据台账 |
| chart | | `{xlabel,ylabel,type,height,from,to,marks:[{x,label}]}` |
| readout | | `max`/`min`:无 A/B 时显示当前最高/最低点 |
| ab | | `{vary:"<默认对照变量>"}` |
| predict | | `{q, options:[...], answer:<序号>, why}` |
| conclusions | | `[{text, evidence}]` |
| checks | | `[{label, x, expect, tol?, params?, y?}]` 模型自动校验(默认容差 1%) |
| bridges | | 星桥 id 数组,点击回调 `onBridge(id)` |
| sources / ai_generated / updated / unit / color | | 来源、AI 标注、更新日期、单位、世界主色 |
- 已知:core.js DataChart 的读屏表格在长数据时会撑高页面(表格无视 height),Lab 内已用 `.gl figure.dc{overflow:hidden}` 规避;深空层如遇同问题可同样处理(待下次 core 修订)。
