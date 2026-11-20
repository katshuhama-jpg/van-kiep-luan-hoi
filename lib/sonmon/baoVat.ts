/**
 * Pháp bảo Sơn Môn: dữ liệu thuần (tên, phẩm, chỉ số, cách lắp vào chân thân). Hình vẽ ở components/sonmon/BaoVat.tsx.
 * Tyler 19/11: đồ thưởng xếp hạng KHÔNG mất tác dụng. Có chỉ số như đồ trong Mộng (Công, Thủ, Máu, Bạo kích),
 * lắp vào ô Vũ khí / Phụ kiện của chân thân, cộng vào Lực chiến chân thân. Chưa đổi trận trong kiếp (để làm nền cho tính năng sau).
 */
import { tr } from '../i18n';
import type { Layer } from '../lpc';

export type BvLoai = 'kiem' | 'dao' | 'thuong' | 'quat' | 'phat_tran' | 'cung' | 'song_chuy' | 'tran_mon_kiem' | 'an';
export type BvPham = 'pham' | 'bao' | 'linh' | 'tien' | 'than';

export const BV_PHAM: { id: BvPham; vi: string; en: string; pct: number; vien: string; chu: string; bac: number }[] = [
  { id: 'than', vi: 'Thần phẩm', en: 'Divine', pct: 12, vien: '#d8453a', chu: '#a8281f', bac: 5 },
  { id: 'tien', vi: 'Tiên phẩm', en: 'Immortal', pct: 9, vien: '#e8c35a', chu: '#7d5a0c', bac: 4 },
  { id: 'linh', vi: 'Linh phẩm', en: 'Spirit', pct: 7, vien: '#9a5cc8', chu: '#6a3399', bac: 3 },
  { id: 'bao', vi: 'Bảo phẩm', en: 'Treasure', pct: 4, vien: '#3f86c8', chu: '#235f96', bac: 2 },
  { id: 'pham', vi: 'Phàm phẩm', en: 'Mortal', pct: 2, vien: '#8d877a', chu: 'inherit', bac: 1 },
];
export const bvPham = (p: string) => BV_PHAM.find((x) => x.id === p) ?? BV_PHAM[4];

/** 7 loại theo hạng Công 1-7, rồi 2 món riêng của môn chủ */
export const BV_LOAI: { id: BvLoai; vi: string; en: string }[] = [
  { id: 'kiem', vi: 'Kiếm', en: 'Sword' },
  { id: 'dao', vi: 'Đao', en: 'Saber' },
  { id: 'thuong', vi: 'Thương', en: 'Spear' },
  { id: 'quat', vi: 'Quạt', en: 'Fan' },
  { id: 'phat_tran', vi: 'Phất trần', en: 'Whisk' },
  { id: 'cung', vi: 'Cung', en: 'Bow' },
  { id: 'song_chuy', vi: 'Song chùy', en: 'Twin maces' },
  { id: 'tran_mon_kiem', vi: 'Trấn Môn Kiếm', en: 'Sect Guardian Sword' },
  { id: 'an', vi: 'Chưởng Môn Ấn', en: 'Sect Seal' },
];
export const bvLoai = (l: string) => BV_LOAI.find((x) => x.id === l) ?? BV_LOAI[0];
export const bvTen = (l: string, p: string) => {
  const ph = bvPham(p);
  const lo = bvLoai(l);
  return tr(`${ph.vi} ${lo.vi}`, `${ph.en} ${lo.en}`);
};
export const bvO = (l: string): 'vu_khi' | 'phu_kien' => (l === 'an' ? 'phu_kien' : 'vu_khi');

/**
 * Chỉ số theo loại, nhân bậc phẩm (Phàm 1 ... Thần 5). Mỗi vũ khí tổng 6 điểm % mỗi bậc, ấn 4 điểm.
 * Mỗi loại một kiểu: kiếm công + bạo, đao công + máu, thương công + thủ + máu, quạt bạo nhiều, phất trần thủ + máu,
 * cung công + bạo đều, song chùy công + thủ, Trấn Môn Kiếm đủ ba, ấn thủ + máu.
 */
