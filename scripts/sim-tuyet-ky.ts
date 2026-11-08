/**
 * 4.3.1: so tuyệt kỹ (sau dung hợp, tầng 5) với bộc phát chiêu mạnh nhất tầng 9; né đòn có trần.
 * Chạy: npx tsx scripts/sim-tuyet-ky.ts
 */
import { emptyMeta, newCharacter } from '../lib/game/engine';
import { hit } from '../lib/game/combat';
import { act, cpOfPath, cpSync, fuse, loadoutOf, newSide, owned, takeHit } from '../lib/game/congPhap';
import type { Character, PathId } from '../lib/game/types';
export {};
const PATHS: PathId[] = ['kiem', 'dan', 'tran', 'phat', 'ma', 'yeu'];
function mk(path: PathId, withTuyet: boolean): Character {
  const c = newCharacter(emptyMeta());
  c.path = path;
  c.realm = 7;
  c.age = 500;
  cpSync(c, null);
  for (const d of cpOfPath(path)) if (d.kind !== 'tuyet') { if (!owned(c, d.id)) c.cp!.own.push({ id: d.id, tang: 9, exp: 0 }); else owned(c, d.id)!.tang = 9; }
  if (withTuyet) {
    const t = cpOfPath(path).find((x) => x.kind === 'tuyet')!;
    c.tq = { [t.id]: 30 };
    for (let i = 0; i < 20 && c.cp!.tuyet !== t.id; i++) fuse(c, () => 0);
  }
  return c;
}
const flat = (a: number, d: number) => ({ dmg: Math.max(1, Math.round(a - d * 0.5)), crit: false });
for (const p of PATHS) {
  const out: number[] = [];
  for (const w of [false, true]) {
    const c = mk(p, w);
    const lo = loadoutOf(c);
    let sum = 0;
    for (let i = 0; i < 2000; i++) {
      const me = newSide();
      me.gauge = 100;
      const r = act(lo, me, newSide(), 1000, 200, 5000, 10000, Math.random, 0, flat, null);
      sum += r.dmg + r.heal;
    }
    out.push(Math.round(sum / 2000));
    if (w) console.log(p, 'tầng tuyệt kỹ', owned(c, c.cp!.tuyet!)?.tang);
  }
  console.log(p.padEnd(5), 'bộc phát', out[0], 'tuyệt kỹ', out[1], `x${(out[1] / out[0]).toFixed(2)}`);
}
// né: Thiên Hồ tầng 9
const y = mk('yeu', false);
const loY = loadoutOf(y);
const me = newSide();
let miss = 0, missSure = 0, missNhd = 0;
for (let i = 0; i < 20000; i++) {
  me.evade = { n: 9, pct: 0.58 };
  if (takeHit(loY, me, 100, Math.random).dmg === 0) miss++;
  if (takeHit(loY, me, 100, Math.random, { sure: true }).dmg === 0) missSure++;
  if (takeHit(loY, me, 100, Math.random, { evMul: 0.5 }).dmg === 0) missNhd++;
}
console.log('né thường', (miss / 200).toFixed(1) + '%', 'né tuyệt kỹ/xuyên giáp', (missSure / 200).toFixed(1) + '%', 'bóng Vấn Tâm Đài', (missNhd / 200).toFixed(1) + '%');
