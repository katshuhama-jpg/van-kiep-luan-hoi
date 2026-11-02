import { ITEMS, REALMS, fxText, type Item } from './data';
import { giveItem, money, stat } from './helpers';
import type { Character, EffectCtx, GameEvent } from './types';
import { tr } from '../i18n';

/**
 * Kinh tế 4.1.0 (Tyler chốt 2/11/2026):
 * - Một bảng giá chung: giá trị món theo cảnh giới CỦA MÓN và phẩm. Mua đúng giá trị, bán (tự bán hay đồ rơi trùng) được 12%.
 * - Kệ hàng: cứ 5 năm game bày lại 6 món hiếm theo cảnh giới, mỗi món một chiếc. Sau phi thăng là Tiên thị, Ma thị, Hư thị.
 * - Thị tượng: mỗi ngày (giờ VN) một thị tượng làm giá lên xuống.
 * - Hội đấu giá 50 năm một lần, thương nhân lưu động, hợp đồ.
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

export { VAL_REALM, RARE_MUL, SELL_RATE, itemValue, MARKET_OMENS, marketToday, marketTomorrow, buyPrice, sellPrice, type MarketId, type MarketOmen } from './marketDay';
import { buyPrice, itemValue, sellPrice } from './marketDay';
export const sellPriceId = (id: string) => {
  const it = ITEMS.find((i) => i.id === id);
  return it ? sellPrice(it) : 0;
};


// ---------------- Kệ hàng (làm mới 5 năm) ----------------
export const SHELF_YEARS = 5;
export const shelfWindow = (c: Pick<Character, 'age'>) => Math.floor(c.age / SHELF_YEARS);
/** Năm kệ hàng bày lại lần tới */
export const shelfNext = (c: Pick<Character, 'age'>) => (shelfWindow(c) + 1) * SHELF_YEARS;
/** Tên chợ: phàm giới là Kệ hàng hiếm, sau phi thăng là Tiên thị, Ma thị, Hư thị */
export function shelfName(c: Pick<Character, 'cosmos'>): string {
  if (c.cosmos === 'tien') return tr('Tiên thị', 'Immortal Market');
  if (c.cosmos === 'ma') return tr('Ma thị', 'Demon Market');
  if (c.cosmos === 'hu') return tr('Hư thị', 'Void Market');
  return tr('Kệ hàng hiếm', 'Rare shelf');
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
  return out;
}
export const shelfBought = (c: Character, id: string) => !!c.shelf && c.shelf.w === shelfWindow(c) && c.shelf.bought.includes(id);
export function buyShelf(c: Character, id: string, ctx: EffectCtx): string | null {
  const it = shelfItems(c).find((i) => i.id === id);
  if (!it || shelfBought(c, id) || c.inventory.includes(id) || it.minRealm > c.realm) return null;
  const price = buyPrice(it);
  if (c.linhThach < price) return null;
  money(c, -price);
  const w = shelfWindow(c);
  c.shelf = { w, bought: [...(c.shelf?.w === w ? c.shelf.bought : []), id] };
  giveItem(c, id, false);
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
  c.inventory.includes(it.id) && !Object.values(c.equipped).includes(it.id) && c.legend?.item !== it.id && it.src !== 'event' && (it.rare ?? 0) < 3;
/** Hợp 3 món cùng phẩm thành 1 món phẩm cao hơn (có xác suất). Hỏng thì còn lại 1 món cùng phẩm. */
export function mergeItems(c: Character, ids: string[], ctx: EffectCtx): MergeResult | null {
  const its = ids.map((id) => ITEMS.find((i) => i.id === id)).filter((x): x is Item => !!x);
  if (its.length !== 3 || new Set(ids).size !== 3 || !its.every((i) => canMerge(c, i))) return null;
  const rare = its[0].rare ?? 0;
  if (its.some((i) => (i.rare ?? 0) !== rare)) return null;
  const cost = MERGE_COST[rare];
  if ((c.tinhHoa ?? 0) < cost) return null;
  c.tinhHoa = (c.tinhHoa ?? 0) - cost;
  c.inventory = c.inventory.filter((x) => !ids.includes(x));
  const realm = Math.min(c.cosmos ? 11 : 7, Math.max(...its.map((i) => i.minRealm)));
  const ok = ctx.rnd() < MERGE_CHANCE[rare];
  const want = ok ? rare + 1 : rare;
  const pick = (lo: number, hi: number) =>
    ITEMS.filter((i) => i.src === 'drop' && (i.rare ?? 0) === want && i.minRealm >= lo && i.minRealm <= hi && (!i.path || i.path === c.path) && !c.inventory.includes(i.id));
  let pool = pick(Math.max(0, realm - 1), realm);
  if (!pool.length) pool = pick(0, Math.max(realm, c.realm));
  if (!pool.length) pool = ITEMS.filter((i) => i.src === 'drop' && (i.rare ?? 0) === want);
  const item = pool[Math.floor(ctx.rnd() * pool.length)];
  giveItem(c, item.id, false);
  ctx.fx(ok ? 'layer' : 'buy', item.name);
  const text = ok
    ? tr(`Lò hợp bảo rực sáng, ba món tan vào nhau thành ${item.name}! (${fxText(item.fx)})`, `The treasure cauldron blazes and the three items fuse into ${item.name}! (${fxText(item.fx)})`)
    : tr(`Hỏa hầu lệch một chút, ba món chỉ còn lại ${item.name}.`, `The fire wavers and only ${item.name} remains of the three.`);
  ctx.log(text, ok ? 'good' : 'bad');
  return { kind: ok ? 'ok' : 'fail', item, text };
}

// ---------------- Hội đấu giá (đấu giá kín, một chạm) ----------------
export const AUCTION_EVENT_ID = 'hoi_dau_gia';
export const AUCTION_YEARS = 50;
/** Đến kỳ hội đấu giá: từ Luyện Khí, 50 năm một lần (khoảng 2-6 lần mỗi kiếp), mỗi kỳ một lần */
export const auctionDue = (c: Character) => !c.dead && c.realm >= 1 && c.age >= AUCTION_YEARS && c.age % AUCTION_YEARS === 0 && c.auctionAt !== c.age;
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
  const rare = c.realm >= 3 ? 3 : 2;
  const lo = c.cosmos ? 8 : Math.max(0, c.realm - 1);
  const hi = c.cosmos ? 11 : Math.min(7, c.realm + 1);
  let pool = ITEMS.filter((i) => i.src === 'drop' && (i.rare ?? 0) === rare && i.minRealm >= lo && i.minRealm <= hi && fits(c, i) && !c.inventory.includes(i.id));
  if (!pool.length) pool = ITEMS.filter((i) => i.src === 'drop' && (i.rare ?? 0) >= 2 && i.minRealm <= Math.max(c.realm + 1, 1) && fits(c, i) && !c.inventory.includes(i.id));
  return pool.length ? pool[Math.floor(rnd() * pool.length)].id : null;
}
export function auctionEvent(c: Character): GameEvent {
  const it = ITEMS.find((i) => i.id === c.auctionLot);
  const v = it ? itemValue(it) : 0;
  const bid = (k: number) => Math.round(v * BID_TIERS[k].mul);
  return {
    id: AUCTION_EVENT_ID,
    title: tr('Hội đấu giá Vạn Bảo Lâu', 'The Ten Thousand Treasures Auction'),
    text: () =>
      it
        ? tr(
            `Năm mươi năm một lần, Vạn Bảo Lâu mở hội đấu giá kín. Món đem đấu: ${it.name} [${['Phàm', 'Tốt', 'Hiếm', 'Cực phẩm'][it.rare ?? 0]}] (${fxText(it.fx)}). Mỗi người bỏ giá vào phong bì, ai trả cao nhất thì được, chỉ người thắng mới phải trả. Trong túi bạn có ${Math.floor(c.linhThach)} linh thạch.`,
            `Once every fifty years the Ten Thousand Treasures Pavilion holds a sealed auction. The lot: ${it.name} [${['Common', 'Fine', 'Rare', 'Supreme'][it.rare ?? 0]}] (${fxText(it.fx)}). Everyone seals a bid in an envelope; the highest wins, and only the winner pays. You have ${Math.floor(c.linhThach)} spirit stones.`,
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
        { label: tr(`Bỏ giá thấp: ${bid(0)}`, `Low bid: ${bid(0)}`), hint: tr(`cơ may thắng khoảng ${BID_TIERS[0].win * 100}%`, `about ${BID_TIERS[0].win * 100}% to win`), lean: 'trung', run: run(0) },
        { label: tr(`Bỏ giá vừa: ${bid(1)}`, `Fair bid: ${bid(1)}`), hint: tr(`cơ may thắng khoảng ${BID_TIERS[1].win * 100}%`, `about ${BID_TIERS[1].win * 100}% to win`), lean: 'trung', run: run(1) },
        { label: tr(`Bỏ giá cao: ${bid(2)}`, `High bid: ${bid(2)}`), hint: tr(`cơ may thắng khoảng ${BID_TIERS[2].win * 100}%`, `about ${BID_TIERS[2].win * 100}% to win`), lean: 'trung', run: run(2) },
        { label: tr('Không tham gia', 'Skip it'), hint: tr('giữ linh thạch', 'keep your stones'), lean: 'trung', run: (ch) => ((ch.auctionAt = ch.age), (ch.auctionLot = undefined), tr('Bạn cất thiệp, ở lại động phủ tu luyện.', 'You put the invitation away and stay in your cave abode.')) },
      ];
    },
  };
}

