/**
 * Trận lôi đài kiểu máu (27/10): đánh tới khi một bên gục.
 * - Mỗi lượt chọn thế (Công, Thủ, Hóa) như cũ và gắn một ấn ngũ hành vào chiêu (3 ấn ngẫu nhiên mỗi lượt).
 * - Bên thắng thế gây sát thương; Thủ đúng lúc thì không mất máu và phản đòn nhẹ; cùng thế thì cả hai cùng trúng nhẹ.
 * - Hành của chiêu khắc hành của đối thủ thì nặng hơn, bị khắc thì nhẹ đi (theo bảng ngũ hành).
 * - Nội lực đầy 5 ô thì tung tuyệt kỹ theo con đường. Đối thủ đầy nội lực sẽ báo trước một lượt; người chơi đỡ bằng nhịp.
 * Xác suất thắng thế vẫn lấy từ roundChance (sức mạnh, luật ngày, ngũ hành bản mệnh), nên 31 luật vẫn còn ý nghĩa.
 */
import { beats, counterOf, foeStance, moveOf, roundChance, tellOf, type ArenaRule } from './arena';
import type { Stance } from './nguHanhDai';
import { ELEMENT_IDS, elemMul, elementOf } from './nguhanh';
import type { Element, RivalChar } from './types';
import { tr } from '../i18n';

export const KI_MAX = 5;
export const TURN_CAP = 14;
const D = 11; // sát thương gốc mỗi đòn với 100 máu
const SKILL_DAMP = 0.15;
const ULT_CAP = 0.3; // một tuyệt kỹ tối đa 30% máu, để không có trận thua trắng vì một đòn

export type Parry = 'perfect' | 'good' | 'miss';
export interface Side {
  hp: number;
  max: number;
  ki: number;
}
export interface FightState {
  me: Side;
  foe: Side;
  turn: number;
  myLast: Stance | null;
  myWonLast: boolean | null;
  foeUltNext: boolean; // đối thủ đã đủ nội lực, lượt tới tung tuyệt kỹ
  over: null | 'win' | 'lose';
}
export interface Intent {
  stance: Stance;
  el: Element;
  tell: { shown: Stance | null; text: string };
  elShown: Element | null; // hành để lộ (có thể sai)
}
export interface TurnResult {
  kind: 'trade' | 'ult_me' | 'ult_foe';
  my?: Stance;
  foe?: Stance;
  myEl?: Element;
  foeEl?: Element;
  winner: 'me' | 'foe' | 'clash';
  toFoe: number;
  toMe: number;
  crit: boolean;
  elemTag: 'khac' | 'bi_khac' | null; // hành chiêu của bên đánh trúng so với bên kia
  parry?: Parry;
}

export const hpOf = (rule: ArenaRule) => (rule.bo === 1 ? 50 : rule.bo === 5 ? 150 : 100);

export function newFight(rule: ArenaRule): FightState {
  const hp = hpOf(rule);
  return { me: { hp, max: hp, ki: 0 }, foe: { hp, max: hp, ki: 0 }, turn: 0, myLast: null, myWonLast: null, foeUltNext: false, over: null };
}

/** Ba ấn ngũ hành mỗi lượt: luôn có bản mệnh của mình, thêm hai hành khác ngẫu nhiên */
export function handOf(me: RivalChar, rnd: () => number): Element[] {
  const own = elementOf(me);
  const rest = ELEMENT_IDS.filter((e) => e !== own).sort(() => rnd() - 0.5);
  return [own, rest[0], rest[1]].sort(() => rnd() - 0.5);
}

/** Ý đồ của đối thủ lượt này: thế, hành, và điều để lộ ra */
export function foeIntent(foe: RivalChar, st: FightState, rule: ArenaRule, rnd: () => number, me?: RivalChar): Intent {
  const stance = foeStance(foe, rnd, st.turn, st.myLast, rule);
  const own = elementOf(foe);
  // đối thủ biết bản mệnh của bạn: hay chọn hành khắc nó (ấn bản mệnh luôn có trong tay bạn)
  const vsMe = me ? ELEMENT_IDS.find((e) => elemMul(e, elementOf(me)) > 1.2) : undefined;
  const r = rnd();
  const el = vsMe && r < 0.35 ? vsMe : r < 0.7 ? own : ELEMENT_IDS[Math.floor(rnd() * 5)];
  const tell = tellOf(stance, rule, rnd);
  const acc = rule.tells === 'none' ? -1 : rule.tells === 'loan' ? 0.25 : 0.42;
  const elShown = acc < 0 ? null : rnd() < acc ? el : ELEMENT_IDS.filter((e) => e !== el)[Math.floor(rnd() * 4)];
  return { stance, el, tell, elShown };
}

