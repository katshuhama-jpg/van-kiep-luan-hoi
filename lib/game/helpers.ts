import { ITEMS, REALMS } from './data';
import type { Character, EffectCtx, Stats } from './types';

/** Bộ sinh số ngẫu nhiên có hạt giống (mulberry32) */
export function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Chọn ngẫu nhiên n phần tử (giữ nguyên theo hạt giống) */
export function sample<T>(seed: number, arr: readonly T[], n: number): T[] {
  const r = seeded(seed);
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, n);
}

/** Bậc gia cảnh theo linh thạch và thu nhập */
export function wealthTier(c: { linhThach: number; income?: number }): { id: number; name: string } {
  const w = c.linhThach + (c.income ?? 0) * 10;
  if (w < 50) return { id: 0, name: 'Bần hàn' };
  if (w < 300) return { id: 1, name: 'Bình dân' };
  if (w < 1500) return { id: 2, name: 'Khá giả' };
  if (w < 6000) return { id: 3, name: 'Phú hộ' };
  return { id: 4, name: 'Đại phú hào' };
}

export const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export function pick<T>(rnd: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rnd() * arr.length)];
}

export function weighted<T extends { w: number }>(rnd: () => number, arr: readonly T[]): T {
  const total = arr.reduce((s, a) => s + a.w, 0);
  let r = rnd() * total;
  for (const a of arr) {
    r -= a.w;
    if (r <= 0) return a;
  }
  return arr[arr.length - 1];
}

export function stat(c: Character, key: keyof Stats, delta: number) {
  c.stats[key] = clamp(Math.round(c.stats[key] + delta), 0, 100);
}

export function dao(c: Character, delta: number) {
  c.daoTam = clamp(Math.round(c.daoTam + delta), -100, 100);
}

export function money(c: Character, delta: number) {
  c.linhThach = Math.max(0, Math.round(c.linhThach + delta));
}

/** Tu vi cần cho mỗi tầng ở cảnh giới hiện tại */
export function needFor(c: Character): number {
  return REALMS[c.realm]?.need || 40;
}

export function addCult(c: Character, amount: number) {
  c.cultivation = Math.max(0, c.cultivation + amount);
}

const BASE_YEAR = [6, 30, 30, 34, 38, 42, 46, 50];

/** Phần thưởng tu vi: x tầng ở cảnh giới thấp, nhưng ở cảnh giới cao chỉ bằng khoảng x*3 năm tu luyện */
export function reward(c: Character, x: number): number {
  const yearly = (BASE_YEAR[c.realm] ?? 34) * c.linhCanMul * (0.6 + c.stats.ngoTinh / 100);
  return Math.min(needFor(c) * x, yearly * x * 3);
}

/** Tu vi tính theo phần trăm của tầng hiện tại */
export function cultPct(c: Character): number {
  return clamp(c.cultivation / needFor(c), 0, 1);
}

export function hasItem(c: Character, id: string) {
  return c.inventory.includes(id);
}

export function equippedLook(c: Character, slot: 'ao' | 'vu_khi' | 'phu_kien'): string | null {
  const id = c.equipped[slot];
  if (!id) return null;
  return ITEMS.find((i) => i.id === id)?.look ?? null;
}

export function giveItem(c: Character, id: string, equip = true) {
  if (!c.inventory.includes(id)) c.inventory.push(id);
  const item = ITEMS.find((i) => i.id === id);
  if (item && equip) c.equipped[item.slot] = id;
}

export function addPill(c: Character, id: string, n = 1) {
  c.pills[id] = (c.pills[id] ?? 0) + n;
}

export function usePill(c: Character, id: string): boolean {
  if ((c.pills[id] ?? 0) <= 0) return false;
  c.pills[id] -= 1;
  return true;
}

/** Bị thương. Ngọc bội hộ thân đỡ một đòn chí mạng. */
export function hurt(c: Character, amount: number, ctx: EffectCtx): string {
  c.stats.sucKhoe = clamp(c.stats.sucKhoe - amount, 0, 100);
  ctx.fx('hurt', `-${amount}`);
  if (c.stats.sucKhoe <= 0 && c.equipped.phu_kien === 'ngoc_boi') {
    c.equipped.phu_kien = undefined;
    c.inventory = c.inventory.filter((i) => i !== 'ngoc_boi');
    c.stats.sucKhoe = 25;
    ctx.fx('heal', 'Ngọc bội vỡ');
    return ' Ngọc bội hộ thân vỡ vụn, đỡ cho bạn một kiếp.';
  }
  return '';
}

/** Xác suất thành công dựa trên khí vận */
export function luck(c: Character, base: number): number {
  return clamp(base + (c.stats.khiVan - 50) / 250, 0.05, 0.95);
}

export function fmt(n: number) {
  return Math.round(n).toLocaleString('vi-VN');
}

/**
 * Lựa chọn chí mạng: có tỉ lệ chết ngay. Khí vận cao giảm nhẹ rủi ro,
 * ngọc bội hộ thân đỡ được một lần.
 */
export function fatal(c: Character, ctx: EffectCtx, chance: number, cause: string): string | null {
  // trẻ con được trời thương hơn một chút
  const p = clamp(chance * (c.age < 13 && chance < 1 ? 0.6 : 1) - (c.stats.khiVan - 50) / 500, 0.01, chance >= 1 ? 1 : 0.95);
  if (ctx.rnd() >= p) return null;
  if (c.equipped.phu_kien === 'ngoc_boi') {
    c.equipped.phu_kien = undefined;
    c.inventory = c.inventory.filter((i) => i !== 'ngoc_boi');
    c.stats.sucKhoe = 20;
    ctx.fx('heal', 'Ngọc bội vỡ');
    return ' Đúng lúc tưởng chết, ngọc bội hộ thân vỡ tan, giữ lại cho bạn một hơi thở.';
  }
  c.dead = true;
  c.cause = cause;
  c.stats.sucKhoe = 0;
  ctx.fx('death');
  return ' ' + cause;
}
