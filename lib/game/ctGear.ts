/**
 * 16/11 (Tyler yêu cầu): đồ và ngoại trang của chân thân ở tab Nhân vật. Chỉ để ngắm, không đổi sức mạnh trong kiếp.
 * Mỗi món mở theo thành tựu đã có trong hồ sơ (số kiếp, cảnh giới cao nhất, đạo đã ngộ), không mua bằng gì.
 * Lực chiến chân thân: một con số lớn dần theo Tam Tài, ngoại trang, số kiếp. Chưa dùng trong Lôi đài.
 */
import { tr } from '../i18n';
import { REALMS } from './data';
import { CT_OUTFITS, CT_REWARD_BASE, CT_REWARD_OUTFITS, type CtOutfit } from './chanThan';
import { CT_REWARDS, daoDone, hanhFull, huyetCount, type DaoExt } from './khaiMach';
import type { Layer } from '../lpc';
import type { ChanThanLook, Meta } from './types';

export type CtGearSlot = 'mu' | 'vu_khi' | 'canh' | 'phu_kien';
export type CtGearWorn = NonNullable<ChanThanLook['gear']>;

export interface CtGearItem {
  id: string;
  slot: CtGearSlot;
  name: string;
  /** lớp vẽ sau lưng (trước thân) và trước mặt (sau tóc) */
  back?: Layer[];
  front?: Layer[];
  /** ảnh có sẵn trong /icons (vũ khí dùng đúng icon đồ trong kiếp) */
  icon?: string;
  /** vùng cắt icon [x, y, rộng] trong khung 128 khi ghép từ lớp LPC (món nhỏ cắt sát hơn) */
  crop?: [number, number, number];
  hint: string;
  has: (m: Meta, ext: DaoExt) => boolean;
}

const lives = (m: Meta) => m.lives ?? 0;
const maxRealm = (m: Meta) => m.career?.maxRealm ?? 0;
const realmName = (i: number) => REALMS[i]?.name ?? '';
const reached = (i: number) => ({ hint: tr(`Từng lên ${realmName(i)}`, `Reach ${realmName(i)} once`), has: (m: Meta) => maxRealm(m) >= i });
const lived = (n: number) => ({ hint: tr(`Chơi đủ ${n} kiếp`, `Play ${n} lives`), has: (m: Meta) => lives(m) >= n });
const dao = (id: string, hint: string) => ({ hint, has: (m: Meta, e: DaoExt) => daoDone(m, e).includes(id) });
const free = { hint: '', has: () => true };

