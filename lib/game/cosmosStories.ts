import { addCult, addLife, addPill, dao, fatal, hurt, luck, money, reward, stat } from './helpers';
import type { Character, EffectCtx, GameEvent } from './types';
import { tr } from '../i18n';
import { ctArc, ctNext, ctSet, cutLife, hasLore } from './ctArc';

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
    title: tr('Canh bến Thiên Hà', "Guarding the Heavenly River Ford"),
    text: () =>
      tr('Thiên Đình giao cho bạn canh bến Thiên Hà một trăm năm. Đêm đầu tiên, một con giao long non trườn lên bờ, vảy còn mềm, mắt rưng rưng: "Tiên quan, cho con qua sông. Mẹ con ở biển bên kia."', "The Heavenly Court assigns you to guard the Heavenly River ford for a hundred years. On the very first night, a young flood dragon slithers onto the bank, its scales still soft, eyes brimming: \"Immortal official, let me cross. My mother is in the sea on the other side.\""),
    choices: () => [
      {
        label: tr('Thả cho nó qua', "Let it cross"),
        hint: tr('nghiêng chính, trái lệnh', "leans Righteous, defies orders"),
        lean: 'chinh',
        run: (c) => {
          setArc(c, 'thien_ha', 1);
          dao(c, 8);
          return tr('Bạn quay mặt đi. Giao long lặn xuống, để lại một vệt sáng dài trên mặt sông. Không ai biết. Ít nhất là bây giờ.', "You look away. The flood dragon dives, leaving a long streak of light on the river. No one knows. At least, not yet.");
        },
      },
      {
        label: tr('Bắt nộp lên Thiên Đình', "Hand it over to the Heavenly Court"),
        hint: tr('được thưởng, nghiêng tà', "rewarded, leans Evil"),
        lean: 'ta',
        run: (c) => {
          setArc(c, 'thien_ha', 2);
          dao(c, -6);
          money(c, 200 * tier(c));
          stat(c, 'khiVan', 4);
          return tr('Bạn trói nó bằng dây tiên, nộp lên Thiên Binh Ty. Được khen một câu, thưởng một túi linh thạch. Tiếng giao long gọi mẹ vang suốt đêm.', "You bind it with immortal rope and hand it over to the Heavenly Soldiers Bureau. You earn a word of praise and a pouch of spirit stones. The flood dragon cries for its mother all night long.");
        },
      },
      {
        label: tr('Hỏi vì sao mẹ nó ở bên kia', "Ask why its mother is on the other side"),
        hint: tr('ngộ tính', "Insight"),
        lean: 'trung',
        run: (c) => {
          setArc(c, 'thien_ha', 1);
          stat(c, 'ngoTinh', 6);
          return tr('Nó kể Thiên Hà vốn không có bờ, là Thiên Đình vạch ra để chia trời. Bạn nghe xong, lặng lẽ tháo xích bến. Giao long đi rồi, câu chuyện còn ở lại.', "It tells you the Heavenly River never had banks; the Heavenly Court drew them to divide the sky. When it finishes, you quietly unchain the ford. The flood dragon leaves, but its story stays.");
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
    title: tr('Thiên Hà dậy sóng', "The Heavenly River surges"),
    text: (c) =>
      arc(c, 'thien_ha') === 1
        ? tr('Tám năm sau, mặt Thiên Hà nổ tung. Một con rồng xanh dài trăm trượng ngẩng đầu trước bến: "Tiên quan còn nhớ con không?"', "Eight years later, the surface of the Heavenly River bursts apart. An azure dragon a thousand feet long raises its head before the ford: \"Immortal official, do you still remember me?\"")
        : tr('Tám năm sau, Thiên Hà dâng lũ ngập ba tầng trời. Giữa sóng là một con long mẫu mắt đỏ ngầu: "Trả con cho ta!" Thiên Đình truy trách người canh bến.', "Eight years later, the Heavenly River floods three layers of heaven. In the middle of the waves is a dragon mother with blood-red eyes: \"Give me back my child!\" The Heavenly Court holds the ford keeper responsible."),
    choices: (c) =>
      arc(c, 'thien_ha') === 1
        ? [
            {
              label: tr('Nhận long châu báo ân', "Accept a dragon pearl in gratitude"),
              hint: tr('tu vi lớn', "big cultivation"),
              lean: 'trung',
              run: (ch, ctx) => {
                setArc(ch, 'thien_ha', 9);
                addCult(ch, reward(ch, 2));
                ctx.fx('breakthrough', tr('Long châu', "Dragon pearl"));
                return tr('Rồng nhả ra một viên long châu to bằng nắm tay. Bạn nuốt vào, linh lực cuộn như sóng Thiên Hà.', "The dragon spits out a pearl the size of a fist. You swallow it, and spiritual power churns like the waves of the Heavenly River.");
              },
            },
            {
              label: tr('Nhờ nó cõng lên Bích Lạc', "Ask it to carry you up to Biluo"),
              hint: tr('khí vận, ngộ tính', "Luck, Insight"),
              lean: 'chinh',
              run: (ch) => {
                setArc(ch, 'thien_ha', 9);
                stat(ch, 'khiVan', 12);
                stat(ch, 'ngoTinh', 6);
                return tr('Rồng cõng bạn bay tới tận Bích Lạc, nơi tiên nhân bình thường không được tới. Bạn nhìn thấy cả ba cõi từ trên cao.', "The dragon carries you all the way to Biluo, where ordinary immortals may not go. You see all Three Realms from on high.");
              },
            },
          ]
        : [
            {
              label: tr('Nhận tội, nộp phạt', "Confess and pay the fine"),
              hint: tr('mất linh thạch, tâm cảnh', "lose spirit stones, Mind"),
              lean: 'chinh',
              run: (ch) => {
                setArc(ch, 'thien_ha', 9);
                money(ch, -Math.min(ch.linhThach, 600 * tier(ch)));
                stat(ch, 'tamCanh', 6);
                dao(ch, 5);
                return tr('Bạn quỳ trước Thiên Đình, nộp gần hết gia sản đền cho long mẫu. Giao long được thả. Long mẫu nhìn bạn rất lâu rồi rút nước.', "You kneel before the Heavenly Court and hand over nearly all your wealth as compensation to the dragon mother. The flood dragon is released. The dragon mother looks at you for a long time, then draws back the waters.");
              },
            },
            {
              label: tr('Ra bến chặn long mẫu', "Go to the ford and stop the dragon mother"),
              hint: tr('đánh một trận, thắng được Thiên Đình trọng thưởng', "a fight; win and the Heavenly Court rewards you richly"),
              lean: 'ta',
              run: (ch, ctx) => {
                setArc(ch, 'thien_ha', 9);
                if (fight(ch, ctx, 0.45)) {
                  money(ch, 800 * tier(ch));
                  addCult(ch, reward(ch, 1));
                  return tr('Bạn chém đứt một sừng long mẫu. Nó gầm lên rồi lặn mất. Thiên Đình ghi công, nhưng từ đó Thiên Hà không bao giờ yên.', "You sever one of the dragon mother's horns. She roars and dives out of sight. The Heavenly Court records your merit, but from then on the Heavenly River is never calm again.");
                }
                const f = fatal(ch, ctx, 0.12, tr('Long mẫu cuốn bạn xuống đáy Thiên Hà. Không ai vớt được tiên thể.', "The dragon mother drags you to the bottom of the Heavenly River. No one ever recovers your immortal body."));
                if (ch.dead) return f ?? '';
                return tr('Long mẫu quật một đuôi, bạn văng khỏi bến.', "The dragon mother lashes her tail and sends you flying off the ford.") + hurt(ch, 40, ctx);
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
    title: tr('Cây quế Quảng Hàn', "The Osmanthus of Guanghan"),
    text: (c) =>
      tr(`Ngoài cung Quảng Hàn, Ngô Cương vẫn chặt cây quế. Nhát rìu vừa rút ra, vết chém đã liền lại. Lão chào bạn lần thứ ${arc(c, 'quang_han') + 1}: "Lại tới à. Rượu quế năm nay ngon lắm."`, `Outside Guanghan Palace, Wu Gang is still chopping at the osmanthus tree. The moment his axe pulls free, the cut heals over. He greets you on visit number ${arc(c, 'quang_han') + 1}: "Back again, eh? The osmanthus wine is excellent this year."`),
    choices: () => [
      {
        label: tr('Chặt giúp một nhát', "Chop once for him"),
        hint: tr('ngộ tính, tâm cảnh', "Insight, Mind"),
        lean: 'chinh',
        run: (c, ctx) => {
          const n = arc(c, 'quang_han') + 1;
          setArc(c, 'quang_han', n);
          stat(c, 'ngoTinh', 4);
          stat(c, 'tamCanh', 4);
          if (n >= 3 && ctx.rnd() < 0.5) {
            addPill(c, 'dien_tho', 1);
            return tr('Nhát rìu của bạn để lại một vết không liền. Ngô Cương sững người, rồi bật khóc. Lão nhét vào tay bạn một viên Diên Thọ Đan cất suốt vạn năm.', "Your axe stroke leaves a cut that doesn't heal. Wu Gang freezes, then bursts into tears. He presses into your hand a Longevity Pill he has kept for ten thousand years.");
          }
          return tr('Vết chém liền lại như chưa từng có. Nhưng tay bạn biết thêm một điều về sự kiên nhẫn.', "The cut heals as if it had never been. But your hands have learned one more thing about patience.");
        },
      },
      {
        label: tr('Lén bẻ một cành quế', "Secretly snap off an osmanthus twig"),
        hint: tr('Diên Thọ Đan, phạm thiên quy', "Longevity Pill, breaks heavenly law"),
        lean: 'ta',
        run: (c, ctx) => {
          setArc(c, 'quang_han', arc(c, 'quang_han') + 1);
          dao(c, -6);
          if (ctx.rnd() < 0.3) return tr('Thỏ ngọc thấy, kêu ầm lên. Thiên binh tới bắt.', "The Jade Rabbit sees and raises a racket. Heavenly soldiers come to arrest you.") + hurt(c, 25, ctx);
          addPill(c, 'dien_tho', 1);
          return tr('Cành quế trong tay bạn tỏa hương mát lạnh. Đem luyện được một viên Diên Thọ Đan.', "The twig in your hand gives off a cool fragrance. You refine it into a Longevity Pill.");
        },
      },
      {
        label: tr('Ngồi uống rượu với lão', "Sit and drink with him"),
        hint: tr('tâm ma giảm', "heart demon down"),
        lean: 'trung',
        run: (c) => {
          setArc(c, 'quang_han', arc(c, 'quang_han') + 1);
          stat(c, 'tamMa', -10);
          return tr('Hai người uống tới khi trăng lặn. Ngô Cương nói chặt cây không phải hình phạt, mà là cách lão quên. Bạn không hỏi lão quên cái gì.', "The two of you drink until the moon sets. Wu Gang says chopping the tree isn't a punishment, it's how he forgets. You don't ask what he's forgetting.");
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
    title: tr('Trông lò Bát Quái', "Minding the Eight Trigrams Furnace"),
    text: () => tr('Thái Thượng Lão Quân đi giảng đạo ba năm, nhờ bạn trông lò Bát Quái. Dặn đúng một câu: "Đừng mở nắp."', "Taishang Laojun is off lecturing on the Dao for three years and asks you to mind the Eight Trigrams Furnace. He leaves exactly one instruction: \"Don't lift the lid.\""),
    choices: () => [
      {
        label: tr('Canh lửa đúng ba năm', "Tend the fire for exactly three years"),
        hint: tr('đan dược', "pills"),
        lean: 'chinh',
        run: (c) => {
          addPill(c, 'tu_khi', 2);
          addPill(c, 'thanh_tam', 1);
          stat(c, 'tamCanh', 4);
          return tr('Lão Quân về, mở lò, gật gù. Lão chia cho bạn mấy viên đan còn ấm.', "Laojun returns, opens the furnace and nods in approval. He shares a few still-warm pills with you.");
        },
      },
      {
        label: tr('Mở nắp xem một chút', "Lift the lid for a peek"),
        hint: tr('được ăn cả, ngã về không', "all or nothing"),
        lean: 'ta',
        run: (c, ctx) => {
          if (ctx.rnd() < luck(c, 0.5)) {
            addCult(c, reward(c, 2.2));
            ctx.fx('breakthrough', tr('Tiên đan', "Immortal pill"));
            return tr('Một viên đan vàng bay vụt ra, bạn há miệng đớp được. Tu vi tăng vọt. Lão Quân về, đếm thiếu một viên, nhìn bạn rất lâu.', "A golden pill shoots out and you snap it out of the air with your mouth. Your cultivation soars. Laojun returns, counts one pill short, and stares at you for a long time.");
          }
          money(c, -Math.min(c.linhThach, 500 * tier(c)));
          return tr('Lò nổ. Khói bát quái phủ kín Đâu Suất cung. Bạn phải đền cả một lò.', "The furnace explodes. Eight Trigrams smoke fills all of Tushita Palace. You have to pay for an entire batch.") + hurt(c, 30, ctx);
        },
      },
      {
        label: tr('Ném vũ khí của mình vào luyện', "Throw your own weapon in to refine"),
        hint: tr('khí vận, tu vi', "Luck, cultivation"),
        lean: 'trung',
        run: (c) => {
          addCult(c, reward(c, 0.8));
          stat(c, 'khiVan', 8);
          return tr('Vũ khí ra lò sáng như mới rèn, phảng phất mùi đan hương. Ít nhất nó tin vậy.', "Your weapon comes out of the furnace gleaming like it was freshly forged, with a faint scent of elixir. At least, it believes so.");
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
    title: tr('Miếu thờ ở nhân gian', "A shrine in the mortal world"),
    text: (c) =>
      tr(`Có tiếng khấn vọng lên tận Thiên Đình. Ở quê cũ, hậu nhân lập miếu thờ ${c.name}. Ba năm hạn hán, ruộng nứt như mai rùa, họ quỳ trước tượng bạn xin một trận mưa.`, `Prayers rise all the way to the Heavenly Court. Back in your old hometown, your descendants have built a shrine to ${c.name}. After three years of drought, the fields cracked like turtle shells, they kneel before your statue begging for rain.`),
    choices: () => [
      {
        label: tr('Lén làm mưa', "Secretly make rain"),
        hint: tr('nghiêng chính, phạm thiên quy', "leans Righteous, breaks heavenly law"),
        lean: 'chinh',
        run: (c) => {
          setArc(c, 'mieu', 1);
          dao(c, 10);
          return tr('Bạn vẩy tay áo. Mây kéo về, mưa ba ngày ba đêm. Dưới trần, người ta reo hò quanh miếu. Trên trời, sổ thiên quy ghi thêm một dòng.', "You flick your sleeve. Clouds roll in and it rains for three days and three nights. Down below, people cheer around the shrine. Up above, the ledger of heavenly law gains one more line.");
        },
      },
      {
        label: tr('Dâng sớ xin Thiên Đình', "Submit a petition to the Heavenly Court"),
        hint: tr('tốn linh thạch, đúng luật', "costs spirit stones, by the book"),
        lean: 'trung',
        run: (c) => {
          setArc(c, 'mieu', 2);
          money(c, -Math.min(c.linhThach, 300 * tier(c)));
          return tr('Sớ phải qua bảy cửa, mỗi cửa một lễ. Bạn trả đủ, rồi chờ.', "The petition must pass seven gates, each with its own tribute. You pay them all, then wait.");
        },
      },
      {
        label: tr('Làm ngơ', "Ignore it"),
        hint: tr('tiên phàm cách biệt', "immortals and mortals are worlds apart"),
        lean: 'ta',
        run: (c) => {
          setArc(c, 'mieu', 9);
          stat(c, 'tamMa', 8);
          return tr('Bạn đóng cửa sổ, tiếng khấn nhỏ dần. Năm sau thì không còn nghe nữa.', "You shut the window and the prayers grow faint. The next year you no longer hear them.");
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
    title: tr('Miếu cũ', "The old shrine"),
    text: (c) =>
      arc(c, 'mieu') === 1
        ? tr('Thiên quy ty gửi trát: người canh mưa nhân gian báo có tiên nhân tự ý làm mưa. Họ cần một cái tên.', "The Bureau of Heavenly Law sends a summons: the mortal rain-watcher reports that an immortal made rain without permission. They need a name.")
        : tr('Sớ của bạn cuối cùng cũng được duyệt. Mưa xuống, nhưng muộn năm năm. Miếu đã hoang, chỉ còn một bà cụ ngày ngày quét lá.', "Your petition is finally approved. The rain falls, but five years late. The shrine is abandoned, with only an old woman sweeping the leaves day after day."),
    choices: (c) =>
      arc(c, 'mieu') === 1
        ? [
            {
              label: tr('Nhận là mình', "Admit it was you"),
              hint: tr('bị phạt tu vi, tâm cảnh lớn', "cultivation penalty, big Mind"),
              lean: 'chinh',
              run: (ch) => {
                setArc(ch, 'mieu', 9);
                ch.cultivation = Math.round(ch.cultivation * 0.7);
                stat(ch, 'tamCanh', 12);
                stat(ch, 'khiVan', 6);
                return tr('Bạn bị phạt diện bích năm năm, tu vi tụt mất một đoạn. Nhưng trong lúc diện bích, bạn nghe được tiếng cười trẻ con từ nhân gian vọng lên.', "You are sentenced to five years facing the wall, and your cultivation slips back a stretch. But while facing the wall, you hear children's laughter rising up from the mortal world.");
              },
            },
            {
              label: tr('Đổ cho Long Vương', "Blame the Dragon King"),
              hint: tr('thoát tội, nghiêng tà', "escape punishment, leans Evil"),
              lean: 'ta',
              run: (ch) => {
                setArc(ch, 'mieu', 9);
                dao(ch, -10);
                stat(ch, 'tamMa', 6);
                return tr('Long Vương bị giáng chức. Lão không biết vì sao. Bạn biết.', "The Dragon King is demoted. He has no idea why. You do.");
              },
            },
          ]
        : [
            {
              label: tr('Hạ phàm quét miếu cùng bà cụ', "Descend and sweep the shrine with the old woman"),
              hint: tr('tâm ma giảm, ngộ tính', "heart demon down, Insight"),
              lean: 'chinh',
              run: (ch) => {
                setArc(ch, 'mieu', 9);
                stat(ch, 'tamMa', -12);
                stat(ch, 'ngoTinh', 5);
                return tr('Bà cụ không biết bạn là ai, chỉ chia cho bạn nửa củ khoai. Bạn ăn chậm, như thể đó là tiên đào.', "The old woman doesn't know who you are, and simply shares half a sweet potato with you. You eat it slowly, as if it were an immortal peach.");
              },
            },
            {
              label: tr('Ban cho bà cụ trường thọ', "Grant the old woman longevity"),
              hint: tr('khí vận', "Luck"),
              lean: 'chinh',
              run: (ch) => {
                setArc(ch, 'mieu', 9);
                stat(ch, 'khiVan', 10);
                dao(ch, 6);
                return tr('Bà cụ sống tới một trăm hai mươi tuổi, quét miếu tới ngày cuối. Hương trong miếu không bao giờ tắt.', "The old woman lives to a hundred and twenty, sweeping the shrine until her last day. The incense in the shrine never goes out.");
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
    title: tr('Huyết Nguyệt', "Blood Moon"),
    text: () => tr('Trăng máu mọc. Ma khí dâng gấp mười, ma thú phát cuồng, ma tu khắp nơi ngồi xuống hút lấy hút để. Đêm nay, kẻ nào tham sẽ mạnh, kẻ nào tham quá sẽ điên.', "The blood moon rises. Demonic qi swells tenfold, demon beasts go berserk, and demonic cultivators everywhere sit down to drink it in greedily. Tonight, the greedy grow strong, and the too greedy go mad."),
    choices: () => [
      {
        label: tr('Hút cạn cả đêm', "Drain it all night"),
        hint: tr('tu vi lớn, tâm ma lớn', "big cultivation, big heart demon"),
        lean: 'ta',
        run: (c) => {
          addCult(c, reward(c, 1.4));
          stat(c, 'tamMa', 10);
          return tr('Huyết khí tràn vào kinh mạch như lũ. Sáng ra bạn mạnh hơn hẳn, nhưng trong đầu có thêm một giọng nói.', "Blood qi floods your meridians. By morning you are far stronger, but there is one more voice in your head.");
        },
      },
      {
        label: tr('Luyện ma khí thành đan', "Refine the demonic qi into pills"),
        hint: tr('đan, linh thạch', "pills, spirit stones"),
        lean: 'trung',
        run: (c) => {
          addPill(c, 'huyet_sat', 2);
          money(c, 150 * tier(c));
          return tr('Bạn gom ma khí vào lò, ra được mấy viên Huyết Sát Đan và ít cặn đem bán.', "You gather the demonic qi into a furnace and get a few Blood Fiend Pills plus some dregs to sell.");
        },
      },
      {
        label: tr('Đóng cửa tĩnh tọa', "Shut the door and sit in meditation"),
        hint: tr('tâm ma giảm', "heart demon down"),
        lean: 'chinh',
        run: (c) => {
          stat(c, 'tamMa', -10);
          stat(c, 'tamCanh', 5);
          return tr('Bên ngoài gào thét cả đêm. Bên trong, bạn nghe rõ nhịp tim của mình.', "Outside, the howling lasts all night. Inside, you hear your own heartbeat clearly.");
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
    title: tr('Ma Đế bệnh nặng', "The Demon Emperor falls ill"),
    text: () =>
      tr('Tin đồn lan khắp Ma giới: Ma Đế bế quan trăm năm chưa ra, Vạn Ma Điện đóng cửa. Đại hoàng tử Huyết Ly gom binh, Tam công chúa Ảnh Nguyệt gom người. Cả hai đều gửi thư cho bạn.', "Rumors spread across the Demon Realm: the Demon Emperor entered seclusion a hundred years ago and has not come out, and Wanmo Hall's doors are shut. Eldest Prince Xueli is gathering troops, Third Princess Yingyue is gathering people. Both have sent you letters."),
    choices: () => [
      {
        label: tr('Theo Đại hoàng tử Huyết Ly', "Follow Eldest Prince Xueli"),
        hint: tr('binh mạnh, trận thẳng', "strong troops, frontal assault"),
        lean: 'ta',
        run: (c) => {
          setArc(c, 'ma_de', 1);
          money(c, 200 * tier(c));
          return tr('Huyết Ly cười lớn, trao cho bạn một lá cờ huyết kỳ: "Ngày ta lên ngôi, ngươi đứng bên phải ta."', "Xueli laughs heartily and hands you a blood banner: \"The day I take the throne, you stand at my right hand.\"");
        },
      },
      {
        label: tr('Theo Tam công chúa Ảnh Nguyệt', "Follow Third Princess Yingyue"),
        hint: tr('mưu kế, đánh lén', "schemes, ambush"),
        lean: 'trung',
        run: (c) => {
          setArc(c, 'ma_de', 2);
          stat(c, 'ngoTinh', 5);
          return tr('Ảnh Nguyệt không nói gì, chỉ đưa bạn một tấm bản đồ đường hầm dưới Vạn Ma Điện.', "Yingyue says nothing, only hands you a map of the tunnels beneath Wanmo Hall.");
        },
      },
      {
        label: tr('Đứng ngoài', "Stay out of it"),
        hint: tr('an toàn bây giờ', "safe for now"),
        lean: 'chinh',
        run: (c) => {
          setArc(c, 'ma_de', 3);
          stat(c, 'tamCanh', 4);
          return tr('Bạn đốt cả hai lá thư. Ở Ma giới, đứng ngoài cũng là một lựa chọn. Chỉ là không ai nhớ ơn kẻ đứng ngoài.', "You burn both letters. In the Demon Realm, staying out is a choice too. It's just that no one remembers a debt to those who stayed out.");
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
    title: tr('Chính biến Vạn Ma Điện', "Coup at Wanmo Hall"),
    text: (c) =>
      arc(c, 'ma_de') === 3
        ? tr('Đêm chính biến. Cả hai phe đánh nhau dưới chân Vạn Ma Điện. Một toán quân thua chạy ngang nhà bạn, xin chỗ trốn.', "The night of the coup. Both factions clash at the foot of Wanmo Hall. A band of defeated soldiers flees past your house, begging for a place to hide.")
        : tr(`Đêm chính biến. ${arc(c, 'ma_de') === 1 ? tr('Huyết Ly dẫn quân đánh thẳng cửa chính, bạn đi đầu.', "Xueli leads his troops straight at the main gate, with you at the vanguard.") : tr('Ảnh Nguyệt dẫn bạn chui đường hầm, tới thẳng tẩm cung Ma Đế.', "Yingyue leads you through the tunnels, straight to the Demon Emperor's bedchamber.")}`, `The night of the coup. ${arc(c, 'ma_de') === 1 ? tr('Huyết Ly dẫn quân đánh thẳng cửa chính, bạn đi đầu.', "Xueli leads his troops straight at the main gate, with you at the vanguard.") : tr('Ảnh Nguyệt dẫn bạn chui đường hầm, tới thẳng tẩm cung Ma Đế.', "Yingyue leads you through the tunnels, straight to the Demon Emperor's bedchamber.")}`),
    choices: (c) =>
      arc(c, 'ma_de') === 3
        ? [
            {
              label: tr('Cho trốn', "Hide them"),
              hint: tr('ân tình, có thể bị liên lụy', "a debt of gratitude, may drag you in"),
              lean: 'chinh',
              run: (ch, ctx) => {
                setArc(ch, 'ma_de', 6);
                dao(ch, 6);
                if (ctx.rnd() < 0.3) return tr('Truy binh lục nhà bạn. Bạn phải đánh một trận mới giữ được người.', "The pursuers search your house. You have to fight to protect them.") + hurt(ch, 25, ctx);
                return tr('Bạn giấu họ dưới hầm rượu. Truy binh đi qua không ngó lại.', "You hide them in the wine cellar. The pursuers walk past without a second glance.");
              },
            },
            {
              label: tr('Đóng cửa', "Shut the door"),
              lean: 'ta',
              run: (ch) => {
                setArc(ch, 'ma_de', 7);
                return tr('Bạn nghe tiếng gõ cửa tắt dần, rồi tiếng đao. Sáng ra trước cửa sạch sẽ, như chưa có gì.', "You hear the knocking fade, then the sound of blades. In the morning the doorstep is spotless, as if nothing had happened.");
              },
            },
          ]
        : [
            {
              label: tr('Xông lên', "Charge"),
              hint: tr('thắng: công thần, thua: trọng thương hoặc chết', "win: hero of the realm, lose: grave injury or death"),
              lean: 'ta',
              run: (ch, ctx) => {
                const side = arc(ch, 'ma_de');
                if (fight(ch, ctx, side === 1 ? 0.5 : 0.55)) {
                  setArc(ch, 'ma_de', side === 1 ? 4 : 5);
                  addCult(ch, reward(ch, 1.2));
                  ctx.fx('breakthrough', tr('Chính biến', "Coup"));
                  return side === 1
                    ? tr('Cửa chính vỡ. Huyết Ly bước qua xác vệ binh, lên ngồi ngai. Bạn đứng bên phải hắn, áo đẫm máu.', "The main gate shatters. Xueli steps over the guards' corpses and takes the throne. You stand at his right hand, robes soaked in blood.")
                    : tr('Tẩm cung trống rỗng, Ma Đế đã tọa hóa từ lâu. Ảnh Nguyệt đặt ấn lên trán mình. Bạn là người đầu tiên quỳ xuống.', "The bedchamber is empty; the Demon Emperor passed away long ago. Yingyue presses the seal to her own brow. You are the first to kneel.");
                }
                setArc(ch, 'ma_de', 8);
                const f = fatal(ch, ctx, 0.15, tr('Chính biến thất bại. Đầu bạn bị treo trên cổng Vạn Ma Điện ba ngày.', "The coup fails. Your head hangs on the gate of Wanmo Hall for three days."));
                if (ch.dead) return f ?? '';
                return tr('Phe bạn thua. Bạn chạy được, nhưng mang theo một vết thương không lành.', "Your side loses. You escape, but carry away a wound that never heals.") + hurt(ch, 45, ctx);
              },
            },
            {
              label: tr('Quay giáo giữa trận', "Turn your spear mid-battle"),
              hint: tr('phản chủ, có thể được phe kia trọng dụng', "betray your lord, the other side may reward you"),
              lean: 'ta',
              run: (ch, ctx) => {
                dao(ch, -12);
                if (ctx.rnd() < 0.5) {
                  setArc(ch, 'ma_de', arc(ch, 'ma_de') === 1 ? 5 : 4);
                  money(ch, 600 * tier(ch));
                  return tr('Bạn đâm sau lưng chủ cũ. Phe kia thắng, nhớ công bạn. Ma giới quý kẻ biết thời thế.', "You stab your old master in the back. The other side wins and remembers your service. The Demon Realm values those who read the times.");
                }
                setArc(ch, 'ma_de', 8);
                return tr('Phe kia nhận bạn rồi cũng không tin bạn. Bạn bị tước binh, đuổi về.', "The other side takes you in but never trusts you. You are stripped of your troops and sent home.") + hurt(ch, 20, ctx);
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
    title: tr('Tân Ma Đế', "The new Demon Emperor"),
    text: (c) => {
      const v = arc(c, 'ma_de');
      if (v === 4 || v === 5) return tr(`${v === 4 ? tr('Tân Ma Đế Huyết Ly', "The new Demon Emperor Xueli") : tr('Tân Ma Đế Ảnh Nguyệt', "The new Demon Emperor Yingyue")} mở tiệc phong thưởng. Tên bạn được đọc đầu tiên.`, `${v === 4 ? tr('Tân Ma Đế Huyết Ly', "The new Demon Emperor Xueli") : tr('Tân Ma Đế Ảnh Nguyệt', "The new Demon Emperor Yingyue")} holds a feast to hand out rewards. Your name is read first.`);
      if (v === 6) return tr('Một người lạ tìm tới, quỳ trước cửa: "Năm đó ngài cho chúng tôi trốn. Giờ chủ tôi đã lên ngôi."', "A stranger comes and kneels at your door: \"That year you let us hide. Now my lord sits on the throne.\"");
      if (v === 7) return tr('Tân Ma Đế cho người đi khắp nơi tìm những kẻ năm đó đóng cửa. Không phải để phạt. Để nhớ mặt.', "The new Demon Emperor sends people everywhere to find those who shut their doors that night. Not to punish them. To remember their faces.");
      return tr('Tân Ma Đế lên ngôi. Danh sách thanh trừng có tên bạn.', "The new Demon Emperor takes the throne. Your name is on the purge list.");
    },
    choices: (c) => {
      const v = arc(c, 'ma_de');
      if (v === 4 || v === 5 || v === 6)
        return [
          {
            label: tr('Nhận phong thưởng', "Accept the reward"),
            hint: tr('linh thạch lớn, tu vi', "lots of spirit stones, cultivation"),
            lean: 'trung',
            run: (ch, ctx) => {
              setArc(ch, 'ma_de', 9);
              money(ch, (v === 6 ? 700 : 1200) * tier(ch));
              addCult(ch, reward(ch, 1));
              ch.maTitle = v === 6 ? tr('Ân Nhân Vạn Ma', "Benefactor of Ten Thousand Demons") : tr('Khai Quốc Ma Hầu', "Founding Demon Marquis");
              ctx.fx('coin', ch.maTitle);
              return tr(`Bạn được phong làm ${ch.maTitle}. Từ nay đi đâu ở Ma giới cũng có người cúi đầu.`, `You are named ${ch.maTitle}. From now on, wherever you go in the Demon Realm, people bow their heads.`);
            },
          },
          {
            label: tr('Chối từ, xin về ẩn cư', "Decline and ask to retire into seclusion"),
            hint: tr('tâm cảnh, khí vận', "Mind, Luck"),
            lean: 'chinh',
            run: (ch) => {
              setArc(ch, 'ma_de', 9);
              stat(ch, 'tamCanh', 10);
              stat(ch, 'khiVan', 8);
              return tr('Bạn xin về. Tân Ma Đế nhìn bạn rất lâu, rồi cho phép. Người biết lúc nào nên rời triều đình thường sống lâu nhất.', "You ask to leave. The new Demon Emperor looks at you for a long time, then grants it. Those who know when to leave court usually live the longest.");
            },
          },
        ];
      return [
        {
          label: tr('Chạy trốn ra rìa Ma giới', "Flee to the edge of the Demon Realm"),
          hint: tr('mất linh thạch, sống', "lose spirit stones, survive"),
          lean: 'trung',
          run: (ch) => {
            setArc(ch, 'ma_de', 9);
            money(ch, -Math.min(ch.linhThach, 500 * tier(ch)));
            ch.maLand = 0;
            return tr('Bạn bỏ cả địa bàn lẫn gia sản, chạy ra rìa Ma giới. Nghèo, nhưng còn thở.', "You abandon both territory and fortune and flee to the edge of the Demon Realm. Poor, but still breathing.");
          },
        },
        {
          label: tr('Ở lại, chờ chúng tới', "Stay and wait for them"),
          hint: tr('đánh một trận', "a fight"),
          lean: 'ta',
          run: (ch, ctx) => {
            setArc(ch, 'ma_de', 9);
            if (fight(ch, ctx, 0.5)) {
              stat(ch, 'khiVan', 10);
              addCult(ch, reward(ch, 0.8));
              return tr('Ba toán sát thủ tới, ba toán không về. Tân Ma Đế xóa tên bạn khỏi danh sách, coi như chưa từng viết.', "Three squads of assassins come; none return. The new Demon Emperor strikes your name from the list as if it had never been written.");
            }
            const f = fatal(ch, ctx, 0.2, tr('Toán sát thủ thứ tư tới lúc bạn đang băng bó. Không còn toán thứ năm cần tới.', "The fourth squad of assassins arrives while you are bandaging your wounds. There is no need for a fifth."));
            if (ch.dead) return f ?? '';
            return tr('Bạn sống sót, nhưng nằm liệt nhiều năm.', "You survive, but are bedridden for many years.") + hurt(ch, 50, ctx);
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
    title: tr('Cửu U Thâm Uyên', "The Nine Netherworld Abyss"),
    text: (c) => {
      const n = arc(c, 'cuu_u');
      return n === 0
        ? tr('Dưới đáy Ma giới có một vực sâu chín tầng, gọi là Cửu U. Nghe nói ai xuống tới tầng cuối thì gặp Cửu U Ma Long đang ngủ, dưới bụng nó là kho báu của chín đời Ma Đế.', "At the bottom of the Demon Realm lies a nine-layered abyss called the Nine Netherworld. It is said that whoever reaches the last layer will find the Nine Netherworld Demon Dragon asleep, and beneath its belly the treasure of nine generations of Demon Emperors.")
        : n === 8
          ? tr('Tầng chín. Không còn đường xuống nữa. Trong bóng tối có tiếng thở, mỗi hơi thở làm vực rung một lần. Cửu U Ma Long mở một mắt.', "The ninth layer. There is no further way down. In the darkness something breathes, and each breath shakes the abyss. The Nine Netherworld Demon Dragon opens one eye.")
          : tr(`Bạn đã xuống tới tầng ${n} của Cửu U. Tầng ${n + 1} tối hơn, lạnh hơn, và có tiếng gì đó đang cào vào vách đá.`, `You have descended to layer ${n} of the Nine Netherworld. Layer ${n + 1} is darker, colder, and something is scratching at the rock walls.`);
    },
    choices: (c) => {
      const n = arc(c, 'cuu_u');
      if (n === 8)
        return [
          {
            label: tr('Đánh Cửu U Ma Long', "Fight the Nine Netherworld Demon Dragon"),
            hint: tr('trận cuối, kho báu chín đời Ma Đế', "final battle, treasure of nine Demon Emperors"),
            lean: 'ta',
            run: (ch, ctx) => {
              if (fight(ch, ctx, 0.4)) {
                setArc(ch, 'cuu_u', 9);
                money(ch, 5000);
                addCult(ch, reward(ch, 2.5));
                stat(ch, 'khiVan', 15);
                ctx.fx('breakthrough', tr('Cửu U', "Nine Netherworld"));
                return tr('Ma Long gục xuống, cả vực sụp theo. Bạn leo lên với một túi đầy bảo vật của chín đời Ma Đế. Từ nay Ma giới gọi bạn là kẻ đi qua Cửu U.', "The Demon Dragon collapses, and the whole abyss caves in after it. You climb out with a bag stuffed with the treasures of nine generations of Demon Emperors. From now on the Demon Realm calls you the one who walked through the Nine Netherworld.");
              }
              setArc(ch, 'cuu_u', 5);
              const f = fatal(ch, ctx, 0.25, tr('Cửu U Ma Long nuốt bạn vào bụng. Bạn trở thành một phần của kho báu.', "The Nine Netherworld Demon Dragon swallows you whole. You become part of the treasure."));
              if (ch.dead) return f ?? '';
              return tr('Ma Long phun một hơi, bạn bị thổi ngược lên tầng năm.', "The Demon Dragon exhales once and you are blown back up to layer five.") + hurt(ch, 55, ctx);
            },
          },
          {
            label: tr('Lặng lẽ lui', "Quietly retreat"),
            lean: 'trung',
            run: (ch) => {
              setArc(ch, 'cuu_u', 7);
              stat(ch, 'tamCanh', 4);
              return tr('Bạn lùi từng bước. Con mắt kia khép lại. Lần sau vậy.', "You back away step by step. The eye closes again. Next time, then.");
            },
          },
        ];
      return [
        {
          label: tr(`Xuống tầng ${n + 1}`, `Descend to layer ${n + 1}`),
          hint: tr('càng sâu càng nhiều của, càng dễ chết', "the deeper, the richer, the deadlier"),
          lean: 'ta',
          run: (ch, ctx) => {
            setArc(ch, 'cuu_u', n + 1);
            const g = 150 * (n + 1) * tier(ch);
            money(ch, g);
            addCult(ch, reward(ch, 0.3 + n * 0.12));
            if (ctx.rnd() < 0.06 + n * 0.05) {
              const f = fatal(ch, ctx, 0.04 + n * 0.015, tr(`Bóng tối ở tầng ${n + 1} Cửu U nuốt mất bạn. Không ai biết bạn đã gặp gì.`, `The darkness of layer ${n + 1} of the Nine Netherworld swallows you. No one knows what you met.`));
              if (ch.dead) return f ?? '';
              return tr(`Ở tầng ${n + 1}, một thứ không có hình dạng quấn lấy bạn. Bạn giãy thoát, mang theo ${g} linh thạch và một vết cào sâu tới xương.`, `On layer ${n + 1}, something with no shape coils around you. You struggle free with ${g} spirit stones and a scratch cut to the bone.`) + hurt(ch, 20 + n * 5, ctx);
            }
            return tr(`Tầng ${n + 1}: xác ma tu đời trước nằm la liệt, túi đồ còn nguyên. Bạn nhặt được ${g} linh thạch.`, `Layer ${n + 1}: the corpses of demonic cultivators from ages past lie everywhere, their bags still intact. You pick up ${g} spirit stones.`);
          },
        },
        {
          label: tr('Leo lên, để lần sau', "Climb up, save it for next time"),
          lean: 'trung',
          run: () => tr('Bạn leo lên. Cửu U vẫn ở đó, chờ.', "You climb back up. The Nine Netherworld is still there, waiting."),
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
    title: tr('Kẻ giữ đồng hồ cát', "The keeper of the hourglass"),
    text: () => tr('Giữa hư không có một người ngồi lật đồng hồ cát. Mỗi hạt cát là một năm của ai đó. Lão ngẩng lên: "Muốn đổi không? Năm lấy đạo, hay đạo lấy năm."', "In the middle of the void someone sits turning an hourglass. Each grain of sand is a year of someone's life. The old man looks up: \"Care to trade? Years for Dao, or Dao for years.\""),
    choices: () => [
      {
        label: tr('Đổi 40 năm thọ lấy tu vi', "Trade 40 years of lifespan for cultivation"),
        hint: tr('tu vi rất lớn, mất thọ', "huge cultivation, lose lifespan"),
        lean: 'ta',
        run: (c, ctx) => {
          c.lifespan = Math.max(Math.floor(c.age) + 5, c.lifespan - 40);
          addCult(c, reward(c, 2.5));
          ctx.fx('breakthrough', tr('Đồng hồ cát', "Hourglass"));
          return tr('Bốn mươi hạt cát rơi khỏi tay bạn. Tu vi tràn đầy, tóc bạc thêm một nửa.', "Forty grains of sand slip from your hand. Your cultivation brims over, and half your hair turns white.");
        },
      },
      {
        label: tr('Đổi tu vi lấy 40 năm thọ', "Trade cultivation for 40 years of lifespan"),
        hint: tr('mất một phần tu vi, thêm thọ', "lose some cultivation, gain lifespan"),
        lean: 'trung',
        run: (c) => {
          c.cultivation = Math.round(c.cultivation * 0.6);
          addLife(c, 40);
          return tr('Lão lật ngược đồng hồ. Cát chảy lên. Bạn trẻ lại, tu vi lùi một đoạn.', "The old man turns the hourglass over. The sand flows upward. You grow younger, and your cultivation slips back a stretch.");
        },
      },
      {
        label: tr('Hỏi lão đồng hồ của lão còn bao nhiêu', "Ask how much is left in his own hourglass"),
        hint: tr('ngộ tính, tâm cảnh', "Insight, Mind"),
        lean: 'chinh',
        run: (c) => {
          stat(c, 'ngoTinh', 6);
          stat(c, 'tamCanh', 6);
          return tr('Lão nhìn bạn, rồi cười: "Ta không có đồng hồ. Vì thế ta ngồi đây." Bạn ngồi cạnh lão rất lâu.', "He looks at you, then smiles: \"I have no hourglass. That is why I sit here.\" You sit beside him for a long time.");
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
    title: tr('Bóng kiếp trước', "Shadow of a past life"),
    text: (c) =>
      tr(`Ở Thái Hư, có lúc bóng của các kiếp cũ trôi ngang. Hôm nay bạn gặp ${c.past!.name}, ${c.past!.realmName}, chính mình kiếp trước. ${c.past!.cause ? tr(`Trên người bóng ấy vẫn còn dấu vết của lúc chết: ${c.past!.cause.replace(/\.$/, '').toLowerCase()}.`, `The shadow still bears the marks of its death: ${c.past!.cause.replace(/\.$/, '').toLowerCase()}.`) : ''}`, `In the Great Void, shadows of old lives sometimes drift by. Today you meet ${c.past!.name}, ${c.past!.realmName}, yourself from a past life. ${c.past!.cause ? tr(`Trên người bóng ấy vẫn còn dấu vết của lúc chết: ${c.past!.cause.replace(/\.$/, '').toLowerCase()}.`, `The shadow still bears the marks of its death: ${c.past!.cause.replace(/\.$/, '').toLowerCase()}.`) : ''}`),
    choices: (c) => [
      {
        label: tr('Hỏi bóng ấy còn tiếc điều gì', "Ask the shadow what it still regrets"),
        hint: tr('tâm cảnh, ngộ tính', "Mind, Insight"),
        lean: 'chinh',
        run: (ch) => {
          stat(ch, 'tamCanh', 10);
          stat(ch, 'ngoTinh', 6);
          return c.past?.partner
            ? tr(`Bóng ấy chỉ nói một cái tên: ${c.past.partner}. Rồi tan ra. Bạn nhớ cái tên đó suốt kiếp này.`, `The shadow says only one name: ${c.past.partner}. Then it dissolves. You remember that name for the rest of this life.`)
            : tr('Bóng ấy lắc đầu: "Không tiếc. Chỉ muốn biết kiếp sau mình đi được bao xa." Bạn đứng thẳng lưng cho nó nhìn.', "The shadow shakes its head: \"No regrets. I just want to know how far I'll get next life.\" You stand up straight to let it look.");
        },
      },
      {
        label: tr('Hấp thu bóng ấy', "Absorb the shadow"),
        hint: tr('tu vi lớn, tâm ma', "big cultivation, heart demon"),
        lean: 'ta',
        run: (ch) => {
          addCult(ch, reward(ch, 1.6));
          stat(ch, 'tamMa', 8);
          return tr('Bóng kiếp trước tan vào người bạn. Bạn mạnh hơn, và đêm nào cũng mơ thấy một cái chết không phải của mình. Hay là của mình.', "The shadow of your past life melts into you. You grow stronger, and every night you dream of a death that isn't yours. Or is.");
        },
      },
      {
        label: tr('Tiễn nó vào luân hồi', "Send it on into reincarnation"),
        hint: tr('khí vận', "Luck"),
        lean: 'chinh',
        run: (ch) => {
          stat(ch, 'khiVan', 12);
          dao(ch, 5);
          return tr('Bạn chỉ đường cho bóng ấy về phía cầu Nại Hà. Nó cúi đầu chào chính mình, rồi đi.', "You point the shadow toward Naihe Bridge. It bows to itself, then goes.");
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
    title: tr('Hư không rách', "The void tears"),
    text: () => tr('Hư không nứt một đường dài vạn dặm. Từ khe nứt rỉ ra linh khí của cõi khác, đặc như sương. Đứng gần thì tu nhanh gấp mười. Nhưng khe nứt mỗi ngày một rộng.', "The void splits along a crack ten thousand miles long. Spiritual qi from another world seeps out of it, thick as fog. Standing near it, you cultivate ten times faster. But the rift grows wider every day."),
    choices: () => [
      {
        label: tr('Lấy tu vi vá lại', "Mend it with your cultivation"),
        hint: tr('mất tu vi, khí vận và tâm cảnh lớn', "lose cultivation, big Luck and Mind"),
        lean: 'chinh',
        run: (c) => {
          setArc(c, 'va_troi', 1);
          c.cultivation = Math.round(c.cultivation * 0.65);
          stat(c, 'khiVan', 10);
          stat(c, 'tamCanh', 8);
          return tr('Bạn ngồi bên khe nứt chín năm, rút từng sợi linh lực của mình khâu lại. Khe khép. Bạn yếu đi, nhưng nhẹ người.', "You sit by the rift for nine years, drawing out your own spiritual power thread by thread to stitch it shut. The rift closes. You are weaker, but lighter of heart.");
        },
      },
      {
        label: tr('Ngồi bên khe hút linh khí', "Sit by the rift and absorb the qi"),
        hint: tr('tu vi lớn ngay, hậu quả về sau', "big cultivation now, consequences later"),
        lean: 'ta',
        run: (c) => {
          setArc(c, 'va_troi', 2);
          addCult(c, reward(c, 1.8));
          return tr('Bạn ngồi hút tới no. Khe nứt rộng thêm một chút. Một chút thôi.', "You sit and absorb until you're full. The rift widens a little. Only a little.");
        },
      },
      {
        label: tr('Gọi cả tiên lẫn ma tới cùng vá', "Call both immortals and demons to mend it together"),
        hint: tr('ngộ tính, chuyện còn dài', "Insight, the story goes on"),
        lean: 'trung',
        run: (c) => {
          setArc(c, 'va_troi', 3);
          stat(c, 'ngoTinh', 6);
          return tr('Bạn gửi thư lên Thiên Đình và xuống Vạn Ma Điện. Hai bên đọc xong, cùng cười khẩy. Rồi cùng gửi người tới.', "You send letters up to the Heavenly Court and down to Wanmo Hall. Both sides read them and sneer. Then both send people.");
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
    title: tr('Khe nứt năm ấy', "The rift of years past"),
    text: (c) => {
      const v = arc(c, 'va_troi');
      if (v === 1) return tr('Chỗ bạn vá năm xưa mọc lên một dải tinh vân. Lão tán tiên câu cá ở Bờ Thái Hư bay tới, chống cần nhìn: "Mũi khâu đẹp đấy."', "Where you mended the void long ago, a band of nebula has grown. An old loose immortal who fishes at the Shore of the Great Void flies over, leans on his rod and looks: \"Nice stitching.\"");
      if (v === 2) return tr('Khe nứt năm xưa giờ đã nuốt trọn một tinh vực. Cả Thái Hư biết ai đã ngồi hút ở đó.', "The rift of years past has now swallowed a whole star region. All of the Great Void knows who sat there absorbing.");
      return tr('Tiên binh và ma binh vá xong khe nứt, rồi ngồi lại uống với nhau một chén. Lần đầu tiên sau vạn năm.', "Immortal and demon soldiers finish mending the rift, then sit down to share a cup together. The first time in ten thousand years.");
    },
    choices: (c) => {
      const v = arc(c, 'va_troi');
      if (v === 2)
        return [
          {
            label: tr('Lấy thân mình chặn khe', "Plug the rift with your own body"),
            hint: tr('mất nhiều tu vi và máu, sửa sai', "lose a lot of cultivation and HP, make amends"),
            lean: 'chinh',
            run: (ch, ctx) => {
              setArc(ch, 'va_troi', 9);
              ch.cultivation = Math.round(ch.cultivation * 0.5);
              dao(ch, 10);
              stat(ch, 'tamCanh', 10);
              return tr('Bạn đứng vào giữa khe nứt, lấy cả tiên thể làm miếng vá. Khe khép lại. Bạn thì gần như vỡ.', "You step into the middle of the rift and use your whole immortal body as the patch. The rift closes. You very nearly shatter.") + hurt(ch, 45, ctx);
            },
          },
          {
            label: tr('Bỏ chạy sang tinh vực khác', "Flee to another star region"),
            hint: tr('giữ tu vi, mang tiếng', "keep cultivation, earn a bad name"),
            lean: 'ta',
            run: (ch) => {
              setArc(ch, 'va_troi', 9);
              dao(ch, -10);
              stat(ch, 'tamMa', 10);
              stat(ch, 'khiVan', -8);
              return tr('Bạn đi thật xa. Nhưng ở Thái Hư, đi xa đến mấy cũng còn thấy khe nứt ấy trên trời.', "You go very far. But in the Great Void, no matter how far you go, you can still see that rift in the sky.");
            },
          },
        ];
      return [
        {
          label: v === 1 ? tr('Xin lão dạy câu cá', "Ask the old man to teach you fishing") : tr('Nâng chén cùng hai bên', "Raise a cup with both sides"),
          hint: tr('tâm ma giảm, tu vi', "heart demon down, cultivation"),
          lean: 'trung',
          run: (ch) => {
            setArc(ch, 'va_troi', 9);
            stat(ch, 'tamMa', -12);
            addCult(ch, reward(ch, 1.2));
            return v === 1
              ? tr('Lão dạy bạn câu bằng lưỡi câu thẳng. Cả trăm năm không được con cá nào, nhưng tu vi bạn lặng lẽ dày thêm.', "The old man teaches you to fish with a straight hook. In a hundred years you catch not a single fish, but your cultivation quietly grows deeper.")
              : tr('Hai bên uống hết một chum rượu thì về. Mai lại đánh nhau. Nhưng tối nay thì không.', "The two sides finish a whole jar of wine and go home. Tomorrow they'll fight again. But not tonight.");
          },
        },
        {
          label: tr('Ghi lại chuyện này lên vách Thái Hư', "Record this tale on the walls of the Great Void"),
          hint: tr('khí vận, ngộ tính', "Luck, Insight"),
          lean: 'chinh',
          run: (ch) => {
            setArc(ch, 'va_troi', 9);
            stat(ch, 'khiVan', 10);
            stat(ch, 'ngoTinh', 6);
            return tr('Bạn khắc chuyện vá trời lên vách đá trôi. Vạn năm sau sẽ có người đọc.', "You carve the story of mending the sky onto a drifting stone wall. Ten thousand years from now, someone will read it.");
          },
        },
      ];
    },
  },
  // ================= Ngày 35, đêm 20/11/2026 =================
  // ct_20261120_3 Giao kèo với quạ ba mắt (Ma giới, 3 bước, một nhánh chết ở bước 3: chỉ khi bội ước, đánh vào tổ quạ đã được báo trước).
  {
    id: 'ct_20261120_3',
    cosmos: 'ma',
    once: true,
    weight: 30,
    when: (c) => !ctArc(c, 'ct20261120_3'),
    title: tr('Con quạ ba mắt', 'The three-eyed crow'),
    text: () =>
      tr(
        'Một con quạ ba mắt đậu xuống vai bạn, con mắt giữa trán nhắm nghiền. Nó nói tiếng người: "Cho ta mượn ba mươi năm thọ, ta cho ngươi mượn con mắt thứ ba. Ma giới giấu gì, ngươi thấy nấy." Nó còn nói thêm: hết hạn mà không trả thì nó tự đến lấy.',
        'A three-eyed crow lands on your shoulder, the eye in its forehead shut tight. It speaks like a person: "Lend me thirty years of life and I will lend you my third eye. Whatever the Demon Realm hides, you will see." It adds that if the debt is not paid when due, it will come to collect.',
      ),
    choices: () => [
      {
        label: tr('Giao kèo: đổi ba mươi năm thọ lấy con mắt', 'Make the deal: thirty years of life for the eye'),
        hint: tr('-30 năm thọ, bắt đầu một chuyện dài', '-30 years of lifespan, the start of a long story'),
        lean: 'trung',
        run: (c) => {
          const n = cutLife(c, 30);
          ctSet(c, 'ct20261120_3', 1, 'giao');
          return tr(`Con mắt giữa trán quạ mở ra, và trán bạn nhói lên (-${n} năm thọ). Từ đêm đó bạn thấy những sợi khí đen nối kẻ này với kẻ khác.`, `The eye in the crow's forehead opens, and your own brow throbs (-${n} years of lifespan). From that night on you see threads of black qi tying one being to another.`);
        },
      },
      {
        label: tr('Hỏi nó cần thọ của người khác làm gì', 'Ask what it needs other people\'s years for'),
        hint: tr('ngộ tính +', 'Insight +'),
        lean: 'trung',
        run: (c) => {
          stat(c, 'ngoTinh', 4);
          ctSet(c, 'ct20261120_3', 9);
          return tr('Nó nghiêng đầu: "Chủ ta mù đã ba nghìn năm, sắp đi rồi." Rồi nó bay đi tìm người khác, không chờ bạn trả lời.', 'It tilts its head: "My master has been blind for three thousand years and is nearly gone." Then it flies off to find someone else without waiting for your answer.');
        },
      },
      {
        label: tr('Phẩy tay đuổi nó đi', 'Wave it away'),
        lean: 'trung',
        run: (c) => {
          stat(c, 'tamMa', -3);
          ctSet(c, 'ct20261120_3', 9);
          return tr('Nó kêu một tiếng khàn rồi bay mất. Ở Ma giới, không biết gì đôi khi lại sống lâu hơn.', 'It gives one hoarse caw and is gone. In the Demon Realm, knowing nothing sometimes means living longer.');
        },
      },
      {
        label: tr('Chộp lấy nó luyện thành ma sủng', 'Grab it and refine it into a familiar'),
        hint: tr('nghiêng tà, có thể bị mổ', 'leans Evil, it may peck you'),
        lean: 'ta',
        run: (c, ctx) => {
          dao(c, -6);
          ctSet(c, 'ct20261120_3', 9);
          if (fight(c, ctx, 0.55)) {
            const g = Math.round(addCult(c, reward(c, 0.5)));
            return tr(`Bạn bóp nát nó trong tay, luyện lấy chút ma khí (+${g} tu vi). Con mắt thứ ba nhắm lại, không bao giờ mở cho bạn.`, `You crush it in your fist and draw out a little demonic qi (+${g} cultivation). The third eye shuts and never opens for you.`);
          }
          return tr('Nó mổ một nhát vào mu bàn tay bạn rồi vụt mất.', 'It pecks the back of your hand and darts away.') + hurt(c, 12, ctx);
        },
      },
    ],
  },
  {
    id: 'ct_20261120_3b',
    cosmos: 'ma',
    once: true,
    weight: 300,
    when: (c) => ctNext(c, 'ct20261120_3', 1, 4),
    title: tr('Con mắt thứ ba', 'The third eye'),
    text: () =>
      tr(
        'Bốn năm qua, con mắt mượn chưa nhìn sai lần nào. Hôm nay nó cho bạn thấy hai thứ cùng lúc: một mạch ma thạch nằm dưới đáy huyết hồ, và một toán Huyết Ma đang nằm phục bên đường một đoàn tán tu.',
        'For four years the borrowed eye has never been wrong. Today it shows you two things at once: a vein of demon stones under a blood lake, and a band of Blood Demons lying in ambush along a group of rogue cultivators\' road.',
      ),
    choices: (c) => [
      {
        label: tr('Lặn xuống huyết hồ đào ma thạch', 'Dive into the blood lake for the stones'),
        hint: tr('+linh thạch', '+spirit stones'),
        lean: 'trung',
        run: (ch, ctx) => {
          const m = 300 * tier(ch);
          money(ch, m);
          ctx.fx('coin', `+${m}`);
          ctSet(ch, 'ct20261120_3', 2, 'dao');
          return tr(`Bạn đào được ${m} linh thạch. Lúc lên bờ, đằng xa vọng lại tiếng đao kiếm, rồi tắt.`, `You dig out ${m} spirit stones. As you climb ashore, the sound of blades echoes in the distance, then stops.`);
        },
      },
      {
        label: tr('Chạy tới báo cho đoàn tán tu', 'Run to warn the rogue cultivators'),
        hint: tr('đạo tâm +, khí vận +', 'Dao Heart +, Luck +'),
        lean: 'chinh',
        run: (ch) => {
          dao(ch, 6);
          stat(ch, 'khiVan', 5);
          ctSet(ch, 'ct20261120_3', 2, 'cuu');
          return tr('Đoàn tán tu đổi đường kịp lúc. Người dẫn đầu khắc tên bạn lên chuôi đao: "Nợ một mạng."', 'The rogue cultivators change course in time. Their leader carves your name on his saber hilt: "Owe you a life."');
        },
      },
      {
        label: tr('Nhắm con mắt lại, không nhìn nữa', 'Close the eye and stop looking'),
        hint: tr('tâm cảnh +, tâm ma -', 'Mind +, Heart Demon -'),
        lean: 'trung',
        run: (ch) => {
          stat(ch, 'tamCanh', 6);
          stat(ch, 'tamMa', -6);
          ctSet(ch, 'ct20261120_3', 2, 'nham');
          return tr('Thấy hết mọi thứ cũng là một gánh nặng. Bạn ngồi thiền ba ngày, để Ma giới tự lo chuyện của nó.', 'Seeing everything is its own burden. You meditate for three days and let the Demon Realm handle its own affairs.');
        },
      },
      {
        label: tr('Bán tin phục kích cho Huyết Ma', 'Sell word of the ambush to the Blood Demons'),
        hint: tr('+linh thạch, nghiêng tà mạnh', '+spirit stones, strongly Evil'),
        lean: 'ta',
        run: (ch, ctx) => {
          const m = 200 * tier(ch);
          money(ch, m);
          dao(ch, -12);
          stat(ch, 'tamMa', 6);
          ctx.fx('coin', `+${m}`);
          ctSet(ch, 'ct20261120_3', 2, 'ban');
          return tr(`Toán Huyết Ma trả ${m} linh thạch để biết đoàn tán tu đi mấy người, mang gì. Đêm đó con mắt mượn chảy ra một giọt máu.`, `The Blood Demons pay ${m} spirit stones to learn how many travel and what they carry. That night the borrowed eye weeps a drop of blood.`);
        },
      },
    ],
  },
  {
    id: 'ct_20261120_3c',
    cosmos: 'ma',
    once: true,
    weight: 300,
    when: (c) => ctNext(c, 'ct20261120_3', 2, 6),
    title: tr('Quạ tới đòi nợ', 'The crow comes to collect'),
    text: () =>
      tr(
        'Mười năm kể từ giao kèo, trời Ma giới đen kịt vì cánh quạ. Con quạ ba mắt đậu trên đầu cả đàn, giọng lạnh tanh: "Tới hạn. Trả mắt, hoặc trả thêm ba mươi năm. Bội ước thì cả đàn này mổ cho tới khi hết thứ để mổ."',
        'Ten years after the deal, the Demon Realm sky is black with crow wings. The three-eyed crow sits atop the whole flock, its voice flat: "It is due. Return the eye, or pay thirty more years. Break the deal and this flock will peck until there is nothing left to peck."',
      ),
    choices: (c) => [
      {
        label: tr('Trả lại con mắt', 'Return the eye'),
        hint: tr('ngộ tính -, xong nợ', 'Insight -, debt cleared'),
        lean: 'chinh',
        run: (ch) => {
          stat(ch, 'ngoTinh', -3);
          dao(ch, 3);
          ctSet(ch, 'ct20261120_3', 3, 'tra');
          return tr('Trán bạn nguội đi. Con quạ gật đầu một cái rồi bay đi cùng đàn, để lại một sợi lông đen trên vai bạn.', 'Your brow cools. The crow nods once and flies off with the flock, leaving a single black feather on your shoulder.');
        },
      },
      {
        label: tr('Trả thêm ba mươi năm, giữ con mắt mãi', 'Pay thirty more years and keep the eye for good'),
        hint: tr('-30 năm thọ, ngộ tính ++, khí vận +', '-30 years of lifespan, Insight ++, Luck +'),
        lean: 'trung',
        run: (ch) => {
          const n = cutLife(ch, 30);
          stat(ch, 'ngoTinh', 8);
          stat(ch, 'khiVan', 5);
          ctSet(ch, 'ct20261120_3', 3, 'giu');
          return tr(`Con quạ nhận thọ (-${n} năm), rồi nói: "Chủ ta sống thêm được một mùa. Mắt ấy là của ngươi." Nó không đến nữa.`, `The crow takes the years (-${n}), then says: "My master lives one more season. The eye is yours." It never returns.`);
        },
      },
      {
        label: tr('Trả bằng ma thạch thay cho thọ', 'Pay in demon stones instead of years'),
        hint: c.linhThach < 400 * tier(c) ? tr(`cần ${400 * tier(c)} linh thạch`, `needs ${400 * tier(c)} spirit stones`) : tr(`-${400 * tier(c)} linh thạch`, `-${400 * tier(c)} spirit stones`),
        lean: 'trung',
        off: c.linhThach < 400 * tier(c),
        run: (ch) => {
          money(ch, -400 * tier(ch));
          ctSet(ch, 'ct20261120_3', 3, 'mua');
          return tr('Con quạ mổ từng viên, đếm đủ mới thôi. "Chủ ta không ăn được đá," nó nói, "nhưng ta sẽ đổi được thứ khác." Bạn giữ con mắt.', 'The crow pecks at each stone until the count is right. "My master can\'t eat stones," it says, "but I can trade them for something." You keep the eye.');
        },
      },
      {
        label: tr('Bội ước, đánh thẳng vào tổ quạ', 'Break the deal and attack the nest'),
        hint: tr('cả đàn quạ, có thể chết', 'the whole flock, you may die'),
        lean: 'ta',
        run: (ch, ctx) => {
          dao(ch, -8);
          ctSet(ch, 'ct20261120_3', 3, 'danh');
          if (fight(ch, ctx, 0.5)) {
            const g = Math.round(addCult(ch, reward(ch, 1.2)));
            ctx.fx('breakthrough', tr('Phá tổ quạ', 'Nest broken'));
            return tr(`Bạn đốt tổ, cánh quạ rơi như mưa tro. Con quạ ba mắt chết trong tay bạn, con mắt nó thành của bạn (+${g} tu vi).`, `You burn the nest and wings fall like ash. The three-eyed crow dies in your hand, and its eye is yours (+${g} cultivation).`);
          }
          const f = fatal(ch, ctx, 0.5, tr('Bạn bội ước với con quạ ba mắt. Cả đàn quạ phủ kín người bạn, khi chúng bay đi thì không còn gì để mổ nữa.', 'You broke your deal with the three-eyed crow. The flock covered you completely, and when they flew away there was nothing left to peck.'));
          if (ch.dead) return tr('Trời tối sầm vì cánh quạ...', 'The sky goes dark with wings...') + (f ?? '');
          return tr('Đàn quạ mổ nát vai bạn rồi bỏ đi, mang theo con mắt.', 'The flock tears your shoulders bloody and leaves, taking the eye with it.') + (f ?? '') + hurt(ch, 30, ctx);
        },
      },
    ],
  },

  // ct_20261120_6 Tiếng chuông giữa hai lưỡi kiếm (Tiên giới, 2 bước). Nối Thiên thư quyển II, mảnh XV "Lôi đài": chỉ hiện cho người đã mở mảnh ấy.
  {
    id: 'ct_20261120_6',
    cosmos: 'tien',
    once: true,
    weight: 30,
    when: (c) => hasLore(c, 'chien_thu') && !ctArc(c, 'ct20261120_6'),
    title: tr('Chuông giữa hai lưỡi kiếm', 'A bell between two blades'),
    text: () =>
      tr(
        'Trước Nam Thiên Môn, hai tiên tướng tỷ thí tranh chức thống lĩnh. Kiếm vừa chạm nhau, bạn nghe một tiếng chuông vang đúng giữa hai lưỡi thép, y như ở lôi đài năm nào. Quanh đó trăm tiên quan đứng xem, không ai giật mình.',
        'Before the Southern Heavenly Gate, two immortal generals duel for command. The moment their swords meet, you hear a bell ring right between the two blades, just as it once did in the Arena. A hundred immortal officials stand watching, and none of them flinches.',
      ),
    choices: (c) => [
      {
        label: tr('Chen vào giữa, tách hai lưỡi kiếm', 'Step between them and part the blades'),
        hint: tr('có thể bị thương', 'may get hurt'),
        lean: 'chinh',
        run: (ch, ctx) => {
          ctSet(ch, 'ct20261120_6', 1, 'tach');
          if (fight(ch, ctx, 0.6)) {
            stat(ch, 'khiVan', 5);
            return tr('Bạn kẹp hai lưỡi kiếm giữa hai ngón tay. Tiếng chuông tắt ngay. Hai tiên tướng nhìn bạn như nhìn một kẻ điên.', 'You pinch both blades between two fingers. The bell stops at once. Both generals stare at you as if you were mad.');
          }
          return tr('Một lưỡi kiếm trượt qua vai bạn. Tiếng chuông vẫn còn, nhỏ dần.', 'One blade slides across your shoulder. The bell keeps ringing, fainter and fainter.') + hurt(ch, 15, ctx);
        },
      },
      {
        label: tr('Đứng im, đếm xem chuông vang mấy lần', 'Stand still and count how many times it rings'),
        hint: tr('ngộ tính +', 'Insight +'),
        lean: 'trung',
        run: (ch) => {
          stat(ch, 'ngoTinh', 5);
          ctSet(ch, 'ct20261120_6', 1, 'dem');
          return tr('Bảy lần, mỗi lần đúng lúc hai lưỡi kiếm sắp chạm vào người. Trận kết thúc, người thua là kẻ đã run tay ở tiếng thứ bảy.', 'Seven times, each one just as a blade is about to land. When it ends, the loser is the one whose hand shook at the seventh toll.');
        },
      },
      {
        label: tr('Hỏi nhỏ hai người: có nghe thấy gì không', 'Quietly ask both: did you hear anything?'),
        lean: 'trung',
        run: (ch) => {
          stat(ch, 'tamCanh', 3);
          ctSet(ch, 'ct20261120_6', 1, 'hoi');
          return tr('Người thắng lắc đầu. Người thua không đáp, chỉ nhìn bạn rất lâu rồi cúi xuống nhặt kiếm.', 'The winner shakes his head. The loser does not answer, only looks at you a long time, then bends to pick up his sword.');
        },
      },
      {
        label: tr('Đặt cược vào người mạnh hơn', 'Bet on the stronger one'),
        hint: tr('+linh thạch, nghiêng tà', '+spirit stones, leans Evil'),
        lean: 'ta',
        run: (ch, ctx) => {
          const m = 150 * tier(ch);
          money(ch, m);
          dao(ch, -3);
          ctx.fx('coin', `+${m}`);
          ctSet(ch, 'ct20261120_6', 9);
          return tr(`Bạn thắng cược ${m} linh thạch. Tiếng chuông kia vẫn ngân trong tai suốt đêm.`, `You win ${m} spirit stones on the bet. That bell keeps ringing in your ears all night.`);
        },
      },
    ],
  },
  {
    id: 'ct_20261120_6b',
    cosmos: 'tien',
    once: true,
    weight: 300,
    when: (c) => ctNext(c, 'ct20261120_6', 1, 6),
    title: tr('Tiên tướng thua trận', 'The defeated general'),
    text: () =>
      tr(
        'Sáu năm sau, tiên tướng thua trận năm ấy, Mạc Thừa, tìm đến động phủ bạn. Hắn đặt xuống một viên tiên đan và một phong thư tiến cử: "Ta xin rút khỏi quân ngũ. Hôm ấy ta thua vì một tiếng chuông, tay ta run. Chỗ này nên để cho người không run."',
        'Six years later, the general who lost that day, Mac Thua, comes to your abode. He sets down an immortal pill and a letter of recommendation: "I am leaving the army. That day I lost to the sound of a bell; my hand shook. This place should go to someone whose hand does not."',
      ),
    choices: () => [
      {
        label: tr('Nói thật: ta cũng nghe tiếng chuông ấy', 'Tell the truth: you heard that bell too'),
        hint: tr('ngộ tính +, tâm cảnh +', 'Insight +, Mind +'),
        lean: 'chinh',
        run: (c) => {
          stat(c, 'ngoTinh', 5);
          stat(c, 'tamCanh', 5);
          ctSet(c, 'ct20261120_6', 2, 'that');
          return tr('Mạc Thừa ngồi phịch xuống, cười như vừa trút được gánh đá: "Vậy là ta không điên." Hai người uống tới sáng mà không ai nhắc tới chức thống lĩnh.', 'Mac Thua drops onto a seat and laughs like a man setting down a load of stone: "So I\'m not mad." You drink until dawn and neither of you mentions the command.');
        },
      },
      {
        label: tr('Trả lại cả đan lẫn thư, khuyên hắn ở lại', 'Return both pill and letter, urge him to stay'),
        hint: tr('nhường cơ duyên: đạo tâm +, khí vận +', 'give up the chance: Dao Heart +, Luck +'),
        lean: 'chinh',
        run: (c) => {
          dao(c, 6);
          stat(c, 'khiVan', 6);
          ctSet(c, 'ct20261120_6', 2, 'nhuong');
          return tr('Hắn ở lại. Lần tỷ thí sau hắn thắng, và trước khi rút kiếm hắn nhìn về phía bạn, như để chắc rằng có người đang nghe cùng.', 'He stays. He wins the next duel, and before drawing his sword he glances your way, as if to make sure someone is listening with him.');
        },
      },
      {
        label: tr('Nhận thư tiến cử, ra mắt Thiên Binh Ty', 'Take the letter and present yourself to the Heavenly Soldiers Bureau'),
        hint: tr('+linh thạch, khí vận +', '+spirit stones, Luck +'),
        lean: 'trung',
        run: (c, ctx) => {
          const m = 300 * tier(c);
          money(c, m);
          stat(c, 'khiVan', 3);
          ctx.fx('coin', `+${m}`);
          ctSet(c, 'ct20261120_6', 2, 'nhan');
          return tr(`Thiên Binh Ty cho bạn một chức phó thống lĩnh, bổng lộc ${m} linh thạch. Mạc Thừa xuống trần làm thầy dạy kiếm cho một làng chài.`, `The Bureau grants you a vice-commander's post with a stipend of ${m} spirit stones. Mac Thua goes down to the mortal world to teach swordplay in a fishing village.`);
        },
      },
      {
        label: tr('Nhận viên tiên đan, uống ngay', 'Take the immortal pill and swallow it'),
        hint: tr('tu vi +', 'cultivation +'),
        lean: 'trung',
        run: (c, ctx) => {
          const g = Math.round(addCult(c, reward(c, 0.8)));
          ctx.fx('layer', tr('Tiên đan', 'Immortal pill'));
          ctSet(c, 'ct20261120_6', 2, 'dan');
          return tr(`Đan tan trong bụng, ấm như nắng chiều (+${g} tu vi). Mạc Thừa cúi chào rồi đi, không nói thêm câu nào.`, `The pill melts inside you, warm as evening sun (+${g} cultivation). Mac Thua bows and leaves without another word.`);
        },
      },
    ],
  },
];
