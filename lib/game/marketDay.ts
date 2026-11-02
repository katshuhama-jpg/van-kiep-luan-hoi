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

// ---------------- Thị tượng (giá theo ngày) ----------------
export type MarketId = 'binh_on' | 'thuong_doan' | 'khan_hiem' | 'thu_mua' | 'dan_hoang' | 'thiet_re' | 'dau_co';
export interface MarketOmen {
  id: MarketId;
  name: string;
  desc: string;
  buy: number; // hệ số giá mua đồ
  sell: number; // hệ số giá bán đồ
  pill: number; // hệ số giá đan
  tinh: number; // hệ số giá tinh thiết
}
export const MARKET_OMENS: MarketOmen[] = [
  { id: 'binh_on', name: tr('Thị trường bình ổn', 'Calm market'), desc: tr('Giá cả như thường.', 'Prices are normal.'), buy: 1, sell: 1, pill: 1, tinh: 1 },
  { id: 'thuong_doan', name: tr('Thương đoàn về trấn', 'Caravan in town'), desc: tr('Hàng về nhiều: đồ rẻ hơn 15%.', 'Plenty of goods: gear 15% cheaper.'), buy: 0.85, sell: 0.9, pill: 1, tinh: 1 },
  { id: 'khan_hiem', name: tr('Hàng khan hiếm', 'Goods are scarce'), desc: tr('Đường buôn bị chặn: đồ đắt hơn 20%, bán cũng được giá hơn 20%.', 'Trade routes are blocked: gear 20% dearer, and selling pays 20% more.'), buy: 1.2, sell: 1.2, pill: 1.1, tinh: 1 },
  { id: 'thu_mua', name: tr('Thương hội thu mua', 'Guild buying up gear'), desc: tr('Vạn Bảo thương hội gom hàng: bán đồ được giá hơn 40%.', 'The Ten Thousand Treasures guild is buying: selling pays 40% more.'), buy: 1, sell: 1.4, pill: 1, tinh: 1 },
  { id: 'dan_hoang', name: tr('Đan hoang', 'Pill shortage'), desc: tr('Dược viên mất mùa: đan đắt hơn 30%.', 'A bad herb harvest: pills 30% dearer.'), buy: 1, sell: 1, pill: 1.3, tinh: 1 },
  { id: 'thiet_re', name: tr('Mỏ thiết mới mở', 'New iron mine'), desc: tr('Tinh thiết tràn chợ: rẻ hơn 25%.', 'Refined iron floods the market: 25% cheaper.'), buy: 1, sell: 1, pill: 1, tinh: 0.75 },
  { id: 'dau_co', name: tr('Đầu cơ tích trữ', 'Speculators hoarding'), desc: tr('Kẻ đầu cơ ôm hàng: đồ, đan, tinh thiết đều đắt hơn 10%, bán được giá hơn 10%.', 'Speculators are hoarding: gear, pills and iron 10% dearer, selling pays 10% more.'), buy: 1.1, sell: 1.1, pill: 1.1, tinh: 1.1 },
];
export function marketToday(day: string = vnDay()): MarketOmen {
  // bình ổn hay gặp hơn các thị tượng khác
  const h = hash('cho' + day) % (MARKET_OMENS.length + 2);
  return MARKET_OMENS[h >= MARKET_OMENS.length ? 0 : h];
}
/** Thị tượng ngày mai, cho người chơi tính trước */
export function marketTomorrow(): MarketOmen {
  return marketToday(vnDay(new Date(Date.now() + 86400000)));
}

/** Giá mua một món (theo thị tượng hôm nay) */
export const buyPrice = (it: PriceItem, m: MarketOmen = marketToday()) => Math.max(1, Math.round(itemValue(it) * m.buy));
/** Giá bán một món: 12% giá trị (theo thị tượng hôm nay) */
export const sellPrice = (it: PriceItem, m: MarketOmen = marketToday()) => Math.max(5, Math.round(itemValue(it) * SELL_RATE * m.sell));
