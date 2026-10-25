# Vẽ icon vật phẩm kiểu kiếm hiệp (pixel 32x32) cho vũ khí, phụ kiện, đan dược -> public/icons/<id>.png
# Không dùng icon châu Âu: kiếm thẳng có tua, đao vòng, thương tua đỏ, quạt, bút lông, phất trần, ngọc bội, lệnh bài, bùa vàng, hồ lô...
import json, math, hashlib, sys
from PIL import Image, ImageDraw

ITEMS = json.load(open(sys.argv[1]))
CATS = json.load(open('/home/claude/vkl/scripts/acc_cats.json'))
OUT = '/home/claude/vkl/public/icons/'
S = 32
INK = (31, 22, 13, 255)

def rgb(h, a=255):
    h = h.lstrip('#')
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), a)

def shade(c, k):
    return tuple(max(0, min(255, int(v * k))) for v in c[:3]) + (255,)

def mixc(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3)) + (255,)

class Icon:
    def __init__(self, seed):
        self.im = Image.new('RGBA', (S, S), (0, 0, 0, 0))
        self.d = ImageDraw.Draw(self.im)
        self.h = int(hashlib.md5(seed.encode()).hexdigest(), 16)
    def r(self, n):
        self.h = (self.h * 1103515245 + 12345) & 0xFFFFFFFFFFFF
        return (self.h >> 16) % n
    def px(self, x, y, c):
        x, y = int(round(x)), int(round(y))
        if 0 <= x < S and 0 <= y < S: self.im.putpixel((x, y), c)
    def line(self, a, b, c, w=1):
        self.d.line([a, b], fill=c, width=w)
    def poly(self, pts, c):
        self.d.polygon([(round(x), round(y)) for x, y in pts], fill=c)
    def disc(self, cx, cy, r, c):
        self.d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=c)
    def outline(self):
        src = self.im.copy()
        W = src.load(); D = self.im.load()
        for y in range(S):
            for x in range(S):
                if W[x, y][3] == 0:
                    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                        nx, ny = x + dx, y + dy
                        if 0 <= nx < S and 0 <= ny < S and W[nx, ny][3] > 0 and W[nx, ny][:3] != INK[:3]:
                            D[x, y] = INK
                            break
    def sparkle(self, c):
        for _ in range(3):
            x, y = 3 + self.r(26), 3 + self.r(10)
            if self.im.getpixel((x, y))[3] == 0:
                self.px(x, y, c); self.px(x - 1, y, shade(c, .8)); self.px(x + 1, y, shade(c, .8)); self.px(x, y - 1, shade(c, .8)); self.px(x, y + 1, shade(c, .8))

# trục chéo: chuôi dưới trái -> mũi trên phải
def P(t, off=0.0, a=(5.5, 26.5), b=(26.5, 5.5)):
    x = a[0] + (b[0] - a[0]) * t; y = a[1] + (b[1] - a[1]) * t
    L = math.hypot(b[0] - a[0], b[1] - a[1]); nx = (b[1] - a[1]) / L * -1; ny = (b[0] - a[0]) / L
    nx, ny = -nx, -ny
    return (x + nx * off, y + ny * off)

TASSELS = ['#d8282a', '#e0a020', '#2a6ab0', '#2a8a4a', '#8a3ab0']

def tassel(ic, x, y, col, n=5):
    c = rgb(col); c2 = shade(c, .7)
    ic.disc(x, y, 1, rgb('#ffd36b'))
    for i in range(n):
        ic.px(x, y + 2 + i, c)
        if i >= 2: ic.px(x - 1, y + 2 + i, c2); ic.px(x + 1, y + 2 + i, c2)
    ic.px(x, y + 2 + n, c2)

def blade_poly(t0, t1, w0, w1, curve=0.0):
    pts_a, pts_b = [], []
    N = 12
    for i in range(N + 1):
        t = t0 + (t1 - t0) * i / N
        k = i / N
        w = w0 + (w1 - w0) * k
        if k > 0.82: w *= max(0.05, (1 - k) / 0.18)
        bow = curve * math.sin(math.pi * k)
        pts_a.append(P(t, w + bow)); pts_b.append(P(t, -w + bow * 0.4))
    return pts_a + pts_b[::-1]

