import { tr } from '../i18n';

/** Bảng giá chung và thị tượng (4.1.0). Không import data để data.ts, forge.ts dùng được mà không vòng lặp. */

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0;
  return h;
}
function vnDay(d: Date = new Date()): string {
  return new Date(d.getTime() + 7 * 3600 * 1000).toISOString().slice(0, 10);
}
type PriceItem = { price: number; minRealm: number; rare?: 0 | 1 | 2 | 3 };

// ---------------- Bảng giá ----------------
/** Giá trị gốc của một món phàm theo cảnh giới của món (khớp giá phường thị cũ khi mua đúng cảnh giới) */
export const VAL_REALM = [60, 180, 400, 800, 1200, 1800, 2700, 4000, 6000, 9000, 13500, 20000];
export const RARE_MUL = [1, 2, 4, 10];
export const SELL_RATE = 0.12;

/** Giá trị một món: đồ phường thị theo giá niêm yết ở đúng cảnh giới của nó, đồ rơi theo bảng cảnh giới × phẩm */
export function itemValue(it: PriceItem): number {
  if (it.price > 0) return Math.round(it.price * (1 + 0.25 * it.minRealm));
  return Math.round((VAL_REALM[Math.min(it.minRealm, VAL_REALM.length - 1)] ?? 60) * (RARE_MUL[it.rare ?? 0] ?? 1));
}

// ---------------- Thị tượng (theo vòng đời nhân vật) ----------------
/**
 * Tyler chốt 2/11: thị trường đổi theo năm tháng của kiếp, không theo ngày thật.
 * Mỗi kiếp một lịch riêng (theo tên và số kiếp): mỗi đoạn kéo dài ngẫu nhiên 3-8 năm, rồi đổi sang thị tượng khác trong 18 thị tượng. Lời dẫn theo tầm người chơi (phàm trấn, tu chân giới, tiên giới).
 * Người chơi không biết trước bao giờ đổi, đổi sang gì: phải canh lúc mua, lúc bán.
 */
