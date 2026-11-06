/**
 * 6/11: tàn quyển tuyệt kỹ bán ở Phường thị khi đã có 2 chiêu tầng 9, và dòng chỉ chỗ tìm ở Dung hợp.
 * Chạy: npx next start -p 3314, rồi node scripts/smoke-tuyet.cjs. SHOT=thư mục để lưu ảnh.
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
const SHOT = process.env.SHOT;
async function open(b, char) {
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: SHOT ? 2 : 1 });
  await p.route(/vkl_track|vkl_save/, (r) => r.fulfill({ status: 200, body: 'null', contentType: 'application/json' }));
  p.errs = [];
  p.on('pageerror', (e) => { if (!/Hydration|#418/.test(e.message)) p.errs.push(e.message.slice(0, 160)); });
  await p.goto(URL + '/');
  const s = JSON.parse(JSON.stringify(base)); s.pending = null; Object.assign(s.char, { dead: false, lifeNo: 6 }, char);
  await p.evaluate(([s, m, v]) => { localStorage.clear(); localStorage.setItem('vkl.tut', '1'); localStorage.setItem('vkl.seenVer', v); localStorage.setItem('vkl.notice.down1101', '1'); localStorage.setItem('vkl.camnang', JSON.stringify(['mot_kiep', 'canh_gioi', 'nga_re', 'tong_mon', 'danh_nhau', 'phi_thang', 'luan_hoi'])); localStorage.setItem('vkl.save', JSON.stringify(s)); localStorage.setItem('vkl.meta', JSON.stringify(m)); }, [s, META, VER]);
  await p.goto(URL + '/choi');
  await p.waitForTimeout(6000);
  await p.addStyleTag({ content: 'nextjs-portal{display:none!important}' });
  await p.locator('button.play[aria-label="Tạm dừng"]').click({ timeout: 3000 }).catch(() => {});
  for (let i = 0; i < 6 && !(await p.locator('.dock-actions').count()); i++) {
    await p.locator('.choice').last().click({ timeout: 1000 }).catch(() => {});
    await p.locator('.duel-warn .btn-dark').last().click({ timeout: 1000 }).catch(() => {});
    await p.waitForTimeout(600);
  }
  return p;
}
const save = async (p) => JSON.parse(await p.evaluate(() => localStorage.getItem('vkl.save'))).char;
const CP9 = { own: [{ id: 'thanh_lien', tang: 5, exp: 100 }, { id: 'liet_hoa', tang: 9, exp: 0 }, { id: 'kim_xa', tang: 9, exp: 0 }], eq: ['thanh_lien', 'liet_hoa', 'kim_xa'] };

(async () => {
  const b = await chromium.launch();
  // 1. Đủ 2 chiêu tầng 9: Phường thị có tàn quyển Vạn Kiếm Quy Tông
  let p = await open(b, { path: 'kiem', realm: 10, age: 700, lifespan: 975, cosmos: 'tien', ascended: true, linhThach: 500000, tq: { van_kiem: 1 }, cp: CP9, focus: 'tu_luyen', huntTarget: undefined });
  await p.locator('.dock-actions button', { hasText: 'Phường thị' }).click({ timeout: 5000 }).catch(() => {});
  await p.waitForTimeout(600);
  await p.locator('.tabs button', { hasText: 'Tàn quyển' }).click({ timeout: 5000 }).catch(() => {});
  await p.waitForTimeout(300);
  const row = p.locator('.items .item', { hasText: 'Vạn Kiếm Quy Tông' });
  ok((await row.count()) === 1, 'Phường thị bán tàn quyển tuyệt kỹ Vạn Kiếm Quy Tông khi đã có 2 chiêu tầng 9');
  ok(/Tuyệt kỹ · cần 3 quyển/.test(await row.innerText().catch(() => '')), 'ghi rõ là tuyệt kỹ, cần 3 quyển để dung hợp');
  if (SHOT) await p.screenshot({ path: SHOT + '/shop-tuyet.png' });
  for (let i = 0; i < 3; i++) { await row.locator('.btn').click({ timeout: 3000 }).catch(() => {}); await p.waitForTimeout(300); }
  let ch = await save(p);
  ok((ch.tq?.van_kiem ?? 0) === 3 && ch.linhThach < 500000, 'mua được, chung giới hạn mỗi năm 2 quyển: ' + JSON.stringify(ch.tq));
  await p.locator('.sheet .ss-x, .sheet-close, button[aria-label="Đóng"]').first().click({ timeout: 3000 }).catch(() => {});
  await p.waitForTimeout(300);
  // 2. Dung hợp: dòng chỉ chỗ tìm
  await p.locator('.dock-actions button', { hasText: 'Công pháp' }).click({ timeout: 5000 }).catch(() => {});
  await p.waitForTimeout(600);
  await p.locator('.chip-btn', { hasText: 'Dung hợp' }).click({ timeout: 5000 }).catch(() => {});
  await p.waitForTimeout(300);
  const where = await p.locator('.fs-where').innerText().catch(() => '');
  ok(/chặn đường/.test(where) && /bóng kiếp trước/.test(where) && /Phường thị/.test(where) && /Trừ yêu thường không rơi/.test(where), 'Dung hợp ghi rõ tàn quyển tuyệt kỹ tìm ở đâu');
  if (SHOT) { await p.locator('.fs-odds').scrollIntoViewIfNeeded().catch(() => {}); await p.screenshot({ path: SHOT + '/dung-hop-where.png' }); }
  ok(!p.errs.length, 'không lỗi JS ' + p.errs.join(' | '));
  await p.close();
  // 3. Chưa đủ 2 chiêu tầng 9: không bán tuyệt kỹ
  p = await open(b, { path: 'kiem', realm: 10, age: 700, lifespan: 975, cosmos: 'tien', ascended: true, linhThach: 500000, cp: { own: [{ id: 'thanh_lien', tang: 5, exp: 100 }, { id: 'liet_hoa', tang: 9, exp: 0 }, { id: 'kim_xa', tang: 7, exp: 0 }], eq: ['thanh_lien', 'liet_hoa', 'kim_xa'] }, focus: 'tu_luyen', huntTarget: undefined });
  await p.locator('.dock-actions button', { hasText: 'Phường thị' }).click({ timeout: 5000 }).catch(() => {});
  await p.waitForTimeout(600);
  await p.locator('.tabs button', { hasText: 'Tàn quyển' }).click({ timeout: 5000 }).catch(() => {});
  await p.waitForTimeout(300);
  ok((await p.locator('.items .item', { hasText: 'Vạn Kiếm Quy Tông' }).count()) === 0, 'chưa đủ 2 chiêu tầng 9 thì chưa bán tuyệt kỹ');
  ok((await p.locator('.items .item', { hasText: 'Kim Xà' }).count()) === 1, 'vẫn bán tàn quyển chiêu đang mang');
  await b.close();
  console.log(fail ? `${fail} mục HỎNG` : 'Tất cả OK');
  process.exit(fail ? 1 : 0);
})();
