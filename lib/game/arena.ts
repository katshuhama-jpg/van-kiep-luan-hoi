import { foeStats, lifeMul } from './duel';
import { BEATS, type Stance } from './nguHanhDai';
import { elemMul, elementOf } from './nguhanh';
import type { Element, PathId, RivalChar } from './types';
import { tr } from '../i18n';

/**
 * Lôi đài (bản 3.0.0): đấu trí kiểu Ngũ Hành Đài nhưng khó hơn.
 * - Bóng đối thủ được kéo về cùng cảnh giới với bóng của mình: thắng thua do bản mệnh, con đường, trang bị và cách đoán thế.
 * - Mỗi hiệp chọn Công, Thủ, Hóa. Thủ chặn Công, Hóa phá Thủ, Công đánh trước khi Hóa kịp thành.
 * - Đối thủ để lộ ý đồ chỉ đúng khoảng 55% (Ngũ Hành Đài 70%), và biết đọc thế hiệp trước của bạn.
 * - Mỗi ngày trong tháng một luật riêng (31 luật).
 */

export interface ArenaRule {
  day: number;
  id: string;
  name: string;
  desc: string;
  el?: Element; // bản mệnh được ưu thế
  path?: PathId[]; // con đường được ưu thế
  dao?: 'chinh' | 'ta' | 'trung';
  age?: 'tre' | 'gia';
  winBonus?: { s: Stance; v: number }; // thế này khi thắng thế được thêm
  always?: { s: Stance; v: number }; // thế này luôn được thêm
  reverse?: boolean; // khắc chế đảo ngược
  tells?: 'none' | 'loan';
  force1?: Stance; // hiệp đầu cả hai bắt buộc ra thế này
  lastX?: number; // hiệp cuối thế khắc mạnh hơn
  bo?: 1 | 5; // số hiệp tối đa (mặc định 3)
  noElem?: boolean;
  elemX2?: boolean;
  chain?: 'win' | 'lose'; // thắng (thua) một hiệp thì hiệp sau được thêm
  underdog?: boolean; // bên yếu hơn được kéo lại gần
}

