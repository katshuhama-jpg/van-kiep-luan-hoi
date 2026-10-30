import { genName } from './engine';
import { eventDuel } from './duel';
import { addCult, atAge, dao, fatal, hurt, luck, markDeath, money, reward, stat } from './helpers';
import { hhSect, isHH, joinSect, leaveSect, promote, rankName, rankOf } from './sect';
import type { Character, Choice, EffectCtx, GameEvent } from './types';
import { tr } from '../i18n';

/**
 * 4.1.0: Hợp Hoan Tông, tông tà thứ ba. 15 sự kiện nối nhau theo trạng thái c.hh:
 * lo (số lô đỉnh), thu (người từng bị hút), tinh (người thật lòng), rival (đối thủ trong tông), bo (đã bỏ tông).
 * Song tu ở đây là trao đổi chân khí, mị thuật, mưu kế - kiểu tiên hiệp đại chúng.
 */

const hh = (c: Character) => (c.hh ??= { lo: 0, thu: [] });
const inHH = (c: Character) => isHH(c) && !c.cosmos;
const age = (c: Character) => Math.floor(c.age);
const other = (c: Character): 'nam' | 'nu' => (c.gender === 'nu' ? 'nam' : 'nu');
/** tên một người cho sự kiện, giữ nguyên giữa text và lựa chọn nhờ seed */
function nameFor(c: Character, seed: number, g: 'nam' | 'nu' = other(c)): string {
  let x = Math.floor(Math.abs(seed * 7919 + (c.lookSeed ?? 0))) % 2147483646 || 1;
  return genName(g, () => {
    x = (x * 16807) % 2147483647;
    return x / 2147483647;
  });
}

/** Thêm một lô đỉnh; hút cạn thì người ấy nhớ tên bạn */
function addLo(c: Character, victim: string | null) {
  const h = hh(c);
  h.lo += 1;
  h.loAt = age(c);
  if (victim) {
    h.thu = [...h.thu.filter((x) => x !== victim), victim];
    if (h.thuAt === undefined) h.thuAt = age(c);
  }
}
function dropThu(c: Character, name: string) {
  const h = hh(c);
  h.thu = h.thu.filter((x) => x !== name);
  h.thuAt = h.thu.length ? age(c) : undefined;
}
/** giao đấu trong sự kiện, đối thủ có tên cho trước */
function duel(c: Character, ctx: EffectCtx, realm: number, name: string) {
  const d = eventDuel(c, realm, ctx.rnd);
  return { result: d.result, name };
}
/** chết dưới tay người: gắn kết cục, nêu đích danh và tuổi */
function deadly(c: Character, ctx: EffectCtx, chance: number, tag: string, by: string, text: string): string | null {
  const f = fatal(c, ctx, chance, text + atAge(c));
  markDeath(c, tag, by);
  return f;
}
const lead = (t: string, f: string | null) => t + (f ?? '');