export type BvFx = { atk?: number; def?: number; hp?: number; crit?: number };
const FX1: Record<BvLoai, BvFx> = {
  kiem: { atk: 4, crit: 2 },
  dao: { atk: 5, hp: 1 },
  thuong: { atk: 3, def: 2, hp: 1 },
  quat: { atk: 2, crit: 4 },
  phat_tran: { def: 3, hp: 3 },
  cung: { atk: 3, crit: 3 },
  song_chuy: { atk: 4, def: 2 },
  tran_mon_kiem: { atk: 3, def: 2, hp: 1 },
  an: { def: 2, hp: 2 },
};
export function bvFx(loai: string, pham: string): Required<BvFx> {
  const b = bvPham(pham).bac;
  const f = FX1[loai as BvLoai] ?? FX1.kiem;
  return { atk: (f.atk ?? 0) * b, def: (f.def ?? 0) * b, hp: (f.hp ?? 0) * b, crit: (f.crit ?? 0) * b };
}
/** "Công +20% · Bạo kích +10%" (cùng nhãn với đồ trong Mộng) */
export function bvFxText(loai: string, pham: string, ngan = false): string {
  const f = bvFx(loai, pham);
  const lb: [keyof BvFx, string, string, string][] = [
    ['atk', 'Công', 'Attack', 'Công'],
    ['def', 'Thủ', 'Defense', 'Thủ'],
    ['hp', 'Máu', 'HP', 'Máu'],
    ['crit', 'Bạo kích', 'Crit', 'Bạo'],
  ];
  return lb
    .filter(([k]) => f[k])
    .map(([k, vi, en, viNgan]) => `${tr(ngan ? viNgan : vi, en)} +${f[k]}%`)
    .join(' · ');
}
/** Lực chiến chân thân cộng thêm khi lắp: mỗi điểm % chỉ số = 100 Lực chiến (tên hằng giữ BV_TU_VI cho đỡ sửa nhiều chỗ) */
export const BV_TU_VI = 100;
export const bvDiem = (loai: string, pham: string) => {
  const f = bvFx(loai, pham);
  return f.atk + f.def + f.hp + f.crit;
};

// ---------- Lắp vào chân thân ----------
/** id đồ chân thân của pháp bảo Sơn Môn: sm_<loai>_<pham> (vẽ được ngay, không cần hỏi máy chủ) */
export const smGearId = (loai: string, pham: string) => `sm_${loai}_${pham}`;
export function smGearParse(id?: string): { loai: BvLoai; pham: BvPham } | null {
  const m = id?.match(/^sm_([a-z_]+)_(than|tien|linh|bao|pham)$/);
  if (!m || !BV_LOAI.some((x) => x.id === m[1])) return null;
  return { loai: m[1] as BvLoai, pham: m[2] as BvPham };
}
/** lớp LPC để chân thân cầm/đeo món này (quạt không có lớp cầm tay, chỉ hiện ở ô) */
const LAYER: Record<BvLoai, { back?: string; front?: string }> = {
  kiem: { back: 'w_sword_bg', front: 'w_sword' },
  dao: { back: 'w_katana_bg', front: 'w_katana' },
  thuong: { back: 'w_spear_bg', front: 'w_spear' },
  quat: {},
  phat_tran: { front: 'w_cane' },
  cung: { back: 'w_bow_bg', front: 'w_bow' },
  song_chuy: { front: 'w_mace' },
  tran_mon_kiem: { back: 'w_sword_bg', front: 'w_sword' },
  an: { front: 'charm' },
};
const TINT: Record<BvPham, string | undefined> = { pham: undefined, bao: '#8fb8e0', linh: '#c9a8e8', tien: '#f0d070', than: '#f08a7a' };
export function smGearLayers(loai: BvLoai, pham: BvPham): { back: Layer[]; front: Layer[] } {
  const l = LAYER[loai];
  const tint = loai === 'tran_mon_kiem' ? '#f0d070' : TINT[pham];
  const mk = (key?: string): Layer[] => (key ? [{ key, ...(tint ? { tint } : {}) }] : []);
  return { back: mk(l.back), front: mk(l.front) };
}
