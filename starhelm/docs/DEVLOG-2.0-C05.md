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

## C0.6 · Armilla 形象对齐 09(2026-10-26 22:5x CST)
- 王磊反馈:驾驶舱 Armilla 光环太敷衍,要求与 09_armilla「ARMILLA · 浑天」v2.2.1 一致,可缩小。
- 新增 x/sh-x-armilla.js(SHXARM):按 09 移植七道环参数、环面流光着色器、星云粒子(桌面 9000 / 手机 4500,09 原为 6 万)、核心光晕与线框、天轴、二十四节气刻度(当前节气朱红)、状态参数 IDLE/LISTENING/THINKING/SPEAKING/NIGHT,另加 ALERT(核心朱红)。
- 独立透明小 WebGLRenderer,不进主场景;09 的辉光后期用叠加光晕精灵代替;无 WebGL 退回原 SVG。
- 状态联动:规划面板=聆听,倒计时=思考,字幕=说话,警报=ALERT。
- 自测:1440/375/568/减少动态/无 WebGL 零报错零 404;1920 截图在 SwiftShader 下超时(非页面错误)。

## C0.7(2026-10-26 23:5x)
- 2.0 开场 x/sh-x-open.js(SHXOPEN,实时 WebGL 三幕约 8.8 s:北斗按 J2000 真星位点亮→地球离港→跃迁入舱;点击/Esc/空格/Enter 跳过;无 WebGL/减少动态静态降级)。X 页停用 1.0 sh-opening.js;根 1.0 不变。
- Esc 分层:侧舷窗/卫星巡航→回驾驶舱原位;摄影→退出;面板→收起;驾驶舱→驾驶舱风格「结束探索?」确认窗(再按 Esc=继续航行)。
- 新增「结束探索」按钮;结束后停在最近天体(地月附近→近地轨道视图,其余→太阳系并选中最近天体),再进驾驶舱从上次位置继续。
- 驾驶舱入口移到顶栏「航行天枢号 · F」方框(捕获点击直进驾驶舱);圆形视图条去掉 FLY。
- x/sh-x-style.css:全页按钮保持切角方框,加旋转青金双弧光环光效。
- 自动驾驶时左右两侧面板渐隐(filter+translate),抵达后渐显。
- 测试 build/c07_test.py、build/c07b.py:1440/390/无 WebGL 零 pageerror、零 404。
