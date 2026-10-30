"""Nền Địa Phủ (Diêm La điện) cho Thất Nhật Lục và danh hiệu Khách Quen Của Diêm Vương.
Ghép từ ô gạch LPC (terrain_atlas, base_out_atlas) rồi đổi màu: điện Diêm La từ tường thành LPC, cầu Nại Hà từ gạch LPC,
sông Vong Xuyên từ dung nham LPC nhuộm đỏ tím. Chỉ chấm điểm tay cho lửa ma, hoa bỉ ngạn.
Chạy: cd scripts && python3 gen_diaphu.py . -> public/bg/dia-phu.png"""
import sys, random
sys.argv = sys.argv[:2] if len(sys.argv) > 1 else [sys.argv[0], '.']
import gen_bg as G
import gen_cosmos as C
from PIL import Image

W, H, GROUND = C.W, C.H, C.GROUND
put, hx = C.put, C.hx


def scene():
    img = Image.new('RGBA', (W, H))
    # trời âm u xanh lục đen, dải màu có rắc điểm
    C.gradient(img, ['#020806', '#06120e', '#0a1c16', '#10261e', '#16302a'])
    px = img.load()
    random.seed(4)
    # trăng máu mờ
    C.disc(img, 200, 30, 14, '#5a1a22', ring='#2a0a10', dither=4)
    C.disc(img, 200, 30, 14, '#6a2028')
    # núi đá đen hai lớp
    G.SKY.append(('#10261e', '#16302a'))
    G.MTN.append(('#0c1a16', '#06100c', '#1a2c26'))
    G.MTN.append(('#081410', '#040a08', '#122420'))
    G.mountains(img, len(G.SKY) - 1, 31, 96, 50, 0)
    G.SKY.append(('#10261e', '#16302a'))
    G.mountains(img, len(G.SKY) - 1, 37, 110, 30, 1)
    # điện Diêm La: tường LPC tô đen, mái đỏ thẫm, cửa tối màu đỏ sẫm (30/10 Tyler: cửa vàng quá lộ)
    hall = C.palace(['#06080a', '#10141a', '#1c222a', '#2a323c'], ['#2a0408', '#4a0a10', '#7a1218', '#a82020'], ['#080204', '#1c0508', '#38090e', '#561016'], scale=0.55)
    put(img, hall, 128 - hall.width // 2, GROUND + 2)
    # đất đá đen
    cob = C.gmap(C.COBBLE, ['#040606', '#0a100e', '#121c18', '#1c2a24'])
    C.tile_fill(img, cob, 0, GROUND, W, H)
    # sông Vong Xuyên: dung nham LPC nhuộm đỏ tím
    river = C.gmap(C.LAVA_FLOW, ['#1a0410', '#3a0a1e', '#6a1430', '#a02a40'])
    px = img.load()
    y0 = GROUND + 16
    for x in range(W):
        yy = y0 + (1 if (x // 20) % 2 else 0)
        for k in range(10):
            px[x, yy + k] = river.getpixel((x % 96, 8 + k % 8))
        px[x, yy - 1] = (10, 4, 6, 255)
    # cầu Nại Hà: gạch LPC nhuộm xám tro bắc ngang sông
    brick = C.gmap(C.BRICK.crop((0, 0, 96, 32)), ['#1a1614', '#2e2824', '#443c34', '#5a5046'])
    bridge = brick.crop((0, 0, 60, 6))
    for x0 in range(98, 158, 60):
        img.alpha_composite(bridge, (x0, y0 + 1))
    for x in range(98, 158, 6):  # lan can
        for y in range(y0 - 5, y0 + 1):
            px[x, y] = (70, 60, 52, 255)
    for x in range(98, 158):
        px[x, y0 - 5] = (90, 78, 66, 255)
    # đèn lồng đỏ hai đầu cầu (cột tre, đèn 4x5 điểm)
    for lx in (94, 160):
        for y in range(y0 - 22, y0):
            px[lx, y] = (40, 30, 24, 255)
        for dy in range(5):
            for dx in range(-2, 2):
                px[lx + dx, y0 - 22 + dy] = (220, 50, 30, 255) if 0 < dy < 4 else (120, 20, 16, 255)
        px[lx - 1, y0 - 20] = (255, 200, 90, 255)
        px[lx, y0 - 20] = (255, 230, 140, 255)
    # hoa bỉ ngạn đỏ rải bờ sông
    for _ in range(70):
        x, y = random.randrange(W), random.randrange(GROUND + 4, y0 - 2)
        if 96 < x < 160:
            continue
        px[x, y] = (200, 30, 40, 255)
        if y > GROUND + 4:
            px[x, y - 1] = (240, 70, 70, 255) if random.random() < 0.5 else (150, 20, 30, 255)
    for _ in range(50):
        x, y = random.randrange(W), random.randrange(y0 + 11, H)
        px[x, y] = (180, 24, 36, 255)
    # lửa ma xanh lục lơ lửng
    for _ in range(30):
        x, y = random.randrange(W), random.randrange(10, GROUND - 6)
        px[x, y] = (110, 255, 190, 255) if random.random() < 0.4 else (60, 180, 140, 255)
        if random.random() < 0.5 and y > 0:
            px[x, y - 1] = (40, 120, 96, 255)
    return img


if __name__ == '__main__':
    out = '../public/bg' if sys.argv[1] == '.' else sys.argv[1] + '/../public/bg'
    scene().convert('RGB').save(f'{out}/dia-phu.png', optimize=True)
    print('ok', W, H)
