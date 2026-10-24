import type { Focus, PathId, Slot, Talent } from './types';

export const REALMS = [
  { name: 'Phàm Nhân', layers: 1, life: 65, need: 0 },
  { name: 'Luyện Khí', layers: 9, life: 80, need: 60 },
  { name: 'Trúc Cơ', layers: 3, life: 92, need: 220 },
  { name: 'Kim Đan', layers: 3, life: 102, need: 380 },
  { name: 'Nguyên Anh', layers: 3, life: 110, need: 600 },
  { name: 'Hóa Thần', layers: 3, life: 116, need: 900 },
  { name: 'Luyện Hư', layers: 3, life: 120, need: 1300 },
  { name: 'Độ Kiếp', layers: 3, life: 120, need: 1800 },
] as const;

/** Thọ nguyên tối đa của mọi kiếp, để kiếp nào cũng sớm đến lúc luân hồi */
export const MAX_LIFE = 120;

export const STAGE3 = ['Sơ kỳ', 'Trung kỳ', 'Hậu kỳ'];

export function realmLabel(realm: number, layer: number): string {
  const r = REALMS[realm];
  if (realm === 0) return r.name;
  if (r.layers === 9) return `${r.name} tầng ${layer}`;
  return `${r.name} ${STAGE3[layer - 1] ?? ''}`.trim();
}

export interface PathInfo {
  id: PathId;
  name: string;
  short: string;
  desc: string;
  lean: 'chinh' | 'trung' | 'ta';
  aura: string;
}

export const PATHS: Record<PathId, PathInfo> = {
  kiem: { id: 'kiem', name: 'Kiếm tu', short: 'Kiếm', desc: 'Lấy kiếm nhập đạo. Đánh nhau mạnh, kiếm bay quanh người.', lean: 'trung', aura: '#7fc8ff' },
  dan: { id: 'dan', name: 'Đan tu', short: 'Đan', desc: 'Luyện đan kiếm nhiều linh thạch, tự chế đan đột phá.', lean: 'trung', aura: '#ffb057' },
  tran: { id: 'tran', name: 'Trận tu', short: 'Trận', desc: 'Bày trận, vẽ phù. Bế quan an toàn, ít bị tập kích.', lean: 'trung', aura: '#b59cff' },
  phat: { id: 'phat', name: 'Phật tu', short: 'Phật', desc: 'Từ bi hỷ xả. Thọ nguyên dài, tâm ma khó xâm nhập.', lean: 'chinh', aura: '#ffe27a' },
  ma: { id: 'ma', name: 'Ma tu', short: 'Ma', desc: 'Hút linh lực, luyện huyết công. Tu cực nhanh, tâm ma cực nặng.', lean: 'ta', aura: '#ff3448' },
  yeu: { id: 'yeu', name: 'Yêu tu', short: 'Yêu', desc: 'Thức tỉnh huyết mạch yêu tộc. Thân thể mạnh, có thể hóa hình.', lean: 'trung', aura: '#7be3a4' },
};

export const LINH_CAN = [
  { name: 'Thiên linh căn', mul: 2.2, w: 3 },
  { name: 'Địa linh căn', mul: 1.6, w: 12 },
  { name: 'Huyền linh căn', mul: 1.2, w: 30 },
  { name: 'Tạp linh căn', mul: 0.85, w: 40 },
  { name: 'Phế linh căn', mul: 0.45, w: 15 },
];

export const ORIGINS = [
  { id: 'nong', name: 'Con nhà nông ở Thanh Thủy thôn', money: 20, w: 34 },
  { id: 'tieu_thuong', name: 'Con tiểu thương ở trấn Lạc Hà', money: 80, w: 24 },
  { id: 'the_gia', name: 'Chi thứ của Lâm gia, một tu tiên thế gia', money: 260, w: 10 },
  { id: 'co_nhi', name: 'Cô nhi được lão ăn mày nuôi lớn', money: 5, w: 18 },
  { id: 'chua', name: 'Đứa trẻ bị bỏ trước cổng chùa Vân Tịch', money: 10, w: 10 },
  { id: 'yeu', name: 'Tiểu yêu sinh ra ở Vạn Yêu Lâm', money: 15, w: 4 },
];

