/**
 * 13/11 góp ý #224, #225, #223: nút bán đồ thừa không bán món Cực phẩm vừa hợp, chỉ đụng đồ ở tab đang chọn;
 * đồ tông môn có dòng báo bị thu lại khi trục xuất. Chạy: npx next dev -p 3314 (cửa sổ khác), rồi node scripts/smoke-do-thua.cjs [thư mục ảnh]
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const URL = process.env.SMOKE_URL || 'http://localhost:3314';
const SHOT = process.argv[2];
const base = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/save.json'), 'utf8'));
const VER = (fs.readFileSync(path.join(__dirname, '../lib/releases.ts'), 'utf8').match(/v: '([0-9.]+)'/) || [])[1] || '';
const today = new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);
const META = { phucDuyen: 5, nghiep: 0, lives: 5, talents: [], enemy: null, streak: { day: today, n: 1 }, checkin: today, chanThan: { name: 'Thử', gender: 'nam', skin: 0, hair: 0, hairColor: 0, outfit: 0, createdAt: 1, renamed: 0 } };
let fail = 0;
const ok = (c, m) => { console.log((c ? 'OK  ' : 'HỎNG') + ' ' + m); if (!c) fail++; };
const save = async (p) => JSON.parse(await p.evaluate(() => localStorage.getItem('vkl.save'))).char;

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  await p.route(/vkl_track|vkl_save/, (r) => r.fulfill({ status: 200, body: 'null', contentType: 'application/json' }));
  const errs = [];
  p.on('pageerror', (e) => { if (!/Hydration|#418/.test(e.message)) errs.push(e.message.slice(0, 160)); });
  await p.goto(URL + '/');
  const s = JSON.parse(JSON.stringify(base)); s.pending = null;
  Object.assign(s.char, {
    dead: false, lifeNo: 6, realm: 4, linhThach: 500, focus: 'tu_luyen', huntTarget: undefined,
    inventory: ['ao_vai', 'ao_vo_si', 'ao_da_thu', 'ao_nho_y', 'cuong_dao', 'huyet_liem', 'bang_giao_thuong', 'moc_kiem', 'pd_la_han_ca_sa'],
    equipped: { ao: 'ao_vo_si', vu_khi: 'cuong_dao' },
    dup: { bang_giao_thuong: 1 }, locked: [], gearSets: [],
  });
  await p.evaluate(([s, m, v]) => { localStorage.clear(); localStorage.setItem('vkl.tut', '1'); localStorage.setItem('vkl.seenVer', v); localStorage.setItem('vkl.notice.down1101', '1'); localStorage.setItem('vkl.bagKind', 'all'); localStorage.setItem('vkl.save', JSON.stringify(s)); localStorage.setItem('vkl.meta', JSON.stringify(m)); }, [s, META, VER]);
  await p.goto(URL + '/choi');
  await p.locator('button.play[aria-label="Tạm dừng"]').click({ timeout: 15000 }).catch(() => {});
  await p.waitForTimeout(1500);
  await p.addStyleTag({ content: 'nextjs-portal{display:none!important}' });
  for (let i = 0; i < 6 && !(await p.locator('.dock-actions').count()); i++) {
    await p.locator('.choice').last().click({ timeout: 1000 }).catch(() => {});
    await p.waitForTimeout(900);
  }
  await p.locator('.dock-actions button', { hasText: 'Túi đồ' }).click({ timeout: 5000 }).catch(() => {});
  await p.waitForTimeout(800);
  ok(!(await p.locator('.inv-cell.spare[aria-label="Huyết Ma liêm"]').count()), 'món Cực phẩm chưa mặc không bị đánh dấu thừa');
  // tab Áo: chỉ bán áo thừa
  await p.locator('.inv-kinds button', { hasText: 'Áo' }).click();
  await p.waitForTimeout(300);
  const clean = p.locator('.inv-clean').first();
  const label = await clean.innerText().catch(() => '');
  ok(/Bán 3 món thừa/.test(label), 'tab Áo đếm đúng 3 áo thừa (kể cả áo vải): ' + label.split('\n')[0]);
  await clean.click();
  await p.waitForTimeout(200);
  const sure = await clean.innerText().catch(() => '');
  ok(/Áo da thú/.test(sure), 'bước xác nhận ghi tên món sẽ bán: ' + sure.split('\n')[0]);
  if (SHOT) await p.screenshot({ path: path.join(SHOT, 'do-thua-xac-nhan.png') });
  await clean.click();
  await p.waitForTimeout(600);
  let ch = await save(p);
  ok(!ch.inventory.includes('ao_da_thu') && !ch.inventory.includes('ao_nho_y') && ch.inventory.includes('pd_la_han_ca_sa'), 'đã bán áo thừa, giữ cà sa Cực phẩm');
  ok(ch.inventory.includes('moc_kiem'), 'ở tab Áo không bán vũ khí thừa');
  // tab Vũ khí: bán Mộc kiếm và bản trùng Băng Giao thương, giữ chiếc gốc Cực phẩm
  await p.locator('.inv-kinds button', { hasText: 'Vũ khí' }).click();
  await p.waitForTimeout(300);
  const l2 = await p.locator('.inv-clean').first().innerText().catch(() => '');
  ok(/Bán 2 món thừa/.test(l2), 'tab Vũ khí: 2 món thừa (Mộc kiếm + bản trùng): ' + l2.split('\n')[0]);
  await p.locator('.inv-clean').first().click();
  await p.waitForTimeout(200);
  await p.locator('.inv-clean').first().click();
  await p.waitForTimeout(600);
  ch = await save(p);
  ok(ch.inventory.includes('huyet_liem') && ch.inventory.includes('bang_giao_thuong'), 'không bán chiếc gốc Cực phẩm');
  ok(!(ch.dup ?? {}).bang_giao_thuong, 'bán bản trùng Cực phẩm');
  ok(!ch.inventory.includes('moc_kiem'), 'bán vũ khí thường thừa');
  ok(ch.inventory.includes('cuong_dao') && ch.inventory.includes('ao_vo_si'), 'đồ đang mặc còn nguyên');
  // đồ tông môn có dòng báo
  await p.locator('.inv-kinds button', { hasText: 'Áo' }).click();
  await p.waitForTimeout(300);
  await p.locator('.inv-cell[aria-label="La Hán kim lan cà sa"]').click({ timeout: 5000 }).catch(() => {});
  await p.waitForTimeout(300);
  ok((await p.locator('.inv-sect-note').count()) === 1, 'đồ tông môn ghi rõ bị thu lại khi trục xuất');
  if (SHOT) await p.screenshot({ path: path.join(SHOT, 'do-tong-mon.png') });
  ok(!errs.length, 'không lỗi trang ' + errs.join(' | '));
  await b.close();
  // trục xuất: nhật ký nêu tên món bị thu lại (chạy trực tiếp hàm game)
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
