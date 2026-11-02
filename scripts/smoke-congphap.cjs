/**
 * 4.2.0 Công pháp: trừ yêu ra chiêu theo công pháp (có hiệu ứng, thanh của đạo), mở Tàng Kinh Các,
 * nâng tầng tốn tàn quyển, mang chiêu vào ô, dung hợp ra tuyệt kỹ, chọn truyền thừa.
 * Chạy: npx next start -p 3314 (cửa sổ khác), rồi node scripts/smoke-congphap.cjs. Thoát mã 1 nếu hỏng.
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const URL = process.env.SMOKE_URL || 'http://localhost:3314';
const base = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/save.json'), 'utf8'));
const VER = (fs.readFileSync(path.join(__dirname, '../lib/releases.ts'), 'utf8').match(/v: '([0-9.]+)'/) || [])[1] || '';
const today = new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);
const META = { phucDuyen: 5, nghiep: 0, lives: 5, talents: [], enemy: null, streak: { day: today, n: 1 }, checkin: today };
let fail = 0;
const ok = (c, m) => { console.log((c ? 'OK  ' : 'HỎNG') + ' ' + m); if (!c) fail++; };

async function open(b, char) {
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  await p.route(/vkl_track|vkl_save/, (r) => r.fulfill({ status: 200, body: 'null', contentType: 'application/json' }));
  p.errs = [];
  p.on('pageerror', (e) => { if (!/Hydration|#418/.test(e.message)) p.errs.push(e.message.slice(0, 160)); });
  await p.goto(URL + '/');
  const s = JSON.parse(JSON.stringify(base)); s.pending = null; Object.assign(s.char, { dead: false, lifeNo: 6 }, char);
  await p.evaluate(([s, m, v]) => { localStorage.clear(); localStorage.setItem('vkl.tut', '1'); localStorage.setItem('vkl.seenVer', v); localStorage.setItem('vkl.notice.down1101', '1'); localStorage.setItem('vkl.save', JSON.stringify(s)); localStorage.setItem('vkl.meta', JSON.stringify(m)); }, [s, META, VER]);
  await p.goto(URL + '/choi'); await p.waitForTimeout(7000);
  await p.addStyleTag({ content: 'nextjs-portal{display:none!important}' });
  return p;
}
const save = async (p) => JSON.parse(await p.evaluate(() => localStorage.getItem('vkl.save'))).char;

(async () => {
  const b = await chromium.launch();
  // 1. trừ yêu: ra chiêu theo công pháp đạo Kiếm
  let p = await open(b, { path: 'kiem', realm: 4, focus: 'tru_yeu', huntTarget: 'huyet_ma', cp: undefined });
  let skills = new Set(); let fx = 0; let gauge = '';
  for (let i = 0; i < 40; i++) {
    await p.waitForTimeout(120);
    const r = await p.evaluate(() => ({ s: document.querySelector('.skill-name')?.textContent || '', f: document.querySelectorAll('.cpf').length, g: document.querySelector('.cp-gauge span')?.textContent || '' }));
    if (r.s) skills.add(r.s); fx = Math.max(fx, r.f); gauge = gauge || r.g;
  }
  ok(/Kiếm ý/.test(gauge), 'trận trừ yêu có thanh Kiếm ý của đạo');
  ok(fx > 0, 'đòn đánh có hiệu ứng chiêu pixel');
  ok([...skills].some((s) => /Liệt Hỏa|Kim Xà|Trường Quyền|Thiết Sa/.test(s)), 'ra chiêu theo công pháp: ' + [...skills].join(', '));
  let ch = await save(p);
  ok(ch.cp && ch.cp.own.some((o) => o.id === 'thanh_lien') && ch.cp.eq[0] === 'thanh_lien', 'kiếm tu được truyền tâm pháp Thanh Liên, đã mang');
  ok(!(await p.locator('.chuong').count()), 'không còn quả cầu chưởng gradient cũ');
  ok(!p.errs.length, 'trận không lỗi JS ' + p.errs.join(' | '));
  await p.close();

  // 2. Tàng Kinh Các
  p = await open(b, {
    path: 'kiem', realm: 3, tanQuyen: 4, focus: 'tu_luyen', huntTarget: undefined,
    cp: { own: [{ id: 'dan_khi', tang: 3, exp: 40 }, { id: 'truong_quyen', tang: 3, exp: 100 }, { id: 'thiet_sa', tang: 2, exp: 30 }, { id: 'thanh_lien', tang: 5, exp: 100 }, { id: 'liet_hoa', tang: 9, exp: 0 }, { id: 'kim_xa', tang: 9, exp: 0 }], eq: ['thanh_lien', 'liet_hoa', 'kim_xa'] },
  });
  await p.locator('.dock-actions button', { hasText: 'Công pháp' }).click({ timeout: 5000 }).catch(() => {});
  await p.waitForTimeout(1200);
  ok(await p.locator('.tk-wrap').count() > 0, 'mở được Tàng Kinh Các từ dock');
  ok(await p.locator('.tk-seat').count() === 5, 'vòng có 5 ô (tâm pháp, 3 chiêu, tuyệt kỹ)');
  ok(await p.locator('.tk-seat .tk-orb.lock').count() === 2, 'Kim Đan: ô chiêu 3 và tuyệt kỹ còn khóa');
  await p.locator('.tk-cp', { hasText: 'Thanh Liên' }).locator('.tk-up').click({ timeout: 5000 }).catch(() => {});
  await p.waitForTimeout(300);
  ch = await save(p);
  ok(ch.cp.own.find((o) => o.id === 'thanh_lien').tang === 6 && ch.tanQuyen === 3, 'nâng tầng 5 lên 6, tốn 1 tàn quyển');
  await p.locator('.tk-cp', { hasText: 'Thiết Sa' }).locator('.tk-eq').click({ timeout: 5000 }).catch(() => {});
  await p.waitForTimeout(300);
  ch = await save(p);
  ok(ch.cp.eq.includes('thiet_sa'), 'mang Thiết Sa Chưởng vào ô chiêu');
  await p.locator('.chip-btn', { hasText: 'Dung hợp' }).click();
  await p.waitForTimeout(300);
  await p.evaluate(() => { Math.random = () => 0.1; });
  await p.locator('.tk-wrap .btn-red').click({ timeout: 5000 }).catch(() => {});
  await p.waitForTimeout(2000);
  ch = await save(p);
  ok(ch.cp.tuyet === 'van_kiem' && ch.tanQuyen === 0, 'dung hợp 2 chiêu tầng 9 ra Vạn Kiếm Quy Tông, tốn 3 tàn quyển');
  await p.locator('.chip-btn', { hasText: 'Sổ' }).click();
  await p.waitForTimeout(300);
  await p.locator('.tk-wrap .chip-btn', { hasText: 'Kim Xà' }).click({ timeout: 5000 }).catch(() => {});
  await p.waitForTimeout(300);
  ch = await save(p);
  ok(ch.cpHeirPick === 'kim_xa', 'chọn Kim Xà làm truyền thừa kiếp sau');
  ok(!p.errs.length, 'Tàng Kinh Các không lỗi JS ' + p.errs.join(' | '));
  await b.close();
  console.log(fail ? `\n${fail} mục HỎNG` : '\nTất cả OK');
  process.exit(fail ? 1 : 0);
})();
