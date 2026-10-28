import type { Character, Meta } from './types';
import { tr } from '../i18n';

/**
 * Luân Hồi Đạo (bản 3.0.0): làm cho việc chết nhiều không còn là lợi thế.
 * - Kiếp Số: tài khoản càng nhiều thành tích, Thiên đạo càng để mắt. Mỗi bậc khó hơn nhưng thưởng nhiều hơn.
 * - Hồn lực: linh hồn hao mòn mỗi lần đầu thai, hồi theo giờ thật. Đầu thai dồn dập thì sinh ra yếu.
 * - Chén canh Mạnh Bà: uống thì quên (mất thần binh, rương), được tĩnh tâm hạ Kiếp Số; không uống thì nghiệp dồn lại.
 * - Kiếp tích: người Kiếp Số thấp chết ở Độ Kiếp thì kiếp sau đột phá dễ hơn.
 */

export const KS_MAX = 10;
/** Từ kiếp thứ mấy thì Hồn lực và chén canh Mạnh Bà bắt đầu có hiệu lực */
export const LH_FROM_LIFE = 15;

const BOOK2 = ['chuong_11', 'manh_khac', 'truyen_cong', 'loi_vieng', 'chien_thu', 'ba_coi', 'guong_lanh', 'so_day', 'ke_go_chuong', 'chuong_vo'];
const BOOK1 = ['chuong', 'mat', 'kim_dan', 'so_sinh_tu', 'an_oan', 'hoa_than', 'phi_thang', 'hai_duong', 'nua_so', 'dinh'];

export interface KsPart {
  label: string;
  pts: number;
  max: number;
}

/** Kiếp Số gốc: chỉ tăng, tính từ thành tích của tài khoản */
export function ksParts(m: Meta | null | undefined): KsPart[] {
  if (!m) return [];
  const lore = new Set(m.lore ?? []);
  const b1 = BOOK1.every((id) => lore.has(id));
  const b2 = BOOK2.filter((id) => lore.has(id)).length;
  const k = m.career;
  const e = m.endings ?? {};
  return [
    { label: tr('Mỗi 15 kiếp đã sống', "Every 15 lives lived"), pts: Math.min(3, Math.floor((m.lives ?? 0) / 15)), max: 3 },
    { label: tr('Gom đủ Thiên thư Quyển I', "Complete Heavenly Tome Volume I"), pts: b1 ? 1 : 0, max: 1 },
    { label: tr('Mỗi 3 mảnh Thiên thư Quyển II', "Every 3 fragments of Heavenly Tome Volume II"), pts: Math.min(3, Math.floor(b2 / 3)), max: 3 },
    { label: tr('Từng phi thăng', "Has ascended"), pts: (k?.ascPaths?.length ?? 0) > 0 || (k?.maxRealm ?? 0) >= 8 ? 1 : 0, max: 1 },
    { label: tr('Từng tới cảnh giới cuối của một cõi', "Has reached the final realm of a world"), pts: (k?.maxRealm ?? 0) >= 11 ? 1 : 0, max: 1 },
    { label: tr('Từng Chứng Đạo', "Has attained the Yao"), pts: e.chung_dao ? 1 : 0, max: 1 },
  ];
}

export const ksBase = (m: Meta | null | undefined) => Math.min(KS_MAX, ksParts(m).reduce((a, p) => a + p.pts, 0));
/** Kiếp Số hiệu lực: trừ đi tĩnh tâm do uống canh Mạnh Bà */
export const ksOf = (m: Meta | null | undefined) => Math.max(0, ksBase(m) - (m?.tinhTam ?? 0));

