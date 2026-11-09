import { ITEMS, REALMS, fxText, realmName, type Item } from './data';
import { eventDuel } from './duel';
import { addCult, addDup, dupOf, fatal, giveItem, hasFreeCopy, money, reward, stat, takeOne } from './helpers';
import type { Character, EffectCtx, GameEvent } from './types';
import { tr } from '../i18n';
import { HO_KHI_MAX, charmItem, charmOf, giveCharm } from './forge';

/**
 * Kinh tế 4.1.0 (Tyler chốt 2/11/2026):
 * - Một bảng giá chung: giá trị món theo cảnh giới CỦA MÓN và phẩm. Mua đúng giá trị, bán (tự bán hay đồ rơi trùng) được 12%.
 * - Kệ hàng: cứ 5 năm game bày lại 6 món hiếm theo cảnh giới, mỗi món một chiếc. Sau phi thăng là Tiên thị, Ma thị, Hư thị.
 * - Thị tượng: mỗi ngày (giờ VN) một thị tượng làm giá lên xuống.
 * - Hội đấu giá 60 năm một lần (sau phi thăng 120 năm), thương nhân lưu động, hợp đồ.
 */

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0;
  return h;
}
/** RNG cố định theo hạt giống (để kệ hàng giữ nguyên khi tải lại) */
function seeded(seed: string): () => number {
  let a = hash(seed) || 1;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export { VAL_REALM, RARE_MUL, SELL_RATE, itemValue, MARKET_OMENS, marketOf, marketSpan, buyPrice, sellPrice, type MarketId, type MarketOmen } from './marketDay';
import { buyPrice, itemValue, marketOf, sellPrice } from './marketDay';
export const sellPriceId = (id: string) => {
  const it = ITEMS.find((i) => i.id === id);
  return it ? sellPrice(it) : 0; // giá bình ổn, không theo kiếp
};


// ---------------- Kệ hàng (làm mới 5 năm) ----------------
export const SHELF_YEARS = 5;
export const shelfWindow = (c: Pick<Character, 'age'>) => Math.floor(c.age / SHELF_YEARS);
/** Năm kệ hàng bày lại lần tới */
export const shelfNext = (c: Pick<Character, 'age'>) => (shelfWindow(c) + 1) * SHELF_YEARS;
/** Tên kệ: phàm giới là Hàng mới về, sau phi thăng là Tiên thị, Ma thị, Hư thị */
export function shelfName(c: Pick<Character, 'cosmos'>): string {
  if (c.cosmos === 'tien') return tr('Tiên thị', 'Immortal Market');
  if (c.cosmos === 'ma') return tr('Ma thị', 'Demon Market');
  if (c.cosmos === 'hu') return tr('Hư thị', 'Void Market');
  return tr('Hàng mới về', 'New arrivals');
}
const fits = (c: Character, it: Item) => (!it.path || it.path === c.path) && (!it.lean || (it.lean === 'chinh' ? c.daoTam >= 20 : c.daoTam <= -20));
/** Đồ có thể lên kệ: đồ rơi (không phải đồ sự kiện), Tốt trở lên, gần cảnh giới của mình */
function shelfPool(c: Character, rare: number): Item[] {
  const lo = c.cosmos ? 8 : Math.max(0, c.realm - 1);
  const hi = c.cosmos ? Math.min(11, c.realm + 1) : Math.min(7, c.realm + 1);
  return ITEMS.filter((i) => i.src === 'drop' && (i.rare ?? 0) === rare && i.minRealm >= lo && i.minRealm <= hi && fits(c, i));
}
/** 6 món trên kệ của đợt hiện tại: 3 Tốt hoặc Hiếm, 2 Hiếm, 20% có 1 Cực phẩm */
export function shelfItems(c: Character): Item[] {
  const r = seeded(`${c.name}|${c.lifeNo}|${shelfWindow(c)}`);
  const out: Item[] = [];
  const take = (rare: number, n: number) => {
    let pool = shelfPool(c, rare).filter((i) => !out.includes(i));
    for (let k = 0; k < n && pool.length; k++) {
      const it = pool[Math.floor(r() * pool.length)];
      out.push(it);
      pool = pool.filter((x) => x !== it);
    }
  };
  take(1, 3);
  if (out.length < 3) take(2, 3 - out.length);
  take(2, 2);
  if (r() < 0.2) take(3, 1);
  // thỉnh thoảng có Hộ Khí Phù (25%) hoặc Linh Hỏa (20%)
  const q = r();
  if (q < 0.25) out.push(charmItem(c, 'ho_khi'));
  else if (q < 0.45) out.push(charmItem(c, 'linh_hoa'));
  return out;
}
export const shelfBought = (c: Character, id: string) => !!c.shelf && c.shelf.w === shelfWindow(c) && c.shelf.bought.includes(id);
export function buyShelf(c: Character, id: string, ctx: EffectCtx): string | null {
  const it = shelfItems(c).find((i) => i.id === id);
  if (!it || shelfBought(c, id) || c.inventory.includes(id) || it.minRealm > c.realm) return null;
  const ch = charmOf(id);
  if (ch === 'ho_khi' && (c.hoKhi ?? 0) >= HO_KHI_MAX) return null;
  const price = buyPrice(it, marketOf(c));
  if (c.linhThach < price) return null;
  money(c, -price);
  const w = shelfWindow(c);
  c.shelf = { w, bought: [...(c.shelf?.w === w ? c.shelf.bought : []), id] };
  if (ch) giveCharm(c, ch);
  else giveItem(c, id, false);
  ctx.fx('buy', it.name);
  return tr(`Mua ${it.name} ở ${shelfName(c)} (-${price} linh thạch). Mở Túi đồ để mặc.`, `Bought ${it.name} at the ${shelfName(c)} (-${price} spirit stones). Open your Inventory to equip it.`);
}

// ---------------- Hợp đồ ----------------
export const MERGE_COST = [2, 4, 8]; // tinh thiết theo phẩm của 3 món đem hợp
export const MERGE_CHANCE = [0.75, 0.5, 0.3];
export interface MergeResult {
  kind: 'ok' | 'fail';
  item: Item;
  text: string;
}
/** Món đem hợp được: không đang mặc, không phải thần binh truyền đời, không phải đồ sự kiện, chưa phải Cực phẩm */
export const canMerge = (c: Character, it: Item) =>
  hasFreeCopy(c, it.id) && (dupOf(c, it.id) > 0 || c.legend?.item !== it.id) && it.src !== 'event' && (it.rare ?? 0) < 3;
/** Hợp 3 món cùng phẩm thành 1 món phẩm cao hơn (có xác suất). Hỏng thì còn lại 1 món cùng phẩm. */
export function mergeItems(c: Character, ids: string[], ctx: EffectCtx): MergeResult | null {
  const its = ids.map((id) => ITEMS.find((i) => i.id === id)).filter((x): x is Item => !!x);
  if (its.length !== 3 || new Set(ids).size !== 3 || !its.every((i) => canMerge(c, i))) return null;
  const rare = its[0].rare ?? 0;
  if (its.some((i) => (i.rare ?? 0) !== rare)) return null;
  const cost = MERGE_COST[rare];
  if ((c.tinhHoa ?? 0) < cost) return null;
  const realm = Math.min(c.cosmos ? 11 : 7, Math.max(...its.map((i) => i.minRealm)));
  const ok = ctx.rnd() < MERGE_CHANCE[rare];
  const want = ok ? rare + 1 : rare;
  // Đồ ra lò: đồ rơi hoặc đồ phường thị (đồ Phàm chỉ có ở phường thị), không lấy đồ sự kiện, không trùng 3 món vừa bỏ vào
  const base = ITEMS.filter((i) => i.src !== 'event' && (i.rare ?? 0) === want && !ids.includes(i.id));
  const pick = (lo: number, hi: number) => base.filter((i) => i.minRealm >= lo && i.minRealm <= hi && fits(c, i) && !c.inventory.includes(i.id));
  let pool = pick(Math.max(0, realm - 1), realm);
  if (!pool.length) pool = pick(0, Math.max(realm, c.realm));
  if (!pool.length) pool = base.filter((i) => i.minRealm <= Math.max(realm, c.realm));
  if (!pool.length) pool = base;
  // hỏng mà vẫn không tìm được món nào thì trả lại một trong ba món đã bỏ vào, không bao giờ mất trắng
  const item = pool.length ? pool[Math.floor(ctx.rnd() * pool.length)] : its[Math.floor(ctx.rnd() * its.length)];
  c.tinhHoa = (c.tinhHoa ?? 0) - cost;
  ids.forEach((id) => takeOne(c, id)); // 5/11: có bản trùng thì dùng bản trùng trước
  if (c.inventory.includes(item.id)) addDup(c, item.id);
  else giveItem(c, item.id, false);
  ctx.fx(ok ? 'layer' : 'buy', item.name);
  const text = ok
    ? tr(`Lò hợp bảo rực sáng, ba món tan vào nhau thành ${item.name}! (${fxText(item.fx)})`, `The treasure cauldron blazes and the three items fuse into ${item.name}! (${fxText(item.fx)})`)
    : tr(`Hỏa hầu lệch một chút, ba món chỉ còn lại ${item.name}.`, `The fire wavers and only ${item.name} remains of the three.`);
  ctx.log(text, ok ? 'good' : 'bad');
  return { kind: ok ? 'ok' : 'fail', item, text };
}

// ---------------- Hội đấu giá (đấu giá kín, một chạm) ----------------
export const AUCTION_EVENT_ID = 'hoi_dau_gia';
export const AUCTION_YEARS = 60;
/** Sau phi thăng đời dài hơn nên hội đấu giá thưa hơn */
export const auctionYears = (c: Pick<Character, 'cosmos'>) => (c.cosmos ? 120 : AUCTION_YEARS);
/** Đến kỳ hội đấu giá: từ Luyện Khí, 60 năm một lần (sau phi thăng 120 năm), khoảng 2-5 lần mỗi kiếp */
export const auctionDue = (c: Character) => !c.dead && c.cosmos !== 'hg' && c.realm >= 1 && c.age >= auctionYears(c) && c.age % auctionYears(c) === 0 && c.auctionAt !== c.age;
const RIVALS = [
  tr('Hắc Phong lão quái', 'Old Monster Black Wind'),
  tr('Tô gia đại tiểu thư', 'Eldest Miss of the Su clan'),
  tr('Quản sự Vạn Bảo thương hội', 'Steward of the Ten Thousand Treasures guild'),
  tr('Tán tu áo xám', 'Grey-robed rogue cultivator'),
  tr('Thiếu chủ Kim Đao môn', 'Young master of the Golden Saber sect'),
  tr('Hòa thượng mặt sẹo', 'Scar-faced monk'),
];
/** Ba mức giá kín: giá so với giá trị món, và cơ may thắng */
export const BID_TIERS = [
  { mul: 0.8, win: 0.3 },
  { mul: 1.0, win: 0.6 },
  { mul: 1.3, win: 0.9 },
];
/** Chọn món đem đấu khi thiệp tới: Hiếm (Luyện Khí, Trúc Cơ) hoặc Cực phẩm (từ Kim Đan), gần cảnh giới của mình */
export function pickAuctionLot(c: Character, rnd: () => number): string | null {
  // cảnh giới càng cao, món đem đấu càng xịn: từ Kim Đan là Cực phẩm, từ Nguyên Anh chỉ lấy đồ đúng cảnh giới trở lên
  const rare = c.realm >= 3 ? 3 : 2;
  const lo = c.cosmos ? Math.min(11, Math.max(8, c.realm)) : c.realm >= 4 ? c.realm : Math.max(0, c.realm - 1);
  const hi = c.cosmos ? 11 : Math.min(7, c.realm + 1);
  let pool = ITEMS.filter((i) => i.src === 'drop' && (i.rare ?? 0) === rare && i.minRealm >= lo && i.minRealm <= hi && fits(c, i) && !c.inventory.includes(i.id));
  if (!pool.length) pool = ITEMS.filter((i) => i.src === 'drop' && (i.rare ?? 0) >= 2 && i.minRealm <= Math.max(c.realm + 1, 1) && i.minRealm >= Math.max(0, c.realm - 2) && fits(c, i) && !c.inventory.includes(i.id));
  return pool.length ? pool[Math.floor(rnd() * pool.length)].id : null;
}
/**
 * Bản 5/11 (Tyler chốt 4/11, góp ý #90, #92): giá đấu giá theo túi tiền thật của người chơi, không theo giá trị món.
 * "Giá vừa" bằng số linh thạch của khoảng 10% người giàu nhất ở cảnh giới đó (đo 3/11): đa số vẫn phải bỏ qua,
 * ai tích cóp giỏi mới mua được. Món tốt hơn mặt bằng thì đắt hơn (0,7 tới 1,4 lần). Sau phi thăng vẫn đắt để hút bớt tiền.
 */
export const AUCTION_TARGET = [0, 550, 600, 1500, 6000, 7000, 11000, 18000, 80000, 100000, 120000, 150000];
const lotPool = (realm: number) => {
  const rare = realm >= 3 ? 3 : 2;
  const cos = realm >= 8;
  const lo = cos ? Math.max(8, realm) : realm >= 4 ? realm : Math.max(0, realm - 1);
  const hi = cos ? 11 : Math.min(7, realm + 1);
  return ITEMS.filter((i) => i.src === 'drop' && (i.rare ?? 0) === rare && i.minRealm >= lo && i.minRealm <= hi);
};
const LOT_MEDIAN: number[] = [];
export function auctionValue(c: Pick<Character, 'realm'>, it: Item): number {
  const r = Math.max(1, Math.min(11, c.realm));
  if (LOT_MEDIAN[r] === undefined) {
    const v = lotPool(r).map((i) => itemValue(i)).sort((a, b) => a - b);
    LOT_MEDIAN[r] = v.length ? v[Math.floor(v.length / 2)] : itemValue(it);
  }
  const k = Math.max(0.7, Math.min(1.4, itemValue(it) / Math.max(1, LOT_MEDIAN[r])));
  return Math.round((AUCTION_TARGET[r] * k) / 10) * 10;
}
export function auctionEvent(c: Character): GameEvent {
  const it = ITEMS.find((i) => i.id === c.auctionLot);
  const v = it ? auctionValue(c, it) : 0;
  const bid = (k: number) => Math.round(v * BID_TIERS[k].mul);
  return {
    id: AUCTION_EVENT_ID,
    title: tr('Hội đấu giá Vạn Bảo Lâu', 'The Ten Thousand Treasures Auction'),
    item: () => it?.id,
    text: () =>
      it
        ? tr(
            `Mấy chục năm mới có một lần, Vạn Bảo Lâu mở hội đấu giá kín. Mỗi người bỏ giá vào phong bì, ai trả cao nhất thì được, chỉ người thắng mới phải trả. Trong túi bạn có ${Math.floor(c.linhThach)} linh thạch.`,
            `Only once in many decades the Ten Thousand Treasures Pavilion holds a sealed auction. Everyone seals a bid in an envelope; the highest wins, and only the winner pays. You have ${Math.floor(c.linhThach)} spirit stones.`,
          )
        : tr('Vạn Bảo Lâu mở hội, nhưng lần này không có món nào hợp với bạn.', 'The pavilion holds its auction, but nothing this time suits you.'),
    choices: () => {
      const run = (k: number) => (ch: Character, ctx: EffectCtx) => {
        ch.auctionAt = ch.age;
        ch.auctionLot = undefined;
        if (!it) return '';
        const price = bid(k);
        if (ch.linhThach < price) return tr('Bạn mở túi ra đếm thì không đủ linh thạch, đành ngồi xem người khác đấu.', 'You count your stones and find you cannot cover it, so you just watch the others bid.');
        const rival = RIVALS[Math.floor(ctx.rnd() * RIVALS.length)];
        if (ctx.rnd() < BID_TIERS[k].win) {
          money(ch, -price);
          giveItem(ch, it.id, false);
          ctx.fx('layer', it.name);
          return tr(`Mở phong bì: giá của bạn cao nhất! ${it.name} về tay bạn (-${price} linh thạch). Mở Túi đồ để mặc.`, `The envelopes are opened: your bid is the highest! ${it.name} is yours (-${price} spirit stones). Open your Inventory to equip it.`);
        }
        return tr(`Mở phong bì: ${rival} trả cao hơn và mang ${it.name} đi. Linh thạch của bạn vẫn còn nguyên.`, `The envelopes are opened: ${rival} bid higher and takes ${it.name}. Your stones are untouched.`);
      };
      if (!it) return [{ label: tr('Về động phủ', 'Head home'), lean: 'trung', run: (ch) => ((ch.auctionAt = ch.age), '') }];
      return [
        { label: tr(`Bỏ giá thấp: ${bid(0)}`, `Low bid: ${bid(0)}`), hint: c.linhThach < bid(0) ? tr(`thiếu ${bid(0) - Math.floor(c.linhThach)} linh thạch`, `${bid(0) - Math.floor(c.linhThach)} spirit stones short`) : tr(`cơ may thắng khoảng ${BID_TIERS[0].win * 100}%`, `about ${BID_TIERS[0].win * 100}% to win`), off: c.linhThach < bid(0), lean: 'trung', run: run(0) },
        { label: tr(`Bỏ giá vừa: ${bid(1)}`, `Fair bid: ${bid(1)}`), hint: c.linhThach < bid(1) ? tr(`thiếu ${bid(1) - Math.floor(c.linhThach)} linh thạch`, `${bid(1) - Math.floor(c.linhThach)} spirit stones short`) : tr(`cơ may thắng khoảng ${BID_TIERS[1].win * 100}%`, `about ${BID_TIERS[1].win * 100}% to win`), off: c.linhThach < bid(1), lean: 'trung', run: run(1) },
        { label: tr(`Bỏ giá cao: ${bid(2)}`, `High bid: ${bid(2)}`), hint: c.linhThach < bid(2) ? tr(`thiếu ${bid(2) - Math.floor(c.linhThach)} linh thạch`, `${bid(2) - Math.floor(c.linhThach)} spirit stones short`) : tr(`cơ may thắng khoảng ${BID_TIERS[2].win * 100}%`, `about ${BID_TIERS[2].win * 100}% to win`), off: c.linhThach < bid(2), lean: 'trung', run: run(2) },
        { label: tr('Không tham gia', 'Skip it'), hint: tr('giữ linh thạch', 'keep your stones'), lean: 'trung', run: (ch) => ((ch.auctionAt = ch.age), (ch.auctionLot = undefined), tr('Bạn cất thiệp, ở lại động phủ tu luyện.', 'You put the invitation away and stay in your cave abode.')) },
      ];
    },
  };
}

// ---------------- Thương nhân lưu động ----------------
export const MERCHANT_EVENT_ID = 'thuong_nhan_luu_dong';
export const MERCHANT_PER_YEAR = 0.02;
export const merchantDue = (c: Character, rnd: () => number) => !c.dead && c.cosmos !== 'hg' && c.age >= 16 && c.realm >= 1 && (c.merchantAt ?? -99) <= c.age - (c.cosmos ? 40 : 25) && rnd() < MERCHANT_PER_YEAR;
export interface Ware {
  item: Item;
  price: number;
  state: 'open' | 'bought' | 'gone';
  /** 5/11: kết quả cướp để đo (mạnh: gặp cao thủ giả dạng; thắng hay thua) */
  rob?: { strong: boolean; win: boolean };
}
/** Ba món của thương nhân: phần lớn là Tốt, Hiếm, thỉnh thoảng một món Cực phẩm, giá dao động */
export function merchantWares(c: Character, rnd: () => number): Ware[] {
  const out: Ware[] = [];
  // cảnh giới càng cao hàng càng xịn: tỉ lệ Cực phẩm 5% ở Luyện Khí lên tới 40%, từ Nguyên Anh chỉ bán đồ đúng cảnh giới trở lên
  const lo = c.cosmos ? Math.min(11, Math.max(8, c.realm)) : c.realm >= 4 ? c.realm : Math.max(0, c.realm - 1);
  const hi = c.cosmos ? 11 : Math.min(7, c.realm + 1);
  const p3 = Math.min(0.4, 0.05 + 0.035 * c.realm);
  const p2 = Math.min(0.9, 0.4 + 0.04 * c.realm);
  for (let k = 0; k < 3; k++) {
    const rare = rnd() < p3 ? 3 : rnd() < p2 ? 2 : 1;
    let pool = ITEMS.filter((i) => i.src === 'drop' && (i.rare ?? 0) === rare && i.minRealm >= lo && i.minRealm <= hi && fits(c, i) && !c.inventory.includes(i.id) && !out.some((w) => w.item.id === i.id));
    if (!pool.length) pool = ITEMS.filter((i) => i.src === 'drop' && (i.rare ?? 0) >= 1 && i.minRealm <= hi && fits(c, i) && !c.inventory.includes(i.id) && !out.some((w) => w.item.id === i.id));
    if (!pool.length) break;
    const item = pool[Math.floor(rnd() * pool.length)];
    // giá thương nhân: 70%-130% giá trị, cộng thêm 5% mỗi cảnh giới (hàng hiếm ở cảnh giới cao lão hét giá hơn)
    out.push({ item, price: Math.round(itemValue(item) * (0.7 + rnd() * 0.6) * (1 + 0.05 * c.realm)), state: 'open' });
  }
  // 20% lão có một lá Hộ Khí Phù
  if (rnd() < 0.2 && (c.hoKhi ?? 0) < HO_KHI_MAX) {
    const it = charmItem(c, 'ho_khi');
    out.push({ item: it, price: Math.round(it.price * (0.9 + rnd() * 0.4)), state: 'open' });
  }
  return out;
}
export function merchantEvent(c: Character): GameEvent {
  return {
    id: MERCHANT_EVENT_ID,
    title: tr('Thương nhân lưu động', 'A wandering merchant'),
    text: () =>
      tr(
        'Một lão thương nhân đẩy chiếc xe gỗ phủ vải dầu dừng bên đường, vẫy bạn lại: "Đạo hữu, hàng tốt từ phương xa, xem thử đi, không mua cũng được."',
        'An old merchant pushing a wooden cart covered in oilcloth stops by the road and waves you over: "Fellow Daoist, fine goods from far away. Take a look, no need to buy."',
      ),
    choices: () => [
      { label: tr('Ghé xem hàng', 'Look at the goods'), hint: tr('mua hay cướp', 'buy or rob'), lean: 'trung', run: (ch) => ((ch.merchantAt = ch.age), tr('Bạn dừng chân, lão vén tấm vải dầu.', 'You stop, and the old man lifts the oilcloth.')) },
      { label: tr('Đi tiếp', 'Keep walking'), lean: 'trung', run: (ch) => ((ch.merchantAt = ch.age), tr('Bạn lắc đầu đi tiếp, lão thương nhân lẩm bẩm tiếc rẻ.', 'You shake your head and walk on, and the merchant mutters in disappointment.')) },
    ],
  };
}
export function buyWare(c: Character, w: Ware, ctx: EffectCtx): string | null {
  if (w.state !== 'open' || c.linhThach < w.price) return null;
  money(c, -w.price);
  const chB = charmOf(w.item.id);
  if (chB) giveCharm(c, chB);
  else giveItem(c, w.item.id, false);
  w.state = 'bought';
  ctx.fx('buy', w.item.name);
  const t = tr(`Mua ${w.item.name} của thương nhân lưu động (-${w.price} linh thạch).`, `Bought ${w.item.name} from the wandering merchant (-${w.price} spirit stones).`);
  ctx.log(t, 'good');
  return t;
}
/** Mặc cả: ngộ tính và khí vận giúp ép giá. Hỏng thì lão nâng giá hoặc giấu món đó đi */
export function haggleWare(c: Character, w: Ware, ctx: EffectCtx): string | null {
  if (w.state !== 'open' || w.price < 20) return null;
  const p = Math.min(0.75, 0.3 + (c.stats.ngoTinh + c.stats.khiVan - 100) / 300);
  if (ctx.rnd() < p) {
    w.price = Math.round(w.price * 0.75);
    return tr(`Bạn kể khổ một hồi, lão thở dài bớt cho còn ${w.price} linh thạch.`, `You plead your hardships until the old man sighs and drops it to ${w.price} spirit stones.`);
  }
  if (ctx.rnd() < 0.4) {
    w.state = 'gone';
    return tr('Lão phật ý, cất món đó xuống đáy xe: "Không bán nữa!"', 'Offended, the old man stuffs it under the cart: "Not for sale anymore!"');
  }
  w.price = Math.round(w.price * 1.15);
  return tr(`Lão cười khẩy: "Đạo hữu chê thì giá ${w.price}."`, `The old man snorts: "If you think it's cheap, then ${w.price}."`);
}
/** Cướp: thành thì lấy trắng món đồ, đạo tâm sa xuống; hỏng thì lão có hộ vệ, bị đánh trọng thương */
/**
 * Cướp hàng thương nhân (Tyler 3/11): không còn 55% ăn ngay. Ra tay là phải đánh với người của đoàn hàng.
 * 80% đoàn hàng có cao thủ hơn mình một cảnh giới (đồ tốt hơn, chiêu cao hơn), gần như không thắng nổi;
 * 20% chỉ là tiêu sư kém mình một cảnh giới. Đánh thật theo sức chiến (eventDuel).
 */
export function robWare(c: Character, w: Ware, ctx: EffectCtx): string | null {
  if (w.state !== 'open') return null;
  stat(c, 'tamMa', 4);
  c.daoTam = Math.max(-100, c.daoTam - 8);
  const strong = ctx.rnd() < 0.8;
  const foeRealm = Math.max(1, Math.min(c.cosmos === 'hg' ? 15 : c.cosmos ? 11 : 7, c.realm + (strong ? 1 : -1)));
  const who = strong
    ? tr(`lão thương nhân hóa ra là cao thủ ${realmName(foeRealm, c.cosmos)} giả dạng`, `the old merchant turns out to be a disguised ${realmName(foeRealm, c.cosmos)} expert`)
    : tr(`một tiêu sư ${realmName(foeRealm, c.cosmos)} nhảy ra chắn xe`, `a ${realmName(foeRealm, c.cosmos)} escort leaps out to guard the cart`);
  const d = eventDuel(c, foeRealm, ctx.rnd);
  w.rob = { strong, win: d.result === 'win' };
  if (d.result === 'win') {
    const chR = charmOf(w.item.id);
    if (chR) giveCharm(c, chR);
    else giveItem(c, w.item.id, false);
    w.state = 'bought';
    ctx.fx('buy', w.item.name);
    const t = tr(`Bạn ra tay, ${who}. Một trận ác chiến, bạn thắng và giật lấy ${w.item.name}. Đạo tâm bạn tối đi một chút.`, `You strike, and ${who}. After a brutal fight you win and seize ${w.item.name}. Your Dao Heart darkens a little.`);
    ctx.log(t, 'ta');
    return t;
  }
  w.state = 'gone';
  stat(c, 'sucKhoe', -Math.min(strong ? 35 : 20, Math.max(0, c.stats.sucKhoe - 5)));
  const t = strong
    ? tr(`Bạn vừa ra tay thì ${who}. Hắn chỉ dùng ba phần sức đã đánh bạn nằm rạp, rồi thong thả đẩy xe đi.`, `The moment you strike, ${who}. Using barely a third of their strength they flatten you, then calmly push the cart away.`)
    : tr(`Bạn ra tay, ${who}. Đánh không lại, bạn bị đánh nhừ tử, xe hàng đi mất.`, `You strike, and ${who}. You can't win and get beaten black and blue; the cart is gone.`);
  ctx.log(t, 'bad');
  return t;
}

// ---------------- Tiên nhân, ma vương giáng trần (Tyler chốt 2/11) ----------------
/**
 * Trần chênh cảnh giới chặn oan gia, truy sát mạnh quá tay. Nhưng thế gian vẫn có kẻ mạnh hơn hẳn:
 * hiếm hoi (0,25%/năm, mỗi kiếp tối đa một lần, khoảng 1/3 số kiếp 200 năm gặp), một tiên nhân hoặc ma vương giáng trần chắn đường.
 * Không phải trận bắt buộc: người chơi chọn quỳ bái, dâng lễ, hay liều ra tay. Liều mới có thể chết.
 */
export const GIANG_TRAN_ID = 'giang_tran';
export const GIANG_TRAN_PER_YEAR = 0.0025;
export const giangTranDue = (c: Character, rnd: () => number) => !c.dead && !c.cosmos && c.realm >= 1 && c.age >= 16 && c.giangTranAt === undefined && rnd() < GIANG_TRAN_PER_YEAR;
export function giangTranEvent(c: Character): GameEvent {
  const ma = c.daoTam < -15;
  const who = ma ? tr('Huyết Sát Ma Vương', 'the Blood Fiend Demon King') : tr('Bạch Y Tiên Nhân', 'the White-Robed Immortal');
  const gift = Math.round(c.linhThach * 0.3);
  return {
    id: GIANG_TRAN_ID,
    title: ma ? tr('Ma vương giáng trần', 'A demon king descends') : tr('Tiên nhân giáng trần', 'An immortal descends'),
    text: () =>
      ma
        ? tr(`Trời đang sáng bỗng tối sầm, máu đỏ nhỏ xuống như mưa. ${who} từ Ma giới xé không gian bước ra, đứng chắn ngay trước mặt bạn. Uy áp đè xuống, xương cốt kêu răng rắc. Kẻ này mạnh hơn bạn không biết bao nhiêu cảnh giới.`, `The bright sky turns black and red blood falls like rain. ${who} tears through space from the Demon Realm and blocks your path. The pressure crushes down until your bones creak. This one is countless realms above you.`)
        : tr(`Một đạo tiên quang rơi xuống giữa đường, mây lành vây quanh. ${who} ngự kiếm hạ phàm, liếc nhìn bạn như nhìn một con kiến. Uy áp tiên giới làm bạn không thở nổi. Người này mạnh hơn bạn không biết bao nhiêu cảnh giới.`, `A ray of immortal light lands in the road, wrapped in auspicious clouds. ${who} descends on a flying sword and glances at you like an ant. The pressure of the Immortal Realm steals your breath. This one is countless realms above you.`),
    choices: () => [
      {
        label: tr('Quỳ xuống bái lạy', 'Kneel and bow'),
        hint: tr('an toàn, có khi được chỉ điểm', 'safe, may earn a pointer'),
        lean: 'trung',
        run: (ch, ctx) => {
          ch.giangTranAt = ch.age;
          if (ctx.rnd() < 0.4) {
            const t = reward(ch, 1);
            addCult(ch, t);
            ctx.fx('layer', tr('Được chỉ điểm', 'A pointer'));
            return tr(`${who} gật đầu, búng một tia linh quang vào giữa trán bạn rồi biến mất. Bạn ngộ ra điều gì đó (+${Math.round(t)} tu vi).`, `${who} nods, flicks a spark of light into your brow, and vanishes. Something clicks (+${Math.round(t)} cultivation).`);
          }
          return tr(`${who} không nói một lời, lướt qua như chưa từng thấy bạn.`, `${who} says nothing and passes by as if you were never there.`);
        },
      },
      {
        label: tr(`Dâng lễ vật (${gift} linh thạch)`, `Offer tribute (${gift} spirit stones)`),
        hint: tr('chắc chắn được ban thưởng', 'a sure reward'),
        lean: 'trung',
        run: (ch, ctx) => {
          ch.giangTranAt = ch.age;
          money(ch, -gift);
          const t = reward(ch, 1.5);
          addCult(ch, t);
          stat(ch, 'khiVan', 5);
          ctx.fx('layer', tr('Được ban thưởng', 'Rewarded'));
          return tr(`${who} nhận lễ, phẩy tay ban cho bạn một luồng ${ma ? 'ma khí' : 'tiên khí'} (+${Math.round(t)} tu vi, khí vận +5).`, `${who} accepts and grants you a wisp of ${ma ? 'demonic' : 'immortal'} qi (+${Math.round(t)} cultivation, luck +5).`);
        },
      },
      {
        label: tr('Liều mạng ra tay', 'Strike with everything you have'),
        hint: tr('rất nguy, có thể mất mạng', 'deadly, you may die'),
        lean: ma ? 'ta' : 'trung',
        run: (ch, ctx) => {
          ch.giangTranAt = ch.age;
          if (ctx.rnd() < 0.1) {
            const t = reward(ch, 3);
            addCult(ch, t);
            ctx.fx('layer', tr('Được nể', 'Respected'));
            return tr(`Đòn của bạn chẳng làm ${who} sứt một sợi tóc, nhưng ánh mắt kia lóe lên vẻ tán thưởng: "Gan lắm." Một luồng sức mạnh tràn vào kinh mạch (+${Math.round(t)} tu vi).`, `Your strike doesn't so much as ruffle ${who}'s hair, but a glint of approval flashes: "Bold." Power floods your meridians (+${Math.round(t)} cultivation).`);
          }
          const f = fatal(ch, ctx, 0.3, tr(`${who} chỉ khẽ phất tay áo. Bạn tan thành bụi giữa đường.`, `${who} merely flicks a sleeve. You turn to dust in the road.`));
          if (ch.dead) return f ?? '';
          stat(ch, 'sucKhoe', -Math.min(50, Math.max(0, ch.stats.sucKhoe - 5)));
          return tr(`${who} phất tay áo, bạn bay văng mười trượng, trọng thương nằm liệt.${f ?? ''}`, `${who} flicks a sleeve and you fly thirty paces, gravely wounded.${f ?? ''}`);
        },
      },
    ],
  };
}
