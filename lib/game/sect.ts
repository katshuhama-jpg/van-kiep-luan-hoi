import { addMile } from './miles';
import { SECT_GEAR, SECT_GEAR_BY } from './items2';
import type { Character, EffectCtx } from './types';
import { tr } from '../i18n';
import { nameOf } from '../hanviet';

/**
 * Tông môn: bậc đệ tử theo căn cốt (chính phái) hay độ tàn nhẫn (ma môn).
 * Bậc càng cao tu càng nhanh, có quyền lợi riêng. Thăng bậc qua Đại bỉ tông môn hoặc khi đột phá cảnh giới.
 */

export type SectSide = 'chinh' | 'ta' | 'trung';
export const RANK_CHINH = [tr('Tạp dịch', "Handyman"), tr('Ngoại môn đệ tử', "Outer Disciple"), tr('Nội môn đệ tử', "Inner Disciple"), tr('Chân truyền đệ tử', "True Disciple")];
export const RANK_TA = [tr('Huyết nô', "Blood Slave"), tr('Ngoại đường sát thủ', "Outer Hall Assassin"), tr('Nội đường hộ pháp', "Inner Hall Protector"), tr('Huyết Sát Thánh tử', "Blood Fiend Holy Son")];
export const RANK_TRUNG = [tr('Học đồ', "Apprentice"), tr('Ký danh đệ tử', "Registered Disciple"), tr('Thân truyền đệ tử', "Personal Disciple"), tr('Thiên Cơ truyền nhân', "Heir of Tianji")];
export const RANK_SHORT_CHINH = [tr('Tạp dịch', "Handyman"), tr('Ngoại môn', "Outer"), tr('Nội môn', "Inner"), tr('Chân truyền', "True")];
export const RANK_SHORT_TA = [tr('Huyết nô', "Blood Slave"), tr('Sát thủ', "Assassin"), tr('Hộ pháp', "Protector"), tr('Thánh tử', "Holy Son")];
export const RANK_SHORT_TRUNG = [tr('Học đồ', "Apprentice"), tr('Ký danh', "Registered"), tr('Thân truyền', "Personal"), tr('Truyền nhân', "Heir")];
/** 3.1.0: bốn tông môn mới, mỗi tông có tên bậc riêng */
export const SECT_RANKS: Record<string, { full: string[]; short: string[] }> = {
  'Phổ Đà Sơn': { full: [tr('Hỏa đầu tăng', "Kitchen monk"), tr('Sa di', "Novice monk"), tr('Tỳ kheo', "Bhikkhu"), tr('Hộ pháp La Hán', "Arhat Protector")], short: [tr('Hỏa đầu', "Kitchen"), tr('Sa di', "Novice monk"), tr('Tỳ kheo', "Bhikkhu"), tr('La Hán', "Arhat")] },
  'Kiếm Cốc': { full: [tr('Mài kiếm đồng', "Sword-grinding boy"), tr('Kiếm đồng', "Sword boy"), tr('Kiếm sĩ', "Swordsman"), tr('Kiếm Cốc truyền nhân', "Heir of Jian Valley")], short: [tr('Mài kiếm', "Grinder"), tr('Kiếm đồng', "Sword boy"), tr('Kiếm sĩ', "Swordsman"), tr('Truyền nhân', "Heir")] },
  'Vạn Độc Môn': { full: [tr('Dược nô', "Herb slave"), tr('Độc đồng', "Poison boy"), tr('Độc sứ', "Poison envoy"), tr('Vạn Độc Thánh sứ', "Holy Envoy of Wandu")], short: [tr('Dược nô', "Herb slave"), tr('Độc đồng', "Poison boy"), tr('Độc sứ', "Poison envoy"), tr('Thánh sứ', "Holy Envoy")] },
  'Yêu Thần Điện': { full: [tr('Yêu bộc', "Yao servant"), tr('Yêu binh', "Yao soldier"), tr('Yêu tướng', "Yao general"), tr('Yêu Thần tử', "Yao Divine Son")], short: [tr('Yêu bộc', "Yao servant"), tr('Yêu binh', "Yao soldier"), tr('Yêu tướng', "Yao general"), tr('Thần tử', "Divine Son")] },
};
export function rankShort(c: Character): string {
  const r = rankOf(c);
  const side = sectSide(c);
  if (r < 0) return '';
  const own = c.sect ? SECT_RANKS[c.sect] : undefined;
  if (own) return own.short[r] ?? '';
  return (side === 'ta' ? RANK_SHORT_TA : side === 'trung' ? RANK_SHORT_TRUNG : RANK_SHORT_CHINH)[r] ?? '';
}
/** Đồ tông môn theo bậc: tông có đồ riêng thì dùng, không thì theo phe */
export function sectGear(c: Pick<Character, 'sect'>): string[][] {
  return (c.sect && SECT_GEAR_BY[c.sect]) || SECT_GEAR[sectSide(c) ?? 'chinh'];
}
/** hệ số tu luyện theo bậc: tạp dịch, ngoại môn, nội môn, chân truyền */
export const RANK_CULT = [1, 1.1, 1.25, 1.4];
/** chân truyền: đột phá dễ hơn nhờ sư phụ chỉ điểm */
export const CHAN_TRUYEN_BREAK = 0.08;

