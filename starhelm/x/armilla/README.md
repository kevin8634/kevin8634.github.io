# Armilla 舰载语音包 v1.1.0（脚本 v1.1）

- 101 条：a01–a20 整句、b01–b08 引导、tech01–10 引擎、cred01–03 可信度、act01–04 动作、body01–24 天体、zone01–07 星域、num01–17 数字、unit01–08 单位。完整对照见 manifest.json。
- dry/：原声（单声道 96 kbps）。fx/：已烘焙「AI 空间感」（立体声 128 kbps）。均 44.1 kHz，单条 ≤150 KB，首尾留白 ≤80 ms。
- 「AI 空间感」开关：推荐播放 dry/ 并接入 armilla-spacefx.js（与 ARMILLA PWA 参数一致，默认开启，按钮文案「AI 空间感 / Spatial FX」，偏好存 localStorage `armilla.voice.spaceFx`）；无 Web Audio 时开=fx/、关=dry/。
- 拼接：片段句尾未降调，按 manifest.concat_examples 顺序直接播放，段间可留 40–80 ms。
- avatar/：armilla_idle / armilla_speaking，SVG 内含 SMIL 动画（说话态核心脉动+声波环），PNG 为透明静帧。
