/* 觉弈 Ludoterra · 认知体系数据(四层八域 · 年龄段 · 先贤向导 · 任务)
 * 依据:觉弈开发方案 v0.2(王磊 2026-10-20 确认)。任务 id 一经上线不再更改。 */

export const AGES = [
  { id: 'sprout', name: '星芽', range: '7–11 岁', min: 7, icon: '🌱',
    line: '看得见、摸得着,才会相信', hint: '先玩入门关:存钱罐里的复利、分糖果的合作。' },
  { id: 'spark', name: '星火', range: '12–15 岁', min: 12, icon: '🔥',
    line: '开始抽象思考,最在意同伴', hint: '从「为什么好人不一定吃亏」开始,看清人性与合作。' },
  { id: 'star', name: '星辰', range: '16–22 岁', min: 16, icon: '✦',
    line: '开始独立:钱、关系、选择', hint: '从「每天多进步 1%」开始,看懂复利怎么改写人生。' },
  { id: 'galaxy', name: '星河', range: '23 岁以上', min: 23, icon: '🌌',
    line: '职场、家庭、长期决策', hint: '从复利与重复博弈开始,它们决定长期的输赢。' }
];
export const ageLabel = id => { const a = AGES.find(x => x.id === id); return a ? `${a.name} · ${a.range}` : ''; };
export const ageByMin = m => AGES.find(a => a.min === m) || AGES[1];

/* 四层:规则是谁写的 */
export const LAYERS = [
  { id: 'self', no: 'Ⅰ', name: '自我', author: '进化', era: '几百万年', q: '我的大脑怎样运作?', color: '#f5c26b',
    say: '你的大脑是为远古草原设计的。很多「明知道还会犯错」,是出厂设置和现代世界不匹配。' },
  { id: 'others', no: 'Ⅱ', name: '他人', author: '人性', era: '几万年', q: '人和人为什么这样相处?', color: '#f0a860',
    say: '我们是群居动物。信任、背叛、面子、合作,这些规则在部落时代就写好了。' },
  { id: 'world', no: 'Ⅲ', name: '世界', author: '文明', era: '几千年至今', q: '金钱、信息、风险怎么运转?', color: '#e9d39a',
    say: '金钱、利息、算法、新闻,是人类后来发明的系统。它们有规则,也有人利用规则。' },
  { id: 'meaning', no: '★', name: '意义', author: '你自己', era: '此刻', q: '看见之后,我要成为怎样的玩家?', color: '#fff3d6',
    say: '前三层的规则你改不了全部,但看见它们之后,怎么玩由你来写。' }
];

/* 八域 + 意义 */
export const DOMAINS = [
  { id: 'mind', layer: 'self', name: '心智与决策', short: '心智', icon: '◎', q: '为什么明知道还会犯错?',
    affects: ['判断', '消费', '选择', '被套路'], base: '认知心理学 · 行为经济学', guide: 'kahneman', age: 12, intro: 7 },
  { id: 'emotion', layer: 'self', name: '情绪与身体', short: '情绪', icon: '♡', q: '生气、熬夜时,为什么会做傻事?',
    affects: ['健康', '学习状态', '冲突'], base: '神经科学 · 斯多葛哲学', guide: 'aurelius', age: 7 },
  { id: 'habit', layer: 'self', name: '习惯与时间', short: '习惯', icon: '⧗', q: '注意力都去哪了?',
    affects: ['成长', '拖延', '时间分配'], base: '心理学(习惯与注意)', guide: 'james', age: 7 },
  { id: 'nature', layer: 'others', name: '人性', short: '人性', icon: '☯', q: '人性本善,还是本恶?',
    affects: ['信任', '善意', '被骗', '看人'], base: '进化心理学 · 儒家人性论', guide: 'mengxun', age: 12 },
  { id: 'coop', layer: 'others', name: '合作与博弈', short: '合作', icon: '⇄', q: '为什么好人不一定吃亏?',
    affects: ['团队', '交易', '公共资源'], base: '博弈论', guide: 'neumann', age: 12, intro: 7 },
  { id: 'relation', layer: 'others', name: '关系与表达', short: '关系', icon: '❝', q: '为什么烦恼多半来自人际关系?',
    affects: ['社交', '家庭', '恋爱(16+)', '职场(23+)'], base: '个体心理学 · 社会心理学', guide: 'adler', age: 12 },
  { id: 'wealth', layer: 'world', name: '财富与风险', short: '财富', icon: '◉', q: '钱从哪里来,又会悄悄去哪?',
    affects: ['财富', '借贷(16+)', '消费陷阱', '赌与运气'], base: '经济学 · 概率 · 复利数学', guide: 'franklin', age: 7 },
  { id: 'info', layer: 'world', name: '信息与真相', short: '信息', icon: '◈', q: '怎样判断一个信息靠不靠谱?',
    affects: ['谣言', '算法推荐', '信息茧房'], base: '科学方法 · 统计思维', guide: 'sagan', age: 12 }
];
export const MEANING = { id: 'meaning', layer: 'meaning', name: '意义', q: '看见了这些规则,我想成为怎样的玩家?',
  affects: ['人生选择', '价值', '知行合一'], base: '哲学', guide: 'wang', age: 16 };

