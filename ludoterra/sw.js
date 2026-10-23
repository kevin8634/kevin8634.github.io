/* 觉弈 Ludoterra · Service Worker(作用域仅 /ludoterra/)
 * 只缓存本世界自己的文件,断网时可继续玩已打开过的内容。
 * 页面:先走网络,失败用缓存;脚本/样式:先用缓存,后台更新。不碰根目录、门户或其他世界的缓存。 */
const VER = 'lt-v0.30';
const BASE = '/ludoterra/';
const CORE = ['', 'lt.css', 'lt.js', 'lt-data.js', 'lt-disc-gl.js', 'lt-intro.js', 'lt-lotus.js', 'lt-age.js', 'lt-stage.js', 'gn-arrive.js', 'vendor/three.module.min.js', 'compound/', 'prisoner/', 'sunk/', 'cocoon/', 'survivor/', 'nature/', 'sleep/', 'wave/', 'echo/', 'meaning/'].map(p => BASE + p);
self.addEventListener('install', e => { e.waitUntil(caches.open(VER).then(c => c.addAll(CORE)).catch(() => {}).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil((async () => { const keys = await caches.keys();
  await Promise.all(keys.filter(k => k.startsWith('lt-') && k !== VER).map(k => caches.delete(k))); await self.clients.claim(); })()); });
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url); if (url.origin !== location.origin || !url.pathname.startsWith(BASE)) return;
  if (url.pathname.startsWith(BASE + 'music/')) return; /* 音频走浏览器原生范围请求,不进缓存 */
  if (req.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('.html')) {
    e.respondWith(fetch(req).then(r => { if (r.ok) { const cp = r.clone(); caches.open(VER).then(c => c.put(req, cp)); } return r; })
      .catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match(BASE)))); return; }
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => {
    const net = fetch(req).then(r => { if (r.ok) { const cp = r.clone(); caches.open(VER).then(c => c.put(req, cp)); } return r; }).catch(() => hit);
    return hit || net; }));
});
