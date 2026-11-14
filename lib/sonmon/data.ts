/**
 * 4.6.0 Sơn Môn Tranh Bá (bản gọn, Tyler duyệt 14/11): số liệu dùng chung.
 * Bản TypeScript để giao diện hiện ước tính và để mô phỏng (scripts/sim-son-mon.ts).
 * Máy chủ là bản thật: supabase/son_mon_gon_2026_11_15.sql (bảng vkl_sm_cfg giữ các hệ số trận, lập môn, giờ).
 * Đổi số ở SM_CFG thì phải đổi cùng số trong bảng vkl_sm_cfg.
 * Danh sách tên môn, tên ô trùng từng chữ với hàm vkl_sm_found và vkl_priv.sm_ky_create.
 * Giấu sau cờ SON_MON_ON (tắt mặc định) cho tới khối Ngày 7 (18/11).
 */
import { tr } from '../i18n';

/** Hệ số chốt sau mô phỏng Ngày 2 (khớp bảng vkl_sm_cfg). */
export const SM_CFG = {
  lap: { kiep: 50, ngay: 5, kiepHa: 30, ngayHa: 4, daySau: 0.8 },
  tran: { tran: 6000, sanNha: 1.25, dem: 2.0, motO: 1.15, moc1: 30, moc2: 50, kv30: 0.1, kv60: 0.2 },
  gio: { trinhPhut: 10, tapHopPhut: 30, diPhut: 20, baoHoGio: 6, baoHoMatHetGio: 12, nghiGio: 2, kyGio: 24 },
  mon: { toiDa: 15, lao: 3, kyCan: 2 },
  /** giờ đêm (giờ VN) bên giữ được nhân đôi: 0:00 - 6:59 */
  demTu: 0,
  demToi: 7,
} as const;

// ---------- Tên môn: 3 phần, chọn từ danh sách (không gõ tự do) ----------
export const TEN1 = ['Thanh', 'Huyền', 'Tử', 'Bích', 'Kim', 'Ngọc', 'Thiên', 'Vân', 'Lăng', 'Hàn', 'Liệt', 'Bạch', 'Xích', 'U', 'Thái', 'Vô', 'Cửu', 'Lạc', 'Thương', 'Phi'] as const;
export const TEN2 = ['Hư', 'Tiêu', 'Dương', 'Nguyệt', 'Phong', 'Lôi', 'Kiếm', 'Hà', 'Sơn', 'Hải', 'Linh', 'Đỉnh', 'Vân', 'Tinh', 'Hỏa', 'Thủy', 'Mộc', 'Long', 'Phượng', 'Hạc'] as const;
export const TEN3 = ['Tông', 'Môn', 'Phái', 'Cung', 'Các', 'Cốc', 'Điện', 'Sơn Trang', 'Đạo Viện', 'Kiếm Phái'] as const;

export const tenMon = (a: string, b: string, c: string) => `${a} ${b} ${c}`;
export function tenNgauNhien(rand: () => number = Math.random): [string, string, string] {
  const pick = <T,>(xs: readonly T[]) => xs[Math.floor(rand() * xs.length)];
  return [pick(TEN1), pick(TEN2), pick(TEN3)];
}

// ---------- Tên ô (máy chủ ghép, đây chỉ để hiện thử) ----------
export const O_A = ['Vọng Nguyệt', 'Thanh Phong', 'Lạc Hà', 'Bích Thủy', 'Hàn Sương', 'Tử Trúc', 'Kim Ô', 'Ngọc Hư', 'Huyền Băng', 'Xích Diễm',
  'Lưu Vân', 'Bạch Lộc', 'Thương Lang', 'U Lan', 'Phi Tuyết', 'Cổ Tùng', 'Hồng Liên', 'Thiết Huyết', 'Lăng Tiêu', 'Vạn Tượng',
  'Thất Tinh', 'Cửu Khúc', 'Long Ngâm', 'Phượng Minh', 'Tàng Kiếm', 'Vô Vọng', 'Đoạn Hồn', 'Nghênh Khách'] as const;
