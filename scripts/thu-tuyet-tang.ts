/**
 * 17/11 (Phan Anh Tuấn báo): tuyệt kỹ đã dung hợp (tầng 5) đầy thục luyện phải có đường lên tầng 6-9
 * bằng tàn quyển rơi từ trận khó và bằng Phường thị.
 * Chạy: npx tsx scripts/thu-tuyet-tang.ts
 */
import { emptyMeta, newCharacter } from '../lib/game/engine';
import { buyTq, cpOfPath, cpSync, dropTq, fuse, owned, tqOf, tqShopList, upgradeBlock } from '../lib/game/congPhap';
import type { PathId } from '../lib/game/types';
export {};
const PATHS: PathId[] = ['kiem', 'dan', 'tran', 'phat', 'ma', 'yeu'];
let bad = 0;
for (const p of PATHS) {
  const c = newCharacter(emptyMeta());
  c.path = p; c.realm = 9; c.age = 800; c.linhThach = 1e9; c.cultivation = 1e12;
  cpSync(c, null);
  for (const d of cpOfPath(p)) if (d.kind !== 'tuyet') { if (!owned(c, d.id)) c.cp!.own.push({ id: d.id, tang: 9, exp: 100 }); else { owned(c, d.id)!.tang = 9; } }
  const t = cpOfPath(p).find((x) => x.kind === 'tuyet')!;
  c.tq = { [t.id]: 30 };
  for (let i = 0; i < 40 && c.cp!.tuyet !== t.id; i++) fuse(c, () => 0);
  c.tq = { [t.id]: 0 };
  const o = owned(c, t.id)!;
  o.exp = 100;
  const shop = tqShopList(c).some((d) => d.id === t.id);
  // rơi: 400 trận khó (dừng khi đủ quyển cho tới tầng 9 = 10 quyển)
  let drops = 0;
  for (let i = 0; i < 400; i++) { const before = tqOf(c, t.id); dropTq(c, { kind: 'quai', strong: true }, Math.random); if (tqOf(c, t.id) > before) drops++; }
  const shopFull = tqShopList(c).some((d) => d.id === t.id);
  c.tq = { [t.id]: 0 };
  c.tqBuy = undefined;
  const bought = buyTq(c, t.id) ? 1 : 0;
  console.log(p, 'tầng', o.tang, '| rơi tuyệt kỹ', drops, '/400 trận | Phường thị bán:', shop, '| đủ quyển thì thôi bán:', !shopFull, '| mua được', bought, '| chặn nâng:', upgradeBlock(c, t.id));
  if (!drops || !shop || shopFull || !bought) bad++;
}
// chưa dung hợp thì không đổi luật cũ: tuyệt kỹ chưa lĩnh ngộ không rơi khi chưa có 2 chiêu tầng 9
{
  const c = newCharacter(emptyMeta()); c.path = 'kiem'; c.realm = 3; cpSync(c, null);
  const t = cpOfPath('kiem').find((x) => x.kind === 'tuyet')!;
  let d = 0; for (let i = 0; i < 300; i++) { dropTq(c, { kind: 'quai', strong: true }, Math.random); if (tqOf(c, t.id)) d++; }
  console.log('chưa có chiêu tầng 9: rơi tuyệt kỹ', d, '(phải 0)'); if (d) bad++;
}
console.log(bad ? `LỖI ${bad}` : 'OK');
process.exit(bad ? 1 : 0);
