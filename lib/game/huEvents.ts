import { addCult, dao, fatal, money, reward, stat } from './helpers';
import type { GameEvent } from './types';
import { tr } from '../i18n';

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
    title: tr('Tinh hà luận đạo', "Discussing the Yao on the Star River"),
    text: () => tr('Ba tán tiên ngồi trên ba vì sao, cãi nhau xem đạo nằm ở đâu. Thấy bạn đi ngang, họ đồng thanh: "Ngươi phân xử đi."', "Three wandering immortals sit on three stars, arguing over where the Yao lies. Seeing you pass, they cry in unison: \"You be the judge.\""),
    choices: () => [
      {
        label: tr('"Đạo ở trong lòng"', "\"The Yao is in the heart\""),
        hint: tr('tâm cảnh +', "Mind +"),
        lean: 'chinh',
        run: (c) => {
          stat(c, 'tamCanh', 8);
          return tr('Một người gật gù, hai người lắc đầu. Nhưng cả ba đều tặng bạn một chén trà sao.', "One nods, two shake their heads. But all three gift you a cup of star tea.");
        },
      },
      {
        label: tr('"Đạo ở sức mạnh"', "\"The Yao is in strength\""),
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
          return tr('Ba người nhìn theo tay bạn rất lâu, rồi cùng cười lớn. Họ gọi bạn là "kẻ hiểu đạo không nói".', "The three follow your finger for a long time, then burst out laughing together. They call you \"the one who knows the Yao and says nothing\".");
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
        hint: tr('đạo tâm +, an toàn', "Yao Heart +, safe"),
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
        hint: tr('đạo tâm ++, khí vận +', "Yao Heart ++, Luck +"),
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
];
