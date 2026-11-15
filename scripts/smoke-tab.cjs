// 15/11 (4.6.0 Ngày 5): thử thanh 4 tab, thanh trên (Mời trà + Menu), màn chờ Sơn Môn, câu hướng dẫn cho người cũ.
// Chạy: npx next dev -p 3314, rồi node scripts/smoke-tab.cjs [thư mục ảnh]. Thoát mã 1 nếu hỏng.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const URL = process.env.SMOKE_URL || 'http://localhost:3314';
const DIR = process.argv[2];
const VER = (fs.readFileSync(path.join(__dirname, '../lib/releases.ts'), 'utf8').match(/v: '([0-9.]+)'/) || [])[1];
const today = new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);
const CT = { name: 'Vân Tâm', gender: 'nu', skin: 1, hair: 2, hairColor: 5, outfit: 3, createdAt: 1, renamed: 0 };
const OLD = { phucDuyen: 50, nghiep: 0, lives: 12, talents: [], enemy: null, streak: { day: today, n: 1 }, checkin: today, chanThan: CT, huyet: [{ id: 1, life: 3 }], career: { maxAge: 120, maxRealm: 3, ascPaths: [], paths: ['kiem'], duelWins: 0, revenges: 0, cosmoses: [], hanh: { kim: 1 } }, endings: { chung_dao: 1 } };
let fail = 0;
const ok = (c, m) => { console.log((c ? 'OK  ' : 'HỎNG') + ' ' + m); if (!c) fail++; };
const shot = async (p, n) => DIR && p.screenshot({ path: path.join(DIR, n + '.png') });

async function page(b, meta, hint) {
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  await p.route(/vkl_track|vkl_save/, (r) => r.fulfill({ status: 200, body: 'null', contentType: 'application/json' }));
  p.errs = [];
  p.on('pageerror', (e) => { if (!/Hydration|#418/.test(e.message)) p.errs.push(e.message.slice(0, 160)); });
  await p.goto(URL + '/');
  await p.evaluate(([m, v, h]) => {
    localStorage.clear();
    localStorage.setItem('vkl.seenVer', v);
    localStorage.setItem('vkl.tut', '1');
    if (m) localStorage.setItem('vkl.meta', JSON.stringify(m));
    if (h) localStorage.setItem('vkl.tabHint', '1');
  }, [meta, VER, hint]);
  return p;
}
const onTab = (p) => p.$eval('.tab-item.on', (e) => e.textContent.trim()).catch(() => '');
const noHScroll = (p) => p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
async function smallTargets(p, sel) {
  return p.$$eval(sel, (els) => els.filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height < 44; }).map((e) => e.textContent.trim().slice(0, 20)));
}

(async () => {
  const b = await chromium.launch();
  // người mới: không có câu hướng dẫn, thanh tab có đủ 4 tab
  let p = await page(b, null, false);
  await p.goto(URL + '/');
  await p.waitForSelector('.tabbar');
  const tabs = await p.$$eval('.tab-item', (e) => e.map((x) => x.textContent.trim()));
  ok(tabs.join('|') === 'Mộng|Nhân vật|Sơn Môn|Lôi đài', 'đủ 4 tab: ' + tabs.join(', '));
  ok((await onTab(p)).includes('Mộng'), 'trang đầu sáng tab Mộng');
  ok(!(await p.$('.tab-hint')), 'người mới không thấy câu hướng dẫn');
  ok(!!(await p.$('.top-tra')), 'Mời trà ở thanh trên');
  ok(!!(await p.$('.home-tra')), 'thẻ Mời tác giả chén trà vẫn còn ở trang đầu');
  ok(await noHScroll(p), 'trang đầu không tràn ngang');
  ok((await smallTargets(p, '.tab-item, .top-menu .btn')).length === 0, 'nút tab và thanh trên cao từ 44px');
  await shot(p, 'tab-mong-moi');
  await p.click('.top-menu-btn');
  await p.waitForSelector('.drawer');
  const rows = await p.$$eval('.drawer-row', (e) => e.map((x) => x.textContent.trim()));
  ok(rows.some((r) => r.startsWith('Cập nhật')) && rows.includes('Góp ý') && rows.includes('Trang Facebook'), 'Menu có Cập nhật, Góp ý, Facebook');
  await shot(p, 'tab-menu');
  await p.click('.drawer-x');
  ok(!(await p.$('.drawer')), 'đóng menu');
  // Sơn Môn: màn chờ
  await p.click('.tab-item:nth-child(3)');
  await p.waitForURL(/son-mon/);
  await p.waitForSelector('.sm-card');
  const sm = await p.textContent('main');
  ok(sm.includes('Mở cửa 5:00 sáng 18/11'), 'tab Sơn Môn: màn chờ ghi ngày mở');
  ok((await p.$$('main .sm-card button, main .sm-card a')).length === 0, 'màn chờ không có nút nào khác');
  ok((await onTab(p)).includes('Sơn Môn'), 'sáng tab Sơn Môn');
  await shot(p, 'tab-son-mon');
  // Lôi đài
  await p.click('.tab-item:nth-child(4)');
  await p.waitForURL(/loi-dai/);
  await p.waitForSelector('a[href="/bang-xep-hang"]');
  ok(true, 'tab Lôi đài có Bảng xếp hạng');
  ok(await noHScroll(p), 'Lôi đài không tràn ngang');
  await shot(p, 'tab-loi-dai');
  ok(p.errs.length === 0, 'không lỗi JS ' + p.errs.join(' | '));
  await p.close();

  // người cũ: thấy câu hướng dẫn một lần
  p = await page(b, OLD, false);
  await p.goto(URL + '/');
  await p.waitForSelector('.tab-hint');
  ok(true, 'người cũ thấy câu hướng dẫn bố cục mới');
  await shot(p, 'tab-mong-cu');
  await p.click('.tab-hint-ok');
  await p.reload();
  await p.waitForSelector('.tabbar');
  await p.waitForTimeout(500);
  ok(!(await p.$('.tab-hint')), 'bấm Đã hiểu thì không hiện lại');
  // Nhân vật
  await p.click('.tab-item:nth-child(2)');
  await p.waitForURL(/chan-than/);
  await p.waitForTimeout(1500);
  ok((await onTab(p)).includes('Nhân vật'), 'sáng tab Nhân vật');
  ok(await noHScroll(p), 'Nhân vật không tràn ngang');
  await shot(p, 'tab-nhan-vat');
  await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await p.waitForTimeout(300);
  await shot(p, 'tab-nhan-vat-cuoi');
  // nội dung cuối trang không bị thanh tab che
  const covered = await p.evaluate(() => {
    const bar = document.querySelector('.tabbar').getBoundingClientRect().top;
    const kids = [...document.querySelectorAll('main > *:not(.tabbar):not(.tab-hint)')].filter((e) => e.getBoundingClientRect().height > 0);
    const last = kids[kids.length - 1];
    return last ? last.getBoundingClientRect().bottom > bar + 1 : false;
  });
  ok(!covered, 'cuối trang Nhân vật không bị thanh tab che');
  ok(p.errs.length === 0, 'không lỗi JS ' + p.errs.join(' | '));
  await b.close();
  console.log(fail ? `\n${fail} HỎNG` : '\nTất cả OK');
  process.exit(fail ? 1 : 0);
})();
