import { ITEMS } from './data';
import type { Character } from './types';

/** Tiền chôn tối đa khi đã phi thăng (linh thạch thượng giới quá nhiều, chôn hết thì kiếp sau phá giá) */
export const BURY_CAP_TIEN = 2000;

/**
 * Rương chôn cho kiếp sau. Phàm nhân: 30% linh thạch và phụ kiện (hoặc vũ khí nếu không truyền thần binh).
 * Bản 5/11: người đã phi thăng cũng chôn được, nhưng chỉ đồ phàm giới (đồ tiên không mang xuống được)
 * và tiền có trần. Chọn món phàm tốt nhất trong túi, nên xuống hạ phàm săn đồ là để kiếp sau có vốn.
 */
export function buryPlan(c: Character, legend: boolean): { money: number; item: string | null } | null {
  if (c.endTag === 'xuyen_khong') return null;
  const money = Math.round(c.linhThach * 0.3);
  if (!c.ascended) return { money, item: c.equipped.phu_kien ?? (legend ? null : c.equipped.vu_khi) ?? null };
  const own = new Set([...c.inventory, ...Object.values(c.equipped).filter((x): x is string => !!x)]);
  const best = ITEMS.filter((i) => own.has(i.id) && i.minRealm <= 7).sort((a, b) => (b.rare ?? 0) - (a.rare ?? 0) || b.minRealm - a.minRealm)[0];
  return { money: Math.min(BURY_CAP_TIEN, money), item: best?.id ?? null };
}
