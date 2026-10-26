"""Nền Tiên giới / Ma giới / Thái Hư giới, ghép từ ô gạch LPC (terrain_atlas, base_out_atlas) rồi đổi màu.
Chạy: python3 scripts/gen_cosmos.py scripts -> public/bg/{tien,ma,hu}-0.png
Dùng lại các hàm của gen_bg.py (trời, núi, mây, đặt sprite)."""
import sys, random, colorsys
sys.argv = sys.argv[:2] if len(sys.argv) > 1 else [sys.argv[0], 'scripts']
import gen_bg as G
from PIL import Image

W, H, GROUND = G.W, G.H, G.GROUND
t, b, put, hx = G.t, G.b, G.put, G.hx


# ---------- đổi màu ----------
def lum(r, g, bb):
    return (0.3 * r + 0.59 * g + 0.11 * bb) / 255


def gmap(im, pal, lo=0.0, hi=1.0):
    """Ánh xạ độ sáng của từng điểm ảnh vào dải màu pal (tối -> sáng), giữ chi tiết LPC"""
    cols = [hx(c) for c in pal]
    n = len(cols) - 1

    def f(r, g, bb):
        v = (lum(r, g, bb) - lo) / max(0.01, hi - lo)
        v = max(0.0, min(0.999, v))
        return cols[min(n, int(v * (n + 1)))]
    return G.remap(im, f)


def hue(im, h, sat=1.0, light=1.0, only=None):
    def f(r, g, bb):
        hh, l, s = colorsys.rgb_to_hls(r / 255, g / 255, bb / 255)
        if only and not only(hh, l, s):
            return (r, g, bb)
        rr, gg, b2 = colorsys.hls_to_rgb(h, max(0, min(1, l * light)), max(0, min(1, s * sat)))
        return (int(rr * 255), int(gg * 255), int(b2 * 255))
    return G.remap(im, f)


def tile_fill(img, tile, x0, y0, x1, y1):
    for x in range(x0, x1, tile.width):
        for y in range(y0, y1, tile.height):
            img.alpha_composite(tile.crop((0, 0, min(tile.width, x1 - x), min(tile.height, y1 - y))), (x, y))


def gradient(img, stops, y0=0, y1=GROUND, bands=9):
    px = img.load()
    cols = [hx(c) for c in stops]
    for y in range(y0, y1):
        f = (y - y0) / max(1, y1 - y0 - 1)
        k = min(bands - 1, int(f * bands)) / (bands - 1)
        seg = min(len(cols) - 2, int(k * (len(cols) - 1)))
        u = k * (len(cols) - 1) - seg
        a, c = cols[seg], cols[seg + 1]
        col = tuple(int(a[i] + (c[i] - a[i]) * u) for i in range(3))
        for x in range(W):
            px[x, y] = col + (255,)


def disc(img, cx, cy, r, col, ring=None, dither=0):
    px = img.load()
    for y in range(cy - r - dither, cy + r + dither + 1):
        for x in range(cx - r - dither, cx + r + dither + 1):
            if not (0 <= x < W and 0 <= y < H):
                continue
            d = ((x - cx) ** 2 + (y - cy) ** 2) ** 0.5
            if d <= r:
                px[x, y] = hx(col) + (255,)
            elif ring and d <= r + dither and (x + y) % 2 == 0:
                px[x, y] = hx(ring) + (255,)


def puff(img, x, y, w, hi, sh):
    """Mây phồng nhiều tầng"""
    px = img.load()
    random.seed(x * 31 + y)
    bumps = [(x + int(w * k), random.randint(3, 6)) for k in (0.2, 0.45, 0.7)]
    for xx in range(x, x + w):
        top = y - 2
        for bx, r in bumps:
            if abs(xx - bx) < r * 1.6:
                top = min(top, y - int(r * (1 - (abs(xx - bx) / (r * 1.6)) ** 2) * 1.4) - 2)
        for yy in range(top, y + 1):
            if 0 <= xx < W and 0 <= yy < H:
                px[xx, yy] = hx(sh if yy >= y - 1 else hi) + (255,)


