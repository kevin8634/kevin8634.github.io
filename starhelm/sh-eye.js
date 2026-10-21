/* 天枢 Starhelm · M1.8a 地球之眼:台风 + 极光
 * 热带气旋:GDACS(欧盟委员会联合研究中心 & 联合国 OCHA)事件列表,只显示「进行中」的气旋,点开看风速与等级。
 * 极光:NOAA SWPC OVATION 极光预报(约 30–90 分钟后的极光出现概率)+ 行星 Kp 指数。
 * 两个数据源都允许跨域(CORS *)。失败时图层安静地显示「暂不可用」,不影响其他功能。
 * M1.8b 真实云图:NASA GIBS(CORS *)提供的静止气象卫星 10 分钟间隔画面(Himawari-9 / GOES-East / GOES-West),
 *   每个台风取最近约 3 小时的连续帧循环播放 = 台风真实的转动;云层开关增加「实拍」档(VIIRS 最近一天全球真彩图)。
 *   卫星图拿不到时退回着色器云系并标「示意」。 */
(function () {
  'use strict';
  var URL_TC = 'https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH?eventlist=TC';
  var URL_OV = 'https://services.swpc.noaa.gov/json/ovation_aurora_latest.json';
  var URL_KP = 'https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json';
  var EYE = { storms: [], kp: null, ovTime: '', on: { storms: true, aurora: true } };
  window.SH = window.SH || {}; SH.eye = EYE;

  function wait(f, cb) { var t = setInterval(function () { if (f()) { clearInterval(t); cb(); } }, 300); }
  function $(id) { return document.getElementById(id); }
  // 中国国家标准《热带气旋等级》按近中心最大风速划分(km/h 近似)
  function grade(k) {
    return k >= 184 ? '超强台风' : k >= 150 ? '强台风' : k >= 118 ? '台风' : k >= 89 ? '强热带风暴' : k >= 62 ? '热带风暴' : '热带低压';
  }
  function gcol(k) { return k >= 150 ? '#ff4d6d' : k >= 118 ? '#ff8a1f' : k >= 62 ? '#ffd23f' : '#9fe8ff'; }
  function fmt(s) { if (typeof s === 'string' && /T\d\d:\d\d(:\d\d)?$/.test(s)) s += 'Z'; var d = new Date(s); if (isNaN(d)) return String(s || '—'); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate() + ' ' + ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }

  /* ---------- 台风 ---------- */
  // 太空俯视的台风云系:对数螺旋云带 + 分形噪声 + 清晰台风眼(着色器程序生成,无外部图片)
  var CLOUD_VS = 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }';
  var CLOUD_FS = [
    'varying vec2 vUv; uniform float uT, uDir, uSeed, uK;',
    'float h(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }',
    'float n2(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y); }',
    'float fbm(vec2 p){ float v=0., a=.5; for(int i=0;i<5;i++){ v+=a*n2(p); p=p*2.03+17.; a*=.5; } return v; }',
    'void main(){ vec2 p=(vUv-.5)*2.; float r=length(p); if(r>1.) discard;',
    ' float a=atan(p.y,p.x); float tw=a-uDir*(3.2*log(r+.06))-uDir*uT*.35;',
    ' vec2 q=vec2(cos(tw),sin(tw))*(1.2+r*2.5)+uSeed;',
    ' float n=fbm(q*1.6+vec2(0.,uT*.05)); float arms=.5+.5*sin(2.*tw+n*3.);',
    ' float dens=(.35+.65*arms)*(.55+.7*n)*smoothstep(1.,.15,r)+smoothstep(.55,.08,r)*.75*uK;',
    ' float eye=smoothstep(.035,.11,r); float al=clamp(dens*eye,0.,1.)*smoothstep(1.,.7,r);',
    ' al=smoothstep(.18,.85,al); vec3 c=mix(vec3(.78,.83,.9),vec3(1.),n)*(.85+.15*(1.-r));',
    ' float wall=smoothstep(.09,.13,r)*smoothstep(.22,.13,r)*uK; c+=wall*.12;',
    ' gl_FragColor=vec4(c,al*.95); }'].join('\n');
  function initStorms(S, U) {
    var grp = EYE.sg = new THREE.Group(); S.earthScene.add(grp);
    fetch(URL_TC).then(function (r) { return r.json(); }).then(function (j) {
      EYE.storms = (j.features || []).filter(function (f) { return f.properties && String(f.properties.iscurrent) === 'true' && (Date.now() - new Date(f.properties.todate + 'Z').getTime() < 4 * 864e5) && f.geometry && f.geometry.type === 'Point'; }).map(function (f) {
        var p = f.properties, sv = p.severitydata || {}, c = f.geometry.coordinates;
        var u = p.url && (p.url.report || p.url.details) || ('https://www.gdacs.org/report.aspx?eventtype=TC&eventid=' + p.eventid);
        return { name: (p.eventname || p.name || '').replace(/^Tropical Cyclone\s*/i, '').replace(/-\d\d$/, ''), lng: c[0], lat: c[1], wind: +sv.severity || 0, from: p.fromdate, to: p.todate, url: u };
      });
      EYE.storms.forEach(function (s) {
        var k = Math.min(1, s.wind / 250), dir = s.lat >= 0 ? 1 : -1;   // 北半球逆时针、南半球顺时针(从太空俯视)
        var mat = new THREE.ShaderMaterial({ uniforms: { uT: { value: 0 }, uDir: { value: dir }, uSeed: { value: Math.random() * 50 }, uK: { value: k } },
          vertexShader: CLOUD_VS, fragmentShader: CLOUD_FS, transparent: true, depthWrite: false, side: THREE.DoubleSide });
        var m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
        m.scale.setScalar(0.12 + k * 0.1);   // 直径约 750–1400 km 的云系
        m.position.copy(U.ll(s.lat, s.lng, 1.012)); m.lookAt(0, 0, 0);
        m.userData.s = s;
        s.mesh = m; grp.add(m);
      });
      EYE.storms.slice(0, 4).forEach(function (s) { try { SAT.load(S, U, grp, s); } catch (e) { console.warn('[eye] sat', e); } });
      EYE.tcOk = true; chipNote();
    }).catch(function (e) { EYE.tcOk = false; chipNote(); console.warn('[eye] GDACS', e); });
    S.addUpdater(function (dt) { if (!grp.visible) return; var t = performance.now() / 1000; grp.children.forEach(function (m) { if (m.material.uniforms.uT) m.material.uniforms.uT.value = t; }); SAT.tick(S, grp.visible); });
    S.addPicker({ mode: 'earth', priority: 2, fn: function (ray) {
      if (!grp.visible || !EYE.storms.length) return null;
      var best = null, v = new THREE.Vector3();
      EYE.storms.forEach(function (s) {
        s.mesh.getWorldPosition(v); if (S.occluded(v)) return;
        var d = Math.sqrt(ray.ray.distanceSqToPoint(v));
        if (d < 0.08 && (!best || d < best.d)) best = { s: s, d: d };
      });
      return best && { score: 3 - best.d, run: function () { card(best.s); } };
    } });
  }
  function card(s) {
    LE.ui.showCard({ kind: 'storm', color: gcol(s.wind), kicker: '热带气旋 · 进行中', title: s.name + ' · ' + grade(s.wind),
      blurb: (s.sat && s.sat.ok ? '你看到的是静止气象卫星最近约 3 小时的真实画面在循环播放:云带绕着台风眼转动,就是台风本身在转。' : '') + '台风是热带海洋上旋转的巨大低气压。地球自转让它在北半球逆时针转、南半球顺时针转。',
      rows: [['最大风速', Math.round(s.wind) + ' km/h', 1], ['等级', grade(s.wind) + '(按中国国家标准换算)'], ['生成时间', fmt(s.from) + '(本地时间)', 1], ['最近更新', fmt(s.to) + '(本地时间)', 1], ['卫星实拍', SAT.label(s), 1], ['中心位置', Math.abs(s.lat).toFixed(1) + '°' + (s.lat >= 0 ? 'N' : 'S') + ' ' + Math.abs(s.lng).toFixed(1) + '°' + (s.lng >= 0 ? 'E' : 'W'), 1]],
      actions: [{ label: '在 GDACS 查看路径 ↗', href: s.url }] });
  }

  /* ---------- M1.8b 卫星实拍:台风连续帧 ---------- */
  var GIBS = 'https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&CRS=EPSG:4326';
  function iso(d) { return d.toISOString().slice(0, 16) + ':00Z'; }
  function hm(d) { return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }
  function md(d) { return (d.getMonth() + 1) + '-' + d.getDate(); }
  function gibs(layer, box, px, time, fmt) {
    return GIBS + '&LAYERS=' + layer + '&BBOX=' + box.join(',') + '&WIDTH=' + px + '&HEIGHT=' + Math.round(px * (box[2] - box[0]) / (box[3] - box[1])) + '&FORMAT=' + (fmt || 'image/png') + '&TIME=' + time;
  }
  // 读一张图;全透明(该时刻还没有数据)当作失败
  function loadImg(url, cb) {
    var im = new Image(); im.crossOrigin = 'anonymous';
    im.onload = function () {
      try {
        var c = document.createElement('canvas'); c.width = c.height = 16; var x = c.getContext('2d'); x.drawImage(im, 0, 0, 16, 16);
        var d = x.getImageData(0, 0, 16, 16).data, op = 0; for (var i = 3; i < d.length; i += 4) if (d[i] > 10) op++;
        cb(op > 40 ? im : null);
      } catch (e) { cb(null); }
    };
    im.onerror = function () { cb(null); }; im.src = url;
  }
  // 按经度选静止气象卫星(GIBS 图层名)
  function pickSat(lng) {
    if (lng >= 80 || lng < -165) return { name: 'Himawari-9', org: '日本气象厅', vis: 'Himawari_AHI_Band3_Red_Visible_1km', ir: 'Himawari_AHI_Band13_Clean_Infrared' };
    if (lng < -110) return { name: 'GOES-West', org: 'NOAA', vis: 'GOES-West_ABI_Band2_Red_Visible_1km', ir: 'GOES-West_ABI_Band13_Clean_Infrared' };
    if (lng < -15) return { name: 'GOES-East', org: 'NOAA', vis: 'GOES-East_ABI_Band2_Red_Visible_1km', ir: 'GOES-East_ABI_Band13_Clean_Infrared' };
    return null;
  }
  var SAT_FS = [
    'uniform sampler2D uA,uB; uniform float uMix,uIR,uFade; uniform vec3 uSun; varying vec2 vUv; varying vec3 vN;',
    'void main(){ vec4 c=mix(texture2D(uA,vUv),texture2D(uB,vUv),uMix);',
    ' float mx=max(c.r,max(c.g,c.b)), mn=min(c.r,min(c.g,c.b)), l=dot(c.rgb,vec3(.299,.587,.114)); float cl, b;',
    ' if(uIR>.5){ cl=max(smoothstep(.5,.85,l),smoothstep(.12,.3,mx-mn)); b=.75+.25*cl; }',   // 增强红外:灰度越亮越冷,彩色=最冷云顶
    ' else { cl=smoothstep(.14,.6,c.r); b=.45+.55*smoothstep(.1,.9,c.r); }',
    ' float lt=smoothstep(-.15,.3,dot(normalize(vN),uSun)); float sh=uIR>.5?(.45+.55*lt):(.08+.92*lt);',
    ' vec2 d=(vUv-.5)*2.; float e=1.-smoothstep(.7,1.,length(d));',
    ' gl_FragColor=vec4(vec3(b*sh),cl*e*c.a*uFade*.97); }'].join('\n');
  var SAT_VS = 'varying vec2 vUv; varying vec3 vN; void main(){ vUv=uv; vN=normalize((modelMatrix*vec4(position,0.)).xyz); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }';
  var SAT = {
    list: [],
    label: function (s) {
      var q = s.sat;
      if (!q) return '暂无(此处没有静止卫星覆盖),画面为示意';
      if (q.ok) return q.name + (q.ir ? ' 红外' : ' 可见光') + ' · ' + md(q.t0) + ' ' + hm(q.t0) + '–' + hm(q.t1) + '(本地时间)';
      if (q.fail) return '暂时取不到,画面为示意';
      return '加载中…';
    },
    load: function (S, U, grp, s) {
      var sat = pickSat(s.lng); if (!sat) return;
      var mob = innerWidth < 900, N = mob ? 9 : 18, step = (mob ? 20 : 10) * 6e4, px = mob ? 256 : 512;
      var la0 = Math.max(-85, s.lat - 8), la1 = Math.min(85, s.lat + 8), lo0 = Math.max(-180, s.lng - 8), lo1 = Math.min(180, s.lng + 8);
      var box = [la0, lo0, la1, lo1];
      var q = s.sat = { name: sat.name, org: sat.org, frames: [], ok: false };
      var base = Math.floor((Date.now() - 70 * 6e4) / 6e5) * 6e5, tries = 0;
      function isDay(t) { return U.ll(s.lat, s.lng, 1).dot(LE.earth.sunDir(new Date(t))) > 0.17; }   // 太阳高度约 10° 以上
      function first() {
        var t1 = base - tries * 18e5, t0 = t1 - (N - 1) * step;
        q.ir = !(isDay(t0) && isDay(t1));
        loadImg(gibs(q.ir ? sat.ir : sat.vis, box, px, iso(new Date(t1))), function (im) {
          if (!im) { if (++tries < 5) return first(); q.fail = true; console.warn('[eye] sat: no frames', sat.name); return; }
          q.t1 = new Date(t1); q.t0 = new Date(t1); add(im, t1); build();
          for (var i = 1; i < N; i++) (function (t) {
            loadImg(gibs(q.ir ? sat.ir : sat.vis, box, px, iso(new Date(t))), function (im2) { if (im2) { add(im2, t); if (t < q.t0) q.t0 = new Date(t); } });
          })(t1 - i * step);
        });
      }
      function add(im, t) {
        var tx = new THREE.Texture(im); tx.needsUpdate = true; tx.minFilter = THREE.LinearFilter; tx.generateMipmaps = false;
        q.frames.push({ t: t, tx: tx }); q.frames.sort(function (a, b) { return a.t - b.t; });
      }
      function build() {
        var G = 32, pos = [], uv = [], idx = [], v = new THREE.Vector3();
        for (var j = 0; j <= G; j++) for (var i = 0; i <= G; i++) {
          var la = la0 + (la1 - la0) * j / G, lo = lo0 + (lo1 - lo0) * i / G;
          U.ll(la, lo, 1.009, v); pos.push(v.x, v.y, v.z); uv.push(i / G, j / G);
        }
        for (j = 0; j < G; j++) for (i = 0; i < G; i++) { var a = j * (G + 1) + i, b = a + 1, c = a + G + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
        var g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
        var f0 = q.frames[0].tx;
        q.mat = new THREE.ShaderMaterial({ uniforms: { uA: { value: f0 }, uB: { value: f0 }, uMix: { value: 0 }, uIR: { value: q.ir ? 1 : 0 }, uFade: { value: 0 }, uSun: { value: LE.earth.sun } },
          vertexShader: SAT_VS, fragmentShader: SAT_FS, transparent: true, depthWrite: false, side: THREE.DoubleSide });
        q.mesh = new THREE.Mesh(g, q.mat); q.mesh.renderOrder = 2; grp.add(q.mesh);
        q.ok = true; s.mesh.visible = false;   // 有实拍就藏起示意云系(仍用它的位置做点选)
        q.badge = document.createElement('div'); q.badge.className = 'sh-satbadge';
        q.badge.style.cssText = 'position:fixed;z-index:5;pointer-events:none;font:600 11px/1.3 var(--cjk,sans-serif);color:#fff;background:rgba(6,10,24,.62);border:1px solid rgba(255,255,255,.18);padding:3px 7px;border-radius:4px;white-space:nowrap;display:none;letter-spacing:.04em';
        document.body.appendChild(q.badge); SAT.list.push(q); q.s = s;
      }
      first();
    },
    tick: function (S, vis) {
      var now = performance.now() / 1000, v = new THREE.Vector3();
      SAT.list.forEach(function (q) {
        var F = q.frames, n = F.length, u = q.mat.uniforms;
        u.uFade.value = Math.min(1, u.uFade.value + 0.02);
        if (n >= 2) {
          var fd = 6 / n, hold = 1.2, tot = n * fd + hold, tt = now % tot, i, j, m = 0;
          if (tt < (n - 1) * fd) { i = Math.floor(tt / fd); j = i + 1; var f = tt / fd - i; m = f < 0.55 ? 0 : (f - 0.55) / 0.45; }
          else { i = n - 1; j = 0; var r = tt - (n - 1) * fd, tail = fd + hold; m = r < tail - 0.4 ? 0 : (r - tail + 0.4) / 0.4; }
          u.uA.value = F[i].tx; u.uB.value = F[j].tx; u.uMix.value = m * m * (3 - 2 * m);
        }
        // 角标「卫星实拍 · 时段」跟着台风走
        var show = vis && S.mode === 'earth' && q.mesh.visible;
        if (show) { q.s.mesh.getWorldPosition(v); show = !S.occluded(v) && S.earthCam.position.length() < 6; }
        if (show) {
          var p = S.toScreen(v.clone().setLength(1.0), S.earthCam);
          if (p.behind) show = false; else { q.badge.style.left = (p.x + 18) + 'px'; q.badge.style.top = (p.y + 18) + 'px'; }
          var txt = '卫星实拍 · ' + q.name + ' · ' + hm(q.t0) + '–' + hm(q.t1);
          if (q.badge.textContent !== txt) q.badge.textContent = txt;
        }
        q.badge.style.display = show ? 'block' : 'none';
      });
    }
  };

  /* ---------- M1.8b 全球真实云图(云层开关「实拍」档) ---------- */
  var REAL = {
    init: function (S, U) {
      var E = LE.earth; if (!E || !E.clouds) return;
      var chip = document.querySelector('#chips [data-layer="clouds"]'); if (!chip) return;
      var orig = E.clouds.material, mode = 'fake', mat = null, day = '';
      var px = innerWidth < 900 ? 1024 : 2048;
      function setMode(m) {
        mode = m;
        if (m === 'real' && mat) E.clouds.material = mat; else E.clouds.material = orig;
        if (LE.ui.setLayer) LE.ui.setLayer('clouds', m !== 'off');
        chip.querySelector('small').textContent = m === 'real' ? '实拍 ' + day : m === 'fake' ? '示意' : 'CLOUDS';
      }
      chip.addEventListener('click', function (e) {
        if (!mat) return;   // 实拍没加载成功:沿用原来的开/关
        e.stopImmediatePropagation();
        var nx = mode === 'real' ? 'fake' : mode === 'fake' ? 'off' : 'real'; setMode(nx);
        if (LE.ui.toast) LE.ui.toast(nx === 'real' ? '云层:卫星实拍(VIIRS,' + day + ' 全球拼接)' : nx === 'fake' ? '云层:示意贴图' : '云层已关闭');
      }, true);
      S.addUpdater(function () { if (mode === 'real') E.clouds.rotation.y = 0; });   // 实拍云要和地理位置对齐,不漂移
      function tryDay(back) {
        var d = new Date(Date.now() - back * 864e5), ds = d.toISOString().slice(0, 10);
        new THREE.TextureLoader().setCrossOrigin('anonymous').load(gibs('VIIRS_NOAA20_CorrectedReflectance_TrueColor', [-90, -180, 90, 180], px, ds, 'image/jpeg'), function (tx) {
          day = ds.slice(5).replace(/^0/, '');
          mat = new THREE.ShaderMaterial({
            uniforms: { uMap: { value: tx }, uOld: { value: orig.uniforms.uMap.value }, uSun: { value: E.sun } },
            vertexShader: orig.vertexShader,
            fragmentShader: [
              'uniform sampler2D uMap,uOld; uniform vec3 uSun; varying vec2 vUv; varying vec3 vN;',
              'void main(){ vec3 c=texture2D(uMap,vUv).rgb; float mx=max(c.r,max(c.g,c.b)), mn=min(c.r,min(c.g,c.b));',
              ' float wh=smoothstep(.2,.85,mn)*(1.-smoothstep(.12,.4,(mx-mn)/max(mx,.01)));',   // 白而不艳 = 云(沙漠偏橙会被排除),边缘柔和
              ' float nod=1.-step(.025,mx);',   // 轨道缝隙没数据:用原示意云补上
              ' float a=mix(wh,texture2D(uOld,vUv).r*.7,nod);',
              ' float l=smoothstep(-.15,.35,dot(normalize(vN),uSun)); float g=mix(.78,1.,smoothstep(.3,.9,mn));',
              ' gl_FragColor=vec4(vec3(g)*(.04+.96*l),a*(.08+.72*l)); }'].join('\n'),
            transparent: true, depthWrite: false
          });
          setMode(E.clouds.visible ? 'real' : 'off'); EYE.realDay = ds;
        }, undefined, function () { if (back < 3) tryDay(back + 1); else console.warn('[eye] VIIRS clouds unavailable'); });
      }
      tryDay(1);
    }
  };


  /* ---------- 极光 ---------- */
  function initAurora(S, U) {
    var grp = EYE.ag = new THREE.Group(); S.earthScene.add(grp);
    function load() {
      fetch(URL_OV).then(function (r) { return r.json(); }).then(function (j) {
        // 1° 网格 → 连续的半透明壳面(只取 |纬度| ≥ 35°,极光只出现在高纬)
        var A = {}; (j.coordinates || []).forEach(function (c) { A[c[0] + ',' + c[1]] = c[2]; });
        var pos = [], al = [], idx = [], v = new THREE.Vector3(), rows = [], LAT = [];
        for (var la = -90; la <= 90; la++) if (Math.abs(la) >= 35) LAT.push(la);
        LAT.forEach(function (la, r) {
          for (var lo = 0; lo <= 360; lo++) { var lng = lo > 180 ? lo - 360 : lo; U.ll(la, lng, 1.016, v); pos.push(v.x, v.y, v.z); al.push(Math.min(1, (A[(lo % 360) + ',' + la] || 0) / 50)); }
        });
        for (var r = 0; r < LAT.length - 1; r++) { if (LAT[r + 1] - LAT[r] !== 1) continue; for (var k = 0; k < 360; k++) { var i0 = r * 361 + k, i1 = i0 + 1, i2 = i0 + 361, i3 = i2 + 1; idx.push(i0, i2, i1, i1, i2, i3); } }
        var g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('al', new THREE.Float32BufferAttribute(al, 1)); g.setIndex(idx);
        var mat = new THREE.ShaderMaterial({
          uniforms: { uT: { value: 0 }, uPR: { value: S.renderer.getPixelRatio() } },
          vertexShader: 'attribute float al; varying float vA; varying vec3 vP; void main(){ vA=al; vP=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
          fragmentShader: 'varying float vA; varying vec3 vP; uniform float uT; void main(){ float a=smoothstep(.06,.7,vA)*(.8+.2*sin(uT*1.5+vP.x*40.+vP.z*30.)); vec3 c=mix(vec3(.15,1.,.45),vec3(.85,.35,1.),smoothstep(.6,1.,vA)); gl_FragColor=vec4(c*a,a); }', side: THREE.DoubleSide,
          transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
        });
        grp.clear(); grp.add(new THREE.Mesh(g, mat)); EYE.amat = mat;
        EYE.ovTime = j['Forecast Time'] || ''; EYE.ovOk = true; chipNote();
      }).catch(function (e) { EYE.ovOk = false; chipNote(); console.warn('[eye] OVATION', e); });
      fetch(URL_KP).then(function (r) { return r.json(); }).then(function (j) {
        var last = j[j.length - 1]; EYE.kp = Array.isArray(last) ? +last[1] : +last.Kp; chipNote();
      }).catch(function () { });
    }
    load(); setInterval(load, 30 * 60 * 1000);
    S.addUpdater(function (dt, now) { if (EYE.amat) EYE.amat.uniforms.uT.value = now / 1000 % 1000; });
  }
  function kpText(k) { return k == null ? '' : 'Kp ' + k.toFixed(0) + (k >= 7 ? ' · 强磁暴,中纬度也可能看到' : k >= 5 ? ' · 磁暴,极光向南扩展' : k >= 4 ? ' · 较活跃' : ' · 平静'); }
  function auroraInfo() {
    LE.ui.showCard({ kind: 'aurora', color: '#5dff9a', kicker: '极光预报 · NOAA SWPC', title: '极光椭圆' + (EYE.kp != null ? ' · Kp ' + EYE.kp.toFixed(0) : ''),
      blurb: '太阳风里的带电粒子被地球磁场引向两极,撞上高层大气发光,就是极光。绿色越亮,未来一小时左右看到极光的可能越大。',
      rows: [['地磁活动', kpText(EYE.kp) || '加载中'], ['预报时刻', EYE.ovTime ? fmt(EYE.ovTime) : '—', 1], ['模型', 'OVATION Prime(每 5 分钟更新)']],
      actions: [{ label: '在 NOAA SWPC 查看 ↗', href: 'https://www.swpc.noaa.gov/products/aurora-30-minute-forecast' }] });
  }

  /* ---------- 图层开关(加到底部图层条) ---------- */
  var chips = {};
  function chipNote() {
    if (chips.storms) chips.storms.querySelector('small').textContent = EYE.tcOk === false ? '暂不可用' : EYE.tcOk ? (EYE.storms.length ? EYE.storms.length + ' 个进行中' : '当前无') : 'TYPHOON';
    if (chips.aurora) chips.aurora.querySelector('small').textContent = EYE.ovOk === false ? '暂不可用' : EYE.kp != null ? 'Kp ' + EYE.kp.toFixed(0) : 'AURORA';
  }
  function addChip(id, label, sub, col) {
    var bar = $('chips'); if (!bar) return;
    var b = document.createElement('button'); b.className = 'le-chip'; b.type = 'button'; b.dataset.eye = id;
    b.setAttribute('aria-pressed', 'true'); b.style.setProperty('--c', col); b.innerHTML = label + '<small>' + sub + '</small>';
    b.addEventListener('click', function () {
      var on = EYE.on[id] = !EYE.on[id]; b.setAttribute('aria-pressed', on ? 'true' : 'false');
      var g = id === 'storms' ? EYE.sg : EYE.ag; if (g) g.visible = on;
      if (on && id === 'aurora') auroraInfo();
      if (on && id === 'storms' && LE.ui.toast) LE.ui.toast(EYE.storms.length ? '点台风云系查看风速和等级' : '目前全球没有进行中的热带气旋');
    });
    bar.appendChild(b); chips[id] = b;
  }

  wait(function () { return window.READY && window.LE && LE.scene && LE.scene.earthScene && LE.ui && LE.ui.showCard; }, function () {
    var S = LE.scene, U = LE.util;
    addChip('storms', '台风', 'TYPHOON', '#ff8a1f'); addChip('aurora', '极光', 'AURORA', '#5dff9a');
    try { initStorms(S, U); } catch (e) { console.warn('[eye] storms', e); }
    try { initAurora(S, U); } catch (e) { console.warn('[eye] aurora', e); }
    try { REAL.init(S, U); } catch (e) { console.warn('[eye] real clouds', e); }
  });
})();
