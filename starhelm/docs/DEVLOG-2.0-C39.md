# DEVLOG 2.0 · C39 · C2.13a2 星系团成员 3D 粒子化 + 本星系群体积感(2026-10-31)

## 改动
- `x/sh-x-neb.js`(星系团/深场 k:'clu'):成员星系由平面精灵(cloud)改为真 3D 粒子
  - 椭圆星系:3D 高斯/de Vaucouleurs 近似椭球星点,按扁率压缩;
  - 旋涡星系:按视扁率换算倾角的 3D 盘面星点(双臂)+ 核球 + 沿臂暗尘吸收粒子;
  - 引力透镜弧(SMACS 0723):绕团中心的薄弧形 3D 粒子带,团块化、亮度降低;
  - 成员按类型合批为 4 个 Points(椭圆 / 盘 / 尘 / 每条弧),手机 ×0.35。
  - 适用:室女座星系团(16 个梅西耶成员 + 160 矮星系)、SMACS 0723(BCG + 38 成员 + 70 场星系)。
- `x/sh-x-lg.js`(本星系群):
  - 旋涡:新增 3D 椭球恒星晕淡光;新增沿旋臂内缘的成串丝状暗尘(r ≥ 0.3R);原臂尘在内区(r < 0.4R)按 (r/0.4R)² 衰减,去掉 M31 中心粗黑螺线。
  - 椭圆:新增大而淡的弥散体积光。不规则(LMC/SMC):新增盘面弥散体积光。
- `x/index.html` 由 build_x_index.py 重新生成。

## 测试
- work/t_lg6.sh(desk/hd/mob/nogl/rm/t169):页面错误 0、本域 4xx 0;nogl 2D 降级;穿门返回正常。
- work/t_nbclu.py(desk/t169/mob):航行至室女座星系团、SMACS 0723 后舷窗观测,错误 0。

## 遗留
- LMC 中心偏亮、M1 纤维辨识度;`?view=galaxy` 自动打开全景旧遗留;OneDrive 归档 C38/C39 待用户方便时。

## C2.13a3 热修(12:5x)
- BUG:C2.13a 起,银河全景构建时会预建本星系群 #xlg 浮层(opacity 0、z-index 97、未隐藏),透明层盖住全景,吃掉所有点击/拖动/滚轮 → 王磊反馈「进去后无法操作」。修:#xlg 创建即 display:none,且 :not(.on) pointer-events:none。
- 深链 ?view=galaxy 从未被处理(views.js 只认 earth|leo|solar|sky|fly),1.0 星域 VI 跳转后只停在地球页。修:sh-x-galaxy.js 自行识别 ?view=galaxy,页面就绪后打开全景(无 WebGL 时约 12 秒后打开 2D)。
- 测试 work/t_vg.py / t_vg2.py:真实鼠标拖动、滚轮、预设按钮、关闭按钮均生效;desk/nogl/t169 0 错误。