def draw_jian(ic, blade, handle, accent, tas, wood=False):
    bl = rgb(blade); bd = shade(bl, .72); hl = mixc(bl, (255, 255, 255), .5)
    ic.poly(blade_poly(.36, .99, 1.9, 1.6), bd)
    ic.poly(blade_poly(.36, .99, 1.0, 0.8), bl)
    if not wood:
        for i in range(10):
            ic.px(*P(.4 + i * .055, -0.2), hl)
    g = rgb(accent)
    a, b = P(.35, 4), P(.35, -4)
    ic.line(a, b, g, 2)
    ic.px(*P(.37, 0), shade(g, 1.2))
    hc = rgb(handle)
    for i in range(7):
        t = .13 + i * .03
        ic.line(P(t, 1), P(t, -1), hc if i % 2 else shade(hc, .7), 1)
    pa = P(.1, 0)
    ic.disc(pa[0], pa[1], 1.6, g)
    tassel(ic, pa[0], pa[1] + 1, tas)

def draw_dao(ic, blade, handle, accent, tas, big=False):
    bl = rgb(blade); bd = shade(bl, .7); hl = mixc(bl, (255, 255, 255), .45)
    w = 2.6 if big else 2.0
    ic.poly(blade_poly(.36, .99, 1.6, w + 1.2, curve=1.6), bd)
    ic.poly(blade_poly(.36, .95, 0.6, w, curve=1.6), bl)
    for i in range(9): ic.px(*P(.4 + i * .06, -1.2), hl)
    g = rgb(accent)
    ic.line(P(.35, 3), P(.35, -3), g, 2)
    hc = rgb(handle)
    for i in range(7):
        t = .13 + i * .03
        ic.line(P(t, 1), P(t, -1), hc if i % 2 else shade(hc, .7), 1)
    pa = P(.09, 0)
    ic.d.ellipse([pa[0] - 2.5, pa[1] - 2.5, pa[0] + 2.5, pa[1] + 2.5], outline=g, width=1)
    tassel(ic, pa[0], pa[1] + 2, tas, 4)

def draw_spear(ic, head, shaft, tas):
    sc = rgb(shaft)
    ic.line(P(0, 0), P(.78, 0), sc, 2)
    for i in range(6): ic.px(*P(.05 + i * .12, .6), shade(sc, 1.25))
    hc = rgb(head); hd = shade(hc, .7)
    ic.poly(blade_poly(.78, 1.0, 2.6, 2.0), hd)
    ic.poly(blade_poly(.8, .98, 1.2, 1.0), hc)
    t = rgb(tas); t2 = shade(t, .7)
    cx, cy = P(.76, 0)
    for dx, dy in ((0, 1), (1, 2), (-1, 2), (0, 3), (2, 3), (-2, 3), (1, 4), (-1, 4), (0, 5), (2, 5), (-2, 1), (2, 1)):
        ic.px(cx + dx, cy + dy, t if (dx + dy) % 2 else t2)
    ic.line(P(.77, 2), P(.77, -2), rgb('#ffd36b'), 1)

def draw_bow(ic, wood, accent):
    w = rgb(wood)
    # cung cong bên trái, dây thẳng bên phải, mũi tên nằm ngang
    ic.d.arc([4, 3, 26, 29], 95, 265, fill=w, width=3)
    ic.d.arc([5, 4, 25, 28], 100, 260, fill=shade(w, 1.35), width=1)
    ic.line((14, 3), (14, 29), rgb('#e6e0cc'), 1)
    g = rgb(accent)
    ic.d.rectangle([3, 14, 6, 18], fill=g)
    ic.px(14, 3, shade(w, .7)); ic.px(14, 29, shade(w, .7))
    ic.line((6, 16), (27, 16), rgb('#8a5a2a'), 1)
    ic.poly([(30, 16), (26, 14), (26, 18)], rgb('#d8dde8'))
    ic.poly([(7, 15), (4, 12), (9, 15)], rgb('#d8282a')); ic.poly([(7, 17), (4, 20), (9, 17)], rgb('#d8282a'))

