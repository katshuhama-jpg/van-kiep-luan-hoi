import { DAO_LU, ITEMS, PATHS } from './data';
import { addCult, addPill, dao, fatal, giveItem, hasItem, hurt, luck, money, pick, reward, sample, stat, usePill } from './helpers';
import type { Character, Choice, GameEvent } from './types';
import { EVENTS2 } from './events2';


export const EVENTS: GameEvent[] = [
  // ---------------- Tuổi thơ: mỗi người một bộ lựa chọn khác nhau ----------------
  {
    id: 'thoi_noi',
    minAge: 0,
    maxAge: 2,
    once: true,
    weight: 50,
    title: 'Lễ thôi nôi',
    text: () => 'Cả nhà bày đồ vật ra chiếu. Bạn bò tới và chộp lấy...',
    choices: (_c, seed) =>
      sample<Choice>(seed, [
        { label: 'Cuốn sách cũ', lean: 'trung', run: (c) => { stat(c, 'ngoTinh', 8); return 'Bạn ôm cuốn sách không buông. Ông bà nói sau này hẳn là người đọc sách.'; } },
        { label: 'Thanh kiếm gỗ', lean: 'trung', run: (c) => { giveItem(c, 'moc_kiem'); stat(c, 'sucKhoe', 6); return 'Bạn vung kiếm gỗ trúng đầu chú họ. Cả nhà cười ầm.'; } },
        { label: 'Viên linh thạch', lean: 'trung', run: (c) => { money(c, 20); stat(c, 'khiVan', 4); return 'Bạn ngậm viên linh thạch vào miệng. Bà nội nói đứa này có tướng giàu.'; } },
        { label: 'Con rắn nhỏ lạc vào nhà', lean: 'ta', run: (c) => { dao(c, -4); stat(c, 'khiVan', 6); return 'Bạn bóp chặt con rắn tới khi nó bất động. Không ai dám nói gì.'; } },
        { label: 'Cây bút lông', lean: 'chinh', run: (c) => { stat(c, 'ngoTinh', 5); stat(c, 'tamCanh', 3); return 'Bạn quẹt mực lên mặt cả nhà. Ông đồ hàng xóm bảo nét bút có thần.'; } },
        { label: 'Con ấn ngọc của cha', lean: 'trung', run: (c) => { stat(c, 'khiVan', 8); return 'Bạn cầm ấn ngọc đập xuống chiếu. Thầy bói đi ngang qua giật mình nhìn lại.'; } },
        { label: 'Bình rượu của ông nội', lean: 'trung', run: (c) => { stat(c, 'sucKhoe', -4); stat(c, 'tamCanh', 6); return 'Bạn tu một ngụm rồi ngủ li bì hai ngày. Ông nội cười: "Có khí phách tửu tiên!"'; } },
        { label: 'Lá bùa vàng trên vách', lean: 'trung', run: (c) => { addCult(c, 6); return 'Lá bùa bốc cháy trong tay bạn mà không bỏng. Cả nhà sợ hãi.'; } },
        { label: 'Chiếc gương đồng', lean: 'trung', run: (c) => { stat(c, 'tamCanh', 5); return 'Bạn nhìn vào gương, cười khanh khách với chính mình cả buổi.'; } },
        { label: 'Cái bánh bao', lean: 'trung', run: (c) => { stat(c, 'sucKhoe', 8); return 'Bạn chọn ngay cái bánh bao. Người lớn thở dài, nhưng bạn lớn rất nhanh.'; } },
      ], 4),
  },
  {
    id: 'tuoi_tho',
    minAge: 5,
    maxAge: 10,
    once: true,
    weight: 30,
    title: 'Những ngày bé',
    text: () => 'Mùa hè năm ấy dài lê thê. Bạn dành phần lớn thời gian để...',
    choices: (_c, seed) =>
      sample<Choice>(seed, [
        { label: 'Học chữ với thầy đồ', lean: 'chinh', run: (c) => { stat(c, 'ngoTinh', 6); dao(c, 3); return 'Thầy đồ khen bạn chữ đẹp, đọc một hiểu mười.'; } },
        { label: 'Tập võ với ông lão đầu làng', lean: 'trung', run: (c) => { stat(c, 'sucKhoe', 10); return 'Ông lão dạy bạn mấy thế quyền. Người rắn rỏi hẳn ra.'; } },
        { label: 'Chăn trâu, nằm ngắm mây', lean: 'trung', run: (c) => { stat(c, 'tamCanh', 10); return 'Nằm trên lưng trâu nhìn mây trôi, lòng bạn tĩnh lặng lạ thường.'; } },
        { label: 'Đi trộm gà nhà hàng xóm', lean: 'ta', run: (c, ctx) => { dao(c, -6); if (ctx.rnd() < 0.5) { stat(c, 'khiVan', 5); return 'Bạn trộm được cả con gà béo. Không ai phát hiện.'; } stat(c, 'sucKhoe', -8); return 'Bị chó đuổi cắn một miếng, về nhà còn bị đòn.'; } },
        { label: 'Leo vách đá bắt tổ chim', lean: 'trung', run: (c, ctx) => { const f = fatal(c, ctx, 0.08, 'Bạn trượt tay rơi từ vách đá xuống. Năm ấy bạn mới lên bảy.'); if (c.dead) return 'Gần tới tổ chim rồi...' + f; stat(c, 'sucKhoe', 6); return 'Bạn mang về ba quả trứng chim, mẹ mắng nhưng vẫn luộc cho ăn.' + (f ?? ''); } },
        { label: 'Theo cha ra chợ bán hàng', lean: 'trung', run: (c) => { money(c, 15); return 'Bạn học được cách mặc cả. Cha khen đứa này có đầu óc buôn bán.'; } },
        { label: 'Nghe ông kể chuyện tiên nhân', lean: 'trung', run: (c) => { addCult(c, 5); stat(c, 'ngoTinh', 3); return 'Đêm nào bạn cũng mơ thấy mình bay trên mây.'; } },
        { label: 'Bắt nạt đứa bé hàng xóm', lean: 'ta', run: (c) => { dao(c, -5); stat(c, 'tamMa', 4); return 'Đứa bé khóc chạy về nhà. Bạn thấy mình oai lắm.'; } },
        { label: 'Giúp bà cụ mù gánh nước', lean: 'chinh', run: (c) => { dao(c, 6); stat(c, 'khiVan', 4); return 'Bà cụ sờ đầu bạn: "Đứa trẻ ngoan, trời sẽ thương con."'; } },
      ], 4),
  },
  {
    id: 'sot_dau',
    minAge: 1,
    maxAge: 8,
    once: true,
    weight: 14,
    title: 'Trận sốt đậu mùa',
    text: () => 'Làng có dịch đậu mùa. Bạn sốt mê man ba ngày, người nổi đầy mụn đỏ.',
    choices: (c) => [
      {
        label: 'Mời thầy lang giỏi nhất huyện',
        hint: c.linhThach >= 40 ? '-40 linh thạch' : 'nhà không đủ tiền',
        lean: 'trung',
        run: (c, ctx) => {
          if (c.linhThach >= 40) {
            money(c, -40);
            return 'Thầy lang bốc thuốc ba ngày, bạn qua cơn nguy kịch.';
          }
          const f = fatal(c, ctx, 0.35, `Nhà không đủ tiền mời thầy. Bạn mất vì đậu mùa năm ${Math.floor(c.age)} tuổi.`);
          if (c.dead) return 'Thầy lang lắc đầu bỏ đi...' + f;
          return 'Thầy lang không chịu tới. May sao bạn tự qua khỏi.' + (f ?? '');
        },
      },
      {
        label: 'Mẹ thức trắng đêm chườm khăn',
        lean: 'chinh',
        run: (c, ctx) => {
          const f = fatal(c, ctx, 0.15, 'Mẹ ôm bạn suốt bảy đêm, nhưng cơn sốt không dứt. Bạn ra đi trong vòng tay mẹ.');
          if (c.dead) return 'Đêm thứ bảy...' + f;
          stat(c, 'tamCanh', 6);
          return 'Sáng ngày thứ tám bạn mở mắt, thấy mẹ ngủ gục bên giường.' + (f ?? '');
        },
      },
      {
        label: 'Bà nội đem đi cúng thầy mo',
        lean: 'trung',
        run: (c, ctx) => {
          const f = fatal(c, ctx, 0.3, 'Thầy mo bắt uống nước bùa lẫn tro. Bạn không qua khỏi.');
          if (c.dead) return 'Khói hương nghi ngút...' + f;
          stat(c, 'khiVan', 5);
          return 'Không biết nhờ bùa hay nhờ trời, bạn khỏi bệnh.' + (f ?? '');
        },
      },
      {
        label: 'Cha cõng lên chùa xin thuốc',
        lean: 'chinh',
        run: (c, ctx) => {
          const f = fatal(c, ctx, 0.1, 'Đường lên chùa xa quá. Bạn trút hơi thở cuối trên lưng cha.');
          if (c.dead) return 'Cha chạy suốt đêm...' + f;
          dao(c, 4);
          return 'Sư cụ cho thuốc, còn xoa đầu bảo bạn có duệ căn.' + (f ?? '');
        },
      },
    ],
  },
  {
    id: 'gieng_co',
    minAge: 3,
    maxAge: 10,
    once: true,
    weight: 10,
    title: 'Trốn tìm',
    text: () => 'Lũ trẻ trong làng chơi trốn tìm. Bạn phải tìm chỗ trốn thật nhanh.',
    choices: (_c, seed) =>
      sample<Choice>(seed, [
        { label: 'Nhảy qua miệng giếng cổ', lean: 'trung', run: (c, ctx) => { const f = fatal(c, ctx, 0.15, 'Bạn trượt chân rơi xuống giếng cổ. Ba ngày sau người ta mới vớt được.'); if (c.dead) return 'Bạn lấy đà...' + f; stat(c, 'khiVan', 4); return 'Bạn nhảy qua ngon lành, không ai tìm ra.' + (f ?? ''); } },
        { label: 'Trèo lên ngọn cây đa', lean: 'trung', run: (c, ctx) => { const f = fatal(c, ctx, 0.08, 'Cành cây gãy. Bạn rơi xuống đất, không bao giờ tỉnh lại.'); if (c.dead) return 'Càng trèo càng cao...' + f; stat(c, 'sucKhoe', 4); return 'Bạn ngủ quên trên cây, cả làng đi tìm đến tối.' + (f ?? ''); } },
        { label: 'Trốn trong kho thóc', lean: 'trung', run: (c) => { stat(c, 'tamCanh', 3); return 'Bạn ngủ thiếp đi trong đống thóc ấm áp.'; } },
        { label: 'Trốn vào ngôi miếu hoang', lean: 'trung', run: (c, ctx) => { if (ctx.rnd() < 0.4) { addCult(c, 10); return 'Trong miếu có pho tượng phát sáng. Bạn chạm vào, người ấm lên lạ thường.'; } stat(c, 'tamMa', 5); return 'Trong miếu tối om, bạn sợ phát khóc.'; } },
        { label: 'Lén nhốt đứa bạn vào chuồng heo', lean: 'ta', run: (c) => { dao(c, -4); return 'Đứa bạn kêu la cả buổi chiều. Bạn cười đau cả bụng.'; } },
        { label: 'Bỏ cuộc, về nhà ăn cơm', lean: 'trung', run: (c) => { stat(c, 'sucKhoe', 3); return 'Mẹ nấu canh cua. Trò chơi gì cũng không bằng.'; } },
      ], 4),
  },
  {
    id: 'ke_la',
    minAge: 3,
    maxAge: 9,
    once: true,
    weight: 8,
    title: 'Người lạ cho kẹo',
    text: () => 'Một gã mặc áo xám đứng ở đầu ngõ, chìa ra gói kẹo mạch nha: "Theo chú, chú cho cả gói."',
    choices: () => [
      { label: 'Cầm kẹo, đi theo', lean: 'trung', run: (c, ctx) => { const f = fatal(c, ctx, 0.5, 'Bạn bị bắt cóc, bán sang biên ải. Không ai còn thấy bạn nữa.'); if (c.dead) return 'Gã dắt tay bạn đi xa dần...' + f; stat(c, 'khiVan', 5); return 'Đi được nửa đường thì gặp tuần binh. Gã bỏ chạy, bạn được đưa về nhà.' + (f ?? ''); } },
      { label: 'Lắc đầu, chạy về nhà', lean: 'chinh', run: (c) => { stat(c, 'tamCanh', 4); return 'Mẹ nghe chuyện, ôm bạn thật chặt.'; } },
      { label: 'Hét to gọi người lớn', lean: 'chinh', run: (c) => { dao(c, 5); stat(c, 'khiVan', 3); return 'Cả xóm chạy ra, bắt được tên buôn người. Quan phủ khen bạn.'; } },
      { label: 'Giật gói kẹo rồi bỏ chạy', lean: 'ta', run: (c, ctx) => { dao(c, -3); if (ctx.rnd() < 0.6) return 'Bạn chạy nhanh hơn hắn. Kẹo ngọt lắm.'; return 'Hắn tóm được cổ áo bạn, đánh cho một trận rồi bỏ đi.' + hurt(c, 15, ctx); } },
    ],
  },
  {
    id: 'song_lu',
    minAge: 6,
    maxAge: 14,
    once: true,
    weight: 10,
    title: 'Tắm sông',
    text: () => 'Trưa hè, lũ trẻ rủ nhau ra khúc sông đầu làng tắm. Nước năm nay chảy xiết.',
    choices: (_c, seed) =>
      sample<Choice>(seed, [
        { label: 'Thi lặn xem ai lâu nhất', lean: 'trung', run: (c, ctx) => { const f = fatal(c, ctx, 0.1, 'Bạn bị dòng xoáy kéo xuống. Khúc sông năm ấy cướp mất một đứa trẻ.'); if (c.dead) return 'Bạn hít một hơi thật sâu...' + f; stat(c, 'sucKhoe', 6); return 'Bạn thắng, lũ bạn phục sát đất.' + (f ?? ''); } },
        { label: 'Lao ra cứu đứa bạn đuối nước', lean: 'chinh', run: (c, ctx) => { dao(c, 10); const f = fatal(c, ctx, 0.15, 'Bạn cứu được bạn mình, nhưng kiệt sức và bị nước cuốn đi.'); if (c.dead) return 'Bạn bơi ra giữa dòng...' + f; stat(c, 'khiVan', 6); return 'Bạn kéo được bạn vào bờ. Nhà nó mang gà sang cảm ơn.' + (f ?? ''); } },
        { label: 'Ngồi trên bờ trông quần áo', lean: 'trung', run: (c) => { stat(c, 'tamCanh', 3); return 'Bạn ngồi trên bờ ngắm chuồn chuồn cả buổi trưa.'; } },
        { label: 'Đẩy thằng hay bắt nạt xuống chỗ sâu', lean: 'ta', run: (c, ctx) => { dao(c, -10); stat(c, 'tamMa', 8); if (ctx.rnd() < 0.3) { c.enemy = c.enemy ?? 'gia đình đứa trẻ chết đuối năm xưa'; return 'Nó không nổi lên nữa. Bạn đứng chết lặng.'; } return 'Nó uống no nước, từ đó sợ bạn một phép.'; } },
        { label: 'Bắt cá về cho mẹ', lean: 'trung', run: (c) => { money(c, 5); return 'Bạn bắt được con cá chép to. Mẹ nấu canh chua.'; } },
      ], 4),
  },
  {
    id: 'am_sat_the_gia',
    minAge: 4,
    maxAge: 14,
    once: true,
    weight: 25,
    when: (c) => c.originId === 'the_gia',
    title: 'Tranh đoạt trong thế gia',
    text: () => 'Chi trưởng Lâm gia sợ chi thứ có người tài tranh quyền. Nửa đêm, bạn nghe tiếng bước chân lạ ngoài cửa sổ.',
    choices: () => [
      { label: 'Trốn vào mật thất của cha', lean: 'trung', run: (c, ctx) => { const f = fatal(c, ctx, 0.15, 'Thích khách tìm ra mật thất. Bạn chết khi mới vài tuổi đầu.'); if (c.dead) return 'Bạn nín thở trong bóng tối...' + f; return 'Thích khách lục soát cả đêm không thấy. Từ đó bạn ngủ không yên.' + (f ?? ''); } },
      { label: 'Chạy sang báo cho cha', lean: 'chinh', run: (c, ctx) => { const f = fatal(c, ctx, 0.2, 'Một mũi phi tiêu tẩm độc trúng lưng khi bạn băng qua sân.'); if (c.dead) return 'Bạn chạy băng qua sân...' + f; dao(c, 4); return 'Cha kịp đánh lui thích khách. Gia tộc rúng động.' + (f ?? ''); } },
      { label: 'Giả vờ ngủ say', lean: 'trung', run: (c, ctx) => { const f = fatal(c, ctx, 0.35, 'Thích khách không cần biết bạn thức hay ngủ.'); if (c.dead) return 'Bạn nhắm mắt...' + f; stat(c, 'tamCanh', 8); return 'Hắn đứng nhìn bạn rất lâu, rồi lặng lẽ bỏ đi. Có lẽ hắn cũng có con.' + (f ?? ''); } },
      { label: 'Ném đèn dầu đốt luôn căn phòng', lean: 'ta', run: (c, ctx) => { dao(c, -6); const f = fatal(c, ctx, 0.12, 'Lửa lan quá nhanh, bạn không thoát ra được.'); if (c.dead) return 'Ngọn lửa bùng lên...' + f; c.enemy = c.enemy ?? 'chi trưởng Lâm gia'; return 'Thích khách chết cháy, bạn nhảy qua cửa sổ thoát thân.' + (f ?? ''); } },
    ],
  },
  {
    id: 'mat_mua',
    minAge: 3,
    maxAge: 13,
    once: true,
    weight: 14,
    when: (c) => c.originId === 'nong' || c.originId === 'co_nhi' || c.linhThach < 30,
    title: 'Năm mất mùa',
    text: () => 'Hạn hán cả năm, ruộng nứt nẻ. Nhà không còn hạt gạo nào.',
    choices: (_c, seed) =>
      sample<Choice>(seed, [
        { label: 'Đào rễ cây trên núi ăn', lean: 'trung', run: (c, ctx) => { const f = fatal(c, ctx, 0.12, 'Bạn ăn nhầm rễ cây độc. Cả nhà khóc ngất.'); if (c.dead) return 'Bạn nhai rễ cây đắng ngắt...' + f; stat(c, 'sucKhoe', -6); return 'Đắng, nhưng sống qua được mùa đói.' + (f ?? ''); } },
        { label: 'Theo mẹ đi ăn xin', lean: 'trung', run: (c) => { stat(c, 'tamMa', 4); stat(c, 'tamCanh', 4); return 'Bạn học được rằng lòng người có ấm có lạnh.'; } },
        { label: 'Lẻn vào kho lương nhà quan', lean: 'ta', run: (c, ctx) => { dao(c, -6); const f = fatal(c, ctx, 0.18, 'Bạn bị lính canh bắt được, đánh chết ngay trước cổng kho.'); if (c.dead) return 'Bạn chui qua lỗ chó...' + f; money(c, 10); return 'Bạn vác về được nửa bao gạo. Cả nhà sống qua mùa đông.' + (f ?? ''); } },
        { label: 'Xin làm đầy tớ cho địa chủ', lean: 'trung', run: (c) => { money(c, 15); stat(c, 'khiVan', -3); return 'Bạn được ăn no, nhưng ngày nào cũng bị roi vọt.'; } },
        { label: 'Nhường phần ăn cho em', lean: 'chinh', run: (c, ctx) => { dao(c, 8); const f = fatal(c, ctx, 0.1, 'Bạn nhường hết phần ăn, rồi gầy dần và không qua khỏi mùa đông ấy.'); if (c.dead) return 'Bạn bảo mình không đói...' + f; stat(c, 'tamCanh', 8); return 'Em bạn sống. Bạn cũng sống, gầy trơ xương.' + (f ?? ''); } },
      ], 4),
  },
  {
    id: 'chua_tuoi_tho',
    minAge: 5,
    maxAge: 12,
    once: true,
    weight: 25,
    when: (c) => c.originId === 'chua',
    title: 'Tiểu sa di',
    text: () => 'Bạn lớn lên trong chùa Vân Tịch. Mỗi sáng sư cụ bắt dậy từ canh tư.',
    choices: () => [
      { label: 'Chăm chỉ tụng kinh', lean: 'chinh', run: (c) => { dao(c, 8); stat(c, 'tamCanh', 8); return 'Bạn thuộc lòng cả bộ Kim Cương Kinh.'; } },
      { label: 'Trốn ra suối bắt cá', lean: 'trung', run: (c) => { stat(c, 'sucKhoe', 6); return 'Sư cụ biết hết, chỉ cười rồi phạt bạn quét sân.'; } },
      { label: 'Hỏi sư tổ về đạo trường sinh', lean: 'trung', run: (c) => { addCult(c, 12); stat(c, 'ngoTinh', 4); return 'Sư tổ im lặng hồi lâu, rồi dạy bạn một câu khẩu quyết.'; } },
      { label: 'Ăn vụng đồ cúng', lean: 'ta', run: (c) => { dao(c, -4); stat(c, 'sucKhoe', 4); return 'Xôi chè ngon tuyệt. Pho tượng Hộ Pháp như đang trừng mắt nhìn bạn.'; } },
    ],
  },
  {
    id: 'yeu_hoa_hinh',
    minAge: 3,
    maxAge: 12,
    once: true,
    weight: 25,
    when: (c) => c.race === 'yeu',
    title: 'Lần đầu hóa hình',
    text: () => 'Đêm trăng tròn, bạn thấy mình có thể biến thành hình người. Ngoài rừng có tiếng chó săn sủa.',
    choices: () => [
      { label: 'Hóa hình, xuống làng xem thử', lean: 'trung', run: (c, ctx) => { if (ctx.rnd() < 0.7) { stat(c, 'ngoTinh', 6); return 'Bạn lẫn vào chợ người, nếm được kẹo hồ lô lần đầu tiên.'; } return 'Cái đuôi lòi ra giữa chợ, bạn bị ném đá đuổi về rừng.' + hurt(c, 20, ctx); } },
      { label: 'Ra xem chó săn', lean: 'trung', run: (c, ctx) => { const f = fatal(c, ctx, 0.3, 'Thợ săn bắn trúng bạn. Bộ da yêu hồ được bán giá cao ở phường thị.'); if (c.dead) return 'Bạn rón rén lại gần...' + f; return 'Bạn chạy thoát, mất một nhúm lông đuôi.' + (f ?? ''); } },
      { label: 'Trốn sâu trong hang mẹ', lean: 'trung', run: (c) => { stat(c, 'tamCanh', 5); return 'Mẹ liếm đầu bạn, kể chuyện về Yêu Vương thời thượng cổ.'; } },
      { label: 'Cắn chết chó săn, hút tinh huyết', lean: 'ta', run: (c) => { dao(c, -8); addCult(c, 12); return 'Lần đầu nếm máu, yêu tính trong người bạn trỗi dậy.'; } },
    ],
  },
  {
    id: 'lac_rung',
    minAge: 4,
    maxAge: 12,
    once: true,
    weight: 8,
    title: 'Lạc trong rừng',
    text: () => 'Đi hái nấm, bạn lạc sâu trong rừng già. Trời tối dần, xa xa có tiếng hú.',
    choices: (_c, seed) =>
      sample<Choice>(seed, [
        { label: 'Đi theo đàn đom đóm', lean: 'trung', run: (c, ctx) => { if (ctx.rnd() < 0.5) { addCult(c, 15); return 'Đom đóm dẫn bạn tới một hồ nước phát sáng. Bạn uống một ngụm, người nhẹ bẫng.'; } return 'Đom đóm dẫn bạn ra tới bìa rừng. Cả làng đang đốt đuốc tìm.'; } },
        { label: 'Leo lên cây đợi trời sáng', lean: 'trung', run: (c) => { stat(c, 'tamCanh', 5); return 'Bạn ôm cành cây cả đêm, nghe sói đi qua dưới gốc.'; } },
        { label: 'Đi về phía tiếng hú', lean: 'trung', run: (c, ctx) => { const f = fatal(c, ctx, 0.4, 'Đó là bầy sói đói. Sáng hôm sau người ta chỉ tìm thấy chiếc dép nhỏ.'); if (c.dead) return 'Bạn tò mò đi tới...' + f; c.pet = true; return 'Hóa ra là một con sói con bị thương. Bạn băng bó cho nó, nó đi theo bạn về làng.' + (f ?? ''); } },
        { label: 'Gào khóc gọi cha mẹ', lean: 'trung', run: (c, ctx) => { if (ctx.rnd() < 0.7) return 'Cha nghe tiếng, tìm được bạn lúc nửa đêm.'; return 'Tiếng khóc dẫn tới một con hổ. May mà tiều phu bắn đuổi kịp.' + hurt(c, 25, ctx); } },
        { label: 'Đốt lửa ngồi chờ', lean: 'trung', run: (c, ctx) => { const f = fatal(c, ctx, 0.08, 'Lửa bén vào cỏ khô. Cháy rừng.'); if (c.dead) return 'Bạn nhóm lửa...' + f; return 'Ánh lửa giúp dân làng tìm thấy bạn.' + (f ?? ''); } },
      ], 4),
  },
  {
    id: 'bat_nat',
    minAge: 6,
    maxAge: 13,
    once: true,
    weight: 20,
    title: 'Bị bắt nạt',
    text: () => 'Thằng con trưởng thôn cùng đám bạn chặn bạn ở bờ ruộng, đòi bạn quỳ xuống.',
    choices: () => [
      { label: 'Lao vào đánh', lean: 'trung', run: (c, ctx) => { if (ctx.rnd() < 0.45) { stat(c, 'tamCanh', 6); return 'Bạn đánh cho cả đám chạy tán loạn. Từ đó không ai dám động.'; } return 'Bạn bị đánh bầm dập.' + hurt(c, 15, ctx); } },
      { label: 'Về mách người lớn', lean: 'chinh', run: (c) => { dao(c, 3); return 'Cha mẹ sang nói chuyện phải trái. Mọi chuyện êm xuôi.'; } },
      { label: 'Nhịn, đi đường vòng', lean: 'trung', run: (c) => { stat(c, 'tamCanh', 4); stat(c, 'tamMa', 4); return 'Bạn nhịn. Nhưng có gì đó cứ âm ỉ trong lòng.'; } },
      { label: 'Đêm đó đốt kho thóc nhà nó', lean: 'ta', run: (c) => { dao(c, -12); stat(c, 'tamMa', 8); stat(c, 'khiVan', 4); return 'Kho thóc cháy rụi. Bạn đứng xa nhìn ngọn lửa, thấy hả hê.'; } },
    ],
  },
  {
    id: 'tuyen_de_tu',
    minAge: 9,
    maxAge: 16,
    maxRealm: 1,
    once: true,
    weight: 80,
    when: (c) => c.originId !== 'yeu',
    title: 'Tông môn tuyển đệ tử',
    text: () => 'Tiên nhân cưỡi hạc hạ xuống trấn, nói rằng ba năm mới mở cửa thu nhận đệ tử một lần. Ma môn cũng lén cho người tới.',
    choices: () => [
      {
        label: 'Thử vào Thanh Vân Tông',
        hint: 'chính phái, cần linh căn tốt',
        lean: 'chinh',
        run: (c, ctx) => {
          if (c.linhCanMul >= 0.8 || ctx.rnd() < 0.2) {
            c.sect = 'Thanh Vân Tông';
            dao(c, 10);
            addCult(c, 25);
            giveItem(c, 'thanh_sam');
            ctx.fx('buy', 'Nhập môn');
            return 'Đo linh căn đạt yêu cầu! Bạn trở thành đệ tử ngoại môn Thanh Vân Tông, được phát áo Thanh Sam.';
          }
          stat(c, 'tamMa', 10);
          return 'Linh căn quá kém, bị đuổi về giữa tiếng cười của người khác.';
        },
      },
      {
        label: 'Theo người của Huyết Sát Môn',
        hint: 'ma môn, không kén linh căn',
        lean: 'ta',
        run: (c, ctx) => {
          c.sect = 'Huyết Sát Môn';
          dao(c, -15);
          addCult(c, 35);
          stat(c, 'tamMa', 10);
          ctx.fx('evil', 'Nhập ma môn');
          return 'Ma môn không hỏi linh căn, chỉ hỏi bạn có dám uống chén máu kia không. Bạn uống cạn.';
        },
      },
      {
        label: 'Làm tán tu, tự học sách cũ',
        lean: 'trung',
        run: (c) => {
          addCult(c, 15);
          stat(c, 'ngoTinh', 5);
          stat(c, 'tamCanh', 4);
          return 'Bạn mua lại một cuốn công pháp rách ở chợ, tự mò mẫm con đường riêng.';
        },
      },
      {
        label: 'Ở nhà phụng dưỡng cha mẹ',
        lean: 'chinh',
        run: (c) => {
          dao(c, 6);
          money(c, 40);
          stat(c, 'tamCanh', 8);
          return 'Bạn chọn ở lại. Mẹ bạn khóc vì mừng.';
        },
      },
    ],
  },

  // ---------------- Kỳ ngộ thường gặp ----------------
  {
    id: 'lao_gia',
    minAge: 12,
    maxRealm: 4,
    cooldown: 30,
    weight: 12,
    title: 'Kỳ ngộ',
    text: () => 'Trong hang sau thác, bạn thấy một lão giả gầy gò bị thương, bên cạnh là chiếc hộp gỗ phát ánh tím.',
    choices: (c) => [
      {
        label: 'Cứu lão giả',
        hint: (c.pills.hoi_xuan ?? 0) > 0 ? '-1 Hồi Xuân Đan' : '-50 linh thạch thuốc men',
        lean: 'chinh',
        run: (c, ctx) => {
          if (!usePill(c, 'hoi_xuan')) money(c, -50);
          dao(c, 10);
          if (ctx.rnd() < luck(c, 0.6)) {
            addCult(c, reward(c, 0.6));
            stat(c, 'ngoTinh', 6);
            ctx.fx('layer', 'Được truyền công');
            return 'Lão giả là ẩn thế cao nhân. Ông truyền cho bạn một luồng chân khí rồi biến mất.';
          }
          return 'Lão giả tỉnh lại, cảm tạ rồi lặng lẽ rời đi. Lòng bạn thấy nhẹ nhõm.';
        },
      },
      {
        label: 'Lấy chiếc hộp rồi đi',
        lean: 'ta',
        run: (c, ctx) => {
          dao(c, -8);
          money(c, 120);
          addPill(c, 'tu_khi', 2);
          ctx.fx('coin', '+120');
          return 'Trong hộp có linh thạch và hai viên Tụ Khí Đan. Sau lưng, tiếng ho của lão giả nhỏ dần.';
        },
      },
      {
        label: 'Hỏi chuyện đổi lấy chỉ điểm',
        lean: 'trung',
        run: (c) => {
          stat(c, 'ngoTinh', 4);
          addCult(c, reward(c, 0.2));
          return 'Lão giả chỉ cho bạn một chỗ sai trong công pháp rồi đuổi bạn đi.';
        },
      },
      {
        label: 'Kết liễu lão, hút tu vi',
        hint: 'tà công',
        lean: 'ta',
        run: (c, ctx) => {
          dao(c, -20);
          const f = fatal(c, ctx, 0.12, 'Lão giả hồi quang phản chiếu, một chưởng đánh nát tâm mạch bạn. Bạn chết trong hang tối.');
          if (c.dead) return 'Bạn vừa đặt tay lên huyệt Bách Hội của lão...' + f;
          stat(c, 'tamMa', 14);
          addCult(c, reward(c, 0.9));
          ctx.fx('evil', 'Hút tu vi');
          c.enemy = c.enemy ?? 'đệ tử của lão giả trong hang';
          return 'Bạn hút sạch chân khí của lão. Tu vi tăng vọt, nhưng đêm nào cũng mơ thấy đôi mắt ấy.';
        },
      },
    ],
  },
  {
    id: 'bi_canh',
    minRealm: 1,
    cooldown: 25,
    weight: 10,
    title: 'Bí cảnh mở cửa',
    text: () => 'Một bí cảnh thượng cổ vừa mở. Tu sĩ khắp nơi đổ về, ai cũng muốn tranh phần.',
    choices: () => [
      {
        label: 'Xông vào tầng sâu nhất',
        hint: 'thưởng lớn, rủi ro lớn',
        lean: 'trung',
        run: (c, ctx) => {
          if (ctx.rnd() < luck(c, 0.42)) {
            addCult(c, reward(c, 1.1));
            money(c, 200 * (c.realm + 1));
            ctx.fx('layer', 'Đại cơ duyên');
            return 'Bạn đoạt được truyền thừa ở tầng cuối. Tu vi tăng vọt!';
          }
          const f = fatal(c, ctx, 0.25, 'Cấm chế thượng cổ bộc phát, nghiền bạn thành tro bụi giữa bí cảnh.');
          if (c.dead) return 'Bạn bước vào tầng cuối...' + f;
          return 'Cấm chế tầng sâu bộc phát, bạn trọng thương mới thoát ra được.' + (f ?? '') + hurt(c, 45, ctx);
        },
      },
      {
        label: 'Đi vòng ngoài nhặt nhạnh',
        lean: 'trung',
        run: (c) => {
          money(c, 60 * (c.realm + 1));
          addPill(c, 'tu_khi');
          return 'Bạn nhặt được ít thảo dược và linh thạch. Không nhiều, nhưng an toàn.';
        },
      },
      {
        label: 'Lập nhóm, chia đều chiến lợi phẩm',
        lean: 'chinh',
        run: (c, ctx) => {
          dao(c, 5);
          addCult(c, reward(c, 0.45));
          money(c, 90 * (c.realm + 1));
          ctx.fx('coin', 'Chia đều');
          return 'Cả nhóm hợp sức phá trận, chia nhau công bằng. Bạn có thêm vài người bạn tốt.';
        },
      },
      {
        label: 'Mai phục ở cửa ra, cướp đồ',
        lean: 'ta',
        run: (c, ctx) => {
          dao(c, -14);
          if (ctx.rnd() < luck(c, 0.6)) {
            money(c, 300 * (c.realm + 1));
            addCult(c, reward(c, 0.3));
            ctx.fx('coin', 'Cướp được');
            return 'Bạn hạ gục ba kẻ đi ra cuối cùng và lấy hết túi trữ vật của chúng.';
          }
          c.enemy = c.enemy ?? 'tông môn của kẻ bạn phục kích';
          return 'Kẻ bạn phục kích có trưởng bối hộ tống. Bạn bị đánh trọng thương.' + hurt(c, 40, ctx);
        },
      },
    ],
  },
  {
    id: 'cuop_duong',
    minRealm: 1,
    cooldown: 15,
    weight: 10,
    title: 'Chặn đường',
    text: () => 'Ba tên tán tu mặt mày hung tợn chặn đường, đòi bạn để lại túi trữ vật.',
    choices: (c) => [
      {
        label: 'Rút vũ khí ra đánh',
        lean: 'trung',
        run: (c, ctx) => {
          const bonus = hasItem(c, 'thanh_phong') || hasItem(c, 'huyet_dao') || c.path === 'kiem' ? 0.2 : 0;
          if (ctx.rnd() < luck(c, 0.5 + bonus)) {
            money(c, 80 * (c.realm + 1));
            stat(c, 'tamCanh', 3);
            return 'Bạn đánh lui cả ba, còn thu được túi của chúng.';
          }
          const f = fatal(c, ctx, 0.15, 'Một nhát đao chém ngang cổ. Bạn chết bên vệ đường, túi trữ vật bị lột sạch.');
          if (c.dead) return 'Ba đánh một...' + f;
          money(c, -c.linhThach * 0.4);
          return 'Bạn thua, bị lột sạch gần nửa gia tài.' + (f ?? '') + hurt(c, 25, ctx);
        },
      },
      { label: 'Nộp tiền mua bình an', hint: `-${Math.round(c.linhThach * 0.3)} linh thạch`, lean: 'trung', run: (c) => { money(c, -c.linhThach * 0.3); stat(c, 'tamMa', 4); return 'Bạn ném túi linh thạch ra. Chúng cười khẩy rồi bỏ đi.'; } },
      { label: 'Bỏ chạy', lean: 'trung', run: (c, ctx) => { if (ctx.rnd() < luck(c, 0.65)) return 'Bạn thi triển thân pháp chạy thoát.'; return 'Chạy không kịp, ăn trọn một chưởng sau lưng.' + hurt(c, 18, ctx); } },
      {
        label: 'Giả hàng, dụ vào bẫy giết sạch',
        lean: 'ta',
        run: (c, ctx) => {
          dao(c, -10);
          stat(c, 'tamMa', 6);
          money(c, 150 * (c.realm + 1));
          ctx.fx('evil', 'Giết sạch');
          return 'Bạn quỳ xuống van xin, đợi chúng lại gần rồi kích nổ phù chú. Không ai sống sót.';
        },
      },
    ],
  },
  {
    id: 'dao_lu',
    minAge: 16,
    weight: 8,
    cooldown: 20,
    when: (c) => !c.partner,
    title: 'Hữu duyên gặp gỡ',
    text: (c) => `Bên hồ sen, bạn gặp ${pick(Math.random, DAO_LU)}. Hai người trò chuyện từ chiều đến tận khi trăng lên.`,
    choices: () => [
      {
        label: 'Ngỏ lời kết làm đạo lữ',
        lean: 'chinh',
        run: (c, ctx) => {
          if (ctx.rnd() < luck(c, 0.55)) {
            c.partner = pick(ctx.rnd, DAO_LU);
            stat(c, 'tamCanh', 12);
            dao(c, 4);
            ctx.fx('love', 'Kết đạo lữ');
            return `Người ấy gật đầu. Từ nay bạn và ${c.partner} cùng nhau tu đạo.`;
          }
          stat(c, 'tamMa', 6);
          return 'Người ấy mỉm cười từ chối. Đêm đó bạn không ngủ được.';
        },
      },
      { label: 'Làm bạn đồng đạo', lean: 'trung', run: (c) => { stat(c, 'tamCanh', 6); stat(c, 'ngoTinh', 3); return 'Hai người hẹn gặp lại để luận đạo. Bạn thấy đầu óc sáng ra.'; } },
      { label: 'Từ chối, chuyên tâm tu luyện', lean: 'trung', run: (c) => { addCult(c, reward(c, 0.2)); return 'Bạn lặng lẽ rời đi. Đại đạo không chỗ cho hồng trần.'; } },
      {
        label: 'Lợi dụng song tu, hút công lực',
        lean: 'ta',
        run: (c, ctx) => {
          dao(c, -16);
          const f = fatal(c, ctx, 0.12, 'Đối phương là truyền nhân Hợp Hoan Tông, cao tay hơn bạn. Sáng hôm sau người ta thấy một cái xác khô.');
          if (c.dead) return 'Đêm đó...' + f;
          stat(c, 'tamMa', 10);
          addCult(c, reward(c, 0.8));
          c.enemy = c.enemy ?? 'người từng bị bạn lợi dụng';
          ctx.fx('evil', 'Thái âm bổ dương');
          return 'Sáng hôm sau, người ấy tỉnh dậy với kinh mạch đứt đoạn. Bạn đã đi xa.';
        },
      },
    ],
  },
  {
    id: 'tam_ma',
    minRealm: 1,
    weight: 14,
    cooldown: 10,
    when: (c) => c.stats.tamMa >= 45,
    title: 'Tâm ma quấy nhiễu',
    text: () => 'Đang tĩnh tọa, bạn nghe thấy giọng nói của chính mình thì thầm: "Sao phải khổ thế? Buông ra đi..."',
    choices: (c) => [
      { label: 'Đối mặt, trảm tâm ma', lean: 'chinh', run: (c, ctx) => { if (ctx.rnd() < 0.35 + c.stats.tamCanh / 200) { stat(c, 'tamMa', -30); stat(c, 'tamCanh', 10); ctx.fx('heal', 'Tâm sáng'); return 'Bạn nhìn thẳng vào nó. Nó tan biến như sương sớm.'; } stat(c, 'tamMa', 8); return 'Tâm ma mạnh hơn bạn nghĩ. Bạn nôn ra một ngụm máu.' + hurt(c, 15, ctx); } },
      { label: 'Uống Thanh Tâm Đan', hint: (c.pills.thanh_tam ?? 0) > 0 ? `còn ${c.pills.thanh_tam}` : 'không có, mua gấp -150', lean: 'trung', run: (c, ctx) => { if (!usePill(c, 'thanh_tam')) money(c, -150); stat(c, 'tamMa', -25); ctx.fx('heal', 'Thanh tâm'); return 'Dược lực mát lạnh lan khắp người. Giọng nói kia im bặt.'; } },
      { label: 'Tìm chùa nghe kinh', lean: 'chinh', run: (c) => { dao(c, 8); stat(c, 'tamMa', -18); return 'Bạn ở lại chùa Vân Tịch ba tháng. Tiếng chuông sớm làm lòng an.'; } },
      { label: 'Buông theo nó', hint: 'tu vi tăng, tâm ma tăng, nguy hiểm', lean: 'ta', run: (c, ctx) => { const f = fatal(c, ctx, 0.15, 'Chân khí nghịch hành, kinh mạch nổ tung. Bạn tẩu hỏa nhập ma mà chết.'); if (c.dead) return 'Bạn buông lỏng tâm thần...' + f; dao(c, -12); stat(c, 'tamMa', 15); addCult(c, reward(c, 0.7)); ctx.fx('evil', 'Nhập ma'); return 'Bạn mở mắt. Đồng tử đỏ rực. Sức mạnh chưa bao giờ đến dễ như vậy.'; } },
    ],
  },
  {
    id: 'tien_dan_gia',
    minAge: 14,
    weight: 8,
    cooldown: 20,
    title: 'Phường thị',
    text: () => 'Một ông lão bày sạp, rao bán "tiên đan trường sinh" chỉ với 100 linh thạch một viên.',
    choices: () => [
      { label: 'Mua một viên', hint: '-100', lean: 'trung', run: (c, ctx) => { money(c, -100); const f = fatal(c, ctx, 0.08, 'Viên đan là Hạc Đỉnh Hồng. Bạn thất khiếu chảy máu mà chết ngay giữa phường thị.'); if (c.dead) return 'Bạn nuốt viên đan...' + f; if (ctx.rnd() < 0.2) { c.lifespan += 15; ctx.fx('heal', '+15 thọ'); return 'Không ngờ là đan thật! Thọ nguyên tăng 15 năm.'; } return 'Viên đan là bột mì vo tròn. Bạn bị lừa.'; } },
      { label: 'Mặc cả xuống 20', lean: 'trung', run: (c) => { money(c, -20); stat(c, 'khiVan', 2); return 'Ông lão chửi bạn keo kiệt nhưng vẫn bán. Viên đan ăn khá ngon.'; } },
      { label: 'Vạch trần trước đám đông', lean: 'chinh', run: (c) => { dao(c, 6); stat(c, 'tamCanh', 4); money(c, 30); return 'Mọi người cảm ơn bạn, có người còn biếu bạn ít linh thạch.'; } },
      { label: 'Lừa lại lão, đổi linh thạch giả', lean: 'ta', run: (c) => { dao(c, -6); money(c, 80); return 'Bạn trả bằng linh thạch giả rồi chuồn. Kẻ lừa đảo bị lừa.'; } },
    ],
  },
  {
    id: 'yeu_thu_con',
    minAge: 12,
    weight: 8,
    once: true,
    title: 'Yêu thú nhỏ',
    text: () => 'Trong bụi rậm, một con hồ ly trắng bé xíu bị kẹp chân, rên ư ử nhìn bạn.',
    choices: () => [
      { label: 'Nhận nuôi', lean: 'chinh', run: (c, ctx) => { c.pet = true; dao(c, 6); stat(c, 'tamCanh', 6); ctx.fx('love', 'Có linh thú'); return 'Tiểu hồ ly liếm tay bạn. Từ đó nó đi theo bạn khắp nơi.'; } },
      { label: 'Gỡ bẫy rồi thả đi', lean: 'chinh', run: (c) => { dao(c, 4); stat(c, 'khiVan', 6); return 'Nó chạy mất, ngoái lại nhìn bạn một lần. Bạn có cảm giác sẽ gặp lại.'; } },
      { label: 'Bắt mang bán', lean: 'trung', run: (c) => { money(c, 90); dao(c, -3); return 'Thương nhân trả 90 linh thạch cho một con hồ ly trắng hiếm.'; } },
      { label: 'Giết lấy yêu đan', lean: 'ta', run: (c, ctx) => { dao(c, -10); addCult(c, reward(c, 0.35)); ctx.fx('evil'); return 'Yêu đan nhỏ xíu nhưng tinh thuần. Bạn nuốt nó.'; } },
    ],
  },
  {
    id: 'lang_dich',
    minRealm: 1,
    weight: 7,
    cooldown: 40,
    title: 'Ôn dịch',
    text: () => 'Một ngôi làng dưới núi bị ôn dịch. Người chết nằm la liệt, kẻ sống kêu cứu.',
    choices: () => [
      { label: 'Ở lại chữa bệnh miễn phí', lean: 'chinh', run: (c, ctx) => { const f = fatal(c, ctx, c.realm >= 2 ? 0.03 : 0.12, 'Bạn cứu được nửa làng thì nhiễm ôn dịch. Dân làng chôn bạn dưới gốc đa đầu làng.'); if (c.dead) return 'Ngày thứ ba mươi, bạn bắt đầu sốt cao...' + f; dao(c, 15); money(c, -60); stat(c, 'tamCanh', 10); ctx.fx('heal', 'Công đức'); return 'Ba tháng không ngủ, bạn cứu được gần hết làng. Dân lập bia tạ ơn.'; } },
      { label: 'Bán thuốc giá cao', lean: 'trung', run: (c) => { dao(c, -4); money(c, 200); return 'Người ta bán cả ruộng để mua thuốc của bạn.'; } },
      { label: 'Đi đường vòng, tránh lây', lean: 'trung', run: (c) => { stat(c, 'tamMa', 3); return 'Bạn bịt mũi đi qua. Tiếng khóc đuổi theo cả đoạn đường.'; } },
      { label: 'Gom người hấp hối luyện huyết đan', lean: 'ta', run: (c, ctx) => { dao(c, -25); stat(c, 'tamMa', 15); addCult(c, reward(c, 1.2)); addPill(c, 'tu_khi', 3); ctx.fx('evil', 'Huyết đan'); c.enemy = c.enemy ?? 'người sống sót ở làng dịch'; return 'Lò luyện cháy suốt bảy ngày. Tu vi bạn tăng vọt.'; } },
    ],
  },
  {
    id: 'dau_gia',
    minRealm: 2,
    weight: 7,
    cooldown: 20,
    title: 'Đấu giá hội',
    text: () => 'Vạn Bảo Lâu mở đấu giá. Món chốt là một viên Diên Thọ Đan và một pháp bảo cổ.',
    choices: (c) => [
      { label: 'Đấu Diên Thọ Đan', hint: '-600', lean: 'trung', run: (c, ctx) => { if (c.linhThach < 600) return 'Không đủ linh thạch, bạn chỉ biết nhìn người khác giơ bảng.'; money(c, -600); c.lifespan += Math.round(c.lifespan * 0.12); ctx.fx('heal', '+thọ nguyên'); return 'Bạn thắng giá. Uống vào, tóc mai bạc trở lại đen nhánh.'; } },
      { label: 'Đấu pháp bảo cổ', hint: '-800', lean: 'trung', run: (c, ctx) => { if (c.linhThach < 800) return 'Không đủ linh thạch.'; money(c, -800); stat(c, 'khiVan', 10); addCult(c, reward(c, 0.5)); ctx.fx('buy', 'Pháp bảo'); return 'Pháp bảo tự nhận chủ. Bạn cảm nhận được linh tính của nó.'; } },
      { label: 'Chỉ xem, không mua', lean: 'trung', run: (c) => { stat(c, 'ngoTinh', 2); return 'Bạn mở mang tầm mắt, biết thêm vài loại thiên tài địa bảo.'; } },
      { label: 'Theo dõi người thắng giá, cướp', lean: 'ta', run: (c, ctx) => { dao(c, -14); if (ctx.rnd() < luck(c, 0.45)) { c.lifespan += Math.round(c.lifespan * 0.12); ctx.fx('evil', 'Cướp đan'); return 'Bạn chặn hắn ở ngoài thành. Diên Thọ Đan giờ là của bạn.'; } c.enemy = c.enemy ?? 'Vạn Bảo Lâu'; return 'Hắn có hộ vệ Kim Đan. Bạn suýt chết.' + hurt(c, 50, ctx); } },
    ],
  },
  {
    id: 'dong_mon',
    minRealm: 1,
    weight: 8,
    cooldown: 25,
    when: (c) => !!c.sect,
    title: 'Đồng môn hãm hại',
    text: (c) => `Một sư huynh trong ${c.sect} ghen tị, vu cho bạn trộm đan dược của trưởng lão.`,
    choices: () => [
      { label: 'Trình bày, xin trưởng lão điều tra', lean: 'chinh', run: (c, ctx) => { if (ctx.rnd() < luck(c, 0.6)) { dao(c, 4); stat(c, 'tamCanh', 5); return 'Trưởng lão minh xét. Sư huynh kia bị phạt diện bích.'; } stat(c, 'tamMa', 8); addCult(c, -reward(c, 0.2)); return 'Không ai tin bạn. Bạn bị phạt quỳ ba ngày.'; } },
      { label: 'Nhịn cho qua', lean: 'trung', run: (c) => { stat(c, 'tamMa', 8); stat(c, 'tamCanh', 3); return 'Bạn bị phạt thay. Nhẫn một chút sóng yên biển lặng.'; } },
      { label: 'Thách đấu lôi đài', lean: 'trung', run: (c, ctx) => { if (ctx.rnd() < luck(c, 0.5)) { stat(c, 'tamCanh', 8); money(c, 100); return 'Bạn thắng đẹp trước mặt cả môn phái.'; } return 'Bạn thua.' + hurt(c, 20, ctx); } },
      { label: 'Bỏ độc vào trà của hắn', lean: 'ta', run: (c, ctx) => { dao(c, -15); stat(c, 'tamMa', 8); ctx.fx('evil'); return 'Sư huynh "tẩu hỏa nhập ma" mà chết. Không ai nghi ngờ bạn.'; } },
    ],
  },
  {
    id: 'ke_thu',
    minAge: 18,
    weight: 10,
    cooldown: 50,
    when: (c) => !!c.enemy,
    title: 'Oan gia tìm tới',
    text: (c) => `Một bóng người chặn trước động phủ. Là ${c.enemy}. "Nợ cũ, hôm nay tính cho xong."`,
    choices: () => [
      { label: 'Nhận lỗi, đền bù', hint: '-40% linh thạch', lean: 'chinh', run: (c) => { money(c, -c.linhThach * 0.4); dao(c, 10); c.enemy = null; stat(c, 'tamMa', -10); return 'Bạn cúi đầu nhận sai. Đối phương im lặng rất lâu, rồi quay đi.'; } },
      { label: 'Quyết chiến', lean: 'trung', run: (c, ctx) => { if (ctx.rnd() < luck(c, 0.5)) { c.enemy = null; stat(c, 'tamCanh', 6); return 'Một trận long trời lở đất. Bạn thắng, ân oán chấm dứt.'; } const f = fatal(c, ctx, 0.3, `Bạn chết dưới tay ${c.enemy}. Nợ cũ, cuối cùng cũng trả bằng mạng.`); if (c.dead) return 'Một trận long trời lở đất...' + f; return 'Bạn thua, phải bỏ động phủ chạy trốn.' + (f ?? '') + hurt(c, 45, ctx); } },
      { label: 'Bày trận rồi trốn đi xa', lean: 'trung', run: (c, ctx) => { if (ctx.rnd() < 0.7 || c.path === 'tran') return 'Bạn để lại trận pháp cầm chân rồi biến mất. Hắn sẽ còn tìm.'; return 'Trận bị phá.' + hurt(c, 25, ctx); } },
      { label: 'Giết, rồi diệt cả sư môn hắn', lean: 'ta', run: (c, ctx) => { dao(c, -20); stat(c, 'tamMa', 12); if (ctx.rnd() < luck(c, 0.55)) { c.enemy = null; addCult(c, reward(c, 0.4)); ctx.fx('evil', 'Diệt môn'); return 'Đêm đó, cả một sơn môn chìm trong biển lửa.'; } return 'Hắn có viện binh.' + hurt(c, 55, ctx); } },
    ],
  },
  {
    id: 'tre_lac',
    minAge: 18,
    weight: 6,
    cooldown: 30,
    title: 'Đứa trẻ lạc',
    text: () => 'Một đứa bé chừng năm tuổi lạc trong rừng, ôm chân bạn khóc gọi mẹ.',
    choices: (c) => [
      { label: 'Đưa bé về tận nhà', lean: 'chinh', run: (c) => { dao(c, 8); stat(c, 'tamCanh', 5); stat(c, 'khiVan', 3); return 'Mẹ đứa bé quỳ lạy cảm tạ. Bạn thấy vui lạ.'; } },
      { label: c.realm >= 3 ? 'Nhận làm đồ đệ' : 'Cho ít bánh rồi chỉ đường', lean: 'chinh', run: (c) => { dao(c, 5); if (c.realm >= 3) { stat(c, 'tamCanh', 10); return 'Đứa bé có linh căn không tệ. Bạn có đồ đệ đầu tiên.'; } return 'Đứa bé cầm bánh, đi theo hướng bạn chỉ.'; } },
      { label: 'Kệ nó, đường ai nấy đi', lean: 'trung', run: (c) => { stat(c, 'tamMa', 4); return 'Tiếng khóc nhỏ dần sau lưng bạn.'; } },
      { label: 'Bán cho ma môn làm dược nhân', lean: 'ta', run: (c) => { dao(c, -22); money(c, 300); stat(c, 'tamMa', 12); return 'Ma môn trả giá cao cho trẻ có thể chất thuần âm.'; } },
    ],
  },
  {
    id: 'lu_lut',
    minAge: 14,
    weight: 6,
    cooldown: 40,
    title: 'Lũ quét',
    text: () => 'Mưa liền bảy ngày. Đê vỡ, nước cuồn cuộn đổ về thị trấn dưới chân núi.',
    choices: (c) => [
      { label: 'Lao xuống cứu người', lean: 'chinh', run: (c, ctx) => { dao(c, 12); stat(c, 'tamCanh', 8); if (ctx.rnd() < 0.35) return 'Bạn cứu được hàng chục người nhưng bị gỗ đập trúng.' + hurt(c, 25, ctx); return 'Bạn cứu được hàng chục người.'; } },
      { label: c.realm >= 2 ? 'Bày trận chặn lũ' : 'Giúp đắp đê', lean: 'chinh', run: (c, ctx) => { dao(c, 10); if (c.realm >= 2) { addCult(c, reward(c, 0.3)); ctx.fx('layer', 'Ngộ trận đạo'); return 'Trận pháp chặn dòng nước. Giữa lúc ấy bạn ngộ ra điều gì đó.'; } stat(c, 'sucKhoe', 5); return 'Bạn cùng dân làng đắp đê suốt đêm.'; } },
      { label: 'Chạy lên núi giữ mình', lean: 'trung', run: (c) => { stat(c, 'tamMa', 3); return 'Bạn an toàn. Thị trấn thì không.'; } },
      { label: 'Nhân lúc hỗn loạn cướp kho lương', lean: 'ta', run: (c, ctx) => { dao(c, -12); money(c, 160); ctx.fx('coin', '+160'); return 'Bạn vác đi hai bao bạc của nhà quan. Không ai rảnh để đuổi theo.'; } },
    ],
  },
  {
    id: 'tuu_tien',
    minAge: 18,
    weight: 6,
    cooldown: 30,
    title: 'Tửu tiên',
    text: () => 'Một gã say khướt ngồi trên mái quán rượu, ném cho bạn hồ lô: "Uống với ta một chén!"',
    choices: () => [
      { label: 'Uống tới bến', lean: 'trung', run: (c, ctx) => { if (ctx.rnd() < luck(c, 0.5)) { stat(c, 'ngoTinh', 12); addCult(c, reward(c, 0.4)); giveItem(c, 'ho_lo'); ctx.fx('layer', 'Say mà ngộ'); return 'Say ba ngày ba đêm, tỉnh dậy thấy công pháp thông suốt. Gã kia để lại cho bạn cái hồ lô.'; } const f = fatal(c, ctx, 0.05, 'Rượu là Túy Tiên Nhưỡng ngàn năm, phàm thân không chịu nổi. Bạn say mà chết, mặt vẫn còn cười.'); if (c.dead) return 'Chén thứ chín...' + f; stat(c, 'sucKhoe', -10); return 'Bạn say mềm, tỉnh dậy không nhớ gì.'; } },
      { label: 'Uống một chén lấy lệ', lean: 'trung', run: (c) => { stat(c, 'tamCanh', 4); return 'Rượu ngon. Gã cười ha hả, kể chuyện tu tiên ngàn năm trước.'; } },
      { label: 'Từ chối, khuyên hắn bớt say', lean: 'chinh', run: (c) => { dao(c, 3); return 'Gã nhìn bạn như nhìn đứa ngốc rồi biến mất trong gió.'; } },
      { label: 'Chuốc say rồi lục túi', lean: 'ta', run: (c, ctx) => { dao(c, -8); if (ctx.rnd() < 0.4) { money(c, 500); return 'Túi của hắn đầy linh thạch thượng phẩm!'; } return 'Hắn mở một mắt nhìn bạn rồi búng tay. Bạn bay xuống sông.' + hurt(c, 20, ctx); } },
    ],
  },
  {
    id: 'ho_tong',
    minAge: 16,
    weight: 6,
    cooldown: 15,
    when: (c) => c.focus === 'kiem_tien',
    title: 'Thương đoàn',
    text: () => 'Một thương đoàn lớn thuê người hộ tống qua Hắc Phong Lĩnh, nơi nhiều yêu thú.',
    choices: () => [
      { label: 'Nhận việc', hint: '+linh thạch', lean: 'trung', run: (c, ctx) => { money(c, 120 * (c.realm + 1)); if (ctx.rnd() < 0.25) return 'Gặp yêu thú, bạn bảo vệ thương đoàn an toàn nhưng bị thương.' + hurt(c, 15, ctx); return 'Chuyến đi êm xuôi. Ông chủ thưởng hậu.'; } },
      { label: 'Đòi gấp đôi tiền công', lean: 'trung', run: (c, ctx) => { if (ctx.rnd() < 0.5) { money(c, 240 * (c.realm + 1)); return 'Ông chủ cắn răng đồng ý.'; } return 'Ông chủ thuê người khác.'; } },
      { label: 'Giới thiệu bạn nghèo đi thay', lean: 'chinh', run: (c) => { dao(c, 5); stat(c, 'khiVan', 4); return 'Người bạn ấy kiếm được tiền chữa bệnh cho mẹ. Sau này nhớ ơn bạn.'; } },
      { label: 'Nhận việc, giữa đường cướp luôn', lean: 'ta', run: (c, ctx) => { dao(c, -15); money(c, 500 * (c.realm + 1)); ctx.fx('coin', 'Cướp hàng'); c.enemy = c.enemy ?? 'thương hội Vạn Phúc'; return 'Đến giữa Hắc Phong Lĩnh, bạn ra tay. Hàng hóa giờ là của bạn.'; } },
    ],
  },
  {
    id: 'lao_tang',
    minAge: 10,
    weight: 6,
    cooldown: 30,
    when: (c) => c.daoTam > 10,
    title: 'Lão tăng hóa duyên',
    text: () => 'Một lão tăng áo cà sa bạc màu dừng trước cửa, chắp tay xin một bát cơm.',
    choices: () => [
      { label: 'Mời vào, dâng cơm chay', lean: 'chinh', run: (c) => { dao(c, 6); stat(c, 'tamMa', -10); return 'Lão tăng ăn xong, gõ nhẹ lên trán bạn ba cái rồi đi.'; } },
      { label: 'Xin nghe giảng kinh', lean: 'chinh', run: (c) => { stat(c, 'ngoTinh', 5); stat(c, 'tamCanh', 6); return 'Lão giảng một đoạn kinh Kim Cương. Bạn nghe mà như mở cửa sổ trong lòng.'; } },
      { label: 'Cho ít tiền rồi đóng cửa', lean: 'trung', run: (c) => { money(c, -10); return 'Lão nhận tiền, niệm một câu A Di Đà Phật.'; } },
      { label: 'Đuổi đi', lean: 'ta', run: (c) => { dao(c, -5); return 'Lão tăng không giận, chỉ cười rồi bỏ đi.'; } },
    ],
  },
  {
    id: 'huyet_te',
    minRealm: 1,
    weight: 9,
    cooldown: 40,
    when: (c) => c.daoTam < -20,
    title: 'Huyết tế',
    text: () => 'Người áo đen trao cho bạn tấm thiệp đỏ: đêm trăng tròn, ma môn mở đại lễ huyết tế. Ai tham gia sẽ được chia huyết tinh.',
    choices: () => [
      { label: 'Tham gia huyết tế', lean: 'ta', run: (c, ctx) => { dao(c, -20); stat(c, 'tamMa', 15); addCult(c, reward(c, 1.3)); ctx.fx('evil', 'Huyết tế'); return 'Máu chảy thành sông. Bạn hấp thụ phần huyết tinh của mình.'; } },
      { label: 'Báo tin cho chính đạo', lean: 'chinh', run: (c, ctx) => { dao(c, 18); money(c, 300); if (ctx.rnd() < 0.3) { c.enemy = c.enemy ?? 'ma môn bị bạn phản bội'; return 'Chính đạo phá được buổi lễ. Ma môn biết kẻ báo tin là bạn.'; } return 'Chính đạo phá được buổi lễ và thưởng bạn hậu hĩnh.'; } },
      { label: 'Từ chối khéo', lean: 'trung', run: (c) => { stat(c, 'tamMa', -3); return 'Bạn viện cớ bế quan. Người áo đen nhìn bạn đầy ý vị.'; } },
      { label: 'Giả vờ tham gia rồi phá lễ', lean: 'chinh', run: (c, ctx) => { if (ctx.rnd() < luck(c, 0.45)) { dao(c, 25); addCult(c, reward(c, 0.5)); ctx.fx('heal', 'Cứu người'); return 'Bạn phá tế đàn, cứu được hàng trăm người bị bắt.'; } const f = fatal(c, ctx, 0.3, 'Bạn bị phát hiện, bị trói lên tế đàn và luyện thành huyết nô.'); if (c.dead) return 'Giữa buổi lễ...' + f; c.enemy = c.enemy ?? 'Huyết Sát Môn'; return 'Bạn bị phát hiện.' + (f ?? '') + hurt(c, 50, ctx); } },
    ],
  },
  {
    id: 'chinh_ta_dai_chien',
    minRealm: 3,
    weight: 6,
    cooldown: 120,
    title: 'Chính tà đại chiến',
    text: () => 'Chính đạo và ma đạo khai chiến ở Đoạn Hồn Nhai. Tu sĩ khắp thiên hạ đều phải chọn phe.',
    choices: () => [
      { label: 'Theo chính đạo xuất chiến', lean: 'chinh', run: (c, ctx) => { dao(c, 15); if (ctx.rnd() < luck(c, 0.6)) { addCult(c, reward(c, 0.8)); money(c, 1000); return 'Bạn lập công lớn, danh chấn thiên hạ.'; } const f = fatal(c, ctx, 0.3, 'Bạn tử trận ở Đoạn Hồn Nhai, thi thể vùi giữa vạn xác tu sĩ.'); if (c.dead) return 'Kiếm quang ngập trời...' + f; return 'Bạn trọng thương trong trận chiến.' + (f ?? '') + hurt(c, 60, ctx); } },
      { label: 'Theo ma đạo', lean: 'ta', run: (c, ctx) => { dao(c, -15); stat(c, 'tamMa', 10); if (ctx.rnd() < luck(c, 0.6)) { addCult(c, reward(c, 1.0)); return 'Ma đạo đại thắng. Bạn được phong làm hộ pháp.'; } const f = fatal(c, ctx, 0.3, 'Bạn bị Tru Ma Kiếm Trận của chính đạo chém thành muôn mảnh.'); if (c.dead) return 'Chính đạo vây kín bốn phía...' + f; return 'Bạn bị chính đạo vây đánh.' + (f ?? '') + hurt(c, 60, ctx); } },
      { label: 'Đứng ngoài, bế quan', lean: 'trung', run: (c) => { addCult(c, reward(c, 0.3)); stat(c, 'tamCanh', 5); return 'Thiên hạ đại loạn, bạn đóng cửa động phủ tu luyện.'; } },
      { label: 'Nhặt bảo vật trên chiến trường', lean: 'ta', run: (c, ctx) => { dao(c, -6); money(c, 2000); ctx.fx('coin', 'Hôi của'); return 'Xác người khắp nơi, túi trữ vật cũng khắp nơi.'; } },
    ],
  },
  {
    id: 'phu_mau',
    minAge: 30,
    maxAge: 90,
    once: true,
    weight: 15,
    title: 'Tin nhà',
    text: () => 'Thư nhà gửi đến: cha mẹ già yếu, mong được gặp bạn lần cuối.',
    choices: () => [
      { label: 'Về ngay, ở bên tới phút cuối', lean: 'chinh', run: (c) => { dao(c, 8); stat(c, 'tamCanh', 10); stat(c, 'tamMa', -10); return 'Bạn về kịp. Mẹ nắm tay bạn, mỉm cười rồi nhắm mắt.'; } },
      { label: 'Gửi Diên Thọ Đan về', hint: '-300', lean: 'chinh', run: (c) => { money(c, -300); dao(c, 5); return 'Cha mẹ sống thêm mười năm nữa, nhưng không gặp lại bạn.'; } },
      { label: 'Đang bế quan, không về', lean: 'trung', run: (c) => { addCult(c, reward(c, 0.3)); stat(c, 'tamMa', 12); return 'Khi bạn xuất quan, mộ cha mẹ đã xanh cỏ.'; } },
      { label: 'Đốt thư', lean: 'ta', run: (c) => { dao(c, -10); stat(c, 'tamMa', 6); stat(c, 'tamCanh', 4); return 'Tu tiên là đoạn tuyệt trần duyên. Bạn tự nhủ như vậy.'; } },
    ],
  },
  {
    id: 'dao_lu_nan',
    minAge: 25,
    weight: 6,
    cooldown: 60,
    when: (c) => !!c.partner,
    title: 'Đạo lữ gặp nạn',
    text: (c) => `${c.partner} bị kẻ thù bắt đi, chỉ để lại một vệt máu và mảnh ngọc vỡ.`,
    choices: () => [
      { label: 'Một mình đi cứu', lean: 'chinh', run: (c, ctx) => { if (ctx.rnd() < luck(c, 0.55)) { stat(c, 'tamCanh', 12); dao(c, 6); ctx.fx('love', 'Đoàn tụ'); return 'Bạn xông vào hang ổ địch, mang người về.'; } const t = hurt(c, 40, ctx); c.partner = null; stat(c, 'tamMa', 20); return 'Bạn đến muộn.' + t; } },
      { label: 'Nhờ sư môn ra tay', lean: 'chinh', run: (c) => { money(c, -200); stat(c, 'tamCanh', 4); return 'Sư môn ra tay, cứu được người nhưng bạn nợ một ân tình lớn.'; } },
      { label: 'Chuộc bằng linh thạch', hint: '-50% linh thạch', lean: 'trung', run: (c) => { money(c, -c.linhThach * 0.5); return 'Bạn trả giá. Người được thả về.'; } },
      { label: 'Bỏ mặc, đạo lữ chỉ là vướng bận', lean: 'ta', run: (c) => { const p = c.partner; c.partner = null; dao(c, -14); stat(c, 'tamMa', 10); addCult(c, reward(c, 0.4)); return `Bạn không đi. Từ đó không ai nhắc đến ${p} nữa.`; } },
    ],
  },
  // ---------------- Kiếm hiệp: những lựa chọn có thể mất mạng ----------------
  {
    id: 'canh_doc',
    minAge: 14,
    weight: 7,
    cooldown: 30,
    title: 'Quán trọ ven đường',
    text: () => 'Trời mưa, bạn ghé quán trọ vắng. Chủ quán cười tươi bưng ra bát canh "Thập Toàn Đại Bổ", nói là mời không lấy tiền.',
    choices: () => [
      {
        label: 'Đói quá, húp cạn',
        lean: 'trung',
        run: (c, ctx) => {
          const f = fatal(c, ctx, 0.3, 'Trong canh có Đoạn Trường Thảo. Bạn gục xuống bàn, chủ quán lục túi bạn rồi kéo xác ra sau bếp.');
          if (c.dead) return 'Canh ngọt lạ thường...' + f;
          stat(c, 'sucKhoe', 10);
          return 'Canh ngon thật. Hóa ra chủ quán chỉ là người tốt bụng.' + (f ?? '');
        },
      },
      {
        label: 'Thử độc bằng ngân châm',
        lean: 'chinh',
        run: (c, ctx) => {
          if (ctx.rnd() < 0.5) {
            dao(c, 6);
            money(c, 120);
            return 'Ngân châm đen kịt! Bạn bắt chủ quán, hóa ra là hắc điếm chuyên giết khách. Quan phủ thưởng 120 linh thạch.';
          }
          return 'Ngân châm vẫn sáng. Bạn yên tâm húp canh, chủ quán hơi tự ái.';
        },
      },
      {
        label: 'Đổ cho con chó dưới bàn ăn trước',
        lean: 'ta',
        run: (c, ctx) => {
          dao(c, -4);
          if (ctx.rnd() < 0.5) return 'Con chó lăn ra chết. Bạn rút kiếm, chủ quán quỳ xuống xin tha.';
          return 'Con chó ăn xong vẫy đuôi. Chủ quán nhìn bạn như nhìn kẻ điên.';
        },
      },
      { label: 'Cảm ơn rồi đi luôn trong mưa', lean: 'trung', run: (c) => { stat(c, 'sucKhoe', -5); return 'Bạn đội mưa đi tiếp, ướt sũng nhưng sống sót.'; } },
    ],
  },
  {
    id: 'trong_benh',
    minAge: 20,
    weight: 6,
    cooldown: 25,
    when: (c) => c.stats.sucKhoe < 70 || c.age / c.lifespan > 0.5,
    title: 'Lâm trọng bệnh',
    text: () => 'Bạn ho ra máu suốt ba tháng, người gầy rộc. Đại phu lắc đầu bảo bệnh đã vào phế phủ.',
    choices: (c) => [
      {
        label: 'Uống thuốc bắc của đại phu',
        lean: 'trung',
        run: (c, ctx) => {
          const f = fatal(c, ctx, c.realm >= 2 ? 0.05 : 0.2, `Thuốc không cứu nổi. Bạn qua đời vì lao phổi ở tuổi ${Math.floor(c.age)}.`);
          if (c.dead) return 'Bệnh mỗi ngày một nặng...' + f;
          stat(c, 'sucKhoe', 25);
          return 'Uống ba trăm thang thuốc đắng, bệnh lui dần.' + (f ?? '');
        },
      },
      {
        label: 'Tìm truyền nhân của thần y',
        hint: '-300 linh thạch',
        lean: 'trung',
        run: (c, ctx) => {
          if (c.linhThach < 300) {
            const f = fatal(c, ctx, 0.25, 'Không đủ tiền chữa, bạn chết trên đường tìm thầy.');
            if (c.dead) return 'Thần y đòi 300 linh thạch, bạn không có...' + f;
            return 'Không đủ tiền, bạn bị đuổi về, may mà tự khỏi.';
          }
          money(c, -300);
          stat(c, 'sucKhoe', 50);
          ctx.fx('heal', 'Hồi phục');
          return 'Thần y châm chín kim, bệnh khỏi hẳn.';
        },
      },
      {
        label: 'Đốt tu vi đổi lấy mạng',
        hint: 'mất tu vi',
        lean: 'trung',
        run: (c, ctx) => {
          c.cultivation = Math.round(c.cultivation * 0.4);
          stat(c, 'sucKhoe', 40);
          ctx.fx('heal');
          return 'Bạn dùng chân khí ép bệnh ra ngoài. Sống rồi, nhưng tu vi tụt thảm hại.';
        },
      },
      {
        label: 'Luyện huyết đan từ máu người khác',
        lean: 'ta',
        run: (c, ctx) => {
          dao(c, -18);
          stat(c, 'tamMa', 12);
          stat(c, 'sucKhoe', 60);
          ctx.fx('evil', 'Huyết đan');
          return 'Bạn bắt mấy tên ăn mày luyện đan. Bệnh khỏi, trong lòng có thêm một vết đen.';
        },
      },
    ],
  },
  {
    id: 'ma_cong',
    minRealm: 1,
    weight: 6,
    once: true,
    title: 'Bí kíp cấm',
    text: () => 'Trong hốc đá dưới thác, bạn nhặt được cuốn bí kíp bọc da người: "Thiên Ma Giải Thể Đại Pháp". Trang đầu ghi: tu thành thì một ngày bằng mười năm.',
    choices: () => [
      {
        label: 'Luyện ngay đêm nay',
        hint: 'rất nguy hiểm',
        lean: 'ta',
        run: (c, ctx) => {
          dao(c, -15);
          const f = fatal(c, ctx, 0.3, 'Luyện đến tầng ba, chân khí nghịch chuyển. Bạn tẩu hỏa nhập ma, bảy khiếu phun máu mà chết.');
          if (c.dead) return 'Bạn ngồi xếp bằng, lật trang đầu...' + f;
          addCult(c, reward(c, 2));
          stat(c, 'tamMa', 20);
          ctx.fx('evil', 'Ma công đại thành');
          return 'Bạn luyện thành! Tu vi tăng vọt, đôi mắt từ nay đỏ ngầu.' + (f ?? '');
        },
      },
      {
        label: 'Luyện chậm, từng chút một',
        lean: 'ta',
        run: (c, ctx) => {
          dao(c, -6);
          const f = fatal(c, ctx, 0.08, 'Một đêm trăng tròn, ma khí phản phệ. Bạn tẩu hỏa nhập ma.');
          if (c.dead) return 'Ba năm luyện chậm...' + f;
          addCult(c, reward(c, 0.8));
          stat(c, 'tamMa', 8);
          return 'Bạn chỉ luyện vài thức phòng thân. Tu vi nhích lên.' + (f ?? '');
        },
      },
      { label: 'Đốt bí kíp, trừ hại cho đời', lean: 'chinh', run: (c) => { dao(c, 12); stat(c, 'tamCanh', 8); return 'Ngọn lửa xanh lè bùng lên. Bạn nghe như có tiếng gào thét trong đó.'; } },
      { label: 'Bán cho ma môn', lean: 'ta', run: (c, ctx) => { dao(c, -8); money(c, 600); ctx.fx('coin', '+600'); return 'Ma môn trả giá cao không tưởng. Không biết ai sẽ là người luyện nó tiếp theo.'; } },
    ],
  },
  {
    id: 'loi_dai_sinh_tu',
    minAge: 18,
    minRealm: 1,
    weight: 5,
    cooldown: 60,
    title: 'Lôi đài sinh tử',
    text: () => 'Một thiên tài trẻ tuổi ném chiến thư trước cổng: "Lên lôi đài sinh tử, ký giấy sống chết tự chịu. Dám không?"',
    choices: () => [
      {
        label: 'Ký giấy, lên đài',
        hint: 'thắng được lớn, thua là chết',
        lean: 'trung',
        run: (c, ctx) => {
          const win = ctx.rnd() < luck(c, 0.5 + (c.path === 'kiem' ? 0.15 : 0) + (hasItem(c, 'thanh_phong') ? 0.08 : 0));
          if (win) {
            addCult(c, reward(c, 0.8));
            money(c, 300 * (c.realm + 1));
            stat(c, 'tamCanh', 10);
            return 'Một kiếm định thắng thua. Danh tiếng bạn vang khắp châu quận.';
          }
          const f = fatal(c, ctx, 0.45, 'Bạn ngã xuống giữa lôi đài, giấy sinh tử đã ký, không ai được báo thù.');
          if (c.dead) return 'Ba trăm hiệp...' + f;
          return 'Bạn thua, được người ta khiêng xuống đài, sống sót trong gang tấc.' + (f ?? '') + hurt(c, 50, ctx);
        },
      },
      { label: 'Từ chối, mặc người chê cười', lean: 'trung', run: (c) => { stat(c, 'tamMa', 6); return 'Thiên hạ cười bạn nhát gan. Nhưng bạn còn sống.'; } },
      {
        label: 'Lên đài, lén dùng ám khí tẩm độc',
        lean: 'ta',
        run: (c, ctx) => {
          dao(c, -14);
          if (ctx.rnd() < 0.7) {
            addCult(c, reward(c, 0.6));
            c.enemy = c.enemy ?? 'sư môn của thiên tài chết trên lôi đài';
            return 'Hắn trúng Thất Bộ Đoạn Hồn Châm, đi được bảy bước thì gục. Không ai bắt được bằng chứng.';
          }
          const f = fatal(c, ctx, 0.5, 'Ám khí bị phát hiện. Cả quảng trường xông lên, bạn bị đánh chết tại chỗ.');
          if (c.dead) return 'Ngân châm vừa rời tay...' + f;
          return 'Ám khí bị phát hiện, bạn liều mạng chạy thoát.' + (f ?? '') + hurt(c, 40, ctx);
        },
      },
      { label: 'Mời hắn uống trà, kết bằng hữu', lean: 'chinh', run: (c) => { dao(c, 4); stat(c, 'ngoTinh', 5); return 'Hai người luận kiếm suốt đêm. Hóa ra hắn chỉ cô đơn vì quá giỏi.'; } },
    ],
  },
  {
    id: 'vuc_tham',
    minAge: 12,
    weight: 6,
    cooldown: 30,
    title: 'Linh chi bên vực',
    text: () => 'Bên vách Đoạn Hồn Nhai mọc một cây linh chi ngàn năm, tỏa ánh tím. Dưới chân là vực sâu không thấy đáy.',
    choices: () => [
      {
        label: 'Trèo xuống hái',
        hint: 'có thể rơi vực',
        lean: 'trung',
        run: (c, ctx) => {
          if (ctx.rnd() < 0.65) {
            addCult(c, reward(c, 0.7));
            stat(c, 'sucKhoe', 15);
            return 'Bạn hái được linh chi. Nuốt vào, toàn thân nóng ran.';
          }
          // rơi vực
          if (ctx.rnd() < 0.5) {
            addCult(c, reward(c, 1.5));
            stat(c, 'ngoTinh', 10);
            ctx.fx('layer', 'Rơi vực gặp kỳ ngộ');
            return 'Đá lở, bạn rơi xuống vực! Nhưng rơi vực không chết tất có kỳ ngộ: dưới đáy là động phủ của một vị tiền bối, bạn ở lại tu luyện ba năm.';
          }
          const f = fatal(c, ctx, 0.85, 'Đá lở, bạn rơi xuống vực sâu ngàn trượng. Không ai tìm thấy thi thể.');
          if (c.dead) return 'Tay vừa chạm vào linh chi...' + f;
          return 'Bạn rơi xuống vực, mắc vào cành cây giữa vách, gãy mấy cái xương sườn.' + (f ?? '') + hurt(c, 40, ctx);
        },
      },
      { label: 'Dùng dây thừng và ngự kiếm', lean: 'trung', run: (c, ctx) => { if (c.realm >= 2) { addCult(c, reward(c, 0.6)); return 'Ngự kiếm phi hành, hái linh chi dễ như trở bàn tay.'; } const f = fatal(c, ctx, 0.1, 'Dây thừng đứt. Bạn rơi xuống vực.'); if (c.dead) return 'Bạn thả dây xuống...' + f; addCult(c, reward(c, 0.4)); return 'Chật vật nửa ngày, cuối cùng cũng hái được.' + (f ?? ''); } },
      { label: 'Thuê đứa trẻ trong làng trèo xuống', lean: 'ta', run: (c, ctx) => { dao(c, -10); if (ctx.rnd() < 0.4) { stat(c, 'tamMa', 12); return 'Đứa trẻ trượt chân. Bạn nhìn xuống vực, rồi quay đi.'; } addCult(c, reward(c, 0.6)); return 'Đứa trẻ mang linh chi lên, bạn cho nó một đồng bạc.'; } },
      { label: 'Thôi, mạng quan trọng hơn', lean: 'trung', run: (c) => { stat(c, 'tamCanh', 3); return 'Bạn ngắm cây linh chi một lúc rồi quay đi.'; } },
    ],
  },
  {
    id: 'ran_doc',
    minAge: 10,
    weight: 6,
    cooldown: 25,
    when: (c) => c.focus === 'du_ngoan' || c.focus === 'luyen_dan',
    title: 'Rắn độc',
    text: () => 'Đang đi trong rừng, một con Thất Bộ Xà cắn trúng mắt cá chân bạn. Nghe nói bị cắn đi quá bảy bước là chết.',
    choices: (c) => [
      {
        label: 'Vận nội lực bức độc',
        hint: c.realm >= 1 ? 'tu sĩ thì khá an toàn' : 'chưa có nội lực',
        lean: 'trung',
        run: (c, ctx) => {
          const f = fatal(c, ctx, c.realm >= 2 ? 0.02 : c.realm === 1 ? 0.12 : 0.5, 'Độc chạy vào tim. Bạn ngã xuống ở bước thứ bảy.');
          if (c.dead) return 'Bạn ngồi xuống vận công...' + f;
          return 'Một dòng máu đen phun ra từ vết cắn. Bạn thoát chết.' + (f ?? '');
        },
      },
      {
        label: 'Uống Hồi Xuân Đan',
        hint: (c.pills.hoi_xuan ?? 0) > 0 ? `còn ${c.pills.hoi_xuan}` : 'không có',
        lean: 'trung',
        run: (c, ctx) => {
          if (usePill(c, 'hoi_xuan')) return 'Dược lực giải độc trong chớp mắt.';
          const f = fatal(c, ctx, 0.4, 'Lục túi không thấy đan dược. Bạn chết trong rừng sâu.');
          if (c.dead) return 'Bạn lục túi...' + f;
          return 'Không có đan, may mà con rắn này độc nhẹ.' + (f ?? '');
        },
      },
      {
        label: 'Hái thảo dược ven đường đắp tạm',
        lean: 'trung',
        run: (c, ctx) => {
          const f = fatal(c, ctx, 0.2, 'Thảo dược đắp nhầm lại là cỏ Đoạn Hồn. Bạn chết vì hai thứ độc.');
          if (c.dead) return 'Bạn nhai mấy lá cây...' + f;
          stat(c, 'ngoTinh', 3);
          return 'Đúng là Thanh Đại thảo, giải được độc rắn. Bạn học thêm một bài thuốc.' + (f ?? '');
        },
      },
      {
        label: 'Mặc kệ, đi tiếp',
        lean: 'trung',
        run: (c, ctx) => {
          const f = fatal(c, ctx, 0.5, 'Bước thứ bảy, bạn ngã xuống. Lời đồn là thật.');
          if (c.dead) return 'Một, hai, ba...' + f;
          return 'Bạn đi tám bước, chín bước, vẫn sống. Lời đồn là giả.' + (f ?? '');
        },
      },
    ],
  },
  {
    id: 'sat_thu',
    minAge: 20,
    weight: 8,
    cooldown: 30,
    when: (c) => c.linhThach >= 800 || !!c.enemy,
    title: 'Sát thủ Ám Ảnh Lâu',
    text: (c) => `Nửa đêm, ba bóng đen áo đen trùm mặt lặng lẽ áp sát giường bạn. ${c.enemy ? `Có kẻ đã bỏ tiền thuê giết bạn, có lẽ là ${c.enemy}.` : 'Có kẻ đã nhắm vào gia tài của bạn.'}`,
    choices: () => [
      {
        label: 'Bật dậy giao chiến',
        lean: 'trung',
        run: (c, ctx) => {
          if (ctx.rnd() < luck(c, 0.5 + c.realm * 0.05)) {
            stat(c, 'tamCanh', 6);
            return 'Bạn hạ cả ba. Trên người chúng có lệnh bài Ám Ảnh Lâu.';
          }
          const f = fatal(c, ctx, 0.45, 'Ba nhát kiếm từ ba hướng. Bạn chết khi chưa kịp rút vũ khí.');
          if (c.dead) return 'Bóng đen lao tới...' + f;
          return 'Bạn trọng thương nhưng giữ được mạng.' + (f ?? '') + hurt(c, 40, ctx);
        },
      },
      {
        label: 'Phá cửa sổ chạy trốn',
        lean: 'trung',
        run: (c, ctx) => {
          const f = fatal(c, ctx, 0.15, 'Một mũi tên tẩm độc cắm vào lưng khi bạn vừa nhảy ra ngoài.');
          if (c.dead) return 'Bạn tung người qua cửa sổ...' + f;
          money(c, -c.linhThach * 0.3);
          return 'Bạn chạy thoát trong đêm, bỏ lại một phần gia sản.' + (f ?? '');
        },
      },
      {
        label: 'Trả gấp đôi để mua lại mạng mình',
        hint: '-50% linh thạch',
        lean: 'trung',
        run: (c) => {
          money(c, -c.linhThach * 0.5);
          return 'Sát thủ cũng là người làm ăn. Chúng nhận tiền rồi biến mất.';
        },
      },
      {
        label: 'Giả chết, rồi thuê ngược sát thủ đi giết kẻ chủ mưu',
        lean: 'ta',
        run: (c, ctx) => {
          dao(c, -12);
          money(c, -400);
          if (ctx.rnd() < 0.6) {
            c.enemy = null;
            return 'Ba ngày sau, kẻ chủ mưu chết trong phòng ngủ. Ân oán chấm dứt.';
          }
          const f = fatal(c, ctx, 0.35, 'Sát thủ phát hiện bạn giả chết. Lần này chúng làm cho trọn.');
          if (c.dead) return 'Bạn nín thở...' + f;
          return 'Kế không thành, bạn mất trắng 400 linh thạch.' + (f ?? '');
        },
      },
    ],
  },
  {
    id: 'van_doc_cong',
    minRealm: 1,
    weight: 8,
    cooldown: 40,
    when: (c) => c.daoTam <= -30 || c.path === 'ma',
    title: 'Vạn Độc Công',
    text: () => 'Ma môn truyền cho bạn Vạn Độc Công: thả mình vào hũ chứa trăm loại độc vật, lấy độc nuôi công.',
    choices: () => [
      {
        label: 'Nhảy vào hũ độc',
        hint: 'rất nguy hiểm',
        lean: 'ta',
        run: (c, ctx) => {
          dao(c, -10);
          const f = fatal(c, ctx, 0.25, 'Trăm loại độc cùng phát tác. Thân thể bạn tan thành nước đen trong hũ.');
          if (c.dead) return 'Bạn nhảy vào...' + f;
          addCult(c, reward(c, 1.4));
          stat(c, 'sucKhoe', 15);
          ctx.fx('evil', 'Bách độc bất xâm');
          return 'Bảy ngày bảy đêm, bạn bước ra. Từ nay bách độc bất xâm.' + (f ?? '');
        },
      },
      { label: 'Dùng tù binh thử độc trước', lean: 'ta', run: (c, ctx) => { dao(c, -16); stat(c, 'tamMa', 10); addCult(c, reward(c, 0.6)); ctx.fx('evil'); return 'Mười tù binh chết, bạn tìm ra cách luyện an toàn hơn.'; } },
      { label: 'Chỉ học phần giải độc', lean: 'trung', run: (c) => { addPill(c, 'hoi_xuan', 2); stat(c, 'ngoTinh', 4); return 'Bạn học cách giải độc, chế được hai viên Hồi Xuân Đan.'; } },
      { label: 'Bỏ trốn khỏi ma môn', lean: 'chinh', run: (c, ctx) => { dao(c, 15); c.sect = null; const f = fatal(c, ctx, 0.15, 'Ma môn truy sát kẻ phản đồ. Bạn bị bắt lại và xử tử trước mặt mọi người.'); if (c.dead) return 'Bạn trốn đi trong đêm...' + f; c.enemy = c.enemy ?? 'ma môn truy sát kẻ phản đồ'; return 'Bạn trốn thoát. Từ nay ma môn treo thưởng cái đầu bạn.' + (f ?? ''); } },
    ],
  },
  // ---------------- Giàu nghèo ----------------
  {
    id: 'do_thach',
    minAge: 16,
    weight: 6,
    cooldown: 15,
    when: (c) => c.linhThach >= 100,
    title: 'Đổ thạch',
    text: () => 'Phường thị mở sòng đổ thạch: mua khối đá thô, bổ ra mới biết bên trong có linh ngọc hay chỉ là đá vụn.',
    choices: (c) => [
      { label: 'Cược nhỏ cho vui', hint: '-50', lean: 'trung', run: (c, ctx) => { money(c, -50); if (ctx.rnd() < 0.35) { money(c, 150); ctx.fx('coin', '+150'); return 'Bổ ra một mảnh ngọc xanh, lãi gấp ba.'; } return 'Đá vụn. Coi như mua vui.'; } },
      { label: 'Cược nửa gia tài', hint: `-${Math.round(c.linhThach / 2)}`, lean: 'trung', run: (c, ctx) => { const bet = Math.round(c.linhThach / 2); money(c, -bet); if (ctx.rnd() < 0.3) { money(c, bet * 3); ctx.fx('coin', `+${bet * 3}`); return 'Đá vỡ ra, ánh tím rực rỡ. Cả sòng xôn xao, bạn thành phú hộ sau một đêm.'; } stat(c, 'tamMa', 6); return 'Toàn đá vụn. Nửa gia tài bay theo gió.'; } },
      { label: 'Tất tay một ván', hint: 'tất cả linh thạch', lean: 'trung', run: (c, ctx) => { const bet = c.linhThach; money(c, -bet); if (ctx.rnd() < 0.18) { money(c, bet * 5); ctx.fx('coin', 'ĐỔI ĐỜI'); return 'Bên trong là Hỗn Nguyên Linh Ngọc! Bạn đổi đời chỉ trong một nhát bổ.'; } stat(c, 'tamMa', 12); const f = fatal(c, ctx, 0.05, 'Trắng tay, bạn treo cổ sau sòng bạc.'); if (c.dead) return 'Đá vụn...' + f; return 'Đá vụn. Bạn bước ra khỏi sòng với hai bàn tay trắng.' + (f ?? ''); } },
      { label: 'Đứng xem người khác cược', lean: 'trung', run: (c) => { stat(c, 'ngoTinh', 2); return 'Bạn thấy có người đổi đời, có người tán gia bại sản. Đổ thạch đúng là đánh cược với trời.'; } },
    ],
  },
  {
    id: 'mua_ruong',
    minAge: 16,
    weight: 7,
    cooldown: 20,
    when: (c) => c.linhThach >= 300,
    title: 'Đầu tư',
    text: () => 'Có người rao bán ruộng linh điền và một cửa tiệm ở trấn Lạc Hà. Một gã chủ nợ cũng rủ bạn góp vốn cho vay.',
    choices: () => [
      { label: 'Mua ruộng linh điền', hint: '-300, thu nhập ổn định', lean: 'trung', run: (c) => { money(c, -300); c.income = (c.income ?? 0) + 18; return 'Bạn có mấy mẫu ruộng. Năm nào cũng có thu.'; } },
      { label: 'Mở tiệm thuốc', hint: '-600, lời nhiều hơn', lean: 'trung', run: (c, ctx) => { if (c.linhThach < 600) return 'Không đủ vốn, bạn đành thôi.'; money(c, -600); if (ctx.rnd() < 0.75) { c.income = (c.income ?? 0) + 45; return 'Tiệm thuốc đắt khách, tiền vào như nước.'; } return 'Tiệm mở được ba tháng thì cháy. Mất trắng.'; } },
      { label: 'Góp vốn cho vay nặng lãi', lean: 'ta', run: (c, ctx) => { money(c, -300); dao(c, -10); c.income = (c.income ?? 0) + 60; if (ctx.rnd() < 0.3) c.enemy = c.enemy ?? 'con nợ bị bạn ép đến tan nhà nát cửa'; return 'Lãi mẹ đẻ lãi con. Có nhà con nợ treo cổ, bạn vẫn đến đòi.'; } },
      { label: 'Giữ tiền trong túi', lean: 'trung', run: () => 'Tiền trong túi mình vẫn là chắc nhất.' },
    ],
  },
  {
    id: 'pha_san',
    minAge: 18,
    weight: 8,
    cooldown: 25,
    when: (c) => (c.income ?? 0) >= 30,
    title: 'Thương hội chèn ép',
    text: () => 'Vạn Phúc thương hội muốn nuốt trọn việc làm ăn của bạn. Kho hàng bị đốt, khách bị dọa không cho tới.',
    choices: () => [
      { label: 'Bỏ tiền ra gỡ', hint: '-40% linh thạch', lean: 'trung', run: (c) => { money(c, -c.linhThach * 0.4); return 'Bạn cầm cự được, nhưng sứt mẻ không ít.'; } },
      { label: 'Kiện lên quan phủ', lean: 'chinh', run: (c, ctx) => { if (ctx.rnd() < 0.5) { dao(c, 4); return 'Quan phủ xử bạn thắng, thương hội phải bồi thường.'; } c.income = Math.round((c.income ?? 0) / 2); return 'Quan phủ đã ăn tiền của thương hội. Bạn mất nửa việc làm ăn.'; } },
      { label: 'Đốt kho trả đũa', lean: 'ta', run: (c, ctx) => { dao(c, -10); const f = fatal(c, ctx, 0.12, 'Người của thương hội chờ sẵn. Bạn bị đánh chết trong đám cháy.'); if (c.dead) return 'Đêm đó lửa cháy rực trời...' + f; c.enemy = c.enemy ?? 'Vạn Phúc thương hội'; return 'Kho của chúng cháy rụi. Chiến tranh thương trường bắt đầu.' + (f ?? ''); } },
      { label: 'Bán lại cơ nghiệp, rút lui', lean: 'trung', run: (c) => { money(c, (c.income ?? 0) * 6); c.income = 0; return 'Bạn bán rẻ cơ nghiệp. Tiền ít, nhưng ngủ được.'; } },
    ],
  },
  {
    id: 'bo_thi',
    minAge: 16,
    weight: 7,
    cooldown: 25,
    when: (c) => c.linhThach >= 800,
    title: 'Nạn đói',
    text: () => 'Nạn đói tràn tới trấn. Dân đói kéo đến trước cửa nhà bạn, quỳ xin một bát cháo.',
    choices: () => [
      { label: 'Mở kho phát chẩn', hint: '-30% linh thạch', lean: 'chinh', run: (c, ctx) => { money(c, -c.linhThach * 0.3); dao(c, 15); stat(c, 'khiVan', 6); ctx.fx('heal', 'Công đức'); return 'Cháo nấu không ngơi tay suốt một tháng. Dân lập bàn thờ sống cho bạn.'; } },
      { label: 'Bán gạo giá gấp mười', lean: 'ta', run: (c, ctx) => { dao(c, -12); money(c, c.linhThach * 0.5); ctx.fx('coin', 'Phất to'); return 'Bạn giàu thêm một nửa. Dân trong trấn nguyền rủa tên bạn.'; } },
      { label: 'Góp một ít cho có', lean: 'trung', run: (c) => { money(c, -50); dao(c, 2); return 'Bạn góp vài bao gạo, rồi đóng cửa lại.'; } },
      { label: 'Thuê người đuổi đi', lean: 'ta', run: (c, ctx) => { dao(c, -8); const f = fatal(c, ctx, 0.06, 'Dân đói phá cổng xông vào. Bạn bị đám đông giẫm chết.'); if (c.dead) return 'Đám đông nổi giận...' + f; return 'Gia nhân xua dân đi. Có đứa trẻ chết ngay trước cổng.' + (f ?? ''); } },
    ],
  },
  {
    id: 'tung_quan',
    minAge: 14,
    weight: 9,
    cooldown: 15,
    when: (c) => c.linhThach < 40,
    title: 'Túng quẫn',
    text: () => 'Trong túi không còn đồng nào. Bụng đói cồn cào, trời lại sắp vào đông.',
    choices: (_c, seed) =>
      sample<Choice>(seed, [
        { label: 'Đi khuân vác ở bến thuyền', lean: 'trung', run: (c) => { money(c, 35); stat(c, 'sucKhoe', -6); return 'Lưng còng xuống, nhưng có tiền mua gạo.'; } },
        { label: 'Vay lãi của Hắc Hổ bang', lean: 'trung', run: (c, ctx) => { money(c, 120); if (ctx.rnd() < 0.5) c.enemy = c.enemy ?? 'Hắc Hổ bang đòi nợ'; return 'Có tiền rồi. Còn trả thế nào thì tính sau.'; } },
        { label: 'Đi trộm nhà giàu', lean: 'ta', run: (c, ctx) => { dao(c, -8); const f = fatal(c, ctx, 0.12, 'Bạn bị gia đinh bắt được, đánh chết ngay trong sân.'); if (c.dead) return 'Bạn trèo tường vào...' + f; money(c, 80); return 'Bạn lấy được ít bạc vụn, chạy thoát trong đêm.' + (f ?? ''); } },
        { label: 'Bán vũ khí đang dùng', lean: 'trung', run: (c) => { if (c.equipped.vu_khi) { const it = ITEMS.find((i) => i.id === c.equipped.vu_khi); c.inventory = c.inventory.filter((i) => i !== c.equipped.vu_khi); c.equipped.vu_khi = undefined; money(c, Math.round((it?.price ?? 20) * 0.5)); return `Bạn bán ${it?.name ?? 'vũ khí'} lấy nửa giá.`; } money(c, 5); return 'Không còn gì để bán, bạn bán đôi giày được vài đồng.'; } },
        { label: 'Lên núi đào sâm', lean: 'trung', run: (c, ctx) => { if (ctx.rnd() < 0.3) { money(c, 150); return 'Bạn đào được củ sâm trăm năm!'; } const f = fatal(c, ctx, 0.05, 'Trượt chân xuống khe núi lúc đào sâm.'); if (c.dead) return 'Vách núi trơn...' + f; return 'Chẳng đào được gì, chỉ thêm đói.' + (f ?? ''); } },
        { label: 'Đến chùa xin cơm', lean: 'chinh', run: (c) => { stat(c, 'tamCanh', 4); stat(c, 'sucKhoe', 4); return 'Sư cụ cho bạn bát cơm chay và một lời khuyên.'; } },
      ], 4),
  },
  {
    id: 'trom_nha',
    minAge: 16,
    weight: 7,
    cooldown: 20,
    when: (c) => c.linhThach >= 1500,
    title: 'Trộm đột nhập',
    text: () => 'Nửa đêm, bạn nghe tiếng sột soạt ở kho. Có kẻ đang cạy rương linh thạch.',
    choices: () => [
      { label: 'Ra bắt trộm', lean: 'trung', run: (c, ctx) => { if (ctx.rnd() < luck(c, 0.65)) return 'Bạn tóm gọn tên trộm, giao cho quan phủ.'; const f = fatal(c, ctx, 0.08, 'Tên trộm rút dao đâm trúng tim bạn.'); if (c.dead) return 'Trong bóng tối...' + f; money(c, -c.linhThach * 0.2); return 'Hắn đâm bạn một nhát rồi ôm tiền chạy.' + (f ?? '') + hurt(c, 20, ctx); } },
      { label: 'Mặc kệ, coi như của đi thay người', lean: 'trung', run: (c) => { money(c, -c.linhThach * 0.2); return 'Sáng ra mất một phần năm gia tài.'; } },
      { label: 'Thả chó, bày bẫy', lean: 'ta', run: (c) => { dao(c, -5); return 'Tên trộm sa bẫy gãy chân. Bạn treo hắn trước cổng làm gương.'; } },
      { label: 'Hỏi vì sao hắn đi trộm', lean: 'chinh', run: (c) => { dao(c, 8); money(c, -20); return 'Hắn có mẹ già ốm nặng. Bạn cho hắn ít tiền rồi tha.'; } },
    ],
  },
  ...EVENTS2,
];

