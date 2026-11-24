/* 宙律 Nomoverse · 首页 3.0 化胶水(3-8 α8):由 /nomoverse/index.html 动态 import。
 * 只做「外观与组件替换」:结构、任务 id、进度键(gn:nv:*)、星桥、星图数据全部沿用 2.0 首页。
 *   page(ctx)  全页:补 i18n 词条、标题 Shiny Text、「3.0 · 改宇宙」入口(Star Border)
 *   hud(ctx)   3D 舞台:任务抽屉 Animated List、向导 Text Type、星点卡 Spotlight Card、尺度条 Elastic Slider、舞台内 3.0 入口 */
import * as ui from '/shared/3/ui.js';
import { starBorder } from './create-ui.mjs';
import { animatedList, shinyText, textType } from './home-ui.mjs';
import { HOME_EN, tips, tipNext, scaleText, scaleAria, hasCJK } from './home.mjs';
import { STAR_DESC_EN, STAGE_EN, patterns } from './home-stars-en.mjs';

const W = window, D = document;
const lang = () => (W.NV_LANG === 'en' ? 'en' : 'zh');
const T = (s) => (W.NV_T ? W.NV_T(s) : s);
const state = { entries: [], list: null, tt: null, tip: 0, slider: null, spot: null, shiny: [], i18n: false };

/* 英文模式:先加词条,再把已经在页面上、当时还没词条的中文文本/属性「轻触」一次,让 i18n.js 的 MutationObserver 重新翻译 */
function addI18n() {
  if (state.i18n || !W.NV_I18N) return;
  state.i18n = true;
  W.NV_I18N.add(Object.assign({}, HOME_EN, STAR_DESC_EN, STAGE_EN), patterns((x) => W.NV_I18N.T(x)));
  if (lang() === 'en') {
    // 英文页标题只留 Nomoverse(「宙律 」是 data-noi18n 的品牌字,英文下隐藏)
    D.querySelectorAll('.hero h1 > span[data-noi18n]').forEach((x) => { if (x.textContent.trim() === '宙律') x.remove(); });
    retouch(D.body);
  }
}
function retouch(root) {
  if (lang() !== 'en' || !root) return;
  const tw = D.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let n; while ((n = tw.nextNode())) { if (hasCJK(n.nodeValue) && !(n.parentNode && n.parentNode.closest && n.parentNode.closest('[data-noi18n],script,style'))) n.nodeValue = n.nodeValue; }
  root.querySelectorAll('[aria-label],[title],[placeholder]').forEach((el) => {
    if (el.closest('[data-noi18n]')) return;
    ['aria-label', 'title', 'placeholder'].forEach((a) => { const v = el.getAttribute(a); if (v && hasCJK(v)) el.setAttribute(a, v); });
  });
}

function entry(cls) {
  const a = D.createElement('a');
  a.className = 'nv3-entry ' + (cls || ''); a.href = '3/';
  const b = D.createElement('b'), s = D.createElement('span'), i = D.createElement('i');
  b.textContent = '✦ ' + T('3.0 · 改宇宙'); s.textContent = T('宇宙配方台:拧动宇宙的常数,看它能不能走到有行星的那一天。'); i.textContent = T('进入 →');
  [b, s, i].forEach((x) => x.setAttribute('data-noi18n', ''));
  a.setAttribute('data-noi18n', '');
  a.append(b, s, i);
  a.addEventListener('click', () => { const S = W.NV && W.NV.snd; if (S && S.cue) S.cue('entry'); });
  starBorder.mount(a, { color: '#c4b5fd', speed: 5 });
  state.entries.push(a);
  return a;
}
/* 英文 aria:词典键带 @,NV_T 不查 @ 键 → 自己查一次 */
function ariaEntry(a) { a.setAttribute('aria-label', lang() === 'en' ? HOME_EN['@进入宙律 3.0 · 改宇宙(宇宙配方台)'] : '进入宙律 3.0 · 改宇宙(宇宙配方台)'); }

export function page(ctx = {}) {
  addI18n();
  // 标题 Shiny Text
  [D.querySelector('.hero h1 .en'), D.querySelector('.hm-stitle b')].forEach((el) => { if (el && !el.classList.contains('nv-shiny')) state.shiny.push(shinyText.mount(el, { speed: 4.5 })); });
  // 任务区的 3.0 入口:放在规则改写台 / 2.0 玻璃宇宙之前
  const sec = ctx.tasksSec || D.querySelector('.hm-lab') && D.querySelector('.hm-lab').parentNode;
  if (sec && !sec.querySelector('.nv3-entry')) { const a = entry('nv3-entry-sec'); ariaEntry(a); const lab = sec.querySelector('.hm-lab'); sec.insertBefore(a, lab || null); }
  return state;
}

