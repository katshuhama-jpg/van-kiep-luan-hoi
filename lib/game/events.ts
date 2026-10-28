import { DAO_LU, ITEMS, PATHS } from './data';
import { addCult, addLife, addPill, dao, fatal, giveItem, hasItem, hurt, isOrphan, luck, money, pick, reward, sample, stat, usePill } from './helpers';
import type { Character, Choice, GameEvent } from './types';
import { EVENTS2 } from './events2';
import { EVENTS3 } from './events3';
import { HOOK_EVENTS } from './hookEvents';
import { TA_EVENTS } from './taEvents';
import { SECT_EVENTS } from './sectEvents';
import { SECT_EVENTS2 } from './sectEvents2';
import { COSMOS_EVENTS } from './cosmosEvents';
import { HU_EVENTS } from './huEvents';
import { COSMOS_STORIES } from './cosmosStories';
import { COSMOS_END_EVENTS } from './cosmosEnds';
import { joinSect, rankByRoot, rankByWit, rankName } from './sect';
import { CHILD_EVENTS } from './childhood';
import { PET_EVENT, PET_STORIES } from './pets';
import { tr } from '../i18n';
import { nameOf } from '@/lib/hanviet';

export const EVENTS: GameEvent[] = [
  // ---------------- Tuổi thơ: mỗi người một bộ lựa chọn khác nhau ----------------
  {
    id: 'thoi_noi',
    minAge: 0,
    maxAge: 2,
    once: true,
    weight: 50,
    title: tr('Lễ thôi nôi', "First-birthday grab"),
    text: () => tr('Cả nhà bày đồ vật ra chiếu. Bạn bò tới và chộp lấy...', "The family lays out trinkets on a mat. You crawl over and snatch..."),
    choices: (_c, seed) =>
      sample<Choice>(
        seed,
        [
          {
            label: tr('Cuốn sách cũ', "An old book"),
            lean: 'trung',
            run: (c) => {
              stat(c, 'ngoTinh', 8);
              return tr('Bạn ôm cuốn sách không buông. Ông bà nói sau này hẳn là người đọc sách.', "You hug the book and won't let go. Your grandparents say you'll be a scholar.");
            },
          },
          {
            label: tr('Thanh kiếm gỗ', "A wooden sword"),
            lean: 'trung',
            run: (c) => {
              giveItem(c, 'moc_kiem');
              stat(c, 'sucKhoe', 6);
              return tr('Bạn vung kiếm gỗ trúng đầu chú họ. Cả nhà cười ầm.', "You swing the wooden sword right into your uncle's head. The whole family roars with laughter.");
            },
          },
          {
            label: tr('Viên linh thạch', "A spirit stone"),
            lean: 'trung',
            run: (c) => {
              money(c, 20);
              stat(c, 'khiVan', 4);
              return tr('Bạn ngậm viên linh thạch vào miệng. Bà nội nói đứa này có tướng giàu.', "You pop the spirit stone into your mouth. Grandma says this one has the face of wealth.");
            },
          },
          {
            label: tr('Con rắn nhỏ lạc vào nhà', "A little snake that slithered in"),
            lean: 'ta',
            run: (c) => {
              dao(c, -4);
              stat(c, 'khiVan', 6);
              return tr('Bạn bóp chặt con rắn tới khi nó bất động. Không ai dám nói gì.', "You squeeze the snake until it stops moving. Nobody dares say a word.");
            },
          },
          {
            label: tr('Cây bút lông', "A writing brush"),
            lean: 'chinh',
            run: (c) => {
              stat(c, 'ngoTinh', 5);
              stat(c, 'tamCanh', 3);
              return tr('Bạn quẹt mực lên mặt cả nhà. Ông đồ hàng xóm bảo nét bút có thần.', "You smear ink on everyone's faces. The old scholar next door says your strokes have spirit.");
            },
          },
          {
            label: tr('Con ấn ngọc của cha', "Father's jade seal"),
            lean: 'trung',
            run: (c) => {
              stat(c, 'khiVan', 8);
              return tr('Bạn cầm ấn ngọc đập xuống chiếu. Thầy bói đi ngang qua giật mình nhìn lại.', "You slam the jade seal onto the mat. A passing fortune teller does a double take.");
            },
          },
          {
            label: tr('Bình rượu của ông nội', "Grandpa's wine jug"),
            lean: 'trung',
            run: (c) => {
              stat(c, 'sucKhoe', -4);
              stat(c, 'tamCanh', 6);
              return tr('Bạn tu một ngụm rồi ngủ li bì hai ngày. Ông nội cười: "Có khí phách tửu tiên!"', "You take a swig and sleep like the dead for two days. Grandpa laughs: \"The makings of a wine immortal!\"");
            },
          },
          {
            label: tr('Lá bùa vàng trên vách', "The yellow talisman on the wall"),
            lean: 'trung',
            run: (c) => {
              addCult(c, 6);
              return tr('Lá bùa bốc cháy trong tay bạn mà không bỏng. Cả nhà sợ hãi.', "The talisman bursts into flame in your hand, yet you aren't burned. The family is terrified.");
            },
          },
          {
            label: tr('Chiếc gương đồng', "A bronze mirror"),
            lean: 'trung',
            run: (c) => {
              stat(c, 'tamCanh', 5);
              return tr('Bạn nhìn vào gương, cười khanh khách với chính mình cả buổi.', "You stare into the mirror and giggle at yourself all afternoon.");
            },
          },
          {
            label: tr('Cái bánh bao', "A steamed bun"),
            lean: 'trung',
            run: (c) => {
              stat(c, 'sucKhoe', 8);
              return tr('Bạn chọn ngay cái bánh bao. Người lớn thở dài, nhưng bạn lớn rất nhanh.', "You go straight for the bun. The adults sigh, but you grow up fast.");
            },
          },
        ],
        4,
      ),
  },
  {
    id: 'tuoi_tho',
    minAge: 5,
    maxAge: 10,
    once: true,
    weight: 30,
    title: tr('Những ngày bé', "Early childhood"),
    text: () => tr('Mùa hè năm ấy dài lê thê. Bạn dành phần lớn thời gian để...', "That summer dragged on forever. You spent most of it..."),
    choices: (_c, seed) =>
      sample<Choice>(
        seed,
        [
          {
            label: tr('Học chữ với thầy đồ', "Learning letters from the village teacher"),
            lean: 'chinh',
            run: (c) => {
              stat(c, 'ngoTinh', 6);
              dao(c, 3);
              return tr('Thầy đồ khen bạn chữ đẹp, đọc một hiểu mười.', "The teacher praises your handwriting - read one, understand ten.");
            },
          },
          {
            label: tr('Tập võ với ông lão đầu làng', "Training with the old man at the village gate"),
            lean: 'trung',
            run: (c) => {
              stat(c, 'sucKhoe', 10);
              return tr('Ông lão dạy bạn mấy thế quyền. Người rắn rỏi hẳn ra.', "The old man teaches you a few fist forms. You toughen up noticeably.");
            },
          },
          {
            label: tr('Chăn trâu, nằm ngắm mây', "Herding buffalo, watching clouds"),
            lean: 'trung',
            run: (c) => {
              stat(c, 'tamCanh', 10);
              return tr('Nằm trên lưng trâu nhìn mây trôi, lòng bạn tĩnh lặng lạ thường.', "Lying on the buffalo's back watching clouds drift by, your heart grows strangely still.");
            },
          },
          {
            label: tr('Đi trộm gà nhà hàng xóm', "Stealing the neighbor's chickens"),
            lean: 'ta',
            run: (c, ctx) => {
              dao(c, -6);
              if (ctx.rnd() < 0.5) {
                stat(c, 'khiVan', 5);
                return tr('Bạn trộm được cả con gà béo. Không ai phát hiện.', "You make off with a whole fat hen. Nobody notices.");
              }
              stat(c, 'sucKhoe', -8);
              return tr('Bị chó đuổi cắn một miếng, về nhà còn bị đòn.', "A dog chases you and takes a bite. At home you get a beating too.");
            },
          },
          {
            label: tr('Leo vách đá bắt tổ chim', "Climbing the cliff for bird nests"),
            lean: 'trung',
            run: (c, ctx) => {
              const f = fatal(c, ctx, 0.08, tr('Bạn trượt tay rơi từ vách đá xuống. Năm ấy bạn mới lên bảy.', "Your hand slips and you fall from the cliff. You were only seven that year."));
              if (c.dead) return tr('Gần tới tổ chim rồi...', "Almost at the nest...") + f;
              stat(c, 'sucKhoe', 6);
              return tr('Bạn mang về ba quả trứng chim, mẹ mắng nhưng vẫn luộc cho ăn.', "You bring home three bird eggs. Mother scolds you, but boils them for you anyway.") + (f ?? '');
            },
          },
          {
            label: tr('Theo cha ra chợ bán hàng', "Selling at the market with Father"),
            lean: 'trung',
            run: (c) => {
              money(c, 15);
              return tr('Bạn học được cách mặc cả. Cha khen đứa này có đầu óc buôn bán.', "You learn how to haggle. Father says this kid has a head for business.");
            },
          },
          {
            label: tr('Nghe ông kể chuyện tiên nhân', "Listening to Grandpa's tales of immortals"),
            lean: 'trung',
            run: (c) => {
              addCult(c, 5);
              stat(c, 'ngoTinh', 3);
              return tr('Đêm nào bạn cũng mơ thấy mình bay trên mây.', "Every night you dream of flying above the clouds.");
            },
          },
          {
            label: tr('Bắt nạt đứa bé hàng xóm', "Bullying the neighbor kid"),
            lean: 'ta',
            run: (c) => {
              dao(c, -5);
              stat(c, 'tamMa', 4);
              return tr('Đứa bé khóc chạy về nhà. Bạn thấy mình oai lắm.', "The kid runs home crying. You feel mighty impressive.");
            },
          },
          {
            label: tr('Giúp bà cụ mù gánh nước', "Carrying water for the blind old woman"),
            lean: 'chinh',
            run: (c) => {
              dao(c, 6);
              stat(c, 'khiVan', 4);
              return tr('Bà cụ sờ đầu bạn: "Đứa trẻ ngoan, trời sẽ thương con."', "The old woman pats your head: \"Good child, Heaven will look after you.\"");
            },
          },
        ],
        4,
      ),
  },
  {
    id: 'sot_dau',
    minAge: 1,
    maxAge: 8,
    once: true,
    weight: 4,
    title: tr('Trận sốt đậu mùa', "Smallpox fever"),
    text: () => tr('Làng có dịch đậu mùa. Bạn sốt mê man ba ngày, người nổi đầy mụn đỏ.', "Smallpox sweeps the village. You lie delirious for three days, covered in red sores."),
    choices: (c) => [
      {
        label: tr('Mời thầy lang giỏi nhất huyện', "Fetch the best physician in the county"),
        hint: c.linhThach >= 40 ? tr('-40 linh thạch', "-40 spirit stones") : tr('nhà không đủ tiền', "can't afford it"),
        lean: 'trung',
        run: (c, ctx) => {
          if (c.linhThach >= 40) {
            money(c, -40);
            return tr('Thầy lang bốc thuốc ba ngày, bạn qua cơn nguy kịch.', "The physician doses you for three days, and you pull through.");
          }
          const f = fatal(c, ctx, 0.35, tr(`Nhà không đủ tiền mời thầy. Bạn mất vì đậu mùa năm ${Math.floor(c.age)} tuổi.`, `Your family couldn't afford a physician. You died of smallpox at age ${Math.floor(c.age)}.`));
          if (c.dead) return tr('Thầy lang lắc đầu bỏ đi...', "The physician shakes his head and leaves...") + f;
          return tr('Thầy lang không chịu tới. May sao bạn tự qua khỏi.', "The physician refuses to come. Luckily, you pull through on your own.") + (f ?? '');
        },
      },
      {
        label: tr('Mẹ thức trắng đêm chườm khăn', "Mother keeps cold cloths on you all night"),
        lean: 'chinh',
        run: (c, ctx) => {
          const f = fatal(c, ctx, 0.15, tr('Mẹ ôm bạn suốt bảy đêm, nhưng cơn sốt không dứt. Bạn ra đi trong vòng tay mẹ.', "Mother holds you for seven nights, but the fever won't break. You pass away in her arms."));
          if (c.dead) return tr('Đêm thứ bảy...', "The seventh night...") + f;
          stat(c, 'tamCanh', 6);
          return tr('Sáng ngày thứ tám bạn mở mắt, thấy mẹ ngủ gục bên giường.', "On the eighth morning you open your eyes and find Mother asleep by the bed.") + (f ?? '');
        },
      },
      {
        label: tr('Bà nội đem đi cúng thầy mo', "Grandma takes you to the shaman"),
        lean: 'trung',
        run: (c, ctx) => {
          const f = fatal(c, ctx, 0.3, tr('Thầy mo bắt uống nước bùa lẫn tro. Bạn không qua khỏi.', "The shaman makes you drink talisman water mixed with ash. You don't make it."));
          if (c.dead) return tr('Khói hương nghi ngút...', "Incense smoke billows...") + f;
          stat(c, 'khiVan', 5);
          return tr('Không biết nhờ bùa hay nhờ trời, bạn khỏi bệnh.', "Whether it was the talisman or Heaven's mercy, you recover.") + (f ?? '');
        },
      },
      {
        label: tr('Cha cõng lên chùa xin thuốc', "Father carries you to the temple for medicine"),
        lean: 'chinh',
        run: (c, ctx) => {
          const f = fatal(c, ctx, 0.1, tr('Đường lên chùa xa quá. Bạn trút hơi thở cuối trên lưng cha.', "The road to the temple is too long. You breathe your last on Father's back."));
          if (c.dead) return tr('Cha chạy suốt đêm...', "Father runs all night...") + f;
          dao(c, 4);
          return tr('Sư cụ cho thuốc, còn xoa đầu bảo bạn có duệ căn.', "The old abbot gives you medicine and pats your head, saying you have Buddha-nature.") + (f ?? '');
        },
      },
    ],
  },
  {
    id: 'gieng_co',
    minAge: 3,
    maxAge: 10,
    once: true,
    weight: 10,
    title: tr('Trốn tìm', "Hide and seek"),
    text: () => tr('Lũ trẻ trong làng chơi trốn tìm. Bạn phải tìm chỗ trốn thật nhanh.', "The village kids are playing hide and seek. You need a hiding spot, fast."),
    choices: (_c, seed) =>
      sample<Choice>(
        seed,
        [
          {
            label: tr('Nhảy qua miệng giếng cổ', "Leap over the old well"),
            lean: 'trung',
            run: (c, ctx) => {
              const f = fatal(c, ctx, 0.15, tr('Bạn trượt chân rơi xuống giếng cổ. Ba ngày sau người ta mới vớt được.', "You slip and fall into the old well. They only fish you out three days later."));
              if (c.dead) return tr('Bạn lấy đà...', "You take a running start...") + f;
              stat(c, 'khiVan', 4);
              return tr('Bạn nhảy qua ngon lành, không ai tìm ra.', "You clear it with ease. Nobody finds you.") + (f ?? '');
            },
          },
          {
            label: tr('Trèo lên ngọn cây đa', "Climb the banyan tree"),
            lean: 'trung',
            run: (c, ctx) => {
              const f = fatal(c, ctx, 0.08, tr('Cành cây gãy. Bạn rơi xuống đất, không bao giờ tỉnh lại.', "The branch snaps. You hit the ground and never wake up."));
              if (c.dead) return tr('Càng trèo càng cao...', "Higher and higher...") + f;
              stat(c, 'sucKhoe', 4);
              return tr('Bạn ngủ quên trên cây, cả làng đi tìm đến tối.', "You fall asleep in the tree. The whole village searches for you until dark.") + (f ?? '');
            },
          },
          {
            label: tr('Trốn trong kho thóc', "Hide in the rice barn"),
            lean: 'trung',
            run: (c) => {
              stat(c, 'tamCanh', 3);
              return tr('Bạn ngủ thiếp đi trong đống thóc ấm áp.', "You doze off in the warm pile of rice.");
            },
          },
          {
            label: tr('Trốn vào ngôi miếu hoang', "Hide in the abandoned shrine"),
            lean: 'trung',
            run: (c, ctx) => {
              if (ctx.rnd() < 0.4) {
                addCult(c, 10);
                return tr('Trong miếu có pho tượng phát sáng. Bạn chạm vào, người ấm lên lạ thường.', "A statue in the shrine is glowing. You touch it, and a strange warmth fills you.");
              }
              stat(c, 'tamMa', 5);
              return tr('Trong miếu tối om, bạn sợ phát khóc.', "The shrine is pitch black. You're so scared you cry.");
            },
          },
          {
            label: tr('Lén nhốt đứa bạn vào chuồng heo', "Lock your friend in the pigsty"),
            lean: 'ta',
            run: (c) => {
              dao(c, -4);
              return tr('Đứa bạn kêu la cả buổi chiều. Bạn cười đau cả bụng.', "Your friend screams all afternoon. You laugh until your belly hurts.");
            },
          },
          {
            label: tr('Bỏ cuộc, về ăn cơm', "Give up and go eat"),
            lean: 'trung',
            run: (c) => {
              stat(c, 'sucKhoe', 3);
              return isOrphan(c) ? tr('Bà hàng xóm để phần bạn bát canh cua. Trò chơi gì cũng không bằng.', "The neighbor lady saved you a bowl of crab soup. No game beats that.") : tr('Mẹ nấu canh cua. Trò chơi gì cũng không bằng.', "Mother made crab soup. No game beats that.");
            },
          },
        ],
        4,
      ),
  },
  {
    id: 'ke_la',
    minAge: 3,
    maxAge: 9,
    once: true,
    weight: 8,
    title: tr('Người lạ cho kẹo', "A stranger with candy"),
    text: () => tr('Một gã mặc áo xám đứng ở đầu ngõ, chìa ra gói kẹo mạch nha: "Theo chú, chú cho cả gói."', "A man in grey stands at the end of the lane, holding out malt candy: \"Come with me and the whole pack is yours.\""),
    choices: () => [
      {
        label: tr('Cầm kẹo, đi theo', "Take the candy, follow him"),
        lean: 'trung',
        run: (c, ctx) => {
          const f = fatal(c, ctx, 0.5, tr('Bạn bị bắt cóc, bán sang biên ải. Không ai còn thấy bạn nữa.', "You are kidnapped and sold beyond the frontier. No one ever sees you again."));
          if (c.dead) return tr('Gã dắt tay bạn đi xa dần...', "He leads you farther and farther away...") + f;
          stat(c, 'khiVan', 5);
          return tr('Đi được nửa đường thì gặp tuần binh. Gã bỏ chạy, bạn được đưa về nhà.', "Halfway there you run into a patrol. He flees, and you're brought home.") + (f ?? '');
        },
      },
      {
        label: tr('Lắc đầu, chạy về nhà', "Shake your head, run home"),
        lean: 'chinh',
        run: (c) => {
          stat(c, 'tamCanh', 4);
          return tr('Mẹ nghe chuyện, ôm bạn thật chặt.', "Hearing the story, Mother holds you tight.");
        },
      },
      {
        label: tr('Hét to gọi người lớn', "Shout for the grown-ups"),
        lean: 'chinh',
        run: (c) => {
          dao(c, 5);
          stat(c, 'khiVan', 3);
          return tr('Cả xóm chạy ra, bắt được tên buôn người. Quan phủ khen bạn.', "The whole hamlet rushes out and catches the child trafficker. The magistrate praises you.");
        },
      },
      {
        label: tr('Giật gói kẹo rồi bỏ chạy', "Snatch the candy and run"),
        lean: 'ta',
        run: (c, ctx) => {
          dao(c, -3);
          if (ctx.rnd() < 0.6) return tr('Bạn chạy nhanh hơn hắn. Kẹo ngọt lắm.', "You outrun him. The candy is so sweet.");
          return tr('Hắn tóm được cổ áo bạn, đánh cho một trận rồi bỏ đi.', "He grabs you by the collar, gives you a thrashing, and leaves.") + hurt(c, 15, ctx);
        },
      },
    ],
  },
  {
    id: 'song_lu',
    minAge: 6,
    maxAge: 14,
    once: true,
    weight: 10,
    title: tr('Tắm sông', "Swimming in the river"),
    text: () => tr('Trưa hè, lũ trẻ rủ nhau ra khúc sông đầu làng tắm. Nước năm nay chảy xiết.', "On a summer noon the kids head to the river bend by the village for a swim. The current is strong this year."),
    choices: (_c, seed) =>
      sample<Choice>(
        seed,
        [
          {
            label: tr('Thi lặn xem ai lâu nhất', "See who can stay under longest"),
            lean: 'trung',
            run: (c, ctx) => {
              const f = fatal(c, ctx, 0.1, tr('Bạn bị dòng xoáy kéo xuống. Khúc sông năm ấy cướp mất một đứa trẻ.', "A whirlpool drags you under. That year the river took a child."));
              if (c.dead) return tr('Bạn hít một hơi thật sâu...', "You take a deep breath...") + f;
              stat(c, 'sucKhoe', 6);
              return tr('Bạn thắng, lũ bạn phục sát đất.', "You win. Your friends are in awe.") + (f ?? '');
            },
          },
          {
            label: tr('Lao ra cứu đứa bạn đuối nước', "Dive in to save a drowning friend"),
            lean: 'chinh',
            run: (c, ctx) => {
              dao(c, 10);
              const f = fatal(c, ctx, 0.15, tr('Bạn cứu được bạn mình, nhưng kiệt sức và bị nước cuốn đi.', "You save your friend, but you're exhausted and the current sweeps you away."));
              if (c.dead) return tr('Bạn bơi ra giữa dòng...', "You swim out into the current...") + f;
              stat(c, 'khiVan', 6);
              return tr('Bạn kéo được bạn vào bờ. Nhà nó mang gà sang cảm ơn.', "You drag your friend to shore. Their family brings over a chicken as thanks.") + (f ?? '');
            },
          },
          {
            label: tr('Ngồi trên bờ trông quần áo', "Sit on the bank and mind the clothes"),
            lean: 'trung',
            run: (c) => {
              stat(c, 'tamCanh', 3);
              return tr('Bạn ngồi trên bờ ngắm chuồn chuồn cả buổi trưa.', "You sit on the bank watching dragonflies all noon.");
            },
          },
          {
            label: tr('Đẩy thằng hay bắt nạt xuống chỗ sâu', "Push the bully into the deep part"),
            lean: 'ta',
            run: (c, ctx) => {
              dao(c, -10);
              stat(c, 'tamMa', 8);
              if (ctx.rnd() < 0.3) {
                c.enemy = c.enemy ?? tr('gia đình đứa trẻ chết đuối năm xưa', "the family of the child who drowned years ago");
                return tr('Nó không nổi lên nữa. Bạn đứng chết lặng.', "He never comes back up. You stand frozen in shock.");
              }
              return tr('Nó uống no nước, từ đó sợ bạn một phép.', "He swallows half the river, and fears you ever after.");
            },
          },
          {
            label: tr('Bắt cá về cho mẹ', "Catch fish for Mother"),
            lean: 'trung',
            run: (c) => {
              money(c, 5);
              return tr('Bạn bắt được con cá chép to. Mẹ nấu canh chua.', "You catch a big carp. Mother makes sour soup.");
            },
          },
        ],
        4,
      ),
  },
  {
    id: 'am_sat_the_gia',
    minAge: 4,
    maxAge: 14,
    once: true,
    weight: 25,
    when: (c) => c.originId === 'the_gia',
    title: tr('Tranh đoạt trong thế gia', "Clan power struggle"),
    text: () => tr('Chi trưởng Lâm gia sợ chi thứ có người tài tranh quyền. Nửa đêm, bạn nghe tiếng bước chân lạ ngoài cửa sổ.', "The main branch of the Lin clan fears a talent rising in the lesser branch. At midnight, you hear strange footsteps outside the window."),
    choices: () => [
      {
        label: tr('Trốn vào mật thất của cha', "Hide in Father's secret chamber"),
        lean: 'trung',
        run: (c, ctx) => {
          const f = fatal(c, ctx, 0.15, tr('Thích khách tìm ra mật thất. Bạn chết khi mới vài tuổi đầu.', "The assassin finds the secret chamber. You die when you're barely a few years old."));
          if (c.dead) return tr('Bạn nín thở trong bóng tối...', "You hold your breath in the dark...") + f;
          return tr('Thích khách lục soát cả đêm không thấy. Từ đó bạn ngủ không yên.', "The assassin searches all night and finds nothing. You never sleep soundly again.") + (f ?? '');
        },
      },
      {
        label: tr('Chạy sang báo cho cha', "Run to warn Father"),
        lean: 'chinh',
        run: (c, ctx) => {
          const f = fatal(c, ctx, 0.2, tr('Một mũi phi tiêu tẩm độc trúng lưng khi bạn băng qua sân.', "A poisoned dart strikes your back as you dash across the courtyard."));
          if (c.dead) return tr('Bạn chạy băng qua sân...', "You dash across the courtyard...") + f;
          dao(c, 4);
          return tr('Cha kịp đánh lui thích khách. Gia tộc rúng động.', "Father drives off the assassin in time. The whole clan is shaken.") + (f ?? '');
        },
      },
      {
        label: tr('Giả vờ ngủ say', "Pretend to be fast asleep"),
        lean: 'trung',
        run: (c, ctx) => {
          const f = fatal(c, ctx, 0.35, tr('Thích khách không cần biết bạn thức hay ngủ.', "The assassin doesn't care whether you're awake or asleep."));
          if (c.dead) return tr('Bạn nhắm mắt...', "You close your eyes...") + f;
          stat(c, 'tamCanh', 8);
          return tr('Hắn đứng nhìn bạn rất lâu, rồi lặng lẽ bỏ đi. Có lẽ hắn cũng có con.', "He stands watching you for a long time, then quietly leaves. Perhaps he has a child too.") + (f ?? '');
        },
      },
      {
        label: tr('Ném đèn dầu đốt luôn căn phòng', "Throw the oil lamp and burn the room"),
        lean: 'ta',
        run: (c, ctx) => {
          dao(c, -6);
          const f = fatal(c, ctx, 0.12, tr('Lửa lan quá nhanh, bạn không thoát ra được.', "The fire spreads too fast. You can't get out."));
          if (c.dead) return tr('Ngọn lửa bùng lên...', "The flames roar up...") + f;
          c.enemy = c.enemy ?? tr('chi trưởng Lâm gia', "the main branch of the Lin clan");
          return tr('Thích khách chết cháy, bạn nhảy qua cửa sổ thoát thân.', "The assassin burns to death. You leap out the window and escape.") + (f ?? '');
        },
      },
    ],
  },
  {
    id: 'mat_mua',
    minAge: 3,
    maxAge: 13,
    once: true,
    weight: 14,
    when: (c) => c.originId === 'nong' || c.originId === 'co_nhi' || c.linhThach < 30,
    title: tr('Năm mất mùa', "Year of famine"),
    text: () => tr('Hạn hán cả năm, ruộng nứt nẻ. Nhà không còn hạt gạo nào.', "A year-long drought cracks the fields. There's not a grain of rice left at home."),
    choices: (_c, seed) =>
      sample<Choice>(
        seed,
        [
          {
            label: tr('Đào rễ cây trên núi ăn', "Dig up roots on the mountain"),
            lean: 'trung',
            run: (c, ctx) => {
              const f = fatal(c, ctx, 0.12, tr('Bạn ăn nhầm rễ cây độc. Cả nhà khóc ngất.', "You eat a poisonous root by mistake. The family weeps themselves faint."));
              if (c.dead) return tr('Bạn nhai rễ cây đắng ngắt...', "You chew the bitter roots...") + f;
              stat(c, 'sucKhoe', -6);
              return tr('Đắng, nhưng sống qua được mùa đói.', "Bitter, but it gets you through the famine.") + (f ?? '');
            },
          },
          {
            label: tr('Theo đám ăn mày đi xin ăn', "Beg with the beggars"),
            lean: 'trung',
            run: (c) => {
              stat(c, 'tamMa', 4);
              stat(c, 'tamCanh', 4);
              return tr('Bạn học được rằng lòng người có ấm có lạnh.', "You learn that people's hearts can be warm or cold.");
            },
          },
          {
            label: tr('Lẻn vào kho lương nhà quan', "Sneak into the magistrate's granary"),
            lean: 'ta',
            run: (c, ctx) => {
              dao(c, -6);
              const f = fatal(c, ctx, 0.18, tr('Bạn bị lính canh bắt được, đánh chết ngay trước cổng kho.', "The guards catch you and beat you to death right at the granary gate."));
              if (c.dead) return tr('Bạn chui qua lỗ chó...', "You squeeze through the dog hole...") + f;
              money(c, 10);
              return tr('Bạn vác về được nửa bao gạo. Cả nhà sống qua mùa đông.', "You haul home half a sack of rice. The family survives the winter.") + (f ?? '');
            },
          },
          {
            label: tr('Xin làm đầy tớ cho địa chủ', "Become a landlord's servant"),
            lean: 'trung',
            run: (c) => {
              money(c, 15);
              stat(c, 'khiVan', -3);
              return tr('Bạn được ăn no, nhưng ngày nào cũng bị roi vọt.', "You eat your fill, but get whipped every day.");
            },
          },
          {
            label: tr('Nhường phần ăn cho em', "Give your share to your sibling"),
            lean: 'chinh',
            run: (c, ctx) => {
              dao(c, 8);
              const f = fatal(c, ctx, 0.1, tr('Bạn nhường hết phần ăn, rồi gầy dần và không qua khỏi mùa đông ấy.', "You give away all your food, waste away, and don't survive that winter."));
              if (c.dead) return tr('Bạn bảo mình không đói...', "You say you're not hungry...") + f;
              stat(c, 'tamCanh', 8);
              return tr('Em bạn sống. Bạn cũng sống, gầy trơ xương.', "Your sibling lives. So do you, nothing but skin and bones.") + (f ?? '');
            },
          },
        ],
        4,
      ),
  },
  {
    id: 'chua_tuoi_tho',
    minAge: 5,
    maxAge: 12,
    once: true,
    weight: 25,
    when: (c) => c.originId === 'chua',
    title: tr('Tiểu sa di', "Little novice monk"),
    text: () => tr('Bạn lớn lên trong chùa Vân Tịch. Mỗi sáng sư cụ bắt dậy từ canh tư.', "You grow up in Yun Xi Temple. Every morning the old abbot has you up at the fourth watch."),
    choices: () => [
      {
        label: tr('Chăm chỉ tụng kinh', "Diligently chant sutras"),
        lean: 'chinh',
        run: (c) => {
          dao(c, 8);
          stat(c, 'tamCanh', 8);
          return tr('Bạn thuộc lòng cả bộ Kim Cương Kinh.', "You learn the entire Diamond Sutra by heart.");
        },
      },
      {
        label: tr('Trốn ra suối bắt cá', "Sneak off to the stream to fish"),
        lean: 'trung',
        run: (c) => {
          stat(c, 'sucKhoe', 6);
          return tr('Sư cụ biết hết, chỉ cười rồi phạt bạn quét sân.', "The abbot knows everything. He just smiles and makes you sweep the courtyard.");
        },
      },
      {
        label: tr('Hỏi sư tổ về đạo trường sinh', "Ask the grand master about eternal life"),
        lean: 'trung',
        run: (c) => {
          addCult(c, 12);
          stat(c, 'ngoTinh', 4);
          return tr('Sư tổ im lặng hồi lâu, rồi dạy bạn một câu khẩu quyết.', "The grand master is silent for a long while, then teaches you a single incantation.");
        },
      },
      {
        label: tr('Ăn vụng đồ cúng', "Steal the offerings"),
        lean: 'ta',
        run: (c) => {
          dao(c, -4);
          stat(c, 'sucKhoe', 4);
          return tr('Xôi chè ngon tuyệt. Pho tượng Hộ Pháp như đang trừng mắt nhìn bạn.', "The sticky rice and sweet soup are divine. The Dharma Guardian statue seems to glare at you.");
        },
      },
    ],
  },
  {
    id: 'yeu_hoa_hinh',
    minAge: 3,
    maxAge: 12,
    once: true,
    weight: 25,
    when: (c) => c.race === 'yeu',
    title: tr('Lần đầu hóa hình', "First transformation"),
    text: () => tr('Đêm trăng tròn, bạn thấy mình có thể biến thành hình người. Ngoài rừng có tiếng chó săn sủa.', "On the night of the full moon you find you can take human form. Hunting dogs bark in the forest."),
    choices: () => [
      {
        label: tr('Hóa hình, xuống làng xem thử', "Take human form, visit the village"),
        lean: 'trung',
        run: (c, ctx) => {
          if (ctx.rnd() < 0.7) {
            stat(c, 'ngoTinh', 6);
            return tr('Bạn lẫn vào chợ người, nếm được kẹo hồ lô lần đầu tiên.', "You blend into the human market and taste candied haws for the first time.");
          }
          return tr('Cái đuôi lòi ra giữa chợ, bạn bị ném đá đuổi về rừng.', "Your tail pops out in the middle of the market. You're stoned and chased back to the forest.") + hurt(c, 20, ctx);
        },
      },
      {
        label: tr('Ra xem chó săn', "Go see the hunting dogs"),
        lean: 'trung',
        run: (c, ctx) => {
          const f = fatal(c, ctx, 0.3, tr('Thợ săn bắn trúng bạn. Bộ da yêu hồ được bán giá cao ở phường thị.', "A hunter shoots you. Your fox demon pelt fetches a high price at the Market."));
          if (c.dead) return tr('Bạn rón rén lại gần...', "You creep closer...") + f;
          return tr('Bạn chạy thoát, mất một nhúm lông đuôi.', "You escape, minus a tuft of tail fur.") + (f ?? '');
        },
      },
      {
        label: tr('Trốn sâu trong hang mẹ', "Hide deep in Mother's den"),
        lean: 'trung',
        run: (c) => {
          stat(c, 'tamCanh', 5);
          return tr('Mẹ liếm đầu bạn, kể chuyện về Yêu Vương thời thượng cổ.', "Mother licks your head and tells tales of the Demon King of ancient times.");
        },
      },
      {
        label: tr('Cắn chết chó săn, hút tinh huyết', "Bite the hound to death, drink its blood essence"),
        lean: 'ta',
        run: (c) => {
          dao(c, -8);
          addCult(c, 12);
          return tr('Lần đầu nếm máu, yêu tính trong người bạn trỗi dậy.', "Your first taste of blood. The demonic nature within you stirs.");
        },
      },
    ],
  },
  {
    id: 'lac_rung',
    minAge: 4,
    maxAge: 12,
    once: true,
    weight: 8,
    title: tr('Lạc trong rừng', "Lost in the forest"),
    text: () => tr('Đi hái nấm, bạn lạc sâu trong rừng già. Trời tối dần, xa xa có tiếng hú.', "Gathering mushrooms, you get lost deep in the old forest. Night falls, and howls echo in the distance."),
    choices: (_c, seed) =>
      sample<Choice>(
        seed,
        [
          {
            label: tr('Đi theo đàn đom đóm', "Follow the fireflies"),
            lean: 'trung',
            run: (c, ctx) => {
              if (ctx.rnd() < 0.5) {
                addCult(c, 15);
                return tr('Đom đóm dẫn bạn tới một hồ nước phát sáng. Bạn uống một ngụm, người nhẹ bẫng.', "The fireflies lead you to a glowing pond. You take a sip and feel light as a feather.");
              }
              return tr('Đom đóm dẫn bạn ra tới bìa rừng. Cả làng đang đốt đuốc tìm.', "The fireflies lead you out to the forest's edge. The whole village is searching with torches.");
            },
          },
          {
            label: tr('Leo lên cây đợi trời sáng', "Climb a tree, wait for dawn"),
            lean: 'trung',
            run: (c) => {
              stat(c, 'tamCanh', 5);
              return tr('Bạn ôm cành cây cả đêm, nghe sói đi qua dưới gốc.', "You cling to a branch all night, listening to wolves pass below.");
            },
          },
          {
            label: tr('Đi về phía tiếng hú', "Head toward the howling"),
            lean: 'trung',
            run: (c, ctx) => {
              const f = fatal(c, ctx, 0.4, tr('Đó là bầy sói đói. Sáng hôm sau người ta chỉ tìm thấy chiếc dép nhỏ.', "It's a pack of hungry wolves. The next morning, all anyone finds is a small sandal."));
              if (c.dead) return tr('Bạn tò mò đi tới...', "Curious, you walk toward it...") + f;
              c.pet = true;
              c.petKind = 'soi_con';
              return tr('Hóa ra là một con sói con bị thương. Bạn băng bó cho nó, nó đi theo bạn về làng.', "It's just a wounded wolf cub. You bandage it, and it follows you home.") + (f ?? '');
            },
          },
          {
            label: tr('Gào khóc gọi cha mẹ', "Cry out for your parents"),
            lean: 'trung',
            run: (c, ctx) => {
              if (ctx.rnd() < 0.7) return tr('Cha nghe tiếng, tìm được bạn lúc nửa đêm.', "Father hears you and finds you at midnight.");
              return tr('Tiếng khóc dẫn tới một con hổ. May mà tiều phu bắn đuổi kịp.', "Your crying draws a tiger. Luckily a woodcutter scares it off with arrows just in time.") + hurt(c, 25, ctx);
            },
          },
          {
            label: tr('Đốt lửa ngồi chờ', "Light a fire and wait"),
            lean: 'trung',
            run: (c, ctx) => {
              const f = fatal(c, ctx, 0.08, tr('Lửa bén vào cỏ khô. Cháy rừng.', "The fire catches the dry grass. Forest fire."));
              if (c.dead) return tr('Bạn nhóm lửa...', "You kindle a fire...") + f;
              return tr('Ánh lửa giúp dân làng tìm thấy bạn.', "The firelight helps the villagers find you.") + (f ?? '');
            },
          },
        ],
        4,
      ),
  },
  {
    id: 'bat_nat',
    minAge: 6,
    maxAge: 13,
    once: true,
    weight: 20,
    title: tr('Bị bắt nạt', "Bullied"),
    text: () => tr('Thằng con trưởng thôn cùng đám bạn chặn bạn ở bờ ruộng, đòi bạn quỳ xuống.', "The village chief's son and his gang corner you on the paddy dike and demand you kneel."),
    choices: () => [
      {
        label: tr('Lao vào đánh', "Charge in swinging"),
        lean: 'trung',
        run: (c, ctx) => {
          if (ctx.rnd() < 0.45) {
            stat(c, 'tamCanh', 6);
            return tr('Bạn đánh cho cả đám chạy tán loạn. Từ đó không ai dám động.', "You beat the whole gang into a scattered rout. Nobody messes with you after that.");
          }
          return tr('Bạn bị đánh bầm dập.', "You get beaten black and blue.") + hurt(c, 15, ctx);
        },
      },
      {
        label: tr('Về mách người lớn', "Tell the grown-ups"),
        lean: 'chinh',
        run: (c) => {
          dao(c, 3);
          return tr('Cha mẹ sang nói chuyện phải trái. Mọi chuyện êm xuôi.', "Your parents go over to talk sense into them. Everything is smoothed over.");
        },
      },
      {
        label: tr('Nhịn, đi đường vòng', "Swallow it, take the long way"),
        lean: 'trung',
        run: (c) => {
          stat(c, 'tamCanh', 4);
          stat(c, 'tamMa', 4);
          return tr('Bạn nhịn. Nhưng có gì đó cứ âm ỉ trong lòng.', "You hold it in. But something keeps smoldering inside you.");
        },
      },
      {
        label: tr('Đêm đó đốt kho thóc nhà nó', "Burn down his family's rice barn that night"),
        lean: 'ta',
        run: (c) => {
          dao(c, -12);
          stat(c, 'tamMa', 8);
          stat(c, 'khiVan', 4);
          return tr('Kho thóc cháy rụi. Bạn đứng xa nhìn ngọn lửa, thấy hả hê.', "The barn burns to the ground. You watch the flames from afar, deeply satisfied.");
        },
      },
    ],
  },
  {
    id: 'tuyen_de_tu',
    minAge: 9,
    maxAge: 16,
    maxRealm: 1,
    once: true,
    weight: 80,
    when: (c) => c.originId !== 'yeu',
    title: tr('Tông môn tuyển đệ tử', "Sect recruitment"),
    text: () => tr('Tiên nhân cưỡi hạc hạ xuống trấn, nói rằng ba năm mới mở cửa thu nhận đệ tử một lần. Ma môn cũng lén cho người tới.', "An immortal descends on the town riding a crane, announcing the sect opens its gates to disciples only once every three years. A demonic sect has quietly sent people too."),
    choices: () => [
      {
        label: tr('Thử vào Thanh Vân Tông', "Try for Qingyun Sect"),
        hint: tr('chính phái, cần linh căn tốt', "righteous, needs a good spiritual root"),
        lean: 'chinh',
        run: (c, ctx) => {
          // bậc đệ tử theo căn cốt: Thiên linh căn chân truyền, Địa nội môn, Huyền và Tạp ngoại môn, Phế làm tạp dịch nếu may
          const rank = rankByRoot(c.linhCanMul);
          if (rank === 0 && ctx.rnd() >= 0.4) {
            stat(c, 'tamMa', 10);
            return tr('Linh căn quá kém, bị đuổi về giữa tiếng cười của người khác.', "Your spiritual root is too poor. You're sent home amid the laughter of others.");
          }
          joinSect(c, tr('Thanh Vân Tông', "Qingyun Sect"), rank);
          dao(c, 10);
          addCult(c, 25 + rank * 20);
          giveItem(c, 'thanh_sam');
          ctx.fx(rank >= 2 ? 'breakthrough' : 'buy', rankName(c));
          if (rank === 3)
            return tr(`Đá đo linh căn sáng rực đến chói mắt, cả quảng trường im phăng phắc: ${c.linhCan}! Ba vị trưởng lão tranh nhau nhận bạn. Bạn trở thành Chân truyền đệ tử Thanh Vân Tông, tu luyện nhanh hơn 40%.`, `The root-testing stone blazes so bright it hurts the eyes, and the whole square falls silent: ${c.linhCan}! Three elders fight over you. You become a True Disciple of Qingyun Sect, cultivating 40% faster.`);
          if (rank === 2) return tr(`Đá đo linh căn sáng lên rực rỡ: ${c.linhCan}. Bạn được nhận thẳng vào Nội môn Thanh Vân Tông, được phát áo Thanh Sam, tu luyện nhanh hơn 25%.`, `The root-testing stone lights up brilliantly: ${c.linhCan}. You're admitted straight into the inner sect of Qingyun Sect and issued a green robe, cultivating 25% faster.`);
          if (rank === 1) return tr('Đo linh căn đạt yêu cầu. Bạn trở thành Ngoại môn đệ tử Thanh Vân Tông, được phát áo Thanh Sam. Muốn lên nội môn, phải thắng ở Đại bỉ tông môn.', "Your spiritual root passes the test. You become an outer disciple of Qingyun Sect and are issued a green robe. To reach the inner sect, you must win the Grand Sect Tournament.");
          return tr('Linh căn quá kém, nhưng một vị chấp sự thương tình giữ lại làm Tạp dịch: quét lá, gánh nước. Ai biết được, biết đâu có ngày nghịch thiên.', "Your spiritual root is too poor, but a sympathetic deacon keeps you on as a handyman: sweeping leaves, hauling water. Who knows - one day you might defy the heavens.");
        },
      },
      {
        label: tr('Theo người của Huyết Sát Môn', "Follow the people from Xuesha Sect"),
        hint: tr('ma môn, không kén linh căn', "demonic sect, takes any spiritual root"),
        lean: 'ta',
        run: (c, ctx) => {
          joinSect(c, tr('Huyết Sát Môn', "Xuesha Sect"), Math.max(1, rankByRoot(c.linhCanMul)));
          dao(c, -15);
          addCult(c, 35);
          stat(c, 'tamMa', 10);
          ctx.fx('evil', tr('Nhập ma môn', "Joined a demonic sect"));
          return tr(`Ma môn không hỏi linh căn, chỉ hỏi bạn có dám uống chén máu kia không. Bạn uống cạn, thành ${rankName(c)} Huyết Sát Môn. Ở đây muốn lên cao thì phải giẫm lên đồng môn.`, `The demonic sect doesn't ask about your spiritual root, only whether you dare drink that cup of blood. You drain it and become a ${rankName(c)} of Xuesha Sect. Here, to climb higher you must step on your fellow disciples.`);
        },
      },
      {
        label: tr('Lên Thiên Cơ Các', "Go up to Tianji Pavilion"),
        hint: tr('trung lập, kén người thông minh', "neutral, picky about brains"),
        lean: 'trung',
        run: (c, ctx) => {
          // Thiên Cơ Các không xem linh căn mà ra đề đố: ngộ tính càng cao bậc càng cao
          const rank = rankByWit(c.stats.ngoTinh);
          if (rank === 0 && ctx.rnd() >= 0.5) {
            addCult(c, 15);
            stat(c, 'ngoTinh', 5);
            return tr('Đề đố của Thiên Cơ Các bạn giải không nổi câu nào. Bạn về mua một cuốn công pháp rách ở chợ, tự mò mẫm làm tán tu.', "You can't solve a single one of Tianji Pavilion's riddles. You go home, buy a tattered manual at the market, and fumble along as a rogue cultivator.");
          }
          joinSect(c, tr('Thiên Cơ Các', "Tianji Pavilion"), rank);
          stat(c, 'ngoTinh', 5);
          addCult(c, 25 + rank * 20);
          ctx.fx(rank >= 2 ? 'breakthrough' : 'buy', rankName(c));
          if (rank === 3) return tr('Bạn giải xong cả ba đề đố trước khi nén nhang tàn. Các chủ Thiên Cơ Các tự tay nhận bạn làm truyền nhân. Tu luyện nhanh hơn 40%.', "You solve all three riddles before the incense stick burns out. The Pavilion Master of Tianji Pavilion personally takes you as successor. Cultivation 40% faster.");
          if (rank === 2) return tr('Bạn giải được hai trong ba đề đố. Thiên Cơ Các nhận bạn làm Thân truyền đệ tử, tu luyện nhanh hơn 25%.', "You solve two of the three riddles. Tianji Pavilion takes you as a personal disciple, cultivating 25% faster.");
          if (rank === 1) return tr('Bạn giải được một đề đố, thành Ký danh đệ tử Thiên Cơ Các. Ở đây không phân chính tà, chỉ hỏi bạn có đủ thông minh không.', "You solve one riddle and become a registered disciple of Tianji Pavilion. Here there's no righteous or evil, only whether you're clever enough.");
          return tr('Bạn không giải được đề nào, nhưng cách bạn nghĩ làm một trưởng lão để ý. Bạn được giữ lại làm Học đồ, quét bụi đài xem sao.', "You solve none of the riddles, but the way you think catches an elder's eye. You're kept on as an apprentice, dusting the stargazing tower.");
        },
      },
      {
        label: tr('Ở nhà phụng dưỡng cha mẹ', "Stay home and care for your parents"),
        lean: 'chinh',
        run: (c) => {
          dao(c, 6);
          money(c, 40);
          stat(c, 'tamCanh', 8);
          return tr('Bạn chọn ở lại. Mẹ bạn khóc vì mừng.', "You choose to stay. Your mother cries with joy.");
        },
      },
    ],
  },

  // ---------------- Kỳ ngộ thường gặp ----------------
  {
    id: 'lao_gia',
    minAge: 12,
    maxRealm: 4,
    cooldown: 30,
    weight: 12,
    title: tr('Kỳ ngộ', "Fortuitous encounter"),
    text: () => tr('Trong hang sau thác, bạn thấy một lão giả gầy gò bị thương, bên cạnh là chiếc hộp gỗ phát ánh tím.', "In a cave behind a waterfall, you find a gaunt, wounded old man beside a wooden box glowing violet."),
    choices: (c) => [
      {
        label: tr('Cứu lão giả', "Save the old man"),
        hint: (c.pills.hoi_xuan ?? 0) > 0 ? tr('-1 Hồi Xuân Đan', "-1 Rejuvenation Pill") : tr('-50 linh thạch thuốc men', "-50 spirit stones for medicine"),
        lean: 'chinh',
        run: (c, ctx) => {
          if (!usePill(c, 'hoi_xuan')) money(c, -50);
          dao(c, 10);
          if (ctx.rnd() < luck(c, 0.6)) {
            addCult(c, reward(c, 0.6));
            stat(c, 'ngoTinh', 6);
            ctx.fx('layer', tr('Được truyền công', "Power transmitted"));
            return tr('Lão giả là ẩn thế cao nhân. Ông truyền cho bạn một luồng chân khí rồi biến mất.', "The old man is a hidden master. He transmits a stream of true qi into you, then vanishes.");
          }
          return tr('Lão giả tỉnh lại, cảm tạ rồi lặng lẽ rời đi. Lòng bạn thấy nhẹ nhõm.', "The old man comes to, thanks you, and quietly leaves. Your heart feels light.");
        },
      },
      {
        label: tr('Lấy chiếc hộp rồi đi', "Take the box and go"),
        lean: 'ta',
        run: (c, ctx) => {
          dao(c, -8);
          money(c, 120);
          addPill(c, 'tu_khi', 2);
          ctx.fx('coin', '+120');
          return tr('Trong hộp có linh thạch và hai viên Tụ Khí Đan. Sau lưng, tiếng ho của lão giả nhỏ dần.', "Inside are spirit stones and two Qi Gathering Pills. Behind you, the old man's coughing fades away.");
        },
      },
      {
        label: tr('Hỏi chuyện đổi lấy chỉ điểm', "Trade conversation for pointers"),
        lean: 'trung',
        run: (c) => {
          stat(c, 'ngoTinh', 4);
          addCult(c, reward(c, 0.2));
          return tr('Lão giả chỉ cho bạn một chỗ sai trong công pháp rồi đuổi bạn đi.', "The old man points out one flaw in your technique, then shoos you away.");
        },
      },
      {
        label: tr('Kết liễu lão, hút tu vi', "Finish him, absorb his cultivation"),
        hint: tr('tà công', "evil technique"),
        lean: 'ta',
        run: (c, ctx) => {
          dao(c, -20);
          const f = fatal(c, ctx, 0.12, tr('Lão giả hồi quang phản chiếu, một chưởng đánh nát tâm mạch bạn. Bạn chết trong hang tối.', "With a final flare of life, the old man strikes your heart meridian to pieces. You die in the dark cave."));
          if (c.dead) return tr('Bạn vừa đặt tay lên huyệt Bách Hội của lão...', "You've just placed your hand on the crown of his head...") + f;
          stat(c, 'tamMa', 14);
          addCult(c, reward(c, 0.9));
          ctx.fx('evil', tr('Hút tu vi', "Cultivation absorbed"));
          c.enemy = c.enemy ?? tr('đệ tử của lão giả trong hang', "the disciple of the old man in the cave");
          return tr('Bạn hút sạch chân khí của lão. Tu vi tăng vọt, nhưng đêm nào cũng mơ thấy đôi mắt ấy.', "You drain every drop of his true qi. Your cultivation soars, but every night you dream of those eyes.");
        },
      },
    ],
  },
  {
    id: 'bi_canh',
    minRealm: 1,
    cooldown: 25,
    weight: 10,
    title: tr('Bí cảnh mở cửa', "Secret realm opens"),
    text: () => tr('Một bí cảnh thượng cổ vừa mở. Tu sĩ khắp nơi đổ về, ai cũng muốn tranh phần.', "An ancient secret realm has just opened. Cultivators pour in from everywhere, all eager for a share."),
    choices: () => [
      {
        label: tr('Xông vào tầng sâu nhất', "Charge into the deepest level"),
        hint: tr('thưởng lớn, rủi ro lớn', "big reward, big risk"),
        lean: 'trung',
        run: (c, ctx) => {
          if (ctx.rnd() < luck(c, 0.42)) {
            addCult(c, reward(c, 1.1));
            money(c, 200 * (c.realm + 1));
            ctx.fx('layer', tr('Đại cơ duyên', "Great fortune"));
            return tr('Bạn đoạt được truyền thừa ở tầng cuối. Tu vi tăng vọt!', "You seize the inheritance on the final level. Your cultivation soars!");
          }
          const f = fatal(c, ctx, 0.25, tr('Cấm chế thượng cổ bộc phát, nghiền bạn thành tro bụi giữa bí cảnh.', "An ancient restriction erupts and grinds you to dust in the secret realm."));
          if (c.dead) return tr('Bạn bước vào tầng cuối...', "You step into the final level...") + f;
          return tr('Cấm chế tầng sâu bộc phát, bạn trọng thương mới thoát ra được.', "A restriction on the deep level erupts. You barely escape, gravely wounded.") + (f ?? '') + hurt(c, 45, ctx);
        },
      },
      {
        label: tr('Đi vòng ngoài nhặt nhạnh', "Scavenge the outer areas"),
        lean: 'trung',
        run: (c) => {
          money(c, 60 * (c.realm + 1));
          addPill(c, 'tu_khi');
          return tr('Bạn nhặt được ít thảo dược và linh thạch. Không nhiều, nhưng an toàn.', "You pick up some herbs and spirit stones. Not much, but safe.");
        },
      },
      {
        label: tr('Lập nhóm, chia đều chiến lợi phẩm', "Form a party, split the loot evenly"),
        lean: 'chinh',
        run: (c, ctx) => {
          dao(c, 5);
          addCult(c, reward(c, 0.45));
          money(c, 90 * (c.realm + 1));
          ctx.fx('coin', tr('Chia đều', "Fair split"));
          return tr('Cả nhóm hợp sức phá trận, chia nhau công bằng. Bạn có thêm vài người bạn tốt.', "The party breaks the formation together and shares fairly. You make a few good friends.");
        },
      },
      {
        label: tr('Mai phục ở cửa ra, cướp đồ', "Ambush the exit, rob them"),
        lean: 'ta',
        run: (c, ctx) => {
          dao(c, -14);
          if (ctx.rnd() < luck(c, 0.6)) {
            money(c, 300 * (c.realm + 1));
            addCult(c, reward(c, 0.3));
            ctx.fx('coin', tr('Cướp được', "Robbed"));
            return tr('Bạn hạ gục ba kẻ đi ra cuối cùng và lấy hết túi trữ vật của chúng.', "You take down the last three to come out and grab all their storage pouches.");
          }
          c.enemy = c.enemy ?? tr('tông môn của kẻ bạn phục kích', "the sect of the one you ambushed");
          return tr('Kẻ bạn phục kích có trưởng bối hộ tống. Bạn bị đánh trọng thương.', "The one you ambushed had an elder escorting them. You're beaten half to death.") + hurt(c, 40, ctx);
        },
      },
    ],
  },
  {
    id: 'cuop_duong',
    minRealm: 1,
    cooldown: 15,
    weight: 10,
    title: tr('Chặn đường', "Highway robbery"),
    text: () => tr('Ba tên tán tu mặt mày hung tợn chặn đường, đòi bạn để lại túi trữ vật.', "Three fierce-looking rogue cultivators block the road and demand your storage pouch."),
    choices: (c) => [
      {
        label: tr('Rút vũ khí ra đánh', "Draw your weapon and fight"),
        lean: 'trung',
        run: (c, ctx) => {
          const bonus = hasItem(c, 'thanh_phong') || hasItem(c, 'huyet_dao') || c.path === 'kiem' ? 0.2 : 0;
          if (ctx.rnd() < luck(c, 0.5 + bonus)) {
            money(c, 80 * (c.realm + 1));
            stat(c, 'tamCanh', 3);
            return tr('Bạn đánh lui cả ba, còn thu được túi của chúng.', "You drive off all three and take their pouches to boot.");
          }
          const f = fatal(c, ctx, 0.15, tr('Một nhát đao chém ngang cổ. Bạn chết bên vệ đường, túi trữ vật bị lột sạch.', "A blade slashes across your throat. You die by the roadside, your storage pouch picked clean."));
          if (c.dead) return tr('Ba đánh một...', "Three against one...") + f;
          money(c, -c.linhThach * 0.4);
          return tr('Bạn thua, bị lột sạch gần nửa gia tài.', "You lose and get stripped of nearly half your fortune.") + (f ?? '') + hurt(c, 25, ctx);
        },
      },
      {
        label: tr('Nộp tiền mua bình an', "Pay for safe passage"),
        hint: tr(`-${Math.round(c.linhThach * 0.3)} linh thạch`, `-${Math.round(c.linhThach * 0.3)} spirit stones`),
        lean: 'trung',
        run: (c) => {
          money(c, -c.linhThach * 0.3);
          stat(c, 'tamMa', 4);
          return tr('Bạn ném túi linh thạch ra. Chúng cười khẩy rồi bỏ đi.', "You toss out a pouch of spirit stones. They sneer and leave.");
        },
      },
      {
        label: tr('Bỏ chạy', "Flee"),
        lean: 'trung',
        run: (c, ctx) => {
          if (ctx.rnd() < luck(c, 0.65)) return tr('Bạn thi triển thân pháp chạy thoát.', "You use your movement technique and escape.");
          return tr('Chạy không kịp, ăn trọn một chưởng sau lưng.', "Too slow - you take a full palm strike in the back.") + hurt(c, 18, ctx);
        },
      },
      {
        label: tr('Giả hàng, dụ vào bẫy giết sạch', "Feign surrender, lure them into a trap"),
        lean: 'ta',
        run: (c, ctx) => {
          dao(c, -10);
          stat(c, 'tamMa', 6);
          money(c, 150 * (c.realm + 1));
          ctx.fx('evil', tr('Giết sạch', "Wiped out"));
          return tr('Bạn quỳ xuống van xin, đợi chúng lại gần rồi kích nổ phù chú. Không ai sống sót.', "You kneel and beg, wait for them to come close, then detonate a talisman. No one survives.");
        },
      },
    ],
  },
  {
    id: 'dao_lu',
    minAge: 16,
    weight: 8,
    cooldown: 20,
    when: (c) => !c.partner,
    title: tr('Hữu duyên gặp gỡ', "A fated meeting"),
    text: (c) => tr(`Bên hồ sen, bạn gặp ${pick(Math.random, DAO_LU)}. Hai người trò chuyện từ chiều đến tận khi trăng lên.`, `By the lotus pond, you meet ${pick(Math.random, DAO_LU)}. The two of you talk from afternoon until the moon rises.`),
    choices: () => [
      {
        label: tr('Ngỏ lời kết làm đạo lữ', "Propose becoming Yao companions"),
        lean: 'chinh',
        run: (c, ctx) => {
          if (ctx.rnd() < luck(c, 0.55)) {
            c.partner = pick(ctx.rnd, DAO_LU);
            stat(c, 'tamCanh', 12);
            dao(c, 4);
            ctx.fx('love', tr('Kết đạo lữ', "Yao companions"));
            return tr(`Người ấy gật đầu. Từ nay bạn và ${c.partner} cùng nhau tu đạo.`, `They nod. From now on, you and ${c.partner} walk the Yao together.`);
          }
          stat(c, 'tamMa', 6);
          return tr('Người ấy mỉm cười từ chối. Đêm đó bạn không ngủ được.', "They smile and decline. You can't sleep that night.");
        },
      },
      {
        label: tr('Làm bạn đồng đạo', "Be fellow travelers on the Yao"),
        lean: 'trung',
        run: (c) => {
          stat(c, 'tamCanh', 6);
          stat(c, 'ngoTinh', 3);
          return tr('Hai người hẹn gặp lại để luận đạo. Bạn thấy đầu óc sáng ra.', "You agree to meet again to discuss the Yao. Your mind feels clearer.");
        },
      },
      {
        label: tr('Từ chối, chuyên tâm tu luyện', "Decline, focus on cultivation"),
        lean: 'trung',
        run: (c) => {
          addCult(c, reward(c, 0.2));
          return tr('Bạn lặng lẽ rời đi. Đại đạo không chỗ cho hồng trần.', "You quietly take your leave. The Great Yao has no room for mortal attachments.");
        },
      },
      {
        label: tr('Lợi dụng song tu, hút công lực', "Exploit dual cultivation to drain their power"),
        lean: 'ta',
        run: (c, ctx) => {
          dao(c, -16);
          const f = fatal(c, ctx, 0.12, tr('Đối phương là truyền nhân Hợp Hoan Tông, cao tay hơn bạn. Sáng hôm sau người ta thấy một cái xác khô.', "They're a successor of Hehuan Sect, far more skilled than you. The next morning, people find a withered corpse."));
          if (c.dead) return tr('Đêm đó...', "That night...") + f;
          stat(c, 'tamMa', 10);
          addCult(c, reward(c, 0.8));
          c.enemy = c.enemy ?? tr('người từng bị bạn lợi dụng', "someone you once exploited");
          ctx.fx('evil', tr('Thái âm bổ dương', "Yin nourishes yang"));
          return tr('Sáng hôm sau, người ấy tỉnh dậy với kinh mạch đứt đoạn. Bạn đã đi xa.', "The next morning, they wake with shattered meridians. You're long gone.");
        },
      },
    ],
  },
  {
    id: 'tam_ma',
    minRealm: 1,
    weight: 14,
    cooldown: 10,
    when: (c) => c.stats.tamMa >= 45,
    title: tr('Tâm ma quấy nhiễu', "Heart demon's whisper"),
    text: () => tr('Đang tĩnh tọa, bạn nghe thấy giọng nói của chính mình thì thầm: "Sao phải khổ thế? Buông ra đi..."', "As you meditate, you hear your own voice whispering: \"Why suffer so? Just let go...\""),
    choices: (c) => [
      {
        label: tr('Đối mặt, trảm tâm ma', "Face it, slay the heart demon"),
        lean: 'chinh',
        run: (c, ctx) => {
          if (ctx.rnd() < 0.35 + c.stats.tamCanh / 200) {
            stat(c, 'tamMa', -30);
            stat(c, 'tamCanh', 10);
            ctx.fx('heal', tr('Tâm sáng', "Clear mind"));
            return tr('Bạn nhìn thẳng vào nó. Nó tan biến như sương sớm.', "You stare it down. It dissolves like morning mist.");
          }
          stat(c, 'tamMa', 8);
          return tr('Tâm ma mạnh hơn bạn nghĩ. Bạn nôn ra một ngụm máu.', "The heart demon is stronger than you thought. You cough up a mouthful of blood.") + hurt(c, 15, ctx);
        },
      },
      {
        label: tr('Uống Thanh Tâm Đan', "Take a Heart Clearing Pill"),
        hint: (c.pills.thanh_tam ?? 0) > 0 ? tr(`còn ${c.pills.thanh_tam}`, `${c.pills.thanh_tam} left`) : tr('không có, mua gấp -150', "none, rush-buy -150"),
        lean: 'trung',
        run: (c, ctx) => {
          if (!usePill(c, 'thanh_tam')) money(c, -150);
          stat(c, 'tamMa', -25);
          ctx.fx('heal', tr('Thanh tâm', "Heart cleared"));
          return tr('Dược lực mát lạnh lan khắp người. Giọng nói kia im bặt.', "A cool medicinal force spreads through your body. The voice falls silent.");
        },
      },
      {
        label: tr('Tìm chùa nghe kinh', "Seek a temple and hear sutras"),
        lean: 'chinh',
        run: (c) => {
          dao(c, 8);
          stat(c, 'tamMa', -18);
          return tr('Bạn ở lại chùa Vân Tịch ba tháng. Tiếng chuông sớm làm lòng an.', "You stay at Yun Xi Temple for three months. The morning bell brings your heart peace.");
        },
      },
      {
        label: tr('Buông theo nó', "Give in to it"),
        hint: tr('tu vi tăng, tâm ma tăng, nguy hiểm', "cultivation up, heart demon up, dangerous"),
        lean: 'ta',
        run: (c, ctx) => {
          const f = fatal(c, ctx, 0.15, tr('Chân khí nghịch hành, kinh mạch nổ tung. Bạn tẩu hỏa nhập ma mà chết.', "Your true qi flows in reverse and your meridians burst. You die of qi deviation."));
          if (c.dead) return tr('Bạn buông lỏng tâm thần...', "You let your mind go slack...") + f;
          dao(c, -12);
          stat(c, 'tamMa', 15);
          addCult(c, reward(c, 0.7));
          ctx.fx('evil', tr('Nhập ma', "Fallen to demons"));
          return tr('Bạn mở mắt. Đồng tử đỏ rực. Sức mạnh chưa bao giờ đến dễ như vậy.', "You open your eyes. Your pupils glow red. Power has never come so easily.");
        },
      },
    ],
  },
  {
    id: 'tien_dan_gia',
    minAge: 14,
    weight: 8,
    cooldown: 20,
    title: tr('Phường thị', "Market"),
    text: () => tr('Một ông lão bày sạp, rao bán "tiên đan trường sinh" chỉ với 100 linh thạch một viên.', "An old man at a stall hawks \"immortal longevity pills\" for just 100 spirit stones each."),
    choices: () => [
      {
        label: tr('Mua một viên', "Buy one"),
        hint: '-100',
        lean: 'trung',
        run: (c, ctx) => {
          money(c, -100);
          const f = fatal(c, ctx, 0.08, tr('Viên đan là Hạc Đỉnh Hồng. Bạn thất khiếu chảy máu mà chết ngay giữa phường thị.', "The pill is crane-crest red poison. You bleed from all seven orifices and die in the middle of the Market."));
          if (c.dead) return tr('Bạn nuốt viên đan...', "You swallow the pill...") + f;
          if (ctx.rnd() < 0.2) {
            addLife(c, 15);
            ctx.fx('heal', tr('+15 thọ', "+15 lifespan"));
            return tr('Không ngờ là đan thật! Thọ nguyên tăng 15 năm.', "Who knew - it's real! Lifespan +15 years.");
          }
          return tr('Viên đan là bột mì vo tròn. Bạn bị lừa.', "The pill is a ball of rolled flour. You've been scammed.");
        },
      },
      {
        label: tr('Mặc cả xuống 20', "Haggle down to 20"),
        lean: 'trung',
        run: (c) => {
          money(c, -20);
          stat(c, 'khiVan', 2);
          return tr('Ông lão chửi bạn keo kiệt nhưng vẫn bán. Viên đan ăn khá ngon.', "The old man calls you a cheapskate but sells anyway. The pill tastes pretty good.");
        },
      },
      {
        label: tr('Vạch trần trước đám đông', "Expose him in front of the crowd"),
        lean: 'chinh',
        run: (c) => {
          dao(c, 6);
          stat(c, 'tamCanh', 4);
          money(c, 30);
          return tr('Mọi người cảm ơn bạn, có người còn biếu bạn ít linh thạch.', "Everyone thanks you, and someone even gives you a few spirit stones.");
        },
      },
      {
        label: tr('Lừa lại lão, đổi linh thạch giả', "Scam him back with fake spirit stones"),
        lean: 'ta',
        run: (c) => {
          dao(c, -6);
          money(c, 80);
          return tr('Bạn trả bằng linh thạch giả rồi chuồn. Kẻ lừa đảo bị lừa.', "You pay with fake spirit stones and bolt. The scammer gets scammed.");
        },
      },
    ],
  },
  {
    id: 'yeu_thu_con',
    minAge: 12,
    weight: 8,
    once: true,
    title: tr('Yêu thú nhỏ', "Little demon beast"),
    text: () => tr('Trong bụi rậm, một con hồ ly trắng bé xíu bị kẹp chân, rên ư ử nhìn bạn.', "In the bushes, a tiny white fox with its leg caught in a trap whimpers up at you."),
    choices: () => [
      {
        label: tr('Nhận nuôi', "Adopt it"),
        lean: 'chinh',
        run: (c, ctx) => {
          c.pet = true;
          c.petKind = 'tuyet_ho';
          dao(c, 6);
          stat(c, 'tamCanh', 6);
          ctx.fx('love', tr('Có linh thú', "Got a spirit beast"));
          return tr('Tiểu hồ ly liếm tay bạn. Từ đó nó đi theo bạn khắp nơi.', "The little fox licks your hand. From then on it follows you everywhere.");
        },
      },
      {
        label: tr('Gỡ bẫy rồi thả đi', "Free it and let it go"),
        lean: 'chinh',
        run: (c) => {
          dao(c, 4);
          stat(c, 'khiVan', 6);
          return tr('Nó chạy mất, ngoái lại nhìn bạn một lần. Bạn có cảm giác sẽ gặp lại.', "It runs off, glancing back at you once. You feel you'll meet again.");
        },
      },
      {
        label: tr('Bắt mang bán', "Catch it to sell"),
        lean: 'trung',
        run: (c) => {
          money(c, 90);
          dao(c, -3);
          return tr('Thương nhân trả 90 linh thạch cho một con hồ ly trắng hiếm.', "A merchant pays 90 spirit stones for a rare white fox.");
        },
      },
      {
        label: tr('Giết lấy yêu đan', "Kill it for its demon core"),
        lean: 'ta',
        run: (c, ctx) => {
          dao(c, -10);
          addCult(c, reward(c, 0.35));
          ctx.fx('evil');
          return tr('Yêu đan nhỏ xíu nhưng tinh thuần. Bạn nuốt nó.', "The demon core is tiny but pure. You swallow it.");
        },
      },
    ],
  },
  {
    id: 'lang_dich',
    minRealm: 1,
    weight: 7,
    cooldown: 40,
    title: tr('Ôn dịch', "Plague"),
    text: () => tr('Một ngôi làng dưới núi bị ôn dịch. Người chết nằm la liệt, kẻ sống kêu cứu.', "A village at the foot of the mountain is struck by plague. The dead lie everywhere; the living cry for help."),
    choices: () => [
      {
        label: tr('Ở lại chữa bệnh miễn phí', "Stay and treat them for free"),
        lean: 'chinh',
        run: (c, ctx) => {
          const f = fatal(c, ctx, c.realm >= 2 ? 0.03 : 0.12, tr('Bạn cứu được nửa làng thì nhiễm ôn dịch. Dân làng chôn bạn dưới gốc đa đầu làng.', "You save half the village before catching the plague yourself. The villagers bury you under the banyan at the village gate."));
          if (c.dead) return tr('Ngày thứ ba mươi, bạn bắt đầu sốt cao...', "On the thirtieth day, a high fever sets in...") + f;
          dao(c, 15);
          money(c, -60);
          stat(c, 'tamCanh', 10);
          ctx.fx('heal', tr('Công đức', "Merit"));
          return tr('Ba tháng không ngủ, bạn cứu được gần hết làng. Dân lập bia tạ ơn.', "Three months without sleep, you save nearly the whole village. They raise a stele in your honor.");
        },
      },
      {
        label: tr('Bán thuốc giá cao', "Sell medicine at a steep price"),
        lean: 'trung',
        run: (c) => {
          dao(c, -4);
          money(c, 200);
          return tr('Người ta bán cả ruộng để mua thuốc của bạn.', "People sell their fields to buy your medicine.");
        },
      },
      {
        label: tr('Đi đường vòng, tránh lây', "Detour to avoid infection"),
        lean: 'trung',
        run: (c) => {
          stat(c, 'tamMa', 3);
          return tr('Bạn bịt mũi đi qua. Tiếng khóc đuổi theo cả đoạn đường.', "You hold your nose and pass by. The wailing follows you down the road.");
        },
      },
      {
        label: tr('Gom người hấp hối luyện huyết đan', "Gather the dying to refine blood pills"),
        lean: 'ta',
        run: (c, ctx) => {
          dao(c, -25);
          stat(c, 'tamMa', 15);
          addCult(c, reward(c, 1.2));
          addPill(c, 'tu_khi', 3);
          ctx.fx('evil', tr('Huyết đan', "Blood pill"));
          c.enemy = c.enemy ?? tr('người sống sót ở làng dịch', "survivors of the plague village");
          return tr('Lò luyện cháy suốt bảy ngày. Tu vi bạn tăng vọt.', "The furnace burns for seven days. Your cultivation soars.");
        },
      },
    ],
  },
  {
    id: 'dau_gia',
    minRealm: 2,
    weight: 7,
    cooldown: 20,
    title: tr('Đấu giá hội', "Auction"),
    text: () => tr('Vạn Bảo Lâu mở đấu giá. Món chốt là một viên Diên Thọ Đan và một pháp bảo cổ.', "Wanbao Tower opens an auction. The headline lots are a Longevity Pill and an ancient magic treasure."),
    choices: (c) => [
      {
        label: tr('Đấu Diên Thọ Đan', "Bid on the Longevity Pill"),
        hint: '-600',
        lean: 'trung',
        run: (c, ctx) => {
          if (c.linhThach < 600) return tr('Không đủ linh thạch, bạn chỉ biết nhìn người khác giơ bảng.', "Not enough spirit stones. You can only watch others raise their paddles.");
          money(c, -600);
          addLife(c, Math.round(c.lifespan * 0.12));
          ctx.fx('heal', tr('+thọ nguyên', "+lifespan"));
          return tr('Bạn thắng giá. Uống vào, tóc mai bạc trở lại đen nhánh.', "You win the bid. You swallow it, and your graying temples turn jet black again.");
        },
      },
      {
        label: tr('Đấu pháp bảo cổ', "Bid on the ancient treasure"),
        hint: '-800',
        lean: 'trung',
        run: (c, ctx) => {
          if (c.linhThach < 800) return tr('Không đủ linh thạch.', "Not enough spirit stones.");
          money(c, -800);
          stat(c, 'khiVan', 10);
          addCult(c, reward(c, 0.5));
          ctx.fx('buy', tr('Pháp bảo', "Magic treasure"));
          return tr('Pháp bảo tự nhận chủ. Bạn cảm nhận được linh tính của nó.', "The treasure binds itself to you. You can sense its spirit.");
        },
      },
      {
        label: tr('Chỉ xem, không mua', "Just watch, don't buy"),
        lean: 'trung',
        run: (c) => {
          stat(c, 'ngoTinh', 2);
          return tr('Bạn mở mang tầm mắt, biết thêm vài loại thiên tài địa bảo.', "Your eyes are opened - you learn about a few more heavenly treasures.");
        },
      },
      {
        label: tr('Theo dõi người thắng giá, cướp', "Tail the winner and rob them"),
        lean: 'ta',
        run: (c, ctx) => {
          dao(c, -14);
          if (ctx.rnd() < luck(c, 0.45)) {
            addLife(c, Math.round(c.lifespan * 0.12));
            ctx.fx('evil', tr('Cướp đan', "Pill stolen"));
            return tr('Bạn chặn hắn ở ngoài thành. Diên Thọ Đan giờ là của bạn.', "You intercept them outside the city. The Longevity Pill is yours now.");
          }
          c.enemy = c.enemy ?? tr('Vạn Bảo Lâu', "Wanbao Tower");
          return tr('Hắn có hộ vệ Kim Đan. Bạn suýt chết.', "They have a Golden Core bodyguard. You nearly die.") + hurt(c, 50, ctx);
        },
      },
    ],
  },
  {
    id: 'dong_mon',
    minRealm: 1,
    weight: 8,
    cooldown: 25,
    when: (c) => !!c.sect,
    title: tr('Đồng môn hãm hại', "Framed by a fellow disciple"),
    text: (c) => tr(`Một sư huynh trong ${c.sect} ghen tị, vu cho bạn trộm đan dược của trưởng lão.`, `A jealous senior brother in ${nameOf(c.sect)} accuses you of stealing an elder's pills.`),
    choices: () => [
      {
        label: tr('Trình bày, xin trưởng lão điều tra', "Explain, ask the elder to investigate"),
        lean: 'chinh',
        run: (c, ctx) => {
          if (ctx.rnd() < luck(c, 0.6)) {
            dao(c, 4);
            stat(c, 'tamCanh', 5);
            return tr('Trưởng lão minh xét. Sư huynh kia bị phạt diện bích.', "The elder sees the truth. That senior brother is sentenced to face the wall.");
          }
          stat(c, 'tamMa', 8);
          addCult(c, -reward(c, 0.2));
          return tr('Không ai tin bạn. Bạn bị phạt quỳ ba ngày.', "No one believes you. You're made to kneel for three days.");
        },
      },
      {
        label: tr('Nhịn cho qua', "Let it go"),
        lean: 'trung',
        run: (c) => {
          stat(c, 'tamMa', 8);
          stat(c, 'tamCanh', 3);
          return tr('Bạn bị phạt thay. Nhẫn một chút sóng yên biển lặng.', "You take the punishment in his place. Bend a little, and the storm passes.");
        },
      },
      {
        label: tr('Thách đấu lôi đài', "Challenge him in the Arena"),
        lean: 'trung',
        run: (c, ctx) => {
          if (ctx.rnd() < luck(c, 0.5)) {
            stat(c, 'tamCanh', 8);
            money(c, 100);
            return tr('Bạn thắng đẹp trước mặt cả môn phái.', "You win beautifully in front of the whole sect.");
          }
          return tr('Bạn thua.', "You lose.") + hurt(c, 20, ctx);
        },
      },
      {
        label: tr('Bỏ độc vào trà của hắn', "Poison his tea"),
        lean: 'ta',
        run: (c, ctx) => {
          dao(c, -15);
          stat(c, 'tamMa', 8);
          ctx.fx('evil');
          return tr('Sư huynh "tẩu hỏa nhập ma" mà chết. Không ai nghi ngờ bạn.', "The senior brother \"dies of qi deviation\". No one suspects you.");
        },
      },
    ],
  },
  {
    id: 'ke_thu',
    minAge: 18,
    weight: 10,
    cooldown: 50,
    when: (c) => !!c.enemy,
    title: tr('Oan gia tìm tới', "An old enemy arrives"),
    text: (c) => tr(`Một bóng người chặn trước động phủ. Là ${c.enemy}. "Nợ cũ, hôm nay tính cho xong."`, `A figure blocks your cave dwelling. It's ${c.enemy}. "Old debts get settled today."`),
    choices: () => [
      {
        label: tr('Nhận lỗi, đền bù', "Admit fault, pay reparations"),
        hint: tr('-40% linh thạch', "-40% spirit stones"),
        lean: 'chinh',
        run: (c) => {
          money(c, -c.linhThach * 0.4);
          dao(c, 10);
          c.enemy = null;
          stat(c, 'tamMa', -10);
          return tr('Bạn cúi đầu nhận sai. Đối phương im lặng rất lâu, rồi quay đi.', "You bow your head and admit your wrong. Your foe is silent for a long time, then turns away.");
        },
      },
      {
        label: tr('Quyết chiến', "Fight to the death"),
        lean: 'trung',
        run: (c, ctx) => {
          if (ctx.rnd() < luck(c, 0.5)) {
            c.enemy = null;
            stat(c, 'tamCanh', 6);
            return tr('Một trận long trời lở đất. Bạn thắng, ân oán chấm dứt.', "A battle that shakes heaven and earth. You win, and the feud is over.");
          }
          const f = fatal(c, ctx, 0.3, tr(`Bạn chết dưới tay ${c.enemy}. Nợ cũ, cuối cùng cũng trả bằng mạng.`, `You die at the hands of ${c.enemy}. The old debt is finally paid in blood.`));
          if (c.dead) return tr('Một trận long trời lở đất...', "A battle that shakes heaven and earth...") + f;
          return tr('Bạn thua, phải bỏ động phủ chạy trốn.', "You lose and must abandon your cave dwelling and flee.") + (f ?? '') + hurt(c, 45, ctx);
        },
      },
      {
        label: tr('Bày trận rồi trốn đi xa', "Lay a formation and flee far away"),
        lean: 'trung',
        run: (c, ctx) => {
          if (ctx.rnd() < 0.7 || c.path === 'tran') return tr('Bạn để lại trận pháp cầm chân rồi biến mất. Hắn sẽ còn tìm.', "You leave a binding formation behind and vanish. He'll keep searching.");
          return tr('Trận bị phá.', "The formation is broken.") + hurt(c, 25, ctx);
        },
      },
      {
        label: tr('Giết, rồi diệt cả sư môn hắn', "Kill him, then wipe out his whole sect"),
        lean: 'ta',
        run: (c, ctx) => {
          dao(c, -20);
          stat(c, 'tamMa', 12);
          if (ctx.rnd() < luck(c, 0.55)) {
            c.enemy = null;
            addCult(c, reward(c, 0.4));
            ctx.fx('evil', tr('Diệt môn', "Sect annihilated"));
            return tr('Đêm đó, cả một sơn môn chìm trong biển lửa.', "That night, an entire mountain sect is swallowed by a sea of fire.");
          }
          return tr('Hắn có viện binh.', "He has reinforcements.") + hurt(c, 55, ctx);
        },
      },
    ],
  },
  {
    id: 'tre_lac',
    minAge: 18,
    weight: 6,
    cooldown: 30,
    title: tr('Đứa trẻ lạc', "Lost child"),
    text: () => tr('Một đứa bé chừng năm tuổi lạc trong rừng, ôm chân bạn khóc gọi mẹ.', "A child of about five, lost in the forest, clings to your leg crying for Mama."),
    choices: (c) => [
      {
        label: tr('Đưa bé về tận nhà', "Take the child all the way home"),
        lean: 'chinh',
        run: (c) => {
          dao(c, 8);
          stat(c, 'tamCanh', 5);
          stat(c, 'khiVan', 3);
          return tr('Mẹ đứa bé quỳ lạy cảm tạ. Bạn thấy vui lạ.', "The child's mother kowtows in gratitude. You feel oddly happy.");
        },
      },
      {
        label: c.realm >= 3 ? tr('Nhận làm đồ đệ', "Take them as a disciple") : tr('Cho ít bánh rồi chỉ đường', "Give some cake and point the way"),
        lean: 'chinh',
        run: (c) => {
          dao(c, 5);
          if (c.realm >= 3) {
            stat(c, 'tamCanh', 10);
            const n = (c.qf?.deTu ?? 0) + 1;
            c.qf = { ...(c.qf ?? {}), deTu: n };
            const SO = ['', tr('đầu tiên', "first"), tr('thứ hai', "second"), tr('thứ ba', "third"), tr('thứ tư', "fourth"), tr('thứ năm', "fifth"), tr('thứ sáu', "sixth"), tr('thứ bảy', "seventh"), tr('thứ tám', "eighth"), tr('thứ chín', "ninth"), tr('thứ mười', "tenth")];
            return n === 1 ? tr('Đứa bé có linh căn không tệ. Bạn có đồ đệ đầu tiên.', "The child has a decent spiritual root. You have your first disciple.") : tr(`Đứa bé có linh căn không tệ. Bạn nhận nó làm đồ đệ ${SO[n] ?? tr(`thứ ${n}`, `${n}th`)}, môn hạ ngày một đông.`, `The child has a decent spiritual root. You take them as your ${SO[n] ?? tr(`thứ ${n}`, `${n}th`)} disciple - your following grows by the day.`);
          }
          return tr('Đứa bé cầm bánh, đi theo hướng bạn chỉ.', "The child takes the cake and heads the way you pointed.");
        },
      },
      {
        label: tr('Kệ nó, đường ai nấy đi', "Ignore it, go your own way"),
        lean: 'trung',
        run: (c) => {
          stat(c, 'tamMa', 4);
          return tr('Tiếng khóc nhỏ dần sau lưng bạn.', "The crying fades behind you.");
        },
      },
      {
        label: tr('Bán cho ma môn làm dược nhân', "Sell them to a demonic sect as a medicine vessel"),
        lean: 'ta',
        run: (c) => {
          dao(c, -22);
          money(c, 300);
          stat(c, 'tamMa', 12);
          return tr('Ma môn trả giá cao cho trẻ có thể chất thuần âm.', "The demonic sect pays well for children with pure-yin constitutions.");
        },
      },
    ],
  },
  {
    id: 'lu_lut',
    minAge: 14,
    weight: 6,
    cooldown: 40,
    title: tr('Lũ quét', "Flash flood"),
    text: () => tr('Mưa liền bảy ngày. Đê vỡ, nước cuồn cuộn đổ về thị trấn dưới chân núi.', "Seven days of rain. The levee breaks, and water surges toward the town below the mountain."),
    choices: (c) => [
      {
        label: tr('Lao xuống cứu người', "Dive in to save people"),
        lean: 'chinh',
        run: (c, ctx) => {
          dao(c, 12);
          stat(c, 'tamCanh', 8);
          if (ctx.rnd() < 0.35) return tr('Bạn cứu được hàng chục người nhưng bị gỗ đập trúng.', "You save dozens of people but get struck by floating timber.") + hurt(c, 25, ctx);
          return tr('Bạn cứu được hàng chục người.', "You save dozens of people.");
        },
      },
      {
        label: c.realm >= 2 ? tr('Bày trận chặn lũ', "Lay a formation to hold back the flood") : tr('Giúp đắp đê', "Help shore up the levee"),
        lean: 'chinh',
        run: (c, ctx) => {
          dao(c, 10);
          if (c.realm >= 2) {
            addCult(c, reward(c, 0.3));
            ctx.fx('layer', tr('Ngộ trận đạo', "Formation insight"));
            return tr('Trận pháp chặn dòng nước. Giữa lúc ấy bạn ngộ ra điều gì đó.', "The formation holds back the water. In that moment, something clicks for you.");
          }
          stat(c, 'sucKhoe', 5);
          return tr('Bạn cùng dân làng đắp đê suốt đêm.', "You shore up the levee with the villagers all night.");
        },
      },
      {
        label: tr('Chạy lên núi giữ mình', "Flee up the mountain to save yourself"),
        lean: 'trung',
        run: (c) => {
          stat(c, 'tamMa', 3);
          return tr('Bạn an toàn. Thị trấn thì không.', "You're safe. The town isn't.");
        },
      },
      {
        label: tr('Nhân lúc hỗn loạn cướp kho lương', "Loot the granary in the chaos"),
        lean: 'ta',
        run: (c, ctx) => {
          dao(c, -12);
          money(c, 160);
          ctx.fx('coin', '+160');
          return tr('Bạn vác đi hai bao bạc của nhà quan. Không ai rảnh để đuổi theo.', "You haul off two bags of silver from the magistrate's house. No one has time to give chase.");
        },
      },
    ],
  },
  {
    id: 'tuu_tien',
    minAge: 18,
    weight: 6,
    cooldown: 30,
    title: tr('Tửu tiên', "Wine immortal"),
    text: () => tr('Một gã say khướt ngồi trên mái quán rượu, ném cho bạn hồ lô: "Uống với ta một chén!"', "A drunkard sitting on the tavern roof tosses you a gourd: \"Have a cup with me!\""),
    choices: () => [
      {
        label: tr('Uống tới bến', "Drink till you drop"),
        lean: 'trung',
        run: (c, ctx) => {
          if (ctx.rnd() < luck(c, 0.5)) {
            stat(c, 'ngoTinh', 12);
            addCult(c, reward(c, 0.4));
            giveItem(c, 'ho_lo');
            ctx.fx('layer', tr('Say mà ngộ', "Drunken enlightenment"));
            return tr('Say ba ngày ba đêm, tỉnh dậy thấy công pháp thông suốt. Gã kia để lại cho bạn cái hồ lô.', "Drunk for three days and nights, you wake to find your technique flowing freely. The man left you his gourd.");
          }
          const f = fatal(c, ctx, 0.05, tr('Rượu là Túy Tiên Nhưỡng ngàn năm, phàm thân không chịu nổi. Bạn say mà chết, mặt vẫn còn cười.', "The wine is thousand-year Immortal-Drunk Brew, too much for a mortal body. You drink yourself to death, still smiling."));
          if (c.dead) return tr('Chén thứ chín...', "The ninth cup...") + f;
          stat(c, 'sucKhoe', -10);
          return tr('Bạn say mềm, tỉnh dậy không nhớ gì.', "You get blind drunk and wake remembering nothing.");
        },
      },
      {
        label: tr('Uống một chén lấy lệ', "Have one cup to be polite"),
        lean: 'trung',
        run: (c) => {
          stat(c, 'tamCanh', 4);
          return tr('Rượu ngon. Gã cười ha hả, kể chuyện tu tiên ngàn năm trước.', "Good wine. The man roars with laughter and tells tales of cultivation from a thousand years ago.");
        },
      },
      {
        label: tr('Từ chối, khuyên hắn bớt say', "Decline, tell him to drink less"),
        lean: 'chinh',
        run: (c) => {
          dao(c, 3);
          return tr('Gã nhìn bạn như nhìn đứa ngốc rồi biến mất trong gió.', "He looks at you like you're an idiot and vanishes into the wind.");
        },
      },
      {
        label: tr('Chuốc say rồi lục túi', "Get him drunk and rifle his pouch"),
        lean: 'ta',
        run: (c, ctx) => {
          dao(c, -8);
          if (ctx.rnd() < 0.4) {
            money(c, 500);
            return tr('Túi của hắn đầy linh thạch thượng phẩm!', "His pouch is full of top-grade spirit stones!");
          }
          return tr('Hắn mở một mắt nhìn bạn rồi búng tay. Bạn bay xuống sông.', "He opens one eye, looks at you, and flicks a finger. You go flying into the river.") + hurt(c, 20, ctx);
        },
      },
    ],
  },
  {
    id: 'ho_tong',
    minAge: 16,
    weight: 6,
    cooldown: 15,
    when: (c) => c.focus === 'kiem_tien',
    title: tr('Thương đoàn', "Merchant caravan"),
    text: () => tr('Một thương đoàn lớn thuê người hộ tống qua Hắc Phong Lĩnh, nơi nhiều yêu thú.', "A large caravan is hiring guards for the trip through Heifeng Ridge, crawling with demon beasts."),
    choices: () => [
      {
        label: tr('Nhận việc', "Take the job"),
        hint: tr('+linh thạch', "+spirit stones"),
        lean: 'trung',
        run: (c, ctx) => {
          money(c, 120 * (c.realm + 1));
          if (ctx.rnd() < 0.25) return tr('Gặp yêu thú, bạn bảo vệ thương đoàn an toàn nhưng bị thương.', "Demon beasts attack. You keep the caravan safe but get wounded.") + hurt(c, 15, ctx);
          return tr('Chuyến đi êm xuôi. Ông chủ thưởng hậu.', "The trip goes smoothly. The boss pays a generous bonus.");
        },
      },
      {
        label: tr('Đòi gấp đôi tiền công', "Demand double pay"),
        lean: 'trung',
        run: (c, ctx) => {
          if (ctx.rnd() < 0.5) {
            money(c, 240 * (c.realm + 1));
            return tr('Ông chủ cắn răng đồng ý.', "The boss grits his teeth and agrees.");
          }
          return tr('Ông chủ thuê người khác.', "The boss hires someone else.");
        },
      },
      {
        label: tr('Giới thiệu bạn nghèo đi thay', "Recommend a poor friend instead"),
        lean: 'chinh',
        run: (c) => {
          dao(c, 5);
          stat(c, 'khiVan', 4);
          return tr('Người bạn ấy kiếm được tiền chữa bệnh cho mẹ. Sau này nhớ ơn bạn.', "Your friend earns enough to pay for his mother's treatment, and never forgets your kindness.");
        },
      },
      {
        label: tr('Nhận việc, giữa đường cướp luôn', "Take the job, rob them halfway"),
        lean: 'ta',
        run: (c, ctx) => {
          dao(c, -15);
          money(c, 500 * (c.realm + 1));
          ctx.fx('coin', tr('Cướp hàng', "Cargo stolen"));
          c.enemy = c.enemy ?? tr('thương hội Vạn Phúc', "the Wanfu Merchant Guild");
          return tr('Đến giữa Hắc Phong Lĩnh, bạn ra tay. Hàng hóa giờ là của bạn.', "Deep in Heifeng Ridge, you make your move. The cargo is yours now.");
        },
      },
    ],
  },
  {
    id: 'lao_tang',
    minAge: 10,
    weight: 6,
    cooldown: 30,
    when: (c) => c.daoTam > 10,
    title: tr('Lão tăng hóa duyên', "Alms-seeking monk"),
    text: () => tr('Một lão tăng áo cà sa bạc màu dừng trước cửa, chắp tay xin một bát cơm.', "An old monk in a faded robe stops at your door, palms together, asking for a bowl of rice."),
    choices: () => [
      {
        label: tr('Mời vào, dâng cơm chay', "Invite him in for a vegetarian meal"),
        lean: 'chinh',
        run: (c) => {
          dao(c, 6);
          stat(c, 'tamMa', -10);
          return tr('Lão tăng ăn xong, gõ nhẹ lên trán bạn ba cái rồi đi.', "When he finishes eating, the old monk taps your forehead three times, then leaves.");
        },
      },
      {
        label: tr('Xin nghe giảng kinh', "Ask to hear a sermon"),
        lean: 'chinh',
        run: (c) => {
          stat(c, 'ngoTinh', 5);
          stat(c, 'tamCanh', 6);
          return tr('Lão giảng một đoạn kinh Kim Cương. Bạn nghe mà như mở cửa sổ trong lòng.', "He expounds a passage of the Diamond Sutra. It's like a window opening in your heart.");
        },
      },
      {
        label: tr('Cho ít tiền rồi đóng cửa', "Give some money and shut the door"),
        lean: 'trung',
        run: (c) => {
          money(c, -10);
          return tr('Lão nhận tiền, niệm một câu A Di Đà Phật.', "He takes the money and murmurs, \"Amitabha.\"");
        },
      },
      {
        label: tr('Đuổi đi', "Chase him off"),
        lean: 'ta',
        run: (c) => {
          dao(c, -5);
          return tr('Lão tăng không giận, chỉ cười rồi bỏ đi.', "The old monk isn't angry. He just smiles and walks away.");
        },
      },
    ],
  },
  {
    id: 'huyet_te',
    minRealm: 1,
    weight: 9,
    cooldown: 40,
    when: (c) => c.daoTam < -20,
    title: tr('Huyết tế', "Blood sacrifice"),
    text: () => tr('Người áo đen trao cho bạn tấm thiệp đỏ: đêm trăng tròn, ma môn mở đại lễ huyết tế. Ai tham gia sẽ được chia huyết tinh.', "A man in black hands you a red invitation: on the full moon, a demonic sect holds a grand blood sacrifice. Participants get a share of the blood essence."),
    choices: () => [
      {
        label: tr('Tham gia huyết tế', "Join the sacrifice"),
        lean: 'ta',
        run: (c, ctx) => {
          dao(c, -20);
          stat(c, 'tamMa', 15);
          addCult(c, reward(c, 1.3));
          ctx.fx('evil', tr('Huyết tế', "Blood sacrifice"));
          return tr('Máu chảy thành sông. Bạn hấp thụ phần huyết tinh của mình.', "Blood flows like a river. You absorb your share of blood essence.");
        },
      },
      {
        label: tr('Báo tin cho chính đạo', "Tip off the Righteous Path"),
        lean: 'chinh',
        run: (c, ctx) => {
          dao(c, 18);
          money(c, 300);
          if (ctx.rnd() < 0.3) {
            c.enemy = c.enemy ?? tr('ma môn bị bạn phản bội', "the demonic sect you betrayed");
            return tr('Chính đạo phá được buổi lễ. Ma môn biết kẻ báo tin là bạn.', "The Righteous Path breaks up the ritual. The demonic sect learns you were the informant.");
          }
          return tr('Chính đạo phá được buổi lễ và thưởng bạn hậu hĩnh.', "The Righteous Path breaks up the ritual and rewards you handsomely.");
        },
      },
      {
        label: tr('Từ chối khéo', "Politely decline"),
        lean: 'trung',
        run: (c) => {
          stat(c, 'tamMa', -3);
          return tr('Bạn viện cớ bế quan. Người áo đen nhìn bạn đầy ý vị.', "You plead closed-door cultivation. The man in black gives you a meaningful look.");
        },
      },
      {
        label: tr('Giả vờ tham gia rồi phá lễ', "Pretend to join, then wreck the ritual"),
        lean: 'chinh',
        run: (c, ctx) => {
          if (ctx.rnd() < luck(c, 0.45)) {
            dao(c, 25);
            addCult(c, reward(c, 0.5));
            ctx.fx('heal', tr('Cứu người', "Lives saved"));
            return tr('Bạn phá tế đàn, cứu được hàng trăm người bị bắt.', "You smash the altar and free hundreds of captives.");
          }
          const f = fatal(c, ctx, 0.3, tr('Bạn bị phát hiện, bị trói lên tế đàn và luyện thành huyết nô.', "You're discovered, bound to the altar, and refined into a blood slave."));
          if (c.dead) return tr('Giữa buổi lễ...', "Mid-ritual...") + f;
          c.enemy = c.enemy ?? tr('Huyết Sát Môn', "Xuesha Sect");
          return tr('Bạn bị phát hiện.', "You're discovered.") + (f ?? '') + hurt(c, 50, ctx);
        },
      },
    ],
  },
  {
    id: 'chinh_ta_dai_chien',
    minRealm: 3,
    weight: 6,
    cooldown: 120,
    title: tr('Chính tà đại chiến', "Righteous-Demonic war"),
    text: () => tr('Chính đạo và ma đạo khai chiến ở Đoạn Hồn Nhai. Tu sĩ khắp thiên hạ đều phải chọn phe.', "The Righteous and Demonic Paths go to war at Duanhun Cliff. Every cultivator under heaven must pick a side."),
    choices: () => [
      {
        label: tr('Theo chính đạo xuất chiến', "Fight for the Righteous Path"),
        lean: 'chinh',
        run: (c, ctx) => {
          dao(c, 15);
          if (ctx.rnd() < luck(c, 0.6)) {
            addCult(c, reward(c, 0.8));
            money(c, 1000);
            return tr('Bạn lập công lớn, danh chấn thiên hạ.', "You earn great merit, and your name shakes the world.");
          }
          const f = fatal(c, ctx, 0.3, tr('Bạn tử trận ở Đoạn Hồn Nhai, thi thể vùi giữa vạn xác tu sĩ.', "You fall in battle at Duanhun Cliff, buried among ten thousand cultivators' corpses."));
          if (c.dead) return tr('Kiếm quang ngập trời...', "Sword light floods the sky...") + f;
          return tr('Bạn trọng thương trong trận chiến.', "You're gravely wounded in the battle.") + (f ?? '') + hurt(c, 60, ctx);
        },
      },
      {
        label: tr('Theo ma đạo', "Side with the Demonic Path"),
        lean: 'ta',
        run: (c, ctx) => {
          dao(c, -15);
          stat(c, 'tamMa', 10);
          if (ctx.rnd() < luck(c, 0.6)) {
            addCult(c, reward(c, 1.0));
            return tr('Ma đạo đại thắng. Bạn được phong làm hộ pháp.', "The Demonic Path wins big. You're named a Dharma Protector.");
          }
          const f = fatal(c, ctx, 0.3, tr('Bạn bị Tru Ma Kiếm Trận của chính đạo chém thành muôn mảnh.', "The Righteous Path's Demon-Slaying Sword Array cuts you into ten thousand pieces."));
          if (c.dead) return tr('Chính đạo vây kín bốn phía...', "The Righteous Path closes in from all sides...") + f;
          return tr('Bạn bị chính đạo vây đánh.', "The Righteous Path surrounds and pummels you.") + (f ?? '') + hurt(c, 60, ctx);
        },
      },
      {
        label: tr('Đứng ngoài, bế quan', "Stay out of it, seclude yourself"),
        lean: 'trung',
        run: (c) => {
          addCult(c, reward(c, 0.3));
          stat(c, 'tamCanh', 5);
          return tr('Thiên hạ đại loạn, bạn đóng cửa động phủ tu luyện.', "The world is in chaos. You seal your cave dwelling and cultivate.");
        },
      },
      {
        label: tr('Nhặt bảo vật trên chiến trường', "Scavenge treasures from the battlefield"),
        lean: 'ta',
        run: (c, ctx) => {
          dao(c, -6);
          money(c, 2000);
          ctx.fx('coin', tr('Hôi của', "Looted"));
          return tr('Xác người khắp nơi, túi trữ vật cũng khắp nơi.', "Corpses everywhere - and storage pouches everywhere too.");
        },
      },
    ],
  },
  {
    id: 'phu_mau',
    minAge: 30,
    maxAge: 90,
    once: true,
    weight: 15,
    title: tr('Tin nhà', "News from home"),
    text: () => tr('Thư nhà gửi đến: cha mẹ già yếu, mong được gặp bạn lần cuối.', "A letter from home: your parents are old and frail, and hope to see you one last time."),
    choices: () => [
      {
        label: tr('Về ngay, ở bên tới phút cuối', "Go home now, stay to the end"),
        lean: 'chinh',
        run: (c) => {
          dao(c, 8);
          stat(c, 'tamCanh', 10);
          stat(c, 'tamMa', -10);
          return tr('Bạn về kịp. Mẹ nắm tay bạn, mỉm cười rồi nhắm mắt.', "You make it in time. Mother holds your hand, smiles, and closes her eyes.");
        },
      },
      {
        label: tr('Gửi Diên Thọ Đan về', "Send a Longevity Pill home"),
        hint: '-300',
        lean: 'chinh',
        run: (c) => {
          money(c, -300);
          dao(c, 5);
          return tr('Cha mẹ sống thêm mười năm nữa, nhưng không gặp lại bạn.', "Your parents live ten more years, but never see you again.");
        },
      },
      {
        label: tr('Đang bế quan, không về', "In seclusion, don't go"),
        lean: 'trung',
        run: (c) => {
          addCult(c, reward(c, 0.3));
          stat(c, 'tamMa', 12);
          return tr('Khi bạn xuất quan, mộ cha mẹ đã xanh cỏ.', "When you emerge from seclusion, grass has grown over your parents' graves.");
        },
      },
      {
        label: tr('Đốt thư', "Burn the letter"),
        lean: 'ta',
        run: (c) => {
          dao(c, -10);
          stat(c, 'tamMa', 6);
          stat(c, 'tamCanh', 4);
          return tr('Tu tiên là đoạn tuyệt trần duyên. Bạn tự nhủ như vậy.', "To cultivate immortality is to sever mortal ties. So you tell yourself.");
        },
      },
    ],
  },
  {
    id: 'dao_lu_nan',
    minAge: 25,
    weight: 6,
    cooldown: 60,
    when: (c) => !!c.partner,
    title: tr('Đạo lữ gặp nạn', "Yao companion in peril"),
    text: (c) => tr(`${c.partner} bị kẻ thù bắt đi, chỉ để lại một vệt máu và mảnh ngọc vỡ.`, `${c.partner} has been taken by enemies, leaving only a trail of blood and a shattered jade pendant.`),
    choices: () => [
      {
        label: tr('Một mình đi cứu', "Go to the rescue alone"),
        lean: 'chinh',
        run: (c, ctx) => {
          if (ctx.rnd() < luck(c, 0.55)) {
            stat(c, 'tamCanh', 12);
            dao(c, 6);
            ctx.fx('love', tr('Đoàn tụ', "Reunited"));
            return tr('Bạn xông vào hang ổ địch, mang người về.', "You storm the enemy's lair and bring them home.");
          }
          const t = hurt(c, 40, ctx);
          c.partner = null;
          stat(c, 'tamMa', 20);
          return tr('Bạn đến muộn.', "You arrive too late.") + t;
        },
      },
      {
        label: tr('Nhờ sư môn ra tay', "Ask your sect for help"),
        lean: 'chinh',
        run: (c) => {
          money(c, -200);
          stat(c, 'tamCanh', 4);
          return tr('Sư môn ra tay, cứu được người nhưng bạn nợ một ân tình lớn.', "Your sect steps in and saves them, but you now owe a great debt.");
        },
      },
      {
        label: tr('Chuộc bằng linh thạch', "Pay the ransom in spirit stones"),
        hint: tr('-50% linh thạch', "-50% spirit stones"),
        lean: 'trung',
        run: (c) => {
          money(c, -c.linhThach * 0.5);
          return tr('Bạn trả giá. Người được thả về.', "You pay the price. They're released.");
        },
      },
      {
        label: tr('Bỏ mặc, đạo lữ chỉ là vướng bận', "Abandon them - a Yao companion is just baggage"),
        lean: 'ta',
        run: (c) => {
          const p = c.partner;
          c.partner = null;
          dao(c, -14);
          stat(c, 'tamMa', 10);
          addCult(c, reward(c, 0.4));
          return tr(`Bạn không đi. Từ đó không ai nhắc đến ${p} nữa.`, `You don't go. From then on, no one mentions ${p} again.`);
        },
      },
    ],
  },
  // ---------------- Kiếm hiệp: những lựa chọn có thể mất mạng ----------------
  {
    id: 'canh_doc',
    minAge: 14,
    weight: 7,
    cooldown: 30,
    title: tr('Quán trọ ven đường', "Roadside inn"),
    text: () => tr('Trời mưa, bạn ghé quán trọ vắng. Chủ quán cười tươi bưng ra bát canh "Thập Toàn Đại Bổ", nói là mời không lấy tiền.', "It's raining, and you stop at a deserted inn. The innkeeper beams and brings out a bowl of \"Ten-Treasure Tonic\" soup - on the house, he says."),
    choices: () => [
      {
        label: tr('Đói quá, húp cạn', "Starving, slurp it down"),
        lean: 'trung',
        run: (c, ctx) => {
          const f = fatal(c, ctx, 0.3, tr('Trong canh có Đoạn Trường Thảo. Bạn gục xuống bàn, chủ quán lục túi bạn rồi kéo xác ra sau bếp.', "The soup is laced with Heartbreak Grass. You slump onto the table; the innkeeper rifles your pouch and drags your body out back."));
          if (c.dead) return tr('Canh ngọt lạ thường...', "The soup is unusually sweet...") + f;
          stat(c, 'sucKhoe', 10);
          return tr('Canh ngon thật. Hóa ra chủ quán chỉ là người tốt bụng.', "The soup really is delicious. Turns out the innkeeper is just a kind soul.") + (f ?? '');
        },
      },
      {
        label: tr('Thử độc bằng ngân châm', "Test for poison with a silver needle"),
        lean: 'chinh',
        run: (c, ctx) => {
          if (ctx.rnd() < 0.5) {
            dao(c, 6);
            money(c, 120);
            return tr('Ngân châm đen kịt! Bạn bắt chủ quán, hóa ra là hắc điếm chuyên giết khách. Quan phủ thưởng 120 linh thạch.', "The silver needle turns black! You seize the innkeeper - it's a black inn that murders guests. The magistrate rewards you 120 spirit stones.");
          }
          return tr('Ngân châm vẫn sáng. Bạn yên tâm húp canh, chủ quán hơi tự ái.', "The needle stays shiny. You slurp the soup in peace; the innkeeper looks a bit offended.");
        },
      },
      {
        label: tr('Đổ cho con chó dưới bàn ăn trước', "Let the dog under the table eat first"),
        lean: 'ta',
        run: (c, ctx) => {
          dao(c, -4);
          if (ctx.rnd() < 0.5) return tr('Con chó lăn ra chết. Bạn rút kiếm, chủ quán quỳ xuống xin tha.', "The dog keels over dead. You draw your sword, and the innkeeper drops to his knees begging for mercy.");
          return tr('Con chó ăn xong vẫy đuôi. Chủ quán nhìn bạn như nhìn kẻ điên.', "The dog eats and wags its tail. The innkeeper looks at you like you're mad.");
        },
      },
      {
        label: tr('Cảm ơn rồi đi luôn trong mưa', "Say thanks and leave in the rain"),
        lean: 'trung',
        run: (c) => {
          stat(c, 'sucKhoe', -5);
          return tr('Bạn đội mưa đi tiếp, ướt sũng nhưng sống sót.', "You push on through the rain, soaked but alive.");
        },
      },
    ],
  },
  {
    id: 'trong_benh',
    minAge: 20,
    weight: 6,
    cooldown: 25,
    when: (c) => c.stats.sucKhoe < 70 || c.age / c.lifespan > 0.5,
    title: tr('Lâm trọng bệnh', "Grave illness"),
    text: () => tr('Bạn ho ra máu suốt ba tháng, người gầy rộc. Đại phu lắc đầu bảo bệnh đã vào phế phủ.', "You cough blood for three months and waste away. The physician shakes his head: it's in your lungs."),
    choices: (c) => [
      {
        label: tr('Uống thuốc bắc của đại phu', "Take the physician's herbal medicine"),
        lean: 'trung',
        run: (c, ctx) => {
          const f = fatal(c, ctx, c.realm >= 2 ? 0.05 : 0.2, tr(`Thuốc không cứu nổi. Bạn qua đời vì lao phổi ở tuổi ${Math.floor(c.age)}.`, `The medicine can't save you. You die of consumption at age ${Math.floor(c.age)}.`));
          if (c.dead) return tr('Bệnh mỗi ngày một nặng...', "The illness worsens by the day...") + f;
          stat(c, 'sucKhoe', 25);
          return tr('Uống ba trăm thang thuốc đắng, bệnh lui dần.', "After three hundred bitter doses, the illness slowly recedes.") + (f ?? '');
        },
      },
      {
        label: tr('Tìm truyền nhân của thần y', "Seek the divine physician's heir"),
        hint: tr('-300 linh thạch', "-300 spirit stones"),
        lean: 'trung',
        run: (c, ctx) => {
          if (c.linhThach < 300) {
            const f = fatal(c, ctx, 0.25, tr('Không đủ tiền chữa, bạn chết trên đường tìm thầy.', "You can't afford treatment, and die on the road searching for a healer."));
            if (c.dead) return tr('Thần y đòi 300 linh thạch, bạn không có...', "The divine physician wants 300 spirit stones, and you don't have it...") + f;
            return tr('Không đủ tiền, bạn bị đuổi về, may mà tự khỏi.', "Can't afford it, you're sent away - luckily you recover on your own.");
          }
          money(c, -300);
          stat(c, 'sucKhoe', 50);
          ctx.fx('heal', tr('Hồi phục', "Recovered"));
          return tr('Thần y châm chín kim, bệnh khỏi hẳn.', "The divine physician places nine needles, and you're fully cured.");
        },
      },
      {
        label: tr('Đốt tu vi đổi lấy mạng', "Burn cultivation to buy your life"),
        hint: tr('mất tu vi', "lose cultivation"),
        lean: 'trung',
        run: (c, ctx) => {
          c.cultivation = Math.round(c.cultivation * 0.4);
          stat(c, 'sucKhoe', 40);
          ctx.fx('heal');
          return tr('Bạn dùng chân khí ép bệnh ra ngoài. Sống rồi, nhưng tu vi tụt thảm hại.', "You force the illness out with true qi. You live, but your cultivation plummets.");
        },
      },
      {
        label: tr('Luyện huyết đan từ máu người khác', "Refine blood pills from others' blood"),
        lean: 'ta',
        run: (c, ctx) => {
          dao(c, -18);
          stat(c, 'tamMa', 12);
          stat(c, 'sucKhoe', 60);
          ctx.fx('evil', tr('Huyết đan', "Blood pill"));
          return tr('Bạn bắt mấy tên ăn mày luyện đan. Bệnh khỏi, trong lòng có thêm một vết đen.', "You seize a few beggars to refine pills. You're cured, and your heart gains another dark stain.");
        },
      },
    ],
  },
  {
    id: 'ma_cong',
    minRealm: 1,
    weight: 6,
    once: true,
    title: tr('Bí kíp cấm', "Forbidden manual"),
    text: () => tr('Trong hốc đá dưới thác, bạn nhặt được cuốn bí kíp bọc da người: "Thiên Ma Giải Thể Đại Pháp". Trang đầu ghi: tu thành thì một ngày bằng mười năm.', "In a rock crevice below the waterfall, you find a manual bound in human skin: \"Heavenly Demon Body-Dissolution Art\". The first page reads: master it, and one day equals ten years."),
    choices: () => [
      {
        label: tr('Luyện ngay đêm nay', "Practice it tonight"),
        hint: tr('rất nguy hiểm', "very dangerous"),
        lean: 'ta',
        run: (c, ctx) => {
          dao(c, -15);
          const f = fatal(c, ctx, 0.3, tr('Luyện đến tầng ba, chân khí nghịch chuyển. Bạn tẩu hỏa nhập ma, bảy khiếu phun máu mà chết.', "At the third layer, your true qi flows in reverse. You suffer qi deviation and die bleeding from all seven orifices."));
          if (c.dead) return tr('Bạn ngồi xếp bằng, lật trang đầu...', "You sit cross-legged and turn the first page...") + f;
          addCult(c, reward(c, 2));
          stat(c, 'tamMa', 20);
          ctx.fx('evil', tr('Ma công đại thành', "Demonic art mastered"));
          return tr('Bạn luyện thành! Tu vi tăng vọt, đôi mắt từ nay đỏ ngầu.', "You master it! Your cultivation soars, and your eyes are bloodshot red from now on.") + (f ?? '');
        },
      },
      {
        label: tr('Luyện chậm, từng chút một', "Practice slowly, bit by bit"),
        lean: 'ta',
        run: (c, ctx) => {
          dao(c, -6);
          const f = fatal(c, ctx, 0.08, tr('Một đêm trăng tròn, ma khí phản phệ. Bạn tẩu hỏa nhập ma.', "On a full-moon night, the demonic qi backlashes. You suffer qi deviation."));
          if (c.dead) return tr('Ba năm luyện chậm...', "Three years of slow practice...") + f;
          addCult(c, reward(c, 0.8));
          stat(c, 'tamMa', 8);
          return tr('Bạn chỉ luyện vài thức phòng thân. Tu vi nhích lên.', "You learn only a few forms for self-defense. Your cultivation inches up.") + (f ?? '');
        },
      },
      {
        label: tr('Đốt bí kíp, trừ hại cho đời', "Burn the manual, spare the world"),
        lean: 'chinh',
        run: (c) => {
          dao(c, 12);
          stat(c, 'tamCanh', 8);
          return tr('Ngọn lửa xanh lè bùng lên. Bạn nghe như có tiếng gào thét trong đó.', "A ghastly green flame flares up. You think you hear screaming inside it.");
        },
      },
      {
        label: tr('Bán cho ma môn', "Sell it to a demonic sect"),
        lean: 'ta',
        run: (c, ctx) => {
          dao(c, -8);
          money(c, 600);
          ctx.fx('coin', '+600');
          return tr('Ma môn trả giá cao không tưởng. Không biết ai sẽ là người luyện nó tiếp theo.', "The demonic sect pays an unthinkable price. Who knows who'll practice it next.");
        },
      },
    ],
  },
  {
    id: 'loi_dai_sinh_tu',
    minAge: 18,
    minRealm: 1,
    weight: 5,
    cooldown: 60,
    title: tr('Lôi đài sinh tử', "Life-and-death duel"),
    text: () => tr('Một thiên tài trẻ tuổi ném chiến thư trước cổng: "Lên lôi đài sinh tử, ký giấy sống chết tự chịu. Dám không?"', "A young prodigy hurls a challenge at your gate: \"Life-and-death arena, sign the waiver, no one to blame. Dare you?\""),
    choices: () => [
      {
        label: tr('Ký giấy, lên đài', "Sign and step up"),
        hint: tr('thắng được lớn, thua là chết', "win big, lose and die"),
        lean: 'trung',
        run: (c, ctx) => {
          const win = ctx.rnd() < luck(c, 0.5 + (c.path === 'kiem' ? 0.15 : 0) + (hasItem(c, 'thanh_phong') ? 0.08 : 0));
          if (win) {
            addCult(c, reward(c, 0.8));
            money(c, 300 * (c.realm + 1));
            stat(c, 'tamCanh', 10);
            return tr('Một kiếm định thắng thua. Danh tiếng bạn vang khắp châu quận.', "One sword stroke decides it. Your fame spreads across the provinces.");
          }
          const f = fatal(c, ctx, 0.45, tr('Bạn ngã xuống giữa lôi đài, giấy sinh tử đã ký, không ai được báo thù.', "You fall in the arena. The waiver is signed - no one may avenge you."));
          if (c.dead) return tr('Ba trăm hiệp...', "Three hundred exchanges...") + f;
          return tr('Bạn thua, được người ta khiêng xuống đài, sống sót trong gang tấc.', "You lose and are carried off the stage, alive by a hair.") + (f ?? '') + hurt(c, 50, ctx);
        },
      },
      {
        label: tr('Từ chối, mặc người chê cười', "Refuse, let them laugh"),
        lean: 'trung',
        run: (c) => {
          stat(c, 'tamMa', 6);
          return tr('Thiên hạ cười bạn nhát gan. Nhưng bạn còn sống.', "The world laughs at your cowardice. But you're alive.");
        },
      },
      {
        label: tr('Lên đài, lén dùng ám khí tẩm độc', "Step up, secretly use poisoned darts"),
        lean: 'ta',
        run: (c, ctx) => {
          dao(c, -14);
          if (ctx.rnd() < 0.7) {
            addCult(c, reward(c, 0.6));
            c.enemy = c.enemy ?? tr('sư môn của thiên tài chết trên lôi đài', "the sect of the prodigy who died in the arena");
            return tr('Hắn trúng Thất Bộ Đoạn Hồn Châm, đi được bảy bước thì gục. Không ai bắt được bằng chứng.', "He's struck by a Seven-Step Soul-Severing Needle, takes seven steps, and collapses. No one finds any proof.");
          }
          const f = fatal(c, ctx, 0.5, tr('Ám khí bị phát hiện. Cả quảng trường xông lên, bạn bị đánh chết tại chỗ.', "The hidden weapon is spotted. The whole square rushes you, and you're beaten to death on the spot."));
          if (c.dead) return tr('Ngân châm vừa rời tay...', "The needle has just left your hand...") + f;
          return tr('Ám khí bị phát hiện, bạn liều mạng chạy thoát.', "The hidden weapon is spotted. You flee for your life and barely escape.") + (f ?? '') + hurt(c, 40, ctx);
        },
      },
      {
        label: tr('Mời hắn uống trà, kết bằng hữu', "Invite him for tea, become friends"),
        lean: 'chinh',
        run: (c) => {
          dao(c, 4);
          stat(c, 'ngoTinh', 5);
          return tr('Hai người luận kiếm suốt đêm. Hóa ra hắn chỉ cô đơn vì quá giỏi.', "You discuss swordplay all night. Turns out he was just lonely from being too good.");
        },
      },
    ],
  },
  {
    id: 'vuc_tham',
    minAge: 12,
    weight: 6,
    cooldown: 30,
    title: tr('Linh chi bên vực', "Lingzhi on the cliff"),
    text: () => tr('Bên vách Đoạn Hồn Nhai mọc một cây linh chi ngàn năm, tỏa ánh tím. Dưới chân là vực sâu không thấy đáy.', "On the face of Duanhun Cliff grows a thousand-year lingzhi, glowing violet. Below is a bottomless abyss."),
    choices: () => [
      {
        label: tr('Trèo xuống hái', "Climb down and pick it"),
        hint: tr('có thể rơi vực', "might fall"),
        lean: 'trung',
        run: (c, ctx) => {
          if (ctx.rnd() < 0.65) {
            addCult(c, reward(c, 0.7));
            stat(c, 'sucKhoe', 15);
            return tr('Bạn hái được linh chi. Nuốt vào, toàn thân nóng ran.', "You pick the lingzhi. You swallow it, and your whole body burns with heat.");
          }
          // rơi vực
          if (ctx.rnd() < 0.5) {
            addCult(c, reward(c, 1.5));
            stat(c, 'ngoTinh', 10);
            ctx.fx('layer', tr('Rơi vực gặp kỳ ngộ', "Fell into a fortune"));
            return tr('Đá lở, bạn rơi xuống vực! Nhưng rơi vực không chết tất có kỳ ngộ: dưới đáy là động phủ của một vị tiền bối, bạn ở lại tu luyện ba năm.', "A rockslide - you fall into the abyss! But no one falls off a cliff in a xianxia story without finding a fortune: at the bottom is a senior's cave dwelling, and you stay to cultivate for three years.");
          }
          const f = fatal(c, ctx, 0.85, tr('Đá lở, bạn rơi xuống vực sâu ngàn trượng. Không ai tìm thấy thi thể.', "A rockslide sends you plunging thousands of feet into the abyss. No body is ever found."));
          if (c.dead) return tr('Tay vừa chạm vào linh chi...', "Your hand just touches the lingzhi...") + f;
          return tr('Bạn rơi xuống vực, mắc vào cành cây giữa vách, gãy mấy cái xương sườn.', "You fall, snag on a branch halfway down the cliff, and break a few ribs.") + (f ?? '') + hurt(c, 40, ctx);
        },
      },
      {
        label: tr('Dùng dây thừng và ngự kiếm', "Use a rope and sword flight"),
        lean: 'trung',
        run: (c, ctx) => {
          if (c.realm >= 2) {
            addCult(c, reward(c, 0.6));
            return tr('Ngự kiếm phi hành, hái linh chi dễ như trở bàn tay.', "Riding your flying sword, picking the lingzhi is as easy as turning your palm.");
          }
          const f = fatal(c, ctx, 0.1, tr('Dây thừng đứt. Bạn rơi xuống vực.', "The rope snaps. You fall into the abyss."));
          if (c.dead) return tr('Bạn thả dây xuống...', "You lower the rope...") + f;
          addCult(c, reward(c, 0.4));
          return tr('Chật vật nửa ngày, cuối cùng cũng hái được.', "After half a day of struggle, you finally get it.") + (f ?? '');
        },
      },
      {
        label: tr('Thuê đứa trẻ trong làng trèo xuống', "Pay a village kid to climb down"),
        lean: 'ta',
        run: (c, ctx) => {
          dao(c, -10);
          if (ctx.rnd() < 0.4) {
            stat(c, 'tamMa', 12);
            return tr('Đứa trẻ trượt chân. Bạn nhìn xuống vực, rồi quay đi.', "The kid slips. You look down into the abyss, then turn away.");
          }
          addCult(c, reward(c, 0.6));
          return tr('Đứa trẻ mang linh chi lên, bạn cho nó một đồng bạc.', "The kid brings up the lingzhi, and you give him a silver coin.");
        },
      },
      {
        label: tr('Thôi, mạng quan trọng hơn', "Forget it, life matters more"),
        lean: 'trung',
        run: (c) => {
          stat(c, 'tamCanh', 3);
          return tr('Bạn ngắm cây linh chi một lúc rồi quay đi.', "You admire the lingzhi for a while, then turn away.");
        },
      },
    ],
  },
  {
    id: 'ran_doc',
    minAge: 10,
    weight: 6,
    cooldown: 25,
    when: (c) => c.focus === 'du_ngoan' || c.focus === 'luyen_dan',
    title: tr('Rắn độc', "Venomous snake"),
    text: () => tr('Đang đi trong rừng, một con Thất Bộ Xà cắn trúng mắt cá chân bạn. Nghe nói bị cắn đi quá bảy bước là chết.', "Walking through the forest, a Seven-Step Snake bites your ankle. They say if you walk more than seven steps after the bite, you die."),
    choices: (c) => [
      {
        label: tr('Vận nội lực bức độc', "Use inner force to expel the venom"),
        hint: c.realm >= 1 ? tr('tu sĩ thì khá an toàn', "fairly safe for a cultivator") : tr('chưa có nội lực', "no inner force yet"),
        lean: 'trung',
        run: (c, ctx) => {
          const f = fatal(c, ctx, c.realm >= 2 ? 0.02 : c.realm === 1 ? 0.12 : 0.5, tr('Độc chạy vào tim. Bạn ngã xuống ở bước thứ bảy.', "The venom reaches your heart. You collapse on the seventh step."));
          if (c.dead) return tr('Bạn ngồi xuống vận công...', "You sit down and circulate your qi...") + f;
          return tr('Một dòng máu đen phun ra từ vết cắn. Bạn thoát chết.', "A stream of black blood spurts from the bite. You cheat death.") + (f ?? '');
        },
      },
      {
        label: tr('Uống Hồi Xuân Đan', "Take a Rejuvenation Pill"),
        hint: (c.pills.hoi_xuan ?? 0) > 0 ? tr(`còn ${c.pills.hoi_xuan}`, `${c.pills.hoi_xuan} left`) : tr('không có', "none"),
        lean: 'trung',
        run: (c, ctx) => {
          if (usePill(c, 'hoi_xuan')) return tr('Dược lực giải độc trong chớp mắt.', "The medicine neutralizes the venom in an instant.");
          const f = fatal(c, ctx, 0.4, tr('Lục túi không thấy đan dược. Bạn chết trong rừng sâu.', "You search your pouch and find no pills. You die deep in the forest."));
          if (c.dead) return tr('Bạn lục túi...', "You rummage through your pouch...") + f;
          return tr('Không có đan, may mà con rắn này độc nhẹ.', "No pills, but luckily this snake's venom is mild.") + (f ?? '');
        },
      },
      {
        label: tr('Hái thảo dược ven đường đắp tạm', "Patch it with roadside herbs"),
        lean: 'trung',
        run: (c, ctx) => {
          const f = fatal(c, ctx, 0.2, tr('Thảo dược đắp nhầm lại là cỏ Đoạn Hồn. Bạn chết vì hai thứ độc.', "The herb you used is Soul-Severing Grass. You die from two poisons at once."));
          if (c.dead) return tr('Bạn nhai mấy lá cây...', "You chew up a few leaves...") + f;
          stat(c, 'ngoTinh', 3);
          return tr('Đúng là Thanh Đại thảo, giải được độc rắn. Bạn học thêm một bài thuốc.', "It really was indigo herb - it cures snake venom. You learn a new remedy.") + (f ?? '');
        },
      },
      {
        label: tr('Mặc kệ, đi tiếp', "Ignore it, keep walking"),
        lean: 'trung',
        run: (c, ctx) => {
          const f = fatal(c, ctx, 0.5, tr('Bước thứ bảy, bạn ngã xuống. Lời đồn là thật.', "On the seventh step, you collapse. The rumor was true."));
          if (c.dead) return tr('Một, hai, ba...', "One, two, three...") + f;
          return tr('Bạn đi tám bước, chín bước, vẫn sống. Lời đồn là giả.', "Eight steps, nine steps, still alive. The rumor was false.") + (f ?? '');
        },
      },
    ],
  },
  {
    id: 'sat_thu',
    minAge: 20,
    weight: 8,
    cooldown: 30,
    when: (c) => c.linhThach >= 800 || !!c.enemy,
    title: tr('Sát thủ Ám Ảnh Lâu', "Anying Tower assassins"),
    text: (c) => tr(`Nửa đêm, ba bóng đen áo đen trùm mặt lặng lẽ áp sát giường bạn. ${c.enemy ? tr(`Có kẻ đã bỏ tiền thuê giết bạn, có lẽ là ${c.enemy}.`, `Someone paid to have you killed - probably ${c.enemy}.`) : tr('Có kẻ đã nhắm vào gia tài của bạn.', "Someone has their eye on your fortune.")}`, `At midnight, three masked figures in black silently close in on your bed. ${c.enemy ? tr(`Có kẻ đã bỏ tiền thuê giết bạn, có lẽ là ${c.enemy}.`, `Someone paid to have you killed - probably ${c.enemy}.`) : tr('Có kẻ đã nhắm vào gia tài của bạn.', "Someone has their eye on your fortune.")}`),
    choices: () => [
      {
        label: tr('Bật dậy giao chiến', "Leap up and fight"),
        lean: 'trung',
        run: (c, ctx) => {
          if (ctx.rnd() < luck(c, 0.5 + c.realm * 0.05)) {
            stat(c, 'tamCanh', 6);
            return tr('Bạn hạ cả ba. Trên người chúng có lệnh bài Ám Ảnh Lâu.', "You take down all three. On them are Anying Tower tokens.");
          }
          const f = fatal(c, ctx, 0.45, tr('Ba nhát kiếm từ ba hướng. Bạn chết khi chưa kịp rút vũ khí.', "Three blades from three directions. You die before you can draw your weapon."));
          if (c.dead) return tr('Bóng đen lao tới...', "The shadows lunge...") + f;
          return tr('Bạn trọng thương nhưng giữ được mạng.', "You're gravely wounded but keep your life.") + (f ?? '') + hurt(c, 40, ctx);
        },
      },
      {
        label: tr('Phá cửa sổ chạy trốn', "Smash through the window and flee"),
        lean: 'trung',
        run: (c, ctx) => {
          const f = fatal(c, ctx, 0.15, tr('Một mũi tên tẩm độc cắm vào lưng khi bạn vừa nhảy ra ngoài.', "A poisoned arrow sinks into your back just as you leap outside."));
          if (c.dead) return tr('Bạn tung người qua cửa sổ...', "You fling yourself through the window...") + f;
          money(c, -c.linhThach * 0.3);
          return tr('Bạn chạy thoát trong đêm, bỏ lại một phần gia sản.', "You escape into the night, leaving part of your fortune behind.") + (f ?? '');
        },
      },
      {
        label: tr('Trả gấp đôi để mua lại mạng mình', "Pay double to buy back your life"),
        hint: tr('-50% linh thạch', "-50% spirit stones"),
        lean: 'trung',
        run: (c) => {
          money(c, -c.linhThach * 0.5);
          return tr('Sát thủ cũng là người làm ăn. Chúng nhận tiền rồi biến mất.', "Assassins are businessmen too. They take the money and vanish.");
        },
      },
      {
        label: tr('Giả chết, rồi thuê ngược sát thủ đi giết kẻ chủ mưu', "Fake your death, then hire assassins to kill the mastermind"),
        lean: 'ta',
        run: (c, ctx) => {
          dao(c, -12);
          money(c, -400);
          if (ctx.rnd() < 0.6) {
            c.enemy = null;
            return tr('Ba ngày sau, kẻ chủ mưu chết trong phòng ngủ. Ân oán chấm dứt.', "Three days later, the mastermind dies in his bedroom. The feud is over.");
          }
          const f = fatal(c, ctx, 0.35, tr('Sát thủ phát hiện bạn giả chết. Lần này chúng làm cho trọn.', "The assassins see through your fake death. This time they finish the job."));
          if (c.dead) return tr('Bạn nín thở...', "You hold your breath...") + f;
          return tr('Kế không thành, bạn mất trắng 400 linh thạch.', "The plan fails, and you lose 400 spirit stones for nothing.") + (f ?? '');
        },
      },
    ],
  },
  {
    id: 'van_doc_cong',
    minRealm: 1,
    weight: 8,
    cooldown: 40,
    when: (c) => c.daoTam <= -30 || c.path === 'ma',
    title: tr('Vạn Độc Công', "Myriad Poison Art"),
    text: () => tr('Ma môn truyền cho bạn Vạn Độc Công: thả mình vào hũ chứa trăm loại độc vật, lấy độc nuôi công.', "The demonic sect teaches you the Myriad Poison Art: immerse yourself in a vat of a hundred venomous creatures, and feed your power with poison."),
    choices: () => [
      {
        label: tr('Nhảy vào hũ độc', "Jump into the poison vat"),
        hint: tr('rất nguy hiểm', "very dangerous"),
        lean: 'ta',
        run: (c, ctx) => {
          dao(c, -10);
          const f = fatal(c, ctx, 0.25, tr('Trăm loại độc cùng phát tác. Thân thể bạn tan thành nước đen trong hũ.', "A hundred poisons erupt at once. Your body dissolves into black liquid in the vat."));
          if (c.dead) return tr('Bạn nhảy vào...', "You jump in...") + f;
          addCult(c, reward(c, 1.4));
          stat(c, 'sucKhoe', 15);
          ctx.fx('evil', tr('Bách độc bất xâm', "Immune to all poisons"));
          return tr('Bảy ngày bảy đêm, bạn bước ra. Từ nay bách độc bất xâm.', "After seven days and nights, you step out. From now on, no poison can touch you.") + (f ?? '');
        },
      },
      {
        label: tr('Dùng tù binh thử độc trước', "Test the poison on prisoners first"),
        lean: 'ta',
        run: (c, ctx) => {
          dao(c, -16);
          stat(c, 'tamMa', 10);
          addCult(c, reward(c, 0.6));
          ctx.fx('evil');
          return tr('Mười tù binh chết, bạn tìm ra cách luyện an toàn hơn.', "Ten prisoners die, and you find a safer way to train.");
        },
      },
      {
        label: tr('Chỉ học phần giải độc', "Learn only the antidote part"),
        lean: 'trung',
        run: (c) => {
          addPill(c, 'hoi_xuan', 2);
          stat(c, 'ngoTinh', 4);
          return tr('Bạn học cách giải độc, chế được hai viên Hồi Xuân Đan.', "You learn to cure poison and craft two Rejuvenation Pills.");
        },
      },
      {
        label: tr('Bỏ trốn khỏi ma môn', "Flee the demonic sect"),
        lean: 'chinh',
        run: (c, ctx) => {
          dao(c, 15);
          c.sect = null;
          const f = fatal(c, ctx, 0.15, tr('Ma môn truy sát kẻ phản đồ. Bạn bị bắt lại và xử tử trước mặt mọi người.', "The demonic sect hunts down traitors. You're caught and executed in front of everyone."));
          if (c.dead) return tr('Bạn trốn đi trong đêm...', "You slip away in the night...") + f;
          c.enemy = c.enemy ?? tr('ma môn truy sát kẻ phản đồ', "the demonic sect hunting its traitor");
          return tr('Bạn trốn thoát. Từ nay ma môn treo thưởng cái đầu bạn.', "You escape. From now on, the demonic sect has a bounty on your head.") + (f ?? '');
        },
      },
    ],
  },
  // ---------------- Giàu nghèo ----------------
  {
    id: 'do_thach',
    minAge: 16,
    weight: 6,
    cooldown: 15,
    when: (c) => c.linhThach >= 100,
    title: tr('Đổ thạch', "Stone gambling"),
    text: () => tr('Phường thị mở sòng đổ thạch: mua khối đá thô, bổ ra mới biết bên trong có linh ngọc hay chỉ là đá vụn.', "The Market opens a stone-gambling den: buy a raw stone, and only when you split it do you know if there's spirit jade inside or just rubble."),
    choices: (c) => [
      {
        label: tr('Cược nhỏ cho vui', "Bet small for fun"),
        hint: '-50',
        lean: 'trung',
        run: (c, ctx) => {
          money(c, -50);
          if (ctx.rnd() < 0.35) {
            money(c, 150);
            ctx.fx('coin', '+150');
            return tr('Bổ ra một mảnh ngọc xanh, lãi gấp ba.', "You split out a piece of green jade - triple your money.");
          }
          return tr('Đá vụn. Coi như mua vui.', "Rubble. Call it entertainment.");
        },
      },
      {
        label: tr('Cược nửa gia tài', "Bet half your fortune"),
        hint: `-${Math.round(c.linhThach / 2)}`,
        lean: 'trung',
        run: (c, ctx) => {
          const bet = Math.round(c.linhThach / 2);
          money(c, -bet);
          if (ctx.rnd() < 0.3) {
            money(c, bet * 3);
            ctx.fx('coin', `+${bet * 3}`);
            return tr('Đá vỡ ra, ánh tím rực rỡ. Cả sòng xôn xao, bạn thành phú hộ sau một đêm.', "The stone cracks open in a blaze of violet light. The whole den buzzes - you're rich overnight.");
          }
          stat(c, 'tamMa', 6);
          return tr('Toàn đá vụn. Nửa gia tài bay theo gió.', "All rubble. Half your fortune, gone with the wind.");
        },
      },
      {
        label: tr('Tất tay một ván', "All in, one round"),
        hint: tr('tất cả linh thạch', "all spirit stones"),
        lean: 'trung',
        run: (c, ctx) => {
          const bet = c.linhThach;
          money(c, -bet);
          if (ctx.rnd() < 0.18) {
            money(c, bet * 5);
            ctx.fx('coin', tr('ĐỔI ĐỜI', "LIFE CHANGED"));
            return tr('Bên trong là Hỗn Nguyên Linh Ngọc! Bạn đổi đời chỉ trong một nhát bổ.', "Inside is Primordial Chaos Spirit Jade! Your life changes with a single strike.");
          }
          stat(c, 'tamMa', 12);
          const f = fatal(c, ctx, 0.05, tr('Trắng tay, bạn treo cổ sau sòng bạc.', "Penniless, you hang yourself behind the gambling den."));
          if (c.dead) return tr('Đá vụn...', "Rubble...") + f;
          return tr('Đá vụn. Bạn bước ra khỏi sòng với hai bàn tay trắng.', "Rubble. You walk out of the den with empty hands.") + (f ?? '');
        },
      },
      {
        label: tr('Đứng xem người khác cược', "Watch others gamble"),
        lean: 'trung',
        run: (c) => {
          stat(c, 'ngoTinh', 2);
          return tr('Bạn thấy có người đổi đời, có người tán gia bại sản. Đổ thạch đúng là đánh cược với trời.', "You see some change their fate and others lose everything. Stone gambling really is betting against Heaven.");
        },
      },
    ],
  },
  {
    id: 'mua_ruong',
    minAge: 16,
    weight: 7,
    cooldown: 20,
    when: (c) => c.linhThach >= 300,
    title: tr('Đầu tư', "Investment"),
    text: () => tr('Có người rao bán ruộng linh điền và một cửa tiệm ở trấn Lạc Hà. Một gã chủ nợ cũng rủ bạn góp vốn cho vay.', "Someone is selling spirit fields and a shop in Luo He Town. A moneylender also invites you to invest in loans."),
    choices: () => [
      {
        label: tr('Mua ruộng linh điền', "Buy spirit fields"),
        hint: tr('-300, thu nhập ổn định', "-300, steady income"),
        lean: 'trung',
        run: (c) => {
          money(c, -300);
          c.income = (c.income ?? 0) + 18;
          return tr('Bạn có mấy mẫu ruộng. Năm nào cũng có thu.', "You own a few acres of fields. They yield every year.");
        },
      },
      {
        label: tr('Mở tiệm thuốc', "Open an apothecary"),
        hint: tr('-600, lời nhiều hơn', "-600, more profit"),
        lean: 'trung',
        run: (c, ctx) => {
          if (c.linhThach < 600) return tr('Không đủ vốn, bạn đành thôi.', "Not enough capital. You give up.");
          money(c, -600);
          if (ctx.rnd() < 0.75) {
            c.income = (c.income ?? 0) + 45;
            return tr('Tiệm thuốc đắt khách, tiền vào như nước.', "The apothecary is packed with customers. Money pours in.");
          }
          return tr('Tiệm mở được ba tháng thì cháy. Mất trắng.', "Three months after opening, the shop burns down. Total loss.");
        },
      },
      {
        label: tr('Góp vốn cho vay nặng lãi', "Invest in loan sharking"),
        lean: 'ta',
        run: (c, ctx) => {
          money(c, -300);
          dao(c, -10);
          c.income = (c.income ?? 0) + 60;
          if (ctx.rnd() < 0.3) c.enemy = c.enemy ?? tr('con nợ bị bạn ép đến tan nhà nát cửa', "a debtor you ruined");
          return tr('Lãi mẹ đẻ lãi con. Có nhà con nợ treo cổ, bạn vẫn đến đòi.', "Interest breeds interest. One debtor's family hangs themselves, and you still come to collect.");
        },
      },
      { label: tr('Giữ tiền trong túi', "Keep the money in your pocket"), lean: 'trung', run: () => tr('Tiền trong túi mình vẫn là chắc nhất.', "Money in your own pocket is still the safest bet.") },
    ],
  },
  {
    id: 'pha_san',
    minAge: 18,
    weight: 8,
    cooldown: 25,
    when: (c) => (c.income ?? 0) >= 30,
    title: tr('Thương hội chèn ép', "Merchant guild squeeze"),
    text: () => tr('Vạn Phúc thương hội muốn nuốt trọn việc làm ăn của bạn. Kho hàng bị đốt, khách bị dọa không cho tới.', "The Wanfu Merchant Guild wants to swallow your business whole. Your warehouse is torched, and customers are scared away."),
    choices: () => [
      {
        label: tr('Bỏ tiền ra gỡ', "Pay your way out"),
        hint: tr('-40% linh thạch', "-40% spirit stones"),
        lean: 'trung',
        run: (c) => {
          money(c, -c.linhThach * 0.4);
          return tr('Bạn cầm cự được, nhưng sứt mẻ không ít.', "You hold on, but take quite a hit.");
        },
      },
      {
        label: tr('Kiện lên quan phủ', "Sue at the magistrate's court"),
        lean: 'chinh',
        run: (c, ctx) => {
          if (ctx.rnd() < 0.5) {
            dao(c, 4);
            return tr('Quan phủ xử bạn thắng, thương hội phải bồi thường.', "The magistrate rules in your favor. The guild must pay damages.");
          }
          c.income = Math.round((c.income ?? 0) / 2);
          return tr('Quan phủ đã ăn tiền của thương hội. Bạn mất nửa việc làm ăn.', "The magistrate has taken the guild's bribe. You lose half your business.");
        },
      },
      {
        label: tr('Đốt kho trả đũa', "Burn their warehouse in revenge"),
        lean: 'ta',
        run: (c, ctx) => {
          dao(c, -10);
          const f = fatal(c, ctx, 0.12, tr('Người của thương hội chờ sẵn. Bạn bị đánh chết trong đám cháy.', "The guild's men are waiting. You're beaten to death in the fire."));
          if (c.dead) return tr('Đêm đó lửa cháy rực trời...', "That night the fire lights up the sky...") + f;
          c.enemy = c.enemy ?? tr('Vạn Phúc thương hội', "the Wanfu Merchant Guild");
          return tr('Kho của chúng cháy rụi. Chiến tranh thương trường bắt đầu.', "Their warehouse burns to the ground. The trade war begins.") + (f ?? '');
        },
      },
      {
        label: tr('Bán lại cơ nghiệp, rút lui', "Sell the business and walk away"),
        lean: 'trung',
        run: (c) => {
          money(c, (c.income ?? 0) * 6);
          c.income = 0;
          return tr('Bạn bán rẻ cơ nghiệp. Tiền ít, nhưng ngủ được.', "You sell the business cheap. Less money, but you sleep at night.");
        },
      },
    ],
  },
  {
    id: 'bo_thi',
    minAge: 16,
    weight: 7,
    cooldown: 25,
    when: (c) => c.linhThach >= 800,
    title: tr('Nạn đói', "Famine"),
    text: () => tr('Nạn đói tràn tới trấn. Dân đói kéo đến trước cửa nhà bạn, quỳ xin một bát cháo.', "Famine reaches the town. The starving gather at your door, kneeling for a bowl of porridge."),
    choices: () => [
      {
        label: tr('Mở kho phát chẩn', "Open the granary for relief"),
        hint: tr('-30% linh thạch', "-30% spirit stones"),
        lean: 'chinh',
        run: (c, ctx) => {
          money(c, -c.linhThach * 0.3);
          dao(c, 15);
          stat(c, 'khiVan', 6);
          ctx.fx('heal', tr('Công đức', "Merit"));
          return tr('Cháo nấu không ngơi tay suốt một tháng. Dân lập bàn thờ sống cho bạn.', "The porridge pots boil nonstop for a month. The people build you a shrine while you still live.");
        },
      },
      {
        label: tr('Bán gạo giá gấp mười', "Sell rice at ten times the price"),
        lean: 'ta',
        run: (c, ctx) => {
          dao(c, -12);
          money(c, c.linhThach * 0.5);
          ctx.fx('coin', tr('Phất to', "Struck it rich"));
          return tr('Bạn giàu thêm một nửa. Dân trong trấn nguyền rủa tên bạn.', "Your wealth grows by half. The townsfolk curse your name.");
        },
      },
      {
        label: tr('Góp một ít cho có', "Chip in a token amount"),
        lean: 'trung',
        run: (c) => {
          money(c, -50);
          dao(c, 2);
          return tr('Bạn góp vài bao gạo, rồi đóng cửa lại.', "You donate a few sacks of rice, then shut the door.");
        },
      },
      {
        label: tr('Thuê người đuổi đi', "Hire men to drive them off"),
        lean: 'ta',
        run: (c, ctx) => {
          dao(c, -8);
          const f = fatal(c, ctx, 0.06, tr('Dân đói phá cổng xông vào. Bạn bị đám đông giẫm chết.', "The starving mob breaks down the gate. You're trampled to death."));
          if (c.dead) return tr('Đám đông nổi giận...', "The crowd turns furious...") + f;
          return tr('Gia nhân xua dân đi. Có đứa trẻ chết ngay trước cổng.', "Your servants drive the crowd away. A child dies right at your gate.") + (f ?? '');
        },
      },
    ],
  },
  {
    id: 'tung_quan',
    minAge: 14,
    weight: 9,
    cooldown: 15,
    when: (c) => c.linhThach < 40,
    title: tr('Túng quẫn', "Destitute"),
    text: () => tr('Trong túi không còn đồng nào. Bụng đói cồn cào, trời lại sắp vào đông.', "Not a coin left in your pocket. Your stomach is growling, and winter is coming."),
    choices: (_c, seed) =>
      sample<Choice>(
        seed,
        [
          {
            label: tr('Đi khuân vác ở bến thuyền', "Haul cargo at the docks"),
            lean: 'trung',
            run: (c) => {
              money(c, 35);
              stat(c, 'sucKhoe', -6);
              return tr('Lưng còng xuống, nhưng có tiền mua gạo.', "Your back is breaking, but you can buy rice.");
            },
          },
          {
            label: tr('Vay lãi của Hắc Hổ bang', "Borrow from the Heihu Gang"),
            lean: 'trung',
            run: (c, ctx) => {
              money(c, 120);
              if (ctx.rnd() < 0.5) c.enemy = c.enemy ?? tr('Hắc Hổ bang đòi nợ', "the Heihu Gang's debt collectors");
              return tr('Có tiền rồi. Còn trả thế nào thì tính sau.', "You've got money now. Paying it back is a problem for later.");
            },
          },
          {
            label: tr('Đi trộm nhà giàu', "Rob a rich house"),
            lean: 'ta',
            run: (c, ctx) => {
              dao(c, -8);
              const f = fatal(c, ctx, 0.12, tr('Bạn bị gia đinh bắt được, đánh chết ngay trong sân.', "The household guards catch you and beat you to death in the courtyard."));
              if (c.dead) return tr('Bạn trèo tường vào...', "You climb over the wall...") + f;
              money(c, 80);
              return tr('Bạn lấy được ít bạc vụn, chạy thoát trong đêm.', "You grab some loose silver and escape into the night.") + (f ?? '');
            },
          },
          {
            label: tr('Bán vũ khí đang dùng', "Sell your weapon"),
            lean: 'trung',
            run: (c) => {
              if (c.equipped.vu_khi) {
                const it = ITEMS.find((i) => i.id === c.equipped.vu_khi);
                c.inventory = c.inventory.filter((i) => i !== c.equipped.vu_khi);
                c.equipped.vu_khi = undefined;
                money(c, Math.round((it?.price ?? 20) * 0.5));
                return tr(`Bạn bán ${it?.name ?? tr('vũ khí', "your weapon")} lấy nửa giá.`, `You sell ${it?.name ?? tr('vũ khí', "your weapon")} for half price.`);
              }
              money(c, 5);
              return tr('Không còn gì để bán, bạn bán đôi giày được vài đồng.', "Nothing left to sell, you pawn your shoes for a few coins.");
            },
          },
          {
            label: tr('Lên núi đào sâm', "Dig for ginseng in the mountains"),
            lean: 'trung',
            run: (c, ctx) => {
              if (ctx.rnd() < 0.3) {
                money(c, 150);
                return tr('Bạn đào được củ sâm trăm năm!', "You dig up a hundred-year ginseng!");
              }
              const f = fatal(c, ctx, 0.05, tr('Trượt chân xuống khe núi lúc đào sâm.', "You slip into a ravine while digging for ginseng."));
              if (c.dead) return tr('Vách núi trơn...', "The cliff is slippery...") + f;
              return tr('Chẳng đào được gì, chỉ thêm đói.', "You dig up nothing and just get hungrier.") + (f ?? '');
            },
          },
          {
            label: tr('Đến chùa xin cơm', "Beg for rice at the temple"),
            lean: 'chinh',
            run: (c) => {
              stat(c, 'tamCanh', 4);
              stat(c, 'sucKhoe', 4);
              return tr('Sư cụ cho bạn bát cơm chay và một lời khuyên.', "The old abbot gives you a bowl of vegetarian rice and a word of advice.");
            },
          },
        ],
        4,
      ),
  },
  {
    id: 'trom_nha',
    minAge: 16,
    weight: 7,
    cooldown: 20,
    when: (c) => c.linhThach >= 1500,
    title: tr('Trộm đột nhập', "Burglar"),
    text: () => tr('Nửa đêm, bạn nghe tiếng sột soạt ở kho. Có kẻ đang cạy rương linh thạch.', "At midnight, you hear rustling in the storeroom. Someone is prying open your spirit stone chest."),
    choices: () => [
      {
        label: tr('Ra bắt trộm', "Go catch the thief"),
        lean: 'trung',
        run: (c, ctx) => {
          if (ctx.rnd() < luck(c, 0.65)) return tr('Bạn tóm gọn tên trộm, giao cho quan phủ.', "You nab the thief and hand him over to the magistrate.");
          const f = fatal(c, ctx, 0.08, tr('Tên trộm rút dao đâm trúng tim bạn.', "The thief pulls a knife and stabs you through the heart."));
          if (c.dead) return tr('Trong bóng tối...', "In the darkness...") + f;
          money(c, -c.linhThach * 0.2);
          return tr('Hắn đâm bạn một nhát rồi ôm tiền chạy.', "He stabs you once and runs off with the money.") + (f ?? '') + hurt(c, 20, ctx);
        },
      },
      {
        label: tr('Mặc kệ, coi như của đi thay người', "Let it go - better the money than your life"),
        lean: 'trung',
        run: (c) => {
          money(c, -c.linhThach * 0.2);
          return tr('Sáng ra mất một phần năm gia tài.', "By morning, a fifth of your fortune is gone.");
        },
      },
      {
        label: tr('Thả chó, bày bẫy', "Release the dogs, set traps"),
        lean: 'ta',
        run: (c) => {
          dao(c, -5);
          return tr('Tên trộm sa bẫy gãy chân. Bạn treo hắn trước cổng làm gương.', "The thief breaks his leg in a trap. You hang him at the gate as a warning.");
        },
      },
      {
        label: tr('Hỏi vì sao hắn đi trộm', "Ask why he steals"),
        lean: 'chinh',
        run: (c) => {
          dao(c, 8);
          money(c, -20);
          return tr('Hắn có mẹ già ốm nặng. Bạn cho hắn ít tiền rồi tha.', "He has a gravely ill old mother. You give him some money and let him go.");
        },
      },
    ],
  },
  ...EVENTS2,
  ...EVENTS3,
  ...HOOK_EVENTS,
  ...TA_EVENTS,
  ...SECT_EVENTS,
  ...SECT_EVENTS2,
  ...COSMOS_EVENTS,
  ...HU_EVENTS,
  ...COSMOS_STORIES,
  ...COSMOS_END_EVENTS,
  ...CHILD_EVENTS,
  PET_EVENT,
  ...PET_STORIES,
];