export const O_B = ['Phong', 'Cốc', 'Nhai', 'Hồ', 'Lĩnh', 'Động', 'Đài', 'Nguyên', 'Xuyên', 'Lâm', 'Tuyền', 'Khâu'] as const;

export type Coi = 'thien' | 'hong_tran' | 'u_minh';
export const COI: Record<Coi, { name: string; line: string }> = {
  thien: { name: tr('Thiên', 'Heaven'), line: tr('Cõi trên mây, gần trời.', 'The realm above the clouds, close to Heaven.') },
  hong_tran: { name: tr('Hồng Trần', 'Mortal Dust'), line: tr('Cõi người, chợ búa và đường cái.', 'The realm of people, markets and roads.') },
  u_minh: { name: tr('U Minh', 'Netherworld'), line: tr('Cõi tối, sát bờ Vong Xuyên.', 'The dark realm, by the river of forgetting.') },
};

// ---------- Huy hiệu (6 màu x 5 hình) và chính điện (10 hình). Chỉ để nhận diện, không cộng gì. ----------
export const HUY_MAU = [
  { id: 'xich', name: tr('Đỏ son', 'Vermilion'), hex: '#c0392b' },
  { id: 'kim', name: tr('Vàng kim', 'Gold'), hex: '#d4a017' },
  { id: 'bich', name: tr('Xanh ngọc', 'Jade'), hex: '#1e8f6e' },
  { id: 'lam', name: tr('Xanh lam', 'Azure'), hex: '#2f5fb3' },
  { id: 'tu', name: tr('Tím', 'Purple'), hex: '#7d3cab' },
  { id: 'huyen', name: tr('Đen huyền', 'Obsidian'), hex: '#2b2b33' },
] as const;
export const HUY_HINH = [
  { id: 'kiem', name: tr('Kiếm', 'Sword') },
  { id: 'lien', name: tr('Sen', 'Lotus') },
  { id: 'nguyet', name: tr('Trăng', 'Moon') },
  { id: 'long', name: tr('Rồng', 'Dragon') },
  { id: 'son', name: tr('Núi', 'Mountain') },
] as const;
/** huy hiệu 0-29: màu = id / 5, hình = id % 5 */
export const huyHieu = (id: number) => ({ mau: HUY_MAU[Math.floor(id / 5) % 6], hinh: HUY_HINH[id % 5] });

export const CHINH_DIEN = [
  tr('Điện mái cong', 'Curved-roof hall'), tr('Lầu ba tầng', 'Three-storey tower'), tr('Tháp đá', 'Stone pagoda'), tr('Am tranh', 'Thatched hermitage'),
  tr('Cung trên mây', 'Cloud palace'), tr('Động đá', 'Rock cave'), tr('Đài sen', 'Lotus terrace'), tr('Thành gỗ', 'Wooden fort'),
  tr('Miếu cổ', 'Old shrine'), tr('Lầu bát giác', 'Octagonal pavilion'),
];

// ---------- Nhiệm vụ ngày (3 bậc theo Lực chiến). Chỉ mốc người chơi tự điều khiển được. ----------
export type NvBac = 1 | 2 | 3;
export const NV_THUONG = [2, 3, 5] as const;
/** [số kiếp xong, tuổi sống tới, cảnh giới (realm_no: 2 Trúc Cơ, 3 Kim Đan, 4 Nguyên Anh)] */
export const NV_MUC: Record<NvBac, [number, number, number]> = { 1: [1, 60, 2], 2: [2, 120, 3], 3: [3, 300, 4] };
const CANH_TEN: Record<number, string> = { 2: tr('Trúc Cơ', 'Foundation'), 3: tr('Kim Đan', 'Golden Core'), 4: tr('Nguyên Anh', 'Nascent Soul') };
export const nvBac = (lc: number): NvBac => (lc < 1500 ? 1 : lc <= 5000 ? 2 : 3);
export function nvChu(bac: NvBac): [string, string, string] {
  const [k, t, c] = NV_MUC[bac];
  return [
    k === 1 ? tr('Chơi xong 1 kiếp', 'Finish 1 life') : tr(`Chơi xong ${k} kiếp`, `Finish ${k} lives`),
    tr(`Một kiếp sống qua ${t} tuổi`, `One life past age ${t}`),
    tr(`Một kiếp lên ${CANH_TEN[c]}`, `One life reaches ${CANH_TEN[c]}`),
  ];
}

