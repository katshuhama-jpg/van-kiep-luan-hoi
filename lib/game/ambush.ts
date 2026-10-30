import { DO_KIEP_REALM } from './helpers';
import { MONSTERS, combatLevel, effLv, growth, killExp, killReward, monsterEndTag, monsterStats, type Fighter, type Monster } from './combat';
import { ambushDrawWin, ambushFlee, ambushLose, ambushWin, chieuOf, marginOf } from './fightLines';
import { addCult, addWound, afterLoss, fatal, markDeath, money, stat } from './helpers';
import type { Character, EffectCtx } from './types';
import { sectSide } from './sect';
import { tr } from '../i18n';

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
  // đệ tử tông môn: 30% là quái thí luyện trong môn
  const side = sectSide(c);
  const inSect = !!side && rnd() < 0.3;
  // Độ Kiếp ở phàm giới: chỉ quái Độ Kiếp chặn đường, không còn rắn rết thấp cấp bị đẩy cấp lên cho khớp
  const doKiep = !c.cosmos && c.realm >= DO_KIEP_REALM;
  const pool = c.cosmos
    ? MONSTERS.filter((m) => m.cosmos === c.cosmos)
    : MONSTERS.filter((m) => !m.boss && !m.cosmos && (inSect ? m.sect === side : !m.sect) && (doKiep ? !!m.doKiep || (inSect && !!m.sect) : !m.doKiep));
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
  const s = monsterStats(m, effLv(c, m), c);
  return { ...s, hp: Math.max(1, Math.round(s.hp * AMBUSH_HP)) };
}

export const AMBUSH_INTRO: Record<AmbushTier, string> = {
  kem: tr('Một con quái nhỏ lao ra chặn đường.', "A small monster leaps out to block your path."),
  bang: tr('Quái vật chặn đường! Không tránh được, phải đánh.', "A monster blocks the road! No way around it - you have to fight."),
  hon: tr('Một con quái mạnh hơn bạn chặn đường. Nguy rồi!', "A monster stronger than you blocks the road. This is bad!"),
};

/**
 * Kết thúc trận chặn đường. pLoss: tỉ lệ máu bạn mất (0-1), mDealt: tỉ lệ máu quái mất (0-1).
 * Không thắng thì luôn phải trả giá: bỏ chạy rơi linh thạch, bị thương, quái mạnh còn có thể giết người.
 */