def draw_hammer(ic, head, shaft):
    sc = rgb(shaft)
    ic.line(P(0, 0), P(.62, 0), sc, 2)
    hc = rgb(head); hd = shade(hc, .65)
    cx, cy = P(.78, 0)
    ic.disc(cx, cy, 5.5, hd)
    ic.disc(cx - .5, cy - .5, 4.5, hc)
    for a in range(0, 360, 45):
        x = cx + math.cos(math.radians(a)) * 3.6; y = cy + math.sin(math.radians(a)) * 3.6
        ic.px(x, y, shade(hc, .55))
    ic.px(cx - 2, cy - 2, mixc(hc, (255, 255, 255), .6))
    ic.poly([P(.95, -1), P(1.03, 0), P(.95, 1)], hd)
    ic.disc(*P(.02, 0), 1.3, rgb('#ffd36b'))

def draw_sickle(ic, blade, shaft):
    sc = rgb(shaft)
    ic.line(P(0, 0), P(.86, 0), sc, 2)
    bc = rgb(blade); bd = shade(bc, .65)
    cx, cy = P(.82, 0)
    ic.d.pieslice([cx - 9, cy - 9, cx + 9, cy + 9], 180, 300, fill=bd)
    ic.d.pieslice([cx - 7, cy - 6, cx + 7, cy + 8], 180, 300, fill=(0, 0, 0, 0))
    ic.d.arc([cx - 8, cy - 8, cx + 8, cy + 8], 190, 290, fill=bc, width=1)
    ic.disc(cx, cy, 1.4, rgb('#ffd36b'))

def draw_staff(ic, shaft, accent, rings):
    sc = rgb(shaft)
    ic.line(P(0, 0), P(.86, 0), sc, 2)
    for i in range(5): ic.px(*P(.08 + i * .16, .7), shade(sc, 1.3))
    g = rgb(accent)
    cx, cy = P(.92, 0)
    if rings:
        ic.d.ellipse([cx - 4, cy - 4, cx + 4, cy + 4], outline=g, width=2)
        for a in (40, 140, 250):
            ic.d.ellipse([cx + math.cos(math.radians(a)) * 4 - 1.5, cy + math.sin(math.radians(a)) * 4 - 1.5, cx + math.cos(math.radians(a)) * 4 + 1.5, cy + math.sin(math.radians(a)) * 4 + 1.5], outline=shade(g, .8), width=1)
    else:
        ic.disc(cx, cy, 3, g); ic.px(cx - 1, cy - 1, mixc(g, (255, 255, 255), .6))
    ic.disc(*P(.02, 0), 1.3, g)

def draw_whisk(ic, handle, plume):
    hc = rgb(handle)
    ic.line(P(0.05, 0), P(.5, 0), hc, 2)
    cap = P(.52, 0)
    ic.disc(cap[0], cap[1], 1.8, rgb('#ffd36b'))
    pc = rgb(plume); pd = shade(pc, .82)
    for i in range(9):
        ang = math.radians(-60 + i * 9)
        pts = []
        for k in range(14):
            d = k * 1.25
            x = cap[0] + math.cos(ang) * d + k * 0.15
            y = cap[1] + math.sin(ang) * d + (k * k) * 0.06
            pts.append((x, y))
        ic.d.line(pts, fill=pc if i % 2 else pd, width=1)
    tassel(ic, *P(0.03, 0), '#d8282a', 3)

