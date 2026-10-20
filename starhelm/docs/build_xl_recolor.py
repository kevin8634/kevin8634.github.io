# 星璃 v0.4.4:与初音拉开差别 —— 双马尾青色挑染改「星云紫→玫瑰粉」渐变,瞳色改鎏金
# 用法: python3 docs/build_xl_recolor.py 原图(xl25_orig.webp) 输出(xl25.webp)
import sys, numpy as np
from PIL import Image
src, out = sys.argv[1], sys.argv[2]
im = Image.open(src).convert('RGBA'); a = np.asarray(im).astype(np.float32) / 255
rgb = a[..., :3]; H, W = rgb.shape[:2]
hsv = np.asarray(Image.fromarray((rgb * 255).astype(np.uint8)).convert('HSV')).astype(np.float32) / 255
h, s, v = hsv[..., 0] * 360, hsv[..., 1], hsv[..., 2]
yy, xx = np.mgrid[0:H, 0:W]; xu, yd = xx / W, yy / H   # yd: 0=顶
cyan = ((h > 160) & (h < 215)).astype(np.float32) * np.clip((s - 0.12) / 0.2, 0, 1)
outer = np.clip(np.maximum((0.24 - xu) / 0.05, (xu - 0.76) / 0.05), 0, 1)
inner = np.clip(np.maximum((0.35 - xu) / 0.05, (xu - 0.65) / 0.05), 0, 1) * np.clip((0.48 - yd) / 0.06, 0, 1)
hair = np.maximum(np.maximum(outer, inner), np.clip((0.17 - yd) / 0.03, 0, 1))
hair = np.clip(hair, 0, 1)
k = cyan * hair
nh = 262 + 50 * np.clip((yd - 0.2) / 0.6, 0, 1)            # 上薰衣草紫 → 下玫瑰粉(粉彩)
k = k * 0.85
h2 = np.where(k > 0, nh, h); s2 = s * (1 - 0.25 * k)
# 眼睛(眨眼贴片区域 br = 0.3359,0.6693,0.1231,0.0677,uv 原点在左下)
bx, by, bw, bh = 0.3359, 0.6693, 0.1231, 0.0677
eye = np.clip(1 - np.hypot(xx - 312, yy - 228) / 15, 0, 1) ** 0.5 * cyan   # 睁开的那只眼(另一只在眨眼)
h2 = np.where(eye > 0, 42, h2); s2 = np.where(eye > 0, np.clip(s * 1.3, 0, 1), s2)
mix = np.maximum(k, eye)[..., None]
hsv2 = np.stack([h2 / 360, np.clip(s2, 0, 1), v], -1)
rgb2 = np.asarray(Image.fromarray((hsv2 * 255).astype(np.uint8), 'HSV').convert('RGB')).astype(np.float32) / 255
res = rgb * (1 - mix) + rgb2 * mix
o = np.concatenate([res, a[..., 3:]], -1)
Image.fromarray((o * 255).clip(0, 255).astype(np.uint8), 'RGBA').save(out, quality=90, method=6)
print('ok', out)
