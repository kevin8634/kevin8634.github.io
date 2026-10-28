# 天枢 Starhelm 2.0 穿梭 · 交接与排期(2026-10-27 22:5x CST)

接手者先读:本文件 → docs/DEVLOG-2.0-C11.md(最新)→ docs/DEVLOG-2.0-C10.md→ docs/DEVLOG-2.0-C09.md → docs/DEVLOG-2.0-C08.md → x/LICENSES.md。OneDrive 不再修改/上传,一切以 GitHub 为准。

## 1. 仓库与边界
- 仓库 kevin8634/kevin8634.github.io,分支 main;2.0 在 /starhelm/x/(noindex)。只改 x/ 与 starhelm/docs/(含 docs/build/build_x_index.py)。1.0 文件(starhelm/ 根下)不动。
- 改完 JS/CSS 后运行 `python3 starhelm/docs/build/build_x_index.py` 重建 x/index.html(脚本列表与缓存版本在这里)。
- Service Worker 会缓存 /starhelm/x/,看效果需强刷。
- 上级:「00_总纲领与品牌」总指挥;**王磊 10-28 01:37 已批准巡天 X1–X6 门 A**(此前只批到 C 系列)。

## 2. 当前线上(最新在上)
| 提交 | 内容 |
|---|---|
| (本提交) | C2.2 交接:暂停时状态写入 DEVLOG-2.0-C11.md;新增 docs/C2.2-T2-PREP.md(T2 彗星/卫星根数与设计草案);无代码改动 |
| 86b1c76 | C2.2a 修侧舷窗偶发全黑:根因 WebGL 上下文预算耗尽(进侧舷窗新建的独立 renderer 把驾驶舱主画布挤掉);舱体改由主 renderer 画、probe/开场/小窗释放上下文、主 renderer 丢失自动恢复/重建、0 尺寸不渲染、全黑采样自愈 |
| 4d69339 | C2.1 日球层穿越增强:终端激波太阳风粒子流(400→130 km/s,湍动加热,随飞船位置过渡)、日球层顶旅行者 1 号 PWS 实测等离子体波录音(NASA PIA17045)、日球层外形示意(彗星状 / 气泡羊角状可切换,V1/V2 穿越点标定,IBEX 丝带);新文件 x/sh-x-helio.js;手机像素比 ≤1.5 |
| f20accb | C2.0 星座插画(Stellarium 西方/modern,Johan Meuris,FAL 1.3)85 幅 + 88 星座中英标签;K 键 连线/连线+插画/关;修正驾驶舱星空贴图 180° 赤经偏差 |
| 6f1d3b3 | C1.9e 倒计时去背景、仪表盘 DSEG7 黄色液晶字 |
| d988ab7 | C1.9d 日球层科普讲解卡(终端激波/日鞘/日球层顶/总览)|
| 2a58167 | C1.9c 30 AU 外 HUD「日球层」栏(旅行者号剖面示意) |
| 4913101 | C1.9b 点选任意 HYG 恒星 + 资料卡;拖拽光标改站内 star/frame.svg |
| bb4aab7 | C1.9a 登舰遮罩 + 语音/音响真实加载进度,就绪后音乐淡入再播欢迎语 |
| 2bf9a1d | C1.8d 恒星表面(太阳着色器按光谱型染色)、主星环境读数、真实 GM/L、自动驾驶绕行挡路天体 |
| 0ebee27 | C1.8c「靠太近」播报只播一次 |
| 185843f | C1.8b 近邻恒星跃迁(比邻/天狼/织女/TRAPPIST-1) |
| 286e763 | C1.8 出太阳系(旅行者1号、奥尔特云、HYG 星空、星座连线) |

