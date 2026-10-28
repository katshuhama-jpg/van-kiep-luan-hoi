import { ITEMS } from './data';
import { addCult, fatal, giveItem, money, reward, stat } from './helpers';
import { PET_IDS, PETS, adopt } from './pets';
import type { Character, GameEvent } from './types';
import { tr } from '../i18n';

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
    title: tr('Vạn Kiếp Quy Nhất', "Ten Thousand Lives Become One"),
    text: () =>
      tr('Đêm ấy bạn không mơ. Bạn tỉnh giấc trên đỉnh núi tuyết, và người kia đã quay mặt lại, mỉm cười bằng khuôn mặt của bạn: "Vạn kiếp đã đủ. Ngươi muốn dừng lại, hay đi thêm một kiếp nữa?"', "That night you do not dream. You wake atop a snowy peak, and the other figure has turned around at last, smiling with your face: \"Ten thousand lives are enough. Will you stop here, or walk one more life?\""),
    choices: () => [
      {
        label: tr('Buông bỏ, thoát khỏi Vạn Kiếp', "Let go, escape the Ten Thousand Lives"),
        hint: tr('kết thúc mọi luân hồi', "ends all reincarnation"),
        lean: 'chinh',
        run: (c, ctx) => {
          c.dead = true;
          c.endTag = 'thoat_van_kiep';
          c.cause = tr('Gom lại vạn mảnh của chính mình, mỉm cười bước ra khỏi luân hồi', "Gathered the ten thousand shards of self and smiled as they stepped out of reincarnation");
          ctx.fx('breakthrough', tr('VẠN KIẾP QUY NHẤT', "TEN THOUSAND LIVES BECOME ONE"));
          return tr('Bạn bước tới, hai bóng người hòa làm một. Tiếng chuông vang lên lần cuối, rồi im lặng. Lần đầu tiên sau vạn kiếp, bạn không cần câu trả lời nữa.', "You step forward, and the two figures merge into one. The bell tolls one last time, then falls silent. For the first time in ten thousand lives, you no longer need an answer.");
        },
      },
      {
        label: tr('Ở lại, sống trọn kiếp này đã', "Stay, live this life to the end first"),
        hint: tr('tâm cảnh, khí vận +20', "Mind, Luck +20"),
        lean: 'trung',
        run: (c) => {
          c.stats.tamCanh = Math.min(100, c.stats.tamCanh + 20);
          c.stats.khiVan = Math.min(100, c.stats.khiVan + 20);
          return tr('Người kia gật đầu: "Cũng là một câu trả lời." Bạn tỉnh dậy, thấy nắng sớm đẹp hơn mọi buổi sáng trước đây.', "The other figure nods: \"That is an answer too.\" You wake and find the morning sun lovelier than any morning before.");
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
    title: tr('Kẻ Gõ Chuông', "The Bell Ringer"),
    text: () =>
      tr('Trên đỉnh cao nhất của cõi này, bạn nghe tiếng chuông rõ hơn bao giờ hết. Giữa mây có một bàn tay cầm dùi, không thân, không mặt. "Lại một mảnh tìm tới," giọng nói vang lên. "Ngươi muốn ta ngừng đếm? Vậy thử đỡ ba tiếng chuông của ta."', "On the highest peak of this realm, you hear the bell clearer than ever. Amid the clouds floats a hand gripping a mallet - no body, no face. \"Another shard has found its way here,\" a voice booms. \"You want me to stop counting? Then try to withstand three tolls of my bell.\""),
    choices: () => [
      {
        label: tr('Đỡ ba tiếng chuông', "Withstand three tolls"),
        hint: tr('tâm cảnh, khí vận càng cao càng dễ thắng · thua có thể chết', "higher Mind and Luck, better odds · losing may kill you"),
        lean: 'chinh',
        run: (c, ctx) => {
          const p = Math.min(0.7, 0.15 + (c.stats.tamCanh / 100) * 0.3 + (c.stats.khiVan / 100) * 0.15 + (c.lore2 ?? 0) * 0.02 + ((c.kiepSo ?? 0) >= 9 ? -0.1 : 0));
          let hits = 0;
          for (let i = 0; i < 3; i++) if (ctx.rnd() < p + 0.05) hits++;
          if (hits >= 3) {
            c.qf = { ...(c.qf ?? {}), chuongWin: 1 };
            c.bell = 1;
            stat(c, 'tamCanh', 10);
            ctx.fx('breakthrough', tr('ĐỠ ĐƯỢC BA TIẾNG CHUÔNG', "THREE TOLLS WITHSTOOD"));
            return tr('Tiếng thứ nhất làm bạn quỳ xuống. Tiếng thứ hai làm bạn quên tên mình. Tiếng thứ ba, bạn gọi tên những người đã đi cùng mình qua vạn kiếp, và đứng dậy. Bàn tay buông dùi. Dùi chuông rơi xuống chân bạn. (Kiếp sau sẽ được chọn số phận của chiếc chuông.)', "The first toll brings you to your knees. The second makes you forget your own name. At the third, you call out the names of those who walked with you through ten thousand lives, and you rise. The hand releases the mallet. It falls at your feet. (Next life, you will choose the bell's fate.)");
          }
          stat(c, 'sucKhoe', -45);
          stat(c, 'tamMa', 15);
          const d = fatal(c, ctx, 0.25, tr('Nguyên thần bị tiếng chuông chấn nát trên đỉnh cõi trời', "Primordial spirit shattered by the bell's toll atop the heavens"));
          return (
            tr(`Bạn chỉ đỡ được ${hits} tiếng. Tiếng chuông còn lại xuyên qua nguyên thần, bạn rơi khỏi mây như chiếc lá. Giọng nói vọng theo: "Chưa đủ. Mảnh vỡ của ngươi còn chưa biết nhau."`, `You withstand only ${hits} tolls. The rest pierce your primordial spirit, and you fall from the clouds like a leaf. The voice echoes after you: "Not enough. Your shards don't even know each other yet."`) +
            (d ?? tr(' Bạn còn sống, nhưng tim vẫn đập theo nhịp chuông rất lâu.', " You live, but your heart keeps beating to the bell's rhythm for a long, long time."))
          );
        },
      },
      {
        label: tr('Lui lại, chưa phải lúc', "Withdraw, it's not time yet"),
        hint: tr('an toàn, kiếp sau còn gặp', "safe, meet again next life"),
        lean: 'trung',
        run: () => tr('Bạn cúi đầu lui xuống. Tiếng chuông cười khẽ, rồi tiếp tục đếm.', "You bow your head and withdraw. The bell chuckles softly, then resumes its counting."),
      },
    ],
  },
  {
    id: 'cau_hon_su_gia',
    minAge: 20,
    once: true,
    weight: 300,
    when: (c) => !!c.cauHon,
    title: tr('Câu hồn sứ giả', "The Soul-Hooking Envoy"),
    text: () =>
      tr('Năm lần qua cầu Nại Hà, năm lần hất đổ chén canh. Đêm nay có tiếng xích sắt kéo lê ngoài cửa. Một bóng áo đen đội mũ cao, tay cầm câu hồn lệnh: "Kẻ không chịu quên, Địa phủ đến đòi nợ."', "Five times across Naihe Bridge, five times you knocked over the bowl of soup. Tonight, iron chains drag outside your door. A figure in black with a tall hat holds a soul-hook token: \"You who refuse to forget - the Underworld has come to collect its debt.\""),
    choices: () => [
      {
        label: tr('Rút binh khí, đánh với sứ giả', "Draw your weapon and fight the Reaper"),
        hint: tr('cảnh giới, tâm cảnh càng cao càng dễ thắng · thua có thể chết', "higher realm and Mind, better odds · losing may kill you"),
        lean: 'trung',
        run: (c, ctx) => {
          const p = Math.min(0.75, 0.2 + c.realm * 0.06 + (c.stats.tamCanh / 100) * 0.2);
          if (ctx.rnd() < p) {
            c.qf = { ...(c.qf ?? {}), cauHonWin: 1 };
            c.cauHon = false;
            stat(c, 'tamCanh', 8);
            giveItem(c, 'cau_hon_lenh', true);
            ctx.fx('breakthrough', tr('ĐÁNH LUI SỨ GIẢ', "THE REAPER REPELLED"));
            return tr('Xích sắt đứt làm đôi. Sứ giả lùi vào bóng tối, để rơi lại câu hồn lệnh: "Lần này ta tha. Nợ của ngươi, Địa phủ xóa sổ." Từ nay không còn ai đòi bạn uống canh nữa.', "The iron chain snaps in two. The Reaper retreats into the shadows, dropping his soul-hook token: \"I spare you this time. Your debt is struck from the Underworld's ledger.\" From now on, no one will force the soup on you.");
          }
          stat(c, 'sucKhoe', -40);
          const d = fatal(c, ctx, 0.4, tr('Bị Câu hồn sứ giả xích hồn kéo về Địa phủ vì năm lần không chịu uống canh Mạnh Bà', "Chained by the Soul-Hooking Envoy and dragged to the Underworld for refusing Meng Po's soup five times"));
          if (c.dead) c.endTag = 'cau_hon';
          return tr('Xích sắt quấn quanh cổ, lạnh buốt tới tận hồn.', "The iron chain wraps around your neck, cold right down to your soul.") + (d ?? tr(' Bạn giãy thoát được, nhưng hồn phách rách một mảng. Sứ giả hẹn kiếp sau gặp lại.', " You wrench free, but a piece of your soul is torn away. The Reaper promises to meet you again next life."));
        },
      },
      {
        label: tr('Đốt vàng mã, xin khất nợ', "Burn paper offerings, beg for more time"),
        hint: tr('mất linh thạch, tâm ma +', "lose spirit stones, heart demon +"),
        lean: 'chinh',
        run: (c) => {
          money(c, -Math.round(c.linhThach * 0.3));
          stat(c, 'tamMa', 12);
          return tr('Sứ giả nhận lễ, lặng lẽ rời đi. Nhưng bạn biết, chừng nào còn chưa uống canh, hắn còn quay lại.', "The Reaper accepts the offering and leaves in silence. But you know that as long as you refuse the soup, he will be back.");
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
    title: tr('Chuông vỡ', "The Broken Bell"),
    text: () =>
      tr('Dùi chuông vẫn nằm trong tay bạn, kiếp này qua kiếp khác. Đêm nay, quả chuông vô hình hiện ra trước mặt, to như một ngọn núi. Gõ nó, bạn sẽ thay kẻ kia đếm các mảnh để không mảnh nào bị quên. Đập vỡ nó, vạn mảnh sẽ tự do, nhưng có thể chẳng bao giờ tìm lại nhau.', "The bell mallet is still in your hand, life after life. Tonight an invisible bell appears before you, huge as a mountain. Strike it, and you take the other's place counting the shards so none is forgotten. Smash it, and the ten thousand shards go free - but may never find each other again."),
    choices: () => [
      {
        label: tr('Gõ chuông, thành người giữ chuông', "Strike the bell, become its keeper"),
        hint: tr('kết thúc kiếp · kết cục mới', "ends this life · new ending"),
        lean: 'chinh',
        run: (c, ctx) => {
          c.dead = true;
          c.bell = 2;
          c.endTag = 'go_chuong';
          c.cause = tr('Cầm dùi chuông, thay Thiên Đạo đếm vạn mảnh để không ai bị quên', "Took up the bell mallet and counted the ten thousand shards in the Heavenly Yao's stead, so no one is forgotten");
          ctx.fx('breakthrough', tr('NGƯỜI GIỮ CHUÔNG', "KEEPER OF THE BELL"));
          return tr('Bạn gõ một tiếng. Khắp các cõi, vạn người cùng ngẩng lên, và lần đầu tiên tiếng chuông không làm ai sợ. Nó chỉ nói: ta vẫn nhớ các ngươi.', "You strike once. Across every realm, ten thousand people look up, and for the first time the bell frightens no one. It only says: I still remember you all.");
        },
      },
      {
        label: tr('Đập vỡ chuông, trả tự do cho vạn mảnh', "Smash the bell, free the ten thousand shards"),
        hint: tr('kết thúc kiếp · kết cục mới', "ends this life · new ending"),
        lean: 'ta',
        run: (c, ctx) => {
          c.dead = true;
          c.bell = 2;
          c.endTag = 'dap_chuong';
          c.cause = tr('Đập vỡ quả chuông của Thiên Đạo, trả tự do cho vạn mảnh', "Smashed the Heavenly Yao's bell and set the ten thousand shards free");
          ctx.fx('breakthrough', tr('CHUÔNG VỠ', "THE BELL SHATTERED"));
          return tr('Dùi chuông giáng xuống. Quả chuông vỡ thành vạn mảnh sáng, rơi xuống khắp các cõi như mưa sao. Từ nay không ai đếm nữa. Mỗi mảnh phải tự nhớ lấy mình.', "The mallet comes down. The bell breaks into ten thousand shining shards that fall across every realm like a meteor shower. From now on, no one counts. Each shard must remember itself.");
        },
      },
    ],
  },
  {
    id: 'tien_duyen_dau',
    minAge: 6,
    maxAge: 15,
    once: true,
    weight: 600,
    when: (c) => c.lifeNo === 1,
    title: tr('Tiên duyên đầu đời', "An Early Immortal Affinity"),
    text: () => tr('Một lão nhân râu tóc bạc phơ dừng chân trước cửa nhà bạn, nhìn bạn rất lâu: "Đứa trẻ này có tiên cốt. Ta để lại cho con một món quà, con chọn đi."', "A white-haired old man stops at your door and studies you for a long time: \"This child has immortal bones. I'll leave you a gift - choose.\""),
    choices: () => [
      {
        label: tr('Cuốn bí kíp ố vàng', "A yellowed secret manual"),
        hint: tr('ngộ tính +15, tu vi +', "Insight +15, cultivation +"),
        lean: 'trung',
        run: (c) => {
          stat(c, 'ngoTinh', 15);
          addCult(c, reward(c, 1.5));
          return tr('Bạn lật trang đầu, chữ như tự chui vào đầu. Từ đó bạn học gì cũng nhanh.', "You turn the first page and the words seem to crawl into your head on their own. From then on, you learn everything fast.");
        },
      },
      {
        label: tr('Một con linh thú nhỏ', "A little spirit beast"),
        hint: tr('có thú cưng ngay', "get a pet right away"),
        lean: 'chinh',
        run: (c, ctx) => {
          const pool = PET_IDS.slice(0, 12);
          const id = pool[Math.floor(ctx.rnd() * pool.length)];
          adopt(c, id, ctx);
          return tr(`Lão nhân thả xuống một con ${PETS[id].name}. Nó dụi đầu vào chân bạn như đã quen từ kiếp trước.`, `The old man sets down a ${PETS[id].name}. It nuzzles your leg as if it has known you since a past life.`);
        },
      },
      {
        label: tr('Túi gấm và một lời chúc', "A brocade pouch and a blessing"),
        hint: tr('khí vận +15, +300 linh thạch', "Luck +15, +300 spirit stones"),
        lean: 'trung',
        run: (c, ctx) => {
          stat(c, 'khiVan', 15);
          money(c, 300);
          ctx.fx('coin', '+300');
          return tr('Trong túi gấm có ba trăm linh thạch và một lá bùa. Lão nhân cười: "Phúc của con còn dài."', "In the brocade pouch are three hundred spirit stones and a talisman. The old man laughs: \"Your fortune runs long, child.\"");
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
    title: tr('Thần binh nhận chủ', "The Divine Weapon Finds Its Master"),
    text: (c) =>
      tr(`Đêm ấy, ngoài sân có tiếng ngân dài như rồng ngâm. Một thanh binh khí cắm thẳng xuống đất, chuôi còn rung: chính là ${c.legend!.name}, thần binh bạn đã mang qua ${c.legend!.lv} kiếp.`, `That night, a long hum like a dragon's cry rings out in the yard. A weapon plunges straight into the ground, its hilt still quivering: it is ${c.legend!.name}, the divine weapon you've carried through ${c.legend!.lv} lives.`),
    choices: (c) => [
      {
        label: tr('Rút thần binh lên', "Draw the divine weapon"),
        hint: tr('thần binh mạnh thêm một bậc', "divine weapon grows one tier"),
        lean: 'trung',
        run: (ch, ctx) => {
          const L = ch.legend!;
          giveItem(ch, L.item, true);
          ctx.fx('layer', L.name);
          return tr(`${L.name} nhận ra chủ cũ, kiếm khí bao trùm cả sân. Mỗi kiếp truyền qua, nó lại mạnh thêm (công +${Math.min(10, L.lv) * 8}%).`, `${L.name} recognises its old master, and sword qi floods the whole yard. With every life it passes through, it grows stronger (attack +${Math.min(10, L.lv) * 8}%).`);
        },
      },
      {
        label: tr('Để nó yên nghỉ', "Let it rest"),
        hint: tr('tâm cảnh +, mất thần binh', "Mind +, lose the divine weapon"),
        lean: 'chinh',
        run: (ch) => {
          stat(ch, 'tamCanh', 12);
          ch.legend = null;
          return tr(`Bạn chắp tay vái ${c.legend!.name}. Thần binh rung lên một hồi rồi chìm vào lòng đất.`, `You clasp your hands and bow to ${c.legend!.name}. The divine weapon trembles a while, then sinks into the earth.`);
        },
      },
    ],
  },
];

export const legendItemName = (id: string) => ITEMS.find((i) => i.id === id)?.name ?? id;
