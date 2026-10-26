# 天枢 Starhelm · 2.0 穿梭 C0.5 开发日志(天枢号 + Armilla)

日期:2026-10-26 · 只改 /starhelm/x/ 与 docs/build/build_x_index.py

## 新增
- `x/sh-x-ship.js`(SHXS):挂在 SHXC 驾驶舱钩子上(`SHXC.on(ev)`:open / close / frame / decel / arrive / hover)。
  - **Armilla**:底部正中光环形象(手写 SVG,待机慢转 / 说话快转 + 核心跳动 / 警告橙光),字幕条;点光环 = 开语音 + 重播上一句。
  - 台词按 `genesis_brief/07_Armilla语音脚本_v1.md` v1.1:a01–a20 整句 + 拼接片段(引擎名、动作、数字逐字、单位)。语音包未到位时只显示字幕;到位后放 `x/armilla/manifest.json`(items:id/text/file)+ `x/armilla/voice.js` 设 `window.SHX_VOICE=true`。
  - **航行规划**(N / 航图按钮):检索星球、选目标、选引擎(复用 1.0 弦穹号 `SH.voyData.engines`,标实测/推断/猜想)、航程预览(真实耗时由 `SH.voyData.travel` 计算,演示压缩秒数单列)→ 播报 → 3-2-1 倒计时 → 自动驾驶。
  - **巡航 / 引擎加速**(C):巡航限速 100 km/s、倍率 ≤×1000(`S.capV`);加速 = 原自动驾驶 + 大倍率。
  - **侧舷窗观测**(V):Armilla 接管;远处先自动飞抵,到达后 **卫星式巡航**(绕目标一周约 80 s 演示,toast 给真实轨道周期),HUD 隐去,只留舷窗框与 Armilla;W/S 或再按 V 交还控制。到达时若非舷窗模式,弹出「AI 接管 · 卫星式巡航 / 我自己飞」。
  - **安全**:朝太阳高速逼近 20 R☉ 内自动停车 + 警报(a12);贴近悬停(a13)。
  - **摄影模式**(P)、**航行日志**(只存 localStorage `gn:sh:x-log`)。
  - **音响**(M):音乐 / 音效 / 语音三个独立开关 + 音量 + 下一首,**全部默认关**。音乐按场景自动切换(待命 idle、巡航 cruise、加速 boost、环绕 orbit,交叉淡入淡出)。音效 Web Audio 程序合成:航行底噪随速度,十种引擎各自启动/持续/关停音色,按键、警报、倒计时。
  - **第一人称 HUD**:左右面板 perspective 偏转,转向时视差平移,速度越快轻微晃动;减少动态时关闭晃动与光环动画;四周轻暗角。
  - **字号**:全局 +1–1.5px,桌面 ≥1100×700 整体 zoom 1.18,≥1600×900 zoom 1.3;操作面板默认收起。
  - 巡天子页里 `SH.voyEnter` / `SH.voySetTarget` 改为进入天枢号驾驶舱(不再显示 1.0 弦穹号外部飞船)。
- `x/audio/`:四首 CC0 音乐(见 x/LICENSES.md)。
- `sh-x-cockpit.js`:只加钩子(emit)、`X._` 内部接口、`S.capV` 限速;行为不变。

## 音乐映射
| 场景 | 文件 | 曲目 |
|---|---|---|
| 待命 | bgm-idle.mp3 | Space Echo · Centurion_of_war |
| 巡航 | bgm-cruise.mp3 | Space Music: Out There · yd |
| 加速 | bgm-boost.mp3 | Magic Space · CodeManu |
| 环绕/到达 | bgm-orbit.mp3 | Outer Space Loop · wipics |
| 跃迁 | 暂无独立曲目,C2 再定 | — |

## 待办
- 09_armilla 语音包与形象到位后接入(manifest)。
- C1 引力弹弓、C2 跃迁(a15/a16/a17 已留接口)。
- 2.0 开场动画:概念图已出(build/opening2/),待王磊确认。
