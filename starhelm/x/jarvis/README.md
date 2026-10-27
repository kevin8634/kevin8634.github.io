# JARVIS 舰载语音包 v1.0.0（英文，脚本 v1.1 英文版）

- 117 条：a01–a20 整句、b01–b08 引导、tech01–10 引擎、cred01–03 可信度、act01–04 动作、body01–24 天体、zone01–07 星域、num01–33 英文数字（zero–twenty、thirty–ninety、hundred/thousand/million/billion、point）、unit01–08 单位。完整对照见 manifest.json。
- dry/：原声（单声道 96 kbps）。fx/：已烘焙「AI 空间感」（立体声 128 kbps）。均 44.1 kHz，单条 ≤150 KB，首尾留白 ≤80 ms。
- 数字拼读规则见 manifest.number_rules（英文按 thousand/hundred 组合，不读 and）。
- 「AI 空间感」：播放 dry/ 并接入 jarvis-spacefx.js（与 armilla-spacefx.js 同参数，可二选一共用），开关偏好与 Armilla 共用 `armilla.voice.spaceFx`。
- 人格切换：增加 Armilla ⇄ JARVIS 按钮，偏好存 `starhelm.voice.persona`（armilla | jarvis，默认 armilla）；切换时同时换语音包（../armilla_voice ↔ ./）、中央形象与界面语言提示。
- avatar/：jarvis_idle / jarvis_speaking，"奇点前夜"风格黑洞（事件视界 + 光子环 + 橙金吸积盘 + 引力透镜弧），SVG 含 SMIL 动画（吸积盘旋转、说话态脉冲波纹），PNG 为透明静帧。
