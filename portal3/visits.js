/* 创世计划 访问量小窗:每会话计一次;点击看国家/城市分布(只存计数,不存 IP) */
(function () {
  var API = "https://genesis-visits.wanglei19860304.workers.dev";
  var en = window.GN_LANG === "en";
  var T = en
    ? { v: "Visits", t: "today", h: "Where visitors come from", c: "Countries", ci: "Cities", s: "since", n: "Counts by country and city only. No IP addresses are stored.", x: "Close", u: "Unknown" }
    : { v: "访问", t: "今日", h: "访客来自哪里", c: "国家/地区", ci: "城市", s: "统计自", n: "只统计国家和城市人次,不保存任何 IP 地址。", x: "关闭", u: "未知" };
  var dn = null;
  try { dn = new Intl.DisplayNames([en ? "en" : "zh-CN"], { type: "region" }); } catch (e) {}
  function cname(c) { if (!c || c === "XX" || c === "T1") return T.u; try { return (dn && dn.of(c)) || c; } catch (e) { return c; } }
  function flag(c) { if (!/^[A-Z]{2}$/.test(c || "") || c === "XX") return "🌐"; return String.fromCodePoint(127397 + c.charCodeAt(0), 127397 + c.charCodeAt(1)); }
  function fmt(n) { return (n || 0).toLocaleString(en ? "en-US" : "zh-CN"); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (m) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m]; }); }

  var css = "#gvis{position:fixed;left:12px;bottom:calc(12px + env(safe-area-inset-bottom));z-index:9500;display:none;align-items:center;gap:6px;padding:5px 11px;border-radius:999px;border:1px solid rgba(159,216,255,.35);background:rgba(4,10,18,.62);color:#cfe6f5;font:12px/1.2 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;letter-spacing:.04em;cursor:pointer;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}" +
    "#gvis:hover{border-color:#9fd8ff;color:#fff}#gvis i{width:6px;height:6px;border-radius:50%;background:#7ff0c8;box-shadow:0 0 8px #7ff0c8}" +
    "#gvis:focus-visible{outline:2px solid #9fd8ff;outline-offset:2px}" +
    "#gvisp{position:fixed;inset:0;z-index:9600;display:none;align-items:center;justify-content:center;background:rgba(1,4,9,.66);padding:16px}" +
    "#gvisp.on{display:flex}#gvisp .b{width:min(560px,100%);max-height:min(80vh,640px);overflow:auto;border-radius:16px;border:1px solid rgba(159,216,255,.28);background:linear-gradient(160deg,rgba(14,22,40,.96),rgba(6,10,20,.96));color:#e6eef6;font:14px/1.5 system-ui,sans-serif;padding:20px 22px;box-shadow:0 20px 60px rgba(0,0,0,.6)}" +
    "#gvisp h3{margin:0 0 4px;font-weight:600;font-size:18px}#gvisp .m{color:#9fb3c6;font-size:12px;margin-bottom:14px}" +
    "#gvisp .k{display:flex;gap:10px;margin-bottom:16px}#gvisp .k div{flex:1;border:1px solid rgba(159,216,255,.18);border-radius:10px;padding:8px 10px}#gvisp .k b{display:block;font-size:22px;color:#fff}#gvisp .k span{font-size:12px;color:#9fb3c6}" +
    "#gvisp h4{margin:14px 0 6px;font-size:13px;color:#e9c779;letter-spacing:.08em}#gvisp ul{list-style:none;margin:0;padding:0}#gvisp li{display:flex;align-items:center;gap:8px;padding:4px 0;border-bottom:1px solid rgba(255,255,255,.05)}" +
    "#gvisp li .n{flex:0 0 auto;max-width:55%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}#gvisp li .bar{flex:1;height:4px;border-radius:2px;background:rgba(159,216,255,.12);overflow:hidden}#gvisp li .bar s{display:block;height:100%;background:linear-gradient(90deg,#7b5cff,#5ad1ff)}#gvisp li em{font-style:normal;color:#9fb3c6;font-size:12px;min-width:3em;text-align:right}" +
    "#gvisp .x{float:right;border:1px solid rgba(159,216,255,.3);background:transparent;color:#cfe6f5;border-radius:999px;padding:3px 12px;cursor:pointer;font:inherit;font-size:12px}#gvisp .f{margin-top:14px;font-size:12px;color:#7f93a6}";
  var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
  var pill = document.createElement("button"); pill.id = "gvis"; pill.type = "button"; pill.setAttribute("aria-haspopup", "dialog");
  var pop = document.createElement("div"); pop.id = "gvisp"; pop.setAttribute("role", "dialog"); pop.setAttribute("aria-modal", "true"); pop.setAttribute("aria-label", T.h);
  document.body.appendChild(pill); document.body.appendChild(pop);

  function show() { pill.style.display = "inline-flex"; }
  function setPill(total, today) { pill.innerHTML = "<i></i>" + T.v + " " + fmt(total) + " · " + T.t + " " + fmt(today); if (window.__p3introOn) window.addEventListener("p3intro:end", show, { once: true }); else show(); }
  function rows(list, max) { var mx = list.length ? list[0].v : 1; return "<ul>" + list.map(function (r) { return "<li><span class=n>" + r.l + "</span><span class=bar><s style=width:" + Math.max(3, Math.round(r.v / mx * 100)) + "%></s></span><em>" + fmt(r.v) + "</em></li>"; }).join("") + "</ul>"; }
  function render(d) {
    var cs = (d.countries || []).map(function (x) { return { l: flag(x[0]) + " " + esc(cname(x[0])), v: x[1] }; });
    var ci = (d.cities || []).map(function (x) { return { l: flag(x[0]) + " " + esc(x[1] === "未知" ? T.u : x[1]) + " <small style=color:#7f93a6>· " + esc(cname(x[0])) + "</small>", v: x[2] }; });
    pop.innerHTML = "<div class=b><button class=x type=button>" + T.x + "</button><h3>" + T.h + "</h3><div class=m>" + (d.since ? T.s + " " + d.since : "") + "</div>" +
      "<div class=k><div><b>" + fmt(d.total) + "</b><span>" + T.v + "</span></div><div><b>" + fmt(d.today) + "</b><span>" + T.t + "</span></div><div><b>" + fmt(cs.length) + "</b><span>" + T.c + "</span></div></div>" +
      "<h4>" + T.c + "</h4>" + rows(cs) + "<h4>" + T.ci + "</h4>" + rows(ci) + "<div class=f>" + T.n + "</div></div>";
    pop.querySelector(".x").onclick = close;
  }
  function close() { pop.classList.remove("on"); pill.focus(); }
  pop.addEventListener("click", function (e) { if (e.target === pop) close(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && pop.classList.contains("on")) close(); });
  pill.onclick = function () {
    fetch(API + "/stats", { cache: "no-store" }).then(function (r) { return r.json(); }).then(function (d) { render(d); setPill(d.total, d.today); pop.classList.add("on"); var x = pop.querySelector(".x"); if (x) x.focus(); }).catch(function () {});
  };

  var counted = false; try { counted = sessionStorage.getItem("gvis") === "1"; } catch (e) {}
  var req = counted ? fetch(API + "/stats", { cache: "no-store" }) : fetch(API + "/hit", { method: "POST", cache: "no-store" });
  req.then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (d) {
    try { sessionStorage.setItem("gvis", "1"); } catch (e) {}
    setPill(d.total, d.today);
  }).catch(function () { /* 统计服务不可达时静默隐藏 */ });
})();
