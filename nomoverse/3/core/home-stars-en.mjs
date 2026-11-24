/* 宙律 Nomoverse · 首页英文补全(3-8 α8):60 颗知识星说明、3D 星图读屏与详情卡句式。
 * 2.0 i18n.js 只翻了星名与星座(长句留到「第二期」);首页 3.0 化要求中英全量,这里补齐并以 NV_I18N.add(词典, 句式) 追加。
 * 句式函数里的片段用 T() 递归翻译;任何片段缺译时返回 null,i18n.js 会整句回退中文(不留半截英文)。 */
import { hasCJK } from './home.mjs';

export const STAR_DESC_EN = {
  '水里的花粉微粒被看不见的水分子不停撞击,走出杂乱的折线。': 'Pollen grains in water are battered nonstop by invisible water molecules and trace a jagged, random path.',
  '没有外力时,物体保持静止或匀速直线运动;急刹车时人会往前倾。': 'With no outside force, an object stays at rest or keeps moving in a straight line at constant speed; that is why you lurch forward when a car brakes hard.',
  '不计空气阻力,抛出的物体走一条抛物线,篮球也一样。': 'Ignoring air resistance, anything thrown follows a parabola, and so does a basketball.',
  '水平方向匀速前进、竖直方向自由下落,两者互不干扰:扔得越快,落得越远。': 'Steady motion sideways and free fall downward do not interfere with each other: the faster you throw, the farther it lands.',
  '速度在变化就有加速度;踩刹车时加速度和运动方向相反。': 'Whenever velocity changes there is acceleration; when you brake, the acceleration points against the motion.',
  '速度大小不变、方向一直在变,需要一个始终指向圆心的力。': 'The speed stays the same but the direction keeps changing, which needs a force that always points to the centre.',
  '「动」还是「静」取决于从哪里看:高铁上的人看窗外,树在后退。': 'Whether something is “moving” or “still” depends on where you look from: from a high-speed train, the trees outside go backwards.',
  '地面附近 g ≈ 9.8 m/s²;g 越大,同样的出手,抛物线弯得越急。': 'Near the ground g ≈ 9.8 m/s²; the bigger g is, the more sharply the same throw curves down.',
  'F = ma:同样的力,质量越大,加速度越小。': 'F = ma: with the same force, the more mass, the less acceleration.',
  '速度越快阻力越大,让轨迹不再是完美的抛物线;风也会把球推偏。': 'The faster you go, the bigger the drag, so the path is no longer a perfect parabola; wind can push the ball off course too.',
  '你推墙,墙也以同样大小的力推你;火箭向后喷气,自己向前飞。': 'Push a wall and the wall pushes you back just as hard; a rocket throws gas backwards and flies forwards.',
  '接触面上微小的凹凸互相阻碍;没有摩擦,人连路都走不了。': 'Tiny bumps on touching surfaces catch on each other; without friction you could not even walk.',
  '高处的物体有势能,落下时变成动能:越高落下越快。': 'An object up high has potential energy that turns into kinetic energy as it falls: the higher it starts, the faster it lands.',
  '能量不会凭空产生或消失,只会从一种形式变成另一种。': 'Energy is never created from nothing or destroyed; it only changes from one form to another.',
  '想追上前面的航天器,反而要先减速降到更低、更快的轨道。': 'To catch a spacecraft ahead of you, you first slow down and drop to a lower, faster orbit.',
  '空间站里的人和舱一起绕地球「自由下落」,所以飘起来;引力并没有消失。': 'Astronauts and their station “free fall” around Earth together, so they float; gravity has not gone away.',
  '月球表面约 0.17 g、火星约 0.38 g、木星云顶约 2.5 g:同一规律,不同参数。': 'About 0.17 g on the Moon, 0.38 g on Mars, 2.5 g at Jupiter’s cloud tops: same law, different numbers.',
  '近地轨道约 7.9 km/s:快到「一直在下落,却总也落不到地面」。': 'Low Earth orbit is about 7.9 km/s: fast enough to “keep falling but never reach the ground”.',
  '从地面出发约 11.2 km/s(不计空气)才能彻底摆脱地球引力。': 'Leaving from the ground takes about 11.2 km/s (ignoring air) to break free of Earth’s gravity for good.',
  '任何两个有质量的物体都相互吸引,距离变为 2 倍,引力变为 1/4。': 'Any two objects with mass attract each other; double the distance and the pull drops to 1/4.',
  '月球对地球近侧和远侧的引力不一样大,拉出两个潮汐隆起。': 'The Moon pulls the near and far sides of Earth by different amounts, stretching out two tidal bulges.',
  '轨道越高,绕一圈的周期越长:周期的平方与轨道半长轴的立方成正比。': 'The higher the orbit, the longer one lap takes: the period squared is proportional to the semi-major axis cubed.',
  '太阳靠自身引力把自己压紧,核心的核聚变让它发光发热。': 'The Sun squeezes itself with its own gravity, and fusion in its core makes it shine and give off heat.',
  '直径约 10 万光年(约 10²¹ m),数千亿颗恒星绕着中心旋转。': 'About 100,000 light-years across (about 10²¹ m), with hundreds of billions of stars circling its centre.',
  '振动越快,频率越高,听到的音越高。': 'The faster the vibration, the higher the frequency and the higher the pitch you hear.',
  '声源靠近时波被挤密、音变高;远离时波被拉疏、音变低。': 'As a sound source approaches, the waves bunch up and the pitch rises; as it moves away, they spread out and the pitch drops.',
  '声源跑得比声速还快,波纹在前方叠成锥形,传来的就是音爆。': 'When a source outruns the speed of sound, the waves pile up into a cone, and what reaches you is a sonic boom.',
  '两个频率相近的音叠在一起,响度忽强忽弱,快慢等于两者频率之差。': 'Two notes with close frequencies combine into a sound that swells and fades, as fast as the difference between them.',
  '频率比 2:1 是八度、3:2 是五度,简单的整数比听起来更和谐。': 'A 2:1 frequency ratio is an octave and 3:2 is a fifth; simple whole-number ratios sound more harmonious.',
  '外力的节奏和物体自身的频率一致时,振动会越来越大。': 'When a push keeps time with an object’s own frequency, the vibration grows bigger and bigger.',
  '频率高于约 2 万赫兹、人耳听不到,蝙蝠和 B 超都用它「看」东西。': 'Above about 20,000 hertz, too high for human ears; bats and ultrasound scanners use it to “see”.',
  '地震的能量以波的形式穿过地球,横波和纵波跑得不一样快。': 'An earthquake’s energy travels through Earth as waves, and transverse and longitudinal waves move at different speeds.',
  '真空中约 30 万 km/s,1 秒钟能绕地球约 7.5 圈。': 'About 300,000 km/s in a vacuum: about 7.5 laps around Earth in one second.',
  '光走一年的距离,约 9.46 × 10¹⁵ m,用来量恒星之间的距离。': 'The distance light travels in a year, about 9.46 × 10¹⁵ m, used to measure the gaps between stars.',
  '光碰到镜面会反射,穿过水和玻璃会拐弯,所以筷子在水里像折断了。': 'Light bounces off a mirror and bends as it passes through water and glass, which is why chopsticks look broken in water.',
  '可见光波长约 400–700 纳米,从紫到红;恒星越热,发出的光越偏蓝。': 'Visible light runs from about 400 to 700 nanometres, violet to red; the hotter a star, the bluer its light.',
  '两束光叠加会出现明暗条纹,这是光具有波动性的证据。': 'Two overlapping beams of light make bright and dark fringes, evidence that light behaves as a wave.',
  '波长和原子差不多大的电磁波,能穿透人体软组织,用来拍片。': 'Electromagnetic waves about the size of atoms; they pass through soft tissue and are used for medical images.',
  '波长从毫米到千米的电磁波,手机、广播和雷达都靠它传信。': 'Electromagnetic waves from millimetres to kilometres long; phones, radio and radar all carry signals on them.',
  '温度越高,分子平均运动得越剧烈;温度是分子平均动能的量度。': 'The hotter it is, the more violently molecules move on average; temperature measures their average kinetic energy.',
  '大量气体分子不停撞击容器壁,形成压强;打气筒越打越费劲。': 'Countless gas molecules keep hitting the container walls, which creates pressure; a pump gets harder to push the more you pump.',
  '大爆炸留下的「余温」,约 2.7 K,辐射峰值波长约 1 毫米。': 'The “afterglow” of the Big Bang, about 2.7 K, with its radiation peaking near 1 millimetre.',
  '热量通过传导、对流、辐射从高温处流向低温处。': 'Heat flows from hot to cold by conduction, convection and radiation.',
  '大多数物体受热膨胀,所以铁轨之间要留一点缝。': 'Most things expand when heated, which is why rails are laid with small gaps.',
  '孤立系统的熵(混乱程度)只增不减:冰会化,热茶会凉。': 'The entropy (disorder) of an isolated system only goes up: ice melts and hot tea cools.',
  '把热变成功的机器;它的效率永远达不到 100%。': 'A machine that turns heat into work; its efficiency can never reach 100%.',
  '同种电荷相斥、异种电荷相吸,距离越近力越大。': 'Like charges repel and opposite charges attract, more strongly the closer they are.',
  '芯片里数十亿个微小开关,控制电流的通断来计算。': 'Billions of tiny switches on a chip compute by turning currents on and off.',
  '电荷定向移动形成电流;电路要闭合,灯泡才会亮。': 'Charges moving in one direction make a current; the circuit must be closed for the bulb to light.',
  '磁场变化会产生电流,发电机就是这样把转动变成电的。': 'A changing magnetic field produces a current; that is how a generator turns rotation into electricity.',
  '磁体周围有看不见的磁场,铁屑会沿着磁感线排列。': 'A magnet is surrounded by an invisible magnetic field, and iron filings line up along its field lines.',
  '云中积累的大量电荷击穿空气放电,瞬间温度可达数万摄氏度。': 'Charge built up in clouds breaks through the air in a discharge that can briefly reach tens of thousands of degrees Celsius.',
  '地球像一块大磁铁,把太阳风的带电粒子引向两极,点亮极光。': 'Earth acts like a giant magnet, steering charged particles from the solar wind to the poles, where they light up the aurora.',
  '质子和中子各由 3 个夸克组成,夸克从不单独出现。': 'Protons and neutrons are each made of 3 quarks, and quarks are never found alone.',
  '质子和中子靠强相互作用挤在一起,只占原子极小的一部分;4 个质子聚成 1 个氦核,会少掉约 0.7% 的质量。': 'Protons and neutrons are packed together by the strong interaction into a tiny part of the atom; when 4 protons fuse into 1 helium nucleus, about 0.7% of the mass goes missing.',
  '原子里的电子只能处在一级一级的能级上,跳跃时放出特定颜色的光。': 'Electrons in an atom can only sit on certain energy levels, and they give off light of specific colours when they jump between them.',
  '2015 年首次直接探测到:臂长 4 公里的探测器,量出了比质子还小的伸缩。': 'First detected directly in 2015: detectors with 4-kilometre arms measured a stretch smaller than a proton.',
  '引力强到连光都逃不出去;恒星级黑洞的视界半径约几十公里。': 'Gravity so strong that not even light escapes; a stellar black hole’s horizon is a few tens of kilometres across.',
  '质量让时空弯曲,弯曲的时空告诉物体如何运动;导航卫星要据此校正时钟。': 'Mass curves spacetime, and curved spacetime tells objects how to move; navigation satellites correct their clocks for it.',
  '速度接近光速时,时间会变慢、长度会收缩;光速对所有观察者都一样。': 'Near the speed of light, time slows and lengths shrink; the speed of light is the same for every observer.'
};

