# 天枢 Starhelm · 巡天 X0a 子页 /starhelm/x/ · 素材与 AI 标注台账(增量)

本子页其余素材全部复用 1.0(见 ../LICENSES.md),这里只登记 X0a 新增的部分。

| 素材 | 用在哪(任务/页面) | 来源与链接 | 许可 | 署名要求 | 是否 AI 生成 | 页面标注位置 |
|---|---|---|---|---|---|---|
| three.js 0.186.1 + OrbitControls + GLTFLoader(esbuild 打成经典脚本 window.THREE,沿用 1.0 的 r147 兼容层) | /starhelm/x/ 全部 3D 场景 | https://github.com/mrdoob/three.js(npm three@0.186.1);入口 docs/build/three-r186-entry.js | MIT | 保留版权与许可声明(x/vendor/three-r186/LICENSE) | 否 | 底部角标「巡天 X0a · 开发预览 · three r186」 |
| esbuild 0.24(仅构建用,不随页面分发) | 构建 three-r186 包 | https://esbuild.github.io/ | MIT | 无(不分发) | 否 | — |

- 数据:X0a 没有新增数据源;实时数据开关 gn:sh:live 与 1.0 共用,语义不变。
- AI:X0a 没有新增 AI 生成的画面、人物或语音。

## X0b 四级视图 + C0 驾驶舱(2026-10-26)

| 素材 | 用在哪(任务/页面) | 来源与链接 | 许可 | 署名要求 | 是否 AI 生成 | 页面标注位置 |
|---|---|---|---|---|---|---|
| 行星引力参数 GM | 驾驶舱引力读数、目标资料卡质量/表面重力 | JPL Solar System Dynamics · Planetary physical parameters https://ssd.jpl.nasa.gov/planets/phys_par.html | 美国政府作品(公有领域) | 无强制,注明 JPL | 否 | 代码注释 |
| 行星平均温度 | 目标资料卡 | NASA Planetary Fact Sheet https://nssdc.gsfc.nasa.gov/planetary/factsheet/ | 美国政府作品(公有领域) | 无强制,注明 NASA | 否 | 代码注释 |
| 星历、贴图、星空、太阳着色器 | 驾驶舱全部 3D | 复用 1.0:astronomy-engine(MIT)、Solar System Scope(CC BY 4.0)、NASA SVS 星空、SHFX3D | 见 ../LICENSES.md | 同 1.0 | 否 | 驾驶舱底部署名行 |
| 舱内音乐 · 待命 bgm-idle.mp3 | 天枢号驾驶舱(待命场景) | Space Echo · Centurion_of_war · OpenGameArt https://opengameart.org/content/space-echo | CC0 1.0 | 不强制;音响面板署名 | 否 | 音响面板底部 |
| 舱内音乐 · 巡航 bgm-cruise.mp3 | 驾驶舱(巡航场景) | Space Music: Out There · yd · https://opengameart.org/content/space-music-out-there | CC0 1.0 | 不强制;音响面板署名 | 否 | 音响面板底部 |
| 舱内音乐 · 加速 bgm-boost.mp3 | 驾驶舱(引擎加速 / 自动驾驶) | Magic Space · CodeManu · https://opengameart.org/content/magic-space | CC0 1.0 | 不强制;音响面板署名 | 否 | 音响面板底部 |
| 舱内音乐 · 环绕 bgm-orbit.mp3 | 驾驶舱(卫星式巡航) | Outer Space Loop · wipics · https://opengameart.org/content/outer-space-loop | CC0 / Public Domain | 不强制;音响面板署名 | 否 | 音响面板底部 |
| 引擎/航行/警报音效 | 驾驶舱(十种引擎启动·持续·关停、底噪、按键、警报) | 本项目 Web Audio 程序实时合成(sh-x-ship.js) | 本项目原创 | 无 | 否 | — |
| 十种引擎数据 | 航行规划 | 复用 1.0 sh-voyage-data.js(弦穹号) | 本项目原创 | 无 | 否 | — |
| Armilla 语音(待交付) | 驾驶舱字幕+语音 | 项目 09_armilla 用 Armilla 声音 AI 合成,交付到 x/armilla/ | 本项目 | 无 | **是**(AI 合成语音) | 到位后在音响面板标注 |

- 交互参考:solar-system-atlas.pages.dev 的「模拟」模式,只参考交互与版式思路;代码、贴图、音效、数据均未取用(其 Gaia 星表为 CC BY-NC,不适用)。
- 太阳光晕、镜头光斑、仪表、旋转光环按钮均为本项目手写着色器 / CSS / SVG,无新增第三方素材,无 AI 生成内容。

- C0.5:音乐原文件已转码为 64–80 kbps MP3(只改码率,未剪辑)。Armilla 光环形象为手写 SVG。
