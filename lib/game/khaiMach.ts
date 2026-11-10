/**
 * 4.5.0 Tam Tài: Thân (10 đại huyệt) + Khí (5 hành) + Đạo (27 đạo). Tổng 42 dấu.
 * - Huyệt: khai theo thứ tự, mỗi kiếp tối đa 1 huyệt, xét lúc kiếp kết thúc. Ai cũng bắt đầu từ huyệt 1 kể từ 4.5.0, không tính kiếp cũ.
 *   Lợi ích của huyệt đã khai áp vào kiếp sau lúc đầu thai (applyHuyet).
 * - Hành: mỗi kiếp mang 1 bản mệnh; kiếp mệnh đó lên Hóa Thần / phi thăng / Chứng Đạo thì hành ấy sáng tầng 1/2/3. Chỉ mỹ quan.
 * - Đạo: 27 mốc chia 3 cõi (Thiên, Hồng Trần, U Minh). Mốc có dữ liệu sẵn tính cả thành tích cũ. Chỉ mỹ quan.
 * Lời dẫn lấy đúng từng chữ ở doc "Kế hoạch 4.5.0", mục "Kịch bản và lời dẫn".
 * File này không import engine để engine import được ngược lại.
 */
import type { Career, Character, Element, Meta } from './types';
import { giveItem, money, stat } from './helpers';
import { tr } from '../i18n';
import { loreDone } from './lore';

// ---------------- Thân: 10 đại huyệt ----------------

/**
 * Số lợi ích của huyệt, cân bằng bằng `HUYET=10 npx tsx scripts/sim-do-kho.ts 3000` (10/11/2026).
 * Số trong plan (linh thạch 100, sức khỏe 5, tu luyện 2%, thọ 5, tâm cảnh/ngộ tính/khí vận 5, đột phá 3%, ngọc bội lúc 16 tuổi)
 * làm tỉ lệ lên Hóa Thần tăng khoảng 10 điểm (riêng ngọc bội khoảng 4 điểm), quá trần 3 điểm, nên giảm số và thay ngọc bội
 * của Ấn Đường bằng đột phá +1% (ngoc: false). Đổi lại khi Tyler chốt.
 */
export const HUYET_SO = { stone: 50, health: 2, cult: 0.01, life: 2, tamCanh: 1, ngoTinh: 1, khiVan: 2, brk: 0.01, an: 0.01, ngoc: false };
const pc = (x: number) => `${Math.round(x * 100)}%`;

export interface Huyet {
  id: number; // 1-10
  name: string;
  tier: 'de' | 'vua' | 'kho' | 'rat_kho';
  /** thử thách, viết ngắn để ghép sau "Huyệt X: ..." */
  task: string;
  /** lợi ích, viết ngắn (dòng nhỏ ở màn cáo biệt và bảng Thân) */
  gift: string;
  /** câu khai huyệt (giọng Thiên Đạo) */
  line: string;
  check: (c: Character) => boolean;
}

/** Kiếp này đã Chứng Đạo (kể cả bước qua khe tím vào Hồng Hoang) */
export const isChungDao = (c: Character) => c.endTag === 'chung_dao' || c.cosmos === 'hg' || c.hgGate !== undefined;
/** Tuổi lúc chứng đạo (kiếp cũ chưa ghi thì lấy tuổi lúc chết) */
const cdAgeOf = (c: Character) => c.cdAge ?? Math.floor(c.age);