export const ARENA_RULES: ArenaRule[] = [
  { day: 1, id: 'hoa_van', name: tr('Hỏa vận', "Fire Fortune"), desc: tr('Bóng mang bản mệnh Hỏa mạnh thêm 15%.', "Shadows of the Fire element are 15% stronger."), el: 'hoa' },
  { day: 2, id: 'vo_tuong', name: tr('Vô tướng', "Formless"), desc: tr('Đối thủ không để lộ ý đồ. Chỉ còn đoán theo thói quen.', "Opponents reveal nothing. You can only guess from their habits."), tells: 'none' },
  { day: 3, id: 'kiem_khi', name: tr('Kiếm khí tung hoành', "Sword Qi Unleashed"), desc: tr('Kiếm tu mạnh thêm 15%.', "Sword Cultivators are 15% stronger."), path: ['kiem'] },
  { day: 4, id: 'thu_son', name: tr('Thủ thế như sơn', "Defense Like a Mountain"), desc: tr('Thế Thủ khi thắng thế được thêm 10%.', "A winning Defense gains an extra 10%."), winBonus: { s: 'thu', v: 0.1 } },
  { day: 5, id: 'thuy_van', name: tr('Thủy vận', "Water Fortune"), desc: tr('Bóng mang bản mệnh Thủy mạnh thêm 15%.', "Shadows of the Water element are 15% stronger."), el: 'thuy' },
  { day: 6, id: 'am_duong', name: tr('Âm dương đảo lộn', "Yin and Yang Inverted"), desc: tr('Khắc chế đảo ngược: Công chặn Thủ, Thủ phá Hóa, Hóa giải Công.', "Counters reversed: Attack blocks Defense, Defense breaks Deflect, Deflect dissolves Attack."), reverse: true },
  { day: 7, id: 'phat_quang', name: tr('Phật quang phổ chiếu', "Buddha Light Shines"), desc: tr('Phật tu mạnh thêm 15%.', "Buddhist Cultivators are 15% stronger."), path: ['phat'] },
  { day: 8, id: 'tien_phat', name: tr('Tiên phát chế nhân', "Strike First"), desc: tr('Hiệp đầu cả hai bắt buộc ra Công.', "In round one, both sides must Attack."), force1: 'cong' },
  { day: 9, id: 'chinh_khi', name: tr('Chính khí hạo nhiên', "Vast Righteous Qi"), desc: tr('Bóng chính đạo (đạo tâm từ 20) mạnh thêm 12%.', "Righteous shadows (Yao Heart 20+) are 12% stronger."), dao: 'chinh' },
  { day: 10, id: 'moc_van', name: tr('Mộc vận', "Wood Fortune"), desc: tr('Bóng mang bản mệnh Mộc mạnh thêm 15%.', "Shadows of the Wood element are 15% stronger."), el: 'moc' },
  { day: 11, id: 'cuong_phong', name: tr('Cuồng phong', "Raging Gale"), desc: tr('Thế Công luôn mạnh thêm 8%, kể cả khi bị chặn.', "Attack is always 8% stronger, even when blocked."), always: { s: 'cong', v: 0.08 } },
  { day: 12, id: 'tu_chien', name: tr('Tử chiến', "Fight to the Death"), desc: tr('Hiệp cuối, thế khắc nặng gấp rưỡi.', "In the final round, counters hit 1.5 times as hard."), lastX: 1.5 },
  { day: 13, id: 'ma_khi', name: tr('Ma khí ngập trời', "Demonic Qi Fills the Sky"), desc: tr('Ma tu mạnh thêm 15%.', "Demonic Cultivators are 15% stronger."), path: ['ma'] },
  { day: 14, id: 'loan_tuong', name: tr('Loạn tượng', "Chaotic Omens"), desc: tr('Ý đồ đối thủ để lộ phần lớn là giả.', "Most of the intentions opponents reveal are fake."), tells: 'loan' },
  { day: 15, id: 'kim_van', name: tr('Kim vận', "Metal Fortune"), desc: tr('Bóng mang bản mệnh Kim mạnh thêm 15%.', "Shadows of the Metal element are 15% stronger."), el: 'kim' },
  { day: 16, id: 'nhat_chieu', name: tr('Nhất chiêu định thắng bại', "One Move Decides All"), desc: tr('Chỉ đánh một hiệp. Một lần đoán quyết định tất cả.', "Only one round. A single guess decides everything."), bo: 1 },
  { day: 17, id: 'ta_khi', name: tr('Tà khí thịnh', "Evil Qi Rising"), desc: tr('Bóng tà đạo (đạo tâm từ -20 trở xuống) mạnh thêm 12%.', "Evil shadows (Yao Heart -20 or lower) are 12% stronger."), dao: 'ta' },
  { day: 18, id: 'tham_do', name: tr('Thăm dò', "Probing"), desc: tr('Hiệp đầu cả hai bắt buộc ra Thủ.', "In round one, both sides must Defend."), force1: 'thu' },
  { day: 19, id: 'dan_huong', name: tr('Đan hương', "Pill Fragrance"), desc: tr('Đan tu mạnh thêm 15%.', "Alchemists are 15% stronger."), path: ['dan'] },
  { day: 20, id: 'nhu_thuy', name: tr('Như thủy hóa giải', "Yield Like Water"), desc: tr('Thế Hóa khi thắng thế được thêm 10%.', "A winning Deflect gains an extra 10%."), winBonus: { s: 'hoa', v: 0.1 } },
  { day: 21, id: 'tho_van', name: tr('Thổ vận', "Earth Fortune"), desc: tr('Bóng mang bản mệnh Thổ mạnh thêm 15%.', "Shadows of the Earth element are 15% stronger."), el: 'tho' },
  { day: 22, id: 'ngu_chien', name: tr('Ngũ chiến tam thắng', "Best of Five"), desc: tr('Đánh tối đa năm hiệp, thắng ba hiệp mới là thắng.', "Up to five rounds; win three to take the match."), bo: 5 },
  { day: 23, id: 'trung_dung', name: tr('Trung dung chi đạo', "The Middle Way"), desc: tr('Bóng trung lập (đạo tâm từ -19 tới 19) mạnh thêm 12%.', "Neutral shadows (Yao Heart -19 to 19) are 12% stronger."), dao: 'trung' },
  { day: 24, id: 'bat_quai', name: tr('Trận đồ bát quái', "Bagua Formation"), desc: tr('Trận tu mạnh thêm 15%.', "Formation Masters are 15% stronger."), path: ['tran'] },
  { day: 25, id: 'ngu_hanh_te', name: tr('Ngũ hành tề phục', "Five Elements Subdued"), desc: tr('Không còn khắc chế ngũ hành, chỉ còn đấu trí.', "No more element counters - only a battle of wits."), noElem: true },
  { day: 26, id: 'hau_sinh', name: tr('Hậu sinh khả úy', "Fear the Young"), desc: tr('Bóng dưới 80 tuổi mạnh thêm 12%.', "Shadows under 80 years old are 12% stronger."), age: 'tre' },
  { day: 27, id: 'yeu_phong', name: tr('Yêu phong', "Yao Wind"), desc: tr('Yêu tu mạnh thêm 15%.', "Yao Cultivators are 15% stronger."), path: ['yeu'] },
  { day: 28, id: 'lien_hoan', name: tr('Liên hoàn', "Chain Strikes"), desc: tr('Thắng một hiệp thì hiệp sau mạnh thêm 8%.', "Win a round and the next one is 8% stronger."), chain: 'win' },
  { day: 29, id: 'tuong_khac', name: tr('Tương khắc song bội', "Double Counter"), desc: tr('Khắc chế ngũ hành nặng gấp đôi.', "Element counters are twice as strong."), elemX2: true },
  { day: 30, id: 'gung_gia', name: tr('Gừng càng già càng cay', "Old Ginger Bites Hardest"), desc: tr('Bóng từ 150 tuổi mạnh thêm 12%.', "Shadows aged 150 or more are 12% stronger."), age: 'gia' },
  { day: 31, id: 'nghich_canh', name: tr('Nghịch cảnh', "Adversity"), desc: tr('Thua một hiệp thì hiệp sau mạnh thêm 10%; bên yếu hơn được kéo lại gần.', "Lose a round and the next one is 10% stronger; the weaker side is pulled closer."), chain: 'lose', underdog: true },
];

