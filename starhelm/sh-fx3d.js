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
      [[S.earthScene, 0x55565e], [S.solarScene, 0x4a4b52]].forEach(function (p) {
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
  window.SHFX3D = { skyTexture: skyTexture, skyMesh: skyMesh, upgradeSkies: upgradeSkies, sun: sun, EPS: EPS };
  // 母港与太阳系场景就绪后自动换高清星空
  (function w(k) { if (window.SH_READY && window.LE && LE.scene && LE.scene.renderer) { try { upgradeSkies(); } catch (e) { console.warn('[SHFX3D] 星空升级失败', e); } return; } if (k < 600) setTimeout(function () { w(k + 1); }, 150); })(0);
})();
