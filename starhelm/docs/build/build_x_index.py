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
s = re.sub(r'<title>.*?</title>', '<title>天枢 Starhelm · 巡天 X0b · C0 开发预览(three r186)</title>', s, 1)
old = '<script>window.SHGFX&&SHGFX.writeThree();</script>'
assert old in s
s = s.replace(old, '''<script>/* 巡天 X0a:r169 路径换成 r186(同一兼容层);r147 / 无 WebGL 走 1.0 原路径 */
(function(){window.SHX={stage:'X0b+C0',three:186};if(!window.SHGFX)return;
if(SHGFX.lib!=='r169'||/[?&]three=169\\b/.test(location.search)){SHGFX.writeThree();return;}
var h='';for(var i=1;i<=14;i++)h+='<script src="x/vendor/three-r186/three.p'+i+'.js"><\\/script>';
h+='<script>(function(){var s=document.createElement("script");s.text=window.__C["three.js"];document.head.appendChild(s);delete window.__C["three.js"];})();<\\/script>';
document.write(h);})();</script>''', 1)
sw = '<script>if("serviceWorker"in navigator&&location.protocol==="https:")navigator.serviceWorker.register("sw.js",{scope:"./"});</script>'
assert sw in s
s = s.replace(sw, '''<script>/* 巡天 X0a:不注册 SW。1.0 的 SW 会把导航页写进缓存 ./index.html,这里把它恢复为 1.0 首页,避免离线时打开 1.0 看到本预览页 */
(function(){if(!('caches'in window)||!navigator.serviceWorker||!navigator.serviceWorker.controller)return;
setTimeout(function(){fetch('index.html',{cache:'no-store'}).then(function(r){if(!r.ok)return;caches.keys().then(function(ks){ks.filter(function(k){return /^sh-/.test(k);}).forEach(function(k){caches.open(k).then(function(c){c.put(new URL('index.html',document.baseURI).href,r.clone());});});});}).catch(function(){});},4000);})();</script>
<div id="shx-badge" style="position:fixed;left:50%;bottom:6px;transform:translateX(-50%);z-index:99999;pointer-events:none;font:11px/1.4 system-ui,sans-serif;color:#6FE3FF;opacity:.75;letter-spacing:.06em;text-shadow:0 0 6px #000">巡天 X0b · 穿梭 C1.3 天枢号 · 开发预览 · three <span id="shx-r">r186</span></div>
<script>setTimeout(function(){var e=document.getElementById('shx-r');if(e)e.textContent=window.THREE&&THREE.__r?('r'+THREE.__r):'2D';},500);</script>''', 1)
# X0b 四级视图 + C0 驾驶舱(只在 x/ 下)
add = '<script src="x/sh-x-views.js"></script>\n<script src="x/sh-x-cockpit.js"></script>\n<script src="x/sh-x-armilla.js"></script>\n<script src="x/sh-x-port.js"></script>\n<script src="x/armilla/voice.js"></script>\n<script src="x/sh-x-ship.js"></script>\n'
assert '</body>' in s
s = s.replace('</body>', add + '</body>', 1)

# C0.8 归档 1.0 弦穹号航行:X 页不再加载 sh-voyage.js / fx / fx2 / css,所有航行入口统一进天枢号驾驶舱(sh-voyage-data.js 保留,驾驶舱引擎表要用)
for tag in ['<link rel="stylesheet" href="sh-voyage.css" />', '<script src="sh-voyage-fx.js"></script>', '<script src="sh-voyage-fx2.js"></script>', '<script src="sh-voyage.js"></script>']:
    assert tag in s, tag
    s = s.replace(tag, '<!-- 1.0 已归档(X 页停用):' + tag.replace('<', '').replace('>', '').replace('"', "'") + ' -->', 1)
# C0.7 2.0 开场:1.0 两个开场(开机日志 loader 由 2.0 开场覆盖、sh-opening.js 学科开场)在 X 页归档停用
assert '<script src="sh-opening.js"></script>' in s
s = s.replace('<script src="sh-opening.js"></script>', '<!-- 1.0 sh-opening.js 已在 2.0 X 页归档停用,改用 x/sh-x-open.js -->\n  <script src="x/sh-x-open.js"></script>', 1)
# 1.0 开机日志 loader 在 X 页只留纯黑底(归档),2.0 开场脚本就绪后覆盖
s = s.replace('</head>', '<style>/* 2.0:1.0 开机日志归档 */#loader{background:#010208!important}#loader>*{visibility:hidden!important}</style>\n</head>', 1)
# 2.0 按钮统一光效(只在 x/)
s = s.replace('</head>', '<link rel="stylesheet" href="x/sh-x-style.css" />\n</head>', 1)
open('x/index.html', 'w', encoding='utf-8').write(s)
print('ok', len(s))