export const CT_GEAR: CtGearItem[] = [
  // Mũ
  { id: 'non_la', slot: 'mu', name: tr('Nón lá', 'Conical hat'), front: [{ key: 'non_la', tint: '#d8b46a' }], ...free },
  { id: 'khan_tran', slot: 'mu', crop: [50, 42, 28], name: tr('Khăn buộc trán', 'Headband'), front: [{ key: 'headband', tint: '#c0402e' }], ...free },
  { id: 'mu_da', slot: 'mu', name: tr('Mũ da', 'Leather cap'), front: [{ key: 'leather_cap', tint: '#7a5a3a' }], ...lived(10) },
  { id: 'ngan_thoa', slot: 'mu', crop: [54, 45, 20], name: tr('Ngân thoa', 'Silver circlet'), front: [{ key: 'tiara_silver' }], ...reached(3) },
  { id: 'kim_thoa', slot: 'mu', crop: [54, 45, 20], name: tr('Kim thoa', 'Gold circlet'), front: [{ key: 'tiara_gold' }], ...reached(4) },
  { id: 'kim_mien', slot: 'mu', crop: [50, 28, 28], name: tr('Kim miện', 'Gold crown'), front: [{ key: 'crown_gold' }], ...reached(7) },
  // Vũ khí
  { id: 'moc_kiem', slot: 'vu_khi', icon: 'moc_kiem', name: tr('Mộc kiếm', 'Wooden sword'), back: [{ key: 'w_sword_bg', tint: '#a0703a' }], front: [{ key: 'w_sword', tint: '#a0703a' }], ...free },
  { id: 'truong', slot: 'vu_khi', icon: 'g_thien_truong_go', name: tr('Thiền trượng', 'Monk staff'), back: [{ key: 'w_staff_bg' }], front: [{ key: 'w_staff' }], ...lived(5) },
  { id: 'thuong', slot: 'vu_khi', icon: 'truong_thuong', name: tr('Trường thương', 'Long spear'), back: [{ key: 'w_spear_bg' }], front: [{ key: 'w_spear' }], ...reached(2) },
  { id: 'thiet_kiem', slot: 'vu_khi', icon: 'thiet_kiem', name: tr('Thiết kiếm', 'Iron sword'), back: [{ key: 'w_sword_bg' }], front: [{ key: 'w_sword' }], ...reached(3) },
  { id: 'dao', slot: 'vu_khi', icon: 'g_han_nguyet_dao', name: tr('Đao', 'Saber'), back: [{ key: 'w_katana_bg' }], front: [{ key: 'w_katana' }], ...dao('giang_ho', tr('Thắng 100 người chơi', 'Defeat 100 players')) },
  { id: 'liem', slot: 'vu_khi', icon: 'huyet_liem', name: tr('Huyết liêm', 'Blood scythe'), front: [{ key: 'w_scythe', tint: '#a8202a' }], ...dao('diem_la', tr('Ngộ đạo Diêm La', 'Attain the Dao of King Yama')) },
  // Phụ kiện (16/11, Tyler thêm): đeo ở cổ, tai; icon dùng đúng icon phụ kiện trong kiếp khi có
  { id: 'ngoc_boi', slot: 'phu_kien', icon: 'ngoc_boi', name: tr('Ngọc bội', 'Jade pendant'), front: [{ key: 'gem' }], ...free },
  { id: 'chuoi_hat', slot: 'phu_kien', icon: 'pd_bo_de_boi', name: tr('Chuỗi bồ đề', 'Bodhi beads'), front: [{ key: 'beads' }], ...lived(5) },
  { id: 'bua_ho_menh', slot: 'phu_kien', icon: 'charm_ho_khi', name: tr('Bùa hộ mệnh', 'Protective charm'), front: [{ key: 'amulet' }], ...reached(2) },
  { id: 'hoa_tai', slot: 'phu_kien', crop: [50, 51, 28], name: tr('Hoa tai vàng', 'Gold earrings'), front: [{ key: 'earrings', tint: '#e0b02a' }], ...reached(3) },
  { id: 'tinh_ha_chau', slot: 'phu_kien', icon: 'tinh_ha_chau', name: tr('Tinh hà châu', 'Star-river pearl'), front: [{ key: 'charm' }], ...dao('phi_thang', tr('Phi thăng một lần', 'Ascend once')) },
  // Cánh
  { id: 'ao_choang', slot: 'canh', crop: [48, 62, 32], name: tr('Áo choàng', 'Cape'), back: [{ key: 'cape_bg', tint: '#7a1f12' }], front: [{ key: 'cape_fg', tint: '#7a1f12' }], ...reached(3) },
  { id: 'canh_tien', slot: 'canh', name: tr('Cánh tiên', 'Immortal wings'), back: [{ key: 'wings_bg' }], front: [{ key: 'wings_fg' }], ...dao('phi_thang', tr('Phi thăng một lần', 'Ascend once')) },
  { id: 'canh_ma', slot: 'canh', name: tr('Cánh ma', 'Demon wings'), back: [{ key: 'bwings_bg' }], front: [{ key: 'bwings_fg' }], ...dao('diem_la', tr('Ngộ đạo Diêm La', 'Attain the Dao of King Yama')) },
];

export const ctGearOf = (id?: string) => (id ? CT_GEAR.find((g) => g.id === id) : undefined);

