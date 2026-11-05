/**
 * 5/11 (góp ý người chơi, Tyler chốt làm cả hai): khóa đồ và bộ trang bị.
 * - Khóa: món đã khóa không bán, không phân giải, không đem hợp (bản trùng cất thêm vẫn bán được).
 * - Bộ trang bị: lưu tối đa 3 bộ đang mặc (ví dụ bộ farm rơi đồ, bộ đánh nhau), bấm một chạm là thay cả bộ.
 *   Món nằm trong một bộ đã lưu không tính là đồ thừa, để "Bán đồ thừa" không bán mất.
 */
import { ITEMS } from './data';
import type { Character, Slot } from './types';
import { tr } from '../i18n';

export const SET_MAX = 3;
const SLOTS: Slot[] = ['vu_khi', 'ao', 'phu_kien'];

export function toggleLock(c: Character, id: string): boolean {
  if (!c.inventory.includes(id)) return false;
  const on = c.locked?.includes(id);
  c.locked = on ? (c.locked ?? []).filter((x) => x !== id) : [...(c.locked ?? []), id];
  return !on;
}

export const setOf = (c: Character, i: number) => c.gearSets?.[i] ?? null;

/** Món này có trong bộ nào đã lưu không */
export const inSet = (c: Character, id: string) => (c.gearSets ?? []).some((s) => !!s && Object.values(s.eq).includes(id));

export function saveSet(c: Character, i: number): string {
  const eq: Partial<Record<Slot, string>> = {};
  for (const s of SLOTS) if (c.equipped[s]) eq[s] = c.equipped[s];
  const sets = [...(c.gearSets ?? [])];
  while (sets.length < SET_MAX) sets.push(null);
  sets[i] = { name: tr(`Bộ ${i + 1}`, `Set ${i + 1}`), eq };
  c.gearSets = sets;
  return tr(`Đã lưu đồ đang mặc vào Bộ ${i + 1}.`, `Saved what you wear as Set ${i + 1}.`);
}

/** Mặc cả bộ; món đã bán hay mất thì bỏ qua và báo lại */
export function wearSet(c: Character, i: number): { ok: boolean; text: string } {
  const set = setOf(c, i);
  if (!set) return { ok: false, text: '' };
  const miss: string[] = [];
  for (const s of SLOTS) {
    const id = set.eq[s];
    if (!id) continue;
    if (c.inventory.includes(id)) c.equipped[s] = id;
    else miss.push(ITEMS.find((x) => x.id === id)?.name ?? id);
  }
  return {
    ok: true,
    text: miss.length
      ? tr(`Đã thay Bộ ${i + 1}. Không còn: ${miss.join(', ')}.`, `Switched to Set ${i + 1}. Missing: ${miss.join(', ')}.`)
      : tr(`Đã thay Bộ ${i + 1}.`, `Switched to Set ${i + 1}.`),
  };
}

/** Bộ đang mặc trùng với bộ thứ mấy (để tô sáng) */
export function wornSet(c: Character): number {
  return (c.gearSets ?? []).findIndex((s) => !!s && SLOTS.every((k) => !s.eq[k] || c.equipped[k] === s.eq[k]) && SLOTS.some((k) => !!s.eq[k]));
}
