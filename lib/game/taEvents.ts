import { addCult, dao, fatal, giveItem, hurt, money, reward, stat } from './helpers';
import type { GameEvent } from './types';
import { tr } from '../i18n';

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
    title: tr('Tâm ma cuộn trào', "Heart demon surging"),
    text: (c) => tr(`Tâm ma đã lên ${Math.round(c.stats.tamMa)}. Đêm nào cũng có giọng nói thì thầm trong đầu, mắt bạn đỏ ngầu. Ma đạo có cách trị tâm ma, nhưng cái giá luôn là máu.`, `Your heart demon has reached ${Math.round(c.stats.tamMa)}. Every night a voice whispers in your head, and your eyes are bloodshot. The Demonic Path has ways to cure heart demons, but the price is always blood.`),
    choices: () => [
      {
        label: tr('Huyết tế bản thân', "Blood-sacrifice yourself"),
        hint: tr('tâm ma -35, sức khỏe -20', "heart demon -35, Health -20"),
        lean: 'ta',
        run: (c, ctx) => {
          stat(c, 'tamMa', -35);
          stat(c, 'sucKhoe', -20);
          ctx.fx('evil', tr('Huyết tế', "Blood sacrifice"));
          return tr('Bạn rạch tay, để máu chảy vào trận huyết tế. Giọng nói trong đầu im bặt.', "You slit your hand and let the blood flow into the sacrificial array. The voice in your head goes silent.");
        },
      },
      {
        label: tr('Hút sinh khí một kẻ lạ', "Drain a stranger's life force"),
        hint: tr('tâm ma -30, đạo tâm -6, có thể bị truy sát', "heart demon -30, Yao Heart -6, may be hunted"),
        lean: 'ta',
        run: (c, ctx) => {
          stat(c, 'tamMa', -30);
          dao(c, -6);
          ctx.fx('evil', tr('Hút sinh khí', "Life drain"));
          if (ctx.rnd() < 0.2) {
            const h = hurt(c, 18, ctx);
            return tr(`Bạn hút cạn sinh khí một tên lữ khách. Người nhà hắn kéo đến báo thù, bạn đánh lui nhưng mang thương.${h}`, `You drain a traveler dry. His family comes for revenge; you drive them off, but not unscathed.${h}`);
          }
          return tr('Một tên lữ khách ngã xuống bên đường. Tâm ma của bạn no nê, lặng đi như con thú vừa ăn.', "A traveler falls by the roadside. Your heart demon is sated, quiet as a beast after its meal.");
        },
      },
      {
        label: tr('Tĩnh tọa áp chế', "Sit and suppress it"),
        hint: tr('tâm ma -12, tu vi giảm', "heart demon -12, cultivation down"),
        lean: 'trung',
        run: (c) => {
          stat(c, 'tamMa', -12);
          c.cultivation = Math.round(c.cultivation * 0.9);
          return tr('Bạn ngồi suốt bảy ngày, dùng chân khí đè tâm ma xuống. Tu vi hao đi một ít.', "You sit for seven days, pressing the heart demon down with true qi. Some cultivation is spent.");
        },
      },
    ],
  },
  {
    id: 'ta_ma_dien',
    minRealm: 1,
    once: true,
    weight: 6,
    title: tr('Ma điển trong hang', "Demonic scripture in a cave"),
    text: () => tr('Trong một hang đá ẩm thấp, bạn thấy bộ xương ôm chặt cuốn sách bọc da người. Trang đầu viết bằng máu: "Thiên Ma Giải Thể Đại Pháp".', "In a damp stone cave, you find a skeleton clutching a book bound in human skin. The first page is written in blood: \"Heavenly Demon Body-Dissolution Great Art\"."),
    choices: () => [
      {
        label: tr('Luyện ngay tại chỗ', "Practice it on the spot"),
        hint: tr('tu vi tăng vọt, tâm ma +, đạo tâm -', "cultivation soars, heart demon +, Yao Heart -"),
        lean: 'ta',
        run: (c, ctx) => {
          addCult(c, reward(c, 2.5));
          stat(c, 'tamMa', 12);
          dao(c, -10);
          ctx.fx('evil', tr('Ma công', "Demonic art"));
          const f = fatal(c, ctx, 0.04, tr('Ma công phản phệ ngay lần luyện đầu. Bạn hóa thành một bộ xương nữa trong hang.', "The demonic art backfires on your first attempt. You become one more skeleton in the cave."));
          return tr(`Ma khí tràn vào kinh mạch, tu vi bạn tăng vọt.${f ?? ''}`, `Demonic qi floods your meridians, and your cultivation soars.${f ?? ''}`);
        },
      },
      {
        label: tr('Mang nộp cho chính phái', "Hand it to a righteous sect"),
        hint: tr('đạo tâm +, linh thạch', "Yao Heart +, spirit stones"),
        lean: 'chinh',
        run: (c, ctx) => {
          dao(c, 10);
          money(c, 200);
          stat(c, 'khiVan', 3);
          ctx.fx('coin', '+200');
          return tr('Chưởng môn chính phái cảm tạ, thưởng hai trăm linh thạch rồi đem sách đi đốt.', "The righteous Sect Leader thanks you, rewards two hundred spirit stones, then burns the book.");
        },
      },
      {
        label: tr('Đốt đi', "Burn it"),
        hint: tr('tâm cảnh +', "Mind +"),
        lean: 'trung',
        run: (c) => {
          stat(c, 'tamCanh', 6);
          return tr('Cuốn sách cháy rất lâu, khói đen bốc lên thành hình mặt người.', "The book burns for a long time; the black smoke rises in the shape of a human face.");
        },
      },
    ],
  },
  {
    id: 'ta_cuop_tieu',
    minAge: 16,
    cooldown: 12,
    weight: 6,
    title: tr('Đoàn tiêu xa đi ngang', "An escort caravan passes"),
    text: () => tr('Một đoàn tiêu xa chở đầy hòm gỗ đi qua khe núi. Tiêu sư đầu đàn đã già, đám tiêu cục ngáp dài.', "An escort caravan loaded with wooden chests passes through the gorge. The lead escort is old, and his men are yawning."),
    choices: () => [
      {
        label: tr('Chặn đường cướp tiêu', "Rob the caravan"),
        hint: tr('nhiều linh thạch, đạo tâm -, có thể bị thương', "lots of spirit stones, Yao Heart -, may be hurt"),
        lean: 'ta',
        run: (c, ctx) => {
          const m = 300 + c.realm * 150;
          money(c, m);
          dao(c, -12);
          ctx.fx('coin', `+${m}`);
          if (ctx.rnd() < 0.2) return tr(`Bạn cướp được ${m} linh thạch, nhưng lão tiêu sư liều mạng chém một đao.${hurt(c, 15, ctx)}`, `You grab ${m} spirit stones, but the old escort lands a desperate saber blow.${hurt(c, 15, ctx)}`);
          return tr(`Đám tiêu cục bỏ chạy tán loạn. Bạn mở hòm: ${m} linh thạch.`, `The escorts scatter in panic. You open a chest: ${m} spirit stones.`);
        },
      },
      {
        label: tr('Xin đi hộ tống', "Offer to guard it"),
        hint: tr('linh thạch, đạo tâm +, có thể bị thương', "spirit stones, Yao Heart +, may be hurt"),
        lean: 'chinh',
        run: (c, ctx) => {
          const m = 120 + c.realm * 60;
          money(c, m);
          dao(c, 6);
          ctx.fx('coin', `+${m}`);
          if (ctx.rnd() < 0.2) return tr(`Dọc đường gặp sơn tặc, bạn đánh lui nhưng trúng một mũi tên. Tiêu cục trả công ${m} linh thạch.${hurt(c, 15, ctx)}`, `Bandits ambush you on the road; you drive them off but take an arrow. The escort agency pays you ${m} spirit stones.${hurt(c, 15, ctx)}`);
          return tr(`Chuyến tiêu bình an. Tiêu cục trả công ${m} linh thạch.`, `A safe journey. The escort agency pays you ${m} spirit stones.`);
        },
      },
      { label: tr('Mặc kệ', "Ignore it"), lean: 'trung', run: () => tr('Bạn nhìn đoàn xe khuất sau khe núi.', "You watch the caravan disappear into the gorge.") },
    ],
  },
  {
    id: 'ta_huyet_tri',
    minRealm: 2,
    once: true,
    weight: 5,
    title: tr('Huyết trì cổ', "Ancient blood pool"),
    text: () => tr('Sâu trong lòng núi có một ao máu sôi sùng sục, xung quanh là xương của những kẻ từng ngâm mình ở đây. Huyết khí nồng đến mức đá cũng đỏ.', "Deep inside the mountain is a bubbling pool of blood, ringed with the bones of those who once soaked in it. The blood qi is so thick even the stones are red."),
    choices: () => [
      {
        label: tr('Ngâm mình luyện huyết thể', "Soak to temper a blood body"),
        hint: tr('tu vi +, sức khỏe +, tâm ma +', "cultivation +, Health +, heart demon +"),
        lean: 'ta',
        run: (c, ctx) => {
          addCult(c, reward(c, 2));
          stat(c, 'sucKhoe', 25);
          stat(c, 'tamMa', 10);
          dao(c, -8);
          ctx.fx('evil', tr('Huyết thể', "Blood body"));
          return tr('Máu trong ao chui vào từng lỗ chân lông. Khi bước ra, da bạn đỏ như son, gân cốt rắn như sắt.', "The blood seeps into every pore. When you climb out, your skin is red as cinnabar and your sinews hard as iron.");
        },
      },
      {
        label: tr('Phong ấn huyết trì', "Seal the blood pool"),
        hint: tr('đạo tâm +, khí vận +', "Yao Heart +, Luck +"),
        lean: 'chinh',
        run: (c) => {
          dao(c, 8);
          stat(c, 'khiVan', 5);
          return tr('Bạn dùng ba ngày ba đêm bày trận phong ấn. Ao máu nguội dần rồi đông lại.', "You spend three days and nights laying a sealing formation. The pool cools and congeals.");
        },
      },
      {
        label: tr('Lấy một bình máu rồi đi', "Take a flask of blood and go"),
        hint: tr('được Huyết Sát Đan', "get Blood Fiend Pills"),
        lean: 'trung',
        run: (c, ctx) => {
          c.pills.huyet_sat = (c.pills.huyet_sat ?? 0) + 2;
          ctx.fx('buy', tr('+2 Huyết Sát Đan', "+2 Blood Fiend Pill"));
          return tr('Bạn luyện bình máu thành hai viên Huyết Sát Đan.', "You refine the flask of blood into two Blood Fiend Pills.");
        },
      },
    ],
  },
  {
    id: 'ta_quy_no',
    minRealm: 2,
    once: true,
    weight: 5,
    title: tr('Oan hồn dưới gốc hòe', "Wronged ghost under the pagoda tree"),
    text: () => tr('Dưới gốc hòe già, một oan hồn tóc dài khóc ri rỉ suốt đêm. Nó chưa siêu thoát được vì mối hận năm xưa.', "Under an old pagoda tree, a long-haired ghost weeps all night. It cannot pass on because of a grudge from long ago."),
    choices: () => [
      {
        label: tr('Luyện thành quỷ nô', "Bind it as a ghost servant"),
        hint: tr('quỷ nô đỡ một lần chết, đạo tâm -', "ghost servant blocks one death, Yao Heart -"),
        lean: 'ta',
        run: (c, ctx) => {
          c.oanHon = true;
          dao(c, -8);
          ctx.fx('evil', tr('Quỷ nô', "Ghost servant"));
          return tr('Bạn nhốt oan hồn vào hồ lô. Từ nay nó sẽ liều mạng che chở cho chủ một lần.', "You trap the ghost in a gourd. From now on it will lay down its life to shield its master once.");
        },
      },
      {
        label: tr('Siêu độ cho nó', "Release its soul"),
        hint: tr('đạo tâm +, tâm ma -', "Yao Heart +, heart demon -"),
        lean: 'chinh',
        run: (c) => {
          dao(c, 8);
          stat(c, 'tamMa', -10);
          return tr('Bạn tụng kinh suốt đêm. Gần sáng, oan hồn cúi đầu cảm tạ rồi tan vào sương.', "You chant sutras all night. Near dawn, the ghost bows in thanks and fades into the mist.");
        },
      },
      { label: tr('Rời đi', "Leave"), lean: 'trung', run: () => tr('Tiếng khóc đuổi theo bạn tới tận đầu làng.', "Its weeping follows you all the way to the village gate.") },
    ],
  },
  {
    id: 'ta_ma_mon',
    minRealm: 1,
    once: true,
    weight: 6,
    when: (c) => c.daoTam <= -10,
    title: tr('Ma môn chiêu mộ', "Demonic sect recruitment"),
    text: () => tr('Một kẻ đeo mặt nạ quỷ chặn đường, chìa ra lệnh bài đen: "Huyết Sát Môn để mắt tới ngươi lâu rồi. Gia nhập đi, thiên hạ sẽ là của chúng ta."', "A figure in a ghost mask blocks your path and holds out a black token: \"Xuesha Sect has had its eye on you for a while. Join us, and the world will be ours.\""),
    choices: () => [
      {
        label: tr('Nhận lệnh bài', "Accept the token"),
        hint: tr('Huyết Sát Bào, tu vi +, đạo tâm -', "Xuesha Robe, cultivation +, Yao Heart -"),
        lean: 'ta',
        run: (c, ctx) => {
          giveItem(c, 'huyet_bao', false);
          addCult(c, reward(c, 1.5));
          dao(c, -12);
          ctx.fx('evil', tr('Huyết Sát Môn', "Xuesha Sect"));
          return tr('Bạn nhận lệnh bài và một tấm Huyết Sát Bào. Từ nay ma môn là chỗ dựa của bạn.', "You accept the token and a Xuesha Robe. From now on the demonic sect has your back.");
        },
      },
      {
        label: tr('Giả vờ nhận rồi tố giác', "Pretend to accept, then report them"),
        hint: tr('đạo tâm +, có thể bị trả thù', "Yao Heart +, may face revenge"),
        lean: 'chinh',
        run: (c, ctx) => {
          dao(c, 10);
          money(c, 150);
          if (ctx.rnd() < 0.2) return tr(`Chính phái phá được một phân đà ma môn nhờ bạn. Ma môn cho người ám sát, bạn thoát được nhưng bị thương.${hurt(c, 20, ctx)}`, `Thanks to you, the righteous sects destroy a demonic sect branch. The demonic sect sends assassins; you escape, but wounded.${hurt(c, 20, ctx)}`);
          return tr('Chính phái phá được một phân đà ma môn nhờ bạn, thưởng một trăm năm mươi linh thạch.', "Thanks to you, the righteous sects destroy a demonic sect branch and reward you a hundred and fifty spirit stones.");
        },
      },
      { label: tr('Từ chối', "Refuse"), lean: 'trung', run: () => tr('Kẻ đeo mặt nạ cười khẩy rồi biến vào bóng tối.', "The masked figure sneers and melts into the shadows.") },
    ],
  },
];