function elemOf(a: Element, b: Element, rule: ArenaRule): number {
  if (rule.noElem) return 1;
  // chiêu khắc hành: x1.3, bị khắc: x0.82 (Tương khắc song bội: gấp đôi độ lệch)
  const v = 1 + (elemMul(a, b) - 1) * 0.5;
  return rule.elemX2 ? 1 + (v - 1) * 2 : v;
}
const tagOf = (m: number): TurnResult['elemTag'] => (m > 1.2 ? 'khac' : m < 0.9 ? 'bi_khac' : null);
/** Tử chiến: đánh vào bên dưới 30% máu thì nặng gấp rưỡi */
const lowX = (def: Side, rule: ArenaRule) => (rule.lastX && def.hp / def.max < 0.3 ? rule.lastX : 1);

/** Một lượt trao đổi chiêu thường */
export function trade(st: FightState, base: number, my: Stance, myEl: Element, it: Intent, rule: ArenaRule, rnd: () => number): TurnResult {
  // trận máu dài ~10 lượt nên lợi thế mỗi lượt cộng dồn: giảm bớt độ lệch do đoán đúng thế để kỹ năng không quyết định tuyệt đối
  const b0 = 0.5 + (base - 0.5) * 0.6;
  const p = b0 + (roundChance(b0, my, it.stance, rule, { last: false, myWonLast: st.myWonLast }) - b0) * SKILL_DAMP;
  const meWins = rnd() < p;
  const clash = my === it.stance;
  const crit = rnd() < 0.08;
  const cx = crit ? 1.5 : 1;
  let toFoe = 0;
  let toMe = 0;
  let tag: TurnResult['elemTag'] = null;
  if (clash) {
    // cùng thế: va nhau, bên thắng thế trúng nhẹ hơn
    const mA = elemOf(myEl, it.el, rule);
    const mB = elemOf(it.el, myEl, rule);
    toFoe = D * 0.5 * mA * (meWins ? 1.2 : 0.8) * lowX(st.foe, rule);
    toMe = D * 0.5 * mB * (meWins ? 0.8 : 1.2) * lowX(st.me, rule);
    tag = tagOf(meWins ? mA : mB);
  } else if (meWins) {
    const m = elemOf(myEl, it.el, rule);
    tag = tagOf(m);
    const khac = beats(my, it.stance, rule);
    if (my === 'thu' && khac) {
      // Thủ đúng lúc: không mất máu, phản đòn nhẹ
      toFoe = D * 0.6 * m * cx * lowX(st.foe, rule);
    } else toFoe = D * (khac ? 1.3 : 1) * m * cx * lowX(st.foe, rule);
  } else {
    const m = elemOf(it.el, myEl, rule);
    tag = tagOf(m);
    const khac = beats(it.stance, my, rule);
    if (it.stance === 'thu' && khac) toMe = D * 0.6 * m * cx * lowX(st.me, rule);
    else toMe = D * (khac ? 1.3 : 1) * m * cx * lowX(st.me, rule);
  }
  return { kind: 'trade', my, foe: it.stance, myEl, foeEl: it.el, winner: clash ? 'clash' : meWins ? 'me' : 'foe', toFoe: Math.round(toFoe), toMe: Math.round(toMe), crit, elemTag: tag };
}

/** Tuyệt kỹ của mình: chắc chắn trúng, mạnh theo hành bản mệnh khắc bản mệnh đối thủ và sức mạnh hai bên */
export function myUlt(me: RivalChar, foe: RivalChar, base: number, st: FightState, rule: ArenaRule): TurnResult {
  const m = elemOf(elementOf(me), elementOf(foe), rule);
  const toFoe = Math.round(Math.min(st.foe.max * ULT_CAP, D * 2.2 * m * (0.7 + base * 0.6) * lowX(st.foe, rule)));
  return { kind: 'ult_me', winner: 'me', toFoe, toMe: 0, crit: false, elemTag: tagOf(m) };
}

