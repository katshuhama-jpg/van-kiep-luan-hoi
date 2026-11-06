// 6/11: thử góp ý #93 (né lôi trên máy chậm) và #116 (tu vi sau phi thăng đã đầy năm). Chạy: npx next start -p 3314, rồi node scripts/smoke-kiep.cjs [thư mục ảnh] [độ chậm CPU, mặc định 6]
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const R = __dirname;
const URL = process.env.SMOKE_URL || 'http://localhost:3314';
const DIR = process.argv[2]; const THR = +(process.argv[3] || 6);
const base = JSON.parse(fs.readFileSync(path.join(R, 'fixtures/save.json'), 'utf8'));
const VER = (fs.readFileSync(path.join(R, '../lib/releases.ts'), 'utf8').match(/v: '([0-9.]+)'/) || [])[1];
const today = new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);
const META = { phucDuyen: 5, nghiep: 0, lives: 5, talents: [], enemy: null, streak: { day: today, n: 1 }, checkin: today };
let fail = 0; const ok = (c, m) => { console.log((c ? 'OK  ' : 'HỎNG') + ' ' + m); if (!c) fail++; };
async function open(b, char, pending, ys) {
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
  await p.route(/vkl_track|vkl_save/, (r) => r.fulfill({ status: 200, body: 'null', contentType: 'application/json' }));
  p.errs = []; p.on('pageerror', (e) => { if (!/Hydration|#418/.test(e.message)) p.errs.push(e.message.slice(0, 160)); });
  await p.goto(URL + '/');
  const s = JSON.parse(JSON.stringify(base)); s.pending = pending || null; if (ys) s.yearSec = ys; Object.assign(s.char, { dead: false, lifeNo: 6 }, char);
  await p.evaluate(([s, m, v]) => { localStorage.clear(); localStorage.setItem('vkl.tut', '1'); localStorage.setItem('vkl.seenVer', v); localStorage.setItem('vkl.notice.down1101', '1'); localStorage.setItem('vkl.camnang', JSON.stringify(['mot_kiep', 'canh_gioi', 'nga_re', 'tong_mon', 'danh_nhau', 'phi_thang', 'luan_hoi'])); localStorage.setItem('vkl.save', JSON.stringify(s)); localStorage.setItem('vkl.meta', JSON.stringify(m)); }, [s, META, VER]);
  await p.goto(URL + '/choi'); await p.waitForTimeout(6000);
  await p.addStyleTag({ content: 'nextjs-portal{display:none!important}' });
  return p;
}
const kWin = (i) => Math.round(1050 - i * 45);
(async () => {
  const b = await chromium.launch();
  // A. Lôi kiếp trên máy chậm
  const p = await open(b, { realm: 6, layer: 3, cultivation: 0, age: 200, lifespan: 270, path: 'kiem' }, { id: '__dot_pha', title: 'Thiên kiếp', text: 'x', choices: [{ label: 'Độ kiếp', lean: 'trung' }] });
  await p.locator('.choice').first().click({ timeout: 5000 }).catch(() => {});
  await p.waitForTimeout(800);
  ok(await p.locator('.kiep').count() === 1, 'mở màn lôi kiếp');
  ok(await p.locator('.stage.st-off').count() === 1, 'sân khấu bên dưới ngừng vẽ khi lôi kiếp');
  const cdp = await p.context().newCDPSession(p);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: THR });
  await p.mouse.click(195, 400);
  // ghi lúc khung ngắm thật sự hiện ra (khung hình vẽ đầu tiên sau khi gắn vào DOM), theo giờ thật
  await p.evaluate(() => {
    window.__aims = [];
    new MutationObserver(() => {
      const a = document.querySelector('.kiep-aim');
      if (a && !a.__seen) { a.__seen = 1; const fake = a.classList.contains('fake'); const left = parseFloat(a.style.left); requestAnimationFrame(() => window.__aims.push({ t: performance.timeOrigin + performance.now(), fake, left })); }
    }).observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] });
  });
  let aimed = 0, used = 0;
  const t0 = Date.now();
  while (Date.now() - t0 < 90000) {
    const pips = await p.locator('.kh-pips i.ok, .kh-pips i.hit').count();
    if (pips >= 9) break;
    const aims = await p.evaluate(() => window.__aims);
    if (aims.length > used) {
      const a = aims[aims.length - 1]; used = aims.length;
      if (a.fake) continue;
      const due = a.t + kWin(pips) * 0.82 - Date.now();
      if (due > 0) await new Promise((r) => setTimeout(r, due));
      await p.mouse.click(Math.round(390 * a.left / 100), 400);
      aimed++;
      await p.waitForFunction((n) => document.querySelectorAll('.kh-pips i.ok, .kh-pips i.hit').length > n, pips, { timeout: 6000 }).catch(() => {});
    } else await new Promise((r) => setTimeout(r, 15));
  }
  const okN = await p.locator('.kh-pips i.ok').count(), hitN = await p.locator('.kh-pips i.hit').count();
  console.log(`  CPU chậm x${THR}: đỡ ${okN}, trúng ${hitN} (chạm ${aimed} lần đúng lúc)`);
  ok(okN >= 7, `chạm đúng lúc trên máy chậm thì đỡ được (${okN}/9)`);
  if (DIR) await p.screenshot({ path: path.join(DIR, 'kiep-cham.png') });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  ok(!p.errs.length, 'lôi kiếp không lỗi JS ' + p.errs.join(' | '));
  await p.close();
  if (process.env.ONLY_KIEP) { await b.close(); process.exit(fail ? 1 : 0); }

  // B. Tiên nhân trảm yêu khi tu vi năm nay đã đầy
  const q = await open(b, { realm: 8, layer: 1, cosmos: 'tien', ascended: true, ascendAge: 150, age: 200.0, lifespan: 600, path: 'kiem', focus: 'tu_luyen', huntTarget: undefined, cp: undefined, cultivation: 100, cgY: 200, cgN: 1e7 }, null, 30);
  await q.locator('button.play[aria-label="Tạm dừng"]').click({ timeout: 3000 }).catch(() => {});
  for (let k = 0; k < 4; k++) { await q.locator('.choice').last().click({ timeout: 800 }).catch(() => {}); await q.locator('.duel-warn .btn-dark').last().click({ timeout: 800 }).catch(() => {}); }
  await q.locator('.focus-btn, button', { hasText: /^Trừ yêu$/ }).first().click({ timeout: 5000 }).catch(() => {});
  await q.waitForTimeout(500);
  await q.locator('.hunt-item').first().click({ timeout: 5000 }).catch(() => {});
  await q.locator('button.play').first().click({ timeout: 3000 }).catch(() => {});
  let seen = '', ch;
  for (let k = 0; k < 40; k++) {
    await q.waitForTimeout(500);
    await q.locator('.choice').last().click({ timeout: 200 }).catch(() => {});
    const t = (await q.locator('.dmg.p').allInnerTexts().catch(() => [])).join(' | ');
    const m = t.match(/Tu vi năm nay đã đầy|\+\d+ tu vi/);
    ch = JSON.parse(await q.evaluate(() => localStorage.getItem('vkl.save'))).char;
    if (m && Object.values(ch.kills || {}).some((n) => n > 0)) { seen = m[0]; break; }
  }
  console.log('  trận đầu sau khi đầy:', seen, 'cgY', ch.cgY, 'tuổi', Math.floor(ch.age));
  ok(Math.floor(ch.age) !== 200 || seen === 'Tu vi năm nay đã đầy', 'tiên nhân tu vi đã đầy năm: báo "Tu vi năm nay đã đầy" thay vì +X');
  if (DIR) await q.screenshot({ path: path.join(DIR, 'tu-vi-day.png') });
  ok(!q.errs.length, 'trảm yêu không lỗi JS ' + q.errs.join(' | '));
  await b.close(); console.log(fail ? 'CÓ LỖI' : 'Tất cả OK'); process.exit(fail ? 1 : 0);
})();
