/**
 * 4/11: máy iOS 14-15 (iPhone 7 Plus) treo ở trang đầu, không bấm được gì. Giả lập trình duyệt thiếu
 * Array.at, Object.hasOwn, structuredClone; và kiểm mã đã build không còn cú pháp Safari dưới 16.4 không đọc được.
 * Chạy: npx next start -p 3314 (cửa sổ khác), rồi node scripts/smoke-oldios.cjs.
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const URL = process.env.SMOKE_URL || 'http://localhost:3314';
let fail = 0;
const ok = (c, m) => { console.log((c ? 'OK  ' : 'HỎNG') + ' ' + m); if (!c) fail++; };
// cú pháp: khối static trong class và lookbehind trong regex làm Safari < 16.4 bỏ cả tệp
const files = [];
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith('.js') && files.push(path.join(d, e.name))));
walk(path.join(__dirname, '../.next/static'));
const bad = files.filter((f) => { const s = fs.readFileSync(f, 'utf8'); return /\bstatic\{/.test(s) || /\(\?<[=!]/.test(s); });
ok(files.length > 0 && bad.length === 0, 'mã đã build không có khối static{} hay lookbehind (?<=) ' + bad.map((f) => path.basename(f)).join(','));
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 414, height: 736 } });
  const errs = [];
  p.on('pageerror', (e) => { if (!/Hydration|#418/.test(e.message)) errs.push(e.message.slice(0, 160)); });
  await p.addInitScript(() => { delete Array.prototype.at; delete String.prototype.at; delete Object.hasOwn; delete window.structuredClone; });
  await p.route(/vkl_track/, (r) => r.fulfill({ status: 200, body: 'null', contentType: 'application/json' }));
  await p.goto(URL + '/');
  await p.waitForTimeout(2500);
  ok(await p.evaluate(() => typeof [].at === 'function' && typeof Object.hasOwn === 'function' && typeof structuredClone === 'function'), 'trang đầu tự bù Array.at, Object.hasOwn, structuredClone');
  const before = await p.locator('html').getAttribute('lang');
  await p.locator('button', { hasText: 'EN' }).first().click({ timeout: 5000 }).catch(() => {});
  await p.waitForTimeout(1500);
  ok((await p.locator('html').getAttribute('lang')) !== before || (await p.locator('text=Be reborn').count()) > 0 || (await p.locator('text=Reborn').count()) > 0, 'trang đầu bấm được nút đổi ngôn ngữ');
  await p.goto(URL + '/choi');
  await p.waitForTimeout(6000);
  ok(!(await p.locator('text=Đang mở luân hồi đài').count()) && !(await p.locator('text=Opening').count()), 'vào /choi không treo ở Đang mở luân hồi đài');
  ok(!errs.length, 'không lỗi JS ' + errs.join(' | '));
  await b.close();
  console.log(fail ? '\nCÓ LỖI' : '\nTất cả OK');
  process.exit(fail ? 1 : 0);
})();
