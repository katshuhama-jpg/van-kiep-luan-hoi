/**
 * 4.2.0 Công pháp: trừ yêu ra chiêu theo công pháp (có hiệu ứng, thanh của đạo), mở Tàng Kinh Các,
 * nâng tầng tốn tàn quyển, mang chiêu vào ô, dung hợp ra tuyệt kỹ, chọn truyền thừa.
 * Chạy: npx next start -p 3314 (cửa sổ khác), rồi node scripts/smoke-congphap.cjs. Thoát mã 1 nếu hỏng.
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

async function open(b, char, pause) {
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  await p.route(/vkl_track|vkl_save/, (r) => r.fulfill({ status: 200, body: 'null', contentType: 'application/json' }));
  p.errs = [];
  p.on('pageerror', (e) => { if (!/Hydration|#418/.test(e.message)) p.errs.push(e.message.slice(0, 160)); });
  await p.goto(URL + '/');
  const s = JSON.parse(JSON.stringify(base)); s.pending = null; Object.assign(s.char, { dead: false, lifeNo: 6 }, char);
  await p.evaluate(([s, m, v]) => { localStorage.clear(); localStorage.setItem('vkl.tut', '1'); localStorage.setItem('vkl.seenVer', v); localStorage.setItem('vkl.notice.down1101', '1'); localStorage.setItem('vkl.save', JSON.stringify(s)); localStorage.setItem('vkl.meta', JSON.stringify(m)); }, [s, META, VER]);
  await p.goto(URL + '/choi');
  if (pause) await p.locator('button.play[aria-label="Tạm dừng"]').click({ timeout: 15000 }).catch(() => {});
  await p.waitForTimeout(pause ? 1500 : 7000);
  await p.addStyleTag({ content: 'nextjs-portal{display:none!important}' });
  return p;
}
const save = async (p) => JSON.parse(await p.evaluate(() => localStorage.getItem('vkl.save'))).char;

(async () => {
  // 17/11 (Truong Pham hỏi): chiêu chạm trần vì tâm pháp thấp thì nút ghi rõ "Cần tâm pháp T..." và lý do
  const b = await chromium.launch();
  const p = await open(b, {
    path: 'kiem', realm: 4, tq: { kim_xa: 5, liet_hoa: 4 }, cultivation: 1e7, focus: 'tu_luyen', huntTarget: undefined,
    cp: { own: [{ id: 'thanh_lien', tang: 3, exp: 100 }, { id: 'kim_xa', tang: 5, exp: 100 }, { id: 'liet_hoa', tang: 3, exp: 50 }], eq: ['thanh_lien', 'kim_xa', 'liet_hoa'] },
  }, true);
  await p.locator('button.play[aria-label="Tạm dừng"]').click({ timeout: 3000 }).catch(() => {});
  for (let i = 0; i < 6 && !(await p.locator('.dock-actions').count()); i++) {
    await p.locator('.choice').last().click({ timeout: 1000 }).catch(() => {});
    await p.locator('.duel-warn .btn-dark').last().click({ timeout: 1000 }).catch(() => {});
    await p.waitForTimeout(600);
  }
  await p.locator('.dock-actions button', { hasText: 'Công pháp' }).click({ timeout: 5000 }).catch(() => {});
  await p.waitForTimeout(1200);
  const row = p.locator('#tk-kim_xa');
  await row.scrollIntoViewIfNeeded().catch(() => {});
  const btn = (await row.locator('.tk-up').textContent().catch(() => '')) || '';
  const why = (await row.textContent().catch(() => '')) || '';
  ok(/Cần tâm pháp T4/.test(btn), 'nút ghi "Cần tâm pháp T4": ' + btn);
  ok(/tối đa 2 tầng/.test(why), 'có dòng lý do chiêu cao hơn tâm pháp tối đa 2 tầng');
  ok(/Thiếu quyển tâm pháp\? Chép 3 quyển Liệt Hỏa/.test(why), 'gợi ý chép 3 quyển dư thành quyển tâm pháp');
  ok(/hồi máu bằng 30% sát thương gây ra/.test(why), 'mô tả Kim Xà ghi hồi máu theo sát thương');
  if (process.argv[2]) await row.screenshot({ path: process.argv[2] });
  ok(!p.errs.length, 'không lỗi JS ' + p.errs.join(' | '));
  await b.close();
  console.log(fail ? `HỎNG ${fail}` : 'Tất cả OK');
  process.exit(fail ? 1 : 0);
})();