/** Ngày theo giờ Việt Nam dạng yyyy-mm-dd */
export function vnDate(offsetDays = 0): string {
  const d = new Date(Date.now() + 7 * 3600_000 + offsetDays * 86400_000);
  return d.toISOString().slice(0, 10);
}
/** Luật của một ngày (cả server cùng một luật, mỗi ngày trong tháng một luật) */
export function ruleOf(date: string = vnDate()): ArenaRule {
  const day = Number(date.slice(8, 10)) || 1;
  return ARENA_RULES[(day - 1) % ARENA_RULES.length];
}

/** Bóng đối thủ kéo về cùng cảnh giới với bóng của mình */
export function equalize(foe: RivalChar, me: RivalChar): RivalChar {
  return { ...foe, realm: me.realm, layer: me.layer, cosmos: me.cosmos ?? null, lifespan: me.lifespan };
}

export function beats(a: Stance, b: Stance, rule: ArenaRule): boolean {
  return rule.reverse ? BEATS[b] === a : BEATS[a] === b;
}
export const counterOf = (s: Stance, rule: ArenaRule): Stance => (['cong', 'thu', 'hoa'] as Stance[]).find((x) => beats(x, s, rule))!;

/** Thói quen ra đòn theo con đường tu tập: [Công, Thủ, Hóa] */
const HABIT: Record<string, [number, number, number]> = {
  kiem: [0.5, 0.2, 0.3],
  ma: [0.45, 0.2, 0.35],
  phat: [0.2, 0.5, 0.3],
  tran: [0.2, 0.45, 0.35],
  dan: [0.25, 0.3, 0.45],
  yeu: [0.4, 0.35, 0.25],
};
export const HABIT_TEXT: Record<string, string> = {
  kiem: tr('Kiếm tu thường ra tay trước.', "Sword Cultivators usually strike first."),
  ma: tr('Ma tu ưa đánh mạnh, đôi khi giấu chiêu.', "Demonic Cultivators love heavy blows, and sometimes hide their moves."),
  phat: tr('Phật tu thích giữ thế thủ.', "Buddhist Cultivators prefer to hold a defensive stance."),
  tran: tr('Trận tu hay bày thế phòng ngự.', "Formation Masters tend to set up defenses."),
  dan: tr('Đan tu khó đoán, hay hóa giải.', "Alchemists are hard to read and like to deflect."),
  yeu: tr('Yêu tu dựa vào sức, thích xông lên.', "Yao Cultivators rely on brute strength and love to charge."),
};

