/**
 * 5/11 chống gian lận: Lôi đài/chiến thư tính trận trên máy chủ.
 * Giả máy chủ (/api/loi-dai trả hạt giống, hai bóng và kết quả đã ghi), kiểm: trình duyệt không tự ghi kết quả
 * bằng vkl_thach_fight nữa, phát lại đúng trận máy chủ đã đánh, bảng kết quả lấy số từ máy chủ.
 * Máy chủ chưa bật (NO_SRV) thì vẫn dùng cách ghi cũ.
 * Chạy: npx next start -p 3314 (cửa sổ khác), rồi node scripts/smoke-loidai.cjs.
 */
const { chromium } = require('playwright');
const URL = process.env.SMOKE_URL || 'http://localhost:3314';
let fail = 0;
const ok = (c, m) => { console.log((c ? 'OK  ' : 'HỎNG') + ' ' + m); if (!c) fail++; };
const shadow = (name, lifeId, realm) => ({ name, gender: 'nam', realm, layer: 5, path: 'kiem', daoTam: 10, age: 120, equipped: { ao: 'ao_vai', vu_khi: 'thiet_kiem' }, lifeNo: 3, lifeId, element: 'kim' });

async function run(b, srv) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  const calls = [];
  let apiBody = null;
  await ctx.route('**/rest/v1/rpc/**', async (route) => {
    const fn = route.request().url().split('/rpc/')[1].split('?')[0];
    calls.push(fn);
    const json = (o) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(o) });
    if (fn === 'vkl_arena_shadow') return json(shadow('Bóng Địch', 77, 4));
    if (fn === 'vkl_arena_candidates') return json([shadow('Ta Đây', 11, 4)]);
    if (fn === 'vkl_thach_left') return json(3);
    if (fn === 'vkl_thach_fight') return json({ left: 2, phuc: 5 });
    if (fn === 'vkl_me') return json({ username: 'thu', meta: { lives: 3, phucDuyen: 10, talents: [], nghiep: 0, enemy: null }, state: null });
    return json(null);
  });
  await ctx.route('**/api/loi-dai', async (route) => {
    apiBody = JSON.parse(route.request().postData() || '{}');
    if (!srv) return route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'NO_SRV' }) });
    const me = shadow('Ta Đây', 11, 4), foe0 = shadow('Bóng Địch', 77, 4);
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ seed: 12345, swords: apiBody.swords, win: true, hp: 50, me, foe0, res: { left: 2, phuc: 7 } }) });
  });
  await ctx.route(/vkl_track/, (r) => r.fulfill({ status: 200, body: 'null', contentType: 'application/json' }));
  await ctx.addInitScript(() => {
    localStorage.setItem('vkl.session', JSON.stringify({ username: 'thu', token: '00000000-0000-4000-8000-000000000000' }));
    localStorage.setItem('vkl.tut', '1');
  });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => { if (!/Hydration|#418/.test(e.message)) errs.push(e.message.slice(0, 160)); });
  await p.goto(URL + '/thach-dau?u=dich');
  await p.waitForTimeout(2500);
  await p.locator('.ar-go-btn').click({ timeout: 8000 }).catch(() => {});
  // VS 2,6 giây + phi kiếm 12 giây
  await p.waitForTimeout(17000);
  await p.locator('.am-auto').click({ timeout: 8000 }).catch(() => {});
  await p.waitForTimeout(9000);
  const txt = await p.locator('body').innerText();
  return { calls, apiBody, txt, errs, p, ctx };
}

(async () => {
  const b = await chromium.launch();
  const a = await run(b, true);
  ok(!!a.apiBody && a.apiBody.mode === 'thach' && a.apiBody.myLifeId === 11 && typeof a.apiBody.swords === 'number', 'gửi máy chủ số phi kiếm, bóng mình và đối thủ (không gửi thắng thua)');
  ok(!a.calls.includes('vkl_thach_fight'), 'trình duyệt không tự ghi kết quả nữa');
  ok(/\+7 phúc|\+7 Fortune/.test(a.txt), 'bảng kết quả lấy số phúc từ máy chủ');
  ok(!a.errs.length, 'không lỗi JS ' + a.errs.join(' | '));
  if (process.env.SHOT) await a.p.screenshot({ path: process.env.SHOT + '/loidai-srv.png' });
  await a.ctx.close();
  const c = await run(b, false);
  ok(c.calls.includes('vkl_thach_fight'), 'máy chủ chưa bật (NO_SRV): vẫn ghi theo cách cũ');
  await c.ctx.close();
  await b.close();
  console.log(fail ? '\nCÓ LỖI' : '\nTất cả OK');
  process.exit(fail ? 1 : 0);
})();
