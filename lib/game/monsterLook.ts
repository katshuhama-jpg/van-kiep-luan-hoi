import type { Layer } from '@/lib/lpc';

/** Ngoại hình LPC của quái: hình người ghép lớp, hoặc thú lấy từ bộ LPC Monsters */
export type MonsterLook =
  { kind: 'human'; layers: Layer[]; scale?: number; weapon?: boolean } | { kind: 'beast'; sheet: string; frames: number; cell: number; scale: number; filter?: string; strip?: boolean; fps?: number };

/** Thú LPC Animals đã cắt sẵn thành 1 hàng khung 64x64 (xem scripts/mkbeast.py) */
const B = (sheet: string, frames: number, scale: number, filter?: string, fps = 8): MonsterLook => ({ kind: 'beast', sheet, frames, cell: 64, scale, filter, strip: true, fps });

const L = (x: string | Layer): Layer => (typeof x === 'string' ? { key: x } : x);
/** Quái hình người: thân, đầu (có thể nhuộm), rồi các lớp khác */
const BACK = ['bwings_bg', 'wings_bg', 'cape_bg', 'capet_bg', 'tail_bg'];
const M = (body: string | Layer, head: string | Layer, extra: Layer[] = [], scale = 1): MonsterLook => ({
  kind: 'human',
  // cánh, áo choàng, đuôi phía sau vẽ trước thân để không che mặt
  layers: [...extra.filter((l) => BACK.includes(l.key)), L(body), L(head), ...extra.filter((l) => !BACK.includes(l.key))],
  scale,
});
const kim = (body: string, trim: string, over?: string): Layer[] => [
  { key: 'kimono_normal', tint: body },
  { key: 'kimono_normal_trim', tint: trim },
  ...(over
    ? [
        { key: 'kimono_sleeves_oversize', tint: over },
        { key: 'kimono_sleeves_oversize_trim', tint: trim },
      ]
    : []),
  { key: 'obi', tint: trim },
];

/** Rồng con (rắn xanh) và rồng trưởng thành (người thằn lằn có cánh) */
export const DRAGON_BABY: MonsterLook = { kind: 'beast', sheet: 'snake', frames: 7, cell: 64, scale: 1.5, filter: 'hue-rotate(80deg) saturate(1.4) brightness(1.1)' };
export const DRAGON_BIG: MonsterLook = M(
  'body_musc',
  'mh_lizard',
  [
    { key: 'bwings_bg', tint: '#5fbf95' },
    { key: 'pants_m', tint: '#2e6a4e' },
    { key: 'bwings_fg', tint: '#5fbf95' },
  ],
  1,
);
export const PET_FOX: MonsterLook = B('fox_r', 4, 1, undefined, 7);

