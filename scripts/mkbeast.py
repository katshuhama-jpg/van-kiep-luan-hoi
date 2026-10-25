import sys
from PIL import Image
d='oga/an/animals/lpc animals 2022 v1.1/individual creature spritesheets/'
def strip(src,x0,y0,w,h,n,out,flip=False,mid=False):
    im=Image.open(src).convert('RGBA')
    px=im.load()
    for y in range(im.height):
        for x in range(im.width):
            r,g,b,a=px[x,y]
            if r>240 and g<20 and b>240: px[x,y]=(0,0,0,0)
    o=Image.new('RGBA',(64*n,64))
    for i in range(n):
        fr=im.crop((x0+i*w,y0,x0+(i+1)*w,y0+h))
        if flip: fr=fr.transpose(Image.FLIP_LEFT_RIGHT)
        o.alpha_composite(fr,(i*64+(64-w)//2,(64-h)//2 if mid else 64-h))
    o.save(out)
P='/home/claude/vkl/public/lpc/beasts/'
strip(d+'fox, woods.png',0,128,64,64,4,P+'fox.png')
strip(d+'fox, woods.png',0,64,64,64,4,P+'fox_r.png')
strip(d+'bear, black.png',0,128,64,64,5,P+'bear.png')
strip(d+'lion.png',0,64,64,64,5,P+'lion.png')
strip('oga/an/wolf1.png',320,288,64,32,5,P+'wolf.png')
strip('oga/an/eagle.png',0,0,32,32,3,P+'eagle.png',mid=True)