export const HUYET: Huyet[] = [
  {
    id: 1,
    name: tr('Dũng Tuyền', 'Yongquan'),
    tier: 'de',
    task: tr('lên Kim Đan', 'reach Golden Core'),
    gift: tr(`linh thạch khởi đầu +${HUYET_SO.stone}`, `+${HUYET_SO.stone} starting spirit stones`),
    line: tr('Gót chân đã chạm đất. Từ nay mỗi lần đầu thai, ngươi đứng vững hơn.', 'Your heels have touched the earth. From now on, every rebirth you stand a little steadier.'),
    check: (c) => c.realm >= 3,
  },
  {
    id: 2,
    name: tr('Quan Nguyên', 'Guanyuan'),
    tier: 'de',
    task: tr('sống qua 60 tuổi', 'live past 60'),
    gift: tr(`sức khỏe khởi đầu +${HUYET_SO.health}`, `+${HUYET_SO.health} starting health`),
    line: tr('Sáu mươi năm trong mộng, khí ở bụng dưới đã tụ.', 'Sixty years in the dream, and qi has gathered in your lower belly.'),
    check: (c) => c.age >= 60,
  },
  {
    id: 3,
    name: tr('Khí Hải', 'Qihai'),
    tier: 'de',
    task: tr('lên Nguyên Anh khi đang ở tông môn', 'reach Nascent Soul while in a sect'),
    gift: tr(`tu luyện +${pc(HUYET_SO.cult)}`, `+${pc(HUYET_SO.cult)} cultivation`),
    line: tr('Tông môn dạy ngươi thở. Biển khí trong thân đã mở.', 'The sect taught you to breathe. The sea of qi within you has opened.'),
    check: (c) => c.realm >= 4 && (!!c.qf?.naSect || (!!c.sect && !c.cosmos && c.realm === 4)),
  },
  {
    id: 4,
    name: tr('Mệnh Môn', 'Mingmen'),
    tier: 'vua',
    task: tr('lên Hóa Thần, có đạo lữ hoặc linh thú', 'reach Spirit Transformation with a Dao partner or spirit beast'),
    gift: tr(`thọ +${HUYET_SO.life} năm`, `+${HUYET_SO.life} years lifespan`),
    line: tr('Có kẻ cùng đi, mệnh mới dài. Cửa mệnh đã mở.', 'With someone beside you, life runs long. The gate of life has opened.'),
    check: (c) => c.realm >= 5 && (!!c.partner || !!c.pet),
  },
  {
    id: 5,
    name: tr('Trung Quản', 'Zhongwan'),
    tier: 'vua',
    task: tr('lên Luyện Hư và sống qua 200 tuổi', 'reach Void Refinement and live past 200'),
    gift: tr(`tâm cảnh +${HUYET_SO.tamCanh}`, `+${HUYET_SO.tamCanh} Mind State`),
    line: tr('Hai trăm năm ngồi yên, giữa thân đã có chỗ dựa.', 'Two hundred years of sitting still, and the middle of your body has found its anchor.'),
    check: (c) => c.realm >= 6 && c.age >= 200,
  },
  {
    id: 6,
    name: tr('Cự Khuyết', 'Juque'),
    tier: 'vua',
    task: tr('lên Độ Kiếp với đạo tâm từ 90 hoặc từ -90', 'reach Tribulation with a Dao Heart of 90 or -90'),
    gift: tr(`ngộ tính +${HUYET_SO.ngoTinh}`, `+${HUYET_SO.ngoTinh} Comprehension`),
    line: tr('Chính đến tận cùng hay tà đến tận cùng, tâm đều không còn lung lay.', 'Righteous to the very end or evil to the very end, the heart no longer wavers.'),
    check: (c) => c.realm >= 7 && Math.abs(c.daoTam) >= 90,
  },
  {
    id: 7,
    name: tr('Đản Trung', 'Danzhong'),
    tier: 'kho',
    task: tr('phi thăng', 'ascend'),
    gift: tr(`khí vận +${HUYET_SO.khiVan}`, `+${HUYET_SO.khiVan} Luck`),
    line: tr('Ngực ngươi từng chứa cả bầu trời. Giữa ngực đã sáng.', 'Your chest once held the whole sky. The center of your chest now shines.'),
    check: (c) => !!c.ascended,
  },
  {
    id: 8,
    name: tr('Thiên Đột', 'Tiantu'),
    tier: 'kho',
    task: tr('Chứng Đạo', 'attain the Dao'),
    gift: tr(`đột phá +${pc(HUYET_SO.brk)}`, `+${pc(HUYET_SO.brk)} breakthrough`),
    line: tr('Ngươi đã chạm vào đạo. Cổ họng ngươi nói được lời trời.', 'You have touched the Dao. Your throat can speak the words of heaven.'),
    check: (c) => isChungDao(c),
  },
  {
    id: 9,
    name: tr('Ấn Đường', 'Yintang'),
    tier: 'rat_kho',
    task: tr('phi thăng trước 350 tuổi', 'ascend before age 350'),
    gift: HUYET_SO.ngoc ? tr('ngọc bội hộ thân lúc 16 tuổi', 'a protective jade pendant at 16') : tr(`đột phá thêm +${pc(HUYET_SO.an)}`, `another +${pc(HUYET_SO.an)} breakthrough`),
    line: tr('Bay lên khi còn trẻ. Giữa hai mày, con mắt thứ ba hé mở.', 'Flying up while still young. Between your brows, the third eye opens a crack.'),
    check: (c) => !!c.ascended && (c.ascendAge ?? 9999) < 350,
  },
  {
    id: 10,
    name: tr('Bách Hội', 'Baihui'),
    tier: 'rat_kho',
    task: tr('Chứng Đạo trước 600 tuổi', 'attain the Dao before age 600'),
    gift: tr('chân thân thức tỉnh, danh hiệu "Khai Mạch", hào quang riêng', 'the true self awakens: title "Meridians Opened" and its own aura'),
    line: tr('Trăm mạch quy về một đỉnh. Chân thân mở mắt.', 'A hundred meridians return to one crown. The true self opens its eyes.'),
    check: (c) => isChungDao(c) && cdAgeOf(c) < 600,
  },
];