/* 先贤向导团(只作致敬命名;台词是「仿其思想的提问」,不是原话) */
export const GUIDES = {
  socrates: { name: '苏格拉底', era: '古希腊', role: '首席向导', mark: '苏', why: '「认识你自己」。他只提问、不给答案,和觉弈的向导规则一样。' },
  kahneman: { name: '卡尼曼', era: '20–21 世纪', role: '心智与决策', mark: '卡', why: '研究「快思考」与「慢思考」,发现人如何被锚定、怕损失。' },
  aurelius: { name: '马可·奥勒留', era: '古罗马', role: '情绪与身体', mark: '奥', why: '斯多葛哲学:分清能控制的事和不能控制的事。' },
  james: { name: '威廉·詹姆斯', era: '19 世纪', role: '习惯与时间', mark: '詹', why: '心理学奠基人之一,系统讨论过习惯与注意力。' },
  mengxun: { name: '孟子与荀子', era: '战国', role: '人性', mark: '孟荀', why: '一个说性善,一个说性恶。他们在关卡里辩论,由你来判断。' },
  neumann: { name: '冯·诺依曼', era: '20 世纪', role: '合作与博弈', mark: '冯', why: '博弈论奠基人,把「怎么出招」变成可以计算的问题。' },
  adler: { name: '阿德勒', era: '20 世纪', role: '关系与表达', mark: '阿', why: '个体心理学:很多烦恼,都和人与人的关系有关。' },
  franklin: { name: '富兰克林', era: '18 世纪', role: '财富与风险', mark: '富', why: '曾留下 1000 英镑,按复利滚存 200 年捐给波士顿和费城。' },
  sagan: { name: '卡尔·萨根', era: '20 世纪', role: '信息与真相', mark: '萨', why: '提出「谬论检测工具包」,教人分辨说法靠不靠谱。' },
  wang: { name: '王阳明', era: '明代', role: '意义(终章)', mark: '王', why: '「知行合一」:看见了,还要做到,才算真的懂。' }
};
export const GUIDE_ORDER = ['socrates', 'kahneman', 'aurelius', 'james', 'mengxun', 'neumann', 'adler', 'franklin', 'sagan', 'wang'];

/* 隐藏数值(HUD):通关对应任务后显形 */
export const STATS = [
  { id: 'compound', name: '复利', by: 'compound' },
  { id: 'trust', name: '信任', by: 'prisoner' },
  { id: 'attention', name: '注意力', by: 'cocoon' },
  { id: 'fog', name: '迷雾值', by: 'sunk' },
  { id: 'time', name: '时间', by: 'compound' },
  { id: 'energy', name: '精力', by: 'sleep' },
  { id: 'calm', name: '平静', by: 'wave' },
  { id: 'understand', name: '理解', by: 'echo' }
];

