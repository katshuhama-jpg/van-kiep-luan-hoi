// #235 (13/11): sổ linh thú trong kiếp ghi ngay loài vừa thu phục (petSeen), không đợi cuối kiếp.
// Chạy: npx next dev -p 3314, rồi node scripts/smoke-so-thu.cjs. SHOT_DIR=... để lưu ảnh.
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

async function open(b, extra, wait = 7000) {
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
  await p.waitForTimeout(wait);
  await p.addStyleTag({ content: 'nextjs-portal{display:none!important}' });
  return p;
}
const save = async (p) => JSON.parse(await p.evaluate(() => localStorage.getItem('vkl.save'))).char;

(async () => {
  const b = await chromium.launch();
  const p = await open(b, { petSeen: ['xich_lang', 'cung_ky'] });
  await p.locator('.lt-badge').click({ timeout: 5000 }).catch(() => {});
  await p.waitForTimeout(900);
  ok((await p.locator('.lt-stage').count()) > 0, 'mở được màn linh thú');
  await p.evaluate(() => { const s = document.querySelector('.forge-scene'); if (s) s.scrollTop = 99999; });
  await p.waitForTimeout(500);
  const cung = await p.locator('.lt-book-i[aria-label="Cùng Kỳ"][data-seen="1"]').count();
  ok(cung === 1, 'Cùng Kỳ vừa thu phục trong kiếp đã có trong sổ (' + cung + ')');
  ok((await p.locator('.lt-book-i[data-seen="1"]').count()) === 4, 'sổ có đúng 4 loài đã gặp (2 kiếp trước, đang nuôi, vừa thu phục)');
  await shot(p, 'so-thu-cung-ky');
  ok(!p.errs.length, 'không lỗi JS ' + p.errs.join(' | '));
  await b.close();
  console.log(fail ? `\n${fail} mục HỎNG` : '\nTất cả OK');
  process.exit(fail ? 1 : 0);
})();
