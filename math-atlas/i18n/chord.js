/* 星图 Math Atlas · chord 英文语言包(v0.8.6) */
MA_I18N.add({
  /* ---------- 顶栏:声音 / 停止 ---------- */
  "声音已开启": "Sound on", "点击开启声音": "Tap to turn on sound", "全部停止": "Stop all", "音量": "Volume",
  "@声音与进度": "Sound & progress", "@任务进度": "Quest progress",

  /* ---------- 第 1 关:键盘 ---------- */
  "@模式": "Mode", "@键盘 C4–B5": "Keyboard C4–B5",
  "单音模式:每个键单独响。": "Single-note mode: each key plays on its own.",
  "选两个键,它们会一起响。": "Pick two keys and they'll sound together.",
  "已记录。再试一对?": "Logged. Try another pair?",

  /* ---------- 第 3 关:弦与分数 ---------- */
  "@可拖动琴码的弦": "String with a draggable bridge",
  "@你给七个音程的评分,按分数从简单到复杂排列": "Your ratings for seven intervals, ordered from simplest to most complex fraction",
  "@发现": "Discovery",
  "评分": "Rating", "未评分": "Not rated",

  /* 音程名(第 3 关读数、第 7 关旋律说明) */
  "同音": "Unison", "小二度": "Minor second", "大二度": "Major second", "小三度": "Minor third", "大三度": "Major third",
  "纯四度": "Perfect fourth", "三全音": "Tritone", "纯五度": "Perfect fifth", "小六度": "Minor sixth", "大六度": "Major sixth",
  "小七度": "Minor seventh", "大七度": "Major seventh", "八度": "Octave",
  "小三度 6:5": "Minor third 6:5", "大三度 5:4": "Major third 5:4", "纯四度 4:3": "Perfect fourth 4:3", "纯五度 3:2": "Perfect fifth 3:2", "八度 2:1": "Octave 2:1",

  /* ---------- 第 4 关:周期 ---------- */
  "@两个正弦波与合成波": "Two sine waves and their combined wave",
  "1:√2 是无理数比:合成波永不重复。": "1:√2 is an irrational ratio: the combined wave never repeats.",
  "低音": "Low note", "高音": "High note", "合成波": "Combined wave",

  /* ---------- 第 5 关 ---------- */
  "@音高螺旋:每转一圈 12 个点,频率翻倍": "Pitch spiral: 12 dots per turn, and the frequency doubles each turn",

  /* ---------- 第 6 关:傅里叶 ---------- */
  "@音色预设": "Timbre presets",
  "@各次谐波(细线)、合成波形(粗线)与频谱柱": "Each harmonic (thin lines), the combined waveform (thick line) and spectrum bars",
  "@本轮:半径等于各谐波振幅的圆一个套一个,笔尖画出波形": "Epicycles: circles nested inside each other, with radii equal to each harmonic's amplitude; the pen traces the waveform",

  /* ---------- 第 7 关:音序器 ---------- */
  "@音色": "Timbre", "@16 步音序器,C4–C5 C 大调": "16-step sequencer, C4–C5, C major",
  "■ 停止": "■ Stop",
  "点格子写旋律,或者让数学帮你生成一段。": "Tap the grid to write a melody, or let math generate one for you.",

  /* ---------- 终点 ---------- */
  "@七颗星组成的星座,按你的进度点亮": "A constellation of seven stars, lit up as you progress",
  "无理数": "Irrational numbers", "傅里叶级数": "Fourier series", "比与分数": "Ratios & fractions",
  "最小公倍数与周期": "LCM & periods", "正弦函数": "Sine functions", "指数与对数": "Exponents & logarithms",

  /* ---------- 知识笔记区按钮(笔记正文不翻) ---------- */
  "一键复制笔记": "Copy notes", "完整笔记与其他任务 →": "Full notes & other quests →", "已复制": "Copied"
}, [
  /* 第 1 关 */
  [/^已选 ([A-G]#?\d),再选一个。$/, "Picked $1. Now pick one more."],
  [/^([A-G]#?\d) \+ ([A-G]#?\d):它听起来怎么样\?$/, "$1 + $2: how does it sound?"],
  [/^([A-G]#?\d) \+ ([A-G]#?\d) · 相差 (\d+) 个半音 · (好听|一般|刺耳)$/, function (m, a, b, n, r) {
    return a + " + " + b + " · " + n + " semitone" + (n === "1" ? "" : "s") + " apart · " + MA_I18N.T(r); }],
  [/^相差 (\d+) 个半音$/, function (m, n) { return n + " semitone" + (n === "1" ? "" : "s") + " apart"; }],
  [/^(好奇|猜想|比与分数|周期|对数与平均律|傅里叶|创造) 已完成$/, function (m, a) { return MA_I18N.T(a) + " · done"; }],
  /* 第 3 关读数:弦长 1/2 → 440.0 Hz · 频率比 2:1 · 八度 · 你的评分:好听 */
  [/^弦长 (\d+\/\d+) → ([\d.]+) Hz · 频率比 (\d+:\d+) · (\S+)( · 你的评分:(好听|一般|刺耳))?$/, function (m, f, hz, r, n, s, sc) {
    return "String length " + f + " → " + hz + " Hz · frequency ratio " + r + " · " + MA_I18N.T(n) + (s ? " · your rating: " + MA_I18N.T(sc) : ""); }],
  [/^弦长 (\d+\/\d+) → ([\d.]+) Hz$/, "String length $1 → $2 Hz"],
  [/^频率比 (\d+:\d+)$/, "Frequency ratio $1"],
  [/^你的评分:(好听|一般|刺耳)$/, function (m, a) { return "Your rating: " + MA_I18N.T(a); }],
  [/^你当时选的是 ([ABC])(,猜对了!|。)$/, function (m, g, t) { return "You picked " + g + (t === "。" ? "." : " — you got it!"); }],
  /* 第 4 关 */
  [/^合成波每隔 (\d+) 个\(低音\)周期重复一次。$/, function (m, n) { return "The combined wave repeats every " + n + " (low-note) cycle" + (n === "1" ? "" : "s") + "."; }],
  /* 第 6 关滑块 */
  [/^第 (\d+) 次谐波 (\d+) Hz$/, "Harmonic $1, $2 Hz"],
  /* 第 7 关 */
  [/^([A-G]\d) 第 (\d+) 步$/, "$1, step $2"],
  [/^相邻音的关系\(每步取最高音\):(.+)$/, function (m, s) {
    var ok = true, out = s.split(" · ").map(function (x) {
      var k = /^([A-G]\d→[A-G]\d) (.+)$/.exec(x); if (!k) { ok = false; return x; }
      var y = MA_I18N.T(k[2]); if (y === k[2]) ok = false; return k[1] + " " + y;
    });
    return ok ? "Steps between neighboring notes (highest note per step): " + out.join(" · ") : null; }],
  [/^速度 (\d+) BPM$/, "Tempo $1 BPM"],
  /* 终点知识标签:★ 已点亮 / ☆ 未点亮 */
  [/^★ (.+)$/, function (m, a) { var y = MA_I18N.T(a); return y === a ? null : "★ " + y; }]
]);