export type MarketId = string;
export interface MarketOmen {
  id: MarketId;
  name: string;
  desc: string;
  buy: number; // hệ số giá mua đồ
  sell: number; // hệ số giá bán đồ
  pill: number; // hệ số giá đan
  tinh: number; // hệ số giá tinh thiết
}
type Txt = [string, string, string, string]; // tên vi, tên en, mô tả vi, mô tả en
interface OmenDef {
  id: string;
  t: [Txt, Txt, Txt]; // phàm trấn (tới Trúc Cơ), tu chân giới (Kim Đan tới Độ Kiếp), tiên giới, ma giới, hư giới
  buy: number;
  sell: number;
  pill: number;
  tinh: number;
}
/** 18 thị tượng, mỗi cái có lời dẫn hợp với tầm của người chơi: phàm nhân gặp chuyện phàm trấn, tu sĩ gặp chuyện giới tu chân, người đã phi thăng gặp chuyện tiên giới */
const DEFS: OmenDef[] = [
  { id: 'binh_on', buy: 1, sell: 1, pill: 1, tinh: 1, t: [
    ['Chợ trấn bình ổn', 'Calm town market', 'Giá cả như thường.', 'Prices are normal.'],
    ['Phường thị bình ổn', 'Calm cultivator market', 'Giá cả như thường.', 'Prices are normal.'],
    ['Tiên thị yên ả', 'Quiet immortal market', 'Giá cả như thường.', 'Prices are normal.'] ] },
  { id: 'thuong_doan', buy: 0.85, sell: 0.9, pill: 1, tinh: 1, t: [
    ['Thương đoàn về trấn', 'Caravan in town', 'Hàng về nhiều, đồ rẻ đi, bán khó hơn.', 'Plenty of goods: gear is cheaper, selling is harder.'],
    ['Linh thuyền thương hội cập bến', 'Guild spirit-ship docks', 'Phi thuyền chở đầy pháp bảo: đồ rẻ đi, bán khó hơn.', 'A flying ship full of treasures: gear is cheaper, selling is harder.'],
    ['Tiên chu từ Thượng giới hạ xuống', 'An immortal ship descends', 'Hàng tiên giới đổ về: đồ rẻ đi, bán khó hơn.', 'Goods pour in from above: gear is cheaper, selling is harder.'] ] },
  { id: 'khan_hiem', buy: 1.2, sell: 1.2, pill: 1.1, tinh: 1, t: [
    ['Đường buôn bị chặn', 'Trade routes blocked', 'Cướp núi chặn đèo: đồ đắt, bán cũng được giá.', 'Bandits hold the pass: gear is dear, but selling pays well.'],
    ['Truyền tống trận hỏng', 'Teleport arrays broken', 'Hàng các châu không sang được: đồ đắt, bán được giá.', 'Goods cannot cross the continents: gear is dear, but sells well.'],
    ['Thiên hà loạn lưu', 'Star river in turmoil', 'Tinh không động loạn, tiên chu không qua lại: đồ đắt, bán được giá.', 'The starry void churns and ships stop: gear is dear, but sells well.'] ] },
  { id: 'thu_mua', buy: 1, sell: 1.4, pill: 1, tinh: 1, t: [
    ['Phú hộ gom đồ', 'A rich man buys up gear', 'Lão phú hộ đầu trấn mua đồ giá cao.', 'The rich man at the town gate buys gear at a high price.'],
    ['Vạn Bảo thương hội thu mua', 'The guild is buying', 'Thương hội gom pháp bảo: bán đồ được giá.', 'The guild is buying treasures: selling pays more.'],
    ['Tiên phủ thu nạp bảo vật', 'Immortal manors collect treasures', 'Các tiên phủ lớn thu bảo vật: bán đồ được giá.', 'Great immortal manors are collecting: selling pays more.'] ] },
  { id: 'dan_hoang', buy: 1, sell: 1, pill: 1.3, tinh: 1, t: [
    ['Hạn hán, thuốc khan', 'Drought, herbs scarce', 'Ruộng thuốc khô cháy: đan đắt.', 'The herb fields dry up: pills are dear.'],
    ['Dược viên các tông mất mùa', 'Sect herb gardens fail', 'Linh dược mất mùa: đan đắt.', 'The spirit herb harvest fails: pills are dear.'],
    ['Tiên thảo héo úa', 'Immortal herbs wither', 'Tiên thảo vạn năm héo một loạt: đan đắt.', 'Ten-thousand-year herbs wither: pills are dear.'] ] },
  { id: 'thiet_re', buy: 1, sell: 1, pill: 1, tinh: 0.75, t: [
    ['Lò rèn trấn bên mở', 'A new smithy opens', 'Sắt thép rẻ hẳn.', 'Iron is suddenly cheap.'],
    ['Linh mạch mới được khai', 'A new spirit vein is opened', 'Tinh thiết tràn phường thị, rẻ hẳn.', 'Refined iron floods the market.'],
    ['Thiên ngoại vẫn thạch rơi', 'Meteor iron falls from the sky', 'Thiết tinh từ trời rơi xuống: tinh thiết rẻ hẳn.', 'Iron from the heavens falls: refined iron is cheap.'] ] },
  { id: 'dau_co', buy: 1.1, sell: 1.1, pill: 1.1, tinh: 1.1, t: [
    ['Con buôn ôm hàng', 'Hoarders in town', 'Thứ gì cũng nhích giá.', 'Everything creeps up.'],
    ['Thế gia đầu cơ tích trữ', 'Great clans hoard goods', 'Thế gia ôm hàng: thứ gì cũng nhích giá.', 'The great clans hoard: everything creeps up.'],
    ['Tiên quan thao túng giá', 'Immortal officials rig prices', 'Tiên quan ôm hàng: thứ gì cũng nhích giá.', 'Immortal officials hoard: everything creeps up.'] ] },
  { id: 'chien_loan', buy: 1.3, sell: 1.1, pill: 1.25, tinh: 1.2, t: [
    ['Hai nước giao tranh', 'Two kingdoms at war', 'Binh lửa khắp nơi: đồ, đan, sắt đều đắt.', 'War everywhere: gear, pills and iron are all dear.'],
    ['Chính tà đại chiến', 'Righteous and evil sects at war', 'Các tông đánh nhau: đồ, đan, tinh thiết đều đắt.', 'The sects are at war: gear, pills and iron are all dear.'],
    ['Tiên ma đại chiến', 'War between immortals and demons', 'Hai giới khai chiến: đồ, đan, tinh thiết đều đắt.', 'Two realms at war: gear, pills and iron are all dear.'] ] },
  { id: 'phien_cho', buy: 0.9, sell: 1.1, pill: 0.9, tinh: 0.9, t: [
    ['Phiên chợ Tết', 'New Year fair', 'Chợ đông: mua rẻ, bán được giá.', 'A crowded fair: buy cheap, sell well.'],
    ['Đại hội giao dịch trăm năm', 'Century trade gathering', 'Tu sĩ bốn phương tụ hội: mua rẻ, bán được giá.', 'Cultivators gather from everywhere: buy cheap, sell well.'],
    ['Bàn Đào thịnh hội', 'The Peach Banquet', 'Tiên nhân các phương tụ hội: mua rẻ, bán được giá.', 'Immortals gather for the banquet: buy cheap, sell well.'] ] },
  { id: 'thue_nang', buy: 1.15, sell: 0.8, pill: 1.15, tinh: 1.15, t: [
    ['Quan phủ thu thuế nặng', 'Heavy taxes', 'Thuế chồng thuế: mua đắt, bán bị ép.', 'Tax upon tax: buying is dear, selling is squeezed.'],
    ['Tông môn bảo hộ thu phí', 'Sects charge protection fees', 'Phường thị nộp phí cho tông môn: mua đắt, bán bị ép.', 'Markets pay the sects: buying is dear, selling is squeezed.'],
    ['Tiên đình thu cống', 'The Heavenly Court demands tribute', 'Cống phẩm nặng nề: mua đắt, bán bị ép.', 'Heavy tribute: buying is dear, selling is squeezed.'] ] },
  { id: 'on_dich', buy: 1, sell: 0.9, pill: 1.4, tinh: 1, t: [
    ['Ôn dịch', 'Plague', 'Dịch bệnh lan: thuốc cháy hàng.', 'Plague spreads: medicine sells out.'],
    ['Độc chướng lan tràn', 'Poison miasma spreads', 'Tu sĩ trúng độc khắp nơi: đan cháy hàng.', 'Cultivators poisoned everywhere: pills sell out.'],
    ['Tâm ma dịch', 'Heart-demon plague', 'Tâm ma lây lan giữa tiên nhân: đan cháy hàng.', 'Heart demons spread among immortals: pills sell out.'] ] },
  { id: 'duoc_boi_thu', buy: 1, sell: 1, pill: 0.75, tinh: 1, t: [
    ['Ruộng thuốc được mùa', 'Bumper herb harvest', 'Thuốc đầy kho: đan rẻ.', 'Storehouses full of herbs: pills are cheap.'],
    ['Linh dược viên bội thu', 'Spirit gardens overflow', 'Linh dược đầy kho: đan rẻ.', 'Spirit herbs overflow: pills are cheap.'],
    ['Bàn Đào viên chín rộ', 'The peach garden ripens', 'Tiên quả chín rộ: đan rẻ.', 'Immortal fruit ripens everywhere: pills are cheap.'] ] },
  { id: 'hang_gia', buy: 1, sell: 0.7, pill: 1, tinh: 1, t: [
    ['Hàng giả tràn chợ', 'Fakes flood the market', 'Lái buôn nghi đồ giả: bán bị ép giá nặng.', 'Traders suspect fakes: selling is squeezed hard.'],
    ['Pháp bảo giả tràn phường thị', 'Fake treasures everywhere', 'Thương hội nghi đồ giả: bán bị ép giá nặng.', 'Guilds suspect fakes: selling is squeezed hard.'],
    ['Ảo bảo của Huyễn tộc', 'Illusory treasures', 'Huyễn tộc tung bảo vật ảo: bán bị ép giá nặng.', 'Illusionists spread fake treasures: selling is squeezed hard.'] ] },
  { id: 'mat_gia', buy: 1.25, sell: 1.25, pill: 1.25, tinh: 1.25, t: [
    ['Bạc mất giá', 'Silver loses value', 'Tiền mất giá: thứ gì cũng đắt, bán cũng được nhiều.', 'Money loses value: everything is dear, and sells for more.'],
    ['Mỏ linh thạch lớn lộ thiên', 'A great spirit-stone mine opens', 'Linh thạch mất giá: thứ gì cũng đắt, bán cũng được nhiều.', 'Spirit stones lose value: everything is dear, and sells for more.'],
    ['Tiên tinh tràn ngập', 'Immortal crystals flood in', 'Linh thạch mất giá: thứ gì cũng đắt, bán cũng được nhiều.', 'Spirit stones lose value: everything is dear, and sells for more.'] ] },
  { id: 'tieu_dieu', buy: 0.8, sell: 0.75, pill: 0.9, tinh: 0.9, t: [
    ['Chợ búa tiêu điều', 'Slump', 'Ế ẩm: đồ rẻ, nhưng chẳng ai mua lại.', 'A slump: gear is cheap, but nobody buys.'],
    ['Phường thị vắng tu sĩ', 'Empty cultivator market', 'Tu sĩ bế quan cả: đồ rẻ, nhưng chẳng ai mua lại.', 'Everyone is in seclusion: gear is cheap, nobody buys.'],
    ['Tiên giới tịch liêu', 'A desolate immortal realm', 'Tiên nhân ngủ dài: đồ rẻ, nhưng chẳng ai mua lại.', 'The immortals slumber: gear is cheap, nobody buys.'] ] },
  { id: 'tranh_khach', buy: 0.8, sell: 1, pill: 0.85, tinh: 0.85, t: [
    ['Hai tiệm tranh khách', 'Two shops compete', 'Hạ giá giành khách: mua rẻ.', 'Price war: buying is cheap.'],
    ['Hai thương hội tranh địa bàn', 'Two guilds compete', 'Hạ giá giành khách: mua rẻ.', 'Price war: buying is cheap.'],
    ['Hai tiên phủ tranh mối', 'Two immortal manors compete', 'Hạ giá giành khách: mua rẻ.', 'Price war: buying is cheap.'] ] },
  { id: 'khoang_hiem', buy: 1, sell: 1, pill: 1, tinh: 1.35, t: [
    ['Mỏ sắt sập', 'The iron mine collapses', 'Sắt hiếm dần: tinh thiết đắt.', 'Iron grows scarce: refined iron is dear.'],
    ['Linh mạch suy kiệt', 'Spirit veins run dry', 'Khoáng thiết hiếm dần: tinh thiết đắt.', 'Ore grows scarce: refined iron is dear.'],
    ['Thần thiết bị phong ấn', 'Divine iron sealed away', 'Tiên đình cấm khai thác: tinh thiết đắt.', 'The Court bans mining: refined iron is dear.'] ] },
  { id: 'dai_hoi', buy: 1.2, sell: 1.15, pill: 1, tinh: 1.1, t: [
    ['Hội võ trấn', 'Town martial contest', 'Võ sinh đổ về: binh khí đắt mà cũng dễ bán.', 'Fighters pour in: gear is dear but sells easily.'],
    ['Đại hội tông môn', 'Sect grand meeting', 'Tông môn tụ hội: pháp bảo đắt mà cũng dễ bán.', 'The sects gather: gear is dear but sells easily.'],
    ['Tiên đình tuyển tiên binh', 'The Court recruits celestial soldiers', 'Thiên binh cần giáp trụ: đồ đắt mà cũng dễ bán.', 'Celestial soldiers need armor: gear is dear but sells easily.'] ] },
];
/** Tầm của người chơi: 0 phàm trấn (tới Trúc Cơ), 1 tu chân giới, 2 đã phi thăng */
const tierOf = (c: LifeKey) => (c.cosmos || (c.realm ?? 0) >= 8 ? 2 : (c.realm ?? 0) >= 3 ? 1 : 0);
function omenFor(d: OmenDef, tier: number): MarketOmen {
  const [vi, en, dvi, den] = d.t[tier];
  return { id: d.id, name: tr(vi, en), desc: tr(dvi, den), buy: d.buy, sell: d.sell, pill: d.pill, tinh: d.tinh };
}
export const MARKET_OMENS: MarketOmen[] = DEFS.map((d) => omenFor(d, 0));
type LifeKey = { name?: string; lifeNo?: number; age: number; realm?: number; cosmos?: string | null };
const SPAN_MIN = 3;
const SPAN_MAX = 8;
/** Thị tượng của kiếp ở tuổi hiện tại: đoạn bắt đầu năm nào. Mười năm đầu đời luôn bình ổn. */
export function marketSpan(c: LifeKey): { omen: MarketOmen; start: number } {
  const age = Math.floor(c.age);
  const tier = tierOf(c);
  if (age < 10 || c.name === undefined) return { omen: omenFor(DEFS[0], tier), start: 0 };
  let a = hash(`${c.name}|${c.lifeNo ?? 0}|cho`) || 1;
  const r = () => {
    a = (Math.imul(a, 1664525) + 1013904223) >>> 0;
    return a / 4294967296;
  };
  let start = 10;
  let idx = 0;
  for (let guard = 0; guard < 2000; guard++) {
    const len = SPAN_MIN + Math.floor(r() * (SPAN_MAX - SPAN_MIN + 1));
    let next = Math.floor(r() * DEFS.length);
    if (next === idx) next = (next + 1) % DEFS.length;
    idx = next;
    if (age < start + len) return { omen: omenFor(DEFS[idx], tier), start };
    start += len;
  }
  return { omen: omenFor(DEFS[0], tier), start };
}
export const marketOf = (c: LifeKey) => marketSpan(c).omen;
const CALM = { buy: 1, sell: 1, pill: 1, tinh: 1 } as MarketOmen;

