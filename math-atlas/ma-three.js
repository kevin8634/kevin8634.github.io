/* 星图 Math Atlas · three 版本入口(2.0 S0,2026-11-17)
 * 默认 r186(vendor/r186/,本地);?three=169 回滚到 r169(vendor/three.module.min.js + vendor/addons/),
 * 本次会话内各页面沿用;?three=186 恢复。必须以普通 <script> 在任何 type="module" 之前引入:它写出 importmap。
 * 映射:"three" → 核心;"three/addons/" → 同版本 addons。零外部请求。 */
(function () {
  var q = null, v = null;
  try { q = new URLSearchParams(location.search).get("three"); } catch (e) {}
  v = q;
  try { if (q === "169" || q === "186") sessionStorage.setItem("gn:ma:three", q); else v = sessionStorage.getItem("gn:ma:three"); } catch (e) {}
  var rev = v === "169" ? "169" : "186";
  var me = document.currentScript && document.currentScript.src;
  var base = new URL(rev === "169" ? "./vendor/" : "./vendor/r186/", me || location.href).href;
  window.MA_THREE = rev;
  document.write('<script type="importmap">' + JSON.stringify({ imports: { "three": base + "three.module.min.js", "three/addons/": base + "addons/" } }) + "<\/script>");
})();
