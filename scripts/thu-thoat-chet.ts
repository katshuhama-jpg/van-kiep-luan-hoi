/**
 * Thử chữ khi thoát chết (Nguyễn Quang báo 16/11): lựa chọn có rủi ro chết, xúc xắc ép ra chết nhưng được oan hồn cứu,
 * thì chữ trả về không được còn câu kết bình an và không được cộng phần thưởng của nhánh bình an.
 * Với mỗi lựa chọn của mọi sự kiện: chạy một lần không chết (rnd = 0,999) lấy câu kết bình an, một lần ép chết + oan hồn (rnd = 0).
 * Chạy: npx tsx scripts/thu-thoat-chet.ts
 */
const root = process.cwd();
const E = require(root + '/lib/game/engine');
const lists: Record<string, any[]> = {
  events: require(root + '/lib/game/events').EVENTS,
  events2: require(root + '/lib/game/events2').EVENTS2,
  events3: require(root + '/lib/game/events3').EVENTS3,
  hopHoan: require(root + '/lib/game/hopHoan').HH_EVENTS,
  childhood: require(root + '/lib/game/childhood').CHILD_EVENTS,
  sect: require(root + '/lib/game/sectEvents').SECT_EVENTS,
  sect2: require(root + '/lib/game/sectEvents2').SECT_EVENTS2,
  ta: require(root + '/lib/game/taEvents').TA_EVENTS,
  hook: require(root + '/lib/game/hookEvents').HOOK_EVENTS,
  cosmos: require(root + '/lib/game/cosmosEvents').COSMOS_EVENTS,
  cosmosStories: require(root + '/lib/game/cosmosStories').COSMOS_STORIES,
  hu: require(root + '/lib/game/huEvents').HU_EVENTS,
  hg: require(root + '/lib/game/hongHoangEvents').HG_EVENTS,
  chuyenDao: require(root + '/lib/game/chuyenDao').CHUYEN_DAO_EVENTS,
};
// Kết đã kể nạn (thua, trọng thương), không có thưởng: câu cứu mạng nối vào vẫn khớp lời kể
const KE_NAN = new Set(['de_tu_xuat_su#0', 'tu_hon#3', 'hh_bao_thu#0', 'hh_truy_phan_do#0', 'hh_vay_coc#0']);
const seen = new Set<string>();
const OAN = 'Một bóng oan hồn từ kiếp trước';
const quiet = { fx() {}, log() {} };

function mk(e: any) {
  const c = E.newCharacter({ ...E.emptyMeta(), lives: 10 });
  c.age = Math.max(e.minAge ?? 0, 20);
  c.lifeNo = 10;
  c.linhThach = 1000;
  return c;
}
function run(e: any, idx: number, rnd: number, oan: boolean) {
  const c = mk(e);
  c.oanHon = oan;
  const before = { lt: c.linhThach, cult: c.cultivation, sk: c.stats.sucKhoe };
  let text = '';
  try {
    const ch = e.choices(c, 0)[idx];
    text = ch.run(c, { ...quiet, rnd: () => rnd });
  } catch {
    return null;
  }
  return { text: String(text), dead: c.dead, dLt: c.linhThach - before.lt, dCult: c.cultivation - before.cult };
}

let checked = 0;
const bad: string[] = [];
for (const [name, list] of Object.entries(lists)) {
  for (const e of list) {
    if (seen.has(e.id)) continue;
    seen.add(e.id);
    let n = 0;
    try { n = e.choices(mk(e), 0).length; } catch { continue; }
    for (let i = 0; i < n; i++) {
      const b = run(e, i, 0, true);
      if (!b || !b.text.includes(OAN) || b.dead) continue;
      checked++;
      const a = run(e, i, 0.999, false);
      const why: string[] = [];
      if (a && !a.dead && a.text && !a.text.includes(OAN) && !KE_NAN.has(`${e.id}#${i}`)) {
        const first = a.text.split(/(?<=[.!?])\s/)[0];
        if (first.length > 8 && b.text.includes(first)) why.push('còn câu kết bình an: ' + first);
      }
      if (b.dLt > 0) why.push(`cộng ${b.dLt} linh thạch`);
      if (b.dCult > 0) why.push(`cộng ${Math.round(b.dCult)} tu vi`);
      if (why.length) bad.push(`${name}/${e.id}#${i}: ${why.join('; ')}\n    ${b.text.slice(0, 200)}`);
    }
  }
}
console.log(`Đã thử ${checked} lựa chọn có oan hồn cứu.`);
if (bad.length) {
  console.log(`LỖI ${bad.length}:\n` + bad.join('\n'));
  process.exit(1);
}
console.log('OK: không còn câu kết bình an, không cộng thưởng khi thoát chết.');
export {};
