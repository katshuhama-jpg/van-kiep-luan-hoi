import { ITEMS, REALMS } from './data';
import { joinSect } from './sect';
import { hasGift } from './gacha';
import { addCult, addLife, addPill, dao, fatal, giveItem, hurt, luck, money, reward, stat } from './helpers';
import type { Character, Choice, EffectCtx, GameEvent, Grave } from './types';
import { tr } from '../i18n';

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
        hint: tr('nguy hiểm', "dangerous"),
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
            stat(ch, 'tamMa', 12);
            return tr(`Oán hồn của ${g.char} hiện ra. Bạn bỏ chạy, mất mấy năm không dám ngủ tối.`, `The vengeful ghost of ${g.char} appears. You flee, and for years you don't dare sleep at night.`) + (f ?? '');
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
            money(ch, 300);
            return tr('Bạn móc được ít linh thạch rồi lặn mất. Người cố ý tha cho bạn chăng?', "You fish out a few spirit stones and slip away. Did they let you go on purpose?") + (f ?? '');
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
          c.qf = { ...(c.qf ?? {}), deTu: (c.qf?.deTu ?? 0) + 1 };
          return tr('Bạn khoác áo cho nó. Nó lạy chín lạy, trán chảy máu.', "You wrap your coat around the child. They kowtow nine times until their forehead bleeds.");
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
          return tr('"Đinh! Trói định thành công. Tặng ký chủ gói quà tân thủ: 100 linh thạch, 3 Tụ Khí Đan."', "\"Ding! Binding successful. Gifting host a newbie pack: 100 spirit stones, 3 Qi Gathering Pills.\"");
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
          return tr(`"Đinh! Ký chủ nạp ${pay} linh thạch. Tặng danh hiệu: Đại Gia Tu Tiên." Không hiểu sao bạn thấy mình bị lừa.`, `"Ding! Host has topped up ${pay} spirit stones. Title granted: Cultivation Big Spender." For some reason you feel scammed.`);
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
        hint: '???',
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
];
