/* 星图 Math Atlas · 中英双语(英文版 v0.8.6,2026-11-02;关内文字见 i18n/<任务>.js)
 * 规范同门户 v2.5.0:语言来源 URL ?lang= > 全站共享本机键 gn:lang(zh/en)> 默认中文;不按浏览器语言跳转;?lang= 会写回 gn:lang。
 * 英文模式逐个替换文本节点与 aria-label/title/placeholder/alt;词典没有的保留中文(不留空白)。
 * 公式、图示(svg/canvas)不翻译;世界码、星桥 ID、存储键(ma:v1:* / gn:ma:*)一律不变。
 * 术语按《中英术语表 v0.1》:任务 quest、关 level、知识星 knowledge star、星桥 Star Bridge、星历 Star Log。
 */
(function () {
  var q = /[?&]lang=(zh|en)\b/.exec(location.search), L = "zh";
  try { if (q) localStorage.setItem("gn:lang", q[1]); L = q ? q[1] : (localStorage.getItem("gn:lang") || "zh"); } catch (e) { L = q ? q[1] : "zh"; }
  if (L !== "en") L = "zh";
  window.MA_LANG = L;
  window.MA_setLang = function (l) {
    try { localStorage.setItem("gn:lang", l); } catch (e) {}
    var u = location.pathname + location.search.replace(/([?&])lang=(zh|en)&?/, "$1").replace(/[?&]$/, "");
    u += (u.indexOf("?") > -1 ? "&" : "?") + "lang=" + l;
    location.replace(u + location.hash);
  };
  var CJK = /[\u3400-\u9fff\uff01-\uff5e]/;
  var E = {
  /* ---------- 首页 · 顶栏 / HUD / 设置 ---------- */
  "MATH ATLAS · 数学": "MATH ATLAS · MATH", "← 创世计划": "← Genesis", "星图 Math Atlas ·": "Math Atlas ·", "数学": "Math", "星图 MATH ATLAS": "MATH ATLAS",
  "♪ 声音 关": "♪ Sound off", "♪ 声音 开": "♪ Sound on", "全屏": "Full screen", "退出全屏": "Exit full screen", "设置": "Settings",
  "任务 · 10 个问题": "Quests · 10 questions", "点亮": "Lit", "/ 197 颗知识星": "/ 197 knowledge stars", "向导只提问": "Guides only ask", "提示": "Hint", "去这一关 →": "Go to this quest →",
  "星座": "Constellations", "规划路径": "Plan a path", "只看已点亮": "Lit only", "主题": "Theme", "专注音乐": "Focus music", "笔记": "Notes", "回正": "Reset view",
  "画质": "Graphics", "自动": "Auto", "高": "High", "中": "Medium", "低 · 经典版": "Low · classic", "动态效果": "Motion", "跟随系统": "Follow system", "减少": "Reduced", "完整": "Full",
  "重看开场": "Replay intro", "完整知识星图 →": "Full knowledge map →", "反馈": "Feedback", "关于与隐私": "About & privacy", "许可": "License",
  "拖动旋转 · 滚轮或双指缩放 · 双击回正。设置只保存在这台设备上。": "Drag to rotate · scroll or pinch to zoom · double-click to reset. Settings stay on this device.",
  "跳过 · Esc": "Skip · Esc", "任务": "Quests", "知识星图": "Knowledge map", "知识笔记": "Knowledge notes", "沉浸版": "Immersive", "音乐": "Music", "音乐 关": "Music off", "点一下开声": "Tap for sound",
  "✦ 已点亮": "✦ Lit", "○ 未点亮": "○ Not lit", "· 层级": "· Level", "起点星,无需先修": "Starting star, no prerequisites", "点亮它:": "Lit by:", "👁 看见它:": "👁 See it: ",
  "星桥 · 同一个问题在别的世界": "Star Bridge · the same question in another world",
  "@回到创世计划总门户": "Back to the Genesis Portal", "@关闭": "Close", "@星图控件": "Atlas controls", "@回到初始视角": "Back to the starting view", "@回到 3D 沉浸版": "Back to the 3D immersive version",
  "@星系主题": "Galaxy theme", "@背景音乐": "Background music", "@任务": "Quests",
  /* 首页 · 开场 / 星座 / 任务卡 / 路线 */
  "无年级、问题先行。每一个问题都是一颗星——从抢松果到赌徒破产，用游戏、声音和图像，走进真正的数学。": "No grade levels, questions first. Every question is a star — from grabbing pinecones to a gambler going broke, step into real math through games, sound and pictures.",
  "开始穿越 ✦": "Start the flight ✦", "直接选任务": "Pick a quest", "个任务 ·": "quests ·", "颗知识星 · 已点亮": "knowledge stars · lit", "颗 · 最近更新": "· updated", "向下滚动": "Scroll down",
  "选一个问题出发": "Start from a question", "进度会自动保存在这台设备上，下次回来接着玩。": "Progress saves on this device automatically, so you can pick up where you left off.",
  "开始任务 →": "Start quest →", "继续任务 →": "Continue →", "✓ 已通关 · 再玩": "✓ Cleared · play again", "即将上线": "Coming soon",
  "由浅入深的路线": "A route from easy to deep", "年级为按中国学段的估算；成人任何任务都可以玩。": "Grades are estimates based on the Chinese school system; adults can play any quest.",
  "🎧 戴上耳机": "🎧 Put on headphones", "音效和专注音乐都是浏览器实时合成的。": "Sound effects and focus music are synthesized live in your browser.",
  "🤔 向导只提问": "🤔 Guides only ask", "每位博士都不直接给答案，卡住时看提示。": "No guide hands you the answer. Stuck? Open a hint.",
  "⭐ 1 颗星解锁下一关": "⭐ 1 star unlocks the next level", "想拿 3 星？少犯错、自己想明白。": "Want 3 stars? Make fewer mistakes and figure it out yourself.",
  "📒 通关看笔记": "📒 Notes after each quest", "每个任务都有一页知识笔记，可一键复制。": "Every quest has a page of knowledge notes you can copy in one tap.",
  "你的意见会变成下一颗星": "Your feedback becomes the next star", "哪里好玩、哪里卡住、想学什么问题，都可以告诉我们。": "Tell us what was fun, where you got stuck, and what you want to explore next.",
  "💬 写反馈": "💬 Send feedback", "🔊 点一下，开启星空音乐": "🔊 Tap to start the music",
  "星图 Math Atlas 测试版 · 最近更新": "Math Atlas beta · updated", "年级与难度为估算，仅供参考 · 进度只保存在你的浏览器里": "Grades and difficulty are estimates · progress stays in your browser",
  "© 2026 星图 Math Atlas · 创世计划 Genesis": "© 2026 Math Atlas · Genesis", "© 2026 星图 Math Atlas · 创世计划 Genesis ·": "© 2026 Math Atlas · Genesis ·",
  /* 年级(中国学段 ≈ 同号年级) */
  "小学 1–3 年级": "Grades 1–3", "小学 4 年级起": "Grade 4+", "小学 5 年级–初一": "Grades 5–7", "小学 5–6 年级起": "Grade 5–6+", "小学 6 年级起": "Grade 6+",
  "初一–初二起": "Grade 7–8+", "初一–初三": "Grades 7–9", "初三–高一": "Grades 9–10", "高一–高三": "Grades 10–12", "高中–大学": "High school–college",
  /* ---------- 10 个任务:标题与一句话 ---------- */
  "先拿的人一定赢吗？": "Does the first player always win?", "先拿的人一定赢吗": "Does the first player always win",
  "和超现实数抢松果：倒着想、找余数、照镜子。": "Grab pinecones against Surreal Numbers: think backwards, find remainders, mirror moves.",
  "为什么蜜蜂选六边形？": "Why do bees choose hexagons?", "为什么蜜蜂选六边形": "Why do bees choose hexagons",
  "密铺、360° 拼角、等面积比周长，最后建造蜂巢。": "Tilings, angles around 360°, perimeter at equal area — then build a honeycomb.",
  "导航怎么找到最短的路？": "How does navigation find the shortest route?", "导航怎么找到最短的路": "How does navigation find the shortest route",
  "七座桥、水波算法、贪心小蚂蚁：图论与算法。": "Seven bridges, a ripple algorithm, a greedy little ant: graph theory and algorithms.",
  "怎样把秘密藏进数字里？": "How do you hide a secret in numbers?", "怎样把秘密藏进数字里": "How do you hide a secret in numbers",
  "凯撒密码、字母侦探、质数工厂，一路破解到 RSA。": "Caesar ciphers, letter detectives, a prime factory — all the way to cracking RSA.",
  "为什么有的和弦好听？": "Why do some chords sound good?", "为什么有的和弦好听": "Why do some chords sound good", "为什么有的和弦好听?": "Why do some chords sound good?",
  "从分数一路走到傅里叶，全程用耳朵和眼睛。": "From fractions all the way to Fourier — with your ears and eyes.",
  "让 AI 认出一只猫": "Teach an AI to spot a cat", "让AI认出一只猫": "Teach an AI to spot a cat",
  "像素→坐标→梯度下降→神经网络，亲手画猫给 AI 认。": "Pixels → coordinates → gradient descent → neural networks. Draw a cat for the AI to recognize.",
  "赌场为什么总赢？": "Why does the casino always win?", "赌场为什么总赢": "Why does the casino always win", "赌场为什么总是赢？": "Why does the casino always win?",
  "硬币、骰子、轮盘与 1000 个赌徒：概率、期望与大数定律。": "Coins, dice, roulette and 1,000 gamblers: probability, expectation and the law of large numbers.",
  "传染病为什么会爆发？": "Why do epidemics break out?", "传染病为什么会爆发": "Why do epidemics break out",
  "一传二、翻倍时间、人群网络、SIR 三个水桶，最后压平曲线。": "One infects two, doubling time, contact networks, the three SIR buckets — then flatten the curve.",
  "火箭怎样飞上月球？": "How does a rocket reach the Moon?", "火箭怎样飞上月球": "How does a rocket reach the Moon",
  "速度表、导数、积分、火箭方程，最后亲手算出奔月轨道。": "Speedometers, derivatives, integrals, the rocket equation — then plot your own path to the Moon.",
  "魔方为什么能复原？": "Why can a Rubik's cube be solved?", "魔方为什么能复原": "Why can a Rubik's cube be solved",
  "对称、撤销、洗牌周期、交换子，最后复原口袋魔方。": "Symmetry, undoing, shuffle cycles, commutators — then solve a pocket cube.",
  /* ---------- 十位向导:名称、形象、为什么是它 ---------- */
  "超现实数": "Surreal Numbers", "球堆积": "Sphere Packing", "扩展图": "Expander Graphs", "格密码": "Lattice Cryptography", "朗兰兹": "Langlands",
  "扩散模型": "Diffusion Model", "随机矩阵": "Random Matrix", "渗流": "Percolation", "辛几何": "Symplectic Geometry",
  "会长枝的数之树": "A tree of numbers that keeps branching", "一球紧贴十二球": "One ball touching twelve", "彼得森图上的漫步者": "A walker on the Petersen graph",
  "格点与最短向量": "Lattice points and the shortest vector", "数与波的双环": "Twin rings of numbers and waves", "从噪声里聚成形": "Shape condensing out of noise",
  "半圆律": "The semicircle law", "临界簇": "The critical cluster", "相空间里守恒的面积": "Area preserved in phase space", "交换三角形": "A commuting triangle",
  "超现实数:康威把每一局博弈都变成了一个数。树每长一层,就生出一批新数。": "Surreal numbers: Conway turned every game into a number. Each new layer of the tree gives birth to a batch of new numbers.",
  "球堆积:2022 年菲尔兹奖。三维里,一个球最多同时贴住 12 个球。": "Sphere packing: a 2022 Fields Medal topic. In 3D, one ball can touch at most 12 others at once.",
  "扩展图:连线很少,却四通八达。光点随便走几步,就能到任何地方。": "Expander graphs: few edges, yet everything is close. A few random steps take the light anywhere.",
  "格密码:在一大片格点里找最短的那根箭头,连量子计算机都犯难。": "Lattice cryptography: finding the shortest arrow in a vast grid of points stumps even quantum computers.",
  "朗兰兹纲领:把数论(金环)和“波”(蓝环)扣在一起的大统一蓝图。": "The Langlands program: a grand blueprint linking number theory (gold ring) and waves (blue ring).",
  "扩散模型:AI 从一团随机噪点出发,一步步去噪,聚出图像。": "Diffusion models: AI starts from random noise and denoises step by step until an image appears.",
  "随机矩阵:每次都随机,特征值却总排成一个半圆(维格纳半圆律)。": "Random matrices: random every time, yet the eigenvalues always line up in a semicircle (Wigner's semicircle law).",
  "渗流:2022 年菲尔兹奖。打通的格子一过临界比例,就突然连成一片。": "Percolation: a 2022 Fields Medal topic. Once open cells pass a critical share, they suddenly join into one cluster.",
  "辛几何:轨道力学背后的几何。一团状态会被拉长扭弯,面积却永远不变。": "Symplectic geometry: the geometry behind orbital mechanics. A cloud of states gets stretched and twisted, but its area never changes.",
  "范畴论:只看“箭头”的数学。先走 f 再走 g,和直接走 g∘f 一样。": "Category theory: math that only looks at arrows. Doing f then g is the same as doing g∘f directly.",
  /* 向导提问 + 三条提示(ma-home.js GUIDE) */
  "桌上 10 颗松果,每次拿 1–3 颗,拿到最后一颗的赢。你想先拿,还是后拿?": "10 pinecones on the table. Take 1–3 each turn; whoever takes the last one wins. Do you want to go first or second?",
  "如果只剩 4 颗、轮到你拿,会怎样?": "If 4 are left and it's your turn, what happens?",
  "倒着想:哪些数量是“谁碰上谁输”?": "Think backwards: which counts are “whoever faces it loses”?",
  "这些数量之间相差几?和余数有什么关系?": "How far apart are those counts? What do they have to do with remainders?",
  "同样一圈蜡,围成正方形、三角形、六边形,哪个装的蜜最多?": "With the same length of wax wall, which holds the most honey: a square, a triangle or a hexagon?",
  "哪些形状能铺满平面、不留一点缝?": "Which shapes can cover a floor with no gaps at all?",
  "一圈是 360°,每个角多大才拼得上?": "A full turn is 360°. How big must each angle be to fit together?",
  "周长一样时,形状越接近圆,面积会怎样?": "With the same perimeter, what happens to the area as a shape gets closer to a circle?",
  "城里七座桥,能不能每座只走一次,把桥全部走完?": "The town has seven bridges. Can you cross every one exactly once?",
  "每块陆地连着几座桥?": "How many bridges touch each piece of land?",
  "进去一次就得出来一次,桥数是奇是偶要紧吗?": "Every time you go in you must come out. Does odd or even matter?",
  "找最短的路时,每步先走最近的,一定对吗?": "When finding the shortest route, is always taking the nearest step guaranteed to work?",
  "每个字母往后挪 3 位,HELLO 会变成什么?别人猜得出来吗?": "Shift every letter 3 places forward. What does HELLO become? Could someone guess it?",
  "英文里哪个字母出现得最多?": "Which letter shows up most in English?",
  "钥匙是两个大质数的乘积,把它拆开难在哪?": "The key is the product of two big primes. Why is it hard to split?",
  "乘起来容易、拆开来困难,能拿来做什么?": "Easy to multiply, hard to split apart — what could that be used for?",
  "两根弦长度比 2:1 和 3:2,为什么听起来都很和谐?": "Two strings with length ratios 2:1 and 3:2 — why do both sound harmonious?",
  "比越简单,两列声波重合得越多吗?": "The simpler the ratio, the more the two waves line up?",
  "把一个八度平均分成 12 步,每步要乘多少?": "Split an octave into 12 equal steps. What do you multiply by at each step?",
  "一个复杂的声音,能拆成几个简单的波吗?": "Can a complex sound be broken into a few simple waves?",
  "一张猫的照片,在电脑眼里只是一堆数字。它怎么知道这是猫?": "To a computer, a photo of a cat is just a pile of numbers. How does it know it's a cat?",
  "一个像素要用几个数字来表示?": "How many numbers does one pixel need?",
  "猜错了,往哪个方向改一点会更好?": "When the guess is wrong, which way should it nudge to get better?",
  "很多个简单判断叠起来,能做出复杂判断吗?": "Can many simple decisions stacked together make a complex one?",
  "轮盘每一局,赌场只比你多一点点胜算。玩上 1000 局,会怎样?": "In each spin of roulette the casino has only a tiny edge. What happens after 1,000 spins?",
  "抛 10 次和抛 1000 次硬币,哪次的正面比例更接近一半?": "10 coin flips or 1,000 — which gets the share of heads closer to half?",
  "每押 1 元,平均能拿回多少?": "For every 1 chip you bet, how much comes back on average?",
  "1000 个赌徒一起玩,最后谁是赢家?": "If 1,000 gamblers play, who wins in the end?",
  "一个人传给两个,两个传给四个……第 10 轮会有多少人?": "One person infects two, two infect four… how many by round 10?",
  "每轮翻一倍,几轮就会超过 1000?": "Doubling every round, how many rounds until it passes 1,000?",
  "人和人之间的连接,让传播变快还是变慢?": "Do the connections between people speed spreading up or slow it down?",
  "健康、生病、康复三个水桶,水怎样流?": "Healthy, sick, recovered — how does water flow between the three buckets?",
  "从地球飞到月球,火箭至少要多快?": "To fly from Earth to the Moon, how fast does a rocket need to go, at least?",
  "速度一直在变,怎么知道某一刻有多快?": "If speed keeps changing, how do you know how fast it is at one instant?",
  "把每一小段路加起来,会得到什么?": "What do you get when you add up every tiny stretch of the trip?",
  "燃料越烧越轻,火箭会越飞越快吗?": "As fuel burns off and the rocket gets lighter, does it keep speeding up?",
  "同一个动作一直重复,魔方一定会转回原样吗?": "Repeat the same move over and over — will the cube always come back to the start?",
  "同一面转四次,会发生什么?": "Turn the same face four times. What happens?",
  "先 A 后 B,和先 B 后 A 一样吗?": "Is A then B the same as B then A?",
  "做一个动作再“撤销”,中间能悄悄换走什么?": "Do a move, then “undo” it — what can quietly get swapped in between?",
  /* 知识星 197 颗 + 9 星座(术语表:知识星 knowledge star) */
  "数与运算": "Numbers & Operations", "代数与结构": "Algebra & Structure", "几何与空间": "Geometry & Space", "变化与极限": "Change & Limits",
  "随机与数据": "Chance & Data", "离散与算法": "Discrete Math & Algorithms", "数论": "Number Theory", "模型与最优化": "Models & Optimization", "证明与基础": "Proof & Foundations",
  "数数、位值、分数、小数——一切数学的地基。": "Counting, place value, fractions, decimals — the bedrock of all math.",
  "从未知数到方程、函数与结构，用符号描述规律。": "From unknowns to equations, functions and structures: describing patterns with symbols.",
  "形状、角度、对称、坐标与空间。": "Shapes, angles, symmetry, coordinates and space.",
  "速度、斜率、极限与微积分：理解“变化”。": "Speed, slope, limits and calculus: understanding change.",
  "可能性、统计与期望，看懂不确定的世界。": "Chance, statistics and expectation: making sense of an uncertain world.",
  "图、递归、算法与博弈：会思考的步骤。": "Graphs, recursion, algorithms and games: steps that think.",
  "质数、余数与同余，藏着密码的秘密。": "Primes, remainders and congruences — where codes keep their secrets.",
  "建模、最优化与机器学习：用数学做决定。": "Modeling, optimization and machine learning: deciding with math.",
  "说理、证明、逻辑与集合，数学的骨架。": "Reasoning, proof, logic and sets — the skeleton of math.",
  "计数与一一对应": "Counting & one-to-one matching", "位值与十进制": "Place value & base ten", "加法与减法": "Addition & subtraction", "乘法": "Multiplication",
  "除法与余数": "Division & remainders", "分数": "Fractions", "小数": "Decimals", "百分数": "Percentages", "比与比例": "Ratio & proportion", "负数": "Negative numbers",
  "运算律": "Laws of arithmetic", "乘方与指数": "Powers & exponents", "平方根": "Square roots", "无理数": "Irrational numbers", "实数与数轴": "Real numbers & the number line",
  "科学记数法与数量级": "Scientific notation & orders of magnitude", "估算与近似": "Estimation & approximation", "复数": "Complex numbers",
  "模运算(时钟算术)": "Modular arithmetic (clock math)", "二进制与进制": "Binary & number bases", "无穷与可数性": "Infinity & countability", "p进数": "p-adic numbers", "四元数": "Quaternions",
  "模式与规律": "Patterns", "用字母表示数": "Letters for numbers", "代数式与化简": "Expressions & simplifying", "一元一次方程": "Linear equations",
  "不等式": "Inequalities", "二元一次方程组": "Systems of linear equations", "一元二次方程": "Quadratic equations", "多项式": "Polynomials", "因式分解": "Factoring",
  "函数概念": "The idea of a function", "一次函数": "Linear functions", "二次函数": "Quadratic functions", "指数函数": "Exponential functions", "对数": "Logarithms",
  "反比例函数": "Inverse proportion", "函数图像变换": "Transforming graphs", "数列": "Sequences", "等差与等比数列": "Arithmetic & geometric sequences",
  "向量空间": "Vector spaces", "矩阵与线性变换": "Matrices & linear maps", "行列式": "Determinants", "特征值与特征向量": "Eigenvalues & eigenvectors",
  "群": "Groups", "环与域": "Rings & fields", "伽罗瓦理论": "Galois theory", "表示论": "Representation theory", "范畴论": "Category Theory",
  "线性方程组与消元": "Linear systems & elimination", "奇异值分解": "Singular value decomposition", "张量": "Tensors",
  "平面图形": "Plane shapes", "立体图形": "Solid shapes", "长度与测量": "Length & measurement", "角": "Angles", "周长与面积": "Perimeter & area", "对称": "Symmetry",
  "平移旋转与反射": "Translations, rotations & reflections", "体积": "Volume", "三角形": "Triangles", "平行与垂直": "Parallel & perpendicular", "坐标系": "Coordinates",
  "全等": "Congruence", "相似": "Similarity", "勾股定理": "Pythagorean theorem", "向量": "Vectors", "圆与π": "Circles & π", "三角比": "Trig ratios",
  "三角函数": "Trig functions", "尺规作图": "Compass & straightedge", "解析几何": "Analytic geometry", "圆锥曲线": "Conic sections", "空间几何": "Solid geometry",
  "三视图与投影": "Views & projections", "非欧几何": "Non-Euclidean geometry", "分形": "Fractals", "拓扑初步": "Intro to topology", "曲线与曲率": "Curves & curvature",
  "微分几何": "Differential geometry", "流形": "Manifolds", "代数拓扑": "Algebraic topology", "极坐标": "Polar coordinates", "四维空间": "Four-dimensional space",
  "变化率": "Rate of change", "斜率": "Slope", "数列极限": "Limits of sequences", "函数极限与连续": "Limits & continuity", "导数": "Derivatives",
  "求导法则": "Rules of differentiation", "极值与最优": "Maxima, minima & optima", "积分与面积": "Integrals & area", "微积分基本定理": "Fundamental theorem of calculus",
  "级数": "Series", "泰勒展开": "Taylor expansion", "多元函数与偏导": "Multivariable functions & partial derivatives", "多重积分": "Multiple integrals",
  "向量场、散度与旋度": "Vector fields, divergence & curl", "常微分方程": "Ordinary differential equations", "偏微分方程": "Partial differential equations",
  "傅里叶级数": "Fourier series", "傅里叶变换": "Fourier transform", "实分析": "Real analysis", "测度论": "Measure theory", "复分析": "Complex analysis",
  "泛函分析": "Functional analysis", "变分法": "Calculus of variations", "动力系统与混沌": "Dynamical systems & chaos", "e与自然增长": "e & natural growth",
  "分类与计数统计": "Sorting & tallying", "统计图表": "Charts & graphs", "平均数、中位数、众数": "Mean, median & mode", "可能性": "Likelihood",
  "古典概率": "Classical probability", "条件概率": "Conditional probability", "贝叶斯思想": "Bayesian thinking", "随机变量与期望": "Random variables & expectation",
  "方差与离散程度": "Variance & spread", "二项分布": "Binomial distribution", "正态分布": "Normal distribution", "大数定律": "Law of large numbers",
  "中心极限定理": "Central limit theorem", "抽样与估计": "Sampling & estimation", "假设检验": "Hypothesis testing", "相关与回归": "Correlation & regression",
  "随机游走": "Random walks", "马尔可夫链": "Markov chains", "信息熵": "Information entropy", "统计学习": "Statistical learning",
  "实验设计与因果": "Experiment design & causality", "蒙特卡洛方法": "Monte Carlo methods",
  "分类与排序": "Sorting & ordering", "规律与递推": "Patterns & recursion rules", "加法与乘法原理": "Rules of sum & product", "排列组合": "Permutations & combinations",
  "杨辉三角与二项式": "Pascal's triangle & binomials", "鸽巢原理": "Pigeonhole principle", "图论初步": "Intro to graph theory", "树与网络": "Trees & networks",
  "最短路径": "Shortest paths", "算法与流程": "Algorithms & flowcharts", "递归": "Recursion", "算法复杂度": "Algorithmic complexity", "容斥原理": "Inclusion–exclusion",
  "生成函数": "Generating functions", "图着色与平面图": "Graph coloring & planar graphs", "布尔代数与电路": "Boolean algebra & circuits", "密码学": "Cryptography",
  "纠错码": "Error-correcting codes", "组合博弈": "Combinatorial games", "网络科学": "Network science",
  "奇数与偶数": "Odd & even", "倍数与因数": "Multiples & factors", "质数": "Primes", "质因数分解": "Prime factorization",
  "最大公约数与最小公倍数": "GCD & LCM", "辗转相除法": "Euclidean algorithm", "同余": "Congruence (mod)", "费马小定理与欧拉定理": "Fermat's little theorem & Euler's theorem",
  "不定方程": "Diophantine equations", "质数分布": "Distribution of primes", "二次剩余": "Quadratic residues", "黎曼ζ函数": "Riemann zeta function",
  "代数数论": "Algebraic number theory", "椭圆曲线": "Elliptic curves", "连分数": "Continued fractions",
  "量与单位": "Quantities & units", "比例模型": "Proportional models", "线性模型": "Linear models", "指数模型": "Exponential models", "线性规划": "Linear programming",
  "最优化与极值": "Optimization", "梯度下降": "Gradient descent", "凸优化": "Convex optimization", "博弈论": "Game theory", "动态规划": "Dynamic programming",
  "数值方法": "Numerical methods", "微分方程建模": "Modeling with differential equations", "神经网络": "Neural networks", "控制论": "Control theory",
  "运筹与调度": "Operations research & scheduling", "数学建模全流程": "The full modeling cycle",
  "说理与举例": "Reasoning & examples", "命题与逻辑联结词": "Propositions & connectives", "量词": "Quantifiers", "集合": "Sets", "映射与关系": "Maps & relations",
  "直接证明与反证法": "Direct proof & contradiction", "数学归纳法": "Mathematical induction", "公理化思想": "The axiomatic method", "可计算性": "Computability",
  "哥德尔不完备定理": "Gödel's incompleteness theorems", "形式化证明(Lean)": "Formal proof (Lean)", "公理集合论与选择公理": "Axiomatic set theory & the axiom of choice",
  "类型论": "Type theory", "数学写作与表达": "Mathematical writing",
  /* ---------- 任务页通用 ---------- */
  "@反馈": "Feedback", "@回到主页": "Back to home", "@回到各部分": "Jump to section", "@星图导航": "Atlas navigation", "@清空进度重来": "Clear progress and restart",
  "@游戏状态": "Game status", "@知识星图": "Knowledge map", "@知识笔记": "Knowledge notes", "@笔记": "Notes", "@进度自动保存在这台设备的浏览器里": "Progress saves automatically in this browser",
  "@选择曲目": "Choose a track", "@音乐音量": "Music volume", "@开始": "Start",
  "✓ 自动保存": "✓ Auto-saved", "主页": "Home", "星图": "Atlas", "五关任务": "A five-level quest", "六关任务": "A six-level quest", "七关任务": "A seven-level quest",
  "做到了才会亮起来。": "They light up only when you earn them.", "完成上一关解锁": "Clear the previous level to unlock", "可以开始": "Ready to start", "徽章架": "Badge shelf",
  "星空 Lo-fi": "Starry Lo-fi", "晨光": "Morning Light", "雨夜书房": "Rainy Study", "随机轮播": "Shuffle", "正在播放:—": "Now playing: —",
  "每关得 1–3 颗星，拿到 1 颗星就解锁下一关。": "Earn 1–3 stars per level; 1 star unlocks the next level.",
  "每颗星是一个数学知识点，过关时点亮。": "Each star is a math idea; it lights up when you clear a level.",
  "选一关开始": "Pick a level to start", "重来": "Restart", "🎵 专注音乐": "🎵 Focus music", "📒 知识笔记": "📒 Knowledge notes", "📒 笔记": "📒 Notes", "🔊 音效": "🔊 Sound FX",
  "开始任务": "Start quest", "第一站": "First stop", "任务完成后": "After the quest", "关闭 ✕": "Close ✕", "BOSS 关": "BOSS level", "猜错不扣分，猜完我们一起验证。": "Wrong guesses cost nothing. Guess, then we'll check together.",
  "先猜。": "Guess first.", "先猜，再动手。": "Guess first, then try it.", "先猜，再洗。": "Guess first, then shuffle.", "先凭直觉猜，猜错不扣分。": "Go with your gut — wrong guesses cost nothing.",
  "声音全部由 Web Audio 实时合成，不读取任何外部文件。": "All sound is synthesized live with Web Audio; no external files are loaded.",
  "难度 ★☆☆ 入门": "Difficulty ★☆☆ Beginner", "难度 ★★☆ 进阶": "Difficulty ★★☆ Intermediate", "难度 ★★★ 中阶": "Difficulty ★★★ Intermediate+", "难度 ★★★ 挑战": "Difficulty ★★★ Challenge",
  "难度 ★★★★☆ 进阶": "Difficulty ★★★★☆ Advanced", "难度 ★★★★★ 挑战": "Difficulty ★★★★★ Challenge",

  /* ===== nim 先拿的人一定赢吗 ===== */
  "秋天到了，森林里有一堆松果。超现实数和你玩“抢松果”：轮流拿，拿到最后一颗的人赢。可超现实数总是赢，它有什么秘密？": "It's autumn, and there's a pile of pinecones in the forest. Surreal Numbers plays “Grab the Pinecones” with you: take turns, and whoever takes the last one wins. But Surreal Numbers always wins. What's the secret?",
  "适合 小学一~三年级": "For grades 1–3", "前置 数到20、加减": "Needs: counting to 20, adding and subtracting",
  "第 1 关「抢10颗松果」已开放。": "Level 1 “Grab 10 pinecones” is open.",
  "和超现实数比一比！拿到 1 颗星，就能解锁第 2 关「倒着想」。": "Take on Surreal Numbers! Earn 1 star to unlock level 2 “Think backwards”.",
  "从抢松果开始，找出“先拿”的秘密。": "Start by grabbing pinecones and uncover the secret of going first.",
  "每关得 1–3 颗星。全部 5 关已开放：上一关拿到 1 颗星，下一关就解锁。第 5 关是 BOSS 关！": "Earn 1–3 stars per level. All 5 levels are here: 1 star in one level unlocks the next. Level 5 is the BOSS level!",
  "抢10颗松果": "Grab 10 pinecones", "每次拿1或2颗，拿到最后一颗的赢": "Take 1 or 2 each turn; whoever takes the last one wins",
  "倒着想": "Think backwards", "从最后一颗往回推": "Work back from the last pinecone", "换个规则": "Change the rules", "每次能拿更多颗时怎么办": "What if you can take more each turn?",
  "为什么总能赢": "Why you can always win", "把秘密说清楚": "Explain the secret", "BOSS 松鼠大王的挑战": "BOSS: The Squirrel King's challenge", "两堆松果，像照镜子一样拿": "Two piles: take like a mirror",
  "超现实数在星图上等你。": "Surreal Numbers is waiting for you on the map.",
  "点开第 1 关「抢10颗松果」。你先拿，我后拿，看谁拿到最后一颗！": "Open level 1 “Grab 10 pinecones”. You go first, I go second — let's see who gets the last one!",
  "超现实数只问问题，不直接给答案。": "Surreal Numbers only asks questions; it never just gives the answer.",
  "小侦探": "Little Detective", "倒推小能手": "Backwards Thinker", "规则破解者": "Rule Breaker", "小小说理家": "Young Reasoner", "松鼠大王的克星": "Squirrel King Slayer",
  "通过全部 5 关，点亮这 4 颗星。": "Clear all 5 levels to light these 4 stars.", "打败第 5 关的松鼠大王，这里就会亮起来。": "Beat the Squirrel King in level 5 and this lights up.",
  "🔒 任务完成画面 · 打败松鼠大王后开放": "🔒 Quest-complete screen · opens after you beat the Squirrel King",
  "10 ÷ 3 = 3 余 1，先拿掉余数。": "10 ÷ 3 = 3 remainder 1: take the remainder first.", "9、6、3、0：每次少 3。": "9, 6, 3, 0: 3 fewer each time.",
  "说清楚为什么总能赢。": "Explain why you can always win.", "必胜位置与必败位置。": "Winning and losing positions.",
  "你先拿，我后拿。每次拿1颗或2颗，拿到最后一颗松果的人赢！": "You go first, I go second. Take 1 or 2 each turn; whoever takes the last pinecone wins!",
  "点“拿1颗”“拿2颗”，或直接点最右边的松果。": "Tap “Take 1” or “Take 2”, or tap the rightmost pinecone.",
  "倒着想！从最下面开始。第 0 级没有松果了：轮到谁，谁就输，所以它是红色。": "Think backwards! Start at the bottom. Step 0 has no pinecones left: whoever's turn it is loses, so it's red.",
  "点亮着的台阶换颜色（未知→红→绿），想好了再点“✓ 确认”。一级一级往上涂。": "Tap the glowing step to change its color (unknown → red → green), then tap “✓ Confirm”. Paint your way up step by step.",
  "新规则：20 颗松果，每次可以拿 1 颗、2 颗或 3 颗。拿到最后一颗的人赢！": "New rules: 20 pinecones, and you may take 1, 2 or 3 each turn. Whoever takes the last one wins!",
  "开局前先选：你先拿，还是让超现实数先拿？": "Before you start, choose: will you go first, or let Surreal Numbers go first?",
  "这关换你来当“超现实数”！小狐狸先拿，每次拿 1~3 颗。": "This time you play Surreal Numbers! Little Fox goes first, taking 1–3 each turn.",
  "小狐狸拿完，轮到你：让你们俩这一轮拿的加起来正好是 4，凑成“一对”。": "After Little Fox moves, it's your turn: make your two takes add up to exactly 4 — a “pair”.",
  "松鼠大王来了！这次有两棵树，每棵树上一堆松果。轮到你时，选一棵树，从上面拿任意颗（至少 1 颗）。拿到最后一颗的人赢！": "The Squirrel King is here! Two trees, each with a pile of pinecones. On your turn, pick a tree and take as many as you like (at least 1). Whoever takes the last one wins!",
  "点一颗松果：它和它上面的松果都会被选中，再按“拿走”。": "Tap a pinecone: it and every pinecone above it get selected. Then press “Take”.",
  "我是松鼠大王！三场比赛，你能赢我吗？": "I am the Squirrel King! Three matches — can you beat me?",

  /* ===== bee 为什么蜜蜂选六边形 ===== */
  "从铺地砖开始，弄明白蜜蜂为什么选六边形。": "Start by tiling a floor and work out why bees choose hexagons.",
  "难度 ★☆☆ 入门 · 适合小学4年级起(约10岁+) · 前置:角度、周长、面积": "Difficulty ★☆☆ Beginner · grade 4+ (about age 10+) · needs: angles, perimeter, area",
  "哪些形状能铺满地面": "Which shapes can tile a floor", "密铺与正多边形的内角": "Tilings and interior angles of regular polygons",
  "绕一圈是多少度": "How many degrees in a full turn", "周角 360°": "A full angle is 360°", "同样的蜜，谁的墙最省": "Same honey: whose wall uses least wax",
  "泡泡自己会排队": "Bubbles line up by themselves", "自然里的六边形": "Hexagons in nature", "BOSS 蜂巢建造者": "BOSS: Honeycomb Builder",
  "球堆积在星图上等你。": "Sphere Packing is waiting for you on the map.",
  "点开第 1 关「哪些形状能铺满地面」。先猜，再试：哪些正多边形能把地面铺得一条缝都没有？": "Open level 1 “Which shapes can tile a floor”. Guess first, then try: which regular polygons can cover a floor with no gaps?",
  "球堆积只问问题，不直接给答案。": "Sphere Packing only asks questions; it never just gives the answer.",
  "铺满大师": "Tiling Master", "角度猎人": "Angle Hunter", "省蜡专家": "Wax Saver", "泡泡魔法师": "Bubble Wizard", "蜂巢建造者": "Honeycomb Builder",
  "地面要铺得一条缝都没有，也不能叠在一起。先选一个形状，在猜想表里猜:它能铺满吗?": "The floor must be covered with no gaps and no overlaps. Pick a shape and guess in the table: can it tile the floor?",
  "先猜 ✔ 或 ✘，猜完才能点「试一试」。": "Guess ✔ or ✘ first; then you can press “Try it”.",
  "开始之前，球堆积先考你一个问题:一个点周围一圈是多少度?": "Before we start, Sphere Packing has a question: how many degrees go all the way around a point?",
  "答对了，再去拼角。": "Get it right, then go fit the angles.",
  "蜜蜂造墙要花蜡币，墙越长越贵。下面 4 个形状面积都是 1,装的蜜一样多。谁的墙最费蜡?": "Bees pay wax coins for walls — the longer, the costlier. These 4 shapes all have area 1 and hold the same honey. Whose wall costs the most wax?",
  "先排队:从最费蜡排到最省蜡，再点「揭晓」。": "Line them up from most wax to least, then press “Reveal”.",
  "盒子里挤着 30 个泡泡，每个泡泡占住离自己最近的地盘。先猜一猜:一直放松下去，中间的格子最后多数是几边形?": "30 bubbles are squeezed in a box, each claiming the area nearest to it. Guess: if they keep relaxing, how many sides will most middle cells end up with?",
  "猜完才能开始放松。": "Guess first, then you can start relaxing.",
  "你是蜂后的建筑师。每一波只有 100 枚蜡币，要装下尽量多的蜜。": "You are the queen bee's architect. Each wave has only 100 wax coins — hold as much honey as you can.",
  "选格子形状，点画布放格子，再点一下拆掉，按住拖动能连着放。": "Pick a cell shape, tap the canvas to place it, tap again to remove, drag to place several.",

  /* ===== nav 导航怎么找到最短的路 ===== */
  "难度 ★★☆ 进阶 · 适合 小学五年级~初一 · 前置 加法、比较大小": "Difficulty ★★☆ Intermediate · grades 5–7 · needs: addition, comparing sizes",
  "手机导航一秒就算出最短路线——它是怎么做到的？跟着扩展图 🕸️ 一起找答案。蚂蚁真的会找短路哦。": "A phone finds the shortest route in a second — how? Find out with Expander Graphs 🕸️. Ants really do find short paths.",
  "5 关任务 · 第 1 关已开放 · 每关 1–3 颗星": "5 levels · level 1 is open · 1–3 stars per level",
  "先把地图变成点和线，再一步步找到最短的路。": "First turn the map into dots and lines, then find the shortest route step by step.",
  "5 关全部开放：每关得 1–3 颗星，拿到 1 颗星就解锁下一关，第 5 关是 BOSS。": "All 5 levels are here: earn 1–3 stars per level, 1 star unlocks the next, and level 5 is the BOSS.",
  "地图变成点和线": "Turn the map into dots and lines", "d07 图论初步 · 点、边、权重": "d07 Intro to graph theory · vertices, edges, weights",
  "七座桥能一笔走完吗": "Can you cross all seven bridges in one go", "欧拉路径 · 一笔画": "Euler paths · one stroke", "水波找最短路": "Ripples find the shortest path", "Dijkstra 算法": "Dijkstra's algorithm",
  "算法比快慢": "Racing algorithms", "BOSS 快递小蚂蚁": "BOSS: The Courier Ant", "BOSS 关 · 图 + Dijkstra + 树与网络": "BOSS level · graphs + Dijkstra + trees & networks",
  "扩展图在星图上等你。": "Expander Graphs is waiting for you on the map.",
  "点开第 1 关「地图变成点和线」。导航看到的地图，和你看到的一样吗？": "Open level 1 “Turn the map into dots and lines”. Does a navigator see the same map you do?",
  "扩展图只问问题，不直接给答案。": "Expander Graphs only asks questions; it never just gives the answer.",
  "地图抽象师": "Map Abstractor", "欧拉的徒弟": "Euler's Apprentice", "水波导航员": "Ripple Navigator", "算法裁判": "Algorithm Referee", "金牌快递员": "Gold-Medal Courier",
  "这次任务要点亮的星": "Stars this quest lights", "通关对应的关卡，星星就会亮起来。": "Clear the matching level and the star lights up.",
  "手机导航看到的，真是我们看到的这张彩色地图吗？先动手试试：点一下每个地方，放下一个点。": "Is this colorful map really what phone navigation sees? Try it: tap each place to drop a dot.",
  "提示：点地图上的 🏫🏠🌳🏪🏥📚。": "Hint: tap 🏫🏠🌳🏪🏥📚 on the map.",
  "一笔画：笔不离开纸，每条线正好画一次。点一个点出发，再一个接一个点相邻的点。": "One stroke: never lift the pen, draw every line exactly once. Tap a dot to start, then tap neighboring dots one by one.",
  "用过的线会变金色，不能再走。": "Lines you've used turn gold and can't be used again.",
  "从 🏠 到 🏫，哪条路线最快？从 🏠 出发，一个接一个点相邻的地方，一直走到 🏫。": "From 🏠 to 🏫, which route is fastest? Start at 🏠 and tap neighboring places one by one until you reach 🏫.",
  "路上的数字是分钟。点走过的点可以退回去。": "The numbers are minutes. Tap a dot you've visited to step back.",
  "BOSS 关！城里 20 个路口、29 条路，路上的数字是堵车后的分钟数。从蚁窝 🐜🏠 出发，一个个点相邻的路口，把包裹送到 📦。": "BOSS level! 20 crossroads, 29 roads; the numbers are minutes in traffic. Start at the anthill 🐜🏠, tap neighboring crossroads one by one, and deliver the parcel to 📦.",
  "你的路线要和算法算出的最快路线一样快。点走过的路口可以退回去。": "Your route must be as fast as the algorithm's fastest route. Tap a visited crossroad to step back.",
  "MISSION COMPLETE！从一张彩色地图，到一棵最短路树，导航的秘密你全都找到了。": "MISSION COMPLETE! From a colorful map to a shortest-path tree, you've uncovered every secret of navigation.",
  "扩展图为你骄傲 🐜": "Expander Graphs is proud of you 🐜",
  "长得像不代表一样。目标图里🌳连着谁？在每张候选图里，🌳也连着它们吗？": "Looking alike doesn't mean being the same. Who is 🌳 connected to in the target? In each candidate, is 🌳 connected to them too?",
  "别管点放在哪、线弯不弯，一条一条对：🏪连着🏠和🏫，🌳连着🏠和🏫。哪张图每条都对得上？": "Ignore where dots sit or how lines bend; check line by line: 🏪 links 🏠 and 🏫, 🌳 links 🏠 and 🏫. Which graph matches every line?",
  "目标图里，📚 连了几条线？在候选图里找找 📚，它也连了这么多吗？": "In the target, how many lines touch 📚? Find 📚 in each candidate — does it have that many too?",
  "📚 连着其他四个地方，另外还有一条 🏥—🏪。哪张图里这五条线一条不多、一条不少？": "📚 connects to the other four places, plus one more line 🏥—🏪. Which graph has exactly these five lines?",
  "点和线的个数都一样，怎么分辨？试试数一数：每个点各连了几条线？": "Same number of dots and lines — how can you tell them apart? Count how many lines touch each dot.",
  "目标图里只有一个点连了 3 条线，也只有一个点只连 1 条线。哪张候选图也是这样？它们是不是还挨在一起？": "In the target, only one dot has 3 lines and only one dot has 1. Which candidate matches? Are those two dots next to each other?",

  /* ===== secret 怎样把秘密藏进数字里 ===== */
  "六关任务 · 星际特工": "A six-level quest · Star Agent",
  "两千年来,人类一直在用数学藏秘密。今天,你要学会藏,也要学会破。": "For two thousand years, people have hidden secrets with math. Today you'll learn to hide them — and to crack them.",
  "你是一名星际特工。每关得 1–3 颗星,拿到 1 颗星就解锁下一关。": "You are a star agent. Earn 1–3 stars per level; 1 star unlocks the next.",
  "难度 ★★☆ 进阶 · 适合小学5–6年级起(约11岁+) · 小学生可先玩到第4关,第5–6关初二以上更顺": "Difficulty ★★☆ Intermediate · grade 5–6+ (about age 11+) · younger players can go up to level 4; levels 5–6 suit grade 8+",
  "凯撒密码轮": "Caesar cipher wheel", "模运算": "Modular arithmetic", "字母侦探": "Letter detective", "频率与统计": "Frequency & statistics", "钟表算术": "Clock arithmetic",
  "同余与逆元": "Congruence & inverses", "质数工厂": "Prime factory", "质数与分解": "Primes & factoring", "公开的锁·私人的钥匙": "Public lock, private key", "BOSS 截获情报": "BOSS: Intercepted intel",
  "格密码在星图上等你。": "Lattice Cryptography is waiting for you on the map.",
  "特工,点开第 1 关「凯撒密码轮」。两千年前,凯撒就是把每个字母往后挪几格来传密信的。": "Agent, open level 1 “Caesar cipher wheel”. Two thousand years ago, Caesar sent secret letters by shifting every letter a few places.",
  "格密码只问问题,不直接给答案。": "Lattice Cryptography only asks questions; it never just gives the answer.",
  "密码学徒": "Cipher Apprentice", "频率侦探": "Frequency Detective", "时钟大师": "Clock Master", "质数猎人": "Prime Hunter", "锁匠": "Locksmith", "首席破译官": "Chief Codebreaker",
  "字母走到 Z 之后,下一个该去哪?像不像时钟?": "After Z, where does the next letter go? Isn't it like a clock?",
  "先选一个答案,再去转动密码轮。": "Pick an answer first, then turn the cipher wheel.",
  "如果你是敌人,换了偏移,但英语里哪个字母还是最常出现?": "Say you're the enemy and change the shift. In English, which letter still shows up the most?",
  "先选一个答案,再去看截获的密文。": "Pick an answer first, then look at the intercepted ciphertext.",
  "钟表走到 12 之后会去哪?余数是不是一直在 0 到 11 之间打转?": "After 12, where does the clock go? Do remainders keep cycling between 0 and 11?",
  "先选一个答案,再去拨钟面。": "Pick an answer first, then turn the clock face.",
  "一个数如果只能被 1 和它自己整除,还能再拆小吗?": "If a number can only be divided by 1 and itself, can it be broken down further?",
  "先选一个答案,再去筛数。": "Pick an answer first, then sieve the numbers.",
  "如果你把锁头发给全世界,但钥匙只留在自己手里,别人能给你寄秘密吗?": "If you send your padlock to the whole world but keep the key, can others send you secrets?",
  "先选一个答案,再看动画。": "Pick an answer first, then watch the animation.",
  "这次的锁是公开的。你手里有锁,缺的是什么?": "This time the lock is public. You have the lock — what's missing?",
  "敌方特工发出了两段情报。你有 3 颗能量电池,答错一次耗一颗。": "Enemy agents sent two messages. You have 3 power cells; each wrong answer uses one.",

  /* ===== chord 为什么有的和弦好听(单页七颗星) ===== */
  "星图任务 · 7 颗星": "Math Atlas quest · 7 stars", "星图任务 · 为什么有的和弦好听?": "Why do some chords sound good?",
  "不需要任何基础。你将从“分数”一路走到“傅里叶分析”。全程用耳朵和眼睛。": "No background needed. You'll go from fractions all the way to Fourier analysis — with your ears and eyes.",
  "难度 ★★☆ 进阶 · 适合小学6年级起(约12岁+) · 对数是高一内容、傅里叶是大学内容,以听和看为主": "Difficulty ★★☆ Intermediate · grade 6+ (about age 12+) · logarithms are grade 10 and Fourier is college level, so it's mostly listening and looking",
  "点击开启声音": "Tap to turn on sound", "音量": "Volume", "全部停止": "Stop all",
  "好奇": "Curiosity", "猜想": "Conjecture", "比与分数": "Ratios & fractions", "周期": "Periods", "对数与平均律": "Logs & equal temperament", "傅里叶": "Fourier", "创造": "Create",
  "第 1 颗星 · 好奇": "Star 1 · Curiosity", "随便按两个音。有的组合舒服,有的难受。为什么?": "Press any two notes. Some pairs feel good, some feel bad. Why?", "先别查答案。": "Don't look up the answer yet.",
  "AI导师": "AI tutor", "你能找到一对让你皱眉的音吗?": "Can you find a pair that makes you wince?", "再找一对让你放松的。它们在键盘上相隔多远?": "Now find a pair that relaxes you. How far apart are they on the keyboard?",
  "第 2 颗星 · 猜想": "Star 2 · Conjecture", "先下注:是什么决定了两个音好不好听?": "Place your bet: what decides whether two notes sound good together?",
  "回看你的听感记录。": "Look back at your listening log.", "好听的那些组合,有什么共同点?": "What do the nice-sounding pairs have in common?",
  "第 3 颗星 · 比与分数": "Star 3 · Ratios & fractions", "拖动琴码,把弦截成分数,听两根弦一起响。": "Drag the bridge to cut the string into a fraction, and hear both strings together.",
  "上面一根是 220 Hz 的空弦;下面一根被琴码截短,频率 = 220 ÷ 分数。": "The top string is an open 220 Hz string; the bottom one is shortened by the bridge: frequency = 220 ÷ fraction.",
  "把弦缩到1/2,频率会变成多少?": "Shorten the string to 1/2. What does the frequency become?", "先猜,再听。": "Guess first, then listen.",
  "第 4 颗星 · 周期": "Star 4 · Periods", "比越简单,合成波重复得越快,大脑越容易‘看懂’——这就是和谐。": "The simpler the ratio, the sooner the combined wave repeats and the easier it is for your brain to “read” — that's harmony.",
  "细线是两个音,粗线是它们叠加后的合成波,虚线标出合成波重新开始的地方。": "Thin lines are the two notes; the thick line is their sum; dashed lines mark where the combined wave starts over.",
  "为什么15:16要等那么久才重复?": "Why does 15:16 take so long to repeat?",
  "第 5 颗星 · 对数与十二平均律": "Star 5 · Logarithms & 12-tone equal temperament", "把八度平均切成 12 份,每一步都乘同一个数。": "Cut the octave into 12 equal steps, multiplying by the same number each step.",
  "只用完美分数,换个调弹同一首曲子就会走调。人类的办法:把八度平均分成12份,每一步频率都乘同一个数 r,且 r¹² = 2。": "With perfect fractions only, a song goes out of tune when you change key. Our fix: split the octave into 12 equal steps, multiplying the frequency by the same r each step, with r¹² = 2.",
  "为什么一定是12份?": "Why exactly 12 steps?", "想象分成7份会怎样?": "Imagine splitting it into 7. What happens?",
  "第 6 颗星 · 傅里叶": "Star 6 · Fourier", "任何声音都能拆成一组正弦波。": "Any sound can be broken into a set of sine waves.",
  "8 个滑块是 220 Hz 的第 1–8 次谐波。推一推,看波形和频谱怎么变。": "The 8 sliders are harmonics 1–8 of 220 Hz. Push them and watch the waveform and spectrum change.",
  "只用奇数次谐波,波形会变成什么样?": "With only odd harmonics, what does the waveform turn into?", "试试“类单簧管”和“方波近似”。": "Try “clarinet-like” and “square-ish”.",
  "第 7 颗星 · 创造": "Star 7 · Create", "用你学到的数学做一段音乐。": "Make some music with the math you've learned.",
  "用你学到的数学做一段音乐,然后讲给朋友听:为什么这几个音放在一起好听?讲得出来,才算真懂。": "Make some music with the math you've learned, then explain to a friend why these notes sound good together. If you can explain it, you really get it.",
  "@第 1 关:好奇": "Level 1: Curiosity", "@第 2 关:猜想": "Level 2: Conjecture", "@第 3 关:比与分数": "Level 3: Ratios & fractions", "@第 4 关:周期": "Level 4: Periods",
  "@第 5 关:对数与平均律": "Level 5: Logs & equal temperament", "@第 6 关:傅里叶": "Level 6: Fourier", "@第 7 关:创造": "Level 7: Create", "@AI导师": "AI tutor",
  "@声音与进度": "Sound & progress", "@任务进度": "Quest progress", "终点": "Finish", "你点亮了这些星": "You lit these stars",

  /* ===== cat 让 AI 认出一只猫 ===== */
  "从一个像素开始，教会机器认出一只猫。": "Start from a single pixel and teach a machine to spot a cat.",
  "难度 ★★★ 挑战 · 适合初一–初二起(约13岁+) · 梯度下降、神经网络以体验和直觉为主": "Difficulty ★★★ Challenge · grade 7–8+ (about age 13+) · gradient descent and neural networks are explored by feel and intuition",
  "像素就是数字": "Pixels are numbers", "图片在机器眼里是一串数": "To a machine, a picture is a list of numbers", "给猫画像": "Profile a cat", "特征：挑出有用的几个数": "Features: pick the few numbers that matter",
  "一条线分开猫狗": "One line to split cats and dogs", "分类与决策边界": "Classification & decision boundaries", "蒙眼下山": "Blindfolded downhill", "让线自己学会": "Let the line learn",
  "训练一个线性模型": "Train a linear model", "扭一扭空间": "Twist the space", "非线性变换": "Nonlinear transformations", "造一个神经元大脑": "Build a brain of neurons", "BOSS 关 · 神经网络": "BOSS level · neural networks",
  "扩散模型在星图上等你。": "Diffusion Model is waiting for you on the map.",
  "点开第 1 关「像素就是数字」，我们先搞清楚：机器眼里的一张图，到底长什么样？": "Open level 1 “Pixels are numbers”. First, let's figure out: what does a picture look like to a machine?",
  "扩散模型只问问题，不直接给答案。": "Diffusion Model only asks questions; it never just gives the answer.",
  "初见像素": "First Pixels", "· 看懂第一张数字图": "· Read your first picture of numbers", "不怕失败": "Not Afraid to Fail", "· 失败 3 次后成功": "· Succeed after failing 3 times",
  "坐标达人": "Coordinate Pro", "· 第 2 关零失误放好 8 张卡": "· Place all 8 cards in level 2 with no mistakes", "完美分界": "Perfect Split", "· 第 3 关任一轮 100% 分对": "· Get 100% right in any round of level 3",
  "一步到谷底": "Straight to the Valley", "· 第 4 关第 1 轮 ≤ 3 步到谷底": "· Reach the valley in ≤ 3 steps in round 1 of level 4", "训练师": "Trainer", "· 第 5 关完成全部 3 个任务": "· Finish all 3 tasks in level 5",
  "空间魔术师": "Space Magician", "· 第 6 关加一个特征，把猫狗 100% 分开": "· Add one feature in level 6 to split cats and dogs 100%", "造脑者": "Brain Builder", "· 第 7 关 AI 认出你画的图": "· The AI recognizes your drawing in level 7",
  "先看一眼：这张猫脸由 8×8 = 64 个小方块拼成。你觉得，机器要怎么把「黑」和「白」记下来？": "Take a look: this cat face is made of 8×8 = 64 little squares. How do you think a machine records “black” and “white”?",
  "提示：它只会记数字。": "Hint: it can only record numbers.",
  "64 个数太多了！我们只挑 2 个特征：耳朵有多尖 (x)、胡须有多长 (y)。把每张卡拖到坐标图上它的位置。": "64 numbers is too many! We'll pick just 2 features: how pointy the ears are (x) and how long the whiskers are (y). Drag each card to its spot on the graph.",
  "也可以先点一张卡，再点坐标图。": "You can also tap a card, then tap the graph.",
  "猫和狗在图上分成了两堆。摆一条直线，让猫都在猫区、狗都在狗区。": "Cats and dogs form two clusters on the graph. Place a straight line so every cat is on the cat side and every dog on the dog side.",
  "红圈闪烁的是被分错的。达标后点「提交」。": "Flashing red circles are misclassified. When you hit the target, press “Submit”.",
  "这回你不用拖线。按「学一步」，机器会看哪里分错了，自己把线挪一点。": "This time you don't drag the line. Press “Learn a step” and the machine checks its mistakes and nudges the line itself.",
  "红圈 = 分错的点；橙色一闪 = 这一步正在被纠正的点。": "Red circle = misclassified point; orange flash = the point being corrected this step.",
  "看：猫挤在中间，狗围成一圈。试试用一条直线分开它们？": "Look: the cats huddle in the middle and the dogs form a ring. Can you split them with one straight line?",
  "拖动两个黑色圆点摆线；选中画布后也能用方向键转动、平移。": "Drag the two black dots to place the line; with the canvas selected, arrow keys rotate and move it.",
  "BOSS 关！这是一个小小的神经网络：2 个输入 → 3 个隐藏神经元 → 1 个输出。": "BOSS level! Here's a tiny neural network: 2 inputs → 3 hidden neurons → 1 output.",
  "每个隐藏神经元就是第 3 关的一条直线。背景颜色 = 网络此刻的判断：蓝 = 猫，绿 = 狗。": "Each hidden neuron is one of the lines from level 3. Background color = the network's current call: blue = cat, green = dog.",
  "你刚刚从像素一路走到了神经网络。": "You just went all the way from pixels to a neural network.", "扩散模型给你放烟花！": "Diffusion Model sets off fireworks for you!",
  "新的一轮！点开第 1 关「像素就是数字」，我们从一个像素重新开始。": "A new round! Open level 1 “Pixels are numbers” and we'll start again from one pixel.",

  /* ===== casino 赌场为什么总是赢 ===== */
  "🪙 筹码": "🪙 Chips", "星图任务 · 概率与期望": "Math Atlas quest · probability & expectation",
  "拉斯维加斯的灯从来不灭——赌场靠什么稳赚？跟着随机矩阵，用硬币、骰子和轮盘找出答案。": "The lights in Las Vegas never go out — how does the casino always profit? Find out with Random Matrix, using coins, dice and roulette.",
  "适合 初一~初三": "For grades 7–9", "前置 分数、小数、百分数": "Needs: fractions, decimals, percentages",
  "从一枚硬币开始，一路算到赌徒的末路。": "Start with one coin and calculate all the way to the gambler's ruin.",
  "每关得 1–3 颗星，拿到 1 颗星就解锁下一关。所有游戏只用 🪙 筹码，不涉及真钱。": "Earn 1–3 stars per level; 1 star unlocks the next. Every game uses 🪙 chips only — no real money.",
  "硬币公平吗": "Is the coin fair", "可能性与频率": "Likelihood & frequency", "两颗骰子的秘密": "The secret of two dice", "这个游戏值得玩吗": "Is this game worth playing",
  "期望值": "Expected value", "轮盘上的绿色 0": "The green 0 on the wheel", "庄家优势": "House edge", "BOSS 赌徒的末路": "BOSS: The gambler's ruin", "BOSS「赌徒的末路」": "BOSS: “The gambler's ruin”",
  "BOSS 关 · 赌徒破产": "BOSS level · gambler's ruin",
  "随机矩阵在星图上等你。": "Random Matrix is waiting for you on the map.",
  "嘿，我以前在赌场上班，知道他们的小秘密。先点开第 1 关「硬币公平吗」：抛一枚硬币，正面和反面真的一样容易吗？": "Hey, I used to work at a casino, and I know their little secrets. Open level 1 “Is the coin fair”: when you flip a coin, are heads and tails really equally likely?",
  "随机矩阵只问问题，不直接给答案。": "Random Matrix only asks questions; it never just gives the answer.",
  "硬币侦探": "Coin Detective", "骰子数学家": "Dice Mathematician", "期望计算师": "Expectation Calculator", "看穿轮盘": "Roulette Seer", "破产定理大师": "Ruin Theorem Master",
  "终点星图": "Finish-line map", "走完五关，这七颗星会全部点亮。": "Finish all five levels and all seven stars light up.", "现在亮着的，是你已经亲手用过的数学。": "The ones lit now are math you've already used yourself.",
  "📊 开始之前，先读一句": "📊 Before you start, one thing",
  "这是一个用概率回答「赌场为什么总赢」的数学任务。这里只有虚拟筹码，不涉及任何真钱。": "This is a math quest that uses probability to answer “why does the casino always win”. There are only virtual chips here — no real money.",
  "数学的结论很清楚：赌博的期望是负数，玩得越久，输得越确定。赌博有害，未成年人禁止参与任何形式的赌博。": "The math is clear: gambling has a negative expected value — the longer you play, the surer you lose. Gambling is harmful, and minors must not take part in any form of it.",
  "我明白了，开始学概率": "Got it — let's learn probability",
  "我在赌场时，老板最爱说一句话：「硬币是公平的。」可是，什么叫公平？我们先猜，再亲手试。": "When I worked at the casino, the boss loved to say: “The coin is fair.” But what does fair mean? Let's guess, then try it ourselves.",
  "第 1 关有 4 步：先猜 → 亲手抛 → 快进 → 抓作弊硬币。": "Level 1 has 4 steps: guess → flip it yourself → fast-forward → catch the trick coin.",
  "赌场里最热闹的是骰子桌。两颗骰子一起掷，和从 2 到 12。每个和的机会一样吗？先押一把！": "The liveliest spot in a casino is the dice table. Roll two dice and the total runs from 2 to 12. Is every total equally likely? Place a bet first!",
  "第 2 关有 3 步：押一个和 → 6×6 方格 → 验证。": "Level 2 has 3 steps: bet on a total → the 6×6 grid → check.",
  "庙会上有个转盘摊：🪙3 转一次，转中大奖拿 🪙6！听起来挺划算？我们先猜，再亲手转。": "A fair stall has a spinner: 🪙3 a spin, and the jackpot pays 🪙6! Sounds like a deal? Let's guess, then spin it ourselves.",
  "第 3 关有 4 步：摊主的转盘 → 平均每次赢多少 → 设计公平游戏 → 快问。": "Level 3 has 4 steps: the stall's spinner → average win per spin → design a fair game → quick quiz.",
  "这是赌场里最有名的游戏：欧式轮盘。押红或押黑，猜中就 1 赔 1。红黑各一半，听起来很公平？": "This is the most famous casino game: European roulette. Bet red or black and a win pays 1 to 1. Half red, half black — sounds fair?",
  "第 4 关有 3 步：亲手转 10 次 → 算庄家优势 → 大数定律。": "Level 4 has 3 steps: spin 10 times yourself → work out the house edge → the law of large numbers.",
  "最后一关！一位赌徒带着 🪙20 走进赌场，每局押 🪙1 在红上（赢的概率 18/37）。他发誓：翻倍到 🪙40 就走，输光就回家。": "Final level! A gambler walks in with 🪙20 and bets 🪙1 on red each round (win chance 18/37). He swears he'll leave once he doubles to 🪙40, or go home when he's broke.",
  "第 5 关有 3 步：一个赌徒 → 蒙特卡洛 → BOSS 选择。": "Level 5 has 3 steps: one gambler → Monte Carlo → the BOSS choice.",

  /* ===== epidemic 传染病为什么会爆发 ===== */
  "从一个病人开始，弄明白传染病为什么会爆发。": "Start with one patient and work out why epidemics break out.",
  "适合 初三~高一": "For grades 9–10", "前置 乘方、百分数": "Needs: powers, percentages",
  "一传二，二传四 🧫": "One infects two, two infect four 🧫", "一传二，二传四": "One infects two, two infect four", "乘方与等比数列": "Powers & geometric sequences",
  "翻倍时间 📈": "Doubling time 📈", "翻倍时间": "Doubling time", "指数增长与对数": "Exponential growth & logarithms", "人群里的网络 🕸️": "Networks in a crowd 🕸️", "人群里的网络": "Networks in a crowd",
  "图论与传播树": "Graph theory & spreading trees", "三个水桶 SIR 🪣": "Three buckets: SIR 🪣", "三个水桶 SIR": "Three buckets: SIR", "变化率与微分方程": "Rates of change & differential equations",
  "BOSS 压平曲线 🏥": "BOSS: Flatten the curve 🏥", "BOSS 压平曲线": "BOSS: Flatten the curve", "BOSS 关 · 数学建模": "BOSS level · mathematical modeling",
  "渗流在星图上等你。": "Percolation is waiting for you on the map.",
  "点开第 1 关「一传二，二传四」。一个病人，怎么就变成了成千上万？先猜，再算。": "Open level 1 “One infects two, two infect four”. How does one patient turn into thousands? Guess, then calculate.",
  "渗流只问问题，不直接给答案；连错两次才给提示。": "Percolation only asks questions and never just gives the answer; a hint appears after two wrong tries.",
  "指数侦探": "Exponent Detective", "对数尺手": "Log Ruler", "网络守卫": "Network Guard", "建模师": "Modeler", "曲线压平者": "Curve Flattener",
  "九颗星，等你点亮。": "Nine stars, waiting for you to light them.",
  "先别算，凭直觉猜：1 个病人，每人传给 R=2 个新的人，第 10 代有多少新病人？": "Don't calculate yet — go with your gut: 1 patient, and each person infects R = 2 new people. How many new patients in generation 10?",
  "渗流考考你：每天新增病例增长 10%，多少天病例翻一倍？": "Percolation quiz: if daily new cases grow 10%, how many days until cases double?",
  "这张图是一个 40 人的小镇：每个点是一个人，每条线是一次密切接触。连在一个人身上的线有几条，他的「度」就是几，也就是朋友数。": "This graph is a town of 40: each dot is a person, each line a close contact. The number of lines on a person is their “degree” — their number of friends.",
  "A · 点任意一个人，让他当零号病人。": "A · Tap anyone to make them patient zero.",
  "把 1000 人想成三桶水：S 易感、I 感染、R 康复。一开始 999 人在 S，1 人在 I。两根管子把水从 S 送到 I、从 I 送到 R：管子每天流多少，就是「变化率」。": "Picture 1,000 people as three buckets of water: S susceptible, I infected, R recovered. At first 999 are in S and 1 in I. Two pipes carry water from S to I and from I to R; how much flows each day is the “rate of change”.",
  "先点几次「逐日推进 ▶」，看第 1 天流过去多少。": "Press “Next day ▶” a few times and see how much flows on day 1.",

  /* ===== rocket 火箭怎样飞上月球 ===== */
  "从速度表开始，算出一条飞向月球的轨道。": "Start with a speedometer and work out a path to the Moon.",
  "适合 高一~高三": "For grades 10–12", "前置 一次函数、乘方": "Needs: linear functions, powers",
  "速度表读多少 ⏱️": "What does the speedometer read ⏱️", "速度表读多少": "What does the speedometer read", "平均速度与割线斜率": "Average speed & secant slope",
  "无限逼近 🔍": "Closer and closer 🔍", "无限逼近": "Closer and closer", "极限与导数": "Limits & derivatives", "从速度回到路程 📐": "From speed back to distance 📐", "从速度回到路程": "From speed back to distance",
  "火箭方程 ⛽": "The rocket equation ⛽", "火箭方程": "The rocket equation", "e 与对数": "e & logarithms", "BOSS 奔月 🌕": "BOSS: To the Moon 🌕", "BOSS 奔月": "BOSS: To the Moon",
  "BOSS 关 · 微分方程建模": "BOSS level · modeling with differential equations",
  "辛几何在星图上等你。": "Symplectic Geometry is waiting for you on the map.",
  "点开第 1 关「速度表读多少」。火箭越飞越快，某一刻的速度到底怎么量？先猜，再算。": "Open level 1 “What does the speedometer read”. The rocket keeps speeding up — how do you measure its speed at one instant? Guess, then calculate.",
  "辛几何只问问题，不直接给答案；连错两次才给提示。": "Symplectic Geometry only asks questions and never just gives the answer; a hint appears after two wrong tries.",
  "测速员": "Speed Checker", "极限猎手": "Limit Hunter", "面积魔术师": "Area Magician", "燃料工程师": "Fuel Engineer", "登月指挥官": "Moon Mission Commander",
  "十二颗星，等你点亮。": "Twelve stars, waiting for you to light them.",
  "火箭点火后越飞越快，高度 h = 5t²（米）。先凭直觉猜：第 10 秒那一刻，速度表读多少？": "After ignition the rocket keeps speeding up: height h = 5t² (meters). Go with your gut: at exactly 10 seconds, what does the speedometer read?",
  "猜错不扣分，猜完我们一起量。": "Wrong guesses cost nothing. Guess, then we'll measure together.",
  "第 10 秒那一刻的速度，就是时间窗缩到「无限小」时平均速度的去向。一起把 Δt 一次次除以 10。": "The speed at exactly 10 s is where the average speed heads as the time window shrinks to “infinitely small”. Let's divide Δt by 10 again and again.",
  "看小数点后面的数字怎么变。": "Watch how the digits after the decimal point change.",
  "反过来：只知道速度表一路读数，怎么知道飞了多高？速度从 0 均匀涨到 100 m/s，用了 10 秒，飞了多远？": "Now the other way: knowing only the speedometer readings, how do you know how high it flew? Speed rises evenly from 0 to 100 m/s over 10 seconds — how far did it go?",
  "火箭靠往后喷燃料往前飞。燃料多带一倍，火箭最后的速度也会多一倍吗？": "A rocket flies forward by throwing fuel backward. If it carries twice the fuel, will its final speed double too?",
  "最后一关：从 200 公里高的停泊轨道点火奔月。你能调两样东西：点火加速多少（Δv），和点火时月球领先你多少度（提前角）。": "Final level: fire your engine from a 200 km parking orbit and head for the Moon. You control two things: how much you speed up (Δv), and how far ahead of you the Moon is when you fire (lead angle).",
  "电脑每次往前算 1 分钟，用牛顿定律一步步积出整条轨道。": "The computer steps forward 1 minute at a time, building the whole orbit from Newton's laws.",

  /* ===== cube 魔方为什么能复原 ===== */
  "从一张正方形卡片开始，看懂魔方背后的群。": "Start with a square card and understand the group behind the Rubik's cube.",
  "适合 高中~大学": "For high school–college", "前置 旋转与对称、乘法": "Needs: rotation and symmetry, multiplication",
  "正方形的八种样子 🔷": "Eight looks of a square 🔷", "正方形的八种样子": "Eight looks of a square", "对称与变换": "Symmetry & transformations",
  "先穿袜子再穿鞋 🧦": "Socks first, then shoes 🧦", "先穿袜子再穿鞋": "Socks first, then shoes", "运算的顺序与逆": "Order of operations & inverses",
  "洗几次回原样 🃏": "How many shuffles to reset 🃏", "洗几次回原样": "How many shuffles to reset", "置换、循环与最小公倍数": "Permutations, cycles & LCM",
  "只动三块 🧩": "Move only three pieces 🧩", "只动三块": "Move only three pieces", "群与交换子": "Groups & commutators",
  "BOSS 口袋魔方 🧊": "BOSS: Pocket cube 🧊", "BOSS 口袋魔方": "BOSS: Pocket cube", "BOSS 关 · 群论实战": "BOSS level · group theory in action",
  "范畴论在星图上等你。": "Category Theory is waiting for you on the map.",
  "点开第 1 关「正方形的八种样子」。魔方能复原，秘密从一张卡片的对称开始。先猜，再动手。": "Open level 1 “Eight looks of a square”. Why a cube can be solved starts with the symmetry of a single card. Guess first, then try it.",
  "范畴论只问问题，不直接给答案；连错两次才给提示。": "Category Theory only asks questions and never just gives the answer; a hint appears after two wrong tries.",
  "对称侦探": "Symmetry Detective", "撤销大师": "Undo Master", "洗牌师": "Shuffler", "交换子术士": "Commutator Mage", "魔方复原者": "Cube Solver",
  "一张正方形卡片，只许旋转、翻面，摆回原来的框里。一共能摆出几种看起来不同的样子？": "A square card may only be rotated or flipped, then put back in its frame. How many different-looking ways can it sit?",
  "早上先穿袜子，再穿鞋。晚上要脱下来，顺序是什么？": "In the morning you put on socks, then shoes. At night, in what order do they come off?",
  "这个问题和魔方有关系。": "This question has to do with the cube.",
  "7 张牌，按同一种方式（洗法 A）一直洗下去。最少洗几次，牌会回到最初的顺序？": "7 cards, shuffled the same way (shuffle A) again and again. What's the fewest shuffles to get back to the starting order?",
  "九宫格只能整行、整列地推（推出去的那块从另一头回来）。能不能只让 3 块换位置，另外 6 块都不动？": "In a 3×3 grid you can only slide whole rows or columns (a tile pushed off comes back on the other side). Can you swap just 3 tiles and leave the other 6 in place?",
  "这是 2×2×2 口袋魔方，一共 3,674,160 种状态。我把它打乱了，打乱步骤写在上面。你能把它转回去吗？": "This is a 2×2×2 pocket cube with 3,674,160 possible states. I've scrambled it, and the scramble is written above. Can you turn it back?",
  "R = 右面顺时针，U = 上面，F = 前面；带 ′ 的是逆时针。顺时针指正对着那一面看。": "R = right face clockwise, U = up, F = front; a ′ means counterclockwise. Clockwise is as seen facing that side.",
  /* ---------- 补:任务页章节名、页脚说明 ---------- */
  "关卡": "Levels", "徽章": "Badges", "关卡地图": "Level map", "星空": "Stars", "🌳 超现实数": "🌳 Surreal Numbers",
  "声音全部由 Web Audio 实时合成，不读取任何外部文件。进度不会被保存。": "All sound is synthesized live with Web Audio; no external files are loaded. Progress is not saved.",
  "声音全部由 Web Audio 实时合成,不读取任何外部文件。": "All sound is synthesized live with Web Audio; no external files are loaded.",
  "本任务用于理解概率，提醒：赌博有害，长期必输。声音由 Web Audio 实时合成。": "This quest is for understanding probability. Reminder: gambling is harmful, and in the long run you always lose. Sound is synthesized live with Web Audio.",
  "本任务用简化数学模型理解传播规律，不提供医疗建议。": "This quest uses simplified math models to understand how diseases spread. It is not medical advice.",
  "本任务用简化模型（平面、只算地球与月球引力）理解规律，数据为近似值。": "This quest uses a simplified model (flat plane, only Earth's and the Moon's gravity) to show the ideas; figures are approximate.",
  "魔方状态数与「上帝之数」引自公开数学文献；本任务只用于理解群论入门思想。": "The cube's number of states and “God's number” come from published math literature; this quest is only an introduction to group theory ideas.",
  /* chord 每颗星的提示与按钮 */
  "440 Hz。弦长减半,振动快一倍:频率与弦长成反比。": "440 Hz. Halve the string and it vibrates twice as fast: frequency is inversely proportional to length.",
  "15 和 16 没有公因数。低音要走完 15 个周期、高音走完 16 个,两者才同时回到起点。": "15 and 16 share no common factor. The low note must complete 15 cycles and the high note 16 before both return to the start together.",
  "分 7 份时每步乘 2^(1/7) ≈ 1.104。离 3/2 最近的是 2^(4/7) ≈ 1.486,差 16 音分;大三度差 43 音分。12 份的五度只差 2 音分:12 是能把五度、四度都逼近得这么好的最小份数。": "With 7 steps, each step multiplies by 2^(1/7) ≈ 1.104. The closest to 3/2 is 2^(4/7) ≈ 1.486, 16 cents off; the major third is 43 cents off. With 12 steps the fifth is only 2 cents off: 12 is the smallest split that gets both the fifth and the fourth this close.",
  "后半个周期正好是前半个周期上下翻转。按 1/n 取奇次谐波,波形越来越接近方波;单簧管听起来“空”,就是缺了偶次谐波。": "The second half of each cycle is the first half flipped upside down. Take odd harmonics at 1/n and the wave gets closer and closer to a square wave; a clarinet sounds “hollow” because it lacks even harmonics.",
  "r = 2^(1/12) ≈ 1.0595 是无理数。为了能自由转调,人类接受了一点点不完美——你刚刚用到了指数和对数。": "r = 2^(1/12) ≈ 1.0595 is irrational. To change key freely, we accept a tiny bit of imperfection — you just used exponents and logarithms.",
  "任何声音都能拆成一组正弦波——这就是傅里叶分析,也是MP3、手机信号和AI语音的基础。音色不同,只是‘积木’配比不同。": "Any sound can be broken into sine waves — that's Fourier analysis, the basis of MP3s, phone signals and AI voices. Different timbres are just different mixes of the same building blocks.",
  "越简单的分数越和谐——毕达哥拉斯2500年前就发现了。": "The simpler the fraction, the more harmonious — Pythagoras noticed this 2,500 years ago.",
  "回看你的猜想:答案是 C。": "Look back at your conjecture: the answer is C.", "记住你的答案,我们用实验揭晓。": "Remember your answer — the experiment will tell.",
  "选两个键,它们会一起响。": "Pick two keys and they'll sound together.", "合成波每隔 2 个(低音)周期重复一次。": "The combined wave repeats every 2 (low-note) cycles.",
  "音高螺旋:转过的角度对应对数,离中心的距离对应频率。每走一个点乘一次 r,转满一圈正好 ×2。": "Pitch spiral: the angle turned matches the logarithm and the distance from the center matches the frequency. Each dot multiplies by r; one full turn is exactly ×2.",
  "本轮:每个圆的半径是一次谐波的振幅,转速是它的倍数。笔尖的高度,就是合成波。": "Epicycles: each circle's radius is one harmonic's amplitude and its speed is the harmonic number. The pen's height is the combined wave.",
  "在传统课程里,这些分散在小学到大学的十几年里。今天,一个问题把它们串在了一起。": "In a traditional curriculum these are spread over a dozen years, from primary school to college. Today one question tied them together.",
  "A/B 对比大三度(基音 220 Hz),听听差别:": "A/B a major third (root 220 Hz) and hear the difference:", "A · 纯律 220 + 275 Hz": "A · just 220 + 275 Hz", "B · 平均律 220 + 277.18 Hz": "B · equal-tempered 220 + 277.18 Hz",
  "1 音分 = 1/100 个半音。": "1 cent = 1/100 of a semitone.", "+14 音分": "+14 cents", "+2 音分": "+2 cents", "−2 音分": "−2 cents",
  "你给每个音程的评分:3 好听 · 2 一般 · 1 刺耳": "Your rating for each interval: 3 nice · 2 okay · 1 harsh", "给这个音程打分:": "Rate this interval:",
  "点格子写旋律,或者让数学帮你生成一段。": "Tap the grid to write a melody, or let math generate one for you.",
  "两个音越近越好听": "The closer two notes are, the better", "两个音越远越好听": "The farther apart two notes are, the better", "和音高之间的某种‘比例’有关": "It has to do with some “ratio” between the pitches",
  "▶ 听一下": "▶ Listen", "▶ 听这个比": "▶ Hear this ratio", "▶ 弹奏": "▶ Play", "▶ 播放": "▶ Play", "好听": "Nice", "一般": "Okay", "刺耳": "Harsh", "再听一次": "Hear it again",
  "你的听感记录": "Your listening log", "单音": "Single note", "双音": "Two notes", "发现": "Discovery", "揭晓": "Reveal", "好听地图": "Harmony map", "已复制": "Copied",
  "音程": "Interval", "纯律(完美分数)": "Just intonation (perfect fractions)", "十二平均律": "12-tone equal temperament", "平均律": "Equal temperament", "偏差": "Difference",
  "纯五度": "Perfect fifth", "纯四度": "Perfect fourth", "大三度": "Major third", "持续播放": "Keep playing", "清空": "Clear", "速度": "Tempo", "随机生成和谐旋律": "Generate a harmonious melody",
  "纯正弦": "Pure sine", "类长笛": "Flute-like", "类单簧管": "Clarinet-like", "方波近似": "Square-ish", "锯齿波近似": "Sawtooth-ish", "类小提琴": "Violin-like", "第6关音色": "Level 6 timbre",
  "指数与对数": "Exponents & logarithms", "最小公倍数与周期": "LCM & periods", "正弦函数": "Sine functions", "星图 Math Atlas 原型 v0.1": "Math Atlas prototype v0.1",
  "宙律": "Nomoverse", "元素工坊": "Element Forge", "生命源码": "Life Source", "奇点前夜": "Pre-Singularity", "觉弈": "Ludoterra", "天枢": "Starhelm",
  "星图 Math Atlas · 问题先行的数学星图": "Math Atlas · a question-first map of math",
    "": ""
  };
  function T(s) { var y = tr(s); return y == null ? s : y; }
  var NUMW = { "四": 4, "七": 7, "九": 9, "十二": 12 };
  var RX = [
    [/^星图任务 · (.+)$/, function (m, a) { return "Math Atlas quest · " + T(a); }],
    [/^星图任务 (.+)$/, function (m, a) { return "Math Atlas quest · " + T(a); }],
    [/^(\d+) 关$/, "$1 levels"], [/^(\d+) 颗星$/, "$1 stars"], [/^(\d+) \/ (\d+) 关$/, "$1 / $2 levels"],
    [/^星座 (\d+) \/ (\d+)$/, "Constellation $1 / $2"], [/^(\d+) 颗星 · 已点亮 (\d+)$/, "$1 stars · $2 lit"],
    [/^第 (\d+) 关 · (.+)$/, function (m, n, a) { return "Level " + n + " · " + T(a); }],
    [/^第 (\d+) 关:(.+)$/, function (m, n, a) { return "Level " + n + ": " + T(a); }],
    [/^· 完成第 (\d+) 关「(.+)」$/, function (m, n, a) { return "· Clear level " + n + " “" + T(a) + "”"; }],
    [/^第 (\d+) 关得 1 颗星解锁$/, "Earn 1 star in level $1 to unlock"],
    [/^(🔒|🏅) (.+)$/, function (m, a, b) { return a + " " + T(b); }],
    [/^🏅 获得徽章[:：](.+)$/, function (m, a) { return "🏅 Badge earned: " + T(a); }],
    [/^第 (\d+) 关完成 · (.+) · \+(\d+) XP$/, "Level $1 cleared · $2 · +$3 XP"],
    [/^提示 (\d+)\/(\d+)$/, "Hint $1/$2"],
    [/^当前:(高|中|低)(\(自动检测\))?$/, function (m, a, b) { return "Now: " + T(a) + (b ? " (auto-detected)" : ""); }],
    [/^规划路径:(.+?) → (.+?)( · 已点亮| · 先点亮 (\d+) 颗先修星| · 现在就能点亮)$/, function (m, c, n, s, k) {
      return "Path: " + T(c) + " → " + T(n) + (s === " · 已点亮" ? " · lit" : k ? " · light " + k + " prerequisite star" + (k === "1" ? "" : "s") + " first" : " · you can light it now"); }],
    [/^先修:(.+)$/, function (m, a) { return "Prerequisites: " + a.split("、").map(T).join(", "); }],
    [/^👁 看见它:(.+)$/, function (m, a) { return "👁 See it: " + T(a); }],
    [/^♪ 声音 (开|关)$/, function (m, a) { return "♪ Sound " + (a === "开" ? "on" : "off"); }],
    [/^(.+) · 即将开通$/, function (m, a) { return T(a) + " · opening soon"; }],
    [/^(\S+?) 向导$/, function (m, a) { return a + " guide"; }],
    [/^(四|七|九|十二)颗星，等你点亮。$/, function (m, a) { return ["", "", "", "", "Four", "", "", "Seven", "", "Nine", "", "", "Twelve"][NUMW[a]] + " stars, waiting for you to light them."; }],
    [/^(超现实数|球堆积|扩展图|格密码|朗兰兹|扩散模型|随机矩阵|渗流|辛几何|范畴论)[:：](.+)$/, function (m, a, b) { var y = tr(b); return y == null ? null : E[a] + ": " + y; }],
    [/^适合 (.+)$/, function (m, a) { return "For " + T(a); }],
    [/^已点亮 (\d+) \/ (\d+) 颗星。$/, "$1 / $2 stars lit."],
    [/^☆ (.+)$/, function (m, a) { return "☆ " + T(a); }], [/^⭐ (.+)$/, function (m, a) { return "⭐ " + T(a); }]
  ];
  /* 任务语言包:英文模式下由 i18n/<任务>.js 追加词条与句式(只在英文模式加载,中文用户不下载) */
  window.MA_I18N = { add: function (d, r) { for (var k in d) if (Object.prototype.hasOwnProperty.call(d, k)) E[k] = d[k]; if (r) RX = r.concat(RX); }, T: function (s) { return window.MA_T(s); } };
  function rx(t) { for (var i = 0; i < RX.length; i++) { if (RX[i][0].test(t)) { var r = t.replace(RX[i][0], RX[i][1]); if (r !== t && r.indexOf("null") < 0) return r; } } return null; }
  function seg(t) { /* 「A · B」逐段翻,任何一段缺译则整句回退 */
    if (t.indexOf(" · ") < 0) return null;
    var p = t.split(" · "), ok = true;
    p = p.map(function (x) { if (!CJK.test(x)) return x; var y = E[x]; if (y == null) y = rx(x); if (y == null) ok = false; return y; });
    return ok ? p.join(" · ") : null;
  }
  function tr(t) { if (!t || !CJK.test(t)) return null; var y = E[t]; if (y != null) return y; y = rx(t); if (y != null) return y; return seg(t); }
  window.MA_T = function (t) { if (L !== "en" || !t) return t; var y = tr(t); return y == null ? t : y; };

  /* ---------- 顶栏「中 / EN」+ 回门户带语言 ---------- */
  function chrome() {
    var css = document.createElement("style");
    css.textContent = ".ma-lang{display:inline-flex;align-items:center;gap:4px;height:34px;padding:0 12px;border-radius:999px;border:1px solid rgba(160,185,255,.35);background:rgba(10,14,36,.6);color:#eef1ff;font:600 12px/1 -apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei',sans-serif;letter-spacing:.04em;cursor:pointer;white-space:nowrap;-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px)}.ma-lang b{color:#ffd98a;font-weight:700}.ma-lang:hover{background:rgba(40,50,110,.7)}.ma-lang--float{position:fixed;z-index:60;top:calc(env(safe-area-inset-top,0px) + 10px);right:12px}.top .ma-lang{height:38px}";
    document.head.appendChild(css);
    function btn(cls) {
      var b = document.createElement("button"); b.type = "button"; b.className = "ma-lang" + (cls ? " " + cls : "");
      b.setAttribute("lang", ""); b.setAttribute("data-noi18n", ""); b.setAttribute("aria-label", "中文 / English");
      b.innerHTML = L === "en" ? "中 / <b>EN</b>" : "<b>中</b> / EN";
      b.onclick = function () { window.MA_setLang(L === "en" ? "zh" : "en"); };
      return b;
    }
    var placed = 0, hud = document.querySelector(".hud-top .ht-r");
    if (hud) { var b1 = btn("hud-btn"); hud.insertBefore(b1, hud.firstChild); placed = 1; }
    var top = document.querySelector("header.top");
    if (top) { var b2 = btn(); var gb = document.getElementById("glBack"); top.insertBefore(b2, gb || null); placed = 1; }
    var bar = document.querySelector(".x-bar");
    if (bar) { bar.insertBefore(btn(), bar.firstChild.nextSibling); placed = 1; }
    if (!placed) document.body.appendChild(btn("ma-lang--float"));
    /* 「← 创世计划」回门户时带上当前语言 */
    [].forEach.call(document.querySelectorAll('a[href="/"], a[href="../../"], a[href="../../index.html"]'), function (a) { a.setAttribute("href", "/?lang=" + L); });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", chrome); else chrome();
  if (L !== "en") return;

  /* ---------- 英文模式:逐节点替换 ---------- */
  document.documentElement.lang = "en";
  (function () { /* 任务页同步加载本任务语言包(解析 head 时 document.write,避免先闪中文) */
    var m = /\/math-atlas\/([a-z]+)\/(index\.html)?$/.exec(location.pathname), PK = { nim: 1, bee: 1, nav: 1, secret: 1, chord: 1, cat: 1, casino: 1, epidemic: 1, rocket: 1, cube: 1 };
    if (m && PK[m[1]] && document.readyState === "loading") document.write('<script src="../i18n/' + m[1] + '.js"><\/script>');
  })();
  var SKIP = /^(SCRIPT|STYLE|CODE|KBD|PRE|TEXTAREA|svg|SVG|CANVAS|MATH)$/;
  function skip(el) { for (var p = el; p && p.nodeType === 1; p = p.parentNode) { if (SKIP.test(p.nodeName) || p.hasAttribute("data-noi18n") || p.namespaceURI === "http://www.w3.org/2000/svg") return true; } return false; }
  function node(n) {
    var v = n.nodeValue, t = v && v.trim(); if (!t || !CJK.test(t)) return;
    if (n.parentNode && skip(n.parentNode)) return;
    var y = tr(t); if (y == null) return;
    n.nodeValue = v.replace(t, y);
  }
  var AT = ["aria-label", "title", "placeholder", "alt"];
  function attrs(el) {
    if (!el.getAttribute || skip(el)) return;
    for (var i = 0; i < AT.length; i++) { var v = el.getAttribute(AT[i]); if (v && CJK.test(v)) { var y = E["@" + v]; if (y == null) y = tr(v); if (y != null) el.setAttribute(AT[i], y); } }
  }
  function walk(root) {
    if (root.nodeType === 3) return node(root);
    if (root.nodeType !== 1 || skip(root)) return;
    attrs(root);
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, { acceptNode: function (n) { return n.nodeType === 1 && (SKIP.test(n.nodeName) || n.namespaceURI === "http://www.w3.org/2000/svg" || n.hasAttribute("data-noi18n")) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT; } }), n;
    while ((n = w.nextNode())) { if (n.nodeType === 3) node(n); else attrs(n); }
  }
  function title() { var t = document.title, y = tr(t); if (y != null) document.title = y; }
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
