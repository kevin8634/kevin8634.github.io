/* 天枢 Starhelm · 前沿速递数据(v1.0-M4r,2026-11-07;王磊 11-07 11:00「后面的天枢模块也都按这个方式链接前沿更新的内容」)
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
    target: 'voyager1', url: 'https://science.nasa.gov/mission/voyager/where-are-they-now/', src: 'NASA · Where Are They Now',
    special: { label: '看一光日特别展', href: '?task=voyager' }, live: 'lightday',
    card: [['一光日时刻', '2026 年 11 月 18 日 18:16:07(北京时间)'], ['距地球', '259.02 亿 km(≈ 173 AU)'], ['往返通信', '约 48 小时']] }
];
