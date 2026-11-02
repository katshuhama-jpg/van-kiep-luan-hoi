// 4.2.0: thử hệ thống linh thú (huy hiệu, màn linh thú, tiến hóa, sổ theo rank, hộ chủ trong trận, thần thú đi theo)
// Chạy: npx next start -p 3314 (hoặc dev), rồi node scripts/smoke-linhthu.cjs. SHOT_DIR=... để lưu ảnh.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const URL = process.env.SMOKE_URL || 'http://localhost:3314';
const DIR = process.env.SHOT_DIR || '';
const base = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/save.json'), 'utf8'));
const VER = (fs.readFileSync(path.join(__dirname, '../lib/releases.ts'), 'utf8').match(/v: '([0-9.]+)'/) || [])[1] || '';
const today = new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);
const META = { phucDuyen: 5, nghiep: 0, lives: 5, talents: [], enemy: null, streak: { day: today, n: 1 }, checkin: today, petBook: ['soi_con', 'tuyet_ho'], huyetMach: [{ id: 'tuyet_ho', life: 4 }] };
let fail = 0;
const ok = (c, m) => { console.log((c ? 'OK  ' : 'HỎNG') + ' ' + m); if (!c) fail++; };
const shot = (p, n, clip) => (DIR ? p.screenshot({ path: path.join(DIR, n + '.png'), clip }) : null);

async function open(b, extra) {
  const s = JSON.parse(JSON.stringify(base));
  s.pending = null;
  Object.assign(s.char, { dead: false, lifeNo: 6, realm: 3, layer: 1, age: 60, lifespan: 180, focus: 'tu_luyen', path: 'kiem', pet: true, petKind: 'xich_lang', petOf: 'xich_lang', petExp: 20, petEvo: 0, huyetMach: [{ id: 'tuyet_ho', life: 4 }], petBlood: 'tuyet_ho' }, extra);
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await p.route(/vkl_track|vkl_save/, (r) => r.fulfill({ status: 200, body: 'null', contentType: 'application/json' }));
  p.errs = [];
  p.on('pageerror', (e) => { if (!/Hydration|#418/.test(e.message)) p.errs.push(e.message.slice(0, 160)); });
  await p.goto(URL + '/');
  await p.evaluate(([s, m, v]) => { localStorage.clear(); localStorage.setItem('vkl.tut', '1'); localStorage.setItem('vkl.seenVer', v); localStorage.setItem('vkl.notice.down1101', '1'); localStorage.setItem('vkl.save', JSON.stringify(s)); localStorage.setItem('vkl.meta', JSON.stringify(m)); }, [s, META, VER]);
  await p.goto(URL + '/choi');
  await p.waitForTimeout(7000);
  await p.addStyleTag({ content: 'nextjs-portal{display:none!important}' });
  return p;
}
const save = async (p) => JSON.parse(await p.evaluate(() => localStorage.getItem('vkl.save'))).char;

(async () => {
  const b = await chromium.launch();
  // 1. huy hiệu, màn linh thú, tiến hóa
  let p = await open(b, {});
  ok((await p.locator('.lt-badge').count()) > 0, 'có huy hiệu linh thú trên sân khấu');
  await shot(p, 'lt-1-choi');
  await p.locator('.lt-badge').click({ timeout: 5000 }).catch(() => {});
  await p.waitForTimeout(900);
  ok((await p.locator('.lt-stage').count()) > 0, 'mở được màn linh thú');
  await shot(p, 'lt-2-sheet');
  await p.locator('.lt-box .btn-jade').click({ timeout: 5000 }).catch(() => {});
  await p.waitForTimeout(1500);
  ok(((await save(p)).petEvo ?? 0) === 1, 'tiến hóa lên bậc 2');
  await shot(p, 'lt-3-evo');
  await p.evaluate(() => { const s = document.querySelector('.forge-scene'); if (s) s.scrollTop = 99999; });
  await p.locator('.lt-book-i[aria-label="Thanh Long"]').click({ timeout: 5000 }).catch(() => {});
  await p.evaluate(() => { const s = document.querySelector('.forge-scene'); if (s) s.scrollTop = 0; });
  await p.waitForTimeout(600);
  await shot(p, 'lt-4-preview');
  await p.evaluate(() => { const s = document.querySelector('.forge-scene'); if (s) s.scrollTop = 99999; });
  await p.waitForTimeout(400);
  await shot(p, 'lt-5-book');
  ok(!p.errs.length, 'màn linh thú không lỗi JS ' + p.errs.join(' | '));
  // 2. hộ chủ trong trận
  p = await open(b, { focus: 'tru_yeu', huntTarget: 'hac_hung', petEvo: 1 });
  let claw = false;
  for (let i = 0; i < 80 && !claw; i++) {
    await p.waitForTimeout(500);
    // sự kiện năm (đấu giá, kỳ ngộ) chặn trận: chọn lựa chọn cuối cho qua
    if (await p.locator('.choice').count()) await p.locator('.choice').last().click().catch(() => {});
    claw = (await p.locator('.pet-claw').count()) > 0;
  }
  if (!claw) await shot(p, 'lt-6-nofight');
  ok(claw, 'linh thú lao vào đánh trong trận trừ yêu');
  if (claw) await shot(p, 'lt-6-fight');
  ok(!p.errs.length, 'trận đánh không lỗi JS ' + p.errs.join(' | '));
  // 3. thần thú đi theo
  p = await open(b, { petKind: 'thanh_long', petOf: 'thanh_long', petEvo: 0 });
  ok((await p.locator('.pet-roam.legend').count()) > 0, 'thần thú hiện trên sân khấu');
  await shot(p, 'lt-7-thanhlong');
  ok(!p.errs.length, 'thần thú không lỗi JS ' + p.errs.join(' | '));
  await b.close();
  console.log(fail ? `\n${fail} mục hỏng` : '\nTất cả OK');
  process.exit(fail ? 1 : 0);
})();
