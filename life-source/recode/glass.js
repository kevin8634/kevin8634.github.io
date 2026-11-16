// 生命源码 2.0 · 改码·玻璃细胞 —— 玻璃材质(原生 three,无 React)
// 透射思路改写自 pmndrs/drei MeshTransmissionMaterial(MIT,src/core/MeshTransmissionMaterial.tsx):
//   先把「玻璃后面的场景」渲到一张降分辨率缓冲,再在玻璃表面按折射光线出射点投影取样;
//   R/G/B 三个折射率分开取样 = 色散(chromaticAberration);每个样本加噪声抖动 = 噪声模糊(anisotropicBlur/roughness);
//   厚度 + 比尔定律衰减着色。本文件只保留这几项,改为 ShaderMaterial,样本数按画质档位定。
// 膜表面虹彩改写自 React Bits「Iridescence」(MIT + Commons Clause,https://reactbits.dev):
//   保留其 cos/sin 迭代色场(a += cos(i - d - a*uv.x); d += sin(uv.y*i + a)),改为贴在法线/世界坐标上、只在菲涅耳边缘出现。
//   细胞膜(磷脂双分子层)本就薄到能产生薄膜干涉色,虹彩是写实而非装饰。

export function makeGlass(THREE, o = {}) {
  const samples = o.samples ?? 6;
  const m = new THREE.ShaderMaterial({
    defines: { SAMPLES: samples },
    uniforms: {
      uBuffer: { value: null },
      uTime: { value: 0 },
      uIor: { value: o.ior ?? 1.22 },
      uThick: { value: o.thickness ?? .55 },
      uChroma: { value: o.chroma ?? .06 },
      uBlur: { value: o.blur ?? .1 },
      uIrid: { value: o.irid ?? .65 },
      uIridScale: { value: o.iridScale ?? 1.6 },
      uTint: { value: new THREE.Color(o.tint ?? '#e8fff8') },
      uAtten: { value: new THREE.Color(o.atten ?? '#9ff5d8') },
      uRim: { value: new THREE.Color(o.rim ?? '#c4b5fd') },
    },
    vertexShader: /* glsl */`
      varying vec3 vW; varying vec3 vN; varying vec3 vVN;
      void main(){
        vec4 w = modelMatrix * vec4(position,1.0);
        vW = w.xyz;
        vN = normalize(mat3(modelMatrix) * normal);
        vVN = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */`
      uniform mat4 projectionMatrix;
      uniform sampler2D uBuffer; uniform float uTime, uIor, uThick, uChroma, uBlur, uIrid, uIridScale;
      uniform vec3 uTint, uAtten, uRim;
      varying vec3 vW; varying vec3 vN; varying vec3 vVN;
      float hash(vec2 p){ p = fract(p*vec2(123.34,456.21)); p += dot(p,p+45.32); return fract(p.x*p.y); }
      vec2 proj(vec3 p){ vec4 c = projectionMatrix * viewMatrix * vec4(p,1.0); return c.xy/c.w*.5+.5; }
      vec3 iris(vec2 uv){ // React Bits Iridescence 色场(改写)
        float d = -uTime*.25, a = 0.0;
        for (int i = 0; i < 8; i++){ float fi = float(i); a += cos(fi - d - a*uv.x); d += sin(uv.y*fi + a); }
        d += uTime*.25;
        vec3 col = vec3(cos(uv*vec2(d,a))*.6+.4, cos(a+d)*.5+.5);
        return cos(col*cos(vec3(d,a,2.5))*.5+.5);
      }
      void main(){
        vec3 n = normalize(vN); vec3 v = normalize(cameraPosition - vW);
        if (!gl_FrontFacing) n = -n;
        float nv = clamp(dot(n,v),0.0,1.0);
        float F = .04 + .96*pow(1.0-nv,4.0);
        vec3 tr = vec3(0.0);
        for (int i = 0; i < SAMPLES; i++){
          float fi = float(i);
          vec2 j = (vec2(hash(gl_FragCoord.xy+fi), hash(gl_FragCoord.yx*1.3+fi*7.1))-.5) * uBlur;
          vec3 nn = normalize(n + vec3(j,0.0));
          float io = uIor;
          vec3 rr = refract(-v, nn, 1.0/(io*(1.0-uChroma)));
          vec3 rg = refract(-v, nn, 1.0/io);
          vec3 rb = refract(-v, nn, 1.0/(io*(1.0+uChroma)));
          tr.r += texture2D(uBuffer, proj(vW + rr*uThick)).r;
          tr.g += texture2D(uBuffer, proj(vW + rg*uThick)).g;
          tr.b += texture2D(uBuffer, proj(vW + rb*uThick)).b;
        }
        tr /= float(SAMPLES);
        float path = uThick / max(nv,.25);
        tr *= mix(vec3(1.0), uAtten, clamp(path*.6,0.0,1.0)) * uTint; // 比尔定律衰减(简化)
        vec3 ic = iris(vVN.xy*uIridScale + vW.xy*.35);
        vec3 col = tr*(1.0-F*.55) + ic*F*uIrid + uRim*F*.35;
        gl_FragColor = vec4(col,1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  m.userData = { c0: m.uniforms.uChroma.value, b0: m.uniforms.uBlur.value, i0: m.uniforms.uIor.value };
  return m;
}

/** 低档回退:原生 MeshPhysicalMaterial(半透明 + 内建薄膜虹彩),不需要额外缓冲 */
export function makeGlassLow(THREE, o = {}) {
  return new THREE.MeshPhysicalMaterial({
    color: o.tint ?? '#d8fff2', roughness: .15, metalness: 0, transparent: true, opacity: o.opacity ?? .22,
    iridescence: 1, iridescenceIOR: 1.3, iridescenceThicknessRange: [200, 600], clearcoat: 1, clearcoatRoughness: .1,
    depthWrite: false, side: THREE.FrontSide,
  });
}
