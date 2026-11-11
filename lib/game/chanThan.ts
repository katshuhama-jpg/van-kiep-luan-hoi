/**
 * 4.5.0 Chân thân: nhân vật cố định qua mọi kiếp, người chơi chọn ngoại hình và đặt pháp danh.
 * Vẽ bằng đúng bộ lớp LPC đang dùng cho nhân vật (lib/lpc.ts), cùng cách nhuộm màu.
 * Chưa có khung ngồi thiền trong bộ LPC nên chân thân đứng (dáng idle, quay mặt ra trước).
 */
import type { ChanThanLook, Gender } from './types';
import type { Layer } from '../lpc';
import { genNameVi } from './engine';
import { tenTuc } from './tenCam';
import { tr } from '../i18n';
import { nameOf } from '../hanviet';

/** 6 màu da: 5 tông nhân vật đang dùng (gốc và 4 tông nhân màu) + 1 tông sẫm nhuộm cùng cách */
export const CT_SKINS: { tint: string | null; swatch: string }[] = [
  { tint: null, swatch: '#f2c9a0' },
  { tint: '*#fff0e4', swatch: '#f6d6b4' },
  { tint: '*#ffe2c8', swatch: '#efc89e' },
  { tint: '*#f6d0aa', swatch: '#e4b88c' },
  { tint: '*#e8bc92', swatch: '#d4a47a' },
  { tint: '*#c8966a', swatch: '#b4835a' },
];

/** 8 màu tóc dùng chung, mặc định đen tuyền */
export const CT_HAIR_COLORS: { name: string; hex: string }[] = [
  { name: tr('Đen tuyền', 'Jet black'), hex: '#2a1f3d' },
  { name: tr('Nâu đen', 'Dark brown'), hex: '#3a261c' },
  { name: tr('Nâu hạt dẻ', 'Chestnut'), hex: '#7a4a2a' },
  { name: tr('Đỏ sẫm', 'Deep red'), hex: '#8a2a1e' },
  { name: tr('Vàng rơm', 'Straw blond'), hex: '#d8b05a' },
  { name: tr('Bạc', 'Silver'), hex: '#a8acba' },
  { name: tr('Trắng tuyết', 'Snow white'), hex: '#eceaf2' },
  { name: tr('Xanh lam đậm', 'Deep blue'), hex: '#2a3a7a' },
];

/** 10 kiểu tóc mỗi giới tính, từ các lớp hair_* có trong public/lpc */
export const CT_HAIR: Record<Gender, { key: string; bg: boolean; name: string }[]> = {
  nam: [
    { key: 'high_ponytail', bg: true, name: tr('Búi cao', 'High topknot') },
    { key: 'long_tied', bg: true, name: tr('Buộc thấp', 'Low tie') },
    { key: 'xlong', bg: true, name: tr('Xõa dài', 'Long and loose') },
    { key: 'ponytail', bg: true, name: tr('Đuôi ngựa', 'Ponytail') },
    { key: 'long_band', bg: true, name: tr('Đai trán', 'Headband') },
    { key: 'long_messy', bg: false, name: tr('Rối dài', 'Long and wild') },
    { key: 'unkempt', bg: false, name: tr('Bù xù', 'Unkempt') },
    { key: 'long_center_part', bg: true, name: tr('Rẽ ngôi giữa', 'Center part') },
    { key: 'relm_xlong', bg: true, name: tr('Thác đổ', 'Waterfall') },
    { key: 'buzzcut', bg: false, name: tr('Húi cua', 'Buzz cut') },
  ],
  nu: [
    { key: 'xlong', bg: true, name: tr('Xõa dài', 'Long and loose') },
    { key: 'high_ponytail', bg: true, name: tr('Búi cao', 'High topknot') },
    { key: 'braid', bg: true, name: tr('Bím dài', 'Long braid') },
    { key: 'bunches', bg: true, name: tr('Hai búi', 'Twin buns') },
    { key: 'princess', bg: true, name: tr('Cài trâm', 'Hairpin') },
    { key: 'single', bg: true, name: tr('Đuôi ngựa', 'Ponytail') },
    { key: 'half_up', bg: false, name: tr('Vấn nửa', 'Half up') },
    { key: 'bangs_bun', bg: false, name: tr('Búi mái', 'Bun with bangs') },
    { key: 'xlong_wavy', bg: true, name: tr('Gợn sóng', 'Wavy') },
    { key: 'shoulderl', bg: true, name: tr('Ngang vai', 'Shoulder length') },
  ],
};