export function finishAmbush(c: Character, m: Monster, result: 'win' | 'lose' | 'draw', pLoss: number, mDealt: number, ctx: EffectCtx, tier: AmbushTier = 'bang'): string[] {
  const danger = tier === 'hon' ? 1.6 : tier === 'kem' ? 0.6 : 1;
  if (result === 'win') {
    const notes = [tr(`${ambushWin(m.name, marginOf(pLoss), chieuOf(c, ctx.rnd), ctx.rnd)} (+${killExp(c, m)} tu vi).`, `${ambushWin(m.name, marginOf(pLoss), chieuOf(c, ctx.rnd), ctx.rnd)} (+${killExp(c, m)} cultivation).`)];
    // quái chặn đường thắng xong gần như chắc chắn có chiến lợi phẩm
    notes.push(...killReward(c, m, ctx, 0.75));
    const hurt = Math.round(pLoss * 25);
    if (hurt >= 3) {
      stat(c, 'sucKhoe', -hurt);
      notes.push(tr(`Thắng nhưng cũng mang thương tích (-${hurt} sức khỏe).`, `You win, but not without wounds (-${hurt} Health).`));
    }
    return notes;
  }
  ctx.fx('hurt', result === 'lose' ? tr('Trọng thương', "Grave wounds") : tr('Bị thương', "Wounded"));
  // rơi đồ khi chạy trốn hoặc gục ngã
  const drop = Math.round(c.linhThach * (result === 'lose' ? 0.2 + ctx.rnd() * 0.15 : 0.05 + ctx.rnd() * 0.1));
  const lost = drop > 0 ? tr(` Túi bị rách, rơi mất ${drop} linh thạch.`, ` Your pouch tears open and ${drop} spirit stones spill out.`) : '';
  money(c, -drop);
  // 4.1.0: chết vì quái chặn đường có kết cục riêng: quái yếu hơn hoặc ngang sức là khinh địch, quái mạnh hơn là tử địa
  const lv = effLv(c, m);
  const tag = monsterEndTag(m, tier !== 'hon');
  const by = `${m.name} Lv${lv}`;
  const age = Math.floor(c.age);
  if (result === 'lose') {
    const f = fatal(c, ctx, c.age < 16 ? 0 : 0.3 * danger, tr(`Bị ${m.name} cấp ${lv} chặn đường giữa nơi hoang vắng, năm ${age} tuổi. Không ai tới cứu.`, `Waylaid by ${m.name} (Lv${lv}) in the middle of nowhere at age ${age}. No one came to help.`));
    markDeath(c, tag, by);
    if (c.dead) return [tr(`${m.name} chặn đường, bạn không địch nổi.${f ?? ''}`, `${m.name} blocks your path and you are no match for it.${f ?? ''}`)];
    stat(c, 'sucKhoe', -Math.round(35 * danger));
    addWound(c, 35 * danger, tr(`bị ${m.name} cấp ${lv} chặn đường đánh gục`, `struck down by ${m.name} (Lv${lv}) on the road`), tag, by);
    c.cultivation = Math.max(0, Math.round(c.cultivation * 0.93));
    afterLoss(c);
    return [tr(`${ambushLose(m.name, ctx.rnd)} (-${Math.round(35 * danger)} sức khỏe, tu vi tổn hao).${lost}${f ?? ''}`, `${ambushLose(m.name, ctx.rnd)} (-${Math.round(35 * danger)} Health, cultivation lost).${lost}${f ?? ''}`)];
  }
  // hòa: hết 3 hiệp chưa phân thắng bại
  if (mDealt >= 0.5 && mDealt > pLoss) {
    const hurt = Math.round(pLoss * 30);
    stat(c, 'sucKhoe', -hurt);
    const exp = Math.max(1, Math.round(killExp(c, m) * 0.3));
    addCult(c, exp);
    return [tr(`${ambushDrawWin(m.name, ctx.rnd)} Bạn rút được chút kinh nghiệm (+${exp} tu vi, -${hurt} sức khỏe).`, `${ambushDrawWin(m.name, ctx.rnd)} You take away a little experience (+${exp} cultivation, -${hurt} Health).`)];
  }
  // phải bỏ chạy: bị đánh sau lưng, rơi linh thạch, có thể trọng thương
  const hurt = Math.round((12 + pLoss * 30) * danger);
  stat(c, 'sucKhoe', -hurt);
  addWound(c, hurt, tr(`bỏ chạy khỏi ${m.name} cấp ${lv}, bị đánh sau lưng`, `fled from ${m.name} (Lv${lv}), struck from behind`), tag, by);
  const notes = [tr(`${ambushFlee(m.name, ctx.rnd)} (-${hurt} sức khỏe).${lost}`, `${ambushFlee(m.name, ctx.rnd)} (-${hurt} Health).${lost}`)];
  if (ctx.rnd() < 0.25 * danger) {
    const f = fatal(c, ctx, c.age < 16 ? 0 : 0.08 * danger, tr(`Bỏ chạy khỏi ${m.name}, vết thương sau lưng nhiễm độc. Bạn gục xuống giữa đường, năm ${age} tuổi.`, `You fled from ${m.name}, but the wound on your back festered with poison. You collapsed by the roadside at age ${age}.`));
    markDeath(c, tag, by);
    if (c.dead) return [notes[0] + (f ?? '')];
    stat(c, 'tamMa', 6);
    notes.push(tr(`Vết thương sau lưng mưng mủ mãi không lành, đêm nằm mơ thấy ${m.name} đuổi theo (+tâm ma).${f ?? ''}`, `The wound on your back festers and will not heal; at night you dream of ${m.name} giving chase (+heart demon).${f ?? ''}`));
  }
  return notes;
}

/** 4.1.0: markForced, forcedReady nằm ở helpers để engine dùng chung */
export { markForced, forcedReady } from './helpers';