export const huyetOf = (id: number) => HUYET.find((h) => h.id === id) ?? null;
/** Số huyệt đã khai */
export const huyetCount = (meta: Pick<Meta, 'huyet'>) => meta.huyet?.length ?? 0;
/** Huyệt kế tiếp đang đợi (null khi đã khai đủ 10) */
export const nextHuyet = (meta: Pick<Meta, 'huyet'>): Huyet | null => HUYET[huyetCount(meta)] ?? null;

/** Kiếp vừa khép lại có khai được huyệt kế không. Mỗi kiếp tối đa 1 huyệt, theo thứ tự. */
export function khaiCheck(meta: Pick<Meta, 'huyet'>, c: Character): Huyet | null {
  const h = nextHuyet(meta);
  return h && h.check(c) ? h : null;
}

/** "Huyệt {tên}: {thử thách}" (chip trong kiếp, thẻ trang chủ) */
export const huyetChip = (h: Huyet) => tr(`Huyệt ${h.name}: ${h.task}`, `${h.name} point: ${h.task}`);
/** Kiếp không khai huyệt */
export const huyetWaitLine = (h: Huyet) => tr(`Mộng này chưa đủ. Huyệt ${h.name} vẫn đợi: ${h.task}.`, `This dream was not enough. The ${h.name} point still waits: ${h.task}.`);
/** Kiếp này đã đạt thử thách, chưa khép lại */
export const huyetRungLine = (h: Huyet) => tr(`Huyệt ${h.name} đã rung. Mộng tan sẽ khai.`, `The ${h.name} point is trembling. It will open when the dream ends.`);
/** Dòng lợi ích nhỏ dưới câu khai huyệt */
export const huyetGiftLine = (h: Huyet) => tr(`Huyệt ${h.name} khai: ${h.gift} từ kiếp sau`, `${h.name} point opened: ${h.gift} from next life`);

/** Áp lợi ích các huyệt đã khai vào kiếp mới (gọi trong newCharacter) */
export function applyHuyet(c: Character, meta: Pick<Meta, 'huyet' | 'chanThan'>) {
  const n = meta.chanThan ? huyetCount(meta) : 0;
  c.huyet = n;
  if (!n) return;
  const S = HUYET_SO;
  if (n >= 1) money(c, S.stone);
  if (n >= 2) stat(c, 'sucKhoe', S.health);
  if (n >= 4) {
    c.lifespan += S.life;
    c.lifeExtra = (c.lifeExtra ?? 0) + S.life;
  }
  if (n >= 5) stat(c, 'tamCanh', S.tamCanh);
  if (n >= 6) stat(c, 'ngoTinh', S.ngoTinh);
  if (n >= 7) stat(c, 'khiVan', S.khiVan);
  if (n >= 9 && S.ngoc) c.ngocBoi16 = true;
}
/** Huyệt Khí Hải: tu luyện */
export const huyetCultMul = (c: Character) => ((c.huyet ?? 0) >= 3 ? 1 + HUYET_SO.cult : 1);
/** Huyệt Thiên Đột (và Ấn Đường khi không trao ngọc bội): đột phá */
export const huyetBreak = (c: Character) => ((c.huyet ?? 0) >= 8 ? HUYET_SO.brk : 0) + ((c.huyet ?? 0) >= 9 && !HUYET_SO.ngoc ? HUYET_SO.an : 0);
/** Huyệt Ấn Đường: tới 16 tuổi nhận ngọc bội hộ thân. Trả câu ghi gia phả khi vừa trao. */
export function huyetYear(c: Character): string | null {
  if (!c.ngocBoi16 || c.age < 16) return null;
  c.ngocBoi16 = false;
  giveItem(c, 'ngoc_boi', !c.equipped.phu_kien);
  return tr('Giữa hai mày chợt ấm. Trong tay áo bạn tự nhiên có một miếng ngọc bội hộ thân.', 'A warmth blooms between your brows. A protective jade pendant appears in your sleeve.');
}

