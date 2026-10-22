# 天枢 Starhelm · 3D 画面规范(v1.0-M2c 起,所有星域场景必须遵守)

公共件:`sh-fx3d.js`(SHFX3D)。新场景优先复用,不要各写一套。

## 1. 背景星空
- 一律用 `SHFX3D.skyMesh(renderer, r)`:NASA SVS Deep Star Maps 2020(赤道坐标),桌面 8K、手机/低内存 4K,失败退回 2K 贴图包。
- 星空球按黄赤交角放好(场景约定 x=春分点、y=黄道北),不再自己旋转。
- 星空材质 `toneMapped:false`、`depthWrite:false`,亮度用 color 压暗(0x4a–0xb8),不得盖过主体。
- 禁止用 2K 以下的全景图做主背景;禁止拉伸放大低清图。

## 2. 发光天体(恒星、吸积盘、星云核)
- 不用纯色球 + 一张光晕贴图。至少三层:着色器表面(噪声纹理 + 临边昏暗)+ 边缘壳层 + 面向镜头的冕/辉光平面。
- 太阳直接用 `SHFX3D.sun({radius})`,在渲染循环里调 `update(dt, camera)`。其他恒星按颜色/温度改着色器参数复用。
- 加色混合(AdditiveBlending)层一律 `depthWrite:false`。

## 3. 粒子
- 能"动"的现象用粒子表达:日珥、太阳风、彗尾、喷流、星际尘埃、航图光流。
- 粒子用软圆点贴图,sizeAttenuation 打开;单场景粒子总数桌面 ≤ 2 万、手机 ≤ 6 千。
- 粒子位置每帧在 CPU 更新时只改 BufferAttribute,不重建几何体。

## 4. 贴图与清晰度
- 主体贴图 ≥ 4K(行星 2K 起,镜头能贴近的 ≥ 4K);开 mipmap,anisotropy = min(8, 设备上限)。
- 渲染器 pixelRatio = min(2, devicePixelRatio);主场景开 antialias;行星场景用 ACESFilmic 色调映射。

## 5. 运动与无障碍
- `prefers-reduced-motion` 时动画速度降到 1/4,关闭自动旋转。
- 无 WebGL → 2D 退回,不得报错;WebGL1 → r147 兼容路径。

## 6. 比例与诚实
- 大小/距离压缩必须在画面角注写明"示意";方向、相位、时间按真实计算。
- 第三方素材(贴图、模型)入 docs/DATA-SOURCES.md,写来源与许可。

## 7. 性能自测
- 每个新 3D 场景:1600×900、390×844、减少动态、无 WebGL 四项零 page error;SwiftShader 下仍能出画面。
