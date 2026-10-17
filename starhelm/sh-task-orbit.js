/* =====================================================================
 * 天枢 Starhelm · 任务 #3「空间站为什么掉不下来?」(M1)
 * 牛顿大炮:真实地球半径与引力(GM = 398600.4 km³/s²),假设没有空气。规则可改:发射速度、高度、引力倍数。
 * 声音即规律:飞行时速度映射音高;进入圆轨道时锁定成和声。星桥 → 宙律 Nomoverse「引力与轨道」
 * ===================================================================== */
(function (root) {
  'use strict';
  var SH = (root.SH = root.SH || {});
  var GM0 = 398600.4418, RE = 6371;

  /* ------------------------------ 物理(可在 Node 中测试) ------------------------------ */
  function Sim(h, v, gmul) {
    this.GM = GM0 * (gmul || 1); this.h = h; this.v0 = v;
    this.x = 0; this.y = RE + h; this.vx = v; this.vy = 0;
    this.t = 0; this.ang = 0; this.prevA = Math.atan2(this.x, this.y);
    this.rmin = this.y; this.rmax = this.y; this.result = null; this.path = [[this.x, this.y]];
    this.vc = Math.sqrt(this.GM / (RE + h)); this.vesc = this.vc * Math.SQRT2;
  }
  Sim.prototype.step = function (dt) {   // 速度 Verlet(辛积分,能量守恒好)
    if (this.result) return;
    var r = Math.hypot(this.x, this.y), a = -this.GM / (r * r * r);
    this.vx += 0.5 * dt * a * this.x; this.vy += 0.5 * dt * a * this.y;
    this.x += dt * this.vx; this.y += dt * this.vy;
    r = Math.hypot(this.x, this.y); a = -this.GM / (r * r * r);
    this.vx += 0.5 * dt * a * this.x; this.vy += 0.5 * dt * a * this.y;
    this.t += dt;
    var A = Math.atan2(this.x, this.y), d = A - this.prevA;
    if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI;
    this.ang += d; this.prevA = A; this.rmin = Math.min(this.rmin, r); this.rmax = Math.max(this.rmax, r);
    if (this.path.length < 4000 && (this.t % 20) < dt) this.path.push([this.x, this.y]);
    if (r <= RE) this.result = { kind: 'land', range: RE * Math.abs(this.ang), t: this.t };
    else if (Math.abs(this.ang) >= 2 * Math.PI) this.result = { kind: 'orbit', t: this.t, ecc: (this.rmax - this.rmin) / (this.rmax + this.rmin), rmin: this.rmin - RE, rmax: this.rmax - RE };
    else if (r > 2.5 * RE && (0.5 * (this.vx * this.vx + this.vy * this.vy) - this.GM / r) >= 0 && (this.x * this.vx + this.y * this.vy) > 0) this.result = { kind: 'escape', t: this.t };
    else if (r > 12 * RE) this.result = { kind: 'far', t: this.t };
    else if (this.t > 36 * 3600) this.result = { kind: 'far', t: this.t };
  };
  Sim.run = function (h, v, gmul) { var s = new Sim(h, v, gmul); while (!s.result) s.step(2); return s.result; };
  SH.OrbitSim = Sim;
  if (typeof document === 'undefined') return;   // Node 测试到此为止

  var LE = root.LE, U = LE.util;

  /* ------------------------------ 画布与控件 ------------------------------ */
  function Cannon(api, opt) {
    var self = this; this.opt = opt; this.h = opt.h; this.gmul = 1; this.shots = 0; this.sim = null;
    var wrap = SH.h('div', 'sh-cannon');
    var cv = this.cv = SH.h('canvas'); wrap.appendChild(cv);
    var row = SH.h('div', 'sh-cannon__ctl');
    row.innerHTML = '<label>发射速度 <b class="le-mono">0.00</b> km/s</label><input type="range" min="0" max="12" step="0.05" value="' + (opt.v0 || 3) + '" aria-label="发射速度(km/s)">';
    wrap.appendChild(row);
    this.out = row.querySelector('b'); this.range = row.querySelector('input');
    this.range.addEventListener('input', function () { self.sync(); });
    var btns = SH.h('div', 'sh-cannon__btns');
    this.fire = SH.btn('🔥 发射', function () { self.launch(); }, 'sh-go'); btns.appendChild(this.fire);
    if (opt.gravity) {
      var g = SH.h('div', 'sh-seg', '<span>引力</span>');
      [0.5, 1, 2].forEach(function (m) {
        var b = SH.h('button', '', '×' + m); b.type = 'button'; b.setAttribute('aria-pressed', m === 1 ? 'true' : 'false');
        b.addEventListener('click', function () { cancelAnimationFrame(self._raf); SH.sound.humStop(); self.gmul = m; g.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); }); self.sim = null; self.draw(); if (opt.onGravity) opt.onGravity(m); });
        g.appendChild(b);
      });
      btns.appendChild(g); this.gseg = g;
    }
    wrap.appendChild(btns);
    api.area.appendChild(wrap);
    this.sync(); this.resize();
    this._raf = 0; this._on = true;
    this._resize = function () { self.resize(); }; window.addEventListener('resize', this._resize);
  }
  Cannon.prototype.sync = function () { this.out.textContent = (+this.range.value).toFixed(2); if (!this.sim || this.sim.result) this.draw(); };
  Cannon.prototype.resize = function () {
    var w = Math.min(420, this.cv.parentNode.clientWidth || 320), hh = Math.round(w * 0.78), pr = Math.min(2, window.devicePixelRatio || 1);
    this.W = w; this.H = hh; this.cv.width = w * pr; this.cv.height = hh * pr; this.cv.style.width = w + 'px'; this.cv.style.height = hh + 'px';
    this.ctx = this.cv.getContext('2d'); this.ctx.setTransform(pr, 0, 0, pr, 0, 0); this.draw();
  };
  Cannon.prototype.setH = function (h) { this.h = h; this.sim = null; this.draw(); };
  Cannon.prototype.launch = function () {
    var v = +this.range.value; this.shots++;
    this.sim = new Sim(this.h, v, this.gmul); this.trail = [];
    SH.sound.humStart(140 + v * 42);
    var self = this, last = performance.now();
    cancelAnimationFrame(this._raf);
    (function loop(t) {
      if (!self._on || !self.sim) return;
      var dt = Math.min(0.1, (t - last) / 1000); last = t;
      var rr = Math.hypot(self.sim.x, self.sim.y) / RE, simDt = dt * 1100 * Math.max(1, Math.pow(rr, 1.5) / 2), n = Math.ceil(simDt / 4);
      for (var i = 0; i < n && !self.sim.result; i++) self.sim.step(simDt / n);
      var s = self.sim, sp = Math.hypot(s.vx, s.vy); SH.sound.humSet(140 + sp * 42);
      self.draw();
      if (s.result) { self.done(s); return; }
      self._raf = requestAnimationFrame(loop);
    })(last);
  };
  Cannon.prototype.done = function (s) {
    SH.sound.humStop();
    var r = s.result; r.v = s.v0; r.vc = s.vc; r.vesc = s.vesc; r.gmul = this.gmul; r.shots = this.shots;
    if (r.kind === 'orbit') SH.sound.chord(392); else if (r.kind === 'land') SH.sound.soft(); else SH.sound.glass(1318);
    if (this.opt.onResult) this.opt.onResult(r);
  };
  Cannon.prototype.draw = function () {
    var x = this.ctx; if (!x) return; var W = this.W, H = this.H;
    var view = this.opt.view || 2.3 * RE, k = Math.min(W, H) / 2 / view, cx = W / 2, cy = H / 2 + (this.opt.shiftY || 0) * k;
    x.fillStyle = '#050a1c'; x.fillRect(0, 0, W, H);
    for (var i = 0; i < 40; i++) { x.fillStyle = 'rgba(220,230,255,' + (0.15 + (i * 37 % 10) / 25) + ')'; x.fillRect((i * 97) % W, (i * 53) % H, 1, 1); }
    var g = x.createRadialGradient(cx - RE * k * 0.3, cy - RE * k * 0.3, RE * k * 0.1, cx, cy, RE * k);
    g.addColorStop(0, '#3d7bd6'); g.addColorStop(1, '#0f2f6a'); x.fillStyle = g; x.beginPath(); x.arc(cx, cy, RE * k, 0, 7); x.fill();
    x.strokeStyle = 'rgba(120,180,255,0.35)'; x.lineWidth = 2; x.stroke();
    // 发射高度示意(山或空间站高度),高度放大显示以便看见
    var hv = Math.max(this.h, 260) * k, top = cy - RE * k;
    x.fillStyle = '#6d5a48'; x.beginPath(); x.moveTo(cx - hv * 0.9, top + 4); x.lineTo(cx, top - hv); x.lineTo(cx + hv * 0.9, top + 4); x.fill();
    if (this.opt.ring) { x.setLineDash([4, 5]); x.strokeStyle = 'rgba(255,180,106,0.6)'; x.lineWidth = 1; x.beginPath(); x.arc(cx, cy, (RE + this.h) * k, 0, 7); x.stroke(); x.setLineDash([]);
      x.fillStyle = 'rgba(255,200,140,0.85)'; x.font = '11px sans-serif'; x.fillText(this.opt.ring, cx + (RE + this.h) * k * 0.72 + 4, cy - (RE + this.h) * k * 0.72); }
    // 炮
    x.fillStyle = '#d8dee9'; x.fillRect(cx - 2, top - hv - 6, 12, 5);
    var s = this.sim; if (!s) { x.fillStyle = 'rgba(220,230,255,0.7)'; x.font = '12px sans-serif'; x.textAlign = 'center'; x.fillText('调好速度,按「发射」', cx, H - 10); x.textAlign = 'left'; return; }
    var col = !s.result ? '#ffd27f' : s.result.kind === 'orbit' ? '#5dffb0' : s.result.kind === 'land' ? '#ff9d6b' : '#b6a6ff';
    x.strokeStyle = col; x.lineWidth = 2; x.beginPath();
    var P = s.path; for (var j = 0; j < P.length; j++) { var px = cx + P[j][0] * k, py = cy - P[j][1] * k; if (j) x.lineTo(px, py); else x.moveTo(px, py); }
    x.lineTo(cx + s.x * k, cy - s.y * k); x.stroke();
    x.fillStyle = '#fff'; x.shadowColor = col; x.shadowBlur = 10; x.beginPath(); x.arc(cx + s.x * k, cy - s.y * k, 3.5, 0, 7); x.fill(); x.shadowBlur = 0;
    var sp = Math.hypot(s.vx, s.vy), alt = Math.hypot(s.x, s.y) - RE;
    x.fillStyle = 'rgba(232,238,255,0.9)'; x.font = '11px ui-monospace,monospace';
    x.fillText('速度 ' + sp.toFixed(2) + ' km/s · 高度 ' + Math.max(0, alt).toFixed(0) + ' km · ' + (s.t / 60).toFixed(0) + ' 分钟', 8, 16);
  };
  Cannon.prototype.destroy = function () { this._on = false; cancelAnimationFrame(this._raf); SH.sound.humStop(); window.removeEventListener('resize', this._resize); };

  function kmFmt(n) { return U.fmtNum(Math.round(n)); }

  /* ------------------------------ 三关 ------------------------------ */
  SH.levels.orbit = [
    { title: '打得更远', guide: 'tianshu',
      ask: '牛顿想象:在一座 100 公里高的山顶架一门大炮(假设没有空气)。要让炮弹落到 1000 公里以外(差不多北京到上海),你觉得得打多快?',
      hints: ['打得越快,落得越远。先试试 3 km/s,再一点点加。', '地面是弯的:炮弹往前飞的时候,地面也在"往下躲"。', '试试 5 到 6 km/s 之间,再微调。'],
      mount: function (api) {
        var c = new Cannon(api, { h: 100, v0: 3, onResult: function (r) {
          if (r.kind === 'land') {
            if (r.range >= 1000) api.done(api.starsBy(r.shots <= 3 ? 3 : r.shots <= 6 ? 2 : 1), '落在 ' + kmFmt(r.range) + ' km 外!速度越快,地面"弯走"得越多,炮弹就飞得越远。');
            else api.feedback('落在 ' + kmFmt(r.range) + ' km 外,还差 ' + kmFmt(1000 - r.range) + ' km。');
          } else if (r.kind === 'orbit') api.done(api.starsBy(2), '它根本没落地,绕了地球一整圈!这其实是下一关的秘密。');
          else api.feedback('飞得太远了!这个速度太快,先试慢一点。', 'warn');
        } });
        api.onLeave(function () { c.destroy(); });
      } },
    { title: '永远在坠落', guide: 'tianshu',
      ask: '如果打得足够快,"落点"会不会一直往前跑,直到绕回大炮背后?试着让炮弹绕地球一整圈回来。',
      hints: ['上一关你发现:越快落得越远。如果快到落点绕回起点呢?', '炮弹每往前飞 8 公里,地面就弯下去约 5 米;下落的距离要正好赶上地面弯下去的距离。', '试试 7.5 到 8.5 km/s 之间。'],
      mount: function (api) {
        var c = new Cannon(api, { h: 100, v0: 6, onResult: function (r) {
          if (r.kind === 'orbit') {
            var round = Math.abs(r.v - r.vc) < 0.15;
            api.done(api.starsBy(round ? 3 : 2), (round ? '几乎是一个正圆!' : '绕回来了!') + '炮弹一直在往下掉,但它飞得够快,地面弯下去的速度正好跟上——这就是轨道。在这个高度,画正圆要 ' + r.vc.toFixed(2) + ' km/s,叫第一宇宙速度。');
          } else if (r.kind === 'land') api.feedback('落在 ' + kmFmt(r.range) + ' km 外。离绕一圈(约 40,000 km)还差一些。');
          else if (r.kind === 'escape') api.feedback('它挣脱了地球,一去不回!超过约 ' + r.vesc.toFixed(1) + ' km/s 就会这样。慢一点试试。', 'warn');
          else api.feedback('它飞到了几万公里外,要过好几个小时才会回来。慢一点,让它画个小一点的圈。', 'warn');
        } });
        api.onLeave(function () { c.destroy(); });
      } },
    { title: '对照此刻的空间站', guide: 'tianshu',
      ask: '这一次,大炮架在空间站的真实高度上。找到让炮弹"刚好画圆"的速度,再和此刻真实的空间站比一比。',
      hints: ['画圆的意思是:高度一直不变。看左上角的高度读数有没有变化。', '越高,画圆需要的速度越小一点点;比上一关稍慢。', '试试 7.6 到 7.7 km/s 之间。'],
      mount: function (api) {
        var I = LE.layers.iss, h = I && I.ok && I.alt > 300 ? Math.round(I.alt) : 420, stage = 'A';
        var c = new Cannon(api, { h: h, v0: 7, gravity: true, ring: '空间站高度 ' + h + ' km', view: 1.6 * RE, shiftY: 0.15 * RE,
          onGravity: function (m) { if (stage === 'B' && m !== 2) api.feedback('这一步要把引力调成 ×2 哦。'); },
          onResult: function (r) {
            var ok = r.kind === 'orbit' && Math.abs(r.v - r.vc) < 0.07;
            if (stage === 'A') {
              if (r.gmul !== 1) { api.feedback('先用真实的引力(×1)找答案。'); return; }
              if (ok) {
                var real = I && I.ok ? I.speed : null; stage = 'B';
                api.feedback('你的答案 ' + r.v.toFixed(2) + ' km/s;此刻真实的空间站:' + (real ? real.toFixed(2) + ' km/s(按实时轨道推算)' : '约 7.66 km/s') + '。几乎一样!空间站不是没有重力,它一直在"绕着地球坠落"。', 'ok');
                api.say('现在改一条规则:假如地球的引力变成两倍,空间站要飞多快才不会掉下来?把引力调成 ×2 再试。');
                SH.sound.chord(523.25);
              } else if (r.kind === 'orbit') api.feedback('绕回来了,但高度在变(最低 ' + kmFmt(r.rmin) + ' km,最高 ' + kmFmt(r.rmax) + ' km)。再微调,让它画一个圆。');
              else if (r.kind === 'land') api.feedback('掉下来了,速度不够。');
              else api.feedback('飞走了,太快了。', 'warn');
            } else {
              if (r.gmul !== 2) { api.feedback('把引力调成 ×2 再发射。'); return; }
              if (ok) api.done(api.starsBy(c.shots <= 8 ? 3 : 2), '引力 ×2 时要 ' + r.v.toFixed(2) + ' km/s:不是 2 倍,而是约 1.41 倍(√2)。引力越强,轨道速度越快——想亲手改写引力,去宙律 Nomoverse。');
              else if (r.kind === 'orbit') api.feedback('绕回来了,但还不够圆。再微调。');
              else api.feedback(r.kind === 'land' ? '引力变强,原来的速度不够了。' : '太快,飞走了。');
            }
          } });
        api.onLeave(function () { c.destroy(); });
      } }
  ];
})(typeof window !== 'undefined' ? window : globalThis);