// ---------------- Khí: 5 hành ----------------

export const HANH: { id: Element; name: string; vien: string; color: string }[] = [
  { id: 'kim', name: tr('Kim', 'Metal'), vien: tr('Kim cứng mà không gãy.', 'Metal is hard yet does not break.'), color: '#e8e2c8' },
  { id: 'moc', name: tr('Mộc', 'Wood'), vien: tr('Mộc mọc lên từ tro tàn.', 'Wood grows up out of the ashes.'), color: '#6cc46a' },
  { id: 'thuy', name: tr('Thủy', 'Water'), vien: tr('Thủy chảy chỗ thấp mà tới biển.', 'Water flows to low places and so reaches the sea.'), color: '#5aa8e8' },
  { id: 'hoa', name: tr('Hỏa', 'Fire'), vien: tr('Hỏa cháy hết mình rồi thành ánh sáng.', 'Fire burns itself out and becomes light.'), color: '#ff7a3a' },
  { id: 'tho', name: tr('Thổ', 'Earth'), vien: tr('Thổ nhận hết, giữ hết.', 'Earth takes everything, keeps everything.'), color: '#c99a4a' },
];
const TANG_NAME = () => [tr('Hóa Thần', 'Spirit Transformation'), tr('phi thăng', 'ascension'), tr('Chứng Đạo', 'attaining the Dao')];
/** Tầng hành kiếp này đạt (0-3) */
export function hanhTier(c: Character): number {
  if (isChungDao(c)) return 3;
  if (c.ascended) return 2;
  if (c.realm >= 5) return 1;
  return 0;
}
/** Câu khai hành: "Mộng mệnh {Hành} đã đi tới {...}. {Hành} hành sáng tầng {n}." (+ câu viên mãn ở tầng 3) */
export function hanhLine(el: Element, n: number): string {
  const h = HANH.find((x) => x.id === el)!;
  const t = TANG_NAME()[n - 1];
  const base = tr(`Mộng mệnh ${h.name} đã đi tới ${t}. ${h.name} hành sáng tầng ${n}.`, `A ${h.name}-fated dream reached ${t}. ${h.name} shines at tier ${n}.`);
  return n >= 3 ? `${base} ${h.vien}` : base;
}
export const NGU_HANH_LINE = () => tr('Năm khí quy về một thân. Ngũ Hành Hợp Nhất.', 'Five energies return to one body. Five Elements United.');

// ---------------- Đạo: 27 đạo ----------------

export type Coi = 'thien' | 'tran' | 'minh';
export interface DaoMark {
  id: string;
  coi: Coi;
  name: string;
  hidden?: boolean; // đạo ẩn: giấu tên và cách mở
  how: string; // cách mở (ẩn thì không hiện)
  line: string; // câu ngộ đạo
  check: (m: Meta, k: Career, ext: DaoExt) => boolean;
}
/** Dữ liệu ngoài hồ sơ (đọc từ Nghĩa trang, Sư Đồ). Chưa có thì coi như 0. */
export interface DaoExt {
  incense?: number; // tổng hương mộ mình được thắp
  litGraves?: number; // số mộ khác nhau mình đã thắp
  disciples?: number; // số môn hạ (Sư Đồ, 4.6.0)
}
const nEnd = (m: Meta) => Object.keys(m.endings ?? {}).length;
const hasEnd = (m: Meta, id: string) => !!m.endings?.[id];

