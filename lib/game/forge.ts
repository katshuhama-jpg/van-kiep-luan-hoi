import { ITEMS } from './data';
import type { Character, EffectCtx, Element } from './types';

/**
 * Luyện hóa và Rèn (bản sau 3.2.0): đồ thừa trong túi có chỗ dùng mà không cần chợ.
 * - Luyện hóa: đồ không mặc biến thành tinh hoa (phẩm càng cao càng nhiều).
 * - Rèn: tinh hoa nâng vũ khí đang cầm +1 tới +5, mỗi bậc công +6% và hiệu ứng hệ ngũ hành của vũ khí lên một cấp.
 *   Càng cao càng khó; từ +2 lên +3 trở đi rèn hỏng có thể vỡ, mất luôn vũ khí (thần binh truyền đời không vỡ).
 * Cấp rèn gắn với đúng thanh vũ khí, đổi vũ khí thì không theo. Không bán, không trao đổi giữa người chơi.
 */

export const FORGE_MAX = 5;
export const FORGE_PER = 0.06;
export const FORGE_COST = [3, 5, 8, 12, 18];
export const FORGE_CHANCE = [0.95, 0.8, 0.6, 0.4, 0.25]; // càng lên cao càng khó
export const FORGE_BREAK = [0, 0, 0.1, 0.3, 0.45]; // rèn hỏng thì có tỉ lệ vỡ mất đồ, từ +2 lên +3 trở đi

const item = (id: string) => ITEMS.find((i) => i.id === id);

/** Tinh hoa nhận được khi luyện hóa một món */
export function smeltValue(id: string): number {
  const it = item(id);
  if (!it) return 0;
  return [1, 2, 4, 8][it.rare ?? 0] + (it.minRealm >= 4 ? 1 : 0) + (it.minRealm >= 7 ? 2 : 0);
}

/** Món này có luyện hóa được không: không đang mặc, không phải thần binh truyền đời */
export const canSmelt = (c: Character, id: string) => c.inventory.includes(id) && !Object.values(c.equipped).includes(id) && c.legend?.item !== id && smeltValue(id) > 0;

export function smelt(c: Character, id: string, ctx: EffectCtx): string | null {
  if (!canSmelt(c, id)) return null;
  const v = smeltValue(id);
  c.inventory = c.inventory.filter((x) => x !== id);
  c.tinhHoa = (c.tinhHoa ?? 0) + v;
  ctx.fx('buy', `+${v} tinh hoa`);
  return `Bạn ném ${item(id)?.name} vào lò, luyện ra ${v} tinh hoa (đang có ${c.tinhHoa}).`;
}

/** Cấp rèn của vũ khí đang cầm */
export const forgeLevel = (c: Character) => (c.equipped.vu_khi && c.forgeItem === c.equipped.vu_khi ? (c.forge ?? 0) : 0);
export const forgeMul = (c: Character) => 1 + forgeLevel(c) * FORGE_PER;

/* ---------------- Thuộc tính ngũ hành của trang bị ----------------
 * Mỗi món trang bị ngẫu nhiên mang một hệ (mỗi kiếp một khác). Rèn vũ khí lên cấp nào thì hiệu ứng hệ đó lên cấp đó.
 */
export const EL_FX: { el: Element; name: string; per: string; short: string }[] = [
  { el: 'kim', name: 'Kim', per: 'công +4%', short: 'Sắc bén' },
  { el: 'moc', name: 'Mộc', per: 'sinh lực +4%, mỗi năm hồi 1 sức khỏe', short: 'Sinh cơ' },
  { el: 'thuy', name: 'Thủy', per: 'thủ +5%', short: 'Nhu thủy' },
  { el: 'hoa', name: 'Hỏa', per: 'trừ yêu thêm 6% tu vi', short: 'Bạo viêm' },
  { el: 'tho', name: 'Thổ', per: 'hiểm cảnh khó giết hơn 5%', short: 'Hậu thổ' },
];
const ELS: Element[] = ['kim', 'moc', 'thuy', 'hoa', 'tho'];
const hashStr = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
};
/** Hệ của một món trang bị trong kiếp này */
export const itemEl = (c: Character, id: string): Element => ELS[hashStr(`${id}|${c.name}|${c.lifeNo}`) % 5];
export const elFx = (el: Element) => EL_FX.find((x) => x.el === el)!;

/** Cấp hiệu ứng hệ `el` đang có: bằng cấp rèn nếu vũ khí đang cầm mang hệ đó */
export const sealLv = (c: Character, el: Element) => (c.equipped.vu_khi && itemEl(c, c.equipped.vu_khi) === el ? forgeLevel(c) : 0);
export const sealAtk = (c: Character) => 1 + sealLv(c, 'kim') * 0.04;
export const sealHp = (c: Character) => 1 + sealLv(c, 'moc') * 0.04;
export const sealDef = (c: Character) => 1 + sealLv(c, 'thuy') * 0.05;
export const sealExp = (c: Character) => 1 + sealLv(c, 'hoa') * 0.06;
export const sealFatal = (c: Character) => 1 - sealLv(c, 'tho') * 0.05;

/** Tỉ lệ vỡ khi rèn hỏng ở cấp hiện tại (thần binh truyền đời không vỡ) */
export const breakChance = (c: Character) => (c.legend?.item === c.equipped.vu_khi ? 0 : FORGE_BREAK[forgeLevel(c)] ?? 0);

export type ForgeResult = { kind: 'ok' | 'fail' | 'break'; text: string; lv: number };

export function forge(c: Character, ctx: EffectCtx): ForgeResult | null {
  const w = c.equipped.vu_khi;
  if (!w) return null;
  const lv = forgeLevel(c);
  if (lv >= FORGE_MAX) return null;
  const costN = FORGE_COST[lv];
  if ((c.tinhHoa ?? 0) < costN) return null;
  c.tinhHoa = (c.tinhHoa ?? 0) - costN;
  const name = item(w)?.name ?? 'vũ khí';
  const el = elFx(itemEl(c, w));
  if (ctx.rnd() < FORGE_CHANCE[lv]) {
    c.forgeItem = w;
    c.forge = lv + 1;
    ctx.fx('layer', `${name} +${lv + 1}`);
    return { kind: 'ok', lv: lv + 1, text: `Lửa lò đỏ rực, ${name} lên +${lv + 1}: công +${Math.round((lv + 1) * FORGE_PER * 100)}%, hệ ${el.name} cấp ${lv + 1} (-${costN} tinh hoa).` };
  }
  if (ctx.rnd() < breakChance(c)) {
    // vỡ: mất luôn vũ khí
    c.inventory = c.inventory.filter((x) => x !== w);
    delete c.equipped.vu_khi;
    c.forge = 0;
    c.forgeItem = undefined;
    ctx.fx('hurt', 'Vỡ vũ khí');
    return { kind: 'break', lv: 0, text: `Một tiếng "choang", ${name} +${lv} vỡ làm đôi trên đe. Mất luôn vũ khí (-${costN} tinh hoa).` };
  }
  ctx.fx('hurt', 'Rèn hỏng');
  return { kind: 'fail', lv, text: `Búa giáng lệch một nhịp, tinh hoa bốc thành khói. ${name} vẫn giữ +${lv} (-${costN} tinh hoa).` };
}
