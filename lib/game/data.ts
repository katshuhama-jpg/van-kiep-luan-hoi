import { GEAR } from './gear';
import { EXTRA_ITEMS } from './items2';
import type { Focus, PathId, Slot, Talent } from './types';

export const REALMS = [
  { name: 'Phàm Nhân', layers: 1, life: 65, need: 0 },
  { name: 'Luyện Khí', layers: 9, life: 80, need: 60 },
  { name: 'Trúc Cơ', layers: 3, life: 100, need: 220 },
  { name: 'Kim Đan', layers: 3, life: 120, need: 380 },
  { name: 'Nguyên Anh', layers: 3, life: 140, need: 600 },
  { name: 'Hóa Thần', layers: 3, life: 160, need: 900 },
  { name: 'Luyện Hư', layers: 3, life: 180, need: 1300 },
  { name: 'Độ Kiếp', layers: 3, life: 200, need: 1800 },
  // Tiên giới (ma tu thì là Ma giới, cùng bậc nhưng tên khác, xem MA_REALMS)
  { name: 'Chân Tiên', layers: 3, life: 320, need: 2600 },
  { name: 'Huyền Tiên', layers: 3, life: 420, need: 3600 },
  { name: 'Kim Tiên', layers: 3, life: 540, need: 5000 },
  { name: 'Đại La Kim Tiên', layers: 3, life: 700, need: 7000 },
] as const;

/** Cảnh giới đầu tiên sau phi thăng */
export const ASCEND_REALM = 8;
/** Cảnh giới cao nhất */
export const TOP_REALM = 11;
/** Tên cảnh giới Ma giới, cùng bậc với tiên giới 8..11 */
export const MA_REALMS = ['Ma Tướng', 'Ma Vương', 'Ma Hoàng', 'Ma Đế'];
/** Thái Hư giới: cõi của người trung lập, không theo tiên cũng không theo ma */
export const HU_REALMS = ['Hư Tiên', 'Huyền Tôn', 'Thái Hư Chân Quân', 'Hỗn Nguyên Đạo Tổ'];
export type Cosmos = 'tien' | 'ma' | 'hu';
export const COSMOS_NAME: Record<Cosmos, string> = { tien: 'Tiên giới', ma: 'Ma giới', hu: 'Thái Hư giới' };

/** Tên cảnh giới, theo tiên giới hay ma giới */
export function realmName(realm: number, cosmos?: Cosmos | null): string {
  if (realm >= ASCEND_REALM && cosmos === 'ma') return MA_REALMS[realm - ASCEND_REALM] ?? 'Ma Đế';
  if (realm >= ASCEND_REALM && cosmos === 'hu') return HU_REALMS[realm - ASCEND_REALM] ?? 'Hỗn Nguyên Đạo Tổ';
  return REALMS[realm]?.name ?? 'Phi Thăng';
}

/** Thọ nguyên tối đa: phàm giới 200, tiên giới, ma giới theo cảnh giới */
export function lifeCap(realm: number): number {
  return realm >= ASCEND_REALM ? (REALMS[realm]?.life ?? 700) + 120 : MAX_LIFE;
}

/** Thọ nguyên tối đa của mọi kiếp, để kiếp nào cũng sớm đến lúc luân hồi */
export const MAX_LIFE = 200;

export const STAGE3 = ['Sơ kỳ', 'Trung kỳ', 'Hậu kỳ'];