export const DAO: DaoMark[] = [
  // Thiên
  { id: 'van_thien', coi: 'thien', name: tr('Vấn Thiên', 'Questioning Heaven'), how: tr('Lần đầu lên Hóa Thần', 'Reach Spirit Transformation for the first time'), line: tr('Lần đầu ngươi ngẩng đầu hỏi trời.', 'For the first time you lifted your head and questioned heaven.'), check: (_m, k) => k.maxRealm >= 5 },
  { id: 'phi_thang', coi: 'thien', name: tr('Phi Thăng', 'Ascension'), how: tr('Phi thăng', 'Ascend'), line: tr('Cửa trời từng mở cho ngươi.', 'The gate of heaven once opened for you.'), check: (m, k) => (m.achievements ?? []).includes('phi_thang') || k.ascPaths.length >= 1 },
  { id: 'tam_thien', coi: 'thien', name: tr('Tam Thiên', 'Three Heavens'), how: tr('Đủ Tiên, Ma, Thái Hư giới', 'Reach the Immortal, Demon and Great Void realms'), line: tr('Ba cõi trên đều đã có dấu chân ngươi.', 'All three upper realms bear your footprints.'), check: (_m, k) => ['tien', 'ma', 'hu'].every((x) => (k.cosmoses ?? []).includes(x)) },
  { id: 'chung_dao', coi: 'thien', name: tr('Chứng Đạo', 'Attaining the Dao'), how: tr('Chứng Đạo', 'Attain the Dao'), line: tr('Mười ba đạo lôi đã không giữ được ngươi.', 'Thirteen bolts of lightning could not hold you.'), check: (m) => hasEnd(m, 'chung_dao') },
  { id: 'ho_dao', coi: 'thien', name: tr('Hộ Đạo', 'Dao Guardians'), how: tr('Được Vạn Kiếp Hộ Đạo đỡ lôi', 'Be shielded by your past lives during the tribulation'), line: tr('Những ngươi của kiếp trước đã đứng ra đỡ cho ngươi.', 'The yous of past lives stood up to shield you.'), check: (m, k) => !!k.hoDao || hasEnd(m, 'van_kiep_ho_dao') },
  { id: 'truong_sinh', coi: 'thien', name: tr('Trường Sinh', 'Longevity'), how: tr('Sống tới 1000 tuổi', 'Live to 1000'), line: tr('Một nghìn năm, ngươi nhìn núi mòn.', 'A thousand years, you watched the mountains wear away.'), check: (_m, k) => k.maxAge >= 1000 },
  { id: 'thien_thu', coi: 'thien', name: tr('Thiên Thư', 'Heavenly Tome'), how: tr('Mở đủ 10 mảnh Thiên thư quyển I', 'Unlock all 10 fragments of Heavenly Tome volume I'), line: tr('Mười mảnh ký ức ghép lại thành một câu hỏi.', 'Ten fragments of memory piece together into one question.'), check: (m) => loreDone(m) },
  { id: 'hong_hoang', coi: 'thien', name: tr('Hồng Hoang', 'Primordial'), how: tr('Lên Chuẩn Thánh', 'Reach Quasi-Saint'), line: tr('Ngươi bước ra ngoài trời đất cũ.', 'You stepped outside the old heaven and earth.'), check: (_m, k) => k.maxRealm >= HG_CHUAN_THANH },
  { id: 'thien_dao', coi: 'thien', hidden: true, name: tr('Thiên Đạo', 'Heavenly Dao'), how: '', line: tr('Chỗ ngồi kia vốn để trống cho ai?', 'For whom was that seat left empty?'), check: (m) => hasEnd(m, 'hg_thien_dao') },
  // Hồng Trần
  { id: 'nhap_the', coi: 'tran', name: tr('Nhập Thế', 'Entering the World'), how: tr('Bái 5 tông môn khác nhau', 'Join 5 different sects'), line: tr('Năm cửa tông môn, ngươi đều đã bái.', 'You have bowed at the gates of five sects.'), check: (_m, k) => (k.sects?.length ?? 0) >= 5 },
  { id: 'luc_lo', coi: 'tran', name: tr('Lục Lộ', 'Six Roads'), how: tr('Đi đủ 6 con đường', 'Walk all 6 Paths'), line: tr('Sáu nẻo đường, ngươi đã đi hết.', 'Six roads, and you have walked them all.'), check: (_m, k) => k.paths.length >= 6 },
  { id: 'chinh_ta', coi: 'tran', name: tr('Chính Tà', 'Light and Shadow'), how: tr('Phi thăng một lần với đạo tâm từ 90 và một lần từ -90', 'Ascend once with Dao Heart 90+ and once with -90 or below'), line: tr('Đường sáng lẫn đường tối, ngươi đều đã đi tới trời.', 'By the bright road and the dark road alike, you have reached heaven.'), check: (_m, k) => !!k.ascRight && !!k.ascLeft },
  { id: 'nhan_duyen', coi: 'tran', name: tr('Nhân Duyên', 'Bonds of Fate'), how: tr('Có đạo lữ trong 20 kiếp', 'Have a Dao partner in 20 lives'), line: tr('Hai mươi lần thương một người.', 'Twenty times you loved someone.'), check: (_m, k) => (k.partnerLives ?? 0) >= 20 },
  { id: 'ngu_thu', coi: 'tran', name: tr('Ngự Thú', 'Beast Tamer'), how: tr('Nuôi 30 loài linh thú', 'Raise 30 kinds of spirit beasts'), line: tr('Muông thú cũng nhớ ơn ngươi.', 'Even the beasts remember your kindness.'), check: (m) => (m.petBook?.length ?? 0) >= 30 },
  { id: 'bao_khi', coi: 'tran', name: tr('Bảo Khí', 'Treasures'), how: tr('Có 150 món đồ ẩn', 'Own 150 hidden treasures'), line: tr('Một trăm năm mươi món, món nào cũng có chuyện.', 'One hundred and fifty items, each with its own story.'), check: (m) => (m.itemBook?.length ?? 0) >= 150 },
  { id: 'phu_quy', coi: 'tran', name: tr('Phú Quý', 'Wealth'), how: tr('Có 100.000 linh thạch trong một kiếp', 'Hold 100,000 spirit stones in one life'), line: tr('Giàu nứt vách, rồi cũng nằm xuống.', 'Rich beyond measure, and still you lay down in the end.'), check: (_m, k) => (k.maxMoney ?? 0) >= 100000 },
  { id: 'giang_ho', coi: 'tran', name: tr('Giang Hồ', 'Jianghu'), how: tr('Thắng 100 người chơi', 'Defeat 100 players'), line: tr('Trăm trận, giang hồ biết tên ngươi.', 'A hundred battles, and the jianghu knows your name.'), check: (_m, k) => k.duelWins >= 100 },
  { id: 'truyen_dao', coi: 'tran', hidden: true, name: tr('Truyền Đạo', 'Passing On the Dao'), how: '', line: tr('Đạo của ngươi đã có người đi tiếp.', 'Someone now walks on along your Dao.'), check: (_m, _k, e) => (e.disciples ?? 0) >= 20 },
  // U Minh
  { id: 'sinh_tu', coi: 'minh', name: tr('Sinh Tử', 'Life and Death'), how: tr('Mở 40 kết cục', 'Unlock 40 endings'), line: tr('Bốn mươi cách chết, ngươi đều đã nếm.', 'Forty ways to die, and you have tasted them all.'), check: (m) => nEnd(m) >= 40 },
  { id: 'loi_kiep', coi: 'minh', name: tr('Lôi Kiếp', 'Lightning Tribulation'), how: tr('Chết dưới thiên kiếp 3 lần', 'Die to the heavenly tribulation 3 times'), line: tr('Sét đánh ba lần, ngươi vẫn đứng dậy trong mộng sau.', 'Struck three times, and still you rose in the next dream.'), check: (_m, k) => (k.thienKiepDeaths ?? 0) >= 3 },
  { id: 'nai_ha', coi: 'minh', name: tr('Nại Hà', 'Naihe Bridge'), how: tr('5 kiếp liền không uống canh Mạnh Bà', 'Refuse Meng Po’s soup 5 lives in a row'), line: tr('Năm lần qua cầu, năm lần hất chén. Ngươi không chịu quên.', 'Five times across the bridge, five times you knocked the bowl away. You refuse to forget.'), check: (m) => (m.noDrink ?? 0) >= 5 },
  { id: 'manh_ba', coi: 'minh', name: tr('Mạnh Bà', 'Meng Po'), how: tr('Uống canh Mạnh Bà 30 lần', 'Drink Meng Po’s soup 30 times'), line: tr('Ba mươi chén canh. Quên ngần ấy mà vẫn còn đây.', 'Thirty bowls of soup. Forgetting that much, and still you are here.'), check: (_m, k) => (k.soupDrinks ?? 0) >= 30 },
  { id: 'diem_la', coi: 'minh', name: tr('Diêm La', 'King Yama'), how: tr('Chết chưa phi thăng khi đạo tâm từ -90', 'Die unascended with a Dao Heart of -90 or below'), line: tr('Sổ tội của ngươi, Diêm La đọc mất ba ngày.', 'Your ledger of sins took King Yama three days to read.'), check: (_m, k) => !!k.diemLa },
  { id: 'oan_hon', coi: 'minh', name: tr('Oan Hồn', 'Vengeful Ghost'), how: tr('Báo thù 10 người chơi', 'Take revenge on 10 players'), line: tr('Mười món nợ máu, ngươi đều đã đòi.', 'Ten blood debts, and you collected them all.'), check: (_m, k) => k.revenges >= 10 },
  { id: 'huong_hoa', coi: 'minh', name: tr('Hương Hỏa', 'Incense'), how: tr('Mộ mình được thắp 500 nén hương', 'Your graves receive 500 incense sticks'), line: tr('Người đời chưa quên ngươi.', 'The world has not forgotten you.'), check: (_m, _k, e) => (e.incense ?? 0) >= 500 },
  { id: 'tu_bi', coi: 'minh', hidden: true, name: tr('Từ Bi', 'Compassion'), how: '', line: tr('Ngươi nhớ đến người khác nhiều hơn chính mình.', 'You remembered others more than yourself.'), check: (_m, _k, e) => (e.litGraves ?? 0) >= 100 },
  { id: 'minh_chung', coi: 'minh', hidden: true, name: tr('Minh Chung', 'Underworld Bell'), how: '', line: tr('Ngươi đã đứng trước kẻ gõ chuông. Hắn nhớ mặt ngươi.', 'You stood before the bell-ringer. He remembers your face.'), check: (m) => !!m.chuongWin },
];
/** Chuẩn Thánh: cảnh giới đầu của Hồng Hoang (xem REALMS trong data.ts) */
const HG_CHUAN_THANH = 12;

