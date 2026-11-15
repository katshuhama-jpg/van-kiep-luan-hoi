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
  await p.waitForTimeout(1500);
  ok(saved && saved.phucDuyen === 90, `lưu hồ sơ phúc duyên 50 + 40 = ${saved && saved.phucDuyen}`);
  if (DIR) {
    await p.locator('.su-do').scrollIntoViewIfNeeded();
    await p.waitForTimeout(400);
    await p.locator('.su-do').screenshot({ path: path.join(DIR, 'su-do-dang-nhap.png') });
  }
  ok(!p.errs.length, 'không lỗi ' + p.errs.join(' | '));
  await ctx.close();

  await b.close();
  console.log(fail ? `HỎNG ${fail}` : 'XONG, không hỏng');
  process.exit(fail ? 1 : 0);
})();