// ---------------- Thương nhân lưu động ----------------
export const MERCHANT_EVENT_ID = 'thuong_nhan_luu_dong';
export const MERCHANT_PER_YEAR = 0.03;
export const merchantDue = (c: Character, rnd: () => number) => !c.dead && c.age >= 16 && c.realm >= 1 && (c.merchantAt ?? -99) <= c.age - 15 && rnd() < MERCHANT_PER_YEAR;
export interface Ware {
  item: Item;
  price: number;
  state: 'open' | 'bought' | 'gone';
}
/** Ba món của thương nhân: phần lớn là Tốt, Hiếm, thỉnh thoảng một món Cực phẩm, giá dao động */
export function merchantWares(c: Character, rnd: () => number): Ware[] {
  const out: Ware[] = [];
  const lo = c.cosmos ? 8 : Math.max(0, c.realm - 1);
  const hi = c.cosmos ? 11 : Math.min(7, c.realm + 1);
  for (let k = 0; k < 3; k++) {
    const rare = rnd() < 0.1 ? 3 : rnd() < 0.45 ? 2 : 1;
    let pool = ITEMS.filter((i) => i.src === 'drop' && (i.rare ?? 0) === rare && i.minRealm >= lo && i.minRealm <= hi && fits(c, i) && !c.inventory.includes(i.id) && !out.some((w) => w.item.id === i.id));
    if (!pool.length) pool = ITEMS.filter((i) => i.src === 'drop' && (i.rare ?? 0) >= 1 && i.minRealm <= hi && fits(c, i) && !c.inventory.includes(i.id) && !out.some((w) => w.item.id === i.id));
    if (!pool.length) break;
    const item = pool[Math.floor(rnd() * pool.length)];
    // giá thương nhân: từ 70% tới 130% giá trị, không theo thị tượng
    out.push({ item, price: Math.round(itemValue(item) * (0.7 + rnd() * 0.6)), state: 'open' });
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
      { label: tr('Ghé xem hàng', 'Look at the goods'), hint: tr('mua, mặc cả, hay cướp', 'buy, haggle or rob'), lean: 'trung', run: (ch) => ((ch.merchantAt = ch.age), tr('Bạn dừng chân, lão vén tấm vải dầu.', 'You stop, and the old man lifts the oilcloth.')) },
      { label: tr('Đi tiếp', 'Keep walking'), lean: 'trung', run: (ch) => ((ch.merchantAt = ch.age), tr('Bạn lắc đầu đi tiếp, lão thương nhân lẩm bẩm tiếc rẻ.', 'You shake your head and walk on, and the merchant mutters in disappointment.')) },
    ],
  };
}
export function buyWare(c: Character, w: Ware, ctx: EffectCtx): string | null {
  if (w.state !== 'open' || c.linhThach < w.price) return null;
  money(c, -w.price);
  giveItem(c, w.item.id, false);
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
export function robWare(c: Character, w: Ware, ctx: EffectCtx): string | null {
  if (w.state !== 'open') return null;
  stat(c, 'tamMa', 4);
  c.daoTam = Math.max(-100, c.daoTam - 8);
  if (ctx.rnd() < 0.55) {
    giveItem(c, w.item.id, false);
    w.state = 'bought';
    ctx.fx('buy', w.item.name);
    const t = tr(`Bạn ra tay giật lấy ${w.item.name}, lão thương nhân ngã lăn ra đất. Đạo tâm bạn tối đi một chút.`, `You snatch ${w.item.name}, and the old merchant tumbles to the ground. Your Dao Heart darkens a little.`);
    ctx.log(t, 'ta');
    return t;
  }
  w.state = 'gone';
  stat(c, 'sucKhoe', -Math.min(25, Math.max(0, c.stats.sucKhoe - 5)));
  const t = tr('Từ trong xe nhảy ra hai hộ vệ, đánh bạn một trận nhừ tử rồi đẩy xe đi mất.', 'Two bodyguards leap out of the cart, beat you black and blue, then push the cart away.');
  ctx.log(t, 'bad');
  return t;
}
