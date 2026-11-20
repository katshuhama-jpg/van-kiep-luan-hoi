// 15/11 (4.6.0 Ngày 3-5): thử giao diện Sơn Môn bằng dữ liệu giả (?demo=, chỉ có khi chạy dev).
// Cần cờ bật: NEXT_PUBLIC_SON_MON=1 npx next dev -p 3320, rồi node scripts/smoke-son-mon.cjs [thư mục ảnh]
// Mỗi màn: chụp ảnh 390x844 (cả trang), kiểm không tràn ngang, nút cao từ 44px, chữ từ 12px, không lỗi trang.
const { chromium } = require('playwright');
const path = require('path');
const URL = process.env.SMOKE_URL || 'http://localhost:3320';
const DIR = process.argv[2];

const SCREENS = [
  ['00-khach', 'khach', 'mon'],
  ['00-chua-chan-than', 'noct', 'mon'],
  ['00-ky-chua-mo', 'chuamo', 'mon'],
  ['01-trong-ngay-dau', 'trong', 'list'],
  ['M1-danh-sach', 'chua', 'list'],
  ['M1-su-phu', 'su', 'list'],
  ['M1-nho-ky', 'trong', 'list&ky=9'],
  ['M3b-cho-ky-chu', 'cho', 'mon'],
  ['M2-lap-mon', 'du', 'lap'],
  ['M3-chon-o', 'du', 'chon-o'],
  ['M3b-cho-ky', 'cho', 'mon'],
  ['M4-mon-nha', 'chu', 'mon'],
  ['M5-ban-do', 'chu', 'ban-do'],
  ['M6-xuat-chinh', 'chu', 'xuat-chinh'],
  ['M7-chien-su', 'chu', 'chien-su'],
  ['M8-thanh-vien', 'chu', 'thanh-vien'],
  ['M9-ky', 'chu', 'ky'],
  ['M10-luc-chien', 'chu', 'luc-chien'],
  ['M11-luat', 'chua', 'luat'],
  ['M12-truyen-am', 'chu', 'chat'],
  ['M12-truyen-am-de', 'de', 'chat'],
  ['M4-de-tu', 'de', 'mon'],
  // Ngày 8a: Phần thưởng Kỷ (môn chủ hạng 2 Công, đệ tử chưa đủ 10 Công), bảng Công trong tab Thành viên
  ['M13-thuong', 'chu', 'thuong'],
  ['M13-thuong-de', 'de', 'thuong'],
  ['M13-thuong-chua', 'chua', 'thuong'],
];

// Ngày 10 + Ngày 30: chạm ô trên bản đồ (tâm là chính điện 1,0, phóng 1,25) rồi kiểm chữ phải có.
// hex: ô cần chạm; bam: nút bấm thêm sau khi chạm; co: chữ phải thấy trên màn.
const THEM = [
  { name: 'M5-linh-mach', vai: 'chu', m: 'ban-do', hex: [3, 1], co: /Linh Mạch: môn giữ được/ },
  { name: 'M5-yeu-thu', vai: 'chu', m: 'ban-do', hex: [3, 0], co: /Lực giữ của yêu thú/ },
  { name: 'M5-mach-yeu', vai: 'chu', m: 'ban-do', hex: [-1, 3], co: /Yêu thú canh mạch đất này/ },
  { name: 'M5-ngoai-dai', vai: 'chu', m: 'ban-do', hex: [1, -1], co: /yếu hơn 1\/3 môn ta/ },
  { name: 'M5-tim-mach', vai: 'chu', m: 'ban-do', hex: [2, 1], co: /Có Linh Mạch \(Tử Vân Mạch\)/ },
  { name: 'M5-bo-o', vai: 'chu', m: 'ban-do', hex: [1, 1], bam: /^Bỏ ô Tử Trúc Lâm$/, co: /Đất sẽ đứt mạch, mất thêm 1 ô: Lưu Ly Pha/ },
  { name: 'M5-bo-o-de', vai: 'de', m: 'ban-do', hex: [1, 1], khong: /Bỏ ô Tử Trúc Lâm/ },
  { name: 'M6-trong-thuong', vai: 'chu', m: 'xuat-chinh', co: /Trọng thương: Lực chiến -50%, hồi lúc 05:00/ },
  { name: 'M7-dut-mach', vai: 'chu', m: 'chien-su', co: /Đất đứt mạch, mất 1 ô: Thanh Trúc Khê[\s\S]*bỏ ô Vọng Hà Đình/ },
  { name: 'M8-trong-thuong', vai: 'chu', m: 'thanh-vien', co: /Trọng thương: Lực chiến -30%/ },
];

let fail = 0;
const ok = (c, m) => {
  console.log((c ? 'OK  ' : 'HỎNG') + ' ' + m);
  if (!c) fail++;
};

async function check(p, name) {
  const r = await p.evaluate(() => {
    const out = { overflow: document.documentElement.scrollWidth - window.innerWidth, smallBtn: [], smallText: [] };
    const vis = (el) => {
      const b = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      return b.width > 0 && b.height > 0 && s.visibility !== 'hidden' && s.display !== 'none';
    };
    document.querySelectorAll('main button, main a.sm-btn, main select, main .sm-chip').forEach((el) => {
      if (!vis(el) || el.closest('table')) return;
      const h = el.getBoundingClientRect().height;
      if (h < 43.5) out.smallBtn.push(`${(el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 30)} (${Math.round(h)}px)`);
    });
    document.querySelectorAll('main *').forEach((el) => {
      if (!vis(el) || el.closest('svg')) return;
      const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
      if (!own) return;
      const f = parseFloat(getComputedStyle(el).fontSize);
      if (f < 12) out.smallText.push(`${el.textContent.trim().slice(0, 30)} (${f}px)`);
    });
    return out;
  });
  ok(r.overflow <= 0, `${name}: không tràn ngang (${r.overflow}px)`);
  ok(r.smallBtn.length === 0, `${name}: nút cao từ 44px ${r.smallBtn.join('; ')}`);
  ok(r.smallText.length === 0, `${name}: chữ từ 12px ${r.smallText.slice(0, 5).join('; ')}`);
}

