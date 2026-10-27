/* 天枢 Starhelm · 2.0 穿梭 C1.4 · sh-x-fx.js(SHXFX)三引擎电影化特效(后期屏幕空间)
 * 只用于三种引擎,全部标「电影化示意」,不代表真实观感:
 *  1 近光速航行(推断):星光像差 —— 星场向前方聚拢,星球由圆被径向压成椭圆的空间拉扯;色差 + 前蓝后红多普勒色调;径向拉丝只作辅助
 *  2 曲率驱动(猜想):空间折叠 —— 中心透镜凸起 + 同心透镜波纹 + 轻微扭转,曲率泡边缘一圈蓝白折射光
 *  3 虫洞(猜想):隧道穿越 —— 极坐标程序隧道(蓝白 + 金色流纹)环绕,喉口里是放大的目的地星场
 * 驾驶舱主场景先画到离屏 RT,再由这里一次全屏 pass 输出。强度 k 由 sh-x-ship.js 按引擎启停平滑升降;k=0 时完全不走 RT。
 * 无 WebGL / 渲染目标创建失败:静默跳过(驾驶舱照常直出)。prefers-reduced-motion:强度 ×0.45、波纹不动。 */
(function () {
  'use strict';
  var T, rt = null, q = null, sc = null, cam = null, mat = null, ok = true;
  var st = { mode: 0, k: 0, tk: 0, t: 0, label: '', last: 0 }, tag = null;
  var red = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var FS = [
    'varying vec2 vUv; uniform sampler2D tD; uniform float mode, k, t, asp;',
    'float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
    'float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1.,0.)),f.x),mix(h(i+vec2(0.,1.)),h(i+vec2(1.,1.)),f.x),f.y);}',
    'vec2 U(vec2 c){return clamp(c*vec2(1./asp,1.)+.5,0.001,0.999);}',
    'void main(){',
    ' vec2 c=(vUv-.5)*vec2(asp,1.); float r=length(c); vec2 d=r>1e-5?c/r:vec2(0.); vec3 col;',
    ' if(mode<1.5){',
    '  float a=1.0*k; float g=1.+a*r+1.7*a*r*r; vec3 s;',
    '  s.r=texture2D(tD,U(d*r*g*1.035)).r; s.g=texture2D(tD,U(d*r*g)).g; s.b=texture2D(tD,U(d*r*g*.965)).b;',
    '  vec3 sk=vec3(0.); for(int i=1;i<7;i++){float fi=float(i); sk+=texture2D(tD,U(d*r*g*(1.+fi*.014*k))).rgb;} sk/=6.;',
    '  col=mix(s,max(s,sk),.35*k);',
    '  vec2 eu=abs(d*r*g*vec2(1./asp,1.)); float eg=smoothstep(.54,.26,max(eu.x,eu.y));',
    '  float an=atan(c.y,c.x); float ln=pow(vn(vec2(an*90.,r*3.-t*4.)),14.)*smoothstep(.2,.7,r)*.9;',
    '  col=mix(col,vec3(.03,.04,.08)+vec3(1.,.55,.4)*ln,(1.-eg)*k);',
    '  vec3 tint=mix(vec3(.78,.92,1.32),vec3(1.28,.78,.62),smoothstep(.12,.8,r)); col*=mix(vec3(1.),tint,.55*k);',
    '  col+=vec3(.45,.7,1.)*k*.32*exp(-r*r*34.);',
    ' } else if(mode<2.5){',
    '  float rip=sin(r*46.-t*5.)*exp(-pow((r-.42)*3.2,2.))+.6*sin(r*90.-t*8.)*exp(-pow((r-.24)*5.,2.));',
    '  float bul=1.-.38*k*exp(-r*r*7.); float ang=.35*k*exp(-r*r*5.); float ca=cos(ang),sa=sin(ang);',
    '  vec2 w=d*(r*bul+rip*.018*k); w=vec2(ca*w.x-sa*w.y,sa*w.x+ca*w.y); vec2 o=d*.004*k;',
    '  col=vec3(texture2D(tD,U(w+o)).r,texture2D(tD,U(w)).g,texture2D(tD,U(w-o)).b);',
    '  col+=vec3(.45,.6,1.)*max(rip,0.)*k*.16;',
    '  col+=vec3(.55,.72,1.)*k*.26*exp(-pow((r-.47)*14.,2.));',
    ' } else {',
    '  float an=atan(c.y,c.x); float z=.22/max(r,.02)+t*1.6; float sw=an/6.2832+.08/max(r,.05)+t*.05;',
    '  float n=vn(vec2(sw*28.,z*3.))*vn(vec2(sw*9.+3.,z*1.2)); float sk=pow(n,3.)*3.2;',
    '  vec3 tc=mix(vec3(.35,.55,1.),vec3(1.,.8,.5),vn(vec2(sw*5.,z*.5)))*sk;',
    '  vec3 sc=texture2D(tD,U(d*r*(1.-.45*k*exp(-r*r*12.)))).rgb;',
    '  float tun=k*smoothstep(.07,.24,r);',
    '  col=mix(sc,sc*.35+tc,tun);',
    '  col+=vec3(.6,.75,1.)*k*.5*exp(-pow((r-.13)*18.,2.));',
    '  col*=1.-k*.4*smoothstep(.5,.95,r);',
    ' }',
    ' gl_FragColor=vec4(col,1.);',
    '}'].join('\n');
  function init(rd) {
    T = window.THREE; if (!T || !T.WebGLRenderTarget || !T.ShaderMaterial) { ok = false; return false; }
    try {
      rt = new T.WebGLRenderTarget(4, 4, { samples: rd.capabilities && rd.capabilities.isWebGL2 ? 4 : 0, depthBuffer: true });
      mat = new T.ShaderMaterial({ uniforms: { tD: { value: rt.texture }, mode: { value: 1 }, k: { value: 0 }, t: { value: 0 }, asp: { value: 1 } },
        vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }', fragmentShader: FS, depthTest: false, depthWrite: false });
      q = new T.Mesh(new T.PlaneGeometry(2, 2), mat); q.frustumCulled = false;
      sc = new T.Scene(); sc.add(q); cam = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    } catch (e) { ok = false; return false; }
    return true;
  }
  function showTag() {
    if (!tag) { tag = document.createElement('div'); tag.id = 'xfx-tag'; tag.style.cssText = 'position:absolute;left:50%;top:104px;transform:translateX(-50%);z-index:30;pointer-events:none;font:12px/1.4 system-ui,sans-serif;letter-spacing:.12em;color:#cfe3ff;background:rgba(8,14,30,.55);border:1px solid rgba(150,190,255,.3);border-radius:12px;padding:3px 12px;opacity:0;transition:opacity .6s'; var host = (window.SHXC && SHXC._ && SHXC._.root && SHXC._.root()) || document.body; host.appendChild(tag); }
    tag.textContent = st.label; tag.style.opacity = st.tk > 0 ? '1' : '0';
  }
  window.SHXFX = {
    /* ship 侧:set(1|2|3, '近光速航行(推断)') 开;set(0) 关(平滑淡出) */
    set: function (mode, label) {
      st.k0 = st.k; st.t0 = performance.now();
      if (mode) { st.mode = mode; st.label = '电影化示意 · ' + (label || ''); st.tk = red ? .45 : 1; } else st.tk = 0;
      try { showTag(); } catch (e) { }
    },
    state: function () { return { mode: st.mode, k: +st.k.toFixed(3), tk: st.tk, ok: ok }; },
    active: function () { return ok && (st.k > 0.002 || st.tk > 0); },
    /* cockpit 侧:渲染前 begin(rd) 把输出改到 RT;渲染后 end(rd, dt) 全屏 pass 上屏 */
    begin: function (rd) {
      if (!ok || !(st.k > 0.002 || st.tk > 0)) { st.last = 0; return false; }
      if (!rt && !init(rd)) return false;
      var v = rd.getDrawingBufferSize(new T.Vector2()); if (rt.width !== v.x || rt.height !== v.y) rt.setSize(v.x, v.y);
      rd.setRenderTarget(rt); return true;
    },
    end: function (rd, dt) {
      rd.setRenderTarget(null);
      var now = performance.now(); dt = st.last ? Math.min(.25, (now - st.last) / 1000) : dt; st.last = now;   // 墙钟时间:低帧率也按秒升降
      var u = Math.min(1, (now - (st.t0 || now)) / (st.tk > st.k0 ? 2200 : 1400)); u = u * u * (3 - 2 * u); st.k = st.k0 + (st.tk - st.k0) * u; if (st.tk === 0 && u >= 1) st.k = 0;   // 按墙钟时间平滑升(2.2 s)降(1.4 s)
      if (!red) st.t += dt;
      var v = rd.getDrawingBufferSize(new T.Vector2());
      mat.uniforms.mode.value = st.mode; mat.uniforms.k.value = st.k; mat.uniforms.t.value = st.t; mat.uniforms.asp.value = v.x / Math.max(1, v.y);
      rd.clear(); rd.render(sc, cam);
    }
  };
})();
