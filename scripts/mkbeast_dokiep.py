# Cắt dải khung quái Độ Kiếp từ các tấm OpenGameArt đã tải về thư mục newbeasts/ (nguồn và giấy phép ở trang Tác giả)
from PIL import Image
N='newbeasts/'
OUT='/home/claude/vkl/public/lpc/beasts/'
def strip(name, src, boxes, cell, flip=False, bottom=True):
    im=Image.open(src).convert('RGBA')
    o=Image.new('RGBA',(cell*len(boxes),cell))
    for i,(x,y,w,h) in enumerate(boxes):
        fr=im.crop((x,y,x+w,y+h))
        if flip: fr=fr.transpose(Image.FLIP_LEFT_RIGHT)
        o.alpha_composite(fr,(i*cell+(cell-w)//2, cell-h if bottom else (cell-h)//2))
    o.save(OUT+name+'.png'); print(name, o.size)
row=lambda x0,y,w,h,n:[(x0+i*w,y,w,h) for i in range(n)]
strip('dk_serpent', N+'dwapook_dark_wingless_dragon/dragon_dash.png', row(0,0,64,64,8), 64, flip=True)
strip('dk_flydragon', N+'antumdeluge_flying_dragon/unz/PNG/144x128/flying_dragon-gold.png', row(0,384,144,128,3), 144)
strip('dk_turtle', N+'crisisworks_snappa_kappa/sprite_snappaKappa_strip8.png', row(0,0,64,64,8), 64)
strip('dk_centipede', N+'lpc_centipede/unz/[LPC] Centipede/png/lpc_centipede.png', [((i%5)*128,(i//5)*128,128,128) for i in range(12,20)], 128)
strip('dk_crane', N+'aroach_prehistoric_bird/prehistoric-bird-spritesheet.png', [(0,0,48,48),(48,0,48,48),(0,48,48,48)], 48)
strip('dk_tiger', N+'stendhal_animals_kiheru/unz/tiger.png', row(0,192,64,64,3), 64)
strip('dk_ox', N+'lpc_bull_evert/bull_1.png', row(0,128,128,128,4), 128)
strip('dk_toad', N+'julien_animated_frog/unz/frog/frog.png', [(387,0,48,32),(436,0,48,32),(387,33,48,32)], 48, flip=True)
strip('dk_monkey', N+'stendhal_animals_kiheru/unz/monkey.png', row(0,192,48,64,3), 64)
strip('dk_qilin', N+'antumdeluge_horses_rework/unz/PNG/64x85/unicorn.png', row(0,255,64,85,3), 85)
strip('dk_crab', N+'malekith97_crab/Crab_Walk.png', row(0,64,64,64,2), 64)
strip('dk_spider', N+'lpc_spiders/unz/LPC_Spiders/spider05.png', row(256,64,64,64,6), 64)
strip('dk_boar', N+'lpc_wild_boar/unz/Wild Boar/Boar/Boar Walk.png', row(0,64,64,64,4), 64)
strip('dk_dieu', N+'devnewton_vulture/vulture.png', row(0,0,64,47,4), 64)
