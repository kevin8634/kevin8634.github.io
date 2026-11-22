/* 宙律 Nomoverse · Service Worker(v2.0-α2 + 3.0-α3;作用域仅 /nomoverse/;缓存名统一前缀 nv-,只清理自己的旧版本)
 * 页面与代码(导航、.html/.js/.css):网络优先,离线时回缓存 —— 发新版后在线用户立即拿到新代码,不会新旧混用
 * 大件静态资源(vendor/、audio/、assets/):缓存优先,首次用到时再存(不预缓存 2k/4k 贴图与背景音乐)
 * 3.0(v3.0-α3 起):预缓存 /nomoverse/3/ 与它 import 的 /shared/3/ 文件(绝对路径);/shared/3/ 同源但在作用域外,fetch 守卫单独放行,
 *   走缓存优先 + 后台更新;版本号带 s3-0.3,/shared/3/ 升版时改这里的标记即可整体换新。
 * 只处理同源、本作用域内(及 /shared/3/)的 GET;不碰根目录、门户和其他世界。?nosw=1 打开任意页面即注销本 SW 并清掉 nv- 缓存。 */
const C = 'nv-v2.0-a2_v3.0-a7_s3-0.3';
const F = ['./', 'index.html', 'i18n.js', 'i18n/orbit.js', 'i18n/sound.js', 'i18n/hoop.js', 'i18n/stars.js', 'i18n/tide.js', 'i18n/energy.js', 'i18n/lab.js', 'orbit/', 'sound/', 'hoop/', 'stars/', 'tide/', 'energy/', 'lab/', 'icecube/', 'core/icecube.js', 'cosmos/', 'core/cosmos.js', 'core/nv.css', 'core/nv.js', 'core/nvscene.js', 'core/intro.js',
  'core/starmap3d.js', 'core/orbit3d.js', 'core/sound3d.js', 'core/hoop3d.js', 'core/stars3d.js', 'core/tide3d.js', 'core/labmodel.js', 'core/lab3d.js', 'core/energy3d.js', 'vendor/three.module.min.js',
  '3/', '3/index.html', '3/nv3.css', '3/main.mjs', '3/core/universe.js', '3/core/nbody.js', '3/core/gus0.js', '3/core/scene.js', '3/core/adapt.mjs', '3/core/wclient.mjs', '3/core/worker.js', '3/core/render3.mjs', '3/core/teach.mjs', '3/core/explore.mjs', '3/core/explore-ui.mjs', '3/core/create.mjs', '3/core/create-ui.mjs', '3/core/access.mjs', '3/core/access-ui.mjs', '3/core/galaxy.mjs',
  '/shared/3/tokens.css', '/shared/3/ui.css', '/shared/3/ui.js', '/shared/3/gus.js', '/shared/3/tier.js', '/shared/3/store.js', '/shared/3/undo.js', '/shared/3/i18n.js', '/shared/3/prng.js', '/shared/3/selftest.js',
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
  if (u.origin !== location.origin) return;
  /* /shared/3/:缓存优先,同时后台取新(下次生效);离线时只用缓存 */
  if (u.pathname.startsWith('/shared/3/')) {
    e.respondWith(caches.open(C).then(c => c.match(u.origin + u.pathname).then(hit => {
      const net = fetch(r).then(res => { if (res.ok && res.status === 200) c.put(u.origin + u.pathname, res.clone()); return res; });
      if (hit) { e.waitUntil(net.catch(() => null)); return hit; }
      return net;
    })).catch(() => fetch(r)));
    return;
  }
  if (!u.pathname.startsWith(base)) return;
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
