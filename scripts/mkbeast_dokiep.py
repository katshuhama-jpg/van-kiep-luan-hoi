# Cắt dải khung quái Độ Kiếp từ các tấm OpenGameArt đã tải về thư mục newbeasts/ (nguồn và giấy phép ở trang Tác giả)
from PIL import Image
N='newbeasts/'
OUT='/home/claude/vkl/public/lpc/beasts/'
def strip(name, src, boxes, cell, flip=False, bottom=True):
    if not __import__('os').path.exists(src): return  # không có tấm gốc (chạy riêng bước làm sạch)
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

# 20/11: dk_tiger, dk_monkey, dk_toad gốc là tranh thu nhỏ (hơn 1.000 màu, viền mờ) nên lên trận trông vỡ hạt.
# Làm sạch thành pixel, từng khung riêng: cắt alpha cứng, chỉ giữ khối lớn nhất (bỏ mẩu khung bên cạnh lọt vào),
# gộp 12 màu không dither, viền tối 1px như bộ LPC.
from PIL import Image as _I
def clean(name, cell, ncol=12, outline=(30,20,16,255)):
    p=OUT+name+'.png'; im=_I.open(p).convert('RGBA'); W,H=im.size
    a=im.getchannel('A').point(lambda v:255 if v>=110 else 0); A=a.load()
    keep=_I.new('L',im.size,0); K=keep.load()
    for f in range(W//cell):
        x0=f*cell; seen=set(); best=[]
        for y in range(H):
            for x in range(x0,x0+cell):
                if A[x,y] and (x,y) not in seen:
                    comp=[];st=[(x,y)];seen.add((x,y))
                    while st:
                        cx,cy=st.pop();comp.append((cx,cy))
                        for nx,ny in((cx+1,cy),(cx-1,cy),(cx,cy+1),(cx,cy-1)):
                            if x0<=nx<x0+cell and 0<=ny<H and A[nx,ny] and (nx,ny) not in seen: seen.add((nx,ny));st.append((nx,ny))
                    if len(comp)>len(best): best=comp
        for q in best: K[q]=255
    rgb=_I.new('RGB',im.size,(0,0,0)); rgb.paste(im.convert('RGB'),mask=keep)
    qz=rgb.quantize(colors=ncol,method=_I.Quantize.MEDIANCUT,dither=_I.Dither.NONE).convert('RGB')
    out=_I.new('RGBA',im.size,(0,0,0,0)); out.paste(qz,mask=keep); px=out.load()
    for y in range(H):
        for x in range(W):
            x0=(x//cell)*cell
            if K[x,y]==0 and any(x0<=x+dx<x0+cell and 0<=y+dy<H and K[x+dx,y+dy] for dx,dy in((1,0),(-1,0),(0,1),(0,-1))): px[x,y]=outline
    out.save(p)
if __name__=='__main__' and len(__import__('sys').argv)>1 and __import__('sys').argv[1]=='clean':
    OUT=__import__('sys').argv[2]
    for n,c in (('dk_tiger',64),('dk_monkey',64),('dk_toad',48)): clean(n,c)

# 20/11 đêm (khối Ngày 36): soát quái trong trận.
# - dk_dieu: khung cắt cao 47 lấy cả mấy hạt đầu con kền kền hàng dưới, lên trận thành mẩu lạ dưới chân -> bỏ mẩu nhỏ chạm mép khung.
# - whale: viền bán trong suốt (alpha mềm) -> phóng nguyên lần thành viền mờ, cắt alpha cứng.
def drop_edge_bits(name, cell, frac=0.05):
    p=OUT+name+'.png'; im=_I.open(p).convert('RGBA'); W,H=im.size; A=im.load()
    for f in range(W//cell):
        x0=f*cell; seen=set(); comps=[]
        for y in range(H):
            for x in range(x0,x0+cell):
                if A[x,y][3] and (x,y) not in seen:
                    st=[(x,y)];seen.add((x,y));c=[]
                    while st:
                        cx,cy=st.pop();c.append((cx,cy))
                        for dx in(-1,0,1):
                            for dy in(-1,0,1):
                                q=(cx+dx,cy+dy)
                                if x0<=q[0]<x0+cell and 0<=q[1]<H and A[q][3] and q not in seen: seen.add(q);st.append(q)
                    comps.append(c)
        if not comps: continue
        big=max(len(c) for c in comps)
        for c in comps:
            if len(c)<frac*big and any(q[0] in(x0,x0+cell-1) or q[1] in(0,H-1) for q in c):
                for q in c: A[q]=(0,0,0,0)
    im.save(p)
def hard_alpha(name, cut=128):
    p=OUT+name+'.png'; im=_I.open(p).convert('RGBA'); px=im.load()
    for y in range(im.height):
        for x in range(im.width):
            r,g,b,a=px[x,y]; px[x,y]=(r,g,b,255) if a>=cut else (0,0,0,0)
    im.save(p)
if __name__=='__main__' and len(__import__('sys').argv)>1 and __import__('sys').argv[1]=='fix36':
    OUT=__import__('sys').argv[2]
    drop_edge_bits('dk_dieu',64); hard_alpha('whale')
