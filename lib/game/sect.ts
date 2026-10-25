import { addMile } from './miles';
import { SECT_GEAR } from './items2';
import type { Character, EffectCtx } from './types';

/**
 * Tông môn: bậc đệ tử theo căn cốt (chính phái) hay độ tàn nhẫn (ma môn).
 * Bậc càng cao tu càng nhanh, có quyền lợi riêng. Thăng bậc qua Đại bỉ tông môn hoặc khi đột phá cảnh giới.
 */

export type SectSide = 'chinh' | 'ta';
export const RANK_CHINH = ['Tạp dịch', 'Ngoại môn đệ tử', 'Nội môn đệ tử', 'Chân truyền đệ tử'];
export const RANK_TA = ['Huyết nô', 'Ngoại đường sát thủ', 'Nội đường hộ pháp', 'Huyết Sát Thánh tử'];
export const RANK_SHORT_CHINH = ['Tạp dịch', 'Ngoại môn', 'Nội môn', 'Chân truyền'];
export const RANK_SHORT_TA = ['Huyết nô', 'Sát thủ', 'Hộ pháp', 'Thánh tử'];
export function rankShort(c: Character): string {
  const r = rankOf(c);
  return r < 0 ? '' : ((sectSide(c) === 'ta' ? RANK_SHORT_TA : RANK_SHORT_CHINH)[r] ?? '');
}
/** hệ số tu luyện theo bậc: tạp dịch, ngoại môn, nội môn, chân truyền */
export const RANK_CULT = [1, 1.1, 1.25, 1.4];
/** chân truyền: đột phá dễ hơn nhờ sư phụ chỉ điểm */
export const CHAN_TRUYEN_BREAK = 0.08;

const TA_SECTS = ['Huyết Sát Môn'];
export const sectSide = (c: Pick<Character, 'sect'>): SectSide | null => (c.sect ? (TA_SECTS.includes(c.sect) ? 'ta' : 'chinh') : null);
export const rankOf = (c: Character): number => (c.sect ? (c.sectRank ?? 1) : -1);

export function rankName(c: Character, rank = rankOf(c)): string {
  if (rank < 0) return '';
  return (sectSide(c) === 'ta' ? RANK_TA : RANK_CHINH)[rank] ?? '';
}

/** Bậc khởi đầu khi nhập môn chính phái: Thiên linh căn chân truyền, Địa nội môn, Huyền và Tạp ngoại môn, Phế tạp dịch */
export function rankByRoot(linhCanMul: number): number {
  return linhCanMul >= 2 ? 3 : linhCanMul >= 1.5 ? 2 : linhCanMul >= 0.8 ? 1 : 0;
}

export function sectCultMul(c: Character): number {
  const r = rankOf(c);
  return r < 0 ? 1 : (RANK_CULT[r] ?? 1);
}

/** Nhập môn: đặt bậc, hẹn lần Đại bỉ đầu tiên */
export function joinSect(c: Character, sect: string, rank: number) {
  c.sect = sect;
  c.sectRank = Math.max(0, Math.min(3, rank));
  c.daiBiAt = Math.floor(c.age) + 4;
  c.sectSaved = false;
  addMile(c, 'sect', `Bái nhập ${sect}, làm ${rankName(c)}`);
  const side = sectSide(c) ?? 'chinh';
  for (let r = 1; r <= c.sectRank; r++) for (const id of SECT_GEAR[side][r] ?? []) if (!c.inventory.includes(id)) c.inventory.push(id);
}

/** Thăng một bậc (tối đa chân truyền). Trả về câu kể */
export function promote(c: Character, ctx: EffectCtx | null, why: string): string | null {
  const r = rankOf(c);
  if (r < 0 || r >= 3) return null;
  c.sectRank = r + 1;
  const name = rankName(c);
  if (c.sectRank === 2) c.stats.ngoTinh = Math.min(100, c.stats.ngoTinh + 5); // được vào Tàng Kinh Các
  const gear = SECT_GEAR[sectSide(c) ?? 'chinh'][c.sectRank] ?? [];
  for (const id of gear) if (!c.inventory.includes(id)) c.inventory.push(id);
  addMile(c, 'sect', `Thăng làm ${name} của ${c.sect}`);
  ctx?.fx('buy', name);
  const perk =
    c.sectRank === 3
      ? sectSide(c) === 'ta'
        ? ' Lão tổ ban cho ma công bí truyền: tu luyện nhanh hơn 40%, đột phá dễ hơn.'
        : ' Trưởng lão nhận bạn làm đồ đệ thân truyền: tu luyện nhanh hơn 40%, đột phá dễ hơn, sư phụ sẽ cứu bạn một lần.'
      : c.sectRank === 2
        ? ' Được vào Tàng Kinh Các (ngộ tính +5), tu luyện nhanh hơn 25%.'
        : ' Tu luyện nhanh hơn 10%.';
  const gn = gear.length ? ` Tông môn ban cho ${gear.length > 1 ? 'áo bào và lệnh bài' : 'áo bào'} mới, mở Túi đồ để mặc.` : '';
  return `${why} Bạn được thăng làm ${name}.${perk}${gn}`;
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
        ? 'Tiếng ác của bạn vang tới tổng đàn, lão tổ cười lớn.'
        : `Tin bạn đột phá ${c.realm >= 3 ? 'Kim Đan' : 'Trúc Cơ'} truyền về sơn môn.`,
    );
  return out;
}

/** Đến kỳ Đại bỉ tông môn chưa (mỗi 5-8 năm, chỉ khi chưa là chân truyền) */
export function daiBiDue(c: Character): boolean {
  return !!c.sect && rankOf(c) < 3 && c.realm >= 1 && c.age >= (c.daiBiAt ?? 0) && c.age >= 12;
}

/** Chân truyền: sư phụ cứu một lần khi sắp chết */
export function masterSaves(c: Character): string | null {
  if (rankOf(c) !== 3 || c.sectSaved || sectSide(c) !== 'chinh') return null;
  c.sectSaved = true;
  c.stats.sucKhoe = Math.max(25, c.stats.sucKhoe);
  return ` Sư phụ ở ${c.sect} cảm ứng được, một đạo kiếm quang xé trời lao tới cứu bạn. Bạn thoát chết, sư phụ chỉ để lại một câu: "Lần sau tự lo."`;
}