/** Một bộ trang phục khởi đầu: áo, viền, đai, quần, có thể thêm tay áo rộng hoặc khăn vai. Không giáp, không cánh, không hào quang. */
export interface CtOutfit {
  name: string;
  cut: 'normal' | 'split';
  body: string;
  trim: string;
  obi: string;
  pants: string;
  sleeves?: string;
  mantal?: string;
  scarf?: string;
}
export const CT_OUTFITS: Record<Gender, CtOutfit[]> = {
  nam: [
    { name: tr('Áo vải thôn dã', 'Village homespun'), cut: 'split', body: '#a08060', trim: '#5a4128', obi: '#5a4128', pants: '#7a5f44' },
    { name: tr('Đạo bào xanh', 'Blue Daoist robe'), cut: 'normal', body: '#3a8fb0', trim: '#eaf6ff', obi: '#2a6a86', pants: '#2a6a86', sleeves: '#7cc4e0' },
    { name: tr('Thư sinh', 'Scholar'), cut: 'normal', body: '#f2f6ff', trim: '#4f5f8a', obi: '#4f5f8a', pants: '#c9d6f0' },
    { name: tr('Tiều phu', 'Woodcutter'), cut: 'split', body: '#7a7a4a', trim: '#3e3e22', obi: '#3e3e22', pants: '#5a5a34' },
    { name: tr('Khách giang hồ', 'Wanderer'), cut: 'split', body: '#4a4a56', trim: '#c0402e', obi: '#c0402e', pants: '#2e2e36', scarf: '#c0402e' },
    { name: tr('Đạo bào xám', 'Grey Daoist robe'), cut: 'normal', body: '#7d8590', trim: '#e6dcc4', obi: '#3e434a', pants: '#5c636c', sleeves: '#b4bac2' },
    { name: tr('Áo nâu nhà chùa', 'Temple brown'), cut: 'normal', body: '#9a5a2a', trim: '#e0b02a', obi: '#6a3a1a', pants: '#6a3a1a' },
    { name: tr('Lục y', 'Green robe'), cut: 'normal', body: '#3fa58a', trim: '#e9fff6', obi: '#2d7a66', pants: '#2d7a66', mantal: '#e9fff6' },
    { name: tr('Hắc y', 'Black robe'), cut: 'normal', body: '#26222e', trim: '#8a8a9a', obi: '#141217', pants: '#141217' },
    { name: tr('Áo ngắn võ sinh', 'Martial tunic'), cut: 'split', body: '#a8432f', trim: '#e6cfa4', obi: '#2a1f1a', pants: '#3a2a22' },
  ],
  nu: [
    { name: tr('Áo vải thôn dã', 'Village homespun'), cut: 'split', body: '#a08060', trim: '#e6cfa4', obi: '#5a4128', pants: '#7a5f44' },
    { name: tr('Đạo bào xanh', 'Blue Daoist robe'), cut: 'normal', body: '#3a8fb0', trim: '#eaf6ff', obi: '#2a6a86', pants: '#2a6a86', sleeves: '#7cc4e0' },
    { name: tr('Bạch y', 'White robe'), cut: 'normal', body: '#fbf6ec', trim: '#c0402e', obi: '#c0402e', pants: '#e2d6bc', sleeves: '#ffffff' },
    { name: tr('Áo hồng đào', 'Peach blossom'), cut: 'normal', body: '#e08a9a', trim: '#fff0f2', obi: '#a84a5a', pants: '#a84a5a' },
    { name: tr('Thư sinh', 'Scholar'), cut: 'normal', body: '#f2f6ff', trim: '#4f5f8a', obi: '#4f5f8a', pants: '#c9d6f0' },
    { name: tr('Lục y', 'Green robe'), cut: 'normal', body: '#5a9a4a', trim: '#f2ffe6', obi: '#427234', pants: '#427234', mantal: '#f2ffe6' },
    { name: tr('Tử y', 'Violet robe'), cut: 'normal', body: '#7a4ab0', trim: '#e8dcff', obi: '#5a3488', pants: '#5a3488', sleeves: '#a07ad0' },
    { name: tr('Áo ngắn nữ hiệp', 'Heroine tunic'), cut: 'split', body: '#a8303a', trim: '#e6cfa4', obi: '#2a1f1a', pants: '#3a2a22', scarf: '#e6cfa4' },
    { name: tr('Hắc y', 'Black robe'), cut: 'normal', body: '#26222e', trim: '#8a8a9a', obi: '#141217', pants: '#141217' },
    { name: tr('Áo lam hái thuốc', 'Herb gatherer'), cut: 'split', body: '#4f5f8a', trim: '#e6dcc4', obi: '#3a4768', pants: '#3a4768' },
  ],
};