/** Điều khó của từng bậc (cộng dồn) */
export const KS_TIERS: { lv: number; hard: string }[] = [
  { lv: 1, hard: tr('Thiên kiếp nặng hơn: đột phá khó hơn 4%', "Heavier tribulations: breakthroughs 4% harder") },
  { lv: 2, hard: tr('Thần binh truyền kiếp mỗi đời chỉ thêm 6% công (thay vì 8%)', "Inherited divine weapons gain only 6% attack per life (instead of 8%)") },
  { lv: 3, hard: tr('Bóng ở Ngũ Hành Đài mạnh thêm 5%', "Shadows at the Five Elements Platform are 5% stronger") },
  { lv: 4, hard: tr('Quái hung hơn 10%', "Monsters are 10% fiercer") },
  { lv: 5, hard: tr('Mỗi kiếp chỉ mua được một thiên phú lớn (Tiên cốt hoặc Thiên mệnh)', "Only one major talent per life can be bought (Immortal Bones or Heavenly Mandate)") },
  { lv: 6, hard: tr('Thiên kiếp nặng thêm: đột phá khó hơn 8%', "Even heavier tribulations: breakthroughs 8% harder") },
  { lv: 7, hard: tr('Bóng ở Ngũ Hành Đài mạnh thêm 5% (tổng 10%)', "Shadows at the Five Elements Platform are 5% stronger (10% total)") },
  { lv: 8, hard: tr('Sau phi thăng, mỗi tầng chậm thêm 2 năm', "After Ascension, each layer takes 2 more years") },
  { lv: 9, hard: tr('Kẻ Gõ Chuông khó đỡ hơn', "The Bell Ringer is harder to withstand") },
  { lv: 10, hard: tr('Tâm ma dâng nhanh hơn 20%', "Heart demons rise 20% faster") },
];

/** Tên gọi từng bậc, cho có vị kiếm hiệp */
export const KS_NAME = [tr('Vô danh', "Nameless"), tr('Lộ diện', "Noticed"), tr('Có tiếng', "Known"), tr('Thành danh', "Renowned"), tr('Kinh động', "Stirring"), tr('Chấn động', "Earth-shaking"), tr('Thiên đạo chú ý', "Watched by the Heavenly Yao"), tr('Thiên đạo kiêng dè', "Feared by the Heavenly Yao"), tr('Thiên đạo truy xét', "Hunted by the Heavenly Yao"), tr('Nghịch thiên', "Defying Heaven"), tr('Vạn kiếp bất diệt', "Undying through ten thousand lives")];

// ---------- Hiệu ứng lên nhân vật (đọc c.kiepSo, đặt lúc đầu thai) ----------
const ks = (c: Character) => c.kiepSo ?? 0;
/** Đột phá khó hơn theo bậc, cộng với kiếp tích */
export const ksBreak = (c: Character) => (ks(c) >= 6 ? -0.08 : ks(c) >= 1 ? -0.04 : 0) + (c.kiepTich ?? 0) * 0.05;
export const ksLegendPer = (c: Character) => (ks(c) >= 2 ? 0.06 : 0.08);
export const ksMirror = (c: Character) => 1 + (ks(c) >= 7 ? 0.1 : ks(c) >= 3 ? 0.05 : 0);
export const ksMonster = (c: Character | null | undefined) => (c && ks(c) >= 4 ? 1.1 : 1);
export const ksOneBig = (n: number) => n >= 5;
export const ksCosmosYears = (c: Character) => (ks(c) >= 8 ? 2 : 0);
export const ksBell = (c: Character) => (ks(c) >= 9 ? -0.1 : 0);
export const ksTamMa = (c: Character) => (ks(c) >= 10 ? 1.2 : 1);
/** Phần thưởng: phúc duyên và đồ rơi */
export const ksPhuc = (c: Character) => 1 + ks(c) * 0.05;
export const ksDrop = (c: Character | null | undefined) => 1 + (c ? ks(c) : 0) * 0.03;
export const BIG_TALENTS = ['tien_cot', 'thien_menh'];

// ---------- Hồn lực ----------
export const HON_MAX = 100;
export const HON_COST = 15;
export const HON_REGEN = 10; // mỗi giờ
const HOUR = 3600_000;

