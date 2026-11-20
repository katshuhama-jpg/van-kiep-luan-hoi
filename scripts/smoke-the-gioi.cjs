// Ngày 38 (20/11): thử kênh Thế giới trên khung 390x844 bằng máy chủ giả (giữ tin trong bộ nhớ, dùng chung cho 2 trình duyệt).
// Kiểm: nút Thế giới ở màn chơi, chấm đỏ, mở tấm trượt, gửi tin (ô nhiều dòng, đếm x/512), nhận tin của tài khoản thứ hai,
// tin hệ thống, báo xấu, người chưa liên kết thấy lý do thay ô nhập, nhịp hỏi máy chủ (8 giây khi mở, dừng khi tab ẩn),
// sự kiện đo wc_open/wc_send/wc_report, không tràn ngang, chữ ô nhập 16px, nút từ 44px.
// Chạy: npx next dev -p 3315, rồi SMOKE_URL=http://localhost:3315 node scripts/smoke-the-gioi.cjs [thư mục ảnh]
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const URL = process.env.SMOKE_URL || 'http://localhost:3314';
const DIR = process.argv[2] || process.env.SHOT;
const base = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/save.json'), 'utf8'));
const VER = (fs.readFileSync(path.join(__dirname, '../lib/releases.ts'), 'utf8').match(/v: '([0-9.]+)'/) || [])[1] || '';
const today = new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);
let fail = 0;
const ok = (c, m) => { console.log((c ? 'OK  ' : 'HỎNG') + ' ' + m); if (!c) fail++; };
const errs = [];

// ---- máy chủ giả ----
const NGUOI = {
  '00000000-0000-4000-8000-0000000000a1': { tk: 'thu', ten: 'Lý Thanh Vân', gg: true, ct: true, rn: 9, co: 'tien', p: 'kiem', mon: 'Thanh Vân Môn' },
  '00000000-0000-4000-8000-0000000000b2': { tk: 'ban', ten: 'Bạch Tố Tố', gg: true, ct: true, rn: 4, p: 'dan' },
  '00000000-0000-4000-8000-0000000000c3': { tk: 'moi', ten: 'Tiểu Ngưu', gg: false, ct: true, rn: 2, p: 'kiem' },
  '00000000-0000-4000-8000-0000000000d4': { tk: 'ban2', ten: 'Mộc Vũ', gg: true, ct: true, rn: 3, p: 'tran' },
};
const ago = (s) => new Date(Date.now() - s * 1000).toISOString();
let seq = 100;
const tin = [
  { id: 97, luc: ago(600), nd: 'Hàn Lập vừa phi thăng lần đầu.', nd_en: 'Han Li ascended for the first time.', he: true },
  { id: 98, luc: ago(400), nd: 'Có ai biết đánh Thiên Kiếp sao cho qua không?', tok: '00000000-0000-4000-8000-0000000000b2' },
  { id: 99, luc: ago(200), nd: 'Thanh Vân Môn đang tuyển đệ tử nhé', tok: '00000000-0000-4000-8000-0000000000d4' },
];
const bao = {};
const calls = [];
const track = [];
const rowOf = (t, me) => {
  if (t.he) return { id: t.id, luc: t.luc, nd: t.nd, nd_en: t.nd_en, he: true };
  const u = NGUOI[t.tok];
  return { id: t.id, luc: t.luc, nd: t.nd, ta: t.tok === me, ten: u.ten, rn: u.rn, co: u.co, p: u.p, mon: u.mon };
};
const quyen = (me) => (!NGUOI[me] ? 'WC_AUTH' : !NGUOI[me].ct ? 'WC_NO_CT' : !NGUOI[me].gg ? 'WC_NO_GG' : null);
function rpc(fn, a) {
  const me = a.p_token;
  if (fn === 'vkl_wc_list') {
    const ly = quyen(me);
    const x = tin.filter((t) => !t.an && t.id > (a.p_sau || 0)).slice(-50).map((t) => rowOf(t, me));
    return { tin: x, gui: !ly, ly, toi: null };
  }
  if (fn === 'vkl_wc_n') return tin.filter((t) => !t.an && t.id > (a.p_sau || 0) && t.tok !== me).length;
  if (fn === 'vkl_wc_send') {
    const ly = quyen(me);
    if (ly) return { err: ly };
    const nd = String(a.p_nd).replace(/https?:\/\/\S+/g, '[link ẩn]');
    if (nd.length > 512) return { err: 'WC_DAI' };
    const t = { id: ++seq, luc: new Date().toISOString(), nd, tok: me };
    tin.push(t);
    return rowOf(t, me);
  }
  if (fn === 'vkl_wc_report') {
    const ly = quyen(me);
    if (ly) return { err: ly };
    const t = tin.find((x) => x.id === a.p_id);
    if (!t || t.tok === me || t.he) return { err: 'WC_QUYEN' };
    (bao[t.id] = bao[t.id] || new Set()).add(me);
    const n = bao[t.id].size;
    if (n >= 3) t.an = true;
    return { so_bao: n, an: n >= 3, cam: false };
  }
  if (fn === 'vkl_me') {
    const u = NGUOI[me];
    return { username: u.tk, meta: { lives: 5, phucDuyen: 10, talents: [], nghiep: 0, enemy: null, checkin: today, streak: { day: today, n: 1 }, chanThan: { name: u.ten } }, state: null };
  }
  if (fn === 'vkl_security_status') return { google: !!NGUOI[me]?.gg, recovery: true, must_change: false, email: null };
  return null;
}

