// 15/11 Gỡ liên kết Google (tách từ smoke-google). 4/11 Bảo vệ tài khoản: Google hoặc mã khôi phục. Build với NEXT_PUBLIC_GOOGLE_CLIENT_ID (giá trị thử) rồi chạy.
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
  await ctx.route(/\/rest\/v1\/(?!rpc)/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
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
  let r;
  // 2a. đã liên kết Google: menu ghi rõ, không còn dải nhắc
  r = await playing(b, { google: true }, { realm: 2, layer: 1, age: 30, lifespan: 150, path: 'kiem' });
  ok(await r.p.locator('.gg-nudge').count() === 0, 'đã liên kết Google: không còn dải nhắc');
  await r.p.locator('.menu-btn').click({ timeout: 5000 }).catch(() => {});
  await r.p.waitForTimeout(400);
  if (SHOT) await r.p.screenshot({ path: SHOT + '/gg-menu2.png' });
  ok(await r.p.locator('button', { hasText: 'Đã liên kết tài khoản Google' }).count() === 1, 'menu: nút Đã liên kết tài khoản Google');
  // 15/11: gỡ liên kết Google: phải đặt mật khẩu mới rồi mới hiện nút Google xác nhận
  await r.p.locator('button', { hasText: 'Đã liên kết tài khoản Google' }).click({ timeout: 5000 }).catch(() => {});
  await r.p.waitForTimeout(800);
  await r.p.locator('.gg-gate .gg-unlink', { hasText: 'Gỡ liên kết Google' }).click({ timeout: 5000 }).catch(() => {});
  await r.p.waitForTimeout(300);
  ok(await r.p.locator('.gg-gate .fake-gg').count() === 0, 'gỡ liên kết: chưa nhập mật khẩu mới thì chưa hiện nút Google');
  await r.p.locator('.gg-gate label.note input').fill('abc12');
  await r.p.waitForTimeout(800);
  if (SHOT) await r.p.screenshot({ path: SHOT + '/gg-unlink.png', fullPage: true });
  ok(await r.p.locator('.gg-gate .fake-gg').count() === 1, 'gỡ liên kết: nhập mật khẩu mới xong thì hiện nút Google xác nhận');
  ok(await r.p.locator('.gg-gate .gg-unlink', { hasText: 'Thôi, giữ liên kết' }).count() === 1, 'gỡ liên kết: có nút hủy');
  await r.ctx.close();

  ok(!errs.length, 'không lỗi JS ' + errs.join(' | ').slice(0, 200));
  await b.close();
  console.log(fail ? `\n${fail} mục HỎNG` : '\nTất cả OK');
  process.exit(fail ? 1 : 0);
})();
