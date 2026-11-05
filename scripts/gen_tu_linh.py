"""
Vẽ pixel art tứ linh kiểu phương Đông cho linh thú SSS (thay sprite rồng cánh dơi, rùa cá sấu, bồ nông của bộ LPC).
Ra 3 dải khung ngang trong public/lpc/beasts: tl_long.png (Thanh Long), tl_quy.png (Huyền Vũ), tl_phuong.png (Hỏa Phượng).
Chạy: python3 scripts/gen_tu_linh.py
"""
import math
import os
from PIL import Image

OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'lpc', 'beasts')


def hexc(h, a=255):
    h = h.lstrip('#')
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), a)


def dark(c, k=0.45):
    return (int(c[0] * k), int(c[1] * k), int(c[2] * k), 255)


class Canvas:
    def __init__(self, w, h):
        self.w, self.h = w, h
        self.px = [[None] * w for _ in range(h)]

    def put(self, x, y, c):
        x, y = int(round(x)), int(round(y))
        if 0 <= x < self.w and 0 <= y < self.h:
            self.px[y][x] = c

    def get(self, x, y):
        if 0 <= x < self.w and 0 <= y < self.h:
            return self.px[y][x]
        return None

    def disc(self, cx, cy, r, c):
        for y in range(int(cy - r - 1), int(cy + r + 2)):
            for x in range(int(cx - r - 1), int(cx + r + 2)):
                if (x - cx) ** 2 + (y - cy) ** 2 <= r * r:
                    self.put(x, y, c)

    def ellipse(self, cx, cy, rx, ry, c, rot=0.0):
        cr, sr = math.cos(rot), math.sin(rot)
        R = max(rx, ry) + 1
        for y in range(int(cy - R), int(cy + R + 1)):
            for x in range(int(cx - R), int(cx + R + 1)):
                dx, dy = x - cx, y - cy
                u = dx * cr + dy * sr
                v = -dx * sr + dy * cr
                if (u / rx) ** 2 + (v / ry) ** 2 <= 1:
                    self.put(x, y, c)

    def line(self, x0, y0, x1, y1, c, w=1):
        n = int(max(abs(x1 - x0), abs(y1 - y0)) * 2) + 1
        for i in range(n + 1):
            t = i / n
            x, y = x0 + (x1 - x0) * t, y0 + (y1 - y0) * t
            if w <= 1:
                self.put(x, y, c)
            else:
                self.disc(x, y, w / 2, c)

    def poly(self, pts, c):
        xs = [p[0] for p in pts]
        ys = [p[1] for p in pts]
        for y in range(int(min(ys)), int(max(ys)) + 1):
            for x in range(int(min(xs)), int(max(xs)) + 1):
                if inside(pts, x + 0.5, y + 0.5):
                    self.put(x, y, c)

    def outline(self, col=None):
        """viền 1px tối quanh mọi vùng đã tô (màu viền là màu kề sẫm lại)"""
        add = []
        for y in range(self.h):
            for x in range(self.w):
                if self.px[y][x] is not None:
                    continue
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    n = self.get(x + dx, y + dy)
                    if n is not None and n[3] == 255:
                        add.append((x, y, col or dark(n, 0.28)))
                        break
        for x, y, c in add:
            self.px[y][x] = c

    def image(self):
        im = Image.new('RGBA', (self.w, self.h), (0, 0, 0, 0))
        for y in range(self.h):
            for x in range(self.w):
                if self.px[y][x] is not None:
                    im.putpixel((x, y), self.px[y][x])
        return im


def inside(pts, x, y):
    c = False
    j = len(pts) - 1
    for i in range(len(pts)):
        xi, yi = pts[i]
        xj, yj = pts[j]
        if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / (yj - yi + 1e-9) + xi:
            c = not c
        j = i
    return c


def strip(frames):
    w, h = frames[0].size
    im = Image.new('RGBA', (w * len(frames), h), (0, 0, 0, 0))
    for i, f in enumerate(frames):
        im.alpha_composite(f, (i * w, 0))
    return im


