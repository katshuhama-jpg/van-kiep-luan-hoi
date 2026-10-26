# Nền pixel cho xin xăm lôi đài: gian miếu đêm, cửa sổ trăng tròn, đèn lồng, bàn thờ phủ vải đỏ, nến và lư hương.
# 128x96 -> public/bg/xam-mieu.png (phóng to bằng image-rendering: pixelated)
from PIL import Image, ImageDraw
W, H = 128, 96
im = Image.new('RGB', (W, H), (40, 16, 14)); d = ImageDraw.Draw(im)
def R(x0, y0, x1, y1, c): d.rectangle([x0, y0, x1, y1], fill=c)
INK=(18,8,6); GOLD=(214,164,60); GOLD2=(150,100,34); RED=(140,26,24); RED2=(96,16,16)
# tường gỗ sơn son, ván dọc
for x in range(0, W, 6): R(x, 0, x+5, 70, (70+(x//6%2)*8, 22, 18))
R(0, 0, W, 4, INK); R(0, 4, W, 6, GOLD2)
# cửa sổ trăng tròn ở giữa: trời đêm, trăng, song cửa
d.ellipse([40, 8, 88, 56], fill=GOLD2); d.ellipse([42, 10, 86, 54], fill=(16, 18, 44))
for (x, y) in [(50,18),(78,22),(56,40),(72,46),(64,14),(48,32)]: R(x, y, x, y, (220,220,255))
d.ellipse([66, 16, 78, 28], fill=(250,236,180)); d.ellipse([69, 18, 76, 25], fill=(255,248,210))
for x in range(46, 84, 6): R(x, 12, x, 52, (80, 40, 20))
for y in range(16, 52, 6): R(44, y, 84, y, (80, 40, 20))
d.ellipse([40, 8, 88, 56], outline=GOLD); 
# đèn lồng hai bên
for x in (16, 112):
    R(x, 4, x, 12, INK); R(x-5, 12, x+5, 14, GOLD2)
    d.ellipse([x-7, 14, x+7, 30], fill=(210,50,36)); R(x-5, 18, x+5, 18, (240,110,60)); R(x-5, 24, x+5, 24, (170,30,24))
    R(x-2, 19, x+2, 23, (255,200,90)); R(x-5, 30, x+5, 31, GOLD2); R(x-1, 32, x+1, 37, (230,60,40))
# câu đối hai bên cửa sổ
for x in (28, 94):
    R(x, 10, x+6, 54, RED); R(x, 10, x+6, 11, GOLD); R(x, 53, x+6, 54, GOLD)
    for y in range(15, 50, 7): R(x+2, y, x+4, y+3, GOLD)
# bàn thờ
R(0, 70, W, 74, (60, 30, 20)); R(8, 66, 120, 72, (110, 52, 28)); R(8, 66, 120, 67, (150, 80, 40))
R(14, 72, 114, 96, RED); R(14, 72, 114, 74, GOLD)
for x in range(18, 112, 8): R(x, 78, x+3, 81, GOLD2)
d.polygon([(54,74),(74,74),(70,90),(58,90)], fill=RED2); R(60, 78, 68, 84, GOLD)
R(0, 92, W, 96, INK)
# nến hai bên
for x in (26, 100):
    R(x-3, 58, x+3, 66, (236, 226, 200)); R(x-3, 58, x+3, 59, (255,250,230)); R(x-4, 65, x+4, 66, GOLD2)
    R(x, 53, x, 57, (255, 210, 90)); R(x-1, 55, x+1, 56, (255, 140, 40)); R(x, 52, x, 52, (255,255,200))
# lư hương nhỏ và khói
R(40, 60, 48, 66, GOLD2); R(39, 59, 49, 60, GOLD); R(42, 54, 42, 59, (120,80,60)); R(45, 52, 45, 59, (120,80,60))
for (x, y) in [(42,50),(43,47),(42,44),(45,48),(46,45),(45,42),(44,39)]: R(x, y, x, y, (150,140,140))
R(80, 60, 88, 66, GOLD2); R(79, 59, 89, 60, GOLD)
d.ellipse([81, 55, 87, 60], fill=(220,120,40))
im = im.resize((W*3, H*3), Image.NEAREST)
im.save('/home/claude/vkl/public/bg/xam-mieu.png'); print('ok')
