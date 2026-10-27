import { realmName } from './data';
import { addCult, addPill, dao, fatal, giveItem, hurt, luck, money, reward, stat } from './helpers';
import { joinSect, promote, rankByRoot, rankName, rankOf } from './sect';
import type { Character, Choice, GameEvent } from './types';

/**
 * 3.1.0: bốn tông môn mới (Phổ Đà Sơn, Kiếm Cốc, Vạn Độc Môn, Yêu Thần Điện) và chuỗi nhập Ma giới.
 * Tông mới chỉ mời người chưa có tông, đã chọn con đường hợp với tông.
 */

const free = (c: Character) => !c.sect && !c.cosmos && c.realm >= 1 && c.realm <= 4;
const decline = (text: string): Choice => ({
  label: 'Từ chối, tiếp tục làm tán tu',
  lean: 'trung',
  run: (c) => {
    stat(c, 'tamCanh', 2);
    return text;
  },
});
const totalKills = (c: Character) => Object.values(c.kills ?? {}).reduce((a, b) => a + b, 0);

export const SECT_EVENTS2: GameEvent[] = [
  // ================= Bái sư =================
  {
    id: 'bai_pho_da',
    minAge: 12,
    once: true,
    weight: 70,
    when: (c) => free(c) && (c.path === 'phat' || c.daoTam >= 40),
    title: 'Chuông sớm Phổ Đà Sơn',
    text: () => 'Một vị lão tăng chống tích trượng đi ngang, dừng lại nhìn bạn rất lâu: "Thí chủ có tuệ căn. Phổ Đà Sơn ngoài biển Đông còn thiếu một người thắp đèn."',
    choices: () => [
      {
        label: 'Theo lão tăng ra đảo',
        hint: 'chính phái · tâm ma tăng chậm · cấm sát sinh',
        lean: 'chinh',
        run: (c, ctx) => {
          const rank = Math.min(3, Math.max(1, rankByRoot(c.linhCanMul)) + (c.path === 'phat' ? 1 : 0));
          joinSect(c, 'Phổ Đà Sơn', rank);
          dao(c, 8);
          stat(c, 'tamMa', -8);
          addCult(c, reward(c, 0.4));
          ctx.fx('buy', rankName(c));
          return `Bạn cạo tóc dưới gốc bồ đề, thành ${rankName(c)} Phổ Đà Sơn. Mỗi sáng tụng kinh, tâm ma khó lòng xâm nhập. Nhưng giới luật nghiêm: diệt yêu quá tay sẽ bị Giới luật viện gọi lên.`;
        },
      },
      decline('Lão tăng chắp tay, không nói thêm. Tiếng chuông xa dần về phía biển.'),
    ],
  },
  {
    id: 'bai_kiem_coc',
    minAge: 12,
    once: true,
    weight: 28,
    when: (c) => free(c) && c.path === 'kiem',
    title: 'Kiếm Cốc mở cửa',
    text: () => 'Trên vách đá Kiếm Cốc cắm chín nghìn thanh kiếm cổ. Ai rút được một thanh thì được nhận làm đệ tử. Hôm nay cốc mở cửa.',
    choices: () => [
      {
        label: 'Thử rút kiếm',
        hint: 'chính phái · Đại bỉ 3 năm một lần',
        lean: 'trung',
        run: (c, ctx) => {
          const p = luck(c, 0.55 + c.stats.ngoTinh / 300);
          if (ctx.rnd() >= p) {
            stat(c, 'tamCanh', -4);
            stat(c, 'sucKhoe', -6);
            return 'Bạn dồn hết sức mà thanh kiếm không nhúc nhích. Kiếm khí phản chấn làm bạn ho ra máu. Kiếm Cốc đóng cửa, ba năm sau mới mở lại.';
          }
          const rank = Math.max(1, rankByRoot(c.linhCanMul));
          joinSect(c, 'Kiếm Cốc', rank);
          addCult(c, reward(c, 0.5));
          stat(c, 'ngoTinh', 4);
          ctx.fx('breakthrough', rankName(c));
          return `Thanh kiếm rỉ sét rời vách đá với một tiếng ngân dài. Bạn thành ${rankName(c)} Kiếm Cốc. Ở đây ba năm một lần Đại bỉ, thắng là lên bậc.`;
        },
      },
      decline('Bạn đứng nhìn người khác rút kiếm, rồi quay đi. Kiếm của mình, tự mình rèn.'),
    ],
  },
  {
    id: 'bai_van_doc',
    minAge: 12,
    once: true,
    weight: 32,
    when: (c) => free(c) && (c.path === 'dan' || c.path === 'ma') && c.daoTam <= 10,
    title: 'Thư mời của Vạn Độc Môn',
    text: () => 'Sáng ra, trên bàn có một phong thư tẩm hương lạ, chữ viết bằng mực xanh lục: "Tay luyện đan của ngươi phí ở chốn này. Vạn Độc Môn đợi ở Hắc Thủy Đàm."',
    choices: () => [
      {
        label: 'Tới Hắc Thủy Đàm',
        hint: 'tà phái · luyện độc đan, thử độc',
        lean: 'ta',
        run: (c, ctx) => {
          joinSect(c, 'Vạn Độc Môn', Math.max(1, rankByRoot(c.linhCanMul)));
          dao(c, -10);
          addPill(c, 'tu_khi', 1);
          money(c, 80);
          ctx.fx('evil', 'Vạn Độc Môn');
          return `Môn chủ đưa bạn một chén nước xanh: "Uống đi. Sống thì là người nhà." Bạn uống, sống, thành ${rankName(c)} Vạn Độc Môn.`;
        },
      },
      {
        label: 'Đốt thư',
        lean: 'chinh',
        run: (c) => {
          dao(c, 4);
          stat(c, 'sucKhoe', -3);
          return 'Thư cháy ra khói xanh, bạn hít phải, ho mất ba ngày.';
        },
      },
    ],
  },
  {
    id: 'bai_yeu_than',
    minAge: 10,
    once: true,
    weight: 50,
    when: (c) => free(c) && (c.race === 'yeu' || c.path === 'yeu'),
    title: 'Tiếng gọi của Yêu Thần Điện',
    text: () => 'Trăng đỏ. Huyết mạch trong người bạn sôi lên. Từ sâu trong Vạn Yêu Lâm, có tiếng tù và gọi: Yêu Thần Điện nhận mọi yêu tộc, không hỏi linh căn.',
    choices: () => [
      {
        label: 'Theo tiếng tù và',
        hint: 'tà phái · không xét linh căn',
        lean: 'ta',
        run: (c, ctx) => {
          joinSect(c, 'Yêu Thần Điện', c.realm >= 2 ? 2 : 1);
          dao(c, -6);
          stat(c, 'sucKhoe', 10);
          addCult(c, reward(c, 0.4));
          ctx.fx('buy', rankName(c));
          return `Đại điện dựng bằng xương thú cổ. Yêu Thần không hỏi bạn từ đâu tới, chỉ hỏi bạn dám cắn ai. Bạn thành ${rankName(c)} Yêu Thần Điện.`;
        },
      },
      decline('Bạn bịt tai lại. Tiếng tù và vang đến sáng rồi tắt.'),
    ],
  },

  // ================= Phổ Đà Sơn =================
  {
    id: 'pd_gioi_luat',
    minAge: 12,
    weight: 120,
    cooldown: 5,
    when: (c) => c.sect === 'Phổ Đà Sơn' && !c.cosmos && c.focus === 'tru_yeu' && totalKills(c) >= 10,
    title: 'Giới luật viện',
    text: () => 'Giới luật viện gọi bạn lên. Thủ tọa gõ mõ ba tiếng: "Sát nghiệp trên người ngươi nặng rồi. Phổ Đà Sơn không phải đất của đồ tể."',
    choices: () => [
      {
        label: 'Sám hối, chép kinh trăm ngày',
        hint: 'mất tiền, tâm ma giảm',
        lean: 'chinh',
        run: (c) => {
          money(c, -Math.min(c.linhThach, 50 + c.realm * 30));
          stat(c, 'tamMa', -8);
          dao(c, 5);
          return 'Bạn chép kinh tới mỏi tay, nộp tiền đèn dầu cho chùa. Lòng nhẹ đi, túi cũng nhẹ đi.';
        },
      },
      {
        label: '"Yêu hại người, giết là cứu người"',
        hint: 'cãi lại, có thể bị giáng bậc',
        lean: 'trung',
        run: (c, ctx) => {
          if (ctx.rnd() < 0.5 && (c.sectRank ?? 1) > 0) {
            c.sectRank = (c.sectRank ?? 1) - 1;
            stat(c, 'tamMa', 4);
            return `Thủ tọa lắc đầu: "Còn chấp." Bạn bị giáng làm ${rankName(c)}.`;
          }
          stat(c, 'ngoTinh', 5);
          return 'Thủ tọa im lặng rất lâu, rồi cười: "Cũng là một cách hiểu." Ông cho bạn lui, không phạt.';
        },
      },
    ],
  },
  {
    id: 'pd_giang_kinh',
    minAge: 12,
    weight: 10,
    cooldown: 8,
    when: (c) => c.sect === 'Phổ Đà Sơn' && !c.cosmos,
    title: 'Pháp hội Triều Âm',
    text: () => 'Sóng vỗ vào Triều Âm Động. Phương trượng mở pháp hội, giảng một bộ kinh trăm năm mới giảng một lần.',
    choices: () => [
      {
        label: 'Ngồi nghe trọn ba ngày',
        hint: 'ngộ tính, tâm cảnh',
        lean: 'chinh',
        run: (c, ctx) => {
          stat(c, 'ngoTinh', 5);
          stat(c, 'tamCanh', 6);
          stat(c, 'tamMa', -6);
          if (ctx.rnd() < 0.3) return `Tới câu cuối, bạn bỗng hiểu ra. ${promote(c, ctx, 'Phương trượng thấy ánh mắt bạn, gật đầu.') ?? 'Phương trượng gật đầu với bạn.'}`;
          return 'Tiếng kinh hòa vào tiếng sóng. Ba ngày như một hơi thở.';
        },
      },
      {
        label: 'Lẻn ra bãi đá tu luyện',
        hint: 'tu vi',
        lean: 'trung',
        run: (c) => {
          addCult(c, reward(c, 0.5));
          return 'Bãi đá vắng người, linh khí biển dồi dào. Bạn tu được một mạch dài.';
        },
      },
    ],
  },

  // ================= Kiếm Cốc =================
  {
    id: 'kc_kiem_trung',
    minAge: 14,
    weight: 10,
    cooldown: 8,
    when: (c) => c.sect === 'Kiếm Cốc' && !c.cosmos,
    title: 'Kiếm Trủng',
    text: () => 'Sâu trong Kiếm Cốc là Kiếm Trủng, mộ của những thanh kiếm đã gãy. Đêm nay kiếm khí trong mộ dâng lên, đệ tử nào cũng có thể vào ngộ kiếm.',
    choices: () => [
      {
        label: 'Vào sâu nhất',
        hint: 'tu vi lớn, có thể bị kiếm khí làm bị thương',
        lean: 'trung',
        run: (c, ctx) => {
          if (ctx.rnd() < luck(c, 0.6)) {
            addCult(c, reward(c, 1));
            stat(c, 'ngoTinh', 4);
            return 'Một sợi kiếm ý cổ chui vào thức hải bạn. Bạn ngồi đó tới sáng, kiếm pháp tiến một tầng.';
          }
          return 'Kiếm khí cuồn cuộn như bão. Bạn chạy ra được nhưng người đầy vết cắt.' + hurt(c, 18, ctx);
        },
      },
      {
        label: 'Ngồi ở rìa, ngộ chậm mà chắc',
        hint: 'tu vi vừa',
        lean: 'chinh',
        run: (c) => {
          addCult(c, reward(c, 0.45));
          stat(c, 'tamCanh', 3);
          return 'Bạn ngồi ở rìa mộ, nghe kiếm khí rít như gió. Không nhiều, nhưng không mất gì.';
        },
      },
    ],
  },
  {
    id: 'kc_khach_luan_kiem',
    minAge: 14,
    weight: 8,
    cooldown: 10,
    when: (c) => c.sect === 'Kiếm Cốc' && !c.cosmos && rankOf(c) >= 1,
    title: 'Khách tới luận kiếm',
    text: () => 'Một kiếm khách áo đen đứng trước cửa cốc, đòi đấu với đệ tử Kiếm Cốc mạnh nhất. Trưởng lão nhìn quanh rồi nhìn bạn.',
    choices: () => [
      {
        label: 'Bước ra nhận đấu',
        hint: 'thắng được thăng bậc',
        lean: 'trung',
        run: (c, ctx) => {
          if (ctx.rnd() < luck(c, 0.5 + c.realm * 0.03)) {
            stat(c, 'khiVan', 4);
            return `Kiếm khách lùi ba bước, tra kiếm vào vỏ: "Kiếm Cốc còn người." ${promote(c, ctx, 'Cả cốc reo hò.') ?? 'Trưởng lão thưởng cho bạn một bình đan.'}`;
          }
          return 'Một kiếm. Chỉ một kiếm, bạn đã thua. Kiếm khách bỏ đi không nói một lời.' + hurt(c, 15, ctx);
        },
      },
      {
        label: 'Nhường sư huynh',
        lean: 'chinh',
        run: (c) => {
          stat(c, 'ngoTinh', 3);
          return 'Bạn đứng xem từ đầu tới cuối. Thua, nhưng học được nhiều.';
        },
      },
    ],
  },

  // ================= Vạn Độc Môn =================
  {
    id: 'vd_thu_doc',
    minAge: 12,
    weight: 12,
    cooldown: 5,
    when: (c) => c.sect === 'Vạn Độc Môn' && !c.cosmos,
    title: 'Thử độc',
    text: () => 'Lò độc đan mới ra. Trưởng lão cần người thử: "Sống qua được thì độc lực hóa tu vi. Không qua được thì... môn ta thiếu gì người."',
    choices: () => [
      {
        label: 'Uống',
        hint: 'tu vi lớn, mất sức khỏe, có thể chết',
        lean: 'ta',
        run: (c, ctx) => {
          addCult(c, reward(c, 1.1));
          stat(c, 'tamMa', 3);
          const f = fatal(c, ctx, 0.04, 'Độc đan quá mạnh. Bạn co giật một đêm rồi tắt thở, mặt xanh như lá.');
          if (c.dead) return f ?? '';
          return 'Ruột gan như bị lửa xanh thiêu. Ba ngày sau tỉnh dậy, tu vi đã tăng vọt.' + hurt(c, 22, ctx);
        },
      },
      {
        label: 'Đẩy cho tên dược nô bên cạnh',
        hint: 'tà, được chia công',
        lean: 'ta',
        run: (c) => {
          dao(c, -8);
          addCult(c, reward(c, 0.3));
          return 'Tên dược nô uống, ngã vật ra. Trưởng lão ghi công cho bạn vì "tìm được người thử".';
        },
      },
      {
        label: 'Xin để lần sau',
        lean: 'trung',
        run: () => 'Trưởng lão cười khẩy, không nói gì.',
      },
    ],
  },
  {
    id: 'vd_doc_dan',
    minAge: 12,
    weight: 9,
    cooldown: 8,
    when: (c) => c.sect === 'Vạn Độc Môn' && !c.cosmos && rankOf(c) >= 1,
    title: 'Độc đan bán chợ đen',
    text: () => 'Mẻ độc đan dư ra mười viên. Chợ đen dưới núi trả giá cao, nhưng mua về để làm gì thì ai cũng biết.',
    choices: () => [
      {
        label: 'Bán hết',
        hint: 'nhiều linh thạch, nghiêng tà',
        lean: 'ta',
        run: (c) => {
          dao(c, -6);
          money(c, 120 + c.realm * 60);
          return 'Túi bạn nặng thêm. Mấy tháng sau, dưới núi có thêm vài đám tang.';
        },
      },
      {
        label: 'Luyện thành giải dược đem cho',
        hint: 'mất công, nghiêng chính',
        lean: 'chinh',
        run: (c) => {
          dao(c, 8);
          stat(c, 'ngoTinh', 3);
          return 'Bạn đảo ngược dược tính, thành mười viên giải độc, đem cho làng bị dịch. Môn chủ biết chuyện, nhìn bạn rất lạ.';
        },
      },
    ],
  },

  // ================= Yêu Thần Điện =================
  {
    id: 'yt_huyet_te',
    minAge: 10,
    weight: 10,
    cooldown: 8,
    when: (c) => c.sect === 'Yêu Thần Điện' && !c.cosmos,
    title: 'Huyết tế Yêu Thần',
    text: () => 'Đêm trăng tròn, cả điện quỳ trước tượng Yêu Thần. Ai dám nhỏ máu lên tượng sẽ được huyết mạch tổ tiên thức tỉnh thêm một phần.',
    choices: () => [
      {
        label: 'Nhỏ máu lên tượng',
        hint: 'sức khỏe, tu vi, tâm ma',
        lean: 'ta',
        run: (c, ctx) => {
          addCult(c, reward(c, 0.8));
          stat(c, 'sucKhoe', 8);
          stat(c, 'tamMa', 5);
          if (ctx.rnd() < 0.3) return `Mắt tượng sáng lên một thoáng. ${promote(c, ctx, 'Điện chủ quỳ xuống trước bạn.') ?? 'Điện chủ nhìn bạn đầy kính nể.'}`;
          return 'Máu thấm vào đá. Bạn nghe tiếng gầm của tổ tiên vọng lên trong xương.';
        },
      },
      {
        label: 'Chỉ quỳ lạy',
        lean: 'trung',
        run: (c) => {
          stat(c, 'tamCanh', 3);
          return 'Bạn quỳ tới sáng. Tượng không động, lòng bạn cũng không.';
        },
      },
    ],
  },
  {
    id: 'yt_san_nguoi',
    minAge: 12,
    weight: 8,
    cooldown: 10,
    when: (c) => c.sect === 'Yêu Thần Điện' && !c.cosmos && rankOf(c) >= 1,
    title: 'Lệnh săn',
    text: () => 'Yêu tướng truyền lệnh: một đoàn tu sĩ nhân tộc đi qua Vạn Yêu Lâm, trên người họ có linh dược. Yêu Thần Điện muốn cả người lẫn đồ.',
    choices: () => [
      {
        label: 'Dẫn đầu cuộc săn',
        hint: 'linh thạch, thăng bậc, nghiêng tà',
        lean: 'ta',
        run: (c, ctx) => {
          dao(c, -10);
          money(c, 100 + c.realm * 50);
          if (ctx.rnd() < luck(c, 0.45)) return `Cả đoàn không ai thoát. ${promote(c, ctx, 'Yêu tướng vỗ vai bạn.') ?? ''}`;
          return 'Đoàn người bỏ chạy để lại hành lý. Bạn bị một nhát kiếm ở vai.' + hurt(c, 15, ctx);
        },
      },
      {
        label: 'Lén báo cho đoàn người đổi đường',
        hint: 'nghiêng chính, có thể bị phát hiện',
        lean: 'chinh',
        run: (c, ctx) => {
          dao(c, 10);
          if (ctx.rnd() < 0.3) {
            if ((c.sectRank ?? 1) > 0) c.sectRank = (c.sectRank ?? 1) - 1;
            return `Có kẻ thấy bạn. Bạn bị giáng làm ${rankName(c)}, bị đánh ba mươi roi.`;
          }
          return 'Đoàn người đổi đường trong đêm. Sáng ra, yêu tướng đập nát cả một gốc cây vì tức.';
        },
      },
    ],
  },

  // ================= Chuỗi nhập Ma giới =================
  {
    id: 'ma_chuoi_huyet_tri',
    cosmos: 'ma',
    once: true,
    weight: 500,
    when: (c) => (c.maStep ?? 0) === 0,
    title: 'Huyết Trì tẩy thân',
    text: (c) => `Kẻ mới tới Ma giới phải xuống Huyết Trì, rửa sạch hơi người. Bọt máu sôi lục bục dưới chân ${realmName(c.realm, 'ma')} mới.`,
    choices: () => [
      {
        label: 'Ngâm bảy ngày bảy đêm',
        hint: 'tu vi lớn, tâm ma +',
        lean: 'ta',
        run: (c, ctx) => {
          c.maStep = 1;
          c.maAt = Math.floor(c.age);
          addCult(c, reward(c, 1));
          stat(c, 'sucKhoe', 10);
          stat(c, 'tamMa', 10);
          ctx.fx('evil', 'Huyết Trì');
          return 'Máu thấm vào tận tủy. Bước lên bờ, da bạn đỏ như than, ma khí cuộn quanh người. (Bước 1/4)';
        },
      },
      {
        label: 'Ngâm một ngày rồi lên',
        hint: 'vừa đủ',
        lean: 'trung',
        run: (c) => {
          c.maStep = 1;
          c.maAt = Math.floor(c.age);
          addCult(c, reward(c, 0.4));
          stat(c, 'tamMa', 3);
          return 'Bạn lên bờ sớm. Ma binh gác Huyết Trì cười nhạo, nhưng đầu bạn vẫn còn tỉnh. (Bước 1/4)';
        },
      },
    ],
  },
  {
    id: 'ma_chuoi_nhan_chu',
    cosmos: 'ma',
    once: true,
    weight: 500,
    minAge: 0,
    when: (c) => c.maStep === 1 && c.age - (c.maAt ?? 0) >= 3,
    title: 'Nhận chủ',
    text: () => 'Ở Ma giới, kẻ không có chủ chỉ là thịt. Ba vị Ma quân gửi thiệp mời cùng một đêm.',
    choices: () => [
      {
        label: 'Huyết Ma Quân',
        hint: 'tu luyện nhanh hơn 12% cả kiếp',
        lean: 'ta',
        run: (c) => {
          c.maStep = 2;
          c.maAt = Math.floor(c.age);
          c.maLord = 'huyet';
          stat(c, 'tamMa', 4);
          return 'Huyết Ma Quân rạch tay, nhỏ một giọt máu lên trán bạn. Từ nay ma công của bạn chạy nhanh hơn. (Bước 2/4)';
        },
      },
      {
        label: 'Cốt Ma Quân',
        hint: 'mỗi năm hồi sức khỏe, tâm ma giảm',
        lean: 'trung',
        run: (c) => {
          c.maStep = 2;
          c.maAt = Math.floor(c.age);
          c.maLord = 'cot';
          stat(c, 'sucKhoe', 10);
          return 'Cốt Ma Quân gõ lên xương sống bạn ba cái. Thân thể bạn cứng như đá, lòng cũng lặng hơn. (Bước 2/4)';
        },
      },
      {
        label: 'Ảnh Ma Quân',
        hint: 'khí vận +, mỗi năm có thể nhặt được của',
        lean: 'trung',
        run: (c) => {
          c.maStep = 2;
          c.maAt = Math.floor(c.age);
          c.maLord = 'anh';
          stat(c, 'khiVan', 10);
          return 'Ảnh Ma Quân không hiện thân, chỉ có bóng của bạn khẽ gật đầu. Từ nay bóng bạn biết đường tới chỗ có của. (Bước 2/4)';
        },
      },
    ],
  },
  {
    id: 'ma_chuoi_dia_ban',
    cosmos: 'ma',
    once: true,
    weight: 500,
    when: (c) => c.maStep === 2 && c.age - (c.maAt ?? 0) >= 5,
    title: 'Tranh địa bàn',
    text: (c) => `Một ${realmName(c.realm, 'ma')} khác chiếm khe Huyết Phong, thu linh thạch của cả vùng. Chủ của bạn nói: "Muốn có chỗ đứng thì giành lấy."`,
    choices: () => [
      {
        label: 'Đánh chiếm Huyết Phong',
        hint: 'thắng: thu linh thạch mỗi năm · thua: trọng thương',
        lean: 'ta',
        run: (c, ctx) => {
          c.maStep = 3;
          c.maAt = Math.floor(c.age);
          if (ctx.rnd() < luck(c, 0.5 + (c.stats.sucKhoe - 50) / 300)) {
            c.maLand = 1;
            money(c, 300);
            ctx.fx('breakthrough', 'Huyết Phong');
            return 'Đối thủ quỳ xuống, dâng ấn khe Huyết Phong. Từ nay mỗi năm vùng này nộp linh thạch cho bạn. (Bước 3/4)';
          }
          return 'Bạn thua, bị đá văng khỏi khe. Ở Ma giới, thua một lần chưa chết là may. (Bước 3/4)' + hurt(c, 35, ctx);
        },
      },
      {
        label: 'Thương lượng chia đôi',
        hint: 'thu ít hơn, không phải đánh',
        lean: 'trung',
        run: (c) => {
          c.maStep = 3;
          c.maAt = Math.floor(c.age);
          if (c.stats.ngoTinh + c.stats.khiVan >= 110) {
            c.maLand = 0.5;
            return 'Hắn cân nhắc rất lâu rồi gật đầu. Mỗi năm bạn được nửa phần thu của Huyết Phong. (Bước 3/4)';
          }
          stat(c, 'tamCanh', -4);
          return 'Hắn cười vào mặt bạn: "Ma giới không có chữ chia." Bạn ra về tay trắng. (Bước 3/4)';
        },
      },
    ],
  },
  {
    id: 'ma_chuoi_ma_de',
    cosmos: 'ma',
    once: true,
    weight: 500,
    when: (c) => c.maStep === 3 && c.age - (c.maAt ?? 0) >= 6,
    title: 'Ma Đế triệu kiến',
    text: () => 'Hắc kỳ cắm trước cửa nhà bạn: Ma Đế triệu kiến. Từ trước tới nay, kẻ mới lên được gọi vào Vạn Ma Điện không quá mười người.',
    choices: (c) => [
      {
        label: 'Vào điện, quỳ một gối',
        hint: 'nhận danh hiệu và bảo vật theo con đường tu',
        lean: 'ta',
        run: (ch, ctx) => {
          ch.maStep = 4;
          ch.maAt = Math.floor(ch.age);
          const titles: Record<string, string> = {
            kiem: 'Huyết Kiếm Ma Soái',
            dan: 'Độc Đan Ma Sư',
            phat: 'Phản Phật Ma Tăng',
            ma: 'Vạn Huyết Ma Soái',
            yeu: 'Yêu Ma Đại Tướng',
          };
          ch.maTitle = titles[ch.path ?? ''] ?? 'Ma Soái';
          const gift = ch.path === 'kiem' || ch.path === 'ma' ? 'tam_dau_trao' : ch.path === 'phat' || ch.path === 'yeu' ? 'ma_binh_giap' : 'cuu_u_ma_vu';
          const had = ch.inventory.includes(gift);
          if (had) money(ch, 1500);
          else giveItem(ch, gift, false);
          ctx.fx('breakthrough', ch.maTitle);
          return `Ma Đế phong bạn làm ${ch.maTitle}. ${had ? 'Bảo vật bạn đã có, Ma Đế đổi thành 1.500 linh thạch.' : 'Ngài ban thêm một món bảo vật, mở Túi đồ để xem.'} (Bước 4/4, xong chuỗi nhập Ma giới)`;
        },
      },
      {
        label: 'Đứng thẳng, không quỳ',
        hint: 'khí vận +, Ma Đế có thể nổi giận',
        lean: 'trung',
        run: (ch, ctx) => {
          ch.maStep = 4;
          ch.maAt = Math.floor(ch.age);
          if (ctx.rnd() < 0.5) {
            ch.maTitle = 'Ma Giới Cuồng Nhân';
            stat(ch, 'khiVan', 12);
            addCult(ch, reward(ch, 1));
            return `Ma Đế cười to tới rung cả điện: "Lâu lắm mới thấy kẻ không quỳ." Ngài gọi bạn là ${ch.maTitle}. (Bước 4/4)`;
          }
          return 'Ma Đế không nói gì, chỉ phẩy tay. Bạn bị hất văng ra ngoài điện.' + hurt(ch, 40, ctx) + ' (Bước 4/4)';
        },
      },
    ],
  },
];

/** Mỗi năm ở Ma giới: quyền lợi của Ma quân và địa bàn */
export function maChainYear(c: Character, rnd: () => number): string | null {
  if (c.cosmos !== 'ma') return null;
  if (c.maLord === 'cot') {
    stat(c, 'sucKhoe', 2);
    stat(c, 'tamMa', -1);
  }
  let out: string | null = null;
  if (c.maLand) {
    const g = Math.round((60 + (c.realm - 7) * 40) * c.maLand);
    money(c, g);
  }
  if (c.maLord === 'anh' && rnd() < 0.12) {
    const g = 100 + (c.realm - 7) * 80;
    money(c, g);
    out = `Bóng của bạn dẫn tới một ma huyệt bỏ hoang, trong có ${g} linh thạch.`;
  }
  return out;
}