const TA_SECTS = [tr('Huyết Sát Môn', "Xuesha Sect"), tr('Vạn Độc Môn', "Vạn Độc Môn"), tr('Yêu Thần Điện', "Yêu Thần Điện")];
const TRUNG_SECTS = [tr('Thiên Cơ Các', "Tianji Pavilion")];
export const sectSide = (c: Pick<Character, 'sect'>): SectSide | null => (c.sect ? (TA_SECTS.includes(c.sect) ? 'ta' : TRUNG_SECTS.includes(c.sect) ? 'trung' : 'chinh') : null);
export const rankOf = (c: Character): number => (c.sect ? (c.sectRank ?? 1) : -1);

export function rankName(c: Character, rank = rankOf(c)): string {
  if (rank < 0) return '';
  const own = c.sect ? SECT_RANKS[c.sect] : undefined;
  if (own) return own.full[rank] ?? '';
  const side = sectSide(c);
  return (side === 'ta' ? RANK_TA : side === 'trung' ? RANK_TRUNG : RANK_CHINH)[rank] ?? '';
}

/** Bậc khởi đầu khi nhập môn chính phái: Thiên linh căn chân truyền, Địa nội môn, Huyền và Tạp ngoại môn, Phế tạp dịch */
export function rankByRoot(linhCanMul: number): number {
  return linhCanMul >= 2 ? 3 : linhCanMul >= 1.5 ? 2 : linhCanMul >= 0.8 ? 1 : 0;
}

/** Thiên Cơ Các (trung lập) kén người thông minh: xếp bậc theo ngộ tính */
export function rankByWit(ngoTinh: number): number {
  return ngoTinh >= 70 ? 3 : ngoTinh >= 50 ? 2 : ngoTinh >= 30 ? 1 : 0;
}

export function sectCultMul(c: Character): number {
  const r = rankOf(c);
  return r < 0 ? 1 : (RANK_CULT[r] ?? 1);
}

/** Nhập môn: đặt bậc, hẹn lần Đại bỉ đầu tiên */
export function joinSect(c: Character, sect: string, rank: number) {
  c.sect = sect;
  c.sectRank = Math.max(0, Math.min(3, rank));
  c.daiBiAt = Math.floor(c.age) + (sect === 'Kiếm Cốc' ? 3 : 4);
  c.sectSaved = false;
  c.sectHide = false;
  addMile(c, 'sect', tr(`Bái nhập ${sect}, làm ${rankName(c)}`, `Joined ${sect} as ${rankName(c)}`));
  const g = sectGear(c);
  for (let r = 1; r <= c.sectRank; r++) for (const id of g[r] ?? []) if (!c.inventory.includes(id)) c.inventory.push(id);
}

/** Thăng một bậc (tối đa chân truyền). Trả về câu kể */
export function promote(c: Character, ctx: EffectCtx | null, why: string): string | null {
  const r = rankOf(c);
  if (r < 0 || r >= 3) return null;
  c.sectRank = r + 1;
  const name = rankName(c);
  if (c.sectRank === 2) c.stats.ngoTinh = Math.min(100, c.stats.ngoTinh + 5); // được vào Tàng Kinh Các
  if (c.sectRank === 3 && sectSide(c) === 'trung') c.stats.khiVan = Math.min(100, c.stats.khiVan + 10);
  const gear = sectGear(c)[c.sectRank] ?? [];
  for (const id of gear) if (!c.inventory.includes(id)) c.inventory.push(id);
  addMile(c, 'sect', tr(`Thăng làm ${name} của ${c.sect}`, `Promoted to ${name} of ${nameOf(c.sect)}`));
  ctx?.fx('buy', name);
  const perk =
    c.sectRank === 3 && sectSide(c) === 'trung'
      ? tr(' Các chủ truyền cho bạn thuật xem thiên cơ: tu luyện nhanh hơn 40%, đột phá dễ hơn, khí vận +10, và một tấm bùa thế mạng.', " The Pavilion Master teaches you to read the heavenly secrets: 40% faster cultivation, easier breakthroughs, Luck +10, and a life-substitute talisman.")
      : c.sectRank === 3
      ? sectSide(c) === 'ta'
        ? tr(' Lão tổ ban cho ma công bí truyền: tu luyện nhanh hơn 40%, đột phá dễ hơn.', " The Patriarch grants you secret demonic arts: 40% faster cultivation, easier breakthroughs.")
        : tr(' Trưởng lão nhận bạn làm đồ đệ thân truyền: tu luyện nhanh hơn 40%, đột phá dễ hơn, sư phụ sẽ cứu bạn một lần.', " An Elder takes you as a personal disciple: 40% faster cultivation, easier breakthroughs, and your Master will save you once.")
      : c.sectRank === 2
        ? tr(' Được vào Tàng Kinh Các (ngộ tính +5), tu luyện nhanh hơn 25%.', " You may enter the Scripture Pavilion (Insight +5), cultivation 25% faster.")
        : tr(' Tu luyện nhanh hơn 10%.', " Cultivation 10% faster.");
  const gn = gear.length ? tr(` Tông môn ban cho ${gear.length > 1 ? tr('áo bào và lệnh bài', "robe and token") : tr('áo bào', "robe")} mới, mở Túi đồ để mặc.`, ` The sect grants you a new ${gear.length > 1 ? tr('áo bào và lệnh bài', "robe and token") : tr('áo bào', "robe")}; open your Inventory to wear it.`) : '';
  return tr(`${why} Bạn được thăng làm ${name}.${perk}${gn}`, `${why} You are promoted to ${name}.${perk}${gn}`);
}

