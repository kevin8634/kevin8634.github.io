# /core/deep/ 深度组件库 v0.3
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