# ---------------- Thanh Long: rồng phương Đông, thân rắn uốn lượn, không cánh, có sừng hươu, râu dài, vây lưng, bốn chân móng vàng ----------------
def long_frame(ph, N=96):
    cv = Canvas(N, N)
    body = hexc('#2fa878')
    body_d = hexc('#1d7452')
    scale_c = hexc('#23885f')
    belly = hexc('#efd98a')
    belly_d = hexc('#c9ad5c')
    fin = hexc('#e8542a')
    fin_l = hexc('#ffa040')
    gold = hexc('#ffd36b')
    gold_d = hexc('#c9962e')
    # đường sống lưng: đầu ở trái, đuôi ở phải, uốn hình sin, biên độ tăng dần về đuôi
    S = []
    M = 220
    for i in range(M + 1):
        t = i / M
        x = 22 + t * 68
        A = 4 + 11 * t
        y = 50 + A * math.sin(t * 2.6 * math.pi + ph) - 6 * (1 - t) * math.sin(ph)
        r = 6.2 * (1 - t) ** 0.7 + 1.0
        if t < 0.06:
            r = 5.0 + t * 15
        S.append((x, y, r, t))

    def normal(i):
        a = S[max(0, i - 1)]
        b = S[min(M, i + 1)]
        dx, dy = b[0] - a[0], b[1] - a[1]
        L = math.hypot(dx, dy) or 1
        return -dy / L, dx / L  # trỏ xuống (phía bụng) khi thân nằm ngang

    # chân sau và chân trước (vẽ trước thân để thân đè lên)
    for lt, back in ((0.18, False), (0.24, True), (0.52, False), (0.58, True)):
        i = int(lt * M)
        x, y, r, _ = S[i]
        nx, ny = normal(i)
        sw = math.sin(ph * 2 + lt * 9) * 2
        kx, ky = x + nx * (r + 3) - 2 + sw, y + ny * (r + 3)
        fx, fy = kx - 3 + sw, ky + 4
        col = body_d if back else body
        cv.line(x, y, kx, ky, col, 3)
        cv.line(kx, ky, fx, fy, col, 2.5)
        for k in (-1.5, 0, 1.5):
            cv.put(fx - 2 + k, fy + 1.5, gold)
            cv.put(fx - 2.6 + k, fy + 2.2, gold_d)
    # thân
    for i, (x, y, r, t) in enumerate(S):
        cv.disc(x, y, r, body)
    # bóng lưng, vảy, bụng: tô lại theo khoảng lệch dọc pháp tuyến
    for i, (x, y, r, t) in enumerate(S):
        if i % 2:
            continue
        nx, ny = normal(i)
        for k in range(-int(r) - 1, int(r) + 2):
            px, py = x + nx * k, y + ny * k
            if cv.get(round(px), round(py)) is None:
                continue
            f = k / max(r, 1)
            if f > 0.35:
                c = belly if (int(t * 60) % 2 == 0 or f < 0.8) else belly_d
                # vạch ngang trên bụng
                if int(t * 64) % 3 == 0:
                    c = belly_d
                cv.put(px, py, c)
            elif f < -0.45:
                cv.put(px, py, body_d)
            elif (int(t * 70) + k) % 3 == 0 and -0.4 < f < 0.3:
                cv.put(px, py, scale_c)
    # vây lưng đỏ cam dọc sống lưng
    for i in range(int(0.08 * M), int(0.93 * M), 9):
        x, y, r, t = S[i]
        nx, ny = normal(i)
        h = 2.6 * (1 - t) + 1.2
        bx, by = x - nx * r, y - ny * r
        tx, ty = bx - nx * h + 1.5, by - ny * h
        cv.line(bx, by, tx, ty, fin, 1.6)
        cv.put(tx, ty, fin_l)
    # chùm lửa cuối đuôi
    tx, ty, _, _ = S[-1]
    for k, (dx, dy) in enumerate(((3, -3), (4, 0), (3, 3), (1, -4), (1, 4))):
        cv.line(tx, ty, tx + dx + math.sin(ph + k), ty + dy, fin if k % 2 else fin_l, 1.6)
    # đầu: mõm dài, hàm, mắt, sừng hươu, râu, bờm
    hx, hy, _, _ = S[0]
    hy -= 1
    # bờm lửa sau đầu
    for k in range(6):
        a = math.pi * (0.55 + 0.11 * k) + 0.15 * math.sin(ph + k)
        cv.line(hx + 4, hy - 1, hx + 4 + math.cos(a) * -9, hy - 1 - math.sin(a) * 7, fin if k % 2 else fin_l, 2)
    cv.ellipse(hx, hy - 1, 8, 6, body)
    cv.ellipse(hx - 9, hy + 1, 7, 3.8, body)  # mõm
    cv.ellipse(hx - 15, hy + 0.5, 2.4, 2.4, body_d)  # mũi
    jaw_open = 1.5 + 1.2 * math.sin(ph)
    cv.ellipse(hx - 7, hy + 4 + jaw_open * 0.5, 5.5, 1.8, belly)  # hàm dưới
    cv.line(hx - 12, hy + 3, hx - 3, hy + 3, dark(body, 0.3))  # khe miệng
    cv.put(hx - 11, hy + 4, hexc('#ffffff'))  # nanh
    cv.put(hx - 8, hy + 4, hexc('#ffffff'))
    # gờ mày và mắt
    cv.line(hx - 4, hy - 5, hx + 1, hy - 4, body_d, 1.5)
    cv.put(hx - 2, hy - 2, gold)
    cv.put(hx - 1, hy - 2, gold)
    cv.put(hx - 2, hy - 3, hexc('#1a1a1a'))
    # sừng hươu vàng hai nhánh
    for off, cl in ((0, gold), (2.5, gold_d)):
        bx, by = hx + 2 + off, hy - 5
        cv.line(bx, by, bx + 6, by - 9, cl, 1.6)
        cv.line(bx + 3, by - 4.5, bx + 0.5, by - 9, cl, 1.2)
        cv.line(bx + 5, by - 7.5, bx + 9, by - 10, cl, 1.2)
    # râu dài uốn theo nhịp
    for k, yo in enumerate((0, 2)):
        px, py = hx - 15, hy - 1 + yo
        for s in range(24):
            px += 0.95
            py += 0.5 + 1.0 * math.sin(s * 0.4 + ph + k)
            cv.put(px, py, gold if s % 3 else gold_d)
    # ngọc minh châu bay trước mặt
    ox, oy = 8, 30 + 3 * math.sin(ph)
    cv.disc(ox, oy, 3.3, hexc('#e8f4ff'))
    cv.put(ox - 1, oy - 1, hexc('#ffffff'))
    cv.outline()
    # lửa quanh ngọc (vẽ sau viền cho mềm)
    for k in range(5):
        a = ph + k * 1.25
        cv.put(ox + math.cos(a) * 5, oy + math.sin(a) * 5, fin_l if k % 2 else gold)
    return cv.image()


