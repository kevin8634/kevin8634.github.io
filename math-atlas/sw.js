/* 星图 Math Atlas · Service Worker(v0.9-α2,作用域仅 /math-atlas/;写法同 04 life-source/sw.js)
 * 只缓存本世界自己的文件,断网时也能打开已访问过的页面与任务。
 * 页面:先走网络,失败再用缓存(老用户不会被旧页面卡住或白屏);脚本/样式/图片:先用缓存,后台更新。
 * 与根目录 /sw.js(缓存自毁版,作用域 "/",不监听 fetch、激活后自行注销)互不冲突:本 SW 作用域更具体,
 * 只删除自己前缀 ma- 的旧缓存,不碰根目录、门户或其他世界;不发任何外部请求。 */
const VER = 'ma-v0.9-a2';
const BASE = '/math-atlas/';
const R = 'vendor/r186/addons/';
const CORE = ['', 'ma.css', 'ma.js', 'ma-hud.css', 'ma-gl.js', 'ma-home.js', 'ma-guides.js', 'ma-three.js', 'i18n.js', 'vendor/r186/three.module.min.js',
  R + 'postprocessing/EffectComposer.js', R + 'postprocessing/MaskPass.js', R + 'postprocessing/OutputPass.js', R + 'postprocessing/Pass.js', R + 'postprocessing/RenderPass.js',
  R + 'postprocessing/ShaderPass.js', R + 'postprocessing/UnrealBloomPass.js', R + 'shaders/CopyShader.js', R + 'shaders/LuminosityHighPassShader.js', R + 'shaders/OutputShader.js',
  R + 'lines/Line2.js', R + 'lines/LineGeometry.js', R + 'lines/LineMaterial.js', R + 'lines/LineSegments2.js', R + 'lines/LineSegmentsGeometry.js',
  'curve/', 'curve/curve.js', 'curve/curve-geo.js', 'curve/curve-3d.js', 'curve/curve-2d.js', 'img/guides/curve.png',
  'atlas/', 'notes/', 'about/', 'nim/', 'bee/', 'nav/', 'secret/', 'chord/', 'cat/', 'casino/', 'epidemic/', 'rocket/', 'cube/'].map(p => BASE + p);

self.addEventListener('install', e => {
  // 逐个缓存:某一个文件失败不影响其余文件,也不阻止安装
  e.waitUntil(caches.open(VER).then(c => Promise.all(CORE.map(u => c.add(u).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k.startsWith('ma-') && k !== VER).map(k => caches.delete(k)));
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