/* 任务:id 一经上线不再更改 */
export const TASKS = [
  { id: 'compound', q: '每天多进步 1%,一年后会怎样?', domains: ['wealth', 'habit'], age: 7, guide: 'franklin', path: 'compound/', ver: 'v0.2', live: true },
  { id: 'prisoner', q: '为什么好人不一定吃亏?', domains: ['coop', 'nature'], age: 12, guide: 'neumann', path: 'prisoner/', ver: 'v0.3', live: true },
  { id: 'sunk', q: '电影看了一半很难看,要不要看完?', domains: ['mind'], age: 7, guide: 'kahneman', path: 'sunk/', ver: 'v0.5', live: true },
  { id: 'cocoon', q: '为什么你刷到的视频越来越像?', domains: ['info', 'habit'], age: 12, guide: 'sagan', path: 'cocoon/', ver: 'v0.6', live: true },
  { id: 'survivor', q: '为什么「成功经验」常常骗人?', domains: ['wealth', 'info'], age: 12, guide: 'sagan', path: 'survivor/', ver: 'v0.7', live: true },
  { id: 'nature', q: '人性本善,还是本恶?', domains: ['nature'], age: 12, guide: 'mengxun', path: 'nature/', ver: 'v0.8', live: true },
  { id: 'sleep', q: '今晚偷走的睡眠,明天谁来还?', domains: ['habit', 'emotion'], age: 7, guide: 'james', path: 'sleep/', ver: 'v0.27', live: true },
  { id: 'wave', q: '生气的时候,是谁在替你做决定?', domains: ['emotion'], age: 7, guide: 'aurelius', path: 'wave/', ver: 'v0.28', live: true },
  { id: 'echo', q: '你说的那句话,他听到的是什么?', domains: ['relation'], age: 7, guide: 'adler', path: 'echo/', ver: 'v0.29', live: true },
  { id: 'meaning', q: '看见了这些规则,我想成为怎样的玩家?', domains: ['meaning'], age: 16, guide: 'wang', path: 'meaning/', ver: 'v0.9', live: true, finale: true }
];

/* 星桥意向(已登记,未上线) */
export const BRIDGES = [
  { from: 'compound', href: '/math-atlas/epidemic/', to: '星图 · 传染病为什么会爆发?', id: 'lt.compound ⇄ ma.epidemic' },
  { from: 'survivor', href: '/math-atlas/casino/', to: '星图 · 赌场为什么总是赢?', id: 'lt.survivor ⇄ ma.casino' },
  { from: 'nature', href: '/life-source/parents/', to: '生命源码 · 为什么你长得像爸妈,又不完全像?', id: 'lt.nature ⇄ ls.parents' },
  { from: 'cocoon', to: '奇点前夜 · AI 会不会骗人', id: 'lt.cocoon ⇄ 奇点前夜' },
  { from: 'meaning', href: '/starhelm/', to: '天枢 · 此刻,你在宇宙的哪里?', id: 'lt.meaning ⇄ sh.where' }
];

