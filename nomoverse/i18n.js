/* 宙律 Nomoverse · 中英双语(英文版第一期 v0.9-α4,2026-11-03:首页、任务页通用界面、任务与关卡标题、控件与按钮)
 * 规范同门户 v2.5.0 / HANDOFF v3.90:语言来源 URL ?lang= > 全站共享本机键 gn:lang(zh/en)> 默认中文;不按浏览器语言跳转;?lang= 会写回 gn:lang。
 * 英文模式逐个替换文本节点与 aria-label/title/placeholder/alt;词典没有的保留中文(缺译回退中文,不留空白)。
 * 画布(Canvas/WebGL)里的文字与关内长文案留到第二期;世界码、星桥 ID、存储键(gn:nv:*)一律不变。
 * 术语按《中英术语表 v0.1》:任务 quest、关 level、知识星 knowledge star、星桥 Star Bridge、创世计划 Genesis。
 * 任务页可用 NV_I18N.add(词典, 句式) 追加词条(第二期起按任务分包)。
 */
(function () {
  "use strict";
  var q = /[?&]lang=(zh|en)\b/.exec(location.search), L = "zh";
  try { if (q) localStorage.setItem("gn:lang", q[1]); L = q ? q[1] : (localStorage.getItem("gn:lang") || "zh"); } catch (e) { L = q ? q[1] : "zh"; }
  if (L !== "en") L = "zh";
  window.NV_LANG = L;
  window.NV_setLang = function (l) {
    try { localStorage.setItem("gn:lang", l); } catch (e) {}
    var s = location.search.replace(/([?&])lang=(zh|en)&?/, "$1").replace(/[?&]$/, "");
    location.replace(location.pathname + s + (s ? "&" : "?") + "lang=" + l + location.hash);
  };
  var CJK = /[\u3400-\u9fff\uff01-\uff5e]/;
  var G = { "夸克「阿夸」": "Quark “Aqua”", "黑洞「墨渊」": "Black Hole “Abyss”", "引力波「涟漪」": "Gravitational Wave “Ripple”" };
  var TASKS = {
    "为什么宇航员在空间站会飘起来?": "Why do astronauts float on the space station?",
    "为什么救护车经过时声音会变?": "Why does an ambulance sound different as it passes?",
    "如果引力变成两倍,篮球还能投进吗?": "If gravity doubled, could you still make the shot?",
    "恒星为什么会发光?": "Why do stars shine?",
    "月亮怎样拉动整片大海?": "How does the Moon pull a whole ocean?",
    "能量去哪儿了?": "Where does the energy go?"
  };
  var E = {
  /* ---------- 通用:顶栏、导航、设置 ---------- */
  "← 创世计划": "← Genesis", "← 返回创世计划": "← Back to Genesis", "创世计划": "Genesis", "创世": "Genesis", "← 宙律": "← Nomoverse", "宙律": "Nomoverse",
  "宙律 Nomoverse": "Nomoverse", "宙律 · 物理": "Nomoverse · Physics", "返回宙律首页": "Back to Nomoverse home",
  "创世计划 Genesis · 02 · 宙律 Nomoverse · 物理": "Genesis · 02 · Nomoverse · Physics", "创世计划 Genesis · 02 · 物理": "Genesis · 02 · Physics",
  "宙律 Nomoverse · 亲手改写宇宙的规律 · 创世计划 Genesis": "Nomoverse · Rewrite the laws of the universe yourself · Genesis",
  "@返回创世计划 Genesis 总门户(同一窗口)": "Back to the Genesis Portal (same window)", "@返回创世计划总门户": "Back to the Genesis Portal",
  "@站点导航": "Site navigation", "@宙律 Nomoverse": "Nomoverse", "@设置": "Settings", "@设置(声音与 AI 向导)": "Settings (sound & AI guide)", "@开启声音": "Turn sound on",
  "@画面质量": "Graphics quality", "@进入规则改写台": "Enter the Rule Rewrite Lab", "@你自己的 API 钥匙": "Your own API key", "@模型名,例如 deepseek-chat": "Model name, e.g. deepseek-chat",
  "设置": "Settings", "关闭": "Close", "保存": "Save", "清除钥匙": "Clear key", "自动": "Auto", "高": "High", "中": "Medium", "低": "Low",
  "画面质量": "Graphics quality", "声音与 AI 向导设置": "Sound & AI guide settings", "声音(背景音乐与「声音即规律」音效)": "Sound (background music and “sound is law” effects)",
  "▶ 重播开场动画": "▶ Replay the intro", "显示帧率读数(真机测试用)": "Show frame rate (for device testing)",
  "生成式 AI 向导(可选,默认关闭)": "Generative AI guide (optional, off by default)", "不用 AI(默认)": "No AI (default)", "AI 追问": "AI follow-up questions", "AI 讲解": "AI explanations", "AI 对话": "AI chat",
  "只有预设的三级提示。未满 18 岁请保持此项。": "Only the three built-in hint levels. Keep this if you are under 18.",
  "每次运行后,AI 看你的预测和结果,追问一个问题。": "After each run, the AI looks at your prediction and result and asks one follow-up question.",
  "在上面基础上,通关后可以请 AI 讲解原理。": "On top of that, you can ask the AI to explain the idea after clearing a level.",
  "你可以向向导提问,AI 只回问题和提示,不给答案。": "You can ask the guide questions; the AI replies only with questions and hints, never answers.",
  "我已满 18 岁,或已获得监护人同意": "I am 18 or older, or have a guardian's permission",
  "接口地址 base_url(OpenAI 兼容,优先国内已备案模型)": "API address base_url (OpenAI-compatible)", "钥匙 key(只保存在本机浏览器)": "Key (saved only in this browser)", "模型 model": "Model",
  "只有你开启 AI 并填好以上三项后,本站才会向你填写的地址发送请求;内容只有本关名称、你的预测与运行结果(以及你主动输入的问题)。请勿输入个人信息。不开启时,全站零外部请求。": "Only after you turn on AI and fill in all three fields will this site send requests to the address you entered, containing just the level name, your prediction and the result (plus any question you type). Please don't enter personal information. With AI off, the site makes zero external requests.",
  "高:完整光效与粒子 · 中:粒子减半 · 低:关闭 3D,用 2D 画面(功能不变)。": "High: full glow and particles · Medium: half the particles · Low: no 3D, 2D graphics (same features).",
  "本站为纯静态网页,无外部请求、无统计埋点;进度只保存在本机浏览器。声音默认关闭;生成式 AI 向导默认关闭,需自行开启并填写自己的接口。": "This is a fully static site: no external requests, no analytics; progress is saved only in this browser. Sound is off by default; the generative AI guide is off by default and needs your own API to turn on.",
  "简化模型 · 科普探究:画面中的数值来自经典物理公式和简化模型(例如把地球当作均匀球体、忽略月球和太阳),用于理解规律,不代表精确的工程计算。": "Simplified models · science exploration: numbers on screen come from classical physics formulas and simplified models (for example, treating Earth as a uniform sphere and ignoring the Moon and Sun). They help you understand the laws, not make precise engineering calculations.",
  "科普探究小实验。画面中的数字来自简化模型,单位见各仪表。": "A small science-exploration experiment. Numbers on screen come from simplified models; units are shown on each gauge.",
  "AI 审稿 · 欢迎纠错": "AI-reviewed · corrections welcome", "发现错误?": "Spot an error?", "素材台账": "Asset credits",
  /* ---------- 首页 ---------- */
  "亲手改写宇宙的规律": "Rewrite the laws of the universe yourself",
  "把引力调大一点,把声速调慢一点:先猜,再运行,看规律怎么变。在改写规律的过程中,读懂规律。": "Turn gravity up a little, slow the speed of sound down: guess first, then run it and watch how the law changes. Rewrite the laws, and you'll understand them.",
  "开始探究 →": "Start exploring →", "进入 →": "Enter →", "六个探究任务": "Six quests", "@六个探究任务": "Six quests",
  "每关都是:观察 → 预测 → 运行 → 对比 → 改规则。拿到 1 颗星就能解锁下一关。": "Every level goes: observe → predict → run → compare → change the rule. One star unlocks the next level.",
  "已得": "Earned", "/ 60 颗知识星": "/ 60 knowledge stars", "@实验画面": "Experiment view", "@实验舞台": "Experiment stage", "@实验记录本": "Lab notebook", "已点亮": "Lit", "待探索": "Unexplored", "可在本期任务中点亮": "Can be lit in current quests",
  "宇宙尺度星图": "Cosmic-scale star map", "@宇宙尺度知识星图,横轴从 10⁻¹⁵ 米到 10²¹ 米": "Cosmic-scale knowledge star map, axis from 10⁻¹⁵ m to 10²¹ m",
  "从质子到银河系,8 个星座 60 颗知识星按大小排在一条对数尺上(每格是 10 倍)。通关对应的关卡,就能点亮那颗星。": "From protons to the Milky Way: 60 knowledge stars in 8 constellations, placed by size on a logarithmic ruler (each step is 10×). Clear the matching level to light a star.",
  "← 左右滑动查看整条尺度轴 →": "← Swipe to see the whole scale →", "列表视图": "List view",
  "⚗ 规则改写台": "⚗ Rule Rewrite Lab", "规则改写台": "Rule Rewrite Lab",
  "把重力调到月球、把路面变成冰、把声音和光调慢、把月亮拉近:A/B 对照只改一个变量,先猜再看。": "Set gravity to the Moon's, turn the road to ice, slow sound and light, pull the Moon closer: A/B comparisons change just one variable. Guess first, then look.",
  "引力强度": "Gravity strength", "拖动滑杆:质量越大、引力越强,时空网格凹得越深。": "Drag the slider: the more mass and the stronger gravity, the deeper the spacetime grid sinks.",
  "示意图 · 时空弯曲(简化模型)": "Diagram · curved spacetime (simplified model)", "@带轨道环的行星压弯了周围的时空网格;引力越大,网格凹得越深": "A ringed planet bends the spacetime grid around it; the stronger the gravity, the deeper the dip",
  "难度 ★☆☆": "Difficulty ★☆☆", "难度 ★★☆": "Difficulty ★★☆", "难度 ★★★": "Difficulty ★★★",
  /* 尺度刻度地标 */
  "质子": "Proton", "原子": "Atom", "病毒": "Virus", "细胞": "Cell", "人": "Human", "珠峰": "Everest", "地球": "Earth", "日地距离": "Earth–Sun distance", "1 光年": "1 light-year", "银河系": "Milky Way",
  /* 8 个星座 */
  "运动": "Motion", "力与能量": "Force & energy", "引力与天体": "Gravity & the heavens", "波与声": "Waves & sound", "光": "Light", "热与熵": "Heat & entropy", "电与磁": "Electricity & magnetism", "现代物理": "Modern physics",
  /* 60 颗知识星 */
  "惯性": "Inertia", "加速度": "Acceleration", "参考系": "Reference frames", "圆周运动": "Circular motion", "抛体运动": "Projectile motion", "运动的独立性": "Independence of motion", "布朗运动": "Brownian motion",
  "牛顿第二定律": "Newton's second law", "作用与反作用": "Action and reaction", "摩擦力": "Friction", "空气阻力": "Air resistance", "动能与势能": "Kinetic & potential energy", "能量守恒": "Conservation of energy", "重力加速度": "Gravitational acceleration", "变轨与轨道能量": "Orbit changes & orbital energy",
  "万有引力": "Universal gravitation", "失重": "Weightlessness", "环绕速度": "Orbital speed", "逃逸速度": "Escape velocity", "开普勒第三定律": "Kepler's third law", "潮汐": "Tides", "表面重力": "Surface gravity", "恒星": "Stars",
  "频率与音高": "Frequency & pitch", "多普勒效应": "Doppler effect", "共振": "Resonance", "拍频": "Beats", "频率比与和声": "Frequency ratios & harmony", "马赫锥": "Mach cone", "超声波": "Ultrasound", "地震波": "Seismic waves",
  "可见光谱": "Visible spectrum", "反射与折射": "Reflection & refraction", "干涉与衍射": "Interference & diffraction", "光速": "Speed of light", "光年": "Light-year", "无线电波": "Radio waves", "X 射线": "X-rays",
  "温度与分子运动": "Temperature & molecular motion", "热传递": "Heat transfer", "热膨胀": "Thermal expansion", "气体压强": "Gas pressure", "热机": "Heat engines", "熵增": "Entropy increase", "宇宙微波背景": "Cosmic microwave background",
  "电荷与库仑力": "Charge & Coulomb force", "电流与电路": "Current & circuits", "磁场": "Magnetic fields", "电磁感应": "Electromagnetic induction", "闪电": "Lightning", "地磁场与极光": "Earth's magnetic field & aurora", "晶体管": "Transistors",
  "夸克": "Quarks", "原子核": "Atomic nuclei", "量子能级": "Quantum energy levels", "狭义相对论": "Special relativity", "广义相对论": "General relativity", "黑洞": "Black holes", "引力波探测": "Gravitational-wave detection",
  /* ---------- 任务页通用 HUD ---------- */
  "任务 ▾": "Quests ▾", "任务 ▴": "Quests ▴", "探究任务 · 25 关": "Quests · 25 levels", "@展开任务抽屉": "Open quest drawer", "@收起任务抽屉": "Close quest drawer",
  "观察": "Observe", "预测": "Predict", "运行": "Run", "对比": "Compare", "改规则": "Change the rule", "1 观察": "1 Observe", "2 对比": "2 Compare", "3 变量": "3 Variables",
  "② 可改的规则": "② Rules you can change", "@可改的规则": "Rules you can change", "收起面板 ▾": "Hide panel ▾", "展开面板 ▴": "Show panel ▴",
  "向导提示:": "Guide hints:", "@向导提示": "Guide hints", "对比 · 预测 vs 实际": "Compare · prediction vs result", "你的预测": "Your prediction", "实际结果": "Actual result",
  "@先完成预测": "Finish your prediction first", "@先预测": "Predict first", "@关卡": "Levels", "@关卡面板": "Level panel", "@实验画面": "Experiment view", "@控制条": "Control bar",
  "@本任务星数": "Stars in this quest", "@本关目标与预测": "Level goal & prediction", "@流程": "Steps", "@预测与结果对比": "Prediction vs result",
  "重新预测": "Predict again", "也可以直接选:": "Or just pick one:", "就猜这个": "Go with this", "我猜": "My guess", "在画面上点一下。": "Tap on the scene.",
  "开始任务": "Start quest", "@开始任务": "Start quest", "快速选择": "Quick pick", "@快速选择": "Quick pick",
  "慢放": "Slow-mo", "快进": "Fast-forward", "比较": "Compare", "@比较": "Compare",
  /* ---------- 向导 ---------- */
  "夸克「阿夸」": G["夸克「阿夸」"], "黑洞「墨渊」": G["黑洞「墨渊」"], "引力波「涟漪」": G["引力波「涟漪」"],
  /* ---------- 25 关标题 ---------- */
  "扔得更远": "Throw it farther", "牛顿大炮": "Newton's cannon", "电梯里的苹果": "The apple in the elevator", "改宇宙": "Change the universe", "追上空间站": "Catch the space station",
  "声音是振动": "Sound is vibration", "救护车驶过": "The ambulance passes", "改声速": "Change the speed of sound", "和声与拍频": "Harmony and beats",
  "地球投篮": "Shooting on Earth", "引力 ×2": "Gravity ×2", "月球与木星": "The Moon and Jupiter", "荒谬宇宙": "Absurd universe",
  "烧煤的太阳": "A coal-burning Sun", "少了一点点质量": "A tiny bit of missing mass", "压不扁的太阳": "The Sun that won't collapse", "压不扁的火球": "The fireball that won't collapse", "更重的星,更短的命": "Heavier stars, shorter lives",
  "背面也鼓起来": "The far side bulges too", "太阳更重,为啥月亮更管用": "The Sun is heavier, so why does the Moon matter more", "被拉长的一天": "The day that got longer", "靠太近会被撕碎": "Too close and you're torn apart",
  "过山车能爬多高": "How high can a roller coaster climb", "刹车片为什么烫": "Why brakes get hot", "一吨水变成电": "A tonne of water becomes electricity", "燃料的能量去哪了": "Where did the fuel's energy go",
  /* ---------- 控件、按钮、选项(短词) ---------- */
  "出手角度": "Release angle", "出手速度": "Release speed", "水平扔出速度": "Horizontal throw speed", "炮弹速度": "Cannonball speed", "轨道高度": "Orbit altitude", "每次点火": "Each burn", "减速点火": "Retro burn", "加速点火": "Prograde burn", "⇠ 减速点火": "⇠ Retro burn", "加速点火 ⇢": "Prograde burn ⇢",
  "振动快慢(频率)": "Vibration rate (frequency)", "鸣笛频率": "Siren frequency", "声速": "Speed of sound", "右边音叉频率": "Right fork frequency", "比值 f₂:f₁ =": "Ratio f₂:f₁ =",
  "重力加速度 g": "Gravitational acceleration g", "风(正 = 顺风)": "Wind (+ = tailwind)", "星球": "World", "地球质量": "Earth's mass", "恒星质量": "Star mass", "核心温度突然变化": "Sudden core temperature change", "每秒亏损的质量": "Mass lost per second",
  "月地距离": "Moon–Earth distance", "月亮材质": "Moon material", "月相": "Moon phase", "时间": "Time", "情形": "Scenario", "第二座山高度": "Second hill height", "摩擦与空气阻力": "Friction & air resistance",
  "车速": "Car speed", "车重": "Car mass", "落差": "Drop height", "发电效率": "Generator efficiency", "热源温度": "Hot source temperature", "冷端温度": "Cold side temperature",
  "理想热机(卡诺)": "Ideal engine (Carnot)", "真实汽油机": "Real gasoline engine", "箭头显示": "Show arrows", "@切换视角": "Switch view", "锁定这一组": "Lock this set",
  "扔球": "Throw", "开炮": "Fire", "松手": "Let go", "绕三圈": "Three orbits", "点火": "Ignite", "开过来": "Drive past", "推过去": "Push it", "投篮": "Shoot", "称一称": "Weigh it", "点燃": "Light it", "点亮": "Light up", "扰动": "Disturb",
  "转一天": "Spin one day", "穿越": "Fly through", "放车": "Release", "刹车": "Brake", "开闸": "Open the gate",
  "高弧": "High arc", "中弧": "Mid arc", "低弧": "Low arc", "篮筐": "Hoop", "更大": "Bigger", "更小": "Smaller", "更快": "Faster", "更慢": "Slower", "一样": "Same", "一样大": "Same size", "差不多": "About the same",
  "新月": "New moon", "上弦月": "First quarter", "满月": "Full moon", "下弦月": "Last quarter", "今天": "Today", "海岸": "Coast", "潮位": "Tide level", "洛希极限": "Roche limit",
  "月球 0.17g": "Moon 0.17g", "火星 0.38g": "Mars 0.38g", "木星 2.53g": "Jupiter 2.53g", "空气 343": "Air 343", "水 1480": "Water 1480",
  "岩石月亮 3.3 g/cm³": "Rocky Moon 3.3 g/cm³", "冰月亮 0.93 g/cm³": "Icy Moon 0.93 g/cm³", "核聚变": "Fusion", "化学燃烧(煤)": "Chemical burning (coal)", "引力收缩": "Gravitational contraction",
  "势能": "Potential energy", "动能": "Kinetic energy", "功": "Work", "电": "Electricity", "热": "Heat", "速度": "Speed", "高度": "Height", "距离": "Distance", "质量": "Mass", "半径": "Radius", "频率": "Frequency",
  "约 1 分钟": "About 1 minute", "约 1 天": "About 1 day", "约 1 年": "About 1 year", "2 倍": "2×", "4 倍": "4×", "8 倍": "8×", "约 67%": "About 67%", "约 33%": "About 33%", "约一半": "About half",
  "能,冲下来速度很快": "Yes, it's going fast at the bottom", "不能,最多回到 30 m": "No, at most back to 30 m", "车越重越能翻过": "A heavier car makes it over more easily",
  "车停下来了,动能消失了吗?": "The car stopped. Did its kinetic energy vanish?", "速度翻倍,v² 变成几倍?": "If speed doubles, how many times bigger is v²?",
  "黄线:你现在的轨道": "Yellow line: your current orbit", "灰线:同样出手在地球上的路线": "Gray line: the same throw on Earth"
  };
  for (var k in TASKS) { E[k] = TASKS[k]; E[k.replace(/\?$/, "")] = TASKS[k].replace(/\?$/, ""); }
  function T(s) { var y = tr(s); return y == null ? s : y; }
  var RX = [
    [/^第 (\d+) 关 · (.+)$/, function (m, n, a) { return "Level " + n + " · " + T(a); }],
    [/^第 (\d+) 关 (.+),星数 (\d)$/, function (m, n, a, k) { var y = tr(a); return y == null ? null : "Level " + n + " " + y + ", " + k + " stars"; }],
    [/^(当前任务:)?(.+?\?),(.+)$/, function (m, c, a, b) { var x = TASKS[a], y = list(b, ",", ", ") || tr(b); return x == null || y == null ? null : (c ? "Current quest: " : "") + x + ", " + y; }],
    [/^① 先预测:(.+)$/, function (m, a) { var y = tr(a); return y == null ? null : "① Predict first: " + y; }],
    [/^(\d+) (.+)$/, function (m, n, a) { var y = E[a]; return y == null ? null : n + " " + y; }],
    [/^\/ (\d+) · 第 (\d+)\/(\d+) 关$/, "/ $1 · level $2/$3"],
    [/^(\d+) 关 · 已通 (\d+) 关$/, "$1 levels · $2 cleared"],
    [/^向导 · (.+)$/, function (m, a) { return "Guide · " + T(a); }], [/^向导 ?(\S+「\S+」)$/, function (m, a) { return "Guide " + T(a); }],
    [/^当前任务:(.+)$/, function (m, a) { return "Current quest: " + T(a); }],
    [/^已通 (\d+) \/ (\d+) 关$/, "$1 / $2 levels cleared"], [/^已得 (\d+) \/ (\d+) 颗星$/, "$1 / $2 stars earned"], [/^已得 (\d+) 颗星$/, "$1 stars earned"],
    [/^难度 (\d) 星$/, "difficulty $1 stars"], [/^向导(\S+「\S+」)$/, function (m, a) { return "guide " + T(a); }],
    [/^当前:(高|中|低)(\(.+\))?。?$/, function (m, a) { return "Current: " + T(a) + "."; }],
    [/^星桥 → (.+)$/, function (m, a) { return "Star Bridge → " + T(a); }],
    [/^♪ 声音 (开|关)$/, function (m, a) { return "♪ Sound " + (a === "开" ? "on" : "off"); }]
  ];
  window.NV_I18N = { add: function (d, r) { for (var k in d) if (Object.prototype.hasOwnProperty.call(d, k)) E[k] = d[k]; if (r) RX = r.concat(RX); }, T: function (s) { return window.NV_T(s); } };
  function rx(t) { for (var i = 0; i < RX.length; i++) { if (RX[i][0].test(t)) { var r = t.replace(RX[i][0], RX[i][1]); if (r !== t && r.indexOf("null") < 0 && !CJK.test(r)) return r; } } return null; }
  function list(t, sep, out) { /* 「A,B,C」逐段翻(读屏 aria-label 常见),任何一段缺译则整句回退 */
    if (t.indexOf(sep) < 0 || !CJK.test(t)) return null; var ok = true;
    var p = t.split(sep).map(function (x) { x = x.trim(); if (!CJK.test(x)) return x; var y = E[x]; if (y == null) y = rx(x); if (y == null) ok = false; return y; });
    return ok ? p.join(out) : null;
  }
  function tr(t) { if (!t || !CJK.test(t)) return null; var y = E[t]; if (y != null) return y; y = rx(t); if (y != null) return y; return list(t, " · ", " · ") || list(t, ",", ", "); }
  window.NV_T = function (t) { if (L !== "en" || !t) return t; var y = tr(t); return y == null ? t : y; };

  /* ---------- 顶栏「中 / EN」+ 回门户带语言 ---------- */
  function chrome() {
    var css = document.createElement("style");
    css.textContent = ".nv-lang{display:inline-flex;align-items:center;gap:3px;min-height:32px;padding:0 11px;border-radius:999px;border:1px solid rgba(167,139,250,.45);background:rgba(14,11,40,.6);color:#ede9fe;font:600 12px/1 system-ui,sans-serif;letter-spacing:.04em;cursor:pointer;white-space:nowrap}.nv-lang b{color:#67e8f9}.nv-lang:hover{background:rgba(60,45,140,.7)}.nv-lang--float{position:fixed;z-index:60;top:calc(env(safe-area-inset-top,0px) + 10px);right:12px}" + (L === "en" ? ".nv-im .nv-top .nv-nav a.nv-home::before{content:\"Genesis\"!important}" : "");
    document.head.appendChild(css);
    var b = document.createElement("button"); b.type = "button"; b.className = "nv-lang"; b.setAttribute("data-noi18n", ""); b.setAttribute("aria-label", "中文 / English");
    b.innerHTML = L === "en" ? "中 / <b>EN</b>" : "<b>中</b> / EN";
    b.onclick = function () { window.NV_setLang(L === "en" ? "zh" : "en"); };
    var nav = document.querySelector(".nv-nav");
    if (nav) nav.appendChild(b); else { b.className += " nv-lang--float"; document.body.appendChild(b); }
    /* 「← 创世计划」回门户时带上当前语言 */
    var root = /\/nomoverse\/[^/]+\//.test(location.pathname) ? "../../" : "../";
    [].forEach.call(document.querySelectorAll('a[href="' + root + '"], a[href="' + root + 'index.html"]'), function (a) { a.setAttribute("href", root + "?lang=" + L); });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", chrome); else chrome();
  if (L !== "en") return;

  /* ---------- 英文模式:逐节点替换 ---------- */
  document.documentElement.lang = "en";
  var SKIP = /^(SCRIPT|STYLE|CODE|KBD|PRE|TEXTAREA|CANVAS|svg|SVG|MATH)$/;
  function skip(el) { for (var p = el; p && p.nodeType === 1; p = p.parentNode) { if (SKIP.test(p.nodeName) || p.hasAttribute("data-noi18n")) return true; } return false; }
  function node(n) {
    var v = n.nodeValue, t = v && v.trim(); if (!t || !CJK.test(t)) return;
    if (n.parentNode && skip(n.parentNode)) return;
    var y = tr(t); if (y == null) return;
    n.nodeValue = v.replace(t, y);
  }
  var AT = ["aria-label", "title", "placeholder", "alt"];
  function attrs(el) {
    if (!el.getAttribute || skip(el.nodeName === "CANVAS" ? el.parentNode : el)) return;
    for (var i = 0; i < AT.length; i++) { var v = el.getAttribute(AT[i]); if (v && CJK.test(v)) { var y = E["@" + v]; if (y == null) y = tr(v); if (y != null) el.setAttribute(AT[i], y); } }
  }
  function walk(root) {
    if (root.nodeType === 3) return node(root);
    if (root.nodeType !== 1 || skip(root)) return;
    attrs(root);
    [].forEach.call(root.querySelectorAll ? root.querySelectorAll("canvas[aria-label]") : [], attrs);
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, { acceptNode: function (n) { return n.nodeType === 1 && (SKIP.test(n.nodeName) || n.hasAttribute("data-noi18n")) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT; } }), n;
    while ((n = w.nextNode())) { if (n.nodeType === 3) node(n); else attrs(n); }
  }
  function title() { var t = document.title, y = tr(t); if (y != null && y !== t) document.title = y; }
  new MutationObserver(function (ms) {
    ms.forEach(function (m) {
      if (m.type === "characterData") node(m.target);
      else if (m.type === "attributes") attrs(m.target);
      else { [].forEach.call(m.addedNodes, walk); if (m.target.nodeName === "TITLE") title(); }
    });
  }).observe(document.documentElement, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: AT });
  function first() { title(); if (document.body) walk(document.body); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", first); else first();
})();