# ---------------- Huyền Vũ: rùa mai đen ô lục giác viền vàng, rắn quấn mai ngóc đầu ----------------
def quy_frame(ph, N=80):
    cv = Canvas(N, N)
    shell = hexc('#26343c')
    shell_l = hexc('#5f8a98')
    rim = hexc('#b89a52')
    skin = hexc('#4f6658')
    skin_d = hexc('#35473d')
    snake = hexc('#2e6e58')
    snake_l = hexc('#5aa07a')
    snake_b = hexc('#c8d890')
    bob = math.sin(ph) * 1.2
    cx, cy = 42, 50
    # chân
    for lx, back in ((26, True), (34, False), (52, True), (60, False)):
        st = math.sin(ph + lx) * 1.2
        col = skin_d if back else skin
        cv.ellipse(lx + st, cy + 9, 4, 5.5, col)
        for k in (-2, 0, 2):
            cv.put(lx + st + k - 1, cy + 14, hexc('#d8d0b0'))
    # đuôi
    cv.line(cx + 20, cy + 4, cx + 26, cy + 7, skin, 2)
    # đầu rùa thò ra bên trái
    hx, hy = 16 + math.sin(ph) * 0.8, cy + 2 + bob
    cv.line(cx - 14, cy + 3, hx + 4, hy, skin, 5)
    cv.ellipse(hx, hy, 5.5, 4, skin)
    cv.put(hx - 2, hy - 1.5, hexc('#ffd36b'))
    cv.put(hx - 3, hy - 1.5, hexc('#1a1a1a'))
    cv.line(hx - 5, hy + 1.5, hx - 1, hy + 1.5, skin_d)
    # mai: vòm, viền vàng, ô lục giác
    cv.ellipse(cx, cy, 21, 13, rim)
    cv.ellipse(cx, cy - 1, 20, 12, shell)
    # ô mai
    cells = [(cx, cy - 6), (cx - 9, cy - 3), (cx + 9, cy - 3), (cx - 13, cy + 4), (cx, cy + 3), (cx + 13, cy + 4)]
    for (ux, uy) in cells:
        pts = [(ux + 4.5 * math.cos(a), uy + 3.4 * math.sin(a)) for a in [k * math.pi / 3 for k in range(6)]]
        for i in range(6):
            cv.line(pts[i][0], pts[i][1], pts[(i + 1) % 6][0], pts[(i + 1) % 6][1], shell_l)
        cv.put(ux, uy, rim)
    # vạch đáy mai
    cv.line(cx - 19, cy + 8, cx + 19, cy + 8, rim)
    # rắn quấn: dải chéo qua mai, đuôi vòng ra sau, cổ ngóc lên phía trước bên trái
    pts = []
    for i in range(61):
        t = i / 60
        a = math.pi * (0.05 + 1.25 * t)
        x = cx + 19 * math.cos(a)
        y = cy - 2 + 10 * math.sin(a) - 6 * t
        pts.append((x, y))
    # cổ rắn ngóc lên
    nx0, ny0 = pts[-1]
    sway = math.sin(ph) * 3
    neck = [(nx0 + (18 - nx0) * k / 20 + sway * math.sin(k / 20 * math.pi), ny0 + (30 - ny0) * k / 20 - 8 * math.sin(k / 20 * math.pi)) for k in range(21)]
    path = pts + neck
    for i, (x, y) in enumerate(path):
        cv.disc(x, y, 1.9, snake)
    for i, (x, y) in enumerate(path):
        if i % 5 in (0, 1):
            cv.put(x, y - 0.8, snake_l)
    # đầu rắn
    sx, sy = neck[-1]
    cv.ellipse(sx - 2, sy, 4.5, 3, snake)
    cv.put(sx - 3, sy - 1, hexc('#ff4040'))
    cv.line(sx - 6, sy + 1, sx - 4, sy + 1, snake_b)
    cv.outline()
    # lưỡi chẻ (sau viền)
    if math.sin(ph) > 0:
        cv.put(sx - 8, sy + 1, hexc('#e83040'))
        cv.put(sx - 9, sy, hexc('#e83040'))
        cv.put(sx - 9, sy + 2, hexc('#e83040'))
    return cv.image()


