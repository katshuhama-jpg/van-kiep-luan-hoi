import { addCult, addLife, addPill, dao, fatal, giveItem, money, reward, stat } from './helpers';
import { realmName } from './data';
import type { GameEvent } from './types';
import { tr } from '../i18n';

/**
 * Sự kiện sau phi thăng. Tiên giới: thiên quy, Bàn Đào hội, hạ phàm, tiên ma đại chiến.
 * Ma giới: tranh ngôi, huyết hải, phản đồ, đánh lên thiên đình.
 * Sự kiện phàm giới không còn xảy ra sau phi thăng.
 */
export const COSMOS_EVENTS: GameEvent[] = [
  // ---------------- Tiên giới ----------------
  {
    id: 'tien_nam_thien_mon',
    cosmos: 'tien',
    once: true,
    weight: 60,
    title: tr('Nam Thiên Môn', "The Southern Heavenly Gate"),
    text: () => tr('Bạn vừa phi thăng, áo còn vương khói lôi kiếp. Thiên binh ở Nam Thiên Môn chặn lại: "Tiên nhân mới lên phải ghi danh. Ngươi muốn vào bộ nào?"', "You have just ascended, robes still wreathed in tribulation smoke. A heavenly soldier at the Southern Heavenly Gate stops you: \"Newly ascended immortals must register. Which ministry do you wish to join?\""),
    choices: () => [
      {
        label: tr('Vào Lôi Bộ, chuyên giáng sét phạt kẻ ác', "Join the Ministry of Thunder, smiting the wicked"),
        hint: tr('công +, đạo tâm +', "Attack +, Dao Heart +"),
        lean: 'chinh',
        run: (c) => {
          dao(c, 8);
          addCult(c, reward(c, 0.6));
          return tr('Bạn nhận lệnh bài Lôi Bộ. Lần đầu cầm búa sét, tay còn run.', "You receive the Ministry of Thunder's token. Holding the thunder hammer for the first time, your hand still trembles.");
        },
      },
      {
        label: tr('Vào Dược Viên, trông vườn tiên thảo', "Join the Herb Garden, tending immortal herbs"),
        hint: tr('đan dược', "pills"),
        lean: 'trung',
        run: (c) => {
          addPill(c, 'dien_tho');
          addPill(c, 'hoi_xuan', 2);
          return tr('Việc nhàn, lại được hái lén vài cây tiên thảo. Bạn bắt đầu thấy tiên giới cũng không tệ.', "An easy job, plus a few immortal herbs pocketed on the sly. You start to think the Immortal Realm isn't so bad.");
        },
      },
      {
        label: tr('Không ghi danh, làm tán tiên tự do', "Don't register - be a free loose immortal"),
        hint: tr('khí vận +, có thể bị làm khó', "Luck +, may be hassled"),
        lean: 'trung',
        run: (c, ctx) => {
          stat(c, 'khiVan', 8);
          if (ctx.rnd() < 0.4) {
            stat(c, 'sucKhoe', -20);
            return tr('Thiên binh không vui, cho bạn một trận "dạy dỗ" rồi mới thả đi. Tự do cũng có giá.', "The heavenly soldier is not pleased and gives you a \"lesson\" before letting you go. Freedom has its price.");
          }
          return tr('Bạn mỉm cười đi thẳng. Tiên giới rộng lớn, đâu cũng là nhà.', "You smile and walk straight on. The Immortal Realm is vast; anywhere can be home.");
        },
      },
    ],
  },
  {
    id: 'tien_ban_dao',
    cosmos: 'tien',
    weight: 8,
    cooldown: 25,
    title: tr('Bàn Đào hội', "The Peach Banquet"),
    text: () => tr('Tây Vương Mẫu mở Bàn Đào hội. Đào ba nghìn năm mới chín một lần, ăn một quả thọ thêm vạn tuổi. Bạn không có thiệp mời.', "The Queen Mother of the West is holding the Peach Banquet. The peaches ripen once every three thousand years, and one adds ten thousand years of life. You have no invitation."),
    choices: () => [
      {
        label: tr('Xin làm người hầu rượu để vào', "Sign on as a wine server to get in"),
        hint: tr('thọ nguyên +, an toàn', "lifespan +, safe"),
        lean: 'chinh',
        run: (c) => {
          addLife(c, 30);
          return tr('Bạn bưng rượu suốt ba ngày, cuối buổi được thưởng nửa quả đào. Thọ nguyên thêm 30 năm.', "You serve wine for three days and are rewarded half a peach at the end. Lifespan +30 years.");
        },
      },
      {
        label: tr('Lẻn vào vườn đào hái trộm', "Sneak into the orchard and steal some"),
        hint: tr('thọ nguyên ++, rủi ro lớn', "lifespan ++, high risk"),
        lean: 'ta',
        run: (c, ctx) => {
          dao(c, -10);
          if (ctx.rnd() < 0.55) {
            addLife(c, 80);
            addCult(c, reward(c, 1));
            return tr('Bạn nuốt chửng ba quả đào chín đỏ rồi chuồn mất. Thọ nguyên thêm 80 năm, tu vi tăng vọt. Thiên đình đang truy tìm kẻ trộm.', "You wolf down three ripe red peaches and slip away. Lifespan +80 years, cultivation soars. The Heavenly Court is hunting for the thief.");
          }
          const f = fatal(c, ctx, 0.25, tr('Thiên binh bắt quả tang bạn trong vườn đào. Tội trộm đào tiên, chém đầu răn chúng.', "Heavenly soldiers catch you red-handed in the orchard. The crime of stealing immortal peaches: beheading, as a warning to all."));
          if (c.dead) return tr('Bạn bị bắt.', "You are caught.") + f;
          stat(c, 'sucKhoe', -40);
          return tr(`Bạn bị bắt, ăn ba trăm roi tiên trượng.${f ?? ''}`, `You are caught and take three hundred lashes of the immortal staff.${f ?? ''}`);
        },
      },
      {
        label: tr('Không đi, bế quan', "Don't go - seclusion"),
        hint: tr('tu vi', "cultivation"),
        lean: 'trung',
        run: (c) => {
          addCult(c, reward(c, 0.8));
          return tr('Ngoài kia tiên nhạc vang trời, trong động phủ bạn chỉ nghe tiếng chân khí lưu chuyển.', "Outside, immortal music fills the sky; inside your cave abode, you hear only the flow of true qi.");
        },
      },
    ],
  },
  {
    id: 'tien_ha_pham',
    cosmos: 'tien',
    weight: 8,
    cooldown: 30,
    title: tr('Ngoảnh lại nhân gian', "Looking Back at the Mortal World"),
    text: (c) =>
      tr(`Từ mép mây nhìn xuống, nhân gian đã qua ${Math.max(1, Math.floor(c.age - (c.ascendAge ?? c.age)))} năm. Nơi bạn từng sống${c.partner ? tr(`, mộ ${c.partner} đã phủ rêu xanh`, `, and ${c.partner}'s grave is covered in green moss`) : ''}. Con cháu đời sau đang gặp nạn hạn hán.`, `From the edge of the clouds you look down: ${Math.max(1, Math.floor(c.age - (c.ascendAge ?? c.age)))} years have passed in the mortal world. The place you once lived has long changed${c.partner ? tr(`, mộ ${c.partner} đã phủ rêu xanh`, `, and ${c.partner}'s grave is covered in green moss`) : ''}. Your distant descendants are suffering a drought.`),
    choices: () => [
      {
        label: tr('Hạ phàm làm mưa cứu dân', "Descend and bring rain to save the people"),
        hint: tr('đạo tâm ++, phạm thiên quy', "Dao Heart ++, breaks heavenly law"),
        lean: 'chinh',
        run: (c, ctx) => {
          dao(c, 15);
          stat(c, 'tamCanh', 10);
          if (ctx.rnd() < 0.15) {
            c.dead = true;
            c.endTag = 'giang_tran';
            c.cause = tr('Tự ý hạ phàm làm mưa, phạm thiên quy, bị giáng xuống trần làm người phàm', "Descended without permission to bring rain, broke the laws of heaven, and was banished to live as a mortal");
            ctx.fx('death', tr('Giáng trần', "Banished"));
            return tr('Mưa xuống, đồng ruộng xanh lại. Nhưng Thiên đình không tha. Bạn bị tước tiên tịch, giáng xuống trần. Kiếp sau, bạn sẽ đầu thai với ký ức tiên nhân.', "The rain falls and the fields turn green again. But the Heavenly Court shows no mercy. You are stripped of your immortal status and banished to the mortal world. Next life, you will be reborn with an immortal's memories.");
          }
          return tr('Mưa xuống ba ngày ba đêm. Dân làng lập miếu thờ một vị tiên không rõ tên. Thiên đình nhắm mắt cho qua.', "It rains for three days and three nights. The villagers build a shrine to a nameless immortal. The Heavenly Court looks the other way.");
        },
      },
      {
        label: tr('Để lại một giấc mộng chỉ đường', "Send a guiding dream"),
        hint: tr('tâm cảnh +', "Mind +"),
        lean: 'chinh',
        run: (c) => {
          stat(c, 'tamCanh', 6);
          dao(c, 5);
          return tr('Đêm ấy, một đứa cháu đời thứ mười mơ thấy người mặc áo trắng chỉ về phía mạch nước ngầm.', "That night, a tenth-generation descendant dreams of a figure in white pointing toward an underground spring.");
        },
      },
      {
        label: tr('Tiên phàm cách biệt, quay đi', "Immortals and mortals are apart - turn away"),
        hint: tr('tu vi', "cultivation"),
        lean: 'trung',
        run: (c) => {
          addCult(c, reward(c, 0.5));
          stat(c, 'tamCanh', -3);
          return tr('Bạn quay lưng. Tiên nhân không nên vướng bận trần duyên. Chỉ là đêm đó tu luyện không yên.', "You turn your back. An immortal should not cling to mortal ties. Only, your cultivation is restless that night.");
        },
      },
    ],
  },
  {
    id: 'tien_thien_quy',
    cosmos: 'tien',
    weight: 7,
    cooldown: 20,
    title: tr('Thiên quy', "Heavenly Law"),
    text: () => tr('Một tiên nữ bị phạt quỳ ở Dao Trì vì yêu một người phàm. Nàng ngước nhìn bạn, không cầu xin, chỉ hỏi: "Yêu người thì có tội sao?"', "A fairy is forced to kneel at the Jade Pool as punishment for loving a mortal. She looks up at you, not begging, only asking: \"Is it a crime to love someone?\""),
    choices: () => [
      {
        label: tr('Lên tiếng xin tha cho nàng', "Speak up and plead for her"),
        hint: tr('đạo tâm +, có thể bị phạt', "Dao Heart +, may be punished"),
        lean: 'chinh',
        run: (c, ctx) => {
          dao(c, 10);
          if (ctx.rnd() < 0.5) {
            stat(c, 'khiVan', 6);
            return tr('Ngọc Đế nể lời, giảm án cho nàng. Từ đó tiên giới truyền tai nhau tên bạn.', "The Jade Emperor heeds your words and lightens her sentence. From then on, your name spreads through the Immortal Realm.");
          }
          stat(c, 'sucKhoe', -25);
          c.cultivation = Math.round(c.cultivation * 0.8);
          return tr('Bạn bị phạt cùng, quỳ bảy ngày ở Dao Trì. Tu vi tổn hao, nhưng lòng không hối hận.', "You are punished with her, kneeling seven days at the Jade Pool. Your cultivation suffers, but your heart has no regrets.");
        },
      },
      {
        label: tr('Lặng lẽ đưa cho nàng một viên đan', "Quietly slip her a pill"),
        hint: tr('nhẹ nhàng', "gentle"),
        lean: 'chinh',
        run: (c) => {
          stat(c, 'tamCanh', 5);
          return tr('Nàng nắm chặt viên đan, mắt đỏ hoe. Bạn đi tiếp, không ai thấy.', "She clutches the pill, eyes red. You walk on, and no one sees.");
        },
      },
      {
        label: tr('Thiên quy là thiên quy', "Heavenly law is heavenly law"),
        hint: tr('tâm ma +', "heart demon +"),
        lean: 'trung',
        run: (c) => {
          stat(c, 'tamMa', 5);
          addCult(c, reward(c, 0.4));
          return tr('Bạn bước qua. Phía sau, tiếng nàng khóc nhỏ dần.', "You walk past. Behind you, her sobs fade away.");
        },
      },
    ],
  },
  {
    id: 'tien_ma_chien',
    cosmos: 'both',
    weight: 7,
    cooldown: 35,
    minAge: 0,
    title: tr('Tiên Ma đại chiến', "The Immortal-Demon War"),
    text: (c) =>
      c.cosmos === 'hu'
        ? tr('Tiên Ma giao chiến ngay rìa Thái Hư. Cả hai bên đều muốn kéo bạn vào. Bạn đứng giữa hai làn đạn.', "Immortals and demons clash at the edge of the Great Void. Both sides want to drag you in. You're caught in the crossfire.")
        : c.cosmos === 'ma'
        ? tr('Ma Đế hạ lệnh đánh lên Thiên đình. Trăm vạn ma binh đứng chờ ở Cửa Cửu U. Ngươi đi tiên phong chứ?', "The Demon Emperor orders an assault on the Heavenly Court. A million demon soldiers wait at the Gate of the Nine Netherworlds. Will you lead the vanguard?")
        : tr('Ma giới tràn qua giới tuyến. Thiên đình gióng trống tụ tướng, mọi tiên nhân phải ra trận.', "The Demon Realm floods across the border. The Heavenly Court beats the war drums, and every immortal must go to battle."),
    choices: (c) => [
      {
        label: c.cosmos === 'ma' ? tr('Dẫn ma binh đánh tiên phong', "Lead the demon vanguard") : tr('Xông lên tuyến đầu', "Charge the front line"),
        hint: tr('tu vi lớn, có thể chết', "big cultivation, may die"),
        lean: c.cosmos === 'ma' ? 'ta' : 'chinh',
        run: (ch, ctx) => {
          const f = fatal(
            ch,
            ctx,
            0.2,
            ch.cosmos === 'ma' ? tr('Bạn bị Lôi Bộ vây đánh trước Nam Thiên Môn. Ma hồn tan thành tro dưới vạn đạo sét.', "The Ministry of Thunder surrounds you before the Southern Heavenly Gate. Your demon soul turns to ash under ten thousand bolts of lightning.") : tr('Bạn ngã xuống trên chiến trường Tiên Ma, giữa biển máu và tiên quang.', "You fall on the Immortal-Demon battlefield, amid a sea of blood and immortal light."),
          );
          if (ch.dead) {
            ch.endTag = 'tu_tran';
            return tr('Trận chiến kéo dài bảy ngày.', "The battle rages for seven days.") + f;
          }
          addCult(ch, reward(ch, 2));
          stat(ch, 'sucKhoe', -30);
          dao(ch, ch.cosmos === 'ma' ? -10 : 10);
          return tr(`Bạn chém tướng đoạt cờ, công lao đứng đầu. Tu vi tăng vọt.${f ?? ''}`, `You slay generals and seize banners, earning top merit. Your cultivation soars.${f ?? ''}`);
        },
      },
      {
        label: tr('Giữ hậu phương, chữa thương binh', "Hold the rear, heal the wounded"),
        hint: tr('an toàn, đạo tâm +', "safe, Dao Heart +"),
        lean: 'chinh',
        run: (ch) => {
          dao(ch, 6);
          addCult(ch, reward(ch, 0.6));
          return tr('Bạn cứu được hàng trăm người. Chiến công không vang dội, nhưng ai cũng nhớ ơn.', "You save hundreds. Your deeds are not glorious, but everyone remembers your kindness.");
        },
      },
      {
        label: tr('Đứng ngoài, chờ ngư ông đắc lợi', "Stay out and reap the spoils"),
        hint: tr('linh thạch, mất uy tín', "spirit stones, lose prestige"),
        lean: 'ta',
        run: (ch) => {
          money(ch, 3000);
          dao(ch, -8);
          return tr('Hai bên đánh nhau tơi bời, bạn lặng lẽ nhặt bảo vật trên chiến trường. Giàu to, nhưng cả hai giới đều khinh bạn.', "While both sides tear each other apart, you quietly loot treasures from the battlefield. You get rich, but both realms despise you.");
        },
      },
    ],
  },
  {
    id: 'tien_kim_long_ly',
    cosmos: 'tien',
    weight: 6,
    cooldown: 40,
    title: tr('Vảy rồng rơi', "Falling Dragon Scale"),
    text: () => tr('Thái Cổ Kim Long lột vảy trên Long Cung Thiên Thượng. Một mảnh vảy vàng rơi xuống ngay trước mặt bạn, còn nóng hổi.', "The Ancient Golden Dragon is shedding scales above the Celestial Dragon Palace. A golden scale lands right in front of you, still hot."),
    choices: () => [
      {
        label: tr('Nhặt lấy, đem rèn', "Pick it up and forge it"),
        hint: tr('thần binh', "divine weapon"),
        lean: 'trung',
        run: (c, ctx) => {
          giveItem(c, 'kim_long_lan_kiem', false);
          ctx.fx('layer', tr('Kim Long Lân kiếm', "Golden Dragon Scale Sword"));
          return tr('Bạn mang mảnh vảy tới lò rèn của Thái Thượng Lão Quân. Bốn mươi chín ngày sau, Kim Long Lân kiếm ra lò. Mở Túi đồ để dùng.', "You bring the scale to Taishang Laojun's forge. Forty-nine days later, the Golden Dragon Scale Sword is born. Open your Inventory to use it.");
        },
      },
      {
        label: tr('Trả lại cho Kim Long', "Return it to the Golden Dragon"),
        hint: tr('khí vận ++', "Luck ++"),
        lean: 'chinh',
        run: (c) => {
          stat(c, 'khiVan', 15);
          dao(c, 5);
          return tr('Kim Long nhìn bạn rất lâu rồi gật đầu. Từ đó mây lành theo bạn mỗi bước.', "The Golden Dragon gazes at you for a long time, then nods. From then on, auspicious clouds follow your every step.");
        },
      },
    ],
  },
  // ---------------- Ma giới ----------------
  {
    id: 'ma_huyet_hai',
    cosmos: 'ma',
    once: true,
    weight: 60,
    // 3.1.0: thay bằng chuỗi nhập Ma giới (Nhận chủ), giữ lại để gia phả cũ còn đọc được
    when: () => false,
    title: tr('Bờ Huyết Hải', "Shore of the Blood Sea"),
    text: (c) => tr(`Bạn bước qua cửa Ma giới. Trước mặt là Huyết Hải mênh mông, sóng đỏ như máu. Ba vị ma chúa đang chờ xem ${realmName(c.realm, 'ma')} mới tới đứng về phe ai.`, `You step through the gate of the Demon Realm. Before you stretches the vast Blood Sea, its waves red as blood. Three demon lords wait to see whose side the new ${realmName(c.realm, 'ma')} will take.`),
    choices: () => [
      {
        label: tr('Theo Huyết Ma Chúa, kẻ mạnh nhất', "Follow the Blood Demon Lord, the strongest"),
        hint: tr('tu vi +, tâm ma +', "cultivation +, heart demon +"),
        lean: 'ta',
        run: (c) => {
          addCult(c, reward(c, 0.8));
          stat(c, 'tamMa', 6);
          return tr('Huyết Ma Chúa cười lớn, rót cho bạn một chén huyết tửu. Chén rượu cháy bỏng tận xương.', "The Blood Demon Lord laughs loudly and pours you a cup of blood wine. It burns down to your bones.");
        },
      },
      {
        label: tr('Không theo ai, tự lập một phương', "Follow no one, carve out your own domain"),
        hint: tr('khí vận +, nguy hiểm', "Luck +, dangerous"),
        lean: 'trung',
        run: (c, ctx) => {
          stat(c, 'khiVan', 10);
          if (ctx.rnd() < 0.35) {
            stat(c, 'sucKhoe', -30);
            return tr('Cả ba ma chúa đều sai người tới "thăm hỏi". Bạn sống sót, nhưng thân thể đầy vết thương.', "All three demon lords send people to \"pay their respects\". You survive, but your body is covered in wounds.");
          }
          money(c, 1500);
          return tr('Bạn chiếm một hòn đảo giữa Huyết Hải, xưng vương một cõi. Ma giới bắt đầu nhắc tên bạn.', "You seize an island in the Blood Sea and proclaim yourself its king. The Demon Realm begins to speak your name.");
        },
      },
      {
        label: tr('Tìm đường quay về', "Look for a way back"),
        hint: tr('đạo tâm +', "Dao Heart +"),
        lean: 'chinh',
        run: (c) => {
          dao(c, 20);
          stat(c, 'tamMa', -10);
          return tr('Bạn quay lưng với Huyết Hải. Đường về không có, nhưng lòng bạn lần đầu thấy nhẹ.', "You turn your back on the Blood Sea. There is no way back, but for the first time your heart feels light.");
        },
      },
    ],
  },
  {
    id: 'ma_tranh_ngoi',
    cosmos: 'ma',
    weight: 8,
    cooldown: 20,
    title: tr('Tranh ngôi ma chúa', "Contest for the Demon Throne"),
    text: () => tr('Một ma chúa già yếu đi. Trăm ma vương rình rập ngai vàng xương trắng. Đây là cơ hội.', "An old demon lord is weakening. A hundred demon kings eye the throne of white bone. This is your chance."),
    choices: () => [
      {
        label: tr('Ra tay đoạt ngôi', "Strike and seize the throne"),
        hint: tr('tu vi ++, có thể chết', "cultivation ++, may die"),
        lean: 'ta',
        run: (c, ctx) => {
          const f = fatal(c, ctx, 0.22, tr('Bạn bị chính thuộc hạ đâm sau lưng khi vừa ngồi lên ngai xương. Ma giới không có lòng trung thành.', "Your own subordinate stabs you in the back the moment you sit on the bone throne. The Demon Realm knows no loyalty."));
          if (c.dead) return tr('Bạn ra tay.', "You strike.") + f;
          addCult(c, reward(c, 1.8));
          dao(c, -10);
          money(c, 2000);
          return tr(`Bạn chém ma chúa già, ngồi lên ngai xương. Trăm ma vương quỳ xuống.${f ?? ''}`, `You cut down the old demon lord and take the bone throne. A hundred demon kings kneel.${f ?? ''}`);
        },
      },
      {
        label: tr('Đứng sau giật dây', "Pull the strings from behind"),
        hint: tr('linh thạch, an toàn', "spirit stones, safe"),
        lean: 'ta',
        run: (c) => {
          money(c, 1200);
          stat(c, 'tamMa', 4);
          return tr('Bạn bán tin cho cả ba phe. Ai thắng cũng nợ bạn một ân tình.', "You sell information to all three factions. Whoever wins owes you a favor.");
        },
      },
      {
        label: tr('Bảo vệ ma chúa già', "Protect the old demon lord"),
        hint: tr('đạo tâm +', "Dao Heart +"),
        lean: 'chinh',
        run: (c) => {
          dao(c, 12);
          stat(c, 'sucKhoe', -20);
          return tr('Bạn đứng chắn trước ngai. Ma chúa già nhìn bạn, lần đầu tiên trong vạn năm biết cảm động.', "You stand before the throne as a shield. The old demon lord looks at you, moved for the first time in ten thousand years.");
        },
      },
    ],
  },
  {
    id: 'ma_tam_ma_kiep',
    cosmos: 'ma',
    weight: 7,
    cooldown: 25,
    title: tr('Tâm ma vạn kiếp', "Heart Demon of Ten Thousand Lives"),
    text: () => tr('Ở Ma giới, tâm ma không ở trong lòng mà đứng ngay trước mặt. Nó mang khuôn mặt của tất cả những người bạn từng giết.', "In the Demon Realm, the heart demon is not within you but standing right in front of you. It wears the faces of everyone you've ever killed."),
    choices: () => [
      {
        label: tr('Nuốt chửng tâm ma', "Devour the heart demon"),
        hint: tr('tu vi ++, tâm ma ++', "cultivation ++, heart demon ++"),
        lean: 'ta',
        run: (c) => {
          addCult(c, reward(c, 1.5));
          stat(c, 'tamMa', 20);
          return tr('Bạn nuốt nó vào. Sức mạnh dâng trào, và giọng nói trong đầu bạn đông hơn.', "You swallow it. Power surges through you, and the voices in your head grow more numerous.");
        },
      },
      {
        label: tr('Đối diện từng khuôn mặt', "Face each face"),
        hint: tr('tâm ma giảm mạnh', "heart demon greatly reduced"),
        lean: 'chinh',
        run: (c) => {
          stat(c, 'tamMa', -30);
          dao(c, 10);
          return tr('Bạn nhìn từng người một, nhớ lại tên họ. Tâm ma nhạt dần, rồi tan như sương.', "You look at each of them, remembering their names. The heart demon fades, then dissolves like mist.");
        },
      },
    ],
  },
  {
    id: 'ma_phan_do',
    cosmos: 'ma',
    weight: 6,
    cooldown: 30,
    title: tr('Ma binh làm phản', "The Demon Army Rebels"),
    text: () => tr('Đêm Huyết Nguyệt, ma binh dưới trướng bạn nổi loạn. Kẻ cầm đầu là phó tướng bạn tin nhất.', "On the night of the Blood Moon, the demon soldiers under you revolt. Their leader is your most trusted lieutenant."),
    choices: () => [
      {
        label: tr('Giết sạch, răn đe', "Kill them all as a warning"),
        hint: tr('tu vi +, đạo tâm --', "cultivation +, Dao Heart --"),
        lean: 'ta',
        run: (c) => {
          dao(c, -12);
          addCult(c, reward(c, 0.8));
          return tr('Huyết Hải đỏ thêm một màu. Từ đó không ai dám ngẩng đầu trước mặt bạn.', "The Blood Sea turns a shade redder. From then on, no one dares raise their head before you.");
        },
      },
      {
        label: tr('Tha cho kẻ bị ép theo', "Spare those who were forced"),
        hint: tr('đạo tâm +, có thể bị đánh lén', "Dao Heart +, may be ambushed"),
        lean: 'chinh',
        run: (c, ctx) => {
          dao(c, 10);
          if (ctx.rnd() < 0.3) {
            stat(c, 'sucKhoe', -30);
            return tr('Một kẻ được tha quay lại đâm bạn một nhát. Ma giới là vậy.', "One you spared turns back and stabs you. That's the Demon Realm.");
          }
          stat(c, 'khiVan', 6);
          return tr('Những kẻ được tha quỳ rạp, thề chết theo bạn. Lần này họ giữ lời.', "Those you spared prostrate themselves and swear to follow you unto death. This time, they keep their word.");
        },
      },
    ],
  },
];
