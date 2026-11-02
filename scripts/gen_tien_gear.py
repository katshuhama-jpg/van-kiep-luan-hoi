# Sinh 36 trang bị tiên giới (sau phi thăng) và icon tô lại màu từ icon có sẵn
import json, colorsys, sys
from PIL import Image
ROOT = sys.argv[1]
ICON = ROOT + '/public/icons/'
MON = {'tien': ['thien_binh', 'loi_thu', 'thien_bang', 'kim_long'], 'ma': ['ma_binh', 'dia_nguc_khuyen', 'ma_bang', 'diet_the_long'], 'hu': ['hu_khong_thu', 'tinh_ha_kinh', 'hon_don_linh', 'thon_thien_thu']}
HUE = {'tien': 0.13, 'ma': 0.99, 'hu': 0.5}
WCOL = {'tien': ('#ffe27a', '#c8902a'), 'ma': ('#e0202e', '#1e1a24'), 'hu': ('#7fe0e0', '#2a2a4a')}
ROBE = {
  'tien': [['#f2ead0', '#c8b080', '#ffe27a', '#fff8e0'], ['#e6f0ff', '#9ab0d8', '#ffe27a', '#ffffff'], ['#ffe9b0', '#c89a40', '#fff4c0', '#ffd36b'], ['#fff4d0', '#d9a020', '#ffffff', '#ffe27a']],
  'ma': [['#3a0a14', '#1a0408', '#ff2a3a', '#6a1a24'], ['#2a1a2a', '#140a14', '#c03050', '#4a2a3a'], ['#4a0a2a', '#200414', '#ff4a8a', '#7a1a4a'], ['#1a0408', '#000000', '#ff2a2a', '#5a0a0a']],
  'hu': [['#2a3a5a', '#141e30', '#7fe0e0', '#4a5a7a'], ['#1e2a4a', '#0e1428', '#c8b0ff', '#3a4a6a'], ['#2a2a4a', '#10101e', '#ffffff', '#5a5a8a'], ['#14141e', '#000008', '#7fe0e0', '#3a3a5a']],
}
DECO = ['van', 'vu', 'long', 'giap']
# (vi, en) tên theo cõi x tầng x ô
N = {
 'tien': [
  [('Thiên Binh phương thiên kích', 'Heavenly Soldier Halberd', 'g_phuong_thien_hoa_kich', 'thuong'), ('Lưu Vân tiên y', 'Drifting Cloud Immortal Robe'), ('Ngọc Lộ tịnh bình', 'Jade Dew Vase', 'g_thien_dao_an')],
  [('Chưởng Tâm Lôi kiếm', 'Palm Thunder Sword', 'g_tru_tien_kiem', 'kiem'), ('Tử Tiêu đạo bào', 'Purple Firmament Robe'), ('Lôi Bộ phù lệnh', 'Thunder Ministry Token', 'g_kiem_tien_lenh')],
  [('Bằng Vũ thần cung', 'Peng Feather Divine Bow', 'g_hau_nghe_than_cung', 'cung'), ('Cửu Thiên huyền y', 'Ninth Heaven Mystic Robe'), ('Vân Tiêu bội', 'Cloud Spire Pendant', 'g_ha_lac_ngoc_phu')],
  [('Hạo Thiên tháp kiếm', 'Haotian Pagoda Sword', 'g_vo_cuc_kiem', 'kiem'), ('Kim Long hoàng bào', 'Golden Dragon Imperial Robe'), ('Hồng Mông tử khí châu', 'Primordial Purple Qi Pearl', 'g_nu_oa_thach')],
 ],
 'ma': [
  [('Huyết Sát đao', 'Blood Slaughter Saber', 'g_ma_than_dao', 'dao'), ('Huyết Hà ma y', 'Blood River Demon Robe'), ('Sát Thần ấn', 'Slaughter God Seal', 'g_cuu_u_an')],
  [('Tam Đầu khuyển liêm', 'Three-Headed Hound Sickle', 'g_vong_xuyen_liem', 'liem'), ('U Minh ma bào', 'Netherworld Demon Robe'), ('Địa Ngục hồn đăng', 'Hell Soul Lamp', 'g_ma_tam_ngoc')],
  [('Cửu U thần tiên', 'Nine Nether Divine Whip', 'g_cuu_u_tien', 'roi'), ('Ma Bằng vũ giáp', 'Demon Peng Feather Armor'), ('Thiên Ma xá lợi', 'Heaven Demon Relic', 'g_thien_ma_xa_loi')],
  [('Diệt Thế ma kích', 'World-Ending Demon Halberd', 'g_phe_thien_dao', 'dao'), ('Ma Long đế giáp', 'Demon Dragon Emperor Armor'), ('Vạn Ma triều tông lệnh', 'Ten Thousand Demons Token', 'g_huyet_than_kinh')],
 ],
 'hu': [
  [('Hư Không trượng', 'Void Staff', 'g_hong_mong_truong', 'truong'), ('Vô Tướng y', 'Formless Robe'), ('Tinh Toa la bàn', 'Star Shuttle Compass', 'g_chu_thien_tinh_dau_ban')],
  [('Tinh Hà bút', 'Star River Brush', 'g_thai_at_but', 'but'), ('Ngân Hà sa y', 'Milky Way Gauze Robe'), ('Kình Ca ngọc', 'Whalesong Jade', 'g_tam_muoi_hoa_chung')],
  [('Hỗn Độn phất trần', 'Chaos Whisk', 'g_that_bao_phat_tran', 'phattran'), ('Hỗn Độn đạo y', 'Chaos Dao Robe'), ('Thái Sơ trận bàn', 'Primal Beginning Array Plate', 'g_hong_mong_tran_ban')],
  [('Thôn Thiên mâu', 'Sky-Devourer Spear', 'g_yeu_de_mau', 'thuong'), ('Thái Hư giáp', 'Great Void Armor'), ('Vô Cực đạo ấn', 'Limitless Dao Seal', 'g_thien_dao_an')],
 ],
}
DESC = {
 'tien': ('Đồ của Thiên đình, linh khí trong veo, đeo vào tâm cảnh lặng như mặt hồ.', 'Gear of the Heavenly Court. Its spirit energy is crystal clear and stills the mind like a lake.'),
 'ma': ('Đồ của Ma giới, càng nhuốm máu càng sắc, nhưng ma khí len vào tâm.', 'Gear of the Demon Realm. The more blood it drinks the sharper it gets, but demonic qi seeps into the heart.'),
 'hu': ('Đồ trôi dạt giữa Thái Hư, nửa có nửa không, khó ai chạm trúng người mang.', 'Gear adrift in the Great Void, half there and half not. Hardly anyone can land a blow on its wearer.'),
}
def recolor(base, out, hue):
    im = Image.open(ICON + base + '.png').convert('RGBA')
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if not a: continue
            h, l, s = colorsys.rgb_to_hls(r / 255, g / 255, b / 255)
            if s < 0.12 and (l < 0.2 or l > 0.85):
                continue  # giữ viền đen và điểm sáng
            r2, g2, b2 = colorsys.hls_to_rgb(hue, l, max(s, 0.45))
            px[x, y] = (int(r2 * 255), int(g2 * 255), int(b2 * 255), a)
    im.save(ICON + out + '.png')
