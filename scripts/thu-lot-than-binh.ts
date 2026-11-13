export {};
/** #236: thần binh truyền kiếp không bị lột khi thua trận. Chạy: npx tsx scripts/thu-lot-than-binh.ts */
const root = process.cwd();
const E = require(root + '/lib/game/engine');
const D = require(root + '/lib/game/duel');
const { ITEMS } = require(root + '/lib/game/data');
let robbedLegend = 0, robbedOther = 0;
for (let t = 0; t < 2000; t++) {
  const c = E.newCharacter({ ...E.emptyMeta(), lives: 12 });
  const w = ITEMS.find((i: any) => i.slot === 'vu_khi' && (i.rare ?? 0) === 3);
  const a = ITEMS.find((i: any) => i.slot === 'ao' && i.id !== 'ao_vai');
  c.inventory.push(w.id, a.id);
  c.equipped.vu_khi = w.id;
  c.equipped.ao = a.id;
  c.legend = { item: w.id, name: 'Rìu thử', lv: 10 };
  const taken = D.robGear(c, E.makeCtx(c, []), 2, []);
  if (!c.inventory.includes(w.id) || c.equipped.vu_khi !== w.id) robbedLegend++;
  if (taken.length) robbedOther++;
}
console.log({ robbedLegend, robbedOther });
if (robbedLegend) { console.error('LỖI: thần binh truyền kiếp vẫn bị lột'); process.exit(1); }
console.log('OK');