/** Đột phá cảnh giới lớn thì tông môn tự nâng bậc: Trúc Cơ ít nhất nội môn, Kim Đan chân truyền */
export function promoteByRealm(c: Character, ctx: EffectCtx): string | null {
  const r = rankOf(c);
  if (r < 0) return null;
  // ma môn: càng tàn nhẫn càng được trọng dụng
  const cruel = sectSide(c) === 'ta' ? (c.daoTam <= -70 ? 3 : c.daoTam <= -40 ? 2 : r) : r;
  const want = Math.max(cruel, c.realm >= 3 ? 3 : c.realm >= 2 ? 2 : r);
  let out: string | null = null;
  while (rankOf(c) < want)
    out = promote(
      c,
      ctx,
      cruel > rankOf(c) && c.realm < (rankOf(c) + 1 >= 3 ? 3 : 2)
        ? tr('Tiếng ác của bạn vang tới tổng đàn, lão tổ cười lớn.', "Your infamy reaches the headquarters, and the Patriarch laughs aloud.")
        : tr(`Tin bạn đột phá ${c.realm >= 3 ? tr('Kim Đan', "Golden Core") : tr('Trúc Cơ', "Foundation")} truyền về sơn môn.`, `News of your ${c.realm >= 3 ? tr('Kim Đan', "Golden Core") : tr('Trúc Cơ', "Foundation")} breakthrough reaches the sect.`),
    );
  return out;
}

/** Đến kỳ Đại bỉ tông môn chưa (mỗi 5-8 năm, chỉ khi chưa là chân truyền) */
export function daiBiDue(c: Character): boolean {
  return !!c.sect && !c.cosmos && rankOf(c) < 3 && c.realm >= 1 && c.age >= (c.daiBiAt ?? 0) && c.age >= 12;
}

/** Chân truyền: sư phụ cứu một lần khi sắp chết */
export function masterSaves(c: Character): string | null {
  if (rankOf(c) !== 3 || c.sectSaved || sectSide(c) === 'ta') return null;
  c.sectSaved = true;
  c.stats.sucKhoe = Math.max(25, c.stats.sucKhoe);
  if (sectSide(c) === 'trung') return tr(' Tấm bùa thế mạng Các chủ Thiên Cơ Các trao cho bạn bỗng bốc cháy. Kiếp nạn đã được tính trước, bạn thoát chết trong gang tấc.', " The life-substitute talisman from the Tianji Pavilion Pavilion Master suddenly bursts into flame. This calamity was foreseen - you escape death by a hair.");
  return tr(` Sư phụ ở ${c.sect} cảm ứng được, một đạo kiếm quang xé trời lao tới cứu bạn. Bạn thoát chết, sư phụ chỉ để lại một câu: "Lần sau tự lo."`, ` Your Master at ${nameOf(c.sect)} senses it, and a sword light tears across the sky to save you. You live, and your Master leaves only one line: "Next time, handle it yourself."`);
}

/**
 * Phản môn (3.1.0): đạo và tông môn ngược phe.
 * Chính phái: chọn Ma tu hoặc đạo tâm từ -40 trở xuống. Ma môn: chọn Phật tu hoặc đạo tâm từ 40 trở lên.
 * Thiên Cơ Các trung lập không đuổi ai, nhưng người lệch hẳn về một phía sẽ kéo chính tà tới vây đánh.
 */
export function sectConflict(c: Pick<Character, 'sect' | 'path' | 'daoTam'>): boolean {
  const side = sectSide(c);
  if (side === 'chinh') return c.path === 'ma' || c.daoTam <= -40;
  if (side === 'ta') return c.path === 'phat' || c.daoTam >= 40;
  return false;
}

/** Rời tông môn; bị trục xuất thì mất cả áo bào, lệnh bài tông môn */
export function leaveSect(c: Character, expelled: boolean) {
  const side = sectSide(c);
  if (expelled && side) {
    const gear = sectGear(c).flat();
    c.inventory = c.inventory.filter((id) => !gear.includes(id));
    for (const k of Object.keys(c.equipped) as (keyof Character['equipped'])[]) {
      if (gear.includes(c.equipped[k] ?? '')) c.equipped[k] = k === 'ao' ? 'ao_vai' : undefined;
    }
  }
  c.sect = null;
  c.sectRank = undefined;
  c.sectHide = false;
}
