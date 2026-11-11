// 12/11 (4.5.0 Ngày 3): thử huyệt trên giao diện. Cần cờ bật: NEXT_PUBLIC_CHAN_THAN=1 npx next dev -p 3314, rồi node scripts/smoke-chanthan.cjs [thư mục ảnh]
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const R = __dirname;
const URL = process.env.SMOKE_URL || 'http://localhost:3314';
const DIR = process.argv[2];
const base = JSON.parse(fs.readFileSync(path.join(R, 'fixtures/save.json'), 'utf8'));
const VER = (fs.readFileSync(path.join(R, '../lib/releases.ts'), 'utf8').match(/v: '([0-9.]+)'/) || [])[1];
const today = new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);
const CT = { name: 'Vân Tâm', gender: 'nu', skin: 1, hair: 2, hairColor: 5, outfit: 3, createdAt: 1, renamed: 0 };
const career = { maxAge: 320, maxRealm: 7, ascPaths: ['kiem'], paths: ['kiem', 'dan'], duelWins: 3, revenges: 0, cosmoses: ['tien'], hanh: { kim: 2, thuy: 1 } };
const meta = (huyet, extra = {}) => ({ phucDuyen: 50, nghiep: 0, lives: 5, talents: [], enemy: null, streak: { day: today, n: 1 }, checkin: today, chanThan: CT, huyet: huyet.map((id) => ({ id, life: id })), career, achievements: ['phi_thang'], endings: { chung_dao: 1 }, ...extra });
let fail = 0;
const ok = (c, m) => { console.log((c ? 'OK  ' : 'HỎNG') + ' ' + m); if (!c) fail++; };
const shot = async (p, n) => DIR && p.screenshot({ path: path.join(DIR, n + '.png') });
async function open(b, url, m, char) {
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
  await p.route(/vkl_track|vkl_save/, (r) => r.fulfill({ status: 200, body: 'null', contentType: 'application/json' }));
  p.errs = [];
  p.on('pageerror', (e) => { if (!/Hydration|#418/.test(e.message)) p.errs.push(e.message.slice(0, 160)); });
  await p.goto(URL + '/');
  const s = JSON.parse(JSON.stringify(base));
  s.pending = null;
  if (char) Object.assign(s.char, { lifeNo: 6 }, char);
  await p.evaluate(([s, m, v, hasChar]) => {
    localStorage.clear();
    localStorage.setItem('vkl.tut', '1');
    localStorage.setItem('vkl.seenVer', v);
    localStorage.setItem('vkl.notice.down1101', '1');
    localStorage.setItem('vkl.hints', JSON.stringify(['choice', 'speed', 'focus', 'stats', 'shop']));
    localStorage.setItem('vkl.camnang', JSON.stringify(['mot_kiep', 'canh_gioi', 'nga_re', 'tong_mon', 'danh_nhau', 'phi_thang', 'luan_hoi']));
    if (hasChar) localStorage.setItem('vkl.save', JSON.stringify(s));
    localStorage.setItem('vkl.meta', JSON.stringify(m));
  }, [s, m, VER, !!char]);
  await p.goto(URL + url);
  await p.waitForTimeout(5000);
  await p.addStyleTag({ content: 'nextjs-portal{display:none!important}' });
  return p;
}
(async () => {
  const b = await chromium.launch();
  // A. Trang chủ: thẻ chân thân, không còn dòng Thất Nhật Lục
  let p = await open(b, '/', meta([1, 2, 3]));
  ok(await p.locator('.ct-home').count() === 1, 'trang chủ có thẻ Chân thân');
  ok(await p.locator('.ct-home .hb-dot.lit').count() === 3, 'thẻ có 3 huyệt sáng');
  ok(/Mệnh Môn/.test(await p.locator('.ct-home').innerText()), 'thẻ ghi thử thách huyệt kế (Mệnh Môn)');
  ok(/Đang hưởng/.test(await p.locator('.ct-home').innerText()), 'thẻ ghi lợi ích đang hưởng');
  const cardY = (await p.locator('.ct-home').boundingBox()).y, arenaY = (await p.locator('.home-menu').boundingBox()).y;
  ok(cardY < arenaY, 'thẻ nằm trên nút Lôi đài');
  ok(await p.locator('.wk-line:not(.gio-line)').count() === 0, 'không còn dòng Thất Nhật Lục ở trang chủ');
  await shot(p, '1-trang-chu');
  await p.locator('.ct-home').click();
  await p.waitForURL(/chan-than/, { timeout: 8000 }).catch(() => {});
  await p.waitForTimeout(3000);
  ok(/chan-than/.test(p.url()), 'chạm thẻ mở /chan-than');
  ok(!p.errs.length, 'trang chủ không lỗi ' + p.errs.join(' | '));
  await p.close();

  // B. Trang chân thân: bảng Tam Tài 3 tab, tủ ngoại trang
  p = await open(b, '/chan-than', meta([1, 2, 3, 4, 5, 6, 7]));
  ok(await p.locator('.ct-big .hb-dot.lit').count() === 7, 'chân thân lớn có 7 huyệt sáng');
  ok(await p.locator('.ttai-row').count() === 10, 'tab Thân có 10 huyệt');
  ok(await p.locator('.ttai-row.next').count() === 1 && /Thiên Đột/.test(await p.locator('.ttai-row.next').innerText()), 'huyệt kế là Thiên Đột');
  await shot(p, '2-chan-than');
  await p.locator('.ttai-board .ct-tab').nth(1).click();
  ok(await p.locator('.ttai-hanh').count() === 5, 'tab Khí có 5 hành');
  ok(await p.locator('.ttai-tierbox.on').count() === 3, 'Kim 2 tầng + Thủy 1 tầng sáng');
  await p.locator('.ttai-board').screenshot({ path: DIR ? path.join(DIR, '3-tab-khi.png') : undefined });
  await p.locator('.ttai-board .ct-tab').nth(2).click();
  ok(await p.locator('.ttai-coi').count() === 3, 'tab Đạo có 3 cõi');
  ok(await p.locator('.ttai-coi li').count() === 27, 'đủ 27 đạo');
  ok(await p.locator('.ttai-coi li b', { hasText: /^\?$/ }).count() === 4, 'đạo ẩn chưa ngộ để "?"');
  await p.locator('.ttai-board').screenshot({ path: DIR ? path.join(DIR, '4-tab-dao.png') : undefined });
  ok(await p.locator('.ttai-ward-cell').count() === 11, 'tủ ngoại trang 11 ô');
  ok(await p.locator('button.ttai-ward-cell').count() === 3, 'mở 3 bộ (Kim bào, Tiên y, Đạo bào Chứng Đạo)');
  ok(/Cách mở/.test(await p.locator('.ttai-ward-cell.lock').first().innerText()), 'ô khóa ghi cách mở');
  await p.locator('button.ttai-ward-cell').first().click();
  await p.waitForTimeout(500);
  ok(/Đang mặc/.test(await p.locator('button.ttai-ward-cell').first().innerText()), 'mặc được ngoại trang thưởng');
  await p.locator('.ttai-ward').screenshot({ path: DIR ? path.join(DIR, '5-tu-ngoai-trang.png') : undefined });
  ok(await p.locator('button', { hasText: 'Khoe chân thân' }).count() === 1, 'có nút Khoe chân thân');
  ok(!p.errs.length, 'trang chân thân không lỗi ' + p.errs.join(' | '));
  await p.close();

  // C. Trong kiếp: chip thử thách, đạt thì vàng và báo một dòng
  p = await open(b, '/choi', meta([1]), { dead: false, age: 40, lifespan: 300 });
  ok(await p.locator('.hy-chip').count() === 1 && /Quan Nguyên: sống qua 60 tuổi/.test(await p.locator('.hy-chip').innerText()), 'chip ghi "Huyệt Quan Nguyên: sống qua 60 tuổi"');
  ok(await p.locator('.hy-chip.rung').count() === 0, 'chưa đạt thì chip chưa vàng');
  await shot(p, '6-chip');
  await p.locator('.hy-chip').click();
  await p.waitForTimeout(600);
  ok(await p.locator('.ttai-sheet').count() === 1, 'chạm chip mở bảng Tam Tài');
  await shot(p, '7-bang-trong-kiep');
  await p.close();
  p = await open(b, '/choi', meta([1]), { dead: false, age: 61, lifespan: 300 });
  ok(await p.locator('.hy-chip.rung').count() === 1, 'đạt thử thách thì chip chuyển vàng');
  ok(/Kiếp này đã đủ khai huyệt Quan Nguyên/.test(await p.locator('.game-scroll').innerText()), 'có dòng báo "Kiếp này đã đủ khai huyệt Quan Nguyên"');
  await shot(p, '8-chip-vang');
  ok(!p.errs.length, 'trong kiếp không lỗi ' + p.errs.join(' | '));
  await p.close();

  // D. Màn cáo biệt: chân thân, huyệt vừa khai chớp, lợi ích, huyệt kế; lập bia xong có dòng Tam Tài
  p = await open(b, '/choi', meta([1]), { dead: true, age: 66, lifespan: 66, cause: 'Thọ tận.', realm: 3 });
  ok(await p.locator('.ct-farewell').count() === 1, 'màn cáo biệt có chân thân');
  ok(await p.locator('.ct-farewell .hb-dot.flash').count() === 1, 'huyệt vừa khai to và chớp');
  const fw = await p.locator('.ct-farewell').innerText();
  ok(/Huyệt Quan Nguyên khai: sức khỏe khởi đầu \+2 từ kiếp sau/.test(fw), 'dòng lợi ích "Huyệt Quan Nguyên khai: sức khỏe khởi đầu +2 từ kiếp sau"');
  ok(/Huyệt kế: Khí Hải/.test(fw), 'ghi thử thách huyệt kế');
  await p.locator('.ct-farewell').evaluate((e) => e.scrollIntoView({ block: 'center' }));
  await p.waitForTimeout(4500);
  if (DIR) await p.locator('.ct-farewell').screenshot({ path: path.join(DIR, '9-cao-biet.png') });
  await p.locator('button', { hasText: 'Lập bia và luân hồi' }).click();
  await p.waitForTimeout(4000);
  for (let i = 0; i < 3 && (await p.locator('.ss-x').count()); i++) await p.locator('.ss-x').first().click().catch(() => {}), await p.waitForTimeout(400);
  ok(await p.locator('.ttai-line').count() === 1 && /Tam Tài \d+\/42/.test(await p.locator('.ttai-line').innerText()), 'màn đầu thai có dòng "Tam Tài n/42"');
  const saved = await p.evaluate(() => JSON.parse(localStorage.getItem('vkl.meta')).huyet.map((x) => x.id).join(','));
  ok(saved === '1,2', 'hồ sơ ghi huyệt 2 sau khi lập bia (' + saved + ')');
  await p.locator('.ttai-line').click();
  await p.waitForTimeout(600);
  ok(await p.locator('.ttai-sheet').count() === 1, 'chạm dòng Tam Tài mở bảng');
  await shot(p, '10-dau-thai');
  ok(!p.errs.length, 'cáo biệt không lỗi ' + p.errs.join(' | '));
  await p.close();

  // E. Kiếp không khai: chỉ nhắc thử thách đang chờ
  p = await open(b, '/choi', meta([1]), { dead: true, age: 50, lifespan: 50, cause: 'Thọ tận.', realm: 3 });
  ok(/Mộng này chưa đủ. Huyệt Quan Nguyên vẫn đợi: sống qua 60 tuổi./.test(await p.locator('.ct-farewell').innerText()), 'kiếp không khai chỉ hiện câu đợi');
  ok(await p.locator('.ct-farewell .hb-dot.flash').count() === 0, 'không có huyệt chớp');
  await p.close();

  // F. Khai huyệt 10: cảnh Chân thân thức tỉnh
  p = await open(b, '/choi', meta([1, 2, 3, 4, 5, 6, 7, 8, 9]), { dead: true, age: 500, lifespan: 500, cause: 'Chứng đạo.', realm: 9, endTag: 'chung_dao', cdAge: 480, ascended: true });
  ok(/Trăm mạch quy về một đỉnh/.test(await p.locator('.ct-farewell').innerText()), 'cáo biệt có câu khai Bách Hội');
  await p.locator('button', { hasText: 'Lập bia và luân hồi' }).click();
  await p.waitForTimeout(4000);
  ok(await p.locator('.ttai-wake').count() === 1, 'mở cảnh Chân thân thức tỉnh');
  await shot(p, '11-thuc-tinh-1');
  await p.locator('.ttai-wake .ct-scene').click();
  await p.waitForTimeout(5600);
  ok(/Mười tiếng chuông/.test(await p.locator('.ttai-wake').innerText()), 'nhịp 2: "Mười tiếng chuông."');
  await shot(p, '12-thuc-tinh-2');
  await p.locator('.ttai-wake .ct-scene').click();
  await p.waitForTimeout(700);
  ok(/Lần này, người tỉnh dậy là ngươi/.test(await p.locator('.ttai-wake').innerText()), 'nhịp 3');
  await p.locator('.ttai-wake .ct-scene').click();
  await p.waitForTimeout(900);
  ok(/Khai Mạch/.test(await p.locator('.ttai-wake').innerText()), 'nhịp 4: "Khai Mạch."');
  await shot(p, '13-thuc-tinh-4');
  await p.locator('.ttai-wake .ct-scene').click();
  await p.waitForTimeout(500);
  ok(await p.locator('.ttai-wake').count() === 0, 'chạm hết thì đóng');
  ok(!p.errs.length, 'thức tỉnh không lỗi ' + p.errs.join(' | '));
  await p.close();
  await b.close();
  console.log(fail ? `HỎNG ${fail}` : 'TẤT CẢ OK');
  process.exit(fail ? 1 : 0);
})();
