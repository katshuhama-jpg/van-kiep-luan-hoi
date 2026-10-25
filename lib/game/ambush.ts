import { MONSTERS, combatLevel, effLv, growth, killExp, killReward, monsterStats, type Fighter, type Monster } from './combat';
import { addCult, fatal, money, stat } from './helpers';
import type { Character, EffectCtx } from './types';

/**
 * Quái chặn đường: bất chợt bắt người chơi phải đánh, không được từ chối.
 * Chỉ quái thường (không boss). 30% quái kém cấp, 60% quái ngang cấp, 10% quái hơn cấp.
 * Đánh tối đa 3 hiệp, hết 3 hiệp chưa phân thắng bại thì hai bên rút.
 */

export const AMBUSH_TURNS = 3;
/** xác suất bị chặn đường mỗi năm (khi không đi trừ yêu) */
export const AMBUSH_PER_YEAR = 0.15;
/** quái chặn đường là con lẻ, máu ít hơn quái trong ổ (trước 0.35, người chơi thắng quá dễ) */
const AMBUSH_HP = 0.6;

export type AmbushTier = 'kem' | 'bang' | 'hon';

/**
 * Chọn quái chặn đường.
 * - Cấp quái tính theo cấp người chơi chứ không theo cấp gốc của loài, nên mỗi lần một khác:
 *   kém cấp: thấp hơn 2-4 cấp; ngang cấp: lệch -1 đến +1; hơn cấp: cao hơn 2-4 cấp.
 * - Loài quái chọn trong các loài có cấp gốc gần đó (±8), bỏ qua 3 loài vừa gặp gần nhất.
 * Trả về bản sao quái đã chỉnh cấp, để tu vi, tên, chỉ số đều theo cấp mới.
 */
export function pickAmbush(c: Character, rnd: () => number): { m: Monster; tier: AmbushTier } {
  const pool = MONSTERS.filter((m) => !m.boss);
  const cl = combatLevel(c);
  const r = rnd();
  const tier: AmbushTier = r < 0.3 ? 'kem' : r < 0.9 ? 'bang' : 'hon';
  const ri = (a: number, b: number) => a + Math.floor(rnd() * (b - a + 1));
  const delta = tier === 'kem' ? -ri(2, 4) : tier === 'hon' ? ri(2, 4) : ri(-1, 1);
  const target = Math.max(1, cl + delta);
  const seen = c.ambushSeen ?? [];
  let cands = pool.filter((m) => Math.abs(m.lv - target) <= 8 && !seen.includes(m.id));
  if (cands.length < 3) {
    // ít loài quanh tầm này: lấy thêm các loài gần nhất chưa gặp
    const rest = pool.filter((m) => !seen.includes(m.id)).sort((a, b) => Math.abs(a.lv - target) - Math.abs(b.lv - target));
    cands = Array.from(new Set([...cands, ...rest.slice(0, 5)]));
  }
  const base = cands[Math.floor(rnd() * cands.length)];
  c.ambushSeen = [...seen, base.id].slice(-3);
  // effLv = lv + growth, nên trừ growth để ra đúng cấp mong muốn
  const m: Monster = { ...base, lv: Math.max(1, target - growth(c, base)) };
  return { m, tier };
}

export function ambushMonsterStats(c: Character, m: Monster): Fighter {
  const s = monsterStats(m, effLv(c, m));
  return { ...s, hp: Math.max(1, Math.round(s.hp * AMBUSH_HP)) };
}

export const AMBUSH_INTRO: Record<AmbushTier, string> = {
  kem: 'Một con quái nhỏ lao ra chặn đường.',
  bang: 'Quái vật chặn đường! Không tránh được, phải đánh.',
  hon: 'Một con quái mạnh hơn bạn chặn đường. Nguy rồi!',
};

/**
 * Kết thúc trận chặn đường. pLoss: tỉ lệ máu bạn mất (0-1), mDealt: tỉ lệ máu quái mất (0-1).
 * Không thắng thì luôn phải trả giá: bỏ chạy rơi linh thạch, bị thương, quái mạnh còn có thể giết người.
 */
export function finishAmbush(c: Character, m: Monster, result: 'win' | 'lose' | 'draw', pLoss: number, mDealt: number, ctx: EffectCtx, tier: AmbushTier = 'bang'): string[] {
  const danger = tier === 'hon' ? 1.6 : tier === 'kem' ? 0.6 : 1;
  if (result === 'win') {
    const notes = [`Bạn hạ được ${m.name} chặn đường (+${killExp(c, m)} tu vi).`];
    notes.push(...killReward(c, m, ctx));
    const hurt = Math.round(pLoss * 25);
    if (hurt >= 3) {
      stat(c, 'sucKhoe', -hurt);
      notes.push(`Thắng nhưng cũng mang thương tích (-${hurt} sức khỏe).`);
    }
    return notes;
  }
  ctx.fx('hurt', result === 'lose' ? 'Trọng thương' : 'Bị thương');
  // rơi đồ khi chạy trốn hoặc gục ngã
  const drop = Math.round(c.linhThach * (result === 'lose' ? 0.2 + ctx.rnd() * 0.15 : 0.05 + ctx.rnd() * 0.1));
  const lost = drop > 0 ? ` Túi bị rách, rơi mất ${drop} linh thạch.` : '';
  money(c, -drop);
  if (result === 'lose') {
    const f = fatal(c, ctx, 0.3 * danger, `Bị ${m.name} chặn đường giữa nơi hoang vắng. Không ai tới cứu.`);
    if (c.dead) return [`${m.name} chặn đường, bạn không địch nổi.${f ?? ''}`];
    stat(c, 'sucKhoe', -Math.round(35 * danger));
    c.cultivation = Math.max(0, Math.round(c.cultivation * 0.93));
    return [`${m.name} đánh bạn trọng thương rồi bỏ đi (-${Math.round(35 * danger)} sức khỏe, tu vi tổn hao).${lost}${f ?? ''}`];
  }
  // hòa: hết 3 hiệp chưa phân thắng bại
  if (mDealt >= 0.5 && mDealt > pLoss) {
    const hurt = Math.round(pLoss * 30);
    stat(c, 'sucKhoe', -hurt);
    const exp = Math.max(1, Math.round(killExp(c, m) * 0.3));
    addCult(c, exp);
    return [`Ba hiệp chưa phân thắng bại, ${m.name} bị thương bỏ chạy. Bạn rút được chút kinh nghiệm (+${exp} tu vi, -${hurt} sức khỏe).`];
  }
  // phải bỏ chạy: bị đánh sau lưng, rơi linh thạch, có thể trọng thương
  const hurt = Math.round((12 + pLoss * 30) * danger);
  stat(c, 'sucKhoe', -hurt);
  const notes = [`Ba hiệp không hạ được ${m.name}, bạn đành bỏ chạy, trúng một đòn sau lưng (-${hurt} sức khỏe).${lost}`];
  if (ctx.rnd() < 0.25 * danger) {
    const f = fatal(c, ctx, 0.08 * danger, `Bỏ chạy khỏi ${m.name}, vết thương sau lưng nhiễm độc. Bạn gục xuống giữa đường.`);
    if (c.dead) return [notes[0] + (f ?? '')];
    stat(c, 'tamMa', 6);
    notes.push(`Vết thương sau lưng mưng mủ mãi không lành, đêm nằm mơ thấy ${m.name} đuổi theo (+tâm ma).${f ?? ''}`);
  }
  return notes;
}