/** Thế đối thủ: theo thói quen; từ hiệp 2 có 35% đọc thế hiệp trước của bạn để khắc */
export function foeStance(foe: RivalChar, rnd: () => number, round: number, myLast: Stance | null, rule: ArenaRule): Stance {
  if (round === 0 && rule.force1) return rule.force1;
  if (myLast && rnd() < 0.35) return counterOf(myLast, rule);
  const w = HABIT[foe.path ?? ''] ?? [0.34, 0.33, 0.33];
  const r = rnd();
  return r < w[0] ? 'cong' : r < w[0] + w[1] ? 'thu' : 'hoa';
}

const TELLS: Record<Stance, string[]> = {
  cong: [tr('dồn khí xuống tay, sát khí bốc lên', "sinks qi into their hands, killing intent rising"), tr('nhón chân, như sắp lao tới', "rises onto their toes, as if about to lunge"), tr('siết chặt binh khí, mắt đỏ ngầu', "grips their weapon tight, eyes bloodshot")],
  thu: [tr('lùi nửa bước, khí bao quanh thân', "steps half a pace back, qi wrapped around their body"), tr('trụ chân thật vững, mắt không rời bạn', "plants their feet firmly, eyes never leaving you"), tr('thu tay về trước ngực', "draws their hands back to their chest")],
  hoa: [tr('khép hờ mắt, khí quanh người xoay tròn', "half-closes their eyes, qi swirling around them"), tr('buông lỏng hai tay, như chờ đòn tới', "lets both arms hang loose, as if waiting for a blow"), tr('thở rất chậm, thân nhẹ như lá', "breathes very slowly, body light as a leaf")],
};
/** Ý đồ để lộ: đúng 55%; Loạn tượng chỉ đúng 25%; Vô tướng không lộ */
export function tellOf(real: Stance, rule: ArenaRule, rnd: () => number): { shown: Stance | null; text: string } {
  if (rule.tells === 'none') return { shown: null, text: tr('Đối thủ đứng im như tượng, không đoán được gì.', "Your opponent stands still as a statue. Nothing to read.") };
  const acc = rule.tells === 'loan' ? 0.25 : 0.55;
  const all: Stance[] = ['cong', 'thu', 'hoa'];
  const shown = rnd() < acc ? real : all.filter((s) => s !== real)[Math.floor(rnd() * 2)];
  const t = TELLS[shown][Math.floor(rnd() * TELLS[shown].length)];
  return { shown, text: tr(`Đối thủ ${t}.`, `Your opponent ${t}.`) };
}

/** Bóng này có được luật hôm nay ưu ái không */
export const fitsRule = (r: RivalChar, rule: ArenaRule) => ruleMul(r, rule) > 1;

function ruleMul(r: RivalChar, rule: ArenaRule): number {
  let m = 1;
  if (rule.el && elementOf(r) === rule.el) m *= 1.15;
  if (rule.path && r.path && rule.path.includes(r.path)) m *= 1.15;
  if (rule.dao === 'chinh' && r.daoTam >= 20) m *= 1.12;
  if (rule.dao === 'ta' && r.daoTam <= -20) m *= 1.12;
  if (rule.dao === 'trung' && Math.abs(r.daoTam) < 20) m *= 1.12;
  if (rule.age === 'tre' && r.age < 80) m *= 1.12;
  if (rule.age === 'gia' && r.age >= 150) m *= 1.12;
  return m;
}

function power(r: RivalChar): number {
  const s = foeStats(r);
  return (s.atk + s.def * 0.6) * Math.sqrt(Math.max(1, s.hp));
}

/** Xác suất nền thắng một hiệp (khi hai thế hòa nhau), đối thủ đã kéo về cùng cảnh giới */
export function baseChance(me: RivalChar, foe: RivalChar, rule: ArenaRule): number {
  const e = (a: RivalChar, b: RivalChar) => {
    if (rule.noElem) return 1;
    const v = elemMul(elementOf(a), elementOf(b));
    return rule.elemX2 ? 1 + (v - 1) * 2 : v;
  };
  const a = power(me) * e(me, foe) * ruleMul(me, rule) * lifeMul(me.lifeNo ?? 1, foe.lifeNo ?? 1);
  const b = power(foe) * e(foe, me) * ruleMul(foe, rule) * lifeMul(foe.lifeNo ?? 1, me.lifeNo ?? 1);
  let p = 0.5 + 0.3 * Math.tanh(Math.log(a / b) * 1.4);
  if (rule.underdog) p = 0.5 + (p - 0.5) * 0.6;
  return p;
}