def draw_fan(ic, paper, rib, accent):
    pc = rgb(paper); rc = rgb(rib); g = rgb(accent)
    cx, cy = 7, 26
    ic.d.pieslice([cx - 22, cy - 22, cx + 22, cy + 22], 265, 365, fill=pc)
    ic.d.pieslice([cx - 22, cy - 22, cx + 22, cy + 22], 265, 365, outline=None)
    ic.d.arc([cx - 22, cy - 22, cx + 22, cy + 22], 265, 365, fill=g, width=3)
    for a in range(265, 366, 10):
        x = cx + math.cos(math.radians(a)) * 21; y = cy + math.sin(math.radians(a)) * 21
        ic.line((cx, cy), (x, y), rc, 1)
    # tranh sơn thủy nhỏ
    for dx in range(4):
        ic.px(cx + 9 + dx, cy - 10 + abs(dx - 2), shade(rc, .9))
    ic.disc(cx, cy, 2, rgb('#ffd36b'))
    tassel(ic, cx, cy + 1, '#d8282a', 3)

def draw_brush(ic, shaft, tip):
    sc = rgb(shaft)
    ic.line(P(.08, 0), P(.82, 0), sc, 2)
    for t in (.25, .45, .65): ic.line(P(t, 1.2), P(t, -1.2), shade(sc, .7), 1)
    tc = rgb(tip)
    ic.poly([P(.82, 1.8), P(1.02, 0), P(.82, -1.8)], tc)
    ic.line(P(.82, 1.8), P(.82, -1.8), rgb('#ffd36b'), 1)
    pa = P(.05, 0)
    ic.d.ellipse([pa[0] - 2, pa[1] - 2, pa[0] + 2, pa[1] + 2], outline=rgb('#d8282a'), width=1)

def draw_darts(ic, blade, ribbon):
    bc = rgb(blade); rc = rgb(ribbon)
    for k, (ox, oy) in enumerate(((0, 0), (5, 3), (-4, 5))):
        a = (8 + ox, 22 + oy); b = (22 + ox, 8 + oy)
        ic.poly([b, (b[0] - 5, b[1] + 2), (b[0] - 2, b[1] + 5)], bc)
        ic.line((b[0] - 3, b[1] + 3), (a[0] + 4, a[1] - 4), shade(bc, .6), 1)
        ic.line((a[0] + 4, a[1] - 4), (a[0], a[1] + 1), rc, 1)
        ic.line((a[0] + 4, a[1] - 4), (a[0] - 1, a[1] - 2), rc, 1)

def draw_fist(ic, metal, accent):
    mc = rgb(metal); md = shade(mc, .7)
    ic.d.rounded_rectangle([7, 12, 23, 27], 4, fill=md)
    ic.d.rounded_rectangle([8, 13, 22, 25], 3, fill=mc)
    for i in range(4):
        x = 9 + i * 3.5
        ic.poly([(x, 13), (x + 1.2, 4 + (i % 2)), (x + 2.4, 13)], mixc(mc, (255, 255, 255), .3))
    ic.line((8, 22), (22, 22), rgb(accent), 2)
    ic.line((23, 16), (27, 20), md, 3)

def draw_whip(ic, leather, handle):
    lc = rgb(leather)
    ic.line((5, 27), (11, 21), rgb(handle), 3)
    ic.disc(5, 27, 1.5, rgb('#ffd36b'))
    for i, rr in enumerate((8, 6, 4)):
        ic.d.ellipse([18 - rr, 15 - rr * .8, 18 + rr, 15 + rr * .8], outline=lc if i % 2 == 0 else shade(lc, .75), width=2)
    ic.line((11, 21), (12, 18), lc, 2)
    ic.line((24, 12), (29, 5), lc, 1)

def draw_hoe(ic, metal, shaft):
    ic.line(P(0, 0), P(.85, 0), rgb(shaft), 2)
    mc = rgb(metal)
    cx, cy = P(.85, 0)
    ic.poly([(cx - 1, cy - 2), (cx + 5, cy + 2), (cx + 3, cy + 7), (cx - 3, cy + 2)], mc)
    ic.line((cx + 5, cy + 2), (cx + 3, cy + 7), mixc(mc, (255, 255, 255), .5), 1)

