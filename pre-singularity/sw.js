/* 奇点前夜 Pre-Singularity · Service Worker(作用域仅 /pre-singularity/)
 * 2.0 主入口「透过玻璃心智看决策」(glass/office.html)及其依赖预缓存,断网时打开过的页面仍可玩。
 * 页面:先走网络,失败再用缓存;脚本/样式/贴图:先用缓存,后台更新。
 * 不碰根目录、门户或其他世界的缓存;不发任何外部请求。逐个预缓存,单个文件失败不影响其余。 */
const VER = 'ps-v2.0-b1';
const BASE = '/pre-singularity/';
const PP = 'vendor/r186/addons/postprocessing/', SH = 'vendor/r186/addons/shaders/';
const CORE = ['', 'ps.css', 'ps.js', 'ps-scene.js', 'ps-lobby3d.js', 'ps-penthouse.js', 'fg_sofa.webp',
  'glass/', 'glass/office.html', 'glass/office.js', 'glass/office.css', 'glass/glass.css', 'glass/glass.js',
  'vendor/r186/three.module.min.js', 'vendor/three.module.min.js',
  ...['EffectComposer', 'RenderPass', 'UnrealBloomPass', 'OutputPass', 'ShaderPass', 'MaskPass', 'Pass'].map(n => PP + n + '.js'),
  ...['CopyShader', 'LuminosityHighPassShader', 'OutputShader'].map(n => SH + n + '.js')].map(p => BASE + p);

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VER).then(c => Promise.all(CORE.map(u => c.add(u).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k.startsWith('ps-') && k !== VER).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin || !url.pathname.startsWith(BASE)) return;
  const put = r => { if (r.ok) { const cp = r.clone(); caches.open(VER).then(c => c.put(req, cp)); } return r; };
  if (req.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('.html')) {
    e.respondWith(fetch(req).then(put).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match(BASE))));
    return;
  }
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => { const net = fetch(req).then(put).catch(() => hit); return hit || net; }));
});
