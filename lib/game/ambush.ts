import { MONSTERS, combatLevel, effLv, killExp, killReward, monsterStats, type Fighter, type Monster } from './combat';
import { addCult, fatal, stat } from './helpers';
import type { Character, EffectCtx } from './types';

/**
 * Quái chặn đường: bất chợt bắt người chơi phải đánh, không được từ chối.
 * Chỉ quái thường (không boss). 30% quái kém cấp, 60% quái ngang cấp, 10% quái hơn cấp.
 * Đánh tối đa 3 hiệp, hết 3 hiệp chưa phân thắng bại thì hai bên rút.
 */

export const AMBUSH_TURNS = 3;
/** xác suất bị chặn đường mỗi năm (khi không đi trừ yêu) */
export const AMBUSH_PER_YEAR = 0.15;
/** quái chặn đường là con lẻ, máu ít hơn quái trong ổ */
const AMBUSH_HP = 0.35;

export type AmbushTier = 'kem' | 'bang' | 'hon';

function nearest(list: Monster[], target: number, c: Character): Monster[] {
  return [...list].sort((a, b) => Math.abs(effLv(c, a) - target) - Math.abs(effLv(c, b) - target));
}

export function pickAmbush(c: Character, rnd: () => number): { m: Monster; tier: AmbushTier } {
  const pool = MONSTERS.filter((m) => !m.boss);
  const cl = combatLevel(c);
  const r = rnd();
  const tier: AmbushTier = r < 0.3 ? 'kem' : r < 0.9 ? 'bang' : 'hon';
  let cands: Monster[];
  if (tier === 'kem') cands = pool.filter((m) => effLv(c, m) < cl - 1 && effLv(c, m) >= cl - 6);
  else if (tier === 'hon') cands = pool.filter((m) => effLv(c, m) >= cl + 2 && effLv(c, m) <= cl + 4);
  else cands = pool.filter((m) => Math.abs(effLv(c, m) - cl) <= 1);
  if (!cands.length) {
    // không có loài đúng tầm thì lấy loài gần nhất theo hướng mong muốn
    const target = tier === 'kem' ? cl - 3 : tier === 'hon' ? cl + 3 : cl;
    cands = nearest(pool, target, c).slice(0, 2);
  }
  return { m: cands[Math.floor(rnd() * cands.length)], tier };
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

/** Kết thúc trận chặn đường. pLoss: tỉ lệ máu bạn mất (0-1), mDealt: tỉ lệ máu quái mất (0-1) */
export function finishAmbush(c: Character, m: Monster, result: 'win' | 'lose' | 'draw', pLoss: number, mDealt: number, ctx: EffectCtx): string[] {
  const notes: string[] = [];
  if (result === 'win') {
    notes.push(`Bạn hạ được ${m.name} chặn đường (+${killExp(c, m)} tu vi).`);
    notes.push(...killReward(c, m, ctx));
    stat(c, 'sucKhoe', -Math.round(pLoss * 15));
    return notes;
  }
  if (result === 'lose') {
    const f = fatal(c, ctx, 0.3, `Bị ${m.name} chặn đường giữa nơi hoang vắng. Không ai tới cứu.`);
    if (c.dead) return [`${m.name} chặn đường, bạn không địch nổi.${f ?? ''}`];
    stat(c, 'sucKhoe', -30);
    return [`${m.name} chặn đường đánh bạn trọng thương rồi bỏ đi.${f ?? ''}`];
  }
  // hòa: hết 3 hiệp, quái bỏ chạy hoặc bạn thoát được
  stat(c, 'sucKhoe', -Math.round(pLoss * 25));
  if (mDealt >= 0.5) {
    const exp = Math.max(1, Math.round(killExp(c, m) * 0.3));
    addCult(c, exp);
    return [`Ba hiệp chưa phân thắng bại, ${m.name} bị thương bỏ chạy. Bạn rút được chút kinh nghiệm (+${exp} tu vi).`];
  }
  return [`Ba hiệp chưa phân thắng bại, bạn tìm cách thoát khỏi ${m.name}.`];
}
