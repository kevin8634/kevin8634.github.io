/* 天枢 Starhelm 2.0 · C2.7b 真实载入进度登记表(SHXLD;SHXP 已被侧舷窗 sh-x-port.js 占用)
 * 王磊 10-29 11:43:「进场登录的画面 2 个载入进度要真实,不要进去以后还是模型没加载好、声音没加载好」。
 * - 每个资源一条记录:grp 'vis'(模型 · 贴图)/ 'snd'(声音);gate=true 的才挡住登舰门。
 * - 字节进度:fetch 流式读取,按 content-length 计;取不到大小的按 est(预估字节)计权。
 * - 下载完不等于可用:图片要等 <img> onload(已解码、已交给贴图)、星空要等贴图 ready、音频要等 canplaythrough,
 *   才记为 ok。下载完但还没就绪时,该项最多算 97%,所以两条进度到 100% 时资源一定能用。
 * - 需要用户手势才能启用的(AudioContext、未解码的音频)记为 'tap':字节已算满,状态写「待点击启用」,在进入那一下里 resume / decode。
 * - 失败自动重试一次;仍失败记为 'fail'(由登舰门显示「部分资源未载入,继续」)。
 */
(function () {
  'use strict';
  var I = {}, L = [], subs = [];
  function emit() { subs.forEach(function (f) { try { f(); } catch (e) { } }); }
  function add(id, o) {
    var it = I[id];
    if (!it) { it = I[id] = { id: id, grp: o.grp || 'vis', label: o.label || id, est: o.est || 2e5, gate: o.gate !== false, got: 0, tot: 0, st: 'wait', tries: 0, t0: performance.now() }; L.push(it); }
    else { if (o.gate) it.gate = true; if (o.label) it.label = o.label; }
    emit(); return it;
  }
  function set(id, st) { var it = I[id]; if (!it || it.st === 'ok') return; if (it.st === 'fail' && st !== 'ok') return; it.st = st; if (st === 'ok' || st === 'tap') { if (!it.tot) it.tot = it.got || it.est; it.got = it.tot; } emit(); }
  function once(url, it) {
    return fetch(url, { cache: 'default' }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      var n = +r.headers.get('content-length') || 0; if (n) it.tot = n;
      if (!r.body || !r.body.getReader) return r.blob().then(function (b) { it.got = it.tot = it.tot || b.size; emit(); return b; });
      var rd = r.body.getReader(), parts = [], got = 0;
      return (function pump() {
        return rd.read().then(function (x) {
          if (x.done) { it.got = got; if (!it.tot || it.tot < got) it.tot = got; emit(); return new Blob(parts, { type: r.headers.get('content-type') || '' }); }
          parts.push(x.value); got += x.value.length; it.got = got; emit(); return pump();
        });
      })();
    });
  }
  // 带进度的下载,失败重试一次;返回 Blob。下载完状态为 'dl'(未就绪)
  function pull(id, url, o) {
    var it = add(id, o || {}); if (it.p) return it.p;
    it.st = 'load'; it.url = url;
    it.p = once(url, it).catch(function () { it.tries = 1; it.got = 0; emit(); return once(url, it); })
      .then(function (b) { if (it.st !== 'ok') it.st = 'dl'; emit(); return b; }, function (e) { it.st = 'fail'; it.err = String(e && e.message || e); emit(); throw e; });
    return it.p;
  }
  // 贴图图片:同源相对路径走 fetch(有字节进度)→ blob URL → <img>;data:/blob: 直接设 src。onload 后才算 ok
  function img(im, src, o) {
    o = o || {}; var id = o.id || ('img:' + src.slice(0, 80)), it = add(id, o);
    im.addEventListener('load', function () { set(id, 'ok'); });
    if (/^(data|blob):/.test(src) || !window.fetch || !window.URL || !URL.createObjectURL) { it.st = 'load'; im.src = src; return; }
    pull(id, src, o).then(function (b) { im.src = URL.createObjectURL(b); }, function () { set(id, 'fail'); im.src = src; });
  }
  function prog(grp) {
    var a = 0, b = 0, n = 0, ok = 0, fail = 0, tap = 0, pend = [];
    L.forEach(function (it) {
      if (it.grp !== grp || !it.gate) return; n++;
      var tot = it.tot || it.est, got = Math.min(it.got, tot);
      if (it.st === 'ok' || it.st === 'tap') { got = tot; ok += it.st === 'ok'; tap += it.st === 'tap'; }
      else if (it.st === 'fail') { fail++; got = 0; }
      else { got = Math.min(got, tot * .97); pend.push(it); }
      a += got; b += tot;
    });
    return { f: b ? a / b : (n ? 0 : 1), n: n, ok: ok, tap: tap, fail: fail, pend: pend, bytes: a, total: b };
  }
  window.SHXLD = { add: add, set: set, pull: pull, img: img, prog: prog, get: function (id) { return I[id]; }, list: function () { return L.slice(); }, on: function (f) { subs.push(f); },
    // 与 sh-fx3d.js pickSky 同一规则(那里不改):桌面且显卡支持 8K → 8K,否则 4K
    skyUrl: function (rd) { var max = rd && rd.capabilities ? rd.capabilities.maxTextureSize : 4096, small = Math.min(screen.width, screen.height) < 700 || (navigator.deviceMemory && navigator.deviceMemory < 4); return (!small && max >= 8192) ? 'sky-8k.jpg' : 'sky-4k.jpg'; } };
})();
