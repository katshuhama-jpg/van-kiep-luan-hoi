import { hit, playerStats, type Fighter } from './combat';
import { ELEMENTS, elemMul, elemRel, elementOf, type ElemRel } from './nguhanh';
import { addMile } from './miles';
import { fatal, giveItem } from './helpers';
import type { Character, EffectCtx, Element } from './types';
import { tr } from '../i18n';

/**
 * Ngũ Hành Vấn Tâm Đài: trước khi phi thăng phải lần lượt hạ 5 bóng của chính mình, mỗi bóng một hệ.
 * Bóng giống hệt bạn (cấp, chỉ số, trang bị), chỉ khác bản mệnh. Đánh từ dễ tới khó, bóng khắc bạn để cuối.
 * Cách lật thế: Ngũ Hành Ấn (săn quái), thế trận Công/Thủ/Hóa, Ngũ Hành Phù (đổi hệ một vòng), tâm cảnh.
 */

export const NHD_ROUNDS = 5;
/** tuổi tối thiểu để được lên Ngũ Hành Đài, phi thăng */
export const ASCEND_MIN_AGE = 120;
const KHAC: Record<Element, Element> = { kim: 'moc', moc: 'tho', tho: 'thuy', thuy: 'hoa', hoa: 'kim' };
const SINH: Record<Element, Element> = { kim: 'thuy', thuy: 'moc', moc: 'hoa', hoa: 'tho', tho: 'kim' };
/** hệ khắc được e */
export const khacBy = (e: Element): Element => (Object.keys(KHAC) as Element[]).find((k) => KHAC[k] === e)!;
const sinhBy = (e: Element): Element => (Object.keys(SINH) as Element[]).find((k) => SINH[k] === e)!;

/** Thứ tự 5 bóng: bóng bạn khắc, cùng hệ, bóng bạn sinh, bóng sinh bạn, bóng khắc bạn */
export function nhdOrder(me: Element): Element[] {
  return [KHAC[me], me, SINH[me], sinhBy(me), khacBy(me)];
}
export const ROUND_NAME = [tr('Bóng bạn khắc', "Shadow you overcome"), tr('Bóng cùng mệnh', "Shadow of your element"), tr('Bóng bạn sinh', "Shadow you nourish"), tr('Bóng sinh bạn', "Shadow that nourishes you"), tr('Bóng khắc bạn', "Shadow that overcomes you")];
/** bóng mạnh dần qua từng vòng */
const ROUND_POW = [0.95, 1.02, 1.06, 1.1, 1.15];
/** thua vòng nào thì có thể chết: vòng 1-4 là 6%, vòng cuối 20% */
export const deathChance = (round: number) => (round >= 4 ? 0.2 : 0.06);
export const NHD_DELAY = 8;
export const GUONG_LOSSES = 5;
export const AN_MAX = 5;
/** tỉ lệ nhận ấn mỗi con quái có hệ (trước 20%, giảm theo đợt cân bằng rơi đồ 26/10) */
export const AN_CHANCE = 0.15;
export const PHU_PRICE = 1500;

export type Stance = 'cong' | 'thu' | 'hoa';
export const STANCES: Record<Stance, { name: string; desc: string; tell: string }> = {
  cong: { name: tr('Công', "Attack"), desc: tr('Đòn của bạn +25%.', "Your strikes +25%."), tell: tr('Bóng của bạn dồn khí xuống quyền, sát khí bốc lên ngùn ngụt.', "Your shadow sinks its qi into its fists, killing intent boiling up.") },
  thu: { name: tr('Thủ', "Guard"), desc: tr('Sát thương nhận vào -35%.', "Damage taken -35%."), tell: tr('Bóng của bạn lùi nửa bước, khí bao quanh thân như một tấm khiên.', "Your shadow steps back half a pace, qi wrapped around it like a shield.") },
  hoa: { name: tr('Hóa', "Merge"), desc: tr('Xóa khắc chế của cả hai bên, coi như cùng mệnh. Đòn của bạn -10%.', "Cancels element counters on both sides, as if you shared an element. Your strikes -10%."), tell: tr('Bóng của bạn khép mắt, ngũ hành quanh người xoay tròn rồi tan vào nhau.', "Your shadow closes its eyes; the five elements swirl around it and melt into one.") },
};
/** thế thắng thế: Thủ chặn Công, Hóa phá Thủ, Công đánh trước khi Hóa kịp thành */
export const BEATS: Record<Stance, Stance> = { thu: 'cong', hoa: 'thu', cong: 'hoa' };
export const COUNTER_BONUS = 0.15;

