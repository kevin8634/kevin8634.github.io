/* 元素工坊 Element Forge · 离线缓存 sw.js v2.0 —— 作用域只限 /element-forge/,不碰根站点与其他世界。
   页面:先网络后缓存(保证上线即更新);脚本、样式、音频、图片:先缓存后网络。 */
const V = 'ef-v2.0';
const CORE = ['./', 'index.html', 'ef.css?v=14', 'ef-hud.css?v=2', 'ef.js?v=15', 'ef-gl.js?v=2', 'ef-home.js?v=4', 'ef-mission3d.js?v=12', 'ef-guide3d.js?v=1', 'ef-stars3d.js?v=1', 'ef-carbon3d.js?v=2', 'ef-crystal3d.js?v=2', 'ef-tri.js?v=1', 'ef-cabbage3d.js?v=2', 'ef-fire3d.js?v=1', 'ef-volt3d.js?v=1', 'ef-rock3d.js?v=1', 'ef-mars3d.js?v=1', 'ef-titan3d.js?v=1', 'ef-spectra3d.js?v=1', 'vendor/three.module.min.js', 'stars/', 'carbon/', 'crystal/', 'cabbage/', 'fireworks/', 'battery/', 'rocks/', 'mars/', 'titan/', 'spectra/', 'spectra/index.html', 'ef-island3d.js?v=1', 'island/', 'island/index.html', 'island/labs/ef.lab.island_chain.json', 'island/labs/ef.lab.island_shell.json', 'island/labs/ef.lab.island_edge.json', 'data/ef.island.chart.json', 'data/ef.island.sn.json', 'data/ef.island.shell.json', 'data/ef.island.edge.json'];
/* v2.0:Lab Kit 在 /core/deep/(总指挥维护),先网络后缓存,离线时回落;r169 回落版按需缓存 */
const LAB = ['../core/deep/lab.js', '../core/deep/core.js', '../core/deep/lab.css', '../core/deep/deep.css'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(CORE).then(() => c.addAll(LAB).catch(() => {}))).catch(() => {})); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('ef-') && k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  if (u.pathname.includes('/core/deep/')) { e.respondWith(fetch(e.request).then(r => { if (r.ok) { const c = r.clone(); caches.open(V).then(x => x.put(e.request, c)); } return r; }).catch(() => caches.match(e.request, { ignoreSearch: true }))); return; }
  if (!u.pathname.includes('/element-forge/')) return;
  const page = e.request.mode === 'navigate' || u.pathname.endsWith('/') || u.pathname.endsWith('.html');
  if (page) {
    e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(V).then(x => x.put(e.request, c)); return r; }).catch(() => caches.match(e.request, { ignoreSearch: true })));
  } else {
    e.respondWith(caches.match(e.request).then(h => h || fetch(e.request).then(r => { if (r.ok) { const c = r.clone(); caches.open(V).then(x => x.put(e.request, c)); } return r; })));
  }
});
