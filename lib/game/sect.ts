import { addMile } from './miles';
import { SECT_GEAR, SECT_GEAR_BY } from './items2';
import type { Character, EffectCtx } from './types';

/**
 * Tông môn: bậc đệ tử theo căn cốt (chính phái) hay độ tàn nhẫn (ma môn).
 * Bậc càng cao tu càng nhanh, có quyền lợi riêng. Thăng bậc qua Đại bỉ tông môn hoặc khi đột phá cảnh giới.
 */

export type SectSide = 'chinh' | 'ta' | 'trung';
export const RANK_CHINH = ['Tạp dịch', 'Ngoại môn đệ tử', 'Nội môn đệ tử', 'Chân truyền đệ tử'];
export const RANK_TA = ['Huyết nô', 'Ngoại đường sát thủ', 'Nội đường hộ pháp', 'Huyết Sát Thánh tử'];
export const RANK_TRUNG = ['Học đồ', 'Ký danh đệ tử', 'Thân truyền đệ tử', 'Thiên Cơ truyền nhân'];
export const RANK_SHORT_CHINH = ['Tạp dịch', 'Ngoại môn', 'Nội môn', 'Chân truyền'];
export const RANK_SHORT_TA = ['Huyết nô', 'Sát thủ', 'Hộ pháp', 'Thánh tử'];
export const RANK_SHORT_TRUNG = ['Học đồ', 'Ký danh', 'Thân truyền', 'Truyền nhân'];
/** 3.1.0: bốn tông môn mới, mỗi tông có tên bậc riêng */
export const SECT_RANKS: Record<string, { full: string[]; short: string[] }> = {
  'Phổ Đà Sơn': { full: ['Hỏa đầu tăng', 'Sa di', 'Tỳ kheo', 'Hộ pháp La Hán'], short: ['Hỏa đầu', 'Sa di', 'Tỳ kheo', 'La Hán'] },
  'Kiếm Cốc': { full: ['Mài kiếm đồng', 'Kiếm đồng', 'Kiếm sĩ', 'Kiếm Cốc truyền nhân'], short: ['Mài kiếm', 'Kiếm đồng', 'Kiếm sĩ', 'Truyền nhân'] },
  'Vạn Độc Môn': { full: ['Dược nô', 'Độc đồng', 'Độc sứ', 'Vạn Độc Thánh sứ'], short: ['Dược nô', 'Độc đồng', 'Độc sứ', 'Thánh sứ'] },
  'Yêu Thần Điện': { full: ['Yêu bộc', 'Yêu binh', 'Yêu tướng', 'Yêu Thần tử'], short: ['Yêu bộc', 'Yêu binh', 'Yêu tướng', 'Thần tử'] },
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

const TA_SECTS = ['Huyết Sát Môn', 'Vạn Độc Môn', 'Yêu Thần Điện'];
const TRUNG_SECTS = ['Thiên Cơ Các'];
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
  addMile(c, 'sect', `Bái nhập ${sect}, làm ${rankName(c)}`);
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
  addMile(c, 'sect', `Thăng làm ${name} của ${c.sect}`);
  ctx?.fx('buy', name);
  const perk =
    c.sectRank === 3 && sectSide(c) === 'trung'
      ? ' Các chủ truyền cho bạn thuật xem thiên cơ: tu luyện nhanh hơn 40%, đột phá dễ hơn, khí vận +10, và một tấm bùa thế mạng.'
      : c.sectRank === 3
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
  return !!c.sect && !c.cosmos && rankOf(c) < 3 && c.realm >= 1 && c.age >= (c.daiBiAt ?? 0) && c.age >= 12;
}

/** Chân truyền: sư phụ cứu một lần khi sắp chết */
export function masterSaves(c: Character): string | null {
  if (rankOf(c) !== 3 || c.sectSaved || sectSide(c) === 'ta') return null;
  c.sectSaved = true;
  c.stats.sucKhoe = Math.max(25, c.stats.sucKhoe);
  if (sectSide(c) === 'trung') return ' Tấm bùa thế mạng Các chủ Thiên Cơ Các trao cho bạn bỗng bốc cháy. Kiếp nạn đã được tính trước, bạn thoát chết trong gang tấc.';
  return ` Sư phụ ở ${c.sect} cảm ứng được, một đạo kiếm quang xé trời lao tới cứu bạn. Bạn thoát chết, sư phụ chỉ để lại một câu: "Lần sau tự lo."`;
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
