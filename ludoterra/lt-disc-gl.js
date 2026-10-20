/* 觉弈 Ludoterra · 星盘 Three.js + WebGL 渲染(v0.17;Three.js 本地自带 vendor/,MIT)
 * 原生 WebGL1 + 片元着色器逐像素光线求交:三层台阶盘体、细金带与侧壁、半透明星宿玻璃、
 * 鎏金流光、星闪、中心三道浑仪金环(SDF 光线步进)。按需动态加载,无外部请求。
 * 投影与首页 2D 的 P3() 完全一致,2D 层的标签/莲花/勋章可直接叠在上面。 */
const VS = `attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`;
const FS = `precision highp float;
uniform vec2 uRes;uniform float uDpr;uniform vec2 uC;uniform float uR,uES,uEC,uD,uTh,uT,uHs,uHo,uMode,uSel;
uniform vec4 uLa;uniform vec4 uLb;uniform mat3 uM0,uM1,uM2;uniform vec3 uRad;
const float PI=3.14159265,TAU=6.2831853;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float litOf(float s){return s<.5?uLa.x:s<1.5?uLa.y:s<2.5?uLa.z:s<3.5?uLa.w:s<4.5?uLb.x:s<5.5?uLb.y:s<6.5?uLb.z:uLb.w;}
vec3 goldc(float s){s=clamp(s,0.,1.);return mix(vec3(.30,.18,.06),vec3(1.,.83,.50),s)+vec3(.25,.2,.12)*pow(s,6.);}
float angd(float a,float b){return abs(mod(a-b+PI,TAU)-PI);}
float flow(float A,float sp,float off){return exp(-pow(angd(A,uT*sp+off),2.)*14.);}
const vec3 LD=vec3(-.45,.75,.48);
vec4 shadeTop(vec3 q,float layer){
  float r=length(q.xz);float A=atan(q.z,q.x);float a=mod(A-uTh,TAU);
  float sheen=.5+.5*cos(A-2.3);
  float spot=exp(-dot(q.xz-vec2(-.3,-.62),q.xz-vec2(-.3,-.62))*2.6);
  float b0=-1.,b1=-1.;
  if(layer<.5){if(r>.475){b0=.475;b1=.49;}else if(r>.225&&r<.24){b0=.225;b1=.24;}}
  else if(layer<1.5){if(r>.725){b0=.725;b1=.74;}}
  else{if(r>.99){b0=.99;b1=1.035;}}
  if(b0>0.){ /* 细金带 */
    vec3 c=goldc(.25+.6*sheen+.35*spot);
    c+=vec3(1.,.9,.68)*(flow(A,.45,layer*2.1)+flow(A,-.3,layer*1.3+3.))*.85;
    float e=min(abs(r-b0),abs(r-b1));c+=vec3(.5,.42,.25)*smoothstep(.004,.0,e);
    if(layer>1.5){float n=a/TAU*120.;float f=abs(fract(n)-.5);bool big=mod(floor(n+.5),10.)<.5;
      if(f>.42&&(r>1.004||big))c*=.3;}
    return vec4(c,1.);
  }
  vec3 glass=vec3(.035,.10,.16)+vec3(.06,.26,.32)*exp(-r*2.4);
  if(layer<.5&&r<.225){ /* 中心圆台 */
    vec3 c=glass+vec3(.18,.42,.45)*exp(-r*9.)*.7;float rl=abs(fract(r/.035)-.5);c+=vec3(.6,.45,.2)*smoothstep(.47,.5,rl)*.35;
    c+=vec3(.9,.8,.6)*spot*.12;return vec4(c,.62);
  }
  float off=layer<.5?0.:layer<1.5?PI/3.:PI/2.;float n=layer<1.5?3.:2.;float base=layer<.5?0.:layer<1.5?3.:6.;
  float span=TAU/n;float rel=mod(a-off,TAU);float idx=floor(rel/span);float fr=fract(rel/span);
  float slot=base+idx;float L=litOf(slot);float S=abs(slot-uSel)<.5?1.:0.;
  float r0=layer<.5?.24:layer<1.5?.49:.74;float r1=layer<.5?.475:layer<1.5?.725:.99;
  vec3 g=mix(vec3(.80,.48,.14),vec3(1.,.86,.56),sheen*.6+.25*(1.-(r-r0)/(r1-r0)));
  float sw=exp(-pow(fract(dot(q.xz,vec2(.6,.8))*.55-uT*.07)-.5,2.)*160.);
  float inr=1.-(r-r0)/(r1-r0);float edgeG=smoothstep(.05,.0,min(fr,1.-fr)*span*r)+smoothstep(.03,.0,min(abs(r-r0),abs(r-r1)));
  vec3 litc=g*(.32+.22*inr+.25*sheen)+g*edgeG*.45+vec3(1.,.95,.8)*sw*.35;
  vec3 c=mix(glass,litc,L);float al=mix(.52,.62,L);
  c+=vec3(.28,.2,.08)*S;al=max(al,.6*S);
  vec2 cell=floor(q.xz*72.);float h=hash(cell+layer*17.);
  if(h>.972){vec2 cc=fract(q.xz*72.)-.5;float sp=smoothstep(.28,.0,length(cc))*(.45+.55*sin(uT*2.6+h*90.));c+=vec3(1.,.95,.82)*sp*(.7+L);al=max(al,sp);}
  float bd=min(fr,1.-fr)*span*r;float ed=min(abs(r-r0),abs(r-r1));
  float ln=max(smoothstep(.0045,.0,bd),smoothstep(.003,.0,ed)*.8);
  c=mix(c,goldc(.75+.25*sheen)+vec3(.4,.3,.15)*(L+S),ln*(.55+.45*max(L,S)));al=max(al,ln*.9);
  c+=vec3(.9,.82,.65)*spot*.10;
  return vec4(c,al);
}
vec4 shadeWall(vec3 q,float y0,float y1){
  vec3 nn=normalize(vec3(q.x,0.,q.z));float lam=.25+.75*max(dot(nn,normalize(LD)),0.);
  float yf=clamp((q.y-y0)/(y1-y0),0.,1.);float A=atan(q.z,q.x);
  vec3 c=goldc(lam*(.45+.55*yf))+vec3(1.,.9,.7)*flow(A,.45,y1*40.)*.5*yf;
  c+=vec3(.6,.5,.3)*smoothstep(.85,1.,yf)*.6;return vec4(c,1.);
}
float sdRing(vec3 p,mat3 M,float rad){vec3 l=M*p;return length(vec2(length(l.xy)-rad,l.z))-.0065;}
float sdArm(vec3 p){return min(sdRing(p,uM0,uRad.x),min(sdRing(p,uM1,uRad.y),sdRing(p,uM2,uRad.z)));}
void main(){
  vec2 px=vec2(gl_FragCoord.x,uRes.y*uDpr-gl_FragCoord.y)/uDpr;
  float u=(px.x-uC.x)/uR,v=(px.y-uC.y)/uR,D=uD/uR;
  vec3 O=vec3(0.,D*uES,D*uEC);vec3 rd=normalize(vec3(u,-v*uEC-D*uES,v*uES-D*uEC));
  float tb=1e9;float kind=0.;vec3 hp;
  /* 顶面 */
  for(int i=0;i<3;i++){float h=i==0?uHs:i==1?uHo:0.;float t=(h-O.y)/rd.y;
    if(t>0.&&t<tb){vec3 q=O+t*rd;float r=length(q.xz);
      bool ok=i==0?r<=.49:i==1?(r>.49&&r<=.74):(r>.74&&r<=1.035);
      if(ok){tb=t;kind=float(i+1);hp=q;}}}
  /* 侧壁 */
  for(int i=0;i<3;i++){float rc=i==0?.49:i==1?.74:1.035;float y0=i==0?uHo:i==1?0.:-.045;float y1=i==0?uHs:i==1?uHo:0.;
    float a=dot(rd.xz,rd.xz);float b=2.*dot(O.xz,rd.xz);float c=dot(O.xz,O.xz)-rc*rc;float di=b*b-4.*a*c;
    if(di>0.){float t=(-b-sqrt(di))/(2.*a);vec3 q=O+t*rd;if(t>0.&&t<tb&&q.y>=y0&&q.y<=y1){tb=t;kind=float(i+4);hp=q;}}}
  vec4 col=vec4(0.);
  if(uMode<.5){
    if(kind>0.5&&kind<3.5)col=shadeTop(hp,kind-1.);
    else if(kind>3.5){float k=kind-4.;col=k<.5?shadeWall(hp,uHo,uHs):k<1.5?shadeWall(hp,0.,uHo):shadeWall(hp,-.045,0.);}
    col.rgb*=col.a;
  }
  /* 浑仪金环:mode0 画后半圈,mode1 画前半圈 */
  vec3 cc=vec3(0.,uHs+.2,0.);vec3 oc=O-cc;float bb=dot(oc,rd);float c2=dot(oc,oc)-.4*.4;float h2=bb*bb-c2;
  if(h2>0.){float t=max(-bb-sqrt(h2),0.);float te=-bb+sqrt(h2);
    for(int i=0;i<72;i++){vec3 p=O+t*rd-cc;float d=sdArm(p);if(d<.0007){
        float cd=cc.z*uEC+cc.y*uES;vec3 wp=p+cc;float vd=wp.z*uEC+wp.y*uES;bool front=vd>cd;
        if(t<tb&&((uMode>.5)==front)){vec2 e=vec2(.0008,0.);
          vec3 n=normalize(vec3(sdArm(p+e.xyy)-sdArm(p-e.xyy),sdArm(p+e.yxy)-sdArm(p-e.yxy),sdArm(p+e.yyx)-sdArm(p-e.yyx)));
          float lam=.3+.7*max(dot(n,normalize(LD)),0.);float spc=pow(max(dot(reflect(-normalize(LD),n),-rd),0.),28.);
          vec3 rc=goldc(lam)+vec3(1.,.95,.8)*spc*1.2;col=vec4(rc,1.);}
        break;}
      t+=max(d*.9,.0012);if(t>te)break;}}
  gl_FragColor=col;
}`;
export async function makeDiscGL() {
  let THREE; try { THREE = await import('./vendor/three.module.min.js'); } catch (_) { return null; }
  const probe = document.createElement('canvas'); if (!(probe.getContext('webgl2') || probe.getContext('webgl'))) return null;
  let renderer; try { renderer = new THREE.WebGLRenderer({ alpha: true, premultipliedAlpha: true, preserveDrawingBuffer: true, antialias: false, powerPreference: 'high-performance' }); } catch (_) { return null; }
  renderer.setClearColor(0x000000, 0);
  const U = { uRes: { value: new THREE.Vector2() }, uDpr: { value: 1 }, uC: { value: new THREE.Vector2() }, uR: { value: 1 }, uES: { value: 0 }, uEC: { value: 1 }, uD: { value: 1 }, uTh: { value: 0 }, uT: { value: 0 },
    uHs: { value: 0 }, uHo: { value: 0 }, uMode: { value: 0 }, uSel: { value: -1 }, uLa: { value: new THREE.Vector4() }, uLb: { value: new THREE.Vector4() },
    uM0: { value: new THREE.Matrix3() }, uM1: { value: new THREE.Matrix3() }, uM2: { value: new THREE.Matrix3() }, uRad: { value: new THREE.Vector3() } };
  const mat = new THREE.ShaderMaterial({ uniforms: U, vertexShader: 'void main(){gl_Position=vec4(position.xy,0.,1.);}', fragmentShader: FS.replace('precision highp float;', ''), transparent: true, depthTest: false, depthWrite: false, toneMapped: false });
  const scene = new THREE.Scene(); const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat); quad.frustumCulled = false; scene.add(quad);
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  return {
    c: renderer.domElement, three: THREE.REVISION,
    size(W, H, dpr) { const d = Math.min(1.5, dpr); if (this.W !== W || this.H !== H || this.d !== d) { renderer.setPixelRatio(d); renderer.setSize(W, H, false); this.d = d; this.W = W; this.H = H; } },
    render(o, mode) {
      U.uRes.value.set(this.W, this.H); U.uDpr.value = this.d; U.uC.value.set(o.CX, o.CY); U.uR.value = o.R; U.uES.value = o.ES; U.uEC.value = o.EC; U.uD.value = o.D; U.uTh.value = o.theta; U.uT.value = o.t;
      U.uHs.value = o.hs; U.uHo.value = o.ho; U.uMode.value = mode; U.uSel.value = o.sel; U.uLa.value.fromArray(o.lit, 0); U.uLb.value.fromArray(o.lit, 4);
      U.uM0.value.fromArray(o.mats[0]); U.uM1.value.fromArray(o.mats[1]); U.uM2.value.fromArray(o.mats[2]); U.uRad.value.fromArray(o.rads);
      renderer.render(scene, cam);
    }
  };
}
