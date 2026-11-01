# 元素工坊 v2.1 · 反应台音效(纯程序合成原创,固定种子,无采样/音色库/AI 音乐)
# bubble 冒泡:一串上行的小水泡共振(气体逸出);settle 沉淀:颗粒下落的细碎沙沙声 + 低沉落定;balance 配平成功:A 多利亚纯五度金属双击。
import numpy as np, subprocess, os
from scipy.signal import butter, sosfilt
from scipy.io import wavfile
SR = 48000; rng = np.random.default_rng(21)
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out'); os.makedirs(OUT, exist_ok=True)
hz = lambda m: 440.0 * 2 ** ((m - 69) / 12); T = lambda d: np.arange(int(SR * d)) / SR
def lp(x, f): return sosfilt(butter(4, f / (SR / 2), 'low', output='sos'), x)
def bp(x, lo, hi): return sosfilt(butter(2, [lo / (SR / 2), hi / (SR / 2)], 'band', output='sos'), x)
def save(name, x, db=-6.0):
    x = x / (np.max(np.abs(x)) + 1e-9) * 10 ** (db / 20); st = np.stack([x, np.roll(x, 90)], 1)
    w = os.path.join(OUT, name + '.wav'); wavfile.write(w, SR, (st * 32767).astype(np.int16))
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', w, '-c:a', 'aac', '-b:a', '128k', os.path.join(os.path.dirname(OUT), name + '.m4a')], check=True)
# 冒泡:每个气泡 = 指数衰减正弦,频率随气泡变小而上滑(Minnaert 共振)
b = np.zeros(int(SR * 1.4))
for i in range(14):
    at = int(SR * (i * 0.08 + rng.uniform(0, 0.04))); d = 0.07; t = T(d); f0 = rng.uniform(500, 1100)
    f = f0 * (1 + 1.6 * t / d); ph = 2 * np.pi * np.cumsum(f) / SR
    g = np.sin(ph) * np.exp(-t * 45) * rng.uniform(0.5, 1.0); b[at:at + len(g)] += g[:len(b) - at]
save('bubble', lp(b, 4000) * np.linspace(1, 0.5, len(b)))
# 沉淀:带通噪声颗粒逐渐变稀 + 低频落定
d = 1.6; t = T(d); n = rng.standard_normal(len(t)); env = np.zeros(len(t))
for i in range(60):
    at = int(SR * d * (rng.random() ** 1.6) * 0.85); L = int(SR * 0.012); env[at:at + L] += np.hanning(L)[:len(env) - at] * rng.uniform(.3, 1)
s = bp(n, 1800, 6000) * env * 0.6 + np.sin(2 * np.pi * hz(45) * t) * np.exp(-((t - 1.2) ** 2) / 0.02) * 0.5
save('settle', s, -8)
# 配平成功:A(57) 与 E(64) 金属击打,非谐波分音
def metal(f, d=1.2):
    t = T(d); return sum(a * np.sin(2 * np.pi * f * r * t) * np.exp(-t * k) for r, a, k in [(1, 1, 3), (2.76, .5, 6), (5.4, .25, 10), (8.93, .12, 16)])
x = np.zeros(int(SR * 1.6)); m1 = metal(hz(69)); m2 = metal(hz(76)); x[:len(m1)] += m1; o = int(SR * 0.16); x[o:o + len(m2)] += m2[:len(x) - o]
save('balance', x, -5)
print('ok')
