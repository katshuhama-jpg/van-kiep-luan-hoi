/**
 * 12/11 góp ý #227: tắt game giữa trận Lôi đài, quay lại trong ngày thì phải đánh nốt được trận đang chờ.
 * Giả máy chủ: vkl_arena_pick2 trả PENDING kèm bóng đang giữ, vkl_arena_draw trả lại đúng đối thủ cũ (again).
 * Chạy: npx next dev -p 3314, rồi node scripts/smoke-arena-pending.cjs [thư mục ảnh]
 */
const { chromium } = require('playwright');
const path = require('path');
const URL = process.env.SMOKE_URL || 'http://localhost:3314';
const DIR = process.argv[2];
let fail = 0;
const ok = (c, m) => { console.log((c ? 'OK  ' : 'HỎNG') + ' ' + m); if (!c) fail++; };
const shadow = (name, lifeId, realm) => ({ name, gender: 'nam', realm, layer: 5, path: 'kiem', daoTam: 10, age: 120, equipped: { ao: 'ao_vai', vu_khi: 'thiet_kiem' }, lifeNo: 3, lifeId, element: 'kim' });

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  const calls = [];
  await ctx.route('**/rest/v1/rpc/**', async (route) => {
    const fn = route.request().url().split('/rpc/')[1].split('?')[0];
    calls.push(fn);
    const json = (o) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(o) });
    if (fn === 'vkl_arena_state2') return json({ me: { username: 'thu', pts: 12, used: 1, wins: 1, losses: 0, winRun: 1, champ: null }, opps: [], revenge: [], top: [], champs: [] });
    if (fn === 'vkl_arena_candidates') return json([shadow('Ta Đây', 11, 4), shadow('Kiếp Khác', 12, 3)]);
    if (fn === 'vkl_arena_pick2') return json({ error: 'PENDING', champ: shadow('Ta Đây', 11, 4) });
    if (fn === 'vkl_arena_draw') return json({ opp: 'dich', shadow: shadow('Bóng Địch', 77, 4), again: true });
    if (fn === 'vkl_arena_shadow') return json(shadow('Bóng Địch', 77, 4));
    if (fn === 'vkl_me') return json({ username: 'thu', meta: { lives: 3, phucDuyen: 10, talents: [], nghiep: 0, enemy: null }, state: null });
    return json(null);
  });
  await ctx.route(/vkl_track/, (r) => r.fulfill({ status: 200, body: 'null', contentType: 'application/json' }));
  await ctx.addInitScript(() => {
    localStorage.setItem('vkl.session', JSON.stringify({ username: 'thu', token: '00000000-0000-4000-8000-000000000000' }));
    localStorage.setItem('vkl.tut', '1');
  });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => { if (!/Hydration|#418/.test(e.message)) errs.push(e.message.slice(0, 160)); });
  await p.goto(URL + '/loi-dai');
  await p.waitForTimeout(5000);
  await p.addStyleTag({ content: 'nextjs-portal{display:none!important}' });
  await p.locator('.ar-go-btn').click({ timeout: 8000 });
  await p.waitForTimeout(3000);
  const txt = await p.locator('body').innerText();
  if (DIR) await p.screenshot({ path: path.join(DIR, 'loidai-tran-cho.png') });
  ok(!/Đang có trận đã rút đối thủ/.test(txt), 'không còn báo kẹt "Đang có trận đã rút đối thủ"');
  ok(calls.includes('vkl_arena_draw'), 'rút lại đúng trận đang chờ (gọi vkl_arena_draw)');
  ok(/phóng kiếm/.test(txt), 'vào trận ngay (màn phóng phi kiếm)');
  ok(!errs.length, 'không lỗi JS ' + errs.join(' | '));
  await ctx.close();
  await b.close();
  console.log(fail ? '\nCÓ LỖI' : '\nTất cả OK');
  process.exit(fail ? 1 : 0);
})();