/** Tên ghép từ hai âm tiết, hàng nghìn tổ hợp */
export const TEN_NAM_1 = ['Thanh', 'Huyền', 'Thiên', 'Vô', 'Trường', 'Lăng', 'Kiếm', 'Vân', 'Hạo', 'Tử', 'Mặc', 'Dạ', 'Phong', 'Cảnh', 'Tinh', 'Nhất', 'Thừa', 'Bách', 'Lạc', 'Tiêu'];
export const TEN_NAM_2 = ['Phong', 'Vân', 'Hà', 'Trần', 'Ngôn', 'Tiêu', 'Dật', 'Khuyết', 'Thần', 'Sơn', 'Hải', 'Uyên', 'Hàn', 'Lâm', 'Kỳ', 'Hành', 'Nhai', 'Viễn', 'Chi', 'Tuyệt'];
export const TEN_NU_1 = ['Tuyết', 'Nguyệt', 'Uyển', 'Linh', 'Thanh', 'Tử', 'Băng', 'Vũ', 'Ngưng', 'Tiểu', 'Lạc', 'Dao', 'Mộng', 'Hàm', 'Thi', 'Như', 'Ỷ', 'Khinh', 'Vãn', 'Tố'];
export const TEN_NU_2 = ['Nhi', 'Hoa', 'Y', 'Yên', 'Tâm', 'Đồng', 'Sương', 'Điệp', 'Dao', 'Âm', 'Ly', 'Vân', 'Tuyết', 'Nguyệt', 'Lan', 'Hương', 'Ca', 'Linh', 'Thường', 'Cầm'];
export const HO_KEP = ['Âu Dương', 'Thượng Quan', 'Tư Mã', 'Nam Cung', 'Độc Cô', 'Lệnh Hồ', 'Hoàng Phủ', 'Mộ Dung', 'Đông Phương', 'Tây Môn', 'Gia Cát', 'Công Tôn'];

export const HO = ['Tạ', 'Phương', 'Chu', 'Ôn', 'Cố', 'Liễu', 'Kỷ', 'Sở', 'Yến', 'Mạc', 'Thôi', 'Lục', 'Lâm', 'Diệp', 'Tô', 'Hàn', 'Lý', 'Thẩm', 'Bạch', 'Giang', 'Vân', 'Tiêu', 'Lạc', 'Hoa', 'Đường', 'Tần'];
export const TEN_NAM = ['Thanh Vân', 'Phàm', 'Trường Sinh', 'Dật', 'Mặc', 'Huyền', 'Thần', 'Vô Kỵ', 'Phong', 'Thiên Hành', 'Tử Kỳ', 'Hạo'];
export const TEN_NU = ['Tuyết Nhi', 'Nguyệt Hoa', 'Uyển', 'Linh Nhi', 'Thanh Y', 'Tử Yên', 'Băng Tâm', 'Vũ Đồng', 'Ngưng Sương', 'Tiểu Điệp'];
export const DAO_LU = ['Diệp Ngưng Sương', 'Tô Vũ Đồng', 'Hàn Mặc', 'Bạch Tử Kỳ', 'Giang Nguyệt Hoa', 'Lý Huyền', 'Vân Băng Tâm', 'Tiêu Hạo'];

export const FOCUS: Record<Focus, { name: string; desc: string; minAge: number }> = {
  tu_luyen: { name: 'Tu luyện', desc: 'Tăng tu vi', minAge: 6 },
  luyen_dan: { name: 'Luyện đan', desc: 'Ra đan dược, linh thạch', minAge: 12 },
  du_ngoan: { name: 'Du ngoạn', desc: 'Nhiều kỳ ngộ', minAge: 10 },
  kiem_tien: { name: 'Kiếm tiền', desc: 'Linh thạch', minAge: 8 },
  ket_duyen: { name: 'Kết duyên', desc: 'Tâm cảnh, đạo lữ', minAge: 16 },
  tru_yeu: { name: 'Trừ yêu', desc: 'Đánh quái lên cấp', minAge: 10 },
};

export interface Item {
  id: string;
  name: string;
  slot: Slot;
  price: number;
  minRealm: number;
  path?: PathId;
  lean?: 'chinh' | 'ta';
  desc: string;
  look: string; // khóa ngoại hình cho sprite
}