export const MONSTER_LOOK: Record<string, MonsterLook> = {
  tho_yeu: M('body_male', 'mh_rabbit', [{ key: 'pants_m', tint: '#e8e0f0' }], 0.85),
  soi_xam: B('wolf', 5, 0.9, 'grayscale(0.6) brightness(1.15)'),
  ran_hoa: { kind: 'beast', sheet: 'snake', frames: 7, cell: 64, scale: 1.3 },
  khi_ac: M('body_male', 'mh_goblin', [{ key: 'pants_m', tint: '#a0704a' }], 0.95),
  heo_rung: M('body_musc', 'mh_boar', [{ key: 'pants_m', tint: '#5a4a44' }]),
  son_tac: M('body_male', 'head_m', [{ key: 'eyes_brown' }, { key: 'pants_m', tint: '#5a4a3a' }, { key: 'leather_m', tint: '#6a4a2a' }, { key: 'bandana', tint: '#a8303a' }, { key: 'w_mace' }]),
  thich_khach: M('body_male', 'head_m', [{ key: 'eyes_red' }, { key: 'pants_m', tint: '#1e1e2a' }, { key: 'leather_m', tint: '#2a2a3a' }, { key: 'hood', tint: '#1e1e2a' }, { key: 'w_katana' }]),
  bo_cap: { kind: 'beast', sheet: 'bee', frames: 6, cell: 32, scale: 1.7, filter: 'hue-rotate(-30deg) saturate(1.6)' },
  ho_yeu: M('body_adult', 'mh_wolff', [{ key: 'eyes_orange' }, ...kim('#ffb0c8', '#fff4e0'), { key: 'tail_bg' }, { key: 'tail_fg' }]),
  thiet_chuong: M('body_musc', 'head_m', [{ key: 'eyes_brown' }, { key: 'pants_m', tint: '#3a2a1a' }, { key: 'bandana', tint: '#c9962e' }]),
  cuong_thi: M('body_zombie', 'mh_zombieh', [
    { key: 'pants_m', tint: '#2a3a4a' },
    { key: 'leather_m', tint: '#3a4a5a' },
  ]),
  hac_hung: B('bear', 5, 0.95, undefined, 5),
  doc_vuong: M('body_adult', 'head_me', [{ key: 'eyes_gray' }, ...kim('#3a6a3a', '#9a3ad0', '#3a6a3a'), { key: 'beard', tint: '#c8d0c0' }, { key: 'w_cane', tint: '#9ff0c8' }]),
  ngan_giac: { kind: 'beast', sheet: 'snake', frames: 7, cell: 64, scale: 1.7, filter: 'grayscale(1) brightness(1.5) drop-shadow(0 0 4px #e6eaf6)' },
  dai_bang: B('eagle', 3, 1.7, 'sepia(0.4) saturate(1.6) drop-shadow(0 0 3px #ffd36b)', 6),
  cuong_dao: M('body_male', 'head_m', [
    { key: 'eyes_red' },
    { key: 'pants_m', tint: '#1a1a1a' },
    { key: 'leather_m', tint: '#8a1a24' },
    { key: 'cape_bg', tint: '#3a0a10' },
    { key: 'w_katana', tint: '#e0e4ee' },
  ]),
  // lão ma đầu áo đỏ: mặt già, tóc bạc dài, mắt đỏ, áo kimono đỏ máu tay áo rộng, áo choàng thẫm
  huyet_y: M(
    'body_adult',
    'head_me',
    [
      { key: 'cape_bg', tint: '#3a0a10' },
      { key: 'hair_xlong_bg', tint: '#d8d0d0' },
      { key: 'eyes_red' },
      ...kim('#8a1a24', '#2a1a1a', '#7a1420'),
      { key: 'beard', tint: '#d8d0d0' },
      { key: 'hair_xlong_fg', tint: '#d8d0d0' },
    ],
    1.05,
  ),
  /* ---- Bổ sung 27/10: thay toàn bộ hình SVG tự vẽ bằng LPC ---- */
  // nhện tinh hóa người: nữ yêu áo tím, mắt đỏ
  nhen_doc: M('body_adult', 'head_fe', [{ key: 'hair_xlong_wavy_bg', tint: '#1e1a24' }, { key: 'eyes_red' }, ...kim('#3a1a4a', '#9a3ad0', '#2a1438'), { key: 'hair_xlong_wavy_fg', tint: '#1e1a24' }, { key: 'w_whip', tint: '#e0e0e8' }]),
  lang_vuong: B('wolf', 5, 1.2, 'sepia(1) saturate(4) hue-rotate(-40deg) brightness(0.85) drop-shadow(0 0 3px #ff4a3a)'),
  am_quy: M('body_skel', 'mh_skull', [{ key: 'capet_bg', tint: '#1e2a3a' }, { key: 'plate_m', tint: '#3a4a5a' }, { key: 'pauldrons', tint: '#5a6a7a' }, { key: 'capet_fg', tint: '#1e2a3a' }, { key: 'w_spear', tint: '#9ff0c8' }]),
  xich_long: M({ key: 'body_musc', tint: '*#e0603a' }, { key: 'mh_lizard', tint: '#e8603a' }, [{ key: 'bwings_bg', tint: '#ff9a4a' }, { key: 'pants_m', tint: '#5a1a10' }, { key: 'plate_m', tint: '#8a2a14' }], 1.2),
  kim_thiem: { kind: 'beast', sheet: 'slime', frames: 7, cell: 64, scale: 1.5, filter: 'sepia(1) saturate(3) hue-rotate(5deg) brightness(1.15) drop-shadow(0 0 4px #ffd36b)' },
  dong_nhan: M({ key: 'body_musc', tint: '*#d09048' }, { key: 'head_m', tint: '*#d09048' }, [{ key: 'pants_m', tint: '#8a5a2a' }, { key: 'plate_m', tint: '#b07a3a' }, { key: 'w_staff', tint: '#8a5a2a' }], 1.1),
  tien_hac: B('eagle', 3, 1.6, 'grayscale(1) brightness(1.9) drop-shadow(0 0 3px #ffffff)', 6),
  kiem_linh: M({ key: 'body_adult', tint: '*#a8d8ff' }, 'head_m', [{ key: 'hair_long_tied_bg', tint: '#e6f4ff' }, { key: 'eyes_blue' }, ...kim('#d9ecff', '#3d6fb0'), { key: 'hair_long_tied_fg', tint: '#e6f4ff' }, { key: 'w_sword', tint: '#d9e6ff' }]),
  toa_yeu_giao: M('body_musc', { key: 'mh_lizard', tint: '#3a8a9a' }, [{ key: 'pants_m', tint: '#1e3a4a' }, { key: 'chainmail', tint: '#8a9aaa' }, { key: 'pauldrons', tint: '#3a5a6a' }, { key: 'w_spear' }], 1.2),
  huyet_khoi: M({ key: 'body_zombie', tint: '*#d06060' }, 'mh_zombieh', [{ key: 'pants_m', tint: '#3a0a10' }, { key: 'leather_m', tint: '#7a1420' }]),
  thi_lang: B('wolf', 5, 1.0, 'grayscale(0.7) sepia(0.6) hue-rotate(50deg) brightness(0.85)'),
  co_trung: { kind: 'beast', sheet: 'big_worm', frames: 6, cell: 64, scale: 1.4, filter: 'hue-rotate(220deg) saturate(1.8) drop-shadow(0 0 3px #c88aff)' },
  huyet_giao: { kind: 'beast', sheet: 'snake', frames: 7, cell: 64, scale: 1.9, filter: 'sepia(1) saturate(5) hue-rotate(-50deg) brightness(0.8) drop-shadow(0 0 4px #ff3a3a)' },
  co_quan: M('body_male', 'head_m', [{ key: 'pants_m', tint: '#4a4a52' }, { key: 'plate_m', tint: '#7a7a86' }, { key: 'pauldrons', tint: '#9a9aa6' }, { key: 'hood', tint: '#5a5a66' }, { key: 'mask', tint: '#9a9aa6' }, { key: 'w_mace', tint: '#b0b0bc' }]),
  kinh_anh: M({ key: 'body_adult', tint: '*#9aa8d8' }, 'head_m', [{ key: 'hair_shoulderl_bg', tint: '#c8d0f0' }, { key: 'eyes_c' }, ...kim('#c8d0f0', '#6a7ab0'), { key: 'hair_shoulderl_fg', tint: '#c8d0f0' }, { key: 'w_katana', tint: '#e8eeff' }]),
  tran_linh: { kind: 'beast', sheet: 'ghost', frames: 6, cell: 64, scale: 1.3, filter: 'sepia(1) saturate(3) hue-rotate(10deg) brightness(1.2) drop-shadow(0 0 5px #ffd36b)' },
  thien_co_thach: M({ key: 'body_musc', tint: '#a8a49a' }, { key: 'mh_troll', tint: '#a8a49a' }, [{ key: 'pants_m', tint: '#6a665e' }, { key: 'band_thick', tint: '#c9962e' }], 1.35),
  hu_khong_thu: B('lion', 5, 1.15, 'grayscale(1) brightness(0.45) drop-shadow(0 0 5px #9a6aff)', 6),
  // cá voi bơi giữa sông sao: ảnh 'swimming whale' (You're Perfect Studio, CC-BY 4.0), nhuộm xanh sao
  tinh_ha_kinh: { kind: 'beast', sheet: 'whale', frames: 7, cell: 112, scale: 0.75, strip: true, fps: 5, filter: 'invert(0.15) sepia(1) hue-rotate(175deg) saturate(3.5) brightness(1.25) drop-shadow(0 0 6px #9fd8ff)' },
  hon_don_linh: { kind: 'beast', sheet: 'eyeball', frames: 7, cell: 64, scale: 1.5, filter: 'hue-rotate(250deg) saturate(1.6) drop-shadow(0 0 6px #c88aff)' },
  thon_thien_thu: B('bear', 5, 1.35, 'grayscale(0.4) hue-rotate(250deg) saturate(2) brightness(0.7) drop-shadow(0 0 5px #6a3aff)', 5),
  thien_binh: M('body_male', 'head_m', [{ key: 'eyes_brown' }, { key: 'capet_bg', tint: '#f2f2f6' }, { key: 'pants_m', tint: '#e8dcc0' }, { key: 'plate_m', tint: '#e8c060' }, { key: 'pauldrons', tint: '#ffd36b' }, { key: 'hairc_relm_short', tint: '#3a2a1a' }, { key: 'headband', tint: '#ffd36b' }, { key: 'capet_fg', tint: '#f2f2f6' }, { key: 'w_spear', tint: '#fff6d0' }]),
  loi_thu: B('lion', 5, 1.15, 'hue-rotate(190deg) saturate(2.2) brightness(1.15) drop-shadow(0 0 5px #9fd8ff)', 7),
  thien_bang: B('eagle', 3, 2.1, 'hue-rotate(170deg) saturate(1.5) drop-shadow(0 0 4px #9fd8ff)', 5),
  kim_long: M({ key: 'body_musc', tint: '*#f0c860' }, { key: 'mh_lizard', tint: '#f0c050' }, [{ key: 'bwings_bg', tint: '#ffe08a' }, { key: 'pants_m', tint: '#8a6a1a' }, { key: 'plate_m', tint: '#c9962e' }, { key: 'crown_gold' }], 1.4),
  ma_binh: M('body_musc', 'mh_orc', [{ key: 'eyes_red' }, { key: 'pants_m', tint: '#1e1a24' }, { key: 'plate_m', tint: '#7a0a1e' }, { key: 'pauldrons', tint: '#3a0a10' }, { key: 'w_scythe', tint: '#c0c0c8' }]),
  dia_nguc_khuyen: B('wolf', 5, 1.4, 'brightness(0.35) sepia(1) saturate(6) hue-rotate(-30deg) drop-shadow(0 0 5px #ff3a1a)'),
  ma_bang: { kind: 'beast', sheet: 'bat', frames: 7, cell: 64, scale: 1.9, filter: 'hue-rotate(250deg) saturate(1.5) brightness(0.8) drop-shadow(0 0 4px #9a3ad0)' },
  diet_the_long: M(
    { key: 'body_musc', tint: '*#7a6a8a' },
    { key: 'mh_lizard', tint: '#6a5a7a' },
    [{ key: 'bwings_bg', tint: '#5a1a2a' }, { key: 'pants_m', tint: '#14101c' }, { key: 'plate_m', tint: '#2a1a3a' }, { key: 'horns_up_bg', tint: '#7a0a1e' }, { key: 'horns_up_fg', tint: '#7a0a1e' }],
    1.55,
  ),
  huyet_ma: M('body_male', 'mh_vamp', [{ key: 'bwings_bg' }, { key: 'pants_m', tint: '#1e1a24' }, { key: 'plate_m', tint: '#7a0a1e' }, { key: 'bwings_fg' }], 1.1),
  bang_giao: M(
    'body_musc',
    'mh_lizard',
    [
      { key: 'bwings_bg', tint: '#9fd8ff' },
      { key: 'pants_m', tint: '#2a3a6a' },
      { key: 'bwings_fg', tint: '#9fd8ff' },
    ],
    1.2,
  ),
  kiem_si: M('body_adult', 'head_m', [{ key: 'hair_xlong_bg', tint: '#e6e6ee' }, { key: 'eyes_gray' }, ...kim('#f2f2f6', '#3d6fb0'), { key: 'hair_xlong_fg', tint: '#e6e6ee' }, { key: 'w_sword' }]),
  ky_lan: B('lion', 5, 1.0, 'saturate(1.6) hue-rotate(-12deg) drop-shadow(0 0 5px #ff7a2a)', 6),
  hac_long: M(
    'body_musc',
    'mh_lizard',
    [{ key: 'bwings_bg', tint: '#5a3a8a' }, { key: 'pants_m', tint: '#1e1a2e' }, { key: 'plate_m', tint: '#3a2a5a' }, { key: 'crown_gold' }, { key: 'bwings_fg', tint: '#5a3a8a' }],
    1.3,
  ),
  /* ---- Quái Độ Kiếp (28/10): dáng mới từ OpenGameArt, đã nhuộm lại (nguồn ở trang Tác giả) ---- */
  loi_co_dieu: { kind: 'beast', sheet: 'dk_dieu', frames: 4, cell: 64, scale: 1.35, strip: true, fps: 6, filter: 'hue-rotate(200deg) saturate(1.6) drop-shadow(0 0 4px #9fd8ff)' },
  xich_chu: { kind: 'beast', sheet: 'dk_spider', frames: 6, cell: 64, scale: 1.35, strip: true, fps: 8, filter: 'sepia(1) saturate(5) hue-rotate(-30deg) drop-shadow(0 0 4px #ff6a2a)' },
  kiep_loi_thu: { kind: 'beast', sheet: 'dk_qilin', frames: 3, cell: 85, scale: 0.95, strip: true, fps: 5, filter: 'sepia(1) hue-rotate(170deg) saturate(3) brightness(1.1) drop-shadow(0 0 5px #9fd8ff)' },
  luc_nhi: { kind: 'beast', sheet: 'dk_monkey', frames: 3, cell: 64, scale: 1.45, strip: true, fps: 5, filter: 'sepia(0.6) saturate(2.2) brightness(1.15) contrast(1.2) drop-shadow(0 0 3px #ffd36b)' },
  thien_ngo: { kind: 'beast', sheet: 'dk_centipede', frames: 8, cell: 128, scale: 0.75, strip: true, fps: 10, filter: 'sepia(1) saturate(4) hue-rotate(10deg) brightness(1.1) drop-shadow(0 0 3px #ffd36b)' },
  bach_cot: M('body_skel', 'mh_skull', [{ key: 'hair_xlong_bg', tint: '#f4f0e6' }, ...kim('#eae2d0', '#6a5a7a', '#eae2d0'), { key: 'hair_xlong_fg', tint: '#f4f0e6' }, { key: 'w_whip', tint: '#eae2d0' }]),
  bang_phach: M({ key: 'body_adult', tint: '*#cfe8ff' }, { key: 'head_f', tint: '*#cfe8ff' }, [{ key: 'hair_xlong_wavy_bg', tint: '#eaf6ff' }, { key: 'eyes_blue' }, ...kim('#d8eeff', '#5a8ac0', '#bfe0ff'), { key: 'hair_xlong_wavy_fg', tint: '#eaf6ff' }, { key: 'tiara_silver' }]),
  thi_vuong: M('body_zombie', 'mh_zombieh', [{ key: 'capet_bg', tint: '#2a2a1a' }, { key: 'pants_m', tint: '#2a2a1a' }, { key: 'plate_m', tint: '#5a6a4a' }, { key: 'pauldrons', tint: '#3a3a2a' }, { key: 'crown_gold' }, { key: 'capet_fg', tint: '#2a2a1a' }], 1.25),
  cu_giai: { kind: 'beast', sheet: 'dk_crab', frames: 2, cell: 64, scale: 1.0, strip: true, fps: 4, filter: 'saturate(1.3) drop-shadow(0 0 4px #7fc8ff)' },
  tu_la: M({ key: 'body_musc', tint: '*#b04030' }, { key: 'head_m', tint: '*#b04030' }, [{ key: 'cape_bg', tint: '#3a0a10' }, { key: 'eyes_red' }, { key: 'pants_m', tint: '#1a1a1a' }, { key: 'plate_m', tint: '#5a0a14' }, { key: 'pauldrons', tint: '#8a1a24' }, { key: 'horns_up_bg', tint: '#1a1a1a' }, { key: 'horns_up_fg', tint: '#1a1a1a' }, { key: 'w_katana', tint: '#ffb04a' }], 1.2),
  phi: { kind: 'beast', sheet: 'dk_ox', frames: 4, cell: 128, scale: 0.85, strip: true, fps: 5, filter: 'sepia(0.6) hue-rotate(40deg) saturate(1.6) brightness(0.9) drop-shadow(0 0 4px #9ac06a)' },
  tat_phuong: { kind: 'beast', sheet: 'dk_crane', frames: 3, cell: 48, scale: 1.3, strip: true, fps: 3, filter: 'sepia(1) saturate(5) hue-rotate(-30deg) drop-shadow(0 0 5px #ff7a2a)' },
  vong_kiep: M('body_male', 'head_me', [{ key: 'hair_unkempt_fg', tint: '#dcdcdc' }, { key: 'eyes_red' }, ...kim('#3a6a4a', '#e6e6ee', '#2a4a3a'), { key: 'beard', tint: '#dcdcdc' }, { key: 'w_sword', tint: '#9fd8ff' }]),
  huyen_vu: { kind: 'beast', sheet: 'dk_turtle', frames: 8, cell: 64, scale: 1.25, strip: true, fps: 6, filter: 'hue-rotate(140deg) saturate(1.2) brightness(0.85) drop-shadow(0 0 4px #5a8a7a)' },
  dao_ngot: { kind: 'beast', sheet: 'dk_boar', frames: 4, cell: 64, scale: 1.45, strip: true, fps: 6, filter: 'sepia(0.6) saturate(2) hue-rotate(-20deg) brightness(0.8) drop-shadow(0 0 3px #e0202e)' },
  thanh_moc_giao: { kind: 'beast', sheet: 'dk_serpent', frames: 8, cell: 64, scale: 1.7, strip: true, fps: 8, filter: 'sepia(1) hue-rotate(70deg) saturate(3) brightness(1.3) drop-shadow(0 0 4px #9ac06a)' },
  huyet_than: M({ key: 'body_male', tint: '*#d06060' }, 'mh_vamp', [{ key: 'bwings_bg', tint: '#5a0a14' }, { key: 'eyes_red' }, ...kim('#8a0a1e', '#1e0a0e'), { key: 'horns_bg', tint: '#3a0a10' }, { key: 'horns_fg', tint: '#3a0a10' }, { key: 'bwings_fg', tint: '#5a0a14' }], 1.1),
  cung_ky: { kind: 'beast', sheet: 'dk_tiger', frames: 3, cell: 64, scale: 1.45, strip: true, fps: 5, filter: 'grayscale(0.5) hue-rotate(220deg) saturate(1.5) drop-shadow(0 0 5px #9a6aff)' },
  ung_long: { kind: 'beast', sheet: 'dk_flydragon', frames: 3, cell: 144, scale: 0.8, strip: true, fps: 5, filter: 'hue-rotate(180deg) saturate(1.3) drop-shadow(0 0 5px #ffe27a)' },
  thao_thiet: { kind: 'beast', sheet: 'dk_toad', frames: 3, cell: 48, scale: 1.6, strip: true, fps: 4, filter: 'sepia(1) saturate(2) hue-rotate(-10deg) brightness(0.8) drop-shadow(0 0 4px #c0882a)' },
  boss_ta: M(
    'body_adult',
    'mh_vamp',
    [
      { key: 'bwings_bg', tint: '#3a0a10' },
      { key: 'cape_bg', tint: '#7a0a1e' },
      { key: 'hair_xlong_bg', tint: '#e8e8f0' },
      ...kim('#1e1a24', '#c0202e', '#1e1a24'),
      { key: 'hair_xlong_fg', tint: '#e8e8f0' },
      { key: 'horns_up_bg', tint: '#3a0a10' },
      { key: 'horns_up_fg', tint: '#3a0a10' },
      { key: 'bwings_fg', tint: '#3a0a10' },
    ],
    1.5,
  ),
  boss_chinh: M(
    'body_adult',
    'head_me',
    [
      { key: 'wings_bg' },
      { key: 'hair_xlong_bg', tint: '#f4f4fa' },
      { key: 'eyes_blue' },
      ...kim('#f2e6d0', '#ffd36b', '#f4f4fa'),
      { key: 'beard', tint: '#f4f4fa' },
      { key: 'hair_xlong_fg', tint: '#f4f4fa' },
      { key: 'tiara_gold' },
      { key: 'wings_fg' },
      { key: 'w_sword', tint: '#d9e6ff' },
    ],
    1.5,
  ),
};