export interface NhdState {
  won: number; // số vòng đã qua (giữ lại khi thua)
  lose5: number; // số lần thua vòng cuối
  tries: number;
  done?: boolean;
  warned?: boolean;
  lost?: number; // tổng số lần thua trên đài
}

export const nhdOf = (c: Character): NhdState => (c.nhd ??= { won: 0, lose5: 0, tries: 0 });
export const anOf = (c: Character, e: Element) => c.an?.[e] ?? 0;
export const needTrial = (c: Character) => !c.cosmos && c.realm === 7 && !c.nhd?.done;

/** Tâm cảnh: tâm ma cao thì bóng mạnh lên (tối đa +20%), đạo tâm vững (rất chính hoặc rất tà) thì bóng yếu đi */
export function mirrorMind(c: Character): { mul: number; text: string } {
  const up = Math.min(0.2, c.stats.tamMa / 250);
  const down = Math.abs(c.daoTam) >= 70 ? 0.1 : Math.abs(c.daoTam) >= 40 ? 0.05 : 0;
  const mul = 1 + up - down;
  const parts: string[] = [];
  if (up >= 0.02) parts.push(tr(`tâm ma làm bóng mạnh thêm ${Math.round(up * 100)}%`, `heart demons make the shadow ${Math.round(up * 100)}% stronger`));
  if (down) parts.push(tr(`đạo tâm vững làm bóng yếu đi ${Math.round(down * 100)}%`, `a steady Dao Heart makes the shadow ${Math.round(down * 100)}% weaker`));
  return { mul, text: parts.length ? parts.join(', ') : tr('tâm cảnh bình thường, bóng ngang bạn', "your mind is calm, the shadow matches you") };
}

/** Bóng chọn thế: vòng cuối hay chọn Công vì biết mình đang khắc bạn */
export function mirrorStance(round: number, rnd: () => number): Stance {
  const w: [Stance, number][] = round >= 4 ? [['cong', 0.5], ['thu', 0.3], ['hoa', 0.2]] : [['cong', 0.36], ['thu', 0.32], ['hoa', 0.32]];
  let r = rnd();
  for (const [s, p] of w) if ((r -= p) < 0) return s;
  return 'cong';
}
/** Lời lộ ý đồ của bóng: đúng 70%, còn lại là đòn nhử */
export function tellOf(real: Stance, rnd: () => number): Stance {
  if (rnd() < 0.7) return real;
  const others = (Object.keys(STANCES) as Stance[]).filter((s) => s !== real);
  return others[Math.floor(rnd() * others.length)];
}

export interface RoundMods {
  myEl: Element;
  foeEl: Element;
  rel: ElemRel; // quan hệ sau khi tính phù, thế Hóa
  pMul: number; // hệ số đòn bạn
  fMul: number; // hệ số đòn bóng
  notes: string[];
}

