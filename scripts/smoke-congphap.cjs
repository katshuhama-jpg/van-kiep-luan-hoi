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

async function open(b, char, pause) {
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  await p.route(/vkl_track|vkl_save/, (r) => r.fulfill({ status: 200, body: 'null', contentType: 'application/json' }));
  p.errs = [];
  p.on('pageerror', (e) => { if (!/Hydration|#418/.test(e.message)) p.errs.push(e.message.slice(0, 160)); });
  await p.goto(URL + '/');
  const s = JSON.parse(JSON.stringify(base)); s.pending = null; Object.assign(s.char, { dead: false, lifeNo: 6 }, char);
  await p.evaluate(([s, m, v]) => { localStorage.clear(); localStorage.setItem('vkl.tut', '1'); localStorage.setItem('vkl.seenVer', v); localStorage.setItem('vkl.notice.down1101', '1'); localStorage.setItem('vkl.save', JSON.stringify(s)); localStorage.setItem('vkl.meta', JSON.stringify(m)); }, [s, META, VER]);
  await p.goto(URL + '/choi');
  if (pause) await p.locator('button.play[aria-label="Tạm dừng"]').click({ timeout: 15000 }).catch(() => {});
  await p.waitForTimeout(pause ? 1500 : 7000);
  await p.addStyleTag({ content: 'nextjs-portal{display:none!important}' });
  return p;
}
const save = async (p) => JSON.parse(await p.evaluate(() => localStorage.getItem('vkl.save'))).char;

(async () => {
  const b = await chromium.launch();
  // 1. trừ yêu: ra chiêu theo công pháp đạo Kiếm
  let p = await open(b, { path: 'kiem', realm: 4, focus: 'tru_yeu', huntTarget: 'ngan_giac', cp: undefined });
  let skills = new Set(); let fx = 0; let gauge = '';
  for (let i = 0; i < 120 && !(skills.size && fx && gauge); i++) {
    await p.waitForTimeout(120);
    // sự kiện ngẫu nhiên (gặp thú, kỳ ngộ) chen vào thì chọn đại để trận trừ yêu chạy tiếp
    if (i % 5 === 4 && (await p.locator('.choice').count())) await p.locator('.choice').last().click().catch(() => {});
    if (i % 5 === 4 && (await p.locator('.duel-warn .btn-dark').count())) await p.locator('.duel-warn .btn-dark').last().click().catch(() => {});
    const r = await p.evaluate(() => ({ s: document.querySelector('.skill-name')?.textContent || '', f: document.querySelectorAll('.cpf').length, g: document.querySelector('.cp-gauge span')?.textContent || '' }));
    if (r.s) skills.add(r.s); fx = Math.max(fx, r.f); gauge = gauge || r.g;
  }
  if (!gauge && process.env.SMOKE_SHOT) await p.screenshot({ path: process.env.SMOKE_SHOT });
  ok(/Kiếm ý/.test(gauge), 'trận trừ yêu có thanh Kiếm ý của đạo');
  ok(fx > 0, 'đòn đánh có hiệu ứng chiêu pixel');
  ok([...skills].some((s) => /Liệt Hỏa|Kim Xà|Thái Cực|Trường Quyền|Thiết Sa/.test(s)), 'ra chiêu theo công pháp: ' + [...skills].join(', '));
  let ch = await save(p);
  for (let i = 0; i < 10 && !(ch.cp && ch.cp.eq[0] === 'thanh_lien'); i++) { await p.waitForTimeout(500); ch = await save(p); }
  ok(ch.cp && ch.cp.own.some((o) => o.id === 'thanh_lien') && ch.cp.eq[0] === 'thanh_lien', 'kiếm tu được truyền tâm pháp Thanh Liên, đã mang');
  ok(!(await p.locator('.chuong').count()), 'không còn quả cầu chưởng gradient cũ');
  ok(!p.errs.length, 'trận không lỗi JS ' + p.errs.join(' | '));
  await p.close();

  // 2. Tàng Kinh Các
  p = await open(b, {
    path: 'kiem', realm: 3, tq: { thanh_lien: 2, thiet_sa: 3, van_kiem: 3, thai_cuc_kiem: 1 }, tqVan: 1, cultivation: 300, focus: 'tu_luyen', huntTarget: undefined,
    cp: { own: [{ id: 'dan_khi', tang: 3, exp: 40 }, { id: 'truong_quyen', tang: 3, exp: 100 }, { id: 'thiet_sa', tang: 2, exp: 30 }, { id: 'thanh_lien', tang: 5, exp: 100 }, { id: 'liet_hoa', tang: 9, exp: 0 }, { id: 'kim_xa', tang: 9, exp: 0 }, { id: 'thai_cuc_kiem', tang: 5, exp: 100 }], eq: ['thanh_lien', 'liet_hoa', 'kim_xa'] },
    }, true);
  // dừng thời gian; sự kiện ngẫu nhiên đã chen vào thì chọn đại cho qua
  await p.locator('button.play[aria-label="Tạm dừng"]').click({ timeout: 3000 }).catch(() => {});
  for (let i = 0; i < 6 && !(await p.locator('.dock-actions').count()); i++) {
    await p.locator('.choice').last().click({ timeout: 1000 }).catch(() => {});
    await p.locator('.duel-warn .btn-dark').last().click({ timeout: 1000 }).catch(() => {});
    await p.waitForTimeout(600);
  }
  await p.locator('.dock-actions button', { hasText: 'Công pháp' }).click({ timeout: 5000 }).catch(() => {});
  await p.waitForTimeout(1200);
  ok(await p.locator('.tk-wrap').count() > 0, 'mở được Tàng Kinh Các từ dock');
  ok(await p.locator('.tk-seat').count() === 5, 'vòng có 5 ô (tâm pháp, 3 chiêu, tuyệt kỹ)');
  ok(await p.locator('.tk-seat .tk-orb.lock').count() === 2, 'Kim Đan: ô chiêu 3 và tuyệt kỹ còn khóa');
  await p.locator('.tk-cp', { hasText: 'Thanh Liên' }).locator('.tk-up').click({ timeout: 5000 }).catch(() => {});
  await p.waitForTimeout(300);
  ch = await save(p);
  ok(ch.cp.own.find((o) => o.id === 'thanh_lien').tang === 6 && ch.tq.thanh_lien === 0 && ch.cultivation < 300, 'nâng tâm pháp tầng 5 lên 6: tốn 2 tàn quyển riêng và một ít tu vi');
  // biến chiêu: Thái Cực tầng 5 thiếu quyển, bù vạn năng thì phải chọn Cương/Nhu
  ok(await p.locator('.tk-cp', { hasText: 'Thái Cực' }).locator('.tk-bien-btn').count() === 2, 'Thái Cực tầng 5: hiện 2 nút biến chiêu Cương/Nhu');
  await p.locator('.tk-cp', { hasText: 'Thái Cực' }).locator('.tk-bien-btn.nhu').click({ timeout: 5000 }).catch(() => {});
  await p.waitForTimeout(300);
  ch = await save(p);
  const tc = ch.cp.own.find((o) => o.id === 'thai_cuc_kiem');
  ok(tc.tang === 6 && tc.bien === 'nhu' && ch.tqVan === 0 && ch.tq.thai_cuc_kiem === 0, 'ngộ biến chiêu Nhu, dùng 1 tàn quyển vạn năng');
  // chép 3 quyển Thiết Sa thành 1 quyển bộ khác cùng đạo (đạo chung: Trường Quyền)
  await p.locator('.tk-cp', { hasText: 'Thiết Sa' }).click();
  await p.waitForTimeout(200);
  await p.locator('.tk-cp', { hasText: 'Thiết Sa' }).locator('.tk-swap .chip-btn').first().click({ timeout: 5000 }).catch(() => {});
  await p.waitForTimeout(300);
  ch = await save(p);
  ok((ch.tq.thiet_sa ?? 0) === 0 && Object.entries(ch.tq).some(([k, v]) => k !== 'thiet_sa' && k !== 'van_kiem' && v === 1), 'chép 3 tàn quyển Thiết Sa thành 1 quyển bộ khác cùng đạo');
  ok((await p.locator('.tk-gh').allInnerTexts()).join('|').includes('Đang mang') && (await p.locator('.tk-gh').allInnerTexts()).join('|').includes('Đã có, chưa mang'), 'danh sách chia nhóm Đang mang / Đã có, chưa mang');
  await p.locator('.tk-cp', { hasText: 'Thiết Sa' }).locator('.tk-eq').click({ timeout: 5000 }).catch(() => {});
  await p.waitForTimeout(300);
  ch = await save(p);
  ok(!ch.cp.eq.includes('thiet_sa') && ch.cp.eq[1] === 'liet_hoa' && ch.cp.eq[2] === 'kim_xa', 'ô chiêu đầy: bấm Mang chưa tự tháo chiêu nào');
  if (process.env.SHOT) { await p.locator('.tk-pick').scrollIntoViewIfNeeded().catch(() => {}); await p.screenshot({ path: process.env.SHOT + '/tk-pick.png' }); }
  ok(await p.locator('.tk-pick .chip-btn').count() === 2 && await p.locator('.tk-seat.pick').count() === 2, 'ô chiêu đầy: hỏi thay ô nào (trong danh sách và trên vòng)');
  await p.locator('.tk-pick .chip-btn', { hasText: 'Chiêu 1' }).click({ timeout: 5000 }).catch(() => {});
  await p.waitForTimeout(300);
  ch = await save(p);
  ok(ch.cp.eq[1] === 'thiet_sa' && ch.cp.eq[2] === 'kim_xa', 'chọn Chiêu 1: Thiết Sa thay đúng ô đó');
  if (process.env.SHOT) { await p.locator('.tk-wrap .forge-scene').evaluate((e) => e.scrollTo(0, 0)).catch(() => {}); await p.locator('.tk-hint').scrollIntoViewIfNeeded().catch(() => {}); await p.screenshot({ path: process.env.SHOT + '/tk-top.png' }); }
  ok((await p.locator('.tk-said').innerText().catch(() => '')).includes('Đã thay'), 'báo rõ đã thay chiêu nào bằng chiêu nào');
  // trả lại để thử dung hợp
  await p.locator('.tk-cp', { hasText: 'Liệt Hỏa' }).locator('.tk-eq').click({ timeout: 5000 }).catch(() => {});
  await p.waitForTimeout(200);
  await p.locator('.tk-seat.pick').first().click({ timeout: 5000 }).catch(() => {});
  await p.waitForTimeout(300);
  ch = await save(p);
  ok(ch.cp.eq[1] === 'liet_hoa', 'bấm ô trên vòng cũng thay được');
  await p.locator('.chip-btn', { hasText: 'Dung hợp' }).click();
  await p.waitForTimeout(300);
  await p.evaluate(() => { Math.random = () => 0.1; });
  await p.locator('.tk-wrap .btn-red').click({ timeout: 5000 }).catch(() => {});
  await p.waitForTimeout(2000);
  ch = await save(p);
  ok(ch.cp.tuyet === 'van_kiem' && ch.tq.van_kiem === 0, 'dung hợp 2 chiêu tầng 9 ra Vạn Kiếm Quy Tông, tốn 3 tàn quyển Vạn Kiếm');
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