## 3. 关键文件
- x/sh-x-cockpit.js 驾驶舱核心(航点表 B、物理、HUD、X._ 调试接口:S/B/BY/cam/root/setTarget/autopilot)。
- x/sh-x-ship.js 舰载系统(语音 Armilla/JARVIS、音乐、引擎、侧舷窗入口、登舰遮罩 board())。
- x/sh-x-deep.js HYG 星空 + 星座连线 + 深空事件(K 三档 SHXD.mode);x/sh-x-constart.js 星座插画+标签(SHXCA),数据 x/sh-x-constart-data.js 由 docs/build/build_constart.py 生成;x/sh-x-pick.js 点选恒星;x/sh-x-starnames.js 中文星名。
- x/sh-x-port.js 侧舷窗舱体(C2.2a 起由驾驶舱主 renderer 在 SHXC.layers.post 画,不再新建上下文;新增 WebGL 上下文前先想想预算);x/sh-x-fx.js 曲率/近光速/虫洞特效。
- x/sh-x-helio.js 日球层穿越(SHXH:粒子流 fg 层、外形 bg 层、讲解卡小窗;调试 SHXH.place(au,'side'|'sun'));驾驶舱外挂渲染层 SHXC.layers.bg/fg;PWS 音频 SHXS.pws。
- 自测补充:work/t_t8.py(C2.1 四档 + reduced + r169,端口用 T8PORT,默认 8797)。
- 自测(work/ 下,不在仓库):t_t1.py 星座插画四档+对齐截图、t_arr.py 恒星抵达、t_hover.py 悬停播报、t_board.py 登舰、t_pick.py 点选。均为 Playwright + SwiftShader,本地 http.server 于仓库根,拦截外网。

## 4. 王磊的视觉规则(必须遵守)
- 天体不要只做「颜色+光亮」。有真实影像用授权影像;没有实际观测的,按当前科学观测手段解析出的样子程序化模拟(光谱型/温度/表面结构;星云按 Hα、[OIII] 发射线及紫外/红外波段合成)。资料卡标注「模拟」与观测波段。
- 声音不能突然冒出:先加载、有进度,再播报。
- 每项完成:四档自测(1440×900 / 1920×1080 / 390×844 / 禁用 WebGL,0 页面错误 0 本站 404)→ x/LICENSES.md → DEVLOG → 通知总指挥。

