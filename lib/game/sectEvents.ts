import { addCult, addPill, dao, fatal, money, reward, stat } from './helpers';
import { leaveSect, sectConflict } from './sect';
import { promote, rankName, rankOf, sectSide } from './sect';
import type { Choice, GameEvent } from './types';

/**
 * Sự kiện trong tông môn, theo bậc đệ tử: tạp dịch có cơ hội nghịch thiên, ngoại môn bị sai việc vặt,
 * nội môn vào Tàng Kinh Các, chân truyền được sư phụ chỉ điểm. Ma môn có luật rừng riêng.
 */
export const SECT_EVENTS: GameEvent[] = [
  // ---- 3.1.0: Phản môn khi đạo và tông môn ngược phe ----
  {
    id: 'phan_mon',
    minAge: 10,
    weight: 400,
    cooldown: 3,
    when: (c) => !c.cosmos && !!c.sect && !c.sectHide && sectConflict(c),
    title: 'Phản môn',
    text: (c) =>
      sectSide(c) === 'ta'
        ? `Tin bạn ${c.path === 'phat' ? 'quy y cửa Phật' : 'làm việc thiện'} lan tới tổng đàn ${c.sect}. Đêm nay, mấy tên hộ pháp đứng chặn trước cửa phòng bạn, tay đặt sẵn lên chuôi đao.`
        : `Các trưởng lão ${c.sect} phát hiện trên người bạn có ${c.path === 'ma' ? 'ma khí' : 'mùi huyết tinh'}. Chính phái không dung kẻ theo tà. Sáng mai bạn bị gọi lên chính điện.`,
    choices: (c) => {
      const ta = sectSide(c) === 'ta';
      const list: Choice[] = [
        {
          label: 'Tự xin rời tông môn',
          hint: ta ? 'ma môn không tha kẻ bỏ đi · có thể bị truy sát' : 'rời đi êm thấm, giữ đồ',
          lean: 'trung',
          run: (ch, ctx) => {
            const name = ch.sect;
            leaveSect(ch, false);
            stat(ch, 'tamCanh', -5);
            if (ta) {
              const f = fatal(ch, ctx, 0.15, `Rời ${name} chưa được ba ngày, sát thủ ma môn đuổi kịp. Kẻ phản môn không được sống.`);
              if (ch.dead) return 'Bạn lẳng lặng xuống núi trong đêm...' + f;
              ch.enemy = ch.enemy ?? 'ma môn truy sát kẻ phản đồ';
              return `Bạn trả lại lệnh bài, xuống núi trong đêm. Từ nay ${name} coi bạn là kẻ phản đồ.${f ?? ''}`;
            }
            return `Bạn quỳ trước chính điện, xin rời ${name}. Chưởng môn thở dài phất tay áo: "Đạo khác nhau, không cùng mưu. Đi đi."`;
          },
        },
        {
          label: 'Giấu thân phận, ở lại',
          hint: 'giữ tông môn, mỗi năm có thể bị lộ · lộ thì bị trục xuất, mất áo bào',
          lean: 'ta',
          run: (ch) => {
            ch.sectHide = true;
            stat(ch, 'tamMa', 6);
            return 'Bạn cúi đầu nhận sai, thề không tái phạm. Trưởng lão nửa tin nửa ngờ. Từ nay mỗi bước đi trong sơn môn đều phải giữ ý.';
          },
        },
      ];
      if (!ta)
        list.push({
          label: 'Phản sư diệt tổ, cướp bảo vật',
          hint: 'đánh với trưởng lão · thắng được bảo vật và bị cả tông truy sát · thua có thể chết',
          lean: 'ta',
          run: (ch, ctx) => {
            const name = ch.sect;
            const p = Math.min(0.7, 0.2 + ch.realm * 0.06);
            dao(ch, -20);
            if (ctx.rnd() < p) {
              leaveSect(ch, false);
              addCult(ch, reward(ch, 2));
              money(ch, 400 + ch.realm * 150);
              ch.enemy = `${name} truy sát kẻ phản sư`;
              ctx.fx('evil', 'Phản sư diệt tổ');
              return `Bạn đánh trọng thương trưởng lão giữa chính điện, cướp bảo khố rồi phá vòng vây mà đi. Tu vi tăng vọt, túi đầy linh thạch. Từ nay ${name} treo thưởng đầu bạn.`;
            }
            stat(ch, 'sucKhoe', -45);
            leaveSect(ch, true);
            const f = fatal(ch, ctx, 0.35, `Bạn phản sư không thành, bị trưởng lão ${name} một chưởng đánh nát tâm mạch.`);
            if (ch.dead) return 'Trưởng lão chỉ cần một chưởng...' + f;
            ch.enemy = ch.enemy ?? `${name} truy sát kẻ phản sư`;
            return `Trưởng lão một chưởng đánh bạn văng ra khỏi chính điện. Bạn bị phế bỏ thân phận đệ tử, lột áo bào, bò xuống núi.${f ?? ''}`;
          },
        });
      return list;
    },
  },
  {
    id: 'thien_co_vay',
    minAge: 16,
    weight: 60,
    cooldown: 8,
    when: (c) => !c.cosmos && sectSide(c) === 'trung' && Math.abs(c.daoTam) >= 40 && (c.tcVay ?? 0) < 2,
    title: 'Chính tà vây Thiên Cơ Các',
    text: (c) => `Thiên Cơ Các vốn đứng ngoài chính tà, nhưng bạn đã nghiêng hẳn về một phía. Đêm nay, ${(c.lookSeed ?? c.name.length) % 2 ? 'người của Huyết Sát Môn' : 'đệ tử Thanh Vân Tông'} kéo tới vây kín Các, đòi giao bạn ra.`,
    choices: (c) => [
      {
        label: 'Ra trận, một mình chặn cửa',
        hint: 'cảnh giới càng cao càng dễ thắng · thắng được Các chủ thưởng · thua trọng thương',
        lean: c.daoTam >= 40 ? 'chinh' : 'ta',
        run: (ch, ctx) => {
          ch.tcVay = (ch.tcVay ?? 0) + 1;
          const p = Math.min(0.75, 0.3 + ch.realm * 0.06);
          if (ctx.rnd() < p) {
            addCult(ch, reward(ch, 1));
            stat(ch, 'khiVan', 4);
            const up = promote(ch, ctx, 'Các chủ đứng trên lầu nhìn bạn đánh lui cả đoàn người.');
            ctx.fx('breakthrough', 'Giữ được Thiên Cơ Các');
            return `Bạn chặn cửa suốt một đêm, đánh lui kẻ tới gây sự. ${up ?? 'Các chủ ban cho bạn một quẻ tốt: khí vận +4.'}`;
          }
          stat(ch, 'sucKhoe', -35);
          const lost = Math.round(ch.linhThach * 0.3);
          money(ch, -lost);
          const f = fatal(ch, ctx, 0.12, 'Một mình chặn cửa Thiên Cơ Các, bạn ngã xuống dưới làn kiếm khí của cả đoàn người.');
          if (ch.dead) return 'Bạn ra trận...' + f;
          return `Bạn không chặn nổi. Trọng thương, bị cướp ${lost} linh thạch, Các chủ phải ra mặt mới giải được vây.${f ?? ''}`;
        },
      },
      {
        label: 'Trốn vào mật thất, để Các chủ lo',
        hint: 'an toàn, tâm cảnh -, Các chủ không vui',
        lean: 'trung',
        run: (ch) => {
          ch.tcVay = (ch.tcVay ?? 0) + 1;
          stat(ch, 'tamCanh', -6);
          if (ch.sectRank && ch.sectRank > 1) ch.sectRank -= 1;
          return 'Bạn trốn trong mật thất ba ngày. Khi bước ra, vòng vây đã tan, nhưng ánh mắt Các chủ nhìn bạn đã khác. Bạn bị giáng một bậc.';
        },
      },
    ],
  },
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
