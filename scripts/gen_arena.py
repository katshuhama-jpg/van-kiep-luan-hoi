"""Sân đấu Ngũ Hành Đài: 3 giới (tiên, ma, hư) x 5 hệ của bóng = 15 nền.
Nền giới lấy từ gen_cosmos (ô LPC), mặt đài và đồ bày theo hệ cũng ghép từ ô LPC rồi đổi màu.
Chạy: python3 scripts/gen_arena.py scripts -> public/bg/nhd-{tien,ma,hu}-{kim,moc,thuy,hoa,tho}.png"""
import sys, random
sys.argv = sys.argv[:2] if len(sys.argv) > 1 else [sys.argv[0], 'scripts']
import gen_cosmos as C
from PIL import Image

G = C.G
W, H, GROUND = C.W, C.H, C.GROUND
put, hx, gmap = C.put, C.hx, C.gmap

EL = {
    'kim': ['#3a3428', '#7a6c48', '#c8b878', '#fff4d0'],
    'moc': ['#14301c', '#2a6036', '#58a456', '#b0e49a'],
    'thuy': ['#0c2238', '#1c4876', '#3a82c4', '#a8dcf8'],
    'hoa': ['#320806', '#82200e', '#de5228', '#ffc874'],
    'tho': ['#30200e', '#6e4c24', '#b08444', '#ecd296'],
}
TINT = {'kim': '#fff0b0', 'moc': '#70d880', 'thuy': '#60a8ff', 'hoa': '#ff6030', 'tho': '#d8a050'}
COS_MIX = {'tien': ('#fff8ec', 0.25), 'ma': ('#0c0408', 0.45), 'hu': ('#1a1440', 0.35)}


def mix(c, d, k):
    return tuple(int(a * (1 - k) + b * k) for a, b in zip(c, d))


def tint_sky(img, col, k):
    px = img.load()
    t = hx(col)
    for y in range(GROUND):
        kk = k * (0.4 + 0.6 * y / GROUND)  # đậm dần về phía chân trời
        for x in range(W):
            r, g, b, a = px[x, y]
            px[x, y] = mix((r, g, b), t, kk) + (a,)


def altar(img, el, cos):
    """Mặt đài: đá cuội LPC đổi màu theo hệ, pha sắc của giới; viền đá trắng phía trước"""
    pal = [mix(hx(c), hx(COS_MIX[cos][0]), COS_MIX[cos][1]) for c in EL[el]]
    pal = ['#%02x%02x%02x' % c for c in pal]
    tile = gmap(C.COBBLE, pal)
    img.paste(hx(pal[1]) + (255,), (0, GROUND, W, H))  # lót kín để nền giới không lộ qua ô trong suốt
    C.tile_fill(img, tile, 0, GROUND, W, H)
    px = img.load()
    edge = hx(pal[3])
    for x in range(W):
        px[x, GROUND] = edge + (255,)
        px[x, GROUND + 1] = hx(pal[2]) + (255,)
        if x % 32 == 0:  # khe phiến đá
            for y in range(GROUND + 2, H):
                px[x, y] = hx(pal[0]) + (255,)
    # vòng pháp trận mờ giữa đài
    cx, cy = W // 2, GROUND + 18
    for ang in range(0, 360, 3):
        import math
        x = int(cx + 70 * math.cos(math.radians(ang)))
        y = int(cy + 9 * math.sin(math.radians(ang)))
        if 0 <= x < W and GROUND < y < H:
            px[x, y] = hx(TINT[el]) + (255,)


