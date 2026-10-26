"""巡天 X0a:由 1.0 的 starhelm/index.html 生成 starhelm/x/index.html(1.0 文件不改)。
用法:在 starhelm/ 下 python3 docs/build/build_x_index.py
- <base href="../">:所有资源仍取 1.0 线上文件(共用 vendor、gn:sh:* 进度、gn:sh:live)
- three r169 → x/vendor/three-r186(同一 r147 兼容层;r147 降级 / 无 WebGL 路径不变)
- noindex;不注册 Service Worker;若 1.0 的 SW 已控制本页,把它缓存里的 index.html 恢复成 1.0 版本
"""
import re
src = open('index.html', encoding='utf-8').read()
s = src.replace('<meta charset="utf-8" />',
  '<meta charset="utf-8" />\n  <base href="../" />\n  <meta name="robots" content="noindex,nofollow" />', 1)
s = re.sub(r'<title>.*?</title>', '<title>天枢 Starhelm · 巡天 X0a 开发预览(three r186)</title>', s, 1)
old = '<script>window.SHGFX&&SHGFX.writeThree();</script>'
assert old in s
s = s.replace(old, '''<script>/* 巡天 X0a:r169 路径换成 r186(同一兼容层);r147 / 无 WebGL 走 1.0 原路径 */
(function(){window.SHX={stage:'X0a',three:186};if(!window.SHGFX)return;
if(SHGFX.lib!=='r169'||/[?&]three=169\\b/.test(location.search)){SHGFX.writeThree();return;}
var h='';for(var i=1;i<=14;i++)h+='<script src="x/vendor/three-r186/three.p'+i+'.js"><\\/script>';
h+='<script>(function(){var s=document.createElement("script");s.text=window.__C["three.js"];document.head.appendChild(s);delete window.__C["three.js"];})();<\\/script>';
document.write(h);})();</script>''', 1)
sw = '<script>if("serviceWorker"in navigator&&location.protocol==="https:")navigator.serviceWorker.register("sw.js",{scope:"./"});</script>'
assert sw in s
s = s.replace(sw, '''<script>/* 巡天 X0a:不注册 SW。1.0 的 SW 会把导航页写进缓存 ./index.html,这里把它恢复为 1.0 首页,避免离线时打开 1.0 看到本预览页 */
(function(){if(!('caches'in window)||!navigator.serviceWorker||!navigator.serviceWorker.controller)return;
setTimeout(function(){fetch('index.html',{cache:'no-store'}).then(function(r){if(!r.ok)return;caches.keys().then(function(ks){ks.filter(function(k){return /^sh-/.test(k);}).forEach(function(k){caches.open(k).then(function(c){c.put(new URL('index.html',document.baseURI).href,r.clone());});});});}).catch(function(){});},4000);})();</script>
<div id="shx-badge" style="position:fixed;left:50%;bottom:6px;transform:translateX(-50%);z-index:99999;pointer-events:none;font:11px/1.4 system-ui,sans-serif;color:#6FE3FF;opacity:.75;letter-spacing:.06em;text-shadow:0 0 6px #000">巡天 X0a · 开发预览 · three <span id="shx-r">r186</span></div>
<script>setTimeout(function(){var e=document.getElementById('shx-r');if(e)e.textContent=window.THREE&&THREE.__r?('r'+THREE.__r):'2D';},500);</script>''', 1)
open('x/index.html', 'w', encoding='utf-8').write(s)
print('ok', len(s))
