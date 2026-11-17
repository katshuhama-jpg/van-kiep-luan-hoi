// 17/11 (4.6.0 Ngày 7): quay video ngắn 9:16 Sơn Môn bằng dữ liệu giả (?demo=, chỉ khi chạy dev). Gửi Tyler, không tự đăng.
// Chạy: npx next dev -p 3314, rồi node scripts/video-son-mon.cjs <thư mục ra>
const { chromium } = require('playwright');
const URL = process.env.SMOKE_URL || 'http://localhost:3314';
const OUT = process.argv[2] || '/tmp';
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 405, height: 720 }, recordVideo: { dir: OUT, size: { width: 405, height: 720 } } });
  const p = await ctx.newPage();
  const hide = () => p.addStyleTag({ content: 'nextjs-portal{display:none!important} .sm-top .sm-note{display:none!important}' }).catch(() => {});
  const go = async (q, ms = 2600) => { await p.goto(`${URL}/son-mon?${q}`); await p.locator('.sm-card, .sm-mon, .sm-map').first().waitFor({ timeout: 15000 }).catch(() => {}); await hide(); await p.waitForTimeout(ms); };
  // 1. danh sách môn, vào môn
  await go('demo=chua&m=list', 2200);
  await p.locator('.sm-mon .sm-btn', { hasText: 'Vào ngay' }).first().click().catch(() => {});
  await p.waitForTimeout(1500);
  await p.locator('.sm-sheet .sm-btn.main').click().catch(() => {});
  await p.waitForTimeout(1500);
  // 2. môn nhà: điểm danh, nhiệm vụ
  await go('demo=chu&m=mon', 1500);
  await p.locator('.sm-btn.main', { hasText: 'Điểm danh' }).first().scrollIntoViewIfNeeded().catch(() => {});
  await p.waitForTimeout(900);
  await p.locator('.sm-btn.main', { hasText: 'Điểm danh' }).first().click().catch(() => {});
  await p.waitForTimeout(1800);
  await p.mouse.wheel(0, 400); await p.waitForTimeout(1500);
  // 3. bản đồ
  await go('demo=chu&m=ban-do', 1500);
  const box = await p.locator('.sm-map').boundingBox();
  if (box) { await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await p.mouse.down(); await p.mouse.move(box.x + box.width / 2 - 90, box.y + box.height / 2 - 40, { steps: 20 }); await p.mouse.up(); }
  await p.waitForTimeout(1500);
  // 4. xuất chinh, 5. chiến sự (chiến báo)
  await go('demo=chu&m=xuat-chinh', 3000);
  await go('demo=chu&m=chien-su', 1500);
  await p.mouse.wheel(0, 500); await p.waitForTimeout(2000);
  await ctx.close(); await b.close();
})();
