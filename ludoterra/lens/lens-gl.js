/* 觉弈 Ludoterra 2.0 · 心之透镜 —— 透镜玻璃 / 粗光线 / 辉光后期(原生 three,无 React,零外部请求)
 *
 * 1) makeLensGlass:屏幕空间透射玻璃。思路改写自 pmndrs/drei MeshTransmissionMaterial(MIT,
 *    github.com/pmndrs/drei src/core/MeshTransmissionMaterial.tsx),经由本站 /life-source/recode/glass.js 的改写版再改:
 *    先把「玻璃后面的街」渲到一张缓冲,玻璃表面按折射光线出射点投影取样;R/G/B 三个折射率分开取样 = 色散;
 *    噪声抖动 = 模糊;厚度 + 比尔定律衰减 = 琥珀色。本版加「偏差」放大取样偏移,用来让街在镜片里真的变形。
 *    基准参照 three.js 官方示例 webgl_materials_physical_transmission(MIT)。
 * 2) makeFatLines:屏幕空间等宽粗线。思路改写自 three.js examples/jsm/lines/LineMaterial.js(MIT,
 *    官方示例 webgl_lines_fat):每段线一个实例四边形,在 NDC 里沿法向按像素宽度展开。只保留实线 + 软边 + 生长参数。
 * 3) makePost:辉光后期。思路改写自 three.js examples/jsm/postprocessing/UnrealBloomPass.js(MIT,
 *    官方示例 webgl_postprocessing_unreal_bloom):亮度阈值 → 逐级降采样高斯模糊 → 加权合成;最后一步做 ACES 色调映射与 sRGB。
 *    三者均为本项目自写的精简实现,不含上游源码文件。 */

