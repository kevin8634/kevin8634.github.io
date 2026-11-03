/* 元素工坊 v2.3 · 自由实验模式(实验室大厅内)
   规则:只用 data/ef.react.json 已收录条目;试剂与条件同时完全匹配才出结果;未收录一律「暂无可靠记录」,不推断、不生成。
   🔴 条目:只示现象与原理(方程式),不显示条件细节、用量、步骤;条件不符时不提示正确条件;不播放强特效(同 v2.1 反应台)。
   🟢🟡 条件不符时提示正确条件(王磊 2026-11-03 13:34 批复)。
   记录本 gn:ef:lab 新增 kind:'free';深链 ?lab=react_free&preset=<条目 id|none>(别名 free),上线后不改。 */
(function () {
var EF = window.EF;
var ROOT = document.getElementById('free'); if (!ROOT) return;
var SAFE = { g: '● 家中可安全观察(须家长知情)', y: '● 只在学校实验室、由老师指导', r: '● 只限专业实验室 · 本站仅虚拟演示' };
var EVI = [['c', '颜色变了'], ['g', '冒出气体'], ['p', '生成沉淀'], ['h', '放热或吸热'], ['n', '看不出变化']];
var CATS = ['单质', '氧化物', '酸', '碱', '盐', '有机物'];
var SUB = { '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉' };
function fm(f) { return f.replace(/\.(\d*)/, function (_, n) { return '·' + n; }).replace(/([A-Za-z\)\]])(\d+)/g, function (_, a, n) { return a + n.replace(/\d/g, function (d) { return SUB[d]; }); }); }
function side(sp) { return sp.map(function (x) { return (x[0] > 1 ? x[0] : '') + fm(x[1]) + (x[2] === 'up' || x[3] === 'up' ? '↑' : x[2] === 'down' || x[3] === 'down' ? '↓' : ''); }).join(' + '); }
function eq(r) { return side(r.l) + (r.rev ? ' ⇌ ' : ' → ') + side(r.r); }
var SUBM = { '₀': 0, '₁': 1, '₂': 2, '₃': 3, '₄': 4, '₅': 5, '₆': 6, '₇': 7, '₈': 8, '₉': 9 };
function subH(t) { return t.replace(/[₀-₉]+/g, function (m) { return '<sub>' + m.split('').map(function (c) { return SUBM[c]; }).join('') + '</sub>'; }); }
var esc = EF.esc;

var D = null, F = null, BYID = {}, BOT = {}, KEYS = {}, BYSET = {};
var st = { cat: '盐', sel: [], cond: [], guess: null, last: null }, view = null, flat = false;
var $ = function (id) { return document.getElementById(id); };

