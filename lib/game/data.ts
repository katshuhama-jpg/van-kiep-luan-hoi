import { GEAR } from './gear';
import { EXTRA_ITEMS } from './items2';
import type { Focus, PathId, Slot, Talent } from './types';
import { tr } from '../i18n';

export const REALMS = [
  { name: tr('Phàm Nhân', "Mortal"), layers: 1, life: 65, need: 0 },
  { name: tr('Luyện Khí', "Qi Refining"), layers: 9, life: 120, need: 60 },
  { name: tr('Trúc Cơ', "Foundation Establishment"), layers: 3, life: 150, need: 220 },
  { name: tr('Kim Đan', "Golden Core"), layers: 3, life: 180, need: 380 },
  { name: tr('Nguyên Anh', "Nascent Soul"), layers: 3, life: 210, need: 600 },
  { name: tr('Hóa Thần', "Spirit Transformation"), layers: 3, life: 240, need: 900 },
  { name: tr('Luyện Hư', "Void Refinement"), layers: 3, life: 270, need: 1300 },
  { name: tr('Độ Kiếp', "Tribulation Transcendence"), layers: 3, life: 300, need: 1800 },
  // Tiên giới (ma tu thì là Ma giới, cùng bậc nhưng tên khác, xem MA_REALMS)
  { name: tr('Chân Tiên', "True Immortal"), layers: 3, life: 480, need: 2600 },
  { name: tr('Huyền Tiên', "Mystic Immortal"), layers: 3, life: 630, need: 3600 },
  { name: tr('Kim Tiên', "Golden Immortal"), layers: 3, life: 810, need: 5000 },
  { name: tr('Đại La Kim Tiên', "Daluo Golden Immortal"), layers: 3, life: 1050, need: 7000 },
] as const;

/** Cảnh giới đầu tiên sau phi thăng */
export const ASCEND_REALM = 8;
/** Cảnh giới cao nhất */
export const TOP_REALM = 11;
/** Tên cảnh giới Ma giới, cùng bậc với tiên giới 8..11 */
export const MA_REALMS = [tr('Ma Tướng', "Demon General"), tr('Ma Vương', "Demon King"), tr('Ma Hoàng', "Demon Monarch"), tr('Ma Đế', "Demon Emperor")];
/** Thái Hư giới: cõi của người trung lập, không theo tiên cũng không theo ma */
export const HU_REALMS = [tr('Hư Tiên', "Void Immortal"), tr('Huyền Tôn', "Mystic Sovereign"), tr('Thái Hư Chân Quân', "Great Void True Lord"), tr('Hỗn Nguyên Đạo Tổ', "Primordial Dao Ancestor")];
export type Cosmos = 'tien' | 'ma' | 'hu';
export const COSMOS_NAME: Record<Cosmos, string> = { tien: tr('Tiên giới', "Immortal Realm"), ma: tr('Ma giới', "Demon Realm"), hu: tr('Thái Hư giới', "Great Void Realm") };

/** Tên cảnh giới, theo tiên giới hay ma giới */
export function realmName(realm: number, cosmos?: Cosmos | null): string {
  if (realm >= ASCEND_REALM && cosmos === 'ma') return MA_REALMS[realm - ASCEND_REALM] ?? tr('Ma Đế', "Demon Emperor");
  if (realm >= ASCEND_REALM && cosmos === 'hu') return HU_REALMS[realm - ASCEND_REALM] ?? tr('Hỗn Nguyên Đạo Tổ', "Primordial Dao Ancestor");
  return REALMS[realm]?.name ?? tr('Phi Thăng', "Ascension");
}

/** Thọ nguyên tối đa: phàm giới 300, tiên giới, ma giới theo cảnh giới */
export function lifeCap(realm: number): number {
  return realm >= ASCEND_REALM ? MAX_LIFE_ASCENDED : MAX_LIFE;
}

/** Thọ nguyên tối đa khi chưa phi thăng, để kiếp nào cũng sớm đến lúc luân hồi */
export const MAX_LIFE = 300;
/** Thọ nguyên tối đa sau khi lên Tiên giới, Ma giới, Thái Hư giới */
export const MAX_LIFE_ASCENDED = 1050;

export const STAGE3 = [tr('Sơ kỳ', "Early"), tr('Trung kỳ', "Middle"), tr('Hậu kỳ', "Late")];

export function realmLabel(realm: number, layer: number, cosmos?: Cosmos | null): string {
  const r = REALMS[realm] ?? REALMS[REALMS.length - 1];
  if (realm === 0) return r.name;
  if (r.layers === 9) return tr(`${r.name} tầng ${layer}`, `${r.name} Layer ${layer}`);
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
  kiem: { id: 'kiem', name: tr('Kiếm tu', "Sword Cultivator"), short: tr('Kiếm', "Sword"), desc: tr('Lấy kiếm nhập đạo. Công mạnh nhất, tu nhanh. Hay chết trận vì ham đánh.', "Enter the Dao through the sword. Strongest attack, fast cultivation. Often dies in battle from loving a fight too much."), lean: 'trung', aura: '#7fc8ff' },
  dan: { id: 'dan', name: tr('Đan tu', "Alchemist"), short: tr('Đan', "Alchemy"), desc: tr('Sống lâu nhất trong các con đường. Luyện đan kiếm nhiều linh thạch, tự chế đan đột phá, tu nhanh hơn chút, có đan dược hộ thân nên khó chết, nhưng ra đòn không mạnh. Kiếp sau còn nhớ cách luyện: đan hồi hồn rẻ hơn 30%.', "The longest-lived of all Paths. Alchemy earns plenty of spirit stones, you brew your own breakthrough pills, cultivate a little faster, and your pills keep you alive, but your strikes are weak. Next life you still remember the recipes: soul-return pills cost 30% less."), lean: 'trung', aura: '#ffb057' },
  tran: { id: 'tran', name: tr('Trận tu', "Formation Master"), short: tr('Trận', "Formation"), desc: tr('Bày trận, vẽ phù. Thủ cực chắc, bế quan an toàn, ít bị tập kích. Thường sống rất thọ.', "Lay formations, draw talismans. Rock-solid defense, safe seclusion, rarely ambushed. Usually lives very long."), lean: 'trung', aura: '#b59cff' },
  phat: { id: 'phat', name: tr('Phật tu', "Buddhist Cultivator"), short: tr('Phật', "Buddhist"), desc: tr('Từ bi hỷ xả. Máu và thủ dày, thọ nguyên dài, tâm ma khó xâm nhập, đột phá vững vàng.', "Compassion and equanimity. Thick HP and defense, long lifespan, heart demons find no way in, steady breakthroughs."), lean: 'chinh', aura: '#ffe27a' },
  ma: { id: 'ma', name: tr('Ma tu', "Demonic Cultivator"), short: tr('Ma', "Demonic"), desc: tr('Hút linh lực, luyện huyết công. Tu nhanh nhất, nhưng tâm ma cực nặng.', "Drain spiritual power, refine blood arts. Fastest cultivation, but brutal heart demons."), lean: 'ta', aura: '#ff3448' },
  yeu: { id: 'yeu', name: tr('Yêu tu', "Yao Cultivator"), short: tr('Yêu', "Yao"), desc: tr('Thức tỉnh huyết mạch yêu tộc. Thân thể khỏe, có thể hóa hình. Sống thọ nhất trong các đạo.', "Awaken the bloodline of the yao race. Sturdy body, can take human form. The longest lifespan of all Paths."), lean: 'trung', aura: '#7be3a4' },
};