export const HH_EVENTS: GameEvent[] = [
  // 1. Bái sư
  {
    id: 'hh_bai_su',
    minAge: 16,
    minRealm: 1,
    maxRealm: 4,
    once: true,
    weight: 30,
    when: (c) => !c.sect && !c.cosmos && !c.hh?.bo && (c.daoTam <= -15 || !!c.qf?.hutCong),
    title: tr('Mị Cơ mời nhập môn', 'The Charm Lady\'s invitation'),
    text: () => tr('Một nữ nhân che mặt bằng lụa hồng chặn bạn bên hồ. Mùi hương làm đầu óc lâng lâng: "Ta là Mị Cơ của Hợp Hoan Tông. Ngươi có căn cốt hút người mà không biết dùng. Theo ta, ta dạy."', 'A woman veiled in pink silk stops you by the lake. Her perfume makes your head swim: "I am the Charm Lady of Hehuan Sect. You have the bones to drain others and no idea how to use them. Follow me, and I will teach you."'),
    choices: (c) => {
      const out: Choice[] = [
        {
          label: tr('Theo Mị Cơ về Hợp Hoan Cốc', 'Follow her to Hehuan Valley'),
          hint: tr('tà phái · song tu, mị thuật', 'evil · dual cultivation, charm arts'),
          lean: 'ta',
          run: (ch, ctx) => {
            joinSect(ch, hhSect(), ch.stats.tamCanh >= 50 ? 1 : 0);
            const h = hh(ch);
            h.at = age(ch);
            dao(ch, -8);
            ctx.fx('evil', hhSect());
            return tr(`Hợp Hoan Cốc quanh năm hoa đào. Mị Cơ cài cho bạn một cành hoa: "Từ nay ngươi là ${rankName(ch)}. Nhớ kỹ: ở đây tình là công cụ, không phải xiềng xích."`, `Peach blossoms bloom year-round in Hehuan Valley. The Charm Lady tucks a sprig into your hair: "From today you are a ${rankName(ch)}. Remember: here love is a tool, not a chain."`);
          },
        },
        {
          label: tr('Từ chối, quay đi', 'Refuse and walk away'),
          lean: 'trung',
          run: (ch) => {
            stat(ch, 'tamCanh', 2);
            return tr('Mị Cơ cười khúc khích rồi tan vào sương. Mùi hương còn vương ba ngày mới hết.', 'The Charm Lady giggles and melts into the mist. Her scent lingers for three days.');
          },
        },
      ];
      if (c.daoTam >= 0)
        out.push({
          label: tr('Giả vờ theo để dò tin cho chính phái', 'Pretend to follow, and spy for the righteous sects'),
          hint: tr('chính · ở vài tháng rồi lẻn đi', 'righteous · stay a few months, then slip away'),
          lean: 'chinh',
          run: (ch) => {
            dao(ch, 6);
            stat(ch, 'ngoTinh', 3);
            money(ch, 60 + 40 * ch.realm);
            return tr('Bạn ở Hợp Hoan Cốc ba tháng, vẽ lại đường vào và trận pháp, rồi lẻn đi trong đêm. Chính phái thưởng hậu, còn Mị Cơ thì thề sẽ nhớ mặt bạn.', 'You spend three months in Hehuan Valley, mapping the paths and formations, then slip out one night. The righteous sects reward you well; the Charm Lady swears she will remember your face.');
          },
        });
      return out;
    },
  },
  // 2. Mê Hồn Trận
  {
    id: 'hh_me_hon_tran',
    once: true,
    weight: 80,
    when: (c) => inHH(c) && c.hh?.at !== undefined && age(c) - c.hh.at >= 1 && age(c) - c.hh.at <= 6,
    title: tr('Thử Mê Hồn Trận', 'The Maze of Bewitchment'),
    text: () => tr('Đệ tử mới phải đi qua Mê Hồn Trận. Trong trận, mỗi bước là một ảo ảnh: người bạn thương, người bạn hận, và chính bạn đang cười.', 'Every new disciple must cross the Maze of Bewitchment. Each step is an illusion: the one you love, the one you hate, and yourself, laughing.'),
    choices: () => [
      {
        label: tr('Giữ tâm, đi thẳng', 'Hold your heart steady and walk straight'),
        hint: tr('dựa vào tâm cảnh', 'relies on Heart State'),
        lean: 'trung',
        run: (c, ctx) => {
          if (ctx.rnd() < luck(c, 0.25 + c.stats.tamCanh / 150)) return tr('Bạn bước qua ảo ảnh như đi qua sương. Mị Cơ gật đầu.', 'You walk through the illusions like walking through fog. The Charm Lady nods.') + ' ' + (promote(c, ctx, tr('Qua Mê Hồn Trận không chớp mắt.', 'You cleared the Maze without blinking.')) ?? '');
          stat(c, 'tamMa', 10);
          return tr('Bạn đứng khóc trước bóng người thân suốt một đêm. Sáng ra người ta kéo bạn khỏi trận.', 'You stand weeping before the image of a loved one all night. At dawn they drag you out of the maze.');
        },
      },
      {
        label: tr('Dùng mị thuật mê ngược ảo ảnh', 'Use charm arts to bewitch the illusions back'),
        hint: tr('tà · liều', 'evil · risky'),
        lean: 'ta',
        run: (c, ctx) => {
          dao(c, -3);
          if (ctx.rnd() < luck(c, 0.5)) return tr('Ảo ảnh quỳ xuống trước bạn. Cả trận im bặt.', 'The illusions kneel before you. The whole maze falls silent.') + ' ' + (promote(c, ctx, tr('Mê ngược cả Mê Hồn Trận.', 'You bewitched the Maze itself.')) ?? '');
          stat(c, 'tamMa', 12);
          return tr('Mị thuật dội ngược. Bạn mê man ba ngày, tỉnh dậy thấy tóc bạc một chỏm.', 'Your charm rebounds. You lie dazed for three days and wake with a streak of white hair.');
        },
      },
    ],
  },
  // 3. Lô đỉnh đầu tiên
  {
    id: 'hh_lo_dinh_dau',
    once: true,
    weight: 40,
    when: (c) => inHH(c) && (c.hh?.lo ?? 0) === 0 && c.hh?.at !== undefined && age(c) - c.hh.at >= 1,
    title: tr('Lô đỉnh đầu tiên', 'Your first cauldron'),
    text: (c) => tr(`Tông giao cho bạn một "lô đỉnh": ${nameFor(c, c.age * 7 + 1)}, một tán tu trẻ bị dụ vào cốc. Người ấy nhìn bạn, không biết điều gì đang chờ.`, `The sect hands you a "cauldron": ${nameFor(c, c.age * 7 + 1)}, a young rogue cultivator lured into the valley. They look at you, unaware of what awaits.`),
    choices: (c) => {
      const n = nameFor(c, c.age * 7 + 1);
      return [
        {
          label: tr('Hút cạn chân khí', 'Drain their true qi dry'),
          hint: tr('tà · người ấy sẽ nhớ tên bạn', 'evil · they will remember your name'),
          lean: 'ta',
          run: (ch, ctx) => {
            addLo(ch, n);
            dao(ch, -10);
            stat(ch, 'tamMa', 6);
            addCult(ch, reward(ch, 1));
            ctx.fx('evil', tr('Thái âm bổ dương', 'Yin nourishes yang'));
            return tr(`Một đêm, ${n} gầy rộc đi. Bạn thấy kinh mạch căng đầy. Sáng ra người ấy lết khỏi cốc, ngoái lại nhìn bạn một lần.`, `In one night ${n} withers away. Your meridians feel full to bursting. At dawn they stagger out of the valley, looking back at you once.`);
          },
        },
        {
          label: tr('Song tu đôi bên cùng lợi', 'Dual-cultivate so both of you gain'),
          hint: tr('trung · chậm hơn mà không gây thù', 'neutral · slower, but makes no enemy'),
          lean: 'trung',
          run: (ch) => {
            addLo(ch, null);
            stat(ch, 'tamCanh', 3);
            addCult(ch, reward(ch, 0.5));
            return tr(`Bạn và ${n} trao đổi chân khí, mỗi người lấy một nửa. Người ấy rời cốc còn cúi đầu cảm tạ.`, `You and ${n} exchange true qi, each taking half. They leave the valley bowing in thanks.`);
          },
        },
        {
          label: tr('Thả người ấy đi', 'Let them go'),
          hint: tr('chính · tông không vui', 'righteous · the sect will not be pleased'),
          lean: 'chinh',
          run: (ch) => {
            dao(ch, 6);
            const r = rankOf(ch);
            if (r > 0) ch.sectRank = r - 1;
            return tr(`Bạn mở cửa sau cho ${n} chạy. Mị Cơ biết chuyện, giáng bạn một bậc${r > 0 ? `, giờ chỉ còn là ${rankName(ch)}` : ''}.`, `You open the back gate for ${n} to run. The Charm Lady finds out and demotes you${r > 0 ? ` - you are now just a ${rankName(ch)}` : ''}.`);
          },
        },
      ];
    },
  },
  // 4. Mị thuật
  {
    id: 'hh_mi_thuat',
    cooldown: 6,
    weight: 12,
    when: (c) => inHH(c) && (c.hh?.lo ?? 0) >= 1,
    title: tr('Hoan Hỷ Điện', 'Hall of Joy'),
    text: () => tr('Hoan Hỷ Điện mở cửa cho đệ tử đã có lô đỉnh. Trên vách là chín bức Mị thuật đồ, mỗi bức một ánh mắt.', 'The Hall of Joy opens to disciples who have taken a cauldron. Nine charm-art murals cover the walls, each a different gaze.'),
    choices: () => [
      {
        label: tr('Luyện Mị Tâm Quyết', 'Practice the Charming Heart Formula'),
        lean: 'trung',
        run: (c) => {
          stat(c, 'ngoTinh', 4);
          return tr('Bạn hiểu ra: mê người trước hết phải hiểu người (+4 ngộ tính).', 'You realize that to bewitch someone, you must first understand them (+4 Insight).');
        },
      },
      {
        label: tr('Luyện Đào Hoa Nhãn', 'Practice the Peach Blossom Gaze'),
        lean: 'trung',
        run: (c) => {
          stat(c, 'khiVan', 4);
          return tr('Ánh mắt bạn có thêm thứ gì đó khiến người ta dễ nhường đường (+4 khí vận).', 'Your gaze gains something that makes people step aside (+4 Luck).');
        },
      },
      {
        label: tr('Luyện cả chín bức một lần', 'Practice all nine murals at once'),
        hint: tr('tham · tâm ma', 'greedy · heart demon'),
        lean: 'ta',
        run: (c) => {
          stat(c, 'ngoTinh', 6);
          stat(c, 'khiVan', 6);
          stat(c, 'tamMa', 15);
          return tr('Chín ánh mắt cùng nhìn vào bạn. Bạn học được hết, nhưng đêm nào cũng mơ thấy chúng.', 'Nine gazes stare into you at once. You learn them all, but they haunt your dreams every night.');
        },
      },
    ],
  },
  // 5. Tranh sủng
  {
    id: 'hh_tranh_sung',
    once: true,
    weight: 14,
    when: (c) => inHH(c) && rankOf(c) >= 1 && !c.hh?.rival,
    title: tr('Tranh sủng', 'Rivalry for favor'),
    text: (c) => tr(`${c.gender === 'nu' ? 'Sư tỷ' : 'Sư huynh'} ${nameFor(c, c.age * 11 + 3, c.gender === 'nu' ? 'nu' : 'nam')} thấy Mị Cơ để mắt tới bạn, bèn đến cảnh cáo: "Trong cốc này chỉ một người được đứng cạnh Mị Cơ."`, `${c.gender === 'nu' ? 'Senior sister' : 'Senior brother'} ${nameFor(c, c.age * 11 + 3, c.gender === 'nu' ? 'nu' : 'nam')} notices the Charm Lady's eye on you and comes with a warning: "Only one of us gets to stand beside her."`),
    choices: (c) => {
      const n = nameFor(c, c.age * 11 + 3, c.gender === 'nu' ? 'nu' : 'nam');
      const set = (ch: Character) => (hh(ch).rival = n);
      return [
        {
          label: tr('Đấu mị thuật trước mặt cả tông', 'Duel in charm arts before the whole sect'),
          hint: tr('giao đấu ngang cảnh giới', 'a duel at your own realm'),
          lean: 'trung',
          run: (ch, ctx) => {
            set(ch);
            const d = duel(ch, ctx, ch.realm, n);
            if (d.result === 'win') return tr(`${n} thua, cúi đầu lui. Từ nay hai người là đối thủ.`, `${n} loses and bows out. From now on you are rivals.`) + ' ' + (promote(ch, ctx, tr('Thắng trận tranh sủng.', 'You won the rivalry.')) ?? '');
            return tr(`${n} thắng, còn sai người bỏ độc vào trà của bạn.`, `${n} wins, and has someone poison your tea besides.`) + hurt(ch, 20, ctx);
          },
        },
        {
          label: tr('Hãm hại ngược lại', 'Frame them first'),
          hint: tr('tà', 'evil'),
          lean: 'ta',
          run: (ch, ctx) => {
            set(ch);
            dao(ch, -6);
            if (ctx.rnd() < luck(ch, 0.55)) return tr(`Bạn để cành hoa của ${n} trong phòng tông chủ. ${n} bị phạt diện bích ba năm.`, `You leave ${n}'s flower sprig in the Sect Master's room. ${n} is sent to face the wall for three years.`) + ' ' + (promote(ch, ctx, tr('Đối thủ bị phạt.', 'Your rival was punished.')) ?? '');
            return tr(`${n} cao tay hơn, đổ ngược tội lên đầu bạn.`, `${n} is the better schemer and turns the blame back on you.`) + hurt(ch, 25, ctx);
          },
        },
        {
          label: tr('Nhường một bước', 'Give way'),
          lean: 'chinh',
          run: (ch) => {
            set(ch);
            stat(ch, 'tamCanh', 3);
            return tr(`Bạn lùi lại. ${n} cười khẩy, nhưng không quên tên bạn.`, `You step back. ${n} sneers, but does not forget your name.`);
          },
        },
      ];
    },
  },
  // 6. Thêm lô đỉnh
  {
    id: 'hh_lo_dinh_them',
    cooldown: 3,
    cap: 5,
    weight: 14,
    when: (c) => inHH(c) && (c.hh?.lo ?? 0) >= 1 && (c.hh?.lo ?? 0) < 7 && age(c) - (c.hh?.loAt ?? 0) >= 3,
    title: tr('Thêm một lô đỉnh', 'Another cauldron'),
    text: (c) => tr(`Lại có người bị dụ vào cốc: ${nameFor(c, c.age * 13 + 5)}. Bạn đã có ${c.hh?.lo ?? 0} lô đỉnh, chân khí lạ trong người bắt đầu cãi nhau.`, `Another one has been lured into the valley: ${nameFor(c, c.age * 13 + 5)}. You already have ${c.hh?.lo ?? 0} cauldrons, and the foreign qi inside you has started to quarrel.`),
    choices: (c) => {
      const n = nameFor(c, c.age * 13 + 5);
      const cost = (ch: Character) => {
        const lo = ch.hh?.lo ?? 0;
        stat(ch, 'tamMa', 4 * lo);
        stat(ch, 'sucKhoe', -3 * lo);
        return lo;
      };
      return [
        {
          label: tr('Hút cạn', 'Drain them dry'),
          hint: tr('tà · càng nhiều lô đỉnh càng phản phệ', 'evil · the more cauldrons, the worse the backlash'),
          lean: 'ta',
          run: (ch, ctx) => {
            const lo = cost(ch);
            addLo(ch, n);
            dao(ch, -8);
            addCult(ch, reward(ch, 0.8));
            ctx.fx('evil', tr('Thái âm bổ dương', 'Yin nourishes yang'));
            return tr(`${n} khô héo trong một đêm. Bạn mạnh thêm, nhưng ${lo} luồng chân khí cũ gầm lên trong kinh mạch (+${4 * lo} tâm ma).`, `${n} withers in a single night. You grow stronger, but ${lo} old strands of qi roar in your meridians (+${4 * lo} heart demon).`);
          },
        },
        {
          label: tr('Song tu cùng lợi', 'Dual-cultivate for mutual gain'),
          lean: 'trung',
          run: (ch) => {
            const lo = cost(ch);
            addLo(ch, null);
            addCult(ch, reward(ch, 0.4));
            return tr(`Bạn và ${n} chia nhau chân khí. Nhẹ nhàng, nhưng ${lo} luồng chân khí cũ vẫn khó chịu.`, `You and ${n} share qi. Gentle, but your ${lo} old strands of qi still chafe.`);
          },
        },
        {
          label: tr('Thả đi', 'Let them go'),
          lean: 'chinh',
          run: (ch) => {
            dao(ch, 4);
            hh(ch).loAt = age(ch);
            return tr(`Bạn chỉ đường cho ${n} trốn khỏi cốc. Lần này không ai phát hiện.`, `You show ${n} the way out of the valley. This time nobody notices.`);
          },
        },
      ];
    },
  },
  // 7. Chính phái truy sát
  {
    id: 'hh_chinh_phai_truy',
    cooldown: 8,
    weight: 10,
    minRealm: 2,
    when: (c) => inHH(c) && (c.hh?.lo ?? 0) >= 2,
    title: tr('Chính phái truy sát', 'Hunted by the righteous'),
    text: (c) => tr(`Tin về những lô đỉnh khô héo đã tới tai chính phái. Kiếm khách ${nameFor(c, c.age * 17 + 7, 'nam')} của Thanh Vân Môn chặn bạn ở cửa cốc: "Yêu nhân Hợp Hoan, hôm nay trả nợ."`, `Word of the withered cauldrons has reached the righteous sects. Swordsman ${nameFor(c, c.age * 17 + 7, 'nam')} of Qingyun Sect blocks you at the valley mouth: "Hehuan demon, today you pay your debts."`),
    choices: (c) => {
      const n = nameFor(c, c.age * 17 + 7, 'nam');
      const by = tr(`${n} của Thanh Vân Môn`, `${n} of Qingyun Sect`);
      return [
        {
          label: tr('Rút kiếm nghênh chiến', 'Draw your sword and meet him'),
          hint: tr('giao đấu ngang cảnh giới', 'a duel at your own realm'),
          lean: 'trung',
          run: (ch, ctx) => {
            const d = duel(ch, ctx, ch.realm, n);
            if (d.result === 'win') {
              money(ch, 40 * ch.realm);
              stat(ch, 'khiVan', 2);
              return tr(`${n} ngã xuống trước cửa cốc. Hợp Hoan Tông treo kiếm hắn lên cổng.`, `${n} falls at the valley mouth. Hehuan Sect hangs his sword over the gate.`);
            }
            const f = deadly(ch, ctx, d.result === 'lose' ? 0.35 : 0.1, 'dao_giang_ho', by, tr(`${n} của Thanh Vân Môn chém bạn ngay trước cửa Hợp Hoan Cốc.`, `${n} of Qingyun Sect cuts you down right at the gate of Hehuan Valley.`));
            if (ch.dead) return lead(tr('Kiếm quang lóe lên...', 'A flash of sword light...'), f);
            return tr(`${n} để lại cho bạn một vết kiếm dài trên lưng.`, `${n} leaves you a long sword wound across the back.`) + hurt(ch, 25, ctx) + (f ?? '');
          },
        },
        {
          label: tr('Rút vào trận pháp trong cốc', 'Retreat into the valley formations'),
          lean: 'trung',
          run: (ch, ctx) => {
            if (ctx.rnd() < luck(ch, 0.65)) return tr(`${n} lạc trong trận hoa đào ba ngày rồi bỏ về.`, `${n} wanders lost in the peach-blossom formation for three days and gives up.`);
            return tr(`Bạn chạy kịp, nhưng ăn một kiếm vào vai.`, 'You get away, but take a sword thrust to the shoulder.') + hurt(ch, 18, ctx);
          },
        },
        {
          label: tr('Dùng mị thuật', 'Use your charm arts'),
          hint: tr('tà · càng nhiều lô đỉnh càng mạnh', 'evil · stronger with more cauldrons'),
          lean: 'ta',
          run: (ch, ctx) => {
            dao(ch, -5);
            if (ctx.rnd() < luck(ch, 0.45 + 0.05 * Math.min(5, ch.hh?.lo ?? 0))) {
              addCult(ch, reward(ch, 0.4));
              return tr(`Kiếm trong tay ${n} rơi xuống. Hắn đứng ngây ra, rồi tự quay về Thanh Vân Môn, không nhớ mình đến đây làm gì.`, `The sword drops from ${n}'s hand. He stands there dazed, then walks back to Qingyun Sect with no memory of why he came.`);
            }
            const f = deadly(ch, ctx, 0.25, 'dao_giang_ho', by, tr(`${n} của Thanh Vân Môn cắn lưỡi phá mị thuật, một kiếm xuyên tim bạn.`, `${n} of Qingyun Sect bites his tongue to break the charm and runs you through the heart.`));
            if (ch.dead) return lead(tr('Mị thuật vừa thi triển...', 'Your charm takes hold...'), f);
            return tr(`${n} phá được mị thuật, bạn phải bỏ chạy.`, `${n} breaks the charm, and you have to run.`) + hurt(ch, 20, ctx) + (f ?? '');
          },
        },
      ];
    },
  },
  // 8. Báo thù
  {
    id: 'hh_bao_thu',
    cooldown: 4,
    cap: 4,
    weight: 12,
    when: (c) => !c.cosmos && (c.hh?.thu.length ?? 0) > 0 && age(c) - (c.hh?.thuAt ?? age(c)) >= 3,
    title: tr('Người cũ quay lại', 'Someone from your past returns'),
    text: (c) => tr(`${c.hh?.thu[0]}, người năm xưa bị bạn hút cạn chân khí, đứng chắn giữa đường. Gương mặt tiều tụy, nhưng ánh mắt thì không: "Ngươi còn nhớ ta chứ?"`, `${c.hh?.thu[0]}, whose true qi you drained dry years ago, stands in your path. The face is gaunt, but the eyes are not: "Do you still remember me?"`),
    choices: (c) => {
      const n = c.hh?.thu[0] ?? '';
      const cause = tr(`${n}, người từng bị bạn hút cạn chân khí, quay lại đòi mạng.`, `${n}, whose qi you once drained dry, came back to collect your life.`);
      return [
        {
          label: tr('Ra tay trước', 'Strike first'),
          hint: tr('giao đấu ngang cảnh giới', 'a duel at your own realm'),
          lean: 'trung',
          run: (ch, ctx) => {
            const d = duel(ch, ctx, ch.realm, n);
            if (d.result === 'win') {
              dropThu(ch, n);
              addCult(ch, reward(ch, 0.3));
              return tr(`${n} gục xuống, lần này không đứng dậy nữa. Món nợ ấy coi như đã xong.`, `${n} collapses and this time does not get up. That debt is settled.`);
            }
            const f = deadly(ch, ctx, d.result === 'lose' ? 0.4 : 0.12, 'tinh_cu_doi_mang', n, cause);
            if (ch.dead) return lead(tr(`${n} cười:`, `${n} laughs:`), f);
            return tr(`${n} đánh bạn trọng thương rồi biến mất, hẹn ngày gặp lại.`, `${n} wounds you badly and vanishes, promising to meet again.`) + hurt(ch, 25, ctx) + (f ?? '');
          },
        },
        {
          label: tr('Cúi đầu xin lỗi, trả lại chân khí', 'Bow, apologize, and return the qi'),
          hint: tr('chính · mất tu vi', 'righteous · costs cultivation'),
          lean: 'chinh',
          run: (ch) => {
            dropThu(ch, n);
            addCult(ch, -Math.round(ch.cultivation * 0.15));
            dao(ch, 6);
            stat(ch, 'tamMa', -6);
            return tr(`Bạn truyền ngược chân khí cho ${n}. Người ấy im lặng rất lâu, rồi quay đi không nói gì.`, `You channel the qi back into ${n}. They are silent for a long time, then turn and leave without a word.`);
          },
        },
        {
          label: tr('Mê thêm một lần nữa', 'Bewitch them one more time'),
          hint: tr('tà · rất liều', 'evil · very risky'),
          lean: 'ta',
          run: (ch, ctx) => {
            dao(ch, -6);
            if (ctx.rnd() < luck(ch, 0.4)) {
              addLo(ch, n);
              hh(ch).thuAt = age(ch);
              return tr(`${n} lại quỳ trước bạn như năm nào. Thù hận cũng là một loại tình.`, `${n} kneels before you again, just like before. Hatred is also a kind of love.`);
            }
            const f = deadly(ch, ctx, 0.5, 'tinh_cu_doi_mang', n, cause);
            if (ch.dead) return lead(tr('Ánh mắt ấy không còn mê nữa.', 'Those eyes are no longer charmed.'), f);
            return tr(`Mị thuật không còn tác dụng với ${n}. Bạn thoát được, người đầy máu.`, `Your charm no longer works on ${n}. You escape, covered in blood.`) + hurt(ch, 30, ctx) + (f ?? '');
          },
        },
      ];
    },
  },
  // 9. Bách Hoa Yến (thay Đại bỉ)
  {
    id: 'hh_bach_hoa_yen',
    cooldown: 4,
    cap: 6,
    weight: 60,
    when: (c) => inHH(c) && rankOf(c) < 3 && c.age >= (c.daiBiAt ?? 0),
    title: tr('Bách Hoa Yến', 'Feast of a Hundred Flowers'),
    text: (c) => tr(`Năm năm một lần, Hợp Hoan Tông mở Bách Hoa Yến để đệ tử tranh danh. ${c.hh?.rival ? `Bốc thăm trúng đúng ${c.hh.rival}.` : 'Đối thủ của bạn che mặt bằng quạt lụa.'}`, `Once every five years Hehuan Sect holds the Feast of a Hundred Flowers for disciples to compete. ${c.hh?.rival ? `The draw pits you against ${c.hh.rival}, of all people.` : 'Your opponent hides behind a silk fan.'}`),
    choices: (c) => {
      const n = c.hh?.rival ?? nameFor(c, c.age * 19 + 9, c.gender === 'nu' ? 'nu' : 'nam');
      const next = (ch: Character) => (ch.daiBiAt = age(ch) + 5);
      return [
        {
          label: tr('Thi mị thuật đường đường chính chính', 'Compete fair and square'),
          hint: tr('giao đấu ngang cảnh giới', 'a duel at your own realm'),
          lean: 'trung',
          run: (ch, ctx) => {
            next(ch);
            const d = duel(ch, ctx, ch.realm, n);
            if (d.result === 'win') return tr(`Hoa rơi đầy đài. ${n} nhận thua.`, `Petals cover the stage. ${n} concedes.`) + ' ' + (promote(ch, ctx, tr('Đứng đầu Bách Hoa Yến.', 'You topped the Feast of a Hundred Flowers.')) ?? '');
            stat(ch, 'tamMa', 5);
            return tr(`${n} thắng, nhận cành hoa vàng trước mặt bạn.`, `${n} wins and takes the golden sprig right in front of you.`);
          },
        },
        {
          label: tr('Hạ dược vào rượu của đối thủ', "Spike your opponent's wine"),
          hint: tr('tà', 'evil'),
          lean: 'ta',
          run: (ch, ctx) => {
            next(ch);
            dao(ch, -6);
            if (ctx.rnd() < luck(ch, 0.65)) return tr(`${n} lên đài thì loạng choạng, ngã ngồi giữa sân. Cả tông cười ồ.`, `${n} staggers onto the stage and sits down hard. The whole sect roars with laughter.`) + ' ' + (promote(ch, ctx, tr('Thắng Bách Hoa Yến (bằng cách của Hợp Hoan).', 'You won the Feast (the Hehuan way).')) ?? '');
            stat(ch, 'tamMa', 6);
            return tr('Bị bắt quả tang. Tông chủ phạt bạn quỳ trước Hoan Hỷ Điện ba ngày.', 'Caught red-handed. The Sect Master makes you kneel before the Hall of Joy for three days.');
          },
        },
        {
          label: tr('Bỏ thi, ngồi uống rượu', 'Skip it and drink'),
          lean: 'trung',
          run: (ch) => {
            next(ch);
            stat(ch, 'tamCanh', 3);
            return tr('Bạn ngồi dưới gốc đào xem người ta tranh nhau. Rượu ngon.', 'You sit beneath a peach tree watching the others fight. The wine is good.');
          },
        },
      ];
    },
  },
  // 10. Người thật lòng
  {
    id: 'hh_that_long',
    once: true,
    weight: 20,
    when: (c) => inHH(c) && rankOf(c) >= 1 && (c.hh?.lo ?? 0) >= 2 && !c.hh?.tinh,
    title: tr('Người thật lòng', 'Someone who means it'),
    text: (c) => tr(`${nameFor(c, c.age * 23 + 11)} bị dụ vào cốc như bao lô đỉnh khác. Nhưng người ấy không sợ, chỉ nhìn bạn và nói: "Ta biết ngươi định làm gì. Ta vẫn ở lại."`, `${nameFor(c, c.age * 23 + 11)} was lured into the valley like every other cauldron. But they are not afraid. They just look at you and say: "I know what you mean to do. I'm staying anyway."`),
    choices: (c) => {
      const n = nameFor(c, c.age * 23 + 11);
      return [
        {
          label: tr('Coi như một lô đỉnh khác', 'Treat them as just another cauldron'),
          lean: 'ta',
          run: (ch) => {
            addLo(ch, n);
            dao(ch, -6);
            addCult(ch, reward(ch, 0.6));
            return tr(`Bạn làm như mọi lần. ${n} không chống cự. Sáng ra bạn thấy ngực mình trống rỗng lạ thường.`, `You do what you always do. ${n} does not resist. In the morning your chest feels strangely hollow.`);
          },
        },
        {
          label: tr('Động lòng', 'Let your heart be moved'),
          hint: tr('chính · trong tông này, tình là điều cấm', 'righteous · in this sect, love is forbidden'),
          lean: 'chinh',
          run: (ch, ctx) => {
            const h = hh(ch);
            h.tinh = n;
            h.tinhAt = age(ch);
            stat(ch, 'tamMa', -15);
            dao(ch, 4);
            ctx.fx('love', tr('Động lòng', 'Heart moved'));
            return tr(`Lần đầu tiên ở Hợp Hoan Cốc, bạn chỉ ngồi nói chuyện tới sáng. Từ đó ${n} ở lại, làm "lô đỉnh" chỉ trên danh nghĩa.`, `For the first time in Hehuan Valley, you just sit and talk until dawn. ${n} stays on after that, a "cauldron" in name only.`);
          },
        },
        {
          label: tr('Tránh mặt', 'Avoid them'),
          lean: 'trung',
          run: (ch) => {
            stat(ch, 'tamCanh', 2);
            return tr(`Bạn sai người đưa ${n} ra khỏi cốc, không dám gặp mặt.`, `You have someone escort ${n} out of the valley, not daring to face them.`);
          },
        },
      ];
    },
  },
  // 11. Tông chủ phát hiện
  {
    id: 'hh_tong_chu_biet',
    once: true,
    weight: 30,
    when: (c) => inHH(c) && !!c.hh?.tinh && !c.hh.bo && age(c) - (c.hh.tinhAt ?? age(c)) >= 2,
    title: tr('Tông chủ biết chuyện', 'The Sect Master finds out'),
    text: (c) => tr(`Tông chủ Hợp Hoan gọi bạn vào điện, ném xuống trước mặt cành hoa của ${c.hh?.tinh}: "Đệ tử Hợp Hoan không được động tình. Ngươi biết phải làm gì."`, `The Hehuan Sect Master summons you and throws ${c.hh?.tinh}'s flower sprig at your feet: "A Hehuan disciple does not fall in love. You know what to do."`),
    choices: (c) => {
      const n = c.hh?.tinh ?? '';
      return [
        {
          label: tr(`Giết ${n} để chứng tâm`, `Kill ${n} to prove your heart`),
          hint: tr('tà · thăng bậc, tâm ma lớn', 'evil · promotion, heavy heart demon'),
          lean: 'ta',
          run: (ch, ctx) => {
            const h = hh(ch);
            h.tinh = undefined;
            h.thu = [...h.thu.filter((x) => x !== n), n];
            h.thuAt = age(ch);
            stat(ch, 'tamMa', 25);
            dao(ch, -15);
            ctx.fx('evil', tr('Chứng tâm', 'Heart proven'));
            return tr(`${n} nhìn bạn đến hơi thở cuối. Tông chủ vỗ tay.`, `${n} watches you until the last breath. The Sect Master applauds.`) + ' ' + (promote(ch, ctx, tr('Đã chứng được tâm Hợp Hoan.', 'You proved your Hehuan heart.')) ?? '');
          },
        },
        {
          label: tr('Giấu người ấy đi', 'Hide them away'),
          hint: tr('mỗi năm có thể bị lộ', 'may be discovered each year'),
          lean: 'trung',
          run: (ch) => {
            ch.sectHide = true;
            stat(ch, 'tamMa', 5);
            return tr(`Bạn thề trước điện là đã giết ${n}, rồi giấu người ấy trong một hang đá sau núi.`, `You swear before the hall that ${n} is dead, then hide them in a stone cave behind the mountain.`);
          },
        },
        {
          label: tr(`Bỏ trốn cùng ${n}`, `Run away with ${n}`),
          hint: tr('chính · rời tông, bị truy sát', 'righteous · leave the sect, be hunted'),
          lean: 'chinh',
          run: (ch, ctx) => {
            leaveSect(ch, true);
            const h = hh(ch);
            h.bo = true;
            h.boAt = age(ch);
            dao(ch, 8);
            ctx.fx('love', tr('Bỏ tông', 'Left the sect'));
            return tr(`Đêm ấy bạn nắm tay ${n} chạy qua trận hoa đào. Sau lưng, chuông Hợp Hoan Cốc vang lên không ngớt.`, `That night you take ${n}'s hand and run through the peach-blossom formation. Behind you, the bells of Hehuan Valley ring without end.`);
          },
        },
      ];
    },
  },
  // 12. Truy sát kẻ bỏ trốn
  {
    id: 'hh_truy_phan_do',
    once: true,
    weight: 80,
    when: (c) => !c.cosmos && !!c.hh?.bo && age(c) - (c.hh.boAt ?? age(c)) >= 1,
    title: tr('Hợp Hoan Tông truy sát', 'Hunted by Hehuan Sect'),
    text: (c) => tr(`Mị Cơ dẫn ba Hoan Hỷ sứ tìm tới chỗ bạn trốn${c.hh?.tinh ? ` cùng ${c.hh.tinh}` : ''}: "Kẻ phản tông phải trả lại mọi thứ tông đã cho, kể cả mạng."`, `The Charm Lady leads three Envoys of Joy to your hideout${c.hh?.tinh ? ` with ${c.hh.tinh}` : ''}: "A traitor returns everything the sect gave, life included."`),
    choices: (c) => {
      const n = c.hh?.tinh;
      const by = tr('Mị Cơ của Hợp Hoan Tông', 'the Charm Lady of Hehuan Sect');
      const together = (ch: Character) => {
        if (n && !ch.partner) ch.partner = n;
        return n ? tr(` Từ nay ${n} là đạo lữ của bạn.`, ` From now on, ${n} is your Dao companion.`) : '';
      };
      const out: Choice[] = [
        {
          label: tr('Đứng ra đánh', 'Stand and fight'),
          hint: tr('giao đấu, Mị Cơ cao hơn một cảnh giới', 'a duel - the Charm Lady is one realm above you'),
          lean: 'trung',
          run: (ch, ctx) => {
            const d = duel(ch, ctx, ch.realm + 1, by);
            if (d.result === 'win') return tr('Mị Cơ lùi lại, quạt lụa rách một đường. "Được. Coi như ta chưa từng tìm thấy ngươi."', 'The Charm Lady steps back, her silk fan torn. "Fine. Let\'s say I never found you."') + together(ch);
            const f = deadly(ch, ctx, d.result === 'lose' ? 0.35 : 0.1, 'dao_giang_ho', by, tr('Mị Cơ của Hợp Hoan Tông đuổi kịp kẻ phản tông. Một nhát quạt lụa cắt ngang cổ họng.', 'The Charm Lady of Hehuan Sect catches the traitor. One stroke of her silk fan opens your throat.'));
            if (ch.dead) return lead(tr('Quạt lụa phất lên...', 'The silk fan sweeps up...'), f);
            return tr('Bạn trọng thương nhưng cầm chân được bọn họ tới sáng, rồi cõng người kia chạy.', 'Badly wounded, you hold them off until dawn, then run carrying the other on your back.') + hurt(ch, 30, ctx) + together(ch) + (f ?? '');
          },
        },
        {
          label: tr('Chạy trốn về phương Nam', 'Flee south'),
          lean: 'trung',
          run: (ch, ctx) => {
            if (ctx.rnd() < luck(ch, 0.6)) return tr('Hai người đổi tên, trốn vào một trấn nhỏ phương Nam. Mị Cơ mất dấu.', 'The two of you change your names and hide in a small southern town. The Charm Lady loses the trail.') + together(ch);
            return tr('Bị đuổi kịp ở bến đò. Bạn nhảy xuống sông, kéo theo người kia.', 'They catch you at the ferry landing. You leap into the river, pulling the other with you.') + hurt(ch, 25, ctx) + together(ch);
          },
        },
      ];
      if (n)
        out.push({
          label: tr(`Đẩy ${n} ra chắn`, `Shove ${n} out as a shield`),
          hint: tr('tà', 'evil'),
          lean: 'ta',
          run: (ch) => {
            const h = hh(ch);
            h.tinh = undefined;
            stat(ch, 'tamMa', 20);
            dao(ch, -15);
            return tr(`Bạn sống. ${n} thì không. Mị Cơ cười: "Thấy chưa, ngươi vẫn là người của Hợp Hoan."`, `You live. ${n} does not. The Charm Lady laughs: "See? You are still one of us."`);
          },
        });
      return out;
    },
  },
  // 13. Thái âm phản phệ
  {
    id: 'hh_phan_phe',
    cooldown: 5,
    weight: 25,
    when: (c) => inHH(c) && (c.hh?.lo ?? 0) >= 4 && c.stats.tamMa >= 60,
    title: tr('Thái âm phản phệ', 'Yin backlash'),
    text: (c) => tr(`${c.hh?.lo} luồng chân khí của ${c.hh?.lo} lô đỉnh cùng nổi loạn trong kinh mạch. Bạn nôn ra máu hồng.`, `The qi of ${c.hh?.lo} cauldrons rises up in your meridians all at once. You cough up pink blood.`),
    choices: () => [
      {
        label: tr('Tán công, bỏ bớt chân khí lạ', 'Disperse your power, purge the foreign qi'),
        hint: tr('mất tu vi, còn 2 lô đỉnh', 'lose cultivation, keep 2 cauldrons'),
        lean: 'trung',
        run: (c) => {
          const h = hh(c);
          h.lo = 2;
          c.cultivation = Math.round(c.cultivation * 0.7);
          stat(c, 'tamMa', -15);
          return tr('Bạn ép từng luồng chân khí ra khỏi người. Tu vi tụt ba phần, nhưng đầu óc tỉnh lại.', 'You force the strands out one by one. Your cultivation drops by three-tenths, but your head clears.');
        },
      },
      {
        label: tr('Cố nuốt hết', 'Swallow it all'),
        hint: tr('tà · có thể tẩu hỏa', 'evil · may cause qi deviation'),
        lean: 'ta',
        run: (c, ctx) => {
          const f = fatal(c, ctx, 0.3, tr(`Chân khí của ${c.hh?.lo} lô đỉnh nổ tung cùng lúc. Bạn tẩu hỏa nhập ma giữa Hoan Hỷ Điện.`, `The qi of ${c.hh?.lo} cauldrons explodes at once. You suffer qi deviation in the middle of the Hall of Joy.`) + atAge(c));
          if (c.dead) return lead(tr('Kinh mạch căng như dây đàn...', 'Your meridians stretch like zither strings...'), f);
          addCult(c, reward(c, 1.5));
          stat(c, 'tamMa', 10);
          return tr('Bạn nuốt trọn. Tu vi vọt lên một đoạn dài, nhưng đêm nào cũng nghe tiếng người cười trong đan điền.', 'You swallow it whole. Your cultivation leaps forward, but every night you hear laughter in your dantian.') + (f ?? '');
        },
      },
    ],
  },
  // 14. Tuyển Thánh tử / Thánh nữ
  {
    id: 'hh_thanh_tu_tuyen',
    once: true,
    weight: 30,
    minRealm: 3,
    when: (c) => inHH(c) && rankOf(c) === 2,
    title: tr('Tuyển Thánh tử, Thánh nữ', 'Choosing the Holy Son and Daughter'),
    text: (c) => tr(`Tông chủ chọn người kế thừa. Người còn lại trên đài là ${c.hh?.rival ?? 'một Hoan Hỷ sứ mặt lạ'}.`, `The Sect Master is choosing an heir. The last one standing on the stage with you is ${c.hh?.rival ?? 'an Envoy of Joy you have never seen'}.`),
    choices: (c) => {
      const n = c.hh?.rival ?? nameFor(c, c.age * 29 + 13, c.gender === 'nu' ? 'nu' : 'nam');
      const win = (ch: Character, ctx: EffectCtx) => {
        hh(ch).rival = undefined;
        return promote(ch, ctx, tr(`Hạ được ${n} trên đài tuyển.`, `You beat ${n} in the selection.`)) ?? '';
      };
      return [
        {
          label: tr('Đấu thẳng', 'Fight head-on'),
          hint: tr('giao đấu ngang cảnh giới', 'a duel at your own realm'),
          lean: 'trung',
          run: (ch, ctx) => {
            const d = duel(ch, ctx, ch.realm, n);
            if (d.result === 'win') return win(ch, ctx);
            stat(ch, 'tamMa', 8);
            return tr(`${n} được chọn. Bạn đứng dưới đài nhìn người ta khoác tử kim bào.`, `${n} is chosen. You stand below the stage watching them don the violet-gold robe.`) + hurt(ch, 15, ctx);
          },
        },
        {
          label: tr('Tế một lô đỉnh lấy sức', 'Sacrifice a cauldron for strength'),
          hint: tr('tà · mất một lô đỉnh, đấu hai lần', 'evil · lose a cauldron, two tries'),
          lean: 'ta',
          run: (ch, ctx) => {
            const h = hh(ch);
            h.lo = Math.max(0, h.lo - 1);
            dao(ch, -6);
            const d = duel(ch, ctx, ch.realm, n);
            if (d.result === 'win' || duel(ch, ctx, ch.realm, n).result === 'win') return win(ch, ctx);
            stat(ch, 'tamMa', 10);
            return tr(`Cả lô đỉnh cũng không cứu được. ${n} thắng.`, `Even the cauldron could not save you. ${n} wins.`);
          },
        },
        {
          label: tr('Nhường ngôi', 'Step aside'),
          lean: 'chinh',
          run: (ch) => {
            stat(ch, 'tamCanh', 4);
            return tr(`Bạn cúi chào ${n} rồi xuống đài. Có những thứ không đáng để tranh.`, `You bow to ${n} and leave the stage. Some things are not worth the fight.`);
          },
        },
      ];
    },
  },
  // 15. Chính phái vây cốc
  {
    id: 'hh_vay_coc',
    once: true,
    weight: 15,
    minRealm: 3,
    when: (c) => inHH(c) && rankOf(c) >= 2,
    title: tr('Chính phái vây Hợp Hoan Cốc', 'The righteous besiege Hehuan Valley'),
    text: () => tr('Ba đại môn phái chính đạo kéo quân tới, kiếm quang phủ kín trời. Trận hoa đào cháy rụi từng lớp.', 'Three great righteous sects march in, their sword light covering the sky. The peach-blossom formations burn away layer by layer.'),
    choices: () => [
      {
        label: tr('Giữ cốc tới cùng', 'Hold the valley to the end'),
        hint: tr('giao đấu ngang cảnh giới', 'a duel at your own realm'),
        lean: 'trung',
        run: (c, ctx) => {
          const d = eventDuel(c, c.realm, ctx.rnd);
          if (d.result === 'win') {
            money(c, 80 * c.realm);
            addCult(c, reward(c, 0.5));
            return tr(`Bạn chém gãy kiếm của ${d.foe.name}, kiếm trận tan. Chính phái rút quân.`, `You snap ${d.foe.name}'s sword and the formation breaks. The righteous withdraw.`);
          }
          const f = deadly(c, ctx, d.result === 'lose' ? 0.3 : 0.08, 'dao_giang_ho', `${d.foe.name}`, tr(`${d.foe.name} dẫn kiếm trận chính phái phá cửa Hợp Hoan Cốc. Bạn ngã xuống giữa rừng đào cháy.`, `${d.foe.name} leads the righteous sword formation through the gate of Hehuan Valley. You fall among the burning peach trees.`));
          if (c.dead) return lead(tr('Lửa cháy khắp cốc...', 'Fire everywhere in the valley...'), f);
          return tr('Cốc giữ được, nhưng bạn mang về một vết kiếm suýt đứt tâm mạch.', 'The valley holds, but you come away with a sword wound that nearly severed your heart meridian.') + hurt(c, 30, ctx) + (f ?? '');
        },
      },
      {
        label: tr('Mở trận cho chính phái vào', 'Open the formations for the righteous'),
        hint: tr('chính · rời tông, tông thành oan gia', 'righteous · leave the sect, it becomes your enemy'),
        lean: 'chinh',
        run: (c) => {
          leaveSect(c, true);
          dao(c, 15);
          c.enemy = tr('Hợp Hoan Tông truy nã kẻ bán đứng tông', 'Hehuan Sect hunts the one who sold it out');
          return tr('Bạn mở một lối nhỏ sau núi. Đêm ấy Hợp Hoan Cốc thất thủ. Mị Cơ trốn thoát, và nhớ tên bạn.', 'You open a small path behind the mountain. That night Hehuan Valley falls. The Charm Lady escapes, and remembers your name.');
        },
      },
      {
        label: tr('Bỏ chạy', 'Run'),
        lean: 'trung',
        run: (c, ctx) => {
          if (ctx.rnd() < luck(c, 0.7)) return tr('Bạn chui qua lối thoát hiểm. Khi trở lại, cốc chỉ còn tro.', 'You crawl through the escape tunnel. When you return, the valley is ash.');
          return tr('Bị kiếm khí đuổi theo ba dặm.', 'Sword qi chases you for three miles.') + hurt(c, 25, ctx);
        },
      },
    ],
  },
];

