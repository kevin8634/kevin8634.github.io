/* 天枢 Starhelm · 共享场景模块 sh-scene.js(v0.9.0)
 * 职责:3D 能力检测 → 选 Three.js 版本(r169 / r147 降级)→ 性能档位 → 像素比上限 → 画质设置。
 * 必须在 Three.js 之前、以经典脚本同步加载。设置存 localStorage「gn:sh:gfx」(auto|high|mid|r147),只在本机。
 * 档位:high 全效(像素比 桌面≤2 / 手机≤1.5);mid 粒子减半、像素比≤1.25;
 *       r147 = 不支持 WebGL2 的设备(或手动选择)加载旧 r147 包;none = 无 WebGL,同样加载 r147 包,各模块走原有 2D/静态版,功能不减。
 */
(function () {
  'use strict';
  var KEY = 'gn:sh:gfx';
  var MOBILE = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && /Macintosh/.test(navigator.userAgent));
  var RM = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);

  function pref() { try { var v = localStorage.getItem(KEY); return /^(auto|high|mid|r147)$/.test(v) ? v : 'auto'; } catch (e) { return 'auto'; } }

  function probe() {
    var out = { gl2: false, gl1: false, soft: false, renderer: '' };
    try {
      var c = document.createElement('canvas');
      var g = c.getContext('webgl2', { failIfMajorPerformanceCaveat: false });
      if (g) out.gl2 = true; else g = c.getContext('webgl') || c.getContext('experimental-webgl');
      if (g) {
        out.gl1 = true;
        var ext = g.getExtension('WEBGL_debug_renderer_info');
        out.renderer = String(ext ? g.getParameter(ext.UNMASKED_RENDERER_WEBGL) : g.getParameter(g.RENDERER) || '');
        out.soft = /SwiftShader|llvmpipe|Software|Basic Render/i.test(out.renderer);
        var lose = g.getExtension('WEBGL_lose_context'); if (lose) lose.loseContext();
      }
    } catch (e) {}
    return out;
  }

  var P = probe(), choice = pref();
  var lib = P.gl2 && choice !== 'r147' ? 'r169' : (P.gl1 ? 'r147' : 'none');
  var weak = MOBILE || P.soft || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) || (navigator.deviceMemory && navigator.deviceMemory <= 4);
  var tier = lib === 'none' ? 'low' : (choice === 'high' ? 'high' : choice === 'mid' ? 'mid' : (weak ? 'mid' : 'high'));

  var G = window.SHGFX = {
    version: '0.9.0',
    lib: lib,            // r169 | r147 | none
    tier: tier,          // high | mid | low
    choice: choice,      // auto | high | mid | r147
    mobile: MOBILE,
    reducedMotion: RM,
    gpu: P.renderer,
    /** 像素比上限:high 桌面 2 / 手机 1.5;mid 1.25 */
    prCap: function () { return tier === 'high' ? (MOBILE ? 1.5 : 2) : 1.25; },
    /** 装饰性粒子数量:mid 减半(真实数据点不要用它缩减) */
    particles: function (n) { return tier === 'high' ? n : Math.max(1, Math.round(n / 2)); },
    set: function (v) { try { localStorage.setItem(KEY, v); } catch (e) {} location.reload(); },
    /** 按档位同步写出 Three.js 脚本(只在页面解析期间调用) */
    writeThree: function () {
      var s = [];
      if (lib === 'r169') {
        for (var i = 1; i <= 13; i++) s.push('vendor/three-r169/three.p' + i + '.js');
        s.push('#three.js');
      } else {   // r147 降级;无 WebGL 时也加载 r147(各模块用其数学类,渲染走原有 2D/静态版,与 v0.6.5 行为一致)
        for (var j = 1; j <= 15; j++) s.push('three.min.p' + j + '.js');
        s.push('#three.min.js', 'OrbitControls.js', 'GLTFLoader.p1.js', 'GLTFLoader.p2.js', 'GLTFLoader.p3.js', '#GLTFLoader.js');
      }
      var html = s.map(function (u) {
        return u.charAt(0) === '#'
          ? '<script>(function(){var k="' + u.slice(1) + '",s=document.createElement("script");s.text=window.__C[k];document.head.appendChild(s);delete window.__C[k];})();<\/script>'
          : '<script src="' + u + '"><\/script>';
      }).join('');
      document.write(html);
    }
  };

  /* 画质按钮:放在顶栏声音按钮组里,依次切换 自动 → 高 → 中 → 兼容(r147),切换后刷新生效 */
  var ORDER = ['auto', 'high', 'mid', 'r147'];
  var LAB = { auto: 'AUTO', high: 'HQ', mid: 'MQ', r147: 'R147' };
  var ZH = { auto: '自动', high: '高', mid: '中', r147: '兼容(r147)' };
  function mountBtn() {
    var grp = document.querySelector('.le-sound'); if (!grp || document.getElementById('btn-gfx')) return;
    var b = document.createElement('button'); b.type = 'button'; b.id = 'btn-gfx';
    b.innerHTML = '◇<small>' + LAB[choice] + '</small>';
    var cur = lib === 'none' ? '无 WebGL · 2D 版' : ('Three.js ' + lib + ' · ' + (tier === 'high' ? '高' : '中') + '档');
    b.title = '画质:' + ZH[choice] + '(当前 ' + cur + ')· 点按切换,刷新后生效';
    b.setAttribute('aria-label', b.title);
    b.addEventListener('click', function () { G.set(ORDER[(ORDER.indexOf(choice) + 1) % ORDER.length]); });
    grp.appendChild(b);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountBtn); else mountBtn();
  document.documentElement.setAttribute('data-gfx', lib + ' ' + tier);
})();
