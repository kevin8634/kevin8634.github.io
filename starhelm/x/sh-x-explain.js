/* 天枢 Starhelm 2.0 · 穿梭 C1.6 —— 引擎可达范围 + 现象解读屏(SHXE)
 * 王磊 10-27 17:36:飞行结束后在合适处弹出显示屏解释视觉现象,并注明 已证实 / 推测 / 猜想。
 * - SHXE.rule(engId, domIdx) → { ok, note, why } 引擎能否飞往该星域(0=I 家园 … 6=VII 宇宙)
 * - SHXE.show(key) 右侧玻璃显示屏;key 为引擎 id 或现象 id(heliopause / lens / pulsar …,后续星域用)
 */
(function () {
  'use strict';
  var TAG = { '已证实': '#6fe3a0', '推测': '#f0c97a', '猜想': '#c49bff' };
  // 星域:I 家园, II 日与月, III 行星世界, IV 太阳系边疆, V 群星, VI 银河, VII 宇宙
  var LOCK = '🔒';
  var R = {
    chem:   [1, 1, 'slow', 'slow', '化学火箭到比邻星要约 7 万年', 'x', 'x'],
    ion:    [1, 1, 'slow', 'slow', '离子推进到比邻星要数万年', 'x', 'x'],
    assist: [1, 1, 1, 1, '引力弹射最多把探测器送到约 17 km/s,到比邻星约 7 万年', 'x', 'x'],
    sail:   [1, 1, 1, 1, '太阳帆离太阳越远推力越弱,出不了太阳系多远', 'x', 'x'],
    fusion: [1, 1, 1, 1, 'gen', '0.1 倍光速穿越银河要几十万年', 'x'],
    laser:  ['near', 'probe', 'probe', 'probe', 'probe', '激光光帆只能推几克重的探测器,且离地球激光阵列越远越推不动', 'x'],
    rel:    [1, 1, 1, 1, 1, 'dil', 'dil'],
    warp:   ['近', '近', 1, 1, 1, 1, 1],
    gate:   ['近', '近', '近', '近', 'node', 'node', 'node'],
    mind:   [1, 1, 1, 1, 1, 1, 1]
  };
  var NOTE = {
    slow: '可以飞,但真实耗时很长,演示会大幅压缩时间',
    gen: '代际飞船:到比邻星约 43 年,船员可能要换代',
    probe: '只能发射无人探测器,不能载人',
    dil: '舰上时间远短于地球时间(相对论时间膨胀)',
    node: '只能到达已设「虫洞门」的快捷目的地',
    near: '地月距离太近,用不上激光光帆'
  };
  function rule(id, d) {
    var r = R[id]; if (!r) return { ok: true };
    var v = r[d == null ? 2 : d];
    if (v === 1) return { ok: true };
    if (v === 'x') return { ok: false, why: '这么远超出了它的能力' };
    if (v === '近') return { ok: false, why: id === 'warp' ? '距离太近,曲率泡没有用武之地,常规引擎就够了' : '太阳系内没有虫洞门,虫洞要两端都有出入口' };
    if (v === 'near') return { ok: false, why: NOTE.near };
    if (NOTE[v]) return { ok: true, note: NOTE[v] };
    return { ok: false, why: v };
  }

  /* 现象解读:t=标题,k=分级,b=要点,s=依据 */
  var EX = {
    chem: { t: '化学火箭', k: '已证实', b: ['燃料燃烧把气体高速喷出,反作用力推船前进(牛顿第三定律)。', '阿波罗飞船就是这样把人送上月球的。'], s: '依据:几十年真实航天发射' },
    ion: { t: '离子电推进', k: '已证实', b: ['用电场把氙离子加速喷出,推力极小但能连续开几年。', '黎明号用它先后环绕灶神星和谷神星。'], s: '依据:NASA 黎明号、深空 1 号' },
    assist: { t: '引力弹射', k: '已证实', b: ['飞船从行星身边掠过,"借"行星绕太阳的速度加速,自己不用烧燃料。', '旅行者号靠它连续飞掠木星、土星。'], s: '依据:旅行者 1/2 号、卡西尼号' },
    sail: { t: '太阳帆', k: '已证实', b: ['光子撞到帆面会产生极微弱的压力,积少成多就能加速。', '离太阳越远光越弱,推力也越小。'], s: '依据:日本 IKAROS(2010)、行星学会光帆 2 号' },
    fusion: { t: '核聚变推进', k: '推测', b: ['用类似太阳的核聚变放出巨大能量喷射推进,理论上可到光速的 10%。', '原理成立,但可用于飞船的聚变发动机还没造出来。'], s: '依据:英国星际学会「代达罗斯计划」设计研究' },
    laser: { t: '激光光帆', k: '推测', b: ['地面巨型激光阵列照射几克重的光帆,把它推到光速的 20%。', '物理上可行,工程上还在研究,只能送微型探测器。'], s: '依据:突破摄星计划(Breakthrough Starshot)' },
    rel: { t: '星虹 · 近光速的视觉', k: '已证实', k2: '飞船 推测', b: ['相对论像差:速度越接近光速,星光越往正前方挤,两侧和后方变暗。', '多普勒效应:迎面的星光变蓝,侧后方变红,形成一圈「星虹」。', '时间膨胀:舰上钟走得比地球慢,速度越快差得越多。'], s: '现象已被粒子加速器和 GPS 卫星钟证实;载人近光速飞船仍是推测' },
    warp: { t: '曲率泡 · 空间折叠', k: '猜想', b: ['让飞船前方的空间收缩、后方的空间膨胀,飞船坐在一个「泡」里随空间移动。', '飞船本身没有超光速,是空间在动,所以不违反相对论。', '需要大量「负能量」,目前没有已知的办法获得。'], s: '依据:Alcubierre 1994 年的广义相对论解,未被观测' },
    gate: { t: '虫洞 · 时空隧道', k: '猜想', b: ['虫洞是连接宇宙两处的时空捷径;从外面看,它像一颗映出另一端星空的球。', '要让它保持张开,同样需要奇异物质(负能量)。', '所以只能在两端都建了「虫洞门」的地方使用。'], s: '依据:爱因斯坦–罗森桥、Kip Thorne 可穿越虫洞研究,未被观测' },
    mind: { t: '思想实验', k: '猜想', b: ['不受任何已知物理限制,只用来想象「如果可以会怎样」。'], s: '仅供想象' },
    heliopause: { t: '日球层顶', k: '已证实', b: ['太阳风的尽头:太阳风与星际气体压力相等的边界,外面就是星际空间。', '旅行者 1 号 2012 年 8 月 25 日在 121.6 AU 穿过,旅行者 2 号 2018 年 11 月在约 119 AU 穿过。', '怎么认出来:几天内太阳风粒子几乎消失、银河宇宙线跳升;2013 年一次太阳爆发激起等离子体振荡,由频率算出电子密度约 0.08 /cm³,比日鞘高约 40 倍,正是星际介质的数值。', '注意:飞出日球层不等于飞出太阳系,奥尔特云还在更远处,太阳引力仍主宰着这里。'], s: '依据:旅行者号宇宙线、磁场与等离子体波测量(Gurnett 等 2013)' },
    lens: { t: '引力透镜', k: '已证实', b: ['大质量天体会弯曲经过它的光,背景星被拉成弧,严格对齐时形成爱因斯坦环。', '黑洞吸积盘的远侧也会被弯到黑洞上下方。'], s: '依据:1919 年日食观测、事件视界望远镜 2019/2022 黑洞照片' },
    pulsar: { t: '脉冲星灯塔', k: '已证实', b: ['高速自转的中子星,磁极射出两束辐射,像灯塔一样扫过。', '蟹状星云中心的脉冲星每秒约转 30 圈。'], s: '依据:1967 年发现脉冲星以来的射电观测' },
    nebula: { t: '星云的颜色', k: '已证实', b: ['氢气被年轻恒星照亮后发红光,氧发绿蓝光,尘埃挡住背景变成暗带。'], s: '依据:光谱观测' },
    galaxy: { t: '银河全貌', k: '推测', b: ['我们在银河里面,没人从外面拍过它;旋臂形状来自恒星距离测量和射电巡天重建。'], s: '依据:盖亚卫星、射电巡天;外观为重建' },
    cmb: { t: '宇宙微波背景', k: '已证实', b: ['大爆炸约 38 万年后留下的余晖,今天温度约 2.7 K,遍布全天。'], s: '依据:COBE、WMAP、普朗克卫星' },
    dyson: { t: '戴森群', k: '猜想', b: ['设想高级文明用大量设备包围恒星收集能量。', '塔比星的怪异变暗曾引发猜测,主流解释是尘埃。'], s: '依据:Dyson 1960 年设想,无观测证据' }
  };

  var el, tm;
  function css() {
    if (document.getElementById('xe-css')) return;
    var s = document.createElement('style'); s.id = 'xe-css';
    s.textContent = '#xe-box{position:fixed;left:50%;top:176px;width:min(440px,calc(100vw - 24px));z-index:100050;padding:14px 16px 12px;border-radius:14px;border:1px solid rgba(120,200,255,.3);background:linear-gradient(180deg,rgba(30,90,160,.22),rgba(8,20,40,.55));backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);box-shadow:0 0 30px rgba(60,150,255,.18),inset 0 0 20px rgba(90,180,255,.08);color:#dfeaf7;font:13px/1.6 system-ui,"PingFang SC","Microsoft YaHei",sans-serif;opacity:0;transform:translate(-50%,-10px);transition:opacity .35s,transform .35s;pointer-events:none}' +
      '#xe-box.on{opacity:1;transform:translate(-50%,0);pointer-events:auto}#xe-box h5{margin:0 0 6px;font-size:15px;font-weight:600;color:#bfe6ff;letter-spacing:.06em;display:flex;align-items:center;gap:6px;flex-wrap:wrap}' +
      '#xe-box .tg{font-size:11px;font-weight:600;padding:1px 7px;border-radius:9px;border:1px solid currentColor;letter-spacing:.1em}' +
      '#xe-box .hd{font-size:10.5px;letter-spacing:.2em;color:#7fb6dd;opacity:.8;margin-bottom:4px}#xe-box ul{margin:0;padding-left:17px}#xe-box li{margin:2px 0}' +
      '#xe-box .s{margin-top:7px;font-size:11px;opacity:.6}#xe-box .x{position:absolute;right:8px;top:6px;background:none;border:0;color:#9ab;font-size:18px;cursor:pointer;line-height:1}' +
      '@media (max-width:640px){#xe-box{top:120px;font-size:12px}}';
    document.head.appendChild(s);
  }
  function tag(k) { return '<span class="tg" style="color:' + (TAG[k] || TAG['推测']) + '">' + k + '</span>'; }
  function show(key, hold) {
    var e = EX[key]; if (!e) return; css();
    if (!el) { el = document.createElement('div'); el.id = 'xe-box'; el.setAttribute('role', 'note'); document.body.appendChild(el); }
    var k2 = e.k2 ? e.k2.split(' ') : null;
    el.innerHTML = '<button class="x" type="button" aria-label="关闭">×</button><div class="hd">现象解读 · PHENOMENON</div><h5>' + e.t + ' ' + tag(e.k) + (k2 ? '<small style="font-size:11px;opacity:.7">' + k2[0] + '</small>' + tag(k2[1]) : '') + '</h5><ul>' +
      e.b.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul><div class="s">' + e.s + '</div>';
    el.querySelector('.x').onclick = hide;
    requestAnimationFrame(function () { el.classList.add('on'); });
    clearTimeout(tm); if (!hold) tm = setTimeout(hide, 22000);
  }
  function hide() { clearTimeout(tm); if (el) el.classList.remove('on'); }
  window.SHXE = { rule: rule, show: show, hide: hide, ex: EX, tagColor: TAG };
})();