/** Phần ngũ hành của một vòng (chưa tính thế trận) */
export function elemPart(c: Character, round: number, usePhu: boolean, hoa = false): RoundMods {
  const base = elementOf(c);
  const foeEl = nhdOrder(base)[round];
  const myEl = usePhu ? khacBy(foeEl) : base;
  const notes: string[] = [];
  if (usePhu) notes.push(tr(`Ngũ Hành Phù đổi bản mệnh của bạn sang ${ELEMENTS[myEl].name}`, `A Five Elements Talisman changes your natal element to ${ELEMENTS[myEl].name}`));
  let pMul = hoa ? 1 : elemMul(myEl, foeEl);
  let fMul = hoa ? 1 : elemMul(foeEl, myEl);
  const rel: ElemRel = hoa ? 'dong' : elemRel(myEl, foeEl);
  if (hoa) notes.push(tr('Thế Hóa xóa khắc chế, hai bên như cùng mệnh', "Merge stance cancels counters - both sides as if one element"));
  // Ngũ Hành Ấn: mỗi ấn của hệ khắc được bóng gỡ 20% phần thiệt khi bị khắc
  if (rel === 'bi_khac') {
    const n = Math.min(AN_MAX, anOf(c, khacBy(foeEl)));
    if (n) {
      const k = n / AN_MAX;
      pMul = pMul + (1 - pMul) * k;
      fMul = fMul - (fMul - 1) * k;
      notes.push(tr(`${n} ấn ${ELEMENTS[khacBy(foeEl)].name} gỡ ${n * 20}% phần thiệt vì bị khắc`, `${n} ${ELEMENTS[khacBy(foeEl)].name} Seal(s) remove ${n * 20}% of the penalty for being overcome`));
    }
  }
  return { myEl, foeEl, rel, pMul, fMul, notes };
}

/** Tính hệ số một vòng */
export function roundMods(c: Character, round: number, my: Stance, foe: Stance, usePhu: boolean): RoundMods {
  const e = elemPart(c, round, usePhu, my === 'hoa' || foe === 'hoa');
  let { pMul, fMul } = e;
  const notes = e.notes;
  if (my === 'cong') pMul *= 1.25;
  if (my === 'thu') fMul *= 0.65;
  if (my === 'hoa') pMul *= 0.9;
  if (foe === 'cong') fMul *= 1.25;
  if (foe === 'thu') pMul *= 0.65;
  if (foe === 'hoa') fMul *= 0.9;
  if (BEATS[my] === foe) {
    pMul *= 1 + COUNTER_BONUS;
    fMul *= 1 - COUNTER_BONUS;
    notes.push(tr(`Thế ${STANCES[my].name} của bạn khắc thế ${STANCES[foe].name} của bóng`, `Your ${STANCES[my].name} stance beats the shadow's ${STANCES[foe].name} stance`));
  } else if (BEATS[foe] === my) {
    fMul *= 1 + COUNTER_BONUS;
    pMul *= 1 - COUNTER_BONUS;
    notes.push(tr(`Thế ${STANCES[foe].name} của bóng khắc thế ${STANCES[my].name} của bạn`, `The shadow's ${STANCES[foe].name} stance beats your ${STANCES[my].name} stance`));
  }
  return { ...e, pMul, fMul, notes };
}

/** Chỉ số của bóng vòng thứ round */
export function mirrorStats(c: Character, round: number): Fighter {
  const ps = playerStats(c);
  // Kiếp Số từ 3: bóng mạnh hơn
  const k = ROUND_POW[round] * mirrorMind(c).mul * (1 + ((c.kiepSo ?? 0) >= 7 ? 0.1 : (c.kiepSo ?? 0) >= 3 ? 0.05 : 0));
  return { hp: Math.round(ps.hp * k), atk: Math.round(ps.atk * k), def: Math.round(ps.def * k) };
}

/** Nhân vật của bóng để vẽ: giống hệt bạn, chỉ đổi bản mệnh */
export function mirrorChar(c: Character, round: number): Character {
  const el = nhdOrder(elementOf(c))[round];
  return { ...c, element: el, name: tr(`Bóng ${ELEMENTS[el].name}`, `${ELEMENTS[el].name} Shadow`) };
}

export const NHD_MAX_TURNS = 10;

