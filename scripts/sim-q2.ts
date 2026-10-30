/**
 * 4.1.0 Q2, Q2b, Q3: mô phỏng nhiều kiếp để đo
 *  - số cái chết từ sự kiện tai họa phàm tục khi đã Trúc Cơ trở lên (phải về 0)
 *  - khoảng cách giữa hai trận bắt buộc (không dưới 3 năm game)
 *  - số lần bị phàm nhân / cướp vặt / đồng môn lấy linh thạch, tu vi mỗi 100 năm game, theo cảnh giới và theo chính/tà
 * Chạy: npx tsx scripts/sim-q2.ts [số kiếp] [chinh|ta|bua]
 */
import * as H from '../lib/game/helpers';
import * as E from '../lib/game/engine';
import { emptyMeta, makeCtx, newCharacter, resolveChoice, yearTick, checkProgress } from '../lib/game/engine';
import { EVENTS } from '../lib/game/events';
import { AMBUSH_PER_YEAR, AMBUSH_TURNS, ambushMonsterStats, finishAmbush, pickAmbush } from '../lib/game/ambush';
import { DUEL_PER_YEAR, DUEL_TURNS, finishDuel, foeStats, pickDuel } from '../lib/game/duel';
import { hit, playerStats } from '../lib/game/combat';
import type { Character, Fx, PendingEvent } from '../lib/game/types';

const N = Number(process.argv[2] ?? 1000);
const persona = (process.argv[3] ?? 'bua') as 'chinh' | 'ta' | 'bua';
const rnd = Math.random;
const PHAM = new Set(['gieng_co', 'song_lu', 'mat_mua', 'lac_rung', 'tien_dan_gia', 'lang_dich', 'canh_doc', 'trong_benh', 'vuc_tham', 'ran_doc', 'do_thach', 'pha_san', 'bo_thi', 'tung_quan', 'trom_nha', 'nam_phat_sang', 'cau_treo', 'ho_bang', 'on_dich', 'dong_dat']);
const BULLY_EV = new Set(['cuop_duong', 'dong_mon', 'pha_san', 'trom_nha', 'dong_mon_hut_cong']);
const BULLY_LOG = /đám côn đồ|đổ hết tội|hút trộm linh khí|bỏ trốn khỏi trấn|Kẻ tiểu nhân lợi dụng|Kẻ trộm đào được|thugs block|pin it all on you|siphons your spirit|flees town|scoundrel exploits|thief tunnels/;
let clock = 0;
const HH = H as unknown as { forcedClock?: { now: () => number } };
if (HH.forcedClock) HH.forcedClock.now = () => clock;

const gaps: number[] = [];
let phamDeathHigh = 0;
const yearsBy: number[] = Array(12).fill(0);
const lossBy: number[] = Array(12).fill(0);
const evLossBy: Record<string, number> = {};
let mishapAll = 0, mishapYears = 0;
const ends: Record<string, number> = {};

function fight(ps: { hp: number; atk: number; def: number }, ms: { hp: number; atk: number; def: number }, turns: number) {
  let p = ps.hp, m = ms.hp;
  for (let t = 0; t < turns; t++) {
    m -= hit(ps.atk, ms.def, rnd).dmg;
    if (m <= 0) return { r: 'win' as const, pl: 1 - p / ps.hp, md: 1 };
    p -= hit(ms.atk, ps.def, rnd).dmg;
    if (p <= 0) return { r: 'lose' as const, pl: 1, md: 1 - m / ms.hp };
  }
  const pl = 1 - p / ps.hp, md = 1 - m / ms.hp;
  return { r: md > pl + 0.05 ? ('win' as const) : ('draw' as const), pl, md };
}
function choose(p: PendingEvent): number {
  if (persona === 'bua') return Math.floor(rnd() * p.choices.length);
  const want = persona === 'chinh' ? 'chinh' : 'ta';
  const idx = p.choices.map((ch, i) => (ch.lean === want ? i : -1)).filter((i) => i >= 0);
  if (idx.length && rnd() < 0.8) return idx[Math.floor(rnd() * idx.length)];
  return Math.floor(rnd() * p.choices.length);
}