function build() {
  ROOT.innerHTML = '<div class="fx-stage" id="fxStage"><div class="fx-ui">' +
    '<div class="fx-bar"><b>自由实验台</b><small>只用已收录的 60 条反应 + 1 条对照 · 未收录不编造</small><button class="fx-clr" id="fxSafe">安全须知</button><button class="fx-x" id="fxX" aria-label="收起自由实验台">×</button></div>' +
    '<div class="fx-conds" id="fxConds" role="group" aria-label="反应条件"></div>' +
    '<div class="fx-tabs" id="fxTabs" role="tablist" aria-label="试剂分类"></div>' +
    '<div class="fx-list" id="fxList" aria-label="试剂架"></div>' +
    '<div class="fx-sock" id="fxSock" aria-hidden="true"></div>' +
    '<div class="fx-note">试剂架:只放收录反应里出现的物质<small>点选 1–3 种 → 放上星盘插座;再点插座上的瓶子可取下 · <span style="color:#ff8a7a">红标「专业」= 只限专业实验室</span></small></div>' +
    '<div class="fx-guide"><div class="fx-say" id="fxSay" aria-live="polite"></div><canvas id="fxAv" width="160" height="160" aria-hidden="true"></canvas></div>' +
    '<div class="fx-panel"><div class="fx-cards" id="fxCards" aria-live="polite"></div><button class="fx-save" id="fxSave" disabled>存入记录本 gn:ef:lab · 生成深链</button><span class="fx-link" id="fxLink"></span></div>' +
    '<div class="fx-cap"><b id="fxPick">从试剂架挑物质</b><small id="fxCond">条件:常温</small><button class="fx-go" id="fxGo" disabled>开始反应</button><button class="fx-clr" id="fxClr">清空</button></div>' +
    '</div><div class="fx-warn" id="fxWarn" hidden><div><b>开始之前</b><br>这里的实验只在虚拟中发生。试剂架上的物质只用于对照课本里收录的反应,<b>不代表可以买到或在家里做</b>;其中不少是国家管控的危险化学品,标「专业」红标的只限专业实验室。<br><b>不要在现实中把任何东西混合、加热或点燃来验证</b>,包括家里的清洁剂。没有收录的组合,本站不会猜测结果——「暂无可靠记录」不等于不反应,也不等于安全。<br><button class="ef-btn" id="fxOk" style="margin-top:10px">知道了</button></div></div></div>';
  $('fxX').onclick = close;
  $('fxConds').innerHTML = '<button class="fx-c" data-c="" aria-pressed="true"><i></i>常温</button>' + F.conds.map(function (c) { return '<button class="fx-c" data-c="' + c.id + '" aria-pressed="false"><i></i>' + c.n + '</button>'; }).join('');
  Array.prototype.forEach.call($('fxConds').children, function (b) { b.onclick = function () { toggleCond(b.dataset.c); }; });
  $('fxTabs').innerHTML = CATS.map(function (c) { return '<button role="tab" data-c="' + c + '" aria-selected="' + (c === st.cat) + '">' + c + '</button>'; }).join('');
  Array.prototype.forEach.call($('fxTabs').children, function (b) { b.onclick = function () { st.cat = b.dataset.c; drawShelf(); }; });
  $('fxGo').onclick = go; $('fxClr').onclick = function () { st.sel = []; st.cond = []; st.guess = null; sync(); if (view) view.clear(); say('先从试剂架挑一样东西吧。'); };
  $('fxSave').onclick = save;
  $('fxOk').onclick = function () { $('fxWarn').hidden = true; };
  $('fxSafe').onclick = function () { $('fxWarn').hidden = false; };
  var av = $('fxAv'), talk = 0; (function loop(t) { if (!ROOT.hidden) { talk *= 0.93; EF.drawGuide(av, 'mof', t, talk); } requestAnimationFrame(loop); })(0);
  window.__fxTalk = function () { talk = 1; };
}
function say(s, guess) {
  var h = '<span>莫芙:' + esc(s) + '</span>';
  if (guess) h += '<div class="fx-guess" role="group" aria-label="先猜一猜">' + EVI.map(function (e) { return '<button data-e="' + e[0] + '" aria-pressed="' + (st.guess === e[0]) + '">' + e[1] + '</button>'; }).join('') + '</div>';
  $('fxSay').innerHTML = h; if (window.__fxTalk) window.__fxTalk();
  Array.prototype.forEach.call($('fxSay').querySelectorAll('.fx-guess button'), function (b) { b.onclick = function () { st.guess = st.guess === b.dataset.e ? null : b.dataset.e; say(s, true); }; });
}
function toggleCond(c) {
  if (!c) st.cond = []; else { var i = st.cond.indexOf(c); if (i >= 0) st.cond.splice(i, 1); else st.cond.push(c); }
  sync();
}
function drawShelf() {
  var list = F.bottles.filter(function (b) { return b.cat === st.cat; });
  Array.prototype.forEach.call($('fxTabs').children, function (b) { b.setAttribute('aria-selected', b.dataset.c === st.cat); });
  $('fxList').innerHTML = list.map(function (b) { return '<button class="fx-b' + (b.safe === 'r' ? ' r' : '') + '" data-id="' + b.id + '" style="--c:' + b.c + '" aria-pressed="' + st.sel.some(function (x) { return x.id === b.id; }) + '" title="' + esc(b.n) + '"><span>' + esc(b.n) + '</span><span class="sr">' + (b.safe === 'r' ? '(只限专业实验室)' : '') + '</span></button>'; }).join('');
  Array.prototype.forEach.call($('fxList').children, function (b) { b.onclick = function () { pick(BOT[b.dataset.id]); }; });
  if (view) view.setShelf(list);
}
function pick(b) {
  var i = st.sel.findIndex(function (x) { return x.id === b.id; });
  if (i >= 0) st.sel.splice(i, 1); else { if (st.sel.length >= 3) { EF.toast('星盘最多放 3 种物质'); return; } st.sel.push(b); }
  st.guess = null; sync();
  if (st.sel.length) say(st.sel.length === 1 ? '还要再加一样吗?也可以只放一样,配合加热、通电试试。先猜一猜,会看到什么?' : '先猜一猜,会看到什么?', true);
}
function sync() {
  $('fxPick').textContent = st.sel.length ? st.sel.map(function (b) { return b.n; }).join(' + ') : '从试剂架挑物质';
  $('fxCond').textContent = '条件:' + condText(st.cond);
  Array.prototype.forEach.call($('fxConds').children, function (b) { var c = b.dataset.c; b.setAttribute('aria-pressed', c ? st.cond.indexOf(c) >= 0 : !st.cond.length); });
  $('fxGo').disabled = !st.sel.length;
  Array.prototype.forEach.call($('fxList').children, function (b) { b.setAttribute('aria-pressed', st.sel.some(function (x) { return x.id === b.dataset.id; })); });
  if (view) view.setSlots(st.sel);
  if (flat) $('fxSock').innerHTML = (st.sel[0] ? sock(st.sel[0]) : '<span>插座</span>') + '<div class="tb" id="fxTb"></div>' + (st.sel[1] ? sock(st.sel[1]) : '<span>插座</span>') + (st.sel[2] ? sock(st.sel[2]) : '');
}
function sock(b) { return '<span><i style="--c:' + b.c + '"></i>' + subH(esc(b.f)) + '</span>'; }
function condText(c) { var k = c.slice().sort().join(' '); return F.ctext[k] || c.map(function (x) { return (F.conds.filter(function (y) { return y.id === x; })[0] || {}).n; }).join(' + ') || '常温'; }
function keyOf(sel, cond) { return sel.map(function (b) { return b.id; }).sort().join('+') + '|' + cond.slice().sort().join('+'); }

