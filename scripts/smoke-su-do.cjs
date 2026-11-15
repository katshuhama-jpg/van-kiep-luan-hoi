// 15/11 (4.6.0 Ngày 3b Sư Đồ): thử link mời và khối Sư Đồ ở màn Chân thân.
// Chạy: npx next dev -p 3330, rồi SMOKE_URL=http://localhost:3330 node scripts/smoke-su-do.cjs [thư mục ảnh]
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const R = __dirname;
const URL = process.env.SMOKE_URL || 'http://localhost:3330';
const DIR = process.argv[2];
if (DIR) fs.mkdirSync(DIR, { recursive: true });
const VER = (fs.readFileSync(path.join(R, '../lib/releases.ts'), 'utf8').match(/v: '([0-9.]+)'/) || [])[1];
const today = new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);
const CT = { name: 'Vân Tâm', gender: 'nu', skin: 1, hair: 2, hairColor: 5, outfit: 3, createdAt: 1, renamed: 0 };
const career = { maxAge: 320, maxRealm: 7, ascPaths: ['kiem'], paths: ['kiem', 'dan'], duelWins: 3, revenges: 0, cosmoses: ['tien'], hanh: { kim: 2, thuy: 1 } };
const META = { phucDuyen: 50, nghiep: 0, lives: 5, talents: [], enemy: null, streak: { day: today, n: 1 }, checkin: today, chanThan: CT, huyet: [1, 2, 3].map((id) => ({ id, life: id })), career, achievements: [], endings: { chung_dao: 1 } };
const iso = (h) => new Date(Date.now() + h * 3600e3).toISOString();
const DS = [
  { ten: 'de_a', phap_danh: 'Lăng Vân', kiep: 7, bai_luc: iso(-72), han: iso(96), thanh_tai_luc: null, choi_luc: iso(-2) },
  { ten: 'de_b', phap_danh: null, kiep: 2, bai_luc: iso(-24), han: iso(144), thanh_tai_luc: null, choi_luc: iso(-30) },
  ...Array.from({ length: 5 }, (_, i) => ({ ten: 'xong_' + i, phap_danh: 'Tử Yên ' + i, kiep: 10, bai_luc: iso(-200), han: iso(-32), thanh_tai_luc: iso(-50 - i), choi_luc: iso(-5) })),
  { ten: 'het_c', phap_danh: 'Bạch Y', kiep: 4, bai_luc: iso(-240), han: iso(-72), thanh_tai_luc: null, choi_luc: iso(-100) },
];
let fail = 0;
const ok = (c, m) => { console.log((c ? 'OK  ' : 'HỎNG') + ' ' + m); if (!c) fail++; };

