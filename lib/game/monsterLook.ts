import type { Layer } from '@/lib/lpc';

/** Ngoại hình LPC của quái: hình người ghép lớp, hoặc thú lấy từ bộ LPC Monsters */
export type MonsterLook =
  { kind: 'human'; layers: Layer[]; scale?: number; weapon?: boolean } | { kind: 'beast'; sheet: string; frames: number; cell: number; scale: number; filter?: string; strip?: boolean; fps?: number };

/** Thú LPC Animals đã cắt sẵn thành 1 hàng khung 64x64 (xem scripts/mkbeast.py) */
const B = (sheet: string, frames: number, scale: number, filter?: string, fps = 8): MonsterLook => ({ kind: 'beast', sheet, frames, cell: 64, scale, filter, strip: true, fps });

const M = (body: string, head: string, extra: Layer[] = [], scale = 1): MonsterLook => ({ kind: 'human', layers: [{ key: body }, { key: head }, ...extra], scale });
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