for (let i = 0; i < N; i++) {
  const meta = { ...emptyMeta(), lives: 10 };
  const c: Character = newCharacter(meta);
  c.focus = 'tu_luyen' as Character['focus'];
  const out: Fx[] = [];
  const ctx = makeCtx(c, out);
  const log0 = ctx.log;
  let lastForced: number | undefined;
  let other = false;
  ctx.log = (t, tone) => {
    other = true;
    if (BULLY_LOG.test(t)) { lossBy[c.realm]++; if (c.realm >= 5) { const k = 'log:' + (t.match(BULLY_LOG)?.[0] ?? ''); evLossBy[k] = (evLossBy[k] ?? 0) + 1; } }
    if (/đám côn đồ|đổ hết tội|hút trộm|bỏ trốn khỏi trấn|thugs block|pin it all|siphons|flees town/.test(t)) mishapAll++;
    log0(t, tone);
  };
  const run = (p0: PendingEvent | null) => {
    let p = p0, k = 0;
    while (p && !c.dead && k++ < 10) {
      const id = p.id;
      const st = c.linhThach, cu = c.cultivation, r0 = c.realm;
      if (E.FORCED_EVENTS?.has(id)) { if (lastForced !== undefined) gaps.push(c.age - lastForced); lastForced = c.age; }
      other = false;
      const title = p.title;
      const log1 = ctx.log;
      let extra = false;
      ctx.log = (t, tone) => { if (!t.startsWith(title + ':')) extra = true; log1(t, tone); };
      p = resolveChoice(c, p, choose(p), ctx);
      ctx.log = log1;
      if (c.dead && PHAM.has(id) && r0 >= 2 && !extra) { phamDeathHigh++; if (process.env.SHOW) console.log("  ·", id, r0, (c.cause ?? "").slice(0, 160)); }
      if (BULLY_EV.has(id) && (c.linhThach < st - (id === "trom_nha" ? 21 : 1) || c.cultivation < cu - 1)) { lossBy[r0]++; const k = id + (r0 >= 5 ? '@5' : ''); evLossBy[k] = (evLossBy[k] ?? 0) + 1; }
    }
  };
  let guard = 0;
  while (!c.dead && guard++ < 400 && !c.cosmos) {
    c.age += 1;
    clock += 20000;
    yearsBy[c.realm]++;
    if (c.age >= 16) mishapYears++;
    run(yearTick(c, ctx));
    if (c.dead) break;
    const ready = H.forcedReady ? H.forcedReady(c) : true;
    if (ready && c.realm >= 1 && c.age >= 15 && rnd() < DUEL_PER_YEAR) {
      const f = pickDuel(c, rnd);
      if (f && f.kind !== 'kiep_truoc') {
        const r = fight(playerStats(c), foeStats(f.rival, c), DUEL_TURNS);
        if (lastForced !== undefined) gaps.push(c.age - lastForced);
        lastForced = c.age;
        finishDuel(c, f, r.r, r.pl, ctx);
        H.markForced?.(c);
      }
    }
    const ready2 = H.forcedReady ? H.forcedReady(c) && c.stats.sucKhoe >= 35 : true;
    if (!c.dead && ready2 && c.age >= 10 && rnd() < AMBUSH_PER_YEAR) {
      const { m, tier } = pickAmbush(c, rnd);
      const r = fight(playerStats(c), ambushMonsterStats(c, m), AMBUSH_TURNS);
      if (lastForced !== undefined) gaps.push(c.age - lastForced);
      lastForced = c.age;
      finishAmbush(c, m, r.r, r.pl, r.md, ctx, tier);
      H.markForced?.(c);
    }
    if (!c.dead) run(checkProgress(c, ctx));
  }
}
const g = gaps.sort((a, b) => a - b);
console.log(`persona=${persona} N=${N}`);
console.log(`chết vì tai họa phàm tục khi đã Trúc Cơ+: ${phamDeathHigh}`);
console.log(`khoảng cách trận bắt buộc: n=${g.length}, nhỏ nhất ${g[0]}, dưới 3 năm ${g.filter((x) => x < 3).length} (${((g.filter((x) => x < 3).length / Math.max(1, g.length)) * 100).toFixed(1)}%), trung vị ${g[Math.floor(g.length / 2)]}`);
console.log(`bị ăn hiếp (fate) mỗi 100 năm từ 16 tuổi: ${((mishapAll / Math.max(1, mishapYears)) * 100).toFixed(2)}`);
const row = (a: number, b: number) => { let x = 0, y = 0; for (let r = a; r <= b; r++) { x += lossBy[r]; y += yearsBy[r]; } return `${((x / Math.max(1, y)) * 100).toFixed(2)}/100 năm (${x} lần / ${y} năm)`; };
console.log(`mất linh thạch/tu vi vì kẻ yếu: cảnh giới 0-1 ${row(0, 1)}; 2-4 ${row(2, 4)}; 5+ ${row(5, 11)}`);
console.log('theo sự kiện:', JSON.stringify(evLossBy));