// ---------- Lực chiến ----------
export type LcPhan = { nam: number; kiep: number; canh: number; ketCuc: number; ngay: number; huyet: number; vienMan: number };
/** (30√năm + 200·ln(1+kiếp) + 80·cảnh + 15·kết cục(≤100) + 50·ngày(≤30)) × (1 + 4%·huyệt + 3%·hành viên mãn). Kiếp chết trước 16 tuổi không tính. */
export function lucChien(p: LcPhan): number {
  const base = 30 * Math.sqrt(p.nam) + 200 * Math.log(1 + p.kiep) + 80 * p.canh + 15 * Math.min(p.ketCuc, 100) + 50 * Math.min(p.ngay, 30);
  return Math.round(base * (1 + 0.04 * Math.min(p.huyet, 10) + 0.03 * Math.min(p.vienMan, 5)));
}
/** Trần đóng góp: tới 6.000 tính đủ, phần trên tính một nửa. */
export const capLc = (lc: number) => Math.min(lc, SM_CFG.tran.tran) + Math.max(lc - SM_CFG.tran.tran, 0) / 2;
/** Hệ số Khí vận cho hôm sau: đạt moc1 (30) +10%, đạt moc2 +20%. moc2 hạ từ 60 xuống 50 sau mô phỏng 14/11 (môn trung vị chỉ 7-8 người). */
export const kvBonus = (kv: number) => (kv >= SM_CFG.tran.moc2 ? SM_CFG.tran.kv60 : kv >= SM_CFG.tran.moc1 ? SM_CFG.tran.kv30 : 0);

// ---------- Trận (máy chủ là bản thật: vkl_priv.sm_tran) ----------
export type TranVao = {
  atk: number[]; // Lực chiến từng người theo xuất chinh
  def: number[]; // Lực chiến từng người đang đứng giữ ô
  kvA?: number; // Khí vận hôm qua của bên đánh
  kvB?: number; // Khí vận hôm qua của bên giữ
  dem?: boolean; // tới nơi lúc 0:00-6:59
  motO?: boolean; // bên giữ chỉ còn 1 ô
};
export function tran(v: TranVao) {
  const sum = (xs: number[]) => xs.reduce((s, x) => s + capLc(x), 0);
  const atk = sum(v.atk) * (1 + kvBonus(v.kvA ?? 0));
  const def = sum(v.def) * SM_CFG.tran.sanNha * (1 + kvBonus(v.kvB ?? 0)) * (v.dem ? SM_CFG.tran.dem : 1) * (v.motO ? SM_CFG.tran.motO : 1);
  return { atk, def, thang: atk > def, thieu: Math.max(0, def - atk) };
}
/** Một câu kết luận cho thanh Ta/Họ (màn trận không hiện phép nhân). */
export function tranCau(atk: number, def: number, lcTa: number): string {
  if (atk > def) return tr(`Đang hơn khoảng ${fmt(atk - def)}.`, `Ahead by about ${fmt(atk - def)}.`);
  const thieu = def - atk;
  const nguoi = Math.max(1, Math.ceil(thieu / Math.max(1, capLc(lcTa))));
  return tr(`Đang thiếu khoảng ${fmt(thieu)} - thêm ${nguoi} người như ngươi là đủ.`, `Short by about ${fmt(thieu)} - ${nguoi} more like you would do it.`);
}
const fmt = (n: number) => Math.round(n).toLocaleString('vi-VN');

