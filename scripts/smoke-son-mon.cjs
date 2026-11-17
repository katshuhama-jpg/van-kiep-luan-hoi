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
        const dx = W * (0 + 2 / 2) - W * (1 + 0 / 2), dy = 1.5 * S * 2;
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
  await b.close();
  console.log(fail ? `${fail} lỗi` : 'Sạch');
  process.exit(fail ? 1 : 0);
})();
