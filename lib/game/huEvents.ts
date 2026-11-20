import { addCult, dao, fatal, money, reward, stat } from './helpers';
import type { GameEvent } from './types';
import { tr } from '../i18n';
import { ctArc, ctNext, ctSet } from './ctArc';

/** Sự kiện Thái Hư giới: cõi của người trung lập, giữa tiên giới và ma giới */
export const HU_EVENTS: GameEvent[] = [
  {
    id: 'hu_bo_thai_hu',
    cosmos: 'hu',
    once: true,
    weight: 60,
    title: tr('Bờ Thái Hư', "Shore of the Great Void"),
    text: () => tr('Không có cửa trời, không có cửa ma. Trước mặt bạn là hư không vô tận, sao trời trôi dưới chân như sỏi dưới suối. Một lão tán tiên ngồi câu cá trên mỏm đá lơ lửng: "Lại thêm một kẻ không chịu chọn phe."', "No heavenly gate, no demon gate. Before you lies endless void, stars drifting beneath your feet like pebbles in a stream. An old wandering immortal sits fishing on a floating rock: \"Another one who won't pick a side.\""),
    choices: () => [
      {
        label: tr('Ngồi xuống câu cá cùng lão', "Sit and fish with the old man"),
        hint: tr('tâm cảnh ++', "Mind ++"),
        lean: 'trung',
        run: (c) => {
          stat(c, 'tamCanh', 15);
          stat(c, 'tamMa', -15);
          return tr('Câu suốt trăm năm không được con cá nào. Lão cười: "Câu cá đâu phải để bắt cá." Bạn hiểu.', "A hundred years of fishing and not a single bite. The old man laughs: \"Fishing was never about catching fish.\" You understand.");
        },
      },
      {
        label: tr('Đi tìm tận cùng của hư không', "Seek the end of the void"),
        hint: tr('tu vi +, khí vận +', "cultivation +, Luck +"),
        lean: 'trung',
        run: (c) => {
          addCult(c, reward(c, 0.8));
          stat(c, 'khiVan', 6);
          return tr('Bạn đi mãi, không thấy tận cùng. Nhưng trên đường bạn nhặt được vô số mảnh sao vỡ, cái nào cũng chứa linh khí.', "You walk on and on and never find the end. But along the way you pick up countless broken star shards, each holding spirit qi.");
        },
      },
      {
        label: tr('Hỏi lão về tiên giới và ma giới', "Ask him about the Immortal and Demon Realms"),
        hint: tr('ngộ tính +', "Insight +"),
        lean: 'chinh',
        run: (c) => {
          stat(c, 'ngoTinh', 8);
          return tr('Lão kể hai bên đánh nhau đã vạn năm, chỉ vì tranh nhau một câu: thiện là gì. "Ở đây, ta không cần trả lời câu đó," lão nói.', "He says the two sides have fought for ten thousand years over a single question: what is good? \"Here, I needn't answer that,\" he says.");
        },
      },
    ],
  },
  {
    id: 'hu_tinh_ha',
    cosmos: 'hu',
    weight: 8,
    cooldown: 20,
    title: tr('Tinh hà luận đạo', "Discussing the Dao on the Star River"),
    text: () => tr('Ba tán tiên ngồi trên ba vì sao, cãi nhau xem đạo nằm ở đâu. Thấy bạn đi ngang, họ đồng thanh: "Ngươi phân xử đi."', "Three wandering immortals sit on three stars, arguing over where the Dao lies. Seeing you pass, they cry in unison: \"You be the judge.\""),
    choices: () => [
      {
        label: tr('"Đạo ở trong lòng"', "\"The Dao is in the heart\""),
        hint: tr('tâm cảnh +', "Mind +"),
        lean: 'chinh',
        run: (c) => {
          stat(c, 'tamCanh', 8);
          return tr('Một người gật gù, hai người lắc đầu. Nhưng cả ba đều tặng bạn một chén trà sao.', "One nods, two shake their heads. But all three gift you a cup of star tea.");
        },
      },
      {
        label: tr('"Đạo ở sức mạnh"', "\"The Dao is in strength\""),
        hint: tr('tu vi +', 'cultivation +'),
        lean: 'ta',
        run: (c) => {
          addCult(c, reward(c, 0.7));
          return tr('Cả ba lao vào đánh bạn để chứng minh bạn sai. Bạn đánh lui cả ba, và tu vi tăng lên. Có lẽ bạn đúng một nửa.', "All three jump you to prove you wrong. You beat all three back, and your cultivation rises. Maybe you're half right.");
        },
      },
      {
        label: tr('Im lặng, chỉ tay lên trời sao', "Stay silent, point to the starry sky"),
        hint: tr('ngộ tính +', "Insight +"),
        lean: 'trung',
        run: (c) => {
          stat(c, 'ngoTinh', 10);
          return tr('Ba người nhìn theo tay bạn rất lâu, rồi cùng cười lớn. Họ gọi bạn là "kẻ hiểu đạo không nói".', "The three follow your finger for a long time, then burst out laughing together. They call you \"the one who knows the Dao and says nothing\".");
        },
      },
    ],
  },
  {
    id: 'hu_khe_nut',
    cosmos: 'hu',
    weight: 7,
    cooldown: 25,
    title: tr('Khe nứt hư không', "Rift in the Void"),
    text: () => tr('Một khe nứt mở ra giữa hư không. Bên kia có thể là tiên giới, ma giới, hoặc một thế giới chưa ai từng đặt chân.', "A rift opens in the void. Beyond it could be the Immortal Realm, the Demon Realm, or a world no one has ever set foot in."),
    choices: () => [
      {
        label: tr('Bước qua', "Step through"),
        hint: tr('liều, có thể đổi đời', "risky, could change everything"),
        lean: 'trung',
        run: (c, ctx) => {
          const r = ctx.rnd();
          if (r < 0.4) {
            addCult(c, reward(c, 1.8));
            return tr('Bên kia là một tiểu thế giới đầy linh khí chưa ai khai phá. Bạn ở lại tu luyện một thời gian, tu vi tăng vọt.', "Beyond lies a small world thick with untouched spirit qi. You stay and cultivate a while, and your cultivation soars.");
          }
          if (r < 0.75) {
            money(c, 2500);
            return tr('Bên kia là kho báu của một vị tiên đã chết từ thuở hồng hoang. Bạn mang về một túi đầy.', "Beyond lies the treasury of an immortal who died in primordial times. You come back with a full bag.");
          }
          const f = fatal(c, ctx, 0.3, tr('Khe nứt khép lại khi bạn mới bước nửa người. Một nửa ở Thái Hư, một nửa ở nơi không ai biết.', "The rift closed when you were only halfway through. Half in the Great Void, half somewhere no one knows."));
          if (c.dead) return tr('Bạn bước qua.', "You step through.") + f;
          stat(c, 'sucKhoe', -35);
          return tr(`Bên kia là bão không gian. Bạn quay lại kịp, nhưng người đầy vết rách.${f ?? ''}`, `Beyond is a spatial storm. You make it back in time, but covered in gashes.${f ?? ''}`);
        },
      },
      {
        label: tr('Vá khe nứt lại', "Mend the rift"),
        hint: tr('đạo tâm +, an toàn', "Dao Heart +, safe"),
        lean: 'chinh',
        run: (c) => {
          dao(c, 6);
          stat(c, 'tamCanh', 5);
          return tr('Bạn dùng chân nguyên vá khe nứt. Không ai biết bạn vừa cứu một thế giới nhỏ khỏi bị hư không nuốt.', "You mend the rift with your true essence. No one knows you just saved a small world from being swallowed by the void.");
        },
      },
    ],
  },
  {
    id: 'hu_hai_gioi',
    cosmos: 'hu',
    weight: 6,
    cooldown: 30,
    title: tr('Sứ giả hai giới', "Envoys of Two Realms"),
    text: () => tr('Cùng một ngày, Thiên đình và Ma Đế đều sai sứ giả tới. Cả hai muốn mời bạn về phe mình, hứa hẹn quyền thế.', "On the same day, the Heavenly Court and the Demon Emperor both send envoys. Each wants you on their side, promising power and status."),
    choices: () => [
      {
        label: tr('Từ chối cả hai', "Refuse both"),
        hint: tr('tâm cảnh +, có thể bị trả thù', "Mind +, may provoke revenge"),
        lean: 'trung',
        run: (c, ctx) => {
          stat(c, 'tamCanh', 10);
          if (ctx.rnd() < 0.3) {
            stat(c, 'sucKhoe', -25);
            return tr('Cả hai bên đều phật lòng, sai người tới "nhắc nhở". Bạn đánh lui, nhưng mang thương.', "Both sides take offence and send people to \"remind\" you. You beat them back, but get hurt.");
          }
          return tr('Hai sứ giả nhìn nhau rồi cùng cười khổ. Kẻ không cần gì thì không ai mua được.', "The two envoys look at each other and smile wryly. Those who want nothing cannot be bought.");
        },
      },
      {
        label: tr('Làm trung gian hòa giải', "Mediate between them"),
        hint: tr('đạo tâm ++, khí vận +', "Dao Heart ++, Luck +"),
        lean: 'chinh',
        run: (c) => {
          dao(c, 10);
          stat(c, 'khiVan', 8);
          return tr('Bạn mời cả hai sứ giả uống trà. Cuộc chiến vạn năm chưa dừng, nhưng năm ấy không ai chết.', "You invite both envoys to tea. The ten-thousand-year war doesn't end, but that year no one dies.");
        },
      },
      {
        label: tr('Nhận quà của cả hai, hứa suông', "Take both gifts, make empty promises"),
        hint: tr('linh thạch ++', "spirit stones ++"),
        lean: 'ta',
        run: (c) => {
          money(c, 3000);
          dao(c, -8);
          return tr('Bạn nhận cả hai phần lễ vật, hứa với cả hai. Thái Hư rộng lớn, đợi họ phát hiện ra thì bạn đã đi xa.', "You accept both sets of gifts and promise both sides. The Great Void is vast - by the time they catch on, you're long gone.");
        },
      },
    ],
  },
  // ================= Ngày 35, đêm 20/11/2026 =================
  // ct_20261120_4 Người nhặt tiếng vọng (Thái Hư giới, 2 bước). Nối Thiên thư quyển III, trang XXI "Dư Âm": chỉ hiện khi đã có trang ấy (c.tt3 >= 1).
  // Chỉ dùng sự thật của XXI: tiếng leng keng nhỏ mỗi chiều, không đếm ai, nó gọi, vọng về từ phía núi tuyết. Không lộ chuông nhỏ, làng, Mạnh Bà.
  {
    id: 'ct_20261120_4',
    cosmos: 'hu',
    once: true,
    weight: 40,
    when: (c) => (c.tt3 ?? 0) >= 1 && !ctArc(c, 'ct20261120_4'),
    title: tr('Người nhặt tiếng vọng', 'The echo gatherer'),
    text: (c) =>
      tr(
        `Thái Hư giới không có chiều tối. Vậy mà đúng giờ mặt trời lặn dưới phàm gian, bạn lại nghe tiếng leng keng nhỏ ấy${c.tt3Nhanh === 'dap' ? ', dù chuông lớn đã vỡ từ lâu' : ', chen giữa hai tiếng chuông lớn bạn vẫn gõ'}. Một thiếu nữ ôm chiếc bình rỗng đứng bên, thì thầm: "Ta là Thu Âm, chuyên nhặt tiếng vọng lạc vào hư không. Riêng tiếng này ta nhặt mãi không được."`,
        `The Great Void has no evening. Yet right when the sun sets in the mortal world below, you hear that faint chime again${c.tt3Nhanh === 'dap' ? ', though the great bell broke long ago' : ', slipping between the strokes of the great bell you still ring'}. A girl holding an empty jar stands beside you and whispers: "I am Thu Am. I gather echoes that stray into the void. This one I have never managed to catch."`,
      ),
    choices: () => [
      {
        label: tr('Đi theo tiếng ấy', 'Follow the sound'),
        hint: tr('tu vi +', 'cultivation +'),
        lean: 'trung',
        run: (c) => {
          const g = Math.round(addCult(c, reward(c, 0.5)));
          ctSet(c, 'ct20261120_4', 1, 'theo');
          return tr(`Bạn đi suốt mấy năm hư không, Thu Âm lẽo đẽo theo sau (+${g} tu vi). Lạ là tiếng ấy không ở phía trên, nơi chuông lớn ${c.tt3Nhanh === 'dap' ? 'từng treo' : 'đang treo'}.`, `You walk the void for years with Thu Am trailing behind (+${g} cultivation). Strangely, the sound is not coming from above, where the great bell ${c.tt3Nhanh === 'dap' ? 'once hung' : 'hangs'}.`);
        },
      },
      {
        label: tr('Ngồi im, đợi nó vang lần nữa', 'Sit still and wait for it to ring again'),
        hint: tr('tâm cảnh +', 'Mind +'),
        lean: 'trung',
        run: (c) => {
          stat(c, 'tamCanh', 8);
          ctSet(c, 'ct20261120_4', 1, 'cho');
          return tr('Bạn ngồi đếm từng chiều dưới phàm gian. Tới chiều thứ một trăm, bạn đã biết tiếng ấy vọng lên từ hướng nào.', 'You sit and count the evenings in the mortal world. By the hundredth, you know which way the sound rises from.');
        },
      },
      {
        label: tr('Đổi cho Thu Âm một ký ức kiếp trước để nàng giúp', 'Trade Thu Am a memory from a past life for her help'),
        hint: tr('ngộ tính -, tâm ma -', 'Insight -, Heart Demon -'),
        lean: 'trung',
        run: (c) => {
          stat(c, 'ngoTinh', -3);
          stat(c, 'tamMa', -8);
          ctSet(c, 'ct20261120_4', 1, 'doi');
          return tr('Bạn đưa nàng ký ức về một lần chết đau đớn. Nàng cất vào bình, đổi lại chỉ cho bạn hướng tiếng ấy. Lòng bạn nhẹ đi một chút.', 'You give her the memory of one painful death. She seals it in her jar and in return points you toward the sound. Your heart feels a little lighter.');
        },
      },
      {
        label: tr('Bảo nàng: tiếng ấy không thuộc về hư không, đừng nhặt', 'Tell her: that sound does not belong to the void, leave it'),
        hint: tr('đạo tâm +', 'Dao Heart +'),
        lean: 'chinh',
        run: (c) => {
          dao(c, 3);
          stat(c, 'tamCanh', 3);
          ctSet(c, 'ct20261120_4', 9);
          return tr('Thu Âm ngẩn ra rồi gật đầu, ôm bình đi nhặt tiếng khác. Chiều hôm sau tiếng leng keng vẫn vang, chỉ có bạn nghe.', 'Thu Am blinks, then nods and goes off to gather other sounds. The next evening the chime still rings, and only you hear it.');
        },
      },
    ],
  },
  {
    id: 'ct_20261120_4b',
    cosmos: 'hu',
    once: true,
    weight: 300,
    when: (c) => ctNext(c, 'ct20261120_4', 1, 5),
    title: tr('Rìa Thái Hư', 'The edge of the Void'),
    text: () =>
      tr(
        'Bạn và Thu Âm tới rìa Thái Hư, nơi nhìn xuống thấy được cả phàm gian. Tiếng leng keng ở đây rõ nhất, và nó vọng lên từ dưới kia, từ phía núi tuyết. Thu Âm giơ bình hứng, lần đầu tiên tiếng ấy chịu vào bình.',
        'You and Thu Am reach the edge of the Great Void, where the whole mortal world can be seen below. The chime is clearest here, and it rises from down there, from the direction of the snowy peak. Thu Am holds up her jar, and for the first time the sound lets itself be caught.',
      ),
    choices: () => [
      {
        label: tr('Xin cái bình, nghe lại mỗi khi tâm loạn', 'Ask for the jar, to listen whenever your mind is troubled'),
        hint: tr('tâm ma --', 'Heart Demon --'),
        lean: 'trung',
        run: (c) => {
          stat(c, 'tamMa', -12);
          stat(c, 'tamCanh', 4);
          ctSet(c, 'ct20261120_4', 2, 'binh');
          return tr('Thu Âm đưa bình. Mỗi lần tâm ma trỗi dậy, bạn mở nắp, nghe một tiếng leng keng, rồi đóng lại.', 'Thu Am hands it over. Whenever your heart demon stirs, you lift the lid, hear one chime, and close it again.');
        },
      },
      {
        label: tr('Để Thu Âm giữ, nàng đã tìm nó lâu hơn bạn', 'Let Thu Am keep it; she sought it longer than you'),
        hint: tr('nhường cơ duyên: đạo tâm +, khí vận +', 'give up the chance: Dao Heart +, Luck +'),
        lean: 'chinh',
        run: (c) => {
          dao(c, 6);
          stat(c, 'khiVan', 6);
          ctSet(c, 'ct20261120_4', 2, 'nhuong');
          return tr('Nàng ôm bình, cười lần đầu tiên. Từ đó, đi đâu trong hư không bạn cũng gặp người chỉ đường, ai cũng bảo Thu Âm dặn.', 'She hugs the jar and smiles for the first time. From then on, wherever you go in the void, someone shows you the way, saying Thu Am asked them to.');
        },
      },
      {
        label: tr('Mở nắp, thả tiếng ấy về đường cũ', 'Open the lid and let the sound go back its way'),
        hint: tr('tâm cảnh ++', 'Mind ++'),
        lean: 'chinh',
        run: (c) => {
          stat(c, 'tamCanh', 10);
          ctSet(c, 'ct20261120_4', 2, 'tha');
          return tr('Tiếng leng keng không bay lên. Nó rơi xuống, chậm rãi, về phía núi tuyết, như biết đường về hơn bạn.', 'The chime does not rise. It falls, slowly, toward the snowy peak, as if it knows the way home better than you do.');
        },
      },
      {
        label: tr('Hỏi Thu Âm: trong tiếng ấy có tên ai không', 'Ask Thu Am: is there a name inside that sound?'),
        hint: tr('ngộ tính +', 'Insight +'),
        lean: 'trung',
        run: (c) => {
          stat(c, 'ngoTinh', 6);
          ctSet(c, 'ct20261120_4', 2, 'hoi');
          return tr('Nàng áp tai vào bình rất lâu. "Không có tên nào. Tiếng chuông lớn thì đếm. Tiếng này chỉ gọi."', 'She presses her ear to the jar a long time. "There is no name. The great bell counts. This one only calls."');
        },
      },
    ],
  },
];