export function honNow(m: Meta | null | undefined, now: number): number {
  const h = m?.hon;
  if (!h) return HON_MAX;
  return Math.min(HON_MAX, h.v + Math.max(0, (now - h.at) / HOUR) * HON_REGEN);
}
/**
 * Đan hồi hồn, mua bằng phúc duyên ở màn đầu thai. Ba phẩm, phẩm càng cao càng đắt theo tỉ lệ
 * (đan nhỏ lời nhất, đan lớn tiện nhất). Mỗi ngày (giờ VN) 3 viên đầu giá gốc, gộp mọi phẩm;
 * từ viên thứ 4 mỗi viên đắt thêm 50% so với viên trước, người nghiện vẫn chơi tiếp được nhưng tốn phúc mạnh.
 * Mốc giá: một kiếp bình thường cho khoảng 30-50 phúc duyên, một lần đầu thai tốn 15 Hồn lực.
 */
export const HON_PILLS = [
  { id: 'tu_hon', name: tr('Tụ Hồn Đan', "Soul Gathering Pill"), grade: tr('Hạ phẩm', "Low grade"), gain: 20, cost: 20, icon: 'thanh_tam' },
  { id: 'duong_hon', name: tr('Dưỡng Hồn Đan', "Soul Nurturing Pill"), grade: tr('Trung phẩm', "Mid grade"), gain: 45, cost: 55, icon: 'hoi_xuan' },
  { id: 'hoan_hon', name: tr('Hoàn Hồn Đan', "Soul Return Pill"), grade: tr('Thượng phẩm', "High grade"), gain: 100, cost: 140, icon: 'dien_tho' },
] as const;
export type HonPillId = (typeof HON_PILLS)[number]['id'];
/** Số viên giá gốc mỗi ngày; sau đó giá nhân HON_PILL_STEP mỗi viên */
export const HON_PILL_FREE = 3;
export const HON_PILL_STEP = 1.5;
/** Mỗi nhiệm vụ ngày hoàn thành hồi thêm Hồn lực */
export const QUEST_HON = 10;
const vnDate = (now: number) => new Date(now).toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
/** Số viên đã dùng hôm nay */
export function honPillUsed(m: Meta | null | undefined, now: number): number {
  const p = m?.honPill;
  return p && p.day === vnDate(now) ? p.n : 0;
}
/** Giá viên kế tiếp của một phẩm đan, theo số viên đã dùng hôm nay */
export function honPillCost(base: number, used: number, danTu = false): number {
  const over = Math.max(0, used - HON_PILL_FREE + 1);
  return Math.round((base * Math.pow(HON_PILL_STEP, over) * (danTu ? DAN_TU_DISCOUNT : 1)) / 5) * 5;
}
/** 3.2.0: kiếp trước là Đan tu thì đan hồi hồn rẻ hơn 30% */
export const DAN_TU_DISCOUNT = 0.7;
export const pastDanTu = (m: Meta | null | undefined) => {
  const p = m?.past?.path;
  return p === 'dan' || p === 'Đan tu' || p === 'Alchemist';
};
/** Cộng Hồn lực (không quá tối đa), tính từ mức hiện tại */
export function addHon(m: Meta, amount: number, now: number): Meta {
  return { ...m, hon: { v: Math.min(HON_MAX, honNow(m, now) + amount), at: now } };
}
export const honDay = vnDate;
/** Số giờ tới khi hồi đầy */
export const honFullIn = (v: number) => Math.max(0, Math.ceil(((HON_MAX - v) / HON_REGEN) * 10) / 10);
export const honActive = (m: Meta | null | undefined) => (m?.lives ?? 0) + 1 >= LH_FROM_LIFE;

