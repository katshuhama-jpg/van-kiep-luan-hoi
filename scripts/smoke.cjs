/**
 * Thử nhanh luồng chính trên khung điện thoại trước khi đẩy:
 * vào game, mở túi đồ, mở lò rèn, gõ búa; chết rồi lập bia và sang kiếp mới; trang đầu không lỗi.
 * Chạy: npx next dev -p 3314 (cửa sổ khác), rồi node scripts/smoke.cjs. Thoát mã 1 nếu hỏng.
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const URL = process.env.SMOKE_URL || 'http://localhost:3314';
const base = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/save.json'), 'utf8'));
const VER = (fs.readFileSync(path.join(__dirname, '../lib/releases.ts'), 'utf8').match(/v: '([0-9.]+)'/) || [])[1] || '';
const today = new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);
const META = { phucDuyen: 5, nghiep: 0, lives: 5, talents: [], enemy: null, streak: { day: today, n: 1 }, checkin: today };
let fail = 0;
const ok = (c, m) => { console.log((c ? 'OK  ' : 'HỎNG') + ' ' + m); if (!c) fail++; };

async function page(b, save) {
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  await p.route(/vkl_track|vkl_save/, (r) => r.fulfill({ status: 200, body: 'null', contentType: 'application/json' }));
  p.errs = [];
  p.on('pageerror', (e) => { if (!/Hydration|#418/.test(e.message)) p.errs.push(e.message.slice(0, 160)); });
  await p.goto(URL + '/');
  await p.evaluate(([s, m, v]) => { localStorage.clear(); localStorage.setItem('vkl.tut', '1'); localStorage.setItem('vkl.seenVer', v); if (s) localStorage.setItem('vkl.save', JSON.stringify(s)); localStorage.setItem('vkl.meta', JSON.stringify(m)); }, [save, META, VER]);
  return p;
}

(async () => {
  const b = await chromium.launch();
  // 1. trang đầu
  let p = await page(b, null);
  await p.goto(URL + '/'); await p.waitForTimeout(4000);
  ok(await p.locator('text=Đầu thai').count() > 0, 'trang đầu có nút Đầu thai');
  ok(!p.errs.length, 'trang đầu không lỗi JS ' + p.errs.join(' | '));
  // 2. túi đồ + lò rèn
  const s1 = JSON.parse(JSON.stringify(base)); s1.pending = null;
  Object.assign(s1.char, { inventory: ['moc_kiem', 'thanh_sam', 'ngoc_boi'], equipped: { ao: 'thanh_sam', phu_kien: 'ngoc_boi' }, dead: false, lifeNo: 6, tinhHoa: 11 });
  p = await page(b, s1);
  await p.goto(URL + '/choi'); await p.waitForTimeout(8000);
  await p.addStyleTag({ content: 'nextjs-portal{display:none!important}' });
  await p.locator('button').filter({ hasText: /^Túi đồ$/ }).first().click({ timeout: 8000 }).catch(() => {});
  await p.waitForTimeout(1000);
  await p.locator('.doll-forge').click({ timeout: 5000 }).catch(() => {});
  await p.waitForTimeout(800);
  await p.locator('.fs-go').click({ timeout: 5000 }).catch(() => {});
  await p.waitForTimeout(3500);
  if (process.env.SMOKE_SHOT) await p.screenshot({ path: process.env.SMOKE_SHOT });
  const f = JSON.parse(await p.evaluate(() => localStorage.getItem('vkl.save'))).char;
  ok((f.tinhHoa ?? 0) < 11, 'gõ búa ở lò rèn có tác dụng');
  ok(!p.errs.length, 'màn chơi không lỗi JS ' + p.errs.join(' | '));
  // 3. chết, lập bia, sang kiếp mới
  const s2 = JSON.parse(JSON.stringify(base)); s2.pending = null;
  Object.assign(s2.char, { dead: true, cause: 'Thọ tận', lifeNo: 6 });
  p = await page(b, s2);
  await p.goto(URL + '/choi'); await p.waitForTimeout(8000);
  await p.addStyleTag({ content: 'nextjs-portal{display:none!important}' });
  await p.locator('button', { hasText: 'Lập bia và luân hồi' }).click({ timeout: 8000 }).catch(() => {});
  let moved = false;
  for (let i = 0; i < 25 && !moved; i++) { await p.waitForTimeout(1000); moved = !(await p.evaluate(() => /Lập bia và luân hồi|Đang khắc bia/.test(document.body.innerText))); }
  ok(moved, 'lập bia xong sang màn luân hồi');
  ok(!p.errs.length, 'màn chết không lỗi JS ' + p.errs.join(' | '));
  await b.close();
  console.log(fail ? `\n${fail} mục HỎNG` : '\nTất cả OK');
  process.exit(fail ? 1 : 0);
})();
