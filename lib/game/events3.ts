import { addCult, addPill, dao, fatal, hurt, money, reward, stat } from './helpers';
import type { Character, EffectCtx, GameEvent } from './types';

/** Thử vận: sống thì được thưởng, xui thì chết. Trả về câu kết. */
function gamble(c: Character, ctx: EffectCtx, chance: number, cause: string, lead: string, win: (c: Character, ctx: EffectCtx) => string): string {
  const f = fatal(c, ctx, chance, cause);
  if (c.dead) return lead + (f ?? '');
  return win(c, ctx) + (f ?? '');
}

/** 10 kịch bản có thể chết */
export const EVENTS3: GameEvent[] = [
  {
    id: 'nam_phat_sang',
    minAge: 6,
    once: true,
    weight: 6,
    title: 'Nấm phát sáng',
    text: () => 'Trong hang sâu, bạn thấy một cây nấm tím phát ánh sáng xanh lam, tỏa mùi thơm ngọt khiến đầu óc lâng lâng.',
    choices: () => [
      {
        label: 'Ăn sống luôn',
        hint: 'rất liều',
        lean: 'trung',
        run: (c, ctx) =>
          gamble(c, ctx, 0.3, 'Bạn ăn phải nấm Quỷ Đăng. Đêm đó bạn cười không ngừng, rồi không bao giờ tỉnh lại.', 'Vị ngọt lịm...', (ch, cx) => {
            addCult(ch, reward(ch, 2));
            stat(ch, 'ngoTinh', 10);
            cx.fx('breakthrough', 'Linh chi');
            return 'Là Huyễn Linh Chi ngàn năm! Bạn thấy cả vũ trụ xoay vần trong đầu.';
          }),
      },
      {
        label: 'Cho chuột ăn thử trước',
        lean: 'trung',
        run: (c, ctx) => {
          if (ctx.rnd() < 0.5) {
            stat(c, 'ngoTinh', 5);
            addCult(c, reward(c, 1));
            return 'Con chuột không sao, còn chạy nhanh hơn. Bạn yên tâm ăn phần còn lại.';
          }
          return 'Con chuột co giật rồi chết. Bạn ném cây nấm đi, lạnh cả sống lưng.';
        },
      },
      {
        label: 'Hái về bán cho dược phường',
        hint: '+linh thạch',
        lean: 'trung',
        run: (c) => {
          money(c, 80);
          return 'Lão dược sư trả 80 linh thạch, mắt không rời cây nấm.';
        },
      },
      { label: 'Bỏ đi', lean: 'trung', run: () => 'Thứ gì đẹp quá thường có độc. Bạn đi tiếp.' },
    ],
  },
  {
    id: 'yeu_nu_dem',
    minAge: 16,
    maxAge: 70,
    once: true,
    weight: 6,
    title: 'Mỹ nhân trong miếu hoang',
    text: (c) => `Đêm mưa, bạn trú trong miếu hoang. Một ${c.gender === 'nam' ? 'thiếu nữ' : 'công tử'} áo trắng tuyệt sắc bước vào, mỉm cười mời bạn chén rượu ấm.`,
    choices: () => [
      {
        label: 'Nhận chén rượu',
        hint: 'nguy',
        lean: 'trung',
        run: (c, ctx) =>
          gamble(c, ctx, 0.35, 'Sáng hôm sau, tiều phu tìm thấy một cái xác khô quắt trong miếu. Yêu tinh đã hút cạn dương khí của bạn.', 'Rượu ngọt lạ thường...', (ch) => {
            stat(ch, 'tamCanh', 6);
            return 'Người ấy chỉ là một tiểu thư lạc đường. Hai người trò chuyện đến sáng.';
          }),
      },
      {
        label: 'Rút kiếm chém trước',
        hint: 'tà',
        lean: 'ta',
        run: (c, ctx) => {
          dao(c, -6);
          if (ctx.rnd() < 0.5) {
            addCult(c, reward(c, 1.2));
            return 'Đầu rơi xuống hóa thành đầu cáo. Bạn lấy được yêu đan.';
          }
          stat(c, 'tamMa', 15);
          return 'Máu đỏ chảy ra, người ấy chết thật. Chỉ là một cô gái bình thường.';
        },
      },
      {
        label: 'Niệm chú, rắc gạo nếp',
        lean: 'chinh',
        run: (c, ctx) => {
          if (ctx.rnd() < 0.6) {
            dao(c, 5);
            stat(c, 'khiVan', 6);
            return 'Nó rú lên, hiện nguyên hình hồ ly rồi chạy mất.';
          }
          return 'Gạo nếp không có tác dụng. Nó cười khanh khách, cào bạn một vết rồi biến mất.' + hurt(c, 20, ctx);
        },
      },
      {
        label: 'Giả vờ ngủ say',
        lean: 'trung',
        run: (c) => {
          stat(c, 'tamCanh', -3);
          return 'Cả đêm bạn nghe tiếng thở sát bên tai. Sáng ra người ấy đã đi, để lại một sợi lông trắng.';
        },
      },
    ],
  },
  {
    id: 'cau_treo',
    minAge: 10,
    once: true,
    weight: 6,
    title: 'Cầu treo Vạn Trượng',
    text: () => 'Cây cầu dây duy nhất bắc qua vực Vạn Trượng đã mục nát. Đi đường vòng mất ba tháng.',
    choices: () => [
      {
        label: 'Chạy thật nhanh qua cầu',
        hint: 'liều',
        lean: 'trung',
        run: (c, ctx) =>
          gamble(c, ctx, 0.15, 'Dây cầu đứt phựt ở giữa. Bạn rơi xuống vực Vạn Trượng, tiếng kêu vọng mãi không dứt.', 'Đến giữa cầu, có tiếng rắc...', (ch) => {
            stat(ch, 'khiVan', 3);
            return 'Bạn vừa đặt chân sang bờ bên kia thì cầu đứt. Tim đập thình thịch.';
          }),
      },
      {
        label: 'Ngự khí bay qua',
        hint: 'cần tu vi',
        lean: 'trung',
        run: (c, ctx) => {
          if (c.realm >= 2) return 'Bạn nhẹ nhàng lướt qua vực sâu. Tu sĩ thì cần gì cầu.';
          return gamble(c, ctx, 0.4, 'Tu vi chưa đủ để ngự khí. Bạn rơi giữa chừng.', 'Bạn nhún người bay lên...', () => 'Bạn chạm được vách đá bên kia, móng tay bật máu.');
        },
      },
      {
        label: 'Đi đường vòng',
        lean: 'trung',
        run: (c) => {
          stat(c, 'tamCanh', 3);
          return 'Ba tháng đường vòng, bạn ngắm được nhiều cảnh đẹp.';
        },
      },
      {
        label: 'Sửa cầu cho người sau',
        hint: '-40 linh thạch',
        lean: 'chinh',
        run: (c) => {
          money(c, -40);
          dao(c, 8);
          stat(c, 'khiVan', 5);
          return 'Dân làng hai bờ khắc tên bạn lên trụ cầu.';
        },
      },
    ],
  },
  {
    id: 'hong_mon_yen',
    minAge: 18,
    minRealm: 1,
    once: true,
    weight: 5,
    title: 'Tiệc Hồng Môn',
    text: () => 'Thành chủ mời bạn dự tiệc. Giữa tiệc, bạn thấy đao phủ nấp sau rèm, và chén rượu trước mặt có màu hơi lạ.',
    choices: () => [
      {
        label: 'Uống cạn cho phải phép',
        hint: 'nguy',
        lean: 'trung',
        run: (c, ctx) =>
          gamble(c, ctx, 0.4, 'Rượu có Đoạn Trường Tán. Bạn gục xuống bàn tiệc, máu đen trào ra khóe miệng.', 'Bạn nâng chén...', (ch) => {
            money(ch, 200);
            return 'Hóa ra thành chủ chỉ thử lòng can đảm. Ông thưởng bạn 200 linh thạch.';
          }),
      },
      {
        label: 'Lật bàn, giết thành chủ',
        hint: 'rất nguy, tà',
        lean: 'ta',
        run: (c, ctx) => {
          dao(c, -12);
          return gamble(c, ctx, 0.3, 'Ba mươi đao phủ ùa ra. Bạn chết dưới loạn đao.', 'Bạn hất tung bàn tiệc...', (ch, cx) => {
            money(ch, 800);
            cx.fx('coin', '+800');
            ch.enemy = 'triều đình truy nã';
            return 'Bạn chém thành chủ, vét sạch kho bạc rồi trốn đi. Từ nay bị truy nã.';
          });
        },
      },
      {
        label: 'Giả say, xin ra ngoài',
        lean: 'trung',
        run: (c, ctx) => {
          if (ctx.rnd() < 0.7) return 'Bạn lẻn ra hậu viện rồi trèo tường trốn mất.';
          return 'Thị vệ chặn lại, đâm một nhát. Bạn vẫn trốn được.' + hurt(c, 25, ctx);
        },
      },
      {
        label: 'Dùng ngân châm thử rượu',
        lean: 'chinh',
        run: (c) => {
          dao(c, 3);
          stat(c, 'khiVan', 4);
          return 'Ngân châm hóa đen. Bạn đặt chén xuống, mỉm cười nhìn thành chủ. Không ai dám động thủ nữa.';
        },
      },
    ],
  },
  {
    id: 'ho_bang',
    minAge: 7,
    once: true,
    weight: 5,
    when: (c) => Math.floor((c.age % 1) * 4) === 3 || c.region === 'bac_mac',
    title: 'Mặt hồ đóng băng',
    text: () => 'Mùa đông, hồ lớn đóng băng. Giữa hồ có một bông Băng Liên trắng muốt đang nở, giá ngàn lượng.',
    choices: () => [
      {
        label: 'Bò ra giữa hồ hái',
        hint: 'liều',
        lean: 'trung',
        run: (c, ctx) =>
          gamble(c, ctx, 0.25, 'Mặt băng nứt toác. Bạn rơi xuống nước lạnh buốt, không ai kịp kéo lên.', 'Băng kêu răng rắc dưới tay...', (ch, cx) => {
            money(ch, 300);
            addPill(ch, 'dien_tho');
            cx.fx('coin', 'Băng Liên');
            return 'Bạn hái được Băng Liên, đổi được 300 linh thạch và một viên Diên Thọ Đan.';
          }),
      },
      {
        label: 'Ném dây móc kéo vào',
        lean: 'trung',
        run: (c, ctx) => {
          if (ctx.rnd() < 0.4) {
            money(c, 300);
            return 'Trúng rồi! Bạn kéo được bông Băng Liên vào bờ.';
          }
          return 'Bông hoa rơi xuống lỗ băng, chìm mất.';
        },
      },
      {
        label: 'Trượt băng chơi với lũ trẻ',
        lean: 'chinh',
        run: (c) => {
          stat(c, 'tamCanh', 6);
          return 'Một buổi chiều vui vẻ. Bạn quên luôn bông hoa.';
        },
      },
      { label: 'Về nhà sưởi ấm', lean: 'trung', run: () => 'Ngoài trời lạnh quá. Bông hoa để người khác lo.' },
    ],
  },
  {
    id: 'on_dich',
    minAge: 10,
    once: true,
    weight: 5,
    title: 'Ôn dịch',
    text: () => 'Ôn dịch tràn qua trấn. Người chết chất đống ngoài cổng thành. Quan phủ sắp phong tỏa toàn bộ.',
    choices: () => [
      {
        label: 'Ở lại chữa bệnh cứu người',
        hint: 'chính, có thể nhiễm',
        lean: 'chinh',
        run: (c, ctx) => {
          dao(c, 15);
          return gamble(c, ctx, 0.25, 'Bạn cứu được hơn trăm người, rồi chính bạn nhiễm dịch. Dân trấn lập miếu thờ bạn.', 'Ngày thứ bốn mươi, bạn bắt đầu ho...', (ch) => {
            stat(ch, 'khiVan', 12);
            stat(ch, 'tamCanh', 10);
            return 'Ba tháng không ngủ, bạn cứu được cả trấn. Người người gọi bạn là thần y.';
          });
        },
      },
      {
        label: 'Trốn khỏi thành trước khi phong tỏa',
        lean: 'trung',
        run: (c, ctx) =>
          gamble(
            c,
            ctx,
            0.1,
            'Bạn đã nhiễm bệnh từ trước khi trốn. Chết bên vệ đường, không ai dám lại gần.',
            'Bạn chạy suốt đêm...',
            () => 'Bạn trốn thoát. Đêm nào cũng mơ thấy những người bị bỏ lại.',
          ),
      },
      {
        label: 'Bán thuốc giá cắt cổ',
        hint: 'tà, +linh thạch',
        lean: 'ta',
        run: (c, ctx) => {
          dao(c, -15);
          money(c, 400);
          ctx.fx('coin', '+400');
          return 'Bạn bán thuốc gấp trăm lần giá. Giàu lên nhanh chóng, nhưng ai cũng nguyền rủa bạn.';
        },
      },
      {
        label: 'Đóng cửa, uống Thanh Tâm Đan',
        lean: 'trung',
        run: (c) => {
          stat(c, 'sucKhoe', -10);
          return 'Bạn đóng cửa ba tháng. Gầy rộc, nhưng còn sống.';
        },
      },
    ],
  },
  {
    id: 'mang_xa_khong_lo',
    minAge: 12,
    once: true,
    weight: 5,
    title: 'Mãng xà ngàn năm',
    text: () => 'Đang đi đường núi, bạn nhận ra khúc gỗ mình vừa ngồi lên nghỉ chân... đang thở.',
    choices: () => [
      {
        label: 'Đâm vào mắt nó',
        hint: 'liều, thưởng lớn',
        lean: 'trung',
        run: (c, ctx) =>
          gamble(c, ctx, 0.35, 'Mãng xà quấn chặt lấy bạn, xương cốt vỡ vụn rồi nuốt chửng.', 'Bạn vung kiếm...', (ch, cx) => {
            addCult(ch, reward(ch, 2.5));
            cx.fx('breakthrough', 'Trảm mãng');
            return 'Một kiếm xuyên mắt! Mãng xà giãy chết. Bạn mổ lấy mật rắn, tu vi tăng vọt.';
          }),
      },
      {
        label: 'Nằm im giả chết',
        lean: 'trung',
        run: (c, ctx) => gamble(c, ctx, 0.15, 'Mãng xà không quan tâm bạn chết hay sống. Nó nuốt luôn.', 'Bạn nín thở...', () => 'Nó trườn đi. Bạn nằm im thêm một canh giờ mới dám đứng dậy.'),
      },
      {
        label: 'Rải hùng hoàng rồi chạy',
        hint: '-20 linh thạch',
        lean: 'trung',
        run: (c) => {
          money(c, -20);
          return 'Mùi hùng hoàng làm nó chùn lại. Bạn chạy một mạch xuống núi.';
        },
      },
      {
        label: 'Thì thầm với nó',
        hint: 'yêu tộc?',
        lean: 'trung',
        run: (c, ctx) => {
          if (c.race === 'yeu') {
            stat(c, 'khiVan', 10);
            return 'Nó nhận ra bạn là yêu tộc, cúi đầu nhường đường rồi tặng một chiếc vảy.';
          }
          return gamble(c, ctx, 0.3, 'Nó không hiểu tiếng người. Bạn trở thành bữa tối.', 'Bạn ghé sát tai nó...', () => 'Nó lè lưỡi liếm mặt bạn rồi bỏ đi. Thật khó hiểu.');
        },
      },
    ],
  },
  {
    id: 'set_danh',
    minAge: 18,
    once: true,
    weight: 5,
    title: 'Sấm sét giữa trời quang',
    text: () => 'Trời đang trong xanh bỗng tối sầm. Một tia sét đánh xuống ngay cạnh chỗ bạn đứng, cháy đen cả gốc cây.',
    choices: () => [
      {
        label: 'Giơ kiếm lên trời lĩnh ngộ lôi pháp',
        hint: 'cực liều',
        lean: 'trung',
        run: (c, ctx) => {
          ctx.fx('lightning');
          return gamble(c, ctx, 0.4, 'Tia sét thứ hai đánh trúng mũi kiếm. Bạn hóa thành than đen trên đỉnh núi.', 'Bạn giơ cao thanh kiếm...', (ch, cx) => {
            addCult(ch, reward(ch, 3));
            stat(ch, 'ngoTinh', 12);
            cx.fx('breakthrough', 'Lôi pháp');
            return 'Sét đánh trúng, nhưng bạn hấp thu được lôi lực! Tóc dựng đứng, tu vi tăng vọt.';
          });
        },
      },
      {
        label: 'Nằm rạp xuống đất',
        lean: 'trung',
        run: (c, ctx) => {
          if (ctx.rnd() < 0.8) return 'Sấm sét đi qua. Bạn mặt mũi lấm lem nhưng còn sống.';
          return 'Sét đánh trúng cây bên cạnh, cành gãy đập vào lưng bạn.' + hurt(c, 20, ctx);
        },
      },
      {
        label: 'Chạy vào hang trú',
        lean: 'trung',
        run: (c) => {
          stat(c, 'khiVan', 3);
          return 'Trong hang có một bộ xương cầm cuốn bí kíp. Tiếc là chữ đã mờ hết.';
        },
      },
      {
        label: 'Quỳ xuống sám hối',
        hint: 'nếu từng làm ác',
        lean: 'chinh',
        run: (c, ctx) => {
          if (c.daoTam < -30)
            return gamble(c, ctx, 0.3, 'Trời không tha. Sét đánh trúng đỉnh đầu bạn đang cúi xuống.', 'Bạn khấn vái...', (ch) => {
              dao(ch, 10);
              return 'Mây tan. Có lẽ trời cho bạn thêm một cơ hội.';
            });
          dao(c, 4);
          return 'Lòng không thẹn, sét không đến gần.';
        },
      },
    ],
  },
  {
    id: 'lan_kha',
    minAge: 20,
    once: true,
    weight: 4,
    title: 'Ván cờ của tiên nhân',
    text: () => 'Trên đỉnh núi, hai ông lão đang đánh cờ dưới gốc tùng. Một người vẫy bạn: "Ngồi xem một ván đi."',
    choices: () => [
      {
        label: 'Ngồi xem hết ván cờ',
        hint: 'thời gian?',
        lean: 'trung',
        run: (c, ctx) => {
          const yrs = 20 + Math.floor(ctx.rnd() * 40);
          c.age += yrs;
          addCult(c, reward(c, 3));
          stat(c, 'ngoTinh', 15);
          if (c.age >= c.lifespan) {
            c.dead = true;
            c.endTag = 'lan_kha';
            c.cause = `Xem xong ván cờ, cán rìu bên cạnh đã mục nát. Xuống núi mới biết đã qua ${yrs} năm. Bạn già đi rồi tọa hóa ngay dưới chân núi.`;
            ctx.fx('death');
            return c.cause;
          }
          return `Ván cờ kết thúc, bạn ngộ ra nhiều điều. Xuống núi mới biết đã qua ${yrs} năm, người quen chẳng còn ai.`;
        },
      },
      {
        label: 'Xin được đánh một ván',
        hint: 'tu vi',
        lean: 'trung',
        run: (c, ctx) => {
          c.age += 5;
          if (ctx.rnd() < 0.3) {
            addCult(c, reward(c, 4));
            return 'Bạn thắng tiên nhân một nước! Ông cười lớn, truyền cho bạn một đạo pháp quyết. Xuống núi đã qua năm năm.';
          }
          stat(c, 'tamCanh', 5);
          return 'Bạn thua tan tác. Xuống núi mới biết đã qua năm năm.';
        },
      },
      {
        label: 'Lấy trộm một quân cờ',
        hint: 'tà',
        lean: 'ta',
        run: (c, ctx) => {
          dao(c, -5);
          return gamble(c, ctx, 0.3, 'Ông lão chỉ liếc nhìn. Bạn hóa thành tượng đá đứng mãi trên đỉnh núi.', 'Bạn thò tay...', (ch) => {
            money(ch, 500);
            return 'Quân cờ bằng ngọc tiên, bán được 500 linh thạch.';
          });
        },
      },
      {
        label: 'Cúi chào rồi đi',
        lean: 'chinh',
        run: (c) => {
          stat(c, 'khiVan', 5);
          return 'Ông lão gật đầu: "Biết đủ là phúc."';
        },
      },
    ],
  },
  {
    id: 'dong_dat',
    minAge: 15,
    once: true,
    weight: 5,
    title: 'Địa long trở mình',
    text: () => 'Đêm khuya, mặt đất rung chuyển dữ dội. Nhà cửa đổ sập, tiếng kêu cứu vang khắp nơi. Kho linh thạch của bạn sắp bị vùi lấp.',
    choices: () => [
      {
        label: 'Lao vào cứu kho linh thạch',
        hint: 'liều vì tiền',
        lean: 'trung',
        run: (c, ctx) =>
          gamble(c, ctx, 0.3, 'Xà nhà sập xuống. Người ta đào được xác bạn vẫn ôm chặt túi linh thạch.', 'Bạn chạy vào kho...', (ch) => {
            money(ch, 100);
            return 'Bạn ôm được túi linh thạch chạy ra ngay trước khi mái nhà đổ.';
          }),
      },
      {
        label: 'Cứu đứa bé trong nhà bên',
        hint: 'chính',
        lean: 'chinh',
        run: (c, ctx) => {
          dao(c, 12);
          return gamble(c, ctx, 0.2, 'Bạn đẩy được đứa bé ra ngoài, rồi bức tường đổ ập lên người bạn.', 'Bạn lao vào đống đổ nát...', (ch) => {
            stat(ch, 'khiVan', 10);
            money(ch, -Math.round(ch.linhThach * 0.5));
            return 'Bạn cứu được đứa bé, nhưng kho linh thạch bị vùi mất một nửa.';
          });
        },
      },
      {
        label: 'Chạy ra bãi trống',
        lean: 'trung',
        run: (c) => {
          money(c, -Math.round(c.linhThach * 0.4));
          return 'Bạn an toàn. Kho linh thạch bị vùi mất gần một nửa.';
        },
      },
      {
        label: 'Nhân lúc hỗn loạn đi hôi của',
        hint: 'tà',
        lean: 'ta',
        run: (c, ctx) => {
          dao(c, -12);
          money(c, 250);
          if (ctx.rnd() < 0.3) return 'Bị bắt quả tang, bạn bị dân đánh một trận.' + hurt(c, 25, ctx);
          return 'Bạn vơ vét được kha khá trong đống đổ nát.';
        },
      },
    ],
  },
];
