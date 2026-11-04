// 4/11 Bảo vệ tài khoản: Google hoặc mã khôi phục. Build với NEXT_PUBLIC_GOOGLE_CLIENT_ID (giá trị thử) rồi chạy.
// Máy chủ và Google đều giả. Kiểm: trang đăng nhập, quên mật khẩu, đăng ký bằng mật khẩu thì phát mã ngay,
// đang chơi không bị chặn, tới lúc luân hồi mà chưa bảo vệ thì phải chọn một cách, trong trình duyệt Facebook vẫn có đường mã.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const URL = process.env.SMOKE_URL || 'http://localhost:3314';
const base = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/save.json'), 'utf8'));
const VER = (fs.readFileSync(path.join(__dirname, '../lib/releases.ts'), 'utf8').match(/v: '([0-9.]+)'/) || [])[1] || '';
let fail = 0;
const ok = (c, m) => { console.log((c ? 'OK  ' : 'HỎNG') + ' ' + m); if (!c) fail++; };
const SHOT = process.env.SHOT;
const FB_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/450.0]';
const errs = [];

async function ctxWith(b, sec, ua) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, ...(ua ? { userAgent: ua } : {}) });
  await ctx.route('**/accounts.google.com/**', (r) => r.fulfill({ status: 200, contentType: 'application/javascript', body: 'window.google={accounts:{id:{initialize(){},renderButton(el){el.innerHTML="<div class=fake-gg>Đăng ký bằng Google</div>"},cancel(){}}}}' }));
  await ctx.route('**/rest/v1/rpc/**', async (route) => {
    const fn = route.request().url().split('/rpc/')[1].split('?')[0];
    const json = (o) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(o) });
    if (fn === 'vkl_security_status') return json({ google: !!sec.google, recovery: !!sec.recovery, must_change: !!sec.must_change, email: null });
    if (fn === 'vkl_change_password') return json({ ok: true });
    if (fn === 'vkl_recovery_create') { sec.recovery = true; return json({ code: 'ABCD-EFGH-JKMN' }); }
    if (fn === 'vkl_register') return json({ token: '00000000-0000-4000-8000-000000000001', username: 'moi', meta: {} });
    if (fn === 'vkl_me') return json({ username: 'thu', meta: { lives: 3, phucDuyen: 10, talents: [], nghiep: 0, enemy: null, checkin: new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10) }, state: null });
    return route.fulfill({ status: 200, contentType: 'application/json', body: 'null' });
  });
  await ctx.route(/vkl_track/, (r) => r.fulfill({ status: 200, body: 'null', contentType: 'application/json' }));
  return ctx;
}
async function playing(b, sec, char, ua) {
  const ctx = await ctxWith(b, sec, ua);
  const s = JSON.parse(JSON.stringify(base));
  s.pending = null;
  Object.assign(s.char, { dead: false, lifeNo: 6 }, char);
  s.t = Date.now();
  const today = new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);
  const meta = { phucDuyen: 5, nghiep: 0, lives: 5, talents: [], enemy: null, streak: { day: today, n: 1 }, checkin: today };
  await ctx.addInitScript(([s, m, v]) => {
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', '1');
    localStorage.setItem('vkl.session', JSON.stringify({ username: 'thu', token: '00000000-0000-4000-8000-000000000000' }));
    localStorage.setItem('vkl.tut', '1');
    localStorage.setItem('vkl.seenVer', v);
    localStorage.setItem('vkl.notice.down1101', '1');
    localStorage.setItem('vkl.camnang', JSON.stringify(['mot_kiep', 'canh_gioi', 'nga_re', 'tong_mon', 'danh_nhau', 'phi_thang', 'luan_hoi']));
    localStorage.setItem('vkl.save.u.thu', JSON.stringify(s));
    localStorage.setItem('vkl.meta.u.thu', JSON.stringify(m));
    localStorage.setItem('vkl.save', JSON.stringify(s));
    localStorage.setItem('vkl.meta', JSON.stringify(m));
  }, [s, meta, VER]);
  const p = await ctx.newPage();
  p.on('pageerror', (e) => { if (!/Hydration|#418/.test(e.message)) errs.push(e.message.slice(0, 160)); });
  await p.goto(URL + '/choi');
  await p.waitForTimeout(7000);
  await p.addStyleTag({ content: 'nextjs-portal{display:none!important}' });
  return { ctx, p };
}

(async () => {
  const b = await chromium.launch();
  // 1. trang đăng nhập
  let ctx = await ctxWith(b, {});
  let p = await ctx.newPage();
  p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(URL + '/dang-nhap');
  await p.waitForTimeout(2500);
  ok(await p.locator('.gg-btn .fake-gg').count() === 1, 'trang đăng nhập có nút Google (trong khung có viền)');
  ok(await p.locator('input[type=password]').count() === 1, 'vẫn đăng nhập được bằng tên và mật khẩu');
  await p.locator('.gg-forgot').click();
  await p.waitForTimeout(600);
  ok(await p.locator('.gg-gate .fake-gg').count() === 1 && (await p.locator('.gg-gate input[placeholder="ABCD-EFGH-JKMN"]').count()) === 1, 'Quên mật khẩu: vào bằng Google hoặc nhập mã khôi phục');
  ok(await p.locator('.gg-gate .no-code a', { hasText: 'Nhắn Fanpage' }).count() === 1, 'Quên mật khẩu mà chưa có mã: hướng dẫn nhắn Fanpage, có link');
  if (SHOT) await p.screenshot({ path: SHOT + '/gg-quen.png' });
  await p.locator('.gg-gate .chip-btn', { hasText: 'Quay lại' }).click();
  await p.locator('[role=tab]', { hasText: 'Đăng ký' }).click();
  await p.waitForTimeout(800);
  ok(await p.locator('.tabs + .gg-wrap .fake-gg').count() === 1 && (await p.locator('input[type=password]').count()) === 1, 'đăng ký: nút Đăng ký bằng Google ngay dưới thẻ Đăng ký, vẫn tạo được bằng mật khẩu');
  if (SHOT) await p.screenshot({ path: SHOT + '/gg-dangky.png' });
  // đăng ký bằng mật khẩu: phát mã khôi phục ngay
  await p.locator('input[autocomplete=username]').fill('moi');
  await p.locator('input[type=password]').fill('abc');
  await p.locator('form .btn-red').click();
  await p.waitForTimeout(1500);
  ok((await p.locator('.rec-code').innerText().catch(() => '')).includes('ABCD-EFGH-JKMN'), 'đăng ký bằng mật khẩu xong: hiện ngay mã khôi phục');
  ok(await p.locator('.rec-show .btn-red').isDisabled(), 'chưa xác nhận đã cất mã thì chưa vào game');
  if (SHOT) await p.screenshot({ path: SHOT + '/gg-ma-dangky.png' });
  await ctx.close();

  // 1b. vào bằng mật khẩu tạm Fanpage cấp: đặt mật khẩu mới -> mã khôi phục -> hỏi Google
  let r0 = await playing(b, { must_change: true }, { realm: 2, layer: 1, age: 30, lifespan: 150, path: 'kiem' });
  ok(await r0.p.locator('.gg-gate', { hasText: 'Bước 1: Đặt mật khẩu mới' }).count() === 1, 'mật khẩu tạm: bắt đặt mật khẩu mới trước');
  if (SHOT) await r0.p.screenshot({ path: SHOT + '/gg-tam-1.png' });
  const pws = r0.p.locator('.gg-gate input[type=password]');
  await pws.nth(0).fill('abc12');
  await pws.nth(1).fill('abc12');
  await r0.p.locator('.gg-gate form .btn').click();
  await r0.p.waitForTimeout(800);
  ok((await r0.p.locator('.rec-code').innerText().catch(() => '')).includes('ABCD-EFGH-JKMN'), 'đổi xong: phát mã khôi phục');
  await r0.p.locator('.rec-show input[type=checkbox]').check();
  await r0.p.locator('.rec-show .btn-red').click();
  await r0.p.waitForTimeout(500);
  ok(await r0.p.locator('.gg-gate', { hasText: 'Liên kết thêm Google?' }).count() === 1, 'cất mã xong: hỏi có muốn liên kết Google');
  if (SHOT) await r0.p.screenshot({ path: SHOT + '/gg-tam-3.png' });
  await r0.p.locator('.gg-gate .chip-btn', { hasText: 'Để sau' }).click();
  await r0.p.waitForTimeout(400);
  ok(await r0.p.locator('.gg-gate').count() === 0, 'Để sau: vào chơi');
  await r0.ctx.close();

  // 2. đang chơi chưa bảo vệ: không bị chặn, menu có Bảo vệ tài khoản
  let r = await playing(b, {}, { realm: 2, layer: 1, age: 30, lifespan: 150, path: 'kiem' });
  if (SHOT) await r.p.screenshot({ path: SHOT + '/gg-dang-choi.png' });
  ok(await r.p.locator('.gg-gate').count() === 0, 'đang chơi: không bật pop up bắt buộc');
  ok(await r.p.locator('.gg-nudge', { hasText: 'phúc duyên' }).count() === 1, 'đang chơi: dải nhắc Liên kết Google nhận phúc duyên (không chặn)');
  await r.p.locator('.menu-btn').click({ timeout: 5000 }).catch(() => {});
  await r.p.waitForTimeout(400);
  await r.p.locator('button', { hasText: 'Bảo vệ tài khoản' }).click({ timeout: 5000 }).catch(() => {});
  await r.p.waitForTimeout(800);
  if (SHOT) await r.p.screenshot({ path: SHOT + '/gg-menu.png', fullPage: true });
  ok(await r.p.locator('.gg-gate .protect-opt').count() === 3 && (await r.p.locator('.gg-gate .chip-btn', { hasText: 'Đóng' }).count()) === 1, 'menu > Bảo vệ tài khoản: liên kết Google, mã khôi phục, đổi mật khẩu, đóng được');
  await r.ctx.close();

  // 2a. đã liên kết Google: menu ghi rõ, không còn dải nhắc
  r = await playing(b, { google: true }, { realm: 2, layer: 1, age: 30, lifespan: 150, path: 'kiem' });
  ok(await r.p.locator('.gg-nudge').count() === 0, 'đã liên kết Google: không còn dải nhắc');
  await r.p.locator('.menu-btn').click({ timeout: 5000 }).catch(() => {});
  await r.p.waitForTimeout(400);
  ok(await r.p.locator('button', { hasText: 'Đã liên kết tài khoản Google' }).count() === 1, 'menu: nút Đã liên kết tài khoản Google');
  await r.ctx.close();

  // 2b. trang đầu và Lôi đài (không phải màn chơi chính): hỏi bảo vệ tài khoản
  for (const [pg, name] of [['/', 'trang đầu'], ['/loi-dai', 'Lôi đài']]) {
    const c2 = await ctxWith(b, {});
    await c2.addInitScript(() => localStorage.setItem('vkl.session', JSON.stringify({ username: 'thu', token: '00000000-0000-4000-8000-000000000000' })));
    const p2 = await c2.newPage();
    await p2.goto(URL + pg);
    await p2.waitForTimeout(4000);
    ok(await p2.locator('.gg-gate .protect-opt').count() === 2, `${name}: tài khoản chưa bảo vệ thì hỏi chọn Google hoặc mã`);
    await c2.close();
  }
  {
    const c2 = await ctxWith(b, { recovery: true });
    await c2.addInitScript(() => localStorage.setItem('vkl.session', JSON.stringify({ username: 'thu', token: '00000000-0000-4000-8000-000000000000' })));
    const p2 = await c2.newPage();
    await p2.goto(URL + '/');
    await p2.waitForTimeout(4000);
    ok(await p2.locator('.gg-gate').count() === 0, 'trang đầu: đã có mã thì không hỏi');
    await c2.close();
  }

  // 3. chết mà chưa bảo vệ: bấm luân hồi thì phải chọn một cách
  r = await playing(b, {}, { dead: true, cause: 'Thọ tận', realm: 3, layer: 1, age: 150 });
  await r.p.locator('button', { hasText: 'Lập bia và luân hồi' }).click({ timeout: 8000 }).catch(() => {});
  await r.p.waitForTimeout(1200);
  ok(await r.p.locator('.gg-gate .protect-bonus').count() >= 1, 'luân hồi mà chưa bảo vệ: pop up Sổ Luân Hồi, có thưởng phúc duyên');
  ok(await r.p.locator('.gg-gate .chip-btn', { hasText: 'Đóng' }).count() === 0, 'không bỏ qua được');
  if (SHOT) await r.p.screenshot({ path: SHOT + '/gg-chet.png' });
  await r.p.locator('.gg-gate .btn', { hasText: 'Tạo mã khôi phục' }).click();
  await r.p.waitForTimeout(500);
  await r.p.locator('.rec-show input[type=checkbox]').check();
  await r.p.locator('.rec-show .btn-red').click();
  let moved = false;
  for (let i = 0; i < 20 && !moved; i++) { await r.p.waitForTimeout(800); moved = !(await r.p.evaluate(() => /Lập bia và luân hồi|Đang khắc bia|Bảo vệ tài khoản/.test(document.body.innerText))); }
  ok(moved, 'cất mã xong thì luân hồi tiếp');
  const meta = JSON.parse(await r.p.evaluate(() => localStorage.getItem('vkl.meta.u.thu') || localStorage.getItem('vkl.meta')));
  ok(meta && meta.protectBonus === true, 'ghi đã nhận thưởng khắc tên');
  await r.ctx.close();

  // 4. chết khi đã có mã: luân hồi như cũ
  r = await playing(b, { recovery: true }, { dead: true, cause: 'Thọ tận', realm: 3, layer: 1, age: 150 });
  await r.p.locator('button', { hasText: 'Lập bia và luân hồi' }).click({ timeout: 8000 }).catch(() => {});
  await r.p.waitForTimeout(1200);
  ok(await r.p.locator('.gg-gate').count() === 0, 'đã có mã khôi phục: luân hồi không hỏi gì');
  await r.ctx.close();

  // 5. trong trình duyệt Facebook: Google không dùng được nhưng vẫn có mã khôi phục
  r = await playing(b, {}, { dead: true, cause: 'Thọ tận', realm: 3, layer: 1, age: 150 }, FB_UA);
  await r.p.locator('button', { hasText: 'Lập bia và luân hồi' }).click({ timeout: 8000 }).catch(() => {});
  await r.p.waitForTimeout(1200);
  ok(await r.p.locator('.gg-gate .gg-inapp').count() === 1, 'trong Facebook: hướng dẫn mở bằng Safari/Chrome cho Google');
  ok(await r.p.locator('.gg-gate .btn', { hasText: 'Tạo mã khôi phục' }).count() === 1, 'trong Facebook: vẫn tạo được mã khôi phục, không bị kẹt');
  if (SHOT) await r.p.screenshot({ path: SHOT + '/gg-fb.png' });
  await r.ctx.close();

  ok(!errs.length, 'không lỗi JS ' + errs.join(' | ').slice(0, 200));
  await b.close();
  console.log(fail ? `\n${fail} mục HỎNG` : '\nTất cả OK');
  process.exit(fail ? 1 : 0);
})();
