import { foeStats, lifeMul } from './duel';
import { BEATS, type Stance } from './nguHanhDai';
import { elemMul, elementOf } from './nguhanh';
import type { RivalChar } from './types';

/**
 * Lôi đài ba hiệp đấu trí: mỗi hiệp chọn Công, Thủ hay Hóa (Thủ chặn Công, Hóa phá Thủ, Công đánh trước khi Hóa kịp thành).
 * Chỉ số quyết định nền, thế đánh quyết định lật kèo. Thắng 2/3 hiệp là thắng trận.
 * Mỗi ngày một luật lôi đài khác nhau.
 */

export interface ArenaRule {
  id: string;
  name: string;
  desc: string;
}

export const ARENA_RULES: ArenaRule[] = [
  { id: 'hoa_van', name: 'Hỏa vận', desc: 'Người mang bản mệnh Hỏa mạnh thêm 15%.' },
  { id: 'thu_son', name: 'Thủ thế như sơn', desc: 'Thế Thủ khi thắng thế được thêm 10%.' },
  { id: 'cuong_phong', name: 'Cuồng phong', desc: 'Thế Công luôn mạnh thêm 8%, kể cả khi bị chặn.' },
  { id: 'vo_tuong', name: 'Vô tướng', desc: 'Đối thủ không để lộ ý đồ. Đoán bằng bản lĩnh.' },
  { id: 'kiem_khi', name: 'Kiếm khí tung hoành', desc: 'Kiếm tu mạnh thêm 15%.' },
  { id: 'phat_quang', name: 'Phật quang phổ chiếu', desc: 'Phật tu và Trận tu mạnh thêm 12%.' },
  { id: 'am_duong', name: 'Âm dương đảo lộn', desc: 'Thế khắc đảo ngược: Công chặn Thủ, Thủ phá Hóa, Hóa hóa giải Công.' },
  { id: 'thuy_van', name: 'Thủy vận', desc: 'Người mang bản mệnh Thủy mạnh thêm 15%.' },
];

/** Luật hôm nay theo ngày giờ Việt Nam (cả server cùng một luật) */
export function ruleOf(day: string): ArenaRule {
  let h = 0;
  for (const ch of day) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return ARENA_RULES[h % ARENA_RULES.length];
}

/** Thế thắng thế, có tính luật Âm dương đảo lộn */
export function beats(a: Stance, b: Stance, rule: ArenaRule): boolean {
  return rule.id === 'am_duong' ? BEATS[b] === a : BEATS[a] === b;
}

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

export function foeStance(foe: RivalChar, rnd: () => number): Stance {
  const w = HABIT[foe.path ?? ''] ?? [0.34, 0.33, 0.33];
  const r = rnd();
  return r < w[0] ? 'cong' : r < w[0] + w[1] ? 'thu' : 'hoa';
}

const TELLS: Record<Stance, string[]> = {
  cong: ['dồn khí xuống tay, sát khí bốc lên', 'nhón chân, như sắp lao tới'],
  thu: ['lùi nửa bước, khí bao quanh thân', 'trụ chân thật vững, mắt không rời bạn'],
  hoa: ['khép hờ mắt, khí quanh người xoay tròn', 'buông lỏng hai tay, như chờ đòn tới'],
};
/** Ý đồ đối thủ để lộ: đúng khoảng 65%, luật Vô tướng thì không lộ */
export function tellOf(real: Stance, rule: ArenaRule, rnd: () => number): { shown: Stance | null; text: string } {
  if (rule.id === 'vo_tuong') return { shown: null, text: 'Đối thủ đứng im như tượng, không đoán được gì.' };
  const all: Stance[] = ['cong', 'thu', 'hoa'];
  const shown = rnd() < 0.65 ? real : all.filter((s) => s !== real)[Math.floor(rnd() * 2)];
  const t = TELLS[shown][Math.floor(rnd() * TELLS[shown].length)];
  return { shown, text: `Đối thủ ${t}.` };
}

function power(r: RivalChar, rule: ArenaRule): number {
  const s = foeStats(r);
  let p = (s.atk + s.def * 0.6) * Math.sqrt(Math.max(1, s.hp));
  const el = elementOf(r);
  if (rule.id === 'hoa_van' && el === 'hoa') p *= 1.15;
  if (rule.id === 'thuy_van' && el === 'thuy') p *= 1.15;
  if (rule.id === 'kiem_khi' && r.path === 'kiem') p *= 1.15;
  if (rule.id === 'phat_quang' && (r.path === 'phat' || r.path === 'tran')) p *= 1.12;
  return p;
}

/** Sức mạnh nền của hai bên (đã tính ngũ hành và hồn mòn do luân hồi nhiều): xác suất thắng một hiệp nếu cùng thế */
export function baseChance(me: RivalChar, foe: RivalChar, rule: ArenaRule): number {
  const a = power(me, rule) * elemMul(elementOf(me), elementOf(foe)) * lifeMul(me.lifeNo ?? 1, foe.lifeNo ?? 1);
  const b = power(foe, rule) * elemMul(elementOf(foe), elementOf(me)) * lifeMul(foe.lifeNo ?? 1, me.lifeNo ?? 1);
  return 0.5 + 0.32 * Math.tanh(Math.log(a / b) * 1.3);
}

/** Xác suất thắng một hiệp khi biết thế của hai bên */
export function roundChance(base: number, my: Stance, foe: Stance, rule: ArenaRule): number {
  let p = base;
  if (beats(my, foe, rule)) p += 0.28 + (rule.id === 'thu_son' && my === 'thu' ? 0.1 : 0);
  else if (beats(foe, my, rule)) p -= 0.28 + (rule.id === 'thu_son' && foe === 'thu' ? 0.1 : 0);
  if (rule.id === 'cuong_phong') p += (my === 'cong' ? 0.08 : 0) - (foe === 'cong' ? 0.08 : 0);
  return Math.max(0.05, Math.min(0.95, p));
}

export const ROUND_TEXT = {
  win: ['Bạn đọc trúng ý đồ, một chưởng đẩy bóng đối thủ lùi ba bước.', 'Đòn của bạn tới trước một nhịp, đối thủ loạng choạng.', 'Bạn hóa giải gọn gàng rồi phản đòn.'],
  lose: ['Đối thủ chặn đúng đòn của bạn rồi trả lại gấp đôi.', 'Bạn trúng kế, ngực đau nhói.', 'Một đòn hiểm lách qua thế thủ của bạn.'],
};
