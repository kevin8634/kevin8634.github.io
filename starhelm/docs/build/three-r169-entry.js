/* 天枢 Starhelm · Three.js r169 经典脚本包(window.THREE)+ r147 兼容层
 * three@0.169.0 · OrbitControls · GLTFLoader — MIT, Copyright 2010-2024 Three.js Authors */
import * as NS from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const T = Object.assign({}, NS);
T.OrbitControls = OrbitControls;
T.GLTFLoader = GLTFLoader;

/* ---- r147 兼容层:让旧代码在 r169 下保持原有观感 ---- */
// 1) 色彩管理:r147 等价于关闭(hex 颜色按线性处理)
NS.ColorManagement.enabled = false;
// 2) 旧编码常量与 .encoding / .outputEncoding 访问器 → colorSpace
T.LinearEncoding = 3000; T.sRGBEncoding = 3001;
const enc2cs = (e) => (e === 3001 ? NS.SRGBColorSpace : (e === 3000 ? NS.LinearSRGBColorSpace : NS.NoColorSpace));
const cs2enc = (c) => (c === NS.SRGBColorSpace ? 3001 : 3000);
Object.defineProperty(NS.Texture.prototype, 'encoding', {
  get() { return cs2enc(this.colorSpace); },
  set(v) { this.colorSpace = enc2cs(v); this.needsUpdate = true; }, configurable: true
});
// 3) 渲染器:r147 默认输出线性;outputEncoding 访问器;capabilities.isWebGL2
class WebGLRenderer extends NS.WebGLRenderer {
  constructor(p) {
    super(p);
    this.outputColorSpace = NS.LinearSRGBColorSpace;
    try { if (this.capabilities && this.capabilities.isWebGL2 === undefined) this.capabilities.isWebGL2 = true; } catch (e) {}
  }
  setPixelRatio(v) { let c = 2; try { if (window.SHGFX) c = window.SHGFX.prCap(); } catch (e) {} super.setPixelRatio(Math.min(v || 1, c)); }
  get outputEncoding() { return cs2enc(this.outputColorSpace); }
  set outputEncoding(v) { this.outputColorSpace = v === 3001 ? NS.SRGBColorSpace : NS.LinearSRGBColorSpace; }
}
T.WebGLRenderer = WebGLRenderer;
// 4) 着色器片段改名(r154):encodings_fragment → colorspace_fragment
NS.ShaderChunk.encodings_fragment = NS.ShaderChunk.colorspace_fragment;
NS.ShaderChunk.encodings_pars_fragment = NS.ShaderChunk.colorspace_pars_fragment;
// 5) 光照:r147 非物理光照把所有光源强度乘 π;点光/聚光默认 decay=1
function legacyIntensity(Base) {
  return class extends Base {
    get intensity() { return this._lgI; }
    set intensity(v) { this._lgI = v * Math.PI; }
  };
}
T.AmbientLight = legacyIntensity(NS.AmbientLight);
T.HemisphereLight = legacyIntensity(NS.HemisphereLight);
T.DirectionalLight = legacyIntensity(NS.DirectionalLight);
const PL = legacyIntensity(NS.PointLight);
T.PointLight = class extends PL { constructor(c, i, d, decay) { super(c, i, d, decay === undefined ? 1 : decay); } };
const SL = legacyIntensity(NS.SpotLight);
T.SpotLight = class extends SL { constructor(c, i, d, a, p, decay) { super(c, i, d, a, p, decay === undefined ? 1 : decay); } };
T.__r = 169;
T.__compat = 'r147';
window.THREE = T;