/** Tuyệt kỹ của đối thủ: người chơi đỡ bằng nhịp. Đúng nhịp thì phản đòn, hơi lệch thì đỡ được phần lớn */
export function foeUlt(me: RivalChar, foe: RivalChar, base: number, st: FightState, rule: ArenaRule, parry: Parry): TurnResult {
  const m = elemOf(elementOf(foe), elementOf(me), rule);
  const full = Math.min(st.me.max * ULT_CAP, D * 2.2 * m * (0.7 + (1 - base) * 0.6) * lowX(st.me, rule));
  const toMe = Math.round(parry === 'perfect' ? 0 : parry === 'good' ? full * 0.75 : full);
  const toFoe = Math.round(parry === 'perfect' ? full * 0.15 : 0);
  return { kind: 'ult_foe', winner: parry === 'miss' ? 'foe' : 'me', toFoe, toMe, crit: false, elemTag: tagOf(m), parry };
}

/** Áp kết quả lượt vào trạng thái trận */
export function apply(st: FightState, r: TurnResult): FightState {
  const me = { ...st.me, hp: Math.max(0, st.me.hp - r.toMe) };
  const foe = { ...st.foe, hp: Math.max(0, st.foe.hp - r.toFoe) };
  if (r.kind === 'ult_me') me.ki = 0;
  else if (r.kind === 'ult_foe') {
    foe.ki = 0;
    me.ki = Math.min(KI_MAX, me.ki + (r.parry === 'perfect' ? 2 : 1));
  } else {
    me.ki = Math.min(KI_MAX, me.ki + 1 + (r.winner === 'me' ? 1 : 0) + (r.my === 'thu' && r.winner === 'me' && r.toFoe > 0 && r.toMe === 0 && r.foe === 'cong' ? 1 : 0));
    foe.ki = Math.min(KI_MAX, foe.ki + 1 + (r.winner === 'foe' ? 1 : 0));
  }
  const turn = st.turn + 1;
  let over: FightState['over'] = null;
  if (foe.hp <= 0) over = 'win';
  else if (me.hp <= 0) over = 'lose';
  else if (turn >= TURN_CAP) over = me.hp / me.max >= foe.hp / foe.max ? 'win' : 'lose';
  return {
    me,
    foe,
    turn,
    myLast: r.my ?? st.myLast,
    myWonLast: r.kind === 'trade' ? r.winner === 'me' : st.myWonLast,
    foeUltNext: !over && r.kind !== 'ult_foe' && foe.ki >= KI_MAX,
    over,
  };
}

/** Gợi ý cho nút Tự đánh: khắc thế để lộ, chọn ấn khắc hành để lộ */
export function autoPick(it: Intent, hand: Element[], rule: ArenaRule, rnd: () => number): { s: Stance; el: Element } {
  const s = it.tell.shown ? counterOf(it.tell.shown, rule) : (['cong', 'thu', 'hoa'] as Stance[])[Math.floor(rnd() * 3)];
  const el = it.elShown ? (hand.find((e) => elemMul(e, it.elShown!) > 1.2) ?? hand.find((e) => elemMul(e, it.elShown!) >= 1) ?? hand[0]) : hand[0];
  return { s, el };
}

/** Tên tuyệt kỹ theo con đường */
export const ULT_NAME: Record<string, string> = {
  kiem: tr('Vạn Kiếm Quy Tông', "Ten Thousand Swords Return"),
  ma: tr('Huyết Hải Ma Đao', "Blood Sea Demon Blade"),
  phat: tr('Kim Cang La Hán', "Vajra Arhat"),
  tran: tr('Tru Tiên Kiếm Trận', "Immortal-Slaying Sword Array"),
  dan: tr('Cửu Chuyển Đan Hỏa', "Nine-Turn Pill Flame"),
  yeu: tr('Yêu Thần Giáng Thế', "Yao God Descends"),
  '': tr('Toàn Lực Nhất Kích', "All-Out Strike"),
};
export const ultName = (r: RivalChar) => ULT_NAME[r.path ?? ''] ?? ULT_NAME[''];

