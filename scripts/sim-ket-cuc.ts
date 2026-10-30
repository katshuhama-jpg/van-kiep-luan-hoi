/**
 * Mô phỏng nhiều kiếp để đếm kết cục (4.1.0 Q1): tỉ lệ "Chết Không Toàn Thây" (bat_dac), chết trước khi chọn đường.
 * Giả lập theo /choi: mỗi năm yearTick, chọn bừa lựa chọn sự kiện; chặn đường 0,15/năm và gặp người 0,1/năm, đánh tay đôi theo stepAmbush.
 * Chạy: npx tsx scripts/sim-ket-cuc.ts [số kiếp]
 * HH=1: thử Hợp Hoan Tông (đạo tâm khởi đầu -20, gặp Mị Cơ thì theo): đếm 15 sự kiện tông, kiểm điều kiện nối nhau, so tỉ lệ chết với Vạn Độc Môn
 */
import { emptyMeta, makeCtx, newCharacter, resolveChoice, yearTick, checkProgress } from '../lib/game/engine';
import { endingOf } from '../lib/game/endings';
import { AMBUSH_PER_YEAR, AMBUSH_TURNS, ambushMonsterStats, finishAmbush, pickAmbush } from '../lib/game/ambush';
import { DUEL_PER_YEAR, DUEL_TURNS, finishDuel, foeStats, pickDuel } from '../lib/game/duel';
import { hit, playerStats } from '../lib/game/combat';
import type { Character, Fx, PendingEvent } from '../lib/game/types';
import { forcedClock, forcedReady, markForced } from '../lib/game/helpers';
import { isHH, rankOf } from '../lib/game/sect';

const HHMODE = !!process.env.HH;
let clock = 0;
forcedClock.now = () => clock;
const hhSeen: Record<string, number> = {};
const hhBad: Record<string, number> = {};
const sectYears: Record<string, number> = { hh: 0, vd: 0 };
const sectDeaths: Record<string, number> = { hh: 0, vd: 0 };
let hhLives = 0;
const HH_PRE: Record<string, (c: Character) => boolean> = {
  hh_bai_su: (c) => !c.sect && c.realm >= 1 && c.realm <= 4,
  hh_me_hon_tran: (c) => isHH(c) && c.hh?.at !== undefined,
  hh_lo_dinh_dau: (c) => isHH(c) && (c.hh?.lo ?? 0) === 0,
  hh_mi_thuat: (c) => isHH(c) && (c.hh?.lo ?? 0) >= 1,
  hh_tranh_sung: (c) => isHH(c) && rankOf(c) >= 1,
  hh_lo_dinh_them: (c) => isHH(c) && (c.hh?.lo ?? 0) >= 1,
  hh_chinh_phai_truy: (c) => isHH(c) && (c.hh?.lo ?? 0) >= 2 && c.realm >= 2,
  hh_bao_thu: (c) => (c.hh?.thu.length ?? 0) > 0,
  hh_bach_hoa_yen: (c) => isHH(c),
  hh_that_long: (c) => isHH(c) && (c.hh?.lo ?? 0) >= 2 && rankOf(c) >= 1,
  hh_tong_chu_biet: (c) => isHH(c) && !!c.hh?.tinh,
  hh_truy_phan_do: (c) => !!c.hh?.bo,
  hh_phan_phe: (c) => isHH(c) && (c.hh?.lo ?? 0) >= 4 && c.stats.tamMa >= 60,
  hh_thanh_tu_tuyen: (c) => isHH(c) && rankOf(c) === 2 && c.realm >= 3,
  hh_vay_coc: (c) => isHH(c) && rankOf(c) >= 2 && c.realm >= 3,
};
function seeHH(c: Character, p: PendingEvent | null) {
  if (!p || !p.id.startsWith('hh_')) return;
  hhSeen[p.id] = (hhSeen[p.id] ?? 0) + 1;
  if (HH_PRE[p.id] && !HH_PRE[p.id](c)) hhBad[p.id] = (hhBad[p.id] ?? 0) + 1;
}
function pickIdx(p: PendingEvent): number {
  if (HHMODE && p.id === 'hh_bai_su') return 0;
  if (HHMODE && p.id.startsWith('bai_')) return p.choices.length - 1;
  return Math.floor(rnd() * p.choices.length);
}

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
  if (HHMODE) c.daoTam = -20;
  let wasHH = false;
  const out: Fx[] = [];
  const ctx = makeCtx(c, out);
  let guard = 0;
  while (!c.dead && guard++ < 400 && !c.cosmos) {
    c.age += 1;
    clock += 20000;
    const sk = isHH(c) ? 'hh' : c.sect === 'Vạn Độc Môn' ? 'vd' : '';
    if (sk) sectYears[sk]++;
    if (isHH(c)) wasHH = true;
    let p: PendingEvent | null = yearTick(c, ctx);
    let k = 0;
    while (p && !c.dead && k++ < 10) {
      seeHH(c, p);
      p = resolveChoice(c, p, pickIdx(p), ctx);
    }
    if (c.dead) {
      if (sk) sectDeaths[sk]++;
      break;
    }
    if (forcedReady(c) && c.realm >= 1 && c.age >= 15 && rnd() < DUEL_PER_YEAR) {
      const f = pickDuel(c, rnd);
      if (f && f.kind !== 'kiep_truoc') {
        const r = fight(c, playerStats(c), foeStats(f.rival, c), DUEL_TURNS);
        finishDuel(c, f, r.r, r.pl, ctx);
        markForced(c);
      }
    }
    if (!c.dead && forcedReady(c) && c.stats.sucKhoe >= 35 && c.age >= 10 && rnd() < AMBUSH_PER_YEAR) {
      const { m, tier } = pickAmbush(c, rnd);
      const r = fight(c, playerStats(c), ambushMonsterStats(c, m), AMBUSH_TURNS);
      finishAmbush(c, m, r.r, r.pl, r.md, ctx, tier);
      markForced(c);
    }
    if (!c.dead) {
      let q = checkProgress(c, ctx);
      let j = 0;
      while (q && !c.dead && j++ < 10) {
        seeHH(c, q);
        q = resolveChoice(c, q, pickIdx(q), ctx);
      }
    }
    if (c.dead && sk) sectDeaths[sk]++;
  }
  if (wasHH) hhLives++;
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
if (HHMODE || hhLives) {
  console.log(`\nHợp Hoan Tông: ${hhLives} kiếp từng vào tông`);
  for (const id of Object.keys(HH_PRE)) console.log(`  ${id.padEnd(20)} gặp ${hhSeen[id] ?? 0}${hhBad[id] ? `  SAI ĐIỀU KIỆN ${hhBad[id]}` : ''}`);
  const rate = (k: string) => ((sectDeaths[k] / Math.max(1, sectYears[k])) * 100).toFixed(2);
  console.log(`  chết mỗi 100 năm trong tông: Hợp Hoan ${rate('hh')} (${sectDeaths.hh}/${sectYears.hh} năm), Vạn Độc Môn ${rate('vd')} (${sectDeaths.vd}/${sectYears.vd} năm)`);
}
