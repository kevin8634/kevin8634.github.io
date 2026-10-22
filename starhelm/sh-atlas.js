/* 天枢 Starhelm · sh-atlas.js · 宇宙航图(v1.0-M1c)
 * 顶栏「航图」打开:七层光壳(对数尺度),一层一个星域。点一层看它的问题、守星人、尺度和光走多久;已开放的可直接前往。
 * 旧版「航行星图」(SH.openMap)保留为入口。API:window.SHATLAS.open() / close()
 */
(function () {
  'use strict';
  var BLURB = {
    1: '我在哪、昼夜四季、会动的大地、近地轨道', 2: '月相、潮汐、日月食、太阳活动、极光', 3: '八大行星、卫星、开普勒定律、探测器',
    4: '小行星、彗星、柯伊伯带、日球层、旅行者号', 5: '光年、恒星一生、系外行星、宜居带', 6: '旋臂、星团、双星、中心黑洞', 7: '星系、宇宙膨胀、大爆炸、暗物质'
  };
  var Q = { // 每个星域的「一问」
    1: '此刻,你在宇宙的哪里?', 2: '月亮为什么会变脸?', 3: '别的行星上,一天有多长?', 4: '太阳系的边界在哪里?',
    5: '星星为什么有不同的颜色?', 6: '我们在银河系的哪个位置?', 7: '宇宙有边吗?'
  };
  var U = {}, sel = 1, ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
  function h(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function P(n) { if (window.LE && LE.audio) LE.audio.play(n); }
  function H() { return window.SHHUD; }

  function build() {
    var r = U.root = h('section', 'sha'); r.setAttribute('role', 'dialog'); r.setAttribute('aria-label', '宇宙航图');
    r.innerHTML = '<header class="sha-hd"><div><small>天枢 Starhelm · 宇宙航图</small><b>七星域 · 从家园到宇宙</b></div>' +
      '<button class="sha-old" type="button">航行星图</button><button class="sha-x" type="button" aria-label="关闭">✕</button></header>' +
      '<div class="sha-body"><div class="sha-map"><svg class="sha-svg" viewBox="-110 -110 220 220"></svg><div class="sha-hint">每往外一圈,尺度大约放大 100 到 10 000 倍</div></div>' +
      '<aside class="sha-card"></aside></div>';
    document.body.appendChild(r);
    r.querySelector('.sha-x').onclick = close;
    r.querySelector('.sha-old').onclick = function () { close(); if (window.SH && SH.openMap) SH.openMap(); };
    r.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    U.svg = r.querySelector('.sha-svg'); U.card = r.querySelector('.sha-card');
  }
  function doms() { return (H() && H().DOMAINS) || []; }
  function prog(n) {
    var ts = H() && H().tasksOf ? H().tasksOf(n) : [], done = 0, live = 0;
    ts.forEach(function (t) { if (t.soon) return; live++; if (H().lit(t)) done++; });
    return { ts: ts, done: done, live: live };
  }
  function draw() {
    var s = '<defs><radialGradient id="shaG"><stop offset="0" stop-color="#7fd6ff" stop-opacity=".9"/><stop offset="1" stop-color="#7fd6ff" stop-opacity="0"/></radialGradient></defs>';
    doms().forEach(function (d) {
      var r = 12 + (d.n - 1) * 14.5, cls = 'sha-ring' + (d.open ? ' on' : '') + (d.n === sel ? ' sel' : '') + (H() && d.n === curDom() ? ' cur' : '');
      s += '<g class="' + cls + '" data-n="' + d.n + '" tabindex="0" role="button" aria-label="星域 ' + ROMAN[d.n] + ' ' + d.zh + '">' +
        '<circle r="' + r + '" class="sha-c"/><circle r="' + r + '" class="sha-hit"/>' +
        '<text y="' + (-r + 4.2) + '" class="sha-t">' + ROMAN[d.n] + ' ' + d.zh + '</text></g>';
    });
    s += '<circle r="4" fill="url(#shaG)"/><circle r="1.6" fill="#7fd6ff"/>';
    U.svg.innerHTML = s;
    [].forEach.call(U.svg.querySelectorAll('.sha-ring'), function (g) {
      g.addEventListener('click', function () { sel = +g.dataset.n; P('click'); draw(); card(); });
      g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); g.dispatchEvent(new Event('click')); } });
    });
  }
  function curDom() { return window.SHDOM && SHDOM.cur || 1; }
  function card() {
    var d = doms()[sel - 1]; if (!d) return;
    var km = Math.pow(10, d.scale) / 1000, F = H();
    var p = prog(sel), list = p.ts.map(function (t) {
      return '<li class="' + (t.soon ? 'soon' : F.lit(t) ? 'lit' : '') + '">' + (t.soon ? '◌' : F.lit(t) ? '★' : '☆') + ' ' + t.q + (t.soon ? ' <em>即将</em>' : '') + '</li>';
    }).join('');
    U.card.innerHTML = '<small>星域 ' + ROMAN[d.n] + ' · 守星人 ' + d.g + '</small><h3>' + d.zh + '</h3>' +
      '<p class="sha-q">「' + Q[d.n] + '」</p><p class="sha-b">' + BLURB[d.n] + '</p>' +
      '<div class="sha-sc"><span>尺度约 <b>' + F.fmtKm(km) + '</b></span><span>光走 <b>' + F.fmtLight(km) + '</b></span></div>' +
      (d.open ? (p.ts.length ? '<div class="sha-pg">已点亮 ' + p.done + ' / ' + p.live + '</div><ul class="sha-ls">' + list + '</ul>' : '') : '<p class="sha-lock">这一层还在建造中。先从已开放的星域出发吧。</p>') +
      (d.open ? '<button class="sha-go" type="button">前往星域 ' + ROMAN[d.n] + ' →</button>' : '');
    var go = U.card.querySelector('.sha-go');
    if (go) go.onclick = function () { close(); if (window.SHDOM) SHDOM.go(d.n); };
  }
  function open() {
    if (!H() || !H().DOMAINS) { if (window.SH && SH.openMap) SH.openMap(); return; }
    if (!U.root) build();
    sel = curDom(); U.root.hidden = false; document.body.classList.add('sha-on'); draw(); card(); P('open');
    setTimeout(function () { var x = U.root.querySelector('.sha-ring.sel'); if (x) x.focus({ preventScroll: true }); }, 50);
  }
  function close() { if (!U.root || U.root.hidden) return; U.root.hidden = true; document.body.classList.remove('sha-on'); P('close'); }
  window.SHATLAS = { open: open, close: close };
})();
