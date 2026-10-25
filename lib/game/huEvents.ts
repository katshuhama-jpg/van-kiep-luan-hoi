import { addCult, dao, fatal, money, reward, stat } from './helpers';
import type { GameEvent } from './types';

/** Sự kiện Thái Hư giới: cõi của người trung lập, giữa tiên giới và ma giới */
export const HU_EVENTS: GameEvent[] = [
  {
    id: 'hu_bo_thai_hu',
    cosmos: 'hu',
    once: true,
    weight: 60,
    title: 'Bờ Thái Hư',
    text: () => 'Không có cửa trời, không có cửa ma. Trước mặt bạn là hư không vô tận, sao trời trôi dưới chân như sỏi dưới suối. Một lão tán tiên ngồi câu cá trên mỏm đá lơ lửng: "Lại thêm một kẻ không chịu chọn phe."',
    choices: () => [
      {
        label: 'Ngồi xuống câu cá cùng lão',
        hint: 'tâm cảnh ++',
        lean: 'trung',
        run: (c) => {
          stat(c, 'tamCanh', 15);
          stat(c, 'tamMa', -15);
          return 'Câu suốt trăm năm không được con cá nào. Lão cười: "Câu cá đâu phải để bắt cá." Bạn hiểu.';
        },
      },
      {
        label: 'Đi tìm tận cùng của hư không',
        hint: 'tu vi +, khí vận +',
        lean: 'trung',
        run: (c) => {
          addCult(c, reward(c, 0.8));
          stat(c, 'khiVan', 6);
          return 'Bạn đi mãi, không thấy tận cùng. Nhưng trên đường bạn nhặt được vô số mảnh sao vỡ, cái nào cũng chứa linh khí.';
        },
      },
      {
        label: 'Hỏi lão về tiên giới và ma giới',
        hint: 'ngộ tính +',
        lean: 'chinh',
        run: (c) => {
          stat(c, 'ngoTinh', 8);
          return 'Lão kể hai bên đánh nhau đã vạn năm, chỉ vì tranh nhau một câu: thiện là gì. "Ở đây, ta không cần trả lời câu đó," lão nói.';
        },
      },
    ],
  },
  {
    id: 'hu_tinh_ha',
    cosmos: 'hu',
    weight: 8,
    cooldown: 20,
    title: 'Tinh hà luận đạo',
    text: () => 'Ba tán tiên ngồi trên ba vì sao, cãi nhau xem đạo nằm ở đâu. Thấy bạn đi ngang, họ đồng thanh: "Ngươi phân xử đi."',
    choices: () => [
      {
        label: '"Đạo ở trong lòng"',
        hint: 'tâm cảnh +',
        lean: 'chinh',
        run: (c) => {
          stat(c, 'tamCanh', 8);
          return 'Một người gật gù, hai người lắc đầu. Nhưng cả ba đều tặng bạn một chén trà sao.';
        },
      },
      {
        label: '"Đạo ở sức mạnh"',
        hint: 'tu vi +',
        lean: 'ta',
        run: (c) => {
          addCult(c, reward(c, 0.7));
          return 'Cả ba lao vào đánh bạn để chứng minh bạn sai. Bạn đánh lui cả ba, và tu vi tăng lên. Có lẽ bạn đúng một nửa.';
        },
      },
      {
        label: 'Im lặng, chỉ tay lên trời sao',
        hint: 'ngộ tính +',
        lean: 'trung',
        run: (c) => {
          stat(c, 'ngoTinh', 10);
          return 'Ba người nhìn theo tay bạn rất lâu, rồi cùng cười lớn. Họ gọi bạn là "kẻ hiểu đạo không nói".';
        },
      },
    ],
  },
  {
    id: 'hu_khe_nut',
    cosmos: 'hu',
    weight: 7,
    cooldown: 25,
    title: 'Khe nứt hư không',
    text: () => 'Một khe nứt mở ra giữa hư không. Bên kia có thể là tiên giới, ma giới, hoặc một thế giới chưa ai từng đặt chân.',
    choices: () => [
      {
        label: 'Bước qua',
        hint: 'liều, có thể đổi đời',
        lean: 'trung',
        run: (c, ctx) => {
          const r = ctx.rnd();
          if (r < 0.4) {
            addCult(c, reward(c, 1.8));
            return 'Bên kia là một tiểu thế giới đầy linh khí chưa ai khai phá. Bạn ở lại tu luyện một thời gian, tu vi tăng vọt.';
          }
          if (r < 0.75) {
            money(c, 2500);
            return 'Bên kia là kho báu của một vị tiên đã chết từ thuở hồng hoang. Bạn mang về một túi đầy.';
          }
          const f = fatal(c, ctx, 0.3, 'Khe nứt khép lại khi bạn mới bước nửa người. Một nửa ở Thái Hư, một nửa ở nơi không ai biết.');
          if (c.dead) return 'Bạn bước qua.' + f;
          stat(c, 'sucKhoe', -35);
          return `Bên kia là bão không gian. Bạn quay lại kịp, nhưng người đầy vết rách.${f ?? ''}`;
        },
      },
      {
        label: 'Vá khe nứt lại',
        hint: 'đạo tâm +, an toàn',
        lean: 'chinh',
        run: (c) => {
          dao(c, 6);
          stat(c, 'tamCanh', 5);
          return 'Bạn dùng chân nguyên vá khe nứt. Không ai biết bạn vừa cứu một thế giới nhỏ khỏi bị hư không nuốt.';
        },
      },
    ],
  },
  {
    id: 'hu_hai_gioi',
    cosmos: 'hu',
    weight: 6,
    cooldown: 30,
    title: 'Sứ giả hai giới',
    text: () => 'Cùng một ngày, Thiên đình và Ma Đế đều sai sứ giả tới. Cả hai muốn mời bạn về phe mình, hứa hẹn quyền thế.',
    choices: () => [
      {
        label: 'Từ chối cả hai',
        hint: 'tâm cảnh +, có thể bị trả thù',
        lean: 'trung',
        run: (c, ctx) => {
          stat(c, 'tamCanh', 10);
          if (ctx.rnd() < 0.3) {
            stat(c, 'sucKhoe', -25);
            return 'Cả hai bên đều phật lòng, sai người tới "nhắc nhở". Bạn đánh lui, nhưng mang thương.';
          }
          return 'Hai sứ giả nhìn nhau rồi cùng cười khổ. Kẻ không cần gì thì không ai mua được.';
        },
      },
      {
        label: 'Làm trung gian hòa giải',
        hint: 'đạo tâm ++, khí vận +',
        lean: 'chinh',
        run: (c) => {
          dao(c, 10);
          stat(c, 'khiVan', 8);
          return 'Bạn mời cả hai sứ giả uống trà. Cuộc chiến vạn năm chưa dừng, nhưng năm ấy không ai chết.';
        },
      },
      {
        label: 'Nhận quà của cả hai, hứa suông',
        hint: 'linh thạch ++',
        lean: 'ta',
        run: (c) => {
          money(c, 3000);
          dao(c, -8);
          return 'Bạn nhận cả hai phần lễ vật, hứa với cả hai. Thái Hư rộng lớn, đợi họ phát hiện ra thì bạn đã đi xa.';
        },
      },
    ],
  },
];
