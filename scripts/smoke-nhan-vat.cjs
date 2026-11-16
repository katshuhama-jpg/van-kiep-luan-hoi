/**
 * 16/11: thử tab Nhân vật mới (sân khấu, ô đồ, lực chiến, tab con, mang/bỏ đồ, đổi áo) và tab Tam Tài.
 * Chạy: SMOKE_URL=http://localhost:3402 node scripts/smoke-nhan-vat.cjs. Thoát mã 1 nếu hỏng.
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const URL = process.env.SMOKE_URL || 'http://localhost:3314';
const VER = (fs.readFileSync(path.join(__dirname, '../lib/releases.ts'), 'utf8').match(/v: '([0-9.]+)'/) || [])[1] || '';
const today = new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);
const META = { phucDuyen: 50, nghiep: 0, lives: 12, talents: [], enemy: null, streak: { day: today, n: 1 }, checkin: today, chanThan: { name: 'Thanh Vân', gender: 'nam', skin: 1, hair: 1, hairColor: 1, outfit: 2, createdAt: 1, renamed: 0 }, huyet: [{ id: 1, life: 3 }], career: { maxAge: 120, maxRealm: 3, ascPaths: [], paths: ['kiem'], duelWins: 0, revenges: 0 } };
let fail = 0;
const ok = (c, m) => { console.log((c ? 'OK  ' : 'HỎNG') + ' ' + m); if (!c) fail++; };
const meta = (p) => p.evaluate(() => JSON.parse(localStorage.getItem('vkl.meta')));

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = [];
  p.on('pageerror', (e) => { if (!/Hydration|#418/.test(e.message)) errs.push(e.message.slice(0, 160)); });
  await p.route(/vkl_track|vkl_save/, (r) => r.fulfill({ status: 200, body: 'null', contentType: 'application/json' }));
  await p.goto(URL + '/');
  await p.evaluate(([m, v]) => { localStorage.clear(); localStorage.setItem('vkl.tut', '1'); localStorage.setItem('vkl.seenVer', v); localStorage.setItem('vkl.tabHint', '1'); localStorage.setItem('vkl.notice.down1101', '1'); localStorage.setItem('vkl.meta', JSON.stringify(m)); }, [META, VER]);
  await p.goto(URL + '/'); await p.waitForTimeout(3000);
  ok(!(await p.$('.ct-home')), 'trang đầu không còn thẻ chân thân đen');
  await p.goto(URL + '/chan-than'); await p.waitForSelector('.nv-stage');
  ok((await p.$$('.nv-slot')).length === 6, 'sân khấu có 6 ô đồ (Phụ kiện, Ngoại trang)');
  const lc = await p.textContent('.nv-power b');
  ok(/^[0-9.]+$/.test(lc.trim()) && parseInt(lc.replace(/\./g, '')) > 1000, 'có lực chiến: ' + lc);
  await p.click('.nv-power'); ok(!!(await p.$('.nv-why2')), 'chạm lực chiến thấy cách tính'); await p.click('.nv-power');
  ok((await p.textContent('.nv-title')).trim() === 'Kim Đan', 'danh hiệu theo cảnh giới cao nhất (Kim Đan)');
  // Mũ: mang nón lá rồi bỏ
  await p.click('.nv-slot >> nth=0'); await p.waitForTimeout(300);
  ok((await p.textContent('.nv-tab.on')).includes('Mũ'), 'chạm ô Mũ mở tab Mũ');
  await p.click('.nv-cell:has-text("Nón lá")'); await p.waitForTimeout(300);
  ok((await meta(p)).chanThan.gear?.mu === 'non_la', 'mang nón lá được lưu');
  ok((await p.textContent('.nv-slot >> nth=0')).includes('Nón lá'), 'ô Mũ ghi Nón lá');
  await p.click('.nv-cell:has-text("Kim miện")'); await p.waitForTimeout(200);
  ok(/chưa mở/.test(await p.textContent('.nv-say')) && !(await meta(p)).chanThan.gear?.mu?.includes('kim'), 'Kim miện khóa: chạm thấy cách mở, không mặc được');
  await p.click('.nv-cell:has-text("Nón lá")'); await p.waitForTimeout(300);
  ok(!(await meta(p)).chanThan.gear?.mu, 'chạm lần nữa thì bỏ mũ');
  // Vũ khí: Ngân thoa, Thiết kiếm mở từ Kim Đan
  await p.click('.nv-tab:has-text("Vũ khí")');
  await p.click('.nv-cell:has-text("Thiết kiếm")'); await p.waitForTimeout(300);
  ok((await meta(p)).chanThan.gear?.vu_khi === 'thiet_kiem', 'mang Thiết kiếm (đã lên Kim Đan)');
  // Quần áo: người mới chưa có món nào, chạm thấy cách mở
  await p.click('.nv-tab:has-text("Quần áo")');
  ok((await p.$$('.nv-cell.lock')).length === (await p.$$('.nv-cell')).length, 'Quần áo: chưa có món nào (đều khóa)');
  // Ngoại trang: ô thứ 6 dưới Cánh
  await p.click('.nv-slot:has-text("Ngoại trang")'); await p.waitForTimeout(200);
  ok((await p.textContent('.nv-tab.on')).includes('Ngoại trang'), 'chạm ô Ngoại trang mở tab Ngoại trang');
  ok((await p.$$('.nv-cell')).length === 11, 'Ngoại trang có 11 bộ (có Áo người gõ chuông)');
  ok(!!(await p.$('.nv-cell:has-text("Áo người gõ chuông")')), 'có Áo người gõ chuông');
  const small = await p.$$eval('.nv-tab, .nv-power', (els) => els.filter((e) => e.getBoundingClientRect().height < 44).length);
  ok(small === 0, 'nút từ 44px');
  ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'không tràn ngang');
  ok(!!(await p.$('.nv-cp')), 'có mục công pháp chân thân (để trống)');
  const order = await p.evaluate(() => { const st = document.querySelector('.nv-stage').getBoundingClientRect().top, su = document.querySelector('#su-do')?.getBoundingClientRect().top ?? -1, bag = document.querySelector('.nv-bag').getBoundingClientRect().top; return st < su && su < bag; });
  ok(order, 'Sư Đồ nằm giữa nhân vật và hòm đồ');
  // Tam Tài
  await p.goto(URL + '/tam-tai'); await p.waitForSelector('.nv-stage.tt');
  ok((await p.$$('.hb-dot.lit')).length === 1, 'Tam Tài: 1 huyệt sáng');
  ok(!!(await p.$('.ttai-board')), 'Tam Tài có bảng Tam Tài');
  ok(errs.length === 0, 'không lỗi JS ' + errs.join(' | '));
  await b.close();
  console.log(fail ? `\n${fail} HỎNG` : '\nTất cả OK');
  process.exit(fail ? 1 : 0);
})();
