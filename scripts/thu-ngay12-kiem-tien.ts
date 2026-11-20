// Ngày 12 mục 1: kiếm tiền quá độ ở giới trên ra đúng câu của từng giới, cả nhánh chết và nhánh thoát.
// Chạy: npx tsx scripts/thu-ngay12-kiem-tien.ts
import { OVERWORK } from '../lib/game/engine';
import { demoChar } from '../lib/game/demo';
let hong = 0;
const ok = (c: boolean, m: string) => { console.log((c ? 'OK   ' : 'HONG ') + m); if (!c) hong++; };
const hit = OVERWORK.kiem_tien.hits.find((h) => h.p === 1)!;
const mau: Record<string, [RegExp, RegExp]> = {
  hg: [/Thao Thiết thức giấc/, /Thao Thiết đánh hơi/], tien: [/Lôi Bộ gán tội/, /Lôi Bộ tới xét nhà/],
  ma: [/đâm dao vào lưng/, /trở mặt, cuỗm/], hu: [/nửa thân đã không còn/, /Hư không nuốt mất một góc kho/],
};
for (const co of ['hg', 'tien', 'ma', 'hu'] as const) {
  for (const chet of [true, false]) {
    const c = demoChar({ realm: co === 'hg' ? 15 : 9, layer: 3, cosmos: co, age: 900, lifespan: 9000, lifeNo: 20, path: 'kiem' });
    c.linhThach = 1000; c.stats.khiVan = 50; c.stats.sucKhoe = 90;
    const ctx = { rnd: () => (chet ? 0 : 0.99), fx: () => {}, log: () => {} };
    const t = hit.run(c, ctx);
    const tx = chet ? `${t} | cause: ${c.cause}` : t;
    ok(mau[co][chet ? 0 : 1].test(tx) && !/bờ sông/.test(tx) && !!c.dead === chet, `${co} ${chet ? 'chết' : 'thoát'}: ${tx.slice(0, 90)}`);
    if (chet) ok(!/bộ xương|skeleton/.test(c.cause ?? ''), `${co}: cause không nối câu kết thừa (${(c.cause ?? '').slice(-60)})`);
    else ok(c.linhThach === 650, `${co}: mất 35% linh thạch (${c.linhThach})`);
  }
}
const pham = demoChar({ realm: 3, layer: 1, age: 60, lifespan: 300 });
const tp = hit.run(pham, { rnd: () => 0.99, fx: () => {}, log: () => {} });
ok(/bỏ của chạy lấy người/.test(tp), 'phàm giới giữ câu cũ');
console.log(hong ? `HỎNG ${hong}` : 'TẤT CẢ OK');
process.exit(hong ? 1 : 0);