export const ITEMS: Item[] = [
  { id: 'ao_vai', name: 'Áo vải thô', slot: 'ao', price: 0, minRealm: 0, desc: 'Áo mặc từ nhỏ.', look: 'vai' },
  { id: 'thanh_sam', name: 'Thanh Sam', slot: 'ao', price: 60, minRealm: 1, desc: 'Áo xanh ngọc của đệ tử. +2 tâm cảnh mỗi năm.', look: 'thanh' },
  { id: 'bach_y', name: 'Bạch Y Tuyết Văn', slot: 'ao', price: 220, minRealm: 2, lean: 'chinh', desc: 'Áo trắng thêu mây. Tà khí khó gần.', look: 'bach' },
  { id: 'huyet_bao', name: 'Huyết Sát Bào', slot: 'ao', price: 220, minRealm: 2, lean: 'ta', desc: 'Áo đen viền máu. Tu vi +15%, tâm ma tăng.', look: 'huyet' },
  { id: 'tu_kim_bao', name: 'Tử Kim Bào', slot: 'ao', price: 900, minRealm: 3, desc: 'Áo tím chỉ vàng của chân nhân. Khí vận +.', look: 'tukim' },
  { id: 'ca_sa', name: 'Cà sa Kim Lan', slot: 'ao', price: 300, minRealm: 2, path: 'phat', desc: 'Cà sa của cao tăng. Tâm ma giảm mạnh.', look: 'casa' },
  { id: 'moc_kiem', name: 'Mộc kiếm', slot: 'vu_khi', price: 15, minRealm: 0, desc: 'Kiếm gỗ tập võ.', look: 'mockiem' },
  { id: 'thanh_phong', name: 'Thanh Phong Kiếm', slot: 'vu_khi', price: 380, minRealm: 1, desc: 'Phi kiếm cấp thấp. Thoát hiểm dễ hơn.', look: 'kiem' },
  { id: 'huyet_dao', name: 'Huyết Ma Đao', slot: 'vu_khi', price: 520, minRealm: 2, lean: 'ta', desc: 'Đao uống máu. Thắng nhiều hơn, tà hơn.', look: 'dao' },
  { id: 'phat_tran', name: 'Phất trần', slot: 'vu_khi', price: 260, minRealm: 2, desc: 'Phất trần của đạo nhân. Tâm cảnh +.', look: 'phattran' },
  { id: 'lo_dan', name: 'Tử Kim Đan Lô', slot: 'vu_khi', price: 450, minRealm: 1, desc: 'Lò luyện đan mang theo người. Luyện đan x2.', look: 'lodan' },
  { id: 'ngoc_boi', name: 'Ngọc bội hộ thân', slot: 'phu_kien', price: 120, minRealm: 0, desc: 'Đỡ một lần chí mạng.', look: 'ngoc' },
  { id: 'ho_lo', name: 'Hồ lô rượu', slot: 'phu_kien', price: 80, minRealm: 0, desc: 'Ung dung tự tại. Tâm cảnh +.', look: 'holo' },
  { id: 'kiem_bay', name: 'Bản mệnh phi kiếm', slot: 'phu_kien', price: 1400, minRealm: 3, path: 'kiem', desc: 'Kiếm bay vòng quanh chủ. Tu vi +20%.', look: 'kiembay' },
];

export const PILLS = [
  { id: 'tu_khi', name: 'Tụ Khí Đan', price: 30, desc: '+tu vi ngay lập tức' },
  { id: 'truc_co', name: 'Trúc Cơ Đan', price: 200, desc: 'Tăng tỉ lệ đột phá đại cảnh giới' },
  { id: 'dien_tho', name: 'Diên Thọ Đan', price: 500, desc: '+8 năm thọ nguyên (tối đa 120)' },
  { id: 'thanh_tam', name: 'Thanh Tâm Đan', price: 90, desc: '-tâm ma' },
  { id: 'hoi_xuan', name: 'Hồi Xuân Đan', price: 60, desc: 'Hồi sức khỏe' },
];

export const TALENTS: Talent[] = [
  { id: 'ky_uc', name: 'Ký ức tiền kiếp', desc: 'Ngộ tính khởi đầu +20', cost: 30 },
  { id: 'linh_can', name: 'Nghịch thiên cải mệnh', desc: 'Linh căn ít nhất là Huyền linh căn', cost: 60 },
  { id: 'tho', name: 'Trường thọ huyết mạch', desc: 'Thọ nguyên +20%', cost: 45 },
  { id: 'gia_tai', name: 'Đầu thai nhà giàu', desc: 'Khởi đầu thêm 300 linh thạch', cost: 25 },
  { id: 'phuc', name: 'Phúc tinh chiếu mệnh', desc: 'Khí vận khởi đầu +25', cost: 40 },
  { id: 'kiem_tam', name: 'Kiếm tâm thông minh', desc: 'Sinh ra đã có Mộc kiếm, du ngoạn an toàn hơn', cost: 20 },
];

export const SEASONS = ['Xuân', 'Hạ', 'Thu', 'Đông'];