# ---------------- Hỏa Phượng: phượng hoàng phương Đông, mào lông, cánh xòe tầng lông đỏ cam vàng, đuôi dài nhiều dải có mắt lông ----------------
def phuong_frame(ph, N=96):
    cv = Canvas(N, N)
    red = hexc('#d8322a')
    red_d = hexc('#8a1a20')
    orange = hexc('#ff8a2a')
    gold = hexc('#ffd36b')
    gold_d = hexc('#c9962e')
    teal = hexc('#2fb0a0')
    cream = hexc('#fff0c8')
    bx, by = 38, 44 + math.sin(ph) * 1.5
    # đuôi: 5 dải lông dài uốn lượn ra sau, cuối dải có mắt lông
    for k in range(5):
        ang = -0.35 + k * 0.17
        px, py = bx + 8, by + 3
        L = 46 - abs(k - 2) * 5
        col = [red, orange, gold, orange, red][k]
        for s in range(L):
            u = s / L
            px += math.cos(ang) * 1.0
            py += math.sin(ang) * 1.0 + 0.9 * math.sin(u * 5 + ph + k * 0.7) * u
            w = 2.4 - u * 1.2
            cv.disc(px, py, w, col)
            if s % 4 == 0 and u > 0.2:
                cv.put(px, py - w, gold if col != gold else orange)
        # mắt lông cuối dải
        cv.disc(px + 1, py, 2.8, gold)
        cv.disc(px + 1, py, 1.6, teal)
        cv.put(px + 1, py, red_d)
    # cánh sau (xa)
    flap = math.sin(ph)
    def wing(sx, sy, up, col_a, col_b, col_c, far):
        # cánh: các lông dài tỏa từ vai, góc theo nhịp vỗ
        base = -0.6 - 1.3 * up
        for k in range(7):
            a = base + 0.13 * k
            L = 29 + k * 2 - (6 if far else 0)
            ex, ey = sx + math.cos(a) * L, sy + math.sin(a) * L * 0.9
            cv.line(sx, sy, ex, ey, col_a, 4.2 - k * 0.25)
            cv.line(sx + (ex - sx) * 0.55, sy + (ey - sy) * 0.55, ex, ey, col_b, 2.6)
            cv.disc(ex, ey, 1.3, col_c)
    wing(bx + 4, by - 4, flap * 0.8 - 0.2, red_d, red, orange, True)
    # thân giọt nước
    cv.ellipse(bx, by, 11, 7, red, rot=0.25)
    cv.ellipse(bx - 2, by + 3, 7, 3.5, orange, rot=0.25)  # ức
    # chân co dưới bụng
    cv.line(bx + 3, by + 6, bx + 1, by + 10, gold_d, 1.4)
    cv.line(bx + 6, by + 6, bx + 5, by + 10, gold_d, 1.4)
    # cánh trước (gần)
    wing(bx + 4, by - 2, flap, red, orange, gold, False)
    # cổ cong và đầu
    hx, hy = 22, 26 + math.sin(ph + 0.6) * 1.2
    for s in range(12):
        u = s / 11
        x = bx - 6 + (hx - (bx - 6)) * u - 3 * math.sin(u * math.pi)
        y = by - 3 + (hy - (by - 3)) * u
        cv.disc(x, y, 3.0 - u * 0.8, red if s % 3 else orange)
    cv.ellipse(hx, hy, 4.2, 3.4, red)
    # mỏ vàng cong
    cv.poly([(hx - 3, hy - 1), (hx - 10, hy + 1.5), (hx - 3, hy + 2)], gold)
    cv.put(hx - 9, hy + 2, gold_d)
    # mắt
    cv.put(hx - 1, hy - 1, cream)
    cv.put(hx - 1.6, hy - 1, hexc('#1a1a1a'))
    # mào ba lông cuộn ra sau
    for k in range(3):
        px, py = hx + 1, hy - 3
        for s in range(9 + k * 2):
            px += 0.9
            py -= 1.0 - s * 0.14 + 0.08 * k
            cv.put(px, py, gold if s < 7 else orange)
        cv.disc(px, py, 1.3, orange)
    # râu lông dưới cằm
    cv.line(hx - 1, hy + 3, hx + 2, hy + 8 + math.sin(ph), orange, 1.4)
    cv.outline()
    # tàn lửa bay quanh
    for k in range(6):
        a = ph * 0.5 + k * 1.05
        r = 30 + 6 * math.sin(k * 2.1 + ph)
        x, y = bx + 14 + math.cos(a) * r * 0.9, by + math.sin(a) * r * 0.5
        cv.put(x, y, gold if k % 2 else orange)
    return cv.image()