def draw_rod(ic, rod):
    ic.line((4, 28), (28, 3), rgb(rod), 1)
    ic.line((5, 27), (12, 20), shade(rgb(rod), .7), 2)
    ic.line((28, 3), (28, 20), rgb('#e6e0cc'), 1)
    ic.line((28, 20), (27, 22), rgb('#d8dde8'), 1)
    ic.disc(9, 23, 1.6, rgb('#ffd36b'))

def draw_cauldron(ic, metal):
    mc = rgb(metal); md = shade(mc, .65)
    ic.line((10, 22), (8, 29), md, 2); ic.line((22, 22), (24, 29), md, 2); ic.line((16, 24), (16, 29), md, 2)
    ic.d.ellipse([6, 11, 26, 26], fill=md)
    ic.d.ellipse([7, 12, 25, 24], fill=mc)
    ic.line((6, 12), (26, 12), shade(mc, 1.2), 2)
    ic.d.rectangle([7, 7, 9, 12], outline=md); ic.d.rectangle([23, 7, 25, 12], outline=md)
    ic.line((10, 18), (22, 18), shade(mc, .8), 1)
    for x, y in ((14, 6), (16, 3), (18, 5)): ic.px(x, y, (230, 230, 240, 200))

# ---------- phụ kiện ----------
def acc_ngoc(ic, col):
    c = rgb(col); cd = shade(c, .7)
    ic.line((16, 2), (16, 7), rgb('#d8282a'), 1)
    ic.poly([(16, 6), (18, 8), (16, 10), (14, 8)], rgb('#d8282a'))
    ic.disc(16, 18, 7.5, cd); ic.disc(15.5, 17.5, 6.5, c)
    ic.disc(16, 18, 2.4, (0, 0, 0, 0))
    ic.px(12, 14, mixc(c, (255, 255, 255), .6)); ic.px(13, 13, mixc(c, (255, 255, 255), .4))
    tassel(ic, 16, 26, '#d8282a', 3)

def acc_nhan(ic, col):
    c = rgb(col)
    ic.d.ellipse([7, 10, 25, 28], outline=shade(c, .7), width=4)
    ic.d.ellipse([8, 11, 24, 27], outline=c, width=2)
    g = rgb(['#2a8a4a', '#d8282a', '#2a6ab0'][ic.r(3)])
    ic.disc(16, 9, 3.5, shade(g, .7)); ic.disc(15.5, 8.5, 2.5, g); ic.px(15, 8, (255, 255, 255, 255))

def acc_lenh(ic, col):
    c = rgb(col); cd = shade(c, .65)
    ic.d.rounded_rectangle([9, 6, 23, 28], 3, fill=cd)
    ic.d.rounded_rectangle([10, 7, 22, 27], 2, fill=c)
    ic.d.rectangle([12, 9, 20, 25], outline=shade(c, .8))
    ink = shade(c, .4)
    # nét chữ giả: một chữ Hán đơn giản ngẫu nhiên
    for _ in range(4):
        x = 13 + ic.r(5); y = 11 + ic.r(10)
        if ic.r(2): ic.line((x, y), (x + 3, y), ink, 1)
        else: ic.line((x, y), (x, y + 4), ink, 1)
    ic.line((16, 2), (16, 6), rgb('#d8282a'), 1)
    ic.disc(16, 2.5, 1.2, rgb('#ffd36b'))

def acc_bua(ic, col):
    paper = rgb('#f0d060'); ink = rgb(col)
    ic.poly([(10, 3), (22, 3), (22, 28), (16, 26), (10, 28)], paper)
    ic.line((10, 3), (22, 3), shade(paper, .75), 1)
    for y in range(6, 24, 3):
        x = 13 + ic.r(5)
        ic.line((x, y), (x + 2 + ic.r(3), y + 1), ink, 1)
    ic.line((16, 5), (16, 23), ink, 1)
    ic.d.ellipse([13, 18, 19, 24], outline=ink, width=1)