function lookup() {
  var k = keyOf(st.sel, st.cond), id = KEYS[k];
  if (id) return { row: BYID[id] };
  var setK = k.split('|')[0], near = (BYSET[setK] || []).map(function (x) { return { row: BYID[x.id], cond: x.c }; });
  return near.length ? { near: near } : {};
}
function go() {
  var res = lookup(), html, r = res.row;
  Array.prototype.forEach.call($('fxCards').querySelectorAll('.fx-card'), function (c, i) { c.classList.add('old'); if (i > 0) c.remove(); });
  if (r) {
    var quiet = r.safe === 'r' || EF.campus;
    if (view) view.run(r, { quiet: quiet });
    if (flat) { var tb = $('fxTb'); if (tb) tb.style.setProperty('--lq', (r.viz && (r.viz.c1 || r.viz.c0)) || '#cfe6f2'); }
    var ob = r.obs || {}, has = { c: !!(ob.c || (r.viz && r.viz.c1 && r.viz.c1 !== r.viz.c0)), g: !!ob.g, p: !!ob.p && !/消失|溶解/.test(ob.p), h: !!ob.h };
    var none = !has.c && !has.g && !has.p && !has.h, ok = st.guess ? (st.guess === 'n' ? none : has[st.guess]) : null;
    st.last = { rid: r.id, ok: ok };
    html = cardRow(r).replace(/<\/div>$/, (ok === null ? '' : '<br><small class="sf ' + (ok ? 'g' : 'r') + '">' + (ok ? '✓ 你猜的证据出现了' : '✗ 没猜中,再看看现象') + '</small>') + '</div>');
    say(r.id.charAt(0) === 'x' ? '有现象,但没有新物质生成——这是物理变化。' : ok ? '猜中了!现象就是证据。' : ok === false ? '没猜中也没关系,看看现象里写的证据。' : '看,这就是收录过的现象。');
  } else if (res.near) {
    if (view) view.clear(); st.last = { rid: null, ok: null, near: 1 };
    var safe = res.near.every(function (n) { return n.row.safe !== 'r'; }) && !anyRed();
    html = '<div class="fx-card"><b>你选的条件:暂无可靠记录</b><span class="sf n">● 暂无可靠记录 ≠ 不反应 ≠ 安全</span><small>这组物质在收录的课本反应里出现过,但你选的条件不在记录里。本站不推测这个条件下会发生什么,请勿在现实中尝试。</small>' +
      (safe ? '<br><small>课本收录的是:' + res.near.map(function (n) { return esc(F.ctext[n.cond.split('+').join(' ')] || n.cond); }).join(' / ') + '(仅供对照课本)</small>' : '<br><small>涉及只限专业实验室的物质,本站不提示条件。</small>') + '</div>';
    say('这个条件我没有可靠记录,不乱猜。', false);
  } else {
    if (view) view.clear(); st.last = { rid: null, ok: null };
    html = '<div class="fx-card"><b>暂无可靠记录</b><span class="sf n">● 未收录 ≠ 不反应,也 ≠ 安全</span><small>这个组合不在本站收录的课本反应里,本站不会猜测结果。请勿在现实中尝试。</small></div>';
    say('这个组合我也没有可靠记录,不乱猜。换一组试试?', false);
  }
  $('fxCards').insertAdjacentHTML('afterbegin', html);
  $('fxSave').disabled = false; $('fxLink').textContent = '';
}
function anyRed() { return st.sel.some(function (b) { return b.safe === 'r'; }); }
function cardRow(r) {
  if (r.id.charAt(0) === 'x') return '<div class="fx-card"><b>' + esc(r.name) + '</b><span class="sf y">' + SAFE[r.safe] + ' · 对照:物理变化</span>' + esc(r.see) + '<br><small>放热不一定是化学变化,关键看有没有新物质。' + esc(r.why) + '</small></div>';
  var red = r.safe === 'r', redB = !red && anyRed();
  return '<div class="fx-card"><b>' + r.id + ' ' + esc(r.name) + '</b><span class="sf ' + r.safe + '">' + SAFE[r.safe] + '</span>' +
    '<div class="eq">' + subH(eq(r)) + '</div>' + (r.cond && !red && !redB ? '<small>条件:' + esc(r.cond) + '</small><br>' : '') +
    '现象:' + esc(r.see) + (r.note ? '<br><small>注:' + esc(r.note) + '</small>' : '') + (redB ? '<br><small class="sf r">● 其中有只限专业实验室的试剂</small>' : '') + '<br><small>' + (red ? '只示现象与原理,不提供步骤、用量与获取渠道。' : '') + esc(r.why) + (r.ch ? ' · ' + esc(r.ch) : '') + '</small></div>';
}
function save() {
  var L = st.last; if (!L) return;
  var preset = L.rid || 'none';
  window.EFLab.add({ t: new Date().toISOString(), id: 'ef.lab.react_free', kind: 'free', preset: preset, sel: st.sel.map(function (b) { return b.id; }), cond: st.cond.slice(), guess: st.guess, correct: L.ok, rid: L.rid, near: !!L.near });
  var u = location.origin + location.pathname + '?lab=react_free&preset=' + preset;
  $('fxLink').textContent = '?lab=react_free&preset=' + preset;
  try { if (navigator.clipboard) navigator.clipboard.writeText(u).catch(function () {}); EF.toast('已存入记录本,深链已复制'); } catch (e) { EF.toast('已存入记录本'); }
  $('fxSave').disabled = true;
}