/** Xác suất thắng một hiệp khi biết thế hai bên */
export function roundChance(base: number, my: Stance, foe: Stance, rule: ArenaRule, ctx: { last: boolean; myWonLast: boolean | null }): number {
  let p = base;
  const k = 0.26 * (ctx.last && rule.lastX ? rule.lastX : 1);
  if (beats(my, foe, rule)) p += k + (rule.winBonus?.s === my ? rule.winBonus.v : 0);
  else if (beats(foe, my, rule)) p -= k + (rule.winBonus?.s === foe ? rule.winBonus.v : 0);
  if (rule.always) p += (my === rule.always.s ? rule.always.v : 0) - (foe === rule.always.s ? rule.always.v : 0);
  if (rule.chain === 'win' && ctx.myWonLast !== null) p += ctx.myWonLast ? 0.08 : -0.08;
  if (rule.chain === 'lose' && ctx.myWonLast !== null) p += ctx.myWonLast ? -0.1 : 0.1;
  return Math.max(0.05, Math.min(0.95, p));
}

export const bestOf = (rule: ArenaRule) => rule.bo ?? 3;
export const needWins = (rule: ArenaRule) => Math.floor(bestOf(rule) / 2) + 1;

export const ROUND_TEXT = {
  win: [tr('Bạn đọc trúng ý đồ, một chưởng đẩy bóng đối thủ lùi ba bước.', "You read their intent - one palm drives your opponent's shadow back three steps."), tr('Đòn của bạn tới trước một nhịp, đối thủ loạng choạng.', "Your blow lands a beat earlier; your opponent staggers."), tr('Bạn hóa giải gọn gàng rồi phản đòn.', "You deflect cleanly and counter.")],
  lose: [tr('Đối thủ chặn đúng đòn của bạn rồi trả lại gấp đôi.', "Your opponent blocks your blow perfectly and returns it twofold."), tr('Bạn trúng kế, ngực đau nhói.', "You fall for the trick - pain stabs through your chest."), tr('Một đòn hiểm lách qua thế thủ của bạn.', "A vicious blow slips past your guard.")],
};