/** 4.1.0: lô đỉnh làm tâm ma tăng mỗi năm (gọi trong yearTick) */
export function hhYear(c: Character) {
  if (!inHH(c)) return;
  const lo = Math.min(5, c.hh?.lo ?? 0);
  if (lo) stat(c, 'tamMa', lo);
}

/** 4.1.0: thắng giao đấu khi là đệ tử Hợp Hoan: "Thái âm bổ dương" thêm 10% tu vi thưởng, 20% sinh oan gia */
export function hhDuelWin(c: Character, gained: number, foe: string, rnd: () => number): string | null {
  if (!inHH(c) || gained <= 0) return null;
  const bonus = Math.max(1, Math.round(gained * 0.1));
  addCult(c, bonus);
  let t = tr(`Thái âm bổ dương: bạn hút thêm chút chân khí của ${foe} (+${bonus} tu vi).`, `Yin nourishes yang: you siphon a little of ${foe}'s qi (+${bonus} cultivation).`);
  if (!c.enemy && rnd() < 0.2) {
    c.enemy = foe;
    t += tr(` ${foe} thề sẽ báo thù.`, ` ${foe} swears revenge.`);
  }
  return t;
}

/** 4.1.0: đang giấu người thương trong Hợp Hoan Tông (dùng sectHide) */
export const hhHiding = (c: Character) => inHH(c) && !!c.hh?.tinh && !c.hh.bo;
