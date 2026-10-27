import { lifeCap } from './data';
import { addCult, addPill, dao, fatal, hurt, luck, money, reward, stat } from './helpers';
import type { Character, EffectCtx, GameEvent } from './types';

/**
 * 3.1.0: 10 cốt truyện mới sau phi thăng, để người chơi cũ ở tiên giới, ma giới, Thái Hư giới có thêm chuyện để đi.
 * Mỗi cốt truyện dài lưu bước trong c.arc[id] và tuổi lúc qua bước đó trong c.arcAt[id].
 */

const arc = (c: Character, id: string) => c.arc?.[id] ?? 0;
const since = (c: Character, id: string) => c.age - (c.arcAt?.[id] ?? 0);
function setArc(c: Character, id: string, v: number) {
  c.arc = { ...(c.arc ?? {}), [id]: v };
  c.arcAt = { ...(c.arcAt ?? {}), [id]: Math.floor(c.age) };
}
/** cốt truyện dài: bước sau mở sau ít nhất n năm */
const next = (c: Character, id: string, vals: number[], years: number) => vals.includes(arc(c, id)) && since(c, id) >= years;
const tier = (c: Character) => Math.max(1, c.realm - 7);
const tamCap = (c: Character) => lifeCap(c.realm);

/** đánh một trận trong cốt truyện: tỉ lệ theo khí vận và sức khỏe */
function fight(c: Character, ctx: EffectCtx, base: number) {
  return ctx.rnd() < luck(c, base + (c.stats.sucKhoe - 60) / 400);
}

