// 生命源码 · 生命尺度图谱数据:六尺度层 × 八星座
export const LAYERS = ['分子', '细胞', '器官', '个体', '种群', '生态'];
export const CONS = {
  gen:  { name: '遗传',       color: '#34d399' },
  cell: { name: '细胞',       color: '#5eead4' },
  evo:  { name: '进化',       color: '#e2be78' },
  eco:  { name: '生态',       color: '#7dd3fc' },
  imm:  { name: '免疫与病毒', color: '#67e8f9' },
  dev:  { name: '发育',       color: '#f9a8d4' },
  met:  { name: '代谢',       color: '#fbbf24' },
  beh:  { name: '行为',       color: '#c4b5fd' },
};
// x:0–1 横向位置;layer:0 分子 … 5 生态;task:已上线任务;soon:后续任务
export const STARS = [
  { id: 'dna', name: '四个字母怎么写出一个人?', layer: 0, x: .16, con: 'gen', task: 'dna' },
  { id: 'parents', name: '为什么你长得像爸妈,又不完全像?', layer: 3, x: .2, con: 'gen', task: 'parents' },
  { id: 'zebra', name: '斑马的条纹从哪来?', layer: 3, x: .62, con: 'dev', soon: true },
  { id: 'virus', name: '病毒是活的吗?', layer: 1, x: .78, con: 'imm', soon: true },
  { id: 'wolf', name: '狼回来以后,森林变了吗?', layer: 5, x: .4, con: 'eco', soon: true },

  { name: 'DNA 双螺旋', layer: 0, x: .06, con: 'gen', note: '右手螺旋,直径约 2 纳米,每圈约 10.5 个碱基对。' },
  { name: '碱基配对', layer: 0, x: .27, con: 'gen', note: 'A 对 T(2 根氢键),G 对 C(3 根氢键)。' },
  { name: '染色体', layer: 1, x: .1, con: 'gen', note: '人的体细胞有 23 对染色体,细胞分裂时才凝缩成清晰的形状。' },
  { name: '减数分裂', layer: 1, x: .26, con: 'gen', note: '形成精子和卵子时,每对染色体只留一条。' },
  { name: '孟德尔定律', layer: 3, x: .08, con: 'gen', note: '遗传因子成对存在,形成配子时彼此分离。' },
  { name: 'ABO 血型', layer: 3, x: .32, con: 'gen', note: 'IA 与 IB 共显性,i 为隐性。' },

  { name: '核糖体', layer: 1, x: .4, con: 'cell', note: '蛋白质的"装配工厂",三个碱基读一次。' },
  { name: '细胞核', layer: 1, x: .5, con: 'cell', note: '约 6 微米,装着约 2 米长的 DNA。' },
  { name: '线粒体', layer: 1, x: .6, con: 'cell', note: '细胞的"能量站",有自己的一小段 DNA,只随母亲遗传。' },
  { name: '干细胞', layer: 2, x: .48, con: 'cell', note: '能分裂并分化成不同类型细胞的细胞。' },

  { name: '突变', layer: 0, x: .4, con: 'evo', note: '一个碱基的改变,可能毫无影响,也可能改变蛋白质。' },
  { name: '古 DNA', layer: 0, x: .52, con: 'evo', note: '从化石和古代遗骸中提取的 DNA,能读出几万年前的基因。' },
  { name: '化石', layer: 3, x: .48, con: 'evo', note: '保存在岩石中的古生物遗体或痕迹。' },
  { name: '自然选择', layer: 4, x: .3, con: 'evo', note: '更适应环境的个体留下更多后代。' },
  { name: '物种形成', layer: 4, x: .5, con: 'evo', note: '一个物种分化成两个不能互相繁殖的物种。' },

  { name: '食物网', layer: 5, x: .2, con: 'eco', note: '谁吃谁,织成一张网。' },
  { name: '碳循环', layer: 5, x: .62, con: 'eco', note: '碳在大气、生物和岩石之间流动。' },
  { name: '环境 DNA', layer: 5, x: .82, con: 'eco', note: '从一杯河水里,就能检测出附近生活过哪些动物。' },

  { name: '抗体', layer: 0, x: .74, con: 'imm', note: 'Y 形蛋白质,能精确识别特定的病原体。' },
  { name: '疫苗', layer: 3, x: .82, con: 'imm', note: '让免疫系统提前"认识"病原体。' },
  { name: '传染病传播', layer: 4, x: .8, con: 'imm', note: '一个人平均传给几个人,决定了疫情会不会扩大。' },
  { name: '噬菌体', layer: 1, x: .9, con: 'imm', note: '专门感染细菌的病毒,CRISPR 正是细菌对付它的"免疫记忆"。' },

  { name: '图灵斑图', layer: 1, x: .7, con: 'dev', note: '两种物质相互扩散、反应,能自发形成条纹和斑点。' },
  { name: '胚胎发育', layer: 3, x: .7, con: 'dev', note: '一个受精卵发育成数十万亿个细胞。' },
  { name: '再生', layer: 2, x: .66, con: 'dev', note: '蝾螈能重新长出断掉的腿。' },

  { name: '酶', layer: 0, x: .88, con: 'met', note: '生命的催化剂,让反应快上百万倍。' },
  { name: '光合作用', layer: 1, x: .98, con: 'met', note: '用阳光把二氧化碳和水变成糖和氧气。' },
  { name: '心脏', layer: 2, x: .86, con: 'met', note: '成年人的心脏每天跳动约 10 万次。' },
  { name: '消化', layer: 2, x: .96, con: 'met', note: '把食物拆成身体能吸收的小分子。' },

  { name: '生物钟', layer: 2, x: .2, con: 'beh', note: '身体里约 24 小时一循环的节律。' },
  { name: '大脑与学习', layer: 2, x: .32, con: 'beh', note: '约 860 亿个神经元相互连接。' },
  { name: '鸟类迁徙', layer: 4, x: .14, con: 'beh', note: '有的鸟一年往返上万公里。' },
  { name: '蜂群', layer: 4, x: .64, con: 'beh', note: '蜜蜂用"摇摆舞"告诉同伴花在哪里。' },
];