export const COI: { id: Coi; name: string; short: string; ton: string; tonLine: string }[] = [
  { id: 'thien', name: tr('Thiên', 'Heaven'), short: tr('Thiên', 'Heaven'), ton: tr('Thiên Tôn', 'Heavenly Venerable'), tonLine: tr('Trên đầu ngươi, chín vì sao đã đủ. Thiên Tôn.', 'Above your head, all nine stars are complete. Heavenly Venerable.') },
  { id: 'tran', name: tr('Hồng Trần', 'Red Dust'), short: tr('Hồng Trần', 'Red Dust'), ton: tr('Hồng Trần Tôn', 'Red Dust Venerable'), tonLine: tr('Dưới chân ngươi, chín ấn đã đủ. Hồng Trần Tôn.', 'Beneath your feet, all nine seals are complete. Red Dust Venerable.') },
  { id: 'minh', name: tr('U Minh', 'Netherworld'), short: tr('Âm Ti', 'Underworld'), ton: tr('U Minh Tôn', 'Netherworld Venerable'), tonLine: tr('Trong bóng ngươi, chín ngọn đèn đã sáng. U Minh Tôn.', 'In your shadow, all nine lamps are lit. Netherworld Venerable.') },
];
export const TAM_TAI_LINE = () => tr('Thân, khí, đạo đều đã đủ. Ngươi có còn muốn mơ nữa không?', 'Body, breath and Dao are all complete. Do you still wish to dream?');

