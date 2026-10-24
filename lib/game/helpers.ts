import { ITEMS, REALMS } from './data';
import type { Character, EffectCtx, Stats } from './types';

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

const BASE_YEAR = [6, 30, 24, 26, 28, 30, 32, 34];

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