// ---------------- Sự kiện do engine kích hoạt ----------------

export const PATH_EVENT_ID = '__chon_duong';
export const BREAK_EVENT_ID = '__dot_pha';

export function pathChoices(c: Character): Choice[] {
  const list = (Object.keys(PATHS) as (keyof typeof PATHS)[])
    .map((k) => PATHS[k])
    .filter((p) => {
      if (p.id === 'phat') return c.daoTam >= 15;
      if (p.id === 'ma') return c.daoTam <= -15;
      if (p.id === 'yeu') return c.race === 'yeu';
      return true;
    });
  // ưu tiên đủ 4 lựa chọn, đường đặc biệt (phật/ma/yêu) lên đầu
  const special = list.filter((p) => ['phat', 'ma', 'yeu'].includes(p.id));
  const normal = list.filter((p) => !['phat', 'ma', 'yeu'].includes(p.id));
  const chosen = [...special, ...normal].slice(0, 4);
  return chosen.map((p) => ({
    label: p.name,
    hint: p.desc,
    lean: p.lean,
    run: (ch, ctx) => {
      ch.path = p.id;
      if (p.id === 'phat') {
        ch.lifespan = Math.round(ch.lifespan * 1.3);
        dao(ch, 10);
      }
      if (p.id === 'ma') {
        dao(ch, -10);
        stat(ch, 'tamMa', 10);
      }
      if (p.id === 'yeu') stat(ch, 'sucKhoe', 20);
      if (p.id === 'dan') addPill(ch, 'tu_khi', 3);
      if (p.id === 'tran') stat(ch, 'tamCanh', 8);
      if (p.id === 'kiem' && !ch.equipped.vu_khi) giveItem(ch, 'moc_kiem');
      ctx.fx('breakthrough', p.name);
      return `Bạn chọn con đường ${p.name}. ${p.desc}`;
    },
  }));
}

export const ITEM_BY_ID = Object.fromEntries(ITEMS.map((i) => [i.id, i]));