export const LINH_CAN = [
  { name: tr('Thiên linh căn', "Heavenly Spiritual Root"), mul: 1.9, w: 3 },
  { name: tr('Địa linh căn', "Earthly Spiritual Root"), mul: 1.6, w: 12 },
  { name: tr('Huyền linh căn', "Mystic Spiritual Root"), mul: 1.2, w: 30 },
  { name: tr('Tạp linh căn', "Mixed Spiritual Root"), mul: 0.85, w: 40 },
  { name: tr('Phế linh căn', "Crippled Spiritual Root"), mul: 0.45, w: 15 },
];

/** 3.1.0: đột phá đại cảnh giới từ Kim Đan trở lên phụ thuộc linh căn */
export function linhCanBreak(mul: number): number {
  if (mul >= 1.9) return 0.06;
  if (mul >= 1.6) return 0.03;
  if (mul >= 1.2) return 0;
  if (mul >= 0.85) return -0.08;
  return -0.15;
}
/** Bình cảnh: thất bại liên tiếp ở cùng cảnh giới thì phải bế quan */
export const BINH_CANH_FAILS = 3;
export const BINH_CANH_YEARS = 10;
/** Năm trôi nhanh hơn ở cảnh giới cao để mỗi kiếp vẫn gọn */
export function yearSpeed(realm: number, cosmos?: unknown): number {
  if (cosmos || realm >= 8) return 2.5;
  if (realm >= 4) return 2;
  if (realm >= 3) return 1.6;
  if (realm >= 2) return 1.3;
  return 1;
}

