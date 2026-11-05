/**
 * Bản 5/11: Hành trang kiếp sau ở màn chết, Hạ phàm cho người đã phi thăng, Cẩm Nang Tu Tiên (truyện tranh).
 * Chạy: npx next start -p 3314 (cửa sổ khác), rồi node scripts/smoke-thunam.cjs. Thoát mã 1 nếu hỏng.
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
const SHOT = process.env.SMOKE_SHOT_DIR;

async function open(b, char, meta = META, cn = true) {
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  await p.route(/vkl_track|vkl_save/, (r) => r.fulfill({ status: 200, body: 'null', contentType: 'application/json' }));
  p.errs = [];
  p.on('pageerror', (e) => { if (!/Hydration|#418/.test(e.message)) p.errs.push(e.message.slice(0, 160)); });
  await p.goto(URL + '/');
  const s = JSON.parse(JSON.stringify(base)); s.pending = null; Object.assign(s.char, { dead: false, lifeNo: 6 }, char);
  await p.evaluate(([s, m, v, cn]) => { localStorage.clear(); localStorage.setItem('vkl.tut', '1'); localStorage.setItem('vkl.seenVer', v); localStorage.setItem('vkl.notice.down1101', '1'); if (cn) localStorage.setItem('vkl.camnang', JSON.stringify(['mot_kiep', 'canh_gioi', 'nga_re', 'tong_mon', 'danh_nhau', 'phi_thang', 'luan_hoi'])); localStorage.setItem('vkl.save', JSON.stringify(s)); localStorage.setItem('vkl.meta', JSON.stringify(m)); }, [s, meta, VER, cn]);
  await p.goto(URL + '/choi');
  await p.waitForTimeout(6000);
  await p.addStyleTag({ content: 'nextjs-portal{display:none!important}' });
  return p;
}
const save = async (p) => JSON.parse(await p.evaluate(() => localStorage.getItem('vkl.save'))).char;

(async () => {
  const b = await chromium.launch();
  // 1. Người mới: Cẩm nang hồi 1 tự mở, lật hết thì đóng và ghi đã đọc
  let p = await open(b, { lifeNo: 1, age: 3, realm: 0, layer: 1, path: null, cp: undefined }, { ...META, lives: 0 }, false);
  ok(await p.locator('.cn-wrap').count() === 1, 'người mới vào game: Cẩm nang hồi 1 tự mở');
  ok(/Hồi 1/.test(await p.locator('.cn-head').innerText().catch(() => '')), 'đúng hồi 1: Một kiếp người');
  if (SHOT) await p.screenshot({ path: SHOT + '/cn-1.png' });
  for (let i = 0; i < 6 && (await p.locator('.cn-panel').count()); i++) { await p.locator('.cn-panel').click(); await p.waitForTimeout(400); if (SHOT && i === 1) await p.screenshot({ path: SHOT + '/cn-2.png' }); }
  ok(await p.locator('.cn-wrap').count() === 0, 'lật hết trang thì đóng');
  ok(JSON.parse(await p.evaluate(() => localStorage.getItem('vkl.camnang') || '[]')).includes('mot_kiep'), 'ghi nhớ đã đọc hồi 1');
  // mở lại từ menu: mục lục 6 hồi
  await p.locator('.menu-btn').click({ timeout: 5000 }).catch(() => {});
  await p.waitForTimeout(400);
  await p.locator('button', { hasText: 'Cẩm nang tu tiên' }).click({ timeout: 5000 }).catch(() => {});
  await p.waitForTimeout(500);
  ok(await p.locator('.cn-row').count() === 7, 'menu mở mục lục Cẩm nang 7 hồi');
  await p.locator('.cn-row', { hasText: 'Ngã rẽ' }).click({ timeout: 5000 }).catch(() => {});
  await p.waitForTimeout(400);
  await p.locator('.cn-panel').click(); await p.waitForTimeout(400); // trang 2: ba cửa phi thăng
  ok(await p.locator('.cn-doors span').count() === 3, 'hồi Ngã rẽ: đạo tâm dẫn tới 3 cửa Tiên, Thái Hư, Ma');
  if (SHOT) await p.screenshot({ path: SHOT + '/cn-3.png' });
  // hồi Tông môn: 7 trang, giới thiệu ba nhà, bậc đệ tử, tông theo đạo, hướng đi
  await p.locator('.cn-skip').click(); await p.waitForTimeout(300);
  await p.locator('.menu-btn').click({ timeout: 5000 }).catch(() => {}); await p.waitForTimeout(300);
  await p.locator('button', { hasText: 'Cẩm nang tu tiên' }).click({ timeout: 5000 }).catch(() => {}); await p.waitForTimeout(400);
  await p.locator('.cn-row', { hasText: 'Tông môn' }).click({ timeout: 5000 }).catch(() => {}); await p.waitForTimeout(400);
  ok(await p.locator('.cn-dots i').count() === 7, 'hồi Tông môn có 7 trang');
  const seenX = [];
  for (let i = 0; i < 7; i++) {
    seenX.push(await p.locator('.cn-cards > span, .cn-ranks > span, .cn-paths > span, .cn-routes > span').count());
    if (SHOT) await p.screenshot({ path: SHOT + `/tm-${i + 1}.png` });
    await p.locator('.cn-panel').click(); await p.waitForTimeout(400);
  }
  ok(seenX[1] === 3 && seenX[2] === 4 && seenX[4] === 5 && seenX[6] === 3, 'Tông môn: ba nhà, bốn bậc, năm tông theo đạo (có Hợp Hoan Tông), ba hướng đi ' + seenX.join(','));
  ok(!p.errs.length, 'Cẩm nang không lỗi JS ' + p.errs.join(' | '));
  await p.close();

  // 2. Hạ phàm: tiên nhân xuống phàm giới săn quái phàm
  p = await open(b, { realm: 8, layer: 1, cosmos: 'tien', ascended: true, ascendAge: 150, age: 200, lifespan: 600, path: 'kiem', focus: 'tu_luyen', huntTarget: undefined, cp: undefined });
  await p.locator('button.play[aria-label="Tạm dừng"]').click({ timeout: 3000 }).catch(() => {});
  for (let i = 0; i < 4; i++) { await p.locator('.choice').last().click({ timeout: 800 }).catch(() => {}); await p.locator('.duel-warn .btn-dark').last().click({ timeout: 800 }).catch(() => {}); }
  if (SHOT) await p.screenshot({ path: SHOT + '/pre-hunt.png' });
  await p.locator('.focus-btn, button', { hasText: /^Trừ yêu$/ }).first().click({ timeout: 5000 }).catch(() => {});
  await p.waitForTimeout(500);
  ok(await p.locator('.ha-pham-tabs button').count() === 2, 'tiên nhân có 2 tab Tiên giới / Hạ phàm');
  await p.locator('.ha-pham-tabs button', { hasText: 'Hạ phàm' }).click({ timeout: 5000 }).catch(() => {});
  await p.waitForTimeout(300);
  ok(await p.locator('.hunt-item', { hasText: 'Sói Xám' }).count() > 0, 'Hạ phàm: có quái phàm giới (Sói Xám)');
  ok(!(await p.locator('.hunt-item', { hasText: 'Sói Xám' }).first().innerText({ timeout: 3000 }).catch(() => 'tu vi/con')).includes('tu vi/con'), 'Hạ phàm: không hiện tu vi mỗi con');
  if (SHOT) await p.screenshot({ path: SHOT + '/ha-pham.png' });
  await p.locator('.hunt-item', { hasText: 'Sói Xám' }).first().click({ timeout: 5000 }).catch(() => {});
  await p.locator('button.play').first().click({ timeout: 3000 }).catch(() => {});
  let ch = await save(p);
  for (let i = 0; i < 30 && !((ch.kills ?? {}).soi_xam > 0); i++) { await p.waitForTimeout(500); await p.locator('.choice').last().click({ timeout: 200 }).catch(() => {}); ch = await save(p); }
  ok(ch.huntTarget === 'soi_xam' && (ch.kills ?? {}).soi_xam > 0, 'tiên nhân trảm được quái phàm: ' + JSON.stringify(ch.kills ?? {}).slice(0, 80));
  ok(!p.errs.length, 'Hạ phàm không lỗi JS ' + p.errs.join(' | '));
  await p.close();

  // 3. Màn chết: Hành trang kiếp sau, tiên nhân chôn được đồ phàm
  p = await open(b, { dead: true, cause: 'Thọ tận', realm: 8, layer: 1, cosmos: 'tien', ascended: true, age: 500, linhThach: 50000, inventory: ['thanh_phong', 'tg_luu_van_tien_y'], equipped: { ao: 'tg_luu_van_tien_y' }, cp: { own: [{ id: 'kim_xa', tang: 9, exp: 0 }], eq: [null, 'kim_xa', null] }, cpHeirPick: 'kim_xa' });
  await p.waitForTimeout(1500);
  const rows = await p.locator('.hanh-trang li').allInnerTexts();
  if (SHOT) await p.screenshot({ path: SHOT + '/hanh-trang.png' });
  ok(rows.some((t) => /phúc duyên/.test(t)), 'Hành trang: có phúc duyên');
  ok(rows.some((t) => /Truyền thừa: Kim Xà/.test(t)), 'Hành trang: có chiêu truyền thừa');
  ok(rows.some((t) => /Rương chôn: 2000 linh thạch và Thanh Phong/.test(t)), 'tiên nhân chôn được đồ phàm, tiền có trần: ' + rows.join(' / ').slice(0, 200));
  await p.locator('button', { hasText: 'Lập bia và luân hồi' }).click({ timeout: 8000 }).catch(() => {});
  let m = null;
  for (let i = 0; i < 20 && !(m && m.lives === 6); i++) { await p.waitForTimeout(800); m = JSON.parse(await p.evaluate(() => localStorage.getItem('vkl.meta'))); }
  ok(m && m.stash && m.stash.item === 'thanh_phong' && m.stash.money === 2000, 'rương kiếp sau giữ Thanh Phong và 2000 linh thạch');
  ok(!p.errs.length, 'màn chết không lỗi JS ' + p.errs.join(' | '));
  await b.close();
  console.log(fail ? `\n${fail} mục HỎNG` : '\nTất cả OK');
  process.exit(fail ? 1 : 0);
})();