// ---------------- Sự kiện do engine kích hoạt ----------------

export const PATH_EVENT_ID = '__chon_duong';
export const BREAK_EVENT_ID = '__dot_pha';

export function pathChoices(_c: Character): Choice[] {
  // hiện đủ cả 6 con đường; Phật tu kéo đạo tâm về chính, Ma tu kéo về tà
  const chosen = (Object.keys(PATHS) as (keyof typeof PATHS)[]).map((k) => PATHS[k]);
  return chosen.map((p) => ({
    label: p.name,
    hint: p.desc,
    lean: p.lean,
    run: (ch, ctx) => {
      ch.path = p.id;
      if (p.id === 'phat') {
        ch.lifespan = Math.round(ch.lifespan * 1.1);
        dao(ch, 10);
      }
      if (p.id === 'ma') {
        dao(ch, -10);
        stat(ch, 'tamMa', 10);
      }
      if (p.id === 'yeu') stat(ch, 'sucKhoe', 20);
      if (p.id === 'dan') addPill(ch, 'tu_khi', 3);
      if (p.id === 'tran') stat(ch, 'tamCanh', 8);
      if (p.id === 'kiem' && !ch.equipped.vu_khi) giveItem(ch, 'moc_kiem');
      ctx.fx('breakthrough', p.name);
      return tr(`Bạn chọn con đường ${p.name}. ${p.desc}`, `You choose the path of ${p.name}. ${p.desc}`);
    },
  }));
}

export const ITEM_BY_ID = Object.fromEntries(ITEMS.map((i) => [i.id, i]));