/** Mô phỏng một vòng (dùng cho cân bằng) */
export function simulateRound(c: Character, round: number, my: Stance, foe: Stance, usePhu: boolean, rnd: () => number): boolean {
  const ps = playerStats(c);
  const fs = mirrorStats(c, round);
  const m = roundMods(c, round, my, foe, usePhu);
  let a = ps.hp;
  let b = fs.hp;
  for (let t = 0; t < NHD_MAX_TURNS; t++) {
    b -= Math.round(hit(ps.atk, fs.def, rnd).dmg * m.pMul);
    if (b <= 0) return true;
    a -= Math.round(hit(fs.atk, ps.def, rnd).dmg * m.fMul);
    if (a <= 0) return false;
  }
  return a / ps.hp > b / fs.hp;
}

/** Thắng một vòng */
export function winRound(c: Character): string {
  const s = nhdOf(c);
  s.won += 1;
  const el = nhdOrder(elementOf(c))[s.won - 1];
  if (s.won >= NHD_ROUNDS) {
    s.done = true;
    c.kiepBonus = (c.kiepBonus ?? 0) + 0.1;
    addMile(c, 'duel', tr('Qua Ngũ Hành Vấn Tâm Đài, ngũ hành viên mãn', "Passed the Five Elements Heart-Trial Platform - the five elements perfected"));
    // vật phẩm của đài: ai qua cũng có mảnh gương vỡ; thắng cả năm bóng mà chưa từng ngã thì có Viên Mãn châu
    giveItem(c, 'guong_van_tam', false);
    const perfect = !s.lost;
    if (perfect) giveItem(c, 'ngu_hanh_vien_man_chau', false);
    return tr(`Bóng ${ELEMENTS[el].name} vỡ tan như gương. Năm bóng của bạn hợp lại làm một, ngũ hành viên mãn. Cửa trời đã mở, thiên kiếp đang chờ (tỉ lệ vượt kiếp +10%). Bạn nhặt được mảnh Gương vỡ Vấn Tâm${perfect ? tr('. Năm sắc khí còn ngưng lại thành Ngũ Hành Viên Mãn châu, chỉ người chưa từng ngã trên đài mới có', ". The five-colored qi also condenses into a Five Elements Perfection Pearl, granted only to those who never fell on the platform") : ''}.`, `The ${ELEMENTS[el].name} Shadow shatters like a mirror. Your five shadows merge into one, the five elements perfected. The gate of Heaven stands open and the tribulation awaits (tribulation success +10%). You pick up a Shard of the Heart-Questioning Mirror${perfect ? tr('. Năm sắc khí còn ngưng lại thành Ngũ Hành Viên Mãn châu, chỉ người chưa từng ngã trên đài mới có', ". The five-colored qi also condenses into a Five Elements Perfection Pearl, granted only to those who never fell on the platform") : ''}.`);
  }
  return tr(`Bóng ${ELEMENTS[el].name} tan thành khói. Còn ${NHD_ROUNDS - s.won} bóng.`, `The ${ELEMENTS[el].name} Shadow dissolves into smoke. ${NHD_ROUNDS - s.won} shadow(s) remain.`);
}

/**
 * Thua một vòng: có thể chết (6%, vòng cuối 20%), không chết thì mất 15% tu vi, tâm ma +6, phải chờ 8 năm.
 * Thua bóng cuối lần thứ năm mà còn sống: bị giam trong gương mãi mãi (kết cục bí ẩn).
 */