/** Lớp sau lưng và trước mặt của đồ đang mang (ctLayers chèn vào đúng chỗ) */
export function ctGearLayers(worn?: CtGearWorn): { back: Layer[]; front: Layer[] } {
  const back: Layer[] = [];
  const front: Layer[] = [];
  // cánh xa nhất, rồi vũ khí; trước mặt: mũ, cánh, vũ khí (vũ khí trên cùng như trong kiếp)
  for (const s of ['canh', 'vu_khi'] as CtGearSlot[]) back.push(...(ctGearOf(worn?.[s])?.back ?? []));
  for (const s of ['mu', 'phu_kien', 'canh', 'vu_khi'] as CtGearSlot[]) front.push(...(ctGearOf(worn?.[s])?.front ?? []));
  return { back, front };
}

/** Số ngoại trang áo (thưởng) đã có */
export const ctOutfitsOwned = (m: Meta, ext: DaoExt = {}) => CT_REWARDS().filter((r) => r.has(m, ext)).length;
export const ctGearOwned = (m: Meta, ext: DaoExt = {}) => CT_GEAR.filter((g) => g.has(m, ext)).length;
/** Áo thưởng có mặc được không (bộ khởi đầu luôn được) */
export const ctOutfitHas = (m: Meta, ext: DaoExt, outfit: number) => outfit < CT_REWARD_BASE || !!CT_REWARDS()[outfit - CT_REWARD_BASE]?.has(m, ext);

/** Lực chiến chân thân, kèm từng phần để người chơi thấy vì sao */
export function ctPower(m: Meta, ext: DaoExt = {}): { total: number; parts: { name: string; n: number; each: number }[] } {
  const parts = [
    { name: tr('Huyệt đã khai', 'Points opened'), n: huyetCount(m), each: 1200 },
    { name: tr('Hành viên mãn', 'Elements perfected'), n: hanhFull(m), each: 1500 },
    { name: tr('Đạo đã ngộ', 'Daos attained'), n: daoDone(m, ext).length, each: 800 },
    { name: tr('Ngoại trang, đồ', 'Outfits, gear'), n: ctOutfitsOwned(m, ext) + ctGearOwned(m, ext) + ctAoOwned(m, ext), each: 100 },
    { name: tr('Kiếp đã sống', 'Lives lived'), n: Math.min(lives(m), 1000), each: 20 },
    { name: tr('Đệ tử thành tài', 'Graduated disciples'), n: ext.disciples ?? 0, each: 300 },
  ];
  return { total: 1000 + parts.reduce((s, p) => s + p.n * p.each, 0), parts };
}

