# 元素工坊 Element Forge · 声音合成源码 v0.1(纯程序合成原创,无采样/音色库/AI 音乐)
# 调式:A 多利亚(A B C D E F# G);主音色:金属击打/锻锤。声音即规律:放热=上行明亮,吸热=下行暗沉。
# 依赖:python3 + numpy + scipy;ffmpeg 转 m4a。固定随机种子,可重现。
import numpy as np, subprocess, os
from scipy.signal import butter, sosfilt, fftconvolve
from scipy.io import wavfile
SR = 48000; rng = np.random.default_rng(7)
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out'); os.makedirs(OUT, exist_ok=True)
hz = lambda m: 440.0 * 2 ** ((m - 69) / 12)
T = lambda d: np.arange(int(SR * d)) / SR
def lp(x, f): return sosfilt(butter(4, f / (SR / 2), 'low', output='sos'), x)
def hp(x, f): return sosfilt(butter(2, f / (SR / 2), 'high', output='sos'), x)
def bp(x, lo, hi): return sosfilt(butter(2, [lo / (SR / 2), hi / (SR / 2)], 'band', output='sos'), x)
def norm(x, db=-3.0):
    p = np.max(np.abs(x)) or 1; return x / p * 10 ** (db / 20)
def ir(dur, dec, cut, seed):
    r = np.random.default_rng(seed); t = T(dur); n = r.standard_normal(len(t)) * np.exp(-t * 6.9 / dec); return lp(n, cut)
IR_BIG = (ir(4.5, 3.6, 5000, 11), ir(4.5, 3.6, 5000, 12)); IR_SMALL = (ir(1.6, 1.0, 8000, 13), ir(1.6, 1.0, 8000, 14))
def verb(st, irs, wet):
    L, R = st; l = fftconvolve(L, irs[0])[:len(L)]; r = fftconvolve(R, irs[1])[:len(R)]
    k = np.max(np.abs(np.concatenate([l, r]))) or 1; s = (np.max(np.abs(np.concatenate([L, R]))) or 1) / k
    return (L * (1 - wet) + l * s * wet, R * (1 - wet) + r * s * wet)
def pan(x, p): a = (p + 1) * np.pi / 4; return (x * np.cos(a), x * np.sin(a))
def buf(d): return [np.zeros(int(SR * d)), np.zeros(int(SR * d))]
def add(b, st, at):
    i = int(SR * at); n = min(len(st[0]), len(b[0]) - i)
    if n > 0: b[0][i:i + n] += st[0][:n]; b[1][i:i + n] += st[1][:n]
# 金属锻锤音色:自由金属棒的非谐波分音 1, 2.76, 5.40, 8.93 + 锤击噪声瞬态
def metal(f, d=1.6, bright=1.0):
    t = T(d); x = np.zeros_like(t)
    for r, a, k in [(1, 1, 2.2), (2.76, .55 * bright, 3.5), (5.40, .32 * bright, 6), (8.93, .18 * bright, 9), (1.003, .5, 2.0)]:
        if f * r < 16000: x += a * np.sin(2 * np.pi * f * r * t + rng.uniform(0, 6.28)) * np.exp(-k * t)
    x *= 1 - np.exp(-1200 * t)
    n = hp(rng.standard_normal(len(t)), 2500) * np.exp(-t * 90) * .25 * bright
    return x + n
def pad(f, d):
    t = T(d); x = np.zeros_like(t)
    for det in (-.1, -.03, .03, .1):
        ff = f * 2 ** (det / 12)
        for h in range(1, 9):
            if ff * h < 8000: x += np.sin(2 * np.pi * ff * h * t + rng.uniform(0, 6.28)) / h
    x = lp(x, 1800); env = np.sin(np.pi * np.clip(t / d, 0, 1)) ** 1.5; return x * env / 4