export const COSMOS_STORIES: GameEvent[] = [
  // ================= Tiên giới =================
  // 1. Thiên Hà tuần thủ (2 bước)
  {
    id: 'st_thien_ha_1',
    cosmos: 'tien',
    once: true,
    weight: 40,
    title: 'Canh bến Thiên Hà',
    text: () =>
      'Thiên Đình giao cho bạn canh bến Thiên Hà một trăm năm. Đêm đầu tiên, một con giao long non trườn lên bờ, vảy còn mềm, mắt rưng rưng: "Tiên quan, cho con qua sông. Mẹ con ở biển bên kia."',
    choices: () => [
      {
        label: 'Thả cho nó qua',
        hint: 'nghiêng chính, trái lệnh',
        lean: 'chinh',
        run: (c) => {
          setArc(c, 'thien_ha', 1);
          dao(c, 8);
          return 'Bạn quay mặt đi. Giao long lặn xuống, để lại một vệt sáng dài trên mặt sông. Không ai biết. Ít nhất là bây giờ.';
        },
      },
      {
        label: 'Bắt nộp lên Thiên Đình',
        hint: 'được thưởng, nghiêng tà',
        lean: 'ta',
        run: (c) => {
          setArc(c, 'thien_ha', 2);
          dao(c, -6);
          money(c, 200 * tier(c));
          stat(c, 'khiVan', 4);
          return 'Bạn trói nó bằng dây tiên, nộp lên Thiên Binh Ty. Được khen một câu, thưởng một túi linh thạch. Tiếng giao long gọi mẹ vang suốt đêm.';
        },
      },
      {
        label: 'Hỏi vì sao mẹ nó ở bên kia',
        hint: 'ngộ tính',
        lean: 'trung',
        run: (c) => {
          setArc(c, 'thien_ha', 1);
          stat(c, 'ngoTinh', 6);
          return 'Nó kể Thiên Hà vốn không có bờ, là Thiên Đình vạch ra để chia trời. Bạn nghe xong, lặng lẽ tháo xích bến. Giao long đi rồi, câu chuyện còn ở lại.';
        },
      },
    ],
  },
  {
    id: 'st_thien_ha_2',
    cosmos: 'tien',
    once: true,
    weight: 300,
    when: (c) => next(c, 'thien_ha', [1, 2], 8),
    title: 'Thiên Hà dậy sóng',
    text: (c) =>
      arc(c, 'thien_ha') === 1
        ? 'Tám năm sau, mặt Thiên Hà nổ tung. Một con rồng xanh dài trăm trượng ngẩng đầu trước bến: "Tiên quan còn nhớ con không?"'
        : 'Tám năm sau, Thiên Hà dâng lũ ngập ba tầng trời. Giữa sóng là một con long mẫu mắt đỏ ngầu: "Trả con cho ta!" Thiên Đình truy trách người canh bến.',
    choices: (c) =>
      arc(c, 'thien_ha') === 1
        ? [
            {
              label: 'Nhận long châu báo ân',
              hint: 'tu vi lớn',
              lean: 'trung',
              run: (ch, ctx) => {
                setArc(ch, 'thien_ha', 9);
                addCult(ch, reward(ch, 2));
                ctx.fx('breakthrough', 'Long châu');
                return 'Rồng nhả ra một viên long châu to bằng nắm tay. Bạn nuốt vào, linh lực cuộn như sóng Thiên Hà.';
              },
            },
            {
              label: 'Nhờ nó cõng lên Bích Lạc',
              hint: 'khí vận, ngộ tính',
              lean: 'chinh',
              run: (ch) => {
                setArc(ch, 'thien_ha', 9);
                stat(ch, 'khiVan', 12);
                stat(ch, 'ngoTinh', 6);
                return 'Rồng cõng bạn bay tới tận Bích Lạc, nơi tiên nhân bình thường không được tới. Bạn nhìn thấy cả ba cõi từ trên cao.';
              },
            },
          ]
        : [
            {
              label: 'Nhận tội, nộp phạt',
              hint: 'mất linh thạch, tâm cảnh',
              lean: 'chinh',
              run: (ch) => {
                setArc(ch, 'thien_ha', 9);
                money(ch, -Math.min(ch.linhThach, 600 * tier(ch)));
                stat(ch, 'tamCanh', 6);
                dao(ch, 5);
                return 'Bạn quỳ trước Thiên Đình, nộp gần hết gia sản đền cho long mẫu. Giao long được thả. Long mẫu nhìn bạn rất lâu rồi rút nước.';
              },
            },
            {
              label: 'Ra bến chặn long mẫu',
              hint: 'đánh một trận, thắng được Thiên Đình trọng thưởng',
              lean: 'ta',
              run: (ch, ctx) => {
                setArc(ch, 'thien_ha', 9);
                if (fight(ch, ctx, 0.45)) {
                  money(ch, 800 * tier(ch));
                  addCult(ch, reward(ch, 1));
                  return 'Bạn chém đứt một sừng long mẫu. Nó gầm lên rồi lặn mất. Thiên Đình ghi công, nhưng từ đó Thiên Hà không bao giờ yên.';
                }
                const f = fatal(ch, ctx, 0.12, 'Long mẫu cuốn bạn xuống đáy Thiên Hà. Không ai vớt được tiên thể.');
                if (ch.dead) return f ?? '';
                return 'Long mẫu quật một đuôi, bạn văng khỏi bến.' + hurt(ch, 40, ctx);
              },
            },
          ],
  },
  // 2. Quảng Hàn cung (lặp lại)
  {
    id: 'st_quang_han',
    cosmos: 'tien',
    weight: 14,
    cooldown: 18,
    title: 'Cây quế Quảng Hàn',
    text: (c) =>
      `Ngoài cung Quảng Hàn, Ngô Cương vẫn chặt cây quế. Nhát rìu vừa rút ra, vết chém đã liền lại. Lão chào bạn lần thứ ${arc(c, 'quang_han') + 1}: "Lại tới à. Rượu quế năm nay ngon lắm."`,
    choices: () => [
      {
        label: 'Chặt giúp một nhát',
        hint: 'ngộ tính, tâm cảnh',
        lean: 'chinh',
        run: (c, ctx) => {
          const n = arc(c, 'quang_han') + 1;
          setArc(c, 'quang_han', n);
          stat(c, 'ngoTinh', 4);
          stat(c, 'tamCanh', 4);
          if (n >= 3 && ctx.rnd() < 0.5) {
            addPill(c, 'dien_tho', 1);
            return 'Nhát rìu của bạn để lại một vết không liền. Ngô Cương sững người, rồi bật khóc. Lão nhét vào tay bạn một viên Diên Thọ Đan cất suốt vạn năm.';
          }
          return 'Vết chém liền lại như chưa từng có. Nhưng tay bạn biết thêm một điều về sự kiên nhẫn.';
        },
      },
      {
        label: 'Lén bẻ một cành quế',
        hint: 'Diên Thọ Đan, phạm thiên quy',
        lean: 'ta',
        run: (c, ctx) => {
          setArc(c, 'quang_han', arc(c, 'quang_han') + 1);
          dao(c, -6);
          if (ctx.rnd() < 0.3) return 'Thỏ ngọc thấy, kêu ầm lên. Thiên binh tới bắt.' + hurt(c, 25, ctx);
          addPill(c, 'dien_tho', 1);
          return 'Cành quế trong tay bạn tỏa hương mát lạnh. Đem luyện được một viên Diên Thọ Đan.';
        },
      },
      {
        label: 'Ngồi uống rượu với lão',
        hint: 'tâm ma giảm',
        lean: 'trung',
        run: (c) => {
          setArc(c, 'quang_han', arc(c, 'quang_han') + 1);
          stat(c, 'tamMa', -10);
          return 'Hai người uống tới khi trăng lặn. Ngô Cương nói chặt cây không phải hình phạt, mà là cách lão quên. Bạn không hỏi lão quên cái gì.';
        },
      },
    ],
  },
  // 3. Lò Bát Quái (lặp lại)
  {
    id: 'st_bat_quai',
    cosmos: 'tien',
    weight: 14,
    cooldown: 12,
    title: 'Trông lò Bát Quái',
    text: () => 'Thái Thượng Lão Quân đi giảng đạo ba năm, nhờ bạn trông lò Bát Quái. Dặn đúng một câu: "Đừng mở nắp."',
    choices: () => [
      {
        label: 'Canh lửa đúng ba năm',
        hint: 'đan dược',
        lean: 'chinh',
        run: (c) => {
          addPill(c, 'tu_khi', 2);
          addPill(c, 'thanh_tam', 1);
          stat(c, 'tamCanh', 4);
          return 'Lão Quân về, mở lò, gật gù. Lão chia cho bạn mấy viên đan còn ấm.';
        },
      },
      {
        label: 'Mở nắp xem một chút',
        hint: 'được ăn cả, ngã về không',
        lean: 'ta',
        run: (c, ctx) => {
          if (ctx.rnd() < luck(c, 0.5)) {
            addCult(c, reward(c, 2.2));
            ctx.fx('breakthrough', 'Tiên đan');
            return 'Một viên đan vàng bay vụt ra, bạn há miệng đớp được. Tu vi tăng vọt. Lão Quân về, đếm thiếu một viên, nhìn bạn rất lâu.';
          }
          money(c, -Math.min(c.linhThach, 500 * tier(c)));
          return 'Lò nổ. Khói bát quái phủ kín Đâu Suất cung. Bạn phải đền cả một lò.' + hurt(c, 30, ctx);
        },
      },
      {
        label: 'Ném vũ khí của mình vào luyện',
        hint: 'khí vận, tu vi',
        lean: 'trung',
        run: (c) => {
          addCult(c, reward(c, 0.8));
          stat(c, 'khiVan', 8);
          return 'Vũ khí ra lò sáng như mới rèn, phảng phất mùi đan hương. Ít nhất nó tin vậy.';
        },
      },
    ],
  },
  // 4. Lời cầu từ nhân gian (2 bước)
  {
    id: 'st_mieu_1',
    cosmos: 'tien',
    once: true,
    weight: 35,
    title: 'Miếu thờ ở nhân gian',
    text: (c) =>
      `Có tiếng khấn vọng lên tận Thiên Đình. Ở quê cũ, hậu nhân lập miếu thờ ${c.name}. Ba năm hạn hán, ruộng nứt như mai rùa, họ quỳ trước tượng bạn xin một trận mưa.`,
    choices: () => [
      {
        label: 'Lén làm mưa',
        hint: 'nghiêng chính, phạm thiên quy',
        lean: 'chinh',
        run: (c) => {
          setArc(c, 'mieu', 1);
          dao(c, 10);
          return 'Bạn vẩy tay áo. Mây kéo về, mưa ba ngày ba đêm. Dưới trần, người ta reo hò quanh miếu. Trên trời, sổ thiên quy ghi thêm một dòng.';
        },
      },
      {
        label: 'Dâng sớ xin Thiên Đình',
        hint: 'tốn linh thạch, đúng luật',
        lean: 'trung',
        run: (c) => {
          setArc(c, 'mieu', 2);
          money(c, -Math.min(c.linhThach, 300 * tier(c)));
          return 'Sớ phải qua bảy cửa, mỗi cửa một lễ. Bạn trả đủ, rồi chờ.';
        },
      },
      {
        label: 'Làm ngơ',
        hint: 'tiên phàm cách biệt',
        lean: 'ta',
        run: (c) => {
          setArc(c, 'mieu', 9);
          stat(c, 'tamMa', 8);
          return 'Bạn đóng cửa sổ, tiếng khấn nhỏ dần. Năm sau thì không còn nghe nữa.';
        },
      },
    ],
  },
  {
    id: 'st_mieu_2',
    cosmos: 'tien',
    once: true,
    weight: 300,
    when: (c) => next(c, 'mieu', [1, 2], 5),
    title: 'Miếu cũ',
    text: (c) =>
      arc(c, 'mieu') === 1
        ? 'Thiên quy ty gửi trát: người canh mưa nhân gian báo có tiên nhân tự ý làm mưa. Họ cần một cái tên.'
        : 'Sớ của bạn cuối cùng cũng được duyệt. Mưa xuống, nhưng muộn năm năm. Miếu đã hoang, chỉ còn một bà cụ ngày ngày quét lá.',
    choices: (c) =>
      arc(c, 'mieu') === 1
        ? [
            {
              label: 'Nhận là mình',
              hint: 'bị phạt tu vi, tâm cảnh lớn',
              lean: 'chinh',
              run: (ch) => {
                setArc(ch, 'mieu', 9);
                ch.cultivation = Math.round(ch.cultivation * 0.7);
                stat(ch, 'tamCanh', 12);
                stat(ch, 'khiVan', 6);
                return 'Bạn bị phạt diện bích năm năm, tu vi tụt mất một đoạn. Nhưng trong lúc diện bích, bạn nghe được tiếng cười trẻ con từ nhân gian vọng lên.';
              },
            },
            {
              label: 'Đổ cho Long Vương',
              hint: 'thoát tội, nghiêng tà',
              lean: 'ta',
              run: (ch) => {
                setArc(ch, 'mieu', 9);
                dao(ch, -10);
                stat(ch, 'tamMa', 6);
                return 'Long Vương bị giáng chức. Lão không biết vì sao. Bạn biết.';
              },
            },
          ]
        : [
            {
              label: 'Hạ phàm quét miếu cùng bà cụ',
              hint: 'tâm ma giảm, ngộ tính',
              lean: 'chinh',
              run: (ch) => {
                setArc(ch, 'mieu', 9);
                stat(ch, 'tamMa', -12);
                stat(ch, 'ngoTinh', 5);
                return 'Bà cụ không biết bạn là ai, chỉ chia cho bạn nửa củ khoai. Bạn ăn chậm, như thể đó là tiên đào.';
              },
            },
            {
              label: 'Ban cho bà cụ trường thọ',
              hint: 'khí vận',
              lean: 'chinh',
              run: (ch) => {
                setArc(ch, 'mieu', 9);
                stat(ch, 'khiVan', 10);
                dao(ch, 6);
                return 'Bà cụ sống tới một trăm hai mươi tuổi, quét miếu tới ngày cuối. Hương trong miếu không bao giờ tắt.';
              },
            },
          ],
  },

  // ================= Ma giới =================
  // 5. Huyết Nguyệt (lặp lại)
  {
    id: 'st_huyet_nguyet',
    cosmos: 'ma',
    weight: 14,
    cooldown: 10,
    title: 'Huyết Nguyệt',
    text: () => 'Trăng máu mọc. Ma khí dâng gấp mười, ma thú phát cuồng, ma tu khắp nơi ngồi xuống hút lấy hút để. Đêm nay, kẻ nào tham sẽ mạnh, kẻ nào tham quá sẽ điên.',
    choices: () => [
      {
        label: 'Hút cạn cả đêm',
        hint: 'tu vi lớn, tâm ma lớn',
        lean: 'ta',
        run: (c) => {
          addCult(c, reward(c, 1.4));
          stat(c, 'tamMa', 10);
          return 'Huyết khí tràn vào kinh mạch như lũ. Sáng ra bạn mạnh hơn hẳn, nhưng trong đầu có thêm một giọng nói.';
        },
      },
      {
        label: 'Luyện ma khí thành đan',
        hint: 'đan, linh thạch',
        lean: 'trung',
        run: (c) => {
          addPill(c, 'huyet_sat', 2);
          money(c, 150 * tier(c));
          return 'Bạn gom ma khí vào lò, ra được mấy viên Huyết Sát Đan và ít cặn đem bán.';
        },
      },
      {
        label: 'Đóng cửa tĩnh tọa',
        hint: 'tâm ma giảm',
        lean: 'chinh',
        run: (c) => {
          stat(c, 'tamMa', -10);
          stat(c, 'tamCanh', 5);
          return 'Bên ngoài gào thét cả đêm. Bên trong, bạn nghe rõ nhịp tim của mình.';
        },
      },
    ],
  },
  // 6. Ma Đế băng hà (3 bước)
  {
    id: 'st_ma_de_1',
    cosmos: 'ma',
    once: true,
    weight: 40,
    when: (c) => (c.maStep ?? 0) >= 4 || c.realm >= 9,
    title: 'Ma Đế bệnh nặng',
    text: () =>
      'Tin đồn lan khắp Ma giới: Ma Đế bế quan trăm năm chưa ra, Vạn Ma Điện đóng cửa. Đại hoàng tử Huyết Ly gom binh, Tam công chúa Ảnh Nguyệt gom người. Cả hai đều gửi thư cho bạn.',
    choices: () => [
      {
        label: 'Theo Đại hoàng tử Huyết Ly',
        hint: 'binh mạnh, trận thẳng',
        lean: 'ta',
        run: (c) => {
          setArc(c, 'ma_de', 1);
          money(c, 200 * tier(c));
          return 'Huyết Ly cười lớn, trao cho bạn một lá cờ huyết kỳ: "Ngày ta lên ngôi, ngươi đứng bên phải ta."';
        },
      },
      {
        label: 'Theo Tam công chúa Ảnh Nguyệt',
        hint: 'mưu kế, đánh lén',
        lean: 'trung',
        run: (c) => {
          setArc(c, 'ma_de', 2);
          stat(c, 'ngoTinh', 5);
          return 'Ảnh Nguyệt không nói gì, chỉ đưa bạn một tấm bản đồ đường hầm dưới Vạn Ma Điện.';
        },
      },
      {
        label: 'Đứng ngoài',
        hint: 'an toàn bây giờ',
        lean: 'chinh',
        run: (c) => {
          setArc(c, 'ma_de', 3);
          stat(c, 'tamCanh', 4);
          return 'Bạn đốt cả hai lá thư. Ở Ma giới, đứng ngoài cũng là một lựa chọn. Chỉ là không ai nhớ ơn kẻ đứng ngoài.';
        },
      },
    ],
  },
  {
    id: 'st_ma_de_2',
    cosmos: 'ma',
    once: true,
    weight: 300,
    when: (c) => next(c, 'ma_de', [1, 2, 3], 6),
    title: 'Chính biến Vạn Ma Điện',
    text: (c) =>
      arc(c, 'ma_de') === 3
        ? 'Đêm chính biến. Cả hai phe đánh nhau dưới chân Vạn Ma Điện. Một toán quân thua chạy ngang nhà bạn, xin chỗ trốn.'
        : `Đêm chính biến. ${arc(c, 'ma_de') === 1 ? 'Huyết Ly dẫn quân đánh thẳng cửa chính, bạn đi đầu.' : 'Ảnh Nguyệt dẫn bạn chui đường hầm, tới thẳng tẩm cung Ma Đế.'}`,
    choices: (c) =>
      arc(c, 'ma_de') === 3
        ? [
            {
              label: 'Cho trốn',
              hint: 'ân tình, có thể bị liên lụy',
              lean: 'chinh',
              run: (ch, ctx) => {
                setArc(ch, 'ma_de', 6);
                dao(ch, 6);
                if (ctx.rnd() < 0.3) return 'Truy binh lục nhà bạn. Bạn phải đánh một trận mới giữ được người.' + hurt(ch, 25, ctx);
                return 'Bạn giấu họ dưới hầm rượu. Truy binh đi qua không ngó lại.';
              },
            },
            {
              label: 'Đóng cửa',
              lean: 'ta',
              run: (ch) => {
                setArc(ch, 'ma_de', 7);
                return 'Bạn nghe tiếng gõ cửa tắt dần, rồi tiếng đao. Sáng ra trước cửa sạch sẽ, như chưa có gì.';
              },
            },
          ]
        : [
            {
              label: 'Xông lên',
              hint: 'thắng: công thần, thua: trọng thương hoặc chết',
              lean: 'ta',
              run: (ch, ctx) => {
                const side = arc(ch, 'ma_de');
                if (fight(ch, ctx, side === 1 ? 0.5 : 0.55)) {
                  setArc(ch, 'ma_de', side === 1 ? 4 : 5);
                  addCult(ch, reward(ch, 1.2));
                  ctx.fx('breakthrough', 'Chính biến');
                  return side === 1
                    ? 'Cửa chính vỡ. Huyết Ly bước qua xác vệ binh, lên ngồi ngai. Bạn đứng bên phải hắn, áo đẫm máu.'
                    : 'Tẩm cung trống rỗng, Ma Đế đã tọa hóa từ lâu. Ảnh Nguyệt đặt ấn lên trán mình. Bạn là người đầu tiên quỳ xuống.';
                }
                setArc(ch, 'ma_de', 8);
                const f = fatal(ch, ctx, 0.15, 'Chính biến thất bại. Đầu bạn bị treo trên cổng Vạn Ma Điện ba ngày.');
                if (ch.dead) return f ?? '';
                return 'Phe bạn thua. Bạn chạy được, nhưng mang theo một vết thương không lành.' + hurt(ch, 45, ctx);
              },
            },
            {
              label: 'Quay giáo giữa trận',
              hint: 'phản chủ, có thể được phe kia trọng dụng',
              lean: 'ta',
              run: (ch, ctx) => {
                dao(ch, -12);
                if (ctx.rnd() < 0.5) {
                  setArc(ch, 'ma_de', arc(ch, 'ma_de') === 1 ? 5 : 4);
                  money(ch, 600 * tier(ch));
                  return 'Bạn đâm sau lưng chủ cũ. Phe kia thắng, nhớ công bạn. Ma giới quý kẻ biết thời thế.';
                }
                setArc(ch, 'ma_de', 8);
                return 'Phe kia nhận bạn rồi cũng không tin bạn. Bạn bị tước binh, đuổi về.' + hurt(ch, 20, ctx);
              },
            },
          ],
  },
  {
    id: 'st_ma_de_3',
    cosmos: 'ma',
    once: true,
    weight: 300,
    when: (c) => next(c, 'ma_de', [4, 5, 6, 7, 8], 5),
    title: 'Tân Ma Đế',
    text: (c) => {
      const v = arc(c, 'ma_de');
      if (v === 4 || v === 5) return `${v === 4 ? 'Tân Ma Đế Huyết Ly' : 'Tân Ma Đế Ảnh Nguyệt'} mở tiệc phong thưởng. Tên bạn được đọc đầu tiên.`;
      if (v === 6) return 'Một người lạ tìm tới, quỳ trước cửa: "Năm đó ngài cho chúng tôi trốn. Giờ chủ tôi đã lên ngôi."';
      if (v === 7) return 'Tân Ma Đế cho người đi khắp nơi tìm những kẻ năm đó đóng cửa. Không phải để phạt. Để nhớ mặt.';
      return 'Tân Ma Đế lên ngôi. Danh sách thanh trừng có tên bạn.';
    },
    choices: (c) => {
      const v = arc(c, 'ma_de');
      if (v === 4 || v === 5 || v === 6)
        return [
          {
            label: 'Nhận phong thưởng',
            hint: 'linh thạch lớn, tu vi',
            lean: 'trung',
            run: (ch, ctx) => {
              setArc(ch, 'ma_de', 9);
              money(ch, (v === 6 ? 700 : 1200) * tier(ch));
              addCult(ch, reward(ch, 1));
              ch.maTitle = v === 6 ? 'Ân Nhân Vạn Ma' : 'Khai Quốc Ma Hầu';
              ctx.fx('coin', ch.maTitle);
              return `Bạn được phong làm ${ch.maTitle}. Từ nay đi đâu ở Ma giới cũng có người cúi đầu.`;
            },
          },
          {
            label: 'Chối từ, xin về ẩn cư',
            hint: 'tâm cảnh, khí vận',
            lean: 'chinh',
            run: (ch) => {
              setArc(ch, 'ma_de', 9);
              stat(ch, 'tamCanh', 10);
              stat(ch, 'khiVan', 8);
              return 'Bạn xin về. Tân Ma Đế nhìn bạn rất lâu, rồi cho phép. Người biết lúc nào nên rời triều đình thường sống lâu nhất.';
            },
          },
        ];
      return [
        {
          label: 'Chạy trốn ra rìa Ma giới',
          hint: 'mất linh thạch, sống',
          lean: 'trung',
          run: (ch) => {
            setArc(ch, 'ma_de', 9);
            money(ch, -Math.min(ch.linhThach, 500 * tier(ch)));
            ch.maLand = 0;
            return 'Bạn bỏ cả địa bàn lẫn gia sản, chạy ra rìa Ma giới. Nghèo, nhưng còn thở.';
          },
        },
        {
          label: 'Ở lại, chờ chúng tới',
          hint: 'đánh một trận',
          lean: 'ta',
          run: (ch, ctx) => {
            setArc(ch, 'ma_de', 9);
            if (fight(ch, ctx, 0.5)) {
              stat(ch, 'khiVan', 10);
              addCult(ch, reward(ch, 0.8));
              return 'Ba toán sát thủ tới, ba toán không về. Tân Ma Đế xóa tên bạn khỏi danh sách, coi như chưa từng viết.';
            }
            const f = fatal(ch, ctx, 0.2, 'Toán sát thủ thứ tư tới lúc bạn đang băng bó. Không còn toán thứ năm cần tới.');
            if (ch.dead) return f ?? '';
            return 'Bạn sống sót, nhưng nằm liệt nhiều năm.' + hurt(ch, 50, ctx);
          },
        },
      ];
    },
  },
  // 7. Cửu U Thâm Uyên (lặp lại, mỗi lần xuống sâu hơn)
  {
    id: 'st_cuu_u',
    cosmos: 'ma',
    weight: 16,
    cooldown: 8,
    when: (c) => arc(c, 'cuu_u') < 9,
    title: 'Cửu U Thâm Uyên',
    text: (c) => {
      const n = arc(c, 'cuu_u');
      return n === 0
        ? 'Dưới đáy Ma giới có một vực sâu chín tầng, gọi là Cửu U. Nghe nói ai xuống tới tầng cuối thì gặp Cửu U Ma Long đang ngủ, dưới bụng nó là kho báu của chín đời Ma Đế.'
        : n === 8
          ? 'Tầng chín. Không còn đường xuống nữa. Trong bóng tối có tiếng thở, mỗi hơi thở làm vực rung một lần. Cửu U Ma Long mở một mắt.'
          : `Bạn đã xuống tới tầng ${n} của Cửu U. Tầng ${n + 1} tối hơn, lạnh hơn, và có tiếng gì đó đang cào vào vách đá.`;
    },
    choices: (c) => {
      const n = arc(c, 'cuu_u');
      if (n === 8)
        return [
          {
            label: 'Đánh Cửu U Ma Long',
            hint: 'trận cuối, kho báu chín đời Ma Đế',
            lean: 'ta',
            run: (ch, ctx) => {
              if (fight(ch, ctx, 0.4)) {
                setArc(ch, 'cuu_u', 9);
                money(ch, 5000);
                addCult(ch, reward(ch, 2.5));
                stat(ch, 'khiVan', 15);
                ctx.fx('breakthrough', 'Cửu U');
                return 'Ma Long gục xuống, cả vực sụp theo. Bạn leo lên với một túi đầy bảo vật của chín đời Ma Đế. Từ nay Ma giới gọi bạn là kẻ đi qua Cửu U.';
              }
              setArc(ch, 'cuu_u', 5);
              const f = fatal(ch, ctx, 0.25, 'Cửu U Ma Long nuốt bạn vào bụng. Bạn trở thành một phần của kho báu.');
              if (ch.dead) return f ?? '';
              return 'Ma Long phun một hơi, bạn bị thổi ngược lên tầng năm.' + hurt(ch, 55, ctx);
            },
          },
          {
            label: 'Lặng lẽ lui',
            lean: 'trung',
            run: (ch) => {
              setArc(ch, 'cuu_u', 7);
              stat(ch, 'tamCanh', 4);
              return 'Bạn lùi từng bước. Con mắt kia khép lại. Lần sau vậy.';
            },
          },
        ];
      return [
        {
          label: `Xuống tầng ${n + 1}`,
          hint: 'càng sâu càng nhiều của, càng dễ chết',
          lean: 'ta',
          run: (ch, ctx) => {
            setArc(ch, 'cuu_u', n + 1);
            const g = 150 * (n + 1) * tier(ch);
            money(ch, g);
            addCult(ch, reward(ch, 0.3 + n * 0.12));
            if (ctx.rnd() < 0.06 + n * 0.05) {
              const f = fatal(ch, ctx, 0.04 + n * 0.015, `Bóng tối ở tầng ${n + 1} Cửu U nuốt mất bạn. Không ai biết bạn đã gặp gì.`);
              if (ch.dead) return f ?? '';
              return `Ở tầng ${n + 1}, một thứ không có hình dạng quấn lấy bạn. Bạn giãy thoát, mang theo ${g} linh thạch và một vết cào sâu tới xương.` + hurt(ch, 20 + n * 5, ctx);
            }
            return `Tầng ${n + 1}: xác ma tu đời trước nằm la liệt, túi đồ còn nguyên. Bạn nhặt được ${g} linh thạch.`;
          },
        },
        {
          label: 'Leo lên, để lần sau',
          lean: 'trung',
          run: () => 'Bạn leo lên. Cửu U vẫn ở đó, chờ.',
        },
      ];
    },
  },

  // ================= Thái Hư giới =================
  // 8. Kẻ giữ đồng hồ cát (lặp lại)
  {
    id: 'st_dong_ho_cat',
    cosmos: 'hu',
    weight: 14,
    cooldown: 25,
    title: 'Kẻ giữ đồng hồ cát',
    text: () => 'Giữa hư không có một người ngồi lật đồng hồ cát. Mỗi hạt cát là một năm của ai đó. Lão ngẩng lên: "Muốn đổi không? Năm lấy đạo, hay đạo lấy năm."',
    choices: () => [
      {
        label: 'Đổi 40 năm thọ lấy tu vi',
        hint: 'tu vi rất lớn, mất thọ',
        lean: 'ta',
        run: (c, ctx) => {
          c.lifespan = Math.max(Math.floor(c.age) + 5, c.lifespan - 40);
          addCult(c, reward(c, 2.5));
          ctx.fx('breakthrough', 'Đồng hồ cát');
          return 'Bốn mươi hạt cát rơi khỏi tay bạn. Tu vi tràn đầy, tóc bạc thêm một nửa.';
        },
      },
      {
        label: 'Đổi tu vi lấy 40 năm thọ',
        hint: 'mất một phần tu vi, thêm thọ',
        lean: 'trung',
        run: (c) => {
          c.cultivation = Math.round(c.cultivation * 0.6);
          const b = c.lifespan;
          c.lifespan = Math.min(tamCap(c) + 100, c.lifespan + 40);
          c.lifeExtra = (c.lifeExtra ?? 0) + (c.lifespan - b);
          return 'Lão lật ngược đồng hồ. Cát chảy lên. Bạn trẻ lại, tu vi lùi một đoạn.';
        },
      },
      {
        label: 'Hỏi lão đồng hồ của lão còn bao nhiêu',
        hint: 'ngộ tính, tâm cảnh',
        lean: 'chinh',
        run: (c) => {
          stat(c, 'ngoTinh', 6);
          stat(c, 'tamCanh', 6);
          return 'Lão nhìn bạn, rồi cười: "Ta không có đồng hồ. Vì thế ta ngồi đây." Bạn ngồi cạnh lão rất lâu.';
        },
      },
    ],
  },
  // 9. Bóng kiếp trước (một lần, cần có kiếp trước)
  {
    id: 'st_bong_kiep_truoc',
    cosmos: 'hu',
    once: true,
    weight: 40,
    when: (c) => !!c.past,
    title: 'Bóng kiếp trước',
    text: (c) =>
      `Ở Thái Hư, có lúc bóng của các kiếp cũ trôi ngang. Hôm nay bạn gặp ${c.past!.name}, ${c.past!.realmName}, chính mình kiếp trước. ${c.past!.cause ? `Trên người bóng ấy vẫn còn dấu vết của lúc chết: ${c.past!.cause.replace(/\.$/, '').toLowerCase()}.` : ''}`,
    choices: (c) => [
      {
        label: 'Hỏi bóng ấy còn tiếc điều gì',
        hint: 'tâm cảnh, ngộ tính',
        lean: 'chinh',
        run: (ch) => {
          stat(ch, 'tamCanh', 10);
          stat(ch, 'ngoTinh', 6);
          return c.past?.partner
            ? `Bóng ấy chỉ nói một cái tên: ${c.past.partner}. Rồi tan ra. Bạn nhớ cái tên đó suốt kiếp này.`
            : 'Bóng ấy lắc đầu: "Không tiếc. Chỉ muốn biết kiếp sau mình đi được bao xa." Bạn đứng thẳng lưng cho nó nhìn.';
        },
      },
      {
        label: 'Hấp thu bóng ấy',
        hint: 'tu vi lớn, tâm ma',
        lean: 'ta',
        run: (ch) => {
          addCult(ch, reward(ch, 1.6));
          stat(ch, 'tamMa', 8);
          return 'Bóng kiếp trước tan vào người bạn. Bạn mạnh hơn, và đêm nào cũng mơ thấy một cái chết không phải của mình. Hay là của mình.';
        },
      },
      {
        label: 'Tiễn nó vào luân hồi',
        hint: 'khí vận',
        lean: 'chinh',
        run: (ch) => {
          stat(ch, 'khiVan', 12);
          dao(ch, 5);
          return 'Bạn chỉ đường cho bóng ấy về phía cầu Nại Hà. Nó cúi đầu chào chính mình, rồi đi.';
        },
      },
    ],
  },
  // 10. Vá trời (2 bước)
  {
    id: 'st_va_troi_1',
    cosmos: 'hu',
    once: true,
    weight: 35,
    title: 'Hư không rách',
    text: () => 'Hư không nứt một đường dài vạn dặm. Từ khe nứt rỉ ra linh khí của cõi khác, đặc như sương. Đứng gần thì tu nhanh gấp mười. Nhưng khe nứt mỗi ngày một rộng.',
    choices: () => [
      {
        label: 'Lấy tu vi vá lại',
        hint: 'mất tu vi, khí vận và tâm cảnh lớn',
        lean: 'chinh',
        run: (c) => {
          setArc(c, 'va_troi', 1);
          c.cultivation = Math.round(c.cultivation * 0.65);
          stat(c, 'khiVan', 10);
          stat(c, 'tamCanh', 8);
          return 'Bạn ngồi bên khe nứt chín năm, rút từng sợi linh lực của mình khâu lại. Khe khép. Bạn yếu đi, nhưng nhẹ người.';
        },
      },
      {
        label: 'Ngồi bên khe hút linh khí',
        hint: 'tu vi lớn ngay, hậu quả về sau',
        lean: 'ta',
        run: (c) => {
          setArc(c, 'va_troi', 2);
          addCult(c, reward(c, 1.8));
          return 'Bạn ngồi hút tới no. Khe nứt rộng thêm một chút. Một chút thôi.';
        },
      },
      {
        label: 'Gọi cả tiên lẫn ma tới cùng vá',
        hint: 'ngộ tính, chuyện còn dài',
        lean: 'trung',
        run: (c) => {
          setArc(c, 'va_troi', 3);
          stat(c, 'ngoTinh', 6);
          return 'Bạn gửi thư lên Thiên Đình và xuống Vạn Ma Điện. Hai bên đọc xong, cùng cười khẩy. Rồi cùng gửi người tới.';
        },
      },
    ],
  },
  {
    id: 'st_va_troi_2',
    cosmos: 'hu',
    once: true,
    weight: 300,
    when: (c) => next(c, 'va_troi', [1, 2, 3], 7),
    title: 'Khe nứt năm ấy',
    text: (c) => {
      const v = arc(c, 'va_troi');
      if (v === 1) return 'Chỗ bạn vá năm xưa mọc lên một dải tinh vân. Lão tán tiên câu cá ở Bờ Thái Hư bay tới, chống cần nhìn: "Mũi khâu đẹp đấy."';
      if (v === 2) return 'Khe nứt năm xưa giờ đã nuốt trọn một tinh vực. Cả Thái Hư biết ai đã ngồi hút ở đó.';
      return 'Tiên binh và ma binh vá xong khe nứt, rồi ngồi lại uống với nhau một chén. Lần đầu tiên sau vạn năm.';
    },
    choices: (c) => {
      const v = arc(c, 'va_troi');
      if (v === 2)
        return [
          {
            label: 'Lấy thân mình chặn khe',
            hint: 'mất nhiều tu vi và máu, sửa sai',
            lean: 'chinh',
            run: (ch, ctx) => {
              setArc(ch, 'va_troi', 9);
              ch.cultivation = Math.round(ch.cultivation * 0.5);
              dao(ch, 10);
              stat(ch, 'tamCanh', 10);
              return 'Bạn đứng vào giữa khe nứt, lấy cả tiên thể làm miếng vá. Khe khép lại. Bạn thì gần như vỡ.' + hurt(ch, 45, ctx);
            },
          },
          {
            label: 'Bỏ chạy sang tinh vực khác',
            hint: 'giữ tu vi, mang tiếng',
            lean: 'ta',
            run: (ch) => {
              setArc(ch, 'va_troi', 9);
              dao(ch, -10);
              stat(ch, 'tamMa', 10);
              stat(ch, 'khiVan', -8);
              return 'Bạn đi thật xa. Nhưng ở Thái Hư, đi xa đến mấy cũng còn thấy khe nứt ấy trên trời.';
            },
          },
        ];
      return [
        {
          label: v === 1 ? 'Xin lão dạy câu cá' : 'Nâng chén cùng hai bên',
          hint: 'tâm ma giảm, tu vi',
          lean: 'trung',
          run: (ch) => {
            setArc(ch, 'va_troi', 9);
            stat(ch, 'tamMa', -12);
            addCult(ch, reward(ch, 1.2));
            return v === 1
              ? 'Lão dạy bạn câu bằng lưỡi câu thẳng. Cả trăm năm không được con cá nào, nhưng tu vi bạn lặng lẽ dày thêm.'
              : 'Hai bên uống hết một chum rượu thì về. Mai lại đánh nhau. Nhưng tối nay thì không.';
          },
        },
        {
          label: 'Ghi lại chuyện này lên vách Thái Hư',
          hint: 'khí vận, ngộ tính',
          lean: 'chinh',
          run: (ch) => {
            setArc(ch, 'va_troi', 9);
            stat(ch, 'khiVan', 10);
            stat(ch, 'ngoTinh', 6);
            return 'Bạn khắc chuyện vá trời lên vách đá trôi. Vạn năm sau sẽ có người đọc.';
          },
        },
      ];
    },
  },
];
