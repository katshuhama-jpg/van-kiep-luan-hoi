/**
 * 4/11: thẻ sự kiện thu gọn được để đọc gia phả, mở lại để chọn.
 * Chạy: npx next start -p 3314 (cửa sổ khác), rồi node scripts/smoke-event.cjs. Thoát mã 1 nếu hỏng.
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
  const s = JSON.parse(JSON.stringify(base)); s.pending = char.__pending || null; delete char.__pending; Object.assign(s.char, { dead: false, lifeNo: 6 }, char);
  await p.evaluate(([s, m, v]) => { localStorage.clear(); localStorage.setItem('vkl.tut', '1'); localStorage.setItem('vkl.seenVer', v); localStorage.setItem('vkl.notice.down1101', '1'); localStorage.setItem('vkl.save', JSON.stringify(s)); localStorage.setItem('vkl.meta', JSON.stringify(m)); }, [s, META, VER]);
  await p.goto(URL + '/choi');
  if (pause) await p.locator('button.play[aria-label="Tạm dừng"]').click({ timeout: 15000 }).catch(() => {});
  await p.waitForTimeout(pause ? 1500 : 7000);
  await p.addStyleTag({ content: 'nextjs-portal{display:none!important}' });
  return p;
}
const save = async (p) => JSON.parse(await p.evaluate(() => localStorage.getItem('vkl.save'))).char;

(async () => {
  const b = await chromium.launch();
  const ev = { id: 'gap_cao_nhan', title: 'Cao nhân bên suối', text: 'Một lão nhân ngồi câu cá bên suối, ngoảnh lại nhìn bạn.', choices: [{ label: 'Cúi chào', lean: 'chinh' }, { label: 'Lờ đi', lean: 'trung' }] };
  const p = await open(b, { __pending: ev }, false);
  await p.waitForTimeout(1500);
  ok(await p.locator('.dialog.event .choice').count() === 2, 'sự kiện hiện đủ lựa chọn');
  ok(await p.locator('.choice.arming').count() === 0, 'sau 0,7 giây lựa chọn bấm được (chống bấm nhầm khi sự kiện vừa nhảy ra)');
  await p.locator('.event-min').click({ timeout: 5000 }).catch(() => {});
  await p.waitForTimeout(300);
  ok(await p.locator('.choice').count() === 0 && await p.locator('.event-open').count() === 1, 'bấm Thu gọn: ẩn lựa chọn, còn thanh mở lại');
  const h = await p.locator('.dialog.event').boundingBox();
  ok(h && h.height < 80, 'thu gọn còn một thanh thấp (' + Math.round(h?.height ?? 0) + 'px)');
  if (process.env.SHOT) await p.screenshot({ path: process.env.SHOT + '/ev-mini.png' });
  await p.locator('.event-open').click({ timeout: 5000 }).catch(() => {});
  await p.waitForTimeout(300);
  ok(await p.locator('.dialog.event .choice').count() === 2, 'mở lại: chọn được như cũ');
  if (process.env.SHOT) await p.screenshot({ path: process.env.SHOT + '/ev-full.png' });
  ok(!p.errs.length, 'không lỗi JS ' + p.errs.join(' | '));
  await b.close();
  console.log(fail ? '\nCÓ LỖI' : '\nTất cả OK');
  process.exit(fail ? 1 : 0);
})();