function load() {
  if (D) return Promise.resolve();
  return Promise.all([fetch('../data/ef.react.json').then(function (r) { return r.json(); }), fetch('../data/ef.react.free.json?v=1').then(function (r) { return r.json(); })]).then(function (a) {
    D = a[0]; F = a[1]; D.rows.concat(D.contrast).forEach(function (r) { BYID[r.id] = r; }); F.bottles.forEach(function (b) { BOT[b.id] = b; });
    F.keys.forEach(function (x) { KEYS[x.k] = x.id; var p = x.k.split('|'); (BYSET[p[0]] = BYSET[p[0]] || []).push({ id: x.id, c: p[1] }); });
  });
}
var built = false;
function open(o) {
  o = o || {};
  return load().then(function () {
    if (!built) { built = true; build(); }
    var wasHidden = ROOT.hidden; ROOT.hidden = false; if (wasHidden) $('fxWarn').hidden = false;   /* 每次进入弹一次安全须知,栏上可重看 */
    if (o.preset !== undefined) applyPreset(o.preset); else if (o.entry) { st.sel = (o.entry.sel || []).map(function (i) { return BOT[i]; }).filter(Boolean); st.cond = (o.entry.cond || []).slice(); }
    if (st.sel.length) st.cat = st.sel[0].cat;
    var mount = EF.glTier !== 'low' && innerWidth > 900 && !view ? import('../ef-free3d.js?v=1').then(function (m) { return m.mountFree($('fxStage')); }).then(function (v) { view = v; document.body.classList.add('fx3d');
      v.onPick(function (b) { pick(b); }); v.onSlot(function (i) { if (st.sel[i]) pick(st.sel[i]); }); }).catch(function (e) { console.warn('[ef] 自由实验台 3D 启动失败,改用平面版', e); }) : Promise.resolve();
    return mount.then(function () { flat = !view; ROOT.classList.toggle('fx-flat', flat); drawShelf(); sync();
      if (st.sel.length && (o.preset !== undefined || o.entry)) go(); else say('先从试剂架挑一样东西吧。');
      ROOT.scrollIntoView({ behavior: EF.reduced ? 'auto' : 'smooth', block: 'start' }); });
  }).catch(function (e) { console.warn('[ef] 自由实验台加载失败', e); ROOT.hidden = false; ROOT.innerHTML = '<p class="empty">自由实验台暂时没加载出来(需要联网打开一次)。</p>'; });
}
function applyPreset(p) {
  st.guess = null;
  if (p === 'none') { st.sel = [BOT['Al2O3'], BOT['C12H22O11']]; st.cond = []; return; }
  var k = F.keys.filter(function (x) { return x.id === p; })[0];
  if (!k) { st.sel = []; st.cond = []; return; }          /* 未知 preset:空台面,不报错 */
  var parts = k.k.split('|'); st.sel = parts[0].split('+').map(function (i) { return BOT[i]; }).filter(Boolean); st.cond = parts[1] ? parts[1].split('+') : [];
}
function close() { ROOT.hidden = true; history.replaceState(null, '', location.pathname); }
window.EFFree = { open: open, presets: function () { return load().then(function () { return F.keys.map(function (x) { return x.id; }); }); } };
})();