export function hud(ctx = {}) {
  addI18n();
  const { stage, drawer, guide, gtx } = ctx;
  if (!stage) return state;
  // 标题(舞台内)Shiny Text
  const st = stage.querySelector('.hm-stitle b'); if (st && !st.classList.contains('nv-shiny')) state.shiny.push(shinyText.mount(st, { speed: 4.5 }));
  // 左侧探究任务:Animated List + 舞台内 3.0 入口
  if (drawer) {
    const list = drawer.querySelector('.hd-list');
    if (list && !state.list) state.list = animatedList.mount(list, { item: '.hd-card' });
    if (!drawer.querySelector('.nv3-entry')) { const a = entry('nv3-entry-hud'); ariaEntry(a); drawer.appendChild(a); }
  }
  // 右上向导:Text Type(点气泡换下一句)
  if (guide && gtx && !state.tt) {
    const box = D.createElement('p'); box.className = 'hg-tx'; box.setAttribute('data-noi18n', '');
    gtx.replaceWith(box);
    const list = tips(lang());
    state.tt = textType.mount(box, { text: list[0], speed: 36 });
    guide.setAttribute('role', 'button'); guide.tabIndex = 0;
    guide.setAttribute('aria-label', lang() === 'en' ? 'Guide Quark “Aqua”. ' + HOME_EN['@点一下换一句向导提示'] : '向导 夸克「阿夸」。点一下换一句向导提示');
    guide.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); guide.click(); } });
  }
  // 星点详情卡:Spotlight Card
  const card = stage.querySelector('.sm3-card');
  if (card && !state.spot) state.spot = ui.spotlightCard.mount(card, { color: 'var(--gn3-w02)' });
  // 底部尺度条:Elastic Slider 接管原生滑杆(原生 input 保留为数据源,隐藏)
  const nat = stage.querySelector('.sm3-sl');
  if (nat && !state.slider) {
    const box = D.createElement('div'); box.className = 'nv3-scale';
    nat.parentNode.insertBefore(box, nat.nextSibling);
    const near = () => { const r = nat.getAttribute('aria-valuetext') || ''; const m = /,(.+)的尺度$/.exec(r); return m ? T(m[1]) : ''; };
    const fixAria = () => { const tr = box.querySelector('[role=slider]'); if (tr) tr.setAttribute('aria-valuetext', scaleAria(+nat.value, lang(), near())); };
    let busy = false;
    state.slider = ui.slider.mount(box, {
      min: +nat.min, max: +nat.max, step: 0.1, value: +nat.value, label: lang() === 'en' ? HOME_EN['@尺度(10 的幂,米)'] : '尺度(10 的幂,米)', color: 'var(--gn3-w02)',
      format: (v) => scaleText(v),
      onInput: (v) => { busy = true; nat.value = String(v); nat.dispatchEvent(new Event('input', { bubbles: true })); busy = false; fixAria(); },
      onChange: () => nat.dispatchEvent(new Event('change', { bubbles: true }))
    });
    box.setAttribute('data-noi18n', '');
    // 方向键只交给滑块本身,不再冒泡到舞台(舞台的 ← → 飞行会重复走一步)
    box.addEventListener('keydown', (e) => { if (/^Arrow|^Home$|^End$/.test(e.key)) e.stopPropagation(); });
    // 星图自己改尺度(拖画面、滚轮、点星、±)时,syncUI 会改原生滑杆的 aria-valuetext → 同步到弹性滑块
    new MutationObserver(() => { if (!busy) { state.slider.update({ value: +nat.value }); fixAria(); } }).observe(nat, { attributes: true, attributeFilter: ['aria-valuetext'] });
    D.body.classList.add('nv3-elastic');
    fixAria();
  }
  if (lang() === 'en') retouch(stage);
  return state;
}

/* 向导换句(首页的点击处理调用) */
export function nextTip() {
  if (!state.tt) return false;
  const list = tips(lang()); state.tip = tipNext(state.tip, list.length); state.tt.show(list[state.tip]);
  return true;
}
/* 抽屉重画后(进度变化)重新挂列表动画 */
export function drawerChanged() { if (state.list) state.list.refresh(); if (lang() === 'en') state.list && retouch(state.list.el); }
export function info() {
  return { entries: state.entries.length, tip: state.tip, typed: state.tt ? state.tt.shown : null, typing: state.tt ? state.tt.typing : null, slider: state.slider ? state.slider.value : null,
    list: state.list ? state.list.el.querySelectorAll('.nv-al-i.is-in').length : 0, spot: !!state.spot, shiny: state.shiny.length };
}
