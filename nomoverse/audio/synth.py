#!/usr/bin/env python3
# 宙律 Nomoverse · 原创合成音乐与交互音效(48kHz 16-bit 立体声,纯程序合成,无采样、无版权素材)
# 调性身份:E 利底亚(E F♯ G♯ A♯ B C♯ D♯),弦乐垫 + 低频脉冲 + 稀疏钟声
# 运行:python3 synth.py → out/*.wav → ffmpeg 转 AAC m4a(音乐 192k,音效 128k)
import numpy as np, wave, os
from scipy.signal import fftconvolve, butter, sosfilt
SR = 48000
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "out")
os.makedirs(OUT, exist_ok=True)
rng = np.random.default_rng(7)

def hz(m): return 440.0 * 2 ** ((m - 69) / 12)
def tt(d): return np.arange(int(d * SR)) / SR
def lp(x, fc, order=2): return sosfilt(butter(order, fc, 'low', fs=SR, output='sos'), x)
def hp(x, fc, order=2): return sosfilt(butter(order, fc, 'high', fs=SR, output='sos'), x)

def make_ir(dur, decay, bright, seed):
    r = np.random.default_rng(seed); t = tt(dur); ir = []
    for ch in range(2):
        n = r.standard_normal(len(t)) * np.exp(-t * (6.9 / decay))
        n = lp(n, bright); n[:int(.012 * SR)] *= np.linspace(0, 1, int(.012 * SR))
        ir.append(n / np.sqrt(np.sum(n ** 2)))
    return ir
IR_BIG = make_ir(5.5, 4.2, 5000, 1)
IR_SMALL = make_ir(1.8, 1.2, 8000, 2)

def verb(st, ir, wet=0.35, keep_tail=False):
    L, R = st
    if keep_tail:
        n = len(L) + len(ir[0]) - 1
        L = np.pad(L, (0, n - len(L))); R = np.pad(R, (0, n - len(R)))
    wl = fftconvolve(L, ir[0])[:len(L)]; wr = fftconvolve(R, ir[1])[:len(R)]
    return np.array([L * (1 - wet) + wl * wet * 1.6, R * (1 - wet) + wr * wet * 1.6])

def pan(x, p):
    a = (p + 1) * np.pi / 4
    return np.array([x * np.cos(a), x * np.sin(a)])

def bell(f, d=3.0, bright=1.0):
    t = tt(d)
    parts = [(1, 1, 1.4), (2.0, .45, 2.2), (2.76, .3 * bright, 3.2), (4.07, .18 * bright, 5.0), (5.43, .1 * bright, 7.0)]
    s = sum(a * np.sin(2 * np.pi * f * m * t + rng.random() * 6) * np.exp(-t * k) for m, a, k in parts if f * m < 20000)
    return s * (1 - np.exp(-t * 900))

def pad_voice(f, d, det=0.12):
    t = tt(d); s = 0
    for c in [-det, -det / 3, det / 3, det]:
        ph = rng.random() * 6.28; ff = f * 2 ** (c / 12)
        s = s + sum(np.sin(2 * np.pi * ff * h * t + ph * h) / h for h in range(1, 11) if ff * h < 9000)
    return s / 4

def norm(st, peak_db=-1.0): return st / np.max(np.abs(st)) * 10 ** (peak_db / 20)

def fit(st, d, fade=0.25):  # 截到 d 秒并淡出,控制音效时长
    n = int(d * SR); st = st[:, :n].copy()
    if st.shape[1] < n: st = np.pad(st, ((0, 0), (0, n - st.shape[1])))
    f = int(fade * SR); st[:, -f:] *= np.cos(np.linspace(0, np.pi / 2, f)) ** 2
    return st