def save(name, st, db=-3.0, music=False):
    L, R = st; m = norm(np.stack([L, R], 1), db)
    w = os.path.join(OUT, name + '.wav'); wavfile.write(w, SR, (m * 32767).astype(np.int16))
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', w, '-c:a', 'aac', '-b:a', '192k' if music else '128k', os.path.join(os.path.dirname(OUT), name + '.m4a')], check=True)
DOR = [57, 59, 60, 62, 64, 66, 67]  # A 多利亚
# ---- 音效 ----
b = buf(.5); add(b, pan(metal(hz(93), .35, .6) * .6, .2), 0); save('tick', b, -10)
b = buf(1.8)
for i, m in enumerate([57, 64, 67, 71]): add(b, pan(metal(hz(m + 12), 1.4, .8), -.5 + i * .33), i * .06)
save('select', verb(b, IR_BIG, .4))
b = buf(2.2)
for i, m in enumerate([69, 71, 72, 74, 76, 78, 79, 81]): add(b, pan(metal(hz(m), 1.2, 1.0) * (.6 + i * .05), -.7 + i * .2), i * .085)
save('unlock', verb(b, IR_BIG, .35))
# 放热:上行、明亮(反应放出能量)
b = buf(1.6); t = T(.5); g = np.sin(2 * np.pi * np.cumsum(np.linspace(hz(57), hz(81), len(t))) / SR) * np.exp(-t * 3) * .3
add(b, pan(g, 0), 0)
for i, m in enumerate([69, 76, 81, 88]): add(b, pan(metal(hz(m), 1.0, 1.3), -.4 + i * .27), .12 + i * .07)
save('fuse', verb(b, IR_SMALL, .35))
# 吸热:下行、暗沉(反应吸收能量)
b = buf(1.8); t = T(.9); g = np.sin(2 * np.pi * np.cumsum(np.linspace(hz(64), hz(40), len(t))) / SR) * np.exp(-t * 2) * .35
add(b, pan(lp(g, 900), 0), 0)
for i, m in enumerate([64, 60, 57, 52]): add(b, pan(lp(metal(hz(m), 1.2, .5), 1600), .4 - i * .27), .1 + i * .11)
save('absorb', verb(b, IR_SMALL, .45))
# 锻锤:砧台敲击
b = buf(2.0); add(b, pan(metal(hz(45), 1.8, 1.2), 0), 0); add(b, pan(metal(hz(57), 1.2, .9) * .5, .2), 0)
save('anvil', verb(b, IR_SMALL, .3))
# 转场 whoosh
d = 1.3; t = T(d); n = rng.standard_normal(len(t)); y = np.zeros_like(n); seg = int(SR * .02)
for i in range(0, len(n), seg):
    c = 300 + 5000 * (i / len(n)) ** 2; y[i:i + seg] = bp(n[max(0, i - 2048):i + seg], c * .7, min(c * 1.3, 20000))[-len(n[i:i + seg]):]
env = np.sin(np.pi * t / d) ** 2; save('whoosh', verb((y * env * (1 - t / d * .5), y * env * (.5 + t / d * .5)), IR_BIG, .4))
# 超新星:低频塌缩 + 柔和爆发 + 星尘(校园版也适用,无刺耳爆炸声)
d = 3.2; t = T(d); sweep = np.sin(2 * np.pi * np.cumsum(np.geomspace(90, 28, len(t))) / SR) * np.exp(-t * 1.2)
burst = lp(rng.standard_normal(len(t)), 700) * np.exp(-((t - .35) ** 2) / .02) * .6
b = buf(d); add(b, pan(sweep + burst, 0), 0)
for i in range(18): m = DOR[rng.integers(0, 7)] + 24; add(b, pan(metal(hz(m), .9, .7) * .18, rng.uniform(-.9, .9)), .5 + i * .12)
save('boom', verb(b, IR_BIG, .5))
# 石墨层滑动:摩擦沙沙声
d = .6; t = T(d); s = bp(rng.standard_normal(len(t)), 1500, 6000) * np.sin(np.pi * t / d) * (1 + .5 * np.sin(2 * np.pi * 23 * t))
save('slide', (s, np.roll(s, 200)), -8)
# ---- 背景音乐「熔炉星火」64 秒无缝循环:A 多利亚 Am – D – C – G ----
L = 64.0; TAIL = 8.0; b = buf(L + TAIL)
CH = [[45, 52, 57, 60, 64], [50, 57, 62, 66, 69], [48, 55, 60, 64, 67], [43, 50, 55, 59, 62]]
for k in range(8):
    for j, m in enumerate(CH[k % 4]): add(b, pan(pad(hz(m), 10.0) * (.22 if j == 0 else .14), -.6 + j * .3), k * 8)
mel = [69, 71, 72, 74, 76, 78, 79, 81, 83]; i = 4; at = 2.5
while at < L - 1:
    i = int(np.clip(i + rng.integers(-2, 3), 0, len(mel) - 1)); add(b, pan(metal(hz(mel[i]), 2.4, .7) * .22, rng.uniform(-.7, .7)), at)
    if rng.random() < .2: add(b, pan(metal(hz(45), 2.0, .8) * .12, 0), at)  # 远处锻锤
    at += rng.choice([1.5, 2.0, 3.0, 4.0, 6.0])
b = verb(b, IR_BIG, .55)
n = int(SR * L); out = []
for ch in b:
    y = ch[:n].copy(); y[:int(SR * TAIL)] += ch[n:n + int(SR * TAIL)]; out.append(y)
t = np.arange(n) / SR; f0 = round(hz(33) * L) / L
drone = np.sin(2 * np.pi * f0 * t) * (.05 + .02 * np.sin(2 * np.pi * t / 32))
out = [out[0] + drone, out[1] + drone]
save('music-forge-loop', out, -4, music=True)
print('ok')