export const ORIGINS = [
  { id: 'nong', name: tr('Con nhà nông ở Thanh Thủy thôn', "A farmer's child from Qingshui Village"), money: 20, w: 34 },
  { id: 'tieu_thuong', name: tr('Con tiểu thương ở trấn Lạc Hà', "A small trader's child from Luo He Town"), money: 80, w: 24 },
  { id: 'the_gia', name: tr('Chi thứ của Lâm gia, một tu tiên thế gia', "A branch scion of the Lin clan, a cultivation family"), money: 260, w: 10 },
  { id: 'co_nhi', name: tr('Cô nhi được lão ăn mày nuôi lớn', "An orphan raised by an old beggar"), money: 5, w: 18 },
  { id: 'chua', name: tr('Đứa trẻ bị bỏ trước cổng chùa Vân Tịch', "A child abandoned at the gate of Yun Xi Temple"), money: 10, w: 10 },
  { id: 'yeu', name: tr('Tiểu yêu sinh ra ở Vạn Yêu Lâm', "A little yao born in Wanyao Forest"), money: 15, w: 4 },
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
export const DAO_LU = [tr('Diệp Ngưng Sương', "Ye Ningshuang"), tr('Tô Vũ Đồng', "Su Yutong"), tr('Hàn Mặc', "Han Mo"), tr('Bạch Tử Kỳ', "Bai Ziqi"), tr('Giang Nguyệt Hoa', "Jiang Yuehua"), tr('Lý Huyền', "Li Xuan"), tr('Vân Băng Tâm', "Yun Bingxin"), tr('Tiêu Hạo', "Xiao Hao")];

export const FOCUS: Record<Focus, { name: string; desc: string; minAge: number }> = {
  tu_luyen: { name: tr('Tu luyện', "Cultivate"), desc: tr('Tăng tu vi', "Raise cultivation"), minAge: 6 },
  luyen_dan: { name: tr('Luyện đan', "Alchemy"), desc: tr('Ra đan dược, linh thạch', "Pills, spirit stones"), minAge: 12 },
  du_ngoan: { name: tr('Du ngoạn', "Wander"), desc: tr('Nhiều kỳ ngộ', "Many encounters"), minAge: 10 },
  kiem_tien: { name: tr('Kiếm tiền', "Earn money"), desc: tr('Linh thạch', "Spirit stones"), minAge: 8 },
  ket_duyen: { name: tr('Kết duyên', "Romance"), desc: tr('Tâm cảnh, đạo lữ', "Mind, Dao companion"), minAge: 16 },
  tru_yeu: { name: tr('Trừ yêu', "Hunt demons"), desc: tr('Đánh quái lên cấp', "Slay monsters, level up"), minAge: 10 },
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
  { id: 'ao_vai', name: tr('Áo vải thô', "Coarse cloth robe"), slot: 'ao', price: 0, minRealm: 0, desc: tr('Áo mặc từ nhỏ.', "Worn since childhood."), look: 'vai', src: 'event', where: tr('Có sẵn từ lúc sinh', "Owned since birth") },
  {
    id: 'ao_da_thu',
    name: tr('Áo da thú', "Beast-hide coat"),
    slot: 'ao',
    price: 40,
    minRealm: 0,
    desc: tr('Da thú may vụng, chắc chắn.', "Clumsily stitched hide, but sturdy."),
    look: 'x',
    fx: { def: 8, hp: 5 },
    robe: ['#8a6a4a', '#6a4e34', '#c9a77a', '#a8885e'],
    deco: 'long_thu',
  },
  {
    id: 'ao_nho_y',
    name: tr('Nho y thư sinh', "Scholar's robe"),
    slot: 'ao',
    price: 70,
    minRealm: 0,
    desc: tr('Áo của người đọc sách.', "The robe of a bookish man."),
    look: 'x',
    fx: { cult: 5, tamCanh: 1 },
    robe: ['#e6e0cc', '#c4bca4', '#3d6fb0', '#ffffff'],
  },
  { id: 'thanh_sam', name: tr('Thanh Sam', "Azure Robe"), slot: 'ao', price: 60, minRealm: 1, desc: tr('Áo xanh ngọc của đệ tử.', "Jade-green disciple robe."), look: 'thanh', fx: { cult: 5, tamCanh: 1 } },
  { id: 'ao_vo_si', name: tr('Võ phục đỏ', "Red martial garb"), slot: 'ao', price: 120, minRealm: 1, desc: tr('Áo bó gọn của võ sinh.', "Snug clothes of a martial student."), look: 'x', fx: { atk: 8, hp: 5 }, robe: ['#b8302a', '#86201c', '#ffd36b', '#d8604a'] },
  { id: 'ao_da_hanh', name: tr('Dạ hành y', "Night-walker garb"), slot: 'ao', price: 180, minRealm: 1, desc: tr('Đồ đen của kẻ đi đêm.', "Black clothes for those who prowl at night."), look: 'x', fx: { flee: 20, crit: 5 }, robe: ['#24242e', '#16161c', '#5a5a6a', '#3a3a48'] },
  {
    id: 'ao_thuong_nhan',
    name: tr('Gấm vóc thương nhân', "Merchant's brocade"),
    slot: 'ao',
    price: 260,
    minRealm: 1,
    desc: tr('Mặc vào ai cũng tin bạn có tiền.', "Wear it and everyone believes you are rich."),
    look: 'x',
    fx: { money: 30, dan: 10 },
    robe: ['#c9962e', '#9a7020', '#7a2a1e', '#ffd36b'],
    deco: 'hoa',
  },
  { id: 'bach_y', name: tr('Bạch Y Tuyết Văn', "Snow-Cloud White Robe"), slot: 'ao', price: 220, minRealm: 2, lean: 'chinh', desc: tr('Áo trắng thêu mây. Tà khí khó gần.', "White robe embroidered with clouds. Evil qi keeps its distance."), look: 'bach', fx: { def: 15, tamMa: -1 }, deco: 'van' },
  { id: 'huyet_bao', name: tr('Huyết Sát Bào', "Blood Fiend Robe"), slot: 'ao', price: 220, minRealm: 2, lean: 'ta', desc: tr('Áo đen viền máu.', "Black robe trimmed with blood."), look: 'huyet', fx: { cult: 15, atk: 10, tamMa: 1 } },
  { id: 'ca_sa', name: tr('Cà sa Kim Lan', "Golden Orchid Kasaya"), slot: 'ao', price: 300, minRealm: 2, path: 'phat', desc: tr('Cà sa của cao tăng.', "The kasaya of an eminent monk."), look: 'casa', fx: { def: 10, tamMa: -2 } },
  {
    id: 'dao_bao',
    name: tr('Đạo bào Thái Cực', "Taiji Daoist Robe"),
    slot: 'ao',
    price: 400,
    minRealm: 2,
    desc: tr('Áo đạo sĩ thêu âm dương.', "A Daoist robe embroidered with yin and yang."),
    look: 'x',
    fx: { cult: 12, tamMa: -1 },
    robe: ['#3a3a4a', '#24242e', '#f2f2f6', '#5a5a6a'],
    deco: 'van',
  },
  {
    id: 'dong_giap',
    name: tr('Đồng giáp', "Bronze armor"),
    slot: 'ao',
    price: 500,
    minRealm: 2,
    desc: tr('Giáp đồng nặng trịch.', "Heavy bronze plates."),
    look: 'x',
    fx: { def: 22, hp: 12, flee: -10 },
    robe: ['#a8703a', '#7a4e24', '#ffd36b', '#c99a5a'],
    deco: 'giap',
  },
  { id: 'tu_kim_bao', name: tr('Tử Kim Bào', "Purple-Gold Robe"), slot: 'ao', price: 900, minRealm: 3, desc: tr('Áo tím chỉ vàng của chân nhân.', "Purple robe with gold thread, worn by true masters."), look: 'tukim', fx: { cult: 10, def: 15, drop: 15 } },
  {
    id: 'tien_y',
    name: tr('Tiên y Lưu Vân', "Flowing Cloud Immortal Robe"),
    slot: 'ao',
    price: 1800,
    minRealm: 3,
    desc: tr('Áo dệt từ mây, nhẹ như không.', "Woven from clouds, light as nothing."),
    look: 'x',
    fx: { cult: 20, flee: 20, tamCanh: 1 },
    robe: ['#dff0ff', '#a8c8e6', '#ffd36b', '#ffffff'],
    deco: 'van',
  },
  // nhặt được trong đời
  {
    id: 'ao_toi',
    name: tr('Áo tơi lá', "Leaf raincoat"),
    slot: 'ao',
    price: 0,
    minRealm: 0,
    desc: tr('Áo tơi của khách giang hồ.', "The raincoat of a jianghu wanderer."),
    look: 'x',
    fx: { flee: 15, tamCanh: 1 },
    src: 'event',
    where: tr('Du ngoạn', "Wander"),
    rare: 1,
    robe: ['#7a8a4a', '#5a6a34', '#c9b08a', '#9aaa6a'],
    deco: 'vu',
  },
  {
    id: 'hi_phuc',
    name: tr('Hỉ phục đỏ', "Red wedding robe"),
    slot: 'ao',
    price: 0,
    minRealm: 0,
    desc: tr('Áo cưới của ai bỏ quên.', "A wedding robe someone left behind."),
    look: 'x',
    fx: { tamCanh: 2, money: 10 },
    src: 'event',
    where: tr('Kết duyên', "Romance"),
    rare: 1,
    robe: ['#d0202e', '#9a1420', '#ffd36b', '#ff6a6a'],
    deco: 'hoa',
  },
  {
    id: 'ao_an_may',
    name: tr('Áo trăm mảnh Cái Bang', "Beggar Sect patchwork robe"),
    slot: 'ao',
    price: 0,
    minRealm: 0,
    desc: tr('Nghèo mà có khí tiết.', "Poor, but with dignity."),
    look: 'x',
    fx: { def: 12, drop: 20, money: -10 },
    src: 'event',
    where: tr('Khi túng quẫn', "When broke"),
    rare: 2,
    robe: ['#8a7a5a', '#6a5a3e', '#5a4128', '#a8987a'],
    deco: 'manh',
  },
  {
    id: 'long_bao_cu',
    name: tr('Long bào cũ', "Old dragon robe"),
    slot: 'ao',
    price: 0,
    minRealm: 0,
    desc: tr('Áo rồng của một vị vua mất nước.', "The dragon robe of a king who lost his kingdom."),
    look: 'x',
    fx: { money: 30, drop: 15, def: 10 },
    src: 'event',
    where: tr('Du ngoạn, rất hiếm', "Wander, very rare"),
    rare: 3,
    robe: ['#e0b02a', '#b0841a', '#c0202e', '#ffd36b'],
    deco: 'long',
  },
  // quái rơi
  {
    id: 'ao_da_soi',
    name: tr('Áo da sói', "Wolfskin coat"),
    slot: 'ao',
    price: 0,
    minRealm: 0,
    desc: tr('Lột từ sói xám thành tinh.', "Flayed from a grey wolf turned demon."),
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
    name: tr('Giáp vảy mãng', "Python-scale armor"),
    slot: 'ao',
    price: 0,
    minRealm: 0,
    desc: tr('Ghép từ vảy mãng xà.', "Pieced together from python scales."),
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
    name: tr('Cửu Vĩ hồ cừu', "Nine-Tailed Fox Fur"),
    slot: 'ao',
    price: 0,
    minRealm: 0,
    desc: tr('Áo lông hồ ly chín đuôi, mê hoặc lòng người.', "Nine-tailed fox fur that bewitches all who see it."),
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
    name: tr('Hắc Hùng trọng giáp', "Black Bear Heavy Armor"),
    slot: 'ao',
    price: 0,
    minRealm: 0,
    desc: tr('Da gấu ngàn năm, đao kiếm khó xuyên.', "Thousand-year bear hide; blades barely pierce it."),
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
    name: tr('Kim Vũ thần y', "Golden Feather Divine Robe"),
    slot: 'ao',
    price: 0,
    minRealm: 0,
    desc: tr('Dệt từ lông cánh Kim Sí Đại Bằng.', "Woven from the wing feathers of the Golden-Winged Roc."),
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
    name: tr('Băng Giao lân giáp', "Ice Jiao Scale Armor"),
    slot: 'ao',
    price: 0,
    minRealm: 0,
    desc: tr('Lạnh buốt, đóng băng kẻ dám chạm vào.', "Bitterly cold; it freezes anyone who dares touch it."),
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
    name: tr('Hỏa Lân chiến bào', "Fire Qilin War Robe"),
    slot: 'ao',
    price: 0,
    minRealm: 0,
    desc: tr('Lửa kỳ lân cháy mãi không tắt.', "Qilin flame that never goes out."),
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
    name: tr('Hắc Long đế bào', "Black Dragon Imperial Robe"),
    slot: 'ao',
    price: 0,
    minRealm: 0,
    desc: tr('Áo của long tộc thượng cổ.', "A robe of the ancient dragon race."),
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
    name: tr('Huyết Ma y', "Blood Demon Garb"),
    slot: 'ao',
    price: 0,
    minRealm: 0,
    lean: 'ta',
    desc: tr('Nhuộm từ biển máu.', "Dyed in a sea of blood."),
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
    name: tr('Minh chủ cẩm bào', "Alliance Leader's Brocade"),
    slot: 'ao',
    price: 0,
    minRealm: 0,
    desc: tr('Tước được từ cao thủ võ lâm.', "Stripped from a martial arts master."),
    look: 'x',
    fx: { atk: 10, def: 10, crit: 8 },
    src: 'drop',
    from: ['thiet_chuong', 'kiem_si', 'cuong_dao'],
    rare: 2,
    robe: ['#3d6fb0', '#2a4e86', '#ffd36b', '#6a9ad8'],
    deco: 'van',
  },

  // ======== Vũ khí ========
  { id: 'moc_kiem', name: tr('Mộc kiếm', "Wooden sword"), icon: true, slot: 'vu_khi', price: 15, minRealm: 0, desc: tr('Kiếm gỗ tập võ.', "A wooden practice sword."), look: 'mockiem', fx: { atk: 5 } },
  { id: 'cuoc_sat', name: tr('Cuốc sắt', "Iron hoe"), icon: true, slot: 'vu_khi', price: 10, minRealm: 0, desc: tr('Làm lụng chăm chỉ.', "For honest hard work."), look: 'x', fx: { money: 20 }, wpn: { k: 'cuoc', a: '#9aa6c0', b: '#8a5a2a' } },
  {
    id: 'quat_giay',
    name: tr('Quạt thư sinh', "Scholar's fan"),
    icon: true,
    slot: 'vu_khi',
    price: 40,
    minRealm: 0,
    desc: tr('Phe phẩy cho có phong thái.', "Waved about for the air of refinement."),
    look: 'x',
    fx: { cult: 5, tamCanh: 1 },
    wpn: { k: 'quat', a: '#f2ead0', b: '#3d6fb0' },
  },
  {
    id: 'thiet_kiem',
    name: tr('Thiết kiếm', "Iron sword"),
    icon: true,
    slot: 'vu_khi',
    price: 50,
    minRealm: 0,
    desc: tr('Kiếm sắt rèn thường.', "An ordinary forged iron sword."),
    look: 'x',
    fx: { atk: 12 },
    wpn: { k: 'kiem', a: '#c9ccd6', b: '#5a4128' },
  },
  {
    id: 'cung_san',
    name: tr('Cung săn', "Hunting bow"),
    icon: true,
    slot: 'vu_khi',
    price: 80,
    minRealm: 0,
    desc: tr('Bắn từ xa, ít khi bị thương.', "Shoots from afar, rarely gets hurt."),
    look: 'x',
    fx: { atk: 8, crit: 8, flee: 10 },
    wpn: { k: 'cung', a: '#8a5a2a', b: '#f2f2f6' },
  },
  {
    id: 'truong_thuong',
    name: tr('Trường thương', "Long spear"),
    icon: true,
    slot: 'vu_khi',
    price: 160,
    minRealm: 1,
    desc: tr('Một tấc dài, một tấc mạnh.', "An inch longer, an inch stronger."),
    look: 'x',
    fx: { atk: 15, def: 5 },
    wpn: { k: 'thuong', a: '#d9e6ff', b: '#8a5a2a' },
  },
  {
    id: 'ngoc_tieu',
    name: tr('Ngọc tiêu', "Jade flute"),
    icon: true,
    slot: 'vu_khi',
    price: 220,
    minRealm: 1,
    desc: tr('Tiếng tiêu trấn tâm ma.', "Its notes calm heart demons."),
    look: 'x',
    fx: { tamMa: -2, tamCanh: 1, cult: 5 },
    wpn: { k: 'tieu', a: '#7fd8b8', b: '#ffd36b' },
  },
  { id: 'phat_tran', name: tr('Phất trần', "Horsetail whisk"), icon: true, slot: 'vu_khi', price: 260, minRealm: 2, desc: tr('Phất trần của đạo nhân.', "A Daoist's whisk."), look: 'phattran', fx: { def: 15, tamCanh: 1 } },
  {
    id: 'phan_quan_but',
    name: tr('Phán quan bút', "Judge's brush"),
    icon: true,
    slot: 'vu_khi',
    price: 300,
    minRealm: 1,
    desc: tr('Điểm huyệt như viết chữ.', "Strikes acupoints like writing calligraphy."),
    look: 'x',
    fx: { cult: 10, crit: 10 },
    wpn: { k: 'but', a: '#2a1f2a', b: '#c9962e' },
  },
  { id: 'thanh_phong', name: tr('Thanh Phong Kiếm', "Clear Wind Sword"), icon: true, slot: 'vu_khi', price: 380, minRealm: 1, desc: tr('Phi kiếm cấp thấp.', "A low-grade flying sword."), look: 'kiem', fx: { atk: 20, flee: 15 } },
  {
    id: 'bat_lang_chuy',
    name: tr('Bát lăng chùy', "Eight-edged mace"),
    icon: true,
    slot: 'vu_khi',
    price: 450,
    minRealm: 2,
    desc: tr('Nặng ngàn cân, một chùy vỡ đá.', "A thousand catties heavy; one blow shatters stone."),
    look: 'x',
    fx: { atk: 25, crit: 5, flee: -10 },
    wpn: { k: 'chuy', a: '#9aa6c0', b: '#5a4128' },
  },
  { id: 'lo_dan', name: tr('Tử Kim Đan Lô', "Purple-Gold Pill Furnace"), icon: true, slot: 'vu_khi', price: 450, minRealm: 1, desc: tr('Lò luyện đan mang theo người.', "A portable alchemy furnace."), look: 'lodan', fx: { dan: 100 } },
  { id: 'huyet_dao', name: tr('Huyết Ma Đao', "Blood Demon Saber"), icon: true, slot: 'vu_khi', price: 520, minRealm: 2, lean: 'ta', desc: tr('Đao uống máu.', "A saber that drinks blood."), look: 'dao', fx: { atk: 30, exp: 15, tamMa: 1 } },
  {
    id: 'song_kiem',
    name: tr('Âm Dương song kiếm', "Yin-Yang Twin Swords"),
    icon: true,
    slot: 'vu_khi',
    price: 700,
    minRealm: 2,
    desc: tr('Một âm một dương, công thủ vẹn toàn.', "One yin, one yang, perfect in offense and defense."),
    look: 'x',
    fx: { atk: 25, def: 10, crit: 5 },
    wpn: { k: 'song', a: '#f2f2f6', b: '#2a1f2a' },
  },
  // nhặt được
  {
    id: 'dao_phay',
    name: tr('Dao phay nhà bếp', "Kitchen cleaver"),
    icon: true,
    slot: 'vu_khi',
    price: 0,
    minRealm: 0,
    desc: tr('Đồ nghề của mẹ. Chém gì cũng ngọt.', "Mom's tool of the trade. Cuts through anything."),
    look: 'x',
    fx: { atk: 8, money: 5 },
    src: 'event',
    where: tr('Tuổi thơ', "Childhood"),
    rare: 1,
    wpn: { k: 'dao', a: '#c9ccd6', b: '#5a4128' },
  },
  {
    id: 'roi_da',
    name: tr('Roi da trâu', "Buffalo-hide whip"),
    icon: true,
    slot: 'vu_khi',
    price: 0,
    minRealm: 0,
    desc: tr('Roi chăn trâu, quất kêu đét đét.', "A buffalo-herding whip that cracks like thunder."),
    look: 'x',
    fx: { atk: 6, flee: 10 },
    src: 'event',
    where: tr('Tuổi thơ, kiếm tiền', "Childhood, earning money"),
    rare: 1,
    wpn: { k: 'roi', a: '#6a4a2a', b: '#3e2a18' },
  },
  {
    id: 'can_cau',
    name: tr('Cần câu Khương Tử Nha', "Jiang Ziya's fishing rod"),
    icon: true,
    slot: 'vu_khi',
    price: 0,
    minRealm: 0,
    desc: tr('Câu thẳng không mồi, kẻ nguyện mắc câu.', "Straight hook, no bait - only the willing get caught."),
    look: 'x',
    fx: { tamCanh: 2, drop: 15, cult: 5 },
    src: 'event',
    where: tr('Du ngoạn', "Wander"),
    rare: 2,
    wpn: { k: 'can', a: '#9aaa5a', b: '#f2f2f6' },
  },
  {
    id: 'kiem_gay',
    name: tr('Kiếm gãy vô danh', "Nameless broken sword"),
    icon: true,
    slot: 'vu_khi',
    price: 0,
    minRealm: 0,
    desc: tr('Kiếm gãy cắm trên mộ cổ. Vẫn còn kiếm ý.', "A broken sword stuck in an ancient grave. Its sword intent lingers."),
    look: 'x',
    fx: { atk: 22, crit: 12 },
    src: 'event',
    where: tr('Du ngoạn, tu luyện', "Wander, cultivate"),
    rare: 2,
    wpn: { k: 'kiem', a: '#8a96a8', b: '#3e3228' },
  },
  // quái rơi
  {
    id: 'lang_nha_dao',
    name: tr('Lang Nha đao', "Wolf Fang Saber"),
    icon: true,
    slot: 'vu_khi',
    price: 0,
    minRealm: 0,
    desc: tr('Răng sói mài thành lưỡi đao.', "Wolf fangs ground into a blade."),
    look: 'x',
    fx: { atk: 15, crit: 5 },
    src: 'drop',
    from: ['soi_xam', 'heo_rung'],
    rare: 1,
    wpn: { k: 'dao', a: '#f2f2f6', b: '#7d8590' },
  },
  {
    id: 'nhu_y_con',
    name: tr('Như Ý côn', "Ruyi Staff"),
    icon: true,
    slot: 'vu_khi',
    price: 0,
    minRealm: 0,
    desc: tr('Cướp được từ Ác Hầu. Dài ngắn tùy ý.', "Taken from the Wicked Ape. Grows long or short at will."),
    look: 'x',
    fx: { atk: 15, flee: 15, drop: 10 },
    src: 'drop',
    from: ['khi_ac'],
    rare: 2,
    wpn: { k: 'truong', a: '#c9962e', b: '#b8302a' },
  },
  {
    id: 'son_tac_dao',
    name: tr('Khai sơn đại đao', "Mountain-Splitting Saber"),
    icon: true,
    slot: 'vu_khi',
    price: 0,
    minRealm: 0,
    desc: tr('Đao của trùm sơn tặc.', "The saber of a bandit king."),
    look: 'x',
    fx: { atk: 18, money: 10 },
    src: 'drop',
    from: ['son_tac'],
    rare: 1,
    wpn: { k: 'dao', a: '#9aa6c0', b: '#8a2a1e' },
  },
  {
    id: 'doc_hat_kiem',
    name: tr('Độc Hạt kiếm', "Poison Scorpion Sword"),
    icon: true,
    slot: 'vu_khi',
    price: 0,
    minRealm: 0,
    desc: tr('Tẩm độc ong chúa, trúng là tê liệt.', "Laced with queen-wasp venom; one hit paralyzes."),
    look: 'x',
    fx: { atk: 15, crit: 15 },
    src: 'drop',
    from: ['bo_cap', 'thich_khach'],
    rare: 2,
    wpn: { k: 'kiem', a: '#7ad85a', b: '#5a1a1a' },
  },
  {
    id: 'thiet_quyen',
    name: tr('Thiết chưởng thủ sáo', "Iron Palm gauntlets"),
    icon: true,
    slot: 'vu_khi',
    price: 0,
    minRealm: 0,
    desc: tr('Găng sắt của bang chủ Thiết Chưởng.', "Iron gloves of the Iron Palm Gang leader."),
    look: 'x',
    fx: { atk: 22, def: 12 },
    src: 'drop',
    from: ['thiet_chuong'],
    rare: 2,
    wpn: { k: 'quyen', a: '#5a5a6a', b: '#c9962e' },
  },
  {
    id: 'van_doc_phien',
    name: tr('Vạn Độc phiến', "Myriad Poison Fan"),
    icon: true,
    slot: 'vu_khi',
    price: 0,
    minRealm: 0,
    desc: tr('Phẩy một cái, độc bay mười dặm.', "One wave and poison flies ten miles."),
    look: 'x',
    fx: { atk: 22, crit: 10, dan: 30 },
    src: 'drop',
    from: ['doc_vuong'],
    rare: 2,
    wpn: { k: 'quat', a: '#9ff0c8', b: '#9a3ad0' },
  },
  {
    id: 'cuong_dao',
    name: tr('Cuồng Đao', "Mad Saber"),
    icon: true,
    slot: 'vu_khi',
    price: 0,
    minRealm: 0,
    desc: tr('Đao chưa ra khỏi vỏ đã có người chết.', "Men die before it even leaves the sheath."),
    look: 'x',
    fx: { atk: 40, def: -10 },
    src: 'drop',
    from: ['cuong_dao'],
    rare: 3,
    wpn: { k: 'dao', a: '#e0e4ee', b: '#8a1a24' },
  },
  {
    id: 'huyet_liem',
    name: tr('Huyết Ma liêm', "Blood Demon Scythe"),
    icon: true,
    slot: 'vu_khi',
    price: 0,
    minRealm: 0,
    lean: 'ta',
    desc: tr('Lưỡi hái gặt mạng người.', "A scythe that reaps lives."),
    look: 'x',
    fx: { atk: 35, exp: 25, tamMa: 2 },
    src: 'drop',
    from: ['huyet_ma'],
    rare: 3,
    wpn: { k: 'liem', a: '#c0202e', b: '#1e1a24' },
  },
  {
    id: 'bang_giao_thuong',
    name: tr('Băng Giao thương', "Ice Jiao Spear"),
    icon: true,
    slot: 'vu_khi',
    price: 0,
    minRealm: 0,
    desc: tr('Mũi thương đóng băng máu kẻ địch.', "Its tip freezes the enemy's blood."),
    look: 'x',
    fx: { atk: 30, def: 15 },
    src: 'drop',
    from: ['bang_giao', 'ngan_giac'],
    rare: 3,
    wpn: { k: 'thuong', a: '#b4e0ff', b: '#4a9ad0' },
  },
  {
    id: 'vo_danh_kiem',
    name: tr('Vô Danh kiếm', "Nameless Sword"),
    icon: true,
    slot: 'vu_khi',
    price: 0,
    minRealm: 0,
    desc: tr('Kiếm của Kiếm Si. Chưa từng thua.', "The sword of the Sword Fanatic. Never lost a fight."),
    look: 'x',
    fx: { atk: 45, crit: 15, cult: 10 },
    src: 'drop',
    from: ['kiem_si'],
    rare: 3,
    wpn: { k: 'kiem', a: '#ffffff', b: '#3d6fb0' },
  },
  {
    id: 'hoa_lan_cung',
    name: tr('Hỏa Lân cung', "Fire Qilin Bow"),
    icon: true,
    slot: 'vu_khi',
    price: 0,
    minRealm: 0,
    desc: tr('Tên bắn ra cháy thành lửa.', "Its arrows burst into flame."),
    look: 'x',
    fx: { atk: 30, crit: 12, flee: 15 },
    src: 'drop',
    from: ['ky_lan', 'dai_bang'],
    rare: 3,
    wpn: { k: 'cung', a: '#e0502a', b: '#ffd36b' },
  },

  // ======== Phụ kiện ========
  { id: 'ngoc_boi', name: tr('Ngọc bội hộ thân', "Protective jade pendant"), icon: true, slot: 'phu_kien', price: 120, minRealm: 0, desc: tr('Đỡ một lần chí mạng.', "Blocks one fatal blow."), look: 'ngoc' },
  { id: 'ho_lo', name: tr('Hồ lô rượu', "Wine gourd"), icon: true, slot: 'phu_kien', price: 80, minRealm: 0, desc: tr('Ung dung tự tại.', "Carefree and at ease."), look: 'holo', fx: { tamCanh: 1, hp: 5 } },
  { id: 'kiem_bay', name: tr('Bản mệnh phi kiếm', "Natal flying sword"), icon: true, slot: 'phu_kien', price: 1400, minRealm: 3, path: 'kiem', desc: tr('Kiếm bay vòng quanh chủ.', "A sword that circles its master."), look: 'kiembay', fx: { cult: 20, atk: 25 } },
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
  atk: tr('Công', "Attack"),
  def: tr('Thủ', "Defense"),
  hp: tr('Máu', "HP"),
  crit: tr('Bạo kích', "Crit"),
  flee: tr('Rút lui', "Flee"),
  cult: tr('Tu luyện', "Cultivate"),
  exp: tr('Tu vi trảm yêu', "Demon-slaying cultivation"),
  drop: tr('Rơi đồ', "Drops"),
  money: tr('Kiếm tiền', "Earn money"),
  dan: tr('Luyện đan', "Alchemy"),
  tamCanh: tr('Tâm cảnh/năm', "Mind/yr"),
  tamMa: tr('Tâm ma/năm', "Heart demon/yr"),
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
  { id: 'tu_khi', name: tr('Tụ Khí Đan', "Qi Gathering Pill"), icon: true, price: 30, desc: tr('+tu vi ngay. Mỗi năm chỉ viên đầu đủ dược lực', "+cultivation now. Only the first pill each year has full potency") },
  { id: 'truc_co', name: tr('Trúc Cơ Đan', "Foundation Pill"), icon: true, price: 200, desc: tr('Tăng tỉ lệ đột phá đại cảnh giới', "Raises major breakthrough odds") },
  { id: 'dien_tho', name: tr('Diên Thọ Đan', "Longevity Pill"), icon: true, price: 500, desc: tr('+thọ nguyên. Uống nhiều thì kháng dược, mua nhiều thì đắt dần', "+lifespan. Tolerance builds with use, price climbs with each purchase") },
  { id: 'thanh_tam', name: tr('Thanh Tâm Đan', "Clear Heart Pill"), icon: true, price: 90, desc: tr('-tâm ma', "-heart demon") },
  { id: 'hoi_xuan', name: tr('Hồi Xuân Đan', "Spring Revival Pill"), icon: true, price: 60, desc: tr('Hồi sức khỏe', "Restores health") },
  { id: 'huyet_sat', name: tr('Huyết Sát Đan', "Blood Fiend Pill"), icon: true, price: 50, desc: tr('Tà tu: -tâm ma mạnh, đổi bằng máu. Chính đạo uống vào thì tâm ma tăng', "Evil cultivators: strong -heart demon, paid for in blood. Righteous drinkers get more heart demon") },
];

/** Giá đồ phường thị (3.1.0): đắt theo cảnh giới người mua; đồ Luyện Hư, Độ Kiếp mỗi kiếp chỉ bán một lần mỗi món */
export const itemPrice = (c: { realm: number }, it: { price: number }) => Math.round(it.price * (1 + 0.25 * c.realm));
export const RARE_STOCK_REALM = 6;
export const soldOut = (c: { bought?: string[] }, it: { id: string; minRealm: number }) => it.minRealm >= RARE_STOCK_REALM && (c.bought ?? []).includes(it.id);
/** Quá độ (3.1.0): số năm làm liền một việc mới bắt đầu nguy hiểm, tăng theo cảnh giới. Tu luyện không tính quá độ. */
export function safeYears(c: { realm: number; cosmos?: string | null }): number {
  if (c.cosmos || c.realm >= 8) return 40;
  return c.realm >= 6 ? 20 : c.realm >= 4 ? 15 : c.realm >= 2 ? 10 : 6;
}
export const overworkFree = (focus: string | null | undefined) => focus === 'tu_luyen';

/** Kiếm tiền, luyện đan liên tục nhiều năm thì thu ít dần (n = số năm đã làm liền trước đó) */
export const grindMul = (n: number) => [1, 0.9, 0.8, 0.65, 0.5][n] ?? 0.4;

/** Thọ nguyên Diên Thọ Đan thêm, theo số viên đã uống trong kiếp: kháng dược dần */
export const DIEN_THO_YEARS = [8, 6, 4, 2];
export const dienThoYears = (used: number) => DIEN_THO_YEARS[used] ?? 1;

/** Giá đan ở phường thị: Tụ Khí, Trúc Cơ đắt theo cảnh giới; Diên Thọ đắt thêm 50% mỗi viên đã mua trong kiếp */
export function pillPrice(c: { realm: number; pillBuy?: Record<string, number> }, id: string): number {
  const base = PILLS.find((p) => p.id === id)?.price ?? 0;
  if (id === 'tu_khi' || id === 'truc_co') return base * (c.realm + 1);
  if (id === 'dien_tho') return Math.round(base * (1 + 0.5 * (c.pillBuy?.dien_tho ?? 0)));
  return base;
}

export const TALENTS: Talent[] = [
  { id: 'ky_uc', name: tr('Ký ức tiền kiếp', "Past-life memories"), desc: tr('Ngộ tính khởi đầu +20', "Starting Insight +20"), cost: 30 },
  { id: 'linh_can', name: tr('Nghịch thiên cải mệnh', "Defy fate"), desc: tr('Linh căn ít nhất là Huyền linh căn', "Spiritual root at least Mystic"), cost: 60 },
  { id: 'tho', name: tr('Trường thọ huyết mạch', "Longevity bloodline"), desc: tr('Thọ nguyên +20%', "Lifespan +20%"), cost: 45 },
  { id: 'gia_tai', name: tr('Đầu thai nhà giàu', "Born rich"), desc: tr('Khởi đầu thêm 300 linh thạch', "Start with 300 extra spirit stones"), cost: 25 },
  { id: 'phuc', name: tr('Phúc tinh chiếu mệnh', "Lucky star"), desc: tr('Khí vận khởi đầu +25', "Starting Luck +25"), cost: 40 },
  { id: 'kiem_tam', name: tr('Kiếm tâm thông minh', "Sword-heart prodigy"), desc: tr('Sinh ra đã có Mộc kiếm, du ngoạn an toàn hơn', "Born with a Wooden sword, safer wandering"), cost: 20 },
  { id: 'ho_than', name: tr('Ngọc bội hộ thân', "Protective jade pendant"), desc: tr('Sinh ra đã đeo ngọc bội, đỡ được một lần chết', "Born wearing a jade pendant that blocks one death"), cost: 35 },
  { id: 'linh_thu', name: tr('Linh thú bầu bạn', "Spirit beast companion"), desc: tr('Một linh thú hiếm theo bạn từ lúc lọt lòng', "A rare spirit beast follows you from birth"), cost: 50 },
  { id: 'van_kiep', name: tr('Vạn kiếp bất diệt', "Undying through ages"), desc: tr('Trời thương như kiếp đầu: trước 16 tuổi không chết', "Heaven pities you as in your first life: no death before 16"), cost: 70 },
  { id: 'thien_menh', name: tr('Thiên mệnh chi tử', "Child of destiny"), desc: tr('Khí vận tối đa, linh căn biến dị, đột phá dễ hơn 10%', "Max Luck, mutated spiritual root, breakthroughs 10% easier"), cost: 180 },
  { id: 'tien_cot', name: tr('Tiên cốt trời sinh', "Born immortal bones"), desc: tr('Chắc chắn mang Thiên linh căn, tu luyện nhanh hơn hẳn', "Guaranteed Heavenly Spiritual Root, much faster cultivation"), cost: 250 },
  // thiên phú của tà đạo, trả bằng nghiệp lực
  { id: 'ta_huyet', name: tr('Huyết mạch ma tộc', "Demon bloodline"), desc: tr('Sinh ra đã nghiêng về tà (đạo tâm -30), ngộ tính +10', "Born leaning evil (Dao Heart -30), Insight +10"), cost: 30, ta: true },
  { id: 'ta_dao', name: tr('Huyết Ma Đao chờ chủ', "Blood Demon Saber awaits"), desc: tr('Huyết Ma Đao nằm sẵn trong túi, đủ Trúc Cơ là cầm được', "The Blood Demon Saber waits in your bag, usable at Foundation"), cost: 40, ta: true },
  { id: 'ta_kien', name: tr('Ma tâm kiên cố', "Iron demonic heart"), desc: tr('Tâm ma tăng chậm hơn 35% suốt kiếp này', "Heart demons grow 35% slower this life"), cost: 45, ta: true },
  { id: 'ta_cong', name: tr('Ma công nhập thể', "Demonic arts in the body"), desc: tr('Linh căn mạnh hơn 20%, đổi lại tâm ma khởi đầu +10', "Spiritual root 20% stronger, but starting heart demon +10"), cost: 50, ta: true },
  { id: 'ta_hon', name: tr('Oan hồn hộ thể', "Vengeful ghost guardian"), desc: tr('Oan hồn kiếp trước đỡ cho một lần chết', "A vengeful ghost from a past life blocks one death"), cost: 70, ta: true },
  { id: 'ta_ton', name: tr('Ma tôn chuyển thế', "Reincarnated Demon Sovereign"), desc: tr('Đạo tâm -60, khí vận +15, tu luyện nhanh hơn 15%', "Dao Heart -60, Luck +15, cultivation 15% faster"), cost: 120, ta: true },
];

export const SEASONS = [tr('Xuân', "Spring"), tr('Hạ', "Summer"), tr('Thu', "Autumn"), tr('Đông', "Winter")];

/** Màu tóc bẩm sinh. w = độ hiếm */
export const HAIR_COLORS: Record<string, { name: string; hex: string; w: number; yeu?: boolean }> = {
  den: { name: tr('đen tuyền', "jet-black"), hex: '#2a1f3d', w: 42 },
  nau: { name: tr('nâu sẫm', "dark brown"), hex: '#4a2e22', w: 20 },
  hat_de: { name: tr('màu hạt dẻ', "chestnut"), hex: '#7a4a2a', w: 12 },
  do: { name: tr('đỏ rượu', "wine-red"), hex: '#8a2a1e', w: 8 },
  lam: { name: tr('lam đen', "blue-black"), hex: '#2a3a6a', w: 7 },
  tim: { name: tr('tím than', "charcoal-purple"), hex: '#5a2a6a', w: 4 },
  bac: { name: tr('bạc trắng từ lúc lọt lòng', "silver-white since birth"), hex: '#c8ccd8', w: 3 },
  hoa_ly: { name: tr('cam lửa hồ ly', "fox-fire orange"), hex: '#c96a2a', w: 6, yeu: true },
  tuyet_ly: { name: tr('trắng tuyết hồ ly', "fox snow-white"), hex: '#eceaf2', w: 3, yeu: true },
};

export const HAIR_STYLES = {
  nam: [
    tr('búi tóc cao', "a high topknot"),
    tr('tóc buộc dài sau gáy', "long hair tied at the nape"),
    tr('tóc dài xõa vai', "long hair over the shoulders"),
    tr('tóc dài rối kiểu lãng tử', "long, messy wanderer's hair"),
    tr('tóc buộc thấp', "a low ponytail"),
    tr('tóc dài buộc khăn', "long hair wrapped in a headband"),
    tr('tóc dài rẽ ngôi lệch', "long hair parted to the side"),
    tr('tóc bù xù', "a wild mop of hair"),
    tr('tóc rẽ ngôi giữa', "hair parted in the middle"),
    tr('đầu cạo trọc', "a shaved head"),
    tr('đầu cạo sát', "a close-cropped head"),
    tr('đầu hói đỉnh', "a bald crown"),
  ],
  nu: [
    tr('tóc dài buông xõa', "long flowing hair"),
    tr('búi đôi', "twin buns"),
    tr('đuôi ngựa cao', "a high ponytail"),
    tr('tóc tết bím dài', "a long braid"),
    tr('búi tóc cung đình', "a palace-style bun"),
    tr('một bím tóc', "a single braid"),
    tr('nửa búi nửa xõa', "a half-up, half-down style"),
    tr('búi tóc có mái', "a bun with bangs"),
    tr('tóc dài gợn sóng', "long wavy hair"),
    tr('hai bím tóc', "two braids"),
    tr('tóc dài suôn thẳng', "long straight hair"),
    tr('tóc dài mái rủ', "long hair with bangs"),
    tr('tóc dài rẽ ngôi giữa', "long hair parted in the middle"),
    tr('tóc buông lơi', "loose hair"),
    tr('tóc vắt một bên vai', "hair swept over one shoulder"),
    tr('tóc dài rẽ ngôi lệch', "long hair parted to the side"),
  ],
};

/** Thọ mệnh bẩm sinh */
export const LIFE_FATES = [
  { name: tr('đoản thọ', "short-lived"), lo: 0.6, hi: 0.82, w: 18 },
  { name: tr('thọ mệnh bình thường', "an ordinary lifespan"), lo: 0.88, hi: 1.12, w: 62 },
  { name: tr('trường thọ', "long-lived"), lo: 1.18, hi: 1.45, w: 20 },
];

/** Vùng đất nơi sinh, mỗi vùng có ảnh hưởng riêng */
export const REGIONS = [
  { id: 'thanh_chau', name: tr('Thanh Châu', "Qingzhou"), desc: tr('đồng bằng trù phú', "fertile plains"), w: 22, places: [tr('thôn Hạnh Hoa', "Xinghua Village"), tr('trấn Lạc Hà', "Luo He Town"), tr('làng Đào Nguyên', "Taoyuan Village"), tr('bến Thanh Thủy', "Qingshui Pier")], mod: { money: 1.3 } },
  { id: 'trung_chau', name: tr('Trung Châu', "Zhongzhou"), desc: tr('đất kinh kỳ phồn hoa', "the bustling imperial heartland"), w: 12, places: [tr('kinh thành Thiên Khải', "Tianqi Capital"), tr('phủ Vạn An', "Wanan Prefecture"), tr('phố Tây Thị', "Xishi Street")], mod: { money: 1.8, tamMa: 6 } },
  { id: 'bac_mac', name: tr('Bắc Mạc', "Beimo"), desc: tr('sa mạc gió cát khắc nghiệt', "a harsh desert of wind and sand"), w: 12, places: [tr('ốc đảo Lục Châu', "Lu Zhou Oasis"), tr('thành Hoàng Sa', "Huang Sha City"), tr('trạm ngựa Bạch Đà', "Bai Tuo Horse Station")], mod: { sucKhoe: 12, khiVan: -6 } },
  { id: 'nam_cuong', name: tr('Nam Cương', "Nanjiang"), desc: tr('rừng thiêng nhiều độc trùng', "sacred jungles full of venomous bugs"), w: 12, places: [tr('bản Miêu Cổ', "Miaogu Hamlet"), tr('trại Thạch Đầu', "Shitou Camp"), tr('động Bách Độc', "Baidu Cave")], mod: { ngoTinh: 4, sucKhoe: -4 } },
  { id: 'dong_hai', name: tr('Đông Hải', "Donghai"), desc: tr('miền biển sóng gió', "stormy seas"), w: 14, places: [tr('làng chài Vọng Hải', "Wanghai Fishing Village"), tr('đảo Bồng Lai ngoại vi', "Outer Penglai Isle"), tr('cảng Minh Châu', "Mingzhou Port")], mod: { ngoTinh: 6 } },
  { id: 'tay_vuc', name: tr('Tây Vực', "Xiyu"), desc: tr('Phật quốc vạn chùa', "a Buddhist land of ten thousand temples"), w: 10, places: [tr('thành Đại Lôi Âm', "Dalei Yin City"), tr('chùa Tu Di', "Tu Di Temple"), tr('làng Tháp Trắng', "Tabai Village")], mod: { daoTam: 12, tamCanh: 6 } },
  { id: 'tuyet_vuc', name: tr('Tuyết Vực', "Xueyu"), desc: tr('băng nguyên ngàn năm tuyết phủ', "a thousand-year frozen plain"), w: 8, places: [tr('bộ lạc Băng Lang', "Binglang Tribe"), tr('thành Hàn Nguyệt', "Han Yue City")], mod: { lifeMul: 1.06, khiVan: -3 } },
  { id: 'ma_vuc', name: tr('Ma Vực', "Moyu"), desc: tr('vùng đất ma khí bao phủ', "a land shrouded in demonic qi"), w: 6, places: [tr('thành Huyết Nguyệt', "Xueyue City"), tr('trấn Hắc Thủy', "Heishui Town")], mod: { daoTam: -15, ngoTinh: 6, tamMa: 10 } },
  { id: 'van_yeu', name: tr('Vạn Yêu Lâm', "Wanyao Forest"), desc: tr('rừng của yêu tộc', "the forest of the yao race"), w: 0, places: [tr('hang Thanh Khâu', "Qingqiu Cave"), tr('cây Thiên Niên Tùng', "Tiannian Song Tree")], mod: {} },
] as const;

/** Gia cảnh lúc sinh: tiền khởi đầu và tiền gia đình chu cấp mỗi năm đến 16 tuổi */
export const FAMILY_TIERS = [
  { name: tr('bần hàn', "destitute"), money: 3, allowance: 0, w: 30 },
  { name: tr('bình dân', "a commoner"), money: 20, allowance: 3, w: 38 },
  { name: tr('khá giả', "well-off"), money: 90, allowance: 10, w: 20 },
  { name: tr('phú hộ', "wealthy"), money: 320, allowance: 30, w: 9 },
  { name: tr('đại phú', "immensely rich"), money: 1200, allowance: 80, w: 3 },
];