/**
 * 4.5.0 Ngày 3: ngoại trang thưởng (cùng thứ tự với CT_REWARDS trong khaiMach.ts), mặc bằng outfit = CT_REWARD_BASE + chỉ số.
 * Dùng chung cho nam và nữ. Chỉ mỹ quan.
 */
export const CT_REWARD_BASE = 100;
export const CT_REWARD_OUTFITS: CtOutfit[] = [
  { name: 'kim', cut: 'normal', body: '#e8e2c8', trim: '#a8862e', obi: '#a8862e', pants: '#c9bf9a', sleeves: '#fff8e0' },
  { name: 'moc', cut: 'normal', body: '#4f9a4a', trim: '#e9ffd8', obi: '#2f6a2c', pants: '#2f6a2c', sleeves: '#7cc46a' },
  { name: 'thuy', cut: 'normal', body: '#3a78b8', trim: '#d8f0ff', obi: '#1f4a7a', pants: '#1f4a7a', sleeves: '#6aa8e0' },
  { name: 'hoa', cut: 'normal', body: '#c8442a', trim: '#ffd36b', obi: '#7a1f12', pants: '#7a1f12', sleeves: '#ff7a3a' },
  { name: 'tho', cut: 'normal', body: '#a8823a', trim: '#f3e2b0', obi: '#5a4120', pants: '#5a4120', sleeves: '#c99a4a' },
  { name: 'phi_thang', cut: 'normal', body: '#fbf8f0', trim: '#e0b02a', obi: '#e0b02a', pants: '#e8e2d0', sleeves: '#ffffff', mantal: '#fff3c8' },
  { name: 'chung_dao', cut: 'normal', body: '#5a3488', trim: '#ffd36b', obi: '#ffd36b', pants: '#3a2058', sleeves: '#7a4ab0', mantal: '#ffd36b' },
  { name: 'chinh_ta', cut: 'normal', body: '#f2f2f2', trim: '#141217', obi: '#141217', pants: '#141217', sleeves: '#26222e', scarf: '#f2f2f2' },
  { name: 'bao_khi', cut: 'normal', body: '#a8303a', trim: '#ffd36b', obi: '#ffd36b', pants: '#5a1420', sleeves: '#e0b02a' },
  { name: 'diem_la', cut: 'normal', body: '#2a0e14', trim: '#a8202a', obi: '#a8202a', pants: '#141217', sleeves: '#3a141c', mantal: '#5a1420' },
  { name: 'minh_chung', cut: 'split', body: '#5c636c', trim: '#c9962e', obi: '#8a5a2a', pants: '#3e434a', mantal: '#7d8590' },
];
/** Bộ đang mặc (bộ khởi đầu theo giới tính, hoặc ngoại trang thưởng) */
export const ctOutfitOf = (g: Gender, outfit: number): CtOutfit => (outfit >= CT_REWARD_BASE ? CT_REWARD_OUTFITS[outfit - CT_REWARD_BASE] : CT_OUTFITS[g][outfit]) ?? CT_OUTFITS[g][0];

/** Chân thân mặc định theo giới tính (lựa chọn đầu, da và tóc giữ nguyên nếu đã có) */
export function ctDefault(gender: Gender = 'nam', keep?: Partial<ChanThanLook>): ChanThanLook {
  return { name: keep?.name ?? '', gender, skin: keep?.skin ?? 0, hair: 0, hairColor: keep?.hairColor ?? 0, outfit: 0, createdAt: 0, renamed: keep?.renamed ?? 0 };
}

