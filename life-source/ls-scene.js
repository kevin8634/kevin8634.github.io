// 生命源码 · 共享场景模块(HANDOFF §5.3.1)
// 集中管理:性能三档(高/中/低)、像素比上限、WebGL 检测、页面隐藏暂停、减少动态效果、设置面板与 HUD 进场。
import { store, reducedMotion, sound } from './ls.js';

const isMobile = () => matchMedia('(pointer:coarse)').matches || Math.min(innerWidth, innerHeight) < 640;
let glOK = null;
export function hasWebGL() {
  if (glOK !== null) return glOK;
  try { const c = document.createElement('canvas'); glOK = !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { glOK = false; }
  return glOK;
}
/** 自动档:无 WebGL → 低;手机或 CPU 核数 ≤4 → 中;其余 → 高 */
export function autoTier() {
  if (!hasWebGL()) return 'low';
  const cores = navigator.hardwareConcurrency || 4, mem = navigator.deviceMemory || 8;
  if (isMobile() || cores <= 4 || mem <= 4) return 'mid';
  return 'high';
}
const q = new URLSearchParams(location.search).get('tier');
export const tierPref = () => (['high', 'mid', 'low'].includes(q) ? q : store.get('tier', 'auto'));
export function tier() { const p = tierPref(); return p === 'auto' ? autoTier() : (p !== 'low' && !hasWebGL() ? 'low' : p); }
export function setTier(v) { store.set('tier', v); dispatchEvent(new Event('ls-tier')); }
/** 像素比:桌面 ≤2、手机 ≤1.5;中档再降一级 */
export function pixelRatio() { const cap = isMobile() ? 1.5 : 2; return Math.min(devicePixelRatio || 1, tier() === 'mid' ? Math.min(cap, 1.25) : cap); }
/** 粒子数量系数:高 1、中 0.5 */
export const particleScale = () => (tier() === 'high' ? 1 : .5);
/** 页面隐藏时暂停:返回当前是否应渲染 */
export const visible = () => !document.hidden;
export { reducedMotion };

/* ---------- 设置面板(画质 / 重播开场 / 全屏) ---------- */
const css = `
.ls-top .hud-l{display:flex;align-items:center;gap:8px;min-width:0}
.ls-home{display:inline-flex;align-items:center;gap:4px;color:#eefcf6;text-decoration:none;font-size:13px;border:1px solid rgba(110,231,183,.55);border-radius:999px;padding:5px 11px;background:rgba(6,20,16,.6);white-space:nowrap}
.ls-home:hover{border-color:#6ee7b7;box-shadow:0 0 12px rgba(52,211,153,.4)}
.ls-icn{width:34px;height:34px;padding:0;display:inline-flex;align-items:center;justify-content:center;font-size:15px}
.ls-set{position:fixed;right:12px;top:58px;z-index:40;width:min(280px,calc(100% - 24px));display:none}
.ls-set.on{display:block}
.ls-set h4{margin:0 0 8px;font-size:14px;color:var(--gold)}
.ls-set .seg{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px}
.ls-set .seg button{flex:1;min-width:52px;font-size:13px;padding:6px 8px}
.ls-set .seg button.on{background:linear-gradient(135deg,#10b981,#34d399);color:#03130d;border-color:transparent;font-weight:700}
.ls-set p{margin:0 0 10px;font-size:12px;color:var(--mute);line-height:1.6}
.ls-set .row{display:flex;gap:8px;flex-wrap:wrap}
@keyframes hudT{from{transform:translateY(-110%);opacity:0}}
@keyframes hudL{from{transform:translateX(-120%);opacity:0}}
@keyframes hudR{from{transform:translateX(120%);opacity:0}}
@keyframes hudB{from{transform:translateY(140%);opacity:0}}
body.hud-in .ls-top{animation:hudT .7s cubic-bezier(.2,.8,.2,1) both}
body.hud-in .hud-left{animation:hudL .8s .1s cubic-bezier(.2,.8,.2,1) both}
body.hud-in .hud-right{animation:hudR .8s .18s cubic-bezier(.2,.8,.2,1) both}
body.hud-in .hud-bottom{animation:hudB .8s .26s cubic-bezier(.2,.8,.2,1) both}
@media (prefers-reduced-motion:reduce){body.hud-in *{animation:none!important}}
@media (max-width:520px){.ls-home .t{display:none}.ls-top{gap:6px;padding:0 8px}.ls-top .brand{white-space:nowrap;font-size:13px}}
@media (pointer:coarse){.ls-fs{display:none!important}}
`;
let cssOn = false;
const addCss = () => { if (cssOn) return; cssOn = true; const s = document.createElement('style'); s.textContent = css; document.head.append(s); };

/** 在顶栏挂:左「返回创世」;右「全屏」「设置」 */
export function mountHud(top, { onReplay } = {}) {
  addCss();
  const home = document.createElement('a'); home.className = 'ls-home'; home.href = '/'; home.title = '返回创世计划总门户';
  home.innerHTML = '← <span class="t">返回</span>创世';
  const l = document.createElement('div'); l.className = 'hud-l'; top.prepend(l); l.append(home);
  const brand = top.querySelector('.brand'); if (brand) l.append(brand);
  const snd = top.querySelector('#ls-snd'); if (snd) snd.classList.add('ls-icn');
  const fs = document.createElement('button'); fs.className = 'ls-btn ls-icn ls-fs'; fs.textContent = '⛶'; fs.title = '全屏'; fs.setAttribute('aria-label', '全屏');
  fs.onclick = () => { const d = document; if (d.fullscreenElement) d.exitFullscreen?.(); else d.documentElement.requestFullscreen?.().catch(() => {}); };
  if (!document.documentElement.requestFullscreen) fs.style.display = 'none';
  const gear = document.createElement('button'); gear.className = 'ls-btn ls-icn'; gear.textContent = '⚙'; gear.title = '设置'; gear.setAttribute('aria-label', '设置');
  top.append(fs, gear);
  const pan = document.createElement('div'); pan.className = 'ls-panel ls-set'; pan.setAttribute('role', 'dialog'); pan.setAttribute('aria-label', '设置');
  pan.innerHTML = `<h4>画质</h4><div class="seg"></div><p class="now"></p><div class="row"></div>`;
  const seg = pan.querySelector('.seg');
  const opts = [['auto', '自动'], ['high', '高'], ['mid', '中'], ['low', '低']];
  const paint = () => {
    seg.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.v === tierPref()));
    const t = tier(); pan.querySelector('.now').textContent = `当前:${{ high: '高 · 全效粒子', mid: '中 · 粒子减半', low: '低 · 平面画面,功能不变' }[t]}${hasWebGL() ? '' : '(本设备不支持 WebGL)'}${reducedMotion() ? ' · 已跟随系统「减少动态效果」' : ''}`;
  };
  opts.forEach(([v, n]) => { const b = document.createElement('button'); b.className = 'ls-btn'; b.dataset.v = v; b.textContent = n; b.onclick = () => { setTier(v); paint(); sound.tone?.(660, .2, { gain: .06 }); }; seg.append(b); });
  const row = pan.querySelector('.row');
  if (onReplay) { const r = document.createElement('button'); r.className = 'ls-btn primary'; r.textContent = '↺ 重播开场'; r.onclick = () => { pan.classList.remove('on'); onReplay(); }; row.append(r); }
  const x = document.createElement('button'); x.className = 'ls-btn'; x.textContent = '关闭'; x.onclick = () => pan.classList.remove('on'); row.append(x);
  document.body.append(pan);
  gear.onclick = () => { paint(); pan.classList.toggle('on'); };
  addEventListener('keydown', e => { if (e.key === 'Escape') pan.classList.remove('on'); });
  return { home, gear, panel: pan };
}
/** HUD 从四角滑入 */
export function hudIn() { document.body.classList.remove('hud-in'); void document.body.offsetWidth; document.body.classList.add('hud-in'); }
