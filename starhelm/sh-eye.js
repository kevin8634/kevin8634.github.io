/* 天枢 Starhelm · M1.8a 地球之眼:台风 + 极光
 * 热带气旋:GDACS(欧盟委员会联合研究中心 & 联合国 OCHA)事件列表,只显示「进行中」的气旋,点开看风速与等级。
 * 极光:NOAA SWPC OVATION 极光预报(约 30–90 分钟后的极光出现概率)+ 行星 Kp 指数。
 * 两个数据源都允许跨域(CORS *)。失败时图层安静地显示「暂不可用」,不影响其他功能。 */
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
      EYE.tcOk = true; chipNote();
    }).catch(function (e) { EYE.tcOk = false; chipNote(); console.warn('[eye] GDACS', e); });
    S.addUpdater(function (dt) { if (!grp.visible) return; var t = performance.now() / 1000; grp.children.forEach(function (m) { m.material.uniforms.uT.value = t; }); });
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
      blurb: '台风是热带海洋上旋转的巨大低气压。地球自转让它在北半球逆时针转、南半球顺时针转。',
      rows: [['最大风速', Math.round(s.wind) + ' km/h', 1], ['等级', grade(s.wind) + '(按中国国家标准换算)'], ['生成时间', fmt(s.from) + '(本地时间)', 1], ['最近更新', fmt(s.to) + '(本地时间)', 1], ['中心位置', Math.abs(s.lat).toFixed(1) + '°' + (s.lat >= 0 ? 'N' : 'S') + ' ' + Math.abs(s.lng).toFixed(1) + '°' + (s.lng >= 0 ? 'E' : 'W'), 1]],
      actions: [{ label: '在 GDACS 查看路径 ↗', href: s.url }] });
  }

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
  });
})();