export function makeLensGlass(THREE, o = {}) {
  return new THREE.ShaderMaterial({
    defines: { SAMPLES: o.samples ?? 6 },
    transparent: true, depthWrite: true,
    uniforms: {
      uBuffer: { value: null }, uTime: { value: 0 },
      uIor: { value: 1.35 }, uThick: { value: 0.6 }, uChroma: { value: 0.05 }, uBlur: { value: 0.06 },
      uIrid: { value: 0.5 }, uWarp: { value: 0.4 },
      uTint: { value: new THREE.Color('#fff2dc') }, uAtten: { value: new THREE.Color('#ffb04a') }, uRim: { value: new THREE.Color('#ffd9a0') },
      uAmber: { value: 0.5 }
    },
    vertexShader: /* glsl */`
      varying vec3 vW; varying vec3 vN; varying vec3 vVN; varying vec3 vL;
      void main(){
        vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; vL = position;
        vN = normalize(mat3(modelMatrix) * normal); vVN = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */`
      uniform mat4 projectionMatrix;
      uniform sampler2D uBuffer; uniform float uTime, uIor, uThick, uChroma, uBlur, uIrid, uWarp, uAmber;
      uniform vec3 uTint, uAtten, uRim;
      varying vec3 vW; varying vec3 vN; varying vec3 vVN; varying vec3 vL;
      float hash(vec2 p){ p = fract(p*vec2(123.34,456.21)); p += dot(p,p+45.32); return fract(p.x*p.y); }
      vec2 proj(vec3 p){ vec4 c = projectionMatrix * viewMatrix * vec4(p,1.0); return clamp(c.xy/c.w*.5+.5, .001, .999); }
      vec3 film(float x){ return .5+.5*cos(6.2832*(vec3(0.,.33,.67)+x)); }   // 薄膜干涉的简化色带
      void main(){
        vec3 n = normalize(vN); vec3 v = normalize(cameraPosition - vW);
        float nv = clamp(dot(n,v),0.0,1.0);
        float F = .04 + .96*pow(1.0-nv,4.0);
        vec3 tr = vec3(0.0);
        float th = uThick * (1.0 + uWarp * 2.5 * (1.0 - nv));       // 偏差越大,边缘越「厚」,街在镜片里弯得越多
        for (int i = 0; i < SAMPLES; i++){
          float fi = float(i);
          vec2 j = (vec2(hash(gl_FragCoord.xy+fi), hash(gl_FragCoord.yx*1.3+fi*7.1))-.5) * uBlur;
          vec3 nn = normalize(n + vec3(j,0.0));
          vec3 rr = refract(-v, nn, 1.0/(uIor*(1.0-uChroma)));
          vec3 rg = refract(-v, nn, 1.0/uIor);
          vec3 rb = refract(-v, nn, 1.0/(uIor*(1.0+uChroma)));
          tr.r += texture2D(uBuffer, proj(vW + rr*th)).r;
          tr.g += texture2D(uBuffer, proj(vW + rg*th)).g;
          tr.b += texture2D(uBuffer, proj(vW + rb*th)).b;
        }
        tr /= float(SAMPLES); tr = min(tr, vec3(1.15)) * .82;          // 镜片里不让夕阳刺眼:限亮,玻璃本身不进辉光
        float path = uThick / max(nv,.3);
        tr *= mix(vec3(1.0), uAtten, clamp(path*.45*uAmber,0.0,.7)) * uTint * .9;      // 比尔定律衰减(简化)
        vec3 ic = film(dot(vVN.xy, vec2(.9,.6))*1.4 + vL.y*.8 + uTime*.03);
        vec3 h = normalize(v + normalize(vec3(.3,.8,.5)));
        float spec = pow(max(dot(n,h),0.0), 90.0) * 2.2 + pow(max(dot(n,normalize(v+vec3(0.,.15,-1.))),0.0), 40.0) * 1.2;   // 天光与夕阳两处高光
        vec3 col = tr*(1.0-F*.5) + ic*F*uIrid*.7 + uRim*(F*.75 + .015) + vec3(1.,.92,.8)*spec*.8;
        gl_FragColor = vec4(col,1.0);
      }`
  });
}

/* 粗光线:segs = [{a:Vector3,b:Vector3,c:Color,t:0..1(生长顺序)}] */
export function makeFatLines(THREE, segs, o = {}) {
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, 0, 0, 1, 0, 0, -1, 1, 0, 1, 1, 0], 3));
  g.setIndex([0, 1, 2, 2, 1, 3]);
  const n = segs.length, A = new Float32Array(n * 3), Bb = new Float32Array(n * 3), C = new Float32Array(n * 3), T = new Float32Array(n), K = new Float32Array(n);
  segs.forEach((s, i) => { s.a.toArray(A, i * 3); s.b.toArray(Bb, i * 3); s.c.toArray(C, i * 3); T[i] = s.t ?? 0; K[i] = s.k ?? 0; });
  g.setAttribute('iA', new THREE.InstancedBufferAttribute(A, 3)); g.setAttribute('iB', new THREE.InstancedBufferAttribute(Bb, 3));
  g.setAttribute('iC', new THREE.InstancedBufferAttribute(C, 3)); g.setAttribute('iT', new THREE.InstancedBufferAttribute(T, 1));
  g.setAttribute('iK', new THREE.InstancedBufferAttribute(K, 1));
  g.instanceCount = n;
  const m = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, side: THREE.DoubleSide,
    uniforms: { uRes: { value: new THREE.Vector2(1, 1) }, uWidth: { value: o.width ?? 3 }, uGrow: { value: 1 }, uOp: { value: 1 }, uKop: { value: 1 }, uKlen: { value: 1 } },
    vertexShader: /* glsl */`
      attribute vec3 iA, iB, iC; attribute float iT, iK;
      uniform vec2 uRes; uniform float uWidth, uGrow, uKlen;
      varying vec3 vC; varying float vX, vT, vK, vY;
      void main(){
        vC = iC; vT = iT; vK = iK; vX = position.x; vY = position.y;
        float len = mix(1.0, uKlen, iK);                    // iK=1 的线(异色光线)会随过滤被截短
        vec3 b = mix(iA, iB, clamp(len,0.0,1.0));
        vec4 c0 = projectionMatrix * modelViewMatrix * vec4(iA,1.0), c1 = projectionMatrix * modelViewMatrix * vec4(b,1.0);
        vec2 n0 = c0.xy/c0.w, n1 = c1.xy/c1.w; float asp = uRes.x/uRes.y;
        vec2 d = n1 - n0; d.x *= asp; d = normalize(d + 1e-6); vec2 off = vec2(-d.y, d.x); off.x /= asp;
        vec4 c = position.y < .5 ? c0 : c1;
        c.xy += off * position.x * uWidth / uRes.y * c.w;
        gl_Position = c;
      }`,
    fragmentShader: /* glsl */`
      uniform float uGrow, uOp, uKop; varying vec3 vC; varying float vX, vT, vK, vY;
      void main(){
        if (vT > uGrow) discard;
        float e = 1.0 - smoothstep(.35, 1.0, abs(vX));
        float op = uOp * mix(1.0, uKop, vK);
        gl_FragColor = vec4(vC * e * op, 1.0);
      }`
  });
  const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; return mesh;
}

/* 辉光后期 + 最终合成(ACES + sRGB 由 three 的 tonemapping/colorspace 片段完成,只在画到屏幕时生效) */
export function makePost(THREE, R, o = {}) {
  const levels = o.levels ?? 4, HF = THREE.HalfFloatType;
  const rt = (w, h, s = 0) => { const t = new THREE.WebGLRenderTarget(w, h, { type: HF, samples: s, depthBuffer: s >= 0 }); t.texture.minFilter = t.texture.magFilter = THREE.LinearFilter; return t; };
  const main = rt(4, 4, o.msaa ?? 0), buf = rt(4, 4, 0);
  const lv = []; for (let i = 0; i < levels; i++) lv.push([rt(4, 4), rt(4, 4)]);
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2)); const sc = new THREE.Scene(); sc.add(quad);
  const vs = 'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}';
  const bright = new THREE.ShaderMaterial({ uniforms: { tSrc: { value: null }, uTh: { value: 1.0 }, uKnee: { value: 0.5 } }, vertexShader: vs, depthTest: false, depthWrite: false,
    fragmentShader: 'uniform sampler2D tSrc;uniform float uTh,uKnee;varying vec2 vUv;void main(){vec3 c=texture2D(tSrc,vUv).rgb;float l=dot(c,vec3(.2126,.7152,.0722));float s=clamp(l-uTh+uKnee,0.,2.*uKnee);s=s*s/(4.*uKnee+1e-4);float w=max(s,l-uTh)/max(l,1e-4);gl_FragColor=vec4(min(c*w,vec3(16.)),1.);}' });
  const blur = new THREE.ShaderMaterial({ uniforms: { tSrc: { value: null }, uDir: { value: new THREE.Vector2() } }, vertexShader: vs, depthTest: false, depthWrite: false,
    fragmentShader: 'uniform sampler2D tSrc;uniform vec2 uDir;varying vec2 vUv;void main(){vec3 c=texture2D(tSrc,vUv).rgb*.227027;c+=(texture2D(tSrc,vUv+uDir*1.384615).rgb+texture2D(tSrc,vUv-uDir*1.384615).rgb)*.316216;c+=(texture2D(tSrc,vUv+uDir*3.230769).rgb+texture2D(tSrc,vUv-uDir*3.230769).rgb)*.070270;gl_FragColor=vec4(c,1.);}' });
  const uni = { tMain: { value: main.texture }, uStr: { value: o.strength ?? 0.8 }, uVig: { value: 0.35 } };
  const W = [1.0, 0.8, 0.6, 0.4, 0.25]; let sum = '';
  for (let i = 0; i < levels; i++) { uni['tB' + i] = { value: lv[i][1].texture }; sum += `b+=texture2D(tB${i},vUv).rgb*${W[i].toFixed(2)};`; }
  const comp = new THREE.ShaderMaterial({ uniforms: uni, vertexShader: vs, depthTest: false, depthWrite: false,
    fragmentShader: `uniform sampler2D tMain;${Array.from({ length: levels }, (_, i) => `uniform sampler2D tB${i};`).join('')}uniform float uStr,uVig;varying vec2 vUv;
      void main(){vec3 b=vec3(0.);${sum}vec3 c=texture2D(tMain,vUv).rgb+b*uStr;vec2 q=vUv-.5;c*=1.-uVig*dot(q,q)*1.6;gl_FragColor=vec4(c,1.);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
      }` });
  let pw = 1, ph = 1;
  function setSize(w, h, bufScale = 0.5) {
    pw = w; ph = h; main.setSize(w, h); buf.setSize(Math.max(2, w * bufScale | 0), Math.max(2, h * bufScale | 0));
    let lw = w >> 1, lh = h >> 1; lv.forEach(p => { p[0].setSize(Math.max(2, lw), Math.max(2, lh)); p[1].setSize(Math.max(2, lw), Math.max(2, lh)); lw >>= 1; lh >>= 1; });
  }
  const pass = (mat, target) => { quad.material = mat; R.setRenderTarget(target); R.render(sc, cam); };
  function bloom() {
    const ac = R.autoClear; R.autoClear = true;
    bright.uniforms.tSrc.value = main.texture; pass(bright, lv[0][1]);
    for (let i = 0; i < levels; i++) {
      const src = i ? lv[i - 1][1].texture : lv[0][1].texture, a = lv[i][0], b = lv[i][1];
      blur.uniforms.tSrc.value = src; blur.uniforms.uDir.value.set(1 / a.width, 0); pass(blur, a);
      blur.uniforms.tSrc.value = a.texture; blur.uniforms.uDir.value.set(0, 1 / a.height); pass(blur, b);
    }
    pass(comp, null); R.autoClear = ac;
  }
  return { main, buf, setSize, bloom, bright, comp, size: () => [pw, ph] };
}