def write(name, st):
    st = np.clip(st, -1, 1); d = (st.T * 32767).astype('<i2')
    with wave.open(os.path.join(OUT, name + ".wav"), 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(d.tobytes())

# ───────────── 1. 背景音乐「宙律」:96 秒无缝循环 ─────────────
def music():
    D = 96.0; TAIL = 8.0; N = int((D + TAIL) * SR)
    mix = np.zeros((2, N)); pulse = np.zeros(N)
    def add(buf, st, t0, g=1.0):
        i = int(t0 * SR); j = min(buf.shape[-1], i + st.shape[-1]); buf[..., i:j] += st[..., :j - i] * g
    # E 利底亚四和弦:Emaj9 → F♯/E(II 级,A♯ 利底亚色彩)→ C♯m7 → B add9;每 12 秒一换,共 8 次
    chords = [[52, 59, 63, 66, 68], [52, 58, 61, 66, 70], [49, 56, 61, 64, 68], [47, 54, 59, 61, 66]] * 2
    roots = [40, 40, 37, 35] * 2
    for i, ch in enumerate(chords):
        t0 = i * 12.0; d = 14.5
        env = np.sin(np.pi * np.clip(tt(d) / d, 0, 1)) ** 1.5
        for k, m in enumerate(ch):
            v = lp(pad_voice(hz(m), d), 1400 + 300 * k) * env * (0.22 if k == 0 else 0.16)
            add(mix, pan(v, -0.6 + 0.3 * k), t0)
        # 慢速低频脉冲:每 3 秒一次(1/96 Hz 周期整除),音高跟随和弦根音,长尾正弦+二次谐波
        for b in range(4):
            tp = t0 + b * 3.0; dp = 2.6; t = tt(dp)
            f = hz(roots[i]); g = 1.0 if b % 2 == 0 else 0.6
            p = (np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * 2 * f * t)) * np.exp(-t * 2.2) * (1 - np.exp(-t * 60))
            add(pulse, lp(p, 300) * g, tp)
    # 稀疏钟声旋律:E 利底亚高音区,随机游走
    scale = [76, 78, 80, 82, 83, 85, 87, 88, 90, 92]
    tm = 3.0; last = 3
    while tm < D - 1:
        last = int(np.clip(last + rng.choice([-2, -1, 1, 1, 2, 3, -3]), 0, len(scale) - 1))
        g = 0.09 + 0.05 * rng.random()
        add(mix, pan(bell(hz(scale[last]), 4.0, 0.8), rng.uniform(-.7, .7)), tm, g)
        if rng.random() < .25:
            add(mix, pan(bell(hz(scale[last] + 12), 3.0, .5), rng.uniform(-.8, .8)), tm + .375, g * .45)
        tm += rng.choice([2.25, 3.0, 3.0, 4.5, 6.0, 6.0])
    mix = verb(mix, IR_BIG, 0.55)
    mix += pan(pulse, 0) * np.max(np.abs(mix)) * 0.55   # 脉冲保持较干、居中
    # 无缝循环:尾巴折回开头,再 tile 滤波取第二份保证滤波器状态连续
    out = mix[:, :int(D * SR)].copy(); tail = mix[:, int(D * SR):]
    out[:, :tail.shape[1]] += tail
    out = lp(np.tile(out, 2), 12000)[:, int(D * SR):]
    # 深空低频:E1/B1 正弦,频率量化到 1/96 Hz 整数倍,循环点相位连续
    t = tt(D); q = lambda f: round(f * D) / D
    sub = (np.sin(2 * np.pi * q(hz(28)) * t) * 0.5 + np.sin(2 * np.pi * q(hz(35)) * t) * 0.25) * (0.6 + 0.4 * np.sin(2 * np.pi * t / 24))
    out += pan(sub * 0.14, 0) * np.max(np.abs(out)) / 0.9
    dn = hp(np.tile(rng.standard_normal(int(D * SR)), 2), 6000)[int(D * SR):]
    dust = dn * (0.5 + 0.5 * np.sin(2 * np.pi * t / 32 + 1)) * 0.004 * np.max(np.abs(out))
    out += np.array([dust, np.roll(dust, 4800)])
    return norm(out, -3.0)

# ───────────── 2. 交互音效(全部 E 利底亚) ─────────────
def arp(notes, gap, d, bright=1.0, gains=None, spread=0.0):
    s = np.zeros((2, int(d * SR)))
    for k, m in enumerate(notes):
        i = int(k * gap * SR); g = gains[k] if gains else 0.5
        p = -spread + 2 * spread * k / max(1, len(notes) - 1)
        b = pan(bell(hz(m), d, bright) * g, p); s[:, i:] += b[:, :s.shape[1] - i]
    return s

