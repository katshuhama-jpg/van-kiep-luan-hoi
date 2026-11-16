/**
 * Đo độ mượt (so hai bản): node scripts/perf-cmp.cjs http://localhost:3401 [nhãn]
 * Điện thoại 390x844, CPU chậm 4 lần. Mỗi màn đo 15 giây: số khung hình, tác vụ dài, thời gian script/layout/style.
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const URL = process.argv[2] || 'http://localhost:3314';
const base = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/save.json'), 'utf8'));
const today = new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);
const META = { phucDuyen: 50, nghiep: 0, lives: 12, talents: [], enemy: null, streak: { day: today, n: 1 }, checkin: today };

async function measure(b, route, save, secs = 15) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  await p.route(/vkl_track|vkl_save|supabase\.co/, (r) => r.fulfill({ status: 200, body: 'null', contentType: 'application/json' }));
  await p.addInitScript(() => {
    window.__lt = 0; window.__ltn = 0; window.__fr = 0;
    try { new PerformanceObserver((l) => l.getEntries().forEach((e) => { window.__lt += e.duration; window.__ltn++; })).observe({ type: 'longtask', buffered: true }); } catch {}
    const f = () => { window.__fr++; requestAnimationFrame(f); }; requestAnimationFrame(f);
  });
  await p.goto(URL + '/');
  await p.evaluate(([s, m]) => { localStorage.clear(); localStorage.setItem('vkl.tut', '1'); localStorage.setItem('vkl.seenVer', '9.9.9'); localStorage.setItem('vkl.tabHint', '1'); localStorage.setItem('vkl.notice.down1101', '1'); if (s) localStorage.setItem('vkl.save', JSON.stringify(s)); localStorage.setItem('vkl.meta', JSON.stringify(m)); }, [save, META]);
  const cdp = await ctx.newCDPSession(p);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await cdp.send('Performance.enable');
  await p.goto(URL + route);
  await p.waitForTimeout(4000);
  if (route === '/choi') {
    await p.locator('button').filter({ hasText: /Vào kiếp|Đầu thai|Bắt đầu/ }).first().click({ timeout: 4000 }).catch(() => {});
    await p.waitForTimeout(3000);
  }
  const m0 = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map((x) => [x.name, x.value]));
  const j0 = await p.evaluate(() => ({ lt: window.__lt, n: window.__ltn, fr: window.__fr }));
  await p.waitForTimeout(secs * 1000);
  const m1 = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map((x) => [x.name, x.value]));
  const j1 = await p.evaluate(() => ({ lt: window.__lt, n: window.__ltn, fr: window.__fr, dom: document.getElementsByTagName('*').length }));
  await ctx.close();
  const d = (k) => Math.round((m1[k] - m0[k]) * 1000);
  return { route, fps: +((j1.fr - j0.fr) / secs).toFixed(1), longMs: Math.round(j1.lt - j0.lt), longN: j1.n - j0.n, scriptMs: d('ScriptDuration'), layoutMs: d('LayoutDuration'), styleMs: d('RecalcStyleDuration'), taskMs: d('TaskDuration'), dom: j1.dom };
}

(async () => {
  const b = await chromium.launch();
  const alive = JSON.parse(JSON.stringify(base)); alive.pending = null;
  Object.assign(alive.char, { dead: false, lifeNo: 13 });
  const out = [];
  out.push(await measure(b, '/', null));
  out.push(await measure(b, '/choi', alive));
  out.push(await measure(b, '/loi-dai', null));
  console.log(process.argv[3] || URL);
  console.table(out);
  await b.close();
})();