# ---------------- Tất Phương: chim hạc một chân, lông xanh đốm đỏ, mỏ trắng, chân bốc lửa ----------------
def tat_phuong_frame(ph, N=64):
    cv = Canvas(N, N)
    blue = hexc('#3a7ab8')
    blue_d = hexc('#24507a')
    red = hexc('#e0402a')
    white = hexc('#f4f0e4')
    gold = hexc('#ffd36b')
    bx, by = 34, 34
    # chân lửa
    cv.line(bx + 1, by + 6, bx + 1, by + 20, hexc('#c9962e'), 1.6)
    for k in range(5):
        fy = by + 20 - k * 2
        w = 3 - k * 0.5 + math.sin(ph + k) * 0.6
        cv.line(bx + 1 - w, fy, bx + 1 + w, fy, red if k % 2 else gold, 1)
    # đuôi
    for k in range(3):
        cv.line(bx + 8, by + 1, bx + 17, by + 4 + k * 2 + math.sin(ph + k), blue_d if k % 2 else blue, 2)
    # thân
    cv.ellipse(bx, by, 10, 7, blue, rot=0.2)
    cv.ellipse(bx + 2, by - 2, 7, 4, blue_d, rot=0.25)  # cánh xếp
    for (dx, dy) in ((-4, 2), (0, 4), (3, 0), (-1, -1), (5, 3)):
        cv.put(bx + dx, by + dy, red)
    # cổ dài cong, đầu, mỏ trắng dài
    hx, hy = 18 + math.sin(ph) * 1.2, 14 + math.cos(ph) * 0.8
    for k in range(14):
        u = k / 13
        cv.disc(bx - 7 + (hx - (bx - 7)) * u + 3 * math.sin(u * math.pi), by - 3 + (hy - (by - 3)) * u, 2.2 - u * 0.6, blue)
    cv.ellipse(hx, hy, 3.2, 2.6, blue)
    cv.put(hx - 1, hy - 3, red)
    cv.put(hx, hy - 3.5, red)
    cv.line(hx - 2, hy + 0.5, hx - 10, hy + 2, white, 1.4)
    cv.put(hx - 1, hy - 0.5, hexc('#1a1a1a'))
    cv.outline()
    return cv.image()


def main():
    os.makedirs(OUT, exist_ok=True)
    phases = [i * 2 * math.pi / 4 for i in range(4)]
    strip([long_frame(p) for p in phases]).save(os.path.join(OUT, 'tl_long.png'))
    strip([quy_frame(p) for p in phases]).save(os.path.join(OUT, 'tl_quy.png'))
    strip([phuong_frame(p) for p in phases]).save(os.path.join(OUT, 'tl_phuong.png'))
    strip([tat_phuong_frame(p) for p in phases]).save(os.path.join(OUT, 'tl_tatphuong.png'))
    print('ok')


if __name__ == '__main__':
    main()