def sfx_select():   # E–B–E–A♯ 钟声琶音和弦(利底亚 #4 色彩)
    s = arp([64, 71, 76, 82], .06, 1.5, .9, [.7, .5, .5, .45], .4)
    return norm(fit(verb(s, IR_BIG, .4), 1.3, .5), -3)

def sfx_whoosh(d=1.1):
    t = tt(d); n = rng.standard_normal(len(t)); x = t / d
    fc = 300 + 5000 * x ** 2
    y = np.zeros_like(n); seg = int(SR * .02)
    for i in range(0, len(n), seg):
        y[i:i + seg] = lp(hp(n[max(0, i - 2000):i + seg], fc[i] * .5), fc[i])[-len(n[i:i + seg]):]
    env = np.sin(np.pi * x) ** 2
    st = np.array([y * env * (1 - x) + y * env * .3, y * env * x + y * env * .3])
    tone = pan(np.sin(2 * np.pi * hz(40) * t * (1 + .5 * x)) * env * .5, 0)
    return norm(fit(verb(st * .6 + tone, IR_BIG, .45), 1.3, .3), -4)

def sfx_close():    # 短下行双音 B5 → E5
    s = arp([83, 76], .12, .9, .6, [.55, .6])
    return norm(fit(verb(s, IR_SMALL, .3), .8, .3), -6)

def sfx_tick():     # 极短玻璃/木质点击
    t = tt(.12)
    s = (np.sin(2 * np.pi * hz(100) * t) * .5 + np.sin(2 * np.pi * hz(107) * t) * .25) * np.exp(-t * 60)
    s += lp(hp(rng.standard_normal(len(t)), 1500), 5000) * np.exp(-t * 400) * .4
    s *= (1 - np.exp(-t * 3000))
    return norm(fit(verb(pan(s, 0), IR_SMALL, .15), .15, .05), -10)

def sfx_unlock():   # 上行四音琶音 E5 G♯5 B5 D♯6
    s = arp([76, 80, 83, 87], .09, 1.5, 1.0, [.5, .55, .6, .65], .5)
    return norm(fit(verb(s, IR_BIG, .4), 1.4, .5), -3)

def sfx_star():     # 高音钟声 E6 + 高八度/五度泛音
    s = bell(hz(88), 1.5, 1.0) * .8
    s[:int(.8 * SR)] += bell(hz(100), .8, .4) * .22
    s[int(.04 * SR):] += bell(hz(95), 1.5 - .04, .3)[:len(s) - int(.04 * SR)] * .12
    return norm(fit(verb(pan(s, 0), IR_SMALL, .3), 1.3, .4), -4)

def sfx_swish():    # 篮球入网:轻噪声刷 + 高音
    d = .6; t = tt(d)
    n = lp(hp(rng.standard_normal(len(t)), 2500), 7000)
    env = (t / .03).clip(0, 1) * np.exp(-np.maximum(t - .03, 0) * 9) * (0.75 + 0.25 * np.sin(2 * np.pi * 38 * t))
    brush = n * env
    ding = bell(hz(92), d, .4) * .18
    st = np.array([brush * .9 + ding, np.roll(brush, 120) * .9 + ding])
    return norm(fit(verb(st, IR_SMALL, .25), .6, .2), -5)

def sfx_thud():     # 球落地低频闷响:下滑正弦 + 闷噪声
    d = .45; t = tt(d)
    f = 45 + 45 * np.exp(-t * 25)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 11)
    knock = lp(rng.standard_normal(len(t)), 600) * np.exp(-t * 70) * .6
    s = (body + knock) * (1 - np.exp(-t * 2000))
    return norm(fit(verb(pan(s, 0), IR_SMALL, .12), .45, .15), -3)

if __name__ == "__main__":
    import sys
    if "nomusic" not in sys.argv: write("music-nomoverse-loop", music())
    for name, fn in [("select", sfx_select), ("whoosh", sfx_whoosh), ("close", sfx_close), ("tick", sfx_tick),
                     ("unlock", sfx_unlock), ("star", sfx_star), ("swish", sfx_swish), ("thud", sfx_thud)]:
        write(name, fn())
    print("done")
