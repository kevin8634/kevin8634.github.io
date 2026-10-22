/* 天枢 Starhelm · sh-moons.js(v1.0-M2f)—— 星域 III 卫星可点选
 * 伽利略四卫星(sh-fx3d.js 创建,方向由 astronomy-engine JupiterMoons 实时计算)+ 新增土卫六 Titan(大气辉光;位置为示意,周期真实)。
 * 点卫星 / 卫星标签 → 1.0 此刻卡(绕谁转、大小、离母星、绕一圈、看点;离地球与光行时取母星此刻值);按钮:飞近 / 回到母星。
 * 数据:NASA Solar System Exploration 公开数值(半径、轨道半长轴、周期)。距离在画面中做了对数压缩,卡片数值为真实值。 */
(function () {
  'use strict';
  var SATS = {
    io:       { zh: '木卫一', en: 'Io', p: 'jupiter', r: 1821.6, a: 421700, per: 1.769, fact: '太阳系火山最活跃的天体,400 多座火山在喷发', q: '木卫一被木星和邻居们拉来扯去,内部被「揉」热了。你猜它的火山为什么停不下来?' },
    europa:   { zh: '木卫二', en: 'Europa', p: 'jupiter', r: 1560.8, a: 671034, per: 3.551, fact: '冰壳下很可能藏着一片全球海洋', q: '木卫二表面是冰,冰下可能是海。离太阳那么远,海水为什么没冻住?' },
    ganymede: { zh: '木卫三', en: 'Ganymede', p: 'jupiter', r: 2634.1, a: 1070412, per: 7.155, fact: '太阳系最大的卫星,比水星还大,自带磁场', q: '木卫三比水星还大,却只能叫「卫星」。行星和卫星到底按什么分?' },
    callisto: { zh: '木卫四', en: 'Callisto', p: 'jupiter', r: 2410.3, a: 1882709, per: 16.689, fact: '表面布满撞击坑,是太阳系最古老的地表之一', q: '木卫四的坑一个叠一个。为什么它的「伤疤」几十亿年都没被抹平?' },
    titan:    { zh: '土卫六', en: 'Titan', p: 'saturn', r: 2574.7, a: 1221870, per: 15.945, fact: '唯一有浓厚大气的卫星,地面有液态甲烷湖海', q: '土卫六下的「雨」是甲烷。那里的河流和湖泊,和地球的有什么一样、有什么不同?', mock: true }
  };
  var ORDER = ['io', 'europa', 'ganymede', 'callisto'];
  var PZH = { jupiter: '木星', saturn: '土星' };

  function fmtInt(n) { return Math.round(n).toLocaleString('en-US'); }
  function patchCard() {
    var orig = SHNOW.card;
    SHNOW.SATS = SATS;
    SHNOW.card = function (el, body, d) {
      var s = SATS[body]; if (!s) return orig(el, body, d);
      d = d || (window.SHTIME ? SHTIME.now() : new Date());
      var P = SHNOW.planet(d, s.p);
      var o = { id: body, name: s.zh, en: s.en, distKm: P.distKm, sunAU: P.sunAU, source: s.mock ? 'NASA 公开数据 · 画面位置为示意' : 'NASA 公开数据 · 方向由 astronomy-engine 实时计算' };
      var rows = [['绕着', PZH[s.p] + '转'], ['半径', fmtInt(s.r) + ' km(月球 1,737 km)'], ['离' + PZH[s.p], fmtInt(s.a) + ' km'], ['绕一圈', s.per.toFixed(s.per < 10 ? 2 : 1) + ' 天'], ['看点', s.fact]];
      var h = '<div class="shnow-h"><b>' + o.name + '</b><small>' + o.en + '</small></div>';
      rows.forEach(function (r) { h += '<div class="shnow-r"><span>' + r[0] + '</span><span>' + r[1] + '</span></div>'; });
      h += '<div class="shnow-s">' + o.source + ' · 离地球与光行时取' + PZH[s.p] + '此刻值</div>';
      el.innerHTML = h; return o;
    };
  }

  function init() {
    var T = THREE, S = LE.scene, SO = LE.solar, J = SO.byId.jupiter, Sa = SO.byId.saturn;
    var meshes = {};
    ORDER.forEach(function (id, i) { if (J.moons && J.moons[i]) { meshes[id] = J.moons[i]; J.moons[i].userData.sat = id; } });
    // 土卫六:橙色雾霭球 + 大气辉光
    if (Sa && Sa.pivot) {
      var Rs = Sa.R, tm = new T.Mesh(new T.SphereGeometry(Rs * 0.13, 32, 16), new T.ShaderMaterial({
        uniforms: { uC: { value: new T.Color(0xd9a54a) } },
        vertexShader: 'varying vec3 vN;varying vec3 vW;void main(){vN=normalize(mat3(modelMatrix)*normal);vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}',
        fragmentShader: 'uniform vec3 uC;varying vec3 vN;varying vec3 vW;void main(){vec3 n=normalize(vN);float l=max(dot(n,normalize(-vW)),0.);vec3 v=normalize(cameraPosition-vW);float rim=pow(1.-max(dot(n,v),0.),2.5);gl_FragColor=vec4(uC*(l*1.25+.08)+vec3(1.,.62,.25)*rim*.9,1.);}'
      }));
      var cv = document.createElement('canvas'); cv.width = cv.height = 64; var x = cv.getContext('2d'), g = x.createRadialGradient(32, 32, 8, 32, 32, 32);
      g.addColorStop(0, 'rgba(255,170,80,.55)'); g.addColorStop(1, 'rgba(255,140,60,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64);
      var halo = new T.Sprite(new T.SpriteMaterial({ map: new T.CanvasTexture(cv), transparent: true, depthWrite: false, blending: T.AdditiveBlending }));
      halo.scale.setScalar(Rs * 0.42); tm.add(halo);
      tm.userData.sat = 'titan'; tm.userData.r = Rs * 4.4; Sa.pivot.add(tm); meshes.titan = tm;
    }
    // 真实表面贴图(靠近母星时才加载):USGS/NASA 公开地图;木卫二/木卫四/土卫六为灰度原图按真实色调着色
    var MOB = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) || Math.min(screen.width, screen.height) < 700;
    var RIM = { io: [1, .8, .35], europa: [.75, .85, 1], ganymede: [.7, .8, 1], callisto: [.6, .7, .9], titan: [1, .62, .25] };
    var texLoaded = {};
    function texMat(id) {
      var rim = RIM[id];
      return new T.ShaderMaterial({
        uniforms: { uMap: { value: null }, uRim: { value: new T.Vector3(rim[0], rim[1], rim[2]) }, uK: { value: id === 'titan' ? 1.1 : 0.45 } },
        vertexShader: 'varying vec3 vN;varying vec3 vW;varying vec2 vUv;void main(){vUv=uv;vN=normalize(mat3(modelMatrix)*normal);vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}',
        fragmentShader: 'uniform sampler2D uMap;uniform vec3 uRim;uniform float uK;varying vec3 vN;varying vec3 vW;varying vec2 vUv;void main(){vec3 n=normalize(vN);float l=max(dot(n,normalize(-vW)),0.);vec3 v=normalize(cameraPosition-vW);float rim=pow(1.-max(dot(n,v),0.),3.);vec3 c=texture2D(uMap,vUv).rgb;gl_FragColor=vec4(c*(smoothstep(0.,.35,l)*1.15+.04)+uRim*rim*uK*(.25+l),1.);}'
      });
    }
    function loadTex(id) {
      if (texLoaded[id]) return; texLoaded[id] = true;
      new T.TextureLoader().load('hd/moons/' + id + (MOB ? '-1k' : '-2k') + '.jpg', function (tx) {
        if ('colorSpace' in tx) tx.colorSpace = T.SRGBColorSpace; else tx.encoding = T.sRGBEncoding;
        tx.anisotropy = 4; var m = meshes[id], mat = texMat(id); mat.uniforms.uMap.value = tx;
        m.geometry.dispose(); m.geometry = new T.SphereGeometry(m.userData.R0, 64, 32); m.material.dispose(); m.material = mat;
      }, undefined, function () { texLoaded[id] = false; });
    }
    Object.keys(meshes).forEach(function (id) { meshes[id].userData.R0 = meshes[id].geometry.parameters.radius; });
    // 标签
    var box = SO.labels || document.getElementById('solar-labels'), labels = {};
    Object.keys(meshes).forEach(function (id) {
      var el = document.createElement('button'); el.type = 'button'; el.className = 'le-plabel sh-satlabel'; el.textContent = SATS[id].zh;
      el.style.visibility = 'hidden'; el.addEventListener('click', function () { open(id); }); box.appendChild(el); labels[id] = el;
    });
    var wp = new T.Vector3(), pp = new T.Vector3(), t0 = Date.UTC(2026, 0, 1);
    S.addUpdater(function () {
      var on = S.mode === 'solar';
      if (meshes.titan) {   // 示意位置:真实周期 15.945 天匀速
        var days = ((SO.simTime || Date.now()) - t0) / 864e5, ang = days / 15.945 * Math.PI * 2;
        meshes.titan.position.set(Math.cos(ang) * meshes.titan.userData.r, 0, -Math.sin(ang) * meshes.titan.userData.r);
      }
      Object.keys(meshes).forEach(function (id) {
        var el = labels[id], m = meshes[id], par = SO.byId[SATS[id].p];
        if (!on) { el.style.visibility = 'hidden'; return; }
        m.getWorldPosition(wp); par.pivot.getWorldPosition(pp);
        var near = S.solarCam.position.distanceTo(pp) < par.R * 30;
        if (near) loadTex(id);
        wp.project(S.solarCam);
        var show = near && wp.z < 1 && Math.abs(wp.x) < 1.05 && Math.abs(wp.y) < 1.05;
        el.style.visibility = show ? 'visible' : 'hidden';
        if (show) el.style.transform = 'translate(' + Math.round((wp.x + 1) / 2 * innerWidth + 8) + 'px,' + Math.round((1 - wp.y) / 2 * innerHeight - 10) + 'px)';
      });
    });
    // 点选:优先于行星(卫星挨着母星时更难点中)
    var tmp = new T.Vector3();
    S.addPicker({ mode: 'solar', priority: 2, fn: function (ray) {
      var best = null, o = ray.ray.origin, d = ray.ray.direction;
      Object.keys(meshes).forEach(function (id) {
        meshes[id].getWorldPosition(tmp); tmp.sub(o); var dist = tmp.length();
        var ang = Math.acos(Math.max(-1, Math.min(1, tmp.dot(d) / dist))), R = meshes[id].userData.R0;
        var tol = Math.max(Math.atan(R * 1.6 / dist), 0.018);
        if (ang < tol && (!best || ang / tol < best.k)) best = { id: id, k: ang / tol };
      });
      return best && { score: 2.3 - best.k, run: function () { open(best.id); } };
    } });
    function open(id) {
      var s = SATS[id];
      if (LE.ui.closeCard) LE.ui.closeCard();
      SHHUD.showNow(id, null, ['飞近 ' + s.zh, '回到' + PZH[s.p]]);
      SHHUD.guide('suixing', s.q, []);
      if (window.SHDOM && SHDOM.setFocus) SHDOM.setFocus(s.p);
      if (LE.audio && LE.audio.play) LE.audio.play('lock');
    }
    SHHUD.on('fly', function (b) {
      var m = meshes[b]; if (!m) return;
      SO.follow = null; m.getWorldPosition(wp);
      var R = m.userData.R0, dir = S.solarCam.position.clone().sub(wp).normalize();
      S.flyTo({ target: wp.clone(), position: wp.clone().add(dir.multiplyScalar(R * 7)), ms: 1800, arc: false });
      S.solarCtl.minDistance = R * 1.5;
    });
    SHHUD.on('zoomout', function (b) { if (SATS[b]) { SHHUD.hideNow(); SO.select(SATS[b].p); } });
    window.SHMOONS = { open: open, meshes: meshes, SATS: SATS };
  }

  (function wait(k) {
    var LEo = window.LE;
    if (window.SHNOW && SHNOW.ok && !SHNOW.SATS) patchCard();
    if (LEo && LEo.solar && LEo.solar.byId && LEo.solar.byId.jupiter && LEo.solar.byId.jupiter.moons && window.SHHUD && SHHUD.on && SHNOW.SATS) {
      try { init(); } catch (e) { console.error('[SHMOONS]', e); } return;
    }
    if (k > 3000) return; setTimeout(function () { wait(k + 1); }, 200);
  })(0);
})();
