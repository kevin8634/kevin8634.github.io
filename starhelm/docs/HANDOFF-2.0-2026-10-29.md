# 天枢 2.0 交接 · 2026-10-29 08:4x(日额度剩约 12%,按规停工)

线上最新 5f2d3f0。本轮:C2.4e 3e38e4b 侧舷窗方形玻璃框+四色流光;C2.4f e088c23 窗框让开操作台;C2.4g caf1809 手机搜索框 16px 防 iOS 放大;C2.5a/b/c 04d9f54 / 9be887d / 5f2d3f0 T6 深空抵达(x/sh-x-dsoview.js SHXV,M42/M1/M16/M51,目录置顶「✦ 可飞抵」,跃迁动画)。

## 计划进度
- ✅ T1 星座插画、T2 卫星彗星、T4 侧舷窗、T5 点选扩展、T8 日球层;目录/搜索、侧舷窗双面板、抵达报告。
- 🔄 T6 深空影像:已 4 个目标。待做:① 银河星域航图——让深空目标成为可真正飞行的航点(从驾驶舱转向+加速+光年倒计时,再接影像视图);② 更多目标(船底座、M31、M8、M20、M57、M104…);③ 波段切换(需找真正 JWST 图,esawebb weic2216a 下载到的不是);④ 靠近时过渡到程序化体积。
- ⏳ T3 完整登舰动画(待效果图确认)。T7 黑洞/中子星/脉冲星。资料表缺结构/大气/探测史。
- 已知:抵达报告 Esc 可能被 cockpit 拦截;深空视图 Esc 同理,用「返回天枢号」按钮。
- 工具:work/mk_dsolayers.py <源图> <前缀> <层数> [inv],THR 环境变量;测试 work/t_dv.py、t_dv2.py、t_port.py、t_fs.py(work/ 不入库)。

## 10-29 11:3x 更新(本账号 07 窗口)
- 线上最新 87797ac:C2.6a Esc 分层(b676159)、C2.6b 深空目标真实航点(48451b8)、C2.6c 新增船底座/M31/M8/M20/M57/M104(87797ac)。详见 DEVLOG-2.0-C14.md。
- 「Esc 被 cockpit 拦截」已修。T6 剩:① C2.6d M16 可见光⇄红外(weic2216e,WIP 补丁 work/out/c26d_wip.patch,需补测 6 配置后再推);② 近处程序化体积。之后 T7;T3 待效果图确认。
- 已知:跃迁过日球层顶可能自动播 PWS 录音;M104 亮星重影;手机分层偏糊。

## 10-29 12:4x 更新(C15,日额度约 82% 按规停)
- 上线:C2.7a 锁定目标 + 锚点卡(x/sh-x-anchor.js,审视 docs/C2.7-AUDIT.md,5 项待王磊决定);C2.7d「结束探索」重做(x/sh-x-exit.js,body 层独立按钮 + 确认框 + 2 s 自检)。详见 DEVLOG-2.0-C15.md。
- 待办 ①C2.7b 真实载入进度:x/sh-x-preload.js 已写未接入(work/out/c27b_wip.patch)。接入:cockpit tex() 用 SHXP.img(gate=地球昼/夜/云);build() 里星空先 SHXP.pull(SHXP.skyUrl(rd)) 再 SHFX3D.skyMesh,map.ready 后 SHXP.set ok;board() 两条改「模型 · 贴图」「声音」,读 SHXP.prog;音乐 / 语音(a01 a02 a03 a06)pull 后 canplaythrough 才 ok,AudioContext 未运行标「待点击启用」并出「进入驾驶舱 · 启用声音」按钮;失败重试一次后显示「部分资源未载入,继续」;45 s 上限;去掉「跳过」;手机只等 4K 星空 + 内置贴图。测试:1.5 Mbps 手机、10 Mbps 桌面(桌面闸门约 9.6 MB)。
- 待办 ②C2.7c(王磊 11:57):抵达深空目标后不自动弹影像,在锚点卡位置给二选一「真实照片(哈勃 / 韦布)」/「舷窗观测(模拟渲染)」,资料卡也有两入口,减少动态默认照片;驾驶舱目标方位放程序化星云(billboard 层叠 + 噪声 shader + 粒子,取样小图配色;M31/M51/M104 粒子盘 + 核球;三档性能、手机降级;标「模拟渲染 · 非照片」;r186 与 ?three=169)。Bug:(a) 抵达后标签「120,000 光年」(船底座应约 7,500)——查标签距离来源(疑为 tmpdso 标签用了航点槽旧 fix/R 或按日心距离算);(b) 远离太阳数千光年后星座连线拉成满屏平行线——超过约 1 光年淡出星座连线与插画。截图 t27_neb_*.png。
- 待办 ③ OneDrive 同步本轮文档与 C2.7x 源码 zip(本轮未做)。
- 测试环境:沙箱曾重置,已重装 playwright + apt libatk/libxcomposite/libxdamage/libatspi + fonts-wqy-microhei(sudo apt 可用);tlib.py 截图前缀改由 TPFX 环境变量控制;六档并行太慢,建议两档一组。

