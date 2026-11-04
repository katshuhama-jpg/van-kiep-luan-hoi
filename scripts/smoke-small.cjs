/**
 * 4/11: màn nhỏ (iPhone 7 Plus trong Chrome, 414x620) vẫn thấy đủ hàng nút Phường thị, Túi đồ, Công pháp, Bế quan.
 * Chạy: npx next start -p 3314 (cửa sổ khác), rồi node scripts/smoke-small.cjs. Thoát mã 1 nếu hỏng.
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
  const p = await b.newPage({ viewport: { width: 414, height: 620 } });
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
  for (const noDvh of [false, true]) {
    const p = await open(b, {}, true);
    if (noDvh) {
      // giả lập Safari không hiểu dvh: đặt --vh1 rồi ép mọi khối dùng biến đó như trình duyệt cũ
      await p.addStyleTag({ content: '.game{height:calc(var(--vh1) * 100)!important}' });
      await p.evaluate(() => document.documentElement.style.setProperty('--vh1', window.innerHeight / 100 + 'px'));
      await p.waitForTimeout(300);
    }
    for (let i = 0; i < 6 && !(await p.locator('.dock-actions').count()); i++) {
      await p.locator('.choice').last().click({ timeout: 1000 }).catch(() => {});
      await p.waitForTimeout(500);
    }
    const vh = 620;
    const boxes = await p.locator('.dock-actions button').evaluateAll((bs) => bs.map((x) => { const r = x.getBoundingClientRect(); return [x.textContent.trim(), Math.round(r.bottom)]; }));
    ok(boxes.length >= 4 && boxes.every(([, bt]) => bt <= vh), (noDvh ? '[không dvh] ' : '') + 'hàng nút dưới nằm trong màn hình ' + JSON.stringify(boxes));
    if (process.env.SHOT) await p.screenshot({ path: process.env.SHOT + `/small-${noDvh}.png` });
    ok(!p.errs.length, 'không lỗi JS ' + p.errs.join(' | '));
    await p.close();
  }
  await b.close();
  console.log(fail ? '\nCÓ LỖI' : '\nTất cả OK');
  process.exit(fail ? 1 : 0);
})();