// ---------------- Quần áo và Ngoại trang (16/11 tối, Tyler yêu cầu) ----------------
// Quần áo: áo mặc lên chân thân, mở theo thành tựu như các đồ khác (người mới chưa có món nào).
// Ngoại trang: các bộ thưởng Tam Tài (Kim bào ... Áo người gõ chuông), mặc đè lên Quần áo. Không mặc gì thì là bộ khởi đầu chọn lúc tạo.
export interface CtAoItem {
  id: string;
  name: string;
  spec: CtOutfit;
  hint: string;
  has: (m: Meta, ext: DaoExt) => boolean;
}
const sects = (n: number) => ({ hint: tr(`Bái ${n} tông môn khác nhau`, `Join ${n} different sects`), has: (m: Meta) => (m.career?.sects?.length ?? 0) >= n });
const duels = (n: number) => ({ hint: tr(`Thắng ${n} người chơi`, `Defeat ${n} players`), has: (m: Meta) => (m.career?.duelWins ?? 0) >= n });
const path = (id: string, name: string) => ({ hint: tr(`Đi đạo ${name} một kiếp`, `Walk the ${name} path once`), has: (m: Meta) => (m.career?.paths ?? []).includes(id) });
export const CT_AO: CtAoItem[] = [
  { id: 'dao_bao_tong', name: tr('Đạo bào tông môn', 'Sect robe'), spec: { name: '', cut: 'normal', body: '#2f5a8a', trim: '#e6dcc4', obi: '#1f3a5a', pants: '#1f3a5a', sleeves: '#4f7aaa' }, ...sects(3) },
  { id: 'giap_da', name: tr('Giáp da', 'Leather armour'), spec: { name: '', cut: 'split', body: '#5a4128', trim: '#8a6a44', obi: '#3a2a1a', pants: '#3a2a22', armour: 'leather' }, ...duels(10) },
  { id: 'nhuyen_giap', name: tr('Nhuyễn giáp', 'Chain vest'), spec: { name: '', cut: 'split', body: '#2e2e36', trim: '#b4bac2', obi: '#141217', pants: '#2e2e36', armour: 'chain' }, ...reached(4) },
  { id: 'ca_sa', name: tr('Cà sa', 'Kasaya'), spec: { name: '', cut: 'normal', body: '#d8742a', trim: '#ffd36b', obi: '#a8482a', pants: '#a8482a', sleeves: '#d8742a' }, ...path('phat', tr('Phật', 'Buddhist')) },
  { id: 'kim_giap', name: tr('Kim giáp', 'Golden armour'), spec: { name: '', cut: 'normal', body: '#c9962e', trim: '#ffd36b', obi: '#7a4a12', pants: '#5a3a12', armour: 'plate', pauldrons: '#e0b02a' }, ...reached(5) },
  { id: 'long_bao', name: tr('Long bào', 'Dragon robe'), spec: { name: '', cut: 'normal', body: '#c8442a', trim: '#ffd36b', obi: '#ffd36b', pants: '#7a1f12', sleeves: '#e0b02a', mantal: '#ffd36b' }, ...dao('phu_quy', tr('Ngộ đạo Phú Quý', 'Attain the Dao of Wealth')) },
];
export const ctAoOf = (id?: string) => (id ? CT_AO.find((a) => a.id === id) : undefined);

/** Ngoại trang theo id (cùng thứ tự CT_REWARDS và CT_REWARD_OUTFITS) */
export function ctNgoaiList() {
  return CT_REWARDS().map((r, k) => ({ id: r.id, name: r.name, hint: r.hint, has: r.has, spec: CT_REWARD_OUTFITS[k] }));
}
/** Ngoại trang đang mặc: gear.ngoai, hoặc bản cũ mặc bằng outfit >= 100 */
export function ctNgoaiId(ct: Pick<ChanThanLook, 'outfit'> & { gear?: ChanThanLook['gear'] }): string | undefined {
  if (ct.gear?.ngoai) return ct.gear.ngoai;
  if (ct.outfit >= CT_REWARD_BASE) return CT_REWARDS()[ct.outfit - CT_REWARD_BASE]?.id;
  return undefined;
}
/** Bộ khởi đầu (chọn lúc tạo, đổi ở Đổi ngoại hình) */
export function ctBaseOutfit(ct: Pick<ChanThanLook, 'gender' | 'outfit'>): CtOutfit {
  const g = ct.gender === 'nu' ? 'nu' : 'nam';
  return CT_OUTFITS[g][ct.outfit] ?? CT_OUTFITS[g][0];
}
/** Bộ đang mặc thật: Ngoại trang > Quần áo > bộ khởi đầu */
export function ctDressOf(ct: Pick<ChanThanLook, 'gender' | 'outfit'> & { gear?: ChanThanLook['gear'] }): CtOutfit {
  const ng = ctNgoaiId(ct);
  if (ng) {
    const k = CT_REWARDS().findIndex((r) => r.id === ng);
    if (k >= 0 && CT_REWARD_OUTFITS[k]) return CT_REWARD_OUTFITS[k];
  }
  return ctAoOf(ct.gear?.ao)?.spec ?? ctBaseOutfit(ct);
}
export const ctAoOwned = (m: Meta, ext: DaoExt = {}) => CT_AO.filter((a) => a.has(m, ext)).length;
