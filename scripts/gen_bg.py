"""Sinh nền pixel cho sân khấu theo việc đang làm x 4 mùa, ghép từ ô gạch LPC.
Chạy: python3 scripts/gen_bg.py scripts -> public/bg/*.png (cần terrain_atlas.png, base_out_atlas.png từ LPC Tile Atlas)"""
import sys, colorsys, random
from PIL import Image

ATL = sys.argv[1] if len(sys.argv) > 1 else '.'
T = Image.open(f'{ATL}/terrain_atlas.png').convert('RGBA')
B = Image.open(f'{ATL}/base_out_atlas.png').convert('RGBA')
OUT = '/home/claude/vkl/public/bg'
W, H = 256, 160
GROUND = 124

def t(c, r, w=1, h=1, src=None):
    s = src or T
    return s.crop((c * 32, r * 32, (c + w) * 32, (r + h) * 32))

def b(c, r, w=1, h=1):
    return t(c, r, w, h, B)

def hx(h):
    return tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))

# ---------- đổi màu theo mùa ----------
def remap(im, fn):
    im = im.copy(); px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, bb, a = px[x, y]
            if a == 0: continue
            px[x, y] = fn(r, g, bb) + (a,)
    return im

def is_green(h, s):
    return 0.17 < h < 0.47 and s > 0.18

def season_plants(im, s, blossom=False):
    def f(r, g, bb):
        h, l, sa = colorsys.rgb_to_hls(r / 255, g / 255, bb / 255)
        if not is_green(h, sa): 
            if s == 3:  # đông: mọi thứ nhạt đi
                return tuple(int(v * 0.85 + 30) for v in (r, g, bb))
            return (r, g, bb)
        if s == 0 and blossom:
            nh, ns, nl = 0.93, min(1, sa * 0.9), min(0.92, l * 1.25 + 0.12)
        elif s == 0:
            nh, ns, nl = h - 0.03, sa * 1.05, min(0.9, l * 1.08)
        elif s == 1:
            nh, ns, nl = h, sa, l
        elif s == 2:
            nh = 0.07 + (l - 0.3) * 0.12; ns = min(1, sa * 1.1); nl = l * 1.02
        else:
            nh, ns, nl = h, sa * 0.25, min(0.85, l * 0.8 + 0.15)
        rr, gg, b2 = colorsys.hls_to_rgb(nh % 1, max(0, min(1, nl)), max(0, min(1, ns)))
        return (int(rr * 255), int(gg * 255), int(b2 * 255))
    return remap(im, f)

def snow_cap(im, depth=2):
    im = im.copy(); px = im.load(); src = im.copy().load()
    for x in range(im.width):
        for y in range(im.height):
            if src[x, y][3] and (y == 0 or src[x, y - 1][3] == 0):
                for k in range(depth):
                    if y + k < im.height and src[x, y + k][3]:
                        px[x, y + k] = (238, 244, 252, 255) if k == 0 else (214, 226, 242, 255)
    return im

def plant(im, s, blossom=False):
    out = season_plants(im, s, blossom)
    return snow_cap(out, 3) if s == 3 else out

# ---------- trời, mây, núi ----------
SKY = [('#cfe8e0', '#f4dbe6'), ('#8fd0f0', '#d8f0f6'), ('#f0c890', '#f8e4b8'), ('#b8c8dc', '#e8eef6')]
MTN = [('#7fae9a', '#5f8e7c', '#a8ccb8'), ('#5f9a7c', '#447a60', '#8cc0a0'), ('#b07a5a', '#8a5a40', '#d8a070'), ('#8a9ab0', '#6a7a90', '#c8d4e4')]

def sky(img, s):
    a, c = hx(SKY[s][0]), hx(SKY[s][1])
    px = img.load()
    bands = 7
    for y in range(GROUND):
        k = min(bands - 1, int(y / GROUND * bands))
        f = k / (bands - 1)
        col = tuple(int(a[i] + (c[i] - a[i]) * f) for i in range(3))
        for x in range(W):
            # rìa dải trộn ô bàn cờ cho mịn kiểu pixel
            if (y / GROUND * bands) % 1 > 0.85 and (x + y) % 2 == 0 and k < bands - 1:
                f2 = (k + 1) / (bands - 1)
                col2 = tuple(int(a[i] + (c[i] - a[i]) * f2) for i in range(3))
                px[x, y] = col2 + (255,)
            else:
                px[x, y] = col + (255,)