def acc_kinh(ic, col):
    c = rgb(col)
    if ic.r(2):
        # sách đóng chỉ
        ic.d.rectangle([7, 5, 25, 27], fill=shade(c, .7)); ic.d.rectangle([8, 5, 25, 26], fill=c)
        ic.d.rectangle([18, 7, 23, 20], fill=rgb('#f2ecd8'))
        for y in (9, 12, 15, 18): ic.line((19, y), (22, y), shade(c, .5), 1)
        for y in range(7, 26, 4): ic.px(10, y, rgb('#f2ecd8')); ic.px(11, y, rgb('#f2ecd8'))
        ic.line((8, 27), (25, 27), rgb('#f2ecd8'), 1)
    else:
        # cuộn trục
        paper = rgb('#f2ecd8')
        ic.d.rectangle([8, 9, 24, 23], fill=paper)
        for y in (12, 15, 18, 21): ic.line((11, y), (21, y), shade(c, .6), 1)
        ic.line((6, 8), (26, 8), shade(c, .8), 3); ic.line((6, 24), (26, 24), shade(c, .8), 3)
        for x in (5, 27): ic.px(x, 8, rgb('#ffd36b')); ic.px(x, 24, rgb('#ffd36b'))
        ic.line((16, 24), (16, 29), rgb('#d8282a'), 1)

def acc_holo(ic, col):
    c = rgb(col); cd = shade(c, .7)
    ic.disc(16, 22, 7, cd); ic.disc(15.5, 21.5, 6, c)
    ic.disc(16, 11, 4.5, cd); ic.disc(15.6, 10.6, 3.6, c)
    ic.line((12, 15), (20, 15), rgb('#d8282a'), 2)
    ic.line((16, 3), (16, 6), rgb('#6a4a2a'), 2)
    ic.px(13, 19, mixc(c, (255, 255, 255), .5)); ic.px(14, 9, mixc(c, (255, 255, 255), .5))
    tassel(ic, 20, 15, '#d8282a', 4)

def acc_long(ic, col):
    c = rgb(col); cd = shade(c, .7)
    # lông vũ hình lá, cuống chéo
    ic.poly([(7, 26), (12, 15), (20, 7), (27, 4), (24, 12), (16, 21)], cd)
    ic.poly([(9, 24), (13, 15), (20, 8), (25, 6), (22, 12), (15, 20)], c)
    ic.line((5, 28), (26, 5), shade(c, .5), 1)
    for k in range(3):
        ic.px(14 + k * 3, 17 - k * 3, (0, 0, 0, 0))

def acc_tinh(ic, col):
    c = rgb(col)
    ic.poly([(9, 27), (23, 27), (20, 23), (12, 23)], rgb('#c8962e'))
    ic.disc(16, 15, 8, shade(c, .6)); ic.disc(15.5, 14.5, 7, c)
    ic.disc(13, 12, 2, mixc(c, (255, 255, 255), .7)); ic.px(19, 18, mixc(c, (255, 255, 255), .4))
    for x, y in ((5, 6), (27, 9), (26, 22)): ic.px(x, y, mixc(c, (255, 255, 255), .6))

def acc_cot(ic, col):
    c = rgb(col)
    # một chiếc nanh xâu dây
    ic.d.arc([6, 1, 26, 17], 20, 160, fill=rgb('#6a4a2a'), width=1)
    ic.poly([(12, 12), (20, 12), (19, 18), (16, 27), (14, 22), (12, 16)], shade(c, .78))
    ic.poly([(13, 12), (18, 12), (17, 18), (16, 24), (14, 18)], c)
    ic.line((12, 12), (20, 12), rgb('#c8962e'), 2)