export const STAGE_EN = {
  '3D 宇宙尺度星图视窗:左右方向键沿尺度轴飞行,Tab 进入知识星列表': '3D cosmic-scale map view: left and right arrows fly along the scale axis, Tab enters the knowledge star list',
  '@3D 宇宙尺度星图视窗:左右方向键沿尺度轴飞行,Tab 进入知识星列表': '3D cosmic-scale map view: left and right arrows fly along the scale axis, Tab enters the knowledge star list',
  '画面中央是一条从 10⁻¹⁵ 米(质子)到 10²¹ 米(银河系)的对数尺度轴,8 个星座的知识星环绕排列。用底部滑杆或方向键改变尺度,Tab 到知识星按回车查看说明。':
    'The centre of the view is a logarithmic scale axis from 10⁻¹⁵ m (a proton) to 10²¹ m (the Milky Way), with the knowledge stars of 8 constellations arranged around it. Change the scale with the slider at the bottom or the arrow keys; Tab to a knowledge star and press Enter for its description.',
  '待探索。这颗星会在后续任务中开放。': 'Unexplored. This star opens in a later quest.',
  '简化表述,供科普探究': 'Simplified wording, for science exploration'
};

const ST = { '待探索': 'unexplored', '本期可点亮': 'can be lit now', '已点亮': 'lit' };
const C = '[,\uff0c]';
/* 句式:[正则, 生成函数(T 为递归翻译)] */
export function patterns(T) {
  const t = (s) => { const y = T(s); return y == null || hasCJK(y) ? null : y; };
  const all = (...xs) => (xs.some((x) => x == null) ? null : xs);
  return [
    [new RegExp('^(.+?)' + C + '(.+?)星座' + C + '约 10 的 (-?\\d+) 次方米' + C + '(待探索|本期可点亮|已点亮)$'), (m, a, b, n, s) => { const r = all(t(a), t(b)); return r ? `${r[0]}, ${r[1]} constellation, about 10 to the ${n} metres, ${ST[s]}` : null; }],
    [new RegExp('^(.+?)' + C + '(.+?)星座' + C + '(待探索|本期可点亮|已点亮)。(.+)$'), (m, a, b, s, d) => { const r = all(t(a), t(b), t(d)); return r ? `${r[0]}, ${r[1]} constellation, ${ST[s]}. ${r[2]}` : null; }],
    [/^(.+) 星座 · 约 10([⁻⁰¹²³⁴⁵⁶⁷⁸⁹]+) 米$/, (m, a, p) => { const x = t(a); return x ? `${x} constellation · about 10${p} m` : null; }],
    [/^(.+) 星座$/, (m, a) => { const x = t(a); return x ? `${x} constellation` : null; }],
    [/^(.+)星座$/, (m, a) => { const x = t(a); return x ? `${x} constellation` : null; }],
    [/^飞到 10 的 (-?\d+) 次方米$/, (m, n) => `Fly to 10 to the ${n} metres`],
    [new RegExp('^知识星列表:(\\d+) 颗' + C + '按星座分组;回车查看说明$'), (m, n) => `Knowledge star list: ${n} stars, grouped by constellation; press Enter for details`],
    [/^「(.+)」第 (\d+) 关 · (.+)$/, (m, q, n, l) => { const r = all(t(q), t(l)); return r ? `“${r[0]}” level ${n} · ${r[1]}` : null; }],
    [/^完成 (.+) 即可点亮。$/, (m, a) => { const x = t(a); return x ? `Complete ${x} to light it.` : null; }],
    [/^✓ 已点亮。来自 (.+)$/, (m, a) => { const x = t(a); return x ? `✓ Lit. From ${x}` : null; }],
    [/^待探索。完成 (.+) 即可点亮。$/, (m, a) => { const x = t(a); return x ? `Unexplored. Complete ${x} to light it.` : null; }],
    [/^★ (.+)$/, (m, a) => { const x = t(a); return x ? `★ ${x}` : null; }],
    [/^典型尺度:约 10([⁻⁰¹²³⁴⁵⁶⁷⁸⁹]+) 米 · 简化表述,供科普探究$/, (m, p) => `Typical scale: about 10${p} m · simplified wording, for science exploration`],
    [new RegExp('^约 10 的 (-?\\d+) 次方米(?:' + C + '(.+)的尺度)?$'), (m, n, l) => { if (!l) return `About 10 to the ${n} metres`; const x = t(l); return x ? `About 10 to the ${n} metres, the scale of ${x}` : null; }]
  ];
}
export const missingStarEn = () => Object.keys(STAR_DESC_EN).filter((k) => !STAR_DESC_EN[k] || hasCJK(STAR_DESC_EN[k]));
