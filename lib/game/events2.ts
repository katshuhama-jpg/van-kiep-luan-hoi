import { ITEMS, REALMS } from './data';
import { joinSect } from './sect';
import { hasGift } from './gacha';
import { addCult, addLife, addPill, dao, fatal, giveItem, hurt, luck, money, nhanDeTu, reward, stat, thuTuDeTu } from './helpers';
import type { Character, Choice, EffectCtx, GameEvent, Grave } from './types';
import { tr } from '../i18n';
import { htBind } from './heThong';
import { ctArc, ctNext, ctSet, hasLore } from './ctArc';

const itemName = (id: string | null) => (id ? (ITEMS.find((i) => i.id === id)?.name ?? id) : null);
const arc = (c: Character, k: string) => c.arcs?.[k];
const setArc = (c: Character, k: string, s: number, v?: string) => {
  c.arcs = c.arcs ?? {};
  c.arcs[k] = { s, at: Math.floor(c.age), v: v ?? c.arcs[k]?.v };
};
const since = (c: Character, k: string) => Math.floor(c.age) - (arc(c, k)?.at ?? 0);
const realmName = (r: number) => REALMS[r]?.name ?? tr('Phàm nhân', "Mortal");

function grave(c: Character): Grave | null {
  const g = c.world?.graves ?? [];
  if (!g.length) return null;
  const n = Math.max(1, c.evCount?.mo_dao_huu ?? 1);
  return g[(n - 1) % g.length];
}

/** Đánh nhau với một đối thủ có cảnh giới r: thắng hay chết */
function duel(c: Character, ctx: EffectCtx, r: number, cause: string): { win: boolean; text: string } {
  const gap = c.realm - r;
  const p = Math.max(0.05, Math.min(0.92, luck(c, 0.45 + gap * 0.18)));
  if (ctx.rnd() < p) return { win: true, text: '' };
  const f = fatal(c, ctx, Math.max(0.1, Math.min(0.85, 0.35 - gap * 0.2)), cause);
  if (c.dead) return { win: false, text: f ?? '' };
  return { win: false, text: (f ?? '') + hurt(c, 30, ctx) };
}

