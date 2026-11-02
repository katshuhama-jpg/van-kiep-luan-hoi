// 4.2.0: mô phỏng trận thu phục linh thú - tỉ lệ thắng (hoặc làm thú kiệt sức) và tỉ lệ thu phục thành công theo cảnh giới, rank
// Chạy: npx tsx scripts/sim-thu-phuc.ts [số trận mỗi ô]
import { emptyMeta, newCharacter } from '../lib/game/engine';
import { hit, monsterStats, playerStats } from '../lib/game/combat';
import { beastMonster, catchChance, type PetRank } from '../lib/game/linhThu';
export {};
const N = Number(process.argv[2] ?? 1500);
const REP: Record<PetRank, string> = { N: 'cho_vang', R: 'mai_loc', SR: 'tuyet_ho', SSR: 'bach_ho', SSS: 'thanh_long' };
const LV: Record<PetRank, [number, number]> = { N: [1, 5], R: [4, 10], SR: [9, 15], SSR: [13, 22], SSS: [23, 30] };
const REALM = ['', 'Luyện Khí', 'Trúc Cơ', 'Kim Đan', 'Nguyên Anh', 'Hóa Thần', 'Luyện Hư', 'Độ Kiếp'];
const rnd = Math.random;
console.log('cảnh giới   | ' + (Object.keys(REP) as PetRank[]).map((r) => r.padEnd(13)).join(''));
for (let realm = 1; realm <= 7; realm++) {
  const c = newCharacter(emptyMeta());
  c.realm = realm;
  c.layer = realm === 1 ? 5 : 2;
  c.age = 30 + realm * 20;
  c.stats.khiVan = 50;
  const cells: string[] = [];
  for (const r of Object.keys(REP) as PetRank[]) {
    let win = 0;
    let got = 0;
    for (let i = 0; i < N; i++) {
      const [a, b] = LV[r];
      const lv = a + Math.floor(rnd() * (b - a + 1));
      const m = beastMonster(REP[r], lv);
      const ps = playerStats(c);
      const ms = monsterStats(m, lv, c);
      let pHp = ps.hp;
      let mHp = ms.hp;
      let res: 'win' | 'lose' | 'draw' = 'draw';
      for (let t = 0; t < 6; t++) {
        mHp -= hit(ps.atk, ms.def, rnd).dmg;
        if (mHp <= 0) { res = 'win'; break; }
        pHp -= hit(ms.atk, ps.def, rnd).dmg;
        if (pHp <= 0) { res = 'lose'; break; }
      }
      const left = Math.max(0, mHp / ms.hp);
      if (res === 'win' || (res === 'draw' && left <= 0.35)) {
        win++;
        if (rnd() < catchChance(c, REP[r], lv, left)) got++;
      }
    }
    cells.push(`${Math.round((win / N) * 100)}%→${Math.round((got / N) * 100)}%`.padEnd(13));
  }
  console.log(REALM[realm].padEnd(11) + ' | ' + cells.join(''));
}
console.log('\nmỗi ô: tỉ lệ thắng hoặc làm thú kiệt sức → tỉ lệ thu phục được (tính trên mọi lần gặp)');
