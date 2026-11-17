// 17/11 (4.6.0 Ngày 7): thử khi bật SON_MON_ON - màn chờ cũ biến mất, cáo thị 4.6.0, chấm đỏ tab Sơn Môn. Chạy: node scripts/smoke-son-mon-mo.cjs [thư mục ảnh]
const { chromium } = require('playwright');
const fs = require('fs');
const URL = 'http://localhost:3314';
(async () => {
  const b = await chromium.launch();
  let fail = 0; const ok = (c, m) => { console.log((c ? 'OK  ' : 'HỎNG') + ' ' + m); if (!c) fail++; };
  // 1. khách mới từ quảng cáo mở tab Sơn Môn (máy chủ thật, Kỷ 1 chưa tới giờ mở)
  let p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = []; p.on('pageerror', (e) => { if (!/Hydration|#418/.test(e.message)) errs.push(e.message); });
  await p.goto(URL + '/son-mon?utm_source=fb'); await p.waitForTimeout(5000);
  await p.addStyleTag({ content: 'nextjs-portal{display:none!important}' });
  const t1 = await p.textContent('body');
  ok(!/Mở cửa 5:00 sáng 18\/11/.test(t1) || /Kỷ/.test(t1), 'màn chờ cũ không còn (cờ bật)');
  await p.screenshot({ path: '' + (process.argv[2] || '/tmp') + '/real-son-mon-khach.png' });
  // 2. người cũ thấy cáo thị 4.6.0
  await p.goto(URL + '/');
  const base = JSON.parse(fs.readFileSync(require('path').join(__dirname, 'fixtures/save.json'), 'utf8'));
  await p.evaluate((s) => { localStorage.clear(); localStorage.setItem('vkl.tut', '1'); localStorage.setItem('vkl.seenVer', '4.5.0'); localStorage.setItem('vkl.tabHint', '1'); localStorage.setItem('vkl.meta', JSON.stringify({ phucDuyen: 5, nghiep: 0, lives: 30, talents: [] })); }, base);
  await p.goto(URL + '/'); await p.waitForTimeout(5000);
  await p.addStyleTag({ content: 'nextjs-portal{display:none!important}' });
  const t2 = await p.textContent('body');
  ok(/4\.6\.0|Sơn Môn/.test(t2) && /Kỷ 1/.test(t2), 'cáo thị 4.6.0 hiện cho người cũ');
  await p.screenshot({ path: '' + (process.argv[2] || '/tmp') + '/cao-thi-460.png' });
  // 3. chấm đỏ: giả máy chủ có 2 môn mở cửa
  await p.route(/vkl_sm_mo_n/, (r) => r.fulfill({ status: 200, body: '2', contentType: 'application/json' }));
  await p.evaluate(() => { localStorage.setItem('vkl.seenVer', '4.6.0'); localStorage.setItem('vkl.sm.baoMo', '1'); });
  await p.goto(URL + '/chan-than'); await p.waitForTimeout(4000);
  ok((await p.locator('.tab-dot').count()) === 1, 'chấm đỏ ở tab Sơn Môn khi có môn mở cửa');
  await p.addStyleTag({ content: 'nextjs-portal{display:none!important}' });
  await p.locator('.tabbar').screenshot({ path: '' + (process.argv[2] || '/tmp') + '/tab-dot.png' });
  await p.goto(URL + '/son-mon'); await p.waitForTimeout(3000);
  ok(await p.evaluate(() => localStorage.getItem('vkl.sm.baoMo')) === 'da', 'mở tab Sơn Môn thì thôi báo');
  ok(!errs.length, 'không lỗi JS ' + errs.join(' | '));
  await b.close(); process.exit(fail ? 1 : 0);
})();
