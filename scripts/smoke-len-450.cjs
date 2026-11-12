// 13/11 (4.5.0 Ngày 4): thử trước khi bật Chân thân cho mọi người. Cờ bật mặc định từ bản này.
// Chạy: npx next dev -p 3314, rồi node scripts/smoke-len-450.cjs [thư mục ảnh]
// A. người mới (kiếp 1 xong -> cáo biệt -> Mộng Tỉnh -> tạo -> Tam Tài Đồ, huyệt 1 khai)
// B. người cũ 40 kiếp (trang đầu: Mộng Tỉnh, tạo, bắt đầu từ huyệt 1)
// C. kiếp đạt huyệt khó chỉ khai huyệt kế tiếp
// D. tên tục bị chặn   E. đổi tên lần hai trừ phúc
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
const meta = (extra = {}) => ({ phucDuyen: 50, nghiep: 0, lives: 5, talents: [], enemy: null, streak: { day: today, n: 1 }, checkin: today, career, achievements: ['phi_thang'], endings: { chung_dao: 1 }, ...extra });
let fail = 0;
const ok = (c, m) => { console.log((c ? 'OK  ' : 'HỎNG') + ' ' + m); if (!c) fail++; };
const shot = async (p, n) => DIR && p.screenshot({ path: path.join(DIR, n + '.png') });
const readMeta = (p) => p.evaluate(() => JSON.parse(localStorage.getItem('vkl.meta')));
async function open(b, url, m, char) {
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
  await p.route(/vkl_track|vkl_save/, (r) => r.fulfill({ status: 200, body: 'null', contentType: 'application/json' }));
  p.errs = [];
  p.on('pageerror', (e) => { if (!/Hydration|#418/.test(e.message)) p.errs.push(e.message.slice(0, 160)); });
  await p.goto(URL + '/');
  const s = JSON.parse(JSON.stringify(base));
  s.pending = null;
  if (char) Object.assign(s.char, char);
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
// chạm qua các khung của một cảnh (.ct-scene) cho tới khi cảnh đó đóng hoặc hết lượt
async function tapThrough(p, sel, max, shotName) {
  for (let i = 0; i < max && (await p.locator(sel).count()); i++) {
    if (shotName && DIR) await shot(p, `${shotName}-${i + 1}`);
    await p.locator(sel).first().click({ position: { x: 195, y: 420 } }).catch(() => {});
    await p.waitForTimeout(1600);
  }
}
(async () => {
  const b = await chromium.launch();

  // A. Người mới: kiếp 1 vừa khép (đã lên Nguyên Anh, đủ Dũng Tuyền)
  let p = await open(b, '/choi', meta({ lives: 0, achievements: [], endings: {}, career: undefined }), { dead: true, lifeNo: 1, age: 66, lifespan: 66, cause: 'Thọ tận.', realm: 3 });
  ok(await p.locator('.ct-farewell').count() === 0, 'người mới: cáo biệt kiếp 1 chưa có chân thân');
  await shot(p, 'A1-cao-biet-kiep-1');
  await p.locator('button', { hasText: 'Lập bia và luân hồi' }).click();
  await p.waitForTimeout(4000);
  ok(await p.locator('.ct-scene').count() === 1, 'người mới: lập bia xong mở Mộng Tỉnh');
  ok(/Chuông vang. Một giấc mộng vừa tan./.test(await p.locator('.ct-scene').innerText()), 'khung 1 "Chuông vang. Một giấc mộng vừa tan."');
  await tapThrough(p, '.ct-scene:not(.ct-tamtai)', 6, 'A2-mong-tinh');
  ok(await p.locator('.ct-create').count() === 1, 'hết Mộng Tỉnh thì sang màn tạo chân thân');
  ok(/Nhớ lại chân thân/.test(await p.locator('.ct-create').innerText()), 'tiêu đề "Nhớ lại chân thân"');
  await shot(p, 'A3-tao-chan-than');
  await p.locator('.ct-ok').click();
  let t0 = Date.now();
  await p.waitForSelector('.ct-tamtai', { timeout: 20000 }).catch(() => {});
  ok(await p.locator('.ct-tamtai').count() === 1, `định chân thân xong mở Tam Tài Đồ (${Date.now() - t0} ms)`);
  await tapThrough(p, '.ct-tamtai', 4, 'A4-tam-tai');
  const endTxt = (await p.locator('.ct-tamtai').count()) ? await p.locator('.ct-tamtai').innerText() : '';
  ok(/Gót chân đã chạm đất/.test(endTxt), 'khung kết: Dũng Tuyền khai ngay (câu khai huyệt 1)');
  await shot(p, 'A5-dung-tuyen-khai');
  await tapThrough(p, '.ct-tamtai', 3);
  let m = await readMeta(p);
  ok(m.chanThan && m.chanThan.name, 'hồ sơ có chân thân (' + (m.chanThan && m.chanThan.name) + ')');
  ok((m.huyet || []).map((x) => x.id).join(',') === '1', 'kiếp 1 lên Nguyên Anh: khai huyệt 1 (' + JSON.stringify(m.huyet) + ')');
  ok(await p.locator('.ttai-line').count() === 1, 'màn đầu thai có dòng Tam Tài');
  await shot(p, 'A6-dau-thai');
  ok(!p.errs.length, 'người mới không lỗi ' + p.errs.join(' | '));
  await p.close();

  // B. Người cũ 40 kiếp: vào trang đầu, bỏ qua Mộng Tỉnh, tạo, bắt đầu từ huyệt 1
  p = await open(b, '/', meta({ lives: 40 }));
  ok(await p.locator('.ct-scene').count() === 1, 'người cũ: trang đầu mở Mộng Tỉnh');
  await shot(p, 'B1-nguoi-cu-mong-tinh');
  await p.locator('.ct-skip').first().click();
  await p.waitForTimeout(1500);
  ok(await p.locator('.ct-create').count() === 1, 'bỏ qua Mộng Tỉnh thì vào màn tạo (không bỏ được màn tạo)');
  await p.locator('.ct-random').click();
  await p.waitForTimeout(500);
  await p.locator('.ct-ok').click();
  t0 = Date.now();
  await p.waitForSelector('.ct-tamtai', { timeout: 20000 }).catch(() => {});
  ok(await p.locator('.ct-tamtai').count() === 1, `người cũ: xem Tam Tài Đồ (${Date.now() - t0} ms)`);
  await tapThrough(p, '.ct-tamtai', 4);
  await shot(p, 'B2-nguoi-cu-dao-cu');
  await tapThrough(p, '.ct-tamtai', 3);
  await p.waitForTimeout(1000);
  m = await readMeta(p);
  ok(m.chanThan && !(m.huyet || []).length, 'người cũ: có chân thân, chưa huyệt nào (kiếp cũ không tính)');
  ok(await p.locator('.ct-home').count() === 1 && /Dũng Tuyền/.test(await p.locator('.ct-home').innerText()), 'thẻ trang đầu: huyệt kế là Dũng Tuyền');
  await shot(p, 'B3-the-trang-dau');
  ok(!p.errs.length, 'người cũ không lỗi ' + p.errs.join(' | '));
  await p.close();

  // C. Kiếp Chứng Đạo sớm khi mới có huyệt 1: chỉ khai huyệt 2
  p = await open(b, '/choi', meta({ chanThan: CT, huyet: [{ id: 1, life: 1 }] }), { dead: true, lifeNo: 6, age: 500, lifespan: 500, cause: 'Chứng đạo.', realm: 9, endTag: 'chung_dao', cdAge: 480, ascended: true });
  ok(/Huyệt Quan Nguyên khai/.test(await p.locator('.ct-farewell').innerText()), 'cáo biệt báo khai Quan Nguyên (huyệt kế), không phải Bách Hội');
  await p.locator('button', { hasText: 'Lập bia và luân hồi' }).click();
  await p.waitForTimeout(4000);
  m = await readMeta(p);
  ok((m.huyet || []).map((x) => x.id).join(',') === '1,2', 'chỉ thêm huyệt 2 (' + (m.huyet || []).map((x) => x.id) + ')');
  ok(await p.locator('.ttai-wake').count() === 0, 'không mở cảnh thức tỉnh');
  await p.close();

  // D. Tên tục bị chặn ở màn tạo
  p = await open(b, '/', meta({ lives: 3 }));
  await p.locator('.ct-skip').first().click();
  await p.waitForTimeout(1200);
  await p.locator('.ct-tab', { hasText: 'Pháp danh' }).click();
  await p.locator('.ct-name input').fill('Đít Me');
  await p.locator('.ct-ok').click();
  await p.waitForTimeout(2500);
  ok(/Tên này Thiên Đạo không nhận/.test(await p.locator('.ct-create').innerText()), 'tên tục bị chặn: "Tên này Thiên Đạo không nhận"');
  ok(await p.locator('.ct-tamtai').count() === 0, 'tên tục không đi tiếp được');
  await shot(p, 'D-ten-tuc');
  await p.close();

  // E. Đổi tên lần hai trừ 100 phúc
  p = await open(b, '/chan-than', meta({ phucDuyen: 150, chanThan: { ...CT, renamed: 1 }, huyet: [{ id: 1, life: 1 }] }));
  await p.locator('button', { hasText: 'Đổi pháp danh' }).click();
  await p.waitForTimeout(500);
  ok(/tốn 100 phúc duyên/.test(await p.locator('main').innerText()), 'ghi rõ đổi tên lần hai tốn 100 phúc');
  await p.locator('.ct-name input').fill('Thanh Phong');
  await shot(p, 'E-doi-ten');
  await p.locator('button.btn-dark').last().click();
  await p.waitForTimeout(2500);
  m = await readMeta(p);
  ok(m.chanThan.name === 'Thanh Phong' && m.phucDuyen === 50 && m.chanThan.renamed === 2, `đổi tên xong: ${m.chanThan.name}, phúc ${m.phucDuyen}, lần ${m.chanThan.renamed}`);
  ok(!p.errs.length, 'đổi tên không lỗi ' + p.errs.join(' | '));
  await p.close();

  await b.close();
  console.log(fail ? `HỎNG ${fail}` : 'TẤT CẢ OK');
  process.exit(fail ? 1 : 0);
})();