/** Màu tóc bẩm sinh. w = độ hiếm */
export const HAIR_COLORS: Record<string, { name: string; hex: string; w: number; yeu?: boolean }> = {
  den: { name: 'đen tuyền', hex: '#2a1f3d', w: 42 },
  nau: { name: 'nâu sẫm', hex: '#4a2e22', w: 20 },
  hat_de: { name: 'màu hạt dẻ', hex: '#7a4a2a', w: 12 },
  do: { name: 'đỏ rượu', hex: '#8a2a1e', w: 8 },
  lam: { name: 'lam đen', hex: '#2a3a6a', w: 7 },
  tim: { name: 'tím than', hex: '#5a2a6a', w: 4 },
  bac: { name: 'bạc trắng từ lúc lọt lòng', hex: '#c8ccd8', w: 3 },
  hoa_ly: { name: 'cam lửa hồ ly', hex: '#c96a2a', w: 6, yeu: true },
  tuyet_ly: { name: 'trắng tuyết hồ ly', hex: '#eceaf2', w: 3, yeu: true },
};

export const HAIR_STYLES = {
  nam: ['búi tóc đạo sĩ', 'tóc đuôi ngựa dài', 'tóc ngắn rối'],
  nu: ['tóc dài buông xõa', 'búi đôi', 'tóc tết bím'],
};

/** Thọ mệnh bẩm sinh */
export const LIFE_FATES = [
  { name: 'đoản thọ', lo: 0.6, hi: 0.82, w: 18 },
  { name: 'thọ mệnh bình thường', lo: 0.88, hi: 1.12, w: 62 },
  { name: 'trường thọ', lo: 1.18, hi: 1.45, w: 20 },
];

/** Vùng đất nơi sinh, mỗi vùng có ảnh hưởng riêng */
export const REGIONS = [
  { id: 'thanh_chau', name: 'Thanh Châu', desc: 'đồng bằng trù phú', w: 22, places: ['thôn Hạnh Hoa', 'trấn Lạc Hà', 'làng Đào Nguyên', 'bến Thanh Thủy'], mod: { money: 1.3 } },
  { id: 'trung_chau', name: 'Trung Châu', desc: 'đất kinh kỳ phồn hoa', w: 12, places: ['kinh thành Thiên Khải', 'phủ Vạn An', 'phố Tây Thị'], mod: { money: 1.8, tamMa: 6 } },
  { id: 'bac_mac', name: 'Bắc Mạc', desc: 'sa mạc gió cát khắc nghiệt', w: 12, places: ['ốc đảo Lục Châu', 'thành Hoàng Sa', 'trạm ngựa Bạch Đà'], mod: { sucKhoe: 12, khiVan: -6 } },
  { id: 'nam_cuong', name: 'Nam Cương', desc: 'rừng thiêng nhiều độc trùng', w: 12, places: ['bản Miêu Cổ', 'trại Thạch Đầu', 'động Bách Độc'], mod: { ngoTinh: 4, sucKhoe: -4 } },
  { id: 'dong_hai', name: 'Đông Hải', desc: 'miền biển sóng gió', w: 14, places: ['làng chài Vọng Hải', 'đảo Bồng Lai ngoại vi', 'cảng Minh Châu'], mod: { ngoTinh: 6 } },
  { id: 'tay_vuc', name: 'Tây Vực', desc: 'Phật quốc vạn chùa', w: 10, places: ['thành Đại Lôi Âm', 'chùa Tu Di', 'làng Tháp Trắng'], mod: { daoTam: 12, tamCanh: 6 } },
  { id: 'tuyet_vuc', name: 'Tuyết Vực', desc: 'băng nguyên ngàn năm tuyết phủ', w: 8, places: ['bộ lạc Băng Lang', 'thành Hàn Nguyệt'], mod: { lifeMul: 1.06, khiVan: -3 } },
  { id: 'ma_vuc', name: 'Ma Vực', desc: 'vùng đất ma khí bao phủ', w: 6, places: ['thành Huyết Nguyệt', 'trấn Hắc Thủy'], mod: { daoTam: -15, ngoTinh: 6, tamMa: 10 } },
  { id: 'van_yeu', name: 'Vạn Yêu Lâm', desc: 'rừng của yêu tộc', w: 0, places: ['hang Thanh Khâu', 'cây Thiên Niên Tùng'], mod: {} },
] as const;

/** Gia cảnh lúc sinh: tiền khởi đầu và tiền gia đình chu cấp mỗi năm đến 16 tuổi */
export const FAMILY_TIERS = [
  { name: 'bần hàn', money: 3, allowance: 0, w: 30 },
  { name: 'bình dân', money: 20, allowance: 3, w: 38 },
  { name: 'khá giả', money: 90, allowance: 10, w: 20 },
  { name: 'phú hộ', money: 320, allowance: 30, w: 9 },
  { name: 'đại phú', money: 1200, allowance: 80, w: 3 },
];
