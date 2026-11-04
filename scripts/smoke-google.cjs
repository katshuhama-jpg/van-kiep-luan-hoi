// 4/11 Đăng nhập Google: build với NEXT_PUBLIC_GOOGLE_CLIENT_ID (giá trị thử) rồi chạy. Máy chủ giả, không gọi Google thật.
// Kiểm: trang đăng nhập có khu Google, đăng ký chỉ qua Google, tài khoản cũ chưa liên kết bị chặn bằng pop up (thời gian dừng),
// đã liên kết thì không chặn, trong trình duyệt Facebook thì hiện hướng dẫn mở bằng trình duyệt và cho Để sau.
const { chromium } = require('playwright');
const URL = process.env.SMOKE_URL || 'http://localhost:3314';
let fail = 0;
const ok = (c, m) => { console.log((c ? 'OK  ' : 'HỎNG') + ' ' + m); if (!c) fail++; };
async function ctxWith(b, linked, ua) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, ...(ua ? { userAgent: ua } : {}) });
  await ctx.route('**/accounts.google.com/**', (r) => r.fulfill({ status: 200, contentType: 'application/javascript', body: 'window.google={accounts:{id:{initialize(){},renderButton(el){el.innerHTML="<div class=fake-gg>Google</div>"},cancel(){}}}}' }));
  await ctx.route('**/rest/v1/rpc/**', async (route) => {
    const fn = route.request().url().split('/rpc/')[1].split('?')[0];
    if (fn === 'vkl_google_status') return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ linked, email: null }) });
    if (fn === 'vkl_me') return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ username: 'thu', meta: { lives: 3, phucDuyen: 10, talents: [], nghiep: 0, enemy: null }, state: null }) });
    return route.fulfill({ status: 200, contentType: 'application/json', body: 'null' });
  });
  await ctx.route(/vkl_track/, (r) => r.fulfill({ status: 200, body: 'null', contentType: 'application/json' }));
  return ctx;
}
(async () => {
  const b = await chromium.launch();
  // 1. trang đăng nhập (chưa đăng nhập)
  let ctx = await ctxWith(b, false);
  let p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(URL + '/dang-nhap');
  await p.waitForTimeout(2500);
  ok(await p.locator('.fake-gg').count() === 1, 'trang đăng nhập có nút Google');
  ok(await p.locator('input[type=password]').count() === 1, 'vẫn đăng nhập được bằng tên và mật khẩu');
  await p.locator('.gg-forgot').click();
  ok(/Đăng nhập bằng Google/.test(await p.locator('form').innerText()), 'Quên mật khẩu chỉ cách vào bằng Google');
  await p.locator('[role=tab]', { hasText: 'Đăng ký' }).click();
  await p.waitForTimeout(800);
  ok(await p.locator('.fake-gg').count() === 1 && (await p.locator('input[type=password]').count()) === 0, 'đăng ký: chỉ qua Google, không còn ô mật khẩu');
  if (process.env.SHOT) await p.screenshot({ path: process.env.SHOT + '/gg-dangky.png' });
  await ctx.close();
  // 2. tài khoản cũ chưa liên kết: bị chặn
  ctx = await ctxWith(b, false);
  await ctx.addInitScript(() => localStorage.setItem('vkl.session', JSON.stringify({ username: 'thu', token: '00000000-0000-4000-8000-000000000000' })));
  p = await ctx.newPage();
  p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(URL + '/choi');
  await p.waitForTimeout(6000);
  ok(await p.locator('.gg-gate').count() === 1, 'tài khoản cũ chưa liên kết Google: hiện pop up bắt buộc');
  ok(await p.locator('.gg-gate .chip-btn').count() === 0, 'trình duyệt thường: không có nút Để sau');
  if (process.env.SHOT) await p.screenshot({ path: process.env.SHOT + '/gg-gate.png' });
  await ctx.close();
  // 3. đã liên kết: không chặn
  ctx = await ctxWith(b, true);
  await ctx.addInitScript(() => localStorage.setItem('vkl.session', JSON.stringify({ username: 'thu', token: '00000000-0000-4000-8000-000000000000' })));
  p = await ctx.newPage();
  await p.goto(URL + '/choi');
  await p.waitForTimeout(5000);
  ok(await p.locator('.gg-gate').count() === 0, 'đã liên kết Google: không chặn');
  await ctx.close();
  // 4. trong trình duyệt Facebook
  ctx = await ctxWith(b, false, 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/450.0]');
  await ctx.addInitScript(() => localStorage.setItem('vkl.session', JSON.stringify({ username: 'thu', token: '00000000-0000-4000-8000-000000000000' })));
  p = await ctx.newPage();
  await p.goto(URL + '/choi');
  await p.waitForTimeout(6000);
  ok(await p.locator('.gg-gate .gg-inapp').count() === 1, 'trong Facebook: hướng dẫn mở bằng Safari/Chrome');
  if (process.env.SHOT) await p.screenshot({ path: process.env.SHOT + '/gg-fb.png' });
  await p.locator('.gg-gate .chip-btn').click({ timeout: 3000 }).catch(() => {});
  await p.waitForTimeout(500);
  ok(await p.locator('.gg-gate').count() === 0, 'trong Facebook: bấm Để sau thì chơi tiếp được');
  ok(!errs.length, 'không lỗi JS ' + errs.join(' | ').slice(0, 200));
  await b.close();
  console.log(fail ? `\n${fail} mục HỎNG` : '\nTất cả OK');
  process.exit(fail ? 1 : 0);
})();