// ---------- Lục giác (tọa độ trục q, r) ----------
export type Hex = { q: number; r: number };
export const HEX_KE: Hex[] = [{ q: 1, r: 0 }, { q: -1, r: 0 }, { q: 0, r: 1 }, { q: 0, r: -1 }, { q: 1, r: -1 }, { q: -1, r: 1 }];
export const hexDist = (a: Hex, b: Hex) => (Math.abs(a.q - b.q) + Math.abs(a.r - b.r) + Math.abs(a.q + a.r - b.q - b.r)) / 2;
export const hexKe = (h: Hex) => HEX_KE.map((d) => ({ q: h.q + d.q, r: h.r + d.r }));
export const trongBanDo = (h: Hex, banKinh: number) => Math.abs(h.q) <= banKinh && Math.abs(h.r) <= banKinh && Math.abs(h.q + h.r) <= banKinh;
export function banDo(banKinh: number): Hex[] {
  const out: Hex[] = [];
  for (let q = -banKinh; q <= banKinh; q++) for (let r = -banKinh; r <= banKinh; r++) if (Math.abs(q + r) <= banKinh) out.push({ q, r });
  return out;
}
/** Bán kính theo số môn: tới 30 môn bán kính 6 (127 ô), 31-45 môn bán kính 7 (169 ô). */
export const banKinhTheoMon = (soMon: number) => (soMon <= 30 ? 6 : 7);
/** Số ô tối đa một môn giữ: 1 + người / 3. */
export const oToiDa = (soNguoi: number) => 1 + Math.floor(soNguoi / 3);
/** Cõi của ô (giống máy chủ): chia 3 phần đều theo góc quanh tâm. */
export function coiCua(h: Hex): Coi {
  if (h.q === 0 && h.r === 0) return 'thien';
  const deg = (Math.atan2((h.r * Math.sqrt(3)) / 2, h.q + h.r / 2) * 180) / Math.PI;
  const k = Math.floor((((deg + 360 + 30.001) % 360) / 120));
  return (['thien', 'hong_tran', 'u_minh'] as const)[k];
}

/** Ngày Sơn Môn đổi lúc 5:00 giờ VN. */
export function smNgay(t: Date = new Date()): string {
  const vn = new Date(t.getTime() + 7 * 3600e3 - 5 * 3600e3);
  return vn.toISOString().slice(0, 10);
}

/** Mã lỗi máy chủ -> câu cho người chơi. */
export const SM_LOI: Record<string, string> = {
  SM_AUTH: tr('Liên kết tài khoản để vào sơn môn.', 'Link your account to join a sect.'),
  SM_NO_CT: tr('Cần có chân thân trước.', 'You need a true body first.'),
  SM_CHUA_MO: tr('Kỷ chưa mở.', 'The era has not begun.'),
  SM_CHUA_DU_LAP: tr('Chưa đủ điều kiện lập môn.', 'Not yet eligible to found a sect.'),
  SM_TRUNG_TEN: tr('Tên này đã có môn dùng. Chọn tên khác.', 'That name is taken. Pick another.'),
  SM_DA_CO_MON: tr('Ngươi đã ở trong một môn.', 'You are already in a sect.'),
  SM_KHOA: tr('Ngươi đã tự rời môn, phải chờ hết Kỷ.', 'You left a sect and must wait for the era to end.'),
  SM_CAN_DON: tr('Môn này duyệt đơn. Gửi đơn xin vào.', 'This sect reviews applications.'),
  SM_CHUA_DU_DK: tr('Chưa đủ điều kiện vào môn này.', 'You do not meet this sect’s requirements.'),
  SM_DAY: tr('Môn đã đủ 15 người.', 'The sect is full.'),
  SM_QUYEN: tr('Việc này cần môn chủ hoặc trưởng lão.', 'Only the master or elders can do this.'),
  SM_DU_O: tr('Môn đã giữ đủ ô. Cần thêm người mới đánh được ô mới.', 'Your sect holds its limit. Recruit more to take new land.'),
  SM_KHONG_KE: tr('Chỉ xuất chinh tới ô kề lãnh thổ.', 'You can only march to a tile next to your land.'),
  SM_BAO_HO: tr('Ô này đang được bảo hộ.', 'This tile is protected.'),
  SM_DANG_CHINH: tr('Môn đang có một lệnh xuất chinh.', 'Your sect already has a march under way.'),
  SM_NGHI: tr('Ngươi đang nghỉ sau trận thua.', 'You are resting after a defeat.'),
  SM_DA_DIEM_DANH: tr('Hôm nay đã điểm danh.', 'Already checked in today.'),
  SM_HET_TAP_HOP: tr('Đã hết giờ tập hợp.', 'Gathering time is over.'),
};