/** Tên chiêu theo con đường và thế đánh, để bình luận trận đấu */
const MOVES: Record<string, Record<Stance, string[]>> = {
  kiem: { cong: [tr('Nhất Kiếm Phá Không', "One Sword Splits the Void"), tr('Lưu Tinh Kiếm Vũ', "Meteor Sword Rain")], thu: [tr('Kiếm Võng Hộ Thân', "Sword Net Shield"), tr('Bích Thủy Kiếm Bích', "Jade Water Sword Wall")], hoa: [tr('Dĩ Nhu Khắc Cương', "Soft Overcomes Hard"), tr('Kiếm Ý Như Phong', "Sword Intent Like Wind")] },
  dan: { cong: [tr('Đan Hỏa Phần Thiên', "Pill Fire Burns Heaven"), tr('Liệt Diễm Đan Châm', "Blazing Pill Needles")], thu: [tr('Hộ Thể Đan Khí', "Protective Pill Qi"), tr('Ngọc Dịch Kim Thân', "Jade Elixir Golden Body")], hoa: [tr('Hóa Độc Thành Dược', "Poison into Medicine"), tr('Vạn Thảo Quy Nguyên', "Ten Thousand Herbs Return to Origin")] },
  tran: { cong: [tr('Sát Trận Khởi Động', "Killing Array Unleashed"), tr('Vạn Kiếm Quy Tông Trận', "Ten Thousand Swords Formation")], thu: [tr('Bát Môn Kim Tỏa Trận', "Eight Gates Golden Lock Formation"), tr('Huyền Vũ Hộ Trận', "Black Tortoise Guardian Formation")], hoa: [tr('Mê Tung Ảo Trận', "Maze of Illusions"), tr('Càn Khôn Đảo Chuyển', "Heaven and Earth Reversed")] },
  phat: { cong: [tr('Đại Lực Kim Cang Chưởng', "Great Strength Vajra Palm"), tr('Phục Ma Côn Pháp', "Demon-Subduing Staff Art")], thu: [tr('Kim Cang Bất Hoại Thể', "Indestructible Vajra Body"), tr('Cà Sa Hộ Thân', "Kasaya Shield")], hoa: [tr('Niêm Hoa Vi Tiếu', "Holding a Flower, Smiling"), tr('Lục Tự Chân Ngôn', "Six-Syllable Mantra")] },
  ma: { cong: [tr('Huyết Ma Trảo', "Blood Demon Claw"), tr('Thiên Ma Giải Thể', "Heavenly Demon Dissolution")], thu: [tr('Ma Khí Hộ Thể', "Demonic Qi Shield"), tr('Huyết Hải Hộ Thân', "Blood Sea Shield")], hoa: [tr('Hấp Tinh Ma Công', "Essence-Draining Demonic Art"), tr('Ảnh Ma Phân Thân', "Shadow Demon Clone")] },
  yeu: { cong: [tr('Yêu Thú Cuồng Kích', "Beast Frenzy Strike"), tr('Hổ Khiếu Sơn Lâm', "Tiger Roars Through the Forest")], thu: [tr('Thạch Bì Yêu Giáp', "Stone Skin Yao Armor"), tr('Quy Giáp Thần Công', "Turtle Shell Divine Art")], hoa: [tr('Huyễn Hình Độn Ảnh', "Phantom Form Shadow Escape"), tr('Hồ Mị Mê Tâm', "Fox Charm Bewitchment")] },
  '': { cong: [tr('Mãnh Hổ Quyền', "Fierce Tiger Fist"), tr('Khai Sơn Chưởng', "Mountain-Splitting Palm")], thu: [tr('Thiết Bố Sam', "Iron Shirt"), tr('Trầm Thạch Bộ', "Sinking Stone Step")], hoa: [tr('Phiêu Diêu Bộ Pháp', "Drifting Footwork"), tr('Lưu Thủy Thân Pháp', "Flowing Water Body Art")] },
};
export function moveOf(r: RivalChar, s: Stance, rnd: () => number): string {
  const set = MOVES[r.path ?? ''] ?? MOVES[''];
  const l = set[s];
  return l[Math.floor(rnd() * l.length)];
}

/** Bình luận một hiệp: chiêu hai bên, thế nào khắc thế nào, kết quả */
export function commentary(n: number, me: RivalChar, foe: RivalChar, my: Stance, fs: Stance, win: boolean, rule: ArenaRule, rnd: () => number, names: Record<Stance, string>): string[] {
  const a = moveOf(me, my, rnd);
  const b = moveOf(foe, fs, rnd);
  const lines = [tr(`${me.name} thi triển “${a}” (${names[my]}).`, `${me.name} unleashes “${a}” (${names[my]}).`), tr(`${foe.name} đáp lại bằng “${b}” (${names[fs]}).`, `${foe.name} answers with “${b}” (${names[fs]}).`)];
  if (beats(my, fs, rule)) lines.push(win ? tr(`“${a}” khắc đúng “${b}”, đối thủ trở tay không kịp.`, `“${a}” counters “${b}” perfectly - your opponent can't react in time.`) : tr(`“${a}” khắc thế, nhưng nội lực đối thủ quá dày, đòn bị đỡ lại.`, `“${a}” has the edge, but your opponent's inner force is too deep and the blow is blocked.`));
  else if (beats(fs, my, rule)) lines.push(win ? tr(`“${b}” khắc thế, nhưng bạn liều mình lách qua, phản đòn trúng đích!`, `“${b}” has the edge, but you risk it all, slip past and land a counter!`) : tr(`“${b}” khắc đúng “${a}”, bạn trúng kế.`, `“${b}” counters “${a}” perfectly - you fell for it.`));
  else lines.push(win ? tr('Hai chiêu cùng thế va vào nhau, bạn nhỉnh hơn một nhịp.', "The two moves clash in the same stance; you're a beat faster.") : tr('Hai chiêu cùng thế va vào nhau, đối thủ nhỉnh hơn một nhịp.', "The two moves clash in the same stance; your opponent is a beat faster."));
  lines.push(win ? tr(`Bạn thắng hiệp ${n}.`, `You win round ${n}.`) : tr(`Bạn thua hiệp ${n}.`, `You lose round ${n}.`));
  return lines;
}
