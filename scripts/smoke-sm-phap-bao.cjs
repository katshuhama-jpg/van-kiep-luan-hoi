/**
 * 19/11: pháp bảo Sơn Môn lắp vào chân thân (tab Nhân vật, ô Vũ khí/Phụ kiện), cộng Tu vi.
 * Giả lập tài khoản + giả máy chủ (route RPC), không đụng dữ liệu thật. Chạy: SMOKE_URL=http://localhost:3314 node scripts/smoke-sm-phap-bao.cjs
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const URL = process.env.SMOKE_URL || 'http://localhost:3314';
const VER = (fs.readFileSync(path.join(__dirname, '../lib/releases.ts'), 'utf8').match(/v: '([0-9.]+)'/) || [])[1] || '';
const today = new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);
const META = { phucDuyen: 50, nghiep: 0, lives: 12, talents: [], enemy: null, streak: { day: today, n: 1 }, checkin: today, chanThan: { name: 'Thanh Vân', gender: 'nam', skin: 1, hair: 1, hairColor: 1, outfit: 2, createdAt: 1, renamed: 0 }, career: { maxAge: 120, maxRealm: 3, ascPaths: [], paths: ['kiem'], duelWins: 0, revenges: 0 } };
let ds = [
  { id: 11, ky: 1, o: 'vu_khi', loai: 'dao', pham: 'than', pct: 14, ten: 'Thần phẩm Thanh Hư Đao', khac: 'Thanh Hư Tông - Kỷ 1', mac: false, hang_cong: 2, hang_mon: 1 },
  { id: 12, ky: 1, o: 'phu_kien', loai: 'an', pham: 'than', pct: 12, ten: 'Thần phẩm Thanh Hư Chưởng Môn Ấn', khac: 'Thanh Hư Tông - Kỷ 1', mac: false, hang_cong: 2, hang_mon: 1 },
];
let fail = 0;
const ok = (c, m) => { console.log((c ? 'OK  ' : 'HỎNG') + ' ' + m); if (!c) fail++; };
const n = (s) => parseInt(s.replace(/\./g, ''));
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = [];
  if (process.env.DBG) { p.on('console', (m) => console.log('console:', m.text().slice(0, 200))); p.on('request', (q) => /rpc/.test(q.url()) && console.log('req', q.method(), q.url().split('/rpc/')[1])); }
  p.on('pageerror', (e) => { if (!/Hydration|#418/.test(e.message)) errs.push(e.message.slice(0, 160)); });
  await p.route(/\/rest\/v1\/rpc\//, (r) => {
    const u = r.request().url();
    if (/vkl_sm_bao_vat_ds/.test(u)) return r.fulfill({ status: 200, body: JSON.stringify(ds), contentType: 'application/json' });
    if (/vkl_sm_bao_vat_mac/.test(u)) {
      const id = JSON.parse(r.request().postData() || '{}').p_id; if (process.env.DBG) console.log('mac', r.request().method(), r.request().postData());
      const b0 = ds.find((x) => x.id === id);
      ds = ds.map((x) => (x.id === id ? { ...x, mac: !x.mac } : x.o === b0.o ? { ...x, mac: false } : x));
      return r.fulfill({ status: 200, body: JSON.stringify(ds), contentType: 'application/json' });
    }
    if (/vkl_me\b/.test(u)) return r.fulfill({ status: 200, body: JSON.stringify({ meta: META, state: null }), contentType: 'application/json' });
    return r.fulfill({ status: 200, body: 'null', contentType: 'application/json' });
  });
  await p.goto(URL + '/');
  await p.evaluate(([m, v]) => { localStorage.clear(); localStorage.setItem('vkl.tut', '1'); localStorage.setItem('vkl.seenVer', v); localStorage.setItem('vkl.tabHint', '1'); localStorage.setItem('vkl.meta', JSON.stringify(m)); localStorage.setItem('vkl.session', JSON.stringify({ username: 'thu_pb', token: '00000000-0000-0000-0000-000000000000' })); }, [META, VER]);
  await p.goto(URL + '/chan-than'); await p.waitForSelector('.nv-stage'); await p.waitForTimeout(1500);
  const tv0 = n(await p.textContent('.nv-power b'));
  await p.click('.nv-tab:has-text("Vũ khí")'); await p.waitForTimeout(300);
  ok((await p.$$('.nv-cell')).length === 1, 'tab Vũ khí có Thần phẩm Đao');
  await p.click('.nv-cell'); await p.waitForTimeout(800);
  ok(/Đã lắp/.test(await p.textContent('.nv-say')), 'lắp đao: báo chỉ số ' + (await p.textContent('.nv-say')).slice(0, 80));
  ok(!!(await p.$('.nv-slot.has:has-text("Thần phẩm Đao")')), 'ô Vũ khí trên sân khấu hiện đao');
  const tv1 = n(await p.textContent('.nv-power b'));
  ok(tv1 - tv0 === 3000, `Tu vi tăng 3.000 (${tv0} -> ${tv1})`);
  await p.click('.nv-tab:has-text("Phụ kiện")'); await p.waitForTimeout(300);
  await p.click('.nv-cell'); await p.waitForTimeout(800);
  const tv2 = n(await p.textContent('.nv-power b'));
  ok(tv2 - tv1 === 2000, `lắp ấn: Tu vi +2.000 (${tv2})`);
  await p.screenshot({ path: process.env.SHOT || '/tmp/pb.png' });
  if (process.env.SHOT2) { await p.locator('.nv-stage').scrollIntoViewIfNeeded(); await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(800); await p.screenshot({ path: process.env.SHOT2 }); }
  await p.click('.nv-cell'); await p.waitForTimeout(800);
  ok(n(await p.textContent('.nv-power b')) === tv1, 'tháo ấn: Tu vi về như trước');
  ok(!!(await p.$('.nv-slot.has:has-text("Thần phẩm Đao")')) && !(await p.$('.nv-slot.has:has-text("Ấn")')), 'còn lắp đao, ô Phụ kiện trống');
  ok(errs.length === 0, 'không lỗi JS ' + errs.join(' | '));
  await b.close();
  console.log(fail ? `${fail} mục HỎNG` : 'Tất cả OK');
  process.exit(fail ? 1 : 0);
})();
