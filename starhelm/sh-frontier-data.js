/* 天枢 Starhelm · 前沿速递数据(v1.0-M4r/M4s,2026-11-07;王磊 11-07 11:00「后面的天枢模块也都按这个方式链接前沿更新的内容」)
 * 加一条只改这里。字段:
 *   id      唯一 id
 *   t       事件时刻(ms,UTC;界面一律显示北京时间)  · until 列表里保留到何时(可省)
 *   title   标题 · line 一句话
 *   target  天枢号航行(2.0)里的天体 id(SHXC 的 B 列表,如 voyager1、moon);飞抵观察 = 自动驾驶飞过去并打开该天体详情卡;无则省略
 *   lab     没有可飞天体时改为打开的实验室(SH[lab].open),如 geminidsLab
 *   url/src 一手机构页面(新标签、rel=noopener;只链机构原页,不用 logo、不嵌外部图片)
 *   special 天枢内的特别展/实验室深链 { label, href(相对 /starhelm/) }
 *   live    详情卡里的实时读数类型:'lightday'(读 SH.lightday,与 M4p 同一数据源)
 *   card    详情卡「前沿速递」段的数据行 [[名, 值], …]
 * 不收集任何数据。 */
window.SH_FRONTIER = [
  { id: 'voyager1-lightday', t: Date.UTC(2026, 10, 18, 10, 16, 7), title: '旅行者 1 号抵达一光日', line: '人类第一次有探测器飞到离地球一光日远:信号单程要走整整 24 小时。',
    target: 'voyager1', url: 'https://science.nasa.gov/mission/voyager/where-are-voyager-1-and-voyager-2-now/', src: 'NASA · Where Are They Now',
    special: { label: '看一光日特别展', href: '?task=voyager' }, live: 'lightday',
    card: [['一光日时刻', '2026 年 11 月 18 日 18:16:07(北京时间)'], ['距地球', '259.02 亿 km(≈ 173 AU)'], ['往返通信', '约 48 小时']] },
  { id: 'geminids-2026', t: Date.UTC(2026, 11, 14, 14, 0), title: '双子座流星雨极大', line: '全年最强流星雨之一,母体是小行星 3200 法厄同而不是彗星;今年月亮早落,条件极佳。',
    target: 'earth', lab: 'geminidsLab', labLabel: '打开 3D 观察', url: 'https://www.nao.ac.jp/astro/sky/2026/12-topics02.html', src: '日本国立天文台 · ふたご座流星群が極大(2026年12月)',
    special: { label: '1.0 数据与闯关', href: '?task=geminids' },
    card: [['极大', '2026 年 12 月 14 日 22:00 前后(北京时间)'], ['ZHR', '约 150(IMO 2026)'], ['活跃期', '12 月 4 日至 20 日'], ['母体', '小行星 3200 法厄同'], ['速度', '约 35 km/s(狮子座 71)']] },
  { id: 'supermoon-2026-12-24', t: Date.UTC(2026, 11, 24, 1, 28), title: '2026 年最近地球的满月', line: '12 月 24 日满月离地心约 35.7 万 km,比 5 月 31 日最远的满月看起来大约 14%。',
    target: 'moon', url: 'https://www.nao.ac.jp/astro/sky/2026/12-topics04.html', src: '日本国立天文台 · 2026年で地球から最も近い満月',
    card: [['满月', '2026 年 12 月 24 日 09:28(北京时间)'], ['地心距离', '约 35.7 万 km'], ['视直径', '约 33′29″(比 5-31 满月大约 14%)']] }
];
