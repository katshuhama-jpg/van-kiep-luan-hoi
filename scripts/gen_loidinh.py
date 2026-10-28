"""Nền Lôi Đỉnh (dọc) cho Chứng Đạo: Tứ Kiếp Vấn Đạo, 13 đạo lôi, Vạn Kiếp Hộ Đạo.
Ghép từ ô gạch LPC (terrain_atlas, base_out_atlas) rồi đổi màu, chỉ vẽ tay phần LPC không có (trời bão, xoáy mây, tia sét).
Chạy: cd scripts && python3 gen_loidinh.py . -> public/bg/loi-dinh.png"""
import sys, random
sys.argv = sys.argv[:2] if len(sys.argv) > 1 else [sys.argv[0], '.']
import gen_bg as G
import gen_cosmos as C
from PIL import Image

W, H = 144, 256
hx = G.hx


def sky(img):
    """Trời bão theo dải, có rắc điểm (dither) giữa hai dải cho khỏi mượt"""
    px = img.load()
    bands = ['#06040e', '#0c0818', '#120c24', '#1a1232', '#221840', '#2c1e4e', '#36265a', '#3e2c62']
    bh = H // len(bands)
    for y in range(H):
        k = min(len(bands) - 1, y // bh)
        col = hx(bands[k])
        nxt = hx(bands[min(len(bands) - 1, k + 1)])
        for x in range(W):
            edge = (y % bh) > bh - 4 and (x + y) % 2 == 0
            px[x, y] = (nxt if edge else col) + (255,)


def blob(img, cx, cy, rx, ry, cols, seed):
    """Đám mây bão nhiều tầng, viền dưới tối, viền trên sáng"""
    random.seed(seed)
    px = img.load()
    for y in range(cy - ry, cy + ry + 1):
        for x in range(cx - rx, cx + rx + 1):
            if not (0 <= x < W and 0 <= y < H):
                continue
            d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2
            wob = 0.12 * ((x * 7 + y * 3) % 5) / 5
            if d < 1 - wob:
                k = 0 if y > cy + ry * 0.35 else 2 if y < cy - ry * 0.45 else 1
                px[x, y] = hx(cols[k]) + (255,)


def vortex(img, cx, cy):
    """Xoáy lôi vân: vòng mây chồng nhau quanh con mắt trời phát sáng"""
    rings = [(84, 30, ['#1a1030', '#2a1c48', '#3e2c66']), (54, 20, ['#22163c', '#36265a', '#54407e']), (38, 14, ['#2c1e4a', '#46346e', '#6a5698']), (24, 9, ['#3a2a5c', '#5a4888', '#8a78c0'])]
    for i, (rx, ry, cols) in enumerate(rings):
        for k in range(10):
            ax = cx + int(rx * 0.85 * ((k * 37 % 19) / 19 * 2 - 1))
            ay = cy + int(ry * 0.6 * ((k * 23 % 11) / 11 * 2 - 1))
            blob(img, ax, ay, max(8, rx // 3), max(5, ry // 2), cols, i * 10 + k)
    px = img.load()
    # con mắt trời: lõi sáng có viền dither
    C_DISC = [(9, '#6a58a8'), (7, '#a898e0'), (5, '#e0d8ff'), (3, '#fff8e0'), (1, '#ffffff')]
    for r, col in C_DISC:
        for y in range(cy - r - 1, cy + r + 2):
            for x in range(cx - r * 2 - 1, cx + r * 2 + 2):
                if 0 <= x < W and 0 <= y < H and ((x - cx) / 2) ** 2 + (y - cy) ** 2 <= r * r:
                    px[x, y] = hx(col) + (255,)


def bolt(img, x, y0, y1, col, seed, branch=True):
    random.seed(seed)
    px = img.load()
    cx = x
    for y in range(y0, y1):
        if y % 3 == 0:
            cx += random.choice((-1, 0, 1))
        for dx in (0,):
            if 0 <= cx + dx < W:
                px[cx + dx, y] = hx(col) + (255,)
        if branch and random.random() < 0.05:
            bolt(img, cx, y, min(y1, y + random.randint(6, 16)), '#8a78c0', seed + y, False)


def peak(img):
    """Đỉnh lôi: thân đá LPC tô xám lam, thắt dần lên một bệ đá phẳng"""
    rock = C.gmap(G.b(30, 25, 2, 2), ['#1a1428', '#2a2240', '#3c3258', '#544a74'])
    top = 168
    mask = Image.new('L', (W, H))
    mp = mask.load()
    for y in range(top, H):
        half = 22 + int((y - top) * 0.55) + (3 if (y // 6) % 2 else 0)
        for x in range(W // 2 - half, W // 2 + half):
            if 0 <= x < W:
                mp[x, y] = 255
    tex = Image.new('RGBA', (W, H))
    for x in range(0, W, 64):
        for y in range(top, H, 64):
            tex.alpha_composite(rock, (x, y))
    img.paste(tex, (0, 0), mask)
    px = img.load()
    # viền sáng bên trái (ánh sét), viền tối bên phải
    for y in range(top, H):
        row = [x for x in range(W) if mp[x, y]]
        if row:
            px[row[0], y] = hx('#8a7ab8') + (255,)
            px[row[0] + 1, y] = hx('#5a4e80') + (255,)
            px[row[-1], y] = hx('#0c0814') + (255,)
    # bệ đá cuội LPC trên đỉnh, viền sáng
    cob = C.gmap(C.COBBLE, ['#2a2438', '#3e3652', '#56506e', '#7a7496'])
    for x in range(W // 2 - 24, W // 2 + 24):
        for y in range(top - 4, top + 3):
            px[x, y] = cob.getpixel((x % 96, y % 96))
        px[x, top - 5] = hx('#a8a0c8') + (255,)
    # hai cột đá LPC hai bên bệ, đã nứt
    gate = C.gmap(C.no_bg(C.GATE), ['#241e34', '#463e5e', '#7a7298', '#c0b8dc'])
    G.put(img, gate.resize((52, 58), Image.NEAREST), W // 2 - 26, top - 3)


def flank(img):
    """Núi đá xa hai bên, cắt từ vách LPC, tối dần"""
    rock = C.gmap(G.b(30, 25, 2, 2), ['#0c0a14', '#14101e', '#1c1628', '#262036'])
    px = img.load()
    for side in (0, 1):
        for x in range(0, 52):
            xx = x if side == 0 else W - 1 - x
            h = 150 - int(30 * (1 - x / 52)) + int(6 * abs(((x // 5) % 4) - 2) / 2)
            for y in range(h, H):
                px[xx, y] = rock.getpixel((x % 64, y % 64))
            px[xx, h] = hx('#3e3458') + (255,)


def islands(img):
    stone = ['#1a1428', '#2a2240', '#40365c', '#5a5080']
    moss = ['#1a2a30', '#24404a', '#346070', '#58909c']
    for x, y, w, sd in ((4, 132, 34, 3), (106, 116, 32, 5), (26, 96, 18, 8), (110, 78, 16, 11)):
        il = C.island(w, moss, stone, sd).resize((w, 26), Image.NEAREST)
        img.alpha_composite(il, (x, y))


def scene():
    img = Image.new('RGBA', (W, H))
    sky(img)
    px = img.load()
    random.seed(2)
    for _ in range(36):
        x, y = random.randrange(W), random.randrange(150)
        px[x, y] = hx(random.choice(['#8a80b0', '#c8c0e8', '#5a5080'])) + (255,)
    vortex(img, W // 2, 38)
    for x, sd in ((22, 1), (118, 4), (60, 7)):
        bolt(img, x, 40, 120 + sd * 4, '#c8b8ff', sd)
    flank(img)
    islands(img)
    peak(img)
    # tro sét bay
    random.seed(5)
    for _ in range(30):
        x, y = random.randrange(W), random.randrange(60, 200)
        px[x, y] = hx(random.choice(['#fff6a8', '#9fd8ff'])) + (255,)
    return img


if __name__ == '__main__':
    scene().convert('RGB').save(f'{G.OUT}/loi-dinh.png', optimize=True)
    print('ok')