# ---------- mảnh LPC ----------
CASTLE_WALL = b(20, 26, 3, 2)      # tường đá trắng
WINDOWS = b(23, 24, 3, 3)          # cửa sổ vòm đôi
DOOR = b(21, 27, 2, 4)             # cổng vòm
SPIRE = b(16, 21, 3, 8)            # chóp nhọn xanh
COLUMN = b(15, 22, 1, 7)           # cột tròn
GATE = b(7, 11, 2, 3)              # cổng cột trắng
BRICK = b(3, 12, 3, 4)             # tường gạch xám
STONE = t(18, 14, 2, 2)            # khối đá có cỏ
CLIFF = t(16, 12, 1, 4)
FALL = t(21, 12, 3, 5)
WATER = t(21, 17, 3, 1)
LAVA = t(15, 8, 3, 3)
LAVA_FLOW = t(15, 11, 3, 1)
COBBLE = t(18, 8, 3, 3)
MOONDISC = b(29, 29, 3, 3)
OBELISK = t(14, 12, 1, 3)
CRYSTAL = t(15, 15, 2, 1)
ROCK = G.ROCK


def cut(im, keep):
    im = im.copy()
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            if px[x, y][3] and not keep(*px[x, y][:3]):
                px[x, y] = (0, 0, 0, 0)
    return im


def no_bg(im):
    """Bỏ nền xám của atlas (ô trống)"""
    return cut(im, lambda r, g, bb: not (abs(r - g) < 6 and abs(g - bb) < 6 and r < 70))


def island(w, top_pal, rock_pal, seed):
    """Đảo lơ lửng: mặt cỏ LPC + thân đá LPC thu nhỏ dần thành mũi nhọn"""
    random.seed(seed)
    hgt = 44
    im = Image.new('RGBA', (w, hgt))
    rock = gmap(STONE.crop((0, 32, 64, 64)), rock_pal)
    grass = gmap(STONE.crop((0, 0, 64, 32)), top_pal)
    for x in range(0, w, 32):
        im.alpha_composite(grass.crop((0, 0, 32, 10)), (x, 0))
        for y in range(10, hgt, 32):
            im.alpha_composite(rock.crop((0, 0, 32, 32)), (x, y))
    px = im.load()
    for x in range(w):
        k = abs(x - w / 2) / (w / 2)
        bottom = int(hgt - (hgt - 12) * (k ** 1.4)) - (x * 7 % 3)
        for y in range(bottom, hgt):
            px[x, y] = (0, 0, 0, 0)
    for x in range(w):  # viền trên sáng
        if px[x, 0][3]:
            px[x, 0] = hx(top_pal[-1]) + (255,)
    return im


def palace(wall_pal, roof_pal, win_pal, scale=1):
    """Cung điện ghép từ tường, cửa sổ, cổng và chóp LPC"""
    wall = gmap(CASTLE_WALL, wall_pal)
    win = gmap(no_bg(WINDOWS.crop((0, 0, 96, 70))), win_pal)
    spire = gmap(no_bg(SPIRE.crop((0, 0, 96, 190))), roof_pal)
    im = Image.new('RGBA', (160, 190))
    # thân chính
    for x in range(16, 144, 32):
        for y in range(118, 190, 32):
            im.alpha_composite(wall.crop((0, 0, 32, min(32, 190 - y))), (x, y))
    im.alpha_composite(win.resize((64, 46), Image.NEAREST), (48, 128))
    # hai tháp
    tower = gmap(no_bg(COLUMN), wall_pal)
    for x in (4, 124):
        im.alpha_composite(tower.crop((0, 40, 32, 224)).crop((0, 0, 32, 120)), (x, 70))
        im.alpha_composite(spire.resize((36, 70), Image.NEAREST), (x - 2, 2))
    im.alpha_composite(spire.resize((60, 120), Image.NEAREST), (50, 0))
    im = im.crop((0, 0, 160, 190))
    if scale != 1:
        im = im.resize((int(160 * scale), int(190 * scale)), Image.NEAREST)
    return im


