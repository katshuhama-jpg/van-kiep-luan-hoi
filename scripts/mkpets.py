# Cắt thú cưng từ LPC thành dải 2 hàng: hàng 0 quay trái, hàng 1 quay phải (khung giữ nguyên cỡ gốc)
import sys
from PIL import Image
A = sys.argv[1]  # thư mục scratchpad/lpc/oga/an
D = A + '/animals/lpc animals 2022 v1.1/individual creature spritesheets/'
B = '/home/claude/vkl/public/lpc/beasts/'
OUT = '/home/claude/vkl/public/lpc/pets/'
def clean(im):
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if r > 240 and g < 20 and b > 240: px[x, y] = (0, 0, 0, 0)
    return im
def make(out, src, x0, y0, w, h, n, faces_left):
    im = clean(Image.open(src).convert('RGBA'))
    fr = [im.crop((x0 + i * w, y0, x0 + (i + 1) * w, y0 + h)) for i in range(n)]
    o = Image.new('RGBA', (w * n, h * 2))
    for i, f in enumerate(fr):
        fl = f.transpose(Image.FLIP_LEFT_RIGHT)
        o.alpha_composite(f if faces_left else fl, (i * w, 0))
        o.alpha_composite(fl if faces_left else f, (i * w, h))
    o.save(OUT + out + '.png')
    print(out, w, h, n)
make('soi_con', A + '/wolf1.png', 320, 288, 64, 32, 5, True)
make('ho_ly', D + 'fox, woods.png', 0, 128, 64, 64, 4, True)
make('tuyet_ho', D + 'fox, arctic.png', 0, 128, 64, 64, 4, True)
make('cho_vang', D + 'dog, shiba (Sevarihk).png', 0, 96, 48, 48, 8, False)
make('chuot_bach', D + 'mouse, white.png', 0, 32, 32, 32, 3, False)
make('chuot_xam', D + 'mouse, gray.png', 0, 32, 32, 32, 3, False)
make('nam_linh', D + 'mushroom walker (Sevarihk).png', 0, 32, 32, 32, 4, False)
make('dai_bang', A + '/eagle.png', 0, 0, 32, 32, 3, True)
make('doi', B + 'bat.png', 0, 64, 64, 64, 7, True)
make('ong_vang', B + 'bee.png', 0, 32, 32, 32, 6, True)
make('slime', B + 'slime.png', 0, 64, 64, 64, 8, True)
make('ran_con', B + 'snake.png', 0, 64, 64, 64, 7, True)
# --- thêm 20 thú cưng ---
make('hac_lang', A + '/wolf2.png', 320, 288, 64, 32, 5, True)
make('xich_lang', A + '/wolf5.png', 320, 288, 64, 32, 5, True)
make('bang_lang', A + '/wolf1.png', 320, 288, 64, 32, 5, True)
make('bach_lang', A + '/wolf3.png', 320, 288, 64, 32, 5, True)
make('mai_loc', D + 'deer, light doe.png', 0, 96, 64, 96, 4, True)
make('kim_thu', D + 'mouse, white.png', 0, 32, 32, 32, 3, False)
make('thuc_nhan_hoa', B + 'man_eater_flower.png', 0, 128, 128, 128, 3, True)
make('bach_xa', B + 'snake.png', 0, 64, 64, 64, 7, True)
make('tho_long', B + 'big_worm.png', 0, 64, 64, 64, 4, True)
make('tam_linh', B + 'small_worm.png', 0, 64, 64, 64, 3, True)
make('thu_vuong', D + 'giant rat (Sevarihk).png', 0, 64, 80, 64, 8, True)
make('xich_chi', D + 'mushroom walker, fly amanita (Sevarihk).png', 0, 32, 32, 32, 4, False)
make('hung_con', D + 'bear, black.png', 0, 128, 64, 64, 5, True)
make('tuyet_hung', D + 'bear, polar.png', 0, 128, 64, 64, 5, True)
make('su_tu_con', D + 'lion.png', 0, 64, 64, 64, 5, True)
make('linh_loc', D + 'deer, light buck.png', 0, 96, 64, 96, 4, True)
make('hoa_ho', D + 'fox, woods.png', 0, 128, 64, 64, 4, True)
make('hoa_linh_dich', B + 'slime.png', 0, 64, 64, 64, 8, True)
make('huyet_buc', B + 'bat.png', 0, 64, 64, 64, 7, True)
make('bang_phong', B + 'bee.png', 0, 32, 32, 32, 6, True)
