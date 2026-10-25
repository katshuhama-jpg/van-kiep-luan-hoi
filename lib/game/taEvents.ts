import { addCult, dao, fatal, giveItem, hurt, money, reward, stat } from './helpers';
import type { GameEvent } from './types';

/**
 * Sự kiện cho tà đạo: lựa chọn tà có thưởng lớn hơn, rủi ro không cao hơn lựa chọn chính.
 * Thêm cách cho tà tu tự khống chế tâm ma (huyết tế).
 */
export const TA_EVENTS: GameEvent[] = [
  {
    id: 'ta_huyet_te',
    minRealm: 1,
    cooldown: 6,
    weight: 14,
    when: (c) => c.daoTam <= -20 && c.stats.tamMa >= 60,
    title: 'Tâm ma cuộn trào',
    text: (c) => `Tâm ma đã lên ${Math.round(c.stats.tamMa)}. Đêm nào cũng có giọng nói thì thầm trong đầu, mắt bạn đỏ ngầu. Ma đạo có cách trị tâm ma, nhưng cái giá luôn là máu.`,
    choices: () => [
      { label: 'Huyết tế bản thân', hint: 'tâm ma -35, sức khỏe -20', lean: 'ta', run: (c, ctx) => { stat(c, 'tamMa', -35); stat(c, 'sucKhoe', -20); ctx.fx('evil', 'Huyết tế'); return 'Bạn rạch tay, để máu chảy vào trận huyết tế. Giọng nói trong đầu im bặt.'; } },
      { label: 'Hút sinh khí một kẻ lạ', hint: 'tâm ma -30, đạo tâm -6, có thể bị truy sát', lean: 'ta', run: (c, ctx) => { stat(c, 'tamMa', -30); dao(c, -6); ctx.fx('evil', 'Hút sinh khí'); if (ctx.rnd() < 0.2) { const h = hurt(c, 18, ctx); return `Bạn hút cạn sinh khí một tên lữ khách. Người nhà hắn kéo đến báo thù, bạn đánh lui nhưng mang thương.${h}`; } return 'Một tên lữ khách ngã xuống bên đường. Tâm ma của bạn no nê, lặng đi như con thú vừa ăn.'; } },
      { label: 'Tĩnh tọa áp chế', hint: 'tâm ma -12, tu vi giảm', lean: 'trung', run: (c) => { stat(c, 'tamMa', -12); c.cultivation = Math.round(c.cultivation * 0.9); return 'Bạn ngồi suốt bảy ngày, dùng chân khí đè tâm ma xuống. Tu vi hao đi một ít.'; } },
    ],
  },
  {
    id: 'ta_ma_dien',
    minRealm: 1,
    once: true,
    weight: 6,
    title: 'Ma điển trong hang',
    text: () => 'Trong một hang đá ẩm thấp, bạn thấy bộ xương ôm chặt cuốn sách bọc da người. Trang đầu viết bằng máu: "Thiên Ma Giải Thể Đại Pháp".',
    choices: () => [
      { label: 'Luyện ngay tại chỗ', hint: 'tu vi tăng vọt, tâm ma +, đạo tâm -', lean: 'ta', run: (c, ctx) => { addCult(c, reward(c, 2.5)); stat(c, 'tamMa', 12); dao(c, -10); ctx.fx('evil', 'Ma công'); const f = fatal(c, ctx, 0.04, 'Ma công phản phệ ngay lần luyện đầu. Bạn hóa thành một bộ xương nữa trong hang.'); return `Ma khí tràn vào kinh mạch, tu vi bạn tăng vọt.${f ?? ''}`; } },
      { label: 'Mang nộp cho chính phái', hint: 'đạo tâm +, linh thạch', lean: 'chinh', run: (c, ctx) => { dao(c, 10); money(c, 200); stat(c, 'khiVan', 3); ctx.fx('coin', '+200'); return 'Chưởng môn chính phái cảm tạ, thưởng hai trăm linh thạch rồi đem sách đi đốt.'; } },
      { label: 'Đốt đi', hint: 'tâm cảnh +', lean: 'trung', run: (c) => { stat(c, 'tamCanh', 6); return 'Cuốn sách cháy rất lâu, khói đen bốc lên thành hình mặt người.'; } },
    ],
  },
  {
    id: 'ta_cuop_tieu',
    minAge: 16,
    cooldown: 12,
    weight: 6,
    title: 'Đoàn tiêu xa đi ngang',
    text: () => 'Một đoàn tiêu xa chở đầy hòm gỗ đi qua khe núi. Tiêu sư đầu đàn đã già, đám tiêu cục ngáp dài.',
    choices: () => [
      { label: 'Chặn đường cướp tiêu', hint: 'nhiều linh thạch, đạo tâm -, có thể bị thương', lean: 'ta', run: (c, ctx) => { const m = 300 + c.realm * 150; money(c, m); dao(c, -12); ctx.fx('coin', `+${m}`); if (ctx.rnd() < 0.2) return `Bạn cướp được ${m} linh thạch, nhưng lão tiêu sư liều mạng chém một đao.${hurt(c, 15, ctx)}`; return `Đám tiêu cục bỏ chạy tán loạn. Bạn mở hòm: ${m} linh thạch.`; } },
      { label: 'Xin đi hộ tống', hint: 'linh thạch, đạo tâm +, có thể bị thương', lean: 'chinh', run: (c, ctx) => { const m = 120 + c.realm * 60; money(c, m); dao(c, 6); ctx.fx('coin', `+${m}`); if (ctx.rnd() < 0.2) return `Dọc đường gặp sơn tặc, bạn đánh lui nhưng trúng một mũi tên. Tiêu cục trả công ${m} linh thạch.${hurt(c, 15, ctx)}`; return `Chuyến tiêu bình an. Tiêu cục trả công ${m} linh thạch.`; } },
      { label: 'Mặc kệ', lean: 'trung', run: () => 'Bạn nhìn đoàn xe khuất sau khe núi.' },
    ],
  },
  {
    id: 'ta_huyet_tri',
    minRealm: 2,
    once: true,
    weight: 5,
    title: 'Huyết trì cổ',
    text: () => 'Sâu trong lòng núi có một ao máu sôi sùng sục, xung quanh là xương của những kẻ từng ngâm mình ở đây. Huyết khí nồng đến mức đá cũng đỏ.',
    choices: () => [
      { label: 'Ngâm mình luyện huyết thể', hint: 'tu vi +, sức khỏe +, tâm ma +', lean: 'ta', run: (c, ctx) => { addCult(c, reward(c, 2)); stat(c, 'sucKhoe', 25); stat(c, 'tamMa', 10); dao(c, -8); ctx.fx('evil', 'Huyết thể'); return 'Máu trong ao chui vào từng lỗ chân lông. Khi bước ra, da bạn đỏ như son, gân cốt rắn như sắt.'; } },
      { label: 'Phong ấn huyết trì', hint: 'đạo tâm +, khí vận +', lean: 'chinh', run: (c) => { dao(c, 8); stat(c, 'khiVan', 5); return 'Bạn dùng ba ngày ba đêm bày trận phong ấn. Ao máu nguội dần rồi đông lại.'; } },
      { label: 'Lấy một bình máu rồi đi', hint: 'được Huyết Sát Đan', lean: 'trung', run: (c, ctx) => { c.pills.huyet_sat = (c.pills.huyet_sat ?? 0) + 2; ctx.fx('buy', '+2 Huyết Sát Đan'); return 'Bạn luyện bình máu thành hai viên Huyết Sát Đan.'; } },
    ],
  },
  {
    id: 'ta_quy_no',
    minRealm: 2,
    once: true,
    weight: 5,
    title: 'Oan hồn dưới gốc hòe',
    text: () => 'Dưới gốc hòe già, một oan hồn tóc dài khóc ri rỉ suốt đêm. Nó chưa siêu thoát được vì mối hận năm xưa.',
    choices: () => [
      { label: 'Luyện thành quỷ nô', hint: 'quỷ nô đỡ một lần chết, đạo tâm -', lean: 'ta', run: (c, ctx) => { c.oanHon = true; dao(c, -8); ctx.fx('evil', 'Quỷ nô'); return 'Bạn nhốt oan hồn vào hồ lô. Từ nay nó sẽ liều mạng che chở cho chủ một lần.'; } },
      { label: 'Siêu độ cho nó', hint: 'đạo tâm +, tâm ma -', lean: 'chinh', run: (c) => { dao(c, 8); stat(c, 'tamMa', -10); return 'Bạn tụng kinh suốt đêm. Gần sáng, oan hồn cúi đầu cảm tạ rồi tan vào sương.'; } },
      { label: 'Rời đi', lean: 'trung', run: () => 'Tiếng khóc đuổi theo bạn tới tận đầu làng.' },
    ],
  },
  {
    id: 'ta_ma_mon',
    minRealm: 1,
    once: true,
    weight: 6,
    when: (c) => c.daoTam <= -10,
    title: 'Ma môn chiêu mộ',
    text: () => 'Một kẻ đeo mặt nạ quỷ chặn đường, chìa ra lệnh bài đen: "Huyết Sát Môn để mắt tới ngươi lâu rồi. Gia nhập đi, thiên hạ sẽ là của chúng ta."',
    choices: () => [
      { label: 'Nhận lệnh bài', hint: 'Huyết Sát Bào, tu vi +, đạo tâm -', lean: 'ta', run: (c, ctx) => { giveItem(c, 'huyet_bao', false); addCult(c, reward(c, 1.5)); dao(c, -12); ctx.fx('evil', 'Huyết Sát Môn'); return 'Bạn nhận lệnh bài và một tấm Huyết Sát Bào. Từ nay ma môn là chỗ dựa của bạn.'; } },
      { label: 'Giả vờ nhận rồi tố giác', hint: 'đạo tâm +, có thể bị trả thù', lean: 'chinh', run: (c, ctx) => { dao(c, 10); money(c, 150); if (ctx.rnd() < 0.2) return `Chính phái phá được một phân đà ma môn nhờ bạn. Ma môn cho người ám sát, bạn thoát được nhưng bị thương.${hurt(c, 20, ctx)}`; return 'Chính phái phá được một phân đà ma môn nhờ bạn, thưởng một trăm năm mươi linh thạch.'; } },
      { label: 'Từ chối', lean: 'trung', run: () => 'Kẻ đeo mặt nạ cười khẩy rồi biến vào bóng tối.' },
    ],
  },
];