items = []
slug = lambda s: __import__('unicodedata').normalize('NFD', s).encode('ascii', 'ignore').decode().lower().replace(' ', '_').replace('đ', 'd').replace('-', '_')
for cos in ['tien', 'ma', 'hu']:
    for t in range(4):
        realm = 8 + t
        rare = 2 if t < 2 else 3
        mon = MON[cos][t]
        (wn, we, wb, wk), (rn, re_), (an, ae, ab) = N[cos][t]
        bonus = 4 if rare == 3 else 0
        # vũ khí
        wid = 'tg_' + slug(wn.replace('Đ', 'D').replace('đ', 'd'))
        wfx = {'atk': 50 + 6 * t + bonus, 'crit': 10 + t}
        if cos == 'tien': wfx['cult'] = 8 + 2 * t
        if cos == 'ma': wfx['atk'] += 8; wfx['tamMa'] = 1
        if cos == 'hu': wfx['flee'] = 10 + 2 * t
        recolor(wb, wid, HUE[cos])
        items.append(dict(id=wid, vi=wn, en=we, slot='vu_khi', realm=realm, rare=rare, fx=wfx, mon=mon, cos=cos, icon=True, wpn=dict(k=wk, a=WCOL[cos][0], b=WCOL[cos][1])))
        # áo
        rid = 'tg_' + slug(rn.replace('Đ', 'D').replace('đ', 'd'))
        rfx = {'def': 32 + 4 * t + bonus, 'hp': 20 + 4 * t}
        if cos == 'tien': rfx['tamCanh'] = 2
        if cos == 'ma': rfx['atk'] = 10 + 2 * t
        if cos == 'hu': rfx['flee'] = 12 + 2 * t
        items.append(dict(id=rid, vi=rn, en=re_, slot='ao', realm=realm, rare=rare, fx=rfx, mon=mon, cos=cos, robe=ROBE[cos][t], deco=DECO[t]))
        # phụ kiện
        aid = 'tg_' + slug(an.replace('Đ', 'D').replace('đ', 'd'))
        afx = {'cult': 12 + 2 * t + bonus // 2, 'hp': 10 + 3 * t}
        if cos == 'tien': afx['tamCanh'] = 2
        if cos == 'ma': afx['crit'] = 6 + t; afx['tamMa'] = 1
        if cos == 'hu': afx['drop'] = 10 + 2 * t
        recolor(ab, aid, HUE[cos])
        items.append(dict(id=aid, vi=an, en=ae, slot='phu_kien', realm=realm, rare=rare, fx=afx, mon=mon, cos=cos, icon=True))
ids = [i['id'] for i in items]
assert len(set(ids)) == len(ids), ids
def ts(i):
    fx = ', '.join(f"{k}: {v}" for k, v in i['fx'].items())
    d = DESC[i['cos']]
    parts = [f"id: '{i['id']}'", f"name: tr('{i['vi']}', \"{i['en']}\")"]
    if i.get('icon'): parts.append('icon: true')
    parts += [f"slot: '{i['slot']}'", 'price: 0', f"minRealm: {i['realm']}", f"desc: tr('{d[0]}', \"{d[1]}\")", "look: 'x'", f"fx: {{ {fx} }}", "src: 'drop'", f"from: ['{i['mon']}']", f"rare: {i['rare']}"]
    if i.get('robe'): parts.append('robe: [' + ', '.join(f"'{c}'" for c in i['robe']) + ']'); parts.append(f"deco: '{i['deco']}'")
    if i.get('wpn'): parts.append(f"wpn: {{ k: '{i['wpn']['k']}', a: '{i['wpn']['a']}', b: '{i['wpn']['b']}' }}")
    return '  { ' + ', '.join(parts) + ' },'
out = ["// Tự sinh bởi scripts/gen_tien_gear.py: 36 trang bị tiên giới (Tiên/Ma/Thái Hư x 4 cảnh giới x 3 ô), rơi từ quái từng cõi", "import type { Item } from './data';", "import { tr } from '../i18n';", "", "export const TIEN_GEAR: Item[] = ["]
for cos, nm in [('tien', 'Tiên giới'), ('ma', 'Ma giới'), ('hu', 'Thái Hư')]:
    out.append(f'  // {nm}')
    out += [ts(i) for i in items if i['cos'] == cos]
out.append('];')
open(ROOT + '/lib/game/gearTien.ts', 'w').write('\n'.join(out) + '\n')
print(len(items), 'món')
