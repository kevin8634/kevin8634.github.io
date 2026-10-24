/* 宙律 Nomoverse · core v0.1
 * 存储 / 向导与三级提示 / 声音 / UI / 固定步长积分器 / AI 层
 * 纯原生 JS,零依赖、零外部请求(唯一例外:用户自行开启 AI 层并填写的接口地址)。
 * 物理部分(Phys)不依赖 DOM,可在 node 中 require 测试。
 */
(function (G) {
  "use strict";

  /* ======================= 物理(纯函数,可测试) ======================= */
  var Phys = {
    // 地球:GM = 3.986004418e14 m^3/s^2(IERS/WGS-84 地心引力常数),平均半径 6371 km
    GM_EARTH_SI: 3.986004418e14,
    MU_EARTH: 398600.4418,      // km^3/s^2(同一数值换算到 km)
    R_EARTH: 6371,              // km
    G_STD: 9.80665,             // m/s^2 标准重力加速度(CODATA 约定值)
    C_AIR: 343,                 // m/s,20 °C 干燥空气
    C_WATER: 1480,              // m/s,约 20 °C 淡水

    vCirc: function (mu, r) { return Math.sqrt(mu / r); },
    vEsc: function (mu, r) { return Math.sqrt(2 * mu / r); },
    period: function (mu, a) { return 2 * Math.PI * Math.sqrt(a * a * a / mu); },
    radiusForPeriod: function (mu, T) { return Math.cbrt(mu * T * T / (4 * Math.PI * Math.PI)); },
    gAt: function (mu, r) { return mu / (r * r); },

    /* 中心引力加速度(二维,mu 与坐标同单位制) */
    gravAcc: function (mu, x, y) {
      var r2 = x * x + y * y, r = Math.sqrt(r2), k = -mu / (r2 * r);
      return [k * x, k * y];
    },
    /* 轨道体:velocity-Verlet(速度无关力)或 RK4(含阻力) 固定步长 */
    body: function (x, y, vx, vy) { return { x: x, y: y, vx: vx, vy: vy, ax: NaN, ay: NaN, t: 0 }; },
    verletStep: function (s, mu, dt) {
      if (isNaN(s.ax)) { var a0 = Phys.gravAcc(mu, s.x, s.y); s.ax = a0[0]; s.ay = a0[1]; }
      s.x += s.vx * dt + 0.5 * s.ax * dt * dt;
      s.y += s.vy * dt + 0.5 * s.ay * dt * dt;
      var a = Phys.gravAcc(mu, s.x, s.y);
      s.vx += 0.5 * (s.ax + a[0]) * dt;
      s.vy += 0.5 * (s.ay + a[1]) * dt;
      s.ax = a[0]; s.ay = a[1]; s.t += dt;
      return s;
    },
    /* accFn(x,y,vx,vy) -> [ax, ay] */
    rk4Step: function (s, accFn, dt) {
      var x = s.x, y = s.y, vx = s.vx, vy = s.vy;
      var a1 = accFn(x, y, vx, vy);
      var a2 = accFn(x + vx * dt / 2, y + vy * dt / 2, vx + a1[0] * dt / 2, vy + a1[1] * dt / 2);
      var v2x = vx + a1[0] * dt / 2, v2y = vy + a1[1] * dt / 2;
      var a3 = accFn(x + v2x * dt / 2, y + v2y * dt / 2, vx + a2[0] * dt / 2, vy + a2[1] * dt / 2);
      var v3x = vx + a2[0] * dt / 2, v3y = vy + a2[1] * dt / 2;
      var a4 = accFn(x + v3x * dt, y + v3y * dt, vx + a3[0] * dt, vy + a3[1] * dt);
      var v4x = vx + a3[0] * dt, v4y = vy + a3[1] * dt;
      s.x += dt / 6 * (vx + 2 * v2x + 2 * v3x + v4x);
      s.y += dt / 6 * (vy + 2 * v2y + 2 * v3y + v4y);
      s.vx += dt / 6 * (a1[0] + 2 * a2[0] + 2 * a3[0] + a4[0]);
      s.vy += dt / 6 * (a1[1] + 2 * a2[1] + 2 * a3[1] + a4[1]);
      s.ax = NaN; s.t += dt;
      return s;
    },
    energy: function (mu, s) { return 0.5 * (s.vx * s.vx + s.vy * s.vy) - mu / Math.hypot(s.x, s.y); },
    /* 推进 total 秒,按 dtMax 细分为固定子步(最后一步不缩短:total 由调用方取 dtMax 整数倍) */
    advance: function (s, mu, total, dtMax, dragFn) {
      var n = Math.max(1, Math.round(total / dtMax)), dt = total / n;
      for (var i = 0; i < n; i++) {
        if (dragFn) Phys.rk4Step(s, function (x, y, vx, vy) {
          var g = Phys.gravAcc(mu, x, y), d = dragFn(x, y, vx, vy); return [g[0] + d[0], g[1] + d[1]];
        }, dt);
        else Phys.verletStep(s, mu, dt);
      }
      return s;
    },
    /* 由状态求轨道要素 */
    elements: function (mu, s) {
      var r = Math.hypot(s.x, s.y), v2 = s.vx * s.vx + s.vy * s.vy, E = v2 / 2 - mu / r;
      var h = s.x * s.vy - s.y * s.vx;
      var a = -mu / (2 * E);
      var e = Math.sqrt(Math.max(0, 1 + 2 * E * h * h / (mu * mu)));
      return { a: a, e: e, E: E, h: h, rp: a * (1 - e), ra: a * (1 + e), T: E < 0 ? Phys.period(mu, a) : Infinity };
    },

    /* ---------- 抛体 ---------- */
    /* 解析解:无阻力 y(x) */
    projY: function (x, v, thDeg, g, y0) {
      var th = thDeg * Math.PI / 180, c = Math.cos(th);
      return y0 + x * Math.tan(th) - g * x * x / (2 * v * v * c * c);
    },
    /* 同高落地射程 */
    range: function (v, thDeg, g) { return v * v * Math.sin(2 * thDeg * Math.PI / 180) / g; },
    /* 平抛落地距离 */
    hRange: function (v, h, g) { return v * Math.sqrt(2 * h / g); },
    /* 空气阻力系数 k = ρ·Cd·A / (2m),单位 1/m;篮球:ρ=1.2,Cd=0.47,d=0.24 m,m=0.6 kg */
    K_BALL: 1.2 * 0.47 * (Math.PI * 0.12 * 0.12) / (2 * 0.6),
    /* 篮球投篮:无阻力时用解析位置,有阻力时半隐式欧拉固定步长 dt。
       opts: v, ang, g, x0, y0, k(阻力系数,0=无), wind(水平风速 m/s), hoopX, rimY, tol, dt, tMax */
    shoot: function (o) {
      var dt = o.dt || 1 / 240, th = o.ang * Math.PI / 180, k = o.k || 0, w = o.wind || 0;
      var x = o.x0, y = o.y0, vx = o.v * Math.cos(th), vy = o.v * Math.sin(th);
      var vx0 = vx, vy0 = vy, pts = [[x, y]], res = null, t = 0, peak = y, madeAt = -1;
      var tol = o.tol == null ? 0.13 : o.tol, tMax = o.tMax || 8;
      while (t < tMax) {
        var px = x, py = y;
        t += dt;
        if (k > 0) {
          var rx = vx - w, ry = vy, sp = Math.hypot(rx, ry);
          vx += (-k * sp * rx) * dt;
          vy += (-o.g - k * sp * ry) * dt;
          x += vx * dt; y += vy * dt;
        } else {
          x = o.x0 + vx0 * t; y = o.y0 + vy0 * t - 0.5 * o.g * t * t; vy = vy0 - o.g * t; vx = vx0;
        }
        if (y > peak) peak = y;
        pts.push([x, y]);
        if (!res && py >= o.rimY && y < o.rimY) {           // 向下穿过篮筐高度
          var f = (py - o.rimY) / (py - y), xc = px + (x - px) * f, dx = xc - o.hoopX;
          if (Math.abs(dx) <= tol) { res = "made"; madeAt = pts.length - 1; }
          else if (Math.abs(dx) <= 0.37) res = "rim";
          else res = dx < 0 ? "short" : "long";
          o.cross = xc;
        }
        if (res === "made" && y < o.rimY - 0.6) break;
        if (y < 0 || x > (o.xMax || 14) || x < -3 || y > 60) break;
      }
      if (!res) res = (peak < o.rimY) ? "low" : (x > o.hoopX ? "over" : "short");
      return { pts: pts, res: res, peak: peak, madeIdx: madeAt, cross: o.cross };
    },

    /* ---------- 声学 ---------- */
    /* 声源以 vToward 朝静止观察者运动(远离为负):f' = f·c/(c − v) */
    doppler: function (f, c, vToward) { return f * c / (c - vToward); },
    /* 一般式:观察者朝声源 vo、声源朝观察者 vs */
    dopplerGeneral: function (f, c, vo, vs) { return f * (c + vo) / (c - vs); },
    mach: function (v, c) { return v / c; },
    machHalfAngle: function (v, c) { return v > c ? Math.asin(c / v) : null; },
    beat: function (f1, f2) { return Math.abs(f1 - f2); },
    wavelength: function (c, f) { return c / f; },
    /* 推迟时刻求解:声源匀速直线 xs(t)=x0+v t(沿 x),观察者在 (xl, yl)。
       返回 t 时刻收到的所有发射时刻 te(≤t,≥t0),按时间排序。 */
    retarded: function (t, t0, x0, v, c, xl, yl) {
      function gfun(te) { var dx = x0 + v * te - xl; return c * (t - te) - Math.hypot(dx, yl); }
      var out = [], N = 400, a = t0, ga = gfun(a);
      for (var i = 1; i <= N; i++) {
        var b = t0 + (t - t0) * i / N, gb = gfun(b);
        if ((ga > 0) !== (gb > 0)) {
          var lo = a, hi = b, glo = ga;
          for (var j = 0; j < 40; j++) { var m = (lo + hi) / 2, gm = gfun(m); if ((gm > 0) === (glo > 0)) { lo = m; glo = gm; } else hi = m; }
          out.push((lo + hi) / 2);
        }
        a = b; ga = gb;
      }
      return out;
    },
    /* 由发射时刻求接收频率(声源沿 +x 匀速 v) */
    receivedFreq: function (f, c, te, x0, v, xl, yl) {
      var dx = xl - (x0 + v * te), d = Math.hypot(dx, yl), vToward = v * dx / d;
      return f * c / Math.abs(c - vToward);
    }
  };

  if (typeof module === "object" && module.exports) { module.exports = { Phys: Phys }; return; }

  /* ======================= 浏览器部分 ======================= */
  var D = document, W = window;
  var RM = !!(W.matchMedia && W.matchMedia("(prefers-reduced-motion: reduce)").matches);
  var ROOT = (function () {
    var s = D.currentScript && D.currentScript.src;
    try { return new URL("../", s || location.href).href; } catch (e) { return "../"; }
  })();

  /* ---------- 存储(全部 try/catch,无痕/禁用存储可玩) ---------- */
  function lsGet(k) { try { return W.localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { W.localStorage.setItem(k, v); return true; } catch (e) { return false; } }
  function lsDel(k) { try { W.localStorage.removeItem(k); } catch (e) {} }
  function jGet(k) { var v = lsGet(k); if (!v) return null; try { return JSON.parse(v); } catch (e) { return null; } }
  function jSet(k, o) { return lsSet(k, JSON.stringify(o)); }
  var MEM = {};   // 存储不可用时的本页内存进度
  var Store = {
    task: function (id, n) {
      var a = jGet("gn:nv:" + id) || MEM[id] || [];
      if (!Array.isArray(a)) a = [];
      var out = []; for (var i = 0; i < n; i++) out.push(Math.max(0, Math.min(3, +a[i] || 0)));
      return out;
    },
    star: function (id, n, lvl, stars) {
      var a = Store.task(id, n);
      if (stars > a[lvl]) { a[lvl] = stars; MEM[id] = a.slice(); jSet("gn:nv:" + id, a); return true; }
      return false;
    },
    pref: function () { return jGet("gn:nv:_pref") || {}; },
    setPref: function (k, v) { var p = Store.pref(); p[k] = v; jSet("gn:nv:_pref", p); }
  };

  /* ---------- 小工具 ---------- */
  function el(tag, attrs, kids) {
    var e = D.createElement(tag);
    if (attrs) for (var k in attrs) {
      var v = attrs[k]; if (v == null || v === false) continue;
      if (k === "class") e.className = v; else if (k === "html") e.innerHTML = v; else if (k === "text") e.textContent = v;
      else if (k.slice(0, 2) === "on") e.addEventListener(k.slice(2), v); else e.setAttribute(k, v === true ? "" : v);
    }
    if (kids != null) (Array.isArray(kids) ? kids : [kids]).forEach(function (c) { if (c != null) e.appendChild(typeof c === "string" ? D.createTextNode(c) : c); });
    return e;
  }
  function fit(cv) {
    var r = cv.getBoundingClientRect(), d = Math.min(2, W.devicePixelRatio || 1);
    var w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
    if (cv.width !== w * d || cv.height !== h * d) { cv.width = w * d; cv.height = h * d; }
    var c = cv.getContext("2d"); c.setTransform(d, 0, 0, d, 0, 0);
    return { ctx: c, w: w, h: h };
  }
  function fmt(x, n) { if (!isFinite(x)) return "∞"; return (+x).toFixed(n == null ? 1 : n); }
  function starsTxt(n, max) { var s = ""; for (var i = 0; i < (max || 3); i++) s += i < n ? "★" : "☆"; return s; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  var ICON = {
    snd0: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M17 9l5 6M22 9l-5 6"/></svg>',
    snd1: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg>',
    gear: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/></svg>',
    lock: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>'
  };

  /* ---------- 声音:默认关;手势后才建 AudioContext 并延迟加载 ---------- */
  var SND = (function () {
    var UI_SFX = { tick: 1, select: 1, whoosh: 1, close: 1 };
    var on = Store.pref().sound === true, ctx = null, mG, sG, src, sT, duckN = 0, buf = {}, last = {}, voices = [], btns = [];
    var FILES = ["music-nomoverse-loop", "select", "whoosh", "close", "tick", "unlock", "star", "swish", "thud"];
    var DUMMY = { alive: false, freq: function () {}, gain: function () {}, stop: function () {} };
    function live() { return on && ctx && ctx.state === "running" && !D.hidden; }
    function ui() { btns.forEach(function (b) { b.setAttribute("aria-pressed", on ? "true" : "false"); b.innerHTML = ICON[on ? "snd1" : "snd0"]; b.setAttribute("aria-label", on ? "关闭声音" : "开启声音"); }); }
    function init() {
      var AC = W.AudioContext || W.webkitAudioContext;
      if (ctx || !AC) return;
      try { ctx = new AC(); } catch (e) { ctx = null; return; }
      mG = ctx.createGain(); mG.gain.value = 0; mG.connect(ctx.destination);
      var comp = ctx.createDynamicsCompressor(); comp.connect(ctx.destination);
      sG = ctx.createGain(); sG.gain.value = 0; sG.connect(comp);
      FILES.forEach(function (n) {
        fetch(ROOT + "audio/" + n + ".m4a").then(function (r) { if (!r.ok) throw 0; return r.arrayBuffer(); })
          .then(function (ab) { return new Promise(function (ok, no) { ctx.decodeAudioData(ab, ok, no); }); })
          .then(function (b) { buf[n] = b; if (n === "music-nomoverse-loop") music(); }).catch(function () {});
      });
    }
    function music() {
      var b = buf["music-nomoverse-loop"]; if (src || !b) return;
      src = ctx.createBufferSource(); src.buffer = b; src.loop = true; src.loopStart = 0; src.loopEnd = Math.min(b.duration, 96);
      src.connect(mG); src.start(); sync();
    }
    function sync() {
      if (!ctx) return;
      var lv = on && !D.hidden, up = lv && duckN <= 0, t = ctx.currentTime;
      clearTimeout(sT);
      if (lv) { if (ctx.state !== "running") ctx.resume().catch(function () {}); }
      else {
        voices.forEach(function (v) { v.stop(); }); voices = [];
        sT = setTimeout(function () { if (!on || D.hidden) ctx.suspend().catch(function () {}); }, 700);
      }
      var g = mG.gain; g.cancelScheduledValues(t); g.setValueAtTime(g.value, t); g.linearRampToValueAtTime(up ? 0.3 : 0, t + (up ? 2 : 0.4));   // 规律声在响时背景音乐完全让路
      var s = sG.gain; s.cancelScheduledValues(t); s.setValueAtTime(s.value, t); s.linearRampToValueAtTime(lv ? 0.7 : 0, t + 0.3);
    }
    function set(v) { on = v; Store.setPref("sound", on); ui(); if (on) init(); sync(); }
    function gesture(e) {
      W.removeEventListener("pointerdown", gesture, true); W.removeEventListener("keydown", gesture, true);
      if (on && !(e.target && e.target.closest && e.target.closest("[data-snd]"))) { init(); sync(); }
    }
    W.addEventListener("pointerdown", gesture, true); W.addEventListener("keydown", gesture, true);
    D.addEventListener("visibilitychange", sync);
    function thr(n) { var t = performance.now(); if (t - (last[n] || 0) < 80) return false; last[n] = t; return true; }
    return {
      get on() { return on; },
      button: function () { var b = el("button", { class: "nv-btn nv-ico", type: "button", "data-snd": "1", onclick: function () { set(!on); } }); btns.push(b); ui(); return b; },
      set: set,
      play: function (n, e, gain) {
        if (!live() || !buf[n] || (e && e.pointerType === "touch") || !thr(n)) return;
        if (UI_SFX[n] && (duckN > 0 || voices.some(function (v) { return v.alive; }))) return;   // 规律声(振荡器)在响时不播界面音效,不干扰聆听
        var s = ctx.createBufferSource(); s.buffer = buf[n];
        if (gain != null) { var g = ctx.createGain(); g.gain.value = gain; s.connect(g); g.connect(sG); } else s.connect(sG);
        s.start();
      },
      hover: function (e) { if (e && e.pointerType === "mouse") SND.play("tick", e); },
      /* 实时振荡器:多普勒、高度音高等「声音即规律」 */
      voice: function (type, cutoff) {
        if (!live()) return DUMMY;
        var o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain(), dead = false;
        o.type = type || "triangle"; f.type = "lowpass"; f.frequency.value = cutoff || 2600; g.gain.value = 0;
        o.connect(f); f.connect(g); g.connect(sG); o.start();
        var v = {
          alive: true,
          freq: function (x) { if (!dead && isFinite(x) && x > 0) o.frequency.setTargetAtTime(Math.min(8000, x), ctx.currentTime, 0.012); },
          gain: function (x) { if (!dead) g.gain.setTargetAtTime(Math.max(0, x), ctx.currentTime, 0.03); },
          stop: function () { if (dead) return; dead = true; v.alive = false; var t = ctx.currentTime; g.gain.cancelScheduledValues(t); g.gain.setTargetAtTime(0, t, 0.04); try { o.stop(t + 0.3); } catch (e) {} }
        };
        voices.push(v); if (voices.length > 12) voices.shift().stop();
        return v;
      },
      /* 低频脉冲:轨道每圈一记;f = 引力强弱映射的音高 */
      pulse: function (f, gain) {
        if (!live() || !thr("pulse")) return;
        var t = ctx.currentTime, g = ctx.createGain(), peak = gain == null ? 0.5 : gain;
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0008, t + 1.1);
        g.connect(sG);
        [[1, 1], [2, 0.45], [3, 0.18]].forEach(function (p) {
          var o = ctx.createOscillator(); o.type = "sine"; o.frequency.setValueAtTime(f * p[0] * 1.5, t); o.frequency.exponentialRampToValueAtTime(f * p[0], t + 0.06);
          var gg = ctx.createGain(); gg.gain.value = p[1]; o.connect(gg); gg.connect(g); o.start(t); o.stop(t + 1.2);
        });
      },
      glide: function (f0, f1, d, gain) {
        if (!live() || !thr("glide")) return;
        var t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
        o.type = "triangle"; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + d);
        g.gain.setValueAtTime(gain || 0.3, t); g.gain.exponentialRampToValueAtTime(0.001, t + d + 0.1);
        o.connect(g); g.connect(sG); o.start(t); o.stop(t + d + 0.15);
      },
      boom: function () {
        if (!live() || !thr("boom")) return;
        var t = ctx.currentTime, n = ctx.sampleRate * 1.2, b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0);
        for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.25));
        var s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
        s.buffer = b; f.type = "lowpass"; f.frequency.value = 380; g.gain.value = 1.2; s.connect(f); f.connect(g); g.connect(sG); s.start(t);
      },
      duck: function (d) { duckN += d ? 1 : -1; if (duckN < 0) duckN = 0; sync(); },
      stopAll: function () { voices.forEach(function (v) { v.stop(); }); voices = []; }
    };
  })();

  /* ---------- 向导形象 v0.2:无五官的「科学仪器 / 任务徽章」(Canvas 程序绘制,RM 下静止) ---------- */
  var GUIDES = {
    quark: { name: "夸克「阿夸」", short: "阿夸" },
    abyss: { name: "黑洞「墨渊」", short: "墨渊" },
    ripple: { name: "引力波「涟漪」", short: "涟漪" }
  };
  var GC = { ac: "#a78bfa", ac2: "#c4b5fd", cy: "#67e8f9", cy2: "#a5f3fc", deep: "#07061a" };
  function poly(c, cx, cy, r, n, rot) { c.beginPath(); for (var i = 0; i <= n; i++) { var a = rot + i * 2 * Math.PI / n; if (i === 0) c.moveTo(cx + r * Math.cos(a), cy + r * Math.sin(a)); else c.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a)); } c.closePath(); }
  function coil(c, x0, y0, x1, y1, amp, turns, ph) {
    var dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L, N = Math.max(24, Math.round(turns * 10));
    c.beginPath();
    for (var i = 0; i <= N; i++) {
      var u = i / N, a = u * turns * 2 * Math.PI + ph, k = Math.sin(Math.PI * u);
      var px = x0 + dx * u + nx * Math.sin(a) * amp * k + dx / L * Math.cos(a) * amp * 0.45 * k, py = y0 + dy * u + ny * Math.sin(a) * amp * k + dy / L * Math.cos(a) * amp * 0.45 * k;
      if (i === 0) c.moveTo(px, py); else c.lineTo(px, py);
    }
    c.stroke();
  }
  function ticksRing(c, cx, cy, r0, len, n, major, rot, col, lw) {
    c.strokeStyle = col; c.lineWidth = lw;
    c.beginPath();
    for (var i = 0; i < n; i++) { var a = rot + i * 2 * Math.PI / n, l = (major && i % major === 0) ? len * 1.9 : len; c.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); c.lineTo(cx + Math.cos(a) * (r0 - l), cy + Math.sin(a) * (r0 - l)); }
    c.stroke();
  }
  function drawGuide(c, kind, w, h, t, talk) {
    var cx = w / 2, cy = h / 2, R = Math.min(w, h) * 0.47, s = R / 50, tt = RM ? 0 : t, en = talk && !RM ? 1 : 0;
    c.clearRect(0, 0, w, h);
    c.save(); c.lineCap = "round"; c.lineJoin = "round";
    var lw = Math.max(1, 1.6 * s), thin = Math.max(0.7, 0.9 * s);
    if (kind === "quark") {
      // 六边形刻度框(尖顶)+ 内框 + 角标
      c.strokeStyle = GC.ac; c.lineWidth = lw; c.shadowColor = GC.ac; c.shadowBlur = 6 * s;
      poly(c, cx, cy, R, 6, -Math.PI / 2); c.stroke();
      c.shadowBlur = 0; c.globalAlpha = 0.55; c.lineWidth = thin;
      poly(c, cx, cy, R * 0.84, 6, -Math.PI / 2); c.stroke(); c.globalAlpha = 1;
      c.fillStyle = "rgba(167,139,250,.08)"; poly(c, cx, cy, R * 0.84, 6, -Math.PI / 2); c.fill();
      for (var e = 0; e < 6; e++) {                      // 每条内边上的刻度
        var a0 = -Math.PI / 2 + e * Math.PI / 3, a1 = a0 + Math.PI / 3, r = R * 0.84;
        var ax = cx + r * Math.cos(a0), ay = cy + r * Math.sin(a0), bx = cx + r * Math.cos(a1), by = cy + r * Math.sin(a1);
        var mx = (ax + bx) / 2 - cx, my = (ay + by) / 2 - cy, ml = Math.hypot(mx, my);
        c.strokeStyle = e % 2 ? GC.cy : GC.ac2; c.globalAlpha = 0.75; c.lineWidth = thin; c.beginPath();
        for (var k = 1; k < 8; k++) { var u = k / 8, px = ax + (bx - ax) * u, py = ay + (by - ay) * u, L = (k === 4 ? 6 : 3) * s; c.moveTo(px, py); c.lineTo(px - mx / ml * L, py - my / ml * L); }
        c.stroke(); c.globalAlpha = 1;
      }
      c.strokeStyle = GC.ac2; c.lineWidth = lw * 1.6;          // 外角加粗段
      for (var q = 0; q < 6; q += 2) { var aa = -Math.PI / 2 + q * Math.PI / 3; c.beginPath(); c.moveTo(cx + R * Math.cos(aa - 0.16), cy + R * 0.985 * Math.sin(aa - 0.16)); c.lineTo(cx + R * Math.cos(aa), cy + R * Math.sin(aa)); c.lineTo(cx + R * Math.cos(aa + 0.16), cy + R * 0.985 * Math.sin(aa + 0.16)); c.stroke(); }
      // 三颗荷光球 + 胶子弹簧线
      var rot = tt * 0.35, rr = R * 0.38, pts = [];
      for (var i = 0; i < 3; i++) { var an = -Math.PI / 2 + rot + i * 2 * Math.PI / 3; pts.push([cx + Math.cos(an) * rr, cy + Math.sin(an) * rr]); }
      c.strokeStyle = "rgba(196,181,253,.8)"; c.lineWidth = thin;
      for (var j = 0; j < 3; j++) { var A = pts[j], B = pts[(j + 1) % 3]; coil(c, A[0], A[1], B[0], B[1], 3.2 * s, 7, tt * 6 + j); }
      var cols = [["#ff5d73", "#ffd0d6"], ["#3ee08f", "#c8ffe2"], ["#4f8dff", "#d2e3ff"]], br = R * 0.17 * (1 + 0.06 * en * Math.sin(t * 9));
      for (var m = 0; m < 3; m++) {
        var P = pts[m], g = c.createRadialGradient(P[0] - br * 0.35, P[1] - br * 0.4, br * 0.1, P[0], P[1], br);
        g.addColorStop(0, cols[m][1]); g.addColorStop(0.45, cols[m][0]); g.addColorStop(1, "rgba(0,0,0,.25)");
        c.shadowColor = cols[m][0]; c.shadowBlur = (10 + 6 * en) * s; c.fillStyle = g; c.beginPath(); c.arc(P[0], P[1], br, 0, 7); c.fill();
      }
      c.shadowBlur = 0;
    } else if (kind === "abyss") {
      // 外环 + 带刻度的仪表环(慢转)
      c.strokeStyle = GC.ac; c.lineWidth = lw; c.shadowColor = GC.ac; c.shadowBlur = 6 * s;
      c.beginPath(); c.arc(cx, cy, R, 0, 7); c.stroke(); c.shadowBlur = 0;
      c.fillStyle = "rgba(167,139,250,.07)"; c.beginPath(); c.arc(cx, cy, R * 0.9, 0, 7); c.fill();
      c.strokeStyle = "rgba(103,232,249,.55)"; c.lineWidth = thin; c.beginPath(); c.arc(cx, cy, R * 0.9, 0, 7); c.stroke();
      ticksRing(c, cx, cy, R * 0.9, 3 * s, 60, 5, tt * 0.12, "rgba(103,232,249,.75)", thin);
      c.globalAlpha = 0.45; c.strokeStyle = GC.ac2; c.lineWidth = thin; c.beginPath(); c.arc(cx, cy, R * 0.66, 0, 7); c.stroke(); c.globalAlpha = 1;
      ticksRing(c, cx, cy, R * 0.66, 4 * s, 8, 2, -tt * 0.2 + Math.PI / 8, "rgba(196,181,253,.7)", thin);
      // 吸积盘(倾斜)+ 引力透镜(盘背面被弯到洞的上方)
      var tilt = -0.3, dA = R * 0.62, dB = R * 0.17, hole = R * 0.2, pulse = 1 + 0.08 * en * Math.sin(t * 7);
      c.save(); c.translate(cx, cy); c.rotate(tilt);
      var dg = c.createLinearGradient(-dA, 0, dA, 0); dg.addColorStop(0, "rgba(124,92,240,.2)"); dg.addColorStop(0.5, "#f1ebff"); dg.addColorStop(1, "rgba(196,181,253,.35)");
      c.shadowColor = GC.ac; c.shadowBlur = 10 * s * pulse;
      c.strokeStyle = dg; c.lineWidth = 2.6 * s;               // 后半盘
      c.beginPath(); c.ellipse(0, 0, dA, dB, 0, Math.PI, 2 * Math.PI); c.stroke();
      c.lineWidth = 2.2 * s; c.strokeStyle = "rgba(225,215,255,.9)"; // 透镜像:绕过洞顶的光环
      c.beginPath(); c.ellipse(0, -hole * 0.1, hole * 1.55, hole * 1.45, 0, Math.PI * 1.02, Math.PI * 1.98); c.stroke();
      c.lineWidth = 1.2 * s; c.globalAlpha = 0.6; c.beginPath(); c.ellipse(0, hole * 0.15, hole * 1.4, hole * 1.25, 0, Math.PI * 0.08, Math.PI * 0.92); c.stroke(); c.globalAlpha = 1;
      c.shadowBlur = 0; c.fillStyle = "#020108"; c.beginPath(); c.arc(0, 0, hole, 0, 7); c.fill();
      c.strokeStyle = "rgba(245,240,255,.95)"; c.lineWidth = 1.1 * s; c.beginPath(); c.arc(0, 0, hole * 1.06, 0, 7); c.stroke();   // 光子环
      c.shadowColor = GC.ac; c.shadowBlur = 8 * s * pulse; c.strokeStyle = dg; c.lineWidth = 3.2 * s;  // 前半盘
      c.beginPath(); c.ellipse(0, 0, dA, dB, 0, 0.02, Math.PI - 0.02); c.stroke();
      c.lineWidth = thin; c.strokeStyle = "rgba(196,181,253,.6)"; c.beginPath(); c.ellipse(0, 0, dA * 1.22, dB * 1.3, 0, -0.2, Math.PI + 0.2); c.stroke();
      c.restore(); c.shadowBlur = 0;
    } else {
      // 方框 + 菱形 + 圆形视窗
      c.strokeStyle = GC.ac; c.lineWidth = thin; c.globalAlpha = 0.85;
      poly(c, cx, cy, R, 4, -Math.PI / 2); c.stroke();
      var S2 = R * 0.84; c.strokeRect(cx - S2, cy - S2, S2 * 2, S2 * 2); c.globalAlpha = 0.5; c.strokeRect(cx - S2 * 0.92, cy - S2 * 0.92, S2 * 1.84, S2 * 1.84); c.globalAlpha = 1;
      c.fillStyle = GC.ac; poly(c, cx, cy - R, 3.2 * s, 4, 0); c.fill(); poly(c, cx, cy + R, 3.2 * s, 4, 0); c.fill();
      var cr = R * 0.76;
      c.fillStyle = "rgba(14,11,40,.92)"; c.beginPath(); c.arc(cx, cy, cr, 0, 7); c.fill();
      c.strokeStyle = GC.ac; c.lineWidth = lw; c.shadowColor = GC.ac; c.shadowBlur = 6 * s; c.beginPath(); c.arc(cx, cy, cr, 0, 7); c.stroke(); c.shadowBlur = 0;
      c.save(); c.beginPath(); c.arc(cx, cy, cr - lw, 0, 7); c.clip();
      for (var n = 0; n < 5; n++) {                       // 同心涟漪(向外扩散)
        var ph = ((tt * (0.35 + 0.25 * en) + n / 5) % 1), rad = cr * (0.12 + ph * 0.95);
        c.strokeStyle = "rgba(167,139,250," + (0.75 * (1 - ph)).toFixed(3) + ")"; c.lineWidth = (2.6 - 1.6 * ph) * s;
        c.beginPath(); c.arc(cx, cy, rad, 0, 7); c.stroke();
      }
      // 啁啾波形:频率与振幅随 u 上升,随时间缓慢平移
      c.strokeStyle = GC.cy; c.lineWidth = Math.max(1, 1.3 * s); c.shadowColor = GC.cy; c.shadowBlur = 4 * s;
      c.beginPath();
      var x0 = cx - cr * 0.95, x1 = cx + cr * 0.95, base = cy + cr * 0.02, sh = tt * 0.25 % 1;
      for (var xi = 0; xi <= 90; xi++) {
        var u2 = xi / 90, uu = Math.min(1, u2 * 0.92 + 0.04), amp = cr * (0.06 + 0.32 * Math.pow(uu, 3)) * (u2 > 0.93 ? (1 - u2) / 0.07 : 1);
        var phase = 2 * Math.PI * (3 * uu + 9 * Math.pow(uu, 4)) - sh * 2 * Math.PI;
        var yy = base - amp * Math.sin(phase), xx = x0 + (x1 - x0) * u2;
        if (xi === 0) c.moveTo(xx, yy); else c.lineTo(xx, yy);
      }
      c.stroke(); c.shadowBlur = 0; c.restore();
      // 双星
      var oa = tt * 1.4, od = cr * 0.26;
      [[0, 1, GC.cy2, 4.4], [Math.PI, 0.8, "#efeaff", 3.6]].forEach(function (b) {
        var bx = cx + Math.cos(oa + b[0]) * od * b[1], by = cy - cr * 0.18 + Math.sin(oa + b[0]) * od * 0.55 * b[1];
        c.fillStyle = b[2]; c.shadowColor = b[2]; c.shadowBlur = 8 * s; c.beginPath(); c.arc(bx, by, b[3] * s, 0, 7); c.fill();
      });
      c.shadowBlur = 0;
    }
    c.restore();
  }
  /* 动画驱动的头像 */
  var avatars = [];
  function avatar(kind, size) {
    var cv = el("canvas", { width: size, height: size, "aria-hidden": "true" });
    var a = { cv: cv, kind: kind, talkUntil: 0, speak: function () { a.talkUntil = performance.now() + 2200; } };
    avatars.push(a); return a;
  }
  function tickAvatars(now) {
    avatars.forEach(function (a) {
      if (!a.cv.isConnected || !a.cv.offsetWidth) return;     // 隐藏(抽屉收起)时不画,避免 0 尺寸画布算出负半径
      var f = fit(a.cv); drawGuide(f.ctx, a.kind, f.w, f.h, now / 1000, now < a.talkUntil);
    });
  }
  (function loopAv(now) { tickAvatars(now); if (!RM || now < 3000) W.requestAnimationFrame(loopAv); else setTimeout(function () { W.requestAnimationFrame(loopAv); }, 400); })(0);

  /* ---------- 弹层 ---------- */
  var openModal = null;
  function modal(title, body, opts) {
    closeModal();
    var prev = D.activeElement;
    var card = el("div", { class: "nv-card", role: "dialog", "aria-modal": "true", "aria-label": title });
    card.appendChild(el("h2", { text: title }));
    (Array.isArray(body) ? body : [body]).forEach(function (b) { if (b) card.appendChild(b); });
    var wrap = el("div", { class: "nv-modal", onclick: function (e) { if (e.target === wrap) closeModal(); } }, card);
    D.body.appendChild(wrap);
    openModal = { wrap: wrap, prev: prev, onClose: opts && opts.onClose };
    var f = card.querySelector("button.pri, button, input, a"); if (f) f.focus();
    SND.play("select");
    return card;
  }
  function closeModal() {
    if (!openModal) return;
    var m = openModal; openModal = null; m.wrap.remove(); SND.play("close");
    if (m.onClose) m.onClose();
    if (m.prev && m.prev.focus) try { m.prev.focus(); } catch (e) {}
  }
  D.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && openModal) { e.preventDefault(); closeModal(); }
    if (e.key === "Tab" && openModal) {   // 简单焦点陷阱
      var f = openModal.wrap.querySelectorAll("button,input,a,select,textarea"); if (!f.length) return;
      var a = f[0], b = f[f.length - 1];
      if (e.shiftKey && D.activeElement === a) { e.preventDefault(); b.focus(); }
      else if (!e.shiftKey && D.activeElement === b) { e.preventDefault(); a.focus(); }
    }
  });

  /* ---------- AI 层(四层自选,默认 0;自带钥匙;只提问) ---------- */
  var AI = {
    LAYERS: [
      ["不用 AI(默认)", "只有预设的三级提示。未满 18 岁请保持此项。"],
      ["AI 追问", "每次运行后,AI 看你的预测和结果,追问一个问题。"],
      ["AI 对话", "你可以向向导提问,AI 只回问题和提示,不给答案。"],
      ["AI 讲解", "在上面基础上,通关后可以请 AI 讲解原理。"]
    ],
    get: function () {
      var o = jGet("gn:nv:_ai") || {};
      return { layer: Math.max(0, Math.min(3, +o.layer || 0)), base: o.base || "", model: o.model || "", key: o.key || "", adult: o.adult === true };
    },
    level: function () { var a = AI.get(); return (a.adult && a.base && a.key && a.model) ? a.layer : 0; },
    validBase: function (u) { return /^https:\/\/[^\s]+$/i.test(u) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/[^\s]*)?$/i.test(u); },
    redact: function (s) {
      return String(s || "").slice(0, 300)
        .replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, "[已隐去]")
        .replace(/\d[\d\s-]{6,}\d/g, "[已隐去]");
    },
    system: function (guide, explain) {
      var s = "你是物理探究小游戏「宙律 Nomoverse」里的向导" + guide + "。和你说话的可能是中小学生。必须遵守:" +
        "1. 苏格拉底式:只用一个简短的问题引导对方观察现象、对比两次结果或盯住一个变量;不直接说出答案、结论、公式结果或该填的数值。" +
        "2. 每次回复不超过 60 个汉字,且只包含 1 个问题,以问号结尾。" +
        "3. 不询问、不收集、不复述任何个人信息(姓名、年龄、学校、住址、联系方式等)。" +
        "4. 只谈本关的物理现象;遇到无关或不适宜的话题,礼貌地把话题引回本关。" +
        "5. 涉及火箭、爆炸、高处抛物等危险内容时,提醒「请勿在现实中模仿」。" +
        "6. 本游戏是科普探究,不谈考试、分数、培训。";
      if (explain) s = "你是物理探究小游戏「宙律 Nomoverse」里的向导" + guide + "。玩家已经亲手通关本关,现在请你讲解原理:" +
        "用不超过 150 个汉字、中学生能懂的语言说明本关背后的规律,可以给出公式;说明哪些地方是简化模型;最后用一个问题引导对方继续想。" +
        "不询问、不复述任何个人信息;不谈考试、分数、培训;涉及危险内容提醒「请勿在现实中模仿」。";
      return s;
    },
    /* opts: {mode:'follow'|'chat'|'explain', guide, task, level, goal, pred, result, question} → Promise<string|null> */
    ask: function (o) {
      var a = AI.get(), lv = AI.level();
      var need = o.mode === "follow" ? 1 : o.mode === "chat" ? 2 : 3;
      if (lv < need || !AI.validBase(a.base)) return Promise.resolve(null);
      var explain = o.mode === "explain";
      var ctx = "任务:" + o.task + "\n本关:" + o.level + "\n目标:" + o.goal +
        (o.pred ? "\n玩家的预测:" + o.pred : "") + (o.result ? "\n运行结果:" + o.result : "");
      var user = explain ? ctx + "\n请讲解本关原理。" : o.mode === "chat" ? ctx + "\n玩家问:" + AI.redact(o.question) : ctx + "\n请根据预测与结果,追问玩家一个问题。";
      var ctl = W.AbortController ? new AbortController() : null, to = setTimeout(function () { if (ctl) ctl.abort(); }, 20000);
      return fetch(a.base.replace(/\/+$/, "") + "/chat/completions", {
        method: "POST", signal: ctl ? ctl.signal : undefined, credentials: "omit", referrerPolicy: "no-referrer",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + a.key },
        body: JSON.stringify({ model: a.model, temperature: 0.4, max_tokens: explain ? 400 : 160, messages: [{ role: "system", content: AI.system(o.guide, explain) }, { role: "user", content: user }] })
      }).then(function (r) { if (!r.ok) throw new Error("http " + r.status); return r.json(); })
        .then(function (j) {
          clearTimeout(to);
          var t = j && j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content;
          if (!t) return null;
          t = String(t).replace(/<think>[\s\S]*?<\/think>/g, "").trim();
          if (!explain) {                                      // 强制「只提问」:必须是问句且简短
            if (!/[??]/.test(t)) return null;
            var m = t.match(/[^。!!\n]*?[??]/); t = (m ? m[0] : t).trim().slice(0, 90);
          } else t = t.slice(0, 400);
          return t;
        }).catch(function () { clearTimeout(to); return null; });
    }
  };

  function settings() {
    var a = AI.get();
    var radios = AI.LAYERS.map(function (L, i) {
      return el("label", { class: "nv-radio" }, [el("input", { type: "radio", name: "nvlayer", value: i, checked: a.layer === i }), el("span", {}, [L[0], el("small", { text: L[1] })])]);
    });
    var base = el("input", { type: "url", value: a.base, placeholder: "https://…/v1", autocomplete: "off", spellcheck: "false" });
    var model = el("input", { type: "text", value: a.model, placeholder: "模型名,例如 deepseek-chat", autocomplete: "off", spellcheck: "false" });
    var key = el("input", { type: "password", value: a.key, placeholder: "你自己的 API 钥匙", autocomplete: "off" });
    var adult = el("input", { type: "checkbox", checked: a.adult });
    var err = el("p", { class: "nv-err", role: "alert" });
    var sndT = el("input", { type: "checkbox", checked: SND.on, onchange: function () { SND.set(sndT.checked); } });
    var curP = PERF.pref;
    var perfRow = el("div", { class: "nv-seg", role: "radiogroup", "aria-label": "画面质量" }, [["auto", "自动"], ["high", "高"], ["mid", "中"], ["low", "低"]].map(function (o) {
      return el("label", { class: "nv-radio nv-seg-i" }, [el("input", { type: "radio", name: "nvperf", value: o[0], checked: curP === o[0] }), el("span", { text: o[1] })]);
    }));
    var perfNote = el("p", { style: "font-size:12px;color:var(--dim);margin:2px 0 6px", text: "高:完整光效与粒子 · 中:粒子减半 · 低:关闭 3D,用 2D 画面(功能不变)。当前:" + ({ high: "高", mid: "中", low: "低" })[PERF.tier] + (GL3D.ok ? "" : "(" + GL3D.reason + ")") + "。切换后刷新页面生效。" });
    perfRow.addEventListener("change", function (e) { if (e.target && e.target.name === "nvperf") { PERF.set(e.target.value); perfNote.textContent = "已保存,刷新页面后生效。"; } });
    var card = modal("设置", [
      el("label", { class: "nv-tog" }, [sndT, "声音(背景音乐与「声音即规律」音效)"]),
      el("h3", { class: "nv-q", text: "画面质量" }),
      perfRow, perfNote,
      el("div", { class: "nv-row", style: "margin:0 0 8px" }, [el("button", { class: "nv-btn sm", type: "button", text: "▶ 重播开场动画", onclick: function () {
        closeModal(); if (W.NVIntro && W.NVIntro.replay) W.NVIntro.replay(); else location.href = ROOT + "?intro=1";
      } })]),
      el("h3", { class: "nv-q", text: "生成式 AI 向导(可选,默认关闭)" }),
      el("div", {}, radios),
      el("label", { class: "nv-field" }, ["接口地址 base_url(OpenAI 兼容,优先国内已备案模型)", base]),
      el("label", { class: "nv-field" }, ["模型 model", model]),
      el("label", { class: "nv-field" }, ["钥匙 key(只保存在本机浏览器)", key]),
      el("label", { class: "nv-tog" }, [adult, "我已满 18 岁,或已获得监护人同意"]),
      el("p", { class: "nv-kc src", style: "font-size:12px;color:var(--dim);margin:4px 0", text: "只有你开启 AI 并填好以上三项后,本站才会向你填写的地址发送请求;内容只有本关名称、你的预测与运行结果(以及你主动输入的问题)。请勿输入个人信息。不开启时,全站零外部请求。" }),
      err,
      el("div", { class: "nv-actions" }, [
        el("button", { class: "nv-btn pri", type: "button", text: "保存", onclick: function () {
          var lv = +(card.querySelector("input[name=nvlayer]:checked") || { value: 0 }).value;
          var o = { layer: lv, base: base.value.trim(), model: model.value.trim(), key: key.value.trim(), adult: adult.checked };
          if (lv > 0) {
            if (!o.adult) { err.textContent = "开启 AI 前,请先勾选「已满 18 岁或已获监护人同意」。"; return; }
            if (!AI.validBase(o.base)) { err.textContent = "接口地址需以 https:// 开头。"; return; }
            if (!o.model || !o.key) { err.textContent = "请填写模型名和钥匙。"; return; }
          }
          if (!jSet("gn:nv:_ai", o)) { err.textContent = "当前浏览器禁止本地存储,设置无法保存。"; return; }
          closeModal(); W.dispatchEvent(new Event("nv:ai"));
        } }),
        el("button", { class: "nv-btn", type: "button", text: "清除钥匙", onclick: function () { lsDel("gn:nv:_ai"); closeModal(); W.dispatchEvent(new Event("nv:ai")); } }),
        el("button", { class: "nv-btn", type: "button", text: "关闭", onclick: closeModal })
      ])
    ]);
  }

  /* ---------- 页头 ---------- */
  function header(opts) {
    var top = el("header", { class: "nv-top" });
    var nav = el("nav", { class: "nv-nav", "aria-label": "站点导航" });
    (opts.links || []).forEach(function (l) { var A = el("a", { href: l[0], text: l[1] }); if (/创世计划/.test(l[1])) { A.setAttribute("title", "返回创世计划 Genesis 总门户(同一窗口)"); A.setAttribute("aria-label", "返回创世计划总门户"); A.className = "nv-home"; } nav.appendChild(A); });
    top.appendChild(nav);
    if (opts.brand) top.appendChild(el("span", { class: "nv-brand", text: opts.brand }));
    if (opts.tabs) top.appendChild(opts.tabs);
    top.appendChild(el("span", { class: "nv-sp" }));
    top.appendChild(SND.button());
    top.appendChild(el("button", { class: "nv-btn nv-ico nv-gear", type: "button", "aria-label": "设置(声音与 AI 向导)", html: ICON.gear, onclick: settings }));
    return top;
  }

  /* ======================= 任务框架 ======================= */
  var STEPS = ["观察", "预测", "运行", "对比", "改规则"];
  var TASKMETA = [   // 与首页 TASKS 保持一致(id 上线后不改)
    { id: "hoop", n: 4, guide: "quark", q: "如果引力变成两倍,篮球还能投进吗?" },
    { id: "orbit", n: 5, guide: "abyss", q: "为什么宇航员在空间站会飘起来?" },
    { id: "sound", n: 4, guide: "ripple", q: "为什么救护车经过时声音会变?" }
  ];
  function task(def) {
    var N = def.levels.length, prog = Store.task(def.id, N), gd = GUIDES[def.guide];
    var app = el("div", { class: "nv-app nv-im" });
    var tabs = el("div", { class: "nv-tabs", role: "tablist", "aria-label": "关卡" });
    var top = header({ links: [["../", "← 宙律"], ["../../", "创世计划"]], brand: "宙律 · 物理", tabs: tabs });
    var nav = top.querySelector(".nv-nav");
    var progFill = el("i"), progTxt = el("span", { class: "t" });
    var progBar = el("div", { class: "bar", role: "progressbar", "aria-label": "本任务星数", "aria-valuemin": "0", "aria-valuemax": String(N * 3) }, progFill);
    top.appendChild(el("div", { class: "nv-prog" }, [progBar, progTxt]));
    var stage = el("section", { class: "nv-stage", "aria-label": "实验画面" });
    var cv = el("canvas", { class: "nv-cv", role: "img", "aria-label": "实验画面" });
    var zone = el("div", { class: "nv-zone" });          // 画面「安全区」:关卡坐标系与 HUD 都以它为准
    var hud = el("div", { class: "nv-hud", "aria-live": "off" });
    var badge = el("div", { class: "nv-badge" });
    var toastEl = el("div", { class: "nv-toast", role: "status", "aria-live": "polite" });
    zone.appendChild(hud); zone.appendChild(badge); zone.appendChild(toastEl);
    stage.appendChild(cv); stage.appendChild(zone);
    app.appendChild(stage); app.appendChild(top);
    // 3D 舞台(v0.3-α2):任务声明 scene3d 模块时,在 2D 画布下方叠一层 WebGL;关卡 d3:true 才启用,失败回 2D
    var G3 = null;
    if (def.scene3d && GL3D.ok) {
      var cv3 = el("canvas", { class: "nv-cv nv-cv3", "aria-hidden": "true" });
      cv3.style.visibility = "hidden"; stage.insertBefore(cv3, cv);
      var drop3 = function (err) { if (W.console && err) console.warn("[nv] 3D 舞台回退 2D:", err && err.message || err); if (G3) { try { G3.dispose(); } catch (e) {} } G3 = null; GL3D.disable("3D 舞台失败,已回退 2D"); if (cv3.parentNode) cv3.parentNode.removeChild(cv3); app.classList.remove("nv-3d"); };
      GL3D.load().then(function (THREE) { return import(ROOT + def.scene3d).then(function (m) {
        if (W.__nvScene3dFail) throw new Error("scene3d forced failure");      // 自测钩子
        G3 = m.mount(THREE, cv3, { earthR: Phys.R_EARTH, onLost: drop3 });
      }); }).catch(drop3);
    }

    // 右上:向导徽标 + 玻璃提问卡片
    var av = avatar(def.guide, 56);
    var bubble = el("div", { class: "nv-bubble", "aria-live": "polite" });
    var guideEl = el("div", { class: "nv-guide nv-glass nv-hudc", role: "region", "aria-label": "向导 " + gd.name }, [av.cv, bubble]);
    app.appendChild(guideEl);
    // v0.4 统一 HUD:左侧任务抽屉(与首页同款),切换 3 个任务;手机/小横屏收成顶栏「任务」按钮弹出
    var tdList = el("div", { class: "hd-list" });
    var tdTog = el("button", { class: "hd-tog", type: "button", "aria-controls": "nv-td-" + def.id, text: "‹" });
    var td = el("nav", { class: "nv-td", id: "nv-td-" + def.id, "aria-label": "三个探究任务" }, [
      el("div", { class: "hd-h" }, [el("span", { text: "探究任务 · 13 关" }), tdTog]), tdList
    ]);
    var tdBtn = el("button", { class: "nv-btn nv-td-b", type: "button", "aria-controls": td.id, "aria-expanded": "false", text: "任务 ▾" });
    nav.appendChild(tdBtn);
    app.appendChild(td);
    ["tl", "tr", "bl", "br"].forEach(function (k) { stage.appendChild(el("i", { class: "nv-hc " + k, "aria-hidden": "true" })); });
    function tdOpen() { return !td.classList.contains("closed"); }
    function setTd(open, user) {
      td.classList.toggle("closed", !open);
      tdTog.textContent = open ? "‹" : "›";
      tdTog.setAttribute("aria-expanded", open ? "true" : "false"); tdTog.setAttribute("aria-label", open ? "收起任务抽屉" : "展开任务抽屉");
      tdBtn.setAttribute("aria-expanded", open ? "true" : "false"); tdBtn.textContent = open ? "任务 ▴" : "任务 ▾";
      if (user) { try { W.sessionStorage.setItem("gn:nv:_td", open ? "1" : "0"); } catch (e) {} }
      measure();
    }
    tdTog.addEventListener("click", function () { setTd(!tdOpen(), true); SND.play("select"); });
    tdBtn.addEventListener("click", function () { setTd(!tdOpen(), true); SND.play("select"); });
    td.addEventListener("keydown", function (e) { if (e.key === "Escape" && tdOpen() && (portrait() || (landMQ && landMQ.matches))) { setTd(false, true); tdBtn.focus(); } });
    function renderTD() {
      tdList.innerHTML = "";
      TASKMETA.forEach(function (t) {
        var me = t.id === def.id, p = me ? prog : Store.task(t.id, t.n);
        var got = p.reduce(function (a, b) { return a + b; }, 0), done = p.filter(function (x) { return x >= 1; }).length;
        var dots = el("span", { class: "hd-dots", "aria-hidden": "true" });
        for (var i = 0; i < t.n; i++) dots.appendChild(el("i", { class: (p[i] >= 1 ? "on" : "") + (me && i === cur ? " cur" : "") }));
        var a2 = avatar(t.guide, 40);
        tdList.appendChild(el("a", { class: "hd-card" + (me ? " me" : ""), href: me ? "#l" + (cur + 1) : "../" + t.id + "/", "aria-current": me ? "page" : null,
          "aria-label": (me ? "当前任务:" : "") + t.q + ",已通 " + done + " / " + t.n + " 关,已得 " + got + " 颗星",
          onclick: function (e) { if (me) { e.preventDefault(); if (portrait() || (landMQ && landMQ.matches)) setTd(false, true); } else SND.play("whoosh"); } }, [
          a2.cv, el("span", { class: "hd-txt" }, [el("b", { text: t.q }), el("span", { class: "hd-meta" }, [dots, el("em", { text: got + "/" + (t.n * 3) + "★" })])])
        ]));
      });
    }
    // 侧列 / 抽屉:关卡卡片(目标 + 预测)、对比卡、提示卡、页脚
    var side = el("aside", { class: "nv-side", "aria-label": "关卡面板" });
    var body = el("div", { class: "nv-body", id: "nv-body-" + def.id });
    side.appendChild(el("h1", { class: "sr", text: def.title }));
    side.appendChild(body);
    app.appendChild(side);
    // 底部:玻璃控制条
    var bar = el("div", { class: "nv-bar nv-glass nv-hudc", role: "group", "aria-label": "控制条" });
    app.appendChild(bar);
    var narrowMQ = W.matchMedia ? W.matchMedia("not all and (min-width: 900px) and (min-height: 520px)") : null;
    var landMQ = W.matchMedia ? W.matchMedia("(orientation: landscape) and (max-height: 519px)") : null;
    function portrait() { return !!(narrowMQ && narrowMQ.matches && !(landMQ && landMQ.matches)); }
    var drawerBtn = el("button", { class: "nv-btn nv-drawer-t", type: "button", "aria-controls": body.id, "aria-expanded": "true", text: "收起面板 ▾", onclick: function () { setDrawer(app.classList.contains("nv-collapsed")); } });
    function setDrawer(open) {
      app.classList.toggle("nv-collapsed", !open);
      drawerBtn.setAttribute("aria-expanded", open ? "true" : "false");
      drawerBtn.textContent = open ? "收起面板 ▾" : "展开面板 ▴";
      measure();
    }
    D.body.appendChild(app);

    var foot = el("div", { class: "nv-foot nv-glass nv-card2" });
    if (def.bridge) foot.appendChild(el("div", { class: "nv-row" }, [el("a", { class: "nv-btn sm", href: def.bridge.href, text: "星桥 → " + def.bridge.label, onpointerenter: SND.hover, onclick: function () { SND.play("whoosh"); } })]));
    foot.appendChild(el("div", { class: "nv-row" }, [el("a", { href: "../", text: "返回宙律首页" }), el("a", { href: "../../", text: "← 返回创世计划" })]));
    if (def.safety) foot.appendChild(el("p", { class: "nv-safe", text: def.safety }));
    foot.appendChild(el("p", { text: "科普探究小实验。画面中的数字来自简化模型,单位见各仪表。" }));

    // 测量各浮层,得到 CSS 变量与画面安全区
    var SZ = { x: 0, y: 0, w: 1, h: 1 };
    function measure() {
      var sr = stage.getBoundingClientRect(), tr = top.getBoundingClientRect(), gr = guideEl.getBoundingClientRect(), br = bar.getBoundingClientRect();
      app.style.setProperty("--toph", Math.round(tr.height) + "px");
      app.style.setProperty("--guideh", Math.round(gr.height) + "px");
      app.style.setProperty("--barh", Math.round(br.height) + "px");
      var x0 = 0, y0 = 0, x1 = sr.width, y1 = sr.height, rr = side.getBoundingClientRect();
      if (landMQ && landMQ.matches) { x1 = Math.min(rr.left, gr.left, br.left) - sr.left + 2; y0 = tr.bottom - sr.top - 4; }
      else if (portrait()) {
        y0 = gr.bottom - sr.top + 4;
        var bodyR = body.getBoundingClientRect();
        y1 = (app.classList.contains("nv-collapsed") || !bodyR.height ? br.top : bodyR.top) - sr.top + 2;
      } else { var dr = td.getBoundingClientRect(); x0 = dr.right - sr.left + 6; x1 = Math.min(rr.left, gr.left) - sr.left + 4; y0 = tr.bottom - sr.top - 4; y1 = br.top - sr.top - 8; }
      app.style.setProperty("--dw", (portrait() || (landMQ && landMQ.matches) ? 0 : Math.round(td.getBoundingClientRect().right - sr.left)) + "px");
      SZ = { x: Math.round(x0), y: Math.round(Math.max(0, y0)), w: Math.max(80, Math.round(x1 - x0)), h: Math.max(80, Math.round(y1 - Math.max(0, y0))) };
      var css = "left:" + SZ.x + "px;top:" + SZ.y + "px;width:" + SZ.w + "px;height:" + SZ.h + "px";
      if (css !== zone._css) { zone._css = css; zone.style.cssText = css; }
    }
    if (W.ResizeObserver) { var ro = new ResizeObserver(function () { measure(); }); [top, guideEl, bar, side, body, td].forEach(function (x) { ro.observe(x); }); }
    W.addEventListener("resize", measure);
    var L = null, cur = 0;
    var hashL = /#l(\d)/.exec(location.hash); 
    function unlocked(i) { return i === 0 || prog[i - 1] >= 1; }
    if (hashL && +hashL[1] >= 1 && +hashL[1] <= N && unlocked(+hashL[1] - 1)) cur = +hashL[1] - 1;
    else { cur = 0; while (cur < N - 1 && prog[cur] >= 1) cur++; }
    (function () {
      var v = null; try { v = W.sessionStorage.getItem("gn:nv:_td"); } catch (e) {}
      var small = portrait() || (landMQ && landMQ.matches);
      setTd(small ? false : (v != null ? v === "1" : W.innerWidth >= 1200), false);
      var lastSmall = small;
      W.addEventListener("resize", function () { var sm = portrait() || (landMQ && landMQ.matches); if (sm !== lastSmall) { lastSmall = sm; if (sm) setTd(false, false); } });
    })();

    function renderTabs() {
      renderTD();
      tabs.innerHTML = "";
      var got = prog.reduce(function (a, b) { return a + b; }, 0);
      progFill.style.width = (100 * got / (N * 3)).toFixed(1) + "%";
      progBar.setAttribute("aria-valuenow", String(got));
      progTxt.innerHTML = ""; progTxt.appendChild(el("b", { text: "★ " + got })); progTxt.appendChild(D.createTextNode(" / " + (N * 3) + " · 第 " + (cur + 1) + "/" + N + " 关"));
      def.levels.forEach(function (lv, i) {
        var ok = unlocked(i);
        var b = el("button", { class: "nv-tab", type: "button", role: "tab", "aria-selected": i === cur ? "true" : "false", disabled: !ok,
          "aria-label": "第 " + (i + 1) + " 关 " + lv.name + (ok ? ",星数 " + prog[i] : ",未解锁"), title: lv.name,
          onclick: function () { if (ok) open(i); } });
        b.appendChild(D.createTextNode(String(i + 1)));
        if (ok) b.appendChild(el("span", { class: "st", "aria-hidden": "true", text: starsTxt(prog[i]) }));
        else b.insertAdjacentHTML("beforeend", ICON.lock);
        tabs.appendChild(b);
      });
    }
    function say(t, who) {
      bubble.innerHTML = ""; bubble.appendChild(el("span", { class: "who", text: who || gd.name })); bubble.appendChild(D.createTextNode(t)); av.speak();
    }
    var toastT;
    function toast(t, ms) { toastEl.textContent = t; toastEl.classList.add("on"); clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove("on"); }, ms || 1800); }

    function open(i) {
      if (L && L.lv.leave) L.lv.leave(L);
      SND.stopAll();
      cur = i; renderTabs();
      try { history.replaceState(null, "", "#l" + (i + 1)); } catch (e) {}
      var lv = def.levels[i];
      L = {
        lv: lv, idx: i, task: def, cv: cv, v: {}, st: {}, pred: null, runPred: null, firstChoice: null, attempts: 0, hints: 0,
        phase: "observe", passed: prog[i] >= 1, RM: RM, snd: SND, P: Phys, hud: hud, lastPred: "", lastRes: "", drawing: false,
        say: say, toast: toast, sfx: function (n, g) { SND.play(n, null, g); },
        setPhase: setPhase, finishRun: finishRun, setPred: setPred, setControl: setControl, refreshUI: refreshUI
      };
      badge.textContent = lv.note ? "简化模型:" + lv.note : "";
      buildPanel();
      if (lv.init) lv.init(L);
      setPhase(lv.predict ? "predict" : "ready");
      say(lv.ask || "先看看画面,你注意到了什么?");
      if (!RM) SND.play("whoosh", null, 0.5);
    }

    var ui = {};
    var PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l12.5-7.5z"/></svg>';
    function buildPanel() {
      var lv = L.lv; body.innerHTML = ""; bar.innerHTML = ""; ui = {};
      // 关卡卡片:目标 + 流程 + 预测
      var mc = el("section", { class: "nv-glass nv-card2", "aria-label": "本关目标与预测" });
      mc.appendChild(el("h2", { class: "nv-h2", text: "第 " + (L.idx + 1) + " 关 · " + lv.name }));
      mc.appendChild(el("p", { class: "nv-goal", text: lv.goal }));
      ui.steps = el("ol", { class: "nv-steps", "aria-label": "流程" });
      STEPS.forEach(function (s) { ui.steps.appendChild(el("li", { text: s })); });
      mc.appendChild(ui.steps);
      if (lv.note) mc.appendChild(el("p", { class: "nv-note", text: "简化模型:" + lv.note }));
      body.appendChild(mc);
      // 预测
      if (lv.predict) {
        var p = lv.predict, box = el("div", { class: "nv-box", role: "group", "aria-label": "先预测" });
        box.appendChild(el("h3", { text: "① 先预测:" + p.q }));
        if (p.type === "choice") {
          var ch = el("div", { class: "nv-choices" });
          ui.choices = p.options.map(function (o, k) {
            var b = el("button", { class: "nv-btn nv-choice", type: "button", "aria-pressed": "false", text: o, onclick: function () {
              if (L.firstChoice != null && L.attempts > 0) return;
              setPred(k);
            } });
            ch.appendChild(b); return b;
          });
          box.appendChild(ch);
        } else if (p.type === "slider") {
          var out = el("output");
          var r = el("input", { type: "range", min: p.min, max: p.max, step: p.step, value: p.value, "aria-label": "预测:" + p.q });
          var upd = function () { out.textContent = (p.fmt ? p.fmt(+r.value) : r.value) + (p.unit || ""); };
          r.addEventListener("input", function () { upd(); setPred(+r.value); });
          upd();
          box.appendChild(el("div", { class: "nv-ctl" }, [el("label", {}, [el("span", { text: "我猜" }), out]), r]));
          box.appendChild(el("button", { class: "nv-btn sm", type: "button", text: "就猜这个", onclick: function () { setPred(+r.value); } }));
          ui.predRange = r;
        } else if (p.type === "tap" || p.type === "draw") {
          box.appendChild(el("p", { style: "margin:0;font-size:13px;color:var(--mu)", text: p.type === "tap" ? "在画面上点一下。" : "在画面上按住拖动,画出你猜的路线。" }));
          if (p.alt) {   // 键盘可用的替代方式
            var alts = p.alt(L);
            var row = el("div", { class: "nv-seg", style: "margin-top:6px" });
            alts.forEach(function (al) { row.appendChild(el("button", { class: "nv-btn sm", type: "button", text: al.label, onclick: function () { setPred(al.make(L)); } })); });
            box.appendChild(el("p", { style: "margin:6px 0 2px;font-size:12px;color:var(--dim)", text: "也可以直接选:" }));
            box.appendChild(row);
          }
        }
        ui.predBox = box; mc.appendChild(box);
      }
      // 对比卡:预测 vs 实际
      ui.result = el("div", { class: "nv-result", "aria-live": "polite" });
      ui.cmp = el("section", { class: "nv-glass nv-card2 nv-cmp", "aria-label": "预测与结果对比" }, [
        el("p", { class: "nv-cardh", text: "对比 · 预测 vs 实际" }), ui.result,
        el("div", { class: "nv-legend", "aria-hidden": "true" }, [el("span", {}, [el("i"), "你的预测"]), el("span", {}, [el("i", { class: "r" }), "实际结果"])])
      ]);
      body.appendChild(ui.cmp);
      // 提示卡
      var hb = el("div", { class: "nv-hints" }, [el("span", { text: "向导提示:" })]);
      var names = ["观察", "对比", "变量"];
      ui.hintBtns = names.map(function (n, k) {
        var b = el("button", { class: "nv-btn sm", type: "button", text: (k + 1) + " " + n, disabled: k > 0, onclick: function () { openHint(k); } });
        hb.appendChild(b); return b;
      });
      ui.hintList = el("ol", { class: "nv-hintlist" });
      ui.askWrap = el("div");
      body.appendChild(el("section", { class: "nv-glass nv-card2", "aria-label": "向导提示" }, [hb, ui.hintList, ui.askWrap]));
      body.appendChild(foot);

      // —— 控制条:规则滑杆(等宽读数)+ 圆形运行按钮 ——
      var cbox = el("div", { class: "nv-ctls", role: "group", "aria-label": "可改的规则" });
      if ((lv.controls || []).length) cbox.appendChild(el("p", { class: "nv-ctlh", text: lv.predict ? "② 可改的规则" : "可改的规则" }));
      var cgrid = el("div", { class: "nv-ctlgrid" }); cbox.appendChild(cgrid);
      ui.ctl = {};
      (lv.controls || []).forEach(function (c) {
        L.v[c.id] = c.value;
        if (c.type === "toggle") {
          var inp = el("input", { type: "checkbox", checked: !!c.value });
          inp.addEventListener("change", function () { L.v[c.id] = inp.checked; ctlChanged(c.id); });
          var lab = el("label", { class: "nv-tog" }, [inp, c.label]);
          ui.ctl[c.id] = { el: inp, wrap: lab, c: c }; cgrid.appendChild(lab);
        } else if (c.type === "seg") {
          var seg = el("div", { class: "nv-seg", role: "group", "aria-label": c.label });
          var bs = c.options.map(function (o, k) {
            var b = el("button", { class: "nv-btn sm", type: "button", "aria-pressed": c.value === k ? "true" : "false", text: o, onclick: function () {
              L.v[c.id] = k; bs.forEach(function (x, j) { x.setAttribute("aria-pressed", j === k ? "true" : "false"); }); ctlChanged(c.id);
            } });
            seg.appendChild(b); return b;
          });
          var w = el("div", { class: "nv-ctl" }, [el("label", {}, [el("span", { text: c.label })]), seg]);
          ui.ctl[c.id] = { btns: bs, wrap: w, c: c }; cgrid.appendChild(w);
        } else {
          var o2 = el("output");
          var rg = el("input", { type: "range", min: c.min, max: c.max, step: c.step, value: c.value, "aria-label": c.label });
          var u2 = function () { o2.textContent = (c.fmt ? c.fmt(+rg.value) : rg.value) + (c.unit || ""); };
          rg.addEventListener("input", function () { L.v[c.id] = +rg.value; u2(); ctlChanged(c.id); });
          u2();
          var w2 = el("div", { class: "nv-ctl" }, [el("label", {}, [el("span", { text: c.label }), o2]), rg]);
          ui.ctl[c.id] = { el: rg, wrap: w2, c: c, upd: u2 }; cgrid.appendChild(w2);
        }
      });
      if (lv.extra) cbox.appendChild(el("div", { class: "nv-extra" }, lv.extra(L)));
      if (!(lv.controls || []).length && !lv.extra) cbox.appendChild(el("p", { class: "nv-ctlh", text: "本关没有可调的规则:做好预测,然后运行。" }));
      bar.appendChild(cbox);
      var lbl = lv.runLabel || "运行";
      ui.run = el("button", { class: "nv-btn pri nv-run", type: "button", "aria-label": lbl, title: lbl + "(Enter)", "aria-keyshortcuts": "Enter", onclick: run });
      ui.run.innerHTML = '<span class="dot">' + PLAY + '</span>';
      ui.run.appendChild(el("span", { class: "lb", "aria-hidden": "true", text: lbl }));
      ui.reset = el("button", { class: "nv-btn sm", type: "button", text: "重新预测", onclick: function () { clearPred(); if (lv.reset) lv.reset(L); setPhase(lv.predict ? "predict" : "ready"); } });
      bar.appendChild(el("div", { class: "nv-btns" }, [drawerBtn, ui.run, lv.predict && lv.predict.type !== "choice" ? ui.reset : null]));
      buildAsk();
      refreshUI();
      measure();
    }
    function buildAsk() {
      ui.askWrap.innerHTML = "";
      if (AI.level() < 2) return;
      var inp = el("input", { type: "text", maxlength: "120", placeholder: "问" + gd.short + "一个问题(勿填个人信息)", "aria-label": "向向导提问" });
      var b = el("button", { class: "nv-btn sm", type: "button", text: "问", onclick: function () {
        var q = inp.value.trim(); if (!q) return; inp.value = ""; say("让我想想……");
        aiAsk("chat", q).then(function (t) { say(t || fallbackHint(), t ? gd.name + " · AI" : gd.name); });
      } });
      inp.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); b.click(); } });
      ui.askWrap.appendChild(el("div", { class: "nv-ask" }, [inp, b]));
    }
    W.addEventListener("nv:ai", function () { if (L) buildAsk(); });
    function aiAsk(mode, q) {
      var lv = L.lv;
      return AI.ask({ mode: mode, guide: gd.name, task: def.title, level: lv.name, goal: lv.goal, pred: L.lastPred, result: L.lastRes, question: q });
    }
    function fallbackHint() { var k = Math.min(L.hints, 2); return L.lv.hints[k]; }
    function openHint(k) {
      if (k > L.hints) return;
      if (k === L.hints) {
        L.hints++;
        ui.hintList.appendChild(el("li", { text: L.lv.hints[k] }));
        if (ui.hintBtns[k + 1]) ui.hintBtns[k + 1].disabled = false;
      }
      ui.hintBtns[k].disabled = true;
      say(L.lv.hints[k]); SND.play("tick", null, 0.8);
    }
    function setControl(id, val) {
      var u = ui.ctl[id]; if (!u) return; L.v[id] = val;
      if (u.el && u.el.type === "range") { u.el.value = val; u.upd(); } else if (u.el) u.el.checked = !!val;
      else if (u.btns) u.btns.forEach(function (x, j) { x.setAttribute("aria-pressed", j === val ? "true" : "false"); });
    }
    function ctlChanged(id) {
      if (L.lv.onControl) L.lv.onControl(L, id, L.v[id]);
      if (L.phase === "compare") setPhase(L.lv.predict && L.lv.predict.type !== "choice" ? "predict" : "ready", true);
      refreshUI();
    }
    function setPred(p) {
      if (L.phase === "running") return;
      L.pred = p;
      if (L.lv.predict && L.lv.predict.type === "choice") {
        if (L.firstChoice == null || L.attempts === 0) L.firstChoice = p;
        ui.choices.forEach(function (b, j) { b.setAttribute("aria-pressed", j === p ? "true" : "false"); });
      }
      if (L.lv.onPred) L.lv.onPred(L, p);
      if (L.phase === "predict" || L.phase === "observe" || L.phase === "compare") setPhase("ready");
      refreshUI();
    }
    function clearPred() {
      if (L.lv.predict && L.lv.predict.type === "choice") return;
      L.pred = null; if (L.lv.onPred) L.lv.onPred(L, null);
    }
    function setPhase(ph, rule) {
      L.phase = ph; L.ruleChanged = !!rule || L.ruleChanged;
      var idx = { observe: 0, predict: 1, ready: 2, running: 2, compare: 3 }[ph];
      if (rule && ph !== "running" && ph !== "compare") idx = L.lv.predict && L.lv.predict.type !== "choice" ? 1 : 4;
      if (ph === "predict" && L.attempts > 0) clearPred();
      [].forEach.call(ui.steps.children, function (li, k) { li.className = k === idx ? "on" : (k < idx ? "ok" : ""); });
      refreshUI();
    }
    function refreshUI() {
      if (!ui.run) return;
      var needPred = L.lv.predict && L.pred == null;
      ui.run.disabled = L.phase === "running" || !!needPred || (L.lv.canRun && !L.lv.canRun(L));
      ui.run.title = needPred ? "先完成预测" : (L.lv.runLabel || "运行") + "(Enter)";
      if (ui.predBox) ui.predBox.classList.toggle("done", !needPred);
      if (ui.choices) ui.choices.forEach(function (b) { b.disabled = L.attempts > 0 && L.firstChoice != null && L.phase !== "predict"; });
      for (var k in ui.ctl) { var u = ui.ctl[k]; var dis = L.phase === "running" && !(u.c.live); if (u.el) u.el.disabled = dis || (u.c.enabled && !u.c.enabled(L)); if (u.btns) u.btns.forEach(function (b) { b.disabled = dis; }); }
      if (ui.reset) ui.reset.disabled = L.phase === "running";
    }
    function run() {
      if (!L || ui.run.disabled) return;
      L.attempts++; L.runPred = L.pred; L.ruleChanged = false;
      ui.result.innerHTML = "";
      setPhase("running");   // 运行/比较时不再播放钟声和弦,避免盖住要听的声音
      if (portrait() && !app.classList.contains("nv-collapsed")) { L.autoCollapsed = true; setDrawer(false); }
      L.lv.run(L);
    }
    function finishRun(r) {
      if (!L || L.phase !== "running") return;
      L.lastPred = r.predText || ""; L.lastRes = r.resultText || "";
      ui.result.innerHTML = r.html || "";
      setPhase("compare");
      if (L.autoCollapsed) { L.autoCollapsed = false; setDrawer(true); try { ui.cmp.scrollIntoView({ block: "nearest" }); } catch (e) {} }
      if (L.lv.predict && L.lv.predict.type !== "choice") L.pred = null;   // 每次运行前都要重新预测
      refreshUI();
      if (r.pass) {
        var s = 1 + (L.lv.predictGood && L.lv.predictGood(L, r) ? 1 : 0) + (L.lv.star3 && L.lv.star3(L, r) ? 1 : 0);
        var crit = [true, s >= 2 || (L.lv.predictGood && L.lv.predictGood(L, r)), L.lv.star3 && L.lv.star3(L, r)];
        var newly = !L.passed; L.passed = true;
        var up = Store.star(def.id, N, L.idx, s); prog = Store.task(def.id, N);
        if (!prog[L.idx] || prog[L.idx] < s) prog[L.idx] = s;          // 存储不可用时也在本页记住
        renderTabs();
        SND.play("unlock");
        setTimeout(function () { passModal(s, crit, newly); }, RM ? 200 : 900);
      } else {
        var q = r.say || fallbackHint();
        say(q);
        if (AI.level() >= 1) aiAsk("follow").then(function (t) { if (t) say(t, gd.name + " · AI"); });
      }
    }
    function passModal(s, crit, newly) {
      var lv = L.lv, i = L.idx;
      var kc = el("div", { class: "nv-kc" }, [el("h3", { text: "知识卡 · " + lv.card.t }), el("p", { text: lv.card.b })]);
      if (lv.card.f) kc.appendChild(el("p", { class: "f", text: lv.card.f }));
      if (lv.card.src) kc.appendChild(el("p", { class: "src", text: "参考:" + lv.card.src }));
      var critL = el("ul", { class: "crit" });
      (lv.crit || ["完成目标", "预测接近结果", "额外挑战"]).forEach(function (c, k) { critL.appendChild(el("li", { class: crit[k] ? "y" : "", text: (crit[k] ? "✓ " : "○ ") + c })); });
      var aiBox = el("div");
      var acts = el("div", { class: "nv-actions" });
      if (i < N - 1) acts.appendChild(el("button", { class: "nv-btn pri", type: "button", text: "下一关 →", onclick: function () { closeModal(); open(i + 1); } }));
      else acts.appendChild(el("a", { class: "nv-btn pri", href: "../", text: "回首页看星图" }));
      acts.appendChild(el("button", { class: "nv-btn", type: "button", text: "留在这关再试", onclick: closeModal }));
      if (AI.level() >= 3) acts.appendChild(el("button", { class: "nv-btn", type: "button", text: "请 AI 讲解", onclick: function (e) {
        e.target.disabled = true; aiBox.textContent = "AI 正在组织语言……";
        aiAsk("explain").then(function (t) { aiBox.innerHTML = ""; aiBox.appendChild(el("div", { class: "nv-kc" }, [el("h3", { text: gd.name + " · AI 讲解" }), el("p", { text: t || "AI 暂时连不上。先看看上面的知识卡吧。" }), el("p", { class: "src", text: "AI 生成内容可能有误,以知识卡与实验为准。" })])); });
      } }));
      modal("第 " + (i + 1) + " 关 通关", [
        el("p", { class: "big", "aria-label": s + " 星", text: starsTxt(s) }), critL,
        el("p", {}, [el("b", { text: gd.short + ":" }), lv.summary]), kc, aiBox, acts
      ]);
      say(lv.summary);
      if (newly && lv.lights) toast("点亮知识星:" + lv.lights, 2400);
    }

    // 画布交互:预测(点/画)或交给关卡
    function toLocal(e) { var r = cv.getBoundingClientRect(); return [e.clientX - r.left - SZ.x, e.clientY - r.top - SZ.y]; }
    function predicting() { var p = L && L.lv.predict; return p && (p.type === "tap" || p.type === "draw") && L.phase !== "running"; }
    cv.addEventListener("pointerdown", function (e) {
      if (!L) return; var p = toLocal(e);
      if (predicting() && L.lv.toWorld) {
        var w = L.lv.toWorld(L, p[0], p[1]); if (!w) return;
        if (L.lv.predict.type === "tap") { setPred(w); SND.play("tick", null, 0.7); }
        else { L.drawing = true; L.pred = null; L.drawPts = [w]; try { cv.setPointerCapture(e.pointerId); } catch (x) {} }
        e.preventDefault(); return;
      }
      if (L.lv.onPointer) L.lv.onPointer(L, "down", p[0], p[1], e);
    });
    cv.addEventListener("pointermove", function (e) {
      if (!L) return; var p = toLocal(e);
      if (L.drawing) { var w = L.lv.toWorld(L, p[0], p[1]); if (w) L.drawPts.push(w); return; }
      if (L.lv.onPointer) L.lv.onPointer(L, "move", p[0], p[1], e);
    });
    function up(e) {
      if (!L) return;
      if (L.drawing) { L.drawing = false; if (L.drawPts.length >= 6) setPred(L.drawPts.slice()); else { L.drawPts = null; toast("再画长一点"); } return; }
      if (L.lv.onPointer) { var p = toLocal(e); L.lv.onPointer(L, "up", p[0], p[1], e); }
    }
    cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", up);

    D.addEventListener("keydown", function (e) {
      if (e.key !== "Enter" || openModal || !L) return;
      var t = e.target, tag = t && t.tagName;
      if (tag === "BUTTON" || tag === "A" || tag === "TEXTAREA" || (tag === "INPUT" && t.type !== "range" && t.type !== "checkbox")) return;
      e.preventDefault(); run();
    });

    /* 安全区边缘向外「渗出」并渐隐到深空底色,避免画面在玻璃面板旁出现硬切边 */
    function bleed(c, f) {
      var d = cv.width / f.w, bot = SZ.y + SZ.h, right = SZ.x + SZ.w, n;
      c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
      if ((n = Math.min(f.h - bot, 64)) > 2) {
        c.drawImage(cv, SZ.x * d, (bot - 1) * d, SZ.w * d, d, SZ.x * d, bot * d, SZ.w * d, n * d);
        var g = c.createLinearGradient(0, bot * d, 0, (bot + n) * d); g.addColorStop(0, "rgba(7,6,26,0.15)"); g.addColorStop(1, "rgba(7,6,26,1)");
        c.fillStyle = g; c.fillRect(SZ.x * d, bot * d, SZ.w * d, n * d);
      }
      if ((n = Math.min(f.w - right, 48)) > 2) {
        c.drawImage(cv, (right - 1) * d, SZ.y * d, d, SZ.h * d, right * d, SZ.y * d, n * d, SZ.h * d);
        var g2 = c.createLinearGradient(right * d, 0, (right + n) * d, 0); g2.addColorStop(0, "rgba(7,6,26,0.2)"); g2.addColorStop(1, "rgba(7,6,26,1)");
        c.fillStyle = g2; c.fillRect(right * d, SZ.y * d, n * d, SZ.h * d);
      }
      c.restore();
    }
    var lastT = 0;
    function frame(now) {
      var dt = Math.min(0.05, (now - (lastT || now)) / 1000); lastT = now;
      if (L && L.lv.frame) {
        measure();
        var f = fit(cv), c = f.ctx, on3 = !!(G3 && L.lv.d3);
        c.clearRect(0, 0, f.w, f.h);
        if (G3) { G3.show(on3); G3.setZone(SZ); }
        app.classList.toggle("nv-3d", on3);
        L.d3 = on3 ? G3 : null;
        if (!on3) Draw.stars(c, f.w, f.h, 11, Math.round(f.w * f.h / 7000));   // 安全区外也铺满星空(沉浸)
        c.translate(SZ.x, SZ.y);
        L.ctx = c; L.w = SZ.w; L.h = SZ.h;
        c.save();
        try { L.lv.frame(L, dt, now / 1000); } catch (err) { if (W.console) console.error(err); }
        c.restore();
        if (on3) { try { G3.render(L); } catch (err) { if (W.console) console.error(err); } }
        else bleed(c, f);
      }
      W.requestAnimationFrame(frame);
    }
    renderTabs(); open(cur);
    W.requestAnimationFrame(frame);
    NV._L = function () { return L; };       // 自测钩子(只读)
    return { open: open };
  }

  /* ---------- 画布通用绘制 ---------- */
  var Draw = {
    dashPath: function (c, pts, color, w) {
      if (!pts || pts.length < 2) return;
      c.save(); c.setLineDash([7, 6]); c.strokeStyle = color || "#fbbf24"; c.lineWidth = w || 2.5;
      c.beginPath(); var pen = false; for (var i = 0; i < pts.length; i++) { var X = pts[i][0], Y = pts[i][1]; if (X !== X || Y !== Y) { pen = false; continue; } if (pen) c.lineTo(X, Y); else { c.moveTo(X, Y); pen = true; } } c.stroke(); c.restore();
    },
    path: function (c, pts, color, w) {
      if (!pts || pts.length < 2) return;
      c.save(); c.strokeStyle = color || "#c4b5fd"; c.lineWidth = w || 2.5; c.lineJoin = "round";
      c.beginPath(); var pen = false; for (var i = 0; i < pts.length; i++) { var X = pts[i][0], Y = pts[i][1]; if (X !== X || Y !== Y) { pen = false; continue; } if (pen) c.lineTo(X, Y); else { c.moveTo(X, Y); pen = true; } } c.stroke(); c.restore();
    },
    stars: function (c, w, h, seed, n) {
      var s = seed || 1; function r() { s = (s * 16807) % 2147483647; return s / 2147483647; }
      c.save(); for (var i = 0; i < (n || 80); i++) { c.fillStyle = "rgba(230,225,255," + (0.25 + r() * 0.6).toFixed(2) + ")"; c.fillRect(r() * w, r() * h, r() < 0.1 ? 2 : 1, r() < 0.1 ? 2 : 1); } c.restore();
    },
    arrow: function (c, x0, y0, x1, y1, color, w) {
      var a = Math.atan2(y1 - y0, x1 - x0), L = Math.hypot(x1 - x0, y1 - y0); if (L < 2) return;
      c.save(); c.strokeStyle = c.fillStyle = color; c.lineWidth = w || 2;
      c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
      c.beginPath(); c.moveTo(x1, y1); c.lineTo(x1 - 8 * Math.cos(a - 0.4), y1 - 8 * Math.sin(a - 0.4)); c.lineTo(x1 - 8 * Math.cos(a + 0.4), y1 - 8 * Math.sin(a + 0.4)); c.closePath(); c.fill(); c.restore();
    },
    label: function (c, t, x, y, color, size, align) {
      c.save(); c.font = (size || 12) + "px system-ui, -apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif"; c.fillStyle = color || "#eeebff"; c.textAlign = align || "left";
      c.shadowColor = "#000"; c.shadowBlur = 3; c.fillText(t, x, y); c.restore();
    },
    earth: function (c, x, y, r) {
      var g = c.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
      g.addColorStop(0, "#5b8def"); g.addColorStop(0.7, "#2c4fa8"); g.addColorStop(1, "#16285e");
      c.save(); c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
      c.strokeStyle = "rgba(167,139,250,.55)"; c.lineWidth = Math.max(2, r * 0.03); c.beginPath(); c.arc(x, y, r + c.lineWidth, 0, 7); c.stroke(); c.restore();
    }
  };

  /* ---------- 性能三档(§5.3.1):高 = 全效 / 中 = 粒子减半、无景深 / 低 = 回落 Canvas 2D,功能不减 ----------
     自动检测 + 设置里手动切换(gn:nv:_pref.perf = auto|high|mid|low);像素比 桌面 ≤2、手机 ≤1.5 */
  var PERF = (function () {
    var nav = W.navigator || {}, mq = function (m) { return !!(W.matchMedia && W.matchMedia(m).matches); };
    var mobile = mq("(pointer: coarse)") || Math.min(W.screen ? W.screen.width : 9999, W.innerWidth || 9999) < 760;
    function pref() { var v = Store.pref().perf; return v === "high" || v === "mid" || v === "low" ? v : "auto"; }
    function auto() {
      var mem = nav.deviceMemory, cpu = nav.hardwareConcurrency;
      if ((mem && mem <= 2) || (cpu && cpu <= 2)) return "low";
      if (mobile || (mem && mem <= 4) || (cpu && cpu <= 4)) return "mid";
      return "high";
    }
    return {
      get pref() { return pref(); },
      get tier() { if (GL3D && !GL3D.ok) return "low"; var p = pref(), a = auto(); return p === "auto" ? (a === "low" ? "mid" : a) : (p === "low" ? "mid" : p); },
      get mobile() { return mobile; },
      get prCap() { return mobile ? 1.5 : 2; },
      set: function (v) { Store.setPref("perf", v); }
    };
  })();

  /* ---------- 3D 能力检测与按需加载(Three.js r169 本地内置,失败自动回 2D) ---------- */
  var GL3D = (function () {
    var cache = null, pending = null, why = "";
    function q(k) { try { return new URLSearchParams(location.search).get(k); } catch (e) { return null; } }
    function check() {
      if (cache !== null) return cache;
      var force = q("gl3d") || lsGet("gn:nv:_gl3d");
      if (force === "0") { why = "已手动关闭 3D"; return (cache = false); }
      if (PERF.pref === "low" && force !== "1") { why = "画质设为「低」"; return (cache = false); }
      if (RM) { why = "减少动态效果"; return (cache = false); }
      var nav = W.navigator || {}, mem = nav.deviceMemory, cpu = nav.hardwareConcurrency;
      if (force !== "1" && PERF.pref === "auto" && ((mem && mem <= 2) || (cpu && cpu <= 2))) { why = "低端设备"; return (cache = false); }
      var ok = false;
      try {
        var t = D.createElement("canvas"), g = t.getContext("webgl2") || t.getContext("webgl");
        ok = !!g;
        if (g) { var ext = g.getExtension("WEBGL_lose_context"); if (ext) ext.loseContext(); }
      } catch (e) { ok = false; }
      if (!ok) why = "WebGL 不可用";
      return (cache = ok);
    }
    return {
      get ok() { return check(); },
      get reason() { check(); return why; },
      /* 仅在需要时动态 import;任何失败都返回 rejected Promise,由调用方回落 2D */
      load: function () {
        if (!check()) return Promise.reject(new Error("gl3d unavailable: " + why));
        if (!pending) pending = import(ROOT + "vendor/three.module.min.js").then(function (THREE) {
          if (W.__nvGl3dFail) throw new Error("gl3d forced failure");      // 自测钩子:模拟加载后失败
          if (!THREE || !THREE.WebGLRenderer) throw new Error("three missing");
          return THREE;
        });
        return pending;
      },
      disable: function (r) { cache = false; why = r || "已回退 2D"; }
    };
  })();

  /* 世界内跳转标记(页面禁用 referrer,改用会话标记):点本世界内链接时记一笔,首页据此不重复播开场 */
  try {
    D.addEventListener("click", function (e) {
      var a = e.target && e.target.closest && e.target.closest("a[href]"); if (!a) return;
      try { var u = new URL(a.href, location.href); if (u.origin === location.origin && u.href.indexOf(ROOT) === 0) W.sessionStorage.setItem("gn:nv:_inner", "1"); } catch (err) {}
    }, true);
  } catch (e) {}

  var NV = { Phys: Phys, gl3d: GL3D, perf: PERF, RM: RM, ROOT: ROOT, store: Store, lsGet: lsGet, lsSet: lsSet, jGet: jGet, el: el, fit: fit, fmt: fmt, esc: esc, starsTxt: starsTxt,
    snd: SND, ai: AI, settings: settings, header: header, avatar: avatar, drawGuide: drawGuide, GUIDES: GUIDES, modal: modal, closeModal: closeModal, task: task, Draw: Draw, ICON: ICON };
  G.NV = NV;
})(typeof window !== "undefined" ? window : this);
