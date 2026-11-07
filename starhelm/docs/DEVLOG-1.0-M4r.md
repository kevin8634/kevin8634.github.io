# 天枢 Starhelm v1.0-M4r · 天枢号航行「前沿速递」(2026-11-07)

依据:总指挥指令_2026-11-07_前沿速递(王磊 11-07 11:00,插队优先于双子座)。

## 做法(数据驱动)
- `sh-frontier-data.js`:`window.SH_FRONTIER` 数组,字段 id / t / title / line / target / lab / url / src / special / live / card。加一条只改数据。
- `x/sh-x-frontier.js`:
  - 入口:驾驶舱左上任务时间面板「前沿速递 ①」;手机底部按钮行「速递」;驾驶舱未开或无 WebGL 时页面左下「✦ 前沿速递」。
  - 列表:最新在前,日期(北京时间)+ 标题 + 一句话 + 实时倒计时。
  - 「飞抵观察」:锁定目标 → 时间压缩跃迁 3.5 秒(按对数距离收拢,机头对准目标)→ 抵达后居中打开该天体详情卡;减少动态效果时直接切到目标旁。驾驶舱未开时先登舰再飞。旅行者 1 号在 172 AU 外,按真实速度自动驾驶要飞多年,故用跃迁。
  - 「阅读资讯」:NASA Where Are They Now(新标签,rel=noopener);「看一光日特别展」→ /starhelm/?task=voyager。
- `x/sh-x-cockpit.js`:星空标签资料卡(详情卡)末尾挂 `SHXFR.cardHtml(id)`;新增 `SHXC.card(id)`、`SHXC.jumpTo(id)`。
- 旅行者 1 号详情卡「前沿速递」段:一光日 2026-11-18 18:16:07(北京时间)、距地球 259.02 亿 km(≈173 AU)、往返通信约 48 小时、倒计时/已越过天数(读 `SH.lightday.state`,与 M4p 同一数据源)。
- SW `sh-v1.0.0-m4r`,预缓存加 sh-frontier-data.js。

## 合规
外链只链 NASA 原页;不用 logo、不嵌外部图片;不收集数据。

## 自测(Playwright + swiftshader,外网拦截)
1600×900、390×844、844×390、减少动态(直接切换)、无 WebGL(列表与外链可用):0 page error,0 本站 404;飞抵后详情卡含前沿速递段。

## 以后接入
双子座流星雨、12-24 最近满月、迷你月亮 2026 QQ8 等:往 SH_FRONTIER 加一条,有可飞天体填 target,否则填 lab。
