# DEVLOG 2.0 · C2.9b 星域 VII 第二批(2026-10-30)

## 内容
- 室女座星系团(键 `Virgo Cl`):真航点 RA 186.75° Dec +12.72°,5,400 万光年,半径取 400 万光年(停泊在中心外约 1,200 万光年)。
  - 舷窗程序化:16 个梅西耶成员(M87/M84/M86/M49/M60/M59/M58/M89/M90/M88/M91/M99/M100/M98/M85/M61)按 SH_DSO 真实 RA/Dec 角距摆放,旋涡/椭圆按形态分类,大小按视直径换算后 ×6 便于看清;另 160 个矮星系 + 背景星系点。
  - 照片:Rubin noirlab2521a 分层视差。
- 韦布深场 SMACS 0723(键 `SMACS 0723`):RA 110.83° Dec −73.45°,z≈0.39;Planck 2018(H0=67.66, Ωm=0.3097)换算:光行距离/回看时间 ≈ 43.3 亿光年/年,共动距离 ≈ 51 亿光年。飞行距离取光行距离(与其他目标的「光年」读数一致),资料卡区分共动距离。
  - 舷窗程序化:BCG + 38 个团员椭圆 + 70 个背景星系 + 8 条引力透镜弧(neb.js 新 uK=6 弧形 shader)+ 1,600 背景点。
  - 照片:JWST weic2209a 分层视差。
- `sh-x-neb.js`:新增 `k:'clu'`(成员精灵 [x,y,size,ell,rotDeg,palIdx,isSpiral,alpha]、arcs [r,angDeg,halfArcRad]、nbg、bgC);体积过渡排除 clu。
- `sh-x-cosmos.js`:DV 两条、`SHXCO.extra()/get()`;注册需 SH_DSO 已加载。
- `sh-x-catalog.js`:目录搜索可找到两条(不在 OpenNGC 表)。
- `sh-x-ladder.js`:航图 VI 两项改为可飞抵。

## 自测(work/t29a.py、t_nogl.py)
1440×900 Virgo+SMACS / 390×844 SMACS / 1920×1080 减少动态 Virgo / 禁用 WebGL:pageerror 0、本站 4xx 0、shader 错误 0;航图 11 个可飞目标全部注册。

## 已知
- 星系团成员的朝向/滚转为示意(billboard 朝向未对齐天球北)。
- 剩余星域 VII:宇宙网 + CMB(C2.9c)。BUG-01 仍暂缓。
