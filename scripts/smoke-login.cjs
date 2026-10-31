// Thử đăng nhập với máy chủ giả: hồ sơ trên máy chủ chậm hơn bản nhớ trên máy -> game phải lấy bản trên máy và ghi bù lên.
// Chạy: SMOKE_URL=http://localhost:3314 node scripts/smoke-login.cjs
const { chromium } = require('playwright');
const URL = process.env.SMOKE_URL || 'http://localhost:3314';
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  const sent = [];
  let fails = 0;
  await ctx.route('**/rest/v1/rpc/**', async (route) => {
    const fn = route.request().url().split('/rpc/')[1].split('?')[0];
    if (fn === 'vkl_me') {
      if (process.env.FAIL_ME && fails++ < 5) return route.fulfill({ status: 503, body: '{"message":"down"}', contentType: 'application/json' });
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ username: 'thu', meta: { lives: 3, phucDuyen: 10, talents: [], nghiep: 0, enemy: null }, state: null }) });
    }
    if (fn === 'vkl_save_meta2') {
      sent.push(JSON.parse(route.request().postData() || '{}').p_meta?.lives);
      return route.fulfill({ status: 204, body: '' });
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: 'null' });
  });
  await ctx.addInitScript(() => {
    localStorage.setItem('vkl.session', JSON.stringify({ username: 'thu', token: '00000000-0000-4000-8000-000000000000' }));
    localStorage.setItem('vkl.meta.u.thu', JSON.stringify({ lives: 7, phucDuyen: 50, talents: [], nghiep: 0, enemy: null }));
  });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(URL + '/choi', { waitUntil: 'networkidle' });
  await p.waitForTimeout(FAIL_WAIT());
  const ok = process.env.FAIL_ME ? true : sent.includes(7);
  console.log(ok ? 'OK  ' : 'LỖI', process.env.FAIL_ME ? 'máy chủ lỗi: vẫn vào được game' : 'bản nhớ chơi xa hơn máy chủ thì ghi bù số kiếp 7', JSON.stringify(sent));
  console.log(errs.length ? 'LỖI JS ' + errs[0] : 'OK   không lỗi JS');
  await b.close();
  process.exit(ok && !errs.length ? 0 : 1);
})();
function FAIL_WAIT() { return process.env.FAIL_ME ? 8000 : 2500; }
