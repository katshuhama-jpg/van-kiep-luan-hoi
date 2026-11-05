/**
 * 5/11 góp ý người chơi: đồ trùng cộng dồn trong túi (không tự bán), khóa đồ, bộ trang bị, Phường thị bán tàn quyển.
 * Chạy: npx next start -p 3314 (cửa sổ khác), rồi node scripts/smoke-tui.cjs. Thoát mã 1 nếu hỏng.
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
  const b = await chromium.launch();
  const p = await open(b, {
    path: 'kiem', realm: 4, linhThach: 50000, focus: 'tu_luyen', huntTarget: undefined,
    inventory: ['ao_vai', 'tien_y', 'vo_danh_kiem', 'kiem_gay', 'thiet_kiem', 'moc_kiem'],
    equipped: { ao: 'tien_y', vu_khi: 'vo_danh_kiem' },
    dup: { thiet_kiem: 2 },
    cp: { own: [{ id: 'dan_khi', tang: 3, exp: 40 }, { id: 'thanh_lien', tang: 5, exp: 100 }, { id: 'liet_hoa', tang: 4, exp: 0 }], eq: ['thanh_lien', 'liet_hoa'] },
    tq: {},
  }, true);
  for (let i = 0; i < 6 && !(await p.locator('.dock-actions').count()); i++) {
    await p.locator('.choice').last().click({ timeout: 1000 }).catch(() => {});
    await p.waitForTimeout(900);
  }
  await p.locator('.dock-actions button', { hasText: 'Túi đồ' }).click({ timeout: 5000 }).catch(() => {});
  await p.waitForTimeout(800);
  ok((await p.locator('.inv-dup', { hasText: '×3' }).count()) === 1, 'đồ trùng hiện ×3 trong túi');
  // khóa Mộc kiếm (món thừa) rồi bán hết đồ thừa: Mộc kiếm còn, 2 bản trùng Thiết kiếm bị bán, Thiết kiếm gốc thì tùy
  await p.locator('.inv-cell[aria-label="Mộc kiếm"]').click({ timeout: 5000 }).catch(() => {});
  await p.waitForTimeout(300);
  await p.locator('.inv-pop .btn', { hasText: 'Khóa món này' }).click({ timeout: 5000 }).catch(() => {});
  await p.waitForTimeout(300);
  let ch = await save(p);
  ok((ch.locked ?? []).includes('moc_kiem'), 'khóa được món đồ');
  ok((await p.locator('.inv-pop .btn', { hasText: 'Bán' }).count()) === 0, 'món đã khóa không có nút Bán');
  await p.locator('.inv-pop-x').click().catch(() => {});
  await p.waitForTimeout(200);
  const clean = p.locator('.inv-clean');
  await clean.click({ timeout: 5000 }).catch(() => {});
  await p.waitForTimeout(200);
  await clean.click({ timeout: 5000 }).catch(() => {});
  await p.waitForTimeout(600);
  ch = await save(p);
  ok(ch.inventory.includes('moc_kiem'), 'Bán đồ thừa không bán món đã khóa');
  ok(!(ch.dup ?? {}).thiet_kiem, 'Bán đồ thừa bán cả các bản trùng');
  ok(ch.inventory.includes('vo_danh_kiem') && ch.inventory.includes('tien_y'), 'đồ đang mặc còn nguyên');
  // bộ trang bị: lưu bộ 1 (đang mặc), đổi vũ khí, lưu bộ 2, mặc lại bộ 1
  await p.locator('.gs-wear', { hasText: 'Lưu bộ 1' }).click({ timeout: 5000 }).catch(() => {});
  await p.waitForTimeout(300);
  ch = await save(p);
  ok(ch.gearSets?.[0]?.eq?.vu_khi === 'vo_danh_kiem', 'lưu bộ 1 theo đồ đang mặc');
  await p.locator('.inv-cell[aria-label="Mộc kiếm"]').click({ timeout: 5000 }).catch(() => {});
  await p.waitForTimeout(200);
  await p.locator('.inv-pop .btn', { hasText: 'Dùng' }).click({ timeout: 5000 }).catch(() => {});
  await p.waitForTimeout(300);
  await p.locator('.inv-pop-x').click().catch(() => {});
  await p.locator('.gs-wear', { hasText: 'Lưu bộ 2' }).click({ timeout: 5000 }).catch(() => {});
  await p.waitForTimeout(300);
  await p.locator('.gs-wear', { hasText: 'Bộ 1' }).click({ timeout: 5000 }).catch(() => {});
  await p.waitForTimeout(300);
  ch = await save(p);
  ok(ch.gearSets?.[1]?.eq?.vu_khi === 'moc_kiem' && ch.equipped.vu_khi === 'vo_danh_kiem', 'đổi qua lại giữa 2 bộ bằng một chạm');
  ok((await p.locator('.gs-item.on').count()) === 1, 'bộ đang mặc được tô sáng');
  if (process.env.SHOT) await p.screenshot({ path: process.env.SHOT + '/tui.png' });
  await p.locator('.sheet .ss-x, .sheet-close, button[aria-label="Đóng"]').first().click({ timeout: 3000 }).catch(() => {});
  await p.waitForTimeout(300);
  // Phường thị bán tàn quyển bộ đang mang
  await p.locator('.dock-actions button', { hasText: 'Phường thị' }).click({ timeout: 5000 }).catch(() => {});
  await p.waitForTimeout(600);
  await p.locator('.tabs button', { hasText: 'Tàn quyển' }).click({ timeout: 5000 }).catch(() => {});
  await p.waitForTimeout(300);
  ok((await p.locator('.items .item', { hasText: 'Tàn quyển' }).count()) === 2, 'Phường thị bán tàn quyển 2 bộ đang mang (từ tầng 3)');
  if (process.env.SHOT) await p.screenshot({ path: process.env.SHOT + '/shop-tq.png' });
  for (let i = 0; i < 3; i++) {
    await p.locator('.items .item', { hasText: 'Thanh Liên' }).locator('.btn').click({ timeout: 3000 }).catch(() => {});
    await p.waitForTimeout(300);
  }
  ch = await save(p);
  ok((ch.tq?.thanh_lien ?? 0) === 2 && ch.linhThach < 50000, 'mua được tàn quyển, mỗi năm tối đa 2 quyển');
  ok(!p.errs.length, 'không lỗi JS ' + p.errs.join(' | '));
  await b.close();
  console.log(fail ? '\nCÓ LỖI' : '\nTất cả OK');
  process.exit(fail ? 1 : 0);
})();