/* 玩家手册:每关一页(通关后解锁) */
export const HANDBOOK = [
  { task: 'compound', no: 1, domain: '财富与风险 × 习惯与时间', title: '增长是乘出来的,不是加出来的',
    counter: '问自己「它是在加,还是在乘?」会乘的好事越早开始,会乘的坏事(利滚利的欠款)越早停下。' },
  { task: 'prisoner', no: 2, domain: '合作与博弈 × 人性', title: '只要还会再见面,善良往往不吃亏',
    counter: '被占便宜时先问「我们还会再见吗?」会,就清楚回应一次再留出原谅;不会,就别把信任押在一次性的承诺上。' },
  { task: 'sunk', no: 3, domain: '心智与决策', title: '花掉的已经花掉了',
    counter: '做决定前把镜头倒放到「还没付钱」的那一刻,问「如果现在免费给我,我还要吗?」已经付的两条路上都付了,只比较接下来的时间和钱能换到什么。' },
  { task: 'cocoon', no: 4, domain: '信息与真相 × 习惯与时间', title: '你喂给算法什么,它就把你变成什么',
    counter: '刷之前先问「我是来找什么的?」每隔一阵主动搜一个从没看过的话题,对不想要的点「不感兴趣」,给自己的推荐流加一点随机探索。' },
  { task: 'survivor', no: 5, domain: '财富与风险 × 信息与真相', title: '你只听得见幸存者说话',
    counter: '听到「成功的人都……」时追问:「失败的人里,有多少也这么做?」再问:「我看到的是全部人,还是被挑出来的人?」(只讲统计规律,不构成投资建议)' },
  { task: 'nature', no: 6, domain: '人性', title: '人性和规则,一起决定人怎么做',
    counter: '评价一个人之前,先问「换我在他的处境,会怎么做?」想让人变好,既养护善意(榜样、被善待),也设计规则——让做好事更容易,做坏事更难。' },
  { task: 'sleep', no: 7, domain: '习惯与时间 × 情绪与身体', title: '睡眠是一笔贷款,利息由明天的你来付',
    counter: '给自己定一个「关屏时间」,到点把手机放到够不着的地方,关掉自动播放;欠了觉就连着几晚早睡一会儿慢慢还,别指望一次睡到中午。' },
  { task: 'wave', no: 8, domain: '情绪与身体', title: '情绪是一股浪,不是一道命令',
    counter: '浪尖上不做决定:先给情绪起个名字(「我现在很生气」),慢慢呼吸几次,等它过了顶点再回应;再问一句,这件事里哪些我能控制?' },
  { task: 'echo', no: 9, domain: '关系与表达', title: '你知道的,对方不一定知道',
    counter: '说之前补上「为什么」和「我的心情」;重要的话当面或用语音说;听到刺耳的话先复述确认:「你的意思是……吗?」' },
  { task: 'meaning', no: 10, domain: '意义(终章)', title: '知行合一:看见了,还要做到',
    counter: '把你写下的规则变成一个能在路口问出口的问题。做完选择回看一眼:「我是按自己写的规则玩的吗?」没做到也没关系,下一次再试——规则由你写,也可以由你改。' }
];

/* v0.12 星之音:曲目列表(每首都对应一条规则)。task 为 null = 始终解锁;否则通关后解锁完整版,未通关可试听 15 秒。 */
export const TRACKS = [
  { no: '00', name: '光之莲', file: 'music/00_lotus.m4a', task: null, dur: '2:20', where: '首页 · 认知星盘',
    logic: '八域是同一个音的八个泛音。每隔一会儿,一个泛音从迷雾里走出来;八个都到齐,才听见这个音本来的样子。' },
  { no: '01', name: '一点点', file: 'music/01_compound.m4a', task: 'compound', dur: '2:25', where: '每天多进步 1%',
    logic: '同一句旋律重复 46 遍,代表一年,每遍只比上一遍强一点。前三分之二几乎听不出变化,最后突然饱满——复利就长这样。' },
  { no: '02', name: '以牙还牙', file: 'music/02_titfortat.m4a', task: 'prisoner', dur: '2:24', where: '好人不一定吃亏',
    logic: '左边钢琴是你,右边竖琴是对手,它总是重复你上一步。中途一次误会引来回敬;你先原谅,合作的弦乐才慢慢回来。' },
  { no: '03', name: '放不下的长音', file: 'music/03_sunk.m4a', task: 'sunk', dur: '2:00', where: '电影看了一半要不要看完',
    logic: '和声一直往前走,一条大提琴长音却停在原地不肯走,越拖越刺耳。第 72 秒它终于松手,音乐立刻流动起来。' },
  { no: '04', name: '回声室', file: 'music/04_cocoon.m4a', task: 'cocoon', dur: '2:00', where: '刷到的视频越来越像',
    logic: '一句旋律不断回声,每次只留下「和我像的」音,越来越窄、越来越暗,最后只剩一个音。直到一段完全不同的竖琴闯进来。' },
  { no: '05', name: '沉默的大多数', file: 'music/05_survivor.m4a', task: 'survivor', dur: '2:00', where: '「成功经验」常常骗人',
    logic: '十个声部一起出发,一个接一个悄悄消失,只剩一个听起来像「唯一正确的路」。尾声里那九个回来了——它们一直都在,只是没人听见。' },
  { no: '06', name: '两座小镇', file: 'music/06_nature.m4a', task: 'nature', dur: '2:00', where: '人性本善还是本恶',
    logic: '同一段旋律先住进「猜疑镇」,再住进「互助镇」。旋律一个音都没改,改的只是规则(和声)。' }
];
