import { addCult, addPill, dao, fatal, giveItem, money, reward, stat } from './helpers';
import { realmName } from './data';
import type { GameEvent } from './types';

/**
 * Sự kiện sau phi thăng. Tiên giới: thiên quy, Bàn Đào hội, hạ phàm, tiên ma đại chiến.
 * Ma giới: tranh ngôi, huyết hải, phản đồ, đánh lên thiên đình.
 * Sự kiện phàm giới không còn xảy ra sau phi thăng.
 */
export const COSMOS_EVENTS: GameEvent[] = [
  // ---------------- Tiên giới ----------------
  {
    id: 'tien_nam_thien_mon',
    cosmos: 'tien',
    once: true,
    weight: 60,
    title: 'Nam Thiên Môn',
    text: () => 'Bạn vừa phi thăng, áo còn vương khói lôi kiếp. Thiên binh ở Nam Thiên Môn chặn lại: "Tiên nhân mới lên phải ghi danh. Ngươi muốn vào bộ nào?"',
    choices: () => [
      {
        label: 'Vào Lôi Bộ, chuyên giáng sét phạt kẻ ác',
        hint: 'công +, đạo tâm +',
        lean: 'chinh',
        run: (c) => {
          dao(c, 8);
          addCult(c, reward(c, 0.6));
          return 'Bạn nhận lệnh bài Lôi Bộ. Lần đầu cầm búa sét, tay còn run.';
        },
      },
      {
        label: 'Vào Dược Viên, trông vườn tiên thảo',
        hint: 'đan dược',
        lean: 'trung',
        run: (c) => {
          addPill(c, 'dien_tho');
          addPill(c, 'hoi_xuan', 2);
          return 'Việc nhàn, lại được hái lén vài cây tiên thảo. Bạn bắt đầu thấy tiên giới cũng không tệ.';
        },
      },
      {
        label: 'Không ghi danh, làm tán tiên tự do',
        hint: 'khí vận +, có thể bị làm khó',
        lean: 'trung',
        run: (c, ctx) => {
          stat(c, 'khiVan', 8);
          if (ctx.rnd() < 0.4) {
            stat(c, 'sucKhoe', -20);
            return 'Thiên binh không vui, cho bạn một trận "dạy dỗ" rồi mới thả đi. Tự do cũng có giá.';
          }
          return 'Bạn mỉm cười đi thẳng. Tiên giới rộng lớn, đâu cũng là nhà.';
        },
      },
    ],
  },
  {
    id: 'tien_ban_dao',
    cosmos: 'tien',
    weight: 8,
    cooldown: 25,
    title: 'Bàn Đào hội',
    text: () => 'Tây Vương Mẫu mở Bàn Đào hội. Đào ba nghìn năm mới chín một lần, ăn một quả thọ thêm vạn tuổi. Bạn không có thiệp mời.',
    choices: () => [
      {
        label: 'Xin làm người hầu rượu để vào',
        hint: 'thọ nguyên +, an toàn',
        lean: 'chinh',
        run: (c) => {
          c.lifespan += 30;
          return 'Bạn bưng rượu suốt ba ngày, cuối buổi được thưởng nửa quả đào. Thọ nguyên thêm 30 năm.';
        },
      },
      {
        label: 'Lẻn vào vườn đào hái trộm',
        hint: 'thọ nguyên ++, rủi ro lớn',
        lean: 'ta',
        run: (c, ctx) => {
          dao(c, -10);
          if (ctx.rnd() < 0.55) {
            c.lifespan += 80;
            addCult(c, reward(c, 1));
            return 'Bạn nuốt chửng ba quả đào chín đỏ rồi chuồn mất. Thọ nguyên thêm 80 năm, tu vi tăng vọt. Thiên đình đang truy tìm kẻ trộm.';
          }
          const f = fatal(c, ctx, 0.25, 'Thiên binh bắt quả tang bạn trong vườn đào. Tội trộm đào tiên, chém đầu răn chúng.');
          if (c.dead) return 'Bạn bị bắt.' + f;
          stat(c, 'sucKhoe', -40);
          return `Bạn bị bắt, ăn ba trăm roi tiên trượng.${f ?? ''}`;
        },
      },
      {
        label: 'Không đi, bế quan',
        hint: 'tu vi',
        lean: 'trung',
        run: (c) => {
          addCult(c, reward(c, 0.8));
          return 'Ngoài kia tiên nhạc vang trời, trong động phủ bạn chỉ nghe tiếng chân khí lưu chuyển.';
        },
      },
    ],
  },
  {
    id: 'tien_ha_pham',
    cosmos: 'tien',
    weight: 8,
    cooldown: 30,
    title: 'Ngoảnh lại nhân gian',
    text: (c) =>
      `Từ mép mây nhìn xuống, nhân gian đã qua ${Math.max(1, Math.floor(c.age - (c.ascendAge ?? c.age)))} năm. Nơi bạn từng sống${c.partner ? `, mộ ${c.partner} đã phủ rêu xanh` : ''}. Con cháu đời sau đang gặp nạn hạn hán.`,
    choices: () => [
      {
        label: 'Hạ phàm làm mưa cứu dân',
        hint: 'đạo tâm ++, phạm thiên quy',
        lean: 'chinh',
        run: (c, ctx) => {
          dao(c, 15);
          stat(c, 'tamCanh', 10);
          if (ctx.rnd() < 0.15) {
            c.dead = true;
            c.endTag = 'giang_tran';
            c.cause = 'Tự ý hạ phàm làm mưa, phạm thiên quy, bị giáng xuống trần làm người phàm';
            ctx.fx('death', 'Giáng trần');
            return 'Mưa xuống, đồng ruộng xanh lại. Nhưng Thiên đình không tha. Bạn bị tước tiên tịch, giáng xuống trần. Kiếp sau, bạn sẽ đầu thai với ký ức tiên nhân.';
          }
          return 'Mưa xuống ba ngày ba đêm. Dân làng lập miếu thờ một vị tiên không rõ tên. Thiên đình nhắm mắt cho qua.';
        },
      },
      {
        label: 'Để lại một giấc mộng chỉ đường',
        hint: 'tâm cảnh +',
        lean: 'chinh',
        run: (c) => {
          stat(c, 'tamCanh', 6);
          dao(c, 5);
          return 'Đêm ấy, một đứa cháu đời thứ mười mơ thấy người mặc áo trắng chỉ về phía mạch nước ngầm.';
        },
      },
      {
        label: 'Tiên phàm cách biệt, quay đi',
        hint: 'tu vi',
        lean: 'trung',
        run: (c) => {
          addCult(c, reward(c, 0.5));
          stat(c, 'tamCanh', -3);
          return 'Bạn quay lưng. Tiên nhân không nên vướng bận trần duyên. Chỉ là đêm đó tu luyện không yên.';
        },
      },
    ],
  },
  {
    id: 'tien_thien_quy',
    cosmos: 'tien',
    weight: 7,
    cooldown: 20,
    title: 'Thiên quy',
    text: () => 'Một tiên nữ bị phạt quỳ ở Dao Trì vì yêu một người phàm. Nàng ngước nhìn bạn, không cầu xin, chỉ hỏi: "Yêu người thì có tội sao?"',
    choices: () => [
      {
        label: 'Lên tiếng xin tha cho nàng',
        hint: 'đạo tâm +, có thể bị phạt',
        lean: 'chinh',
        run: (c, ctx) => {
          dao(c, 10);
          if (ctx.rnd() < 0.5) {
            stat(c, 'khiVan', 6);
            return 'Ngọc Đế nể lời, giảm án cho nàng. Từ đó tiên giới truyền tai nhau tên bạn.';
          }
          stat(c, 'sucKhoe', -25);
          c.cultivation = Math.round(c.cultivation * 0.8);
          return 'Bạn bị phạt cùng, quỳ bảy ngày ở Dao Trì. Tu vi tổn hao, nhưng lòng không hối hận.';
        },
      },
      {
        label: 'Lặng lẽ đưa cho nàng một viên đan',
        hint: 'nhẹ nhàng',
        lean: 'chinh',
        run: (c) => {
          stat(c, 'tamCanh', 5);
          return 'Nàng nắm chặt viên đan, mắt đỏ hoe. Bạn đi tiếp, không ai thấy.';
        },
      },
      {
        label: 'Thiên quy là thiên quy',
        hint: 'tâm ma +',
        lean: 'trung',
        run: (c) => {
          stat(c, 'tamMa', 5);
          addCult(c, reward(c, 0.4));
          return 'Bạn bước qua. Phía sau, tiếng nàng khóc nhỏ dần.';
        },
      },
    ],
  },
  {
    id: 'tien_ma_chien',
    cosmos: 'both',
    weight: 7,
    cooldown: 35,
    minAge: 0,
    title: 'Tiên Ma đại chiến',
    text: (c) =>
      c.cosmos === 'hu'
        ? 'Tiên Ma giao chiến ngay rìa Thái Hư. Cả hai bên đều muốn kéo bạn vào. Bạn đứng giữa hai làn đạn.'
        : c.cosmos === 'ma'
        ? 'Ma Đế hạ lệnh đánh lên Thiên đình. Trăm vạn ma binh đứng chờ ở Cửa Cửu U. Ngươi đi tiên phong chứ?'
        : 'Ma giới tràn qua giới tuyến. Thiên đình gióng trống tụ tướng, mọi tiên nhân phải ra trận.',
    choices: (c) => [
      {
        label: c.cosmos === 'ma' ? 'Dẫn ma binh đánh tiên phong' : 'Xông lên tuyến đầu',
        hint: 'tu vi lớn, có thể chết',
        lean: c.cosmos === 'ma' ? 'ta' : 'chinh',
        run: (ch, ctx) => {
          const f = fatal(
            ch,
            ctx,
            0.2,
            ch.cosmos === 'ma' ? 'Bạn bị Lôi Bộ vây đánh trước Nam Thiên Môn. Ma hồn tan thành tro dưới vạn đạo sét.' : 'Bạn ngã xuống trên chiến trường Tiên Ma, giữa biển máu và tiên quang.',
          );
          if (ch.dead) {
            ch.endTag = 'tu_tran';
            return 'Trận chiến kéo dài bảy ngày.' + f;
          }
          addCult(ch, reward(ch, 2));
          stat(ch, 'sucKhoe', -30);
          dao(ch, ch.cosmos === 'ma' ? -10 : 10);
          return `Bạn chém tướng đoạt cờ, công lao đứng đầu. Tu vi tăng vọt.${f ?? ''}`;
        },
      },
      {
        label: 'Giữ hậu phương, chữa thương binh',
        hint: 'an toàn, đạo tâm +',
        lean: 'chinh',
        run: (ch) => {
          dao(ch, 6);
          addCult(ch, reward(ch, 0.6));
          return 'Bạn cứu được hàng trăm người. Chiến công không vang dội, nhưng ai cũng nhớ ơn.';
        },
      },
      {
        label: 'Đứng ngoài, chờ ngư ông đắc lợi',
        hint: 'linh thạch, mất uy tín',
        lean: 'ta',
        run: (ch) => {
          money(ch, 3000);
          dao(ch, -8);
          return 'Hai bên đánh nhau tơi bời, bạn lặng lẽ nhặt bảo vật trên chiến trường. Giàu to, nhưng cả hai giới đều khinh bạn.';
        },
      },
    ],
  },
  {
    id: 'tien_kim_long_ly',
    cosmos: 'tien',
    weight: 6,
    cooldown: 40,
    title: 'Vảy rồng rơi',
    text: () => 'Thái Cổ Kim Long lột vảy trên Long Cung Thiên Thượng. Một mảnh vảy vàng rơi xuống ngay trước mặt bạn, còn nóng hổi.',
    choices: () => [
      {
        label: 'Nhặt lấy, đem rèn',
        hint: 'thần binh',
        lean: 'trung',
        run: (c, ctx) => {
          giveItem(c, 'kim_long_lan_kiem', false);
          ctx.fx('layer', 'Kim Long Lân kiếm');
          return 'Bạn mang mảnh vảy tới lò rèn của Thái Thượng Lão Quân. Bốn mươi chín ngày sau, Kim Long Lân kiếm ra lò. Mở Túi đồ để dùng.';
        },
      },
      {
        label: 'Trả lại cho Kim Long',
        hint: 'khí vận ++',
        lean: 'chinh',
        run: (c) => {
          stat(c, 'khiVan', 15);
          dao(c, 5);
          return 'Kim Long nhìn bạn rất lâu rồi gật đầu. Từ đó mây lành theo bạn mỗi bước.';
        },
      },
    ],
  },
  // ---------------- Ma giới ----------------
  {
    id: 'ma_huyet_hai',
    cosmos: 'ma',
    once: true,
    weight: 60,
    // 3.1.0: thay bằng chuỗi nhập Ma giới (Nhận chủ), giữ lại để gia phả cũ còn đọc được
    when: () => false,
    title: 'Bờ Huyết Hải',
    text: (c) => `Bạn bước qua cửa Ma giới. Trước mặt là Huyết Hải mênh mông, sóng đỏ như máu. Ba vị ma chúa đang chờ xem ${realmName(c.realm, 'ma')} mới tới đứng về phe ai.`,
    choices: () => [
      {
        label: 'Theo Huyết Ma Chúa, kẻ mạnh nhất',
        hint: 'tu vi +, tâm ma +',
        lean: 'ta',
        run: (c) => {
          addCult(c, reward(c, 0.8));
          stat(c, 'tamMa', 6);
          return 'Huyết Ma Chúa cười lớn, rót cho bạn một chén huyết tửu. Chén rượu cháy bỏng tận xương.';
        },
      },
      {
        label: 'Không theo ai, tự lập một phương',
        hint: 'khí vận +, nguy hiểm',
        lean: 'trung',
        run: (c, ctx) => {
          stat(c, 'khiVan', 10);
          if (ctx.rnd() < 0.35) {
            stat(c, 'sucKhoe', -30);
            return 'Cả ba ma chúa đều sai người tới "thăm hỏi". Bạn sống sót, nhưng thân thể đầy vết thương.';
          }
          money(c, 1500);
          return 'Bạn chiếm một hòn đảo giữa Huyết Hải, xưng vương một cõi. Ma giới bắt đầu nhắc tên bạn.';
        },
      },
      {
        label: 'Tìm đường quay về',
        hint: 'đạo tâm +',
        lean: 'chinh',
        run: (c) => {
          dao(c, 20);
          stat(c, 'tamMa', -10);
          return 'Bạn quay lưng với Huyết Hải. Đường về không có, nhưng lòng bạn lần đầu thấy nhẹ.';
        },
      },
    ],
  },
  {
    id: 'ma_tranh_ngoi',
    cosmos: 'ma',
    weight: 8,
    cooldown: 20,
    title: 'Tranh ngôi ma chúa',
    text: () => 'Một ma chúa già yếu đi. Trăm ma vương rình rập ngai vàng xương trắng. Đây là cơ hội.',
    choices: () => [
      {
        label: 'Ra tay đoạt ngôi',
        hint: 'tu vi ++, có thể chết',
        lean: 'ta',
        run: (c, ctx) => {
          const f = fatal(c, ctx, 0.22, 'Bạn bị chính thuộc hạ đâm sau lưng khi vừa ngồi lên ngai xương. Ma giới không có lòng trung thành.');
          if (c.dead) return 'Bạn ra tay.' + f;
          addCult(c, reward(c, 1.8));
          dao(c, -10);
          money(c, 2000);
          return `Bạn chém ma chúa già, ngồi lên ngai xương. Trăm ma vương quỳ xuống.${f ?? ''}`;
        },
      },
      {
        label: 'Đứng sau giật dây',
        hint: 'linh thạch, an toàn',
        lean: 'ta',
        run: (c) => {
          money(c, 1200);
          stat(c, 'tamMa', 4);
          return 'Bạn bán tin cho cả ba phe. Ai thắng cũng nợ bạn một ân tình.';
        },
      },
      {
        label: 'Bảo vệ ma chúa già',
        hint: 'đạo tâm +',
        lean: 'chinh',
        run: (c) => {
          dao(c, 12);
          stat(c, 'sucKhoe', -20);
          return 'Bạn đứng chắn trước ngai. Ma chúa già nhìn bạn, lần đầu tiên trong vạn năm biết cảm động.';
        },
      },
    ],
  },
  {
    id: 'ma_tam_ma_kiep',
    cosmos: 'ma',
    weight: 7,
    cooldown: 25,
    title: 'Tâm ma vạn kiếp',
    text: () => 'Ở Ma giới, tâm ma không ở trong lòng mà đứng ngay trước mặt. Nó mang khuôn mặt của tất cả những người bạn từng giết.',
    choices: () => [
      {
        label: 'Nuốt chửng tâm ma',
        hint: 'tu vi ++, tâm ma ++',
        lean: 'ta',
        run: (c) => {
          addCult(c, reward(c, 1.5));
          stat(c, 'tamMa', 20);
          return 'Bạn nuốt nó vào. Sức mạnh dâng trào, và giọng nói trong đầu bạn đông hơn.';
        },
      },
      {
        label: 'Đối diện từng khuôn mặt',
        hint: 'tâm ma giảm mạnh',
        lean: 'chinh',
        run: (c) => {
          stat(c, 'tamMa', -30);
          dao(c, 10);
          return 'Bạn nhìn từng người một, nhớ lại tên họ. Tâm ma nhạt dần, rồi tan như sương.';
        },
      },
    ],
  },
  {
    id: 'ma_phan_do',
    cosmos: 'ma',
    weight: 6,
    cooldown: 30,
    title: 'Ma binh làm phản',
    text: () => 'Đêm Huyết Nguyệt, ma binh dưới trướng bạn nổi loạn. Kẻ cầm đầu là phó tướng bạn tin nhất.',
    choices: () => [
      {
        label: 'Giết sạch, răn đe',
        hint: 'tu vi +, đạo tâm --',
        lean: 'ta',
        run: (c) => {
          dao(c, -12);
          addCult(c, reward(c, 0.8));
          return 'Huyết Hải đỏ thêm một màu. Từ đó không ai dám ngẩng đầu trước mặt bạn.';
        },
      },
      {
        label: 'Tha cho kẻ bị ép theo',
        hint: 'đạo tâm +, có thể bị đánh lén',
        lean: 'chinh',
        run: (c, ctx) => {
          dao(c, 10);
          if (ctx.rnd() < 0.3) {
            stat(c, 'sucKhoe', -30);
            return 'Một kẻ được tha quay lại đâm bạn một nhát. Ma giới là vậy.';
          }
          stat(c, 'khiVan', 6);
          return 'Những kẻ được tha quỳ rạp, thề chết theo bạn. Lần này họ giữ lời.';
        },
      },
    ],
  },
];