/** Các đạo đã ngộ theo hồ sơ hiện tại */
export function daoDone(meta: Meta, ext: DaoExt = {}): string[] {
  const k: Career = meta.career ?? { maxAge: 0, maxRealm: 0, ascPaths: [], paths: [], duelWins: 0, revenges: 0 };
  return DAO.filter((d) => d.check(meta, k, ext)).map((d) => d.id);
}
/** Số hành đã viên mãn (tầng 3) */
export const hanhFull = (meta: Meta) => HANH.filter((h) => (meta.career?.hanh?.[h.id] ?? 0) >= 3).length;
/** Số dấu Tam Tài: huyệt + hành đã viên mãn + đạo (tối đa 42) */
export function tamTaiCount(meta: Meta, ext: DaoExt = {}): number {
  return huyetCount(meta) + hanhFull(meta) + daoDone(meta, ext).length;
}

/** Tin khai mở sau một kiếp, so hồ sơ trước và sau: huyệt trước, rồi hành, rồi đạo, rồi danh hiệu */
export function tamTaiNews(before: Meta, after: Meta, ext: DaoExt = {}): { kind: 'huyet' | 'hanh' | 'dao' | 'ton'; text: string; sub?: string }[] {
  const out: { kind: 'huyet' | 'hanh' | 'dao' | 'ton'; text: string; sub?: string }[] = [];
  const h0 = huyetCount(before);
  for (const x of after.huyet ?? []) {
    if (x.id <= h0) continue;
    const h = huyetOf(x.id);
    if (h) out.push({ kind: 'huyet', text: h.line, sub: huyetGiftLine(h) });
  }
  for (const h of HANH) {
    const a = before.career?.hanh?.[h.id] ?? 0;
    const b = after.career?.hanh?.[h.id] ?? 0;
    if (b > a) out.push({ kind: 'hanh', text: hanhLine(h.id, b) });
  }
  if (hanhFull(after) === 5 && hanhFull(before) < 5) out.push({ kind: 'ton', text: NGU_HANH_LINE() });
  const d0 = daoDone(before, ext);
  const d1 = daoDone(after, ext);
  for (const id of d1) if (!d0.includes(id)) out.push({ kind: 'dao', text: DAO.find((d) => d.id === id)!.line });
  for (const coi of COI) {
    const ids = DAO.filter((d) => d.coi === coi.id).map((d) => d.id);
    const n0 = ids.filter((i) => d0.includes(i)).length;
    const n1 = ids.filter((i) => d1.includes(i)).length;
    if (n1 === 9 && n0 < 9) out.push({ kind: 'ton', text: coi.tonLine });
  }
  if (tamTaiCount(after, ext) >= 42 && tamTaiCount(before, ext) < 42) out.push({ kind: 'ton', text: TAM_TAI_LINE() });
  return out;
}

