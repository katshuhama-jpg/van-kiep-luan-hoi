/**
 * Mô phỏng nhiều kiếp để đếm kết cục (4.1.0 Q1): tỉ lệ "Chết Không Toàn Thây" (bat_dac), chết trước khi chọn đường.
 * Giả lập theo /choi: mỗi năm yearTick, chọn bừa lựa chọn sự kiện; chặn đường 0,15/năm và gặp người 0,1/năm, đánh tay đôi theo stepAmbush.
 * Chạy: npx tsx scripts/sim-ket-cuc.ts [số kiếp]
 */
import { emptyMeta, makeCtx, newCharacter, resolveChoice, yearTick, checkProgress } from '../lib/game/engine';
import { endingOf } from '../lib/game/endings';
import { AMBUSH_PER_YEAR, AMBUSH_TURNS, ambushMonsterStats, finishAmbush, pickAmbush } from '../lib/game/ambush';
import { DUEL_PER_YEAR, DUEL_TURNS, finishDuel, foeStats, pickDuel } from '../lib/game/duel';
import { hit, playerStats } from '../lib/game/combat';
import type { Character, Fx, PendingEvent } from '../lib/game/types';

const N = Number(process.argv[2] ?? 1000);
const rnd = Math.random;
const tally: Record<string, number> = {};
let noPath = 0, noPathAge = 0, killer = 0, hpDeath = 0;

function fight(c: Character, ps: { hp: number; atk: number; def: number }, ms: { hp: number; atk: number; def: number }, turns: number) {
  let p = ps.hp, m = ms.hp;
  for (let t = 0; t < turns; t++) {
    m -= hit(ps.atk, ms.def, rnd).dmg;
    if (m <= 0) return { r: 'win' as const, pl: 1 - p / ps.hp, md: 1 };
    p -= hit(ms.atk, ps.def, rnd).dmg;
    if (p <= 0) return { r: 'lose' as const, pl: 1, md: 1 - m / ms.hp };
  }
  const pl = 1 - p / ps.hp, md = 1 - m / ms.hp;
  return { r: Math.abs(pl - md) < 0.05 ? ('draw' as const) : md > pl ? ('win' as const) : ('draw' as const), pl, md };
}

for (let i = 0; i < N; i++) {
  const meta = { ...emptyMeta(), lives: 10 };
  const c = newCharacter(meta);
  c.focus = 'tu_luyen' as Character['focus'];
  const out: Fx[] = [];
  const ctx = makeCtx(c, out);
  let guard = 0;
  while (!c.dead && guard++ < 400 && !c.cosmos) {
    c.age += 1;
    let p: PendingEvent | null = yearTick(c, ctx);
    let k = 0;
    while (p && !c.dead && k++ < 10) p = resolveChoice(c, p, Math.floor(rnd() * p.choices.length), ctx);
    if (c.dead) break;
    if (c.realm >= 1 && c.age >= 15 && rnd() < DUEL_PER_YEAR) {
      const f = pickDuel(c, rnd);
      if (f && f.kind !== 'kiep_truoc') {
        const r = fight(c, playerStats(c), foeStats(f.rival, c), DUEL_TURNS);
        finishDuel(c, f, r.r, r.pl, ctx);
      }
    }
    if (!c.dead && c.age >= 10 && rnd() < AMBUSH_PER_YEAR) {
      const { m, tier } = pickAmbush(c, rnd);
      const r = fight(c, playerStats(c), ambushMonsterStats(c, m), AMBUSH_TURNS);
      finishAmbush(c, m, r.r, r.pl, r.md, ctx, tier);
    }
    if (!c.dead) {
      let q = checkProgress(c, ctx);
      let j = 0;
      while (q && !c.dead && j++ < 10) q = resolveChoice(c, q, Math.floor(rnd() * q.choices.length), ctx);
    }
  }
  if (!c.dead) continue;
  const e = endingOf(c).id;
  tally[e] = (tally[e] ?? 0) + 1;
  if (process.env.SHOW && e === process.env.SHOW) console.log('  ·', Math.floor(c.age), c.realm, (c.cause ?? '').slice(0, 200));
  if (!c.path) { noPath++; noPathAge += c.age; }
  if ((c as { killer?: string }).killer) killer++;
  if (/Thương thế chồng chất|Wound piled/.test(c.cause ?? '')) hpDeath++;
}
const dead = Object.values(tally).reduce((a, b) => a + b, 0);
console.log(`kiếp chết: ${dead}/${N}`);
for (const [k, v] of Object.entries(tally).sort((a, b) => b[1] - a[1]).slice(0, 14)) console.log(`${k.padEnd(18)} ${v}  ${((v / dead) * 100).toFixed(1)}%`);
console.log(`chết trước khi chọn đường: ${((noPath / dead) * 100).toFixed(1)}%, tuổi TB ${(noPathAge / Math.max(1, noPath)).toFixed(1)}`);
console.log(`có tên kẻ giết: ${((killer / dead) * 100).toFixed(1)}%, chết vì thương thế: ${((hpDeath / dead) * 100).toFixed(1)}%`);
