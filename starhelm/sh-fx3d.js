/* 天枢 Starhelm · sh-fx3d.js · 3D 画面公共件(v1.0-M2c)— 规范见 docs/3D-VISUAL-RULES.md
 * SHFX3D.skyTexture(renderer)  高清星空:NASA SVS Deep Star Maps 2020(赤道坐标,8K/4K 按设备挑),失败退回 2K。
 * SHFX3D.skyMesh(renderer, r)  已按黄赤交角放好的星空球(场景坐标 x=春分点、y=黄道北)。
 * SHFX3D.upgradeSkies()        给母港地球场景与太阳系场景换上高清星空。
 * SHFX3D.sun(opts)             可复用的太阳:着色器米粒组织/黑子/临边昏暗 + 日冕射线 + 日珥粒子环 + 太阳风粒子。
 *                              返回 { group, core, update(dt, camera), dispose() }。减少动态时动画放慢到 1/4。
 */
(function () {
  'use strict';
  var T = window.THREE; if (!T) return;
  var EPS = 23.4393 * Math.PI / 180, cache = {};
  function reduced() { return matchMedia('(prefers-reduced-motion: reduce)').matches; }
  function pickSky(rd) {
    var max = rd && rd.capabilities ? rd.capabilities.maxTextureSize : 4096;
    var small = Math.min(screen.width, screen.height) < 700 || (navigator.deviceMemory && navigator.deviceMemory < 4);
    return (!small && max >= 8192) ? 'sky-8k.jpg' : 'sky-4k.jpg';
  }
  function skyTexture(rd) {
    var src = pickSky(rd); if (cache[src]) return cache[src];
    var tex = new T.Texture(); tex.encoding = T.sRGBEncoding;
    tex.anisotropy = rd && rd.capabilities ? Math.min(8, rd.capabilities.getMaxAnisotropy()) : 4;
    tex.minFilter = T.LinearMipmapLinearFilter; tex.magFilter = T.LinearFilter; tex.generateMipmaps = true;
    tex.ready = new Promise(function (res) {
      var img = new Image(); img.decoding = 'async';
      img.onload = function () { tex.image = img; tex.needsUpdate = true; res(tex); };
      img.onerror = function () {   // 退回旧 2K 贴图包
        var o = window.LE && LE.assets ? LE.assets.texture(LE.config.TEX.milkyway, true) : null;
        if (o && o.ready) o.ready.then(function (t2) { tex.image = t2.image; tex.needsUpdate = true; res(tex); }); else res(tex);
      };
      img.src = src;
    });
    cache[src] = tex; return tex;
  }
  function skyMesh(rd, r, tint) {
    var m = new T.Mesh(new T.SphereGeometry(r, 96, 48), new T.MeshBasicMaterial({ map: skyTexture(rd), side: T.BackSide, depthWrite: false, toneMapped: false, color: tint == null ? 0xb8bcc8 : tint }));
    // 贴图是赤道坐标:绕春分点轴转回黄道;scale.x=-1 让从球内看到的星座不镜像
    var g = new T.Group(); g.rotation.x = -EPS; m.scale.x = -1; g.add(m); g.renderOrder = -10; return g;
  }
  function upgradeSkies() {
    var S = window.LE && LE.scene; if (!S || !S.renderer) return;
    var tex = skyTexture(S.renderer);
    tex.ready.then(function () {
      [[S.earthScene, 0x55565e], [S.solarScene, 0x5a5b62]].forEach(function (p) {
        if (!p[0]) return;
        p[0].traverse(function (o) {
          var mt = o.material;
          if (o.isMesh && mt && mt.side === T.BackSide && mt.map && o.geometry && o.geometry.parameters && o.geometry.parameters.radius >= 200 && !mt.blending) {
            mt.map = tex; mt.color.setHex(p[1]); mt.needsUpdate = true;
          }
        });
      });
    });
  }

  /* ---------------- 太阳 ---------------- */
  var NOISE = [
    'vec3 m289(vec3 x){return x-floor(x*(1./289.))*289.;}vec4 m289(vec4 x){return x-floor(x*(1./289.))*289.;}',
    'vec4 perm(vec4 x){return m289(((x*34.)+1.)*x);}vec4 tis(vec4 r){return 1.79284291400159-.85373472095314*r;}',
    'float sn(vec3 v){const vec2 C=vec2(1./6.,1./3.);const vec4 D=vec4(0.,.5,1.,2.);vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);',
    'vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;',
    'i=m289(i);vec4 p=perm(perm(perm(i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));',
    'float n_=.142857142857;vec3 ns=n_*D.wyz-D.xzx;vec4 j=p-49.*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.*x_);',
    'vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.-abs(x)-abs(y);vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);',
    'vec4 s0=floor(b0)*2.+1.;vec4 s1=floor(b1)*2.+1.;vec4 sh=-step(h,vec4(0.));vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;',
    'vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);vec4 nr=tis(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));',
    'p0*=nr.x;p1*=nr.y;p2*=nr.z;p3*=nr.w;vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);m=m*m;',
    'return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));}',
    'float fbm(vec3 p){float a=.5,s=0.;for(int i=0;i<5;i++){s+=a*sn(p);p*=2.03;a*=.5;}return s;}'
  ].join('\n');
  function dotTex() {
    var c = document.createElement('canvas'); c.width = c.height = 64; var g = c.getContext('2d');
    var gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,255,255,.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new T.CanvasTexture(c);
  }
  function sun(o) {
    o = o || {}; var R = o.radius || 1, grp = new T.Group(), U = { t: { value: 0 } };
    // 1 光球:米粒组织 + 超米粒 + 少量黑子 + 临边昏暗
    var core = new T.Mesh(new T.SphereGeometry(R, 128, 64), new T.ShaderMaterial({
      uniforms: U,
      vertexShader: 'varying vec3 vP;varying vec3 vN;varying vec3 vV;void main(){vP=position;vN=normalize(normalMatrix*normal);vec4 mv=modelViewMatrix*vec4(position,1.);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',
      fragmentShader: 'uniform float t;varying vec3 vP;varying vec3 vN;varying vec3 vV;' + NOISE +
        'void main(){vec3 p=normalize(vP);float c1=1.-abs(sn(p*55.+vec3(0.,t*.06,t*.04)));float c2=1.-abs(sn(p*110.-vec3(t*.05)));' +
        'float gr=c1*c1*.7+c2*.3-.45;float sg=fbm(p*6.+t*.01);' +
        'float lat=abs(p.y);float band=smoothstep(.08,.2,lat)*(1.-smoothstep(.38,.5,lat));' +
        'float sv=sn(p*4.+vec3(5.1,0.,t*.002));float spot=band*smoothstep(.80,.86,sv);float pen=band*smoothstep(.70,.80,sv)*(1.-spot);' +
        'float mu=clamp(dot(vN,vV),0.,1.);float limb=pow(mu,.55);' +
        'float k=.58+.42*gr+.12*sg;k*=1.-.35*pen-.7*spot;' +
        'vec3 c=mix(vec3(.85,.28,.03),vec3(1.,.83,.45),k);c=mix(c,vec3(1.,.97,.86),pow(k,4.)*.8);' +
        'c*=.25+.85*limb;c+=vec3(1.,.45,.12)*pow(1.-mu,3.)*.35;gl_FragColor=vec4(c*.92,1.);}'
    }));
    grp.add(core);
    // 2 色球薄壳(边缘一圈橙红)
    var chromo = new T.Mesh(new T.SphereGeometry(R * 1.035, 96, 48), new T.ShaderMaterial({
      uniforms: U, transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.BackSide,
      vertexShader: 'varying vec3 vN;varying vec3 vV;void main(){vN=normalize(normalMatrix*normal);vec4 mv=modelViewMatrix*vec4(position,1.);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',
      fragmentShader: 'varying vec3 vN;varying vec3 vV;void main(){float f=1.-abs(dot(vN,vV));f=pow(f,5.);gl_FragColor=vec4(vec3(1.,.42,.18)*f*1.6,f);}'
    }));
    grp.add(chromo);
    // 3 日冕:面向镜头的平面,径向衰减 × 随角度变化的射线噪声
    var corona = new T.Mesh(new T.PlaneGeometry(R * 9, R * 9), new T.ShaderMaterial({
      uniforms: U, transparent: true, depthWrite: false, blending: T.AdditiveBlending,
      vertexShader: 'varying vec2 vU;void main(){vU=uv*2.-1.;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader: 'uniform float t;varying vec2 vU;' + NOISE +
        'void main(){float r=length(vU)*4.5;if(r<.98)discard;float a=atan(vU.y,vU.x);' +
        'float ray=fbm(vec3(cos(a)*3.,sin(a)*3.,t*.04))*.5+.5;ray=pow(ray,2.2);' +
        'float fall=exp(-(r-1.)*2.4);float halo=exp(-(r-1.)*.9)*.18;' +
        'float s=fall*(.35+1.4*ray)+halo;vec3 c=mix(vec3(1.,.55,.2),vec3(1.,.93,.8),fall);' +
        'gl_FragColor=vec4(c*s,s);}'
    }));
    corona.renderOrder = 2; grp.add(corona);
    // 4 日珥:沿磁力线弧流动的粒子
    var dt = dotTex(), arcs = [], NA = 9, PER = 260, pos = new Float32Array(NA * PER * 3), col = new Float32Array(NA * PER * 3), ph = new Float32Array(NA * PER);
    for (var a = 0; a < NA; a++) {
      var u = Math.random() * 2 - 1, th = Math.random() * Math.PI * 2, n = new T.Vector3(Math.sqrt(1 - u * u) * Math.cos(th), u, Math.sqrt(1 - u * u) * Math.sin(th));
      var tg = new T.Vector3().crossVectors(n, Math.abs(n.y) < 0.9 ? new T.Vector3(0, 1, 0) : new T.Vector3(1, 0, 0)).normalize();
      var w = 0.10 + Math.random() * 0.14, hgt = 0.10 + Math.random() * 0.22;
      arcs.push({ n: n, tg: tg, bn: new T.Vector3().crossVectors(n, tg), w: w, h: hgt, sp: 0.05 + Math.random() * 0.06 });
      for (var i = 0; i < PER; i++) { ph[a * PER + i] = Math.random(); var k = (a * PER + i) * 3; col[k] = 0.9; col[k + 1] = 0.22 + Math.random() * 0.16; col[k + 2] = 0.06; }
    }
    var pg = new T.BufferGeometry(); pg.setAttribute('position', new T.BufferAttribute(pos, 3)); pg.setAttribute('color', new T.BufferAttribute(col, 3));
    var prom = new T.Points(pg, new T.PointsMaterial({ size: R * 0.04, map: dt, vertexColors: true, transparent: true, depthWrite: false, blending: T.AdditiveBlending, sizeAttenuation: true, opacity: 0.32 }));
    grp.add(prom);
    // 5 太阳风:向外慢慢飘散的稀疏粒子
    var NW = o.wind === false ? 0 : 600, wp = new Float32Array(NW * 3), wd = [], wl = new Float32Array(NW);
    for (var j = 0; j < NW; j++) { var uu = Math.random() * 2 - 1, tt = Math.random() * 6.283, q = Math.sqrt(1 - uu * uu); wd.push([q * Math.cos(tt), uu, q * Math.sin(tt)]); wl[j] = Math.random(); }
    var wg = new T.BufferGeometry(); wg.setAttribute('position', new T.BufferAttribute(wp, 3));
    var wind = new T.Points(wg, new T.PointsMaterial({ size: R * 0.035, map: dt, color: 0xffd9a0, transparent: true, depthWrite: false, blending: T.AdditiveBlending, opacity: 0.55 }));
    if (NW) grp.add(wind);
    var tmp = new T.Vector3(), tmp2 = new T.Vector3();
    function update(dt0, cam) {
      var s = reduced() ? 0.25 : 1, d = dt0 * s; U.t.value += d;
      core.rotation.y += d * 0.02;
      if (cam) { corona.quaternion.copy(cam.quaternion); }
      for (var a = 0; a < NA; a++) {
        var A = arcs[a];
        for (var i = 0; i < PER; i++) {
          var id = a * PER + i, p = (ph[id] += d * A.sp) % 1, x = (p * 2 - 1);   // -1..1 沿弧
          var lift = A.h * (1 - x * x), off = A.w * x, j1 = Math.sin(id * 12.9898) * 0.02, j2 = Math.sin(id * 78.233) * 0.025;
          tmp.copy(A.n).multiplyScalar(R * (0.99 + lift + j1 * (0.4 + lift * 2))).addScaledVector(A.tg, R * off).addScaledVector(A.bn, R * j2);
          pos[id * 3] = tmp.x; pos[id * 3 + 1] = tmp.y; pos[id * 3 + 2] = tmp.z;
        }
      }
      pg.attributes.position.needsUpdate = true;
      for (var j = 0; j < NW; j++) {
        wl[j] = (wl[j] + d * 0.05) % 1; var r = R * (1.15 + wl[j] * 5);
        wp[j * 3] = wd[j][0] * r; wp[j * 3 + 1] = wd[j][1] * r; wp[j * 3 + 2] = wd[j][2] * r;
      }
      if (NW) { wg.attributes.position.needsUpdate = true; wind.material.opacity = 0.5; }
    }
    update(0.01);
    return { group: grp, core: core, update: update, dispose: function () { grp.traverse(function (x) { if (x.geometry) x.geometry.dispose(); if (x.material) x.material.dispose(); }); } };
  }

  /* ---------------- 星域 III:太阳系场景升级(v1.0-M2d) ---------------- */
  var solarDone = false;
  function loadTex(src, rd, srgb) {
    var t = new T.Texture(); if (srgb !== false) t.encoding = T.sRGBEncoding;
    t.anisotropy = rd ? Math.min(8, rd.capabilities.getMaxAnisotropy()) : 4;
    t.ready = new Promise(function (res, rej) { var im = new Image(); im.decoding = 'async'; im.onload = function () { t.image = im; t.needsUpdate = true; res(t); }; im.onerror = rej; im.src = src; });
    return t;
  }
  function hdOK(rd) {
    var small = Math.min(screen.width, screen.height) < 700 || (navigator.deviceMemory && navigator.deviceMemory < 4);
    return !small && rd && rd.capabilities.maxTextureSize >= 4096;
  }
  function ringParticles(b, rd) {   // 土星环:按真实环亮度(透明度贴图)分布的粒子
    var tilt = b.mesh.parent, ringMesh = null;
    tilt.children.forEach(function (c) { if (c.geometry && c.geometry.type === 'RingGeometry') ringMesh = c; });
    if (!ringMesh) return;
    var gp = ringMesh.geometry.parameters, rIn = gp.innerRadius, rOut = gp.outerRadius;
    var im = new Image();
    im.onload = function () {
      var cv = document.createElement('canvas'); cv.width = 512; cv.height = 1; var g = cv.getContext('2d'); g.drawImage(im, 0, 0, 512, 1);
      var px = g.getImageData(0, 0, 512, 1).data, cdf = [], sum = 0;
      for (var i = 0; i < 512; i++) { sum += px[i * 4 + 3] / 255 + 0.002; cdf.push(sum); }
      var N = hdOK(rd) ? 26000 : 9000, pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
      for (var k = 0; k < N; k++) {
        var u = Math.random() * sum, lo = 0, hi = 511; while (lo < hi) { var m = (lo + hi) >> 1; if (cdf[m] < u) lo = m + 1; else hi = m; }
        var f = (lo + Math.random()) / 512, r = rIn + f * (rOut - rIn), a = Math.random() * Math.PI * 2;
        pos[k * 3] = Math.cos(a) * r; pos[k * 3 + 1] = (Math.random() - 0.5) * (rOut - rIn) * 0.004; pos[k * 3 + 2] = Math.sin(a) * r;
        var c = 0.75 + Math.random() * 0.25; col[k * 3] = (px[lo * 4] / 255 * 0.6 + 0.4) * c; col[k * 3 + 1] = (px[lo * 4 + 1] / 255 * 0.6 + 0.36) * c; col[k * 3 + 2] = (px[lo * 4 + 2] / 255 * 0.6 + 0.3) * c;
      }
      var geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(pos, 3)); geo.setAttribute('color', new T.BufferAttribute(col, 3));
      var pts = new T.Points(geo, new T.PointsMaterial({ size: (rOut - rIn) * 0.012, map: dotTex(), vertexColors: true, transparent: true, opacity: 0.85, depthWrite: false, sizeAttenuation: true }));
      tilt.add(pts);
      // 环与粒子都接收土星本体的影子:从该点指向太阳(原点)的光线若穿过土星球体 → 变暗
      var SU = { uPC: { value: new T.Vector3() }, uPR: { value: b.R } };
      var SHADOW = 'uniform vec3 uPC;uniform float uPR;float shd(vec3 w){vec3 d=normalize(-w);vec3 oc=uPC-w;float tt=dot(oc,d);if(tt<0.)return 1.;float dd=length(oc-d*tt);return mix(.12,1.,smoothstep(uPR*.97,uPR*1.03,dd));}';
      var rtex = loadTex('hd/saturn-ring.png', rd);
      ringMesh.material = new T.ShaderMaterial({
        uniforms: { uMap: { value: rtex }, uPC: SU.uPC, uPR: SU.uPR }, transparent: true, depthWrite: false, side: T.DoubleSide,
        vertexShader: 'varying vec2 vU;varying vec3 vW;void main(){vU=uv;vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}',
        fragmentShader: 'uniform sampler2D uMap;varying vec2 vU;varying vec3 vW;' + SHADOW + 'void main(){vec4 c=texture2D(uMap,vec2(vU.x,.5));gl_FragColor=vec4(c.rgb*1.7*shd(vW),c.a*.85);}'
      });
      pts.material.onBeforeCompile = function (sh) {
        sh.uniforms.uPC = SU.uPC; sh.uniforms.uPR = SU.uPR;
        sh.vertexShader = 'varying vec3 vW2;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\n vW2=(modelMatrix*vec4(transformed,1.)).xyz;');
        sh.fragmentShader = 'varying vec3 vW2;\n' + SHADOW + '\n' + sh.fragmentShader.replace('#include <premultiplied_alpha_fragment>', 'gl_FragColor.rgb*=shd(vW2);\n#include <premultiplied_alpha_fragment>');
      };
      var S = LE.scene; S.addUpdater(function () { b.mesh.getWorldPosition(SU.uPC.value); });
    };
    im.src = 'hd/saturn-ring.png';
  }

  function jupiterExtras(SO, S) {   // 木星云带差速流动 + 伽利略四卫星(方向由 astronomy-engine JupiterMoons 实时计算,距离对数压缩)
    var b = SO.byId.jupiter; if (!b || !b.mesh) return;
    var m = b.mesh.material, uT = { value: 0 };
    if (m.isShaderMaterial && m.fragmentShader.indexOf('texture2D(uMap, vUv)') > 0) {
      m.uniforms.uT = uT;
      m.fragmentShader = 'uniform float uT;\n' + m.fragmentShader.replace('texture2D(uMap, vUv)', 'texture2D(uMap, vec2(vUv.x + (sin(vUv.y*40.)*0.0025 + sin(vUv.y*13.+1.)*0.004)*sin(uT*0.08), vUv.y))');
      m.needsUpdate = true;
    }
    var A = window.Astronomy, Rj = b.R, defs = [['木卫一 Io', 0xe8d27a, 421700, 0.286], ['木卫二 Europa', 0xd9cfbf, 671000, 0.245], ['木卫三 Ganymede', 0xa59a8c, 1070400, 0.413], ['木卫四 Callisto', 0x6f6558, 1882700, 0.378]];
    var moons = defs.map(function (d) {
      var mesh = new T.Mesh(new T.SphereGeometry(Rj * 0.09 * (d[3] / 0.3), 32, 16), new T.ShaderMaterial({
        uniforms: { uC: { value: new T.Color(d[1]) } },
        vertexShader: 'varying vec3 vN;varying vec3 vW;void main(){vN=normalize(mat3(modelMatrix)*normal);vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}',
        fragmentShader: 'uniform vec3 uC;varying vec3 vN;varying vec3 vW;void main(){float l=max(dot(normalize(vN),normalize(-vW)),0.);gl_FragColor=vec4(uC*(l*1.4+.06),1.);}'
      }));
      mesh.userData.r = Rj * (2 + 1.8 * Math.log(d[2] / 421700)); b.pivot.add(mesh); return mesh;
    });
    b.moons = moons;   // v1.0-M2f:供 sh-moons.js 点选
    var v = new T.Vector3(), last = 0;
    S.addUpdater(function () {
      if (S.mode !== 'solar') return; uT.value = performance.now() / 1000;
      var now = performance.now(); if (now - last < 200 || !A || !A.JupiterMoons) return; last = now;
      try {
        var t = A.MakeTime(new Date(SO.simTime || Date.now())), jm = A.JupiterMoons(t), rot = A.Rotation_EQJ_ECL();
        [jm.io, jm.europa, jm.ganymede, jm.callisto].forEach(function (st, i) {
          var e = A.RotateVector(rot, new A.Vector(st.x, st.y, st.z, t));
          v.set(e.x, e.z, -e.y).normalize().multiplyScalar(moons[i].userData.r); moons[i].position.copy(v);
        });
      } catch (x) { }
    });
  }
  function earthMoon4k(SO, S, rd) {
    var E = SO.byId.earth, Mo = SO.byId.moon;
    if (Mo && Mo.mesh && Mo.mesh.material.uniforms) { var mt = loadTex('hd/moon-4k.jpg', rd); mt.ready.then(function () { Mo.mesh.material.uniforms.uMap.value = mt; Mo.mesh.material.uniforms.uHas.value = 1; }).catch(function () { }); }
    if (!E || !E.mesh) return;
    var day = loadTex('hd/earth-day-4k.jpg', rd), night = loadTex('hd/earth-night-4k.jpg', rd), cl = loadTex('hd/earth-clouds-4k.jpg', rd, false);
    Promise.all([day.ready, night.ready]).then(function () {
      var R = E.mesh.geometry.parameters.radius;
      var mat = new T.ShaderMaterial({
        uniforms: { uDay: { value: day }, uNight: { value: night } },
        vertexShader: 'varying vec2 vUv;varying vec3 vN;varying vec3 vW;void main(){vUv=uv;vN=normalize(mat3(modelMatrix)*normal);vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}',
        fragmentShader: ['uniform sampler2D uDay,uNight;varying vec2 vUv;varying vec3 vN;varying vec3 vW;',
          'void main(){vec3 N=normalize(vN),L=normalize(-vW),V=normalize(cameraPosition-vW);float ndl=dot(N,L),mu=max(dot(N,V),0.);',
          ' vec3 d=texture2D(uDay,vUv).rgb, n=texture2D(uNight,vUv).rgb;',
          ' float dayK=smoothstep(-.08,.22,ndl);',
          ' vec3 col=d*(vec3(1.,.97,.92)*1.5*max(ndl,0.)+.03)*dayK + n*vec3(1.,.78,.45)*1.6*(1.-dayK);',
          ' vec3 H=normalize(L+V);float spec=pow(max(dot(N,H),0.),60.)*smoothstep(.25,.05,length(d-vec3(.05,.1,.2)))*dayK;col+=vec3(.9,.95,1.)*spec*.6;',
          ' float rim=pow(1.-mu,3.);col+=vec3(.35,.65,1.)*rim*(.2+.8*smoothstep(-.3,.4,ndl));',
          ' gl_FragColor=vec4(col,1.);}'].join('\n')
      });
      E.mesh.geometry.dispose(); E.mesh.geometry = new T.SphereGeometry(R, 96, 48);
      E.mesh.material.dispose(); E.mesh.material = mat;
      cl.ready.then(function () {
        var cm = new T.Mesh(new T.SphereGeometry(R * 1.012, 96, 48), new T.ShaderMaterial({
          uniforms: { uC: { value: cl } }, transparent: true, depthWrite: false,
          vertexShader: 'varying vec2 vUv;varying vec3 vN;varying vec3 vW;void main(){vUv=uv;vN=normalize(mat3(modelMatrix)*normal);vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}',
          fragmentShader: 'uniform sampler2D uC;varying vec2 vUv;varying vec3 vN;varying vec3 vW;void main(){float a=texture2D(uC,vUv).r;float ndl=dot(normalize(vN),normalize(-vW));float l=smoothstep(-.1,.3,ndl);gl_FragColor=vec4(vec3(1.)*(.08+1.1*max(ndl,0.)),a*.85*(.15+.85*l));}'
        }));
        E.mesh.add(cm); var last = performance.now();
        S.addUpdater(function () { var n = performance.now(); if (S.mode === 'solar') cm.rotation.y += (n - last) * 2e-6; last = n; });
      }).catch(function () { });
    }).catch(function () { });
  }
  function upgradeSolar() {
    var S = window.LE && LE.scene, SO = window.LE && LE.solar; if (solarDone || !S || !SO || !SO.byId || !SO.byId.sun) return false;
    solarDone = true; var rd = S.renderer, sc = S.solarScene;
    try {
      // 1 太阳:换成 SHFX3D 太阳,旧光晕精灵隐藏
      var sb = SO.byId.sun, fx = sun({ radius: sb.R || 3.2 });
      sb.mesh.material.transparent = true; sb.mesh.material.opacity = 0; sb.mesh.material.depthWrite = false;
      sc.children.forEach(function (o) { if (o.isSprite && o.position.lengthSq() < 1e-6) o.visible = false; });
      sc.add(fx.group); SHFX3D._solarSun = fx;
      var last = performance.now();
      S.addUpdater(function () { var n = performance.now(), dt = Math.min(0.1, (n - last) / 1000); last = n; if (S.mode === 'solar') fx.update(dt, S.solarCam); });
      // 2 高清行星贴图(桌面)
      if (hdOK(rd)) ['jupiter', 'saturn', 'mars', 'mercury', 'venus'].forEach(function (id) {
        var b = SO.byId[id]; if (!b || !b.mesh || !b.mesh.material.uniforms) return;
        var t = loadTex('hd/' + id + '-4k.jpg', rd);
        t.ready.then(function () { b.mesh.material.uniforms.uMap.value = t; b.mesh.material.uniforms.uHas.value = 1; }).catch(function () { });
      });
      // 2b 地球 / 月球 4K(v1.0-M2g):地球昼夜着色(夜面城市灯光辉光)+ 云层 + 大气;月球 4K
      if (hdOK(rd)) try { earthMoon4k(SO, S, rd); } catch (e) { console.warn('[SHFX3D] earth4k', e); }
      // 3 土星粒子环
      if (SO.byId.saturn) ringParticles(SO.byId.saturn, rd);
      jupiterExtras(SO, S);
      // 4 小行星带/柯伊伯带改用软圆点
      var dt0 = dotTex();
      sc.children.forEach(function (o) { if (o.isPoints && o.material && !o.material.map && o.material.size === 1.6) { o.material.map = dt0; o.material.size = 2.4; o.material.needsUpdate = true; } });
    } catch (e) { console.warn('[SHFX3D] 太阳系升级失败', e); }
    return true;
  }
  window.SHFX3D = { skyTexture: skyTexture, skyMesh: skyMesh, upgradeSkies: upgradeSkies, sun: sun, upgradeSolar: upgradeSolar, EPS: EPS };
  // 母港与太阳系场景就绪后自动换高清星空
  (function w(k) { if (window.SH_READY && window.LE && LE.scene && LE.scene.renderer) { try { upgradeSkies(); LE.scene.addUpdater(function () { if (!solarDone && LE.scene.mode === 'solar') upgradeSolar(); }); } catch (e) { console.warn('[SHFX3D] 星空升级失败', e); } return; } if (k < 600) setTimeout(function () { w(k + 1); }, 150); })(0);
})();