def acc_kim(ic, col):
    c = rgb(col); cd = shade(c, .65)
    if ic.r(2):
        ic.disc(16, 16, 11, cd); ic.disc(15.5, 15.5, 10, c)
        ic.d.ellipse([9, 9, 23, 23], outline=cd, width=1)
        ic.disc(16, 16, 2.5, cd)
        for a in range(0, 360, 60): ic.px(16 + math.cos(math.radians(a)) * 5.5, 16 + math.sin(math.radians(a)) * 5.5, cd)
        ic.line((16, 27), (16, 30), rgb('#d8282a'), 1)
    else:
        ic.poly([(11, 8), (21, 8), (24, 24), (8, 24)], cd)
        ic.poly([(12, 9), (20, 9), (22, 23), (10, 23)], c)
        ic.line((8, 24), (24, 24), shade(c, 1.2), 2)
        ic.disc(16, 26, 1.8, cd)
        ic.line((16, 3), (16, 8), rgb('#6a4a2a'), 2)
        ic.line((11, 14), (21, 14), cd, 1)

def acc_kiembay(ic):
    for x in range(S):
        for y in range(S):
            d = abs((x - y))
            if d < 5 and 4 < x < 28: ic.px(x, S - 1 - y, (159, 240, 200, 70))
    draw_jian(ic, '#e6f0ff', '#3d6fb0', '#ffd36b', '#7ac8ff')

def pill(ic, col):
    c = rgb(col)
    ic.d.ellipse([5, 21, 27, 29], fill=rgb('#c8962e')); ic.d.ellipse([6, 21, 26, 27], fill=rgb('#e0b84e'))
    for (x, y, r) in ((11, 17, 4.5), (20, 18, 4), (15.5, 12, 4.5)):
        ic.disc(x, y, r, shade(c, .65)); ic.disc(x - .5, y - .5, r - 1, c); ic.px(x - 2, y - 2, mixc(c, (255, 255, 255), .7))

GROUP_COL = {
    None: ('#d8dde8', '#7a5a3a', '#ffd36b'), 'kiem': ('#e6f0ff', '#3d6fb0', '#ffd36b'), 'dan': ('#ffb057', '#7a3a1e', '#ffd36b'),
    'tran': ('#c8b0ff', '#3a3a4a', '#ffd36b'), 'phat': ('#ffe27a', '#a8302a', '#ffd36b'), 'ma': ('#e0402e', '#1e1a24', '#7a0a1e'), 'yeu': ('#f2f2f6', '#7a5a3a', '#c8962e'),
}
ACC_COL = {'ngoc': ['#5ac88a', '#7ad0b0', '#e8e8f0', '#5ab0e0'], 'nhan': ['#ffd36b', '#d8dde8', '#c8962e'], 'lenh': ['#c8962e', '#a8302a', '#3a3a4a', '#d8dde8'],
           'bua': ['#c8202a', '#2a2a2a'], 'kinh': ['#2a4a8a', '#7a2a1e', '#2a6a4a', '#5a3a6a'], 'ho_lo': ['#e0a040', '#c87a2a', '#8a5a2a'],
           'long': ['#f2f2f6', '#e8603a', '#4a8ac8', '#3a3a3a'], 'tinh': ['#7ac8ff', '#ff8a5a', '#c8b0ff', '#9ff0c8'], 'cot': ['#f0e6c8', '#e0d8c0'], 'kim': ['#c8962e', '#a8703a', '#d8dde8']}
PATH_ACC = {'ma': {'ngoc': '#c8202a', 'tinh': '#7a2aa8', 'bua': '#2a2a2a', 'kinh': '#3a0a10', 'lenh': '#2a2a2a'}, 'phat': {'ngoc': '#f0d060', 'tinh': '#ffe27a', 'lenh': '#c8962e', 'kinh': '#c8962e'}, 'dan': {'tinh': '#ff8a3a', 'ho_lo': '#e0a040'}}

OLD_ACC = {'ngoc_boi': 'ngoc', 'ho_lo': 'ho_lo'}
PILL_COL = {'tu_khi': '#5a9ae0', 'truc_co': '#ffd36b', 'dien_tho': '#5ac88a', 'thanh_tam': '#e8f0ff', 'hoi_xuan': '#e05a5a'}

