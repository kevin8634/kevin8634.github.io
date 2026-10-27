// Armilla「AI 空间感」音效链 —— 与 ARMILLA PWA v2.2.1 中 spaceFx 完全一致的参数。
// 用法：
//   import { JarvisSpaceFx } from './jarvis-spacefx.js';
//   const fx = new JarvisSpaceFx(audioCtx, { enabled: true });
//   source.connect(fx.input); fx.output.connect(audioCtx.destination);
//   fx.setEnabled(false)  // 平滑切换为原声（干声）
// 链路：干声旁路 / 处理支路：高通 85Hz → 低架 220Hz -1.5dB → 峰值 3.2kHz +2.4dB(Q0.9)
//       → 高架 9kHz +3dB → (直达 0.92) + (预延迟 18ms → 合成卷积混响 1.05s → 0.2)
// 默认开启（PWA 中 spaceFx 默认 true，用户选择存于 localStorage）。

function makeImpulse(ctx, seconds = 1.05, decay = 3.2) {
  const rate = ctx.sampleRate, len = Math.floor(rate * seconds);
  const buf = ctx.createBuffer(2, len, rate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    let lp = 0;
    for (let i = 0; i < len; i++) {
      const p = i / len, n = Math.random() * 2 - 1;
      lp += (n - lp) * (0.55 - 0.35 * p);
      d[i] = lp * Math.pow(1 - p, decay) * 0.9;
    }
    [0.011, 0.019, 0.027, 0.041].forEach((t, k) => {
      const idx = Math.floor((t + ch * 0.003) * rate);
      if (idx < len) d[idx] += 0.5 / (k + 1.4);
    });
  }
  return buf;
}

export class JarvisSpaceFx {
  constructor(ctx, { enabled = true } = {}) {
    this.ctx = ctx;
    this.input = ctx.createGain();
    this.output = ctx.createGain();
    this.bypass = ctx.createGain();
    this.fxIn = ctx.createGain();
    this.input.connect(this.bypass); this.input.connect(this.fxIn);
    this.bypass.connect(this.output);

    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 85; hp.Q.value = 0.7;
    const ls = ctx.createBiquadFilter(); ls.type = 'lowshelf'; ls.frequency.value = 220; ls.gain.value = -1.5;
    const pk = ctx.createBiquadFilter(); pk.type = 'peaking'; pk.frequency.value = 3200; pk.Q.value = 0.9; pk.gain.value = 2.4;
    const hs = ctx.createBiquadFilter(); hs.type = 'highshelf'; hs.frequency.value = 9000; hs.gain.value = 3;
    this.fxIn.connect(hp); hp.connect(ls); ls.connect(pk); pk.connect(hs);

    const direct = ctx.createGain(); direct.gain.value = 0.92;
    const pre = ctx.createDelay(0.1); pre.delayTime.value = 0.018;
    const conv = ctx.createConvolver(); conv.buffer = makeImpulse(ctx);
    const wet = ctx.createGain(); wet.gain.value = 0.2;
    hs.connect(direct); direct.connect(this.output);
    hs.connect(pre); pre.connect(conv); conv.connect(wet); wet.connect(this.output);

    this.setEnabled(enabled, true);
  }
  get enabled() { return this._on; }
  setEnabled(on, immediate = false) {
    this._on = !!on;
    const t = this.ctx.currentTime, tc = immediate ? 0.001 : 0.12;
    this.bypass.gain.cancelScheduledValues(t); this.fxIn.gain.cancelScheduledValues(t);
    this.bypass.gain.setTargetAtTime(on ? 0 : 1, t, tc);
    this.fxIn.gain.setTargetAtTime(on ? 1 : 0, t, tc);
  }
}