def ambient(img, el, seed):
    """Không khí theo hệ: kim lấp lánh, mộc lá bay, thủy mưa bụi, hỏa đom lửa, thổ bụi đất"""
    random.seed(seed)
    px = img.load()
    for _ in range(46):
        x, y = random.randrange(W), random.randrange(8, GROUND - 4)
        if el == 'kim':
            c = (255, 248, 200)
            for dx, dy in ((0, 0), (1, 0), (-1, 0), (0, 1), (0, -1)):
                px[(x + dx) % W, y + dy] = c + (255,)
        elif el == 'moc':
            for dx, dy, c in ((0, 0, (120, 210, 110)), (1, 0, (80, 170, 80)), (1, 1, (60, 140, 70))):
                px[(x + dx) % W, y + dy] = c + (255,)
        elif el == 'thuy':
            for k in range(4):
                px[(x + k // 2) % W, min(GROUND - 1, y + k)] = (170, 220, 255, 255)
        elif el == 'hoa':
            px[x, y] = (255, 150, 60, 255) if random.random() < 0.6 else (255, 220, 120, 255)
        else:
            px[x, y] = (210, 170, 110, 255)
            px[(x + 1) % W, y] = (170, 130, 80, 255)


def props(img, el):
    """Đồ bày hai bên đài (giữa để trống cho hai bên giao đấu)"""
    p = EL[el]
    if el == 'kim':
        cr = gmap(C.no_bg(C.CRYSTAL), p)
        col = gmap(C.no_bg(C.COLUMN), ['#6a5420', '#b08a30', '#e8c858', '#fff4c0'])
        put(img, col.resize((20, 92), Image.NEAREST).crop((0, 0, 20, 70)), 4, GROUND + 4)
        put(img, col.resize((20, 92), Image.NEAREST).crop((0, 0, 20, 70)), W - 24, GROUND + 4)
        put(img, cr, 22, GROUND + 8)
        put(img, cr.resize((48, 24), Image.NEAREST), W - 72, GROUND + 6)
    elif el == 'moc':
        tr = C.tree(p)
        put(img, tr.resize((64, 80), Image.NEAREST), -20, GROUND + 6)
        put(img, tr.resize((56, 70), Image.NEAREST), W - 40, GROUND + 6)
        bush = gmap(C.no_bg(G.BUSH), p)
        put(img, bush.resize((40, 40), Image.NEAREST), 30, GROUND + 8)
        put(img, bush.resize((34, 34), Image.NEAREST), W - 66, GROUND + 8)
    elif el == 'thuy':
        fall = C.FALL.crop((16, 0, 80, 160))  # thác LPC giữ màu gốc
        img.alpha_composite(fall.crop((0, 0, 26, GROUND - 20)), (0, 24))
        img.alpha_composite(fall.crop((38, 0, 64, GROUND - 30)), (W - 26, 34))
        px = img.load()
        for x in list(range(0, 26)) + list(range(W - 26, W)):  # bọt nước chân thác
            for y in range(GROUND - 4, GROUND):
                if (x + y) % 2 == 0: px[x, y] = (230, 246, 255, 255)
        water = gmap(C.WATER, p)
        px = img.load()
        for x in range(W):
            for k in range(6):
                px[x, H - 6 + k] = water.getpixel((x % 96, 8 + k))
    elif el == 'hoa':
        lava = gmap(C.LAVA_FLOW, p)
        px = img.load()
        for x in range(W):
            for k in range(7):
                px[x, H - 7 + k] = lava.getpixel((x % 96, 10 + k))
        torch = gmap(C.no_bg(G.TORCH), ['#3a1a0a', '#a03a10', '#f08030', '#fff0a0'])
        put(img, torch.resize((24, 48), Image.NEAREST), 6, GROUND + 4)
        put(img, torch.resize((24, 48), Image.NEAREST), W - 30, GROUND + 4)
    else:
        rock = gmap(C.no_bg(G.ROCK), p)
        for x, y, sz in ((-8, GROUND + 8, 54), (24, GROUND + 12, 34), (W - 46, GROUND + 8, 52), (W - 70, GROUND + 12, 28), (8, GROUND - 30, 26), (W - 30, GROUND - 26, 24)):
            put(img, rock.resize((sz, sz), Image.NEAREST), x, y)


if __name__ == '__main__':
    base = {'tien': C.scene_tien(True), 'ma': C.scene_ma(True), 'hu': C.scene_hu(True)}  # thứ tự cố định vì gen_bg dùng chỉ số bảng màu
    out = G.OUT
    for cos, b0 in base.items():
        for i, el in enumerate(EL):
            img = b0.copy()
            tint_sky(img, TINT[el], 0.22 if cos != 'ma' else 0.3)
            ambient(img, el, i * 7 + len(cos))
            altar(img, el, cos)
            props(img, el)
            img.convert('RGB').save(f'{out}/nhd-{cos}-{el}.png', optimize=True)
    print('ok')