async function vao(b, tok, tag) {
  const ctx = await b.newContext({ viewport: { width: Number(process.env.VW) || 390, height: 844 } });
  await ctx.route('**/accounts.google.com/**', (r) => r.fulfill({ status: 200, contentType: 'application/javascript', body: 'window.google={accounts:{id:{initialize(){},renderButton(el){el.innerHTML="<div class=fake-gg>Google</div>"},cancel(){}}}}' }));
  await ctx.route('**/rest/v1/rpc/**', async (route) => {
    const fn = route.request().url().split('/rpc/')[1].split('?')[0];
    let a = {};
    try { a = JSON.parse(route.request().postData() || '{}'); } catch {}
    if (fn === 'vkl_track') {
      for (const e of [].concat(a.p_events || a.p_ev || a.events || a)) if (e && (e.kind || e.k)) track.push({ tag, kind: e.kind || e.k, data: e.data || e.d });
      return route.fulfill({ status: 200, contentType: 'application/json', body: 'null' });
    }
    calls.push({ tag, fn, t: Date.now(), a });
    const r = rpc(fn, a);
    if (r && r.err) return route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ code: 'P0001', message: r.err }) });
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(r) });
  });
  await ctx.route(/\/rest\/v1\/(?!rpc)/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  const s = JSON.parse(JSON.stringify(base));
  s.pending = null;
  Object.assign(s.char, { dead: false, lifeNo: 6 });
  s.t = Date.now();
  const u = NGUOI[tok];
  const meta = { phucDuyen: 5, nghiep: 0, lives: 5, talents: [], enemy: null, streak: { day: today, n: 1 }, checkin: today, chanThan: { name: u.ten } };
  await ctx.addInitScript(([s, m, v, tk, tok]) => {
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', '1');
    localStorage.setItem('vkl.session', JSON.stringify({ username: tk, token: tok }));
    localStorage.setItem('vkl.tut', '1');
    localStorage.setItem('vkl.seenVer', v);
    localStorage.setItem('vkl.notice.down1101', '1');
    localStorage.setItem('vkl.camnang', JSON.stringify(['mot_kiep', 'canh_gioi', 'nga_re', 'tong_mon', 'danh_nhau', 'phi_thang', 'luan_hoi']));
    for (const k of ['vkl.save.u.' + tk, 'vkl.save']) localStorage.setItem(k, JSON.stringify(s));
    for (const k of ['vkl.meta.u.' + tk, 'vkl.meta']) localStorage.setItem(k, JSON.stringify(m));
  }, [s, meta, VER, u.tk, tok]);
  const p = await ctx.newPage();
  p.on('pageerror', (e) => { if (!/Hydration|#418/.test(e.message)) errs.push(tag + ': ' + e.message.slice(0, 160)); });
  await p.goto(URL + '/choi');
  await p.locator('.wc-btn').waitFor({ timeout: 30000 }).catch(() => {});
  await p.addStyleTag({ content: 'nextjs-portal{display:none!important}' }).catch(() => {});
  return { ctx, p };
}
const shot = async (p, ten) => DIR && p.screenshot({ path: path.join(DIR, ten) });
const n = (tag, fn, t0 = 0) => calls.filter((c) => c.tag === tag && c.fn === fn && c.t >= t0).length;

(async () => {
  const b = await chromium.launch();
  const A = await vao(b, '00000000-0000-4000-8000-0000000000a1', 'A');
  const pa = A.p;
  ok(await pa.locator('.wc-btn').count() === 1, 'màn chơi có nút Thế giới');
  await pa.waitForTimeout(1500);
  ok(n('A', 'vkl_wc_n') === 1, 'tấm đóng: hỏi đếm tin mới một lần lúc vào (' + n('A', 'vkl_wc_n') + ')');
  ok(await pa.locator('.wc-btn .dot').count() === 1, 'có tin mới thì nút có chấm đỏ');
  ok(/tin mới/.test(await pa.locator('.wc-btn').getAttribute('aria-label')), 'nhãn nút đọc được số tin mới');
  ok(n('A', 'vkl_wc_list') === 0, 'chưa mở thì không tải danh sách tin');
  await shot(pa, 'wc-nut.png');

  // mở tấm trượt
  await pa.locator('.wc-btn').click();
  await pa.locator('.wc .sm-tin').first().waitFor({ timeout: 10000 });
  const tMo = Date.now();
  ok(await pa.locator('.sheet[aria-label="Thế giới"]').count() === 1, 'mở tấm trượt Thế giới');
  ok(await pa.locator('.wc-btn .dot').count() === 0, 'mở tấm thì chấm đỏ tắt');
  ok(await pa.locator('.wc .sm-tin').count() === 2 && await pa.locator('.wc .sm-tin-he').count() === 1, 'thấy 2 tin người và 1 tin hệ thống');
  ok(await pa.locator('.wc .sm-chat-log[role=log]').count() === 1, 'vùng tin role=log');
  ok((await pa.locator('.wc .sm-tin').first().textContent()).includes('Bạch Tố Tố') && (await pa.locator('.wc .sm-tin').first().textContent()).includes('Nguyên Anh'), 'tin kèm tên chân thân và cảnh giới cao nhất');
  ok((await pa.locator('.wc .wc-tin-phu').nth(1).textContent()).includes('Trận tu'), 'tin kèm con đường kiếp gần nhất');
  ok(await pa.$eval('.wc .sm-tin-he', (e) => getComputedStyle(e).fontStyle) === 'italic', 'tin hệ thống chữ nghiêng');
  ok(await pa.locator('.wc .sm-chat-nhanh .sm-chip').count() === 4, '4 câu nhanh');
  ok((await pa.locator('.wc .sm-chat-form .sm-note').textContent()).includes('0/512'), 'đếm ký tự 0/512');
  await shot(pa, 'wc-mo.png');

  // gửi tin nhiều dòng
  const viet = 'Chào cả thiên hạ\nmình mới phi thăng https://lua.example';
  await pa.fill('#wc-in', viet);
  ok((await pa.locator('.wc .sm-chat-form .sm-note').textContent()).includes(viet.length + '/512'), `đếm ký tự khi gõ (${viet.length}/512)`);
  ok(await pa.$eval('#wc-in', (e) => e.tagName) === 'TEXTAREA', 'ô nhập nhiều dòng');
  await pa.locator('.wc .sm-chat-form button[type=submit]').click();
  await pa.waitForTimeout(700);
  ok((await pa.locator('.wc .sm-tin.ta').last().textContent()).includes('[link ẩn]'), 'gửi tin, tin mình bên phải, link bị ẩn');
  ok(await pa.inputValue('#wc-in') === '', 'ô nhập trống sau khi gửi');
  await pa.locator('.wc .sm-chat-nhanh .sm-chip', { hasText: 'Có ai vừa phi thăng không?' }).click();
  await pa.waitForTimeout(700);
  ok(await pa.locator('.wc .sm-tin.ta').count() === 2, 'câu nhanh gửi được');
  const fs16 = await pa.$eval('#wc-in', (e) => parseFloat(getComputedStyle(e).fontSize));
  ok(fs16 >= 16, 'chữ ô nhập 16px: ' + fs16);
  const hBtn = await pa.$eval('.wc .sm-chat-form button[type=submit]', (e) => e.getBoundingClientRect().height);
  ok(hBtn >= 48, 'nút Gửi cao 48px: ' + hBtn);
  const nho = await pa.$$eval('.wc button, .sheet-head button', (bs) => bs.filter((x) => x.offsetParent && x.getBoundingClientRect().height < 44).map((x) => x.className + ':' + Math.round(x.getBoundingClientRect().height)));
  ok(nho.length === 0, 'mọi nút trong tấm cao từ 44px (' + nho.join(', ') + ')');
  const tran = await pa.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  ok(tran <= 0, 'không tràn ngang');
  const chu = await pa.$$eval('.wc *', (els) => els.filter((e) => e.childNodes.length && [...e.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim()) && parseFloat(getComputedStyle(e).fontSize) < 12).length);
  ok(chu === 0, 'chữ từ 12px trở lên (' + chu + ' chỗ nhỏ hơn)');
  await shot(pa, 'wc-gui.png');

  // tài khoản thứ hai gửi, A nhận trong 8 giây
  const B = await vao(b, '00000000-0000-4000-8000-0000000000b2', 'B');
  await B.p.locator('.wc-btn').click();
  await B.p.locator('#wc-in').waitFor({ timeout: 10000 });
  ok((await B.p.locator('.wc .sm-tin').allTextContents()).some((x) => x.includes('Chào cả thiên hạ')), 'tài khoản thứ hai thấy tin của A');
  await B.p.fill('#wc-in', 'Chúc mừng đạo hữu Lý Thanh Vân!');
  await B.p.locator('.wc .sm-chat-form button[type=submit]').click();
  await B.p.waitForTimeout(500);
  const t0 = Date.now();
  await pa.locator('.wc .sm-tin', { hasText: 'Chúc mừng đạo hữu' }).waitFor({ timeout: 12000 }).catch(() => {});
  ok(await pa.locator('.wc .sm-tin', { hasText: 'Chúc mừng đạo hữu' }).count() === 1, 'A nhận tin của B không cần tải lại (' + Math.round((Date.now() - t0) / 1000) + ' giây)');
  const nl = n('A', 'vkl_wc_list', tMo);
  const giay = (Date.now() - tMo) / 1000;
  ok(nl >= Math.max(1, Math.floor(giay / 8)) && nl <= Math.ceil(giay / 8) + 1, `tấm mở: hỏi tin 8 giây một lần (${nl} lần trong ${Math.round(giay)} giây)`);
  ok(n('A', 'vkl_wc_n', tMo) === 0, 'tấm mở thì không hỏi đếm riêng');
  ok(calls.every((c) => !/realtime|channel/.test(c.fn)), 'không dùng kênh realtime');

  // tab ẩn: dừng
  await pa.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); });
  const tAn = Date.now();
  await pa.waitForTimeout(17500);
  ok(n('A', 'vkl_wc_list', tAn) === 0, 'tab ẩn: dừng hỏi máy chủ');
  await pa.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => false }); document.dispatchEvent(new Event('visibilitychange')); });
  await pa.waitForTimeout(800);
  ok(n('A', 'vkl_wc_list', tAn) === 1, 'tab hiện lại: hỏi ngay một lần');

  // báo xấu: chạm tin của người khác
  await pa.locator('.wc .sm-tin:not(.ta) .sm-tin-b').first().click();
  ok(await pa.locator('.wc .sm-tin-act button', { hasText: 'Báo xấu' }).count() === 1, 'chạm tin người khác hiện nút Báo xấu');
  await shot(pa, 'wc-bao.png');
  await pa.locator('.wc .sm-tin-act button', { hasText: 'Báo xấu' }).click();
  await pa.waitForTimeout(500);
  ok(await pa.locator('.wc .sm-ok').count() === 1, 'báo xong có dòng xác nhận');
  await pa.locator('.wc .sm-tin.ta .sm-tin-b').first().click();
  ok(await pa.locator('.wc .sm-tin-act').count() === 0, 'tin của mình không có nút Báo xấu');

  // đóng tấm: chấm đỏ tắt
  const tDong = Date.now();
  await pa.locator('.sheet-head button').click();
  await pa.waitForTimeout(1500);
  ok(await pa.locator('.wc-btn .dot').count() === 0, 'đóng tấm: không còn chấm đỏ');
  ok(n('A', 'vkl_wc_n', tDong) === 0 && n('A', 'vkl_wc_list', tDong) === 0, 'đóng tấm: không hỏi máy chủ ngay (90 giây sau mới đếm)');
  await B.ctx.close();

  // người chưa liên kết: đọc được, ô nhập thay bằng lý do
  const C = await vao(b, '00000000-0000-4000-8000-0000000000c3', 'C');
  await C.p.locator('.wc-btn').click();
  await C.p.locator('.wc .sm-tin').first().waitFor({ timeout: 10000 });
  ok(await C.p.locator('.wc .sm-tin').count() >= 3, 'chưa liên kết vẫn đọc được tin');
  ok(await C.p.locator('#wc-in').count() === 0 && await C.p.locator('.wc .sm-chat-nhanh').count() === 0, 'chưa liên kết: không có ô nhập và câu nhanh');
  ok((await C.p.locator('.wc-khoa').textContent()).includes('Liên kết tài khoản để nói chuyện với thiên hạ'), 'chưa liên kết: ghi lý do ngay chỗ ô nhập');
  await C.p.locator('.wc .sm-tin:not(.ta) .sm-tin-b').first().click();
  ok(await C.p.locator('.wc .sm-tin-act').count() === 0, 'chưa liên kết: không báo xấu được');
  await shot(C.p, 'wc-chua-lien-ket.png');
  await C.p.locator('.wc-khoa button', { hasText: 'Liên kết Google' }).click();
  await C.p.waitForTimeout(800);
  ok(await C.p.locator('.sheet[aria-label="Thế giới"]').count() === 0, 'bấm Liên kết Google: đóng tấm, mở Bảo vệ tài khoản');
  await C.ctx.close();

  // sự kiện đo (gửi gom 15 giây một lần hoặc khi rời trang)
  await pa.evaluate(() => window.dispatchEvent(new Event('pagehide')));
  await pa.evaluate(() => { Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' }); document.dispatchEvent(new Event('visibilitychange')); });
  await pa.waitForTimeout(1500);
  const k = track.filter((x) => x.tag === 'A').map((x) => x.kind);
  ok(k.includes('wc_open') && k.includes('wc_send') && k.includes('wc_report'), 'ghi sự kiện wc_open, wc_send, wc_report (' + [...new Set(k.filter((x) => x.startsWith('wc')))].join(',') + ')');
  await A.ctx.close();

  ok(!errs.length, 'không lỗi JS ' + errs.join(' | ').slice(0, 300));
  await b.close();
  console.log(fail ? `\n${fail} mục HỎNG` : '\nTất cả OK');
  process.exit(fail ? 1 : 0);
})();
