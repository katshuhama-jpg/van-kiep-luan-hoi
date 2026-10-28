import { realmName } from './data';
import { addCult, addPill, dao, fatal, giveItem, hurt, luck, money, reward, stat } from './helpers';
import { joinSect, promote, rankByRoot, rankName, rankOf } from './sect';
import type { Character, Choice, GameEvent } from './types';
import { tr } from '../i18n';

/**
 * 3.1.0: bốn tông môn mới (Phổ Đà Sơn, Kiếm Cốc, Vạn Độc Môn, Yêu Thần Điện) và chuỗi nhập Ma giới.
 * Tông mới chỉ mời người chưa có tông, đã chọn con đường hợp với tông.
 */

const free = (c: Character) => !c.sect && !c.cosmos && c.realm >= 1 && c.realm <= 4;
const decline = (text: string): Choice => ({
  label: tr('Từ chối, tiếp tục làm tán tu', "Decline, stay a rogue cultivator"),
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
    title: tr('Chuông sớm Phổ Đà Sơn', "Morning bell of Putuo Shan"),
    text: () => tr('Một vị lão tăng chống tích trượng đi ngang, dừng lại nhìn bạn rất lâu: "Thí chủ có tuệ căn. Phổ Đà Sơn ngoài biển Đông còn thiếu một người thắp đèn."', "An old monk with a ringed staff passes by, stops, and studies you for a long time: \"Benefactor, you have wisdom roots. Putuo Shan out in the Eastern Sea still lacks someone to tend the lamps.\""),
    choices: () => [
      {
        label: tr('Theo lão tăng ra đảo', "Follow the old monk to the island"),
        hint: tr('chính phái · tâm ma tăng chậm · cấm sát sinh', "righteous · slower heart demons · no killing"),
        lean: 'chinh',
        run: (c, ctx) => {
          const rank = Math.min(3, Math.max(1, rankByRoot(c.linhCanMul)) + (c.path === 'phat' ? 1 : 0));
          joinSect(c, tr('Phổ Đà Sơn', "Phổ Đà Sơn"), rank);
          dao(c, 8);
          stat(c, 'tamMa', -8);
          addCult(c, reward(c, 0.4));
          ctx.fx('buy', rankName(c));
          return tr(`Bạn cạo tóc dưới gốc bồ đề, thành ${rankName(c)} Phổ Đà Sơn. Mỗi sáng tụng kinh, tâm ma khó lòng xâm nhập. Nhưng giới luật nghiêm: diệt yêu quá tay sẽ bị Giới luật viện gọi lên.`, `You shave your head beneath the bodhi tree and become a ${rankName(c)} of Putuo Shan. Every morning you chant sutras, and heart demons can hardly get in. But the precepts are strict: overdo the demon hunting and the Precepts Hall will summon you.`);
        },
      },
      decline(tr('Lão tăng chắp tay, không nói thêm. Tiếng chuông xa dần về phía biển.', "The old monk presses his palms together and says no more. The bell fades away toward the sea.")),
    ],
  },
  {
    id: 'bai_kiem_coc',
    minAge: 12,
    once: true,
    weight: 28,
    when: (c) => free(c) && c.path === 'kiem',
    title: tr('Kiếm Cốc mở cửa', "Jian Valley opens its gates"),
    text: () => tr('Trên vách đá Kiếm Cốc cắm chín nghìn thanh kiếm cổ. Ai rút được một thanh thì được nhận làm đệ tử. Hôm nay cốc mở cửa.', "Nine thousand ancient swords are embedded in the cliffs of Jian Valley. Whoever pulls one out is taken as a disciple. Today the valley opens its gates."),
    choices: () => [
      {
        label: tr('Thử rút kiếm', "Try to draw a sword"),
        hint: tr('chính phái · Đại bỉ 3 năm một lần', "righteous · Grand Contest every 3 years"),
        lean: 'trung',
        run: (c, ctx) => {
          const p = luck(c, 0.55 + c.stats.ngoTinh / 300);
          if (ctx.rnd() >= p) {
            stat(c, 'tamCanh', -4);
            stat(c, 'sucKhoe', -6);
            return tr('Bạn dồn hết sức mà thanh kiếm không nhúc nhích. Kiếm khí phản chấn làm bạn ho ra máu. Kiếm Cốc đóng cửa, ba năm sau mới mở lại.', "You strain with all your might, but the sword won't budge. Its recoiling sword qi makes you cough blood. Jian Valley closes its gates for another three years.");
          }
          const rank = Math.max(1, rankByRoot(c.linhCanMul));
          joinSect(c, tr('Kiếm Cốc', "Kiếm Cốc"), rank);
          addCult(c, reward(c, 0.5));
          stat(c, 'ngoTinh', 4);
          ctx.fx('breakthrough', rankName(c));
          return tr(`Thanh kiếm rỉ sét rời vách đá với một tiếng ngân dài. Bạn thành ${rankName(c)} Kiếm Cốc. Ở đây ba năm một lần Đại bỉ, thắng là lên bậc.`, `The rusty sword leaves the cliff with a long ring. You become a ${rankName(c)} of Jian Valley. Here a Grand Contest is held every three years, and winners rise in rank.`);
        },
      },
      decline(tr('Bạn đứng nhìn người khác rút kiếm, rồi quay đi. Kiếm của mình, tự mình rèn.', "You watch the others draw swords, then turn away. Your own sword, you'll forge yourself.")),
    ],
  },
  {
    id: 'bai_van_doc',
    minAge: 12,
    once: true,
    weight: 32,
    when: (c) => free(c) && (c.path === 'dan' || c.path === 'ma') && c.daoTam <= 10,
    title: tr('Thư mời của Vạn Độc Môn', "An invitation from Wandu Sect"),
    text: () => tr('Sáng ra, trên bàn có một phong thư tẩm hương lạ, chữ viết bằng mực xanh lục: "Tay luyện đan của ngươi phí ở chốn này. Vạn Độc Môn đợi ở Hắc Thủy Đàm."', "In the morning there's a strangely perfumed letter on your table, written in green ink: \"Your alchemist's hands are wasted here. Wandu Sect awaits at Heishui Pool.\""),
    choices: () => [
      {
        label: tr('Tới Hắc Thủy Đàm', "Go to Heishui Pool"),
        hint: tr('tà phái · luyện độc đan, thử độc', "evil · brew poison pills, test poisons"),
        lean: 'ta',
        run: (c, ctx) => {
          joinSect(c, tr('Vạn Độc Môn', "Vạn Độc Môn"), Math.max(1, rankByRoot(c.linhCanMul)));
          dao(c, -10);
          addPill(c, 'tu_khi', 1);
          money(c, 80);
          ctx.fx('evil', tr('Vạn Độc Môn', "Vạn Độc Môn"));
          return tr(`Môn chủ đưa bạn một chén nước xanh: "Uống đi. Sống thì là người nhà." Bạn uống, sống, thành ${rankName(c)} Vạn Độc Môn.`, `The Sect Leader hands you a cup of green liquid: "Drink. If you live, you're family." You drink, you live, and you become a ${rankName(c)} of Wandu Sect.`);
        },
      },
      {
        label: tr('Đốt thư', "Burn the letter"),
        lean: 'chinh',
        run: (c) => {
          dao(c, 4);
          stat(c, 'sucKhoe', -3);
          return tr('Thư cháy ra khói xanh, bạn hít phải, ho mất ba ngày.', "The letter burns with green smoke. You breathe it in and cough for three days.");
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
    title: tr('Tiếng gọi của Yêu Thần Điện', "The call of Yaoshen Hall"),
    text: () => tr('Trăng đỏ. Huyết mạch trong người bạn sôi lên. Từ sâu trong Vạn Yêu Lâm, có tiếng tù và gọi: Yêu Thần Điện nhận mọi yêu tộc, không hỏi linh căn.', "A red moon. The blood in your veins boils. From deep in Wanyao Forest a horn calls: Yaoshen Hall takes in every yao, no spiritual root asked."),
    choices: () => [
      {
        label: tr('Theo tiếng tù và', "Follow the horn"),
        hint: tr('tà phái · không xét linh căn', "evil · no spiritual root check"),
        lean: 'ta',
        run: (c, ctx) => {
          joinSect(c, tr('Yêu Thần Điện', "Yêu Thần Điện"), c.realm >= 2 ? 2 : 1);
          dao(c, -6);
          stat(c, 'sucKhoe', 10);
          addCult(c, reward(c, 0.4));
          ctx.fx('buy', rankName(c));
          return tr(`Đại điện dựng bằng xương thú cổ. Yêu Thần không hỏi bạn từ đâu tới, chỉ hỏi bạn dám cắn ai. Bạn thành ${rankName(c)} Yêu Thần Điện.`, `The great hall is built from ancient beast bones. The Yao God doesn't ask where you came from, only whom you dare to bite. You become a ${rankName(c)} of Yaoshen Hall.`);
        },
      },
      decline(tr('Bạn bịt tai lại. Tiếng tù và vang đến sáng rồi tắt.', "You cover your ears. The horn sounds until dawn, then falls silent.")),
    ],
  },

  // ================= Phổ Đà Sơn =================
  {
    id: 'pd_gioi_luat',
    minAge: 12,
    weight: 120,
    cooldown: 5,
    when: (c) => c.sect === 'Phổ Đà Sơn' && !c.cosmos && c.focus === 'tru_yeu' && totalKills(c) >= 10,
    title: tr('Giới luật viện', "Precepts Hall"),
    text: () => tr('Giới luật viện gọi bạn lên. Thủ tọa gõ mõ ba tiếng: "Sát nghiệp trên người ngươi nặng rồi. Phổ Đà Sơn không phải đất của đồ tể."', "The Precepts Hall summons you. The Head Monk strikes the wooden fish three times: \"Your killing karma grows heavy. Putuo Shan is no place for a butcher.\""),
    choices: () => [
      {
        label: tr('Sám hối, chép kinh trăm ngày', "Repent, copy sutras for 100 days"),
        hint: tr('mất tiền, tâm ma giảm', "lose money, less heart demon"),
        lean: 'chinh',
        run: (c) => {
          money(c, -Math.min(c.linhThach, 50 + c.realm * 30));
          stat(c, 'tamMa', -8);
          dao(c, 5);
          return tr('Bạn chép kinh tới mỏi tay, nộp tiền đèn dầu cho chùa. Lòng nhẹ đi, túi cũng nhẹ đi.', "You copy sutras until your hand aches and pay the temple for lamp oil. Your heart grows lighter, and so does your purse.");
        },
      },
      {
        label: tr('"Yêu hại người, giết là cứu người"', "\"Demons harm people - killing them saves people\""),
        hint: tr('cãi lại, có thể bị giáng bậc', "argue back, may be demoted"),
        lean: 'trung',
        run: (c, ctx) => {
          if (ctx.rnd() < 0.5 && (c.sectRank ?? 1) > 0) {
            c.sectRank = (c.sectRank ?? 1) - 1;
            stat(c, 'tamMa', 4);
            return tr(`Thủ tọa lắc đầu: "Còn chấp." Bạn bị giáng làm ${rankName(c)}.`, `The Head Monk shakes his head: "Still attached." You are demoted to ${rankName(c)}.`);
          }
          stat(c, 'ngoTinh', 5);
          return tr('Thủ tọa im lặng rất lâu, rồi cười: "Cũng là một cách hiểu." Ông cho bạn lui, không phạt.', "The Head Monk is silent a long while, then smiles: \"That too is a way of understanding.\" He dismisses you without punishment.");
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
    title: tr('Pháp hội Triều Âm', "Chaoyin Dharma Assembly"),
    text: () => tr('Sóng vỗ vào Triều Âm Động. Phương trượng mở pháp hội, giảng một bộ kinh trăm năm mới giảng một lần.', "Waves crash into Chaoyin Cave. The Abbot opens a Dharma assembly to expound a sutra taught only once a century."),
    choices: () => [
      {
        label: tr('Ngồi nghe trọn ba ngày', "Listen for all three days"),
        hint: tr('ngộ tính, tâm cảnh', "Insight, Mind"),
        lean: 'chinh',
        run: (c, ctx) => {
          stat(c, 'ngoTinh', 5);
          stat(c, 'tamCanh', 6);
          stat(c, 'tamMa', -6);
          if (ctx.rnd() < 0.3) return tr(`Tới câu cuối, bạn bỗng hiểu ra. ${promote(c, ctx, tr('Phương trượng thấy ánh mắt bạn, gật đầu.', "The Abbot sees the look in your eyes and nods.")) ?? tr('Phương trượng gật đầu với bạn.', "The Abbot nods at you.")}`, `At the final verse, it suddenly clicks. ${promote(c, ctx, tr('Phương trượng thấy ánh mắt bạn, gật đầu.', "The Abbot sees the look in your eyes and nods.")) ?? tr('Phương trượng gật đầu với bạn.', "The Abbot nods at you.")}`);
          return tr('Tiếng kinh hòa vào tiếng sóng. Ba ngày như một hơi thở.', "The chanting blends with the waves. Three days pass like a single breath.");
        },
      },
      {
        label: tr('Lẻn ra bãi đá tu luyện', "Sneak off to cultivate on the rocks"),
        hint: tr('tu vi', "cultivation"),
        lean: 'trung',
        run: (c) => {
          addCult(c, reward(c, 0.5));
          return tr('Bãi đá vắng người, linh khí biển dồi dào. Bạn tu được một mạch dài.', "The rocky shore is deserted and the sea's spiritual qi is rich. You cultivate a long stretch.");
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
    title: tr('Kiếm Trủng', "Sword Tomb"),
    text: () => tr('Sâu trong Kiếm Cốc là Kiếm Trủng, mộ của những thanh kiếm đã gãy. Đêm nay kiếm khí trong mộ dâng lên, đệ tử nào cũng có thể vào ngộ kiếm.', "Deep in Jian Valley lies the Sword Tomb, a grave of broken swords. Tonight its sword qi surges, and every disciple may enter to comprehend the sword."),
    choices: () => [
      {
        label: tr('Vào sâu nhất', "Go in deepest"),
        hint: tr('tu vi lớn, có thể bị kiếm khí làm bị thương', "big cultivation, sword qi may wound you"),
        lean: 'trung',
        run: (c, ctx) => {
          if (ctx.rnd() < luck(c, 0.6)) {
            addCult(c, reward(c, 1));
            stat(c, 'ngoTinh', 4);
            return tr('Một sợi kiếm ý cổ chui vào thức hải bạn. Bạn ngồi đó tới sáng, kiếm pháp tiến một tầng.', "A strand of ancient sword intent slips into your sea of consciousness. You sit there till dawn, and your swordplay rises a level.");
          }
          return tr('Kiếm khí cuồn cuộn như bão. Bạn chạy ra được nhưng người đầy vết cắt.', "The sword qi rages like a storm. You make it out, but covered in cuts.") + hurt(c, 18, ctx);
        },
      },
      {
        label: tr('Ngồi ở rìa, ngộ chậm mà chắc', "Sit at the edge, slow but steady"),
        hint: tr('tu vi vừa', "some cultivation"),
        lean: 'chinh',
        run: (c) => {
          addCult(c, reward(c, 0.45));
          stat(c, 'tamCanh', 3);
          return tr('Bạn ngồi ở rìa mộ, nghe kiếm khí rít như gió. Không nhiều, nhưng không mất gì.', "You sit at the tomb's edge, listening to the sword qi whistle like wind. Not much gained, but nothing lost.");
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
    title: tr('Khách tới luận kiếm', "A guest comes to spar"),
    text: () => tr('Một kiếm khách áo đen đứng trước cửa cốc, đòi đấu với đệ tử Kiếm Cốc mạnh nhất. Trưởng lão nhìn quanh rồi nhìn bạn.', "A swordsman in black stands at the valley gate, demanding to duel Jian Valley's strongest disciple. The Elder looks around, then at you."),
    choices: () => [
      {
        label: tr('Bước ra nhận đấu', "Step up and accept"),
        hint: tr('thắng được thăng bậc', "win to be promoted"),
        lean: 'trung',
        run: (c, ctx) => {
          if (ctx.rnd() < luck(c, 0.5 + c.realm * 0.03)) {
            stat(c, 'khiVan', 4);
            return tr(`Kiếm khách lùi ba bước, tra kiếm vào vỏ: "Kiếm Cốc còn người." ${promote(c, ctx, tr('Cả cốc reo hò.', "The whole valley cheers.")) ?? tr('Trưởng lão thưởng cho bạn một bình đan.', "The Elder rewards you with a bottle of pills.")}`, `The swordsman steps back three paces and sheathes his sword: "Jian Valley still has worthy men." ${promote(c, ctx, tr('Cả cốc reo hò.', "The whole valley cheers.")) ?? tr('Trưởng lão thưởng cho bạn một bình đan.', "The Elder rewards you with a bottle of pills.")}`);
          }
          return tr('Một kiếm. Chỉ một kiếm, bạn đã thua. Kiếm khách bỏ đi không nói một lời.', "One strike. Just one strike, and you've lost. The swordsman leaves without a word.") + hurt(c, 15, ctx);
        },
      },
      {
        label: tr('Nhường sư huynh', "Let your senior brother go"),
        lean: 'chinh',
        run: (c) => {
          stat(c, 'ngoTinh', 3);
          return tr('Bạn đứng xem từ đầu tới cuối. Thua, nhưng học được nhiều.', "You watch from start to finish. You lost, but you learned plenty.");
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
    title: tr('Thử độc', "Poison testing"),
    text: () => tr('Lò độc đan mới ra. Trưởng lão cần người thử: "Sống qua được thì độc lực hóa tu vi. Không qua được thì... môn ta thiếu gì người."', "A new batch of poison pills is out. The Elder needs a tester: \"Survive, and the poison turns into cultivation. Don't, and... we have no shortage of people.\""),
    choices: () => [
      {
        label: tr('Uống', "Drink"),
        hint: tr('tu vi lớn, mất sức khỏe, có thể chết', "big cultivation, lose health, may die"),
        lean: 'ta',
        run: (c, ctx) => {
          addCult(c, reward(c, 1.1));
          stat(c, 'tamMa', 3);
          const f = fatal(c, ctx, 0.04, tr('Độc đan quá mạnh. Bạn co giật một đêm rồi tắt thở, mặt xanh như lá.', "The poison pill is too strong. You convulse all night and stop breathing, your face green as a leaf."));
          if (c.dead) return f ?? '';
          return tr('Ruột gan như bị lửa xanh thiêu. Ba ngày sau tỉnh dậy, tu vi đã tăng vọt.', "Your guts burn as if with green fire. Three days later you wake, your cultivation soaring.") + hurt(c, 22, ctx);
        },
      },
      {
        label: tr('Đẩy cho tên dược nô bên cạnh', "Push it on the herb slave next to you"),
        hint: tr('tà, được chia công', "evil, share the credit"),
        lean: 'ta',
        run: (c) => {
          dao(c, -8);
          addCult(c, reward(c, 0.3));
          return tr('Tên dược nô uống, ngã vật ra. Trưởng lão ghi công cho bạn vì "tìm được người thử".', "The herb slave drinks and collapses. The Elder credits you for \"finding a tester\".");
        },
      },
      {
        label: tr('Xin để lần sau', "Maybe next time"),
        lean: 'trung',
        run: () => tr('Trưởng lão cười khẩy, không nói gì.', "The Elder sneers and says nothing."),
      },
    ],
  },
  {
    id: 'vd_doc_dan',
    minAge: 12,
    weight: 9,
    cooldown: 8,
    when: (c) => c.sect === 'Vạn Độc Môn' && !c.cosmos && rankOf(c) >= 1,
    title: tr('Độc đan bán chợ đen', "Poison pills for the black market"),
    text: () => tr('Mẻ độc đan dư ra mười viên. Chợ đen dưới núi trả giá cao, nhưng mua về để làm gì thì ai cũng biết.', "Ten poison pills are left over from the batch. The black market below the mountain pays well, and everyone knows what they're bought for."),
    choices: () => [
      {
        label: tr('Bán hết', "Sell them all"),
        hint: tr('nhiều linh thạch, nghiêng tà', "lots of spirit stones, leans evil"),
        lean: 'ta',
        run: (c) => {
          dao(c, -6);
          money(c, 120 + c.realm * 60);
          return tr('Túi bạn nặng thêm. Mấy tháng sau, dưới núi có thêm vài đám tang.', "Your purse grows heavier. A few months later, there are a few more funerals below the mountain.");
        },
      },
      {
        label: tr('Luyện thành giải dược đem cho', "Turn them into antidotes and give them away"),
        hint: tr('mất công, nghiêng chính', "lose effort, leans righteous"),
        lean: 'chinh',
        run: (c) => {
          dao(c, 8);
          stat(c, 'ngoTinh', 3);
          return tr('Bạn đảo ngược dược tính, thành mười viên giải độc, đem cho làng bị dịch. Môn chủ biết chuyện, nhìn bạn rất lạ.', "You reverse the pills' nature into ten antidotes and give them to a plague-stricken village. When the Sect Leader hears, he looks at you very strangely.");
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
    title: tr('Huyết tế Yêu Thần', "Blood sacrifice to the Yao God"),
    text: () => tr('Đêm trăng tròn, cả điện quỳ trước tượng Yêu Thần. Ai dám nhỏ máu lên tượng sẽ được huyết mạch tổ tiên thức tỉnh thêm một phần.', "On the full-moon night the whole hall kneels before the Yao God's statue. Whoever dares drip blood on it will awaken a little more of their ancestral bloodline."),
    choices: () => [
      {
        label: tr('Nhỏ máu lên tượng', "Drip blood on the statue"),
        hint: tr('sức khỏe, tu vi, tâm ma', "health, cultivation, heart demon"),
        lean: 'ta',
        run: (c, ctx) => {
          addCult(c, reward(c, 0.8));
          stat(c, 'sucKhoe', 8);
          stat(c, 'tamMa', 5);
          if (ctx.rnd() < 0.3) return tr(`Mắt tượng sáng lên một thoáng. ${promote(c, ctx, tr('Điện chủ quỳ xuống trước bạn.', "The Hall Master kneels before you.")) ?? tr('Điện chủ nhìn bạn đầy kính nể.', "The Hall Master looks at you in awe.")}`, `The statue's eyes flash for an instant. ${promote(c, ctx, tr('Điện chủ quỳ xuống trước bạn.', "The Hall Master kneels before you.")) ?? tr('Điện chủ nhìn bạn đầy kính nể.', "The Hall Master looks at you in awe.")}`);
          return tr('Máu thấm vào đá. Bạn nghe tiếng gầm của tổ tiên vọng lên trong xương.', "Your blood seeps into the stone. You hear your ancestors' roar echo in your bones.");
        },
      },
      {
        label: tr('Chỉ quỳ lạy', "Just kneel and bow"),
        lean: 'trung',
        run: (c) => {
          stat(c, 'tamCanh', 3);
          return tr('Bạn quỳ tới sáng. Tượng không động, lòng bạn cũng không.', "You kneel till dawn. The statue doesn't stir, and neither does your heart.");
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
    title: tr('Lệnh săn', "Hunting order"),
    text: () => tr('Yêu tướng truyền lệnh: một đoàn tu sĩ nhân tộc đi qua Vạn Yêu Lâm, trên người họ có linh dược. Yêu Thần Điện muốn cả người lẫn đồ.', "The yao general gives the order: a band of human cultivators is passing through Wanyao Forest, carrying spirit herbs. Yaoshen Hall wants both the people and their goods."),
    choices: () => [
      {
        label: tr('Dẫn đầu cuộc săn', "Lead the hunt"),
        hint: tr('linh thạch, thăng bậc, nghiêng tà', "spirit stones, promotion, leans evil"),
        lean: 'ta',
        run: (c, ctx) => {
          dao(c, -10);
          money(c, 100 + c.realm * 50);
          if (ctx.rnd() < luck(c, 0.45)) return tr(`Cả đoàn không ai thoát. ${promote(c, ctx, tr('Yêu tướng vỗ vai bạn.', "The yao general claps you on the shoulder.")) ?? ''}`, `Not one of them escapes. ${promote(c, ctx, tr('Yêu tướng vỗ vai bạn.', "The yao general claps you on the shoulder.")) ?? ''}`);
          return tr('Đoàn người bỏ chạy để lại hành lý. Bạn bị một nhát kiếm ở vai.', "The travelers flee, abandoning their baggage. You take a sword cut to the shoulder.") + hurt(c, 15, ctx);
        },
      },
      {
        label: tr('Lén báo cho đoàn người đổi đường', "Secretly warn them to change route"),
        hint: tr('nghiêng chính, có thể bị phát hiện', "leans righteous, may be caught"),
        lean: 'chinh',
        run: (c, ctx) => {
          dao(c, 10);
          if (ctx.rnd() < 0.3) {
            if ((c.sectRank ?? 1) > 0) c.sectRank = (c.sectRank ?? 1) - 1;
            return tr(`Có kẻ thấy bạn. Bạn bị giáng làm ${rankName(c)}, bị đánh ba mươi roi.`, `Someone saw you. You are demoted to ${rankName(c)} and given thirty lashes.`);
          }
          return tr('Đoàn người đổi đường trong đêm. Sáng ra, yêu tướng đập nát cả một gốc cây vì tức.', "The travelers change course in the night. In the morning the yao general smashes a whole tree in rage.");
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
    title: tr('Huyết Trì tẩy thân', "Blood Pool cleansing"),
    text: (c) => tr(`Kẻ mới tới Ma giới phải xuống Huyết Trì, rửa sạch hơi người. Bọt máu sôi lục bục dưới chân ${realmName(c.realm, 'ma')} mới.`, `Newcomers to the Demon Realm must enter the Blood Pool to wash away the human scent. Blood bubbles and boils beneath the new ${realmName(c.realm, 'ma')}'s feet.`),
    choices: () => [
      {
        label: tr('Ngâm bảy ngày bảy đêm', "Soak seven days and nights"),
        hint: tr('tu vi lớn, tâm ma +', "big cultivation, heart demon +"),
        lean: 'ta',
        run: (c, ctx) => {
          c.maStep = 1;
          c.maAt = Math.floor(c.age);
          addCult(c, reward(c, 1));
          stat(c, 'sucKhoe', 10);
          stat(c, 'tamMa', 10);
          ctx.fx('evil', tr('Huyết Trì', "Blood Pool"));
          return tr('Máu thấm vào tận tủy. Bước lên bờ, da bạn đỏ như than, ma khí cuộn quanh người. (Bước 1/4)', "The blood seeps into your marrow. When you climb out, your skin is red as embers and demonic qi swirls around you. (Step 1/4)");
        },
      },
      {
        label: tr('Ngâm một ngày rồi lên', "Soak one day and get out"),
        hint: tr('vừa đủ', "just enough"),
        lean: 'trung',
        run: (c) => {
          c.maStep = 1;
          c.maAt = Math.floor(c.age);
          addCult(c, reward(c, 0.4));
          stat(c, 'tamMa', 3);
          return tr('Bạn lên bờ sớm. Ma binh gác Huyết Trì cười nhạo, nhưng đầu bạn vẫn còn tỉnh. (Bước 1/4)', "You climb out early. The demon guards at the Blood Pool jeer, but your head stays clear. (Step 1/4)");
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
    title: tr('Nhận chủ', "Choose a master"),
    text: () => tr('Ở Ma giới, kẻ không có chủ chỉ là thịt. Ba vị Ma quân gửi thiệp mời cùng một đêm.', "In the Demon Realm, one without a master is just meat. Three Demon Lords send invitations on the same night."),
    choices: () => [
      {
        label: tr('Huyết Ma Quân', "Blood Demon Lord"),
        hint: tr('tu luyện nhanh hơn 12% cả kiếp', "cultivate 12% faster all life"),
        lean: 'ta',
        run: (c) => {
          c.maStep = 2;
          c.maAt = Math.floor(c.age);
          c.maLord = 'huyet';
          stat(c, 'tamMa', 4);
          return tr('Huyết Ma Quân rạch tay, nhỏ một giọt máu lên trán bạn. Từ nay ma công của bạn chạy nhanh hơn. (Bước 2/4)', "The Blood Demon Lord slits his hand and drips a drop of blood on your forehead. From now on your demonic arts run faster. (Step 2/4)");
        },
      },
      {
        label: tr('Cốt Ma Quân', "Bone Demon Lord"),
        hint: tr('mỗi năm hồi sức khỏe, tâm ma giảm', "yearly health regen, less heart demon"),
        lean: 'trung',
        run: (c) => {
          c.maStep = 2;
          c.maAt = Math.floor(c.age);
          c.maLord = 'cot';
          stat(c, 'sucKhoe', 10);
          return tr('Cốt Ma Quân gõ lên xương sống bạn ba cái. Thân thể bạn cứng như đá, lòng cũng lặng hơn. (Bước 2/4)', "The Bone Demon Lord taps your spine three times. Your body turns hard as stone, your heart calmer too. (Step 2/4)");
        },
      },
      {
        label: tr('Ảnh Ma Quân', "Shadow Demon Lord"),
        hint: tr('khí vận +, mỗi năm có thể nhặt được của', "Luck +, may find treasure each year"),
        lean: 'trung',
        run: (c) => {
          c.maStep = 2;
          c.maAt = Math.floor(c.age);
          c.maLord = 'anh';
          stat(c, 'khiVan', 10);
          return tr('Ảnh Ma Quân không hiện thân, chỉ có bóng của bạn khẽ gật đầu. Từ nay bóng bạn biết đường tới chỗ có của. (Bước 2/4)', "The Shadow Demon Lord never appears; only your shadow gives a slight nod. From now on your shadow knows the way to treasure. (Step 2/4)");
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
    title: tr('Tranh địa bàn', "Turf war"),
    text: (c) => tr(`Một ${realmName(c.realm, 'ma')} khác chiếm khe Huyết Phong, thu linh thạch của cả vùng. Chủ của bạn nói: "Muốn có chỗ đứng thì giành lấy."`, `Another ${realmName(c.realm, 'ma')} has seized Xuefeng Gorge and collects the whole region's spirit stones. Your master says: "Want a place to stand? Take it."`),
    choices: () => [
      {
        label: tr('Đánh chiếm Huyết Phong', "Seize Xuefeng"),
        hint: tr('thắng: thu linh thạch mỗi năm · thua: trọng thương', "win: yearly spirit stones · lose: grave wounds"),
        lean: 'ta',
        run: (c, ctx) => {
          c.maStep = 3;
          c.maAt = Math.floor(c.age);
          if (ctx.rnd() < luck(c, 0.5 + (c.stats.sucKhoe - 50) / 300)) {
            c.maLand = 1;
            money(c, 300);
            ctx.fx('breakthrough', tr('Huyết Phong', "Xuefeng"));
            return tr('Đối thủ quỳ xuống, dâng ấn khe Huyết Phong. Từ nay mỗi năm vùng này nộp linh thạch cho bạn. (Bước 3/4)', "Your rival kneels and offers up the seal of Xuefeng Gorge. From now on the region pays you spirit stones every year. (Step 3/4)");
          }
          return tr('Bạn thua, bị đá văng khỏi khe. Ở Ma giới, thua một lần chưa chết là may. (Bước 3/4)', "You lose and get kicked out of the gorge. In the Demon Realm, losing once and living is lucky. (Step 3/4)") + hurt(c, 35, ctx);
        },
      },
      {
        label: tr('Thương lượng chia đôi', "Negotiate a split"),
        hint: tr('thu ít hơn, không phải đánh', "earn less, no fighting"),
        lean: 'trung',
        run: (c) => {
          c.maStep = 3;
          c.maAt = Math.floor(c.age);
          if (c.stats.ngoTinh + c.stats.khiVan >= 110) {
            c.maLand = 0.5;
            return tr('Hắn cân nhắc rất lâu rồi gật đầu. Mỗi năm bạn được nửa phần thu của Huyết Phong. (Bước 3/4)', "He weighs it a long while, then nods. Each year you get half of Xuefeng's take. (Step 3/4)");
          }
          stat(c, 'tamCanh', -4);
          return tr('Hắn cười vào mặt bạn: "Ma giới không có chữ chia." Bạn ra về tay trắng. (Bước 3/4)', "He laughs in your face: \"The Demon Realm has no word for sharing.\" You leave empty-handed. (Step 3/4)");
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
    title: tr('Ma Đế triệu kiến', "Summoned by the Demon Emperor"),
    text: () => tr('Hắc kỳ cắm trước cửa nhà bạn: Ma Đế triệu kiến. Từ trước tới nay, kẻ mới lên được gọi vào Vạn Ma Điện không quá mười người.', "A black banner is planted before your door: the Demon Emperor summons you. Never have more than ten newcomers been called into the Hall of Ten Thousand Demons."),
    choices: (c) => [
      {
        label: tr('Vào điện, quỳ một gối', "Enter and kneel on one knee"),
        hint: tr('nhận danh hiệu và bảo vật theo con đường tu', "get a title and a treasure for your Path"),
        lean: 'ta',
        run: (ch, ctx) => {
          ch.maStep = 4;
          ch.maAt = Math.floor(ch.age);
          const titles: Record<string, string> = {
            kiem: tr('Huyết Kiếm Ma Soái', "Blood Sword Demon Marshal"),
            dan: tr('Độc Đan Ma Sư', "Poison Pill Demon Master"),
            phat: tr('Phản Phật Ma Tăng', "Apostate Demon Monk"),
            ma: tr('Vạn Huyết Ma Soái', "Myriad Blood Demon Marshal"),
            yeu: tr('Yêu Ma Đại Tướng', "Yao Demon Grand General"),
          };
          ch.maTitle = titles[ch.path ?? ''] ?? tr('Ma Soái', "Demon Marshal");
          const gift = ch.path === 'kiem' || ch.path === 'ma' ? 'tam_dau_trao' : ch.path === 'phat' || ch.path === 'yeu' ? 'ma_binh_giap' : 'cuu_u_ma_vu';
          const had = ch.inventory.includes(gift);
          if (had) money(ch, 1500);
          else giveItem(ch, gift, false);
          ctx.fx('breakthrough', ch.maTitle);
          return tr(`Ma Đế phong bạn làm ${ch.maTitle}. ${had ? tr('Bảo vật bạn đã có, Ma Đế đổi thành 1.500 linh thạch.', "You already own the treasure, so the Demon Emperor gives you 1,500 spirit stones instead.") : tr('Ngài ban thêm một món bảo vật, mở Túi đồ để xem.', "He also bestows a treasure; open your Inventory to see it.")} (Bước 4/4, xong chuỗi nhập Ma giới)`, `The Demon Emperor names you ${ch.maTitle}. ${had ? tr('Bảo vật bạn đã có, Ma Đế đổi thành 1.500 linh thạch.', "You already own the treasure, so the Demon Emperor gives you 1,500 spirit stones instead.") : tr('Ngài ban thêm một món bảo vật, mở Túi đồ để xem.', "He also bestows a treasure; open your Inventory to see it.")} (Step 4/4, Demon Realm chain complete)`);
        },
      },
      {
        label: tr('Đứng thẳng, không quỳ', "Stand tall, don't kneel"),
        hint: tr('khí vận +, Ma Đế có thể nổi giận', "Luck +, the Demon Emperor may rage"),
        lean: 'trung',
        run: (ch, ctx) => {
          ch.maStep = 4;
          ch.maAt = Math.floor(ch.age);
          if (ctx.rnd() < 0.5) {
            ch.maTitle = tr('Ma Giới Cuồng Nhân', "Madman of the Demon Realm");
            stat(ch, 'khiVan', 12);
            addCult(ch, reward(ch, 1));
            return tr(`Ma Đế cười to tới rung cả điện: "Lâu lắm mới thấy kẻ không quỳ." Ngài gọi bạn là ${ch.maTitle}. (Bước 4/4)`, `The Demon Emperor laughs until the hall shakes: "It's been ages since I saw one who won't kneel." He calls you ${ch.maTitle}. (Step 4/4)`);
          }
          return tr('Ma Đế không nói gì, chỉ phẩy tay. Bạn bị hất văng ra ngoài điện.', "The Demon Emperor says nothing, just flicks his hand. You are flung out of the hall.") + hurt(ch, 40, ctx) + tr(' (Bước 4/4)', " (Step 4/4)");
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
    out = tr(`Bóng của bạn dẫn tới một ma huyệt bỏ hoang, trong có ${g} linh thạch.`, `Your shadow leads you to an abandoned demon lair holding ${g} spirit stones.`);
  }
  return out;
}
