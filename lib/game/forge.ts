import { ITEMS } from './data';
import type { Character, EffectCtx, Element } from './types';

/**
 * Luyện hóa và Rèn (bản sau 3.2.0): đồ thừa trong túi có chỗ dùng mà không cần chợ.
 * - Luyện hóa: đồ không mặc biến thành tinh hoa (phẩm càng cao càng nhiều).
 * - Rèn: tinh hoa nâng vũ khí đang cầm +1 tới +5, mỗi bậc công +6%. Bậc +4, +5 có thể hỏng (mất tinh hoa, giữ bậc).
 * Cấp rèn gắn với đúng thanh vũ khí, đổi vũ khí thì không theo. Không bán, không trao đổi giữa người chơi.
 */

export const FORGE_MAX = 5;
export const FORGE_PER = 0.06;
export const FORGE_COST = [3, 5, 8, 12, 18];
export const FORGE_CHANCE = [1, 1, 1, 0.75, 0.55];

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

export function forge(c: Character, ctx: EffectCtx): string | null {
  const w = c.equipped.vu_khi;
  if (!w) return null;
  const lv = forgeLevel(c);
  if (lv >= FORGE_MAX) return null;
  const costN = FORGE_COST[lv];
  if ((c.tinhHoa ?? 0) < costN) return null;
  c.tinhHoa = (c.tinhHoa ?? 0) - costN;
  const name = item(w)?.name ?? 'vũ khí';
  if (ctx.rnd() >= FORGE_CHANCE[lv]) {
    ctx.fx('hurt', 'Rèn hỏng');
    return `Búa giáng lệch một nhịp, tinh hoa bốc thành khói. ${name} vẫn giữ +${lv} (-${costN} tinh hoa).`;
  }
  c.forgeItem = w;
  c.forge = lv + 1;
  ctx.fx('layer', `${name} +${lv + 1}`);
  return `Lửa lò đỏ rực, ${name} lên +${lv + 1} (công +${Math.round((lv + 1) * FORGE_PER * 100)}%, -${costN} tinh hoa).`;
}

/* ---------------- Khắc ấn ngũ hành ----------------
 * Mỗi vũ khí khắc được 5 ấn Kim, Mộc, Thủy, Hỏa, Thổ, mỗi ấn tối đa 5 cấp, mỗi hệ một hiệu ứng.
 * Cấp ấn không vượt cấp rèn của vũ khí (rèn +3 thì ấn tối đa cấp 3).
 */
export const SEAL_COST = [1, 2, 4, 6, 9];
export const SEALS: { el: Element; name: string; per: string; short: string }[] = [
  { el: 'kim', name: 'Kim', per: 'công +4%', short: 'Sắc bén' },
  { el: 'moc', name: 'Mộc', per: 'sinh lực +4%, mỗi năm hồi thêm sức khỏe', short: 'Sinh cơ' },
  { el: 'thuy', name: 'Thủy', per: 'thủ +5%', short: 'Nhu thủy' },
  { el: 'hoa', name: 'Hỏa', per: 'trừ yêu thêm 6% tu vi', short: 'Bạo viêm' },
  { el: 'tho', name: 'Thổ', per: 'hiểm cảnh khó giết hơn 5%', short: 'Hậu thổ' },
];

/** Cấp ấn của vũ khí đang cầm */
export const sealLv = (c: Character, el: Element) => (c.equipped.vu_khi && c.forgeItem === c.equipped.vu_khi ? (c.seals?.[el] ?? 0) : 0);

export function addSeal(c: Character, el: Element, ctx: EffectCtx): string | null {
  const w = c.equipped.vu_khi;
  if (!w) return null;
  const lv = sealLv(c, el);
  if (lv >= FORGE_MAX || lv >= forgeLevel(c)) return null;
  const costN = SEAL_COST[lv];
  if ((c.tinhHoa ?? 0) < costN) return null;
  c.tinhHoa = (c.tinhHoa ?? 0) - costN;
  c.seals = { ...(c.forgeItem === w ? c.seals : {}), [el]: lv + 1 };
  const s = SEALS.find((x) => x.el === el)!;
  ctx.fx('layer', `Ấn ${s.name} ${lv + 1}`);
  return `Khắc ấn ${s.name} cấp ${lv + 1} lên ${item(w)?.name ?? 'vũ khí'} (${s.short}: ${s.per} mỗi cấp, -${costN} tinh hoa).`;
}

/** Hệ số từ ấn, dùng ở chỉ số chiến đấu và các hệ khác */
export const sealAtk = (c: Character) => 1 + sealLv(c, 'kim') * 0.04;
export const sealHp = (c: Character) => 1 + sealLv(c, 'moc') * 0.04;
export const sealDef = (c: Character) => 1 + sealLv(c, 'thuy') * 0.05;
export const sealExp = (c: Character) => 1 + sealLv(c, 'hoa') * 0.06;
export const sealFatal = (c: Character) => 1 - sealLv(c, 'tho') * 0.05;
