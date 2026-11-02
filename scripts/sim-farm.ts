export {};
/**
 * Đo tiền kiếm được khi treo máy trừ yêu: hạ N con quái ngang cấp, bán hết đồ thừa (cả đồ rơi trùng).
 * Chạy: npx tsx scripts/sim-farm.ts [số con] [cảnh giới]
 */
const root = process.cwd();
const E = require(root + '/lib/game/engine');
const C = require(root + '/lib/game/combat');
const F = require(root + '/lib/game/forge');
const N = Number(process.argv[2] ?? 300);
const R = Number(process.argv[3] ?? 5);
const runs = 40;
let kill = 0, sold = 0, items = 0;
for (let k = 0; k < runs; k++) {
  const c = E.newCharacter({ ...E.emptyMeta(), lives: 20 });
  c.realm = R; c.layer = 2; c.age = 30 + R * 25; c.path = 'kiem'; c.linhThach = 0;
  const ctx = E.makeCtx(c, []);
  const lvl = C.combatLevel(c);
  const pool = C.MONSTERS.filter((m: any) => !m.boss && !m.sect).sort((a: any, b: any) => Math.abs(C.effLv(c, a) - lvl) - Math.abs(C.effLv(c, b) - lvl));
  const m = pool[0];
  for (let i = 0; i < N; i++) {
    const before = c.linhThach;
    const inv0 = c.inventory.length;
    C.killReward(c, m, ctx);
    kill += c.linhThach - before;
    if (i % 4 === 0) c.age += 1; // khoảng 4 con mỗi năm game (trận và nghỉ chạy cùng nhịp với năm)
  }
  items += c.inventory.length;
  for (const id of [...c.inventory]) { if (F.canSmelt(c, id)) { const b = c.linhThach; F.sell(c, id, ctx); sold += c.linhThach - b; } }
}
console.log(`cảnh giới ${R}, ${N} con: tiền giết + đồ trùng tự bán ${Math.round(kill / runs)}, bán đồ thừa trong túi ${Math.round(sold / runs)} (${(items / runs).toFixed(1)} món), tổng ${Math.round((kill + sold) / runs)}`);