## 5. 排期(按顺序)
### T1 星座插画 ✅ 已完成(C2.0,2026-10-28,见 DEVLOG-2.0-C09.md)(王磊 10-27 22:25 提出,参考 Stellarium 古典星座图)
- 素材:Stellarium skycultures/western 插画(Johan Meuris,Free Art License 1.3)。下载 index.json 与 illustrations/*.png,转灰度 WebP(≤512px,目标总量 <6 MB),原许可文本放 x/vendor/。
- 对齐:index.json 每幅图给 3 个锚点(HIP 编号 + 像素坐标)。HYG 有 HIP 号,但站内 sh-stars-data.js 只存序号 → 需要生成 HIP→序号映射(从 HYG v4.1 csv 派生,登记 CC BY-SA)。用 3 点求仿射,贴到天球大半径平面/三角带上,加法混合、低透明度。
- 开关并入 K 键(连线/连线+插画/关),星座名标签(中文+拉丁)。
- 太阳系内也显示(插画在无穷远天球),出太阳系后随视差改用实际锚星方向重算。
- 完成情况:85 幅插画 446 KB(手机版 104 KB);视差按锚星实际方向重算,变形过大或贴近锚星时淡出。自测中发现驾驶舱星空贴图差 180° 赤经,已在 x/ 内只对驾驶舱天空球修正;**1.0 共用的 sh-fx3d.js skyMesh 可能有同样偏差(1.0 太阳系/母港背景),未改,待总指挥决定。**

### T2 补卫星与彗星(10-27 22:25)— 未开始写代码;数据与草案见 docs/C2.2-T2-PREP.md
- 王磊 10-28 批准的 C2.2 范围(以此为准):月球(已有,astronomy-engine 精确,无需改)、木卫一至四、土卫六、土卫二,可选海卫一、冥卫一;彗星哈雷、67P、海尔-波普,可选 2P/Encke。真实周期/半长轴,J2000 历元 + 平均运动;开普勒椭圆用 JPL SBDB 根数(DEVLOG 写明来源与历元);彗尾背日,离子尾直蓝、尘埃尾弯黄,长度随日距;点选/航图快捷目的地 + EX 讲解卡(证据等级与依据);标注示意/尺度压缩;性能三档、手机像素比 ≤1.5、减少动态时彗尾不动画;纹理优先程序生成。提交信息 `starhelm x C2.2: moons & comets — …`,截图至少:木星+伽利略卫星、土星+土卫六、近日点附近哈雷彗尾。下面原条目为更大的远期清单。
- 卫星:木星(已有伽利略卫星则补 Amalthea、Himalia)、土星(Mimas/Enceladus/Tethys/Dione/Rhea/Titan/Iapetus/Hyperion)、天王星(Miranda/Ariel/Umbriel/Titania/Oberon)、海王星(Triton/Nereid/Proteus)、火星(Phobos/Deimos 如未加)、冥王星(Charon)。轨道用 JPL SSD 平均根数(ssd.jpl.nasa.gov/sats/elem/),贴图优先 NASA/USGS 公开图;无图则按观测光谱/反照率程序化。
- 彗星:1P/Halley、2P/Encke、67P/Churyumov–Gerasimenko、C/1995 O1 Hale-Bopp、109P/Swift–Tuttle、12P/Pons–Brooks、C/2023 A3 紫金山–ATLAS。根数取 JPL SBDB API,按开普勒方程传播;彗尾随日距生成(离子尾背日、尘埃尾弯曲),彗核用 67P 形状模型(ESA,CC BY-SA 3.0 IGO)或程序化。
- 航图与目标列表分组(行星/卫星/矮行星/彗星),资料卡含轨道周期、近日点、发现年份。

### T3 完整登舰动画(效果图已出,待王磊确认)
- 现有 C1.9a 只是舱门遮罩。目标:约 6 s 可跳过:地球轨道远景 → 天枢号靠近 → 穿过舱门 → 驾驶舱亮起;加载进度条保留在底部。先出效果图给王磊。

### T4 侧舷窗偶发全黑 ✅ 已完成(C2.2a,2026-10-28,见 DEVLOG-2.0-C11.md;根因:WebGL 上下文预算耗尽)
- 王磊截图:侧舷窗中只见黑色与细线。推断为自动驾驶被行星挡住贴在夜面,C1.8d 已改为绕行。若仍出现,检查 x/sh-x-port.js 的 setClearColor alpha、主场景在 #shxc.port 下是否被隐藏。

### T5 点选扩展
- 选中星可「前往」(生成临时航点,沿用曲率跃迁);深空天体(M/NGC)点选,需新增 DSO 数据(OpenNGC,CC BY-SA 4.0)。

### T6 第 5 步:星云/星系抵达影像 —— 方向 C 已定(王磊 10-28 01:53)
- 混合方案:真实影像去星后切成 6–10 层纵深形成视差,靠近时过渡到程序化体积;波段切换 可见光 / Hα / JWST 红外 / X 射线;资料卡标注「影像」或「模拟」;星系用粒子盘 + 真实影像贴图。遵守第 4 节视觉规则。

### T7 特殊天体(王磊 10-27 22:40 提出)
- 目标与公开数据:黑洞 Gaia BH1(~1,560 光年,恒星级)、天鹅座 X-1(~7,200 光年,带吸积盘与喷流)、银心 Sgr A*(~26,700 光年,EHT 2022 影像);中子星 RX J1856.5−3754(~400 光年,孤立热中子星);脉冲星 船帆座脉冲星 Vela(~900 光年,周期 89 ms)、蟹状星云脉冲星 Crab(~6,500 光年,33 ms)、Geminga;磁星 SGR 1806−20。距离/质量/周期以 NASA HEASARC、ATNF 脉冲星表、EHT 论文为准,写进资料卡并注明来源。
- 视觉(遵守第 4 节):黑洞用屏幕空间引力透镜着色器(背景星空弯曲 + 光子环)、吸积盘多普勒增亮与红移;Sgr A* 参照 EHT 1.3 mm 射电影像;中子星为小而极亮的热球 + X 射线伪彩;脉冲星双锥辐射束按真实周期旋转(可降速观看),射电/X 射线波段标注。蟹状星云脉冲星需配星云(与 T6 合并)。
- 接近效果:潮汐力、时间膨胀读数(引力 γ)、事件视界警戒距离,自动驾驶不得进入。

### T8 日球层穿越增强 ✅ 已完成(C2.1,2026-10-28,见 DEVLOG-2.0-C10.md)(10-27 22:40)
- C1.9c 已有读数;可加:终端激波处太阳风粒子流减速变乱的视觉、日球层顶处等离子体波「声音」(旅行者 1 号 PWS 公开音频,NASA 公共领域)、日球层整体形状(彗星状尾/气泡争议标注)。
- 完成情况:三项全部上线;音频用 NASA PIA17045 实测录音(74 KB,登记见 x/LICENSES.md),未用合成方案。待王磊真机看粒子密度/亮度是否合适;外形模型其他方向为外推。


### 待办顺序(王磊 10-28 定,10:55 暂停时)
1. ~~T4 侧舷窗全黑~~ ✅ C2.2a(86b1c76)。
2. T2 卫星与彗星(C2.2)。
3. 恒星信息卡布局(C2.2b):点选恒星卡 #xk-card 不得与目标面板、HUD 日球层栏、讲解卡、底部按钮条重叠(同列堆叠或自动停靠空闲区,不够时限高卡内滚动);390×844 改底部抽屉不挡准星;不增加 Esc/关闭负担;卫星、彗星点选卡同套布局;截图 work/out/tcard_*.png(三档)。王磊截图 files/uploads/image-4f1e17d7dca3.webp(在项目工作区)。
4. 「结束探索」偶发点不动 + 「数据」按钮无反应(并入 C2.2b):先 Playwright 长时间随机操作 + elementFromPoint 复现找根因;全屏装饰层一律 pointer-events:none;「数据」查清本意(初判见 DEVLOG-2.0-C11.md 暂停时状态),弱则点开给明确反馈(面板 + 数据源与开关状态),若多余报总指挥请王磊定,不擅删;截图 work/out/tbtn_*.png。王磊截图 files/uploads/image-54c55b006906.webp。
5. C2.2c 远景标签 LOD(重点:日球层顶/终端激波/太阳系整体/V1·V2;屏幕空间碰撞、低优先级让位、距离数字远看缩短、星座标签让位)+ 点选「太阳系」→ 推近 → 30–45 s 一镜到底(日球层各层、奥尔特云内缘「推测」、柯伊伯带与冥王星、八大行星轨道依次点亮、小行星带、哈雷/67P/海尔-波普轨道、旅行者 1/2·新视野号·先驱者 10/11 位置与轨迹;每段 1–2 个标签 + 短字幕;点击/Esc/滚轮可打断;减少动态改分段静态;结束停在全景可操作);截图 work/out/tsol_*.png。王磊截图 files/uploads/image-3075266dfff2.webp。
- 无未推送补丁:暂停时工作区干净(T2 以后各项都还没动代码)。
- 自测环境提示:沙箱需先 `pip install playwright`、`playwright install chromium` 与 `install-deps`,中文截图需 fonts-wqy-microhei;http.server 用 setsid 后台起(本轮用 8813);t_t1.py 已支持 T1PORT,t_t4.py(侧舷窗压测,含 --max-active-webgl-contexts 模拟手机上限,T4ARGS/T4PORT/T4Q)在 work/。

## 6. 额度
- 10-27 23:05 本账号日额度已用约 88%,停工交接;10-28 20:07 CST 重置;月池 17%。
- 10-28 02:1x–03:xx CST:T8(C2.1)由 Hark 代理按交接执行完成;本次未读取该账号的额度面板,具体用量以总指挥面板为准。下一项按排期为 T2(补卫星与彗星)。
- 10-28 10:0x–10:55 CST:C2.2a(T4)由 Hark 代理完成并上线;10:55 按王磊要求暂停交接,T2 起未开始。本次未读取该账号的额度面板,具体用量以总指挥面板为准。
- 科普内容写法:讲解卡在 x/sh-x-explain.js(EX 表)与 x/sh-x-deep.js addEx();每条含 t 标题、k 证据等级(已证实/推测/猜想)、b 要点、s 依据。新增天体/现象时同步写一张。
