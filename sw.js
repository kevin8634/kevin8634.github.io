/* 根目录 Service Worker · 缓存自毁版(天枢 Starhelm M0,2026-10-17)
 * 旧版 Live Earth 的 SW 作用域为 "/",会缓存根目录并拦截整个域名。本文件替换它:
 *  1) 只删除 Live Earth 的缓存(前缀 le-),不碰其他世界或门户的缓存
 *  2) 注销自己,之后根目录与各世界都直接走网络
 *  3) 刷新已打开的页面,让老用户立刻看到新门户
 * 不监听 fetch。请长期保留本文件(建议至少 6 个月);门户不要在根目录注册新的 SW。 */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k.startsWith('le-')).map(k => caches.delete(k)));
    await self.registration.unregister();
    const cs = await self.clients.matchAll({ type: 'window' });
    cs.forEach(c => c.navigate(c.url));
  })());
});
