import { HU_REALMS, ITEMS, MA_REALMS, PATHS, REALMS, type Item } from './data';
import { MONSTERS } from './combat';
import { ENDINGS, endingOf, type Ending } from './endings';
import { vnDay } from './hook';
import type { Character, Meta, PathId } from './types';

/**
 * Sưu tầm: Sổ Sinh Tử (kết cục) và Bảo khố (đồ ẩn chỉ rơi từ quái hay có từ kỳ ngộ, không bán ở phường thị).
 */

export const HIDDEN_ITEMS: Item[] = ITEMS.filter((i) => (i.src === 'drop' || i.src === 'event') && i.id !== 'ao_vai');
const HIDDEN = new Set(HIDDEN_ITEMS.map((i) => i.id));
export const isHidden = (id: string) => HIDDEN.has(id);

/** Danh hiệu sưu tầm theo số kết cục đã mở: gần 1/3 Sổ Sinh Tử là Kỳ Văn Khách, một nửa là Bách Hiểu Sinh */
export const COLLECTOR_MIN = 8;
export function collectorTitle(n: number): string | null {
  return n >= Math.ceil(ENDINGS.length / 2) ? 'Bách Hiểu Sinh' : n >= COLLECTOR_MIN ? 'Kỳ Văn Khách' : null;
}

const RARE_ODDS = ['dễ gặp', 'khoảng 3/10 lần', 'khoảng 1/12 lần', 'chỉ khoảng 1/50 lần'];

/** Cách có được một món đồ ẩn: đủ chi tiết để người chơi biết phải làm gì */
export function itemHint(i: Item): string {
  if (i.src === 'event') {
    const w = (i.where ?? 'một kỳ ngộ').replace(/, rất hiếm$/, '');
    return `Có được qua kỳ ngộ khi ${w.charAt(0).toLowerCase() + w.slice(1)}${i.where?.includes('rất hiếm') ? ', rất hiếm gặp' : ''}${i.minRealm ? `, từ ${REALMS[i.minRealm]?.name}` : ''}.`;
  }
  const lo = REALMS[i.minRealm]?.name ?? 'Phàm Nhân';
  const hi = REALMS[Math.min(REALMS.length - 1, i.minRealm + 2)]?.name;
  const names = (i.from ?? []).map((id) => MONSTERS.find((m) => m.id === id)?.name).filter(Boolean) as string[];
  return `Rơi khi trừ yêu lúc bạn ở ${lo}${hi && hi !== lo ? ` đến ${hi}` : ''}, ${RARE_ODDS[i.rare ?? 0]} hạ quái.${names.length ? ` Hay thấy trên ${names.slice(0, 2).join(', ')}.` : ''} Khí vận cao, đồ tăng rơi đồ, đánh quái mạnh hơn mình và ngày Cát tinh chiếu mệnh thì dễ rơi hơn.`;
}

/** Đồ ẩn đang có trong túi mà Bảo khố chưa ghi */
export function newFinds(c: Character, book: string[]): string[] {
  const seen = new Set(book);
  return Array.from(new Set([...c.inventory, ...Object.values(c.equipped).filter((x): x is string => !!x)])).filter((id) => isHidden(id) && !seen.has(id));
}

export function collectStats(meta: Meta) {
  return {
    endings: Object.keys(meta.endings ?? {}).length,
    endingsTotal: ENDINGS.length,
    items: (meta.itemBook ?? []).filter(isHidden).length,
    itemsTotal: HIDDEN_ITEMS.length,
  };
}

/** Có mục mới chưa xem trong Sổ Sinh Tử hay Bảo khố (để hiện chấm đỏ ở menu) */
export function unseen(meta: Meta): { endings: boolean; items: boolean } {
  const s = collectStats(meta);
  return { endings: s.endings > (meta.seenBook?.e ?? 0), items: s.items > (meta.seenBook?.i ?? 0) };
}

export function markSeen(meta: Meta, which: 'e' | 'i'): Meta {
  const s = collectStats(meta);
  return { ...meta, seenBook: { e: meta.seenBook?.e ?? 0, i: meta.seenBook?.i ?? 0, [which]: which === 'e' ? s.endings : s.items } };
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Lời đồn giang hồ hôm nay: gợi ý một kết cục người chơi chưa mở */
export function rumorToday(meta: Meta, day = vnDay()): Ending | null {
  const locked = ENDINGS.filter((e) => !meta.endings?.[e.id] && e.rare >= 1);
  if (!locked.length) return null;
  return locked[hash('ru' + day) % locked.length];
}

/** Đoán kết cục của một ngôi mộ từ thông tin trên bia (mộ cũ chưa ghi kết cục) */
export function endingOfGrave(g: {
  ending?: string | null;
  end_tag?: string | null;
  cause: string | null;
  age: number;
  realm_no?: number | null;
  path: string | null;
  dao_tam: number;
  ascended: boolean;
  wealth?: number | null;
}): Ending {
  if (g.ending) {
    const e = ENDINGS.find((x) => x.id === g.ending);
    if (e) return e;
  }
  const pathId = (Object.values(PATHS).find((p) => p.name === g.path || p.id === g.path)?.id ?? null) as PathId | null;
  const c = {
    cause: g.cause,
    endTag: g.end_tag ?? undefined,
    ascended: g.ascended,
    daoTam: g.dao_tam,
    realm: g.realm_no ?? 0,
    path: pathId,
    age: g.age,
    linhThach: g.wealth ?? 100,
    partner: null,
    pet: false,
    race: 'nhan',
    stats: { tamCanh: 50, ngoTinh: 50, khiVan: 50, tamMa: 0, sucKhoe: 50 },
  } as unknown as Character;
  return endingOf(c);
}

/** Cõi của một ngôi mộ (để vẽ bia riêng): đoán theo tên cảnh giới */
export function cosOfGrave(g: { realm: string; realm_no?: number | null }): 'tien' | 'ma' | 'hu' | null {
  if ((g.realm_no ?? 0) < 8) return null;
  if (MA_REALMS.some((n) => g.realm.startsWith(n))) return 'ma';
  if (HU_REALMS.some((n) => g.realm.startsWith(n))) return 'hu';
  return 'tien';
}
