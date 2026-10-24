import { DAO_LU, ITEMS, PATHS } from './data';
import { addCult, addPill, dao, giveItem, hasItem, hurt, luck, money, pick, reward, stat, usePill } from './helpers';
import type { Character, Choice, GameEvent } from './types';


export const EVENTS: GameEvent[] = [
  // ---------------- Tuổi thơ ----------------
  {
    id: 'thoi_noi',
    minAge: 0,
    maxAge: 2,
    once: true,
    weight: 50,
    title: 'Lễ thôi nôi',
    text: () => 'Cả nhà bày đồ vật ra chiếu. Bạn bò tới và chộp lấy...',
    choices: () => [
      { label: 'Cuốn sách cũ', lean: 'trung', run: (c) => { stat(c, 'ngoTinh', 8); return 'Bạn ôm cuốn sách không buông. Ông bà nói sau này hẳn là người đọc sách.'; } },
      { label: 'Thanh kiếm gỗ', lean: 'trung', run: (c) => { giveItem(c, 'moc_kiem'); stat(c, 'sucKhoe', 6); return 'Bạn vung kiếm gỗ trúng đầu chú họ. Cả nhà cười ầm.'; } },
      { label: 'Viên linh thạch', lean: 'trung', run: (c) => { money(c, 20); stat(c, 'khiVan', 4); return 'Bạn ngậm viên linh thạch vào miệng. Bà nội nói đứa này có tướng giàu.'; } },
      { label: 'Con rắn nhỏ lạc vào nhà', lean: 'ta', run: (c) => { dao(c, -4); stat(c, 'khiVan', 6); return 'Bạn bóp chặt con rắn tới khi nó bất động. Không ai dám nói gì.'; } },
    ],
  },
  {
    id: 'tuoi_tho',
    minAge: 5,
    maxAge: 10,
    once: true,
    weight: 30,
    title: 'Những ngày bé',
    text: () => 'Mùa hè năm ấy dài lê thê. Bạn dành phần lớn thời gian để...',
    choices: () => [
      { label: 'Học chữ với thầy đồ', lean: 'chinh', run: (c) => { stat(c, 'ngoTinh', 6); dao(c, 3); return 'Thầy đồ khen bạn chữ đẹp, đọc một hiểu mười.'; } },
      { label: 'Tập võ với ông lão đầu làng', lean: 'trung', run: (c) => { stat(c, 'sucKhoe', 10); return 'Ông lão dạy bạn mấy thế quyền. Người rắn rỏi hẳn ra.'; } },
      { label: 'Chăn trâu, nằm ngắm mây', lean: 'trung', run: (c) => { stat(c, 'tamCanh', 10); return 'Nằm trên lưng trâu nhìn mây trôi, lòng bạn tĩnh lặng lạ thường.'; } },
      { label: 'Đi trộm gà nhà hàng xóm', lean: 'ta', run: (c, ctx) => { dao(c, -6); if (ctx.rnd() < 0.5) { stat(c, 'khiVan', 5); return 'Bạn trộm được cả con gà béo. Không ai phát hiện.'; } stat(c, 'sucKhoe', -8); return 'Bị chó đuổi cắn một miếng, về nhà còn bị đòn.'; } },
    ],
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
          return 'Cấm chế tầng sâu bộc phát, bạn trọng thương mới thoát ra được.' + hurt(c, 45, ctx);
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
          money(c, -c.linhThach * 0.4);
          return 'Bạn thua, bị lột sạch gần nửa gia tài.' + hurt(c, 25, ctx);
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
      { label: 'Buông theo nó', hint: 'tu vi tăng, tâm ma tăng', lean: 'ta', run: (c, ctx) => { dao(c, -12); stat(c, 'tamMa', 15); addCult(c, reward(c, 0.7)); ctx.fx('evil', 'Nhập ma'); return 'Bạn mở mắt. Đồng tử đỏ rực. Sức mạnh chưa bao giờ đến dễ như vậy.'; } },
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
      { label: 'Mua một viên', hint: '-100', lean: 'trung', run: (c, ctx) => { money(c, -100); if (ctx.rnd() < 0.2) { c.lifespan += 15; ctx.fx('heal', '+15 thọ'); return 'Không ngờ là đan thật! Thọ nguyên tăng 15 năm.'; } return 'Viên đan là bột mì vo tròn. Bạn bị lừa.'; } },
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
      { label: 'Ở lại chữa bệnh miễn phí', lean: 'chinh', run: (c, ctx) => { dao(c, 15); money(c, -60); stat(c, 'tamCanh', 10); ctx.fx('heal', 'Công đức'); return 'Ba tháng không ngủ, bạn cứu được gần hết làng. Dân lập bia tạ ơn.'; } },
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
      { label: 'Quyết chiến', lean: 'trung', run: (c, ctx) => { if (ctx.rnd() < luck(c, 0.5)) { c.enemy = null; stat(c, 'tamCanh', 6); return 'Một trận long trời lở đất. Bạn thắng, ân oán chấm dứt.'; } return 'Bạn thua, phải bỏ động phủ chạy trốn.' + hurt(c, 45, ctx); } },
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
      { label: 'Uống tới bến', lean: 'trung', run: (c, ctx) => { if (ctx.rnd() < luck(c, 0.5)) { stat(c, 'ngoTinh', 12); addCult(c, reward(c, 0.4)); giveItem(c, 'ho_lo'); ctx.fx('layer', 'Say mà ngộ'); return 'Say ba ngày ba đêm, tỉnh dậy thấy công pháp thông suốt. Gã kia để lại cho bạn cái hồ lô.'; } stat(c, 'sucKhoe', -10); return 'Bạn say mềm, tỉnh dậy không nhớ gì.'; } },
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
      { label: 'Giả vờ tham gia rồi phá lễ', lean: 'chinh', run: (c, ctx) => { if (ctx.rnd() < luck(c, 0.45)) { dao(c, 25); addCult(c, reward(c, 0.5)); ctx.fx('heal', 'Cứu người'); return 'Bạn phá tế đàn, cứu được hàng trăm người bị bắt.'; } c.enemy = c.enemy ?? 'Huyết Sát Môn'; return 'Bạn bị phát hiện.' + hurt(c, 50, ctx); } },
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
      { label: 'Theo chính đạo xuất chiến', lean: 'chinh', run: (c, ctx) => { dao(c, 15); if (ctx.rnd() < luck(c, 0.6)) { addCult(c, reward(c, 0.8)); money(c, 1000); return 'Bạn lập công lớn, danh chấn thiên hạ.'; } return 'Bạn trọng thương trong trận chiến.' + hurt(c, 60, ctx); } },
      { label: 'Theo ma đạo', lean: 'ta', run: (c, ctx) => { dao(c, -15); stat(c, 'tamMa', 10); if (ctx.rnd() < luck(c, 0.6)) { addCult(c, reward(c, 1.0)); return 'Ma đạo đại thắng. Bạn được phong làm hộ pháp.'; } return 'Bạn bị chính đạo vây đánh.' + hurt(c, 60, ctx); } },
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
