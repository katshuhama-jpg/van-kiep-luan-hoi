import { ITEMS } from './data';
import type { Character, EffectCtx, Element, Slot } from './types';
import { tr } from '../i18n';

/**
 * Phân giải, bán và Rèn (bản sau 3.2.0): đồ thừa trong túi có chỗ dùng mà không cần chợ.
 * - Đồ thừa: bán lấy linh thạch (đồ thường lời hơn) hoặc phân giải ra tinh thiết (đồ hiếm lời hơn).
 * - Tinh thiết cũng mua được ở lò rèn bằng linh thạch, giá tăng theo cảnh giới.
 * - Rèn: tinh thiết nâng vũ khí đang cầm +1 tới +5, mỗi bậc công +6% và hiệu ứng hệ ngũ hành của vũ khí lên một cấp.
 *   Càng cao càng khó; từ +2 lên +3 trở đi rèn hỏng có thể vỡ, mất luôn vũ khí (thần binh truyền đời không vỡ).
 * Cấp rèn gắn với đúng thanh vũ khí, đổi vũ khí thì không theo. Không bán, không trao đổi giữa người chơi.
 */

export const FORGE_MAX = 5;
export const FORGE_PER = 0.06;
export const FORGE_COST = [2, 3, 5, 8, 12]; // tinh thiết mỗi lần gõ (trung bình lên +3 khoảng 14, +4 khoảng 34, +5 khoảng 82)
export const FORGE_CHANCE = [0.95, 0.8, 0.6, 0.4, 0.25]; // càng lên cao càng khó
export const FORGE_BREAK = [0, 0, 0.08, 0.22, 0.35]; // rèn hỏng thì có tỉ lệ vỡ mất đồ, từ +2 lên +3 trở đi

const item = (id: string) => ITEMS.find((i) => i.id === id);

/** Tinh thiết nhận được khi phân giải một món */
export function smeltValue(id: string): number {
  const it = item(id);
  if (!it) return 0;
  return [1, 2, 4, 8][it.rare ?? 0] + (it.minRealm >= 4 ? 1 : 0) + (it.minRealm >= 7 ? 2 : 0);
}

/** Giá bán đồ thừa (cùng công thức bán đồ rơi khi đã có) */
export function sellValue(id: string): number {
  const it = item(id);
  if (!it) return 0;
  return Math.round(40 + (it.price || 80) * 0.5 + (it.rare ?? 0) * 120);
}

/** Giá một tinh thiết ở lò rèn, tăng theo cảnh giới để vẫn là chỗ tiêu tiền khi giàu */
export const tinhPrice = (c: Character) => Math.round(40 * (1 + 0.4 * Math.min(c.realm, 8)));

export function sell(c: Character, id: string, ctx: EffectCtx): string | null {
  if (!canSmelt(c, id)) return null;
  const v = sellValue(id);
  c.inventory = c.inventory.filter((x) => x !== id);
  c.linhThach += v;
  ctx.fx('buy', tr(`+${v} linh thạch`, `+${v} spirit stones`));
  return tr(`Bán ${item(id)?.name} được ${v} linh thạch.`, `Sold ${item(id)?.name} for ${v} spirit stones.`);
}

export function buyTinh(c: Character, n: number, ctx: EffectCtx): string | null {
  const cost = tinhPrice(c) * n;
  if (c.linhThach < cost || n <= 0) return null;
  c.linhThach -= cost;
  c.tinhHoa = (c.tinhHoa ?? 0) + n;
  ctx.fx('buy', tr(`+${n} tinh thiết`, `+${n} refined iron`));
  return tr(`Mua ${n} tinh thiết ở lò rèn, tốn ${cost} linh thạch.`, `Bought ${n} refined iron at the forge for ${cost} spirit stones.`);
}

/** Món này có bán hay phân giải được không: không đang mặc, không phải thần binh truyền đời */
export const canSmelt = (c: Character, id: string) => c.inventory.includes(id) && !Object.values(c.equipped).includes(id) && c.legend?.item !== id && smeltValue(id) > 0;

export function smelt(c: Character, id: string, ctx: EffectCtx): string | null {
  if (!canSmelt(c, id)) return null;
  const v = smeltValue(id);
  c.inventory = c.inventory.filter((x) => x !== id);
  c.tinhHoa = (c.tinhHoa ?? 0) + v;
  ctx.fx('buy', tr(`+${v} tinh thiết`, `+${v} refined iron`));
  return tr(`Phân giải ${item(id)?.name}, thu ${v} tinh thiết (đang có ${c.tinhHoa}).`, `Dismantled ${item(id)?.name}, got ${v} refined iron (now ${c.tinhHoa}).`);
}

/** Cấp rèn của món đang mặc ở một ô (vũ khí lưu ở c.forge/c.forgeItem như cũ; áo, phụ kiện ở c.forges) */
export function forgeLv(c: Character, slot: Slot = 'vu_khi'): number {
  const id = c.equipped[slot];
  if (!id) return 0;
  if (slot === 'vu_khi') return c.forgeItem === id ? (c.forge ?? 0) : 0;
  const f = c.forges?.[slot];
  return f && f.id === id ? f.lv : 0;
}
/** Cấp rèn của vũ khí đang cầm */
export const forgeLevel = (c: Character) => forgeLv(c, 'vu_khi');
/** Rèn vũ khí: công; rèn áo: thủ; rèn phụ kiện: sinh lực. Mỗi cấp +6% */
export const forgeMul = (c: Character) => 1 + forgeLv(c, 'vu_khi') * FORGE_PER;
export const forgeDefMul = (c: Character) => 1 + forgeLv(c, 'ao') * FORGE_PER;
export const forgeHpMul = (c: Character) => 1 + forgeLv(c, 'phu_kien') * FORGE_PER;
export const FORGE_STAT: Record<Slot, string> = { vu_khi: tr('công', 'attack'), ao: tr('thủ', 'defense'), phu_kien: tr('sinh lực', 'HP') };

