import type { Character, Element, RivalChar } from './types';
import { tr } from '../i18n';

/** Ngũ hành: mỗi người một bản mệnh. Tương khắc khi giao đấu giữa người với người. */
export const ELEMENTS: Record<Element, { name: string; color: string; sym: string }> = {
  kim: { name: tr('Kim', "Metal"), color: '#e6e0b0', sym: tr('Kim', "Metal") },
  moc: { name: tr('Mộc', "Wood"), color: '#5ac86a', sym: tr('Mộc', "Wood") },
  thuy: { name: tr('Thủy', "Water"), color: '#5a9ae0', sym: tr('Thủy', "Water") },
  hoa: { name: tr('Hỏa', "Fire"), color: '#e85a3a', sym: tr('Hỏa', "Fire") },
  tho: { name: tr('Thổ', "Earth"), color: '#c8963a', sym: tr('Thổ', "Earth") },
};
export const ELEMENT_IDS = Object.keys(ELEMENTS) as Element[];

// Kim khắc Mộc, Mộc khắc Thổ, Thổ khắc Thủy, Thủy khắc Hỏa, Hỏa khắc Kim
const KHAC: Record<Element, Element> = { kim: 'moc', moc: 'tho', tho: 'thuy', thuy: 'hoa', hoa: 'kim' };
// Kim sinh Thủy, Thủy sinh Mộc, Mộc sinh Hỏa, Hỏa sinh Thổ, Thổ sinh Kim
const SINH: Record<Element, Element> = { kim: 'thuy', thuy: 'moc', moc: 'hoa', hoa: 'tho', tho: 'kim' };

/** Bản mệnh; nhân vật cũ chưa có thì suy từ hạt giống ngoại hình để luôn cố định */
export function elementOf(x: Pick<Character, 'element' | 'lookSeed' | 'name'> | Pick<RivalChar, 'element' | 'lookSeed' | 'name'>): Element {
  if (x.element) return x.element;
  let h = x.lookSeed ?? 0;
  if (!h) for (let i = 0; i < x.name.length; i++) h = (h * 31 + x.name.charCodeAt(i)) >>> 0;
  return ELEMENT_IDS[(h >>> 3) % 5];
}

export type ElemRel = 'khac' | 'bi_khac' | 'sinh' | 'duoc_sinh' | 'dong';
/** quan hệ của a đối với b */
export function elemRel(a: Element, b: Element): ElemRel {
  if (a === b) return 'dong';
  if (KHAC[a] === b) return 'khac';
  if (KHAC[b] === a) return 'bi_khac';
  if (SINH[a] === b) return 'sinh';
  return 'duoc_sinh';
}

/** hệ số sát thương khi a đánh b: khắc +50%, bị khắc -30%, được sinh +10% */
export function elemMul(a: Element, b: Element): number {
  const r = elemRel(a, b);
  return r === 'khac' ? 1.5 : r === 'bi_khac' ? 0.7 : r === 'duoc_sinh' ? 1.1 : 1;
}

/** chữ ngắn hiện trên đòn đánh */
export function elemHitTag(a: Element, b: Element): string | undefined {
  const r = elemRel(a, b);
  return r === 'khac' ? tr(`${ELEMENTS[a].sym} khắc ${ELEMENTS[b].sym}!`, `${ELEMENTS[a].sym} overcomes ${ELEMENTS[b].sym}!`) : r === 'bi_khac' ? tr(`${ELEMENTS[a].sym} bị khắc`, `${ELEMENTS[a].sym} is overcome`) : undefined;
}

export function elemText(me: Element, foe: Element): { text: string; tone: 'good' | 'bad' | 'normal' } {
  const A = ELEMENTS[me].name;
  const B = ELEMENTS[foe].name;
  const r = elemRel(me, foe);
  if (r === 'khac') return { text: tr(`Bạn mệnh ${A}, khắc ${B} của đối thủ. Đòn của bạn +50%, đòn của đối thủ -30%.`, `Your element is ${A}, which overcomes your opponent's ${B}. Your hits +50%, their hits -30%.`), tone: 'good' };
  if (r === 'bi_khac') return { text: tr(`Đối thủ mệnh ${B}, khắc ${A} của bạn. Bất lợi: đòn của bạn -30%, đòn của đối thủ +50%.`, `Your opponent's element is ${B}, which overcomes your ${A}. Disadvantage: your hits -30%, their hits +50%.`), tone: 'bad' };
  if (r === 'sinh') return { text: tr(`${A} sinh ${B}: đánh nhau không hơn không kém, nhưng kết giao thì hợp nhau.`, `${A} generates ${B}: evenly matched in a fight, but a good match as friends.`), tone: 'normal' };
  if (r === 'duoc_sinh') return { text: tr(`${B} sinh ${A}: khí của đối thủ nuôi dưỡng bạn, đòn của bạn +10%. Kết giao rất có lợi.`, `${B} generates ${A}: your opponent's qi nourishes you, your hits +10%. A very fruitful bond.`), tone: 'normal' };
  return { text: tr(`Cùng mệnh ${A}: ngang ngửa, không ai khắc ai.`, `Both ${A}: evenly matched, neither overcomes the other.`), tone: 'normal' };
}