/** Lời bình một lượt: chiêu hai bên (theo con đường và hành), kết quả, số máu */
export function turnLines(r: TurnResult, me: RivalChar, foe: RivalChar, rnd: () => number): string[] {
  const elName: Record<Element, string> = { kim: tr('Kim', "Metal"), moc: tr('Mộc', "Wood"), thuy: tr('Thủy', "Water"), hoa: tr('Hỏa', "Fire"), tho: tr('Thổ', "Earth") };
  if (r.kind === 'ult_me') return [tr(`${me.name} dồn toàn bộ nội lực, tung tuyệt kỹ “${ultName(me)}”!`, `${me.name} pours out all their inner force and unleashes the ultimate move “${ultName(me)}”!`), tr(`${foe.name} trúng trọn, mất ${r.toFoe} máu.${r.elemTag === 'khac' ? tr(' Bản mệnh khắc chế, uy lực tăng vọt.', " Natal element overcome - the power soars.") : ''}`, `${foe.name} takes it head on, losing ${r.toFoe} HP.${r.elemTag === 'khac' ? tr(' Bản mệnh khắc chế, uy lực tăng vọt.', " Natal element overcome - the power soars.") : ''}`)];
  if (r.kind === 'ult_foe') {
    const head = tr(`${foe.name} tung tuyệt kỹ “${ultName(foe)}”!`, `${foe.name} unleashes the ultimate move “${ultName(foe)}”!`);
    if (r.parry === 'perfect') return [head, tr(`Bạn đón đúng nhịp, hóa giải toàn bộ rồi phản đòn: ${foe.name} mất ${r.toFoe} máu.`, `You meet it right on the beat, neutralize it all and counter: ${foe.name} loses ${r.toFoe} HP.`)];
    if (r.parry === 'good') return [head, tr(`Bạn đỡ được phần lớn, vẫn mất ${r.toMe} máu.`, `You block most of it, but still lose ${r.toMe} HP.`)];
    return [head, tr(`Bạn chậm một nhịp, trúng trọn, mất ${r.toMe} máu.`, `You're a beat too slow and take it full on, losing ${r.toMe} HP.`)];
  }
  const a = moveOf(me, r.my!, rnd);
  const b = moveOf(foe, r.foe!, rnd);
  const lines = [tr(`${me.name}: “${a}” hệ ${elName[r.myEl!]}.`, `${me.name}: “${a}”, ${elName[r.myEl!]} element.`), tr(`${foe.name}: “${b}” hệ ${elName[r.foeEl!]}.`, `${foe.name}: “${b}”, ${elName[r.foeEl!]} element.`)];
  const tag = r.elemTag === 'khac' ? tr(' Hành khắc chế!', " Element advantage!") : r.elemTag === 'bi_khac' ? tr(' Hành bị khắc, đòn nhẹ đi.', " Element countered, the blow weakens.") : '';
  const crit = r.crit ? tr(' Chí mạng!', " Critical!") : '';
  if (r.winner === 'clash') lines.push(tr(`Hai chiêu cùng thế va nhau. Bạn mất ${r.toMe}, đối thủ mất ${r.toFoe} máu.${tag}`, `Two moves of the same stance collide. You lose ${r.toMe}, your opponent loses ${r.toFoe} HP.${tag}`));
  else if (r.winner === 'me') lines.push(r.toMe === 0 && r.my === 'thu' ? tr(`Bạn chặn gọn rồi phản đòn, đối thủ mất ${r.toFoe} máu.${tag}${crit}`, `You block cleanly and counter; your opponent loses ${r.toFoe} HP.${tag}${crit}`) : tr(`Bạn đánh trúng, đối thủ mất ${r.toFoe} máu.${tag}${crit}`, `You land a hit; your opponent loses ${r.toFoe} HP.${tag}${crit}`));
  else lines.push(r.foe === 'thu' && r.toFoe === 0 ? tr(`Đối thủ chặn gọn rồi phản đòn, bạn mất ${r.toMe} máu.${tag}${crit}`, `Your opponent blocks cleanly and counters; you lose ${r.toMe} HP.${tag}${crit}`) : tr(`Bạn trúng đòn, mất ${r.toMe} máu.${tag}${crit}`, `You get hit, losing ${r.toMe} HP.${tag}${crit}`));
  return lines;
}
