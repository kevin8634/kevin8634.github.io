/* 生命源码 Life Source · Service Worker(作用域仅 /life-source/)
 * 只缓存本世界自己的文件,让学生断网时也能继续玩已打开过的任务。
 * 页面:先走网络,失败再用缓存;脚本/样式:先用缓存,后台更新。
 * 不碰根目录、门户或其他世界的缓存;不发任何外部请求。 */
const VER = 'ls-v0.10.4';
const BASE = '/life-source/';
const CORE = ['', 'ls.css', 'ls.js', 'ls-task.js', 'ls-lab.js', 'ls-cards.js', 'ls-scene.js', 'img/intro1.webp', 'img/intro2.webp', 'img/intro3.webp', 'img/atlas-tree.webp', 'img/g-cas.webp', 'img/g-epi.webp', 'img/g-adna.webp', 'img/g-phage.webp', 'img/g-edna.webp', 'ls-helix.js', 'ls-zoom.js', 'atlas-data.js', 'ls-intro.js', 'ls-atlas.js',
  'vendor/three.module.min.js', 'dna/', 'parents/', 'zebra/', 'virus/', 'wolf/'].map(p => BASE + p);

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VER).then(c => c.addAll(CORE)).catch(() => {}).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k.startsWith('ls-') && k !== VER).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin || !url.pathname.startsWith(BASE)) return;
  if (req.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('.html')) {
    e.respondWith(fetch(req).then(r => { if (r.ok) { const cp = r.clone(); caches.open(VER).then(c => c.put(req, cp)); } return r; })
      .catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match(BASE))));
    return;
  }
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => {
    const net = fetch(req).then(r => { if (r.ok) { const cp = r.clone(); caches.open(VER).then(c => c.put(req, cp)); } return r; }).catch(() => hit);
    return hit || net;
  }));
});