(async () => {
  const b = await chromium.launch();
  for (const [name, vai, m] of SCREENS) {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true });
    const p = await ctx.newPage();
    await p.route(/vkl_track/, (r) => r.fulfill({ status: 200, body: 'null', contentType: 'application/json' }));
    const errs = [];
    p.on('pageerror', (e) => {
      if (!/Hydration|#418/.test(e.message)) errs.push(e.message.slice(0, 160));
    });
    await p.goto(`${URL}/son-mon?demo=${vai}&m=${m}`);
    await p.waitForTimeout(1800);
    if (name === 'M3-chon-o') {
      // đi từ M2: chọn huy hiệu, bấm TIẾP, rồi chạm một ô trống gần tâm bản đồ
      await p.goto(`${URL}/son-mon?demo=${vai}&m=lap`);
      await p.waitForTimeout(1500);
      await p.getByRole('button', { name: /TIẾP/ }).click();
      await p.waitForTimeout(800);
      const box = await p.locator('.sm-map').boundingBox();
      if (box) await p.mouse.click(box.x + box.width / 2 - 41, box.y + box.height / 2);
      await p.waitForTimeout(300);
    }
    if (name === 'M5-ban-do') {
      // chạm ô địch kề lãnh thổ (Bích Thủy Hồ, q=0 r=2 khi tâm là ô chính điện q=1 r=0)
      const box = await p.locator('.sm-map').boundingBox();
      if (box) {
        const S = 24, W = Math.sqrt(3) * S;
        const Z = 1.25; // 18/11: bản đồ mặc định phóng 1,25
        const dx = (W * (0 + 2 / 2) - W * (1 + 0 / 2)) * Z, dy = 1.5 * S * 2 * Z;
        await p.mouse.click(box.x + box.width / 2 + dx, box.y + box.height / 2 + dy);
      }
      await p.waitForTimeout(300);
    }
    await p.addStyleTag({ content: 'nextjs-portal{display:none!important}' });
    await check(p, name);
    ok(errs.length === 0, `${name}: không lỗi trang ${errs.join(' | ')}`);
    if (DIR) await p.screenshot({ path: path.join(DIR, name + '.png'), fullPage: true });
    if (name === 'M5-ban-do') {
      // kéo bản đồ: vị trí phải giữ nguyên sau vài nhịp đồng hồ
      const tf = () => p.evaluate(() => document.querySelector('.sm-map svg').style.transform);
      await p.evaluate(() => document.querySelector('.sm-map').scrollIntoView({ block: 'start' }));
      const t0 = await tf();
      const box = await p.locator('.sm-map').boundingBox();
      await p.mouse.move(box.x + 100, box.y + 100);
      await p.mouse.down();
      await p.mouse.move(box.x + 160, box.y + 140, { steps: 5 });
      await p.mouse.up();
      await p.waitForTimeout(1500);
      const t1 = await tf();
      ok(t0 !== t1, `${name}: kéo bản đồ giữ vị trí (${t0} -> ${t1})`);
      await p.getByRole('button', { name: 'Về lãnh thổ' }).click();
      await p.waitForTimeout(200);
      ok((await tf()) === t0, `${name}: nút Về lãnh thổ về chỗ cũ`);
    }
    await ctx.close();
  }
  for (const t of THEM) {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true });
    const p = await ctx.newPage();
    await p.route(/vkl_track/, (r) => r.fulfill({ status: 200, body: 'null', contentType: 'application/json' }));
    const errs = [];
    p.on('pageerror', (e) => {
      if (!/Hydration|#418/.test(e.message)) errs.push(e.message.slice(0, 160));
    });
    await p.goto(`${URL}/son-mon?demo=${t.vai}&m=${t.m}`);
    await p.waitForTimeout(1800);
    if (t.hex) {
      const box = await p.locator('.sm-map').boundingBox();
      if (box) {
        const S = 24, W = Math.sqrt(3) * S, Z = 1.25;
        const [q, r] = t.hex;
        const dx = (W * (q + r / 2) - W * 1) * Z, dy = 1.5 * S * r * Z;
        await p.mouse.click(box.x + box.width / 2 + dx, box.y + box.height / 2 + dy);
      }
      await p.waitForTimeout(400);
    }
    if (t.bam) {
      await p.getByRole('button', { name: t.bam }).click();
      await p.waitForTimeout(300);
    }
    await p.addStyleTag({ content: 'nextjs-portal{display:none!important}' });
    await check(p, t.name);
    const chu = await p.evaluate(() => document.querySelector('main')?.innerText ?? '');
    if (t.co) ok(t.co.test(chu), `${t.name}: có chữ ${t.co}`);
    if (t.khong) ok(!t.khong.test(chu), `${t.name}: không có ${t.khong}`);
    ok(errs.length === 0, `${t.name}: không lỗi trang ${errs.join(' | ')}`);
    if (DIR) {
      await p.evaluate(() => document.querySelector('.sm-o-card, .sm-thuong-the')?.scrollIntoView({ block: 'center' }));
      await p.screenshot({ path: path.join(DIR, t.name + '.png'), fullPage: true });
    }
    await ctx.close();
  }
  await b.close();
  console.log(fail ? `${fail} lỗi` : 'Sạch');
  process.exit(fail ? 1 : 0);
})();