## 10-29 16:4x 更新(C16)
- 上线 5de1fb6:C2.7b 登舰真实载入进度,详见 DEVLOG-2.0-C16.md。注意全局名为 **SHXLD**(SHXP 已被侧舷窗占用);星空与 1.0 共用 SHFX3D 贴图缓存,不另下载。
- 下一步:C2.7c → C2.6d → 程序化体积 → T7;C2.7-AUDIT 5 项仍待王磊定。测试脚本 work/t27b.py(参数 WxH 限速kbps 标签),1440 档在 SwiftShader 下过慢,用 1024 / 390 档判定。

## 10-29 18:3x 更新(C17)
- 上线:C2.7e cc1da78(AUDIT 五项按建议,王磊 16:51 定,见 docs/C2.7-AUDIT.md 第四节);T3 dd3e49b 登舰一镜到底(王磊 17:27 选效果图 B,x/sh-x-board.js 全局 SHXBD,canvas 程序化,进度跟 SHXLD,最快 6.5 s,终点从中心开孔亮起驾驶舱)。详见 DEVLOG-2.0-C17.md。
- BUG 清单 docs/BUGS-2.0.md(云盘 开发文档/BUG/BUG清单.md):BUG-01 星座里选的恒星到不了 + 远距(约 539 ly)恒星光晕叠成三叶草、球体错位。王磊定「先记录,回头慢慢修」——报 BUG 先登记,不立即修。
- 远端出现别处提交 3e59971(starhelm/deep/ 深空层 V0+V1),07 未动其文件;push 前务必 fetch + rebase。已报总指挥确认归属。
- 下一步:C2.7c 深空抵达二选一 + 程序化星云 → C2.6d → 程序化体积 → T7;BUG-01 待王磊发话再修。
- 测试:tbd3.py 用 SHXBD.seek(q) 逐段截图(需临时 starhelm/bdtest.html,勿提交);沙箱重置后 playwright 需 install-deps,http 服务用 nohup。

## 10-29 19:3x 更新(C18,新 07 窗口:Hark 项目「创世计划 07 天枢 Starhelm」)
- 上线 C2.7c 00e7c6b:抵达深空目标后锚点卡位置弹「已抵达」二选一(真实照片 / 舷窗观测 · 模拟渲染 / 返航),减少动态默认照片;新 x/sh-x-neb.js(SHXNB)驾驶舱程序化星云/星系;资料卡与影像视图双入口;修抵达标签距离(千分位 + 距地球,装槽即刷新 b.wp)、离日 >1 光年星座连线/插画淡出。详见 DEVLOG-2.0-C18.md。
- 测试脚本 work/t27c.py(参数 W H 减少动态 标签 [?three=169]),http.server 8130 于 repo 根。
- 下一步:C2.6d M16 可见光⇄红外(WIP 补丁 云盘 工程文件/WIP_2026-10-29/)→ 近处程序化体积 → T7;BUG-01 仍待王磊发话。
- 已知:M104 尘埃带在 84° 倾角下偏淡;跃迁过日球层顶 PWS 录音字幕与抵达卡同屏(旧)。

## 10-29 20:0x 更新(C19)
- 上线 C2.6d 0ba2ba0:M16 影像视图 可见光(哈勃)⇄ 近红外(JWST weic2216e)切换,按需加载,资料卡联动。详见 DEVLOG-2.0-C19.md。WIP 补丁 c26d_wip.patch 已被正式提交取代。
- 下一步:近处程序化体积(飞进星云内部时 SHXNB 现在淡出,由体积接管)→ T7 黑洞/中子星/脉冲星。