/** Thuận theo duyên: ngoại hình ngẫu nhiên, giữ tên đang có */
export function ctRandom(name = '', rnd: () => number = Math.random): ChanThanLook {
  const gender: Gender = rnd() < 0.5 ? 'nam' : 'nu';
  const pick = (n: number) => Math.floor(rnd() * n);
  return { name, gender, skin: pick(CT_SKINS.length), hair: pick(10), hairColor: pick(CT_HAIR_COLORS.length), outfit: pick(10), createdAt: 0, renamed: 0 };
}

/** Lớp ảnh LPC của chân thân (người lớn, không vũ khí, không phụ kiện) */
export function ctLayers(ct: Pick<ChanThanLook, 'gender' | 'skin' | 'hair' | 'hairColor' | 'outfit'>): Layer[] {
  const g: Gender = ct.gender === 'nu' ? 'nu' : 'nam';
  const skin = CT_SKINS[ct.skin]?.tint ?? undefined;
  const hair = CT_HAIR[g][ct.hair] ?? CT_HAIR[g][0];
  const hc = (CT_HAIR_COLORS[ct.hairColor] ?? CT_HAIR_COLORS[0]).hex;
  const o = ctOutfitOf(g, ct.outfit);
  const kim = o.cut === 'split' ? 'kimono_split' : 'kimono_normal';
  const out: Layer[] = [];
  if (hair.bg) out.push({ key: `hair_${hair.key}_bg`, tint: hc });
  out.push({ key: 'body_adult', tint: skin }, { key: g === 'nam' ? 'head_m' : 'head_f', tint: skin }, { key: 'eyes_brown' });
  out.push({ key: 'pants', tint: o.pants }, { key: 'shoes' });
  out.push({ key: kim, tint: o.body }, { key: `${kim}_trim`, tint: o.trim });
  if (o.sleeves) out.push({ key: 'kimono_sleeves_oversize', tint: o.sleeves }, { key: 'kimono_sleeves_oversize_trim', tint: o.trim });
  out.push({ key: 'obi', tint: o.obi });
  if (o.mantal) out.push({ key: 'mantal', tint: o.mantal });
  out.push({ key: `hair_${hair.key}_fg`, tint: hc });
  if (o.scarf) out.push({ key: 'scarf', tint: o.scarf });
  return out;
}

// ---------------- Pháp danh ----------------

export const CT_NAME_MIN = 2;
export const CT_NAME_MAX = 12;
/** Chỉ chữ cái (kể cả tiếng Việt có dấu) và khoảng trắng */
const NAME_RE = /^[\p{L}\p{M} ]+$/u;

/** Chuẩn hóa tên: gộp khoảng trắng, bỏ đầu cuối */
export const ctCleanName = (s: string) => s.normalize('NFC').replace(/\s+/g, ' ').trim();

/** Kiểm tra pháp danh. Trả null nếu hợp lệ, hoặc câu báo lỗi. */
export function ctNameError(raw: string): string | null {
  const s = ctCleanName(raw);
  const n = [...s].length;
  if (n < CT_NAME_MIN || n > CT_NAME_MAX) return tr(`Pháp danh dài từ ${CT_NAME_MIN} đến ${CT_NAME_MAX} chữ cái.`, `Dharma names are ${CT_NAME_MIN} to ${CT_NAME_MAX} letters long.`);
  if (!NAME_RE.test(s)) return tr('Pháp danh chỉ gồm chữ cái và khoảng trắng.', 'Dharma names may only contain letters and spaces.');
  if (tenTuc(s)) return ctBlockedLine();
  return null;
}
export const ctBlockedLine = () => tr('Tên này Thiên Đạo không nhận. Chọn tên khác.', 'The Heavenly Dao will not accept this name. Choose another.');

/** Gợi tên ngẫu nhiên từ bộ họ tên tu tiên đang dùng, vừa độ dài cho phép */
export function ctSuggestName(gender: Gender, rnd: () => number = Math.random): string {
  for (let i = 0; i < 30; i++) {
    const n = nameOf(genNameVi(gender, rnd));
    if ([...n].length <= CT_NAME_MAX && !ctNameError(n)) return n;
  }
  return gender === 'nam' ? tr('Vô Danh', 'Nameless') : tr('Vân Tâm', 'Yun Xin');
}

/** Đổi pháp danh: lần đầu miễn phí, từ lần thứ hai tốn chừng này phúc duyên */
export const CT_RENAME_COST = 100;