def tree(pal, trunk=('#2a1e24', '#3c2a30')):
    p = G.pine()
    def f(r, g, bb):
        hh, l, s = colorsys.rgb_to_hls(r / 255, g / 255, bb / 255)
        if G.is_green(hh, s):
            return gmap_one(l, pal)
        return gmap_one(l, trunk)
    return G.remap(p, f)


def gmap_one(l, pal):
    cols = [hx(c) for c in pal]
    return cols[max(0, min(len(cols) - 1, int(min(0.999, l * 1.6) * len(cols))))]


# ================= Tiên giới =================
def scene_tien(bare=False):
    img = Image.new('RGBA', (W, H))
    gradient(img, ['#f6c27a', '#f8d6a0', '#fbe6c6', '#fdf2e2'])
    disc(img, 196, 46, 22, '#fff6dc', ring='#fde8b4', dither=5)
    # núi ngọc và núi tím xa
    G.SKY.append(('#f8d6a0', '#fbe6c6'))
    G.MTN.append(('#c8b4dc', '#a894c4', '#e4d8f0'))
    G.MTN.append(('#8ccab0', '#6aa890', '#bce4d0'))
    G.mountains(img, 4, 11, 98, 54, 0)
    G.SKY.append(('#f8d6a0', '#fbe6c6'))
    G.mountains(img, 5, 5, 112, 30, 1)
    # biển mây: ô nước LPC đổi sang trắng hồng
    sea = gmap(WATER, ['#e6d4e8', '#f2e4ee', '#fbf2f4', '#ffffff'])
    tile_fill(img, sea, 0, GROUND - 6, W, H)
    px = img.load()
    for x in range(W):
        y = GROUND - 7 + int(2 * abs(((x // 6) % 4) - 2) / 2)
        for k in range(3):
            px[x, y + k] = (255, 255, 255, 255)
    # đảo lơ lửng
    jade = ['#3e8a6e', '#58a888', '#7cc8a4', '#a8e4c4']
    stone = ['#6a5a7a', '#8a78a0', '#a898c0', '#c8bcdc']
    il = island(96, jade, stone, 2)
    img.alpha_composite(il, (8, 70))
    il2 = island(64, jade, stone, 7)
    img.alpha_composite(il2, (176, 62))
    # cung điện trên đảo lớn
    pal = palace(['#c8b8a8', '#e8dccc', '#f8f0e4', '#fffaf2'], ['#7a3a1a', '#c8782a', '#f0b040', '#fde27a'], ['#5a2a1a', '#a84030', '#e8a040', '#fde27a'], scale=0.3)
    put(img, pal, 30, 72)
    # thác vàng đổ khỏi đảo nhỏ
    fall = None and gmap(FALL.crop((16, 0, 48, 160)), ['#e0a850', '#f0c878', '#fde4a8', '#fffaf0'])
    # cây hoa đào
    blossom = tree(['#a8506e', '#d47898', '#f0a8c0', '#fcd8e4'])
    put(img, blossom.resize((40, 50), Image.NEAREST), 72, 76)
    put(img, blossom.resize((36, 44), Image.NEAREST), 184, 68)
    # mây phồng
    for x, y, w in ((96, 30, 30), (6, 22, 24), (128, 70, 36), (220, 132, 30), (0, 118, 34)):
        puff(img, x, y, w, '#ffffff', '#f2dce4')
    return img


# ================= Ma giới =================
def scene_ma(bare=False):
    img = Image.new('RGBA', (W, H))
    gradient(img, ['#12070c', '#2a0a14', '#4e1018', '#7a1c1c'])
    px = img.load()
    random.seed(9)
    for _ in range(40):  # tro bụi
        x, y = random.randrange(W), random.randrange(GROUND - 30)
        px[x, y] = (150, 60, 50, 255)
    disc(img, 64, 40, 24, '#d8402a', ring='#6a1218', dither=5)
    disc(img, 64, 40, 24, '#d8402a')
    px = img.load()
    for y in range(16, 65):  # bóng tối nửa phải, miệng hố
        for x in range(40, 89):
            if px[x, y][:3] == (216, 64, 42):
                if x - 64 > 10 - (y - 40) * 0.2 and (x + y) % 2 == 0: px[x, y] = (160, 34, 28, 255)
    for cx, cy, r in ((56, 32, 4), (70, 48, 3), (52, 50, 2), (74, 30, 2)):
        disc(img, cx, cy, r, '#a82a20')
        px[cx - 1, cy - 1] = (240, 110, 70, 255)
    G.SKY.append(('#4e1018', '#7a1c1c'))
    G.MTN.append(('#3a141c', '#24090e', '#5a2028'))
    G.MTN.append(('#1c0a10', '#0e0408', '#38141c'))
    G.mountains(img, 6, 17, 100, 58, 0)
    G.SKY.append(('#4e1018', '#7a1c1c'))
    G.mountains(img, 7, 23, 114, 36, 1)
    # thành ma: tường gạch LPC tô đen tím, chóp đỏ máu
    fort = palace(['#140a12', '#24121e', '#38202e', '#4e2e40'], ['#3a0408', '#6a0a10', '#a01818', '#d83428'], ['#200408', '#a01a14', '#f05020', '#ffb050'], scale=0.5)
    put(img, fort, 168, GROUND + 2)
    brick = gmap(BRICK.crop((0, 0, 96, 32)), ['#120810', '#22101c', '#341a28', '#4a2838'])
    tile_fill(img, brick, 140, GROUND - 22, W, GROUND + 2)
    # đất đá đen, sông dung nham LPC
    cob = gmap(COBBLE, ['#0c0608', '#1c0e12', '#2c161a', '#40222a'])
    tile_fill(img, cob, 0, GROUND, W, H)
    lava = gmap(LAVA_FLOW, ['#5a0c08', '#a01e0c', '#e0501a', '#ffb040'])
    px = img.load()
    for x in range(W):  # sông dung nham uốn lượn
        y0 = GROUND + 20 + int(3 * ((x // 16) % 3 == 1)) - int(2 * ((x // 24) % 2))
        for k in range(7):
            px[x, y0 + k] = lava.getpixel((x % 96, 10 + k))
        px[x, y0 - 1] = (40, 8, 8, 255)
    px = img.load()
    for x in range(W):
        px[x, GROUND] = (90, 20, 20, 255)
    # cây chết đen
    dead = tree(['#08040a', '#140a10', '#22121a', '#30182a'], trunk=('#0a0408', '#1a0c10'))
    if not bare:  # sân đấu Ngũ Hành Đài bỏ tiền cảnh
        put(img, dead.resize((60, 76), Image.NEAREST), -12, GROUND + 4)
        put(img, dead.resize((40, 50), Image.NEAREST), 112, GROUND + 2)
    # bia đá đen trước thành
    ob = gmap(no_bg(OBELISK), ['#0e0610', '#1e1018', '#32202c', '#5a2a30'])
    if False:
        put(img, ob, 132, GROUND + 4)
    # đom lửa
    for _ in range(26):
        x, y = random.randrange(W), random.randrange(40, GROUND)
        px[x, y] = (255, 120, 40, 255) if random.random() < 0.5 else (255, 200, 90, 255)
    return img


# ================= Thái Hư giới =================
def scene_hu(bare=False):
    img = Image.new('RGBA', (W, H))
    gradient(img, ['#06061a', '#0e0e2e', '#1a1446', '#2a1a5a'], 0, H)
    px = img.load()
    random.seed(4)
    # tinh vân: đám điểm ảnh dither
    for cx, cy, r, col in ((70, 50, 46, (90, 50, 150)), (190, 34, 36, (40, 90, 150)), (150, 90, 30, (120, 40, 120))):
        for y in range(cy - r, cy + r):
            for x in range(cx - r, cx + r):
                if 0 <= x < W and 0 <= y < H:
                    d = ((x - cx) ** 2 + ((y - cy) * 1.6) ** 2) ** 0.5 / r
                    if d < 1 and random.random() < (1 - d) * 0.7:
                        r0, g0, b0, _ = px[x, y]
                        px[x, y] = (min(255, r0 + col[0] // 2), min(255, g0 + col[1] // 2), min(255, b0 + col[2] // 2), 255)
    for _ in range(140):
        x, y = random.randrange(W), random.randrange(H)
        c = random.choice([(255, 255, 255), (200, 220, 255), (255, 230, 200), (180, 160, 255)])
        px[x, y] = c + (255,)
    for x, y in ((40, 20), (210, 70), (120, 14), (236, 18)):  # sao lớn chữ thập
        for dx, dy in ((0, 0), (1, 0), (-1, 0), (0, 1), (0, -1)):
            px[x + dx, y + dy] = (255, 255, 255, 255)
        for dx, dy in ((2, 0), (-2, 0), (0, 2), (0, -2)):
            px[x + dx, y + dy] = (170, 180, 255, 255)
    # vành xoáy hỗn độn
    disc(img, 196, 40, 14, '#000000', ring='#8a6ae0', dither=3)
    disc(img, 196, 40, 11, '#04020c')
    # đảo đá trôi
    vio = ['#2a1a4a', '#46307a', '#6a52aa', '#9a86d8']
    teal = ['#1a3a4a', '#246a7a', '#3ca0a8', '#84e0d8']
    for x, y, w, sd in ((4, 70, 60, 1), (30, 14, 36, 3), (196, 78, 56, 5), (150, 104, 32, 8)):
        img.alpha_composite(island(w, teal, vio, sd), (x, y))
    # đá vụn lơ lửng
    rk = gmap(no_bg(ROCK), vio)
    for x, y, s in ((80, 96, 14), (132, 70, 10), (238, 120, 12), (60, 30, 8)):
        img.alpha_composite(rk.resize((s, s), Image.NEAREST), (x, y))
    # nền: nền đá xanh LPC tô chàm, cổng cột trắng đổi sắc ngân hà
    plat = gmap(b(30, 25, 2, 2), ['#14102a', '#221a44', '#30265e', '#463a80'])
    tile_fill(img, plat, 0, GROUND, W, H)
    px = img.load()
    for x in range(W):
        px[x, GROUND] = (150, 130, 240, 255)
        if x % 2 == 0:
            px[x, GROUND + 1] = (90, 70, 180, 255)
    if bare:
        return img
    gate = gmap(no_bg(GATE), ['#3a3a7a', '#6a6ab8', '#a8b4e8', '#e4ecff'])
    put(img, gate.resize((84, 96), Image.NEAREST), 86, GROUND + 4)
    col = gmap(no_bg(COLUMN), ['#2a2a5a', '#4a4a8a', '#8a90d0', '#c8d0f4'])
    put(img, col.resize((18, 90), Image.NEAREST).crop((0, 0, 18, 60)), 226, GROUND + 4)
    cr = gmap(no_bg(CRYSTAL), ['#1a3a6a', '#3a7ac0', '#7ad0f0', '#e0fbff'])
    put(img, cr, 196, GROUND + 6)
    put(img, cr.resize((40, 20), Image.NEAREST), 30, GROUND + 4)
    return img


if __name__ == '__main__':
    out = G.OUT
    for name, fn in (('tien', scene_tien), ('ma', scene_ma), ('hu', scene_hu)):
        fn().convert('RGB').save(f'{out}/{name}-0.png', optimize=True)
    print('ok')