export function realmLabel(realm: number, layer: number, cosmos?: Cosmos | null): string {
  const r = REALMS[realm] ?? REALMS[REALMS.length - 1];
  if (realm === 0) return r.name;
  if (r.layers === 9) return `${r.name} tầng ${layer}`;
  return `${realmName(realm, cosmos)} ${STAGE3[layer - 1] ?? ''}`.trim();
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
  kiem: { id: 'kiem', name: 'Kiếm tu', short: 'Kiếm', desc: 'Lấy kiếm nhập đạo. Công mạnh nhất, tu nhanh. Hay chết trận vì ham đánh.', lean: 'trung', aura: '#7fc8ff' },
  dan: { id: 'dan', name: 'Đan tu', short: 'Đan', desc: 'Luyện đan kiếm nhiều linh thạch, tự chế đan đột phá. Giàu có, nhưng đánh nhau kém.', lean: 'trung', aura: '#ffb057' },
  tran: { id: 'tran', name: 'Trận tu', short: 'Trận', desc: 'Bày trận, vẽ phù. Thủ cực chắc, bế quan an toàn, ít bị tập kích. Thường sống rất thọ.', lean: 'trung', aura: '#b59cff' },
  phat: { id: 'phat', name: 'Phật tu', short: 'Phật', desc: 'Từ bi hỷ xả. Máu và thủ dày, thọ nguyên dài, tâm ma khó xâm nhập, đột phá vững vàng.', lean: 'chinh', aura: '#ffe27a' },
  ma: { id: 'ma', name: 'Ma tu', short: 'Ma', desc: 'Hút linh lực, luyện huyết công. Tu nhanh nhất, nhưng tâm ma cực nặng.', lean: 'ta', aura: '#ff3448' },
  yeu: { id: 'yeu', name: 'Yêu tu', short: 'Yêu', desc: 'Thức tỉnh huyết mạch yêu tộc. Thân thể khỏe, có thể hóa hình. Sống thọ nhất trong các đạo.', lean: 'trung', aura: '#7be3a4' },
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

export const HO = [
  'Tạ',
  'Phương',
  'Chu',
  'Ôn',
  'Cố',
  'Liễu',
  'Kỷ',
  'Sở',
  'Yến',
  'Mạc',
  'Thôi',
  'Lục',
  'Lâm',
  'Diệp',
  'Tô',
  'Hàn',
  'Lý',
  'Thẩm',
  'Bạch',
  'Giang',
  'Vân',
  'Tiêu',
  'Lạc',
  'Hoa',
  'Đường',
  'Tần',
];
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

/** Chỉ số trang bị, đơn vị % (riêng tamCanh/tamMa là điểm mỗi năm) */
export interface ItemFx {
  atk?: number; // công khi trừ yêu
  def?: number; // thủ
  hp?: number; // máu
  crit?: number; // tỉ lệ bạo kích (+ điểm %)
  flee?: number; // tỉ lệ rút lui thành công
  cult?: number; // tốc độ tu luyện
  exp?: number; // tu vi khi trảm quái
  drop?: number; // tỉ lệ rơi đồ
  money?: number; // linh thạch khi kiếm tiền
  dan?: number; // linh thạch + đan khi luyện đan
  tamCanh?: number; // mỗi năm
  tamMa?: number; // mỗi năm (âm là giảm)
}

export type WeaponKind = 'mockiem' | 'kiem' | 'dao' | 'thuong' | 'cung' | 'quat' | 'truong' | 'chuy' | 'tieu' | 'roi' | 'song' | 'liem' | 'but' | 'cuoc' | 'quyen' | 'phattran' | 'lodan' | 'can';
export type RobeDeco = 'van' | 'giap' | 'vay' | 'long' | 'hoa' | 'vu' | 'manh' | 'long_thu' | 'casa';

export interface Item {
  id: string;
  name: string;
  slot: Slot;
  price: number; // 0 = không bán ở phường thị
  minRealm: number;
  path?: PathId;
  lean?: 'chinh' | 'ta';
  desc: string;
  look: string; // khóa ngoại hình cho sprite (đồ cũ)
  fx?: ItemFx;
  src?: 'shop' | 'drop' | 'event'; // mặc định shop
  from?: string[]; // quái rơi ra
  where?: string; // gợi ý chỗ nhặt được
  rare?: 0 | 1 | 2 | 3; // phàm, tốt, hiếm, cực phẩm
  robe?: [string, string, string, string]; // màu áo: thân, đậm, viền, sáng
  deco?: RobeDeco;
  wpn?: { k: WeaponKind; a: string; b: string }; // dáng vũ khí + 2 màu
  icon?: boolean; // có ảnh /icons/<id>.png
}

export const ITEMS: Item[] = [
  // ======== Pháp y (áo) ========
  { id: 'ao_vai', name: 'Áo vải thô', slot: 'ao', price: 0, minRealm: 0, desc: 'Áo mặc từ nhỏ.', look: 'vai', src: 'event', where: 'Có sẵn từ lúc sinh' },
  {
    id: 'ao_da_thu',
    name: 'Áo da thú',
    slot: 'ao',
    price: 40,
    minRealm: 0,
    desc: 'Da thú may vụng, chắc chắn.',
    look: 'x',
    fx: { def: 8, hp: 5 },
    robe: ['#8a6a4a', '#6a4e34', '#c9a77a', '#a8885e'],
    deco: 'long_thu',
  },
  {
    id: 'ao_nho_y',
    name: 'Nho y thư sinh',
    slot: 'ao',
    price: 70,
    minRealm: 0,
    desc: 'Áo của người đọc sách.',
    look: 'x',
    fx: { cult: 5, tamCanh: 1 },
    robe: ['#e6e0cc', '#c4bca4', '#3d6fb0', '#ffffff'],
  },
  { id: 'thanh_sam', name: 'Thanh Sam', slot: 'ao', price: 60, minRealm: 1, desc: 'Áo xanh ngọc của đệ tử.', look: 'thanh', fx: { cult: 5, tamCanh: 1 } },
  { id: 'ao_vo_si', name: 'Võ phục đỏ', slot: 'ao', price: 120, minRealm: 1, desc: 'Áo bó gọn của võ sinh.', look: 'x', fx: { atk: 8, hp: 5 }, robe: ['#b8302a', '#86201c', '#ffd36b', '#d8604a'] },
  { id: 'ao_da_hanh', name: 'Dạ hành y', slot: 'ao', price: 180, minRealm: 1, desc: 'Đồ đen của kẻ đi đêm.', look: 'x', fx: { flee: 20, crit: 5 }, robe: ['#24242e', '#16161c', '#5a5a6a', '#3a3a48'] },
  {
    id: 'ao_thuong_nhan',
    name: 'Gấm vóc thương nhân',
    slot: 'ao',
    price: 260,
    minRealm: 1,
    desc: 'Mặc vào ai cũng tin bạn có tiền.',
    look: 'x',
    fx: { money: 30, dan: 10 },
    robe: ['#c9962e', '#9a7020', '#7a2a1e', '#ffd36b'],
    deco: 'hoa',
  },
  { id: 'bach_y', name: 'Bạch Y Tuyết Văn', slot: 'ao', price: 220, minRealm: 2, lean: 'chinh', desc: 'Áo trắng thêu mây. Tà khí khó gần.', look: 'bach', fx: { def: 15, tamMa: -1 }, deco: 'van' },
  { id: 'huyet_bao', name: 'Huyết Sát Bào', slot: 'ao', price: 220, minRealm: 2, lean: 'ta', desc: 'Áo đen viền máu.', look: 'huyet', fx: { cult: 15, atk: 10, tamMa: 1 } },
  { id: 'ca_sa', name: 'Cà sa Kim Lan', slot: 'ao', price: 300, minRealm: 2, path: 'phat', desc: 'Cà sa của cao tăng.', look: 'casa', fx: { def: 10, tamMa: -2 } },
  {
    id: 'dao_bao',
    name: 'Đạo bào Thái Cực',
    slot: 'ao',
    price: 400,
    minRealm: 2,
    desc: 'Áo đạo sĩ thêu âm dương.',
    look: 'x',
    fx: { cult: 12, tamMa: -1 },
    robe: ['#3a3a4a', '#24242e', '#f2f2f6', '#5a5a6a'],
    deco: 'van',
  },
  {
    id: 'dong_giap',
    name: 'Đồng giáp',
    slot: 'ao',
    price: 500,
    minRealm: 2,
    desc: 'Giáp đồng nặng trịch.',
    look: 'x',
    fx: { def: 22, hp: 12, flee: -10 },
    robe: ['#a8703a', '#7a4e24', '#ffd36b', '#c99a5a'],
    deco: 'giap',
  },
  { id: 'tu_kim_bao', name: 'Tử Kim Bào', slot: 'ao', price: 900, minRealm: 3, desc: 'Áo tím chỉ vàng của chân nhân.', look: 'tukim', fx: { cult: 10, def: 15, drop: 15 } },
  {
    id: 'tien_y',
    name: 'Tiên y Lưu Vân',
    slot: 'ao',
    price: 1800,
    minRealm: 3,
    desc: 'Áo dệt từ mây, nhẹ như không.',
    look: 'x',
    fx: { cult: 20, flee: 20, tamCanh: 1 },
    robe: ['#dff0ff', '#a8c8e6', '#ffd36b', '#ffffff'],
    deco: 'van',
  },
  // nhặt được trong đời
  {
    id: 'ao_toi',
    name: 'Áo tơi lá',
    slot: 'ao',
    price: 0,
    minRealm: 0,
    desc: 'Áo tơi của khách giang hồ.',
    look: 'x',
    fx: { flee: 15, tamCanh: 1 },
    src: 'event',
    where: 'Du ngoạn',
    rare: 1,
    robe: ['#7a8a4a', '#5a6a34', '#c9b08a', '#9aaa6a'],
    deco: 'vu',
  },
  {
    id: 'hi_phuc',
    name: 'Hỉ phục đỏ',
    slot: 'ao',
    price: 0,
    minRealm: 0,
    desc: 'Áo cưới của ai bỏ quên.',
    look: 'x',
    fx: { tamCanh: 2, money: 10 },
    src: 'event',
    where: 'Kết duyên',
    rare: 1,
    robe: ['#d0202e', '#9a1420', '#ffd36b', '#ff6a6a'],
    deco: 'hoa',
  },
  {
    id: 'ao_an_may',
    name: 'Áo trăm mảnh Cái Bang',
    slot: 'ao',
    price: 0,
    minRealm: 0,
    desc: 'Nghèo mà có khí tiết.',
    look: 'x',
    fx: { def: 12, drop: 20, money: -10 },
    src: 'event',
    where: 'Khi túng quẫn',
    rare: 2,
    robe: ['#8a7a5a', '#6a5a3e', '#5a4128', '#a8987a'],
    deco: 'manh',
  },
  {
    id: 'long_bao_cu',
    name: 'Long bào cũ',
    slot: 'ao',
    price: 0,
    minRealm: 0,
    desc: 'Áo rồng của một vị vua mất nước.',
    look: 'x',
    fx: { money: 30, drop: 15, def: 10 },
    src: 'event',
    where: 'Du ngoạn, rất hiếm',
    rare: 3,
    robe: ['#e0b02a', '#b0841a', '#c0202e', '#ffd36b'],
    deco: 'long',
  },
  // quái rơi
  {
    id: 'ao_da_soi',
    name: 'Áo da sói',
    slot: 'ao',
    price: 0,
    minRealm: 0,
    desc: 'Lột từ sói xám thành tinh.',
    look: 'x',
    fx: { def: 10, atk: 5 },
    src: 'drop',
    from: ['soi_xam'],
    rare: 1,
    robe: ['#7d8590', '#5c636c', '#e6e6ee', '#a4acb6'],
    deco: 'long_thu',
  },
  {
    id: 'giap_vay_mang',
    name: 'Giáp vảy mãng',
    slot: 'ao',
    price: 0,
    minRealm: 0,
    desc: 'Ghép từ vảy mãng xà.',
    look: 'x',
    fx: { def: 18, hp: 8 },
    src: 'drop',
    from: ['ran_hoa', 'ngan_giac'],
    rare: 2,
    robe: ['#5fbf6a', '#3f8a4a', '#ffd36b', '#8ad894'],
    deco: 'vay',
  },
  {
    id: 'ao_cuu_vi',
    name: 'Cửu Vĩ hồ cừu',
    slot: 'ao',
    price: 0,
    minRealm: 0,
    desc: 'Áo lông hồ ly chín đuôi, mê hoặc lòng người.',
    look: 'x',
    fx: { crit: 10, flee: 15, tamCanh: 1 },
    src: 'drop',
    from: ['ho_yeu'],
    rare: 2,
    robe: ['#ff9a4a', '#d06a2a', '#fff4e0', '#ffc28a'],
    deco: 'long_thu',
  },
  {
    id: 'giap_hac_hung',
    name: 'Hắc Hùng trọng giáp',
    slot: 'ao',
    price: 0,
    minRealm: 0,
    desc: 'Da gấu ngàn năm, đao kiếm khó xuyên.',
    look: 'x',
    fx: { def: 30, hp: 20, flee: -15 },
    src: 'drop',
    from: ['hac_hung'],
    rare: 2,
    robe: ['#2a2228', '#18141a', '#7a5a3a', '#4a3e44'],
    deco: 'giap',
  },
  {
    id: 'kim_vu_y',
    name: 'Kim Vũ thần y',
    slot: 'ao',
    price: 0,
    minRealm: 0,
    desc: 'Dệt từ lông cánh Kim Sí Đại Bằng.',
    look: 'x',
    fx: { flee: 40, atk: 12, cult: 8 },
    src: 'drop',
    from: ['dai_bang'],
    rare: 3,
    robe: ['#e0a030', '#b07a1a', '#ffe27a', '#ffd36b'],
    deco: 'vu',
  },
  {
    id: 'giap_bang_giao',
    name: 'Băng Giao lân giáp',
    slot: 'ao',
    price: 0,
    minRealm: 0,
    desc: 'Lạnh buốt, đóng băng kẻ dám chạm vào.',
    look: 'x',
    fx: { def: 35, hp: 25 },
    src: 'drop',
    from: ['bang_giao'],
    rare: 3,
    robe: ['#7fc8ff', '#4a9ad0', '#eaf6ff', '#b4e0ff'],
    deco: 'vay',
  },
  {
    id: 'hoa_lan_bao',
    name: 'Hỏa Lân chiến bào',
    slot: 'ao',
    price: 0,
    minRealm: 0,
    desc: 'Lửa kỳ lân cháy mãi không tắt.',
    look: 'x',
    fx: { atk: 25, hp: 15, exp: 10 },
    src: 'drop',
    from: ['ky_lan'],
    rare: 3,
    robe: ['#e0502a', '#a8341a', '#ffd36b', '#ff8a5a'],
    deco: 'long',
  },
  {
    id: 'hac_long_bao',
    name: 'Hắc Long đế bào',
    slot: 'ao',
    price: 0,
    minRealm: 0,
    desc: 'Áo của long tộc thượng cổ.',
    look: 'x',
    fx: { atk: 20, def: 20, hp: 20, cult: 20 },
    src: 'drop',
    from: ['hac_long'],
    rare: 3,
    robe: ['#1e1a2e', '#120e1c', '#9a3ad0', '#3a2a5a'],
    deco: 'long',
  },
  {
    id: 'huyet_ma_y',
    name: 'Huyết Ma y',
    slot: 'ao',
    price: 0,
    minRealm: 0,
    lean: 'ta',
    desc: 'Nhuộm từ biển máu.',
    look: 'x',
    fx: { atk: 20, exp: 20, tamMa: 2 },
    src: 'drop',
    from: ['huyet_ma', 'cuong_thi'],
    rare: 2,
    robe: ['#7a0a1e', '#4a0612', '#1e1a24', '#a82a3a'],
    deco: 'giap',
  },
  {
    id: 'vo_lam_bao',
    name: 'Minh chủ cẩm bào',
    slot: 'ao',
    price: 0,
    minRealm: 0,
    desc: 'Tước được từ cao thủ võ lâm.',
    look: 'x',
    fx: { atk: 10, def: 10, crit: 8 },
    src: 'drop',
    from: ['thiet_chuong', 'kiem_si', 'cuong_dao'],
    rare: 2,
    robe: ['#3d6fb0', '#2a4e86', '#ffd36b', '#6a9ad8'],
    deco: 'van',
  },

  // ======== Vũ khí ========
  { id: 'moc_kiem', name: 'Mộc kiếm', icon: true, slot: 'vu_khi', price: 15, minRealm: 0, desc: 'Kiếm gỗ tập võ.', look: 'mockiem', fx: { atk: 5 } },
  { id: 'cuoc_sat', name: 'Cuốc sắt', icon: true, slot: 'vu_khi', price: 10, minRealm: 0, desc: 'Làm lụng chăm chỉ.', look: 'x', fx: { money: 20 }, wpn: { k: 'cuoc', a: '#9aa6c0', b: '#8a5a2a' } },
  {
    id: 'quat_giay',
    name: 'Quạt thư sinh',
    icon: true,
    slot: 'vu_khi',
    price: 40,
    minRealm: 0,
    desc: 'Phe phẩy cho có phong thái.',
    look: 'x',
    fx: { cult: 5, tamCanh: 1 },
    wpn: { k: 'quat', a: '#f2ead0', b: '#3d6fb0' },
  },
  {
    id: 'thiet_kiem',
    name: 'Thiết kiếm',
    icon: true,
    slot: 'vu_khi',
    price: 50,
    minRealm: 0,
    desc: 'Kiếm sắt rèn thường.',
    look: 'x',
    fx: { atk: 12 },
    wpn: { k: 'kiem', a: '#c9ccd6', b: '#5a4128' },
  },
  {
    id: 'cung_san',
    name: 'Cung săn',
    icon: true,
    slot: 'vu_khi',
    price: 80,
    minRealm: 0,
    desc: 'Bắn từ xa, ít khi bị thương.',
    look: 'x',
    fx: { atk: 8, crit: 8, flee: 10 },
    wpn: { k: 'cung', a: '#8a5a2a', b: '#f2f2f6' },
  },
  {
    id: 'truong_thuong',
    name: 'Trường thương',
    icon: true,
    slot: 'vu_khi',
    price: 160,
    minRealm: 1,
    desc: 'Một tấc dài, một tấc mạnh.',
    look: 'x',
    fx: { atk: 15, def: 5 },
    wpn: { k: 'thuong', a: '#d9e6ff', b: '#8a5a2a' },
  },
  {
    id: 'ngoc_tieu',
    name: 'Ngọc tiêu',
    icon: true,
    slot: 'vu_khi',
    price: 220,
    minRealm: 1,
    desc: 'Tiếng tiêu trấn tâm ma.',
    look: 'x',
    fx: { tamMa: -2, tamCanh: 1, cult: 5 },
    wpn: { k: 'tieu', a: '#7fd8b8', b: '#ffd36b' },
  },
  { id: 'phat_tran', name: 'Phất trần', icon: true, slot: 'vu_khi', price: 260, minRealm: 2, desc: 'Phất trần của đạo nhân.', look: 'phattran', fx: { def: 15, tamCanh: 1 } },
  {
    id: 'phan_quan_but',
    name: 'Phán quan bút',
    icon: true,
    slot: 'vu_khi',
    price: 300,
    minRealm: 1,
    desc: 'Điểm huyệt như viết chữ.',
    look: 'x',
    fx: { cult: 10, crit: 10 },
    wpn: { k: 'but', a: '#2a1f2a', b: '#c9962e' },
  },
  { id: 'thanh_phong', name: 'Thanh Phong Kiếm', icon: true, slot: 'vu_khi', price: 380, minRealm: 1, desc: 'Phi kiếm cấp thấp.', look: 'kiem', fx: { atk: 20, flee: 15 } },
  {
    id: 'bat_lang_chuy',
    name: 'Bát lăng chùy',
    icon: true,
    slot: 'vu_khi',
    price: 450,
    minRealm: 2,
    desc: 'Nặng ngàn cân, một chùy vỡ đá.',
    look: 'x',
    fx: { atk: 25, crit: 5, flee: -10 },
    wpn: { k: 'chuy', a: '#9aa6c0', b: '#5a4128' },
  },
  { id: 'lo_dan', name: 'Tử Kim Đan Lô', icon: true, slot: 'vu_khi', price: 450, minRealm: 1, desc: 'Lò luyện đan mang theo người.', look: 'lodan', fx: { dan: 100 } },
  { id: 'huyet_dao', name: 'Huyết Ma Đao', icon: true, slot: 'vu_khi', price: 520, minRealm: 2, lean: 'ta', desc: 'Đao uống máu.', look: 'dao', fx: { atk: 30, exp: 15, tamMa: 1 } },
  {
    id: 'song_kiem',
    name: 'Âm Dương song kiếm',
    icon: true,
    slot: 'vu_khi',
    price: 700,
    minRealm: 2,
    desc: 'Một âm một dương, công thủ vẹn toàn.',
    look: 'x',
    fx: { atk: 25, def: 10, crit: 5 },
    wpn: { k: 'song', a: '#f2f2f6', b: '#2a1f2a' },
  },
  // nhặt được
  {
    id: 'dao_phay',
    name: 'Dao phay nhà bếp',
    icon: true,
    slot: 'vu_khi',
    price: 0,
    minRealm: 0,
    desc: 'Đồ nghề của mẹ. Chém gì cũng ngọt.',
    look: 'x',
    fx: { atk: 8, money: 5 },
    src: 'event',
    where: 'Tuổi thơ',
    rare: 1,
    wpn: { k: 'dao', a: '#c9ccd6', b: '#5a4128' },
  },
  {
    id: 'roi_da',
    name: 'Roi da trâu',
    icon: true,
    slot: 'vu_khi',
    price: 0,
    minRealm: 0,
    desc: 'Roi chăn trâu, quất kêu đét đét.',
    look: 'x',
    fx: { atk: 6, flee: 10 },
    src: 'event',
    where: 'Tuổi thơ, kiếm tiền',
    rare: 1,
    wpn: { k: 'roi', a: '#6a4a2a', b: '#3e2a18' },
  },
  {
    id: 'can_cau',
    name: 'Cần câu Khương Tử Nha',
    icon: true,
    slot: 'vu_khi',
    price: 0,
    minRealm: 0,
    desc: 'Câu thẳng không mồi, kẻ nguyện mắc câu.',
    look: 'x',
    fx: { tamCanh: 2, drop: 15, cult: 5 },
    src: 'event',
    where: 'Du ngoạn',
    rare: 2,
    wpn: { k: 'can', a: '#9aaa5a', b: '#f2f2f6' },
  },
  {
    id: 'kiem_gay',
    name: 'Kiếm gãy vô danh',
    icon: true,
    slot: 'vu_khi',
    price: 0,
    minRealm: 0,
    desc: 'Kiếm gãy cắm trên mộ cổ. Vẫn còn kiếm ý.',
    look: 'x',
    fx: { atk: 22, crit: 12 },
    src: 'event',
    where: 'Du ngoạn, tu luyện',
    rare: 2,
    wpn: { k: 'kiem', a: '#8a96a8', b: '#3e3228' },
  },
  // quái rơi
  {
    id: 'lang_nha_dao',
    name: 'Lang Nha đao',
    icon: true,
    slot: 'vu_khi',
    price: 0,
    minRealm: 0,
    desc: 'Răng sói mài thành lưỡi đao.',
    look: 'x',
    fx: { atk: 15, crit: 5 },
    src: 'drop',
    from: ['soi_xam', 'heo_rung'],
    rare: 1,
    wpn: { k: 'dao', a: '#f2f2f6', b: '#7d8590' },
  },
  {
    id: 'nhu_y_con',
    name: 'Như Ý côn',
    icon: true,
    slot: 'vu_khi',
    price: 0,
    minRealm: 0,
    desc: 'Cướp được từ Ác Hầu. Dài ngắn tùy ý.',
    look: 'x',
    fx: { atk: 15, flee: 15, drop: 10 },
    src: 'drop',
    from: ['khi_ac'],
    rare: 2,
    wpn: { k: 'truong', a: '#c9962e', b: '#b8302a' },
  },
  {
    id: 'son_tac_dao',
    name: 'Khai sơn đại đao',
    icon: true,
    slot: 'vu_khi',
    price: 0,
    minRealm: 0,
    desc: 'Đao của trùm sơn tặc.',
    look: 'x',
    fx: { atk: 18, money: 10 },
    src: 'drop',
    from: ['son_tac'],
    rare: 1,
    wpn: { k: 'dao', a: '#9aa6c0', b: '#8a2a1e' },
  },
  {
    id: 'doc_hat_kiem',
    name: 'Độc Hạt kiếm',
    icon: true,
    slot: 'vu_khi',
    price: 0,
    minRealm: 0,
    desc: 'Tẩm độc ong chúa, trúng là tê liệt.',
    look: 'x',
    fx: { atk: 15, crit: 15 },
    src: 'drop',
    from: ['bo_cap', 'thich_khach'],
    rare: 2,
    wpn: { k: 'kiem', a: '#7ad85a', b: '#5a1a1a' },
  },
  {
    id: 'thiet_quyen',
    name: 'Thiết chưởng thủ sáo',
    icon: true,
    slot: 'vu_khi',
    price: 0,
    minRealm: 0,
    desc: 'Găng sắt của bang chủ Thiết Chưởng.',
    look: 'x',
    fx: { atk: 22, def: 12 },
    src: 'drop',
    from: ['thiet_chuong'],
    rare: 2,
    wpn: { k: 'quyen', a: '#5a5a6a', b: '#c9962e' },
  },
  {
    id: 'van_doc_phien',
    name: 'Vạn Độc phiến',
    icon: true,
    slot: 'vu_khi',
    price: 0,
    minRealm: 0,
    desc: 'Phẩy một cái, độc bay mười dặm.',
    look: 'x',
    fx: { atk: 22, crit: 10, dan: 30 },
    src: 'drop',
    from: ['doc_vuong'],
    rare: 2,
    wpn: { k: 'quat', a: '#9ff0c8', b: '#9a3ad0' },
  },
  {
    id: 'cuong_dao',
    name: 'Cuồng Đao',
    icon: true,
    slot: 'vu_khi',
    price: 0,
    minRealm: 0,
    desc: 'Đao chưa ra khỏi vỏ đã có người chết.',
    look: 'x',
    fx: { atk: 40, def: -10 },
    src: 'drop',
    from: ['cuong_dao'],
    rare: 3,
    wpn: { k: 'dao', a: '#e0e4ee', b: '#8a1a24' },
  },
  {
    id: 'huyet_liem',
    name: 'Huyết Ma liêm',
    icon: true,
    slot: 'vu_khi',
    price: 0,
    minRealm: 0,
    lean: 'ta',
    desc: 'Lưỡi hái gặt mạng người.',
    look: 'x',
    fx: { atk: 35, exp: 25, tamMa: 2 },
    src: 'drop',
    from: ['huyet_ma'],
    rare: 3,
    wpn: { k: 'liem', a: '#c0202e', b: '#1e1a24' },
  },
  {
    id: 'bang_giao_thuong',
    name: 'Băng Giao thương',
    icon: true,
    slot: 'vu_khi',
    price: 0,
    minRealm: 0,
    desc: 'Mũi thương đóng băng máu kẻ địch.',
    look: 'x',
    fx: { atk: 30, def: 15 },
    src: 'drop',
    from: ['bang_giao', 'ngan_giac'],
    rare: 3,
    wpn: { k: 'thuong', a: '#b4e0ff', b: '#4a9ad0' },
  },
  {
    id: 'vo_danh_kiem',
    name: 'Vô Danh kiếm',
    icon: true,
    slot: 'vu_khi',
    price: 0,
    minRealm: 0,
    desc: 'Kiếm của Kiếm Si. Chưa từng thua.',
    look: 'x',
    fx: { atk: 45, crit: 15, cult: 10 },
    src: 'drop',
    from: ['kiem_si'],
    rare: 3,
    wpn: { k: 'kiem', a: '#ffffff', b: '#3d6fb0' },
  },
  {
    id: 'hoa_lan_cung',
    name: 'Hỏa Lân cung',
    icon: true,
    slot: 'vu_khi',
    price: 0,
    minRealm: 0,
    desc: 'Tên bắn ra cháy thành lửa.',
    look: 'x',
    fx: { atk: 30, crit: 12, flee: 15 },
    src: 'drop',
    from: ['ky_lan', 'dai_bang'],
    rare: 3,
    wpn: { k: 'cung', a: '#e0502a', b: '#ffd36b' },
  },

  // ======== Phụ kiện ========
  { id: 'ngoc_boi', name: 'Ngọc bội hộ thân', icon: true, slot: 'phu_kien', price: 120, minRealm: 0, desc: 'Đỡ một lần chí mạng.', look: 'ngoc' },
  { id: 'ho_lo', name: 'Hồ lô rượu', icon: true, slot: 'phu_kien', price: 80, minRealm: 0, desc: 'Ung dung tự tại.', look: 'holo', fx: { tamCanh: 1, hp: 5 } },
  { id: 'kiem_bay', name: 'Bản mệnh phi kiếm', icon: true, slot: 'phu_kien', price: 1400, minRealm: 3, path: 'kiem', desc: 'Kiếm bay vòng quanh chủ.', look: 'kiembay', fx: { cult: 20, atk: 25 } },
  ...GEAR,
  ...EXTRA_ITEMS,
];

/** Tổng chỉ số từ đồ đang mặc */
export function gearFx(equipped: Partial<Record<Slot, string>>): Required<ItemFx> {
  const t: Required<ItemFx> = { atk: 0, def: 0, hp: 0, crit: 0, flee: 0, cult: 0, exp: 0, drop: 0, money: 0, dan: 0, tamCanh: 0, tamMa: 0 };
  for (const id of Object.values(equipped)) {
    const fx = ITEMS.find((i) => i.id === id)?.fx;
    if (fx) for (const k of Object.keys(fx) as (keyof ItemFx)[]) t[k] += fx[k] ?? 0;
  }
  return t;
}

const FX_LABEL: Record<keyof ItemFx, string> = {
  atk: 'Công',
  def: 'Thủ',
  hp: 'Máu',
  crit: 'Bạo kích',
  flee: 'Rút lui',
  cult: 'Tu luyện',
  exp: 'Tu vi trảm yêu',
  drop: 'Rơi đồ',
  money: 'Kiếm tiền',
  dan: 'Luyện đan',
  tamCanh: 'Tâm cảnh/năm',
  tamMa: 'Tâm ma/năm',
};

/** Mô tả chỉ số ngắn gọn: "Công +12% · Bạo kích +8%" */
export function fxText(fx?: ItemFx): string {
  if (!fx) return '';
  return (Object.keys(fx) as (keyof ItemFx)[])
    .filter((k) => fx[k])
    .map((k) => {
      const v = fx[k]!;
      const unit = k === 'tamCanh' || k === 'tamMa' ? '' : '%';
      return `${FX_LABEL[k]} ${v > 0 ? '+' : ''}${v}${unit}`;
    })
    .join(' · ');
}

export const PILLS = [
  { id: 'tu_khi', name: 'Tụ Khí Đan', icon: true, price: 30, desc: '+tu vi ngay lập tức' },
  { id: 'truc_co', name: 'Trúc Cơ Đan', icon: true, price: 200, desc: 'Tăng tỉ lệ đột phá đại cảnh giới' },
  { id: 'dien_tho', name: 'Diên Thọ Đan', icon: true, price: 500, desc: '+8 năm thọ nguyên (tối đa 200)' },
  { id: 'thanh_tam', name: 'Thanh Tâm Đan', icon: true, price: 90, desc: '-tâm ma' },
  { id: 'hoi_xuan', name: 'Hồi Xuân Đan', icon: true, price: 60, desc: 'Hồi sức khỏe' },
  { id: 'huyet_sat', name: 'Huyết Sát Đan', icon: true, price: 50, desc: 'Tà tu: -tâm ma mạnh, đổi bằng máu. Chính đạo uống vào thì tâm ma tăng' },
];

export const TALENTS: Talent[] = [
  { id: 'ky_uc', name: 'Ký ức tiền kiếp', desc: 'Ngộ tính khởi đầu +20', cost: 30 },
  { id: 'linh_can', name: 'Nghịch thiên cải mệnh', desc: 'Linh căn ít nhất là Huyền linh căn', cost: 60 },
  { id: 'tho', name: 'Trường thọ huyết mạch', desc: 'Thọ nguyên +20%', cost: 45 },
  { id: 'gia_tai', name: 'Đầu thai nhà giàu', desc: 'Khởi đầu thêm 300 linh thạch', cost: 25 },
  { id: 'phuc', name: 'Phúc tinh chiếu mệnh', desc: 'Khí vận khởi đầu +25', cost: 40 },
  { id: 'kiem_tam', name: 'Kiếm tâm thông minh', desc: 'Sinh ra đã có Mộc kiếm, du ngoạn an toàn hơn', cost: 20 },
  { id: 'ho_than', name: 'Ngọc bội hộ thân', desc: 'Sinh ra đã đeo ngọc bội, đỡ được một lần chết', cost: 35 },
  { id: 'linh_thu', name: 'Linh thú bầu bạn', desc: 'Một linh thú hiếm theo bạn từ lúc lọt lòng', cost: 50 },
  { id: 'van_kiep', name: 'Vạn kiếp bất diệt', desc: 'Trời thương như kiếp đầu: trước 16 tuổi không chết', cost: 70 },
  { id: 'thien_menh', name: 'Thiên mệnh chi tử', desc: 'Khí vận tối đa, linh căn biến dị, đột phá dễ hơn 15%', cost: 150 },
  { id: 'tien_cot', name: 'Tiên cốt trời sinh', desc: 'Chắc chắn mang Thiên linh căn, tu luyện nhanh gấp đôi', cost: 200 },
  // thiên phú của tà đạo, trả bằng nghiệp lực
  { id: 'ta_huyet', name: 'Huyết mạch ma tộc', desc: 'Sinh ra đã nghiêng về tà (đạo tâm -30), ngộ tính +10', cost: 30, ta: true },
  { id: 'ta_dao', name: 'Huyết Ma Đao chờ chủ', desc: 'Huyết Ma Đao nằm sẵn trong túi, đủ Trúc Cơ là cầm được', cost: 40, ta: true },
  { id: 'ta_kien', name: 'Ma tâm kiên cố', desc: 'Tâm ma tăng chậm hơn 35% suốt kiếp này', cost: 45, ta: true },
  { id: 'ta_cong', name: 'Ma công nhập thể', desc: 'Linh căn mạnh hơn 20%, đổi lại tâm ma khởi đầu +10', cost: 50, ta: true },
  { id: 'ta_hon', name: 'Oan hồn hộ thể', desc: 'Oan hồn kiếp trước đỡ cho một lần chết', cost: 70, ta: true },
  { id: 'ta_ton', name: 'Ma tôn chuyển thế', desc: 'Đạo tâm -60, khí vận +15, tu luyện nhanh hơn 15%', cost: 120, ta: true },
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
  nam: [
    'búi tóc cao',
    'tóc buộc dài sau gáy',
    'tóc dài xõa vai',
    'tóc dài rối kiểu lãng tử',
    'tóc buộc thấp',
    'tóc dài buộc khăn',
    'tóc dài rẽ ngôi lệch',
    'tóc bù xù',
    'tóc rẽ ngôi giữa',
    'đầu cạo trọc',
    'đầu cạo sát',
    'đầu hói đỉnh',
  ],
  nu: [
    'tóc dài buông xõa',
    'búi đôi',
    'đuôi ngựa cao',
    'tóc tết bím dài',
    'búi tóc cung đình',
    'một bím tóc',
    'nửa búi nửa xõa',
    'búi tóc có mái',
    'tóc dài gợn sóng',
    'hai bím tóc',
    'tóc dài suôn thẳng',
    'tóc dài mái rủ',
    'tóc dài rẽ ngôi giữa',
    'tóc buông lơi',
    'tóc vắt một bên vai',
    'tóc dài rẽ ngôi lệch',
  ],
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
