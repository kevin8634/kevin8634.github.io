/* 觉弈 · 创世计划 §5.12 门户→世界接力(普通脚本,放在 <head> 最前面同步执行)
   门户跳转前写 sessionStorage gn:portal:arrive = {w,c,t};5 秒内到达则铺同色遮罩,约 600 ms 淡出(减少动态 200 ms)。读后立即删除。 */
(function () {
  var a = null; try { a = JSON.parse(sessionStorage.getItem('gn:portal:arrive') || 'null'); sessionStorage.removeItem('gn:portal:arrive'); } catch (e) {}
  if (!a || !a.t || Date.now() - a.t >= 5000) return;
  var c = /^#[0-9a-f]{3,8}$/i.test(a.c || '') ? a.c : '#f5c26b';
  var ms = (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) ? 200 : 600;
  var st = document.createElement('style');
  st.textContent = 'html::after{content:"";position:fixed;inset:0;z-index:2147483000;pointer-events:none;background:linear-gradient(rgba(4,6,15,.82),rgba(4,6,15,.82)),' + c + ';opacity:1;transition:opacity ' + ms + 'ms ease}html.gn-arrived::after{opacity:0}';
  document.head.appendChild(st);
  var go = function () { requestAnimationFrame(function () { requestAnimationFrame(function () {
    document.documentElement.classList.add('gn-arrived'); setTimeout(function () { st.remove(); document.documentElement.classList.remove('gn-arrived'); }, ms + 100); }); }); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
})();
