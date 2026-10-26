import { foeStats, lifeMul } from './duel';
import { BEATS, type Stance } from './nguHanhDai';
import { elemMul, elementOf } from './nguhanh';
import type { Element, PathId, RivalChar } from './types';

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
  { day: 1, id: 'hoa_van', name: 'Hỏa vận', desc: 'Bóng mang bản mệnh Hỏa mạnh thêm 15%.', el: 'hoa' },
  { day: 2, id: 'vo_tuong', name: 'Vô tướng', desc: 'Đối thủ không để lộ ý đồ. Chỉ còn đoán theo thói quen.', tells: 'none' },
  { day: 3, id: 'kiem_khi', name: 'Kiếm khí tung hoành', desc: 'Kiếm tu mạnh thêm 15%.', path: ['kiem'] },
  { day: 4, id: 'thu_son', name: 'Thủ thế như sơn', desc: 'Thế Thủ khi thắng thế được thêm 10%.', winBonus: { s: 'thu', v: 0.1 } },
  { day: 5, id: 'thuy_van', name: 'Thủy vận', desc: 'Bóng mang bản mệnh Thủy mạnh thêm 15%.', el: 'thuy' },
  { day: 6, id: 'am_duong', name: 'Âm dương đảo lộn', desc: 'Khắc chế đảo ngược: Công chặn Thủ, Thủ phá Hóa, Hóa giải Công.', reverse: true },
  { day: 7, id: 'phat_quang', name: 'Phật quang phổ chiếu', desc: 'Phật tu mạnh thêm 15%.', path: ['phat'] },
  { day: 8, id: 'tien_phat', name: 'Tiên phát chế nhân', desc: 'Hiệp đầu cả hai bắt buộc ra Công.', force1: 'cong' },
  { day: 9, id: 'chinh_khi', name: 'Chính khí hạo nhiên', desc: 'Bóng chính đạo (đạo tâm từ 20) mạnh thêm 12%.', dao: 'chinh' },
  { day: 10, id: 'moc_van', name: 'Mộc vận', desc: 'Bóng mang bản mệnh Mộc mạnh thêm 15%.', el: 'moc' },
  { day: 11, id: 'cuong_phong', name: 'Cuồng phong', desc: 'Thế Công luôn mạnh thêm 8%, kể cả khi bị chặn.', always: { s: 'cong', v: 0.08 } },
  { day: 12, id: 'tu_chien', name: 'Tử chiến', desc: 'Hiệp cuối, thế khắc nặng gấp rưỡi.', lastX: 1.5 },
  { day: 13, id: 'ma_khi', name: 'Ma khí ngập trời', desc: 'Ma tu mạnh thêm 15%.', path: ['ma'] },
  { day: 14, id: 'loan_tuong', name: 'Loạn tượng', desc: 'Ý đồ đối thủ để lộ phần lớn là giả.', tells: 'loan' },
  { day: 15, id: 'kim_van', name: 'Kim vận', desc: 'Bóng mang bản mệnh Kim mạnh thêm 15%.', el: 'kim' },
  { day: 16, id: 'nhat_chieu', name: 'Nhất chiêu định thắng bại', desc: 'Chỉ đánh một hiệp. Một lần đoán quyết định tất cả.', bo: 1 },
  { day: 17, id: 'ta_khi', name: 'Tà khí thịnh', desc: 'Bóng tà đạo (đạo tâm từ -20 trở xuống) mạnh thêm 12%.', dao: 'ta' },
  { day: 18, id: 'tham_do', name: 'Thăm dò', desc: 'Hiệp đầu cả hai bắt buộc ra Thủ.', force1: 'thu' },
  { day: 19, id: 'dan_huong', name: 'Đan hương', desc: 'Đan tu mạnh thêm 15%.', path: ['dan'] },
  { day: 20, id: 'nhu_thuy', name: 'Như thủy hóa giải', desc: 'Thế Hóa khi thắng thế được thêm 10%.', winBonus: { s: 'hoa', v: 0.1 } },
  { day: 21, id: 'tho_van', name: 'Thổ vận', desc: 'Bóng mang bản mệnh Thổ mạnh thêm 15%.', el: 'tho' },
  { day: 22, id: 'ngu_chien', name: 'Ngũ chiến tam thắng', desc: 'Đánh tối đa năm hiệp, thắng ba hiệp mới là thắng.', bo: 5 },
  { day: 23, id: 'trung_dung', name: 'Trung dung chi đạo', desc: 'Bóng trung lập (đạo tâm từ -19 tới 19) mạnh thêm 12%.', dao: 'trung' },
  { day: 24, id: 'bat_quai', name: 'Trận đồ bát quái', desc: 'Trận tu mạnh thêm 15%.', path: ['tran'] },
  { day: 25, id: 'ngu_hanh_te', name: 'Ngũ hành tề phục', desc: 'Không còn khắc chế ngũ hành, chỉ còn đấu trí.', noElem: true },
  { day: 26, id: 'hau_sinh', name: 'Hậu sinh khả úy', desc: 'Bóng dưới 80 tuổi mạnh thêm 12%.', age: 'tre' },
  { day: 27, id: 'yeu_phong', name: 'Yêu phong', desc: 'Yêu tu mạnh thêm 15%.', path: ['yeu'] },
  { day: 28, id: 'lien_hoan', name: 'Liên hoàn', desc: 'Thắng một hiệp thì hiệp sau mạnh thêm 8%.', chain: 'win' },
  { day: 29, id: 'tuong_khac', name: 'Tương khắc song bội', desc: 'Khắc chế ngũ hành nặng gấp đôi.', elemX2: true },
  { day: 30, id: 'gung_gia', name: 'Gừng càng già càng cay', desc: 'Bóng từ 150 tuổi mạnh thêm 12%.', age: 'gia' },
  { day: 31, id: 'nghich_canh', name: 'Nghịch cảnh', desc: 'Thua một hiệp thì hiệp sau mạnh thêm 10%; bên yếu hơn được kéo lại gần.', chain: 'lose', underdog: true },
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
  kiem: 'Kiếm tu thường ra tay trước.',
  ma: 'Ma tu ưa đánh mạnh, đôi khi giấu chiêu.',
  phat: 'Phật tu thích giữ thế thủ.',
  tran: 'Trận tu hay bày thế phòng ngự.',
  dan: 'Đan tu khó đoán, hay hóa giải.',
  yeu: 'Yêu tu dựa vào sức, thích xông lên.',
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
  cong: ['dồn khí xuống tay, sát khí bốc lên', 'nhón chân, như sắp lao tới', 'siết chặt binh khí, mắt đỏ ngầu'],
  thu: ['lùi nửa bước, khí bao quanh thân', 'trụ chân thật vững, mắt không rời bạn', 'thu tay về trước ngực'],
  hoa: ['khép hờ mắt, khí quanh người xoay tròn', 'buông lỏng hai tay, như chờ đòn tới', 'thở rất chậm, thân nhẹ như lá'],
};
/** Ý đồ để lộ: đúng 55%; Loạn tượng chỉ đúng 25%; Vô tướng không lộ */
export function tellOf(real: Stance, rule: ArenaRule, rnd: () => number): { shown: Stance | null; text: string } {
  if (rule.tells === 'none') return { shown: null, text: 'Đối thủ đứng im như tượng, không đoán được gì.' };
  const acc = rule.tells === 'loan' ? 0.25 : 0.55;
  const all: Stance[] = ['cong', 'thu', 'hoa'];
  const shown = rnd() < acc ? real : all.filter((s) => s !== real)[Math.floor(rnd() * 2)];
  const t = TELLS[shown][Math.floor(rnd() * TELLS[shown].length)];
  return { shown, text: `Đối thủ ${t}.` };
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
  win: ['Bạn đọc trúng ý đồ, một chưởng đẩy bóng đối thủ lùi ba bước.', 'Đòn của bạn tới trước một nhịp, đối thủ loạng choạng.', 'Bạn hóa giải gọn gàng rồi phản đòn.'],
  lose: ['Đối thủ chặn đúng đòn của bạn rồi trả lại gấp đôi.', 'Bạn trúng kế, ngực đau nhói.', 'Một đòn hiểm lách qua thế thủ của bạn.'],
};