/** Giá mua một món theo thị tượng */
export const buyPrice = (it: PriceItem, m: MarketOmen = CALM) => Math.max(1, Math.round(itemValue(it) * m.buy));
/** Giá bán một món: 12% giá trị, theo thị tượng */
export const sellPrice = (it: PriceItem, m: MarketOmen = CALM) => Math.max(5, Math.round(itemValue(it) * SELL_RATE * m.sell));

// ---------------- Bão hòa khi bán nhiều ----------------
/** Bán nhiều trong cùng một năm game thì thương lái ép giá: mỗi món sau rẻ đi 15%, thấp nhất còn 25%. Sang năm mới hồi lại. */
type Seller = LifeKey & { sold?: { y: number; n: number } };
export function saleMul(c: Seller): number {
  const y = Math.floor(c.age);
  const n = c.sold && c.sold.y === y ? c.sold.n : 0;
  return Math.max(0.25, Math.pow(0.85, n));
}
export function noteSale(c: Seller): void {
  const y = Math.floor(c.age);
  c.sold = { y, n: (c.sold && c.sold.y === y ? c.sold.n : 0) + 1 };
}
/** Giá bán thật một món cho nhân vật này lúc này (thị tượng + bão hòa), rồi ghi nhận đã bán */
export function sellNow(c: Seller, it: PriceItem): number {
  const v = Math.max(5, Math.round(sellPrice(it, marketOf(c)) * saleMul(c)));
  noteSale(c);
  return v;
}
