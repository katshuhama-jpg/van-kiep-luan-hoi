import { ITEMS } from './data';
import { addCult, fatal, giveItem, money, reward, stat } from './helpers';
import { PET_IDS, PETS, adopt } from './pets';
import type { Character, GameEvent } from './types';

/**
 * Sự kiện giữ chân: tiên duyên chắc chắn ở kiếp đầu, thần binh truyền kiếp nhận chủ.
 */
export const HOOK_EVENTS: GameEvent[] = [
  {
    id: 'van_kiep_quy_nhat',
    minAge: 30,
    once: true,
    weight: 400,
    // mỗi tài khoản chỉ gặp một lần; về sau là Quyển II
    when: (c) => !!c.loreDone && !c.quyNhat,
    title: 'Vạn Kiếp Quy Nhất',
    text: () =>
      'Đêm ấy bạn không mơ. Bạn tỉnh giấc trên đỉnh núi tuyết, và người kia đã quay mặt lại, mỉm cười bằng khuôn mặt của bạn: "Vạn kiếp đã đủ. Ngươi muốn dừng lại, hay đi thêm một kiếp nữa?"',
    choices: () => [
      {
        label: 'Buông bỏ, thoát khỏi Vạn Kiếp',
        hint: 'kết thúc mọi luân hồi',
        lean: 'chinh',
        run: (c, ctx) => {
          c.dead = true;
          c.endTag = 'thoat_van_kiep';
          c.cause = 'Gom lại vạn mảnh của chính mình, mỉm cười bước ra khỏi luân hồi';
          ctx.fx('breakthrough', 'VẠN KIẾP QUY NHẤT');
          return 'Bạn bước tới, hai bóng người hòa làm một. Tiếng chuông vang lên lần cuối, rồi im lặng. Lần đầu tiên sau vạn kiếp, bạn không cần câu trả lời nữa.';
        },
      },
      {
        label: 'Ở lại, sống trọn kiếp này đã',
        hint: 'tâm cảnh, khí vận +20',
        lean: 'trung',
        run: (c) => {
          c.stats.tamCanh = Math.min(100, c.stats.tamCanh + 20);
          c.stats.khiVan = Math.min(100, c.stats.khiVan + 20);
          return 'Người kia gật đầu: "Cũng là một câu trả lời." Bạn tỉnh dậy, thấy nắng sớm đẹp hơn mọi buổi sáng trước đây.';
        },
      },
    ],
  },
  {
    id: 'ke_go_chuong',
    cosmos: 'both',
    minRealm: 11,
    once: true,
    weight: 160,
    // Quyển II: đã đi qua ít nhất 7 mảnh, đang ở cảnh giới cuối của một cõi
    when: (c) => !!c.quyNhat && !!c.cosmos && (c.lore2 ?? 0) >= 7 && !c.bell,
    title: 'Kẻ Gõ Chuông',
    text: () =>
      'Trên đỉnh cao nhất của cõi này, bạn nghe tiếng chuông rõ hơn bao giờ hết. Giữa mây có một bàn tay cầm dùi, không thân, không mặt. "Lại một mảnh tìm tới," giọng nói vang lên. "Ngươi muốn ta ngừng đếm? Vậy thử đỡ ba tiếng chuông của ta."',
    choices: () => [
      {
        label: 'Đỡ ba tiếng chuông',
        hint: 'tâm cảnh, khí vận càng cao càng dễ thắng · thua có thể chết',
        lean: 'chinh',
        run: (c, ctx) => {
          const p = Math.min(0.7, 0.15 + (c.stats.tamCanh / 100) * 0.3 + (c.stats.khiVan / 100) * 0.15 + (c.lore2 ?? 0) * 0.02 + ((c.kiepSo ?? 0) >= 9 ? -0.1 : 0));
          let hits = 0;
          for (let i = 0; i < 3; i++) if (ctx.rnd() < p + 0.05) hits++;
          if (hits >= 3) {
            c.qf = { ...(c.qf ?? {}), chuongWin: 1 };
            c.bell = 1;
            stat(c, 'tamCanh', 10);
            ctx.fx('breakthrough', 'ĐỠ ĐƯỢC BA TIẾNG CHUÔNG');
            return 'Tiếng thứ nhất làm bạn quỳ xuống. Tiếng thứ hai làm bạn quên tên mình. Tiếng thứ ba, bạn gọi tên những người đã đi cùng mình qua vạn kiếp, và đứng dậy. Bàn tay buông dùi. Dùi chuông rơi xuống chân bạn. (Kiếp sau sẽ được chọn số phận của chiếc chuông.)';
          }
          stat(c, 'sucKhoe', -45);
          stat(c, 'tamMa', 15);
          const d = fatal(c, ctx, 0.25, 'Nguyên thần bị tiếng chuông chấn nát trên đỉnh cõi trời');
          return (
            `Bạn chỉ đỡ được ${hits} tiếng. Tiếng chuông còn lại xuyên qua nguyên thần, bạn rơi khỏi mây như chiếc lá. Giọng nói vọng theo: "Chưa đủ. Mảnh vỡ của ngươi còn chưa biết nhau."` +
            (d ?? ' Bạn còn sống, nhưng tim vẫn đập theo nhịp chuông rất lâu.')
          );
        },
      },
      {
        label: 'Lui lại, chưa phải lúc',
        hint: 'an toàn, kiếp sau còn gặp',
        lean: 'trung',
        run: () => 'Bạn cúi đầu lui xuống. Tiếng chuông cười khẽ, rồi tiếp tục đếm.',
      },
    ],
  },
  {
    id: 'cau_hon_su_gia',
    minAge: 20,
    once: true,
    weight: 300,
    when: (c) => !!c.cauHon,
    title: 'Câu hồn sứ giả',
    text: () =>
      'Năm lần qua cầu Nại Hà, năm lần hất đổ chén canh. Đêm nay có tiếng xích sắt kéo lê ngoài cửa. Một bóng áo đen đội mũ cao, tay cầm câu hồn lệnh: "Kẻ không chịu quên, Địa phủ đến đòi nợ."',
    choices: () => [
      {
        label: 'Rút binh khí, đánh với sứ giả',
        hint: 'cảnh giới, tâm cảnh càng cao càng dễ thắng · thua có thể chết',
        lean: 'trung',
        run: (c, ctx) => {
          const p = Math.min(0.75, 0.2 + c.realm * 0.06 + (c.stats.tamCanh / 100) * 0.2);
          if (ctx.rnd() < p) {
            c.qf = { ...(c.qf ?? {}), cauHonWin: 1 };
            c.cauHon = false;
            stat(c, 'tamCanh', 8);
            giveItem(c, 'cau_hon_lenh', true);
            ctx.fx('breakthrough', 'ĐÁNH LUI SỨ GIẢ');
            return 'Xích sắt đứt làm đôi. Sứ giả lùi vào bóng tối, để rơi lại câu hồn lệnh: "Lần này ta tha. Nợ của ngươi, Địa phủ xóa sổ." Từ nay không còn ai đòi bạn uống canh nữa.';
          }
          stat(c, 'sucKhoe', -40);
          const d = fatal(c, ctx, 0.4, 'Bị Câu hồn sứ giả xích hồn kéo về Địa phủ vì năm lần không chịu uống canh Mạnh Bà');
          if (c.dead) c.endTag = 'cau_hon';
          return 'Xích sắt quấn quanh cổ, lạnh buốt tới tận hồn.' + (d ?? ' Bạn giãy thoát được, nhưng hồn phách rách một mảng. Sứ giả hẹn kiếp sau gặp lại.');
        },
      },
      {
        label: 'Đốt vàng mã, xin khất nợ',
        hint: 'mất linh thạch, tâm ma +',
        lean: 'chinh',
        run: (c) => {
          money(c, -Math.round(c.linhThach * 0.3));
          stat(c, 'tamMa', 12);
          return 'Sứ giả nhận lễ, lặng lẽ rời đi. Nhưng bạn biết, chừng nào còn chưa uống canh, hắn còn quay lại.';
        },
      },
    ],
  },
  {
    id: 'chuong_vo',
    minAge: 20,
    once: true,
    weight: 400,
    when: (c) => c.bell === 1,
    title: 'Chuông vỡ',
    text: () =>
      'Dùi chuông vẫn nằm trong tay bạn, kiếp này qua kiếp khác. Đêm nay, quả chuông vô hình hiện ra trước mặt, to như một ngọn núi. Gõ nó, bạn sẽ thay kẻ kia đếm các mảnh để không mảnh nào bị quên. Đập vỡ nó, vạn mảnh sẽ tự do, nhưng có thể chẳng bao giờ tìm lại nhau.',
    choices: () => [
      {
        label: 'Gõ chuông, thành người giữ chuông',
        hint: 'kết thúc kiếp · kết cục mới',
        lean: 'chinh',
        run: (c, ctx) => {
          c.dead = true;
          c.bell = 2;
          c.endTag = 'go_chuong';
          c.cause = 'Cầm dùi chuông, thay Thiên Đạo đếm vạn mảnh để không ai bị quên';
          ctx.fx('breakthrough', 'NGƯỜI GIỮ CHUÔNG');
          return 'Bạn gõ một tiếng. Khắp các cõi, vạn người cùng ngẩng lên, và lần đầu tiên tiếng chuông không làm ai sợ. Nó chỉ nói: ta vẫn nhớ các ngươi.';
        },
      },
      {
        label: 'Đập vỡ chuông, trả tự do cho vạn mảnh',
        hint: 'kết thúc kiếp · kết cục mới',
        lean: 'ta',
        run: (c, ctx) => {
          c.dead = true;
          c.bell = 2;
          c.endTag = 'dap_chuong';
          c.cause = 'Đập vỡ quả chuông của Thiên Đạo, trả tự do cho vạn mảnh';
          ctx.fx('breakthrough', 'CHUÔNG VỠ');
          return 'Dùi chuông giáng xuống. Quả chuông vỡ thành vạn mảnh sáng, rơi xuống khắp các cõi như mưa sao. Từ nay không ai đếm nữa. Mỗi mảnh phải tự nhớ lấy mình.';
        },
      },
    ],
  },
  {
    id: 'tien_duyen_dau',
    minAge: 4,
    maxAge: 12,
    once: true,
    weight: 600,
    when: (c) => c.lifeNo === 1,
    title: 'Tiên duyên đầu đời',
    text: () => 'Một lão nhân râu tóc bạc phơ dừng chân trước cửa nhà bạn, nhìn bạn rất lâu: "Đứa trẻ này có tiên cốt. Ta để lại cho con một món quà, con chọn đi."',
    choices: () => [
      {
        label: 'Cuốn bí kíp ố vàng',
        hint: 'ngộ tính +15, tu vi +',
        lean: 'trung',
        run: (c) => {
          stat(c, 'ngoTinh', 15);
          addCult(c, reward(c, 1.5));
          return 'Bạn lật trang đầu, chữ như tự chui vào đầu. Từ đó bạn học gì cũng nhanh.';
        },
      },
      {
        label: 'Một con linh thú nhỏ',
        hint: 'có thú cưng ngay',
        lean: 'chinh',
        run: (c, ctx) => {
          const pool = PET_IDS.slice(0, 12);
          const id = pool[Math.floor(ctx.rnd() * pool.length)];
          adopt(c, id, ctx);
          return `Lão nhân thả xuống một con ${PETS[id].name}. Nó dụi đầu vào chân bạn như đã quen từ kiếp trước.`;
        },
      },
      {
        label: 'Túi gấm và một lời chúc',
        hint: 'khí vận +15, +300 linh thạch',
        lean: 'trung',
        run: (c, ctx) => {
          stat(c, 'khiVan', 15);
          money(c, 300);
          ctx.fx('coin', '+300');
          return 'Trong túi gấm có ba trăm linh thạch và một lá bùa. Lão nhân cười: "Phúc của con còn dài."';
        },
      },
    ],
  },
  {
    id: 'than_binh_nhan_chu',
    minAge: 12,
    once: true,
    weight: 500,
    when: (c) => !!c.legend,
    title: 'Thần binh nhận chủ',
    text: (c) =>
      `Đêm ấy, ngoài sân có tiếng ngân dài như rồng ngâm. Một thanh binh khí cắm thẳng xuống đất, chuôi còn rung: chính là ${c.legend!.name}, thần binh bạn đã mang qua ${c.legend!.lv} kiếp.`,
    choices: (c) => [
      {
        label: 'Rút thần binh lên',
        hint: 'thần binh mạnh thêm một bậc',
        lean: 'trung',
        run: (ch, ctx) => {
          const L = ch.legend!;
          giveItem(ch, L.item, true);
          ctx.fx('layer', L.name);
          return `${L.name} nhận ra chủ cũ, kiếm khí bao trùm cả sân. Mỗi kiếp truyền qua, nó lại mạnh thêm (công +${Math.min(10, L.lv) * 8}%).`;
        },
      },
      {
        label: 'Để nó yên nghỉ',
        hint: 'tâm cảnh +, mất thần binh',
        lean: 'chinh',
        run: (ch) => {
          stat(ch, 'tamCanh', 12);
          ch.legend = null;
          return `Bạn chắp tay vái ${c.legend!.name}. Thần binh rung lên một hồi rồi chìm vào lòng đất.`;
        },
      },
    ],
  },
];

export const legendItemName = (id: string) => ITEMS.find((i) => i.id === id)?.name ?? id;