/** Tên chiêu theo con đường và thế đánh, để bình luận trận đấu */
const MOVES: Record<string, Record<Stance, string[]>> = {
  kiem: { cong: ['Nhất Kiếm Phá Không', 'Lưu Tinh Kiếm Vũ'], thu: ['Kiếm Võng Hộ Thân', 'Bích Thủy Kiếm Bích'], hoa: ['Dĩ Nhu Khắc Cương', 'Kiếm Ý Như Phong'] },
  dan: { cong: ['Đan Hỏa Phần Thiên', 'Liệt Diễm Đan Châm'], thu: ['Hộ Thể Đan Khí', 'Ngọc Dịch Kim Thân'], hoa: ['Hóa Độc Thành Dược', 'Vạn Thảo Quy Nguyên'] },
  tran: { cong: ['Sát Trận Khởi Động', 'Vạn Kiếm Quy Tông Trận'], thu: ['Bát Môn Kim Tỏa Trận', 'Huyền Vũ Hộ Trận'], hoa: ['Mê Tung Ảo Trận', 'Càn Khôn Đảo Chuyển'] },
  phat: { cong: ['Đại Lực Kim Cang Chưởng', 'Phục Ma Côn Pháp'], thu: ['Kim Cang Bất Hoại Thể', 'Cà Sa Hộ Thân'], hoa: ['Niêm Hoa Vi Tiếu', 'Lục Tự Chân Ngôn'] },
  ma: { cong: ['Huyết Ma Trảo', 'Thiên Ma Giải Thể'], thu: ['Ma Khí Hộ Thể', 'Huyết Hải Hộ Thân'], hoa: ['Hấp Tinh Ma Công', 'Ảnh Ma Phân Thân'] },
  yeu: { cong: ['Yêu Thú Cuồng Kích', 'Hổ Khiếu Sơn Lâm'], thu: ['Thạch Bì Yêu Giáp', 'Quy Giáp Thần Công'], hoa: ['Huyễn Hình Độn Ảnh', 'Hồ Mị Mê Tâm'] },
  '': { cong: ['Mãnh Hổ Quyền', 'Khai Sơn Chưởng'], thu: ['Thiết Bố Sam', 'Trầm Thạch Bộ'], hoa: ['Phiêu Diêu Bộ Pháp', 'Lưu Thủy Thân Pháp'] },
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
  const lines = [`${me.name} thi triển “${a}” (${names[my]}).`, `${foe.name} đáp lại bằng “${b}” (${names[fs]}).`];
  if (beats(my, fs, rule)) lines.push(win ? `“${a}” khắc đúng “${b}”, đối thủ trở tay không kịp.` : `“${a}” khắc thế, nhưng nội lực đối thủ quá dày, đòn bị đỡ lại.`);
  else if (beats(fs, my, rule)) lines.push(win ? `“${b}” khắc thế, nhưng bạn liều mình lách qua, phản đòn trúng đích!` : `“${b}” khắc đúng “${a}”, bạn trúng kế.`);
  else lines.push(win ? 'Hai chiêu cùng thế va vào nhau, bạn nhỉnh hơn một nhịp.' : 'Hai chiêu cùng thế va vào nhau, đối thủ nhỉnh hơn một nhịp.');
  lines.push(win ? `Bạn thắng hiệp ${n}.` : `Bạn thua hiệp ${n}.`);
  return lines;
}
