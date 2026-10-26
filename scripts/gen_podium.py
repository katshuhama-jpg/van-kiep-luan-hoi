# Vẽ nền bục vinh danh Lôi đài: đại điện có long ỷ ở giữa, hai hốc hai bên, trống trận và cờ.
# Pixel 128x88, phóng to bằng image-rendering: pixelated. -> public/bg/podium-loidai.png
from PIL import Image, ImageDraw
W, H = 128, 88
im = Image.new('RGB', (W, H), (26, 14, 12))
d = ImageDraw.Draw(im)
def R(x0, y0, x1, y1, c): d.rectangle([x0, y0, x1, y1], fill=c)
INK=(20,10,8); WOOD=(74,36,24); WOOD2=(96,48,30); RED=(150,28,30); RED2=(110,18,22); GOLD=(232,182,72); GOLD2=(176,124,40); STONE=(120,108,96); STONE2=(92,82,74); STONE3=(150,138,122)
# tường sau: ván gỗ sẫm, sọc dọc
for x in range(0, W, 4): R(x, 8, x+3, 60, (52+(x//4%2)*6, 24, 18))
# xà nhà, mái
R(0, 0, W, 7, INK); R(0, 5, W, 7, WOOD2)
for x in range(0, W, 8): R(x, 1, x+5, 3, (60,30,20))
# vầng sáng sau ngai
for r, c in [(26,(70,34,22)),(20,(96,48,26)),(14,(130,72,30))]:
    d.ellipse([64-r, 34-r, 64+r, 34+r], fill=c)
# ngai long ỷ
R(52, 22, 76, 26, GOLD); R(54, 18, 74, 22, GOLD2); R(58, 14, 70, 18, GOLD)  # tựa lưng tầng
R(62, 10, 66, 14, GOLD); R(63, 8, 65, 10, (255,230,140))  # ngọc đỉnh
R(50, 26, 54, 46, GOLD2); R(74, 26, 78, 46, GOLD2)  # tay vịn
R(54, 26, 74, 44, RED); R(56, 28, 72, 42, RED2)  # nệm
for y in range(28, 42, 4): R(57, y, 71, y, (130,24,28))
R(48, 30, 51, 33, GOLD); R(77, 30, 80, 33, GOLD)  # đầu rồng tay vịn
R(47, 31, 48, 32, (255,230,140)); R(80, 31, 81, 32, (255,230,140))
# bậc thềm giữa (cao nhất)
R(40, 46, 88, 50, STONE3); R(36, 50, 92, 55, STONE); R(32, 55, 96, 60, STONE2)
for x in range(40, 88, 6): R(x, 46, x, 50, STONE)
# hai hốc bên: vòm và bục thấp hơn
for (x0, x1) in [(2, 34), (94, 126)]:
    R(x0, 14, x1, 60, (40,20,16))
    R(x0+2, 16, x1-2, 18, GOLD2)
    # cờ phướn rủ
    cx = (x0+x1)//2
    R(cx-6, 18, cx+6, 40, RED); R(cx-6, 18, cx+6, 19, GOLD); R(cx-5, 40, cx+5, 42, RED)
    R(cx-3, 42, cx+3, 44, RED); R(cx-1, 44, cx+1, 45, RED)
    d.ellipse([cx-3, 25, cx+3, 31], fill=GOLD); d.ellipse([cx-2, 26, cx+2, 30], fill=RED2)
R(4, 56, 32, 60, STONE); R(2, 60, 34, 64, STONE2)      # bục số 2
R(96, 59, 124, 63, STONE); R(94, 63, 126, 67, STONE2)  # bục số 3 (thấp hơn)
# cột đỏ ngăn ba ô
for x in (34, 88):
    R(x, 8, x+6, 72, RED); R(x+1, 8, x+2, 72, (186,48,44)); R(x+5, 8, x+6, 72, RED2)
    R(x-1, 8, x+7, 11, GOLD2); R(x-1, 68, x+7, 72, STONE2)
    R(x+1, 20, x+5, 22, GOLD); R(x+1, 48, x+5, 50, GOLD)
# đèn lồng
for x in (18, 110):
    R(x, 8, x, 10, INK); d.ellipse([x-3, 10, x+3, 16], fill=(220,60,40)); R(x-1, 12, x+1, 14, (255,200,90))
# sàn: đá lát, thảm đỏ ở giữa
R(0, 64, W, H, (60,46,38))
for y in range(64, H, 5):
    R(0, y, W, y, (48,36,30))
    for x in range((y//5%2)*6, W, 12): R(x, y, x, y+4, (48,36,30))
d.polygon([(48,60),(80,60),(92,H),(36,H)], fill=RED)
d.polygon([(51,60),(77,60),(87,H),(41,H)], fill=(170,36,36))
for y in range(62, H, 6): R(46, y, 82, y, GOLD2) if False else None
R(48, 60, 80, 60, GOLD)
# trống trận hai góc (lôi đài)
for x in (6, 106):
    R(x, 70, x+16, 82, (120,40,24)); R(x, 70, x+16, 72, (230,210,170)); R(x, 80, x+16, 82, (90,30,20))
    for k in range(x+2, x+16, 4): R(k, 73, k, 79, GOLD2)
    R(x+2, 82, x+3, 86, WOOD); R(x+13, 82, x+14, 86, WOOD)
# cờ hiệu nhỏ cắm hai bên sàn
for x, col in ((28, (40,90,170)), (99, (40,120,70))):
    R(x, 62, x, 80, WOOD2); d.polygon([(x+1,62),(x+9,64),(x+1,67)], fill=col)
im = im.resize((W*3, H*3), Image.NEAREST)
im.save('/home/claude/vkl/public/bg/podium-loidai.png')
print('ok')