export type HonState = 'ven' | 'moi' | 'khuyet' | 'tan';
export const honState = (v: number): HonState => (v >= 70 ? 'ven' : v >= 40 ? 'moi' : v >= 20 ? 'khuyet' : 'tan');
export const HON_TEXT: Record<HonState, { name: string; fx: string; log: string }> = {
  ven: { name: tr('Hồn vẹn', "Whole soul"), fx: tr('Bình thường', "Normal"), log: '' },
  moi: { name: tr('Hồn mỏi', "Weary soul"), fx: tr('Ngộ tính -5, khí vận -5', "Insight -5, Luck -5"), log: tr('Hồn phách còn mỏi sau lần luân hồi trước. Đứa trẻ sinh ra hay ngẩn ngơ.', "The soul is still weary from the last reincarnation. The child is born dazed and dreamy.") },
  khuyet: { name: tr('Hồn khuyết', "Damaged soul"), fx: tr('Linh căn -10%, ngộ tính -10, khí vận -10, tâm ma +10', "Spiritual root -10%, Insight -10, Luck -10, heart demon +10"), log: tr('Hồn phách chưa lành đã vội đầu thai. Đứa trẻ sinh ra yếu ớt, đêm hay giật mình.', "The soul was reborn before it had healed. The child is born frail and often starts awake at night.") },
  tan: { name: tr('Hồn tàn', "Shattered soul"), fx: tr('Linh căn -20%, thọ nguyên -10%, tâm ma +20', "Spiritual root -20%, lifespan -10%, heart demon +20"), log: tr('Hồn phách rách nát vì luân hồi quá dồn dập. Bà đỡ lắc đầu: "Đứa nhỏ này mang hồn già."', "The soul is in tatters from reincarnating too fast. The midwife shakes her head: \"This little one carries an old soul.\"") },
};

/** Áp trạng thái hồn lên đứa trẻ vừa sinh */
export function applyHon(c: Character, v: number, fullRest: boolean) {
  const s = honState(v);
  const cl = (k: keyof Character['stats'], d: number) => (c.stats[k] = Math.max(0, Math.min(100, c.stats[k] + d)));
  if (s === 'moi') {
    cl('ngoTinh', -5);
    cl('khiVan', -5);
  } else if (s === 'khuyet') {
    c.linhCanMul = Math.round(c.linhCanMul * 0.9 * 100) / 100;
    cl('ngoTinh', -10);
    cl('khiVan', -10);
    cl('tamMa', 10);
  } else if (s === 'tan') {
    c.linhCanMul = Math.round(c.linhCanMul * 0.8 * 100) / 100;
    c.lifespan = Math.round(c.lifespan * 0.9);
    cl('tamMa', 20);
  }
  if (HON_TEXT[s].log) c.log.push({ age: 0, tone: 'bad', text: `${HON_TEXT[s].name}. ${HON_TEXT[s].log}` });
  if (fullRest && s === 'ven') {
    cl('khiVan', 5);
    c.log.push({ age: 0, tone: 'good', text: tr('Hồn viên mãn: linh hồn đã nghỉ ngơi đủ lâu trước khi đầu thai. Khí vận +5.', "Perfect soul: it rested long enough before rebirth. Luck +5.") });
  }
}

// ---------- Chén canh Mạnh Bà ----------
export const TINH_TAM_MAX = 3;
export const CAU_HON_AT = 5; // không uống bao nhiêu lần liên tiếp thì bị Câu hồn sứ giả truy

/** Cập nhật hồ sơ theo lựa chọn ở cầu Nại Hà. Trả về hồ sơ mới. */
export function manhBa(m: Meta, drink: boolean): Meta {
  if (drink) {
    return { ...m, legend: null, stash: null, tinhTam: Math.min(TINH_TAM_MAX, (m.tinhTam ?? 0) + 1), noDrink: 0, ttDecay: 0 };
  }
  const nd = (m.noDrink ?? 0) + 1;
  const dec = (m.ttDecay ?? 0) + 1;
  // tĩnh tâm tự phai sau mỗi 2 kiếp không uống
  const fade = dec >= 2 && (m.tinhTam ?? 0) > 0;
  return { ...m, noDrink: nd, ttDecay: fade ? 0 : dec, tinhTam: fade ? (m.tinhTam ?? 0) - 1 : m.tinhTam };
}

/** Kiếp tích: chỉ người Kiếp Số hiệu lực từ 2 trở xuống, chết ở Độ Kiếp mà chưa phi thăng */
export function nextKiepTich(m: Meta, c: Character): number {
  if (c.ascended || c.cosmos) return 0;
  if (c.realm === 7 && ksOf(m) <= 2) return Math.min(3, (m.kiepTich ?? 0) + 1);
  return m.kiepTich ?? 0;
}