/* ---------------- Thuộc tính ngũ hành của trang bị ----------------
 * Mỗi món trang bị ngẫu nhiên mang một hệ (mỗi kiếp một khác). Rèn vũ khí lên cấp nào thì hiệu ứng hệ đó lên cấp đó.
 */
export const EL_FX: { el: Element; name: string; per: string; short: string }[] = [
  { el: 'kim', name: tr('Kim', "Metal"), per: tr('công +4%', "Attack +4%"), short: tr('Sắc bén', "Keen") },
  { el: 'moc', name: tr('Mộc', "Wood"), per: tr('sinh lực +4%, mỗi năm hồi 1 sức khỏe', "HP +4%, recover 1 Health per year"), short: tr('Sinh cơ', "Vital") },
  { el: 'thuy', name: tr('Thủy', "Water"), per: tr('thủ +5%', "Defense +5%"), short: tr('Nhu thủy', "Flowing") },
  { el: 'hoa', name: tr('Hỏa', "Fire"), per: tr('trừ yêu thêm 6% tu vi', "+6% cultivation from hunting demons"), short: tr('Bạo viêm', "Blaze") },
  { el: 'tho', name: tr('Thổ', "Earth"), per: tr('hiểm cảnh khó giết hơn 5%', "5% harder to kill in perilous situations"), short: tr('Hậu thổ', "Bedrock") },
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

/** Cấp hiệu ứng hệ `el` đang có: cộng cấp rèn của các món đang mặc mang hệ đó, tối đa 5 */
export const sealLv = (c: Character, el: Element) =>
  Math.min(
    FORGE_MAX,
    (['vu_khi', 'ao', 'phu_kien'] as Slot[]).reduce((a, s) => {
      const id = c.equipped[s];
      return a + (id && itemEl(c, id) === el ? forgeLv(c, s) : 0);
    }, 0),
  );
export const sealAtk = (c: Character) => 1 + sealLv(c, 'kim') * 0.04;
export const sealHp = (c: Character) => 1 + sealLv(c, 'moc') * 0.04;
export const sealDef = (c: Character) => 1 + sealLv(c, 'thuy') * 0.05;
export const sealExp = (c: Character) => 1 + sealLv(c, 'hoa') * 0.06;
export const sealFatal = (c: Character) => 1 - sealLv(c, 'tho') * 0.05;

/** Tỉ lệ vỡ khi rèn hỏng ở cấp hiện tại (thần binh truyền đời không vỡ) */
export const breakChance = (c: Character, slot: Slot = 'vu_khi') => (c.legend?.item && c.legend.item === c.equipped[slot] ? 0 : FORGE_BREAK[forgeLv(c, slot)] ?? 0);

export type ForgeResult = { kind: 'ok' | 'fail' | 'break'; text: string; lv: number };

export function forge(c: Character, ctx: EffectCtx, slot: Slot = 'vu_khi'): ForgeResult | null {
  const w = c.equipped[slot];
  if (!w) return null;
  const lv = forgeLv(c, slot);
  if (lv >= FORGE_MAX) return null;
  const costN = FORGE_COST[lv];
  if ((c.tinhHoa ?? 0) < costN) return null;
  c.tinhHoa = (c.tinhHoa ?? 0) - costN;
  const name = item(w)?.name ?? tr('trang bị', 'gear');
  const el = elFx(itemEl(c, w));
  const set = (n: number) => {
    if (slot === 'vu_khi') {
      c.forgeItem = n ? w : undefined;
      c.forge = n;
    } else c.forges = { ...(c.forges ?? {}), [slot]: { id: w, lv: n } };
  };
  if (ctx.rnd() < FORGE_CHANCE[lv]) {
    set(lv + 1);
    ctx.fx('layer', `${name} +${lv + 1}`);
    return { kind: 'ok', lv: lv + 1, text: tr(`Lửa lò đỏ rực, ${name} lên +${lv + 1}: ${FORGE_STAT[slot]} +${Math.round((lv + 1) * FORGE_PER * 100)}%, hệ ${el.name} cấp ${lv + 1} (-${costN} tinh thiết).`, `The forge fire blazes red, ${name} rises to +${lv + 1}: ${FORGE_STAT[slot]} +${Math.round((lv + 1) * FORGE_PER * 100)}%, ${el.name} element level ${lv + 1} (-${costN} refined iron).`) };
  }
  if (ctx.rnd() < breakChance(c, slot)) {
    // vỡ: mất luôn món đồ
    c.inventory = c.inventory.filter((x) => x !== w);
    delete c.equipped[slot];
    set(0);
    ctx.fx('hurt', tr('Vỡ đồ', 'Gear shattered'));
    return { kind: 'break', lv: 0, text: tr(`Một tiếng "choang", ${name} +${lv} vỡ nát dưới búa. Mất luôn món đồ (-${costN} tinh thiết).`, `With a loud "clang", ${name} +${lv} shatters under the hammer. The item is gone (-${costN} refined iron).`) };
  }
  ctx.fx('hurt', tr('Rèn hỏng', "Forging failed"));
  return { kind: 'fail', lv, text: tr(`Búa giáng lệch một nhịp, tinh thiết bốc thành khói. ${name} vẫn giữ +${lv} (-${costN} tinh thiết).`, `The hammer falls a beat off and the refined iron goes up in smoke. ${name} stays at +${lv} (-${costN} refined iron).`) };
}
