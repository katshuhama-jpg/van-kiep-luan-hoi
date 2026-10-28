import { addCult, addPill, dao, fatal, money, reward, stat } from './helpers';
import { leaveSect, sectConflict } from './sect';
import { promote, rankName, rankOf, sectSide } from './sect';
import type { Choice, GameEvent } from './types';
import { tr } from '../i18n';
import { nameOf } from '../hanviet';

/**
 * Sự kiện trong tông môn, theo bậc đệ tử: tạp dịch có cơ hội nghịch thiên, ngoại môn bị sai việc vặt,
 * nội môn vào Tàng Kinh Các, chân truyền được sư phụ chỉ điểm. Ma môn có luật rừng riêng.
 */
export const SECT_EVENTS: GameEvent[] = [
  // ---- 3.1.0: Phản môn khi đạo và tông môn ngược phe ----
  {
    id: 'phan_mon',
    minAge: 10,
    weight: 400,
    cooldown: 3,
    when: (c) => !c.cosmos && !!c.sect && !c.sectHide && sectConflict(c),
    title: tr('Phản môn', "Betraying the sect"),
    text: (c) =>
      sectSide(c) === 'ta'
        ? tr(`Tin bạn ${c.path === 'phat' ? tr('quy y cửa Phật', "have taken Buddhist vows") : tr('làm việc thiện', "have been doing good deeds")} lan tới tổng đàn ${c.sect}. Đêm nay, mấy tên hộ pháp đứng chặn trước cửa phòng bạn, tay đặt sẵn lên chuôi đao.`, `Word that you ${c.path === 'phat' ? tr('quy y cửa Phật', "have taken Buddhist vows") : tr('làm việc thiện', "have been doing good deeds")} reaches the headquarters of ${nameOf(c.sect)}. Tonight, several enforcers stand blocking your door, hands already on their sabers.`)
        : tr(`Các trưởng lão ${c.sect} phát hiện trên người bạn có ${c.path === 'ma' ? tr('ma khí', "demonic qi") : tr('mùi huyết tinh', "the stench of blood")}. Chính phái không dung kẻ theo tà. Sáng mai bạn bị gọi lên chính điện.`, `The elders of ${nameOf(c.sect)} detect ${c.path === 'ma' ? tr('ma khí', "demonic qi") : tr('mùi huyết tinh', "the stench of blood")} on you. A righteous sect does not tolerate followers of evil. Tomorrow morning you are summoned to the main hall.`),
    choices: (c) => {
      const ta = sectSide(c) === 'ta';
      const list: Choice[] = [
        {
          label: tr('Tự xin rời tông môn', "Ask to leave the sect"),
          hint: ta ? tr('ma môn không tha kẻ bỏ đi · có thể bị truy sát', "demonic sects don't spare deserters · you may be hunted") : tr('rời đi êm thấm, giữ đồ', "leave peacefully, keep your gear"),
          lean: 'trung',
          run: (ch, ctx) => {
            const name = ch.sect;
            leaveSect(ch, false);
            stat(ch, 'tamCanh', -5);
            if (ta) {
              const f = fatal(ch, ctx, 0.15, tr(`Rời ${name} chưa được ba ngày, sát thủ ma môn đuổi kịp. Kẻ phản môn không được sống.`, `Not three days after leaving ${name}, demonic sect assassins catch up with you. Traitors don't get to live.`));
              if (ch.dead) return tr('Bạn lẳng lặng xuống núi trong đêm...', "You slip down the mountain quietly at night...") + f;
              ch.enemy = ch.enemy ?? tr('ma môn truy sát kẻ phản đồ', "the demonic sect hunting a traitor");
              return tr(`Bạn trả lại lệnh bài, xuống núi trong đêm. Từ nay ${name} coi bạn là kẻ phản đồ.${f ?? ''}`, `You return your token and leave the mountain by night. From now on ${name} counts you a traitor.${f ?? ''}`);
            }
            return tr(`Bạn quỳ trước chính điện, xin rời ${name}. Chưởng môn thở dài phất tay áo: "Đạo khác nhau, không cùng mưu. Đi đi."`, `You kneel before the main hall and ask to leave ${name}. The Sect Leader sighs and waves his sleeve: "Different paths, different plans. Go."`);
          },
        },
        {
          label: tr('Giấu thân phận, ở lại', "Hide it and stay"),
          hint: tr('giữ tông môn, mỗi năm có thể bị lộ · lộ thì bị trục xuất, mất áo bào', "keep your sect, risk exposure each year · if exposed, expelled and robe stripped"),
          lean: 'ta',
          run: (ch) => {
            ch.sectHide = true;
            stat(ch, 'tamMa', 6);
            return tr('Bạn cúi đầu nhận sai, thề không tái phạm. Trưởng lão nửa tin nửa ngờ. Từ nay mỗi bước đi trong sơn môn đều phải giữ ý.', "You bow your head, admit your fault, and swear never to do it again. The elder half believes you. From now on, every step within the sect gates must be careful.");
          },
        },
      ];
      if (!ta)
        list.push({
          label: tr('Phản sư diệt tổ, cướp bảo vật', "Betray the master, rob the treasury"),
          hint: tr('đánh với trưởng lão · thắng được bảo vật và bị cả tông truy sát · thua có thể chết', "fight an elder · win: treasure, but the whole sect hunts you · lose: may die"),
          lean: 'ta',
          run: (ch, ctx) => {
            const name = ch.sect;
            const p = Math.min(0.7, 0.2 + ch.realm * 0.06);
            dao(ch, -20);
            if (ctx.rnd() < p) {
              leaveSect(ch, false);
              addCult(ch, reward(ch, 2));
              money(ch, 400 + ch.realm * 150);
              ch.enemy = tr(`${name} truy sát kẻ phản sư`, `${name} hunts the master-betrayer`);
              ctx.fx('evil', tr('Phản sư diệt tổ', "Betraying the master"));
              return tr(`Bạn đánh trọng thương trưởng lão giữa chính điện, cướp bảo khố rồi phá vòng vây mà đi. Tu vi tăng vọt, túi đầy linh thạch. Từ nay ${name} treo thưởng đầu bạn.`, `You gravely wound the elder in the middle of the main hall, loot the treasury and break through the encirclement. Your cultivation soars and your purse overflows with spirit stones. From now on ${name} has a bounty on your head.`);
            }
            stat(ch, 'sucKhoe', -45);
            leaveSect(ch, true);
            const f = fatal(ch, ctx, 0.35, tr(`Bạn phản sư không thành, bị trưởng lão ${name} một chưởng đánh nát tâm mạch.`, `Your betrayal fails; elder ${name} shatters your heart meridian with a single palm.`));
            if (ch.dead) return tr('Trưởng lão chỉ cần một chưởng...', "The elder needs only one palm...") + f;
            ch.enemy = ch.enemy ?? tr(`${name} truy sát kẻ phản sư`, `${name} hunts the master-betrayer`);
            return tr(`Trưởng lão một chưởng đánh bạn văng ra khỏi chính điện. Bạn bị phế bỏ thân phận đệ tử, lột áo bào, bò xuống núi.${f ?? ''}`, `One palm from the elder sends you flying out of the main hall. Your disciple status is revoked, your robe stripped, and you crawl down the mountain.${f ?? ''}`);
          },
        });
      return list;
    },
  },
  {
    id: 'thien_co_vay',
    minAge: 16,
    weight: 60,
    cooldown: 8,
    when: (c) => !c.cosmos && sectSide(c) === 'trung' && Math.abs(c.daoTam) >= 40 && (c.tcVay ?? 0) < 2,
    title: tr('Chính tà vây Thiên Cơ Các', "Righteous and evil besiege Tianji Pavilion"),
    text: (c) => tr(`Thiên Cơ Các vốn đứng ngoài chính tà, nhưng bạn đã nghiêng hẳn về một phía. Đêm nay, ${(c.lookSeed ?? c.name.length) % 2 ? tr('người của Huyết Sát Môn', "men of Xuesha Sect") : tr('đệ tử Thanh Vân Tông', "disciples of Qingyun Sect")} kéo tới vây kín Các, đòi giao bạn ra.`, `Tianji Pavilion has always stood apart from righteous and evil, but you have leaned hard to one side. Tonight, ${(c.lookSeed ?? c.name.length) % 2 ? tr('người của Huyết Sát Môn', "men of Xuesha Sect") : tr('đệ tử Thanh Vân Tông', "disciples of Qingyun Sect")} surround the Pavilion and demand you be handed over.`),
    choices: (c) => [
      {
        label: tr('Ra trận, một mình chặn cửa', "Fight, hold the door alone"),
        hint: tr('cảnh giới càng cao càng dễ thắng · thắng được Các chủ thưởng · thua trọng thương', "higher realm, better odds · win: Pavilion Master's reward · lose: grave wounds"),
        lean: c.daoTam >= 40 ? 'chinh' : 'ta',
        run: (ch, ctx) => {
          ch.tcVay = (ch.tcVay ?? 0) + 1;
          const p = Math.min(0.75, 0.3 + ch.realm * 0.06);
          if (ctx.rnd() < p) {
            addCult(ch, reward(ch, 1));
            stat(ch, 'khiVan', 4);
            const up = promote(ch, ctx, tr('Các chủ đứng trên lầu nhìn bạn đánh lui cả đoàn người.', "The Pavilion Master watches from the tower as you drive back the whole mob."));
            ctx.fx('breakthrough', tr('Giữ được Thiên Cơ Các', "Tianji Pavilion held"));
            return tr(`Bạn chặn cửa suốt một đêm, đánh lui kẻ tới gây sự. ${up ?? tr('Các chủ ban cho bạn một quẻ tốt: khí vận +4.', "The Pavilion Master casts you a lucky divination: Luck +4.")}`, `You hold the door all night and drive off the troublemakers. ${up ?? tr('Các chủ ban cho bạn một quẻ tốt: khí vận +4.', "The Pavilion Master casts you a lucky divination: Luck +4.")}`);
          }
          stat(ch, 'sucKhoe', -35);
          const lost = Math.round(ch.linhThach * 0.3);
          money(ch, -lost);
          const f = fatal(ch, ctx, 0.12, tr('Một mình chặn cửa Thiên Cơ Các, bạn ngã xuống dưới làn kiếm khí của cả đoàn người.', "Holding the door of Tianji Pavilion alone, you fall beneath the sword qi of the entire mob."));
          if (ch.dead) return tr('Bạn ra trận...', "You go out to fight...") + f;
          return tr(`Bạn không chặn nổi. Trọng thương, bị cướp ${lost} linh thạch, Các chủ phải ra mặt mới giải được vây.${f ?? ''}`, `You can't hold them. Gravely wounded and robbed of ${lost} spirit stones, the Pavilion Master has to step in to lift the siege.${f ?? ''}`);
        },
      },
      {
        label: tr('Trốn vào mật thất, để Các chủ lo', "Hide in the secret room, let the Master handle it"),
        hint: tr('an toàn, tâm cảnh -, Các chủ không vui', "safe, Mind -, Pavilion Master displeased"),
        lean: 'trung',
        run: (ch) => {
          ch.tcVay = (ch.tcVay ?? 0) + 1;
          stat(ch, 'tamCanh', -6);
          if (ch.sectRank && ch.sectRank > 1) ch.sectRank -= 1;
          return tr('Bạn trốn trong mật thất ba ngày. Khi bước ra, vòng vây đã tan, nhưng ánh mắt Các chủ nhìn bạn đã khác. Bạn bị giáng một bậc.', "You hide in the secret room for three days. When you come out, the siege is over, but the Pavilion Master looks at you differently now. You are demoted one rank.");
        },
      },
    ],
  },
  {
    id: 'tap_dich_nghich_thien',
    minAge: 10,
    weight: 9,
    cooldown: 6,
    when: (c) => rankOf(c) === 0,
    title: tr('Tạp dịch quét lá', "Sweeping leaves"),
    text: (c) => tr(`Làm ${rankName(c)} ở ${c.sect}, ngày nào bạn cũng quét lá ở hậu sơn. Hôm nay dưới gốc tùng cổ thụ, chổi chạm phải một hộp đá phủ rêu.`, `As a ${rankName(c)} of ${nameOf(c.sect)}, you sweep leaves on the back mountain every day. Today, beneath an ancient pine, your broom strikes a moss-covered stone box.`),
    choices: () => [
      {
        label: tr('Mở hộp ra xem', "Open the box"),
        hint: tr('có thể đổi đời', "could change your life"),
        lean: 'trung',
        run: (c, ctx) => {
          if (ctx.rnd() < 0.5) {
            stat(c, 'ngoTinh', 10);
            addCult(c, reward(c, 1.2));
            return tr(`Trong hộp là công pháp thất truyền của một vị tổ sư. Đêm nào bạn cũng lén luyện. ${promote(c, ctx, tr('Trưởng lão thấy tu vi bạn tăng vọt, nghi ngờ rồi kinh ngạc.', "The elders notice your cultivation soaring, first suspicious, then amazed.")) ?? ''}`, `Inside is a lost technique of a sect patriarch. You secretly practice it every night. ${promote(c, ctx, tr('Trưởng lão thấy tu vi bạn tăng vọt, nghi ngờ rồi kinh ngạc.', "The elders notice your cultivation soaring, first suspicious, then amazed.")) ?? ''}`);
          }
          stat(c, 'sucKhoe', -15);
          return tr('Hộp đá có cấm chế. Một luồng kình lực hất bạn văng ra, nằm liệt ba ngày.', "The stone box is sealed with a restriction. A burst of force flings you away, and you're bedridden for three days.");
        },
      },
      {
        label: tr('Nộp cho trưởng lão', "Hand it to an elder"),
        hint: tr('được khen, ít rủi ro', "praised, low risk"),
        lean: 'chinh',
        run: (c, ctx) => {
          dao(c, 5);
          money(c, 40);
          if (ctx.rnd() < 0.35) return tr(`Trưởng lão vuốt râu: "Thật thà hiếm có." ${promote(c, ctx, tr('Ông đề cử bạn với tông môn.', "He recommends you to the sect.")) ?? ''}`, `The elder strokes his beard: "Such honesty is rare." ${promote(c, ctx, tr('Ông đề cử bạn với tông môn.', "He recommends you to the sect.")) ?? ''}`);
          return tr('Trưởng lão thưởng cho bốn mươi linh thạch rồi phẩy tay cho lui.', "The elder rewards you forty spirit stones and waves you off.");
        },
      },
      {
        label: tr('Kệ, quét tiếp', "Ignore it, keep sweeping"),
        lean: 'trung',
        run: (c) => {
          stat(c, 'tamCanh', 2);
          return tr('Bạn quét tiếp. Có những cơ duyên đến rồi đi như lá rụng.', "You keep sweeping. Some opportunities come and go like falling leaves.");
        },
      },
    ],
  },
  {
    id: 'viec_vat_ngoai_mon',
    minAge: 10,
    weight: 8,
    cooldown: 8,
    when: (c) => rankOf(c) === 1,
    title: tr('Việc vặt của ngoại môn', "Outer sect chores"),
    text: (c) =>
      sectSide(c) === 'ta'
        ? tr(`Hộ pháp nội đường sai bạn đi thu "tiền bảo kê" ở trấn dưới núi. Ai không nộp thì... tùy bạn.`, "An inner-hall enforcer sends you to collect \"protection money\" in the town below the mountain. Whoever won't pay... is up to you.")
        : tr(`Sư huynh nội môn ném cho bạn một xấp nhiệm vụ: gánh nước, canh lò đan, trông dược viên. Hắn còn cười: "Ngoại môn thì biết thân biết phận."`, "An inner-sect senior brother tosses you a stack of tasks: haul water, mind the pill furnace, tend the herb garden. He even sneers: \"Outer disciples should know their place.\""),
    choices: (c) =>
      sectSide(c) === 'ta'
        ? [
            {
              label: tr('Thu đủ, ai chống thì đánh', "Collect it all, beat whoever resists"),
              hint: tr('linh thạch, nghiêng tà', "spirit stones, leans evil"),
              lean: 'ta',
              run: (ch) => {
                dao(ch, -6);
                money(ch, 120);
                return tr('Bạn mang về một trăm hai mươi linh thạch và tiếng xấu khắp trấn.', "You bring back a hundred and twenty spirit stones and a bad name all over town.");
              },
            },
            {
              label: tr('Tha cho người nghèo, tự bù tiền', "Spare the poor, pay for them yourself"),
              hint: tr('mất tiền, nghiêng chính', "lose money, leans righteous"),
              lean: 'chinh',
              run: (ch) => {
                dao(ch, 6);
                money(ch, -60);
                return tr('Bạn tự bỏ tiền túi nộp thay. Hộ pháp nhìn bạn rất lâu, không nói gì.', "You pay out of your own pocket on their behalf. The enforcer looks at you for a long time and says nothing.");
              },
            },
          ]
        : [
            {
              label: tr('Làm cho xong, không than', "Just get it done, no complaints"),
              hint: tr('tâm cảnh +', "Mind +"),
              lean: 'chinh',
              run: (ch) => {
                stat(ch, 'tamCanh', 5);
                addCult(ch, reward(ch, 0.3));
                return tr('Gánh nước mãi, bạn chợt ngộ ra chút đạo lý về nhịp thở.', "Hauling water over and over, you suddenly grasp a little truth about breathing.");
              },
            },
            {
              label: tr('Thách sư huynh tỷ thí', "Challenge the senior brother to a duel"),
              hint: tr('thắng thì được nể, thua thì nhục', "win: respect, lose: humiliation"),
              lean: 'trung',
              run: (ch, ctx) => {
                if (ctx.rnd() < 0.45) {
                  stat(ch, 'khiVan', 4);
                  return tr(`Bạn hạ hắn trước mặt cả ngoại môn. ${promote(ch, ctx, tr('Chuyện đến tai chấp sự.', "Word reaches the deacon.")) ?? ''}`, `You beat him in front of the whole outer sect. ${promote(ch, ctx, tr('Chuyện đến tai chấp sự.', "Word reaches the deacon.")) ?? ''}`);
                }
                stat(ch, 'sucKhoe', -12);
                stat(ch, 'tamMa', 5);
                return tr('Bạn bị đánh bầm dập, còn phải làm thêm việc của hắn một tháng.', "You get beaten black and blue, and have to do his chores for a month on top.");
              },
            },
          ],
  },
  {
    id: 'tang_kinh_cac',
    minAge: 12,
    minRealm: 1,
    weight: 7,
    cooldown: 10,
    when: (c) => rankOf(c) === 2,
    title: tr('Tàng Kinh Các', "Scripture Pavilion"),
    text: (c) => tr(`Là ${rankName(c)}, bạn được vào ${sectSide(c) === 'ta' ? tr('Huyết Kinh Động', "Blood Scripture Cave") : tr('Tàng Kinh Các', "Scripture Pavilion")} một tháng. Ba kệ sách, chỉ kịp đọc một.`, `As a ${rankName(c)}, you're allowed into the ${sectSide(c) === 'ta' ? tr('Huyết Kinh Động', "Blood Scripture Cave") : tr('Tàng Kinh Các', "Scripture Pavilion")} for one month. Three shelves of books, time to read only one.`),
    choices: () => [
      {
        label: tr('Kệ công pháp', "Technique shelf"),
        hint: tr('tu vi', "cultivation"),
        lean: 'trung',
        run: (c) => {
          addCult(c, reward(c, 0.8));
          return tr('Bạn chép lại một bộ tâm pháp thượng thừa, chân khí lưu chuyển nhanh hẳn.', "You copy down a superior mental technique, and your true qi flows much faster.");
        },
      },
      {
        label: tr('Kệ y thư, đan phương', "Medicine and pill recipe shelf"),
        hint: tr('đan dược', "pills"),
        lean: 'chinh',
        run: (c) => {
          addPill(c, 'hoi_xuan');
          addPill(c, 'thanh_tam');
          return tr('Bạn học được hai đan phương, luyện thử thành công ngay lần đầu.', "You learn two pill recipes and succeed on your very first try.");
        },
      },
      {
        label: tr('Tầng cấm, không ai được lên', "Forbidden floor, no entry"),
        hint: tr('liều', "risky"),
        lean: 'ta',
        run: (c, ctx) => {
          if (ctx.rnd() < 0.5) {
            stat(c, 'ngoTinh', 12);
            stat(c, 'tamMa', 8);
            return tr('Bạn đọc trộm được một trang cấm thư. Đầu óc sáng ra, nhưng đêm nào cũng nghe tiếng thì thầm.', "You sneak a read of one page of a forbidden text. Your mind clears, but every night you hear whispers.");
          }
          const f = fatal(c, ctx, 0.15, tr('Cấm chế tầng cao nhất Tàng Kinh Các kích hoạt. Người ta chỉ tìm thấy tro.', "The restriction on the top floor of the Scripture Pavilion activates. All they find is ash."));
          if (c.dead) return tr('Bạn chạm vào cấm chế.', "You touch the restriction.") + f;
          stat(c, 'sucKhoe', -20);
          c.sectRank = 1;
          return tr(`Bạn bị bắt quả tang, giáng xuống ${rankName(c)}.${f ?? ''}`, `You're caught red-handed and demoted to ${rankName(c)}.${f ?? ''}`);
        },
      },
    ],
  },
  {
    id: 'su_phu_chi_diem',
    minAge: 14,
    minRealm: 1,
    weight: 7,
    cooldown: 12,
    when: (c) => rankOf(c) === 3,
    title: tr('Sư phụ chỉ điểm', "Master's guidance"),
    text: (c) =>
      sectSide(c) === 'ta'
        ? tr(`Lão tổ ${c.sect} gọi bạn vào huyết trì: "Muốn mạnh hơn, phải trả giá. Ngươi chọn đi."`, `The Patriarch of ${nameOf(c.sect)} calls you into the blood pool: "To grow stronger, you must pay a price. Choose."`)
        : tr(`Sư phụ ở ${c.sect} gọi bạn lên đỉnh núi lúc bình minh: "Hôm nay ta dạy con một điều. Con muốn học gì?"`, `Your Master at ${nameOf(c.sect)} calls you to the mountaintop at dawn: "Today I will teach you one thing. What would you learn?"`),
    choices: (c) => [
      {
        label: sectSide(c) === 'ta' ? tr('Tắm huyết trì', "Bathe in the blood pool") : tr('Học kiếm', "Learn the sword"),
        hint: tr('tu vi lớn', "big cultivation"),
        lean: sectSide(c) === 'ta' ? 'ta' : 'trung',
        run: (ch) => {
          addCult(ch, reward(ch, 1.2));
          if (sectSide(ch) === 'ta') stat(ch, 'tamMa', 6);
          return sectSide(ch) === 'ta'
            ? tr('Máu sôi sùng sục, xương cốt bạn nứt ra rồi liền lại, mạnh hơn trước.', "The blood boils and bubbles; your bones crack and knit back together, stronger than before.")
            : tr('Một kiếm của sư phụ chém đôi mây trời. Bạn nhìn mãi, đến khi trong đầu chỉ còn đường kiếm ấy.', "One sword stroke from your Master cleaves the clouds in two. You stare until that single stroke is all that's left in your mind.");
        },
      },
      {
        label: tr('Học tâm pháp tĩnh tâm', "Learn a heart-calming technique"),
        hint: tr('tâm ma giảm', "heart demon down"),
        lean: 'chinh',
        run: (ch) => {
          stat(ch, 'tamMa', -15);
          stat(ch, 'tamCanh', 6);
          return tr('Sư phụ ngồi cùng bạn đến tận hoàng hôn, không nói một lời. Lòng bạn tĩnh như mặt hồ.', "Your Master sits with you until dusk without a word. Your heart grows still as a lake.");
        },
      },
      {
        label: tr('Xin một viên Trúc Cơ Đan', "Ask for a Foundation Pill"),
        hint: tr('đan dược đột phá', "breakthrough pill"),
        lean: 'trung',
        run: (ch) => {
          addPill(ch, 'truc_co');
          return tr('Sư phụ cười, ném cho bạn một bình ngọc: "Tham lam. Nhưng giống ta hồi trẻ."', "Your Master laughs and tosses you a jade bottle: \"Greedy. But just like me when I was young.\"");
        },
      },
    ],
  },
];
