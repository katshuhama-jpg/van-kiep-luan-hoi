/**
 * Thử cờ KIEP1_CN_GON (15/11, tăng trưởng): kiếp 1 của người mới không tự mở cẩm nang; kiếp 2 thì có Hồi 1.
 * Chạy: NEXT_PUBLIC_KIEP1_CN_GON=1 npx next dev -p 3314, rồi node scripts/smoke-kiep1-cn.cjs [thư mục ảnh].
 * Cờ tắt (CN_TAT=1): kiếp 1 vẫn tự mở Hồi 1 như cũ.
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const URL = process.env.SMOKE_URL || 'http://localhost:3314';
const SHOT = process.argv[2];
const TAT = !!process.env.CN_TAT;
const VER = (fs.readFileSync(path.join(__dirname, '../lib/releases.ts'), 'utf8').match(/v: '([0-9.]+)'/) || [])[1] || '';
const today = new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);
let fail = 0;
const ok = (c, m) => { console.log((c ? 'OK  ' : 'HỎNG') + ' ' + m); if (!c) fail++; };

async function page(b, meta) {
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  await p.route(/vkl_track|vkl_save/, (r) => r.fulfill({ status: 200, body: 'null', contentType: 'application/json' }));
  p.errs = [];
  p.on('pageerror', (e) => { if (!/Hydration|#418/.test(e.message)) p.errs.push(e.message.slice(0, 160)); });
  await p.goto(URL + '/');
  await p.evaluate(([m, v]) => { localStorage.clear(); localStorage.setItem('vkl.tut', '1'); localStorage.setItem('vkl.seenVer', v); localStorage.setItem('vkl.notice.down1101', '1'); localStorage.setItem('vkl.meta', JSON.stringify(m)); }, [meta, VER]);
  return p;
}
const cnOpen = (p) => p.evaluate(() => !!document.querySelector('.cn-wrap'));

(async () => {
  const b = await chromium.launch();
  // 1. người mới, kiếp 1
  const CT = { name: 'Vân Tâm', gender: 'nu', skin: 1, hair: 2, hairColor: 5, outfit: 3, createdAt: 1, renamed: 0 };
  let p = await page(b, { phucDuyen: 0, nghiep: 0, lives: 0, talents: [], enemy: null, streak: { day: today, n: 1 }, checkin: today });
  await p.goto(URL + '/choi'); await p.waitForTimeout(7000);
  await p.addStyleTag({ content: 'nextjs-portal{display:none!important}' });
  await p.locator('button', { hasText: 'Vào kiếp đầu' }).first().click({ timeout: 8000 }).catch(() => {});
  // trả lời các sự kiện đầu đời (bấm lựa chọn đầu) trong 25 giây, xem cẩm nang có tự mở không
  let thay = false;
  for (let i = 0; i < 25 && !thay; i++) {
    await p.waitForTimeout(1000);
    thay = await cnOpen(p);
    if (!thay) await p.locator('.choice, .choices button, button.opt').first().click({ timeout: 500 }).catch(() => {});
  }
  if (SHOT) await p.screenshot({ path: path.join(SHOT, `kiep1-${TAT ? 'co-tat' : 'co-bat'}.png`) });
  const age = await p.evaluate(() => Number(document.querySelector('.age-big')?.textContent || -1));
  ok(age >= 0, 'đã vào kiếp 1, tuổi ' + age);
  ok(TAT ? thay : !thay, TAT ? 'cờ tắt: kiếp 1 vẫn tự mở cẩm nang' : 'cờ bật: kiếp 1 không tự mở cẩm nang (25 giây, đã trả lời sự kiện)');
  ok(!p.errs.length, 'kiếp 1 không lỗi JS ' + p.errs.join(' | '));
  // 2. kiếp 2 (đã xong 1 kiếp): Hồi 1 tự mở khi cờ bật
  if (!TAT) {
    p = await page(b, { phucDuyen: 3, nghiep: 0, lives: 1, talents: [], enemy: null, streak: { day: today, n: 1 }, checkin: today, chanThan: CT });
    await p.goto(URL + '/choi'); await p.waitForTimeout(7000);
    await p.addStyleTag({ content: 'nextjs-portal{display:none!important}' });
    await p.locator('button', { hasText: 'thời gian' }).filter({ hasText: 'Đầu thai' }).first().click({ timeout: 8000 }).catch(() => {});
    let co = false;
    for (let i = 0; i < 15 && !co; i++) { await p.waitForTimeout(1000); co = await cnOpen(p); }
    if (SHOT) await p.screenshot({ path: path.join(SHOT, 'kiep2-hoi1.png') });
    ok(co, 'kiếp 2: Hồi 1 Một kiếp người tự mở');
    ok(!p.errs.length, 'kiếp 2 không lỗi JS ' + p.errs.join(' | '));
  }
  await b.close();
  console.log(fail ? `\n${fail} mục HỎNG` : '\nTất cả OK');
  process.exit(fail ? 1 : 0);
})();
