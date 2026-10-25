import { addCult, addPill, dao, fatal, money, reward, stat } from './helpers';
import { promote, rankName, rankOf, sectSide } from './sect';
import type { GameEvent } from './types';

/**
 * Sự kiện trong tông môn, theo bậc đệ tử: tạp dịch có cơ hội nghịch thiên, ngoại môn bị sai việc vặt,
 * nội môn vào Tàng Kinh Các, chân truyền được sư phụ chỉ điểm. Ma môn có luật rừng riêng.
 */
export const SECT_EVENTS: GameEvent[] = [
  {
    id: 'tap_dich_nghich_thien',
    minAge: 10,
    weight: 9,
    cooldown: 6,
    when: (c) => rankOf(c) === 0,
    title: 'Tạp dịch quét lá',
    text: (c) => `Làm ${rankName(c)} ở ${c.sect}, ngày nào bạn cũng quét lá ở hậu sơn. Hôm nay dưới gốc tùng cổ thụ, chổi chạm phải một hộp đá phủ rêu.`,
    choices: () => [
      {
        label: 'Mở hộp ra xem',
        hint: 'có thể đổi đời',
        lean: 'trung',
        run: (c, ctx) => {
          if (ctx.rnd() < 0.5) {
            stat(c, 'ngoTinh', 10);
            addCult(c, reward(c, 1.2));
            return `Trong hộp là công pháp thất truyền của một vị tổ sư. Đêm nào bạn cũng lén luyện. ${promote(c, ctx, 'Trưởng lão thấy tu vi bạn tăng vọt, nghi ngờ rồi kinh ngạc.') ?? ''}`;
          }
          stat(c, 'sucKhoe', -15);
          return 'Hộp đá có cấm chế. Một luồng kình lực hất bạn văng ra, nằm liệt ba ngày.';
        },
      },
      {
        label: 'Nộp cho trưởng lão',
        hint: 'được khen, ít rủi ro',
        lean: 'chinh',
        run: (c, ctx) => {
          dao(c, 5);
          money(c, 40);
          if (ctx.rnd() < 0.35) return `Trưởng lão vuốt râu: "Thật thà hiếm có." ${promote(c, ctx, 'Ông đề cử bạn với tông môn.') ?? ''}`;
          return 'Trưởng lão thưởng cho bốn mươi linh thạch rồi phẩy tay cho lui.';
        },
      },
      {
        label: 'Kệ, quét tiếp',
        lean: 'trung',
        run: (c) => {
          stat(c, 'tamCanh', 2);
          return 'Bạn quét tiếp. Có những cơ duyên đến rồi đi như lá rụng.';
        },
      },
    ],
  },
  {
    id: 'viec_vat_ngoai_mon',
    minAge: 10,
    weight: 8,
    cooldown: 8,
    when: (c) => rankOf(c) === 1,
    title: 'Việc vặt của ngoại môn',
    text: (c) =>
      sectSide(c) === 'ta'
        ? `Hộ pháp nội đường sai bạn đi thu "tiền bảo kê" ở trấn dưới núi. Ai không nộp thì... tùy bạn.`
        : `Sư huynh nội môn ném cho bạn một xấp nhiệm vụ: gánh nước, canh lò đan, trông dược viên. Hắn còn cười: "Ngoại môn thì biết thân biết phận."`,
    choices: (c) =>
      sectSide(c) === 'ta'
        ? [
            {
              label: 'Thu đủ, ai chống thì đánh',
              hint: 'linh thạch, nghiêng tà',
              lean: 'ta',
              run: (ch) => {
                dao(ch, -6);
                money(ch, 120);
                return 'Bạn mang về một trăm hai mươi linh thạch và tiếng xấu khắp trấn.';
              },
            },
            {
              label: 'Tha cho người nghèo, tự bù tiền',
              hint: 'mất tiền, nghiêng chính',
              lean: 'chinh',
              run: (ch) => {
                dao(ch, 6);
                money(ch, -60);
                return 'Bạn tự bỏ tiền túi nộp thay. Hộ pháp nhìn bạn rất lâu, không nói gì.';
              },
            },
          ]
        : [
            {
              label: 'Làm cho xong, không than',
              hint: 'tâm cảnh +',
              lean: 'chinh',
              run: (ch) => {
                stat(ch, 'tamCanh', 5);
                addCult(ch, reward(ch, 0.3));
                return 'Gánh nước mãi, bạn chợt ngộ ra chút đạo lý về nhịp thở.';
              },
            },
            {
              label: 'Thách sư huynh tỷ thí',
              hint: 'thắng thì được nể, thua thì nhục',
              lean: 'trung',
              run: (ch, ctx) => {
                if (ctx.rnd() < 0.45) {
                  stat(ch, 'khiVan', 4);
                  return `Bạn hạ hắn trước mặt cả ngoại môn. ${promote(ch, ctx, 'Chuyện đến tai chấp sự.') ?? ''}`;
                }
                stat(ch, 'sucKhoe', -12);
                stat(ch, 'tamMa', 5);
                return 'Bạn bị đánh bầm dập, còn phải làm thêm việc của hắn một tháng.';
              },
            },
          ],
  },
  {
    id: 'tang_kinh_cac',
    minAge: 12,
    minRealm: 1,
    weight: 7,
    cooldown: 10,
    when: (c) => rankOf(c) === 2,
    title: 'Tàng Kinh Các',
    text: (c) => `Là ${rankName(c)}, bạn được vào ${sectSide(c) === 'ta' ? 'Huyết Kinh Động' : 'Tàng Kinh Các'} một tháng. Ba kệ sách, chỉ kịp đọc một.`,
    choices: () => [
      {
        label: 'Kệ công pháp',
        hint: 'tu vi',
        lean: 'trung',
        run: (c) => {
          addCult(c, reward(c, 0.8));
          return 'Bạn chép lại một bộ tâm pháp thượng thừa, chân khí lưu chuyển nhanh hẳn.';
        },
      },
      {
        label: 'Kệ y thư, đan phương',
        hint: 'đan dược',
        lean: 'chinh',
        run: (c) => {
          addPill(c, 'hoi_xuan');
          addPill(c, 'thanh_tam');
          return 'Bạn học được hai đan phương, luyện thử thành công ngay lần đầu.';
        },
      },
      {
        label: 'Tầng cấm, không ai được lên',
        hint: 'liều',
        lean: 'ta',
        run: (c, ctx) => {
          if (ctx.rnd() < 0.5) {
            stat(c, 'ngoTinh', 12);
            stat(c, 'tamMa', 8);
            return 'Bạn đọc trộm được một trang cấm thư. Đầu óc sáng ra, nhưng đêm nào cũng nghe tiếng thì thầm.';
          }
          const f = fatal(c, ctx, 0.15, 'Cấm chế tầng cao nhất Tàng Kinh Các kích hoạt. Người ta chỉ tìm thấy tro.');
          if (c.dead) return 'Bạn chạm vào cấm chế.' + f;
          stat(c, 'sucKhoe', -20);
          c.sectRank = 1;
          return `Bạn bị bắt quả tang, giáng xuống ${rankName(c)}.${f ?? ''}`;
        },
      },
    ],
  },
  {
    id: 'su_phu_chi_diem',
    minAge: 14,
    minRealm: 1,
    weight: 7,
    cooldown: 12,
    when: (c) => rankOf(c) === 3,
    title: 'Sư phụ chỉ điểm',
    text: (c) =>
      sectSide(c) === 'ta'
        ? 'Lão tổ Huyết Sát Môn gọi bạn vào huyết trì: "Muốn mạnh hơn, phải trả giá. Ngươi chọn đi."'
        : `Sư phụ ở ${c.sect} gọi bạn lên đỉnh núi lúc bình minh: "Hôm nay ta dạy con một điều. Con muốn học gì?"`,
    choices: (c) => [
      {
        label: sectSide(c) === 'ta' ? 'Tắm huyết trì' : 'Học kiếm',
        hint: 'tu vi lớn',
        lean: sectSide(c) === 'ta' ? 'ta' : 'trung',
        run: (ch) => {
          addCult(ch, reward(ch, 1.2));
          if (sectSide(ch) === 'ta') stat(ch, 'tamMa', 6);
          return sectSide(ch) === 'ta'
            ? 'Máu sôi sùng sục, xương cốt bạn nứt ra rồi liền lại, mạnh hơn trước.'
            : 'Một kiếm của sư phụ chém đôi mây trời. Bạn nhìn mãi, đến khi trong đầu chỉ còn đường kiếm ấy.';
        },
      },
      {
        label: 'Học tâm pháp tĩnh tâm',
        hint: 'tâm ma giảm',
        lean: 'chinh',
        run: (ch) => {
          stat(ch, 'tamMa', -15);
          stat(ch, 'tamCanh', 6);
          return 'Sư phụ ngồi cùng bạn đến tận hoàng hôn, không nói một lời. Lòng bạn tĩnh như mặt hồ.';
        },
      },
      {
        label: 'Xin một viên Trúc Cơ Đan',
        hint: 'đan dược đột phá',
        lean: 'trung',
        run: (ch) => {
          addPill(ch, 'truc_co');
          return 'Sư phụ cười, ném cho bạn một bình ngọc: "Tham lam. Nhưng giống ta hồi trẻ."';
        },
      },
    ],
  },
];
