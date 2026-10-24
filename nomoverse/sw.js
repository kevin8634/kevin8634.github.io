/* 宙律 Nomoverse · Service Worker(v0.5-α1;作用域仅 /nomoverse/;缓存名统一前缀 nv-,只清理自己的旧版本)
 * 页面与代码(导航、.html/.js/.css):网络优先,离线时回缓存 —— 发新版后在线用户立即拿到新代码,不会新旧混用
 * 大件静态资源(vendor/、audio/、assets/):缓存优先,首次用到时再存(不预缓存 2k/4k 贴图与背景音乐)
 * 只处理同源、本作用域内的 GET;不碰根目录、门户和其他世界。?nosw=1 打开任意页面即注销本 SW 并清掉 nv- 缓存。 */
const C = 'nv-v0.5-a1';
const F = ['./', 'index.html', 'orbit/', 'sound/', 'hoop/', 'stars/', 'core/nv.css', 'core/nv.js', 'core/nvscene.js', 'core/intro.js',
  'core/starmap3d.js', 'core/orbit3d.js', 'core/sound3d.js', 'core/hoop3d.js', 'core/stars3d.js', 'vendor/three.module.min.js',
  'audio/close.m4a', 'audio/select.m4a', 'audio/star.m4a', 'audio/swish.m4a', 'audio/thud.m4a', 'audio/tick.m4a', 'audio/unlock.m4a', 'audio/whoosh.m4a'];
self.addEventListener('install', e => {
  // 单个文件失败不阻止安装(离线能力逐步补齐)
  e.waitUntil(caches.open(C).then(c => Promise.all(F.map(f => c.add(new Request(f, { cache: 'reload' })).catch(() => null)))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x.startsWith('nv-') && x !== C).map(x => caches.delete(x)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return;
  const u = new URL(r.url), base = new URL(self.registration.scope).pathname;
  if (u.origin !== location.origin || !u.pathname.startsWith(base)) return;
  const rel = u.pathname.slice(base.length);
  const big = /^(vendor|audio|assets)\//.test(rel);
  if (big) {
    e.respondWith(caches.match(r, { ignoreSearch: true }).then(x => x || fetch(r).then(res => {
      if (res.ok && res.status === 200) { const cp = res.clone(); caches.open(C).then(c => c.put(r, cp)); }
      return res;
    })));
    return;
  }
  if (r.mode === 'navigate' || /\.(html|js|css)$/.test(rel) || rel === '' || rel.endsWith('/')) {
    e.respondWith(fetch(r).then(res => {
      if (res.ok && res.status === 200) { const cp = res.clone(); caches.open(C).then(c => c.put(u.origin + u.pathname, cp)); }
      return res;
    }).catch(() => caches.match(u.origin + u.pathname).then(x => x || caches.match(r, { ignoreSearch: true })).then(x => x || (r.mode === 'navigate' ? caches.match(base) : undefined)).then(x => x || Response.error())));
  }
});
