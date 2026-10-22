/* 元素工坊 Element Forge · 离线缓存 sw.js v0.5 —— 作用域只限 /element-forge/,不碰根站点与其他世界。
   页面:先网络后缓存(保证上线即更新);脚本、样式、音频、图片:先缓存后网络。 */
const V = 'ef-v0.5';
const CORE = ['./', 'index.html', 'ef.css?v=8', 'ef-hud.css?v=2', 'ef.js?v=8', 'ef-gl.js?v=2', 'ef-home.js?v=4', 'ef-mission3d.js?v=6', 'ef-guide3d.js?v=1', 'ef-stars3d.js?v=1', 'ef-carbon3d.js?v=2', 'ef-crystal3d.js?v=2', 'ef-tri.js?v=1', 'ef-cabbage3d.js?v=1', 'vendor/three.module.min.js', 'stars/', 'carbon/', 'crystal/', 'cabbage/'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(CORE)).catch(() => {})); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('ef-') && k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin || !u.pathname.includes('/element-forge/')) return;
  const page = e.request.mode === 'navigate' || u.pathname.endsWith('/') || u.pathname.endsWith('.html');
  if (page) {
    e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(V).then(x => x.put(e.request, c)); return r; }).catch(() => caches.match(e.request, { ignoreSearch: true })));
  } else {
    e.respondWith(caches.match(e.request).then(h => h || fetch(e.request).then(r => { if (r.ok) { const c = r.clone(); caches.open(V).then(x => x.put(e.request, c)); } return r; })));
  }
});
