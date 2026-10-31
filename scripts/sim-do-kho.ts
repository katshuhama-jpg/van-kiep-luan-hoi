/**
 * Đo độ khó: tuổi chết trung bình, tỉ lệ kiếp lên được từng cảnh giới (r2 Trúc Cơ, r3 Kim Đan, r4 Nguyên Anh, r5 Hóa Thần, r6 Luyện Hư, r7 Độ Kiếp).
 * Mỗi kiếp chọn bừa lựa chọn sự kiện, có chặn đường và gặp người như /choi.
 * Chạy: npx tsx scripts/sim-do-kho.ts [số kiếp]. Muốn so với bản cũ: git worktree add ../cu <sha>, rồi chạy script này trong thư mục đó.
 */
const root = process.cwd();
const E = require(root + '/lib/game/engine');
const A = require(root + '/lib/game/ambush');
const D = require(root + '/lib/game/duel');
const C = require(root + '/lib/game/combat');
const H = require(root + '/lib/game/helpers');
const N = Number(process.argv[2] ?? 3000);
const rnd = Math.random;
let clock = 0;
if (H.forcedClock) H.forcedClock.now = () => clock;
function fight(ps: any, ms: any, turns: number) {
  let p = ps.hp, m = ms.hp;
  for (let t = 0; t < turns; t++) { m -= C.hit(ps.atk, ms.def, rnd).dmg; if (m <= 0) return { r: 'win', pl: 1 - p / ps.hp, md: 1 }; p -= C.hit(ms.atk, ps.def, rnd).dmg; if (p <= 0) return { r: 'lose', pl: 1, md: 1 - m / ms.hp }; }
  const pl = 1 - p / ps.hp, md = 1 - m / ms.hp; return { r: md > pl + 0.05 ? 'win' : 'draw', pl, md };
}
const ages: number[] = []; const realms: number[] = []; let asc = 0; let stones = 0;
const deathAt: Record<number, number> = {}; const reach: Record<number, number> = {};
for (let i = 0; i < N; i++) {
  const c = E.newCharacter({ ...E.emptyMeta(), lives: 10 }); c.focus = 'tu_luyen';
  const ctx = E.makeCtx(c, []); let g = 0; let maxR = 0;
  while (!c.dead && g++ < 400 && !c.cosmos) {
    c.age += 1; clock += 20000;
    let p = E.yearTick(c, ctx); let k = 0;
    while (p && !c.dead && k++ < 10) p = E.resolveChoice(c, p, Math.floor(rnd() * p.choices.length), ctx);
    if (c.dead) break;
    const ready = H.forcedReady ? H.forcedReady(c) : true;
    if (ready && c.realm >= 1 && c.age >= 15 && rnd() < D.DUEL_PER_YEAR) { const f = D.pickDuel(c, rnd); if (f && f.kind !== 'kiep_truoc') { const r = fight(C.playerStats(c), D.foeStats(f.rival, c), D.DUEL_TURNS); D.finishDuel(c, f, r.r, r.pl, ctx); H.markForced?.(c); } }
    const ready2 = H.forcedReady ? H.forcedReady(c) && c.stats.sucKhoe >= 35 : true;
    if (!c.dead && ready2 && c.age >= 10 && rnd() < A.AMBUSH_PER_YEAR) { const { m, tier } = A.pickAmbush(c, rnd); const r = fight(C.playerStats(c), A.ambushMonsterStats(c, m), A.AMBUSH_TURNS); A.finishAmbush(c, m, r.r, r.pl, r.md, ctx, tier); H.markForced?.(c); }
    if (!c.dead) { let q = E.checkProgress(c, ctx); let j = 0; while (q && !c.dead && j++ < 10) q = E.resolveChoice(c, q, Math.floor(rnd() * q.choices.length), ctx); }
    maxR = Math.max(maxR, c.realm);
  }
  if (c.cosmos) asc++;
  ages.push(c.age); realms.push(maxR); stones += c.linhThach;
  for (let r = 0; r <= maxR; r++) reach[r] = (reach[r] ?? 0) + 1;
  if (c.dead) deathAt[maxR] = (deathAt[maxR] ?? 0) + 1;
}
const avg = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length;
const pct = (x: number) => ((x / N) * 100).toFixed(1) + '%';
console.log(`tuổi chết TB ${avg(ages).toFixed(0)}, phi thăng ${pct(asc)}, linh thạch lúc cuối TB ${(stones / N).toFixed(0)}`);
console.log('tới được: ' + [2, 3, 4, 5, 6, 7].map((r) => `r${r} ${pct(reach[r] ?? 0)}`).join(', '));
