/**
 * Ngày 35 (khối lặp cốt truyện mới mỗi đêm): bước chuỗi của các cốt truyện `ct_<YYYYMMDD>_<n>` lưu trong c.arcs (như chuỗi Trứng rồng),
 * và hỏi người chơi đã mở mảnh Thiên thư nào (c.loreIds gắn lúc đầu thai, c.tt3 cho quyển III).
 */
import type { Character } from './types';

export const ctArc = (c: Character, k: string) => c.arcs?.[k];
export const ctStep = (c: Character, k: string) => c.arcs?.[k]?.s ?? 0;
export function ctSet(c: Character, k: string, s: number, v?: string) {
  c.arcs = c.arcs ?? {};
  c.arcs[k] = { s, at: Math.floor(c.age), v: v ?? c.arcs[k]?.v };
}
export const ctSince = (c: Character, k: string) => Math.floor(c.age) - (c.arcs?.[k]?.at ?? 0);
/** bước sau của chuỗi: đang ở bước s và đã qua ít nhất n năm */
export const ctNext = (c: Character, k: string, s: number, years: number) => ctStep(c, k) === s && ctSince(c, k) >= years;
/** đã mở mảnh Thiên thư này (quyển I, II) lúc đầu thai */
export const hasLore = (c: Character, id: string) => (c.loreIds ?? []).includes(id);
/** bớt thọ nguyên (giao kèo, đổi thọ): không bao giờ xuống dưới tuổi hiện tại + 10 */
export function cutLife(c: Character, years: number): number {
  const before = c.lifespan;
  c.lifespan = Math.max(Math.floor(c.age) + 10, c.lifespan - years);
  return before - c.lifespan;
}
