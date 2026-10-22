# 天枢 Starhelm · v1.0-M2c 开发日志(2026-10-22)
## 一句话
统一航图(外场 HUD 与弦穹号合并为一张 3D 全息航图)、到达已开放星域直接进入 3D 场景、新太阳与高清星空,定下 3D 画面规范。
## 改动
- sh-atlas.js 重写:Three.js 全息沙盘(七星域 + ∞ 猜想,环上流动粒子、三层星尘),星域卡;外场「跃迁前往 / 驾驶弦穹号前往」,航行中「设为目的地 / 进入 3D 场景」。无 WebGL 退回 SVG。
- sh-voyage.js:航图按钮改开 SHATLAS;到达已开放星域 → 星璃一句话后自动离舱 SHDOM.go(n);星域开放状态从 SHHUD.DOMAINS 同步(星域 III 已显示已开放)。新增 SH.voySetTarget / voyReady / voyLand。
- sh-fx3d.js(新):SHFX3D 高清星空(NASA SVS 8K/4K)、母港/太阳系场景自动换星空、可复用太阳(米粒组织、黑子带、临边昏暗、色球、日冕射线、日珥粒子、太阳风粒子)。
- sh-domain2.js:接入新太阳与 8K 星空,ACES 色调映射。
- docs/3D-VISUAL-RULES.md:后续 3D 场景必须遵守的画面规范。
## 自测
1600×900、390×844、1024×768 减少动态、?domain=2/3、无 WebGL、航行→航图→降落星域 III;零 page error。