/** Ghi huyệt (nếu đạt) vào hồ sơ sau khi kiếp khép lại. Chỉ khi đã có chân thân. */
export function khaiAfterLife(meta: Meta, c: Character): Meta {
  if (!meta.chanThan) return meta;
  const h = khaiCheck(meta, c);
  if (!h) return meta;
  return { ...meta, huyet: [...(meta.huyet ?? []), { id: h.id, life: c.lifeNo }] };
}

// ---------------- Tam Tài Đồ: lời giới thiệu ----------------

export const TAM_TAI_INTRO = () => [
  { title: tr('Tam Tài', 'The Three Treasures'), line: tr('Ngươi có thân để mang, có khí để thở, có đạo để đi. Ba thứ ấy là Tam Tài của ngươi.', 'You have a body to carry, breath to draw, a Dao to walk. These three are your Three Treasures.'), small: tr('10 huyệt · 5 hành · 27 đạo', '10 points · 5 elements · 27 Daos') },
  { title: tr('Thân', 'Body'), line: tr('Thân có mười đại huyệt. Trong mộng làm được việc huyệt đòi, mộng tan thì huyệt khai.', 'The body has ten great points. Do in the dream what a point asks, and when the dream ends, it opens.'), small: tr('Mỗi kiếp tối đa 1 huyệt, dễ trước khó sau. Huyệt khai thì kiếp sau mạnh hơn một chút.', 'At most 1 point per life, easy ones first. Each open point makes the next life a little stronger.') },
  { title: tr('Khí', 'Breath'), line: tr('Mỗi giấc mộng mang một bản mệnh: Kim, Mộc, Thủy, Hỏa, Thổ. Mộng đi xa, hành ấy sáng.', 'Every dream carries one fate element: Metal, Wood, Water, Fire, Earth. The farther the dream goes, the brighter that element.'), small: tr('Mỗi hành 3 tầng: Hóa Thần, phi thăng, Chứng Đạo.', 'Each element has 3 tiers: Spirit Transformation, ascension, attaining the Dao.') },
  { title: tr('Đạo', 'Dao'), line: tr('Trên đầu, chín Thiên đạo. Dưới chân, chín nẻo Hồng Trần. Trong bóng ngươi, chín ngọn đèn U Minh. Đạo không ngộ trong một kiếp, mà qua vạn kiếp.', 'Above your head, nine Heavenly Daos. Beneath your feet, nine roads of the Red Dust. In your shadow, nine Netherworld lamps. A Dao is not grasped in one life, but across ten thousand.'), small: tr('Thiên: đường lên trời. Hồng Trần: đường ở đời. U Minh: đường của cái chết.', 'Heaven: the road up to the sky. Red Dust: the road through the world. Netherworld: the road of death.') },
];
export const TAM_TAI_END = () => tr('Huyệt đầu tiên, Dũng Tuyền, đợi ngươi lên Kim Đan.', 'The first point, Yongquan, waits for you to reach Golden Core.');

// ---------------- Mộng Tỉnh: đoạn mở đầu ----------------

export const MONG_TINH = () => [
  tr('Chuông vang. Một giấc mộng vừa tan.', 'The bell tolls. A dream has just dissolved.'),
  tr('Kẻ vừa chết kia là ngươi. Nhưng cũng không phải ngươi.', 'The one who just died was you. And yet not you.'),
  tr('Ngươi vẫn ngồi đây, giữa trời và đất, từ trước kiếp đầu tiên.', 'You have been sitting here, between heaven and earth, since before your first life.'),
  tr('Mỗi kiếp là một giấc mộng. Mộng tan, chân thân còn. Điều ngươi làm được trong mộng sẽ khắc vào thân.', 'Each life is a dream. The dream ends, the true self remains. What you achieve in the dream is carved into the body.'),
  tr('Nhưng ngươi đã quên mặt mình. Hãy nhớ lại.', 'But you have forgotten your own face. Remember it.'),
];