async function page(b) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  const p = await ctx.newPage();
  await p.route(/vkl_track|vkl_save/, (r) => r.fulfill({ status: 200, body: 'null', contentType: 'application/json' }));
  p.errs = [];
  p.on('pageerror', (e) => { if (!/Hydration|#418/.test(e.message)) p.errs.push(e.message.slice(0, 160)); });
  return { ctx, p };
}
const suCookie = async (ctx) => (await ctx.cookies()).find((c) => c.name === 'vkl_su');

(async () => {
  const b = await chromium.launch();
  // A. Máy mới mở link mời: nhớ cookie vkl_su 7 ngày
  let { ctx, p } = await page(b);
  await p.goto(URL + '/?su=tyler');
  await p.waitForTimeout(3000);
  let c = await suCookie(ctx);
  ok(c && c.value === 'tyler', 'máy mới: có cookie vkl_su=tyler');
  ok(c && c.expires - Date.now() / 1000 > 6.9 * 86400, 'cookie sống khoảng 7 ngày');
  // link thứ hai không ghi đè link đầu
  await p.goto(URL + '/?su=nguoikhac');
  await p.waitForTimeout(2000);
  c = await suCookie(ctx);
  ok(c && c.value === 'tyler', 'link thứ hai không ghi đè link đầu');
  ok(!p.errs.length, 'không lỗi ' + p.errs.join(' | '));
  await ctx.close();

  // B. Tên không hợp lệ: không nhớ
  ({ ctx, p } = await page(b));
  await p.goto(URL + '/?su=Bad-Name!');
  await p.waitForTimeout(2000);
  ok(!(await suCookie(ctx)), 'tên không hợp lệ: không có cookie');
  await ctx.close();

  // C. Máy đã có chân thân: không nhớ
  ({ ctx, p } = await page(b));
  await p.goto(URL + '/khong-co-trang-nay');
  await p.evaluate(([m, v]) => {
    localStorage.clear();
    localStorage.setItem('vkl.seenVer', v);
    localStorage.setItem('vkl.meta.u.ai_do', JSON.stringify(m));
  }, [META, VER]);
  await p.goto(URL + '/?su=tyler');
  await p.waitForTimeout(3000);
  ok(!(await suCookie(ctx)), 'máy đã có chân thân (vkl.meta.u.*): không có cookie');
  await ctx.close();

  // D. Màn Chân thân của khách: khối Sư Đồ, nút Mời đệ tử bị khóa
  ({ ctx, p } = await page(b));
  await p.goto(URL + '/khong-co-trang-nay');
  await p.evaluate(([m, v]) => {
    localStorage.clear();
    localStorage.setItem('vkl.tut', '1');
    localStorage.setItem('vkl.seenVer', v);
    localStorage.setItem('vkl.notice.down1101', '1');
    localStorage.setItem('vkl.meta', JSON.stringify(m));
  }, [META, VER]);
  await p.goto(URL + '/chan-than');
  await p.waitForSelector('.su-do', { timeout: 20000 }).catch(() => {});
  await p.addStyleTag({ content: 'nextjs-portal{display:none!important}' });
  const box = p.locator('.su-do');
  ok((await box.count()) === 1, 'màn Chân thân có khối Sư Đồ');
  const btn = p.locator('.su-invite');
  ok((await btn.count()) === 1 && (await btn.isDisabled()), 'nút Mời đệ tử bị khóa khi chưa đăng nhập');
  ok(/Đăng nhập để có link mời/.test(await box.innerText()), 'ghi "Đăng nhập để có link mời"');
  const bb = await btn.boundingBox();
  ok(bb && bb.height >= 44, `nút cao ${bb && Math.round(bb.height)}px >= 44`);
  const wide = await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
  ok(wide, 'không tràn ngang');
  if (DIR) {
    await box.scrollIntoViewIfNeeded();
    await p.waitForTimeout(400);
    await box.screenshot({ path: path.join(DIR, 'su-do-khach.png') });
    await p.screenshot({ path: path.join(DIR, 'chan-than-khach.png'), fullPage: true });
  }
  ok(!p.errs.length, 'màn Chân thân không lỗi ' + p.errs.join(' | '));
  await ctx.close();

  // E. Đã đăng nhập (giả máy chủ): sư phụ, tiến độ, danh hiệu, nhận thưởng một lần
  ({ ctx, p } = await page(b));
  let claims = 0, saved = null;
  await p.route(/rest\/v1\/rpc\/(vkl_\w+)/, async (r) => {
    const fn = r.request().url().match(/rpc\/(vkl_\w+)/)[1];
    const body = r.request().postDataJSON?.() ?? {};
    const json = (v) => r.fulfill({ status: 200, body: JSON.stringify(v), contentType: 'application/json' });
    if (fn === 'vkl_me') return json({ meta: META, state: null });
    if (fn === 'vkl_su_info') return json({ su: { ten: 'tyler', phap_danh: 'Thanh Phong' }, kiep: 4, han: new Date(Date.now() + 3.5 * 86400e3).toISOString(), thanh_tai: false, de_tu: 6, thanh_tai_n: 5, cho_nhan: 40 });
    if (fn === 'vkl_su_claim') return json(claims++ ? 0 : 40);
    if (fn === 'vkl_su_count') return json(5);
    if (fn === 'vkl_su_ds') return json(DS);
    if (fn === 'vkl_ct_ext') return json({ incense: 0, lit: 0 });
    if (fn === 'vkl_save_meta2') { saved = body.p_meta; return json(null); }
    return json(null);
  });
  await p.goto(URL + '/khong-co-trang-nay');
  await p.evaluate(([v]) => {
    localStorage.clear();
    localStorage.setItem('vkl.tut', '1');
    localStorage.setItem('vkl.seenVer', v);
    localStorage.setItem('vkl.notice.down1101', '1');
    localStorage.setItem('vkl.session', JSON.stringify({ username: 'thu_nghiem', token: '00000000-0000-0000-0000-000000000001' }));
  }, [VER]);
  await p.goto(URL + '/chan-than');
  await p.waitForSelector('.su-gain', { timeout: 20000 }).catch(() => {});
  await p.addStyleTag({ content: 'nextjs-portal{display:none!important}' });
  const t = await p.locator('.su-do').innerText().catch(() => '');
  ok(/\+40 phúc duyên từ Sư Đồ/.test(t), 'hiện +40 phúc duyên từ Sư Đồ');
  ok(/Thanh Phong/.test(t) && /4\/10 kiếp, còn 4 ngày/.test(t), 'hiện sư phụ và tiến độ 4/10 kiếp, còn 4 ngày');
  ok(/Danh sư/.test(t), 'danh hiệu Danh sư ở mốc 5');
  ok(!(await p.locator('.su-invite').isDisabled()), 'đăng nhập: nút Mời đệ tử bấm được');
  ok(claims === 1, `gọi nhận thưởng đúng một lần (${claims})`);
  await p.waitForSelector('.su-item', { timeout: 10000 }).catch(() => {});
  const items = p.locator('.su-do .su-item');
  ok((await items.count()) === 5, `danh sách đệ tử hiện 5 người đầu (${await items.count()})`);
  const t2 = await p.locator('.su-do').innerText();
  ok(/Lăng Vân/.test(t2) && /7\/10 kiếp, còn 4 ngày/.test(t2) && /chơi 2 giờ trước/.test(t2), 'đệ tử đang tu: tiến độ 7/10, còn 4 ngày, lần chơi gần nhất');
  ok(/@de_b/.test(t2), 'đệ tử chưa có pháp danh: hiện tên tài khoản');
  ok(/Thành tài ngày/.test(t2), 'đệ tử thành tài: ghi ngày thành tài');
  ok((await p.locator('.su-do .su-item .su-bar i.on').count()) >= 7 + 2, 'thanh 10 ô tô đúng số kiếp');
  await p.click('.su-more');
  ok((await items.count()) === 8, `bấm Xem cả 8 đệ tử thì hiện đủ (${await items.count()})`);
  ok(/hết hạn 7 ngày/.test(await p.locator('.su-do').innerText()), 'đệ tử quá 7 ngày: ghi đã hết hạn');
  const mb = await p.locator('.su-more').boundingBox();
  ok(mb && mb.height >= 44, 'nút Xem cả cao từ 44px');
  ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'danh sách không tràn ngang');
  await p.waitForTimeout(1500);
  ok(saved && saved.phucDuyen === 90, `lưu hồ sơ phúc duyên 50 + 40 = ${saved && saved.phucDuyen}`);
  if (DIR) {
    await p.locator('.su-do').scrollIntoViewIfNeeded();
    await p.waitForTimeout(400);
    await p.locator('.su-do').screenshot({ path: path.join(DIR, 'su-do-dang-nhap.png') });
  }
  ok(!p.errs.length, 'không lỗi ' + p.errs.join(' | '));
  await ctx.close();

  // F. Trang quản trị /quan-tri/su-do: không có quyền thì báo, có quyền thì thấy mọi cặp, lọc được
  ({ ctx, p } = await page(b));
  let quyen = false;
  await p.route(/rest\/v1\/rpc\/(vkl_\w+)/, async (r) => {
    const fn = r.request().url().match(/rpc\/(vkl_\w+)/)[1];
    const json = (v, st = 200) => r.fulfill({ status: st, body: JSON.stringify(v), contentType: 'application/json' });
    if (fn === 'vkl_su_admin') {
      if (!quyen) return json({ code: 'P0001', message: 'SU_QUYEN' }, 400);
      return json({ luc: iso(0), tong: { cap: 3, su_phu: 2, dang_tu: 1, thanh_tai: 1, het_han: 1, bai_24h: 1 }, co: [{ loai: 'su_cung_may', chi_tiet: {}, luc: iso(-1) }], cap: [
        { su: 'tyler', su_pd: 'Thanh Phong', de: 'de_a', de_pd: 'Lăng Vân', kiep: 7, bai_luc: iso(-72), thanh_tai_luc: null, het_han: false, thuong_su: false, su_nhan: false, de_nhan: false },
        { su: 'tyler', su_pd: 'Thanh Phong', de: 'xong_0', de_pd: 'Tử Yên', kiep: 10, bai_luc: iso(-200), thanh_tai_luc: iso(-50), het_han: false, thuong_su: true, su_nhan: true, de_nhan: false },
        { su: 'khac', su_pd: null, de: 'het_c', de_pd: 'Bạch Y', kiep: 4, bai_luc: iso(-240), thanh_tai_luc: null, het_han: true, thuong_su: false, su_nhan: false, de_nhan: false },
      ] });
    }
    return json(null);
  });
  await p.goto(URL + '/khong-co-trang-nay');
  await p.evaluate(() => localStorage.setItem('vkl.session', JSON.stringify({ username: 'thu_nghiem', token: '00000000-0000-0000-0000-000000000001' })));
  await p.goto(URL + '/quan-tri/su-do');
  await p.waitForTimeout(2500);
  ok(/chỉ dành cho quản trị viên/.test(await p.locator('main').innerText()), 'quản trị: tài khoản thường thấy câu báo không có quyền');
  quyen = true;
  await p.reload();
  await p.waitForSelector('.su-adm-tong', { timeout: 15000 }).catch(() => {});
  await p.addStyleTag({ content: 'nextjs-portal{display:none!important}' });
  ok((await p.locator('main .su-item').count()) === 4, 'quản trị: 3 cặp + 1 đánh dấu');
  await p.click('.su-adm-loc .btn:nth-child(2)');
  ok((await p.locator('.su-list').first().locator('.su-item').count()) === 1, 'lọc Đang tu còn 1 cặp');
  await p.click('.su-adm-loc .btn:nth-child(1)');
  await p.fill('.su-adm-tim input', 'bạch');
  ok((await p.locator('.su-list').first().locator('.su-item').count()) === 1, 'tìm theo pháp danh');
  await p.fill('.su-adm-tim input', '');
  ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'quản trị không tràn ngang');
  if (DIR) await p.screenshot({ path: path.join(DIR, 'quan-tri-su-do.png'), fullPage: true });
  ok(!p.errs.length, 'không lỗi ' + p.errs.join(' | '));
  await ctx.close();

  await b.close();
  console.log(fail ? `HỎNG ${fail}` : 'XONG, không hỏng');
  process.exit(fail ? 1 : 0);
})();