n = 0
for it in ITEMS['items']:
    iid = it['id']
    if it['slot'] == 'ao':
        continue
    ic = Icon(iid)
    path = it.get('path')
    rare = it.get('rare') or 0
    if it['slot'] == 'vu_khi':
        w = it.get('wpn') or {}
        k = w.get('k') or it['look']
        bl, hd, ac = GROUP_COL.get(path, GROUP_COL[None])
        a = w.get('a') or bl
        # lưỡi: màu thép, trừ khi màu nhấn rõ ràng là đỏ (ma) hoặc vàng (phật)
        blade = a if path in ('ma', 'phat') or (a and int(a[1:3], 16) > int(a[5:7], 16) + 80) else '#d8dde8'
        handle = w.get('b') or hd
        accent = '#ffd36b' if rare >= 2 or path != 'ma' else '#c0202e'
        tas = TASSELS[ic.r(len(TASSELS))] if path != 'ma' else '#7a0a1e'
        if k == 'mockiem': draw_jian(ic, '#c8945a', '#7a4a2a', '#a8703a', '#d8282a', wood=True)
        elif k == 'kiem': draw_jian(ic, blade, handle, accent, tas)
        elif k == 'song':
            draw_jian(ic, blade, handle, accent, tas)
            ic2 = Icon(iid + 'b'); draw_jian(ic2, blade, handle, accent, tas); ic.im.alpha_composite(ic2.im.transpose(Image.FLIP_LEFT_RIGHT))
        elif k == 'dao': draw_dao(ic, blade, handle, accent, tas, big='dai' in iid or 'son' in iid)
        elif k == 'thuong': draw_spear(ic, blade, handle if handle != '#1e1a24' else '#5a3a2a', tas if path != 'ma' else '#d8282a')
        elif k == 'cung': draw_bow(ic, handle if handle not in ('#1e1a24', '#3a3a4a') else '#8a5a2a', accent)
        elif k == 'chuy': draw_hammer(ic, '#c8962e' if path == 'phat' else blade, handle)
        elif k == 'liem': draw_sickle(ic, blade, handle)
        elif k == 'truong': draw_staff(ic, handle if handle != '#3a3a4a' else '#6a5a8a', accent, rings=path == 'phat' or ic.r(2) == 0)
        elif k == 'phattran': draw_whisk(ic, handle, '#f2f2f6')
        elif k == 'quat': draw_fan(ic, '#f2ecd8' if path != 'dan' else '#ffd8a8', '#8a5a2a', a if path else '#2a6ab0')
        elif k == 'but': draw_brush(ic, '#a8885e', '#1e1a24')
        elif k == 'tieu': draw_darts(ic, blade, tas)
        elif k == 'quyen': draw_fist(ic, '#9aa2b4' if path != 'yeu' else '#c8a070', accent)
        elif k == 'roi': draw_whip(ic, '#7a4a2a' if path != 'ma' else '#5a0a1e', '#3a2a1a')
        elif k == 'cuoc': draw_hoe(ic, '#9aa6c0', '#8a5a2a')
        elif k == 'can': draw_rod(ic, '#9aaa5a')
        elif k == 'lodan': draw_cauldron(ic, '#a8703a')
        else: draw_jian(ic, blade, handle, accent, tas)
    else:
        if iid == 'kiem_bay':
            acc_kiembay(ic)
        else:
            cat = CATS.get(iid) or OLD_ACC.get(iid) or 'ngoc'
            col = PATH_ACC.get(path, {}).get(cat) or ACC_COL[cat][ic.r(len(ACC_COL[cat]))]
            {'ngoc': acc_ngoc, 'nhan': acc_nhan, 'lenh': acc_lenh, 'bua': acc_bua, 'kinh': acc_kinh, 'ho_lo': acc_holo, 'long': acc_long, 'tinh': acc_tinh, 'cot': acc_cot, 'kim': acc_kim}[cat](ic, col)
    ic.outline()
    if rare >= 3: ic.sparkle(rgb('#fff3a0'))
    ic.im.save(OUT + iid + '.png')
    n += 1
for pid, col in PILL_COL.items():
    ic = Icon(pid); pill(ic, col); ic.outline(); ic.im.save(OUT + pid + '.png'); n += 1
print('drew', n)