export function loseRound(c: Character, ctx: EffectCtx): string {
  const s = nhdOf(c);
  const round = s.won;
  const el = nhdOrder(elementOf(c))[round];
  if (round >= 4) s.lose5 += 1;
  s.lost = (s.lost ?? 0) + 1;
  const f = fatal(c, ctx, deathChance(round), tr(`Gục ngã trước bóng ${ELEMENTS[el].name} của chính mình trên Ngũ Hành Đài.`, `Fell before your own ${ELEMENTS[el].name} Shadow on the Five Elements Platform.`));
  if (c.dead) return tr(`Bóng ${ELEMENTS[el].name} đâm xuyên ngực bạn. Bạn nhìn thấy chính mình mỉm cười, rồi mọi thứ tối sầm.`, `The ${ELEMENTS[el].name} Shadow runs you through the chest. You see yourself smiling, then everything goes dark.`);
  if (round >= 4 && s.lose5 >= GUONG_LOSSES) {
    c.dead = true;
    c.endTag = 'ket_guong';
    c.cause = tr('Thua chính mình quá nhiều lần, bị giam trong gương Ngũ Hành Đài.', "Lost to yourself too many times and was sealed inside the mirror of the Five Elements Platform.");
    c.stats.sucKhoe = 0;
    ctx.fx('death');
    return tr('Lần nữa ngã xuống, mặt gương gợn sóng rồi nuốt lấy bạn. Bóng của bạn bước ra ngoài, sống tiếp phần đời còn lại. Còn bạn, ở trong gương, nhìn mãi.', "You fall once more; the mirror's surface ripples and swallows you. Your shadow steps out and lives out the rest of your life. And you, inside the mirror, watch forever.");
  }
  c.cultivation = Math.round(c.cultivation * 0.85);
  c.stats.tamMa = Math.min(100, c.stats.tamMa + 6);
  c.breakDelay = Math.max(c.breakDelay, NHD_DELAY);
  return tr(`Bóng ${ELEMENTS[el].name} hạ gục bạn.${f ?? ''} Bạn bị hất khỏi Ngũ Hành Đài, tu vi tổn hao, tâm ma tăng. ${NHD_DELAY} năm nữa mới được lên đài lại${round ? tr(`, ${round} bóng đã hạ vẫn được giữ`, `, the ${round} shadow(s) you defeated still count`) : ''}.`, `The ${ELEMENTS[el].name} Shadow strikes you down.${f ?? ''} You are thrown off the Five Elements Platform, cultivation lost, heart demons rising. You may climb the platform again in ${NHD_DELAY} years${round ? tr(`, ${round} bóng đã hạ vẫn được giữ`, `, the ${round} shadow(s) you defeated still count`) : ''}.`);
}

/** Ấn khi diệt quái có hệ: chỉ quái không quá yếu, AN_CHANCE mỗi con */
export function gainAn(c: Character, el: Element | undefined, easy: boolean, rnd: () => number): string | null {
  if (!el || easy || c.cosmos) return null;
  const n = anOf(c, el);
  if (n >= AN_MAX || rnd() >= AN_CHANCE) return null;
  c.an = { ...(c.an ?? {}), [el]: n + 1 };
  return tr(`Thu được 1 Ngũ Hành Ấn hệ ${ELEMENTS[el].name} (${n + 1}/${AN_MAX}). Ấn giúp chống lại bóng bị hệ ${ELEMENTS[el].name} khắc chế trên Ngũ Hành Đài.`, `Obtained 1 ${ELEMENTS[el].name} Five Elements Seal (${n + 1}/${AN_MAX}). On the Five Elements Platform, seals help against shadows that ${ELEMENTS[el].name} overcomes.`);
}

/** Hệ ấn cần nhất cho bóng cuối */
export function keyAn(c: Character): Element {
  return khacBy(nhdOrder(elementOf(c))[4]);
}

/** Giới sẽ đến nếu phi thăng lúc này (cùng luật với engine): ma tu hoặc đạo tâm từ -40 xuống là ma, dưới 20 là Thái Hư, còn lại tiên */
export function destOf(c: Character): 'tien' | 'ma' | 'hu' {
  return c.daoTam <= -40 || c.path === 'ma' ? 'ma' : c.daoTam < 20 ? 'hu' : 'tien';
}

/** Sân đấu theo giới sắp đến và hệ của bóng: 3 x 5 = 15 nền */
export function arenaBg(c: Character, round: number): string {
  return `/bg/nhd-${destOf(c)}-${nhdOrder(elementOf(c))[round]}.png`;
}