def cloud(img, x, y, w, s):
    px = img.load()
    hi = (255, 255, 255, 255) if s != 2 else (255, 246, 226, 255)
    sh = (220, 232, 240, 255) if s != 2 else (244, 216, 180, 255)
    for i in range(w):
        hgt = 3 + int(2 * abs(((i / w) - 0.5) * -2 + 1))
        for j in range(hgt):
            xx, yy = x + i, y - j
            if 0 <= xx < W and 0 <= yy < H:
                px[xx, yy] = hi
        if 0 <= x + i < W: px[x + i, y + 1] = sh

def mountains(img, s, seed, base, amp, layer=0):
    """Dãy núi pixel: đỉnh nhọn, sườn trái đón nắng, sườn phải khuất bóng, tuyết đông, mù chân núi"""
    random.seed(seed)
    px = img.load()
    body, shade, light = (hx(c) for c in MTN[s])
    if layer == 0:
        mix = lambda c, k=0.45: tuple(int(v * (1 - k) + w * k) for v, w in zip(c, hx(SKY[s][1])))
        body, shade, light = mix(body), mix(shade), mix(light)
    peaks = []
    x = -random.randint(10, 40)
    while x < W + 40:
        w = random.randint(50, 90); h = random.randint(int(amp * 0.6), amp)
        peaks.append((x + w // 2, base - h, w)); x += int(w * random.uniform(0.55, 0.8))
    top = [GROUND] * W; side = [0] * W
    for cx, py, w in peaks:
        for xx in range(max(0, cx - w // 2), min(W, cx + w // 2)):
            k = abs(xx - cx) / (w / 2)
            # sườn gồ ghề theo bậc pixel
            y = int(py + (base - py) * k + (2 if (xx // 3) % 2 and k > 0.2 else 0))
            if y < top[xx]: top[xx] = y; side[xx] = 1 if xx > cx else -1
    for xx in range(W):
        for y in range(top[xx], GROUND):
            d = y - top[xx]
            col = shade if side[xx] > 0 else body
            if side[xx] < 0 and d < 3: col = light
            if s == 3 and d < 5 + (xx * 7 % 4): col = (240, 246, 252) if side[xx] < 0 else (206, 218, 236)
            elif layer == 1 and side[xx] > 0 and d > 6 and (xx + y) % 2 == 0: col = body  # dither vùng tối
            px[xx, y] = col + (255,)
        if top[xx] < GROUND: px[xx, top[xx]] = tuple(max(0, v - 35) for v in shade) + (255,)
    # dải mù chân núi
    if layer == 0:
        fog = tuple(min(255, v + 18) for v in hx(SKY[s][1]))
        for y in range(base - 8, base):
            for xx in range(W):
                if (xx + y) % (2 if y > base - 4 else 3) == 0: px[xx, y] = fog + (255,)

# ---------- mặt đất ----------
def wood_tile():
    im = Image.new('RGBA', (32, 32)); px = im.load()
    for y in range(32):
        for x in range(32):
            band = y // 8
            off = (band * 13) % 32
            base = (122, 82, 48) if band % 2 else (110, 72, 42)
            if y % 8 == 0: base = (70, 44, 26)
            elif (x + off) % 32 == 0: base = (82, 52, 30)
            elif (x * 7 + y * 3) % 23 == 0: base = (134, 92, 56)
            px[x, y] = base + (255,)
    return im

def tufts(img, s, xs):
    raw = t(12, 20)
    def keep(r, g, bb):
        h, l, sa = colorsys.rgb_to_hls(r / 255, g / 255, bb / 255)
        return is_green(h, sa)
    tuft = raw.copy(); tp = tuft.load()
    for yy in range(32):
        for xx in range(32):
            r, g, bb, a = tp[xx, yy]
            if a and not keep(r, g, bb): tp[xx, yy] = (0, 0, 0, 0)
    tuft = season_plants(tuft, s) if s != 3 else snow_cap(season_plants(tuft, 3), 1)
    for x in xs: put(img, tuft, x, GROUND + 16)

def ground(img, s, kind='grass'):
    if kind == 'grass':
        tiles = [t(4, 20), t(4, 20)]
    elif kind == 'road':
        tiles = [t(9, 21), t(10, 21)]
    else:
        tiles = [wood_tile(), wood_tile()]  # sàn gỗ
    for x in range(0, W, 32):
        for y in range(GROUND, H, 32):
            tile = tiles[(x // 32 + y // 32) % 2]
            if kind == 'grass': tile = season_plants(tile, s)
            if s == 3 and kind != 'wood': tile = remap(tile, lambda r, g, bb: (min(255, int(200 + (r + g + bb) / 3 * 0.2)), min(255, int(210 + (r + g + bb) / 3 * 0.18)), min(255, int(226 + (r + g + bb) / 3 * 0.12))))
            img.alpha_composite(tile, (x, y))
    px = img.load()
    edge = {0: (90, 150, 70), 1: (60, 120, 50), 2: (150, 110, 50), 3: (250, 252, 255)}[s] if kind == 'grass' else ((150, 110, 70) if kind == 'road' else (90, 60, 40))
    for x in range(W):
        px[x, GROUND] = edge + (255,)
        if kind == 'grass' and x % 3 == 0 and s != 3: px[x, GROUND - 1] = edge + (255,)

def put(img, sprite, x, y_bottom):
    img.alpha_composite(sprite, (x, y_bottom - sprite.height)) if x >= 0 else img.alpha_composite(sprite.crop((-x, 0, sprite.width, sprite.height)), (0, y_bottom - sprite.height))

# ---------- vật thể ----------
def pine():
    im = Image.new('RGBA', (96, 120))
    px = im.load()
    for y in range(92, 120):
        for x in range(42, 54): px[x, y] = ((96, 60, 36, 255) if x > 44 else (70, 44, 28, 255))
    im.alpha_composite(t(27, 15, 3, 3), (0, 0))
    return im
ROUND = t(29, 28, 3, 4)
BUSH = t(24, 12, 3, 3)
ROCK = t(26, 21, 2, 2)
CLIFF = t(16, 12, 1, 4)
STONE = t(18, 14, 2, 2)
FALL = t(21, 12, 3, 5)
WATER = t(21, 17, 3, 1)
STOVE = b(19, 13, 1, 2)
POT = b(17, 12)
BUCKETS = b(15, 14, 2, 2)
BARRELS = b(17, 14, 3, 2)
TORCH = b(28, 22, 1, 2)
SIGN = b(29, 10)
HAY = b(11, 21, 1, 2)

def frozen(im):
    return remap(im, lambda r, g, bb: (min(255, r + 120), min(255, g + 100), min(255, bb + 50)))

def scene_tu_luyen(s):
    img = Image.new('RGBA', (W, H)); sky(img, s)
    cloud(img, 26, 18, 26, s); cloud(img, 120, 30, 18, s)
    mountains(img, s, 3, 92, 64, 0); mountains(img, s, 7, 112, 40, 1)
    ground(img, s)
    top = GROUND - 100
    rock = STONE.crop((0, 32, 32, 64))
    for yy in range(top, GROUND + 8, 32):
        for xx in range(184, W, 32):
            tile = rock if (xx + yy) % 64 else STONE.crop((0, 0, 32, 32))
            img.alpha_composite(season_plants(tile, s), (xx, yy))
    px = img.load()
    for xx in range(184, W):  # mép vách
        px[xx, top] = (60, 56, 66, 255)
        if s == 3:
            for k in range(1, 4): px[xx, top + k] = (240, 246, 252, 255)
        else:
            for k in range(1, 3): px[xx, top + k] = ((90, 150, 70) if s != 2 else (180, 110, 50)) + (255,)
    fall = (FALL if s != 3 else frozen(FALL)).crop((16, 0, 80, 160))
    img.alpha_composite(fall.crop((0, 0, 64, GROUND + 12 - top)), (196, top + 2))
    put(img, pine() if s != 3 else snow_cap(season_plants(pine(), 3), 3), -26, GROUND + 6)
    put(img, plant(pine(), s), 34, GROUND - 2) if False else None
    tufts(img, s, [20, 150, 168])
    return img

def scene_du_ngoan(s):
    img = Image.new('RGBA', (W, H)); sky(img, s)
    cloud(img, 50, 16, 30, s); cloud(img, 180, 26, 20, s)
    mountains(img, s, 11, 88, 56, 0); mountains(img, s, 13, 112, 34, 1)
    ground(img, s, 'road')
    put(img, plant(ROUND, s, blossom=True), -30, GROUND + 4)
    put(img, plant(BUSH, s), 200, GROUND + 4)
    tufts(img, s, [60, 180])
    return img

def scene_kiem_tien(s):
    img = Image.new('RGBA', (W, H)); sky(img, s)
    mountains(img, s, 21, 96, 40, 0)
    ground(img, s, 'road')
    for x0, roof in [(-20, (184, 67, 47)), (168, (61, 111, 176))]:
        wall = b(0, 9, 3, 3)
        put(img, wall, x0, GROUND + 4)
        put(img, b(8, 9), x0 + 34, GROUND - 40)
        px = img.load()
        for xx in range(x0 - 8, x0 + 104):
            for yy in range(GROUND - 104, GROUND - 92):
                if 0 <= xx < W:
                    k = yy - (GROUND - 104)
                    col = roof if k > 2 else tuple(min(255, v + 45) for v in roof)
                    if (xx - x0) % 8 == 0 and k > 2: col = tuple(max(0, v - 45) for v in roof)
                    if k == 11: col = tuple(max(0, v - 70) for v in roof)
                    if s == 3 and k < 4: col = (240, 246, 252)
                    px[xx, yy] = col + (255,)
    put(img, BARRELS.crop((32, 0, 96, 64)), 92, GROUND + 10)
    put(img, SIGN, 112, GROUND - 46)
    put(img, HAY, 140, GROUND + 6)
    return img

def scene_ket_duyen(s):
    img = Image.new('RGBA', (W, H)); sky(img, s)
    cloud(img, 90, 20, 24, s)
    mountains(img, s, 31, 96, 50, 0)
    ground(img, s)
    water = WATER if s != 3 else frozen(WATER)
    for x in range(30, 226, 96):
        img.alpha_composite(water.crop((0, 0, min(96, 226 - x), 32)), (x, GROUND + 6))
        img.alpha_composite(water.crop((0, 0, min(96, 226 - x), 32)), (x, GROUND + 30))
    put(img, b(16, 16, 3, 2), 82, GROUND + 22)
    tufts(img, s, [6, 30, 226])
    put(img, plant(ROUND, s, blossom=True), -40, GROUND + 6)
    put(img, plant(ROUND, s, blossom=True), 200, GROUND + 8)
    return img

def scene_luyen_dan(s):
    img = Image.new('RGBA', (W, H))
    for x in range(0, W, 32):
        for y in range(0, GROUND, 32):
            img.alpha_composite(b(3 + (x // 32) % 3, 13), (x, y))
    win = Image.new('RGBA', (48, 34)); wpx = win.load(); top, bot = hx(SKY[s][0]), hx(MTN[s][0])
    for x in range(48):
        for y in range(34):
            wpx[x, y] = (bot if y > 22 - (2 if 10 < x < 30 else 0) else top) + (255,)
    img.alpha_composite(win, (104, 30))
    ipx = img.load()
    for x in range(102, 154):
        for y in (28, 29, 64, 65): ipx[x, y] = (62, 44, 30, 255)
    for y in range(28, 66):
        for x in (102, 103, 127, 152, 153): ipx[x, y] = (62, 44, 30, 255)
    ground(img, s, 'wood')
    stove = b(19, 13).resize((64, 64), Image.NEAREST)
    put(img, stove, 184, GROUND + 14)
    put(img, b(19, 12).crop((0, 0, 32, 20)), 200, GROUND - 52) if False else None
    put(img, POT, 28, GROUND + 8)
    put(img, b(15, 14), 62, GROUND + 10)
    put(img, b(16, 15), 86, GROUND + 12) if False else None
    put(img, TORCH, 70, GROUND - 40)
    put(img, TORCH, 230, GROUND - 40)
    return img

SCENES = {'tu_luyen': scene_tu_luyen, 'du_ngoan': scene_du_ngoan, 'kiem_tien': scene_kiem_tien, 'ket_duyen': scene_ket_duyen, 'luyen_dan': scene_luyen_dan}
import os
os.makedirs(OUT, exist_ok=True)
for name, fn in SCENES.items():
    for s in range(4):
        im = fn(s).convert('RGB')
        im.save(f'{OUT}/{name}-{s}.png', optimize=True)
print('ok')