export const EVENTS2: GameEvent[] = [
  // ================= Nhân quả xuyên kiếp =================
  {
    id: 'ruong_tien_kiep',
    minAge: 8,
    once: true,
    weight: 30,
    when: (c) => !!c.stash,
    title: tr('Chiếc rương kiếp trước', "The chest from a past life"),
    text: (c) =>
      tr(`Cuốc đất ở ${c.stash!.place}, bạn chạm phải một chiếc rương gỗ mục. Trên nắp khắc: "${c.stash!.from} - kiếp thứ ${c.stash!.lifeNo}". Tim bạn thắt lại. Đó là tên của chính bạn ở kiếp trước.`, `Digging ${c.stash!.place}, your hoe strikes a rotting wooden chest. Carved on the lid: "${c.stash!.from} - life ${c.stash!.lifeNo}". Your heart clenches. That was your own name in a past life.`),
    choices: (c) => {
      const s = c.stash!;
      const open = (ch: Character, ctx: EffectCtx, mul: number) => {
        money(ch, s.money * mul);
        if (s.item) giveItem(ch, s.item, false);
        ctx.fx('coin', `+${Math.round(s.money * mul)}`);
        ch.stash = null;
        const note = s.note ? tr(` Trong rương có lá thư, nét chữ quen thuộc lạ lùng: "${s.note}"`, ` Inside is a letter in strangely familiar handwriting: "${s.note}"`) : tr(' Trong rương không có thư, chỉ có một nhúm tóc đã bạc.', " There is no letter inside, only a lock of white hair.");
        return tr(`Bạn nhận lại ${Math.round(s.money * mul)} linh thạch${s.item ? tr(` và ${itemName(s.item)}`, ` and ${itemName(s.item)}`) : ''}.${note}`, `You reclaim ${Math.round(s.money * mul)} spirit stones${s.item ? tr(` và ${itemName(s.item)}`, ` and ${itemName(s.item)}`) : ''}.${note}`);
      };
      return [
        { label: tr('Mở rương', "Open the chest"), lean: 'trung', run: (ch, ctx) => open(ch, ctx, 1) },
        {
          label: tr('Thắp hương cho chính mình rồi mới mở', "Burn incense for yourself first"),
          hint: tr('tâm cảnh +', "Mind +"),
          lean: 'chinh',
          run: (ch, ctx) => {
            stat(ch, 'tamCanh', 10);
            stat(ch, 'tamMa', -8);
            return tr('Khói hương bay lên, bạn thấy như được ai đó vỗ vai. ', "As the incense smoke rises, you feel as if someone has patted you on the shoulder. ") + open(ch, ctx, 1);
          },
        },
        {
          label: tr('Đem cả rương cúng chùa', "Donate the whole chest to the temple"),
          hint: tr('đạo tâm +, khí vận +', "Dao Heart +, Luck +"),
          lean: 'chinh',
          run: (ch) => {
            dao(ch, 12);
            stat(ch, 'khiVan', 12);
            ch.stash = null;
            return tr('Sư trụ trì chắp tay: "Thí chủ đã buông được cả chính mình." Đêm đó bạn ngủ rất ngon.', "The abbot presses his palms together: \"Benefactor, you have let go even of yourself.\" You sleep soundly that night.");
          },
        },
        {
          label: tr('Bán cả rương cho thương nhân', "Sell the whole chest to a merchant"),
          hint: tr('x1.5 tiền, mất thư và đồ', "x1.5 money, lose the letter and items"),
          lean: 'trung',
          run: (ch, ctx) => {
            money(ch, s.money * 1.5 + 30);
            ctx.fx('coin');
            ch.stash = null;
            return tr('Thương nhân trả giá hời. Bạn không bao giờ biết kiếp trước mình muốn nhắn gì.', "The merchant pays handsomely. You will never know what your past self wanted to tell you.");
          },
        },
      ];
    },
  },
  {
    id: 'an_nhan_tien_kiep',
    minAge: 14,
    once: true,
    weight: 12,
    when: (c) => !!c.past && c.past.daoTam >= 25,
    title: tr('Ân nhân kiếp trước', "Benefactor from a past life"),
    text: (c) =>
      tr(`Một đoàn xe ngựa dừng trước cửa nhà. Vị tông chủ tóc bạc phơ bước xuống, quỳ sụp trước mặt bạn: "Ân công! Ngày ấy con chỉ là đứa bé ăn mày, chính ngài, ${c.past!.name}, đã cứu con. Con đợi ngài luân hồi đã bao năm."`, `A caravan of carriages stops at your door. A white-haired sect master steps down and drops to his knees before you: "Benefactor! Back then I was just a beggar child, and it was you, ${c.past!.name}, who saved me. I have waited so many years for you to be reborn."`),
    choices: () => [
      {
        label: tr('Nhận lễ tạ ơn', "Accept his gifts of thanks"),
        hint: tr('+linh thạch', "+spirit stones"),
        lean: 'trung',
        run: (c, ctx) => {
          const m = 200 + c.realm * 250;
          money(c, m);
          ctx.fx('coin', `+${m}`);
          return tr(`Ông dâng lên ${m} linh thạch và một hộp đan dược.`, `He presents ${m} spirit stones and a box of pills.`) + (addPill(c, 'truc_co'), '');
        },
      },
      {
        label: tr('Xin được bái vào tông môn', "Ask to join his sect"),
        hint: tr('có sư môn', "gain a sect"),
        lean: 'chinh',
        run: (c) => {
          joinSect(c, tr('Báo Ân Tông', "Baoen Sect"), 2);
          stat(c, 'khiVan', 8);
          return tr('Bạn trở thành thái thượng trưởng lão danh dự của Báo Ân Tông khi còn chưa kịp lớn.', "Before you've even grown up, you become an honorary Grand Elder of Baoen Sect.");
        },
      },
      {
        label: tr('Xin ông truyền công', "Ask him to pass on his power"),
        hint: tr('tu vi lớn', "big cultivation"),
        lean: 'trung',
        run: (c, ctx) => {
          addCult(c, reward(c, 2.5));
          ctx.fx('breakthrough', tr('Truyền công', "Power Transfer"));
          return tr('Ông đặt tay lên đỉnh đầu bạn. Một dòng chân khí ấm áp chảy khắp kinh mạch.', "He lays a hand on the crown of your head. A warm stream of true qi flows through your meridians.");
        },
      },
      {
        label: tr('"Ta không nhớ gì cả. Ông về đi."', "\"I remember nothing. Go home, old man.\""),
        hint: tr('phúc duyên', "Fortune"),
        lean: 'chinh',
        run: (c) => {
          dao(c, 10);
          stat(c, 'tamCanh', 12);
          return tr('Ông khóc rồi cười: "Vẫn y như ngày ấy." Ông để lại một lá bùa hộ mệnh rồi đi.', "He weeps, then laughs: \"Just the same as back then.\" He leaves you a protective talisman and goes.") + (giveItem(c, 'ngoc_boi'), '');
        },
      },
    ],
  },
  {
    id: 'oan_hon_tien_kiep',
    minAge: 12,
    once: true,
    weight: 12,
    when: (c) => !!c.past && c.past.daoTam <= -25,
    title: tr('Món nợ kiếp trước', "A debt from a past life"),
    text: (c) => tr(`Một kẻ lạ mặt chặn đường, mắt đỏ ngầu: "Ta nhận ra hồn phách ngươi. Kiếp trước ngươi là ${c.past!.name}, đã thảm sát cả nhà ta. Ta luân hồi chỉ để chờ ngày hôm nay."`, `A stranger blocks your path, eyes bloodshot: "I recognize your soul. In your past life you were ${c.past!.name}, and you slaughtered my whole family. I reincarnated just to wait for this day."`),
    choices: (c) => [
      {
        label: tr('Quỳ xuống chuộc tội', "Kneel and atone"),
        hint: c.linhThach >= 100 ? tr('-100 linh thạch', "-100 spirit stones") : tr('đạo tâm +', "Dao Heart +"),
        lean: 'chinh',
        run: (ch) => {
          money(ch, -100);
          dao(ch, 15);
          stat(ch, 'tamMa', -10);
          return tr('Hắn đứng lặng rất lâu, rồi quay đi. "Món nợ này... coi như ta xóa."', "He stands frozen for a long time, then turns away. \"This debt... consider it wiped clean.\"");
        },
      },
      {
        label: tr('Ra tay trước', "Strike first"),
        // Ngày 35 soát 20/11: nói rõ hắn mạnh cỡ nào (trước chỉ ghi "nguy hiểm", người Luyện Khí 1 vẫn lao vào kẻ Kim Đan)
        hint: Math.max(1, c.past!.realm - 1) > c.realm ? tr(`hắn cỡ ${realmName(Math.max(1, c.past!.realm - 1))}, mạnh hơn bạn: dễ chết`, `he is around ${realmName(Math.max(1, c.past!.realm - 1))}, stronger than you: likely death`) : tr('nguy hiểm', "dangerous"),
        lean: 'ta',
        run: (ch, ctx) => {
          dao(ch, -10);
          const d = duel(ch, ctx, Math.max(1, c.past!.realm - 1), tr(`Kẻ thù kiếp trước đâm một nhát xuyên tim. "Nợ máu, trả bằng máu."`, "Your enemy from a past life drives a blade through your heart. \"A blood debt is paid in blood.\""));
          if (ch.dead) return tr('Hắn mạnh hơn bạn tưởng.', "He is stronger than you thought.") + d.text;
          if (d.win) {
            money(ch, 80);
            return tr('Bạn giết hắn. Thêm một vòng oán hận nữa trong luân hồi.', "You kill him. One more turn of hatred on the wheel of reincarnation.");
          }
          return tr('Bạn trọng thương nhưng chạy thoát.', "You are gravely wounded but manage to escape.") + d.text;
        },
      },
      {
        label: tr('Bỏ chạy', "Flee"),
        lean: 'trung',
        run: (ch, ctx) => {
          ch.enemy = tr('kẻ thù từ kiếp trước', "an enemy from a past life");
          if (ctx.rnd() < 0.5) return tr('Bạn chạy thoát. Nhưng từ nay luôn có kẻ bám theo.', "You escape. But from now on, someone is always on your trail.");
          return tr('Hắn ném theo một mũi tiêu độc.', "He flings a poisoned dart after you.") + hurt(ch, 20, ctx);
        },
      },
      {
        label: tr('Mời thầy cầu siêu cho cả nhà hắn', "Hire a monk to pray for his family's souls"),
        hint: tr('-60 linh thạch', "-60 spirit stones"),
        lean: 'chinh',
        run: (ch) => {
          money(ch, -60);
          dao(ch, 8);
          stat(ch, 'khiVan', 6);
          return tr('Ba ngày ba đêm tụng kinh. Kẻ lạ mặt bật khóc, rồi biến mất như chưa từng tồn tại.', "Three days and three nights of sutras. The stranger bursts into tears, then vanishes as if he had never existed.");
        },
      },
    ],
  },
  {
    id: 'mo_tien_kiep',
    minAge: 10,
    once: true,
    weight: 8,
    when: (c) => !!c.past,
    title: tr('Ngôi mộ quen thuộc', "A familiar grave"),
    text: (c) =>
      tr(`Đi ngang một gò đất phủ đầy cỏ dại, bạn khựng lại. Bia mộ ghi: "${c.past!.name}, ${c.past!.age} tuổi, ${c.past!.realmName}". Dòng chữ nhỏ bên dưới: "${c.past!.cause ?? tr('Không rõ nguyên do.', "Cause unknown.")}". Không hiểu sao nước mắt bạn rơi.`, `Passing a mound overgrown with weeds, you stop short. The tombstone reads: "${c.past!.name}, ${c.past!.age} years old, ${c.past!.realmName}". Small letters beneath: "${c.past!.cause ?? tr('Không rõ nguyên do.', "Cause unknown.")}". For some reason, tears fall from your eyes.`),
    choices: (c) => [
      {
        label: tr('Nhổ cỏ, thắp hương', "Pull the weeds, burn incense"),
        hint: tr('tâm cảnh +, khí vận +', "Mind +, Luck +"),
        lean: 'chinh',
        run: (ch) => {
          stat(ch, 'tamCanh', 8);
          stat(ch, 'khiVan', 6);
          return tr('Gió thổi qua, lá rơi đầy vai bạn như một cái ôm.', "The wind blows and leaves fall on your shoulders like an embrace.");
        },
      },
      {
        label: tr('Ngồi thiền bên mộ', "Meditate by the grave"),
        hint: tr('nhớ lại công pháp cũ', "recall old techniques"),
        lean: 'trung',
        run: (ch, ctx) => {
          addCult(ch, reward(ch, 0.8 + c.past!.realm * 0.3));
          ctx.fx('layer', tr('Ký ức', "Memories"));
          return tr(`Từng mảnh ký ức ùa về. Bạn nhớ lại cách vận khí của ${c.past!.realmName}.`, `Fragments of memory flood back. You remember how qi flowed at ${c.past!.realmName}.`);
        },
      },
      {
        label: tr('Đào mộ xem có gì', "Dig up the grave to see what's inside"),
        hint: tr('tà, có thể bị nguyền', "evil, may be cursed"),
        lean: 'ta',
        run: (ch, ctx) => {
          dao(ch, -8);
          if (ctx.rnd() < 0.5) {
            money(ch, 60 + c.past!.realm * 60);
            return tr('Trong quan tài có ít đồ tùy táng. Bạn đang đào mộ chính mình.', "There are a few burial goods in the coffin. You are robbing your own grave.");
          }
          stat(ch, 'tamMa', 15);
          return tr('Bộ xương trong quan tài quay đầu nhìn bạn. Đêm đó bạn sốt cao, mê sảng gọi tên kiếp trước.', "The skeleton in the coffin turns its head to look at you. That night you burn with fever, deliriously calling your past-life name.");
        },
      },
      ...(c.past!.partner
        ? [
            {
              label: tr(`Hỏi thăm về ${c.past!.partner}`, `Ask about ${c.past!.partner}`),
              lean: 'trung' as const,
              run: (ch: Character) => {
                stat(ch, 'tamCanh', -4);
                stat(ch, 'ngoTinh', 6);
                return tr(`Ông lão giữ mộ kể: ${c.past!.partner} đã ngồi bên mộ này suốt mười năm, rồi một ngày không đến nữa.`, `The old grave keeper says ${c.past!.partner} sat by this grave for ten years, then one day stopped coming.`);
              },
            },
          ]
        : [{ label: tr('Lặng lẽ bỏ đi', "Quietly walk away"), lean: 'trung' as const, run: () => tr('Bạn tự nhủ: kiếp này, mình sẽ sống khác.', "You tell yourself: this life, I will live differently.") }]),
    ],
  },

  // ================= Dấu vết người chơi khác =================
  {
    id: 'mo_dao_huu',
    minAge: 10,
    cooldown: 8,
    weight: 10,
    when: (c) => (c.world?.graves.length ?? 0) > 0,
    title: tr('Mộ của một đạo hữu', "A fellow Daoist's grave"),
    text: (c) => {
      const g = grave(c)!;
      return tr(`Bên đường có một ngôi mộ: "${g.char}, ${g.age} tuổi, ${g.realm}". Phía dưới khắc nhỏ: "Linh hồn của đạo hữu ${g.player}". ${g.epitaph ? tr(`Bia đề: "${g.epitaph}"`, `The epitaph reads: "${g.epitaph}"`) : tr('Bia không đề chữ nào.', "The tombstone bears no epitaph.")}`, `By the roadside is a grave: "${g.char}, ${g.age} years old, ${g.realm}". Carved small beneath: "Soul of fellow Daoist ${g.player}". ${g.epitaph ? tr(`Bia đề: "${g.epitaph}"`, `The epitaph reads: "${g.epitaph}"`) : tr('Bia không đề chữ nào.', "The tombstone bears no epitaph.")}`);
    },
    choices: (c) => {
      const g = grave(c)!;
      const lv = /Phàm|Mortal/.test(g.realm) ? 0 : /Luyện Khí|Qi Refining/.test(g.realm) ? 1 : /Trúc Cơ|Foundation/.test(g.realm) ? 2 : /Kim Đan|Golden Core/.test(g.realm) ? 3 : 4;
      return [
        {
          label: tr('Thắp nén nhang', "Burn a stick of incense"),
          hint: tr('khí vận +', "Luck +"),
          lean: 'chinh',
          run: (ch) => {
            stat(ch, 'khiVan', 5);
            dao(ch, 3);
            return tr(`Bạn vái ba vái. Không biết ${g.player} ở phương nào, có cảm nhận được không.`, `You bow three times. Wherever ${g.player} may be, you wonder if they can feel it.`);
          },
        },
        {
          label: tr('Đọc di thư trong bia', "Read the last letter in the tombstone"),
          hint: tr('tu vi', "cultivation"),
          lean: 'trung',
          run: (ch, ctx) => {
            addCult(ch, reward(ch, 0.5 + lv * 0.3));
            ctx.fx('layer', tr('Di thư', "Last letter"));
            return tr(`Trong khe bia giấu mấy trang tâm đắc tu luyện của ${g.char}. ${g.cause ? tr(`Trang cuối viết: "${g.cause}"`, `The last page reads: "${g.cause}"`) : ''}`, `Hidden in a crack of the tombstone are a few pages of ${g.char}'s cultivation insights. ${g.cause ? tr(`Trang cuối viết: "${g.cause}"`, `The last page reads: "${g.cause}"`) : ''}`);
          },
        },
        {
          label: tr('Đào lấy đồ tùy táng', "Dig up the burial goods"),
          hint: tr('tà, có thể gặp oán hồn', "evil, may meet a vengeful ghost"),
          lean: 'ta',
          run: (ch, ctx) => {
            dao(ch, -8);
            if (ctx.rnd() < 0.55) {
              const m = 40 + lv * 80;
              money(ch, m);
              return tr(`Bạn lấy được ${m} linh thạch. Gió rít lên như tiếng ai chửi rủa.`, `You get ${m} spirit stones. The wind howls like someone cursing.`);
            }
            const f = fatal(ch, ctx, 0.12 + lv * 0.04, tr(`Oán hồn của ${g.char} bóp cổ bạn đến chết ngay trên miệng huyệt.`, `The vengeful ghost of ${g.char} strangles you to death right at the mouth of the grave.`));
            if (ch.dead) return tr('Nắp quan tài bật mở...', "The coffin lid flies open...") + f;
            if (f) return tr(`Oán hồn của ${g.char} hiện ra, bóp chặt cổ bạn.`, `The vengeful ghost of ${g.char} appears and grips your throat.`) + f; // thoát chết thật: kể nạn, không thưởng
            stat(ch, 'tamMa', 12);
            return tr(`Oán hồn của ${g.char} hiện ra. Bạn bỏ chạy, mất mấy năm không dám ngủ tối.`, `The vengeful ghost of ${g.char} appears. You flee, and for years you don't dare sleep at night.`);
          },
        },
        {
          label: tr('Khắc thêm một dòng lên bia', "Carve another line on the tombstone"),
          hint: tr('tâm cảnh +', "Mind +"),
          lean: 'trung',
          run: (ch) => {
            stat(ch, 'tamCanh', 6);
            return tr(`Bạn khắc: "${ch.name} từng ghé qua". Có lẽ một ngày ai đó cũng sẽ đọc được.`, `You carve: "${ch.name} was here". Perhaps someday someone will read it too.`);
          },
        },
      ];
    },
  },
  {
    id: 'ma_dau_the_gian',
    minAge: 16,
    minRealm: 1,
    once: true,
    weight: 8,
    when: (c) => !!c.world?.ma,
    title: tr('Ma đầu hiện thế', "A demon lord appears"),
    text: (c) =>
      tr(`Tin dữ truyền khắp nơi: ma đầu ${c.world!.ma!.name} (${c.world!.ma!.realmName}) - kẻ đứng đầu Tà phái, linh hồn của đạo hữu ${c.world!.ma!.player} - đang tàn sát một trấn nhỏ gần đây.`, `Grim news spreads everywhere: the demon lord ${c.world!.ma!.name} (${c.world!.ma!.realmName}) - leader of the Evil sects, soul of fellow Daoist ${c.world!.ma!.player} - is massacring a small town nearby.`),
    choices: (c) => {
      const m = c.world!.ma!;
      return [
        {
          label: tr('Xông tới ngăn hắn lại', "Rush in to stop him"),
          hint: m.realm > c.realm ? tr('rất nguy hiểm', "very dangerous") : tr('có cơ hội', "a chance"),
          lean: 'chinh',
          run: (ch, ctx) => {
            dao(ch, 12);
            const d = duel(ch, ctx, m.realm, tr(`Ma đầu ${m.name} chỉ phẩy tay. Bạn chết, trở thành một cái tên trong danh sách nạn nhân của hắn.`, `The demon lord ${m.name} merely waves a hand. You die, just another name on his list of victims.`));
            if (ch.dead) return tr('Bạn lao tới...', "You charge in...") + d.text;
            if (d.win) {
              addCult(ch, reward(ch, 2));
              stat(ch, 'khiVan', 15);
              ctx.fx('breakthrough', tr('Trảm ma', "Demon Slayer"));
              return tr(`Bạn đánh lui ${m.name}! Dân trấn lập đền thờ sống cho bạn.`, `You drive back ${m.name}! The townsfolk build a shrine to you while you still live.`);
            }
            return tr(`${m.name} cười khẩy rồi bỏ đi. Bạn may mắn giữ được mạng.`, `${m.name} sneers and leaves. You are lucky to keep your life.`) + d.text;
          },
        },
        {
          label: tr('Xin làm thuộc hạ của hắn', "Ask to become his underling"),
          hint: tr('tà, được công pháp', "evil, gain a technique"),
          lean: 'ta',
          run: (ch, ctx) => {
            dao(ch, -20);
            addCult(ch, reward(ch, 1.5));
            stat(ch, 'tamMa', 12);
            ctx.fx('evil', tr('Nhập ma môn', "Joined a demonic sect"));
            return tr(`${m.name} nhìn bạn một hồi: "Được. Từ nay ngươi là chó của ta." Hắn ném cho bạn một cuốn ma công.`, `${m.name} looks you over for a while: "Fine. From now on you are my dog." He tosses you a demonic manual.`);
          },
        },
        {
          label: tr('Sơ tán dân làng', "Evacuate the villagers"),
          hint: tr('đạo tâm +', "Dao Heart +"),
          lean: 'chinh',
          run: (ch, ctx) => {
            dao(ch, 8);
            if (ctx.rnd() < 0.2) return tr('Bạn dẫn được hơn trăm người chạy thoát, nhưng bị ma khí quét trúng.', "You lead over a hundred people to safety, but get swept by demonic qi.") + hurt(ch, 25, ctx);
            return tr('Bạn dẫn được hơn trăm người chạy thoát trong đêm.', "You lead over a hundred people to safety in the night.");
          },
        },
        {
          label: tr('Đóng cửa trốn', "Bolt the door and hide"),
          lean: 'trung',
          run: (ch) => {
            stat(ch, 'tamCanh', -5);
            return tr('Tiếng kêu khóc vọng về suốt ba đêm. Bạn bịt tai lại.', "Cries and wails echo for three nights. You cover your ears.");
          },
        },
      ];
    },
  },
  {
    id: 'minh_chu_chinh_dao',
    minAge: 16,
    once: true,
    weight: 6,
    when: (c) => !!c.world?.chinh,
    title: tr('Gặp minh chủ chính đạo', "Meeting the Righteous Path's leader"),
    text: (c) =>
      tr(`Trên quan đạo, một người áo trắng cưỡi hạc đi qua. Người qua đường xì xào: đó là ${c.world!.chinh!.name} (${c.world!.chinh!.realmName}), đệ nhất chính đạo đương thời, linh hồn của đạo hữu ${c.world!.chinh!.player}.`, `On the high road, a figure in white rides past on a crane. Passersby whisper: that is ${c.world!.chinh!.name} (${c.world!.chinh!.realmName}), foremost of the Righteous Path in this age, soul of fellow Daoist ${c.world!.chinh!.player}.`),
    choices: (c) => {
      const m = c.world!.chinh!;
      return [
        {
          label: tr('Quỳ xin chỉ điểm', "Kneel and beg for guidance"),
          hint: tr('tu vi', "cultivation"),
          lean: 'chinh',
          run: (ch, ctx) => {
            addCult(ch, reward(ch, 1.2));
            stat(ch, 'ngoTinh', 6);
            ctx.fx('layer', tr('Chỉ điểm', "Guidance"));
            return tr(`${m.name} chỉ nói một câu, mà bạn ngẫm cả mười năm.`, `${m.name} says just one sentence, and you ponder it for ten years.`);
          },
        },
        {
          label: tr('Thách đấu', "Challenge them"),
          hint: tr('liều', "reckless"),
          lean: 'trung',
          run: (ch, ctx) => {
            if (ctx.rnd() < 0.1 + (ch.realm - m.realm) * 0.2) {
              stat(ch, 'khiVan', 20);
              return tr(`Bạn đỡ được ba chiêu của ${m.name}! Cả giang hồ biết tên bạn.`, `You withstand three moves from ${m.name}! The whole jianghu learns your name.`);
            }
            return tr(`${m.name} chỉ dùng một ngón tay đã hạ bạn. "Còn non lắm."`, `${m.name} takes you down with a single finger. "Still green."`) + hurt(ch, 20, ctx);
          },
        },
        {
          label: tr('Trộm túi càn khôn của người', "Steal their qiankun pouch"),
          hint: tr('rất tà', "very evil"),
          lean: 'ta',
          run: (ch, ctx) => {
            dao(ch, -15);
            const f = fatal(ch, ctx, 0.25, tr(`${m.name} quay lại, ánh kiếm lóe lên. Bạn chết trước khi kịp chạm vào túi.`, `${m.name} turns, and a sword flashes. You die before you can touch the pouch.`));
            if (ch.dead) return tr('Bạn vừa đưa tay...', "You reach out...") + f;
            if (f) return tr(`${m.name} quay lại, ánh kiếm lóe lên ngay trước mặt bạn.`, `${m.name} turns, and a sword flashes right in front of you.`) + f; // thoát chết thật: kể nạn, không thưởng
            money(ch, 300);
            return tr('Bạn móc được ít linh thạch rồi lặn mất. Người cố ý tha cho bạn chăng?', "You fish out a few spirit stones and slip away. Did they let you go on purpose?");
          },
        },
        {
          label: tr('Đứng nhìn theo', "Watch them go"),
          lean: 'trung',
          run: (ch) => {
            stat(ch, 'tamCanh', 4);
            return tr('Bạn thầm thề: một ngày nào đó mình cũng sẽ bay như thế.', "You swear silently: one day, you too will fly like that.");
          },
        },
      ];
    },
  },

  // ================= Chuỗi: Trứng rồng =================
  {
    id: 'trung_la',
    minAge: 8,
    maxAge: 60,
    once: true,
    weight: 6,
    title: tr('Quả trứng lạ', "A strange egg"),
    text: () => tr('Sau trận lũ, bạn nhặt được một quả trứng to bằng cái gáo, vỏ có vảy, ấm như hòn than.', "After the flood, you find an egg the size of a water ladle, its shell scaled and warm as a live coal."),
    choices: () => [
      {
        label: tr('Ôm về ấp', "Take it home to hatch"),
        hint: tr('bắt đầu một chuyện dài', "the start of a long story"),
        lean: 'trung',
        run: (c) => {
          setArc(c, 'rong', 1);
          return tr('Bạn quấn trứng trong chăn bông, đêm nào cũng ôm ngủ.', "You wrap the egg in a cotton quilt and hug it to sleep every night.");
        },
      },
      {
        label: tr('Bán ở phường thị', "Sell it at the Market"),
        hint: tr('+linh thạch', "+spirit stones"),
        lean: 'trung',
        run: (c, ctx) => {
          money(c, 120);
          ctx.fx('coin', '+120');
          return tr('Lão thương nhân trả 120 linh thạch mà mắt sáng rực. Bạn hơi chột dạ.', "The old merchant pays 120 spirit stones, his eyes gleaming. You feel a little uneasy.");
        },
      },
      {
        label: tr('Luộc ăn', "Boil and eat it"),
        hint: tr('sức khỏe ++', "Health ++"),
        lean: 'ta',
        run: (c) => {
          stat(c, 'sucKhoe', 25);
          addCult(c, reward(c, 0.6));
          dao(c, -3);
          return tr('Ngon đến mức bạn liếm cả vỏ. Người nóng như lửa suốt ba ngày.', "So tasty you lick the shell. You burn like fire for three days.");
        },
      },
      {
        label: tr('Trả về chỗ cũ', "Put it back where you found it"),
        lean: 'chinh',
        run: (c) => {
          dao(c, 3);
          stat(c, 'khiVan', 4);
          return tr('Đêm đó có tiếng gầm rất xa vọng về, như một lời cảm ơn.', "That night a distant roar echoes back, like a thank-you.");
        },
      },
    ],
  },
  {
    id: 'trung_no',
    once: true,
    weight: 60,
    when: (c) => arc(c, 'rong')?.s === 1 && since(c, 'rong') >= 4,
    title: tr('Trứng nở', "The egg hatches"),
    text: () => tr('Rắc! Quả trứng nứt đôi. Một con rồng con bằng con mèo bò ra, kêu "éc éc" rồi cắn vào ngón tay bạn.', "Crack! The egg splits in two. A baby dragon the size of a cat crawls out, squeaks, and bites your finger."),
    choices: () => [
      {
        label: tr('Cho ăn linh thạch', "Feed it spirit stones"),
        hint: tr('-80 linh thạch', "-80 spirit stones"),
        lean: 'trung',
        run: (c) => {
          money(c, -80);
          setArc(c, 'rong', 2, 'thien');
          return tr('Nó nhai linh thạch rau ráu, vảy sáng lên như ngọc.', "It crunches the spirit stones, its scales shining like jade.");
        },
      },
      {
        label: tr('Cho uống máu của mình', "Feed it your own blood"),
        hint: tr('tà, rồng mạnh hơn', "evil, stronger dragon"),
        lean: 'ta',
        run: (c, ctx) => {
          dao(c, -6);
          setArc(c, 'rong', 2, 'ma');
          return tr('Nó uống máu bạn, mắt đỏ rực lên. Từ đó nó chỉ nghe lời mình bạn.', "It drinks your blood and its eyes glow red. From then on it obeys only you.") + hurt(c, 10, ctx);
        },
      },
      {
        label: tr('Đặt tên là Bé Bự', "Name it Chunky"),
        lean: 'chinh',
        run: (c) => {
          stat(c, 'tamCanh', 8);
          setArc(c, 'rong', 2, 'thien');
          return tr('Bé Bự vẫy đuôi. Bạn có thêm một người nhà.', "Chunky wags its tail. You have a new family member.");
        },
      },
      {
        label: tr('Thả về rừng', "Release it into the forest"),
        lean: 'chinh',
        run: (c) => {
          dao(c, 5);
          setArc(c, 'rong', 9);
          return tr('Nó ngoái lại ba lần trước khi biến vào rừng.', "It looks back three times before vanishing into the trees.");
        },
      },
    ],
  },
  {
    id: 'rong_lon',
    once: true,
    weight: 60,
    when: (c) => arc(c, 'rong')?.s === 2 && since(c, 'rong') >= 6,
    title: tr('Rồng con nổi điên', "The baby dragon runs wild"),
    text: (c) => tr(`Con rồng giờ đã dài ba trượng. Đêm qua nó ${arc(c, 'rong')?.v === 'ma' ? tr('cắn chết cả đàn bò của làng bên', "killed a whole herd of the next village's cattle") : tr('phá nát nửa vườn nhà hàng xóm', "wrecked half the neighbor's garden")}. Dân làng kéo đến đòi giết nó.`, `The dragon is now three zhang long. Last night it ${arc(c, 'rong')?.v === 'ma' ? tr('cắn chết cả đàn bò của làng bên', "killed a whole herd of the next village's cattle") : tr('phá nát nửa vườn nhà hàng xóm', "wrecked half the neighbor's garden")}. The villagers come demanding its death.`),
    choices: () => [
      {
        label: tr('Đền bù cho dân làng', "Compensate the villagers"),
        hint: tr('-200 linh thạch', "-200 spirit stones"),
        lean: 'chinh',
        run: (c) => {
          money(c, -200);
          setArc(c, 'rong', 3);
          return tr('Bạn bồi thường đến đồng cuối cùng. Rồng gục đầu vào lòng bạn.', "You pay them back to the last coin. The dragon lays its head in your lap.");
        },
      },
      {
        label: tr('Đứng chắn trước rồng', "Stand in front of the dragon"),
        hint: tr('có thể bị thương', "may get hurt"),
        lean: 'trung',
        run: (c, ctx) => {
          setArc(c, 'rong', 3);
          // #139: từ Trúc Cơ, đá phàm nhân không chạm được người tu đạo
          if (c.realm >= 2 || c.cosmos) return tr('Dân làng ném đá, viên nào bay tới gần bạn cũng rơi xuống đất. Họ nhìn nhau rồi lặng lẽ bỏ về.', "The villagers throw stones; every one drops to the ground before it reaches you. They exchange looks and quietly go home.");
          if (ctx.rnd() < 0.5) return tr('Dân làng ném đá trúng đầu bạn.', "A villager's stone hits you in the head.") + hurt(c, 20, ctx);
          return tr('Dân làng thấy bạn liều mạng, đành bỏ về.', "Seeing you risk your life, the villagers give up and go home.");
        },
      },
      {
        label: tr('Thả rồng ra cho nó xử', "Let the dragon deal with them"),
        hint: tr('tà', "evil"),
        lean: 'ta',
        run: (c) => {
          dao(c, -20);
          setArc(c, 'rong', 3, 'ma');
          stat(c, 'tamMa', 10);
          return tr('Một tiếng gầm. Rồi im lặng. Không ai dám đến nữa.', "A roar. Then silence. No one dares come again.");
        },
      },
      {
        label: tr('Đành bán rồng cho tông môn', "Sell the dragon to a sect"),
        hint: tr('+600 linh thạch', "+600 spirit stones"),
        lean: 'trung',
        run: (c, ctx) => {
          money(c, 600);
          ctx.fx('coin', '+600');
          setArc(c, 'rong', 9);
          stat(c, 'tamCanh', -10);
          return tr('Lúc bị dắt đi, nó vẫn ngoái nhìn bạn.', "As it is led away, it keeps looking back at you.");
        },
      },
    ],
  },
  {
    id: 'cuoi_rong',
    once: true,
    weight: 60,
    when: (c) => arc(c, 'rong')?.s === 3 && since(c, 'rong') >= 5,
    title: tr('Long kỵ', "Dragon Rider"),
    text: () => tr('Một buổi sáng, con rồng cúi đầu xuống trước mặt bạn, như mời bạn trèo lên lưng.', "One morning, the dragon lowers its head before you, as if inviting you onto its back."),
    choices: () => [
      {
        label: tr('Trèo lên!', "Climb on!"),
        hint: tr('có tọa kỵ', "gain a mount"),
        lean: 'trung',
        run: (c, ctx) => {
          c.mount = 'rong';
          setArc(c, 'rong', 4);
          stat(c, 'khiVan', 15);
          ctx.fx('breakthrough', tr('Long kỵ', "Dragon Rider"));
          return tr('Rồng vút lên mây. Cả làng ngửa cổ nhìn theo, há hốc mồm. Từ nay bạn là Long Kỵ Sĩ.', "The dragon soars into the clouds. The whole village cranes their necks, jaws dropping. From now on you are a Dragon Rider.");
        },
      },
      {
        label: tr('Để nó tự do bay đi', "Let it fly free"),
        lean: 'chinh',
        run: (c) => {
          dao(c, 6);
          stat(c, 'tamCanh', 12);
          setArc(c, 'rong', 9);
          return tr('Nó bay vòng quanh nhà ba vòng rồi biến mất giữa trời xanh.', "It circles the house three times, then vanishes into the blue sky.");
        },
      },
      {
        label: tr('Lấy một vảy rồng làm kỷ niệm', "Take a dragon scale as a keepsake"),
        hint: tr('tu vi', "cultivation"),
        lean: 'trung',
        run: (c) => {
          addCult(c, reward(c, 1.5));
          c.mount = 'rong';
          setArc(c, 'rong', 4);
          return tr('Vảy rồng nóng hổi trong tay, linh khí cuồn cuộn. Rồng vẫn ở lại bên bạn.', "The dragon scale is hot in your hand, surging with spiritual qi. The dragon stays by your side.");
        },
      },
    ],
  },

  // ================= Chuỗi: Đồ đệ =================
  {
    id: 'nhan_de_tu',
    minAge: 25,
    minRealm: 2,
    once: true,
    weight: 7,
    title: tr('Đứa trẻ quỳ trước cửa', "A child kneeling at the door"),
    text: () => tr('Một đứa trẻ rách rưới quỳ trước động phủ suốt ba ngày ba đêm giữa trời tuyết, chỉ để xin được làm đồ đệ.', "A ragged child kneels before your cave abode for three days and nights in the snow, just to beg to become your disciple."),
    choices: () => [
      {
        label: tr('Nhận làm đồ đệ', "Take them as a disciple"),
        hint: tr('bắt đầu một chuyện dài', "the start of a long story"),
        lean: 'chinh',
        run: (c) => {
          setArc(c, 'de_tu', 1);
          stat(c, 'tamCanh', 5);
          const n = nhanDeTu(c);
          return tr(`Bạn khoác áo cho nó. Nó lạy chín lạy, trán chảy máu. Từ nay bạn có đồ đệ ${thuTuDeTu(n)}.`, `You wrap your coat around the child. They kowtow nine times until their forehead bleeds. You now have your ${thuTuDeTu(n)} disciple.`);
        },
      },
      {
        label: tr('Cho ít tiền rồi đuổi đi', "Give some money and send them away"),
        lean: 'trung',
        run: (c) => {
          money(c, -10);
          return tr('Đứa trẻ cầm tiền, nhìn bạn rất lâu rồi đi.', "The child takes the money, looks at you for a long time, then leaves.");
        },
      },
      {
        label: tr('Bắt làm nô bộc', "Make them a servant"),
        hint: tr('tà', "evil"),
        lean: 'ta',
        run: (c) => {
          dao(c, -8);
          money(c, 20);
          setArc(c, 'de_tu', 1, 'no');
          return tr('Nó gánh nước bổ củi cho bạn không công. Ánh mắt nó ngày càng lạnh.', "The child hauls water and chops wood for you unpaid. Their eyes grow colder by the day.");
        },
      },
    ],
  },
  {
    id: 'day_de_tu',
    once: true,
    weight: 60,
    when: (c) => arc(c, 'de_tu')?.s === 1 && since(c, 'de_tu') >= 6,
    title: tr('Truyền nghề', "Passing on the art"),
    text: () => tr('Đồ đệ ngày càng giỏi. Đêm nay nó xin bạn truyền tuyệt học áp đáy hòm.', "Your disciple grows more skilled by the day. Tonight they ask you to teach your secret ultimate technique."),
    choices: () => [
      {
        label: tr('Truyền hết, không giữ gì', "Teach everything, hold nothing back"),
        hint: tr('tâm cảnh +', "Mind +"),
        lean: 'chinh',
        run: (c) => {
          setArc(c, 'de_tu', 2, 'het');
          stat(c, 'tamCanh', 6);
          return tr('Bạn dạy nó tất cả. Nó cảm động đến bật khóc.', "You teach them everything. They are moved to tears.");
        },
      },
      {
        label: tr('Giữ lại một chiêu', "Hold back one move"),
        hint: tr('phòng thân', "just in case"),
        lean: 'trung',
        run: (c) => {
          setArc(c, 'de_tu', 2, 'giu');
          return tr('Bạn dạy chín phần, giữ lại một. Sư phụ nào cũng vậy.', "You teach nine parts and keep one. Every master does.");
        },
      },
      {
        label: tr('Dạy nó ma công', "Teach them demonic arts"),
        hint: tr('tà', "evil"),
        lean: 'ta',
        run: (c) => {
          setArc(c, 'de_tu', 2, 'ma');
          dao(c, -10);
          return tr('Nó học rất nhanh. Quá nhanh.', "They learn very fast. Too fast.");
        },
      },
      {
        label: tr('Dùng nó làm lô đỉnh tu luyện', "Use them as a cultivation cauldron"),
        hint: tr('rất tà, tu vi lớn', "very evil, big cultivation"),
        lean: 'ta',
        run: (c, ctx) => {
          dao(c, -30);
          addCult(c, reward(c, 2.5));
          stat(c, 'tamMa', 20);
          setArc(c, 'de_tu', 9);
          ctx.fx('evil', tr('Hút công', "Absorb Power"));
          return tr('Bạn hút cạn tu vi của nó. Thân xác nó khô quắt như lá mùa thu.', "You drain all of their cultivation. Their body withers like an autumn leaf.");
        },
      },
    ],
  },
  {
    id: 'de_tu_xuat_su',
    once: true,
    weight: 60,
    when: (c) => arc(c, 'de_tu')?.s === 2 && since(c, 'de_tu') >= 8,
    title: tr('Đồ đệ trở về', "The disciple returns"),
    text: (c) => {
      const v = arc(c, 'de_tu')?.v;
      return v === 'het' || v === 'ma' || v === 'no'
        ? tr('Đồ đệ trở về sau nhiều năm du lịch. Nhưng ánh mắt nó lạ lắm. Sau lưng nó là một đám hắc y nhân.', "Your disciple returns after many years of travel. But there's something strange in their eyes. Behind them stands a band of men in black.")
        : tr('Đồ đệ trở về, mặt lạnh như băng: "Sư phụ, xin người giao ra chức chưởng môn."', "Your disciple returns, face cold as ice: \"Master, please hand over the position of Sect Leader.\"");
    },
    choices: (c) => {
      const v = arc(c, 'de_tu')?.v;
      const betray = v === 'ma' || v === 'no' || (v === 'het' && c.daoTam < 20);
      const fight: Choice = {
        label: v === 'giu' ? tr('Dùng chiêu giữ lại', "Use the move you held back") : tr('Giao đấu với đồ đệ', "Duel your disciple"),
        hint: v === 'giu' ? tr('nó không biết chiêu này', "they don't know this move") : tr('nó biết hết chiêu của bạn', "they know all your moves"),
        lean: 'trung',
        run: (ch, ctx) => {
          setArc(ch, 'de_tu', 3);
          if (v === 'giu') {
            addCult(ch, reward(ch, 1));
            return tr('Nó dùng đúng chiêu bạn dạy. Bạn dùng chiêu bạn chưa dạy. Nó quỳ xuống, máu ứa nơi khóe miệng.', "They use exactly the moves you taught. You use the one you never taught. They fall to their knees, blood trickling from the corner of their mouth.");
          }
          const f = fatal(ch, ctx, betray ? 0.55 : 0.25, tr('Đồ đệ dùng chính chiêu bạn dạy, một kiếm xuyên tim. "Sư phụ, người dạy con chu đáo quá."', "Your disciple uses the very move you taught - one sword through the heart. \"Master, you taught me so thoroughly.\""));
          if (ch.dead) {
            ch.endTag = 'phan_do';
            return tr('Hai thầy trò giao chiến...', "Master and disciple clash...") + f;
          }
          return tr('Bạn thắng sát nút. Đồ đệ bỏ đi trong đêm.', "You win by a hair. Your disciple leaves in the night.") + (f ?? '') + hurt(ch, 25, ctx);
        },
      };
      return [
        fight,
        {
          label: tr('Nhường chức cho nó', "Hand over the position"),
          lean: 'chinh',
          run: (ch) => {
            setArc(ch, 'de_tu', 3);
            ch.sect = null;
            stat(ch, 'tamCanh', betray ? -10 : 10);
            return betray ? tr('Nó lên ngôi rồi đuổi bạn xuống núi giữa mùa đông.', "They take the seat, then drive you down the mountain in the dead of winter.") : tr('Nó lên ngôi, rồi quỳ trước mặt bạn: "Con chỉ muốn sư phụ được nghỉ ngơi."', "They take the seat, then kneel before you: \"I only wanted you to finally rest, Master.\"");
          },
        },
        {
          label: tr('Bỏ trốn khỏi sơn môn', "Flee the sect"),
          lean: 'trung',
          run: (ch) => {
            setArc(ch, 'de_tu', 3);
            ch.enemy = tr('đồ đệ phản sư', "disciple betrays master");
            money(ch, -Math.round(ch.linhThach * 0.4));
            return tr('Bạn mang theo được một ít, còn lại đều để lại cho nó.', "You manage to take a little with you; the rest you leave to them.");
          },
        },
      ];
    },
  },

  // ================= Chuỗi: Từ hôn =================
  {
    id: 'tu_hon',
    minAge: 15,
    maxAge: 24,
    maxRealm: 1,
    once: true,
    weight: 10,
    title: tr('Từ hôn', "Broken engagement"),
    text: (c) =>
      tr(`${c.gender === 'nam' ? tr('Hôn thê', "fiancée") : tr('Hôn phu', "fiancé")} từ nhỏ của bạn - nay đã là đệ tử nội môn Thiên Kiếm Tông - đến tận nhà, ném tờ hôn thư xuống đất trước mặt cả họ: "Phế vật như ngươi, không xứng với ta."`, `Your childhood ${c.gender === 'nam' ? tr('Hôn thê', "fiancée") : tr('Hôn phu', "fiancé")} - now an inner disciple of Tianjian Sect - comes to your house and throws the marriage contract on the floor before your whole clan: "Trash like you is not worthy of me."`),
    choices: () => [
      {
        label: tr('"Ba mươi năm Hà Đông, ba mươi năm Hà Tây! Hẹn ba năm sau!"', "\"Thirty years east of the river, thirty years west! Three years from now - we'll see!\""),
        hint: tr('hẹn ước 3 năm', "three-year pact"),
        lean: 'trung',
        run: (c) => {
          setArc(c, 'tu_hon', 1);
          stat(c, 'ngoTinh', 5);
          stat(c, 'tamMa', 6);
          return tr('Cả sảnh đường im phăng phắc. Rồi ai đó bật cười. Bạn nắm chặt tay đến bật máu.', "The whole hall falls silent. Then someone laughs. You clench your fists until they bleed.");
        },
      },
      {
        label: tr('Nhặt hôn thư lên, xé đôi', "Pick up the contract and tear it in two"),
        hint: tr('tâm cảnh +', "Mind +"),
        lean: 'chinh',
        run: (c) => {
          stat(c, 'tamCanh', 10);
          return tr('"Ngươi đi đi." Bạn quay lưng. Lòng nhẹ bẫng.', "\"Just go.\" You turn your back. Your heart feels light.");
        },
      },
      {
        label: tr('Quỳ xuống van xin', "Kneel and beg"),
        lean: 'trung',
        run: (c) => {
          stat(c, 'tamMa', 12);
          stat(c, 'khiVan', -5);
          return tr('Người ấy cười khinh rồi bỏ đi. Cả làng bàn tán suốt mấy năm.', "They laugh with contempt and leave. The village gossips about it for years.");
        },
      },
      {
        label: tr('Tát hộ vệ của người ấy', "Slap their bodyguard"),
        hint: tr('nguy hiểm', "dangerous"),
        lean: 'ta',
        run: (c, ctx) => {
          const f = fatal(c, ctx, 0.08, tr('Tên hộ vệ Trúc Cơ kỳ phản đòn một chưởng. Bạn chết ngay trong ngày bị từ hôn.', "The Foundation Establishment bodyguard strikes back with one palm. You die on the very day your engagement is broken."));
          if (c.dead) return tr('Bạn vung tay...', "You swing your hand...") + f;
          return tr('Bạn bị đánh gãy ba cái xương sườn, nhưng thấy rất đã.', "You get three ribs broken, but it felt great.") + (f ?? '') + hurt(c, 25, ctx);
        },
      },
    ],
  },
  {
    id: 'tam_nien_chi_uoc',
    once: true,
    weight: 80,
    when: (c) => arc(c, 'tu_hon')?.s === 1 && since(c, 'tu_hon') >= 3,
    title: tr('Ước hẹn ba năm', "The three-year pact"),
    text: (c) => tr(`Ba năm đã đến. Trên lôi đài Thiên Kiếm Tông, người từng từ hôn bạn đang đợi, đã là ${realmName(Math.max(2, c.realm))}. Cả thiên hạ đến xem.`, `Three years have passed. On the arena of Tianjian Sect, the one who broke off your engagement waits, now at ${realmName(Math.max(2, c.realm))}. The whole world has come to watch.`),
    choices: () => {
      const go =
        (bonus: number, extra?: (c: Character, ctx: EffectCtx) => string): Choice['run'] =>
        (c, ctx) => {
          const pre = extra ? extra(c, ctx) : '';
          if (c.dead) return pre;
          const p = luck(c, 0.15 + c.realm * 0.2 + bonus);
          if (ctx.rnd() < p) {
            setArc(c, 'tu_hon', 2, 'thang');
            stat(c, 'khiVan', 20);
            money(c, 300);
            ctx.fx('breakthrough', tr('Vả mặt!', "Face slap!"));
            return pre + tr('Một chưởng. Người ấy bay khỏi lôi đài. Cả quảng trường nín thở rồi vỡ òa. "Đừng khinh thiếu niên nghèo!"', "One palm. They fly off the arena. The whole square holds its breath, then erupts. \"Never look down on a poor youth!\"");
          }
          setArc(c, 'tu_hon', 2, 'thua');
          stat(c, 'tamMa', 15);
          return pre + tr('Bạn thua thảm. Người ấy nói nhỏ: "Ba năm nữa, ta vẫn đợi." Hóa ra người ấy chưa từng quên bạn.', "You lose badly. They say softly: \"In three more years, I'll still be waiting.\" Turns out they never forgot you.") + hurt(c, 20, ctx);
        };
      return [
        { label: tr('Bước lên lôi đài', "Step onto the arena"), lean: 'trung', run: go(0) },
        {
          label: tr('Uống cấm đan trước khi lên đài', "Take a forbidden pill before the fight"),
          hint: tr('tà, mạnh hơn, hại thân', "evil, stronger, harms the body"),
          lean: 'ta',
          run: go(0.25, (c, ctx) => {
            dao(c, -6);
            return hurt(c, 15, ctx);
          }),
        },
        {
          label: tr('Nhờ sư phụ đứng sau lưng', "Have your Master stand behind you"),
          hint: tr('-100 linh thạch', "-100 spirit stones"),
          lean: 'trung',
          run: go(0.12, (c) => {
            money(c, -100);
            return '';
          }),
        },
        {
          label: tr('Không đến', "Don't show up"),
          lean: 'trung',
          run: (c) => {
            setArc(c, 'tu_hon', 2, 'tron');
            stat(c, 'tamMa', 10);
            stat(c, 'khiVan', -8);
            return tr('Bạn trốn trong núi. Thiên hạ cười suốt mười năm.', "You hide in the mountains. The world laughs for ten years.");
          },
        },
      ];
    },
  },

  // ================= Meme: Hệ Thống =================
  {
    id: 'he_thong',
    minAge: 12,
    once: true,
    weight: 0.5,
    when: (c) => !arc(c, 'he_thong'),
    title: tr('Đinh!', "Ding!"),
    text: () => tr('"Đinh! Phát hiện ký chủ phù hợp. Hệ Thống Tu Tiên Vô Địch Siêu Cấp đang được kích hoạt... 99%... Xin ký chủ xác nhận trói định."', "\"Ding! Suitable host detected. Super Invincible Cultivation System activating... 99%... Host, please confirm binding.\""),
    choices: () => [
      {
        label: tr('Đồng ý trói định', "Agree to bind"),
        hint: tr('nhận quà tân thủ', "get a newbie gift"),
        lean: 'trung',
        run: (c, ctx) => {
          setArc(c, 'he_thong', 1);
          money(c, 100);
          addPill(c, 'tu_khi', 3);
          ctx.fx('coin', tr('Quà tân thủ', "Newbie gift"));
          return tr('"Đinh! Trói định thành công. Tặng ký chủ gói quà tân thủ: 100 linh thạch, 3 Tụ Khí Đan."', "\"Ding! Binding successful. Gifting host a newbie pack: 100 spirit stones, 3 Qi Gathering Pills.\"") + ' ' + htBind(c);
        },
      },
      {
        label: tr('Hỏi có gói VIP không', "Ask if there's a VIP pack"),
        hint: tr('-648 linh thạch', "-648 spirit stones"),
        lean: 'trung',
        run: (c, ctx) => {
          const pay = Math.min(648, c.linhThach);
          money(c, -pay);
          setArc(c, 'he_thong', 1);
          addCult(c, reward(c, 1.5));
          stat(c, 'khiVan', 10);
          ctx.fx('breakthrough', 'VIP');
          return tr(`"Đinh! Ký chủ nạp ${pay} linh thạch. Tặng danh hiệu: Đại Gia Tu Tiên." Không hiểu sao bạn thấy mình bị lừa.`, `"Ding! Host has topped up ${pay} spirit stones. Title granted: Cultivation Big Spender." For some reason you feel scammed.`) + ' ' + htBind(c);
        },
      },
      {
        label: tr('Từ chối', "Refuse"),
        lean: 'trung',
        run: (c, ctx) => {
          setArc(c, 'he_thong', 9);
          return tr('"Đinh! Ký chủ từ chối. Hệ thống tự hủy sau 3... 2... 1..." Bùm.', "\"Ding! Host refused. System self-destructing in 3... 2... 1...\" Boom.") + hurt(c, 25, ctx);
        },
      },
      {
        label: tr('Đi chùa trừ tà', "Go to a temple for an exorcism"),
        hint: tr('đạo tâm +', "Dao Heart +"),
        lean: 'chinh',
        run: (c) => {
          setArc(c, 'he_thong', 9);
          dao(c, 5);
          return tr('Sư thầy gõ mõ ba ngày. Giọng nói lẩm bẩm "Đinh... đinh..." rồi tắt hẳn.', "The monk taps his wooden fish for three days. The voice mutters \"Ding... ding...\" then goes silent for good.");
        },
      },
    ],
  },
  {
    id: 'he_thong_nv',
    weight: 40,
    cooldown: 4,
    when: (c) => {
      const a = arc(c, 'he_thong');
      return !!a && a.s >= 1 && a.s < 3 && since(c, 'he_thong') >= 4;
    },
    title: tr('Nhiệm vụ hệ thống', "System quest"),
    text: (c) =>
      arc(c, 'he_thong')?.s === 1
        ? tr('"Đinh! Nhiệm vụ hằng ngày: hãy đi tát một tên công tử nhà giàu. Phần thưởng: bí ẩn."', "\"Ding! Daily quest: go slap a rich young master. Reward: mystery.\"")
        : tr('"Đinh! Nhiệm vụ chính tuyến: tỏ tình với người đẹp nhất trấn trong vòng 1 canh giờ. Thất bại: điện giật."', "\"Ding! Main quest: confess your love to the prettiest person in town within 1 hour. Failure: electric shock.\""),
    choices: () => [
      {
        label: tr('Làm nhiệm vụ', "Do the quest"),
        lean: 'trung',
        run: (c, ctx) => {
          const a = arc(c, 'he_thong')!;
          setArc(c, 'he_thong', a.s + 1);
          addCult(c, reward(c, 1.2));
          ctx.fx('layer', tr('Hoàn thành', "Complete"));
          if (ctx.rnd() < 0.3) return tr('"Đinh! Hoàn thành." Bạn nhận phần thưởng, nhưng cũng nhận một trận đòn.', "\"Ding! Complete.\" You receive the reward, and also a beating.") + hurt(c, 15, ctx);
          return tr('"Đinh! Nhiệm vụ hoàn thành. Thưởng: tu vi." Thiên hạ nhìn bạn như nhìn kẻ điên.', "\"Ding! Quest complete. Reward: cultivation.\" Everyone looks at you like a madman.");
        },
      },
      {
        label: tr('Mặc cả với hệ thống', "Haggle with the system"),
        lean: 'trung',
        run: (c) => {
          const a = arc(c, 'he_thong')!;
          setArc(c, 'he_thong', a.s + 1);
          money(c, 50);
          return tr('"Đinh! Hệ thống không hiểu ký chủ nói gì... nhưng thôi, thưởng 50 linh thạch cho đỡ phiền."', "\"Ding! System does not understand what host is saying... but fine, here's 50 spirit stones to make you go away.\"");
        },
      },
      { label: tr('Phớt lờ', "Ignore it"), lean: 'trung', run: (c, ctx) => tr('"Đinh! Nhiệm vụ thất bại. Trừng phạt: điện giật 10 vạn vôn." Tóc bạn dựng đứng suốt một tháng.', "\"Ding! Quest failed. Penalty: 100,000-volt electric shock.\" Your hair stands on end for a month.") + hurt(c, 18, ctx) },
    ],
  },

  // ================= Meme: Xuyên không =================
  {
    id: 'xuyen_khong',
    minAge: 16,
    once: true,
    weight: 0.6,
    title: tr('Khe nứt không gian', "A crack in space"),
    text: () => tr('Trời quang mây tạnh, không gian trước mặt bỗng nứt toác. Bên kia có ánh đèn rực rỡ, tiếng còi inh ỏi và mùi... phở?', "On a clear, cloudless day, the space before you suddenly splits open. On the other side: dazzling lights, blaring horns, and the smell of... pho?"),
    choices: () => [
      {
        label: tr('Bước vào', "Step in"),
        // 19/11 (góp ý #135, #283): người chơi mất kiếp mạnh vì không biết bước vào là khép kiếp
        hint: tr('??? Bước qua là kiếp này khép lại', '??? Stepping through ends this life'),
        lean: 'trung',
        run: (c, ctx) => {
          c.dead = true;
          c.endTag = 'xuyen_khong';
          c.cause = tr('Bước qua khe nứt không gian. Bạn tỉnh dậy giữa ngã tư Cửa Nam, Hà Nội năm 2026. Một bác xe ôm hỏi: "Đi đâu cháu?"', "Stepped through a crack in space. You wake up at the Cửa Nam intersection, Hanoi, in 2026. A motorbike-taxi driver asks: \"Where to, kid?\"");
          ctx.fx('breakthrough', tr('XUYÊN KHÔNG', "TRANSMIGRATION"));
          return c.cause;
        },
      },
      {
        label: tr('Ném một hòn đá sang', "Throw a stone through"),
        lean: 'trung',
        run: (c) => {
          stat(c, 'khiVan', 8);
          return tr('Một lúc sau có thứ bay ngược lại: một cục gạch phát sáng, có chữ "Nokia". Nó không bao giờ vỡ.', "A while later something flies back: a glowing brick with the word \"Nokia\" on it. It never breaks.");
        },
      },
      {
        label: tr('Kéo một người bên kia sang', "Pull someone from the other side"),
        hint: tr('có đạo lữ?', "a Dao companion?"),
        lean: 'trung',
        run: (c) => {
          if (c.partner) return tr('Bạn kéo được một anh shipper. Anh ấy giao xong đơn rồi đòi về.', "You pull through a delivery guy. He finishes dropping off his order and demands to go back.");
          c.partner = c.gender === 'nam' ? tr('Linh, cô nhân viên văn phòng', "Ling, an office worker") : tr('Tùng, anh shipper', "Song, a delivery guy");
          stat(c, 'tamCanh', 10);
          return tr(`Bạn kéo sang được ${c.partner}. Hai người nhìn nhau ngơ ngác, rồi phá lên cười.`, `You pull ${c.partner} through. You stare at each other, baffled, then burst out laughing.`);
        },
      },
      {
        label: tr('Lấy bùa dán kín lại', "Seal it shut with talismans"),
        lean: 'chinh',
        run: (c) => {
          dao(c, 3);
          return tr('Khe nứt khép lại. Bạn mãi không biết bên kia là thế giới nào.', "The crack closes. You never learn what world lay on the other side.");
        },
      },
    ],
  },

  // ================= Thiên phú: Hộp bí ẩn =================
  {
    id: 'hop_bi_an',
    minAge: 70,
    once: true,
    weight: 200,
    when: (c) => hasGift(c, 'g_hop'),
    title: tr('Chiếc hộp bí ẩn', "The mysterious box"),
    text: () => tr('Năm nay bạn tròn bảy mươi. Chiếc hộp mang theo từ lúc lọt lòng bỗng tự phát sáng, nắp hé mở.', "This year you turn seventy. The box you have carried since birth suddenly glows, and its lid creaks open."),
    choices: () => [
      {
        label: tr('Mở hộp', "Open the box"),
        lean: 'trung',
        run: (c, ctx) => {
          const r = ctx.rnd();
          if (r < 0.45) {
            addCult(c, reward(c, 6));
            addLife(c, 30);
            ctx.fx('breakthrough', tr('Tiên duyên', "Immortal affinity"));
            return tr('Trong hộp là một viên tiên đan cổ. Bạn trẻ lại ba mươi tuổi, tu vi tăng vọt.', "Inside is an ancient immortal pill. You grow thirty years younger and your cultivation soars.");
          }
          if (r < 0.8) {
            money(c, 3000);
            ctx.fx('coin', '+3000');
            return tr('Trong hộp là một tấm bản đồ kho báu. Bạn trở thành phú ông.', "Inside is a treasure map. You become a rich man.");
          }
          return tr('Trong hộp là một tờ giấy: "Cảm ơn đã chờ đợi. Đây chỉ là một cái hộp." Bạn cười đến chảy nước mắt.', "Inside is a slip of paper: \"Thanks for waiting. This is just a box.\" You laugh until you cry.");
        },
      },
      {
        label: tr('Không mở, truyền lại cho con cháu', "Don't open it, pass it down to your descendants"),
        lean: 'chinh',
        run: (c) => {
          dao(c, 8);
          stat(c, 'tamCanh', 15);
          return tr('Có những bí ẩn để dành mới đẹp.', "Some mysteries are more beautiful kept.");
        },
      },
    ],
  },
  // ================= Ngày 35, đêm 20/11/2026: cốt truyện mới ở phàm giới =================
  // ct_20261120_1 Lò đúc chuông (2 bước). Nối Thiên thư quyển I, mảnh I "Tiếng chuông": chỉ hiện cho người đã mở mảnh ấy.
  {
    id: 'ct_20261120_1',
    minAge: 16,
    maxAge: 120,
    once: true,
    weight: 8,
    when: (c) => hasLore(c, 'chuong') && !ctArc(c, 'ct20261120_1'),
    title: tr('Lò đúc chuông', 'The bell foundry'),
    text: () =>
      tr(
        'Lão Đồng, thợ đúc chuông ở trấn Hạ Khê, thuê bạn kéo bễ. Lão bảo năm mươi năm nay, đêm nào trong trấn có người chết thì chuông trong lò tự ngân một tiếng. Đêm đầu tiên lão hỏi: "Ngươi có bao giờ nghe tiếng chuông lúc chết không?"',
        'Old Dong, the bell-founder of Ha Khe town, hires you to work his bellows. He says that for fifty years, whenever someone in town dies at night, a bell in his workshop rings once on its own. On your first night he asks: "Have you ever heard a bell when you died?"',
      ),
    choices: () => [
      {
        label: tr('Kể thật: lần nào chết cũng nghe', 'Tell the truth: you hear one every time you die'),
        hint: tr('tâm cảnh +, ở lại học nghề', 'Mind +, stay as his apprentice'),
        lean: 'chinh',
        run: (c) => {
          stat(c, 'tamCanh', 6);
          ctSet(c, 'ct20261120_1', 1, 'ke');
          return tr('Lão nhìn bạn rất lâu rồi gật đầu, không hỏi thêm. Từ hôm đó lão dạy bạn cách nghe tiếng đồng nguội.', 'He looks at you for a long time, then nods and asks nothing more. From that day he teaches you how to listen to cooling bronze.');
        },
      },
      {
        label: tr('Im lặng kéo bễ, nghe lão kể', 'Keep pumping the bellows and listen'),
        hint: tr('ngộ tính +, ở lại làm', 'Insight +, stay on'),
        lean: 'trung',
        run: (c) => {
          stat(c, 'ngoTinh', 4);
          ctSet(c, 'ct20261120_1', 1, 'nghe');
          return tr('Bạn không đáp. Lão cũng không cần câu trả lời, cứ kể về từng quả chuông lão đúc, quả nào đang treo ở đâu.', 'You say nothing. He does not need an answer either, and tells you about every bell he has cast and where each one hangs now.');
        },
      },
      {
        label: tr('Cười: "Chết rồi thì nghe gì nữa"', 'Laugh: "The dead don\'t hear anything"'),
        hint: tr('+linh thạch, thôi việc', '+spirit stones, quit the job'),
        lean: 'trung',
        run: (c, ctx) => {
          money(c, 30);
          ctx.fx('coin', '+30');
          ctSet(c, 'ct20261120_1', 9);
          return tr('Lão cũng cười, trả đủ tiền công một tháng rồi thôi. Lúc bạn ra khỏi trấn, trong lò có tiếng ngân rất khẽ.', 'He laughs too, pays you a full month and lets you go. As you leave town, something in the workshop hums very softly.');
        },
      },
      {
        label: tr('Đòi gấp đôi tiền công', 'Demand double wages'),
        hint: tr('+linh thạch, nghiêng tà', '+spirit stones, leans Evil'),
        lean: 'ta',
        run: (c, ctx) => {
          money(c, 60);
          dao(c, -3);
          ctx.fx('coin', '+60');
          ctSet(c, 'ct20261120_1', 9);
          return tr('Lão trả, không mặc cả câu nào. Bạn làm hết mùa rồi đi, không bao giờ biết quả chuông cuối của lão kêu thế nào.', 'He pays without haggling. You work out the season and leave, never learning how his last bell sounded.');
        },
      },
    ],
  },
  {
    id: 'ct_20261120_1b',
    once: true,
    weight: 60,
    when: (c) => ctNext(c, 'ct20261120_1', 1, 3),
    title: tr('Quả chuông cuối đời', 'The last bell'),
    text: () =>
      tr(
        'Ba năm sau, lão Đồng đúc xong quả chuông cuối cùng, to bằng cái chum. Lão ho ra máu mà vẫn cười: "Chuông này chưa ai gõ. Ta muốn tiếng đầu tiên của nó tiễn ta." Đêm ấy lão nằm cạnh lò, hơi thở mỏng dần.',
        'Three years later, Old Dong finishes his last bell, as big as a water jar. He coughs blood and still smiles: "No one has struck this bell yet. I want its first sound to see me off." That night he lies by the furnace, his breath growing thin.',
      ),
    choices: (c) => [
      {
        label: tr('Gõ một tiếng lúc lão nhắm mắt', 'Strike it once as he closes his eyes'),
        hint: tr('tâm ma -, đạo tâm +', 'Heart Demon -, Dao Heart +'),
        lean: 'chinh',
        run: (ch) => {
          stat(ch, 'tamCanh', 8);
          stat(ch, 'tamMa', -6);
          dao(ch, 4);
          ctSet(ch, 'ct20261120_1', 2);
          return tr('Tiếng chuông lan ra tới tận bến sông. Lúc dư âm tắt, bạn nghe thêm một tiếng rất xa, như có ai đó đếm theo.', 'The toll spreads all the way to the river landing. As it fades, you hear one more, very far away, as if someone were counting along.');
        },
      },
      {
        label: tr(`Gõ đủ ${c.lifeNo} tiếng, mỗi kiếp một tiếng`, `Strike it ${c.lifeNo} times, once for each life`),
        hint: tr('ngộ tính +, tu vi +', 'Insight +, cultivation +'),
        lean: 'trung',
        run: (ch, ctx) => {
          stat(ch, 'ngoTinh', 6);
          const g = Math.round(addCult(ch, reward(ch, 0.4)));
          ctx.fx('layer', tr('Đếm chuông', 'Counting tolls'));
          ctSet(ch, 'ct20261120_1', 2);
          return tr(`Lão đếm theo bằng mấy ngón tay run run. Tới tiếng cuối, lão thở ra: "Hóa ra có người còn đếm nhiều hơn ta." (+${g} tu vi)`, `He counts along on trembling fingers. At the last toll he breathes out: "So someone has counted even more than I have." (+${g} cultivation)`);
        },
      },
      {
        label: tr('Không gõ, ngồi nắm tay lão tới sáng', 'Leave the bell, hold his hand till dawn'),
        hint: tr('tâm cảnh ++', 'Mind ++'),
        lean: 'chinh',
        run: (ch) => {
          stat(ch, 'tamCanh', 10);
          ctSet(ch, 'ct20261120_1', 2);
          return tr('Lão đi rất êm, không ai gõ gì cả. Sáng ra, quả chuông chưa ai chạm vào tự ngân một tiếng khẽ.', 'He goes quietly, and no one strikes anything. In the morning, the untouched bell hums once on its own.');
        },
      },
      {
        label: tr('Bán quả chuông cho chùa trên núi', 'Sell the bell to the mountain temple'),
        hint: tr('+linh thạch, nghiêng tà', '+spirit stones, leans Evil'),
        lean: 'ta',
        run: (ch, ctx) => {
          const m = 80 + 40 * Math.min(ch.realm, 6);
          money(ch, m);
          dao(ch, -4);
          ctx.fx('coin', `+${m}`);
          ctSet(ch, 'ct20261120_1', 2);
          return tr(`Sư trụ trì trả ${m} linh thạch. Lão Đồng không kịp nghe quả chuông cuối đời mình kêu thế nào.`, `The abbot pays ${m} spirit stones. Old Dong never gets to hear how his last bell sounds.`);
        },
      },
    ],
  },

  // ct_20261120_2 Đan có vân chữ (2 bước). Nối Thiên thư quyển I, mảnh III "Viên đan có vân": chỉ hiện cho người đã mở mảnh ấy.
  {
    id: 'ct_20261120_2',
    minRealm: 3,
    maxRealm: 7,
    once: true,
    weight: 8,
    when: (c) => hasLore(c, 'kim_dan') && !ctArc(c, 'ct20261120_2'),
    title: tr('Đan có vân chữ', 'Pills with writing'),
    text: () =>
      tr(
        'Ở phường thị, gã tán tu Lạc Tam rao bán "Vân Văn Đan", mỗi viên ba trăm linh thạch. Gã thề trên vỏ đan có chữ do một vị đại năng để lại, ai đọc được thì tu vi tăng vọt. Bạn nhìn viên đan, và Kim Đan trong người bạn khẽ nóng lên.',
        'At the market, a rogue cultivator named Lac Tam is selling "Veined Script Pills" at three hundred spirit stones each. He swears the shells bear writing left by a great power, and whoever reads it will soar in cultivation. You look at a pill, and the Golden Core inside you grows faintly warm.',
      ),
    choices: (c) => [
      {
        label: tr('Nhìn vào trong, so với vân trên Kim Đan của mình', 'Look inward and compare it with the veins on your own core'),
        hint: tr('ngộ tính +', 'Insight +'),
        lean: 'trung',
        run: (ch) => {
          stat(ch, 'ngoTinh', 4);
          ctSet(ch, 'ct20261120_2', 1, 'so');
          return tr('Vân trên đan là vết kim khắc, nét nào cũng giống vân trên Kim Đan của bạn, chỉ khắc vụng hơn. Kẻ khắc thứ này phải từng thấy chữ thật.', 'The veins on the pill are needle scratches, and every stroke matches the veins on your Golden Core, only clumsier. Whoever carved this must have seen the real writing.');
        },
      },
      {
        label: tr('Vạch mặt gã trước đám đông', 'Expose him in front of the crowd'),
        hint: tr('đạo tâm +', 'Dao Heart +'),
        lean: 'chinh',
        run: (ch) => {
          dao(ch, 4);
          stat(ch, 'khiVan', 2);
          ctSet(ch, 'ct20261120_2', 1, 'vach');
          return tr('Bạn bóp vỡ một viên, bên trong chỉ là bột gạo. Lạc Tam ôm sạp bỏ chạy, làm rơi lại một tờ giấy vẽ kín vân chữ.', 'You crush one pill and find only rice flour inside. Lac Tam grabs his stall and runs, dropping a sheet of paper covered in veined script.');
        },
      },
      {
        label: tr('Lặng lẽ mua một viên rồi theo gã về', 'Quietly buy one and follow him home'),
        hint: c.linhThach < 150 ? tr('cần 150 linh thạch', 'needs 150 spirit stones') : tr('-150 linh thạch (đã trả giá)', '-150 spirit stones (after haggling)'),
        lean: 'trung',
        off: c.linhThach < 150,
        run: (ch) => {
          money(ch, -150);
          ctSet(ch, 'ct20261120_2', 1, 'theo');
          return tr('Bạn trả giá còn một nửa, cầm viên đan rồi đi cách gã ba con phố. Gã rẽ vào một căn nhà dột ở cuối ngõ.', 'You haggle him down to half, take the pill and follow three streets behind. He turns into a leaky house at the end of an alley.');
        },
      },
      {
        label: tr('Đòi chia lời để giữ im lặng', 'Demand a cut to keep quiet'),
        hint: tr('+linh thạch, nghiêng tà', '+spirit stones, leans Evil'),
        lean: 'ta',
        run: (ch, ctx) => {
          money(ch, 80);
          dao(ch, -6);
          ctx.fx('coin', '+80');
          ctSet(ch, 'ct20261120_2', 9);
          return tr('Gã nghiến răng đưa bạn tám mươi linh thạch. Bạn không bao giờ hỏi gã lấy mẫu vân ở đâu.', 'He grinds his teeth and hands you eighty spirit stones. You never ask where he got the pattern.');
        },
      },
    ],
  },
  {
    id: 'ct_20261120_2b',
    once: true,
    weight: 60,
    when: (c) => ctNext(c, 'ct20261120_2', 1, 2),
    title: tr('Đứa em vẽ vân', 'The brother who draws'),
    text: () =>
      tr(
        'Bạn tìm tới nhà Lạc Tam. Người vẽ mẫu vân là em trai gã, một thằng bé ốm yếu không biết chữ. Nó bảo đêm nào cũng mơ thấy dòng vân ấy nên vẽ lại, rồi hỏi bạn: "Chú đọc được không? Nó viết gì vậy?"',
        'You track down Lac Tam\'s home. The one drawing the patterns is his younger brother, a sickly boy who cannot read. He says he dreams of that line every night and copies it, then asks you: "Can you read it? What does it say?"',
      ),
    choices: (c) => [
      {
        label: tr('Đọc cho nó nghe', 'Read it to him'),
        hint: tr('tâm cảnh +', 'Mind +'),
        lean: 'chinh',
        run: (ch) => {
          stat(ch, 'tamCanh', 6);
          ctSet(ch, 'ct20261120_2', 2);
          return tr('"Ta đã chia mình làm vạn mảnh." Thằng bé im một lúc rồi hỏi nhỏ: "Vậy con có phải một mảnh không?" Bạn không biết trả lời sao.', '"I have split myself into ten thousand pieces." The boy is quiet for a while, then asks softly: "So am I one of the pieces?" You don\'t know how to answer.');
        },
      },
      {
        label: tr('Nhường viên Trúc Cơ Đan của mình cho nó chữa bệnh', 'Give him your Foundation Pill to heal him'),
        hint: (c.pills.truc_co ?? 0) > 0 ? tr('mất 1 Trúc Cơ Đan, khí vận +', 'lose 1 Foundation Pill, Luck +') : tr('không có đan thì bù 100 linh thạch, khí vận +', 'no pill: pay 100 spirit stones instead, Luck +'),
        lean: 'chinh',
        run: (ch) => {
          if ((ch.pills.truc_co ?? 0) > 0) ch.pills.truc_co -= 1;
          else money(ch, -100);
          dao(ch, 8);
          stat(ch, 'khiVan', 6);
          ctSet(ch, 'ct20261120_2', 2);
          return tr('Thằng bé hồng hào trở lại sau một mùa. Lạc Tam dẹp sạp, đi làm thuê ở bến. Tết nào hai anh em cũng gửi cho bạn một gói chè.', 'The boy\'s color comes back within a season. Lac Tam packs up his stall and finds work at the docks. Every New Year, the two brothers send you a packet of tea.');
        },
      },
      {
        label: tr('Dặn nó đừng vẽ dòng ấy cho ai nữa', 'Tell him never to draw that line for anyone again'),
        hint: tr('tâm ma -', 'Heart Demon -'),
        lean: 'trung',
        run: (ch) => {
          stat(ch, 'tamMa', -6);
          ctSet(ch, 'ct20261120_2', 2);
          return tr('Nó gật đầu, xé hết bản vẽ bỏ vào bếp. Lúc giấy cháy, Kim Đan trong người bạn thôi nóng.', 'He nods and feeds every drawing to the stove. As the paper burns, the Golden Core inside you cools.');
        },
      },
      {
        label: tr('Mua hết bản vẽ đem bán lại', 'Buy all the drawings to resell'),
        hint: tr('+linh thạch, nghiêng tà', '+spirit stones, leans Evil'),
        lean: 'ta',
        run: (ch, ctx) => {
          money(ch, 150);
          dao(ch, -8);
          ctx.fx('coin', '+150');
          ctSet(ch, 'ct20261120_2', 2);
          return tr('Bạn bán cho mấy tông môn hiếu kỳ, lời một trăm năm mươi linh thạch. Không ai trong số họ đọc được chữ.', 'You sell them to a few curious sects for a hundred and fifty spirit stones profit. None of them can read the writing.');
        },
      },
    ],
  },
  // ct_20261120_7 Hồ ly gửi con (3 bước). Ưu tiên kiếp 2-10.
  {
    id: 'ct_20261120_7',
    minAge: 10,
    maxAge: 80,
    maxRealm: 4,
    once: true,
    weight: 8,
    when: (c) => c.lifeNo >= 2 && c.lifeNo <= 10 && !ctArc(c, 'ct20261120_7'),
    title: tr('Hồ ly gửi con', 'The fox\'s cub'),
    text: () =>
      tr(
        'Đêm mưa, một con hồ ly cái máu me đầy mình cào cửa nhà bạn. Nó nhả xuống một con hồ ly con còn nhắm mắt, nói tiếng người đứt quãng: "Thợ săn đang tìm mẹ con ta. Giữ nó ba năm, ta sẽ quay lại."',
        'On a rainy night, a vixen covered in blood scratches at your door. She sets down a cub whose eyes are still closed and speaks in broken human words: "Hunters are after us. Keep him three years. I will come back."',
      ),
    choices: () => [
      {
        label: tr('Nhận giữ, giấu trong buồng', 'Take him in and hide him in your room'),
        hint: tr('đạo tâm +, bắt đầu một chuyện dài', 'Dao Heart +, the start of a long story'),
        lean: 'chinh',
        run: (c) => {
          dao(c, 3);
          ctSet(c, 'ct20261120_7', 1, 'giu');
          return tr('Hồ ly mẹ liếm con một lần rồi lao vào màn mưa. Đêm đó bạn ngủ ngồi, tay đặt lên cái giỏ.', 'The vixen licks her cub once, then dashes into the rain. That night you sleep sitting up, one hand on the basket.');
        },
      },
      {
        label: tr('Giao kèo: giữ được, nhưng ngươi nợ ta một lời hứa', 'Strike a deal: I\'ll keep him, but you owe me a promise'),
        hint: tr('giao kèo với yêu', 'a pact with a yao'),
        lean: 'trung',
        run: (c) => {
          ctSet(c, 'ct20261120_7', 1, 'hua');
          return tr('Hồ ly mẹ nhìn bạn, rồi gật đầu: "Yêu không thất hứa." Nó đi rồi, bạn mới thấy tay mình run.', 'The vixen looks at you, then nods: "Yao do not break promises." Only after she is gone do you notice your hands shaking.');
        },
      },
      {
        label: tr('Ôm hồ ly con đi nộp cho thợ săn', 'Carry the cub to the hunters'),
        hint: tr('+linh thạch, nghiêng tà', '+spirit stones, leans Evil'),
        lean: 'ta',
        run: (c, ctx) => {
          money(c, 50);
          dao(c, -8);
          ctx.fx('coin', '+50');
          ctSet(c, 'ct20261120_7', 9);
          return tr('Thợ săn trả năm mươi linh thạch. Suốt mùa mưa năm ấy, đêm nào cũng có tiếng cào rất khẽ ngoài cửa.', 'The hunters pay fifty spirit stones. All that rainy season, every night, there is a very soft scratching at your door.');
        },
      },
      {
        label: tr('Đóng cửa, không dính vào', 'Shut the door and stay out of it'),
        lean: 'trung',
        run: (c) => {
          stat(c, 'tamMa', 2);
          ctSet(c, 'ct20261120_7', 9);
          return tr('Bạn cài then cửa. Sáng ra trước hiên chỉ còn vệt máu bị mưa rửa nhạt.', 'You bolt the door. In the morning only a rain-washed streak of blood is left on the porch.');
        },
      },
    ],
  },
  {
    id: 'ct_20261120_7b',
    once: true,
    weight: 60,
    when: (c) => ctNext(c, 'ct20261120_7', 1, 1),
    title: tr('Chó săn trước cửa buồng', 'A hound at your door'),
    text: () =>
      tr(
        'Thợ săn họ Triệu dắt chó đi lục từng nhà trong làng. Con chó dừng ngay trước cửa buồng bạn, sủa không ngớt. Trong buồng, hồ ly con im thin thít.',
        'The hunter Trieu leads his hound from house to house through the village. The dog stops right at your door and will not stop barking. Inside, the cub is dead silent.',
      ),
    choices: (c) => [
      {
        label: tr('Giấu nó dưới chum gạo, mời thợ săn vào khám', 'Hide him under the rice jar and invite the hunter in'),
        hint: tr('may rủi, lộ thì mất tiền', 'chancy; if found, it costs you'),
        lean: 'trung',
        run: (ch, ctx) => {
          ctSet(ch, 'ct20261120_7', 2);
          if (ctx.rnd() < luck(ch, 0.65)) {
            stat(ch, 'tamCanh', 4);
            return tr('Thợ săn lật tung buồng, gõ cả vào chum gạo, rồi chửi con chó ngu. Hồ ly con không động đậy suốt một canh giờ.', 'The hunter turns the room upside down, even raps on the rice jar, then curses his dog for a fool. The cub does not stir for a full hour.');
          }
          money(ch, -60);
          return tr('Con chó húc đổ chum gạo. Bạn phải dúi sáu mươi linh thạch vào tay thợ săn, hắn mới giả như không thấy gì.', 'The hound knocks over the rice jar. You have to press sixty spirit stones into the hunter\'s hand before he pretends he saw nothing.');
        },
      },
      {
        label: tr('Đứng chắn cửa, im lặng nhìn thẳng mặt hắn', 'Block the door and stare him down in silence'),
        hint: c.realm >= 1 ? tr('linh áp người tu đạo', 'a cultivator\'s presence') : tr('phàm nhân: có thể bị xô ngã', 'mortal: you may get shoved'),
        lean: 'chinh',
        run: (ch, ctx) => {
          ctSet(ch, 'ct20261120_7', 2);
          if (ch.realm >= 1) return tr('Linh áp của người tu đạo đè xuống, con chó cụp đuôi trước. Thợ săn lùi một bước, rồi kéo chó đi.', 'A cultivator\'s pressure settles over them and the hound tucks its tail first. The hunter steps back, then drags the dog away.');
          return tr('Thợ săn xô bạn ngã vào khung cửa, nhưng thấy cả xóm kéo ra xem thì đành bỏ đi.', 'The hunter shoves you into the doorframe, but with the whole street watching he gives up and leaves.') + hurt(ch, 10, ctx);
        },
      },
      {
        label: tr('Dúi tiền cho hắn sang nhà khác', 'Slip him money to try elsewhere'),
        hint: c.linhThach < 40 ? tr('cần 40 linh thạch', 'needs 40 spirit stones') : tr('-40 linh thạch', '-40 spirit stones'),
        lean: 'trung',
        off: c.linhThach < 40,
        run: (ch) => {
          money(ch, -40);
          ctSet(ch, 'ct20261120_7', 2);
          return tr('Thợ săn đút tiền vào áo, huýt chó sang nhà bên. Hắn đi rồi, bạn mới dám thở.', 'The hunter tucks the money away and whistles his dog next door. Only after he is gone do you dare breathe.');
        },
      },
      {
        label: tr('Thôi, giao nó ra', 'Give the cub up'),
        hint: tr('+linh thạch, nghiêng tà', '+spirit stones, leans Evil'),
        lean: 'ta',
        run: (ch, ctx) => {
          money(ch, 50);
          dao(ch, -8);
          ctx.fx('coin', '+50');
          ctSet(ch, 'ct20261120_7', 9);
          return tr('Bạn đưa cái giỏ ra. Hồ ly con mở mắt lần đầu tiên, đúng lúc nhìn thấy bạn.', 'You hand over the basket. The cub opens its eyes for the first time, just in time to see you.');
        },
      },
    ],
  },
  {
    id: 'ct_20261120_7c',
    once: true,
    weight: 60,
    when: (c) => ctNext(c, 'ct20261120_7', 2, 2),
    title: tr('Ba năm đúng hẹn', 'Three years, as promised'),
    text: (c) =>
      tr(
        `Ba năm đúng hẹn, hồ ly mẹ quay lại, vết thương đã thành sẹo. Hồ ly con giờ chạy theo bạn khắp nhà, nghe tiếng mẹ thì đứng sững.${ctArc(c, 'ct20261120_7')?.v === 'hua' ? ' Hồ ly mẹ cúi đầu: "Ta nợ ngươi một lời hứa. Ngươi muốn gì?"' : ''}`,
        `Three years to the day, the vixen returns, her wounds now scars. The cub follows you all over the house these days, and freezes at the sound of his mother.${ctArc(c, 'ct20261120_7')?.v === 'hua' ? ' The vixen bows her head: "I owe you a promise. What do you want?"' : ''}`,
      ),
    choices: (c) => [
      {
        label: tr('Trả con cho mẹ, không đòi gì', 'Return the cub and ask for nothing'),
        hint: tr('đạo tâm +, khí vận ++', 'Dao Heart +, Luck ++'),
        lean: 'chinh',
        run: (ch) => {
          dao(ch, 6);
          stat(ch, 'khiVan', 8);
          ctSet(ch, 'ct20261120_7', 3);
          return tr('Hai mẹ con đi tới bìa rừng thì hồ ly con quay lại nhìn bạn ba lần. Từ đó, năm nào trước cửa cũng có một bó nấm rừng.', 'At the edge of the forest the cub turns back to look at you three times. Every year after that, a bundle of wild mushrooms appears at your door.');
        },
      },
      ctArc(c, 'ct20261120_7')?.v === 'hua'
        ? {
            label: tr('Đòi lời hứa: truyền cho ta một hơi yêu khí', 'Claim the promise: breathe a little yao qi into me'),
            hint: tr('tu vi +', 'cultivation +'),
            lean: 'trung' as const,
            run: (ch: Character, ctx: EffectCtx) => {
              const g = Math.round(addCult(ch, reward(ch, 0.8)));
              ctx.fx('layer', tr('Yêu khí', 'Yao qi'));
              ctSet(ch, 'ct20261120_7', 3);
              return tr(`Hồ ly mẹ thổi vào trán bạn một hơi ấm. Kinh mạch như có suối chảy qua (+${g} tu vi). "Hết nợ," nó nói, và đi.`, `The vixen breathes warmth onto your brow. Your meridians feel like a stream runs through them (+${g} cultivation). "Debt paid," she says, and leaves.`);
            },
          }
        : {
            label: tr('Xin nó dạy một câu tiếng yêu', 'Ask her to teach you one word of yao speech'),
            hint: tr('ngộ tính +', 'Insight +'),
            lean: 'trung' as const,
            run: (ch: Character) => {
              stat(ch, 'ngoTinh', 6);
              ctSet(ch, 'ct20261120_7', 3);
              return tr('Nó dạy bạn câu "cảm ơn" của loài hồ. Nghe như tiếng gió lùa qua khe cửa.', 'She teaches you the fox word for "thank you". It sounds like wind slipping through a crack in the door.');
            },
          },
      {
        label: tr('Khuyên hai mẹ con đi thật xa khỏi vùng này', 'Urge them both to go far from these parts'),
        hint: tr('tâm cảnh +, khí vận +', 'Mind +, Luck +'),
        lean: 'chinh',
        run: (ch) => {
          stat(ch, 'tamCanh', 5);
          stat(ch, 'khiVan', 3);
          ctSet(ch, 'ct20261120_7', 3);
          return tr('Hồ ly mẹ nghe lời. Mùa sau thợ săn họ Triệu lùng khắp núi cũng không thấy một sợi lông hồ nào.', 'The vixen listens. Next season the hunter Trieu combs the whole mountain and finds not a single fox hair.');
        },
      },
      {
        label: tr('Xin giữ hồ ly con ở lại', 'Ask to keep the cub'),
        hint: tr('tâm cảnh -', 'Mind -'),
        lean: 'trung',
        run: (ch) => {
          stat(ch, 'tamCanh', -3);
          ctSet(ch, 'ct20261120_7', 3);
          return tr('Hồ ly mẹ không giận, chỉ để hồ ly con tự chọn. Nó đứng giữa hai bên rất lâu, rồi chạy theo mẹ.', 'The vixen is not angry; she lets the cub choose. He stands between you for a long time, then runs after his mother.');
        },
      },
    ],
  },

  // ct_20261120_10 Huynh đệ kết nghĩa sa ngã (2 bước, một nhánh chết ở bước 2: chỉ khi đi một mình đòi nợ máu, sau khi hắn đã giết người và hẹn "một mình thôi").
  {
    id: 'ct_20261120_10',
    minAge: 18,
    maxAge: 150,
    minRealm: 1,
    maxRealm: 5,
    once: true,
    weight: 6,
    when: (c) => !ctArc(c, 'ct20261120_10'),
    title: tr('Huynh đệ về làng', 'Your sworn brother comes home'),
    text: () =>
      tr(
        'Lục Phong, người cùng bạn kết nghĩa từ năm mười tuổi, về làng với đôi mắt đỏ và một cái túi bốc mùi tanh. Hắn cười: "Ta tìm được đường tắt. Ma công này luyện một năm bằng người khác mười năm. Đệ có muốn không?"',
        'Luc Phong, your sworn brother since you were ten, comes back to the village with red eyes and a bag that reeks of blood. He grins: "I found a shortcut. One year of this demonic art is worth ten of anyone else\'s. Want it?"',
      ),
    choices: () => [
      {
        label: tr('Khuyên hắn bỏ ma công', 'Urge him to give up the art'),
        hint: tr('đạo tâm +', 'Dao Heart +'),
        lean: 'chinh',
        run: (c) => {
          dao(c, 4);
          ctSet(c, 'ct20261120_10', 1, 'khuyen');
          return tr('Hắn nghe hết, gật đầu, rồi vẫn đi. Trước khi đi hắn để lại bình rượu hai người chôn dưới gốc đa năm mười tuổi.', 'He hears you out, nods, and leaves anyway. Before going he leaves behind the jar of wine you two buried under the banyan when you were ten.');
        },
      },
      {
        label: tr('Học thử một chiêu', 'Try one move'),
        hint: tr('tu vi +, tâm ma +, nghiêng tà', 'cultivation +, Heart Demon +, leans Evil'),
        lean: 'ta',
        run: (c, ctx) => {
          const g = Math.round(addCult(c, reward(c, 0.6)));
          dao(c, -8);
          stat(c, 'tamMa', 6);
          ctx.fx('evil', tr('Ma công', 'Demonic art'));
          ctSet(c, 'ct20261120_10', 1, 'hoc');
          return tr(`Chân khí chạy nhanh như lửa bén rơm (+${g} tu vi). Đêm đó bạn mơ thấy một đứa trẻ khóc mà không biết vì sao.`, `Your qi races like fire through straw (+${g} cultivation). That night you dream of a child crying and don't know why.`);
        },
      },
      {
        label: tr('Im lặng uống rượu với hắn, không hỏi gì', 'Drink with him in silence and ask nothing'),
        hint: tr('tâm cảnh +', 'Mind +'),
        lean: 'trung',
        run: (c) => {
          stat(c, 'tamCanh', 3);
          ctSet(c, 'ct20261120_10', 1, 'im');
          return tr('Hai người uống tới khuya, nói chuyện bắt cá, chăn trâu. Lúc say, hắn khóc một lần rồi thôi.', 'You drink until late, talking about fishing and herding buffalo. Once drunk, he cries one time, then stops.');
        },
      },
      {
        label: tr('Báo cho tông môn chính phái gần nhất', 'Report him to the nearest righteous sect'),
        hint: tr('đạo tâm ++', 'Dao Heart ++'),
        lean: 'chinh',
        run: (c) => {
          dao(c, 6);
          ctSet(c, 'ct20261120_10', 1, 'bao');
          return tr('Tông môn cử người đi bắt, nhưng hắn đã trốn trước một đêm. Trên tường nhà bạn có một vết cào sâu.', 'The sect sends people to arrest him, but he slipped away the night before. On your wall there is one deep claw mark.');
        },
      },
    ],
  },
  {
    id: 'ct_20261120_10b',
    once: true,
    weight: 60,
    when: (c) => ctNext(c, 'ct20261120_10', 1, 4) && !c.cosmos,
    title: tr('Hẹn ở miếu hoang', 'A meeting at the ruined shrine'),
    text: (c) =>
      tr(
        `Bốn năm sau, làng bên mất ba đứa trẻ. Ai cũng biết là Lục Phong, giờ ma công của hắn đã thành. ${ctArc(c, 'ct20261120_10')?.v === 'bao' ? 'Hắn nhắn bạn: "Đệ bán ta một lần rồi. Tới miếu hoang, một mình thôi."' : 'Hắn nhắn bạn tới miếu hoang đầu núi: "Một mình thôi."'}`,
        `Four years later, three children vanish from the next village. Everyone knows it was Luc Phong, whose demonic art is now complete. ${ctArc(c, 'ct20261120_10')?.v === 'bao' ? 'He sends word: "You sold me out once. Come to the ruined shrine. Alone."' : 'He sends word to meet at the ruined shrine on the hill: "Alone."'}`,
      ),
    choices: (c) => [
      {
        label: tr('Đi một mình, mang theo bình rượu cũ', 'Go alone and bring the old wine'),
        hint: tr('may rủi: khuyên được hay không', 'chancy: can you reach him?'),
        lean: 'chinh',
        run: (ch, ctx) => {
          ctSet(ch, 'ct20261120_10', 2, 'ruou');
          const v = ctArc(c, 'ct20261120_10')?.v;
          if (v !== 'bao' && ctx.rnd() < luck(ch, 0.55)) {
            dao(ch, 8);
            stat(ch, 'tamCanh', 6);
            return tr('Hắn uống một ngụm, rồi tự phế ma công trước mặt bạn. Ba đứa trẻ được thả về lúc trời sáng, còn hắn đi tu ở một ngôi chùa không tên.', 'He takes one sip, then cripples his own demonic art in front of you. The three children are sent home at dawn, and he goes off to a nameless temple.');
          }
          stat(ch, 'tamMa', 5);
          return tr('Hắn đập vỡ bình rượu, bỏ đi vào màn đêm. Sáng ra người ta tìm thấy ba đứa trẻ ngủ trong miếu, còn hắn thì biệt tích.', 'He smashes the jar and walks off into the night. At dawn the three children are found asleep in the shrine, and he is gone without a trace.');
        },
      },
      {
        label: tr('Dẫn người chính phái theo vây miếu', 'Bring righteous cultivators to surround the shrine'),
        hint: tr('+linh thạch, tâm ma +', '+spirit stones, Heart Demon +'),
        lean: 'trung',
        run: (ch, ctx) => {
          money(ch, 100);
          stat(ch, 'tamMa', 4);
          ctx.fx('coin', '+100');
          ctSet(ch, 'ct20261120_10', 2, 'vay');
          return tr('Lục Phong bị bắt sống. Lúc bị giải đi, hắn chỉ nhìn bạn, không chửi câu nào. Ba đứa trẻ về nhà an toàn.', 'Luc Phong is taken alive. As they lead him away he only looks at you, without a single curse. The three children go home safe.');
        },
      },
      {
        label: tr('Đi một mình, rút kiếm đòi nợ cho ba đứa trẻ', 'Go alone and draw your sword for the children'),
        hint: tr('ma công đã thành, có thể chết', 'his art is complete, you may die'),
        lean: 'chinh',
        run: (ch, ctx) => {
          ctSet(ch, 'ct20261120_10', 2, 'danh');
          if (ctx.rnd() < luck(ch, 0.5 + Math.min(0.2, ch.realm * 0.04))) {
            dao(ch, 6);
            const g = Math.round(addCult(ch, reward(ch, 0.8)));
            ctx.fx('breakthrough', tr('Trảm ma', 'Demon slain'));
            return tr(`Ba trăm chiêu, kiếm bạn xuyên qua ngực hắn. Hắn cười: "Đệ lớn rồi." Bạn chôn hắn dưới gốc đa, cạnh chỗ chôn bình rượu năm xưa (+${g} tu vi).`, `Three hundred exchanges, and your sword runs him through. He smiles: "You've grown up." You bury him under the banyan, beside where the wine jar was buried long ago (+${g} cultivation).`);
          }
          const f = fatal(ch, ctx, 0.4, tr('Bạn đi một mình tới miếu hoang đòi nợ cho ba đứa trẻ. Ma công của Lục Phong đã thành, người huynh đệ kết nghĩa bẻ gãy kiếm và tim bạn cùng một lúc.', 'You went alone to the ruined shrine to settle the children\'s debt. Luc Phong\'s demonic art was complete, and your sworn brother broke your sword and your heart in the same moment.'));
          if (ch.dead) return tr('Kiếm vừa chạm ma khí đã gãy làm đôi...', 'Your sword snaps the moment it meets his demonic qi...') + (f ?? '');
          return tr('Bạn thua, gãy kiếm, nhưng hắn không giết. Hắn để ba đứa trẻ lại bên bạn rồi bỏ đi.', 'You lose and your sword breaks, but he does not kill you. He leaves the three children beside you and walks away.') + (f ?? '') + hurt(ch, 25, ctx);
        },
      },
      {
        label: tr('Không đến, cắt đứt nghĩa huynh đệ', 'Stay home and cut the bond'),
        hint: tr('tâm ma +', 'Heart Demon +'),
        lean: 'trung',
        run: (ch) => {
          stat(ch, 'tamMa', 3);
          ctSet(ch, 'ct20261120_10', 9);
          return tr('Bạn đốt tờ giấy kết nghĩa. Ba ngày sau, ba đứa trẻ tự tìm về làng, không nhớ gì cả.', 'You burn the brotherhood pact. Three days later the three children find their own way home, remembering nothing.');
        },
      },
    ],
  },
];
