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
 * Mỗi kiếp một lịch riêng (theo tên và số kiếp): mỗi đoạn kéo dài ngẫu nhiên 3-8 năm, rồi đổi sang thị tượng khác trong 18 thị tượng.
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
const O = (id: string, vi: string, en: string, dvi: string, den: string, buy: number, sell: number, pill: number, tinh: number): MarketOmen => ({ id, name: tr(vi, en), desc: tr(dvi, den), buy, sell, pill, tinh });
export const MARKET_OMENS: MarketOmen[] = [
  O('binh_on', 'Thị trường bình ổn', 'Calm market', 'Giá cả như thường.', 'Prices are normal.', 1, 1, 1, 1),
  O('thuong_doan', 'Thương đoàn về trấn', 'Caravan in town', 'Hàng về nhiều, đồ rẻ đi, bán khó hơn.', 'Plenty of goods: gear is cheaper, selling is harder.', 0.85, 0.9, 1, 1),
  O('khan_hiem', 'Hàng khan hiếm', 'Goods are scarce', 'Đường buôn bị chặn: đồ đắt, bán cũng được giá.', 'Trade routes are blocked: gear is dear, but selling pays well.', 1.2, 1.2, 1.1, 1),
  O('thu_mua', 'Thương hội thu mua', 'Guild buying up gear', 'Vạn Bảo thương hội gom hàng: bán đồ được giá.', 'The Ten Thousand Treasures guild is buying: selling pays more.', 1, 1.4, 1, 1),
  O('dan_hoang', 'Đan hoang', 'Pill shortage', 'Dược viên mất mùa: đan đắt.', 'A bad herb harvest: pills are dear.', 1, 1, 1.3, 1),
  O('thiet_re', 'Mỏ thiết mới mở', 'New iron mine', 'Tinh thiết tràn chợ, rẻ hẳn.', 'Refined iron floods the market.', 1, 1, 1, 0.75),
  O('dau_co', 'Đầu cơ tích trữ', 'Speculators hoarding', 'Kẻ đầu cơ ôm hàng: thứ gì cũng nhích giá.', 'Speculators are hoarding: everything creeps up.', 1.1, 1.1, 1.1, 1.1),
  O('chien_loan', 'Chiến loạn', 'War', 'Hai nước giao tranh: đồ, đan, tinh thiết đều đắt.', 'Two kingdoms at war: gear, pills and iron are all dear.', 1.3, 1.1, 1.25, 1.2),
  O('phien_cho', 'Phiên chợ lớn', 'Grand fair', 'Chợ phiên mười năm: mua rẻ, bán được giá.', 'The great fair: buy cheap, sell well.', 0.9, 1.1, 0.9, 0.9),
  O('thue_nang', 'Quan phủ thu thuế nặng', 'Heavy taxes', 'Thuế chồng thuế: mua đắt, bán bị ép.', 'Tax upon tax: buying is dear, selling is squeezed.', 1.15, 0.8, 1.15, 1.15),
  O('on_dich', 'Ôn dịch', 'Plague', 'Dịch bệnh lan: đan dược cháy hàng.', 'Plague spreads: pills sell out.', 1, 0.9, 1.4, 1),
  O('duoc_boi_thu', 'Dược viên bội thu', 'Bumper herb harvest', 'Linh dược đầy kho: đan rẻ.', 'Storehouses full of herbs: pills are cheap.', 1, 1, 0.75, 1),
  O('hang_gia', 'Hàng giả tràn chợ', 'Fakes flood the market', 'Thương lái nghi đồ giả: bán bị ép giá nặng.', 'Traders suspect fakes: selling is squeezed hard.', 1, 0.7, 1, 1),
  O('mo_linh_thach', 'Mỏ linh thạch mới', 'New spirit stone mine', 'Linh thạch mất giá: thứ gì cũng đắt.', 'Spirit stones lose value: everything is dear.', 1.25, 1.25, 1.25, 1.25),
  O('tieu_dieu', 'Chợ búa tiêu điều', 'Slump', 'Ế ẩm: đồ rẻ, nhưng chẳng ai mua lại.', 'A slump: gear is cheap, but nobody buys.', 0.8, 0.75, 0.9, 0.9),
  O('tranh_khach', 'Hai thương hội tranh khách', 'Guilds compete', 'Hạ giá giành khách: mua rẻ.', 'Price war: buying is cheap.', 0.8, 1, 0.85, 0.85),
  O('khoang_hiem', 'Linh mạch suy kiệt', 'Veins run dry', 'Khoáng thiết hiếm dần: tinh thiết đắt.', 'Ore grows scarce: refined iron is dear.', 1, 1, 1, 1.35),
  O('dai_hoi', 'Đại hội tông môn', 'Sect grand meeting', 'Tông môn tụ hội: binh khí, pháp y đắt mà cũng dễ bán.', 'The sects gather: gear is dear but sells easily.', 1.2, 1.15, 1, 1.1),
];
type LifeKey = { name?: string; lifeNo?: number; age: number };
const SPAN_MIN = 3;
const SPAN_MAX = 8;
/** Thị tượng của kiếp ở tuổi hiện tại: đoạn bắt đầu năm nào. Mười năm đầu đời luôn bình ổn. */
export function marketSpan(c: LifeKey): { omen: MarketOmen; start: number } {
  const age = Math.floor(c.age);
  if (age < 10 || c.name === undefined) return { omen: MARKET_OMENS[0], start: 0 };
  let a = hash(`${c.name}|${c.lifeNo ?? 0}|cho`) || 1;
  const r = () => {
    a = (Math.imul(a, 1664525) + 1013904223) >>> 0;
    return a / 4294967296;
  };
  let start = 10;
  let idx = 0;
  for (let guard = 0; guard < 2000; guard++) {
    const len = SPAN_MIN + Math.floor(r() * (SPAN_MAX - SPAN_MIN + 1));
    let next = Math.floor(r() * MARKET_OMENS.length);
    if (next === idx) next = (next + 1) % MARKET_OMENS.length;
    idx = next;
    if (age < start + len) return { omen: MARKET_OMENS[idx], start };
    start += len;
  }
  return { omen: MARKET_OMENS[0], start };
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
